---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج سحابية أو محلية عبر Ollama.
    - تحتاج إلى إرشادات لإعداد Ollama وتهيئته.
summary: شغّل OpenClaw مع Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-04-15T14:40:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 098e083e0fc484bddb5270eb630c55d7832039b462d1710372b6afece5cefcdf
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

يتكامل OpenClaw مع واجهة Ollama الأصلية (`/api/chat`) للنماذج السحابية المستضافة وخوادم Ollama المحلية/المستضافة ذاتيًا. يمكنك استخدام Ollama بثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama يمكن الوصول إليه، أو `Cloud only` مقابل `https://ollama.com`، أو `Local only` مقابل مضيف Ollama يمكن الوصول إليه.

<Warning>
**لمستخدمي Ollama عن بُعد**: لا تستخدم عنوان URL المتوافق مع OpenAI عند `/v1` (`http://host:11434/v1`) مع OpenClaw. فهذا يعطّل استدعاء الأدوات وقد تُخرج النماذج JSON خامًا للأدوات كنص عادي. استخدم بدلًا من ذلك عنوان URL لواجهة Ollama الأصلية: `baseUrl: "http://host:11434"` (من دون `/v1`).
</Warning>

## البدء

اختر طريقة الإعداد والوضع المفضلين لديك.

