/*
  تنظیمات اصلی فروشگاه
  این فایل از طریق پنل مدیریت (admin.html) به‌روز می‌شود.
*/
const SHOP = {
  name: "GHΛZ BOUTIQUE",
  tagline: "مد روز، با کیفیت و سلیقه",
  // دامنه‌ی سایت. اگر دامنه عوض شد، اینجا هم عوض کن.
  domain: "https://username.github.io/boutique",
  currency: "تومان",

  // شماره واتساپ برای دریافت سفارش (با کد کشور، بدون + و صفر اول)
  whatsapp: "989199147277",

  // اطلاعات پرداخت کارت به کارت
  bankName: "بانک سامان(بلو)",
  accountHolder: "غزاله آقا حسینی",
  bankCard: "6219 8618 2731 5507",

  // لینک درگاه پرداخت آنلاین (اختیاری)
  paymentLink: "",

  // اطلاعات ریپازیتوری گیت‌هاب برای ذخیره مستقیم از پنل مدیریت
  github: {
    owner: "your-username",
    repo: "boutique",
    branch: "main"
  }
};
