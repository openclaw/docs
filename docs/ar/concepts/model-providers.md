---
read_when:
    - تحتاج إلى مرجع لإعداد Models بحسب كل provider على حدة
    - تريد أمثلة على الإعدادات أو أوامر الإعداد عبر CLI لموفري Models
sidebarTitle: Model providers
summary: نظرة عامة على provider الخاص بـ Model مع أمثلة للإعدادات + تدفقات CLI
title: Model providers
x-i18n:
    generated_at: "2026-04-26T11:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

مرجع **providers الخاصة بـ LLM/Model** (وليس قنوات الدردشة مثل WhatsApp/Telegram). للاطلاع على قواعد اختيار Model، راجع [Models](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع Model ومساعدات CLI">
    - تستخدم مراجع Model الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - تعمل `agents.defaults.models` كقائمة سماح عند ضبطها.
    - مساعدات CLI: `openclaw onboard`، و`openclaw models list`، و`openclaw models set <provider/model>`.
    - تمثل `models.providers.*.models[].contextWindow` بيانات model الوصفية الأصلية؛ أما `contextTokens` فهو الحد الفعال في وقت التشغيل.
    - قواعد fallback، وprobes التهدئة، واستمرار تجاوزات الجلسة: [Model failover](/ar/concepts/model-failover).
  </Accordion>
  <Accordion title="تقسيم provider/runtime في OpenAI">
    تكون مسارات عائلة OpenAI خاصة بالبادئة:

    - يستخدم `openai/<model>` provider المباشر لمفتاح OpenAI API في PI.
    - يستخدم `openai-codex/<model>` مصادقة Codex OAuth في PI.
    - يستخدم `openai/<model>` مع `agents.defaults.agentRuntime.id: "codex"` حزام تشغيل Codex app-server الأصلي.

    راجع [OpenAI](/ar/providers/openai) و[Codex harness](/ar/plugins/codex-harness). إذا كان تقسيم provider/runtime مربكًا، فاقرأ [Agent runtimes](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي للـ Plugin الحد نفسه: فالمسار `openai-codex/<model>` ينتمي إلى Plugin الخاص بـ OpenAI، بينما يُفعَّل Plugin الخاص بـ Codex عبر `agentRuntime.id: "codex"` أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر `openai/gpt-5.5` لحركة المرور المباشرة عبر API key، و`openai-codex/gpt-5.5` في PI لمصادقة Codex OAuth، وعبر حزام تشغيل Codex app-server الأصلي عند ضبط `agentRuntime.id: "codex"`.

  </Accordion>
  <Accordion title="CLI runtimes">
    تستخدم CLI runtimes التقسيم نفسه: اختر مراجع Model قياسية مثل `anthropic/claude-*`، أو `google/gemini-*`، أو `openai/gpt-*`، ثم اضبط `agents.defaults.agentRuntime.id` على `claude-cli`، أو `google-gemini-cli`، أو `codex-cli` عندما تريد واجهة CLI محلية.

    تُرحَّل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة إلى مراجع provider القياسية مع تسجيل runtime بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك provider المملوك للـ Plugin

توجد معظم المنطقيات الخاصة بكل provider في Plugins providers (عبر `registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تملك Plugins عمليات الإعداد الأولي، وفهارس Models، وربط متغيرات env للمصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف failover، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات provider-SDK وأمثلة الـ Plugin المضمّنة في [Provider plugins](/ar/plugins/sdk-provider-plugins). أما الـ provider الذي يحتاج إلى منفذ طلبات مخصص بالكامل فهو سطح توسعة أعمق ومنفصل.

<Note>
إن `capabilities` الخاصة بوقت تشغيل provider هي بيانات وصفية مشتركة للمشغّل (عائلة provider، وخصائص transcript/tools، وتلميحات النقل/التخزين المؤقت). وهي ليست نفسها [نموذج capability العام](/ar/plugins/architecture#public-capability-model)، الذي يصف ما الذي يسجله Plugin (استدلال نصي، وكلام، وما إلى ذلك).
</Note>

## تدوير API key

<AccordionGroup>
  <Accordion title="مصادر المفاتيح والأولوية">
    هيّئ عدة مفاتيح عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فاصلة منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى Google providers، يتم أيضًا تضمين `GOOGLE_API_KEY` كخيار fallback. ويحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - تُعاد محاولة الطلبات باستخدام المفتاح التالي فقط عند استجابات حد المعدل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
    - تفشل الإخفاقات غير المرتبطة بحد المعدل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
    - عندما تفشل كل المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.
  </Accordion>
</AccordionGroup>

## providers المضمّنون (فهرس pi-ai)

يأتي OpenClaw مع فهرس pi-ai. لا تتطلب هذه providers أي إعدادات `models.providers`؛ فقط اضبط المصادقة واختر model.

### OpenAI

- Provider: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز فردي)
- أمثلة Models: `openai/gpt-5.5`، و`openai/gpt-5.4-mini`
- تحقّق من توفر الحساب/model عبر `openclaw models list --provider openai` إذا كان تثبيت معين أو API key معين يتصرف بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE كـ fallback)
- تجاوز لكل model عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- تكون تهيئة OpenAI Responses WebSocket مفعلة افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` بالقيمة `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد tier صريحًا بدلًا من مفتاح `/fast` المشترك
- تُطبَّق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على proxies العامة المتوافقة مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بالقيمة `store` الخاصة بـ Responses، وتلميحات prompt-cache، وتشكيل الحمولة المتوافق مع استدلال OpenAI؛ أما مسارات proxy فلا
- يتم حجب `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API الحية ترفضه ولأن فهرس Codex الحالي لا يعرّضه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز فردي)
- مثال Model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح `/fast` المشترك وإعداد `params.fastMode`، بما في ذلك حركة المرور الموثقة عبر API key وOAuth المرسلة إلى `api.anthropic.com`؛ ويربط OpenClaw ذلك مع Anthropic `service_tier` (`auto` مقابل `standard_only`)
- يحتفظ إعداد Claude CLI المفضل بمرجع model بصيغته القياسية ويختار
  واجهة CLI الخلفية بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agents.defaults.agentRuntime.id: "claude-cli"`. ولا تزال
  مراجع `claude-cli/claude-opus-4-7` القديمة تعمل من أجل التوافق.

<Note>
أخبرنا موظفو Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذا يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. لا يزال `setup-token` الخاص بـ Anthropic متاحًا كمسار token مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- المصادقة: OAuth ‏(ChatGPT)
- مرجع Model في PI: `openai-codex/gpt-5.5`
- مرجع حزام تشغيل Codex app-server الأصلي: `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`
- توثيق حزام تشغيل Codex app-server الأصلي: [Codex harness](/ar/plugins/codex-harness)
- مراجع Models القديمة: `codex/gpt-*`
- حد Plugin: المسار `openai-codex/*` يحمّل Plugin الخاص بـ OpenAI؛ أما Plugin الأصلي لـ Codex app-server فلا يُختار إلا بواسطة runtime الخاص بـ Codex harness أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE كـ fallback)
- تجاوز لكل model في PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرَّر `params.serviceTier` أيضًا في طلبات Responses الأصلية لـ Codex (`chatgpt.com/backend-api`)
- تُرفق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) فقط على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على proxies العامة المتوافقة مع OpenAI
- يشترك مع `openai/*` المباشر في مفتاح `/fast` نفسه وإعداد `params.fastMode`؛ ويربط OpenClaw ذلك مع `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` القيمة الأصلية `contextWindow = 400000` من فهرس Codex والقيمة الافتراضية في وقت التشغيل `contextTokens = 272000`؛ ويمكنك تجاوز حد وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: مصادقة OpenAI Codex OAuth مدعومة صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.
- استخدم `openai-codex/gpt-5.5` عندما تريد مسار Codex OAuth/الاشتراك؛ واستخدم `openai/gpt-5.5` عندما يعرّض إعداد API key والفهرس المحلي لديك مسار API العام.

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
  <Card title="Models GLM" href="/ar/providers/glm">
    خطة Z.AI Coding أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    وصول MiniMax Coding Plan عبر OAuth أو API key.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح provider الخاص بـ Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- provider الخاص بـ Zen runtime: `opencode`
- provider الخاص بـ Go runtime: `opencode-go`
- أمثلة Models: `opencode/claude-opus-4-6`، و`opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini ‏(API key)

- Provider: `google`
- المصادقة: `GEMINI_API_KEY`
- تدوير اختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2`، وخيار fallback هو `GOOGLE_API_KEY`، بالإضافة إلى `OPENCLAW_LIVE_GEMINI_KEY` (تجاوز فردي)
- أمثلة Models: `google/gemini-3.1-pro-preview`، و`google/gemini-3-flash-preview`
- التوافق: يتم تطبيع إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. لا ترسل Gemini 3/3.1 قيمة ثابتة لـ `thinkingLevel`؛ أما Gemini 2.5 فترسل `thinkingBudget: -1`.
- تقبل تشغيلات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو الصيغة القديمة `cached_content`) لتمرير مؤشر `cachedContents/...` أصلي من provider؛ وتظهر إصابات ذاكرة Gemini المؤقتة في OpenClaw على أنها `cacheRead`

### Google Vertex وGemini CLI

- providers: `google-vertex`، و`google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
إن Gemini CLI OAuth في OpenClaw تكامل غير رسمي. وقد أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يأتي Gemini CLI OAuth ضمن Plugin `google` المضمّن.

<Steps>
  <Step title="ثبّت Gemini CLI">
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
  <Step title="فعّل Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="سجّل الدخول">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Model الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. **لا** تقوم بلصق client id أو secret في `openclaw.json`. يقوم تدفق تسجيل الدخول عبر CLI بتخزين tokens في ملفات تعريف المصادقة على مضيف gateway.

  </Step>
  <Step title="اضبط المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway.
  </Step>
</Steps>

يتم تحليل ردود Gemini CLI بصيغة JSON من الحقل `response`؛ ويعود الاستخدام إلى `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI ‏(GLM)

- Provider: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال Model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ بينما يفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة Models: `vercel-ai-gateway/anthropic/claude-opus-4.6`، و`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال Model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يأتي فهرس fallback الثابت مع `kilocode/kilo/auto`؛ ويمكن أن يؤدي الاكتشاف الحي عبر `https://api.kilo.ai/api/gateway/models` إلى توسيع فهرس وقت التشغيل أكثر.
- إن التوجيه الدقيق في المنبع خلف `kilocode/kilo/auto` تملكه Kilo Gateway، وليس مُرمزًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) لمعرفة تفاصيل الإعداد.

### Plugins providers المضمّنة الأخرى

| Provider                | المعرّف                           | متغير بيئة المصادقة                                           | مثال Model                                      |
| ----------------------- | -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                            | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                            | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                               | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                            | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`          | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                                | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`                         | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                            | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` أو `KIMICODE_API_KEY`                          | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                     | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                             | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                            | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                              | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                          | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                             | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY`  | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                             | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                            | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                              | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                          | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                      | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                 | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                              | `xiaomi/mimo-v2-flash`                          |

#### خصائص جديرة بالمعرفة

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبق ترويسات إسناد التطبيق الخاصة به وعلامات Anthropic `cache_control` فقط على المسارات المتحقق منها التابعة لـ `openrouter.ai`. تكون مراجع DeepSeek وMoonshot وZAI مؤهلة لـ cache-TTL في التخزين المؤقت لـ prompt الذي يديره OpenRouter لكنها لا تتلقى علامات cache الخاصة بـ Anthropic. وباعتباره مسارًا على نمط proxy متوافقًا مع OpenAI، فإنه يتخطى التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، و`store` في Responses، وتلميحات prompt-cache، والتوافق مع استدلال OpenAI). وتحتفظ المراجع المدعومة من Gemini فقط بتنقية thought-signature الخاصة بـ proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة من Gemini مسار التنقية نفسه الخاص بـ proxy-Gemini؛ بينما يتخطى `kilocode/kilo/auto` والمراجع الأخرى غير المدعومة لاستدلال proxy حقن الاستدلال عبر proxy.
  </Accordion>
  <Accordion title="MiniMax">
    يكتب الإعداد الأولي عبر API key تعريفات صريحة لنماذج دردشة M2.7 النصية فقط؛ بينما يبقى فهم الصور لدى provider الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار xAI Responses. يقوم `/fast` أو `params.fastMode: true` بإعادة كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى المتغيرات `*-fast` الخاصة بها. تكون `tool_stream` مفعلة افتراضيًا؛ ويمكن تعطيلها عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    تستخدم Models GLM القيمتين `zai-glm-4.7` و`zai-glm-4.6`؛ ويكون عنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## providers عبر `models.providers` ‏(مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة **providers مخصصين** أو proxies متوافقة مع OpenAI/Anthropic.

ينشر العديد من Plugins providers المضمّنة أدناه فهرسًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي، أو الترويسات، أو قائمة Models.

### Moonshot AI ‏(Kimi)

يأتي Moonshot كـ Plugin provider مضمّن. استخدم provider المضمّن افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات model الوصفية:

- Provider: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال Model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

معرّفات Model الخاصة بـ Kimi K2:

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

### Kimi Coding

يستخدم Kimi Coding نقطة النهاية المتوافقة مع Anthropic الخاصة بـ Moonshot AI:

- Provider: `kimi`
- المصادقة: `KIMI_API_KEY`
- مثال Model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

لا يزال `kimi/k2p5` القديم مقبولًا كمعرّف model للتوافق.

### Volcano Engine ‏(Doubao)

يوفر Volcano Engine ‏(火山引擎) الوصول إلى Doubao وModels أخرى في الصين.

- Provider: `volcengine` (للبرمجة: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال Model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

يستخدم الإعداد الأولي سطح البرمجة افتراضيًا، لكن فهرس `volcengine/*` العام يُسجَّل في الوقت نفسه.

في أدوات اختيار Models ضمن onboarding/configure، يفضّل خيار مصادقة Volcengine كلاً من الصفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن هذه Models محمّلة بعد، يعود OpenClaw إلى الفهرس غير المفلتر بدلًا من إظهار أداة اختيار فارغة ضمن نطاق provider.

<Tabs>
  <Tab title="Models القياسية">
    - `volcengine/doubao-seed-1-8-251228` ‏(Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` ‏(Kimi K2.5)
    - `volcengine/glm-4-7-251222` ‏(GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` ‏(DeepSeek V3.2 128K)
  </Tab>
  <Tab title="Models البرمجة (`volcengine-plan`)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`
  </Tab>
</Tabs>

### BytePlus ‏(دولي)

يوفر BytePlus ARK الوصول إلى Models نفسها الخاصة بـ Volcano Engine للمستخدمين الدوليين.

- Provider: `byteplus` (للبرمجة: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال Model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

يستخدم الإعداد الأولي سطح البرمجة افتراضيًا، لكن فهرس `byteplus/*` العام يُسجَّل في الوقت نفسه.

في أدوات اختيار Models ضمن onboarding/configure، يفضّل خيار مصادقة BytePlus كلاً من الصفوف `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن هذه Models محمّلة بعد، يعود OpenClaw إلى الفهرس غير المفلتر بدلًا من إظهار أداة اختيار فارغة ضمن نطاق provider.

<Tabs>
  <Tab title="Models القياسية">
    - `byteplus/seed-1-8-251228` ‏(Seed 1.8)
    - `byteplus/kimi-k2-5-260127` ‏(Kimi K2.5)
    - `byteplus/glm-4-7-251222` ‏(GLM 4.7)
  </Tab>
  <Tab title="Models البرمجة (`byteplus-plan`)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`
  </Tab>
</Tabs>

### Synthetic

يوفر Synthetic Models متوافقة مع Anthropic خلف provider ‏`synthetic`:

- Provider: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال Model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

يتم إعداد MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth ‏(عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth ‏(الصين): `--auth-choice minimax-cn-oauth`
- MiniMax API key ‏(عالمي): `--auth-choice minimax-global-api`
- MiniMax API key ‏(الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لمعرفة تفاصيل الإعداد، وخيارات Models، ومقتطفات الإعدادات.

<Note>
في مسار البث المتوافق مع Anthropic الخاص بـ MiniMax، يعطّل OpenClaw التفكير افتراضيًا ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم capabilities المملوكة للـ Plugin:

- تبقى الإعدادات الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- يكون إنشاء الصور عبر `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور عبر `MiniMax-VL-01` المملوك للـ Plugin على كلا مساري مصادقة MiniMax
- يبقى البحث على الويب على معرّف provider ‏`minimax`

### LM Studio

يأتي LM Studio كـ Plugin provider مضمّن يستخدم API الأصلية:

- Provider: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط model (استبدله بأحد المعرّفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw المسارين الأصليين لـ LM Studio ‏`/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع استخدام `/v1/chat/completions` للاستدلال افتراضيًا. راجع [/providers/lmstudio](/ar/providers/lmstudio) لمعرفة الإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama كـ Plugin provider مضمّن ويستخدم API الأصلية الخاصة بـ Ollama:

- Provider: `ollama`
- المصادقة: غير مطلوبة (خادم محلي)
- مثال Model: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# ثبّت Ollama، ثم اسحب model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يتم اكتشاف Ollama محليًا على `http://127.0.0.1:11434` عندما تفعل ذلك عبر `OLLAMA_API_KEY`، ويضيف Plugin provider المضمّن Ollama مباشرةً إلى `openclaw onboard` وأداة اختيار model. راجع [/providers/ollama](/ar/providers/ollama) لمعرفة الإعداد الأوّلي، ووضع السحابة/المحلي، والإعدادات المخصصة.

### vLLM

يأتي vLLM كـ Plugin provider مضمّن للخوادم المحلية/المستضافة ذاتيًا والمتوافقة مع OpenAI:

- Provider: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للتفعيل المحلي للاكتشاف التلقائي (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط model (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang كـ Plugin provider مضمّن للخوادم السريعة المستضافة ذاتيًا والمتوافقة مع OpenAI:

- Provider: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للتفعيل المحلي للاكتشاف التلقائي (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط model (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### Proxies محلية (LM Studio وvLLM وLiteLLM وما إلى ذلك)

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
  <Accordion title="الحقول الاختيارية الافتراضية">
    بالنسبة إلى providers المخصصة، تكون الحقول `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    التوصية: اضبط قيمًا صريحة تطابق حدود proxy/model الخاصة بك.

  </Accordion>
  <Accordion title="قواعد تشكيل مسارات proxy">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من provider بسبب أدوار `developer` غير المدعومة.
    - تتخطى المسارات المتوافقة مع OpenAI بنمط proxy أيضًا التشكيل الخاص بـ OpenAI الأصلي فقط: لا يوجد `service_tier`، ولا `store` في Responses، ولا `store` في Completions، ولا تلميحات prompt-cache، ولا تشكيل حمولة متوافق مع استدلال OpenAI، ولا ترويسات إسناد OpenClaw المخفية.
    - بالنسبة إلى proxies Completions المتوافقة مع OpenAI والتي تحتاج إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في جسم الطلب الصادر.
    - بالنسبة إلى عناصر التحكم `chat-template` في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل OpenClaw تلقائيًا `enable_thinking: false` و`force_nonempty_content: true` إلى `vllm/nemotron-3-*` عندما يكون مستوى التفكير في الجلسة معطّلًا.
    - إذا كانت `baseUrl` فارغة/محذوفة، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
    - ولأسباب تتعلق بالأمان، يتم مع ذلك تجاوز القيمة الصريحة `compat.supportsDeveloperRole: true` على نقاط النهاية غير الأصلية `openai-completions`.
  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [الإعدادات](/ar/gateway/configuration) للاطلاع على أمثلة إعدادات كاملة.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعداد Model
- [Model failover](/ar/concepts/model-failover) — سلاسل fallback وسلوك إعادة المحاولة
- [Models](/ar/concepts/models) — إعداد Model والأسماء المستعارة
- [Providers](/ar/providers) — أدلة الإعداد لكل provider
