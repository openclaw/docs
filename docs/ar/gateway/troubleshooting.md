---
read_when:
    - وجّهك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام مستقرة في دليل التشغيل تستند إلى الأعراض وتتضمن الأوامر الدقيقة
sidebarTitle: Troubleshooting
summary: دليل إجرائي متعمق لاستكشاف أخطاء Gateway والقنوات والأتمتة والعُقد والمتصفح وإصلاحها
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-07-16T14:22:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذا هو دليل التشغيل المتعمّق. ابدأ أولًا من [/help/troubleshooting](/ar/help/troubleshooting) لمسار الفرز السريع.

## تسلسل الأوامر

شغّل بالترتيب الآتي:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

مؤشرات الحالة السليمة:

- `openclaw gateway status` يعرض `Runtime: running` و`Connectivity probe: ok` وسطر `Capability: ...`.
- `openclaw doctor` لا يبلّغ عن أي مشكلات مانعة في الإعدادات أو الخدمة.
- `openclaw channels status --probe` يعرض حالة النقل المباشرة لكل حساب، وحيثما يكون ذلك مدعومًا، `works` أو `audit ok`.

## بعد التحديث

استخدم هذا عندما ينتهي التحديث لكن Gateway متوقف، أو تكون القنوات فارغة، أو تفشل استدعاءات النموذج بأخطاء 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

ابحث عن:

- `Update restart` في `openclaw status` / `openclaw status --all`. تتضمن عمليات التسليم المعلّقة أو الفاشلة الأمر التالي المطلوب تشغيله.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix` ضمن القنوات: لا يزال إعداد القناة موجودًا، لكن تسجيل Plugin فشل قبل أن تتمكن القناة من التحميل.
- أخطاء 401 من المزوّد بعد إعادة المصادقة: يتحقق `openclaw doctor --fix` من ظلال مصادقة OAuth القديمة الخاصة بكل وكيل ويزيل النسخ القديمة لكي تحل جميع الوكلاء ملف التعريف المشترك الحالي.

## عمليات التثبيت المنقسمة وحارس الإعدادات الأحدث

استخدم هذا عندما تتوقف خدمة Gateway بصورة غير متوقعة بعد تحديث، أو تُظهر السجلات أن أحد ملفات `openclaw` التنفيذية أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يضع OpenClaw ختمًا على عمليات كتابة الإعدادات باستخدام `meta.lastTouchedVersion`. يمكن للأوامر المخصصة للقراءة فقط فحص إعدادات كتبها إصدار أحدث من OpenClaw، لكن تغييرات العمليات والخدمات ترفض التنفيذ من ملف تنفيذي أقدم. تشمل الإجراءات المحظورة: بدء خدمة Gateway وإيقافها وإعادة تشغيلها وإلغاء تثبيتها، وإعادة تثبيت الخدمة إجباريًا، وتشغيل Gateway في وضع الخدمة، وتنظيف منفذ `gateway --force`.

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
  <Step title="إزالة الأغلفة القديمة">
    أزل إدخالات حزمة النظام القديمة أو الأغلفة القديمة التي لا تزال تشير إلى ملف `openclaw` تنفيذي قديم.
  </Step>
</Steps>

<Warning>
لخفض الإصدار المتعمّد أو الاسترداد الطارئ فقط، عيّن `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير معيّن في التشغيل العادي.
</Warning>

## عدم تطابق البروتوكول بعد التراجع

استخدم هذا عندما تستمر السجلات في طباعة `protocol mismatch` بعد خفض الإصدار أو التراجع. يعمل Gateway أقدم، لكن عملية عميل محلية أحدث لا تزال تعيد الاتصال بنطاق بروتوكول لا يستطيع Gateway الأقدم التعامل معه.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

