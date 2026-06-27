---
read_when:
    - می‌خواهید یک برنامهٔ Node موبایل را به‌سرعت با یک Gateway جفت کنید
    - برای اشتراک‌گذاری راه دور/دستی به خروجی setup-code نیاز دارید
summary: مرجع CLI برای `openclaw qr` (تولید QR جفت‌سازی موبایل + کد راه‌اندازی)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:27:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

یک QR جفت‌سازی موبایل و کد راه‌اندازی را از پیکربندی فعلی Gateway خود تولید کنید.

## کاربرد

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## گزینه‌ها

- `--remote`: `gateway.remote.url` را ترجیح می‌دهد؛ اگر تنظیم نشده باشد، `gateway.tailscale.mode=serve|funnel` همچنان می‌تواند URL عمومی راه دور را فراهم کند
- `--url <url>`: URL گیت‌وی استفاده‌شده در payload را بازنویسی می‌کند
- `--public-url <url>`: URL عمومی استفاده‌شده در payload را بازنویسی می‌کند
- `--token <token>`: مشخص می‌کند جریان bootstrap در برابر کدام توکن گیت‌وی احراز هویت شود
- `--password <password>`: مشخص می‌کند جریان bootstrap در برابر کدام گذرواژه گیت‌وی احراز هویت شود
- `--setup-code-only`: فقط کد راه‌اندازی را چاپ می‌کند
- `--no-ascii`: رندر QR با ASCII را رد می‌کند
- `--json`: JSON تولید می‌کند (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## نکته‌ها

- `--token` و `--password` با هم ناسازگارند.
- خود کد راه‌اندازی اکنون یک `bootstrapToken` مات و کوتاه‌عمر را حمل می‌کند، نه توکن/گذرواژه مشترک گیت‌وی را.
- bootstrap داخلی کد راه‌اندازی، یک توکن اصلی `node` با `scopes: []` به‌همراه یک توکن واگذاری محدود `operator` برای راه‌اندازی موبایل مورد اعتماد برمی‌گرداند.
- توکن عملگر واگذارشده به `operator.approvals`، `operator.read`، `operator.talk.secrets` و `operator.write` محدود است؛ `operator.admin` و `operator.pairing` به یک جریان جفت‌سازی عملگر یا توکن جداگانه و تأییدشده نیاز دارند.
- جفت‌سازی موبایل برای URLهای گیت‌وی Tailscale/عمومی از نوع `ws://` به‌صورت fail-closed ناموفق می‌شود. نشانی‌های LAN خصوصی و میزبان‌های Bonjour با `.local` همچنان روی `ws://` پشتیبانی می‌شوند، اما مسیرهای موبایل Tailscale/عمومی باید از Tailscale Serve/Funnel یا یک URL گیت‌وی `wss://` استفاده کنند.
- با `--remote`، OpenClaw به یکی از این دو مورد نیاز دارد: `gateway.remote.url` یا
  `gateway.tailscale.mode=serve|funnel`.
- با `--remote`، اگر اعتبارنامه‌های راه دورِ عملاً فعال به‌صورت SecretRef پیکربندی شده باشند و `--token` یا `--password` را ارسال نکنید، فرمان آن‌ها را از اسنپ‌شات فعال گیت‌وی resolve می‌کند. اگر گیت‌وی در دسترس نباشد، فرمان سریعاً شکست می‌خورد.
- بدون `--remote`، وقتی هیچ بازنویسی احراز هویت CLI ارسال نشده باشد، SecretRefهای احراز هویت گیت‌وی محلی resolve می‌شوند:
  - `gateway.auth.token` زمانی resolve می‌شود که احراز هویت توکنی بتواند برنده شود (`gateway.auth.mode="token"` صریح یا حالت استنباط‌شده‌ای که در آن هیچ منبع گذرواژه‌ای برنده نمی‌شود).
  - `gateway.auth.password` زمانی resolve می‌شود که احراز هویت گذرواژه‌ای بتواند برنده شود (`gateway.auth.mode="password"` صریح یا حالت استنباط‌شده بدون توکن برنده از auth/env).
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefها) و `gateway.auth.mode` تنظیم نشده باشد، resolve کد راه‌اندازی تا زمانی که حالت به‌صراحت تنظیم شود شکست می‌خورد.
- نکته ناسازگاری نسخه Gateway: این مسیر فرمان به گیت‌وی‌ای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ گیت‌وی‌های قدیمی‌تر خطای روش ناشناخته برمی‌گردانند.
- پس از اسکن، جفت‌سازی دستگاه را با این فرمان‌ها تأیید کنید:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی](/fa/cli/pairing)
