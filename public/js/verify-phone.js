let checkoutConfirmationResult = null;
let checkoutRecaptchaVerifier = null;
let checkoutVerifiedNumber = null;
let checkoutResendTimer = null;

function getCheckoutRecaptcha() {
  if (!checkoutRecaptchaVerifier) {
    checkoutRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('checkout-phone-recaptcha', { size: 'invisible' });
  }
  return checkoutRecaptchaVerifier;
}

function showCheckoutPhoneMessage(message, type = 'error') {
  const el = document.getElementById('checkout-phone-message');
  if (!el) return;
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
}

function hideCheckoutPhoneMessage() {
  const el = document.getElementById('checkout-phone-message');
  if (el) el.style.display = 'none';
}

function updatePlaceOrderState() {
  const btn = document.getElementById('place-order-btn');
  const hint = document.getElementById('place-order-hint');
  const input = document.getElementById('addr-phone');
  if (!btn || !input) return;

  const phone = input.value.trim();
  const verified = /^[6-9][0-9]{9}$/.test(phone) && phone === checkoutVerifiedNumber;
  btn.disabled = !verified;
  if (hint) hint.style.display = verified ? 'none' : 'block';
}

function renderPhoneVerifyStatus() {
  const status = document.getElementById('phone-verify-status');
  const input = document.getElementById('addr-phone');
  if (!status || !input) return;

  clearInterval(checkoutResendTimer);
  hideCheckoutPhoneMessage();
  const phone = input.value.trim();
  const valid = /^[6-9][0-9]{9}$/.test(phone);

  if (!valid) {
    status.innerHTML = '';
    updatePlaceOrderState();
    return;
  }

  if (phone === checkoutVerifiedNumber) {
    status.innerHTML = `
      <div class="phone-verify-card verified">
        <div class="icon-circle"><span data-icon="check" data-icon-size="18"></span></div>
        <div class="pv-text">
          <strong>Mobile number verified</strong>
          <span>You'll get order updates on +91 ${phone}</span>
        </div>
      </div>
    `;
    renderIcons(status);
    updatePlaceOrderState();
    return;
  }

  status.innerHTML = `
    <div class="phone-verify-card">
      <div class="icon-circle"><span data-icon="phone" data-icon-size="18"></span></div>
      <div class="pv-text">
        <strong>Verify this mobile number</strong>
        <span>We'll text a 6-digit code to confirm it</span>
      </div>
      <button type="button" id="checkout-send-otp-btn" class="btn btn-primary btn-sm" onclick="sendCheckoutOtp()">Send OTP</button>
    </div>
  `;
  renderIcons(status);
  updatePlaceOrderState();
}

function otpBoxesHTML() {
  return Array.from({ length: 6 })
    .map((_, i) => `<input class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]" data-otp-index="${i}" autocomplete="one-time-code" />`)
    .join('');
}

function renderOtpStep(phone) {
  const status = document.getElementById('phone-verify-status');
  status.innerHTML = `
    <div class="phone-verify-card otp-active">
      <div class="pv-header">
        <div class="icon-circle"><span data-icon="phone" data-icon-size="18"></span></div>
        <div class="pv-text">
          <strong>Enter the 6-digit code</strong>
          <span>Sent to +91 ${phone}</span>
        </div>
      </div>
      <div class="otp-box-row">${otpBoxesHTML()}</div>
      <div class="pv-actions">
        <button type="button" class="btn btn-primary btn-block" id="checkout-verify-otp-btn" onclick="confirmCheckoutOtp()">Verify OTP</button>
        <button type="button" class="pv-resend" id="checkout-resend-btn" disabled>Resend OTP in <span id="resend-timer">30</span>s</button>
      </div>
    </div>
  `;
  renderIcons(status);
  hideCheckoutPhoneMessage();
  wireOtpBoxes();
  startResendCountdown();
}

function wireOtpBoxes() {
  const boxes = Array.from(document.querySelectorAll('.otp-box'));

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(0, 1);
      box.classList.toggle('filled', !!box.value);
      if (box.value && boxes[i + 1]) boxes[i + 1].focus();
      if (boxes.every((b) => b.value)) confirmCheckoutOtp();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && boxes[i - 1]) {
        boxes[i - 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, idx) => {
        if (boxes[idx]) {
          boxes[idx].value = d;
          boxes[idx].classList.add('filled');
        }
      });
      const next = boxes[digits.length] || boxes[boxes.length - 1];
      next.focus();
      if (digits.length === 6) confirmCheckoutOtp();
    });
  });

  boxes[0].focus();
}

function getOtpValue() {
  return Array.from(document.querySelectorAll('.otp-box')).map((b) => b.value).join('');
}

function startResendCountdown() {
  let seconds = 30;
  const btn = document.getElementById('checkout-resend-btn');
  const timerEl = document.getElementById('resend-timer');
  clearInterval(checkoutResendTimer);
  checkoutResendTimer = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(checkoutResendTimer);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Resend OTP';
        btn.onclick = () => sendCheckoutOtp(true);
      }
    } else if (timerEl) {
      timerEl.textContent = seconds;
    }
  }, 1000);
}

async function sendCheckoutOtp(isResend) {
  const phone = document.getElementById('addr-phone').value.trim();

  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    showCheckoutPhoneMessage('Enter a valid 10-digit Indian mobile number first');
    return;
  }

  const triggerBtn = document.getElementById(isResend ? 'checkout-resend-btn' : 'checkout-send-otp-btn');
  const originalText = triggerBtn ? triggerBtn.textContent : '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.textContent = 'Sending...';
  }
  hideCheckoutPhoneMessage();

  try {
    checkoutConfirmationResult = await firebase.auth().signInWithPhoneNumber(`+91${phone}`, getCheckoutRecaptcha());
    renderOtpStep(phone);
  } catch (err) {
    showCheckoutPhoneMessage(err.message || 'Failed to send OTP');
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.textContent = originalText;
    }
  }
}

async function confirmCheckoutOtp() {
  const otp = getOtpValue();
  const btn = document.getElementById('checkout-verify-otp-btn');
  if (!checkoutConfirmationResult || otp.length !== 6 || !btn) return;

  btn.disabled = true;
  btn.textContent = 'Verifying...';
  hideCheckoutPhoneMessage();

  try {
    const result = await checkoutConfirmationResult.confirm(otp);
    const idToken = await result.user.getIdToken();
    const data = await api.post('/auth/verify-phone', { idToken });
    auth.setSession(data.user, auth.getToken());
    checkoutVerifiedNumber = document.getElementById('addr-phone').value.trim();
    clearInterval(checkoutResendTimer);
    renderPhoneVerifyStatus();
    showToast('Mobile number verified.');
  } catch (err) {
    showCheckoutPhoneMessage(err.message || 'Incorrect OTP, please try again');
    document.querySelectorAll('.otp-box').forEach((b) => {
      b.value = '';
      b.classList.remove('filled');
    });
    const firstBox = document.querySelector('.otp-box');
    if (firstBox) firstBox.focus();
    btn.disabled = false;
    btn.textContent = 'Verify OTP';
  }
}

function initCheckoutPhoneVerification() {
  const input = document.getElementById('addr-phone');
  if (!input) return;

  const user = auth.getUser();
  if (user && user.phoneVerified && user.phone) {
    const digits = user.phone.replace(/\D/g, '').slice(-10);
    checkoutVerifiedNumber = digits;
    if (!input.value) input.value = digits;
  }

  renderPhoneVerifyStatus();
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
    renderPhoneVerifyStatus();
  });
}

document.addEventListener('DOMContentLoaded', initCheckoutPhoneVerification);
