---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل موفّر على حدة
    - تريد أمثلة على الإعدادات أو أوامر الإعداد الأولي عبر CLI لمزوّدي النماذج
sidebarTitle: Model providers
summary: نظرة عامة على مزوّدي النماذج مع تكوينات أمثلة وتدفقات CLI
title: مزودو النماذج
x-i18n:
    generated_at: "2026-05-03T21:31:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2c94e8f0c8d70cd772990e4d9d41a5670855eef4aea5162e021f18d5ee6c899
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع لـ **مزودي LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). لقواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع النماذج ومساعدات CLI">
    - تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - تعمل `agents.defaults.models` كقائمة سماح عند ضبطها.
    - مساعدات CLI: `openclaw onboard`، و`openclaw models list`، و`openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` القيم الافتراضية على مستوى المزود؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، ومجسات التهدئة، واستمرار تجاوزات الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="إضافة مصادقة مزود لا تغير نموذجك الأساسي">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` الموجود عند إضافة مزود أو إعادة مصادقته. قد تظل Plugins المزود تعيد نموذجًا افتراضيًا موصى به في تصحيح إعداد المصادقة الخاص بها، لكن configure يتعامل مع ذلك على أنه "اجعل هذا النموذج متاحًا" عندما يكون هناك نموذج أساسي موجود بالفعل، وليس "استبدل النموذج الأساسي الحالي."

    للتبديل عمدًا إلى النموذج الافتراضي، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="فصل مزود OpenAI ووقت التشغيل">
    مسارات عائلة OpenAI خاصة بالبادئة:

    - يستخدم `openai/<model>` مع `agents.defaults.agentRuntime.id: "codex"` حزمة خادم التطبيق الأصلية لـ Codex. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - يستخدم `openai-codex/<model>` OAuth الخاص بـ Codex في PI.
    - يستخدم `openai/<model>` بدون تجاوز وقت تشغيل Codex مزود مفتاح API المباشر لـ OpenAI في PI.

    راجع [OpenAI](/ar/providers/openai) و[حزمة Codex](/ar/plugins/codex-harness). إذا كان فصل المزود/وقت التشغيل مربكًا، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي لـ Plugin الحد نفسه: ينتمي `openai-codex/<model>` إلى Plugin الخاصة بـ OpenAI، بينما تُفعَّل Plugin الخاصة بـ Codex بواسطة `agentRuntime.id: "codex"` أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر حزمة خادم التطبيق الأصلية لـ Codex عند ضبط `agentRuntime.id: "codex"`، وعبر `openai-codex/gpt-5.5` في PI لـ OAuth الخاص بـ Codex، وعبر `openai/gpt-5.5` في PI لحركة مرور مفتاح API المباشرة عندما يتيح حسابك ذلك.

  </Accordion>
  <Accordion title="أوقات تشغيل CLI">
    تستخدم أوقات تشغيل CLI الفصل نفسه: اختر مراجع نماذج معيارية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط `agents.defaults.agentRuntime.id` إلى `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد خلفية CLI محلية.

    تنتقل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة مرة أخرى إلى مراجع المزود المعيارية مع تسجيل وقت التشغيل بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك المزود المملوك لـ Plugin

