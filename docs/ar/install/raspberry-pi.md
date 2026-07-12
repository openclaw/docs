---
read_when:
    - إعداد OpenClaw على Raspberry Pi
    - تشغيل OpenClaw على أجهزة ARM
    - إنشاء ذكاء اصطناعي شخصي منخفض التكلفة يعمل باستمرار
summary: استضف OpenClaw على Raspberry Pi للاستضافة الذاتية الدائمة التشغيل
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T06:05:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

شغّل Gateway دائمًا ومستمرًا لـ OpenClaw على Raspberry Pi. بما أن Pi ليس سوى البوابة (تعمل النماذج في السحابة عبر API)، فإن جهاز Pi متواضع الإمكانات يتعامل مع عبء العمل بكفاءة — تتراوح تكلفة الأجهزة عادةً بين **35 و80 دولارًا لمرة واحدة**، من دون رسوم شهرية.

## توافق الأجهزة

| طراز Pi     | ذاكرة RAM | هل يعمل؟ | ملاحظات                                  |
| ----------- | --------- | -------- | ---------------------------------------- |
| Pi 5        | 4/8 GB    | الأفضل   | الأسرع، ويُنصح به.                       |
| Pi 4        | 4 GB      | جيد      | الخيار الأنسب لمعظم المستخدمين.          |
| Pi 4        | 2 GB      | مقبول    | أضف مساحة تبديل.                         |
| Pi 4        | 1 GB      | محدود    | ممكن مع مساحة تبديل وإعدادات بسيطة.       |
| Pi 3B+      | 1 GB      | بطيء     | يعمل، لكن أداءه بطيء.                    |
| Pi Zero 2 W | 512 MB    | لا       | لا يُنصح به.                             |

**الحد الأدنى:** ذاكرة RAM بسعة 1 GB، ونواة واحدة، ومساحة قرص خالية قدرها 500 MB، ونظام تشغيل 64 بت.
**الموصى به:** ذاكرة RAM بسعة 2 GB أو أكثر، وبطاقة SD بسعة 16 GB أو أكثر (أو USB SSD)، واتصال Ethernet.

## المتطلبات الأساسية

- Raspberry Pi 4 أو 5 بذاكرة RAM سعتها 2 GB أو أكثر (يُنصح بـ 4 GB)
- بطاقة MicroSD بسعة 16 GB أو أكثر، أو USB SSD (لأداء أفضل)
- مزوّد طاقة رسمي لـ Pi
- اتصال بالشبكة (Ethernet أو WiFi)
- نظام Raspberry Pi OS بإصدار 64 بت (مطلوب — لا تستخدم إصدار 32 بت)
- نحو 30 دقيقة

## الإعداد

