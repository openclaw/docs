---
read_when:
    - تريد إعدادًا موجهًا لـ Gateway، ومساحة العمل، والمصادقة، والقنوات، وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي)
title: الإعداد الأولي
x-i18n:
    generated_at: "2026-06-27T17:23:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

إعداد إرشادي كامل لإعداد Gateway محلي أو بعيد. استخدم هذا عندما تريد أن يرشدك OpenClaw عبر مصادقة النموذج، ومساحة العمل، وGateway، والقنوات، وSkills، والصحة ضمن تدفق واحد.

## الأدلة ذات الصلة

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/ar/start/wizard" icon="rocket">
    شرح تفصيلي لتدفق CLI التفاعلي.
  </Card>
  <Card title="Onboarding overview" href="/ar/start/onboarding-overview" icon="map">
    كيف تترابط عملية الإعداد في OpenClaw.
  </Card>
  <Card title="CLI setup reference" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات، والتفاصيل الداخلية، وسلوك كل خطوة.
  </Card>
  <Card title="CLI automation" href="/ar/start/wizard-cli-automation" icon="terminal">
    أعلام غير تفاعلية وإعدادات مبرمجة.
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

يستخدم `--flow import` موفري ترحيل مملوكين للـ Plugin مثل Hermes. يعمل فقط على إعداد OpenClaw جديد؛ إذا كانت هناك ملفات إعدادات أو بيانات اعتماد أو جلسات أو ملفات ذاكرة/هوية مساحة عمل موجودة، فأعد الضبط أو اختر إعدادًا جديدًا قبل الاستيراد.

يبدأ `--modern` معاينة الإعداد التحاورية من Crestodian. بدون
`--modern`، يحافظ `openclaw onboard` على تدفق الإعداد الكلاسيكي.

في تثبيت جديد يكون فيه ملف الإعدادات النشط مفقودًا أو لا يحتوي على إعدادات
مؤلفة (فارغ أو يحتوي على بيانات وصفية فقط)، يبدأ `openclaw` وحده أيضًا تدفق
الإعداد الكلاسيكي. بمجرد أن يحتوي ملف إعدادات على إعدادات مؤلفة، يفتح
`openclaw` وحده Crestodian بدلًا من ذلك.

يُقبل `ws://` بنص عادي لعناوين Gateway الخاصة بـ loopback، وحروف IP الخاصة، و`.local`، و
Tailnet `*.ts.net`. للأسماء الأخرى الموثوقة ضمن DNS الخاص، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد.

## اللغة المحلية

يستخدم الإعداد التفاعلي لغة معالج CLI للنصوص الثابتة الخاصة بالإعداد. ترتيب
الحل هو:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. الرجوع إلى الإنجليزية

لغات المعالج المدعومة هي `en` و`zh-CN` و`zh-TW`. قد تستخدم قيم اللغة المحلية
صيغة الشرطة السفلية أو لاحقات POSIX مثل `zh_CN.UTF-8`. تبقى أسماء المنتجات،
وأسماء الأوامر، ومفاتيح الإعدادات، وعناوين URL، ومعرفات المزوّدين، ومعرفات النماذج، وتسميات Plugin/القناة
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

يُعد `--custom-api-key` اختياريًا في الوضع غير التفاعلي. إذا حُذف، يتحقق الإعداد من `CUSTOM_API_KEY`.
يعلّم OpenClaw معرفات نماذج الرؤية الشائعة على أنها تدعم الصور تلقائيًا. مرّر `--custom-image-input` لمعرفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات وصفية نصية فقط.
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

تكون القيمة الافتراضية لـ `--custom-base-url` هي `http://127.0.0.1:11434`. يُعد `--custom-model-id` اختياريًا؛ إذا حُذف، يستخدم الإعداد القيم الافتراضية المقترحة من Ollama. تعمل هنا أيضًا معرفات النماذج السحابية مثل `kimi-k2.5:cloud`.

