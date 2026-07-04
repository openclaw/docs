---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج حسب كل موفّر
    - تريد أمثلة على إعدادات التكوين أو أوامر الإعداد عبر CLI لمزوّدي النماذج
sidebarTitle: Model providers
summary: نظرة عامة على مزوّد النماذج مع أمثلة تكوينات وتدفقات CLI
title: موفّرو النماذج
x-i18n:
    generated_at: "2026-07-04T03:49:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع **لمزوّدي LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). لقواعد اختيار النماذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع النماذج ومساعدات CLI">
    - تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - يعمل `agents.defaults.models` كقائمة سماح عند ضبطه.
    - مساعدات CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` الافتراضيات على مستوى المزوّد؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، ومجسّات التهدئة، واستمرارية تجاوزات الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="إضافة مصادقة مزوّد لا تغيّر نموذجك الأساسي">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` موجود عند إضافة مزوّد أو إعادة مصادقته. ويفعل `openclaw models auth login` الشيء نفسه ما لم تمرّر `--set-default`. قد تظل Plugins المزوّدين تُرجع نموذجًا افتراضيًا موصى به في رقعة إعدادات المصادقة، لكن OpenClaw يتعامل مع ذلك على أنه "إتاحة هذا النموذج" عندما يكون هناك نموذج أساسي موجود بالفعل، وليس "استبدال النموذج الأساسي الحالي."

    للتبديل عمدًا إلى النموذج الافتراضي، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="فصل مزوّد OpenAI عن وقت التشغيل">
    مسارات عائلة OpenAI خاصة بالبادئة:

    - يستخدم `openai/<model>` حزمة تشغيل خادم تطبيق Codex الأصلية لدورات الوكيل افتراضيًا. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - مراجع نماذج Codex القديمة هي إعدادات قديمة يعيد doctor كتابتها إلى `openai/<model>`.
    - يستخدم `openai/<model>` مع `agentRuntime.id: "openclaw"` على مستوى المزوّد/النموذج وقت تشغيل OpenClaw المدمج لمسارات مفاتيح API الصريحة أو مسارات التوافق.

    راجع [OpenAI](/ar/providers/openai) و[حزمة Codex](/ar/plugins/codex-harness). إذا كان فصل المزوّد/وقت التشغيل مربكًا، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي للـ Plugin الحد نفسه: مراجع وكلاء `openai/*` تفعّل Plugin الخاص بـ Codex للمسار الافتراضي، كما تتطلبه أيضًا `agentRuntime.id: "codex"` الصريحة على مستوى المزوّد/النموذج أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر حزمة تشغيل خادم تطبيق Codex الأصلية افتراضيًا على `openai/gpt-5.5`، وعبر وقت تشغيل OpenClaw عندما تختار سياسة وقت التشغيل على مستوى المزوّد/النموذج `openclaw` صراحةً.

  </Accordion>
  <Accordion title="أوقات تشغيل CLI">
    تستخدم أوقات تشغيل CLI الفصل نفسه: اختر مراجع نماذج معيارية مثل `anthropic/claude-*` أو `google/gemini-*`، ثم اضبط سياسة وقت التشغيل على مستوى المزوّد/النموذج إلى `claude-cli` أو `google-gemini-cli` عندما تريد خلفية CLI محلية.

    تُرحَّل مراجع `claude-cli/*` و`google-gemini-cli/*` القديمة مرة أخرى إلى مراجع المزوّدين المعيارية مع تسجيل وقت التشغيل بصورة منفصلة. تُرحَّل مراجع `codex-cli/*` القديمة إلى `openai/*` وتستخدم مسار خادم تطبيق Codex؛ لم يعد OpenClaw يحتفظ بخلفية Codex CLI مضمنة.

  </Accordion>
</AccordionGroup>

## سلوك المزوّد المملوك للـ Plugin

توجد معظم المنطق الخاص بالمزوّدين في Plugins المزوّدين (`registerProvider(...)`) بينما يُبقي OpenClaw حلقة الاستدلال العامة. تملك Plugins الإعداد الأولي، وكتالوجات النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات التفكير/الاستدلال، والمزيد.

توجد القائمة الكاملة لخطافات SDK المزوّد وأمثلة Plugins المضمنة في [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins). المزوّد الذي يحتاج إلى منفّذ طلبات مخصص بالكامل هو سطح امتداد منفصل وأعمق.