<Tabs>
  <Tab title="الإعداد التوجيهي (موصى به)">
    **الأفضل لـ:** أسرع مسار إلى إعداد Ollama سحابي أو محلي يعمل.

    <Steps>
      <Step title="شغّل الإعداد التوجيهي">
        ```bash
        openclaw onboard
        ```

        اختر **Ollama** من قائمة المزوّدين.
      </Step>
      <Step title="اختر وضعك">
        - **Cloud + Local** — مضيف Ollama محلي بالإضافة إلى نماذج سحابية تُوجَّه عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama المستضافة عبر `https://ollama.com`
        - **Local only** — النماذج المحلية فقط
      </Step>
      <Step title="اختر نموذجًا">
        يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويقترح إعدادات افتراضية مستضافة للسحابة. أما `Cloud + Local` و`Local only` فيطلبان عنوان URL الأساسي لـ Ollama، ويكتشفان النماذج المتاحة، ويجريان سحبًا تلقائيًا للنموذج المحلي المحدد إذا لم يكن متاحًا بعد. كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا قد سجّل الدخول للوصول السحابي.
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### الوضع غير التفاعلي

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    ويمكنك اختياريًا تحديد عنوان URL أساسي أو نموذج مخصص:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="الإعداد اليدوي">
    **الأفضل لـ:** تحكم كامل في الإعداد السحابي أو المحلي.

    <Steps>
      <Step title="اختر السحابي أو المحلي">
        - **Cloud + Local**: ثبّت Ollama، وسجّل الدخول باستخدام `ollama signin`، ووجّه الطلبات السحابية عبر ذلك المضيف
        - **Cloud only**: استخدم `https://ollama.com` مع `OLLAMA_API_KEY`
        - **Local only**: ثبّت Ollama من [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="اسحب نموذجًا محليًا (محلي فقط)">
        ```bash
        ollama pull gemma4
        # أو
        ollama pull gpt-oss:20b
        # أو
        ollama pull llama3.3
        ```
      </Step>
      <Step title="فعّل Ollama في OpenClaw">
        بالنسبة إلى `Cloud only`، استخدم قيمة `OLLAMA_API_KEY` الحقيقية لديك. أما في الإعدادات المعتمدة على مضيف، فأي قيمة بديلة تعمل:

        ```bash
        # السحابة
        export OLLAMA_API_KEY="your-ollama-api-key"

        # محلي فقط
        export OLLAMA_API_KEY="ollama-local"

        # أو اضبطه في ملف الإعدادات
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="افحص نموذجك واضبطه">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        أو اضبط الإعداد الافتراضي في التهيئة:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## النماذج السحابية

<Tabs>
  <Tab title="Cloud + Local">
    يستخدم `Cloud + Local` مضيف Ollama يمكن الوصول إليه كنقطة تحكم لكلٍّ من النماذج المحلية والسحابية. وهذا هو التدفق الهجين المفضل لدى Ollama.

    استخدم **Cloud + Local** أثناء الإعداد. يطلب OpenClaw عنوان URL الأساسي لـ Ollama، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف قد سجّل الدخول للوصول السحابي باستخدام `ollama signin`. وعندما يكون المضيف قد سجّل الدخول، يقترح OpenClaw أيضًا إعدادات افتراضية مستضافة للسحابة مثل `kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud`.

    إذا لم يكن المضيف قد سجّل الدخول بعد، فسيُبقي OpenClaw الإعداد محليًا فقط إلى أن تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` مقابل واجهة Ollama المستضافة على `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. يطلب OpenClaw قيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويملأ قائمة النماذج السحابية المستضافة. هذا المسار **لا** يتطلب خادم Ollama محليًا أو `ollama signin`.

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من مثيل Ollama المهيأ. هذا المسار مخصّص لخوادم Ollama المحلية أو المستضافة ذاتيًا.

    يقترح OpenClaw حاليًا `gemma4` باعتباره الإعداد المحلي الافتراضي.

  </Tab>
</Tabs>

## اكتشاف النماذج (المزوّد الضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف تعريف للمصادقة) و**لا** تعرّف `models.providers.ollama`، يكتشف OpenClaw النماذج من مثيل Ollama المحلي على `http://127.0.0.1:11434`.

| السلوك               | التفاصيل                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الفهرس       | يستعلم `/api/tags`                                                                                                                                                 |
| اكتشاف الإمكانات     | يستخدم عمليات بحث `/api/show` بأفضل جهد لقراءة `contextWindow` واكتشاف الإمكانات (بما في ذلك الرؤية)                                                             |
| نماذج الرؤية         | النماذج التي تُبلّغ عن إمكانية `vision` عبر `/api/show` تُعلَّم على أنها قادرة على التعامل مع الصور (`input: ["text", "image"]`) بحيث يحقن OpenClaw الصور تلقائيًا في المطالبة |
| اكتشاف الاستدلال     | يعلّم `reasoning` باستخدام أسلوب استدلالي يعتمد على اسم النموذج (`r1` و`reasoning` و`think`)                                                                       |
| حدود الرموز          | يضبط `maxTokens` إلى الحد الأقصى الافتراضي للرموز الذي يستخدمه OpenClaw مع Ollama                                                                                 |
| التكاليف             | يضبط جميع التكاليف إلى `0`                                                                                                                                         |

يساعد هذا على تجنّب إدخالات النماذج اليدوية مع إبقاء الفهرس متوافقًا مع مثيل Ollama المحلي.

```bash
# اطّلع على النماذج المتاحة
ollama list
openclaw models list
```

لإضافة نموذج جديد، ما عليك سوى سحبه باستخدام Ollama:

```bash
ollama pull mistral
```

سيُكتشف النموذج الجديد تلقائيًا وسيصبح متاحًا للاستخدام.

<Note>
إذا ضبطت `models.providers.ollama` صراحةً، فسيتم تخطي الاكتشاف التلقائي وسيتعين عليك تعريف النماذج يدويًا. راجع قسم التهيئة الصريحة أدناه.
</Note>

## التهيئة

<Tabs>
  <Tab title="أساسي (اكتشاف ضمني)">
    أبسط مسار لتمكين الوضع المحلي فقط هو عبر متغير البيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كانت قيمة `OLLAMA_API_KEY` مضبوطة، يمكنك حذف `apiKey` من إدخال المزوّد وسيقوم OpenClaw بملئها من أجل فحوصات التوفّر.
    </Tip>

  </Tab>

  <Tab title="صريح (نماذج يدوية)">
    استخدم التهيئة الصريحة عندما تريد إعدادًا سحابيًا مستضافًا، أو كان Ollama يعمل على مضيف/منفذ آخر، أو أردت فرض نوافذ سياق أو قوائم نماذج محددة، أو أردت تعريفات نماذج يدوية بالكامل.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="عنوان URL أساسي مخصص">
    إذا كان Ollama يعمل على مضيف أو منفذ مختلف (تعطّل التهيئة الصريحة الاكتشاف التلقائي، لذا عرّف النماذج يدويًا):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // بدون /v1 - استخدم عنوان URL لواجهة Ollama الأصلية
            api: "ollama", // اضبطه صراحةً لضمان سلوك استدعاء الأدوات الأصلي
          },
        },
      },
    }
    ```

    <Warning>
    لا تضف `/v1` إلى عنوان URL. يستخدم المسار `/v1` وضع التوافق مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا. استخدم عنوان URL الأساسي لـ Ollama من دون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

### اختيار النموذج

بعد التهيئة، تصبح جميع نماذج Ollama لديك متاحة:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

يدعم OpenClaw **Ollama Web Search** كمزوّد `web_search` مضمّن.

| الخاصية      | التفاصيل                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| المضيف       | يستخدم مضيف Ollama المهيأ لديك (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`)          |
| المصادقة     | لا يتطلب مفتاحًا                                                                                                    |
| المتطلب      | يجب أن يكون Ollama قيد التشغيل وقد تم تسجيل الدخول باستخدام `ollama signin`                                        |

