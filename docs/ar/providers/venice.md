---
read_when:
    - تريد استدلالًا يركز على الخصوصية في OpenClaw
    - تريد إرشادات إعداد Venice AI
summary: استخدام نماذج Venice AI التي تركز على الخصوصية في OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-05-02T07:41:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9b3486dd319661ba27f952e1353fed4364064c2cfb1e5744c018ddbac9dae82
    source_path: providers/venice.md
    workflow: 16
---

توفّر Venice AI **استدلال ذكاء اصطناعي يركز على الخصوصية** مع دعم للنماذج غير الخاضعة للرقابة والوصول إلى النماذج الاحتكارية الكبرى عبر وكيلها المجهول الهوية. يكون كل الاستدلال خاصا افتراضيا — لا تدريب على بياناتك، ولا تسجيل.

## لماذا Venice في OpenClaw

- **استدلال خاص** للنماذج مفتوحة المصدر (بلا تسجيل).
- **نماذج غير خاضعة للرقابة** عند الحاجة إليها.
- **وصول مجهول الهوية** إلى النماذج الاحتكارية (Opus/GPT/Gemini) عندما تكون الجودة مهمة.
- نقاط نهاية `/v1` متوافقة مع OpenAI.

## أوضاع الخصوصية

تقدم Venice مستويين من الخصوصية — فهم ذلك أساسي لاختيار نموذجك:

| الوضع              | الوصف                                                                                                                       | النماذج                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **خاص**        | خاص بالكامل. لا يتم **تخزين المطالبات/الاستجابات أو تسجيلها مطلقا**. مؤقت.                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, إلخ. |
| **مجهول الهوية** | يمر عبر Venice مع إزالة البيانات الوصفية. يرى المزود الأساسي (OpenAI, Anthropic, Google, xAI) طلبات مجهولة الهوية. | Claude, GPT, Gemini, Grok                                     |

<Warning>
النماذج مجهولة الهوية **ليست** خاصة بالكامل. تزيل Venice البيانات الوصفية قبل إعادة التوجيه، لكن المزود الأساسي (OpenAI, Anthropic, Google, xAI) لا يزال يعالج الطلب. اختر النماذج **الخاصة** عندما تكون الخصوصية الكاملة مطلوبة.
</Warning>

## الميزات

- **يركز على الخصوصية**: اختر بين وضع "خاص" (خاص بالكامل) ووضع "مجهول الهوية" (عبر وكيل)
- **نماذج غير خاضعة للرقابة**: الوصول إلى نماذج بلا قيود على المحتوى
- **الوصول إلى النماذج الكبرى**: استخدم Claude وGPT وGemini وGrok عبر وكيل Venice المجهول الهوية
- **واجهة API متوافقة مع OpenAI**: نقاط نهاية `/v1` قياسية لتكامل سهل
- **البث**: مدعوم على جميع النماذج
- **استدعاء الدوال**: مدعوم على نماذج محددة (تحقق من قدرات النموذج)
- **الرؤية**: مدعومة على النماذج ذات قدرة الرؤية
- **لا حدود معدلات صارمة**: قد ينطبق تقييد الاستخدام العادل عند الاستخدام المفرط

## البدء

