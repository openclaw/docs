---
read_when:
    - اجرای میزبان Node بدون رابط کاربری
    - جفت‌سازی یک گره غیر macOS برای system.run
summary: مرجع CLI برای `openclaw node` (میزبان نود بدون رابط گرافیکی)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:12:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

یک **میزبان Node بدون رابط گرافیکی** اجرا کنید که به Gateway WebSocket متصل می‌شود و
`system.run` / `system.which` را روی این دستگاه ارائه می‌کند.

## چرا از میزبان Node استفاده کنیم؟

وقتی می‌خواهید عامل‌ها **فرمان‌ها را روی دستگاه‌های دیگر** در شبکه شما اجرا کنند،
بدون اینکه یک برنامه همراه کامل macOS را آنجا نصب کنید، از میزبان Node استفاده کنید.

موارد استفاده رایج:

- اجرای فرمان‌ها روی دستگاه‌های Linux/Windows راه دور (سرورهای ساخت، دستگاه‌های آزمایشگاه، NAS).
- نگه‌داشتن اجرای فرمان به‌صورت **sandboxed** روی gateway، اما واگذاری اجراهای تأییدشده به میزبان‌های دیگر.
- فراهم‌کردن یک هدف اجرای سبک و بدون رابط گرافیکی برای خودکارسازی یا گره‌های CI.

اجرا همچنان توسط **تأییدیه‌های exec** و فهرست‌های مجاز به‌ازای هر عامل روی میزبان
Node محافظت می‌شود، بنابراین می‌توانید دسترسی فرمان را محدود و صریح نگه دارید.

## پروکسی مرورگر (بدون پیکربندی)

اگر `browser.enabled` روی گره غیرفعال نشده باشد، میزبان‌های Node به‌طور خودکار یک پروکسی مرورگر را اعلام می‌کنند. این امکان را می‌دهد که عامل بدون پیکربندی اضافی، از خودکارسازی مرورگر روی آن گره استفاده کند.

به‌صورت پیش‌فرض، پروکسی سطح پروفایل مرورگر عادی گره را ارائه می‌کند. اگر
`nodeHost.browserProxy.allowProfiles` را تنظیم کنید، پروکسی محدودکننده می‌شود:
هدف‌گیری پروفایل‌هایی که در فهرست مجاز نیستند رد می‌شود، و مسیرهای ایجاد/حذف
پروفایل پایدار از طریق پروکسی مسدود می‌شوند.

در صورت نیاز آن را روی گره غیرفعال کنید:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## اجرا (پیش‌زمینه)

```bash
openclaw node run --host <gateway-host> --port 18789
```

گزینه‌ها:

- `--host <host>`: میزبان Gateway WebSocket (پیش‌فرض: `127.0.0.1`)
- `--port <port>`: پورت Gateway WebSocket (پیش‌فرض: `18789`)
- `--context-path <path>`: مسیر زمینه Gateway WebSocket (برای مثال `/openclaw-gw`). به URL مربوط به WebSocket افزوده می‌شود.
- `--tls`: استفاده از TLS برای اتصال gateway
- `--tls-fingerprint <sha256>`: اثرانگشت مورد انتظار گواهی TLS (sha256)
- `--node-id <id>`: بازنویسی شناسه گره (توکن جفت‌سازی را پاک می‌کند)
- `--display-name <name>`: بازنویسی نام نمایشی گره

## احراز هویت Gateway برای میزبان Node

`openclaw node run` و `openclaw node install` احراز هویت gateway را از config/env تعیین می‌کنند (هیچ پرچم `--token`/`--password` روی فرمان‌های node وجود ندارد):

- ابتدا `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` بررسی می‌شوند.
- سپس fallback پیکربندی محلی: `gateway.auth.token` / `gateway.auth.password`.
- در حالت محلی، میزبان Node عمداً `gateway.remote.token` / `gateway.remote.password` را به ارث نمی‌برد.
- اگر `gateway.auth.token` / `gateway.auth.password` به‌طور صریح از طریق SecretRef پیکربندی شده و حل‌نشده باشد، حل احراز هویت node به‌صورت fail-closed شکست می‌خورد (بدون پوشاندن با fallback راه دور).
- در `gateway.mode=remote`، فیلدهای مشتری راه دور (`gateway.remote.token` / `gateway.remote.password`) نیز طبق قواعد تقدم راه دور واجد شرایط هستند.
- حل احراز هویت میزبان Node فقط متغیرهای محیطی `OPENCLAW_GATEWAY_*` را می‌پذیرد.

