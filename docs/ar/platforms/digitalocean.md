---
read_when:
    - إعداد OpenClaw على DigitalOcean
    - تبحث عن استضافة VPS رخيصة لـ OpenClaw
summary: OpenClaw على DigitalOcean (خيار VPS مدفوع وبسيط)
title: DigitalOcean (المنصة)
x-i18n:
    generated_at: "2026-04-24T07:51:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw على DigitalOcean

## الهدف

تشغيل Gateway دائم لـ OpenClaw على DigitalOcean مقابل **6 دولارات شهريًا** (أو 4 دولارات شهريًا مع التسعير المحجوز).

إذا كنت تريد خيارًا بقيمة 0 دولار شهريًا ولا تمانع ARM + إعدادًا خاصًا بالمزوّد، فراجع [دليل Oracle Cloud](/ar/install/oracle).

## مقارنة التكلفة (2026)

| المزوّد       | الخطة            | المواصفات               | السعر/شهريًا   | ملاحظات                                   |
| ------------- | ---------------- | ----------------------- | -------------- | ----------------------------------------- |
| Oracle Cloud  | Always Free ARM  | حتى 4 OCPU و24GB RAM    | $0             | ARM، وسعة محدودة / تعقيدات في التسجيل     |
| Hetzner       | CX22             | 2 vCPU و4GB RAM         | €3.79 (~$4)    | أرخص خيار مدفوع                           |
| DigitalOcean  | Basic            | 1 vCPU و1GB RAM         | $6             | واجهة سهلة ووثائق جيدة                    |
| Vultr         | Cloud Compute    | 1 vCPU و1GB RAM         | $6             | مواقع كثيرة                               |
| Linode        | Nanode           | 1 vCPU و1GB RAM         | $5             | أصبحت الآن جزءًا من Akamai                |

**اختيار المزوّد:**

- DigitalOcean: أبسط تجربة استخدام + إعداد متوقع (هذا الدليل)
- Hetzner: سعر/أداء جيدان (راجع [دليل Hetzner](/ar/install/hetzner))
- Oracle Cloud: قد يكون 0 دولار شهريًا، لكنه أكثر حساسية ويدعم ARM فقط (راجع [دليل Oracle](/ar/install/oracle))

---

## المتطلبات المسبقة

