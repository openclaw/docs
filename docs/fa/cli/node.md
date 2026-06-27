---
read_when:
    - اجرای میزبان Node بدون رابط کاربری
    - جفت‌سازی یک گره غیر macOS برای system.run
summary: مرجع CLI برای `openclaw node` (میزبان Node بدون رابط کاربری)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:26:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

یک **میزبان Node بدون رابط گرافیکی** اجرا کنید که به WebSocket Gateway وصل می‌شود و
`system.run` / `system.which` را روی این ماشین در دسترس قرار می‌دهد.

## چرا از میزبان Node استفاده کنیم؟

وقتی می‌خواهید عامل‌ها **فرمان‌ها را روی ماشین‌های دیگر** در شبکه‌تان اجرا کنند،
بدون اینکه یک برنامه همراه کامل macOS را آنجا نصب کنید، از میزبان Node استفاده کنید.

موارد استفاده رایج:

- اجرای فرمان‌ها روی ماشین‌های Linux/Windows راه‌دور (سرورهای ساخت، ماشین‌های آزمایشگاه، NAS).
- نگه داشتن exec به‌صورت **sandboxed** روی Gateway، اما واگذاری اجراهای تأییدشده به میزبان‌های دیگر.
- فراهم کردن یک هدف اجرای سبک و بدون رابط گرافیکی برای اتوماسیون یا گره‌های CI.

اجرا همچنان با **تأییدیه‌های exec** و فهرست‌های مجاز به‌ازای هر عامل روی
میزبان Node محافظت می‌شود، بنابراین می‌توانید دسترسی فرمان را محدود و صریح نگه دارید.

## پروکسی مرورگر (بدون پیکربندی)

اگر `browser.enabled` روی Node غیرفعال نشده باشد، میزبان‌های Node به‌صورت خودکار یک پروکسی مرورگر را اعلام می‌کنند. این اجازه می‌دهد عامل بدون پیکربندی اضافی از اتوماسیون مرورگر روی آن Node استفاده کند.

به‌صورت پیش‌فرض، پروکسی سطح پروفایل عادی مرورگر Node را در دسترس قرار می‌دهد. اگر
`nodeHost.browserProxy.allowProfiles` را تنظیم کنید، پروکسی محدودکننده می‌شود:
هدف‌گیری پروفایل‌های خارج از فهرست مجاز رد می‌شود، و مسیرهای ایجاد/حذف پروفایل
ماندگار از طریق پروکسی مسدود می‌شوند.

در صورت نیاز آن را روی Node غیرفعال کنید:

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
- `--tls`: استفاده از TLS برای اتصال Gateway
- `--tls-fingerprint <sha256>`: اثر انگشت مورد انتظار گواهی TLS (sha256)
- `--node-id <id>`: بازنویسی شناسه Node (توکن جفت‌سازی را پاک می‌کند)
- `--display-name <name>`: بازنویسی نام نمایشی Node

## احراز هویت Gateway برای میزبان Node

`openclaw node run` و `openclaw node install` احراز هویت Gateway را از config/env حل می‌کنند (در فرمان‌های Node پرچم `--token`/`--password` وجود ندارد):

- ابتدا `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` بررسی می‌شوند.
- سپس جایگزین config محلی: `gateway.auth.token` / `gateway.auth.password`.
- در حالت محلی، میزبان Node عمداً `gateway.remote.token` / `gateway.remote.password` را به ارث نمی‌برد.
- اگر `gateway.auth.token` / `gateway.auth.password` به‌صورت صریح از طریق SecretRef پیکربندی شده و حل‌نشده باشد، حل احراز هویت Node به‌صورت بسته شکست می‌خورد (بدون پوشاندن با جایگزین راه‌دور).
- در `gateway.mode=remote`، فیلدهای مشتری راه‌دور (`gateway.remote.token` / `gateway.remote.password`) نیز طبق قواعد تقدم راه‌دور واجد شرایط هستند.
- حل احراز هویت میزبان Node فقط متغیرهای محیطی `OPENCLAW_GATEWAY_*` را می‌پذیرد.

