---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateway عبر Bonjour (DNS-SD المحلي + DNS-SD واسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل بوابات Gateway والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-05-04T18:23:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 310867c59148577f2e8ce6f708da6bce936e09243ce7fbe5daeb453c6b3b370d
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العقد، الجلسات، الخطافات). توجد الأوامر الفرعية في هذه الصفحة ضمن `openclaw gateway …`.

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

اسم مستعار للتشغيل في المقدمة:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - افتراضيًا، يرفض Gateway البدء ما لم يتم تعيين `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المخصصة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كتكوين معطوب أو مستبدل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقودًا، يتعامل Gateway مع ذلك كضرر مريب في التكوين ويرفض أن "يخمن المحلي" نيابةً عنك.
    - الارتباط بما يتجاوز loopback دون مصادقة محظور (حاجز أمان).
    - يطلق `SIGUSR1` إعادة تشغيل داخل العملية عند التفويض (`commands.restart` مفعّل افتراضيًا؛ عيّن `commands.restart: false` لمنع إعادة التشغيل اليدوية، بينما تظل أداة/تكوين Gateway وعمليات التطبيق/التحديث مسموحة).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI بواجهة TUI أو إدخال raw-mode، فأعد الطرفية إلى حالتها قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من التكوين/البيئة؛ عادةً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  وضع ارتباط المستمع.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  تجاوز وضع المصادقة.
</ParamField>
<ParamField path="--token <token>" type="string">
  تجاوز الرمز المميز (ويعيّن أيضًا `OPENCLAW_GATEWAY_TOKEN` للعملية).
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
  السماح ببدء Gateway دون `gateway.mode=local` في التكوين. يتجاوز حاجز بدء التشغيل للتمهيد المخصص/التطويري فقط؛ ولا يكتب ملف التكوين أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء تكوين تطوير + مساحة عمل إذا كانا مفقودين (يتخطى BOOTSTRAP.md).
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
  نمط سجل Websocket.
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

يطلب `openclaw gateway restart --safe` من Gateway الجاري تنفيذ فحص مسبق لعمل OpenClaw النشط قبل إعادة التشغيل. إذا كانت عمليات مصطفة، أو تسليم ردود، أو تشغيلات مضمنة، أو تشغيلات مهام نشطة، يبلّغ Gateway عن العوائق، ويدمج طلبات إعادة التشغيل الآمنة المكررة، ويعيد التشغيل بمجرد انتهاء العمل النشط. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي للتوافق. استخدم `--force` فقط عندما تريد صراحةً مسار التجاوز الفوري.

<Warning>
يمكن أن تظهر `--password` المضمنة في قوائم العمليات المحلية. فضّل `--password-file` أو البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### تحليل أداء بدء التشغيل

- عيّن `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء تشغيل Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جدول بحث Plugin للفهرس المثبت، وسجل البيان، وتخطيط بدء التشغيل، وعمل owner-map.
- عيّن `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة مخطط زمني لتشخيصات بدء التشغيل بصيغة JSONL بأفضل جهد لأدوات اختبار QA الخارجية. يمكنك أيضًا تفعيل العلامة باستخدام `diagnostics.flags: ["timeline"]` في التكوين؛ يظل المسار مقدمًا عبر البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء تشغيل Gateway. يسجل القياس أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جدول بحث Plugin.

## الاستعلام عن Gateway قيد التشغيل

تستخدم كل أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: قابل للقراءة البشرية (ملون في TTY).
    - `--json`: JSON قابل للقراءة آليًا (دون تنسيق/مؤشر دوران).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway.
    - `--token <token>`: رمز Gateway المميز.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند تعيين `--url`، لا تعود CLI إلى بيانات اعتماد التكوين أو البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطة نهاية HTTP `/healthz` هي فحص حيوية: تعود بمجرد أن يتمكن الخادم من الرد على HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتبقى حمراء بينما لا تزال ملحقات Plugin الجانبية عند بدء التشغيل، أو القنوات، أو الخطافات المكوّنة في طور الاستقرار. تتضمن استجابات الجاهزية المحلية أو المصادق عليها المفصلة كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة أنوية CPU، وعلامة `degraded`.

### `gateway usage-cost`

جلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  عدد الأيام المطلوب تضمينها.
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
  الحد الأقصى لعدد الأحداث الأخيرة المطلوب تضمينها (الحد الأقصى `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث التي تأتي بعد رقم تسلسل تشخيصي فقط.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة تحت دليل الحالة، أو مرّر مسار JSON لحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات دعم قابلة للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزمة">
    - تحتفظ السجلات ببيانات تعريف تشغيلية: أسماء الأحداث، الأعداد، أحجام البايت، قراءات الذاكرة، حالة الطابور/الجلسة، أسماء القنوات/Plugin، وملخصات جلسات منقحة. لا تحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلب أو الاستجابة الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرفات الجلسات الخام. عيّن `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند مخارج Gateway القاتلة، ومهلات الإيقاف، وفشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ تنطبق `--limit` و`--type` و`--since-seq` أيضًا على إخراج الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip لتشخيصات محلية مصمم لإرفاقه بتقارير الأخطاء. لنموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. يكون الافتراضي تصدير دعم تحت دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقحة المطلوب تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المطلوب فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway للقطة الصحة.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway المميز للقطة الصحة.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway للقطة الصحة.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلة لقطة الحالة/الصحة.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  تخطي البحث عن حزمة الاستقرار المحفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  طباعة المسار المكتوب، والحجم، والبيان كـ JSON.
</ParamField>

يحتوي التصدير على بيان، وملخص Markdown، وشكل التكوين، وتفاصيل تكوين منقحة، وملخصات سجلات منقحة، ولقطات حالة/صحة Gateway منقحة، وأحدث حزمة استقرار عندما تكون موجودة.

الغرض منه أن يكون قابلًا للمشاركة. يحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجل OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المكوّنة، والمنافذ، ومعرفات Plugin، ومعرفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقحة. يحذف أو ينقح نص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرفات الحساب/الرسالة، ونص الموجه/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت بالإضافة إلى عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway (launchd/systemd/schtasks) بالإضافة إلى فحص اختياري لقدرة الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  أضِف هدف فحص صريحًا. سيظل الفحص يشمل البعيد المُعدّ وlocalhost.
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
  افحص الخدمات على مستوى النظام أيضًا.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  رقِّ فحص الاتصال الافتراضي إلى فحص قراءة واخرج برمز غير صفري عند فشل فحص القراءة ذاك. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل `gateway status` متاحًا للتشخيص حتى عندما يكون إعداد CLI المحلي مفقودًا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانات المصادقة المرئية وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - فحوص التشخيص غير مُغيِّرة لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخزّن مؤقتًا موجودًا عند توفره، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs للمصادقة المُعدّة من أجل مصادقة الفحص عند الإمكان.
    - إذا تعذّر حل SecretRef مطلوب للمصادقة في مسار هذا الأمر، يبلّغ `gateway status --json` عن `rpc.authWarning` عندما يفشل اتصال/مصادقة الفحص؛ مرّر `--token`/`--password` صراحةً أو حل مصدر السر أولًا.
    - إذا نجح الفحص، تُخفى تحذيرات مرجع المصادقة غير المحلول لتجنب الإيجابيات الكاذبة.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة منصتة وتحتاج أيضًا إلى سلامة استدعاءات RPC بنطاق القراءة.
    - يضيف `--deep` فحصًا بأفضل جهد لتثبيتات launchd/systemd/schtasks الإضافية. عند اكتشاف عدة خدمات شبيهة بالـGateway، يطبع الخرج البشري تلميحات تنظيف ويحذّر من أن معظم الإعدادات يجب أن تشغّل Gateway واحدًا لكل جهاز.
    - يتضمن الخرج البشري مسار سجل الملف المحلول إضافةً إلى لقطة لمسارات/صلاحية إعداد CLI مقابل الخدمة للمساعدة في تشخيص انحراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوص انحراف مصادقة systemd على Linux">
    - في تثبيتات systemd على Linux، تقرأ فحوص انحراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوص الانحراف SecretRefs الخاصة بـ`gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كبديل).
    - إذا لم تكن مصادقة الرمز المميز فعالة عمليًا (تعيين `gateway.auth.mode` صراحةً إلى `password`/`none`/`trusted-proxy`، أو عدم تعيين الوضع حيث يمكن لكلمة المرور أن تسود ولا يمكن لأي مرشح رمز مميز أن يسود)، تتخطى فحوص انحراف الرمز حل رمز الإعداد.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائمًا:

