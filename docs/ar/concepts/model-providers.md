---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل موفّر على حدة
    - تريد أمثلة على التكوينات أو أوامر التهيئة الأولية عبر CLI لموفّري النماذج
sidebarTitle: Model providers
summary: نظرة عامة على مزوّدي النماذج مع أمثلة على الإعدادات وتدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-05-10T19:34:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 643ee88e7d0cf4f9fe148ae8e390a1d7bba4986c29dd4fda6074f048f58dd7bb
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع لـ **موفّري LLM/النماذج** (وليس قنوات المحادثة مثل WhatsApp/Telegram). لقواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع النماذج ومساعدات CLI">
    - تستخدم مراجع النماذج صيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - تعمل `agents.defaults.models` كقائمة سماح عند ضبطها.
    - مساعدات CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` القيم الافتراضية على مستوى الموفّر؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الاحتياط، ومجسّات التهدئة، واستمرارية تجاوزات الجلسات: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="إضافة مصادقة موفّر لا تغيّر نموذجك الأساسي">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` الموجودة عند إضافة موفّر أو إعادة مصادقته. قد تظل Pluginات الموفّرين تُرجع نموذجًا افتراضيًا موصى به في رقعة إعدادات المصادقة الخاصة بها، لكن configure يعامل ذلك على أنه "إتاحة هذا النموذج" عندما يكون هناك نموذج أساسي موجود بالفعل، وليس "استبدال النموذج الأساسي الحالي."

    للتبديل عمدًا إلى النموذج الافتراضي، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="فصل موفّر OpenAI عن وقت التشغيل">
    مسارات عائلة OpenAI خاصة بالبادئة:

    - يستخدم `openai/<model>` حزام خادم تطبيق Codex الأصلي لمنعطفات الوكيل افتراضيًا. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - `openai-codex/<model>` هو إعداد قديم يعيد doctor كتابته إلى `openai/<model>`.
    - يستخدم `openai/<model>` مع `agentRuntime.id: "pi"` على مستوى الموفّر/النموذج PI للمسارات الصريحة بمفتاح API أو مسارات التوافق.

    راجع [OpenAI](/ar/providers/openai) و[حزام Codex](/ar/plugins/codex-harness). إذا كان فصل الموفّر/وقت التشغيل مربكًا، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي للـ Plugin الحد نفسه: مراجع وكلاء `openai/*` تفعّل Plugin Codex للمسار الافتراضي، كما تتطلبها أيضًا مراجع `agentRuntime.id: "codex"` الصريحة على مستوى الموفّر/النموذج أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر حزام خادم تطبيق Codex الأصلي افتراضيًا على `openai/gpt-5.5`، وعبر PI فقط عندما تختار سياسة وقت التشغيل على مستوى الموفّر/النموذج `pi` صراحةً.

  </Accordion>
  <Accordion title="أوقات تشغيل CLI">
    تستخدم أوقات تشغيل CLI الفصل نفسه: اختر مراجع نماذج قياسية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط سياسة وقت التشغيل على مستوى الموفّر/النموذج إلى `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد خلفية CLI محلية.

    تُرحّل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة إلى مراجع موفّرين قياسية مع تسجيل وقت التشغيل بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك الموفّر المملوك للـ Plugin

توجد معظم المنطق الخاص بالموفّر داخل Pluginات الموفّرين (`registerProvider(...)`) بينما يحافظ OpenClaw على حلقة الاستدلال العامة. تملك Pluginات الموفّرين الإعداد الأولي، وكتالوجات النماذج، وتعيين متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات SDK الخاصة بالموفّرين وأمثلة Pluginات المدمجة في [Pluginات الموفّرين](/ar/plugins/sdk-provider-plugins). الموفّر الذي يحتاج منفّذ طلبات مخصصًا بالكامل هو سطح امتداد منفصل وأعمق.

<Note>
يعيش سلوك المشغّل المملوك للموفّر على خطافات موفّر صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف التدفق، ومساعدات النقل/الطلب. حقيبة `ProviderPlugin.capabilities` الثابتة القديمة للتوافق فقط، ولم يعد منطق المشغّل المشترك يقرأها.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="مصادر المفاتيح والأولوية">
    اضبط مفاتيح متعددة عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقّمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى موفّري Google، يتم أيضًا تضمين `GOOGLE_API_KEY` كخيار احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل تكرار القيم.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - يُعاد محاولة الطلبات بالمفتاح التالي فقط عند استجابات حدّ المعدل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حد الاستخدام الدورية).
    - تفشل الإخفاقات غير المتعلقة بحد المعدل فورًا؛ ولا تُجرى أي محاولة لتدوير المفاتيح.
    - عندما تفشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من المحاولة الأخيرة.

  </Accordion>
</AccordionGroup>

## الموفّرون المدمجون (كتالوج pi-ai)

يشحن OpenClaw مع كتالوج pi-ai. لا يحتاج هؤلاء الموفّرون إلى أي إعداد `models.providers`؛ اضبط المصادقة فقط واختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة نماذج: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- تحقّق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت محدد أو مفتاح API يتصرف بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto`؛ يمرّر OpenClaw اختيار النقل إلى pi-ai.
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يمكن تفعيل معالجة الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` بـ `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد طبقة صريحة بدلًا من مفتاح تبديل `/fast` المشترك
- تنطبق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator`، `version`، `User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس الوكلاء المتوافقين مع OpenAI بشكل عام
- تحتفظ مسارات OpenAI الأصلية أيضًا بـ `store` الخاصة بـ Responses، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتشكيل حمولة التوافق مع استدلال OpenAI؛ أما مسارات الوكيل فلا تفعل ذلك
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API الحية ترفضه وكتالوج Codex الحالي لا يعرضه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS`، `ANTHROPIC_API_KEY_1`، `ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال نموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح تبديل `/fast` المشترك و`params.fastMode`، بما في ذلك حركة المرور المرسلة إلى `api.anthropic.com` باستخدام مفتاح API أو مصادقة OAuth؛ يربط OpenClaw ذلك بـ `service_tier` لدى Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضّل على مرجع النموذج قياسيًا ويختار خلفية CLI
  بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agentRuntime.id: "claude-cli"` على نطاق النموذج. ما زالت مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا فريق Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يعامل OpenClaw إعادة استخدام Claude CLI واستخدام `claude -p` كأمور مصرّح بها لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- الموفّر: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مرجع نموذج PI القديم: `openai-codex/gpt-5.5`
- مرجع حزام خادم تطبيق Codex الأصلي: `openai/gpt-5.5`
- مستندات حزام خادم تطبيق Codex الأصلي: [حزام Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` Plugin OpenAI؛ ولا تُختار Plugin خادم تطبيق Codex الأصلية إلا بواسطة وقت تشغيل حزام Codex أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع SSE كاحتياطي)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` في طلبات Responses الأصلية الخاصة بـ Codex (`chatgpt.com/backend-api`)
- تُرفق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator`، `version`، `User-Agent`) فقط على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس الوكلاء المتوافقين مع OpenAI بشكل عام
- يشارك إعداد `/fast` نفسه وتكوين `params.fastMode` مثل `openai/*` المباشر؛ يربط OpenClaw ذلك بـ `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` قيمة `contextWindow = 400000` الأصلية من كتالوج Codex ووقت التشغيل الافتراضي `contextTokens = 272000`؛ تجاوز سقف وقت التشغيل باستخدام `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: OpenAI Codex OAuth مدعوم صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.
- بالنسبة إلى مسار الاشتراك الشائع مع وقت تشغيل Codex الأصلي، سجّل الدخول بمصادقة `openai-codex` لكن اضبط `openai/gpt-5.5`؛ تختار منعطفات وكيل OpenAI Codex افتراضيًا.
- استخدم `agentRuntime.id: "pi"` على مستوى الموفّر/النموذج فقط عندما تريد مسار توافق عبر PI؛ وإلا فأبقِ `openai/gpt-5.5` على حزام Codex الافتراضي.
- تم إخفاء مراجع `openai-codex/gpt-5.1*` و`openai-codex/gpt-5.2*` و`openai-codex/gpt-5.3*` الأقدم لأن حسابات ChatGPT/Codex OAuth ترفضها؛ استخدم `openai-codex/gpt-5.5` أو مسار وقت تشغيل Codex الأصلي بدلًا من ذلك.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### خيارات مستضافة أخرى بنمط الاشتراك

<CardGroup cols={3}>
  <Card title="نماذج GLM" href="/ar/providers/glm">
    خطة Z.AI Coding Plan أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    وصول MiniMax Coding Plan OAuth أو الوصول بمفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح موفّر Qwen Cloud بالإضافة إلى تعيين نقاط نهاية Alibaba DashScope وCoding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر وقت تشغيل Zen: `opencode`
- موفّر وقت تشغيل Go: `opencode-go`
- أمثلة نماذج: `opencode/claude-opus-4-6`، `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، واحتياطي `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- نماذج أمثلة: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- التوافق: تتم تسوية إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يتم قبول `google/gemini-3.1-pro` وتسويته إلى معرّف Gemini API المباشر من Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. يحذف Gemini 3/3.1 قيمة `thinkingLevel` ثابتة؛ بينما يرسل Gemini 2.5 القيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديمة) لتمرير مقبض أصلي للمزوّد بصيغة `cachedContents/...`؛ وتظهر إصابات ذاكرة التخزين المؤقت في Gemini كقيمة OpenClaw `cacheRead`

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، `google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد ADC من gcloud؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
يُعد OAuth الخاص بـ Gemini CLI في OpenClaw تكاملًا غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من أطراف ثالثة. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يتم شحن OAuth الخاص بـ Gemini CLI كجزء من Plugin `google` المضمّن.

