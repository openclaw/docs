---
read_when:
    - وجّهك مركز استكشاف الأخطاء وإصلاحها إلى هنا لإجراء تشخيص أعمق
    - تحتاج إلى أقسام دليل تشغيل مستقرة قائمة على الأعراض مع أوامر دقيقة
sidebarTitle: Troubleshooting
summary: دليل تشغيل تفصيلي لاستكشاف أخطاء Gateway والقنوات والأتمتة والعُقد والمتصفح وإصلاحها
title: استكشاف الأخطاء وإصلاحها
x-i18n:
    generated_at: "2026-06-27T17:44:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

هذه الصفحة هي دليل التشغيل التفصيلي. ابدأ من [/help/troubleshooting](/ar/help/troubleshooting) إذا كنت تريد مسار الفرز السريع أولًا.

## تسلسل الأوامر

شغّل هذه أولًا، بهذا الترتيب:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

المؤشرات السليمة المتوقعة:

- يعرض `openclaw gateway status` السطر `Runtime: running`، و`Connectivity probe: ok`، وسطر `Capability: ...`.
- يبلّغ `openclaw doctor` عن عدم وجود مشكلات إعدادات/خدمات حاجبة.
- يعرض `openclaw channels status --probe` حالة النقل الحية لكل حساب، وحيثما يكون ذلك مدعومًا، نتائج الفحص/التدقيق مثل `works` أو `audit ok`.

## بعد التحديث

استخدم هذا عندما يكتمل تحديث لكن يكون Gateway متوقفًا، أو تكون القنوات فارغة، أو
تبدأ استدعاءات النموذج بالفشل مع أخطاء 401.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

ابحث عن:

- `Update restart` في `openclaw status` / `openclaw status --all`. تتضمن عمليات التسليم المعلّقة أو
  الفاشلة الأمر التالي الذي يجب تشغيله.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  ضمن القنوات. يعني ذلك أن إعدادات القناة ما زالت موجودة، لكن تسجيل Plugin
  فشل قبل أن تتمكن القناة من التحميل.
- أخطاء 401 من المزوّد بعد إعادة المصادقة. يفحص `openclaw doctor --fix` ظلال مصادقة OAuth
  القديمة لكل وكيل ويزيل النسخ القديمة لكي تحل جميع الوكلاء إلى
  الملف الشخصي المشترك الحالي.

## عمليات التثبيت منقسمة الحالة وحارس الإعدادات الأحدث

استخدم هذا عندما تتوقف خدمة Gateway بشكل غير متوقع بعد تحديث، أو عندما تعرض السجلات أن ثنائية `openclaw` أقدم من الإصدار الذي كتب `openclaw.json` آخر مرة.

يختم OpenClaw عمليات كتابة الإعدادات بـ `meta.lastTouchedVersion`. لا تزال الأوامر للقراءة فقط قادرة على فحص إعدادات كتبها OpenClaw أحدث، لكن تعديلات العملية والخدمة ترفض المتابعة من ثنائية أقدم. تشمل الإجراءات المحظورة بدء خدمة Gateway، وإيقافها، وإعادة تشغيلها، وإلغاء تثبيتها، وإعادة تثبيت الخدمة قسرًا، وبدء Gateway في وضع الخدمة، وتنظيف المنفذ عبر `gateway --force`.

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
    أزل حزمة النظام القديمة أو إدخالات الغلاف القديمة التي لا تزال تشير إلى ثنائية `openclaw` قديمة.
  </Step>
</Steps>

<Warning>
لخفض الإصدار المقصود أو الاسترداد الطارئ فقط، عيّن `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` للأمر الواحد. اتركه غير معيّن للتشغيل العادي.
</Warning>

## عدم تطابق البروتوكول بعد الرجوع

استخدم هذا عندما تواصل السجلات طباعة `protocol mismatch` بعد خفض إصدار OpenClaw أو الرجوع عنه. يعني ذلك أن Gateway أقدم يعمل، لكن عملية عميل محلية أحدث لا تزال تحاول إعادة الاتصال بنطاق بروتوكول لا يستطيع Gateway الأقدم التحدث به.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

