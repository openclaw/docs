---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل موفّر على حدة
    - تريد أمثلة على الإعدادات أو أوامر الإعداد الأولي عبر CLI لموفّري النماذج
sidebarTitle: Model providers
summary: نظرة عامة على موفّري النماذج مع أمثلة على الإعدادات + تدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-04-30T07:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع لـ **موفّري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). لقواعد اختيار النماذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع النماذج ومساعدات CLI">
    - تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - يعمل `agents.defaults.models` كقائمة سماح عند ضبطه.
    - مساعدات CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` القيم الافتراضية على مستوى الموفّر؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، وفحوصات فترة التهدئة، واستمرار تجاوزات الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="فصل موفّر/وقت تشغيل OpenAI">
    مسارات عائلة OpenAI محددة بالبادئة:

    - يستخدم `openai/<model>` موفّر مفتاح API المباشر لـ OpenAI في PI.
    - يستخدم `openai-codex/<model>` Codex OAuth في PI.
    - يستخدم `openai/<model>` مع `agents.defaults.agentRuntime.id: "codex"` حزمة خادم تطبيق Codex الأصلية.

    راجع [OpenAI](/ar/providers/openai) و[حزمة Codex](/ar/plugins/codex-harness). إذا كان فصل الموفّر/وقت التشغيل مربكًا، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي للـ Plugin الحد نفسه: ينتمي `openai-codex/<model>` إلى Plugin الخاص بـ OpenAI، بينما يتم تفعيل Plugin الخاص بـ Codex بواسطة `agentRuntime.id: "codex"` أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر `openai/gpt-5.5` لحركة مرور مفاتيح API المباشرة، و`openai-codex/gpt-5.5` في PI لـ Codex OAuth، وحزمة خادم تطبيق Codex الأصلية عند ضبط `agentRuntime.id: "codex"`.

  </Accordion>
  <Accordion title="أوقات تشغيل CLI">
    تستخدم أوقات تشغيل CLI الفصل نفسه: اختر مراجع نماذج معيارية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط `agents.defaults.agentRuntime.id` على `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد خلفية CLI محلية.

    تنتقل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة عائدةً إلى مراجع الموفّرين المعيارية مع تسجيل وقت التشغيل بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك الموفّرين المملوك للـ Plugin

