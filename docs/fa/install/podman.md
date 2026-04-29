---
read_when:
    - می‌خواهید به‌جای Docker یک Gateway کانتینری با Podman داشته باشید
summary: OpenClaw را در یک کانتینر بدون ریشهٔ Podman اجرا کنید
title: Podman
x-i18n:
    generated_at: "2026-04-29T23:06:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

OpenClaw Gateway را در یک کانتینر Podman بدون root اجرا کنید که توسط کاربر غیر root فعلی شما مدیریت می‌شود.

مدل مورد نظر این است:

- Podman کانتینر gateway را اجرا می‌کند.
- CLI میزبان `openclaw` شما صفحه کنترل است.
- وضعیت پایدار به‌طور پیش‌فرض روی میزبان و زیر `~/.openclaw` نگهداری می‌شود.
- مدیریت روزمره به‌جای `sudo -u openclaw`، `podman exec` یا یک کاربر سرویس جداگانه، از `openclaw --container <name> ...` استفاده می‌کند.

## پیش‌نیازها

- **Podman** در حالت بدون root
- **OpenClaw CLI** نصب‌شده روی میزبان
- **اختیاری:** `systemd --user` اگر auto-start مدیریت‌شده با Quadlet می‌خواهید
- **اختیاری:** `sudo` فقط اگر برای پایداری پس از boot روی یک میزبان headless، `loginctl enable-linger "$(whoami)"` می‌خواهید

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
    `OPENCLAW_CONTAINER=openclaw` را تنظیم کنید، سپس از فرمان‌های معمول `openclaw` از میزبان استفاده کنید.
  </Step>
</Steps>

جزئیات راه‌اندازی:

- `./scripts/podman/setup.sh` به‌طور پیش‌فرض `openclaw:local` را در rootless Podman store شما می‌سازد، یا اگر `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` را تنظیم کرده باشید، از آن استفاده می‌کند.
- اگر موجود نباشد، `~/.openclaw/openclaw.json` را با `gateway.mode: "local"` ایجاد می‌کند.
- اگر موجود نباشد، `~/.openclaw/.env` را با `OPENCLAW_GATEWAY_TOKEN` ایجاد می‌کند.
- برای راه‌اندازی‌های دستی، helper فقط یک allowlist کوچک از کلیدهای مرتبط با Podman را از `~/.openclaw/.env` می‌خواند و env vars زمان اجرا را صریح به کانتینر پاس می‌دهد؛ فایل env کامل را به Podman تحویل نمی‌دهد.

راه‌اندازی مدیریت‌شده با Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet گزینه‌ای فقط برای Linux است، چون به سرویس‌های کاربری systemd وابسته است.

همچنین می‌توانید `OPENCLAW_PODMAN_QUADLET=1` را تنظیم کنید.

env vars اختیاری برای build/setup:

- `OPENCLAW_IMAGE` یا `OPENCLAW_PODMAN_IMAGE` -- استفاده از یک image موجود/دریافت‌شده به‌جای ساخت `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- نصب بسته‌های apt اضافی هنگام build کردن image
- `OPENCLAW_EXTENSIONS` -- نصب از پیش وابستگی‌های plugin هنگام build
- `OPENCLAW_INSTALL_BROWSER` -- نصب از پیش Chromium و Xvfb برای automation مرورگر (برای فعال‌سازی روی `1` تنظیم کنید)

راه‌اندازی کانتینر:

```bash
./scripts/run-openclaw-podman.sh launch
```

این script کانتینر را با uid/gid فعلی شما و `--userns=keep-id` راه‌اندازی می‌کند و وضعیت OpenClaw شما را bind-mount داخل کانتینر می‌کند.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

سپس `http://127.0.0.1:18789/` را باز کنید و از token موجود در `~/.openclaw/.env` استفاده کنید.

پیش‌فرض CLI میزبان:

```bash
export OPENCLAW_CONTAINER=openclaw
```

سپس فرمان‌هایی مانند این‌ها به‌طور خودکار داخل همان کانتینر اجرا می‌شوند:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

