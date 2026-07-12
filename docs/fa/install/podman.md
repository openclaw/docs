---
read_when:
    - شما به‌جای Docker، یک Gateway کانتینری با Podman می‌خواهید
summary: اجرای OpenClaw در یک کانتینر بدون ریشهٔ Podman
title: Podman
x-i18n:
    generated_at: "2026-07-12T10:12:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Gateway نرم‌افزار OpenClaw را در یک کانتینر Podman بدون دسترسی ریشه اجرا کنید که توسط کاربر غیرریشه‌ای فعلی شما مدیریت می‌شود.

مدل کار:

- Podman کانتینر Gateway را اجرا می‌کند.
- CLI میزبان `openclaw` صفحهٔ کنترل شماست.
- حالت پایدار به‌طور پیش‌فرض در میزبان و زیر `~/.openclaw` نگهداری می‌شود.
- برای مدیریت روزمره به‌جای `sudo -u openclaw`،‏ `podman exec` یا یک کاربر سرویس جداگانه، از `openclaw --container <name> ...` استفاده می‌شود.

## پیش‌نیازها

- **Podman** در حالت بدون دسترسی ریشه
- **CLI نرم‌افزار OpenClaw** نصب‌شده روی میزبان
- **اختیاری:** اگر راه‌اندازی خودکار تحت مدیریت Quadlet را می‌خواهید، `systemd --user`
- **اختیاری:** تنها در صورتی که برای تداوم اجرا پس از راه‌اندازی سیستم روی یک میزبان بدون نمایشگر، `loginctl enable-linger "$(whoami)"` را می‌خواهید، `sudo`

## شروع سریع

