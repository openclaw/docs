---
read_when:
    - تنفيذ وضع التحدث على macOS/iOS/Android
    - تغيير سلوك الصوت/TTS/المقاطعة
summary: 'وضع التحدث: محادثات كلامية مستمرة عبر STT/TTS المحلي والصوت في الوقت الفعلي'
title: وضع التحدث
x-i18n:
    generated_at: "2026-05-06T08:03:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

وضع التحدث له شكلان وقت التشغيل:

- يستخدم التحدث الأصلي على macOS/iOS/Android التعرف المحلي على الكلام، ودردشة Gateway، وTTS عبر `talk.speak`. تعلن العُقد عن قدرة `talk` وتصرّح بأوامر `talk.*` التي تدعمها.
- يستخدم التحدث في المتصفح `talk.client.create` لجلسات `webrtc` و`provider-websocket` المملوكة للعميل، أو `talk.session.create` لجلسات `gateway-relay` المملوكة لـ Gateway. أما `managed-room` فهو محجوز لتسليم Gateway وغرف الضغط للتحدث.
- يستخدم عملاء التفريغ النصي فقط `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، ثم `talk.session.appendAudio`، و`talk.session.cancelTurn`، و`talk.session.close` عندما يحتاجون إلى تسميات توضيحية أو إملاء من دون استجابة صوتية من المساعد.

التحدث الأصلي هو حلقة محادثة صوتية مستمرة:

1. الاستماع للكلام
2. إرسال التفريغ النصي إلى النموذج عبر الجلسة النشطة
3. انتظار الاستجابة
4. نطقها عبر موفر التحدث المُعد (`talk.speak`)

يمرر التحدث الفوري في المتصفح استدعاءات أدوات الموفر عبر `talk.client.toolCall`؛ لا يستدعي عملاء المتصفح `chat.send` مباشرة للاستشارات الفورية.

يبث التحدث المخصص للتفريغ النصي فقط غلاف أحداث التحدث الشائع نفسه كما في جلسات الوقت الفعلي وSTT/TTS، لكنه يستخدم `mode: "transcription"` و`brain: "none"`. وهو مخصص للتسميات التوضيحية والإملاء والتقاط الكلام للمراقبة فقط؛ أما الملاحظات الصوتية المرفوعة لمرة واحدة فلا تزال تستخدم مسار الوسائط/الصوت.

## السلوك (macOS)

- **طبقة علوية تعمل دائمًا** أثناء تمكين وضع التحدث.
- انتقالات المراحل: **الاستماع ← التفكير ← التحدث**.
- عند **توقف قصير** (نافذة صمت)، يُرسل التفريغ النصي الحالي.
- تُكتب الردود إلى **WebChat** (تمامًا مثل الكتابة).
- **المقاطعة عند الكلام** (مفعّلة افتراضيًا): إذا بدأ المستخدم بالتحدث أثناء تحدث المساعد، نوقف التشغيل ونسجل الطابع الزمني للمقاطعة للمطالبة التالية.

## توجيهات الصوت في الردود

قد يسبق المساعد رده بـ **سطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- أول سطر غير فارغ فقط.
- يتم تجاهل المفاتيح غير المعروفة.
- ينطبق `once: true` على الرد الحالي فقط.
- بدون `once`، يصبح الصوت هو الافتراضي الجديد لوضع التحدث.
- يُزال سطر JSON قبل تشغيل TTS.

المفاتيح المدعومة:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## الإعداد (`~/.openclaw/openclaw.json`)

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
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

القيم الافتراضية:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: عند عدم ضبطه، يحتفظ وضع التحدث بنافذة التوقف الافتراضية للمنصة قبل إرسال التفريغ النصي (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: يحدد موفر التحدث النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يعود إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` لـ ElevenLabs (أو أول صوت ElevenLabs عند توفر مفتاح API).
- `providers.elevenlabs.modelId`: تكون قيمته الافتراضية `eleven_v3` عند عدم ضبطه.
- `providers.mlx.modelId`: تكون قيمته الافتراضية `mlx-community/Soprano-80M-bf16` عند عدم ضبطه.
- `providers.elevenlabs.apiKey`: يعود إلى `ELEVENLABS_API_KEY` (أو ملف تعريف صدفة Gateway إذا كان متاحًا).
- `realtime.provider`: يحدد موفر الصوت الفوري النشط للمتصفح/الخادم. استخدم `openai` لـ WebRTC، أو `google` لـ WebSocket الموفر، أو موفرًا مخصصًا للجسر فقط عبر ترحيل Gateway.
- يخزن `realtime.providers.<provider>` إعداد الوقت الفعلي المملوك للموفر. لا يتلقى المتصفح إلا بيانات اعتماد جلسة مؤقتة أو مقيّدة، ولا يتلقى أبدًا مفتاح API قياسيًا.
- يمرر `realtime.brain`: `agent-consult` استدعاءات الأدوات الفورية عبر سياسة Gateway؛ و`direct-tools` سلوك توافق مخصص للمالك فقط؛ و`none` مخصص للتفريغ النصي أو التنسيق الخارجي.
- يعرض `talk.catalog` الأوضاع الصالحة لكل موفر، ووسائل النقل، واستراتيجيات الدماغ، وتنسيقات الصوت الفورية، وأعلام القدرات، حتى يتمكن عملاء التحدث من الطرف الأول من تجنب التركيبات غير المدعومة.
- تُكتشف موفرو التفريغ النصي المتدفق عبر `talk.catalog.transcription`. يستخدم ترحيل Gateway الحالي إعداد موفر بث المكالمات الصوتية إلى أن يُضاف سطح إعداد التفريغ النصي المخصص للتحدث.
- `speechLocale`: معرّف لغة BCP 47 اختياري للتعرف على الكلام في وضع التحدث على الجهاز في iOS/macOS. اتركه غير مضبوط لاستخدام القيمة الافتراضية للجهاز.
- `outputFormat`: تكون قيمته الافتراضية `pcm_44100` على macOS/iOS و`pcm_24000` على Android (اضبط `mp3_*` لفرض بث MP3)

