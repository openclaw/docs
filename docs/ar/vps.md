---
read_when:
    - أنت تريد تشغيل Gateway على خادم Linux أو VPS سحابي
    - أنت تحتاج إلى خريطة سريعة لأدلة الاستضافة
    - أنت تريد ضبطًا عامًا لخادم Linux من أجل OpenClaw
sidebarTitle: Linux Server
summary: شغّل OpenClaw على خادم Linux أو VPS سحابي — اختيار المزوّد، والبنية، والضبط الدقيق
title: خادم Linux
x-i18n:
    generated_at: "2026-04-24T08:12:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

شغّل OpenClaw Gateway على أي خادم Linux أو VPS سحابي. تساعدك هذه الصفحة على
اختيار مزوّد، وتشرح كيف تعمل عمليات النشر السحابية، وتغطي الضبط العام لنظام Linux
الذي ينطبق في كل مكان.

## اختر مزوّدًا

<CardGroup cols={2}>
  <Card title="Railway" href="/ar/install/railway">إعداد بنقرة واحدة من المتصفح</Card>
  <Card title="Northflank" href="/ar/install/northflank">إعداد بنقرة واحدة من المتصفح</Card>
  <Card title="DigitalOcean" href="/ar/install/digitalocean">VPS مدفوع بسيط</Card>
  <Card title="Oracle Cloud" href="/ar/install/oracle">طبقة ARM مجانية دائمًا</Card>
  <Card title="Fly.io" href="/ar/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ar/install/hetzner">Docker على Hetzner VPS</Card>
  <Card title="Hostinger" href="/ar/install/hostinger">VPS مع إعداد بنقرة واحدة</Card>
  <Card title="GCP" href="/ar/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ar/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ar/install/exe-dev">VM مع HTTPS proxy</Card>
  <Card title="Raspberry Pi" href="/ar/install/raspberry-pi">استضافة ذاتية على ARM</Card>
</CardGroup>

كما يعمل **AWS (EC2 / Lightsail / free tier)** بشكل جيد أيضًا.
يتوفر شرح فيديو من المجتمع على
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(مورد مجتمعي -- وقد يصبح غير متاح).

## كيف تعمل الإعدادات السحابية

- تعمل **Gateway على الـ VPS** وتمتلك الحالة + مساحة العمل.
- تتصل من حاسوبك المحمول أو هاتفك عبر **Control UI** أو **Tailscale/SSH**.
- تعامل مع الـ VPS على أنها مصدر الحقيقة وقم **بنسخ** الحالة + مساحة العمل احتياطيًا بانتظام.
- الافتراضي الآمن: أبقِ Gateway على loopback وادخل إليها عبر نفق SSH أو Tailscale Serve.
  وإذا ربطتها بـ `lan` أو `tailnet`، فألزم `gateway.auth.token` أو `gateway.auth.password`.

الصفحات ذات الصلة: [الوصول البعيد إلى Gateway](/ar/gateway/remote)، [مركز المنصات](/ar/platforms).

## وكيل شركة مشترك على VPS

يُعد تشغيل وكيل واحد لفريق كامل إعدادًا صالحًا عندما يكون كل مستخدم ضمن نفس حدود الثقة ويكون الوكيل مخصصًا للعمل فقط.

- أبقه على runtime مخصص (VPS/VM/container + مستخدم/حسابات نظام تشغيل مخصصة).
- لا تسجّل دخول ذلك runtime إلى حسابات Apple/Google الشخصية أو ملفات تعريف المتصفح/مدير كلمات المرور الشخصية.
- إذا كان المستخدمون خصومًا لبعضهم بعضًا، فقسّمهم حسب gateway/host/مستخدم نظام التشغيل.

تفاصيل نموذج الأمان: [الأمان](/ar/gateway/security).

## استخدام nodes مع VPS

يمكنك إبقاء Gateway في السحابة وإقران **nodes** على أجهزتك المحلية
(Mac/iOS/Android/headless). توفر nodes قدرات الشاشة/الكاميرا/canvas المحلية و`system.run`
بينما تبقى Gateway في السحابة.

المستندات: [Nodes](/ar/nodes)، [Nodes CLI](/ar/cli/nodes).

## ضبط بدء التشغيل للـ VM الصغيرة والمضيفات ARM

إذا كانت أوامر CLI تبدو بطيئة على VM منخفضة القدرة (أو على مضيفات ARM)، فعّل ذاكرة cache الخاصة بترجمة الوحدات في Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- يحسّن `NODE_COMPILE_CACHE` أوقات بدء التشغيل المتكررة للأوامر.
- يتجنب `OPENCLAW_NO_RESPAWN=1` عبء بدء تشغيل إضافيًا ناتجًا عن مسار إعادة تشغيل ذاتي.
- يؤدي أول تشغيل للأمر إلى تدفئة cache؛ وتكون عمليات التشغيل التالية أسرع.
- للاطلاع على التفاصيل الخاصة بـ Pi، راجع [Pi](/ar/install/raspberry-pi).

### قائمة تحقق لضبط systemd (اختيارية)

بالنسبة إلى مضيفات VM التي تستخدم `systemd`، ضع في الاعتبار ما يلي:

- أضف env للخدمة من أجل مسار بدء تشغيل مستقر:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- أبقِ سلوك إعادة التشغيل صريحًا:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- فضّل الأقراص المدعومة بـ SSD لمسارات الحالة/cache لتقليل عقوبات البدء البارد الناتجة عن الإدخال/الإخراج العشوائي.

بالنسبة إلى المسار القياسي `openclaw onboard --install-daemon`، حرر وحدة المستخدم:

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

إذا كنت قد ثبّتَّ عمدًا وحدة نظام بدلًا من ذلك، فحرر
`openclaw-gateway.service` عبر `sudo systemctl edit openclaw-gateway.service`.

كيف تساعد سياسات `Restart=` في التعافي الآلي:
[يمكن لـ systemd أتمتة تعافي الخدمة](https://www.redhat.com/en/blog/systemd-automate-recovery).

بالنسبة إلى سلوك OOM في Linux، واختيار عملية child كضحية، وتشخيصات
`exit 137`، راجع [ضغط الذاكرة وعمليات القتل بسبب OOM في Linux](/ar/platforms/linux#memory-pressure-and-oom-kills).

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [DigitalOcean](/ar/install/digitalocean)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
