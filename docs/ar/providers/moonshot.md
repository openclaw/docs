---
read_when:
    - تريد إعداد Moonshot K2 ‏(Moonshot Open Platform) مقابل Kimi Coding
    - تحتاج إلى فهم نقاط النهاية، والمفاتيح، ومراجع النماذج المنفصلة
    - تريد تكوينًا جاهزًا للنسخ واللصق لأي من المزوّدين
summary: تكوين Moonshot K2 مقابل Kimi Coding ‏(مزوّدون ومفاتيح منفصلة)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-24T08:00:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f9b833110aebc47f9f1f832ade48a2f13b269abd72a7ea2766ffb3af449feb9
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI ‏(Kimi)

يوفر Moonshot واجهة Kimi API مع نقاط نهاية متوافقة مع OpenAI. قم بتكوين
المزوّد واضبط النموذج الافتراضي على `moonshot/kimi-k2.6`، أو استخدم
Kimi Coding مع `kimi/kimi-code`.

<Warning>
Moonshot وKimi Coding هما **مزوّدان منفصلان**. المفاتيح غير قابلة للتبادل، ونقاط النهاية تختلف، كما تختلف مراجع النماذج (`moonshot/...` مقابل `kimi/...`).
</Warning>

## فهرس النماذج المدمج

