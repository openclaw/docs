---
read_when:
    - راه‌اندازی OpenClaw روی Raspberry Pi
    - اجرای OpenClaw روی دستگاه‌های ARM
    - ساخت یک هوش مصنوعی شخصی ارزان و همیشه روشن
summary: OpenClaw روی Raspberry Pi (راه‌اندازی خودمیزبان مقرون‌به‌صرفه)
title: Raspberry Pi (پلتفرم)
x-i18n:
    generated_at: "2026-04-29T23:13:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw روی Raspberry Pi

## هدف

اجرای یک OpenClaw Gateway پایدار و همیشه روشن روی Raspberry Pi با هزینه یک‌باره **~$35-80** (بدون هزینه ماهانه).

مناسب برای:

- دستیار هوش مصنوعی شخصی ۲۴/۷
- هاب اتوماسیون خانگی
- ربات Telegram/WhatsApp کم‌مصرف و همیشه دردسترس

## نیازمندی‌های سخت‌افزاری

| مدل Pi          | RAM     | کار می‌کند؟ | یادداشت‌ها                          |
| --------------- | ------- | ----------- | ----------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ بهترین   | سریع‌ترین، توصیه‌شده                |
| **Pi 4**        | 4GB     | ✅ خوب      | نقطه تعادل مناسب برای بیشتر کاربران |
| **Pi 4**        | 2GB     | ✅ قابل قبول | کار می‌کند، swap اضافه کنید          |
| **Pi 4**        | 1GB     | ⚠️ محدود    | با swap و پیکربندی حداقلی ممکن است  |
| **Pi 3B+**      | 1GB     | ⚠️ کند      | کار می‌کند اما کند است              |
| **Pi Zero 2 W** | 512MB   | ❌          | توصیه نمی‌شود                       |

**حداقل مشخصات:** 1GB RAM، ۱ هسته، 500MB دیسک  
**توصیه‌شده:** 2GB+ RAM، سیستم‌عامل ۶۴ بیتی، کارت SD با ظرفیت 16GB+ (یا USB SSD)

## آنچه نیاز دارید

- Raspberry Pi 4 یا 5 (2GB+ توصیه می‌شود)
- کارت MicroSD (16GB+) یا USB SSD (عملکرد بهتر)
- منبع تغذیه (PSU رسمی Pi توصیه می‌شود)
- اتصال شبکه (Ethernet یا WiFi)
- حدود ۳۰ دقیقه

## ۱) فلش کردن سیستم‌عامل

از **Raspberry Pi OS Lite (64-bit)** استفاده کنید؛ برای سرور بدون نمایشگر، دسکتاپ لازم نیست.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) را دانلود کنید
2. سیستم‌عامل را انتخاب کنید: **Raspberry Pi OS Lite (64-bit)**
3. روی آیکن چرخ‌دنده (⚙️) کلیک کنید تا از پیش پیکربندی کنید:
   - نام میزبان را تنظیم کنید: `gateway-host`
   - SSH را فعال کنید
   - نام کاربری/رمز عبور را تنظیم کنید
   - WiFi را پیکربندی کنید (اگر از Ethernet استفاده نمی‌کنید)
4. آن را روی کارت SD / درایو USB خود فلش کنید
5. Pi را وارد کرده و بوت کنید

## ۲) اتصال از طریق SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## ۳) راه‌اندازی سیستم

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## ۴) نصب Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## ۵) افزودن Swap (مهم برای 2GB یا کمتر)

Swap از کرش‌های ناشی از کمبود حافظه جلوگیری می‌کند:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## ۶) نصب OpenClaw

### گزینه A: نصب استاندارد (توصیه‌شده)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### گزینه B: نصب قابل تغییر (برای دستکاری و آزمون)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

نصب قابل تغییر به شما دسترسی مستقیم به لاگ‌ها و کد می‌دهد؛ برای اشکال‌زدایی مشکلات خاص ARM مفید است.

## ۷) اجرای راه‌اندازی اولیه

```bash
openclaw onboard --install-daemon
```

