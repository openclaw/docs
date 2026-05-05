---
read_when:
    - تشغيل Gateway من CLI (التطوير أو الخوادم)
    - استكشاف أخطاء مصادقة Gateway وأوضاع الربط والاتصال وإصلاحها
    - اكتشاف بوابات Gateway عبر Bonjour (DNS-SD المحلي وواسع النطاق)
sidebarTitle: Gateway
summary: CLI لـ OpenClaw Gateway (`openclaw gateway`) — تشغيل بوابات Gateway والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-05-05T01:44:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 521558189b150b2faa22f95ec32419ac9e02c5f47c72b9095f40d1432840c038
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العقد، الجلسات، الخطافات). توجد الأوامر الفرعية في هذه الصفحة تحت `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/ar/gateway/bonjour">
    إعداد mDNS محلي + DNS-SD واسع النطاق.
  </Card>
  <Card title="Discovery overview" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن البوابات ويعثر عليها.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration">
    مفاتيح تكوين Gateway ذات المستوى الأعلى.
  </Card>
</CardGroup>

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

اسم بديل للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - افتراضيًا، يرفض Gateway بدء التشغيل ما لم يتم ضبط `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` لعمليات التشغيل المخصصة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا ولكن `gateway.mode` مفقود، فتعامل مع ذلك كتكوين معطوب أو مستبدل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقودًا، يتعامل Gateway مع ذلك كضرر مريب في التكوين ويرفض أن "يخمن المحلي" بدلًا منك.
    - يتم حظر الربط خارج حلقة الاسترجاع بدون مصادقة (حاجز أمان).
    - يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند التفويض (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء تطبيق/تحديث أداة وتكوين Gateway مسموحًا).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI باستخدام TUI أو إدخال الوضع الخام، فأعد الطرفية إلى حالتها قبل الخروج.

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
  إتاحة Gateway عبر Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  إعادة ضبط تكوين serve/funnel في Tailscale عند إيقاف التشغيل.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway بدون `gateway.mode=local` في التكوين. يتجاوز حاجز بدء التشغيل للتمهيد المخصص/التطويري فقط؛ ولا يكتب ملف التكوين أو يصلحه.
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
  سجلات تفصيلية.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  عرض سجلات خلفية CLI فقط في وحدة التحكم (وتفعيل stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  نمط سجل Websocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  اسم بديل لـ `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  تسجيل أحداث بث النموذج الخام إلى jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسار jsonl للبث الخام.
</ParamField>

## إعادة تشغيل Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

يطلب `openclaw gateway restart --safe` من Gateway الجاري تشغيله إجراء فحص تمهيدي لعمل OpenClaw النشط قبل إعادة التشغيل. إذا كانت هناك عمليات في قائمة الانتظار، أو تسليم ردود، أو عمليات تشغيل مضمنة، أو عمليات تشغيل مهام نشطة، يبلّغ Gateway عن العوائق، ويدمج طلبات إعادة التشغيل الآمنة المكررة، ثم يعيد التشغيل بعد تصريف العمل النشط. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي للتوافق. استخدم `--force` فقط عندما تريد صراحةً مسار التجاوز الفوري.

