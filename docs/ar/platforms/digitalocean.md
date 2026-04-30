---
read_when:
    - إعداد OpenClaw على DigitalOcean
    - البحث عن استضافة VPS رخيصة لـ OpenClaw
summary: OpenClaw على DigitalOcean (خيار VPS مدفوع بسيط)
title: DigitalOcean (منصة)
x-i18n:
    generated_at: "2026-04-30T08:10:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw على DigitalOcean

## الهدف

تشغيل OpenClaw Gateway دائم على DigitalOcean مقابل **6 دولارات/شهر** (أو 4 دولارات/شهر مع التسعير المحجوز).

إذا كنت تريد خيارًا بتكلفة 0 دولار/شهر ولا تمانع ARM + إعدادًا خاصًا بمزوّد الخدمة، فراجع [دليل Oracle Cloud](/ar/install/oracle).

## مقارنة التكلفة (2026)

| المزوّد      | الخطة           | المواصفات              | السعر/الشهر | ملاحظات                                      |
| ------------ | --------------- | ---------------------- | ----------- | -------------------------------------------- |
| Oracle Cloud | Always Free ARM | حتى 4 OCPU، وذاكرة RAM بسعة 24GB | $0          | ARM، سعة محدودة / تعقيدات في التسجيل |
| Hetzner      | CX22            | 2 vCPU، وذاكرة RAM بسعة 4GB | €3.79 (~$4) | أرخص خيار مدفوع                              |
| DigitalOcean | Basic           | 1 vCPU، وذاكرة RAM بسعة 1GB | $6          | واجهة سهلة، ووثائق جيدة                     |
| Vultr        | Cloud Compute   | 1 vCPU، وذاكرة RAM بسعة 1GB | $6          | مواقع كثيرة                                  |
| Linode       | Nanode          | 1 vCPU، وذاكرة RAM بسعة 1GB | $5          | أصبح الآن جزءًا من Akamai                   |

**اختيار مزوّد:**

- DigitalOcean: أبسط تجربة مستخدم + إعداد متوقع (هذا الدليل)
- Hetzner: سعر/أداء جيدان (راجع [دليل Hetzner](/ar/install/hetzner))
- Oracle Cloud: يمكن أن تكون تكلفته 0 دولار/شهر، لكنه أكثر صعوبة ويعمل على ARM فقط (راجع [دليل Oracle](/ar/install/oracle))

---

## المتطلبات المسبقة

