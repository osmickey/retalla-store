const ADDRESS_DEBOUNCE_MS = 500;
let addressDebounceTimer = null;
let currentSuggestions = [];

function escapeAddrHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function debounceAddressSearch(query) {
  clearTimeout(addressDebounceTimer);
  if (!query || query.trim().length < 4) {
    renderSuggestions([]);
    return;
  }
  addressDebounceTimer = setTimeout(() => searchAddress(query), ADDRESS_DEBOUNCE_MS);
}

async function searchAddress(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=5&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('lookup failed');
    const results = await res.json();
    currentSuggestions = results;
    renderSuggestions(results);
  } catch (err) {
    renderSuggestions([]);
  }
}

function renderSuggestions(results) {
  const box = document.getElementById('addr-suggestions');
  if (!box) return;
  if (!results.length) {
    box.innerHTML = '';
    box.classList.remove('open');
    return;
  }
  box.classList.add('open');
  box.innerHTML = results
    .map((r, i) => `<div class="addr-suggestion" data-index="${i}">${escapeAddrHTML(r.display_name)}</div>`)
    .join('');
  box.querySelectorAll('.addr-suggestion').forEach((el) => {
    el.addEventListener('click', () => selectSuggestion(Number(el.dataset.index)));
  });
}

function setStateSelect(stateName) {
  const sel = document.getElementById('addr-state');
  if (!sel || !stateName) return;
  const match = Array.from(sel.options).find((opt) => opt.value.toLowerCase() === stateName.toLowerCase());
  if (match) sel.value = match.value;
}

function selectSuggestion(index) {
  const result = currentSuggestions[index];
  if (!result) return;
  const addr = result.address || {};

  const line1 = [addr.house_number, addr.road].filter(Boolean).join(' ') || addr.neighbourhood || addr.suburb || result.display_name.split(',')[0];
  document.getElementById('addr-line1').value = line1;

  const city = addr.city || addr.town || addr.village || addr.county || '';
  if (city) document.getElementById('addr-city').value = city;

  setStateSelect(addr.state || '');

  const pincode = addr.postcode || '';
  if (pincode) document.getElementById('addr-pincode').value = pincode;

  renderSuggestions([]);
}

async function lookupPincode(pincode) {
  if (!/^[0-9]{6}$/.test(pincode)) return;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    const postOffice = data?.[0]?.PostOffice?.[0];
    if (!postOffice) return;

    const cityField = document.getElementById('addr-city');
    if (cityField && !cityField.value.trim()) cityField.value = postOffice.District;

    setStateSelect(postOffice.State);
  } catch (err) {
    // Pincode lookup is a convenience only — fail silently if the free API is unreachable.
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const line1 = document.getElementById('addr-line1');
  const pincode = document.getElementById('addr-pincode');
  const suggestionsBox = document.getElementById('addr-suggestions');

  if (line1 && suggestionsBox) {
    line1.addEventListener('input', (e) => debounceAddressSearch(e.target.value));
    document.addEventListener('click', (e) => {
      if (e.target !== line1 && !suggestionsBox.contains(e.target)) {
        renderSuggestions([]);
      }
    });
  }

  if (pincode) {
    pincode.addEventListener('input', () => {
      if (pincode.value.length === 6) lookupPincode(pincode.value);
    });
  }
});
