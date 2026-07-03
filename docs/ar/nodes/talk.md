---
read_when:
    - تنفيذ وضع التحدث على macOS/iOS/Android
    - تغيير سلوك الصوت/تحويل النص إلى كلام/المقاطعة
summary: 'وضع التحدث: محادثات كلامية مستمرة عبر STT/TTS محليين والصوت في الوقت الفعلي'
title: وضع التحدث
x-i18n:
    generated_at: "2026-07-03T00:58:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

لوضع التحدث شكلان وقت التشغيل:

- يستخدم التحدث الأصلي على macOS/iOS/Android التعرف المحلي على الكلام، ودردشة Gateway، و`talk.speak` لتحويل النص إلى كلام. تعلن العُقد عن قدرة `talk` وتصرّح بأوامر `talk.*` التي تدعمها.
- يستخدم التحدث على iOS WebRTC المملوك للعميل لتكوينات OpenAI في الوقت الحقيقي التي تختار `webrtc` أو تحذف النقل. تبقى تكوينات `gateway-relay` و`provider-websocket` الصريحة وتكوينات الوقت الحقيقي غير التابعة لـ OpenAI على المرحّل المملوك لـ Gateway؛ وتستخدم التكوينات غير الفورية حلقة الكلام الأصلية.
- يستخدم التحدث في المتصفح `talk.client.create` لجلسات `webrtc` و`provider-websocket` المملوكة للعميل، أو `talk.session.create` لجلسات `gateway-relay` المملوكة لـ Gateway. `managed-room` محجوز لتسليم Gateway وغرف الاتصال الصوتي المتناوب.
- يمكن لتحدث Android الاشتراك في جلسات ترحيل الوقت الحقيقي المملوكة لـ Gateway باستخدام `talk.realtime.mode: "realtime"` و`talk.realtime.transport: "gateway-relay"`. وإلا فإنه يبقى على التعرف الأصلي على الكلام، ودردشة Gateway، و`talk.speak`.
- يستخدم العملاء المخصصون للتفريغ النصي فقط `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، ثم `talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close` عندما يحتاجون إلى تسميات توضيحية أو إملاء من دون رد صوتي من المساعد.

التحدث الأصلي هو حلقة محادثة صوتية مستمرة:

1. الاستماع إلى الكلام
2. إرسال التفريغ النصي إلى النموذج عبر الجلسة النشطة
3. انتظار الرد
4. نطقه عبر موفر التحدث المكوّن (`talk.speak`)

يمرر التحدث في الوقت الحقيقي المملوك للعميل استدعاءات أدوات الموفر عبر `talk.client.toolCall`؛ ولا يستدعي هؤلاء العملاء `chat.send` مباشرة لاستشارات الوقت الحقيقي.
أثناء نشاط استشارة في الوقت الحقيقي، يمكن لعملاء التحدث استخدام `talk.client.steer` أو
`talk.session.steer` لتصنيف الإدخال المنطوق كـ `status` أو `steer` أو `cancel` أو
`followup`. تُصفّ التوجيهات المقبولة في التشغيل المضمّن النشط؛ وتعيد
التوجيهات المرفوضة سببًا منظمًا مثل `no_active_run` أو `not_streaming`
أو `compacting`.

يبث التحدث المخصص للتفريغ النصي فقط مغلف حدث التحدث المشترك نفسه مثل جلسات الوقت الحقيقي وSTT/TTS، لكنه يستخدم `mode: "transcription"` و`brain: "none"`. وهو مخصص للتسميات التوضيحية والإملاء والتقاط الكلام للمراقبة فقط؛ أما الملاحظات الصوتية المرفوعة لمرة واحدة فما زالت تستخدم مسار الوسائط/الصوت.

## السلوك (macOS)

- **تراكب دائم التشغيل** أثناء تمكين وضع التحدث.
- انتقالات المراحل: **الاستماع → التفكير → التحدث**.
- عند **توقف قصير** (نافذة صمت)، يُرسل التفريغ النصي الحالي.
- تُكتب الردود **إلى WebChat** (مثل الكتابة).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم بالتحدث أثناء حديث المساعد، نوقف التشغيل ونسجل طابع وقت المقاطعة للموجه التالي.

## توجيهات الصوت في الردود

يمكن للمساعد أن يسبق رده بـ **سطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- السطر الأول غير الفارغ فقط.
- يتم تجاهل المفاتيح غير المعروفة.
- ينطبق `once: true` على الرد الحالي فقط.
- من دون `once`، يصبح الصوت هو الافتراضي الجديد لوضع التحدث.
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

الإعدادات الافتراضية:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: عند عدم ضبطه، يحتفظ التحدث بنافذة التوقف الافتراضية للمنصة قبل إرسال التفريغ النصي (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: يختار موفر التحدث النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يعود إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` لـ ElevenLabs (أو أول صوت ElevenLabs عندما يكون مفتاح API متاحًا).
- `providers.elevenlabs.modelId`: يكون افتراضيًا `eleven_v3` عند عدم ضبطه.
- `providers.mlx.modelId`: يكون افتراضيًا `mlx-community/Soprano-80M-bf16` عند عدم ضبطه.
- `providers.elevenlabs.apiKey`: يعود إلى `ELEVENLABS_API_KEY` (أو ملف تعريف صدفة Gateway إذا كان متاحًا).
- `consultThinkingLevel`: تجاوز اختياري لمستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات `openclaw_agent_consult` في الوقت الحقيقي.
- `consultFastMode`: تجاوز اختياري للوضع السريع لاستدعاءات `openclaw_agent_consult` في الوقت الحقيقي.
- `realtime.provider`: يختار موفر الصوت النشط في الوقت الحقيقي. استخدم `openai` لـ WebRTC، أو `google` لـ WebSocket الخاص بالموفر، أو موفرًا مخصصًا للجسر فقط عبر ترحيل Gateway.
- `realtime.providers.<provider>` يخزن تكوين الوقت الحقيقي المملوك للموفر. لا يتلقى المتصفح إلا بيانات اعتماد جلسة مؤقتة أو مقيّدة، وليس مفتاح API قياسيًا أبدًا.
- `realtime.providers.openai.voice`: معرّف صوت OpenAI Realtime مدمج. أصوات `gpt-realtime-2` الحالية هي `alloy` و`ash` و`ballad` و`coral` و`echo` و`sage` و`shimmer` و`verse` و`marin` و`cedar`؛ ويوصى بـ `marin` و`cedar` للحصول على أفضل جودة.
- `realtime.transport`: يستخدم `webrtc` WebRTC الخاص بـ OpenAI والمملوك للعميل على iOS وفي المتصفح. `provider-websocket` مملوك للمتصفح لكنه يبقى على ترحيل Gateway على iOS. يُبقي `gateway-relay` صوت الموفر على Gateway؛ يستخدم Android الوقت الحقيقي لهذا النقل فقط، وإلا فيُبقي حلقة STT/TTS الأصلية.
- `realtime.brain`: يوجه `agent-consult` استدعاءات أدوات الوقت الحقيقي عبر سياسة Gateway؛ و`direct-tools` هو سلوك توافق قديم للأدوات المباشرة؛ و`none` مخصص للتفريغ النصي أو التنسيق الخارجي.
- `realtime.consultRouting`: يحافظ `provider-direct` على الرد المباشر للموفر عندما يتخطى `openclaw_agent_consult`؛ ويجعل `force-agent-consult` ترحيل Gateway يوجه تفريغات المستخدم النهائية عبر OpenClaw بدلًا من ذلك.
- `realtime.instructions`: يلحق تعليمات نظام موجهة للموفر بموجه الوقت الحقيقي المدمج في OpenClaw. استخدمه لأسلوب الصوت ونبرته؛ يحتفظ OpenClaw بتوجيه `openclaw_agent_consult` الافتراضي.
- يكشف `talk.catalog` عن الأوضاع الصالحة لكل موفر، ووسائل النقل، واستراتيجيات الدماغ، وتنسيقات صوت الوقت الحقيقي، وعلامات القدرة حتى يستطيع عملاء التحدث من الطرف الأول تجنب التركيبات غير المدعومة.
- يتم اكتشاف موفري التفريغ النصي المتدفق عبر `talk.catalog.transcription`. يستخدم ترحيل Gateway الحالي تكوين موفر بث Voice Call حتى تتم إضافة سطح تكوين التفريغ النصي المخصص للتحدث.
- `speechLocale`: معرّف لغة BCP 47 اختياري للتعرف على كلام التحدث على الجهاز في iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- `outputFormat`: يكون افتراضيًا `pcm_44100` على macOS/iOS و`pcm_24000` على Android (اضبط `mp3_*` لفرض بث MP3)

