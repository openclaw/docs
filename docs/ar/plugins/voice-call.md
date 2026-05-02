---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تهيئ Plugin المكالمات الصوتية أو تطوره
    - تحتاج إلى صوت في الوقت الفعلي أو تفريغ صوتي متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: إجراء مكالمات صوتية صادرة وقبول مكالمات صوتية واردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الفعلي والنسخ النصي المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-05-02T07:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: cde64fa054743d4ed3f146042bd65532af0e9eb5b792b088a856889b3d2cb3c9
    source_path: plugins/voice-call.md
    workflow: 16
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الجولات، والصوت الفوري ثنائي الاتجاه بالكامل، ونسخ الصوت المتدفق،
والمكالمات الواردة بسياسات قائمة السماح.

**المزوّدون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (تطوير/بلا شبكة).

<Note>
يعمل Voice Call Plugin **داخل عملية Gateway**. إذا كنت تستخدم Gateway
بعيدًا، فثبّت Plugin واضبطه على الجهاز الذي يشغّل
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
    ينتمي إلى مسار حزم خارجي أقدم؛ استخدم بنية OpenClaw
    الحالية المعبأة أو مسار المجلد المحلي إلى أن تُنشر حزمة npm أحدث.

    أعد تشغيل Gateway بعد ذلك لكي يتم تحميل Plugin.

  </Step>
  <Step title="اضبط المزوّد وWebhook">
    عيّن الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [الإعدادات](#configuration) أدناه للاطلاع على البنية الكاملة). كحد أدنى:
    `provider`، وبيانات اعتماد المزوّد، و`fromNumber`، وعنوان URL لـ Webhook يمكن الوصول إليه
    علنًا.
  </Step>
  <Step title="تحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    ```

    يكون الخرج الافتراضي مقروءًا في سجلات الدردشة والطرفيات. يتحقق من
    تفعيل Plugin، وبيانات اعتماد المزوّد، وإتاحة Webhook، وأن
    وضعًا صوتيًا واحدًا فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للسكربتات.

  </Step>
  <Step title="اختبار سريع">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيل جاف افتراضيًا. أضف `--yes` لإجراء مكالمة إشعار صادرة قصيرة
    فعليًا:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن ينتهي الإعداد إلى **عنوان URL عام لـ Webhook**.
إذا انتهى `publicUrl`، أو عنوان URL للنفق، أو عنوان URL لـ Tailscale، أو بديل الخدمة
إلى loopback أو مساحة شبكة خاصة، فسيفشل الإعداد بدلًا من
تشغيل مزوّد لا يمكنه استقبال Webhooks من شركة الاتصالات.
</Warning>

## الإعدادات

إذا كان `enabled: true` لكن المزوّد المحدد يفتقد بيانات الاعتماد،
تسجّل عملية بدء Gateway تحذيرًا بأن الإعداد غير مكتمل مع المفاتيح الناقصة، وتتجاوز
بدء وقت التشغيل. تظل الأوامر واستدعاءات RPC وأدوات الوكيل
تعيد إعدادات المزوّد الناقصة نفسها عند استخدامها.

<Note>
تقبل بيانات اعتماد voice-call مراجع SecretRefs. يتم حل `plugins.entries.voice-call.config.twilio.authToken` و`plugins.entries.voice-call.config.realtime.providers.*.apiKey` و`plugins.entries.voice-call.config.streaming.providers.*.apiKey` و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر واجهة SecretRef القياسية؛ راجع [واجهة بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
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
  <Accordion title="ملاحظات إتاحة المزوّد والأمان">
    - تتطلب Twilio وTelnyx وPlivo جميعها عنوان URL لـ Webhook **يمكن الوصول إليه علنًا**.
    - `mock` هو مزوّد تطوير محلي (لا توجد استدعاءات شبكة).
    - يتطلب Telnyx `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` مضبوطة على true.
    - `skipSignatureVerification` للاختبار المحلي فقط.
    - في الطبقة المجانية من ngrok، اضبط `publicUrl` على عنوان URL الدقيق لـ ngrok؛ يُفرض التحقق من التوقيع دائمًا.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhooks من Twilio ذات التواقيع غير الصالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن أن تتغير عناوين URL في الطبقة المجانية من Ngrok أو تضيف سلوكًا بينيًا؛ إذا انحرف `publicUrl`، تفشل تواقيع Twilio. في الإنتاج: فضّل نطاقًا مستقرًا أو Tailscale funnel.

  </Accordion>
  <Accordion title="حدود اتصالات التدفق">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل إطار `start` صالحًا أبدًا.
    - يحد `streaming.maxPendingConnections` إجمالي المقابس غير المصادق عليها قبل البدء.
    - يحد `streaming.maxPendingConnectionsPerIp` المقابس غير المصادق عليها قبل البدء لكل عنوان IP مصدر.
    - يحد `streaming.maxConnections` إجمالي مقابس بث الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات الإعدادات القديمة">
    يعاد كتابة الإعدادات الأقدم التي تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI
    القديمة ضمن `streaming.*` بواسطة `openclaw doctor --fix`.
    لا يزال بديل وقت التشغيل يقبل مفاتيح voice-call القديمة حاليًا، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح التدفق المرحّلة تلقائيًا:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## محادثات صوتية فورية

يحدد `realtime` مزوّد صوت فوري ثنائي الاتجاه بالكامل لصوت المكالمة المباشر.
وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
مزوّدي النسخ الفوري.

<Warning>
لا يمكن الجمع بين `realtime.enabled` و`streaming.enabled`. اختر وضعًا
صوتيًا واحدًا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لـ Twilio Media Streams.
- `realtime.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول مزوّد صوت فوري مسجل.
- مزوّدو الصوت الفوري المضمنون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويتم تسجيلهم بواسطة Plugins الخاصة بالمزوّدين.
- توجد إعدادات المزوّد الخام المملوكة للمزوّد تحت `realtime.providers.<providerId>`.
- يعرّض Voice Call أداة `openclaw_agent_consult` الفورية المشتركة افتراضيًا. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل تفكيرًا أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- يكون `realtime.fastContext.enabled` معطلًا افتراضيًا. عند تفعيله، يبحث Voice Call أولًا في الذاكرة المفهرسة/سياق الجلسة عن سؤال الاستشارة ويعيد تلك المقتطفات إلى النموذج الفوري ضمن `realtime.fastContext.timeoutMs` قبل الرجوع إلى وكيل الاستشارة الكامل فقط إذا كان `realtime.fastContext.fallbackToConsult` مضبوطًا على true.
- إذا أشار `realtime.provider` إلى مزوّد غير مسجل، أو لم يكن أي مزوّد صوت فوري مسجلًا إطلاقًا، يسجل Voice Call تحذيرًا ويتجاوز وسائط الصوت الفورية بدلًا من إفشال Plugin بالكامل.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة الصوت الحالية عند توفرها، ثم ترجع إلى رقم هاتف المتصل/المستقبل لكي تحتفظ استدعاءات الاستشارة اللاحقة بالسياق أثناء المكالمة.

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | يعرّض أداة الاستشارة ويقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | يعرّض أداة الاستشارة ويسمح للوكيل العادي باستخدام سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا يعرّض أداة الاستشارة. لا تزال `realtime.tools` المخصصة تُمرر إلى المزوّد الفوري.                               |

### أمثلة مزوّدي الوقت الفوري

<Tabs>
  <Tab title="Google Gemini Live">
    القيم الافتراضية: مفتاح API من `realtime.providers.google.apiKey`،
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

راجع [مزوّد Google](/ar/providers/google) و
[مزوّد OpenAI](/ar/providers/openai) للاطلاع على خيارات الصوت الفوري
الخاصة بالمزوّد.

## النسخ المتدفق

يحدد `streaming` مزوّد نسخ فوري لصوت المكالمة المباشر.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول مزود نسخ فوري مسجل.
- مزودو النسخ الفوري المضمنون: Deepgram (`deepgram`) وElevenLabs (`elevenlabs`) وMistral (`mistral`) وOpenAI (`openai`) وxAI (`xai`)، وتسجلهم Plugins المزودة الخاصة بهم.
- يوجد التكوين الخام المملوك للمزود تحت `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لبث مقبول، يسجل Voice Call البث فورا، ويضع الوسائط الواردة في قائمة انتظار عبر مزود النسخ أثناء اتصال المزود، ويبدأ التحية الأولية فقط بعد أن يصبح النسخ الفوري جاهزا.
- إذا كان `streaming.provider` يشير إلى مزود غير مسجل، أو لم يكن أي مزود مسجلا، يسجل Voice Call تحذيرا ويتخطى بث الوسائط بدلا من إفشال Plugin بالكامل.

### أمثلة مزود البث

<Tabs>
  <Tab title="OpenAI">
    القيم الافتراضية: مفتاح API `streaming.providers.openai.apiKey` أو
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
    القيم الافتراضية: مفتاح API `streaming.providers.xai.apiKey` أو `XAI_API_KEY`؛
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

يستخدم Voice Call تكوين `messages.tts` الأساسي لبث الكلام في المكالمات.
يمكنك تجاوزه ضمن تكوين Plugin باستخدام **البنية نفسها** — إذ يدمج بعمق مع `messages.tts`.

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
**يُتجاهل Microsoft speech في المكالمات الصوتية.** يحتاج صوت الاتصالات الهاتفية إلى PCM؛
ولا يكشف نقل Microsoft الحالي إخراج PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- تُصلح مفاتيح `tts.<provider>` القديمة داخل تكوين Plugin (`openai` و`elevenlabs` و`microsoft` و`edge`) عبر `openclaw doctor --fix`؛ يجب أن يستخدم التكوين المودع `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تمكين بث وسائط Twilio؛ وإلا تعود المكالمات إلى أصوات المزود الأصلية.
- إذا كان بث وسائط Twilio نشطا بالفعل، فلا يعود Voice Call إلى TwiML `<Say>`. إذا لم يكن TTS للاتصالات الهاتفية متاحا في تلك الحالة، يفشل طلب التشغيل بدلا من مزج مساري تشغيل.
- عندما يعود TTS للاتصالات الهاتفية إلى مزود ثانوي، يسجل Voice Call تحذيرا مع سلسلة المزودين (`from` و`to` و`attempts`) لتسهيل التصحيح.
- عندما يمسح تدخل Twilio أو تفكيك البث قائمة انتظار TTS المعلقة، تُحسم طلبات التشغيل الموضوعة في قائمة الانتظار بدلا من تعليق المتصلين في انتظار اكتمال التشغيل.

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

تكون سياسة الوارد افتراضيا `disabled`. لتمكين المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` هي شاشة معرف متصل منخفضة الضمان. يطبع
Plugin قيمة `From` المقدمة من المزود ويقارنها مع
`allowFrom`. يتحقق Webhook من تسليم المزود
وسلامة الحمولة، لكنه **لا** يثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كتصفية لمعرف المتصل، لا كهوية متصل قوية.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`
و`responseSystemPrompt` و`responseTimeoutMs`.

### عقد الإخراج المنطوق

بالنسبة إلى الردود التلقائية، يضيف Voice Call عقد إخراج منطوقا صارما إلى
موجه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات الموسومة كمحتوى استدلال/خطأ.
- يحلل JSON المباشر، أو JSON داخل سياج، أو مفاتيح `"spoken"` المضمنة.
- يعود إلى النص العادي ويزيل فقرات المقدمة المحتملة للتخطيط/البيانات الوصفية.

يحافظ ذلك على تركيز التشغيل المنطوق على النص الموجه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، ترتبط معالجة الرسالة الأولى
بحالة التشغيل الحية:

- لا يُكبت مسح قائمة انتظار التدخل والرد التلقائي إلا أثناء نطق التحية الأولية فعليا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث دون تأخير إضافي.
- يجهض التدخل التشغيل النشط ويمسح إدخالات Twilio TTS الموضوعة في قائمة الانتظار والتي لم يبدأ تشغيلها بعد. تُحسم الإدخالات الممسوحة كمتخطاة، لذلك يمكن أن يستمر منطق الرد اللاحق دون انتظار صوت لن يُشغل أبدا.
- تستخدم المحادثات الصوتية الفورية دورة الافتتاح الخاصة بالبث الفوري. لا ينشر Voice Call تحديث TwiML قديم عبر `<Say>` لتلك الرسالة الأولية، لذلك تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة فصل بث Twilio

عندما ينفصل بث وسائط Twilio، ينتظر Voice Call **2000 ms** قبل
إنهاء المكالمة تلقائيا:

- إذا أعاد البث الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُعاد تسجيل أي بث بعد فترة المهلة، تُنهى المكالمة لمنع بقاء المكالمات النشطة عالقة.

## حاصد المكالمات القديمة

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

عندما يكون وكيل أو نفق أمام Gateway، يعيد Plugin
بناء عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات
في ترويسات إعادة التوجيه الموثوقة:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  قائمة سماح بالمضيفين من ترويسات إعادة التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  الوثوق بترويسات إعادة التوجيه دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  الوثوق بترويسات إعادة التوجيه فقط عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- تُفعّل **حماية إعادة تشغيل Webhook** لكل من Twilio وPlivo. تُقر طلبات Webhook الصالحة المعاد تشغيلها، لكنها تُتخطى فيما يخص الآثار الجانبية.
- تتضمن أدوار محادثة Twilio رمزا لكل دور في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها تلبية دور نسخة معلق أحدث.
- تُرفض طلبات Webhook غير المصادقة قبل قراءة الجسم عندما تكون ترويسات التوقيع المطلوبة للمزود مفقودة.
- يستخدم Webhook الخاص بـ voice-call ملف جسم ما قبل المصادقة المشترك (64 KB / 5 ثوان) إضافة إلى حد أقصى للطلبات الجارية لكل IP قبل التحقق من التوقيع.

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
Webhook ثانيا. إذا لم يكن أي Gateway قابلا للوصول، تعود الأوامر إلى
وقت تشغيل CLI مستقل.

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين voice-call الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` للحد من
التحليل إلى آخر N سجلات (الافتراضي 200). يتضمن الإخراج p50/p90/p99
لزمن انتقال الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء          | الوسائط                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يشحن هذا المستودع مستند Skill مطابقا في `skills/voice-call/SKILL.md`.

## RPC في Gateway

| الطريقة               | الوسائط                                       |
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

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن تكون `webhook-exposure` خضراء. يفشل
`publicUrl` المكوّن حتى إذا كان يشير إلى مساحة شبكة محلية أو خاصة، لأن شركة الاتصالات
لا تستطيع إعادة الاتصال بتلك العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو
`192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كقيمة `publicUrl`.

ترسل مكالمات Twilio الصادرة في وضع notify-mode محتوى `<Say>` الأولي من TwiML مباشرة في
طلب إنشاء المكالمة، لذلك لا تعتمد أول رسالة منطوقة على جلب Twilio لمحتوى TwiML الخاص بالـ Webhook. يظل Webhook عام مطلوبًا لاستدعاءات الحالة،
ومكالمات المحادثة، وDTMF قبل الاتصال، والتدفقات في الوقت الفعلي، والتحكم في المكالمة
بعد الاتصال.

استخدم مسار إتاحة عام واحدًا:

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

`voicecall smoke` تشغيل تجريبي جاف ما لم تمرر `--yes`.

### فشل بيانات اعتماد المزوّد

تحقق من المزوّد المحدد وحقول بيانات الاعتماد المطلوبة:

- Twilio: `twilio.accountSid` و`twilio.authToken` و`fromNumber`، أو
  `TWILIO_ACCOUNT_SID` و`TWILIO_AUTH_TOKEN` و`TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey` و`telnyx.connectionId` و`telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId` و`plivo.authToken` و`fromNumber`.

يجب أن تكون بيانات الاعتماد موجودة على مضيف Gateway. لا يؤثر تعديل ملف تعريف shell محلي
في Gateway قيد التشغيل بالفعل حتى يُعاد تشغيله أو يعيد تحميل
بيئته.

### تبدأ المكالمات لكن Webhooks المزوّد لا تصل

تأكد من أن وحدة تحكم المزوّد تشير إلى عنوان URL العام الدقيق للـ Webhook:

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
- يمرر وكيل الطلب لكنه يزيل رؤوس host/proto أو يعيد كتابتها.
- يوجّه جدار حماية أو DNS اسم المضيف العام إلى مكان آخر غير Gateway.
- أُعيد تشغيل Gateway من دون تفعيل Voice Call Plugin.

عندما يكون وكيل عكسي أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود الوكيل تحت
سيطرتك.

### فشل التحقق من التوقيع

تُفحص توقيعات المزوّد مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التوقيعات:

- تأكد من أن عنوان URL الخاص بـ Webhook لدى المزوّد يطابق `publicUrl` تمامًا، بما في ذلك
  المخطط، والمضيف، والمسار.
- لعناوين URL في الطبقة المجانية من ngrok، حدّث `publicUrl` عندما يتغير اسم مضيف النفق.
- تأكد من أن الوكيل يحافظ على رؤوس المضيف والبروتوكول الأصلية، أو اضبط
  `webhookSecurity.allowedHosts`.
- لا تفعّل `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمام Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin لعمليات الانضمام عبر اتصال Twilio الهاتفي. تحقق أولًا من Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق من نقل Google Meet صراحة:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كانت Voice Call خضراء لكن مشارك Meet لا ينضم أبدًا، فتحقق من رقم الاتصال الهاتفي
لـ Meet، ورقم PIN، و`--dtmf-sequence`. قد تكون المكالمة الهاتفية سليمة بينما
يرفض الاجتماع تسلسل DTMF غير صحيح أو يتجاهله.

يمرر Google Meet تسلسل DTMF الخاص بـ Meet ونص المقدمة إلى `voicecall.start`.
بالنسبة إلى مكالمات Twilio، تقدم Voice Call محتوى DTMF TwiML أولًا، ثم تعيد التوجيه إلى
Webhook، ثم تفتح تدفق الوسائط في الوقت الفعلي بحيث تُولَّد المقدمة المحفوظة
بعد انضمام المشارك الهاتفي إلى الاجتماع.

استخدم `openclaw logs --follow` لتتبع المرحلة المباشرة. يسجل انضمام Twilio Meet
السليم هذا الترتيب:

- يفوّض Google Meet انضمام Twilio إلى Voice Call.
- تخزن Voice Call محتوى DTMF TwiML قبل الاتصال.
- يُستهلك محتوى TwiML الأولي من Twilio ويُقدّم قبل معالجة الوقت الفعلي.
- تقدم Voice Call محتوى TwiML في الوقت الفعلي لمكالمة Twilio.
- يبدأ الجسر في الوقت الفعلي مع وضع التحية الأولية في قائمة الانتظار.

لا يزال `openclaw voicecall tail` يعرض سجلات المكالمات المستمرة؛ وهو مفيد
لحالة المكالمة والنصوص، لكن لا يظهر فيه كل انتقال Webhook أو انتقال في الوقت الفعلي.

### المكالمة في الوقت الفعلي بلا كلام

تأكد من تفعيل وضع صوت واحد فقط. لا يمكن أن يكون كل من `realtime.enabled` و
`streaming.enabled` بالقيمة true في الوقت نفسه.

بالنسبة إلى مكالمات Twilio في الوقت الفعلي، تحقق أيضًا من:

- تم تحميل Plugin لمزوّد الوقت الفعلي وتسجيله.
- `realtime.provider` غير مضبوط أو يذكر مزوّدًا مسجلًا.
- مفتاح API الخاص بالمزوّد متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML في الوقت الفعلي، وبدء الجسر في الوقت الفعلي،
  ووضع التحية الأولية في قائمة الانتظار.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [تنبيه صوتي](/ar/nodes/voicewake)
