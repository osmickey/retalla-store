import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import { auth, useAuth } from '../lib/auth';
import { addresses } from '../lib/addresses';
import { wishlist } from '../lib/wishlist';
import { showToast } from '../lib/cart';
import Icon from '../icons/Icon';
import ProductGrid from '../components/ProductGrid';
import Modal from '../components/Modal';
import ErrorState from '../components/ErrorState';
import AddressForm from '../components/AddressForm';
import { ProductGridSkeleton, OrdersListSkeleton, AddressGridSkeleton } from '../components/Skeleton';

const TABS = [
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'orders', label: 'Orders', icon: 'receipt' },
  { key: 'wishlist', label: 'Wishlist', icon: 'heart' },
  { key: 'addresses', label: 'Addresses', icon: 'home' },
  { key: 'payment', label: 'Payment Methods', icon: 'wallet' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

export default function AccountPage() {
  const user = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.key === requestedTab) ? requestedTab : 'profile';

  useDocumentTitle(`${TABS.find((t) => t.key === activeTab)?.label || 'Account'} — My Account — Retalla`);

  useEffect(() => {
    if (!user) auth.requireLogin(window.location.pathname + window.location.search);
  }, [user]);

  if (!user) return null;

  function setActiveTab(key) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next);
  }

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <span>My Account</span>
      </div>

      <div className="account-header">
        <div className="account-avatar">{initials}</div>
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="account-layout">
        <nav className="account-nav" aria-label="Account">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`account-nav-item${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              aria-current={activeTab === t.key ? 'page' : undefined}
            >
              <span className="icon">
                <Icon name={t.icon} size={19} />
              </span>
              {t.label}
            </button>
          ))}
          <button type="button" className="account-nav-item logout" onClick={() => auth.logout()}>
            <span className="icon">
              <Icon name="logout" size={19} />
            </span>
            Logout
          </button>
        </nav>

        <div className="account-panel">
          <motion.div
            key={activeTab}
            initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={reduceMotion ? { opacity: 1 } : undefined}
          >
            {activeTab === 'profile' && <ProfileTab user={user} />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'wishlist' && <WishlistTab />}
            {activeTab === 'addresses' && <AddressesTab />}
            {activeTab === 'payment' && <PaymentTab user={user} />}
            {activeTab === 'settings' && <SettingsTab />}
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function ProfileTab({ user }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const data = await api.put('/users/profile', { name: name.trim(), phone: phone.trim() });
      auth.setSession(data.user, auth.getToken());
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="account-panel-title">Profile</h2>
      {message && (
        <div
          id="profile-form-message"
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`form-message ${message.type}`}
        >
          {message.text}
        </div>
      )}
      <form onSubmit={handleSubmit} className="checkout-card">
        <div className="field">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" value={user.email} disabled />
        </div>
        <div className="field">
          <label htmlFor="profile-name">Full Name</label>
          <input id="profile-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="profile-phone">
            Phone Number{' '}
            {user.phone && (
              <span
                style={{
                  color: user.phoneVerified ? 'var(--success)' : '#b91c1c',
                  fontWeight: 400,
                  fontSize: '0.78rem',
                }}
              >
                ({user.phoneVerified ? 'Verified' : 'Not verified'})
              </span>
            )}
          </label>
          <div className="phone-input-group">
            <span className="phone-prefix">+91</span>
            <input id="profile-phone" pattern="[0-9]{10}" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          aria-describedby={message ? 'profile-form-message' : undefined}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

const PAYMENT_METHODS = [
  { key: 'COD', label: 'Cash on Delivery' },
  { key: 'UPI', label: 'UPI' },
  { key: 'Card', label: 'Card' },
];

function PaymentTab({ user }) {
  const [selected, setSelected] = useState(user.preferredPaymentMethod || 'COD');
  const [saving, setSaving] = useState(false);

  async function choose(next) {
    if (next === selected || saving) return;
    const prev = selected;
    setSelected(next);
    setSaving(true);
    try {
      const data = await api.put('/users/profile', {
        name: user.name,
        phone: user.phone || '',
        preferredPaymentMethod: next,
      });
      auth.setSession(data.user, auth.getToken());
      showToast('Preferred payment method updated');
    } catch (err) {
      showToast(err.message, 'error');
      setSelected(prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="account-panel-title">Payment Methods</h2>
      <div className="checkout-card">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Retalla doesn't store card or bank details. Choose the method you'd like pre-selected at checkout.
        </p>
        <div role="radiogroup" aria-label="Preferred payment method">
          {PAYMENT_METHODS.map((m) => (
            <div
              key={m.key}
              role="radio"
              aria-checked={selected === m.key}
              tabIndex={0}
              className={`payment-option${selected === m.key ? ' selected' : ''}${saving ? ' disabled' : ''}`}
              onClick={() => choose(m.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  choose(m.key);
                }
              }}
            >
              <div className="payment-option-main">
                <span className="radio-dot" />
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="account-panel-title">Settings</h2>
      <div className="checkout-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Change Password</h3>
        {message && (
          <div
            id="settings-form-message"
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`form-message ${message.type}`}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="settings-current-password">Current Password</label>
            <input
              id="settings-current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="settings-new-password">New Password</label>
            <input
              id="settings-new-password"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="settings-confirm-password">Confirm New Password</label>
            <input
              id="settings-confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            aria-describedby={message ? 'settings-form-message' : undefined}
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="checkout-card">
        <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Log Out</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
          Sign out of your Retalla account on this device.
        </p>
        <button type="button" className="btn btn-outline" onClick={() => auth.logout()}>
          Logout
        </button>
      </div>
    </div>
  );
}

function WishlistTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    setError(null);
    wishlist.getProducts().then(setItems).catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    window.addEventListener('retalla:wishlist-changed', load);
    return () => window.removeEventListener('retalla:wishlist-changed', load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="cart-head">
        <h2 className="account-panel-title" style={{ marginBottom: 0 }}>
          Wishlist
        </h2>
        <a href="/wishlist.html" className="btn btn-outline btn-sm">
          View Full Wishlist
        </a>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items === null ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <ProductGrid
          products={items}
          emptyMessage="Your wishlist is empty."
          emptyAction={{ label: 'Discover Products', href: '/shop.html' }}
        />
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    setError(null);
    api.get('/orders/myorders').then(setOrders).catch((err) => setError(err.message));
  }

  useEffect(() => load(), []);

  return (
    <div>
      <h2 className="account-panel-title">Orders</h2>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders === null ? (
        <OrdersListSkeleton count={3} />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="icon-circle">
            <Icon name="receipt" size={30} />
          </div>
          <p>You haven't placed any orders yet.</p>
          <a className="btn btn-primary" href="/shop.html">
            Start Shopping
          </a>
        </div>
      ) : (
        orders.map((order) => <OrderCard key={order._id} order={order} />)
      )}
    </div>
  );
}

function OrderCard({ order }) {
  const [trackerOpen, setTrackerOpen] = useState(false);
  return (
    <div className="order-card">
      <div className="head">
        <div>
          <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <span className={`status-pill status-${order.status}`}>{order.status}</span>
      </div>

      {order.trackingId && (
        <div className="tracking-info">
          <Icon name="truck" size={16} />
          <div>
            <strong>
              {order.courierName || 'Courier'} — {order.trackingId}
            </strong>
            <span>Tracking ID for this order</span>
          </div>
        </div>
      )}

      {order.items.map((item) => (
        <div className="order-item-row" key={item.product}>
          <img src={item.image} alt={item.name} />
          <div style={{ flex: 1 }}>
            {item.name} × {item.qty}
          </div>
          <strong>Rs. {(item.price * item.qty).toFixed(2)}</strong>
        </div>
      ))}

      <div
        className="summary-row total"
        style={{ borderTop: '1px solid var(--border)', marginTop: '10px', paddingTop: '10px' }}
      >
        <span>Total</span>
        <span>Rs. {order.totalPrice.toFixed(2)}</span>
      </div>

      <button
        type="button"
        className="order-track-toggle"
        onClick={() => setTrackerOpen((v) => !v)}
        aria-expanded={trackerOpen}
      >
        <Icon name="chevron-down" size={16} className={trackerOpen ? 'rotated' : undefined} />
        {trackerOpen ? 'Hide tracking' : 'Track order'}
      </button>
      <div className={`order-tracker-collapse${trackerOpen ? ' open' : ''}`}>
        <OrderTracker status={order.status} />
      </div>
    </div>
  );
}

function OrderTracker({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="order-tracker-cancelled">
        <Icon name="close" size={16} />
        This order was cancelled.
      </div>
    );
  }
  const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const currentIndex = steps.indexOf(status);
  return (
    <div className="order-tracker">
      {steps.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : '';
        return (
          <div key={step} className={`order-tracker-step ${state}`}>
            <div className="order-tracker-dot">{i < currentIndex ? <Icon name="check" size={14} /> : i + 1}</div>
            <div className="order-tracker-label">{step}</div>
          </div>
        );
      })}
    </div>
  );
}

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

function AddressesTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setError(null);
    addresses.list().then(setItems).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function handleSave(payload) {
    setSaving(true);
    try {
      if (editing) await addresses.update(editing._id, payload);
      else await addresses.create(payload);
      showToast(editing ? 'Address updated' : 'Address added');
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await addresses.remove(deleteTarget._id);
      showToast('Address removed');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSetDefault(addr) {
    try {
      await addresses.setDefault(addr._id);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div>
      <h2 className="account-panel-title">Addresses</h2>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items === null ? (
        <AddressGridSkeleton count={2} />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon-circle">
            <Icon name="home" size={30} />
          </div>
          <p>You haven't saved any addresses yet.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add New Address
          </button>
        </div>
      ) : (
        <div className="address-grid">
          {items.map((addr) => (
            <div key={addr._id} className={`address-card${addr.isDefault ? ' is-default' : ''}`}>
              {addr.isDefault && <span className="address-card-badge">Default</span>}
              <h4>{addr.fullName}</h4>
              <p>
                {addr.addressLine1}
                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                <br />
                {addr.city}, {addr.state} {addr.pincode}
                <br />
                {addr.phone}
              </p>
              <div className="address-card-actions">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(addr);
                    setModalOpen(true);
                  }}
                >
                  <Icon name="edit" size={14} /> Edit
                </button>
                {!addr.isDefault && (
                  <button type="button" onClick={() => handleSetDefault(addr)}>
                    <Icon name="check" size={14} /> Set Default
                  </button>
                )}
                <button type="button" className="danger" onClick={() => setDeleteTarget(addr)}>
                  <Icon name="trash" size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="address-card-add"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Icon name="plus" size={22} />
            Add New Address
          </button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} labelledBy="address-modal-title">
        <h3 id="address-modal-title">{editing ? 'Edit Address' : 'Add New Address'}</h3>
        <AddressFormModal
          key={editing ? editing._id : 'new'}
          initial={editing || EMPTY_ADDRESS}
          saving={saving}
          onCancel={() => setModalOpen(false)}
          onSubmit={handleSave}
        />
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} labelledBy="delete-address-title">
        <div className="app-modal-icon error">
          <Icon name="trash" size={24} />
        </div>
        <h3 id="delete-address-title">Delete this address?</h3>
        <p>This can't be undone.</p>
        <div className="app-modal-actions">
          <button type="button" className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

function AddressFormModal({ initial, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <AddressForm value={form} onChange={setForm} idPrefix="address" />
      <div className="app-modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
}
