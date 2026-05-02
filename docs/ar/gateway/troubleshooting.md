---
read_when:
    - وجّهك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام ثابتة في دليل التشغيل مستندة إلى الأعراض مع أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل إجراءات معمّق لاستكشاف أخطاء Gateway والقنوات والأتمتة والعُقد والمتصفح وإصلاحها
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-05-02T07:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذه الصفحة هي دليل التشغيل المتعمق. ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا أردت مسار الفرز السريع أولًا.

## سلّم الأوامر

شغّل هذه أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات السلامة المتوقعة:

- يعرض `openclaw gateway status` السطر `Runtime: running`، و`Connectivity probe: ok`، وسطر `Capability: ...`.
- يبلّغ `openclaw doctor` عن عدم وجود مشكلات حظر في التهيئة أو الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وحيثما يكون ذلك مدعومًا، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## تثبيتات Split brain وحارس التهيئة الأحدث

استخدم هذا عندما تتوقف خدمة Gateway بشكل غير متوقع بعد تحديث، أو عندما تعرض السجلات أن ملفًا ثنائيًا واحدًا من `openclaw` أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يختم OpenClaw عمليات كتابة التهيئة باستخدام `meta.lastTouchedVersion`. لا تزال أوامر القراءة فقط قادرة على فحص تهيئة كتبها OpenClaw أحدث، لكن تعديلات العمليات والخدمات ترفض المتابعة من ملف ثنائي أقدم. تشمل الإجراءات المحظورة بدء خدمة Gateway وإيقافها وإعادة تشغيلها وإلغاء تثبيتها، وإعادة تثبيت الخدمة قسرًا، وبدء Gateway في وضع الخدمة، وتنظيف المنفذ عبر `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="إصلاح PATH">
    أصلح `PATH` بحيث يحل `openclaw` إلى التثبيت الأحدث، ثم أعد تشغيل الإجراء.
  </Step>
  <Step title="إعادة تثبيت خدمة Gateway">
    أعد تثبيت خدمة Gateway المقصودة من التثبيت الأحدث:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="إزالة المغلفات القديمة">
    أزل حزمة النظام القديمة أو إدخالات المغلف القديمة التي لا تزال تشير إلى ملف ثنائي قديم لـ `openclaw`.
  </Step>
</Steps>

<Warning>
لخفض الإصدار المقصود أو الاسترداد الطارئ فقط، اضبط `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير مضبوط للتشغيل العادي.
</Warning>

## يتطلب Anthropic 429 استخدامًا إضافيًا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- نموذج Anthropic Opus/Sonnet المحدد لديه `params.context1m: true`.
- اعتماد Anthropic الحالي غير مؤهل لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات الطويلة/تشغيلات النماذج التي تحتاج إلى مسار 1M التجريبي.

خيارات الإصلاح:

<Steps>
  <Step title="تعطيل context1m">
    عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
  </Step>
  <Step title="استخدام اعتماد مؤهل">
    استخدم اعتماد Anthropic مؤهلًا لطلبات السياق الطويل، أو انتقل إلى مفتاح Anthropic API.
  </Step>
  <Step title="تهيئة نماذج احتياطية">
    هيّئ نماذج احتياطية حتى تستمر التشغيلات عند رفض طلبات السياق الطويل من Anthropic.
  </Step>
</Steps>

ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز المميزة والتكاليف](/ar/reference/token-use)
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
  يعمل بالمعرّف العاري نفسه للنموذج
- أخطاء الواجهة الخلفية حول توقع `messages[].content` سلسلة نصية
- تحذيرات متقطعة `incomplete turn detected ... stopReason=stop payloads=0` مع واجهة خلفية محلية متوافقة مع OpenAI
- أعطال الواجهة الخلفية التي تظهر فقط مع أعداد رموز مطالبات أكبر أو مطالبات وقت تشغيل الوكيل الكاملة

