---
read_when:
    - شما یک gateway کانتینری‌شده با Podman به‌جای Docker می‌خواهید
summary: اجرای OpenClaw در یک کانتینر Podman بدون روت
title: Podman
x-i18n:
    generated_at: "2026-06-27T18:00:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway را در یک کانتینر Podman بدون روت اجرا کنید که توسط کاربر غیرروت فعلی شما مدیریت می‌شود.

مدل مورد نظر این است:

- Podman کانتینر Gateway را اجرا می‌کند.
- CLI میزبان `openclaw` لایه کنترل است.
- وضعیت پایدار به‌صورت پیش‌فرض روی میزبان و زیر `~/.openclaw` قرار دارد.
- مدیریت روزمره به‌جای `sudo -u openclaw`، `podman exec`، یا یک کاربر سرویس جداگانه، از `openclaw --container <name> ...` استفاده می‌کند.

## پیش‌نیازها

- **Podman** در حالت بدون روت
- **OpenClaw CLI** نصب‌شده روی میزبان
- **اختیاری:** `systemd --user` اگر راه‌اندازی خودکار مدیریت‌شده با Quadlet می‌خواهید
- **اختیاری:** `sudo` فقط اگر برای پایداری پس از بوت روی یک میزبان بدون نمایشگر، `loginctl enable-linger "$(whoami)"` می‌خواهید

## شروع سریع

<Steps>
  <Step title="راه‌اندازی یک‌باره">
    از ریشه مخزن، `./scripts/podman/setup.sh` را اجرا کنید.
  </Step>

  <Step title="شروع کانتینر Gateway">
    کانتینر را با `./scripts/run-openclaw-podman.sh launch` شروع کنید.
  </Step>

  <Step title="اجرای راه‌اندازی اولیه داخل کانتینر">
    `./scripts/run-openclaw-podman.sh launch setup` را اجرا کنید، سپس `http://127.0.0.1:18789/` را باز کنید.
  </Step>

  <Step title="مدیریت کانتینر در حال اجرا از CLI میزبان">
    `OPENCLAW_CONTAINER=openclaw` را تنظیم کنید، سپس از دستورهای عادی `openclaw` روی میزبان استفاده کنید.
  </Step>
</Steps>

جزئیات راه‌اندازی:

- `./scripts/podman/setup.sh` به‌صورت پیش‌فرض `openclaw:local` را در انبار Podman بدون روت شما می‌سازد، یا اگر `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` را تنظیم کرده باشید از آن استفاده می‌کند.
- اگر `~/.openclaw/openclaw.json` وجود نداشته باشد، آن را با `gateway.mode: "local"` ایجاد می‌کند.
- اگر `~/.openclaw/.env` وجود نداشته باشد، آن را با `OPENCLAW_GATEWAY_TOKEN` ایجاد می‌کند.
- برای اجراهای دستی، ابزار کمکی فقط یک allowlist کوچک از کلیدهای مرتبط با Podman را از `~/.openclaw/.env` می‌خواند و متغیرهای محیطی زمان اجرا را به‌صورت صریح به کانتینر می‌دهد؛ کل فایل env را به Podman نمی‌دهد.

راه‌اندازی مدیریت‌شده با Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet گزینه‌ای فقط مخصوص Linux است، چون به سرویس‌های کاربری systemd وابسته است.

همچنین می‌توانید `OPENCLAW_PODMAN_QUADLET=1` را تنظیم کنید.

متغیرهای محیطی اختیاری برای ساخت/راه‌اندازی:

- `OPENCLAW_IMAGE` یا `OPENCLAW_PODMAN_IMAGE` -- به‌جای ساختن `openclaw:local`، از یک ایمیج موجود/دریافت‌شده استفاده کنید
- `OPENCLAW_IMAGE_APT_PACKAGES` -- هنگام ساخت ایمیج، بسته‌های apt اضافی نصب کنید (همچنین `OPENCLAW_DOCKER_APT_PACKAGES` قدیمی را می‌پذیرد)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- هنگام ساخت ایمیج، بسته‌های Python اضافی نصب کنید؛ نسخه‌ها را pin کنید و فقط از package indexهایی استفاده کنید که به آن‌ها اعتماد دارید
- `OPENCLAW_EXTENSIONS` -- وابستگی‌های Plugin را هنگام ساخت از پیش نصب کنید
- `OPENCLAW_INSTALL_BROWSER` -- Chromium و Xvfb را برای خودکارسازی مرورگر از پیش نصب کنید (برای فعال‌سازی روی `1` تنظیم کنید)

