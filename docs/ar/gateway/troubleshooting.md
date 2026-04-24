---
read_when:
    - أحالَك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام دليل تشغيل مستقرة قائمة على الأعراض مع أوامر دقيقة
summary: دليل تشغيل استكشاف الأخطاء وإصلاحها المتعمّق لـ Gateway والقنوات والأتمتة والعُقد والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-24T09:01:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# استكشاف أخطاء Gateway وإصلاحها

هذه الصفحة هي دليل التشغيل المتعمّق.
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

الإشارات السليمة المتوقعة:

- يعرض `openclaw gateway status` القيم `Runtime: running` و`Connectivity probe: ok` وسطرًا من الشكل `Capability: ...`.
- يبلّغ `openclaw doctor` بعدم وجود مشكلات حظر في الإعدادات/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وعند الدعم، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## يتطلّب خطأ Anthropic 429 استخدامًا إضافيًا للسياق الطويل

استخدم هذا عندما تتضمّن السجلات/الأخطاء:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- يحتوي نموذج Anthropic Opus/Sonnet المحدد على `params.context1m: true`.
- بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات الطويلة/تشغيلات النماذج التي تحتاج إلى مسار 1M التجريبي.

خيارات الإصلاح:

1. عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
2. استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
3. اضبط نماذج احتياطية بحيث تستمر التشغيلات عندما تُرفض طلبات Anthropic ذات السياق الطويل.

ذو صلة:

- [/providers/anthropic](/ar/providers/anthropic)
- [/reference/token-use](/ar/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ينجح الفحص المباشر للواجهة الخلفية المحلية المتوافقة مع OpenAI لكن تفشل تشغيلات الوكيل

استخدم هذا عندما:

- ينجح `curl ... /v1/models`
- تنجح طلبات `/v1/chat/completions` المباشرة الصغيرة
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

- تنجح الطلبات المباشرة الصغيرة، لكن تفشل تشغيلات OpenClaw فقط مع المطالبات الأكبر
- أخطاء في الواجهة الخلفية تفيد بأن `messages[].content` يجب أن تكون سلسلة نصية
- أعطال في الواجهة الخلفية لا تظهر إلا مع عدد أكبر من رموز المطالبة أو مع مطالبات وقت تشغيل الوكيل الكاملة

التوقيعات الشائعة:

- `messages[...].content: invalid type: sequence, expected a string` → ترفض الواجهة الخلفية أجزاء المحتوى المنظمة في Chat Completions. الإصلاح: اضبط `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- تنجح الطلبات المباشرة الصغيرة، لكن تفشل تشغيلات وكيل OpenClaw مع أعطال في الواجهة الخلفية/النموذج (مثل Gemma على بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ الواجهة الخلفية هي التي تفشل مع شكل مطالبة وقت تشغيل الوكيل الأكبر.
- تتراجع حالات الفشل بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم upstream أو في خطأ في الواجهة الخلفية.

خيارات الإصلاح:

1. اضبط `compat.requiresStringContent: true` للواجهات الخلفية الخاصة بـ Chat Completions التي تقبل السلاسل النصية فقط.
2. اضبط `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع التعامل بشكل موثوق مع سطح مخطط أدوات OpenClaw.
3. خفّض ضغط المطالبة حيثما أمكن: تهيئة مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو واجهة خلفية بدعم أقوى للسياق الطويل.
4. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما ما تزال أدوار وكيل OpenClaw تتعطل داخل الواجهة الخلفية، فاعتبر ذلك قيدًا في الخادم/النموذج upstream وقدّم بلاغ إعادة إنتاج هناك مع شكل الحمولة المقبول.

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

- اقتران معلّق لمرسلي الرسائل المباشرة.
- فرض الإشارة في المجموعات (`requireMention`, `mentionPatterns`).
- عدم تطابق قائمة السماح للقناة/المجموعة.

التوقيعات الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة إلى أن تحدث الإشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/pairing](/ar/channels/pairing)
- [/channels/groups](/ar/channels/groups)

