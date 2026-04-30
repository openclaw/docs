---
read_when:
    - تريد تشغيل Gateway على خادم Linux أو خادم VPS سحابي
    - تحتاج إلى خريطة سريعة لأدلة الاستضافة
    - تريد ضبطًا عامًا لخادم Linux من أجل OpenClaw
sidebarTitle: Linux Server
summary: تشغيل OpenClaw على خادم Linux أو VPS سحابي — مُنتقي المزوّد والبنية المعمارية والضبط
title: خادم Linux
x-i18n:
    generated_at: "2026-04-30T08:34:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

شغّل OpenClaw Gateway على أي خادم Linux أو VPS سحابي. تساعدك هذه الصفحة على
اختيار مزوّد، وتشرح كيفية عمل عمليات النشر السحابية، وتغطي ضبط Linux
العام الذي ينطبق في كل مكان.

## اختر مزوّدًا

<CardGroup cols={2}>
  <Card title="Railway" href="/ar/install/railway">إعداد بنقرة واحدة من المتصفح</Card>
  <Card title="Northflank" href="/ar/install/northflank">إعداد بنقرة واحدة من المتصفح</Card>
  <Card title="DigitalOcean" href="/ar/install/digitalocean">VPS مدفوع بسيط</Card>
  <Card title="Oracle Cloud" href="/ar/install/oracle">طبقة ARM مجانية دائمًا</Card>
  <Card title="Fly.io" href="/ar/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ar/install/hetzner">Docker على Hetzner VPS</Card>
  <Card title="Hostinger" href="/ar/install/hostinger">VPS بإعداد بنقرة واحدة</Card>
  <Card title="GCP" href="/ar/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ar/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ar/install/exe-dev">VM مع وكيل HTTPS</Card>
  <Card title="Raspberry Pi" href="/ar/install/raspberry-pi">استضافة ذاتية على ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** يعمل جيدًا أيضًا.
يتوفر شرح فيديو من المجتمع على
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(مورد مجتمعي -- قد يصبح غير متاح).

## كيفية عمل الإعدادات السحابية

- **يعمل Gateway على VPS** ويمتلك الحالة + مساحة العمل.
- تتصل من حاسوبك المحمول أو هاتفك عبر **واجهة التحكم** أو **Tailscale/SSH**.
- تعامل مع VPS باعتباره مصدر الحقيقة و**انسخ احتياطيًا** للحالة + مساحة العمل بانتظام.
- الإعداد الافتراضي الآمن: أبقِ Gateway على loopback وادخل إليه عبر نفق SSH أو Tailscale Serve.
  إذا ربطته بـ `lan` أو `tailnet`، فاطلب `gateway.auth.token` أو `gateway.auth.password`.

صفحات ذات صلة: [الوصول البعيد إلى Gateway](/ar/gateway/remote)، [مركز المنصات](/ar/platforms).

## شدّد الوصول الإداري أولًا

قبل تثبيت OpenClaw على VPS عام، قرر كيف تريد إدارة
الجهاز نفسه.

- إذا كنت تريد وصولًا إداريًا عبر Tailnet فقط، فثبّت Tailscale أولًا، وانضم بـ VPS
  إلى tailnet لديك، وتحقق من جلسة SSH ثانية عبر عنوان IP الخاص بـ Tailscale أو
  اسم MagicDNS، ثم قيّد SSH العام.
- إذا لم تكن تستخدم Tailscale، فطبّق التشديد المكافئ لمسار SSH
  قبل كشف المزيد من الخدمات.
- هذا منفصل عن الوصول إلى Gateway. لا يزال بإمكانك إبقاء OpenClaw مربوطًا بـ
  loopback واستخدام نفق SSH أو Tailscale Serve للوحة المعلومات.

توجد خيارات Gateway الخاصة بـ Tailscale في [Tailscale](/ar/gateway/tailscale).

## وكيل شركة مشترك على VPS

تشغيل وكيل واحد لفريق هو إعداد صالح عندما يكون كل المستخدمين ضمن حدود الثقة نفسها ويكون الوكيل مخصصًا للعمل فقط.

- أبقه على بيئة تشغيل مخصصة (VPS/VM/حاوية + مستخدم/حسابات نظام تشغيل مخصصة).
- لا تسجل دخول بيئة التشغيل تلك إلى حسابات Apple/Google شخصية أو ملفات تعريف متصفح/مدير كلمات مرور شخصية.
- إذا كان المستخدمون خصومًا لبعضهم بعضًا، فافصل حسب Gateway/المضيف/مستخدم نظام التشغيل.

تفاصيل نموذج الأمان: [الأمان](/ar/gateway/security).

## استخدام العُقد مع VPS

يمكنك إبقاء Gateway في السحابة وإقران **العُقد** على أجهزتك المحلية
(Mac/iOS/Android/بدون واجهة). توفر العُقد إمكانات الشاشة/الكاميرا/canvas المحلية و`system.run`
بينما يبقى Gateway في السحابة.

المستندات: [العُقد](/ar/nodes)، [CLI العُقد](/ar/cli/nodes).

## ضبط بدء التشغيل للأجهزة الافتراضية الصغيرة ومضيفي ARM

إذا بدت أوامر CLI بطيئة على الأجهزة الافتراضية منخفضة الطاقة (أو مضيفي ARM)، ففعّل ذاكرة التخزين المؤقت لتجميع وحدات Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- يحسّن `NODE_COMPILE_CACHE` أزمنة بدء الأوامر المتكررة.
- يتجنب `OPENCLAW_NO_RESPAWN=1` حملًا إضافيًا عند بدء التشغيل من مسار إعادة تشغيل ذاتية.
- أول تشغيل للأمر يهيئ ذاكرة التخزين المؤقت؛ تكون التشغيلات اللاحقة أسرع.
- لتفاصيل Raspberry Pi، راجع [Raspberry Pi](/ar/install/raspberry-pi).

### قائمة تحقق ضبط systemd (اختياري)

لمضيفي VM الذين يستخدمون `systemd`، ضع في اعتبارك:

- أضف بيئة خدمة لمسار بدء تشغيل مستقر:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- اجعل سلوك إعادة التشغيل صريحًا:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- فضّل الأقراص المدعومة بـ SSD لمسارات الحالة/ذاكرة التخزين المؤقت لتقليل عقوبات البدء البارد الناتجة عن الإدخال/الإخراج العشوائي.

لمسار `openclaw onboard --install-daemon` القياسي، حرّر وحدة المستخدم:

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

إذا كنت قد ثبّتّ وحدة نظام عن قصد بدلًا من ذلك، فحرّر
`openclaw-gateway.service` عبر `sudo systemctl edit openclaw-gateway.service`.

كيف تساعد سياسات `Restart=` في الاسترداد الآلي:
[يمكن لـ systemd أتمتة استرداد الخدمة](https://www.redhat.com/en/blog/systemd-automate-recovery).

لسلوك Linux عند نفاد الذاكرة، واختيار العملية الفرعية الضحية، وتشخيصات `exit 137`،
راجع [ضغط الذاكرة في Linux وعمليات القتل بسبب نفاد الذاكرة](/ar/platforms/linux#memory-pressure-and-oom-kills).

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [DigitalOcean](/ar/install/digitalocean)
- [Fly.io](/ar/install/fly)
- [Hetzner](/ar/install/hetzner)
