---
read_when:
    - تريد إعداد Moonshot K2 (Moonshot Open Platform) مقابل Kimi Coding
    - يلزمك فهم نقاط النهاية والمفاتيح ومراجع النماذج كلٌّ على حدة
    - تريد تهيئة قابلة للنسخ/اللصق لأيٍّ من المزوّدين
summary: إعداد Moonshot K2 مقابل Kimi Coding (موفّرو خدمة ومفاتيح منفصلة)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

توفر Moonshot واجهة Kimi API بنقاط نهاية متوافقة مع OpenAI. كوّن
المزوّد واضبط النموذج الافتراضي على `moonshot/kimi-k2.6`، أو استخدم
Kimi Coding مع `kimi/kimi-for-coding`.

<Warning>
Moonshot وKimi Coding هما **مزوّدان منفصلان**. المفاتيح غير قابلة للتبادل، ونقاط النهاية مختلفة، ومراجع النماذج مختلفة (`moonshot/...` مقابل `kimi/...`).
</Warning>

## كتالوج النماذج المضمّن

[//]: # "moonshot-kimi-k2-ids:start"

| مرجع النموذج                     | الاسم                  | الاستدلال | الإدخال    | السياق  | أقصى إخراج |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | لا        | نص، صورة   | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | لا        | نص، صورة   | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | نعم       | نص         | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | نعم       | نص         | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | لا        | نص         | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات التكلفة المضمّنة لنماذج K2 الحالية المستضافة لدى Moonshot
أسعار الدفع حسب الاستخدام المنشورة من Moonshot: يبلغ سعر Kimi K2.6 مقدار $0.16/MTok عند إصابة ذاكرة التخزين المؤقت،
و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ ويبلغ سعر Kimi K2.5 مقدار $0.10/MTok عند إصابة ذاكرة التخزين المؤقت،
و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. تحتفظ إدخالات الكتالوج القديمة الأخرى
بعناصر تكلفة صفرية نائبة ما لم تتجاوزها في الإعدادات.

## بدء الاستخدام

اختر المزوّد واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Moonshot API">
    **الأفضل لـ:** نماذج Kimi K2 عبر Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | خيار المصادقة          | نقطة النهاية                  | المنطقة       |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | دولية         |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | الصين         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        أو لنقطة نهاية الصين:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        استخدم دليل حالة معزولًا عندما تريد التحقق من الوصول إلى النموذج وتتبع
        التكلفة دون لمس جلساتك العادية:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        يجب أن يبلّغ رد JSON عن `provider: "moonshot"` و
        `model: "kimi-k2.6"`. يخزّن إدخال سجل المساعد استخدام
        الرموز الموحّد بالإضافة إلى التكلفة المقدّرة ضمن `usage.cost` عندما تعيد Moonshot
        بيانات استخدام وصفية.
      </Step>
    </Steps>

    ### مثال على الإعدادات

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **الأفضل لـ:** المهام المركّزة على الشيفرة عبر نقطة نهاية Kimi Coding.

    <Note>
    يستخدم Kimi Coding مفتاح API وبادئة مزوّد مختلفين (`kimi/...`) عن Moonshot (`moonshot/...`). مرجع نموذج API المستقر هو `kimi/kimi-for-coding`؛ وتظل المراجع القديمة `kimi/kimi-code` و`kimi/k2p5` مقبولة وتُوحّد إلى معرّف نموذج API هذا.
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### مثال على الإعدادات

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## بحث Kimi على الويب

يشحن OpenClaw أيضًا **Kimi** بوصفه مزوّد `web_search`، مدعومًا ببحث الويب من Moonshot.

<Steps>
  <Step title="شغّل إعداد بحث الويب التفاعلي">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم بحث الويب لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="كوّن منطقة بحث الويب والنموذج">
    يطلب الإعداد التفاعلي ما يلي:

    | الإعداد             | الخيارات                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | منطقة API          | `https://api.moonshot.ai/v1` (دولي) أو `https://api.moonshot.cn/v1` (الصين) |
    | نموذج بحث الويب    | يكون افتراضيًا `kimi-k2.6`                                             |

  </Step>
</Steps>

يوجد التكوين تحت `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="وضع التفكير الأصلي">
    يدعم Moonshot Kimi التفكير الأصلي الثنائي:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    كوّنه لكل نموذج عبر `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    يعيّن OpenClaw أيضًا مستويات `/think` وقت التشغيل لـ Moonshot:

    | مستوى `/think`       | سلوك Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | أي مستوى غير off    | `thinking.type=enabled`    |

    <Warning>
    عند تمكين التفكير في Moonshot، يجب أن يكون `tool_choice` هو `auto` أو `none`. يطبّع OpenClaw قيم `tool_choice` غير المتوافقة إلى `auto` من أجل التوافق.
    </Warning>

    يقبل Kimi K2.6 أيضًا حقل `thinking.keep` اختياريًا يتحكم في
    الاحتفاظ متعدد الأدوار بـ `reasoning_content`. اضبطه على `"all"` للاحتفاظ
    بالاستدلال الكامل عبر الأدوار؛ احذفه (أو اتركه `null`) لاستخدام استراتيجية
    الخادم الافتراضية. يمرّر OpenClaw فقط `thinking.keep` لـ
    `moonshot/kimi-k2.6` ويزيله من النماذج الأخرى.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تنقية معرّفات استدعاء الأدوات">
    يقدّم Moonshot Kimi معرّفات tool_call بالشكل `functions.<name>:<index>`. يحافظ OpenClaw عليها دون تغيير لكي تستمر استدعاءات الأدوات متعددة الأدوار في العمل.

    لفرض تنقية صارمة على مزوّد مخصص متوافق مع OpenAI، اضبط `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Moonshot الأصلية (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) عن توافق استخدام البث على
    نقل `openai-completions` المشترك. يعتمد OpenClaw في ذلك على
    إمكانات نقطة النهاية، لذا ترث معرّفات المزوّدين المخصصة المتوافقة التي تستهدف مضيفي
    Moonshot الأصليين أنفسهم سلوك استخدام البث نفسه.

    مع تسعير K2.6 المضمّن، يُحوَّل الاستخدام المتدفق الذي يتضمن رموز الإدخال والإخراج
    ورموز قراءة ذاكرة التخزين المؤقت أيضًا إلى تكلفة محلية تقديرية بالدولار الأمريكي من أجل
    `/status` و`/usage full` و`/usage cost` ومحاسبة الجلسات المدعومة بالنصوص المسجلة.

  </Accordion>

  <Accordion title="مرجع نقطة النهاية ومرجع النموذج">
    | المزوّد   | بادئة مرجع النموذج | نقطة النهاية                      | متغيّر بيئة المصادقة        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | نقطة نهاية Kimi Coding          | `KIMI_API_KEY`      |
    | بحث الويب | غير منطبق              | مثل منطقة Moonshot API نفسها   | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم بحث الويب في Kimi `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويستخدم افتراضيًا `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - تجاوز بيانات التسعير وبيانات تعريف السياق في `models.providers` إذا لزم الأمر.
    - إذا نشرت Moonshot حدود سياق مختلفة لنموذج ما، فاضبط `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="بحث الويب" href="/ar/tools/web" icon="magnifying-glass">
    تكوين مزوّدي بحث الويب، بما في ذلك Kimi.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التكوين الكامل للمزوّدين والنماذج والـ plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفتاح Moonshot API ووثائقه.
  </Card>
</CardGroup>
