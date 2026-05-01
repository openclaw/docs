---
read_when:
    - وجّهك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام دليل تشغيل مستقرة مبنية على الأعراض مع أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل تشغيل معمّق لاستكشاف أخطاء Gateway والقنوات والأتمتة والعُقَد والمتصفح وإصلاحها
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-05-01T07:40:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذه الصفحة هي دليل التشغيل المتعمق. ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد مسار الفرز السريع أولا.

## سلم الأوامر

شغّل هذه أولا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات الصحة المتوقعة:

- يعرض `openclaw gateway status` السطر `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- يبلّغ `openclaw doctor` عن عدم وجود مشكلات إعدادات/خدمة حاظرة.
- يعرض `openclaw channels status --probe` حالة النقل المباشرة لكل حساب، وحيثما يكون ذلك مدعوما، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## التثبيتات المنقسمة وحارس الإعدادات الأحدث

استخدم هذا عندما تتوقف خدمة Gateway بشكل غير متوقع بعد تحديث، أو عندما تُظهر السجلات أن أحد ملفات `openclaw` التنفيذية أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يختم OpenClaw عمليات كتابة الإعدادات باستخدام `meta.lastTouchedVersion`. لا تزال الأوامر للقراءة فقط قادرة على فحص إعدادات كتبها إصدار أحدث من OpenClaw، لكن طفرات العمليات والخدمات ترفض المتابعة من ملف تنفيذي أقدم. تشمل الإجراءات المحظورة بدء خدمة Gateway وإيقافها وإعادة تشغيلها وإلغاء تثبيتها وإعادة تثبيت الخدمة قسريا، وبدء تشغيل Gateway في وضع الخدمة، وتنظيف منفذ `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="إصلاح PATH">
    أصلح `PATH` بحيث يُحل `openclaw` إلى التثبيت الأحدث، ثم أعد تشغيل الإجراء.
  </Step>
  <Step title="إعادة تثبيت خدمة Gateway">
    أعد تثبيت خدمة Gateway المقصودة من التثبيت الأحدث:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="إزالة الأغلفة القديمة">
    أزل حزمة النظام القديمة أو إدخالات الغلاف القديمة التي لا تزال تشير إلى ملف `openclaw` تنفيذي قديم.
  </Step>
</Steps>