<Steps>
  <Step title="Install Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. لا تلصق **مطلقًا** معرّف عميل أو سرًا في `openclaw.json`. يخزّن تدفق تسجيل الدخول في CLI الرموز المميزة في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="Set project (if needed)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

تُحلّل ردود Gemini CLI بصيغة JSON من `response`؛ ويعود الاستخدام احتياطيًا إلى `stats`، مع تسوية `stats.cached` إلى OpenClaw `cacheRead`.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- نموذج مثال: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: تتم تسوية `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ وتفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- المزوّد: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- نماذج أمثلة: `vercel-ai-gateway/anthropic/claude-opus-4.6`، `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- المزوّد: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- نموذج مثال: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن كتالوج الاحتياط الثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` المباشر توسيع كتالوج وقت التشغيل أكثر.
- التوجيه الفعلي في المصدر خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway، وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للاطلاع على تفاصيل الإعداد.

### Plugins مزوّدون مضمّنون آخرون

| المزوّد                | المعرّف                               | متغير بيئة المصادقة                                                     | نموذج مثال                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### ملاحظات جديرة بالمعرفة

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات إسناد التطبيق وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` المتحقق منها. مراجع DeepSeek وMoonshot وZAI مؤهلة لمدة TTL للتخزين المؤقت للمطالبات المُدار من OpenRouter، لكنها لا تتلقى علامات التخزين المؤقت من Anthropic. وبصفته مسارًا بأسلوب الوكيل ومتوافقًا مع OpenAI، فإنه يتجاوز التهيئة الخاصة حصريًا بـ OpenAI الأصلية (`serviceTier`، وResponses `store`، وتلميحات التخزين المؤقت للمطالبات، وتوافق الاستدلال مع OpenAI). تحتفظ المراجع المدعومة من Gemini بتنقية توقيع التفكير الخاصة بـ proxy-Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة من Gemini مسار تنقية proxy-Gemini نفسه؛ وتتجاوز `kilocode/kilo/auto` والمراجع الأخرى غير الداعمة لاستدلال الوكيل حقن استدلال الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    تكتب عملية الإعداد عبر مفتاح API تعريفات صريحة لنموذج محادثة M2.7 النصي فقط؛ ويبقى فهم الصور على مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (على سبيل المثال `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ تحافظ أدوات الاختيار على التركيب الحرفي `<provider>/<model-id>` بينما يبقى المفتاح القانوني المُرسل إلى API ببادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار xAI Responses. `grok-4.3` هو نموذج المحادثة الافتراضي المضمّن. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    يُشحن بوصفه Plugin المزوّد المضمّن `cerebras`. يستخدم GLM ‏`zai-glm-4.7`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزوّدين **مخصصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

تنشر كثير من Plugins المزوّدين المضمّنة أدناه كتالوجًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوصات قدرات نموذج Gateway أيضًا بيانات `models.providers.<id>.models[]` الوصفية الصريحة. إذا كان نموذج مخصص أو وكيل يقبل الصور، فاضبط `input: ["text", "image"]` على ذلك النموذج حتى تمرر مسارات WebChat والمرفقات ذات أصل العقدة الصور كمدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

يتحكم `agents.defaults.models["provider/model"]` فقط في ظهور النموذج والأسماء البديلة والبيانات الوصفية لكل نموذج للوكلاء. ولا يسجل نموذج تشغيل جديدًا بحد ذاته. لنماذج المزوّدين المخصصة، أضف أيضًا `models.providers.<provider>.models[]` مع `id` المطابق على الأقل.

### Moonshot AI (Kimi)

يُشحن Moonshot بوصفه Plugin مزوّدًا مضمّنًا. استخدم المزوّد المدمج افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات النموذج الوصفية:

- المزوّد: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- نموذج مثال: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

معرّفات نماذج Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### ترميز Kimi

يستخدم Kimi Coding نقطة نهاية متوافقة مع Anthropic من Moonshot AI:

- المزود: `kimi`
- المصادقة: `KIMI_API_KEY`
- نموذج مثال: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

تظل `kimi/kimi-code` و`kimi/k2p5` القديمة مقبولة كمعرفات نماذج للتوافق، وتُطبّع إلى معرف نموذج API المستقر الخاص بـ Kimi.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- المزود: `volcengine` (الترميز: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- نموذج مثال: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

يضبط الإلحاق افتراضيًا سطح الترميز، لكن كتالوج `volcengine/*` العام يُسجّل في الوقت نفسه.

في منتقيات النموذج أثناء الإلحاق/التهيئة، يفضّل خيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معًا. إذا لم تكن هذه النماذج محمّلة بعد، فإن OpenClaw يعود إلى الكتالوج غير المصفّى بدلًا من عرض منتقٍ فارغ مقيّد بالمزود.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (الدولي)

يوفر BytePlus ARK الوصول إلى النماذج نفسها التي يوفرها Volcano Engine للمستخدمين الدوليين.

- المزود: `byteplus` (الترميز: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- نموذج مثال: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

يضبط الإلحاق افتراضيًا سطح الترميز، لكن كتالوج `byteplus/*` العام يُسجّل في الوقت نفسه.

في منتقيات النموذج أثناء الإلحاق/التهيئة، يفضّل خيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معًا. إذا لم تكن هذه النماذج محمّلة بعد، فإن OpenClaw يعود إلى الكتالوج غير المصفّى بدلًا من عرض منتقٍ فارغ مقيّد بالمزود.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

يوفر Synthetic نماذج متوافقة مع Anthropic خلف المزود `synthetic`:

- المزود: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- نموذج مثال: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

تُهيّأ MiniMax عبر `models.providers` لأنها تستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (العالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (العالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لتفاصيل الإعداد وخيارات النماذج ومقتطفات التهيئة.

<Note>
في مسار البث المتوافق مع Anthropic الخاص بـ MiniMax، يعطّل OpenClaw التفكير افتراضيًا ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم القدرات المملوك للـ Plugin:

- تبقى افتراضيات النص/الدردشة على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك للـ Plugin وهو `MiniMax-VL-01` على مساري مصادقة MiniMax كليهما
- يبقى بحث الويب على معرف المزود `minimax`

### LM Studio

يأتي LM Studio بصفته Plugin مزودًا مضمّنًا يستخدم API الأصلي:

- المزود: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط نموذجًا (استبدله بأحد المعرفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw مساري `/api/v1/models` و`/api/v1/models/load` الأصليين في LM Studio للاكتشاف والتحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضيًا. إذا كنت تريد أن يتولى تحميل JIT في LM Studio وTTL والإخلاء التلقائي دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama بصفته Plugin مزودًا مضمّنًا ويستخدم API الأصلي الخاص بـ Ollama:

- المزود: `ollama`
- المصادقة: لا يلزم شيء (خادم محلي)
- نموذج مثال: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يُكتشف Ollama محليًا عند `http://127.0.0.1:11434` عندما تشترك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin المزود المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للإلحاق، ووضع السحابة/المحلي، والتهيئة المخصصة.

### vLLM

يأتي vLLM بصفته Plugin مزودًا مضمّنًا للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

- المزود: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا لم يكن خادمك يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang بصفته Plugin مزودًا مضمّنًا للخوادم السريعة ذاتية الاستضافة المتوافقة مع OpenAI:

- المزود: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا لم يكن خادمك يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio وvLLM وLiteLLM وغيرها)

مثال (متوافق مع OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Default optional fields">
    بالنسبة إلى المزودين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. عند حذفها، يضبط OpenClaw افتراضيًا ما يلي:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من المزود لأدوار `developer` غير المدعومة.
    - تتجاوز المسارات المتوافقة مع OpenAI ذات نمط الوكيل أيضًا تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط: لا `service_tier`، ولا Responses `store`، ولا Completions `store`، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة توافق التفكير في OpenAI، ولا رؤوس إسناد OpenClaw المخفية.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في جسم الطلب الصادر.
    - بالنسبة إلى عناصر تحكم قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى تفكير الجلسة متوقفًا.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/tailnet البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يمدد هذا معالجة طلبات HTTP لنموذج المزود، بما في ذلك الاتصال، والرؤوس، وبث الجسم، وإجهاض الجلب المحروس الإجمالي، من دون زيادة مهلة تشغيل الوكيل كلها.
    - تسمح استدعاءات HTTP لمزود النموذج بإجابات DNS ذات IP وهمي من Surge وClash وsing-box في `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف `baseUrl` الخاص بالمزود المهيأ. لا تزال الوجهات الخاصة الأخرى، وloopback، وlink-local، والبيانات الوصفية تتطلب اشتراكًا صريحًا عبر `models.providers.<id>.request.allowPrivateNetwork: true`.
    - إذا كان `baseUrl` فارغًا/محذوفًا، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يحل إلى `api.openai.com`).
    - للسلامة، تظل القيمة الصريحة `compat.supportsDeveloperRole: true` مستبدلة على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي مزود غير `anthropic` القياسي، أو `models.providers.anthropic.baseUrl` مخصص لا يكون مضيفه نقطة نهاية عامة لـ `api.anthropic.com`)، يكبت OpenClaw رؤوس Anthropic التجريبية الضمنية مثل `claude-code-20250219` و`interleaved-thinking-2025-05-14` وعلامات OAuth، لكي لا ترفض الوكلاء المخصصون المتوافقون مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان الوكيل لديك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [التهيئة](/ar/gateway/configuration) لأمثلة التهيئة الكاملة.

## ذات صلة

- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) - مفاتيح تهيئة النموذج
- [تجاوز فشل النماذج](/ar/concepts/model-failover) - سلاسل الاحتياط وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) - تهيئة النماذج والأسماء المستعارة
- [المزودون](/ar/providers) - أدلة إعداد لكل مزود
