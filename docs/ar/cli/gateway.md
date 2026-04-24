---
read_when:
    - تشغيل Gateway من CLI ‏(التطوير أو الخوادم)
    - تصحيح أخطاء مصادقة Gateway وأوضاع الربط والاتصال
    - اكتشاف Gateways عبر Bonjour ‏(محلي + DNS-SD على نطاق واسع)
summary: CLI لـ OpenClaw Gateway ‏(`openclaw gateway`) — تشغيل Gateways والاستعلام عنها واكتشافها
title: Gateway
x-i18n:
    generated_at: "2026-04-24T07:34:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 011b8c8f86de6ecafbf17357a458956357ebe8285fe86e2bf875a4e2d87b5126
    source_path: cli/gateway.md
    workflow: 15
---

# CLI لـ Gateway

Gateway هو خادم WebSocket الخاص بـ OpenClaw ‏(القنوات، Nodes، الجلسات، Hooks).

توجد الأوامر الفرعية في هذه الصفحة تحت `openclaw gateway …`.

الوثائق ذات الصلة:

- [/gateway/bonjour](/ar/gateway/bonjour)
- [/gateway/discovery](/ar/gateway/discovery)
- [/gateway/configuration](/ar/gateway/configuration)

## تشغيل Gateway

شغّل عملية Gateway محلية:

```bash
openclaw gateway
```

الاسم المستعار للتشغيل في الواجهة الأمامية:

```bash
openclaw gateway run
```

ملاحظات:

- افتراضيًا، يرفض Gateway البدء ما لم يتم ضبط `gateway.mode=local` في `~/.openclaw/openclaw.json`. استخدم `--allow-unconfigured` لعمليات التشغيل المخصصة/التطويرية.
- من المتوقع أن يقوم `openclaw onboard --mode local` و`openclaw setup` بكتابة `gateway.mode=local`. إذا كان الملف موجودًا لكن `gateway.mode` مفقودًا، فتعامل مع ذلك على أنه إعداد معطوب أو تم استبداله وأصلحه بدلًا من افتراض الوضع المحلي ضمنيًا.
- إذا كان الملف موجودًا وكانت `gateway.mode` مفقودة، فسيتعامل Gateway مع ذلك على أنه ضرر مريب في الإعدادات ويرفض "تخمين الوضع المحلي" نيابةً عنك.
- يتم حظر الربط خارج local loopback من دون مصادقة (حاجز أمان).
- يؤدي `SIGUSR1` إلى إعادة تشغيل داخل العملية عند السماح بذلك (`commands.restart` مفعّل افتراضيًا؛ اضبط `commands.restart: false` لحظر إعادة التشغيل اليدوية، مع بقاء gateway tool/config apply/update مسموحًا).
- تؤدي معالجات `SIGINT`/`SIGTERM` إلى إيقاف عملية gateway، لكنها لا تستعيد أي حالة مخصصة للطرفية. إذا كنت تغلف CLI باستخدام TUI أو إدخال raw mode، فاستعد الطرفية قبل الخروج.

### الخيارات