برای Nodeای که به یک Gateway متنی ساده `ws://` وصل می‌شود، loopback، آدرس‌های
خصوصی IP، `.local`، و میزبان‌های Tailnet با الگوی `*.ts.net` پذیرفته می‌شوند. برای نام‌های
private-DNS معتمد دیگر، `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` را تنظیم کنید؛ بدون
آن، راه‌اندازی Node به‌صورت بسته شکست می‌خورد و از شما می‌خواهد از `wss://`، یک تونل SSH، یا
Tailscale استفاده کنید. این یک انتخاب صریح در محیط فرایند است، نه یک کلید پیکربندی `openclaw.json`.
`openclaw node install` وقتی در محیط فرمان نصب وجود داشته باشد، آن را در سرویس Node تحت نظارت ماندگار می‌کند.

## سرویس (پس‌زمینه)

یک میزبان Node بدون رابط گرافیکی را به‌عنوان سرویس کاربر نصب کنید.

```bash
openclaw node install --host <gateway-host> --port 18789
```

گزینه‌ها:

- `--host <host>`: میزبان WebSocket Gateway (پیش‌فرض: `127.0.0.1`)
- `--port <port>`: پورت WebSocket Gateway (پیش‌فرض: `18789`)
- `--tls`: استفاده از TLS برای اتصال Gateway
- `--tls-fingerprint <sha256>`: اثر انگشت مورد انتظار گواهی TLS (sha256)
- `--node-id <id>`: بازنویسی شناسه Node (توکن جفت‌سازی را پاک می‌کند)
- `--display-name <name>`: بازنویسی نام نمایشی Node
- `--runtime <runtime>`: runtime سرویس (`node` یا `bun`)
- `--force`: نصب دوباره/بازنویسی اگر قبلاً نصب شده باشد

مدیریت سرویس:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

برای میزبان Node در پیش‌زمینه از `openclaw node run` استفاده کنید (بدون سرویس).

فرمان‌های سرویس برای خروجی قابل خواندن توسط ماشین `--json` را می‌پذیرند.

میزبان Node راه‌اندازی دوباره Gateway و بسته شدن شبکه را درون فرایند دوباره امتحان می‌کند. اگر
Gateway یک توقف نهایی احراز هویت توکن/گذرواژه/bootstrap گزارش کند، میزبان Node
جزئیات بسته شدن را ثبت می‌کند و با کد غیرصفر خارج می‌شود تا launchd/systemd بتواند آن را با
config و اعتبارنامه‌های تازه دوباره راه‌اندازی کند. توقف‌های نیازمند جفت‌سازی در جریان پیش‌زمینه
باقی می‌مانند تا درخواست در انتظار بتواند تأیید شود.

## جفت‌سازی

اولین اتصال یک درخواست جفت‌سازی دستگاه در انتظار (`role: node`) روی Gateway ایجاد می‌کند.
آن را از طریق زیر تأیید کنید:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

در شبکه‌های Node به‌شدت کنترل‌شده، اپراتور Gateway می‌تواند صریحاً پذیرش خودکار
جفت‌سازی نخستین‌بار Node از CIDRهای معتمد را فعال کند:

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

این به‌صورت پیش‌فرض غیرفعال است. فقط برای جفت‌سازی تازه `role: node` بدون
scopeهای درخواستی اعمال می‌شود. مشتری‌های اپراتور/مرورگر، Control UI، WebChat، و ارتقاهای نقش،
scope، فراداده، یا کلید عمومی همچنان نیازمند تأیید دستی هستند.

اگر Node با جزئیات احراز هویت تغییرکرده (نقش/scopeها/کلید عمومی) جفت‌سازی را دوباره امتحان کند،
درخواست در انتظار قبلی کنار گذاشته می‌شود و یک `requestId` جدید ایجاد می‌شود.
پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

میزبان Node شناسه Node، توکن، نام نمایشی، و اطلاعات اتصال Gateway خود را در
`~/.openclaw/node.json` ذخیره می‌کند.

## تأییدیه‌های exec

`system.run` با تأییدیه‌های محلی exec کنترل می‌شود:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`، یا
  `~/.openclaw/exec-approvals.json` وقتی متغیر تنظیم نشده باشد
- [تأییدیه‌های exec](/fa/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (ویرایش از Gateway)

برای exec ناهمگام Node تأییدشده، OpenClaw پیش از اعلان، یک `systemRunPlan` کانونی آماده می‌کند.
forward بعدی `system.run` تأییدشده همان طرح ذخیره‌شده را دوباره استفاده می‌کند،
بنابراین ویرایش‌های فیلدهای command/cwd/session پس از ایجاد درخواست تأیید، به‌جای تغییر دادن آنچه Node اجرا می‌کند، رد می‌شوند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [Nodeها](/fa/nodes)
