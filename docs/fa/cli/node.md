---
read_when:
    - اجرای میزبان Node بدون رابط کاربری
    - جفت‌سازی یک Node غیر macOS برای system.run
summary: مرجع CLI برای `openclaw node` (میزبان Node بدون رابط کاربری)
title: Node
x-i18n:
    generated_at: "2026-04-29T22:37:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

یک **میزبان Node بدون رابط گرافیکی** اجرا کنید که به WebSocket Gateway وصل می‌شود و
`system.run` / `system.which` را روی این ماشین در دسترس قرار می‌دهد.

## چرا از میزبان Node استفاده کنیم؟

وقتی می‌خواهید عامل‌ها **روی ماشین‌های دیگر** در شبکه شما دستور اجرا کنند
بدون اینکه یک اپ همراه کامل macOS را آنجا نصب کنید، از میزبان Node استفاده کنید.

موارد استفاده رایج:

- اجرای دستورها روی ماشین‌های Linux/Windows راه‌دور (سرورهای ساخت، ماشین‌های آزمایشگاه، NAS).
- نگه داشتن exec به‌صورت **sandboxed** روی gateway، اما واگذاری اجراهای تأییدشده به میزبان‌های دیگر.
- فراهم کردن یک هدف اجرای سبک و بدون رابط گرافیکی برای خودکارسازی یا نودهای CI.

اجرا همچنان با **تأییدیه‌های exec** و فهرست‌های مجازِ هر عامل روی
میزبان Node محافظت می‌شود، بنابراین می‌توانید دسترسی به دستورها را محدود و صریح نگه دارید.

## پراکسی مرورگر (بدون پیکربندی)

میزبان‌های Node اگر `browser.enabled` روی Node غیرفعال نشده باشد، به‌طور خودکار یک پراکسی مرورگر را اعلام می‌کنند. این به عامل اجازه می‌دهد بدون پیکربندی اضافی از خودکارسازی مرورگر روی آن Node استفاده کند.

به‌طور پیش‌فرض، پراکسی سطح پروفایل معمول مرورگر Node را در دسترس قرار می‌دهد. اگر
`nodeHost.browserProxy.allowProfiles` را تنظیم کنید، پراکسی محدودکننده می‌شود:
هدف‌گیری پروفایل‌هایی که در فهرست مجاز نیستند رد می‌شود، و مسیرهای
ایجاد/حذف پروفایل پایدار از طریق پراکسی مسدود می‌شوند.

در صورت نیاز، آن را روی Node غیرفعال کنید:

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

- `--host <host>`: میزبان WebSocket Gateway (پیش‌فرض: `127.0.0.1`)
- `--port <port>`: پورت WebSocket Gateway (پیش‌فرض: `18789`)
- `--tls`: استفاده از TLS برای اتصال gateway
- `--tls-fingerprint <sha256>`: اثرانگشت مورد انتظار گواهی TLS (sha256)
- `--node-id <id>`: بازنویسی شناسه Node (توکن جفت‌سازی را پاک می‌کند)
- `--display-name <name>`: بازنویسی نام نمایشی Node

## احراز هویت Gateway برای میزبان Node

`openclaw node run` و `openclaw node install` احراز هویت gateway را از config/env حل می‌کنند (بدون پرچم‌های `--token`/`--password` روی دستورهای Node):

- ابتدا `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` بررسی می‌شوند.
- سپس بازگشت به پیکربندی محلی: `gateway.auth.token` / `gateway.auth.password`.
- در حالت محلی، میزبان Node عمداً `gateway.remote.token` / `gateway.remote.password` را به ارث نمی‌برد.
- اگر `gateway.auth.token` / `gateway.auth.password` به‌صراحت از طریق SecretRef پیکربندی شده و حل‌نشده باشد، حل احراز هویت Node بسته شکست می‌خورد (بدون پوشانده شدن توسط بازگشت راه‌دور).
- در `gateway.mode=remote`، فیلدهای کلاینت راه‌دور (`gateway.remote.token` / `gateway.remote.password`) نیز طبق قواعد تقدم راه‌دور واجد شرایط هستند.
- حل احراز هویت میزبان Node فقط متغیرهای محیطی `OPENCLAW_GATEWAY_*` را رعایت می‌کند.

