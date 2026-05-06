---
read_when:
    - إعداد OpenClaw على DigitalOcean
    - البحث عن خادم افتراضي خاص مدفوع وبسيط لـ OpenClaw
summary: استضافة OpenClaw على DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T08:00:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

شغّل OpenClaw Gateway مستمرًا على DigitalOcean Droplet (نحو 6 دولارات/شهر لخطة Basic بسعة 1 GB).

DigitalOcean هو أبسط مسار VPS مدفوع. إذا كنت تفضّل خيارات أرخص أو مجانية:

- [Hetzner](/ar/install/hetzner) — 3.79 يورو/شهر، أنوية/RAM أكثر مقابل كل دولار.
- [Oracle Cloud](/ar/install/oracle) — ARM مجاني دائمًا (حتى 4 OCPU و24 GB RAM)، لكن التسجيل قد يكون مزعجًا ويقتصر على ARM فقط.

## المتطلبات الأساسية

- حساب DigitalOcean ([التسجيل](https://cloud.digitalocean.com/registrations/new))
- زوج مفاتيح SSH (أو الاستعداد لاستخدام مصادقة كلمة المرور)
- نحو 20 دقيقة

## الإعداد

<Steps>
  <Step title="إنشاء Droplet">
    <Warning>
    استخدم صورة أساسية نظيفة (Ubuntu 24.04 LTS). تجنّب صور Marketplace ذات النقرة الواحدة من جهات خارجية ما لم تكن قد راجعت سكربتات بدء التشغيل وإعدادات جدار الحماية الافتراضية الخاصة بها.
    </Warning>

    1. سجّل الدخول إلى [DigitalOcean](https://cloud.digitalocean.com/).
    2. انقر على **Create > Droplets**.
    3. اختر:
       - **المنطقة:** الأقرب إليك
       - **الصورة:** Ubuntu 24.04 LTS
       - **الحجم:** Basic، Regular، 1 vCPU / 1 GB RAM / 25 GB SSD
       - **المصادقة:** مفتاح SSH (موصى به) أو كلمة مرور
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
    openclaw --version
    ```

  </Step>

  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال مصادقة النموذج، وإعداد القناة، وإنشاء رمز Gateway، وتثبيت الخدمة الخفية (systemd).

  </Step>

  <Step title="إضافة swap (موصى بها لـ Droplets بسعة 1 GB)">
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
    يرتبط Gateway بعنوان loopback افتراضيًا. اختر أحد هذه الخيارات.

    **الخيار أ: نفق SSH (الأبسط)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    ثم افتح `http://localhost:18789`.

    **الخيار ب: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    ثم افتح `https://<magicdns>/` من أي جهاز على tailnet الخاص بك.

    يقوم Tailscale Serve بمصادقة واجهة التحكم وحركة مرور WebSocket عبر ترويسات هوية tailnet، وهو ما يفترض أن مضيف Gateway نفسه موثوق. تتبع نقاط نهاية HTTP API وضع المصادقة العادي لـ Gateway (رمز/كلمة مرور) في جميع الأحوال. لطلب بيانات اعتماد صريحة بمفتاح سري مشترك عبر Serve، اضبط `gateway.auth.allowTailscale: false` واستخدم `gateway.auth.mode: "token"` أو `"password"`.

    **الخيار ج: ربط Tailnet (بدون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    ثم افتح `http://<tailscale-ip>:18789` (الرمز مطلوب).

  </Step>
</Steps>

## الاستمرارية والنسخ الاحتياطية

توجد حالة OpenClaw ضمن:

- `~/.openclaw/` — `openclaw.json`، و`auth-profiles.json` لكل وكيل، وحالة القنوات/المزوّدين، وبيانات الجلسات.
- `~/.openclaw/workspace/` — مساحة عمل الوكيل (SOUL.md، الذاكرة، المصنوعات).

تبقى هذه البيانات بعد إعادة تشغيل Droplet. لأخذ لقطة قابلة للنقل:

```bash
openclaw backup create
```

تنسخ لقطات DigitalOcean احتياطيًا كامل Droplet؛ أما `openclaw backup create` فهو قابل للنقل بين المضيفين.

## نصائح RAM بسعة 1 GB

لا يحتوي Droplet بسعر 6 دولارات إلا على 1 GB RAM. للحفاظ على سلاسة التشغيل:

- تأكد من أن خطوة swap أعلاه موجودة في `/etc/fstab` حتى تبقى بعد إعادة التشغيل.
- فضّل النماذج المستندة إلى API (Claude، GPT) على النماذج المحلية — لا يتسع استدلال LLM المحلي ضمن 1 GB.
- اضبط `agents.defaults.model.primary` على نموذج أصغر إذا واجهت حالات OOM مع المطالبات الكبيرة.
- راقب باستخدام `free -h` و`htop`.

## استكشاف الأخطاء وإصلاحها

**Gateway لا يبدأ** -- شغّل `openclaw doctor --non-interactive` وتحقق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service -n 50`.

**المنفذ مستخدم بالفعل** -- شغّل `lsof -i :18789` للعثور على العملية، ثم أوقفها.

**نفاد الذاكرة** -- تحقق من أن swap نشط باستخدام `free -h`. إذا كنت لا تزال تواجه OOM، فاستخدم النماذج المستندة إلى API (Claude، GPT) بدلًا من النماذج المحلية، أو قم بالترقية إلى Droplet بسعة 2 GB.

## الخطوات التالية

- [القنوات](/ar/channels) -- وصّل Telegram وWhatsApp وDiscord والمزيد
- [إعدادات Gateway](/ar/gateway/configuration) -- جميع خيارات الإعداد
- [التحديث](/ar/install/updating) -- حافظ على OpenClaw محدّثًا

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
- [استضافة VPS](/ar/vps)