<Note>
يعيش سلوك المشغّل المملوك للمزوّد على خطافات مزوّد صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف البث، ومساعدات النقل/الطلب. حاوية `ProviderPlugin.capabilities` الثابتة القديمة مخصصة للتوافق فقط، ولم يعد منطق المشغّل المشترك يقرأها.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="مصادر المفاتيح وأولويتها">
    اضبط مفاتيح متعددة عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى مزوّدي Google، يُضمَّن `GOOGLE_API_KEY` أيضًا كرجوع احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - تُعاد محاولة الطلبات بالمفتاح التالي فقط عند استجابات حدود المعدل (مثل `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو `workers_ai ... quota limit exceeded` أو رسائل حدود الاستخدام الدورية).
    - تفشل حالات الفشل غير المرتبطة بحدود المعدل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
    - عندما تفشل كل المفاتيح المرشحة، يُرجع الخطأ النهائي من المحاولة الأخيرة.

  </Accordion>
</AccordionGroup>

## Plugins المزوّدين الرسمية

تنشر Plugins المزوّدين الرسمية صفوف كتالوج النماذج الخاصة بها. لا يتطلب هؤلاء المزوّدون **أي** إدخالات نماذج `models.providers`؛ فعّل Plugin المزوّد، واضبط المصادقة، واختر نموذجًا. استخدم `models.providers` فقط للمزوّدين المخصصين الصريحين أو لإعدادات طلب ضيقة مثل المهلات.

### OpenAI

- المزوّد: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة نماذج: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- تحقق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت معين أو مفتاح API يتصرف بصورة مختلفة.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto`؛ يمرّر OpenClaw اختيار النقل إلى وقت تشغيل النموذج المشترك.
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يمكن تفعيل معالجة أولوية OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- تربط `/fast` و`params.fastMode` طلبات Responses المباشرة لـ `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد طبقة صريحة بدلًا من مفتاح التبديل المشترك `/fast`
- تنطبق ترويسات نسبة OpenClaw المخفية (`originator`، `version`، `User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على وكلاء OpenAI-compatible العامين
- تحتفظ مسارات OpenAI الأصلية أيضًا بـ Responses `store`، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتشكيل حمولات توافق الاستدلال في OpenAI؛ ولا تفعل مسارات الوكيل ذلك
- يتوفر `openai/gpt-5.3-codex-spark` عبر مصادقة اشتراك ChatGPT/Codex OAuth عندما يتيحه حسابك المسجّل؛ لا يزال OpenClaw يحجب مسارات مفتاح API المباشر لـ OpenAI ومفتاح API لـ Azure لهذا النموذج لأن تلك النقلات ترفضه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- المزوّد: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS`، `ANTHROPIC_API_KEY_1`، `ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال نموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك حركة المرور المرسلة إلى `api.anthropic.com` بمفتاح API أو مصادقة OAuth؛ يربط OpenClaw ذلك إلى `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضّل على مرجع النموذج معياريًا ويختار خلفية CLI
  بصورة منفصلة: `anthropic/claude-opus-4-8` مع
  `agentRuntime.id: "claude-cli"` على نطاق النموذج. لا تزال مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- المزوّد: `openai`
- المصادقة: OAuth (ChatGPT)
- مرجع نموذج OpenAI Codex القديم: `openai/gpt-5.5`
- مرجع حزمة تشغيل خادم تطبيق Codex الأصلية: `openai/gpt-5.5`
- مستندات حزمة تشغيل خادم تطبيق Codex الأصلية: [حزمة Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai/*` Plugin الخاص بـ OpenAI؛ ويُختار Plugin خادم تطبيق Codex الأصلي بواسطة وقت تشغيل حزمة Codex.
- CLI: `openclaw onboard --auth-choice openai` أو `openclaw models auth login --provider openai`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج OpenAI Codex عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرَّر `params.serviceTier` أيضًا في طلبات Responses الأصلية لـ Codex (`chatgpt.com/backend-api`)
- لا تُرفق ترويسات نسبة OpenClaw المخفية (`originator`، `version`، `User-Agent`) إلا على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على وكلاء OpenAI-compatible العامين
- يشارك إعداد `/fast` و`params.fastMode` نفسه مثل `openai/*` المباشر؛ يربط OpenClaw ذلك إلى `service_tier=priority`
- يستخدم `openai/gpt-5.5` قيمة `contextWindow = 400000` الأصلية من كتالوج Codex ووقت تشغيل افتراضي `contextTokens = 272000`؛ تجاوز حد وقت التشغيل باستخدام `models.providers.openai.models[].contextTokens`
- ملاحظة سياسة: OpenAI Codex OAuth مدعوم صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.
- لمسار الاشتراك الشائع مع وقت تشغيل Codex الأصلي، سجّل الدخول باستخدام مصادقة `openai` واضبط `openai/gpt-5.5`؛ تختار دورات وكلاء OpenAI Codex افتراضيًا.
- استخدم `agentRuntime.id: "openclaw"` على مستوى المزوّد/النموذج فقط عندما تريد مسار OpenClaw المدمج؛ وإلا فأبقِ `openai/gpt-5.5` على حزمة Codex الافتراضية.
- مراجع GPT الخاصة بـ Codex القديمة هي حالة قديمة، وليست مسار مزوّد حي. استخدم `openai/gpt-5.5` على وقت تشغيل Codex الأصلي لإعداد وكيل جديد، وشغّل `openclaw doctor --fix` لترحيل مراجع نماذج Codex القديمة إلى مراجع `openai/*` المعيارية.

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
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### خيارات مستضافة أخرى بنمط الاشتراك

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/ar/providers/zai">
    خطة Z.AI Coding Plan أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    وصول OAuth لخطة MiniMax Coding Plan أو الوصول بمفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح مزوّد Qwen Cloud بالإضافة إلى Alibaba DashScope وربط نقطة نهاية Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- مزوّد وقت تشغيل Zen: `opencode`
- مزوّد وقت تشغيل Go: `opencode-go`
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
- التدوير الاختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، والرجوع الاحتياطي إلى `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- أمثلة النماذج: `google/gemini-3.1-pro-preview`، و`google/gemini-3-flash-preview`
- التوافق: تُطبّع إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يُقبل `google/gemini-3.1-pro` ويُطبّع إلى معرّف Gemini API الحي من Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. يحذف Gemini 3/3.1 قيمة `thinkingLevel` الثابتة؛ ويرسل Gemini 2.5 القيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو الصيغة القديمة `cached_content`) لتمرير مقبض أصلي للمزوّد بصيغة `cachedContents/...`؛ وتظهر إصابات ذاكرة التخزين المؤقت في Gemini كـ `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، و`google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
OAuth الخاص بـ Gemini CLI في OpenClaw تكامل غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يُشحن OAuth الخاص بـ Gemini CLI كجزء من Plugin `google` المضمّن.

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

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. لا تلصق **أي** معرّف عميل أو سر في `openclaw.json`. يخزّن تدفق تسجيل الدخول في CLI الرموز المميزة في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="تعيين المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

يستخدم Gemini CLI الخيار `stream-json` افتراضيًا. يقرأ OpenClaw رسائل دفق المساعد
ويطبّع `stats.cached` إلى `cacheRead`؛ ولا تزال تجاوزات
`--output-format json` القديمة تقرأ نص الرد من `response`.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال النموذج: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - تستخدم مراجع النماذج معرّف المزوّد القياسي `zai/*`.
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ بينما تفرض `zai-coding-global`، و`zai-coding-cn`، و`zai-global`، و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- المزوّد: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- أمثلة النماذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`، و`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Plugins المزوّدين المضمّنة الأخرى

| المزوّد                                  | المعرّف                          | بيئة المصادقة                                      | مثال النموذج                                                |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/ar/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth أو `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/ar/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth أو `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### خصائص ينبغي معرفتها

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات إسناد التطبيق وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` المتحقَّق منها. تكون مراجع DeepSeek وMoonshot وZAI مؤهلة لمدة TTL لذاكرة التخزين المؤقت للمطالبات المُدارة من OpenRouter، لكنها لا تتلقى علامات ذاكرة التخزين المؤقت من Anthropic. وبصفته مسارًا وكيليًا متوافقًا مع OpenAI، فإنه يتخطى التشكيل الخاص فقط بـ OpenAI الأصلي (`serviceTier`، وResponses `store`، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتوافق الاستدلال مع OpenAI). تحتفظ المراجع المدعومة من Gemini بتنقية توقيع التفكير الخاصة بـ proxy-Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة من Gemini مسار التنقية نفسه الخاص بـ proxy-Gemini؛ ويتخطى `kilocode/kilo/auto` وغيره من المراجع الوكيلية غير الداعمة للاستدلال حقن الاستدلال الوكيلي.
  </Accordion>
  <Accordion title="MiniMax">
    يكتب إعداد API-key تعريفات صريحة لنماذج المحادثة M3 وM2.7؛ ويبقى فهم الصور على مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (مثل `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ المنتقيات على التركيب الحرفي `<provider>/<model-id>` بينما يبقى المفتاح القياسي المُرسل إلى API ببادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار xAI Responses. المسار الموصى به هو SuperGrok/X Premium OAuth؛ ولا تزال مفاتيح API تعمل عبر `XAI_API_KEY` أو إعدادات Plugin، ويعيد Grok `web_search` استخدام ملف تعريف المصادقة نفسه قبل الرجوع الاحتياطي إلى API-key. `grok-4.3` هو نموذج المحادثة الافتراضي المضمّن، و`grok-build-0.1` قابل للاختيار للعمل المركّز على البناء/البرمجة. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3`، و`grok-3-mini`، و`grok-4`، و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (عنوان URL مخصص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزوّدين **مخصصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

تُنشر العديد من Plugins المزوّدة أدناه كتالوجًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الرؤوس أو قائمة النماذج.

تقرأ فحوصات قدرات نماذج Gateway أيضًا بيانات `models.providers.<id>.models[]` الوصفية الصريحة. إذا كان نموذج مخصص أو وكيل يقبل الصور، فعيّن `input: ["text", "image"]` على ذلك النموذج حتى تمرر مسارات مرفقات WebChat والصادرة من Node الصور كمدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

يتحكم `agents.defaults.models["provider/model"]` فقط في ظهور النماذج والأسماء المستعارة والبيانات الوصفية لكل نموذج للوكلاء. ولا يسجّل نموذج تشغيل جديدًا بحد ذاته. بالنسبة إلى نماذج المزوّدين المخصصة، أضف أيضًا `models.providers.<provider>.models[]` مع `id` المطابق على الأقل.

### Moonshot AI (Kimi)

ثبّت `@openclaw/moonshot-provider` قبل الإعداد الأولي. أضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات النموذج الوصفية:

- المزوّد: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- نموذج مثال: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

معرّفات نماذج Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

تظل `kimi/kimi-code` و`kimi/k2p5` القديمة مقبولة كمعرّفات نماذج للتوافق، وتُطبّع إلى معرّف نموذج API المستقر لدى Kimi.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- المزوّد: `volcengine` (للترميز: `volcengine-plan`)
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

تكون الإعدادات الافتراضية للتهيئة الأولية على سطح الترميز، لكن كتالوج `volcengine/*` العام يُسجَّل في الوقت نفسه.

في منتقيات النماذج أثناء التهيئة الأولية/الضبط، يفضّل خيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معًا. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلًا من إظهار منتقٍ فارغ مقيّد بالمزوّد.

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

يوفّر BytePlus ARK وصولًا إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- المزوّد: `byteplus` (للترميز: `byteplus-plan`)
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

تكون الإعدادات الافتراضية للتهيئة الأولية على سطح الترميز، لكن كتالوج `byteplus/*` العام يُسجَّل في الوقت نفسه.

في منتقيات النماذج أثناء التهيئة الأولية/الضبط، يفضّل خيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معًا. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلًا من إظهار منتقٍ فارغ مقيّد بالمزوّد.

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
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لتفاصيل الإعداد وخيارات النماذج ومقتطفات الضبط.

<Note>
على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير افتراضيًا لعائلة M2.x ما لم تضبطه صراحة؛ أما MiniMax-M3 (وM3.x) فيبقى افتراضيًا على مسار التفكير المحذوف/التكيّفي الخاص بالمزوّد. يعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم القدرات المملوك من Plugin:

- تبقى الإعدادات الافتراضية للنص/الدردشة على `minimax/MiniMax-M3`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور هو `MiniMax-VL-01` المملوك من Plugin على مساري مصادقة MiniMax
- يبقى بحث الويب على معرّف المزوّد `minimax`

### LM Studio

يأتي LM Studio بوصفه Plugin مزوّدًا مضمّنًا يستخدم واجهة API الأصلية:

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

يستخدم OpenClaw نقاط LM Studio الأصلية `/api/v1/models` و`/api/v1/models/load` للاكتشاف والتحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضيًا. إذا أردت أن يتولى تحميل LM Studio عند الطلب، وTTL، والإخراج التلقائي إدارة دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama بوصفه Plugin مزوّدًا مضمّنًا ويستخدم واجهة API الأصلية الخاصة بـ Ollama:

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

يُكتشف Ollama محليًا عند `http://127.0.0.1:11434` عندما تختار ذلك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin المزوّد المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للتهيئة الأولية، ووضع السحابة/المحلي، والضبط المخصّص.

### vLLM

يأتي vLLM بوصفه Plugin مزوّدًا مضمّنًا للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

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

يأتي SGLang بوصفه Plugin مزوّدًا مضمّنًا للخوادم السريعة ذاتية الاستضافة المتوافقة مع OpenAI:

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
    بالنسبة إلى المزوّدين المخصّصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من المزوّد عند عدم دعم أدوار `developer`.
    - تتخطى المسارات المتوافقة مع OpenAI بأسلوب الوكيل أيضًا تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط: لا `service_tier`، ولا Responses `store`، ولا Completions `store`، ولا تلميحات ذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة توافق تفكير OpenAI، ولا ترويسات إسناد OpenClaw مخفية.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في متن الطلب الصادر.
    - بالنسبة إلى عناصر تحكم قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى التفكير في الجلسة متوقفًا.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/tailnet البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يمدّد ذلك معالجة طلبات HTTP الخاصة بنموذج المزوّد، بما في ذلك الاتصال والترويسات وبث المتن وإلغاء guarded-fetch الإجمالي، من دون زيادة مهلة تشغيل الوكيل كلها. إذا كانت `agents.defaults.timeoutSeconds` أو مهلة خاصة بالتشغيل أقل، فارفع ذلك الحد أيضًا؛ لا يمكن لمهل المزوّد تمديد التشغيل كله.
    - تسمح استدعاءات HTTP الخاصة بمزوّد النماذج بإجابات DNS ذات Fake-IP من Surge وClash وsing-box ضمن `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف `baseUrl` الخاص بالمزوّد المضبوط. تثق نقاط نهاية المزوّد المخصّصة/المحلية أيضًا في أصل `scheme://host:port` المضبوط بالضبط لطلبات النماذج المحروسة، بما في ذلك مضيفو حلقة الرجوع وLAN وtailnet. هذا ليس خيار ضبط جديدًا؛ إن `baseUrl` الذي تضبطه يوسّع سياسة الطلبات لذلك الأصل فقط. آلية السماح لاسم مضيف Fake-IP وآلية الثقة في الأصل المطابق تمامًا مستقلتان. لا تزال الوجهات الخاصة الأخرى، وحلقة الرجوع، والمحلية على الرابط، ووجهات البيانات الوصفية، والمنافذ المختلفة تتطلب اشتراكًا صريحًا عبر `models.providers.<id>.request.allowPrivateNetwork: true`. اضبط `models.providers.<id>.request.allowPrivateNetwork: false` لتعطيل الثقة في الأصل المطابق تمامًا.
    - إذا كان `baseUrl` فارغًا/محذوفًا، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يحل إلى `api.openai.com`).
    - لأسباب السلامة، لا تزال القيمة الصريحة `compat.supportsDeveloperRole: true` تُستبدل على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي مزوّد غير `anthropic` القياسي، أو `models.providers.anthropic.baseUrl` مخصّص لا يكون مضيفه نقطة نهاية `api.anthropic.com` عامة)، يكبت OpenClaw ترويسات Anthropic beta الضمنية مثل `claude-code-20250219` و`interleaved-thinking-2025-05-14` وعلامات OAuth، حتى لا ترفض الوكلاء المخصّصة المتوافقة مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [الضبط](/ar/gateway/configuration) للحصول على أمثلة ضبط كاملة.

## ذو صلة

- [مرجع الضبط](/ar/gateway/config-agents#agent-defaults) - مفاتيح ضبط النماذج
- [تجاوز فشل النموذج](/ar/concepts/model-failover) - سلاسل الرجوع وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) - ضبط النماذج والأسماء المستعارة
- [المزوّدون](/ar/providers) - أدلة الإعداد الخاصة بكل مزوّد