## اتصال واجهة المستخدم Dashboard/control ui

عندما لا تتصل واجهة Dashboard/control UI، تحقّق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان probe الصحيح وعنوان dashboard الصحيح.
- عدم تطابق وضع/رمز المصادقة بين العميل وGateway.
- استخدام HTTP عندما تكون هوية الجهاز مطلوبة.

التوقيعات الشائعة:

- `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
- `origin not allowed` → إن `Origin` الخاص بالمتصفح غير موجود في `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير loopback بدون قائمة سماح صريحة).
- `device nonce required` / `device nonce mismatch` → لا يُكمل العميل تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخطأ (أو طابعًا زمنيًا قديمًا) لعملية المصافحة الحالية.
- `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزّن مؤقتًا.
- تعيد إعادة المحاولة بذلك الرمز المخزّن مجموعة النطاقات المخزنة مع رمز الجهاز المقترن. أما المستدعون الذين يمررون `deviceToken` صراحة / `scopes` صراحة فيحتفظون بمجموعة النطاقات المطلوبة لديهم.
- خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال كالتالي: رمز/كلمة مرور مشتركة صريحة أولًا، ثم `deviceToken` صريح، ثم رمز جهاز مخزّن، ثم رمز bootstrap.
- في مسار Tailscale Serve Control UI غير المتزامن، تُسلسل المحاولات الفاشلة للعنصر `{scope, ip}` نفسه قبل أن يسجّل المحدّد الفشل. لذلك قد تظهر محاولتا إعادة سيئتان ومتزامنتان من العميل نفسه على شكل `retry later` في المحاولة الثانية بدلًا من حالتي عدم تطابق عاديتين.
- `too many failed authentication attempts (retry later)` من عميل loopback ذي أصل متصفح → تُقفل الإخفاقات المتكررة من ذلك `Origin` الموحّد نفسه مؤقتًا؛ بينما يستخدم أصل localhost آخر حاوية منفصلة.
- تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف في الرمز المشترك/رمز الجهاز؛ حدّث إعدادات الرمز وأعد الموافقة على رمز الجهاز أو دوّره إذا لزم الأمر.
- `gateway connect failed:` → هدف مضيف/منفذ/عنوان URL غير صحيح.

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                 | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                      | الصق/اضبط الرمز في العميل ثم أعد المحاولة. لمسارات dashboard: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI.                                                                                                                                               |
| `AUTH_TOKEN_MISMATCH`        | لم يتطابق الرمز المشترك مع رمز مصادقة Gateway.                                                                                                                                              | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزّن استخدام النطاقات المعتمدة المخزنة؛ أما المستدعون الذين يمررون `deviceToken` / `scopes` صراحة فيحتفظون بالنطاقات المطلوبة. إذا استمر الفشل، شغّل [قائمة التحقق من استرداد انجراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | رمز الجهاز لكل جهاز والمخزّن مؤقتًا قديم أو أُلغي.                                                                                                                                          | دوّر رمز الجهاز أو أعد اعتماده باستخدام [CLI للأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                    |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقّق من `error.details.reason` للقيم `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلّق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور المسار نفسه بعد مراجعة الوصول المطلوب.                                                                                                                        |

فحص ترحيل device auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا كانت السجلات تعرض أخطاء nonce/signature، فحدّث العميل المتصل وتحقق من أنه:

1. ينتظر `connect.challenge`
2. يوقّع الحمولة المرتبطة بالتحدي
3. يرسل `connect.params.device.nonce` مع nonce التحدي نفسه

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- لا تستطيع جلسات رمز الجهاز المقترن إدارة إلا **جهازها الخاص** ما لم تكن جلسة المستدعي تملك أيضًا `operator.admin`
- لا يستطيع `openclaw devices rotate --scope ...` طلب نطاقات operator إلا إذا كانت جلسة المستدعي تملك هذه النطاقات بالفعل

ذو صلة:

