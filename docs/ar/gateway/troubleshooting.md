---
read_when:
    - وجّهك مركز استكشاف الأخطاء وإصلاحها إلى هنا لتشخيص أعمق
    - تحتاج إلى أقسام مستقرة في دليل التشغيل مبنية على الأعراض وتتضمن أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل تشغيل متعمق لاستكشاف أخطاء Gateway والقنوات والأتمتة وNode والمتصفح وإصلاحها
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-05-03T21:35:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذه الصفحة هي دليل التشغيل التفصيلي. ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا أردت مسار الفرز السريع أولا.

## سلم الأوامر

شغل هذه أولا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات الحالة السليمة المتوقعة:

- يعرض `openclaw gateway status` السطر `Runtime: running`، و`Connectivity probe: ok`، وسطر `Capability: ...`.
- يبلغ `openclaw doctor` عن عدم وجود مشكلات حظر في الإعدادات/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وحيثما يكون ذلك مدعوما، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## تثبيتات متباينة وحارس الإعدادات الأحدث

استخدم هذا عندما تتوقف خدمة Gateway على نحو غير متوقع بعد تحديث، أو تعرض السجلات أن ملفا تنفيذيا واحدا من `openclaw` أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يختم OpenClaw عمليات كتابة الإعدادات بـ `meta.lastTouchedVersion`. لا يزال بإمكان أوامر القراءة فقط فحص إعدادات كتبها إصدار أحدث من OpenClaw، لكن طفرات العمليات والخدمات ترفض المتابعة من ملف تنفيذي أقدم. تشمل الإجراءات المحظورة بدء خدمة Gateway، وإيقافها، وإعادة تشغيلها، وإلغاء تثبيتها، وإعادة تثبيت الخدمة قسرا، وبدء تشغيل Gateway في وضع الخدمة، وتنظيف المنفذ عبر `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    أصلح `PATH` بحيث يشير `openclaw` إلى التثبيت الأحدث، ثم أعد تشغيل الإجراء.
  </Step>
  <Step title="Reinstall the gateway service">
    أعد تثبيت خدمة Gateway المقصودة من التثبيت الأحدث:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    أزل حزمة النظام القديمة أو إدخالات الغلاف القديمة التي ما زالت تشير إلى ملف تنفيذي قديم من `openclaw`.
  </Step>
</Steps>

<Warning>
للتخفيض المتعمد للإصدار أو الاسترداد الطارئ فقط، عيّن `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير معين للتشغيل العادي.
</Warning>

## يتطلب Anthropic 429 استخداما إضافيا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

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

<Steps>
  <Step title="Disable context1m">
    عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
  </Step>
  <Step title="Use an eligible credential">
    استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
  </Step>
  <Step title="Configure fallback models">
    اضبط نماذج احتياطية بحيث تستمر التشغيلات عندما تُرفض طلبات السياق الطويل من Anthropic.
  </Step>
</Steps>

ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز المميزة والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ينجح الخلفي المحلي المتوافق مع OpenAI في الفحوص المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا عندما:

- يعمل `curl ... /v1/models`
- تعمل استدعاءات `/v1/chat/completions` المباشرة الصغيرة
- تفشل تشغيلات نموذج OpenClaw فقط في أدوار الوكيل العادية

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
- أخطاء `model_not_found` أو 404 رغم أن `/v1/chat/completions` المباشر
  يعمل مع معرّف النموذج المجرد نفسه