- Gateway البعيد المُعدّ لديك (إذا كان مضبوطًا)، و
- localhost (loopback) **حتى إذا كان البعيد مُعدًا**.

إذا مررت `--url`، يُضاف ذلك الهدف الصريح قبل كليهما. يضع الخرج البشري تسميات للأهداف كالتالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا كان يمكن الوصول إلى عدة Gateways، فسيطبعها كلها. تدعم Gateways المتعددة عند استخدام ملفات تعريف/منافذ معزولة (مثل روبوت إنقاذ)، لكن معظم التثبيتات لا تزال تشغّل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="التفسير">
    - تعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلّغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع الفحص إثباته بخصوص المصادقة. وهو منفصل عن قابلية الوصول.
    - تعني `Read probe: ok` أن استدعاءات RPC التفصيلية بنطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - تعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC بنطاق القراءة محدود. يُبلّغ عن ذلك كقابلية وصول **متدهورة**، وليس فشلًا كاملًا.
    - تعني `Read probe: failed` بعد `Connect: ok` أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذه أيضًا قابلية وصول **متدهورة**، وليست Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة الجهاز المخزنة مؤقتًا الموجودة، لكنه لا ينشئ هوية جهاز لأول مرة أو حالة إقران.
    - يكون رمز الخروج غير صفري فقط عندما لا يمكن الوصول إلى أي هدف مفحوص.

  </Accordion>
  <Accordion title="خرج JSON">
    المستوى الأعلى:

    - `ok`: يمكن الوصول إلى هدف واحد على الأقل.
    - `degraded`: قبل هدف واحد على الأقل اتصالًا لكنه لم يُكمل تشخيصات RPC التفصيلية الكاملة.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف القابلة للوصول (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه كالفائز النشط بهذا الترتيب: URL الصريح، ثم نفق SSH، ثم البعيد المُعدّ، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد تحتوي على `code` و`message` و`targetIds` الاختيارية.
    - `network`: تلميحات URL لـlocal loopback/tailnet مشتقة من الإعداد الحالي وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعليان المستخدمان في مرور الفحص هذا.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب نقص نطاق المشغل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلّغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف إمكانية المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ عاد الأمر إلى الفحوص المباشرة.
    - `multiple_gateways`: كان يمكن الوصول إلى أكثر من هدف واحد؛ وهذا غير معتاد ما لم تكن تشغّل ملفات تعريف معزولة عمدًا، مثل روبوت إنقاذ.
    - `auth_secretref_unresolved`: تعذّر حل SecretRef مُعدّ للمصادقة لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب نقص `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS إعادة توجيه منفذ محليًا بحيث يصبح Gateway البعيد (الذي قد يكون مربوطًا بـloopback فقط) قابلًا للوصول على `ws://127.0.0.1:<port>`.

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
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` بالإضافة إلى نطاق المنطقة الواسعة المُعدّ، إن وجد). يتم تجاهل تلميحات TXT فقط.
</ParamField>

الإعداد (اختياري، يُستخدم كافتراضات):

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
  عنوان URL لـWebSocket الخاص بـGateway.
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
  أساسًا لاستدعاءات RPC بأسلوب الوكلاء التي تبث أحداثًا وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  خرج JSON قابل للقراءة آليًا.
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

### التثبيت باستخدام غلاف

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة عبر ملف تنفيذي آخر، مثل
وسيط مدير أسرار أو مساعد تشغيل باسم مستخدم آخر. يتلقى الغلاف وسائط Gateway العادية ويكون
مسؤولًا عن تنفيذ `openclaw` أو Node في النهاية بتلك الوسائط.

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

يمكنك أيضًا ضبط الغلاف عبر البيئة. يتحقق `gateway install` من أن المسار
ملف تنفيذي، ويكتب الغلاف في `ProgramArguments` الخاصة بالخدمة، ويثبّت
`OPENCLAW_WRAPPER` في بيئة الخدمة لإعادة التثبيت القسرية والتحديثات وإصلاحات الطبيب اللاحقة.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة غلاف مثبّت، امسح `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

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
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل؛ على macOS، يعطّل `gateway stop` عن قصد LaunchAgent قبل إيقافه.
    - يتجاوز `gateway restart --wait 30s` ميزانية انتظار إعادة التشغيل المُعدّة لتلك الإعادة. الأرقام المجردة تُعد بالمللي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير مسمى.
    - يتخطى `gateway restart --force` انتظار العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغل قد فحص بالفعل عوائق المهام المدرجة ويريد عودة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للسكربتات.

  </Accordion>
  <Accordion title="المصادقة وSecretRefs وقت التثبيت">
    - عندما تتطلب مصادقة الرمز المميز رمزًا وتكون `gateway.auth.token` مُدارة عبر SecretRef، يتحقق `gateway install` من إمكانية حل SecretRef لكنه لا يثبت الرمز المحلول في بيانات بيئة الخدمة الوصفية.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef الخاص بالرمز المُعدّ غير محلول، يفشل التثبيت بشكل مغلق بدلًا من تثبيت نص عادي بديل.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـSecretRef على `--password` المضمّن.
    - في وضع المصادقة المستنتج، لا تخفف `OPENCLAW_GATEWAY_PASSWORD` الخاصة بالصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعداد) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مُعدّين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.

  </Accordion>
