---
read_when:
    - إعداد OpenClaw على Raspberry Pi
    - تشغيل OpenClaw على أجهزة ARM
    - بناء مساعد AI شخصي منخفض التكلفة ودائم التشغيل
summary: استضافة OpenClaw على Raspberry Pi من أجل استضافة ذاتية دائمة التشغيل
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-24T07:49:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

شغّل Gateway دائمة ودائمة التشغيل لـ OpenClaw على Raspberry Pi. وبما أن Pi هي مجرد Gateway ‏(إذ تعمل النماذج في السحابة عبر API)، فإن حتى Pi متواضعة تستطيع التعامل مع الحمل جيدًا.

## المتطلبات المسبقة

- Raspberry Pi 4 أو 5 مع ذاكرة RAM بحجم 2 GB أو أكثر (ويُوصى بـ 4 GB)
- بطاقة MicroSD ‏(16 GB+) أو USB SSD ‏(أداء أفضل)
- مزود طاقة رسمي لـ Pi
- اتصال شبكة (Ethernet أو WiFi)
- Raspberry Pi OS إصدار 64-bit ‏(مطلوب -- لا تستخدم 32-bit)
- نحو 30 دقيقة

## الإعداد

<Steps>
  <Step title="نسخ نظام التشغيل">
    استخدم **Raspberry Pi OS Lite (64-bit)** -- لا حاجة إلى سطح مكتب لخادم دون واجهة.

    1. نزّل [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. اختر نظام التشغيل: **Raspberry Pi OS Lite (64-bit)**.
    3. في مربع حوار الإعدادات، قم بتهيئة:
       - اسم المضيف: `gateway-host`
       - تفعيل SSH
       - ضبط اسم المستخدم وكلمة المرور
       - تهيئة WiFi ‏(إذا لم تكن تستخدم Ethernet)
    4. انسخ إلى بطاقة SD أو محرك USB، ثم أدخله وشغّل Pi.

  </Step>

  <Step title="الاتصال عبر SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="تحديث النظام">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # ضبط المنطقة الزمنية (مهم لـ Cron والتذكيرات)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="تثبيت Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="إضافة swap (مهم لـ 2 GB أو أقل)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # تقليل swappiness للأجهزة ذات الذاكرة المنخفضة
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="تثبيت OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    اتبع المعالج. وتُفضَّل مفاتيح API على OAuth للأجهزة من دون واجهة. ويُعد Telegram أسهل قناة للبدء بها.

  </Step>

  <Step title="التحقق">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="الوصول إلى Control UI">
    على جهاز الكمبيوتر لديك، احصل على عنوان URL للوحة المعلومات من Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    ثم أنشئ نفق SSH في طرفية أخرى:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    افتح عنوان URL المطبوع في browser المحلية لديك. وللوصول البعيد الدائم التشغيل، راجع [تكامل Tailscale](/ar/gateway/tailscale).

  </Step>
</Steps>

## نصائح الأداء

**استخدم USB SSD** -- بطاقات SD بطيئة وتتلف مع الوقت. ويُحسّن USB SSD الأداء بشكل كبير. راجع [دليل إقلاع Pi عبر USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**فعّل module compile cache** -- يسرّع عمليات استدعاء CLI المتكررة على مضيفات Pi الأضعف:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**قلّل استخدام الذاكرة** -- بالنسبة إلى الإعدادات دون واجهة، حرّر ذاكرة GPU وعطّل الخدمات غير المستخدمة:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## استكشاف الأخطاء وإصلاحها

**نفاد الذاكرة** -- تحقق من أن swap نشطة باستخدام `free -h`. عطّل الخدمات غير المستخدمة (`sudo systemctl disable cups bluetooth avahi-daemon`). استخدم نماذج معتمدة على API فقط.

**الأداء البطيء** -- استخدم USB SSD بدلًا من بطاقة SD. تحقق من وجود اختناق في CPU باستخدام `vcgencmd get_throttled` ‏(يجب أن يعيد `0x0`).

**الخدمة لا تبدأ** -- تحقق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service --no-pager -n 100` وشغّل `openclaw doctor --non-interactive`. وإذا كانت هذه Pi دون واجهة، فتحقق أيضًا من تفعيل lingering: ‏`sudo loginctl enable-linger "$(whoami)"`.

**مشكلات ثنائيات ARM** -- إذا فشلت Skill برسالة "exec format error", فتحقق مما إذا كان للملف الثنائي إصدار ARM64. وتحقق من البنية باستخدام `uname -m` ‏(يجب أن يُظهر `aarch64`).

**انقطاع WiFi** -- عطّل إدارة طاقة WiFi: ‏`sudo iwconfig wlan0 power off`.

## الخطوات التالية

- [القنوات](/ar/channels) -- صِل Telegram وWhatsApp وDiscord والمزيد
- [تهيئة Gateway](/ar/gateway/configuration) -- جميع خيارات التهيئة
- [التحديث](/ar/install/updating) -- أبقِ OpenClaw محدّثًا

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [خادم Linux](/ar/vps)
- [المنصات](/ar/platforms)
