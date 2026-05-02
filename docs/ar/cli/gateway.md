---
read_when:
    - تشغيل Gateway عبر CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف بوابات Gateway عبر Bonjour (DNS-SD المحلي والواسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل بوابات Gateway والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العُقد، الجلسات، الخطافات). الأوامر الفرعية في هذه الصفحة تقع ضمن `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي + DNS-SD واسع النطاق.
  </Card>
  <Card title="نظرة عامة على الاكتشاف" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن البوابات ويعثر عليها.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration">
    مفاتيح تكوين Gateway ذات المستوى الأعلى.
  </Card>
</CardGroup>

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

الاسم المستعار للتشغيل في المقدمة:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - افتراضيًا، يرفض Gateway البدء ما لم يتم تعيين `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المخصصة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كملف تكوين معطوب أو مستبدل وأصلحه بدل افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقودًا، يتعامل Gateway مع ذلك كضرر مريب في التكوين ويرفض "تخمين المحلي" نيابةً عنك.
    - يتم حظر الربط خارج loopback من دون مصادقة (حاجز أمان).
    - يشغّل `SIGUSR1` إعادة تشغيل داخل العملية عند التصريح بذلك (`commands.restart` مفعّل افتراضيًا؛ عيّن `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء تطبيق/تحديث أداة Gateway/التكوين مسموحًا به).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا كنت تغلف CLI باستخدام TUI أو إدخال raw-mode، فأعد الطرفية إلى حالتها قبل الخروج.

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
  قراءة كلمة مرور Gateway من ملف.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  كشف Gateway عبر Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  إعادة تعيين تكوين serve/funnel في Tailscale عند إيقاف التشغيل.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway من دون `gateway.mode=local` في التكوين. يتجاوز حاجز بدء التشغيل للتمهيد المخصص/التطويري فقط؛ ولا يكتب ملف التكوين أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء تكوين تطوير + مساحة عمل إذا كانا مفقودين (يتجاوز BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة تعيين تكوين التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  إنهاء أي مستمع موجود على المنفذ المحدد قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  سجلات تفصيلية.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  عرض سجلات الواجهة الخلفية لـ CLI فقط في وحدة التحكم (وتفعيل stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  نمط سجل WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  اسم مستعار لـ `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  تسجيل أحداث بث النموذج الخام إلى jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسار jsonl للبث الخام.
</ParamField>

<Warning>
يمكن أن تظهر `--password` المضمنة في قوائم العمليات المحلية. فضّل `--password-file` أو متغيرات البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### توصيف بدء التشغيل

- عيّن `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جداول بحث Plugin للفهرس المثبت، وسجل البيان، وتخطيط بدء التشغيل، وعمل خريطة المالكين.
- عيّن `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة مخطط زمني لتشخيصات بدء التشغيل بصيغة JSONL بأفضل جهد لأطر QA الخارجية. يمكنك أيضًا تفعيل العلامة باستخدام `diagnostics.flags: ["timeline"]` في التكوين؛ ولا يزال المسار مقدمًا عبر البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء Gateway. يسجل الاختبار المعياري أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جدول بحث Plugin.

## الاستعلام عن Gateway قيد التشغيل

تستخدم كل أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: قابل للقراءة البشرية (ملون في TTY).
    - `--json`: JSON قابل للقراءة آليًا (بلا تنسيق/مؤشر تحميل).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL الخاص بـ WebSocket لـ Gateway.
    - `--token <token>`: رمز Gateway المميز.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند تعيين `--url`، لا يعود CLI إلى التكوين أو بيانات اعتماد البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطة نهاية HTTP ‏`/healthz` هي فحص حيوية: تعود بمجرد أن يصبح الخادم قادرًا على الرد عبر HTTP. نقطة نهاية HTTP ‏`/readyz` أكثر صرامة وتبقى حمراء بينما لا تزال ملحقات Plugin الجانبية لبدء التشغيل أو القنوات أو الخطافات المكوّنة تستقر. تتضمن استجابات الجاهزية التفصيلية المحلية أو المصادق عليها كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة أنوية CPU، وعلامة `degraded`.

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
  التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث بعد رقم تسلسل تشخيصي فقط.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدل استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON للحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip قابل للمشاركة لتشخيصات الدعم بدل طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزمة">
    - تحتفظ السجلات ببيانات وصفية تشغيلية: أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقحة. لا تحتفظ بنص المحادثة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. عيّن `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند مخارج Gateway الفادحة، ومهل إيقاف التشغيل، وفشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw لقطة التشخيص نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ تنطبق أيضًا `--limit` و`--type` و`--since-seq` على مخرجات الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip محليًا للتشخيصات مصممًا لإرفاقه بتقارير الأخطاء. للاطلاع على نموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip للإخراج. القيمة الافتراضية هي تصدير دعم ضمن دليل الحالة.
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
  رمز Gateway المميز من أجل لقطة الصحة.
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
  طباعة المسار المكتوب والحجم والبيان بصيغة JSON.
</ParamField>

يحتوي التصدير على بيان، وملخص Markdown، وشكل التكوين، وتفاصيل التكوين المنقحة، وملخصات السجلات المنقحة، ولقطات حالة/صحة Gateway المنقحة، وأحدث حزمة استقرار عند وجود واحدة.

الغرض منه أن يكون قابلًا للمشاركة. يحتفظ بتفاصيل تشغيلية تساعد في تصحيح الأخطاء، مثل حقول سجلات OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المكوّنة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجلات التشغيلية المنقحة. يحذف أو ينقح نص المحادثة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسالة، ونص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/محادثة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت بالإضافة إلى عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway ‏(launchd/systemd/schtasks) بالإضافة إلى فحص اختياري لقدرة الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  إضافة هدف فحص صريح. لا تزال الوجهة البعيدة المكوّنة + localhost تُفحصان.
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
  تخطي فحص الاتصال (عرض الخدمة فقط).
</ParamField>
<ParamField path="--deep" type="boolean">
  فحص الخدمات على مستوى النظام أيضًا.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ترقية فحص الاتصال الافتراضي إلى فحص قراءة والخروج بقيمة غير صفرية عند فشل فحص القراءة هذا. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل `gateway status` متاحًا للتشخيص حتى عندما يكون إعداد CLI المحلي مفقودًا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانية المصادقة المرئية وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - مجسات التشخيص غير معدِّلة لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخزن مؤقتًا موجودًا عند توفره، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد فحص الحالة.
    - يحل `gateway status` مراجع SecretRefs للمصادقة المكوّنة لمصادقة المجس متى أمكن.
    - إذا تعذر حل SecretRef مطلوب للمصادقة في مسار هذا الأمر، فسيبلغ `gateway status --json` عن `rpc.authWarning` عندما يفشل اتصال المجس/المصادقة؛ مرر `--token`/`--password` صراحة أو حل مصدر السر أولًا.
    - إذا نجح المجس، تُخفى تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكون خدمة تستمع كافية وتحتاج أيضًا إلى أن تكون استدعاءات RPC بنطاق القراءة سليمة.
    - يضيف `--deep` فحصًا بأفضل جهد لتثبيتات launchd/systemd/schtasks الإضافية. عند اكتشاف عدة خدمات شبيهة بـ Gateway، تطبع المخرجات البشرية تلميحات تنظيف وتحذر من أن معظم الإعدادات يجب أن تشغل Gateway واحدًا لكل جهاز.
    - تتضمن المخرجات البشرية مسار سجل الملف المحلول بالإضافة إلى لقطة لمسارات/صلاحية إعدادات CLI مقابل الخدمة للمساعدة في تشخيص انجراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوصات انجراف مصادقة systemd على Linux">
    - في تثبيتات systemd على Linux، تقرأ فحوصات انجراف مصادقة الخدمة كلًا من قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوصات الانجراف مراجع SecretRefs لـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كخيار احتياطي).
    - إذا لم تكن مصادقة الرمز نشطة فعليًا (وضع `gateway.auth.mode` الصريح هو `password`/`none`/`trusted-proxy`، أو الوضع غير معين حيث يمكن لكلمة المرور أن تفوز ولا يوجد مرشح رمز يمكنه الفوز)، تتخطى فحوصات انجراف الرمز حل رمز الإعدادات.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائمًا:

- Gateway البعيد المكوّن لديك (إذا كان معينًا)، و
- localhost (loopback) **حتى إذا كان البعيد مكوّنًا**.

إذا مررت `--url`، يضاف ذلك الهدف الصريح قبل الاثنين. تسمي المخرجات البشرية الأهداف كالآتي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا أمكن الوصول إلى عدة Gateways، فإنه يطبعها كلها. تُدعم Gateways المتعددة عند استخدام ملفات شخصية/منافذ معزولة (مثل بوت إنقاذ)، لكن معظم التثبيتات لا تزال تشغل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="التفسير">
    - يعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع المجس إثباته بشأن المصادقة. وهو منفصل عن قابلية الوصول.
    - يعني `Read probe: ok` أن استدعاءات RPC التفصيلية بنطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - يعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC بنطاق القراءة محدود. يُبلغ عن ذلك كقابلية وصول **متدهورة**، وليس فشلًا كاملًا.
    - يعني `Read probe: failed` بعد `Connect: ok` أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضًا قابلية وصول **متدهورة**، وليس Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد المجس استخدام مصادقة الجهاز المخزنة مؤقتًا الموجودة لكنه لا ينشئ هوية جهاز لأول مرة أو حالة إقران.
    - يكون رمز الخروج غير صفري فقط عندما لا يكون أي هدف مفحوص قابلًا للوصول.

  </Accordion>
  <Accordion title="مخرجات JSON">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: هدف واحد على الأقل قبل اتصالًا لكنه لم يكمل تشخيصات RPC التفصيلية الكاملة.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف القابلة للوصول (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه باعتباره الفائز النشط بهذا الترتيب: URL الصريح، نفق SSH، البعيد المكوّن، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` الاختيارية.
    - `network`: تلميحات URL لـ local loopback/tailnet مشتقة من الإعدادات الحالية وشبكة المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلي المستخدم في تمريرة المجس هذه.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب فقدان نطاق المشغل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف إمكانية المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ عاد الأمر إلى المجسات المباشرة.
    - `multiple_gateways`: كان أكثر من هدف واحد قابلًا للوصول؛ هذا غير معتاد إلا إذا كنت تشغل ملفات شخصية معزولة عمدًا، مثل بوت إنقاذ.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مكوّن لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن مجس القراءة كان محدودًا بسبب فقدان `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS إعادة توجيه منفذ محليًا بحيث يصبح Gateway البعيد (الذي قد يكون مربوطًا بالحلقة الراجعة فقط) قابلًا للوصول عند `ws://127.0.0.1:<port>`.

مكافئ CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` أو `user@host:port` (القيمة الافتراضية للمنفذ هي `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ملف الهوية.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` بالإضافة إلى نطاق واسع النطاق المكوّن، إن وجد). تُتجاهل تلميحات TXT فقط.
</ParamField>

الإعدادات (اختيارية، تُستخدم كقيم افتراضية):

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
  URL WebSocket لـ Gateway.
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
  أساسًا لاستدعاءات RPC بأسلوب الوكيل التي تبث أحداثًا وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات JSON قابلة للقراءة آليًا.
</ParamField>

<Note>
يجب أن يكون `--params` JSON صالحًا.
</Note>

## إدارة خدمة Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### التثبيت باستخدام مغلف

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة عبر ملف تنفيذي آخر، مثل حشوة مدير أسرار أو مساعد تشغيل كمستخدم آخر. يتلقى المغلف وسائط Gateway العادية ويكون مسؤولًا في النهاية عن تنفيذ `openclaw` أو Node بهذه الوسائط.

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

يمكنك أيضًا تعيين المغلف عبر البيئة. يتحقق `gateway install` من أن المسار ملف تنفيذي، ويكتب المغلف في `ProgramArguments` للخدمة، ويثبت `OPENCLAW_WRAPPER` في بيئة الخدمة لإعادة التثبيت القسرية والتحديثات وإصلاحات doctor لاحقًا.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة مغلف مثبت، امسح `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="خيارات الأمر">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="سلوك دورة الحياة">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل؛ على macOS، يعطل `gateway stop` عمدًا LaunchAgent قبل إيقافه.
    - يتجاوز `gateway restart --wait 30s` ميزانية تصريف إعادة التشغيل المكوّنة لتلك الإعادة. الأرقام المجردة بالميلي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير مسمى.
    - يتخطى `gateway restart --force` تصريف العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغل قد فحص بالفعل معيقات المهام المدرجة ويريد عودة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للسكربتات.

  </Accordion>
  <Accordion title="المصادقة وSecretRefs وقت التثبيت">
    - عندما تتطلب مصادقة الرمز رمزًا ويكون `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق `gateway install` من إمكانية حل SecretRef لكنه لا يثبت الرمز المحلول في بيانات بيئة الخدمة.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يفشل التثبيت بشكل مغلق بدلًا من تثبيت نص عادي احتياطي.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` مدعومًا بـ SecretRef بدلًا من `--password` مضمنة.
    - في وضع المصادقة المستنتج، لا تخفف `OPENCLAW_GATEWAY_PASSWORD` الموجودة في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادات دائمة (`gateway.auth.password` أو `env` في الإعدادات) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معين، يُحظر التثبيت حتى يتم تعيين الوضع صراحة.

  </Accordion>
</AccordionGroup>

## اكتشاف Gateways (Bonjour)

يفحص `gateway discover` منارات Gateway (`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Bonjour واسع النطاق): اختر نطاقًا (مثال: `openclaw.internal.`) وأعد DNS منقسمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

تعلن المنارة فقط Gateways التي تم تمكين اكتشاف Bonjour فيها (افتراضيًا).

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (اختياري؛ يعيّن العملاء أهداف SSH افتراضيًا إلى `22` عند غيابه)
- `tailnetDns` (اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` (TLS ممكّن + بصمة الشهادة)
- `cliPath` (تلميح تثبيت بعيد مكتوب إلى المنطقة واسعة النطاق)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلة لكل أمر (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  إخراج قابل للقراءة آليًا (يعطّل أيضًا التنسيق ومؤشر التحميل).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- تفحص CLI النطاق `local.` بالإضافة إلى نطاق المنطقة الواسعة المُكوَّن عند تمكينه.
- يُشتق `wsUrl` في إخراج JSON من نقطة نهاية الخدمة التي جرى حلّها، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- في `local.` mDNS، لا يُبث `sshPort` و`cliPath` إلا عندما تكون قيمة `discovery.mdns.mode` هي `full`. لا يزال DNS-SD للمنطقة الواسعة يكتب `cliPath`؛ ويظل `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
