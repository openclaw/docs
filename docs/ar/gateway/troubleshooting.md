---
read_when:
    - وجّهك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام دليل إجراءات تشغيل ثابتة قائمة على الأعراض مع أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل تشغيل متعمق لاستكشاف الأخطاء وإصلاحها لـ Gateway والقنوات والأتمتة والعُقد والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-04-30T08:03:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذه الصفحة هي دليل التشغيل التفصيلي. ابدأ من [/استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) إذا كنت تريد مسار الفرز السريع أولًا.

## تسلسل الأوامر

شغّل هذه أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات الصحة المتوقعة:

- يعرض `openclaw gateway status` السطر `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- يبلّغ `openclaw doctor` عن عدم وجود مشكلات حظر في الإعدادات/الخدمة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وحيثما كان مدعومًا، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## تثبيتات Split brain وحارس الإعدادات الأحدث

استخدم هذا عندما تتوقف خدمة Gateway بشكل غير متوقع بعد تحديث، أو تُظهر السجلات أن أحد ملفات `openclaw` الثنائية أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

توسم OpenClaw عمليات كتابة الإعدادات باستخدام `meta.lastTouchedVersion`. لا يزال بإمكان أوامر القراءة فقط فحص إعدادات كتبها إصدار OpenClaw أحدث، لكن عمليات تعديل العمليات والخدمات ترفض المتابعة من ملف ثنائي أقدم. تشمل الإجراءات المحظورة بدء خدمة Gateway وإيقافها وإعادة تشغيلها وإلغاء تثبيتها، وإعادة تثبيت الخدمة القسرية، وتشغيل Gateway في وضع الخدمة، وتنظيف المنفذ عبر `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    أصلح `PATH` بحيث يحل `openclaw` إلى التثبيت الأحدث، ثم أعد تشغيل الإجراء.
  </Step>
  <Step title="Reinstall the gateway service">
    أعد تثبيت خدمة Gateway المقصودة من التثبيت الأحدث:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    أزل حزمة النظام القديمة أو إدخالات الغلاف القديمة التي لا تزال تشير إلى ملف `openclaw` ثنائي قديم.
  </Step>
</Steps>