ابحث عن:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` في سجلات Gateway.
- `Established clients:` في `openclaw gateway status --deep` أو `Gateway clients` في `openclaw doctor --deep`. يسرد هذا عملاء TCP النشطين المتصلين بمنفذ Gateway، بما في ذلك PIDs وأسطر الأوامر عندما يسمح نظام التشغيل بذلك.
- عملية عميل يشير سطر أوامرها إلى تثبيت OpenClaw الأحدث أو الغلاف الذي رجعت عنه.

الإصلاح:

1. أوقف أو أعد تشغيل عملية عميل OpenClaw القديمة المعروضة بواسطة `gateway status --deep`.
2. أعد تشغيل التطبيقات أو الأغلفة التي تضمّن OpenClaw، مثل لوحات المعلومات المحلية، والمحررات، ومساعدات خوادم التطبيقات، أو أصداف `openclaw logs --follow` طويلة التشغيل.
3. أعد تشغيل `openclaw gateway status --deep` أو `openclaw doctor --deep` وتأكد من اختفاء PID العميل القديم.

لا تجعل Gateway أقدم يقبل بروتوكولًا أحدث غير متوافق. تحمي زيادات البروتوكول عقد السلك؛ استرداد الرجوع مشكلة تنظيف عمليات/إصدارات.

## تخطي الرابط الرمزي لـ Skills باعتباره خروجًا عن المسار

استخدم هذا عندما تتضمن السجلات:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

يتعامل OpenClaw مع كل جذر Skills كحد احتواء. يُتخطى رابط رمزي ضمن
`~/.agents/skills`، أو `<workspace>/.agents/skills`، أو `<workspace>/skills`، أو
`~/.openclaw/skills` عندما يحل هدفه الحقيقي إلى خارج ذلك الجذر
ما لم يكن الهدف موثوقًا به صراحة.

افحص الرابط:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

إذا كان الهدف مقصودًا، فاضبط كلًا من جذر Skills المباشر وهدف الرابط الرمزي
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

ثم ابدأ جلسة جديدة أو انتظر حتى يحدّث مراقب Skills. أعد تشغيل
Gateway إذا كانت العملية الجارية أقدم من تغيير الإعدادات.

لا تستخدم أهدافًا واسعة مثل `~`، أو `/`، أو مجلد مشروع متزامن كامل.
أبقِ `allowSymlinkTargets` محصورًا بجذر Skills الحقيقي الذي يحتوي على أدلة
`SKILL.md` الموثوقة.

إذا كان يجب أن يكتب تطبيق Skill Workshop أيضًا عبر مسارات Skills لمساحة العمل المرتبطة رمزيًا
والموثوقة هذه، ففعّل `skills.workshop.allowSymlinkTargetWrites`. أبقه
معطلًا لجذور Skills المشتركة للقراءة فقط.

ذات صلة:

- [إعدادات Skills](/ar/tools/skills-config#symlinked-skill-roots)
- [أمثلة الإعدادات](/ar/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429 يتطلب استخدامًا إضافيًا للسياق الطويل

استخدم هذا عندما تتضمن السجلات/الأخطاء: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

ابحث عن:

- النموذج المحدد من Anthropic هو نموذج Claude 4.x بقدرة 1M ومتاح عمومًا، أو أن النموذج لديه `params.context1m: true` قديم.
- اعتماد Anthropic الحالي غير مؤهل لاستخدام السياق الطويل.
- تفشل الطلبات فقط في الجلسات/تشغيلات النماذج الطويلة التي تحتاج إلى مسار سياق 1M.

خيارات الإصلاح:

<Steps>
  <Step title="Use a standard context window">
    بدّل إلى نموذج بنافذة سياق قياسية، أو أزل `context1m` القديم من إعدادات
    نموذج أقدم ليس متاحًا عمومًا لسياق 1M.
  </Step>
  <Step title="Use an eligible credential">
    استخدم اعتماد Anthropic مؤهلًا لطلبات السياق الطويل، أو بدّل إلى مفتاح Anthropic API.
  </Step>
  <Step title="Configure fallback models">
    اضبط نماذج احتياطية لكي تستمر التشغيلات عندما تُرفض طلبات Anthropic للسياق الطويل.
  </Step>
</Steps>

ذات صلة:

- [Anthropic](/ar/providers/anthropic)
- [استخدام الرموز والتكاليف](/ar/reference/token-use)
- [لماذا أرى HTTP 429 من Anthropic؟](/ar/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## ردود 403 محظورة من المنبع

استخدم هذا عندما يعيد مزوّد LLM من المنبع خطأ `403` عامًا مثل
`Your request was blocked`.

لا تفترض أن هذه مشكلة إعدادات OpenClaw دائمًا. يمكن أن يأتي الرد
من طبقة أمان في المنبع مثل CDN، أو WAF، أو قاعدة إدارة روبوتات، أو
وكيل عكسي أمام نقطة نهاية متوافقة مع OpenAI.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

ابحث عن:

- عدة نماذج ضمن المزوّد نفسه تفشل بالطريقة نفسها
- HTML أو نص أمان عام بدلًا من خطأ API عادي من المزوّد
- أحداث أمان من جهة المزوّد في وقت الطلب نفسه
- نجاح فحص `curl` مباشر صغير بينما تفشل الطلبات العادية ذات شكل SDK

أصلح التصفية من جهة المزوّد أولًا عندما تشير الأدلة إلى حظر WAF/CDN.
فضّل قاعدة سماح أو تخطٍ محدودة النطاق لمسار API الذي يستخدمه OpenClaw،
وتجنب تعطيل الحماية للموقع كله.

<Warning>
نجاح `curl` بسيط وحده لا يضمن أن الطلبات الحقيقية بأسلوب SDK ستمر
عبر طبقة الأمان نفسها في المنبع.
</Warning>

ذات صلة:

- [نقاط النهاية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)
- [إعدادات المزوّد](/ar/providers)
- [السجلات](/ar/logging)

## الواجهة الخلفية المحلية المتوافقة مع OpenAI تجتاز الفحوصات المباشرة لكن تشغيلات الوكيل تفشل

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

- نجاح الاستدعاءات المباشرة الصغيرة، لكن فشل تشغيلات OpenClaw فقط مع المطالبات الأكبر
- أخطاء `model_not_found` أو 404 رغم أن `/v1/chat/completions` المباشر
  يعمل بمعرّف النموذج المجرّد نفسه
- أخطاء الواجهة الخلفية حول توقع أن يكون `messages[].content` سلسلة نصية
- تحذيرات `incomplete turn detected ... stopReason=stop payloads=0` متقطعة مع واجهة خلفية محلية متوافقة مع OpenAI
- انهيارات الواجهة الخلفية التي تظهر فقط مع أعداد رموز مطالبات أكبر أو مطالبات وقت تشغيل الوكيل الكاملة

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` مع خادم محلي بأسلوب MLX/vLLM → تحقق من أن `baseUrl` يتضمن `/v1`، وأن `api` هو `"openai-completions"` لواجهات `/v1/chat/completions` الخلفية، وأن `models.providers.<provider>.models[].id` هو المعرّف المحلي المجرّد لدى المزوّد. حدده مع بادئة المزوّد مرة واحدة، مثل `mlx/mlx-community/Qwen3-30B-A3B-6bit`؛ وأبقِ إدخال الفهرس على `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → ترفض الواجهة الخلفية أجزاء محتوى Chat Completions المنظمة. الإصلاح: عيّن `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` أو مفاتيح الرسائل المسموح بها مثل `["role","content"]` → ترفض الواجهة الخلفية بيانات تعريف إعادة التشغيل بأسلوب OpenAI في رسائل Chat Completions. الإصلاح: عيّن `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → أكملت الواجهة الخلفية طلب Chat Completions لكنها لم تُعد نص مساعد مرئيًا للمستخدم لذلك الدور. يعيد OpenClaw محاولة الأدوار الفارغة المتوافقة مع OpenAI والآمنة لإعادة التشغيل مرة واحدة؛ تعني الإخفاقات المستمرة عادة أن الواجهة الخلفية تصدر محتوى فارغًا/غير نصي أو تكبت نص الإجابة النهائية.
    - تنجح الطلبات المباشرة الصغيرة، لكن تشغيلات وكلاء OpenClaw تفشل مع انهيارات في الواجهة الخلفية/النموذج (مثل Gemma على بعض بُنى `inferrs`) → من المرجح أن نقل OpenClaw صحيح بالفعل؛ الواجهة الخلفية تفشل على شكل مطالبة وقت تشغيل الوكيل الأكبر.
    - تتقلص الإخفاقات بعد تعطيل الأدوات لكنها لا تختفي → كانت مخططات الأدوات جزءًا من الضغط، لكن المشكلة المتبقية لا تزال سعة نموذج/خادم من المنبع أو عطلًا في الواجهة الخلفية.

  </Accordion>
  <Accordion title="Fix options">
    1. عيّن `compat.requiresStringContent: true` لواجهات Chat Completions الخلفية التي تقبل السلاسل النصية فقط.
    2. عيّن `compat.strictMessageKeys: true` لواجهات Chat Completions الخلفية الصارمة التي تقبل فقط `role` و`content` في كل رسالة.
    3. عيّن `compat.supportsTools: false` للنماذج/الواجهات الخلفية التي لا تستطيع التعامل مع سطح مخطط أدوات OpenClaw بشكل موثوق.
    4. خفّض ضغط المطالبة حيثما أمكن: تمهيد مساحة عمل أصغر، سجل جلسة أقصر، نموذج محلي أخف، أو واجهة خلفية بدعم أقوى للسياق الطويل.
    5. إذا استمرت الطلبات المباشرة الصغيرة في النجاح بينما ما زالت أدوار وكيل OpenClaw تنهار داخل الواجهة الخلفية، فتعامل معها كقيد في الخادم/النموذج من المنبع وقدّم إعادة إنتاج هناك مع شكل الحمولة المقبول.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [التكوين](/ar/gateway/configuration)
