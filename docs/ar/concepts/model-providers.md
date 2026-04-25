---
read_when:
    - أنت بحاجة إلى مرجع لإعداد النماذج حسب كل موفر على حدة
    - تريد أمثلة على التهيئة أو أوامر الإعداد عبر CLI لموفري النماذج
summary: نظرة عامة على موفر النماذج مع أمثلة على التهيئة وتدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-04-25T18:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0991f256bfeda9086eaa2911cc8056561dce84ee8cb9c16e99602eb396bbee83
    source_path: concepts/model-providers.md
    workflow: 15
---

مرجع **موفري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). للاطلاع على قواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
- يعمل `agents.defaults.models` كقائمة سماح عند تعيينه.
- مساعدات CLI: ‏`openclaw onboard`، ‏`openclaw models list`، ‏`openclaw models set <provider/model>`.
- يمثّل `models.providers.*.models[].contextWindow` بيانات تعريف أصلية للنموذج؛ أما `contextTokens` فهو الحد الفعّال وقت التشغيل.
- قواعد الرجوع الاحتياطي، وفحوصات التهدئة، واستمرارية تجاوزات الجلسة: [فشل النماذج والتبديل الاحتياطي](/ar/concepts/model-failover).
- تكون مسارات عائلة OpenAI خاصة بالبادئة: يستخدم `openai/<model>` موفر مفتاح API المباشر لـ OpenAI في PI، ويستخدم `openai-codex/<model>` Codex OAuth في PI، ويستخدم `openai/<model>` مع `agents.defaults.embeddedHarness.runtime: "codex"` تسخير خادم تطبيقات Codex الأصلي. راجع [OpenAI](/ar/providers/openai) و[Codex harness](/ar/plugins/codex-harness). إذا كان الفصل بين الموفّر ووقت التشغيل مربكًا، فاقرأ أولًا [أزمنة تشغيل الوكلاء](/ar/concepts/agent-runtimes).
- يتبع التفعيل التلقائي لـ Plugin هذا الحد نفسه: ينتمي `openai-codex/<model>` إلى Plugin الخاص بـ OpenAI، بينما يُفعَّل Plugin الخاص بـ Codex بواسطة `embeddedHarness.runtime: "codex"` أو مراجع `codex/<model>` القديمة.
- تستخدم أزمنة تشغيل CLI الفصل نفسه: اختر مراجع نماذج قياسية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم عيّن `agents.defaults.embeddedHarness.runtime` إلى `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد واجهة خلفية CLI محلية. تُرحَّل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة إلى مراجع موفر قياسية مع تسجيل وقت التشغيل بشكل منفصل.
- يتوفر GPT-5.5 عبر `openai/gpt-5.5` لحركة المرور المباشرة بمفتاح API، و`openai-codex/gpt-5.5` في PI من أجل Codex OAuth، وتسخير خادم تطبيقات Codex الأصلي عند تعيين `embeddedHarness.runtime: "codex"`.

## سلوك الموفّر المملوك لـ Plugin

يوجد معظم المنطق الخاص بكل موفّر في Plugins الموفّر (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تتولى Plugins الإعداد، وكتالوجات النماذج، وربط متغيرات البيئة الخاصة بالمصادقة، وتطبيع النقل/التهيئة، وتنظيف مخطط الأدوات، وتصنيف التبديل الاحتياطي، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات Provider SDK وأمثلة Plugins المجمعة في [Plugins الموفّر](/ar/plugins/sdk-provider-plugins). أما الموفّر الذي يحتاج إلى منفّذ طلبات مخصص بالكامل فهو سطح امتداد منفصل وأعمق.

<Note>
تُعد `capabilities` الخاصة بوقت تشغيل الموفّر بيانات تعريف مشتركة للمشغّل (عائلة الموفّر، وخصائص السجل/الأدوات، وتلميحات النقل/التخزين المؤقت). وهي ليست نفسها [نموذج الإمكانات العام](/ar/plugins/architecture#public-capability-model)، الذي يصف ما الذي يسجله Plugin (استدلال نصي، وكلام، وغير ذلك).
</Note>

## تدوير مفاتيح API

- يدعم تدويرًا عامًا لمفاتيح الموفّر لدى موفّرين محددين.
- اضبط عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فاصلة منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفري Google، يُدرج أيضًا `GOOGLE_API_KEY` كخيار احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- يُعاد تنفيذ الطلبات باستخدام المفتاح التالي فقط عند ردود تحديد المعدل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
- تفشل الأخطاء غير المرتبطة بتحديد المعدل مباشرة؛ ولا تُجرى أي محاولة لتدوير المفتاح.
- عند فشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.

## الموفّرون المدمجون (كتالوج pi-ai)

يشحن OpenClaw مع كتالوج pi‑ai. لا تتطلب هذه الموفّرات أي إعداد `models.providers`؛ فقط اضبط المصادقة واختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة للنماذج: `openai/gpt-5.5`، ‏`openai/gpt-5.4-mini`
- تحقّق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت معيّن أو مفتاح API معيّن يتصرف بشكل مختلف.
- CLI: ‏`openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE احتياطيًا)
- يمكن التجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يكون الإحماء المسبق لـ OpenAI Responses WebSocket مفعّلًا افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تمكين المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات `openai/*` Responses المباشرة إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدلًا من مفتاح التبديل المشترك `/fast`
- تُطبَّق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء المتوافقين عمومًا مع OpenAI
- تحتفظ أيضًا مسارات OpenAI الأصلية بإعداد `store` الخاص بـ Responses، وتلميحات تخزين المطالبات مؤقتًا، وتشكيل الحمولة المتوافق مع OpenAI reasoning؛ أما المسارات الوكيلة فلا تفعل ذلك
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API المباشرة ترفضه ولأن كتالوج Codex الحالي لا يعرّضه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال للنموذج: `anthropic/claude-opus-4-6`
- CLI: ‏`openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك حركة المرور المرسلة إلى `api.anthropic.com` والمصادَق عليها بمفتاح API أو OAuth؛ ويربط OpenClaw ذلك إلى `service_tier` الخاص بـ Anthropic (`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- لا يزال رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- الموفّر: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مرجع نموذج PI: ‏`openai-codex/gpt-5.5`
- مرجع تسخير خادم تطبيقات Codex الأصلي: ‏`openai/gpt-5.5` مع `agents.defaults.embeddedHarness.runtime: "codex"`
- توثيق تسخير خادم تطبيقات Codex الأصلي: [Codex harness](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` Plugin الخاص بـ OpenAI؛ أما Plugin خادم تطبيقات Codex الأصلي فلا يُختار إلا بواسطة وقت تشغيل Codex harness أو مراجع `codex/*` القديمة.
- CLI: ‏`openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE احتياطيًا)
- يمكن التجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرَّر `params.serviceTier` أيضًا على طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- لا تُرفق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`) إلا على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء المتوافقين عمومًا مع OpenAI
- يشارك مفتاح التبديل `/fast` نفسه وإعداد `params.fastMode` نفسه مع `openai/*` المباشر؛ ويربط OpenClaw ذلك إلى `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` القيمة الأصلية من كتالوج Codex وهي `contextWindow = 400000` والحد الافتراضي وقت التشغيل `contextTokens = 272000`؛ ويمكن تجاوز حد وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة تتعلق بالسياسة: إن OpenAI Codex OAuth مدعوم صراحةً للأدوات/مسارات العمل الخارجية مثل OpenClaw.
- استخدم `openai-codex/gpt-5.5` عندما تريد مسار Codex OAuth/الاشتراك؛ واستخدم `openai/gpt-5.5` عندما يوفّر إعداد مفتاح API والكتالوج المحلي لديك مسار API العام.

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

### خيارات أخرى مستضافة بنمط الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح موفّر Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو واجهات API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر وقت تشغيل Zen: ‏`opencode`
- موفّر وقت تشغيل Go: ‏`opencode-go`
- أمثلة للنماذج: `opencode/claude-opus-4-6`، ‏`opencode-go/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفّر: `google`
- المصادقة: `GEMINI_API_KEY`
- تدوير اختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2`، مع خيار احتياطي `GOOGLE_API_KEY`، بالإضافة إلى `OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- أمثلة للنماذج: `google/gemini-3.1-pro-preview`، ‏`google/gemini-3-flash-preview`
- التوافق: تُطبَّع تهيئة OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: ‏`openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي في Google. لا ترسل Gemini 3/3.1 قيمة ثابتة لـ `thinkingLevel`؛ أما Gemini 2.5 فترسل `thinkingBudget: -1`.
- تقبل تشغيلات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير مقبض `cachedContents/...` أصلي من الموفّر؛ وتظهر إصابات ذاكرة Gemini المؤقتة في OpenClaw على أنها `cacheRead`

### Google Vertex وGemini CLI

- الموفّرون: `google-vertex`، ‏`google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: يُعد OAuth الخاص بـ Gemini CLI في OpenClaw تكاملًا غير رسمي. وقد أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يُشحن Gemini CLI OAuth كجزء من Plugin ‏`google` المجمّع.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التمكين: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: أنت **لا** تلصق معرّف عميل أو سرًا في `openclaw.json`. يخزّن تدفق تسجيل الدخول عبر CLI الرموز في ملفات تعريف المصادقة على مضيف Gateway.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  - تُحلَّل ردود JSON الخاصة بـ Gemini CLI من `response`، ويعود الاستخدام إلى `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- الموفّر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال للنموذج: `zai/glm-5.1`
- CLI: ‏`openclaw onboard --auth-choice zai-api-key`
  - الأسماء البديلة: تُطبَّع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ بينما تفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- الموفّر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة للنماذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`، ‏`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: ‏`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفّر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال للنموذج: `kilocode/kilo/auto`
- CLI: ‏`openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن كتالوج احتياطي ثابت مع `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` المباشر توسيع كتالوج وقت التشغيل بشكل إضافي.
- إن التوجيه الدقيق من المنبع وراء `kilocode/kilo/auto` مملوك لـ Kilo Gateway، وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### Plugins موفّرين مجمّعة أخرى

| الموفّر                 | المعرّف                          | متغيرات بيئة المصادقة                                      | مثال للنموذج                                   |
| ----------------------- | -------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                         | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                         | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                            | —                                              |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                         | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`       | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                             | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                         | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                       | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                  | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                          | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                         | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                           | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                       | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                          | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                          |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                          | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                         | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                           | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                       | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                   | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                              | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                           | `xiaomi/mimo-v2-flash`                         |

خصائص تستحق المعرفة:

- **OpenRouter** يطبّق رؤوس إسناد التطبيق وعلامات `cache_control` الخاصة بـ Anthropic فقط على المسارات التي تم التحقق منها في `openrouter.ai`. تكون مراجع DeepSeek وMoonshot وZAI مؤهلة لزمن صلاحية التخزين المؤقت للمطالبات الذي يديره OpenRouter لكنها لا تتلقى علامات التخزين المؤقت الخاصة بـ Anthropic. وباعتباره مسارًا وكيلًا متوافقًا مع OpenAI، فإنه يتخطى التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier` و`store` الخاص بـ Responses وتلميحات التخزين المؤقت للمطالبات والتوافق مع OpenAI reasoning). تحتفظ المراجع المعتمدة على Gemini فقط بتنقية توقيع التفكير الخاصة بـ Gemini عبر الوكيل.
- **Kilo Gateway** تتبع المراجع المعتمدة على Gemini فيه مسار التنقية نفسه الخاص بـ Gemini عبر الوكيل؛ أما `kilocode/kilo/auto` والمراجع الأخرى التي لا تدعم التفكير عبر الوكيل فتتخطى حقن التفكير عبر الوكيل.
- **MiniMax** يكتب الإعداد باستخدام مفتاح API تعريفات صريحة لنماذج دردشة M2.7 النصية فقط؛ ويبقى فهم الصور لدى موفّر الوسائط `MiniMax-VL-01` المملوك لـ Plugin.
- **xAI** يستخدم مسار xAI Responses. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى صيغها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** تستخدم نماذج GLM المعرّفين `zai-glm-4.7` و`zai-glm-4.6`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.

## الموفّرون عبر `models.providers` (مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة موفّرين **مخصصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

تنشر العديد من Plugins الموفّرين المجمّعة أدناه كتالوجًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الرؤوس أو قائمة النماذج.

### Moonshot AI (Kimi)

يُشحن Moonshot كـ Plugin موفّر مجمّع. استخدم الموفّر المدمج افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات تعريف النموذج:

- الموفّر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال للنموذج: `moonshot/kimi-k2.6`
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

يستخدم Kimi Coding نقطة نهاية Moonshot AI المتوافقة مع Anthropic:

- الموفّر: `kimi`
- المصادقة: `KIMI_API_KEY`
- مثال للنموذج: `kimi/kimi-code`

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

يوفر Volcano Engine ‏(火山引擎) الوصول إلى Doubao ونماذج أخرى داخل الصين.

- الموفّر: `volcengine` (للبرمجة: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال للنموذج: `volcengine-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

يكون الإعداد الافتراضي موجّهًا إلى سطح البرمجة، لكن كتالوج `volcengine/*` العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النماذج الخاصة بالإعداد/التهيئة، يفضّل خيار مصادقة Volcengine كلًا من صفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلًا من إظهار أداة اختيار فارغة ضمن نطاق الموفّر.

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

### BytePlus (الدولي)

يوفر BytePlus ARK الوصول إلى النماذج نفسها التي يوفرها Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` (للبرمجة: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال للنموذج: `byteplus-plan/ark-code-latest`
- CLI: ‏`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

يكون الإعداد الافتراضي موجّهًا إلى سطح البرمجة، لكن كتالوج `byteplus/*` العام يُسجَّل في الوقت نفسه.

في أدوات اختيار النماذج الخاصة بالإعداد/التهيئة، يفضّل خيار مصادقة BytePlus كلًا من صفوف `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلًا من إظهار أداة اختيار فارغة ضمن نطاق الموفّر.

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
- مثال للنموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

يُضبط MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth ‏(عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth ‏(الصين): `--auth-choice minimax-cn-oauth`
- مفتاح API لـ MiniMax ‏(عالمي): `--auth-choice minimax-global-api`
- مفتاح API لـ MiniMax ‏(الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للحصول على تفاصيل الإعداد وخيارات النماذج ومقتطفات التهيئة.

في مسار البث المتوافق مع Anthropic الخاص بـ MiniMax، يعطّل OpenClaw التفكير افتراضيًا ما لم تقم بتعيينه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم الإمكانات المملوك لـ Plugin:

- تبقى إعدادات النص/الدردشة الافتراضية على `minimax/MiniMax-M2.7`
- يكون توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور عبر `MiniMax-VL-01` المملوك لـ Plugin على مساري مصادقة MiniMax كليهما
- يبقى البحث على الويب على معرّف الموفّر `minimax`

### LM Studio

يُشحن LM Studio كـ Plugin موفّر مجمّع يستخدم API الأصلية:

- الموفّر: `lmstudio`
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

يستخدم OpenClaw المسارين الأصليين في LM Studio وهما `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، ويستخدم `/v1/chat/completions` للاستدلال افتراضيًا.
راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يُشحن Ollama كـ Plugin موفّر مجمّع ويستخدم API الأصلية الخاصة بـ Ollama:

- الموفّر: `ollama`
- المصادقة: لا يلزم شيء (خادم محلي)
- مثال للنموذج: `ollama/llama3.3`
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

يُكتشف Ollama محليًا على `http://127.0.0.1:11434` عندما تختار التفعيل باستخدام
`OLLAMA_API_KEY`، ويضيف Plugin الموفّر المجمّع Ollama مباشرةً إلى
`openclaw onboard` وأداة اختيار النماذج. راجع [/providers/ollama](/ar/providers/ollama)
للحصول على الإعداد، ووضع السحابة/الوضع المحلي، والتهيئة المخصصة.

### vLLM

يُشحن vLLM كـ Plugin موفّر مجمّع للخوادم المحلية/المستضافة ذاتيًا المتوافقة مع OpenAI:

- الموفّر: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للتفعيل المحلي للاكتشاف التلقائي (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

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

يُشحن SGLang كـ Plugin موفّر مجمّع للخوادم السريعة المستضافة ذاتيًا
المتوافقة مع OpenAI:

- الموفّر: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للتفعيل المحلي للاكتشاف التلقائي (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

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

### الوكلاء المحليون (LM Studio وvLLM وLiteLLM وغير ذلك)

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
- بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من الموفّر عند عدم دعم أدوار `developer`.
- تتخطى أيضًا المسارات الوكيلة المتوافقة مع OpenAI التشكيل الخاص بـ OpenAI الأصلي فقط: لا يوجد `service_tier`، ولا `store` الخاص بـ Responses، ولا `store` الخاص بـ Completions، ولا تلميحات التخزين المؤقت للمطالبات، ولا تشكيل حمولة متوافق مع OpenAI reasoning، ولا رؤوس إسناد OpenClaw المخفية.
- بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد،
  عيّن `agents.defaults.models["provider/model"].params.extra_body` (أو
  `extraBody`) لدمج JSON إضافي في جسم الطلب الصادر.
- إذا كان `baseUrl` فارغًا/محذوفًا، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- ولأسباب تتعلق بالأمان، يظل أي تعيين صريح لـ `compat.supportsDeveloperRole: true` مُتجاوزًا على نقاط النهاية `openai-completions` غير الأصلية.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [التهيئة](/ar/gateway/configuration) للحصول على أمثلة التهيئة الكاملة.

## ذي صلة

- [النماذج](/ar/concepts/models) — تهيئة النموذج والأسماء البديلة
- [فشل النماذج والتبديل الاحتياطي](/ar/concepts/model-failover) — سلاسل الرجوع الاحتياطي وسلوك إعادة المحاولة
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) — مفاتيح تهيئة النموذج
- [الموفّرون](/ar/providers) — أدلة الإعداد لكل موفّر
