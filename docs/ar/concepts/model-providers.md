---
read_when:
    - تحتاج إلى مرجع إعداد النماذج لكل مزوّد
    - تريد أمثلة على الإعدادات أو أوامر تهيئة CLI لمزوّدي النماذج
sidebarTitle: Model providers
summary: نظرة عامة على موفّر النماذج مع أمثلة على التكوينات + تدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-06-27T17:30:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

مرجع لـ **مزوّدي LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram). لقواعد اختيار النموذج، راجع [النماذج](/ar/concepts/models).

## قواعد سريعة

<AccordionGroup>
  <Accordion title="مراجع النماذج ومساعدات CLI">
    - تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
    - تعمل `agents.defaults.models` كقائمة سماح عند ضبطها.
    - مساعدات CLI: `openclaw onboard`، `openclaw models list`، `openclaw models set <provider/model>`.
    - تضبط `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` القيم الافتراضية على مستوى المزوّد؛ وتتجاوزها `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` لكل نموذج.
    - قواعد الرجوع الاحتياطي، ومجسّات التهدئة، واستمرار تجاوزات الجلسة: [تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>
  <Accordion title="إضافة مصادقة مزوّد لا تغيّر نموذجك الأساسي">
    يحافظ `openclaw configure` على `agents.defaults.model.primary` موجود عند إضافة مزوّد أو إعادة مصادقته. يفعل `openclaw models auth login` الشيء نفسه ما لم تمرّر `--set-default`. قد تظل Plugins المزوّدين تُرجع نموذجًا افتراضيًا موصى به في تصحيح إعدادات المصادقة الخاص بها، لكن OpenClaw يتعامل مع ذلك على أنه "اجعل هذا النموذج متاحًا" عندما يكون هناك نموذج أساسي موجود بالفعل، وليس "استبدل النموذج الأساسي الحالي."

    للتبديل المقصود للنموذج الافتراضي، استخدم `openclaw models set <provider/model>` أو `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="الفصل بين مزوّد OpenAI ووقت التشغيل">
    مسارات عائلة OpenAI خاصة بالبادئات:

    - يستخدم `openai/<model>` حزمة Codex الأصلية لخادم التطبيق لمنعطفات الوكيل افتراضيًا. هذا هو إعداد اشتراك ChatGPT/Codex المعتاد.
    - مراجع نماذج Codex القديمة هي إعدادات قديمة يعيد doctor كتابتها إلى `openai/<model>`.
    - يستخدم `openai/<model>` مع سياسة وقت التشغيل على مستوى المزوّد/النموذج `agentRuntime.id: "openclaw"` وقت التشغيل المضمّن في OpenClaw لمسارات مفتاح API الصريحة أو مسارات التوافق.

    راجع [OpenAI](/ar/providers/openai) و[حزمة Codex](/ar/plugins/codex-harness). إذا كان الفصل بين المزوّد ووقت التشغيل مربكًا، فاقرأ [أوقات تشغيل الوكلاء](/ar/concepts/agent-runtimes) أولًا.

    يتبع التفعيل التلقائي لـ Plugin الحد نفسه: مراجع الوكيل `openai/*` تفعّل Plugin Codex للمسار الافتراضي، كما تتطلبه أيضًا `agentRuntime.id: "codex"` الصريحة على مستوى المزوّد/النموذج أو مراجع `codex/<model>` القديمة.

    يتوفر GPT-5.5 من خلال حزمة Codex الأصلية لخادم التطبيق افتراضيًا على `openai/gpt-5.5`، ومن خلال وقت تشغيل OpenClaw عندما تختار سياسة وقت التشغيل على مستوى المزوّد/النموذج `openclaw` صراحةً.

  </Accordion>
  <Accordion title="أوقات تشغيل CLI">
    تستخدم أوقات تشغيل CLI الفصل نفسه: اختر مراجع نماذج معيارية مثل `anthropic/claude-*` أو `google/gemini-*`، ثم اضبط سياسة وقت التشغيل على مستوى المزوّد/النموذج إلى `claude-cli` أو `google-gemini-cli` عندما تريد خلفية CLI محلية.

    تُهاجر مراجع `claude-cli/*` و`google-gemini-cli/*` القديمة إلى مراجع المزوّدين المعيارية مع تسجيل وقت التشغيل على نحو منفصل. تُهاجر مراجع `codex-cli/*` القديمة إلى `openai/*` وتستخدم مسار خادم تطبيق Codex؛ لم يعد OpenClaw يحتفظ بخلفية Codex CLI مضمّنة.

  </Accordion>
</AccordionGroup>

## سلوك المزوّد المملوك لـ Plugin

توجد معظم المنطق الخاص بالمزوّد داخل Plugins المزوّدين (`registerProvider(...)`) بينما يحافظ OpenClaw على حلقة الاستدلال العامة. تمتلك Plugins التهيئة الأولية، وكتالوجات النماذج، وربط متغيرات بيئة المصادقة، وتطبيع النقل/الإعدادات، وتنظيف مخطط الأدوات، وتصنيف تجاوز الفشل، وتحديث OAuth، وتقارير الاستخدام، وملفات تعريف التفكير/الاستدلال، وغير ذلك.

توجد القائمة الكاملة لخطافات SDK المزوّد وأمثلة Plugins المضمّنة في [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins). المزوّد الذي يحتاج إلى منفّذ طلبات مخصص تمامًا هو سطح توسعة منفصل وأعمق.

<Note>
يوجد سلوك المشغّل المملوك للمزوّد على خطافات مزوّد صريحة مثل سياسة إعادة التشغيل، وتطبيع مخطط الأدوات، وتغليف التدفق، ومساعدات النقل/الطلب. حاوية `ProviderPlugin.capabilities` الثابتة القديمة للتوافق فقط ولم تعد تقرأها منطق المشغّل المشترك.
</Note>

## تدوير مفاتيح API

<AccordionGroup>
  <Accordion title="مصادر المفاتيح والأولوية">
    اضبط مفاتيح متعددة عبر:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز مباشر واحد، أعلى أولوية)
    - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
    - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
    - `<PROVIDER>_API_KEY_*` (قائمة مرقّمة، مثل `<PROVIDER>_API_KEY_1`)

    بالنسبة إلى مزوّدي Google، يُضمَّن `GOOGLE_API_KEY` أيضًا كرجوع احتياطي. يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.

  </Accordion>
  <Accordion title="متى يبدأ التدوير">
    - تُعاد محاولة الطلبات بالمفتاح التالي فقط عند استجابات حدّ المعدّل (على سبيل المثال `429`، أو `rate_limit`، أو `quota`، أو `resource exhausted`، أو `Too many concurrent requests`، أو `ThrottlingException`، أو `concurrency limit reached`، أو `workers_ai ... quota limit exceeded`، أو رسائل حدّ الاستخدام الدورية).
    - تفشل الإخفاقات غير المرتبطة بحدّ المعدّل فورًا؛ ولا تُجرى محاولة تدوير للمفاتيح.
    - عندما تفشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.

  </Accordion>
</AccordionGroup>

## Plugins المزوّدين الرسمية

تنشر Plugins المزوّدين الرسمية صفوف كتالوج النماذج الخاصة بها. لا يتطلب هؤلاء المزوّدون أي إدخالات نماذج في `models.providers`؛ فعّل Plugin المزوّد، واضبط المصادقة، واختر نموذجًا. استخدم `models.providers` فقط للمزوّدين المخصصين صراحةً أو لإعدادات طلب ضيقة مثل مهل الانتظار.

### OpenAI

- المزوّد: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS`، `OPENAI_API_KEY_1`، `OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة نماذج: `openai/gpt-5.5`، `openai/gpt-5.4-mini`
- تحقّق من توفر الحساب/النموذج باستخدام `openclaw models list --provider openai` إذا كان تثبيت محدد أو مفتاح API يتصرف بشكل مختلف.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto`؛ يمرّر OpenClaw اختيار النقل إلى وقت تشغيل النموذج المشترك.
- تجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يمكن تفعيل المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة لـ `openai/*` إلى `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد طبقة صريحة بدلًا من مفتاح التبديل المشترك `/fast`
- تنطبق رؤوس نسبة OpenClaw المخفية (`originator`، `version`، `User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ مسارات OpenAI الأصلية أيضًا بـ Responses `store`، وتلميحات ذاكرة التخزين المؤقت للموجه، وتشكيل حمولة توافق الاستدلال في OpenAI؛ ولا تفعل مسارات الوكيل ذلك
- يتوفر `openai/gpt-5.3-codex-spark` من خلال مصادقة اشتراك OAuth في ChatGPT/Codex عندما يتيحه حسابك المسجّل الدخول؛ لا يزال OpenClaw يمنع مسارات مفتاح API المباشر لـ OpenAI ومفتاح API لـ Azure لهذا النموذج لأن تلك وسائل النقل ترفضه

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
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك الحركة المرسلة بمفتاح API والمصادقة عبر OAuth إلى `api.anthropic.com`؛ ويربط OpenClaw ذلك إلى `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- يحافظ إعداد Claude CLI المفضل على مرجع النموذج معياريًا ويختار خلفية CLI
  بشكل منفصل: `anthropic/claude-opus-4-8` مع
  `agentRuntime.id: "claude-cli"` على نطاق النموذج. لا تزال مراجع
  `claude-cli/claude-opus-4-7` القديمة تعمل للتوافق.

<Note>
أخبرنا فريق Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` كأمرين معتمدين لهذا التكامل ما لم تنشر Anthropic سياسة جديدة. يظل رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.
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
- مرجع حزمة خادم تطبيق Codex الأصلية: `openai/gpt-5.5`
- وثائق حزمة خادم تطبيق Codex الأصلية: [حزمة Codex](/ar/plugins/codex-harness)
- مراجع النماذج القديمة: `codex/gpt-*`
- حدّ Plugin: يحمّل `openai/*` Plugin OpenAI؛ ويتم اختيار Plugin خادم تطبيق Codex الأصلي بواسطة وقت تشغيل حزمة Codex.
- CLI: `openclaw onboard --auth-choice openai` أو `openclaw models auth login --provider openai`
- النقل الافتراضي هو `auto` (WebSocket أولًا، مع رجوع احتياطي إلى SSE)
- تجاوز لكل نموذج OpenAI Codex عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يُمرَّر `params.serviceTier` أيضًا في طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- تُرفق رؤوس نسبة OpenClaw المخفية (`originator`، `version`، `User-Agent`) فقط على حركة Codex الأصلية إلى `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك إعداد `/fast` و`params.fastMode` نفسه مثل `openai/*` المباشر؛ يربط OpenClaw ذلك إلى `service_tier=priority`
- يستخدم `openai/gpt-5.5` قيمة كتالوج Codex الأصلية `contextWindow = 400000` ووقت التشغيل الافتراضي `contextTokens = 272000`؛ تجاوز حد وقت التشغيل باستخدام `models.providers.openai.models[].contextTokens`
- ملاحظة سياسة: OpenAI Codex OAuth مدعوم صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.
- للمسار الشائع الذي يجمع الاشتراك مع وقت تشغيل Codex الأصلي، سجّل الدخول بمصادقة `openai` واضبط `openai/gpt-5.5`؛ تختار منعطفات وكيل OpenAI ‏Codex افتراضيًا.
- استخدم `agentRuntime.id: "openclaw"` على مستوى المزوّد/النموذج فقط عندما تريد مسار OpenClaw المضمّن؛ وإلا فأبقِ `openai/gpt-5.5` على حزمة Codex الافتراضية.
- مراجع GPT القديمة لـ Codex هي حالة قديمة، وليست مسار مزوّد حيًا. استخدم `openai/gpt-5.5` على وقت تشغيل Codex الأصلي لإعداد وكيل جديد، وشغّل `openclaw doctor --fix` لترحيل مراجع نماذج Codex القديمة إلى مراجع `openai/*` المعيارية.

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

### خيارات مستضافة أخرى بأسلوب الاشتراك

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/ar/providers/zai">
    خطة Z.AI Coding Plan أو نقاط نهاية API العامة.
  </Card>
  <Card title="MiniMax" href="/ar/providers/minimax">
    وصول MiniMax Coding Plan عبر OAuth أو مفتاح API.
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
- تدوير اختياري: `GEMINI_API_KEYS`، و`GEMINI_API_KEY_1`، و`GEMINI_API_KEY_2`، واحتياطي `GOOGLE_API_KEY`، و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- نماذج أمثلة: `google/gemini-3.1-pro-preview`، و`google/gemini-3-flash-preview`
- التوافق: تتم تسوية إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- الاسم المستعار: يتم قبول `google/gemini-3.1-pro` وتسويته إلى معرّف Gemini API المباشر من Google، وهو `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- التفكير: يستخدم `/think adaptive` التفكير الديناميكي من Google. لا تضع Gemini 3/3.1 قيمة `thinkingLevel` ثابتة؛ وترسل Gemini 2.5 القيمة `thinkingBudget: -1`.
- تقبل عمليات تشغيل Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent` (أو `cached_content` القديم) لتمرير معرّف `cachedContents/...` أصلي للمزوّد؛ وتظهر إصابات ذاكرة Gemini المؤقتة في OpenClaw كـ `cacheRead`

### Google Vertex وGemini CLI

- المزوّدون: `google-vertex`، و`google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به

<Warning>
تكامل Gemini CLI OAuth في OpenClaw غير رسمي. أبلغ بعض المستخدمين عن قيود على حساب Google بعد استخدام عملاء تابعين لجهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
</Warning>

يتم شحن Gemini CLI OAuth كجزء من Plugin `google` المضمّن.

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
  <Step title="Set project (if needed)">
    إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway.
  </Step>
</Steps>

يستخدم Gemini CLI الخيار `stream-json` افتراضيًا. يقرأ OpenClaw رسائل دفق المساعد
ويسوّي `stats.cached` إلى `cacheRead`؛ ولا تزال تجاوزات
`--output-format json` القديمة تقرأ نص الرد من `response`.

### Z.AI (GLM)

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- نموذج مثال: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - تستخدم مراجع النماذج معرّف المزوّد القانوني `zai/*`.
  - يكتشف `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا؛ بينما تفرض `zai-coding-global`، و`zai-coding-cn`، و`zai-global`، و`zai-cn` واجهة محددة

### Vercel AI Gateway

- المزوّد: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- نماذج أمثلة: `vercel-ai-gateway/anthropic/claude-opus-4.6`، و`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Plugins المزوّدين المضمّنة الأخرى

| المزوّد                                 | المعرّف                          | متغير بيئة المصادقة                                  | نموذج مثال                                                |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
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

#### تفاصيل جديرة بالمعرفة

<AccordionGroup>
  <Accordion title="OpenRouter">
    يطبّق ترويسات نسبة التطبيق وعلامات Anthropic `cache_control` فقط على مسارات `openrouter.ai` التي تم التحقق منها. مراجع DeepSeek وMoonshot وZAI مؤهلة لذاكرة التخزين المؤقت للطلبات ذات مدة TTL التي يديرها OpenRouter، لكنها لا تتلقى علامات ذاكرة Anthropic المؤقتة. وبصفته مسارًا بنمط وكيل متوافقًا مع OpenAI، فإنه يتجاوز التشكيل الخاص بـ OpenAI الأصلي فقط (`serviceTier`، و`store` في Responses، وتلميحات ذاكرة الطلبات المؤقتة، وتوافق الاستدلال مع OpenAI). تحتفظ المراجع المدعومة بـ Gemini بتنظيف توقيع التفكير الخاص بوكيل Gemini فقط.
  </Accordion>
  <Accordion title="Kilo Gateway">
    تتبع المراجع المدعومة بـ Gemini مسار التنظيف نفسه الخاص بوكيل Gemini؛ ويتجاوز `kilocode/kilo/auto` والمراجع الأخرى التي لا تدعم استدلال الوكيل حقن استدلال الوكيل.
  </Accordion>
  <Accordion title="MiniMax">
    تكتب تهيئة مفتاح API تعريفات صريحة لنماذج دردشة M3 وM2.7؛ ويبقى فهم الصور على مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
  </Accordion>
  <Accordion title="NVIDIA">
    تستخدم معرّفات النماذج مساحة أسماء `nvidia/<vendor>/<model>` (على سبيل المثال `nvidia/nvidia/nemotron-...` إلى جانب `nvidia/moonshotai/kimi-k2.5`)؛ وتحافظ أدوات الاختيار على تركيب `<provider>/<model-id>` الحرفي، بينما يبقى المفتاح القانوني المرسل إلى API ذا بادئة واحدة.
  </Accordion>
  <Accordion title="xAI">
    يستخدم مسار Responses الخاص بـ xAI. المسار الموصى به هو SuperGrok/X Premium OAuth؛ ولا تزال مفاتيح API تعمل عبر `XAI_API_KEY` أو إعداد Plugin، ويعيد `web_search` في Grok استخدام ملف تعريف المصادقة نفسه قبل الرجوع إلى مفتاح API. `grok-4.3` هو نموذج الدردشة الافتراضي المضمّن، و`grok-build-0.1` قابل للاختيار للعمل الموجّه للبناء/البرمجة. يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3`، و`grok-3-mini`، و`grok-4`، و`grok-4-0709` إلى متغيراتها `*-fast`. يتم تشغيل `tool_stream` افتراضيًا؛ عطّله عبر `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## المزوّدون عبر `models.providers` (عنوان URL مخصص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة مزوّدين **مخصصين** أو وكلاء متوافقين مع OpenAI/Anthropic.

تنشر العديد من Plugins المزوّدين المضمّنة أدناه كتالوجًا افتراضيًا بالفعل. استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

تقرأ فحوصات إمكانات النماذج في Gateway أيضًا بيانات `models.providers.<id>.models[]` الوصفية الصريحة. إذا كان نموذج مخصص أو نموذج وكيل يقبل الصور، فاضبط `input: ["text", "image"]` على ذلك النموذج حتى تمرر مسارات مرفقات WebChat وذات منشأ Node الصور كمدخلات نموذج أصلية بدلًا من مراجع وسائط نصية فقط.

يتحكم `agents.defaults.models["provider/model"]` فقط في ظهور النموذج والأسماء المستعارة والبيانات الوصفية لكل نموذج للوكلاء. ولا يسجل نموذج تشغيل جديدًا بذاته. بالنسبة إلى نماذج المزوّدين المخصصة، أضف أيضًا `models.providers.<provider>.models[]` مع `id` المطابق على الأقل.

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

### البرمجة باستخدام Kimi

يستخدم Kimi Coding نقطة نهاية متوافقة مع Anthropic من Moonshot AI:

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

يبقى `kimi/kimi-code` و`kimi/k2p5` القديمان مقبولين كمعرّفات نماذج للتوافق، ويجري تطبيعهما إلى معرّف نموذج API المستقر الخاص بـ Kimi.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) وصولًا إلى Doubao ونماذج أخرى في الصين.

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

يتخذ الإعداد الأولي سطح البرمجة افتراضيًا، لكن كتالوج `volcengine/*` العام يُسجَّل في الوقت نفسه.

في منتقيات نماذج الإعداد الأولي/التهيئة، يفضّل خيار مصادقة Volcengine كلاً من صفوف `volcengine/*` و`volcengine-plan/*`. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلاً من إظهار منتقٍ فارغ مقيّد بالموفّر.

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

يوفّر BytePlus ARK الوصول إلى النماذج نفسها التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` (البرمجة: `byteplus-plan`)
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

يضبط الإعداد الأولي السطح الافتراضي على سطح البرمجة، لكن كتالوج `byteplus/*` العام يُسجَّل في الوقت نفسه.

في منتقيات نماذج الإعداد الأولي/التهيئة، يفضّل خيار مصادقة BytePlus كلاً من صفوف `byteplus/*` و`byteplus-plan/*`. إذا لم تكن تلك النماذج محمّلة بعد، يعود OpenClaw إلى الكتالوج غير المصفّى بدلاً من إظهار منتقٍ فارغ مقيّد بالموفّر.

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

يوفّر Synthetic نماذج متوافقة مع Anthropic خلف الموفّر `synthetic`:

- الموفّر: `synthetic`
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

تُهيَّأ MiniMax عبر `models.providers` لأنها تستخدم نقاط نهاية مخصّصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح MiniMax API (عالمي): `--auth-choice minimax-global-api`
- مفتاح MiniMax API (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للحصول على تفاصيل الإعداد، وخيارات النماذج، ومقتطفات التهيئة.

<Note>
على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير افتراضياً لعائلة M2.x ما لم تضبطه صراحةً؛ يبقى MiniMax-M3 (وM3.x) على مسار التفكير المتروك/التكيّفي الخاص بالموفّر افتراضياً. يعيد `/fast on` كتابة `MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.
</Note>

تقسيم القدرات المملوك للـ Plugin:

- تبقى افتراضيات النص/الدردشة على `minimax/MiniMax-M3`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور مملوك للـ Plugin باستخدام `MiniMax-VL-01` على مساري مصادقة MiniMax
- يبقى بحث الويب على معرّف الموفّر `minimax`

### LM Studio

يُشحن LM Studio بوصفه Plugin موفّر مضمّناً يستخدم API الأصلي:

- الموفّر: `lmstudio`
- المصادقة: `LM_API_TOKEN`
- عنوان URL الأساسي الافتراضي للاستدلال: `http://localhost:1234/v1`

ثم اضبط نموذجاً (استبدله بأحد المعرّفات التي يعيدها `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

يستخدم OpenClaw واجهتي LM Studio الأصليتين `/api/v1/models` و`/api/v1/models/load` للاكتشاف + التحميل التلقائي، مع `/v1/chat/completions` للاستدلال افتراضياً. إذا أردت أن يتولى تحميل LM Studio الفوري، وTTL، والإخلاء التلقائي دورة حياة النموذج، فاضبط `models.providers.lmstudio.params.preload: false`. راجع [/providers/lmstudio](/ar/providers/lmstudio) للإعداد واستكشاف الأخطاء وإصلاحها.

### Ollama

يُشحن Ollama بوصفه Plugin موفّر مضمّناً ويستخدم API الأصلي الخاص بـ Ollama:

- الموفّر: `ollama`
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

يُكتشف Ollama محلياً على `http://127.0.0.1:11434` عندما تختار الاشتراك باستخدام `OLLAMA_API_KEY`، ويضيف Plugin الموفّر المضمّن Ollama مباشرةً إلى `openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama) للإعداد الأولي، ووضع السحابة/المحلي، والتهيئة المخصّصة.

### vLLM

يُشحن vLLM بوصفه Plugin موفّر مضمّناً للخوادم المحلية/ذاتية الاستضافة المتوافقة مع OpenAI:

- الموفّر: `vllm`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محلياً (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجاً (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للحصول على التفاصيل.

### SGLang

يُشحن SGLang بوصفه Plugin موفّر مضمّناً للخوادم السريعة ذاتية الاستضافة المتوافقة مع OpenAI:

- الموفّر: `sglang`
- المصادقة: اختيارية (تعتمد على خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محلياً (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجاً (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للحصول على التفاصيل.

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
    بالنسبة إلى الموفّرين المخصّصين، تكون `reasoning`، و`input`، و`cost`، و`contextWindow`، و`maxTokens` اختيارية. عند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    مستحسن: اضبط قيماً صريحة تطابق حدود وكيلك/نموذجك.

  </Accordion>
  <Accordion title="قواعد تشكيل مسارات الوكيل">
    - بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ يكون مضيفه ليس `api.openai.com`)، يفرض OpenClaw قيمة `compat.supportsDeveloperRole: false` لتجنّب أخطاء 400 من الموفّر للأدوار `developer` غير المدعومة.
    - تتخطى المسارات المتوافقة مع OpenAI بنمط الوكيل أيضاً تشكيل الطلبات الأصلي الحصري لـ OpenAI: لا `service_tier`، ولا Responses `store`، ولا Completions `store`، ولا تلميحات ذاكرة التخزين المؤقت للمطالبات، ولا تشكيل حمولة توافق الاستدلال في OpenAI، ولا ترويسات إسناد OpenClaw مخفية.
    - بالنسبة إلى وكلاء Completions المتوافقين مع OpenAI الذين يحتاجون إلى حقول خاصة بالمورّد، اضبط `agents.defaults.models["provider/model"].params.extra_body` (أو `extraBody`) لدمج JSON إضافي في متن الطلب الصادر.
    - بالنسبة إلى عناصر تحكم قالب الدردشة في vLLM، اضبط `agents.defaults.models["provider/model"].params.chat_template_kwargs`. يرسل Plugin vLLM المضمّن تلقائياً `enable_thinking: false` و`force_nonempty_content: true` لـ `vllm/nemotron-3-*` عندما يكون مستوى التفكير في الجلسة متوقفاً.
    - بالنسبة إلى النماذج المحلية البطيئة أو مضيفي LAN/tailnet البعيدين، اضبط `models.providers.<id>.timeoutSeconds`. يوسّع هذا التعامل مع طلبات HTTP لنموذج الموفّر، بما في ذلك الاتصال، والترويسات، وبث المتن، وإلغاء الجلب المحروس الإجمالي، من دون زيادة مهلة تشغيل الوكيل كلها. إذا كانت `agents.defaults.timeoutSeconds` أو مهلة خاصة بالتشغيل أقل، فارفع ذلك الحد أيضاً؛ لا يمكن لمهل الموفّر أن تمدّد التشغيل كله.
    - تسمح استدعاءات HTTP لموفّر النموذج بإجابات DNS ذات IP وهمي من Surge وClash وsing-box في `198.18.0.0/15` و`fc00::/7` فقط لاسم مضيف `baseUrl` الخاص بالموفّر المهيأ. تثق نقاط نهاية الموفّر المخصّصة/المحلية أيضاً بأصل `scheme://host:port` المحدد المهيأ بالضبط لطلبات النماذج المحروسة، بما في ذلك local loopback وLAN ومضيفي tailnet. هذا ليس خيار تهيئة جديداً؛ إن `baseUrl` الذي تهيئه يوسّع سياسة الطلبات لذلك الأصل فقط. السماح باسم المضيف ذي IP الوهمي والثقة الدقيقة بالأصل آليتان مستقلتان. لا تزال الوجهات الخاصة الأخرى، وlocal loopback، وlink-local، والبيانات الوصفية، والمنافذ المختلفة تتطلب اشتراكاً صريحاً عبر `models.providers.<id>.request.allowPrivateNetwork: true`. اضبط `models.providers.<id>.request.allowPrivateNetwork: false` لإلغاء الثقة الدقيقة بالأصل.
    - إذا كان `baseUrl` فارغاً/محذوفاً، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يحل إلى `api.openai.com`).
    - للسلامة، لا تزال القيمة الصريحة `compat.supportsDeveloperRole: true` تُستبدل على نقاط نهاية `openai-completions` غير الأصلية.
    - بالنسبة إلى `api: "anthropic-messages"` على نقاط النهاية غير المباشرة (أي موفّر غير `anthropic` القياسي، أو `models.providers.anthropic.baseUrl` مخصّص لا يكون مضيفه نقطة نهاية عامة لـ `api.anthropic.com`)، يكبت OpenClaw ترويسات Anthropic beta الضمنية مثل `claude-code-20250219`، و`interleaved-thinking-2025-05-14`، وعلامات OAuth، حتى لا ترفض الوكلاء المخصّصون المتوافقون مع Anthropic أعلام beta غير المدعومة. اضبط `models.providers.<id>.headers["anthropic-beta"]` صراحةً إذا كان وكيلك يحتاج إلى ميزات beta محددة.

  </Accordion>
</AccordionGroup>

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضاً: [التهيئة](/ar/gateway/configuration) للحصول على أمثلة تهيئة كاملة.

## ذات صلة

- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) - مفاتيح تهيئة النموذج
- [تجاوز فشل النموذج](/ar/concepts/model-failover) - سلاسل الرجوع وسلوك إعادة المحاولة
- [النماذج](/ar/concepts/models) - تهيئة النماذج والأسماء المستعارة
- [الموفّرون](/ar/providers) - أدلة الإعداد لكل موفّر
