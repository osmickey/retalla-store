// Shared field set extracted from AccountPage.jsx's original inline
// AddressForm. Deliberately just the fields -- no <form>, no buttons, no
// internal state -- so each call site (AccountPage's modal, Checkout's
// inline section) can keep its own submit chrome. Pass a raw useState
// setter as `onChange` (both call sites do); handlePincodeChange relies on
// the functional-updater form for correctness against an async fetch.
export default function AddressForm({ value, onChange, idPrefix = 'address' }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  // Ported from public/js/checkout-maps.js's lookupPincode(). Fails
  // silently like the original. City fills only if currently empty; state
  // is always overwritten on a successful lookup -- an asymmetry preserved
  // exactly from the source, not a bug.
  async function handlePincodeChange(raw) {
    const pincode = raw.replace(/\D/g, '').slice(0, 6);
    onChange({ ...value, pincode });
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const postOffice = data?.[0]?.PostOffice?.[0];
      if (!postOffice) return;
      onChange((prev) => ({
        ...prev,
        city: prev.city.trim() ? prev.city : postOffice.District,
        state: postOffice.State,
      }));
    } catch {
      // convenience only
    }
  }

  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-fullname`}>Full Name</label>
        <input id={`${idPrefix}-fullname`} required value={value.fullName} onChange={set('fullName')} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-phone`}>Phone Number</label>
        <div className="phone-input-group">
          <span className="phone-prefix">+91</span>
          <input
            id={`${idPrefix}-phone`}
            required
            pattern="[0-9]{10}"
            maxLength={10}
            inputMode="numeric"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-line1`}>Address Line 1</label>
        <input id={`${idPrefix}-line1`} required value={value.addressLine1} onChange={set('addressLine1')} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-line2`}>
          Address Line 2 <span className="field-optional">(optional)</span>
        </label>
        <input id={`${idPrefix}-line2`} value={value.addressLine2} onChange={set('addressLine2')} />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${idPrefix}-city`}>City</label>
          <input id={`${idPrefix}-city`} required value={value.city} onChange={set('city')} />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-state`}>State</label>
          <input id={`${idPrefix}-state`} required value={value.state} onChange={set('state')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-pincode`}>Pincode</label>
        <input
          id={`${idPrefix}-pincode`}
          required
          pattern="[0-9]{6}"
          maxLength={6}
          inputMode="numeric"
          value={value.pincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
        />
      </div>
    </>
  );
}