- أخطاء خلفية حول توقع `messages[].content` لسلسلة
- تحذيرات `incomplete turn detected ... stopReason=stop payloads=0` متقطعة مع خلفية محلية متوافقة مع OpenAI
- انهيارات خلفية لا تظهر إلا مع أعداد رموز مطالبة أكبر أو مطالبات وقت تشغيل الوكيل الكاملة

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` مع خادم محلي على نمط MLX/vLLM → تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` هو `"openai-completions"` لخلفيات `/v1/chat/completions`، وأن `models.providers.<provider>.models[].id` هو المعرّف المحلي المجرد لدى المزود. حدده ببادئة المزود مرة واحدة، مثلا `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبق إدخال الفهرس كـ `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → ترفض الخلفية أجزاء محتوى Chat Completions البنيوية. الإصلاح: عيّن `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → أكملت الخلفية طلب Chat Completions لكنها لم ترجع نص مساعد مرئيا للمستخدم لذلك الدور. يعيد OpenClaw محاولة أدوار OpenAI المتوافقة الفارغة الآمنة لإعادة التشغيل مرة واحدة؛ غالبا تعني حالات الفشل المستمرة أن الخلفية تصدر محتوى فارغا/غير نصي أو تكبت نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكيل OpenClaw تفشل بانهيارات في الخلفية/النموذج (مثل Gemma على بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ الخلفية تفشل على شكل مطالبة وقت تشغيل الوكيل الأكبر.
    - تتقلص حالات الفشل بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءا من الضغط، لكن المشكلة المتبقية ما زالت في سعة النموذج/الخادم في المنبع أو خطأ في الخلفية.

  </Accordion>
  <Accordion title="Fix options">
    1. عيّن `compat.requiresStringContent: true` لخلفيات Chat Completions التي تقبل السلاسل فقط.
    2. عيّن `compat.supportsTools: false` للنماذج/الخلفيات التي لا تستطيع التعامل مع سطح مخطط أدوات OpenClaw بشكل موثوق.
    3. خفّض ضغط المطالبة حيثما أمكن: تمهيد مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو خلفية بدعم أقوى للسياق الطويل.
    4. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما لا تزال أدوار وكيل OpenClaw تنهار داخل الخلفية، فتعامل معها كقيد في الخادم/النموذج في المنبع وقدّم إعادة إنتاج هناك مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [الإعدادات](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات عاملة لكن لا شيء يجيب، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلق لمرسلي الرسائل الخاصة.
- بوابة ذكر المجموعة (`requireMention`، `mentionPatterns`).
- عدم تطابق قائمة السماح للقناة/المجموعة.

تواقيع شائعة:

- `drop guild message (mention required` → تُتجاهل رسالة المجموعة حتى وجود ذكر.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذات صلة:

- [استكشاف مشكلات القنوات وإصلاحها](/ar/channels/troubleshooting)
- [المجموعات](/ar/channels/groups)
- [الاقتران](/ar/channels/pairing)

## اتصال واجهة تحكم لوحة المعلومات

عندما لا تتصل واجهة تحكم لوحة المعلومات، تحقق من عنوان URL، ووضع المصادقة، وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان URL الصحيح للفحص وعنوان URL للوحة المعلومات.
- عدم تطابق وضع المصادقة/الرمز المميز بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
    - `origin not allowed` → قيمة `Origin` في المتصفح ليست ضمن `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير local loopback دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` → لا يكمل العميل تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخاطئة (أو طابعا زمنيا قديما) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزن مؤقتا.
    - تعيد محاولة الرمز المخزن مؤقتا تلك استخدام مجموعة النطاقات المخزنة مؤقتا مع رمز الجهاز المقترن. يحافظ مستدعو `deviceToken` الصريح / `scopes` الصريحة على مجموعة النطاقات المطلوبة لديهم بدلا من ذلك.
    - خارج مسار إعادة المحاولة هذا، تكون أسبقية مصادقة الاتصال هي الرمز المشترك/كلمة المرور الصريحة أولا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - في مسار واجهة تحكم Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدد الفشل. لذلك يمكن لمحاولتي إعادة محاولة متزامنتين سيئتين من العميل نفسه أن تُظهرا `retry later` في المحاولة الثانية بدلا من عدم تطابقين عاديين.
    - `too many failed authentication attempts (retry later)` من عميل local loopback ذي أصل متصفح → تؤدي الإخفاقات المتكررة من `Origin` المعياري نفسه إلى حظر مؤقت؛ يستخدم أصل localhost آخر حاوية منفصلة.
    - تكرار `unauthorized` بعد إعادة المحاولة تلك → انحراف الرمز المشترك/رمز الجهاز؛ حدّث إعدادات الرمز وأعد الموافقة على رمز الجهاز/دوّره إذا لزم الأمر.
    - `gateway connect failed:` → هدف مضيف/منفذ/عنوان URL خاطئ.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                 | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل الرمز المشترك المطلوب.                                                                                                                                                 | الصق/عيّن الرمز في العميل ثم أعد المحاولة. لمسارات لوحة التحكم: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات واجهة التحكم.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                               | إذا كان `canRetryWithDeviceToken=true`، فاسمح بمحاولة موثوقة واحدة. تعيد محاولات الرموز المخزنة مؤقتا استخدام النطاقات المعتمدة المخزنة؛ ويحتفظ مستدعو `deviceToken` / `scopes` الصريحون بالنطاقات المطلوبة. إذا استمر الفشل، فشغّل [قائمة التحقق لاسترداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | الرمز المخزن مؤقتا لكل جهاز قديم أو ملغى.                                                                                                                                                 | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI الأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقق من `error.details.reason` بحثا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | اعتمد الطلب المعلّق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                               |

<Note>
ينبغي ألا تعتمد استدعاءات RPC الخلفية عبر loopback المباشر والمصادقة برمز/كلمة مرور Gateway المشتركة على خط أساس نطاق الأجهزة المقترنة الخاص بـ CLI. إذا ظلت الوكلاء الفرعيون أو الاستدعاءات الداخلية الأخرى تفشل مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"` ولا يفرض `deviceIdentity` صريحا أو رمز جهاز.
</Note>

فحص ترحيل مصادقة الجهاز v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/التوقيع، فحدّث العميل المتصل وتحقق منه:

<Steps>
  <Step title="Wait for connect.challenge">
    ينتظر العميل `connect.challenge` الصادر من Gateway.
  </Step>
  <Step title="Sign the payload">
    يوقّع العميل الحمولة المرتبطة بالتحدي.
  </Step>
  <Step title="Send the device nonce">
    يرسل العميل `connect.params.device.nonce` بقيمة nonce الخاصة بالتحدي نفسها.
  </Step>
</Steps>

إذا رُفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- يمكن لجلسات رمز الجهاز المقترن إدارة جهازها **الخاص بها** فقط، ما لم يكن لدى المستدعي أيضا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات المشغّل إلا إذا كانت جلسة المستدعي تملكها مسبقا

ذات صلة:

- [الإعدادات](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [واجهة التحكم](/ar/web/control-ui)
- [الأجهزة](/ar/cli/devices)
- [الوصول عن بعد](/ar/gateway/remote)
- [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)

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

- `Runtime: stopped` مع تلميحات الخروج.
- عدم تطابق إعدادات الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → لم يتم تمكين وضع Gateway المحلي، أو تعرض ملف الإعدادات للاستبدال وفقد `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. إذا كنت تشغّل OpenClaw عبر Podman، فإن مسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → ربط بغير loopback دون مسار مصادقة Gateway صالح (رمز/كلمة مرور، أو وكيل موثوق عند تهيئته).
    - `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
    - `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. ينبغي لمعظم الإعدادات الاحتفاظ بـ Gateway واحد لكل جهاز؛ وإذا كنت تحتاج فعلا إلى أكثر من واحد، فاعزل المنافذ + الإعدادات/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor → توجد وحدة systemd على مستوى النظام بينما خدمة مستوى المستخدم مفقودة. أزل النسخة المكررة أو عطّلها قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` → ما زال المشرف المثبت يثبت `--port` القديم. شغّل `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الإعدادات](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## رفض Gateway إعدادات غير صالحة

استخدم هذا عندما يفشل بدء تشغيل Gateway مع `Invalid config` أو تقول سجلات إعادة التحميل الساخنة
إنه تخطى تعديلا غير صالح.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

ابحث عن:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- ملف `openclaw.json.rejected.*` بطابع زمني بجوار الإعدادات النشطة
- ملف `openclaw.json.clobbered.*` بطابع زمني إذا أصلح `doctor --fix` تعديلا مباشرا معطلا

<AccordionGroup>
  <Accordion title="What happened">
    - لم تجتز الإعدادات التحقق أثناء بدء التشغيل أو إعادة التحميل الساخنة أو كتابة يملكها OpenClaw.
    - يفشل بدء تشغيل Gateway بشكل مغلق بدلا من إعادة كتابة `openclaw.json`.
    - تتخطى إعادة التحميل الساخنة التعديلات الخارجية غير الصالحة وتُبقي إعدادات وقت التشغيل الحالية نشطة.
    - ترفض الكتابات التي يملكها OpenClaw الحمولات غير الصالحة/المتلفة قبل الالتزام وتحفظ `.rejected.*`.
    - يملك `openclaw doctor --fix` الإصلاح. يمكنه إزالة بادئات غير JSON أو استعادة آخر نسخة معروفة سليمة مع الحفاظ على الحمولة المرفوضة بصيغة `.clobbered.*`.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - وجود `.clobbered.*` → احتفظ doctor بتعديل خارجي معطل أثناء إصلاح الإعدادات النشطة.
    - وجود `.rejected.*` → فشلت كتابة إعدادات يملكها OpenClaw في فحوصات المخطط أو منع الاستبدال قبل الالتزام.
    - `Config write rejected:` → حاولت الكتابة إسقاط البنية المطلوبة، أو تقليص الملف بشدة، أو حفظ إعدادات غير صالحة.
    - `config reload skipped (invalid config):` → فشل تعديل مباشر في التحقق وتم تجاهله بواسطة Gateway قيد التشغيل.
    - `Invalid config at ...` → فشل بدء التشغيل قبل إقلاع خدمات Gateway.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` → رُفضت كتابة يملكها OpenClaw لأنها فقدت حقولا أو حجما مقارنة بآخر نسخة احتياطية معروفة سليمة.
    - `Config last-known-good promotion skipped` → احتوى المرشح على عناصر نائبة لأسرار منقحة مثل `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. شغّل `openclaw doctor --fix` للسماح لـ doctor بإصلاح الإعدادات ذات البادئة/المستبدلة أو استعادة آخر نسخة معروفة سليمة.
    2. انسخ المفاتيح المقصودة فقط من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا عدّلت يدويا، فاحتفظ بإعدادات JSON5 الكاملة، وليس الكائن الجزئي فقط الذي أردت تغييره.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [Config](/ar/cli/config)
- [الإعدادات: إعادة التحميل الساخنة](/ar/gateway/configuration#config-hot-reload)
- [الإعدادات: التحقق الصارم](/ar/gateway/configuration#strict-validation)
- [Doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه ما زال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير يتعلق بالرجوع إلى SSH، أو عدة Gateways، أو نطاقات مفقودة، أو مراجع مصادقة غير محلولة.

تواقيع شائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر ظل يحاول الأهداف المباشرة المهيأة/loopback.
- `multiple reachable gateways detected` → استجاب أكثر من هدف واحد. يعني هذا عادة إعدادا متعمدا لعدة Gateways أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلي مقيّد بالنطاق؛ اقرن هوية الجهاز أو استخدم بيانات اعتماد تحتوي على `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → نجح الاتصال، لكن مجموعة RPC التشخيصية الكاملة انتهت مهلتها أو فشلت. تعامل مع هذا على أنه Gateway قابل للوصول مع تشخيصات متدهورة؛ قارن `connect.ok` و`connect.rpcOk` في مخرجات `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → استجاب Gateway، لكن هذا العميل ما زال يحتاج إلى إقران/اعتماد قبل الوصول العادي للمشغّل.
- نص تحذير SecretRef غير محلول لـ `gateway.auth.*` / `gateway.remote.*` → لم تكن مادة المصادقة متاحة في مسار الأمر هذا للهدف الفاشل.

ذات صلة:

- [Gateway](/ar/cli/gateway)
- [عدة Gateways على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول عن بعد](/ar/gateway/remote)

## القناة متصلة، لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة والأذونات وقواعد التسليم الخاصة بالقناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة الرسائل المباشرة (`pairing`، `allowlist`، `open`، `disabled`).
- قائمة السماح للمجموعات ومتطلبات الإشارة.
- أذونات/نطاقات API القناة المفقودة.

التواقيع الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- `pairing` / آثار انتظار الموافقة → المرسل غير معتمد.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشكلة في مصادقة/أذونات القناة.

ذات صلة:

- [استكشاف مشكلات القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron و Heartbeat

إذا لم يعمل Cron أو Heartbeat، أو لم يتم التسليم، فتحقق أولًا من حالة المجدول، ثم هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تفعيل Cron ووجود وقت التنبيه التالي.
- حالة سجل تشغيل المهمة (`ok`، `skipped`، `error`).
- أسباب تخطي Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron معطل.
    - `cron: timer tick failed` → فشلت نبضة المجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / ترويسات Markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
    - `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة بنمط رسالة مباشرة بينما تم تعيين `agents.defaults.heartbeat.directPolicy` (أو تجاوز لكل وكيل) إلى `block`.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف المشكلات وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## Node مقترن، والأداة تفشل

إذا كان Node مقترنًا لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- Node متصل بالإنترنت مع الإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات التنفيذ وحالة قائمة السماح.

التواقيع الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → حُظر الأمر بواسطة قائمة السماح.

ذات صلة:

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [استكشاف مشكلات Node وإصلاحها](/ar/nodes/troubleshooting)
- [Nodes](/ar/nodes/index)

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
- مسار تنفيذي صالح للمتصفح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="تواقيع Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمن بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل Plugin مطلقًا.
    - `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
    - `browser.executablePath not found` → المسار المكوّن غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP URL المكوّن مخططًا غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان CDP URL المكوّن على منفذ غير صالح أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى تبعية وقت تشغيل المتصفح الأساسية؛ أعد تثبيت OpenClaw أو حدّثه، ثم أعد تشغيل Gateway. لا تزال لقطات ARIA ولقطات الصفحة الأساسية تعمل، لكن التنقل ولقطات AI ولقطات عناصر محدد CSS وتصدير PDF تبقى غير متاحة.

  </Accordion>
  <Accordion title="تواقيع Chrome MCP / الجلسة الحالية">
    - `Could not find DevToolsActivePort for chrome` → تعذر على جلسة Chrome MCP الحالية الاتصال بدليل بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، وفعّل تصحيح الأخطاء عن بُعد، وأبقِ المتصفح مفتوحًا، ووافق على مطالبة الاتصال الأولى، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
    - `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف اتصال Chrome MCP على أي تبويبات Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المكوّنة من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف التعريف المخصص للاتصال فقط على هدف يمكن الوصول إليه، أو استجابت نقطة نهاية HTTP لكن تعذر فتح CDP WebSocket.

  </Accordion>
  <Accordion title="تواقيع العنصر / لقطة الشاشة / الرفع">
    - `fullPage is not supported for element screenshots` → خلط طلب لقطة الشاشة `--full-page` مع `--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطة شاشة Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس `--element` من CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات رفع Chrome MCP إلى مراجع لقطات، وليس محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات الحوار في ملفات تعريف Chrome MCP تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:type` على ملفات تعريف `profile="user"` / Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مُدار/CDP عند الحاجة إلى مهلة مخصصة.
    - `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:evaluate` على ملفات تعريف `profile="user"` / Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مُدار/CDP عند الحاجة إلى مهلة مخصصة.
    - `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
    - تجاوزات منفذ العرض / الوضع الداكن / اللغة / عدم الاتصال القديمة على ملفات تعريف الاتصال فقط أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP دون إعادة تشغيل Gateway بالكامل.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [المتصفح (مُدار بواسطة OpenClaw)](/ar/tools/browser)
- [استكشاف مشكلات المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا أجريت ترقية وتعطل شيء فجأة

معظم الأعطال بعد الترقية تكون بسبب انحراف الإعدادات أو تطبيق قيم افتراضية أكثر صرامة الآن.

<AccordionGroup>
  <Accordion title="1. تغير سلوك تجاوز المصادقة وعنوان URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما يجب التحقق منه:

    - إذا كان `gateway.mode=remote`، فقد تستهدف استدعاءات CLI الخدمة البعيدة بينما خدمتك المحلية سليمة.
    - استدعاءات `--url` الصريحة لا تعود إلى بيانات الاعتماد المخزنة.

    التواقيع الشائعة:

    - `gateway connect failed:` → هدف URL خاطئ.
    - `unauthorized` → يمكن الوصول إلى نقطة النهاية لكن المصادقة خاطئة.

  </Accordion>
  <Accordion title="2. ضوابط الربط والمصادقة أصبحت أكثر صرامة">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما يجب التحقق منه:

    - تحتاج عمليات الربط خارج loopback (`lan`، `tailnet`، `custom`) إلى مسار مصادقة Gateway صالح: مصادقة رمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` خارج loopback مكوّن بشكل صحيح.
    - المفاتيح القديمة مثل `gateway.token` لا تحل محل `gateway.auth.token`.

    التواقيع الشائعة:

    - `refusing to bind gateway ... without auth` → ربط خارج loopback دون مسار مصادقة Gateway صالح.
    - `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway يعمل لكنه غير قابل للوصول بالمصادقة/عنوان URL الحاليين.

  </Accordion>
  <Accordion title="3. تغيرت حالة الاقتران وهوية الجهاز">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما يجب التحقق منه:

    - موافقات الأجهزة المعلقة للوحة التحكم/nodes.
    - موافقات اقتران الرسائل المباشرة المعلقة بعد تغييرات السياسة أو الهوية.

    التواقيع الشائعة:

    - `device identity required` → لم يتم استيفاء مصادقة الجهاز.
    - `pairing required` → يجب اعتماد المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا ظلت إعدادات الخدمة ووقت التشغيل غير متفقين بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل ملف التعريف/الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذات صلة:

- [المصادقة](/ar/gateway/authentication)
- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الاقتران المملوك لـ Gateway](/ar/gateway/pairing)

## ذات صلة

- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
- [دليل تشغيل Gateway](/ar/gateway)
