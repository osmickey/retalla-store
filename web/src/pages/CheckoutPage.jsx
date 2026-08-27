import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import { auth, useAuth } from '../lib/auth';
import { addresses } from '../lib/addresses';
import { cart, showToast } from '../lib/cart';
import Icon from '../icons/Icon';
import ErrorState from '../components/ErrorState';
import { AddressGridSkeleton } from '../components/Skeleton';
import AddressForm from '../components/AddressForm';
import PhoneVerifyCard from '../components/PhoneVerifyCard';

function last10(raw) {
  return String(raw || '').replace(/\D/g, '').slice(-10);
}

const EMPTY_NEW_ADDRESS = { fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

const PAYMENT_OPTIONS = [
  { key: 'COD', label: 'Cash on Delivery', icon: 'wallet' },
  { key: 'UPI', label: 'UPI', icon: 'tag' },
  { key: 'Card', label: 'Credit / Debit Card', icon: 'receipt' },
];

export default function CheckoutPage() {
  useDocumentTitle('Checkout — Retalla');
  const user = useAuth();
  useEffect(() => { if (!user) auth.requireLogin('/checkout.html'); }, [user]);

  // One-time cart snapshot -- matches vanilla exactly (computed once on
  // load via renderCheckoutSummary(), never re-read reactively afterward).
  const [items] = useState(() => cart.getItems());
  useEffect(() => {
    if (user && items.length === 0) window.location.href = '/cart.html';
  }, [user, items]);

  const [savedAddresses, setSavedAddresses] = useState(null);
  const [addressesError, setAddressesError] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null); // _id | 'new' | null
  const [newAddressForm, setNewAddressForm] = useState(() => ({
    ...EMPTY_NEW_ADDRESS,
    phone: user?.phoneVerified && user.phone ? last10(user.phone) : '',
  }));

  function loadAddresses() {
    setAddressesError(null);
    setSavedAddresses(null);
    addresses.list()
      .then((list) => {
        setSavedAddresses(list);
        setSelectedAddressId(list.length > 0 ? list[0]._id : 'new'); // server sorts default-first
      })
      .catch((err) => setAddressesError(err.message));
  }
  // Depend on user?._id, NOT the user object -- useAuth() hands back a new
  // object on every retalla:auth-changed event (e.g. the phone-verify
  // success below fires one), which would otherwise re-fetch and silently
  // reset an in-progress address selection right as the user finishes
  // verifying their phone.
  useEffect(() => { if (user) loadAddresses(); }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [verifiedPhone, setVerifiedPhone] = useState(() => {
    const u = auth.getUser();
    return u?.phoneVerified && u.phone ? last10(u.phone) : null;
  });
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const codBlocked = items.some((i) => i.codAvailable === false);
  const [selectedPayment, setSelectedPayment] = useState(() => {
    const preferred = user?.preferredPaymentMethod || 'COD';
    return preferred === 'COD' && codBlocked ? 'UPI' : preferred;
  });

  if (!user) return null; // requireLogin() redirect in flight
  if (items.length === 0) return null; // /cart.html redirect in flight

  const usingNewAddress = selectedAddressId === 'new';
  const selectedSavedAddress = savedAddresses?.find((a) => a._id === selectedAddressId) || null;
  const activeAddress = usingNewAddress ? newAddressForm : selectedSavedAddress;
  const candidatePhone = (activeAddress?.phone || '').replace(/\D/g, '').slice(0, 10);

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const savings = items.reduce((s, i) => s + i.qty * Math.max(0, (i.mrp || i.price) - i.price), 0);
  const shipping = cart.computeShipping();
  const total = subtotal + shipping;

  const phoneValid = /^[6-9][0-9]{9}$/.test(candidatePhone);
  const addressComplete = usingNewAddress
    ? !!(newAddressForm.fullName.trim() && newAddressForm.addressLine1.trim() && newAddressForm.city.trim() &&
         newAddressForm.state.trim() && /^[0-9]{6}$/.test(newAddressForm.pincode.trim()))
    : !!selectedSavedAddress;
  const canPlaceOrder = addressComplete && phoneValid && candidatePhone === verifiedPhone && !!selectedPayment;
  const hint = !addressComplete
    ? 'Select or complete your shipping address to continue.'
    : !(phoneValid && candidatePhone === verifiedPhone)
    ? 'Verify your mobile number above to place your order.'
    : null;

  const hasPaidDeliveryItem = items.some((i) => i.freeDelivery === false);
  const estDeliveryDate = new Date(Date.now() + (hasPaidDeliveryItem ? 7 : 5) * 86400000)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  function selectPayment(method) {
    if (method === 'COD' && codBlocked) return;
    setSelectedPayment(method);
  }

  async function placeOrder(e) {
    e.preventDefault();
    const phone = candidatePhone;
    if (!/^[6-9][0-9]{9}$/.test(phone)) { showToast('Enter a valid 10-digit Indian mobile number.', 'error'); return; }
    if (phone !== verifiedPhone) { showToast('Please verify your mobile number before placing the order.', 'error'); return; }
    const pincode = (activeAddress.pincode || '').trim();
    if (!/^[0-9]{6}$/.test(pincode)) { showToast('Pincode must be exactly 6 digits.', 'error'); return; }

    setSubmitting(true);
    const line1 = (activeAddress.addressLine1 || '').trim();
    const line2 = (activeAddress.addressLine2 || '').trim();
    const shippingAddress = {
      fullName: (activeAddress.fullName || '').trim(),
      phone,
      address: line2 ? `${line1}, ${line2}` : line1,
      city: (activeAddress.city || '').trim(),
      state: (activeAddress.state || '').trim(),
      pincode,
    };

    try {
      const order = await api.post('/orders', {
        items: items.map((i) => ({ product: i.productId, qty: i.qty })),
        shippingAddress,
        paymentMethod: selectedPayment,
      });
      cart.clear();
      window.location.href = `/order-success.html?id=${order._id}`;
    } catch (err) {
      showToast(err.message, 'error');
      setSubmitting(false);
    }
  }

  return (
    <main className="container checkout-page">
      <div className="breadcrumb"><a href="/index.html">Home</a> / <a href="/cart.html">Cart</a> / <span>Checkout</span></div>
      <h1 style={{ marginBottom: 20 }}>Checkout</h1>

      <div className="checkout-contact-row">
        <span className="icon-circle"><Icon name="user" size={16} /></span>
        <div>
          <span className="checkout-contact-label">Contact</span>
          <strong>{user.email}</strong>
        </div>
      </div>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div>
          <div className="checkout-card">
            <h3 style={{ marginBottom: 16 }}>Shipping Address</h3>

            {addressesError ? (
              <ErrorState message={addressesError} onRetry={loadAddresses} />
            ) : savedAddresses === null ? (
              <AddressGridSkeleton count={2} />
            ) : (
              <>
                {savedAddresses.length > 0 && (
                  <div className="address-grid checkout-address-grid">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr._id}
                        role="radio"
                        aria-checked={selectedAddressId === addr._id}
                        tabIndex={0}
                        className={`address-card selectable${selectedAddressId === addr._id ? ' selected' : ''}${addr.isDefault ? ' is-default' : ''}`}
                        onClick={() => setSelectedAddressId(addr._id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedAddressId(addr._id); } }}
                      >
                        {addr.isDefault && <span className="address-card-badge">Default</span>}
                        <h4>{addr.fullName}</h4>
                        <p>
                          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                          {addr.city}, {addr.state} {addr.pincode}<br />
                          +91 {addr.phone}
                        </p>
                      </div>
                    ))}
                    <button type="button" className="address-card-add" onClick={() => setSelectedAddressId('new')}>
                      <Icon name="plus" size={22} />
                      Add new address
                    </button>
                  </div>
                )}

                {usingNewAddress && (
                  <div className={savedAddresses.length > 0 ? 'checkout-new-address' : undefined}>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        className="checkout-back-to-saved"
                        onClick={() => setSelectedAddressId(savedAddresses[0]._id)}
                      >
                        Use a saved address instead
                      </button>
                    )}
                    <AddressForm value={newAddressForm} onChange={setNewAddressForm} idPrefix="checkout-address" />
                  </div>
                )}
              </>
            )}

            <PhoneVerifyCard phone={candidatePhone} onVerifiedChange={setVerifiedPhone} />
          </div>

          <div className="checkout-delivery-note">
            <div className="pd-badge">
              <span className="icon-circle"><Icon name="truck" size={16} /></span>
              <div>
                <strong>Estimated delivery by {estDeliveryDate}</strong>
                <span>{shipping === 0 ? 'FREE shipping on this order' : `Rs. ${shipping.toFixed(2)} delivery charge applies`}</span>
              </div>
            </div>
          </div>

          <div className="checkout-card">
            <h3 style={{ marginBottom: 16 }}>Payment Method</h3>
            <div role="radiogroup" aria-label="Payment method">
              {PAYMENT_OPTIONS.map((opt) => {
                const disabled = opt.key === 'COD' && codBlocked;
                return (
                  <div
                    key={opt.key}
                    role="radio"
                    aria-checked={selectedPayment === opt.key}
                    aria-disabled={disabled || undefined}
                    tabIndex={disabled ? -1 : 0}
                    className={`payment-option${selectedPayment === opt.key ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                    onClick={() => selectPayment(opt.key)}
                    onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectPayment(opt.key); } }}
                  >
                    <div className="payment-option-main">
                      <span className="radio-dot" />
                      <Icon name={opt.icon} size={18} /> {opt.label}
                    </div>
                    {opt.key === 'COD' && disabled && (
                      <div className="payment-note">Not available for one or more items in your cart</div>
                    )}
                    {opt.key === 'UPI' && (
                      <div className="payment-brand-row">
                        <span className="brand-chip gpay">G Pay</span>
                        <span className="brand-chip phonepe">PhonePe</span>
                        <span className="brand-chip paytm">Paytm</span>
                        <span className="brand-chip bhim">BHIM</span>
                      </div>
                    )}
                    {opt.key === 'Card' && (
                      <div className="payment-brand-row">
                        <span className="brand-chip visa">VISA</span>
                        <span className="brand-chip mastercard">Mastercard</span>
                        <span className="brand-chip rupay">RuPay</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="summary-card">
            <h3>Order Summary</h3>
            <div style={{ marginBottom: 12 }}>
              {items.map((item) => (
                <div className="order-item-row" key={item.productId}>
                  <img src={item.image} alt={item.name} />
                  <div style={{ flex: 1 }}>{item.name} × {item.qty}</div>
                  <strong>Rs. {(item.price * item.qty).toFixed(2)}</strong>
                </div>
              ))}
            </div>
            <div className="summary-row"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
            {savings > 0 && <div className="summary-row savings"><span>Discount</span><span>− Rs. {savings.toFixed(2)}</span></div>}
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`}</span></div>
            <div className="summary-row total"><span>Total</span><span>Rs. {total.toFixed(2)}</span></div>
            {hint && <div className="form-message hint">{hint}</div>}
            <button type="submit" className="btn btn-primary btn-block" disabled={!canPlaceOrder || submitting}>
              {submitting ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>

        <MobileSummaryBar
          items={items} subtotal={subtotal} savings={savings} shipping={shipping} total={total} hint={hint}
          expanded={summaryExpanded} onToggleExpand={() => setSummaryExpanded((v) => !v)}
          canPlaceOrder={canPlaceOrder} submitting={submitting}
        />
      </form>
    </main>
  );
}

// Mobile-only (CSS-gated, see style.css): replaces the desktop .summary-card
// below 960px with a fixed bottom bar -- collapsed shows item count + total
// + the Place Order button always reachable; expanding reveals the same
// .summary-row breakdown the desktop card shows. Checkout is excluded from
// TabBar (TabBar.jsx already lists /checkout.html in TABBAR_EXCLUDED_PATHS),
// so there's no fixed bottom tab bar to dock above.
function MobileSummaryBar({ items, subtotal, savings, shipping, total, hint, expanded, onToggleExpand, canPlaceOrder, submitting }) {
  const reduceMotion = useReducedMotion();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const panelMotion = reduceMotion
    ? { style: { height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0, overflow: 'hidden' } }
    : {
        animate: { height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 },
        transition: { duration: 0.22, ease: 'easeOut' },
        style: { overflow: 'hidden' },
      };

  return (
    <div className="checkout-summary-bar">
      <motion.div className="checkout-summary-bar-details" {...panelMotion}>
        <div className="summary-row"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
        {savings > 0 && <div className="summary-row savings"><span>Discount</span><span>− Rs. {savings.toFixed(2)}</span></div>}
        <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`}</span></div>
        {hint && <div className="form-message hint">{hint}</div>}
      </motion.div>
      <div className="checkout-summary-bar-row">
        <button type="button" className="checkout-summary-bar-head" onClick={onToggleExpand} aria-expanded={expanded}>
          <Icon name="chevron-down" size={16} className={expanded ? 'rotated' : undefined} />
          <span>{count} item{count === 1 ? '' : 's'} &middot; Rs. {total.toFixed(2)}</span>
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canPlaceOrder || submitting}>
          {submitting ? 'Placing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