تعيش معظم المنطقات الخاصة بالمزود في Plugins المزود (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تمتلك Plugins الإعداد الأولي، وفهارس النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعداد، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، والمزيد.

توجد القائمة الكاملة لخطافات provider-SDK وأمثلة Plugins المضمنة في [Plugins المزود](/ar/plugins/sdk-provider-plugins). المزود الذي يحتاج منفذ طلبات مخصصًا بالكامل هو سطح توسيع منفصل وأعمق.

<Note>
يعيش سلوك المشغل المملوك للمزود على خطافات مزود صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف البث، ومساعدات النقل/الطلب. حاوية `ProviderPlugin.capabilities` الثابتة القديمة للتوافق فقط ولم يعد يقرأها منطق المشغل المشترك.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="مصادر المفاتيح وأولويتها">
    اضبط عدة مفاتيح عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى مزودي Google، يُضمَّن `GOOGLE_API_KEY` أيضًا كرجوع احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - يُعاد إرسال الطلبات بالمفتاح التالي فقط عند استجابات حد المعدل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
    - تفشل الإخفاقات غير المتعلقة بحد المعدل فورًا؛ ولا تُجرى محاولة تدوير مفاتيح.
    - عندما تفشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من المحاولة الأخيرة.

  </Accordion>
</AccordionGroup>

## المزودون المدمجون (فهرس pi-ai)

يأتي OpenClaw مع فهرس pi‑ai. لا يتطلب هؤلاء المزودون أي إعداد `models.providers`؛ ما عليك سوى ضبط المصادقة واختيار نموذج.

### OpenAI

- المزود: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS`، و`OPENAI_API_KEY_1`، و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- نماذج أمثلة: `openai/gpt-5.5`، و`openai/gpt-5.4-mini`
- تحقق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت معين أو مفتاح API يتصرف بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- التهيئة المسبقة لـ OpenAI Responses WebSocket مفعلة افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل معالجة أولوية OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد طبقة صريحة بدلًا من تبديل `/fast` المشترك
- لا تنطبق ترويسات إسناد OpenClaw المخفية (`originator` و`version` و`User-Agent`) إلا على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء المتوافقين عمومًا مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بـ Responses `store`، وتلميحات ذاكرة التخزين المؤقت للموجه، وتشكيل حمولة توافق استدلال OpenAI؛ أما مسارات الوكيل فلا تفعل ذلك
- يجري حجب `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API المباشرة ترفضه وفهرس Codex الحالي لا يعرضه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- المزود: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS`، و`ANTHROPIC_API_KEY_1`، و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- نموذج مثال: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة تبديل `/fast` المشترك و`params.fastMode`، بما في ذلك حركة المرور الموثقة بمفتاح API وبـ OAuth المرسلة إلى `api.anthropic.com`؛ ويربط OpenClaw ذلك إلى `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضل على مرجع النموذج معياريًا ويختار خلفية CLI
  بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agents.defaults.agentRuntime.id: "claude-cli"`. تظل مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا موظفو Anthropic بأن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل setup-token الخاص بـ Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- المزود: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مرجع نموذج PI: `openai-codex/gpt-5.5`
- مرجع حزمة خادم التطبيق الأصلية لـ Codex: `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`
- مستندات حزمة خادم التطبيق الأصلية لـ Codex: [حزمة Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` Plugin الخاصة بـ OpenAI؛ ولا تُختار Plugin خادم التطبيق الأصلية لـ Codex إلا بواسطة وقت تشغيل حزمة Codex أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرر `params.serviceTier` أيضًا على طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- لا تُرفق ترويسات إسناد OpenClaw المخفية (`originator` و`version` و`User-Agent`) إلا على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء المتوافقين عمومًا مع OpenAI
- يشارك تبديل `/fast` وإعداد `params.fastMode` نفسيهما مثل `openai/*` المباشر؛ ويربط OpenClaw ذلك إلى `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` قيمة فهرس Codex الأصلية `contextWindow = 400000` وقيمة وقت التشغيل الافتراضية `contextTokens = 272000`؛ تجاوز حد وقت التشغيل باستخدام `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: OpenAI Codex OAuth مدعوم صراحة للأدوات/مسارات العمل الخارجية مثل OpenClaw.
- بالنسبة إلى المسار الشائع للاشتراك مع وقت تشغيل Codex الأصلي، سجّل الدخول بمصادقة `openai-codex` لكن اضبط `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`.
- استخدم `openai-codex/gpt-5.5` فقط عندما تريد مسار Codex OAuth/الاشتراك عبر PI؛ واستخدم `openai/gpt-5.5` بدون تجاوز وقت تشغيل Codex عندما يتيح إعداد مفتاح API والفهرس المحلي لديك مسار API العام.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
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

### خيارات مستضافة أخرى بأسلوب الاشتراك

<CardGroup cols={3}>
  <Card title="نماذج GLM" href="/ar/providers/glm">
    خطة Z.AI Coding Plan أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    OAuth لخطة MiniMax Coding Plan أو الوصول بمفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح مزود Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- مزود وقت تشغيل Zen: `opencode`
- مزود وقت تشغيل Go: `opencode-go`
- نماذج أمثلة: `opencode/claude-opus-4-6`، و`opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY`
- تدوير اختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، وبديل `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- نماذج أمثلة: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- التوافق: تتم تسوية إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يتم قبول `google/gemini-3.1-pro` وتسويته إلى معرّف Gemini API المباشر من Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. تحذف Gemini 3/3.1 قيمة `thinkingLevel` ثابتة؛ وترسل Gemini 2.5 قيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير مقبض أصلي للمزوّد بصيغة `cachedContents/...`؛ وتظهر إصابات ذاكرة التخزين المؤقت في Gemini بوصفها `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، `google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
يعد OAuth الخاص بـ Gemini CLI في OpenClaw تكاملًا غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يتم شحن OAuth الخاص بـ Gemini CLI كجزء من Plugin `google` المضمّن.

<Steps>
  <Step title="تثبيت Gemini CLI">
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
  <Step title="تفعيل Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="تسجيل الدخول">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. لا تلصق **مطلقًا** معرّف عميل أو سرًا في `openclaw.json`. يخزن تدفق تسجيل الدخول في CLI الرموز المميزة في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="تعيين المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

تُحلّل ردود JSON من Gemini CLI من `response`؛ ويتراجع حساب الاستخدام إلى `stats`، مع تسوية `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- نموذج مثال: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: تتم تسوية `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ وتفرض `zai-coding-global`، و`zai-coding-cn`، و`zai-global`، و`zai-cn` سطحًا محددًا

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
- التوجيه الدقيق في المنبع خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway، وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) لتفاصيل الإعداد.

