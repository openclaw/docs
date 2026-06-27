---
read_when:
    - تريد Gradium لتحويل النص إلى كلام
    - تحتاج إلى تكوين مفتاح API لـ Gradium أو الصوت أو رمز التوجيه
summary: استخدم تحويل النص إلى كلام من Gradium في OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:25:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) مزوّد تحويل النص إلى كلام لـ OpenClaw. يمكن لـ Plugin إنشاء ردود صوتية عادية (WAV)، ومخرجات Opus متوافقة مع الملاحظات الصوتية، وصوت u-law بتردد 8 كيلوهرتز لواجهات الاتصال الهاتفي.

| الخاصية      | القيمة                                |
| ------------- | ------------------------------------ |
| معرّف المزوّد   | `gradium`                            |
| المصادقة          | `GRADIUM_API_KEY` أو الإعداد `apiKey` |
| عنوان URL الأساسي      | `https://api.gradium.ai` (افتراضي)   |
| الصوت الافتراضي | `Emma` (`YTpq7expH9539ERJ`)          |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## الإعداد

أنشئ مفتاح Gradium API، ثم وفّره لـ OpenClaw إما عبر متغير بيئة أو مفتاح الإعداد.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

يتحقق Plugin أولاً من `apiKey` المحلول، ثم يعود إلى متغير البيئة `GRADIUM_API_KEY`.

## الإعدادات

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| المفتاح                                             | النوع   | الوصف                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | مفتاح API المحلول. يدعم `${ENV}` ومراجع الأسرار.                                          |
| `messages.tts.providers.gradium.baseUrl`        | string | يتجاوز أصل API. تُزال الشرطات المائلة اللاحقة. القيمة الافتراضية هي `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | معرّف الصوت الافتراضي المستخدم عند عدم وجود تجاوز بتوجيه.                                  |

يُختار تنسيق الصوت الناتج تلقائياً بواسطة وقت التشغيل استناداً إلى الواجهة المستهدفة، ولا يمكن ضبطه من `openclaw.json`. راجع [المخرجات](#output) أدناه.

## الأصوات

| الاسم      | معرّف الصوت           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

الصوت الافتراضي: Emma.

### تجاوز الصوت لكل رسالة

عندما تسمح سياسة الكلام النشطة بتجاوزات الصوت، يمكنك تبديل الأصوات ضمن النص باستخدام رمز توجيه. استخدم `speakerVoiceId` لمعرّفات الصوت الأصلية لدى المزوّد.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

إذا عطّلت سياسة الكلام تجاوزات الصوت، يُستهلك التوجيه ولكن يُتجاهل.

## المخرجات

يختار وقت التشغيل تنسيق المخرجات من الواجهة المستهدفة. لا ينشئ المزوّد تنسيقات أخرى حالياً.

| الهدف         | التنسيق      | امتداد الملف | معدل العينة | علم التوافق الصوتي |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| صوت قياسي | `wav`       | `.wav`   | المزوّد    | لا                    |
| ملاحظة صوتية     | `opus`      | `.opus`  | المزوّد    | نعم                   |
| اتصال هاتفي      | `ulaw_8000` | غير متاح      | 8 كيلوهرتز       | غير متاح                   |

## ترتيب الاختيار التلقائي

من بين مزوّدي TTS المضبوطين، ترتيب الاختيار التلقائي لـ Gradium هو `30`. راجع [تحويل النص إلى كلام](/ar/tools/tts) لمعرفة كيف يختار OpenClaw المزوّد النشط عندما لا يكون `messages.tts.provider` مثبتاً.

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [نظرة عامة على الوسائط](/ar/tools/media-overview)
