---
read_when:
    - تشغيل Gateway من CLI (للتطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف بوابات Gateway عبر Bonjour ‏(DNS-SD محلي وواسع النطاق)
sidebarTitle: Gateway
summary: CLI لـ Gateway في OpenClaw (`openclaw gateway`) — تشغيل بوابات Gateway والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-07-12T05:44:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway هو خادم WebSocket الخاص بـ OpenClaw (القنوات، والعُقد، والجلسات، والخطافات). تندرج جميع الأوامر الفرعية أدناه ضمن `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="اكتشاف Bonjour" href="/ar/gateway/bonjour">
    إعداد mDNS المحلي وDNS-SD واسع النطاق.
  </Card>
  <Card title="نظرة عامة على الاكتشاف" href="/ar/gateway/discovery">
    كيفية إعلان OpenClaw عن بوابات Gateway والعثور عليها.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration">
    مفاتيح إعداد Gateway ذات المستوى الأعلى.
  </Card>
</CardGroup>

## تشغيل Gateway

```bash
openclaw gateway
openclaw gateway run   # صيغة صريحة مكافئة
```

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    - يرفض البدء ما لم يُضبط `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` للتشغيلات المخصصة/التطويرية؛ إذ يتجاوز آلية الحماية دون كتابة الإعداد أو إصلاحه.
    - يكتب `openclaw onboard --mode local` و`openclaw setup` القيمة `gateway.mode=local`. إذا كان ملف الإعداد موجودًا لكن `gateway.mode` مفقود، فيُعامل ذلك على أنه إعداد تالف/مستبدل، ويرفض Gateway افتراض `local` نيابةً عنك — أعد تنفيذ الإعداد الأولي، أو اضبط المفتاح يدويًا، أو مرّر `--allow-unconfigured`.
    - يُحظر الربط خارج local loopback دون مصادقة.
    - تُحل قيم `--bind`‏ `lan` و`tailnet` و`custom` حاليًا عبر مسارات IPv4 فقط؛ تحتاج إعدادات المضيف المخصص التي تعمل عبر IPv6 فقط إلى حاوية جانبية أو وكيل IPv4 أمام Gateway.
    - تؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عندما تكون مخوّلة. يتحكم `commands.restart` (الافتراضي: مفعّل) في إشارات `SIGUSR1` المرسلة خارجيًا؛ اضبطه على `false` لمنع إعادة التشغيل اليدوية عبر إشارات نظام التشغيل، مع استمرار السماح بإعادة التشغيل عبر الأمر `gateway restart` وأداة Gateway وتطبيق/تحديث الإعداد.
    - توقف `SIGINT`/`SIGTERM` العملية، لكنها لا تستعيد حالة الطرفية المخصصة — إذا غلّفت CLI داخل TUI أو إدخال في الوضع الخام، فاستعد الطرفية بنفسك قبل الخروج.

  </Accordion>
</AccordionGroup>

### الخيارات

<ParamField path="--port <port>" type="number">
  منفذ WebSocket (الافتراضي من الإعداد/متغيرات البيئة؛ عادةً `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  وضع الربط: `loopback` (الافتراضي)، و`lan`، و`tailnet`، و`auto`، و`custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  الرمز المميز المشترك لـ `connect.params.auth.token`. تكون القيمة الافتراضية `OPENCLAW_GATEWAY_TOKEN` عند ضبطه.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  وضع المصادقة: `none`، و`token`، و`password`، و`trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة المرور لـ `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  قراءة كلمة مرور Gateway من ملف.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  إتاحة Tailscale:‏ `off`، و`serve`، و`funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  إعادة ضبط إعداد serve/funnel الخاص بـ Tailscale عند الإيقاف.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  البدء دون فرض `gateway.mode=local`. للتمهيد المخصص/التطويري فقط؛ ولا يحفظ الإعداد أو يصلحه.
</ParamField>
<ParamField path="--dev" type="boolean">
  إنشاء إعداد تطويري + مساحة عمل إذا كانا مفقودين (يتخطى `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  إعادة ضبط إعداد التطوير وبيانات الاعتماد والجلسات ومساحة العمل. يتطلب `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  إنهاء أي مستمع موجود على المنفذ المستهدف قبل البدء.
</ParamField>
<ParamField path="--verbose" type="boolean">
  تسجيل مفصّل إلى stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  عرض سجلات الواجهة الخلفية لـ CLI فقط في وحدة التحكم (ويفعّل أيضًا stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  نمط سجل WebSocket:‏ `auto`، و`full`، و`compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  اسم مستعار لـ `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  تسجيل أحداث تدفق النموذج الخام في JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسار JSONL للتدفق الخام.
</ParamField>

`--claude-cli-logs` اسم مستعار مهمل لـ `--cli-backend-logs`.

بالنسبة إلى `--bind custom`، اضبط `gateway.customBindHost` على عنوان IPv4. يتطلب أي عنوان غير `127.0.0.1` أو `0.0.0.0` أيضًا وجود `127.0.0.1` على المنفذ نفسه للعملاء على المضيف ذاته؛ يفشل بدء التشغيل إذا تعذر الربط لأي من المستمعين. لا يضيف حرف البدل `0.0.0.0` اسمًا مستعارًا مطلوبًا منفصلًا. تحتاج إعدادات المضيف المخصص التي تعمل عبر IPv6 فقط إلى حاوية جانبية أو وكيل IPv4 أمام Gateway.

## إعادة تشغيل Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

يطلب `--safe` من Gateway العامل إجراء فحص مسبق للعمل النشط وجدولة إعادة تشغيل واحدة مدمجة بعد تصريف ذلك العمل. مدة الانتظار محدودة بواسطة `gateway.reload.deferralTimeoutMs` (الافتراضي: 5 دقائق / `300000`)؛ وعند انتهاء المهلة تُفرض إعادة التشغيل. اضبط `deferralTimeoutMs: 0` للانتظار إلى أجل غير مسمى (مع تحذيرات دورية بأن العمل لا يزال معلقًا) بدلًا من الفرض. لا يمكن الجمع بين `--safe` و`--force` أو `--wait`.

يتجاوز `--skip-deferral` بوابة تأجيل العمل النشط في إعادة التشغيل الآمنة، ولذلك يُعاد تشغيل Gateway فورًا حتى مع وجود عوائق مُبلّغ عنها. يتطلب `--safe` — استخدمه عندما يعلق التأجيل بسبب مهمة منفلتة.

يتجاوز `--wait <duration>` ميزانية التصريف لإعادة تشغيل عادية (غير آمنة). يقبل ميلي ثانية مجردة أو لواحق الوحدات `ms` و`s` و`m` و`h` و`d` (مثل `30s` و`5m` و`1h30m`)؛ وينتظر `--wait 0` إلى أجل غير مسمى. لا يتوافق مع `--force` أو `--safe`.

يتخطى `--force` تصريف العمل النشط ويعيد التشغيل فورًا. يحافظ `restart` العادي (دون خيارات) على سلوك إعادة التشغيل الحالي لمدير الخدمة.

<Warning>
قد تظهر قيمة `--password` المضمّنة في قوائم العمليات المحلية. يُفضّل استخدام `--password-file` أو متغيرات البيئة أو `gateway.auth.password` المدعوم بـ SecretRef.
</Warning>

### تحليل أداء Gateway

- يسجل `OPENCLAW_GATEWAY_STARTUP_TRACE=1` توقيتات المراحل أثناء بدء التشغيل، بما فيها تأخر `eventLoopMax` لكل مرحلة وتوقيتات جداول بحث Plugin (فهرس العناصر المثبتة، وسجل البيانات التعريفية، وتخطيط بدء التشغيل، وعمل خريطة المالكين).
- يسجل `OPENCLAW_GATEWAY_RESTART_TRACE=1` أسطر `restart trace:` الخاصة بإعادة التشغيل: معالجة الإشارة، وتصريف العمل النشط، ومراحل الإيقاف، وبدء التشغيل التالي، وتوقيت الجاهزية، ومقاييس الذاكرة.
- يكتب `OPENCLAW_DIAGNOSTICS=timeline` مع `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` مخططًا زمنيًا لتشخيصات بدء التشغيل بتنسيق JSONL وبأفضل جهد ممكن لاستخدامه في أُطر QA الخارجية (وهو مكافئ للإعداد `diagnostics.flags: ["timeline"]`؛ ويظل المسار متاحًا عبر متغيرات البيئة فقط). أضف `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` لتضمين عينات حلقة الأحداث.
- ينفذ `pnpm build` ثم `pnpm test:startup:gateway -- --runs 5 --warmup 1` قياسًا مرجعيًا لبدء تشغيل Gateway مقابل نقطة دخول CLI المبنية: أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع بدء التشغيل، وتأخر حلقة الأحداث، وتوقيت جدول بحث Plugin.
- ينفذ `pnpm build` ثم `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` قياسًا مرجعيًا لإعادة التشغيل داخل العملية على macOS أو Linux (غير مدعوم على Windows؛ إذ تتطلب إعادة التشغيل `SIGUSR1`). يستخدم `SIGUSR1`، ويفعّل كلا التتبعين في العملية الفرعية، ويسجل `/healthz` التالي، و`/readyz` التالي، ومدة التوقف، وتوقيت الجاهزية، ووحدة المعالجة المركزية، وRSS، ومقاييس تتبع إعادة التشغيل.
- يمثل `/healthz` حيوية الخدمة؛ ويمثل `/readyz` جاهزية الاستخدام. تعامل مع أسطر التتبع ومخرجات القياس المرجعي بوصفها إشارات لإسناد المسؤولية إلى المالك، لا استنتاجًا كاملًا للأداء من مدة أو عينة واحدة.

## الاستعلام من Gateway عامل

تستخدم جميع أوامر الاستعلام WebSocket RPC.

<Tabs>
  <Tab title="أوضاع الإخراج">
    - الافتراضي: قابل للقراءة البشرية (ملوّن في TTY).
    - `--json`:‏ JSON قابل للقراءة آليًا (دون تنسيق/مؤشر تحميل).
    - `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الحفاظ على التخطيط البشري.

  </Tab>
  <Tab title="الخيارات المشتركة">
    - `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway.
    - `--token <token>`: الرمز المميز لـ Gateway.
    - `--password <password>`: كلمة مرور Gateway.
    - `--timeout <ms>`: المهلة/الميزانية (تختلف القيمة الافتراضية حسب الأمر؛ راجع كل أمر أدناه).
    - `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

  </Tab>
</Tabs>

<Note>
عند ضبط `--url`، لا يرجع CLI إلى بيانات الاعتماد الموجودة في الإعداد أو متغيرات البيئة. مرّر `--token` أو `--password` صراحةً. يُعد غياب بيانات الاعتماد الصريحة خطأً.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

يمثل `/healthz` مسبارًا لحيوية الخدمة: ويعيد الاستجابة بمجرد أن يتمكن الخادم من الرد عبر HTTP. أما `/readyz` فأكثر صرامةً ويظل باللون الأحمر أثناء استمرار استقرار الحاويات الجانبية لـ Plugin عند بدء التشغيل، أو القنوات، أو الخطافات المُعدّة. تتضمن استجابات `/readyz` المحلية أو المفصّلة والمصادق عليها كتلة تشخيص `eventLoop` (التأخر، والاستخدام، ونسبة أنوية وحدة المعالجة المركزية، وعلامة `degraded`).

<ParamField path="--port <port>" type="number">
  استهداف Gateway محلي عبر local loopback على هذا المنفذ. يتجاوز `OPENCLAW_GATEWAY_URL` و`OPENCLAW_GATEWAY_PORT` لهذا الاستدعاء.
</ParamField>

### `gateway usage-cost`

جلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

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
  حصر الملخص في معرّف وكيل واحد مُعدّ.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  التجميع عبر جميع الوكلاء المُعدّين. لا يمكن الجمع بينه وبين `--agent`.
</ParamField>

### `gateway stability`

جلب مسجل الاستقرار التشخيصي الحديث من Gateway عامل.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  الحد الأقصى للأحداث الحديثة المراد تضمينها (الحد الأعلى `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  تضمين الأحداث التي تلي رقم تسلسل تشخيصي فقط.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway العامل. يختار `--bundle latest` (أو `--bundle` وحده) أحدث حزمة ضمن دليل الحالة؛ ويمكنك أيضًا تمرير مسار JSON للحزمة مباشرةً.
</ParamField>
<ParamField path="--export" type="boolean">
  كتابة ملف zip لتشخيصات الدعم قابل للمشاركة بدلًا من طباعة تفاصيل الاستقرار.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسار الإخراج لـ `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="الخصوصية وسلوك الحزم">
    - تحتفظ السجلات بالبيانات التعريفية التشغيلية: أسماء الأحداث، والأعداد، وأحجام البايتات، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، ومعرّفات الموافقة، وأسماء القنوات/Plugin، وملخصات الجلسات المنقحة. وتستبعد نص المحادثة، ومحتويات Webhook، ومخرجات الأدوات، ومحتويات الطلبات/الاستجابات الخام، والرموز المميزة، وملفات تعريف الارتباط، والقيم السرية، وأسماء المضيفين، ومعرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
    - تكتب حالات الخروج القاتلة لـ Gateway، وانتهاء مهل الإيقاف، وفشل بدء التشغيل بعد إعادة التشغيل اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما يحتوي المسجل على أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ وتنطبق `--limit` و`--type` و`--since-seq` على مخرجات الحزمة أيضًا.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

كتابة ملف zip لتشخيصات محلية مصمم لتقارير الأخطاء. للاطلاع على نموذج الخصوصية ومحتويات الحزمة، راجع [تصدير التشخيصات](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسار ملف zip الناتج. القيمة الافتراضية هي تصدير دعم ضمن دليل الحالة.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  الحد الأقصى لأسطر السجل المنقّحة التي سيتم تضمينها.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  الحد الأقصى لبايتات السجل التي سيتم فحصها.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway من أجل لقطة السلامة.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway المميز من أجل لقطة السلامة.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway من أجل لقطة السلامة.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلة لقطة الحالة/السلامة.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  تخطّي البحث عن حزمة الاستقرار المحفوظة.
</ParamField>
<ParamField path="--json" type="boolean">
  طباعة المسار المكتوب والحجم والبيان بصيغة JSON.
</ParamField>

يجمع التصدير في حزمة: `manifest.json` (قائمة الملفات)، و`summary.md` (ملخص Markdown)، و`diagnostics.json` (ملخص عالي المستوى للإعدادات/السجلات/الاكتشاف/الاستقرار/الحالة/السلامة)، و`config/sanitized.json`، و`status/gateway-status.json`، و`health/gateway-health.json`، و`logs/openclaw-sanitized.jsonl`، و`stability/latest.json` عند وجود حزمة.

صُمم هذا التصدير ليكون قابلاً للمشاركة. فهو يحتفظ بالتفاصيل التشغيلية المفيدة لتصحيح الأخطاء — حقول السجل الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المضبوطة، والمنافذ، ومعرّفات Plugin/المزوّد، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقّحة — ويحذف أو ينقّح نصوص المحادثات، ونصوص طلبات Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وملفات تعريف الارتباط، ومعرّفات الحسابات/الرسائل، ونصوص المطالبات/التعليمات، وأسماء المضيفين، والقيم السرية. عندما تبدو رسالة سجل كنص حمولة لمستخدم/محادثة/أداة (مثل "قال المستخدم" أو "نص المحادثة" أو "مخرجات الأداة" أو "نص طلب Webhook")، لا يحتفظ التصدير إلا بالإشارة إلى حذف رسالة وعدد بايتاتها.

### `gateway status`

يعرض خدمة Gateway ‏(launchd/systemd/schtasks) إلى جانب اختبار اختياري للاتصال/المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  إضافة هدف اختبار صريح. يستمر أيضًا اختبار الهدف البعيد المضبوط وlocalhost.
</ParamField>
<ParamField path="--token <token>" type="string">
  المصادقة بالرمز المميز للاختبار.
</ParamField>
<ParamField path="--password <password>" type="string">
  المصادقة بكلمة المرور للاختبار.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلة الاختبار.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  تخطّي اختبار الاتصال (عرض الخدمة فقط).
</ParamField>
<ParamField path="--deep" type="boolean">
  فحص الخدمات على مستوى النظام أيضًا.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  ترقية اختبار الاتصال إلى اختبار قراءة والخروج برمز غير صفري إذا فشل. لا يمكن دمجه مع `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="دلالات الحالة">
    - يظل متاحًا للتشخيص حتى عند فقدان إعدادات CLI المحلية أو عدم صلاحيتها.
    - يثبت الناتج الافتراضي حالة الخدمة، واتصال WebSocket، وإمكانية المصادقة الظاهرة وقت المصافحة — وليس عمليات القراءة/الكتابة/الإدارة.
    - لا تغيّر الاختبارات شيئًا في مصادقة الجهاز للمرة الأولى: فهي تعيد استخدام رمز جهاز مميز مخزّن مؤقتًا عند وجوده، لكنها لا تنشئ أبدًا هوية جهاز CLI جديدة أو سجل إقران للقراءة فقط لمجرد التحقق من الحالة.
    - يحل مراجع SecretRef للمصادقة المضبوطة لاستخدامها في مصادقة الاختبار متى أمكن. إذا تعذّر حل SecretRef مطلوب، يُبلغ `--json` عن `rpc.authWarning` عند فشل اتصال/مصادقة الاختبار؛ مرّر `--token`/`--password` صراحةً أو أصلح مصدر السر. تُحجب تحذيرات تعذّر حل المصادقة بمجرد نجاح الاختبار.
    - يتضمن ناتج JSON الحقل `gateway.version` عندما يُبلغ عنه Gateway قيد التشغيل؛ ويمكن لـ `--require-rpc` الرجوع إلى حمولة RPC المسماة `status.runtimeVersion` إذا تعذّر على اختبار المصافحة توفير بيانات تعريف الإصدار.
    - استخدم `--require-rpc` في البرامج النصية/الأتمتة عندما لا تكفي خدمة تستمع للاتصالات وتحتاج أيضًا إلى سلامة RPC بنطاق القراءة.
    - يفحص `--deep` عمليات تثبيت launchd/systemd/schtasks إضافية؛ وعند العثور على عدة خدمات شبيهة بـ Gateway، يطبع الناتج البشري تلميحات للتنظيف (يُشغّل عادةً Gateway واحد لكل جهاز) ويُبلغ عن تسليم حديث لإعادة التشغيل من المشرف عند انطباق ذلك.
    - يشغّل `--deep` أيضًا التحقق من صحة الإعدادات في وضع مدرك للـ Plugin ‏(`pluginValidation: "full"`) ويُظهر تحذيرات بيان Plugin (مثل فقدان بيانات تعريف إعدادات القناة). يحافظ `gateway status` الافتراضي على مسار القراءة فقط السريع الذي يتخطى التحقق من صحة Plugin.
    - يتضمن الناتج البشري مسار ملف السجل بعد حله، إلى جانب مسارات إعدادات CLI مقابل الخدمة وصلاحيتها، للمساعدة في تشخيص انحراف ملف التعريف أو دليل الحالة.

  </Accordion>
  <Accordion title="عمليات التحقق من انحراف المصادقة في systemd على Linux">
    - تقرأ عمليات التحقق من انحراف مصادقة الخدمة كلاً من `Environment=` و`EnvironmentFile=` من الوحدة (بما يشمل `%h` والمسارات المقتبسة والملفات المتعددة وملفات `-` الاختيارية).
    - تحل مراجع SecretRef الخاصة بـ `gateway.auth.token` باستخدام بيئة وقت التشغيل المدمجة (بيئة أمر الخدمة أولاً، ثم الرجوع إلى بيئة العملية).
    - تتخطى عمليات التحقق من انحراف الرمز المميز حل رمز الإعدادات عندما لا تكون مصادقة الرمز المميز مفعّلة فعليًا (`gateway.auth.mode` مضبوط صراحةً على `password`/`none`/`trusted-proxy`، أو الوضع غير مضبوط في حالة إمكانية تغلّب كلمة المرور وعدم إمكانية تغلّب أي رمز مميز مرشح).

  </Accordion>
</AccordionGroup>

### `gateway probe`

أمر «تصحيح كل شيء». يختبر دائمًا:

- Gateway البعيد المضبوط لديك (إن كان مضبوطًا)، و
- local loopback، **حتى إذا كان الهدف البعيد مضبوطًا**.

تؤدي إضافة `--url` إلى وضع ذلك الهدف الصريح قبل كليهما. يضع الناتج البشري التسميات `URL (صريح)`، و`بعيد (مضبوط)` / `بعيد (مضبوط، غير نشط)`، و`local loopback` على الأهداف.

<Note>
إذا أمكن الوصول إلى عدة أهداف اختبار، فستُطبع جميعها. يمكن لنفق SSH وعنوان URL لـ TLS/الوكيل وعنوان URL البعيد المضبوط أن تشير جميعًا إلى Gateway نفسه حتى مع اختلاف منافذ النقل؛ ويُحجز `multiple_gateways` لبوابات Gateway مميزة يمكن الوصول إليها أو ملتبسة الهوية. يُدعم تشغيل عدة بوابات Gateway لملفات تعريف معزولة (مثل روبوت إنقاذ)، لكن معظم عمليات التثبيت تشغّل Gateway واحدًا.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  استخدام هذا المنفذ لهدف اختبار local loopback والمنفذ البعيد لنفق SSH. من دون `--url`، يحدد هذا هدف local loopback فقط بدلاً من عنوان URL لبيئة Gateway المضبوطة أو منفذ البيئة أو الأهداف البعيدة.
</ParamField>

<AccordionGroup>
  <Accordion title="التفسير">
    - يعني `يمكن الوصول: نعم` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
    - يُبلغ `الإمكانية: للقراءة فقط|قابل للكتابة|قابل للإدارة|الإقران معلّق|اتصال فقط` عما استطاع الاختبار إثباته بشأن المصادقة، بمعزل عن إمكانية الوصول.
    - يعني `اختبار القراءة: ناجح` أن استدعاءات RPC التفصيلية بنطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
    - يعني `اختبار القراءة: محدود - النطاق مفقود: operator.read` أن الاتصال نجح، لكن RPC بنطاق القراءة محدود. يُبلغ عنه كإمكانية وصول **متدهورة**، وليس فشلاً كاملاً.
    - يعني `اختبار القراءة: فشل` بعد `الاتصال: ناجح` أن WebSocket اتصل، لكن مهلة تشخيصات القراءة اللاحقة انتهت أو فشلت — وهذا أيضًا **تدهور** وليس تعذّر وصول.
    - على غرار `gateway status`، يعيد الاختبار استخدام مصادقة الجهاز المخزنة مؤقتًا، لكنه لا ينشئ هوية جهاز أو حالة إقران للمرة الأولى.
    - يكون رمز الخروج غير صفري فقط عندما لا يمكن الوصول إلى أي هدف تم اختباره.

  </Accordion>
  <Accordion title="ناتج JSON">
    المستوى الأعلى:

    - `ok`: يمكن الوصول إلى هدف واحد على الأقل.
    - `degraded`: قبل هدف واحد على الأقل اتصالاً، لكنه لم يُكمل تشخيصات RPC التفصيلية بالكامل.
    - `capability`: أفضل إمكانية شوهدت عبر الأهداف التي يمكن الوصول إليها (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
    - `primaryTargetId`: أفضل هدف للتعامل معه بوصفه الفائز النشط، بالترتيب: عنوان URL الصريح، ثم نفق SSH، ثم الهدف البعيد المضبوط، ثم local loopback.
    - `warnings[]`: سجلات تحذير بأفضل جهد ممكن، تتضمن `code` و`message` و`targetIds` اختياريًا.
    - `network`: تلميحات عناوين URL لـ local loopback/tailnet مشتقة من الإعدادات الحالية وشبكة المضيف.
    - `discovery.timeoutMs` / `discovery.count`: ميزانية الاكتشاف الفعلية/عدد النتائج المستخدم في دورة الاختبار هذه.

    لكل هدف (`targets[].connect`): ‏`ok` (إمكانية الوصول + تصنيف التدهور)، و`rpcOk` (نجاح RPC التفصيلي بالكامل)، و`scopeLimited` (فشل RPC التفصيلي بسبب فقدان نطاق المشغّل).

    لكل هدف (`targets[].auth`): ‏`role` و`scopes` المبلغ عنهما في `hello-ok` عند توفرهما، بالإضافة إلى تصنيف `capability` الظاهر.

  </Accordion>
  <Accordion title="رموز التحذير الشائعة">
    - `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ رجع الأمر إلى الاختبارات المباشرة.
    - `multiple_gateways`: أمكن الوصول إلى هويات Gateway مميزة، أو تعذّر على OpenClaw إثبات أن الأهداف التي يمكن الوصول إليها هي Gateway نفسه. لا يؤدي نفق SSH أو عنوان URL للوكيل أو عنوان URL بعيد مضبوط يشير إلى Gateway نفسه إلى تشغيل هذا التحذير.
    - `auth_secretref_unresolved`: تعذّر حل SecretRef للمصادقة المضبوطة لهدف فاشل.
    - `probe_scope_limited`: نجح اتصال WebSocket، لكن اختبار القراءة كان محدودًا بسبب فقدان `operator.read`.
    - `local_tls_runtime_unavailable`: تمكين TLS المحلي لـ Gateway، لكن تعذّر على OpenClaw تحميل بصمة الشهادة المحلية.

  </Accordion>
</AccordionGroup>

#### الاتصال البعيد عبر SSH (مماثلة تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS إعادة توجيه منفذ محلي حتى يصبح Gateway البعيد المقيّد بالـ loopback قابلاً للوصول على `ws://127.0.0.1:<port>`.

المكافئ في CLI:

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
  اختيار أول مضيف Gateway مكتشف كهدف SSH من نقطة نهاية الاكتشاف المحلولة (`local.` بالإضافة إلى نطاق الشبكة الواسعة المضبوط، إن وجد). تُتجاهل التلميحات التي تحتوي على TXT فقط.
</ParamField>

الإعدادات الافتراضية (اختيارية): `gateway.remote.sshTarget`، و`gateway.remote.sshIdentity`.

### `gateway call <method>`

أداة مساعدة منخفضة المستوى لـ RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  سلسلة كائن JSON للمعلمات.
</ParamField>
<ParamField path="--url <url>" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  رمز Gateway المميز.
</ParamField>
<ParamField path="--password <password>" type="string">
  كلمة مرور Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  ميزانية المهلة.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  يُستخدم أساسًا لاستدعاءات RPC بنمط الوكيل التي تدفق أحداثًا وسيطة قبل الحمولة النهائية.
</ParamField>
<ParamField path="--json" type="boolean">
  ناتج JSON قابل للقراءة آليًا.
</ParamField>

<Note>
يجب أن تكون قيمة `--params` بصيغة JSON صالحة، وتتحقق كل طريقة من بنية معلماتها الخاصة (تُرفض الحقول الزائدة أو ذات الأسماء غير الصحيحة).
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

استخدم `--wrapper` عندما يجب أن تبدأ الخدمة المُدارة من خلال ملف تنفيذي آخر، مثل وسيط لمدير أسرار أو أداة مساعدة للتشغيل باسم مستخدم آخر. يتلقى المغلّف وسائط Gateway المعتادة، ويكون مسؤولاً عن تنفيذ `openclaw` أو Node في النهاية باستخدام تلك الوسائط.

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

يمكنك أيضًا تعيين الغلاف عبر البيئة. يتحقق `gateway install` من أن المسار ملف قابل للتنفيذ، ويكتب الغلاف في `ProgramArguments` الخاصة بالخدمة، ويحفظ `OPENCLAW_WRAPPER` في بيئة الخدمة لعمليات إعادة التثبيت القسرية والتحديثات وإصلاحات الطبيب اللاحقة.

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
  <Accordion title="خيارات الأمر">
    - `gateway status`: `--url`، `--token`، `--password`، `--timeout`، `--no-probe`، `--require-rpc`، `--deep`، `--json`
    - `gateway install`: `--port`، `--runtime <node|bun>` (الافتراضي: `node`)، `--token`، `--wrapper <path>`، `--force`، `--json`
    - `gateway restart`: `--safe`، `--skip-deferral`، `--force`، `--wait <duration>`، `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`، `--json`

  </Accordion>
  <Accordion title="سلوك دورة الحياة">
    - استخدم `gateway restart` لإعادة تشغيل خدمة مُدارة. لا تسلسل `gateway stop` و`gateway start` كبديل لإعادة التشغيل.
    - على macOS، يستخدم `gateway stop` افتراضيًا `launchctl bootout`، ما يزيل LaunchAgent من جلسة الإقلاع الحالية دون حفظ حالة تعطيل — يظل الاسترداد التلقائي عبر KeepAlive نشطًا للأعطال المستقبلية، ويعيد `gateway start` التمكين بصورة سليمة دون تنفيذ `launchctl enable` يدويًا. مرّر `--disable` لمنع KeepAlive وRunAtLoad بصورة دائمة كي لا يعاود Gateway التشغيل حتى تنفيذ `gateway start` صراحةً في المرة التالية؛ استخدم هذا عندما ينبغي أن يستمر الإيقاف اليدوي بعد عمليات إعادة الإقلاع.
    - تقبل أوامر دورة الحياة `--json` للاستخدام في البرمجة النصية.

  </Accordion>
  <Accordion title="المصادقة وSecretRefs وقت التثبيت">
    - عندما تتطلب مصادقة الرمز المميز رمزًا مميزًا وتكون `gateway.auth.token` مُدارة بواسطة SecretRef، يتحقق `gateway install` من إمكانية حل SecretRef، لكنه لا يحفظ الرمز المميز الذي جرى حله في بيانات تعريف بيئة الخدمة.
    - إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وتعذر حل SecretRef المكوّنة للرمز المميز، يفشل التثبيت بصورة مغلقة بدلًا من حفظ نص صريح احتياطي.
    - لمصادقة كلمة المرور في `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعومة بواسطة SecretRef على `--password` المضمّنة.
    - في وضع المصادقة المستنتج، لا تخفف `OPENCLAW_GATEWAY_PASSWORD` المتاحة في الصدفة فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو `env` في الإعداد) عند تثبيت خدمة مُدارة.
    - إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مكوّنتين وكانت `gateway.auth.mode` غير معيّنة، يُحظر التثبيت حتى يُعيّن الوضع صراحةً.

  </Accordion>
</AccordionGroup>

## اكتشاف بوابات Gateway ‏(Bonjour)

يفحص `gateway discover` إشارات Gateway ‏(`_openclaw-gw._tcp`).

- DNS-SD متعدد البث: `local.`
- DNS-SD أحادي البث (Bonjour واسع النطاق): اختر نطاقًا (مثال: `openclaw.internal.`) وأعِدّ DNS منقسمًا + خادم DNS؛ راجع [Bonjour](/ar/gateway/bonjour).

لا تعلن الإشارة إلا بوابات Gateway التي فُعّل فيها اكتشاف Bonjour (وهو الإعداد الافتراضي).

تلميحات TXT في كل إشارة: `role` (تلميح دور Gateway)، و`transport` (تلميح النقل، مثل `gateway`)، و`gatewayPort` (منفذ WebSocket، وعادةً `18789`)، و`tailnetDns` (اسم مضيف MagicDNS عند توفره)، و`gatewayTls` / `gatewayTlsSha256` (تمكين TLS + بصمة الشهادة). لا تُنشر `sshPort` و`cliPath` إلا في وضع الاكتشاف الكامل (`discovery.mdns.mode: "full"`؛ الافتراضي هو `"minimal"`، الذي يحذفهما — وعندئذٍ تستخدم العملاء المنفذ `22` افتراضيًا لأهداف SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  المهلة الزمنية لكل أمر (التصفح/الحل).
</ParamField>
<ParamField path="--json" type="boolean">
  مخرجات قابلة للقراءة آليًا (وتعطّل أيضًا التنسيق/مؤشر التحميل).
</ParamField>

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- يفحص `local.` بالإضافة إلى النطاق واسع النطاق المكوّن عند تمكينه.
- تُشتق `wsUrl` في مخرجات JSON من نقطة نهاية الخدمة التي جرى حلها، وليس من تلميحات TXT وحدها مثل `lanHost` أو `tailnetDns`.
- تتحكم `discovery.mdns.mode` في نشر `sshPort`/`cliPath` على كل من mDNS ضمن `local.` وDNS-SD واسع النطاق (راجع أعلاه).

</Note>

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
