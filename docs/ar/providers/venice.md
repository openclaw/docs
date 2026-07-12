---
read_when:
    - تريد استدلالًا يركّز على الخصوصية في OpenClaw
    - تريد إرشادات لإعداد Venice AI
summary: استخدم نماذج Venice AI التي تركز على الخصوصية في OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T06:30:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) توفّر استدلالًا يركّز على الخصوصية: تعمل النماذج المفتوحة
من دون تسجيل، مع وصول عبر وكيل مجهول الهوية إلى Claude وGPT وGemini وGrok.
جميع نقاط النهاية متوافقة مع OpenAI ‏(`/v1`).

## أوضاع الخصوصية

| الوضع           | السلوك                                                         | النماذج                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **خاص**    | لا تُخزَّن المطالبات/الاستجابات ولا تُسجَّل مطلقًا. مؤقتة.         | Llama، وQwen، وDeepSeek، وKimi، وMiniMax، وVenice Uncensored، وغيرها. |
| **مجهول الهوية** | تمر عبر وكيل Venice مع إزالة البيانات الوصفية قبل إعادة توجيهها. | Claude، وGPT، وGemini، وGrok                                     |

<Warning>
النماذج مجهولة الهوية ليست خاصة بالكامل. تزيل Venice البيانات الوصفية قبل إعادة التوجيه، لكن المزوّد الأساسي (OpenAI أو Anthropic أو Google أو xAI) يظل يعالج الطلب. استخدم النماذج الخاصة عندما تكون الخصوصية الكاملة مطلوبة.
</Warning>

## البدء

