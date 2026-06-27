---
read_when:
    - تشغيل Gateway من CLI (التطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateway عبر Bonjour (DNS-SD المحلي وواسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل Gateway والاستعلام عنه واكتشافه
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العقد، الجلسات، الخطافات). توجد الأوامر الفرعية في هذه الصفحة ضمن `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS محلي + DNS-SD واسع النطاق.
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

اسم مستعار للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - افتراضيًا، يرفض Gateway البدء ما لم يتم ضبط `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المؤقتة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كتكوين معطّل أو مستبدل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقود، يتعامل Gateway مع ذلك كتلف مريب في التكوين ويرفض "تخمين المحلي" نيابة عنك.
    - الربط خارج loopback بدون مصادقة محظور (حاجز أمان).
    - تتحلل `lan` و`tailnet` و`custom` حاليًا عبر مسارات BYOH لـ IPv4 فقط.
    - BYOH لـ IPv6 فقط غير مدعوم أصليًا على هذا المسار اليوم. استخدم sidecar أو proxy لـ IPv4 إذا كان المضيف نفسه يعمل بـ IPv6 فقط.
    - يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند التصريح بذلك (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، بينما يظل تطبيق/تحديث أداة/تكوين Gateway مسموحًا).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI باستخدام TUI أو إدخال raw-mode، فاستعد الطرفية قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من التكوين/البيئة؛ عادةً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  وضع ربط المستمع. تتحلل `lan` و`tailnet` و`custom` حاليًا عبر مسارات IPv4 فقط.
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
  اقرأ كلمة مرور Gateway من ملف.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  اعرض Gateway عبر Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  أعد ضبط تكوين serve/funnel في Tailscale عند إيقاف التشغيل.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  يتوقع عنوان IPv4 اليوم. بالنسبة إلى BYOH لـ IPv6 فقط، ضع sidecar أو proxy لـ IPv4 أمام Gateway ووجّه OpenClaw إلى نقطة نهاية IPv4 تلك.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اسمح ببدء Gateway بدون `gateway.mode=local` في التكوين. يتجاوز حاجز بدء التشغيل للتمهيد المؤقت/التطويري فقط؛ ولا يكتب ملف التكوين أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  أنشئ تكوين تطوير + مساحة عمل إذا كانا مفقودين (يتخطى BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  أعد ضبط تكوين التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  أنهِ أي مستمع موجود على المنفذ المحدد قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  سجلات تفصيلية.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  اعرض فقط سجلات خلفية CLI في وحدة التحكم (وفعّل stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  نمط سجل WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  اسم مستعار لـ `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  سجّل أحداث دفق النموذج الخام إلى jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسار jsonl للدفق الخام.
</ParamField>

## إعادة تشغيل Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

يطلب `openclaw gateway restart --safe` من Gateway الجاري تشغيله إجراء فحص مسبق لعمل OpenClaw النشط قبل إعادة التشغيل. إذا كانت العمليات في قائمة الانتظار، أو تسليم الردود، أو التشغيلات المضمّنة، أو تشغيلات المهام نشطة، يبلّغ Gateway عن العوائق، ويدمج طلبات إعادة التشغيل الآمنة المكررة، ويعيد التشغيل بعد تصريف العمل النشط. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي للتوافق. استخدم `--force` فقط عندما تريد صراحةً مسار التجاوز الفوري.

يشغّل `openclaw gateway restart --safe --skip-deferral` نفس إعادة التشغيل المنسقة والمدركة لـ OpenClaw مثل `--safe`، لكنه يتجاوز بوابة تأجيل العمل النشط بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. استخدمه كمخرج طوارئ للمشغّل عندما يكون التأجيل مثبتًا بسبب تشغيل مهمة عالق وكان `--safe` وحده سينتظر إلى أجل غير مسمى. يتطلب `--skip-deferral` الخيار `--safe`.

<Warning>
يمكن كشف `--password` المضمّن في قوائم العمليات المحلية. فضّل `--password-file` أو البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### توصيف أداء Gateway

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جدول بحث Plugin للفهرس المثبّت، وسجل البيانات الوصفية، وتخطيط بدء التشغيل، وعمل خريطة المالكين.
- اضبط `OPENCLAW_GATEWAY_RESTART_TRACE=1` لتسجيل أسطر `restart trace:` ضمن نطاق إعادة التشغيل لمعالجة إشارة إعادة التشغيل، وتصريف العمل النشط، ومراحل إيقاف التشغيل، والبدء التالي، وتوقيت الجاهزية، ومقاييس الذاكرة.
- اضبط `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة مخطط زمني لتشخيصات بدء التشغيل بصيغة JSONL وبأفضل جهد من أجل حِزم QA الخارجية. يمكنك أيضًا تفعيل العلامة باستخدام `diagnostics.flags: ["timeline"]` في التكوين؛ يظل المسار مقدّمًا من البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات event-loop.
- شغّل `pnpm build` أولًا، ثم `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس بدء Gateway مقابل مدخل CLI المبني. يسجل المعيار أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخير event-loop، وتفاصيل توقيت جدول بحث Plugin.
- شغّل `pnpm build` أولًا، ثم `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` لقياس إعادة تشغيل Gateway داخل العملية مقابل مدخل CLI المبني على macOS أو Linux. يستخدم معيار إعادة التشغيل SIGUSR1، ويفعّل تتبعي بدء التشغيل وإعادة التشغيل في العملية الفرعية، ويسجل `/healthz` التالي، و`/readyz` التالي، ووقت التوقف، وتوقيت الجاهزية، وCPU، وRSS، ومقاييس تتبع إعادة التشغيل.
- تعامل مع `/healthz` كمؤشر حياة و`/readyz` كجاهزية قابلة للاستخدام. أسطر التتبع ومخرجات القياس مخصصة لإسناد المالك؛ لا تتعامل مع مدى تتبع واحد أو عينة واحدة كاستنتاج أداء كامل.

## الاستعلام عن Gateway جارٍ

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: مقروء للبشر (ملوّن في TTY).
    - `--json`: JSON قابل للقراءة آليًا (بدون تنسيق/spinner).
    - `--no-color` (أو `NO_COLOR=1`): عطّل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway.
    - `--token <token>`: رمز Gateway المميز.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
    - `--expect-final`: انتظر استجابة "final" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عندما تضبط `--url`، لا يعود CLI إلى بيانات اعتماد التكوين أو البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة يُعد خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

نقطة نهاية HTTP `/healthz` هي مسبار حياة: تعود بمجرد أن يتمكن الخادم من الرد على HTTP. نقطة نهاية HTTP `/readyz` أكثر صرامة وتبقى حمراء بينما لا تزال sidecars الخاصة بـ Plugin عند بدء التشغيل، أو القنوات، أو الخطافات المكوّنة تستقر. تتضمن استجابات الجاهزية التفصيلية المحلية أو المصادق عليها كتلة تشخيص `eventLoop` مع تأخير event-loop، واستخدام event-loop، ونسبة نواة CPU، وعلامة `degraded`.

<ParamField path="--port <port>" type="number">
  استهدف Gateway محليًا عبر local loopback على هذا المنفذ. يتجاوز هذا `OPENCLAW_GATEWAY_URL` و`OPENCLAW_GATEWAY_PORT` لاستدعاء الصحة.
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
  احصر ملخص التكلفة في معرّف وكيل واحد مكوّن.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  اجمع ملخص التكلفة عبر جميع الوكلاء المكوّنين. لا يمكن دمجه مع `--agent`.
</ParamField>

### `gateway stability`

اجلب مسجل استقرار التشخيصات الحديثة من Gateway جارٍ.

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
  رشّح حسب نوع حدث التشخيص، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  ضمّن فقط الأحداث التي تلي رقم تسلسل تشخيصي.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  اقرأ حزمة استقرار مستمرة بدلًا من استدعاء Gateway الجاري. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON للحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  اكتب ملف zip لتشخيصات دعم قابلة للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزم">
    - تحتفظ السجلات ببيانات تعريف تشغيلية: أسماء الأحداث، والعدادات، وأحجام البايت، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، وملخصات جلسات منقّحة. لا تحتفظ بنص الدردشة، أو أجسام webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند خروجات Gateway الفادحة، ومهل إيقاف التشغيل، وفشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ ينطبق `--limit` و`--type` و`--since-seq` أيضًا على إخراج الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip للتشخيصات المحلية مصممًا لإرفاقه بتقارير الأخطاء. للاطلاع على نموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. القيمة الافتراضية هي تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقّاة المراد تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المراد فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway للقطة الحالة الصحية.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway للقطة الحالة الصحية.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway للقطة الحالة الصحية.
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

يحتوي التصدير على بيان، وملخص Markdown، وشكل الإعدادات، وتفاصيل إعدادات منقّاة، وملخصات سجلات منقّاة، ولقطات منقّاة لحالة/صحة Gateway، وأحدث حزمة استقرار عند وجودها.

الغرض منه أن تتم مشاركته. وهو يحتفظ بتفاصيل تشغيلية تساعد على تصحيح الأخطاء، مثل حقول سجل OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المهيأة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقّحة. ويحذف أو ينقّح نصوص المحادثة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحسابات/الرسائل، ونصوص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/محادثة/أداة، يحتفظ التصدير فقط بإشارة إلى أن الرسالة حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway (launchd/systemd/schtasks) بالإضافة إلى فحص اختياري لقدرة الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  أضف هدف فحص صريحًا. لا يزال يتم فحص البعيد المهيأ + localhost.
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
  رقِّ فحص الاتصال الافتراضي إلى فحص قراءة واخرج برمز غير صفري عندما يفشل فحص القراءة هذا. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل `gateway status` متاحًا للتشخيص حتى عندما تكون إعدادات CLI المحلية مفقودة أو غير صالحة.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وقدرة المصادقة الظاهرة وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - فحوص التشخيص لا تُحدث تغييرات لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مخزّنًا مؤقتًا عند وجوده، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs الخاصة بالمصادقة المهيأة لمصادقة الفحص عندما يكون ذلك ممكنًا.
    - إذا تعذر حل SecretRef مصادقة مطلوب في مسار هذا الأمر، يبلغ `gateway status --json` عن `rpc.authWarning` عند فشل اتصال/مصادقة الفحص؛ مرّر `--token`/`--password` صراحةً أو حل مصدر السر أولًا.
    - إذا نجح الفحص، تُخفى تحذيرات مراجع المصادقة غير المحلولة لتجنب الإيجابيات الكاذبة.
    - عند تمكين الفحص، يتضمن خرج JSON الحقل `gateway.version` عندما يبلغ Gateway المشغّل عنه؛ يمكن لـ `--require-rpc` الرجوع إلى حمولة RPC `status.runtimeVersion` إذا تعذر على فحص المصافحة اللاحق توفير بيانات وصفية للإصدار.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكون الخدمة المستمعة كافية وتحتاج أيضًا إلى سلامة استدعاءات RPC بنطاق القراءة.
    - يضيف `--deep` فحصًا بأفضل جهد لتثبيتات launchd/systemd/schtasks إضافية. عند اكتشاف عدة خدمات شبيهة بـ Gateway، يطبع الخرج البشري تلميحات تنظيف ويحذر من أن معظم الإعدادات ينبغي أن تشغّل Gateway واحدًا لكل جهاز.
    - يبلغ `--deep` أيضًا عن تسليم حديث لإعادة تشغيل مشرف Gateway عندما تخرج عملية الخدمة بنظافة من أجل إعادة تشغيل بواسطة مشرف خارجي.
    - يشغّل `--deep` التحقق من الإعدادات في وضع مدرك لـ Plugin (`pluginValidation: "full"`) ويعرض تحذيرات بيانات Plugin المهيأة (مثل فقدان بيانات وصفية لإعدادات القناة) لكي تلتقطها فحوص التثبيت والتحديث السريعة. يحافظ `gateway status` الافتراضي على مسار القراءة فقط السريع الذي يتخطى التحقق من Plugin.
    - يتضمن الخرج البشري مسار سجل الملف المحلول بالإضافة إلى لقطة مسارات/صلاحية إعدادات CLI مقابل الخدمة للمساعدة في تشخيص انحراف الملف الشخصي أو دليل الحالة.

  </Accordion>
  <Accordion title="فحوص انحراف المصادقة في Linux systemd">
    - في تثبيتات Linux systemd، تقرأ فحوص انحراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
    - تحل فحوص الانحراف مراجع SecretRefs لـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كاحتياط).
    - إذا لم تكن مصادقة الرمز نشطة فعليًا (قيمة `gateway.auth.mode` صريحة هي `password`/`none`/`trusted-proxy`، أو الوضع غير مضبوط حيث يمكن أن تفوز كلمة المرور ولا يوجد مرشح رمز يمكنه الفوز)، تتخطى فحوص انحراف الرمز حل رمز الإعدادات.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". وهو يفحص دائمًا:

- Gateway البعيد المهيأ لديك (إذا كان مضبوطًا)، و
- localhost (loopback) **حتى إذا كان البعيد مهيأً**.

إذا مررت `--url`، تتم إضافة ذلك الهدف الصريح قبل كليهما. يضع الخرج البشري تسميات للأهداف كالتالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا أمكن الوصول إلى عدة أهداف فحص، فإنه يطبعها جميعًا. يمكن لنفق SSH، وعنوان URL لـ TLS/الوكيل، وعنوان URL البعيد المهيأ أن تشير كلها إلى Gateway نفسه حتى عندما تختلف منافذ النقل الخاصة بها؛ يُحجز `multiple_gateways` للبوابات القابلة للوصول المميزة أو الملتبسة الهوية. تُدعم عدة بوابات عندما تستخدم ملفات شخصية معزولة (مثل بوت إنقاذ)، لكن معظم التثبيتات لا تزال تشغّل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  استخدم هذا المنفذ لهدف فحص local loopback ومنفذ نفق SSH البعيد. بدون `--url`، يحدد هذا هدف local loopback بدلًا من عنوان URL لبيئة Gateway المهيأة، أو منفذ البيئة، أو الأهداف البعيدة.
</ParamField>

<AccordionGroup>
  <Accordion title="التفسير">
    - تعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع الفحص إثباته بشأن المصادقة. وهو منفصل عن قابلية الوصول.
    - تعني `Read probe: ok` أن استدعاءات RPC لتفاصيل نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - تعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC بنطاق القراءة محدود. يتم الإبلاغ عن هذا كقابلية وصول **متدهورة**، وليس فشلًا كاملًا.
    - تعني `Read probe: failed` بعد `Connect: ok` أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضًا قابلية وصول **متدهورة**، وليس Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة الجهاز المخزنة مؤقتًا لكنه لا ينشئ هوية جهاز لأول مرة أو حالة إقران.
    - يكون رمز الخروج غير صفري فقط عندما لا يكون أي هدف مفحوص قابلًا للوصول.

  </Accordion>
  <Accordion title="خرج JSON">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: هدف واحد على الأقل قبل اتصالًا لكنه لم يكمل تشخيصات RPC التفصيلية كاملة.
    - `capability`: أفضل قدرة شوهدت عبر الأهداف القابلة للوصول (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه كالفائز النشط بهذا الترتيب: عنوان URL الصريح، نفق SSH، البعيد المهيأ، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` اختياريًا.
    - `network`: تلميحات عنوان URL لـ local loopback/tailnet مشتقة من الإعدادات الحالية وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعليان المستخدمان في مرور الفحص هذا.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب فقدان نطاق المشغّل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلغ عنه في `hello-ok` عندما يكون متاحًا.
    - `scopes`: النطاقات الممنوحة المبلغ عنها في `hello-ok` عندما تكون متاحة.
    - `capability`: تصنيف قدرة المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ رجع الأمر إلى الفحوص المباشرة.
    - `multiple_gateways`: كانت هويات Gateway مميزة قابلة للوصول، أو لم يتمكن OpenClaw من إثبات أن الأهداف القابلة للوصول هي Gateway نفسه. لا يطلق نفق SSH أو عنوان URL للوكيل أو عنوان URL البعيد المهيأ إلى Gateway نفسه هذا التحذير.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مهيأ لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب فقدان `operator.read`.

  </Accordion>
</AccordionGroup>

#### الاتصال عن بُعد عبر SSH (توافق تطبيق Mac)

يستخدم وضع "الاتصال عن بُعد عبر SSH" في تطبيق macOS إعادة توجيه منفذ محلية بحيث يصبح Gateway البعيد (الذي قد يكون مربوطًا بالـ loopback فقط) قابلًا للوصول على `ws://127.0.0.1:<port>`.

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
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` بالإضافة إلى نطاق المنطقة الواسعة المهيأ، إن وجد). يتم تجاهل تلميحات TXT فقط.
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
  مخصص أساسًا لاستدعاءات RPC بنمط الوكيل التي تبث أحداثًا وسيطة قبل حمولة نهائية.
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
طبقة وسيطة لمدير أسرار أو مساعد تشغيل بصلاحيات مستخدم آخر. يتلقى الغلاف وسائط Gateway العادية ويكون
مسؤولًا في النهاية عن تنفيذ `openclaw` أو Node بهذه الوسائط.

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

يمكنك أيضًا تعيين الغلاف عبر البيئة. يتحقق `gateway install` من أن المسار
ملف قابل للتنفيذ، ويكتب الغلاف في `ProgramArguments` الخاصة بالخدمة، ويُبقي
`OPENCLAW_WRAPPER` في بيئة الخدمة لعمليات إعادة التثبيت القسرية والتحديثات وإصلاحات doctor لاحقًا.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

لإزالة غلاف مُستبقى، أفرغ `OPENCLAW_WRAPPER` أثناء إعادة التثبيت:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل.
    - على macOS، يستخدم `gateway stop` الأمر `launchctl bootout` افتراضيًا، ما يزيل LaunchAgent من جلسة الإقلاع الحالية من دون إبقاء تعطيل دائم — يبقى الاسترداد التلقائي عبر KeepAlive نشطًا للأعطال المستقبلية، ويعيد `gateway start` التفعيل بشكل نظيف من دون `launchctl enable` يدوي. مرّر `--disable` لكبت KeepAlive وRunAtLoad بشكل دائم كي لا يعاود Gateway الظهور حتى تنفيذ `gateway start` الصريح التالي؛ استخدم هذا عندما يجب أن يصمد الإيقاف اليدوي أمام عمليات إعادة الإقلاع أو إعادة تشغيل النظام.
    - يطلب `gateway restart --safe` من Gateway قيد التشغيل إجراء فحص تمهيدي لعمل OpenClaw النشط وتأجيل إعادة التشغيل حتى تفريغ تسليم الردود، وعمليات التشغيل المضمنة، وعمليات تشغيل المهام. لا يمكن دمج `--safe` مع `--force` أو `--wait`.
    - يتجاوز `gateway restart --wait 30s` ميزانية تفريغ إعادة التشغيل المضبوطة لتلك الإعادة. الأرقام المجردة تُعد بالمللي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير مسمى.
    - يشغّل `gateway restart --safe --skip-deferral` إعادة التشغيل الآمنة الواعية بـ OpenClaw لكنه يتجاوز بوابة التأجيل، بحيث يرسل Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. إنه مخرج للمشغّل من تأجيلات عمليات تشغيل المهام العالقة؛ ويتطلب `--safe`.
    - يتخطى `gateway restart --force` تفريغ العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغّل قد فحص بالفعل عوائق المهام المدرجة ويريد إعادة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للبرمجة النصية.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل لكنه لا يُبقي الرمز المحلول في بيانات بيئة الخدمة الوصفية.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef للرمز المضبوط غير محلول، يفشل التثبيت بإغلاق آمن بدلًا من إبقاء نص صريح احتياطي.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـ SecretRef بدلًا من `--password` المضمن.
    - في وضع المصادقة المستنتج، لا يخفف `OPENCLAW_GATEWAY_PASSWORD` الموجود في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعداد) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مضبوطين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يُضبط الوضع صراحة.

  </Accordion>
</AccordionGroup>

## اكتشاف بوابات Gateway (Bonjour)

يفحص `gateway discover` إشارات Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): اختر نطاقًا (مثال: `openclaw.internal.`) وأعدّ split DNS + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

وحدها بوابات Gateway التي فُعّل فيها اكتشاف Bonjour (افتراضيًا) تعلن الإشارة.

يمكن أن تتضمن سجلات الاكتشاف واسع النطاق تلميحات TXT هذه:

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (وضع الاكتشاف الكامل فقط؛ تضبط العملاء أهداف SSH افتراضيًا إلى `22` عندما يكون غائبًا)
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
  مخرجات قابلة للقراءة آليًا (تعطل أيضًا التنسيق/مؤشر التحميل).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` إضافةً إلى النطاق واسع النطاق المضبوط عند تمكين أحدها.
- تُشتق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة المحلولة، لا من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- على `local.` mDNS وDNS-SD واسع النطاق، لا يُنشر `sshPort` و`cliPath` إلا عندما يكون `discovery.mdns.mode` هو `full`.

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