- [/web/control-ui](/ar/web/control-ui)
- [/gateway/configuration](/ar/gateway/configuration) (أوضاع مصادقة gateway)
- [/gateway/trusted-proxy-auth](/ar/gateway/trusted-proxy-auth)
- [/gateway/remote](/ar/gateway/remote)
- [/cli/devices](/ar/cli/devices)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبّتة لكن العملية لا تستمر في العمل.

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
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

التوقيعات الشائعة:

- `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → لم يتم تمكين وضع Gateway المحلي، أو تم العبث بملف الإعدادات وفقدان `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. إذا كنت تشغّل OpenClaw عبر Podman، فمسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → محاولة ربط غير loopback بدون مسار مصادقة صالح لـ Gateway (رمز/كلمة مرور، أو trusted-proxy حيثما كان مضبوطًا).
- `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
- `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. يجب أن تُبقي معظم الإعدادات على Gateway واحد لكل جهاز؛ وإذا كنت تحتاج فعلًا إلى أكثر من واحد، فاعزل المنافذ + الإعدادات/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).

ذو صلة:

- [/gateway/background-process](/ar/gateway/background-process)
- [/gateway/configuration](/ar/gateway/configuration)
- [/gateway/doctor](/ar/gateway/doctor)

## استعاد Gateway آخر إعداد سليم معروف

استخدم هذا عندما يبدأ Gateway، لكن السجلات تقول إنه استعاد `openclaw.json`.

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
- ملف `openclaw.json.clobbered.*` مختوم زمنيًا بجانب ملف الإعدادات النشط
- حدث نظام للوكيل الرئيسي يبدأ بـ `Config recovery warning`

ما الذي حدث:

- لم تجتز الإعدادات المرفوضة التحقق أثناء بدء التشغيل أو إعادة التحميل السريع.
- احتفظ OpenClaw بالحمولة المرفوضة على شكل `.clobbered.*`.
- تمت استعادة الإعدادات النشطة من آخر نسخة سليمة تم التحقق منها ومعروفة.
- يتم تحذير الدور التالي للوكيل الرئيسي من عدم إعادة كتابة الإعدادات المرفوضة بشكل أعمى.

افحص وأصلح:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

التوقيعات الشائعة:

- وجود `.clobbered.*` → تمت استعادة تعديل مباشر خارجي أو قراءة أثناء بدء التشغيل.
- وجود `.rejected.*` → فشلت كتابة إعدادات مملوكة لـ OpenClaw في فحص schema أو clobber قبل الالتزام.
- `Config write rejected:` → حاولت الكتابة إسقاط بنية مطلوبة، أو تقليص الملف بشكل حاد، أو حفظ إعدادات غير صالحة.
- `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` → اعتبر بدء التشغيل الملف الحالي clobbered لأنه فقد حقولًا أو حجمًا مقارنة بآخر نسخة سليمة معروفة احتياطية.
- `Config last-known-good promotion skipped` → احتوى المرشح على عناصر نائبة لأسرار منقّحة مثل `***`.

خيارات الإصلاح:

1. احتفظ بالإعدادات النشطة المستعادة إذا كانت صحيحة.
2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
3. شغّل `openclaw config validate` قبل إعادة التشغيل.
4. إذا عدّلت يدويًا، فاحتفظ بإعدادات JSON5 الكاملة، وليس فقط الكائن الجزئي الذي أردت تغييره.

ذو صلة:

