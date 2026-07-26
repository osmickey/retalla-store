async function loadOrderSuccess() {
  const id = new URLSearchParams(window.location.search).get('id');
  const el = document.getElementById('order-success-detail');
  if (!id) return;
  try {
    const order = await api.get(`/orders/${id}`);
    el.innerHTML = `
      <p>Order ID: <strong>#${order._id.slice(-8).toUpperCase()}</strong></p>
      <p>Total: <strong>Rs. ${order.totalPrice.toFixed(2)}</strong></p>
      <p>Payment: <strong>${order.paymentMethod}</strong></p>
    `;
  } catch (err) {
    el.textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', loadOrderSuccess);