- حساب DigitalOcean ‏([التسجيل مع رصيد مجاني بقيمة 200 دولار](https://m.do.co/c/signup))
- زوج مفاتيح SSH (أو الاستعداد لاستخدام المصادقة بكلمة مرور)
- نحو 20 دقيقة

## 1) أنشئ Droplet

<Warning>
استخدم صورة أساسية نظيفة (Ubuntu 24.04 LTS). تجنب صور Marketplace الجاهزة بنقرة واحدة من جهات خارجية ما لم تكن قد راجعت سكربتات بدء التشغيل والإعدادات الافتراضية للجدار الناري الخاصة بها.
</Warning>

1. سجّل الدخول إلى [DigitalOcean](https://cloud.digitalocean.com/)
2. انقر **Create → Droplets**
3. اختر:
   - **المنطقة:** الأقرب إليك (أو إلى مستخدميك)
   - **الصورة:** Ubuntu 24.04 LTS
   - **الحجم:** Basic → Regular → **$6/mo** ‏(1 vCPU، و1GB RAM، و25GB SSD)
   - **المصادقة:** مفتاح SSH ‏(موصى به) أو كلمة مرور
4. انقر **Create Droplet**
5. دوّن عنوان IP

## 2) اتصل عبر SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) ثبّت OpenClaw

```bash
# تحديث النظام
apt update && apt upgrade -y

# تثبيت Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# تثبيت OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# التحقق
openclaw --version
```

## 4) شغّل الإعداد الأولي

```bash
openclaw onboard --install-daemon
```

سيرشدك المعالج خلال:

- مصادقة النموذج (مفاتيح API أو OAuth)
- إعداد القنوات (Telegram، وWhatsApp، وDiscord، وغير ذلك)
- رمز Gateway المميز (يُولَّد تلقائيًا)
- تثبيت daemon ‏(systemd)

## 5) تحقّق من Gateway

```bash
# التحقق من الحالة
openclaw status

# التحقق من الخدمة
systemctl --user status openclaw-gateway.service

# عرض السجلات
journalctl --user -u openclaw-gateway.service -f
```

## 6) الوصول إلى Dashboard

يرتبط Gateway بـ loopback افتراضيًا. للوصول إلى Control UI:

**الخيار A: نفق SSH ‏(موصى به)**

```bash
# من جهازك المحلي
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# ثم افتح: http://localhost:18789
```

**الخيار B: Tailscale Serve ‏(HTTPS، وعلى loopback فقط)**

```bash
# على Droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# تكوين Gateway لاستخدام Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

افتح: `https://<magicdns>/`

ملاحظات:

- يُبقي Serve الـ Gateway على loopback فقط ويصادق على حركة Control UI/WebSocket عبر ترويسات هوية Tailscale (وتفترض المصادقة من دون رمز مميز مضيف Gateway موثوقًا؛ أما HTTP APIs فلا تستخدم ترويسات Tailscale تلك وتتبع بدلًا من ذلك وضع مصادقة HTTP العادي الخاص بـ Gateway).
- لفرض بيانات اعتماد صريحة بسر مشترك بدلًا من ذلك، اضبط `gateway.auth.allowTailscale: false` واستخدم `gateway.auth.mode: "token"` أو `"password"`.

**الخيار C: ربط Tailnet ‏(من دون Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

افتح: `http://<tailscale-ip>:18789` ‏(الرمز المميز مطلوب).

## 7) صِل قنواتك

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# امسح رمز QR
```

راجع [القنوات](/ar/channels) للمزوّدين الآخرين.

---

## تحسينات لـ 1GB RAM

يحتوي Droplet بسعر 6 دولارات على 1GB RAM فقط. ولإبقاء الأمور تعمل بسلاسة:

### أضف swap ‏(موصى به)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### استخدم نموذجًا أخف

إذا كنت تصطدم بأخطاء OOM، ففكّر في:

- استخدام نماذج قائمة على API ‏(Claude، وGPT) بدلًا من النماذج المحلية
- ضبط `agents.defaults.model.primary` على نموذج أصغر

### راقب الذاكرة

```bash
free -h
htop
```

---

## الاستمرارية

توجد كل الحالة في:

- `~/.openclaw/` — ‏`openclaw.json`، و`auth-profiles.json` لكل وكيل، وحالة القناة/المزوّد، وبيانات الجلسات
- `~/.openclaw/workspace/` — مساحة العمل (`SOUL.md`، والذاكرة، وما إلى ذلك)

تستمر هذه البيانات بعد إعادة التشغيل. انسخها احتياطيًا دوريًا:

```bash
openclaw backup create
```

---

## بديل Oracle Cloud المجاني

يوفر Oracle Cloud مثيلات ARM **مجانية دائمة** أقوى بكثير من أي خيار مدفوع هنا — مقابل 0 دولار شهريًا.

| ما الذي تحصل عليه | المواصفات              |
| ----------------- | ---------------------- |
| **4 OCPUs**       | ARM Ampere A1          |
| **24GB RAM**      | أكثر من كافٍ           |
| **200GB storage** | Block volume           |
| **مجاني للأبد**   | لا توجد رسوم بطاقة ائتمان |

**المحاذير:**

- قد يكون التسجيل حساسًا (أعد المحاولة إذا فشل)
- بنية ARM — معظم الأشياء تعمل، لكن بعض الملفات الثنائية تحتاج إلى إصدارات ARM

للحصول على دليل الإعداد الكامل، راجع [Oracle Cloud](/ar/install/oracle). وللحصول على نصائح التسجيل واستكشاف مشكلات عملية الانضمام، راجع هذا [الدليل المجتمعي](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## استكشاف الأخطاء وإصلاحها

### Gateway لا يبدأ

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
# التحقق من الذاكرة
free -h

# أضف المزيد من swap
# أو قم بالترقية إلى Droplet بسعر $12/mo (2GB RAM)
```

---

## ذو صلة

- [دليل Hetzner](/ar/install/hetzner) — أرخص وأقوى
- [تثبيت Docker](/ar/install/docker) — إعداد معتمد على الحاويات
- [Tailscale](/ar/gateway/tailscale) — وصول بعيد آمن
- [التكوين](/ar/gateway/configuration) — مرجع التكوين الكامل
