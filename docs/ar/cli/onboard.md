---
read_when:
    - تريد إعدادًا موجّهًا لـ Gateway، ومساحة العمل، والمصادقة، والقنوات، وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي الأولي)
title: الإعداد الأولي
x-i18n:
    generated_at: "2026-04-24T07:35:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

إعداد تفاعلي أولي لإعداد Gateway محليًا أو عن بُعد.

## أدلة ذات صلة

- مركز إعداد CLI الأولي: [الإعداد الأولي (CLI)](/ar/start/wizard)
- نظرة عامة على الإعداد الأولي: [نظرة عامة على الإعداد الأولي](/ar/start/onboarding-overview)
- مرجع إعداد CLI الأولي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference)
- أتمتة CLI: [أتمتة CLI](/ar/start/wizard-cli-automation)
- الإعداد الأولي على macOS: [الإعداد الأولي (تطبيق macOS)](/ar/start/onboarding)

## أمثلة

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

بالنسبة إلى أهداف `ws://` النصية غير المشفرة على الشبكات الخاصة (الشبكات الموثوقة فقط)، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد الأولي.
لا يوجد مكافئ في `openclaw.json` لهذا
التجاوز الطارئ في نقل العميل.

مزوّد مخصص غير تفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

يكون `--custom-api-key` اختياريًا في الوضع غير التفاعلي. وإذا تم حذفه، يتحقق الإعداد الأولي من `CUSTOM_API_KEY`.

يدعم LM Studio أيضًا علم مفتاح خاص بالمزوّد في الوضع غير التفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama غير تفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

تكون القيمة الافتراضية لـ `--custom-base-url` هي `http://127.0.0.1:11434`. ويكون `--custom-model-id` اختياريًا؛ وإذا تم حذفه، يستخدم الإعداد الأولي القيم الافتراضية المقترحة من Ollama. كما تعمل هنا أيضًا معرّفات النماذج السحابية مثل `kimi-k2.5:cloud`.

