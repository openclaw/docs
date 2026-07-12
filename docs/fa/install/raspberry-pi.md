---
read_when:
    - راه‌اندازی OpenClaw روی Raspberry Pi
    - اجرای OpenClaw روی دستگاه‌های ARM
    - ساخت یک هوش مصنوعی شخصی ارزان و همیشه‌فعال
summary: میزبانی OpenClaw روی Raspberry Pi برای میزبانی شخصی همیشه‌فعال
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T10:17:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

یک Gateway دائمی و همیشه‌فعال OpenClaw را روی Raspberry Pi اجرا کنید. از آنجا که Pi فقط نقش Gateway را دارد (مدل‌ها از طریق API در فضای ابری اجرا می‌شوند)، حتی یک Pi معمولی نیز به‌خوبی از عهدهٔ این بار کاری برمی‌آید -- هزینهٔ معمول سخت‌افزار **۳۵ تا ۸۰ دلار به‌صورت یک‌باره** است و هزینهٔ ماهانه‌ای ندارد.

## سازگاری سخت‌افزاری

| مدل Pi      | RAM    | قابل استفاده؟ | توضیحات                                  |
| ----------- | ------ | ------------- | ---------------------------------------- |
| Pi 5        | 4/8 GB | بهترین        | سریع‌ترین گزینه؛ توصیه می‌شود.           |
| Pi 4        | 4 GB   | خوب           | گزینهٔ ایدئال برای بیشتر کاربران.        |
| Pi 4        | 2 GB   | قابل قبول     | فضای swap اضافه کنید.                    |
| Pi 4        | 1 GB   | محدود         | با swap و پیکربندی حداقلی امکان‌پذیر است. |
| Pi 3B+      | 1 GB   | کند           | کار می‌کند، اما کند است.                  |
| Pi Zero 2 W | 512 MB | خیر           | توصیه نمی‌شود.                            |

**حداقل:** ۱ گیگابایت RAM، یک هسته، ۵۰۰ مگابایت فضای خالی دیسک و سیستم‌عامل ۶۴ بیتی.
**توصیه‌شده:** حداقل ۲ گیگابایت RAM، کارت SD با ظرفیت حداقل ۱۶ گیگابایت (یا USB SSD) و Ethernet.

## پیش‌نیازها

- Raspberry Pi 4 یا 5 با حداقل ۲ گیگابایت RAM (۴ گیگابایت توصیه می‌شود)
- کارت MicroSD با ظرفیت حداقل ۱۶ گیگابایت یا USB SSD (با عملکرد بهتر)
- منبع تغذیهٔ رسمی Pi
- اتصال شبکه (Ethernet یا WiFi)
- Raspberry Pi OS نسخهٔ ۶۴ بیتی (الزامی است -- از نسخهٔ ۳۲ بیتی استفاده نکنید)
- حدود ۳۰ دقیقه زمان

## راه‌اندازی

<Steps>
  <Step title="Flash the OS">
    از **Raspberry Pi OS Lite (64-bit)** استفاده کنید -- برای یک سرور بدون نمایشگر نیازی به محیط دسکتاپ نیست.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) را دانلود کنید.
    2. سیستم‌عامل را انتخاب کنید: **Raspberry Pi OS Lite (64-bit)**.
    3. در پنجرهٔ تنظیمات، موارد زیر را از پیش پیکربندی کنید:
       - نام میزبان: `gateway-host`
       - SSH را فعال کنید
       - نام کاربری و گذرواژه را تنظیم کنید
       - WiFi را پیکربندی کنید (اگر از Ethernet استفاده نمی‌کنید)
    4. سیستم‌عامل را روی کارت SD یا درایو USB بنویسید، آن را متصل کنید و Pi را راه‌اندازی کنید.

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    مراحل راهنما را دنبال کنید. برای دستگاه‌های بدون نمایشگر، کلیدهای API به OAuth ترجیح داده می‌شوند. Telegram ساده‌ترین کانال برای شروع است.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    در رایانهٔ خود، با دستور زیر یک نشانی داشبورد از Pi دریافت کنید:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    سپس در یک ترمینال دیگر، تونل SSH ایجاد کنید:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    نشانی چاپ‌شده را در مرورگر محلی خود باز کنید. برای دسترسی راه دور و دائمی، به [یکپارچه‌سازی Tailscale](/fa/gateway/tailscale) مراجعه کنید.

  </Step>
</Steps>

## نکات بهبود عملکرد

**از USB SSD استفاده کنید** -- کارت‌های SD کند هستند و فرسوده می‌شوند. یک USB SSD عملکرد را به‌شکل چشمگیری بهبود می‌دهد و چرخه‌های نوشتن بیشتری را تحمل می‌کند؛ اگر سیستم‌عامل را روی SD نگه می‌دارید، از آن برای `OPENCLAW_STATE_DIR` استفاده کنید. به [راهنمای بوت Pi از USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) مراجعه کنید.

