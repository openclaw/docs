---
read_when:
    - می‌خواهید رابط کاربری کنترل را با توکن فعلی خود باز کنید
    - می‌خواهید URL را بدون راه‌اندازی مرورگر چاپ کنید
summary: مرجع CLI برای `openclaw dashboard` (باز کردن رابط کاربری کنترل)
title: داشبورد
x-i18n:
    generated_at: "2026-05-05T01:44:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

رابط کاربری کنترل را با استفاده از احراز هویت فعلی خود باز کنید.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

یادداشت‌ها:

- `dashboard` در صورت امکان SecretRefهای پیکربندی‌شده‌ی `gateway.auth.token` را resolve می‌کند.
- `dashboard` از `gateway.tls.enabled` پیروی می‌کند: Gatewayهای دارای TLS فعال، URLهای رابط کاربری کنترل را با
  `https://` چاپ/باز می‌کنند و از طریق `wss://` متصل می‌شوند.
- اگر تحویل از طریق کلیپ‌بورد/مرورگر برای URL داشبوردِ احراز هویت‌شده با توکن ناموفق باشد،
  `dashboard` یک راهنمای امن برای احراز هویت دستی ثبت می‌کند که از `OPENCLAW_GATEWAY_TOKEN`،
  `gateway.auth.token`، و کلید fragment یعنی `token` نام می‌برد، بدون آنکه مقدار توکن را
  چاپ کند.
- برای توکن‌های مدیریت‌شده با SecretRef (resolve‌شده یا resolveنشده)، `dashboard` یک URL بدون توکن را چاپ/کپی/باز می‌کند تا از افشای اسرار خارجی در خروجی ترمینال، تاریخچه کلیپ‌بورد، یا آرگومان‌های اجرای مرورگر جلوگیری شود.
- اگر `gateway.auth.token` با SecretRef مدیریت می‌شود اما در این مسیر فرمان resolve نشده باشد، فرمان به‌جای جاسازی یک placeholder نامعتبر برای توکن، یک URL بدون توکن و راهنمای اصلاح صریح چاپ می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [داشبورد](/fa/web/dashboard)
