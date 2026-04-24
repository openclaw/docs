---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بإعداد أو تطوير Plugin voice-call
summary: 'Plugin Voice Call: المكالمات الصادرة + الواردة عبر Twilio/Telnyx/Plivo ‏(تثبيت Plugin + الإعداد + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T07:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

المكالمات الصوتية لـ OpenClaw عبر Plugin. تدعم الإشعارات الصادرة
والمحادثات متعددة الأدوار مع سياسات واردة.

الموفرون الحاليون:

- `twilio` ‏(Programmable Voice + Media Streams)
- `telnyx` ‏(Call Control v2)
- `plivo` ‏(Voice API + XML transfer + GetInput speech)
- `mock` ‏(تطوير/من دون شبكة)

النموذج الذهني السريع:

- ثبّت Plugin
- أعد تشغيل Gateway
- اضبطها تحت `plugins.entries.voice-call.config`
- استخدم `openclaw voicecall ...` أو أداة `voice_call`

## أين تعمل (محليًا أم عن بُعد)

تعمل Plugin Voice Call **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدة، فثبّت/اضبط Plugin على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway لتحميلها.

## التثبيت

### الخيار A: التثبيت من npm ‏(موصى به)

```bash
openclaw plugins install @openclaw/voice-call
```

أعد تشغيل Gateway بعد ذلك.

### الخيار B: التثبيت من مجلد محلي (تطوير، من دون نسخ)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## الإعداد

اضبط الإعداد تحت `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

ملاحظات:

- يتطلب Twilio/Telnyx عنوان Webhook **قابلًا للوصول علنًا**.
- يتطلب Plivo عنوان Webhook **قابلًا للوصول علنًا**.
- `mock` هو موفر تطوير محلي (من دون استدعاءات شبكة).
- إذا كانت الإعدادات الأقدم لا تزال تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة ضمن `streaming.*`، فشغّل `openclaw doctor --fix` لإعادة كتابتها.
- يتطلب Telnyx القيمة `telnyx.publicKey` ‏(أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
- `skipSignatureVerification` مخصصة للاختبار المحلي فقط.
- إذا كنت تستخدم ngrok المجانية، فاضبط `publicUrl` على عنوان ngrok الدقيق؛ ويتم فرض التحقق من التوقيع دائمًا.
- تسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` لخطافات Webhook في Twilio ذات التوقيعات غير الصالحة **فقط** عندما تكون `tunnel.provider="ngrok"` و`serve.bind` هي loopback ‏(وكيل ngrok المحلي). استخدم هذا للتطوير المحلي فقط.
- يمكن أن تتغير عناوين ngrok المجانية أو تضيف سلوك interstitial؛ وإذا انحرف `publicUrl`، فسيفشل توقيع Twilio. وفي الإنتاج، فضّل نطاقًا ثابتًا أو Tailscale funnel.
- القيم الافتراضية لأمان البث:
  - تقوم `streaming.preStartTimeoutMs` بإغلاق المقابس التي لا ترسل إطار `start` صالحًا أبدًا.
- تقيّد `streaming.maxPendingConnections` إجمالي المقابس غير الموثقة قبل البدء.
- تقيّد `streaming.maxPendingConnectionsPerIp` المقابس غير الموثقة قبل البدء لكل عنوان IP مصدر.
- تقيّد `streaming.maxConnections` إجمالي مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).
- لا يزال الرجوع في وقت التشغيل يقبل مفاتيح voice-call القديمة هذه في الوقت الحالي، لكن مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق مؤقتة.

## النسخ أثناء البث

تحدد `streaming` موفر نسخ فوريًا لصوت المكالمة المباشر.

سلوك وقت التشغيل الحالي:

- تكون `streaming.provider` اختيارية. وإذا لم تُضبط، تستخدم Voice Call أول
  موفر نسخ فوري مسجّل.
- تتضمن موفرو النسخ الفوري المضمنون Deepgram ‏(`deepgram`)،
  وElevenLabs ‏(`elevenlabs`)، وMistral ‏(`mistral`)، وOpenAI ‏(`openai`)، وxAI
  ‏(`xai`)، والتي تسجلها Plugins الموفّرين الخاصة بها.
