---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateways عبر Bonjour (DNS-SD محلي + واسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل البوابات والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-07-01T05:43:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80f329ebd154f6fd0e87869c498c58fc6d5276a21934f8a36837653bd68a2d22
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العُقد، الجلسات، الخطافات). توجد الأوامر الفرعية في هذه الصفحة ضمن `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS محلي + DNS-SD واسع النطاق.
  </Card>
  <Card title="نظرة عامة على الاكتشاف" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن البوابات ويعثر عليها.
  </Card>
  <Card title="الإعدادات" href="/ar/gateway/configuration">
    مفاتيح إعداد Gateway ذات المستوى الأعلى.
  </Card>
</CardGroup>

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

اسم مستعار للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - افتراضيًا، يرفض Gateway البدء ما لم يتم تعيين `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` لعمليات التشغيل المؤقتة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كإعداد معطوب أو تم استبداله وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقود، يتعامل Gateway مع ذلك كضرر مشبوه في الإعدادات ويرفض "تخمين المحلي" نيابةً عنك.
    - يتم حظر الربط خارج loopback من دون مصادقة (حاجز أمان).
    - يتم حاليًا حل `lan` و`tailnet` و`custom` عبر مسارات BYOH تعمل بـ IPv4 فقط.
    - لا يُدعم BYOH المعتمد على IPv6 فقط بشكل أصلي في هذا المسار اليوم. استخدم مكوّنًا جانبيًا أو وكيلًا لـ IPv4 إذا كان المضيف نفسه يعمل بـ IPv6 فقط.
    - يطلق `SIGUSR1` إعادة تشغيل داخل العملية عند التفويض (`commands.restart` مفعّل افتراضيًا؛ عيّن `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء تطبيق/تحديث أداة Gateway وإعداداته مسموحًا).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI باستخدام TUI أو إدخال بوضع خام، فاستعد الطرفية قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من الإعدادات/البيئة؛ عادةً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  وضع ربط المستمع. يتم حاليًا حل `lan` و`tailnet` و`custom` عبر مسارات تعمل بـ IPv4 فقط.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  تجاوز وضع المصادقة.
