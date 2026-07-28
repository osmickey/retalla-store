let phoneConfirmationResult = null;
let phoneRecaptchaVerifier = null;

function getPhoneRecaptcha() {
  if (!phoneRecaptchaVerifier) {
    phoneRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('phone-recaptcha', { size: 'invisible' });
  }
  return phoneRecaptchaVerifier;
}

function normalizeIndianPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  return null;
}

function showPhoneMessage(message, type = 'error') {
  const el = document.getElementById('phone-verify-message');
  if (!el) return;
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
}

async function sendPhoneOtp() {
  const input = document.getElementById('phone-input');
  const btn = document.getElementById('send-otp-btn');
  const phone = normalizeIndianPhone(input.value.trim());

  if (!phone) {
    showPhoneMessage('Enter a valid 10-digit Indian mobile number');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending OTP...';

  try {
    phoneConfirmationResult = await firebase.auth().signInWithPhoneNumber(phone, getPhoneRecaptcha());
    document.getElementById('phone-otp-step').style.display = 'block';
    btn.textContent = 'Resend OTP';
    showPhoneMessage('OTP sent to your mobile number.', 'success');
  } catch (err) {
    showPhoneMessage(err.message || 'Failed to send OTP');
    btn.textContent = 'Send OTP';
  } finally {
    btn.disabled = false;
  }
}

async function confirmPhoneOtp() {
  const otpInput = document.getElementById('phone-otp-input');
  const btn = document.getElementById('verify-otp-btn');

  if (!phoneConfirmationResult) return;

  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    const result = await phoneConfirmationResult.confirm(otpInput.value.trim());
    const idToken = await result.user.getIdToken();
    const data = await api.post('/auth/verify-phone', { idToken });
    auth.setSession(data.user, auth.getToken());
    renderPhoneVerifyUI();
  } catch (err) {
    showPhoneMessage(err.message || 'Incorrect OTP');
    btn.disabled = false;
    btn.textContent = 'Verify OTP';
  }
}

function renderPhoneVerifyUI() {
  const section = document.getElementById('phone-verify-section');
  const user = auth.getUser();
  if (!section || !user) return;

  if (user.phoneVerified) {
    section.innerHTML = `
      <h3>Mobile Number</h3>
      <p><span class="verify-badge verified">Verified</span> ${user.phone || ''}</p>
    `;
    return;
  }

  section.innerHTML = `
    <h3>Mobile Number</h3>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:10px;">
      <span class="verify-badge unverified">Not Verified</span>
      ${user.phone ? ` ${user.phone}` : ' Add and verify your mobile number.'}
    </p>
    <div id="phone-verify-message" class="form-message" style="display:none;"></div>
    <div class="field">
      <label>Mobile Number</label>
      <input id="phone-input" type="tel" placeholder="10-digit mobile number" value="${user.phone ? user.phone.replace('+91', '') : ''}" maxlength="10" />
    </div>
    <button id="send-otp-btn" type="button" class="btn btn-outline btn-sm" onclick="sendPhoneOtp()">Send OTP</button>
    <div id="phone-otp-step" style="display:none;margin-top:12px;">
      <div class="field">
        <label>Enter OTP</label>
        <input id="phone-otp-input" class="otp-input" maxlength="6" placeholder="000000" />
      </div>
      <button id="verify-otp-btn" type="button" class="btn btn-primary btn-sm" onclick="confirmPhoneOtp()">Verify OTP</button>
    </div>
    <div id="phone-recaptcha"></div>
  `;
}

document.addEventListener('DOMContentLoaded', renderPhoneVerifyUI);
