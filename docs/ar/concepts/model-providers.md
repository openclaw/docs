---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل موفّر على حدة
    - تريد تكوينات نموذجية أو أوامر إعداد أولي عبر CLI لموفّري النماذج
sidebarTitle: Model providers
summary: نظرة عامة على موفّر النماذج مع أمثلة على التكوينات وتدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-05-11T20:29:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع **لمزوّدي النماذج/نماذج اللغة الكبيرة** (وليس قنوات المحادثة مثل WhatsApp/Telegram). لقواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع النماذج ومساعدات CLI">
    - تستخدم مراجع النماذج `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - يعمل `agents.defaults.models` كقائمة سماح عند ضبطه.
    - مساعدات CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` القيم الافتراضية على مستوى المزوّد؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، وفحوصات فترة التهدئة، واستمرار تجاوزات الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="إضافة مصادقة مزوّد لا تغيّر نموذجك الأساسي">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` موجود عند إضافة مزوّد أو إعادة مصادقته. ويفعل `openclaw models auth login` الشيء نفسه ما لم تمرّر `--set-default`. قد تظل Pluginات المزوّدين تعيد نموذجًا افتراضيًا موصى به في تصحيح إعدادات المصادقة الخاص بها، لكن OpenClaw يتعامل مع ذلك على أنه "اجعل هذا النموذج متاحًا" عندما يكون نموذج أساسي موجودًا بالفعل، وليس "استبدل النموذج الأساسي الحالي."

    لتبديل النموذج الافتراضي عمدًا، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="فصل مزوّد/تشغيل OpenAI">
    مسارات عائلة OpenAI محددة بالبادئة:

    - يستخدم `openai/<model>` حزمة تشغيل خادم تطبيق Codex الأصلية لدورات الوكيل افتراضيًا. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - `openai-codex/<model>` إعداد قديم يعيد doctor كتابته إلى `openai/<model>`.
    - يستخدم `openai/<model>` مع `agentRuntime.id: "pi"` على مستوى المزوّد/النموذج PI لمسارات مفتاح API الصريحة أو مسارات التوافق.

    راجع [OpenAI](/ar/providers/openai) و[حزمة تشغيل Codex](/ar/plugins/codex-harness). إذا كان فصل المزوّد/التشغيل مربكًا، فاقرأ [تشغيلات الوكلاء](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي للـ Plugin الحد نفسه: مراجع الوكيل `openai/*` تفعّل Plugin الخاصة بـ Codex للمسار الافتراضي، كما تتطلبها أيضًا `agentRuntime.id: "codex"` الصريحة على مستوى المزوّد/النموذج أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر حزمة تشغيل خادم تطبيق Codex الأصلية افتراضيًا على `openai/gpt-5.5`، وعبر PI فقط عندما تختار سياسة تشغيل المزوّد/النموذج `pi` صراحة.

  </Accordion>
  <Accordion title="تشغيلات CLI">
    تستخدم تشغيلات CLI الفصل نفسه: اختر مراجع نماذج معيارية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط سياسة تشغيل المزوّد/النموذج إلى `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد خلفية CLI محلية.

    تنتقل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة مرة أخرى إلى مراجع مزوّد معيارية مع تسجيل التشغيل بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك المزوّد المملوك للـ Plugin

تعيش معظم المنطقيات الخاصة بالمزوّدين في Pluginات المزوّدين (`registerProvider(...)`) بينما يحتفظ OpenClaw بحلقة الاستدلال العامة. تمتلك Pluginات الإعداد الأولي، وفهارس النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات SDK الخاصة بالمزوّد وأمثلة Pluginات المضمّنة في [Pluginات المزوّدين](/ar/plugins/sdk-provider-plugins). المزوّد الذي يحتاج منفّذ طلبات مخصصًا بالكامل هو سطح توسعة منفصل وأعمق.

<Note>
يعيش سلوك المشغّل المملوك للمزوّد على خطافات مزوّد صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف التدفق، ومساعدات النقل/الطلب. حقيبة `ProviderPlugin.capabilities` الثابتة القديمة مخصصة للتوافق فقط ولم تعد تُقرأ بواسطة منطق المشغّل المشترك.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="مصادر المفاتيح والأولوية">
    اضبط مفاتيح متعددة عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقّمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى مزوّدي Google، يُضمّن `GOOGLE_API_KEY` أيضًا كخيار رجوع احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل تكرار القيم.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - يعاد تنفيذ الطلبات بالمفتاح التالي فقط عند استجابات حد المعدّل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
    - تفشل حالات الإخفاق غير المرتبطة بحد المعدّل فورًا؛ ولا تُجرى محاولة تدوير مفاتيح.
    - عندما تفشل كل المفاتيح المرشحة، يُعاد الخطأ النهائي من المحاولة الأخيرة.

  </Accordion>
</AccordionGroup>

## المزوّدون المضمّنون (فهرس pi-ai)

يشحن OpenClaw مع فهرس pi-ai. لا يتطلب هؤلاء المزوّدون **أي** إعداد `models.providers`؛ اضبط المصادقة فقط واختر نموذجًا.

### OpenAI

- المزوّد: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة نماذج: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- تحقق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت محدد أو مفتاح API يتصرف بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto`؛ يمرر OpenClaw اختيار النقل إلى pi-ai.
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` بـ `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدل مفتاح التبديل المشترك `/fast`
- تنطبق رؤوس نسبة OpenClaw المخفية (`originator` و`version` و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بقيم Responses `store`، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتشكيل حمولة التوافق مع الاستدلال في OpenAI؛ أما مسارات الوكيل فلا تفعل ذلك
- يُخفى `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات API الحية من OpenAI ترفضه ولا يعرضه فهرس Codex الحالي

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- المزوّد: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS`، `ANTHROPIC_API_KEY_1`، `ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال نموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك حركة المصادقة بمفتاح API وOAuth المرسلة إلى `api.anthropic.com`؛ ويربط OpenClaw ذلك بـ `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضل على مرجع النموذج معياريًا ويحدد خلفية CLI
  بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agentRuntime.id: "claude-cli"` على نطاق النموذج. لا تزال مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مصرّحان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- المزوّد: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مرجع نموذج PI القديم: `openai-codex/gpt-5.5`
- مرجع حزمة تشغيل خادم تطبيق Codex الأصلية: `openai/gpt-5.5`
- مستندات حزمة تشغيل خادم تطبيق Codex الأصلية: [حزمة تشغيل Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` Plugin الخاصة بـ OpenAI؛ ولا تُختار Plugin خادم تطبيق Codex الأصلية إلا بواسطة تشغيل حزمة Codex أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE كرجوع احتياطي)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرّر `params.serviceTier` أيضًا على طلبات Responses الأصلية من Codex (`chatgpt.com/backend-api`)
- لا تُرفق رؤوس نسبة OpenClaw المخفية (`originator` و`version` و`User-Agent`) إلا على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك مفتاح التبديل `/fast` وإعداد `params.fastMode` نفسيهما مثل `openai/*` المباشر؛ ويربط OpenClaw ذلك بـ `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` قيمة `contextWindow = 400000` الأصلية من فهرس Codex وتشغيلًا افتراضيًا `contextTokens = 272000`؛ تجاوز حد التشغيل باستخدام `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: OpenAI Codex OAuth مدعوم صراحة للأدوات/سير العمل الخارجية مثل OpenClaw.
- للمسار الشائع الذي يجمع الاشتراك مع تشغيل Codex الأصلي، سجّل الدخول بمصادقة `openai-codex` لكن اضبط `openai/gpt-5.5`؛ تختار دورات وكيل OpenAI Codex افتراضيًا.
- استخدم `agentRuntime.id: "pi"` على مستوى المزوّد/النموذج فقط عندما تريد مسار توافق عبر PI؛ وإلا فأبقِ `openai/gpt-5.5` على حزمة Codex الافتراضية.
- تُخفى مراجع `openai-codex/gpt-5.1*` و`openai-codex/gpt-5.2*` و`openai-codex/gpt-5.3*` الأقدم لأن حسابات ChatGPT/Codex OAuth ترفضها؛ استخدم `openai-codex/gpt-5.5` أو مسار تشغيل Codex الأصلي بدلًا من ذلك.

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
    وصول MiniMax Coding Plan OAuth أو مفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح مزوّد Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- مزوّد تشغيل Zen: `opencode`
- مزوّد تشغيل Go: `opencode-go`
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
- التدوير الاختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، وبديل `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- نماذج أمثلة: `google/gemini-3.1-pro-preview`، و`google/gemini-3-flash-preview`
- التوافق: يتم تطبيع إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يتم قبول `google/gemini-3.1-pro` وتطبيعه إلى معرّف Gemini API المباشر من Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. لا يضمّن Gemini 3/3.1 قيمة `thinkingLevel` ثابتة؛ ويرسل Gemini 2.5 القيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير مقبض `cachedContents/...` أصلي للمزوّد؛ وتظهر إصابات ذاكرة التخزين المؤقت في Gemini ضمن OpenClaw باسم `cacheRead`

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، و`google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
يُعد OAuth الخاص بـGemini CLI في OpenClaw تكاملاً غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير بالغ الأهمية إذا اخترت المتابعة.
</Warning>

يتم شحن OAuth الخاص بـGemini CLI كجزء من Plugin ‏`google` المضمّن.

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

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. لا تلصق **مطلقًا** معرّف عميل أو سرًا في `openclaw.json`. يخزّن تدفق تسجيل الدخول في CLI الرموز المميزة في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="تعيين المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

يتم تحليل ردود JSON من Gemini CLI من `response`؛ ويعود استخدام الرموز إلى `stats`، مع تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- نموذج مثال: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ بينما تفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- المزوّد: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- نماذج أمثلة: `vercel-ai-gateway/anthropic/claude-opus-4.6`، و`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- المزوّد: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- نموذج مثال: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن كتالوج الاحتياطي الثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` المباشر توسيع كتالوج وقت التشغيل أكثر.
- التوجيه الدقيق في المنبع خلف `kilocode/kilo/auto` مملوك لـKilo Gateway، وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### Plugins المزوّدين المضمّنة الأخرى

| المزوّد                | المعرّف                               | متغير بيئة المصادقة                                                     | نموذج مثال                                 |
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
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` أو `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
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

#### خصوصيات يجدر معرفتها

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات إسناد التطبيق وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` المتحقق منها. مراجع DeepSeek وMoonshot وZAI مؤهلة لمدة بقاء التخزين المؤقت عند استخدام التخزين المؤقت للمطالبات الذي يديره OpenRouter، لكنها لا تتلقى علامات التخزين المؤقت الخاصة بـ Anthropic. وبصفته مسارًا متوافقًا مع OpenAI بنمط الوكيل، فإنه يتجاوز التشكيل الخاص فقط بـ OpenAI الأصلي (`serviceTier`، وResponses `store`، وتلميحات التخزين المؤقت للمطالبات، وتوافق الاستدلال مع OpenAI). تحتفظ المراجع المدعومة من Gemini بتنظيف توقيع التفكير الخاص بـ proxy-Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة من Gemini مسار التنظيف نفسه الخاص بـ proxy-Gemini؛ ويتجاوز `kilocode/kilo/auto` والمراجع الأخرى غير الداعمة للاستدلال عبر الوكيل حقن الاستدلال عبر الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    تكتب تهيئة مفتاح API تعريفات صريحة لنموذج محادثة M2.7 النصي فقط؛ ويبقى فهم الصور على مزوّد وسائط `MiniMax-VL-01` المملوك للـ plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (مثلًا `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ أدوات الاختيار على التركيب الحرفي `<provider>/<model-id>` بينما يبقى المفتاح المعياري المرسل إلى API ذا بادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار xAI Responses. `grok-4.3` هو نموذج المحادثة الافتراضي المضمّن. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    يُشحَن بصفته plugin المزوّد المضمّن `cerebras`. يستخدم GLM `zai-glm-4.7`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (عنوان URL مخصّص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزوّدين **مخصّصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

ينشر كثير من plugins المزوّدين المضمّنة أدناه كتالوجًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوصات قدرات نماذج Gateway أيضًا بيانات `models.providers.<id>.models[]` الوصفية الصريحة. إذا كان نموذج مخصّص أو وكيل يقبل الصور، فاضبط `input: ["text", "image"]` على ذلك النموذج حتى تمرر مسارات WebChat والمرفقات الصادرة من العقد الصور كمدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

يتحكم `agents.defaults.models["provider/model"]` فقط في ظهور النموذج والأسماء المستعارة والبيانات الوصفية لكل نموذج للوكلاء. ولا يسجّل نموذج تشغيل جديدًا بمفرده. بالنسبة إلى نماذج المزوّدين المخصّصة، أضف أيضًا `models.providers.<provider>.models[]` مع `id` المطابق على الأقل.

### Moonshot AI (Kimi)

يُشحَن Moonshot بصفته plugin مزوّدًا مضمّنًا. استخدم المزوّد المدمج افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات النموذج الوصفية:

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

يستخدم Kimi Coding نقطة النهاية المتوافقة مع Anthropic الخاصة بـ Moonshot AI:

- المزوّد: `kimi`
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

تبقى `kimi/kimi-code` و`kimi/k2p5` القديمة مقبولة كمعرّفات نماذج للتوافق، وتُطبع إلى معرّف نموذج API المستقر لدى Kimi.

### Volcano Engine (Doubao)

يوفّر Volcano Engine (火山引擎) وصولاً إلى Doubao ونماذج أخرى في الصين.

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

يفترض الإعداد الأولي سطح البرمجة افتراضياً، لكن كتالوج `volcengine/*` العام يُسجّل في الوقت نفسه.

في منتقيات النماذج الخاصة بالإعداد الأولي/التكوين، يفضّل اختيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معاً. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلاً من عرض منتقٍ فارغ مقيّد بالمزوّد.

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

يوفّر BytePlus ARK وصولاً إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

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

يفترض الإعداد الأولي سطح البرمجة افتراضياً، لكن كتالوج `byteplus/*` العام يُسجّل في الوقت نفسه.

في منتقيات النماذج الخاصة بالإعداد الأولي/التكوين، يفضّل اختيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معاً. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المفلتر بدلاً من عرض منتقٍ فارغ مقيّد بالمزوّد.

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

يُكوَّن MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (عالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للاطلاع على تفاصيل الإعداد، وخيارات النماذج، ومقتطفات التكوين.

<Note>
على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير افتراضياً ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم القدرات المملوك من Plugin:

- تبقى افتراضيات النص/الدردشة على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك من Plugin باسم `MiniMax-VL-01` على مساري مصادقة MiniMax كليهما
- يبقى بحث الويب على معرّف المزوّد `minimax`

### LM Studio

يأتي LM Studio كـ Plugin مزوّد مضمّن يستخدم API الأصلي:

- المزوّد: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم عيّن نموذجاً (استبدله بأحد المعرّفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw نقاط LM Studio الأصلية `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضياً. إذا أردت أن يتولى تحميل LM Studio JIT وTTL والإخلاء التلقائي دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama كـ Plugin مزوّد مضمّن ويستخدم API الأصلي لـ Ollama:

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

يُكتشف Ollama محلياً على `http://127.0.0.1:11434` عند الاشتراك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin المزوّد المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للإعداد الأولي، ووضع السحابة/المحلي، والتكوين المخصص.

### vLLM

يأتي vLLM كـ Plugin مزوّد مضمّن للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

- المزوّد: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محلياً (تصلح أي قيمة إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم عيّن نموذجاً (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang كـ Plugin مزوّد مضمّن للخوادم السريعة ذاتية الاستضافة المتوافقة مع OpenAI:

- المزوّد: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محلياً (تصلح أي قيمة إذا كان خادمك لا يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم عيّن نموذجاً (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio، vLLM، LiteLLM، وغيرها)

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
    بالنسبة إلى المزوّدين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw افتراضياً:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيماً صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="قواعد تشكيل مسار الوكيل">
    - بالنسبة إلى `api: "openai-completions"` على نقاط نهاية غير أصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من المزوّد بسبب أدوار `developer` غير المدعومة.
    - تتخطى المسارات المتوافقة مع OpenAI بنمط الوكيل أيضاً تشكيل الطلبات الأصلية الخاصة بـ OpenAI فقط: لا `service_tier`، ولا Responses `store`، ولا Completions `store`، ولا تلميحات لذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة توافق التفكير في OpenAI، ولا رؤوس نسب مخفية خاصة بـ OpenClaw.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في جسم الطلب الصادر.
    - بالنسبة إلى عناصر تحكم قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائياً `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى التفكير في الجلسة متوقفاً.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/tailnet البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يمدد ذلك معالجة طلبات HTTP لنموذج المزوّد، بما في ذلك الاتصال والرؤوس وبث الجسم وإلغاء الجلب المحروس الإجمالي، دون زيادة مهلة تشغيل الوكيل بالكامل.
    - تسمح استدعاءات HTTP لمزوّد النموذج بإجابات DNS من Surge وClash وsing-box fake-IP ضمن `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف `baseUrl` المكوّن للمزوّد. لا تزال الوجهات الخاصة الأخرى وloopback وlink-local وmetadata تتطلب اشتراكاً صريحاً عبر `models.providers.<id>.request.allowPrivateNetwork: true`.
    - إذا كان `baseUrl` فارغاً/محذوفاً، يحافظ OpenClaw على سلوك OpenAI الافتراضي (الذي يتحلل إلى `api.openai.com`).
    - للسلامة، لا تزال القيمة الصريحة `compat.supportsDeveloperRole: true` تُتجاوز على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي مزوّد غير `anthropic` القانوني، أو `models.providers.anthropic.baseUrl` مخصص لا يكون مضيفه نقطة نهاية عامة لـ `api.anthropic.com`)، يكبت OpenClaw رؤوس Anthropic beta الضمنية مثل `claude-code-20250219` و`interleaved-thinking-2025-05-14` وعلامات OAuth، حتى لا ترفض الوكلاء المخصصة المتوافقة مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضاً: [التكوين](/ar/gateway/configuration) للاطلاع على أمثلة التكوين الكاملة.

## ذو صلة

- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) - مفاتيح تكوين النموذج
- [تجاوز فشل النموذج](/ar/concepts/model-failover) - سلاسل الاحتياط وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) - تكوين النماذج والأسماء المستعارة
- [المزوّدون](/ar/providers) - أدلة الإعداد لكل مزوّد
