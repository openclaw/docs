---
read_when:
    - می‌خواهید یک برنامه Node موبایل را سریع با یک Gateway جفت کنید
    - برای اشتراک‌گذاری از راه دور/دستی، به خروجی setup-code نیاز دارید
summary: مرجع CLI برای `openclaw qr` (تولید QR جفت‌سازی موبایل + کد راه‌اندازی)
title: QR
x-i18n:
    generated_at: "2026-05-06T09:08:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

یک QR جفت‌سازی موبایل و کد راه‌اندازی را از پیکربندی فعلی Gateway شما ایجاد می‌کند.

## نحوهٔ استفاده

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## گزینه‌ها

- `--remote`: `gateway.remote.url` را ترجیح می‌دهد؛ اگر تنظیم نشده باشد، `gateway.tailscale.mode=serve|funnel` همچنان می‌تواند URL عمومی راه دور را فراهم کند
- `--url <url>`: URL Gateway استفاده‌شده در payload را بازنویسی می‌کند
- `--public-url <url>`: URL عمومی استفاده‌شده در payload را بازنویسی می‌کند
- `--token <token>`: توکن Gateway را که جریان bootstrap با آن احراز هویت می‌کند بازنویسی می‌کند
- `--password <password>`: گذرواژهٔ Gateway را که جریان bootstrap با آن احراز هویت می‌کند بازنویسی می‌کند
- `--setup-code-only`: فقط کد راه‌اندازی را چاپ می‌کند
- `--no-ascii`: رندر QR به‌صورت ASCII را نادیده می‌گیرد
- `--json`: JSON تولید می‌کند (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## نکته‌ها

- `--token` و `--password` ناسازگارند و نمی‌توانند هم‌زمان استفاده شوند.
- خود کد راه‌اندازی اکنون یک `bootstrapToken` مبهم و کوتاه‌مدت را حمل می‌کند، نه توکن/گذرواژهٔ مشترک Gateway.
- در جریان داخلی bootstrap گره/اپراتور، توکن اصلی گره همچنان با `scopes: []` قرار می‌گیرد.
- اگر handoff مربوط به bootstrap یک توکن اپراتور هم صادر کند، به allowlist مربوط به bootstrap محدود می‌ماند: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- بررسی‌های scope مربوط به bootstrap دارای پیشوند نقش هستند. آن allowlist اپراتور فقط درخواست‌های اپراتور را برآورده می‌کند؛ نقش‌های غیر اپراتور همچنان به scopeهایی زیر پیشوند نقش خودشان نیاز دارند.
- جفت‌سازی موبایل برای URLهای Gateway با `ws://` در مسیرهای Tailscale/عمومی به‌صورت fail-closed شکست می‌خورد. نشانی‌های LAN خصوصی و میزبان‌های Bonjour با `.local` همچنان از طریق `ws://` پشتیبانی می‌شوند، اما مسیرهای موبایل Tailscale/عمومی باید از Tailscale Serve/Funnel یا یک URL Gateway با `wss://` استفاده کنند.
- با `--remote`، OpenClaw به یکی از این‌ها نیاز دارد: `gateway.remote.url` یا
  `gateway.tailscale.mode=serve|funnel`.
- با `--remote`، اگر اعتبارنامه‌های راه دوری که عملاً فعال هستند به‌صورت SecretRef پیکربندی شده باشند و شما `--token` یا `--password` را ارسال نکنید، فرمان آن‌ها را از snapshot فعال Gateway resolve می‌کند. اگر Gateway در دسترس نباشد، فرمان سریعاً شکست می‌خورد.
- بدون `--remote`، زمانی که هیچ بازنویسی احراز هویت CLI ارسال نشده باشد، SecretRefهای احراز هویت Gateway محلی resolve می‌شوند:
  - `gateway.auth.token` زمانی resolve می‌شود که احراز هویت با توکن بتواند برنده شود (`gateway.auth.mode="token"` به‌صورت صریح یا حالت استنباط‌شده‌ای که در آن هیچ منبع گذرواژه‌ای برنده نمی‌شود).
  - `gateway.auth.password` زمانی resolve می‌شود که احراز هویت با گذرواژه بتواند برنده شود (`gateway.auth.mode="password"` به‌صورت صریح یا حالت استنباط‌شده با نبود توکن برنده از auth/env).
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefها) و `gateway.auth.mode` تنظیم نشده باشد، resolve شدن کد راه‌اندازی تا زمانی که mode به‌صورت صریح تنظیم شود شکست می‌خورد.
- نکتهٔ ناسازگاری نسخهٔ Gateway: این مسیر فرمان به Gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ Gatewayهای قدیمی‌تر خطای unknown-method برمی‌گردانند.
- پس از اسکن، جفت‌سازی دستگاه را با این موارد تأیید کنید:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی](/fa/cli/pairing)
