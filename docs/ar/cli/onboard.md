---
read_when:
    - تريد إعدادًا موجهًا لـ gateway ومساحة العمل والمصادقة والقنوات وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي)
title: التهيئة
x-i18n:
    generated_at: "2026-06-30T22:17:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

إعداد موجّه كامل لإعداد Gateway محلي أو بعيد. استخدم هذا عندما تريد أن يمر OpenClaw عبر مصادقة النموذج، ومساحة العمل، وGateway، والقنوات، وSkills، والصحة في مسار واحد.

## الأدلة ذات الصلة

<CardGroup cols={2}>
  <Card title="مركز إعداد CLI" href="/ar/start/wizard" icon="rocket">
    شرح لمسار CLI التفاعلي.
  </Card>
  <Card title="نظرة عامة على الإعداد" href="/ar/start/onboarding-overview" icon="map">
    كيف تتكامل عملية إعداد OpenClaw.
  </Card>
  <Card title="مرجع إعداد CLI" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات، والتفاصيل الداخلية، وسلوك كل خطوة.
  </Card>
  <Card title="أتمتة CLI" href="/ar/start/wizard-cli-automation" icon="terminal">
    أعلام التشغيل غير التفاعلي والإعدادات المبرمجة.
  </Card>
  <Card title="إعداد تطبيق macOS" href="/ar/start/onboarding" icon="apple">
    مسار الإعداد لتطبيق شريط قوائم macOS.
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

يستخدم `--flow import` مزوّدي ترحيل مملوكين لـ Plugin مثل Hermes. يعمل فقط على إعداد OpenClaw جديد؛ إذا كانت هناك ملفات إعدادات أو بيانات اعتماد أو جلسات أو ملفات ذاكرة/هوية لمساحة العمل موجودة، فأعد الضبط أو اختر إعدادًا جديدًا قبل الاستيراد.

يشغّل `--modern` معاينة إعداد Crestodian التحاورية. من دون
`--modern`، يحتفظ `openclaw onboard` بمسار الإعداد الكلاسيكي.

في تثبيت جديد حيث يكون ملف الإعداد النشط مفقودًا أو لا يحتوي على إعدادات
مؤلَّفة (فارغ أو يحتوي على بيانات وصفية فقط)، يبدأ `openclaw` وحده أيضًا مسار
الإعداد الكلاسيكي. بعد أن يحتوي ملف الإعداد على إعدادات مؤلَّفة، يفتح
`openclaw` وحده Crestodian بدلًا من ذلك.

يُقبل النص الصريح `ws://` لعناوين local loopback، وحروف عناوين IP الخاصة، و`.local`، وعناوين URL الخاصة بـ Gateway على Tailnet `*.ts.net`. لأسماء DNS الخاصة الموثوقة الأخرى، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد.

## اللغة المحلية

يستخدم الإعداد التفاعلي لغة معالج CLI لنصوص الإعداد الثابتة. ترتيب الحل هو:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. الرجوع إلى الإنجليزية

لغات المعالج المدعومة هي `en` و`zh-CN` و`zh-TW`. يمكن أن تستخدم قيم اللغة المحلية
صيغة الشرطة السفلية أو لاحقات POSIX مثل `zh_CN.UTF-8`. تبقى أسماء المنتجات،
وأسماء الأوامر، ومفاتيح الإعدادات، وعناوين URL، ومعرّفات المزوّدين، ومعرّفات النماذج، وتسميات Plugin/القنوات
حرفية.

مثال:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

مزوّد مخصص غير تفاعلي:

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
يضع OpenClaw علامة تلقائية على معرّفات نماذج الرؤية الشائعة على أنها قادرة على معالجة الصور. مرّر `--custom-image-input` لمعرّفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات وصفية نصية فقط.
استخدم `--custom-compatibility openai-responses` لنقاط النهاية المتوافقة مع OpenAI التي تدعم `/v1/responses` ولكن لا تدعم `/v1/chat/completions`.

يدعم LM Studio أيضًا علم مفتاح خاصًا بالمزوّد في الوضع غير التفاعلي:

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

القيمة الافتراضية لـ `--custom-base-url` هي `http://127.0.0.1:11434`. يكون `--custom-model-id` اختياريًا؛ إذا حُذف، يستخدم الإعداد القيم الافتراضية التي تقترحها Ollama. تعمل هنا أيضًا معرّفات النماذج السحابية مثل `kimi-k2.5:cloud`.

