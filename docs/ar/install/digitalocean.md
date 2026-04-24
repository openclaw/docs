---
read_when:
    - إعداد OpenClaw على DigitalOcean
    - تبحث عن VPS مدفوع وبسيط لـ OpenClaw
summary: استضافة OpenClaw على Droplet من DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T07:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

شغّل Gateway دائمًا لـ OpenClaw على Droplet من DigitalOcean.

## المتطلبات المسبقة

- حساب DigitalOcean ([التسجيل](https://cloud.digitalocean.com/registrations/new))
- زوج مفاتيح SSH (أو الاستعداد لاستخدام المصادقة بكلمة مرور)
- نحو 20 دقيقة

## الإعداد

<Steps>
  <Step title="أنشئ Droplet">
    <Warning>
    استخدم صورة أساسية نظيفة (Ubuntu 24.04 LTS). تجنب صور Marketplace الجاهزة بنقرة واحدة من جهات خارجية ما لم تكن قد راجعت سكربتات بدء التشغيل والإعدادات الافتراضية للجدار الناري الخاصة بها.
    </Warning>

    1. سجّل الدخول إلى [DigitalOcean](https://cloud.digitalocean.com/).
    2. انقر **Create > Droplets**.
    3. اختر:
       - **المنطقة:** الأقرب إليك
       - **الصورة:** Ubuntu 24.04 LTS
       - **الحجم:** Basic، Regular، و1 vCPU / 1 GB RAM / 25 GB SSD
       - **المصادقة:** مفتاح SSH (موصى به) أو كلمة مرور
    4. انقر **Create Droplet** وسجّل عنوان IP.

  </Step>

  <Step title="اتصل وثبّت">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # تثبيت Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # تثبيت OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --install-daemon
    ```

    يرشدك المعالج خلال مصادقة النموذج، وإعداد القنوات، وتوليد رمز Gateway المميز، وتثبيت daemon ‏(systemd).

  </Step>

  <Step title="أضف swap (موصى به لـ Droplets بسعة 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="تحقق من Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="الوصول إلى Control UI">
    يرتبط Gateway بـ loopback افتراضيًا. اختر أحد هذه الخيارات.

    **الخيار A: نفق SSH (الأبسط)**

    ```bash
    # من جهازك المحلي
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    ثم افتح `http://localhost:18789`.

    **الخيار B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    ثم افتح `https://<magicdns>/` من أي جهاز على tailnet الخاص بك.

    **الخيار C: ربط Tailnet (من دون Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    ثم افتح `http://<tailscale-ip>:18789` (الرمز المميز مطلوب).

  </Step>
</Steps>

## استكشاف الأخطاء وإصلاحها

**لا يبدأ Gateway** -- شغّل `openclaw doctor --non-interactive` وتحقق من السجلات باستخدام `journalctl --user -u openclaw-gateway.service -n 50`.

**المنفذ مستخدم بالفعل** -- شغّل `lsof -i :18789` للعثور على العملية، ثم أوقفها.

**نفاد الذاكرة** -- تحقق من أن swap نشطة باستخدام `free -h`. وإذا كنت لا تزال تصطدم بـ OOM، فاستخدم نماذج معتمدة على API (Claude وGPT) بدلًا من النماذج المحلية، أو قم بالترقية إلى Droplet بسعة 2 GB.

## الخطوات التالية

- [القنوات](/ar/channels) -- صِل Telegram وWhatsApp وDiscord وغير ذلك
- [تكوين Gateway](/ar/gateway/configuration) -- جميع خيارات التكوين
- [التحديث](/ar/install/updating) -- حافظ على OpenClaw محدثًا

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
- [استضافة VPS](/ar/vps)
