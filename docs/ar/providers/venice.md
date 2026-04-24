---
read_when:
    - أنت تريد استدلالًا يركز على الخصوصية في OpenClaw
    - أنت تريد إرشادات إعداد Venice AI
summary: استخدم نماذج Venice AI التي تركز على الخصوصية في OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-24T08:01:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab50c76ce33bd67d51bd897ac574e08d4e4e394470bed9fe686758ce39aded91
    source_path: providers/venice.md
    workflow: 15
---

توفر Venice AI **استدلالًا للذكاء الاصطناعي يركز على الخصوصية** مع دعم للنماذج غير المقيدة والوصول إلى النماذج الاحتكارية الكبرى عبر proxy مُجهّل خاص بهم. كل الاستدلال خاص افتراضيًا — لا تدريب على بياناتك، ولا تسجيل.

## لماذا Venice مع OpenClaw

- **استدلال خاص** للنماذج مفتوحة المصدر (من دون تسجيل).
- **نماذج غير مقيدة** عندما تحتاج إليها.
- **وصول مُجهّل** إلى النماذج الاحتكارية (Opus/GPT/Gemini) عندما تكون الجودة مهمة.
- نقاط نهاية `/v1` متوافقة مع OpenAI.

## أوضاع الخصوصية

تقدم Venice مستويين من الخصوصية — وفهم هذا هو المفتاح لاختيار النموذج:

| الوضع           | الوصف                                                                                                                        | النماذج                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | خاص بالكامل. لا يتم **أبدًا** تخزين أو تسجيل المطالبات/الاستجابات. مؤقت.                                                     | Llama، وQwen، وDeepSeek، وKimi، وMiniMax، وVenice Uncensored، إلخ. |
| **Anonymized** | يُمرَّر عبر Venice بعد نزع البيانات الوصفية. يرى المزوّد الأساسي (OpenAI، Anthropic، Google، xAI) طلبات مجهّلة.              | Claude، وGPT، وGemini، وGrok                                  |

<Warning>
النماذج المجهّلة **ليست** خاصة بالكامل. تقوم Venice بنزع البيانات الوصفية قبل التمرير، لكن المزوّد الأساسي (OpenAI، Anthropic، Google، xAI) ما يزال يعالج الطلب. اختر النماذج **Private** عندما تكون الخصوصية الكاملة مطلوبة.
</Warning>

## الميزات