خزّن مفاتيح المزوّد كمرجع بدلًا من نص صريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد الأولي مراجع مدعومة بمتغيرات البيئة بدلًا من قيم المفاتيح النصية الصريحة.
وبالنسبة إلى المزوّدين المعتمدين على ملفات تعريف المصادقة، يكتب ذلك إدخالات `keyRef`؛ أما بالنسبة إلى المزوّدين المخصصين، فيكتب `models.providers.<id>.apiKey` كمرجع env (على سبيل المثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد الوضع غير التفاعلي `ref`:

- اضبط متغير البيئة الخاص بالمزوّد في بيئة عملية الإعداد الأولي (على سبيل المثال `OPENAI_API_KEY`).
- لا تمرر أعلام مفاتيح مضمنة (على سبيل المثال `--openai-api-key`) ما لم يكن متغير البيئة هذا مضبوطًا أيضًا.
- إذا تم تمرير علم مفتاح مضمن من دون متغير البيئة المطلوب، يفشل الإعداد الأولي سريعًا مع إرشادات.

خيارات رمز Gateway المميز في الوضع غير التفاعلي:

- `--gateway-auth token --gateway-token <token>` يخزّن رمزًا مميزًا بنص صريح.
- `--gateway-auth token --gateway-token-ref-env <name>` يخزّن `gateway.auth.token` كمرجع SecretRef من نوع env.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد الأولي.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز المميز وجود رمز، يتم التحقق من رموز Gateway المميزة المُدارة عبر SecretRef ولكن لا يتم الاحتفاظ بها كنص صريح محلل داخل بيانات بيئة خدمة المشرف.
- مع `--install-daemon`، إذا كانت مصادقة الرمز المميز تتطلب رمزًا وكان SecretRef الخاص بالرمز المميز المكوّن غير محلل، يفشل الإعداد الأولي بشكل مغلق مع إرشادات للمعالجة.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يمنع الإعداد الأولي التثبيت إلى أن يتم ضبط الوضع صراحة.
- يكتب الإعداد الأولي المحلي `gateway.mode="local"` في التكوين. وإذا كان ملف تكوين لاحق يفتقد `gateway.mode`، فاعتبر ذلك تلفًا في التكوين أو تعديلًا يدويًا غير مكتمل، وليس اختصارًا صالحًا لوضع local.
- `--allow-unconfigured` هو آلية تجاوز منفصلة لوقت تشغيل Gateway. ولا يعني أن الإعداد الأولي يمكنه حذف `gateway.mode`.

مثال:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

سلامة Gateway المحلي في الوضع غير التفاعلي:

- ما لم تمرر `--skip-health`، ينتظر الإعداد الأولي وجود Gateway محلي قابل للوصول قبل أن يخرج بنجاح.
- يبدأ `--install-daemon` أولًا مسار تثبيت Gateway المُدار. ومن دونه، يجب أن يكون لديك بالفعل Gateway محلي يعمل، على سبيل المثال `openclaw gateway run`.
- إذا كنت تريد فقط كتابة التكوين/مساحة العمل/bootstrap في الأتمتة، فاستخدم `--skip-health`.
- على Windows الأصلي، يحاول `--install-daemon` أولًا استخدام Scheduled Tasks ثم يعود إلى عنصر تسجيل دخول لكل مستخدم في مجلد Startup إذا تم رفض إنشاء المهمة.

سلوك الإعداد الأولي التفاعلي مع وضع المرجع:

- اختر **Use secret reference** عند المطالبة.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - مزوّد أسرار مكوّن (`file` أو `exec`)
- ينفذ الإعداد الأولي تحقق preflight سريعًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الأولي الخطأ ويتيح لك إعادة المحاولة.

خيارات نقطة نهاية Z.AI غير التفاعلية:

ملاحظة: يقوم `--auth-choice zai-api-key` الآن باكتشاف أفضل نقطة نهاية Z.AI تلقائيًا لمفتاحك (ويفضّل API العامة مع `zai/glm-5.1`).
إذا كنت تريد تحديدًا نقاط نهاية GLM Coding Plan، فاختر `zai-coding-global` أو `zai-coding-cn`.

```bash
# اختيار نقطة نهاية بدون مطالبات
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# خيارات نقاط نهاية Z.AI الأخرى:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

مثال Mistral غير تفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

ملاحظات التدفق:

- `quickstart`: مطالبات قليلة، ويولّد رمز Gateway مميزًا تلقائيًا.
- `manual`: مطالبات كاملة للمنفذ/الربط/المصادقة (اسم مستعار لـ `advanced`).
- عندما يشير اختيار مصادقة إلى مزوّد مفضّل، يقوم الإعداد الأولي بتصفية
  محددات النموذج الافتراضي وقائمة السماح مسبقًا لهذا المزوّد. بالنسبة إلى Volcengine و
  BytePlus، يطابق هذا أيضًا متغيرات coding-plan
  (`volcengine-plan/*` و`byteplus-plan/*`).
- إذا لم تنتج تصفية المزوّد المفضّل أي نماذج محمّلة بعد، يعود الإعداد الأولي
  إلى الفهرس غير المصفّى بدلًا من ترك المحدد فارغًا.
- في خطوة البحث على الويب، يمكن لبعض المزوّدين تشغيل مطالبات متابعة خاصة بالمزوّد:
  - يمكن لـ **Grok** أن يقدّم إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY`
    نفسه واختيار نموذج `x_search`.
  - يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل
    `api.moonshot.cn`) ونموذج البحث على الويب الافتراضي لـ Kimi.
- سلوك نطاق الرسائل الخاصة في الإعداد الأولي المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
- أسرع دردشة أولى: `openclaw dashboard` (واجهة التحكم UI، من دون إعداد قناة).
- مزوّد مخصص: صِل أي نقطة نهاية متوافقة مع OpenAI أو Anthropic،
  بما في ذلك المزوّدون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.

## أوامر متابعة شائعة

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` للسكربتات.
</Note>
