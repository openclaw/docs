---
read_when:
    - تريد تشغيل Gateway على خادم Linux أو خادم VPS سحابي
    - تحتاج إلى خريطة سريعة لأدلة الاستضافة
    - تريد ضبطًا عامًا لخادم Linux من أجل OpenClaw
sidebarTitle: Linux Server
summary: شغّل OpenClaw على خادم Linux أو خادم VPS سحابي — اختيار المزوّد والبنية والضبط
title: خادم Linux
x-i18n:
    generated_at: "2026-07-12T06:44:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

شغّل Gateway الخاص بـ OpenClaw على أي خادم Linux أو خادم VPS سحابي. تساعدك هذه الصفحة على
اختيار مزوّد، وتشرح كيفية عمل عمليات النشر السحابية، وتغطي إعدادات تحسين Linux
العامة التي تنطبق في كل مكان.

## اختر مزوّدًا

<CardGroup cols={2}>
  <Card title="Azure" href="/ar/install/azure">جهاز Linux افتراضي</Card>
  <Card title="DigitalOcean" href="/ar/install/digitalocean">خادم VPS بسيط مدفوع</Card>
  <Card title="exe.dev" href="/ar/install/exe-dev">جهاز افتراضي مع وكيل HTTPS</Card>
  <Card title="Fly.io" href="/ar/install/fly">أجهزة Fly</Card>
  <Card title="GCP" href="/ar/install/gcp">محرك الحوسبة</Card>
  <Card title="Hetzner" href="/ar/install/hetzner">Docker على خادم VPS من Hetzner</Card>
  <Card title="Hostinger" href="/ar/install/hostinger">خادم VPS بإعداد بنقرة واحدة</Card>
  <Card title="Northflank" href="/ar/install/northflank">إعداد بنقرة واحدة عبر المتصفح</Card>
  <Card title="Oracle Cloud" href="/ar/install/oracle">فئة ARM المجانية دائمًا</Card>
  <Card title="Railway" href="/ar/install/railway">إعداد بنقرة واحدة عبر المتصفح</Card>
  <Card title="Raspberry Pi" href="/ar/install/raspberry-pi">استضافة ذاتية بمعمارية ARM</Card>
</CardGroup>

يعمل **AWS (EC2 / Lightsail / الفئة المجانية)** جيدًا أيضًا.
يتوفر شرح فيديو تفصيلي من المجتمع على
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(مورد مجتمعي — قد يصبح غير متاح).

## كيفية عمل الإعدادات السحابية

- يعمل **Gateway على خادم VPS** ويمتلك الحالة + مساحة العمل.
- تتصل من حاسوبك المحمول أو هاتفك عبر **واجهة التحكم** أو **Tailscale/SSH**.
- تعامل مع خادم VPS بوصفه مصدر الحقيقة، وأنشئ **نسخًا احتياطية** من الحالة + مساحة العمل بانتظام.
- الإعداد الافتراضي الآمن: أبقِ Gateway على local loopback وصِل إليه عبر نفق SSH أو Tailscale Serve.
  إذا ربطته بـ `lan` أو `tailnet`، فسيتطلب Gateway سرًا مشتركًا
  (`gateway.auth.token` أو `gateway.auth.password`) ما لم تُفوَّض المصادقة إلى
  وكيل موثوق.

صفحات ذات صلة: [الوصول البعيد إلى Gateway](/ar/gateway/remote)، [مركز المنصات](/ar/platforms).

## حصّن وصول الإدارة أولًا

قبل تثبيت OpenClaw على خادم VPS عام، حدّد الطريقة التي تريد بها إدارة
الخادم نفسه.

- لقصر وصول الإدارة على Tailnet فقط: ثبّت Tailscale أولًا، وأضف خادم VPS إلى
  شبكة tailnet الخاصة بك، وتحقق من جلسة SSH ثانية عبر عنوان IP الخاص بـ Tailscale أو اسم MagicDNS،
  ثم قيّد الوصول العام عبر SSH.
- من دون Tailscale: طبّق إجراءات التحصين المكافئة على مسار SSH قبل
  كشف المزيد من الخدمات.
