---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل مزوّد على حدة
    - تريد أمثلة على التكوينات أو أوامر الإعداد الأولي عبر CLI لموفّري النماذج
sidebarTitle: Model providers
summary: نظرة عامة على موفّر النماذج مع أمثلة إعدادات + تدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-05-03T07:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfb12090228ec89bc116558fe3e0bf9977c750550ef8efbf55b1af6c873c9825
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع لـ **مزوّدي LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). لقواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - يعمل `agents.defaults.models` كقائمة سماح عند ضبطه.
    - مساعدات CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` القيم الافتراضية على مستوى المزوّد؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، ومجسّات التهدئة، واستمرارية تجاوزات الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` الموجود عند إضافة مزوّد أو إعادة المصادقة معه. قد تستمر Plugins المزوّدين في إرجاع نموذج افتراضي موصى به في رقعة إعداد المصادقة الخاصة بها، لكن configure يتعامل مع ذلك على أنه "إتاحة هذا النموذج" عندما يكون هناك نموذج أساسي موجود بالفعل، وليس "استبدال النموذج الأساسي الحالي."

    للتبديل عمدًا إلى النموذج الافتراضي، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    مسارات عائلة OpenAI خاصة بالبادئة:

    - يستخدم `openai/<model>` مع `agents.defaults.agentRuntime.id: "codex"` حزمة تشغيل خادم تطبيق Codex الأصلية. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - يستخدم `openai-codex/<model>` OAuth الخاص بـ Codex في PI.
    - يستخدم `openai/<model>` دون تجاوز وقت تشغيل Codex مزوّد مفتاح API المباشر لـ OpenAI في PI.

    راجع [OpenAI](/ar/providers/openai) و[حزمة Codex](/ar/plugins/codex-harness). إذا كان فصل المزوّد/وقت التشغيل مربكًا، فاقرأ [أوقات تشغيل الوكيل](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي للـ Plugin الحد نفسه: ينتمي `openai-codex/<model>` إلى Plugin الخاصة بـ OpenAI، بينما يتم تفعيل Plugin الخاصة بـ Codex بواسطة `agentRuntime.id: "codex"` أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر حزمة تشغيل خادم تطبيق Codex الأصلية عند ضبط `agentRuntime.id: "codex"`، وعبر `openai-codex/gpt-5.5` في PI لـ Codex OAuth، وعبر `openai/gpt-5.5` في PI لحركة مرور مفتاح API المباشرة عندما يتيح حسابك ذلك.

  </Accordion>
  <Accordion title="CLI runtimes">
    تستخدم أوقات تشغيل CLI الفصل نفسه: اختر مراجع النماذج المعيارية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط `agents.defaults.agentRuntime.id` على `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد خلفية CLI محلية.

    تُرحَّل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة إلى مراجع المزوّدين المعيارية مع تسجيل وقت التشغيل بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك المزوّد المملوك للـ Plugin

توجد معظم المنطقات الخاصة بالمزوّدين في Plugins المزوّدين (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تمتلك Plugins الإعداد الأولي، وفهارس النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعداد، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، والمزيد.

توجد القائمة الكاملة لخطافات SDK المزوّد وأمثلة Plugins المضمّنة في [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins). المزوّد الذي يحتاج إلى منفّذ طلبات مخصص بالكامل هو سطح امتداد منفصل وأعمق.

<Note>
يقع سلوك المشغّل المملوك للمزوّد على خطافات مزوّد صريحة مثل سياسة الإعادة، وتطبيع مخطط الأدوات، وتغليف البث، ومساعدات النقل/الطلب. حاوية `ProviderPlugin.capabilities` الثابتة القديمة للتوافق فقط ولم تعد تُقرأ بواسطة منطق المشغّل المشترك.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="Key sources and priority">
    اضبط مفاتيح متعددة عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى مزوّدي Google، يُضمَّن `GOOGLE_API_KEY` أيضًا كخيار رجوع احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - تُعاد محاولة الطلبات بالمفتاح التالي فقط عند استجابات حدود المعدّل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
    - تفشل الإخفاقات غير المرتبطة بحدود المعدّل فورًا؛ ولا تُجرى محاولة تدوير للمفاتيح.
    - عندما تفشل كل المفاتيح المرشحة، يُعاد الخطأ النهائي من المحاولة الأخيرة.

  </Accordion>
</AccordionGroup>

## المزوّدون المضمّنون (فهرس pi-ai)

يأتي OpenClaw مع فهرس pi‑ai. لا يحتاج هؤلاء المزوّدون إلى إعداد `models.providers`؛ فقط اضبط المصادقة واختر نموذجًا.

### OpenAI

- المزوّد: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- نماذج أمثلة: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- تحقّق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا تصرّف تثبيت معيّن أو مفتاح API بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم تفعيل التسخين المسبق لـ OpenAI Responses WebSocket افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يعيّن `/fast` و`params.fastMode` طلبات Responses المباشرة لـ `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد طبقة صريحة بدلًا من مفتاح التبديل المشترك `/fast`
- لا تنطبق رؤوس إسناد OpenClaw المخفية (`originator`، `version`، `User-Agent`) إلا على حركة مرور OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بـ `store` في Responses، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتشكيل الحمولة المتوافق مع استدلال OpenAI؛ أما مسارات الوكيل فلا تفعل ذلك
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات OpenAI API المباشرة ترفضه وفهرس Codex الحالي لا يتيحه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- المزوّد: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS`، `ANTHROPIC_API_KEY_1`، `ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- نموذج مثال: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك حركة مرور مفتاح API والمصادقة عبر OAuth المرسلة إلى `api.anthropic.com`؛ يعيّن OpenClaw ذلك إلى `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضّل على مرجع النموذج معياريًا ويختار خلفية CLI
  بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agents.defaults.agentRuntime.id: "claude-cli"`. لا تزال مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا فريق Anthropic أن استخدام Claude CLI على نمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` باعتبارهما معتمدين لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
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
- مرجع حزمة تشغيل خادم تطبيق Codex الأصلية: `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`
- مستندات حزمة تشغيل خادم تطبيق Codex الأصلية: [حزمة Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` Plugin الخاصة بـ OpenAI؛ ولا تُختار Plugin الخاصة بخادم تطبيق Codex الأصلية إلا بواسطة وقت تشغيل حزمة Codex أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرَّر `params.serviceTier` أيضًا في طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- لا تُرفق رؤوس إسناد OpenClaw المخفية (`originator`، `version`، `User-Agent`) إلا على حركة مرور Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك إعداد `/fast` و`params.fastMode` نفسه مثل `openai/*` المباشر؛ يعيّن OpenClaw ذلك إلى `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` قيمة `contextWindow = 400000` الأصلية من فهرس Codex ووقت التشغيل الافتراضي `contextTokens = 272000`؛ تجاوز حد وقت التشغيل باستخدام `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: OpenAI Codex OAuth مدعوم صراحة للأدوات/سير العمل الخارجية مثل OpenClaw.
- بالنسبة إلى مسار الاشتراك الشائع مع وقت تشغيل Codex الأصلي، سجّل الدخول بمصادقة `openai-codex` لكن اضبط `openai/gpt-5.5` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`.
- استخدم `openai-codex/gpt-5.5` فقط عندما تريد مسار Codex OAuth/الاشتراك عبر PI؛ واستخدم `openai/gpt-5.5` دون تجاوز وقت تشغيل Codex عندما يتيح إعداد مفتاح API والفهرس المحلي لديك مسار API العام.

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

### خيارات مستضافة أخرى بنمط الاشتراك

<CardGroup cols={3}>
  <Card title="GLM models" href="/ar/providers/glm">
    خطة Z.AI Coding Plan أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    وصول MiniMax Coding Plan عبر OAuth أو مفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح مزوّد Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- مزوّد وقت تشغيل Zen: `opencode`
- مزوّد وقت تشغيل Go: `opencode-go`
- نماذج أمثلة: `opencode/claude-opus-4-6`، `opencode-go/kimi-k2.6`
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
- أمثلة النماذج: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- التوافق: تُطبَّع إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يُقبل `google/gemini-3.1-pro` ويُطبَّع إلى معرّف Gemini API الحي من Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. يحذف Gemini 3/3.1 قيمة `thinkingLevel` الثابتة؛ ويرسل Gemini 2.5 القيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير مقبض `cachedContents/...` أصلي للمزوّد؛ وتظهر إصابات ذاكرة التخزين المؤقت في Gemini على هيئة `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، `google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد ADC من gcloud؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
يُعد Gemini CLI OAuth في OpenClaw تكاملًا غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يُشحن Gemini CLI OAuth كجزء من Plugin `google` المضمّن.

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

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. لا تلصق **أي** معرّف عميل أو سر في `openclaw.json`. يخزن تدفق تسجيل الدخول في CLI الرموز في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="تعيين المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

تُحلَّل ردود JSON من Gemini CLI من `response`؛ ويتراجع الاستخدام إلى `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال النموذج: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: تُطبَّع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ وتفرض `zai-coding-global`، و`zai-coding-cn`، و`zai-global`، و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- المزوّد: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة النماذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`، `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- المزوّد: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال النموذج: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن الفهرس الاحتياطي الثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` الحي توسيع فهرس وقت التشغيل أكثر.
- تعود ملكية التوجيه المنبعي الدقيق خلف `kilocode/kilo/auto` إلى Kilo Gateway، وليس مشفّرًا ثابتًا في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) لمعرفة تفاصيل الإعداد.

