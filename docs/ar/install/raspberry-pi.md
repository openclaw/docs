---
read_when:
    - إعداد OpenClaw على Raspberry Pi
    - تشغيل OpenClaw على أجهزة ARM
    - بناء ذكاء اصطناعي شخصي رخيص يعمل دائمًا
summary: استضافة OpenClaw على Raspberry Pi للاستضافة الذاتية الدائمة
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:53:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

شغّل OpenClaw Gateway مستمرًا ودائم التشغيل على Raspberry Pi. بما أن Pi ليس إلا Gateway (تعمل النماذج في السحابة عبر API)، فإن حتى Pi متواضعًا يتعامل مع عبء العمل جيدًا — تكلفة العتاد المعتادة هي **35–80 دولارًا تدفع مرة واحدة**، بلا رسوم شهرية.

## توافق العتاد

| طراز Pi      | الذاكرة | يعمل؟ | ملاحظات                              |
| ----------- | ------ | ------ | ----------------------------------- |
| Pi 5        | 4/8 GB | الأفضل | الأسرع، موصى به.                    |
| Pi 4        | 4 GB   | جيد    | الخيار المتوازن لمعظم المستخدمين.   |
| Pi 4        | 2 GB   | مقبول  | أضف swap.                           |
| Pi 4        | 1 GB   | محدود  | ممكن مع swap وإعدادات بسيطة.        |
| Pi 3B+      | 1 GB   | بطيء   | يعمل لكنه متثاقل.                   |
| Pi Zero 2 W | 512 MB | لا     | غير موصى به.                        |

**الحد الأدنى:** ذاكرة RAM بسعة 1 GB، نواة واحدة، مساحة قرص فارغة 500 MB، ونظام تشغيل 64-bit.
**الموصى به:** ذاكرة RAM بسعة 2 GB+، بطاقة SD بسعة 16 GB+ (أو USB SSD)، واتصال Ethernet.

## المتطلبات الأساسية

- Raspberry Pi 4 أو 5 بذاكرة RAM بسعة 2 GB+ (يوصى بـ 4 GB)
- بطاقة MicroSD ‏(16 GB+) أو USB SSD (أداء أفضل)
- مزود طاقة Pi رسمي
- اتصال شبكة (Ethernet أو WiFi)
- Raspberry Pi OS بنواة 64-bit (مطلوب -- لا تستخدم 32-bit)
- نحو 30 دقيقة

## الإعداد

