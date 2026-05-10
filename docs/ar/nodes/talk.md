---
read_when:
    - تنفيذ وضع التحدث على macOS/iOS/Android
    - تغيير سلوك الصوت/TTS/المقاطعة
summary: 'وضع التحدث: محادثات كلامية مستمرة عبر STT/TTS المحلي والصوت في الوقت الفعلي'
title: وضع التحدث
x-i18n:
    generated_at: "2026-05-10T19:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

يأخذ وضع Talk شكلين تشغيليين وقت التشغيل:

- يستخدم Talk الأصلي على macOS/iOS/Android التعرف المحلي على الكلام، ودردشة Gateway، وTTS عبر `talk.speak`. تعلن العقد عن قدرة `talk` وتصرح بأوامر `talk.*` التي تدعمها.
- يستخدم Talk في المتصفح `talk.client.create` لجلسات `webrtc` و`provider-websocket` المملوكة للعميل، أو `talk.session.create` لجلسات `gateway-relay` المملوكة لـ Gateway. `managed-room` محجوز لتسليم Gateway وغرف الاتصال اللاسلكي.
- يستخدم عملاء النسخ فقط `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، ثم `talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close` عندما يحتاجون إلى تسميات توضيحية أو إملاء من دون استجابة صوتية من المساعد.

Talk الأصلي هو حلقة محادثة صوتية مستمرة:

1. الاستماع للكلام
2. إرسال النص المنسوخ إلى النموذج عبر الجلسة النشطة
3. انتظار الاستجابة
4. نطقها عبر موفر Talk المضبوط (`talk.speak`)

يمرر Talk الفوري في المتصفح استدعاءات أدوات الموفر عبر `talk.client.toolCall`؛ لا يستدعي عملاء المتصفح `chat.send` مباشرة للاستشارات الفورية.

يصدر Talk المخصص للنسخ فقط غلاف أحداث Talk المشترك نفسه مثل جلسات الوقت الفعلي وجلسات STT/TTS، لكنه يستخدم `mode: "transcription"` و`brain: "none"`. وهو مخصص للتسميات التوضيحية، والإملاء، والتقاط الكلام للمراقبة فقط؛ أما الملاحظات الصوتية المرفوعة لمرة واحدة فما زالت تستخدم مسار الوسائط/الصوت.

## السلوك (macOS)

- **تراكب دائم التشغيل** أثناء تفعيل وضع Talk.
- انتقالات المراحل: **الاستماع ← التفكير ← التحدث**.
- عند حدوث **توقف قصير** (نافذة صمت)، يتم إرسال النص المنسوخ الحالي.
- تُكتب الردود إلى **WebChat** (كما لو كانت مكتوبة).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم الكلام بينما يتحدث المساعد، نوقف التشغيل ونسجل الطابع الزمني للمقاطعة من أجل الموجه التالي.

## توجيهات الصوت في الردود

يمكن للمساعد أن يسبق رده بسطر **JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- السطر الأول غير الفارغ فقط.
- يتم تجاهل المفاتيح غير المعروفة.
- ينطبق `once: true` على الرد الحالي فقط.
- من دون `once`، يصبح الصوت هو الافتراضي الجديد لوضع Talk.
- تتم إزالة سطر JSON قبل تشغيل TTS.

المفاتيح المدعومة:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## الإعدادات (`~/.openclaw/openclaw.json`)

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

القيم الافتراضية:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: عند عدم تعيينها، يحتفظ Talk بنافذة التوقف الافتراضية للمنصة قبل إرسال النص المنسوخ (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: يحدد موفر Talk النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يعود إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` لـ ElevenLabs (أو أول صوت ElevenLabs عند توفر مفتاح API).
- `providers.elevenlabs.modelId`: القيمة الافتراضية هي `eleven_v3` عند عدم تعيينها.
- `providers.mlx.modelId`: القيمة الافتراضية هي `mlx-community/Soprano-80M-bf16` عند عدم تعيينها.
- `providers.elevenlabs.apiKey`: يعود إلى `ELEVENLABS_API_KEY` (أو ملف تعريف صدفة Gateway إن كان متاحًا).
- `consultThinkingLevel`: تجاوز اختياري لمستوى التفكير للتشغيل الكامل لوكيل OpenClaw خلف استدعاءات `openclaw_agent_consult` الفورية.
- `consultFastMode`: تجاوز اختياري للوضع السريع لاستدعاءات `openclaw_agent_consult` الفورية.
- `realtime.provider`: يحدد موفر الصوت الفوري النشط في المتصفح/الخادم. استخدم `openai` لـ WebRTC، أو `google` لـ WebSocket الخاص بالموفر، أو موفرًا للجسر فقط عبر ترحيل Gateway.
- يخزن `realtime.providers.<provider>` إعدادات الوقت الفعلي المملوكة للموفر. لا يتلقى المتصفح إلا بيانات اعتماد جلسة مؤقتة أو مقيدة، ولا يتلقى مفتاح API قياسيًا أبدًا.
- `realtime.providers.openai.voice`: معرف صوت OpenAI Realtime المدمج. أصوات `gpt-realtime-2` الحالية هي `alloy` و`ash` و`ballad` و`coral` و`echo` و`sage` و`shimmer` و`verse` و`marin` و`cedar`؛ ويوصى بـ `marin` و`cedar` للحصول على أفضل جودة.
- `realtime.brain`: يوجه `agent-consult` استدعاءات الأدوات الفورية عبر سياسة Gateway؛ و`direct-tools` هو سلوك توافقية للمالك فقط؛ و`none` مخصص للنسخ أو التنسيق الخارجي.
- `realtime.instructions`: يضيف تعليمات نظام موجهة للموفر إلى موجه الوقت الفعلي المدمج في OpenClaw. استخدمه لأسلوب الصوت ونبرته؛ يحتفظ OpenClaw بتوجيه `openclaw_agent_consult` الافتراضي.
- يعرض `talk.catalog` الأوضاع ووسائل النقل واستراتيجيات brain وتنسيقات الصوت الفوري ورايات القدرات الصالحة لكل موفر، بحيث يمكن لعملاء Talk من الطرف الأول تجنب التركيبات غير المدعومة.
- يتم اكتشاف موفري النسخ المتدفق عبر `talk.catalog.transcription`. يستخدم ترحيل Gateway الحالي إعدادات موفر تدفق Voice Call إلى أن تتم إضافة سطح إعدادات النسخ المخصص لـ Talk.
- `speechLocale`: معرف لغة اختياري وفق BCP 47 للتعرف على كلام Talk على الجهاز في iOS/macOS. اتركه غير معين لاستخدام الإعداد الافتراضي للجهاز.
- `outputFormat`: القيمة الافتراضية هي `pcm_44100` على macOS/iOS و`pcm_24000` على Android (عيّن `mp3_*` لفرض تدفق MP3)