شروع کانتینر:

```bash
./scripts/run-openclaw-podman.sh launch
```

این اسکریپت کانتینر را با uid/gid فعلی شما و `--userns=keep-id` شروع می‌کند و وضعیت OpenClaw شما را به کانتینر bind-mount می‌کند.

راه‌اندازی اولیه:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

سپس `http://127.0.0.1:18789/` را باز کنید و از توکن موجود در `~/.openclaw/.env` استفاده کنید.

احراز هویت مدل در Podman:

- هنگام راه‌اندازی، از احراز هویت مدیریت‌شده توسط OpenClaw استفاده کنید: کلیدهای API Anthropic برای Anthropic، یا احراز هویت OAuth مرورگر/کد دستگاه OpenAI Codex برای OpenAI پشتیبانی‌شده توسط Codex.
- راه‌انداز Podman خانه‌های اعتبارنامه CLI میزبان مانند `~/.claude` یا `~/.codex` را داخل کانتینر راه‌اندازی یا Gateway mount نمی‌کند.
- ورودهای CLI موجود روی میزبان مسیرهای سهولت استفاده روی همان میزبان هستند. برای نصب‌های کانتینری، احراز هویت ارائه‌دهنده را در وضعیت mount‌شده `~/.openclaw` نگه دارید که راه‌اندازی آن را مدیریت می‌کند.

پیش‌فرض CLI میزبان:

```bash
export OPENCLAW_CONTAINER=openclaw
```

سپس دستورهایی مانند این‌ها به‌صورت خودکار داخل همان کانتینر اجرا می‌شوند:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