ابحث عن:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` في سجلات Gateway.
- `Established clients:` في `openclaw gateway status --deep` أو `Gateway clients` في `openclaw doctor --deep`: عملاء TCP نشطون متصلون بمنفذ Gateway، مع معرّفات العمليات وأسطر الأوامر عندما يسمح نظام التشغيل بذلك.
- عملية عميل يشير سطر أوامرها إلى تثبيت OpenClaw الأحدث أو الغلاف الذي تراجعت عنه.

الإصلاح:

1. أوقف عملية عميل OpenClaw القديمة التي يعرضها `gateway status --deep` أو أعد تشغيلها.
2. أعد تشغيل التطبيقات أو الأغلفة التي تدمج OpenClaw: لوحات المعلومات المحلية، أو المحررات، أو أدوات خادم التطبيقات المساعدة، أو أغلفة `openclaw logs --follow` طويلة التشغيل.
3. أعد تشغيل `openclaw gateway status --deep` أو `openclaw doctor --deep` وتأكد من اختفاء معرّف عملية العميل القديم.

لا تجعل Gateway أقدم يقبل بروتوكولًا أحدث غير متوافق. تحمي ترقيات البروتوكول عقد الاتصال؛ واسترداد التراجع مشكلة تنظيف للعمليات والإصدارات.

## تخطي الرابط الرمزي لـ Skill باعتباره خروجًا من المسار

استخدم هذا عندما تتضمن السجلات:

```text
تخطي مسار Skill الخارج من جذره المُعدّ: ... reason=symlink-escape
```

يمثل كل جذر لـ Skill حدًا للاحتواء. يُتخطى الرابط الرمزي ضمن `~/.agents/skills` أو `<workspace>/.agents/skills` أو `<workspace>/skills` أو `~/.openclaw/skills` عندما يحل هدفه الحقيقي خارج ذلك الجذر، ما لم يكن الهدف موثوقًا به صراحةً.

افحص الرابط:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

إذا كان الهدف مقصودًا، فاضبط كلاً من جذر Skill المباشر وهدف الرابط الرمزي المسموح به:

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

ثم ابدأ جلسة جديدة أو انتظر حتى يحدّث مراقب Skills حالته. أعد تشغيل Gateway إذا كانت العملية الجارية تسبق تغيير الإعدادات.

لا تستخدم أهدافًا واسعة مثل `~` أو `/` أو مجلد مشروع متزامن بالكامل. أبقِ `allowSymlinkTargets` محصورًا في جذر Skill الحقيقي الذي يحتوي أدلة `SKILL.md` الموثوقة.

إذا كان ينبغي لتطبيق Skill Workshop أن يكتب أيضًا عبر مسارات Skills الموثوقة المرتبطة رمزيًا في مساحة العمل، ففعّل `skills.workshop.allowSymlinkTargetWrites`. أبقه معطّلًا لجذور Skills المشتركة المخصصة للقراءة فقط.

ذو صلة:

- [إعدادات Skills](/ar/tools/skills-config#symlinked-skill-roots)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples#symlinked-sibling-skill-repo)

## يتطلب خطأ Anthropic 429 استخدامًا إضافيًا للسياق الطويل

استخدم هذا عندما تتضمن السجلات أو الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- نموذج Anthropic المحدد هو نموذج Claude 4.x بسياق 1M يدعم التوافر العام (Opus 4.6/4.7/4.8، Sonnet 4.6)، أو لا تزال إعدادات النموذج تحمل `params.context1m: true` القديم.
- بيانات اعتماد Anthropic الحالية غير مؤهلة لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات الطويلة أو عمليات تشغيل النموذج التي تحتاج إلى مسار سياق 1M.

خيارات الإصلاح:

<Steps>
  <Step title="استخدام نافذة سياق قياسية">
    انتقل إلى نموذج بنافذة قياسية، أو أزل `context1m` القديم من إعدادات
    النماذج الأقدم التي لا تدعم التوافر العام لسياق 1M.
  </Step>
  <Step title="استخدام بيانات اعتماد مؤهلة">
    استخدم بيانات اعتماد Anthropic مؤهلة لطلبات السياق الطويل، أو انتقل إلى مفتاح API من Anthropic.
  </Step>
  <Step title="إعداد نماذج احتياطية">
    اضبط النماذج الاحتياطية لكي تستمر عمليات التشغيل عند رفض Anthropic لطلبات السياق الطويل.
  </Step>
</Steps>

ذو صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز المميزة وتكاليفها](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## استجابات 403 المحظورة من المصدر الأعلى

استخدم هذا عندما يعيد مزوّد LLM في المصدر الأعلى استجابة `403` عامة مثل `Your request was blocked`.

لا تفترض أن هذه دائمًا مشكلة في إعدادات OpenClaw. قد تأتي الاستجابة من طبقة أمان في المصدر الأعلى، مثل CDN أو WAF أو قاعدة لإدارة الروبوتات أو وكيل عكسي أمام نقطة نهاية متوافقة مع OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

ابحث عن:

- فشل عدة نماذج ضمن المزوّد نفسه بالطريقة ذاتها.
- نص HTML أو نص أمان عام بدلًا من خطأ API عادي من المزوّد.
- أحداث أمان من جانب المزوّد في وقت الطلب نفسه.
- نجاح اختبار `curl` مباشر وصغير، بينما تفشل الطلبات العادية المشكلة بأسلوب SDK.

أصلح التصفية من جانب المزوّد أولًا عندما تشير الأدلة إلى حظر من WAF/CDN. يُفضّل استخدام قاعدة سماح أو تخطٍ محدودة النطاق لمسار API الذي يستخدمه OpenClaw، وتجنب تعطيل الحماية للموقع بأكمله.

<Warning>
لا يضمن نجاح `curl` بسيط أن الطلبات الحقيقية بأسلوب SDK ستجتاز طبقة الأمان نفسها في المصدر الأعلى.
</Warning>

ذو صلة:

- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)
- [إعداد المزوّد](/ar/providers)
- [السجلات](/ar/logging)

## يجتاز الجزء الخلفي المحلي المتوافق مع OpenAI الاختبارات المباشرة لكن تفشل عمليات الوكيل

استخدم هذا عندما:

- يعمل `curl ... /v1/models`.
- تعمل استدعاءات `/v1/chat/completions` المباشرة الصغيرة.
- تفشل عمليات تشغيل نموذج OpenClaw فقط في أدوار الوكيل العادية.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"مرحبًا"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "مرحبًا" --json
openclaw logs --follow
```

ابحث عن:

- نجاح الاستدعاءات المباشرة الصغيرة، لكن عمليات OpenClaw لا تفشل إلا مع المطالبات الأكبر.
- أخطاء `model_not_found` أو 404 رغم أن `/v1/chat/completions` المباشر يعمل بمعرّف النموذج المجرد نفسه.
- أخطاء من الجزء الخلفي تفيد بأن `messages[].content` يتوقع سلسلة نصية.
- تحذيرات `incomplete turn detected ... stopReason=stop payloads=0` متقطعة مع جزء خلفي محلي متوافق مع OpenAI.
- أعطال الجزء الخلفي التي لا تظهر إلا مع أعداد أكبر من رموز المطالبة أو مطالبات وقت تشغيل الوكيل الكاملة.

