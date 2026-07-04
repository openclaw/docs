---
read_when:
    - تريد إعدادًا موجّهًا لـ Gateway، ومساحة العمل، والمصادقة، والقنوات، وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي)
title: الإعداد الأولي
x-i18n:
    generated_at: "2026-07-04T20:33:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

إعداد إرشادي كامل لإعداد Gateway محلي أو بعيد. استخدم هذا عندما تريد أن يرشدك OpenClaw عبر مصادقة النماذج، ومساحة العمل، وGateway، والقنوات، وSkills، والصحة في تدفق واحد.

## الأدلة ذات الصلة

<CardGroup cols={2}>
  <Card title="مركز إعداد CLI" href="/ar/start/wizard" icon="rocket">
    شرح تفصيلي لتدفق CLI التفاعلي.
  </Card>
  <Card title="نظرة عامة على الإعداد" href="/ar/start/onboarding-overview" icon="map">
    كيف تترابط عملية إعداد OpenClaw.
  </Card>
  <Card title="مرجع إعداد CLI" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات، والتفاصيل الداخلية، وسلوك كل خطوة.
  </Card>
  <Card title="أتمتة CLI" href="/ar/start/wizard-cli-automation" icon="terminal">
    أعلام التشغيل غير التفاعلي والإعدادات النصية.
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

يستخدم `--flow import` مزودي ترحيل مملوكين من Plugin مثل Hermes. لا يعمل إلا على إعداد OpenClaw جديد؛ إذا كانت هناك ملفات إعدادات أو بيانات اعتماد أو جلسات أو ملفات ذاكرة/هوية مساحة العمل موجودة، فأعد الضبط أو اختر إعدادا جديدا قبل الاستيراد.

يبدأ `--modern` معاينة إعداد Crestodian الحواري. من دون
`--modern`، يحتفظ `openclaw onboard` بتدفق الإعداد الكلاسيكي.

في طرفية تفاعلية، يوجه `openclaw` وحده (من دون أمر فرعي) بحسب حالة
الإعدادات:

- إذا كان ملف الإعدادات النشط مفقودا أو لا يحتوي على إعدادات مكتوبة (فارغ أو
  يحتوي على بيانات وصفية فقط)، فسيبدأ تدفق الإعداد الكلاسيكي هذا.
- إذا كان ملف الإعدادات موجودا لكنه يفشل في التحقق، فسيبدأ
  [Crestodian](/ar/cli/crestodian) للإصلاح.
- إذا كان ملف الإعدادات صالحا، فسيفتح TUI العادي للوكيل، إما محليا
  أو متصلا بGateway معد ومتاح. في تثبيت معد،
  يمكنك الوصول إلى Crestodian باستخدام `/crestodian` داخل TUI أو `openclaw crestodian`.

يقبل نص `ws://` العادي لعناوين local loopback، وحروف IP الخاصة، و`.local`، وعناوين
Gateway في Tailnet بصيغة `*.ts.net`. لأسماء DNS الخاصة الموثوقة الأخرى، اضبط
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية الإعداد.

## اللغة المحلية

يستخدم الإعداد التفاعلي لغة معالج CLI لنصوص الإعداد الثابتة. ترتيب الحسم
هو:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. الرجوع إلى الإنجليزية

لغات المعالج المدعومة هي `en` و`zh-CN` و`zh-TW`. قد تستخدم قيم اللغة المحلية
صيغة الشرطة السفلية أو لواحق POSIX مثل `zh_CN.UTF-8`. تبقى أسماء المنتجات، وأسماء
الأوامر، ومفاتيح الإعدادات، وعناوين URL، ومعرفات المزودين، ومعرفات النماذج، وتسميات Plugin/القنوات
حرفية.

مثال:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

مزود مخصص غير تفاعلي:

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
يضع OpenClaw تلقائيا علامة القدرة على الصور لمعرفات نماذج الرؤية الشائعة. مرر `--custom-image-input` لمعرفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات وصفية للنص فقط.
استخدم `--custom-compatibility openai-responses` لنقاط النهاية المتوافقة مع OpenAI التي تدعم `/v1/responses` لكنها لا تدعم `/v1/chat/completions`.

يدعم LM Studio أيضا علم مفتاح خاصا بالمزود في الوضع غير التفاعلي:

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