در macOS، ماشین Podman ممکن است باعث شود مرورگر برای Gateway غیرمحلی به نظر برسد.
اگر Control UI پس از راه‌اندازی خطاهای احراز هویت دستگاه گزارش کرد، از راهنمای Tailscale در
[Podman و Tailscale](#podman--tailscale) استفاده کنید.

<a id="podman--tailscale"></a>

## Podman و Tailscale

برای HTTPS یا دسترسی مرورگر از راه دور، مستندات اصلی Tailscale را دنبال کنید.

نکته مخصوص Podman:

- میزبان publish در Podman را روی `127.0.0.1` نگه دارید.
- `tailscale serve` مدیریت‌شده توسط میزبان را به `openclaw gateway --tailscale serve` ترجیح دهید.
- در macOS، اگر زمینه احراز هویت دستگاه مرورگر محلی قابل اتکا نیست، به‌جای راه‌حل‌های موقت تونل محلی، از دسترسی Tailscale استفاده کنید.

ببینید:

- [Tailscale](/fa/gateway/tailscale)
- [Control UI](/fa/web/control-ui)

## Systemd (Quadlet، اختیاری)

اگر `./scripts/podman/setup.sh --quadlet` را اجرا کرده باشید، راه‌اندازی یک فایل Quadlet را در این مسیر نصب می‌کند:

```bash
~/.config/containers/systemd/openclaw.container
```

دستورهای مفید:

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
- **فایل توکن:** `~/.openclaw/.env`
- **ابزار کمکی اجرا:** `./scripts/run-openclaw-podman.sh`

اسکریپت اجرا و Quadlet وضعیت میزبان را داخل کانتینر bind-mount می‌کنند:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

به‌صورت پیش‌فرض این‌ها دایرکتوری‌های میزبان هستند، نه وضعیت anonymous کانتینر، بنابراین
`openclaw.json`، فایل‌های `auth-profiles.json` هر agent، وضعیت کانال/ارائه‌دهنده،
sessionها، و workspace پس از جایگزینی کانتینر باقی می‌مانند.
راه‌اندازی Podman همچنین `gateway.controlUi.allowedOrigins` را برای `127.0.0.1` و `localhost` روی پورت Gateway منتشرشده مقداردهی اولیه می‌کند تا dashboard محلی با bind غیر-loopback کانتینر کار کند.

متغیرهای محیطی مفید برای راه‌انداز دستی:

- `OPENCLAW_PODMAN_CONTAINER` -- نام کانتینر (`openclaw` به‌صورت پیش‌فرض)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- ایمیجی که اجرا می‌شود
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- پورت میزبان نگاشت‌شده به `18789` کانتینر
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- پورت میزبان نگاشت‌شده به `18790` کانتینر
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- رابط میزبان برای پورت‌های منتشرشده؛ پیش‌فرض `127.0.0.1` است
- `OPENCLAW_GATEWAY_BIND` -- حالت bind مربوط به Gateway داخل کانتینر؛ پیش‌فرض `lan` است
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (پیش‌فرض)، `auto`، یا `host`

راه‌انداز دستی پیش از نهایی کردن پیش‌فرض‌های کانتینر/ایمیج، `~/.openclaw/.env` را می‌خواند، بنابراین می‌توانید این مقادیر را آنجا پایدار کنید.

اگر از `OPENCLAW_CONFIG_DIR` یا `OPENCLAW_WORKSPACE_DIR` غیرپیش‌فرض استفاده می‌کنید، همان متغیرها را هم برای `./scripts/podman/setup.sh` و هم برای دستورهای بعدی `./scripts/run-openclaw-podman.sh launch` تنظیم کنید. راه‌انداز repo-local بازنویسی‌های مسیر سفارشی را بین shellها پایدار نمی‌کند.

نکته Quadlet:

- سرویس Quadlet تولیدشده عمداً یک شکل پیش‌فرض ثابت و سخت‌سازی‌شده را نگه می‌دارد: پورت‌های منتشرشده روی `127.0.0.1`، `--bind lan` داخل کانتینر، و فضای نام کاربری `keep-id`.
- `OPENCLAW_NO_RESPAWN=1`، `Restart=on-failure`، و `TimeoutStartSec=300` را pin می‌کند.
- هر دو `127.0.0.1:18789:18789` (Gateway) و `127.0.0.1:18790:18790` (bridge) را منتشر می‌کند.
- `~/.openclaw/.env` را به‌عنوان `EnvironmentFile` زمان اجرا برای مقادیری مانند `OPENCLAW_GATEWAY_TOKEN` می‌خواند، اما allowlist بازنویسی مخصوص Podman راه‌انداز دستی را مصرف نمی‌کند.
- اگر به پورت‌های publish سفارشی، میزبان publish سفارشی، یا flagهای دیگر اجرای کانتینر نیاز دارید، از راه‌انداز دستی استفاده کنید یا مستقیماً `~/.config/containers/systemd/openclaw.container` را ویرایش کنید، سپس سرویس را reload و restart کنید.

## دستورهای مفید

- **لاگ‌های کانتینر:** `podman logs -f openclaw`
- **توقف کانتینر:** `podman stop openclaw`
- **حذف کانتینر:** `podman rm -f openclaw`
- **باز کردن URL dashboard از CLI میزبان:** `openclaw dashboard --no-open`
- **سلامت/وضعیت از طریق CLI میزبان:** `openclaw gateway status --deep` (probe RPC + اسکن سرویس اضافی)

## عیب‌یابی

- **Permission denied (EACCES) روی پیکربندی یا workspace:** کانتینر به‌صورت پیش‌فرض با `--userns=keep-id` و `--user <your uid>:<your gid>` اجرا می‌شود. مطمئن شوید مسیرهای پیکربندی/workspace میزبان متعلق به کاربر فعلی شما هستند.
- **شروع Gateway مسدود شده است (`gateway.mode=local` موجود نیست):** مطمئن شوید `~/.openclaw/openclaw.json` وجود دارد و `gateway.mode="local"` را تنظیم می‌کند. اگر موجود نباشد، `scripts/podman/setup.sh` آن را ایجاد می‌کند.
- **دستورهای CLI کانتینر به مقصد اشتباه برخورد می‌کنند:** به‌صورت صریح از `openclaw --container <name> ...` استفاده کنید، یا `OPENCLAW_CONTAINER=<name>` را در shell خود export کنید.
- **`openclaw update` با `--container` شکست می‌خورد:** مورد انتظار است. ایمیج را دوباره بسازید/دریافت کنید، سپس کانتینر یا سرویس Quadlet را restart کنید.
- **سرویس Quadlet شروع نمی‌شود:** `systemctl --user daemon-reload` را اجرا کنید، سپس `systemctl --user start openclaw.service`. روی سیستم‌های بدون نمایشگر، ممکن است به `sudo loginctl enable-linger "$(whoami)"` هم نیاز داشته باشید.
- **SELinux جلوی bind mountها را می‌گیرد:** رفتار mount پیش‌فرض را دست‌نخورده بگذارید؛ راه‌انداز وقتی SELinux در حالت enforcing یا permissive باشد، روی Linux به‌صورت خودکار `:Z` را اضافه می‌کند.

## مرتبط

- [Docker](/fa/install/docker)
- [فرایند پس‌زمینه Gateway](/fa/gateway/background-process)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