<AccordionGroup>
  <Accordion title="العلامات الشائعة">
    - `model_not_found` مع خادم محلي بأسلوب MLX/vLLM: تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` يساوي `"openai-completions"` للأجزاء الخلفية من نوع `/v1/chat/completions`، وأن `models.providers.<provider>.models[].id` هو المعرّف المحلي المجرد لدى المزوّد. حدده ببادئة المزوّد مرة واحدة، مثل `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبقِ إدخال الكتالوج على هيئة `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string`: يرفض الجزء الخلفي أجزاء محتوى Chat Completions المنظمة. الإصلاح: عيّن `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` أو مفاتيح الرسائل المسموح بها مثل `["role","content"]`: يرفض الجزء الخلفي بيانات تعريف إعادة التشغيل بأسلوب OpenAI في رسائل Chat Completions. الإصلاح: عيّن `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0`: أكمل الجزء الخلفي طلب Chat Completions لكنه لم يُرجع أي نص من المساعد مرئي للمستخدم في ذلك الدور. يعيد OpenClaw محاولة الأدوار الفارغة المتوافقة مع OpenAI والآمنة لإعادة التشغيل مرة واحدة؛ وتعني حالات الفشل المستمرة عادةً أن الجزء الخلفي يصدر محتوى فارغًا أو غير نصي، أو يمنع نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن عمليات وكيل OpenClaw تفشل مع أعطال في الجزء الخلفي أو النموذج (مثل Gemma في بعض إصدارات `inferrs`): من المرجح أن نقل OpenClaw صحيح بالفعل؛ فالجزء الخلفي يفشل مع بنية مطالبة وقت تشغيل الوكيل الأكبر.
    - تتراجع حالات الفشل بعد تعطيل الأدوات لكنها لا تختفي: كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية لا تزال في سعة النموذج أو الخادم في المصدر الأعلى، أو في خلل بالجزء الخلفي.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. عيّن `compat.requiresStringContent: true` للأجزاء الخلفية لـ Chat Completions التي تقبل السلاسل النصية فقط.
    2. عيّن `compat.strictMessageKeys: true` للأجزاء الخلفية الصارمة لـ Chat Completions التي لا تقبل سوى `role` و`content` في كل رسالة.
    3. عيّن `compat.supportsTools: false` للنماذج أو الأجزاء الخلفية التي لا تستطيع التعامل بصورة موثوقة مع سطح مخطط أدوات OpenClaw.
    4. قلّل ضغط المطالبة حيثما أمكن: تمهيد أصغر لمساحة العمل، أو سجل جلسة أقصر، أو نموذج محلي أخف، أو جزء خلفي بدعم أقوى للسياق الطويل.
    5. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما لا تزال أدوار وكيل OpenClaw تتعطل داخل الجزء الخلفي، فتعامل مع ذلك باعتباره قيدًا في خادم أو نموذج المصدر الأعلى، وقدّم هناك حالة إعادة إنتاج تتضمن بنية الحمولة المقبولة.
  </Accordion>
</AccordionGroup>

ذو صلة:

