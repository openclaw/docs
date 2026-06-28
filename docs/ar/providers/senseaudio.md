---
read_when:
    - تريد استخدام تحويل الكلام إلى نص من SenseAudio للمرفقات الصوتية
    - تحتاج إلى متغير البيئة الخاص بمفتاح واجهة برمجة تطبيقات SenseAudio أو مسار إعدادات الصوت
summary: تحويل الكلام إلى نص على دفعات باستخدام SenseAudio للملاحظات الصوتية الواردة
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T08:11:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
    postprocess_version: locale-links-v1
---

SenseAudio يمكنه نسخ مرفقات الصوت الواردة والملاحظات الصوتية عبر مسار `tools.media.audio` المشترك في OpenClaw. يرسل OpenClaw الصوت متعدد الأجزاء إلى نقطة نهاية النسخ المتوافقة مع OpenAI ويحقن النص المُعاد في صورة `{{Transcript}}` إضافةً إلى كتلة `[Audio]`.

| الخاصية      | القيمة                                            |
| ------------- | ------------------------------------------------ |
| معرّف المزوّد   | `senseaudio`                                     |
| Plugin        | مضمّن، `enabledByDefault: true`                |
| العقد      | `mediaUnderstandingProviders` (الصوت)            |
| متغير بيئة المصادقة  | `SENSEAUDIO_API_KEY`                             |
| النموذج الافتراضي | `senseaudio-asr-pro-1.5-260319`                  |
| عنوان URL الافتراضي   | `https://api.senseaudio.cn/v1`                   |
| الموقع الإلكتروني       | [senseaudio.cn](https://senseaudio.cn)           |
| الوثائق          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## بدء الاستخدام

<Steps>
  <Step title="عيّن مفتاح API الخاص بك">
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
    أرسل رسالة صوتية عبر أي قناة متصلة. يرفع OpenClaw الصوت إلى SenseAudio ويستخدم النص المنسوخ في مسار الرد.
  </Step>
</Steps>

## الخيارات

| الخيار     | المسار                                  | الوصف                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | معرّف نموذج ASR في SenseAudio             |
| `language` | `tools.media.audio.models[].language` | تلميح لغة اختياري              |
| `prompt`   | `tools.media.audio.prompt`            | موجّه نسخ اختياري       |
| `baseUrl`  | `tools.media.audio.baseUrl` أو النموذج  | تجاوز الأساس المتوافق مع OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | ترويسات طلب إضافية               |

<Note>
SenseAudio يدعم STT الدفعية فقط في OpenClaw. يستمر نسخ المكالمات الصوتية في الوقت الفعلي باستخدام المزوّدين الذين يدعمون STT المتدفق.
</Note>

## ذو صلة

- [فهم الوسائط (الصوت)](/ar/nodes/audio)
- [مزوّدو النماذج](/ar/concepts/model-providers)
