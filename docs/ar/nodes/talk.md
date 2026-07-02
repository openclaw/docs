---
read_when:
    - تنفيذ وضع التحدث على macOS/iOS/Android
    - تغيير سلوك الصوت/TTS/المقاطعة
summary: 'وضع التحدث: محادثات كلامية مستمرة عبر STT/TTS المحلي والصوت الآني'
title: وضع التحدث
x-i18n:
    generated_at: "2026-07-02T22:34:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

لوضع التحدث شكلان تشغيليان:

- يستخدم التحدث الأصلي على macOS/iOS/Android التعرف المحلي على الكلام، ودردشة Gateway، و`talk.speak` لتحويل النص إلى كلام. تعلن العُقد عن قدرة `talk` وتصرّح بأوامر `talk.*` التي تدعمها.
- يستخدم التحدث على iOS WebRTC مملوكًا للعميل لتهيئات OpenAI الفورية التي تختار `webrtc` أو تحذف وسيلة النقل. تبقى تهيئات `gateway-relay` و`provider-websocket` الصريحة، وتهيئات OpenAI غير الفورية، على المرحّل المملوك لـ Gateway؛ وتستخدم التهيئات غير الفورية حلقة الكلام الأصلية.
- يستخدم التحدث في المتصفح `talk.client.create` لجلسات `webrtc` و`provider-websocket` المملوكة للعميل، أو `talk.session.create` لجلسات `gateway-relay` المملوكة لـ Gateway. يُحجز `managed-room` لتسليم Gateway وغرف الاتصال اللاسلكي.
- يمكن للتحدث على Android الاشتراك في جلسات المرحّل الفوري المملوكة لـ Gateway باستخدام `talk.realtime.mode: "realtime"` و`talk.realtime.transport: "gateway-relay"`. وإلا فيبقى على التعرف الأصلي على الكلام، ودردشة Gateway، و`talk.speak`.
- يستخدم عملاء النسخ فقط `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، ثم `talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close` عندما يحتاجون إلى تسميات توضيحية أو إملاء من دون رد صوتي من المساعد.

التحدث الأصلي هو حلقة محادثة صوتية مستمرة:

1. الاستماع إلى الكلام
2. إرسال النص المنسوخ إلى النموذج عبر الجلسة النشطة
3. انتظار الرد
4. نطقه عبر موفر التحدث المهيأ (`talk.speak`)

يمرر التحدث الفوري المملوك للعميل استدعاءات أدوات الموفر عبر `talk.client.toolCall`؛ ولا يستدعي هؤلاء العملاء `chat.send` مباشرة للاستشارات الفورية.
أثناء نشاط استشارة فورية، يمكن لعملاء التحدث استخدام `talk.client.steer` أو
`talk.session.steer` لتصنيف الإدخال المنطوق كـ `status` أو `steer` أو `cancel` أو
`followup`. يُصفّ التوجيه المقبول في التشغيل المضمن النشط؛ ويُرجع
التوجيه المرفوض سببًا منظمًا مثل `no_active_run` أو `not_streaming`،
أو `compacting`.

يبث التحدث المخصص للنسخ فقط غلاف حدث التحدث المشترك نفسه مثل الجلسات الفورية وجلسات STT/TTS، لكنه يستخدم `mode: "transcription"` و`brain: "none"`. وهو مخصص للتسميات التوضيحية، والإملاء، والتقاط الكلام للمراقبة فقط؛ أما الملاحظات الصوتية المرفوعة لمرة واحدة فما زالت تستخدم مسار الوسائط/الصوت.

## السلوك (macOS)

- **طبقة ظاهرة دائمًا** أثناء تمكين وضع التحدث.
- انتقالات المراحل: **الاستماع ← التفكير ← التحدث**.
- عند **توقف قصير** (نافذة صمت)، يُرسل النص المنسوخ الحالي.
- تُكتب الردود إلى **WebChat** (كما لو كانت كتابة).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم الكلام أثناء تحدث المساعد، نوقف التشغيل ونسجل طابع وقت المقاطعة للمطالبة التالية.

## توجيهات الصوت في الردود

يمكن للمساعد أن يسبق رده بـ **سطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- السطر غير الفارغ الأول فقط.
- تُتجاهل المفاتيح غير المعروفة.
- ينطبق `once: true` على الرد الحالي فقط.
- من دون `once`، يصبح الصوت هو الافتراضي الجديد لوضع التحدث.
- يُزال سطر JSON قبل تشغيل TTS.

المفاتيح المدعومة:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## التهيئة (`~/.openclaw/openclaw.json`)

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
- `silenceTimeoutMs`: عند عدم ضبطه، يحتفظ التحدث بنافذة التوقف الافتراضية للمنصة قبل إرسال النص المنسوخ (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: يحدد موفر التحدث النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يعود إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` لـ ElevenLabs (أو أول صوت ElevenLabs عندما يكون مفتاح API متاحًا).
- `providers.elevenlabs.modelId`: تكون قيمته الافتراضية `eleven_v3` عند عدم ضبطه.
- `providers.mlx.modelId`: تكون قيمته الافتراضية `mlx-community/Soprano-80M-bf16` عند عدم ضبطه.
- `providers.elevenlabs.apiKey`: يعود إلى `ELEVENLABS_API_KEY` (أو ملف تعريف صدفة Gateway إذا كان متاحًا).
- `consultThinkingLevel`: تجاوز اختياري لمستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات `openclaw_agent_consult` الفورية.
- `consultFastMode`: تجاوز اختياري للوضع السريع لاستدعاءات `openclaw_agent_consult` الفورية.
- `realtime.provider`: يحدد موفر الصوت الفوري النشط. استخدم `openai` لـ WebRTC، أو `google` لـ WebSocket الخاص بالموفر، أو موفرًا خاصًا بالجسر فقط عبر مرحّل Gateway.
- `realtime.providers.<provider>` يخزن تهيئة الوقت الفوري المملوكة للموفر. لا يتلقى المتصفح إلا بيانات اعتماد جلسة مؤقتة أو مقيدة، وليس مفتاح API عاديًا أبدًا.
- `realtime.providers.openai.voice`: معرف صوت OpenAI Realtime مدمج. أصوات `gpt-realtime-2` الحالية هي `alloy` و`ash` و`ballad` و`coral` و`echo` و`sage` و`shimmer` و`verse` و`marin` و`cedar`؛ ويوصى بـ `marin` و`cedar` للحصول على أفضل جودة.
- `realtime.transport`: يستخدم `webrtc` WebRTC المملوك للعميل من OpenAI على iOS وفي المتصفح. يكون `provider-websocket` مملوكًا للمتصفح لكنه يبقى على مرحّل Gateway على iOS. يُبقي `gateway-relay` صوت الموفر على Gateway؛ يستخدم Android الوقت الفوري لهذا النقل فقط، وإلا فيُبقي حلقة STT/TTS الأصلية.
- `realtime.brain`: يوجه `agent-consult` استدعاءات الأدوات الفورية عبر سياسة Gateway؛ و`direct-tools` هو سلوك توافق قديم للأدوات المباشرة؛ و`none` مخصص للنسخ أو التنسيق الخارجي.
- `realtime.consultRouting`: يحافظ `provider-direct` على الرد المباشر للموفر عندما يتخطى `openclaw_agent_consult`؛ ويجعل `force-agent-consult` مرحّل Gateway يوجه نصوص المستخدم النهائية عبر OpenClaw بدلًا من ذلك.
- `realtime.instructions`: يضيف تعليمات نظام موجهة للموفر إلى مطالبة OpenClaw الفورية المدمجة. استخدمه لأسلوب الصوت ونبرته؛ يحتفظ OpenClaw بإرشادات `openclaw_agent_consult` الافتراضية.
- يعرض `talk.catalog` الأوضاع ووسائل النقل واستراتيجيات الدماغ وتنسيقات الصوت الفوري ورايات القدرات الصالحة لكل موفر، حتى يتمكن عملاء التحدث الرسميون من تجنب التركيبات غير المدعومة.
- تُكتشف موفرو النسخ المتدفق عبر `talk.catalog.transcription`. يستخدم مرحّل Gateway الحالي تهيئة موفر البث للمكالمات الصوتية إلى أن تُضاف مساحة تهيئة النسخ المخصصة للتحدث.
- `speechLocale`: معرف لغة BCP 47 اختياري للتعرف على كلام التحدث على الجهاز في iOS/macOS. اتركه غير مضبوط لاستخدام القيمة الافتراضية للجهاز.
- `outputFormat`: تكون قيمته الافتراضية `pcm_44100` على macOS/iOS و`pcm_24000` على Android (اضبط `mp3_*` لفرض بث MP3)