</AccordionGroup>

## اكتشاف Gateways (Bonjour)

يفحص `gateway discover` منارات Gateway ‏(`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Wide-Area Bonjour): اختر نطاقًا (مثال: `openclaw.internal.`) وأعدّ DNS مقسّمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

تعلن المنارة فقط بوابات Gateway التي فُعّل فيها اكتشاف Bonjour (افتراضيًا).

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (اختياري؛ يضبط العملاء أهداف SSH افتراضيًا إلى `22` عند غيابه)
- `tailnetDns` (اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` (TLS مفعّل + بصمة الشهادة)
- `cliPath` (تلميح التثبيت البعيد المكتوب إلى منطقة النطاق الواسع)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلة لكل أمر (تصفح/حل).
</ParamField>
<ParamField path="--json" type="boolean">
  إخراج قابل للقراءة آليًا (يعطّل أيضًا التنسيق/مؤشر التحميل).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` بالإضافة إلى نطاق النطاق الواسع المضبوط عند تفعيله.
- يُشتق `wsUrl` في إخراج JSON من نقطة نهاية الخدمة التي تم حلها، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- على mDNS في `local.`، لا يُبث `sshPort` و`cliPath` إلا عندما تكون `discovery.mdns.mode` هي `full`. لا يزال DNS-SD واسع النطاق يكتب `cliPath`؛ ويبقى `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
