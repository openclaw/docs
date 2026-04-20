---
read_when:
    - أحالَك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام دليل إجرائي مستقرة قائمة على الأعراض مع أوامر دقيقة
summary: دليل استكشاف الأخطاء وإصلاحها المتعمق لـ Gateway والقنوات والأتمتة والعُقد والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-20T07:29:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d93a82407dbb1314b91a809ff9433114e1e9a3b56d46547ef53a8196bac06260
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# استكشاف أخطاء Gateway وإصلاحها

هذه الصفحة هي الدليل الإجرائي المتعمق.
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

- يعرض `openclaw gateway status` القيم `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- يبلّغ `openclaw doctor` بعدم وجود مشكلات حظر في الإعدادات/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وعند الدعم،
  نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## Anthropic 429: مطلوب استخدام إضافي للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- نموذج Anthropic Opus/Sonnet المحدد يحتوي على `params.context1m: true`.
- بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات الطويلة/عمليات تشغيل النماذج التي تحتاج إلى مسار beta بحجم 1M.

خيارات الإصلاح:

1. عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
2. استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
3. اضبط نماذج احتياطية حتى تستمر عمليات التشغيل عند رفض طلبات Anthropic ذات السياق الطويل.

ذو صلة:

- [/providers/anthropic](/ar/providers/anthropic)
- [/reference/token-use](/ar/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ar/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## الخلفية المحلية المتوافقة مع OpenAI تمرر الفحوصات المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا عندما:

- ينجح `curl ... /v1/models`
- تنجح استدعاءات `/v1/chat/completions` المباشرة الصغيرة
- تفشل عمليات تشغيل نموذج OpenClaw فقط أثناء أدوار الوكيل العادية

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ابحث عن:

- تنجح الاستدعاءات المباشرة الصغيرة، لكن تشغيلات OpenClaw تفشل فقط مع المطالبات الأكبر
- أخطاء في الخلفية حول توقّع `messages[].content` أن يكون سلسلة نصية
- تعطل الخلفية الذي يظهر فقط مع أعداد أكبر من رموز المطالبات أو مع مطالبات وقت تشغيل الوكيل الكاملة

السمات الشائعة:

- `messages[...].content: invalid type: sequence, expected a string` → الخلفية
  ترفض أجزاء محتوى Chat Completions المهيكلة. الإصلاح: اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- تنجح الطلبات المباشرة الصغيرة، لكن أدوار وكيل OpenClaw تفشل مع تعطل الخلفية/النموذج
  (مثلًا Gemma على بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw
  صحيح بالفعل؛ المشكلة في الخلفية التي تفشل مع شكل مطالبة وقت تشغيل الوكيل الأكبر.
- تقل حالات الفشل بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات
  جزءًا من الضغط، لكن المشكلة المتبقية ما تزال في السعة أو في خطأ بالخلفية/الخادم upstream.

خيارات الإصلاح:

1. اضبط `compat.requiresStringContent: true` للخلفيات التي تدعم Chat Completions النصية فقط.
2. اضبط `compat.supportsTools: false` للنماذج/الخلفيات التي لا تستطيع التعامل
   بشكل موثوق مع سطح مخطط أدوات OpenClaw.
3. خفّض ضغط المطالبات حيثما أمكن: تهيئة مساحة عمل أصغر، سجل جلسة أقصر،
   نموذج محلي أخف، أو خلفية ذات دعم أقوى للسياق الطويل.
4. إذا استمرت الطلبات المباشرة الصغيرة بالنجاح بينما ما تزال أدوار وكيل OpenClaw
   تتعطل داخل الخلفية، فاعتبرها قيدًا في الخادم/النموذج upstream وقدّم
   إعادة إنتاج هناك مع شكل الحمولة المقبول.

ذو صلة:

- [/gateway/local-models](/ar/gateway/local-models)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل لكن لا يصل أي رد، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- إقران معلّق لمرسلي الرسائل المباشرة.
- فرض الإشارة في المجموعات (`requireMention` و`mentionPatterns`).
- عدم تطابق قائمة السماح للقناة/المجموعة.

السمات الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة إلى حين وجود إشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تم تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/pairing](/ar/channels/pairing)
- [/channels/groups](/ar/channels/groups)

## اتصال واجهة التحكم Dashboard/Control UI

عندما يتعذر على Dashboard/Control UI الاتصال، تحقّق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان URL الصحيح للفحص وDashboard.
- عدم تطابق وضع/رمز المصادقة بين العميل وGateway.
- استخدام HTTP عندما تكون هوية الجهاز مطلوبة.

السمات الشائعة:

- `device identity required` → سياق غير آمن أو غياب مصادقة الجهاز.
- `origin not allowed` → قيمة `Origin` في المتصفح ليست ضمن `gateway.controlUi.allowedOrigins`
  (أو أنك تتصل من أصل متصفح غير loopback بدون
  قائمة سماح صريحة).
- `device nonce required` / `device nonce mismatch` → العميل لا يُكمل
  تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → العميل وقّع الحمولة الخطأ
  (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
- `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزّن مؤقتًا.
- تعيد محاولة الرمز المخزّن مؤقتًا استخدام مجموعة النطاقات المخزنة مع
  رمز الجهاز المقترن. أما المستدعون الذين يمررون `deviceToken` صريحًا / `scopes` صريحة فيحتفظون
  بمجموعة النطاقات المطلوبة الخاصة بهم بدلًا من ذلك.
- خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال كالتالي: الرمز
  المشترك/كلمة المرور الصريحان أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن،
  ثم رمز bootstrap.
- في مسار Control UI غير المتزامن عبر Tailscale Serve، تُسلسَل المحاولات الفاشلة
  لنفس `{scope, ip}` قبل أن يسجل المحدِّد الفشل. لذلك يمكن أن تُظهر محاولتا إعادة سيئتان متزامنتان من العميل نفسه
  الرسالة `retry later`
  في المحاولة الثانية بدلًا من ظهور حالتي عدم تطابق عاديتين.
- `too many failed authentication attempts (retry later)` من عميل loopback
  ذي أصل متصفح → تُحظر مؤقتًا الإخفاقات المتكررة من نفس `Origin` بعد تطبيعه؛
  ويستخدم أصل localhost آخر حصة منفصلة.
- تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف في الرمز المشترك/رمز الجهاز؛ حدّث إعدادات الرمز وأعد اعتماد/تدوير رمز الجهاز عند الحاجة.
- `gateway connect failed:` → المضيف/المنفذ/عنوان URL الهدف غير صحيح.

### خريطة سريعة لتفاصيل رموز المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                  | المعنى                                                                                                                                                                                       | الإجراء الموصى به                                                                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                       | الصق/اضبط الرمز في العميل ثم أعد المحاولة. لمسارات Dashboard: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI.                                                                                                                                                 |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                                   | إذا كانت `canRetryWithDeviceToken=true`، اسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزّن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ أما المستدعون الذين يمررون `deviceToken` / `scopes` صريحة فيحتفظون بالنطاقات المطلوبة. إذا استمر الفشل، شغّل [قائمة التحقق من استرداد انجراف الرمز](/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | رمز كل جهاز المخزّن مؤقتًا قديم أو أُلغي.                                                                                                                                                    | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI الأجهزة](/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                         |
| `PAIRING_REQUIRED`           | تتطلب هوية الجهاز موافقة. تحقّق من `error.details.reason` لمعرفة `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند توفرهما. | وافق على الطلب المعلّق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور المسار نفسه بعد مراجعة الوصول المطلوب.                                                                                                                           |

فحص ترحيل مصادقة الجهاز v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/signature، فحدّث العميل المتصل وتحقق من أنه:

1. ينتظر `connect.challenge`
2. يوقّع الحمولة المرتبطة بالتحدي
3. يرسل `connect.params.device.nonce` مع nonce التحدي نفسها

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- يمكن لجلسات رموز الأجهزة المقترنة إدارة **جهازها فقط**
  ما لم يكن لدى المستدعي أيضًا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات operator
  إلا إذا كانت جلسة المستدعي تحملها بالفعل

ذو صلة:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [/gateway/trusted-proxy-auth](/ar/gateway/trusted-proxy-auth)
- [/gateway/remote](/ar/gateway/remote)
- [/cli/devices](/cli/devices)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبتة لكن العملية لا تبقى قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # يفحص أيضًا خدمات النظام
```

ابحث عن:

- `Runtime: stopped` مع تلميحات الخروج.
- عدم تطابق إعدادات الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