در macOS، Podman machine ممکن است باعث شود مرورگر برای gateway غیرمحلی به نظر برسد.
اگر Control UI پس از راه‌اندازی خطاهای device-auth گزارش کرد، از راهنمای Tailscale در
[Podman + Tailscale](#podman--tailscale) استفاده کنید.

<a id="podman--tailscale"></a>

## Podman + Tailscale

برای دسترسی HTTPS یا مرورگر راه دور، مستندات اصلی Tailscale را دنبال کنید.

نکته مخصوص Podman:

- میزبان publish مربوط به Podman را روی `127.0.0.1` نگه دارید.
- `tailscale serve` مدیریت‌شده توسط میزبان را به `openclaw gateway --tailscale serve` ترجیح دهید.
- در macOS، اگر زمینه device-auth مرورگر محلی قابل اتکا نیست، به‌جای workaroundهای موقت tunnel محلی، از دسترسی Tailscale استفاده کنید.

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
- **logها:** `journalctl --user -u openclaw.service -f`

پس از ویرایش فایل Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

برای پایداری پس از boot روی میزبان‌های SSH/headless، lingering را برای کاربر فعلی خود فعال کنید:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Config، env و ذخیره‌سازی

- **دایرکتوری config:** `~/.openclaw`
- **دایرکتوری workspace:** `~/.openclaw/workspace`
- **فایل token:** `~/.openclaw/.env`
- **helper راه‌اندازی:** `./scripts/run-openclaw-podman.sh`

script راه‌اندازی و Quadlet وضعیت میزبان را داخل کانتینر bind-mount می‌کنند:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

به‌طور پیش‌فرض این‌ها دایرکتوری‌های میزبان هستند، نه وضعیت ناشناس کانتینر، بنابراین
`openclaw.json`، `auth-profiles.json` مربوط به هر agent، وضعیت channel/provider،
sessionها و workspace با جایگزینی کانتینر باقی می‌مانند.
setup مربوط به Podman همچنین `gateway.controlUi.allowedOrigins` را برای `127.0.0.1` و `localhost` روی پورت منتشرشده gateway مقداردهی اولیه می‌کند تا dashboard محلی با bind غیر loopback کانتینر کار کند.

env vars مفید برای launcher دستی:

- `OPENCLAW_PODMAN_CONTAINER` -- نام کانتینر (`openclaw` به‌طور پیش‌فرض)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image برای اجرا
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- پورت میزبان که به `18789` کانتینر map شده است
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- پورت میزبان که به `18790` کانتینر map شده است
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface میزبان برای پورت‌های publishشده؛ پیش‌فرض `127.0.0.1` است
- `OPENCLAW_GATEWAY_BIND` -- حالت bind مربوط به gateway داخل کانتینر؛ پیش‌فرض `lan` است
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (پیش‌فرض)، `auto` یا `host`

launcher دستی پیش از نهایی‌سازی پیش‌فرض‌های کانتینر/image، `~/.openclaw/.env` را می‌خواند، بنابراین می‌توانید این موارد را آنجا پایدار کنید.

اگر از `OPENCLAW_CONFIG_DIR` یا `OPENCLAW_WORKSPACE_DIR` غیرپیش‌فرض استفاده می‌کنید، همان متغیرها را هم برای `./scripts/podman/setup.sh` و هم برای فرمان‌های بعدی `./scripts/run-openclaw-podman.sh launch` تنظیم کنید. launcher محلی repo، overrideهای مسیر سفارشی را بین shellها پایدار نمی‌کند.

نکته Quadlet:

- سرویس Quadlet تولیدشده عمداً یک شکل پیش‌فرض ثابت و سخت‌سازی‌شده نگه می‌دارد: پورت‌های publishشده روی `127.0.0.1`، `--bind lan` داخل کانتینر، و namespace کاربر `keep-id`.
- `OPENCLAW_NO_RESPAWN=1`، `Restart=on-failure` و `TimeoutStartSec=300` را pin می‌کند.
- هر دو `127.0.0.1:18789:18789` (gateway) و `127.0.0.1:18790:18790` (bridge) را publish می‌کند.
- `~/.openclaw/.env` را به‌عنوان `EnvironmentFile` زمان اجرا برای مقادیری مانند `OPENCLAW_GATEWAY_TOKEN` می‌خواند، اما allowlist override مخصوص Podman مربوط به launcher دستی را مصرف نمی‌کند.
- اگر به پورت‌های publish سفارشی، میزبان publish سفارشی یا flagهای دیگر اجرای کانتینر نیاز دارید، از launcher دستی استفاده کنید یا `~/.config/containers/systemd/openclaw.container` را مستقیماً ویرایش کنید، سپس سرویس را reload و restart کنید.

## فرمان‌های مفید

- **logهای کانتینر:** `podman logs -f openclaw`
- **توقف کانتینر:** `podman stop openclaw`
- **حذف کانتینر:** `podman rm -f openclaw`
- **باز کردن URL dashboard از CLI میزبان:** `openclaw dashboard --no-open`
- **health/status از طریق CLI میزبان:** `openclaw gateway status --deep` (RPC probe + extra
  service scan)

## عیب‌یابی

- **رد شدن مجوز (EACCES) روی config یا workspace:** کانتینر به‌طور پیش‌فرض با `--userns=keep-id` و `--user <your uid>:<your gid>` اجرا می‌شود. مطمئن شوید مسیرهای config/workspace روی میزبان متعلق به کاربر فعلی شما هستند.
- **شروع Gateway مسدود شده است (`gateway.mode=local` موجود نیست):** مطمئن شوید `~/.openclaw/openclaw.json` وجود دارد و `gateway.mode="local"` را تنظیم می‌کند. اگر موجود نباشد، `scripts/podman/setup.sh` آن را ایجاد می‌کند.
- **فرمان‌های CLI کانتینر به هدف اشتباه برخورد می‌کنند:** صراحتاً از `openclaw --container <name> ...` استفاده کنید، یا `OPENCLAW_CONTAINER=<name>` را در shell خود export کنید.
- **`openclaw update` با `--container` ناموفق می‌شود:** مورد انتظار است. image را دوباره build/pull کنید، سپس کانتینر یا سرویس Quadlet را restart کنید.
- **سرویس Quadlet شروع نمی‌شود:** `systemctl --user daemon-reload` را اجرا کنید، سپس `systemctl --user start openclaw.service`. روی سیستم‌های headless ممکن است به `sudo loginctl enable-linger "$(whoami)"` نیز نیاز داشته باشید.
- **SELinux مانع bind mountها می‌شود:** رفتار mount پیش‌فرض را تغییر ندهید؛ launcher در Linux وقتی SELinux در حالت enforcing یا permissive باشد، به‌طور خودکار `:Z` را اضافه می‌کند.

## مرتبط

- [Docker](/fa/install/docker)
- [فرایند پس‌زمینه Gateway](/fa/gateway/background-process)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
