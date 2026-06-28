---
read_when:
    - تريد تحويل الكلام إلى نص باستخدام Deepgram لمرفقات الصوت
    - تريد النسخ المتدفق باستخدام Deepgram لـ Voice Call
    - تحتاج إلى مثال سريع على تهيئة Deepgram
summary: النسخ باستخدام Deepgram للملاحظات الصوتية الواردة
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:56:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Deepgram هي واجهة API لتحويل الكلام إلى نص. وفي OpenClaw تُستخدم لنسخ
الصوت/الملاحظات الصوتية الواردة عبر `tools.media.audio`، وللنسخ المتدفق في Voice Call
عبر `plugins.entries.voice-call.config.streaming`.

في النسخ الدفعي، يرفع OpenClaw ملف الصوت كاملًا إلى Deepgram
ويحقن النص المنسوخ في مسار الرد (`{{Transcript}}` +
كتلة `[Audio]`). أما في النسخ المتدفق لـ Voice Call، فيمرّر OpenClaw
إطارات G.711 u-law الحية عبر نقطة نهاية WebSocket ‏`listen` الخاصة بـ Deepgram
ويصدر نصوصًا جزئية أو نهائية عندما تعيدها Deepgram.

| التفصيل       | القيمة                                                     |
| ------------- | ---------------------------------------------------------- |
| الموقع        | [deepgram.com](https://deepgram.com)                       |
| المستندات     | [developers.deepgram.com](https://developers.deepgram.com) |
| المصادقة      | `DEEPGRAM_API_KEY`                                         |
| النموذج الافتراضي | `nova-3`                                               |

## البدء

<Steps>
  <Step title="عيّن مفتاح API الخاص بك">
    أضف مفتاح Deepgram API إلى البيئة:

    ```
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
    أرسل رسالة صوتية عبر أي قناة متصلة. سيقوم OpenClaw بنسخها
    عبر Deepgram وحقن النص في مسار الرد.
  </Step>
</Steps>

## خيارات التهيئة

| الخيار            | المسار                                                       | الوصف                                 |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | معرّف نموذج Deepgram (الافتراضي: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | تلميح اللغة (اختياري)                 |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | تمكين اكتشاف اللغة (اختياري)          |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | تمكين علامات الترقيم (اختياري)        |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | تمكين التنسيق الذكي (اختياري)         |

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

## النسخ المتدفق في Voice Call

تسجّل Plugin المجمّعة `deepgram` أيضًا موفّر نسخ فوري
لـ Plugin الخاصة بـ Voice Call.

| الإعداد         | مسار التهيئة                                                           | الافتراضي                         |
| --------------- | ---------------------------------------------------------------------- | --------------------------------- |
| مفتاح API       | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | يعود إلى `DEEPGRAM_API_KEY`       |
| النموذج         | `...deepgram.model`                                                    | `nova-3`                          |
| اللغة           | `...deepgram.language`                                                 | (غير معيّنة)                      |
| الترميز         | `...deepgram.encoding`                                                 | `mulaw`                           |
| معدل العينة     | `...deepgram.sampleRate`                                               | `8000`                            |
| Endpointing     | `...deepgram.endpointingMs`                                            | `800`                             |
| النتائج المرحلية | `...deepgram.interimResults`                                          | `true`                            |

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
تستقبل Voice Call الصوت الهاتفي بصيغة G.711 u-law عند 8 kHz. ويكون
موفّر البث في Deepgram مضبوطًا افتراضيًا على `encoding: "mulaw"` و`sampleRate: 8000`، بحيث
يمكن تمرير إطارات وسائط Twilio مباشرة.
</Note>

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    تتبع المصادقة ترتيب auth القياسي الخاص بالموفّر. ويُعد `DEEPGRAM_API_KEY`
    أبسط مسار.
  </Accordion>
  <Accordion title="Proxy ونقاط النهاية المخصصة">
    تجاوز نقاط النهاية أو الرؤوس باستخدام `tools.media.audio.baseUrl` و
    `tools.media.audio.headers` عند استخدام proxy.
  </Accordion>
  <Accordion title="سلوك الإخراج">
    يتبع الإخراج قواعد الصوت نفسها كما في الموفّرين الآخرين (حدود الحجم، والمهلات،
    وحقن النص المنسوخ).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="أدوات الوسائط" href="/ar/tools/media-overview" icon="photo-film">
    نظرة عامة على خط معالجة الصوت والصور والفيديو.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="gear">
    مرجع التهيئة الكامل بما في ذلك إعدادات أداة الوسائط.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
  <Card title="الأسئلة الشائعة" href="/ar/help/faq" icon="circle-question">
    الأسئلة المتكررة حول إعداد OpenClaw.
  </Card>
</CardGroup>
