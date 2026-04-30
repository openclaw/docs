---
read_when:
    - تشغيل Gateway عبر CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateways عبر Bonjour (DNS-SD المحلي + واسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل Gateways والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-04-30T07:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe53f1ec289bf463766634a9b03bc234e109fdddf35b3fa3958fb8c5255c81a9
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العُقد، الجلسات، الخطافات). الأوامر الفرعية في هذه الصفحة تقع تحت `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي + DNS-SD واسع النطاق.
  </Card>
  <Card title="Discovery overview" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن gateways ويعثر عليها.
  </Card>
  <Card title="Configuration" href="/ar/gateway/configuration">
    مفاتيح إعداد Gateway ذات المستوى الأعلى.
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
  <Accordion title="Startup behavior">
    - افتراضيًا، يرفض Gateway البدء ما لم يتم تعيين `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` لعمليات التشغيل المؤقتة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كإعداد معطّل أو مستبدَل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقودًا، يتعامل Gateway مع ذلك كضرر مشبوه في الإعداد ويرفض أن "يخمّن المحلي" نيابةً عنك.
    - يُحظر الربط خارج loopback بدون مصادقة (حاجز أمان).
    - يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند السماح بذلك (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، بينما يظل تطبيق/تحديث أداة Gateway وإعداداته مسموحًا).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI باستخدام TUI أو إدخال raw-mode، فأعد الطرفية إلى حالتها قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (القيمة الافتراضية تأتي من الإعداد/البيئة؛ عادةً `18789`).
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
  إعادة تعيين إعداد serve/funnel في Tailscale عند إيقاف التشغيل.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway بدون `gateway.mode=local` في الإعداد. يتجاوز حاجز بدء التشغيل للتمهيد المؤقت/التطويري فقط؛ ولا يكتب ملف الإعداد أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء إعداد تطوير + مساحة عمل إذا كانت مفقودة (يتجاوز BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة تعيين إعداد التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
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
  تسجيل أحداث بث النموذج الخام إلى jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسار jsonl للبث الخام.
</ParamField>

<Warning>
قد تظهر `--password` المضمّنة في قوائم العمليات المحلية. فضّل `--password-file` أو env أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### تحليل أداء بدء التشغيل

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جدول بحث Plugin للفهرس المثبت، وسجل manifest، وتخطيط بدء التشغيل، وعمل owner-map.
- اضبط `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة مخطط زمني تشخيصي لبدء التشغيل بصيغة JSONL وبأفضل جهد لأطر QA الخارجية. يمكنك أيضًا تفعيل العلامة باستخدام `diagnostics.flags: ["timeline"]` في الإعداد؛ ولا يزال المسار مقدمًا عبر env. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء Gateway. يسجل القياس أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جدول بحث Plugin.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - الافتراضي: قابل للقراءة البشرية (ملوّن في TTY).
    - `--json`: JSON قابل للقراءة آليًا (بدون تنسيق/مؤشر تحميل).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway.
    - `--token <token>`: رمز Gateway المميز.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "final" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند تعيين `--url`، لا يعود CLI إلى بيانات الاعتماد من الإعداد أو البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة يُعد خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطة نهاية HTTP `/healthz` هي فحص حيوية: تعود بمجرد أن يستطيع الخادم الرد عبر HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتبقى حمراء بينما لا تزال ملحقات بدء التشغيل الجانبية أو القنوات أو الخطافات المكوّنة تستقر. تتضمن استجابات الجاهزية التفصيلية المحلية أو المصادَق عليها كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة أنوية CPU، وعلامة `degraded`.

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
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON لحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات دعم قابلة للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - تحتفظ السجلات ببيانات تشغيلية وصفية: أسماء الأحداث، والأعداد، وأحجام البايت، وقراءات الذاكرة، وحالة الطابور/الجلسة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقحة. لا تحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند مخارج Gateway الفادحة، ومهل إيقاف التشغيل، وفشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما تكون لدى المسجل أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ وتنطبق أيضًا `--limit` و`--type` و`--since-seq` على مخرجات الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip لتشخيصات محلية مصممًا للإرفاق بتقارير الأخطاء. لنموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. افتراضيًا، يكون تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقحة المراد تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المراد فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway للقطات الصحة.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway المميز للقطات الصحة.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway للقطات الصحة.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلة لقطة الحالة/الصحة.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  تخطي البحث عن حزمة استقرار محفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  طباعة المسار المكتوب والحجم وmanifest بصيغة JSON.
</ParamField>

