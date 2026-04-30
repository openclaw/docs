---
read_when:
    - إعداد OpenClaw على Oracle Cloud
    - البحث عن استضافة VPS منخفضة التكلفة لـ OpenClaw
    - هل تريد تشغيل OpenClaw على خادم صغير على مدار الساعة طوال أيام الأسبوع؟
summary: OpenClaw على Oracle Cloud (ARM المجاني دائمًا)
title: Oracle Cloud (منصة)
x-i18n:
    generated_at: "2026-04-30T08:12:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw على Oracle Cloud (OCI)

## الهدف

تشغيل OpenClaw Gateway دائم على طبقة ARM **Always Free** في Oracle Cloud.

يمكن أن تكون طبقة Oracle المجانية مناسبة جدًا لـ OpenClaw (خاصة إذا كان لديك حساب OCI بالفعل)، لكنها تأتي مع تنازلات:

- معمارية ARM (تعمل معظم الأشياء، لكن قد تكون بعض الثنائيات مخصّصة لـ x86 فقط)
- قد تكون السعة والتسجيل غير مستقرين

## مقارنة التكلفة (2026)

| المزوّد      | الخطة           | المواصفات              | السعر/الشهر | ملاحظات                  |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------ |
| Oracle Cloud | Always Free ARM | حتى 4 OCPU و24GB RAM   | $0          | ARM، سعة محدودة          |
| Hetzner      | CX22            | 2 vCPU و4GB RAM        | ~ $4        | أرخص خيار مدفوع          |
| DigitalOcean | Basic           | 1 vCPU و1GB RAM        | $6          | واجهة سهلة، ووثائق جيدة  |
| Vultr        | Cloud Compute   | 1 vCPU و1GB RAM        | $6          | مواقع كثيرة              |
| Linode       | Nanode          | 1 vCPU و1GB RAM        | $5          | أصبح الآن جزءًا من Akamai |

---

## المتطلبات المسبقة

