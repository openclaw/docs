---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج حسب كل موفّر
    - تريد أمثلة على التكوينات أو أوامر تهيئة CLI لموفّري النماذج
sidebarTitle: Model providers
summary: نظرة عامة على مزوّد النماذج مع أمثلة للإعدادات + مسارات عمل CLI
title: مزودو النماذج
x-i18n:
    generated_at: "2026-05-06T07:48:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 304f20e10cbcd4465b7b843e398452b1b93a19cfaefd9f4d4edc213d7e003542
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع **موفّري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). لقواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع النماذج ومساعدات CLI">
    - تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - يعمل `agents.defaults.models` كقائمة سماح عند ضبطه.
    - مساعدات CLI: `openclaw onboard`، و`openclaw models list`، و`openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` الافتراضيات على مستوى الموفّر؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، وفحوصات التهدئة، واستمرار تجاوزات الجلسة: [تجاوز فشل النماذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="إضافة مصادقة موفّر لا تغيّر نموذجك الأساسي">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` الموجود عند إضافة موفّر أو إعادة المصادقة معه. قد تستمر Plugins الخاصة بالموفّرين في إرجاع نموذج افتراضي موصى به ضمن رقعة إعداد المصادقة الخاصة بها، لكن configure يتعامل مع ذلك على أنه "إتاحة هذا النموذج" عندما يكون هناك نموذج أساسي موجود بالفعل، وليس "استبدال النموذج الأساسي الحالي".

    للتبديل المقصود للنموذج الافتراضي، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="فصل موفّر OpenAI عن وقت التشغيل">
    مسارات عائلة OpenAI مخصّصة حسب البادئة:

    - يستخدم `openai/<model>` مع `agents.defaults.agentRuntime.id: "codex"` حزمة خادم تطبيق Codex الأصلية. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - يستخدم `openai-codex/<model>` مصادقة Codex OAuth في PI.
    - يستخدم `openai/<model>` من دون تجاوز وقت تشغيل Codex موفّر OpenAI المباشر بمفتاح API في PI.

    راجع [OpenAI](/ar/providers/openai) و[حزمة Codex](/ar/plugins/codex-harness). إذا كان فصل الموفّر عن وقت التشغيل مربكًا، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي للـ Plugin الحد نفسه: ينتمي `openai-codex/<model>` إلى OpenAI Plugin، بينما يتم تفعيل Codex Plugin عبر `agentRuntime.id: "codex"` أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 عبر حزمة خادم تطبيق Codex الأصلية عند ضبط `agentRuntime.id: "codex"`، وعبر `openai-codex/gpt-5.5` في PI لمصادقة Codex OAuth، وعبر `openai/gpt-5.5` في PI لحركة المرور المباشرة بمفتاح API عندما يتيحه حسابك.

  </Accordion>
  <Accordion title="أوقات تشغيل CLI">
    تستخدم أوقات تشغيل CLI الفصل نفسه: اختر مراجع نماذج معيارية مثل `anthropic/claude-*` أو `google/gemini-*` أو `openai/gpt-*`، ثم اضبط `agents.defaults.agentRuntime.id` على `claude-cli` أو `google-gemini-cli` أو `codex-cli` عندما تريد واجهة خلفية محلية عبر CLI.

    يتم ترحيل مراجع `claude-cli/*` و`google-gemini-cli/*` و`codex-cli/*` القديمة إلى مراجع الموفّر المعيارية مع تسجيل وقت التشغيل بشكل منفصل.

  </Accordion>
</AccordionGroup>

## سلوك الموفّرين المملوك للـ Plugin

توجد معظم المنطق الخاص بالموفّرين في Plugins الخاصة بالموفّرين (`registerProvider(...)`) بينما يُبقي OpenClaw حلقة الاستدلال العامة. تملك Plugins التهيئة الأولية، وكتالوجات النماذج، وتعيين متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، والمزيد.

توجد القائمة الكاملة لخطافات provider-SDK وأمثلة Plugins المضمّنة في [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins). الموفّر الذي يحتاج إلى منفّذ طلبات مخصّص بالكامل يُعد سطح امتداد منفصلًا وأعمق.

<Note>
يوجد سلوك المشغّل المملوك للموفّر على خطافات موفّر صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف البث، ومساعدات النقل/الطلب. الحاوية الثابتة القديمة `ProviderPlugin.capabilities` مخصّصة للتوافق فقط ولم تعد تُقرأ بواسطة منطق المشغّل المشترك.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="مصادر المفاتيح والأولوية">
    اضبط مفاتيح متعددة عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقّمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى موفّري Google، يتم تضمين `GOOGLE_API_KEY` أيضًا كخيار رجوع احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - تتم إعادة محاولة الطلبات بالمفتاح التالي فقط عند استجابات حدود المعدّل (على سبيل المثال `429`، أو `rate_limit`، أو `quota`، أو `resource exhausted`، أو `Too many concurrent requests`، أو `ThrottlingException`، أو `concurrency limit reached`، أو `workers_ai ... quota limit exceeded`، أو رسائل حدود الاستخدام الدورية).
    - تفشل الإخفاقات غير المتعلقة بحدود المعدّل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
    - عندما تفشل كل المفاتيح المرشحة، يتم إرجاع الخطأ النهائي من المحاولة الأخيرة.

  </Accordion>
</AccordionGroup>

## الموفّرون المدمجون (كتالوج pi-ai)

يأتي OpenClaw مع كتالوج pi-ai. لا يتطلب هؤلاء الموفّرون **أي** إعدادات `models.providers`؛ فقط اضبط المصادقة واختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS`، و`OPENAI_API_KEY_1`، و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة نماذج: `openai/gpt-5.5`، و`openai/gpt-5.4-mini`
- تحقّق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت معيّن أو مفتاح API يتصرف بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`، أو `"websocket"`، أو `"auto"`)
- يتم تمكين إحماء WebSocket لاستجابات OpenAI افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تمكين المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` بـ `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدلًا من مفتاح التبديل المشترك `/fast`
- تنطبق ترويسات إسناد OpenClaw المخفية (`originator`، و`version`، و`User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بـ `store` في Responses، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتشكيل الحمولة المتوافق مع استدلال OpenAI؛ أما مسارات الوكلاء فلا تفعل ذلك
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن طلبات API المباشرة من OpenAI ترفضه ولأن كتالوج Codex الحالي لا يتيحه

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS`، و`ANTHROPIC_API_KEY_1`، و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال نموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك حركة المرور المرسلة إلى `api.anthropic.com` بمفتاح API أو عبر مصادقة OAuth؛ ويربط OpenClaw ذلك بـ `service_tier` الخاص بـ Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضل على مرجع النموذج معياريًا ويختار واجهة CLI
  الخلفية بشكل منفصل: `anthropic/claude-opus-4-7` مع
  `agents.defaults.agentRuntime.id: "claude-cli"`. ما زالت مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. ما زال رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
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
- مرجع حزمة خادم تطبيق Codex الأصلية: `openai/gpt-5.5` مع `agents.defaults.agentRuntime.id: "codex"`
- وثائق حزمة خادم تطبيق Codex الأصلية: [حزمة Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حد Plugin: يحمّل `openai-codex/*` OpenAI Plugin؛ ولا يتم اختيار Plugin خادم تطبيق Codex الأصلي إلا عبر وقت تشغيل حزمة Codex أو مراجع `codex/*` القديمة.
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج PI عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`، أو `"websocket"`، أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` على طلبات Responses الخاصة بـ Codex الأصلية (`chatgpt.com/backend-api`)
- تُرفق ترويسات إسناد OpenClaw المخفية (`originator`، و`version`، و`User-Agent`) فقط على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك إعداد `/fast` نفسه وإعداد `params.fastMode` مثل `openai/*` المباشر؛ ويربط OpenClaw ذلك بـ `service_tier=priority`
- يستخدم `openai-codex/gpt-5.5` قيمة `contextWindow = 400000` الأصلية من كتالوج Codex ووقت التشغيل الافتراضي `contextTokens = 272000`؛ تجاوز حد وقت التشغيل باستخدام `models.providers.openai-codex.models[].contextTokens`
- ملاحظة سياسة: يتم دعم OpenAI Codex OAuth صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.
- للمسار الشائع الذي يجمع الاشتراك مع وقت تشغيل Codex الأصلي، سجّل الدخول بمصادقة `openai-codex` لكن اضبط `openai/gpt-5.5` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`.
- استخدم `openai-codex/gpt-5.5` فقط عندما تريد مسار Codex OAuth/الاشتراك عبر PI؛ واستخدم `openai/gpt-5.5` من دون تجاوز وقت تشغيل Codex عندما يتيح إعداد مفتاح API والكتالوج المحلي لديك مسار API العام.

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
    خطة Z.AI Coding أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    مصادقة OAuth لخطة MiniMax Coding أو الوصول بمفتاح API.
  </Card>
  <Card title="Qwen Cloud" href="/ar/providers/qwen">
    سطح موفّر Qwen Cloud بالإضافة إلى Alibaba DashScope وتعيين نقطة نهاية Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر وقت تشغيل Zen: `opencode`
- موفّر وقت تشغيل Go: `opencode-go`
- أمثلة نماذج: `opencode/claude-opus-4-6`، و`opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، واحتياطي `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز منفرد)
- نماذج أمثلة: `google/gemini-3.1-pro-preview`، و`google/gemini-3-flash-preview`
- التوافق: تتم تسوية إعدادات OpenClaw القديمة التي تستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يتم قبول `google/gemini-3.1-pro` وتسويته إلى معرّف API Gemini المباشر لدى Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. يحذف Gemini 3/3.1 قيمة `thinkingLevel` ثابتة؛ ويرسل Gemini 2.5 القيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديمة) لتمرير مقبض `cachedContents/...` أصلي للمزوّد؛ وتظهر إصابات ذاكرة التخزين المؤقت في Gemini كـ `cacheRead` في OpenClaw

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، و`google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد ADC من gcloud؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
مصادقة OAuth في Gemini CLI داخل OpenClaw هي تكامل غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

تُشحن مصادقة OAuth في Gemini CLI كجزء من Plugin `google` المضمّن.

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

    النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`. أنت **لا** تلصق معرّف عميل أو سرًا في `openclaw.json`. يخزّن تدفق تسجيل الدخول في CLI الرموز في ملفات تعريف المصادقة على مضيف Gateway.

  </Step>
  <Step title="عيّن المشروع (إذا لزم الأمر)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

تُحلَّل ردود JSON من Gemini CLI من `response`؛ ويرجع الاستخدام احتياطيًا إلى `stats`، مع تسوية `stats.cached` إلى `cacheRead` في OpenClaw.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- نموذج مثال: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: تتم تسوية `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا؛ بينما تفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

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
- يشحن كتالوج الاحتياط الثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف `https://api.kilo.ai/api/gateway/models` المباشر توسيع كتالوج وقت التشغيل أكثر.
- التوجيه الدقيق في المصدر خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway، وليس مضمّنًا ترميزيًا في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للاطلاع على تفاصيل الإعداد.

### Plugins المزوّدين المضمّنة الأخرى

| المزوّد                 | المعرّف                          | متغير بيئة المصادقة                                          | نموذج مثال                                   |
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
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
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
    يطبّق ترويسات نسبة التطبيق الخاصة به وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` الموثّقة. مراجع DeepSeek وMoonshot وZAI مؤهلة لمدة بقاء ذاكرة التخزين المؤقت (TTL) للتخزين المؤقت للمطالبات المُدار من OpenRouter، لكنها لا تتلقى علامات ذاكرة التخزين المؤقت من Anthropic. وبصفته مسارًا بأسلوب الوكيل متوافقًا مع OpenAI، فإنه يتجاوز التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، وResponses `store`، وتلميحات ذاكرة التخزين المؤقت للمطالبات، وتوافق الاستدلال مع OpenAI). تحتفظ المراجع المدعومة من Gemini بتنقية تواقيع التفكير الخاصة بـ proxy-Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة من Gemini مسار التنقية نفسه الخاص بـ proxy-Gemini؛ ويتجاوز `kilocode/kilo/auto` وغيره من المراجع غير المدعومة لاستدلال الوكيل حقن استدلال الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    يكتب الإعداد بمفتاح API تعريفات صريحة لنموذج محادثة M2.7 النصي فقط؛ ويبقى فهم الصور على مزوّد الوسائط `MiniMax-VL-01` المملوك من Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (مثل `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ أدوات الاختيار على تركيب `<provider>/<model-id>` الحرفي، بينما يبقى المفتاح القانوني المُرسل إلى API ببادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار Responses الخاص بـ xAI. `grok-4.3` هو نموذج المحادثة الافتراضي المضمّن. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و`grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`. يكون `tool_stream` مفعّلًا افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    يُشحن بوصفه Plugin مزوّد `cerebras` المضمّن. يستخدم GLM ‏`zai-glm-4.7`؛ وعنوان URL الأساسي المتوافق مع OpenAI هو `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزوّدين **مخصصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

تنشر العديد من Plugins المزوّدين المضمّنة أدناه كتالوجًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوصات قدرات نماذج Gateway أيضًا بيانات تعريف `models.providers.<id>.models[]` الصريحة. إذا كان نموذج مخصص أو وكيل يقبل الصور، فاضبط `input: ["text", "image"]` على ذلك النموذج حتى يمرّر WebChat ومسارات المرفقات الصادرة من Node الصور كمدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

### Moonshot AI (Kimi)

تُشحن Moonshot بوصفها Plugin مزوّدًا مضمّنًا. استخدم المزوّد المدمج افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات تعريف النموذج:

- المزوّد: `moonshot`
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

### برمجة Kimi

تستخدم Kimi Coding نقطة نهاية Moonshot AI المتوافقة مع Anthropic:

- المزوّد: `kimi`
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

يظل `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- المزوّد: `volcengine` (الترميز: `volcengine-plan`)
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

تكون الإعدادات الأولية أثناء التهيئة على سطح الترميز افتراضيًا، لكن كتالوج `volcengine/*` العام يُسجّل في الوقت نفسه.

في منتقيات النماذج أثناء التهيئة/الضبط، يفضّل خيار مصادقة Volcengine صفوف `volcengine/*` و`volcengine-plan/*` معًا. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلًا من عرض منتقي فارغ مقيّد بالمزوّد.

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

يوفر BytePlus ARK الوصول إلى النماذج نفسها التي يوفرها Volcano Engine للمستخدمين الدوليين.

- المزوّد: `byteplus` (الترميز: `byteplus-plan`)
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

تكون الإعدادات الأولية أثناء التهيئة على سطح الترميز افتراضيًا، لكن كتالوج `byteplus/*` العام يُسجّل في الوقت نفسه.

في منتقيات النماذج أثناء التهيئة/الضبط، يفضّل خيار مصادقة BytePlus صفوف `byteplus/*` و`byteplus-plan/*` معًا. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلًا من عرض منتقي فارغ مقيّد بالمزوّد.

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

يوفر Synthetic نماذج متوافقة مع Anthropic خلف المزوّد `synthetic`:

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

تتم تهيئة MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (عالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) لمعرفة تفاصيل الإعداد وخيارات النماذج ومقتطفات الإعدادات.

<Note>
في مسار البث المتوافق مع Anthropic لدى MiniMax، يعطّل OpenClaw التفكير افتراضيًا ما لم تضبطه صراحةً، ويعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم القدرات المملوك من Plugin:

- تبقى إعدادات النص/الدردشة الافتراضية على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك من Plugin باستخدام `MiniMax-VL-01` على مساري مصادقة MiniMax
- يبقى بحث الويب على معرّف المزوّد `minimax`

### LM Studio

يأتي LM Studio كـ Plugin مزوّد مضمّن يستخدم API الأصلي:

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

يستخدم OpenClaw مساري LM Studio الأصليين `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضيًا. إذا أردت أن يتولى تحميل JIT وTTL والإخراج التلقائي في LM Studio دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يأتي Ollama كـ Plugin مزوّد مضمّن ويستخدم API الأصلي لـ Ollama:

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

يُكتشف Ollama محليًا عند `http://127.0.0.1:11434` عند الاشتراك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin المزوّد المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) لمعرفة التهيئة، ووضع السحابة/المحلي، والإعدادات المخصصة.

### vLLM

يأتي vLLM كـ Plugin مزوّد مضمّن للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

- المزوّد: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا لم يكن خادمك يفرض المصادقة):

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

يأتي SGLang كـ Plugin مزوّد مضمّن لخوادم سريعة ذاتية الاستضافة متوافقة مع OpenAI:

- المزوّد: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا لم يكن خادمك يفرض المصادقة):

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
  <Accordion title="الحقول الاختيارية الافتراضية">
    بالنسبة إلى المزوّدين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    موصى به: اضبط قيمًا صريحة تطابق حدود الوكيل/النموذج لديك.

  </Accordion>
  <Accordion title="قواعد تشكيل مسارات الوكيل">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ لا يكون مضيفه `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من المزوّد للأدوار `developer` غير المدعومة.
    - تتخطى المسارات المتوافقة مع OpenAI بنمط الوكيل أيضًا تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط: لا `service_tier`، ولا Responses `store`، ولا Completions `store`، ولا تلميحات تخزين مؤقت للمطالبات، ولا تشكيل حمولة توافق استدلال OpenAI، ولا ترويسات إسناد مخفية من OpenClaw.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في جسم الطلب الصادر.
    - بالنسبة إلى عناصر التحكم في قوالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائيًا `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى تفكير الجلسة متوقفًا.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/tailnet البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يمدّد هذا معالجة طلبات HTTP لنماذج المزوّد، بما في ذلك الاتصال والترويسات وبث الجسم وإلغاء الجلب المحمي الإجمالي، من دون زيادة مهلة تشغيل الوكيل بالكامل.
    - تسمح استدعاءات HTTP لمزوّد النموذج بإجابات DNS ذات IP وهمي من Surge وClash وsing-box ضمن `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف `baseUrl` الخاص بالمزوّد المضبوط. لا تزال الوجهات الخاصة الأخرى وloopback وlink-local وmetadata تتطلب اشتراكًا صريحًا عبر `models.providers.<id>.request.allowPrivateNetwork: true`.
    - إذا كان `baseUrl` فارغًا/محذوفًا، يحافظ OpenClaw على سلوك OpenAI الافتراضي (الذي يتحلل إلى `api.openai.com`).
    - من أجل السلامة، تظل القيمة الصريحة `compat.supportsDeveloperRole: true` مُتجاوزة على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي مزوّد غير `anthropic` القياسي، أو `models.providers.anthropic.baseUrl` مخصص لا يكون مضيفه نقطة نهاية عامة من `api.anthropic.com`)، يحجب OpenClaw ترويسات Anthropic beta الضمنية مثل `claude-code-20250219` و`interleaved-thinking-2025-05-14` وعلامات OAuth، حتى لا ترفض الوكلاء المخصصون المتوافقون مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

انظر أيضًا: [الإعدادات](/ar/gateway/configuration) للحصول على أمثلة إعدادات كاملة.

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) - مفاتيح إعداد النماذج
- [تجاوز فشل النماذج](/ar/concepts/model-failover) - سلاسل الرجوع وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) - إعداد النماذج والأسماء المستعارة
- [المزوّدون](/ar/providers) - أدلة الإعداد حسب كل مزوّد
