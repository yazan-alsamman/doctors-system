// Shared Arabic UI strings used across pages

export const STATUS_AR = {
  active: "نشط",
  inactive: "غير نشط",
  new: "جديد",
  draft: "مسودة",
  unpaid: "غير مدفوع",
  partial: "دفع جزئي",
  paid: "مدفوعة",
  due: "مستحقة",
  overdue: "متأخرة",
  ok: "متوفر",
  low: "منخفض",
  critical: "حرج",
  pending: "معلق",
  today: "اليوم",
  "on-shift": "متاح",
  "off-shift": "خارج الدوام",
  overload: "ضغط عالٍ",
};

// Working week (Sun → Thu) — typical for Arabic clinics
export const DAYS_AR = [
  { label: "الأحد", date: 23, key: "sun" },
  { label: "الإثنين", date: 24, key: "mon" },
  { label: "الثلاثاء", date: 25, key: "tue" },
  { label: "الأربعاء", date: 26, key: "wed" },
  { label: "الخميس", date: 27, key: "thu" },
];

export const COMMON_AR = {
  cancel: "إلغاء",
  save: "حفظ",
  confirm: "تأكيد",
  edit: "تعديل",
  view: "عرض",
  archive: "أرشفة",
  delete: "حذف",
  search: "بحث",
  filter: "تصفية",
  export: "تصدير",
  add: "إضافة",
  loading: "جارٍ التحميل...",
  noData: "لا توجد بيانات",
  required: "مطلوب",
};

export function fmtMoney(n) {
  return `${n.toLocaleString("ar-SY-u-ca-gregory-nu-latn", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} ل.س`;
}

export function fmtNumberAr(n, options = {}) {
  return new Intl.NumberFormat("ar-SA-u-ca-gregory-nu-latn", {
    maximumFractionDigits: 0,
    ...options,
  }).format(Number(n) || 0);
}

export function fmtPercentAr(n) {
  return `${fmtNumberAr(n)}٪`;
}

export function fmtTime(start) {
  const h = Math.floor(start);
  const m = Math.round((start - h) * 60);
  const period = h >= 12 ? "م" : "ص";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, "0")} ${period}`;
}

export function fmtPatientFileId(id) {
  const clean = String(id || "")
    .trim()
    .replace(/^#+/, "");
  return clean ? `#${clean}` : "#—";
}