- هذا منفصل عن الوصول إلى Gateway. لا يزال بإمكانك إبقاء OpenClaw مرتبطًا بـ
  local loopback واستخدام نفق SSH أو Tailscale Serve للوصول إلى لوحة المعلومات.

توجد خيارات Gateway الخاصة بـ Tailscale في [Tailscale](/ar/gateway/tailscale).

## وكيل مشترك للشركة على خادم VPS

يُعد تشغيل وكيل واحد لفريق إعدادًا صالحًا عندما يكون جميع المستخدمين ضمن
حدود الثقة نفسها ويكون الوكيل مخصصًا للأعمال فقط.

- أبقِه في بيئة تشغيل مخصصة (خادم VPS/جهاز افتراضي/حاوية + مستخدم/حسابات مخصصة لنظام التشغيل).
- لا تسجّل دخول بيئة التشغيل هذه إلى حسابات Apple/Google الشخصية أو ملفات المتصفح/مدير كلمات المرور الشخصية.
- إذا كان المستخدمون خصومًا لبعضهم، فافصل بينهم حسب Gateway/المضيف/مستخدم نظام التشغيل.

تفاصيل نموذج الأمان: [الأمان](/ar/gateway/security).

## استخدام العُقد مع خادم VPS

يمكنك إبقاء Gateway في السحابة وإقران **العُقد** على أجهزتك المحلية
(Mac/iOS/Android/من دون واجهة رسومية). توفر العُقد إمكانات الشاشة/الكاميرا/مساحة الرسم المحلية و`system.run`
بينما يظل Gateway في السحابة.

الوثائق: [العُقد](/ar/nodes)، [CLI للعُقد](/ar/cli/nodes).

## تحسين بدء التشغيل للأجهزة الافتراضية الصغيرة ومضيفي ARM

إذا بدت أوامر CLI بطيئة على الأجهزة الافتراضية منخفضة القدرة (أو مضيفي ARM)، ففعّل ذاكرة التخزين المؤقت لتجميع وحدات Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- يحسّن `NODE_COMPILE_CACHE` أزمنة بدء تشغيل الأوامر المتكررة؛ ويهيئ التشغيل الأول ذاكرة التخزين المؤقت.
- يُبقي `OPENCLAW_NO_RESPAWN=1` عمليات إعادة التشغيل الاعتيادية لـ Gateway ضمن العملية نفسها، ما يتجنب عمليات التسليم الإضافية بين العمليات ويُبقي تتبّع PID بسيطًا على المضيفين الصغار.
- للحصول على التفاصيل الخاصة بـ Raspberry Pi، راجع [Raspberry Pi](/ar/install/raspberry-pi).

### قائمة تحقق لتحسين systemd (اختيارية)

بالنسبة إلى مضيفي الأجهزة الافتراضية الذين يستخدمون `systemd`، ضع في اعتبارك ما يلي:

- متغيرات بيئة الخدمة لمسار بدء تشغيل مستقر: `OPENCLAW_NO_RESPAWN=1` و
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- سلوك صريح لإعادة التشغيل: `Restart=always` و`RestartSec=2` و`TimeoutStartSec=90`
- أقراص مدعومة بوحدات SSD لمسارات الحالة/ذاكرة التخزين المؤقت لتقليل أعباء البدء البارد الناتجة عن عمليات الإدخال/الإخراج العشوائية.

يثبّت المسار القياسي `openclaw onboard --install-daemon` وحدة مستخدم
لـ systemd؛ عدّلها باستخدام:

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

إذا كنت قد ثبّتَّ وحدة نظام عمدًا بدلًا من ذلك، فعدّلها عبر
`sudo systemctl edit openclaw-gateway.service`.

كيف تساعد سياسات `Restart=` في الاسترداد الآلي:
[يمكن لـ systemd أتمتة استرداد الخدمة](https://www.redhat.com/en/blog/systemd-automate-recovery).

للتعرف على سلوك نفاد الذاكرة في Linux، واختيار العملية الفرعية الضحية، وتشخيصات `exit 137`،
راجع [ضغط الذاكرة وعمليات الإنهاء بسبب نفاد الذاكرة في Linux](/ar/platforms/linux#memory-pressure-and-oom-kills).

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [DigitalOcean](/ar/install/digitalocean)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
