---
read_when:
    - می‌خواهید یک برنامه گره موبایل را به‌سرعت با یک Gateway جفت کنید
    - برای اشتراک‌گذاری از راه دور/دستی به خروجی کد راه‌اندازی نیاز دارید
summary: مرجع CLI برای `openclaw qr` (تولید QR جفت‌سازی موبایل + کد راه‌اندازی)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:11:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
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

- `--remote`: `gateway.remote.url` را ترجیح می‌دهد؛ اگر تنظیم نشده باشد، `gateway.tailscale.mode=serve|funnel` همچنان می‌تواند URL عمومی راه دور را فراهم کند
- `--url <url>`: URL درگاه استفاده‌شده در بار داده را بازنویسی می‌کند
- `--public-url <url>`: URL عمومی استفاده‌شده در بار داده را بازنویسی می‌کند
- `--token <token>`: مشخص می‌کند جریان راه‌اندازی اولیه با کدام توکن Gateway احراز هویت کند
- `--password <password>`: مشخص می‌کند جریان راه‌اندازی اولیه با کدام گذرواژه Gateway احراز هویت کند
- `--setup-code-only`: فقط کد راه‌اندازی را چاپ می‌کند
- `--no-ascii`: رندر QR به‌صورت ASCII را رد می‌کند
- `--json`: JSON منتشر می‌کند (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## نکات

- `--token` و `--password` ناسازگارند و نمی‌توانند هم‌زمان استفاده شوند.
- خود کد راه‌اندازی اکنون یک `bootstrapToken` مات و کوتاه‌عمر را حمل می‌کند، نه توکن/گذرواژه مشترک Gateway را.
- bootstrap داخلی کد راه‌اندازی یک توکن اصلی `node` با `scopes: []` به‌همراه یک توکن تحویل محدود `operator` برای راه‌اندازی موبایل مورد اعتماد برمی‌گرداند.
- توکن operator تحویل‌داده‌شده به `operator.approvals`، `operator.read`، `operator.talk.secrets` و `operator.write` محدود است؛ دامنه‌های تغییر جفت‌سازی و `operator.admin` همچنان به یک جفت‌سازی operator جداگانه و تأییدشده یا جریان توکن نیاز دارند.
- جفت‌سازی موبایل برای URLهای Gateway از نوع Tailscale/عمومی `ws://` به‌صورت بسته شکست می‌خورد. نشانی‌های LAN خصوصی و میزبان‌های Bonjour با پسوند `.local` همچنان روی `ws://` پشتیبانی می‌شوند، اما مسیرهای موبایل Tailscale/عمومی باید از Tailscale Serve/Funnel یا یک URL Gateway از نوع `wss://` استفاده کنند.
- با `--remote`، OpenClaw به `gateway.remote.url` یا
  `gateway.tailscale.mode=serve|funnel` نیاز دارد.
- با `--remote`، اگر اعتبارنامه‌های راه دورِ عملاً فعال به‌صورت SecretRefs پیکربندی شده باشند و شما `--token` یا `--password` را ارسال نکنید، فرمان آن‌ها را از اسنپ‌شات فعال Gateway resolve می‌کند. اگر Gateway در دسترس نباشد، فرمان سریعاً شکست می‌خورد.
- بدون `--remote`، وقتی هیچ بازنویسی احراز هویت CLI ارسال نشده باشد، SecretRefs احراز هویت Gateway محلی resolve می‌شوند:
  - `gateway.auth.token` زمانی resolve می‌شود که احراز هویت توکنی بتواند برنده شود (`gateway.auth.mode="token"` صریح یا حالت استنباط‌شده‌ای که در آن هیچ منبع گذرواژه‌ای برنده نمی‌شود).
  - `gateway.auth.password` زمانی resolve می‌شود که احراز هویت گذرواژه‌ای بتواند برنده شود (`gateway.auth.mode="password"` صریح یا حالت استنباط‌شده بدون توکن برنده از احراز هویت/محیط).
- اگر هم `gateway.auth.token` و هم `gateway.auth.password` پیکربندی شده باشند (از جمله SecretRefs) و `gateway.auth.mode` تنظیم نشده باشد، resolve کردن کد راه‌اندازی تا زمانی که mode صراحتاً تنظیم شود شکست می‌خورد.
- نکته ناهمخوانی نسخه Gateway: این مسیر فرمان به Gatewayای نیاز دارد که از `secrets.resolve` پشتیبانی کند؛ Gatewayهای قدیمی‌تر خطای روش ناشناخته برمی‌گردانند.
- برنامه‌های رسمی iOS و Android مربوط به OpenClaw زمانی که فراداده کد راه‌اندازی‌شان مطابقت داشته باشد، به‌صورت خودکار متصل می‌شوند. اگر درخواستی معلق بماند (برای مثال، برای یک کلاینت غیررسمی یا فراداده نامنطبق)، آن را با موارد زیر بررسی و تأیید کنید:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## مرتبط

- [مرجع CLI](/fa/cli)
- [جفت‌سازی](/fa/cli/pairing)