- **تركيز على الخصوصية**: اختر بين وضعي "private" (خاص بالكامل) و"anonymized" (ممرر عبر proxy)
- **نماذج غير مقيدة**: وصول إلى نماذج من دون قيود على المحتوى
- **الوصول إلى النماذج الكبرى**: استخدم Claude وGPT وGemini وGrok عبر proxy المجهّل الخاص بـ Venice
- **واجهة API متوافقة مع OpenAI**: نقاط نهاية `/v1` قياسية لتكامل سهل
- **البث**: مدعوم على جميع النماذج
- **استدعاء الدوال**: مدعوم على نماذج محددة (تحقق من قدرات النموذج)
- **الرؤية**: مدعومة على النماذج التي تمتلك قدرة vision
- **لا توجد حدود معدل صارمة**: قد يُطبّق خنق fair-use عند الاستخدام الشديد

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    1. سجّل في [venice.ai](https://venice.ai)
    2. اذهب إلى **Settings > API Keys > Create new key**
    3. انسخ مفتاح API الخاص بك (التنسيق: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="اضبط OpenClaw">
    اختر طريقة الإعداد المفضلة لديك:

    <Tabs>
      <Tab title="تفاعلي (موصى به)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        سيقوم هذا بما يلي:
        1. يطلب مفتاح API الخاص بك (أو يستخدم `VENICE_API_KEY` الموجود)
        2. يعرض جميع نماذج Venice المتاحة
        3. يتيح لك اختيار النموذج الافتراضي
        4. يضبط المزوّد تلقائيًا
      </Tab>
      <Tab title="متغير بيئة">
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
  <Step title="تحقق من الإعداد">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## اختيار النموذج

بعد الإعداد، يعرض OpenClaw جميع نماذج Venice المتاحة. اختر بناءً على احتياجاتك:

- **النموذج الافتراضي**: `venice/kimi-k2-5` من أجل reasoning خاصة قوية بالإضافة إلى الرؤية.
- **الخيار عالي القدرة**: `venice/claude-opus-4-6` من أجل أقوى مسار Venice مجهّل.
- **الخصوصية**: اختر نماذج "private" للاستدلال الخاص بالكامل.
- **القدرة**: اختر نماذج "anonymized" للوصول إلى Claude وGPT وGemini عبر proxy الخاصة بـ Venice.

غيّر نموذجك الافتراضي في أي وقت:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

اسرد جميع النماذج المتاحة:

```bash
openclaw models list | grep venice
```

يمكنك أيضًا تشغيل `openclaw configure`، واختيار **Model/auth**، ثم اختيار **Venice AI**.

<Tip>
استخدم الجدول أدناه لاختيار النموذج المناسب لحالة استخدامك.

| حالة الاستخدام             | النموذج الموصى به                 | السبب                                        |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **دردشة عامة (افتراضي)**   | `kimi-k2-5`                      | reasoning خاصة قوية بالإضافة إلى الرؤية      |
| **أفضل جودة إجمالية**      | `claude-opus-4-6`                | أقوى خيار Venice مجهّل                       |
| **خصوصية + برمجة**         | `qwen3-coder-480b-a35b-instruct` | نموذج برمجة خاص مع سياق كبير                 |
| **رؤية خاصة**              | `kimi-k2-5`                      | دعم للرؤية من دون مغادرة الوضع الخاص         |
| **سريع + رخيص**            | `qwen3-4b`                       | نموذج reasoning خفيف                         |
| **مهام خاصة معقدة**        | `deepseek-v3.2`                  | reasoning قوية، لكن من دون دعم أدوات Venice |
| **غير مقيد**               | `venice-uncensored`              | بلا قيود على المحتوى                         |

</Tip>

## الكتالوج المضمّن (41 إجمالًا)

<AccordionGroup>
  <Accordion title="النماذج الخاصة (26) — خاصة بالكامل، من دون تسجيل">
    | معرّف النموذج                           | الاسم                                | السياق | الميزات                    |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | افتراضي، reasoning، vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | عام                        |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | عام                        |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | عام، الأدوات معطلة         |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | عام                        |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | برمجة                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | برمجة                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Reasoning، vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | عام                        |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | سريع، reasoning            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Reasoning، الأدوات معطلة   |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | غير مقيد، الأدوات معطلة    |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | عام                        |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | عام                        |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | عام                        |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Reasoning                  |
  </Accordion>

  <Accordion title="النماذج المجهّلة (15) — عبر proxy الخاصة بـ Venice">
    | معرّف النموذج                        | الاسم                           | السياق | الميزات                   |
    | ----------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`                   | Claude Opus 4.6 (via Venice)   | 1M      | Reasoning، vision         |
    | `claude-opus-4-5`                   | Claude Opus 4.5 (via Venice)   | 198k    | Reasoning، vision         |
    | `claude-sonnet-4-6`                 | Claude Sonnet 4.6 (via Venice) | 1M      | Reasoning، vision         |
    | `claude-sonnet-4-5`                 | Claude Sonnet 4.5 (via Venice) | 198k    | Reasoning، vision         |
    | `openai-gpt-54`                     | GPT-5.4 (via Venice)           | 1M      | Reasoning، vision         |
    | `openai-gpt-53-codex`               | GPT-5.3 Codex (via Venice)     | 400k    | Reasoning، vision، برمجة  |
    | `openai-gpt-52`                     | GPT-5.2 (via Venice)           | 256k    | Reasoning                 |
    | `openai-gpt-52-codex`               | GPT-5.2 Codex (via Venice)     | 256k    | Reasoning، vision، برمجة  |
    | `openai-gpt-4o-2024-11-20`          | GPT-4o (via Venice)            | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18`     | GPT-4o Mini (via Venice)       | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`            | Gemini 3.1 Pro (via Venice)    | 1M      | Reasoning، vision         |
    | `gemini-3-pro-preview`              | Gemini 3 Pro (via Venice)      | 198k    | Reasoning، vision         |
    | `gemini-3-flash-preview`            | Gemini 3 Flash (via Venice)    | 256k    | Reasoning، vision         |
    | `grok-41-fast`                      | Grok 4.1 Fast (via Venice)     | 1M      | Reasoning، vision         |
    | `grok-code-fast-1`                  | Grok Code Fast 1 (via Venice)  | 256k    | Reasoning، برمجة          |
  </Accordion>
</AccordionGroup>

## اكتشاف النموذج

يكتشف OpenClaw النماذج تلقائيًا من واجهة Venice API عندما تكون `VENICE_API_KEY` مضبوطة. وإذا كانت واجهة API غير قابلة للوصول، فإنه يعود إلى كتالوج ثابت.

تعد نقطة النهاية `/models` عامة (لا حاجة إلى مصادقة من أجل السرد)، لكن الاستدلال يتطلب مفتاح API صالحًا.

## دعم البث والأدوات

| الميزة               | الدعم                                                |
| -------------------- | ---------------------------------------------------- |
| **البث**             | جميع النماذج                                         |
| **استدعاء الدوال**   | معظم النماذج (تحقق من `supportsFunctionCalling` في API) |
| **الرؤية/الصور**     | النماذج الموسومة بميزة "Vision"                      |
| **وضع JSON**         | مدعوم عبر `response_format`                          |

## التسعير

تستخدم Venice نظامًا قائمًا على الرصيد. راجع [venice.ai/pricing](https://venice.ai/pricing) لمعرفة الأسعار الحالية:

- **النماذج الخاصة**: تكلفة أقل عمومًا
- **النماذج المجهّلة**: مماثلة تقريبًا لتسعير API المباشر + رسوم صغيرة لصالح Venice

### Venice (مجهّلة) مقابل API المباشرة

| الجانب        | Venice (مجهّلة)               | API مباشرة          |
| ------------ | ----------------------------- | ------------------- |
| **الخصوصية** | البيانات الوصفية منزوعة ومجهّلة | حسابك مرتبط         |
| **زمن الاستجابة** | +10-50ms (proxy)              | مباشر               |
| **الميزات**  | معظم الميزات مدعومة            | الميزات الكاملة      |
| **الفوترة**  | أرصدة Venice                   | فوترة المزوّد       |

## أمثلة الاستخدام

```bash
# استخدم النموذج الخاص الافتراضي
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# استخدم Claude Opus عبر Venice (مجهّل)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# استخدم نموذجًا غير مقيّد
openclaw agent --model venice/venice-uncensored --message "Draft options"

# استخدم نموذج رؤية مع صورة
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# استخدم نموذج برمجة
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم التعرف على مفتاح API">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    تأكد من أن المفتاح يبدأ بـ `vapi_`.

  </Accordion>

  <Accordion title="النموذج غير متاح">
    يتم تحديث كتالوج نماذج Venice بشكل ديناميكي. شغّل `openclaw models list` لرؤية النماذج المتاحة حاليًا. قد تكون بعض النماذج غير متصلة مؤقتًا.
  </Accordion>

  <Accordion title="مشكلات الاتصال">
    توجد واجهة Venice API عند `https://api.venice.ai/api/v1`. تأكد من أن شبكتك تسمح باتصالات HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="مثال على ملف الإعداد">
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
    اختيار المزوّدين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    الصفحة الرئيسية لـ Venice AI والتسجيل في الحساب.
  </Card>
  <Card title="وثائق API" href="https://docs.venice.ai" icon="book">
    مرجع Venice API ووثائق المطورين.
  </Card>
  <Card title="التسعير" href="https://venice.ai/pricing" icon="credit-card">
    أسعار أرصدة Venice الحالية والخطط.
  </Card>
</CardGroup>
