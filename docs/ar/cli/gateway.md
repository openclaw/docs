---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateways عبر Bonjour ‏(DNS-SD المحلي وواسع النطاق)
sidebarTitle: Gateway
summary: CLI لـ Gateway في OpenClaw (`openclaw gateway`) — تشغيل Gateways والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

يُعد Gateway خادم WebSocket الخاص بـ OpenClaw (القنوات، والعقد، والجلسات، وhooks). الأوامر الفرعية في هذه الصفحة تأتي تحت `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي وDNS-SD واسع النطاق.
  </Card>
  <Card title="نظرة عامة على الاكتشاف" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن Gateways ويعثر عليها.
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

الاسم البديل للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - افتراضيًا، يرفض Gateway البدء ما لم يكن `gateway.mode=local` مضبوطًا في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` لتشغيلات التطوير/التشغيلات المخصصة.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقودًا، فاعتبر ذلك تكوينًا معطوبًا أو تم العبث به وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا وكانت `gateway.mode` مفقودة، فإن Gateway يعامل ذلك على أنه ضرر مريب في التكوين ويرفض "تخمين الوضع المحلي" نيابةً عنك.
    - يُحظر الربط خارج loopback من دون مصادقة (حاجز أمان).
    - يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند السماح بذلك (تكون `commands.restart` مفعلة افتراضيًا؛ اضبط `commands.restart: false` لمنع إعادة التشغيل اليدوية، مع بقاء gateway tool/config apply/update مسموحًا).
    - تؤدي معالجات `SIGINT`/`SIGTERM` إلى إيقاف عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا كنت تغلف CLI بواجهة TUI أو بإدخال raw-mode، فاستعد الطرفية قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من التكوين/البيئة؛ وعادةً تكون `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  وضع ربط المستمع.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  تجاوز وضع المصادقة.
</ParamField>
<ParamField path="--token <token>" type="string">
  تجاوز الرمز المميز (ويضبط أيضًا `OPENCLAW_GATEWAY_TOKEN` للعملية).
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
  إعادة ضبط تكوين serve/funnel في Tailscale عند الإيقاف.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway بدون `gateway.mode=local` في التكوين. يتجاوز حاجز بدء التشغيل لأغراض bootstrap المؤقتة/التطويرية فقط؛ ولا يكتب ملف التكوين أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء تكوين تطوير + مساحة عمل إذا كانا مفقودين (يتخطى BOOTSTRAP.md).
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
  عرض سجلات الواجهة الخلفية لـ CLI فقط في وحدة التحكم (وتمكين stdout/stderr).
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

<Warning>
قد تظهر `--password` المضمنة في قوائم العمليات المحلية. يُفضَّل استخدام `--password-file` أو متغيرات البيئة أو `gateway.auth.password` المعتمدة على SecretRef.
</Warning>

### توصيف بدء التشغيل

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيت المراحل أثناء بدء تشغيل Gateway.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء تشغيل Gateway. يسجل القياس أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات trace الخاصة ببدء التشغيل.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: قابل للقراءة البشرية (وملوّن في TTY).
    - `--json`: JSON قابل للقراءة آليًا (من دون تنسيق/مؤشر دوران).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الإبقاء على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway.
    - `--token <token>`: الرمز المميز لـ Gateway.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (لاستدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند تعيين `--url`، لا يعود CLI إلى بيانات الاعتماد الموجودة في التكوين أو البيئة. مرّر `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

تمثل نقطة النهاية HTTP `/healthz` فحصًا للحيوية: فهي تعيد استجابة بمجرد أن يتمكن الخادم من الرد على HTTP. أما نقطة النهاية HTTP `/readyz` فهي أكثر صرامة وتبقى باللون الأحمر بينما لا تزال sidecars الخاصة ببدء التشغيل أو القنوات أو hooks المهيأة في طور الاستقرار.

### `gateway usage-cost`