[//]: # "moonshot-kimi-k2-ids:start"

| مرجع النموذج                    | الاسم                   | Reasoning | الإدخال      | السياق  | الحد الأقصى للإخراج |
| ------------------------------ | ---------------------- | --------- | ------------ | ------- | ------------------- |
| `moonshot/kimi-k2.6`           | Kimi K2.6              | No        | text, image  | 262,144 | 262,144             |
| `moonshot/kimi-k2.5`           | Kimi K2.5              | No        | text, image  | 262,144 | 262,144             |
| `moonshot/kimi-k2-thinking`    | Kimi K2 Thinking       | Yes       | text         | 262,144 | 262,144             |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Yes    | text         | 262,144 | 262,144             |
| `moonshot/kimi-k2-turbo`       | Kimi K2 Turbo          | No        | text         | 256,000 | 16,384              |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات التكلفة المضمّنة الحالية لنماذج K2 المستضافة على Moonshot
الأسعار المنشورة للدفع حسب الاستخدام من Moonshot:
تبلغ تكلفة Kimi K2.6 ‏$0.16/MTok عند إصابة cache،
و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ بينما تبلغ تكلفة Kimi K2.5 ‏$0.10/MTok عند إصابة cache،
و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. أما بقية إدخالات الفهرس القديمة فتبقى
بعناصر تكلفة صفرية نائبة ما لم تتجاوزها في التكوين.

## البدء

اختر المزوّد واتبع خطوات الإعداد.

<Tabs>
  <Tab title="واجهة Moonshot API">
    **الأفضل لـ:** نماذج Kimi K2 عبر Moonshot Open Platform.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة         | نقطة النهاية                   | المنطقة        |
        | --------------------- | ----------------------------- | -------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`  | دولي           |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`  | الصين          |
      </Step>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        أو لنقطة النهاية الصينية:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
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
      <Step title="تحقّق من توفر النماذج">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="شغّل اختبار smoke حي">
        استخدم دليل حالة معزولًا عندما تريد التحقق من الوصول إلى النموذج وتتبع
        التكلفة من دون لمس جلساتك العادية:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        يجب أن يعرض رد JSON ‏`provider: "moonshot"` و
        `model: "kimi-k2.6"`. كما يخزّن إدخال النص التفريغي الخاص بالمساعد
        استخدامًا موحّدًا للرموز المميزة بالإضافة إلى التكلفة المقدَّرة تحت `usage.cost`
        عندما يعيد Moonshot بيانات وصفية للاستخدام.
      </Step>
    </Steps>

    ### مثال على التكوين

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
    **الأفضل لـ:** المهام المتمحورة حول الشيفرة عبر نقطة نهاية Kimi Coding.

    <Note>
    يستخدم Kimi Coding مفتاح API مختلفًا وبادئة مزوّد مختلفة (`kimi/...`) عن Moonshot ‏(`moonshot/...`). ويظل مرجع النموذج القديم `kimi/k2p5` مقبولًا كمعرّف متوافق.
    </Note>

    <Steps>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقّق من توفر النموذج">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### مثال على التكوين

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## البحث على الويب في Kimi

يشحن OpenClaw أيضًا **Kimi** كمزوّد `web_search`، مدعومًا ببحث الويب
في Moonshot.

<Steps>
  <Step title="شغّل إعداد البحث التفاعلي على الويب">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم البحث على الويب لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="كوّن منطقة البحث على الويب والنموذج">
    يطلب الإعداد التفاعلي ما يلي:

    | الإعداد            | الخيارات                                                              |
    | ------------------ | --------------------------------------------------------------------- |
    | منطقة API          | `https://api.moonshot.ai/v1` ‏(دولي) أو `https://api.moonshot.cn/v1` ‏(الصين) |
    | نموذج البحث على الويب | الافتراضي هو `kimi-k2.6`                                            |

  </Step>
</Steps>

يعيش التكوين تحت `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // أو استخدم KIMI_API_KEY / MOONSHOT_API_KEY
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
  <Accordion title="وضع thinking الأصلي">
    يدعم Moonshot Kimi وضع thinking الثنائي الأصلي:

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

    كما يربط OpenClaw مستويات `/think` في Runtime لـ Moonshot:

    | مستوى `/think`       | سلوك Moonshot              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | أي مستوى غير off     | `thinking.type=enabled`    |

    <Warning>
    عند تفعيل Moonshot thinking، يجب أن تكون `tool_choice` مساوية لـ `auto` أو `none`. ويقوم OpenClaw بتطبيع قيم `tool_choice` غير المتوافقة إلى `auto` من أجل التوافق.
    </Warning>

    يقبل Kimi K2.6 أيضًا الحقل الاختياري `thinking.keep` الذي يتحكم في
    الاحتفاظ متعدد الأدوار بـ `reasoning_content`. اضبطه على `"all"` للاحتفاظ
    بالاستدلال الكامل عبر الأدوار؛ أو احذفه (أو اتركه `null`) لاستخدام
    الاستراتيجية الافتراضية للخادم. ولا يمرر OpenClaw `thinking.keep` إلا إلى
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

  <Accordion title="تنقية معرّف استدعاء الأداة">
    يقدّم Moonshot Kimi معرّفات tool_call على شكل `functions.<name>:<index>`. ويحافظ OpenClaw عليها كما هي من دون تغيير حتى تستمر استدعاءات الأدوات متعددة الأدوار في العمل.

    لفرض تنقية صارمة على مزوّد OpenAI-compatible مخصص، اضبط `sanitizeToolCallIds: true`:

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

  <Accordion title="توافق الاستخدام المتدفق">
    تعلن نقاط نهاية Moonshot الأصلية (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) توافقًا مع الاستخدام المتدفق على
    نقل `openai-completions` المشترك. ويعتمد OpenClaw في ذلك على إمكانات
    نقطة النهاية، بحيث ترث معرّفات المزوّدات المخصصة المتوافقة التي تستهدف
    مضيفي Moonshot الأصليين السلوك نفسه للاستخدام المتدفق.

    ومع تسعير K2.6 المضمّن، يتم أيضًا تحويل الاستخدام المتدفق الذي يتضمن رموز
    الإدخال، والإخراج، والقراءة من cache إلى تكلفة محلية تقديرية بالدولار
    من أجل `/status`، و`/usage full`، و`/usage cost`، واحتساب الجلسة
    المعتمد على النص التفريغي.

  </Accordion>

  <Accordion title="مرجع نقاط النهاية ومراجع النماذج">
    | المزوّد        | بادئة مرجع النموذج | نقطة النهاية                   | متغير env للمصادقة |
    | -------------- | ------------------ | ------------------------------ | ------------------ |
    | Moonshot       | `moonshot/`        | `https://api.moonshot.ai/v1`   | `MOONSHOT_API_KEY` |
    | Moonshot CN    | `moonshot/`        | `https://api.moonshot.cn/v1`   | `MOONSHOT_API_KEY` |
    | Kimi Coding    | `kimi/`            | نقطة نهاية Kimi Coding         | `KIMI_API_KEY`     |
    | البحث على الويب | N/A               | نفس منطقة Moonshot API         | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم بحث الويب Kimi المفتاح `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويكون افتراضيًا على `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - تجاوز بيانات التسعير والسياق الوصفية في `models.providers` عند الحاجة.
    - إذا نشرت Moonshot حدود سياق مختلفة لنموذج ما، فاضبط `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
  <Card title="البحث على الويب" href="/ar/tools/web" icon="magnifying-glass">
    تكوين مزوّدي البحث على الويب بما في ذلك Kimi.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التكوين الكامل للمزوّدين، والنماذج، وPlugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفاتيح Moonshot API والتوثيق.
  </Card>
</CardGroup>
