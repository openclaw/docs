---
read_when:
    - تنفيذ وضع التحدث على macOS/iOS/Android
    - تغيير سلوك الصوت/تحويل النص إلى كلام/المقاطعة
summary: 'وضع التحدث: محادثات كلامية مستمرة عبر STT/TTS المحلي والصوت في الوقت الفعلي'
title: وضع التحدث
x-i18n:
    generated_at: "2026-06-27T17:55:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

لدى وضع التحدث شكلان تشغيليان وقت التشغيل:

- يستخدم التحدث الأصلي على macOS/iOS/Android التعرف المحلي على الكلام، ودردشة Gateway، وTTS عبر `talk.speak`. تعلن العُقد عن قدرة `talk` وتصرّح بأوامر `talk.*` التي تدعمها.
- يستخدم التحدث عبر المتصفح `talk.client.create` لجلسات `webrtc` و`provider-websocket` المملوكة للعميل، أو `talk.session.create` لجلسات `gateway-relay` المملوكة لـ Gateway. `managed-room` محجوز لتسليم Gateway وغرف اللاسلكي.
- يمكن لتحدث Android الاشتراك في جلسات ترحيل فوري مملوكة لـ Gateway باستخدام `talk.realtime.mode: "realtime"` و`talk.realtime.transport: "gateway-relay"`. وإلا فإنه يبقى على التعرف الأصلي على الكلام، ودردشة Gateway، و`talk.speak`.
- يستخدم عملاء التفريغ النصي فقط `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`، ثم `talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close` عندما يحتاجون إلى تعليقات نصية أو إملاء دون رد صوتي من المساعد.

التحدث الأصلي هو حلقة محادثة صوتية مستمرة:

1. الاستماع للكلام
2. إرسال التفريغ النصي إلى النموذج عبر الجلسة النشطة
3. انتظار الرد
4. نطقه عبر مزود التحدث المكوّن (`talk.speak`)

يمرر التحدث الفوري عبر المتصفح استدعاءات أدوات المزود عبر `talk.client.toolCall`؛ ولا يستدعي عملاء المتصفح `chat.send` مباشرة للاستشارات الفورية.
أثناء نشاط استشارة فورية، يمكن لعملاء التحدث استخدام `talk.client.steer` أو
`talk.session.steer` لتصنيف الإدخال المنطوق بوصفه `status` أو `steer` أو `cancel` أو
`followup`. تُضاف التوجيهات المقبولة إلى الدوران المضمّن النشط في الطابور؛ أما
التوجيهات المرفوضة فتعيد سببًا منظمًا مثل `no_active_run` أو `not_streaming`
أو `compacting`.

يبث التحدث المخصص للتفريغ النصي فقط غلاف أحداث التحدث المشترك نفسه مثل جلسات الوقت الفعلي وSTT/TTS، لكنه يستخدم `mode: "transcription"` و`brain: "none"`. وهو مخصص للتعليقات النصية، والإملاء، والتقاط الكلام للمراقبة فقط؛ أما الملاحظات الصوتية المرفوعة لمرة واحدة فما زالت تستخدم مسار الوسائط/الصوت.

## السلوك (macOS)

- **تراكب دائم التشغيل** أثناء تفعيل وضع التحدث.
- انتقالات المراحل **الاستماع ← التفكير ← التحدث**.
- عند **توقف قصير** (نافذة صمت)، يُرسل التفريغ النصي الحالي.
- تُكتب الردود **في WebChat** (مثل الكتابة).
- **المقاطعة عند الكلام** (مفعلة افتراضيًا): إذا بدأ المستخدم الكلام أثناء تحدث المساعد، نوقف التشغيل ونسجل الطابع الزمني للمقاطعة للمطالبة التالية.

## توجيهات الصوت في الردود

قد يسبق المساعد رده بـ **سطر JSON واحد** للتحكم في الصوت:

```json
{ "voice": "<voice-id>", "once": true }
```

القواعد:

