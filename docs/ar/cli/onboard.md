---
read_when:
    - تريد إعدادًا موجّهًا يشمل Gateway ومساحة العمل والمصادقة والقنوات و Skills
summary: مرجع CLI الخاص بـ `openclaw onboard` (الإعداد الأولي التفاعلي)
title: الإعداد الأولي
x-i18n:
    generated_at: "2026-05-10T19:31:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 510b2bbb688605ce1bf30918e4982e783963e7d43be65f9c23cffac11248ffd2
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

إعداد إرشادي كامل لإعداد Gateway محلي أو بعيد. استخدم هذا عندما تريد أن يرشد OpenClaw خلال مصادقة النموذج، ومساحة العمل، وGateway، والقنوات، وSkills، والصحة في تدفق واحد.

## الأدلة ذات الصلة

<CardGroup cols={2}>
  <Card title="مركز إعداد CLI" href="/ar/start/wizard" icon="rocket">
    شرح تفصيلي لتدفق CLI التفاعلي.
  </Card>
  <Card title="نظرة عامة على الإعداد" href="/ar/start/onboarding-overview" icon="map">
    كيف تتكامل عملية إعداد OpenClaw.
  </Card>
  <Card title="مرجع إعداد CLI" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات، والتفاصيل الداخلية، والسلوك لكل خطوة.
  </Card>
  <Card title="أتمتة CLI" href="/ar/start/wizard-cli-automation" icon="terminal">
    الأعلام غير التفاعلية والإعدادات النصية.
  </Card>
  <Card title="إعداد تطبيق macOS" href="/ar/start/onboarding" icon="apple">
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

يستخدم `--flow import` موفري ترحيل مملوكين للـ plugin مثل Hermes. يعمل فقط على إعداد OpenClaw جديد؛ إذا كانت هناك إعدادات أو بيانات اعتماد أو جلسات أو ملفات ذاكرة/هوية لمساحة العمل موجودة، فأعد الضبط أو اختر إعدادًا جديدًا قبل الاستيراد.

يبدأ `--modern` معاينة إعداد Crestodian الحوارية. من دون
`--modern`، يحافظ `openclaw onboard` على تدفق الإعداد الكلاسيكي.

بالنسبة إلى أهداف الشبكة الخاصة بنص عادي `ws://` (الشبكات الموثوقة فقط)، عيّن
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد.
لا يوجد مكافئ في `openclaw.json` لكسر الزجاج الخاص بنقل العميل هذا.

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

`--custom-api-key` اختياري في الوضع غير التفاعلي. إذا حُذف، يتحقق الإعداد من `CUSTOM_API_KEY`.
يضع OpenClaw علامات على معرّفات نماذج الرؤية الشائعة كداعمة للصور تلقائيًا. مرّر `--custom-image-input` لمعرّفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات تعريف نصية فقط.

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

تكون قيمة `--custom-base-url` الافتراضية هي `http://127.0.0.1:11434`. `--custom-model-id` اختياري؛ إذا حُذف، يستخدم الإعداد القيم الافتراضية المقترحة من Ollama. تعمل هنا أيضًا معرّفات نماذج السحابة مثل `kimi-k2.5:cloud`.

