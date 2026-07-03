---
read_when:
    - تنفيذ وضع التحدث على macOS/iOS/Android
    - تغيير سلوك الصوت/تحويل النص إلى كلام/المقاطعة
summary: 'وضع التحدث: محادثات كلامية مستمرة عبر STT/TTS المحليين والصوت في الوقت الحقيقي'
title: وضع التحدث
x-i18n:
    generated_at: "2026-07-03T09:37:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

لدى وضع Talk شكلان تشغيليان وقت التشغيل:

- يستخدم Talk الأصلي على macOS/iOS/Android التعرف المحلي على الكلام، ودردشة Gateway، وTTS عبر `talk.speak`. تعلن العُقد قدرة `talk` وتصرّح بأوامر `talk.*` التي تدعمها.
- يستخدم Talk على iOS WebRTC المملوك للعميل لتكوينات OpenAI الفورية التي تختار `webrtc` أو تحذف النقل. تبقى تكوينات `gateway-relay` و`provider-websocket` الصريحة وتكوينات realtime غير التابعة لـ OpenAI على المرحّل المملوك لـ Gateway؛ وتستخدم التكوينات غير الفورية حلقة الكلام الأصلية.
- يستخدم Talk في المتصفح `talk.client.create` لجلسات `webrtc` و`provider-websocket` المملوكة للعميل، أو `talk.session.create` لجلسات `gateway-relay` المملوكة لـ Gateway. إن `managed-room` محجوزة لتسليم Gateway وغرف أجهزة اللاسلكي.
- يمكن لـ Talk على Android الاشتراك في جلسات المرحّل الفورية المملوكة لـ Gateway باستخدام `talk.realtime.mode: "realtime"` و`talk.realtime.transport: "gateway-relay"`. وإلا يبقى على التعرف الأصلي على الكلام، ودردشة Gateway، و`talk.speak`.
- يستخدم العملاء المخصصون للتفريغ النصي فقط `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، ثم `talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close` عندما يحتاجون إلى تسميات توضيحية أو إملاء من دون استجابة صوتية من المساعد.

Talk الأصلي هو حلقة محادثة صوتية مستمرة:

1. الاستماع للكلام
2. إرسال النص المفرغ إلى النموذج عبر الجلسة النشطة
3. انتظار الاستجابة
4. نطقها عبر مزود Talk المكوّن (`talk.speak`)

يمرر Talk الفوري المملوك للعميل استدعاءات أدوات المزود عبر `talk.client.toolCall`؛ ولا يستدعي هؤلاء العملاء `chat.send` مباشرة للاستشارات الفورية.
أثناء نشاط استشارة فورية، يمكن لعملاء Talk استخدام `talk.client.steer` أو
`talk.session.steer` لتصنيف الإدخال المنطوق إلى `status` أو `steer` أو `cancel` أو
`followup`. تُضاف التوجيهات المقبولة إلى قائمة انتظار التشغيل المضمّن النشط؛ أما
التوجيهات المرفوضة فتعيد سببًا منظّمًا مثل `no_active_run` أو `not_streaming`
أو `compacting`.

يصْدر Talk المخصص للتفريغ النصي فقط غلاف أحداث Talk العام نفسه مثل جلسات realtime وSTT/TTS، لكنه يستخدم `mode: "transcription"` و`brain: "none"`. وهو مخصص للتسميات التوضيحية، والإملاء، والتقاط الكلام للمراقبة فقط؛ أما الملاحظات الصوتية المرفوعة لمرة واحدة فما زالت تستخدم مسار الوسائط/الصوت.

## السلوك (macOS)

- **تراكب دائم التشغيل** أثناء تمكين وضع Talk.
- انتقالات المراحل **Listening → Thinking → Speaking**.
- عند **توقف قصير** (نافذة صمت)، يُرسل النص المفرغ الحالي.
- تُكتب الردود **إلى WebChat** (كما لو كانت كتابة).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم التحدث بينما يتكلم المساعد، نوقف التشغيل ونسجل الطابع الزمني للمقاطعة لاستخدامه في الموجه التالي.

## توجيهات الصوت في الردود

يمكن للمساعد أن يسبق رده بـ **سطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- السطر الأول غير الفارغ فقط.
- تُتجاهل المفاتيح غير المعروفة.
- يطبق `once: true` على الرد الحالي فقط.
- من دون `once`، يصبح الصوت هو الافتراضي الجديد لوضع Talk.
- يُزال سطر JSON قبل تشغيل TTS.

المفاتيح المدعومة:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
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
- `silenceTimeoutMs`: عند عدم تعيينها، يحافظ Talk على نافذة التوقف الافتراضية للمنصة قبل إرسال النص المفرغ (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: يحدد مزود Talk النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يرجع إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` لـ ElevenLabs (أو أول صوت ElevenLabs عندما يكون مفتاح API متاحًا).
- `providers.elevenlabs.modelId`: القيمة الافتراضية هي `eleven_v3` عند عدم تعيينها.
- `providers.mlx.modelId`: القيمة الافتراضية هي `mlx-community/Soprano-80M-bf16` عند عدم تعيينها.
- `providers.elevenlabs.apiKey`: يرجع إلى `ELEVENLABS_API_KEY` (أو ملف تعريف صدفة Gateway إذا كان متاحًا).
- `consultThinkingLevel`: تجاوز اختياري لمستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات `openclaw_agent_consult` الفورية.
- `consultFastMode`: تجاوز اختياري للوضع السريع لاستدعاءات `openclaw_agent_consult` الفورية.
- `realtime.provider`: يحدد مزود الصوت الفوري النشط. استخدم `openai` لـ WebRTC، أو `google` لـ WebSocket المزود، أو مزودًا مخصصًا للجسر فقط عبر مرحّل Gateway.
- `realtime.providers.<provider>` يخزن تكوين realtime المملوك للمزود. يتلقى المتصفح بيانات اعتماد جلسة مؤقتة أو مقيدة فقط، وليس مفتاح API قياسيًا أبدًا.
- `realtime.providers.openai.voice`: معرّف صوت OpenAI Realtime مدمج. أصوات `gpt-realtime-2` الحالية هي `alloy` و`ash` و`ballad` و`coral` و`echo` و`sage` و`shimmer` و`verse` و`marin` و`cedar`؛ ويوصى بـ `marin` و`cedar` للحصول على أفضل جودة.
- `realtime.transport`: يستخدم `webrtc` WebRTC الخاص بـ OpenAI المملوك للعميل على iOS وفي المتصفح. إن `provider-websocket` مملوك للمتصفح لكنه يبقى على مرحّل Gateway على iOS. يحافظ `gateway-relay` على صوت المزود على Gateway؛ يستخدم Android realtime لهذا النقل فقط، وإلا يحافظ على حلقة STT/TTS الأصلية.
- `realtime.brain`: يوجّه `agent-consult` استدعاءات الأدوات الفورية عبر سياسة Gateway؛ و`direct-tools` هو سلوك توافق قديم للأدوات المباشرة؛ و`none` مخصص للتفريغ النصي أو التنسيق الخارجي.
- `realtime.consultRouting`: يحافظ `provider-direct` على الرد المباشر للمزود عندما يتخطى `openclaw_agent_consult`؛ أما `force-agent-consult` فيجعل مرحّل Gateway يوجّه النصوص المفرغة النهائية للمستخدم عبر OpenClaw بدلًا من ذلك.
- `realtime.instructions`: يضيف تعليمات نظام موجهة للمزود إلى موجه realtime المدمج في OpenClaw. استخدمه لأسلوب الصوت ونبرته؛ ويحافظ OpenClaw على إرشادات `openclaw_agent_consult` الافتراضية.
- يعرض `talk.catalog` معرّفات المزودين القياسية وأسماء السجل البديلة إلى جانب الأوضاع ووسائل النقل واستراتيجيات الدماغ وتنسيقات الصوت الفورية ورايات القدرات ونتيجة الجاهزية المختارة وقت التشغيل لكل مزود. يجب على عملاء Talk من الطرف الأول استخدام ذلك الكتالوج بدلًا من الحفاظ على أسماء مزودين بديلة محليًا؛ أما Gateway الأقدم الذي يحذف جاهزية المجموعة فهو غير متحقق منه بدلًا من أن يكون غير مكوّن بشكل قاطع.
- تُكتشف مزودات التفريغ النصي المتدفقة عبر `talk.catalog.transcription`. يستخدم مرحّل Gateway الحالي تكوين مزود بث المكالمات الصوتية إلى أن تُضاف واجهة تكوين التفريغ النصي المخصصة لـ Talk.
- `speechLocale`: معرّف لغة BCP 47 اختياري للتعرف على الكلام على الجهاز في Talk على iOS/macOS. اتركه غير معيّن لاستخدام الإعداد الافتراضي للجهاز.
- `outputFormat`: القيمة الافتراضية هي `pcm_44100` على macOS/iOS و`pcm_24000` على Android (عيّن `mp3_*` لفرض بث MP3)