- السطر الأول غير الفارغ فقط.
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
- `silenceTimeoutMs`: عند عدم ضبطها، يحافظ التحدث على نافذة التوقف الافتراضية للمنصة قبل إرسال التفريغ النصي (`700 ms على macOS وAndroid، و900 ms على iOS`)
- `provider`: يحدد مزود التحدث النشط. استخدم `elevenlabs` أو `mlx` أو `system` لمسارات التشغيل المحلية على macOS.
- `providers.<provider>.voiceId`: يعود إلى `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` لـ ElevenLabs (أو أول صوت ElevenLabs عندما يكون مفتاح API متاحًا).
- `providers.elevenlabs.modelId`: القيمة الافتراضية هي `eleven_v3` عند عدم الضبط.
- `providers.mlx.modelId`: القيمة الافتراضية هي `mlx-community/Soprano-80M-bf16` عند عدم الضبط.
- `providers.elevenlabs.apiKey`: يعود إلى `ELEVENLABS_API_KEY` (أو ملف تعريف صدفة Gateway إذا كان متاحًا).
- `consultThinkingLevel`: تجاوز اختياري لمستوى التفكير لتشغيل وكيل OpenClaw الكامل خلف استدعاءات `openclaw_agent_consult` الفورية.
- `consultFastMode`: تجاوز اختياري للوضع السريع لاستدعاءات `openclaw_agent_consult` الفورية.
- `realtime.provider`: يحدد مزود الصوت الفوري النشط للمتصفح/الخادم. استخدم `openai` لـ WebRTC، أو `google` لـ WebSocket الخاص بالمزود، أو مزودًا مخصصًا للجسر فقط عبر ترحيل Gateway.
- `realtime.providers.<provider>` يخزن إعدادات الوقت الفعلي المملوكة للمزود. لا يتلقى المتصفح إلا بيانات اعتماد جلسة مؤقتة أو مقيّدة، ولا يتلقى أبدًا مفتاح API قياسيًا.
- `realtime.providers.openai.voice`: معرّف صوت OpenAI Realtime المضمّن. أصوات `gpt-realtime-2` الحالية هي `alloy` و`ash` و`ballad` و`coral` و`echo` و`sage` و`shimmer` و`verse` و`marin` و`cedar`؛ ويوصى بـ `marin` و`cedar` للحصول على أفضل جودة.
- `realtime.transport`: `webrtc` و`provider-websocket` هما نقلا الوقت الفعلي عبر المتصفح. يستخدم Android ترحيل الوقت الفعلي فقط عندما تكون هذه القيمة `gateway-relay`؛ وإلا يستخدم تحدث Android حلقة STT/TTS الأصلية الخاصة به.
- `realtime.brain`: يوجه `agent-consult` استدعاءات أدوات الوقت الفعلي عبر سياسة Gateway؛ أما `direct-tools` فهو سلوك توافق قديم للأدوات المباشرة؛ و`none` مخصص للتفريغ النصي أو التنسيق الخارجي.
- `realtime.consultRouting`: يحافظ `provider-direct` على الرد المباشر للمزود عندما يتخطى `openclaw_agent_consult`؛ أما `force-agent-consult` فيجعل ترحيل Gateway يوجه التفريغات النصية النهائية للمستخدم عبر OpenClaw بدلًا من ذلك.
- `realtime.instructions`: يضيف تعليمات نظام موجهة للمزود إلى مطالبة الوقت الفعلي المضمّنة في OpenClaw. استخدمه لأسلوب الصوت ونبرته؛ ويحافظ OpenClaw على إرشادات `openclaw_agent_consult` الافتراضية.
- يكشف `talk.catalog` عن الأوضاع ووسائل النقل واستراتيجيات الدماغ وتنسيقات الصوت الفوري وإشارات القدرة الصالحة لكل مزود، حتى يتمكن عملاء التحدث من الطرف الأول من تجنب التركيبات غير المدعومة.
- تُكتشف مزودات التفريغ النصي المتدفق عبر `talk.catalog.transcription`. يستخدم ترحيل Gateway الحالي إعدادات مزود بث Voice Call إلى أن يُضاف سطح إعدادات تفريغ التحدث النصي المخصص.
- `speechLocale`: معرّف لغة BCP 47 اختياري للتعرف على كلام التحدث على الجهاز في iOS/macOS. اتركه غير مضبوط لاستخدام الإعداد الافتراضي للجهاز.
- `outputFormat`: القيمة الافتراضية هي `pcm_44100` على macOS/iOS و`pcm_24000` على Android (اضبط `mp3_*` لفرض بث MP3)

## واجهة macOS

- مفتاح شريط القوائم: **التحدث**
- تبويب الإعدادات: مجموعة **وضع التحدث** (معرّف الصوت + مفتاح المقاطعة)
- التراكب:
  - **الاستماع**: تنبض السحابة مع مستوى الميكروفون
  - **التفكير**: حركة غوص
  - **التحدث**: حلقات مشعة
  - النقر على السحابة: إيقاف التحدث
  - النقر على X: الخروج من وضع التحدث

## واجهة Android

- مفتاح تبويب الصوت: **التحدث**
- **الميكروفون** اليدوي و**التحدث** هما وضعا التقاط وقت تشغيل متنافيان.
- يتوقف الميكروفون اليدوي عندما يغادر التطبيق الواجهة الأمامية أو يغادر المستخدم تبويب الصوت.
- يستمر وضع التحدث في العمل إلى أن يُعطل أو تنقطع عقدة Android، ويستخدم نوع خدمة المقدمة للميكروفون في Android أثناء نشاطه.

## ملاحظات

- يتطلب أذونات الكلام والميكروفون.
- يستخدم التحدث الأصلي جلسة Gateway النشطة ولا يعود إلى استطلاع السجل إلا عندما تكون أحداث الرد غير متاحة.
- يستخدم التحدث الفوري عبر المتصفح `talk.client.toolCall` لـ `openclaw_agent_consult` بدلًا من كشف `chat.send` لجلسات المتصفح المملوكة للمزود.
- يستخدم التحدث المخصص للتفريغ النصي فقط `talk.session.create` و`talk.session.appendAudio` و`talk.session.cancelTurn` و`talk.session.close`؛ ويشترك العملاء في `talk.event` لتحديثات التفريغ النصي الجزئية/النهائية.
- يحل Gateway تشغيل التحدث عبر `talk.speak` باستخدام مزود التحدث النشط. يعود Android إلى TTS المحلي للنظام فقط عندما يكون RPC هذا غير متاح.
- يستخدم تشغيل MLX المحلي على macOS المساعد المضمّن `openclaw-mlx-tts` عند وجوده، أو ملفًا تنفيذيًا على `PATH`. اضبط `OPENCLAW_MLX_TTS_BIN` للإشارة إلى ملف مساعد ثنائي مخصص أثناء التطوير.
- تُتحقق قيمة `stability` لـ `eleven_v3` لتكون `0.0` أو `0.5` أو `1.0`؛ وتقبل النماذج الأخرى `0..1`.
- تُتحقق قيمة `latency_tier` لتكون `0..4` عند ضبطها.
- يدعم Android تنسيقات إخراج `pcm_16000` و`pcm_22050` و`pcm_24000` و`pcm_44100` لبث AudioTrack منخفض الكمون.

## ذات صلة

- [تنبيه صوتي](/ar/nodes/voicewake)
- [الصوت والملاحظات الصوتية](/ar/nodes/audio)
- [فهم الوسائط](/ar/nodes/media-understanding)