- حساب DigitalOcean ([سجّل مع رصيد مجاني بقيمة 200 دولار](https://m.do.co/c/signup))
- زوج مفاتيح SSH (أو الاستعداد لاستخدام المصادقة بكلمة مرور)
- نحو 20 دقيقة

## 1) إنشاء Droplet

<Warning>
استخدم صورة أساسية نظيفة (Ubuntu 24.04 LTS). تجنب صور Marketplace التابعة لجهات خارجية بنقرة واحدة ما لم تكن قد راجعت سكربتات بدء التشغيل وإعدادات جدار الحماية الافتراضية الخاصة بها.
</Warning>

1. سجّل الدخول إلى [DigitalOcean](https://cloud.digitalocean.com/)
2. انقر على **Create → Droplets**
3. اختر:
   - **المنطقة:** الأقرب إليك (أو إلى مستخدميك)
   - **الصورة:** Ubuntu 24.04 LTS
   - **الحجم:** Basic → Regular → **$6/mo** (1 vCPU، وذاكرة RAM بسعة 1GB، وSSD بسعة 25GB)
   - **المصادقة:** مفتاح SSH (موصى به) أو كلمة مرور
4. انقر على **Create Droplet**
5. دوّن عنوان IP

## 2) الاتصال عبر SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) تثبيت OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) تشغيل الإعداد الأولي

```bash
openclaw onboard --install-daemon
```

سيرشدك المعالج خلال:

- مصادقة النموذج (مفاتيح API أو OAuth)
- إعداد القناة (Telegram وWhatsApp وDiscord وغيرها)
- رمز Gateway المميز (يُنشأ تلقائيًا)
- تثبيت Daemon (systemd)

## 5) التحقق من Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) الوصول إلى لوحة المعلومات

يرتبط Gateway بـ loopback افتراضيًا. للوصول إلى واجهة التحكم:

**الخيار أ: نفق SSH (موصى به)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**الخيار ب: Tailscale Serve (HTTPS، loopback فقط)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

افتح: `https://<magicdns>/`

ملاحظات:

- يبقي Serve الـ Gateway على loopback فقط ويصادق حركة مرور واجهة التحكم/WebSocket عبر ترويسات هوية Tailscale (تفترض المصادقة بلا رمز مميز أن مضيف gateway موثوق؛ لا تستخدم واجهات HTTP APIs ترويسات Tailscale هذه، وبدلًا من ذلك تتبع وضع مصادقة HTTP العادي الخاص بالـ gateway).
- لفرض بيانات اعتماد صريحة بسر مشترك بدلًا من ذلك، عيّن `gateway.auth.allowTailscale: false` واستخدم `gateway.auth.mode: "token"` أو `"password"`.

**الخيار ج: الربط بـ Tailnet (دون Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

افتح: `http://<tailscale-ip>:18789` (الرمز المميز مطلوب).

## 7) توصيل قنواتك

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

راجع [القنوات](/ar/channels) للاطلاع على مزوّدين آخرين.

---

## تحسينات لذاكرة RAM بسعة 1GB

يحتوي Droplet بقيمة 6 دولارات على ذاكرة RAM بسعة 1GB فقط. للحفاظ على سلاسة التشغيل:

### إضافة swap (موصى به)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### استخدام نموذج أخف

إذا كنت تواجه حالات OOM، ففكّر في:

- استخدام نماذج قائمة على API (Claude وGPT) بدلًا من النماذج المحلية
- تعيين `agents.defaults.model.primary` إلى نموذج أصغر

### مراقبة الذاكرة

```bash
free -h
htop
```

---

## الاستمرارية

توجد كل الحالة في:

- `~/.openclaw/` — `openclaw.json`، و`auth-profiles.json` لكل وكيل، وحالة القنوات/المزوّدين، وبيانات الجلسات
- `~/.openclaw/workspace/` — مساحة العمل (SOUL.md، الذاكرة، وغيرها)

تستمر هذه البيانات بعد إعادة التشغيل. انسخها احتياطيًا دوريًا:

```bash
openclaw backup create
```

---

## البديل المجاني من Oracle Cloud

تقدّم Oracle Cloud مثيلات ARM من نوع **Always Free** أقوى بكثير من أي خيار مدفوع هنا — مقابل 0 دولار/شهر.

| ما تحصل عليه      | المواصفات              |
| ----------------- | ---------------------- |
| **4 OCPUs**       | ARM Ampere A1          |
| **ذاكرة RAM بسعة 24GB** | أكثر من كافية          |
| **تخزين بسعة 200GB** | وحدة تخزين كتلية       |
| **مجاني إلى الأبد** | لا رسوم على بطاقة الائتمان |

**تنبيهات:**

- قد يكون التسجيل صعبًا (أعد المحاولة إذا فشل)
- بنية ARM — تعمل معظم الأشياء، لكن بعض الثنائيات تحتاج إلى إصدارات ARM

للاطلاع على دليل الإعداد الكامل، راجع [Oracle Cloud](/ar/install/oracle). وللحصول على نصائح التسجيل واستكشاف مشكلات عملية الانضمام وإصلاحها، راجع هذا [الدليل المجتمعي](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## استكشاف الأخطاء وإصلاحها

### لن يبدأ Gateway

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### المنفذ مستخدم بالفعل

```bash
lsof -i :18789
kill <PID>
```

### نفاد الذاكرة

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## ذو صلة

- [دليل Hetzner](/ar/install/hetzner) — أرخص وأكثر قوة
- [تثبيت Docker](/ar/install/docker) — إعداد ضمن حاوية
- [Tailscale](/ar/gateway/tailscale) — وصول آمن عن بُعد
- [الإعدادات](/ar/gateway/configuration) — مرجع الإعدادات الكامل
