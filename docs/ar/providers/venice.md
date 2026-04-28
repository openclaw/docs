---
read_when:
    - أنت تريد استدلالًا يركز على الخصوصية في OpenClaw
    - أنت تريد إرشادات إعداد Venice AI
summary: استخدم نماذج Venice AI التي تركّز على الخصوصية في OpenClaw
title: Venice AI
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:39:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8396d17485b96262e352449d1524c2b8a8457edcdb92b0d0d6520d1032f8287
    source_path: providers/venice.md
    workflow: 15
---

توفر Venice AI **استدلالًا للذكاء الاصطناعي يركز على الخصوصية** مع دعم النماذج غير المقيّدة وإمكانية الوصول إلى النماذج الاحتكارية الرئيسية عبر proxy مجهول الهوية. كل عمليات الاستدلال خاصة افتراضيًا — فلا تدريب على بياناتك ولا تسجيل.

## لماذا Venice في OpenClaw

- **استدلال خاص** للنماذج مفتوحة المصدر (من دون تسجيل).
- **نماذج غير مقيّدة** عندما تحتاج إليها.
- **وصول مجهول الهوية** إلى النماذج الاحتكارية (Opus/GPT/Gemini) عندما تكون الجودة مهمة.
- نقاط نهاية `/v1` متوافقة مع OpenAI.

## أوضاع الخصوصية

تقدم Venice مستويين من الخصوصية — وفهم هذا أمر أساسي لاختيار النموذج المناسب:

| الوضع           | الوصف                                                                                                                       | النماذج                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **خاص**    | خاص بالكامل. لا يتم **تخزين أو تسجيل** المطالبات/الردود مطلقًا. مؤقت.                                                       | Llama، وQwen، وDeepSeek، وKimi، وMiniMax، وVenice Uncensored، وما إلى ذلك. |
| **مجهول الهوية** | يتم تمريره عبر Venice بعد إزالة البيانات الوصفية. ويرى المزوّد الأساسي (OpenAI، وAnthropic، وGoogle، وxAI) طلبات مجهولة الهوية. | Claude، وGPT، وGemini، وGrok                                     |

<Warning>
النماذج مجهولة الهوية **ليست** خاصة بالكامل. تقوم Venice بإزالة البيانات الوصفية قبل التمرير، لكن المزوّد الأساسي (OpenAI، وAnthropic، وGoogle، وxAI) لا يزال يعالج الطلب. اختر النماذج **الخاصة** عندما تكون الخصوصية الكاملة مطلوبة.
</Warning>

## الميزات