</ParamField>
<ParamField path="--token <token>" type="string">
  تجاوز الرمز المميز (يعيّن أيضًا `OPENCLAW_GATEWAY_TOKEN` للعملية).
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
  إعادة تعيين إعداد Tailscale serve/funnel عند إيقاف التشغيل.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  يتوقع عنوان IPv4 اليوم. بالنسبة إلى BYOH المعتمد على IPv6 فقط، ضع مكوّنًا جانبيًا أو وكيلًا لـ IPv4 أمام Gateway ووجّه OpenClaw إلى نقطة نهاية IPv4 تلك.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway دون `gateway.mode=local` في الإعدادات. يتجاوز حاجز بدء التشغيل للتمهيد المؤقت/التطويري فقط؛ ولا يكتب ملف الإعدادات أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء إعداد تطوير + مساحة عمل إذا كانا مفقودين (يتخطى BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة تعيين إعداد التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  إنهاء أي مستمع موجود على المنفذ المحدد قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  سجلات مفصلة.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  إظهار سجلات الواجهة الخلفية لـ CLI فقط في وحدة التحكم (وتفعيل stdout/stderr).
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
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

يطلب `openclaw gateway restart --safe` من Gateway العامل إجراء فحص تمهيدي للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد تصريف العمل النشط. تنتظر إعادة التشغيل الآمنة الافتراضية العمل النشط حتى مدة `gateway.reload.deferralTimeoutMs` المضبوطة (الافتراضي 5 دقائق)؛ وعند انتهاء تلك الميزانية تُفرض إعادة التشغيل. عيّن `gateway.reload.deferralTimeoutMs` إلى `0` لانتظار آمن غير محدد لا يفرض أبدًا. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي؛ ويظل `--force` مسار التجاوز الفوري.

يشغّل `openclaw gateway restart --safe --skip-deferral` إعادة التشغيل المنسقة نفسها الواعية بـ OpenClaw مثل `--safe`، لكنه يتجاوز بوابة تأجيل العمل النشط بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. استخدمه كمخرج طوارئ للمشغّل عندما يكون التأجيل مثبتًا بسبب تشغيل مهمة عالق وقد يكون `--safe` وحده مقيدًا بـ `gateway.reload.deferralTimeoutMs`. يتطلب `--skip-deferral` الخيار `--safe`.

<Warning>
قد تظهر `--password` المضمنة في قوائم العمليات المحلية. فضّل `--password-file` أو البيئة أو `gateway.auth.password` مدعومًا بـ SecretRef.
</Warning>

### تحليل أداء Gateway

- عيّن `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جداول بحث Plugin للفهرس المثبت وسجل البيان وتخطيط بدء التشغيل وعمل خريطة المالك.
- عيّن `OPENCLAW_GATEWAY_RESTART_TRACE=1` لتسجيل أسطر `restart trace:` الخاصة بإعادة التشغيل لمعالجة إشارة إعادة التشغيل، وتصريف العمل النشط، ومراحل الإيقاف، والبدء التالي، وتوقيت الجاهزية، ومقاييس الذاكرة.
- عيّن `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة مخطط زمني لتشخيصات بدء التشغيل بصيغة JSONL وبأفضل جهد لأطر QA الخارجية. يمكنك أيضًا تفعيل العلامة باستخدام `diagnostics.flags: ["timeline"]` في الإعدادات؛ يظل المسار مقدمًا عبر البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm build` أولًا، ثم `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس بدء Gateway مقابل مدخل CLI المبني. يسجل القياس أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جدول بحث Plugin.
- شغّل `pnpm build` أولًا، ثم `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` لقياس إعادة تشغيل Gateway داخل العملية مقابل مدخل CLI المبني على macOS أو Linux. يستخدم قياس إعادة التشغيل SIGUSR1، ويفعّل تتبعي بدء التشغيل وإعادة التشغيل في العملية الفرعية، ويسجل `/healthz` التالي، و`/readyz` التالي، ووقت التعطل، وتوقيت الجاهزية، وCPU، وRSS، ومقاييس تتبع إعادة التشغيل.
- تعامل مع `/healthz` كمؤشر حياة و`/readyz` كجاهزية قابلة للاستخدام. أسطر التتبع ومخرجات القياس مخصصة لإسناد الملكية؛ لا تعتبر امتداد تتبع واحدًا أو عينة واحدة استنتاجًا كاملًا عن الأداء.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: مقروء للبشر (ملون في TTY).
    - `--json`: JSON مقروء آليًا (دون تنسيق/مؤشر دوران).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على تخطيط العرض البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway.
    - `--token <token>`: رمز Gateway.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند تعيين `--url`، لا يرجع CLI إلى بيانات اعتماد الإعدادات أو البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

نقطة نهاية HTTP `/healthz` هي مسبار حياة: تعود بمجرد أن يستطيع الخادم الإجابة عبر HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتظل حمراء بينما لا تزال مكونات Plugin الجانبية عند بدء التشغيل أو القنوات أو الخطافات المضبوطة في طور الاستقرار. تتضمن استجابات الجاهزية التفصيلية المحلية أو المصادق عليها كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة أنوية CPU، وعلامة `degraded`.

<ParamField path="--port <port>" type="number">
  استهدف local loopback Gateway على هذا المنفذ. يتجاوز هذا `OPENCLAW_GATEWAY_URL` و`OPENCLAW_GATEWAY_PORT` لاستدعاء الصحة.
</ParamField>

### `gateway usage-cost`

اجلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  عدد الأيام المراد تضمينها.
</ParamField>
<ParamField path="--agent <id>" type="string">
  حصر ملخص التكلفة في معرّف وكيل واحد مضبوط.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  تجميع ملخص التكلفة عبر جميع الوكلاء المضبوطين. لا يمكن دمجه مع `--agent`.
</ParamField>

### `gateway stability`

اجلب مسجل الاستقرار التشخيصي الأخير من Gateway قيد التشغيل.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  الحد الأقصى لعدد الأحداث الأخيرة المراد تضمينها (الحد الأقصى `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث بعد رقم تسلسل تشخيصي فقط.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON لحزمة مباشرة.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات دعم قابلة للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزم">
    - تحتفظ السجلات بالبيانات الوصفية التشغيلية: أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، ومعرّفات الموافقة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقحة. لا تحتفظ بنص المحادثة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلب أو الاستجابة الخام، أو الرموز، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. عيّن `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند خروج Gateway الفادح، ومهل الإيقاف، وفشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما تكون لدى المسجل أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ تنطبق `--limit` و`--type` و`--since-seq` أيضًا على إخراج الحزمة.

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
  مسار ملف zip الناتج. يكون افتراضيًا تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقّاة المطلوب تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المطلوب فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL الخاص بـ Gateway WebSocket للقطة السلامة.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway للقطة السلامة.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway للقطة السلامة.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلة لقطة الحالة/السلامة.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  تخطَّ البحث عن حزمة الاستقرار المحفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع المسار المكتوب والحجم والبيان بصيغة JSON.
</ParamField>

يحتوي التصدير على بيان وملخص Markdown وشكل الإعدادات وتفاصيل إعدادات منقّاة وملخصات سجلات منقّاة ولقطات حالة/سلامة Gateway منقّاة وأحدث حزمة استقرار عند وجودها.

الغرض منه هو مشاركته. يحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجلات OpenClaw الآمنة وأسماء الأنظمة الفرعية ورموز الحالة والمدد والأوضاع المضبوطة والمنافذ ومعرّفات Plugin ومعرّفات المزوّدين وإعدادات الميزات غير السرية ورسائل السجل التشغيلية المنقّحة. ويحذف أو ينقّح نصوص المحادثات ونصوص webhook ومخرجات الأدوات وبيانات الاعتماد وملفات تعريف الارتباط ومعرّفات الحسابات/الرسائل ونصوص المطالبات/التعليمات وأسماء المضيفين والقيم السرية. عندما تبدو رسالة بأسلوب LogTape كنص حمولة مستخدم/محادثة/أداة، يحتفظ التصدير فقط بأن رسالة حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway ‏(launchd/systemd/schtasks) مع فحص اختياري لقدرة الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  أضف هدف فحص صريحًا. سيظل فحص الهدف البعيد المضبوط وlocalhost قائمًا.
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
  افحص خدمات مستوى النظام أيضًا.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ارفع فحص الاتصال الافتراضي إلى فحص قراءة واخرج برمز غير صفري عند فشل فحص القراءة هذا. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل `gateway status` متاحًا للتشخيص حتى عندما تكون إعدادات CLI المحلية مفقودة أو غير صالحة.
    - يثبت `gateway status` الافتراضي حالة الخدمة واتصال WebSocket وقدرة المصادقة المرئية وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - فحوص التشخيص غير مُغيِّرة لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخبأ موجود عند توفره، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل اقتران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs الخاصة بالمصادقة المضبوطة لمصادقة الفحص عندما يكون ذلك ممكنًا.
    - إذا تعذر حل SecretRef مطلوب للمصادقة في مسار هذا الأمر، يبلّغ `gateway status --json` عن `rpc.authWarning` عند فشل اتصال/مصادقة الفحص؛ مرّر `--token`/`--password` صراحةً أو عالج مصدر السر أولًا.
    - إذا نجح الفحص، تُكتم تحذيرات مرجع المصادقة غير المحلول لتجنب النتائج الإيجابية الكاذبة.
    - عند تفعيل الفحص، يتضمن خرج JSON ‏`gateway.version` عندما يبلّغ Gateway الجاري عنه؛ يمكن لـ `--require-rpc` الرجوع إلى حمولة RPC ‏`status.runtimeVersion` إذا لم يستطع فحص المصافحة اللاحق توفير بيانات تعريف الإصدار.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع وتحتاج أيضًا إلى أن تكون استدعاءات RPC بنطاق القراءة سليمة.
    - يضيف `--deep` فحصًا بأفضل جهد لعمليات تثبيت launchd/systemd/schtasks الإضافية. عند اكتشاف عدة خدمات شبيهة بـ gateway، يطبع الخرج البشري تلميحات تنظيف ويحذر من أن معظم الإعدادات يجب أن تشغّل gateway واحدًا لكل جهاز.
    - يبلّغ `--deep` أيضًا عن تسليم حديث لإعادة تشغيل مشرف Gateway عندما تخرج عملية الخدمة بنظافة لإعادة تشغيل مشرف خارجي.
    - يشغّل `--deep` تحقق الإعدادات في وضع مدرك للـ Plugin ‏(`pluginValidation: "full"`) ويعرض تحذيرات بيان Plugin المضبوط (مثل غياب بيانات تعريف إعدادات القناة) حتى تلتقطها فحوص تثبيت وتحديث smoke. يحافظ `gateway status` الافتراضي على مسار القراءة فقط السريع الذي يتخطى تحقق Plugin.
    - يتضمن الخرج البشري مسار ملف السجل المحلول مع لقطة مسارات/صلاحية إعدادات CLI مقابل الخدمة للمساعدة في تشخيص انحراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوص انحراف مصادقة Linux systemd">
    - في عمليات تثبيت Linux systemd، تقرأ فحوص انحراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوص الانحراف مراجع SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كرجوع احتياطي).
    - إذا لم تكن مصادقة الرمز فعالة فعليًا (`gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو الوضع غير مضبوط حيث يمكن لكلمة المرور أن تفوز ولا يمكن لأي مرشح رمز أن يفوز)، تتخطى فحوص انحراف الرمز حل رمز الإعدادات.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائمًا:

- gateway البعيد المضبوط لديك (إن كان مضبوطًا)، و
- localhost ‏(local loopback) **حتى إذا كان البعيد مضبوطًا**.

إذا مرّرت `--url`، تتم إضافة ذلك الهدف الصريح قبل كليهما. يضع الخرج البشري تسميات للأهداف كالتالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا أمكن الوصول إلى عدة أهداف فحص، يطبعها كلها. يمكن لنفق SSH وعنوان URL الخاص بـ TLS/proxy وعنوان URL البعيد المضبوط أن تشير كلها إلى gateway نفسه حتى عندما تختلف منافذ النقل بينها؛ `multiple_gateways` مخصص للـ gateways المميزة أو التي يلتبس تمييز هويتها ويمكن الوصول إليها. تُدعم عدة gateways عند استخدام ملفات شخصية معزولة (مثل بوت إنقاذ)، لكن معظم عمليات التثبيت ما زالت تشغّل gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  استخدم هذا المنفذ لهدف فحص local loopback ومنفذ نفق SSH البعيد. من دون `--url`، يختار هذا هدف local loopback بدلًا من عنوان URL بيئة gateway المضبوطة أو منفذ البيئة أو الأهداف البعيدة.
</ParamField>

<AccordionGroup>
  <Accordion title="التفسير">
    - يعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلّغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع الفحص إثباته بشأن المصادقة. وهذا منفصل عن قابلية الوصول.
    - يعني `Read probe: ok` أن استدعاءات RPC التفصيلية بنطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - يعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC بنطاق القراءة محدود. يُبلَّغ عن ذلك كقابلية وصول **متدهورة**، وليس فشلًا كاملًا.
    - يعني `Read probe: failed` بعد `Connect: ok` أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضًا قابلية وصول **متدهورة**، وليس Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة الجهاز المخبأة الموجودة لكنه لا ينشئ هوية جهاز أولية أو حالة اقتران.
    - يكون رمز الخروج غير صفري فقط عندما لا يكون أي هدف مفحوص قابلًا للوصول.

  </Accordion>
  <Accordion title="خرج JSON">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: هدف واحد على الأقل قبل اتصالًا لكنه لم يكمل تشخيصات RPC التفصيلية كاملة.
    - `capability`: أفضل قدرة شوهدت عبر الأهداف القابلة للوصول (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
    - `primaryTargetId`: أفضل هدف يجب التعامل معه كالفائز النشط بهذا الترتيب: عنوان URL الصريح، ثم نفق SSH، ثم البعيد المضبوط، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` اختيارية.
    - `network`: تلميحات عناوين URL الخاصة بـ local loopback/tailnet المستمدة من الإعدادات الحالية وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلي المستخدم في مرور الفحص هذا.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب غياب نطاق المشغّل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلّغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف قدرة المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ رجع الأمر إلى الفحوص المباشرة.
    - `multiple_gateways`: كانت هويات gateway مميزة قابلة للوصول، أو لم يستطع OpenClaw إثبات أن الأهداف القابلة للوصول هي gateway نفسه. لا يؤدي نفق SSH أو عنوان URL الخاص بالبروكسي أو عنوان URL البعيد المضبوط إلى gateway نفسه إلى تشغيل هذا التحذير.
    - `auth_secretref_unresolved`: تعذر حل SecretRef لمصادقة مضبوطة لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب غياب `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "البعيد عبر SSH" في تطبيق macOS تحويل منفذ محلي بحيث يصبح gateway البعيد (الذي قد يكون مربوطًا بـ loopback فقط) قابلًا للوصول عند `ws://127.0.0.1:<port>`.

مكافئ CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` أو `user@host:port` (يكون المنفذ افتراضيًا `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  ملف الهوية.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  اختر أول مضيف gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` بالإضافة إلى نطاق النطاق الواسع المضبوط، إن وجد). يتم تجاهل تلميحات TXT فقط.
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
  عنوان URL الخاص بـ Gateway WebSocket.
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

### التثبيت باستخدام غلاف

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة عبر ملف تنفيذي آخر، مثل غلاف مدير
الأسرار أو مساعد التشغيل كمستخدم آخر. يتلقى الغلاف وسيطات Gateway العادية ويكون
مسؤولًا في النهاية عن تنفيذ `openclaw` أو Node بتلك الوسيطات.

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

يمكنك أيضًا تعيين الغلاف من خلال البيئة. يتحقق `gateway install` من أن المسار
ملف قابل للتنفيذ، ويكتب الغلاف في `ProgramArguments` الخاصة بالخدمة، ويثبت
`OPENCLAW_WRAPPER` في بيئة الخدمة لعمليات إعادة التثبيت القسرية والتحديثات وإصلاحات doctor لاحقًا.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة غلاف محفوظ، امسح `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="خيارات الأوامر">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="سلوك دورة الحياة">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل.
    - على macOS، يستخدم `gateway stop` الأمر `launchctl bootout` افتراضيًا، ما يزيل LaunchAgent من جلسة الإقلاع الحالية دون تثبيت التعطيل — يبقى الاسترداد التلقائي عبر KeepAlive نشطًا للأعطال المستقبلية، ويعيد `gateway start` التمكين بشكل نظيف دون `launchctl enable` يدوي. مرر `--disable` لتعطيل KeepAlive وRunAtLoad بشكل دائم بحيث لا يعاود Gateway الظهور حتى أمر `gateway start` الصريح التالي؛ استخدم هذا عندما يجب أن يستمر الإيقاف اليدوي بعد عمليات إعادة الإقلاع أو إعادة تشغيل النظام.
    - يطلب `gateway restart --safe` من Gateway الجاري إجراء فحص مسبق للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد انتهاء العمل النشط. تنتظر إعادة التشغيل الآمنة الافتراضية العمل النشط حتى مدة `gateway.reload.deferralTimeoutMs` المضبوطة (الافتراضي 5 دقائق)؛ وعند انتهاء تلك المهلة تُفرض إعادة التشغيل. عيّن `gateway.reload.deferralTimeoutMs` إلى `0` لانتظار آمن غير محدد لا يفرض أبدًا. لا يمكن دمج `--safe` مع `--force` أو `--wait`.
    - يتجاوز `gateway restart --wait 30s` ميزانية انتظار تصريف إعادة التشغيل المضبوطة لتلك الإعادة. الأرقام المجردة هي بالمللي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير محدد.
    - يشغل `gateway restart --safe --skip-deferral` إعادة التشغيل الآمنة المدركة لـ OpenClaw لكنه يتجاوز بوابة التأجيل بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. هذا مخرج طارئ للمشغل لتأجيلات تشغيل المهام العالقة؛ ويتطلب `--safe`.
    - يتخطى `gateway restart --force` تصريف العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغل قد فحص بالفعل عوائق المهام المدرجة ويريد عودة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للبرمجة النصية.

  </Accordion>
  <Accordion title="المصادقة وSecretRefs وقت التثبيت">
    - عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل لكنه لا يثبت الرمز المحلول في بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef الخاص بالرمز المضبوط غير محلول، يفشل التثبيت بإغلاق آمن بدلًا من تثبيت نص عادي احتياطي.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـ SecretRef على `--password` المضمّنة.
    - في وضع المصادقة المستنتج، لا يخفف `OPENCLAW_GATEWAY_PASSWORD` الموجود في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعدادات) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير معين، يُحظر التثبيت حتى يُعيّن الوضع صراحةً.

  </Accordion>
</AccordionGroup>

## اكتشاف البوابات (Bonjour)

يفحص `gateway discover` إشارات Gateway (`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Bonjour واسع النطاق): اختر نطاقًا (مثال: `openclaw.internal.`) وأعدّ DNS مقسمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

فقط البوابات التي لديها اكتشاف Bonjour مفعّل (افتراضيًا) تعلن الإشارة.

يمكن أن تتضمن سجلات الاكتشاف واسع النطاق تلميحات TXT هذه:

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (وضع الاكتشاف الكامل فقط؛ تعتمد العملاء أهداف SSH الافتراضية إلى `22` عند غيابه)
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
  إخراج قابل للقراءة آليًا (يعطل أيضًا التنسيق/مؤشر التحميل).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` بالإضافة إلى النطاق واسع النطاق المضبوط عند تفعيله.
- `wsUrl` في إخراج JSON مشتق من نقطة نهاية الخدمة المحلولة، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- على mDNS للنطاق `local.` وDNS-SD واسع النطاق، لا يُنشر `sshPort` و`cliPath` إلا عندما يكون `discovery.mdns.mode` هو `full`.

</Note>

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
