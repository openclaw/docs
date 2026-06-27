---
read_when:
    - تريد تشغيل Gateway على خادم Linux أو VPS سحابي
    - تحتاج إلى خريطة سريعة لأدلة الاستضافة
    - تريد ضبط خادم Linux عام لـ OpenClaw
sidebarTitle: Linux Server
summary: شغّل OpenClaw على خادم Linux أو VPS سحابي — منتقي المزوّد، والبنية المعمارية، والضبط
title: خادم Linux
x-i18n:
    generated_at: "2026-06-27T18:48:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

شغّل OpenClaw Gateway على أي خادم Linux أو VPS سحابي. تساعدك هذه الصفحة على
اختيار مزوّد، وتشرح كيفية عمل عمليات النشر السحابية، وتغطي ضبط Linux العام
الذي ينطبق في كل مكان.

## اختر مزوّدًا

<CardGroup cols={2}>
  <Card title="Railway" href="/ar/install/railway">إعداد بنقرة واحدة عبر المتصفح</Card>
  <Card title="Northflank" href="/ar/install/northflank">إعداد بنقرة واحدة عبر المتصفح</Card>
  <Card title="DigitalOcean" href="/ar/install/digitalocean">VPS مدفوع بسيط</Card>
  <Card title="Oracle Cloud" href="/ar/install/oracle">طبقة ARM مجانية دائمًا</Card>
  <Card title="Fly.io" href="/ar/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ar/install/hetzner">Docker على Hetzner VPS</Card>
  <Card title="Hostinger" href="/ar/install/hostinger">VPS مع إعداد بنقرة واحدة</Card>
  <Card title="GCP" href="/ar/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ar/install/azure">آلة Linux افتراضية</Card>
  <Card title="exe.dev" href="/ar/install/exe-dev">آلة افتراضية مع وكيل HTTPS</Card>
  <Card title="Raspberry Pi" href="/ar/install/raspberry-pi">استضافة ذاتية على ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / الطبقة المجانية)** يعمل جيدًا أيضًا.
يتوفر شرح فيديو من المجتمع على
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(مورد مجتمعي -- قد يصبح غير متاح).

## كيفية عمل الإعدادات السحابية

- يعمل **Gateway على VPS** ويمتلك الحالة + مساحة العمل.
- تتصل من حاسوبك المحمول أو هاتفك عبر **واجهة التحكم** أو **Tailscale/SSH**.
- تعامل مع VPS كمصدر الحقيقة و**انسخ احتياطيًا** للحالة + مساحة العمل بانتظام.
- الإعداد الافتراضي الآمن: أبقِ Gateway على local loopback وادخل إليه عبر نفق SSH أو Tailscale Serve.
  إذا ربطته بـ `lan` أو `tailnet`، فاشترط `gateway.auth.token` أو `gateway.auth.password`.

الصفحات ذات الصلة: [الوصول البعيد إلى Gateway](/ar/gateway/remote)، [مركز المنصات](/ar/platforms).

## عزّز وصول الإدارة أولًا

قبل تثبيت OpenClaw على VPS عام، قرّر كيف تريد إدارة
الجهاز نفسه.

- إذا كنت تريد وصول إدارة عبر Tailnet فقط، فثبّت Tailscale أولًا، وانضمّ بـ VPS
  إلى شبكة tailnet الخاصة بك، وتحقق من جلسة SSH ثانية عبر عنوان IP الخاص بـ Tailscale أو
  اسم MagicDNS، ثم قيّد SSH العام.
- إذا لم تكن تستخدم Tailscale، فطبّق التعزيز المكافئ لمسار SSH
  قبل كشف المزيد من الخدمات.
- هذا منفصل عن الوصول إلى Gateway. لا يزال بإمكانك إبقاء OpenClaw مربوطًا بـ
  local loopback واستخدام نفق SSH أو Tailscale Serve للوحة التحكم.

توجد خيارات Gateway الخاصة بـ Tailscale في [Tailscale](/ar/gateway/tailscale).

## وكيل شركة مشترك على VPS

تشغيل وكيل واحد لفريق إعداد صالح عندما يكون كل مستخدم ضمن حدود الثقة نفسها ويكون الوكيل مخصصًا للأعمال فقط.

- أبقه على بيئة تشغيل مخصصة (VPS/VM/حاوية + مستخدم/حسابات نظام تشغيل مخصصة).
- لا تسجّل الدخول في تلك البيئة إلى حسابات Apple/Google الشخصية أو ملفات تعريف المتصفح/مدير كلمات المرور الشخصية.
- إذا كان المستخدمون خصومًا لبعضهم، فقسّم حسب Gateway/المضيف/مستخدم نظام التشغيل.

تفاصيل نموذج الأمان: [الأمان](/ar/gateway/security).

## استخدام العقد مع VPS

يمكنك إبقاء Gateway في السحابة وإقران **العقد** على أجهزتك المحلية
(Mac/iOS/Android/بلا واجهة). توفّر العقد إمكانات الشاشة/الكاميرا/canvas المحلية و`system.run`
بينما يبقى Gateway في السحابة.

المستندات: [العقد](/ar/nodes)، [CLI للعقد](/ar/cli/nodes).

## ضبط بدء التشغيل للآلات الافتراضية الصغيرة ومضيفي ARM

إذا بدت أوامر CLI بطيئة على الآلات الافتراضية منخفضة الطاقة (أو مضيفي ARM)، ففعّل ذاكرة التخزين المؤقت لتجميع وحدات Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- يحسّن `NODE_COMPILE_CACHE` أوقات بدء الأوامر المتكررة.
- يُبقي `OPENCLAW_NO_RESPAWN=1` عمليات إعادة تشغيل Gateway الروتينية داخل العملية، ما يتجنب عمليات التسليم الإضافية بين العمليات ويبقي تتبع PID بسيطًا على المضيفين الصغار.
- أول تشغيل للأمر يجهّز ذاكرة التخزين المؤقت؛ أما عمليات التشغيل اللاحقة فهي أسرع.
- لمعرفة تفاصيل Raspberry Pi، راجع [Raspberry Pi](/ar/install/raspberry-pi).

### قائمة تحقق لضبط systemd (اختياري)

بالنسبة إلى مضيفي VM الذين يستخدمون `systemd`، ضع في اعتبارك:

- أضف متغيرات بيئة للخدمة من أجل مسار بدء تشغيل مستقر:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- أبقِ سلوك إعادة التشغيل صريحًا:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- فضّل الأقراص المدعومة بـ SSD لمسارات الحالة/ذاكرة التخزين المؤقت لتقليل كلفة البدء البارد الناتجة عن الإدخال/الإخراج العشوائي.

بالنسبة إلى مسار `openclaw onboard --install-daemon` القياسي، حرّر وحدة المستخدم:

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

إذا كنت قد ثبّت وحدة نظام عمدًا بدلًا من ذلك، فحرّر
`openclaw-gateway.service` عبر `sudo systemctl edit openclaw-gateway.service`.

كيف تساعد سياسات `Restart=` على الاسترداد الآلي:
[يمكن لـ systemd أتمتة استرداد الخدمات](https://www.redhat.com/en/blog/systemd-automate-recovery).

بالنسبة إلى سلوك OOM في Linux، واختيار العملية الفرعية الضحية، وتشخيصات `exit 137`،
راجع [ضغط الذاكرة في Linux وعمليات القتل بسبب OOM](/ar/platforms/linux#memory-pressure-and-oom-kills).

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [DigitalOcean](/ar/install/digitalocean)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