برای یک Node که به Gateway غیر loopback با `ws://` در یک شبکه خصوصی مورد اعتماد
وصل می‌شود، `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را تنظیم کنید. بدون آن، راه‌اندازی Node
بسته شکست می‌خورد و از شما می‌خواهد از `wss://`، تونل SSH، یا Tailscale استفاده کنید.
این یک اعلام رضایت در محیط فرایند است، نه کلید پیکربندی `openclaw.json`.
`openclaw node install` وقتی در محیط دستور نصب وجود داشته باشد، آن را در سرویس Node نظارت‌شده
پایدار می‌کند.

## سرویس (پس‌زمینه)

یک میزبان Node بدون رابط گرافیکی را به‌عنوان سرویس کاربر نصب کنید.

```bash
openclaw node install --host <gateway-host> --port 18789
```

گزینه‌ها:

- `--host <host>`: میزبان WebSocket Gateway (پیش‌فرض: `127.0.0.1`)
- `--port <port>`: پورت WebSocket Gateway (پیش‌فرض: `18789`)
- `--tls`: استفاده از TLS برای اتصال gateway
- `--tls-fingerprint <sha256>`: اثرانگشت مورد انتظار گواهی TLS (sha256)
- `--node-id <id>`: بازنویسی شناسه Node (توکن جفت‌سازی را پاک می‌کند)
- `--display-name <name>`: بازنویسی نام نمایشی Node
- `--runtime <runtime>`: runtime سرویس (`node` یا `bun`)
- `--force`: اگر از قبل نصب شده است، دوباره نصب/بازنویسی کند

مدیریت سرویس:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

برای یک میزبان Node در پیش‌زمینه (بدون سرویس)، از `openclaw node run` استفاده کنید.

دستورهای سرویس برای خروجی قابل خواندن توسط ماشین، `--json` را می‌پذیرند.

میزبان Node راه‌اندازی دوباره Gateway و بسته شدن‌های شبکه را درون فرایند دوباره تلاش می‌کند. اگر
Gateway یک توقف نهایی احراز هویت token/password/bootstrap گزارش کند، میزبان Node
جزئیات بسته شدن را ثبت می‌کند و با کد غیرصفر خارج می‌شود تا launchd/systemd بتواند آن را با
پیکربندی و اعتبارنامه‌های تازه دوباره راه‌اندازی کند. توقف‌های نیازمند جفت‌سازی در جریان
پیش‌زمینه می‌مانند تا درخواست در انتظار بتواند تأیید شود.

## جفت‌سازی

اولین اتصال، یک درخواست جفت‌سازی دستگاه در انتظار (`role: node`) روی Gateway ایجاد می‌کند.
آن را از طریق این دستورها تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

در شبکه‌های Node با کنترل شدید، اپراتور Gateway می‌تواند به‌صراحت اعلام رضایت کند
که جفت‌سازی بار اول Node از CIDRهای مورد اعتماد به‌طور خودکار تأیید شود:

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

این به‌طور پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه `role: node` بدون
scopeهای درخواست‌شده اعمال می‌شود. کلاینت‌های اپراتور/مرورگر، Control UI، WebChat، و ارتقاهای role،
scope، metadata، یا public-key همچنان به تأیید دستی نیاز دارند.

اگر Node با جزئیات احراز هویت تغییرکرده (role/scopes/public key) دوباره برای جفت‌سازی تلاش کند،
درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` تازه ایجاد می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

میزبان Node شناسه Node، توکن، نام نمایشی، و اطلاعات اتصال gateway خود را در
`~/.openclaw/node.json` ذخیره می‌کند.

## تأییدیه‌های exec

`system.run` با تأییدیه‌های exec محلی محافظت می‌شود:

- `~/.openclaw/exec-approvals.json`
- [تأییدیه‌های exec](/fa/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (ویرایش از Gateway)

برای exec ناهمگام تأییدشده روی Node، OpenClaw پیش از درخواست، یک `systemRunPlan` کانونی آماده می‌کند.
ارسال بعدی `system.run` تأییدشده، همان plan ذخیره‌شده را دوباره استفاده می‌کند،
بنابراین ویرایش‌های فیلدهای command/cwd/session پس از ایجاد درخواست تأیید
به‌جای تغییر آنچه Node اجرا می‌کند، رد می‌شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Nodeها](/fa/nodes)
