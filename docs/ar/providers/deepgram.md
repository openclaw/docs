---
read_when:
    - تريد استخدام تحويل الكلام إلى نص من Deepgram للمرفقات الصوتية
    - تريد النسخ المتدفق من Deepgram للمكالمات الصوتية
    - تحتاج إلى مثال سريع لإعداد Deepgram
summary: نسخ Deepgram للملاحظات الصوتية الواردة
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T14:59:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram هي واجهة API لتحويل الكلام إلى نص. يستخدمها OpenClaw لنسخ الصوت الوارد/الملاحظات الصوتية
عبر `tools.media.audio`، ولتحويل الكلام إلى نص المتدفق في Voice Call
عبر `plugins.entries.voice-call.config.streaming`.

يرفع النسخ الدفعي ملف الصوت الكامل إلى Deepgram ويُدرج
النص المنسوخ في مسار الرد (كتلة `{{Transcript}}` + `[Audio]`).
يمرر البث في Voice Call إطارات G.711 u-law المباشرة عبر نقطة نهاية
WebSocket `listen` الخاصة بـ Deepgram، ويُصدر النصوص المنسوخة الجزئية/النهائية عند إرجاعها من Deepgram.

| التفصيل        | القيمة                                                      |
| ------------- | ---------------------------------------------------------- |
| الموقع الإلكتروني       | [deepgram.com](https://deepgram.com)                       |
| الوثائق          | [developers.deepgram.com](https://developers.deepgram.com) |
| المصادقة          | `DEEPGRAM_API_KEY`                                         |
| النموذج الافتراضي | `nova-3`                                                   |

## بدء الاستخدام

<Steps>
  <Step title="عيّن مفتاح API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="فعّل موفر الصوت">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="أرسل ملاحظة صوتية">
    أرسل رسالة صوتية عبر أي قناة متصلة. ينسخها OpenClaw
    عبر Deepgram ويُدرج النص المنسوخ في مسار الرد.
  </Step>
</Steps>

## خيارات الإعداد

| الخيار     | المسار                                  | الوصف                           |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | معرّف نموذج Deepgram (الافتراضي: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | تلميح اللغة (اختياري)              |

يدمج `providerOptions.deepgram` معاملات الاستعلام الإضافية مباشرةً في
طلب Deepgram ‏`/listen`، لذا يعمل أي اسم معامل تدعمه Deepgram
(على سبيل المثال `detect_language` و`punctuate` و`smart_format`):

<Tabs>
  <Tab title="مع تلميح اللغة">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="مع خيارات Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## تحويل الكلام إلى نص المتدفق في Voice Call

يسجّل Plugin المضمّن `deepgram` أيضًا موفر نسخ في الوقت الفعلي
لـ Plugin ‏Voice Call.

| الإعداد         | مسار الإعداد                                                             | الافتراضي                                      |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| مفتاح API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | يعود إلى `DEEPGRAM_API_KEY` عند عدم توفره             |
| عنوان URL الأساسي        | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` أو واجهة API العامة لـ Deepgram |
| النموذج           | `...deepgram.model`                                                     | `nova-3`                                     |
| اللغة        | `...deepgram.language`                                                  | (غير معيّنة)                                      |
| الترميز        | `...deepgram.encoding`                                                  | `mulaw`                                      |
| معدل أخذ العينات     | `...deepgram.sampleRate`                                                | `8000`                                       |
| تحديد نقطة النهاية     | `...deepgram.endpointingMs`                                             | `800`                                        |
| النتائج المؤقتة | `...deepgram.interimResults`                                            | `true`                                       |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

لاستخدام [نقطة نهاية مخصصة لـ Deepgram](https://developers.deepgram.com/reference/custom-endpoints)،
عيّن `baseUrl` إلى جذر نقطة النهاية، بما في ذلك أي مسار أساسي ولكن دون `/listen`.
تقبل نقاط النهاية في الوقت الفعلي `http://` و`https://` و`ws://` و`wss://`. يُحوَّل HTTP
إلى WS، ويُحوَّل HTTPS إلى WSS، بينما تظل مخططات WebSocket الصريحة دون تغيير.
تفشل عناوين URL المشوهة والمخططات الأخرى أثناء إعداد الجلسة.

<Note>
يستقبل Voice Call صوت الاتصالات الهاتفية بتنسيق G.711 u-law ومعدل 8 kHz. يستخدم موفر
البث في Deepgram القيمتين `encoding: "mulaw"` و`sampleRate: 8000` افتراضيًا، لذا
يمكن تمرير إطارات وسائط Twilio مباشرةً.
</Note>

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    تتبع المصادقة ترتيب مصادقة الموفر القياسي. يُعد `DEEPGRAM_API_KEY`
    المسار الأبسط.
  </Accordion>
  <Accordion title="الوكيل ونقاط النهاية المخصصة">
    تجاوز نقاط النهاية أو الترويسات باستخدام `tools.media.audio.baseUrl` و
    `tools.media.audio.headers` عند استخدام وكيل.
  </Accordion>
  <Accordion title="سلوك المخرجات">
    تتبع المخرجات قواعد الصوت نفسها المتّبعة لدى الموفرين الآخرين (حدود الحجم، والمهلات،
    وإدراج النص المنسوخ).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أدوات الوسائط" href="/ar/tools/media-overview" icon="photo-film">
    نظرة عامة على مسار معالجة الصوت والصور والفيديو.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل، بما في ذلك إعدادات أدوات الوسائط.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
  <Card title="الأسئلة الشائعة" href="/ar/help/faq" icon="circle-question">
    الأسئلة المتكررة حول إعداد OpenClaw.
  </Card>
</CardGroup>
