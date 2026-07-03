---
read_when:
    - می‌خواهید یک اپلیکیشن Node موبایل را سریعاً با یک Gateway جفت کنید
    - برای اشتراک‌گذاری از راه دور/دستی به خروجی setup-code نیاز دارید
summary: مرجع CLI برای `openclaw qr` (تولید کد QR جفت‌سازی موبایل + کد راه‌اندازی)
title: QR
x-i18n:
    generated_at: "2026-07-03T17:34:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

یک QR جفت‌سازی موبایل و کد راه‌اندازی را از پیکربندی فعلی Gateway شما ایجاد می‌کند.

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
- `--url <url>`: URL gateway استفاده‌شده در payload را بازنویسی می‌کند
- `--public-url <url>`: URL عمومی استفاده‌شده در payload را بازنویسی می‌کند
- `--token <token>`: مشخص می‌کند جریان bootstrap در برابر کدام توکن gateway احراز هویت شود
- `--password <password>`: مشخص می‌کند جریان bootstrap در برابر کدام گذرواژه gateway احراز هویت شود
- `--setup-code-only`: فقط کد راه‌اندازی را چاپ می‌کند
- `--no-ascii`: رندر QR به‌صورت ASCII را رد می‌کند
- `--json`: JSON تولید می‌کند (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## نکته‌ها

- `--token` و `--password` با هم ناسازگارند.
- خود کد راه‌اندازی اکنون یک `bootstrapToken` کوتاه‌عمر و مبهم را حمل می‌کند، نه توکن/گذرواژه مشترک gateway.
- bootstrap داخلی کد راه‌اندازی، یک توکن اصلی `node` با `scopes: []` به‌همراه یک توکن واگذاری محدود `operator` برای راه‌اندازی قابل اعتماد موبایل برمی‌گرداند.
- توکن operator واگذارشده به `operator.approvals`، `operator.read`، `operator.talk.secrets` و `operator.write` محدود است؛ دامنه‌های تغییر جفت‌سازی و `operator.admin` همچنان به یک جفت‌سازی operator تأییدشده جداگانه یا جریان توکن جداگانه نیاز دارند.
- جفت‌سازی موبایل برای URLهای gateway از نوع `ws://` عمومی/Tailscale به‌صورت بسته شکست می‌خورد. نشانی‌های LAN خصوصی و میزبان‌های Bonjour با `.local` همچنان روی `ws://` پشتیبانی می‌شوند، اما مسیرهای موبایل عمومی/Tailscale باید از Tailscale Serve/Funnel یا یک URL gateway از نوع `wss://` استفاده کنند.
- با `--remote`، OpenClaw به یکی از `gateway.remote.url` یا
  `gateway.tailscale.mode=serve|funnel` نیاز دارد.
- با `--remote`، اگر اعتبارنامه‌های راه دور عملاً فعال به‌صورت SecretRefs پیکربندی شده باشند و شما `--token` یا `--password` را ارسال نکنید، فرمان آن‌ها را از snapshot فعال gateway حل می‌کند. اگر gateway در دسترس نباشد، فرمان سریعاً شکست می‌خورد.
- بدون `--remote`، وقتی هیچ بازنویسی احراز هویت CLI ارسال نشده باشد، SecretRefs احراز هویت gateway محلی حل می‌شوند:
  - `gateway.auth.token` زمانی حل می‌شود که احراز هویت توکنی بتواند برنده شود (`gateway.auth.mode="token"` صریح یا حالت استنباط‌شده‌ای که در آن هیچ منبع گذرواژه‌ای برنده نمی‌شود).
  - `gateway.auth.password` زمانی حل می‌شود که احراز هویت گذرواژه‌ای بتواند برنده شود (`gateway.auth.mode="password"` صریح یا حالت استنباط‌شده بدون توکن برنده از auth/env).
- اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefs) و `gateway.auth.mode` تنظیم نشده باشد، حل کد راه‌اندازی تا زمانی که mode به‌صراحت تنظیم شود شکست می‌خورد.
- نکته ناهمخوانی نسخه Gateway: این مسیر فرمان به gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ gatewayهای قدیمی‌تر خطای unknown-method برمی‌گردانند.
- پس از اسکن، جفت‌سازی دستگاه را با این فرمان‌ها تأیید کنید:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی](/fa/cli/pairing)