<Warning>
للرجوع المتعمد إلى إصدار أقدم أو التعافي الطارئ فقط، عيّن `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير معيّن للتشغيل العادي.
</Warning>

## Anthropic 429 يتطلب استخدامًا إضافيًا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- نموذج Anthropic Opus/Sonnet المحدد يحتوي على `params.context1m: true`.
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
    اضبط نماذج احتياطية كي تستمر التشغيلات عندما تُرفض طلبات السياق الطويل من Anthropic.
  </Step>
</Steps>

ذو صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## واجهة خلفية محلية متوافقة مع OpenAI تجتاز الفحوصات المباشرة لكن تشغيلات الوكيل تفشل

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

- تنجح الاستدعاءات المباشرة الصغيرة، لكن تفشل تشغيلات OpenClaw فقط عند المطالبات الأكبر
- أخطاء `model_not_found` أو 404 رغم أن `/v1/chat/completions` المباشر
  يعمل بمعرّف النموذج المجرد نفسه
- أخطاء في الواجهة الخلفية حول توقّع `messages[].content` لسلسلة نصية
- تحذيرات متقطعة `incomplete turn detected ... stopReason=stop payloads=0` مع واجهة خلفية محلية متوافقة مع OpenAI
- أعطال في الواجهة الخلفية تظهر فقط مع أعداد رموز مطالبة أكبر أو مطالبات وقت تشغيل الوكيل الكاملة

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` مع خادم محلي بأسلوب MLX/vLLM → تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` هو `"openai-completions"` لواجهات `/v1/chat/completions` الخلفية، وأن `models.providers.<provider>.models[].id` هو المعرّف المحلي المجرد لدى المزود. حدده مع بادئة المزود مرة واحدة، مثلًا `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبقِ إدخال الفهرس `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → ترفض الواجهة الخلفية أجزاء محتوى Chat Completions المهيكلة. الإصلاح: عيّن `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → أكملت الواجهة الخلفية طلب Chat Completions لكنها لم تُرجع نص مساعد مرئيًا للمستخدم لذلك الدور. تعيد OpenClaw محاولة أدوار OpenAI-compatible الفارغة الآمنة لإعادة التشغيل مرة واحدة؛ تعني الإخفاقات المستمرة عادةً أن الواجهة الخلفية تصدر محتوى فارغًا/غير نصي أو تكبت نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن تفشل تشغيلات وكيل OpenClaw مع أعطال في الواجهة الخلفية/النموذج (مثل Gemma على بعض إصدارات `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ الواجهة الخلفية تفشل عند شكل مطالبة وقت تشغيل الوكيل الأكبر.
    - تتقلص الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم upstream أو خطأ في الواجهة الخلفية.

  </Accordion>
  <Accordion title="Fix options">
    1. عيّن `compat.requiresStringContent: true` لواجهات Chat Completions الخلفية التي تقبل السلاسل النصية فقط.
    2. عيّن `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع التعامل مع سطح مخطط أدوات OpenClaw بشكل موثوق.
    3. خفّض ضغط المطالبة حيثما أمكن: تهيئة مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو واجهة خلفية بدعم أقوى للسياق الطويل.
    4. إذا واصلت الطلبات المباشرة الصغيرة النجاح بينما تستمر أدوار وكيل OpenClaw في التعطل داخل الواجهة الخلفية، فتعامل معها كقيد upstream في الخادم/النموذج وقدّم إعادة إنتاج هناك مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذو صلة:

- [الإعدادات](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط نهاية متوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

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

- الاقتران معلّق لمرسلي الرسائل المباشرة.
- بوابة إشارات المجموعة (`requireMention`, `mentionPatterns`).
- عدم تطابق قوائم السماح للقناة/المجموعة.

التواقيع الشائعة:

- `drop guild message (mention required` → تُتجاهل رسالة المجموعة حتى وجود إشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذو صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
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

- عنوان URL الصحيح للفحص ولوحة المعلومات.
- عدم تطابق وضع المصادقة/الرمز بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
    - `origin not allowed` → `Origin` في المتصفح غير موجود في `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير loopback دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` → لا يكمل العميل تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → وقّع العميل حمولة خاطئة (أو طابعًا زمنيًا قديمًا) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز الجهاز المخزن مؤقتًا.
    - تعيد إعادة المحاولة بذلك الرمز المخزن مؤقتًا استخدام مجموعة النطاقات المخزنة مع رمز الجهاز المقترن. يحتفظ المستدعون ذوو `deviceToken` الصريح / `scopes` الصريحة بمجموعة النطاقات المطلوبة لديهم بدلًا من ذلك.
    - خارج مسار إعادة المحاولة هذا، تكون أسبقية مصادقة الاتصال هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التهيئة.
    - في مسار واجهة تحكم Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدِّد الفشل. لذلك يمكن لمحاولتي إعادة محاولة سيئتين ومتزامنتين من العميل نفسه أن تُظهرا `retry later` في المحاولة الثانية بدلًا من حالتي عدم تطابق عاديتين.
    - `too many failed authentication attempts (retry later)` من عميل loopback ذي أصل متصفح → تؤدي الإخفاقات المتكررة من `Origin` المطبّع نفسه إلى قفل مؤقت؛ يستخدم أصل localhost آخر سلة منفصلة.
    - تكرار `unauthorized` بعد إعادة المحاولة تلك → انحراف الرمز المشترك/رمز الجهاز؛ حدّث إعدادات الرمز وأعد الموافقة/دوّر رمز الجهاز إذا لزم الأمر.
    - `gateway connect failed:` → هدف مضيف/منفذ/عنوان URL خاطئ.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                  | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل الرمز المشترك المطلوب.                                                                                                                                                 | الصق/عيّن الرمز في العميل ثم أعد المحاولة. لمسارات لوحة المعلومات: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات Control UI.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                               | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بمحاولة موثوقة واحدة. تعيد محاولات الرموز المخزنة مؤقتًا استخدام النطاقات الموافق عليها والمخزنة؛ ويحافظ المستدعون الذين يمررون `deviceToken` / `scopes` صراحةً على النطاقات المطلوبة. إذا استمر الفشل، فشغّل [قائمة تحقق استرداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | الرمز المخزن مؤقتًا لكل جهاز قديم أو ملغي.                                                                                                                                                 | بدّل/أعد اعتماد رمز الجهاز باستخدام [devices CLI](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقق من `error.details.reason` بحثًا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | اعتمد الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                               |

<Note>
يجب ألا تعتمد نداءات RPC الخلفية المباشرة عبر loopback والمصادَق عليها برمز/كلمة مرور Gateway المشتركة على خط أساس نطاق الجهاز المقترن في CLI. إذا ظلت العوامل الفرعية أو النداءات الداخلية الأخرى تفشل مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"` ولا يفرض `deviceIdentity` صريحة أو رمز جهاز.
</Note>

فحص ترحيل مصادقة الأجهزة v2:

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
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات مشغل إلا إذا كانت جلسة المستدعي تملكها بالفعل

مرتبط:

- [التكوين](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [Control UI](/ar/web/control-ui)
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
- عدم تطابق تكوين الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` ← وضع Gateway المحلي غير مفعّل، أو تمت الكتابة فوق ملف التكوين وفقد `gateway.mode`. الإصلاح: عيّن `gateway.mode="local"` في تكوينك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لختم تكوين الوضع المحلي المتوقع من جديد. إذا كنت تشغّل OpenClaw عبر Podman، فمسار التكوين الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` ← ربط غير loopback بلا مسار مصادقة Gateway صالح (رمز/كلمة مرور، أو trusted-proxy حيث يكون مكوّنًا).
    - `another gateway instance is already listening` / `EADDRINUSE` ← تعارض منفذ.
    - `Other gateway-like services detected (best effort)` ← توجد وحدات launchd/systemd/schtasks قديمة أو موازية. يجب أن تحتفظ معظم الإعدادات بـ Gateway واحدة لكل جهاز؛ إذا كنت تحتاج فعلًا إلى أكثر من واحدة، فاعزل المنافذ + التكوين/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor ← توجد وحدة نظام systemd بينما خدمة مستوى المستخدم مفقودة. أزل النسخة المكررة أو عطّلها قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` ← ما يزال المشرف المثبت يثبّت `--port` القديم. شغّل `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

مرتبط:

- [تنفيذ الخلفية وأداة العمليات](/ar/gateway/background-process)
- [التكوين](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## استعاد Gateway آخر تكوين صالح معروف

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
- ملف `openclaw.json.clobbered.*` بطابع زمني بجانب التكوين النشط
- حدث نظام للعامل الرئيسي يبدأ بـ `Config recovery warning`

<AccordionGroup>
  <Accordion title="ما الذي حدث">
    - لم يجتز التكوين المرفوض التحقق أثناء بدء التشغيل أو إعادة التحميل الساخنة.
    - احتفظ OpenClaw بالحمولة المرفوضة بصيغة `.clobbered.*`.
    - استُعيد التكوين النشط من آخر نسخة صالحة معروفة تم التحقق منها.
    - يُحذَّر دور العامل الرئيسي التالي من إعادة كتابة التكوين المرفوض بلا تمييز.
    - إذا كانت كل مشكلات التحقق ضمن `plugins.entries.<id>...`، فلن يستعيد OpenClaw الملف كله. تبقى الإخفاقات المحلية للـ Plugin واضحة بينما تظل إعدادات المستخدم غير المرتبطة في التكوين النشط.

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
    - وجود `.clobbered.*` ← تمت استعادة تعديل مباشر خارجي أو قراءة بدء تشغيل.
    - وجود `.rejected.*` ← فشلت كتابة تكوين يملكها OpenClaw في فحوصات المخطط أو الكتابة فوق المحتوى قبل الالتزام.
    - `Config write rejected:` ← حاولت الكتابة إسقاط البنية المطلوبة، أو تقليص الملف بشدة، أو حفظ تكوين غير صالح.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` ← تعامل بدء التشغيل مع الملف الحالي على أنه مُتلف لأنه فقد حقولًا أو حجمًا مقارنة بآخر نسخة احتياطية صالحة معروفة.
    - `Config last-known-good promotion skipped` ← احتوى المرشح على عناصر نائبة لأسرار منقّحة مثل `***`.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. أبقِ التكوين النشط المستعاد إذا كان صحيحًا.
    2. انسخ المفاتيح المقصودة فقط من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا عدّلت يدويًا، فاحتفظ بتكوين JSON5 الكامل، لا الكائن الجزئي الذي أردت تغييره فقط.
  </Accordion>
</AccordionGroup>

مرتبط:

- [Config](/ar/cli/config)
- [التكوين: إعادة التحميل الساخنة](/ar/gateway/configuration#config-hot-reload)
- [التكوين: التحقق الصارم](/ar/gateway/configuration#strict-validation)
- [Doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه ما يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في خرج JSON.
- ما إذا كان التحذير متعلقًا بالرجوع إلى SSH، أو تعدد Gateways، أو النطاقات المفقودة، أو مراجع المصادقة غير المحلولة.

التواقيع الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` ← فشل إعداد SSH، لكن الأمر ظل يحاول الأهداف المباشرة المكوّنة/loopback.
- `multiple reachable gateways detected` ← أجاب أكثر من هدف واحد. يعني هذا عادةً إعدادًا مقصودًا لعدة Gateways أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` ← نجح الاتصال، لكن RPC التفصيلي مقيد بالنطاق؛ اقرن هوية الجهاز أو استخدم بيانات اعتماد تتضمن `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` ← نجح الاتصال، لكن مجموعة RPC التشخيصية الكاملة انتهت مهلتها أو فشلت. تعامل مع هذا على أنه Gateway يمكن الوصول إليها مع تشخيصات متدهورة؛ قارن `connect.ok` و`connect.rpcOk` في خرج `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` ← أجاب Gateway، لكن هذا العميل ما يزال يحتاج إلى إقران/موافقة قبل الوصول العادي للمشغل.
- نص تحذير SecretRef غير محلول في `gateway.auth.*` / `gateway.remote.*` ← لم تكن مادة المصادقة متاحة في مسار هذا الأمر للهدف الفاشل.

مرتبط:

- [Gateway](/ar/cli/gateway)
- [عدة Gateways على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول عن بُعد](/ar/gateway/remote)

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
- `pairing` / آثار الموافقة المعلّقة → المرسل غير معتمد.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → مشكلة في مصادقة/أذونات القناة.

ذات صلة:

- [استكشاف مشكلات القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron وHeartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يسلّم، فتحقّق أولاً من حالة المجدول، ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تفعيل Cron ووجود التنبيه التالي.
- حالة سجل تشغيل المهمة (`ok`, `skipped`, `error`).
- أسباب تخطّي Heartbeat (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron معطّل.
    - `cron: timer tick failed` → فشلت نبضة المجدول؛ تحقّق من أخطاء الملف/السجل/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه يحتوي فقط على أسطر فارغة / عناوين markdown، لذلك يتخطّى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
    - `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة بنمط رسالة مباشرة بينما تم ضبط `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) على `block`.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف المشكلات وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## Node مقترن، والأداة تفشل

إذا كان Node مقترناً لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية والأذونات والموافقة.

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

التواقيع الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام التشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلّقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → حظر الأمر بسبب قائمة السماح.

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

- ما إذا كان `plugins.allow` مضبوطاً ويتضمن `browser`.
- مسار تنفيذي صالح للمتصفح.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome المحلي لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمّن بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل Plugin مطلقاً.
    - `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
    - `browser.executablePath not found` → المسار المكوّن غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان CDP URL المكوّن مخططاً غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان CDP URL المكوّن على منفذ سيئ أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → تثبيت Gateway الحالي يفتقر إلى اعتماد وقت التشغيل `playwright-core` الخاص بـPlugin المتصفح المضمّن؛ شغّل `openclaw doctor --fix`، ثم أعد تشغيل Gateway. لا تزال لقطات ARIA ولقطات الشاشة الأساسية للصفحات قادرة على العمل، لكن التنقل ولقطات AI ولقطات عناصر محددات CSS وتصدير PDF ستظل غير متاحة.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → تعذّر على جلسة Chrome MCP الحالية الإرفاق بمجلد بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، وفعّل التصحيح عن بُعد، وأبقِ المتصفح مفتوحاً، ووافق على مطالبة الإرفاق الأولى، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المدار `openclaw`.
    - `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف إرفاق Chrome MCP على أي ألسنة Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المكوّنة من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يملك ملف التعريف المخصص للإرفاق فقط هدفاً قابلاً للوصول، أو أن نقطة نهاية HTTP أجابت لكن تعذّر فتح WebSocket الخاص بـCDP.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → مزج طلب لقطة الشاشة `--full-page` مع `--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطة الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس `--element` من CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات الرفع في Chrome MCP إلى مراجع اللقطات، لا إلى محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات مربع الحوار في ملفات تعريف Chrome MCP تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` لـ`act:type` على ملفات تعريف `profile="user"` / Chrome MCP `existing-session`، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` لـ`act:evaluate` على ملفات تعريف `profile="user"` / Chrome MCP `existing-session`، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحاً مداراً أو ملف تعريف CDP خاماً.
    - تجاوزات منفذ العرض / الوضع الداكن / اللغة المحلية / عدم الاتصال القديمة على ملفات تعريف الإرفاق فقط أو CDP البعيد → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP دون إعادة تشغيل Gateway بأكمله.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [المتصفح (بإدارة OpenClaw)](/ar/tools/browser)
- [استكشاف مشكلات المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا أجريت ترقية وتعطل شيء فجأة

تكون معظم الأعطال بعد الترقية ناتجة عن انحراف في الإعدادات أو تطبيق إعدادات افتراضية أكثر صرامة الآن.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما يجب التحقق منه:

    - إذا كان `gateway.mode=remote`، فقد تكون استدعاءات CLI تستهدف البعيد بينما خدمتك المحلية سليمة.
    - استدعاءات `--url` الصريحة لا تعود تلقائياً إلى بيانات الاعتماد المخزنة.

    التواقيع الشائعة:

    - `gateway connect failed:` → هدف URL خاطئ.
    - `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما يجب التحقق منه:

    - الارتباطات غير المعتمدة على local loopback (`lan`, `tailnet`, `custom`) تحتاج إلى مسار مصادقة Gateway صالح: مصادقة رمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير معتمد على local loopback ومكوّن بشكل صحيح.
    - المفاتيح القديمة مثل `gateway.token` لا تحل محل `gateway.auth.token`.

    التواقيع الشائعة:

    - `refusing to bind gateway ... without auth` → ارتباط غير معتمد على local loopback بدون مسار مصادقة Gateway صالح.
    - `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway حي لكنه غير قابل للوصول بالمصادقة/عنوان URL الحاليين.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما يجب التحقق منه:

    - موافقات الأجهزة المعلّقة للوحة التحكم/Nodes.
    - موافقات اقتران الرسائل المباشرة المعلّقة بعد تغييرات السياسة أو الهوية.

    التواقيع الشائعة:

    - `device identity required` → لم يتم استيفاء مصادقة الجهاز.
    - `pairing required` → يجب اعتماد المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا ظلت إعدادات الخدمة ووقت التشغيل غير متطابقين بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل ملف التعريف/الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذات صلة:

- [المصادقة](/ar/gateway/authentication)
- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الاقتران المملوك لـGateway](/ar/gateway/pairing)

## ذات صلة

- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
- [دليل تشغيل Gateway](/ar/gateway)
