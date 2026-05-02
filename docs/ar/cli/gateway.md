---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway، وأوضاع الربط، والاتصال
    - اكتشاف بوابات Gateway عبر Bonjour (DNS-SD المحلي + الواسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل البوابات والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-05-02T07:22:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f204b58e03c9dd1b75a7ddb2be0634ee70b42aa317a2668ab86cb33a0570b01
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العُقَد، الجلسات، الخطافات). تندرج الأوامر الفرعية في هذه الصفحة تحت `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي و DNS-SD واسع النطاق.
  </Card>
  <Card title="نظرة عامة على الاكتشاف" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن Gateways ويعثر عليها.
  </Card>
  <Card title="الإعدادات" href="/ar/gateway/configuration">
    مفاتيح إعدادات Gateway على المستوى الأعلى.
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
    - افتراضيًا، يرفض Gateway البدء ما لم يكن `gateway.mode=local` مضبوطًا في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المؤقتة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و `openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كإعداد معطّل أو مستبدل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و `gateway.mode` مفقود، يتعامل Gateway مع ذلك كضرر مريب في الإعدادات ويرفض أن "يخمن المحلي" نيابة عنك.
    - يُحظر الربط خارج loopback دون مصادقة (حاجز أمان).
    - يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند السماح بذلك (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء تطبيق/تحديث أداة وإعدادات gateway مسموحًا).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI باستخدام TUI أو إدخال raw-mode، فأعد الطرفية إلى حالتها قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من الإعدادات/البيئة؛ عادةً `18789`).
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
  إعادة تعيين إعدادات Tailscale serve/funnel عند إيقاف التشغيل.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway دون `gateway.mode=local` في الإعدادات. يتجاوز حاجز بدء التشغيل للتمهيد المؤقت/التطويري فقط؛ ولا يكتب ملف الإعدادات أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء إعدادات تطوير + مساحة عمل إذا كانت مفقودة (يتخطى BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة تعيين إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  إنهاء أي مستمع قائم على المنفذ المحدد قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  سجلات مفصلة.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  عرض سجلات الواجهة الخلفية لـ CLI فقط في وحدة التحكم (وتفعيل stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  نمط سجلات WebSocket.
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

<Warning>
يمكن أن تنكشف كلمة المرور الممررة مباشرة عبر `--password` في قوائم العمليات المحلية. فضّل `--password-file` أو البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### توصيف أداء بدء التشغيل

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء تشغيل Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جداول بحث Plugin لـ installed-index وسجل البيان وتخطيط بدء التشغيل وعمل owner-map.
- اضبط `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة خط زمني لتشخيصات بدء التشغيل بصيغة JSONL وفق أفضل جهد لحِزم اختبار ضمان الجودة الخارجية. يمكنك أيضًا تفعيل العلم باستخدام `diagnostics.flags: ["timeline"]` في الإعدادات؛ ويبقى المسار مقدمًا من البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء تشغيل Gateway. يسجل القياس أول إخراج للعملية، و `/healthz`، و `/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جداول بحث Plugin.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: قابل للقراءة البشرية (ملون في TTY).
    - `--json`: JSON قابل للقراءة آليًا (دون تنسيق/مؤشر دوران).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL الخاص بـ Gateway WebSocket.
    - `--token <token>`: رمز Gateway.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية الزمنية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "final" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند ضبط `--url`، لا يعود CLI إلى بيانات اعتماد الإعدادات أو البيئة. مرر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطة نهاية HTTP `/healthz` هي مسبار حيوية: تعود بمجرد أن يتمكن الخادم من الرد على HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتظل حمراء بينما لا تزال عمليات Plugin الجانبية عند بدء التشغيل أو القنوات أو الخطافات المهيأة في طور الاستقرار. تتضمن استجابات الجاهزية التفصيلية المحلية أو المصادق عليها كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستغلال حلقة الأحداث، ونسبة أنوية CPU، وعلم `degraded`.

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
  تضمين الأحداث التي تلي رقم تسلسل تشخيصي فقط.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرر مسار JSON لحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات دعم قابلة للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزمة">
    - تحتفظ السجلات بالبيانات الوصفية التشغيلية: أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الصف/الجلسة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقحة. لا تحتفظ بنص المحادثة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند حالات خروج Gateway الفادحة، ومهل إيقاف التشغيل، وفشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw لقطة التشخيص نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ وتنطبق أيضًا `--limit` و `--type` و `--since-seq` على إخراج الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

كتابة ملف zip لتشخيصات محلية مصمم لإرفاقه بتقارير الأخطاء. للاطلاع على نموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. يكون افتراضيًا تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لعدد أسطر السجل المنقاة المراد تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لعدد بايتات السجل المراد فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL الخاص بـ Gateway WebSocket للقطة الصحة.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway للقطة الصحة.
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
  طباعة المسار المكتوب والحجم والبيان كـ JSON.
</ParamField>

يحتوي التصدير على بيان، وملخص Markdown، وشكل الإعدادات، وتفاصيل إعدادات منقاة، وملخصات سجلات منقاة، ولقطات حالة/صحة Gateway منقاة، وأحدث حزمة استقرار عند وجودها.

إنه معدّ للمشاركة. يحتفظ بتفاصيل تشغيلية تساعد على التصحيح، مثل حقول سجلات OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المهيأة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل سجلات التشغيل المنقحة. ويحذف أو ينقح نص المحادثة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسالة، ونصوص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بأسلوب LogTape كنص حمولة مستخدم/محادثة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway (launchd/systemd/schtasks) بالإضافة إلى مسبار اختياري لإمكانية الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  إضافة هدف مسبار صريح. يظل فحص الهدف البعيد المهيأ و localhost قائمًا.
</ParamField>
<ParamField path="--token <token>" type="string">
  مصادقة الرمز للمسبار.
</ParamField>
<ParamField path="--password <password>" type="string">
  مصادقة كلمة المرور للمسبار.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلة المسبار.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  تخطي مسبار الاتصال (عرض الخدمة فقط).
</ParamField>
<ParamField path="--deep" type="boolean">
  فحص خدمات مستوى النظام أيضًا.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ترقية مسبار الاتصال الافتراضي إلى مسبار قراءة والخروج برمز غير صفري عندما يفشل مسبار القراءة ذلك. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل `gateway status` متاحا للتشخيص حتى عندما يكون إعداد CLI المحلي مفقودا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانات المصادقة الظاهرة وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - مجسات التشخيص غير معدلة لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخزن مؤقتا عند وجوده، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs للمصادقة المكونة من أجل مصادقة المجس عندما يكون ذلك ممكنا.
    - إذا تعذر حل SecretRef مطلوب للمصادقة في مسار هذا الأمر، فإن `gateway status --json` يبلغ عن `rpc.authWarning` عندما يفشل الاتصال/المصادقة بالمجس؛ مرر `--token`/`--password` صراحة أو حل مصدر السر أولا.
    - إذا نجح المجس، يتم كتم تحذيرات مراجع المصادقة غير المحلولة لتجنب النتائج الإيجابية الكاذبة.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع وتحتاج أيضا إلى سلامة استدعاءات RPC ضمن نطاق القراءة.
    - يضيف `--deep` فحصا بأفضل جهد لتثبيتات launchd/systemd/schtasks الإضافية. عند اكتشاف عدة خدمات شبيهة بـ Gateway، تطبع المخرجات البشرية تلميحات تنظيف وتحذر من أن معظم الإعدادات يجب أن تشغل Gateway واحدا لكل جهاز.
    - تتضمن المخرجات البشرية مسار سجل الملف المحلول، إضافة إلى لقطة لمسارات/صلاحية إعدادات CLI مقارنة بالخدمة للمساعدة في تشخيص انحراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوصات انحراف مصادقة systemd على Linux">
    - في تثبيتات systemd على Linux، تقرأ فحوصات انحراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوصات الانحراف مراجع SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولا، ثم الرجوع إلى بيئة العملية).
    - إذا لم تكن مصادقة الرمز نشطة فعليا (`gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو الوضع غير معين حيث يمكن لكلمة المرور أن تفوز ولا يمكن لأي مرشح رمز أن يفوز)، تتجاوز فحوصات انحراف الرمز حل رمز الإعدادات.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". فهو يفحص دائما:

- Gateway البعيد المكون لديك (إن كان معينا)، و
- localhost (loopback) **حتى إذا كان البعيد مكونا**.

إذا مررت `--url`، تتم إضافة ذلك الهدف الصريح قبل كليهما. تسمي المخرجات البشرية الأهداف كالتالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا كانت عدة Gateways قابلة للوصول، فسيطبعها كلها. تدعم Gateways متعددة عند استخدام ملفات شخصية/منافذ معزولة (مثل روبوت إنقاذ)، لكن معظم التثبيتات لا تزال تشغل Gateway واحدا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="التفسير">
    - `Reachable: yes` يعني أن هدفا واحدا على الأقل قبل اتصال WebSocket.
    - يبلغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع المجس إثباته بشأن المصادقة. وهو منفصل عن قابلية الوصول.
    - `Read probe: ok` يعني أن استدعاءات RPC التفصيلية ضمن نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضا.
    - `Read probe: limited - missing scope: operator.read` يعني أن الاتصال نجح، لكن RPC ضمن نطاق القراءة محدود. يتم الإبلاغ عن هذا كقابلية وصول **متدهورة**، وليس فشلا كاملا.
    - `Read probe: failed` بعد `Connect: ok` يعني أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضا قابلية وصول **متدهورة**، وليس Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد المجس استخدام مصادقة الجهاز المخزنة مؤقتا، لكنه لا ينشئ هوية جهاز لأول مرة أو حالة إقران.
    - يكون رمز الخروج غير صفري فقط عندما لا يكون أي هدف مفحوص قابلا للوصول.

  </Accordion>
  <Accordion title="مخرجات JSON">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: قبل هدف واحد على الأقل اتصالا لكنه لم يكمل تشخيصات RPC التفصيلية كاملة.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف القابلة للوصول (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه كفائز نشط بهذا الترتيب: URL الصريح، نفق SSH، البعيد المكون، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` الاختيارية.
    - `network`: تلميحات URL لـ local loopback/tailnet مشتقة من الإعدادات الحالية وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلي المستخدم لتمرير هذا المجس.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب غياب نطاق المشغل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف إمكانية المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ رجع الأمر إلى المجسات المباشرة.
    - `multiple_gateways`: كان أكثر من هدف واحد قابلا للوصول؛ هذا غير معتاد إلا إذا كنت تشغل ملفات شخصية معزولة عمدا، مثل روبوت إنقاذ.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مكون لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن مجس القراءة كان محدودا بسبب غياب `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "البعيد عبر SSH" في تطبيق macOS إعادة توجيه منفذ محلي حتى يصبح Gateway البعيد (الذي قد يكون مربوطا بـ loopback فقط) قابلا للوصول عند `ws://127.0.0.1:<port>`.

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
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` إضافة إلى نطاق المنطقة الواسعة المكون، إن وجد). يتم تجاهل تلميحات TXT فقط.
</ParamField>

الإعدادات (اختيارية، تستخدم كافتراضات):

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
  عنوان URL لـ WebSocket الخاص بـ Gateway.
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
  أساسا لاستدعاءات RPC بنمط الوكيل التي تبث أحداثا وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات JSON قابلة للقراءة آليا.
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

### التثبيت مع غلاف

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المدارة عبر ملف تنفيذي آخر، مثل
وسيط مدير أسرار أو مساعد تشغيل كمستخدم. يتلقى الغلاف وسيطات Gateway العادية وهو
مسؤول عن تنفيذ `openclaw` أو Node في النهاية مع تلك الوسيطات.

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

يمكنك أيضا تعيين الغلاف عبر البيئة. يتحقق `gateway install` من أن المسار
ملف تنفيذي، ويكتب الغلاف في `ProgramArguments` الخاصة بالخدمة، ويستبقي
`OPENCLAW_WRAPPER` في بيئة الخدمة لإعادة التثبيت القسرية والتحديثات وإصلاحات doctor لاحقا.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة غلاف مستبقى، امسح `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="خيارات الأمر">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart`: `--json`

  </Accordion>
  <Accordion title="سلوك دورة الحياة">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل؛ على macOS، يعطل `gateway stop` عمدا LaunchAgent قبل إيقافه.
    - تقبل أوامر دورة الحياة `--json` للسكربتات.

  </Accordion>
  <Accordion title="المصادقة و SecretRefs وقت التثبيت">
    - عندما تتطلب مصادقة الرمز رمزا ويكون `gateway.auth.token` مدار بواسطة SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل لكنه لا يستبقي الرمز المحلول في بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز تتطلب رمزا وكان SecretRef للرمز المكون غير محلول، يفشل التثبيت بإغلاق بدلا من استبقاء نص عادي احتياطي.
    - لمصادقة كلمة المرور في `gateway run`، فضل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` مدعوما بـ SecretRef على `--password` المضمنة.
    - في وضع المصادقة المستنتج، لا تخفف `OPENCLAW_GATEWAY_PASSWORD` الموجودة في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادا دائما (`gateway.auth.password` أو `env` في الإعدادات) عند تثبيت خدمة مدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكونين وكان `gateway.auth.mode` غير معين، يتم حظر التثبيت حتى يتم تعيين الوضع صراحة.

  </Accordion>
</AccordionGroup>

## اكتشاف Gateways ‏(Bonjour)

يفحص `gateway discover` منارات Gateway ‏(`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Bonjour واسع النطاق): اختر نطاقا (مثال: `openclaw.internal.`) وأعد DNS مقسما + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

فقط Gateways التي تم تمكين اكتشاف Bonjour فيها (افتراضيا) تعلن المنارة.

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادة `18789`)
- `sshPort` (اختياري؛ يضبط العملاء أهداف SSH افتراضيا إلى `22` عند غيابه)
- `tailnetDns` (اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` (تمكين TLS + بصمة الشهادة)
- `cliPath` (تلميح التثبيت البعيد المكتوب إلى منطقة النطاق الواسع)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلة لكل أمر (تصفح/حل).
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات قابلة للقراءة آليا (وتعطل أيضا التنسيق/المؤشر الدوار).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` بالإضافة إلى نطاق الشبكة الواسعة المُكوَّن عند تمكينه.
- يُشتق `wsUrl` في خرج JSON من نقطة نهاية الخدمة التي تم حلها، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- على mDNS الخاص بـ `local.`، لا يُبث `sshPort` و`cliPath` إلا عندما يكون `discovery.mdns.mode` هو `full`. لا يزال DNS-SD واسع النطاق يكتب `cliPath`؛ ويبقى `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