برای Nodeای که به یک Gateway با متن ساده `ws://` متصل می‌شود، loopback، نشانی‌های IP خصوصی
literal، `.local`، و میزبان‌های Tailnet `*.ts.net` پذیرفته می‌شوند. برای نام‌های
private-DNS مورد اعتماد دیگر، `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را تنظیم کنید؛ بدون
آن، راه‌اندازی node به‌صورت fail-closed شکست می‌خورد و از شما می‌خواهد از `wss://`، یک تونل SSH، یا
Tailscale استفاده کنید. این یک opt-in در محیط فرایند است، نه یک کلید پیکربندی
`openclaw.json`.
وقتی `openclaw node install` در محیط فرمان نصب موجود باشد، آن را در سرویس Node تحت نظارت ذخیره می‌کند.

## سرویس (پس‌زمینه)

یک میزبان Node بدون رابط گرافیکی را به‌عنوان سرویس کاربر نصب کنید.

```bash
openclaw node install --host <gateway-host> --port 18789
```

گزینه‌ها:

- `--host <host>`: میزبان Gateway WebSocket (پیش‌فرض: `127.0.0.1`)
- `--port <port>`: پورت Gateway WebSocket (پیش‌فرض: `18789`)
- `--context-path <path>`: مسیر زمینه Gateway WebSocket (برای مثال `/openclaw-gw`). به URL مربوط به WebSocket افزوده می‌شود.
- `--tls`: استفاده از TLS برای اتصال gateway
- `--tls-fingerprint <sha256>`: اثرانگشت مورد انتظار گواهی TLS (sha256)
- `--node-id <id>`: بازنویسی شناسه گره (توکن جفت‌سازی را پاک می‌کند)
- `--display-name <name>`: بازنویسی نام نمایشی گره
- `--runtime <runtime>`: runtime سرویس (`node` یا `bun`)
- `--force`: نصب دوباره/بازنویسی در صورت نصب بودن

مدیریت سرویس:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

از `openclaw node run` برای میزبان Node در پیش‌زمینه استفاده کنید (بدون سرویس).

فرمان‌های سرویس برای خروجی قابل‌خواندن توسط ماشین، `--json` را می‌پذیرند.

میزبان Node راه‌اندازی مجدد Gateway و بسته‌شدن‌های شبکه را درون همان فرایند دوباره تلاش می‌کند. اگر
Gateway یک توقف نهایی احراز هویت مربوط به token/password/bootstrap گزارش کند، میزبان Node
جزئیات بسته‌شدن را ثبت می‌کند و با کد غیرصفر خارج می‌شود تا launchd/systemd بتواند آن را با
پیکربندی و اعتبارنامه‌های تازه دوباره راه‌اندازی کند. توقف‌های نیازمند جفت‌سازی در جریان
پیش‌زمینه باقی می‌مانند تا درخواست معلق بتواند تأیید شود.

## جفت‌سازی

اولین اتصال یک درخواست جفت‌سازی دستگاه معلق (`role: node`) روی Gateway ایجاد می‌کند.
آن را از این طریق تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

در شبکه‌های Node با کنترل سخت‌گیرانه، اپراتور Gateway می‌تواند به‌طور صریح
برای تأیید خودکار جفت‌سازی بار اول Node از CIDRهای مورد اعتماد opt in کند:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

این قابلیت به‌صورت پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه `role: node` بدون
scopeهای درخواستی اعمال می‌شود. مشتریان operator/browser، Control UI، WebChat، و ارتقاهای role،
scope، metadata، یا public-key همچنان به تأیید دستی نیاز دارند.

اگر node با جزئیات احراز هویت تغییریافته (role/scopes/public key) دوباره جفت‌سازی را تلاش کند،
درخواست معلق قبلی کنار گذاشته می‌شود و یک `requestId` جدید ایجاد می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

میزبان Node شناسه node، توکن، نام نمایشی، و اطلاعات اتصال gateway خود را در
`~/.openclaw/node.json` ذخیره می‌کند.

## تأییدیه‌های exec

`system.run` با تأییدیه‌های exec محلی کنترل می‌شود:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`، یا
  `~/.openclaw/exec-approvals.json` وقتی متغیر تنظیم نشده باشد
- [تأییدیه‌های exec](/fa/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (ویرایش از Gateway)

برای exec ناهمگام تأییدشده روی node، OpenClaw پیش از درخواست تأیید یک `systemRunPlan` canonical آماده می‌کند.
ارسال بعدی `system.run` که تأیید شده است همان طرح ذخیره‌شده را دوباره استفاده می‌کند،
بنابراین ویرایش‌های فیلدهای command/cwd/session پس از ایجاد درخواست تأیید،
به‌جای تغییر آنچه node اجرا می‌کند، رد می‌شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [گره‌ها](/fa/nodes)