## واجهة مستخدم macOS

- مفتاح شريط القوائم: **التحدث**
- تبويب التهيئة: مجموعة **وضع التحدث** (معرف الصوت + مفتاح المقاطعة)
- الطبقة:
  - **الاستماع**: تنبض السحابة مع مستوى الميكروفون
  - **التفكير**: حركة غوص
  - **التحدث**: حلقات مشعة
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع التحدث

## واجهة مستخدم Android

- مفتاح تبويب الصوت: **التحدث**
- وضعا الالتقاط التشغيليان اليدويان **الميكروفون** و**التحدث** متنافيان.
- يتوقف الميكروفون اليدوي عندما يغادر التطبيق الواجهة الأمامية أو يغادر المستخدم تبويب الصوت.
- يستمر وضع التحدث في العمل حتى يُعطل أو تنقطع عقدة Android، ويستخدم نوع خدمة المقدمة الخاصة بالميكروفون في Android أثناء نشاطه.

## ملاحظات

- يتطلب أذونات الكلام + الميكروفون.
- يستخدم التحدث الأصلي جلسة Gateway النشطة ولا يعود إلى استطلاع السجل إلا عندما لا تكون أحداث الرد متاحة.
- يستخدم التحدث الفوري المملوك للعميل `talk.client.toolCall` لـ `openclaw_agent_consult` بدلًا من كشف `chat.send` للجلسات المملوكة للموفر.
- يستخدم التحدث المخصص للنسخ فقط `talk.session.create` و`talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close`؛ ويشترك العملاء في `talk.event` لتحديثات النص المنسوخ الجزئية/النهائية.
- يحل Gateway تشغيل التحدث عبر `talk.speak` باستخدام موفر التحدث النشط. يعود Android إلى TTS المحلي للنظام فقط عندما لا يكون RPC ذلك متاحًا.
- يستخدم تشغيل MLX المحلي على macOS مساعد `openclaw-mlx-tts` المضمن عند وجوده، أو ملفًا تنفيذيًا على `PATH`. اضبط `OPENCLAW_MLX_TTS_BIN` ليشير إلى ملف مساعد تنفيذي مخصص أثناء التطوير.
- يتم التحقق من `stability` لـ `eleven_v3` ليكون `0.0` أو `0.5` أو `1.0`؛ وتقبل النماذج الأخرى `0..1`.
- يتم التحقق من `latency_tier` ليكون `0..4` عند ضبطه.
- يدعم Android تنسيقات إخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` لبث AudioTrack منخفض الكمون.

## ذات صلة

- [الإيقاظ الصوتي](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
