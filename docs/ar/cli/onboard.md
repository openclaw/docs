---
read_when:
    - تريد إعدادًا موجَّهًا لـ Gateway، ومساحة العمل، والمصادقة، والقنوات، وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي)
title: بدء الاستخدام
x-i18n:
    generated_at: "2026-04-30T07:49:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

إعداد تفاعلي للإعداد المحلي أو البعيد لـ Gateway.

## الأدلة ذات الصلة

<CardGroup cols={2}>
  <Card title="مركز إعداد CLI" href="/ar/start/wizard" icon="rocket">
    شرح تفصيلي لمسار CLI التفاعلي.
  </Card>
  <Card title="نظرة عامة على الإعداد" href="/ar/start/onboarding-overview" icon="map">
    كيف تتكامل عملية إعداد OpenClaw.
  </Card>
  <Card title="مرجع إعداد CLI" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات، والتفاصيل الداخلية، وسلوك كل خطوة.
  </Card>
  <Card title="أتمتة CLI" href="/ar/start/wizard-cli-automation" icon="terminal">
    أعلام التشغيل غير التفاعلية وعمليات الإعداد النصية.
  </Card>
  <Card title="إعداد تطبيق macOS" href="/ar/start/onboarding" icon="apple">
    مسار الإعداد لتطبيق شريط القوائم على macOS.
  </Card>
</CardGroup>

## أمثلة

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

يستخدم `--flow import` موفري ترحيل مملوكين من Plugin مثل Hermes. يعمل فقط مع إعداد OpenClaw جديد؛ إذا كانت هناك إعدادات أو بيانات اعتماد أو جلسات أو ملفات ذاكرة/هوية مساحة عمل موجودة، فأعد الضبط أو اختر إعدادًا جديدًا قبل الاستيراد.

يبدأ `--modern` معاينة إعداد Crestodian التحاورية. من دون
`--modern`، يحافظ `openclaw onboard` على مسار الإعداد الكلاسيكي.

لوجهات `ws://` النصية الصريحة على الشبكات الخاصة (الشبكات الموثوقة فقط)، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد.
لا يوجد مكافئ في `openclaw.json` لهذا التجاوز الطارئ لنقل العميل.

موفر مخصص غير تفاعلي:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` اختياري في الوضع غير التفاعلي. إذا تم حذفه، يتحقق الإعداد من `CUSTOM_API_KEY`.
يعلّم OpenClaw معرّفات نماذج الرؤية الشائعة تلقائيًا على أنها داعمة للصور. مرر `--custom-image-input` لمعرّفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات وصفية نصية فقط.

يدعم LM Studio أيضًا علم مفتاح خاصًا بالموفر في الوضع غير التفاعلي:

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

القيمة الافتراضية لـ `--custom-base-url` هي `http://127.0.0.1:11434`. `--custom-model-id` اختياري؛ إذا تم حذفه، يستخدم الإعداد الافتراضات المقترحة من Ollama. تعمل هنا أيضًا معرّفات نماذج السحابة مثل `kimi-k2.5:cloud`.