## واجهة macOS

- تبديل شريط القوائم: **التحدث**
- تبويب الإعداد: مجموعة **وضع التحدث** (معرّف الصوت + تبديل المقاطعة)
- الطبقة العلوية:
  - **الاستماع**: نبضات سحابية مع مستوى الميكروفون
  - **التفكير**: حركة غوص
  - **التحدث**: حلقات مشعة
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع التحدث

## واجهة Android

- تبديل تبويب الصوت: **التحدث**
- وضعي الالتقاط وقت التشغيل **الميكروفون** اليدوي و**التحدث** متنافيان.
- يتوقف الميكروفون اليدوي عندما يغادر التطبيق الواجهة الأمامية أو يغادر المستخدم تبويب الصوت.
- يستمر وضع التحدث في العمل حتى يتم إيقافه أو تنفصل عقدة Android، ويستخدم نوع خدمة المقدمة لميكروفون Android أثناء نشاطه.

## ملاحظات

- يتطلب أذونات الكلام + الميكروفون.
- يستخدم التحدث الأصلي جلسة Gateway النشطة ولا يعود إلى استطلاع السجل إلا عندما تكون أحداث الاستجابة غير متاحة.
- يستخدم التحدث الفوري في المتصفح `talk.client.toolCall` من أجل `openclaw_agent_consult` بدلًا من كشف `chat.send` لجلسات المتصفح المملوكة للموفر.
- يستخدم التحدث المخصص للتفريغ النصي فقط `talk.session.create` و`talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close`؛ يشترك العملاء في `talk.event` لتحديثات التفريغ النصي الجزئية/النهائية.
- يحل Gateway تشغيل التحدث عبر `talk.speak` باستخدام موفر التحدث النشط. يعود Android إلى TTS النظام المحلي فقط عندما لا يكون ذلك RPC متاحًا.
- يستخدم تشغيل MLX المحلي على macOS المساعد المضمّن `openclaw-mlx-tts` عند وجوده، أو ملفًا تنفيذيًا على `PATH`. اضبط `OPENCLAW_MLX_TTS_BIN` للإشارة إلى ملف مساعد تنفيذي مخصص أثناء التطوير.
- يتم التحقق من `stability` لـ `eleven_v3` ليكون `0.0` أو `0.5` أو `1.0`؛ تقبل النماذج الأخرى `0..1`.
- يتم التحقق من `latency_tier` ليكون `0..4` عند ضبطه.
- يدعم Android تنسيقات إخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` لبث AudioTrack منخفض زمن الاستجابة.

## ذات صلة

- [تنبيه الصوت](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
