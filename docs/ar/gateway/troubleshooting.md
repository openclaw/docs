---
read_when:
    - أحالك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام ثابتة في دليل التشغيل تستند إلى الأعراض وتتضمن أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل إجراءات معمّق لاستكشاف الأخطاء وإصلاحها لـ Gateway والقنوات والأتمتة والعُقد والمتصفح
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-05-11T20:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذه الصفحة هي دليل التشغيل التفصيلي. ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد مسار الفرز السريع أولًا.

## سلم الأوامر

شغّل هذه أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

إشارات السلامة المتوقعة:

- يعرض `openclaw gateway status` كلًا من `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- يبلغ `openclaw doctor` عن عدم وجود مشكلات إعدادات/خدمة مانعة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وحيثما يكون ذلك مدعومًا، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## تثبيتات الدماغ المنقسم وحارس الإعدادات الأحدث

استخدم هذا عندما تتوقف خدمة Gateway بشكل غير متوقع بعد تحديث، أو تُظهر السجلات أن ثنائية `openclaw` أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يختم OpenClaw عمليات كتابة الإعدادات باستخدام `meta.lastTouchedVersion`. لا تزال الأوامر للقراءة فقط قادرة على فحص إعدادات كتبها OpenClaw أحدث، لكن تعديلات العملية والخدمة ترفض المتابعة من ثنائية أقدم. تشمل الإجراءات المحظورة بدء خدمة Gateway وإيقافها وإعادة تشغيلها وإلغاء تثبيتها، وإعادة تثبيت الخدمة قسرًا، وتشغيل Gateway في وضع الخدمة، وتنظيف المنفذ باستخدام `gateway --force`.

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
    أزل حزمة النظام القديمة أو إدخالات الغلاف القديمة التي لا تزال تشير إلى ثنائية `openclaw` قديمة.
  </Step>
</Steps>

<Warning>
لخفض الإصدار المتعمد أو الاسترداد الطارئ فقط، اضبط `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير مضبوط في التشغيل العادي.
</Warning>

## تخطي رابط Skill الرمزي باعتباره خروجًا من المسار

استخدم هذا عندما تتضمن السجلات:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

يعامل OpenClaw كل جذر Skills كحد احتواء. يتم تخطي الرابط الرمزي ضمن
`~/.agents/skills` أو `<workspace>/.agents/skills` أو `<workspace>/skills` أو
`~/.openclaw/skills` عندما يُحل هدفه الحقيقي خارج ذلك الجذر
ما لم يكن الهدف موثوقًا به صراحة.

افحص الرابط:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

إذا كان الهدف مقصودًا، فاضبط كلًا من جذر Skill المباشر وهدف الرابط الرمزي
المسموح به:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

ثم ابدأ جلسة جديدة أو انتظر محدّث Skills حتى ينعشها. أعد تشغيل
Gateway إذا كانت العملية الجارية أسبق من تغيير الإعدادات.

لا تستخدم أهدافًا واسعة مثل `~` أو `/` أو مجلد مشروع كامل متزامن.
أبقِ `allowSymlinkTargets` محدودًا بجذر Skill الحقيقي الذي يحتوي على أدلة
`SKILL.md` موثوقة.

ذو صلة:

- [إعدادات Skills](/ar/tools/skills-config#symlinked-sibling-repos)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples#symlinked-sibling-skill-repo)

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
- تفشل الطلبات فقط في الجلسات الطويلة/تشغيلات النماذج التي تحتاج مسار 1M التجريبي.

خيارات الإصلاح:

<Steps>
  <Step title="Disable context1m">
    عطّل `context1m` لذلك النموذج للرجوع إلى نافذة السياق العادية.
  </Step>
  <Step title="Use an eligible credential">
    استخدم اعتماد Anthropic مؤهلًا لطلبات السياق الطويل، أو انتقل إلى مفتاح Anthropic API.
  </Step>
  <Step title="Configure fallback models">
    اضبط نماذج احتياطية حتى تستمر التشغيلات عندما تُرفض طلبات Anthropic ذات السياق الطويل.
  </Step>
</Steps>

ذو صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز المميزة والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ينجح Backend محلي متوافق مع OpenAI في الفحوصات المباشرة لكن تشغيلات الوكيل تفشل

استخدم هذا عندما:

- يعمل `curl ... /v1/models`
- تعمل استدعاءات `/v1/chat/completions` المباشرة الصغيرة
- تفشل تشغيلات نماذج OpenClaw فقط في أدوار الوكيل العادية

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
- أخطاء Backend بشأن توقّع أن يكون `messages[].content` سلسلة نصية
- تحذيرات `incomplete turn detected ... stopReason=stop payloads=0` متقطعة مع Backend محلي متوافق مع OpenAI
- أعطال Backend تظهر فقط مع أعداد رموز مطالبة أكبر أو مطالبات وقت تشغيل الوكيل الكاملة

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` مع خادم محلي بنمط MLX/vLLM → تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` هي `"openai-completions"` لواجهات Backend الخاصة بـ `/v1/chat/completions`، وأن `models.providers.<provider>.models[].id` هو المعرّف المحلي المجرد لدى المزوّد. حدده مع بادئة المزوّد مرة واحدة، مثلًا `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبقِ إدخال الفهرس كـ `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → يرفض Backend أجزاء محتوى Chat Completions المهيكلة. الإصلاح: اضبط `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` أو مفاتيح الرسائل المسموحة مثل `["role","content"]` → يرفض Backend بيانات التعريف الخاصة بإعادة التشغيل بنمط OpenAI في رسائل Chat Completions. الإصلاح: اضبط `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → أكمل Backend طلب Chat Completions لكنه لم يُرجع نص مساعد مرئيًا للمستخدم لذلك الدور. يعيد OpenClaw محاولة الأدوار الفارغة المتوافقة مع OpenAI والآمنة لإعادة التشغيل مرة واحدة؛ تعني الإخفاقات المستمرة عادة أن Backend يصدر محتوى فارغًا/غير نصي أو يحجب نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكيل OpenClaw تفشل مع أعطال Backend/النموذج (مثل Gemma على بعض بنى `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ وBackend يفشل على شكل مطالبة وقت تشغيل الوكيل الأكبر.
    - تتقلص الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج/الخادم upstream أو عيب في Backend.

  </Accordion>
  <Accordion title="Fix options">
    1. اضبط `compat.requiresStringContent: true` لواجهات Backend الخاصة بـ Chat Completions التي تقبل السلاسل فقط.
    2. اضبط `compat.strictMessageKeys: true` لواجهات Backend الصارمة الخاصة بـ Chat Completions التي لا تقبل إلا `role` و`content` في كل رسالة.
    3. اضبط `compat.supportsTools: false` للنماذج/واجهات Backend التي لا تستطيع التعامل مع سطح مخطط أدوات OpenClaw بشكل موثوق.
    4. خفّض ضغط المطالبة حيثما أمكن: تمهيد مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو Backend بدعم أقوى للسياق الطويل.
    5. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما لا تزال أدوار وكيل OpenClaw تتعطل داخل Backend، فتعامل معها كقيد في الخادم/النموذج upstream وافتح إعادة إنتاج هناك مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذو صلة:

- [الإعدادات](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط نهاية متوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل لكن لا يجيب شيء، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلّق لمرسلي الرسائل المباشرة.
- بوابة إشارات المجموعات (`requireMention`، `mentionPatterns`).
- عدم تطابق قوائم السماح للقناة/المجموعة.

تواقيع شائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة حتى وجود إشارة.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة حسب السياسة.

ذو صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [المجموعات](/ar/channels/groups)
- [الاقتران](/ar/channels/pairing)

## اتصال واجهة تحكم لوحة المعلومات

عندما لا تتصل لوحة المعلومات/واجهة التحكم، تحقق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان URL صحيح للفحص وعنوان URL صحيح للوحة المعلومات.
- عدم تطابق وضع/رمز المصادقة بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
    - `origin not allowed` → قيمة `Origin` في المتصفح ليست ضمن `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير loopback من دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` → لا يكمل العميل مسار مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → وقّع العميل الحمولة الخطأ (أو طابعًا زمنيًا قديمًا) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء محاولة موثوقة واحدة باستخدام رمز الجهاز المخزن مؤقتًا.
    - تعيد محاولة الرمز المخزن مؤقتًا هذه استخدام مجموعة النطاقات المخزنة مؤقتًا مع رمز الجهاز المقترن. أما مستدعو `deviceToken` الصريح / `scopes` الصريح فيحتفظون بمجموعة النطاقات التي طلبوها.
    - `AUTH_SCOPE_MISMATCH` → تم التعرف على رمز الجهاز، لكن نطاقاته المعتمدة لا تغطي طلب الاتصال هذا؛ أعد الاقتران أو وافق على عقد النطاق المطلوب بدل تدوير رمز Gateway مشترك.
    - خارج مسار إعادة المحاولة هذا، تكون أسبقية مصادقة الاتصال: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز التمهيد.
    - في مسار واجهة تحكم Tailscale Serve غير المتزامن، تُسلسل المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل محدد المعدل الفشل. لذلك يمكن لمحاولتي إعادة سيئتين متزامنتين من العميل نفسه أن تُظهرا `retry later` في المحاولة الثانية بدل عدم تطابق عاديين.
    - `too many failed authentication attempts (retry later)` من عميل loopback منشؤه المتصفح → تؤدي الإخفاقات المتكررة من قيمة `Origin` المعيّرة نفسها إلى قفل مؤقت؛ يستخدم أصل localhost آخر دلوًا منفصلًا.
    - تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف الرمز المشترك/رمز الجهاز؛ حدّث إعدادات الرمز وأعد الموافقة/تدوير رمز الجهاز عند الحاجة.
    - `gateway connect failed:` → هدف مضيف/منفذ/عنوان URL غير صحيح.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                 | المعنى                                                                                                                                                                                       | الإجراء الموصى به                                                                                                                                                                                                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل الرمز المشترك المطلوب.                                                                                                                                                       | الصق/اضبط الرمز في العميل ثم أعد المحاولة. لمسارات لوحة التحكم: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات واجهة Control UI.                                                                                                                                             |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                                  | إذا كانت `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزن مؤقتا استخدام النطاقات المعتمدة المخزنة؛ ويحتفظ مستدعو `deviceToken` / `scopes` الصريحون بالنطاقات المطلوبة. إذا استمر الفشل، فشغل [قائمة تحقق استرداد انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | الرمز المخزن مؤقتا لكل جهاز قديم أو مُلغى.                                                                                                                                                  | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI للأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                           |
| `AUTH_SCOPE_MISMATCH`        | رمز الجهاز صالح، لكن دوره/نطاقاته المعتمدة لا تغطي طلب الاتصال هذا.                                                                                                                        | أعد إقران الجهاز أو اعتمد عقد النطاق المطلوب؛ لا تتعامل مع هذا على أنه انحراف في الرمز المشترك.                                                                                                                                                                                            |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى اعتماد. افحص `error.details.reason` بحثا عن `not-paired`، أو `scope-upgrade`، أو `role-upgrade`، أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | اعتمد الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                                                   |

<Note>
يجب ألا تعتمد استدعاءات RPC الخلفية المباشرة عبر الواجهة الحلقية، والمصادق عليها برمز/كلمة مرور Gateway المشتركين، على خط أساس نطاق الجهاز المقترن الخاص بـ CLI. إذا ظلت الوكلاء الفرعيون أو الاستدعاءات الداخلية الأخرى تفشل مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"` ولا يفرض `deviceIdentity` صريحة أو رمز جهاز.
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

- يمكن لجلسات رمز الجهاز المقترن إدارة جهازها **الخاص فقط** ما لم يكن لدى المستدعي أيضا `operator.admin`
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات المشغل إلا إذا كانت جلسة المستدعي تملكها بالفعل

ذو صلة:

- [الإعدادات](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [واجهة Control UI](/ar/web/control-ui)
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
- عدم تطابق إعدادات الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → وضع Gateway المحلي غير مُمكّن، أو أن ملف الإعدادات استُبدل وفقد `gateway.mode`. الإصلاح: اضبط `gateway.mode="local"` في إعداداتك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم إعدادات الوضع المحلي المتوقعة. إذا كنت تشغل OpenClaw عبر Podman، فمسار الإعدادات الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → ربط غير حلقي من دون مسار مصادقة Gateway صالح (رمز/كلمة مرور، أو وكيل موثوق حيث يكون مهيأ).
    - `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
    - `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. يجب أن تحتفظ معظم الإعدادات بـ Gateway واحد لكل جهاز؛ وإذا كنت تحتاج فعلا إلى أكثر من واحد، فاعزل المنافذ + الإعدادات/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor → توجد وحدة نظام systemd بينما خدمة مستوى المستخدم مفقودة. أزل النسخة المكررة أو عطّلها قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو اضبط `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` → لا يزال المشرف المثبت يثبت `--port` القديم. شغّل `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

ذو صلة:

- [التنفيذ الخلفي وأداة العمليات](/ar/gateway/background-process)
- [الإعدادات](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## رفض Gateway إعدادات غير صالحة

استخدم هذا عندما يفشل بدء Gateway مع `Invalid config` أو عندما تقول سجلات إعادة التحميل الساخن
إنها تخطت تعديلا غير صالح.

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
- ملف `openclaw.json.rejected.*` مختوم زمنيا بجانب الإعدادات النشطة
- ملف `openclaw.json.clobbered.*` مختوم زمنيا إذا أصلح `doctor --fix` تعديلا مباشرا معطلا

<AccordionGroup>
  <Accordion title="ما الذي حدث">
    - لم تجتز الإعدادات التحقق أثناء بدء التشغيل، أو إعادة التحميل الساخن، أو كتابة يملكها OpenClaw.
    - يفشل بدء Gateway مغلقا بدلا من إعادة كتابة `openclaw.json`.
    - تتخطى إعادة التحميل الساخن التعديلات الخارجية غير الصالحة وتبقي إعدادات وقت التشغيل الحالية نشطة.
    - ترفض الكتابات التي يملكها OpenClaw الحمولات غير الصالحة/التدميرية قبل الالتزام وتحفظ `.rejected.*`.
    - يملك `openclaw doctor --fix` الإصلاح. يمكنه إزالة البادئات غير JSON أو استعادة آخر نسخة سليمة معروفة مع الحفاظ على الحمولة المرفوضة باسم `.clobbered.*`.

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
  <Accordion title="التواقيع الشائعة">
    - وجود `.clobbered.*` → احتفظ doctor بتعديل خارجي معطل أثناء إصلاح الإعدادات النشطة.
    - وجود `.rejected.*` → فشلت كتابة إعدادات يملكها OpenClaw في فحوصات المخطط أو الاستبدال قبل الالتزام.
    - `Config write rejected:` → حاولت الكتابة إسقاط البنية المطلوبة، أو تقليص الملف بشدة، أو حفظ إعدادات غير صالحة.
    - `config reload skipped (invalid config):` → فشل تعديل مباشر في التحقق وتجاهله Gateway العامل.
    - `Invalid config at ...` → فشل بدء التشغيل قبل إقلاع خدمات Gateway.
    - `missing-meta-vs-last-good`، أو `gateway-mode-missing-vs-last-good`، أو `size-drop-vs-last-good:*` → رُفضت كتابة يملكها OpenClaw لأنها فقدت حقولا أو حجما مقارنة بآخر نسخة احتياطية سليمة معروفة.
    - `Config last-known-good promotion skipped` → احتوى المرشح على عناصر نائبة منقحة للأسرار مثل `***`.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. شغّل `openclaw doctor --fix` للسماح لـ doctor بإصلاح الإعدادات ذات البادئات/المستبدلة أو استعادة آخر نسخة سليمة معروفة.
    2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا عدلت يدويا، فاحتفظ بإعدادات JSON5 كاملة، لا بالكائن الجزئي الذي أردت تغييره فقط.
  </Accordion>
</AccordionGroup>

ذو صلة:

- [Config](/ar/cli/config)
- [الإعدادات: إعادة التحميل الساخن](/ar/gateway/configuration#config-hot-reload)
- [الإعدادات: التحقق الصارم](/ar/gateway/configuration#strict-validation)
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
- ما إذا كان التحذير يتعلق بالرجوع إلى SSH، أو تعدد Gateways، أو نقص النطاقات، أو مراجع مصادقة غير محلولة.

التواقيع الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر ظل يحاول الأهداف المباشرة المهيأة/الحلقية.
- `multiple reachable gateways detected` → أجاب أكثر من هدف واحد. يعني هذا عادة إعداد Gateways متعددة مقصودا أو مستمعين قدامى/مكررين.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلي محدود النطاق؛ أقرن هوية الجهاز أو استخدم بيانات اعتماد مع `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → نجح الاتصال، لكن مجموعة RPC التشخيصية الكاملة انتهت مهلتها أو فشلت. تعامل مع هذا باعتباره Gateway قابلا للوصول مع تشخيصات متدهورة؛ قارن `connect.ok` و`connect.rpcOk` في مخرجات `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → أجاب Gateway، لكن هذا العميل لا يزال يحتاج إلى الإقران/الاعتماد قبل وصول المشغل العادي.
- نص تحذير SecretRef غير محلول لـ `gateway.auth.*` / `gateway.remote.*` → لم تكن مادة المصادقة متاحة في مسار الأمر هذا للهدف الفاشل.

ذو صلة:

- [Gateway](/ar/cli/gateway)
- [بوابات متعددة على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
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

توقيعات شائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- `pairing` / آثار موافقة معلّقة → المرسل غير معتمد.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشكلة في مصادقة/أذونات القناة.

ذات صلة:

- [استكشاف مشكلات القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron وHeartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يسلّم، فتحقق من حالة المجدول أولاً، ثم هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تمكين Cron ووجود موعد الإيقاظ التالي.
- حالة سجل تشغيل المهمة (`ok`، `skipped`، `error`).
- أسباب تخطي Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="التوقيعات الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron معطل.
    - `cron: timer tick failed` → فشل نبض مؤقت المجدول؛ تحقق من أخطاء الملفات/السجلات/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة ساعات النشاط.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → الملف `HEARTBEAT.md` موجود لكنه يحتوي فقط على أسطر فارغة / عناوين Markdown، لذلك يتخطى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهمة مستحقة في هذا النبض.
    - `heartbeat: unknown accountId` → معرف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة بأسلوب الرسائل المباشرة بينما `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) مضبوط على `block`.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## Node مقترن، لكن الأداة تفشل

إذا كان Node مقترناً لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- Node متصل مع القدرات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات التنفيذ وحالة قائمة السماح.

توقيعات شائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام التشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلّقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → الأمر محظور بواسطة قائمة السماح.

ذات صلة:

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [استكشاف مشكلات Node وإصلاحها](/ar/nodes/troubleshooting)
- [Nodes](/ar/nodes/index)

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

- ما إذا كان `plugins.allow` مضبوطاً ويتضمن `browser`.
- مسار تنفيذي صالح للمتصفح.
- قابلية الوصول إلى ملف تعريف CDP.
- توفر Chrome محلياً لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="توقيعات Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` → Plugin المتصفح المضمّن مستبعد بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` القيمة `browser`، لذلك لم يتم تحميل Plugin مطلقاً.
    - `Failed to start Chrome CDP on port` → فشلت عملية المتصفح في التشغيل.
    - `browser.executablePath not found` → المسار المكوّن غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان URL المكوّن لـ CDP مخططاً غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان URL المكوّن لـ CDP على منفذ سيئ أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → تثبيت Gateway الحالي يفتقر إلى تبعية وقت تشغيل المتصفح الأساسية؛ أعد تثبيت OpenClaw أو حدّثه، ثم أعد تشغيل Gateway. لا يزال بإمكان لقطات ARIA ولقطات الصفحة الأساسية العمل، لكن التنقل ولقطات AI ولقطات عناصر محددات CSS وتصدير PDF تبقى غير متاحة.

  </Accordion>
  <Accordion title="توقيعات Chrome MCP / الجلسة الموجودة">
    - `Could not find DevToolsActivePort for chrome` → تعذر على الجلسة الموجودة في Chrome MCP الإرفاق بدليل بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، وفعّل التصحيح عن بُعد، وأبقِ المتصفح مفتوحاً، ووافق على مطالبة الإرفاق الأولى، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المدار `openclaw`.
    - `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف الإرفاق في Chrome MCP على علامات تبويب Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → نقطة نهاية CDP البعيدة المكوّنة غير قابلة للوصول من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف التعريف الخاص بالإرفاق فقط على هدف قابل للوصول، أو أن نقطة نهاية HTTP أجابت لكن تعذر فتح CDP WebSocket مع ذلك.

  </Accordion>
  <Accordion title="توقيعات العنصر / لقطة الشاشة / الرفع">
    - `fullPage is not supported for element screenshots` → خلط طلب لقطة الشاشة بين `--full-page` و`--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس `--element` بنمط CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات الرفع في Chrome MCP إلى مراجع لقطات، وليس محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → خطافات الحوارات على ملفات تعريف Chrome MCP لا تدعم تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:type` على ملفات تعريف `profile="user"` / الجلسات الموجودة في Chrome MCP، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` لـ `act:evaluate` على ملفات تعريف `profile="user"` / الجلسات الموجودة في Chrome MCP، أو استخدم ملف تعريف متصفح مدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحاً مداراً أو ملف تعريف CDP خاماً.
    - تجاوزات قديمة لمنفذ العرض / الوضع الداكن / اللغة المحلية / عدم الاتصال على ملفات تعريف الإرفاق فقط أو CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP دون إعادة تشغيل Gateway بالكامل.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [المتصفح (مدار بواسطة OpenClaw)](/ar/tools/browser)
- [استكشاف مشكلات المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا أجريت ترقية وتعطّل شيء فجأة

معظم أعطال ما بعد الترقية تكون بسبب انحراف في الإعدادات أو إعدادات افتراضية أكثر صرامة يجري فرضها الآن.

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
    - استدعاءات `--url` الصريحة لا تعود إلى بيانات الاعتماد المخزنة.

    توقيعات شائعة:

    - `gateway connect failed:` → هدف URL خاطئ.
    - `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

  </Accordion>
  <Accordion title="2. حواجز الربط والمصادقة أكثر صرامة">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما يجب التحقق منه:

    - عمليات الربط غير local loopback (`lan`، `tailnet`، `custom`) تحتاج إلى مسار مصادقة Gateway صالح: مصادقة رمز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير local loopback ومكوّن بشكل صحيح.
    - المفاتيح القديمة مثل `gateway.token` لا تحل محل `gateway.auth.token`.

    توقيعات شائعة:

    - `refusing to bind gateway ... without auth` → ربط غير local loopback دون مسار مصادقة Gateway صالح.
    - `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway حي لكنه غير قابل للوصول بالمصادقة/عنوان URL الحاليين.

  </Accordion>
  <Accordion title="3. تغيّرت حالة الاقتران وهوية الجهاز">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما يجب التحقق منه:

    - موافقات أجهزة معلّقة للوحة التحكم/العُقد.
    - موافقات اقتران رسائل مباشرة معلّقة بعد تغييرات السياسة أو الهوية.

    توقيعات شائعة:

    - `device identity required` → لم تُستوفَ مصادقة الجهاز.
    - `pairing required` → يجب اعتماد المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا استمر عدم توافق إعدادات الخدمة ووقت التشغيل بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من دليل ملف التعريف/الحالة نفسه:

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