<Steps>
  <Step title="راه‌اندازی یک‌باره">
    از ریشهٔ مخزن، `./scripts/podman/setup.sh` را اجرا کنید.

    این دستور `openclaw:local` را در فضای ذخیره‌سازی Podman بدون دسترسی ریشهٔ شما می‌سازد (یا در صورت تنظیم بودن، `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` را دریافت می‌کند)، اگر `~/.openclaw/openclaw.json` وجود نداشته باشد آن را با `gateway.mode: "local"` ایجاد می‌کند و اگر `~/.openclaw/.env` وجود نداشته باشد آن را با یک `OPENCLAW_GATEWAY_TOKEN` تولیدشده می‌سازد.

    متغیرهای محیطی اختیاری زمان ساخت:

    | متغیر | اثر |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | استفاده از یک تصویر موجود/دریافت‌شده به‌جای ساخت `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | نصب بسته‌های اضافی apt هنگام ساخت تصویر (متغیر قدیمی `OPENCLAW_DOCKER_APT_PACKAGES` را نیز می‌پذیرد) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | نصب بسته‌های اضافی Python هنگام ساخت تصویر؛ نسخه‌ها را ثابت کنید و تنها از نمایه‌های بسته‌ای استفاده کنید که به آن‌ها اعتماد دارید |
    | `OPENCLAW_EXTENSIONS` | کامپایل/بسته‌بندی Pluginهای انتخاب‌شدهٔ پشتیبانی‌شده و نصب وابستگی‌های زمان اجرای آن‌ها |
    | `OPENCLAW_INSTALL_BROWSER` | نصب از پیش Chromium و Xvfb برای خودکارسازی مرورگر (روی `1` تنظیم کنید) |

    برای راه‌اندازی تحت مدیریت Quadlet به‌جای آن (فقط Linux و سرویس‌های کاربری systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    یا `OPENCLAW_PODMAN_QUADLET=1` را تنظیم کنید.

  </Step>

  <Step title="راه‌اندازی کانتینر Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    کانتینر را با uid/gid فعلی شما و با `--userns=keep-id` راه‌اندازی می‌کند و حالت OpenClaw شما را با اتصال bind در کانتینر سوار می‌کند.

  </Step>

  <Step title="اجرای فرایند آغاز به کار درون کانتینر">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    سپس `http://127.0.0.1:18789/` را باز کنید و از توکن موجود در `~/.openclaw/.env` استفاده کنید.

    احراز هویت مدل: هنگام راه‌اندازی از احراز هویت تحت مدیریت OpenClaw استفاده کنید (کلیدهای API شرکت Anthropic، یا احراز هویت OAuth مرورگر/کد دستگاه OpenAI Codex برای OpenAI مبتنی بر Codex). راه‌انداز Podman پوشه‌های اطلاعات احراز هویت CLI میزبان مانند `~/.claude` یا `~/.codex` را در کانتینر راه‌اندازی یا Gateway سوار نمی‌کند. ورودهای موجود CLI میزبان تنها مسیرهای تسهیل‌کننده روی همان میزبان هستند — برای نصب‌های کانتینری، احراز هویت ارائه‌دهنده را در حالت سوارشدهٔ `~/.openclaw` نگه دارید که فرایند راه‌اندازی آن را مدیریت می‌کند.

  </Step>

  <Step title="مدیریت کانتینر در حال اجرا از طریق CLI میزبان">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    سپس فرمان‌های عادی `openclaw` به‌طور خودکار درون آن کانتینر اجرا می‌شوند:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    در macOS، ماشین Podman ممکن است باعث شود مرورگر از دید Gateway غیرمحلی به نظر برسد. اگر رابط کنترل پس از راه‌اندازی خطاهای احراز هویت دستگاه را گزارش کرد، از راهنمای Tailscale در [Podman و Tailscale](#podman-and-tailscale) استفاده کنید.

  </Step>
</Steps>

راه‌انداز دستی تنها یک فهرست مجاز کوچک از کلیدهای مرتبط با Podman را از `~/.openclaw/.env` می‌خواند و متغیرهای محیطی زمان اجرا را به‌صورت صریح به کانتینر می‌فرستد؛ این راه‌انداز کل فایل محیطی را به Podman تحویل نمی‌دهد.

<a id="podman-and-tailscale"></a>

## Podman و Tailscale

برای HTTPS یا دسترسی از راه دور مرورگر، مستندات اصلی Tailscale را دنبال کنید.

نکات ویژهٔ Podman:

- میزبان انتشار Podman را روی `127.0.0.1` نگه دارید.
- استفاده از `tailscale serve` تحت مدیریت میزبان را به `openclaw gateway --tailscale serve` ترجیح دهید.
- در macOS، اگر زمینهٔ احراز هویت دستگاه مرورگر محلی قابل اتکا نیست، به‌جای راهکارهای موقت تونل محلی از دسترسی Tailscale استفاده کنید.

به [Tailscale](/fa/gateway/tailscale) و [رابط کنترل](/fa/web/control-ui) مراجعه کنید.

## Systemd (Quadlet، اختیاری)

اگر `./scripts/podman/setup.sh --quadlet` را اجرا کرده باشید، فرایند راه‌اندازی یک فایل Quadlet در `~/.config/containers/systemd/openclaw.container` نصب می‌کند.

| عملیات | فرمان                                      |
| ------ | ------------------------------------------ |
| شروع   | `systemctl --user start openclaw.service`  |
| توقف   | `systemctl --user stop openclaw.service`   |
| وضعیت  | `systemctl --user status openclaw.service` |
| گزارش‌ها | `journalctl --user -u openclaw.service -f` |

پس از ویرایش فایل Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

برای تداوم اجرا پس از راه‌اندازی سیستم روی میزبان‌های SSH/بدون نمایشگر، ماندگاری کاربر فعلی خود را فعال کنید:

```bash
sudo loginctl enable-linger "$(whoami)"
```

سرویس Quadlet تولیدشده یک ساختار پیش‌فرض ثابت و مقاوم‌سازی‌شده را حفظ می‌کند: درگاه‌های منتشرشده روی `127.0.0.1` (درگاه `18789` برای Gateway و `18790` برای پل)،‏ `--bind lan` درون کانتینر، فضای نام کاربری `keep-id`،‏ `OPENCLAW_NO_RESPAWN=1`،‏ `Restart=on-failure` و `TimeoutStartSec=300`. این سرویس `~/.openclaw/.env` را به‌عنوان `EnvironmentFile` زمان اجرا برای مقادیری مانند `OPENCLAW_GATEWAY_TOKEN` می‌خواند، اما فهرست مجاز بازنویسی‌های ویژهٔ Podman در راه‌انداز دستی را مصرف نمی‌کند. برای درگاه‌های انتشار سفارشی، میزبان انتشار یا سایر پرچم‌های اجرای کانتینر، به‌جای آن از راه‌انداز دستی استفاده کنید، یا `~/.config/containers/systemd/openclaw.container` را مستقیماً ویرایش کرده و سپس سرویس را بارگذاری مجدد و راه‌اندازی دوباره کنید.

## پیکربندی، محیط و فضای ذخیره‌سازی

- **پوشهٔ پیکربندی:** `~/.openclaw`
- **پوشهٔ فضای کاری:** `~/.openclaw/workspace`
- **فایل توکن:** `~/.openclaw/.env`
- **ابزار کمکی راه‌اندازی:** `./scripts/run-openclaw-podman.sh`

اسکریپت راه‌اندازی و Quadlet حالت میزبان را با اتصال bind در کانتینر سوار می‌کنند: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw` و `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. به‌طور پیش‌فرض این‌ها پوشه‌های میزبان هستند، نه حالت ناشناس کانتینر؛ بنابراین `openclaw.json`،‏ `auth-profiles.json` هر عامل، حالت کانال/ارائه‌دهنده، نشست‌ها و فضای کاری پس از جایگزینی کانتینر باقی می‌مانند. فرایند راه‌اندازی همچنین `gateway.controlUi.allowedOrigins` را برای `127.0.0.1` و `localhost` روی درگاه منتشرشدهٔ Gateway مقداردهی اولیه می‌کند تا داشبورد محلی با اتصال غیرـlocal loopback کانتینر کار کند.

متغیرهای محیطی مفید برای راه‌انداز دستی (این‌ها را در `~/.openclaw/.env` نگه دارید؛ راه‌انداز پیش از نهایی‌کردن مقادیر پیش‌فرض کانتینر/تصویر، آن فایل را می‌خواند):

| متغیر                                      | پیش‌فرض         | اثر                                    |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | نام کانتینر                            |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | تصویر مورد استفاده برای اجرا           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | درگاه میزبان نگاشت‌شده به `18789` کانتینر |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | درگاه میزبان نگاشت‌شده به `18790` کانتینر |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | رابط میزبان برای درگاه‌های منتشرشده    |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | حالت اتصال Gateway درون کانتینر         |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`،‏ `auto` یا `host`           |

اگر از `OPENCLAW_CONFIG_DIR` یا `OPENCLAW_WORKSPACE_DIR` غیراستاندارد استفاده می‌کنید، همان متغیرها را هم برای `./scripts/podman/setup.sh` و هم برای فرمان‌های بعدی `./scripts/run-openclaw-podman.sh launch` تنظیم کنید — راه‌انداز محلی مخزن، بازنویسی‌های مسیر سفارشی را میان پوسته‌ها نگه نمی‌دارد.

## ارتقای تصاویر

پس از ساخت دوباره یا دریافت یک تصویر جدید، کانتینر یا سرویس Quadlet را دوباره راه‌اندازی کنید.
در نخستین راه‌اندازی یک نسخهٔ جدید OpenClaw،‏ Gateway پیش از اعلام آمادگی، ترمیم‌های ایمن حالت و
Plugin را اجرا می‌کند.

اگر Gateway به‌جای آماده‌شدن خارج شد، همان تصویر را یک بار با
`openclaw doctor --fix` و با همان حالت/پیکربندی سوارشده اجرا کنید، سپس
Gateway را به‌طور عادی دوباره راه‌اندازی کنید:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

در میزبان‌های SELinux، اگر Podman دسترسی به حالت سوارشده را مسدود می‌کند، `,Z` را به هر دو اتصال bind اضافه کنید.

## فرمان‌های مفید

- **گزارش‌های کانتینر:** `podman logs -f openclaw`
- **توقف کانتینر:** `podman stop openclaw`
- **حذف کانتینر:** `podman rm -f openclaw`
- **بازکردن نشانی داشبورد از CLI میزبان:** `openclaw dashboard --no-open`
- **سلامت/وضعیت از طریق CLI میزبان:** `openclaw gateway status --deep` (کاوش RPC + پویش سرویس اضافی)

## عیب‌یابی

- **رد شدن مجوز (EACCES) برای پیکربندی یا فضای کاری:** کانتینر به‌طور پیش‌فرض با `--userns=keep-id` و `--user <your uid>:<your gid>` اجرا می‌شود. مطمئن شوید مسیرهای پیکربندی/فضای کاری میزبان متعلق به کاربر فعلی شما هستند.
- **مسدود شدن شروع Gateway (نبودن `gateway.mode=local`):** مطمئن شوید `~/.openclaw/openclaw.json` وجود دارد و `gateway.mode="local"` را تنظیم می‌کند. `scripts/podman/setup.sh` در صورت نبودن آن را ایجاد می‌کند.
- **راه‌اندازی مجدد کانتینر پس از به‌روزرسانی تصویر:** فرمان یک‌بارهٔ `openclaw doctor --fix` را در [ارتقای تصاویر](#upgrading-images) اجرا کنید، سپس Gateway را دوباره راه‌اندازی کنید.
- **فرمان‌های CLI کانتینر به مقصد اشتباه می‌روند:** به‌طور صریح از `openclaw --container <name> ...` استفاده کنید، یا `OPENCLAW_CONTAINER=<name>` را در پوستهٔ خود صادر کنید.
- **`openclaw update` با `--container` ناموفق است:** قابل انتظار است. تصویر را دوباره بسازید/دریافت کنید، سپس کانتینر یا سرویس Quadlet را دوباره راه‌اندازی کنید.
- **سرویس Quadlet شروع نمی‌شود:** `systemctl --user daemon-reload` و سپس `systemctl --user start openclaw.service` را اجرا کنید. در سامانه‌های بدون نمایشگر ممکن است به `sudo loginctl enable-linger "$(whoami)"` نیز نیاز داشته باشید.
- **SELinux اتصال‌های bind را مسدود می‌کند:** رفتار پیش‌فرض سوارسازی را تغییر ندهید؛ راه‌انداز هنگام فعال بودن SELinux در حالت enforcing یا permissive، به‌طور خودکار `:Z` را در Linux اضافه می‌کند.

## مرتبط

- [Docker](/fa/install/docker)
- [فرایند پس‌زمینهٔ Gateway](/fa/gateway/background-process)
- [عیب‌یابی Gateway](/fa/gateway/troubleshooting)
