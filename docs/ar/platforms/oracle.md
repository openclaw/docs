---
read_when:
    - إعداد OpenClaw على Oracle Cloud
    - تبحث عن استضافة VPS منخفضة التكلفة لـ OpenClaw
    - تريد OpenClaw يعمل على مدار الساعة طوال أيام الأسبوع على خادم صغير
summary: OpenClaw على Oracle Cloud ‏(ARM مجاني دائمًا)
title: Oracle Cloud (المنصة)
x-i18n:
    generated_at: "2026-04-24T07:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw على Oracle Cloud ‏(OCI)

## الهدف

تشغيل Gateway دائم لـ OpenClaw على طبقة ARM **المجانية الدائمة** من Oracle Cloud.

قد تكون الطبقة المجانية من Oracle مناسبة جدًا لـ OpenClaw (خصوصًا إذا كان لديك بالفعل حساب OCI)، لكنها تأتي مع بعض التنازلات:

- بنية ARM ‏(معظم الأشياء تعمل، لكن بعض الملفات الثنائية قد تكون x86 فقط)
- قد تكون السعة وعملية التسجيل حسّاستين

## مقارنة التكلفة (2026)

| المزوّد       | الخطة            | المواصفات               | السعر/شهريًا | ملاحظات                |
| ------------- | ---------------- | ----------------------- | ------------ | ---------------------- |
| Oracle Cloud  | Always Free ARM  | حتى 4 OCPU و24GB RAM    | $0           | ARM، وسعة محدودة       |
| Hetzner       | CX22             | 2 vCPU و4GB RAM         | ~ $4         | أرخص خيار مدفوع        |
| DigitalOcean  | Basic            | 1 vCPU و1GB RAM         | $6           | واجهة سهلة ووثائق جيدة |
| Vultr         | Cloud Compute    | 1 vCPU و1GB RAM         | $6           | مواقع كثيرة            |
| Linode        | Nanode           | 1 vCPU و1GB RAM         | $5           | أصبحت الآن جزءًا من Akamai |

---

## المتطلبات المسبقة