يحتوي التصدير على manifest، وملخص Markdown، وشكل الإعداد، وتفاصيل إعداد منقحة، وملخصات سجلات منقحة، ولقطات حالة/صحة Gateway منقحة، وأحدث حزمة استقرار عند وجودها.

الغرض منه أن تتم مشاركته. يحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجل OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المكوّنة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقحة. يحذف أو ينقح نص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسالة، ونص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway (launchd/systemd/schtasks) بالإضافة إلى فحص اختياري لقدرة الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  إضافة هدف فحص صريح. لا تزال الوجهة البعيدة المكوّنة + localhost تُفحص.
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
    - يظل `gateway status` متاحًا للتشخيصات حتى عندما يكون إعداد CLI المحلي مفقودًا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانية المصادقة الظاهرة وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - مجسات التشخيص غير معدِّلة لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخزن مؤقتًا قائمًا عند وجوده، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs للمصادقة المكوّنة لمصادقة المجس عند الإمكان.
    - إذا كان SecretRef مطلوب للمصادقة غير محلول في مسار هذا الأمر، يبلّغ `gateway status --json` عن `rpc.authWarning` عند فشل اتصال/مصادقة المجس؛ مرّر `--token`/`--password` صراحةً أو حلّ مصدر السر أولًا.
    - إذا نجح المجس، تُخفى تحذيرات مرجع المصادقة غير المحلول لتجنب النتائج الإيجابية الكاذبة.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع وتحتاج أيضًا إلى سلامة استدعاءات RPC بنطاق القراءة.
    - يضيف `--deep` فحصًا بأفضل جهد لعمليات تثبيت launchd/systemd/schtasks الإضافية. عند اكتشاف عدة خدمات شبيهة بـ Gateway، يطبع الإخراج البشري تلميحات تنظيف ويحذر من أن معظم الإعدادات يجب أن تشغل Gateway واحدًا لكل جهاز.
    - يتضمن الإخراج البشري مسار سجل الملف المحلول بالإضافة إلى لقطة لمسارات/صلاحية إعدادات CLI مقابل الخدمة للمساعدة في تشخيص انحراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوصات انحراف المصادقة في Linux systemd">
    - في عمليات تثبيت Linux systemd، تقرأ فحوصات انحراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوصات الانحراف مراجع SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كاحتياط).
    - إذا لم تكن مصادقة الرمز نشطة فعليًا (`gateway.auth.mode` صريح بالقيمة `password`/`none`/`trusted-proxy`، أو الوضع غير مضبوط حيث يمكن أن تفوز كلمة المرور ولا يمكن لأي مرشح رمز أن يفوز)، تتخطى فحوصات انحراف الرمز حل رمز الإعدادات.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائمًا:

- Gateway البعيد المكوّن لديك (إذا كان مضبوطًا)، و
- localhost (local loopback) **حتى إذا كان البعيد مكوّنًا**.