- `--port <port>`: منفذ WebSocket ‏(تأتي القيمة الافتراضية من config/env؛ وعادةً `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>`: وضع ربط المستمع.
- `--auth <token|password>`: تجاوز وضع المصادقة.
- `--token <token>`: تجاوز الرمز المميز (ويضبط أيضًا `OPENCLAW_GATEWAY_TOKEN` للعملية).
- `--password <password>`: تجاوز كلمة المرور. تحذير: قد تنكشف كلمات المرور المضمّنة ضمنيًا في قوائم العمليات المحلية.
- `--password-file <path>`: قراءة كلمة مرور gateway من ملف.
- `--tailscale <off|serve|funnel>`: عرض Gateway عبر Tailscale.
- `--tailscale-reset-on-exit`: إعادة ضبط إعداد serve/funnel في Tailscale عند الإيقاف.
- `--allow-unconfigured`: السماح ببدء gateway من دون `gateway.mode=local` في الإعدادات. يتجاوز هذا حاجز البدء لتهيئة التطوير/التشغيل المخصص فقط؛ ولا يكتب أو يصلح ملف الإعدادات.
- `--dev`: إنشاء إعداد ومساحة عمل للتطوير إذا كانا مفقودين (ويتخطى BOOTSTRAP.md).
- `--reset`: إعادة ضبط إعدادات التطوير + بيانات الاعتماد + الجلسات + مساحة العمل (يتطلب `--dev`).
- `--force`: إنهاء أي مستمع موجود على المنفذ المحدد قبل البدء.
- `--verbose`: سجلات مطولة.
- `--cli-backend-logs`: إظهار سجلات خلفية CLI فقط في وحدة التحكم (وتمكين stdout/stderr).
- `--ws-log <auto|full|compact>`: نمط سجل websocket ‏(الافتراضي `auto`).
- `--compact`: اسم مستعار لـ `--ws-log compact`.
- `--raw-stream`: تسجيل أحداث تدفق النموذج الخام إلى jsonl.
- `--raw-stream-path <path>`: مسار jsonl للتدفق الخام.

تحليل أداء البدء:

- اضبط `OPENCLAW_GATEWAY_STARTUP_TRACE=1` لتسجيل توقيتات المراحل أثناء بدء Gateway.
- شغّل `pnpm test:startup:gateway -- --runs 5 --warmup 1` لقياس أداء بدء Gateway. يسجل القياس أول مخرجات العملية، و`/healthz`، و`/readyz`، وتوقيتات تتبع البدء.

## الاستعلام عن Gateway قيد التشغيل

تستخدم كل أوامر الاستعلام WebSocket RPC.

أوضاع الإخراج:

- الافتراضي: صيغة مقروءة للبشر (وملوّنة في TTY).
- `--json`: JSON قابل للقراءة آليًا (من دون تنسيق/مؤشر دوران).
- `--no-color` (أو `NO_COLOR=1`): تعطيل ANSI مع الإبقاء على التخطيط المقروء للبشر.

الخيارات المشتركة (حيثما كانت مدعومة):

- `--url <url>`: عنوان URL لـ Gateway WebSocket.
- `--token <token>`: رمز Gateway.
- `--password <password>`: كلمة مرور Gateway.
- `--timeout <ms>`: المهلة/الميزانية (تختلف حسب الأمر).
- `--expect-final`: انتظار استجابة "نهائية" (استدعاءات الوكيل).

ملاحظة: عند ضبط `--url`، لا يرجع CLI إلى بيانات الاعتماد في config أو environment.
مرّر `--token` أو `--password` صراحةً. ويعد غياب بيانات الاعتماد الصريحة خطأ.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

تعد نقطة نهاية HTTP ‏`/healthz` مسبار حيوية: فهي تعيد النتيجة بمجرد أن يتمكن الخادم من الرد على HTTP. أما نقطة نهاية HTTP ‏`/readyz` فهي أكثر صرامة وتظل حمراء أثناء استقرار المكونات الجانبية عند البدء، أو القنوات، أو Hooks المضبوطة.

### `gateway usage-cost`

جلب ملخصات تكلفة الاستخدام من سجلات الجلسات.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

الخيارات:

- `--days <days>`: عدد الأيام التي يجب تضمينها (الافتراضي `30`).

### `gateway stability`

جلب مسجل الاستقرار التشخيصي الأخير من Gateway قيد التشغيل.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

الخيارات:

- `--limit <limit>`: الحد الأقصى لعدد الأحداث الأخيرة التي يجب تضمينها (الافتراضي `25`، الحد الأقصى `1000`).
- `--type <type>`: التصفية حسب نوع الحدث التشخيصي، مثل `payload.large` أو `diagnostic.memory.pressure`.
- `--since-seq <seq>`: تضمين الأحداث التي تأتي بعد رقم تسلسل تشخيصي فقط.
- `--bundle [path]`: قراءة حزمة استقرار محفوظة بدلًا من استدعاء Gateway قيد التشغيل. استخدم `--bundle latest` (أو فقط `--bundle`) لأحدث حزمة ضمن دليل الحالة، أو مرّر مسار JSON للحزمة مباشرة.
- `--export`: كتابة ملف zip تشخيصي قابل للمشاركة للدعم بدلًا من طباعة تفاصيل الاستقرار.
- `--output <path>`: مسار الإخراج لـ `--export`.

ملاحظات:

- تحتفظ السجلات ببيانات وصفية تشغيلية: أسماء الأحداث، والعدادات، وأحجام البايتات، وقراءات الذاكرة، وحالة قائمة الانتظار/الجلسة، وأسماء القنوات/Plugin، وملخصات جلسات منقحة. وهي لا تحتفظ بنصوص الدردشة، أو أجسام Webhook، أو مخرجات الأدوات، أو أجسام الطلبات أو الاستجابات الخام، أو الرموز المميزة، أو Cookies، أو القيم السرية، أو أسماء المضيفين، أو معرّفات الجلسات الخام. اضبط `diagnostics.enabled: false` لتعطيل المسجل بالكامل.
- عند الخروج القاتل لـ Gateway، أو مهلات الإيقاف، أو إخفاقات إعادة تشغيل البدء، يكتب OpenClaw اللقطة التشخيصية نفسها إلى `~/.openclaw/logs/stability/openclaw-stability-*.json` عندما تكون لدى المسجل أحداث. افحص أحدث حزمة باستخدام `openclaw gateway stability --bundle latest`؛ كما تنطبق `--limit` و`--type` و`--since-seq` أيضًا على إخراج الحزمة.

### `gateway diagnostics export`

كتابة ملف zip تشخيصي محلي مصمم لإرفاقه بتقارير الأخطاء.
للاطلاع على نموذج الخصوصية ومحتويات الحزمة، راجع [Diagnostics Export](/ar/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

الخيارات:

- `--output <path>`: مسار zip الناتج. تكون القيمة الافتراضية تصدير دعم ضمن دليل الحالة.
- `--log-lines <count>`: الحد الأقصى لأسطر السجل المنقحة التي يجب تضمينها (الافتراضي `5000`).
- `--log-bytes <bytes>`: الحد الأقصى لبايتات السجل التي يجب فحصها (الافتراضي `1000000`).
- `--url <url>`: عنوان URL لـ Gateway WebSocket للّقطة الصحية.
- `--token <token>`: رمز Gateway للّقطة الصحية.
- `--password <password>`: كلمة مرور Gateway للّقطة الصحية.
- `--timeout <ms>`: مهلة لقطة الحالة/الصحة (الافتراضي `3000`).
- `--no-stability-bundle`: تخطي البحث عن حزمة الاستقرار المحفوظة.
- `--json`: طباعة المسار المكتوب والحجم والبيان الوصفي بصيغة JSON.

يحتوي التصدير على بيان وصفي، وملخص Markdown، وشكل الإعدادات، وتفاصيل إعدادات منقحة، وملخصات سجلات منقحة، ولقطات منقحة لحالة/صحة Gateway، وأحدث حزمة استقرار عند وجودها.

وهو مخصص للمشاركة. ويحتفظ بتفاصيل تشغيلية تساعد في التصحيح، مثل حقول سجل OpenClaw الآمنة، وأسماء الأنظمة الفرعية، ورموز الحالة، والمدد، والأوضاع المضبوطة، والمنافذ، ومعرّفات Plugin، ومعرّفات الموفرين، وإعدادات الميزات غير السرية، ورسائل السجل التشغيلية المنقحة. ويحذف أو ينقّح نصوص الدردشة، وأجسام Webhook، ومخرجات الأدوات، وبيانات الاعتماد، وCookies، ومعرّفات الحساب/الرسالة، ونصوص الموجّهات/التعليمات، وأسماء المضيفين، والقيم السرية. وعندما تبدو رسالة بأسلوب LogTape كنص حمولة مستخدم/دردشة/أداة، يحتفظ التصدير فقط بكون الرسالة قد حُذفت مع عدد بايتاتها.

### `gateway status`

يعرض `gateway status` خدمة Gateway ‏(launchd/systemd/schtasks) بالإضافة إلى مسبار اختياري للاتصال/قدرة المصادقة.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

الخيارات:

- `--url <url>`: إضافة هدف مسبار صريح. يتم أيضًا فحص الهدف البعيد المضبوط + localhost.
- `--token <token>`: مصادقة الرمز المميز للمسبار.
- `--password <password>`: مصادقة كلمة المرور للمسبار.
- `--timeout <ms>`: مهلة المسبار (الافتراضي `10000`).
- `--no-probe`: تخطي مسبار الاتصال (عرض الخدمة فقط).
- `--deep`: فحص خدمات على مستوى النظام أيضًا.
- `--require-rpc`: ترقية مسبار الاتصال الافتراضي إلى مسبار قراءة والخروج بقيمة غير صفرية عند فشل مسبار القراءة. لا يمكن دمجه مع `--no-probe`.

ملاحظات:

- يظل `gateway status` متاحًا لأغراض التشخيص حتى عندما يكون إعداد CLI المحلي مفقودًا أو غير صالح.
- يثبت `gateway status` الافتراضي حالة الخدمة، واتصال WebSocket، وقدرة المصادقة الظاهرة عند وقت handshake. لكنه لا يثبت عمليات القراءة/الكتابة/الإدارة.
- يقوم `gateway status` بحل SecretRef الخاصة بالمصادقة المضبوطة لمصادقة المسبار عندما يكون ذلك ممكنًا.
- إذا كانت SecretRef مطلوبة للمصادقة غير محلولة في مسار هذا الأمر، فإن `gateway status --json` يبلغ عن `rpc.authWarning` عندما يفشل اتصال/مصادقة المسبار؛ مرّر `--token`/`--password` صراحةً أو قم أولًا بحل مصدر السر.
- إذا نجح المسبار، يتم كبت تحذيرات auth-ref غير المحلولة لتجنب الإيجابيات الكاذبة.
- استخدم `--require-rpc` في السكربتات والأتمتة عندما لا تكفي خدمة تستمع فقط وتحتاج أيضًا إلى أن تكون استدعاءات RPC ضمن نطاق القراءة سليمة.
- يضيف `--deep` فحصًا بأفضل جهد لعمليات تثبيت launchd/systemd/schtasks الإضافية. وعند اكتشاف خدمات متعددة شبيهة بـ gateway، يطبع الإخراج المقروء للبشر تلميحات للتنظيف ويحذر من أن معظم الإعدادات يجب أن تشغل gateway واحدة لكل جهاز.
- يتضمن الإخراج المقروء للبشر مسار سجل الملف المحلول بالإضافة إلى لقطة لمسارات/صلاحية إعدادات CLI مقابل الخدمة للمساعدة في تشخيص انحراف profile أو state-dir.
- في عمليات تثبيت systemd على Linux، تقرأ فحوصات انحراف مصادقة الخدمة كلًا من قيم `Environment=` و`EnvironmentFile=` من الوحدة (بما في ذلك `%h`، والمسارات المقتبسة، والملفات المتعددة، وملفات `-` الاختيارية).
- تقوم فحوصات الانحراف بحل SecretRef الخاصة بـ `gateway.auth.token` باستخدام environment وقت التشغيل المدمج (بيئة أمر الخدمة أولًا، ثم الرجوع إلى بيئة العملية).
- إذا لم تكن مصادقة الرمز المميز فعالة فعليًا (وضع `gateway.auth.mode` صريح من `password`/`none`/`trusted-proxy`، أو وضع غير مضبوط حيث يمكن لكلمة المرور أن تفوز ولا يوجد مرشح رمز يمكنه الفوز)، فإن فحوصات انحراف الرمز المميز تتخطى حل رمز الإعداد.

### `gateway probe`

يُعد `gateway probe` أمر "تصحيح كل شيء". فهو يفحص دائمًا:

- الـ gateway البعيدة المضبوطة لديك (إن وُجدت)، و
- localhost ‏(loopback) **حتى إذا كانت remote مضبوطة**.

إذا مررت `--url`، فسيُضاف هذا الهدف الصريح قبل كليهما. يضع الإخراج المقروء للبشر تسميات للأهداف على النحو التالي:

- `URL (explicit)`
- `Remote (configured)` أو `Remote (configured, inactive)`
- `Local loopback`

إذا أمكن الوصول إلى عدة Gateways، فسيطبعها جميعًا. وتُدعَم Gateways المتعددة عندما تستخدم profiles/ports معزولة (مثل rescue bot)، لكن معظم عمليات التثبيت لا تزال تشغل gateway واحدة.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

التفسير:

- تعني `Reachable: yes` أن هدفًا واحدًا على الأقل قبل اتصال WebSocket.
- يشير `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` إلى ما استطاع المسبار إثباته بخصوص المصادقة. وهو منفصل عن قابلية الوصول.
- تعني `Read probe: ok` أن استدعاءات RPC التفصيلية ضمن نطاق القراءة (`health`/`status`/`system-presence`/`config.get`) نجحت أيضًا.
- تعني `Read probe: limited - missing scope: operator.read` أن الاتصال نجح لكن RPC ضمن نطاق القراءة محدودة. ويتم الإبلاغ عن ذلك على أنه قابلية وصول **متدهورة**، لا فشل كامل.
- تكون قيمة الخروج غير صفرية فقط عندما لا يمكن الوصول إلى أي هدف مفحوص.

ملاحظات JSON ‏(`--json`):

- المستوى الأعلى:
  - `ok`: يمكن الوصول إلى هدف واحد على الأقل.
  - `degraded`: كان لدى هدف واحد على الأقل RPC تفصيلي محدود النطاق.
  - `capability`: أفضل قدرة شوهدت عبر الأهداف القابلة للوصول (`read_only` أو `write_capable` أو `admin_capable` أو `pairing_pending` أو `connected_no_operator_scope` أو `unknown`).
  - `primaryTargetId`: أفضل هدف يُعامل على أنه الفائز النشط بهذا الترتيب: عنوان URL الصريح، أو نفق SSH، أو remote المضبوطة، ثم local loopback.
  - `warnings[]`: سجلات تحذير بأفضل جهد تتضمن `code` و`message` و`targetIds` الاختيارية.
  - `network`: تلميحات local loopback/tailnet URL مشتقة من الإعدادات الحالية وشبكة المضيف.
  - `discovery.timeoutMs` و`discovery.count`: ميزانية/عدد نتائج الاكتشاف الفعلية المستخدمة في تمرير هذا المسبار.
- لكل هدف (`targets[].connect`):
  - `ok`: قابلية الوصول بعد الاتصال + تصنيف التدهور.
  - `rpcOk`: نجاح RPC التفصيلي الكامل.
  - `scopeLimited`: فشل RPC التفصيلي بسبب غياب نطاق operator.
- لكل هدف (`targets[].auth`):
  - `role`: دور المصادقة المُبلّغ عنه في `hello-ok` عند توفره.
  - `scopes`: النطاقات الممنوحة المُبلّغ عنها في `hello-ok` عند توفرها.
  - `capability`: تصنيف قدرة المصادقة الظاهر لذلك الهدف.

رموز التحذير الشائعة:

- `ssh_tunnel_failed`: فشل إعداد نفق SSH؛ وعاد الأمر إلى المسابير المباشرة.
- `multiple_gateways`: أمكن الوصول إلى أكثر من هدف واحد؛ وهذا غير معتاد إلا إذا كنت تشغّل profiles معزولة عمدًا، مثل rescue bot.
- `auth_secretref_unresolved`: تعذر حل SecretRef مصادقة مضبوطة لهدف فاشل.
- `probe_scope_limited`: نجح اتصال WebSocket، لكن مسبار القراءة كان محدودًا بسبب غياب `operator.read`.

#### Remote عبر SSH ‏(تكافؤ تطبيق Mac)

يستخدم وضع "Remote over SSH" في تطبيق macOS إعادة توجيه منفذ محلي بحيث تصبح remote gateway ‏(التي قد تكون مرتبطة بـ loopback فقط) قابلة للوصول عند `ws://127.0.0.1:<port>`.

المكافئ في CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

الخيارات:

- `--ssh <target>`: ‏`user@host` أو `user@host:port` ‏(المنفذ الافتراضي `22`).
- `--ssh-identity <path>`: ملف الهوية.
- `--ssh-auto`: اختيار أول مضيف gateway مكتشف كهدف SSH من نقطة نهاية
  الاكتشاف المحلولة (`local.` بالإضافة إلى النطاق الواسع المضبوط، إن وجد). يتم تجاهل
  التلميحات المعتمدة على TXT فقط.

الإعدادات (اختيارية، تُستخدم كقيم افتراضية):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

مساعد RPC منخفض المستوى.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

الخيارات:

- `--params <json>`: سلسلة كائن JSON للمعاملات (الافتراضي `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

ملاحظات:

- يجب أن تكون `--params` بصيغة JSON صالحة.
- يُستخدم `--expect-final` أساسًا مع RPC بأسلوب الوكيل التي تبث أحداثًا وسيطة قبل الحمولة النهائية.

## إدارة خدمة Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

خيارات الأوامر:

- `gateway status`: ‏`--url`، ‏`--token`، ‏`--password`، ‏`--timeout`، ‏`--no-probe`، ‏`--require-rpc`، ‏`--deep`، ‏`--json`
- `gateway install`: ‏`--port`، ‏`--runtime <node|bun>`، ‏`--token`، ‏`--force`، ‏`--json`
- `gateway uninstall|start|stop|restart`: ‏`--json`

ملاحظات:

- يدعم `gateway install` الخيارات `--port` و`--runtime` و`--token` و`--force` و`--json`.
- عندما تتطلب مصادقة الرمز المميز رمزًا مميزًا وتكون `gateway.auth.token` مُدارة عبر SecretRef، يتحقق `gateway install` من أن SecretRef قابلة للحل لكنه لا يحفظ الرمز المحلول في بيانات بيئة الخدمة الوصفية.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكانت SecretRef الخاصة بالرمز المضبوط غير محلولة، يفشل التثبيت بشكل مغلق بدلًا من حفظ نص صريح احتياطي.
- بالنسبة إلى مصادقة كلمة المرور في `gateway run`، فضّل `OPENCLAW_GATEWAY_PASSWORD` أو `--password-file` أو `gateway.auth.password` المدعومة بـ SecretRef بدلًا من `--password` المضمّنة.
- في وضع المصادقة المستنتج، لا يخفف `OPENCLAW_GATEWAY_PASSWORD` الموجود في shell فقط متطلبات رمز التثبيت؛ استخدم إعدادًا دائمًا (`gateway.auth.password` أو config `env`) عند تثبيت خدمة مُدارة.
- إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مضبوطتين وكانت `gateway.auth.mode` غير مضبوطة، فسيُحظر التثبيت حتى يتم ضبط الوضع صراحةً.
- تقبل أوامر دورة الحياة `--json` لأغراض السكربتات.

## اكتشاف Gateways ‏(Bonjour)

يقوم `gateway discover` بفحص إشارات Gateway ‏(`_openclaw-gw._tcp`).

- Multicast DNS-SD: ‏`local.`
- Unicast DNS-SD ‏(Wide-Area Bonjour): اختر نطاقًا (مثال: `openclaw.internal.`) وأعد إعداد split DNS + خادم DNS؛ راجع [/gateway/bonjour](/ar/gateway/bonjour)

فقط Gateways التي تم تمكين اكتشاف Bonjour فيها (افتراضيًا) تعلن عن الإشارة.

تتضمن سجلات الاكتشاف واسعة النطاق (TXT):

- `role` ‏(تلميح دور gateway)
- `transport` ‏(تلميح النقل، مثل `gateway`)
- `gatewayPort` ‏(منفذ WebSocket، وعادةً `18789`)
- `sshPort` ‏(اختياري؛ يستخدم العملاء القيمة الافتراضية `22` لأهداف SSH عند غيابه)
- `tailnetDns` ‏(اسم مضيف MagicDNS، عند توفره)
- `gatewayTls` / `gatewayTlsSha256` ‏(تمكين TLS + بصمة الشهادة)
- `cliPath` ‏(تلميح التثبيت عن بُعد المكتوب إلى المنطقة واسعة النطاق)

### `gateway discover`

```bash
openclaw gateway discover
```

الخيارات:

- `--timeout <ms>`: مهلة لكل أمر (browse/resolve)؛ الافتراضي `2000`.
- `--json`: إخراج قابل للقراءة آليًا (ويعطل أيضًا التنسيق/مؤشر الدوران).

أمثلة:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

ملاحظات:

- يفحص CLI النطاق `local.` بالإضافة إلى النطاق الواسع المضبوط عند تمكينه.
- يتم اشتقاق `wsUrl` في إخراج JSON من نقطة نهاية الخدمة المحلولة، وليس من
  تلميحات TXT فقط مثل `lanHost` أو `tailnetDns`.
- في mDNS المحلي `local.`، لا يتم بث `sshPort` و`cliPath` إلا عندما
  تكون `discovery.mdns.mode` هي `full`. ومع ذلك، يكتب Wide-Area DNS-SD قيمة `cliPath`؛
  وتبقى `sshPort` اختيارية هناك أيضًا.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [دليل تشغيل Gateway](/ar/gateway)