- حساب Oracle Cloud ‏([التسجيل](https://www.oracle.com/cloud/free/)) — راجع [دليل التسجيل المجتمعي](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) إذا واجهت مشكلات
- حساب Tailscale ‏(مجاني على [tailscale.com](https://tailscale.com))
- نحو 30 دقيقة

## 1) أنشئ مثيل OCI

1. سجّل الدخول إلى [Oracle Cloud Console](https://cloud.oracle.com/)
2. انتقل إلى **Compute → Instances → Create Instance**
3. قم بالتكوين:
   - **الاسم:** `openclaw`
   - **الصورة:** Ubuntu 24.04 ‏(aarch64)
   - **الشكل:** `VM.Standard.A1.Flex` ‏(Ampere ARM)
   - **OCPUs:** 2 (أو حتى 4)
   - **الذاكرة:** 12 GB (أو حتى 24 GB)
   - **وحدة إقلاع التخزين:** 50 GB (حتى 200 GB مجانًا)
   - **مفتاح SSH:** أضف مفتاحك العام
4. انقر **Create**
5. دوّن عنوان IP العام

**نصيحة:** إذا فشل إنشاء المثيل برسالة "Out of capacity"، فجرّب نطاق توفر مختلفًا أو أعد المحاولة لاحقًا. سعة الطبقة المجانية محدودة.

## 2) اتصل وحدّث

```bash
# الاتصال عبر عنوان IP العام
ssh ubuntu@YOUR_PUBLIC_IP

# تحديث النظام
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**ملاحظة:** يلزم `build-essential` لتجميع بعض التبعيات على ARM.

## 3) كوّن المستخدم واسم المضيف

```bash
# ضبط اسم المضيف
sudo hostnamectl set-hostname openclaw

# ضبط كلمة مرور مستخدم ubuntu
sudo passwd ubuntu

# تفعيل lingering (يُبقي خدمات المستخدم قيد التشغيل بعد تسجيل الخروج)
sudo loginctl enable-linger ubuntu
```

## 4) ثبّت Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

يؤدي ذلك إلى تفعيل Tailscale SSH، بحيث يمكنك الاتصال عبر `ssh openclaw` من أي جهاز على tailnet الخاص بك — من دون الحاجة إلى عنوان IP عام.

تحقّق:

```bash
tailscale status
```

**من الآن فصاعدًا، اتصل عبر Tailscale:** ‏`ssh ubuntu@openclaw` ‏(أو استخدم عنوان Tailscale IP).

## 5) ثبّت OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

عندما يُطلب منك "How do you want to hatch your bot?"، اختر **"Do this later"**.

> ملاحظة: إذا واجهت مشكلات في البناء الأصلي على ARM، فابدأ بالحزم النظامية (مثل `sudo apt install -y build-essential`) قبل اللجوء إلى Homebrew.

## 6) كوّن Gateway ‏(loopback + مصادقة الرمز المميز) وفعّل Tailscale Serve

استخدم مصادقة الرمز المميز كخيار افتراضي. فهي متوقعة وتتجنب الحاجة إلى أي أعلام "insecure auth" خاصة بـ Control UI.

```bash
# أبقِ Gateway خاصًا على الجهاز الافتراضي
openclaw config set gateway.bind loopback

# اطلب المصادقة لـ Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# اكشفه عبر Tailscale Serve ‏(HTTPS + وصول tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

إن `gateway.trustedProxies=["127.0.0.1"]` هنا مخصص فقط للتعامل مع IP المُمرَّر/العميل المحلي من وكيل Tailscale Serve المحلي. وهو **ليس** `gateway.auth.mode: "trusted-proxy"`. وتبقى مسارات عارض الفروقات في هذا الإعداد ذات سلوك فشل مغلق: يمكن أن تعيد طلبات العارض الخام `127.0.0.1` من دون ترويسات الوكيل المُمرَّر الرسالة `Diff not found`. استخدم `mode=file` / `mode=both` للمرفقات، أو فعّل العارضات البعيدة عمدًا واضبط `plugins.entries.diffs.config.viewerBaseUrl` (أو مرّر `baseUrl` للوكيل) إذا كنت تحتاج إلى روابط عارض قابلة للمشاركة.

## 7) تحقّق

```bash
# التحقق من الإصدار
openclaw --version

# التحقق من حالة daemon
systemctl --user status openclaw-gateway.service

# التحقق من Tailscale Serve
tailscale serve status

# اختبار الاستجابة المحلية
curl http://localhost:18789
```

## 8) أحكم تأمين VCN

بعد أن يصبح كل شيء يعمل، أحكم تأمين VCN لحظر كل حركة المرور باستثناء Tailscale. تعمل شبكة OCI Virtual Cloud Network كجدار ناري عند حافة الشبكة — حيث يتم حظر الحركة قبل أن تصل إلى المثيل.

1. انتقل إلى **Networking → Virtual Cloud Networks** في OCI Console
2. انقر VCN الخاصة بك → **Security Lists** → Default Security List
3. **أزل** كل قواعد الدخول باستثناء:
   - `0.0.0.0/0 UDP 41641` ‏(Tailscale)
4. أبقِ قواعد الخروج الافتراضية (السماح بكل الخروج)

يؤدي هذا إلى حظر SSH على المنفذ 22، وHTTP، وHTTPS، وكل شيء آخر عند حافة الشبكة. ومن الآن فصاعدًا، لن يمكنك الاتصال إلا عبر Tailscale.

---

## الوصول إلى Control UI

من أي جهاز على شبكة Tailscale الخاصة بك:

```
https://openclaw.<tailnet-name>.ts.net/
```

استبدل `<tailnet-name>` باسم tailnet الخاص بك (الظاهر في `tailscale status`).

لا حاجة إلى نفق SSH. يوفر Tailscale:

- تشفير HTTPS ‏(شهادات تلقائية)
- مصادقة عبر هوية Tailscale
- وصولًا من أي جهاز على tailnet الخاص بك (حاسوب محمول، هاتف، وما إلى ذلك)

---

## الأمان: VCN + Tailscale ‏(خط أساس موصى به)

مع إحكام تأمين VCN ‏(فتح UDP 41641 فقط) وربط Gateway على loopback، تحصل على دفاع قوي متعدد الطبقات: يتم حظر الحركة العامة عند حافة الشبكة، ويحدث وصول الإدارة عبر tailnet الخاص بك.

غالبًا ما يزيل هذا الإعداد _الحاجة_ إلى قواعد جدار ناري إضافية على المضيف فقط لإيقاف هجمات القوة الغاشمة على SSH على مستوى الإنترنت — لكن ينبغي لك مع ذلك إبقاء نظام التشغيل محدّثًا، وتشغيل `openclaw security audit`، والتحقق من أنك لا تستمع بالخطأ على واجهات عامة.

### محمي بالفعل

| الخطوة التقليدية     | هل هي مطلوبة؟ | السبب                                                                    |
| -------------------- | ------------- | ------------------------------------------------------------------------ |
| جدار ناري UFW        | لا            | تحظر VCN الحركة قبل أن تصل إلى المثيل                                    |
| fail2ban             | لا            | لا توجد قوة غاشمة إذا كان المنفذ 22 محظورًا على مستوى VCN               |
| تقوية sshd           | لا            | لا يستخدم Tailscale SSH خادم sshd                                        |
| تعطيل تسجيل دخول root | لا          | يستخدم Tailscale هوية Tailscale، وليس مستخدمي النظام                   |
| مصادقة SSH بالمفاتيح فقط | لا       | يصادق Tailscale عبر tailnet الخاص بك                                    |
| تقوية IPv6           | غالبًا لا     | يعتمد على إعدادات VCN/subnet لديك؛ تحقق مما تم تخصيصه/كشفه فعليًا      |

### ما يزال موصى به

- **أذونات بيانات الاعتماد:** `chmod 700 ~/.openclaw`
- **التدقيق الأمني:** `openclaw security audit`
- **تحديثات النظام:** `sudo apt update && sudo apt upgrade` بانتظام
- **مراقبة Tailscale:** راجع الأجهزة في [لوحة إدارة Tailscale](https://login.tailscale.com/admin)

### التحقق من الوضعية الأمنية

```bash
# تأكيد عدم وجود منافذ عامة مستمعة
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# التحقق من أن Tailscale SSH نشط
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# اختياري: تعطيل sshd بالكامل
sudo systemctl disable --now ssh
```

---

## احتياط: نفق SSH

إذا لم يكن Tailscale Serve يعمل، فاستخدم نفق SSH:

```bash
# من جهازك المحلي (عبر Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

ثم افتح `http://localhost:18789`.

---

## استكشاف الأخطاء وإصلاحها

### يفشل إنشاء المثيل ("Out of capacity")

تحظى مثيلات ARM المجانية بشعبية. جرّب:

- نطاق توفر مختلف
- إعادة المحاولة خلال ساعات انخفاض الضغط (في الصباح الباكر)
- استخدام مرشح "Always Free" عند اختيار الشكل

### لا يتصل Tailscale

```bash
# التحقق من الحالة
sudo tailscale status

# إعادة المصادقة
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway لا يبدأ

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### تعذّر الوصول إلى Control UI

```bash
# التحقق من أن Tailscale Serve يعمل
tailscale serve status

# التحقق من أن Gateway يستمع
curl http://localhost:18789

# أعد التشغيل إذا لزم الأمر
systemctl --user restart openclaw-gateway.service
```

### مشكلات الملفات الثنائية على ARM

قد لا تحتوي بعض الأدوات على بنيات ARM. تحقّق:

```bash
uname -m  # يجب أن يعرض aarch64
```

تعمل معظم حزم npm بشكل جيد. أما بالنسبة إلى الملفات الثنائية، فابحث عن إصدارات `linux-arm64` أو `aarch64`.

---

## الاستمرارية

توجد كل الحالة في:

- `~/.openclaw/` — ‏`openclaw.json`، و`auth-profiles.json` لكل وكيل، وحالة القناة/المزوّد، وبيانات الجلسات
- `~/.openclaw/workspace/` — مساحة العمل (`SOUL.md`، والذاكرة، والنتائج)

انسخها احتياطيًا دوريًا:

```bash
openclaw backup create
```

---

## ذو صلة

- [الوصول البعيد إلى Gateway](/ar/gateway/remote) — أنماط وصول بعيدة أخرى
- [تكامل Tailscale](/ar/gateway/tailscale) — وثائق Tailscale الكاملة
- [تكوين Gateway](/ar/gateway/configuration) — جميع خيارات التكوين
- [دليل DigitalOcean](/ar/install/digitalocean) — إذا كنت تريد خيارًا مدفوعًا مع تسجيل أسهل
- [دليل Hetzner](/ar/install/hetzner) — بديل قائم على Docker
