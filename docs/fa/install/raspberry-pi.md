---
read_when:
    - راه‌اندازی OpenClaw روی Raspberry Pi
    - اجرای OpenClaw روی دستگاه‌های ARM
    - ساخت یک هوش مصنوعی شخصی ارزان و همیشه فعال
summary: OpenClaw را برای خودمیزبانی همیشه‌فعال روی Raspberry Pi میزبانی کنید
title: Raspberry Pi
x-i18n:
    generated_at: "2026-05-06T09:27:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96df076c2707b0b27751d452f15fad774356a86e96d10bce998581235776c4bc
    source_path: install/raspberry-pi.md
    workflow: 16
---

OpenClaw Gateway پایدار و همیشه‌روشن را روی Raspberry Pi اجرا کنید. از آنجا که Pi فقط Gateway است (مدل‌ها از طریق API در فضای ابری اجرا می‌شوند)، حتی یک Pi معمولی هم به‌خوبی از پس بار کاری برمی‌آید — هزینهٔ معمول سخت‌افزار **۳۵ تا ۸۰ دلار، یک‌باره** است و هزینهٔ ماهانه ندارد.

## سازگاری سخت‌افزاری

| مدل Pi       | RAM    | کار می‌کند؟ | نکات                               |
| ------------ | ------ | ------------ | ---------------------------------- |
| Pi 5         | 4/8 GB | بهترین       | سریع‌ترین گزینه، توصیه‌شده.       |
| Pi 4         | 4 GB   | خوب          | نقطهٔ بهینه برای بیشتر کاربران.   |
| Pi 4         | 2 GB   | قابل قبول    | swap اضافه کنید.                   |
| Pi 4         | 1 GB   | محدود        | با swap و پیکربندی حداقلی ممکن است. |
| Pi 3B+       | 1 GB   | کند          | کار می‌کند اما کند است.            |
| Pi Zero 2 W  | 512 MB | خیر          | توصیه نمی‌شود.                     |

**حداقل:** ۱ GB RAM، ۱ هسته، ۵۰۰ MB فضای دیسک آزاد، سیستم‌عامل ۶۴ بیتی.
**توصیه‌شده:** ۲ GB+ RAM، کارت SD با ظرفیت ۱۶ GB+ (یا USB SSD)، اترنت.

## پیش‌نیازها

- Raspberry Pi 4 یا 5 با ۲ GB+ RAM (۴ GB توصیه می‌شود)
- کارت MicroSD (۱۶ GB+) یا USB SSD (عملکرد بهتر)
- منبع تغذیهٔ رسمی Pi
- اتصال شبکه (اترنت یا WiFi)
- Raspberry Pi OS ۶۴ بیتی (ضروری -- از نسخهٔ ۳۲ بیتی استفاده نکنید)
- حدود ۳۰ دقیقه

## راه‌اندازی

<Steps>
  <Step title="فلش کردن سیستم‌عامل">
    از **Raspberry Pi OS Lite (64-bit)** استفاده کنید -- برای یک سرور headless نیازی به محیط دسکتاپ نیست.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) را دانلود کنید.
    2. سیستم‌عامل را انتخاب کنید: **Raspberry Pi OS Lite (64-bit)**.
    3. در پنجرهٔ تنظیمات، از پیش پیکربندی کنید:
       - Hostname: `gateway-host`
       - SSH را فعال کنید
       - نام کاربری و گذرواژه را تنظیم کنید
       - WiFi را پیکربندی کنید (اگر از اترنت استفاده نمی‌کنید)
    4. روی کارت SD یا درایو USB فلش کنید، آن را وارد کنید و Pi را بوت کنید.

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

  <Step title="افزودن swap (مهم برای ۲ GB یا کمتر)">
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

    جادوگر را دنبال کنید. برای دستگاه‌های headless، کلیدهای API به OAuth ترجیح داده می‌شوند. Telegram ساده‌ترین کانال برای شروع است.

  </Step>

  <Step title="اعتبارسنجی">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="دسترسی به Control UI">
    در رایانهٔ خود، یک URL داشبورد از Pi بگیرید:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    سپس در یک ترمینال دیگر یک تونل SSH بسازید:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    URL چاپ‌شده را در مرورگر محلی خود باز کنید. برای دسترسی راه دور همیشه‌روشن، [یکپارچه‌سازی Tailscale](/fa/gateway/tailscale) را ببینید.

  </Step>
</Steps>

## نکات عملکردی