اختر **Ollama Web Search** أثناء `openclaw onboard` أو `openclaw configure --section web`، أو اضبط:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
للاطلاع على تفاصيل الإعداد والسلوك كاملةً، راجع [Ollama Web Search](/ar/tools/ollama-search).
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="وضع التوافق القديم مع OpenAI">
    <Warning>
    **استدعاء الأدوات غير موثوق في وضع التوافق مع OpenAI.** استخدم هذا الوضع فقط إذا كنت تحتاج إلى تنسيق OpenAI من أجل وكيل، ولا تعتمد على سلوك استدعاء الأدوات الأصلي.
    </Warning>

    إذا كنت بحاجة إلى استخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك (على سبيل المثال، خلف وكيل لا يدعم إلا تنسيق OpenAI)، فاضبط `api: "openai-completions"` صراحةً:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // الافتراضي: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    قد لا يدعم هذا الوضع البث واستدعاء الأدوات في الوقت نفسه. وقد تحتاج إلى تعطيل البث باستخدام `params: { streaming: false }` في تهيئة النموذج.

    عند استخدام `api: "openai-completions"` مع Ollama، يحقن OpenClaw القيمة `options.num_ctx` افتراضيًا حتى لا يعود Ollama بصمت إلى نافذة سياق قدرها 4096. وإذا كان الوكيل/المصدر يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="نوافذ السياق">
    بالنسبة إلى النماذج المكتشفة تلقائيًا، يستخدم OpenClaw نافذة السياق التي يبلّغ عنها Ollama عندما تكون متاحة، وإلا فإنه يعود إلى نافذة سياق Ollama الافتراضية التي يستخدمها OpenClaw.

    يمكنك تجاوز `contextWindow` و`maxTokens` في تهيئة المزوّد الصريحة:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="نماذج الاستدلال">
    يتعامل OpenClaw مع النماذج التي تحمل أسماء مثل `deepseek-r1` أو `reasoning` أو `think` على أنها قادرة على الاستدلال افتراضيًا.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    لا حاجة إلى أي تهيئة إضافية -- إذ يعلّمها OpenClaw تلقائيًا.

  </Accordion>

  <Accordion title="تكاليف النماذج">
    Ollama مجاني ويعمل محليًا، لذلك تُضبط جميع تكاليف النماذج على $0. وينطبق هذا على كلٍّ من النماذج المكتشفة تلقائيًا والنماذج المعرّفة يدويًا.
  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يسجّل Plugin Ollama المضمّن مزوّدًا لتضمينات الذاكرة من أجل
    [البحث في الذاكرة](/ar/concepts/memory). وهو يستخدم عنوان URL الأساسي
    لـ Ollama ومفتاح API المهيأين.

    | الخاصية      | القيمة              |
    | ------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text`  |
    | السحب التلقائي   | نعم — يتم سحب نموذج التضمين تلقائيًا إذا لم يكن موجودًا محليًا |

    لاختيار Ollama كمزوّد تضمين للبحث في الذاكرة:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تهيئة البث">
    يستخدم تكامل Ollama في OpenClaw **واجهة Ollama الأصلية** (`/api/chat`) افتراضيًا، وهي تدعم بالكامل البث واستدعاء الأدوات في الوقت نفسه. لا حاجة إلى أي تهيئة خاصة.

    <Tip>
    إذا كنت بحاجة إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "وضع التوافق القديم مع OpenAI" أعلاه. قد لا يعمل البث واستدعاء الأدوات في الوقت نفسه في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم اكتشاف Ollama">
    تأكد من أن Ollama قيد التشغيل وأنك ضبطت `OLLAMA_API_KEY` (أو ملف تعريف للمصادقة)، وأنك **لم** تعرّف إدخال `models.providers.ollama` صريحًا:

    ```bash
    ollama serve
    ```

    تحقّق من أن واجهة API قابلة للوصول:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="لا توجد نماذج متاحة">
    إذا لم يكن نموذجك مدرجًا، فإما أن تسحب النموذج محليًا أو تعرّفه صراحةً في `models.providers.ollama`.

    ```bash
    ollama list  # اعرض ما هو مثبّت
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # أو نموذجًا آخر
    ```

  </Accordion>

  <Accordion title="تم رفض الاتصال">
    تحقّق من أن Ollama يعمل على المنفذ الصحيح:

    ```bash
    # تحقق مما إذا كان Ollama قيد التشغيل
    ps aux | grep ollama

    # أو أعد تشغيل Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
مزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين ومراجع النماذج وسلوك التبديل عند الفشل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتهيئتها.
  </Card>
  <Card title="Ollama Web Search" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة للبحث على الويب المدعوم من Ollama.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="gear">
    مرجع التهيئة الكامل.
  </Card>
</CardGroup>
