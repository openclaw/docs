---
read_when:
    - تريد استخدام نماذج Mistral في OpenClaw
    - تريد نسخًا فوريًا باستخدام Voxtral للمكالمة الصوتية
    - تحتاج إلى إعداد مفتاح Mistral API ومراجع النماذج
summary: استخدم نماذج Mistral وخدمة النسخ الصوتي Voxtral مع OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T06:23:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

يسجّل Plugin المضمّن `mistral` أربعة عقود: إكمالات المحادثة، وفهم الوسائط (نسخ Voxtral بالدُفعات)، والتحويل الفوري للكلام إلى نص لمكالمات الصوت (Voxtral Realtime)، وتضمينات الذاكرة (`mistral-embed`).

| الخاصية         | القيمة                                       |
| ---------------- | ------------------------------------------- |
| معرّف المزوّد      | `mistral`                                   |
| Plugin           | مضمّن، ومفعّل افتراضيًا                 |
| متغير بيئة المصادقة     | `MISTRAL_API_KEY`                           |
| علامة الإعداد الأولي  | `--auth-choice mistral-api-key`             |
| علامة CLI المباشرة  | `--mistral-api-key <key>`                   |
| واجهة API              | متوافقة مع OpenAI (`openai-completions`)    |
| عنوان URL الأساسي         | `https://api.mistral.ai/v1`                 |
| النموذج الافتراضي    | `mistral/mistral-large-latest`              |
| نموذج التضمين  | `mistral-embed`                             |
| Voxtral بالدُفعات    | `voxtral-mini-latest` (نسخ الصوت) |
| Voxtral الفوري | `voxtral-mini-transcribe-realtime-2602`     |

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
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
  <Step title="تحقق من توفر النموذج">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## كتالوج نماذج اللغة الكبيرة المضمّن

| مرجع النموذج                        | الإدخال       | السياق | الحد الأقصى للإخراج | ملاحظات                                                 |
| -------------------------------- | ----------- | ------- | ---------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | نص، صورة | 262,144 | 16,384     | النموذج الافتراضي                                         |
| `mistral/mistral-medium-2508`    | نص، صورة | 262,144 | 8,192      | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | نص، صورة | 262,144 | 8,192      | Mistral Medium 3.5؛ استدلال قابل للضبط              |
| `mistral/mistral-small-latest`   | نص، صورة | 262,144 | 16,384     | أحدث إصدار من Mistral Small 4؛ يمكن ضبط `reasoning_effort` |
| `mistral/mistral-small-2603`     | نص، صورة | 262,144 | 16,384     | إصدار مثبت من Mistral Small 4؛ يمكن ضبط `reasoning_effort` |
| `mistral/pixtral-large-latest`   | نص، صورة | 128,000 | 32,768     | Pixtral                                               |
| `mistral/codestral-latest`       | نص        | 256,000 | 4,096      | البرمجة                                                |
| `mistral/devstral-medium-latest` | نص        | 262,144 | 32,768     | Devstral 2                                            |
| `mistral/magistral-small`        | نص        | 128,000 | 40,000     | يدعم الاستدلال                                     |

استعرض صف الكتالوج المضمّن قبل تغيير الإعدادات:

```bash
openclaw models list --all --provider mistral --plain
```

نفّذ اختبارًا أوليًا لنموذج من دون تشغيل Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## نسخ الصوت (Voxtral)

استخدم Voxtral لنسخ الصوت بالدُفعات عبر مسار فهم الوسائط:

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

## التحويل المتدفق للكلام إلى نص لمكالمات الصوت

يسجّل Plugin المضمّن `mistral` خدمة Voxtral Realtime كمزوّد للتحويل المتدفق للكلام إلى نص لمكالمات الصوت.

| الإعداد      | مسار الإعداد                                                            | الافتراضي                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| مفتاح API      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | يستخدم `MISTRAL_API_KEY` عند عدم توفره         |
| النموذج        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| الترميز     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| معدل أخذ العينات  | `...mistral.sampleRate`                                                | `8000`                                  |
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
يضبط OpenClaw افتراضيًا التحويل الفوري للكلام إلى نص من Mistral على `pcm_mulaw` بمعدل 8 كيلوهرتز، كي تتمكن مكالمات الصوت من تمرير إطارات وسائط Twilio مباشرةً. استخدم `encoding: "pcm_s16le"` وقيمة `sampleRate` مطابقة فقط إذا كان التدفق الوارد لديك بتنسيق PCM خام بالفعل.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الاستدلال القابل للضبط">
    تدعم النماذج `mistral/mistral-small-latest` و`mistral/mistral-small-2603` و`mistral/mistral-medium-3-5` [الاستدلال القابل للضبط](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) في واجهة API لإكمالات المحادثة عبر `reasoning_effort` (تقلل `none` التفكير الإضافي في الإخراج؛ وتُظهر `high` آثار التفكير الكاملة قبل الإجابة النهائية).

    يربط OpenClaw مستوى **التفكير** في الجلسة بواجهة API الخاصة بـ Mistral:

    | مستوى التفكير في OpenClaw                                              | `reasoning_effort` في Mistral |
    | ----------------------------------------------------------------------- | --------------------------- |
    | **متوقف** / **أدنى حد**                                                 | `none`                      |
    | **منخفض** / **متوسط** / **مرتفع** / **مرتفع جدًا** / **تكيفي** / **أقصى حد** | `high`                       |

    <Warning>
    تجنّب الجمع بين وضع الاستدلال في Medium 3.5 و`temperature: 0`؛ فقد أُبلغ أن واجهة HTTP API الخاصة بـ Mistral ترفض الجمع بين `reasoning_effort="high"` و`temperature: 0` باستجابة 400. اترك درجة الحرارة دون تعيين، أو عطّل التفكير أو اضبطه على أدنى حد كي يرسل OpenClaw القيمة `reasoning_effort: "none"` قبل تعيين درجة حرارة منخفضة.
    </Warning>

    مثال على إعداد خاص بالنموذج لاستدلال Medium 3.5:

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
    لا تستخدم نماذج كتالوج Mistral المضمّنة الأخرى هذا المَعْلَم. واصل استخدام نماذج `magistral-*` عندما تريد سلوك Mistral الأصلي الذي يعطي الأولوية للاستدلال.
    </Note>

  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يمكن لـ Mistral توفير تضمينات الذاكرة عبر `/v1/embeddings` (النموذج الافتراضي: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="المصادقة وعنوان URL الأساسي">
    - تستخدم مصادقة Mistral المتغير `MISTRAL_API_KEY` (ترويسة Bearer).
    - يكون عنوان URL الأساسي للمزوّد افتراضيًا `https://api.mistral.ai/v1`، ويقبل بنية طلب إكمالات المحادثة القياسية المتوافقة مع OpenAI.
    - النموذج الافتراضي للإعداد الأولي هو `mistral/mistral-large-latest`.
    - لا تتجاوز عنوان URL الأساسي ضمن `models.providers.mistral.baseUrl` إلا عندما تنشر Mistral صراحةً نقطة نهاية إقليمية تحتاج إليها.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="فهم الوسائط" href="/ar/nodes/media-understanding" icon="microphone">
    إعداد نسخ الصوت واختيار المزوّد.
  </Card>
</CardGroup>