السمات الشائعة:

- `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → لم يتم تمكين وضع Gateway المحلي، أو تم العبث بملف الإعدادات وفقد `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. إذا كنت تشغّل OpenClaw عبر Podman، فإن مسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → ربط غير loopback من دون مسار مصادقة صالح لـ Gateway (رمز/كلمة مرور، أو trusted-proxy عند ضبطه).
- `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
- `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. في معظم الإعدادات يجب الإبقاء على Gateway واحد لكل جهاز؛ وإذا كنت تحتاج بالفعل إلى أكثر من واحد، فعليك عزل المنافذ + الإعدادات/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

ذو صلة:

- [/gateway/background-process](/ar/gateway/background-process)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه ما يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير متعلقًا بالرجوع إلى SSH أو بوجود عدة Gateways أو بنطاقات مفقودة أو بمراجع مصادقة غير محلولة.

السمات الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر ما يزال يحاول الأهداف المباشرة المضبوطة/الـ loopback.
- `multiple reachable gateways detected` → استجاب أكثر من هدف واحد. عادةً ما يعني هذا إعدادًا مقصودًا لعدة Gateways أو مستمعات قديمة/مكررة.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن تفاصيل RPC محدودة بالنطاق؛ قم بإقران هوية الجهاز أو استخدم بيانات اعتماد تتضمن `operator.read`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → استجاب Gateway، لكن هذا العميل ما يزال يحتاج إلى الإقران/الموافقة قبل الوصول التشغيلي العادي.
- نص تحذير SecretRef غير المحلول في `gateway.auth.*` / `gateway.remote.*` → لم تكن مادة المصادقة متاحة في مسار هذا الأمر للهدف الذي فشل.

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
- قائمة السماح للمجموعة ومتطلبات الإشارة.
- أذونات/نطاقات API المفقودة الخاصة بالقناة.

السمات الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلقة → لم تتم الموافقة على المرسل.
- `missing_scope` أو `not_in_channel` أو `Forbidden` أو `401/403` → مشكلة في مصادقة/أذونات القناة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/whatsapp](/ar/channels/whatsapp)
- [/channels/telegram](/ar/channels/telegram)
- [/channels/discord](/ar/channels/discord)

## تسليم Cron وHeartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يتم التسليم، فتحقق أولًا من حالة المجدول ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- أن يكون Cron ممكّنًا ووقت التنبيه التالي موجودًا.
- حالة سجل تشغيل المهمة (`ok` أو `skipped` أو `error`).
- أسباب تخطي Heartbeat (`quiet-hours` أو `requests-in-flight` أو `alerts-disabled` أو `empty-heartbeat-file` أو `no-tasks-due`).

السمات الشائعة:

- `cron: scheduler disabled; jobs will not run automatically` → تم تعطيل Cron.
- `cron: timer tick failed` → فشل نبض المجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
- `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
- `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / عناوين Markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
- `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
- `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
- `heartbeat skipped` مع `reason=dm-blocked` → تم تحليل هدف Heartbeat إلى وجهة من نمط الرسائل المباشرة بينما تم ضبط `agents.defaults.heartbeat.directPolicy` (أو التجاوز الخاص بالوكيل) على `block`.

ذو صلة:

- [/automation/cron-jobs#troubleshooting](/ar/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ar/automation/cron-jobs)
- [/gateway/heartbeat](/ar/gateway/heartbeat)

## فشل أداة Node المقترنة

إذا كانت Node مقترنة لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- أن تكون Node متصلة مع الإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- حالة موافقات التنفيذ وقائمة السماح.

السمات الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → تم حظر الأمر بواسطة قائمة السماح.

ذو صلة:

- [/nodes/troubleshooting](/ar/nodes/troubleshooting)
- [/nodes/index](/ar/nodes/index)
- [/tools/exec-approvals](/ar/tools/exec-approvals)

## فشل أداة المتصفح

استخدم هذا عندما تفشل إجراءات أداة المتصفح رغم أن Gateway نفسه سليم.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كان `plugins.allow` مضبوطًا ويتضمن `browser`.
- مسار تنفيذي متصفح صالح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات تعريف `existing-session` / `user`.

السمات الشائعة:

- `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمّن بواسطة `plugins.allow`.
- أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل Plugin أصلًا.
- `Failed to start Chrome CDP on port` → فشلت عملية المتصفح في الإطلاق.
- `browser.executablePath not found` → المسار المضبوط غير صالح.
- `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP المضبوط مخططًا غير مدعوم مثل `file:` أو `ftp:`.
- `browser.cdpUrl has invalid port` → يحتوي عنوان CDP المضبوط على منفذ سيئ أو خارج النطاق.
- `No Chrome tabs found for profile="user"` → لا توجد علامات تبويب Chrome محلية مفتوحة لملف تعريف إرفاق Chrome MCP.
- `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المضبوطة من مضيف Gateway.
- `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يوجد هدف يمكن الوصول إليه لملف تعريف attach-only، أو أن نقطة نهاية HTTP استجابت لكن لم يكن بالإمكان فتح WebSocket الخاص بـ CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى حزمة Playwright الكاملة؛ ما تزال لقطات ARIA ولقطات الشاشة الأساسية للصفحات تعمل، لكن التنقل ولقطات AI ولقطات عناصر CSS selector وتصدير PDF تبقى غير متاحة.
- `fullPage is not supported for element screenshots` → مزج طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات شاشة Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من snapshot، وليس CSS `--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج Hooks رفع الملفات في Chrome MCP إلى مراجع snapshot، وليس محددات CSS.
- `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء في ملفات تعريف Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → لا تدعم Hooks مربعات الحوار في ملفات تعريف Chrome MCP تجاوزات المهلة.
- `response body is not supported for existing-session profiles yet.` → ما يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
- بقاء تجاوزات viewport / dark-mode / locale / offline القديمة في ملفات تعريف attach-only أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP من دون إعادة تشغيل Gateway بالكامل.

ذو صلة:

- [/tools/browser-linux-troubleshooting](/ar/tools/browser-linux-troubleshooting)
- [/tools/browser](/ar/tools/browser)

## إذا قمت بالترقية وتعطل شيء فجأة

معظم الأعطال بعد الترقية تكون بسبب انجراف الإعدادات أو فرض قيم افتراضية أكثر صرامة الآن.

### 1) تغيّر سلوك المصادقة وتجاوز عنوان URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

ما يجب التحقق منه:

- إذا كان `gateway.mode=remote`، فقد تستهدف استدعاءات CLI نظامًا بعيدًا بينما خدمتك المحلية تعمل بشكل جيد.
- لا تعود الاستدعاءات الصريحة `--url` إلى بيانات الاعتماد المخزنة.

السمات الشائعة:

- `gateway connect failed:` → عنوان URL الهدف غير صحيح.
- `unauthorized` → يمكن الوصول إلى نقطة النهاية لكن المصادقة خاطئة.

### 2) أصبحت قيود الربط والمصادقة أكثر صرامة

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

ما يجب التحقق منه:

- تتطلب عمليات الربط غير loopback (`lan` أو `tailnet` أو `custom`) مسار مصادقة صالحًا لـ Gateway: مصادقة برمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير loopback مضبوطًا بشكل صحيح.
- لا تحل المفاتيح القديمة مثل `gateway.token` محل `gateway.auth.token`.

السمات الشائعة:

- `refusing to bind gateway ... without auth` → ربط غير loopback من دون مسار مصادقة صالح لـ Gateway.
- `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway حي لكنه غير قابل للوصول باستخدام المصادقة/عنوان URL الحاليين.

### 3) تغيّرت حالة الإقران وهوية الجهاز

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

ما يجب التحقق منه:

- موافقات الأجهزة المعلقة لـ Dashboard/Nodes.
- موافقات إقران الرسائل المباشرة المعلقة بعد تغييرات السياسة أو الهوية.

السمات الشائعة:

- `device identity required` → لم يتم استيفاء مصادقة الجهاز.
- `pairing required` → يجب الموافقة على المرسل/الجهاز.

إذا استمر عدم تطابق إعدادات الخدمة ووقت التشغيل بعد عمليات التحقق، فأعد تثبيت بيانات تعريف الخدمة من الدليل نفسه الخاص بالملف الشخصي/الحالة:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذو صلة:

- [/gateway/pairing](/ar/gateway/pairing)
- [/gateway/authentication](/ar/gateway/authentication)
- [/gateway/background-process](/ar/gateway/background-process)
