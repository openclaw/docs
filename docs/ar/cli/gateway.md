---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateways عبر Bonjour (محلي + DNS-SD واسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل بوابات Gateway والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-06-30T14:04:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العُقد، الجلسات، الخطافات). توجد الأوامر الفرعية في هذه الصفحة ضمن `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي + DNS-SD واسع النطاق.
  </Card>
  <Card title="نظرة عامة على الاكتشاف" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن البوابات ويعثر عليها.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration">
    مفاتيح تكوين Gateway في المستوى الأعلى.
  </Card>
</CardGroup>

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

الاسم البديل للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - افتراضيًا، يرفض Gateway البدء ما لم يكن `gateway.mode=local` مضبوطًا في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المؤقتة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كتكوين معطّل أو مستبدَل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا وكان `gateway.mode` مفقودًا، يتعامل Gateway مع ذلك كتلف مريب في التكوين ويرفض "تخمين المحلي" نيابةً عنك.
    - يُحظر الربط خارج loopback دون مصادقة (حاجز أمان).
    - تُحل `lan` و`tailnet` و`custom` حاليًا عبر مسارات BYOH التي تدعم IPv4 فقط.
    - لا يُدعم BYOH الخاص بـ IPv6 فقط دعمًا أصيلًا في هذا المسار اليوم. استخدم sidecar أو وكيل IPv4 إذا كان المضيف نفسه يعمل بـ IPv6 فقط.
    - يطلق `SIGUSR1` إعادة تشغيل داخل العملية عند التصريح بذلك (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء تطبيق/تحديث أداة وتكوين Gateway مسموحًا).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI باستخدام TUI أو إدخال في الوضع الخام، فاستعد الطرفية قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من التكوين/البيئة؛ عادةً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  وضع ربط المستمع. تُحل `lan` و`tailnet` و`custom` حاليًا عبر مسارات تدعم IPv4 فقط.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  تجاوز وضع المصادقة.
</ParamField>
<ParamField path="--token <token>" type="string">
  تجاوز الرمز المميز (يضبط أيضًا `OPENCLAW_GATEWAY_TOKEN` للعملية).
</ParamField>
<ParamField path="--password <password>" type="string">
  تجاوز كلمة المرور.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  قراءة كلمة مرور Gateway من ملف.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  عرض Gateway عبر Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  إعادة ضبط تكوين serve/funnel الخاص بـ Tailscale عند إيقاف التشغيل.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  يتوقع عنوان IPv4 اليوم. بالنسبة إلى BYOH الخاص بـ IPv6 فقط، ضع sidecar أو وكيل IPv4 أمام Gateway ووجّه OpenClaw إلى نقطة نهاية IPv4 تلك.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway دون `gateway.mode=local` في التكوين. يتجاوز حاجز بدء التشغيل للتمهيد المؤقت/التطويري فقط؛ ولا يكتب ملف التكوين أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء تكوين تطوير + مساحة عمل إذا كانت مفقودة (يتجاوز BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة ضبط تكوين التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  إنهاء أي مستمع موجود على المنفذ المحدد قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  سجلات مفصلة.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  عرض سجلات الواجهة الخلفية لـ CLI فقط في وحدة التحكم (وتفعيل stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  نمط سجل Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  اسم بديل لـ `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  تسجيل أحداث تدفق النموذج الخام إلى jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسار jsonl للتدفق الخام.
</ParamField>

## إعادة تشغيل Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

يطلب `openclaw gateway restart --safe` من Gateway قيد التشغيل إجراء فحص مسبق للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد تصريف العمل النشط. تنتظر إعادة التشغيل الآمنة الافتراضية العمل النشط حتى مدة `gateway.reload.deferralTimeoutMs` المضبوطة (الافتراضي 5 دقائق)؛ وعند انتهاء تلك المهلة تُفرض إعادة التشغيل. اضبط `gateway.reload.deferralTimeoutMs` على `0` لانتظار آمن غير محدد لا يفرض إعادة التشغيل أبدًا. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي؛ ويظل `--force` مسار التجاوز الفوري.

يشغّل `openclaw gateway restart --safe --skip-deferral` إعادة التشغيل المنسقة نفسها والواعية بـ OpenClaw مثل `--safe`، لكنه يتجاوز بوابة تأجيل العمل النشط بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. استخدمه كمخرج طارئ للمشغّل عندما يكون التأجيل مثبتًا بسبب تشغيل مهمة عالق وقد يكون `--safe` وحده محدودًا بـ `gateway.reload.deferralTimeoutMs`. يتطلب `--skip-deferral` الخيار `--safe`.

