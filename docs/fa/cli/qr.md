---
read_when:
    - می‌خواهید یک برنامه Node موبایل را به‌سرعت با یک Gateway جفت کنید
    - برای اشتراک‌گذاری از راه دور/دستی، به خروجی کد راه‌اندازی نیاز دارید
summary: مرجع CLI برای `openclaw qr` (تولید کد QR جفت‌سازی موبایل + کد راه‌اندازی)
title: کیوآر
x-i18n:
    generated_at: "2026-07-12T09:46:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

از پیکربندی فعلی Gateway خود، یک کد QR برای جفت‌سازی موبایل و یک کد راه‌اندازی ایجاد کنید.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

برنامه‌های رسمی OpenClaw برای iOS و Android، هنگامی که فرادادهٔ کد راه‌اندازی آن‌ها مطابقت داشته باشد، به‌طور خودکار متصل می‌شوند. اگر درخواستی در انتظار باقی بماند (برای مثال، برای یک کلاینت غیررسمی یا فرادادهٔ نامطابق)، آن را بررسی و تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## گزینه‌ها

- `--remote`: ‏`gateway.remote.url` را ترجیح می‌دهد؛ اگر آن URL تنظیم نشده باشد، به `gateway.tailscale.mode=serve|funnel` بازمی‌گردد. `publicUrl` در Plugin ‏`device-pair` را نادیده می‌گیرد.
- `--url <url>`: نشانی Gateway استفاده‌شده در بار داده را بازنویسی می‌کند
- `--public-url <url>`: نشانی عمومی استفاده‌شده در بار داده را بازنویسی می‌کند
- `--token <token>`: توکن Gateway را که جریان راه‌اندازی با آن احراز هویت می‌کند، بازنویسی می‌کند
- `--password <password>`: گذرواژهٔ Gateway را که جریان راه‌اندازی با آن احراز هویت می‌کند، بازنویسی می‌کند
- `--setup-code-only`: فقط کد راه‌اندازی را چاپ می‌کند
- `--no-ascii`: رندر کد QR به‌صورت ASCII را انجام نمی‌دهد
- `--json`: خروجی JSON تولید می‌کند (`setupCode`، `gatewayUrl`، ‏`gatewayUrls` اختیاری، `auth`، `urlSource`)

`--token` و `--password` را نمی‌توان هم‌زمان استفاده کرد.

## محتوای کد راه‌اندازی

کد راه‌اندازی به‌جای توکن/گذرواژهٔ مشترک Gateway، یک `bootstrapToken` مبهم و کوتاه‌عمر را حمل می‌کند. جریان راه‌اندازی داخلی موارد زیر را صادر می‌کند:

- یک توکن اصلی `node` با `scopes: []`
- یک توکن انتقال محدود `operator` که فقط به `operator.approvals`، ‏`operator.read`، ‏`operator.talk.secrets` و `operator.write` محدود است

دامنه‌های تغییر جفت‌سازی و `operator.admin` همچنان به یک جریان جداگانهٔ جفت‌سازی تأییدشدهٔ عملگر یا توکن نیاز دارند.

## تفکیک نشانی Gateway

جفت‌سازی موبایل برای نشانی‌های `ws://` عمومی یا Tailscale مربوط به Gateway به‌صورت بسته و امن شکست می‌خورد: برای آن‌ها از Tailscale Serve/Funnel یا نشانی `wss://` برای Gateway استفاده کنید. نشانی‌های LAN خصوصی و میزبان‌های Bonjour با پسوند `.local` همچنان از طریق `ws://` ساده پشتیبانی می‌شوند.

هنگامی که نشانی انتخاب‌شدهٔ Gateway از `gateway.bind=lan` به‌دست می‌آید، OpenClaw مسیرهای پایدار `tailscale serve status --json` را نیز بررسی می‌کند. هر ریشهٔ HTTPS Serve که درگاه local loopback مربوط به Gateway فعال را پروکسی کند، به‌عنوان مسیر جایگزین گنجانده می‌شود. فرمان QR این مسیر جایگزین را فقط برای `lan` اضافه می‌کند؛ `custom` و `tailnet` مسیرهایی را که صراحتاً اعلام کرده‌اند حفظ می‌کنند. کلاینت‌های فعلی iOS مسیرهای اعلام‌شده را به‌ترتیب بررسی می‌کنند و نخستین مسیر قابل‌دسترسی را ذخیره می‌کنند؛ فیلد قدیمی `url` برای کلاینت‌های قدیمی‌تر بدون تغییر باقی می‌ماند.

با `--remote`، وجود یکی از `gateway.remote.url` یا `gateway.tailscale.mode=serve|funnel` الزامی است.

## تفکیک احراز هویت (بدون `--remote`)

وقتی هیچ بازنویسی احراز هویت CLI ارائه نشده باشد، SecretRefهای احراز هویت Gateway محلی به‌شکل زیر تفکیک می‌شوند:

| شرط                                                                                                                             | به این مقدار تفکیک می‌شود                 |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`، یا حالت استنباط‌شده بدون منبع گذرواژهٔ غالب                                                         | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`، یا حالت استنباط‌شده بدون توکن غالب از احراز هویت/متغیر محیطی                                     | `gateway.auth.password`                   |
| هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده‌اند (از جمله SecretRefها) و `gateway.auth.mode` تنظیم نشده است | شکست می‌خورد؛ `gateway.auth.mode` را صریحاً تنظیم کنید |

## تفکیک احراز هویت (`--remote`)

اگر اعتبارنامه‌های راه دورِ عملاً فعال به‌صورت SecretRef پیکربندی شده باشند و نه `--token` و نه `--password` ارائه نشده باشد، فرمان آن‌ها را از عکس فوری فعال Gateway تفکیک می‌کند. اگر Gateway در دسترس نباشد، فرمان فوراً شکست می‌خورد.

<Note>
این مسیر فرمان به Gatewayای نیاز دارد که از متد RPC ‏`secrets.resolve` پشتیبانی کند. Gatewayهای قدیمی‌تر خطای متد ناشناخته برمی‌گردانند.
</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [دستگاه‌ها](/fa/cli/devices)
- [جفت‌سازی](/fa/cli/pairing)
