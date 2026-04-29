---
read_when:
    - می‌خواهید رابط کاربری کنترل را با توکن فعلی خود باز کنید
    - می‌خواهید URL را بدون راه‌اندازی مرورگر چاپ کنید
summary: مرجع CLI برای `openclaw dashboard` (باز کردن رابط کاربری کنترل)
title: داشبورد
x-i18n:
    generated_at: "2026-04-29T22:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

رابط کاربری کنترل را با استفاده از احراز هویت فعلی خود باز کنید.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

نکته‌ها:

- `dashboard` در صورت امکان SecretRefs پیکربندی‌شده‌ی `gateway.auth.token` را resolve می‌کند.
- `dashboard` از `gateway.tls.enabled` پیروی می‌کند: Gatewayهایی که TLS در آن‌ها فعال است، URLهای رابط کاربری کنترل را با `https://` چاپ/باز می‌کنند و از طریق `wss://` متصل می‌شوند.
- برای توکن‌های مدیریت‌شده با SecretRef (resolve‌شده یا resolve‌نشده)، `dashboard` یک URL بدون توکن را چاپ/کپی/باز می‌کند تا از افشای اسرار خارجی در خروجی ترمینال، تاریخچه‌ی کلیپ‌بورد، یا آرگومان‌های راه‌اندازی مرورگر جلوگیری شود.
- اگر `gateway.auth.token` با SecretRef مدیریت می‌شود اما در این مسیر فرمان resolve نشده باشد، فرمان به‌جای جای‌دادن یک جای‌نگهدار نامعتبر توکن، یک URL بدون توکن و راهنمایی اصلاحی صریح چاپ می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [داشبورد](/fa/web/dashboard)
