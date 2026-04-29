---
read_when:
    - از Plugin تماس صوتی استفاده می‌کنید و نقاط ورود CLI را می‌خواهید
    - برای `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` نمونه‌های سریع می‌خواهید
summary: مرجع CLI برای `openclaw voicecall` (سطح فرمان Plugin تماس صوتی)
title: تماس صوتی
x-i18n:
    generated_at: "2026-04-29T22:40:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c8b83ef75f792920024a67b0dee1b07aff9f55486de1149266c6d94854ca0fe
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` دستوری است که توسط Plugin ارائه می‌شود. این دستور فقط زمانی ظاهر می‌شود که Plugin تماس صوتی نصب و فعال شده باشد.

مستند اصلی:

- Plugin تماس صوتی: [تماس صوتی](/fa/plugins/voice-call)

## دستورات رایج

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` به‌طور پیش‌فرض بررسی‌های آمادگی قابل خواندن برای انسان را چاپ می‌کند. برای
اسکریپت‌ها از `--json` استفاده کنید:

```bash
openclaw voicecall setup --json
```

برای ارائه‌دهندگان خارجی (`twilio`، `telnyx`، `plivo`)، راه‌اندازی باید یک URL عمومی
Webhook را از `publicUrl`، یک تونل، یا نمایان‌سازی Tailscale به دست آورد. حالت جایگزین سرو روی loopback/خصوصی
رد می‌شود، چون اپراتورها نمی‌توانند به آن دسترسی پیدا کنند.

`smoke` همان بررسی‌های آمادگی را اجرا می‌کند. این دستور تماس تلفنی واقعی برقرار نمی‌کند
مگر اینکه هر دو گزینه `--to` و `--yes` وجود داشته باشند:

```bash
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

## در معرض قرار دادن Webhookها (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

نکته امنیتی: نقطه پایانی Webhook را فقط در معرض شبکه‌هایی قرار دهید که به آن‌ها اعتماد دارید. هر زمان ممکن است، Tailscale Serve را به Funnel ترجیح دهید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Plugin تماس صوتی](/fa/plugins/voice-call)
