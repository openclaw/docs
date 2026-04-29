---
read_when:
    - می‌خواهید یک برنامهٔ Node موبایل را به‌سرعت با یک Gateway جفت کنید
    - برای اشتراک‌گذاری از راه دور/دستی به خروجی setup-code نیاز دارید
summary: مرجع CLI برای `openclaw qr` (ایجاد کد QR جفت‌سازی موبایل + کد راه‌اندازی)
title: QR
x-i18n:
    generated_at: "2026-04-29T22:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

یک QR جفت‌سازی موبایل و کد راه‌اندازی را از پیکربندی فعلی Gateway شما تولید می‌کند.

## نحوه استفاده

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## گزینه‌ها

- `--remote`: `gateway.remote.url` را ترجیح بده؛ اگر تنظیم نشده باشد، `gateway.tailscale.mode=serve|funnel` همچنان می‌تواند نشانی عمومی راه دور را فراهم کند
- `--url <url>`: نشانی Gateway استفاده‌شده در payload را بازنویسی کن
- `--public-url <url>`: نشانی عمومی استفاده‌شده در payload را بازنویسی کن
- `--token <token>`: مشخص کن جریان راه‌اندازی اولیه در برابر کدام توکن Gateway احراز هویت شود
- `--password <password>`: مشخص کن جریان راه‌اندازی اولیه در برابر کدام گذرواژه Gateway احراز هویت شود
- `--setup-code-only`: فقط کد راه‌اندازی را چاپ کن
- `--no-ascii`: رندر کردن QR به صورت ASCII را رد کن
- `--json`: JSON تولید کن (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## نکات

- `--token` و `--password` ناسازگارند و نمی‌توانند هم‌زمان استفاده شوند.
- خود کد راه‌اندازی اکنون یک `bootstrapToken` مبهم و کوتاه‌عمر را حمل می‌کند، نه توکن/گذرواژه مشترک Gateway را.
- در جریان راه‌اندازی اولیه داخلی Node/operator، توکن اصلی Node همچنان با `scopes: []` ثبت می‌شود.
- اگر تحویل راه‌اندازی اولیه یک توکن operator هم صادر کند، همچنان به فهرست مجاز راه‌اندازی اولیه محدود می‌ماند: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- بررسی‌های scope راه‌اندازی اولیه با پیشوند نقش انجام می‌شوند. آن فهرست مجاز operator فقط درخواست‌های operator را برآورده می‌کند؛ نقش‌های غیر operator همچنان به scopeها زیر پیشوند نقش خودشان نیاز دارند.
- جفت‌سازی موبایل برای نشانی‌های Gateway از نوع Tailscale/عمومی `ws://` به‌صورت بسته شکست می‌خورد. `ws://` شبکه LAN خصوصی همچنان پشتیبانی می‌شود، اما مسیرهای موبایل Tailscale/عمومی باید از Tailscale Serve/Funnel یا یک نشانی Gateway از نوع `wss://` استفاده کنند.
- با `--remote`، OpenClaw به یکی از `gateway.remote.url` یا
  `gateway.tailscale.mode=serve|funnel` نیاز دارد.
- با `--remote`، اگر اعتبارنامه‌های راه دورِ عملاً فعال به صورت SecretRefs پیکربندی شده باشند و شما `--token` یا `--password` را پاس ندهید، فرمان آن‌ها را از snapshot فعال Gateway resolve می‌کند. اگر Gateway در دسترس نباشد، فرمان سریعاً شکست می‌خورد.
- بدون `--remote`، وقتی هیچ بازنویسی احراز هویت CLI پاس داده نشده باشد، SecretRefs احراز هویت Gateway محلی resolve می‌شوند:
  - `gateway.auth.token` وقتی resolve می‌شود که احراز هویت توکنی بتواند برنده شود (یا `gateway.auth.mode="token"` صریح، یا حالت استنباط‌شده‌ای که در آن هیچ منبع گذرواژه‌ای برنده نمی‌شود).
  - `gateway.auth.password` وقتی resolve می‌شود که احراز هویت گذرواژه‌ای بتواند برنده شود (یا `gateway.auth.mode="password"` صریح، یا حالت استنباط‌شده‌ای که در آن هیچ توکن برنده‌ای از auth/env وجود ندارد).
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefs) و `gateway.auth.mode` تنظیم نشده باشد، resolve کردن کد راه‌اندازی تا زمانی که mode صریحاً تنظیم شود شکست می‌خورد.
- نکته ناهمخوانی نسخه Gateway: این مسیر فرمان به Gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ Gatewayهای قدیمی‌تر خطای unknown-method برمی‌گردانند.
- پس از اسکن، جفت‌سازی دستگاه را با این فرمان‌ها تأیید کنید:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی](/fa/cli/pairing)
