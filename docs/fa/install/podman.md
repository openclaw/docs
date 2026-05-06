---
read_when:
    - شما یک Gateway کانتینری‌شده با Podman به‌جای Docker می‌خواهید
summary: OpenClaw را در یک کانتینر بدون ریشه Podman اجرا کنید
title: Podman
x-i18n:
    generated_at: "2026-05-06T09:27:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway را در یک کانتینر Podman بدون root اجرا کنید که توسط کاربر غیر root فعلی شما مدیریت می‌شود.

مدل موردنظر این است:

- Podman کانتینر Gateway را اجرا می‌کند.
- CLI میزبان `openclaw` شما سطح کنترل است.
- وضعیت پایدار به‌صورت پیش‌فرض روی میزبان در `~/.openclaw` قرار دارد.
- مدیریت روزمره از `openclaw --container <name> ...` به‌جای `sudo -u openclaw`، `podman exec`، یا یک کاربر سرویس جداگانه استفاده می‌کند.

## پیش‌نیازها

- **Podman** در حالت بدون root
- **OpenClaw CLI** نصب‌شده روی میزبان
- **اختیاری:** `systemd --user` اگر راه‌اندازی خودکار مدیریت‌شده با Quadlet می‌خواهید
- **اختیاری:** `sudo` فقط اگر برای پایداری پس از بوت روی یک میزبان بدون نمایشگر، `loginctl enable-linger "$(whoami)"` را می‌خواهید

## شروع سریع

<Steps>
  <Step title="راه‌اندازی یک‌باره">
    از ریشه repo، `./scripts/podman/setup.sh` را اجرا کنید.
  </Step>

  <Step title="راه‌اندازی کانتینر Gateway">
    کانتینر را با `./scripts/run-openclaw-podman.sh launch` راه‌اندازی کنید.
  </Step>

  <Step title="اجرای onboarding داخل کانتینر">
    `./scripts/run-openclaw-podman.sh launch setup` را اجرا کنید، سپس `http://127.0.0.1:18789/` را باز کنید.
  </Step>

  <Step title="مدیریت کانتینر در حال اجرا از CLI میزبان">
    `OPENCLAW_CONTAINER=openclaw` را تنظیم کنید، سپس از فرمان‌های عادی `openclaw` از میزبان استفاده کنید.
  </Step>
</Steps>

جزئیات راه‌اندازی:

- `./scripts/podman/setup.sh` به‌صورت پیش‌فرض `openclaw:local` را در store بدون root Podman شما می‌سازد، یا اگر `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` را تنظیم کرده باشید از آن استفاده می‌کند.
- اگر `~/.openclaw/openclaw.json` وجود نداشته باشد، آن را با `gateway.mode: "local"` ایجاد می‌کند.
- اگر `~/.openclaw/.env` وجود نداشته باشد، آن را با `OPENCLAW_GATEWAY_TOKEN` ایجاد می‌کند.
- برای اجراهای دستی، helper فقط یک allowlist کوچک از کلیدهای مرتبط با Podman را از `~/.openclaw/.env` می‌خواند و env varهای runtime صریح را به کانتینر پاس می‌دهد؛ فایل env کامل را به Podman نمی‌دهد.

راه‌اندازی مدیریت‌شده با Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet گزینه‌ای فقط برای Linux است، چون به سرویس‌های کاربری systemd وابسته است.

همچنین می‌توانید `OPENCLAW_PODMAN_QUADLET=1` را تنظیم کنید.

env varهای اختیاری build/setup:

- `OPENCLAW_IMAGE` یا `OPENCLAW_PODMAN_IMAGE` -- به‌جای ساختن `openclaw:local` از یک image موجود/دریافت‌شده استفاده کنید
- `OPENCLAW_DOCKER_APT_PACKAGES` -- هنگام ساخت image، بسته‌های apt اضافی نصب کنید
- `OPENCLAW_EXTENSIONS` -- وابستگی‌های plugin را هنگام build از پیش نصب کنید
- `OPENCLAW_INSTALL_BROWSER` -- Chromium و Xvfb را برای اتوماسیون مرورگر از پیش نصب کنید (برای فعال‌سازی روی `1` تنظیم کنید)

