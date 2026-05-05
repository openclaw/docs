---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway، وأوضاع الربط، والاتصال
    - اكتشاف Gateway عبر Bonjour (DNS-SD المحلي والواسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل بوابات Gateway والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-05-05T08:25:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العُقد، الجلسات، hooks). توجد الأوامر الفرعية في هذه الصفحة ضمن `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي + DNS-SD واسع النطاق.
  </Card>
  <Card title="نظرة عامة على الاكتشاف" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن gateways ويعثر عليها.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration">
    مفاتيح تكوين gateway العليا.
  </Card>
</CardGroup>

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

الاسم المستعار للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - افتراضيًا، يرفض Gateway بدء التشغيل ما لم يتم ضبط `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيل المؤقت/التطويري.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كتكوين معطّل أو مستبدَل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقود، يتعامل Gateway مع ذلك كضرر مريب في التكوين ويرفض "تخمين المحلي" نيابةً عنك.
    - يتم حظر الربط خارج loopback دون مصادقة (حاجز أمان).
    - يشغّل `SIGUSR1` إعادة تشغيل داخل العملية عند التفويض (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء تطبيق/تحديث أداة gateway/التكوين مسموحًا).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI باستخدام TUI أو إدخال raw-mode، فاستعد الطرفية قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من التكوين/البيئة؛ عادةً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  وضع ربط المستمع.
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
  قراءة كلمة مرور gateway من ملف.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  إتاحة Gateway عبر Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  إعادة ضبط تكوين serve/funnel في Tailscale عند إيقاف التشغيل.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء gateway دون `gateway.mode=local` في التكوين. يتجاوز حاجز بدء التشغيل للتمهيد المؤقت/التطويري فقط؛ ولا يكتب ملف التكوين أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء تكوين تطوير + مساحة عمل إذا كانا مفقودين (يتجاوز BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة ضبط تكوين التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  إنهاء أي مستمع موجود على المنفذ المحدد قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  سجلات تفصيلية.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  عرض سجلات خلفية CLI فقط في وحدة التحكم (وتفعيل stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  نمط سجل WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  اسم مستعار لـ `--ws-log compact`.
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
openclaw gateway restart --force
```

يطلب `openclaw gateway restart --safe` من Gateway قيد التشغيل إجراء فحص مسبق لعمل OpenClaw النشط قبل إعادة التشغيل. إذا كانت العمليات في قائمة الانتظار، أو تسليم الردود، أو عمليات التشغيل المضمنة، أو عمليات تشغيل المهام نشطة، يبلّغ Gateway عن العوائق، ويدمج طلبات إعادة التشغيل الآمنة المكررة، ويعيد التشغيل بعد انتهاء العمل النشط. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي للتوافق. استخدم `--force` فقط عندما تريد صراحةً مسار التجاوز الفوري.

<Warning>
يمكن أن تنكشف `--password` المضمنة في قوائم العمليات المحلية. فضّل `--password-file` أو متغيرات البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### توصيف بدء التشغيل

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل أزمنة المراحل أثناء بدء تشغيل Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وأزمنة جداول البحث الخاصة بالـ Plugin للفهرس المثبّت، وسجل manifest، وتخطيط بدء التشغيل، وعمل owner-map.
- اضبط `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة مخطط زمني تشخيصي لبدء التشغيل بصيغة JSONL وبأفضل جهد لأدوات QA الخارجية. يمكنك أيضًا تفعيل العلامة باستخدام `diagnostics.flags: ["timeline"]` في التكوين؛ يظل المسار مقدّمًا من البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء تشغيل Gateway. يسجل القياس أول مخرجات العملية، و`/healthz`، و`/readyz`، وأزمنة تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل أزمنة جداول بحث Plugin.

## الاستعلام من Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: قابل للقراءة البشرية (ملوّن في TTY).
    - `--json`: JSON قابل للقراءة آليًا (دون تنسيق/مؤشر تحميل).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL الخاص بـ WebSocket لـ Gateway.
    - `--token <token>`: رمز Gateway.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند ضبط `--url`، لا يعود CLI إلى بيانات اعتماد التكوين أو البيئة. مرّر `--token` أو `--password` صراحةً. عدم وجود بيانات اعتماد صريحة يُعد خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطة نهاية HTTP `/healthz` هي فحص حيوية: تعود بمجرد أن يصبح الخادم قادرًا على الرد على HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتظل حمراء بينما لا تزال sidecars الخاصة بـ Plugin عند بدء التشغيل، أو القنوات، أو hooks المكوّنة في مرحلة الاستقرار. تتضمن استجابات الجاهزية التفصيلية المحلية أو المصدق عليها كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة أنوية CPU، وعلامة `degraded`.

### `gateway usage-cost`

جلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  عدد الأيام المراد تضمينها.
</ParamField>

### `gateway stability`

جلب مسجل الاستقرار التشخيصي الحديث من Gateway قيد التشغيل.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  الحد الأقصى لعدد الأحداث الحديثة المراد تضمينها (الحد الأقصى `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  التصفية حسب نوع حدث التشخيص، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث بعد رقم تسلسل تشخيصي فقط.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON للحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات دعم قابل للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزمة">
    - تحتفظ السجلات ببيانات وصفية تشغيلية: أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، وملخصات جلسات منقحة. لا تحتفظ بنصوص الدردشة، أو أجسام webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند خروج Gateway بشكل قاتل، أو انتهاء مهلة الإيقاف، أو فشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw لقطة التشخيص نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ وتنطبق `--limit` و`--type` و`--since-seq` أيضًا على مخرجات الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip محليًا للتشخيصات مصممًا لإرفاقه بتقارير الأخطاء. لنموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip للإخراج. الافتراضي هو تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقحة المراد تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المراد فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL الخاص بـ WebSocket لـ Gateway من أجل لقطة الصحة.
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
  تخطي البحث عن حزمة الاستقرار المحفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  طباعة المسار المكتوب، والحجم، والـ manifest بصيغة JSON.
</ParamField>

يتضمن التصدير manifest، وملخص Markdown، وشكل التكوين، وتفاصيل تكوين منقحة، وملخصات سجلات منقحة، ولقطات حالة/صحة Gateway منقحة، وأحدث حزمة استقرار عند وجود واحدة.

الغرض منه أن يُشارك. يحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجل OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المكوّنة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقحة. يحذف أو ينقح نصوص الدردشة، وأجسام webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسالة، ونص المطالبة/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway (launchd/systemd/schtasks) بالإضافة إلى فحص اختياري لقدرة الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  أضف هدف فحص صريحًا. سيظل البعيد المكوَّن + localhost قيد الفحص.
</ParamField>
<ParamField path="--token <token>" type="string">
  مصادقة الرمز المميز للفحص.
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
  افحص أيضًا الخدمات على مستوى النظام.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  رقِّ فحص الاتصال الافتراضي إلى فحص قراءة واخرج برمز غير صفري عند فشل فحص القراءة ذلك. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل `gateway status` متاحًا للتشخيص حتى عندما يكون إعداد CLI المحلي مفقودًا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانية المصادقة المرئية وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - فحوص التشخيص لا تُحدث تغييرات لمصادقة الجهاز للمرة الأولى: فهي تعيد استخدام رمز جهاز مخزّن مؤقتًا موجودًا عندما يتوفر، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs الخاصة بالمصادقة المكوَّنة لمصادقة الفحص عندما يكون ذلك ممكنًا.
    - إذا تعذر حل SecretRef مطلوب للمصادقة في مسار هذا الأمر، فسيبلغ `gateway status --json` عن `rpc.authWarning` عندما يفشل اتصال/مصادقة الفحص؛ مرر `--token`/`--password` صراحةً أو حل مصدر السر أولًا.
    - إذا نجح الفحص، تُكبت تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
    - استخدم `--require-rpc` في النصوص البرمجية والأتمتة عندما لا تكفي خدمة تستمع وتحتاج أيضًا إلى أن تكون استدعاءات RPC ذات نطاق القراءة سليمة.
    - يضيف `--deep` فحصًا بأفضل جهد لتثبيتات launchd/systemd/schtasks الإضافية. عند اكتشاف عدة خدمات شبيهة بـ Gateway، يطبع الإخراج البشري تلميحات تنظيف ويحذر من أن معظم الإعدادات يجب أن تشغّل Gateway واحدًا لكل جهاز.
    - يبلّغ `--deep` أيضًا عن تسليم حديث لإعادة تشغيل مشرف Gateway عندما تكون عملية الخدمة قد خرجت بنظافة لإعادة تشغيل بواسطة مشرف خارجي.
    - يتضمن الإخراج البشري مسار سجل الملف المحلول بالإضافة إلى لقطة مسارات/صلاحية إعداد CLI مقابل إعداد الخدمة للمساعدة في تشخيص انجراف ملف التعريف أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوص انجراف مصادقة Linux systemd">
    - في تثبيتات Linux systemd، تقرأ فحوص انجراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوص الانجراف مراجع SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة تشغيل مدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كاحتياطي).
    - إذا لم تكن مصادقة الرمز المميز نشطة فعليًا (`gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو وضع غير معيّن حيث يمكن أن تنتصر كلمة المرور ولا يمكن لأي مرشح رمز مميز أن ينتصر)، تتخطى فحوص انجراف الرمز المميز حل رمز الإعداد.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائمًا:

- Gateway البعيد المكوَّن لديك (إذا تم تعيينه)، و
- localhost (حلقة الرجوع) **حتى إذا كان البعيد مكوَّنًا**.

إذا مررت `--url`، يُضاف ذلك الهدف الصريح قبل كليهما. يوسم الإخراج البشري الأهداف كالتالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا كانت عدة Gateways قابلة للوصول، فإنه يطبعها كلها. تُدعم عدة Gateways عندما تستخدم ملفات تعريف/منافذ معزولة (مثل روبوت إنقاذ)، لكن معظم التثبيتات ما تزال تشغّل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="التفسير">
    - يعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلّغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع الفحص إثباته بشأن المصادقة. وهو منفصل عن قابلية الوصول.
    - يعني `Read probe: ok` أن استدعاءات RPC التفصيلية ذات نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - يعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC ذات نطاق القراءة محدودة. يُبلّغ عن هذا كقابلية وصول **متدهورة**، وليس فشلًا كاملًا.
    - يعني `Read probe: failed` بعد `Connect: ok` أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضًا قابلية وصول **متدهورة**، وليس Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة الجهاز المخزنة مؤقتًا الموجودة لكنه لا ينشئ هوية جهاز للمرة الأولى أو حالة إقران.
    - يكون رمز الخروج غير صفري فقط عندما لا يكون أي هدف مفحوص قابلًا للوصول.

  </Accordion>
  <Accordion title="إخراج JSON">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: هدف واحد على الأقل قبل اتصالًا لكنه لم يكمل تشخيصات RPC التفصيلية الكاملة.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف القابلة للوصول (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه كفائز نشط بهذا الترتيب: URL صريح، نفق SSH، البعيد المكوَّن، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` اختيارية.
    - `network`: تلميحات URL لـ local loopback/tailnet مشتقة من الإعداد الحالي وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلي المستخدم لمرور الفحص هذا.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلية الكاملة.
    - `scopeLimited`: فشل RPC التفصيلية بسبب نطاق مشغل مفقود.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عندما يكون متاحًا.
    - `scopes`: النطاقات الممنوحة المبلّغ عنها في `hello-ok` عندما تكون متاحة.
    - `capability`: تصنيف إمكانية المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ رجع الأمر إلى الفحوص المباشرة.
    - `multiple_gateways`: كان أكثر من هدف واحد قابلًا للوصول؛ هذا غير معتاد إلا إذا كنت تشغّل عن قصد ملفات تعريف معزولة، مثل روبوت إنقاذ.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مكوَّن لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب فقدان `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "البعيد عبر SSH" في تطبيق macOS إعادة توجيه منفذ محلي بحيث يصبح Gateway البعيد (الذي قد يكون مرتبطًا بحلقة الرجوع فقط) قابلًا للوصول عند `ws://127.0.0.1:<port>`.

مكافئ CLI:

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
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` بالإضافة إلى نطاق الشبكة الواسعة المكوَّن، إن وجد). تُتجاهل تلميحات TXT فقط.
</ParamField>

الإعداد (اختياري، يُستخدم كقيم افتراضية):

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
  URL WebSocket الخاص بـ Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway المميز.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  ميزانية المهلة.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  أساسًا لاستدعاءات RPC ذات نمط الوكيل التي تبث أحداثًا وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  إخراج JSON قابل للقراءة آليًا.
</ParamField>

<Note>
يجب أن يكون `--params` بصيغة JSON صالحة.
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

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة عبر ملف تنفيذي آخر، مثل
طبقة توافق مدير أسرار أو مساعد تشغيل كمستخدم. يتلقى المغلّف وسائط Gateway العادية ويكون
مسؤولًا في النهاية عن تنفيذ `openclaw` أو Node بتلك الوسائط.

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

يمكنك أيضًا تعيين المغلّف عبر البيئة. يتحقق `gateway install` من أن المسار
ملف تنفيذي، ويكتب المغلّف في `ProgramArguments` الخاصة بالخدمة، ويستمر في حفظ
`OPENCLAW_WRAPPER` في بيئة الخدمة لعمليات إعادة التثبيت القسرية والتحديثات وإصلاحات doctor
اللاحقة.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة مغلّف محفوظ، امسح `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="خيارات الأوامر">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="سلوك دورة الحياة">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل؛ في macOS، يعطّل `gateway stop` عن قصد LaunchAgent قبل إيقافه.
    - يطلب `gateway restart --safe` من Gateway الجاري تشغيله إجراء فحص مسبق لأعمال OpenClaw النشطة وتأجيل إعادة التشغيل حتى يتم تصريف تسليم الردود، والتشغيلات المضمّنة، وتشغيلات المهام. لا يمكن دمج `--safe` مع `--force` أو `--wait`.
    - يتجاوز `gateway restart --wait 30s` ميزانية تصريف إعادة التشغيل المكوَّنة لتلك الإعادة. الأرقام المجردة بالميلي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير مسمى.
    - يتخطى `gateway restart --force` تصريف العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغل قد فحص بالفعل عوائق المهام المدرجة ويريد إعادة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للاستخدام في النصوص البرمجية.

  </Accordion>
  <Accordion title="المصادقة ومراجع SecretRef وقت التثبيت">
    - عندما تتطلب مصادقة الرمز المميز رمزًا مميزًا ويكون `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل، لكنه لا يحفظ الرمز المميز المحلول في بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكان SecretRef للرمز المميز المُكوَّن غير محلول، يفشل التثبيت بإغلاق آمن بدلًا من حفظ نص صريح احتياطي.
    - لمصادقة كلمة المرور في `gateway run`، فضّل استخدام `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` مدعومًا بـ SecretRef بدلًا من `--password` المضمّنة.
    - في وضع المصادقة المستنتج، لا يخفف `OPENCLAW_GATEWAY_PASSWORD` الخاص بالصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعداد) عند تثبيت خدمة مُدارة.
    - إذا تم تكوين كل من `gateway.auth.token` و`gateway.auth.password` وكان `gateway.auth.mode` غير معيّن، يتم حظر التثبيت حتى يتم تعيين الوضع صراحة.

  </Accordion>
</AccordionGroup>

## اكتشاف Gateways (Bonjour)

يفحص `gateway discover` إشارات Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): اختر نطاقًا (مثال: `openclaw.internal.`) واضبط DNS مقسمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

تعلن الإشارة فقط Gateways التي تم تمكين اكتشاف Bonjour فيها (افتراضيًا).

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (اختياري؛ يستخدم العملاء أهداف SSH الافتراضية إلى `22` عند غيابه)
- `tailnetDns` (اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` (TLS مفعّل + بصمة الشهادة)
- `cliPath` (تلميح التثبيت البعيد المكتوب إلى المنطقة واسعة النطاق)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلة لكل أمر (تصفح/حل).
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات قابلة للقراءة آليًا (كما يعطل التنسيق/المؤشر الدوار).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` بالإضافة إلى النطاق واسع النطاق المُكوَّن عند تمكين أحدها.
- يتم اشتقاق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة المحلولة، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS ضمن `local.`، لا يتم بث `sshPort` و`cliPath` إلا عندما يكون `discovery.mdns.mode` هو `full`. لا يزال DNS-SD واسع النطاق يكتب `cliPath`؛ ويظل `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
