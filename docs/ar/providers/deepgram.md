---
read_when:
    - تريد استخدام تحويل الكلام إلى نص من Deepgram للمرفقات الصوتية
    - تريد النسخ المتدفق عبر Deepgram للمكالمات الصوتية
    - تحتاج إلى مثال سريع لإعداد Deepgram
summary: نسخ الملاحظات الصوتية الواردة باستخدام Deepgram
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T06:28:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram هي واجهة API لتحويل الكلام إلى نص. يستخدمها OpenClaw لنسخ الصوت الوارد/الملاحظات الصوتية
عبر `tools.media.audio`، ولتحويل الكلام إلى نص أثناء بث المكالمات الصوتية
عبر `plugins.entries.voice-call.config.streaming`.

يرفع النسخ الدفعي ملف الصوت كاملًا إلى Deepgram ويدرج
النص المنسوخ في مسار معالجة الرد (`{{Transcript}}` + كتلة `[Audio]`).
يمرر بث المكالمات الصوتية إطارات G.711 u-law المباشرة عبر نقطة نهاية WebSocket
‏`listen` الخاصة بـ Deepgram، ويصدر النصوص المنسوخة الجزئية/النهائية عندما تعيدها
Deepgram.

| التفصيل        | القيمة                                                      |
| ------------- | ---------------------------------------------------------- |
| الموقع الإلكتروني       | [deepgram.com](https://deepgram.com)                       |
| التوثيق          | [developers.deepgram.com](https://developers.deepgram.com) |
| المصادقة          | `DEEPGRAM_API_KEY`                                         |
| النموذج الافتراضي | `nova-3`                                                   |

## بدء الاستخدام

<Steps>
  <Step title="عيّن مفتاح API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="فعّل موفّر الصوت">
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
    عبر Deepgram ويدرج النص المنسوخ في مسار معالجة الرد.
  </Step>
</Steps>

## خيارات الإعداد

| الخيار     | المسار                                  | الوصف                           |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | معرّف نموذج Deepgram (الافتراضي: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | تلميح اللغة (اختياري)              |

يدمج `providerOptions.deepgram` معاملات استعلام إضافية مباشرةً في
طلب Deepgram‏ `/listen`، لذا يعمل أي اسم معامل تدعمه Deepgram
(مثل `detect_language` و`punctuate` و`smart_format`):

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

## تحويل الكلام إلى نص أثناء بث المكالمات الصوتية

يسجّل Plugin‏ `deepgram` المضمّن أيضًا موفّرًا للنسخ في الوقت الفعلي
لـ Plugin المكالمات الصوتية.

| الإعداد         | مسار الإعداد                                                             | الافتراضي                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| مفتاح API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | يرجع إلى `DEEPGRAM_API_KEY` |
| النموذج           | `...deepgram.model`                                                     | `nova-3`                         |
| اللغة        | `...deepgram.language`                                                  | (غير معيّنة)                          |
| الترميز        | `...deepgram.encoding`                                                  | `mulaw`                          |
| معدل أخذ العينات     | `...deepgram.sampleRate`                                                | `8000`                           |
| تحديد نهاية المقطع     | `...deepgram.endpointingMs`                                             | `800`                            |
| النتائج المرحلية | `...deepgram.interimResults`                                            | `true`                           |

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

<Note>
تتلقى المكالمات الصوتية صوت الاتصالات الهاتفية بصيغة G.711 u-law وبتردد 8 كيلوهرتز. يستخدم موفّر
البث عبر Deepgram افتراضيًا `encoding: "mulaw"` و`sampleRate: 8000`، لذا
يمكن تمرير إطارات وسائط Twilio مباشرةً.
</Note>

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    تتبع المصادقة الترتيب القياسي لمصادقة الموفّرين. يُعد `DEEPGRAM_API_KEY`
    المسار الأبسط.
  </Accordion>
  <Accordion title="الوكيل ونقاط النهاية المخصصة">
    تجاوز نقاط النهاية أو الترويسات باستخدام `tools.media.audio.baseUrl` و
    `tools.media.audio.headers` عند استخدام وكيل.
  </Accordion>
  <Accordion title="سلوك المخرجات">
    تتبع المخرجات قواعد الصوت نفسها المتبعة لدى الموفّرين الآخرين (حدود الحجم، والمهلات،
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
