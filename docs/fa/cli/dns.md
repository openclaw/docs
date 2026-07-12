---
read_when:
    - شما خواهان کشف در شبکه گسترده (DNS-SD) از طریق Tailscale و CoreDNS هستید
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: مرجع CLI برای `openclaw dns` (ابزارهای کمکی کشف در شبکهٔ گسترده)
title: DNS
x-i18n:
    generated_at: "2026-07-12T09:45:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

ابزارهای کمکی DNS برای کشف در شبکه گسترده (Tailscale + CoreDNS). در حال حاضر فقط macOS + CoreDNS نصب‌شده با Homebrew پشتیبانی می‌شود.

مرتبط:

- کشف Gateway: [کشف](/fa/gateway/discovery)
- پیکربندی کشف در شبکه گسترده: [پیکربندی](/fa/gateway/configuration)

## `dns setup`

برنامه‌ریزی یا اعمال راه‌اندازی CoreDNS برای کشف DNS-SD تک‌پخشی.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| گزینه               | تأثیر                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `--domain <domain>` | دامنه کشف در شبکه گسترده (برای مثال `openclaw.internal`).                                      |
| `--apply`           | نصب/به‌روزرسانی پیکربندی CoreDNS و راه‌اندازی (مجدد) سرویس. نیازمند sudo و فقط برای macOS است. |

بدون `--domain`، OpenClaw از `discovery.wideArea.domain` در پیکربندی استفاده می‌کند.

بدون `--apply`، فرمان فقط موارد زیر را چاپ می‌کند:

- دامنه کشف تفکیک‌شده و مسیر فایل ناحیه
- نشانی‌های IP فعلی tailnet
- پیکربندی پیشنهادی کشف در `openclaw.json`
- مقادیر کارساز نام/دامنه Split DNS در Tailscale که باید در کنسول مدیریت Tailscale تنظیم شوند

با `--apply` (فقط macOS، نیازمند CoreDNS نصب‌شده با Homebrew):

- در صورت نبود فایل ناحیه، آن را راه‌اندازی اولیه می‌کند
- در صورت نبود بند import در CoreDNS، آن را اضافه می‌کند
- سرویس brew با نام `coredns` را مجدداً راه‌اندازی می‌کند

## مرتبط

- [مرجع CLI](/fa/cli)
- [کشف](/fa/gateway/discovery)
