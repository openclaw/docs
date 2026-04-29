---
read_when:
    - راه‌اندازی OpenClaw روی Raspberry Pi
    - اجرای OpenClaw روی دستگاه‌های ARM
    - ساخت یک هوش مصنوعی شخصی ارزان و همیشه روشن
summary: میزبانی OpenClaw روی Raspberry Pi برای خودمیزبانی همیشه‌روشن
title: رزبری Pi
x-i18n:
    generated_at: "2026-04-29T23:07:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 16
---

OpenClaw Gateway پایدار و همیشه‌روشن را روی Raspberry Pi اجرا کنید. از آنجا که Pi فقط Gateway است (مدل‌ها از طریق API در ابر اجرا می‌شوند)، حتی یک Pi متوسط هم به‌خوبی از پس حجم کار برمی‌آید.

## پیش‌نیازها

- Raspberry Pi 4 یا 5 با بیش از 2 GB رم (4 GB توصیه می‌شود)
- کارت MicroSD (حداقل 16 GB) یا USB SSD (عملکرد بهتر)
- منبع تغذیه رسمی Pi
- اتصال شبکه (Ethernet یا WiFi)
- Raspberry Pi OS ‏64 بیتی (الزامی -- از نسخه 32 بیتی استفاده نکنید)
- حدود 30 دقیقه

## راه‌اندازی

<Steps>
  <Step title="فلش کردن سیستم‌عامل">
    از **Raspberry Pi OS Lite (64-bit)** استفاده کنید -- برای سرور بدون نمایشگر به دسکتاپ نیازی نیست.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) را دانلود کنید.
    2. سیستم‌عامل را انتخاب کنید: **Raspberry Pi OS Lite (64-bit)**.
    3. در پنجره تنظیمات، از قبل پیکربندی کنید:
       - نام میزبان: `gateway-host`
       - فعال کردن SSH
       - تنظیم نام کاربری و گذرواژه
       - پیکربندی WiFi (اگر از Ethernet استفاده نمی‌کنید)
    4. روی کارت SD یا درایو USB خود فلش کنید، آن را وارد کنید، و Pi را بوت کنید.

  </Step>

  <Step title="اتصال از طریق SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="به‌روزرسانی سیستم">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="نصب Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="افزودن swap (برای 2 GB یا کمتر مهم است)">
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

  <Step title="نصب OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --install-daemon
    ```

    راهنمای مرحله‌ای را دنبال کنید. برای دستگاه‌های بدون نمایشگر، کلیدهای API نسبت به OAuth توصیه می‌شوند. Telegram ساده‌ترین کانال برای شروع است.

  </Step>

  <Step title="راستی‌آزمایی">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="دسترسی به Control UI">
    در رایانه خود، یک نشانی داشبورد از Pi بگیرید:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    سپس در یک ترمینال دیگر یک تونل SSH ایجاد کنید:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    نشانی چاپ‌شده را در مرورگر محلی خود باز کنید. برای دسترسی راه دور همیشه‌روشن، [یکپارچه‌سازی Tailscale](/fa/gateway/tailscale) را ببینید.

  </Step>
</Steps>

## نکات عملکرد

**از USB SSD استفاده کنید** -- کارت‌های SD کند هستند و فرسوده می‌شوند. USB SSD عملکرد را به‌طور چشمگیری بهبود می‌دهد. [راهنمای بوت USB روی Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) را ببینید.

**کش کامپایل ماژول را فعال کنید** -- اجرای مکرر CLI را روی میزبان‌های Pi کم‌مصرف‌تر سریع‌تر می‌کند:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**مصرف حافظه را کاهش دهید** -- برای راه‌اندازی‌های بدون نمایشگر، حافظه GPU را آزاد کنید و سرویس‌های استفاده‌نشده را غیرفعال کنید:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## عیب‌یابی

**کمبود حافظه** -- با `free -h` بررسی کنید که swap فعال باشد. سرویس‌های استفاده‌نشده را غیرفعال کنید (`sudo systemctl disable cups bluetooth avahi-daemon`). فقط از مدل‌های مبتنی بر API استفاده کنید.

**عملکرد کند** -- به‌جای کارت SD از USB SSD استفاده کنید. با `vcgencmd get_throttled` محدودسازی CPU را بررسی کنید (باید `0x0` برگرداند).

**سرویس شروع نمی‌شود** -- لاگ‌ها را با `journalctl --user -u openclaw-gateway.service --no-pager -n 100` بررسی کنید و `openclaw doctor --non-interactive` را اجرا کنید. اگر این یک Pi بدون نمایشگر است، همچنین بررسی کنید lingering فعال باشد: `sudo loginctl enable-linger "$(whoami)"`.

**مشکلات باینری ARM** -- اگر یک skill با خطای "exec format error" شکست خورد، بررسی کنید آیا باینری build مخصوص ARM64 دارد. معماری را با `uname -m` بررسی کنید (باید `aarch64` نشان دهد).

**قطع شدن WiFi** -- مدیریت توان WiFi را غیرفعال کنید: `sudo iwconfig wlan0 power off`.

## مراحل بعدی

- [کانال‌ها](/fa/channels) -- Telegram، WhatsApp، Discord و موارد دیگر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همه گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مرتبط

- [نمای کلی نصب](/fa/install)
- [سرور Linux](/fa/vps)
- [پلتفرم‌ها](/fa/platforms)
