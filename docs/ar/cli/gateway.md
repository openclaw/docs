---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - استكشاف أخطاء مصادقة Gateway وأوضاع الربط والاتصال وإصلاحها
    - اكتشاف Gateway عبر Bonjour (DNS-SD المحلي + واسع النطاق)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — تشغيل البوابات والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:28:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، العقد، الجلسات، الخطافات). الأوامر الفرعية في هذه الصفحة تندرج تحت `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي + DNS-SD واسع النطاق.
  </Card>
  <Card title="Discovery overview" href="/ar/gateway/discovery">
    كيف يعلن OpenClaw عن البوابات ويعثر عليها.
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

الاسم المستعار للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Startup behavior">
    - افتراضيًا، يرفض Gateway البدء ما لم يكن `gateway.mode=local` مضبوطًا في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المخصصة/التطويرية.
    - من المتوقع أن يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقود، فتعامل مع ذلك كإعداد معطوب أو مستبدل وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
    - إذا كان الملف موجودًا و`gateway.mode` مفقود، يتعامل Gateway مع ذلك كضرر مريب في الإعداد ويرفض "تخمين المحلي" نيابةً عنك.
    - يُحظر الربط خارج loopback دون مصادقة (حاجز أمان).
    - يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند التصريح بذلك (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، بينما تظل أداة Gateway/تطبيق الإعداد/التحديث مسموحة).
    - توقف معالجات `SIGINT`/`SIGTERM` عملية Gateway، لكنها لا تستعيد أي حالة طرفية مخصصة. إذا غلّفت CLI بواجهة TUI أو إدخال raw-mode، فاستعد الطرفية قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (تأتي القيمة الافتراضية من الإعداد/البيئة؛ عادةً `18789`).
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
  إعادة ضبط إعداد Tailscale serve/funnel عند إيقاف التشغيل.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  السماح ببدء Gateway دون `gateway.mode=local` في الإعداد. يتجاوز حارس بدء التشغيل للتمهيد المخصص/التطويري فقط؛ ولا يكتب ملف الإعداد أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء إعداد تطوير + مساحة عمل إذا كانا مفقودين (يتخطى BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة ضبط إعداد التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  إنهاء أي مستمع موجود على المنفذ المحدد قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  سجلات مطوّلة.
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
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

يطلب `openclaw gateway restart --safe` من Gateway قيد التشغيل إجراء فحص مسبق لأعمال OpenClaw النشطة قبل إعادة التشغيل. إذا كانت هناك عمليات في قائمة الانتظار، أو تسليم ردود، أو تشغيلات مضمّنة، أو تشغيلات مهام نشطة، يبلغ Gateway عن العوائق، ويدمج طلبات إعادة التشغيل الآمنة المكررة، ويعيد التشغيل بمجرد تفريغ العمل النشط. يحافظ `restart` العادي على سلوك مدير الخدمة الحالي للتوافق. استخدم `--force` فقط عندما تريد صراحةً مسار التجاوز الفوري.

يشغّل `openclaw gateway restart --safe --skip-deferral` نفس إعادة التشغيل المنسقة والواعية بـ OpenClaw مثل `--safe`، لكنه يتجاوز بوابة تأجيل العمل النشط بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. استخدمه كمخرج طارئ للمشغّل عندما يكون التأجيل مثبتًا بسبب تشغيل مهمة عالق وكان `--safe` وحده سينتظر إلى أجل غير مسمى. يتطلب `--skip-deferral` الخيار `--safe`.

<Warning>
يمكن أن تظهر `--password` المضمّنة في قوائم العمليات المحلية. فضّل `--password-file` أو البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### تنميط بدء التشغيل

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway، بما في ذلك تأخير `eventLoopMax` لكل مرحلة وتوقيتات جداول بحث Plugin للفهرس المثبّت، وسجل البيانات التعريفية، وتخطيط بدء التشغيل، وعمل خريطة المالك.
- اضبط `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` لكتابة مخطط زمني تشخيصي لبدء التشغيل بصيغة JSONL وبأفضل جهد لأدوات QA الخارجية. يمكنك أيضًا تفعيل العلم باستخدام `diagnostics.flags: ["timeline"]` في الإعداد؛ يظل المسار مقدّمًا من البيئة. أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء Gateway. يسجل القياس أول خرج للعملية، و`/healthz`، و`/readyz`، وتوقيتات أثر بدء التشغيل، وتأخير حلقة الأحداث، وتفاصيل توقيت جداول بحث Plugin.

## الاستعلام عن Gateway قيد التشغيل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="Output modes">
    - الافتراضي: قابل للقراءة البشرية (ملوّن في TTY).
    - `--json`: JSON قابل للقراءة آليًا (دون تنسيق/مؤشر دوّار).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على تخطيط القراءة البشرية.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`: عنوان URL لـ Gateway WebSocket.
    - `--token <token>`: رمز Gateway المميز.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: مهلة/ميزانية الوقت (تختلف حسب الأمر).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند ضبط `--url`، لا يرجع CLI إلى بيانات اعتماد الإعداد أو البيئة. مرّر `--token` أو `--password` صراحةً. غياب بيانات الاعتماد الصريحة خطأ.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطة نهاية HTTP `/healthz` هي فحص حيوية: تعود بمجرد أن يستطيع الخادم الرد عبر HTTP. نقطة نهاية HTTP `/readyz` أشد صرامة وتظل حمراء بينما ما زالت وحدات Plugin الجانبية عند بدء التشغيل، أو القنوات، أو الخطافات المضبوطة تستقر. تتضمن استجابات الجاهزية التفصيلية المحلية أو الموثّقة كتلة تشخيص `eventLoop` مع تأخير حلقة الأحداث، واستخدام حلقة الأحداث، ونسبة أنوية CPU، وعلم `degraded`.

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
  الحد الأقصى لعدد الأحداث الحديثة المراد تضمينها (بحد أقصى `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث الواقعة بعد رقم تسلسل تشخيصي فقط.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو `--bundle` فقط) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON للحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات دعم قابل للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - تحتفظ السجلات بالبيانات التعريفية التشغيلية: أسماء الأحداث، الأعداد، أحجام البايت، قراءات الذاكرة، حالة قائمة الانتظار/الجلسة، أسماء القنوات/Plugin، وملخصات الجلسات المنقّحة. ولا تحتفظ بنص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو ملفات تعريف الارتباط، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - عند مخارج Gateway الفادحة، ومهل إيقاف التشغيل، وفشل بدء التشغيل بعد إعادة التشغيل، يكتب OpenClaw نفس اللقطة التشخيصية إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ تنطبق `--limit` و`--type` و`--since-seq` أيضًا على خرج الحزمة.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

اكتب ملف zip تشخيصيًا محليًا مصممًا لإرفاقه بتقارير الأخطاء. لنموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. يُضبط افتراضيًا إلى تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقّحة المراد تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل المراد فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ Gateway WebSocket للقطة الصحة.
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
  تخطي البحث عن حزمة استقرار محفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  طباعة المسار المكتوب والحجم والبيان بصيغة JSON.
</ParamField>

يحتوي التصدير على بيان، وملخص Markdown، وشكل الإعداد، وتفاصيل إعداد منقّحة، وملخصات سجلات منقّحة، ولقطات حالة/صحة Gateway منقّحة، وأحدث حزمة استقرار عند وجودها.

الغرض منه أن تتم مشاركته. يحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجلات OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المضبوطة، والمنافذ، ومعرّفات Plugin، ومعرّفات المزوّدين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقّحة. ويحذف أو ينقّح نص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحساب/الرسائل، ونص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة بنمط LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بأن رسالة قد حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway (launchd/systemd/schtasks) بالإضافة إلى فحص اختياري لإمكانات الاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  أضف هدف فحص صريحًا. لا يزال يتم فحص البعيد المُكوَّن + localhost.
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
  رقِّ فحص الاتصال الافتراضي إلى فحص قراءة واخرج بقيمة غير صفرية عند فشل فحص القراءة هذا. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - يظل `gateway status` متاحًا للتشخيص حتى عندما يكون تكوين CLI المحلي مفقودًا أو غير صالح.
    - يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانية المصادقة المرئية وقت المصافحة. ولا يثبت عمليات القراءة/الكتابة/الإدارة.
    - لا تُحدث فحوص التشخيص أي تغييرات لمصادقة الجهاز لأول مرة: فهي تعيد استخدام رمز جهاز مميز مخزن مؤقتًا موجودًا عند توفره، لكنها لا تنشئ هوية جهاز CLI جديدة أو سجل إقران جهاز للقراءة فقط لمجرد التحقق من الحالة.
    - يحل `gateway status` مراجع SecretRefs الخاصة بالمصادقة المُكوَّنة لمصادقة الفحص عند الإمكان.
    - إذا تعذر حل SecretRef مطلوب للمصادقة في مسار الأمر هذا، فإن `gateway status --json` يبلّغ عن `rpc.authWarning` عند فشل اتصال/مصادقة الفحص؛ مرر `--token`/`--password` صراحةً أو حل مصدر السر أولًا.
    - إذا نجح الفحص، تُكبت تحذيرات مرجع المصادقة غير المحلول لتجنب النتائج الإيجابية الكاذبة.
    - استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع وتحتاج أيضًا إلى سلامة استدعاءات RPC بنطاق القراءة.
    - يضيف `--deep` فحصًا بأفضل جهد لتثبيتات launchd/systemd/schtasks الإضافية. عند اكتشاف عدة خدمات شبيهة بـ Gateway، يطبع الإخراج البشري تلميحات تنظيف ويحذر من أن معظم الإعدادات ينبغي أن تشغل Gateway واحدًا لكل جهاز.
    - يبلّغ `--deep` أيضًا عن تسليم إعادة تشغيل حديث لمشرف Gateway عندما تخرج عملية الخدمة بشكل نظيف لإعادة تشغيل مشرف خارجي.
    - يشغّل `--deep` التحقق من التكوين في وضع واعٍ بالـ plugin ‏(`pluginValidation: "full"`) ويعرض تحذيرات بيان plugin المُكوَّنة (على سبيل المثال بيانات تعريف تكوين القناة المفقودة) حتى تلتقطها فحوصات التثبيت والتحديث السريعة. يحافظ `gateway status` الافتراضي على مسار القراءة فقط السريع الذي يتخطى التحقق من plugins.
    - يتضمن الإخراج البشري مسار سجل الملف المحلول إضافة إلى لقطة مسارات/صلاحية تكوين CLI مقابل الخدمة للمساعدة في تشخيص انحراف ملف التعريف أو دليل الحالة.

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - في تثبيتات Linux systemd، تقرأ فحوصات انحراف مصادقة الخدمة قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، والملفات الاختيارية `-`).
    - تحل فحوصات الانحراف SecretRefs الخاصة بـ `gateway.auth.token` باستخدام بيئة التشغيل المدمجة (بيئة أمر الخدمة أولًا، ثم بيئة العملية كبديل).
    - إذا لم تكن مصادقة الرمز المميز نشطة فعليًا (`gateway.auth.mode` صريح بقيمة `password`/`none`/`trusted-proxy`، أو الوضع غير معيّن حيث يمكن لكلمة المرور أن تفوز ولا يمكن لأي مرشح رمز مميز أن يفوز)، تتخطى فحوصات انحراف الرمز المميز حل رمز التكوين المميز.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` هو أمر "تصحيح كل شيء". يفحص دائمًا:

- Gateway البعيد المُكوَّن لديك (إذا تم تعيينه)، و
- localhost (loopback) **حتى إذا كان البعيد مُكوَّنًا**.

إذا مررت `--url`، فسيُضاف ذلك الهدف الصريح قبل كليهما. يوسم الإخراج البشري الأهداف كالتالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

<Note>
إذا كان يمكن الوصول إلى عدة Gateways، فإنه يطبعها كلها. تُدعم Gateways المتعددة عند استخدام ملفات تعريف/منافذ معزولة (مثل بوت إنقاذ)، لكن معظم التثبيتات لا تزال تشغّل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interpretation">
    - يعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يبلّغ `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` عما استطاع الفحص إثباته بشأن المصادقة. وهو منفصل عن قابلية الوصول.
    - يعني `Read probe: ok` أن استدعاءات RPC التفصيلية بنطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - يعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC بنطاق القراءة محدود. يُبلَّغ عن هذا كقابلية وصول **متدهورة**، وليس فشلًا كاملًا.
    - يعني `Read probe: failed` بعد `Connect: ok` أن Gateway قبل اتصال WebSocket، لكن تشخيصات القراءة اللاحقة انتهت مهلتها أو فشلت. وهذا أيضًا قابلية وصول **متدهورة**، وليس Gateway غير قابل للوصول.
    - مثل `gateway status`، يعيد الفحص استخدام مصادقة جهاز مخزنة مؤقتًا موجودة لكنه لا ينشئ هوية جهاز لأول مرة أو حالة إقران.
    - تكون شفرة الخروج غير صفرية فقط عندما لا يكون أي هدف مفحوص قابلًا للوصول.

  </Accordion>
  <Accordion title="JSON output">
    المستوى الأعلى:

    - `ok`: هدف واحد على الأقل قابل للوصول.
    - `degraded`: هدف واحد على الأقل قبل اتصالًا لكنه لم يكمل تشخيصات RPC التفصيلية الكاملة.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف القابلة للوصول (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه كالفائز النشط بهذا الترتيب: URL الصريح، نفق SSH، البعيد المُكوَّن، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد مع `code` و`message` و`targetIds` اختيارية.
    - `network`: تلميحات URL لـ local loopback/tailnet مشتقة من التكوين الحالي وشبكات المضيف.
    - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلي المستخدم لمرور الفحص هذا.

    لكل هدف (`targets[].connect`):

    - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
    - `rpcOk`: نجاح RPC التفصيلي الكامل.
    - `scopeLimited`: فشل RPC التفصيلي بسبب نقص نطاق المشغل.

    لكل هدف (`targets[].auth`):

    - `role`: دور المصادقة المبلّغ عنه في `hello-ok` عند توفره.
    - `scopes`: النطاقات الممنوحة المبلّغ عنها في `hello-ok` عند توفرها.
    - `capability`: تصنيف إمكانية المصادقة المعروض لذلك الهدف.

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ عاد الأمر إلى الفحوصات المباشرة.
    - `multiple_gateways`: كان أكثر من هدف واحد قابلًا للوصول؛ وهذا غير معتاد إلا إذا كنت تشغّل عمدًا ملفات تعريف معزولة، مثل بوت إنقاذ.
    - `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مُكوَّن لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن فحص القراءة كان محدودًا بسبب نقص `operator.read`.

  </Accordion>
</AccordionGroup>

#### البعيد عبر SSH (تكافؤ تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS إعادة توجيه منفذ محلي بحيث يصبح Gateway البعيد (الذي قد يكون مربوطًا بـ loopback فقط) قابلًا للوصول على `ws://127.0.0.1:<port>`.

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
  اختر أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` إضافة إلى النطاق الواسع المُكوَّن، إن وجد). يتم تجاهل التلميحات التي هي TXT فقط.
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
  سلسلة كائن JSON للمعلمات.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL لـ WebSocket الخاص بـ Gateway.
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
  أساسًا لاستدعاءات RPC بنمط الوكيل التي تبث أحداثًا وسيطة قبل حمولة نهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  إخراج JSON قابل للقراءة آليًا.
</ParamField>

<Note>
يجب أن تكون `--params` بتنسيق JSON صالح.
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

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة عبر ملف تنفيذي آخر، مثل غلاف مدير أسرار أو مساعد تشغيل باسم مستخدم آخر. يتلقى الغلاف وسائط Gateway العادية وهو مسؤول في النهاية عن تنفيذ `openclaw` أو Node بهذه الوسائط.

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

يمكنك أيضًا تعيين الغلاف عبر البيئة. يتحقق `gateway install` من أن المسار ملف قابل للتنفيذ، ويكتب الغلاف في `ProgramArguments` الخاصة بالخدمة، ويحفظ `OPENCLAW_WRAPPER` في بيئة الخدمة لعمليات إعادة التثبيت القسرية والتحديثات وإصلاحات doctor اللاحقة.

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
  <Accordion title="Command options">
    - `gateway status`: `--url`، `--token`، `--password`، `--timeout`، `--no-probe`، `--require-rpc`، `--deep`، `--json`
    - `gateway install`: `--port`، `--runtime <node|bun>`، `--token`، `--wrapper <path>`، `--force`، `--json`
    - `gateway restart`: `--safe`، `--skip-deferral`، `--force`، `--wait <duration>`، `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`، `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تربط `gateway stop` و`gateway start` كبديل لإعادة التشغيل.
    - على macOS، يستخدم `gateway stop` الأمر `launchctl bootout` افتراضيًا، ما يزيل LaunchAgent من جلسة الإقلاع الحالية دون استمرار التعطيل — يظل الاسترداد التلقائي عبر KeepAlive نشطًا للأعطال المستقبلية، ويعيد `gateway start` التمكين بنظافة دون `launchctl enable` يدوي. مرر `--disable` لتعطيل KeepAlive وRunAtLoad بشكل دائم حتى لا يعيد Gateway الظهور إلى أن يتم تنفيذ `gateway start` صريح لاحق؛ استخدم هذا عندما يجب أن يستمر الإيقاف اليدوي بعد إعادة الإقلاع أو إعادة تشغيل النظام.
    - يطلب `gateway restart --safe` من Gateway قيد التشغيل إجراء فحص مسبق لأعمال OpenClaw النشطة وتأجيل إعادة التشغيل حتى يتم تصريف تسليم الردود والتشغيلات المضمنة وتشغيلات المهام. لا يمكن دمج `--safe` مع `--force` أو `--wait`.
    - يتجاوز `gateway restart --wait 30s` ميزانية تصريف إعادة التشغيل المكوّنة لإعادة التشغيل تلك. الأرقام المجردة بالملي ثانية؛ وتُقبل وحدات مثل `s` و`m` و`h`. ينتظر `--wait 0` إلى أجل غير مسمى.
    - يشغّل `gateway restart --safe --skip-deferral` إعادة التشغيل الآمنة الواعية بـ OpenClaw لكنه يتجاوز بوابة التأجيل، بحيث يصدر Gateway إعادة التشغيل فورًا حتى عند الإبلاغ عن عوائق. إنه مخرج طارئ للمشغّل عند تعطل تأجيلات تشغيل المهام؛ ويتطلب `--safe`.
    - يتخطى `gateway restart --force` تصريف العمل النشط ويعيد التشغيل فورًا. استخدمه عندما يكون المشغّل قد فحص بالفعل عوائق المهام المدرجة ويريد عودة Gateway الآن.
    - تقبل أوامر دورة الحياة `--json` للبرمجة النصية.

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - عندما تتطلب مصادقة الرمز المميز رمزًا ويكون `gateway.auth.token` مُدارًا عبر SecretRef، يتحقق `gateway install` من أن SecretRef قابل للحل لكنه لا يحفظ الرمز المحلول في بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يفشل التثبيت بشكل مغلق بدلًا من حفظ نص صريح احتياطي.
    - لمصادقة كلمة المرور على `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعوم بـ SecretRef على `--password` المضمّن.
    - في وضع المصادقة المستنتج، لا يخفف `OPENCLAW_GATEWAY_PASSWORD` الموجود في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعدادات) عند تثبيت خدمة مُدارة.
    - إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يُحظر التثبيت حتى يتم ضبط الوضع صراحةً.

  </Accordion>
</AccordionGroup>

## اكتشاف البوابات (Bonjour)

يفحص `gateway discover` إشارات Gateway (`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Wide-Area Bonjour): اختر نطاقًا (مثال: `openclaw.internal.`) وأعدّ DNS مقسّمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

تعلن الإشارة فقط البوابات التي فُعّل فيها اكتشاف Bonjour (افتراضيًا).

تتضمن سجلات الاكتشاف واسع النطاق (TXT):

- `role` (تلميح دور Gateway)
- `transport` (تلميح النقل، مثل `gateway`)
- `gatewayPort` (منفذ WebSocket، عادةً `18789`)
- `sshPort` (اختياري؛ تضبط العملاء أهداف SSH افتراضيًا على `22` عند غيابه)
- `tailnetDns` (اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` (TLS مفعّل + بصمة الشهادة)
- `cliPath` (تلميح التثبيت عن بُعد المكتوب إلى المنطقة واسعة النطاق)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلة لكل أمر (تصفح/حل).
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات قابلة للقراءة آليًا (وتعطل أيضًا التنسيق/مؤشر التحميل).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص CLI النطاق `local.` بالإضافة إلى النطاق واسع النطاق المكوّن عند تمكينه.
- يُشتق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة المحلولة، وليس من تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS على `local.`، لا يُبث `sshPort` و`cliPath` إلا عندما يكون `discovery.mdns.mode` هو `full`. ما يزال DNS-SD واسع النطاق يكتب `cliPath`؛ ويبقى `sshPort` اختياريًا هناك أيضًا.

</Note>

## ذات صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