- تعيش الإعدادات الخام المملوكة للموفر تحت `streaming.providers.<providerId>`.
- إذا كانت `streaming.provider` تشير إلى موفر غير مسجّل، أو لم يكن هناك أي موفر
  نسخ فوري مسجّل أصلًا، فإن Voice Call تسجل تحذيرًا
  وتتخطى بث الوسائط بدلًا من إفساد Plugin بالكامل.

القيم الافتراضية لنسخ OpenAI أثناء البث:

- مفتاح API: ‏`streaming.providers.openai.apiKey` أو `OPENAI_API_KEY`
- النموذج: ‏`gpt-4o-transcribe`
- `silenceDurationMs`: ‏`800`
- `vadThreshold`: ‏`0.5`

القيم الافتراضية لنسخ xAI أثناء البث:

- مفتاح API: ‏`streaming.providers.xai.apiKey` أو `XAI_API_KEY`
- نقطة النهاية: ‏`wss://api.x.ai/v1/stt`
- `encoding`: ‏`mulaw`
- `sampleRate`: ‏`8000`
- `endpointingMs`: ‏`800`
- `interimResults`: ‏`true`

مثال:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

استخدم xAI بدلًا من ذلك:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

لا تزال المفاتيح القديمة تُرحَّل تلقائيًا بواسطة `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## منظف المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تستقبل Webhook نهائية
أبدًا (على سبيل المثال مكالمات وضع notify التي لا تكتمل). والقيمة الافتراضية هي `0`
‏(معطلة).

النطاقات الموصى بها:

- **الإنتاج:** ‏`120`–`300` ثانية للتدفقات على نمط notify.
- أبقِ هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات
  العادية من الانتهاء. ونقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

مثال:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## أمان Webhook

عندما توجد proxy أو نفق أمام Gateway، تقوم Plugin بإعادة بناء
عنوان URL العام من أجل التحقق من التوقيع. وتتحكم هذه الخيارات في الرؤوس
المُمررة الموثوقة.

تضع `webhookSecurity.allowedHosts` قائمة سماح بالمضيفين من رؤوس إعادة التوجيه.

تثق `webhookSecurity.trustForwardingHeaders` في الرؤوس المُمررة من دون قائمة سماح.

لا تثق `webhookSecurity.trustedProxyIPs` في الرؤوس المُمررة إلا عندما يطابق عنوان IP
البعيد للطلب القائمة.

تكون حماية إعادة تشغيل Webhook مفعلة في Twilio وPlivo. ويتم الإقرار بطلبات Webhook
الصالحة المعاد تشغيلها لكن يتم تخطي آثارها الجانبية.

تتضمن أدوار محادثة Twilio رمزًا خاصًا بكل دور في استدعاءات `<Gather>`، بحيث لا تستطيع
استدعاءات الكلام القديمة/المعاد تشغيلها استيفاء دور نص معلق أحدث.

يتم رفض طلبات Webhook غير الموثقة قبل قراءة الجسم عندما تكون رؤوس التوقيع المطلوبة من
الموفر مفقودة.

تستخدم Webhook الخاصة بـ voice-call ملف تعريف الجسم السابق للمصادقة المشترك (64 KB / 5 ثوانٍ)
بالإضافة إلى حد أثناء التنفيذ لكل IP قبل التحقق من التوقيع.

مثال مع مضيف عام ثابت:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS للمكالمات

تستخدم Voice Call إعدادات `messages.tts` الأساسية من أجل
بث الكلام في المكالمات. ويمكنك تجاوزها تحت إعداد Plugin باستخدام
**البنية نفسها** — إذ يتم دمجها بعمق مع `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

ملاحظات:

- تُرحّل مفاتيح `tts.<provider>` القديمة داخل إعداد Plugin تلقائيًا (`openai`, `elevenlabs`, `microsoft`, `edge`) إلى `tts.providers.<provider>` عند التحميل. فضّل بنية `providers` في الإعدادات الملتزم بها.
- **يتم تجاهل Microsoft speech في المكالمات الصوتية** ‏(يتطلب صوت الاتصالات PCM؛ ولا تكشف وسيلة نقل Microsoft الحالية خرج PCM للاتصالات).
- يُستخدم TTS الأساسي عند تمكين Twilio media streaming؛ وإلا فإن المكالمات ترجع إلى أصوات الموفّر الأصلية.
- إذا كان تدفق وسائط Twilio نشطًا بالفعل، فإن Voice Call لا ترجع إلى TwiML ‏`<Say>`. وإذا لم تكن TTS الخاصة بالاتصالات متاحة في تلك الحالة، يفشل طلب التشغيل بدلًا من خلط مساري تشغيل.
- عندما ترجع TTS الخاصة بالاتصالات إلى موفر ثانوي، تسجل Voice Call تحذيرًا بسلسلة الموفّر (`from`, `to`, `attempts`) لأغراض التصحيح.

