---
read_when:
    - إعداد OpenClaw على Raspberry Pi
    - تشغيل OpenClaw على أجهزة ARM
    - بناء ذكاء اصطناعي شخصي منخفض التكلفة يعمل دائمًا
summary: OpenClaw على Raspberry Pi (إعداد استضافة ذاتية منخفض التكلفة)
title: Raspberry Pi (المنصة)
x-i18n:
    generated_at: "2026-04-30T08:12:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw على Raspberry Pi

## الهدف

تشغيل OpenClaw Gateway دائم ومستمر على Raspberry Pi بتكلفة لمرة واحدة تبلغ **~35-80 دولارًا** (دون رسوم شهرية).

مثالي لـ:

- مساعد ذكاء اصطناعي شخصي يعمل على مدار الساعة
- مركز أتمتة منزلية
- بوت Telegram/WhatsApp منخفض الاستهلاك ومتاح دائمًا

## متطلبات العتاد

| طراز Pi         | RAM     | يعمل؟       | ملاحظات                                |
| --------------- | ------- | ------------ | -------------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ الأفضل    | الأسرع، موصى به                         |
| **Pi 4**        | 4GB     | ✅ جيد       | الخيار الأنسب لمعظم المستخدمين          |
| **Pi 4**        | 2GB     | ✅ مقبول     | يعمل، أضف swap                          |
| **Pi 4**        | 1GB     | ⚠️ محدود     | ممكن مع swap وتكوين بسيط                |
| **Pi 3B+**      | 1GB     | ⚠️ بطيء      | يعمل لكنه متباطئ                        |
| **Pi Zero 2 W** | 512MB   | ❌           | غير موصى به                             |

**الحد الأدنى للمواصفات:** RAM بسعة 1GB، نواة واحدة، مساحة قرص 500MB  
**الموصى به:** RAM بسعة 2GB+، نظام تشغيل 64-bit، بطاقة SD بسعة 16GB+ (أو USB SSD)

## ما تحتاج إليه

- Raspberry Pi 4 أو 5 (يوصى بـ 2GB+)
- بطاقة MicroSD (16GB+) أو USB SSD (أداء أفضل)
- مزود طاقة (يوصى بمزود طاقة Pi الرسمي)
- اتصال بالشبكة (Ethernet أو WiFi)
- ~30 دقيقة

## 1) تثبيت نظام التشغيل

استخدم **Raspberry Pi OS Lite (64-bit)** — لا حاجة إلى سطح مكتب لخادم بلا شاشة.

1. نزّل [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. اختر نظام التشغيل: **Raspberry Pi OS Lite (64-bit)**
3. انقر أيقونة الترس (⚙️) للتهيئة المسبقة:
   - عيّن اسم المضيف: `gateway-host`
   - فعّل SSH
   - عيّن اسم المستخدم/كلمة المرور
   - اضبط WiFi (إذا كنت لا تستخدم Ethernet)
4. ثبّت النظام على بطاقة SD / محرك USB
5. أدخل الوسيط وشغّل Pi

## 2) الاتصال عبر SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) إعداد النظام

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) تثبيت Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) إضافة Swap (مهم لسعة 2GB أو أقل)

يمنع swap أعطال نفاد الذاكرة:

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

## 6) تثبيت OpenClaw

### الخيار أ: تثبيت قياسي (موصى به)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### الخيار ب: تثبيت قابل للتعديل (للتجربة)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

يمنحك التثبيت القابل للتعديل وصولًا مباشرًا إلى السجلات والكود — وهذا مفيد لتصحيح المشكلات الخاصة بـ ARM.

## 7) تشغيل التهيئة الأولية

```bash
openclaw onboard --install-daemon
```

اتبع المعالج:

1. **وضع Gateway:** محلي
2. **المصادقة:** يوصى بمفاتيح API (قد يكون OAuth مزعجًا على Pi بلا شاشة)
3. **القنوات:** Telegram هو الأسهل للبدء
4. **Daemon:** نعم (systemd)

## 8) التحقق من التثبيت

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) الوصول إلى لوحة تحكم OpenClaw

استبدل `user@gateway-host` باسم مستخدم Pi واسم المضيف أو عنوان IP.

على جهاز الكمبيوتر، اطلب من Pi طباعة عنوان URL جديد للوحة التحكم:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

يطبع الأمر `Dashboard URL:`. بناءً على كيفية تكوين `gateway.auth.token`،
قد يكون عنوان URL رابطًا عاديًا مثل `http://127.0.0.1:18789/` أو رابطًا
يتضمن `#token=...`.

في طرفية أخرى على جهاز الكمبيوتر، أنشئ نفق SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

ثم افتح عنوان URL المطبوع للوحة التحكم في متصفحك المحلي.

إذا طلبت الواجهة مصادقة السر المشترك، الصق الرمز أو كلمة المرور المكوّنة
في إعدادات Control UI. لمصادقة الرمز، استخدم `gateway.auth.token` (أو
`OPENCLAW_GATEWAY_TOKEN`).

للوصول البعيد الدائم، راجع [Tailscale](/ar/gateway/tailscale).

---

## تحسينات الأداء

### استخدام USB SSD (تحسين كبير)

بطاقات SD بطيئة وتبلى. يحسّن USB SSD الأداء بشكل كبير:

```bash
# Check if booting from USB
lsblk
```

راجع [دليل إقلاع Pi عبر USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) للإعداد.

### تسريع بدء CLI (ذاكرة التخزين المؤقت لتجميع الوحدات)