<Steps>
  <Step title="Flash the OS">
    استخدم **Raspberry Pi OS Lite (64-bit)** -- لا حاجة إلى سطح مكتب لخادم بلا شاشة.

    1. نزّل [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. اختر نظام التشغيل: **Raspberry Pi OS Lite (64-bit)**.
    3. في مربع حوار الإعدادات، اضبط مسبقًا:
       - اسم المضيف: `gateway-host`
       - فعّل SSH
       - عيّن اسم المستخدم وكلمة المرور
       - اضبط WiFi (إذا لم تكن تستخدم Ethernet)
    4. اكتب النظام على بطاقة SD أو قرص USB، ثم أدخله وشغّل Pi.

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

    اتبع المعالج. يوصى بمفاتيح API بدل OAuth للأجهزة بلا شاشة. Telegram هو أسهل قناة للبدء.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    على جهاز الكمبيوتر لديك، احصل على عنوان URL للوحة التحكم من Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    ثم أنشئ نفق SSH في طرفية أخرى:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    افتح عنوان URL المطبوع في متصفحك المحلي. للوصول البعيد دائم التشغيل، راجع [تكامل Tailscale](/ar/gateway/tailscale).

  </Step>
</Steps>

## نصائح الأداء

**استخدم USB SSD** -- بطاقات SD بطيئة وتبلى. يحسّن USB SSD الأداء بدرجة كبيرة. راجع [دليل إقلاع Pi من USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**فعّل ذاكرة التخزين المؤقت لتجميع الوحدات** -- يسرّع استدعاءات CLI المتكررة على مضيفات Pi منخفضة القدرة:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

يبقي `OPENCLAW_NO_RESPAWN=1` عمليات إعادة تشغيل Gateway الروتينية داخل العملية نفسها، ما يتجنب عمليات التسليم الإضافية بين العمليات ويحافظ على بساطة تتبع PID على المضيفات الصغيرة.

**قلّل استخدام الذاكرة** -- في إعدادات التشغيل بلا شاشة، حرّر ذاكرة GPU وعطّل الخدمات غير المستخدمة:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**إضافة systemd drop-in لإعادة التشغيل المستقرة** -- إذا كان هذا Pi مخصصًا غالبًا لتشغيل OpenClaw، فأضف service drop-in:

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

ثم `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. على Pi بلا شاشة، فعّل أيضًا lingering مرة واحدة كي تبقى خدمة المستخدم تعمل بعد تسجيل الخروج: `sudo loginctl enable-linger "$(whoami)"`.

## إعداد النموذج الموصى به

بما أن Pi يشغّل Gateway فقط، استخدم نماذج API المستضافة سحابيًا:

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

لا تشغّل LLMs محلية على Pi — حتى النماذج الصغيرة بطيئة جدًا بحيث لا تكون مفيدة. دع Claude أو GPT يتولى عمل النموذج.

## ملاحظات ثنائيات ARM

تعمل معظم ميزات OpenClaw على ARM64 بلا تغييرات (Node.js وTelegram وWhatsApp/Baileys وChromium). الثنائيات التي قد لا تتوفر لها أحيانًا إصدارات ARM تكون عادة أدوات CLI اختيارية مكتوبة بـ Go/Rust ومشحونة عبر Skills. تحقق من صفحة إصدار الثنائي المفقود بحثًا عن عناصر `linux-arm64` / `aarch64` قبل الرجوع إلى البناء من المصدر.

## الاستمرارية والنسخ الاحتياطية

توجد حالة OpenClaw ضمن:

- `~/.openclaw/` — `openclaw.json`، وملف `auth-profiles.json` لكل وكيل، وحالة القنوات/المزودين، والجلسات.
- `~/.openclaw/workspace/` — مساحة عمل الوكيل (SOUL.md، والذاكرة، والآثار).

تنجو هذه البيانات من عمليات إعادة التشغيل. خذ لقطة محمولة باستخدام:

```bash
openclaw backup create
```

إذا احتفظت بها على SSD، فسيتحسن كل من الأداء والعمر الافتراضي مقارنة ببطاقة SD.

## استكشاف الأخطاء وإصلاحها

**نفاد الذاكرة** -- تحقق من أن swap نشط باستخدام `free -h`. عطّل الخدمات غير المستخدمة (`sudo systemctl disable cups bluetooth avahi-daemon`). استخدم النماذج المعتمدة على API فقط.

**الأداء بطيء** -- استخدم USB SSD بدل بطاقة SD. تحقق من خنق CPU باستخدام `vcgencmd get_throttled` (يجب أن يعيد `0x0`).

**الخدمة لا تبدأ** -- افحص السجلات باستخدام `journalctl --user -u openclaw-gateway.service --no-pager -n 100` وشغّل `openclaw doctor --non-interactive`. إذا كان هذا Pi بلا شاشة، فتحقق أيضًا من تفعيل lingering: `sudo loginctl enable-linger "$(whoami)"`.

**مشكلات ثنائيات ARM** -- إذا فشلت Skill مع "exec format error"، فتحقق مما إذا كان للثنائي إصدار ARM64. تحقق من البنية باستخدام `uname -m` (يجب أن يعرض `aarch64`).

**انقطاع WiFi** -- عطّل إدارة طاقة WiFi: `sudo iwconfig wlan0 power off`.

## الخطوات التالية

- [القنوات](/ar/channels) -- وصّل Telegram وWhatsApp وDiscord والمزيد
- [إعدادات Gateway](/ar/gateway/configuration) -- كل خيارات الإعداد
- [التحديث](/ar/install/updating) -- حافظ على OpenClaw محدثًا

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [خادم Linux](/ar/vps)
- [المنصات](/ar/platforms)
