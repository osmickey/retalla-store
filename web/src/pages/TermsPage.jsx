import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function TermsPage() {
  useDocumentTitle('Terms & Conditions — Retalla');

  return (
    <main className="container">
      <div className="breadcrumb">
        <a href="/index.html">Home</a> / <span>Terms &amp; Conditions</span>
      </div>

      <div className="policy-page">
        <h1>Terms &amp; Conditions</h1>
        <p className="updated">Last updated: July 2026</p>

        <p>
          Welcome to Retalla. By accessing or shopping on retalla.in, you agree to the following terms. Please read them
          carefully before placing an order.
        </p>

        <h2>1. Using Our Site</h2>
        <p>
          You must be able to form a legally binding contract to place an order with us. When you create an account,
          you're responsible for keeping your login details confidential and for all activity under your account.
        </p>

        <h2>2. Products &amp; Pricing</h2>
        <p>
          We try to display product information, images, and prices as accurately as possible. Occasionally an item's
          price or availability may change or contain an error; if that happens on an order you've placed, we'll contact
          you before proceeding.
        </p>

        <h2>3. Orders &amp; Payment</h2>
        <p>
          Placing an order is an offer to buy, which we accept once your order is confirmed. We accept Cash on Delivery,
          UPI, and card payments where available. Orders may be cancelled if payment cannot be verified or stock is
          unavailable.
        </p>

        <h2>4. Shipping</h2>
        <p>
          Shipping is free on orders over Rs. 499; a flat Rs. 49 shipping fee applies below that. See our{' '}
          <a href="/shipping-returns.html">Shipping &amp; Returns Policy</a> for delivery timelines.
        </p>

        <h2>5. Returns &amp; Refunds</h2>
        <p>
          Eligible items can be returned within 7 days of delivery. Full details are in our{' '}
          <a href="/shipping-returns.html">Shipping &amp; Returns Policy</a>.
        </p>

        <h2>6. Acceptable Use</h2>
        <p>
          You agree not to misuse the site — including attempting to interfere with its normal operation, submitting
          fraudulent orders, or infringing on the rights of Retalla or other users.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          Retalla is not liable for indirect or consequential losses arising from use of the site, to the fullest extent
          permitted by law. Nothing in these terms limits any statutory rights you have as a consumer.
        </p>

        <h2>8. Changes to These Terms</h2>
        <p>We may update these terms from time to time. Continued use of the site after changes are posted means you accept the updated terms.</p>

        <h2>Contact Us</h2>
        <p>
          Questions about these terms? Email us at <a href="mailto:support@retalla.in">support@retalla.in</a>.
        </p>
      </div>
    </main>
  );
}
