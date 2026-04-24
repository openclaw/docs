---
read_when:
    - أنت تريد تشغيل OpenClaw مع نماذج سحابية أو محلية عبر Ollama
    - أنت تحتاج إلى إرشادات إعداد وتكوين Ollama
    - أنت تريد نماذج رؤية من Ollama لفهم الصور
summary: شغّل OpenClaw مع Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T08:00:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

يتكامل OpenClaw مع واجهة Ollama الأصلية (`/api/chat`) للنماذج السحابية المستضافة وخوادم Ollama المحلية/المستضافة ذاتيًا. ويمكنك استخدام Ollama بثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama يمكن الوصول إليه، أو `Cloud only` مقابل `https://ollama.com`، أو `Local only` مقابل مضيف Ollama يمكن الوصول إليه.

<Warning>
**لمستخدمي Ollama البعيدين**: لا تستخدم عنوان URL المتوافق مع OpenAI عند `/v1` (`http://host:11434/v1`) مع OpenClaw. فهذا يكسر استدعاء الأدوات وقد تُخرج النماذج JSON الخام الخاص بالأدوات كنص عادي. استخدم عنوان URL الخاص بواجهة Ollama الأصلية بدلًا من ذلك: `baseUrl: "http://host:11434"` (من دون `/v1`).
</Warning>

## البدء

اختر طريقة الإعداد والوضع المفضلين لديك.