<Warning>
يمكن أن تظهر `--password` المضمنة في قوائم العمليات المحلية. فضّل `--password-file` أو البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### تحليل أداء Gateway

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جدول البحث في Plugin للفهرس المثبّت، وسجل البيان، وتخطيط بدء التشغيل، وعمل خريطة المالكين.
- اضبط `OPENCLAW_GATEWAY_RESTART_TRACE=1` لتسجيل أسطر `restart trace:` ذات نطاق إعادة التشغيل لمعالجة إشارة إعادة التشغيل، وتصريف العمل النشط، ومراحل الإيقاف، والبدء التالي، وتوقيت الجاهزية، ومقاييس الذاكرة.
- اضبط `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة خط زمني لتشخيصات بدء التشغيل بصيغة JSONL وبأفضل جهد لأطر QA الخارجية. يمكنك أيضًا تفعيل العلم باستخدام `diagnostics.flags: ["timeline"]` في التكوين؛ ويظل المسار مقدّمًا من البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm build` أولًا، ثم `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس بدء Gateway مقابل مدخل CLI المبني. يسجل القياس أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جدول البحث في Plugin.
- شغّل `pnpm build` أولًا، ثم `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` لقياس إعادة تشغيل Gateway داخل العملية مقابل مدخل CLI المبني على macOS أو Linux. يستخدم قياس إعادة التشغيل SIGUSR1، ويفعّل تتبعات بدء التشغيل وإعادة التشغيل في العملية الفرعية، ويسجل `/healthz` التالي، و`/readyz` التالي، ومدة التوقف، وتوقيت الجاهزية، وCPU، وRSS، ومقاييس تتبع إعادة التشغيل.
- تعامل مع `/healthz` كمؤشر حياة و`/readyz` كجاهزية قابلة للاستخدام. أسطر التتبع ومخرجات القياس مخصصة لإسناد المالك؛ لا تتعامل مع فترة تتبع واحدة أو عينة واحدة كاستنتاج كامل للأداء.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: قابل للقراءة البشرية (ملوّن في TTY).
    - `--json`: JSON قابل للقراءة آليًا (دون تنسيق/مؤشر تحميل).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL الخاص بـ WebSocket لـ Gateway.
    - `--token <token>`: رمز Gateway المميز.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: مهلة/ميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند ضبط `--url`، لا يعود CLI إلى بيانات اعتماد التكوين أو البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

نقطة نهاية HTTP `/healthz` هي مسبار حياة: تعود بمجرد أن يتمكن الخادم من الرد عبر HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتبقى حمراء بينما لا تزال sidecars الخاصة بـ Plugin عند بدء التشغيل أو القنوات أو الخطافات المضبوطة تستقر. تتضمن استجابات الجاهزية التفصيلية المحلية أو المصادَق عليها كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة نواة CPU، وعلم `degraded`.

<ParamField path="--port <port>" type="number">
  استهداف Gateway على local loopback عبر هذا المنفذ. يتجاوز هذا `OPENCLAW_GATEWAY_URL` و`OPENCLAW_GATEWAY_PORT` لاستدعاء الحالة الصحية.
</ParamField>

### `gateway usage-cost`

جلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  عدد الأيام المطلوب تضمينها.
</ParamField>
<ParamField path="--agent <id>" type="string">
  حصر ملخص التكلفة على معرف وكيل واحد مضبوط.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  تجميع ملخص التكلفة عبر جميع الوكلاء المضبوطين. لا يمكن دمجه مع `--agent`.
</ParamField>

### `gateway stability`

جلب مسجل الاستقرار التشخيصي الأخير من Gateway قيد التشغيل.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  الحد الأقصى لعدد الأحداث الحديثة المطلوب تضمينها (الأقصى `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  التصفية حسب نوع حدث التشخيص، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث فقط بعد رقم تسلسل تشخيصي.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON للحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات دعم قابلة للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزمة">
    - تحتفظ السجلات بالبيانات الوصفية التشغيلية: أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقحة. لا تحتفظ بنص الدردشة، أو أجسام webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند مخارج Gateway الفادحة، ومهل الإيقاف، وفشل بدء إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ كما تنطبق `--limit` و`--type` و`--since-seq` على مخرجات الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip للتشخيصات المحلية مصممًا لإرفاقه بتقارير الأخطاء. لنموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. يكون افتراضياً تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقّاة المراد تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المراد فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ Gateway WebSocket من أجل لقطة الصحة.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway من أجل لقطة الصحة.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway من أجل لقطة الصحة.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلة لقطة الحالة/الصحة.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  تخطَّ البحث عن حزمة الاستقرار المحفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع المسار المكتوب والحجم والبيان بصيغة JSON.
