---
read_when:
    - تريد استخدام نماذج Mistral في OpenClaw
    - تريد النسخ الفوري باستخدام Voxtral لـ Voice Call
    - تحتاج إلى الإعداد الأولي باستخدام مفتاح API الخاص بـ Mistral ومراجع النماذج
summary: استخدم نماذج Mistral ونسخ Voxtral مع OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T07:59:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

يدعم OpenClaw استخدام Mistral لكل من توجيه نماذج النص/الصور (`mistral/...`) ونسخ
الصوت عبر Voxtral ضمن فهم الوسائط.
ويمكن أيضًا استخدام Mistral لتضمينات الذاكرة (`memorySearch.provider = "mistral"`).

- الموفّر: `mistral`
- المصادقة: `MISTRAL_API_KEY`
- API: ‏Mistral Chat Completions (`https://api.mistral.ai/v1`)

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API في [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    أو مرّر المفتاح مباشرة:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="اضبط نموذجًا افتراضيًا">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## فهرس LLM المضمن

يشحن OpenClaw حاليًا فهرس Mistral المضمن التالي:

| مرجع النموذج                     | الإدخال      | السياق  | الحد الأقصى للإخراج | ملاحظات                                                             |
| -------------------------------- | ------------ | ------- | ------------------- | ------------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | نص، صورة     | 262,144 | 16,384              | النموذج الافتراضي                                                   |
| `mistral/mistral-medium-2508`    | نص، صورة     | 262,144 | 8,192               | Mistral Medium 3.1                                                  |
| `mistral/mistral-small-latest`   | نص، صورة     | 128,000 | 16,384              | Mistral Small 4؛ استدلال قابل للضبط عبر API ‏`reasoning_effort`     |
| `mistral/pixtral-large-latest`   | نص، صورة     | 128,000 | 32,768              | Pixtral                                                             |
| `mistral/codestral-latest`       | نص           | 256,000 | 4,096               | للبرمجة                                                             |
| `mistral/devstral-medium-latest` | نص           | 262,144 | 32,768              | Devstral 2                                                          |
| `mistral/magistral-small`        | نص           | 128,000 | 40,000              | مع تمكين الاستدلال                                                  |

## نسخ الصوت (Voxtral)

استخدم Voxtral لنسخ الصوت الدفعي عبر خط أنابيب فهم الوسائط.

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
يستخدم مسار نسخ الوسائط `/v1/audio/transcriptions`. ونموذج الصوت الافتراضي لـ Mistral هو `voxtral-mini-latest`.
</Tip>

## STT المتدفق لـ Voice Call

يسجل Plugin ‏`mistral` المضمن Voxtral Realtime بوصفه موفّر STT متدفقًا لـ Voice Call.

| الإعداد       | مسار التهيئة                                                           | الافتراضي                              |
| ------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| مفتاح API     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | يعود إلى `MISTRAL_API_KEY` احتياطيًا   |
| النموذج       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| الترميز       | `...mistral.encoding`                                                  | `pcm_mulaw`                            |
| معدل العينة   | `...mistral.sampleRate`                                                | `8000`                                 |
| التأخير المستهدف | `...mistral.targetStreamingDelayMs`                                 | `800`                                  |

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
يضبط OpenClaw افتراضيًا STT الفوري من Mistral على `pcm_mulaw` عند 8 كيلوهرتز بحيث يتمكن Voice Call
من تمرير إطارات وسائط Twilio مباشرة. استخدم `encoding: "pcm_s16le"` مع
`sampleRate` مطابق فقط إذا كان التدفق الصاعد لديك PCM خامًا بالفعل.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="الاستدلال القابل للضبط (mistral-small-latest)">
    يُربط `mistral/mistral-small-latest` بـ Mistral Small 4 ويدعم [الاستدلال القابل للضبط](https://docs.mistral.ai/capabilities/reasoning/adjustable) على Chat Completions API عبر `reasoning_effort` (`none` يقلل التفكير الإضافي في الإخراج إلى الحد الأدنى؛ و`high` يعرض مسارات التفكير الكاملة قبل الإجابة النهائية).

    يربط OpenClaw مستوى **التفكير** في الجلسة بـ API الخاص بـ Mistral:

    | مستوى التفكير في OpenClaw                        | `reasoning_effort` في Mistral |
    | ------------------------------------------------ | ----------------------------- |
    | **off** / **minimal**                            | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`        |

    <Note>
    لا تستخدم نماذج فهرس Mistral المضمنة الأخرى هذه المعلمة. استمر في استخدام نماذج `magistral-*` عندما تريد سلوك Mistral الأصلي القائم على الاستدلال أولًا.
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

  <Accordion title="المصادقة وBase URL">
    - تستخدم مصادقة Mistral المتغير `MISTRAL_API_KEY`.
    - تكون Base URL الخاصة بالموفّر افتراضيًا `https://api.mistral.ai/v1`.
    - نموذج الإعداد الأولي الافتراضي هو `mistral/mistral-large-latest`.
    - تستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="فهم الوسائط" href="/ar/nodes/media-understanding" icon="microphone">
    إعداد نسخ الصوت واختيار الموفّر.
  </Card>
</CardGroup>
