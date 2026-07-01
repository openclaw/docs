---
read_when:
    - تريد إعدادًا موجّهًا لـ Gateway، ومساحة العمل، والمصادقة، والقنوات، وSkills
summary: مرجع CLI لـ `openclaw onboard` (الإعداد التفاعلي)
title: بدء الاستخدام
x-i18n:
    generated_at: "2026-07-01T13:04:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

تهيئة إرشادية كاملة لإعداد Gateway محلي أو بعيد. استخدم هذا عندما تريد من OpenClaw إرشادك خلال مصادقة النموذج، ومساحة العمل، وGateway، والقنوات، وSkills، والصحة في تدفق واحد.

## الأدلة ذات الصلة

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/ar/start/wizard" icon="rocket">
    شرح تفصيلي لتدفق CLI التفاعلي.
  </Card>
  <Card title="Onboarding overview" href="/ar/start/onboarding-overview" icon="map">
    كيف تترابط تهيئة OpenClaw.
  </Card>
  <Card title="CLI setup reference" href="/ar/start/wizard-cli-reference" icon="book">
    المخرجات، والتفاصيل الداخلية، والسلوك لكل خطوة.
  </Card>
  <Card title="CLI automation" href="/ar/start/wizard-cli-automation" icon="terminal">
    أعلام غير تفاعلية وإعدادات مُبرمجة.
  </Card>
  <Card title="macOS app onboarding" href="/ar/start/onboarding" icon="apple">
    تدفق التهيئة لتطبيق شريط قوائم macOS.
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

يستخدم `--flow import` موفري ترحيل مملوكين للـ plugin مثل Hermes. يعمل فقط على إعداد OpenClaw جديد؛ إذا كانت هناك إعدادات أو بيانات اعتماد أو جلسات أو ملفات ذاكرة/هوية مساحة عمل موجودة، فأعد الضبط أو اختر إعدادًا جديدًا قبل الاستيراد.

يبدأ `--modern` معاينة تهيئة Crestodian الحوارية. بدون
`--modern`، يحافظ `openclaw onboard` على تدفق التهيئة الكلاسيكي.

في تثبيت جديد حيث يكون ملف الإعداد النشط مفقودًا أو لا يحتوي على إعدادات
مؤلفة (فارغ أو يحتوي على بيانات وصفية فقط)، يبدأ `openclaw` المجرد أيضًا
تدفق التهيئة الكلاسيكي. بمجرد أن يحتوي ملف إعداد على إعدادات مؤلفة، يفتح
`openclaw` المجرد Crestodian بدلًا من ذلك.

يُقبل النص الصريح `ws://` لعناوين loopback، وعناوين IP الخاصة الحرفية، و`.local`،
وعناوين Gateway على Tailnet بصيغة `*.ts.net`. لأسماء private-DNS الموثوقة الأخرى، عيّن
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` في بيئة عملية التهيئة.

## اللغة المحلية

تستخدم التهيئة التفاعلية لغة معالج CLI لنصوص الإعداد الثابتة. ترتيب
الحل هو:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. الرجوع إلى الإنجليزية

لغات المعالج المدعومة هي `en` و`zh-CN` و`zh-TW`. قد تستخدم قيم اللغة المحلية
أشكال الشرطة السفلية أو لاحقات POSIX مثل `zh_CN.UTF-8`. تظل أسماء المنتجات،
وأسماء الأوامر، ومفاتيح الإعداد، وعناوين URL، ومعرفات الموفرين، ومعرفات النماذج، وتسميات plugin/channel
حرفية.

مثال:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key` اختياري في الوضع غير التفاعلي. إذا حُذف، تتحقق التهيئة من `CUSTOM_API_KEY`.
يعلّم OpenClaw معرفات نماذج الرؤية الشائعة كقادرة على الصور تلقائيًا. مرّر `--custom-image-input` لمعرفات الرؤية المخصصة غير المعروفة، أو `--custom-text-input` لفرض بيانات وصفية نصية فقط.
استخدم `--custom-compatibility openai-responses` لنقاط النهاية المتوافقة مع OpenAI التي تدعم `/v1/responses` ولكن لا تدعم `/v1/chat/completions`.

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

تكون القيمة الافتراضية لـ `--custom-base-url` هي `http://127.0.0.1:11434`. `--custom-model-id` اختياري؛ إذا حُذف، تستخدم التهيئة الإعدادات الافتراضية المقترحة من Ollama. تعمل معرفات النماذج السحابية مثل `kimi-k2.5:cloud` هنا أيضًا.

خزّن مفاتيح الموفرين كمراجع بدلًا من نص صريح:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

