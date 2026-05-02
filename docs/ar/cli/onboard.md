---
read_when:
    - تريد إعدادًا موجهًا لـ Gateway ومساحة العمل والمصادقة والقنوات وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التمهيدي التفاعلي)
title: بدء الاستخدام
x-i18n:
    generated_at: "2026-05-02T07:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

إعداد تفاعلي لإعداد Gateway محلي أو بعيد.

## الأدلة ذات الصلة

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/ar/start/wizard" icon="rocket">
    شرح تفصيلي لتدفق CLI التفاعلي.
  </Card>
  <Card title="Onboarding overview" href="/ar/start/onboarding-overview" icon="map">
    كيف تترابط عملية إعداد OpenClaw.
  </Card>
  <Card title="CLI setup reference" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات والتفاصيل الداخلية وسلوك كل خطوة.
  </Card>
  <Card title="CLI automation" href="/ar/start/wizard-cli-automation" icon="terminal">
    أعلام غير تفاعلية وإعدادات مكتوبة.
  </Card>
  <Card title="macOS app onboarding" href="/ar/start/onboarding" icon="apple">
    تدفق الإعداد لتطبيق شريط قوائم macOS.
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

يستخدم `--flow import` موفري ترحيل مملوكين من Plugin مثل Hermes. يعمل فقط على إعداد OpenClaw جديد؛ إذا كانت هناك إعدادات أو بيانات اعتماد أو جلسات أو ملفات ذاكرة/هوية لمساحة العمل موجودة، فأعد الضبط أو اختر إعدادًا جديدًا قبل الاستيراد.

يبدأ `--modern` معاينة إعداد Crestodian التحاورية. من دون
`--modern`، يحتفظ `openclaw onboard` بتدفق الإعداد الكلاسيكي.

لأهداف `ws://` النصية الصرفة على الشبكات الخاصة (الشبكات الموثوقة فقط)، عيّن
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد.
لا يوجد مكافئ في `openclaw.json` لكسر الحماية هذا الخاص بالنقل من جهة العميل.

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

يكون `--custom-api-key` اختياريًا في الوضع غير التفاعلي. إذا حُذف، يتحقق الإعداد من `CUSTOM_API_KEY`.
يعلّم OpenClaw معرّفات نماذج الرؤية الشائعة تلقائيًا على أنها قادرة على معالجة الصور. مرّر `--custom-image-input` لمعرّفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات وصفية نصية فقط.

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

تكون القيمة الافتراضية لـ `--custom-base-url` هي `http://127.0.0.1:11434`. يكون `--custom-model-id` اختياريًا؛ إذا حُذف، يستخدم الإعداد القيم الافتراضية المقترحة من Ollama. تعمل هنا أيضًا معرّفات نماذج السحابة مثل `kimi-k2.5:cloud`.

خزّن مفاتيح الموفرين كمراجع بدلًا من نص صريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد مراجع مدعومة بمتغيرات البيئة بدلًا من قيم المفاتيح النصية الصريحة.
بالنسبة إلى الموفرين المدعومين بملف تعريف مصادقة، يكتب هذا إدخالات `keyRef`؛ وبالنسبة إلى الموفرين المخصصين، يكتب `models.providers.<id>.apiKey` كمرجع بيئة، على سبيل المثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

عقد وضع `ref` غير التفاعلي:

- عيّن متغير بيئة الموفر في بيئة عملية الإعداد (على سبيل المثال `OPENAI_API_KEY`).
- لا تمرر أعلام مفاتيح مضمنة (على سبيل المثال `--openai-api-key`) إلا إذا كان متغير البيئة ذلك معينًا أيضًا.
- إذا مُرر علم مفتاح مضمن من دون متغير البيئة المطلوب، يفشل الإعداد بسرعة مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- يخزّن `--gateway-auth token --gateway-token <token>` رمزًا نصيًا صريحًا.
- يخزّن `--gateway-auth token --gateway-token-ref-env <name>` قيمة `gateway.auth.token` كـ SecretRef بيئي.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزًا، تُتحقق رموز Gateway المدارة بواسطة SecretRef لكنها لا تُحفظ كنص صريح محلول في بيانات وصفية لبيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا وكان SecretRef المكوّن للرمز غير محلول، يفشل الإعداد بإغلاق آمن مع إرشادات معالجة.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معيّن، يمنع الإعداد التثبيت حتى يُعيّن الوضع صراحة.
- يكتب الإعداد المحلي `gateway.mode="local"` في الإعدادات. إذا كان ملف إعداد لاحق يفتقد `gateway.mode`، فتعامل مع ذلك على أنه تلف في الإعدادات أو تعديل يدوي غير مكتمل، وليس اختصارًا صالحًا لوضع محلي.
- يثبت الإعداد المحلي Plugins القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار.
- يكتب الإعداد البعيد معلومات الاتصال فقط لـ Gateway البعيد ولا يثبت حزم Plugin محلية.
- `--allow-unconfigured` هو منفذ هروب منفصل لتشغيل Gateway. لا يعني أن الإعداد يجوز له حذف `gateway.mode`.

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