### Plugins المزوّدين المضمّنة الأخرى

| المزوّد                | المعرّف                               | متغير بيئة المصادقة                                                     | مثال النموذج                                 |
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

#### تفاصيل خاصة يجدر معرفتها

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات نسبة التطبيق وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` الموثّقة. مراجع DeepSeek وMoonshot وZAI مؤهّلة لمدة TTL لذاكرة التخزين المؤقت للمطالبات التي يديرها OpenRouter، لكنها لا تتلقى علامات ذاكرة التخزين المؤقت من Anthropic. وبصفته مسارًا بأسلوب الوكيل ومتوافقًا مع OpenAI، فإنه يتجاوز التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، وResponses `store`، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتوافق الاستدلال مع OpenAI). تحتفظ المراجع المدعومة من Gemini بتنقية توقيعات التفكير الخاصة بـ proxy-Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة من Gemini مسار التنقية نفسه الخاص بـ proxy-Gemini؛ وتتجاوز `kilocode/kilo/auto` وغيرها من المراجع غير الداعمة للاستدلال عبر الوكيل حقن الاستدلال عبر الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    يكتب إعداد مفتاح API تعريفات صريحة لنموذج الدردشة M2.7 النصي فقط؛ ويبقى فهم الصور على موفّر الوسائط `MiniMax-VL-01` المملوك من Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج نطاق أسماء `nvidia/<vendor>/<model>` (مثل `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ أدوات الاختيار على تركيب `<provider>/<model-id>` الحرفي بينما يبقى المفتاح القياسي المرسل إلى API ذا بادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار xAI Responses. `grok-4.3` هو نموذج الدردشة الافتراضي المضمّن. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    يُشحن بوصفه Plugin المزوّد المضمّن `cerebras`. يستخدم GLM `zai-glm-4.7`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (عنوان URL مخصّص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزوّدين **مخصّصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

ينشر كثير من Plugins المزوّدين المضمّنة أدناه فهرسًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوص إمكانات نماذج Gateway أيضًا بيانات `models.providers.<id>.models[]` الوصفية الصريحة. إذا كان نموذج مخصّص أو نموذج وكيل يقبل الصور، فعيّن `input: ["text", "image"]` على ذلك النموذج حتى تمرّر مسارات مرفقات WebChat والصادرة من العقدة الصور بوصفها مُدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

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

### برمجة Kimi

تستخدم Kimi Coding نقطة النهاية المتوافقة مع Anthropic من Moonshot AI:

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

يظل `kimi/k2p5` القديم مقبولًا بوصفه معرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفّر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- المزوّد: `volcengine` (البرمجة: `volcengine-plan`)
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

تستخدم التهيئة الأولية سطح البرمجة افتراضيًا، لكن كتالوج `volcengine/*` العام يُسجَّل في الوقت نفسه.

في منتقيات النماذج أثناء التهيئة الأولية/الضبط، يفضّل خيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معًا. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلًا من عرض منتقٍ فارغ مقيّد بالمزوّد.

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

### BytePlus (دولي)

يوفّر BytePlus ARK الوصول إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- المزوّد: `byteplus` (البرمجة: `byteplus-plan`)
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

تستخدم التهيئة الأولية سطح البرمجة افتراضيًا، لكن كتالوج `byteplus/*` العام يُسجَّل في الوقت نفسه.

في منتقيات النماذج أثناء التهيئة الأولية/الضبط، يفضّل خيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معًا. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلًا من عرض منتقٍ فارغ مقيّد بالمزوّد.

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

يُضبط MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصّصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (عالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لتفاصيل الإعداد، وخيارات النماذج، ومقتطفات الضبط.

<Note>
على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير افتراضيًا ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم الإمكانات المملوك للـ Plugin:

- تبقى الإعدادات الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك للـ Plugin: `MiniMax-VL-01` على مساري مصادقة MiniMax كليهما
- يبقى بحث الويب على معرّف المزوّد `minimax`

### LM Studio

يأتي LM Studio بوصفه Plugin مزوّدًا مضمّنًا يستخدم API الأصلي:

- المزوّد: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw مساري LM Studio الأصليين `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضيًا. إذا أردت أن يتولى تحميل LM Studio عند الطلب، وTTL، والإخلاء التلقائي دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama بوصفه Plugin مزوّدًا مضمّنًا ويستخدم API الأصلي الخاص بـ Ollama:

- المزوّد: `ollama`
- المصادقة: غير مطلوبة (خادم محلي)
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

يُكتشف Ollama محليًا عند `http://127.0.0.1:11434` عندما تشترك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin المزوّد المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للتهيئة الأولية، ووضع السحابة/المحلي، والضبط المخصّص.

### vLLM

يأتي vLLM بوصفه Plugin مزوّدًا مضمّنًا للخوادم المحلية/المستضافة ذاتيًا المتوافقة مع OpenAI:

- المزوّد: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang بوصفه Plugin مزوّدًا مضمّنًا للخوادم السريعة المستضافة ذاتيًا والمتوافقة مع OpenAI:

- المزوّد: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

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
    بالنسبة إلى المزوّدين المخصّصين، تكون `reasoning`، و`input`، و`cost`، و`contextWindow`، و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنّب أخطاء 400 من المزوّد للأدوار `developer` غير المدعومة.
    - تتخطى المسارات المتوافقة مع OpenAI بنمط الوكيل أيضًا تشكيل الطلبات الأصلية الخاصة بـ OpenAI فقط: لا `service_tier`، ولا `store` في Responses، ولا `store` في Completions، ولا تلميحات ذاكرة تخزين مؤقت للمطالبات، ولا تشكيل حمولة توافق الاستدلال مع OpenAI، ولا ترويسات نسب مخفية من OpenClaw.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في متن الطلب الصادر.
    - بالنسبة إلى عناصر تحكم قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى تفكير الجلسة متوقفًا.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/شبكات tailnet البعيدة، اضبط `models.providers.<id>.timeoutSeconds`. يوسّع هذا معالجة طلب HTTP لنموذج المزوّد، بما يشمل الاتصال، والترويسات، وبث المتن، وإلغاء الجلب المحروس الكلي، من دون زيادة مهلة تشغيل الوكيل كلها.
    - إذا كان `baseUrl` فارغًا/محذوفًا، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يقرّر إلى `api.openai.com`).
    - حفاظًا على السلامة، ما زال `compat.supportsDeveloperRole: true` الصريح يُتجاوز على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي مزوّد غير `anthropic` القانوني، أو `models.providers.anthropic.baseUrl` مخصّص لا يكون مضيفه نقطة نهاية عامة من `api.anthropic.com`)، يكبت OpenClaw ترويسات Anthropic beta الضمنية مثل `claude-code-20250219`، و`interleaved-thinking-2025-05-14`، وعلامات OAuth، بحيث لا ترفض الوكلاء المخصّصون المتوافقون مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [الضبط](/ar/gateway/configuration) للحصول على أمثلة ضبط كاملة.

## ذات صلة

- [مرجع الضبط](/ar/gateway/config-agents#agent-defaults) — مفاتيح ضبط النماذج
- [تجاوز فشل النموذج](/ar/concepts/model-failover) — سلاسل الرجوع وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) — ضبط النماذج والأسماء المستعارة
- [المزوّدون](/ar/providers) — أدلة الإعداد الخاصة بكل مزوّد