خزّن مفاتيح الموفر كمراجع بدلًا من نص عادي:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد مراجع مدعومة بالبيئة بدلًا من قيم مفاتيح النص العادي.
بالنسبة إلى الموفرين المدعومين بملفات تعريف المصادقة، يكتب هذا إدخالات `keyRef`؛ وبالنسبة إلى الموفرين المخصصين، يكتب `models.providers.<id>.apiKey` كمرجع بيئة (على سبيل المثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- عيّن متغير بيئة الموفر في بيئة عملية الإعداد (على سبيل المثال `OPENAI_API_KEY`).
- لا تمرر أعلام مفاتيح مضمنة (على سبيل المثال `--openai-api-key`) إلا إذا كان متغير البيئة ذلك معيّنًا أيضًا.
- إذا مُرر علم مفتاح مضمن من دون متغير البيئة المطلوب، يفشل الإعداد بسرعة مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- يخزّن `--gateway-auth token --gateway-token <token>` رمزًا بنص عادي.
- يخزّن `--gateway-auth token --gateway-token-ref-env <name>` قيمة `gateway.auth.token` كـ SecretRef للبيئة.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزًا، تُتحقق رموز Gateway المُدارة بـ SecretRef ولكن لا تُحفظ كنص عادي محلول في بيانات تعريف بيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا وكان SecretRef المهيأ للرمز غير محلول، يفشل الإعداد مغلقًا مع إرشادات معالجة.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير معيّن، يمنع الإعداد التثبيت حتى يُعيّن الوضع صراحة.
- يكتب الإعداد المحلي `gateway.mode="local"` في التهيئة. إذا كان ملف تهيئة لاحق يفتقد `gateway.mode`، فتعامل مع ذلك كتلف في التهيئة أو تعديل يدوي غير مكتمل، وليس كاختصار صالح للوضع المحلي.
- يثبّت الإعداد المحلي Plugins القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار.
- يكتب الإعداد البعيد معلومات الاتصال فقط لـ Gateway البعيد ولا يثبّت حزم plugin محلية.
- `--allow-unconfigured` هو فتحة هروب منفصلة لوقت تشغيل Gateway. لا يعني أن الإعداد يجوز له حذف `gateway.mode`.

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

- ما لم تمرر `--skip-health`، ينتظر الإعداد Gateway محليًا يمكن الوصول إليه قبل أن يخرج بنجاح.
- يبدأ `--install-daemon` مسار تثبيت Gateway المُدار أولًا. من دونه، يجب أن يكون لديك Gateway محلي قيد التشغيل مسبقًا، على سبيل المثال `openclaw gateway run`.
- إذا كنت تريد فقط كتابة التهيئة/مساحة العمل/bootstrap في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرّر `--skip-bootstrap` لتعيين `agents.defaults.skipBootstrap: true` وتخطي إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام Scheduled Tasks أولًا ثم يتراجع إلى عنصر تسجيل دخول في مجلد Startup لكل مستخدم إذا رُفض إنشاء المهمة.

سلوك الإعداد التفاعلي مع وضع المرجع:

- اختر **استخدام مرجع سر** عند مطالبتك.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - موفر أسرار مهيأ (`file` أو `exec`)
- يجري الإعداد تحققًا أوليًا سريعًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.

### اختيارات نقطة نهاية Z.AI غير التفاعلية

<Note>
يكتشف `--auth-choice zai-api-key` تلقائيًا أفضل نقطة نهاية Z.AI لمفتاحك (يفضل API العام مع `zai/glm-5.1`). إذا كنت تريد تحديدًا نقاط نهاية GLM Coding Plan، فاختر `zai-coding-global` أو `zai-coding-cn`.
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
  <Accordion title="أنواع التدفق">
    - `quickstart`: مطالبات محدودة، وينشئ رمز Gateway تلقائيًا.
    - `manual`: مطالبات كاملة للمنفذ، والربط، والمصادقة (اسم مستعار لـ `advanced`).
    - `import`: يشغّل موفر ترحيل مكتشفًا، ويعاين الخطة، ثم يطبقها بعد التأكيد.

  </Accordion>
  <Accordion title="التصفية المسبقة للموفر">
    عندما يشير اختيار المصادقة إلى موفر مفضل، يصفّي الإعداد مسبقًا ملتقطات النموذج الافتراضي وقائمة السماح إلى ذلك الموفر. بالنسبة إلى Volcengine وBytePlus، يطابق هذا أيضًا متغيرات coding-plan (`volcengine-plan/*`، `byteplus-plan/*`).

    إذا لم ينتج عن مرشح الموفر المفضل أي نماذج محملة بعد، يتراجع الإعداد إلى الفهرس غير المصفى بدلًا من ترك الملتقط فارغًا.

  </Accordion>
  <Accordion title="متابعات بحث الويب">
    يطلق بعض موفري بحث الويب مطالبات متابعة خاصة بالموفر:

    - يمكن لـ **Grok** أن يعرض إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه واختيار نموذج `x_search`.
    - يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج بحث الويب الافتراضي لـ Kimi.

  </Accordion>
  <Accordion title="سلوكيات أخرى">
    - سلوك نطاق الرسائل المباشرة في الإعداد المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
    - أسرع محادثة أولى: `openclaw dashboard` (Control UI، من دون إعداد قناة).
    - موفر مخصص: صِل أي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك الموفرون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.
    - إذا اكتُشفت حالة Hermes، يعرض الإعداد تدفق ترحيل. استخدم [الترحيل](/ar/cli/migrate) لخطط التشغيل التجريبي، ووضع الكتابة فوق، والتقارير، والتعيينات الدقيقة.

  </Accordion>
</AccordionGroup>

## أوامر متابعة شائعة

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

استخدم `openclaw setup` بدلًا من ذلك عندما تحتاج فقط إلى التهيئة/مساحة العمل الأساسية. استخدم `openclaw configure` لاحقًا للتغييرات المستهدفة و`openclaw channels add` لإعداد القنوات فقط.

<Note>
`--json` لا يعني الوضع غير التفاعلي. استخدم `--non-interactive` للنصوص البرمجية.
</Note>