## واجهة macOS

- تبديل شريط القائمة: **Talk**
- تبويب التكوين: مجموعة **Talk Mode** (معرّف الصوت + تبديل المقاطعة)
- التراكب:
  - **Listening**: نبضات سحابة مع مستوى الميكروفون
  - **Thinking**: حركة غوص
  - **Speaking**: حلقات متشعة
  - النقر على السحابة: إيقاف الكلام
  - النقر على X: الخروج من وضع Talk

## واجهة Android

- تبديل تبويب الصوت: **Talk**
- إن **Mic** و**Talk** اليدويين هما وضعا التقاط وقت تشغيل متنافيان.
- يفضل Mic اليدوي وTalk الفوري ميكروفون سماعة Bluetooth Classic أو BLE متصلة. إذا انقطع الاتصال، يطلب التطبيق إدخال سماعة آخر أو يتيح لـ Android استخدام الميكروفون الافتراضي؛ ويؤدي إيقاف الالتقاط إلى استعادة تفضيل الميكروفون الافتراضي.
- يتوقف Mic اليدوي عندما يغادر التطبيق الواجهة الأمامية أو يغادر المستخدم تبويب الصوت.
- يستمر Talk Mode في العمل إلى أن يُعطّل أو تنقطع عقدة Android، ويستخدم نوع خدمة المقدمة للميكروفون في Android أثناء نشاطه.

