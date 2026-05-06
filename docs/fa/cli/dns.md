---
read_when:
    - کشف گسترده‌محدوده (DNS-SD) از طریق Tailscale + CoreDNS را می‌خواهید
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: مرجع CLI برای `openclaw dns` (کمک‌ابزارهای کشف در ناحیهٔ گسترده)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:06:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

ابزارهای کمکی DNS برای کشف گستره‌وسیع (Tailscale + CoreDNS). در حال حاضر بر macOS + Homebrew CoreDNS متمرکز است.

مرتبط:

- کشف Gateway: [کشف](/fa/gateway/discovery)
- پیکربندی کشف گستره‌وسیع: [پیکربندی](/fa/gateway/configuration)

## راه‌اندازی

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

برنامه‌ریزی یا اعمال راه‌اندازی CoreDNS برای کشف DNS-SD تک‌پخشی.

گزینه‌ها:

- `--domain <domain>`: دامنه کشف گستره‌وسیع (برای مثال `openclaw.internal`)
- `--apply`: نصب یا به‌روزرسانی پیکربندی CoreDNS و راه‌اندازی دوباره سرویس (به sudo نیاز دارد؛ فقط macOS)

آنچه نمایش می‌دهد:

- دامنه کشف حل‌شده
- مسیر فایل zone
- IPهای tailnet فعلی
- پیکربندی پیشنهادی کشف در `openclaw.json`
- مقادیر نام‌سرور/دامنه Split DNS در Tailscale که باید تنظیم شوند

نکات:

- بدون `--apply`، این دستور فقط یک ابزار کمکی برای برنامه‌ریزی است و راه‌اندازی پیشنهادی را چاپ می‌کند.
- اگر `--domain` حذف شود، OpenClaw از `discovery.wideArea.domain` در پیکربندی استفاده می‌کند.
- `--apply` در حال حاضر فقط از macOS پشتیبانی می‌کند و Homebrew CoreDNS را انتظار دارد.
- `--apply` در صورت نیاز فایل zone را راه‌اندازی اولیه می‌کند، از وجود قطعه import در CoreDNS اطمینان می‌دهد و سرویس brew مربوط به `coredns` را دوباره راه‌اندازی می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [کشف](/fa/gateway/discovery)
