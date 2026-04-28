---
read_when:
    - تنفيذ وضع التحدث على macOS/iOS/Android
    - تغيير سلوك الصوت/TTS/المقاطعة
summary: 'وضع التحدث: محادثات صوتية مستمرة مع موفري TTS المهيئين'
title: وضع التحدث
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:34:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

وضع التحدث هو حلقة محادثة صوتية مستمرة:

1. الاستماع إلى الكلام
2. إرسال النص المنسوخ إلى النموذج (`main` session، و`chat.send`)
3. انتظار الرد
4. نطقه عبر مزوّد Talk المهيأ (`talk.speak`)

## السلوك (macOS)

- **تراكب دائم التشغيل** أثناء تفعيل وضع التحدث.
- انتقالات بين المراحل **الاستماع → التفكير → التحدث**.
- عند **توقف قصير** (نافذة صمت)، يُرسل النص المنسوخ الحالي.
- تُكتب الردود **في WebChat** ‏(كما لو أنها مكتوبة يدويًا).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم التحدث بينما كان المساعد يتحدث، نوقف التشغيل ونسجل طابعًا زمنيًا للمقاطعة لاستخدامه في المطالبة التالية.

## توجيهات الصوت في الردود

يمكن للمساعد أن يسبق رده **بسطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- السطر الأول غير الفارغ فقط.
- يتم تجاهل المفاتيح غير المعروفة.
- تطبَّق `once: true` على الرد الحالي فقط.
- من دون `once`، يصبح الصوت هو الافتراضي الجديد لوضع التحدث.
- يُزال سطر JSON قبل تشغيل TTS.

المفاتيح المدعومة:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`، و`rate` ‏(WPM)، و`stability`، و`similarity`، و`style`، و`speakerBoost`
- `seed`، و`normalize`، و`lang`، و`output_format`، و`latency_tier`
- `once`

## التكوين (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

القيم الافتراضية:

- `interruptOnSpeech`: ‏true
- `silenceTimeoutMs`: عند عدم ضبطه، يحتفظ Talk بنافذة التوقف الافتراضية الخاصة بالمنصة قبل إرسال النص المنسوخ (`700 ms` على macOS وAndroid، و`900 ms` على iOS)
- `provider`: يحدد مزوّد Talk النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يعود إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` بالنسبة إلى ElevenLabs ‏(أو أول صوت ElevenLabs عند توفر مفتاح API).
- `providers.elevenlabs.modelId`: القيمة الافتراضية هي `eleven_v3` عند عدم الضبط.
- `providers.mlx.modelId`: القيمة الافتراضية هي `mlx-community/Soprano-80M-bf16` عند عدم الضبط.
- `providers.elevenlabs.apiKey`: يعود إلى `ELEVENLABS_API_KEY` ‏(أو ملف shell profile الخاص بـ gateway إن توفر).
- `speechLocale`: معرّف BCP 47 locale اختياري للتعرف على الكلام على الجهاز في Talk على iOS/macOS. اتركه غير مضبوط لاستخدام الافتراضي الخاص بالجهاز.
- `outputFormat`: القيمة الافتراضية هي `pcm_44100` على macOS/iOS و`pcm_24000` على Android ‏(اضبط `mp3_*` لفرض بث MP3)

## واجهة macOS

- مفتاح التبديل في شريط القوائم: **Talk**
- تبويب التكوين: مجموعة **Talk Mode** ‏(معرّف الصوت + مفتاح تبديل المقاطعة)
- التراكب:
  - **الاستماع**: نبضات سحابية مع مستوى الميكروفون
  - **التفكير**: حركة هبوط
  - **التحدث**: حلقات إشعاعية
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع التحدث

## واجهة Android

- مفتاح التبديل في تبويب الصوت: **Talk**
- وضعا الالتقاط أثناء التشغيل **Mic** و**Talk** متنافيان.
- يتوقف Mic اليدوي عندما يغادر التطبيق الواجهة الأمامية أو عندما يغادر المستخدم تبويب Voice.
- يستمر Talk Mode في العمل حتى يتم إيقافه أو حتى تنفصل عقدة Android، ويستخدم نوع foreground-service الخاص بميكروفون Android أثناء نشاطه.

## ملاحظات

- يتطلب أذونات Speech وMicrophone.
- يستخدم `chat.send` على مفتاح الجلسة `main`.
- يحل gateway تشغيل Talk عبر `talk.speak` باستخدام مزوّد Talk النشط. ويعود Android إلى TTS النظام المحلي فقط عندما لا يكون RPC هذا متاحًا.
- يستخدم تشغيل MLX المحلي على macOS المساعد المضمن `openclaw-mlx-tts` عند وجوده، أو ملفًا تنفيذيًا موجودًا على `PATH`. اضبط `OPENCLAW_MLX_TTS_BIN` للإشارة إلى ملف مساعد مخصص أثناء التطوير.
- يتم التحقق من `stability` في `eleven_v3` بحيث تكون `0.0` أو `0.5` أو `1.0`؛ بينما تقبل النماذج الأخرى `0..1`.
- يتم التحقق من `latency_tier` بحيث يقع ضمن `0..4` عند ضبطه.
- يدعم Android صيغ الإخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` للبث منخفض الكمون عبر AudioTrack.

## ذو صلة

- [Voice wake](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