- ما لم تمرر `--skip-health`، ينتظر الإعداد Gateway محليًا قابلاً للوصول قبل أن يخرج بنجاح.
- يبدأ `--install-daemon` مسار تثبيت Gateway المدار أولًا. من دونه، يجب أن يكون لديك بالفعل Gateway محلي قيد التشغيل، على سبيل المثال `openclaw gateway run`.
- إذا كنت تريد فقط كتابة الإعدادات/مساحة العمل/التمهيد في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرر `--skip-bootstrap` لتعيين `agents.defaults.skipBootstrap: true` وتخطي إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام المهام المجدولة أولًا، ثم يعود إلى عنصر تسجيل دخول في مجلد بدء التشغيل لكل مستخدم إذا رُفض إنشاء المهمة.

سلوك الإعداد التفاعلي مع وضع المرجع:

- اختر **استخدام مرجع سر** عند المطالبة.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - موفر سر مكوّن (`file` أو `exec`)
- ينفذ الإعداد تحققًا أوليًا سريعًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.

### خيارات نقطة نهاية Z.AI غير التفاعلية

<Note>
يكتشف `--auth-choice zai-api-key` تلقائيًا أفضل نقطة نهاية Z.AI لمفتاحك (يفضل واجهة API العامة مع `zai/glm-5.1`). إذا كنت تريد تحديدًا نقاط نهاية GLM Coding Plan، فاختر `zai-coding-global` أو `zai-coding-cn`.
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

## ملاحظات التدفق

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: مطالبات قليلة، وينشئ رمز Gateway تلقائيًا.
    - `manual`: مطالبات كاملة للمنفذ والربط والمصادقة (اسم مستعار لـ `advanced`).
    - `import`: يشغّل موفر ترحيل مكتشفًا، ويعرض الخطة، ثم يطبقها بعد التأكيد.

  </Accordion>
  <Accordion title="Provider prefiltering">
    عندما يعني اختيار المصادقة موفرًا مفضلًا، يرشّح الإعداد مسبقًا منتقيي النموذج الافتراضي وقائمة السماح إلى ذلك الموفر. بالنسبة إلى Volcengine وBytePlus، يطابق هذا أيضًا متغيرات خطة البرمجة (`volcengine-plan/*` و`byteplus-plan/*`).

    إذا لم ينتج عامل تصفية الموفر المفضل أي نماذج محملة بعد، يعود الإعداد إلى الفهرس غير المرشح بدلًا من ترك المنتقي فارغًا.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    تطلق بعض موفري بحث الويب مطالبات متابعة خاصة بالموفر:

    - يمكن أن يعرض **Grok** إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه واختيار نموذج `x_search`.
    - يمكن أن يطلب **Kimi** منطقة Moonshot API (`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج بحث الويب الافتراضي لـ Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - سلوك نطاق الرسائل المباشرة في الإعداد المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
    - أسرع محادثة أولى: `openclaw dashboard` (واجهة التحكم، من دون إعداد قناة).
    - موفر مخصص: صِل أي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك الموفرون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.
    - إذا اكتُشفت حالة Hermes، يعرض الإعداد تدفق ترحيل. استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل الجاف ووضع الاستبدال والتقارير والتطابقات الدقيقة.

  </Accordion>
</AccordionGroup>

## أوامر متابعة شائعة

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` للبرامج النصية.
</Note>