راه‌اندازی کانتینر:

```bash
./scripts/run-openclaw-podman.sh launch
```

این script کانتینر را با uid/gid فعلی شما و `--userns=keep-id` شروع می‌کند و وضعیت OpenClaw شما را در کانتینر bind-mount می‌کند.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

سپس `http://127.0.0.1:18789/` را باز کنید و از token موجود در `~/.openclaw/.env` استفاده کنید.

پیش‌فرض CLI میزبان:

```bash
export OPENCLAW_CONTAINER=openclaw
```

سپس فرمان‌هایی مانند این‌ها به‌صورت خودکار داخل آن کانتینر اجرا می‌شوند:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

در macOS، Podman machine ممکن است باعث شود مرورگر برای Gateway غیرمحلی به نظر برسد.
اگر رابط کاربری کنترل پس از launch خطاهای device-auth گزارش کرد، از راهنمای Tailscale در
[Podman و Tailscale](#podman--tailscale) استفاده کنید.

<a id="podman--tailscale"></a>

## Podman و Tailscale

برای HTTPS یا دسترسی مرورگر راه دور، از مستندات اصلی Tailscale پیروی کنید.

نکته مخصوص Podman:

- میزبان publish مربوط به Podman را روی `127.0.0.1` نگه دارید.
- `tailscale serve` مدیریت‌شده توسط میزبان را به `openclaw gateway --tailscale serve` ترجیح دهید.
- در macOS، اگر context احراز هویت دستگاه مرورگر محلی قابل اتکا نیست، به‌جای راهکارهای موقت tunnel محلی، از دسترسی Tailscale استفاده کنید.

ببینید:

- [Tailscale](/fa/gateway/tailscale)
- [رابط کاربری کنترل](/fa/web/control-ui)

## Systemd (Quadlet، اختیاری)

اگر `./scripts/podman/setup.sh --quadlet` را اجرا کرده باشید، setup یک فایل Quadlet را در این مسیر نصب می‌کند:

```bash
~/.config/containers/systemd/openclaw.container
```

فرمان‌های مفید:

- **شروع:** `systemctl --user start openclaw.service`
- **توقف:** `systemctl --user stop openclaw.service`
- **وضعیت:** `systemctl --user status openclaw.service`
- **لاگ‌ها:** `journalctl --user -u openclaw.service -f`

پس از ویرایش فایل Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

برای پایداری پس از بوت روی میزبان‌های SSH/بدون نمایشگر، lingering را برای کاربر فعلی خود فعال کنید:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## پیکربندی، env، و ذخیره‌سازی

- **دایرکتوری پیکربندی:** `~/.openclaw`
- **دایرکتوری workspace:** `~/.openclaw/workspace`
- **فایل token:** `~/.openclaw/.env`
- **helper راه‌اندازی:** `./scripts/run-openclaw-podman.sh`

script راه‌اندازی و Quadlet وضعیت میزبان را در کانتینر bind-mount می‌کنند:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

به‌صورت پیش‌فرض این‌ها دایرکتوری‌های میزبان هستند، نه وضعیت ناشناس کانتینر، بنابراین
`openclaw.json`، فایل‌های `auth-profiles.json` به‌ازای هر agent، وضعیت channel/provider،
sessionها، و workspace پس از جایگزینی کانتینر باقی می‌مانند.
setup مربوط به Podman همچنین `gateway.controlUi.allowedOrigins` را برای `127.0.0.1` و `localhost` روی پورت منتشرشده Gateway مقداردهی اولیه می‌کند تا dashboard محلی با bind غیر loopback کانتینر کار کند.

env varهای مفید برای launcher دستی:

- `OPENCLAW_PODMAN_CONTAINER` -- نام کانتینر (به‌صورت پیش‌فرض `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image برای اجرا
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- پورت میزبان که به `18789` کانتینر map می‌شود
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- پورت میزبان که به `18790` کانتینر map می‌شود
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface میزبان برای پورت‌های منتشرشده؛ پیش‌فرض `127.0.0.1` است
- `OPENCLAW_GATEWAY_BIND` -- حالت bind Gateway داخل کانتینر؛ پیش‌فرض `lan` است
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (پیش‌فرض)، `auto`، یا `host`

launcher دستی پیش از نهایی‌کردن پیش‌فرض‌های کانتینر/image، `~/.openclaw/.env` را می‌خواند، بنابراین می‌توانید این‌ها را آنجا پایدار کنید.

اگر از `OPENCLAW_CONFIG_DIR` یا `OPENCLAW_WORKSPACE_DIR` غیرپیش‌فرض استفاده می‌کنید، همان متغیرها را هم برای `./scripts/podman/setup.sh` و هم برای فرمان‌های بعدی `./scripts/run-openclaw-podman.sh launch` تنظیم کنید. launcher محلی repo، overrideهای مسیر سفارشی را بین shellها پایدار نمی‌کند.

نکته Quadlet:

- سرویس Quadlet تولیدشده عمداً یک شکل پیش‌فرض ثابت و سخت‌گیرانه را حفظ می‌کند: پورت‌های منتشرشده روی `127.0.0.1`، `--bind lan` داخل کانتینر، و namespace کاربری `keep-id`.
- `OPENCLAW_NO_RESPAWN=1`، `Restart=on-failure`، و `TimeoutStartSec=300` را pin می‌کند.
- هر دو `127.0.0.1:18789:18789` (Gateway) و `127.0.0.1:18790:18790` (bridge) را publish می‌کند.
- `~/.openclaw/.env` را به‌عنوان `EnvironmentFile` زمان اجرا برای مقدارهایی مانند `OPENCLAW_GATEWAY_TOKEN` می‌خواند، اما allowlist override مخصوص Podman در launcher دستی را مصرف نمی‌کند.
- اگر به پورت‌های publish سفارشی، میزبان publish، یا flagهای دیگر اجرای کانتینر نیاز دارید، از launcher دستی استفاده کنید یا `~/.config/containers/systemd/openclaw.container` را مستقیماً ویرایش کنید، سپس service را reload و restart کنید.

## فرمان‌های مفید

- **لاگ‌های کانتینر:** `podman logs -f openclaw`
- **توقف کانتینر:** `podman stop openclaw`
- **حذف کانتینر:** `podman rm -f openclaw`
- **باز کردن URL داشبورد از CLI میزبان:** `openclaw dashboard --no-open`
- **سلامت/وضعیت از طریق CLI میزبان:** `openclaw gateway status --deep` (کاوش RPC + اسکن service اضافی)

## عیب‌یابی

- **Permission denied (EACCES) روی config یا workspace:** کانتینر به‌صورت پیش‌فرض با `--userns=keep-id` و `--user <your uid>:<your gid>` اجرا می‌شود. مطمئن شوید مسیرهای config/workspace میزبان تحت مالکیت کاربر فعلی شما هستند.
- **شروع Gateway مسدود شده است (`gateway.mode=local` موجود نیست):** مطمئن شوید `~/.openclaw/openclaw.json` وجود دارد و `gateway.mode="local"` را تنظیم می‌کند. `scripts/podman/setup.sh` اگر این مورد موجود نباشد، آن را ایجاد می‌کند.
- **فرمان‌های CLI کانتینر به مقصد اشتباه می‌خورند:** به‌صورت صریح از `openclaw --container <name> ...` استفاده کنید، یا `OPENCLAW_CONTAINER=<name>` را در shell خود export کنید.
- **`openclaw update` با `--container` شکست می‌خورد:** مورد انتظار است. image را دوباره build/pull کنید، سپس کانتینر یا سرویس Quadlet را restart کنید.
- **سرویس Quadlet شروع نمی‌شود:** `systemctl --user daemon-reload` را اجرا کنید، سپس `systemctl --user start openclaw.service`. روی سیستم‌های بدون نمایشگر شاید به `sudo loginctl enable-linger "$(whoami)"` هم نیاز داشته باشید.
- **SELinux مانع bind mountها می‌شود:** رفتار mount پیش‌فرض را دست‌نخورده بگذارید؛ launcher هنگام enforcing یا permissive بودن SELinux روی Linux، `:Z` را خودکار اضافه می‌کند.

## مرتبط

- [Docker](/fa/install/docker)
- [فرآیند پس‌زمینه Gateway](/fa/gateway/background-process)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
