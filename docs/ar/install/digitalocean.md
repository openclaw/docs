---
read_when:
    - إعداد OpenClaw على DigitalOcean
    - البحث عن خادم افتراضي خاص مدفوع وبسيط لـ OpenClaw
summary: استضافة OpenClaw على DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-10T19:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
    postprocess_version: locale-links-v1
---

شغّل OpenClaw Gateway دائمًا على DigitalOcean Droplet (حوالي 6 دولارات شهريًا لخطة Basic بسعة 1 GB).

DigitalOcean هو أبسط مسار VPS مدفوع. إذا كنت تفضل خيارات أرخص أو مجانية:

- [Hetzner](/ar/install/hetzner) — 3.79 يورو/شهر، مع أنوية/RAM أكثر مقابل كل دولار.
- [Oracle Cloud](/ar/install/oracle) — Always Free ARM (حتى 4 OCPU و24 GB RAM)، لكن التسجيل قد يكون متقلبًا وهو ARM فقط.

## المتطلبات الأساسية

- حساب DigitalOcean ([التسجيل](https://cloud.digitalocean.com/registrations/new))
- زوج مفاتيح SSH (أو الاستعداد لاستخدام مصادقة كلمة المرور)
- حوالي 20 دقيقة

## الإعداد

<Steps>
  <Step title="إنشاء Droplet">
    <Warning>
    استخدم صورة أساسية نظيفة (Ubuntu 24.04 LTS). تجنّب صور Marketplace ذات التثبيت بنقرة واحدة من جهات خارجية ما لم تكن قد راجعت سكربتات بدء التشغيل وإعدادات الجدار الناري الافتراضية الخاصة بها.
    </Warning>

    1. سجّل الدخول إلى [DigitalOcean](https://cloud.digitalocean.com/).
    2. انقر على **Create > Droplets**.
    3. اختر:
       - **المنطقة:** الأقرب إليك
       - **الصورة:** Ubuntu 24.04 LTS
       - **الحجم:** Basic، Regular، ‏1 vCPU / ‏1 GB RAM / ‏25 GB SSD
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

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    استخدم صدفة root فقط لتهيئة النظام الأساسية. شغّل أوامر OpenClaw كمستخدم غير root باسم `openclaw` حتى تكون الحالة ضمن `/home/openclaw/.openclaw/` ويُثبَّت Gateway كخدمة systemd لذلك المستخدم.

  </Step>

  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال مصادقة النموذج، وإعداد القناة، وتوليد رمز Gateway، وتثبيت daemon ‏(systemd).

  </Step>

  <Step title="إضافة swap (موصى به لـ Droplets بسعة 1 GB)">
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
    يرتبط Gateway بـ loopback افتراضيًا. اختر أحد هذه الخيارات.

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

    ثم افتح `https://<magicdns>/` من أي جهاز على tailnet الخاص بك.

    يصادق Tailscale Serve حركة مرور واجهة التحكم وWebSocket عبر ترويسات هوية tailnet، وهذا يفترض أن مضيف Gateway نفسه موثوق. تتبع نقاط نهاية HTTP API وضع المصادقة العادي الخاص بـ Gateway (رمز/كلمة مرور) بغض النظر عن ذلك. لطلب بيانات اعتماد shared-secret صريحة عبر Serve، عيّن `gateway.auth.allowTailscale: false` واستخدم `gateway.auth.mode: "token"` أو `"password"`.

    **الخيار ج: ربط Tailnet (بدون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    ثم افتح `http://<tailscale-ip>:18789` (يتطلب رمزًا).

  </Step>
</Steps>

## الاستمرارية والنسخ الاحتياطية

توجد حالة OpenClaw ضمن:

- `~/.openclaw/` — `openclaw.json`، و`auth-profiles.json` لكل وكيل، وحالة القنوات/المزوّدين، وبيانات الجلسات.
- `~/.openclaw/workspace/` — مساحة عمل الوكيل (SOUL.md، والذاكرة، والآثار).

تبقى هذه البيانات بعد إعادة تشغيل Droplet. لأخذ لقطة محمولة:

```bash
openclaw backup create
```

تنسخ لقطات DigitalOcean كامل Droplet احتياطيًا؛ أما `openclaw backup create` فهو قابل للنقل بين المضيفين.

## نصائح RAM بسعة 1 GB

يمتلك Droplet بسعر 6 دولارات RAM بسعة 1 GB فقط. للحفاظ على سلاسة التشغيل:

- تأكد من أن خطوة swap أعلاه موجودة في `/etc/fstab` حتى تبقى بعد إعادة التشغيل.
- فضّل النماذج المعتمدة على API ‏(Claude، GPT) على النماذج المحلية — استدلال LLM المحلي لا يناسب 1 GB.
- عيّن `agents.defaults.model.primary` إلى نموذج أصغر إذا واجهت أخطاء OOM مع المطالبات الكبيرة.
- راقب باستخدام `free -h` و`htop`.

## استكشاف الأخطاء وإصلاحها

**Gateway لا يبدأ** -- شغّل `openclaw doctor --non-interactive` وتحقق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service -n 50`.

**المنفذ مستخدم بالفعل** -- شغّل `lsof -i :18789` للعثور على العملية، ثم أوقفها.

**نفاد الذاكرة** -- تحقق من أن swap نشط باستخدام `free -h`. إذا استمرت أخطاء OOM، فاستخدم النماذج المعتمدة على API ‏(Claude، GPT) بدلًا من النماذج المحلية، أو رقّ إلى Droplet بسعة 2 GB.

## الخطوات التالية

- [القنوات](/ar/channels) -- وصّل Telegram وWhatsApp وDiscord والمزيد
- [إعدادات Gateway](/ar/gateway/configuration) -- جميع خيارات الإعداد
- [التحديث](/ar/install/updating) -- حافظ على OpenClaw محدثًا

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
- [استضافة VPS](/ar/vps)