على مضيفات Pi الأقل قدرة، فعّل ذاكرة التخزين المؤقت لتجميع الوحدات في Node حتى تكون عمليات تشغيل CLI المتكررة أسرع:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

ملاحظات:

- يسرّع `NODE_COMPILE_CACHE` عمليات التشغيل اللاحقة (`status`، `health`، `--help`).
- يبقى `/var/tmp` بعد إعادة التشغيل أفضل من `/tmp`.
- يتجنب `OPENCLAW_NO_RESPAWN=1` تكلفة بدء إضافية من إعادة تشغيل CLI لنفسه.
- التشغيل الأول يجهّز ذاكرة التخزين المؤقت؛ وتستفيد عمليات التشغيل اللاحقة أكثر.

### ضبط بدء systemd (اختياري)

إذا كان هذا Pi يشغّل OpenClaw غالبًا، أضف drop-in للخدمة لتقليل تفاوت إعادة التشغيل
والحفاظ على استقرار بيئة البدء:

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

ثم طبّق:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

إن أمكن، أبقِ حالة OpenClaw وذاكرة التخزين المؤقت على تخزين مدعوم بـ SSD لتجنب
اختناقات الإدخال/الإخراج العشوائي لبطاقة SD أثناء بدء التشغيل البارد.

إذا كان هذا Pi بلا شاشة، فعّل lingering مرة واحدة حتى تبقى خدمة المستخدم
بعد تسجيل الخروج:

```bash
sudo loginctl enable-linger "$(whoami)"
```

كيف تساعد سياسات `Restart=` على الاسترداد الآلي:
[يمكن لـ systemd أتمتة استرداد الخدمة](https://www.redhat.com/en/blog/systemd-automate-recovery).

### تقليل استخدام الذاكرة

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### مراقبة الموارد

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ملاحظات خاصة بـ ARM

### توافق الثنائيات

تعمل معظم ميزات OpenClaw على ARM64، لكن قد تحتاج بعض الثنائيات الخارجية إلى إصدارات ARM:

| الأداة             | حالة ARM64 | ملاحظات                              |
| ------------------ | ---------- | ------------------------------------ |
| Node.js            | ✅         | يعمل بشكل ممتاز                       |
| WhatsApp (Baileys) | ✅         | JS خالص، لا توجد مشكلات              |
| Telegram           | ✅         | JS خالص، لا توجد مشكلات              |
| gog (Gmail CLI)    | ⚠️         | تحقق من وجود إصدار ARM               |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser`  |

إذا فشلت مهارة، تحقق مما إذا كانت ثنائيتها تملك إصدار ARM. كثير من أدوات Go/Rust تفعل ذلك؛ وبعضها لا.

### 32-bit مقابل 64-bit

**استخدم دائمًا نظام تشغيل 64-bit.** يتطلبه Node.js والعديد من الأدوات الحديثة. تحقق عبر:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## إعداد النموذج الموصى به

بما أن Pi هو فقط Gateway (تعمل النماذج في السحابة)، استخدم النماذج المعتمدة على API:

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

**لا تحاول تشغيل LLMs محلية على Pi** — حتى النماذج الصغيرة بطيئة جدًا. دع Claude/GPT يتوليان العمل الثقيل.

---

## البدء التلقائي عند الإقلاع

تضبط التهيئة الأولية هذا، لكن للتحقق:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## استكشاف الأخطاء وإصلاحها

### نفاد الذاكرة (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### بطء الأداء

- استخدم USB SSD بدلًا من بطاقة SD
- عطّل الخدمات غير المستخدمة: `sudo systemctl disable cups bluetooth avahi-daemon`
- تحقق من خنق CPU: `vcgencmd get_throttled` (يجب أن يعيد `0x0`)

### الخدمة لا تبدأ

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### مشكلات ثنائيات ARM

إذا فشلت مهارة مع "exec format error":

1. تحقق مما إذا كانت الثنائية لديها إصدار ARM64
2. جرّب البناء من المصدر
3. أو استخدم حاوية Docker مع دعم ARM

### انقطاعات WiFi

لأجهزة Pi بلا شاشة على WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## مقارنة التكلفة

| الإعداد        | تكلفة لمرة واحدة | التكلفة الشهرية | ملاحظات                         |
| -------------- | ---------------- | --------------- | ------------------------------- |
| **Pi 4 (2GB)** | ~$45             | $0              | + طاقة (~$5/سنة)                |
| **Pi 4 (4GB)** | ~$55             | $0              | موصى به                         |
| **Pi 5 (4GB)** | ~$60             | $0              | أفضل أداء                       |
| **Pi 5 (8GB)** | ~$80             | $0              | أكثر من الحاجة لكنه مناسب للمستقبل |
| DigitalOcean   | $0               | $6/mo           | $72/year                        |
| Hetzner        | $0               | €3.79/mo        | ~$50/year                       |

**نقطة التعادل:** يسدد Pi تكلفته خلال ~6-12 شهرًا مقارنة بخادم VPS سحابي.

---

## ذات صلة

- [دليل Linux](/ar/platforms/linux) — إعداد Linux عام
- [دليل DigitalOcean](/ar/install/digitalocean) — بديل سحابي
- [دليل Hetzner](/ar/install/hetzner) — إعداد Docker
- [Tailscale](/ar/gateway/tailscale) — وصول بعيد
- [Nodes](/ar/nodes) — إقران حاسوبك المحمول/هاتفك مع Pi gateway