- [الإعداد](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

## لا توجد ردود

إذا كانت القنوات تعمل ولكن لا يصل أي رد، فتحقق من التوجيه والسياسة قبل إعادة توصيل أي شيء.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

ابحث عن:

- اقتران معلّق لمرسلي الرسائل المباشرة.
- تقييد الإشارات في المجموعات (`requireMention`، `mentionPatterns`).
- حالات عدم التطابق في قوائم السماح للقنوات/المجموعات.

الأنماط الشائعة:

- `drop guild message (mention required` ← تُتجاهل رسالة المجموعة حتى حدوث إشارة.
- `pairing request` ← يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` ← تمت تصفية المرسل/القناة بواسطة السياسة.

مواضيع ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [المجموعات](/ar/channels/groups)
- [الاقتران](/ar/channels/pairing)

## اتصال واجهة التحكم في لوحة المعلومات

عندما يتعذر اتصال لوحة المعلومات/واجهة التحكم، تحقق من عنوان URL ووضع المصادقة وافتراضات السياق الآمن.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

ابحث عن:

- عنوان URL الصحيح للفحص وعنوان URL الصحيح للوحة المعلومات.
- عدم تطابق وضع المصادقة/الرمز المميز بين العميل وGateway.
- استخدام HTTP عندما تكون هوية الجهاز مطلوبة.

إذا تعذر على متصفح محلي الاتصال بـ `127.0.0.1:18789` بعد تحديث، فاستعد أولًا خدمة Gateway المحلية وتأكد من أنها تعرض لوحة المعلومات:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

إذا أعاد `curl` محتوى HTML الخاص بـ OpenClaw، فهذا يعني أن Gateway يعمل، وعلى الأرجح أن المشكلة المتبقية هي ذاكرة التخزين المؤقت للمتصفح أو رابط عميق قديم أو حالة علامة تبويب قديمة. افتح `http://127.0.0.1:18789` مباشرة وانتقل من لوحة المعلومات. إذا لم تظل الخدمة قيد التشغيل بعد إعادة التشغيل، فنفّذ `openclaw gateway start` وأعد التحقق من `openclaw gateway status`.

<AccordionGroup>
  <Accordion title="أنماط الاتصال / المصادقة">
    - `device identity required` ← سياق غير آمن أو مصادقة الجهاز مفقودة.
    - `origin not allowed` ← قيمة `Origin` في المتصفح غير موجودة في `gateway.controlUi.allowedOrigins` (أو يجري الاتصال من أصل متصفح غير استرجاعي دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` ← لا يُكمل العميل تدفق مصادقة الجهاز القائم على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` ← وقّع العميل الحمولة الخطأ (أو استخدم طابعًا زمنيًا قديمًا) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` ← يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام الرمز المميز المخزّن مؤقتًا للجهاز.
    - تعيد محاولة الرمز المميز المخزّن مؤقتًا استخدام مجموعة النطاقات المخزنة مع رمز الجهاز المقترن. أما المستدعون الذين يستخدمون `deviceToken` صراحةً / `scopes` صراحةً فيحتفظون بمجموعة النطاقات المطلوبة لديهم.
    - `AUTH_SCOPE_MISMATCH` ← تم التعرّف على رمز الجهاز، لكن نطاقاته المعتمدة لا تغطي طلب الاتصال هذا؛ أعد الاقتران أو وافق على عقد النطاق المطلوب بدلًا من تدوير رمز Gateway مشترك.
    - خارج مسار إعادة المحاولة هذا، تكون أسبقية مصادقة الاتصال: الرمز المشترك/كلمة المرور الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزّن، ثم رمز التمهيد.
    - في مسار واجهة التحكم غير المتزامن لخدمة Tailscale Serve، تُنفّذ المحاولات الفاشلة للقيمة نفسها من `{scope, ip}` تسلسليًا قبل أن يسجل محدِّد المعدل الفشل. لذلك قد تُظهر محاولتا إعادة متزامنتان سيئتان من العميل نفسه `retry later` في المحاولة الثانية بدلًا من حالتي عدم تطابق عاديتين.
    - `too many failed authentication attempts (retry later)` من عميل استرجاعي ذي أصل متصفح ← تُحظر مؤقتًا حالات الفشل المتكررة من القيمة الموحّدة نفسها لـ `Origin`؛ ويستخدم أصل localhost آخر حاوية منفصلة.
    - تكرار `unauthorized` بعد إعادة المحاولة تلك ← انحراف بين الرمز المشترك ورمز الجهاز؛ حدّث إعداد الرمز وأعد اعتماد/تدوير رمز الجهاز عند الحاجة.
    - `gateway connect failed:` ← هدف مضيف/منفذ/عنوان URL غير صحيح.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لرموز تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| رمز التفاصيل                  | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                 | الصق/عيّن الرمز في العميل وأعد المحاولة. لمسارات لوحة المعلومات: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات واجهة التحكم.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | لم يتطابق الرمز المشترك مع رمز مصادقة Gateway.                                                                                                                                               | إذا كان `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزّن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ ويحتفظ المستدعون الذين يستخدمون `deviceToken` / `scopes` صراحةً بالنطاقات المطلوبة. إذا استمر الفشل، فنفّذ [قائمة التحقق من استعادة انحراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | الرمز المخزّن مؤقتًا لكل جهاز قديم أو ملغى.                                                                                                                                                 | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI للأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | رمز الجهاز صالح، لكن دوره/نطاقاته المعتمدة لا تغطي طلب الاتصال هذا.                                                                                                       | أعد إقران الجهاز أو وافق على عقد النطاق المطلوب؛ لا تتعامل مع هذا باعتباره انحرافًا في الرمز المشترك.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقق من `error.details.reason` بحثًا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند توفرهما. | وافق على الطلب المعلّق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                               |

<Note>
ينبغي ألا تعتمد استدعاءات RPC المباشرة للواجهة الخلفية عبر الاسترجاع، والمصادق عليها باستخدام رمز Gateway المشترك/كلمة المرور، على خط أساس نطاقات الأجهزة المقترنة في CLI. إذا استمر فشل الوكلاء الفرعيين أو الاستدعاءات الداخلية الأخرى مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"`، ولا يفرض `deviceIdentity` صريحًا أو رمز جهاز.
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
    ينتظر العميل `connect.challenge` الصادر عن Gateway.
  </Step>
  <Step title="وقّع الحمولة">
    يوقّع العميل الحمولة المرتبطة بالتحدي.
  </Step>
  <Step title="أرسل nonce الجهاز">
    يرسل العميل `connect.params.device.nonce` باستخدام nonce التحدي نفسه.
  </Step>
</Steps>

إذا رُفض `openclaw devices rotate` / `revoke` / `remove` على نحو غير متوقع:

- لا يمكن لجلسات رموز الأجهزة المقترنة إدارة سوى الجهاز **الخاص بها** ما لم يكن لدى المستدعي أيضًا `operator.admin`.
- لا يمكن لـ `openclaw devices rotate --scope ...` طلب سوى نطاقات المشغّل التي تحتفظ بها جلسة المستدعي بالفعل.

مواضيع ذات صلة:

- [الإعداد](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
- [واجهة التحكم](/ar/web/control-ui)
- [الأجهزة](/ar/cli/devices)
- [الوصول عن بُعد](/ar/gateway/remote)
- [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)

## خدمة Gateway لا تعمل

استخدم هذا عندما تكون الخدمة مثبّتة، لكن العملية لا تظل قيد التشغيل.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # افحص أيضًا الخدمات على مستوى النظام
```

ابحث عن:

- `Runtime: stopped` مع تلميحات الخروج.
- عدم تطابق إعداد الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات إضافية لـ launchd/systemd/schtasks عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="الأنماط الشائعة">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` ← وضع Gateway المحلي غير مفعّل، أو تمت الكتابة فوق ملف الإعداد وفُقد `gateway.mode`. الحل: عيّن `gateway.mode="local"` في إعدادك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة تثبيت إعداد الوضع المحلي المتوقع. إذا كنت تشغّل OpenClaw عبر Podman، فمسار الإعداد الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` ← ربط غير استرجاعي من دون مسار مصادقة صالح لـ Gateway (رمز/كلمة مرور، أو وكيل موثوق حيث يكون مُعدًا).
    - `another gateway instance is already listening` / `EADDRINUSE` ← تعارض في المنفذ.
    - `Other gateway-like services detected (best effort)` ← توجد وحدات launchd/systemd/schtasks قديمة أو متوازية. ينبغي لمعظم عمليات الإعداد الاحتفاظ بـ Gateway واحد لكل جهاز؛ وإذا احتجت إلى أكثر من واحد، فاعزل المنافذ + الإعداد/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor ← توجد وحدة نظام systemd بينما خدمة مستوى المستخدم مفقودة. أزل النسخة المكررة أو عطّلها قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` ← لا يزال المشرف المثبّت يثبّت القيمة القديمة لـ `--port`. نفّذ `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

مواضيع ذات صلة:

- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [الإعداد](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## يتوقف Gateway في macOS بصمت عن الاستجابة، ثم يستأنفها عند التفاعل مع لوحة المعلومات

استخدم هذا عندما تصمت القنوات (Telegram وWhatsApp وما إلى ذلك) على مضيف macOS لمدة تتراوح من دقائق إلى ساعات في كل مرة، ويبدو أن Gateway يعود إلى العمل لحظة فتح واجهة التحكم، أو الاتصال عبر SSH، أو التفاعل مع المضيف بأي طريقة أخرى. لا توجد عادةً أعراض واضحة في `openclaw status` لأن Gateway يكون قد عاد إلى العمل بحلول وقت التحقق منه.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

ابحث عن:

- حزمة واحدة أو أكثر من حزم `*-uncaught_exception.json` في `~/.openclaw/logs/stability/` مع ضبط `error.code` على رمز شبكة عابر مثل `ENETDOWN` أو `ENETUNREACH` أو `EHOSTUNREACH` أو `ECONNREFUSED`.
- أسطر `pmset -g log` مثل `Entering Sleep state due to 'Maintenance Sleep'` أو `en0 driver is slow (msg: WillChangeState to 0)` متزامنة مع الطوابع الزمنية للأعطال. يؤدي Power Nap / Maintenance Sleep لفترة وجيزة إلى وضع برنامج تشغيل Wi-Fi في الحالة 0؛ ويمكن أن يفشل أي `connect()` صادر يقع ضمن تلك النافذة مع `ENETDOWN` حتى على مضيف يتمتع بخلاف ذلك باتصال كامل بالشبكة.
- مخرجات `launchctl print` التي تعرض `state = not running` مع عدة `runs` حديثة ورمز خروج، خصوصًا عندما تكون الفجوة بين العطل والتشغيل التالي في حدود ساعة بدلًا من ثوانٍ. يطبق launchd في macOS بوابة غير موثقة للحماية من إعادة التشغيل بعد سلسلة من الأعطال، وقد تتوقف عن احترام `KeepAlive=true` إلى أن يعيد مُشغّل خارجي تفعيلها، مثل تسجيل الدخول التفاعلي أو اتصال لوحة المعلومات أو `launchctl kickstart`.

الأنماط الشائعة:

- حزمة استقرار تكون فيها `error.code` هي `ENETDOWN` أو رمزًا مماثلًا، مع توجيه مكدس الاستدعاءات إلى Node `net` `lookupAndConnect` / `Socket.connect`. يصنّف OpenClaw `2026.5.26` والإصدارات الأحدث هذه الأخطاء على أنها أخطاء شبكة عابرة غير ضارة، ولذلك لم تعد تنتقل إلى معالج الاستثناءات غير الملتقطة ذي المستوى الأعلى؛ إذا كان الإصدار المستخدم أقدم، فقم بالترقية أولًا.
- فترات صمت طويلة تنتهي لحظة الاتصال بواجهة التحكم أو الاتصال بالمضيف عبر SSH: نشاط المستخدم المرئي هو ما يعيد تفعيل بوابة إعادة التشغيل في launchd، وليس أي إجراء تنفذه لوحة المعلومات على Gateway.
- تزايد عدد `runs` على مدار اليوم دون وجود سطر `received SIG*; shutting down` مقابل في `~/Library/Logs/openclaw/gateway.log`: تسجل عمليات إيقاف التشغيل السليمة إشارة؛ أما الأعطال العابرة فلا تفعل ذلك.

ما يجب فعله:

1. **رقِّ Gateway** إذا كنت تستخدم إصدارًا يسبق `2026.5.26`. بعد الترقية، ستُسجّل أخطاء `ENETDOWN` المستقبلية على هيئة تحذيرات بدلًا من إنهاء العملية.
2. **قلّل نشاط سكون الصيانة** على مضيفات Mac mini / سطح المكتب المخصصة للعمل كخوادم دائمة التشغيل:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   يقلل هذا بدرجة كبيرة من تقلب برنامج التشغيل الأساسي، لكنه لا يزيله بالكامل. قد يظل النظام ينفذ بعض عمليات سكون الصيانة للحفاظ على اتصال TCP وصيانة mDNS بغض النظر عن هذه العلامات.

3. **أضف مراقبًا للحيوية** حتى تُكتشف بسرعة أي سلسلة أعطال مستقبلية يوقفها launchd:

   ```bash
   # مثال لفحص الحيوية المدرك لـ launchd، مناسب لمهمة cron أو LaunchAgent تعمل كل 5 دقائق
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   الهدف هو إعادة تفعيل بوابة إعادة التشغيل خارجيًا؛ لا يكفي `KeepAlive=true` وحده على macOS بعد سلسلة من الأعطال.

موضوعات ذات صلة:

- [ملاحظات منصة macOS](/ar/platforms/macos)
- [التسجيل](/ar/logging)
- [Doctor](/ar/gateway/doctor)

## حلقة مشرف launchd في macOS مع وحدات LaunchAgent مكررة لـ Gateway/node

استخدم هذا عندما تستمر عملية تثبيت على macOS في إعادة التشغيل كل بضع ثوانٍ، وتتقلب فحوصات صحة `openclaw`
بين حالة سليمة وغير متاحة، ويتوقف إرسال القنوات
على الرغم من أن الخدمة تبدو قيد التشغيل.

لوحظ هذا في عمليات التثبيت القديمة حيث كان كل من `ai.openclaw.gateway` و
`ai.openclaw.node` من وحدات LaunchAgent نشطًا، وكان كل منهما يحقن
`OPENCLAW_LAUNCHD_LABEL`. في هذه الحالة، يمكن لـ OpenClaw اكتشاف إشراف launchd
ومحاولة إعادة تسليم مسؤولية إعادة التشغيل إلى launchd، ثم الوقوع في حلقة سريعة من
`EADDRINUSE`/إعادة التشغيل بدلًا من تشغيل عملية Gateway مستقرة واحدة.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

ابحث عن:

- أكثر من معرّف PID واحد لـ Gateway خلال العينة التي مدتها 30 ثانية بدلًا من عملية
  مستقرة واحدة.
- `EADDRINUSE` أو `another gateway instance is already listening` أو أسطر
  متكررة لإعادة التشغيل/التسليم في `gateway.log`.
- تحميل كل من `~/Library/LaunchAgents/ai.openclaw.gateway.plist` و
  `~/Library/LaunchAgents/ai.openclaw.node.plist` في الوقت نفسه على
  مضيف يُفترض أن يشغّل خدمة Gateway مُدارة واحدة فقط.

ما يجب فعله:

1. إذا كان يُفترض أن يشغّل هذا المضيف خدمة Gateway فقط، فأزل خدمة node
   المُدارة من خلال OpenClaw. **تخطَّ هذه الخطوة** إذا كنت تعتمد فعليًا على خدمة node
   لميزات node البعيدة؛ إذ يؤدي إلغاء تثبيتها إلى إيقاف تلك الميزات على
   هذا المضيف:

   ```bash
   openclaw node uninstall
   ```

2. ثبّت غلافًا دائمًا لـ Gateway يمسح علامات launchd
   الموروثة قبل بدء OpenClaw. استخدم خيار `--wrapper` المدعوم؛
   ولا تعدّل الملف المُنشأ ضمن `~/.openclaw/service-env/`، لأن إعادة تثبيت الخدمة
   والتحديث وإصلاح Doctor تعيد إنشاء ذلك الملف:

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   يحافظ `gateway install` على مسار الغلاف عبر عمليات إعادة التثبيت الإجبارية
   والتحديثات وإصلاحات Doctor.

3. تحقق من أن Gateway مستقر ويخدم RPC، وليس مجرد الاستماع:

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   يجب أن تعرض عينة PID عملية مستقرة واحدة بدلًا من مجموعة متبدلة من
   معرّفات PID، ويجب أن يُستأنف إرسال القنوات الواردة.

4. بعد الترقية إلى إصدار أُصلحت فيه حلقة LaunchAgent المزدوجة
   الأساسية، أزل الحل البديل وأعد تثبيت الخدمة المُدارة العادية:

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

موضوعات ذات صلة:

- [ملاحظات منصة macOS](/ar/platforms/mac/bundled-gateway)
- [Doctor](/ar/gateway/doctor)
- [واجهة CLI لـ Gateway](/ar/cli/gateway)

## خروج Gateway أثناء الاستخدام المرتفع للذاكرة

استخدم هذا عندما يختفي Gateway تحت الحمل، أو يُبلغ المشرف عن إعادة تشغيل على نمط OOM، أو تشير السجلات إلى `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

ابحث عن:

- `Reason: diagnostic.memory.pressure.critical` في أحدث حزمة استقرار.
- `Memory pressure:` مع `critical/rss_threshold` أو `critical/heap_threshold` أو `critical/rss_growth`.
- قيم `V8 heap:` قريبة من حد الكومة.
- إدخالات `Largest session files:` مثل `agents/<agent>/sessions/<session>.jsonl` أو `sessions/<session>.jsonl`.
- عدادات ذاكرة cgroup في Linux عندما يعمل Gateway داخل حاوية أو خدمة محدودة الذاكرة.

الأنماط الشائعة:

- يظهر `critical memory pressure bundle written` قبل إعادة التشغيل بوقت قصير ← التقط OpenClaw حزمة استقرار قبل OOM. افحصها باستخدام `openclaw gateway stability --bundle latest`.
- يظهر `memory pressure: level=critical ... memoryPressureSnapshot=disabled` في سجلات Gateway ← اكتشف OpenClaw ضغطًا حرجًا على الذاكرة، لكن لقطة الاستقرار قبل OOM معطلة.
- يشير `Largest session files:` إلى مسار نص جلسة منقّح كبير جدًا ← قلّل سجل الجلسة المحتفظ به، أو افحص نمو الجلسة، أو انقل النصوص القديمة خارج المخزن النشط قبل إعادة التشغيل.
- البايتات المستخدمة في `V8 heap:` قريبة من حد الكومة ← خفّض ضغط المطالبات/الجلسات، أو قلّل العمل المتزامن، أو ارفع حد كومة Node فقط بعد التأكد من أن عبء العمل متوقع.
- `Memory pressure: critical/rss_growth` ← نمت الذاكرة بسرعة ضمن نافذة أخذ عينات واحدة. افحص أحدث السجلات بحثًا عن عملية استيراد كبيرة، أو مخرجات أدوات منفلتة، أو محاولات متكررة، أو دفعة من أعمال الوكلاء الموضوعة في قائمة الانتظار.
- يظهر ضغط حرج على الذاكرة في السجلات لكن لا توجد حزمة ← هذا هو الإعداد الافتراضي. اضبط `diagnostics.memoryPressureSnapshot: true` لالتقاط حزمة الاستقرار قبل OOM عند أحداث ضغط الذاكرة الحرج المستقبلية.

حزمة الاستقرار خالية من الحمولة. وهي تتضمن أدلة تشغيلية عن الذاكرة ومسارات ملفات نسبية منقّحة، لا نصوص الرسائل أو أجسام Webhook أو بيانات الاعتماد أو الرموز المميزة أو ملفات تعريف الارتباط أو معرّفات الجلسات الأولية. أرفق تصدير التشخيصات بتقارير الأخطاء بدلًا من نسخ السجلات الأولية.

موضوعات ذات صلة:

- [صحة Gateway](/ar/gateway/health)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [الجلسات](/ar/cli/sessions)

## رفض Gateway إعدادًا غير صالح

استخدم هذا عندما يفشل بدء تشغيل Gateway مع `Invalid config` أو عندما تشير سجلات إعادة التحميل الفوري إلى تخطي تعديل غير صالح.

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
- ملف `openclaw.json.rejected.*` مزوّد بطابع زمني بجوار الإعداد النشط.
- ملف `openclaw.json.clobbered.*` مزوّد بطابع زمني إذا أصلح `doctor --fix` تعديلًا مباشرًا معطوبًا.
- يحتفظ OpenClaw بأحدث 32 ملفًا من ملفات `.clobbered.*` لكل مسار إعداد ويدوّر الملفات الأقدم.

<AccordionGroup>
  <Accordion title="ما الذي حدث">
    - لم يجتز الإعداد التحقق أثناء بدء التشغيل أو إعادة التحميل الفوري أو عملية كتابة يملكها OpenClaw.
    - يفشل بدء تشغيل Gateway في وضع مغلق بدلًا من إعادة كتابة `openclaw.json`.
    - تتخطى إعادة التحميل الفوري التعديلات الخارجية غير الصالحة وتُبقي إعداد وقت التشغيل الحالي نشطًا.
    - ترفض عمليات الكتابة التي يملكها OpenClaw الحمولات غير الصالحة/الهدامة قبل الالتزام وتحفظ `.rejected.*`.
    - يتولى `openclaw doctor --fix` الإصلاح. ويمكنه إزالة البادئات غير التابعة لـ JSON أو استعادة آخر نسخة سليمة معروفة مع الاحتفاظ بالحمولة المرفوضة باسم `.clobbered.*`.
    - عند حدوث إصلاحات كثيرة لمسار إعداد واحد، يدوّر OpenClaw ملفات `.clobbered.*` الأقدم حتى تظل أحدث حمولة تم إصلاحها متاحة.

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
  <Accordion title="العلامات الشائعة">
    - `.clobbered.*` موجود → احتفظ doctor بتعديل خارجي معطّل أثناء إصلاح الإعداد النشط.
    - `.rejected.*` موجود → فشلت عملية كتابة إعداد مملوكة لـ OpenClaw في فحوصات المخطط أو الاستبدال قبل الإيداع.
    - `Config write rejected:` → حاولت عملية الكتابة إسقاط البنية المطلوبة، أو تقليص الملف بشدة، أو حفظ إعداد غير صالح.
    - `config reload skipped (invalid config):` → فشل التحقق من صحة تعديل مباشر وتجاهله Gateway قيد التشغيل.
    - `Invalid config at ...` → فشل بدء التشغيل قبل تشغيل خدمات Gateway.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` → رُفضت عملية كتابة مملوكة لـ OpenClaw لأنها فقدت حقولًا أو حجمًا مقارنةً بآخر نسخة احتياطية سليمة معروفة.
    - `Config last-known-good promotion skipped` → احتوى الإعداد المرشح على عناصر نائبة لأسرار منقّحة مثل `***`.

  </Accordion>
  <Accordion title="خيارات الإصلاح">
    1. شغّل `openclaw doctor --fix` للسماح لـ doctor بإصلاح الإعداد ذي البادئة أو المستبدَل، أو استعادة آخر إعداد سليم معروف.
    2. انسخ المفاتيح المقصودة فقط من `.clobbered.*` أو `.rejected.*`، ثم طبّقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا عدّلت يدويًا، فاحتفظ بإعداد JSON5 كاملًا، وليس فقط بالكائن الجزئي الذي أردت تغييره.
  </Accordion>
</AccordionGroup>

مواضيع ذات صلة:

- [الإعداد](/ar/cli/config)
- [الإعداد: إعادة التحميل الفورية](/ar/gateway/configuration#config-hot-reload)
- [الإعداد: التحقق الصارم](/ar/gateway/configuration#strict-validation)
- [Doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه يظل يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و`primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير متعلقًا بالرجوع إلى SSH، أو تعدد بوابات Gateway، أو النطاقات المفقودة، أو مراجع المصادقة غير المحلولة.

العلامات الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر ظل يحاول الاتصال بالأهداف المباشرة المضبوطة أو أهداف الاسترجاع الحلقي.
- `multiple reachable gateway identities detected` → استجابت بوابات Gateway مختلفة، أو تعذّر على OpenClaw إثبات أن الأهداف التي يمكن الوصول إليها هي Gateway نفسها. يُعامل نفق SSH أو عنوان URL للوكيل أو عنوان URL بعيد مضبوط يؤدي إلى Gateway نفسها باعتباره Gateway واحدة ذات وسائل نقل متعددة، حتى عندما تختلف منافذ النقل.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلي مقيّد بالنطاق؛ أقرن هوية الجهاز أو استخدم بيانات اعتماد تتضمن `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → نجح الاتصال، لكن انتهت مهلة مجموعة RPC التشخيصية الكاملة أو فشلت. تعامل مع هذا بوصفه Gateway يمكن الوصول إليها لكن تشخيصاتها متدهورة؛ قارن `connect.ok` و`connect.rpcOk` في مخرجات `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → استجابت Gateway، لكن هذا العميل لا يزال يحتاج إلى الإقران أو الموافقة قبل وصول المشغّل المعتاد.
- نص تحذير SecretRef غير المحلول لـ `gateway.auth.*` / `gateway.remote.*` → لم تكن مواد المصادقة متاحة في مسار الأمر هذا للهدف الذي فشل.

مواضيع ذات صلة:

- [Gateway](/ar/cli/gateway)
- [بوابات Gateway متعددة على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول عن بُعد](/ar/gateway/remote)

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

- سياسة الرسائل المباشرة (`pairing` و`allowlist` و`open` و`disabled`).
- قائمة السماح للمجموعات ومتطلبات الإشارة.
- أذونات أو نطاقات API المفقودة للقناة.

العلامات الشائعة:

- `mention required` → جرى تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- `pairing` / آثار الموافقة المعلّقة → المرسِل غير معتمد.
- `missing_scope` و`not_in_channel` و`Forbidden` و`401/403` → مشكلة في مصادقة القناة أو أذوناتها.

مواضيع ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron وHeartbeat

إذا لم يعمل Cron أو Heartbeat أو لم يسلّم، فتحقق أولًا من حالة المجدول، ثم من هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تمكين Cron ووجود وقت التنبيه التالي.
- حالة سجل تشغيل المهمة (`ok` و`skipped` و`error`).
- أسباب تخطي Heartbeat (`quiet-hours` و`requests-in-flight` و`cron-in-progress` و`lanes-busy` و`alerts-disabled` و`empty-heartbeat-file` و`no-tasks-due`).

<AccordionGroup>
  <Accordion title="العلامات الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron معطّل.
    - `cron: timer tick failed` → فشلت نبضة المجدول؛ تحقق من أخطاء الملف أو السجل أو بيئة التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة الساعات النشطة.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → يوجد `HEARTBEAT.md` لكنه لا يحتوي إلا على بنية أولية فارغة، أو تعليق، أو عنوان، أو سياج، أو قائمة تحقق فارغة، لذلك يتخطى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا يحين موعد أي من المهام في هذه النبضة.
    - `heartbeat: unknown accountId` → معرّف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تحوّل هدف Heartbeat إلى وجهة بنمط الرسائل المباشرة بينما ضُبط `agents.defaults.heartbeat.directPolicy` (أو التجاوز الخاص بالوكيل) على `block`.

  </Accordion>
</AccordionGroup>

مواضيع ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

## Node مقترنة لكن الأداة تفشل

إذا كانت Node مقترنة لكن الأدوات تفشل، فاعزل حالة الواجهة الأمامية والأذونات والموافقة.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

ابحث عن:

- اتصال Node بالإنترنت مع الإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا والميكروفون والموقع والشاشة.
- موافقات التنفيذ وحالة قائمة السماح.

العلامات الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلّقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → الأمر محظور بواسطة قائمة السماح.

مواضيع ذات صلة:

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
- [عُقد Node](/ar/nodes/index)

## أداة المتصفح تفشل

استخدم هذا عندما تفشل إجراءات أداة المتصفح رغم سلامة Gateway نفسها.

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
- توفر Chrome محليًا لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="علامات Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` → يستبعد `plugins.allow` Plugin المتصفح المضمّن.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` القيمة `browser`، لذلك لم يُحمّل Plugin مطلقًا.
    - `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
    - `browser.executablePath not found` → المسار المضبوط غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان URL المضبوط لـ CDP مخططًا غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان URL المضبوط لـ CDP على منفذ غير صالح أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → يفتقر تثبيت Gateway الحالي إلى تبعية بيئة تشغيل المتصفح الأساسية؛ أعد تثبيت OpenClaw أو حدّثه، ثم أعد تشغيل Gateway. يمكن أن تظل لقطات ARIA ولقطات الصفحة الأساسية تعمل، لكن يبقى التنقل ولقطات الذكاء الاصطناعي ولقطات العناصر باستخدام محددات CSS وتصدير PDF غير متاحة.

  </Accordion>
  <Accordion title="علامات Chrome MCP / الجلسة الحالية">
    - `Could not find DevToolsActivePort for chrome` → لم تتمكن جلسة Chrome MCP الحالية بعد من الاتصال بدليل بيانات المتصفح المحدد. افتح صفحة فحص المتصفح، وفعّل تصحيح الأخطاء عن بُعد، وأبقِ المتصفح مفتوحًا، ووافق على أول مطالبة اتصال، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
    - `No browser tabs found for profile="user"` → لا يحتوي ملف تعريف اتصال Chrome MCP على علامات تبويب Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المضبوطة من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف التعريف المخصص للاتصال فقط على هدف يمكن الوصول إليه، أو استجابت نقطة نهاية HTTP لكن تعذّر فتح WebSocket الخاص بـ CDP.

  </Accordion>
  <Accordion title="علامات العنصر / لقطة الشاشة / الرفع">
    - `fullPage is not supported for element screenshots` → مزج طلب لقطة الشاشة `--full-page` مع `--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات الشاشة في Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس `--element` في CSS.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات الرفع في Chrome MCP إلى مراجع اللقطات، لا محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل عملية رفع واحدة لكل استدعاء في ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات مربعات الحوار في ملفات تعريف Chrome MCP تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:type` في ملفات تعريف `profile="user"` / جلسة Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مُدارًا أو CDP عندما تكون مهلة مخصصة مطلوبة.
    - `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
    - تجاوزات قديمة لإطار العرض أو الوضع الداكن أو الإعدادات المحلية أو وضع عدم الاتصال في ملفات التعريف المخصصة للاتصال فقط أو ملفات تعريف CDP البعيدة → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP من دون إعادة تشغيل Gateway بأكملها.

  </Accordion>
</AccordionGroup>

مواضيع ذات صلة:

- [المتصفح (تديره OpenClaw)](/ar/tools/browser)
- [استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا أجريت ترقية وتعطّل شيء فجأة

تنتج معظم الأعطال بعد الترقية عن انحراف الإعداد أو بدء فرض إعدادات افتراضية أكثر صرامة.

<AccordionGroup>
  <Accordion title="1. تغيّر سلوك المصادقة وتجاوز عنوان URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما يجب التحقق منه:

    - إذا كان `gateway.mode=remote`، فقد تستهدف استدعاءات CLI جهة بعيدة بينما تعمل خدمتك المحلية بصورة سليمة.
    - لا تعود استدعاءات `--url` الصريحة إلى بيانات الاعتماد المخزنة كخيار احتياطي.

    الدلالات الشائعة:

    - `gateway connect failed:` ← عنوان URL المستهدف غير صحيح.
    - `unauthorized` ← نقطة النهاية قابلة للوصول، لكن المصادقة غير صحيحة.

  </Accordion>
  <Accordion title="2. أصبحت ضوابط الربط والمصادقة أكثر صرامة">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    ما يجب التحقق منه:

    - تتطلب عمليات الربط بواجهات غير استرجاعية (`lan`، `tailnet`، `custom`) مسار مصادقة صالحًا لـ Gateway: مصادقة برمز مميز/كلمة مرور مشتركة، أو نشر `trusted-proxy` غير استرجاعي ومهيأ بصورة صحيحة.
    - لا تحل المفاتيح القديمة مثل `gateway.token` محل `gateway.auth.token`.

    الدلالات الشائعة:

    - `refusing to bind gateway ... without auth` ← ربط بواجهة غير استرجاعية من دون مسار مصادقة صالح لـ Gateway.
    - `Connectivity probe: failed` أثناء تشغيل وقت التشغيل ← Gateway يعمل، لكن لا يمكن الوصول إليه باستخدام المصادقة/عنوان URL الحاليين.

  </Accordion>
  <Accordion title="3. تغيّرت حالة الاقتران وهوية الجهاز">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما يجب التحقق منه:

    - موافقات الأجهزة المعلّقة للوحة المعلومات/العُقد.
    - موافقات اقتران الرسائل المباشرة المعلّقة بعد تغييرات السياسة أو الهوية.

    الدلالات الشائعة:

    - `device identity required` ← لم تُستوفَ مصادقة الجهاز.
    - `pairing required` ← يجب اعتماد المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا ظل إعداد الخدمة ووقت التشغيل غير متوافقين بعد عمليات التحقق، فأعد تثبيت بيانات الخدمة الوصفية من دليل الملف الشخصي/الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

موضوعات ذات صلة:

- [المصادقة](/ar/gateway/authentication)
- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [اقتران Node](/ar/gateway/pairing)

## موضوعات ذات صلة

- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
- [دليل تشغيل Gateway](/ar/gateway)
