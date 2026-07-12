---
read_when:
    - إعداد OpenClaw على DigitalOcean
    - البحث عن خادم VPS مدفوع بسيط لـ OpenClaw
summary: استضف OpenClaw على DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T06:04:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

شغّل Gateway دائمًا لـ OpenClaw على Droplet من DigitalOcean (نحو 6 دولارات شهريًا لخطة Basic بسعة 1 GB).

يُعد DigitalOcean خيارًا مباشرًا لخادم VPS مدفوع. للحصول على خيارات أرخص أو مجانية:

- [Hetzner](/ar/install/hetzner) -- عدد أكبر من الأنوية وذاكرة RAM مقابل كل دولار.
- [Oracle Cloud](/ar/install/oracle) -- فئة ARM المجانية دائمًا (حتى 4 OCPU وذاكرة RAM بسعة 24 GB)، لكن التسجيل قد يكون صعبًا أحيانًا، وهي تدعم ARM فقط.

## المتطلبات الأساسية

- حساب DigitalOcean ([التسجيل](https://cloud.digitalocean.com/registrations/new))
- زوج مفاتيح SSH (أو الاستعداد لاستخدام المصادقة بكلمة مرور)
- نحو 20 دقيقة

## الإعداد

<Steps>
  <Step title="إنشاء Droplet">
    <Warning>
    استخدم صورة أساسية نظيفة (Ubuntu 24.04 LTS). تجنّب صور Marketplace التابعة لجهات خارجية والمثبّتة بنقرة واحدة، ما لم تكن قد راجعت نصوص بدء التشغيل البرمجية وإعدادات جدار الحماية الافتراضية الخاصة بها.
    </Warning>

    1. سجّل الدخول إلى [DigitalOcean](https://cloud.digitalocean.com/).
    2. انقر على **Create > Droplets**.
    3. اختر:
       - **Region:** الأقرب إليك
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic، Regular،‏ 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** مفتاح SSH (موصى به) أو كلمة مرور
    4. انقر على **Create Droplet** ودوّن عنوان IP.

  </Step>

  <Step title="الاتصال والتثبيت">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    استخدم صدفة root لتهيئة النظام الأولية فقط. شغّل أوامر OpenClaw باستخدام المستخدم `openclaw` غير الجذر، بحيث تُحفظ الحالة ضمن `/home/openclaw/.openclaw/` ويُثبَّت Gateway كخدمة systemd ‏`--user` لذلك المستخدم.

  </Step>

  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال مصادقة النموذج وإعداد القنوات وإنشاء رمز Gateway وتثبيت الخدمة الخفية (خدمة مستخدم systemd).

  </Step>

  <Step title="إضافة مساحة تبديل (موصى بها لخوادم Droplet بسعة 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="التحقق من Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="الوصول إلى واجهة التحكم">
    يرتبط Gateway افتراضيًا بواجهة local loopback. اختر أحد الخيارات التالية.

    **الخيار أ: نفق SSH (الأبسط)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    ثم افتح `http://localhost:18789`.

    **الخيار ب: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    ثم افتح `https://<magicdns>/` من أي جهاز على شبكة tailnet الخاصة بك.

    يصادق Tailscale Serve حركة مرور واجهة التحكم وWebSocket عبر ترويسات هوية tailnet، ما يفترض أن مضيف Gateway نفسه موثوق به. وتظل نقاط نهاية HTTP API تتبع وضع المصادقة المعتاد لـ Gateway (الرمز/كلمة المرور) بصرف النظر عن ذلك. لفرض بيانات اعتماد صريحة بسر مشترك عبر Serve، اضبط `gateway.auth.allowTailscale: false` واستخدم `gateway.auth.mode: "token"` أو `"password"`.

    **الخيار ج: الارتباط بشبكة tailnet (من دون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    ثم افتح `http://<tailscale-ip>:18789` (الرمز مطلوب).

  </Step>
</Steps>

## الاستمرارية والنسخ الاحتياطية

تُحفظ حالة OpenClaw ضمن:

- `~/.openclaw/` -- ملف `openclaw.json`، وبيانات اعتماد القنوات/موفّري الخدمة، وملف `auth-profiles.json` لكل وكيل، وبيانات الجلسات.
- `~/.openclaw/workspace/` -- مساحة عمل الوكيل (SOUL.md والذاكرة والعناصر الناتجة).

تظل هذه البيانات محفوظة بعد إعادة تشغيل Droplet. لإنشاء لقطة محمولة:

```bash
openclaw backup create
```

تنسخ لقطات DigitalOcean احتياطيًا Droplet بالكامل؛ أما `openclaw backup create` فينتج نسخة قابلة للنقل بين المضيفين.

## نصائح لذاكرة RAM بسعة 1 GB

لا يحتوي Droplet البالغ سعره 6 دولارات إلا على 1 GB من ذاكرة RAM. للحفاظ على سلاسة التشغيل:

- تأكد من وجود خطوة إعداد مساحة التبديل أعلاه في `/etc/fstab` حتى تستمر بعد إعادة التشغيل.
- فضّل النماذج المستندة إلى API ‏(Claude وGPT) على النماذج المحلية -- إذ لا يلائم استدلال LLM المحلي ذاكرة بسعة 1 GB.
- اضبط `agents.defaults.model.primary` على نموذج أصغر إذا واجهت أخطاء نفاد الذاكرة مع المطالبات الكبيرة.
- راقب الموارد باستخدام `free -h` و`htop`.

## استكشاف الأخطاء وإصلاحها

**لا يبدأ Gateway** -- شغّل `openclaw doctor --non-interactive` وتحقق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service -n 50`.

**المنفذ مستخدم بالفعل** -- شغّل `lsof -i :18789` للعثور على العملية، ثم أوقفها.

**نفاد الذاكرة** -- تحقق من أن مساحة التبديل نشطة باستخدام `free -h`. إذا استمرت أخطاء نفاد الذاكرة، فانتقل إلى النماذج المستندة إلى API ‏(Claude وGPT) بدلًا من النماذج المحلية، أو رقِّ Droplet إلى سعة 2 GB.

## الخطوات التالية

- [القنوات](/ar/channels) -- صِل Telegram وWhatsApp وDiscord وغيرها
- [إعداد Gateway](/ar/gateway/configuration) -- جميع خيارات الإعداد
- [التحديث](/ar/install/updating) -- حافظ على تحديث OpenClaw

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
- [استضافة VPS](/ar/vps)
