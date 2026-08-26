// The 3-link policy footer used by the 4 static pages. Login/register have
// no footer at all — this only ever renders inside StorefrontLayout.
export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="policy-links">
          <a href="/privacy-policy.html">Privacy Policy</a>
          <a href="/terms.html">Terms &amp; Conditions</a>
          <a href="/shipping-returns.html">Shipping &amp; Returns Policy</a>
        </div>
        <div className="footer-bottom">© 2026 Retalla. All rights reserved.</div>
      </div>
    </footer>
  );
}
