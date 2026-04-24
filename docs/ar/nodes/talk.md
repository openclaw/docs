---
read_when:
    - تنفيذ وضع Talk على macOS/iOS/Android
    - تغيير سلوك الصوت/TTS/المقاطعة
summary: 'وضع Talk: محادثات صوتية مستمرة مع ElevenLabs TTS'
title: وضع Talk
x-i18n:
    generated_at: "2026-04-24T07:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

وضع Talk هو حلقة محادثة صوتية مستمرة:

1. الاستماع إلى الكلام
2. إرسال النص المفرغ إلى النموذج (الجلسة الرئيسية، `chat.send`)
3. انتظار الرد
4. نطقه عبر موفر Talk المضبوط (`talk.speak`)

## السلوك (macOS)

- **طبقة تراكب تعمل دائمًا** أثناء تفعيل وضع Talk.
- انتقالات بين المراحل **الاستماع → التفكير → التحدث**.
- عند **توقف قصير** (نافذة صمت)، يتم إرسال النص المفرغ الحالي.
- يتم **كتابة الردود في WebChat** (كما لو كنت تكتب).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم بالتحدث بينما يكون المساعد يتكلم، فإننا نوقف التشغيل ونسجل الطابع الزمني للمقاطعة من أجل المطالبة التالية.

## توجيهات الصوت في الردود

يمكن للمساعد أن يسبق رده **بسطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- السطر الأول غير الفارغ فقط.
- يتم تجاهل المفاتيح غير المعروفة.
- يطبَّق `once: true` على الرد الحالي فقط.
- من دون `once`، يصبح الصوت هو الافتراضي الجديد لوضع Talk.
- تتم إزالة سطر JSON قبل تشغيل TTS.

المفاتيح المدعومة:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` ‏(WPM)، `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## الإعداد (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

القيم الافتراضية:

- `interruptOnSpeech`: ‏true
- `silenceTimeoutMs`: عندما لا تكون مضبوطة، يحتفظ Talk بنافذة التوقف الافتراضية الخاصة بالمنصة قبل إرسال النص المفرغ (`700 ms` على macOS وAndroid، و`900 ms` على iOS)
- `voiceId`: يرجع إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` ‏(أو أول صوت ElevenLabs عند توفر مفتاح API)
- `modelId`: تكون القيمة الافتراضية `eleven_v3` عند عدم الضبط
- `apiKey`: يرجع إلى `ELEVENLABS_API_KEY` ‏(أو profile shell الخاصة بـ gateway إن كانت متاحة)
- `outputFormat`: تكون القيمة الافتراضية `pcm_44100` على macOS/iOS و`pcm_24000` على Android ‏(اضبط `mp3_*` لفرض بث MP3)

## واجهة macOS

- تبديل شريط القائمة: **Talk**
- تبويب الإعداد: مجموعة **Talk Mode** ‏(معرّف الصوت + تبديل المقاطعة)
- التراكب:
  - **الاستماع**: نبضات سحابية مع مستوى الميكروفون
  - **التفكير**: حركة غوص
  - **التحدث**: حلقات متشععة
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع Talk

## ملاحظات

- يتطلب أذونات Speech + Microphone.
- يستخدم `chat.send` مقابل مفتاح الجلسة `main`.
- تحل gateway تشغيل Talk عبر `talk.speak` باستخدام موفر Talk النشط. ويرجع Android إلى TTS النظام المحلية فقط عندما لا تكون RPC تلك متاحة.
- يتم التحقق من `stability` في `eleven_v3` لتكون `0.0` أو `0.5` أو `1.0`؛ بينما تقبل النماذج الأخرى `0..1`.
- يتم التحقق من `latency_tier` لتكون `0..4` عند ضبطها.
- يدعم Android تنسيقات الإخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` من أجل بث AudioTrack منخفض الكمون.

## ذو صلة

- [تنبيه الصوت](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