## واجهة مستخدم macOS

- زر شريط القوائم: **Talk**
- تبويب الإعدادات: مجموعة **وضع Talk** (معرف الصوت + زر تبديل المقاطعة)
- التراكب:
  - **الاستماع**: نبضات سحابة مع مستوى الميكروفون
  - **التفكير**: حركة غوص
  - **التحدث**: حلقات مشعة
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع Talk

## واجهة مستخدم Android

- زر تبويب الصوت: **Talk**
- **الميكروفون** اليدوي و**Talk** وضعا التقاط وقت تشغيل متنافيان.
- يتوقف الميكروفون اليدوي عندما يغادر التطبيق الواجهة الأمامية أو يغادر المستخدم تبويب الصوت.
- يظل وضع Talk قيد التشغيل حتى يتم إيقافه أو تنقطع عقدة Android، ويستخدم نوع خدمة المقدمة الخاصة بالميكروفون في Android أثناء نشاطه.

## ملاحظات

- يتطلب أذونات الكلام والميكروفون.
- يستخدم Talk الأصلي جلسة Gateway النشطة ولا يعود إلى استطلاع السجل إلا عندما تكون أحداث الاستجابة غير متاحة.
- يستخدم Talk الفوري في المتصفح `talk.client.toolCall` لـ `openclaw_agent_consult` بدلًا من كشف `chat.send` لجلسات المتصفح المملوكة للموفر.
- يستخدم Talk المخصص للنسخ فقط `talk.session.create` و`talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close`؛ يشترك العملاء في `talk.event` لتحديثات النص المنسوخ الجزئية/النهائية.
- يحل Gateway تشغيل Talk عبر `talk.speak` باستخدام موفر Talk النشط. يعود Android إلى TTS المحلي للنظام فقط عندما لا يكون RPC هذا متاحًا.
- يستخدم تشغيل MLX المحلي على macOS مساعد `openclaw-mlx-tts` المضمن عند وجوده، أو ملفًا تنفيذيًا على `PATH`. عيّن `OPENCLAW_MLX_TTS_BIN` للإشارة إلى ملف مساعد ثنائي مخصص أثناء التطوير.
- يتم التحقق من `stability` لـ `eleven_v3` ليكون `0.0` أو `0.5` أو `1.0`؛ تقبل النماذج الأخرى `0..1`.
- يتم التحقق من `latency_tier` ليكون `0..4` عند تعيينه.
- يدعم Android تنسيقات إخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` لتدفق AudioTrack منخفض الكمون.

## ذو صلة

- [التنبيه الصوتي](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