<Warning>
لخفض الإصدار عمدا أو الاسترداد الطارئ فقط، اضبط `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير مضبوط للتشغيل العادي.
</Warning>

## يتطلب Anthropic 429 استخداما إضافيا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- نموذج Anthropic Opus/Sonnet المحدد يحتوي على `params.context1m: true`.
- اعتماد Anthropic الحالي غير مؤهل لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات/تشغيلات النماذج الطويلة التي تحتاج مسار 1M التجريبي.

خيارات الإصلاح:

<Steps>
  <Step title="تعطيل context1m">
    عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
  </Step>
  <Step title="استخدام اعتماد مؤهل">
    استخدم اعتماد Anthropic مؤهلا لطلبات السياق الطويل، أو انتقل إلى مفتاح Anthropic API.
  </Step>
  <Step title="إعداد نماذج احتياطية">
    أعد نماذج احتياطية حتى تستمر التشغيلات عندما تُرفض طلبات السياق الطويل من Anthropic.
  </Step>
</Steps>

ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## الواجهة الخلفية المحلية المتوافقة مع OpenAI تجتاز الفحوصات المباشرة لكن تشغيلات الوكيل تفشل

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
  يعمل بمعرّف النموذج المجرد نفسه
- أخطاء من الواجهة الخلفية حول توقع أن تكون `messages[].content` سلسلة نصية
- تحذيرات متقطعة `incomplete turn detected ... stopReason=stop payloads=0` مع واجهة خلفية محلية متوافقة مع OpenAI
- أعطال في الواجهة الخلفية تظهر فقط مع أعداد رموز مطالبة أكبر أو مطالبات وقت تشغيل الوكيل الكاملة

<AccordionGroup>
  <Accordion title="التوقيعات الشائعة">
    - `model_not_found` مع خادم محلي بنمط MLX/vLLM → تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` هي `"openai-completions"` لواجهات `/v1/chat/completions` الخلفية، وأن `models.providers.<provider>.models[].id` هو المعرّف المحلي المجرد لدى المزوّد. حدده ببادئة المزوّد مرة واحدة، مثلا `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبقِ إدخال الفهرس كـ `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → ترفض الواجهة الخلفية أجزاء محتوى Chat Completions المهيكلة. الإصلاح: اضبط `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → أكملت الواجهة الخلفية طلب Chat Completions لكنها لم تُرجع نص مساعد مرئيا للمستخدم لذلك الدور. يعيد OpenClaw محاولة الأدوار الفارغة المتوافقة مع OpenAI والآمنة للإعادة مرة واحدة؛ وعادة تعني الإخفاقات المستمرة أن الواجهة الخلفية تصدر محتوى فارغا/غير نصي أو تكبت نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكيل OpenClaw تفشل مع أعطال الواجهة الخلفية/النموذج (مثلا Gemma على بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ الواجهة الخلفية تفشل على شكل مطالبة وقت تشغيل الوكيل الأكبر.
    - تتقلص الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم المنبع أو خطأ في الواجهة الخلفية.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. اضبط `compat.requiresStringContent: true` لواجهات Chat Completions الخلفية التي تدعم السلاسل النصية فقط.
    2. اضبط `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا يمكنها التعامل مع سطح مخطط أدوات OpenClaw بشكل موثوق.
    3. خفف ضغط المطالبة حيثما أمكن: تمهيد مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو واجهة خلفية ذات دعم أقوى للسياق الطويل.
    4. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما لا تزال أدوار وكيل OpenClaw تتعطل داخل الواجهة الخلفية، فتعامل معها كقيد في الخادم/النموذج المنبع وقدّم إعادة إنتاج هناك مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [الإعدادات](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل لكن لا شيء يجيب، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلق لمرسلي الرسائل المباشرة.
- بوابة إشارات المجموعة (`requireMention`، `mentionPatterns`).
- عدم تطابق قوائم السماح للقنوات/المجموعات.

التوقيعات الشائعة:

- `drop guild message (mention required` → تُتجاهل رسالة المجموعة حتى توجد إشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [المجموعات](/ar/channels/groups)
- [الاقتران](/ar/channels/pairing)

## اتصال واجهة تحكم لوحة المعلومات

عندما لا تتصل واجهة لوحة المعلومات/التحكم، تحقق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان URL الصحيح للفحص ولوحة المعلومات.
- عدم تطابق وضع المصادقة/الرمز بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

<AccordionGroup>
  <Accordion title="توقيعات الاتصال / المصادقة">
    - `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
    - `origin not allowed` → قيمة `Origin` في المتصفح غير موجودة في `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير local loopback بدون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` → لا يكمل العميل تدفق مصادقة الجهاز المعتمد على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخطأ (أو طابعا زمنيا قديما) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل تنفيذ إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزن مؤقتا.
    - تعيد إعادة المحاولة بذلك الرمز المخزن استخدام مجموعة النطاقات المخزنة مع رمز الجهاز المقترن. يحتفظ مستدعو `deviceToken` الصريح / `scopes` الصريح بمجموعة النطاقات المطلوبة لديهم بدلا من ذلك.
    - خارج مسار إعادة المحاولة ذلك، تكون أسبقية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - على مسار واجهة تحكم Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدد الفشل. لذلك يمكن لمحاولتي إعادة سيئتين متزامنتين من العميل نفسه أن تظهرا `retry later` في المحاولة الثانية بدلا من عدم تطابقين عاديين.
    - `too many failed authentication attempts (retry later)` من عميل local loopback أصله المتصفح → تُقفل الإخفاقات المتكررة من قيمة `Origin` المطَبّعة نفسها مؤقتا؛ يستخدم أصل localhost آخر حاوية منفصلة.
    - تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف الرمز المشترك/رمز الجهاز؛ حدّث إعدادات الرمز وأعد الموافقة/دوّر رمز الجهاز إذا لزم الأمر.
    - `gateway connect failed:` → مضيف/منفذ/هدف URL خاطئ.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لأكواد تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفصيل                  | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                 | الصق/عيّن الرمز في العميل ثم أعد المحاولة. لمسارات لوحة التحكم: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات واجهة التحكم.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                               | إذا كان `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ ويحافظ مستدعو `deviceToken` / `scopes` الصريحون على النطاقات المطلوبة. إذا استمر الفشل، فشغّل [قائمة تحقق استرداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | الرمز المخزن مؤقتًا لكل جهاز قديم أو ملغى.                                                                                                                                                 | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI الأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقق من `error.details.reason` بحثًا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                               |

<Note>
ينبغي ألا تعتمد استدعاءات RPC الخلفية المباشرة عبر loopback والمصادق عليها برمز/كلمة مرور Gateway المشتركة على خط أساس نطاق الجهاز المقترن في CLI. إذا كانت الوكلاء الفرعيون أو الاستدعاءات الداخلية الأخرى لا تزال تفشل مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"` ولا يفرض `deviceIdentity` صريحة أو رمز جهاز.
</Note>

فحص ترحيل مصادقة الجهاز v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/التوقيع، فحدّث العميل المتصل وتحقق منه:

<Steps>
  <Step title="انتظر connect.challenge">
    ينتظر العميل `connect.challenge` الصادر من Gateway.
  </Step>
  <Step title="وقّع الحمولة">
    يوقّع العميل الحمولة المرتبطة بالتحدي.
  </Step>
  <Step title="أرسل nonce الجهاز">
    يرسل العميل `connect.params.device.nonce` مع nonce التحدي نفسه.
  </Step>
</Steps>

إذا رُفض `openclaw devices rotate` / `revoke` / `remove` على نحو غير متوقع:

- يمكن لجلسات رمز الجهاز المقترن إدارة جهازها **الخاص بها** فقط ما لم يكن لدى المستدعي أيضًا `operator.admin`
- يستطيع `openclaw devices rotate --scope ...` طلب نطاقات المشغّل التي تحتفظ بها جلسة المستدعي بالفعل فقط

ذات صلة:

- [الإعداد](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [واجهة التحكم](/ar/web/control-ui)
- [الأجهزة](/ar/cli/devices)
- [الوصول عن بُعد](/ar/gateway/remote)
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
- عدم تطابق إعداد الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="البصمات الشائعة">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` ← لم يتم تمكين وضع Gateway المحلي، أو كُتب فوق ملف الإعداد وفقد `gateway.mode`. الإصلاح: عيّن `gateway.mode="local"` في إعدادك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعداد الوضع المحلي المتوقع. إذا كنت تشغّل OpenClaw عبر Podman، فمسار الإعداد الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` ← ربط غير loopback دون مسار مصادقة Gateway صالح (رمز/كلمة مرور، أو trusted-proxy حيث يكون مهيأً).
    - `another gateway instance is already listening` / `EADDRINUSE` ← تعارض في المنفذ.
    - `Other gateway-like services detected (best effort)` ← توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. ينبغي لمعظم الإعدادات الاحتفاظ بـ Gateway واحد لكل جهاز؛ إذا كنت تحتاج فعلًا إلى أكثر من واحد، فاعزل المنافذ + الإعداد/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor ← توجد وحدة نظام systemd بينما خدمة مستوى المستخدم مفقودة. أزل النسخة المكررة أو عطّلها قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` ← لا يزال المشرف المثبت يثبّت `--port` القديم. شغّل `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [تنفيذ الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الإعداد](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## استعاد Gateway آخر إعداد جيد معروف

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
- ملف `openclaw.json.clobbered.*` بطابع زمني بجانب الإعداد النشط
- حدث نظام للوكيل الرئيسي يبدأ بـ `Config recovery warning`

<AccordionGroup>
  <Accordion title="ما الذي حدث">
    - لم يجتز الإعداد المرفوض التحقق أثناء بدء التشغيل أو إعادة التحميل الساخنة.
    - احتفظ OpenClaw بالحمولة المرفوضة بصيغة `.clobbered.*`.
    - تمت استعادة الإعداد النشط من آخر نسخة جيدة معروفة تم التحقق منها.
    - يتم تحذير دورة الوكيل الرئيسي التالية من إعادة كتابة الإعداد المرفوض بلا تبصر.
    - إذا كانت كل مشكلات التحقق تحت `plugins.entries.<id>...`، فلن يستعيد OpenClaw الملف بالكامل. تبقى إخفاقات Plugin المحلية واضحة بينما تظل إعدادات المستخدم غير المرتبطة في الإعداد النشط.

  </Accordion>
  <Accordion title="افحص وأصلح">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="البصمات الشائعة">
    - توجد `.clobbered.*` ← تمت استعادة تعديل مباشر خارجي أو قراءة بدء تشغيل.
    - توجد `.rejected.*` ← فشلت كتابة إعداد مملوكة لـ OpenClaw في فحوصات المخطط أو الكتابة فوق الملف قبل التثبيت.
    - `Config write rejected:` ← حاولت الكتابة إسقاط بنية مطلوبة، أو تقليص الملف بشدة، أو حفظ إعداد غير صالح.
    - `Rejected validation details:` ← يتضمن سجل الاسترداد أو إشعار الوكيل الرئيسي مسار المخطط الذي تسبب في الاستعادة، مثل `agents.defaults.execution` أو `gateway.auth.password.source`.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` ← تعامل بدء التشغيل مع الملف الحالي كأنه كُتب فوقه لأنه فقد حقولًا أو حجمًا مقارنة بآخر نسخة احتياطية جيدة معروفة.
    - `Config last-known-good promotion skipped` ← احتوى المرشح على عناصر نائبة لأسرار منقحة مثل `***`.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. احتفظ بالإعداد النشط المستعاد إذا كان صحيحًا.
    2. انسخ المفاتيح المقصودة فقط من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا حررت يدويًا، فاحتفظ بإعداد JSON5 الكامل، وليس الكائن الجزئي الذي أردت تغييره فقط.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [الإعداد](/ar/cli/config)
- [الإعداد: إعادة التحميل الساخنة](/ar/gateway/configuration#config-hot-reload)
- [الإعداد: التحقق الصارم](/ar/gateway/configuration#strict-validation)
- [Doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه لا يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير يتعلق بالرجوع إلى SSH، أو تعدد Gateways، أو النطاقات المفقودة، أو مراجع المصادقة غير المحلولة.

البصمات الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` ← فشل إعداد SSH، لكن الأمر لا يزال جرّب الأهداف المباشرة المهيأة/loopback.
- `multiple reachable gateways detected` ← أجاب أكثر من هدف. يعني هذا عادةً إعدادًا متعمدًا متعدد Gateways أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` ← نجح الاتصال، لكن RPC التفاصيل محدود النطاق؛ أقرن هوية الجهاز أو استخدم بيانات اعتماد تحتوي على `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` ← نجح الاتصال، لكن مجموعة RPC التشخيصية الكاملة انتهت مهلتها أو فشلت. تعامل مع هذا كـ Gateway قابل للوصول مع تشخيصات متدهورة؛ قارن `connect.ok` و`connect.rpcOk` في مخرجات `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` ← أجاب Gateway، لكن هذا العميل لا يزال يحتاج إلى الاقتران/الموافقة قبل وصول المشغّل العادي.
- نص تحذير SecretRef غير المحلول لـ `gateway.auth.*` / `gateway.remote.*` ← لم تكن مادة المصادقة متاحة في مسار الأمر هذا للهدف الفاشل.

ذات صلة:

- [Gateway](/ar/cli/gateway)
- [عدة Gateways على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول عن بُعد](/ar/gateway/remote)

## القناة متصلة، لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركز على السياسة والأذونات وقواعد التسليم الخاصة بالقناة.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

ابحث عن:

- سياسة DM ‏(`pairing`، `allowlist`، `open`، `disabled`).
- قائمة سماح المجموعة ومتطلبات الإشارة.
- أذونات/نطاقات API الخاصة بالقناة مفقودة.

الأنماط الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلقة → المرسل غير معتمد.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشكلة في مصادقة/أذونات القناة.

ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron وHeartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يتم التسليم، فتحقق أولا من حالة المجدول، ثم هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- Cron مفعل والتنبيه التالي موجود.
- حالة سجل تشغيل المهمة (`ok`، `skipped`، `error`).
- أسباب تخطي Heartbeat ‏(`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="الأنماط الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron معطل.
    - `cron: timer tick failed` → فشلت نبضة مؤقت المجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / ترويسات markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
    - `heartbeat: unknown accountId` → معرف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة بنمط DM بينما تم ضبط `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) على `block`.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## Node مقترن، والأداة تفشل

إذا كان Node مقترنا لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- Node متصل بالإنترنت مع القدرات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات التنفيذ وحالة قائمة السماح.

الأنماط الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → تم حظر الأمر بواسطة قائمة السماح.

ذات صلة:

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
- [Nodes](/ar/nodes/index)

## فشل أداة المتصفح

استخدم هذا عندما تفشل إجراءات أداة المتصفح مع أن Gateway نفسه سليم.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

ابحث عن:

- ما إذا كان `plugins.allow` مضبوطا ويتضمن `browser`.
- مسار صالح لملف المتصفح التنفيذي.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="أنماط Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمن بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` ‏`browser`، لذلك لم يتم تحميل Plugin أبدا.
    - `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
    - `browser.executablePath not found` → المسار المضبوط غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان URL المضبوط لـ CDP مخططا غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان URL المضبوط لـ CDP على منفذ سيئ أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى اعتماد وقت التشغيل `playwright-core` الخاص بـ Plugin المتصفح المضمن؛ شغل `openclaw doctor --fix`، ثم أعد تشغيل Gateway. لا تزال لقطات ARIA ولقطات الشاشة الأساسية للصفحات قادرة على العمل، لكن التنقل ولقطات AI ولقطات عناصر محددات CSS وتصدير PDF ستبقى غير متاحة.

  </Accordion>
  <Accordion title="أنماط Chrome MCP / الجلسة الحالية">
    - `Could not find DevToolsActivePort for chrome` → تعذر على الجلسة الحالية في Chrome MCP الإرفاق بدليل بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، وفعل التصحيح عن بعد، وأبق المتصفح مفتوحا، ووافق على أول مطالبة إرفاق، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضل ملف التعريف المدار `openclaw`.
    - `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف الإرفاق في Chrome MCP على أي تبويبات Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المضبوطة من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف التعريف الخاص بالإرفاق فقط على هدف يمكن الوصول إليه، أو أن نقطة نهاية HTTP استجابت لكن تعذر فتح CDP WebSocket.

  </Accordion>
  <Accordion title="أنماط العنصر / لقطة الشاشة / الرفع">
    - `fullPage is not supported for element screenshots` → مزج طلب لقطة الشاشة `--full-page` مع `--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطة الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات الرفع في Chrome MCP إلى مراجع اللقطات، وليس محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل رفعا واحدا لكل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات الحوار على ملفات تعريف Chrome MCP تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:type` على ملفات تعريف `profile="user"` / الجلسة الحالية في Chrome MCP، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:evaluate` على ملفات تعريف `profile="user"` / الجلسة الحالية في Chrome MCP، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحا مدارا أو ملف تعريف CDP خاما.
    - تجاوزات منفذ العرض / الوضع الداكن / اللغة المحلية / عدم الاتصال القديمة على ملفات تعريف الإرفاق فقط أو CDP البعيدة → شغل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP بدون إعادة تشغيل Gateway بالكامل.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [المتصفح (بإدارة OpenClaw)](/ar/tools/browser)
- [استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا أجريت ترقية وتعطل شيء فجأة

معظم الأعطال بعد الترقية تكون انحرافا في الإعدادات أو قيما افتراضية أكثر صرامة يتم فرضها الآن.

<AccordionGroup>
  <Accordion title="1. تغير سلوك المصادقة وتجاوز عنوان URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما يجب التحقق منه:

    - إذا كان `gateway.mode=remote`، فقد تكون استدعاءات CLI تستهدف البعيد بينما خدمتك المحلية سليمة.
    - لا تعود استدعاءات `--url` الصريحة إلى بيانات الاعتماد المخزنة.

    الأنماط الشائعة:

    - `gateway connect failed:` → هدف URL خاطئ.
    - `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

  </Accordion>
  <Accordion title="2. أصبحت حواجز الربط والمصادقة أكثر صرامة">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما يجب التحقق منه:

    - تحتاج عمليات الربط غير الخاصة بـ local loopback ‏(`lan`، `tailnet`، `custom`) إلى مسار مصادقة Gateway صالح: مصادقة برمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير خاص بـ local loopback مضبوط بشكل صحيح.
    - لا تستبدل المفاتيح القديمة مثل `gateway.token` ‏`gateway.auth.token`.

    الأنماط الشائعة:

    - `refusing to bind gateway ... without auth` → ربط غير خاص بـ local loopback بدون مسار مصادقة Gateway صالح.
    - `Connectivity probe: failed` بينما وقت التشغيل قيد العمل → Gateway حي لكنه غير قابل للوصول باستخدام المصادقة/عنوان URL الحاليين.

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
    - موافقات اقتران DM المعلقة بعد تغييرات السياسة أو الهوية.

    الأنماط الشائعة:

    - `device identity required` → لم يتم استيفاء مصادقة الجهاز.
    - `pairing required` → يجب اعتماد المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا بقي إعداد الخدمة ووقت التشغيل غير متفقين بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل ملف التعريف/الحالة نفسه:

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
