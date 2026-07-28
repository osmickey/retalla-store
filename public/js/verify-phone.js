let checkoutConfirmationResult = null;
let checkoutRecaptchaVerifier = null;
let checkoutVerifiedNumber = null;

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

  const phone = input.value.trim();
  const valid = /^[6-9][0-9]{9}$/.test(phone);

  if (!valid) {
    status.innerHTML = '';
    updatePlaceOrderState();
    return;
  }

  if (phone === checkoutVerifiedNumber) {
    status.innerHTML = `
      <div class="phone-verify-box verified">
        <span class="verify-badge verified">Verified</span>
        <span>You'll get order updates on this number.</span>
      </div>
    `;
    updatePlaceOrderState();
    return;
  }

  status.innerHTML = `
    <div class="phone-verify-box">
      <p class="phone-verify-note">Verify this number to place your order</p>
      <div id="checkout-phone-message" class="form-message" style="display:none;"></div>
      <button type="button" id="checkout-send-otp-btn" class="btn btn-outline btn-sm" onclick="sendCheckoutOtp()">Send OTP</button>
      <div id="checkout-otp-step" style="display:none;margin-top:10px;">
        <div class="field">
          <label>Enter OTP</label>
          <input id="checkout-otp-input" class="otp-input" maxlength="6" placeholder="000000" />
        </div>
        <button type="button" id="checkout-verify-otp-btn" class="btn btn-primary btn-sm" onclick="confirmCheckoutOtp()">Verify OTP</button>
      </div>
    </div>
  `;
  updatePlaceOrderState();
}

async function sendCheckoutOtp() {
  const phone = document.getElementById('addr-phone').value.trim();
  const btn = document.getElementById('checkout-send-otp-btn');

  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    showCheckoutPhoneMessage('Enter a valid 10-digit Indian mobile number first');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending OTP...';

  try {
    checkoutConfirmationResult = await firebase.auth().signInWithPhoneNumber(`+91${phone}`, getCheckoutRecaptcha());
    document.getElementById('checkout-otp-step').style.display = 'block';
    btn.textContent = 'Resend OTP';
    showCheckoutPhoneMessage('OTP sent to your mobile number.', 'success');
  } catch (err) {
    showCheckoutPhoneMessage(err.message || 'Failed to send OTP');
    btn.textContent = 'Send OTP';
  } finally {
    btn.disabled = false;
  }
}

async function confirmCheckoutOtp() {
  const otpInput = document.getElementById('checkout-otp-input');
  const btn = document.getElementById('checkout-verify-otp-btn');
  if (!checkoutConfirmationResult) return;

  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    const result = await checkoutConfirmationResult.confirm(otpInput.value.trim());
    const idToken = await result.user.getIdToken();
    const data = await api.post('/auth/verify-phone', { idToken });
    auth.setSession(data.user, auth.getToken());
    checkoutVerifiedNumber = document.getElementById('addr-phone').value.trim();
    renderPhoneVerifyStatus();
    showToast('Mobile number verified.');
  } catch (err) {
    showCheckoutPhoneMessage(err.message || 'Incorrect OTP');
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