## واجهة macOS

- تبديل شريط القائمة: **تحدث**
- تبويب التكوين: مجموعة **وضع التحدث** (معرّف الصوت + تبديل المقاطعة)
- التراكب:
  - **الاستماع**: نبضات سحابية مع مستوى الميكروفون
  - **التفكير**: حركة غوص
  - **التحدث**: حلقات مشعة
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع التحدث

## واجهة Android

- تبديل تبويب الصوت: **تحدث**
- **الميكروفون** اليدوي و**التحدث** وضعا التقاط وقت تشغيل متنافيان.
- يفضل الميكروفون اليدوي والتحدث في الوقت الحقيقي ميكروفون سماعة رأس Bluetooth Classic أو BLE متصلًا. إذا انقطع الاتصال، يطلب التطبيق إدخال سماعة رأس آخر أو يتيح لـ Android استخدام الميكروفون الافتراضي؛ ويعيد إيقاف الالتقاط تفضيل الميكروفون الافتراضي.
- يتوقف الميكروفون اليدوي عندما يغادر التطبيق الواجهة الأمامية أو يغادر المستخدم تبويب الصوت.
- يستمر وضع التحدث في العمل حتى يتم إيقافه أو تنقطع عقدة Android، ويستخدم نوع خدمة المقدمة للميكروفون في Android أثناء نشاطه.

