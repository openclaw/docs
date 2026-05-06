---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل مزوّد على حدة
    - تريد أمثلة على التكوينات أو أوامر الإعداد الأولي عبر CLI لموفري النماذج
sidebarTitle: Model providers
summary: نظرة عامة على مزوّد النماذج مع أمثلة على التكوينات + تدفقات CLI
title: مزودو النماذج
x-i18n:
    generated_at: "2026-05-06T09:02:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع لـ **موفّري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). لقواعد اختيار النماذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - يعمل `agents.defaults.models` كقائمة سماح عند ضبطه.
    - مساعدات CLI: `openclaw onboard`، و`openclaw models list`، و`openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` القيم الافتراضية على مستوى الموفّر؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، ومجسات فترة التهدئة، واستمرارية تجاوزات الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` موجود عند إضافة موفّر أو إعادة المصادقة معه. قد تظل Plugins الموفّرين تُرجع نموذجاً افتراضياً موصى به في تصحيح إعدادات المصادقة لديها، لكن configure يتعامل مع ذلك على أنه "اجعل هذا النموذج متاحاً" عندما يكون نموذج أساسي موجوداً بالفعل، وليس "استبدل النموذج الأساسي الحالي."

    لتبديل النموذج الافتراضي عمداً، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    مسارات عائلة OpenAI محددة بالبادئة:

    - يستخدم `openai/<model>` مع `agents.defaults.agentRuntime.id: "codex"` حزمة تشغيل خادم تطبيق Codex الأصلية. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - يستخدم `openai-codex/<model>` مصادقة Codex OAuth في PI.
    - يستخدم `openai/<model>` من دون تجاوز Runtime الخاص بـ Codex موفّر مفتاح OpenAI API المباشر في PI.

    راجع [OpenAI](/ar/providers/openai) و[حزمة Codex](/ar/plugins/codex-harness). إذا كان الفصل بين الموفّر وRuntime مربكاً، فاقرأ [Agent runtimes](/ar/concepts/agent-runtimes) أولاً.

    يتبع التفعيل التلقائي لـ Plugin الحد نفسه: ينتمي `openai-codex/<model>` إلى OpenAI plugin، بينما تُفعّل Codex plugin عبر `agentRuntime.id: "codex"` أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر حزمة تشغيل خادم تطبيق Codex الأصلية عند ضبط `agentRuntime.id: "codex"`، وعبر `openai-codex/gpt-5.5` في PI لمصادقة Codex OAuth، وعبر `openai/gpt-5.5` في PI لحركة مفتاح API المباشرة عندما يتيحه حسابك.

  </Accordion>
  <Accordion title="CLI runtimes">
    تستخدم Runtime الخاصة بـ CLI الفصل نفسه: اختر مراجع نموذج معيارية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط `agents.defaults.agentRuntime.id` على `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد خلفية CLI محلية.

    تُرحَّل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة مرة أخرى إلى مراجع الموفّر المعيارية مع تسجيل Runtime بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك الموفّر المملوك لـ Plugin