### مزيد من الأمثلة

استخدم TTS الأساسية فقط (من دون تجاوز):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

جاوز إلى ElevenLabs للمكالمات فقط (وأبقِ الافتراضي الأساسي في مكان آخر):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

جاوز نموذج OpenAI فقط للمكالمات (مثال على الدمج العميق):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## المكالمات الواردة

تكون سياسة الوارد افتراضيًا `disabled`. ولتمكين المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

تمثل `inboundPolicy: "allowlist"` شاشة منخفضة الضمان لمعرّف المتصل. تقوم Plugin
بتطبيع قيمة `From` التي يوفّرها الموفّر وتقارنها بـ `allowFrom`.
يؤكد التحقق من Webhook تسليم الموفّر وسلامة الحمولة، لكنه
لا يثبت ملكية رقم المتصل في PSTN/VoIP. تعامل مع `allowFrom` على أنها
تصفية لمعرّف المتصل، وليست هوية قوية للمتصل.

تستخدم الردود التلقائية نظام الوكيل. ويمكن ضبطها عبر:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### عقد المخرجات المنطوقة

بالنسبة إلى الردود التلقائية، تضيف Voice Call عقدًا صارمًا للمخرجات المنطوقة إلى مطالبة النظام:

- `{"spoken":"..."}`

ثم تستخرج Voice Call نص الكلام بشكل دفاعي:

- تتجاهل الحمولات المعلَّمة على أنها محتوى تفكير/خطأ.
- تحلل JSON المباشر أو JSON المسيّج أو مفاتيح `"spoken"` المضمنة.
- ترجع إلى النص العادي وتزيل الفقرات التمهيدية المرجحة للتخطيط/البيانات الوصفية.

وهذا يُبقي التشغيل المنطوق مركزًا على النص الموجّه للمتصل ويتجنب تسرب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة التشغيل المباشر:

- يتم كبت مسح قائمة المقاطعة والرد التلقائي فقط بينما تكون التحية الأولية تُنطق فعليًا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال التدفق من دون تأخير إضافي.

### فترة السماح لقطع تدفق Twilio

عند انقطاع تدفق وسائط Twilio، تنتظر Voice Call مدة `2000ms` قبل إنهاء المكالمة تلقائيًا:

- إذا أعاد التدفق الاتصال خلال تلك النافذة، يتم إلغاء الإنهاء التلقائي.
- إذا لم تتم إعادة تسجيل أي تدفق بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

يقرأ `latency` الملف `calls.jsonl` من مسار التخزين الافتراضي لـ voice-call. استخدم
`--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لقصر التحليل
على آخر N سجلًا ‏(الافتراضي 200). ويتضمن الإخراج القيم p50/p90/p99 لكمون
الأدوار وأزمنة انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`

الإجراءات:

- `initiate_call` ‏(`message`, `to?`, `mode?`)
- `continue_call` ‏(`callId`, `message`)
- `speak_to_user` ‏(`callId`, `message`)
- `send_dtmf` ‏(`callId`, `digits`)
- `end_call` ‏(`callId`)
- `get_status` ‏(`callId`)

يشحن هذا المستودع وثيقة Skill مطابقة عند `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` ‏(`to?`, `message`, `mode?`)
- `voicecall.continue` ‏(`callId`, `message`)
- `voicecall.speak` ‏(`callId`, `message`)
- `voicecall.dtmf` ‏(`callId`, `digits`)
- `voicecall.end` ‏(`callId`)
- `voicecall.status` ‏(`callId`)

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [وضع Talk](/ar/nodes/talk)
- [تنبيه الصوت](/ar/nodes/voicewake)