<Steps>
  <Step title="تثبيت Plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="الحصول على مفتاح API">
    1. سجّل في [venice.ai](https://venice.ai)
    2. انتقل إلى **Settings > API Keys > Create new key**
    3. انسخ مفتاح API الخاص بك (التنسيق: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="إعداد OpenClaw">
    <Tabs>
      <Tab title="تفاعلي (موصى به)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        يطلب مفتاح API (أو يعيد استخدام `VENICE_API_KEY` موجود)، ويسرد نماذج Venice المتاحة، ويضبط نموذجك الافتراضي.
      </Tab>
      <Tab title="متغير البيئة">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="غير تفاعلي">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="التحقق من الإعداد">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## اختيار النموذج

- **الافتراضي**: `venice/kimi-k2-5` (خاص، واستدلال، ورؤية).
- **أقوى خيار مجهول الهوية**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

يمكنك أيضًا تشغيل `openclaw configure` واختيار **مزوّد النموذج/المصادقة > Venice AI**.

<Tip>
| حالة الاستخدام                 | النموذج                             | السبب                                       |
| ------------------------- | ---------------------------------- | ------------------------------------------ |
| الدردشة العامة (الافتراضي)    | `kimi-k2-5`                        | استدلال خاص قوي مع الرؤية       |
| أفضل جودة إجمالية      | `claude-opus-4-6`                  | أقوى خيار مجهول الهوية من Venice         |
| الخصوصية + البرمجة          | `qwen3-coder-480b-a35b-instruct`   | نموذج برمجة خاص بسياق كبير    |
| سريع + منخفض التكلفة              | `qwen3-4b`                         | نموذج استدلال خفيف                |
| المهام الخاصة المعقدة     | `deepseek-v3.2`                    | استدلال قوي؛ استدعاء الأدوات معطّل    |
| غير خاضع للرقابة                | `venice-uncensored`                | بلا قيود على المحتوى                    |
</Tip>

## الكتالوج المضمّن (38 نموذجًا)

<AccordionGroup>
  <Accordion title="النماذج الخاصة (26) — خاصة بالكامل، بلا تسجيل">
    | معرّف النموذج                               | الاسم                                 | السياق | ملاحظات                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | افتراضي، استدلال، رؤية  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | استدلال                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | عام                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | عام                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | عام، الأدوات معطّلة     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | استدلال                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | عام                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | برمجة                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | برمجة                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | استدلال، رؤية           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | عام                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (رؤية)                | 256k    | رؤية                      |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k     | سريع، استدلال              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | استدلال، الأدوات معطّلة    |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k     | غير خاضع للرقابة، الأدوات معطّلة   |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k    | رؤية                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | رؤية                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | عام                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | عام                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | استدلال                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | عام                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | استدلال                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | استدلال                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | استدلال                    |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | استدلال                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | استدلال                    |
  </Accordion>

  <Accordion title="النماذج مجهولة الهوية (12) — عبر وكيل Venice">
    | معرّف النموذج                        | الاسم                           | السياق | ملاحظات                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (عبر Venice)    | 1M      | استدلال، رؤية            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (عبر Venice)  | 1M      | استدلال، رؤية            |
    | `openai-gpt-54`                 | GPT-5.4 (عبر Venice)            | 1M      | استدلال، رؤية            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (عبر Venice)      | 400k    | استدلال، رؤية، برمجة     |
    | `openai-gpt-52`                 | GPT-5.2 (عبر Venice)            | 256k    | استدلال                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (عبر Venice)      | 256k    | استدلال، رؤية، برمجة     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (عبر Venice)             | 128k    | رؤية                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (عبر Venice)        | 128k    | رؤية                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (عبر Venice)     | 1M      | استدلال، رؤية             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (عبر Venice)       | 198k    | استدلال، رؤية             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (عبر Venice)     | 256k    | استدلال، رؤية             |
    | `grok-41-fast`                  | Grok 4.1 Fast (عبر Venice)      | 1M      | استدلال، رؤية             |
  </Accordion>
</AccordionGroup>

تحصل نماذج Venice المدعومة من Grok ‏(`grok-41-fast` وما شابهها) على تصحيح توافق مخطط الأدوات نفسه
المستخدم مع مزوّد xAI الأصلي، لأنها تشترك في تنسيق استدعاء الأدوات نفسه لدى المصدر
الأساسي.

## اكتشاف النماذج

الكتالوج المضمّن أعلاه هو قائمة أولية مدعومة ببيان تعريف. أثناء التشغيل، يحدّثه OpenClaw
من واجهة API ‏`/models` لدى Venice، ويعود إلى القائمة الأولية إذا تعذّر الوصول إلى
واجهة API. نقطة النهاية `/models` عامة (لا تتطلب مصادقة
للسرد)، لكن الاستدلال يتطلب مفتاح API صالحًا.

## سلوك إعادة تشغيل DeepSeek V4

إذا أتاحت Venice نماذج DeepSeek V4 مثل `deepseek-v4-pro` أو
`deepseek-v4-flash`، يملأ OpenClaw حقل إعادة التشغيل المطلوب `reasoning_content`
في رسائل المساعد عندما تحذفه Venice، ويزيل `thinking`/
`reasoning`/`reasoning_effort` من حمولة الطلب (ترفض Venice
عنصر التحكم الأصلي `thinking` الخاص بـDeepSeek في هذه النماذج). إصلاح إعادة التشغيل هذا
منفصل عن عناصر تحكم التفكير الخاصة بمزوّد DeepSeek الأصلي.

## دعم البث والأدوات

| الميزة          | الدعم                                           |
| ---------------- | ------------------------------------------------- |
| البث        | جميع النماذج                                        |
| استدعاء الدوال | معظم النماذج؛ معطّل لكل نموذج حيثما ذُكر أعلاه |
| الرؤية/الصور    | النماذج المعلَّمة بـ«رؤية» أعلاه                      |
| وضع JSON        | عبر `response_format`                             |

## التسعير

تستخدم Venice نظامًا قائمًا على الرصيد. تكلّف النماذج مجهولة الهوية تقريبًا مثل
التسعير المباشر لواجهة API مضافًا إليه رسم صغير من Venice. راجع
[venice.ai/pricing](https://venice.ai/pricing) للاطلاع على الأسعار الحالية.

## أمثلة الاستخدام

```bash
# Default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="مفتاح API غير معروف">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    تأكد من أن المفتاح يبدأ بـ`vapi_`.

  </Accordion>

  <Accordion title="النموذج غير متاح">
    شغّل `openclaw models list --all --provider venice` للاطلاع على النماذج
    المتاحة حاليًا؛ يتغير الكتالوج مع إضافة Venice للنماذج أو إيقافها.
  </Accordion>

  <Accordion title="مشكلات الاتصال">
    توجد واجهة API الخاصة بـVenice على `https://api.venice.ai/api/v1`. تأكد من أن شبكتك تسمح باتصالات HTTPS مع هذا المضيف.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="مثال على ملف الإعدادات">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    الصفحة الرئيسية لـ Venice AI والتسجيل للحصول على حساب.
  </Card>
  <Card title="وثائق API" href="https://docs.venice.ai" icon="book">
    مرجع API الخاص بـ Venice ووثائق المطوّرين.
  </Card>
  <Card title="التسعير" href="https://venice.ai/pricing" icon="credit-card">
    أسعار أرصدة Venice وخططها الحالية.
  </Card>
</CardGroup>