توجد معظم المنطق الخاص بالموفّرين في Plugins الموفّرين (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تمتلك Plugins الإعداد الأولي، وكتالوجات النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات التفكير/الاستدلال، والمزيد.

توجد القائمة الكاملة لخطافات provider-SDK وأمثلة Plugins المضمّنة في [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins). الموفّر الذي يحتاج منفّذ طلبات مخصصاً بالكامل هو سطح امتداد منفصل وأعمق.

<Note>
يوجد سلوك المشغّل المملوك للموفّر على خطافات موفّر صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف البث، ومساعدات النقل/الطلب. حقيبة `ProviderPlugin.capabilities` الثابتة القديمة مخصصة للتوافق فقط ولم يعد منطق المشغّل المشترك يقرأها.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="Key sources and priority">
    اضبط عدة مفاتيح عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، بأعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو بفواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة لموفّري Google، يُضمَّن `GOOGLE_API_KEY` أيضاً كاحتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - تُعاد محاولة الطلبات بالمفتاح التالي فقط عند استجابات تحديد المعدل (على سبيل المثال `429`، أو `rate_limit`، أو `quota`، أو `resource exhausted`، أو `Too many concurrent requests`، أو `ThrottlingException`، أو `concurrency limit reached`، أو `workers_ai ... quota limit exceeded`، أو رسائل حد الاستخدام الدورية).
    - تفشل الإخفاقات غير المرتبطة بتحديد المعدل فوراً؛ ولا تُحاول أي عملية تدوير مفاتيح.
    - عندما تفشل كل المفاتيح المرشحة، يُرجع الخطأ النهائي من آخر محاولة.

  </Accordion>
</AccordionGroup>

## الموفّرون المضمّنون (كتالوج pi-ai)

يشحن OpenClaw مع كتالوج pi-ai. لا يتطلب هؤلاء الموفّرون **أي** إعداد `models.providers`؛ اضبط المصادقة فقط واختر نموذجاً.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS`، و`OPENAI_API_KEY_1`، و`OPENAI_API_KEY_2`، إضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- نماذج أمثلة: `openai/gpt-5.5`، و`openai/gpt-5.4-mini`
- تحقّق من إتاحة الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا تصرّف تثبيت محدد أو مفتاح API بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولاً، مع الرجوع إلى SSE)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يكون الإحماء لـ OpenAI Responses WebSocket مفعّلاً افتراضياً عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحاً بدلاً من مفتاح تبديل `/fast` المشترك
- لا تنطبق ترويسات نسب OpenClaw المخفية (`originator`، و`version`، و`User-Agent`) إلا على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامة المتوافقة مع OpenAI
- تحافظ مسارات OpenAI الأصلية أيضاً على `store` في Responses، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتشكيل الحمولة المتوافق مع استدلال OpenAI؛ ولا تفعل مسارات الوكيل ذلك
- يُخفى `openai/gpt-5.3-codex-spark` عمداً في OpenClaw لأن طلبات OpenAI API المباشرة ترفضه ولا يعرضه كتالوج Codex الحالي

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS`، و`ANTHROPIC_API_KEY_1`، و`ANTHROPIC_API_KEY_2`، إضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- نموذج مثال: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح تبديل `/fast` المشترك و`params.fastMode`، بما في ذلك حركة مفتاح API وحركة OAuth المصادَق عليها المرسلة إلى `api.anthropic.com`؛ ويربط OpenClaw ذلك إلى `service_tier` الخاص بـ Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضّل على مرجع النموذج معيارياً ويختار خلفية CLI
  بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agents.defaults.agentRuntime.id: "claude-cli"`. لا تزال مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أبلغنا موظفو Anthropic بأن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل رمز إعداد Anthropic متاحاً كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- الموفّر: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مرجع نموذج PI: `openai-codex/gpt-5.5`
- مرجع حزمة تشغيل خادم تطبيق Codex الأصلية: `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`
- مستندات حزمة تشغيل خادم تطبيق Codex الأصلية: [حزمة Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` OpenAI plugin؛ ولا تُختار Plugin خادم تطبيق Codex الأصلية إلا عبر Runtime حزمة Codex أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولاً، مع الرجوع إلى SSE)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرَّر `params.serviceTier` أيضاً في طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- لا تُرفق ترويسات نسب OpenClaw المخفية (`originator`، و`version`، و`User-Agent`) إلا على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامة المتوافقة مع OpenAI
- يشارك إعداد `/fast` و`params.fastMode` نفسه مثل `openai/*` المباشر؛ ويربط OpenClaw ذلك إلى `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` `contextWindow = 400000` الأصلي من كتالوج Codex وRuntime الافتراضي `contextTokens = 272000`؛ وتجاوز حد Runtime عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: يُدعم OpenAI Codex OAuth صراحة للأدوات/سير العمل الخارجية مثل OpenClaw.
- للمسار الشائع الذي يجمع الاشتراك مع Runtime Codex الأصلي، سجّل الدخول بمصادقة `openai-codex` لكن اضبط `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`.
- استخدم `openai-codex/gpt-5.5` فقط عندما تريد مسار Codex OAuth/الاشتراك عبر PI؛ واستخدم `openai/gpt-5.5` من دون تجاوز Runtime الخاص بـ Codex عندما يتيح إعداد مفتاح API لديك والكتالوج المحلي مسار API العام.
- تُخفى مراجع `openai-codex/gpt-5.1*` و`openai-codex/gpt-5.2*` و`openai-codex/gpt-5.3*` الأقدم لأن حسابات ChatGPT/Codex OAuth ترفضها؛ استخدم `openai-codex/gpt-5.5` أو مسار Runtime الخاص بـ Codex الأصلي بدلاً من ذلك.

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
  <Card title="GLM models" href="/ar/providers/glm">
    خطة Z.AI Coding Plan أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    وصول MiniMax Coding Plan عبر OAuth أو مفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح موفّر Qwen Cloud إضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر Zen runtime: `opencode`