<Warning>
يمكن أن تظهر `--password` المضمنة في قوائم العمليات المحلية. فضّل `--password-file` أو متغيرات البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### تحليل أداء بدء التشغيل

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء تشغيل Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جدول بحث Plugin للفهرس المثبت، وسجل البيان، وتخطيط بدء التشغيل، وعمل خريطة المالك.
- اضبط `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة خط زمني تشخيصي لبدء التشغيل بصيغة JSONL على أساس أفضل جهد لأدوات QA الخارجية. يمكنك أيضًا تفعيل العلامة باستخدام `diagnostics.flags: ["timeline"]` في التكوين؛ ويظل المسار مقدمًا من البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء تشغيل Gateway. يسجل معيار الأداء أول مخرجات للعملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جدول بحث Plugin.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - الافتراضي: قابل للقراءة البشرية (ملون في TTY).
    - `--json`: JSON قابل للقراءة آليًا (بدون تنسيق/مؤشر تحميل).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway.
    - `--token <token>`: رمز Gateway المميز.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند ضبط `--url`، لا يعود CLI إلى بيانات الاعتماد من التكوين أو البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطة نهاية HTTP `/healthz` هي فحص حيوية: ترجع بمجرد أن يستطيع الخادم الرد عبر HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتبقى حمراء بينما لا تزال ملحقات بدء تشغيل Plugin الجانبية أو القنوات أو الخطافات المكوّنة تستقر. تتضمن استجابات الجاهزية المحلية أو المصادق عليها والمفصلة كتلة تشخيص `eventLoop` تحتوي على تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة نوى CPU، وعلامة `degraded`.

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

جلب مسجل الاستقرار التشخيصي الأخير من Gateway قيد التشغيل.

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
  تضمين الأحداث اللاحقة فقط لرقم تسلسل تشخيصي.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON للحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات الدعم قابل للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - تحتفظ السجلات بالبيانات الوصفية التشغيلية: أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقحة. ولا تحتفظ بنصوص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند مخارج Gateway الفادحة، ومهل إيقاف التشغيل، وإخفاقات بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ كما تنطبق `--limit` و`--type` و`--since-seq` على مخرجات الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

كتابة ملف zip للتشخيصات المحلية مصمم لإرفاقه بتقارير الأخطاء. لنموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. يكون الافتراضي تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقحة المراد تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المراد فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway للقطة الحالة الصحية.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway المميز للقطة الحالة الصحية.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway للقطة الحالة الصحية.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلة لقطة الحالة/الحالة الصحية.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  تخطي البحث عن حزمة الاستقرار المحفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  طباعة المسار المكتوب، والحجم، والبيان بصيغة JSON.
</ParamField>

يحتوي التصدير على بيان، وملخص Markdown، وشكل التكوين، وتفاصيل تكوين منقحة، وملخصات سجلات منقحة، ولقطات حالة/صحة Gateway منقحة، وأحدث حزمة استقرار عند وجود واحدة.

وهو مخصص للمشاركة. يحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجلات OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المكوّنة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقحة. ويحذف أو ينقح نصوص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسالة، ونصوص الموجه/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway (launchd/systemd/schtasks) بالإضافة إلى فحص اختياري لقدرة الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  أضف هدف فحص صريحًا. سيظل فحص البعيد المكوَّن + localhost قائمًا.
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
  افحص الخدمات على مستوى النظام أيضًا.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  رقِّ فحص الاتصال الافتراضي إلى فحص قراءة واخرج برمز غير صفري عند فشل فحص القراءة ذاك. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل `gateway status` متاحًا للتشخيصات حتى عندما يكون تكوين CLI المحلي مفقودًا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانية المصادقة المرئية وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - فحوصات التشخيص غير مُغيِّرة لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخزن مؤقتًا موجودًا عند توفره، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs للمصادقة المكوَّنة لمصادقة الفحص عندما يكون ذلك ممكنًا.
    - إذا لم يُحل SecretRef مطلوب للمصادقة في مسار هذا الأمر، يبلّغ `gateway status --json` عن `rpc.authWarning` عند فشل اتصال/مصادقة الفحص؛ مرّر `--token`/`--password` صراحةً أو حل مصدر السر أولًا.
    - إذا نجح الفحص، تُخفى تحذيرات مراجع المصادقة غير المحلولة لتجنب الإيجابيات الكاذبة.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع وتحتاج أيضًا إلى سلامة استدعاءات RPC بنطاق القراءة.
    - يضيف `--deep` فحصًا بأفضل جهد للتثبيتات الإضافية عبر launchd/systemd/schtasks. عند اكتشاف خدمات متعددة شبيهة بـ Gateway، يطبع الخرج البشري تلميحات تنظيف ويحذر من أن معظم الإعدادات ينبغي أن تشغل Gateway واحدًا لكل جهاز.
    - يتضمن الخرج البشري مسار سجل الملف المحلول إضافة إلى لقطة مسارات/صلاحية تكوين CLI مقابل الخدمة للمساعدة في تشخيص انجراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوصات انجراف مصادقة systemd في Linux">
    - في تثبيتات Linux systemd، تقرأ فحوصات انجراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوصات الانجراف مراجع SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كخيار احتياطي).
    - إذا لم تكن مصادقة الرمز فعالة عمليًا (`gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو النمط غير مضبوط بحيث يمكن لكلمة المرور أن تفوز ولا يمكن لأي مرشح رمز أن يفوز)، تتخطى فحوصات انجراف الرمز حل رمز التكوين.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائمًا:

- Gateway البعيد المكوَّن لديك (إذا كان مضبوطًا)، و
- localhost (local loopback) **حتى إذا كان البعيد مكوَّنًا**.

