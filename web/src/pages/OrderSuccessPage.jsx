import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import Icon from '../icons/Icon';

// Port of public/order-success.html + order-success.js. No login gate and
// silent-fail-on-error are both preserved exactly -- vanilla has neither,
// and a failure here is display-only (the order already succeeded by the
// time this page loads), so there's nothing to "fix" or upgrade.
export default function OrderSuccessPage() {
  useDocumentTitle('Order Placed — Retalla');
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/orders/${id}`).then(setOrder).catch(() => {});
  }, [id]);

  return (
    <main className="container">
      <div className="auth-wrap" style={{ maxWidth: 520, textAlign: 'center' }}>
        <div className="icon-circle" style={{ width: 72, height: 72, margin: '0 auto 14px', background: '#dcfce7', color: 'var(--success)' }}>
          <Icon name="check" size={34} />
        </div>
        <h2>Order Placed Successfully!</h2>
        <p className="sub">Thank you for shopping with Retalla. We'll notify you once your order ships.</p>
        {order && (
          <div style={{ textAlign: 'left', background: 'var(--primary-light)', padding: 16, borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
            <p>Order ID: <strong>#{order._id.slice(-8).toUpperCase()}</strong></p>
            <p>Total: <strong>Rs. {order.totalPrice.toFixed(2)}</strong></p>
            <p>Payment: <strong>{order.paymentMethod}</strong></p>
          </div>
        )}
        <a href="/account.html" className="btn btn-primary btn-block" style={{ marginBottom: 10 }}>View My Orders</a>
        <a href="/shop.html" className="btn btn-outline btn-block">Continue Shopping</a>
      </div>
    </main>
  );
}
