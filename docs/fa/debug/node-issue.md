---
read_when:
    - بررسی ازکارافتادن بارگذار tsx/esbuild که به نبود تابع کمکی __name اشاره می‌کند
summary: ازکارافتادگی تاریخی Node + tsx با خطای «__name is not a function» و علت آن
title: خرابی Node + tsx
x-i18n:
    generated_at: "2026-07-12T10:02:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# از کار افتادن Node + tsx با خطای «‎\_\_name تابع نیست»

## وضعیت

رفع شده است. این ازکارافتادگی در نسخهٔ کنونی `tsx` که در
`package.json` تثبیت شده (`4.22.3`) یا در نسخه‌های کنونی Node بازتولید نمی‌شود. این مطلب برای حالتی نگه داشته شده است که
ارتقای آیندهٔ `tsx`/esbuild دوباره آن را ایجاد کند.

## نشانهٔ اولیه

اجرای اسکریپت‌های توسعهٔ OpenClaw از طریق `tsx` هنگام راه‌اندازی با خطای زیر ناموفق بود:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

شمارهٔ خطوط حذف شده‌اند؛ هر دو فایل از زمان وقوع ازکارافتادگی اولیه تغییر کرده‌اند
و خطوط مشخص‌شده دیگر مطابقت ندارند.

این مشکل پس از آن ظاهر شد که اسکریپت‌های توسعه از Bun به `tsx` تغییر یافتند (`2871657e`،
2026-01-06) تا Bun اختیاری شود. مسیر معادل مبتنی بر Bun دچار ازکارافتادگی نشد.
این مشکل نخستین بار در Node v25.3.0 روی macOS مشاهده شد؛ احتمال داده می‌شد سایر سکوهایی که
Node 25 را اجرا می‌کنند نیز تحت تأثیر قرار گیرند.

## علت

`tsx` کد TS/ESM را از طریق esbuild تبدیل می‌کند و در گزینه‌های تبدیل خود
`keepNames: true` را به‌صورت ثابت تنظیم کرده است. این تنظیم باعث می‌شود esbuild اعلان‌های نام‌دار تابع/کلاس را
در فراخوانی یک تابع کمکی `__name` قرار دهد تا `fn.name` پس از کوچک‌سازی
و بسته‌بندی حفظ شود. این ازکارافتادگی به این معناست که در ترکیب متأثر `tsx`/Node، تابع کمکی در محل فراخوانی
آن ماژول وجود نداشت یا با تعریف دیگری پوشانده شده بود؛ بنابراین `__name(...)`
به‌جای بازگرداندن مقدار پوشانده‌شده، خطا ایجاد کرد.

## بررسی بازتولید کنونی

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

بازتولید حداقلی و مجزا (فقط ماژول موجود در ردگیری پشتهٔ اولیه را بارگیری می‌کند):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

هر دو فرمان در حال حاضر بدون خطا خاتمه می‌یابند. اگر هرکدام دوباره خطای `__name is not a
function` ایجاد کرد، پیش از ثبت گزارش در پروژهٔ بالادستی، نسخهٔ دقیق Node، نسخهٔ `tsx`
(`node_modules/tsx/package.json`) و ردگیری کامل پشته را ثبت کنید.

## راهکارهای موقت (اگر ازکارافتادگی بازگردد)

- اسکریپت‌های توسعه را با Bun به‌جای `node --import tsx` اجرا کنید.
- برای بررسی نوع‌ها `pnpm tsgo` را اجرا کنید، سپس به‌جای اجرای کد منبع از طریق
  `tsx`، خروجی ساخته‌شده را اجرا کنید:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- نسخهٔ دیگری از `tsx` را امتحان کنید (`pnpm add -D tsx@<version>` یک تغییر
  وابستگی است و طبق خط‌مشی مخزن به تأیید نیاز دارد) تا با جست‌وجوی دودویی مشخص شود آیا نسخهٔ esbuild
  همراه آن دوباره این اشکال را ایجاد کرده است.
- روی نسخهٔ اصلی/فرعی متفاوتی از Node آزمایش کنید تا مشخص شود آیا خرابی
  مختص نسخه است.

## منابع

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## مرتبط

- [نصب Node.js](/fa/install/node)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