خزّن مفاتيح الموفر كمراجع بدلًا من النص الصريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد مراجع مدعومة بمتغيرات البيئة بدلًا من قيم المفاتيح النصية الصريحة.
بالنسبة إلى الموفرين المدعومين بملف تعريف المصادقة، يكتب هذا إدخالات `keyRef`؛ وبالنسبة إلى الموفرين المخصصين، يكتب `models.providers.<id>.apiKey` كمرجع بيئة (على سبيل المثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- اضبط متغير بيئة الموفر في بيئة عملية الإعداد (على سبيل المثال `OPENAI_API_KEY`).
- لا تمرر أعلام مفاتيح مضمنة (على سبيل المثال `--openai-api-key`) إلا إذا كان متغير البيئة ذلك مضبوطًا أيضًا.
- إذا تم تمرير علم مفتاح مضمن من دون متغير البيئة المطلوب، يفشل الإعداد سريعًا مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- يخزن `--gateway-auth token --gateway-token <token>` رمزًا نصيًا صريحًا.
- يخزن `--gateway-auth token --gateway-token-ref-env <name>` قيمة `gateway.auth.token` كـ SecretRef بيئي.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزًا، يتم التحقق من رموز Gateway المُدارة بواسطة SecretRef لكن لا تُحفظ كنص صريح محلول في بيانات تعريف بيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا وكان SecretRef لرمز Gateway المكوّن غير محلول، يفشل الإعداد بإغلاق آمن مع إرشادات معالجة.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكانت `gateway.auth.mode` غير مضبوطة، يحظر الإعداد التثبيت حتى يتم ضبط الوضع صراحة.
- يكتب الإعداد المحلي `gateway.mode="local"` في الإعدادات. إذا كان ملف إعداد لاحق يفتقد `gateway.mode`، فتعامل مع ذلك كتلف في الإعدادات أو تعديل يدوي غير مكتمل، وليس كاختصار صالح لوضع محلي.
- `--allow-unconfigured` هو منفذ هروب منفصل لوقت تشغيل Gateway. لا يعني أن الإعداد يمكنه حذف `gateway.mode`.

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

صحة Gateway المحلي غير التفاعلية:

- ما لم تمرر `--skip-health`، ينتظر الإعداد Gateway محليًا قابلًا للوصول قبل أن يخرج بنجاح.
- يبدأ `--install-daemon` مسار تثبيت Gateway المُدار أولًا. ومن دونه، يجب أن يكون لديك Gateway محلي قيد التشغيل مسبقًا، على سبيل المثال `openclaw gateway run`.
- إذا كنت تريد فقط كتابة الإعدادات/مساحة العمل/التمهيد في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرر `--skip-bootstrap` لضبط `agents.defaults.skipBootstrap: true` وتجاوز إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام المهام المجدولة أولًا، ثم يرجع إلى عنصر تسجيل دخول في مجلد بدء التشغيل لكل مستخدم إذا رُفض إنشاء المهمة.

سلوك الإعداد التفاعلي مع وضع المرجع:

- اختر **استخدام مرجع سر** عند مطالبتك.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - موفر أسرار مكوّن (`file` أو `exec`)
- ينفذ الإعداد تحققًا سريعًا مسبقًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.

### خيارات نقطة نهاية Z.AI غير التفاعلية

<Note>
يكتشف `--auth-choice zai-api-key` تلقائيًا أفضل نقطة نهاية Z.AI لمفتاحك (ويفضل واجهة API العامة مع `zai/glm-5.1`). إذا كنت تريد تحديدًا نقاط نهاية خطة GLM Coding، فاختر `zai-coding-global` أو `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## ملاحظات المسار

<AccordionGroup>
  <Accordion title="أنواع المسارات">
    - `quickstart`: مطالبات قليلة، ويولّد رمز Gateway تلقائيًا.
    - `manual`: مطالبات كاملة للمنفذ والربط والمصادقة (اسم بديل لـ `advanced`).
    - `import`: يشغّل موفر ترحيل مكتشفًا، ويعاين الخطة، ثم يطبقها بعد التأكيد.

  </Accordion>
  <Accordion title="التصفية المسبقة للموفرين">
    عندما يتضمن خيار المصادقة موفرًا مفضلًا، يصفّي الإعداد مسبقًا محددات النموذج الافتراضي وقائمة السماح لذلك الموفر. بالنسبة إلى Volcengine وBytePlus، يطابق هذا أيضًا متغيرات خطة البرمجة (`volcengine-plan/*` و`byteplus-plan/*`).

    إذا لم ينتج مرشح الموفر المفضل أي نماذج محملة بعد، يرجع الإعداد إلى الفهرس غير المصفّى بدلًا من ترك المحدد فارغًا.

  </Accordion>
  <Accordion title="متابعات بحث الويب">
    يطلق بعض موفري بحث الويب مطالبات متابعة خاصة بالموفر:

    - يمكن لـ **Grok** تقديم إعداد `x_search` اختياري باستخدام `XAI_API_KEY` نفسه وخيار نموذج `x_search`.
    - يمكن لـ **Kimi** طلب منطقة Moonshot API (`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج بحث الويب الافتراضي لـ Kimi.

  </Accordion>
  <Accordion title="سلوكيات أخرى">
    - سلوك نطاق الرسائل المباشرة في الإعداد المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
    - أسرع محادثة أولى: `openclaw dashboard` (واجهة التحكم، بلا إعداد قناة).
    - موفر مخصص: صِل أي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك الموفرون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.
    - إذا تم اكتشاف حالة Hermes، يعرض الإعداد مسار ترحيل. استخدم [Migrate](/ar/cli/migrate) لخطط التشغيل الجاف، ووضع الاستبدال، والتقارير، والتعيينات الدقيقة.

  </Accordion>
</AccordionGroup>

## أوامر متابعة شائعة

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` للنصوص البرمجية.
</Note>