- **تركيز على الخصوصية**: اختر بين وضعي "خاص" (خاص بالكامل) و"مجهول الهوية" (عبر proxy)
- **نماذج غير مقيّدة**: وصول إلى نماذج دون قيود على المحتوى
- **الوصول إلى النماذج الكبرى**: استخدم Claude وGPT وGemini وGrok عبر proxy مجهول الهوية من Venice
- **API متوافقة مع OpenAI**: نقاط نهاية `/v1` قياسية لسهولة الدمج
- **البث**: مدعوم على جميع النماذج
- **استدعاء الدوال**: مدعوم على نماذج مختارة (تحقق من قدرات النموذج)
- **الرؤية**: مدعومة على النماذج التي تملك قدرة الرؤية
- **من دون حدود معدل صارمة**: قد يُطبّق تنظيم للاستخدام العادل عند الاستخدام المفرط

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    1. سجّل في [venice.ai](https://venice.ai)
    2. انتقل إلى **Settings > API Keys > Create new key**
    3. انسخ مفتاح API الخاص بك (بصيغة: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="كوّن OpenClaw">
    اختر طريقة الإعداد المفضلة لديك:

    <Tabs>
      <Tab title="تفاعلي (موصى به)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        سيؤدي هذا إلى:
        1. طلب مفتاح API الخاص بك (أو استخدام `VENICE_API_KEY` الموجود)
        2. عرض جميع نماذج Venice المتاحة
        3. السماح لك باختيار النموذج الافتراضي
        4. تكوين المزوّد تلقائيًا
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
    openclaw agent --model venice/kimi-k2-5 --message "مرحبًا، هل تعمل؟"
    ```
  </Step>
</Steps>

## اختيار النموذج

بعد الإعداد، يعرض OpenClaw جميع نماذج Venice المتاحة. اختر بناءً على احتياجاتك:

- **النموذج الافتراضي**: `venice/kimi-k2-5` لتفكير خاص قوي بالإضافة إلى الرؤية.
- **خيار عالي الإمكانات**: `venice/claude-opus-4-6` لأقوى مسار مجهول الهوية عبر Venice.
- **الخصوصية**: اختر النماذج "الخاصة" للحصول على استدلال خاص بالكامل.
- **القدرة**: اختر النماذج "مجهولة الهوية" للوصول إلى Claude وGPT وGemini عبر proxy الخاص بـ Venice.

غيّر النموذج الافتراضي في أي وقت:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

اعرض كل النماذج المتاحة:

```bash
openclaw models list | grep venice
```

يمكنك أيضًا تشغيل `openclaw configure`، ثم تحديد **Model/auth**، ثم اختيار **Venice AI**.

<Tip>
استخدم الجدول أدناه لاختيار النموذج المناسب لحالة الاستخدام الخاصة بك.

| حالة الاستخدام                   | النموذج الموصى به                | السبب                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **الدردشة العامة (الافتراضي)** | `kimi-k2-5`                      | تفكير خاص قوي بالإضافة إلى الرؤية         |
| **أفضل جودة إجمالية**   | `claude-opus-4-6`                | أقوى خيار مجهول الهوية عبر Venice           |
| **الخصوصية + البرمجة**       | `qwen3-coder-480b-a35b-instruct` | نموذج برمجة خاص مع سياق كبير      |
| **رؤية خاصة**         | `kimi-k2-5`                      | دعم الرؤية دون مغادرة الوضع الخاص  |
| **سريع + منخفض التكلفة**           | `qwen3-4b`                       | نموذج تفكير خفيف                  |
| **مهام خاصة معقدة**  | `deepseek-v3.2`                  | تفكير قوي، لكن من دون دعم أدوات Venice |
| **غير مقيّد**             | `venice-uncensored`              | من دون قيود على المحتوى                      |

</Tip>

## سلوك إعادة تشغيل DeepSeek V4

إذا كانت Venice تعرض نماذج DeepSeek V4 مثل `venice/deepseek-v4-pro` أو
`venice/deepseek-v4-flash`، فإن OpenClaw يملأ العنصر النائب المطلوب
`reasoning_content` الخاص بـ DeepSeek V4 في أدوار assistant tool-call عند
حذف proxy له. وترفض Venice عنصر التحكم الأصلي `thinking` ذي المستوى الأعلى في DeepSeek،
لذلك يحتفظ OpenClaw بهذا الإصلاح الخاص بإعادة التشغيل والمملوك للمزوّد بشكل منفصل
عن عناصر التحكم الخاصة بالتفكير في مزوّد DeepSeek الأصلي.

## الكتالوج المضمن (41 إجمالًا)

<AccordionGroup>
  <Accordion title="النماذج الخاصة (26) — خاصة بالكامل، من دون تسجيل">
    | معرّف النموذج                               | الاسم                                | السياق | الميزات                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | الافتراضي، التفكير، الرؤية |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | التفكير                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | عام                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | عام                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | عام، الأدوات معطلة    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | التفكير                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | عام                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | البرمجة                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | البرمجة                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | التفكير، الرؤية          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | عام                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | الرؤية                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | سريع، التفكير            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | التفكير، الأدوات معطلة  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k    | غير مقيّد، الأدوات معطلة |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | الرؤية                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | الرؤية                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | عام                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | عام                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | التفكير                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | عام                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | التفكير                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | التفكير                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | التفكير                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | التفكير                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | التفكير                  |
  </Accordion>

  <Accordion title="النماذج مجهولة الهوية (15) — عبر proxy الخاص بـ Venice">
    | معرّف النموذج                        | الاسم                           | السياق | الميزات                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (عبر Venice)   | 1M      | التفكير، الرؤية         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (عبر Venice)   | 198k    | التفكير، الرؤية         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (عبر Venice) | 1M      | التفكير، الرؤية         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (عبر Venice) | 198k    | التفكير، الرؤية         |
    | `openai-gpt-54`                 | GPT-5.4 (عبر Venice)           | 1M      | التفكير، الرؤية         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (عبر Venice)     | 400k    | التفكير، الرؤية، البرمجة |
    | `openai-gpt-52`                 | GPT-5.2 (عبر Venice)           | 256k    | التفكير                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (عبر Venice)     | 256k    | التفكير، الرؤية، البرمجة |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (عبر Venice)            | 128k    | الرؤية                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (عبر Venice)       | 128k    | الرؤية                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (عبر Venice)    | 1M      | التفكير، الرؤية         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (عبر Venice)      | 198k    | التفكير، الرؤية         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (عبر Venice)    | 256k    | التفكير، الرؤية         |
    | `grok-41-fast`                  | Grok 4.1 Fast (عبر Venice)     | 1M      | التفكير، الرؤية         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (عبر Venice)  | 256k    | التفكير، البرمجة         |
  </Accordion>
</AccordionGroup>

## اكتشاف النموذج

يكتشف OpenClaw النماذج تلقائيًا من Venice API عندما يكون `VENICE_API_KEY` مضبوطًا. وإذا كانت API غير قابلة للوصول، فإنه يعود إلى كتالوج ثابت.

تكون نقطة النهاية `/models` عامة (ولا تحتاج إلى مصادقة لعرض القائمة)، لكن الاستدلال يتطلب مفتاح API صالحًا.

## البث ودعم الأدوات

| الميزة              | الدعم                                              |
| -------------------- | ---------------------------------------------------- |
| **البث**        | جميع النماذج                                           |
| **استدعاء الدوال** | معظم النماذج (تحقق من `supportsFunctionCalling` في API) |
| **الرؤية/الصور**    | النماذج المعلّمة بميزة "Vision"                  |
| **وضع JSON**        | مدعوم عبر `response_format`                      |

## التسعير

تستخدم Venice نظامًا قائمًا على الأرصدة. راجع [venice.ai/pricing](https://venice.ai/pricing) لمعرفة الأسعار الحالية:

- **النماذج الخاصة**: تكلفتها أقل عمومًا
- **النماذج مجهولة الهوية**: مشابهة لتسعير API المباشر + رسوم صغيرة لـ Venice

### Venice ‏(مجهول الهوية) مقابل API المباشر

| الجانب       | Venice ‏(مجهول الهوية)           | API المباشر          |
| ------------ | ----------------------------- | ------------------- |
| **الخصوصية**  | إزالة البيانات الوصفية، وإخفاء الهوية | حسابك مرتبط |
| **الكمون**  | ‏+10-50ms ‏(proxy)              | مباشر              |
| **الميزات** | معظم الميزات مدعومة       | الميزات الكاملة       |
| **الفوترة**  | أرصدة Venice                | فوترة المزوّد    |

## أمثلة على الاستخدام

```bash
# استخدم النموذج الخاص الافتراضي
openclaw agent --model venice/kimi-k2-5 --message "فحص سريع للحالة"

# استخدم Claude Opus عبر Venice (مجهول الهوية)
openclaw agent --model venice/claude-opus-4-6 --message "لخّص هذه المهمة"

# استخدم نموذجًا غير مقيّد
openclaw agent --model venice/venice-uncensored --message "صغ خيارات"

# استخدم نموذج رؤية مع صورة
openclaw agent --model venice/qwen3-vl-235b-a22b --message "راجع الصورة المرفقة"

# استخدم نموذج برمجة
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "أعد هيكلة هذه الدالة"
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
    يتم تحديث كتالوج نماذج Venice ديناميكيًا. شغّل `openclaw models list` لرؤية النماذج المتاحة حاليًا. وقد تكون بعض النماذج غير متصلة مؤقتًا.
  </Accordion>

  <Accordion title="مشكلات الاتصال">
    توجد Venice API على `https://api.venice.ai/api/v1`. تأكد من أن شبكتك تسمح باتصالات HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
لمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="مثال على ملف التكوين">
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
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    الصفحة الرئيسية لـ Venice AI والتسجيل للحصول على حساب.
  </Card>
  <Card title="وثائق API" href="https://docs.venice.ai" icon="book">
    مرجع Venice API ووثائق المطورين.
  </Card>
  <Card title="التسعير" href="https://venice.ai/pricing" icon="credit-card">
    أسعار الأرصدة والخطط الحالية في Venice.
  </Card>
</CardGroup>
