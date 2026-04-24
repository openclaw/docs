---
read_when:
    - قام مركز استكشاف الأخطاء وإصلاحها بتوجيهك إلى هنا من أجل تشخيص أعمق
    - تحتاج إلى أقسام دليل تشغيل مستقرة مبنية على الأعراض مع أوامر دقيقة
summary: دليل تشغيل متعمق لاستكشاف أخطاء gateway والقنوات والأتمتة وNodes والمتصفح وإصلاحها
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-24T07:44:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c4cbbbe8b1cd5eaca34503f4a363d3fa2650e491f83455958eb5725f9d50c5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# استكشاف أخطاء Gateway وإصلاحها

هذه الصفحة هي دليل التشغيل المتعمق.
ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد تدفق الفرز السريع أولًا.

## تسلسل الأوامر

شغّل هذه الأوامر أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

الإشارات السليمة المتوقعة:

- يعرض `openclaw gateway status` القيم `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- يبلغ `openclaw doctor` عن عدم وجود مشكلات حظر في الإعدادات/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل المباشرة لكل حساب،
  وحيثما كان ذلك مدعومًا، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## Anthropic 429 extra usage required for long context

استخدم هذا عندما تتضمن السجلات/الأخطاء:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- يحتوي نموذج Anthropic Opus/Sonnet المحدد على `params.context1m: true`.
- بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات الطويلة/عمليات تشغيل النماذج التي تحتاج إلى مسار 1M التجريبي.

خيارات الإصلاح:

1. عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
2. استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
3. اضبط نماذج احتياطية بحيث تستمر العمليات عندما يتم رفض طلبات Anthropic ذات السياق الطويل.

ذو صلة:

- [/providers/anthropic](/ar/providers/anthropic)
- [/reference/token-use](/ar/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## واجهة خلفية محلية متوافقة مع OpenAI تجتاز الفحوصات المباشرة لكن عمليات تشغيل الوكيل تفشل

استخدم هذا عندما:

- يعمل `curl ... /v1/models`
- تعمل الاستدعاءات الصغيرة المباشرة إلى `/v1/chat/completions`
- تفشل عمليات تشغيل نموذج OpenClaw فقط في أدوار الوكيل العادية

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

ابحث عن:

- نجاح الاستدعاءات الصغيرة المباشرة، لكن عمليات OpenClaw تفشل فقط مع المطالبات الأكبر
- أخطاء في الواجهة الخلفية حول `messages[].content` التي تتوقع سلسلة
- أعطال في الواجهة الخلفية لا تظهر إلا مع أعداد رموز أكبر للمطالبة أو مطالبات
  وقت تشغيل الوكيل الكاملة

التواقيع الشائعة:

- `messages[...].content: invalid type: sequence, expected a string` → الواجهة الخلفية
  ترفض أجزاء المحتوى المنظم الخاصة بـ Chat Completions. الإصلاح: اضبط
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- تنجح الطلبات الصغيرة المباشرة، لكن عمليات تشغيل وكيل OpenClaw تفشل مع أعطال
  في الواجهة الخلفية/النموذج (مثل Gemma على بعض إصدارات `inferrs`) → من
  المرجح أن يكون نقل OpenClaw صحيحًا بالفعل؛ والفشل في الواجهة الخلفية ناتج عن
  شكل مطالبة وقت تشغيل الوكيل الأكبر.
- تقل الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات
  جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم في
  المصدر العلوي أو في خلل بالواجهة الخلفية.

خيارات الإصلاح:

1. اضبط `compat.requiresStringContent: true` للواجهات الخلفية الخاصة بـ Chat Completions التي تقبل سلاسل فقط.
2. اضبط `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع التعامل
   مع سطح مخطط أدوات OpenClaw بشكل موثوق.
3. خفف ضغط المطالبة حيثما أمكن: bootstrap أصغر لمساحة العمل، وسجل جلسة
   أقصر، أو نموذج محلي أخف، أو واجهة خلفية ذات دعم أقوى للسياق الطويل.
4. إذا استمرت الطلبات الصغيرة المباشرة في النجاح بينما تستمر أدوار وكيل OpenClaw في التعطل
   داخل الواجهة الخلفية، فاعتبر ذلك قيدًا في الخادم/النموذج في المصدر العلوي وقدّم
   تقرير إعادة إنتاج هناك مع شكل الحمولة المقبول.

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

