---
read_when:
    - إعداد OpenClaw على Raspberry Pi
    - تشغيل OpenClaw على أجهزة ARM
    - بناء ذكاء اصطناعي شخصي منخفض التكلفة ودائم التشغيل
summary: OpenClaw على Raspberry Pi (إعداد مستضاف ذاتيًا منخفض التكلفة)
title: Raspberry Pi (المنصة)
x-i18n:
    generated_at: "2026-04-24T07:53:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw على Raspberry Pi

## الهدف

تشغيل Gateway دائم ومستمر لـ OpenClaw على Raspberry Pi بتكلفة **تقريبًا 35-80 دولارًا** لمرة واحدة (من دون رسوم شهرية).

مثالي لـ:

- مساعد ذكاء اصطناعي شخصي على مدار الساعة طوال أيام الأسبوع
- محور أتمتة منزلية
- بوت Telegram/WhatsApp منخفض الاستهلاك ودائم التوفر

## متطلبات العتاد

| طراز Pi         | الذاكرة | هل يعمل؟ | ملاحظات                           |
| --------------- | ------- | -------- | --------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ الأفضل | الأسرع، والموصى به               |
| **Pi 4**        | 4GB     | ✅ جيد    | أفضل توازن لمعظم المستخدمين       |
| **Pi 4**        | 2GB     | ✅ مقبول  | يعمل، أضف swap                    |
| **Pi 4**        | 1GB     | ⚠️ ضيق    | ممكن مع swap، وإعدادات دنيا       |
| **Pi 3B+**      | 1GB     | ⚠️ بطيء   | يعمل لكنه بطيء                    |
| **Pi Zero 2 W** | 512MB   | ❌        | غير موصى به                       |

**الحد الأدنى للمواصفات:** 1GB RAM، ونواة واحدة، و500MB قرص  
**الموصى به:** 2GB+ RAM، ونظام تشغيل 64-bit، وبطاقة SD سعة 16GB+ (أو USB SSD)

## ما الذي تحتاجه

- Raspberry Pi 4 أو 5 ‏(يوصى بـ 2GB+)
- بطاقة MicroSD ‏(16GB+) أو USB SSD ‏(أداء أفضل)
- مزود طاقة (ويُوصى بمزود طاقة Pi الرسمي)
- اتصال شبكة (Ethernet أو WiFi)
- حوالي 30 دقيقة

## 1) اكتب نظام التشغيل

استخدم **Raspberry Pi OS Lite (64-bit)** — لا حاجة إلى واجهة سطح مكتب لخادم بلا واجهة.

