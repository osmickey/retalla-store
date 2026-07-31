let fpEmail = '';
let fpResetToken = '';

function showFpMessage(elId, message, type = 'error') {
  const el = document.getElementById(elId);
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
}

function showStep(stepId) {
  ['fp-step-email', 'fp-step-otp', 'fp-step-password', 'fp-step-done'].forEach((id) => {
    document.getElementById(id).style.display = id === stepId ? 'block' : 'none';
  });
}

async function handleSendOtp(e) {
  e.preventDefault();
  fpEmail = document.getElementById('fp-email').value.trim();
  const btn = document.getElementById('fp-send-btn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    await api.post('/auth/forgot-password', { email: fpEmail });
    document.getElementById('fp-otp-email-display').textContent = fpEmail;
    showStep('fp-step-otp');
  } catch (err) {
    showFpMessage('fp-email-message', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send OTP';
  }
}

async function handleResendOtp(e) {
  e.preventDefault();
  try {
    await api.post('/auth/forgot-password', { email: fpEmail });
    showFpMessage('fp-otp-message', 'A new OTP has been sent.', 'success');
  } catch (err) {
    showFpMessage('fp-otp-message', err.message);
  }
}

function backToEmailStep(e) {
  e.preventDefault();
  showStep('fp-step-email');
}

async function handleVerifyOtp(e) {
  e.preventDefault();
  const otp = document.getElementById('fp-otp').value.trim();
  const btn = document.getElementById('fp-verify-btn');
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    const data = await api.post('/auth/verify-reset-otp', { email: fpEmail, otp });
    fpResetToken = data.resetToken;
    showStep('fp-step-password');
  } catch (err) {
    if (typeof showAlertModal === 'function') {
      showAlertModal({
        title: 'Incorrect OTP',
        message: err.message || "That code doesn't match. Please check the 6 digits and try again.",
        type: 'error',
        onClose: () => {
          const input = document.getElementById('fp-otp');
          if (input) { input.value = ''; input.focus(); }
        },
      });
    } else {
      showFpMessage('fp-otp-message', err.message);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify OTP';
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  const newPassword = document.getElementById('fp-new-password').value;
  const confirmPassword = document.getElementById('fp-confirm-password').value;
  const btn = document.getElementById('fp-reset-btn');

  if (newPassword !== confirmPassword) {
    showFpMessage('fp-password-message', 'Passwords do not match');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Resetting...';

  try {
    await api.post('/auth/reset-password', { email: fpEmail, resetToken: fpResetToken, newPassword });
    showStep('fp-step-done');
  } catch (err) {
    showFpMessage('fp-password-message', err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reset Password';
  }
}