- [النماذج المحلية](/ar/gateway/local-models)
- [النقاط النهائية المتوافقة مع OpenAI](/ar/gateway/configuration-reference#openai-compatible-endpoints)

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
- تقييد ذكر المجموعة (`requireMention`, `mentionPatterns`).
- عدم تطابق قوائم السماح للقناة/المجموعة.

العلامات الشائعة:

- `drop guild message (mention required` → تم تجاهل رسالة المجموعة حتى يحدث ذكر.
- `pairing request` → يحتاج المرسل إلى موافقة.
- `blocked` / `allowlist` → تمت تصفية المرسل/القناة بواسطة السياسة.

ذات صلة:

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

- عنوان URL الصحيح للفحص وعنوان URL للوحة المعلومات.
- عدم تطابق وضع المصادقة/الرمز بين العميل وGateway.
- استخدام HTTP حيث تكون هوية الجهاز مطلوبة.

إذا تعذر على متصفح محلي الاتصال بـ `127.0.0.1:18789` بعد تحديث، فاستعد أولًا
خدمة Gateway المحلية وتأكد من أنها تخدم لوحة المعلومات:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

إذا أرجع `curl` صفحة HTML الخاصة بـ OpenClaw، فهذا يعني أن Gateway يعمل وأن المشكلة المتبقية
غالبًا هي ذاكرة التخزين المؤقت للمتصفح، أو رابط عميق قديم، أو حالة تبويب قديمة. افتح
`http://127.0.0.1:18789` مباشرة وانتقل من لوحة المعلومات. إذا لم تترك إعادة التشغيل
الخدمة قيد التشغيل، فشغل `openclaw gateway start` وأعد التحقق من
`openclaw gateway status`.

<AccordionGroup>
  <Accordion title="علامات الاتصال / المصادقة">
    - `device identity required` → سياق غير آمن أو مصادقة جهاز مفقودة.
    - `origin not allowed` → قيمة `Origin` في المتصفح ليست ضمن `gateway.controlUi.allowedOrigins` (أو أنك تتصل من أصل متصفح غير loopback دون قائمة سماح صريحة).
    - `device nonce required` / `device nonce mismatch` → لا يكمل العميل تدفق مصادقة الجهاز المعتمد على التحدي (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → وقع العميل حمولة خاطئة (أو طابعًا زمنيًا قديمًا) للمصافحة الحالية.
    - `AUTH_TOKEN_MISMATCH` مع `canRetryWithDeviceToken=true` → يمكن للعميل إجراء إعادة محاولة موثوقة واحدة باستخدام رمز الجهاز المخزن مؤقتًا.
    - تعيد إعادة المحاولة باستخدام الرمز المخزن مؤقتًا استخدام مجموعة النطاقات المخزنة مع رمز الجهاز المقترن. يحتفظ مستدعو `deviceToken` الصريح / `scopes` الصريح بمجموعة النطاقات المطلوبة بدلًا من ذلك.
    - `AUTH_SCOPE_MISMATCH` → تم التعرف على رمز الجهاز، لكن نطاقاته المعتمدة لا تغطي طلب الاتصال هذا؛ أعد الاقتران أو وافق على عقد النطاق المطلوب بدلًا من تدوير رمز Gateway مشترك.
    - خارج مسار إعادة المحاولة هذا، تكون أولوية مصادقة الاتصال كالتالي: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
    - في مسار واجهة التحكم غير المتزامن لـ Tailscale Serve، يتم تسلسل المحاولات الفاشلة لنفس `{scope, ip}` قبل أن يسجل المحدد الفشل. لذلك يمكن أن تعرض محاولتا إعادة محاولة متزامنتان سيئتان من العميل نفسه `retry later` في المحاولة الثانية بدلًا من عدم تطابق عاديين.
    - `too many failed authentication attempts (retry later)` من عميل loopback ذي أصل متصفح → تؤدي الإخفاقات المتكررة من قيمة `Origin` المطبوعة نفسها إلى قفل مؤقت؛ يستخدم أصل localhost آخر حاوية منفصلة.
    - تكرار `unauthorized` بعد إعادة المحاولة تلك → انجراف الرمز المشترك/رمز الجهاز؛ حدث تكوين الرمز وأعد الموافقة/تدوير رمز الجهاز عند الحاجة.
    - `gateway connect failed:` → هدف مضيف/منفذ/عنوان URL خاطئ.

  </Accordion>
</AccordionGroup>

### خريطة سريعة لأكواد تفاصيل المصادقة

استخدم `error.details.code` من استجابة `connect` الفاشلة لاختيار الإجراء التالي:

| كود التفاصيل                 | المعنى                                                                                                                                                                                      | الإجراء الموصى به                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | لم يرسل العميل رمزًا مشتركًا مطلوبًا.                                                                                                                                                 | الصق/عيّن الرمز في العميل وأعد المحاولة. لمسارات لوحة المعلومات: `openclaw config get gateway.auth.token` ثم الصقه في إعدادات واجهة التحكم.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | لم يطابق الرمز المشترك رمز مصادقة Gateway.                                                                                                                                               | إذا كان `canRetryWithDeviceToken=true`، فاسمح بإعادة محاولة موثوقة واحدة. تعيد محاولات الرمز المخزن مؤقتًا استخدام النطاقات المعتمدة المخزنة؛ يحتفظ مستدعو `deviceToken` / `scopes` الصريحون بالنطاقات المطلوبة. إذا استمر الفشل، فشغل [قائمة تحقق استرداد انجراف الرمز](/ar/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | رمز كل جهاز المخزن مؤقتًا قديم أو ملغى.                                                                                                                                                 | دوّر/أعد اعتماد رمز الجهاز باستخدام [CLI الأجهزة](/ar/cli/devices)، ثم أعد الاتصال.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | رمز الجهاز صالح، لكن دوره/نطاقاته المعتمدة لا تغطي طلب الاتصال هذا.                                                                                                       | أعد إقران الجهاز أو وافق على عقد النطاق المطلوب؛ لا تعامل هذا كانجراف للرمز المشترك.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | تحتاج هوية الجهاز إلى موافقة. تحقق من `error.details.reason` بحثًا عن `not-paired` أو `scope-upgrade` أو `role-upgrade` أو `metadata-upgrade`، واستخدم `requestId` / `remediationHint` عند وجودهما. | وافق على الطلب المعلق: `openclaw devices list` ثم `openclaw devices approve <requestId>`. تستخدم ترقيات النطاق/الدور التدفق نفسه بعد مراجعة الوصول المطلوب.                                                                                                               |

<Note>
ينبغي ألا تعتمد استدعاءات RPC الخلفية المباشرة عبر loopback، والمصادق عليها برمز/كلمة مرور Gateway المشتركة، على خط أساس نطاق الجهاز المقترن الخاص بـ CLI. إذا استمر فشل الوكلاء الفرعيين أو الاستدعاءات الداخلية الأخرى مع `scope-upgrade`، فتحقق من أن المستدعي يستخدم `client.id: "gateway-client"` و`client.mode: "backend"` ولا يفرض `deviceIdentity` صريحًا أو رمز جهاز.
</Note>

فحص ترحيل مصادقة الجهاز v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

إذا عرضت السجلات أخطاء nonce/التوقيع، فحدّث العميل المتصل وتحقق منه:

<Steps>
  <Step title="انتظر connect.challenge">
    ينتظر العميل `connect.challenge` الصادر من Gateway.
  </Step>
  <Step title="وقّع الحمولة">
    يوقع العميل الحمولة المرتبطة بالتحدي.
  </Step>
  <Step title="أرسل nonce الجهاز">
    يرسل العميل `connect.params.device.nonce` مع nonce التحدي نفسه.
  </Step>
</Steps>

إذا تم رفض `openclaw devices rotate` / `revoke` / `remove` بشكل غير متوقع:

- يمكن لجلسات رمز الجهاز المقترن إدارة جهازها **الخاص بها** فقط ما لم يكن لدى المستدعي أيضًا `operator.admin`
- يمكن لـ `openclaw devices rotate --scope ...` طلب نطاقات مشغل يحتفظ بها بالفعل المستدعي الحالي فقط

ذات صلة:

- [التكوين](/ar/gateway/configuration) (أوضاع مصادقة Gateway)
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
- عدم تطابق تكوين الخدمة (`Config (cli)` مقابل `Config (service)`).
- تعارضات المنفذ/المستمع.
- تثبيتات launchd/systemd/schtasks إضافية عند استخدام `--deep`.
- تلميحات تنظيف `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="العلامات الشائعة">
    - `Gateway start blocked: set gateway.mode=local` أو `existing config is missing gateway.mode` → وضع Gateway المحلي غير مفعّل، أو تمت الكتابة فوق ملف التكوين وفقد `gateway.mode`. الإصلاح: عيّن `gateway.mode="local"` في تكوينك، أو أعد تشغيل `openclaw onboard --mode local` / `openclaw setup` لإعادة ختم تكوين الوضع المحلي المتوقع. إذا كنت تشغل OpenClaw عبر Podman، فإن مسار التكوين الافتراضي هو `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → ربط غير loopback دون مسار مصادقة Gateway صالح (رمز/كلمة مرور، أو وكيل موثوق حيث يكون مكونًا).
    - `another gateway instance is already listening` / `EADDRINUSE` → تعارض منفذ.
    - `Other gateway-like services detected (best effort)` → توجد وحدات launchd/systemd/schtasks قديمة أو موازية. ينبغي أن تحتفظ معظم الإعدادات بـ Gateway واحد لكل جهاز؛ إذا كنت تحتاج فعلًا إلى أكثر من واحد، فاعزل المنافذ + التكوين/الحالة/مساحة العمل. راجع [/gateway#multiple-gateways-same-host](/ar/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` من doctor → توجد وحدة systemd على مستوى النظام بينما خدمة مستوى المستخدم مفقودة. أزل التكرار أو عطله قبل السماح لـ doctor بتثبيت خدمة مستخدم، أو عيّن `OPENCLAW_SERVICE_REPAIR_POLICY=external` إذا كانت وحدة النظام هي المشرف المقصود.
    - `Gateway service port does not match current gateway config` → لا يزال المشرف المثبت يثبت `--port` القديم. شغل `openclaw doctor --fix` أو `openclaw gateway install --force`، ثم أعد تشغيل خدمة Gateway.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [التنفيذ في الخلفية وأداة العمليات](/ar/gateway/background-process)
- [التكوين](/ar/gateway/configuration)
- [Doctor](/ar/gateway/doctor)

## يتوقف Gateway على macOS عن الاستجابة بصمت، ثم يستأنف عندما تلمس لوحة المعلومات

استخدم هذا عندما تصبح القنوات (Telegram، WhatsApp، وما إلى ذلك) على مضيف macOS صامتة من دقائق إلى ساعات في كل مرة، ويبدو أن Gateway يعود في اللحظة التي تفتح فيها واجهة التحكم، أو تدخل عبر SSH، أو تتفاعل مع المضيف بطريقة أخرى. لا تظهر عادة أي أعراض واضحة في `openclaw status` لأنه بحلول الوقت الذي تنظر فيه يكون Gateway قد عاد للعمل.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

ابحث عن:

- حزمة واحدة أو أكثر من حزم `*-uncaught_exception.json` في `~/.openclaw/logs/stability/` يكون فيها `error.code` مضبوطًا على رمز شبكة عابر مثل `ENETDOWN` أو `ENETUNREACH` أو `EHOSTUNREACH` أو `ECONNREFUSED`.
- أسطر `pmset -g log` مثل `Entering Sleep state due to 'Maintenance Sleep'` أو `en0 driver is slow (msg: WillChangeState to 0)` المتزامنة مع الطوابع الزمنية للانهيار. يضع Power Nap / سكون الصيانة مشغل Wi-Fi لفترة وجيزة في الحالة 0؛ وأي `connect()` صادر يقع ضمن تلك النافذة قد يفشل مع `ENETDOWN` حتى على مضيف لديه اتصال كامل بالشبكة في الظروف الأخرى.
- مخرجات `launchctl print` التي تعرض `state = not running` مع عدة `runs` حديثة ورمز خروج، خصوصًا عندما تكون الفجوة بين الانهيار والتشغيل التالي في حدود ساعة بدلًا من ثوان. يطبق macOS launchd بوابة غير موثقة للحماية من إعادة التشغيل بعد سلسلة انهيارات، وقد تتوقف عن احترام `KeepAlive=true` إلى أن يعيد تفعيلها محفز خارجي مثل تسجيل الدخول التفاعلي أو اتصال لوحة التحكم أو `launchctl kickstart`.

التواقيع الشائعة:

- حزمة استقرار يكون فيها `error.code` هو `ENETDOWN` أو رمزًا شقيقًا، مع مكدس استدعاءات يشير إلى Node `net` `lookupAndConnect` / `Socket.connect`. يصنف OpenClaw `2026.5.26` والإصدارات الأحدث هذه الأخطاء كأخطاء شبكة عابرة غير ضارة، بحيث لا تنتشر بعد الآن إلى معالج الاستثناءات غير الملتقطة على المستوى الأعلى؛ إذا كنت تستخدم إصدارًا أقدم، فحدّث أولًا.
- فترات هدوء طويلة تنتهي فور اتصالك بواجهة Control UI أو دخولك إلى المضيف عبر SSH: النشاط المرئي للمستخدم هو ما يعيد تفعيل بوابة إعادة التشغيل في launchd، وليس أي شيء تفعله لوحة التحكم للـ Gateway.
- ازدياد عداد `runs` خلال اليوم من دون سطر مقابل `received SIG*; shutting down` في `~/Library/Logs/openclaw/gateway.log`: تسجل عمليات الإيقاف النظيفة إشارة؛ أما الانهيارات العابرة فلا تفعل.

ما العمل:

1. **حدّث الـ Gateway** إذا كنت تشغل إصدارًا أقدم من `2026.5.26`. بعد التحديث، ستسجل أخطاء `ENETDOWN` المستقبلية كتحذيرات بدلًا من إنهاء العملية.
2. **قلل نشاط سكون الصيانة** على مضيفات Mac mini / أجهزة سطح المكتب المعدة للعمل كخوادم دائمة التشغيل:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   يقلل هذا بشكل كبير، لكنه لا يزيل تمامًا، اضطراب المشغل الأساسي. لا يزال بإمكان النظام تنفيذ بعض حالات سكون الصيانة للحفاظ على TCP keepalive وصيانة mDNS بغض النظر عن هذه الرايات.

3. **أضف مراقب liveness** بحيث تُكتشف بسرعة أي سلسلة انهيارات مستقبلية يوقفها launchd:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   الهدف هو إعادة تفعيل بوابة إعادة التشغيل خارجيًا؛ `KeepAlive=true` وحده لا يكفي على macOS بعد سلسلة انهيارات.

ذات صلة:

- [ملاحظات منصة macOS](/ar/platforms/macos)
- [التسجيل](/ar/logging)
- [Doctor](/ar/gateway/doctor)

## خروج Gateway أثناء الاستخدام العالي للذاكرة

استخدم هذا عندما يختفي الـ Gateway تحت الحمل، أو يبلّغ المشرف عن إعادة تشغيل بنمط OOM، أو تذكر السجلات `critical memory pressure bundle written`.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

ابحث عن:

- `Reason: diagnostic.memory.pressure.critical` في أحدث حزمة استقرار.
- `Memory pressure:` مع `critical/rss_threshold` أو `critical/heap_threshold` أو `critical/rss_growth`.
- قيم `V8 heap:` القريبة من حد heap.
- إدخالات `Largest session files:` مثل `agents/<agent>/sessions/<session>.jsonl` أو `sessions/<session>.jsonl`.
- عدادات ذاكرة cgroup في Linux عندما يعمل الـ Gateway داخل حاوية أو خدمة محدودة الذاكرة.

التواقيع الشائعة:

- يظهر `critical memory pressure bundle written` قبل إعادة التشغيل بقليل → التقط OpenClaw حزمة استقرار قبل OOM. افحصها باستخدام `openclaw gateway stability --bundle latest`.
- يظهر `memory pressure: level=critical ... memoryPressureSnapshot=disabled` في سجلات Gateway → اكتشف OpenClaw ضغط ذاكرة حرجًا، لكن لقطة الاستقرار قبل OOM معطلة.
- يشير `Largest session files:` إلى مسار نص محادثة منقح كبير جدًا → قلل سجل الجلسات المحتفظ به، وافحص نمو الجلسات، أو انقل النصوص القديمة خارج المخزن النشط قبل إعادة التشغيل.
- البايتات المستخدمة في `V8 heap:` قريبة من حد heap → خفّض ضغط الموجه/الجلسة، أو قلل العمل المتزامن، أو ارفع حد heap في Node فقط بعد التأكد من أن عبء العمل متوقع.
- `Memory pressure: critical/rss_growth` → نمت الذاكرة بسرعة داخل نافذة أخذ عينات واحدة. افحص أحدث السجلات بحثًا عن استيراد كبير، أو مخرجات أداة خارجة عن السيطرة، أو محاولات متكررة، أو دفعة من أعمال agent المنتظرة في الطابور.
- يظهر ضغط ذاكرة حرج في السجلات لكن لا توجد حزمة → هذا هو الافتراضي. اضبط `diagnostics.memoryPressureSnapshot: true` لالتقاط حزمة الاستقرار قبل OOM في أحداث ضغط الذاكرة الحرجة المستقبلية.

حزمة الاستقرار خالية من الحمولة. تتضمن أدلة تشغيلية عن الذاكرة ومسارات ملفات نسبية منقحة، وليس نص الرسائل أو أجسام Webhook أو بيانات الاعتماد أو الرموز أو ملفات تعريف الارتباط أو معرّفات الجلسات الخام. أرفق تصدير التشخيصات بتقارير الأخطاء بدلًا من نسخ السجلات الخام.

ذات صلة:

- [صحة Gateway](/ar/gateway/health)
- [تصدير التشخيصات](/ar/gateway/diagnostics)
- [الجلسات](/ar/cli/sessions)

## رفض Gateway تهيئة غير صالحة

استخدم هذا عندما يفشل بدء تشغيل Gateway مع `Invalid config` أو تقول سجلات إعادة التحميل الساخن
إنه تخطى تعديلًا غير صالح.

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
- ملف `openclaw.json.rejected.*` مؤرخ بجانب التهيئة النشطة
- ملف `openclaw.json.clobbered.*` مؤرخ إذا أصلح `doctor --fix` تعديلًا مباشرًا معطوبًا
- يحتفظ OpenClaw بأحدث 32 ملفًا من ملفات `.clobbered.*` لكل مسار تهيئة ويدوّر الملفات الأقدم

<AccordionGroup>
  <Accordion title="What happened">
    - لم تجتز التهيئة التحقق أثناء بدء التشغيل أو إعادة التحميل الساخن أو كتابة يملكها OpenClaw.
    - يفشل بدء تشغيل Gateway بشكل مغلق بدلًا من إعادة كتابة `openclaw.json`.
    - تتخطى إعادة التحميل الساخن التعديلات الخارجية غير الصالحة وتبقي تهيئة وقت التشغيل الحالية نشطة.
    - ترفض الكتابات التي يملكها OpenClaw الحمولات غير الصالحة/المتلفة قبل الالتزام وتحفظ `.rejected.*`.
    - يملك `openclaw doctor --fix` الإصلاح. يمكنه إزالة بادئات غير JSON أو استعادة آخر نسخة معروفة بأنها سليمة مع الحفاظ على الحمولة المرفوضة كـ `.clobbered.*`.
    - عندما تحدث إصلاحات كثيرة لمسار تهيئة واحد، يدوّر OpenClaw ملفات `.clobbered.*` الأقدم بحيث تبقى أحدث حمولة جرى إصلاحها متاحة.

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
    - وجود `.clobbered.*` → احتفظ doctor بتعديل خارجي معطوب أثناء إصلاح التهيئة النشطة.
    - وجود `.rejected.*` → فشلت كتابة تهيئة يملكها OpenClaw في فحوصات المخطط أو clobber قبل الالتزام.
    - `Config write rejected:` → حاولت الكتابة إسقاط الشكل المطلوب، أو تقليص الملف بشدة، أو حفظ تهيئة غير صالحة.
    - `config reload skipped (invalid config):` → فشل تعديل مباشر في التحقق وتم تجاهله من Gateway العامل.
    - `Invalid config at ...` → فشل بدء التشغيل قبل إقلاع خدمات Gateway.
    - `missing-meta-vs-last-good` أو `gateway-mode-missing-vs-last-good` أو `size-drop-vs-last-good:*` → رُفضت كتابة يملكها OpenClaw لأنها فقدت حقولًا أو حجمًا مقارنة بالنسخة الاحتياطية الأخيرة المعروفة بأنها سليمة.
    - `Config last-known-good promotion skipped` → احتوى المرشح على عناصر نائبة منقحة للأسرار مثل `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. شغّل `openclaw doctor --fix` للسماح لـ doctor بإصلاح تهيئة ذات بادئة/متلفة أو استعادة آخر نسخة معروفة بأنها سليمة.
    2. انسخ فقط المفاتيح المقصودة من `.clobbered.*` أو `.rejected.*`، ثم طبقها باستخدام `openclaw config set` أو `config.patch`.
    3. شغّل `openclaw config validate` قبل إعادة التشغيل.
    4. إذا عدّلت يدويًا، فاحتفظ بتهيئة JSON5 الكاملة، وليس فقط الكائن الجزئي الذي أردت تغييره.
  </Accordion>
</AccordionGroup>

ذات صلة:

- [التهيئة](/ar/cli/config)
- [التهيئة: إعادة التحميل الساخن](/ar/gateway/configuration#config-hot-reload)
- [التهيئة: التحقق الصارم](/ar/gateway/configuration#strict-validation)
- [Doctor](/ar/gateway/doctor)

## تحذيرات فحص Gateway

استخدم هذا عندما يصل `openclaw gateway probe` إلى شيء ما، لكنه لا يزال يطبع كتلة تحذير.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

ابحث عن:

- `warnings[].code` و `primaryTargetId` في مخرجات JSON.
- ما إذا كان التحذير متعلقًا بالرجوع إلى SSH، أو تعدد الـ gateways، أو نقص النطاقات، أو مراجع مصادقة غير محلولة.

التواقيع الشائعة:

- `SSH tunnel failed to start; falling back to direct probes.` → فشل إعداد SSH، لكن الأمر لا يزال يحاول الأهداف المباشرة المهيأة/أهداف الاسترجاع المحلي.
- `multiple reachable gateway identities detected` → أجابت gateways مميزة، أو لم يتمكن OpenClaw من إثبات أن الأهداف القابلة للوصول هي Gateway نفسه. يُعامل نفق SSH أو عنوان URL وكيل أو عنوان URL بعيد مهيأ إلى Gateway نفسه كـ Gateway واحد بعدة وسائل نقل، حتى عندما تختلف منافذ النقل.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → نجح الاتصال، لكن RPC التفصيلي محدود بالنطاق؛ اقرن هوية الجهاز أو استخدم بيانات اعتماد تتضمن `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → نجح الاتصال، لكن مجموعة RPC التشخيصية الكاملة انتهت مهلتها أو فشلت. تعامل مع هذا كـ Gateway قابل للوصول مع تشخيصات متدهورة؛ قارن `connect.ok` و `connect.rpcOk` في مخرجات `--json`.
- `Capability: pairing-pending` أو `gateway closed (1008): pairing required` → أجاب الـ Gateway، لكن هذا العميل لا يزال يحتاج إلى الاقتران/الموافقة قبل وصول المشغل العادي.
- نص تحذير SecretRef غير محلول لـ `gateway.auth.*` / `gateway.remote.*` → لم تكن مادة المصادقة متاحة في مسار الأمر هذا للهدف الفاشل.

ذات صلة:

- [Gateway](/ar/cli/gateway)
- [عدة gateways على المضيف نفسه](/ar/gateway#multiple-gateways-same-host)
- [الوصول البعيد](/ar/gateway/remote)

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

- سياسة الرسائل الخاصة DM (`pairing`، `allowlist`، `open`، `disabled`).
- قائمة السماح للمجموعات ومتطلبات الإشارة.
- أذونات/نطاقات API القناة المفقودة.

التواقيع الشائعة:

- `mention required` → تم تجاهل الرسالة بسبب سياسة الإشارة في المجموعة.
- آثار `pairing` / الموافقة المعلقة → المرسل غير معتمد.
- `missing_scope`، `not_in_channel`، `Forbidden`، `401/403` → مشكلة في مصادقة/أذونات القناة.

ذات صلة:

- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [Discord](/ar/channels/discord)
- [Telegram](/ar/channels/telegram)
- [WhatsApp](/ar/channels/whatsapp)

## تسليم Cron و Heartbeat

إذا لم يعمل cron أو heartbeat أو لم يتم التسليم، فتحقق أولًا من حالة المجدول، ثم هدف التسليم.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

ابحث عن:

- تفعيل Cron ووجود موعد التنبيه التالي.
- حالة سجل تشغيل المهمة (`ok`، `skipped`، `error`).
- أسباب تخطي Heartbeat (`quiet-hours`، `requests-in-flight`، `cron-in-progress`، `lanes-busy`، `alerts-disabled`، `empty-heartbeat-file`، `no-tasks-due`).

<AccordionGroup>
  <Accordion title="التواقيع الشائعة">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron معطل.
    - `cron: timer tick failed` → فشل نبض مؤقت المجدول؛ تحقق من أخطاء الملف/السجل/وقت التشغيل.
    - `heartbeat skipped` مع `reason=quiet-hours` → خارج نافذة ساعات النشاط.
    - `heartbeat skipped` مع `reason=empty-heartbeat-file` → الملف `HEARTBEAT.md` موجود لكنه لا يحتوي إلا على فراغات أو تعليق أو ترويسة أو سياج أو هيكل قائمة تحقق فارغة، لذلك يتخطى OpenClaw استدعاء النموذج.
    - `heartbeat skipped` مع `reason=no-tasks-due` → يحتوي `HEARTBEAT.md` على كتلة `tasks:`، لكن لا توجد أي مهام مستحقة في هذه النبضة.
    - `heartbeat: unknown accountId` → معرف حساب غير صالح لهدف تسليم Heartbeat.
    - `heartbeat skipped` مع `reason=dm-blocked` → تم حل هدف Heartbeat إلى وجهة بأسلوب الرسائل المباشرة بينما تم ضبط `agents.defaults.heartbeat.directPolicy` (أو التجاوز لكل وكيل) على `block`.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [Heartbeat](/ar/gateway/heartbeat)
- [المهام المجدولة](/ar/automation/cron-jobs)
- [المهام المجدولة: استكشاف الأخطاء وإصلاحها](/ar/automation/cron-jobs#troubleshooting)

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

- أن يكون Node متصلًا بالإنترنت مع الإمكانات المتوقعة.
- منح أذونات نظام التشغيل للكاميرا/الميكروفون/الموقع/الشاشة.
- موافقات التنفيذ وحالة قائمة السماح.

التواقيع الشائعة:

- `NODE_BACKGROUND_UNAVAILABLE` → يجب أن يكون تطبيق Node في الواجهة الأمامية.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → إذن نظام تشغيل مفقود.
- `SYSTEM_RUN_DENIED: approval required` → موافقة التنفيذ معلقة.
- `SYSTEM_RUN_DENIED: allowlist miss` → الأمر محظور بواسطة قائمة السماح.

ذات صلة:

- [موافقات التنفيذ](/ar/tools/exec-approvals)
- [استكشاف أخطاء Node وإصلاحها](/ar/nodes/troubleshooting)
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
- مسار ملف المتصفح التنفيذي صالحًا.
- إمكانية الوصول إلى ملف تعريف CDP.
- توفر Chrome محليًا لملفات تعريف `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="تواقيع Plugin / الملف التنفيذي">
    - `unknown command "browser"` أو `unknown command 'browser'` → تم استبعاد Plugin المتصفح المضمن بواسطة `plugins.allow`.
    - أداة المتصفح مفقودة / غير متاحة بينما `browser.enabled=true` → يستبعد `plugins.allow` قيمة `browser`، لذلك لم يتم تحميل Plugin مطلقًا.
    - `Failed to start Chrome CDP on port` → فشل تشغيل عملية المتصفح.
    - `browser.executablePath not found` → المسار المكوّن غير صالح.
    - `browser.cdpUrl must be http(s) or ws(s)` → يستخدم عنوان URL المكوّن لـ CDP مخططًا غير مدعوم مثل `file:` أو `ftp:`.
    - `browser.cdpUrl has invalid port` → يحتوي عنوان URL المكوّن لـ CDP على منفذ سيئ أو خارج النطاق.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → تثبيت Gateway الحالي يفتقد تبعية وقت تشغيل المتصفح الأساسية؛ أعد تثبيت OpenClaw أو حدّثه، ثم أعد تشغيل Gateway. لا تزال لقطات ARIA ولقطات الصفحة الأساسية تعمل، لكن التنقل ولقطات الذكاء الاصطناعي ولقطات عناصر محددات CSS وتصدير PDF تبقى غير متاحة.

  </Accordion>
  <Accordion title="تواقيع Chrome MCP / الجلسة الحالية">
    - `Could not find DevToolsActivePort for chrome` → تعذر على Chrome MCP في الجلسة الحالية الارتباط بدليل بيانات المتصفح المحدد بعد. افتح صفحة فحص المتصفح، وفعّل التصحيح عن بعد، وأبقِ المتصفح مفتوحًا، ووافق على مطالبة الارتباط الأولى، ثم أعد المحاولة. إذا لم تكن حالة تسجيل الدخول مطلوبة، ففضّل ملف التعريف المُدار `openclaw`.
    - `No Chrome tabs found for profile="user"` → لا يحتوي ملف تعريف الارتباط في Chrome MCP على أي ألسنة Chrome محلية مفتوحة.
    - `Remote CDP for profile "<name>" is not reachable` → لا يمكن الوصول إلى نقطة نهاية CDP البعيدة المكوّنة من مضيف Gateway.
    - `Browser attachOnly is enabled ... not reachable` أو `Browser attachOnly is enabled and CDP websocket ... is not reachable` → لا يحتوي ملف تعريف الارتباط فقط على هدف قابل للوصول، أو أن نقطة نهاية HTTP أجابت لكن تعذر فتح CDP WebSocket مع ذلك.

  </Accordion>
  <Accordion title="تواقيع العنصر / لقطة الشاشة / الرفع">
    - `fullPage is not supported for element screenshots` → مزج طلب لقطة الشاشة `--full-page` مع `--ref` أو `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → يجب أن تستخدم استدعاءات لقطات شاشة Chrome MCP / `existing-session` التقاط الصفحة أو `--ref` من لقطة، وليس CSS `--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → تحتاج خطافات الرفع في Chrome MCP إلى مراجع لقطات، وليس محددات CSS.
    - `existing-session file uploads currently support one file at a time.` → أرسل ملفًا واحدًا في كل استدعاء على ملفات تعريف Chrome MCP.
    - `existing-session dialog handling does not support timeoutMs.` → لا تدعم خطافات مربعات الحوار على ملفات تعريف Chrome MCP تجاوزات المهلة.
    - `existing-session type does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:type` على ملفات تعريف `profile="user"` / جلسات Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `existing-session evaluate does not support timeoutMs overrides.` → احذف `timeoutMs` من `act:evaluate` على ملفات تعريف `profile="user"` / جلسات Chrome MCP الحالية، أو استخدم ملف تعريف متصفح مُدار/CDP عندما تكون مهلة مخصصة مطلوبة.
    - `response body is not supported for existing-session profiles yet.` → لا يزال `responsebody` يتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.
    - تجاوزات منفذ العرض / الوضع الداكن / اللغة المحلية / عدم الاتصال القديمة على ملفات تعريف الارتباط فقط أو CDP البعيد → شغّل `openclaw browser stop --browser-profile <name>` لإغلاق جلسة التحكم النشطة وتحرير حالة محاكاة Playwright/CDP دون إعادة تشغيل Gateway بالكامل.

  </Accordion>
</AccordionGroup>

ذات صلة:

- [المتصفح (مُدار بواسطة OpenClaw)](/ar/tools/browser)
- [استكشاف أخطاء المتصفح على Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)

## إذا أجريت ترقية وتعطل شيء فجأة

معظم الأعطال بعد الترقية تكون بسبب انجراف التكوين أو فرض افتراضيات أكثر صرامة الآن.

<AccordionGroup>
  <Accordion title="1. تغير سلوك المصادقة وتجاوز عنوان URL">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    ما يجب التحقق منه:

    - إذا كان `gateway.mode=remote`، فقد تستهدف استدعاءات CLI الخدمة البعيدة بينما تكون خدمتك المحلية سليمة.
    - استدعاءات `--url` الصريحة لا تعود إلى بيانات الاعتماد المخزنة.

    التواقيع الشائعة:

    - `gateway connect failed:` → هدف عنوان URL خاطئ.
    - `unauthorized` → نقطة النهاية قابلة للوصول لكن المصادقة خاطئة.

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

    - تحتاج عمليات الربط غير المحلية (`lan`، `tailnet`، `custom`) إلى مسار مصادقة Gateway صالح: مصادقة الرمز/كلمة المرور المشتركة، أو نشر `trusted-proxy` غير محلي مكوّن بشكل صحيح.
    - المفاتيح القديمة مثل `gateway.token` لا تستبدل `gateway.auth.token`.

    التواقيع الشائعة:

    - `refusing to bind gateway ... without auth` → ربط غير محلي دون مسار مصادقة Gateway صالح.
    - `Connectivity probe: failed` بينما وقت التشغيل يعمل → Gateway حي لكنه غير قابل للوصول باستخدام المصادقة/عنوان URL الحاليين.

  </Accordion>
  <Accordion title="3. تغيرت حالة الاقتران وهوية الجهاز">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    ما يجب التحقق منه:

    - موافقات الأجهزة المعلقة للوحة التحكم/Nodes.
    - موافقات اقتران الرسائل المباشرة المعلقة بعد تغييرات السياسة أو الهوية.

    التواقيع الشائعة:

    - `device identity required` → لم يتم استيفاء مصادقة الجهاز.
    - `pairing required` → يجب الموافقة على المرسل/الجهاز.

  </Accordion>
</AccordionGroup>

إذا ظل تكوين الخدمة ووقت التشغيل غير متفقين بعد الفحوصات، فأعد تثبيت بيانات تعريف الخدمة من ملف التعريف/دليل الحالة نفسه:

```bash
openclaw gateway install --force
openclaw gateway restart
```

ذات صلة:

- [المصادقة](/ar/gateway/authentication)
- [التنفيذ في الخلفية وأداة العملية](/ar/gateway/background-process)
- [الاقتران المملوك لـ Gateway](/ar/gateway/pairing)

## ذات صلة

- [Doctor](/ar/gateway/doctor)
- [الأسئلة الشائعة](/ar/help/faq)
- [دليل تشغيل Gateway](/ar/gateway)
