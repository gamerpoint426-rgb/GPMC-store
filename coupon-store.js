const fs = require('fs');
const path = require('path');

function createCouponStore(dataDir) {
  const file = path.join(dataDir, 'coupons.json');
  function read() {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return {}; }
  }
  function write(data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }
  function normalize(code) { return String(code || '').trim().toUpperCase(); }
  function list() { return Object.values(read()).sort((a,b) => a.code.localeCompare(b.code)); }
  function get(code) { return read()[normalize(code)] || null; }
  function create({ code, type, value, maxUses = 0, minTotal = 0, expiresAt = null }) {
    code = normalize(code);
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) throw new Error('Code must be 3–24 letters, numbers, _ or -.');
    if (!['percent', 'fixed'].includes(type)) throw new Error('Type must be percent or fixed.');
    value = Number(value); maxUses = Number(maxUses); minTotal = Number(minTotal);
    if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) throw new Error('Invalid discount value. Percent must be 1–100.');
    if (!Number.isInteger(maxUses) || maxUses < 0) throw new Error('Max uses must be 0 or a positive whole number.');
    if (!Number.isFinite(minTotal) || minTotal < 0) throw new Error('Minimum total cannot be negative.');
    if (expiresAt && !Number.isFinite(Date.parse(expiresAt))) throw new Error('Expiry must be a valid date/time.');
    const db = read();
    if (db[code]) throw new Error('That coupon code already exists.');
    const coupon = { code, type, value, maxUses, minTotal, expiresAt: expiresAt || null, usedCount: 0, enabled: true, createdAt: new Date().toISOString() };
    db[code] = coupon; write(db); return coupon;
  }
  function remove(code) { const db = read(); code = normalize(code); if (!db[code]) return false; delete db[code]; write(db); return true; }
  function setEnabled(code, enabled) { const db = read(); code = normalize(code); if (!db[code]) return null; db[code].enabled = !!enabled; write(db); return db[code]; }
  function quote(code, subtotal) {
    code = normalize(code);
    if (!code) return { code: null, discount: 0, total: subtotal };
    const c = get(code);
    if (!c) throw new Error('Coupon code not found.');
    if (!c.enabled) throw new Error('This coupon is disabled.');
    if (c.expiresAt && Date.now() > Date.parse(c.expiresAt)) throw new Error('This coupon has expired.');
    if (c.maxUses > 0 && c.usedCount >= c.maxUses) throw new Error('This coupon has reached its usage limit.');
    if (subtotal < c.minTotal) throw new Error(`Minimum cart total for this coupon is ₹${c.minTotal}.`);
    const discount = Math.min(subtotal, c.type === 'percent' ? Math.floor(subtotal * c.value / 100) : Math.floor(c.value));
    if (discount < 1) throw new Error('This coupon does not discount this cart.');
    return { code, discount, total: subtotal - discount };
  }
  function reserve(code) { if (!code) return; const db = read(); const c = db[normalize(code)]; if (!c || !c.enabled || (c.maxUses > 0 && c.usedCount >= c.maxUses)) throw new Error('Coupon is no longer available.'); c.usedCount += 1; write(db); }
  function release(code) { if (!code) return; const db = read(); const c = db[normalize(code)]; if (c && c.usedCount > 0) { c.usedCount -= 1; write(db); } }
  return { list, get, create, remove, setEnabled, quote, reserve, release };
}
module.exports = { createCouponStore };
