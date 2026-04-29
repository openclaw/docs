---
read_when:
    - کشف گسترده‌دامنه (DNS-SD) از طریق Tailscale + CoreDNS را می‌خواهید
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: مرجع CLI برای `openclaw dns` (کمک‌کننده‌های کشف گستره‌وسیع)
title: DNS
x-i18n:
    generated_at: "2026-04-29T22:35:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

کمک‌کننده‌های DNS برای اکتشاف گسترهٔ وسیع (Tailscale + CoreDNS). در حال حاضر بر macOS + Homebrew CoreDNS متمرکز است.

مرتبط:

- اکتشاف Gateway: [اکتشاف](/fa/gateway/discovery)
- پیکربندی اکتشاف گسترهٔ وسیع: [پیکربندی](/fa/gateway/configuration)

## راه‌اندازی

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

برنامه‌ریزی یا اعمال راه‌اندازی CoreDNS برای اکتشاف unicast DNS-SD.

گزینه‌ها:

- `--domain <domain>`: دامنهٔ اکتشاف گسترهٔ وسیع (برای مثال `openclaw.internal`)
- `--apply`: نصب یا به‌روزرسانی پیکربندی CoreDNS و راه‌اندازی دوبارهٔ سرویس (نیازمند sudo؛ فقط macOS)

آنچه نشان می‌دهد:

- دامنهٔ اکتشاف حل‌شده
- مسیر فایل ناحیه
- IPهای فعلی tailnet
- پیکربندی اکتشاف پیشنهادی `openclaw.json`
- مقادیر nameserver/domain برای Tailscale Split DNS که باید تنظیم شوند

نکات:

- بدون `--apply`، فرمان فقط یک کمک‌کنندهٔ برنامه‌ریزی است و راه‌اندازی پیشنهادی را چاپ می‌کند.
- اگر `--domain` حذف شود، OpenClaw از `discovery.wideArea.domain` در پیکربندی استفاده می‌کند.
- `--apply` در حال حاضر فقط از macOS پشتیبانی می‌کند و انتظار دارد Homebrew CoreDNS وجود داشته باشد.
- `--apply` در صورت نیاز فایل ناحیه را آماده‌سازی اولیه می‌کند، مطمئن می‌شود stanza واردسازی CoreDNS وجود دارد، و سرویس brew مربوط به `coredns` را دوباره راه‌اندازی می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [اکتشاف](/fa/gateway/discovery)