إذا مررت `--url`، يُضاف ذلك الهدف الصريح قبل كليهما. يضع الخرج البشري تسميات للأهداف كالتالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا كانت عدة Gateways قابلة للوصول، فإنه يطبعها كلها. تُدعم Gateways المتعددة عندما تستخدم ملفات شخصية/منافذ معزولة (مثل بوت إنقاذ)، لكن معظم التثبيتات ما زالت تشغل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="التفسير">
    - يعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلّغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما تمكن الفحص من إثباته بشأن المصادقة. وهو منفصل عن قابلية الوصول.
    - يعني `Read probe: ok` أن استدعاءات RPC التفصيلية بنطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - يعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC بنطاق القراءة محدود. يُبلّغ عن ذلك كقابلية وصول **متدهورة**، وليس فشلًا كاملًا.
    - يعني `Read probe: failed` بعد `Connect: ok` أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذه أيضًا قابلية وصول **متدهورة**، وليست Gateway غير قابلة للوصول.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة الجهاز المخزنة مؤقتًا، لكنه لا ينشئ هوية جهاز لأول مرة أو حالة إقران.
    - يكون رمز الخروج غير صفري فقط عندما لا يكون أي هدف مفحوص قابلًا للوصول.

  </Accordion>
  <Accordion title="خرج JSON">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: هدف واحد على الأقل قبل اتصالًا لكنه لم يكمل تشخيصات RPC التفصيلية الكاملة.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف القابلة للوصول (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه باعتباره الفائز النشط بهذا الترتيب: URL الصريح، نفق SSH، البعيد المكوَّن، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` اختياري.
    - `network`: تلميحات URL لـ local loopback/tailnet مشتقة من التكوين الحالي وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلي المستخدم لمرور الفحص هذا.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب فقدان نطاق المشغل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلّغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف إمكانية المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ رجع الأمر إلى الفحوصات المباشرة.
    - `multiple_gateways`: كان أكثر من هدف واحد قابلًا للوصول؛ هذا غير معتاد إلا إذا كنت تشغل عمدًا ملفات شخصية معزولة، مثل بوت إنقاذ.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مكوَّن لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب فقدان `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS تمرير منفذ محليًا بحيث تصبح Gateway البعيدة (التي قد تكون مربوطة بـ loopback فقط) قابلة للوصول عند `ws://127.0.0.1:<port>`.

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
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` إضافة إلى نطاق المنطقة الواسعة المكوَّن، إن وجد). تُتجاهل التلميحات من نوع TXT فقط.
</ParamField>

التكوين (اختياري، يُستخدم كقيم افتراضية):

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
  أساسًا لاستدعاءات RPC بنمط الوكيل التي تبث أحداثًا وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  خرج JSON قابل للقراءة آليًا.
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
وسيط مدير أسرار أو مساعد تشغيل باسم مستخدم آخر. يتلقى المغلّف وسائط Gateway العادية ويتحمل
مسؤولية تنفيذ `openclaw` أو Node في النهاية بتلك الوسائط.

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

يمكنك أيضًا ضبط المغلّف عبر البيئة. يتحقق `gateway install` من أن المسار
ملف تنفيذي، ويكتب المغلّف في `ProgramArguments` الخاصة بالخدمة، ويحفظ
`OPENCLAW_WRAPPER` في بيئة الخدمة لعمليات إعادة التثبيت القسرية والتحديثات وإصلاحات doctor اللاحقة.

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
  <Accordion title="خيارات الأمر">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop`: `--json`

  </Accordion>
  <Accordion title="سلوك دورة الحياة">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل؛ في macOS، يعطل `gateway stop` LaunchAgent عمدًا قبل إيقافه.
    - يطلب `gateway restart --safe` من Gateway العامل إجراء فحص أولي لأعمال OpenClaw النشطة وتأجيل إعادة التشغيل حتى تُستنزف عملية تسليم الردود، والتشغيلات المضمنة، وتشغيلات المهام. لا يمكن دمج `--safe` مع `--force` أو `--wait`.
    - يتجاوز `gateway restart --wait 30s` ميزانية استنزاف إعادة التشغيل المكوَّنة لتلك الإعادة. الأرقام المجردة بالميلي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير مسمى.
    - يتخطى `gateway restart --force` استنزاف العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغل قد فحص بالفعل معوقات المهام المدرجة ويريد عودة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للبرمجة النصية.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - عندما تتطلب مصادقة الرمز المميز رمزًا مميزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل لكنه لا يحفظ الرمز المميز المحلول في بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكان SecretRef للرمز المميز المُكوَّن غير محلول، يفشل التثبيت بإغلاق آمن بدلًا من حفظ نص عادي احتياطي.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـ SecretRef بدلًا من `--password` المضمنة.
    - في وضع المصادقة المستنتج، لا تخفف `OPENCLAW_GATEWAY_PASSWORD` الخاصة بالصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعداد) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مُكوَّنين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.

  </Accordion>
</AccordionGroup>

## اكتشاف البوابات (Bonjour)

يفحص `gateway discover` إشارات Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): اختر نطاقًا (مثال: `openclaw.internal.`) وأعِدّ DNS مقسمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

لا تُعلن الإشارة إلا البوابات التي فُعّل فيها اكتشاف Bonjour (افتراضيًا).

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
  مخرجات قابلة للقراءة آليًا (وتعطل أيضًا التنسيق/مؤشر الدوران).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` بالإضافة إلى نطاق النطاق الواسع المُكوَّن عند تفعيله.
- يُشتق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة المحلولة، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS على `local.`، لا يُبث `sshPort` و`cliPath` إلا عندما تكون `discovery.mdns.mode` هي `full`. لا يزال DNS-SD واسع النطاق يكتب `cliPath`؛ ويبقى `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