خزّن مفاتيح المزوّد كمراجع بدلًا من نص صريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد مراجع مدعومة بمتغيرات البيئة بدلًا من قيم المفاتيح بالنص الصريح.
بالنسبة إلى المزوّدين المدعومين بملف مصادقة، يكتب هذا إدخالات `keyRef`؛ وبالنسبة إلى المزوّدين المخصصين، يكتب `models.providers.<id>.apiKey` كمرجع بيئة (على سبيل المثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- اضبط متغير بيئة المزوّد في بيئة عملية الإعداد (على سبيل المثال `OPENAI_API_KEY`).
- لا تمرّر أعلام مفاتيح مضمنة (على سبيل المثال `--openai-api-key`) إلا إذا كان متغير البيئة ذاك مضبوطًا أيضًا.
- إذا مُرّر علم مفتاح مضمن من دون متغير البيئة المطلوب، يفشل الإعداد سريعًا مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- يخزّن `--gateway-auth token --gateway-token <token>` رمزًا بنص صريح.
- يخزّن `--gateway-auth token --gateway-token-ref-env <name>` قيمة `gateway.auth.token` كـ SecretRef بيئي.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزًا، تُتحقق رموز Gateway المُدارة عبر SecretRef ولكن لا تُحفظ كنص صريح محلول في البيانات الوصفية لبيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا وكان SecretRef المكوّن للرمز غير محلول، يفشل الإعداد بإغلاق محكم مع إرشادات معالجة.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يمنع الإعداد التثبيت إلى أن يُضبط الوضع صراحة.
- يكتب الإعداد المحلي `gateway.mode="local"` في ملف الإعدادات. إذا كان ملف إعداد لاحق يفتقد `gateway.mode`، فتعامل مع ذلك كضرر في الإعدادات أو تعديل يدوي غير مكتمل، لا كاختصار صالح للوضع المحلي.
- يثبّت الإعداد المحلي Plugins القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار.
- يكتب الإعداد البعيد معلومات الاتصال فقط لـ Gateway البعيد ولا يثبّت حزم Plugin محلية.
- `--allow-unconfigured` هو منفذ هروب منفصل في وقت تشغيل Gateway. لا يعني أن الإعداد يجوز له حذف `gateway.mode`.

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

- ما لم تمرّر `--skip-health`، ينتظر الإعداد Gateway محليًا قابلًا للوصول قبل أن يخرج بنجاح.
- يبدأ `--install-daemon` مسار تثبيت Gateway المُدار أولًا. من دونه، يجب أن يكون لديك Gateway محلي قيد التشغيل بالفعل، مثل `openclaw gateway run`.
- إذا كنت تريد فقط كتابة الإعدادات/مساحة العمل/التمهيد في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرّر `--skip-bootstrap` لضبط `agents.defaults.skipBootstrap: true` وتخطي إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام Scheduled Tasks أولًا ثم يعود إلى عنصر تسجيل دخول في مجلد Startup لكل مستخدم إذا رُفض إنشاء المهمة.

سلوك الإعداد التفاعلي مع وضع المرجع:

- اختر **استخدام مرجع سرّي** عند مطالبتك.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - مزوّد أسرار مكوّن (`file` أو `exec`)
- ينفّذ الإعداد تحققًا تمهيديًا سريعًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.

### خيارات نقطة نهاية Z.AI غير التفاعلية

<Note>
يكتشف `--auth-choice zai-api-key` تلقائيًا أفضل نقطة نهاية ونموذج من Z.AI
لمفتاحك. تفضّل نقاط نهاية Coding Plan `zai/glm-5.2`؛ وتستخدم نقاط نهاية API العامة
`zai/glm-5.1`. لفرض نقطة نهاية Coding Plan، اختر `zai-coding-global` أو
`zai-coding-cn`.
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
  <Accordion title="أنواع المسار">
    - `quickstart`: مطالبات قليلة، وينشئ رمز Gateway تلقائيًا.
    - `manual`: مطالبات كاملة للمنفذ والربط والمصادقة (اسم مستعار لـ `advanced`).
    - `import`: يشغّل مزوّد ترحيل مكتشفًا، ويعاين الخطة، ثم يطبّقها بعد التأكيد.

  </Accordion>
  <Accordion title="التصفية المسبقة للمزوّدين">
    عندما يتضمن خيار المصادقة مزوّدًا مفضلًا، يصفي الإعداد مسبقًا أدوات اختيار النموذج الافتراضي وقائمة السماح إلى ذلك المزوّد. بالنسبة إلى Volcengine وBytePlus، يطابق هذا أيضًا متغيرات خطة البرمجة (`volcengine-plan/*`، `byteplus-plan/*`).

    إذا لم ينتج عن مرشح المزوّد المفضل أي نماذج محمّلة بعد، يعود الإعداد إلى الكتالوج غير المصفّى بدلًا من ترك أداة الاختيار فارغة.

  </Accordion>
  <Accordion title="متابعات البحث عبر الويب">
    تؤدي بعض مزوّدات البحث عبر الويب إلى مطالبات متابعة خاصة بالمزوّد:

    - يمكن لـ **Grok** أن يعرض إعداد `x_search` اختياريًا باستخدام ملف xAI OAuth نفسه أو مفتاح API واختيار نموذج `x_search`.
    - يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج بحث الويب الافتراضي من Kimi.

  </Accordion>
  <Accordion title="سلوكيات أخرى">
    - سلوك نطاق الرسائل المباشرة في الإعداد المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
    - أسرع محادثة أولى: `openclaw dashboard` (واجهة Control UI، بلا إعداد قناة).
    - مزوّد مخصص: اتصل بأي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك المزوّدون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.
    - إذا اكتُشفت حالة Hermes، يعرض الإعداد مسار ترحيل. استخدم [Migrate](/ar/cli/migrate) لخطط التشغيل التجريبي، ووضع الاستبدال، والتقارير، والتعيينات الدقيقة.

  </Accordion>
</AccordionGroup>

## أوامر متابعة شائعة

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

استخدم `openclaw setup` كنقطة دخول الإعداد الموجّه نفسها. استخدم `openclaw setup --baseline` عندما تحتاج فقط إلى إعدادات/مساحة عمل أساسية، و`openclaw configure` لاحقًا للتغييرات المستهدفة، و`openclaw channels add` لإعداد القنوات فقط.

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` للبرامج النصية.
</Note>
