---
read_when:
    - تريد استخدام نماذج Mistral في OpenClaw
    - تريد التفريغ النصي من Voxtral في الوقت الفعلي للمكالمة الصوتية
    - تحتاج إلى إرشادات إعداد مفتاح واجهة برمجة تطبيقات Mistral ومراجع النماذج
summary: استخدم نماذج Mistral والتفريغ الصوتي باستخدام Voxtral مع OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-30T08:21:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

يدعم OpenClaw استخدام Mistral لكل من توجيه نماذج النصوص/الصور (`mistral/...`) و
تفريغ الصوت عبر Voxtral في فهم الوسائط.
يمكن أيضًا استخدام Mistral لتضمينات الذاكرة (`memorySearch.provider = "mistral"`).

- المزوّد: `mistral`
- المصادقة: `MISTRAL_API_KEY`
- واجهة API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API في [وحدة تحكم Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    أو مرّر المفتاح مباشرةً:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="عيّن نموذجًا افتراضيًا">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="تحقق من أن النموذج متاح">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## كتالوج LLM المضمّن

يشحن OpenClaw حاليًا كتالوج Mistral المضمّن هذا:

| مرجع النموذج                     | الإدخال      | السياق | الحد الأقصى للإخراج | ملاحظات                                                         |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | نص، صورة | 262,144 | 16,384     | النموذج الافتراضي                                                |
| `mistral/mistral-medium-2508`    | نص، صورة | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | نص، صورة | 128,000 | 16,384     | Mistral Small 4؛ استدلال قابل للضبط عبر API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | نص، صورة | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | نص        | 256,000 | 4,096      | البرمجة                                                         |
| `mistral/devstral-medium-latest` | نص        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | نص        | 128,000 | 40,000     | يدعم الاستدلال                                                   |

## تفريغ الصوت (Voxtral)

استخدم Voxtral لتفريغ الصوت دفعيًا عبر مسار فهم الوسائط.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
يستخدم مسار تفريغ الوسائط `/v1/audio/transcriptions`. نموذج الصوت الافتراضي لـ Mistral هو `voxtral-mini-latest`.
</Tip>

## تحويل الكلام إلى نص بتدفق Voice Call

يسجّل Plugin `mistral` المضمّن Voxtral Realtime بوصفه مزوّد تحويل كلام إلى نص متدفقًا لـ Voice Call.

| الإعداد      | مسار الإعدادات                                                         | الافتراضي                               |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| مفتاح API    | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | يرجع إلى `MISTRAL_API_KEY`              |
| النموذج      | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| الترميز      | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| معدل العينة  | `...mistral.sampleRate`                                                | `8000`                                  |
| التأخير المستهدف | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
يضبط OpenClaw تحويل الكلام إلى نص الفوري في Mistral افتراضيًا على `pcm_mulaw` عند 8 كيلوهرتز لكي تتمكن Voice Call من تمرير إطارات وسائط Twilio مباشرةً. استخدم `encoding: "pcm_s16le"` و`sampleRate` مطابقًا فقط إذا كان تدفقك الصاعد هو PCM خام بالفعل.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الاستدلال القابل للضبط (mistral-small-latest)">
    يرتبط `mistral/mistral-small-latest` بـ Mistral Small 4 ويدعم [الاستدلال القابل للضبط](https://docs.mistral.ai/capabilities/reasoning/adjustable) على واجهة API الخاصة بـ Chat Completions عبر `reasoning_effort` (`none` يقلّل التفكير الإضافي في الإخراج؛ ويُظهر `high` آثار التفكير الكاملة قبل الإجابة النهائية).

    يربط OpenClaw مستوى **التفكير** في الجلسة بواجهة API الخاصة بـ Mistral:

    | مستوى التفكير في OpenClaw                        | `reasoning_effort` في Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    لا تستخدم نماذج كتالوج Mistral المضمّنة الأخرى هذا المعامل. استمر في استخدام نماذج `magistral-*` عندما تريد سلوك Mistral الأصلي الذي يعطي الأولوية للاستدلال.
    </Note>

  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يمكن لـ Mistral تقديم تضمينات الذاكرة عبر `/v1/embeddings` (النموذج الافتراضي: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="المصادقة وعنوان URL الأساسي">
    - تستخدم مصادقة Mistral `MISTRAL_API_KEY`.
    - يكون عنوان URL الأساسي للمزوّد افتراضيًا `https://api.mistral.ai/v1`.
    - نموذج الإعداد الأولي الافتراضي هو `mistral/mistral-large-latest`.
    - يستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="فهم الوسائط" href="/ar/nodes/media-understanding" icon="microphone">
    إعداد تفريغ الصوت واختيار المزوّد.
  </Card>
</CardGroup>
