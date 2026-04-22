---
read_when:
    - تريد تشغيل OpenClaw مع نماذج سحابية أو محلية عبر Ollama
    - تحتاج إلى إرشادات إعداد Ollama وتهيئته
    - تريد نماذج رؤية من Ollama لفهم الصور
summary: شغّل OpenClaw مع Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T07:18:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704beed3bf988d6c2ad50b2a1533f6dcef655e44b34f23104827d2acb71b8655
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

يتكامل OpenClaw مع واجهة API الأصلية الخاصة بـ Ollama (`/api/chat`) للنماذج السحابية المستضافة وخوادم Ollama المحلية/المستضافة ذاتيًا. يمكنك استخدام Ollama في ثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama يمكن الوصول إليه، أو `Cloud only` مقابل `https://ollama.com`، أو `Local only` مقابل مضيف Ollama يمكن الوصول إليه.

<Warning>
**مستخدمو Ollama البعيد**: لا تستخدموا عنوان URL المتوافق مع OpenAI على `/v1` (`http://host:11434/v1`) مع OpenClaw. فهذا يعطّل استدعاء الأدوات وقد تُخرج النماذج JSON الأدوات الخام كنص عادي. استخدم عنوان URL الخاص بواجهة API الأصلية لـ Ollama بدلًا من ذلك: `baseUrl: "http://host:11434"` (من دون `/v1`).
</Warning>

## البدء

اختر طريقة الإعداد والوضع المفضلين لديك.

<Tabs>
  <Tab title="الإعداد الأولي (موصى به)">
    **الأفضل لـ:** أسرع طريق إلى إعداد Ollama سحابي أو محلي يعمل.

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard
        ```

        اختر **Ollama** من قائمة الموفّرين.
      </Step>
      <Step title="اختر وضعك">
        - **Cloud + Local** — مضيف Ollama محلي بالإضافة إلى نماذج سحابية تُوجَّه عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama المستضافة عبر `https://ollama.com`
        - **Local only** — نماذج محلية فقط
      </Step>
      <Step title="اختر نموذجًا">
        يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويقترح افتراضيات سحابية مستضافة. يطلب كل من `Cloud + Local` و`Local only` عنوان URL الأساسي لـ Ollama، ويكتشفان النماذج المتاحة، ويجريان سحبًا تلقائيًا للنموذج المحلي المحدد إذا لم يكن متاحًا بعد. كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا قد سجّل الدخول للوصول السحابي.
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

    يمكنك اختياريًا تحديد عنوان URL أساسي مخصص أو نموذج:

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
      <Step title="فعّل Ollama لـ OpenClaw">
        بالنسبة إلى `Cloud only`، استخدم قيمة `OLLAMA_API_KEY` الحقيقية لديك. أما في الإعدادات المعتمدة على المضيف، فأي قيمة بديلة تعمل:

        ```bash
        # السحابي
        export OLLAMA_API_KEY="your-ollama-api-key"

        # المحلي فقط
        export OLLAMA_API_KEY="ollama-local"

        # أو اضبطه في ملف الإعداد
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="افحص نموذجك واضبطه">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        أو اضبط الافتراضي في الإعداد:

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
    يستخدم `Cloud + Local` مضيف Ollama يمكن الوصول إليه كنقطة تحكم لكل من النماذج المحلية والسحابية. وهذا هو التدفق الهجين المفضل لدى Ollama.

    استخدم **Cloud + Local** أثناء الإعداد. يطلب OpenClaw عنوان URL الأساسي لـ Ollama، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف قد سجّل الدخول للوصول السحابي باستخدام `ollama signin`. وعندما يكون المضيف قد سجّل الدخول، يقترح OpenClaw أيضًا افتراضيات سحابية مستضافة مثل `kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud`.

    إذا لم يكن المضيف قد سجّل الدخول بعد، فسيُبقي OpenClaw الإعداد في وضع محلي فقط إلى أن تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` مقابل واجهة API المستضافة الخاصة بـ Ollama على `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. يطلب OpenClaw قيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويهيّئ قائمة النماذج السحابية المستضافة. هذا المسار **لا** يتطلب خادم Ollama محليًا أو `ollama signin`.

    تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرة من `https://ollama.com/api/tags`، مع حد أقصى قدره 500 إدخال، بحيث يعكس المنتقي الفهرس المستضاف الحالي بدلًا من قائمة أولية ثابتة. وإذا تعذّر الوصول إلى `ollama.com` أو لم يُرجع أي نماذج وقت الإعداد، يعود OpenClaw إلى الاقتراحات الثابتة السابقة حتى يكتمل الإعداد الأولي.

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من نسخة Ollama المضبوطة. هذا المسار مخصص لخوادم Ollama المحلية أو المستضافة ذاتيًا.

    يقترح OpenClaw حاليًا `gemma4` بوصفه الافتراضي المحلي.

  </Tab>