<AccordionGroup>
  <Accordion title="العلامات الشائعة">
    - `model_not_found` مع خادم محلي بنمط MLX/vLLM → تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` هو `"openai-completions"` للواجهات الخلفية `/v1/chat/completions`، وأن `models.providers.<provider>.models[].id` هو المعرّف العاري المحلي لدى المزوّد. حدده مع بادئة المزوّد مرة واحدة، مثل `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبقِ إدخال الكتالوج كما هو `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → الواجهة الخلفية ترفض أجزاء محتوى Chat Completions المهيكلة. الإصلاح: اضبط `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → أكملت الواجهة الخلفية طلب Chat Completions لكنها لم تُرجع نص مساعد ظاهرًا للمستخدم لذلك الدور. يعيد OpenClaw محاولة الأدوار الفارغة المتوافقة مع OpenAI والآمنة لإعادة التشغيل مرة واحدة؛ وتعني الإخفاقات المستمرة عادة أن الواجهة الخلفية تصدر محتوى فارغًا/غير نصي أو تكبت نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكيل OpenClaw تفشل مع أعطال الواجهة الخلفية/النموذج (مثل Gemma في بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ الواجهة الخلفية تفشل مع شكل مطالبة وقت تشغيل الوكيل الأكبر.
    - تقل الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم upstream أو في خطأ بالواجهة الخلفية.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. اضبط `compat.requiresStringContent: true` للواجهات الخلفية Chat Completions التي تقبل السلاسل النصية فقط.
    2. اضبط `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع التعامل مع سطح مخطط أدوات OpenClaw على نحو موثوق.
    3. خفّض ضغط المطالبات حيثما أمكن: تمهيد مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو واجهة خلفية بدعم أقوى للسياق الطويل.
    4. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما لا تزال أدوار وكيل OpenClaw تتعطل داخل الواجهة الخلفية، فتعامل معها كقيد upstream في الخادم/النموذج وقدّم إعادة إنتاج هناك مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [التهيئة](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات عاملة لكن لا يوجد ما يجيب، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلّق لمرسلي الرسائل المباشرة.
- بوابة ذكر المجموعة (`requireMention`، `mentionPatterns`).
- عدم تطابق قوائم السماح للقناة/المجموعة.

العلامات الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة حتى وجود ذكر.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [المجموعات](/ar/channels/groups)
- [الاقتران](/ar/channels/pairing)

## اتصال واجهة تحكم لوحة المعلومات

عندما لا تتصل لوحة المعلومات/واجهة التحكم، تحقق من عنوان URL، ووضع المصادقة، وافتراضات السياق الآمن.

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
  <Accordion title="علامات الاتصال / المصادقة">
    - `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
    - `origin not allowed` → `Origin` في المتصفح غير موجود في `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير local loopback دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` → لا يكمل العميل مسار مصادقة الجهاز المستند إلى التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخطأ (أو طابعًا زمنيًا قديمًا) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز جهاز مخزن مؤقتًا.
    - تعيد إعادة المحاولة برمز التخزين المؤقت تلك استخدام مجموعة النطاقات المخزنة مع رمز الجهاز المقترن. يحتفظ مستدعو `deviceToken` الصريح / `scopes` الصريح بمجموعة النطاقات المطلوبة بدلًا من ذلك.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال كالتالي: الرمز المشترك/كلمة المرور الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - في مسار واجهة تحكم Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدِّد الفشل. لذلك يمكن لمحاولتي إعادة محاولة سيئتين متزامنتين من العميل نفسه أن تُظهرا `retry later` في المحاولة الثانية بدلًا من عدم تطابقين عاديين.
    - `too many failed authentication attempts (retry later)` من عميل local loopback ذي أصل متصفح → تؤدي الإخفاقات المتكررة من `Origin` المطبّع نفسه إلى قفل مؤقت؛ يستخدم أصل localhost آخر حاوية منفصلة.
    - تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف في الرمز المشترك/رمز الجهاز؛ حدّث تهيئة الرمز وأعد الموافقة على رمز الجهاز أو دوّره إذا لزم الأمر.
    - `gateway connect failed:` → مضيف/منفذ/هدف URL غير صحيح.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                 | المعنى                                                                                                                                                                                        | الإجراء الموصى به                                                                                                                                                                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل الرمز المشترك المطلوب.                                                                                                                                                        | الصق/عيّن الرمز في العميل ثم أعد المحاولة. لمسارات لوحة التحكم: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI.                                                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                                   | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ أما مستدعو `deviceToken` / `scopes` الصريحون فيحتفظون بالنطاقات المطلوبة. إذا استمر الفشل، شغّل [قائمة التحقق لاسترداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | الرمز المخزن مؤقتًا لكل جهاز قديم أو مُلغى.                                                                                                                                                 | دوّر/أعد اعتماد رمز الجهاز باستخدام [devices CLI](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. افحص `error.details.reason` بحثًا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                                            |

<Note>
يجب ألا تعتمد استدعاءات RPC الخلفية المباشرة عبر local loopback والمصادق عليها برمز/كلمة مرور Gateway المشتركة على أساس نطاق الجهاز المقترن الخاص بـ CLI. إذا كانت الوكلاء الفرعيون أو الاستدعاءات الداخلية الأخرى لا تزال تفشل مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"` وأنه لا يفرض `deviceIdentity` صريحة أو رمز جهاز.
</Note>

فحص ترحيل مصادقة الجهاز v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا أظهرت السجلات أخطاء nonce/التوقيع، فحدّث العميل المتصل وتحقق منه:

<Steps>
  <Step title="انتظار connect.challenge">
    ينتظر العميل `connect.challenge` الصادر من Gateway.
  </Step>
  <Step title="توقيع الحمولة">
    يوقّع العميل الحمولة المرتبطة بالتحدي.
  </Step>
  <Step title="إرسال nonce الجهاز">
    يرسل العميل `connect.params.device.nonce` مع nonce التحدي نفسه.
  </Step>
</Steps>

إذا رُفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- يمكن لجلسات رمز الجهاز المقترن إدارة جهازها **الخاص بها** فقط ما لم يكن لدى المستدعي أيضًا `operator.admin`
- يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات المشغّل التي تحتفظ بها جلسة المستدعي بالفعل فقط

ذات صلة:

- [التكوين](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [Control UI](/ar/web/control-ui)
- [الأجهزة](/ar/cli/devices)
- [الوصول البعيد](/ar/gateway/remote)
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
- عدم تطابق تكوين الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` ← وضع Gateway المحلي غير مفعّل، أو تمت الكتابة فوق ملف التكوين وفقد `gateway.mode`. الإصلاح: عيّن `gateway.mode="local"` في تكوينك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم تكوين الوضع المحلي المتوقع. إذا كنت تشغّل OpenClaw عبر Podman، فإن مسار التكوين الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` ← ربط غير local loopback دون مسار مصادقة Gateway صالح (رمز/كلمة مرور، أو وكيل موثوق حيثما تم تكوينه).
    - `another gateway instance is already listening` / `EADDRINUSE` ← تعارض منفذ.
    - `Other gateway-like services detected (best effort)` ← توجد وحدات launchd/systemd/schtasks قديمة أو موازية. يجب أن تحتفظ معظم الإعدادات بـ Gateway واحد لكل جهاز؛ إذا كنت تحتاج فعلًا إلى أكثر من واحد، فاعزل المنافذ + التكوين/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor ← توجد وحدة systemd على مستوى النظام بينما خدمة مستوى المستخدم مفقودة. أزِل النسخة المكررة أو عطّلها قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` ← لا يزال المشرف المثبّت يثبّت `--port` القديم. شغّل `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [التنفيذ الخلفي وأداة العملية](/ar/gateway/background-process)
- [التكوين](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## استعاد Gateway آخر تكوين جيد معروف

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
- ملف `openclaw.json.clobbered.*` مؤرخ بجانب التكوين النشط
- حدث نظام للوكيل الرئيسي يبدأ بـ `Config recovery warning`

<AccordionGroup>
  <Accordion title="ما الذي حدث">
    - لم يجتز التكوين المرفوض التحقق أثناء بدء التشغيل أو إعادة التحميل الساخنة.
    - احتفظ OpenClaw بالحمولة المرفوضة باسم `.clobbered.*`.
    - تمت استعادة التكوين النشط من آخر نسخة جيدة معروفة تم التحقق منها.
    - يتم تحذير دورة الوكيل الرئيسي التالية من إعادة كتابة التكوين المرفوض عشوائيًا.
    - إذا كانت كل مشكلات التحقق ضمن `plugins.entries.<id>...`، فلن يستعيد OpenClaw الملف كله. تبقى حالات الفشل المحلية في Plugin واضحة بينما تظل إعدادات المستخدم غير المرتبطة في التكوين النشط.

  </Accordion>
  <Accordion title="الفحص والإصلاح">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="التواقيع الشائعة">
    - وجود `.clobbered.*` ← تمت استعادة تعديل مباشر خارجي أو قراءة عند بدء التشغيل.
    - وجود `.rejected.*` ← فشلت كتابة تكوين مملوكة لـ OpenClaw في فحوصات المخطط أو الكتابة فوق الملف قبل الالتزام.
    - `Config write rejected:` ← حاولت الكتابة إسقاط بنية مطلوبة، أو تقليص الملف بشدة، أو حفظ تكوين غير صالح.
    - `Rejected validation details:` ← يتضمن سجل الاسترداد أو إشعار الوكيل الرئيسي مسار المخطط الذي سبب الاستعادة، مثل `agents.defaults.execution` أو `gateway.auth.password.source`.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` ← تعامل بدء التشغيل مع الملف الحالي على أنه تمت الكتابة فوقه لأنه فقد حقولًا أو حجمًا مقارنة بنسخة آخر تكوين جيد معروف الاحتياطية.
    - `Config last-known-good promotion skipped` ← احتوى المرشح على عناصر نائبة لأسرار محجوبة مثل `***`.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. احتفظ بالتكوين النشط المستعاد إذا كان صحيحًا.
    2. انسخ المفاتيح المقصودة فقط من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا كنت تعدّل يدويًا، فاحتفظ بتكوين JSON5 الكامل، وليس الكائن الجزئي الذي أردت تغييره فقط.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [التكوين](/ar/cli/config)
- [التكوين: إعادة التحميل الساخنة](/ar/gateway/configuration#config-hot-reload)
- [التكوين: التحقق الصارم](/ar/gateway/configuration#strict-validation)
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

التواقيع الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` ← فشل إعداد SSH، لكن الأمر ظل يحاول الأهداف المباشرة المكوّنة/أهداف local loopback.
- `multiple reachable gateways detected` ← أجاب أكثر من هدف واحد. يعني هذا عادةً إعدادًا متعمدًا متعدد Gateways أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` ← نجح الاتصال، لكن RPC التفاصيل محدود بالنطاق؛ قم بإقران هوية الجهاز أو استخدم بيانات اعتماد تحتوي على `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` ← نجح الاتصال، لكن مجموعة RPC التشخيصية الكاملة انتهت مهلتها أو فشلت. تعامل مع هذا على أنه Gateway قابل للوصول مع تشخيصات متدهورة؛ قارن `connect.ok` و`connect.rpcOk` في مخرجات `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` ← أجاب Gateway، لكن هذا العميل لا يزال يحتاج إلى الإقران/الموافقة قبل الوصول العادي للمشغّل.
- نص تحذير SecretRef غير محلول لـ `gateway.auth.*` / `gateway.remote.*` ← لم تكن مادة المصادقة متاحة في مسار الأمر هذا للهدف الفاشل.

ذات صلة:

- [Gateway](/ar/cli/gateway)
- [Gateways متعددة على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول البعيد](/ar/gateway/remote)

## القناة متصلة، لكن الرسائل لا تتدفق

إذا كانت حالة القناة متصلة لكن تدفق الرسائل متوقف، فركّز على السياسة، والأذونات، وقواعد التسليم الخاصة بالقناة.

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
- `pairing` / آثار الموافقة المعلّقة → المُرسل غير معتمد.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشكلة في مصادقة/أذونات القناة.

ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron وHeartbeat

إذا لم يعمل cron أو heartbeat أو لم يسلّم، فتحقق أولًا من حالة المجدول، ثم هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- Cron مفعّل وموعد التنبيه التالي موجود.
- حالة سجل تشغيل المهمة (`ok`، `skipped`، `error`).
- أسباب تخطي Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` → cron معطّل.
    - `cron: timer tick failed` → فشلت نبضة مؤقت المجدول؛ تحقق من أخطاء الملف/السجل/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / رؤوس markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهمة مستحقة في هذه النبضة.
    - `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف heartbeat إلى وجهة بنمط رسالة مباشرة بينما `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) مضبوط على `block`.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## Node مقترن، والأداة تفشل

إذا كان Node مقترنًا لكن الأدوات تفشل، فاعزل حالة الواجهة والأذونات والموافقة.

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
- موافقات exec وحالة قائمة السماح.

التواقيع الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة exec معلّقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → الأمر محظور بواسطة قائمة السماح.

ذات صلة:

- [موافقات exec](/ar/tools/exec-approvals)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
- [Nodes](/ar/nodes/index)

## أداة المتصفح تفشل

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
- مسار صالح للملف التنفيذي للمتصفح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="تواقيع Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمّن بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل Plugin أبدًا.
    - `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
    - `browser.executablePath not found` → المسار المكوّن غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان URL الخاص بـ CDP المكوّن مخططًا غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان URL الخاص بـ CDP المكوّن على منفذ سيئ أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى تبعية وقت تشغيل المتصفح الأساسية؛ أعد تثبيت OpenClaw أو حدّثه، ثم أعد تشغيل Gateway. ما تزال لقطات ARIA ولقطات الصفحة الأساسية قادرة على العمل، لكن التنقل ولقطات AI ولقطات عناصر محدد CSS وتصدير PDF تبقى غير متاحة.

  </Accordion>
  <Accordion title="تواقيع Chrome MCP / الجلسة الحالية">
    - `Could not find DevToolsActivePort for chrome` → تعذر على جلسة Chrome MCP الحالية الإرفاق بدليل بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، وفعّل تصحيح الأخطاء عن بُعد، وأبقِ المتصفح مفتوحًا، ووافق على مطالبة الإرفاق الأولى، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
    - `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف إرفاق Chrome MCP على علامات تبويب Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المكوّنة من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف تعريف الإرفاق فقط على هدف يمكن الوصول إليه، أو أن نقطة نهاية HTTP استجابت لكن تعذر فتح WebSocket الخاص بـ CDP.

  </Accordion>
  <Accordion title="تواقيع العنصر / لقطة الشاشة / الرفع">
    - `fullPage is not supported for element screenshots` → خلط طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات الرفع في Chrome MCP إلى مراجع اللقطات، وليس محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات الحوار على ملفات تعريف Chrome MCP تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:type` على ملفات تعريف `profile="user"` / جلسات Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون المهلة المخصصة مطلوبة.
    - `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:evaluate` على ملفات تعريف `profile="user"` / جلسات Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون المهلة المخصصة مطلوبة.
    - `response body is not supported for existing-session profiles yet.` → ما يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
    - تجاوزات منفذ العرض / الوضع الداكن / اللغة / عدم الاتصال القديمة على ملفات تعريف الإرفاق فقط أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP دون إعادة تشغيل Gateway بالكامل.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [المتصفح (بإدارة OpenClaw)](/ar/tools/browser)
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا قمت بالترقية وتعطل شيء فجأة

معظم الأعطال بعد الترقية تكون انجرافًا في الإعدادات أو فرضًا لإعدادات افتراضية أكثر صرامة الآن.

<AccordionGroup>
  <Accordion title="1. تغيّر سلوك المصادقة وتجاوز عنوان URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما يجب التحقق منه:

    - إذا كان `gateway.mode=remote`، فقد تكون استدعاءات CLI تستهدف البعيد بينما خدمتك المحلية سليمة.
    - استدعاءات `--url` الصريحة لا ترجع إلى بيانات الاعتماد المخزنة.

    التواقيع الشائعة:

    - `gateway connect failed:` → هدف عنوان URL خاطئ.
    - `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

  </Accordion>
  <Accordion title="2. أصبحت حواجز bind والمصادقة أكثر صرامة">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما يجب التحقق منه:

    - تحتاج عمليات bind غير local loopback (`lan`، `tailnet`، `custom`) إلى مسار مصادقة Gateway صالح: مصادقة رمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير local loopback مُكوّن بشكل صحيح.
    - المفاتيح القديمة مثل `gateway.token` لا تحل محل `gateway.auth.token`.

    التواقيع الشائعة:

    - `refusing to bind gateway ... without auth` → bind غير local loopback دون مسار مصادقة Gateway صالح.
    - `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway حي لكنه غير قابل للوصول باستخدام المصادقة/عنوان URL الحاليين.

  </Accordion>
  <Accordion title="3. تغيّرت حالة الاقتران وهوية الجهاز">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما يجب التحقق منه:

    - موافقات الأجهزة المعلّقة للوحة التحكم/nodes.
    - موافقات اقتران الرسائل المباشرة المعلّقة بعد تغييرات السياسة أو الهوية.

    التواقيع الشائعة:

    - `device identity required` → لم يتم استيفاء مصادقة الجهاز.
    - `pairing required` → يجب اعتماد المُرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا كانت إعدادات الخدمة ووقت التشغيل ما تزال غير متفقة بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل ملف التعريف/الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذات صلة:

- [المصادقة](/ar/gateway/authentication)
- [exec في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الاقتران المملوك لـ Gateway](/ar/gateway/pairing)

## ذات صلة

- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
- [دليل تشغيل Gateway](/ar/gateway)
