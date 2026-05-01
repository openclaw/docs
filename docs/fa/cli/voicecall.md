---
read_when:
    - از Plugin voice-call استفاده می‌کنید و نقاط ورود CLI را می‌خواهید
    - نمونه‌های سریعی برای `voicecall setup|smoke|call|continue|dtmf|status|tail|expose` می‌خواهید
summary: مرجع CLI برای `openclaw voicecall` (سطح فرمان Plugin تماس صوتی)
title: تماس صوتی
x-i18n:
    generated_at: "2026-05-01T11:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c040cf4cd984ad6d6dd302923494a7c8ee131390b803fe20a9894b077f08d5bb
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` فرمانی است که توسط Plugin ارائه می‌شود. این فرمان فقط زمانی ظاهر می‌شود که Plugin تماس صوتی نصب و فعال باشد.

وقتی Gateway در حال اجرا باشد، فرمان‌های عملیاتی (`call`، `start`،
`continue`، `speak`، `dtmf`، `end` و `status`) به runtime تماس صوتی همان Gateway ارسال می‌شوند. اگر هیچ Gateway در دسترس نباشد، به runtime مستقل
CLI بازمی‌گردند.

سند اصلی:

- Plugin تماس صوتی: [تماس صوتی](/fa/plugins/voice-call)

## فرمان‌های رایج

```bash
openclaw voicecall setup
openclaw voicecall smoke
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
```

`setup` به‌طور پیش‌فرض بررسی‌های آمادگی قابل‌خواندن برای انسان را چاپ می‌کند. برای
اسکریپت‌ها از `--json` استفاده کنید:

```bash
openclaw voicecall setup --json
```

`status` به‌طور پیش‌فرض تماس‌های فعال را به‌صورت JSON چاپ می‌کند. برای بررسی
یک تماس، `--call-id <id>` را بدهید.

برای ارائه‌دهندگان خارجی (`twilio`، `telnyx`، `plivo`)، راه‌اندازی باید یک URL عمومی
Webhook را از `publicUrl`، یک تونل، یا درمعرض‌گذاری Tailscale تشخیص دهد. fallback سرویس‌دهی loopback/خصوصی رد می‌شود، چون اپراتورها نمی‌توانند به آن دسترسی داشته باشند.

`smoke` همان بررسی‌های آمادگی را اجرا می‌کند. مگر اینکه هر دو گزینه `--to` و `--yes` حاضر باشند، تماس تلفنی واقعی برقرار نمی‌کند:

```bash
openclaw voicecall smoke --to "+15555550123"        # اجرای خشک
openclaw voicecall smoke --to "+15555550123" --yes  # تماس اعلان زنده
```

## درمعرض‌گذاری Webhookها (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

نکته امنیتی: endpoint مربوط به Webhook را فقط در معرض شبکه‌هایی قرار دهید که به آن‌ها اعتماد دارید. در صورت امکان Tailscale Serve را به Funnel ترجیح دهید.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Plugin تماس صوتی](/fa/plugins/voice-call)