## ملاحظات

- يتطلب أذونات الكلام + الميكروفون.
- يستخدم Talk الأصلي جلسة Gateway النشطة ولا يرجع إلى استطلاع السجل إلا عندما لا تكون أحداث الاستجابة متاحة.
- يستخدم Talk الفوري المملوك للعميل `talk.client.toolCall` من أجل `openclaw_agent_consult` بدلًا من كشف `chat.send` للجلسات المملوكة للمزود.
- يستخدم Talk المخصص للتفريغ النصي فقط `talk.session.create` و`talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close`؛ ويشترك العملاء في `talk.event` لتحديثات النص المفرغ الجزئية/النهائية.
- يحل Gateway تشغيل Talk عبر `talk.speak` باستخدام مزود Talk النشط. يرجع Android إلى TTS النظام المحلي فقط عندما لا يكون RPC ذلك متاحًا.
- يستخدم تشغيل MLX المحلي على macOS المساعد المضمّن `openclaw-mlx-tts` عند وجوده، أو ملفًا تنفيذيًا على `PATH`. عيّن `OPENCLAW_MLX_TTS_BIN` للإشارة إلى ملف مساعد تنفيذي مخصص أثناء التطوير.
- تُتحقق قيمة `stability` لـ `eleven_v3` لتكون `0.0` أو `0.5` أو `1.0`؛ وتقبل النماذج الأخرى `0..1`.
- تُتحقق قيمة `latency_tier` لتكون `0..4` عند تعيينها.
- يدعم Android تنسيقات إخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` لبث AudioTrack منخفض الكمون.

## ذات صلة

- [إيقاظ صوتي](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