<Tabs>
  <Tab title="Onboarding (موصى به)">
    **الأفضل لـ:** أسرع طريق إلى إعداد Ollama سحابي أو محلي عامل.

    <Steps>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard
        ```

        اختر **Ollama** من قائمة المزوّدين.
      </Step>
      <Step title="اختر وضعك">
        - **Cloud + Local** — مضيف Ollama محلي بالإضافة إلى نماذج سحابية تُوجَّه عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama مستضافة عبر `https://ollama.com`
        - **Local only** — نماذج محلية فقط
      </Step>
      <Step title="اختر نموذجًا">
        يطلب `Cloud only` القيمة `OLLAMA_API_KEY` ويقترح افتراضيات سحابية مستضافة. أما `Cloud + Local` و`Local only` فيطلبان عنوان Ollama الأساسي، ويكتشفان النماذج المتاحة، ويقومان بسحب النموذج المحلي المحدد تلقائيًا إذا لم يكن متاحًا بعد. كما يتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا قد سجّل الدخول من أجل الوصول السحابي.
      </Step>
      <Step title="تحقق من توفر النموذج">
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

    ويمكنك اختياريًا تحديد عنوان أساسي أو نموذج مخصص:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="إعداد يدوي">
    **الأفضل لـ:** تحكم كامل في الإعداد السحابي أو المحلي.

    <Steps>
      <Step title="اختر بين السحابي أو المحلي">
        - **Cloud + Local**: ثبّت Ollama، وسجّل الدخول باستخدام `ollama signin`، ووجّه الطلبات السحابية عبر ذلك المضيف
        - **Cloud only**: استخدم `https://ollama.com` مع `OLLAMA_API_KEY`
        - **Local only**: ثبّت Ollama من [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="اسحب نموذجًا محليًا (للوضع المحلي فقط)">
        ```bash
        ollama pull gemma4
        # أو
        ollama pull gpt-oss:20b
        # أو
        ollama pull llama3.3
        ```
      </Step>
      <Step title="فعّل Ollama من أجل OpenClaw">
        بالنسبة إلى `Cloud only`، استخدم `OLLAMA_API_KEY` الحقيقي لديك. أما في الإعدادات المعتمدة على المضيف، فتكفي أي قيمة placeholder:

        ```bash
        # سحابي
        export OLLAMA_API_KEY="your-ollama-api-key"

        # محلي فقط
        export OLLAMA_API_KEY="ollama-local"

        # أو اضبطه في ملف الإعداد لديك
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="افحص النموذج واضبطه">
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

    استخدم **Cloud + Local** أثناء الإعداد. سيطلب OpenClaw عنوان Ollama الأساسي، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف قد سجّل الدخول للوصول السحابي باستخدام `ollama signin`. وعندما يكون المضيف مسجل الدخول، يقترح OpenClaw أيضًا افتراضيات سحابية مستضافة مثل `kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud`.

    إذا لم يكن المضيف قد سجل الدخول بعد، فسيُبقي OpenClaw الإعداد في الوضع المحلي فقط إلى أن تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` مقابل واجهة API المستضافة من Ollama عند `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. سيطلب OpenClaw القيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويهيّئ قائمة النماذج السحابية المستضافة. وهذا المسار **لا** يتطلب خادم Ollama محليًا أو `ollama signin`.

    تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرة من `https://ollama.com/api/tags`، مع حد أقصى يبلغ 500 إدخال، بحيث يعكس المحدد الكتالوج المستضاف الحالي بدلًا من قائمة ثابتة. وإذا كان `ollama.com` غير قابل للوصول أو أعاد صفر نماذج وقت الإعداد، فإن OpenClaw يعود إلى الاقتراحات الصلبة السابقة حتى يكتمل onboarding.

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من نسخة Ollama المضبوطة. وهذا المسار مخصص لخوادم Ollama المحلية أو المستضافة ذاتيًا.

    يقترح OpenClaw حاليًا `gemma4` كافتراضي محلي.

  </Tab>
</Tabs>

## اكتشاف النموذج (المزوّد الضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف تعريف مصادقة) و**لا** تعرّف `models.providers.ollama`، يكتشف OpenClaw النماذج من نسخة Ollama المحلية عند `http://127.0.0.1:11434`.

| السلوك               | التفاصيل                                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الكتالوج     | يستعلم عن `/api/tags`                                                                                                                                                 |
| اكتشاف القدرات       | يستخدم أفضل جهد من خلال استعلامات `/api/show` لقراءة `contextWindow` واكتشاف القدرات (بما في ذلك الرؤية)                                                             |
| نماذج الرؤية         | يتم وسم النماذج التي تُبلغ `/api/show` عن امتلاكها لقدرة `vision` على أنها قادرة على الصور (`input: ["text", "image"]`)، بحيث يحقن OpenClaw الصور تلقائيًا في المطالبة |
| اكتشاف reasoning     | يضع وسم `reasoning` باستخدام heuristic على اسم النموذج (`r1`, `reasoning`, `think`)                                                                                 |
| حدود الرموز          | يضبط `maxTokens` على الحد الأقصى الافتراضي لرموز Ollama الذي يستخدمه OpenClaw                                                                                       |
| التكاليف             | يضبط جميع التكاليف على `0`                                                                                                                                           |

وهذا يتجنب الإدخالات اليدوية للنماذج مع الإبقاء على توافق الكتالوج مع نسخة Ollama المحلية.

```bash
# اعرف ما النماذج المتاحة
ollama list
openclaw models list
```

لإضافة نموذج جديد، اسحبه ببساطة باستخدام Ollama:

```bash
ollama pull mistral
```

سيُكتشف النموذج الجديد تلقائيًا ويصبح متاحًا للاستخدام.

<Note>
إذا ضبطت `models.providers.ollama` صراحةً، فسيتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا. راجع قسم الإعداد الصريح أدناه.
</Note>

## الرؤية ووصف الصور

تسجّل Plugin Ollama المضمّنة Ollama كمزوّد فهم وسائط قادر على الصور. وهذا يسمح لـ OpenClaw بتوجيه طلبات وصف الصور الصريحة والقيم الافتراضية المُعدّة لنموذج الصور عبر نماذج الرؤية في Ollama، سواء المحلية أو المستضافة.

بالنسبة إلى الرؤية المحلية، اسحب نموذجًا يدعم الصور:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

ثم تحقق عبر infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

يجب أن تكون قيمة `--model` مرجعًا كاملًا بالشكل `<provider/model>`. وعند ضبطها، يقوم `openclaw infer image describe` بتشغيل ذلك النموذج مباشرة بدلًا من تخطي الوصف لأن النموذج يدعم الرؤية أصلًا.

لجعل Ollama هي النموذج الافتراضي لفهم الصور في الوسائط الواردة، اضبط `agents.defaults.imageModel`:

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

إذا عرّفت `models.providers.ollama.models` يدويًا، فضع وسم دعم إدخال الصور على نماذج الرؤية:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج غير الموسومة على أنها قادرة على الصور. ومع الاكتشاف الضمني، يقرأ OpenClaw هذا من Ollama عندما يبلّغ `/api/show` عن قدرة vision.

## الإعداد

<Tabs>
  <Tab title="أساسي (اكتشاف ضمني)">
    أبسط مسار لتفعيل الوضع المحلي فقط هو عبر متغير بيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا كانت `OLLAMA_API_KEY` مضبوطة، يمكنك حذف `apiKey` من إدخال المزوّد وسيملؤها OpenClaw في فحوصات التوفر.
    </Tip>

  </Tab>

  <Tab title="صريح (نماذج يدوية)">
    استخدم الإعداد الصريح عندما تريد إعدادًا سحابيًا مستضافًا، أو عندما تعمل Ollama على مضيف/منفذ آخر، أو عندما تريد فرض نوافذ سياق أو قوائم نماذج محددة، أو عندما تريد تعريفات نماذج يدوية بالكامل.

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

  <Tab title="عنوان أساسي مخصص">
    إذا كانت Ollama تعمل على مضيف أو منفذ مختلفين (فالإعداد الصريح يعطل الاكتشاف التلقائي، لذا عرّف النماذج يدويًا):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // دون /v1 - استخدم عنوان Ollama الأصلي
            api: "ollama", // اضبطه صراحةً لضمان سلوك استدعاء الأدوات الأصلي
          },
        },
      },
    }
    ```

    <Warning>
    لا تضف `/v1` إلى عنوان URL. إذ يستخدم المسار `/v1` الوضع المتوافق مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا. استخدم عنوان Ollama الأساسي من دون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

### اختيار النموذج

بمجرد الإعداد، تصبح جميع نماذج Ollama الخاصة بك متاحة:

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

| الخاصية    | التفاصيل                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| المضيف      | يستخدم مضيف Ollama المضبوط لديك (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`)        |
| المصادقة    | بلا مفتاح                                                                                                             |
| المتطلب     | يجب أن تكون Ollama قيد التشغيل وأن يكون مسجل الدخول عبر `ollama signin`                                             |

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
للاطلاع على تفاصيل الإعداد والسلوك الكاملة، راجع [Ollama Web Search](/ar/tools/ollama-search).
</Note>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="الوضع القديم المتوافق مع OpenAI">
    <Warning>
    **استدعاء الأدوات غير موثوق في الوضع المتوافق مع OpenAI.** استخدم هذا الوضع فقط إذا كنت تحتاج إلى تنسيق OpenAI من أجل proxy ولا تعتمد على سلوك استدعاء الأدوات الأصلي.
    </Warning>

    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك (على سبيل المثال، خلف proxy لا تدعم إلا تنسيق OpenAI)، فاضبط `api: "openai-completions"` صراحةً:

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

    عند استخدام `api: "openai-completions"` مع Ollama، يقوم OpenClaw بحقن `options.num_ctx` افتراضيًا حتى لا تعود Ollama بصمت إلى نافذة سياق 4096. وإذا كان proxy/upstream لديك يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

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
    بالنسبة إلى النماذج المكتشفة تلقائيًا، يستخدم OpenClaw نافذة السياق التي يبلّغ عنها Ollama عند توفرها، وإلا يعود إلى نافذة السياق الافتراضية لـ Ollama التي يستخدمها OpenClaw.

    يمكنك تجاوز `contextWindow` و`maxTokens` في إعداد المزوّد الصريح:

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

  <Accordion title="نماذج reasoning">
    يتعامل OpenClaw مع النماذج التي تحمل أسماء مثل `deepseek-r1` أو `reasoning` أو `think` على أنها قادرة على reasoning افتراضيًا.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    لا حاجة إلى أي إعداد إضافي -- إذ يضع OpenClaw هذا الوسم عليها تلقائيًا.

  </Accordion>

  <Accordion title="تكاليف النماذج">
    تعد Ollama مجانية وتعمل محليًا، لذلك تُضبط جميع تكاليف النماذج على $0. وينطبق هذا على كل من النماذج المكتشفة تلقائيًا والمُعرّفة يدويًا.
  </Accordion>

  <Accordion title="Memory embeddings">
    تسجّل Plugin Ollama المضمّنة مزوّد embedding للذاكرة من أجل
    [البحث في Memory](/ar/concepts/memory). وهي تستخدم عنوان Ollama الأساسي
    ومفتاح API المهيأين.

    | الخاصية      | القيمة               |
    | ------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text`  |
    | السحب التلقائي   | نعم — يتم سحب نموذج embedding تلقائيًا إذا لم يكن موجودًا محليًا |

    لاختيار Ollama كمزوّد embedding للبحث في الذاكرة:

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
    يستخدم تكامل Ollama في OpenClaw **واجهة Ollama الأصلية** (`/api/chat`) افتراضيًا، والتي تدعم بالكامل البث واستدعاء الأدوات في الوقت نفسه. ولا حاجة إلى أي إعداد خاص.

    بالنسبة إلى طلبات `/api/chat` الأصلية، يمرر OpenClaw أيضًا التحكم في التفكير مباشرة إلى Ollama: فالأمر `/think off` و`openclaw agent --thinking off` يرسلان `think: false` على المستوى الأعلى، بينما ترسل مستويات التفكير غير `off` القيمة `think: true`.

    <Tip>
    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "الوضع القديم المتوافق مع OpenAI" أعلاه. فقد لا يعمل البث واستدعاء الأدوات في الوقت نفسه في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم اكتشاف Ollama">
    تأكد من أن Ollama تعمل وأنك ضبطت `OLLAMA_API_KEY` (أو ملف تعريف مصادقة)، وأنك **لم** تعرّف إدخالًا صريحًا لـ `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    تحقق من أن واجهة API قابلة للوصول:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="لا توجد نماذج متاحة">
    إذا لم يكن نموذجك مدرجًا، فإما أن تسحب النموذج محليًا أو تعرّفه صراحةً في `models.providers.ollama`.

    ```bash
    ollama list  # اعرض ما هو مثبت
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # أو نموذج آخر
    ```

  </Accordion>

  <Accordion title="Connection refused">
    تحقق من أن Ollama تعمل على المنفذ الصحيح:

    ```bash
    # تحقق مما إذا كانت Ollama تعمل
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
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="Ollama Web Search" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة للبحث على الويب المدعوم بواسطة Ollama.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
</CardGroup>