جادوگر را دنبال کنید:

1. **حالت Gateway:** محلی
2. **احراز هویت:** کلیدهای API توصیه می‌شوند (OAuth روی Pi بدون نمایشگر می‌تواند دردسرساز باشد)
3. **کانال‌ها:** Telegram ساده‌ترین گزینه برای شروع است
4. **Daemon:** بله (systemd)

## ۸) بررسی نصب

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## ۹) دسترسی به داشبورد OpenClaw

`user@gateway-host` را با نام کاربری و نام میزبان یا آدرس IP مربوط به Pi خود جایگزین کنید.

روی رایانه خود، از Pi بخواهید یک URL تازه برای داشبورد چاپ کند:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

این دستور `Dashboard URL:` را چاپ می‌کند. بسته به اینکه `gateway.auth.token`
چگونه پیکربندی شده باشد، URL ممکن است یک لینک ساده `http://127.0.0.1:18789/` باشد یا لینکی
که شامل `#token=...` است.

در یک ترمینال دیگر روی رایانه خود، تونل SSH را ایجاد کنید:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

سپس URL چاپ‌شده داشبورد را در مرورگر محلی خود باز کنید.

اگر UI از شما احراز هویت با shared-secret خواست، توکن یا رمز عبور پیکربندی‌شده را
در تنظیمات Control UI وارد کنید. برای احراز هویت با توکن، از `gateway.auth.token` (یا
`OPENCLAW_GATEWAY_TOKEN`) استفاده کنید.

برای دسترسی راه‌دور همیشه روشن، [Tailscale](/fa/gateway/tailscale) را ببینید.

---

## بهینه‌سازی‌های عملکرد

### استفاده از USB SSD (بهبود بسیار زیاد)

کارت‌های SD کند هستند و فرسوده می‌شوند. USB SSD عملکرد را به‌طور چشمگیری بهبود می‌دهد:

```bash
# Check if booting from USB
lsblk
```

برای راه‌اندازی، [راهنمای بوت USB برای Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) را ببینید.

### افزایش سرعت شروع CLI (کش کامپایل ماژول)

روی میزبان‌های Pi کم‌توان‌تر، کش کامپایل ماژول Node را فعال کنید تا اجرای تکراری CLI سریع‌تر شود:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

یادداشت‌ها:

- `NODE_COMPILE_CACHE` اجرای بعدی را سریع‌تر می‌کند (`status`، `health`، `--help`).
- `/var/tmp` در مقایسه با `/tmp` پس از راه‌اندازی مجدد بهتر باقی می‌ماند.
- `OPENCLAW_NO_RESPAWN=1` از هزینه اضافی شروع ناشی از self-respawn در CLI جلوگیری می‌کند.
- اجرای اول کش را گرم می‌کند؛ اجراهای بعدی بیشترین بهره را می‌برند.

### تنظیم شروع systemd (اختیاری)

اگر این Pi بیشتر برای اجرای OpenClaw استفاده می‌شود، یک drop-in سرویس اضافه کنید تا
نوسان در راه‌اندازی مجدد کمتر شود و محیط شروع پایدار بماند:

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

سپس اعمال کنید:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

در صورت امکان، وضعیت/کش OpenClaw را روی فضای ذخیره‌سازی مبتنی بر SSD نگه دارید تا از
گلوگاه‌های I/O تصادفی کارت SD هنگام شروع سرد جلوگیری شود.

اگر این Pi بدون نمایشگر است، یک‌بار lingering را فعال کنید تا سرویس کاربر پس از
خروج هم باقی بماند:

```bash
sudo loginctl enable-linger "$(whoami)"
```