1. نزّل [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. اختر نظام التشغيل: **Raspberry Pi OS Lite (64-bit)**
3. انقر على أيقونة الترس (⚙️) للإعداد المسبق:
   - اضبط اسم المضيف: `gateway-host`
   - فعّل SSH
   - اضبط اسم المستخدم/كلمة المرور
   - اضبط WiFi ‏(إذا كنت لا تستخدم Ethernet)
4. اكتب النظام إلى بطاقة SD / محرك USB
5. أدخل البطاقة وأقلِع Pi

## 2) اتصل عبر SSH

```bash
ssh user@gateway-host
# أو استخدم عنوان IP
ssh user@192.168.x.x
```

## 3) إعداد النظام

```bash
# حدّث النظام
sudo apt update && sudo apt upgrade -y

# ثبّت الحزم الأساسية
sudo apt install -y git curl build-essential

# اضبط المنطقة الزمنية (مهم لـ Cron/التذكيرات)
sudo timedatectl set-timezone America/Chicago  # غيّرها إلى منطقتك الزمنية
```

## 4) ثبّت Node.js 24 ‏(ARM64)

```bash
# ثبّت Node.js عبر NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# تحقّق
node --version  # يجب أن يعرض v24.x.x
npm --version
```

## 5) أضف Swap ‏(مهم لـ 2GB أو أقل)

يمنع Swap أعطال نفاد الذاكرة:

```bash
# أنشئ ملف swap بحجم 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# اجعله دائمًا
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# حسّنه للذاكرة القليلة (تقليل swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) ثبّت OpenClaw

### الخيار A: التثبيت القياسي (موصى به)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### الخيار B: التثبيت القابل للاختراق (للتجربة)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

يمنحك التثبيت القابل للاختراق وصولًا مباشرًا إلى السجلات والشيفرة — وهو مفيد لتصحيح المشكلات الخاصة بـ ARM.

## 7) شغّل الإعداد الأولي

```bash
openclaw onboard --install-daemon
```

اتبع المعالج:

1. **وضع Gateway:** محلي
2. **المصادقة:** يُوصى باستخدام مفاتيح API ‏(قد يكون OAuth متقلبًا على Pi بلا واجهة)
3. **القنوات:** يُعد Telegram الأسهل للبدء
4. **Daemon:** نعم (systemd)

## 8) تحقّق من التثبيت

```bash
# تحقّق من الحالة
openclaw status

# تحقّق من الخدمة (التثبيت القياسي = وحدة systemd للمستخدم)
systemctl --user status openclaw-gateway.service

# اعرض السجلات
journalctl --user -u openclaw-gateway.service -f
```

## 9) الوصول إلى لوحة معلومات OpenClaw

استبدل `user@gateway-host` باسم مستخدم Pi واسم المضيف أو عنوان IP.

على جهازك، اطلب من Pi طباعة عنوان URL جديد للوحة المعلومات:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

يطبع الأمر `Dashboard URL:`. واعتمادًا على كيفية إعداد
`gateway.auth.token`، قد يكون عنوان URL رابطًا عاديًا مثل `http://127.0.0.1:18789/` أو رابطًا
يتضمن `#token=...`.

في طرفية أخرى على جهازك، أنشئ نفق SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

ثم افتح عنوان URL الخاص بلوحة المعلومات المطبوع في متصفحك المحلي.

إذا طلبت واجهة المستخدم مصادقة السر المشترك، فألصق الرمز أو كلمة المرور المضبوطة
في إعدادات Control UI. وبالنسبة إلى مصادقة الرمز، استخدم `gateway.auth.token` ‏(أو
`OPENCLAW_GATEWAY_TOKEN`).

وبالنسبة إلى الوصول البعيد الدائم التشغيل، راجع [Tailscale](/ar/gateway/tailscale).

---

## تحسينات الأداء

### استخدم USB SSD ‏(تحسن كبير)

بطاقات SD بطيئة وتتعرض للاهتراء. ويؤدي استخدام USB SSD إلى تحسين الأداء بشكل كبير:

```bash
# تحقق مما إذا كنت تقلع من USB
lsblk
```

راجع [دليل الإقلاع من USB على Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) للإعداد.

### سرّع بدء CLI ‏(ذاكرة تخزين مؤقت لتجميع الوحدات)

على مضيفات Pi منخفضة الطاقة، فعّل ذاكرة التخزين المؤقت لتجميع الوحدات في Node بحيث تصبح تشغيلات CLI المتكررة أسرع:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

ملاحظات:

- يسرّع `NODE_COMPILE_CACHE` التشغيلات اللاحقة (`status`, `health`, `--help`).
- يبقى `/var/tmp` بعد إعادة التشغيل بصورة أفضل من `/tmp`.
- يتجنب `OPENCLAW_NO_RESPAWN=1` كلفة بدء إضافية ناتجة عن إعادة تشغيل CLI لنفسه.
- يسخّن التشغيل الأول ذاكرة التخزين المؤقت؛ بينما تستفيد التشغيلات اللاحقة أكثر.

### ضبط بدء systemd ‏(اختياري)

إذا كان هذا الـ Pi يشغّل OpenClaw في الغالب، فأضف drop-in للخدمة لتقليل
تذبذب إعادة التشغيل والحفاظ على استقرار بيئة البدء:

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

إن أمكن، فأبقِ حالة/ذاكرة التخزين المؤقت الخاصة بـ OpenClaw على تخزين مدعوم بـ SSD لتجنب
اختناقات I/O العشوائي الخاصة ببطاقات SD أثناء البدء البارد.

إذا كان هذا Pi بلا واجهة، ففعّل lingering مرة واحدة حتى تبقى خدمة المستخدم
بعد تسجيل الخروج:

```bash
sudo loginctl enable-linger "$(whoami)"
```

كيف تساعد سياسات `Restart=` في الاستعادة الآلية:
[يمكن لـ systemd أتمتة استعادة الخدمة](https://www.redhat.com/en/blog/systemd-automate-recovery).

### تقليل استهلاك الذاكرة

```bash
# عطّل تخصيص ذاكرة GPU (بلا واجهة)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# عطّل Bluetooth إذا لم تكن بحاجة إليه
sudo systemctl disable bluetooth
```

### راقب الموارد

```bash
# تحقّق من الذاكرة
free -h

# تحقّق من درجة حرارة CPU
vcgencmd measure_temp

# مراقبة حية
htop
```

---

## ملاحظات خاصة بـ ARM

### توافق الملفات التنفيذية

تعمل معظم ميزات OpenClaw على ARM64، لكن بعض الملفات التنفيذية الخارجية قد تحتاج إلى إصدارات ARM:

| الأداة             | حالة ARM64 | ملاحظات                              |
| ------------------ | ---------- | ------------------------------------ |
| Node.js            | ✅         | يعمل بشكل ممتاز                      |
| WhatsApp (Baileys) | ✅         | JavaScript خالص، بلا مشكلات          |
| Telegram           | ✅         | JavaScript خالص، بلا مشكلات          |
| gog (Gmail CLI)    | ⚠️         | تحقّق من وجود إصدار ARM             |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser` |

إذا فشلت Skill ما، فتحقق مما إذا كان الملف التنفيذي الخاص بها يملك إصدار ARM. فكثير من أدوات Go/Rust تملك ذلك؛ وبعضها لا يملكه.

### 32-bit مقابل 64-bit

**استخدم دائمًا نظام تشغيل 64-bit.** تتطلبه Node.js وكثير من الأدوات الحديثة. تحقق باستخدام:

```bash
uname -m
# يجب أن يعرض: aarch64 (64-bit) وليس armv7l (32-bit)
```

---

## إعداد النماذج الموصى به

بما أن Pi مجرد Gateway ‏(والنماذج تعمل في السحابة)، فاستخدم نماذج معتمدة على API:

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

**لا تحاول تشغيل LLMs محلية على Pi** — فحتى النماذج الصغيرة بطيئة جدًا. دع Claude/GPT يقومان بالعمل الثقيل.

---

## التشغيل التلقائي عند الإقلاع

يقوم الإعداد الأولي بضبط هذا، ولكن للتحقق:

```bash
# تحقق من أن الخدمة مفعلة
systemctl --user is-enabled openclaw-gateway.service

# فعّلها إذا لم تكن مفعلة
systemctl --user enable openclaw-gateway.service

# ابدأ عند الإقلاع
systemctl --user start openclaw-gateway.service
```

---

## استكشاف الأخطاء وإصلاحها

### نفاد الذاكرة (OOM)

```bash
# تحقّق من الذاكرة
free -h

# أضف المزيد من swap (راجع الخطوة 5)
# أو قلّل الخدمات العاملة على Pi
```

### أداء بطيء

- استخدم USB SSD بدلًا من بطاقة SD
- عطّل الخدمات غير المستخدمة: `sudo systemctl disable cups bluetooth avahi-daemon`
- تحقق من خنق CPU: ‏`vcgencmd get_throttled` ‏(يجب أن يعرض `0x0`)

### الخدمة لا تبدأ

```bash
# تحقّق من السجلات
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# إصلاح شائع: أعد البناء
cd ~/openclaw  # إذا كنت تستخدم التثبيت القابل للاختراق
npm run build
systemctl --user restart openclaw-gateway.service
```

### مشكلات الملفات التنفيذية على ARM

إذا فشلت Skill برسالة "exec format error":

1. تحقق مما إذا كان الملف التنفيذي يملك إصدار ARM64
2. حاول البناء من المصدر
3. أو استخدم حاوية Docker مع دعم ARM

### انقطاعات WiFi

بالنسبة إلى Pis بلا واجهة على WiFi:

```bash
# عطّل إدارة طاقة WiFi
sudo iwconfig wlan0 power off

# اجعل ذلك دائمًا
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## مقارنة التكلفة

| الإعداد          | التكلفة لمرة واحدة | التكلفة الشهرية | ملاحظات                    |
| ---------------- | ------------------ | --------------- | -------------------------- |
| **Pi 4 (2GB)**   | ~$45               | $0              | + الطاقة (~$5/سنة)         |
| **Pi 4 (4GB)**   | ~$55               | $0              | موصى به                    |
| **Pi 5 (4GB)**   | ~$60               | $0              | أفضل أداء                  |
| **Pi 5 (8GB)**   | ~$80               | $0              | مبالغ فيه لكنه مستقبلي     |
| DigitalOcean     | $0                 | $6/mo           | $72/سنة                    |
| Hetzner          | $0                 | €3.79/mo        | ~$50/سنة                   |

**نقطة التعادل:** يدفع Pi ثمن نفسه خلال نحو 6-12 شهرًا مقارنةً بـ VPS سحابي.

---

## ذو صلة

- [دليل Linux](/ar/platforms/linux) — إعداد Linux العام
- [دليل DigitalOcean](/ar/install/digitalocean) — بديل سحابي
- [دليل Hetzner](/ar/install/hetzner) — إعداد Docker
- [Tailscale](/ar/gateway/tailscale) — الوصول البعيد
- [Nodes](/ar/nodes) — أقرن حاسوبك المحمول/هاتفك مع Pi gateway