- اقتران معلق لمرسلي الرسائل الخاصة.
- بوابة الإشارة في المجموعات (`requireMention`, `mentionPatterns`).
- عدم تطابق قوائم سماح القناة/المجموعة.

التواقيع الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة إلى أن تتم الإشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/pairing](/ar/channels/pairing)
- [/channels/groups](/ar/channels/groups)

## اتصال dashboard control ui

عندما لا تتصل dashboard/control UI، تحقق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان URL الصحيح للمسبار وdashboard.
- عدم تطابق وضع المصادقة/الرمز المميز بين العميل وgateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

التواقيع الشائعة:

- `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
- `origin not allowed` → المتصفح `Origin` غير موجود في `gateway.controlUi.allowedOrigins`
  (أو أنك تتصل من مصدر متصفح غير loopback من دون
  قائمة سماح صريحة).
- `device nonce required` / `device nonce mismatch` → العميل لا يكمل
  تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → العميل وقّع الحمولة الخاطئة
  (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
- `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل تنفيذ إعادة محاولة موثوقة واحدة باستخدام device token مخزنة مؤقتًا.
- تعيد إعادة المحاولة باستخدام الرمز المخزن مؤقتًا استخدام مجموعة النطاقات المخزنة مع
  device token الموافق عليها. أما المتصلون الذين يستخدمون `deviceToken`/`scopes` صريحة
  فيحتفظون بمجموعة النطاقات المطلوبة الخاصة بهم بدلًا من ذلك.
- خارج مسار إعادة المحاولة ذاك، تكون أسبقية مصادقة الاتصال: الرمز/كلمة المرور
  المشتركان الصريحان أولًا، ثم `deviceToken` الصريحة، ثم device token المخزنة، ثم bootstrap token.
- في مسار Tailscale Serve Control UI غير المتزامن، تُسلسل المحاولات الفاشلة للنطاق نفسه
  `{scope, ip}` قبل أن يسجل المحدّد الفشل. ولذلك يمكن أن تظهر محاولتا
  إعادة سيئتان ومتزامنتان من العميل نفسه على أنها `retry later`
  في المحاولة الثانية بدلًا من عدم تطابقين عاديين.
- `too many failed authentication attempts (retry later)` من عميل loopback
  ذي أصل متصفح → يتم قفل الإخفاقات المتكررة من ذلك `Origin` المطبع نفسه مؤقتًا؛ ويستخدم أصل localhost آخر حاوية منفصلة.