اینکه سیاست‌های `Restart=` چگونه به بازیابی خودکار کمک می‌کنند:
[systemd می‌تواند بازیابی سرویس را خودکار کند](https://www.redhat.com/en/blog/systemd-automate-recovery).

### کاهش مصرف حافظه

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### پایش منابع

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## یادداشت‌های خاص ARM

### سازگاری باینری

بیشتر قابلیت‌های OpenClaw روی ARM64 کار می‌کنند، اما برخی باینری‌های خارجی ممکن است به بیلدهای ARM نیاز داشته باشند:

| ابزار              | وضعیت ARM64 | یادداشت‌ها                         |
| ------------------ | ----------- | ---------------------------------- |
| Node.js            | ✅          | عالی کار می‌کند                    |
| WhatsApp (Baileys) | ✅          | JS خالص، بدون مشکل                 |
| Telegram           | ✅          | JS خالص، بدون مشکل                 |
| gog (Gmail CLI)    | ⚠️          | وجود نسخه ARM را بررسی کنید        |
| Chromium (browser) | ✅          | `sudo apt install chromium-browser` |

اگر یک skill شکست خورد، بررسی کنید آیا باینری آن بیلد ARM دارد یا نه. بسیاری از ابزارهای Go/Rust دارند؛ برخی ندارند.

### ۳۲ بیتی در برابر ۶۴ بیتی

**همیشه از سیستم‌عامل ۶۴ بیتی استفاده کنید.** Node.js و بسیاری از ابزارهای مدرن به آن نیاز دارند. با این دستور بررسی کنید:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## راه‌اندازی پیشنهادی مدل

از آنجا که Pi فقط Gateway است (مدل‌ها در ابر اجرا می‌شوند)، از مدل‌های مبتنی بر API استفاده کنید:

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

**سعی نکنید LLMهای محلی را روی Pi اجرا کنید**؛ حتی مدل‌های کوچک هم بیش از حد کند هستند. بگذارید Claude/GPT کار سنگین را انجام دهند.

---

## شروع خودکار هنگام بوت

راه‌اندازی اولیه این مورد را تنظیم می‌کند، اما برای بررسی:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## عیب‌یابی

### کمبود حافظه (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### عملکرد کند

- به‌جای کارت SD از USB SSD استفاده کنید
- سرویس‌های استفاده‌نشده را غیرفعال کنید: `sudo systemctl disable cups bluetooth avahi-daemon`
- محدودسازی CPU را بررسی کنید: `vcgencmd get_throttled` (باید `0x0` برگرداند)

### سرویس شروع نمی‌شود

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### مشکلات باینری ARM

اگر یک skill با خطای "exec format error" شکست خورد:

1. بررسی کنید آیا باینری بیلد ARM64 دارد
2. ساخت از سورس را امتحان کنید
3. یا از یک کانتینر Docker با پشتیبانی ARM استفاده کنید

### قطع شدن WiFi

برای Piهای بدون نمایشگر روی WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## مقایسه هزینه

| راه‌اندازی       | هزینه یک‌باره | هزینه ماهانه | یادداشت‌ها                    |
| ---------------- | ------------- | ------------ | ----------------------------- |
| **Pi 4 (2GB)**   | ~$45          | $0           | + برق (~$5/yr)                |
| **Pi 4 (4GB)**   | ~$55          | $0           | توصیه‌شده                     |
| **Pi 5 (4GB)**   | ~$60          | $0           | بهترین عملکرد                 |
| **Pi 5 (8GB)**   | ~$80          | $0           | بیش‌ازحد نیاز، اما آینده‌نگر  |
| DigitalOcean     | $0            | $6/mo        | $72/year                      |
| Hetzner          | $0            | €3.79/mo     | ~$50/year                     |

**نقطه سربه‌سر:** Pi در حدود ۶ تا ۱۲ ماه در مقایسه با VPS ابری هزینه خود را جبران می‌کند.

---

## مرتبط

- [راهنمای Linux](/fa/platforms/linux) — راه‌اندازی عمومی Linux
- [راهنمای DigitalOcean](/fa/install/digitalocean) — جایگزین ابری
- [راهنمای Hetzner](/fa/install/hetzner) — راه‌اندازی Docker
- [Tailscale](/fa/gateway/tailscale) — دسترسی راه‌دور
- [Nodes](/fa/nodes) — جفت‌سازی لپ‌تاپ/تلفن شما با Gateway روی Pi