<Steps>
  <Step title="Flash the OS">
    استخدم **Raspberry Pi OS Lite (64-bit)** — لا حاجة إلى سطح مكتب لخادم يعمل دون شاشة.

    1. نزّل [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. اختر نظام التشغيل: **Raspberry Pi OS Lite (64-bit)**.
    3. اضبط مسبقًا في مربع حوار الإعدادات:
       - اسم المضيف: `gateway-host`
       - فعّل SSH
       - عيّن اسم المستخدم وكلمة المرور
       - اضبط WiFi (إذا لم تكن تستخدم Ethernet)
    4. اكتب النظام على بطاقة SD أو محرك USB، ثم أدخله وشغّل Pi.

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

    اتبع خطوات المعالج. يُنصح باستخدام مفاتيح API بدلًا من OAuth للأجهزة التي تعمل دون شاشة. Telegram هو أسهل قناة للبدء.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    احصل على عنوان URL للوحة المعلومات من Pi على حاسوبك:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    ثم أنشئ نفق SSH في طرفية أخرى:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    افتح عنوان URL المطبوع في متصفحك المحلي. للوصول البعيد الدائم، راجع [تكامل Tailscale](/ar/gateway/tailscale).

  </Step>
</Steps>

## نصائح لتحسين الأداء

**استخدم USB SSD** — بطاقات SD بطيئة وتتآكل. يحسّن USB SSD الأداء بدرجة كبيرة ويتحمّل دورات كتابة أكثر؛ استخدمه لتخزين `OPENCLAW_STATE_DIR` إذا أبقيت نظام التشغيل على بطاقة SD. راجع [دليل إقلاع Pi من USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**فعّل ذاكرة التخزين المؤقت لترجمة الوحدات** — يسرّع ذلك عمليات استدعاء CLI المتكررة على مضيفات Pi محدودة الطاقة. يحافظ `OPENCLAW_NO_RESPAWN=1` على عمليات إعادة التشغيل الاعتيادية لـ Gateway داخل العملية نفسها، ما يتجنب عمليات التسليم الإضافية بين العمليات ويُبقي تتبّع PID بسيطًا على المضيفات الصغيرة:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

استخدم `/var/tmp`، لا `/tmp` — تمسح بعض التوزيعات `/tmp` عند الإقلاع، ما يؤدي إلى فقدان ذاكرة التخزين المؤقت المهيّأة.

**قلّل استخدام الذاكرة** — في الإعدادات التي تعمل دون شاشة، حرّر ذاكرة وحدة معالجة الرسومات وعطّل الخدمات غير المستخدمة:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**إعداد إضافي لـ systemd لضمان استقرار إعادة التشغيل** — إذا كان جهاز Pi هذا مخصصًا في الغالب لتشغيل OpenClaw، فأضف إعدادًا إضافيًا للخدمة:

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

ثم نفّذ `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. على جهاز Pi يعمل دون شاشة، فعّل أيضًا استمرار خدمة المستخدم مرة واحدة لكي تبقى قيد التشغيل بعد تسجيل الخروج: `sudo loginctl enable-linger "$(whoami)"`.

## إعداد النموذج الموصى به

بما أن Pi لا يشغّل سوى Gateway، فاستخدم نماذج API المستضافة سحابيًا — لا تشغّل نماذج LLM محلية على Pi؛ فحتى النماذج الصغيرة أبطأ من أن تكون مفيدة:

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

## ملاحظات حول ملفات ARM التنفيذية

تعمل معظم ميزات OpenClaw على ARM64 دون تغييرات (Node.js وTelegram وWhatsApp/Baileys وChromium). عادةً ما تكون الملفات التنفيذية التي قد لا تتوفر لها أحيانًا إصدارات ARM أدوات CLI اختيارية مكتوبة بلغة Go أو Rust وتوفرها Skills. تحقّق من البنية باستخدام `uname -m` (يجب أن يعرض `aarch64`)، ثم ابحث في صفحة إصدارات الملف التنفيذي المفقود عن عناصر `linux-arm64` أو `aarch64` قبل اللجوء إلى البناء من المصدر.

## الاستمرارية والنسخ الاحتياطية

توجد حالة OpenClaw ضمن:

- `~/.openclaw/` — الملف `openclaw.json`، وملف `auth-profiles.json` لكل وكيل، وحالة القنوات ومزوّدي الخدمة، والجلسات.
- `~/.openclaw/workspace/` — مساحة عمل الوكيل (SOUL.md والذاكرة والعناصر الناتجة).

تبقى هذه البيانات محفوظة بعد إعادة التشغيل، ويمنحها SSD أداءً وعمرًا أطول مقارنةً ببطاقة SD. أنشئ لقطة قابلة للنقل باستخدام:

```bash
openclaw backup create
```

## استكشاف الأخطاء وإصلاحها

**نفاد الذاكرة** — تحقّق من أن مساحة التبديل نشطة باستخدام `free -h`. عطّل الخدمات غير المستخدمة (`sudo systemctl disable cups bluetooth avahi-daemon`). استخدم النماذج المعتمدة على API فقط.

**بطء الأداء** — استخدم USB SSD بدلًا من بطاقة SD. تحقّق من خفض سرعة وحدة المعالجة المركزية باستخدام `vcgencmd get_throttled` (يجب أن يعيد `0x0`).

**تعذّر بدء الخدمة** — افحص السجلات باستخدام `journalctl --user -u openclaw-gateway.service --no-pager -n 100`، ثم شغّل `openclaw doctor --non-interactive`. إذا كان جهاز Pi يعمل دون شاشة، فتحقّق أيضًا من تفعيل استمرار خدمة المستخدم: `sudo loginctl enable-linger "$(whoami)"`.

**مشكلات ملفات ARM التنفيذية** — إذا فشلت إحدى Skills مع الرسالة `"exec format error"`، فتحقّق مما إذا كان للملف التنفيذي إصدار ARM64. تحقّق من البنية باستخدام `uname -m` (يجب أن يعرض `aarch64`).

**انقطاع WiFi** — عطّل إدارة طاقة WiFi: `sudo iwconfig wlan0 power off`.

## الخطوات التالية

- [القنوات](/ar/channels) — وصّل Telegram وWhatsApp وDiscord وغيرها
- [إعداد Gateway](/ar/gateway/configuration) — جميع خيارات الإعداد
- [التحديث](/ar/install/updating) — حافظ على تحديث OpenClaw

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [خادم Linux](/ar/vps)
- [المنصات](/ar/platforms)