</Tabs>

## اكتشاف النماذج (موفّر ضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف تعريف مصادقة) و**لا** تعرّف `models.providers.ollama`، يكتشف OpenClaw النماذج من نسخة Ollama المحلية على `http://127.0.0.1:11434`.

| السلوك             | التفاصيل                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الفهرس      | يستعلم `/api/tags`                                                                                                                                                    |
| اكتشاف القدرات      | يستخدم عمليات بحث `/api/show` بأفضل جهد لقراءة `contextWindow` واكتشاف القدرات (بما في ذلك الرؤية)                                                                   |
| نماذج الرؤية        | تُوسَم النماذج التي تُبلّغ عن قدرة `vision` عبر `/api/show` على أنها قادرة على التعامل مع الصور (`input: ["text", "image"]`)، لذا يحقن OpenClaw الصور تلقائيًا في الموجّه |
| اكتشاف الاستدلال    | يوسم `reasoning` باستخدام أسلوب تقريبي يعتمد على اسم النموذج (`r1` و`reasoning` و`think`)                                                                            |
| حدود الرموز         | يضبط `maxTokens` على حد Ollama الافتراضي الأقصى للرموز الذي يستخدمه OpenClaw                                                                                         |
| التكاليف            | يضبط جميع التكاليف على `0`                                                                                                                                             |

يؤدي هذا إلى تجنب إدخالات النماذج اليدوية مع إبقاء الفهرس متوافقًا مع نسخة Ollama المحلية.

```bash
# اعرض النماذج المتاحة
ollama list
openclaw models list
```

لإضافة نموذج جديد، ما عليك سوى سحبه باستخدام Ollama:

```bash
ollama pull mistral
```

سيُكتشف النموذج الجديد تلقائيًا ويصبح متاحًا للاستخدام.

<Note>
إذا ضبطت `models.providers.ollama` صراحةً، فسيُتجاوز الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا. راجع قسم الإعداد الصريح أدناه.
</Note>

## الرؤية ووصف الصور

تسجّل Plugin Ollama المضمّنة Ollama بوصفه موفّر فهم وسائط قادرًا على التعامل مع الصور. وهذا يتيح لـ OpenClaw توجيه طلبات وصف الصور الصريحة وافتراضيات نماذج الصور المضبوطة عبر نماذج رؤية Ollama المحلية أو المستضافة.

بالنسبة إلى الرؤية المحلية، اسحب نموذجًا يدعم الصور:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

ثم تحقّق باستخدام CLI الخاص بالاستدلال:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

يجب أن تكون قيمة `--model` مرجعًا كاملًا بصيغة `<provider/model>`. عند ضبطها، يشغّل `openclaw infer image describe` هذا النموذج مباشرة بدلًا من تخطي الوصف لأن النموذج يدعم الرؤية الأصلية.

لجعل Ollama نموذج فهم الصور الافتراضي للوسائط الواردة، اضبط `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

إذا كنت تعرّف `models.providers.ollama.models` يدويًا، فوسّم نماذج الرؤية بدعم إدخال الصور:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج التي لم تُوسَم على أنها قادرة على التعامل مع الصور. ومع الاكتشاف الضمني، يقرأ OpenClaw ذلك من Ollama عندما يبلّغ `/api/show` عن قدرة رؤية.

## الإعداد

<Tabs>
  <Tab title="أساسي (اكتشاف ضمني)">
    أبسط مسار لتمكين الوضع المحلي فقط هو عبر متغير بيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كانت `OLLAMA_API_KEY` مضبوطة، يمكنك حذف `apiKey` من إدخال الموفّر وسيملؤها OpenClaw لفحوصات التوفر.
    </Tip>

  </Tab>

  <Tab title="صريح (نماذج يدوية)">
    استخدم الإعداد الصريح عندما تريد إعدادًا سحابيًا مستضافًا، أو عندما يعمل Ollama على مضيف/منفذ آخر، أو عندما تريد فرض نوافذ سياق أو قوائم نماذج محددة، أو عندما تريد تعريفات نماذج يدوية بالكامل.

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
    إذا كان Ollama يعمل على مضيف أو منفذ مختلف (الإعداد الصريح يعطّل الاكتشاف التلقائي، لذا عرّف النماذج يدويًا):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // بدون /v1 - استخدم عنوان URL لواجهة API الأصلية لـ Ollama
            api: "ollama", // اضبطه صراحةً لضمان سلوك استدعاء الأدوات الأصلي
          },
        },
      },
    }
    ```

    <Warning>
    لا تضف `/v1` إلى عنوان URL. يستخدم المسار `/v1` الوضع المتوافق مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا. استخدم عنوان URL الأساسي لـ Ollama من دون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