- [/gateway/configuration#strict-validation](/ar/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/ar/gateway/configuration#config-hot-reload)
- [/cli/config](/ar/cli/config)
- [/gateway/doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه ما يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في خرج JSON.
- ما إذا كان التحذير يتعلق بالرجوع إلى SSH، أو تعدد Gateways، أو غياب النطاقات، أو مراجع مصادقة غير محلولة.

التوقيعات الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر ما يزال يحاول الأهداف المباشرة المضبوطة/loopback.
- `multiple reachable gateways detected` → استجاب أكثر من هدف واحد. يعني هذا عادة إعدادًا مقصودًا متعدد Gateways أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلي مقيّد بالنطاقات؛ قم بإقران هوية الجهاز أو استخدم بيانات اعتماد تتضمن `operator.read`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → استجاب Gateway، لكن هذا العميل ما يزال يحتاج إلى اقتران/موافقة قبل الوصول الطبيعي للمشغّل.
- نص تحذير SecretRef غير المحلول لـ `gateway.auth.*` / `gateway.remote.*` → لم تكن مواد المصادقة متاحة في مسار هذا الأمر للهدف الفاشل.

ذو صلة:

- [/cli/gateway](/ar/cli/gateway)
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

- سياسة الرسائل المباشرة DM (`pairing`, `allowlist`, `open`, `disabled`).
- قائمة السماح للمجموعة ومتطلبات الإشارة.
- أذونات/نطاقات API المفقودة الخاصة بالقناة.

التوقيعات الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلّقة → لم تتم الموافقة على المرسل.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → مشكلة مصادقة/أذونات في القناة.

ذو صلة:

- [/channels/troubleshooting](/ar/channels/troubleshooting)
- [/channels/whatsapp](/ar/channels/whatsapp)
- [/channels/telegram](/ar/channels/telegram)
- [/channels/discord](/ar/channels/discord)

## تسليم Cron وHeartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يسلّما، فتحقق أولًا من حالة المجدول ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تمكين Cron ووجود وقت الاستيقاظ التالي.
- حالة سجل تشغيل المهمة (`ok`, `skipped`, `error`).
- أسباب تخطي Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

التوقيعات الشائعة:

- `cron: scheduler disabled; jobs will not run automatically` → تم تعطيل Cron.
- `cron: timer tick failed` → فشل نبض المؤقت للمجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
- `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
- `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / عناوين markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
- `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
- `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
- `heartbeat skipped` مع `reason=dm-blocked` → تم تحليل هدف Heartbeat إلى وجهة بأسلوب DM بينما ضُبط `agents.defaults.heartbeat.directPolicy` (أو تجاوز لكل وكيل) على `block`.

ذو صلة:

- [/automation/cron-jobs#troubleshooting](/ar/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/ar/automation/cron-jobs)
- [/gateway/heartbeat](/ar/gateway/heartbeat)

## فشل أداة Node المقترنة

إذا كانت Node مقترنة لكن الأدوات تفشل، فاعزل حالة المقدّمة والأذونات والموافقة.

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
- حالة موافقات exec وقائمة السماح.

التوقيعات الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في المقدّمة.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة exec معلّقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → تم حظر الأمر بواسطة قائمة السماح.

ذو صلة:

- [/nodes/troubleshooting](/ar/nodes/troubleshooting)
- [/nodes/index](/ar/nodes/index)
- [/tools/exec-approvals](/ar/tools/exec-approvals)

## فشل أداة المتصفح

استخدم هذا عندما تفشل إجراءات أداة المتصفح رغم أن Gateway نفسها سليمة.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كان `plugins.allow` مضبوطًا ويتضمن `browser`.
- مسار صالح لملف المتصفح التنفيذي.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات التعريف `existing-session` / `user`.

التوقيعات الشائعة:

- `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمّن بواسطة `plugins.allow`.
- أداة المتصفح مفقودة / غير متاحة رغم أن `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يُحمَّل Plugin مطلقًا.
- `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
- `browser.executablePath not found` → المسار المضبوط غير صالح.
- `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP URL المضبوط مخططًا غير مدعوم مثل `file:` أو `ftp:`.
- `browser.cdpUrl has invalid port` → يحتوي عنوان CDP URL المضبوط على منفذ سيئ أو خارج النطاق.
- `Could not find DevToolsActivePort for chrome` → تعذر على Chrome MCP existing-session الارتباط بدليل بيانات المتصفح المحدد حتى الآن. افتح صفحة فحص المتصفح، وفعّل التصحيح عن بُعد، وأبقِ المتصفح مفتوحًا، ووافق على أول مطالبة ارتباط، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
- `No Chrome tabs found for profile="user"` → لا توجد علامات تبويب Chrome محلية مفتوحة لملف تعريف الربط الخاص بـ Chrome MCP.
- `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المضبوطة من مضيف Gateway.
- `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف التعريف attach-only على هدف يمكن الوصول إليه، أو أن نقطة نهاية HTTP استجابت لكن تعذر مع ذلك فتح CDP WebSocket.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى اعتماد وقت التشغيل `playwright-core` الخاص بـ Plugin المتصفح المضمّن؛ شغّل `openclaw doctor --fix`، ثم أعد تشغيل Gateway. ما تزال لقطات ARIA واللقطات الأساسية للصفحات تعمل، لكن التنقل ولقطات AI ولقطات العناصر باستخدام محددات CSS وتصدير PDF ستظل غير متاحة.
- `fullPage is not supported for element screenshots` → خلط طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس `--element` الخاص بـ CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات رفع الملفات في Chrome MCP إلى مراجع لقطات، وليس محددات CSS.
- `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء في ملفات تعريف Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات مربعات الحوار في ملفات تعريف Chrome MCP تجاوزات `timeoutMs`.
- `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:type` على ملفات التعريف `profile="user"` / Chrome MCP existing-session، أو استخدم ملف تعريف متصفح مُدار/CDP عندما يكون مطلوبًا Timeout مخصص.
- `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:evaluate` على ملفات التعريف `profile="user"` / Chrome MCP existing-session، أو استخدم ملف تعريف متصفح مُدار/CDP عندما يكون مطلوبًا Timeout مخصص.
- `response body is not supported for existing-session profiles yet.` → ما يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
- تجاوزات viewport / dark-mode / locale / offline القديمة على ملفات تعريف attach-only أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP من دون إعادة تشغيل Gateway بالكامل.

ذو صلة:

- [/tools/browser-linux-troubleshooting](/ar/tools/browser-linux-troubleshooting)
- [/tools/browser](/ar/tools/browser)

## إذا قمت بالترقية وتعطل شيء فجأة

ترجع معظم الأعطال بعد الترقية إلى انجراف الإعدادات أو إلى فرض إعدادات افتراضية أكثر صرامة الآن.

### 1) تغيّر سلوك المصادقة وتجاوز عنوان URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

ما الذي يجب التحقق منه:

- إذا كان `gateway.mode=remote`، فقد تستهدف استدعاءات CLI البيئة البعيدة بينما تكون خدمتك المحلية سليمة.
- لا تعود الاستدعاءات الصريحة باستخدام `--url` إلى بيانات الاعتماد المخزنة.

التوقيعات الشائعة:

- `gateway connect failed:` → هدف URL خاطئ.
- `unauthorized` → يمكن الوصول إلى نقطة النهاية لكن المصادقة خاطئة.

### 2) أصبحت ضوابط bind والمصادقة أكثر صرامة

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

ما الذي يجب التحقق منه:

- تحتاج عمليات الربط غير loopback (`lan`, `tailnet`, `custom`) إلى مسار مصادقة Gateway صالح: مصادقة رمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير loopback مضبوط بصورة صحيحة.
- المفاتيح القديمة مثل `gateway.token` لا تحل محل `gateway.auth.token`.

التوقيعات الشائعة:

- `refusing to bind gateway ... without auth` → ربط غير loopback بدون مسار مصادقة Gateway صالح.
- `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway تعمل لكنها غير قابلة للوصول باستخدام المصادقة/عنوان URL الحاليين.

### 3) تغيّرت حالة الاقتران وهوية الجهاز

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

ما الذي يجب التحقق منه:

- وجود موافقات أجهزة معلقة لـ dashboard/nodes.
- وجود موافقات اقتران DM معلقة بعد تغييرات السياسة أو الهوية.

التوقيعات الشائعة:

- `device identity required` → لم تُستوفَ مصادقة الجهاز.
- `pairing required` → يجب الموافقة على المرسل/الجهاز.

إذا استمر اختلاف إعدادات الخدمة ووقت التشغيل بعد الفحوصات، فأعد تثبيت بيانات وصف الخدمة من دليل ملف التعريف/الحالة نفسه:

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
