---
read_when:
    - تريد استخدام Gradium لتحويل النص إلى كلام
    - تحتاج إلى تهيئة مفتاح Gradium API أو الصوت أو رمز التوجيه
summary: استخدام تحويل النص إلى كلام من Gradium في OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-07-16T14:51:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) هو مزوّد لتحويل النص إلى كلام في OpenClaw. وهو يُنتج ردودًا صوتية قياسية (WAV)، ومخرجات Opus متوافقة مع الملاحظات الصوتية، وصوت u-law بتردد 8 kHz لواجهات الاتصالات الهاتفية.

| الخاصية      | القيمة                                |
| ------------- | ------------------------------------ |
| معرّف المزوّد   | `gradium`                            |
| المصادقة          | `GRADIUM_API_KEY` أو إعداد `apiKey` |
| عنوان URL الأساسي      | `https://api.gradium.ai` (الافتراضي)   |
| الصوت الافتراضي | `Emma` (`YTpq7expH9539ERJ`)          |

## تثبيت Plugin

Gradium هو Plugin خارجي رسمي. ثبّته، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## الإعداد

أنشئ مفتاح Gradium API، ثم أتحه عبر متغير بيئة أو مفتاح الإعداد. للإعداد أولوية على متغير البيئة.

<Tabs>
  <Tab title="متغير البيئة">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="مفتاح الإعداد">
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

## الإعداد

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

| المفتاح                                             | النوع   | الوصف                                                                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | سلسلة نصية | مفتاح API الذي تم حله. يدعم `${ENV}` ومراجع الأسرار.                                                    |
| `messages.tts.providers.gradium.baseUrl`        | سلسلة نصية | عنوان URL لـ Gradium API عبر HTTPS على `api.gradium.ai`. تُزال الشرطات المائلة اللاحقة. القيمة الافتراضية `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | سلسلة نصية | معرّف الصوت الافتراضي المستخدم عند عدم وجود تجاوز بتوجيه.                                            |

يُختار تنسيق المخرجات تلقائيًا وفقًا للواجهة المستهدفة (راجع [المخرجات](#output))، ولا يمكن ضبطه في `openclaw.json`.

## الأصوات

| الاسم               | معرّف الصوت           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(الافتراضي)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### تجاوز الصوت لكل رسالة

عندما تسمح سياسة الكلام النشطة بتجاوزات الصوت، بدّل الأصوات ضمن السطر باستخدام رمز توجيه (جميع الصيغ التالية متكافئة، وتتطلب كلها معرّف صوت أصليًا للمزوّد):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

إذا عطّلت سياسة الكلام تجاوزات الصوت، فسيُستهلك التوجيه ولكن سيُتجاهل.

## المخرجات

يُحدَّد تنسيق المخرجات بحسب الواجهة المستهدفة؛ ولا يُنشئ المزوّد تنسيقات أخرى.

| الهدف         | التنسيق      | امتداد الملف | معدل أخذ العينات | علامة التوافق الصوتي |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| صوت قياسي | `wav`       | `.wav`   | المزوّد    | لا                    |
| ملاحظة صوتية     | `opus`      | `.opus`  | المزوّد    | نعم                   |
| الاتصالات الهاتفية      | `ulaw_8000` | غير منطبق      | 8 kHz       | غير منطبق                   |

## ترتيب الاختيار التلقائي

من بين مزوّدي TTS المضبوطين، ترتيب الاختيار التلقائي لـ Gradium هو `30`. راجع [تحويل النص إلى كلام](/ar/tools/tts) لمعرفة كيفية اختيار OpenClaw للمزوّد النشط عندما لا يكون `messages.tts.provider` مثبّتًا.

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [نظرة عامة على الوسائط](/ar/tools/media-overview)