- تكرار `unauthorized` بعد إعادة المحاولة تلك → انحراف في الرمز المشترك/device token؛ حدّث إعداد الرمز وأعد الموافقة/التدوير لـ device token عند الحاجة.
- `gateway connect failed:` → هدف host/port/url خاطئ.

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                | المعنى                                                                                                                                                                                    | الإجراء الموصى به                                                                                                                                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`       | لم يرسل العميل الرمز المشترك المطلوب.                                                                                                                                                    | الصق/اضبط الرمز في العميل ثم أعد المحاولة. بالنسبة إلى مسارات dashboard: ‏`openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI.                                                                                                                                       |
| `AUTH_TOKEN_MISMATCH`      | لم يطابق الرمز المشترك رمز مصادقة gateway.                                                                                                                                               | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد عمليات إعادة المحاولة باستخدام الرمز المخزن مؤقتًا استخدام النطاقات الموافق عليها المخزنة؛ أما المتصلون باستخدام `deviceToken` / `scopes` صريحة فيحتفظون بالنطاقات المطلوبة. وإذا استمر الفشل، شغّل [قائمة التحقق من استعادة انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | device token المخزنة لكل جهاز قديمة أو أُلغيت.                                                                                                                                          | دوّر/أعد الموافقة على device token باستخدام [CLI للأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                 |
| `PAIRING_REQUIRED`         | تحتاج هوية الجهاز إلى موافقة. تحقق من `error.details.reason` بحثًا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade` واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلق: ‏`openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                                            |

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

- لا يمكن لجلسات paired-device token إدارة سوى **جهازها الخاص**
  ما لم يكن لدى المتصل أيضًا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات مشغل
  لا تملكها جلسة المتصل بالفعل

ذو صلة:

- [/web/control-ui](/ar/web/control-ui)
- [/gateway/configuration](/ar/gateway/configuration) ‏(أوضاع مصادقة gateway)
- [/gateway/trusted-proxy-auth](/ar/gateway/trusted-proxy-auth)
- [/gateway/remote](/ar/gateway/remote)
- [/cli/devices](/ar/cli/devices)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبتة لكن العملية لا تبقى قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

ابحث عن:

- `Runtime: stopped` مع تلميحات خروج.
- عدم تطابق إعدادات الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- عمليات تثبيت إضافية لـ launchd/systemd/schtasks عند استخدام `--deep`.
- تلميحات التنظيف `Other gateway-like services detected (best effort)`.

التواقيع الشائعة:

- `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → لم يتم تمكين وضع gateway المحلي، أو تم العبث بملف الإعدادات وفقد `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. إذا كنت تشغّل OpenClaw عبر Podman، فإن مسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → ربط غير loopback من دون مسار مصادقة gateway صالح (token/password، أو trusted-proxy حيثما يكون مضبوطًا).
- `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
- `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. ينبغي لمعظم الإعدادات الإبقاء على gateway واحدة لكل جهاز؛ وإذا كنت تحتاج فعلًا إلى أكثر من واحدة، فاعزل المنافذ + config/state/workspace. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

ذو صلة:

- [/gateway/background-process](/ar/gateway/background-process)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/doctor](/ar/gateway/doctor)

## قامت Gateway باستعادة آخر إعدادات سليمة معروفة

استخدم هذا عندما تبدأ Gateway، لكن السجلات تقول إنها استعادت `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ابحث عن:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- ملف `openclaw.json.clobbered.*` مختوم بالوقت بجوار الإعدادات النشطة
- حدث نظام للوكيل الرئيسي يبدأ بـ `Config recovery warning`

ماذا حدث:

- لم يتحقق الإعداد المرفوض أثناء البدء أو إعادة التحميل الساخن.
- احتفظ OpenClaw بالحمولة المرفوضة باسم `.clobbered.*`.
- تمت استعادة الإعدادات النشطة من آخر نسخة last-known-good تم التحقق منها.
- يتم تحذير الدور التالي للوكيل الرئيسي من إعادة كتابة الإعدادات المرفوضة بشكل أعمى.

الفحص والإصلاح:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

التواقيع الشائعة:

- وجود `.clobbered.*` → تمت استعادة تعديل مباشر خارجي أو قراءة بدء تشغيل.
- وجود `.rejected.*` → فشلت كتابة إعدادات مملوكة لـ OpenClaw في فحوصات المخطط أو clobber قبل الالتزام.
- `Config write rejected:` → حاولت الكتابة إسقاط البنية المطلوبة، أو تقليص حجم الملف بشكل حاد، أو حفظ إعدادات غير صالحة.
- `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` → تعامل البدء مع الملف الحالي على أنه clobbered لأنه فقد حقولًا أو حجمًا مقارنةً بنسخة last-known-good الاحتياطية.
- `Config last-known-good promotion skipped` → كان المرشح يحتوي على عناصر نائبة منقحة لأسرار مثل `***`.

خيارات الإصلاح:

1. احتفظ بالإعدادات النشطة المستعادة إذا كانت صحيحة.
2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
3. شغّل `openclaw config validate` قبل إعادة التشغيل.
4. إذا قمت بالتحرير يدويًا، فاحتفظ بملف JSON5 الكامل للإعدادات، وليس فقط الكائن الجزئي الذي أردت تغييره.

ذو صلة:

- [/gateway/configuration#strict-validation](/ar/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ar/gateway/configuration#config-hot-reload)
- [/cli/config](/ar/cli/config)
- [/gateway/doctor](/ar/gateway/doctor)

## تحذيرات Gateway probe

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه لا يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في إخراج JSON.
- ما إذا كان التحذير يتعلق بالرجوع إلى SSH، أو Gateways متعددة، أو نطاقات مفقودة، أو مراجع مصادقة غير محلولة.

التواقيع الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد نفق SSH، لكن الأمر حاول مع ذلك الأهداف المباشرة المضبوطة/loopback.
- `multiple reachable gateways detected` → أجاب أكثر من هدف واحد. وهذا يعني عادةً إعداد Gateways متعددة مقصود أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلية محدودة بالنطاق؛ قم بإقران هوية الجهاز أو استخدم بيانات اعتماد تتضمن `operator.read`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → أجابت gateway، لكن هذا العميل ما زال يحتاج إلى اقتران/موافقة قبل الوصول الطبيعي للمشغل.
- نص تحذير SecretRef غير المحلولة في `gateway.auth.*` / `gateway.remote.*` → لم تكن مواد المصادقة متاحة في مسار هذا الأمر بالنسبة إلى الهدف الفاشل.

ذو صلة:

- [/cli/gateway](/ar/cli/gateway)
- [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host)
- [/gateway/remote](/ar/gateway/remote)

## القناة متصلة لكن الرسائل لا تتدفق

إذا كانت حالة القناة تشير إلى أنها متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة والأذونات وقواعد التسليم الخاصة بالقناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة الرسائل الخاصة (`pairing`, `allowlist`, `open`, `disabled`).
- قائمة سماح المجموعة ومتطلبات الإشارة.
- أذونات/نطاقات API المفقودة الخاصة بالقناة.

التواقيع الشائعة:

- `mention required` → تم تجاهل الرسالة بواسطة سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلقة → المرسل غير معتمد.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → مشكلة في مصادقة/أذونات القناة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/whatsapp](/ar/channels/whatsapp)
- [/channels/telegram](/ar/channels/telegram)
- [/channels/discord](/ar/channels/discord)

## تسليم Cron وHeartbeat

إذا لم تعمل Cron أو Heartbeat أو لم يتم تسليمها، فتحقق أولًا من حالة المجدول ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تمكين Cron ووجود الاستيقاظ التالي.
- حالة سجل تشغيل المهمة (`ok`, `skipped`, `error`).
- أسباب تخطي Heartbeat ‏(`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

التواقيع الشائعة:

- `cron: scheduler disabled; jobs will not run automatically` → Cron معطلة.
- `cron: timer tick failed` → فشل نبضة المجدول؛ تحقق من أخطاء الملف/السجل/وقت التشغيل.
- `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
- `heartbeat skipped` مع `reason=empty-heartbeat-file` → الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على أسطر فارغة / عناوين Markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
- `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد مهام مستحقة في هذه النبضة.
- `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
- `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة على نمط الرسائل الخاصة بينما تم ضبط `agents.defaults.heartbeat.directPolicy` ‏(أو تجاوز لكل وكيل) على `block`.

ذو صلة:

- [/automation/cron-jobs#troubleshooting](/ar/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ar/automation/cron-jobs)
- [/gateway/heartbeat](/ar/gateway/heartbeat)

## فشل أداة Node المقترنة

إذا كانت Node مقترنة لكن الأدوات تفشل، فاعزل حالة المقدمة والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- Node متصلة بالإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات exec وحالة قائمة السماح.

التواقيع الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة exec معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → تم حظر الأمر بواسطة قائمة السماح.

ذو صلة:

- [/nodes/troubleshooting](/ar/nodes/troubleshooting)
- [/nodes/index](/ar/nodes/index)
- [/tools/exec-approvals](/ar/tools/exec-approvals)

## فشل أداة المتصفح

استخدم هذا عندما تفشل إجراءات أداة المتصفح مع أن gateway نفسها سليمة.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كانت `plugins.allow` مضبوطة وتتضمن `browser`.
- مسار ملف تنفيذي صالح للمتصفح.
- إمكانية الوصول إلى ملف CDP profile.
- توفر Chrome محليًا لملفات `existing-session` / `user`.

التواقيع الشائعة:

- `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمنة بواسطة `plugins.allow`.
- أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → تستبعد `plugins.allow` القيمة `browser`، لذلك لم يتم تحميل Plugin مطلقًا.
- `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
- `browser.executablePath not found` → المسار المضبوط غير صالح.
- `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان URL المضبوط لـ CDP مخططًا غير مدعوم مثل `file:` أو `ftp:`.
- `browser.cdpUrl has invalid port` → يحتوي عنوان URL المضبوط لـ CDP على منفذ سيئ أو خارج النطاق.
- `Could not find DevToolsActivePort for chrome` → تعذر على Chrome MCP existing-session الارتباط بدليل بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، ومكّن التصحيح البعيد، وأبقِ المتصفح مفتوحًا، ووافق على أول مطالبة ارتباط، ثم أعد المحاولة. وإذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل profile ‏`openclaw` المُدارة.
- `No Chrome tabs found for profile="user"` → لا تحتوي profile الارتباط Chrome MCP على أي علامات تبويب Chrome محلية مفتوحة.
- `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المضبوطة من مضيف gateway.
- `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا تملك profile ‏attach-only هدفًا يمكن الوصول إليه، أو أن نقطة نهاية HTTP استجابت لكن تعذر مع ذلك فتح CDP WebSocket.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقد تثبيت gateway الحالي تبعية وقت التشغيل `playwright-core` الخاصة بـ Plugin المتصفح المضمنة؛ شغّل `openclaw doctor --fix`، ثم أعد تشغيل gateway. ولا تزال لقطات ARIA والصور الأساسية للصفحات تعمل، لكن التنقل وAI snapshots ولقطات العناصر عبر CSS selector وتصدير PDF ستظل غير متاحة.
- `fullPage is not supported for element screenshots` → خلط طلب لقطة الشاشة `--full-page` مع `--ref` أو `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من snapshot، وليس `--element` عبر CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج hooks تحميل الملفات في Chrome MCP إلى snapshot refs، وليس CSS selectors.
- `existing-session file uploads currently support one file at a time.` → أرسل عملية تحميل واحدة لكل استدعاء على profiles ‏Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → لا تدعم hooks مربعات الحوار في profiles ‏Chrome MCP تجاوزات المهلة.
- `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحًا مُدارًا أو profile خامًا لـ CDP.
- تجاوزات viewport / dark-mode / locale / offline القديمة على profiles ‏attach-only أو remote CDP → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP من دون إعادة تشغيل gateway بالكامل.

ذو صلة:

- [/tools/browser-linux-troubleshooting](/ar/tools/browser-linux-troubleshooting)
- [/tools/browser](/ar/tools/browser)

## إذا قمت بالترقية وتعطل شيء فجأة

معظم الأعطال التي تظهر بعد الترقية تكون بسبب انحراف في الإعدادات أو فرض قيم افتراضية أكثر صرامة الآن.

### 1) تغيّر سلوك تجاوزات المصادقة وعنوان URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

ما الذي يجب التحقق منه:

- إذا كانت `gateway.mode=remote`، فقد تكون استدعاءات CLI تستهدف remote بينما خدمتك المحلية سليمة.
- لا تعود استدعاءات `--url` الصريحة إلى بيانات الاعتماد المخزنة.

التواقيع الشائعة:

- `gateway connect failed:` → هدف URL خاطئ.
- `unauthorized` → يمكن الوصول إلى نقطة النهاية لكن المصادقة خاطئة.

### 2) أصبحت حواجز الربط والمصادقة أكثر صرامة

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

ما الذي يجب التحقق منه:

- تتطلب الربطات غير loopback ‏(`lan`, `tailnet`, `custom`) مسار مصادقة gateway صالحًا: مصادقة token/password مشتركة، أو نشر `trusted-proxy` غير loopback مضبوطًا بشكل صحيح.
- لا تستبدل المفاتيح القديمة مثل `gateway.token` القيمة `gateway.auth.token`.

التواقيع الشائعة:

- `refusing to bind gateway ... without auth` → ربط غير loopback من دون مسار مصادقة gateway صالح.
- `Connectivity probe: failed` بينما وقت التشغيل يعمل → gateway حيّة لكنها غير قابلة للوصول باستخدام المصادقة/عنوان URL الحاليين.

### 3) تغيّرت حالة الاقتران وهوية الجهاز

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

ما الذي يجب التحقق منه:

- موافقات أجهزة معلقة لـ dashboard/nodes.
- موافقات اقتران رسائل خاصة معلقة بعد تغييرات السياسة أو الهوية.

التواقيع الشائعة:

- `device identity required` → لم يتم استيفاء مصادقة الجهاز.
- `pairing required` → يجب الموافقة على المرسل/الجهاز.

إذا استمر عدم اتفاق إعدادات الخدمة ووقت التشغيل بعد الفحوصات، فأعد تثبيت بيانات الخدمة الوصفية من دليل الملف الشخصي/الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذو صلة:

- [/gateway/pairing](/ar/gateway/pairing)
- [/gateway/authentication](/ar/gateway/authentication)
- [/gateway/background-process](/ar/gateway/background-process)

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