جلب ملخصات usage-cost من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  عدد الأيام المطلوب تضمينها.
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
  الحد الأقصى لعدد الأحداث الحديثة المطلوب تضمينها (الحد الأقصى `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث التي تأتي فقط بعد رقم تسلسل تشخيصي.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة stability bundle محفوظ بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث bundle ضمن دليل الحالة، أو مرّر مسار JSON لـ bundle مباشرة.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip تشخيصي قابل للمشاركة للدعم بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك bundle">
    - تحتفظ السجلات ببيانات تشغيلية وصفية: أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة queue/session، وأسماء القنوات/Plugins، وملخصات الجلسات المحجوبة. وهي لا تحتفظ بنصوص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو Cookies، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند الخروج القاتل لـ Gateway، أو مهلات الإيقاف، أو إخفاقات بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث bundle باستخدام `openclaw gateway stability --bundle latest`؛ كما تنطبق `--limit` و`--type` و`--since-seq` على مخرجات bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip تشخيصي محليًا مصممًا لإرفاقه بتقارير الأخطاء. للاطلاع على نموذج الخصوصية ومحتويات bundle، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار zip الناتج. تكون القيمة الافتراضية تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجلات المنقحة المطلوب تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجلات المطلوب فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway من أجل لقطة health.
</ParamField>
<ParamField path="--token <token>" type="string">
  الرمز المميز لـ Gateway من أجل لقطة health.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway من أجل لقطة health.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلة لقطة status/health.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  تخطي البحث عن stability bundle محفوظ.
</ParamField>
<ParamField path="--json" type="boolean">
  طباعة المسار المكتوب، والحجم، والبيان الوصفي كـ JSON.
</ParamField>

يحتوي التصدير على بيان وصفي، وملخص Markdown، وشكل التكوين، وتفاصيل التكوين المنقحة، وملخصات السجلات المنقحة، ولقطات status/health المنقحة لـ Gateway، وأحدث stability bundle عند وجوده.

وهو مخصص للمشاركة. إذ يحتفظ بالتفاصيل التشغيلية التي تساعد في تصحيح الأخطاء، مثل حقول سجلات OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المهيأة، والمنافذ، ومعرّفات Plugins، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المحجوبة. كما يحذف أو يحجب نصوص الدردشة، وأجسام Webhooks، ومخرجات الأدوات، وبيانات الاعتماد، وCookies، ومعرّفات الحسابات/الرسائل، ونصوص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. وعندما تبدو رسالة بأسلوب LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بحقيقة حذف رسالة مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway ‏(`launchd`/`systemd`/`schtasks`) بالإضافة إلى فحص اختياري لقدرات الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  إضافة هدف فحص صريح. ولا يزال يتم فحص الهدف البعيد المهيأ + localhost.
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
  ترقية فحص الاتصال الافتراضي إلى فحص قراءة والخروج بحالة غير صفرية عند فشل فحص القراءة هذا. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يبقى `gateway status` متاحًا لأغراض التشخيص حتى عندما يكون تكوين CLI المحلي مفقودًا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وقدرة المصادقة الظاهرة وقت المصافحة. لكنه لا يثبت عمليات القراءة/الكتابة/الإدارة.
    - لا تغيّر الفحوصات التشخيصية شيئًا عند مصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مميز مخزّن مؤقتًا إذا كان موجودًا، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل اقتران جهاز للقراءة فقط لمجرد فحص الحالة.
    - يحل `gateway status` قيم SecretRef المهيأة للمصادقة عند الفحص متى أمكن.
    - إذا كانت قيمة SecretRef مطلوبة للمصادقة غير محلولة في مسار هذا الأمر، فإن `gateway status --json` يبلغ عن `rpc.authWarning` عند فشل اتصال/مصادقة الفحص؛ مرّر `--token`/`--password` صراحةً أو أصلح مصدر السر أولًا.
    - إذا نجح الفحص، تُخفى تحذيرات auth-ref غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
    - استخدم `--require-rpc` في البرامج النصية وعمليات الأتمتة عندما لا يكفي وجود خدمة تستمع وتحتاج أيضًا إلى أن تكون استدعاءات RPC ذات نطاق القراءة سليمة.
    - يضيف `--deep` فحصًا بأفضل جهد لخدمات launchd/systemd/schtasks الإضافية. وعند اكتشاف عدة خدمات شبيهة بـ Gateway، تطبع المخرجات البشرية تلميحات للتنظيف وتحذّر من أن معظم الإعدادات يجب أن تشغّل Gateway واحدًا لكل جهاز.
    - تتضمن المخرجات البشرية مسار سجل الملفات بعد حله بالإضافة إلى لقطة لمسارات وصلاحية تكوين CLI مقابل الخدمة للمساعدة في تشخيص انجراف الملف الشخصي أو state-dir.

  </Accordion>
  <Accordion title="فحوصات انجراف المصادقة لـ systemd على Linux">
    - في تثبيتات systemd على Linux، تقرأ فحوصات انجراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات بين علامتَي اقتباس، والملفات المتعددة، والملفات الاختيارية ذات البادئة `-`).
    - تحل فحوصات الانجراف قيم SecretRef الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أوامر الخدمة أولًا، ثم الرجوع إلى بيئة العملية).
    - إذا لم تكن مصادقة الرمز المميز مفعلة فعليًا (مع `gateway.auth.mode` صريح بقيمة `password` أو `none` أو `trusted-proxy`، أو مع وضع غير مضبوط حيث قد تفوز كلمة المرور ولا يوجد مرشح رمز مميز يمكن أن يفوز)، فإن فحوصات انجراف الرمز المميز تتخطى حل رمز التكوين المميز.

  </Accordion>
</AccordionGroup>

### `gateway probe`

يُعد `gateway probe` أمر "تصحيح كل شيء". فهو يفحص دائمًا:

- Gateway البعيد المهيأ لديك (إن وُجد)، و
- localhost ‏(local loopback) **حتى لو كان البعيد مهيأ**.

إذا مرّرت `--url`، فسيُضاف هذا الهدف الصريح قبل الاثنين. وتضع المخرجات البشرية التسميات التالية على الأهداف:

- `URL (صريح)`
- `Remote (مهيأ)` أو `Remote (مهيأ، غير نشط)`
- `local loopback`

<Note>
إذا أمكن الوصول إلى عدة Gateways، فسيطبعها كلها. تُدعَم تعدد Gateways عند استخدام ملفات تعريف/منافذ معزولة (مثل rescue bot)، لكن معظم التثبيتات لا تزال تشغّل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="التفسير">
    - تعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - تشير `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` إلى ما استطاع الفحص إثباته بخصوص المصادقة. وهي منفصلة عن إمكانية الوصول.
    - تعني `Read probe: ok` أن استدعاءات RPC التفصيلية ذات نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - تعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC ذات نطاق القراءة كانت محدودة. ويُبلّغ عن ذلك على أنه إمكانية وصول **متدهورة**، وليس فشلًا كاملًا.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة الجهاز المخزنة مؤقتًا، لكنه لا ينشئ هوية جهاز لأول مرة أو حالة اقتران.
    - تكون قيمة رمز الخروج غير صفرية فقط عندما لا يكون أي هدف تم فحصه قابلًا للوصول.

  </Accordion>
  <Accordion title="مخرجات JSON">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل يمكن الوصول إليه.
    - `degraded`: كان لدى هدف واحد على الأقل RPC تفصيلية محدودة بالنطاق.
    - `capability`: أفضل قدرة شوهدت عبر الأهداف القابلة للوصول (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
    - `primaryTargetId`: أفضل هدف يُعامل كفائز نشط بهذا الترتيب: URL الصريح، ثم SSH tunnel، ثم البعيد المهيأ، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد تحتوي على `code` و`message` و`targetIds` الاختيارية.
    - `network`: تلميحات URL الخاصة بـ local loopback وtailnet والمشتقة من التكوين الحالي وشبكة المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلية المستخدمة في تمريرة الفحص هذه.

    لكل هدف (`targets[].connect`):

    - `ok`: إمكانية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح كامل لـ RPC التفصيلية.
    - `scopeLimited`: فشلت RPC التفصيلية بسبب غياب نطاق المشغّل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة والمبلّغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف قدرة المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد SSH tunnel؛ وعاد الأمر إلى الفحوصات المباشرة.
    - `multiple_gateways`: أمكن الوصول إلى أكثر من هدف واحد؛ وهذا غير معتاد ما لم تكن تشغّل عمدًا ملفات تعريف معزولة، مثل rescue bot.
    - `auth_secretref_unresolved`: تعذر حل قيمة SecretRef مهيأة للمصادقة لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب غياب `operator.read`.

  </Accordion>
</AccordionGroup>

#### الوصول البعيد عبر SSH ‏(تكافؤ تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS إعادة توجيه منفذ محلي بحيث يصبح Gateway البعيد (الذي قد يكون مربوطًا بـ loopback فقط) قابلًا للوصول على `ws://127.0.0.1:<port>`.

المكافئ في CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` أو `user@host:port` (المنفذ الافتراضي `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ملف الهوية.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  اختيار أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف بعد حلها (`local.` بالإضافة إلى النطاق واسع النطاق المهيأ، إن وجد). يتم تجاهل التلميحات القائمة على TXT فقط.
</ParamField>

التكوين (اختياري، ويُستخدم كقيم افتراضية):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

مساعد RPC منخفض المستوى.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  سلسلة كائن JSON للمعلمات.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  الرمز المميز لـ Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  ميزانية المهلة.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  مخصص أساسًا لاستدعاءات RPC على نمط الوكيل التي تبث أحداثًا وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات JSON قابلة للقراءة آليًا.
</ParamField>

<Note>
يجب أن تكون `--params` JSON صالحًا.
</Note>

## إدارة خدمة Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="خيارات الأوامر">
    - `gateway status`: ‏`--url` و`--token` و`--password` و`--timeout` و`--no-probe` و`--require-rpc` و`--deep` و`--json`
    - `gateway install`: ‏`--port` و`--runtime <node|bun>` و`--token` و`--force` و`--json`
    - `gateway uninstall|start|stop|restart`: ‏`--json`

  </Accordion>
  <Accordion title="ملاحظات تثبيت الخدمة ودورة الحياة">
    - يدعم `gateway install` الخيارات `--port` و`--runtime` و`--token` و`--force` و`--json`.
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل؛ ففي macOS، يقوم `gateway stop` عمدًا بتعطيل LaunchAgent قبل إيقافه.
    - عندما تتطلب مصادقة الرمز المميز وجود رمز مميز وكانت `gateway.auth.token` مُدارة بواسطة SecretRef، فإن `gateway install` يتحقق من أن SecretRef قابلة للحل، لكنه لا يحفظ الرمز المميز المحلول داخل بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكانت قيمة SecretRef الخاصة بالرمز المميز في التكوين غير محلولة، يفشل التثبيت بشكل مغلق بدلًا من حفظ نص صريح احتياطي.
    - بالنسبة إلى مصادقة كلمة المرور في `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المعتمدة على SecretRef بدلًا من `--password` المضمنة.
    - في وضع المصادقة المستنتج، لا يؤدي `OPENCLAW_GATEWAY_PASSWORD` الخاص بالصدفة فقط إلى تخفيف متطلبات رمز التثبيت المميز؛ استخدم تكوينًا دائمًا (`gateway.auth.password` أو `env` في التكوين) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكانت `gateway.auth.mode` غير مضبوطة، فسيُحظر التثبيت حتى يتم ضبط الوضع صراحةً.
    - تقبل أوامر دورة الحياة الخيار `--json` لأغراض البرمجة النصية.

  </Accordion>
</AccordionGroup>

## اكتشاف Gateways ‏(Bonjour)

يفحص `gateway discover` إشارات Gateway ‏(`_openclaw-gw._tcp`).

- Multicast DNS-SD: ‏`local.`
- Unicast DNS-SD ‏(Wide-Area Bonjour): اختر نطاقًا (مثل: `openclaw.internal.`) وأعد split DNS + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

لن تعلن عن الإشارة إلا Gateways التي فُعّل فيها اكتشاف Bonjour (افتراضيًا).

تتضمن سجلات الاكتشاف واسع النطاق (TXT) ما يلي:

- `role` ‏(تلميح دور Gateway)
- `transport` ‏(تلميح النقل، مثل `gateway`)
- `gatewayPort` ‏(منفذ WebSocket، وعادةً `18789`)
- `sshPort` ‏(اختياري؛ تستخدم العملاء `22` افتراضيًا لأهداف SSH عند غيابه)
- `tailnetDns` ‏(اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` ‏(تمكين TLS + بصمة الشهادة)
- `cliPath` ‏(تلميح التثبيت البعيد المكتوب إلى المنطقة واسعة النطاق)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  المهلة لكل أمر (browse/resolve).
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات قابلة للقراءة آليًا (وتعطّل أيضًا التنسيق/مؤشر الدوران).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI ‏`local.` بالإضافة إلى النطاق واسع النطاق المهيأ عندما يكون مفعّلًا.
- تُشتق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة بعد حلها، وليس من التلميحات القائمة على TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS الخاص بـ `local.`، لا يتم بث `sshPort` و`cliPath` إلا عندما يكون `discovery.mdns.mode` مضبوطًا على `full`. ومع ذلك، يظل Wide-Area DNS-SD يكتب `cliPath`؛ كما يظل `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
