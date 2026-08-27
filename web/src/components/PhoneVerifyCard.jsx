import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import { showToast } from '../lib/cart';
import Icon from '../icons/Icon';

// Ported verbatim from public/js/verify-phone.js.
const OTP_ERROR_TEXT = {
  'auth/invalid-verification-code': ['Incorrect OTP', "That code doesn't match. Please check the 6 digits and try again."],
  'auth/missing-verification-code': ['Enter the OTP', 'Please type all 6 digits of the code we sent you.'],
  'auth/code-expired': ['OTP expired', 'That code has expired. Request a new one to continue.'],
  'auth/too-many-requests': ['Too many attempts', "We've paused verification for a short while. Please wait a few minutes and try again."],
  'auth/invalid-phone-number': ['Invalid number', "That mobile number doesn't look right. Please check and try again."],
  'auth/quota-exceeded': ['Try again later', 'Verification is temporarily unavailable. Please try again shortly.'],
  'auth/network-request-failed': ['Connection problem', "We couldn't reach the verification service. Check your internet connection and try again."],
  'auth/billing-not-enabled': ['Verification unavailable', "Mobile verification isn't available right now. Please try again later or contact support."],
  'auth/operation-not-allowed': ['Verification unavailable', "Mobile verification isn't available right now. Please try again later or contact support."],
};

function describeOtpError(err, fallbackTitle) {
  const entry = OTP_ERROR_TEXT[err?.code || ''];
  return {
    title: entry ? entry[0] : fallbackTitle,
    message: entry ? entry[1] : err?.message || 'Something went wrong. Please try again.',
  };
}

function last10(raw) {
  return String(raw || '').replace(/\D/g, '').slice(-10);
}

const RECAPTCHA_CONTAINER_ID = 'checkout-phone-recaptcha';
const RESEND_SECONDS = 30;