- حساب Oracle Cloud ([التسجيل](https://www.oracle.com/cloud/free/)) — راجع [دليل التسجيل المجتمعي](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) إذا واجهت مشكلات
- حساب Tailscale (مجاني على [tailscale.com](https://tailscale.com))
- نحو 30 دقيقة

## 1) إنشاء مثيل OCI

1. سجّل الدخول إلى [Oracle Cloud Console](https://cloud.oracle.com/)
2. انتقل إلى **Compute → Instances → Create Instance**
3. اضبط الإعدادات:
   - **الاسم:** `openclaw`
   - **الصورة:** Ubuntu 24.04 (aarch64)
   - **الشكل:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (أو حتى 4)
   - **الذاكرة:** 12 GB (أو حتى 24 GB)
   - **وحدة تخزين الإقلاع:** 50 GB (حتى 200 GB مجانًا)
   - **مفتاح SSH:** أضف مفتاحك العام
4. انقر على **Create**
5. دوّن عنوان IP العام

**تلميح:** إذا فشل إنشاء المثيل مع رسالة "Out of capacity"، جرّب نطاق إتاحة مختلفًا أو أعد المحاولة لاحقًا. سعة الطبقة المجانية محدودة.

## 2) الاتصال والتحديث

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**ملاحظة:** `build-essential` مطلوب لتجميع ARM لبعض الاعتماديات.

## 3) ضبط المستخدم واسم المضيف

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) تثبيت Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

يؤدي هذا إلى تفعيل Tailscale SSH، بحيث يمكنك الاتصال عبر `ssh openclaw` من أي جهاز على tailnet لديك — من دون الحاجة إلى IP عام.

تحقق:

```bash
tailscale status
```

**من الآن فصاعدًا، اتصل عبر Tailscale:** `ssh ubuntu@openclaw` (أو استخدم IP الخاص بـ Tailscale).

## 5) تثبيت OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

عند ظهور المطالبة "How do you want to hatch your bot?"، اختر **"Do this later"**.

> ملاحظة: إذا واجهت مشكلات بناء أصلية على ARM، ابدأ بحزم النظام (مثل `sudo apt install -y build-essential`) قبل اللجوء إلى Homebrew.

## 6) ضبط Gateway (loopback + مصادقة الرمز) وتفعيل Tailscale Serve

استخدم مصادقة الرمز كخيار افتراضي. فهي قابلة للتنبؤ وتتجنب الحاجة إلى أي أعلام “مصادقة غير آمنة” في واجهة التحكم.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` هنا مخصّص فقط لمعالجة IP المُمرّر/العميل المحلي الخاصة ببروكسي Tailscale Serve المحلي. وهو **ليس** `gateway.auth.mode: "trusted-proxy"`. تحتفظ مسارات عارض الفروقات بسلوك الإغلاق الآمن عند الفشل في هذا الإعداد: يمكن أن تُرجع طلبات العارض الخام إلى `127.0.0.1` من دون ترويسات بروكسي مُمرّرة رسالة `Diff not found`. استخدم `mode=file` / `mode=both` للمرفقات، أو فعّل العارضين البعيدين عمدًا واضبط `plugins.entries.diffs.config.viewerBaseUrl` (أو مرّر `baseUrl` لبروكسي) إذا كنت تحتاج إلى روابط عارض قابلة للمشاركة.

## 7) التحقق

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) تأمين VCN

بعد أن أصبح كل شيء يعمل، أمّن VCN لحظر كل حركة المرور باستثناء Tailscale. تعمل Virtual Cloud Network في OCI كجدار حماية على حافة الشبكة — تُحظر حركة المرور قبل أن تصل إلى مثيلك.

1. انتقل إلى **Networking → Virtual Cloud Networks** في OCI Console
2. انقر على VCN لديك → **Security Lists** → Default Security List
3. **أزِل** كل قواعد الدخول باستثناء:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. أبقِ قواعد الخروج الافتراضية (السماح بكل الاتصالات الصادرة)

يحظر هذا SSH على المنفذ 22 وHTTP وHTTPS وكل شيء آخر على حافة الشبكة. من الآن فصاعدًا، لا يمكنك الاتصال إلا عبر Tailscale.

---

## الوصول إلى واجهة التحكم

من أي جهاز على شبكة Tailscale لديك:

```
https://openclaw.<tailnet-name>.ts.net/
```

استبدل `<tailnet-name>` باسم tailnet لديك (ظاهر في `tailscale status`).

لا حاجة إلى نفق SSH. يوفّر Tailscale:

- تشفير HTTPS (شهادات تلقائية)
- المصادقة عبر هوية Tailscale
- الوصول من أي جهاز على tailnet لديك (حاسوب محمول، هاتف، إلخ)

---

## الأمان: VCN + Tailscale (خط أساس موصى به)

مع تأمين VCN (فتح UDP 41641 فقط) وربط Gateway بـ loopback، تحصل على دفاع قوي متعدد الطبقات: تُحظر حركة المرور العامة على حافة الشبكة، ويحدث وصول الإدارة عبر tailnet لديك.

غالبًا ما يزيل هذا الإعداد _الحاجة_ إلى قواعد جدار حماية إضافية على المضيف لمجرد إيقاف هجمات SSH بالقوة الغاشمة على مستوى الإنترنت — لكن لا يزال عليك إبقاء نظام التشغيل محدّثًا، وتشغيل `openclaw security audit`، والتحقق من أنك لا تستمع بالخطأ على واجهات عامة.

### محمي بالفعل

| الخطوة التقليدية        | مطلوبة؟      | السبب                                                                      |
| ----------------------- | ------------ | -------------------------------------------------------------------------- |
| جدار حماية UFW          | لا           | يحظر VCN الحركة قبل أن تصل إلى المثيل                                      |
| fail2ban                | لا           | لا توجد قوة غاشمة إذا كان المنفذ 22 محظورًا عند VCN                       |
| تقوية sshd              | لا           | لا يستخدم Tailscale SSH خدمة sshd                                          |
| تعطيل تسجيل دخول الجذر  | لا           | يستخدم Tailscale هوية Tailscale، وليس مستخدمي النظام                      |
| مصادقة SSH بالمفتاح فقط | لا           | يصادق Tailscale عبر tailnet لديك                                           |
| تقوية IPv6              | عادةً لا     | يعتمد على إعدادات VCN/الشبكة الفرعية لديك؛ تحقق مما هو مخصص/مكشوف فعليًا |

### لا يزال موصى به

- **أذونات بيانات الاعتماد:** `chmod 700 ~/.openclaw`
- **تدقيق الأمان:** `openclaw security audit`
- **تحديثات النظام:** `sudo apt update && sudo apt upgrade` بانتظام
- **مراقبة Tailscale:** راجع الأجهزة في [وحدة تحكم إدارة Tailscale](https://login.tailscale.com/admin)

### التحقق من وضع الأمان

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## fallback: نفق SSH

إذا لم يكن Tailscale Serve يعمل، فاستخدم نفق SSH:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

ثم افتح `http://localhost:18789`.

---

## استكشاف الأخطاء وإصلاحها

### فشل إنشاء المثيل ("Out of capacity")

مثيلات ARM في الطبقة المجانية شائعة. جرّب:

- نطاق إتاحة مختلفًا
- إعادة المحاولة خارج ساعات الذروة (الصباح الباكر)
- استخدام مرشح "Always Free" عند اختيار الشكل

### لن يتصل Tailscale

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### لن يبدأ Gateway

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### تعذّر الوصول إلى واجهة التحكم

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### مشكلات ثنائيات ARM

قد لا تتوفر لبعض الأدوات إصدارات ARM. تحقق:

```bash
uname -m  # Should show aarch64
```

تعمل معظم حزم npm جيدًا. بالنسبة إلى الثنائيات، ابحث عن إصدارات `linux-arm64` أو `aarch64`.

---

## الاستمرارية

توجد كل الحالة في:

- `~/.openclaw/` — `openclaw.json` و`auth-profiles.json` لكل وكيل، وحالة القنوات/المزوّدين، وبيانات الجلسات
- `~/.openclaw/workspace/` — مساحة العمل (SOUL.md، الذاكرة، الآثار)

انسخ احتياطيًا بشكل دوري:

```bash
openclaw backup create
```

---

## ذات صلة

- [الوصول البعيد إلى Gateway](/ar/gateway/remote) — أنماط وصول بعيد أخرى
- [تكامل Tailscale](/ar/gateway/tailscale) — وثائق Tailscale الكاملة
- [ضبط Gateway](/ar/gateway/configuration) — كل خيارات الإعداد
- [دليل DigitalOcean](/ar/install/digitalocean) — إذا كنت تريد خيارًا مدفوعًا مع تسجيل أسهل
- [دليل Hetzner](/ar/install/hetzner) — بديل قائم على Docker
