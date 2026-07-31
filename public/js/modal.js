// Small centered alert dialog used for OTP and other flow errors, so failures are
// impossible to miss instead of being a thin line of red text.
function showAlertModal({ title, message, type = 'error', okText = 'OK', onClose } = {}) {
  document.querySelectorAll('.app-modal-overlay').forEach((el) => el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'app-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'app-modal';
  modal.setAttribute('role', 'alertdialog');
  modal.setAttribute('aria-modal', 'true');

  const iconWrap = document.createElement('div');
  iconWrap.className = `app-modal-icon ${type}`;
  const icon = document.createElement('span');
  icon.setAttribute('data-icon', type === 'success' ? 'check' : type === 'info' ? 'support' : 'close');
  icon.setAttribute('data-icon-size', '26');
  iconWrap.appendChild(icon);

  const h3 = document.createElement('h3');
  h3.textContent = title || 'Something went wrong';

  const p = document.createElement('p');
  p.textContent = message || '';

  const okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.className = 'btn btn-primary app-modal-ok';
  okBtn.textContent = okText;

  modal.append(iconWrap, h3, p, okBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  if (typeof renderIcons === 'function') renderIcons(overlay);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.classList.add('closing');
    document.removeEventListener('keydown', onKeyDown);
    setTimeout(() => {
      overlay.remove();
      if (typeof onClose === 'function') onClose();
    }, 180);
  };

  function onKeyDown(e) {
    if (e.key === 'Escape') close();
  }

  okBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', onKeyDown);

  okBtn.focus();

  return close;
}