// Self-contained Firebase phone-OTP widget -- port of public/js/verify-phone.js.
// Owns every Firebase SDK detail so CheckoutPage never touches window.firebase.
//
// Controlled for `phone` (candidate number, owned by the parent: a saved
// address's phone, or the inline new-address form's phone field).
// Uncontrolled for verifiedPhone -- this component is the sole owner of
// "what number did *I* verify" and reports it upward via onVerifiedChange
// so the parent can fold it into Place Order gating. Mirrors vanilla's
// module-level `checkoutVerifiedNumber`, just lifted one level via a callback.
export default function PhoneVerifyCard({ phone, onVerifiedChange }) {
  const reduceMotion = useReducedMotion();

  // Seeded once, exactly like vanilla's initCheckoutPhoneVerification(): a
  // returning customer whose account already has a verified phone doesn't
  // need to re-verify an unchanged number.
  const [verifiedPhone, setVerifiedPhone] = useState(() => {
    const u = auth.getUser();
    return u?.phoneVerified && u.phone ? last10(u.phone) : null;
  });

  const [otpPhase, setOtpPhase] = useState(false); // true while the 6-box entry screen shows
  const [otpDigits, setOtpDigits] = useState(() => Array(6).fill(''));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [errorInfo, setErrorInfo] = useState(null); // { title, message }

  const confirmationResultRef = useRef(null);
  const recaptchaRef = useRef(null);
  const boxRefs = useRef([]);
  const cardRef = useRef(null);

  useEffect(() => {
    onVerifiedChange(verifiedPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedPhone]);

  // Any externally-driven change to the candidate phone (switching saved
  // addresses, editing the new-address form) abandons an in-flight OTP
  // screen -- matches vanilla's renderPhoneVerifyStatus() re-running fresh
  // on every keystroke of the single, shared phone input.
  useEffect(() => {
    setOtpPhase(false);
    setErrorInfo(null);
  }, [phone]);

  // Tear down the invisible reCAPTCHA widget on unmount. Vanilla never
  // needed this (a real page navigation destroyed everything for free);
  // in this SPA, unmounting Checkout doesn't reload the page, so anything
  // Firebase injected outside React's tree would otherwise leak. .clear()
  // is Firebase's documented RecaptchaVerifier teardown.
  useEffect(() => () => recaptchaRef.current?.clear(), []);

  useEffect(() => {
    if (!otpPhase) return undefined;
    setResendSeconds(RESEND_SECONDS);
    const timer = setInterval(() => setResendSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
    boxRefs.current[0]?.focus();
    const t = setTimeout(
      () => cardRef.current?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }),
      120
    );
    return () => { clearInterval(timer); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpPhase]);

  function getRecaptcha() {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new window.firebase.auth.RecaptchaVerifier(RECAPTCHA_CONTAINER_ID, { size: 'invisible' });
    }
    return recaptchaRef.current;
  }

  async function handleSendOtp() {
    if (!/^[6-9][0-9]{9}$/.test(phone)) return;
    if (!window.firebase) {
      setErrorInfo({ title: 'Verification unavailable', message: 'Please refresh the page and try again.' });
      return;
    }
    setSending(true);
    setErrorInfo(null);
    try {
      confirmationResultRef.current = await window.firebase.auth().signInWithPhoneNumber(`+91${phone}`, getRecaptcha());
      setOtpDigits(Array(6).fill(''));
      setOtpPhase(true);
    } catch (err) {
      setErrorInfo(describeOtpError(err, "Couldn't send OTP"));
    } finally {
      setSending(false);
    }
  }

  async function handleConfirmOtp(otpValue) {
    const otp = otpValue ?? otpDigits.join('');
    if (!confirmationResultRef.current || otp.length !== 6) return;
    setVerifying(true);
    setErrorInfo(null);
    try {
      const result = await confirmationResultRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();
      const data = await api.post('/auth/verify-phone', { idToken });
      auth.setSession(data.user, auth.getToken());
      setVerifiedPhone(phone);
      setOtpPhase(false);
      showToast('Mobile number verified.');
    } catch (err) {
      setErrorInfo(describeOtpError(err, 'Verification failed'));
      setOtpDigits(Array(6).fill(''));
      boxRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  function handleChangeNumber() {
    confirmationResultRef.current = null;
    setOtpPhase(false);
    setErrorInfo(null);
  }

  function handleBoxChange(i, rawValue) {
    const v = rawValue.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[i] = v;
    setOtpDigits(next);
    if (v && boxRefs.current[i + 1]) boxRefs.current[i + 1].focus();
    if (next.every(Boolean)) handleConfirmOtp(next.join(''));
  }

  function handleBoxKeyDown(i, e) {
    if (e.key === 'Backspace' && !otpDigits[i] && boxRefs.current[i - 1]) boxRefs.current[i - 1].focus();
  }

  function handleBoxPaste(e) {
    e.preventDefault();
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6).split('');
    const next = [...otpDigits];
    digits.forEach((d, idx) => { next[idx] = d; });
    setOtpDigits(next);
    boxRefs.current[digits.length < 6 ? digits.length : 5]?.focus();
    if (digits.length === 6) handleConfirmOtp(next.join(''));
  }

  const phoneValid = /^[6-9][0-9]{9}$/.test(phone);
  const isVerified = phoneValid && phone === verifiedPhone;
  const view = !phoneValid ? 'hidden' : otpPhase ? 'otp' : isVerified ? 'verified' : 'unverified';
  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } };

  return (
    <div className="checkout-phone-verify">
      {view !== 'hidden' && (
        <motion.div
          key={view}
          ref={view === 'otp' ? cardRef : undefined}
          className={`phone-verify-card${view === 'verified' ? ' verified' : ''}${view === 'otp' ? ' otp-active' : ''}`}
          {...motionProps}
        >
          {view === 'unverified' && (
            <>
              <div className="icon-circle"><Icon name="phone" size={18} /></div>
              <div className="pv-text">
                <strong>Verify this mobile number</strong>
                <span>We'll text a 6-digit code to confirm it</span>
              </div>
              <button type="button" className="btn btn-primary btn-sm" disabled={sending} onClick={handleSendOtp}>
                {sending ? 'Sending...' : 'Send OTP'}
              </button>
            </>
          )}
          {view === 'verified' && (
            <>
              <div className="icon-circle"><Icon name="check" size={18} /></div>
              <div className="pv-text">
                <strong>Mobile number verified</strong>
                <span>You'll get order updates on +91 {phone}</span>
              </div>
            </>
          )}
          {view === 'otp' && (
            <>
              <div className="pv-header">
                <div className="icon-circle"><Icon name="phone" size={18} /></div>
                <div className="pv-text">
                  <strong>Enter the 6-digit code</strong>
                  <span>
                    Sent to +91 {phone}{' '}
                    <button type="button" className="pv-change" onClick={handleChangeNumber}>Change</button>
                  </span>
                </div>
              </div>
              <div className="otp-box-row">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { boxRefs.current[i] = el; }}
                    className={`otp-box${digit ? ' filled' : ''}`}
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleBoxChange(i, e.target.value)}
                    onKeyDown={(e) => handleBoxKeyDown(i, e)}
                    onPaste={handleBoxPaste}
                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }), 250)}
                  />
                ))}
              </div>
              <div className="pv-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  disabled={verifying || otpDigits.some((d) => !d)}
                  onClick={() => handleConfirmOtp()}
                >
                  {verifying ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button type="button" className="pv-resend" disabled={resendSeconds > 0} onClick={handleSendOtp}>
                  {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {errorInfo && (
        <div className="form-message error" role="alert">
          <strong>{errorInfo.title}</strong>: {errorInfo.message}
        </div>
      )}

      {/* Firebase only needs this id to exist when RecaptchaVerifier is
          constructed (lazily, inside handleSendOtp) -- a plain, always-mounted
          JSX div is sufficient; no imperative DOM node needed. Unconditional
          (outside the view branches above) so it never unmounts across phase
          transitions and the verifier's stored container reference never goes stale. */}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </div>
  );
}
