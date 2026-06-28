---
read_when:
    - تريد استخدام نماذج Mistral في OpenClaw
    - تريد النسخ الفوري من Voxtral لمكالمة صوتية
    - تحتاج إلى تهيئة مفتاح واجهة برمجة التطبيقات لـ Mistral ومراجع النماذج
summary: استخدم نماذج Mistral ونسخ Voxtral الصوتي مع OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:58:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw يتضمّن Plugin Mistral مضمّنًا يسجّل أربعة عقود: إكمالات المحادثة، وفهم الوسائط (نسخ Voxtral الدفعي)، وSTT الفوري لـ Voice Call (Voxtral Realtime)، وتضمينات الذاكرة (`mistral-embed`).

| الخاصية         | القيمة                                      |
| ---------------- | ------------------------------------------- |
| معرّف المزوّد      | `mistral`                                   |
| Plugin           | مضمّن، `enabledByDefault: true`             |
| متغيّر بيئة المصادقة | `MISTRAL_API_KEY`                           |
| علم التهيئة       | `--auth-choice mistral-api-key`             |
| علم CLI المباشر   | `--mistral-api-key <key>`                   |
| API              | متوافق مع OpenAI (`openai-completions`)     |
| عنوان URL الأساسي | `https://api.mistral.ai/v1`                 |
| النموذج الافتراضي | `mistral/mistral-large-latest`              |
| نموذج التضمين     | `mistral-embed`                             |
| Voxtral الدفعي    | `voxtral-mini-latest` (نسخ الصوت)           |
| Voxtral الفوري    | `voxtral-mini-transcribe-realtime-2602`     |

## البدء

<Steps>
  <Step title="Get your API key">
    أنشئ مفتاح API في [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    أو مرّر المفتاح مباشرة:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## فهرس LLM المضمّن

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
هو نموذج Medium المدمج الحالي في الفهرس المضمّن: أوزان كثيفة بحجم 128B،
وإدخال نصوص وصور، وسياق 256K، واستدعاء الدوال، وإخراج منظّم، وبرمجة،
واستدلال قابل للضبط عبر Chat Completions API. استخدم
`mistral/mistral-medium-3-5` عندما تريد نموذج Mistral الأحدث الموحّد
للاستخدامات الوكيلية/البرمجية بدلًا من النموذج الافتراضي `mistral/mistral-large-latest`.

يشحن OpenClaw حاليًا فهرس Mistral المضمّن هذا:

| مرجع النموذج                    | الإدخال     | السياق | أقصى إخراج | ملاحظات                                                         |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | نص، صورة    | 262,144 | 16,384     | النموذج الافتراضي                                                |
| `mistral/mistral-medium-2508`    | نص، صورة    | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | نص، صورة    | 262,144 | 8,192      | Mistral Medium 3.5؛ استدلال قابل للضبط                            |
| `mistral/mistral-small-latest`   | نص، صورة    | 128,000 | 16,384     | Mistral Small 4؛ استدلال قابل للضبط عبر API `reasoning_effort`    |
| `mistral/pixtral-large-latest`   | نص، صورة    | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | نص          | 256,000 | 4,096      | البرمجة                                                          |
| `mistral/devstral-medium-latest` | نص          | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | نص          | 128,000 | 40,000     | مفعّل للاستدلال                                                  |

بعد التهيئة، نفّذ اختبار دخان لـ Medium 3.5 من دون تشغيل Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

لتصفّح صف الفهرس المضمّن قبل تغيير الإعدادات:

```bash
openclaw models list --all --provider mistral --plain
```

## نسخ الصوت (Voxtral)

استخدم Voxtral لنسخ الصوت دفعيًا عبر مسار
فهم الوسائط.

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

## STT المتدفق لـ Voice Call

يسجّل Plugin `mistral` المضمّن Voxtral Realtime كمزوّد STT
متدفق لـ Voice Call.

| الإعداد      | مسار الإعداد                                                           | الافتراضي                              |
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
يضبط OpenClaw افتراضيًا STT الفوري في Mistral على `pcm_mulaw` عند 8 kHz حتى تتمكن Voice Call
من تمرير إطارات وسائط Twilio مباشرة. استخدم `encoding: "pcm_s16le"` و
`sampleRate` مطابقًا فقط إذا كان التدفق المصدر لديك PCM خامًا بالفعل.
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Adjustable reasoning">
    يدعم `mistral/mistral-small-latest` (Mistral Small 4) و`mistral/mistral-medium-3-5` [الاستدلال القابل للضبط](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) على Chat Completions API عبر `reasoning_effort` (`none` يقلّل التفكير الإضافي في الإخراج؛ و`high` يعرض آثار التفكير الكاملة قبل الإجابة النهائية). توصي Mistral باستخدام `reasoning_effort="high"` لحالات استخدام Medium 3.5 الوكيلية والبرمجية.

    يربط OpenClaw مستوى **thinking** في الجلسة بـ API الخاص بـ Mistral:

    | مستوى التفكير في OpenClaw                          | `reasoning_effort` في Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    لا تجمع وضع الاستدلال في Medium 3.5 مع `temperature: 0`. ترفض
    Mistral HTTP API الجمع بين `reasoning_effort="high"` و`temperature: 0` باستجابة 400.
    اترك temperature غير مضبوط حتى تستخدم Mistral قيمتها الافتراضية، أو اتبع
    [الإعدادات الموصى بها لـ Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    واستخدم `temperature: 0.7` للاستدلال العالي. للحصول على إجابات مباشرة
    حتمية، أوقف التفكير أو اجعله minimal حتى يرسل OpenClaw
    `reasoning_effort: "none"` قبل أن تخفّض temperature.
    </Warning>

    مثال على إعداد محدود بالنموذج لاستدلال Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    لا تستخدم نماذج فهرس Mistral المضمّنة الأخرى هذا المعامل. واصل استخدام نماذج `magistral-*` عندما تريد سلوك Mistral الأصلي الذي يقدّم الاستدلال أولًا.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    يمكن لـ Mistral تقديم تضمينات الذاكرة عبر `/v1/embeddings` (النموذج الافتراضي: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - تستخدم مصادقة Mistral `MISTRAL_API_KEY` (ترويسة Bearer).
    - يكون عنوان URL الأساسي للمزوّد افتراضيًا `https://api.mistral.ai/v1` ويقبل شكل طلب chat-completions القياسي المتوافق مع OpenAI.
    - نموذج التهيئة الافتراضي هو `mistral/mistral-large-latest`.
    - تجاوز عنوان URL الأساسي ضمن `models.providers.mistral.baseUrl` فقط عندما تنشر Mistral صراحة نقطة نهاية إقليمية تحتاج إليها.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Media understanding" href="/ar/nodes/media-understanding" icon="microphone">
    إعداد نسخ الصوت واختيار المزوّد.
  </Card>
</CardGroup>