<Steps>
  <Step title="Get your API key">
    1. سجّل في [venice.ai](https://venice.ai)
    2. انتقل إلى **Settings > API Keys > Create new key**
    3. انسخ مفتاح API الخاص بك (الصيغة: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure OpenClaw">
    اختر طريقة الإعداد المفضلة لديك:

    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        سيؤدي ذلك إلى:
        1. طلب مفتاح API الخاص بك (أو استخدام `VENICE_API_KEY` الموجود)
        2. عرض جميع نماذج Venice المتاحة
        3. السماح لك باختيار نموذجك الافتراضي
        4. تهيئة المزود تلقائيا
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## اختيار النموذج

بعد الإعداد، يعرض OpenClaw جميع نماذج Venice المتاحة. اختر بناء على احتياجاتك:

- **النموذج الافتراضي**: `venice/kimi-k2-5` للاستدلال الخاص القوي مع الرؤية.
- **خيار عالي القدرة**: `venice/claude-opus-4-6` لأقوى مسار مجهول الهوية من Venice.
- **الخصوصية**: اختر النماذج "الخاصة" للاستدلال الخاص بالكامل.
- **القدرة**: اختر النماذج "مجهولة الهوية" للوصول إلى Claude وGPT وGemini عبر وكيل Venice.

غيّر نموذجك الافتراضي في أي وقت:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

اسرد جميع النماذج المتاحة:

```bash
openclaw models list --all --provider venice
```

يمكنك أيضا تشغيل `openclaw configure`، وتحديد **Model/auth**، واختيار **Venice AI**.

<Tip>
استخدم الجدول أدناه لاختيار النموذج المناسب لحالة استخدامك.

| حالة الاستخدام             | النموذج الموصى به                  | السبب                                        |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **دردشة عامة (افتراضي)** | `kimi-k2-5`                      | استدلال خاص قوي مع الرؤية         |
| **أفضل جودة إجمالية**   | `claude-opus-4-6`                | أقوى خيار Venice مجهول الهوية           |
| **الخصوصية + البرمجة**       | `qwen3-coder-480b-a35b-instruct` | نموذج برمجة خاص بسياق كبير      |
| **رؤية خاصة**         | `kimi-k2-5`                      | دعم الرؤية دون مغادرة الوضع الخاص  |
| **سريع + رخيص**           | `qwen3-4b`                       | نموذج استدلال خفيف                  |
| **مهام خاصة معقدة**  | `deepseek-v3.2`                  | استدلال قوي، لكن بلا دعم لأدوات Venice |
| **غير خاضع للرقابة**             | `venice-uncensored`              | بلا قيود على المحتوى                      |

</Tip>

## سلوك إعادة عرض DeepSeek V4

إذا كشفت Venice عن نماذج DeepSeek V4 مثل `venice/deepseek-v4-pro` أو
`venice/deepseek-v4-flash`، يملأ OpenClaw العنصر النائب المطلوب لإعادة عرض
`reasoning_content` في رسائل المساعد عندما يحذفه الوكيل. ترفض Venice عنصر تحكم
`thinking` الأصلي ذي المستوى الأعلى في DeepSeek، لذلك يبقي OpenClaw هذا الإصلاح
الخاص بالمزود لإعادة العرض منفصلا عن عناصر تحكم التفكير في مزود DeepSeek الأصلي.

## الكتالوج المدمج (41 إجمالا)

<AccordionGroup>
  <Accordion title="Private models (26) — fully private, no logging">
    | معرّف النموذج                          | الاسم                                | السياق | الميزات                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | افتراضي، استدلال، رؤية |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | استدلال                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | عام                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | عام                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | عام، الأدوات معطلة    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | استدلال                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | عام                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | برمجة                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | برمجة                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | استدلال، رؤية          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | عام                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | رؤية                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | سريع، استدلال            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | استدلال، الأدوات معطلة  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | غير خاضع للرقابة، الأدوات معطلة |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | رؤية                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | رؤية                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | عام                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | عام                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | استدلال                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | عام                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | استدلال                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | استدلال                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | استدلال                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | استدلال                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | استدلال                  |
  </Accordion>

  <Accordion title="Anonymized models (15) — via Venice proxy">
    | معرّف النموذج                   | الاسم                          | السياق | الميزات                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (عبر Venice)   | 1M      | استدلال، رؤية         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (عبر Venice)   | 198k    | استدلال، رؤية         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (عبر Venice) | 1M      | استدلال، رؤية         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (عبر Venice) | 198k    | استدلال، رؤية         |
    | `openai-gpt-54`                 | GPT-5.4 (عبر Venice)           | 1M      | استدلال، رؤية         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (عبر Venice)     | 400k    | استدلال، رؤية، برمجة |
    | `openai-gpt-52`                 | GPT-5.2 (عبر Venice)           | 256k    | استدلال                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (عبر Venice)     | 256k    | استدلال، رؤية، برمجة |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (عبر Venice)            | 128k    | رؤية                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (عبر Venice)       | 128k    | رؤية                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (عبر Venice)    | 1M      | استدلال، رؤية         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (عبر Venice)      | 198k    | استدلال، رؤية         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (عبر Venice)    | 256k    | استدلال، رؤية         |
    | `grok-41-fast`                  | Grok 4.1 Fast (عبر Venice)     | 1M      | استدلال، رؤية         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (عبر Venice)  | 256k    | استدلال، برمجة         |
  </Accordion>
</AccordionGroup>

## اكتشاف النماذج

يشحن OpenClaw كتالوجا أوليا لنماذج Venice مدعوما بملف manifest لعرض النماذج للقراءة فقط. لا يزال بإمكان التحديث وقت التشغيل اكتشاف النماذج من واجهة API الخاصة بـ Venice، ويعود إلى كتالوج manifest إذا تعذر الوصول إلى واجهة API.

نقطة النهاية `/models` عامة (لا حاجة إلى مصادقة للعرض)، لكن الاستدلال يتطلب مفتاح API صالحا.

## البث ودعم الأدوات

| الميزة              | الدعم                                              |
| -------------------- | ---------------------------------------------------- |
| **البث المتدفق**        | جميع النماذج                                           |
| **استدعاء الدوال** | معظم النماذج (تحقق من `supportsFunctionCalling` في API) |
| **الرؤية/الصور**    | النماذج المعلّمة بميزة "الرؤية"                  |
| **وضع JSON**        | مدعوم عبر `response_format`                      |

## التسعير

تستخدم Venice نظامًا قائمًا على الأرصدة. راجع [venice.ai/pricing](https://venice.ai/pricing) لمعرفة الأسعار الحالية:

- **النماذج الخاصة**: أقل تكلفة عمومًا
- **النماذج مجهولة الهوية**: مشابهة لتسعير API المباشر + رسوم Venice صغيرة

### Venice (مجهول الهوية) مقابل API المباشر

| الجانب       | Venice (مجهول الهوية)           | API مباشر          |
| ------------ | ----------------------------- | ------------------- |
| **الخصوصية**  | إزالة البيانات الوصفية، مجهول الهوية | حسابك مرتبط |
| **زمن الاستجابة**  | +10-50ms (وكيل)              | مباشر              |
| **الميزات** | معظم الميزات مدعومة       | الميزات كاملة       |
| **الفوترة**  | أرصدة Venice                | فوترة المزوّد    |

## أمثلة الاستخدام

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="مفتاح API غير معروف">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    تأكد من أن المفتاح يبدأ بـ `vapi_`.

  </Accordion>

  <Accordion title="النموذج غير متاح">
    يتحدث كتالوج نماذج Venice ديناميكيًا. شغّل `openclaw models list` لرؤية النماذج المتاحة حاليًا. قد تكون بعض النماذج غير متصلة مؤقتًا.
  </Accordion>

  <Accordion title="مشكلات الاتصال">
    يقع Venice API على `https://api.venice.ai/api/v1`. تأكد من أن شبكتك تسمح باتصالات HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="مثال ملف التكوين">
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
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    الصفحة الرئيسية لـ Venice AI وتسجيل الحساب.
  </Card>
  <Card title="وثائق API" href="https://docs.venice.ai" icon="book">
    مرجع Venice API ووثائق المطوّرين.
  </Card>
  <Card title="التسعير" href="https://venice.ai/pricing" icon="credit-card">
    أسعار وخطط أرصدة Venice الحالية.
  </Card>
</CardGroup>
