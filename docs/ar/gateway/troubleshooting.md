---
read_when:
    - أحالَك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - أنت بحاجة إلى أقسام دليل تشغيل قائمة على الأعراض ومستقرة تتضمن أوامر دقيقة
summary: دليل متعمق لاستكشاف الأخطاء وإصلاحها لـ gateway والقنوات والأتمتة والعُقد والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-11T02:45:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# استكشاف أخطاء Gateway وإصلاحها

هذه الصفحة هي دليل التشغيل المتعمق.
ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد مسار الفرز السريع أولًا.

## تسلسل الأوامر

شغّل هذه الأوامر أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

الإشارات الصحية المتوقعة:

- يعرض `openclaw gateway status` القيمتين `Runtime: running` و`RPC probe: ok`.
- يبلّغ `openclaw doctor` عن عدم وجود مشكلات إعداد/خدمة معيقة.
- يعرض `openclaw channels status --probe` حالة النقل المباشرة لكل حساب، ونتائج الفحص/التدقيق حيثما كان ذلك مدعومًا، مثل `works` أو `audit ok`.

## Anthropic 429 يتطلب استخدامًا إضافيًا للسياق الطويل

استخدم هذا القسم عندما تتضمن السجلات/الأخطاء:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- أن نموذج Anthropic Opus/Sonnet المحدد يحتوي على `params.context1m: true`.
- أن بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- أن الطلبات تفشل فقط في الجلسات الطويلة أو تشغيلات النماذج التي تحتاج إلى مسار 1M التجريبي.

خيارات الإصلاح:

1. عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
2. استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
3. اضبط نماذج احتياطية حتى تستمر التشغيلات عندما تُرفض طلبات Anthropic للسياق الطويل.

ذو صلة:

- [/providers/anthropic](/ar/providers/anthropic)
- [/reference/token-use](/ar/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ar/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## خلفية محلية متوافقة مع OpenAI تجتاز الفحوصات المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا القسم عندما:

- ينجح `curl ... /v1/models`
- تنجح استدعاءات `/v1/chat/completions` المباشرة الصغيرة
- تفشل تشغيلات نماذج OpenClaw فقط أثناء أدوار الوكيل العادية

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ابحث عن:

- أن الاستدعاءات المباشرة الصغيرة تنجح، لكن تشغيلات OpenClaw تفشل فقط مع المطالبات الأكبر
- أخطاء في الخلفية بشأن توقّع `messages[].content` أن يكون سلسلة نصية
- تعطل الخلفية الذي يظهر فقط مع أعداد أكبر من رموز المطالبات أو مطالبات وقت تشغيل الوكيل الكاملة

الأنماط الشائعة:

- `messages[...].content: invalid type: sequence, expected a string` → الخلفية ترفض أجزاء محتوى Chat Completions المهيكلة. الإصلاح: اضبط `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكلاء OpenClaw تفشل مع تعطل الخلفية/النموذج (مثل Gemma على بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ الخلفية هي التي تفشل مع شكل مطالبة وقت تشغيل الوكيل الأكبر.
- تتراجع الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية ما تزال في سعة النموذج/الخادم المصدر أو في خطأ بالخلفية.

خيارات الإصلاح:

1. اضبط `compat.requiresStringContent: true` للخلفيات التي لا تدعم إلا محتوى Chat Completions النصي.
2. اضبط `compat.supportsTools: false` للنماذج/الخلفيات التي لا تستطيع التعامل بشكل موثوق مع سطح مخطط أدوات OpenClaw.
3. خفّض ضغط المطالبات حيثما أمكن: bootstrap أصغر لمساحة العمل، وسجل جلسة أقصر، ونموذج محلي أخف، أو خلفية ذات دعم أقوى للسياق الطويل.
4. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما ما تزال أدوار وكيل OpenClaw تتعطل داخل الخلفية، فاعتبر ذلك قيدًا في الخادم/النموذج المصدر وقدّم بلاغ إعادة إنتاج هناك مع شكل الحمولة المقبول.

ذو صلة:

- [/gateway/local-models](/ar/gateway/local-models)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل لكن لا يوجد أي رد، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلّق لمرسلي الرسائل المباشرة.
- اشتراط الإشارة في المجموعات (`requireMention` و`mentionPatterns`).
- عدم تطابق قائمة السماح للقناة/المجموعة.

الأنماط الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة حتى تتم الإشارة.
- `pairing request` → يحتاج المرسل إلى الموافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/pairing](/ar/channels/pairing)
- [/channels/groups](/ar/channels/groups)

## اتصال Dashboard وControl UI

عندما يتعذر على dashboard أو Control UI الاتصال، تحقّق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان URL الصحيح للفحص وdashboard.
- عدم تطابق وضع/رمز المصادقة بين العميل وgateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

الأنماط الشائعة:

- `device identity required` → سياق غير آمن أو غياب مصادقة الجهاز.
- `origin not allowed` → قيمة `Origin` في المتصفح غير موجودة في `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير loopback بدون قائمة سماح صريحة).
- `device nonce required` / `device nonce mismatch` → العميل لا يكمل تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخاطئة (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
- `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل تنفيذ إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزن مؤقتًا.
- تعيد محاولة الرمز المخزن مؤقتًا استخدام مجموعة النطاقات المخزنة مع رمز الجهاز المقترن. أما المستدعون الذين يمررون `deviceToken` صريحًا أو `scopes` صريحة فيحتفظون بمجموعة النطاقات المطلوبة لديهم بدلًا من ذلك.
- خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
- في مسار Control UI غير المتزامن عبر Tailscale Serve، تتم مَسلسلة المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدِّد الفشل. لذلك قد تُظهر محاولتا إعادة سيئتان ومتزامنتان من العميل نفسه الرسالة `retry later` في المحاولة الثانية بدلًا من حالتي عدم تطابق عاديتين.
- `too many failed authentication attempts (retry later)` من عميل loopback ذي أصل متصفح → يتم حظر الإخفاقات المتكررة مؤقتًا من ذلك `Origin` المُطبَّع نفسه؛ ويستخدم أصل localhost آخر حاوية منفصلة.
- `unauthorized` متكرر بعد تلك إعادة المحاولة → انجراف في الرمز المشترك/رمز الجهاز؛ حدّث إعدادات الرمز وأعِد الموافقة على رمز الجهاز أو دوّره إذا لزم الأمر.
- `gateway connect failed:` → الهدف host/port/url غير صحيح.

### خريطة سريعة لتفاصيل رموز المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                | المعنى                                                   | الإجراء الموصى به                                                                                                                                                                                                                                                                          |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                  | الصق/اضبط الرمز في العميل ثم أعد المحاولة. لمسارات dashboard: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI.                                                                                                                                                  |
| `AUTH_TOKEN_MISMATCH`       | الرمز المشترك لا يطابق رمز مصادقة gateway.             | إذا كانت `canRetryWithDeviceToken=true`، اسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ أما المستدعون الذين يمررون `deviceToken` أو `scopes` صريحة فيحتفظون بالنطاقات المطلوبة. إذا استمر الفشل، شغّل [قائمة التحقق من استرداد انجراف الرمز](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | رمز كل جهاز المخزن مؤقتًا قديم أو ملغى.                | دوّر رمز الجهاز أو أعد الموافقة عليه باستخدام [CLI الأجهزة](/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                               |
| `PAIRING_REQUIRED`          | هوية الجهاز معروفة لكنها غير معتمدة لهذا الدور.        | وافق على الطلب المعلّق: `openclaw devices list` ثم `openclaw devices approve <requestId>`.                                                                                                                                                                                               |

فحص ترحيل مصادقة الأجهزة v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/التوقيع، فحدّث العميل المتصل وتحقّق من أنه:

1. ينتظر `connect.challenge`
2. يوقّع الحمولة المرتبطة بالتحدي
3. يرسل `connect.params.device.nonce` مع nonce التحدي نفسه

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- يمكن لجلسات رمز الجهاز المقترن إدارة **أجهزتها فقط** ما لم تكن جلسة المستدعي تملك أيضًا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات المشغّل إلا إذا كانت جلسة المستدعي تملك هذه النطاقات بالفعل

ذو صلة:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ar/gateway/configuration) (أوضاع مصادقة gateway)
- [/gateway/trusted-proxy-auth](/ar/gateway/trusted-proxy-auth)
- [/gateway/remote](/ar/gateway/remote)
- [/cli/devices](/cli/devices)

## خدمة Gateway لا تعمل

استخدم هذا القسم عندما تكون الخدمة مثبّتة لكن العملية لا تظل قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # يفحص أيضًا الخدمات على مستوى النظام
```

ابحث عن:

- `Runtime: stopped` مع تلميحات الخروج.
- عدم تطابق إعدادات الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- عمليات تثبيت launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

الأنماط الشائعة:

- `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → وضع gateway المحلي غير مفعّل، أو تم العبث بملف الإعداد وفقد قيمة `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. إذا كنت تشغّل OpenClaw عبر Podman، فمسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → ربط غير loopback بدون مسار مصادقة صالح للـ gateway (رمز/كلمة مرور، أو trusted-proxy حيث يكون مضبوطًا).
- `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
- `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. ينبغي لمعظم الإعدادات الاحتفاظ بـ gateway واحد لكل جهاز؛ وإذا كنت تحتاج فعلًا إلى أكثر من واحد، فاعزل المنافذ والإعدادات/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

ذو صلة:

- [/gateway/background-process](/ar/gateway/background-process)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا القسم عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه ما يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير متعلقًا بالرجوع إلى SSH، أو بوجود عدة gateway، أو بنطاقات مفقودة، أو بمراجع مصادقة غير محلولة.

الأنماط الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر ما يزال يحاول الفحص المباشر للأهداف المضبوطة/‏loopback.
- `multiple reachable gateways detected` → استجاب أكثر من هدف واحد. ويعني هذا عادةً إعدادًا مقصودًا لعدة gateway أو وجود مستمعات قديمة/مكررة.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن تفاصيل RPC محدودة بالنطاقات؛ قم بإقران هوية الجهاز أو استخدم بيانات اعتماد تملك `operator.read`.
- نص تحذير SecretRef غير المحلول في `gateway.auth.*` / `gateway.remote.*` → لم تكن بيانات المصادقة متاحة في مسار هذا الأمر للهدف الذي فشل.

ذو صلة:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ar/gateway/remote)