**کش کامپایل ماژول را فعال کنید** -- فراخوانی‌های مکرر CLI را روی میزبان‌های Pi کم‌توان‌تر سریع‌تر می‌کند. `OPENCLAW_NO_RESPAWN=1` راه‌اندازی‌های مجدد معمول Gateway را در همان فرایند نگه می‌دارد، از واگذاری‌های اضافی میان فرایندها جلوگیری می‌کند و ردیابی PID را روی میزبان‌های کوچک ساده نگه می‌دارد:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

از `/var/tmp` استفاده کنید، نه `/tmp` -- برخی توزیع‌ها هنگام بوت `/tmp` را پاک می‌کنند و در نتیجه کش آماده‌شده از بین می‌رود.

**مصرف حافظه را کاهش دهید** -- در راه‌اندازی‌های بدون نمایشگر، حافظهٔ GPU را آزاد و سرویس‌های بدون استفاده را غیرفعال کنید:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**پیکربندی تکمیلی systemd برای راه‌اندازی مجدد پایدار** -- اگر این Pi عمدتاً OpenClaw را اجرا می‌کند، یک پیکربندی تکمیلی به سرویس اضافه کنید:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

سپس `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` را اجرا کنید. در یک Pi بدون نمایشگر، قابلیت ماندگاری را نیز یک‌بار فعال کنید تا سرویس کاربر پس از خروج از حساب همچنان فعال بماند: `sudo loginctl enable-linger "$(whoami)"`.

## راه‌اندازی پیشنهادی مدل

از آنجا که Pi فقط Gateway را اجرا می‌کند، از مدل‌های API میزبانی‌شده در فضای ابری استفاده کنید -- مدل‌های زبانی بزرگ محلی را روی Pi اجرا نکنید؛ حتی مدل‌های کوچک نیز آن‌قدر کند هستند که کاربردی نباشند:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

## نکات مربوط به فایل‌های اجرایی ARM

بیشتر قابلیت‌های OpenClaw روی ARM64 بدون تغییر کار می‌کنند (Node.js، Telegram، WhatsApp/Baileys و Chromium). فایل‌های اجرایی که گاهی نسخهٔ ARM ندارند، معمولاً ابزارهای اختیاری CLI نوشته‌شده با Go یا Rust هستند که همراه Skills ارائه می‌شوند. معماری را با `uname -m` بررسی کنید (باید `aarch64` نمایش داده شود)، سپس پیش از ساخت از کد منبع به‌عنوان راه‌حل جایگزین، صفحهٔ انتشار فایل اجرایی موجودنشده را برای مصنوعات `linux-arm64` / `aarch64` بررسی کنید.

## ماندگاری و پشتیبان‌گیری

وضعیت OpenClaw در مسیرهای زیر قرار دارد:

- `~/.openclaw/` -- شامل `openclaw.json`، فایل `auth-profiles.json` هر عامل، وضعیت کانال‌ها و ارائه‌دهندگان و نشست‌ها.
- `~/.openclaw/workspace/` -- فضای کاری عامل (SOUL.md، حافظه و مصنوعات).

این داده‌ها پس از راه‌اندازی مجدد باقی می‌مانند و استفاده از SSD به‌جای کارت SD، عملکرد و طول عمر آن‌ها را بهبود می‌دهد. با دستور زیر یک عکس فوری قابل‌انتقال تهیه کنید:

```bash
openclaw backup create
```

## عیب‌یابی

**کمبود حافظه** -- با `free -h` بررسی کنید که swap فعال باشد. سرویس‌های بدون استفاده را غیرفعال کنید (`sudo systemctl disable cups bluetooth avahi-daemon`). فقط از مدل‌های مبتنی بر API استفاده کنید.

**عملکرد کند** -- به‌جای کارت SD از USB SSD استفاده کنید. با `vcgencmd get_throttled` محدودسازی CPU را بررسی کنید (باید `0x0` برگرداند).

**سرویس راه‌اندازی نمی‌شود** -- گزارش‌ها را با `journalctl --user -u openclaw-gateway.service --no-pager -n 100` بررسی و `openclaw doctor --non-interactive` را اجرا کنید. اگر Pi بدون نمایشگر است، فعال بودن قابلیت ماندگاری را نیز بررسی کنید: `sudo loginctl enable-linger "$(whoami)"`.

**مشکلات فایل اجرایی ARM** -- اگر یک Skill با خطای "exec format error" مواجه شد، بررسی کنید که آیا فایل اجرایی نسخهٔ ARM64 دارد یا خیر. معماری را با `uname -m` بررسی کنید (باید `aarch64` نمایش داده شود).

**قطع شدن WiFi** -- مدیریت مصرف انرژی WiFi را غیرفعال کنید: `sudo iwconfig wlan0 power off`.

## مراحل بعدی

- [کانال‌ها](/fa/channels) -- اتصال Telegram، WhatsApp، Discord و موارد دیگر
- [پیکربندی Gateway](/fa/gateway/configuration) -- همهٔ گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مطالب مرتبط

- [نمای کلی نصب](/fa/install)
- [سرور Linux](/fa/vps)
- [پلتفرم‌ها](/fa/platforms)
