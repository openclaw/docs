---
read_when:
    - تريد استخدام تحويل الكلام إلى نص من SenseAudio للمرفقات الصوتية
    - تحتاج إلى متغير البيئة لمفتاح SenseAudio API أو مسار إعدادات الصوت
summary: تحويل الدفعات من الكلام إلى نص باستخدام SenseAudio للملاحظات الصوتية الواردة
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T06:29:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

ينسخ SenseAudio مرفقات الصوت والملاحظات الصوتية الواردة عبر مسار `tools.media.audio` المشترك في OpenClaw. يرسل OpenClaw الصوت متعدد الأجزاء إلى نقطة نهاية النسخ المتوافقة مع OpenAI، ويدرج النص المُعاد بوصفه `{{Transcript}}` بالإضافة إلى كتلة `[Audio]`.

| الخاصية              | القيمة                                           |
| -------------------- | ------------------------------------------------ |
| معرّف المزوّد        | `senseaudio`                                     |
| Plugin               | مضمّن، `enabledByDefault: true`                  |
| العقد                | `mediaUnderstandingProviders` (الصوت)            |
| متغير بيئة المصادقة  | `SENSEAUDIO_API_KEY`                             |
| النموذج الافتراضي    | `senseaudio-asr-pro-1.5-260319`                  |
| عنوان URL الافتراضي  | `https://api.senseaudio.cn/v1`                   |
| الموقع الإلكتروني    | [senseaudio.cn](https://senseaudio.cn)           |
| الوثائق              | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## بدء الاستخدام

<Steps>
  <Step title="عيّن مفتاح API">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="فعّل مزوّد الصوت">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="أرسل ملاحظة صوتية">
    أرسل رسالة صوتية عبر أي قناة متصلة. يرفع OpenClaw الصوت
    إلى SenseAudio ويستخدم النص المنسوخ في مسار الرد.
  </Step>
</Steps>

## الخيارات

| الخيار     | المسار                                | الوصف                                      |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | معرّف نموذج ASR في SenseAudio              |
| `language` | `tools.media.audio.models[].language` | تلميح اختياري للغة                         |
| `prompt`   | `tools.media.audio.prompt`            | موجّه اختياري للنسخ                        |
| `baseUrl`  | `tools.media.audio.baseUrl` أو النموذج | تجاوز العنوان الأساسي المتوافق مع OpenAI   |
| `headers`  | `tools.media.audio.request.headers`   | ترويسات إضافية للطلب                       |

<Note>
لا يدعم SenseAudio في OpenClaw سوى تحويل الكلام إلى نص على دفعات. ويواصل النسخ الفوري للمكالمات الصوتية
استخدام المزوّدين الذين يدعمون تحويل الكلام إلى نص عبر البث.
</Note>

## ذو صلة

- [فهم الوسائط (الصوت)](/ar/nodes/audio)
- [مزوّدو النماذج](/ar/concepts/model-providers)