**از USB SSD استفاده کنید** -- کارت‌های SD کند هستند و فرسوده می‌شوند. USB SSD عملکرد را به‌شکل چشمگیری بهتر می‌کند. [راهنمای بوت USB در Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) را ببینید.

**کش کامپایل ماژول را فعال کنید** -- فراخوانی‌های تکراری CLI را روی میزبان‌های Pi کم‌مصرف سریع‌تر می‌کند:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**مصرف حافظه را کاهش دهید** -- برای راه‌اندازی‌های headless، حافظهٔ GPU را آزاد کنید و سرویس‌های استفاده‌نشده را غیرفعال کنید:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**drop-in مربوط به systemd برای راه‌اندازی مجدد پایدار** -- اگر این Pi عمدتاً OpenClaw را اجرا می‌کند، یک drop-in برای سرویس اضافه کنید:

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

سپس `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` را اجرا کنید. روی یک Pi headless، همچنین lingering را یک‌بار فعال کنید تا سرویس کاربر پس از خروج از سیستم هم باقی بماند: `sudo loginctl enable-linger "$(whoami)"`.

## راه‌اندازی مدل توصیه‌شده

از آنجا که Pi فقط Gateway را اجرا می‌کند، از مدل‌های API میزبانی‌شده در فضای ابری استفاده کنید:

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

LLMهای محلی را روی Pi اجرا نکنید — حتی مدل‌های کوچک هم بیش از حد کند هستند که مفید باشند. بگذارید Claude یا GPT کار مدل را انجام دهد.

## نکات باینری ARM

بیشتر قابلیت‌های OpenClaw روی ARM64 بدون تغییر کار می‌کنند (Node.js، Telegram، WhatsApp/Baileys، Chromium). باینری‌هایی که گاهی بیلد ARM ندارند معمولاً ابزارهای CLI اختیاری Go/Rust هستند که توسط Skills ارائه می‌شوند. پیش از بازگشت به ساخت از سورس، صفحهٔ انتشار باینریِ گم‌شده را برای آرتیفکت‌های `linux-arm64` / `aarch64` بررسی کنید.

## پایداری و پشتیبان‌گیری

وضعیت OpenClaw زیر این مسیرها قرار دارد:

- `~/.openclaw/` — `openclaw.json`، `auth-profiles.json` برای هر عامل، وضعیت کانال/ارائه‌دهنده، نشست‌ها.
- `~/.openclaw/workspace/` — فضای کاری عامل (SOUL.md، حافظه، آرتیفکت‌ها).

این‌ها پس از راه‌اندازی مجدد باقی می‌مانند. با دستور زیر یک snapshot قابل‌حمل بگیرید:

```bash
openclaw backup create
```

اگر این موارد را روی SSD نگه دارید، هم عملکرد و هم دوام نسبت به کارت SD بهتر می‌شود.

## عیب‌یابی

**کمبود حافظه** -- با `free -h` بررسی کنید که swap فعال است. سرویس‌های استفاده‌نشده را غیرفعال کنید (`sudo systemctl disable cups bluetooth avahi-daemon`). فقط از مدل‌های مبتنی بر API استفاده کنید.

**عملکرد کند** -- به‌جای کارت SD از USB SSD استفاده کنید. با `vcgencmd get_throttled` throttling پردازنده را بررسی کنید (باید `0x0` برگرداند).

**سرویس شروع نمی‌شود** -- لاگ‌ها را با `journalctl --user -u openclaw-gateway.service --no-pager -n 100` بررسی کنید و `openclaw doctor --non-interactive` را اجرا کنید. اگر این یک Pi headless است، همچنین بررسی کنید lingering فعال باشد: `sudo loginctl enable-linger "$(whoami)"`.

**مشکلات باینری ARM** -- اگر یک skill با خطای "exec format error" شکست خورد، بررسی کنید آیا باینری بیلد ARM64 دارد یا نه. معماری را با `uname -m` بررسی کنید (باید `aarch64` نشان دهد).

**قطع شدن WiFi** -- مدیریت مصرف برق WiFi را غیرفعال کنید: `sudo iwconfig wlan0 power off`.

## گام‌های بعدی

- [کانال‌ها](/fa/channels) -- Telegram، WhatsApp، Discord و موارد بیشتر را متصل کنید
- [پیکربندی Gateway](/fa/gateway/configuration) -- همهٔ گزینه‌های پیکربندی
- [به‌روزرسانی](/fa/install/updating) -- OpenClaw را به‌روز نگه دارید

## مرتبط

- [نمای کلی نصب](/fa/install)
- [سرور Linux](/fa/vps)
- [پلتفرم‌ها](/fa/platforms)
