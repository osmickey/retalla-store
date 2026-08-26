import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function PrivacyPolicyPage() {
  useDocumentTitle('Privacy Policy — Retalla');

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <span>Privacy Policy</span>
      </div>

      <div className="policy-page">
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: July 2026</p>

        <p>
          Retalla ("we", "us", "our") respects your privacy and is committed to protecting the personal information you
          share with us while shopping on retalla.in. This policy explains what we collect, how we use it, and the choices
          you have.
        </p>

        <h2>Information We Collect</h2>
        <ul>
          <li>
            Account details you provide: name, email address, phone number, and password (stored securely as a one-way
            hash — we never store or can view your plain-text password).
          </li>
          <li>Order details: shipping address, items purchased, order value, and payment method selected.</li>
          <li>
            Usage information such as pages visited and items added to your cart, used to keep your cart and browsing
            experience working correctly.
          </li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>To process and deliver your orders, including sharing your shipping address with our delivery partners.</li>
          <li>To communicate order confirmations, shipping updates, and respond to customer support requests.</li>
          <li>To maintain your account and order history.</li>
          <li>To improve our product catalog and store experience.</li>
        </ul>

        <h2>Payment Information</h2>
        <p>
          Retalla does not store your card or UPI credentials. Card and online payments are processed directly by our
          payment partners; Cash on Delivery orders involve no online payment data at all.
        </p>

        <h2>Cookies</h2>
        <p>
          We use essential browser storage (such as your shopping cart and login session) to keep the site functional. We
          do not use this to track you across other websites.
        </p>

        <h2>Sharing Your Information</h2>
        <p>
          We share order and shipping details only with the courier/delivery partners needed to fulfil your order. We do
          not sell your personal information to third parties.
        </p>

        <h2>Data Security</h2>
        <p>
          Passwords are hashed and never stored in readable form. We take reasonable technical measures to protect your
          data, though no online service can guarantee absolute security.
        </p>

        <h2>Your Rights</h2>
        <p>
          You can review or update your account details at any time by logging in, and may request deletion of your
          account by contacting us below.
        </p>

        <h2>Contact Us</h2>
        <p>
          Questions about this policy? Email us at <a href="mailto:support@retalla.in">support@retalla.in</a>.
        </p>
      </div>
    </main>
  );
}