</ParamField>

يحتوي التصدير على بيان، وملخص Markdown، وشكل التهيئة، وتفاصيل تهيئة منقّاة، وملخصات سجلات منقّاة، ولقطات حالة/صحة Gateway منقّاة، وأحدث حزمة استقرار عند وجود واحدة.

الغرض منه أن تتم مشاركته. يحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجل OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المهيأة، والمنافذ، ومعرّفات plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقّحة. ويحذف أو ينقّح نصوص الدردشة، وأجسام webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحسابات/الرسائل، ونصوص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway ‏(launchd/systemd/schtasks) مع فحص اختياري لإمكانات الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  أضف هدف فحص صريحاً. ستظل الوجهة البعيدة المهيأة وlocalhost قيد الفحص.
</ParamField>
<ParamField path="--token <token>" type="string">
  مصادقة الرمز للفحص.
</ParamField>
<ParamField path="--password <password>" type="string">
  مصادقة كلمة المرور للفحص.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلة الفحص.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  تخطَّ فحص الاتصال (عرض الخدمة فقط).
</ParamField>
<ParamField path="--deep" type="boolean">
  افحص خدمات مستوى النظام أيضاً.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  رقِّ فحص الاتصال الافتراضي إلى فحص قراءة واخرج برمز غير صفري عند فشل فحص القراءة. لا يمكن جمعه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - يبقى `gateway status` متاحاً للتشخيص حتى عندما تكون تهيئة CLI المحلية مفقودة أو غير صالحة.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانات المصادقة المرئية وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - فحوص التشخيص غير معدّلة لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخزّن مؤقتاً موجوداً عند توفره، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل اقتران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs الخاصة بالمصادقة المهيأة لمصادقة الفحص عندما يكون ذلك ممكناً.
    - إذا تعذر حل SecretRef مصادقة مطلوب في مسار هذا الأمر، يبلّغ `gateway status --json` عن `rpc.authWarning` عند فشل اتصال/مصادقة الفحص؛ مرر `--token`/`--password` صراحةً أو عالج مصدر السر أولاً.
    - إذا نجح الفحص، تُخفى تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
    - عند تفعيل الفحص، يتضمن خرج JSON الحقل `gateway.version` عندما يبلّغ Gateway الجاري عنه؛ ويمكن لـ `--require-rpc` الرجوع إلى حمولة RPC ‏`status.runtimeVersion` إذا لم يتمكن فحص المصافحة اللاحق من توفير بيانات تعريف الإصدار.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع وتحتاج أيضاً إلى أن تكون نداءات RPC ذات نطاق القراءة سليمة.
    - يضيف `--deep` فحصاً بأفضل جهد لعمليات تثبيت launchd/systemd/schtasks إضافية. عند اكتشاف عدة خدمات شبيهة بـ gateway، يطبع الخرج البشري تلميحات تنظيف ويحذر من أن معظم الإعدادات ينبغي أن تشغّل gateway واحداً لكل جهاز.
    - يبلّغ `--deep` أيضاً عن تسليم حديث لإعادة تشغيل مشرف Gateway عندما تخرج عملية الخدمة بشكل سليم من أجل إعادة تشغيل مشرف خارجي.
    - يشغّل `--deep` تحقق التهيئة في وضع واعٍ بالـ plugin ‏(`pluginValidation: "full"`) ويعرض تحذيرات بيان plugin المهيأة (مثلاً بيانات تعريف تهيئة القناة المفقودة) بحيث تلتقطها فحوص التثبيت والتحديث الدخانية. يحافظ `gateway status` الافتراضي على مسار القراءة فقط السريع الذي يتخطى التحقق من plugin.
    - يتضمن الخرج البشري مسار ملف السجل المحلول، إضافة إلى لقطة مسارات/صلاحية تهيئة CLI مقابل الخدمة للمساعدة في تشخيص انحراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - في عمليات تثبيت Linux systemd، تقرأ فحوص انحراف مصادقة الخدمة قيَم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوص الانحراف SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولاً، ثم بيئة العملية كخيار احتياطي).
    - إذا لم تكن مصادقة الرمز نشطة فعلياً (وضع `gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو وضع غير مضبوط حيث يمكن أن تفوز كلمة المرور ولا يمكن لأي مرشح رمز أن يفوز)، تتخطى فحوص انحراف الرمز حل رمز التهيئة.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائماً:

- gateway البعيد المهيأ لديك (إن ضُبط)، و
- localhost ‏(local loopback) **حتى لو كانت الوجهة البعيدة مهيأة**.

إذا مررت `--url`، يُضاف ذلك الهدف الصريح قبل كليهما. يوسم الخرج البشري الأهداف كما يلي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا كانت عدة أهداف فحص قابلة للوصول، فسيطبعها كلها. يمكن لنفق SSH، وعنوان TLS/proxy URL، وعنوان URL البعيد المهيأ أن تشير كلها إلى gateway نفسه حتى عندما تختلف منافذ النقل بينها؛ ويُحجز `multiple_gateways` لحالات gateway المميزة أو الغامضة الهوية القابلة للوصول. تُدعم عدة gateways عند استخدام ملفات شخصية معزولة (مثلاً بوت إنقاذ)، لكن معظم عمليات التثبيت لا تزال تشغّل gateway واحداً.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  استخدم هذا المنفذ لهدف فحص local loopback ولمنفذ نفق SSH البعيد. بدون `--url`، يحدد هذا هدف local loopback بدلاً من عنوان URL لبيئة gateway المهيأة، أو منفذ البيئة، أو الأهداف البعيدة.
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` تعني أن هدفاً واحداً على الأقل قبل اتصال WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` يبلّغ عما استطاع الفحص إثباته بشأن المصادقة. وهو منفصل عن قابلية الوصول.
    - `Read probe: ok` تعني أن نداءات RPC التفصيلية ذات نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضاً.
    - `Read probe: limited - missing scope: operator.read` تعني أن الاتصال نجح لكن RPC ذات نطاق القراءة محدودة. يُبلّغ عن ذلك كقابلية وصول **متدهورة**، لا كفشل كامل.
    - `Read probe: failed` بعد `Connect: ok` تعني أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضاً قابلية وصول **متدهورة**، وليس Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة جهاز مخزّنة مؤقتاً موجودة، لكنه لا ينشئ هوية جهاز لأول مرة أو حالة اقتران.
    - يكون رمز الخروج غير صفري فقط عندما لا يكون أي هدف مفحوص قابلاً للوصول.

  </Accordion>
  <Accordion title="JSON output">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: هدف واحد على الأقل قبل اتصالاً لكنه لم يكمل تشخيصات RPC التفصيلية الكاملة.
    - `capability`: أفضل إمكانات شوهدت عبر الأهداف القابلة للوصول (`read_only`، أو `write_capable`، أو `admin_capable`، أو `pairing_pending`، أو `connected_no_operator_scope`، أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه كالفائز النشط بهذا الترتيب: عنوان URL الصريح، نفق SSH، الوجهة البعيدة المهيأة، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد تحتوي على `code` و`message` و`targetIds` اختيارية.
    - `network`: تلميحات URL لـ local loopback/tailnet مشتقة من التهيئة الحالية وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية الاكتشاف الفعلية/عدد النتائج المستخدمان لمرور هذا الفحص.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب فقدان نطاق المشغّل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلّغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف إمكانات المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ رجع الأمر إلى الفحوص المباشرة.
    - `multiple_gateways`: كانت هويات gateway مميزة قابلة للوصول، أو لم يستطع OpenClaw إثبات أن الأهداف القابلة للوصول هي gateway نفسه. لا يؤدي نفق SSH، أو عنوان proxy URL، أو عنوان URL بعيد مهيأ إلى gateway نفسه إلى تشغيل هذا التحذير.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مهيأ لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدوداً بسبب فقدان `operator.read`.

  </Accordion>
</AccordionGroup>

#### الوجهة البعيدة عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS إعادة توجيه منفذ محلي بحيث يصبح gateway البعيد (الذي قد يكون مربوطاً بـ loopback فقط) قابلاً للوصول عند `ws://127.0.0.1:<port>`.

المكافئ في CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` أو `user@host:port` (المنفذ الافتراضي هو `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ملف الهوية.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  اختر أول مضيف gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` إضافة إلى نطاق واسع النطاق المهيأ، إن وجد). تُتجاهل تلميحات TXT فقط.
</ParamField>

التهيئة (اختيارية، تُستخدم كقيم افتراضية):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

مساعد RPC منخفض المستوى.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  سلسلة كائن JSON للمعاملات.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ Gateway WebSocket.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  ميزانية المهلة.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  أساساً لنداءات RPC بنمط الوكيل التي تبث أحداثاً وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  خرج JSON قابل للقراءة آلياً.
</ParamField>

<Note>
يجب أن تكون `--params` بصيغة JSON صالحة.
</Note>

## إدارة خدمة Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### التثبيت باستخدام مغلّف

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة عبر ملف تنفيذي آخر، مثل طبقة مدير أسرار أو مساعد تشغيل باسم مستخدم آخر. يتلقى المغلّف وسائط Gateway العادية، ويكون مسؤولًا عن تنفيذ `openclaw` أو Node في النهاية باستخدام تلك الوسائط.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

يمكنك أيضًا ضبط المغلّف عبر البيئة. يتحقق `gateway install` من أن المسار ملف قابل للتنفيذ، ويكتب المغلّف في `ProgramArguments` الخاصة بالخدمة، ويثبّت `OPENCLAW_WRAPPER` في بيئة الخدمة لإعادة التثبيت القسرية والتحديثات وإصلاحات الطبيب اللاحقة.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة مغلّف مُثبّت، امسح `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="خيارات الأمر">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="سلوك دورة الحياة">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل.
    - على macOS، يستخدم `gateway stop` الأمر `launchctl bootout` افتراضيًا، وهذا يزيل LaunchAgent من جلسة الإقلاع الحالية من دون تثبيت تعطيل دائم — يبقى الاسترداد التلقائي عبر KeepAlive نشطًا للأعطال المستقبلية، ويعيد `gateway start` التمكين بشكل نظيف من دون `launchctl enable` يدوي. مرّر `--disable` لكبت KeepAlive وRunAtLoad بشكل دائم حتى لا يعاد تشغيل Gateway تلقائيًا إلى أن يصدر `gateway start` صريح في المرة التالية؛ استخدم هذا عندما يجب أن يستمر الإيقاف اليدوي بعد إعادة الإقلاع أو إعادة تشغيل النظام.
    - يطلب `gateway restart --safe` من Gateway قيد التشغيل إجراء فحص مسبق للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد انتهاء العمل النشط. تنتظر إعادة التشغيل الآمنة الافتراضية العمل النشط حتى مهلة `gateway.reload.deferralTimeoutMs` المضبوطة (الافتراضي 5 دقائق)؛ وعند انتهاء هذه الميزانية تُفرض إعادة التشغيل. اضبط `gateway.reload.deferralTimeoutMs` على `0` لانتظار آمن غير محدد لا يفرض أبدًا. لا يمكن دمج `--safe` مع `--force` أو `--wait`.
    - يتجاوز `gateway restart --wait 30s` ميزانية تصريف إعادة التشغيل المضبوطة لإعادة التشغيل تلك. الأرقام المجردة بالمللي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير محدد.
    - يشغّل `gateway restart --safe --skip-deferral` إعادة التشغيل الآمنة الواعية بـ OpenClaw لكنه يتجاوز بوابة التأجيل لكي يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. هذا مخرج طوارئ للمشغّل عند تعطل تأجيلات تشغيل المهام العالقة؛ ويتطلب `--safe`.
    - يتجاوز `gateway restart --force` تصريف العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغّل قد فحص بالفعل عوائق المهام المدرجة ويريد عودة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للبرمجة النصية.

  </Accordion>
  <Accordion title="المصادقة وSecretRefs وقت التثبيت">
    - عندما تتطلب مصادقة الرمز رمزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل لكنه لا يثبّت الرمز المحلول في بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المضبوط غير محلول، يفشل التثبيت بإغلاق آمن بدل تثبيت نص عادي احتياطي.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـ SecretRef على `--password` المضمّنة.
    - في وضع المصادقة المستنتجة، لا يخفف `OPENCLAW_GATEWAY_PASSWORD` الموجود في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعداد) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.

  </Accordion>
</AccordionGroup>

## اكتشاف Gateways (Bonjour)

يفحص `gateway discover` إشارات Gateway (`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Bonjour واسع النطاق): اختر نطاقًا (مثال: `openclaw.internal.`) واضبط DNS مقسّمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

لا تُعلن الإشارة إلا Gateways التي فُعّل فيها اكتشاف Bonjour (افتراضيًا).

يمكن أن تتضمن سجلات الاكتشاف واسع النطاق تلميحات TXT التالية:

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (وضع الاكتشاف الكامل فقط؛ تجعل العملاء أهداف SSH الافتراضية `22` عند غيابه)
- `tailnetDns` (اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` (TLS مفعّل + بصمة الشهادة)
- `cliPath` (وضع الاكتشاف الكامل فقط)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلة لكل أمر (تصفح/حل).
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات قابلة للقراءة آليًا (وتعطّل أيضًا التنسيق/مؤشر الانتظار).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` إضافةً إلى النطاق واسع النطاق المضبوط عند تفعيل أحدها.
- يُشتق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة المحلولة، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS على `local.` وDNS-SD واسع النطاق، لا يُنشر `sshPort` و`cliPath` إلا عندما يكون `discovery.mdns.mode` هو `full`.

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