خزّن مفاتيح المزوّدين كمراجع بدلًا من نص عادي:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد مراجع مدعومة بالبيئة بدلًا من قيم مفاتيح بنص عادي.
بالنسبة للمزوّدين المدعومين بملف تعريف مصادقة، يكتب هذا إدخالات `keyRef`؛ وبالنسبة للمزوّدين المخصصين، يكتب `models.providers.<id>.apiKey` كمرجع بيئة (على سبيل المثال `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- اضبط متغير بيئة المزوّد في بيئة عملية الإعداد (على سبيل المثال `OPENAI_API_KEY`).
- لا تمرر أعلام مفاتيح مضمّنة (على سبيل المثال `--openai-api-key`) إلا إذا كان متغير البيئة هذا مضبوطًا أيضًا.
- إذا مُرر علم مفتاح مضمّن بدون متغير البيئة المطلوب، يفشل الإعداد سريعًا مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- يخزن `--gateway-auth token --gateway-token <token>` رمزًا بنص عادي.
- يخزن `--gateway-auth token --gateway-token-ref-env <name>` قيمة `gateway.auth.token` كـ SecretRef بيئي.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزًا، يتم التحقق من رموز Gateway المُدارة عبر SecretRef ولكن لا تُحفظ كنص عادي محلول في بيانات تعريف بيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، يفشل الإعداد مغلقًا مع إرشادات معالجة.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير مضبوط، يمنع الإعداد التثبيت حتى يُضبط الوضع صراحة.
- يكتب الإعداد المحلي `gateway.mode="local"` في الإعدادات. إذا كان ملف إعدادات لاحق يفتقد `gateway.mode`، فتعامل مع ذلك كتلف في الإعدادات أو تعديل يدوي غير مكتمل، وليس كاختصار صالح لوضع محلي.
- يثبت الإعداد المحلي الـ Plugins المحددة القابلة للتنزيل عندما يتطلبها مسار الإعداد المختار.
- يكتب الإعداد البعيد معلومات الاتصال فقط لـ Gateway البعيد ولا يثبت حزم Plugin محلية.
- `--allow-unconfigured` هو مخرج طوارئ منفصل لوقت تشغيل Gateway. لا يعني أن الإعداد يمكنه حذف `gateway.mode`.

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
- يبدأ `--install-daemon` مسار تثبيت Gateway المُدار أولًا. بدونه، يجب أن يكون لديك Gateway محلي قيد التشغيل بالفعل، على سبيل المثال `openclaw gateway run`.
- إذا كنت تريد فقط كتابة الإعدادات/مساحة العمل/bootstrap في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرر `--skip-bootstrap` لضبط `agents.defaults.skipBootstrap: true` وتجاوز إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام Scheduled Tasks أولًا ثم يرجع إلى عنصر تسجيل دخول في مجلد بدء التشغيل لكل مستخدم إذا رُفض إنشاء المهمة.

سلوك الإعداد التفاعلي مع وضع المرجع:

- اختر **استخدام مرجع سر** عند المطالبة.
- ثم اختر أحد الخيارين:
  - متغير بيئة
  - موفّر أسرار مكوّن (`file` أو `exec`)
- ينفذ الإعداد تحققًا تمهيديًا سريعًا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.

### اختيارات نقاط نهاية Z.AI غير التفاعلية

<Note>
يكتشف `--auth-choice zai-api-key` تلقائيًا أفضل نقطة نهاية ونموذج Z.AI
لمفتاحك. تفضل نقاط نهاية Coding Plan `zai/glm-5.2`؛ وتستخدم نقاط نهاية API العامة
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

## ملاحظات التدفق

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: مطالبات بسيطة، وينشئ رمز Gateway تلقائيًا.
    - `manual`: مطالبات كاملة للمنفذ والربط والمصادقة (اسم مستعار لـ `advanced`).
    - `import`: يشغّل موفّر ترحيل مكتشفًا، ويعاين الخطة، ثم يطبقها بعد التأكيد.

  </Accordion>
  <Accordion title="Provider prefiltering">
    عندما يشير اختيار مصادقة إلى مزوّد مفضل، يرشّح الإعداد مسبقًا منتقيي النموذج الافتراضي وقائمة السماح لذلك المزوّد. بالنسبة إلى Volcengine وBytePlus، يطابق هذا أيضًا متغيرات خطة الترميز (`volcengine-plan/*` و`byteplus-plan/*`).

    إذا لم ينتج عن مرشح المزوّد المفضل أي نماذج محملة بعد، يرجع الإعداد إلى الكتالوج غير المرشح بدلًا من ترك المنتقي فارغًا.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    تشغّل بعض مزوّدات البحث على الويب مطالبات متابعة خاصة بالمزوّد:

    - يمكن أن يعرض **Grok** إعداد `x_search` اختياريًا باستخدام ملف تعريف xAI OAuth نفسه أو مفتاح API نفسه واختيار نموذج `x_search`.
    - يمكن أن يطلب **Kimi** منطقة Moonshot API (`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج بحث الويب الافتراضي لـ Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - سلوك نطاق DM في الإعداد المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
    - أسرع محادثة أولى: `openclaw dashboard` (Control UI، بدون إعداد قناة).
    - مزوّد مخصص: صِل أي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك المزوّدون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.
    - إذا اكتُشفت حالة Hermes، يعرض الإعداد تدفق ترحيل. استخدم [الترحيل](/ar/cli/migrate) لخطط dry-run، ووضع الاستبدال، والتقارير، والتعيينات الدقيقة.

  </Accordion>
</AccordionGroup>

## أوامر متابعة شائعة

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

استخدم `openclaw setup` بدلًا من ذلك عندما تحتاج فقط إلى إعدادات/مساحة عمل أساسية. استخدم `openclaw configure` لاحقًا للتغييرات المستهدفة و`openclaw channels add` لإعداد القنوات فقط.

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` للبرامج النصية.
</Note>
