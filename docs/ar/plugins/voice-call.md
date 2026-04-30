---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بتهيئة Plugin المكالمات الصوتية أو تطويره
    - تحتاج إلى صوت في الوقت الفعلي أو تفريغ نصي متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: أجرِ مكالمات صوتية صادرة واقبل مكالمات واردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الحقيقي والتفريغ النصي المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-04-30T08:18:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

المكالمات الصوتية لـ OpenClaw عبر Plugin. يدعم إشعارات صادرة،
ومحادثات متعددة الأدوار، وصوتًا فوريًا مزدوج الاتجاه بالكامل، ونسخًا
متدفقًا، ومكالمات واردة مع سياسات قائمة سماح.

**الموفرون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (تطوير/بلا شبكة).

<Note>
يعمل Voice Call plugin **داخل عملية Gateway**. إذا كنت تستخدم
Gateway بعيدًا، فثبّت Plugin واضبطه على الجهاز الذي يشغّل
Gateway، ثم أعد تشغيل Gateway لتحميله.
</Note>

## البدء السريع

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فهذا يعني أن إصدار الحزمة
    هذا من مسار حزم خارجي أقدم؛ استخدم بناء OpenClaw محزمًا حاليًا
    أو مسار المجلد المحلي إلى أن تُنشر حزمة npm أحدث.

    أعد تشغيل Gateway بعد ذلك كي يُحمَّل Plugin.

  </Step>
  <Step title="Configure provider and webhook">
    اضبط الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [الإعداد](#configuration) أدناه للبنية الكاملة). كحد أدنى:
    `provider`، وبيانات اعتماد الموفر، و`fromNumber`، وعنوان Webhook URL
    قابل للوصول علنًا.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    الإخراج الافتراضي قابل للقراءة في سجلات الدردشة والطرفيات. يتحقق من
    تفعيل Plugin، وبيانات اعتماد الموفر، وتعرّض Webhook، وأن
    وضعًا صوتيًا واحدًا فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للسكربتات.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيل جاف افتراضيًا. أضف `--yes` لإجراء مكالمة إشعار صادرة
    قصيرة فعليًا:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن ينتهي الإعداد إلى **عنوان Webhook URL عام**.
إذا كان `publicUrl` أو عنوان URL للنفق أو عنوان Tailscale URL أو بديل الخدمة
ينتهي إلى loopback أو نطاق شبكة خاصة، يفشل الإعداد بدلًا من
بدء موفر لا يمكنه استقبال Webhooks من شركات الاتصالات.
</Warning>

## الإعداد

إذا كان `enabled: true` ولكن الموفر المحدد تنقصه بيانات اعتماد،
تسجل عملية بدء Gateway تحذيرًا بأن الإعداد غير مكتمل مع المفاتيح الناقصة
وتتخطى بدء وقت التشغيل. لا تزال الأوامر واستدعاءات RPC وأدوات الوكيل
تعيد إعداد الموفر الناقص بدقة عند استخدامها.

<Note>
تقبل بيانات اعتماد voice-call مراجع SecretRefs. يتم حل `plugins.entries.voice-call.config.twilio.authToken` و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر سطح SecretRef القياسي؛ راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Note>

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
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider exposure and security notes">
    - تتطلب Twilio وTelnyx وPlivo جميعها عنوان Webhook URL **قابلًا للوصول علنًا**.
    - `mock` موفر تطوير محلي (بلا استدعاءات شبكة).
    - يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
    - `skipSignatureVerification` للاختبار المحلي فقط.
    - في الطبقة المجانية من ngrok، اضبط `publicUrl` على عنوان ngrok URL الدقيق؛ يتم فرض التحقق من التوقيع دائمًا.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhooks من Twilio ذات توقيعات غير صالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن لعناوين URL في الطبقة المجانية من Ngrok أن تتغير أو تضيف سلوك صفحة وسيطة؛ إذا انحرف `publicUrl`، تفشل توقيعات Twilio. في الإنتاج: فضّل نطاقًا ثابتًا أو قناة Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل أبدًا إطار `start` صالحًا.
    - يحد `streaming.maxPendingConnections` إجمالي مقابس ما قبل البدء غير المصادق عليها.
    - يحد `streaming.maxPendingConnectionsPerIp` مقابس ما قبل البدء غير المصادق عليها لكل عنوان IP مصدر.
    - يحد `streaming.maxConnections` إجمالي مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="Legacy config migrations">
    تعيد `openclaw doctor --fix` كتابة الإعدادات الأقدم التي تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة
    ضمن `streaming.*`. لا يزال بديل وقت التشغيل يقبل مفاتيح voice-call القديمة حاليًا، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح البث التي تُرحّل تلقائيًا:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## محادثات صوتية فورية

يحدد `realtime` موفر صوت فوري مزدوج الاتجاه بالكامل لصوت المكالمة المباشرة.
وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
موفري النسخ الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر وضعًا
صوتيًا واحدًا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لـ Twilio Media Streams.
- `realtime.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول موفر صوت فوري مسجل.
- موفرو الصوت الفوري المضمنون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويتم تسجيلهما بواسطة Plugins الموفرين الخاصة بهما.
- يوجد الإعداد الخام المملوك للموفر ضمن `realtime.providers.<providerId>`.
- يكشف Voice Call أداة `openclaw_agent_consult` الفورية المشتركة افتراضيًا. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل تفكيرًا أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- إذا أشار `realtime.provider` إلى موفر غير مسجل، أو لم يكن أي موفر صوت فوري مسجلًا على الإطلاق، يسجل Voice Call تحذيرًا ويتخطى وسائط realtime بدلًا من إفشال Plugin كله.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة الصوت الحالية عند توفرها، ثم تعود إلى رقم هاتف المتصل/المستقبِل كي تحتفظ استدعاءات الاستشارة اللاحقة بالسياق أثناء المكالمة.

### سياسة الأداة

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | يكشف أداة الاستشارة ويقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | يكشف أداة الاستشارة ويسمح للوكيل العادي باستخدام سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا يكشف أداة الاستشارة. لا تزال `realtime.tools` المخصصة تُمرر إلى موفر realtime.                               |

### أمثلة موفري realtime

<Tabs>
  <Tab title="Google Gemini Live">
    الافتراضيات: مفتاح API من `realtime.providers.google.apiKey`،
    أو `GEMINI_API_KEY`، أو `GOOGLE_GENERATIVE_AI_API_KEY`؛ النموذج
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ الصوت `Kore`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

راجع [موفر Google](/ar/providers/google) و
[موفر OpenAI](/ar/providers/openai) للاطلاع على خيارات الصوت الفوري
الخاصة بالموفر.

## النسخ المتدفق

يحدد `streaming` موفر نسخ فوري لصوت المكالمة المباشرة.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول موفر نسخ فوري مسجل.
- موفرو النسخ الفوري المضمنون: Deepgram (`deepgram`) وElevenLabs (`elevenlabs`) وMistral (`mistral`) وOpenAI (`openai`) وxAI (`xai`)، ويتم تسجيلهم بواسطة Plugins الموفرين الخاصة بهم.
- يوجد الإعداد الخام المملوك للموفر ضمن `streaming.providers.<providerId>`.
- إذا أشار `streaming.provider` إلى موفر غير مسجل، أو لم يكن أي موفر مسجلًا، يسجل Voice Call تحذيرًا ويتخطى بث الوسائط بدلًا من إفشال Plugin كله.

### أمثلة موفري البث

<Tabs>
  <Tab title="OpenAI">
    الافتراضيات: مفتاح API `streaming.providers.openai.apiKey` أو
    `OPENAI_API_KEY`؛ النموذج `gpt-4o-transcribe`؛ `silenceDurationMs: 800`؛
    `vadThreshold: 0.5`.

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

  </Tab>
  <Tab title="xAI">
    الإعدادات الافتراضية: مفتاح API `streaming.providers.xai.apiKey` أو `XAI_API_KEY`؛
    نقطة النهاية `wss://api.x.ai/v1/stt`؛ الترميز `mulaw`؛ معدل العينة `8000`؛
    `endpointingMs: 800`؛ `interimResults: true`.

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

  </Tab>
</Tabs>

## TTS للمكالمات

يستخدم Voice Call إعدادات `messages.tts` الأساسية لبث
الكلام في المكالمات. يمكنك تجاوزها ضمن إعدادات Plugin
**بالبنية نفسها** — إذ تُدمج بعمق مع `messages.tts`.

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

<Warning>
**يتم تجاهل Microsoft speech في المكالمات الصوتية.** يحتاج صوت الاتصالات الهاتفية إلى PCM؛
ولا يكشف نقل Microsoft الحالي خرج PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- يتم إصلاح مفاتيح `tts.<provider>` القديمة داخل إعدادات Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم الإعدادات الملتزم بها `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تمكين بث وسائط Twilio؛ وإلا فتعود المكالمات إلى الأصوات الأصلية لدى المزوّد.
- إذا كان بث وسائط Twilio نشطًا بالفعل، فلن يعود Voice Call إلى TwiML `<Say>`. وإذا كان TTS الهاتفي غير متاح في تلك الحالة، يفشل طلب التشغيل بدلًا من مزج مساري تشغيل.
- عندما يعود TTS الهاتفي إلى مزوّد ثانوي، يسجل Voice Call تحذيرًا يتضمن سلسلة المزوّدين (`from`، `to`، `attempts`) لأغراض تصحيح الأخطاء.
- عندما يمسح تدخل Twilio أو تفكيك البث قائمة انتظار TTS المعلقة، تُسوّى طلبات التشغيل الموجودة في القائمة بدلًا من إبقاء المتصلين معلقين بانتظار اكتمال التشغيل.

### أمثلة TTS

<Tabs>
  <Tab title="Core TTS only">
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
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
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
  </Tab>
</Tabs>

## المكالمات الواردة

تكون سياسة المكالمات الواردة افتراضيًا `disabled`. لتمكين المكالمات الواردة، عيّن:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` هي شاشة تحقق منخفضة الضمان من معرّف المتصل. يطبّع
Plugin قيمة `From` المقدمة من المزوّد ويقارنها مع
`allowFrom`. يتحقق توثيق Webhook من تسليم المزوّد
وسلامة الحمولة، لكنه **لا** يثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كترشيح لمعرّف المتصل، لا كهوية متصل قوية.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`،
`responseSystemPrompt`، و`responseTimeoutMs`.

### عقد الخرج المنطوق

للردود التلقائية، يضيف Voice Call عقد خرج منطوق صارمًا إلى
موجّه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بطريقة دفاعية:

- يتجاهل الحمولات الموسومة كمحتوى استدلال/خطأ.
- يوزّع JSON مباشرًا، أو JSON داخل سياج، أو مفاتيح `"spoken"` مضمنة.
- يعود إلى النص العادي ويزيل فقرات المقدمة التي يُرجح أنها تخطيطية/وصفية.

يحافظ هذا على تركيز التشغيل المنطوق على النص الموجه للمتصل، ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

في مكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة
التشغيل الحية:

- لا يتم كبت مسح قائمة انتظار التدخل والرد التلقائي إلا أثناء نطق التحية الأولية فعليًا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث دون تأخير إضافي.
- يوقف التدخل التشغيل النشط ويمسح إدخالات Twilio TTS الموضوعة في قائمة الانتظار والتي لم يبدأ تشغيلها بعد. تُحل الإدخالات الممسوحة على أنها متخطاة، بحيث يمكن لمنطق الرد اللاحق الاستمرار دون انتظار صوت لن يتم تشغيله أبدًا.
- تستخدم محادثات الصوت في الوقت الفعلي دورة الافتتاح الخاصة ببث الوقت الفعلي نفسه. لا ينشر Voice Call تحديث TwiML قديمًا من نوع `<Say>` لتلك الرسالة الأولية، لذلك تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### فترة سماح انقطاع بث Twilio

عند انقطاع بث وسائط Twilio، ينتظر Voice Call **2000 ms** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعاد البث الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجَّل أي بث مجددًا بعد فترة السماح، تُنهى المكالمة لمنع بقاء المكالمات عالقة في حالة نشطة.

## جامع المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى Webhook
نهائيًا أبدًا (على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية
هي `0` (معطّل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات نمط الإشعار.
- أبقِ هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات العادية من الانتهاء. نقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

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

عند وجود وكيل أو نفق أمام Gateway، يعيد Plugin
بناء عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات
في رؤوس التمرير الموثوقة:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  اسمح بمضيفين من رؤوس التمرير.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  ثق برؤوس التمرير دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  ثق برؤوس التمرير فقط عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- يتم تمكين **الحماية من إعادة تشغيل Webhook** لكل من Twilio وPlivo. يُقر بطلبات Webhook الصالحة المعاد تشغيلها، لكنها تُتخطى من حيث الآثار الجانبية.
- تتضمن أدوار محادثة Twilio رمزًا لكل دور في ردود نداء `<Gather>`، بحيث لا يمكن لردود نداء الكلام القديمة/المعاد تشغيلها تلبية دور نص معلق أحدث.
- تُرفض طلبات Webhook غير الموثقة قبل قراءة الجسم عندما تكون رؤوس التوقيع المطلوبة من المزوّد مفقودة.
- يستخدم Webhook الخاص بالمكالمات الصوتية ملف تعريف الجسم المشترك قبل المصادقة (64 KB / 5 ثوانٍ)، بالإضافة إلى حد أقصى للطلبات الجارية لكل عنوان IP قبل التحقق من التوقيع.

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
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين voice-call الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لحصر
التحليل في آخر N سجلًا (الافتراضي 200). يتضمن الخرج p50/p90/p99
لزمن استجابة الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء          | الوسائط                    |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

يشحن هذا المستودع مستند skill مطابقًا في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة              | الوسائط                    |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## ذو صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [الإيقاظ الصوتي](/ar/nodes/voicewake)