القيمة الافتراضية لـ`--custom-base-url` هي `http://127.0.0.1:11434`. `--custom-model-id` اختياري؛ إذا حُذف، يستخدم الإعداد القيم الافتراضية المقترحة من Ollama. تعمل هنا أيضا معرفات النماذج السحابية مثل `kimi-k2.5:cloud`.

خزن مفاتيح المزود كمراجع بدلا من نص عادي:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، يكتب الإعداد مراجع مدعومة بمتغيرات البيئة بدلا من قيم مفاتيح بنص عادي.
بالنسبة إلى المزودين المدعومين بملف مصادقة، يكتب هذا إدخالات `keyRef`؛ وبالنسبة إلى المزودين المخصصين، يكتب `models.providers.<id>.apiKey` كمرجع بيئة (مثلا `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- اضبط متغير بيئة المزود في بيئة عملية الإعداد (مثلا `OPENAI_API_KEY`).
- لا تمرر أعلام المفاتيح المضمنة (مثلا `--openai-api-key`) إلا إذا كان متغير البيئة ذاك مضبوطا أيضا.
- إذا مُرر علم مفتاح مضمن من دون متغير البيئة المطلوب، يفشل الإعداد بسرعة مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- `--gateway-auth token --gateway-token <token>` يخزن رمزا بنص عادي.
- `--gateway-auth token --gateway-token-ref-env <name>` يخزن `gateway.auth.token` كـ SecretRef بيئي.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية الإعداد.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزا، يتم التحقق من رموز Gateway المدارة عبر SecretRef لكن لا تُحفظ كنص عادي محلول في بيانات وصفية لبيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزا وكان SecretRef الخاص بالرمز المعد غير محلول، يفشل الإعداد بإغلاق آمن مع إرشادات إصلاح.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` معدين وكان `gateway.auth.mode` غير مضبوط، يحظر الإعداد التثبيت حتى يُضبط الوضع صراحة.
- يكتب الإعداد المحلي `gateway.mode="local"` في الإعدادات. إذا افتقد ملف إعدادات لاحق `gateway.mode`، فتعامل مع ذلك كتلف في الإعدادات أو تعديل يدوي غير مكتمل، لا كاختصار صالح للوضع المحلي.
- يثبت الإعداد المحلي Plugins القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار.
- لا يكتب الإعداد البعيد إلا معلومات الاتصال بGateway البعيد ولا يثبت حزم Plugin محلية.
- `--allow-unconfigured` هو منفذ هروب منفصل لتشغيل Gateway. ولا يعني أن الإعداد قد يحذف `gateway.mode`.

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

- ما لم تمرر `--skip-health`، ينتظر الإعداد Gateway محليا قابلا للوصول قبل أن يخرج بنجاح.
- يبدأ `--install-daemon` مسار تثبيت Gateway المدار أولا. ومن دونه، يجب أن يكون لديك Gateway محلي يعمل مسبقا، مثلا `openclaw gateway run`.
- إذا كنت تريد فقط كتابة الإعدادات/مساحة العمل/التمهيد في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرر `--skip-bootstrap` لضبط `agents.defaults.skipBootstrap: true` وتخطي إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام المهام المجدولة أولا ثم يرجع إلى عنصر تسجيل دخول في مجلد بدء التشغيل لكل مستخدم إذا رُفض إنشاء المهمة.

سلوك الإعداد التفاعلي مع وضع المراجع:

- اختر **استخدام مرجع سر** عند المطالبة.
- ثم اختر إما:
  - متغير بيئة
  - مزود أسرار معد (`file` أو `exec`)
- يجري الإعداد تحققا تمهيديا سريعا قبل حفظ المرجع.
  - إذا فشل التحقق، يعرض الإعداد الخطأ ويتيح لك إعادة المحاولة.

### اختيارات نقاط نهاية Z.AI غير التفاعلية

<Note>
يكتشف `--auth-choice zai-api-key` تلقائيا أفضل نقطة نهاية ونموذج من Z.AI
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

## أعلام إضافية غير تفاعلية

مصادقة النماذج القائمة على الرمز (غير تفاعلية؛ تُستخدم مع `--auth-choice token`):

- `--token-provider <id>` — معرف مزود الرمز. يحدد أي مزود يصدر الرمز.
- `--token <token>` — قيمة الرمز لمصادقة النموذج.
- `--token-profile-id <id>` — معرف ملف المصادقة. يتخلف التخزين العام للرموز إلى `<provider>:manual`؛ وقد تستخدم تدفقات الإعداد المملوكة للمزود قيمتها الافتراضية الخاصة، مثل `anthropic:default`.
- `--token-expires-in <duration>` — مدة انتهاء صلاحية اختيارية للرمز (مثل `365d` و`12h`).

Cloudflare AI Gateway (غير تفاعلي):

- `--cloudflare-ai-gateway-account-id <id>` — معرف حساب Cloudflare للتوجيه عبر Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — معرف Cloudflare AI Gateway.

التحكم في تثبيت Daemon:

- `--no-install-daemon` — تخطي تثبيت خدمة Gateway صراحة.
- `--skip-daemon` — اسم مستعار لـ`--no-install-daemon`.

التحكم في إعداد الواجهة والخطافات:

- `--skip-ui` — تخطي مطالبات Control UI / TUI أثناء الإعداد.
- `--skip-hooks` — تخطي مطالبات إعداد Webhook / الخطاف أثناء الإعداد.

كتم المخرجات:

- `--suppress-gateway-token-output` — كتم مخرجات Gateway/الواجهة التي تحمل رموزا (تلميحات الرمز، ورابط تسجيل الدخول التلقائي الذي يحتوي على رمز مضمن، والتشغيل التلقائي لـControl UI). مفيد في الطرفيات المشتركة وبيئات CI.

## ملاحظات التدفق

<AccordionGroup>
  <Accordion title="أنواع التدفق">
    - `quickstart`: مطالبات قليلة، وينشئ رمز Gateway تلقائيا.
    - `manual`: مطالبات كاملة للمنفذ والربط والمصادقة (اسم مستعار لـ`advanced`).
    - `import`: يشغل مزود ترحيل مكتشفا، ويعرض الخطة، ثم يطبقها بعد التأكيد.

  </Accordion>
  <Accordion title="تصفية المزودين مسبقا">
    عندما يتضمن اختيار المصادقة مزودا مفضلا، يصفي الإعداد مسبقا منتقيات النموذج الافتراضي وقائمة السماح إلى ذلك المزود. بالنسبة إلى Volcengine وBytePlus، يطابق هذا أيضا متغيرات خطة البرمجة (`volcengine-plan/*` و`byteplus-plan/*`).

    إذا لم ينتج عامل تصفية المزود المفضل أي نماذج محملة بعد، يرجع الإعداد إلى الفهرس غير المرشح بدلا من ترك المنتقي فارغا.

  </Accordion>
  <Accordion title="متابعات البحث على الويب">
    تطلق بعض مزودي البحث على الويب مطالبات متابعة خاصة بالمزود:

    - يمكن لـ**Grok** عرض إعداد `x_search` اختياري باستخدام ملف xAI OAuth نفسه أو مفتاح API نفسه واختيار نموذج `x_search`.
    - يمكن لـ**Kimi** طلب منطقة Moonshot API (`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج Kimi الافتراضي للبحث على الويب.

  </Accordion>
  <Accordion title="سلوكيات أخرى">
    - سلوك نطاق الرسائل المباشرة في الإعداد المحلي: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
    - أسرع محادثة أولى: `openclaw dashboard` (Control UI، من دون إعداد قناة).
    - مزود مخصص: اتصل بأي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك المزودون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.
    - إذا اكتُشفت حالة Hermes، يعرض الإعداد تدفق ترحيل. استخدم [الترحيل](/ar/cli/migrate) لخطط التجربة الجافة، ووضع الاستبدال، والتقارير، والخرائط الدقيقة.

  </Accordion>
</AccordionGroup>

## أوامر المتابعة الشائعة

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

استخدم `openclaw setup` كنقطة الدخول نفسها للإعداد الإرشادي الأولي. استخدم `openclaw setup --baseline` عندما تحتاج فقط إلى الإعدادات الأساسية/مساحة العمل الأساسية، و`openclaw configure` لاحقًا للتغييرات المستهدفة، و`openclaw channels add` لإعداد القناة فقط.

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` للبرامج النصية.
</Note>