## ملاحظات

- يتطلب أذونات الكلام + الميكروفون.
- يستخدم التحدث الأصلي جلسة Gateway النشطة ولا يعود إلى استقصاء السجل إلا عندما لا تكون أحداث الاستجابة متاحة.
- يستخدم التحدث في الوقت الحقيقي المملوك للعميل `talk.client.toolCall` لـ `openclaw_agent_consult` بدلًا من كشف `chat.send` للجلسات المملوكة للموفر.
- يستخدم التحدث المخصص للتفريغ النصي فقط `talk.session.create` و`talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close`؛ ويشترك العملاء في `talk.event` لتحديثات التفريغ النصي الجزئية/النهائية.
- يحل Gateway تشغيل التحدث عبر `talk.speak` باستخدام موفر التحدث النشط. يعود Android إلى TTS النظام المحلي فقط عندما يكون RPC هذا غير متاح.
- يستخدم تشغيل MLX المحلي على macOS المساعد المضمّن `openclaw-mlx-tts` عند وجوده، أو ملفًا تنفيذيًا على `PATH`. اضبط `OPENCLAW_MLX_TTS_BIN` للإشارة إلى ملف مساعد تنفيذي مخصص أثناء التطوير.
- يتم التحقق من `stability` لـ `eleven_v3` ليكون `0.0` أو `0.5` أو `1.0`؛ وتقبل النماذج الأخرى `0..1`.
- يتم التحقق من `latency_tier` ليكون `0..4` عند ضبطه.
- يدعم Android تنسيقات إخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` لبث AudioTrack منخفض زمن الاستجابة.

## ذات صلة

- [إيقاظ الصوت](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