- موفّر Go runtime: `opencode-go`
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
- التدوير الاختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، والرجوع الاحتياطي إلى `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز مفرد)
- نماذج أمثلة: `google/gemini-3.1-pro-preview`، `google/gemini-3-flash-preview`
- التوافق: تتم تسوية إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يُقبَل `google/gemini-3.1-pro` وتتم تسويته إلى معرّف Gemini API المباشر من Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. يحذف Gemini 3/3.1 قيمة `thinkingLevel` ثابتة؛ ويرسل Gemini 2.5 القيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو الصيغة القديمة `cached_content`) لتمرير مقبض أصلي للمزوّد بصيغة `cachedContents/...`؛ وتظهر إصابات ذاكرة التخزين المؤقت في Gemini داخل OpenClaw باسم `cacheRead`

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، `google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد ADC من gcloud؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
يُعد OAuth الخاص بـGemini CLI في OpenClaw تكاملاً غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يُشحَن OAuth الخاص بـGemini CLI كجزء من Plugin `google` المضمّن.

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

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. لا تلصق **معرّف عميل** أو **سرًا** داخل `openclaw.json`. يخزّن تدفق تسجيل الدخول في CLI الرموز المميزة في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="تعيين المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

تُحلّل ردود JSON من Gemini CLI من `response`؛ ويعود الاستخدام احتياطيًا إلى `stats`، مع تسوية `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- نموذج مثال: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: تتم تسوية `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ بينما تفرض `zai-coding-global`، و`zai-coding-cn`، و`zai-global`، و`zai-cn` سطحًا محددًا

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
- يشحن الكتالوج الاحتياطي الثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` المباشر توسيع كتالوج وقت التشغيل أكثر.
- التوجيه الدقيق في المنبع خلف `kilocode/kilo/auto` تملكه Kilo Gateway، وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### Plugins المزوّدين المضمّنة الأخرى

| المزوّد                 | المعرّف                          | متغير بيئة المصادقة                                          | نموذج مثال                                    |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
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
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### سلوكيات خاصة يجدر معرفتها

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات إسناد التطبيق الخاصة به وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` الموثّقة. مراجع DeepSeek وMoonshot وZAI مؤهلة لمدة بقاء ذاكرة التخزين المؤقت للتخزين المؤقت للمطالبات الذي يديره OpenRouter، لكنها لا تتلقى علامات تخزين Anthropic المؤقت. وبصفته مسار وكيل متوافقا مع OpenAI، فإنه يتخطى التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، وResponses `store`، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتوافق استدلال OpenAI). تحتفظ المراجع المستندة إلى Gemini بتنظيف توقيع التفكير الخاص بوكيل Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المستندة إلى Gemini مسار تنظيف وكيل Gemini نفسه؛ ويتخطى `kilocode/kilo/auto` وغيره من المراجع غير الداعمة للاستدلال عبر الوكيل حقن الاستدلال عبر الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    يكتب إعداد مفتاح API تعريفات صريحة لنماذج محادثة M2.7 النصية فقط؛ ويظل فهم الصور على موفر الوسائط `MiniMax-VL-01` المملوك للـ plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (على سبيل المثال `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ أدوات الاختيار على تركيبة `<provider>/<model-id>` الحرفية بينما يبقى المفتاح القانوني المرسل إلى API ذا بادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار xAI Responses. `grok-4.3` هو نموذج المحادثة الافتراضي المضمّن. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلا افتراضيا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    يأتي كـ plugin موفر `cerebras` مضمّن. يستخدم GLM `zai-glm-4.7`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## الموفرون عبر `models.providers` (عنوان URL مخصص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة موفرين **مخصصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

ينشر كثير من plugins الموفرين المضمّنة أدناه فهرسا افتراضيا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوصات قدرات نموذج Gateway أيضا بيانات `models.providers.<id>.models[]` الوصفية الصريحة. إذا كان نموذج مخصص أو وكيل يقبل الصور، فاضبط `input: ["text", "image"]` على ذلك النموذج حتى تمرّر WebChat ومسارات المرفقات القادمة من Node الصور كمدخلات نموذج أصلية بدلا من مراجع وسائط نصية فقط.

### Moonshot AI (Kimi)

يأتي Moonshot كـ plugin موفر مضمّن. استخدم الموفر المدمج افتراضيا، وأضف إدخال `models.providers.moonshot` صريحا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات النموذج الوصفية:

- الموفر: `moonshot`
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

يستخدم Kimi Coding نقطة نهاية Moonshot AI المتوافقة مع Anthropic:

- الموفر: `kimi`
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

يبقى `kimi/k2p5` القديم مقبولاً كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

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

تستخدم عملية التهيئة سطح البرمجة افتراضياً، لكن كتالوج `volcengine/*` العام يُسجّل في الوقت نفسه.

في منتقيات النماذج ضمن التهيئة/الإعداد، يفضّل خيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معاً. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المرشّح بدلاً من عرض منتقٍ فارغ مقيّد بالمزوّد.

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

يوفر BytePlus ARK الوصول إلى النماذج نفسها التي يوفرها Volcano Engine للمستخدمين الدوليين.

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

تستخدم عملية التهيئة سطح البرمجة افتراضياً، لكن كتالوج `byteplus/*` العام يُسجّل في الوقت نفسه.

في منتقيات النماذج ضمن التهيئة/الإعداد، يفضّل خيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معاً. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المرشّح بدلاً من عرض منتقٍ فارغ مقيّد بالمزوّد.

<Tabs>
  <Tab title="النماذج القياسية">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="نماذج البرمجة (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

يوفر Synthetic نماذج متوافقة مع Anthropic خلف مزوّد `synthetic`:

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

يُهيّأ MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (عالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لتفاصيل الإعداد، وخيارات النماذج، ومقتطفات الإعدادات.

<Note>
في مسار البث المتوافق مع Anthropic الخاص بـ MiniMax، يعطّل OpenClaw التفكير افتراضياً ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم الإمكانات المملوكة للـ Plugin:

- تبقى إعدادات النص/الدردشة الافتراضية على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك للـ Plugin وهو `MiniMax-VL-01` على كلا مساري مصادقة MiniMax
- يبقى بحث الويب على معرّف المزوّد `minimax`

### LM Studio

يأتي LM Studio كـ Plugin مزوّد مضمّن يستخدم API الأصلي:

- المزوّد: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط نموذجاً (استبدله بأحد المعرّفات التي يرجعها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw نقاط LM Studio الأصلية `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضياً. إذا أردت أن يتولى تحميل JIT في LM Studio، وTTL، والإخلاء التلقائي دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama كـ Plugin مزوّد مضمّن ويستخدم API الأصلي الخاص بـ Ollama:

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

يُكتشف Ollama محلياً عند `http://127.0.0.1:11434` عندما تختار الاشتراك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin المزوّد المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للتهيئة، ووضع السحابة/المحلي، والإعدادات المخصصة.

### vLLM

يأتي vLLM كـ Plugin مزوّد مضمّن للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

- المزوّد: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محلياً (تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجاً (استبدله بأحد المعرّفات التي يرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang كـ Plugin مزوّد مضمّن للخوادم ذاتية الاستضافة السريعة المتوافقة مع OpenAI:

- المزوّد: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محلياً (تعمل أي قيمة إذا كان خادمك لا يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجاً (استبدله بأحد المعرّفات التي يرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio، وvLLM، وLiteLLM، إلخ)

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
    بالنسبة إلى المزوّدين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيماً صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="قواعد تشكيل مسارات الوكيل">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من المزوّد للأدوار `developer` غير المدعومة.
    - تتجاوز المسارات المتوافقة مع OpenAI بأسلوب الوكيل أيضاً تشكيل الطلبات الأصلية الخاصة بـ OpenAI فقط: لا `service_tier`، ولا `store` في Responses، ولا `store` في Completions، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة توافق التفكير في OpenAI، ولا ترويسات إسناد مخفية لـ OpenClaw.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في جسم الطلب الصادر.
    - بالنسبة إلى عناصر التحكم في قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائياً `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى التفكير في الجلسة متوقفاً.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/الشبكة الخلفية البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يمدد هذا معالجة طلبات HTTP الخاصة بنموذج المزوّد، بما في ذلك الاتصال، والترويسات، وبث الجسم، وإيقاف الجلب المحروس الإجمالي، من دون زيادة مهلة تشغيل الوكيل بالكامل.
    - تسمح نداءات HTTP لمزوّد النموذج بإجابات DNS ذات IP زائف من Surge وClash وsing-box في `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف `baseUrl` الخاص بالمزوّد المضبوط. لا تزال الوجهات الخاصة الأخرى، وloopback، وlink-local، والبيانات الوصفية تتطلب اشتراكاً صريحاً عبر `models.providers.<id>.request.allowPrivateNetwork: true`.
    - إذا كان `baseUrl` فارغاً/محذوفاً، يحافظ OpenClaw على سلوك OpenAI الافتراضي (الذي يحل إلى `api.openai.com`).
    - لدواعي السلامة، لا تزال القيمة الصريحة `compat.supportsDeveloperRole: true` تُستبدل على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي مزوّد غير `anthropic` القياسي، أو `models.providers.anthropic.baseUrl` مخصص لا يكون مضيفه نقطة نهاية عامة لـ `api.anthropic.com`)، يخفي OpenClaw ترويسات Anthropic التجريبية الضمنية مثل `claude-code-20250219` و`interleaved-thinking-2025-05-14` وعلامات OAuth، بحيث لا ترفض الوكلاء المخصصة المتوافقة مع Anthropic علامات beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضاً: [الإعدادات](/ar/gateway/configuration) لأمثلة الإعدادات الكاملة.

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) - مفاتيح إعدادات النموذج
- [تجاوز فشل النموذج](/ar/concepts/model-failover) - سلاسل الرجوع وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) - إعداد النماذج والأسماء البديلة
- [المزوّدون](/ar/providers) - أدلة الإعداد لكل مزوّد