## القناة متصلة لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة والأذونات وقواعد التسليم الخاصة بالقناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة الرسائل المباشرة (`pairing` أو `allowlist` أو `open` أو `disabled`).
- قائمة السماح للمجموعات ومتطلبات الإشارة.
- أذونات/نطاقات API المفقودة الخاصة بالقناة.

الأنماط الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعات.
- آثار `pairing` / الموافقة المعلقة → لم تتم الموافقة على المرسل.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → مشكلة في مصادقة/أذونات القناة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/whatsapp](/ar/channels/whatsapp)
- [/channels/telegram](/ar/channels/telegram)
- [/channels/discord](/ar/channels/discord)

## تسليم Cron وHeartbeat

إذا لم يعمل cron أو heartbeat أو لم يتم التسليم، فتحقق أولًا من حالة المجدول، ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- أن cron مفعّل وأن وقت الاستيقاظ التالي موجود.
- حالة سجل تشغيل المهمة (`ok` أو `skipped` أو `error`).
- أسباب تخطي heartbeat (`quiet-hours` أو `requests-in-flight` أو `alerts-disabled` أو `empty-heartbeat-file` أو `no-tasks-due`).

الأنماط الشائعة:

- `cron: scheduler disabled; jobs will not run automatically` → تم تعطيل cron.
- `cron: timer tick failed` → فشل نبض المجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
- `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
- `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / عناوين Markdown، لذلك يتجاوز OpenClaw استدعاء النموذج.
- `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
- `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم heartbeat.
- `heartbeat skipped` مع `reason=dm-blocked` → تم تحليل هدف heartbeat إلى وجهة بأسلوب الرسائل المباشرة بينما كان `agents.defaults.heartbeat.directPolicy` (أو التجاوز الخاص بكل وكيل) مضبوطًا على `block`.

ذو صلة:

- [/automation/cron-jobs#troubleshooting](/ar/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ar/automation/cron-jobs)
- [/gateway/heartbeat](/ar/gateway/heartbeat)

## أداة العقدة المقترنة تفشل

إذا كانت العقدة مقترنة لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- أن العقدة متصلة وتملك الإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- حالة موافقات التنفيذ وقائمة السماح.

الأنماط الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق العقدة في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → أذونات نظام التشغيل مفقودة.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → تم حظر الأمر بواسطة قائمة السماح.

ذو صلة:

- [/nodes/troubleshooting](/ar/nodes/troubleshooting)
- [/nodes/index](/ar/nodes/index)
- [/tools/exec-approvals](/ar/tools/exec-approvals)

## أداة المتصفح تفشل

استخدم هذا القسم عندما تفشل إجراءات أداة المتصفح رغم أن gateway نفسه سليم.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كانت `plugins.allow` مضبوطة وتتضمن `browser`.
- مسار ملف المتصفح التنفيذي صالح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات التعريف `existing-session` / `user`.

الأنماط الشائعة:

- `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد plugin المتصفح المضمّن بواسطة `plugins.allow`.
- غياب أداة المتصفح / عدم توفرها بينما `browser.enabled=true` → تستبعد `plugins.allow` القيمة `browser`، لذلك لم يتم تحميل plugin أصلًا.
- `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
- `browser.executablePath not found` → المسار المضبوط غير صالح.
- `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP URL المضبوط مخططًا غير مدعوم مثل `file:` أو `ftp:`.
- `browser.cdpUrl has invalid port` → يحتوي CDP URL المضبوط على منفذ سيئ أو خارج النطاق.
- `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف الإرفاق Chrome MCP على أي ألسنة Chrome محلية مفتوحة.
- `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المضبوطة من مضيف gateway.
- `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يوجد هدف يمكن الوصول إليه لملف التعريف attach-only، أو أن نقطة نهاية HTTP استجابت لكن تعذر مع ذلك فتح CDP WebSocket.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت gateway الحالي إلى حزمة Playwright الكاملة؛ ما يزال من الممكن عمل لقطات ARIA ولقطات الشاشة الأساسية للصفحة، لكن التنقل ولقطات AI ولقطات العناصر بمحددات CSS وتصدير PDF تبقى غير متاحة.
- `fullPage is not supported for element screenshots` → مزج طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات رفع الملفات في Chrome MCP إلى مراجع لقطات، وليس محددات CSS.
- `existing-session file uploads currently support one file at a time.` → أرسل ملف رفع واحدًا لكل استدعاء في ملفات تعريف Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات مربعات الحوار في ملفات تعريف Chrome MCP تجاوزات المهلة.
- `response body is not supported for existing-session profiles yet.` → ما يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
- تجاوزات viewport / الوضع الداكن / اللغة / عدم الاتصال القديمة على ملفات التعريف attach-only أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP بدون إعادة تشغيل gateway بالكامل.

ذو صلة:

- [/tools/browser-linux-troubleshooting](/ar/tools/browser-linux-troubleshooting)
- [/tools/browser](/ar/tools/browser)

## إذا قمت بالترقية وتعطل شيء فجأة

تكون معظم الأعطال بعد الترقية بسبب انجراف الإعدادات أو فرض افتراضات أكثر صرامة الآن.

### 1) تغيّر سلوك المصادقة وتجاوز عنوان URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

ما الذي يجب التحقق منه:

- إذا كانت `gateway.mode=remote`، فقد تستهدف استدعاءات CLI جهة بعيدة بينما خدمتك المحلية تعمل بشكل جيد.
- لا تعود استدعاءات `--url` الصريحة إلى بيانات الاعتماد المخزنة.

الأنماط الشائعة:

- `gateway connect failed:` → هدف URL غير صحيح.
- `unauthorized` → يمكن الوصول إلى نقطة النهاية لكن المصادقة غير صحيحة.

### 2) أصبحت ضوابط الربط والمصادقة أكثر صرامة

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

ما الذي يجب التحقق منه:

- تحتاج عمليات الربط غير loopback (`lan` أو `tailnet` أو `custom`) إلى مسار مصادقة gateway صالح: مصادقة برمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير loopback مضبوط بشكل صحيح.
- لا تستبدل المفاتيح القديمة مثل `gateway.token` القيمة `gateway.auth.token`.

الأنماط الشائعة:

- `refusing to bind gateway ... without auth` → ربط غير loopback بدون مسار مصادقة gateway صالح.
- `RPC probe: failed` بينما وقت التشغيل يعمل → gateway يعمل لكن يتعذر الوصول إليه باستخدام المصادقة/عنوان URL الحاليين.

### 3) تغيّرت حالة الاقتران وهوية الجهاز

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

ما الذي يجب التحقق منه:

- موافقات الأجهزة المعلقة لـ dashboard/‏nodes.
- موافقات اقتران الرسائل المباشرة المعلقة بعد تغييرات السياسة أو الهوية.

الأنماط الشائعة:

- `device identity required` → لم يتم استيفاء مصادقة الجهاز.
- `pairing required` → يجب الموافقة على المرسل/الجهاز.

إذا استمر عدم تطابق إعدادات الخدمة ووقت التشغيل بعد هذه الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل profile/state نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذو صلة:

- [/gateway/pairing](/ar/gateway/pairing)
- [/gateway/authentication](/ar/gateway/authentication)
- [/gateway/background-process](/ar/gateway/background-process)
