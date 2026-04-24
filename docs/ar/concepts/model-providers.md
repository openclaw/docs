---
read_when:
    - تحتاج إلى مرجع إعداد نماذج حسب كل موفر على حدة
    - تريد أمثلة على الإعدادات أو أوامر onboarding في CLI لموفري النماذج
summary: نظرة عامة على موفري النماذج مع أمثلة على الإعدادات وتدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-04-24T07:38:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

تغطي هذه الصفحة **موفري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram).
للاطلاع على قواعد اختيار النموذج، راجع [/concepts/models](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج الصيغة `provider/model` ‏(مثال: `opencode/claude-opus-4-6`).
- تعمل `agents.defaults.models` كـ allowlist عند تعيينها.
- مساعدات CLI: ‏`openclaw onboard` و`openclaw models list` و`openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` هي بيانات وصفية أصلية للنموذج؛ أما `contextTokens` فهي الحد الفعلي لوقت التشغيل.
- قواعد الرجوع الاحتياطي، وفحوصات cooldown، واستمرارية تجاوزات الجلسة: [Model failover](/ar/concepts/model-failover).
- تكون مسارات عائلة OpenAI خاصة بالبادئة: يستخدم `openai/<model>`
  موفر مفتاح OpenAI API المباشر في PI، ويستخدم `openai-codex/<model>` مصادقة Codex OAuth في PI،
  ويستخدم `openai/<model>` مع `agents.defaults.embeddedHarness.runtime: "codex"`
  harness خادم تطبيق Codex الأصلي. راجع [OpenAI](/ar/providers/openai)
  و[Codex harness](/ar/plugins/codex-harness).
- يتبع التمكين التلقائي لـ Plugin هذا الحد نفسه: ينتمي `openai-codex/<model>`
  إلى Plugin الخاص بـ OpenAI، بينما يتم تمكين Plugin الخاص بـ Codex بواسطة
  `embeddedHarness.runtime: "codex"` أو مراجع `codex/<model>` القديمة.
- يتوفر GPT-5.5 حاليًا عبر مسارات الاشتراك/OAuth:
  `openai-codex/gpt-5.5` في PI أو `openai/gpt-5.5` مع Codex app-server
  harness. ويدعم المسار المباشر لمفتاح API لـ `openai/gpt-5.5`
  بمجرد أن تُمكّن OpenAI النموذج GPT-5.5 على واجهة API العامة؛ وحتى ذلك الحين استخدم
  النماذج المفعلة عبر API مثل `openai/gpt-5.4` لإعدادات `OPENAI_API_KEY`.

## السلوك المملوك لـ Plugin الخاص بالموفر

توجد معظم المنطقات الخاصة بكل موفر في Plugins الموفرين (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تمتلك Plugins أعمال onboarding، وفهارس النماذج، وربط env vars للمصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف failover، وتحديث OAuth، وتقارير الاستخدام، وملفات التفكير/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات provider-SDK وأمثلة Plugins المجمعة في [Plugins الموفرين](/ar/plugins/sdk-provider-plugins). أما الموفر الذي يحتاج إلى منفّذ طلبات مخصص بالكامل فهو سطح امتداد منفصل وأعمق.

<Note>
إن `capabilities` الخاصة بوقت تشغيل الموفر هي بيانات وصفية مشتركة للمشغّل (عائلة الموفر، وخصائص transcript/tooling، وتلميحات النقل/الذاكرة المؤقتة). وهي ليست الشيء نفسه مثل [نموذج القدرات العام](/ar/plugins/architecture#public-capability-model)، الذي يصف ما الذي يسجله Plugin ‏(الاستدلال النصي، والكلام، وما إلى ذلك).
</Note>

## تدوير مفاتيح API

- يدعم تدوير الموفر العام لموفرين محددين.
- اضبط عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` ‏(تجاوز حي واحد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` ‏(قائمة مفصولة بفواصل أو فاصلة منقوطة)
  - `<PROVIDER>_API_KEY` ‏(المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` ‏(قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفري Google، يتم أيضًا تضمين `GOOGLE_API_KEY` كرجوع احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- تُعاد محاولة الطلبات باستخدام المفتاح التالي فقط عند استجابات حد المعدل (على
  سبيل المثال `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many
concurrent requests` أو `ThrottlingException` أو `concurrency limit reached`،
  أو `workers_ai ... quota limit exceeded`، أو رسائل حدود الاستخدام الدورية).
- تفشل الأعطال غير المتعلقة بحد المعدل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
- عندما تفشل جميع المفاتيح المرشحة، يتم إرجاع الخطأ النهائي من آخر محاولة.

## الموفرون المدمجون (فهرس pi-ai)

يأتي OpenClaw مع فهرس pi‑ai. لا تتطلب هذه الموفرات أي إعداد
`models.providers`؛ فقط اضبط المصادقة + اختر نموذجًا.

### OpenAI

- الموفر: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` ‏(تجاوز واحد)
- أمثلة على النماذج: `openai/gpt-5.4` و`openai/gpt-5.4-mini`
- دعم GPT-5.5 المباشر عبر API جاهز هنا للمستقبل بمجرد أن تكشف OpenAI عن GPT-5.5 على واجهة API
- CLI: ‏`openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` ‏(WebSocket أولًا، ثم SSE كرجوع احتياطي)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` ‏(`"sse"` أو `"websocket"` أو `"auto"`)
- يتم تمكين warm-up الخاص بـ OpenAI Responses WebSocket افتراضيًا عبر `params.openaiWsWarmup` ‏(`true`/`false`)
- يمكن تمكين المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- تقوم `/fast` و`params.fastMode` بربط طلبات `openai/*` Responses المباشرة بالقيمة `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد طبقة صريحة بدلًا من مفتاح `/fast` المشترك
- تُطبق ترويسات الإسناد المخفية الخاصة بـ OpenClaw ‏(`originator` و`version` و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامّين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بالقيم Responses `store`، وتلميحات prompt-cache، وتشكيل حمولة الاستدلال المتوافق مع OpenAI؛ أما مسارات الوكيل فلا تفعل ذلك
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API الحية ترفضه ولأن فهرس Codex الحالي لا يكشفه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- الموفر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` ‏(تجاوز واحد)
- مثال على النموذج: `anthropic/claude-opus-4-6`
- CLI: ‏`openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح `/fast` المشترك و`params.fastMode`، بما في ذلك الحركة الموثقة عبر API key وOAuth المرسلة إلى `api.anthropic.com`؛ ويقوم OpenClaw بربط ذلك إلى `service_tier` الخاص بـ Anthropic ‏(`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا موظفو Anthropic بأن إعادة استخدام Claude CLI على نمط OpenClaw مسموحة مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنها مسموح بها لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- لا يزال setup-token الخاص بـ Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- الموفر: `openai-codex`
- المصادقة: OAuth ‏(ChatGPT)
- مرجع نموذج PI: ‏`openai-codex/gpt-5.5`
- مرجع harness خادم تطبيق Codex الأصلي: ‏`openai/gpt-5.5` مع `agents.defaults.embeddedHarness.runtime: "codex"`
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يقوم `openai-codex/*` بتحميل Plugin الخاص بـ OpenAI؛ بينما يتم اختيار Plugin خادم تطبيق Codex الأصلي فقط بواسطة وقت تشغيل Codex harness أو مراجع `codex/*` القديمة.
- CLI: ‏`openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` ‏(WebSocket أولًا، ثم SSE كرجوع احتياطي)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` ‏(`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` على طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- تُرفق ترويسات الإسناد المخفية الخاصة بـ OpenClaw ‏(`originator` و`version` و`User-Agent`) فقط على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامّين المتوافقين مع OpenAI
- يشارك مفتاح `/fast` نفسه وإعداد `params.fastMode` كما في `openai/*` المباشر؛ ويقوم OpenClaw بربط ذلك إلى `service_tier=priority`
- يحتفظ `openai-codex/gpt-5.5` بالقيمة الأصلية `contextWindow = 1000000` وبقيمة وقت تشغيل افتراضية `contextTokens = 272000`؛ ويمكنك تجاوز حد وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة السياسة: يتم دعم OpenAI Codex OAuth صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.
- يتم الوصول الحالي إلى GPT-5.5 عبر مسار OAuth/الاشتراك هذا إلى أن تمكّن OpenAI GPT-5.5 على واجهة API العامة.

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

- [Qwen Cloud](/ar/providers/qwen): سطح موفر Qwen Cloud بالإضافة إلى ربط نقاط النهاية Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو API key
- [GLM Models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو واجهات API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` ‏(أو `OPENCODE_ZEN_API_KEY`)
- موفر وقت تشغيل Zen: ‏`opencode`
- موفر وقت تشغيل Go: ‏`opencode-go`
- أمثلة على النماذج: `opencode/claude-opus-4-6` و`opencode-go/kimi-k2.5`
- CLI: ‏`openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفر: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2`، والرجوع الاحتياطي `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` ‏(تجاوز واحد)
- أمثلة على النماذج: `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview`
- التوافق: يتم تطبيع إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: ‏`openclaw onboard --auth-choice gemini-api-key`
- تقبل تشغيلات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent`
  (أو `cached_content` القديم) من أجل تمرير مقبض
  `cachedContents/...` أصلي خاص بالموفر؛ وتظهر إصابات الذاكرة المؤقتة في Gemini على شكل `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- الموفرون: `google-vertex` و`google-gemini-cli`
- المصادقة: يستخدم Vertex قيمة gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: تكامل Gemini CLI OAuth في OpenClaw تكامل غير رسمي. وقد أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يتم شحن Gemini CLI OAuth كجزء من Plugin المجمّع `google`.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التمكين: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: لا تقوم **بإلصاق** client id أو secret في `openclaw.json`. إذ يخزّن تدفق تسجيل الدخول في CLI
    الرموز داخل ملفات تعريف المصادقة على مضيف gateway.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway.
  - يتم تحليل ردود JSON الخاصة بـ Gemini CLI من `response`؛ ويعود الاستخدام احتياطيًا إلى
    `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI ‏(GLM)

- الموفر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال على النموذج: `zai/glm-5.1`
- CLI: ‏`openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يقوم `zai-api-key` باكتشاف نقطة نهاية Z.AI المطابقة تلقائيًا؛ بينما تقوم `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` بفرض سطح معيّن

### Vercel AI Gateway

- الموفر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة على النماذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`،
  و`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال على النموذج: `kilocode/kilo/auto`
- CLI: ‏`openclaw onboard --auth-choice kilocode-api-key`
- Base URL: ‏`https://api.kilo.ai/api/gateway/`
- يتم شحن فهرس رجوع احتياطي ثابت يتضمن `kilocode/kilo/auto`؛ ويمكن لاكتشاف
  `https://api.kilo.ai/api/gateway/models` الحي توسيع فهرس وقت التشغيل أكثر.
- إن التوجيه الدقيق في المنبع خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway،
  وليس مُرمّزًا بشكل ثابت داخل OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### Plugins موفري الخدمة المجمعة الأخرى

| الموفّر                 | المعرّف                          | متغير بيئة المصادقة                                         | نموذج مثال                                      |
| ----------------------- | -------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                          | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                          | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                             | —                                               |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`        | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                              | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`                       | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                          | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` أو `KIMICODE_API_KEY`                        | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                   | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                           | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                          | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                            | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                        | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                           | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                           | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                          | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                            | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                        | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                    | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                               | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                            | `xiaomi/mimo-v2-flash`                          |

خصائص مهمة ينبغي معرفتها:

- **OpenRouter** يطبق ترويسات إسناد التطبيق وعلامات `cache_control` الخاصة بـ Anthropic فقط على المسارات المتحقق منها لـ `openrouter.ai`. وباعتباره مسارًا وكيلًا متوافقًا مع OpenAI، فإنه يتجاوز التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، و`store` في Responses، وتلميحات prompt-cache، والتوافق الاستدلالي الخاص بـ OpenAI). وتحتفظ المراجع المدعومة بـ Gemini فقط بتنقية توقيع التفكير الخاصة بـ Gemini عبر الوكيل.
- **Kilo Gateway** تتبع المراجع المدعومة بـ Gemini فيه مسار التنقية نفسه الخاص بـ Gemini عبر الوكيل؛ أما `kilocode/kilo/auto` والمراجع الأخرى التي لا تدعم الاستدلال عبر الوكيل فتتجاوز حقن الاستدلال عبر الوكيل.
- **MiniMax** يقوم onboarding باستخدام API key بكتابة تعريفات صريحة لنماذج M2.7 مع `input: ["text", "image"]`؛ بينما يحتفظ الفهرس المجمّع بمراجع الدردشة كنص فقط إلى أن يتم إنشاء هذا الإعداد.
- **xAI** يستخدم مسار xAI Responses. وتعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. ويكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** تستخدم نماذج GLM القيم `zai-glm-4.7` / `zai-glm-4.6`؛ ويكون Base URL المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.

## الموفّرون عبر `models.providers` ‏(مخصص/Base URL)

استخدم `models.providers` ‏(أو `models.json`) لإضافة **موفّرين مخصصين** أو
وكلاء متوافقين مع OpenAI/Anthropic.

تنشر العديد من Plugins المجمعة لموفري الخدمة أدناه بالفعل فهرسًا افتراضيًا.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
Base URL الافتراضي، أو الترويسات، أو قائمة النماذج.

### Moonshot AI ‏(Kimi)

يأتي Moonshot كـ Plugin موفّر مدمج. استخدم الموفّر المدمج افتراضيًا،
ولا تضف إدخال `models.providers.moonshot` صريحًا إلا عندما
تحتاج إلى تجاوز Base URL أو بيانات وصفية للنموذج:

- الموفّر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- نموذج مثال: `moonshot/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

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

### Kimi Coding

يستخدم Kimi Coding نقطة النهاية المتوافقة مع Anthropic الخاصة بـ Moonshot AI:

- الموفّر: `kimi`
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

لا يزال `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine ‏(Doubao)

يوفر Volcano Engine ‏(火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- الموفّر: `volcengine` ‏(البرمجة: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- نموذج مثال: `volcengine-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

يستخدم onboarding سطح البرمجة افتراضيًا، لكن فهرس `volcengine/*`
العام يُسجَّل في الوقت نفسه.

في ملتقطات اختيار النموذج في onboarding/configure، يفضل خيار مصادقة Volcengine
كلًا من الصفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن هذه النماذج
محملة بعد، فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من إظهار
ملتقط فارغ خاص بالموفّر.

النماذج المتاحة:

- `volcengine/doubao-seed-1-8-251228` ‏(Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` ‏(Kimi K2.5)
- `volcengine/glm-4-7-251222` ‏(GLM 4.7)
- `volcengine/deepseek-v3-2-251201` ‏(DeepSeek V3.2 128K)

نماذج البرمجة (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (دولي)

يوفّر BytePlus ARK الوصول إلى النماذج نفسها الموجودة في Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` ‏(البرمجة: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- نموذج مثال: `byteplus-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

يستخدم onboarding سطح البرمجة افتراضيًا، لكن فهرس `byteplus/*`
العام يُسجَّل في الوقت نفسه.

في ملتقطات اختيار النموذج في onboarding/configure، يفضّل خيار مصادقة BytePlus
كلًا من الصفوف `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن تلك النماذج
محملة بعد، فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من إظهار
ملتقط فارغ خاص بالموفّر.

النماذج المتاحة:

- `byteplus/seed-1-8-251228` ‏(Seed 1.8)
- `byteplus/kimi-k2-5-260127` ‏(Kimi K2.5)
- `byteplus/glm-4-7-251222` ‏(GLM 4.7)

نماذج البرمجة (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

يوفّر Synthetic نماذج متوافقة مع Anthropic خلف الموفّر `synthetic`:

- الموفّر: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- نموذج مثال: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: ‏`openclaw onboard --auth-choice synthetic-api-key`

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
- المصادقة: `MINIMAX_API_KEY` من أجل `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` من أجل `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للحصول على تفاصيل الإعداد، وخيارات النماذج، ومقتطفات الإعدادات.

على مسار البث المتوافق مع Anthropic الخاص بـ MiniMax، يقوم OpenClaw بتعطيل التفكير
افتراضيًا ما لم تقم بتعيينه صراحةً، وتقوم `/fast on` بإعادة كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم القدرات المملوك لـ Plugin:

- تبقى القيم الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- يكون توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور هو `MiniMax-VL-01` المملوك لـ Plugin على كلا مساري مصادقة MiniMax
- يبقى البحث على الويب على معرّف الموفّر `minimax`

### LM Studio

يأتي LM Studio كـ Plugin موفّر مدمج يستخدم API الأصلية:

- الموفّر: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- Base URL الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط نموذجًا (استبدله بأحد المعرّفات المعادة من `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw المسارين الأصليين لـ LM Studio وهما `/api/v1/models` و`/api/v1/models/load`
للاكتشاف + التحميل التلقائي، مع استخدام `/v1/chat/completions` للاستدلال افتراضيًا.
راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama كـ Plugin موفّر مدمج ويستخدم API الأصلية الخاصة بـ Ollama:

- الموفّر: `ollama`
- المصادقة: لا يلزم شيء (خادم محلي)
- نموذج مثال: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# ثبّت Ollama، ثم اسحب نموذجًا:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يتم اكتشاف Ollama محليًا على `http://127.0.0.1:11434` عندما تشترك باستخدام
`OLLAMA_API_KEY`، ويضيف Plugin الموفّر المجمّع Ollama مباشرةً إلى
`openclaw onboard` وملتقط النماذج. راجع [/providers/ollama](/ar/providers/ollama)
للاطلاع على onboarding، ووضع السحابة/الوضع المحلي، والإعدادات المخصصة.

### vLLM

يأتي vLLM كـ Plugin موفّر مدمج للخوادم المحلية/المستضافة ذاتيًا
المتوافقة مع OpenAI:

- الموفّر: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- Base URL الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا لم يكن خادمك يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات المعادة من `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang كـ Plugin موفّر مدمج للخوادم السريعة المستضافة ذاتيًا
المتوافقة مع OpenAI:

- الموفّر: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- Base URL الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا لم يكن خادمك
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات المعادة من `/v1/models`):

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

ملاحظات:

- بالنسبة إلى الموفّرين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية.
  وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: تعيين قيم صريحة تطابق حدود الوكيل/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء الموفر 400 الخاصة بأدوار `developer` غير المدعومة.
- كما أن المسارات المتوافقة مع OpenAI بنمط الوكيل تتجاوز أيضًا تشكيل الطلبات الخاص بـ OpenAI الأصلي فقط:
  لا `service_tier`، ولا `store` في Responses، ولا تلميحات prompt-cache، ولا
  تشكيل حمولة توافق الاستدلال الخاصة بـ OpenAI، ولا ترويسات الإسناد
  المخفية الخاصة بـ OpenClaw.
- إذا كانت `baseUrl` فارغة/محذوفة، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- ولأسباب تتعلق بالسلامة، فإن القيمة الصريحة `compat.supportsDeveloperRole: true` تظل مُتجاوَزة على نقاط النهاية غير الأصلية `openai-completions`.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [/gateway/configuration](/ar/gateway/configuration) للحصول على أمثلة إعداد كاملة.

## ذو صلة

- [النماذج](/ar/concepts/models) — إعدادات النماذج والأسماء المستعارة
- [Model Failover](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطي وسلوك إعادة المحاولة
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — مفاتيح إعدادات النماذج
- [الموفّرون](/ar/providers) — أدلة إعداد لكل موفّر