توجد معظم المنطق الخاص بالموفّرين في Plugins الموفّرين (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تمتلك Plugins الإعداد الأولي، وكتالوجات النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، والمزيد.

توجد القائمة الكاملة لخطافات SDK الخاصة بالموفّرين وأمثلة Plugins المضمّنة في [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins). الموفّر الذي يحتاج إلى منفّذ طلبات مخصص بالكامل هو سطح توسعة منفصل وأعمق.

<Note>
يوجد سلوك المشغّل المملوك للموفّر في خطافات موفّر صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف البث، ومساعدات النقل/الطلبات. حقيبة `ProviderPlugin.capabilities` الثابتة القديمة مخصصة للتوافق فقط ولم تعد تُقرأ بواسطة منطق المشغّل المشترك.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="مصادر المفاتيح والأولوية">
    اضبط مفاتيح متعددة عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى موفّري Google، يتم تضمين `GOOGLE_API_KEY` أيضًا كخيار رجوع احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - تُعاد محاولة الطلبات باستخدام المفتاح التالي فقط عند استجابات حد المعدل (على سبيل المثال `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حد الاستخدام الدورية).
    - تفشل الإخفاقات التي ليست بسبب حد المعدل فورًا؛ ولا تُحاوَل أي عملية تدوير للمفاتيح.
    - عندما تفشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من المحاولة الأخيرة.

  </Accordion>
</AccordionGroup>

## الموفّرون المضمّنون (كتالوج pi-ai)

يأتي OpenClaw مع كتالوج pi‑ai. لا يحتاج هؤلاء الموفّرون إلى أي إعداد `models.providers`؛ ما عليك سوى ضبط المصادقة واختيار نموذج.

### OpenAI

- المزوّد: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، إضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- تحقّق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت محدد أو مفتاح API يتصرف بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم الرجوع إلى SSE)
- يمكن التجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يكون الإحماء الافتراضي لـ OpenAI Responses WebSocket مفعّلًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة من `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدل مفتاح التبديل المشترك `/fast`
- لا تنطبق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator`، `version`، `User-Agent`) إلا على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بـ Responses `store`، وتلميحات ذاكرة التخزين المؤقت للموجهات، وتشكيل الحمولة المتوافق مع استدلال OpenAI؛ أما مسارات الوكيل فلا تفعل ذلك
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API الحية ترفضه، كما أن كتالوج Codex الحالي لا يعرِضه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- المزوّد: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS`، `ANTHROPIC_API_KEY_1`، `ANTHROPIC_API_KEY_2`، إضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال على نموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك حركة المرور المرسلة إلى `api.anthropic.com` والمصادَق عليها بمفتاح API أو OAuth؛ يربط OpenClaw ذلك بـ Anthropic `service_tier` (`auto` مقابل `standard_only`)
- يحافظ تكوين Claude CLI المفضّل على مرجع النموذج القياسي ويختار واجهة CLI
  الخلفية بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agents.defaults.agentRuntime.id: "claude-cli"`. تظل مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا موظفو Anthropic بأن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل رمز إعداد Anthropic متاحًا كمسار رموز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عندما يكونان متاحين.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- المزوّد: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مرجع نموذج PI: `openai-codex/gpt-5.5`
- مرجع حزمة خادم تطبيق Codex الأصلية: `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`
- وثائق حزمة خادم تطبيق Codex الأصلية: [حزمة Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` Plugin الخاص بـ OpenAI؛ ولا يتم اختيار Plugin خادم تطبيق Codex الأصلي إلا بواسطة وقت تشغيل حزمة Codex أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم الرجوع إلى SSE)
- يمكن التجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` على طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- لا تُرفق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator`، `version`، `User-Agent`) إلا على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك تكوين مفتاح التبديل نفسه `/fast` و`params.fastMode` كما في `openai/*` المباشر؛ يربط OpenClaw ذلك بـ `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` قيمة كتالوج Codex الأصلية `contextWindow = 400000` ووقت التشغيل الافتراضي `contextTokens = 272000`؛ تجاوز حد وقت التشغيل باستخدام `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: OpenAI Codex OAuth مدعوم صراحة للأدوات/سير العمل الخارجية مثل OpenClaw.
- استخدم `openai-codex/gpt-5.5` عندما تريد مسار Codex OAuth/الاشتراك؛ واستخدم `openai/gpt-5.5` عندما يعرِض إعداد مفتاح API والكتالوج المحلي لديك مسار API العام.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
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
  <Card title="GLM models" href="/ar/providers/glm">
    خطة Z.AI Coding Plan أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    OAuth لخطة MiniMax Coding Plan أو الوصول عبر مفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح مزوّد Qwen Cloud إضافة إلى Alibaba DashScope وربط نقاط نهاية Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- مزوّد وقت تشغيل Zen: `opencode`
- مزوّد وقت تشغيل Go: `opencode-go`
- أمثلة على النماذج: `opencode/claude-opus-4-6`، `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS`، `GEMINI_API_KEY_1`، `GEMINI_API_KEY_2`، الرجوع إلى `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- التوافق: يتم تطبيع تكوين OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم البديل: يتم قبول `google/gemini-3.1-pro` وتطبيعه إلى معرّف Gemini API الحي لدى Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. لا يضمّن Gemini 3/3.1 قيمة ثابتة لـ `thinkingLevel`؛ ويرسل Gemini 2.5 قيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير مقبض أصلي للمزوّد بصيغة `cachedContents/...`؛ تظهر إصابات ذاكرة Gemini المؤقتة في OpenClaw باسم `cacheRead`

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، `google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
Gemini CLI OAuth في OpenClaw هو تكامل غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يُشحن Gemini CLI OAuth كجزء من Plugin `google` المضمّن.

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

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. لا تلصق **معرّف عميل** أو سرًا في `openclaw.json`. يخزّن تدفق تسجيل الدخول في CLI الرموز في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="عيّن المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

تُحلَّل ردود Gemini CLI بصيغة JSON من `response`؛ ويعود الاستخدام احتياطيًا إلى `stats`، مع تسوية `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- نموذج مثال: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: تُسوّى `z.ai/*` و`z-ai/*` إلى `zai/*`
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
- يشحن الفهرس الاحتياطي الثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` المباشر توسيع فهرس وقت التشغيل أكثر.
- التوجيه المنبعي الدقيق خلف `kilocode/kilo/auto` تملكه Kilo Gateway، وليس مضمّنًا ترميزيًا في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) لتفاصيل الإعداد.

### Plugins المزوّدين المضمّنة الأخرى

| المزوّد                | المعرّف                               | متغير بيئة المصادقة                                                     | نموذج مثال                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` أو `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### خصائص يجدر معرفتها

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات نسبة التطبيق وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` المتحقَّق منها. تكون مراجع DeepSeek وMoonshot وZAI مؤهلة لذاكرة التخزين المؤقت للمطالبات ذات مدة TTL التي يديرها OpenRouter، لكنها لا تتلقى علامات ذاكرة Anthropic المؤقتة. وبصفته مسارًا وكيلًا متوافقًا مع OpenAI، فإنه يتخطى التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، و`store` في Responses، وتلميحات ذاكرة المطالبات المؤقتة، وتوافق استدلال OpenAI). تحتفظ المراجع المدعومة من Gemini بتنقية توقيع التفكير الخاصة بوكيل Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة من Gemini مسار تنقية وكيل Gemini نفسه؛ ويتخطى `kilocode/kilo/auto` وغيره من المراجع غير الداعمة للاستدلال عبر الوكيل حقن الاستدلال عبر الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    يكتب إعداد مفتاح API تعريفات صريحة لنماذج دردشة M2.7 النصية فقط؛ ويبقى فهم الصور على موفّر الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (على سبيل المثال `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ أدوات الاختيار على تركيب `<provider>/<model-id>` الحرفي بينما يبقى المفتاح القانوني المرسل إلى API ذا بادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار xAI Responses. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    يشحن بصفته Plugin المزوّد المضمّن `cerebras`. يستخدم GLM `zai-glm-4.7`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (عنوان URL مخصّص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزوّدين **مخصّصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

ينشر كثير من Plugins المزوّدين المضمّنة أدناه فهرسًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوصات قدرات نموذج Gateway أيضًا بيانات تعريف `models.providers.<id>.models[]` الصريحة. إذا كان نموذج مخصّص أو وكيل يقبل الصور، فعيّن `input: ["text", "image"]` على ذلك النموذج لكي تمرر مسارات WebChat ومرفقات أصل Node الصور كمدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

### Moonshot AI (Kimi)

يشحن Moonshot بصفته Plugin مزوّدًا مضمّنًا. استخدم المزوّد المدمج افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات تعريف النموذج:

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

### برمجة Kimi

يستخدم Kimi Coding نقطة نهاية متوافقة مع Anthropic من Moonshot AI:

- المزوّد: `kimi`
- المصادقة: `KIMI_API_KEY`
- نموذج مثال: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

يبقى `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفّر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- المزوّد: `volcengine` (للبرمجة: `volcengine-plan`)
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

تستخدم عملية الإعداد الافتراضي واجهة البرمجة، لكن يتم تسجيل كتالوج `volcengine/*` العام في الوقت نفسه.

في منتقيات نماذج الإعداد/التهيئة، يفضّل خيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معًا. إذا لم تكن هذه النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلًا من عرض منتقي فارغ مقيّد بالمزوّد.

<Tabs>
  <Tab title="النماذج القياسية">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="نماذج البرمجة (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (دولي)

يوفّر BytePlus ARK الوصول إلى النماذج نفسها التي يوفرها Volcano Engine للمستخدمين الدوليين.

- المزوّد: `byteplus` (للبرمجة: `byteplus-plan`)
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

تستخدم عملية الإعداد الافتراضي واجهة البرمجة، لكن يتم تسجيل كتالوج `byteplus/*` العام في الوقت نفسه.

في منتقيات النماذج ضمن الإعداد الأولي/التكوين، يفضّل خيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معًا. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلًا من عرض منتقي فارغ محدد النطاق بالمزوّد.

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

يوفّر Synthetic نماذج متوافقة مع Anthropic خلف المزوّد `synthetic`:

- المزوّد: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال نموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

يُكوَّن MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصّصة:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (Global): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (CN): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للاطلاع على تفاصيل الإعداد، وخيارات النماذج، ومقتطفات التكوين.

<Note>
على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير افتراضيًا ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم القدرات المملوك من Plugin:

- تبقى افتراضيات النص/الدردشة على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك من Plugin عبر `MiniMax-VL-01` على مساري مصادقة MiniMax كليهما
- يبقى بحث الويب على معرّف المزوّد `minimax`

### LM Studio

يأتي LM Studio بصفته Plugin مزوّدًا مضمّنًا يستخدم واجهة API الأصلية:

- المزوّد: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw المسارين الأصليين في LM Studio وهما `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضيًا. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama بصفته Plugin مزوّدًا مضمّنًا ويستخدم واجهة API الأصلية الخاصة بـ Ollama:

- المزوّد: `ollama`
- المصادقة: غير مطلوبة (خادم محلي)
- مثال نموذج: `ollama/llama3.3`
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

يُكتشف Ollama محليًا عند `http://127.0.0.1:11434` عندما تشترك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin المزوّد المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للإعداد الأولي، ووضع السحابة/المحلي، والتكوين المخصّص.

### vLLM

يأتي vLLM بصفته Plugin مزوّدًا مضمّنًا للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

- المزوّد: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang بصفته Plugin مزوّدًا مضمّنًا للخوادم السريعة ذاتية الاستضافة المتوافقة مع OpenAI:

- المزوّد: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio، وvLLM، وLiteLLM، وما إلى ذلك)

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
    للمزوّدين المخصّصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنّب أخطاء 400 من المزوّد للأدوار غير المدعومة `developer`.
    - تتخطى المسارات المتوافقة مع OpenAI بنمط الوكيل أيضًا تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط: لا `service_tier`، ولا Responses `store`، ولا Completions `store`، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة توافق التفكير في OpenAI، ولا ترويسات إسناد OpenClaw المخفية.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في جسم الطلب الصادر.
    - بالنسبة إلى عناصر تحكم قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى التفكير في الجلسة متوقفًا.
    - للنماذج المحلية البطيئة أو مضيفي LAN/tailnet البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يوسّع هذا معالجة طلب HTTP لنموذج المزوّد، بما في ذلك الاتصال، والترويسات، وبث الجسم، وإيقاف الجلب المحمي الإجمالي، من دون زيادة مهلة تشغيل الوكيل بالكامل.
    - إذا كان `baseUrl` فارغًا/محذوفًا، يحافظ OpenClaw على سلوك OpenAI الافتراضي (الذي يحل إلى `api.openai.com`).
    - حرصًا على السلامة، تظل القيمة الصريحة `compat.supportsDeveloperRole: true` متجاوزة على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي مزوّد غير `anthropic` القانوني، أو `models.providers.anthropic.baseUrl` مخصّص لا يكون مضيفه نقطة نهاية عامة `api.anthropic.com`)، يكبت OpenClaw ترويسات Anthropic beta الضمنية مثل `claude-code-20250219` و`interleaved-thinking-2025-05-14` وعلامات OAuth، حتى لا ترفض الوكلاء المخصّصون المتوافقون مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

انظر أيضًا: [التكوين](/ar/gateway/configuration) للحصول على أمثلة تكوين كاملة.

## ذو صلة

- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — مفاتيح تكوين النماذج
- [انتقال النموذج عند الفشل](/ar/concepts/model-failover) — سلاسل الرجوع وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) — تكوين النماذج والأسماء المستعارة
- [المزوّدون](/ar/providers) — أدلة الإعداد لكل مزوّد
