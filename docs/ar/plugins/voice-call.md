---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بتكوين Plugin المكالمات الصوتية أو تطويره
    - تحتاج إلى صوت في الوقت الفعلي أو تفريغ نصي متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: أجرِ مكالمات صوتية صادرة واقبل مكالمات صوتية واردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الفعلي والنسخ النصي المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-05-01T07:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fc13bcfcab09cf1118c851b56ca3bf870720f5a419e86c3c91138ff6c33f2be
    source_path: plugins/voice-call.md
    workflow: 16
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الأدوار، والصوت الفوري مزدوج الاتجاه الكامل، والتفريغ النصي
المتدفق، والمكالمات الواردة مع سياسات قائمة السماح.

**الموفرون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (تطوير/بلا شبكة).

<Note>
يعمل Plugin المكالمات الصوتية **داخل عملية Gateway**. إذا كنت تستخدم
Gateway بعيدا، فثبّت Plugin وكونه على الجهاز الذي يشغل
Gateway، ثم أعد تشغيل Gateway لتحميله.
</Note>

## بدء سريع

<Steps>
  <Step title="ثبّت Plugin">
    <Tabs>
      <Tab title="من npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="من مجلد محلي (تطوير)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فهذا الإصدار من الحزمة
    ينتمي إلى مسار حزم خارجي أقدم؛ استخدم بناء OpenClaw محزما حديثا
    أو مسار المجلد المحلي إلى أن تنشر حزمة npm أحدث.

    أعد تشغيل Gateway بعد ذلك حتى يتم تحميل Plugin.

  </Step>
  <Step title="كوّن الموفر وWebhook">
    اضبط التكوين ضمن `plugins.entries.voice-call.config` (راجع
    [التكوين](#configuration) أدناه للاطلاع على الشكل الكامل). كحد أدنى:
    `provider`، وبيانات اعتماد الموفر، و`fromNumber`، وعنوان URL لـ Webhook
    يمكن الوصول إليه علنا.
  </Step>
  <Step title="تحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    ```

    المخرجات الافتراضية قابلة للقراءة في سجلات الدردشة والطرفيات. تتحقق من
    تمكين Plugin، وبيانات اعتماد الموفر، وإتاحة Webhook، ومن أن
    وضع صوت واحدا فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للسكريبتات.

  </Step>
  <Step title="اختبار أولي">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيل جاف افتراضيا. أضف `--yes` لإجراء مكالمة إشعار
    صادرة قصيرة فعليا:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن يحل الإعداد إلى **عنوان URL عام لـ Webhook**.
إذا كان `publicUrl`، أو عنوان URL للنفق، أو عنوان URL لـ Tailscale، أو بديل الخدمة
يحل إلى local loopback أو مساحة شبكة خاصة، يفشل الإعداد بدلا من
بدء موفر لا يمكنه استقبال Webhooks من شركات الاتصالات.
</Warning>

## التكوين

إذا كان `enabled: true` لكن الموفر المحدد يفتقد بيانات الاعتماد،
تسجل عملية بدء Gateway تحذير إعداد غير مكتمل مع المفاتيح المفقودة
وتتخطى بدء وقت التشغيل. لا تزال الأوامر ونداءات RPC وأدوات الوكيل
تعيد تكوين الموفر المفقود بدقة عند استخدامها.

<Note>
تقبل بيانات اعتماد المكالمات الصوتية SecretRefs. يتم حل `plugins.entries.voice-call.config.twilio.authToken` و`plugins.entries.voice-call.config.realtime.providers.*.apiKey` و`plugins.entries.voice-call.config.streaming.providers.*.apiKey` و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر سطح SecretRef القياسي؛ راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
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
  <Accordion title="ملاحظات إتاحة الموفر وأمانه">
    - تتطلب Twilio وTelnyx وPlivo جميعا عنوان URL لـ Webhook **يمكن الوصول إليه علنا**.
    - `mock` موفر تطوير محلي (بلا نداءات شبكة).
    - يتطلب Telnyx `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` true.
    - `skipSignatureVerification` مخصص للاختبار المحلي فقط.
    - في طبقة ngrok المجانية، اضبط `publicUrl` على عنوان URL الدقيق من ngrok؛ يتم فرض التحقق من التوقيع دائما.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhooks من Twilio ذات توقيعات غير صالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو local loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن أن تتغير عناوين URL للطبقة المجانية من Ngrok أو تضيف سلوكا بينيا؛ إذا انحرف `publicUrl`، تفشل توقيعات Twilio. للإنتاج: فضّل نطاقا ثابتا أو قمع Tailscale.

  </Accordion>
  <Accordion title="حدود اتصالات البث">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل إطار `start` صالحا أبدا.
    - يحدد `streaming.maxPendingConnections` الحد الأقصى لإجمالي مقابس ما قبل البدء غير المصادقة.
    - يحدد `streaming.maxPendingConnectionsPerIp` الحد الأقصى لمقابس ما قبل البدء غير المصادقة لكل عنوان IP مصدر.
    - يحدد `streaming.maxConnections` الحد الأقصى لإجمالي مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات التكوين القديمة">
    يعاد كتابة التكوينات الأقدم التي تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI
    القديمة ضمن `streaming.*` بواسطة `openclaw doctor --fix`.
    لا يزال بديل وقت التشغيل يقبل مفاتيح voice-call القديمة في الوقت الحالي، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح البث المرحّلة تلقائيا:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## محادثات صوتية فورية

يحدد `realtime` موفر صوت فوري مزدوج الاتجاه الكامل لصوت المكالمة الحية.
وهو منفصل عن `streaming`، الذي يرسل الصوت فقط إلى
موفري التفريغ النصي الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر
وضع صوت واحدا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- يتم دعم `realtime.enabled` لتدفقات Twilio Media Streams.
- `realtime.provider` اختياري. إذا لم يضبط، يستخدم Voice Call أول موفر صوت فوري مسجل.
- موفرو الصوت الفوري المضمنون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويتم تسجيلهما بواسطة Plugins الموفرين الخاصة بهما.
- يوجد التكوين الخام المملوك للموفر ضمن `realtime.providers.<providerId>`.
- يعرض Voice Call أداة `openclaw_agent_consult` الفورية المشتركة افتراضيا. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل استدلالا أعمق، أو معلومات حالية، أو أدوات OpenClaw عادية.
- إذا كان `realtime.provider` يشير إلى موفر غير مسجل، أو لم يكن أي موفر صوت فوري مسجلا إطلاقا، يسجل Voice Call تحذيرا ويتخطى الوسائط الفورية بدلا من إفشال Plugin بأكمله.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة الصوت الحالية عند توفرها، ثم تعود إلى رقم هاتف المتصل/المستلم حتى تحتفظ نداءات الاستشارة اللاحقة بالسياق أثناء المكالمة.

### سياسة الأداة

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | اعرض أداة الاستشارة وقيد الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | اعرض أداة الاستشارة واسمح للوكيل العادي باستخدام سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا تعرض أداة الاستشارة. لا تزال `realtime.tools` المخصصة تمرر إلى الموفر الفوري.                               |

### أمثلة موفري الصوت الفوري

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
الخاصة بكل موفر.

## التفريغ النصي المتدفق

يحدد `streaming` موفر تفريغ نصي فوري لصوت المكالمة الحية.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يضبط، يستخدم Voice Call أول موفر تفريغ نصي فوري مسجل.
- موفرو التفريغ النصي الفوري المضمنون: Deepgram (`deepgram`) وElevenLabs (`elevenlabs`) وMistral (`mistral`) وOpenAI (`openai`) وxAI (`xai`)، ويتم تسجيلهم بواسطة Plugins الموفرين الخاصة بهم.
- يوجد التكوين الخام المملوك للموفر ضمن `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لتدفق مقبول، يسجل Voice Call التدفق فورا، ويضع الوسائط الواردة في قائمة انتظار عبر موفر التفريغ النصي بينما يتصل الموفر، ولا يبدأ التحية الأولية إلا بعد أن يصبح التفريغ النصي الفوري جاهزا.
- إذا كان `streaming.provider` يشير إلى موفر غير مسجل، أو لم يكن أي موفر مسجلا، يسجل Voice Call تحذيرا ويتخطى بث الوسائط بدلا من إفشال Plugin بأكمله.

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
**بالبنية نفسها** — إذ تُدمج دمجا عميقا مع `messages.tts`.

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
**يتم تجاهل كلام Microsoft في المكالمات الصوتية.** يحتاج صوت الاتصالات الهاتفية إلى PCM؛
ولا يكشف نقل Microsoft الحالي خرج PCM الخاص بالاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- يتم إصلاح مفاتيح `tts.<provider>` القديمة داخل إعدادات Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم الإعدادات الملتزم بها `tts.providers.<provider>`.
- يتم استخدام TTS الأساسي عند تفعيل بث وسائط Twilio؛ وإلا تعود المكالمات إلى الأصوات الأصلية للموفر.
- إذا كان بث وسائط Twilio نشطا بالفعل، فلن يعود Voice Call إلى TwiML `<Say>`. إذا لم يكن TTS الهاتفي متاحا في تلك الحالة، يفشل طلب التشغيل بدلا من مزج مساري تشغيل.
- عندما يعود TTS الهاتفي إلى موفر ثانوي، يسجل Voice Call تحذيرا يتضمن سلسلة الموفرين (`from`، `to`، `attempts`) لأغراض التصحيح.
- عندما يؤدي تدخل Twilio أو تفكيك البث إلى مسح قائمة انتظار TTS المعلقة، تتم تسوية طلبات التشغيل الموجودة في قائمة الانتظار بدلا من ترك المتصلين معلقين في انتظار اكتمال التشغيل.

### أمثلة TTS

<Tabs>
  <Tab title="TTS الأساسي فقط">
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
  <Tab title="تجاوز إلى ElevenLabs (للمكالمات فقط)">
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
  <Tab title="تجاوز نموذج OpenAI (دمج عميق)">
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

تكون سياسة الوارد افتراضيا `disabled`. لتفعيل المكالمات الواردة، عيّن:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` هي شاشة تحقق منخفضة الضمان لهوية رقم المتصل. يقوم
Plugin بتطبيع قيمة `From` المقدمة من الموفر ومقارنتها مع
`allowFrom`. تصادق عملية التحقق من Webhook على تسليم الموفر وسلامة
الحمولة، لكنها **لا** تثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` على أنه ترشيح لهوية رقم المتصل، وليس هوية قوية
للمتصل.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`،
و`responseSystemPrompt`، و`responseTimeoutMs`.

### عقد المخرجات المنطوقة

بالنسبة للردود التلقائية، يضيف Voice Call عقد مخرجات منطوقة صارما إلى
موجه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات الموسومة كمحتوى استدلال/خطأ.
- يحلل JSON مباشرا، أو JSON داخل سياج، أو مفاتيح `"spoken"` المضمنة.
- يعود إلى النص العادي ويزيل فقرات البداية المحتملة الخاصة بالتخطيط/البيانات الوصفية.

هذا يبقي التشغيل المنطوق مركزا على النص الموجه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة لمكالمات `conversation` الصادرة، ترتبط معالجة الرسالة الأولى بحالة
التشغيل الحية:

- لا يتم منع مسح قائمة انتظار التدخل والرد التلقائي إلا أثناء نطق التحية الأولية بنشاط.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتظل الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث دون تأخير إضافي.
- يجهض التدخل التشغيل النشط ويمسح مدخلات Twilio TTS الموضوعة في قائمة الانتظار ولكن التي لم يبدأ تشغيلها بعد. تُحل المدخلات الممسوحة على أنها متخطاة، بحيث يمكن لمنطق الرد اللاحق المتابعة دون انتظار صوت لن يتم تشغيله أبدا.
- تستخدم محادثات الصوت الفورية دور الافتتاح الخاص بالبث الفوري. لا ينشر Voice Call تحديث TwiML قديم من نوع `<Say>` لتلك الرسالة الأولية، لذلك تظل جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة فصل بث Twilio

عند فصل بث وسائط Twilio، ينتظر Voice Call **2000 ms** قبل
إنهاء المكالمة تلقائيا:

- إذا أعاد البث الاتصال خلال تلك النافذة، يتم إلغاء الإنهاء التلقائي.
- إذا لم يُعاد تسجيل أي بث بعد فترة السماح، يتم إنهاء المكالمة لمنع بقاء مكالمات نشطة عالقة.

## منظف المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدا
Webhook نهائيا (على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدا). القيمة الافتراضية
هي `0` (معطل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات نمط الإشعار.
- أبق هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات العادية من الانتهاء. نقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

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
  اسمح بقائمة المضيفين من رؤوس التمرير.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  ثق برؤوس التمرير دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  ثق برؤوس التمرير فقط عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

وسائل حماية إضافية:

- يتم تفعيل **حماية إعادة تشغيل** Webhook لـ Twilio وPlivo. يتم الإقرار بطلبات Webhook الصالحة المعاد تشغيلها، لكنها تُتخطى من حيث الآثار الجانبية.
- تتضمن أدوار محادثة Twilio رمزا مميزا لكل دور في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها تلبية دور نسخة نصية معلق أحدث.
- يتم رفض طلبات Webhook غير المصادق عليها قبل قراءة الجسم عندما تكون رؤوس التوقيع المطلوبة من الموفر مفقودة.
- يستخدم Webhook الخاص بـ voice-call ملف تعريف الجسم المشترك قبل المصادقة (64 KB / 5 ثوان) بالإضافة إلى حد للطلبات الجارية لكل IP قبل التحقق من التوقيع.

مثال مع مضيف عام مستقر:

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

عندما يكون Gateway قيد التشغيل بالفعل، تفوض أوامر `voicecall` التشغيلية
إلى وقت تشغيل voice-call المملوك لـ Gateway حتى لا يربط CLI خادم
Webhook ثانيا. إذا لم يمكن الوصول إلى أي Gateway، تعود الأوامر إلى
وقت تشغيل CLI مستقل.

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين voice-call الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لحصر
التحليل في آخر N سجلات (الافتراضي 200). يتضمن الإخراج p50/p90/p99
لزمن كمون الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء          | الوسيطات                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يشحن هذا المستودع مستند Skills مطابقا في `skills/voice-call/SKILL.md`.

## RPC الخاص بـ Gateway

| الطريقة               | الوسيطات                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

يكون `dtmfSequence` صالحا فقط مع `mode: "conversation"`. يجب على مكالمات وضع الإشعار
استخدام `voicecall.dtmf` بعد وجود المكالمة إذا احتاجت إلى أرقام
بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في كشف Webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن يكون `webhook-exposure` أخضر. يفشل
`publicUrl` المكوّن أيضا عندما يشير إلى مساحة شبكة محلية أو خاصة،
لأن شركة الاتصالات لا يمكنها معاودة الاتصال بتلك العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x`،
أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كـ `publicUrl`.

استخدم مسار كشف عاما واحدا:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

بعد تغيير الإعدادات، أعد تشغيل Gateway أو أعد تحميله، ثم شغّل:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` هو تشغيل تجريبي جاف ما لم تمرر `--yes`.

### تفشل بيانات اعتماد المزوّد

تحقّق من المزوّد المحدد وحقول بيانات الاعتماد المطلوبة:

- Twilio: `twilio.accountSid` و`twilio.authToken` و`fromNumber`، أو
  `TWILIO_ACCOUNT_SID` و`TWILIO_AUTH_TOKEN` و`TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey` و`telnyx.connectionId` و`telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId` و`plivo.authToken` و`fromNumber`.

يجب أن تكون بيانات الاعتماد موجودة على مضيف Gateway. لا يؤثر تعديل ملف تعريف
الصدفة المحلي في Gateway قيد التشغيل بالفعل حتى يُعاد تشغيله أو يعيد تحميل
بيئته.

### تبدأ المكالمات لكن Webhooks الخاصة بالمزوّد لا تصل

تأكّد من أن وحدة تحكم المزوّد تشير إلى عنوان URL العام الدقيق للـ Webhook:

```text
https://voice.example.com/voice/webhook
```

ثم افحص حالة وقت التشغيل:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

الأسباب الشائعة:

- يشير `publicUrl` إلى مسار مختلف عن `serve.path`.
- تغيّر عنوان URL للنفق بعد بدء Gateway.
- يمرّر وكيل الطلب لكنه يزيل أو يعيد كتابة ترويسات المضيف/البروتوكول.
- يوجّه جدار الحماية أو DNS اسم المضيف العام إلى مكان غير Gateway.
- أُعيد تشغيل Gateway من دون تفعيل Plugin مكالمات Voice Call.

عندما يكون وكيل عكسي أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود الوكيل تحت
سيطرتك.

### يفشل التحقق من التوقيع

تُفحص توقيعات المزوّد مقابل عنوان URL العام الذي يعيد OpenClaw بناءه من الطلب
الوارد. إذا فشلت التوقيعات:

- تأكّد من أن عنوان URL الخاص بـ Webhook لدى المزوّد يطابق `publicUrl` تمامًا،
  بما في ذلك المخطط والمضيف والمسار.
- بالنسبة إلى عناوين URL المجانية من ngrok، حدّث `publicUrl` عندما يتغيّر اسم
  مضيف النفق.
- تأكّد من أن الوكيل يحافظ على ترويسات المضيف والبروتوكول الأصلية، أو اضبط
  `webhookSecurity.allowedHosts`.
- لا تفعّل `skipSignatureVerification` خارج الاختبار المحلي.

### تفشل انضمامات Google Meet عبر Twilio

يستخدم Google Meet هذا الـ Plugin للانضمام عبر الاتصال الهاتفي من Twilio. تحقّق
أولًا من Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقّق صراحةً من نقل Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كان Voice Call سليمًا لكن مشارك Meet لا ينضم أبدًا، فتحقّق من رقم الاتصال
الهاتفي لاجتماع Meet، ورقم PIN، و`--dtmf-sequence`. قد تكون المكالمة الهاتفية
سليمة بينما يرفض الاجتماع تسلسل DTMF غير الصحيح أو يتجاهله.

يمرّر Google Meet تسلسل DTMF الخاص بـ Meet ونص المقدمة إلى `voicecall.start`.
بالنسبة إلى مكالمات Twilio، يقدّم Voice Call ‏TwiML الخاص بـ DTMF أولًا، ثم يعيد
التوجيه إلى Webhook، ثم يفتح تدفق الوسائط الفوري بحيث تُولَّد المقدمة المحفوظة
بعد انضمام المشارك الهاتفي إلى الاجتماع.

استخدم `openclaw logs --follow` لتتبّع المرحلة الحية. يسجّل انضمام Twilio Meet
السليم هذا الترتيب:

- يفوّض Google Meet انضمام Twilio إلى Voice Call.
- يخزّن Voice Call ‏TwiML الخاص بـ DTMF قبل الاتصال.
- يُستهلك TwiML الأولي من Twilio ويُقدَّم قبل المعالجة الفورية.
- يقدّم Voice Call ‏TwiML الفوري لمكالمة Twilio.
- يبدأ الجسر الفوري مع وضع التحية الأولية في قائمة الانتظار.

ما يزال `openclaw voicecall tail` يعرض سجلات المكالمات المحفوظة؛ وهو مفيد لحالة
المكالمة والنصوص، لكن لا تظهر فيه كل انتقالات Webhook/الفورية.

### لا توجد أي محادثة في المكالمة الفورية

تأكّد من تفعيل وضع صوت واحد فقط. لا يمكن أن يكون كل من `realtime.enabled` و
`streaming.enabled` صحيحين في الوقت نفسه.

بالنسبة إلى مكالمات Twilio الفورية، تحقّق أيضًا مما يلي:

- تم تحميل Plugin لمزوّد فوري وتسجيله.
- `realtime.provider` غير مضبوط أو يسمّي مزوّدًا مسجّلًا.
- مفتاح API الخاص بالمزوّد متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML الفوري، وبدء الجسر الفوري، ووضع
  التحية الأولية في قائمة الانتظار.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [الإيقاظ الصوتي](/ar/nodes/voicewake)