### Plugins مزوّدي أخرى مضمّنة

| المزوّد                 | المعرّف                         | متغيّر بيئة المصادقة                                         | نموذج مثال                                    |
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
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### خصوصيات يجدر معرفتها

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات إسناد التطبيق وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` المتحقَّق منها. مراجع DeepSeek وMoonshot وZAI مؤهلة لاستخدام مدة بقاء ذاكرة التخزين المؤقت للمطالبات التي يديرها OpenRouter، لكنها لا تتلقى علامات تخزين Anthropic المؤقت. وبصفته مسارًا متوافقًا مع OpenAI بنمط الوكيل، فإنه يتخطى التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، و`store` في Responses، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتوافق الاستدلال مع OpenAI). تحتفظ المراجع المدعومة بـ Gemini بتنظيف توقيع التفكير الخاص بوكيل Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة بـ Gemini مسار التنظيف نفسه الخاص بوكيل Gemini؛ وتتخطى `kilocode/kilo/auto` والمراجع الأخرى التي لا تدعم استدلال الوكيل حقن استدلال الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    يكتب الإعداد الأولي بمفتاح API تعريفات صريحة لنماذج محادثة M2.7 النصية فقط؛ ويبقى فهم الصور على مزود الوسائط `MiniMax-VL-01` المملوك للـ plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (على سبيل المثال `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ أدوات الاختيار على تركيب `<provider>/<model-id>` الحرفي بينما يبقى المفتاح القانوني المرسل إلى API ذا بادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار Responses الخاص بـ xAI. `grok-4.3` هو نموذج المحادثة الافتراضي المضمّن. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    يُشحن بوصفه provider plugin المضمّن `cerebras`. يستخدم GLM `zai-glm-4.7`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (مخصص/عنوان URL الأساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزودين **مخصصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

ينشر العديد من provider plugins المضمّنة أدناه كتالوجًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوصات قدرات نماذج Gateway أيضًا بيانات `models.providers.<id>.models[]` الوصفية الصريحة. إذا كان نموذج مخصص أو وكيل يقبل الصور، فاضبط `input: ["text", "image"]` على ذلك النموذج بحيث تمرر مسارات مرفقات WebChat والصادرة من العقدة الصور كمدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

### Moonshot AI (Kimi)

يُشحن Moonshot بوصفه provider plugin مضمّنًا. استخدم المزود المدمج افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات النموذج الوصفية:

- المزود: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال نموذج: `moonshot/kimi-k2.6`
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

يستخدم Kimi Coding نقطة نهاية Moonshot AI المتوافقة مع Anthropic:

- المزود: `kimi`
- المصادقة: `KIMI_API_KEY`
- مثال نموذج: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

يظل `kimi/k2p5` القديم مقبولًا باعتباره معرف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- الموفر: `volcengine` (الترميز: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال نموذج: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

تكون الإعدادات الافتراضية للإعداد الأولي على سطح الترميز، لكن كتالوج `volcengine/*` العام يُسجَّل في الوقت نفسه.

في منتقيات النماذج أثناء الإعداد الأولي/التكوين، يفضّل خيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معًا. إذا لم تكن هذه النماذج محمّلة بعد، يرجع OpenClaw إلى الكتالوج غير المفلتر بدلًا من عرض منتقي فارغ مقيّد بالموفر.

<Tabs>
  <Tab title="النماذج القياسية">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="نماذج الترميز (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (دولي)

يوفر BytePlus ARK الوصول إلى النماذج نفسها مثل Volcano Engine للمستخدمين الدوليين.

- الموفر: `byteplus` (الترميز: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال نموذج: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

تكون الإعدادات الافتراضية للإعداد الأولي على سطح الترميز، لكن كتالوج `byteplus/*` العام يُسجَّل في الوقت نفسه.

في منتقيات النماذج أثناء الإعداد الأولي/التكوين، يفضّل خيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معًا. إذا لم تكن هذه النماذج محمّلة بعد، يرجع OpenClaw إلى الكتالوج غير المفلتر بدلًا من عرض منتقي فارغ مقيّد بالموفر.

<Tabs>
  <Tab title="النماذج القياسية">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="نماذج الترميز (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

يوفر Synthetic نماذج متوافقة مع Anthropic خلف موفر `synthetic`:

- الموفر: `synthetic`
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

يُكوَّن MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (عالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للاطلاع على تفاصيل الإعداد، وخيارات النماذج، ومقاطع التكوين.

<Note>
على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير افتراضيًا ما لم تضبطه صراحة، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم القدرات المملوك للـ Plugin:

- تظل افتراضيات النص/الدردشة على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك للـ Plugin وهو `MiniMax-VL-01` على كلا مساري مصادقة MiniMax
- يبقى بحث الويب على معرف الموفر `minimax`

### LM Studio

يأتي LM Studio كـ Plugin موفر مضمّن يستخدم واجهة API الأصلية:

- الموفر: `lmstudio`
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

يستخدم OpenClaw مساري LM Studio الأصليين `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضيًا. إذا أردت أن يمتلك تحميل JIT في LM Studio وTTL والإخلاء التلقائي دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama كـ Plugin موفر مضمّن ويستخدم واجهة API الأصلية لـ Ollama:

- الموفر: `ollama`
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

يُكتشف Ollama محليًا عند `http://127.0.0.1:11434` عندما تختار الاشتراك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin الموفر المضمّن Ollama مباشرة إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للإعداد الأولي، ووضع السحابة/المحلي، والتكوين المخصص.

### vLLM

يأتي vLLM كـ Plugin موفر مضمّن للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

- الموفر: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

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

يأتي SGLang كـ Plugin موفر مضمّن لخوادم سريعة ذاتية الاستضافة ومتوافقة مع OpenAI:

- الموفر: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

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

### الوكلاء المحليون (LM Studio، vLLM، LiteLLM، إلخ.)

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
  <Accordion title="الحقول الاختيارية الافتراضية">
    بالنسبة إلى الموفرين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="قواعد تشكيل مسارات الوكيل">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من الموفر للأدوار `developer` غير المدعومة.
    - تتخطى المسارات الوكيلة المتوافقة مع OpenAI أيضًا تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط: لا `service_tier`، ولا `store` في Responses، ولا `store` في Completions، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة توافق التفكير في OpenAI، ولا ترويسات إسناد OpenClaw مخفية.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في نص الطلب الصادر.
    - بالنسبة إلى عناصر تحكم قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى التفكير في الجلسة متوقفًا.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/tailnet البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يمدد هذا معالجة طلبات HTTP لنموذج الموفر، بما في ذلك الاتصال، والترويسات، وبث النص، وإيقاف الجلب المحمي الكلي، دون زيادة مهلة تشغيل الوكيل كاملة.
    - تسمح استدعاءات HTTP لموفر النموذج بإجابات DNS الوهمية Fake-IP من Surge وClash وsing-box ضمن `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف `baseUrl` الخاص بالموفر المكوّن. لا تزال الوجهات الخاصة الأخرى، وlocal loopback، وlink-local، ووجهات البيانات الوصفية تتطلب اشتراكًا صريحًا عبر `models.providers.<id>.request.allowPrivateNetwork: true`.
    - إذا كان `baseUrl` فارغًا/محذوفًا، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
    - من أجل السلامة، لا تزال القيمة الصريحة `compat.supportsDeveloperRole: true` تُستبدل على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي موفر غير `anthropic` الرسمي، أو `models.providers.anthropic.baseUrl` مخصص لا يكون مضيفه نقطة نهاية عامة لـ `api.anthropic.com`)، يكبت OpenClaw ترويسات Anthropic beta الضمنية مثل `claude-code-20250219` و`interleaved-thinking-2025-05-14` وعلامات OAuth، بحيث لا ترفض الوكلاء المخصصون المتوافقون مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحة إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [التكوين](/ar/gateway/configuration) للحصول على أمثلة تكوين كاملة.

## ذات صلة

- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — مفاتيح تكوين النماذج
- [تجاوز فشل النموذج](/ar/concepts/model-failover) — سلاسل الرجوع وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) — تكوين النماذج والأسماء المستعارة
- [الموفرون](/ar/providers) — أدلة الإعداد لكل موفر