إذا مررت `--url`، يضاف ذلك الهدف الصريح قبل كليهما. يوسم الإخراج البشري الأهداف على النحو التالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا أمكن الوصول إلى عدة بوابات Gateway، فسيطبعها كلها. بوابات Gateway المتعددة مدعومة عند استخدام ملفات شخصية/منافذ معزولة (مثل بوت إنقاذ)، لكن معظم عمليات التثبيت ما زالت تشغل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="التفسير">
    - `Reachable: yes` يعني أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلّغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع المجس إثباته بشأن المصادقة. وهذا منفصل عن قابلية الوصول.
    - `Read probe: ok` يعني أن استدعاءات RPC لتفاصيل نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - `Read probe: limited - missing scope: operator.read` يعني أن الاتصال نجح لكن RPC بنطاق القراءة محدود. يُبلّغ عن هذا كقابلية وصول **متدهورة**، لا كفشل كامل.
    - `Read probe: failed` بعد `Connect: ok` يعني أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضًا قابلية وصول **متدهورة**، لا Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد المجس استخدام مصادقة الجهاز المخزنة مؤقتًا القائمة لكنه لا ينشئ هوية جهاز لأول مرة أو حالة إقران.
    - يكون رمز الخروج غير صفري فقط عندما لا يمكن الوصول إلى أي هدف مفحوص.

  </Accordion>
  <Accordion title="إخراج JSON">
    المستوى الأعلى:

    - `ok`: يمكن الوصول إلى هدف واحد على الأقل.
    - `degraded`: قبل هدف واحد على الأقل اتصالًا لكنه لم يكمل تشخيصات RPC التفصيلية بالكامل.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف القابلة للوصول (`read_only`، أو `write_capable`، أو `admin_capable`، أو `pairing_pending`، أو `connected_no_operator_scope`، أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه كفائز نشط بهذا الترتيب: عنوان URL صريح، نفق SSH، البعيد المكوّن، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` اختيارية.
    - `network`: تلميحات عناوين URL لـ local loopback/tailnet مشتقة من الإعدادات الحالية وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلية المستخدمة لمرور هذا المجس.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي بالكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب فقدان نطاق المشغل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلّغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف إمكانية المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ عاد الأمر إلى المجسات المباشرة.
    - `multiple_gateways`: كان يمكن الوصول إلى أكثر من هدف واحد؛ هذا غير معتاد إلا إذا كنت تشغل عمدًا ملفات شخصية معزولة، مثل بوت إنقاذ.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مكوّن لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن مجس القراءة كان محدودًا بسبب فقدان `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تطابق تطبيق Mac)

يستخدم وضع "البعيد عبر SSH" في تطبيق macOS إعادة توجيه منفذ محلي بحيث يصبح Gateway البعيد (الذي قد يكون مربوطًا بـ loopback فقط) قابلًا للوصول عند `ws://127.0.0.1:<port>`.

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
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` بالإضافة إلى نطاق واسع النطاق المكوّن، إن وجد). يتم تجاهل تلميحات TXT فقط.
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

### التثبيت باستخدام غلاف

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة من خلال ملف تنفيذي آخر، على سبيل المثال
وسيطة مدير أسرار أو مساعد تشغيل كمستخدم. يتلقى الغلاف معاملات Gateway العادية ويكون
مسؤولًا في النهاية عن تنفيذ `openclaw` أو Node مع تلك المعاملات.

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
ملف قابل للتنفيذ، ويكتب الغلاف في `ProgramArguments` الخاصة بالخدمة، ويثبّت
`OPENCLAW_WRAPPER` في بيئة الخدمة لإعادة التثبيت القسرية اللاحقة والتحديثات وإصلاحات الطبيب.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة غلاف مثبت، امسح `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

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
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل؛ على macOS، يعطل `gateway stop` عمدًا LaunchAgent قبل إيقافه.
    - تقبل أوامر دورة الحياة `--json` للسكربتات.

  </Accordion>
  <Accordion title="المصادقة وSecretRefs وقت التثبيت">
    - عندما تتطلب مصادقة الرمز رمزًا ويكون `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل لكنه لا يثبّت الرمز المحلول في بيانات بيئة الخدمة الوصفية.
    - إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يفشل التثبيت بإغلاق آمن بدلًا من تثبيت نص عادي احتياطي.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـ SecretRef على `--password` المضمن.
    - في وضع المصادقة المستنتج، لا يخفف `OPENCLAW_GATEWAY_PASSWORD` الموجود في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادات دائمة (`gateway.auth.password` أو `env` في الإعدادات) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحةً.

  </Accordion>
</AccordionGroup>

## اكتشاف بوابات Gateway (Bonjour)

يفحص `gateway discover` منارات Gateway (`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Bonjour واسع النطاق): اختر نطاقًا (مثال: `openclaw.internal.`) واضبط DNS مقسمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

فقط بوابات Gateway التي تم تمكين اكتشاف Bonjour لديها (افتراضيًا) تعلن المنارة.

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (اختياري؛ تجعل العملاء أهداف SSH الافتراضية إلى `22` عند غيابه)
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
  إخراج قابل للقراءة آليًا (يعطل أيضًا التنسيق/المؤشر الدوار).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI `local.` بالإضافة إلى المجال واسع النطاق المُهيأ عند تمكينه.
- يُشتق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة المحلولة، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS ضمن `local.`، لا يُبث `sshPort` و`cliPath` إلا عندما تكون `discovery.mdns.mode` مضبوطة على `full`. ما زال DNS-SD واسع النطاق يكتب `cliPath`؛ ويبقى `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