مع `--secret-input-mode ref`، تكتب التهيئة مراجع مدعومة بمتغيرات البيئة بدلًا من قيم مفاتيح بنص صريح.
للموفرين المدعومين بملف تعريف المصادقة، يكتب هذا إدخالات `keyRef`؛ وللموفرين المخصصين، يكتب هذا `models.providers.<id>.apiKey` كمرجع بيئة (مثلًا `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

عقد وضع `ref` غير التفاعلي:

- عيّن متغير بيئة الموفر في بيئة عملية التهيئة (مثلًا `OPENAI_API_KEY`).
- لا تمرر أعلام مفاتيح مضمنة (مثلًا `--openai-api-key`) إلا إذا كان متغير البيئة ذاك معيّنًا أيضًا.
- إذا مُرر علم مفتاح مضمن بدون متغير البيئة المطلوب، تفشل التهيئة سريعًا مع إرشادات.

خيارات رمز Gateway في الوضع غير التفاعلي:

- يخزن `--gateway-auth token --gateway-token <token>` رمزًا بنص صريح.
- يخزن `--gateway-auth token --gateway-token-ref-env <name>` القيمة `gateway.auth.token` كـ SecretRef بيئي.
- `--gateway-token` و`--gateway-token-ref-env` متنافيان.
- يتطلب `--gateway-token-ref-env` متغير بيئة غير فارغ في بيئة عملية التهيئة.
- مع `--install-daemon`، عندما تتطلب مصادقة الرمز رمزًا، تُتحقق رموز Gateway المدارة بـ SecretRef ولكن لا تُحفظ كنص صريح محلول في بيانات وصفية لبيئة خدمة المشرف.
- مع `--install-daemon`، إذا كان وضع الرمز يتطلب رمزًا وكان SecretRef للرمز المكوّن غير محلول، تفشل التهيئة بإغلاق آمن مع إرشادات إصلاح.
- مع `--install-daemon`، إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معيّن، تمنع التهيئة التثبيت حتى يُعيّن الوضع صراحة.
- تكتب التهيئة المحلية `gateway.mode="local"` في الإعداد. إذا افتقد ملف إعداد لاحق `gateway.mode`، فتعامل مع ذلك كتلف إعداد أو تعديل يدوي غير مكتمل، وليس كاختصار صالح لوضع محلي.
- تثبت التهيئة المحلية Plugins المختارة القابلة للتنزيل عندما يتطلبها مسار الإعداد المختار.
- تكتب التهيئة البعيدة معلومات الاتصال فقط لـ Gateway البعيد ولا تثبت حزم plugin محلية.
- `--allow-unconfigured` هو منفذ هروب منفصل لوقت تشغيل Gateway. لا يعني أن التهيئة يمكنها حذف `gateway.mode`.

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

- ما لم تمرر `--skip-health`، تنتظر التهيئة Gateway محليًا يمكن الوصول إليه قبل أن تخرج بنجاح.
- يبدأ `--install-daemon` مسار تثبيت Gateway المُدار أولًا. بدونه، يجب أن يكون لديك Gateway محلي قيد التشغيل مسبقًا، مثل `openclaw gateway run`.
- إذا كنت تريد فقط كتابات الإعداد/مساحة العمل/bootstrap في الأتمتة، فاستخدم `--skip-health`.
- إذا كنت تدير ملفات مساحة العمل بنفسك، فمرر `--skip-bootstrap` لتعيين `agents.defaults.skipBootstrap: true` وتخطي إنشاء `AGENTS.md` و`SOUL.md` و`TOOLS.md` و`IDENTITY.md` و`USER.md` و`HEARTBEAT.md` و`BOOTSTRAP.md`.
- على Windows الأصلي، يحاول `--install-daemon` استخدام Scheduled Tasks أولًا ثم يرجع إلى عنصر تسجيل دخول في مجلد Startup لكل مستخدم إذا رُفض إنشاء المهمة.

سلوك التهيئة التفاعلية مع وضع المرجع:

- اختر **استخدام مرجع سري** عند المطالبة.
- ثم اختر أحدهما:
  - متغير بيئة
  - موفر سر مكوّن (`file` أو `exec`)
- تجري التهيئة تحققًا سريعًا مسبقًا قبل حفظ المرجع.
  - إذا فشل التحقق، تعرض التهيئة الخطأ وتتيح لك إعادة المحاولة.

### اختيارات نقطة نهاية Z.AI غير التفاعلية

<Note>
يكتشف `--auth-choice zai-api-key` أفضل نقطة نهاية ونموذج Z.AI تلقائيًا
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

## أعلام غير تفاعلية إضافية

مصادقة نموذج قائمة على الرمز (غير تفاعلية؛ تُستخدم مع `--auth-choice token`):

- `--token-provider <id>` — معرف موفر الرمز. يحدد أي موفر يصدر الرمز.
- `--token <token>` — قيمة الرمز لمصادقة النموذج.
- `--token-profile-id <id>` — معرف ملف تعريف المصادقة. التخزين العام للرموز يستخدم افتراضيًا `<provider>:manual`؛ وقد تستخدم تدفقات الإعداد المملوكة للموفر افتراضيتها الخاصة، مثل `anthropic:default`.
- `--token-expires-in <duration>` — مدة انتهاء صلاحية الرمز اختيارية (مثل `365d`، `12h`).

Cloudflare AI Gateway (غير تفاعلي):

- `--cloudflare-ai-gateway-account-id <id>` — معرف حساب Cloudflare للتوجيه عبر Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — معرف Cloudflare AI Gateway.

التحكم في تثبيت daemon:

- `--no-install-daemon` — تخطي تثبيت خدمة Gateway صراحة.
- `--skip-daemon` — اسم مستعار لـ `--no-install-daemon`.

التحكم في إعداد الواجهة والخطاف:

- `--skip-ui` — تخطي مطالبات Control UI / TUI أثناء التهيئة.
- `--skip-hooks` — تخطي مطالبات إعداد webhook / hook أثناء التهيئة.

كتم المخرجات:

- `--suppress-gateway-token-output` — كتم مخرجات Gateway/UI التي تحتوي على رموز (تلميحات الرموز، وعنوان URL لتسجيل الدخول التلقائي مع رمز مضمن، وتشغيل Control UI التلقائي). مفيد في بيئات الطرفية المشتركة وCI.

## ملاحظات التدفق

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: مطالبات بسيطة، ينشئ رمز Gateway تلقائيًا.
    - `manual`: مطالبات كاملة للمنفذ والربط والمصادقة (اسم مستعار لـ `advanced`).
    - `import`: يشغّل موفر ترحيل مكتشفًا، ويعاين الخطة، ثم يطبقها بعد التأكيد.

  </Accordion>
  <Accordion title="Provider prefiltering">
    عندما يشير اختيار المصادقة إلى موفر مفضل، ترشح التهيئة مسبقًا منتقيات النموذج الافتراضي وقائمة السماح لذلك الموفر. بالنسبة إلى Volcengine وBytePlus، يطابق هذا أيضًا متغيرات coding-plan (`volcengine-plan/*`، `byteplus-plan/*`).

    إذا لم ينتج مرشح الموفر المفضل أي نماذج محملة بعد، ترجع التهيئة إلى الكتالوج غير المرشح بدلًا من ترك المنتقي فارغًا.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    تؤدي بعض موفري بحث الويب إلى مطالبات متابعة خاصة بالموفر:

    - يمكن لـ **Grok** تقديم إعداد `x_search` اختياري باستخدام ملف تعريف xAI OAuth نفسه أو مفتاح API واختيار نموذج `x_search`.
    - يمكن لـ **Kimi** طلب منطقة Moonshot API (`api.moonshot.ai` مقابل `api.moonshot.cn`) ونموذج بحث الويب الافتراضي من Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - سلوك نطاق الرسائل المباشرة في التهيئة المحلية: [مرجع إعداد CLI](/ar/start/wizard-cli-reference#outputs-and-internals).
    - أسرع محادثة أولى: `openclaw dashboard` (Control UI، بدون إعداد قناة).
    - موفر مخصص: اتصل بأي نقطة نهاية متوافقة مع OpenAI أو Anthropic، بما في ذلك الموفرون المستضافون غير المدرجين. استخدم Unknown للاكتشاف التلقائي.
    - إذا اكتُشفت حالة Hermes، تعرض التهيئة تدفق ترحيل. استخدم [الترحيل](/ar/cli/migrate) لخطط dry-run، ووضع الاستبدال، والتقارير، والتعيينات الدقيقة.

  </Accordion>
</AccordionGroup>

## أوامر متابعة شائعة

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

استخدم `openclaw setup` كنقطة دخول التهيئة الإرشادية نفسها. استخدم `openclaw setup --baseline` عندما تحتاج فقط إلى إعداد/مساحة عمل أساسيين، و`openclaw configure` لاحقًا للتغييرات المستهدفة، و`openclaw channels add` لإعداد القنوات فقط.

<Note>
لا يعني `--json` الوضع غير التفاعلي. استخدم `--non-interactive` للسكربتات.
</Note>
