const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

export function normalizePhone(phone) {
  let s = String(phone || '').trim().replace(/[\s\-()]/g, '');
  s = [...s]
    .map((ch) => {
      const ai = ARABIC_INDIC.indexOf(ch);
      if (ai >= 0) return String(ai);
      const ea = EASTERN_ARABIC.indexOf(ch);
      if (ea >= 0) return String(ea);
      return ch;
    })
    .join('');
  return s;
}