### اختيار النموذج

بمجرد الإعداد، تصبح كل نماذج Ollama الخاصة بك متاحة:

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

يدعم OpenClaw **Ollama Web Search** بوصفه موفّر `web_search` مضمّنًا.

| الخاصية     | التفاصيل                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| المضيف      | يستخدم مضيف Ollama المضبوط لديك (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`)            |
| المصادقة    | لا يحتاج إلى مفتاح                                                                                                     |
| المتطلب     | يجب أن يكون Ollama قيد التشغيل وقد تم تسجيل الدخول إليه باستخدام `ollama signin`                                      |

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

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الوضع القديم المتوافق مع OpenAI">
    <Warning>
    **استدعاء الأدوات غير موثوق في الوضع المتوافق مع OpenAI.** استخدم هذا الوضع فقط إذا كنت تحتاج إلى تنسيق OpenAI لوكيل وسيط ولا تعتمد على سلوك استدعاء الأدوات الأصلي.
    </Warning>

    إذا كنت بحاجة إلى استخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك (على سبيل المثال، خلف وكيل وسيط لا يدعم إلا تنسيق OpenAI)، فاضبط `api: "openai-completions"` صراحةً:

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

    قد لا يدعم هذا الوضع البث واستدعاء الأدوات في الوقت نفسه. وقد تحتاج إلى تعطيل البث باستخدام `params: { streaming: false }` في إعداد النموذج.

    عند استخدام `api: "openai-completions"` مع Ollama، يحقن OpenClaw القيمة `options.num_ctx` افتراضيًا حتى لا يعود Ollama بصمت إلى نافذة سياق بحجم 4096. وإذا كان الوكيل الوسيط/المصدر العلوي لديك يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

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

    يمكنك تجاوز `contextWindow` و`maxTokens` في إعداد الموفّر الصريح:

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

    لا حاجة إلى أي إعداد إضافي -- يوسمها OpenClaw تلقائيًا.

  </Accordion>

  <Accordion title="تكاليف النماذج">
    Ollama مجاني ويعمل محليًا، لذا تُضبط جميع تكاليف النماذج على $0. وينطبق هذا على كل من النماذج المكتشفة تلقائيًا والنماذج المعرّفة يدويًا.
  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    تسجّل Plugin Ollama المضمّنة موفّر تضمينات للذاكرة من أجل
    [البحث في الذاكرة](/ar/concepts/memory). وهي تستخدم عنوان URL الأساسي
    لـ Ollama ومفتاح API المضبوطين.

    | الخاصية        | القيمة              |
    | -------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text`  |
    | السحب التلقائي   | نعم — يُسحب نموذج التضمين تلقائيًا إذا لم يكن موجودًا محليًا |

    لاختيار Ollama بوصفه موفّر تضمينات البحث في الذاكرة:

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

  <Accordion title="إعداد البث">
    يستخدم تكامل Ollama في OpenClaw **واجهة API الأصلية لـ Ollama** (`/api/chat`) افتراضيًا، وهي تدعم بالكامل البث واستدعاء الأدوات في الوقت نفسه. لا حاجة إلى أي إعداد خاص.

    بالنسبة إلى طلبات `/api/chat` الأصلية، يمرر OpenClaw أيضًا التحكم في التفكير مباشرةً إلى Ollama: إذ يرسل `/think off` و`openclaw agent --thinking off` القيمة العليا `think: false`، بينما ترسل مستويات التفكير غير `off` القيمة `think: true`.

    <Tip>
    إذا كنت بحاجة إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "الوضع القديم المتوافق مع OpenAI" أعلاه. قد لا يعمل البث واستدعاء الأدوات في الوقت نفسه في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم اكتشاف Ollama">
    تأكد من أن Ollama قيد التشغيل وأنك ضبطت `OLLAMA_API_KEY` (أو ملف تعريف مصادقة)، وأنك **لم** تعرّف إدخال `models.providers.ollama` صريحًا:

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
    ollama pull llama3.3     # أو نموذج آخر
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
للمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتهيئتها.
  </Card>
  <Card title="Ollama Web Search" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة للبحث على الويب المدعوم بواسطة Ollama.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    المرجع الكامل للإعداد.
  </Card>
</CardGroup>
