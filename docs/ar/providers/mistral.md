---
read_when:
    - تريد استخدام نماذج Mistral في OpenClaw
    - تريد النسخ النصي في الوقت الفعلي عبر Voxtral لمكالمة صوتية
    - تحتاج إلى إعداد مفتاح API لـ Mistral ومراجع النماذج
summary: استخدم نماذج Mistral والتفريغ الصوتي باستخدام Voxtral مع OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T08:11:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

يتضمن OpenClaw Plugin Mistral مضمّنة تسجّل أربعة عقود: إكمالات المحادثة، وفهم الوسائط (نسخ Voxtral الدفعي)، وSTT الفوري لمكالمة صوتية (Voxtral Realtime)، وتضمينات الذاكرة (`mistral-embed`).

| الخاصية         | القيمة                                      |
| ---------------- | ------------------------------------------- |
| معرّف المزوّد      | `mistral`                                   |
| Plugin           | مضمّنة، `enabledByDefault: true`           |
| متغير بيئة المصادقة     | `MISTRAL_API_KEY`                           |
| علم الإعداد الأولي  | `--auth-choice mistral-api-key`             |
| علم CLI المباشر  | `--mistral-api-key <key>`                   |
| API              | متوافق مع OpenAI (`openai-completions`)    |
| عنوان URL الأساسي         | `https://api.mistral.ai/v1`                 |
| النموذج الافتراضي    | `mistral/mistral-large-latest`              |
| نموذج التضمين  | `mistral-embed`                             |
| Voxtral الدفعي    | `voxtral-mini-latest` (نسخ صوتي) |
| Voxtral الفوري | `voxtral-mini-transcribe-realtime-2602`     |

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API في [وحدة تحكم Mistral](https://console.mistral.ai/).
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

## كتالوج LLM المدمج

يشحن OpenClaw حاليًا كتالوج Mistral المضمّن هذا:

| مرجع النموذج                        | الإدخال       | السياق | الحد الأقصى للإخراج | ملاحظات                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | نص، صورة | 262,144 | 16,384     | النموذج الافتراضي                                                    |
| `mistral/mistral-medium-2508`    | نص، صورة | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | نص، صورة | 128,000 | 16,384     | Mistral Small 4؛ تفكير قابل للضبط عبر API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | نص، صورة | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | نص        | 256,000 | 4,096      | البرمجة                                                           |
| `mistral/devstral-medium-latest` | نص        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | نص        | 128,000 | 40,000     | يدعم التفكير                                                |

## النسخ الصوتي (Voxtral)

استخدم Voxtral للنسخ الصوتي الدفعي عبر مسار فهم الوسائط.

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
يستخدم مسار نسخ الوسائط `/v1/audio/transcriptions`. نموذج الصوت الافتراضي لـ Mistral هو `voxtral-mini-latest`.
</Tip>

## STT المتدفق لمكالمة صوتية

تسجّل Plugin `mistral` المضمّنة Voxtral Realtime كمزوّد STT متدفق لمكالمة صوتية.

| الإعداد      | مسار الإعداد                                                            | الافتراضي                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| مفتاح API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | يعود إلى `MISTRAL_API_KEY`         |
| النموذج        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| الترميز     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
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
يضبط OpenClaw افتراضيًا STT الفوري من Mistral على `pcm_mulaw` عند 8 كيلوهرتز لكي تتمكن مكالمة صوتية من تمرير إطارات وسائط Twilio مباشرة. استخدم `encoding: "pcm_s16le"` و`sampleRate` مطابقًا فقط إذا كان التدفق الصاعد لديك هو PCM خام بالفعل.
</Note>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="تفكير قابل للضبط (mistral-small-latest)">
    يرتبط `mistral/mistral-small-latest` بـ Mistral Small 4 ويدعم [التفكير القابل للضبط](https://docs.mistral.ai/capabilities/reasoning/adjustable) على API إكمالات المحادثة عبر `reasoning_effort` (`none` يقلل التفكير الإضافي في الإخراج إلى الحد الأدنى؛ ويعرض `high` آثار التفكير الكاملة قبل الإجابة النهائية).

    يربط OpenClaw مستوى **التفكير** في الجلسة بـ API الخاص بـ Mistral:

    | مستوى التفكير في OpenClaw                          | `reasoning_effort` في Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **متوقف** / **أدنى حد**                            | `none`                     |
    | **منخفض** / **متوسط** / **مرتفع** / **xhigh** / **تكيفي** / **أقصى** | `high`     |

    <Note>
    لا تستخدم نماذج كتالوج Mistral المضمّنة الأخرى هذا المعامل. استمر في استخدام نماذج `magistral-*` عندما تريد سلوك Mistral الأصلي الذي يعطي الأولوية للتفكير.
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
    - تستخدم مصادقة Mistral `MISTRAL_API_KEY` (ترويسة Bearer).
    - يكون عنوان URL الأساسي للمزوّد افتراضيًا `https://api.mistral.ai/v1` ويقبل شكل طلب إكمالات المحادثة القياسي المتوافق مع OpenAI.
    - نموذج الإعداد الأولي الافتراضي هو `mistral/mistral-large-latest`.
    - لا تتجاوز عنوان URL الأساسي ضمن `models.providers.mistral.baseUrl` إلا عندما تنشر Mistral صراحةً نقطة نهاية إقليمية تحتاج إليها.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك الانتقال عند الفشل.
  </Card>
  <Card title="فهم الوسائط" href="/ar/nodes/media-understanding" icon="microphone">
    إعداد النسخ الصوتي واختيار المزوّد.
  </Card>
</CardGroup>
