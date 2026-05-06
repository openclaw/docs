---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بتهيئة أو تطوير Plugin المكالمات الصوتية
    - تحتاج إلى صوت في الوقت الفعلي أو نسخ متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: إجراء مكالمات صوتية صادرة وقبول مكالمات صوتية واردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الفعلي والنسخ النصي المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-05-06T09:02:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الجولات، والصوت الفوري ثنائي الاتجاه بالكامل، والتفريغ النصي
المتدفق، والمكالمات الواردة مع سياسات قوائم السماح.

**المزوّدون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + نقل XML + كلام GetInput)،
`mock` (تطوير/بلا شبكة).

<Note>
يعمل Plugin المكالمات الصوتية **داخل عملية Gateway**. إذا كنت تستخدم
Gateway بعيدة، فثبّت Plugin واضبطه على الجهاز الذي يشغّل
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

    استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت
    إصدارًا محددًا بدقة فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

    أعد تشغيل Gateway بعد ذلك حتى يتم تحميل Plugin.

  </Step>
  <Step title="Configure provider and webhook">
    اضبط الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [الإعداد](#configuration) أدناه للشكل الكامل). الحد الأدنى:
    `provider`، واعتمادات المزوّد، و`fromNumber`، وWebhook URL يمكن الوصول إليه
    علنًا.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    المخرج الافتراضي قابل للقراءة في سجلات الدردشة والطرفيات. يتحقق من
    تفعيل Plugin، واعتمادات المزوّد، وتعرّض Webhook، ومن أن
    وضع صوت واحد فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للسكربتات.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيلان تجريبيان افتراضيًا. أضف `--yes` لإجراء مكالمة إشعار
    صادرة قصيرة فعليًا:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن يفضي الإعداد إلى **Webhook URL عام**.
إذا تم حل `publicUrl`، أو عنوان URL للنفق، أو عنوان URL لـ Tailscale، أو بديل الخدمة
إلى local loopback أو مساحة شبكة خاصة، فسيفشل الإعداد بدلًا من
بدء مزوّد لا يمكنه استقبال Webhookات شركات الاتصالات.
</Warning>

## الإعداد

إذا كان `enabled: true` لكن المزوّد المحدد يفتقد الاعتمادات،
فسيسجل بدء تشغيل Gateway تحذيرًا بأن الإعداد غير مكتمل مع المفاتيح الناقصة
ويتجاوز بدء وقت التشغيل. لا تزال الأوامر، واستدعاءات RPC، وأدوات الوكيل
تعيد إعداد المزوّد الناقص بدقة عند استخدامها.

<Note>
تقبل اعتمادات المكالمات الصوتية SecretRefs. يتم حل `plugins.entries.voice-call.config.twilio.authToken` و`plugins.entries.voice-call.config.realtime.providers.*.apiKey` و`plugins.entries.voice-call.config.streaming.providers.*.apiKey` و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر سطح SecretRef القياسي؛ راجع [سطح اعتماد SecretRef](/ar/reference/secretref-credential-surface).
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
    - تتطلب Twilio وTelnyx وPlivo جميعًا Webhook URL **يمكن الوصول إليه علنًا**.
    - `mock` هو مزوّد تطوير محلي (لا توجد استدعاءات شبكة).
    - يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` بالقيمة true.
    - `skipSignatureVerification` مخصص للاختبار المحلي فقط.
    - في الطبقة المجانية من ngrok، اضبط `publicUrl` على عنوان URL الدقيق لـ ngrok؛ يتم فرض التحقق من التوقيع دائمًا.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhookات Twilio ذات التوقيعات غير الصالحة **فقط** عندما تكون `tunnel.provider="ngrok"` و`serve.bind` هي local loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن لعناوين URL في الطبقة المجانية من Ngrok أن تتغير أو تضيف سلوك صفحة وسيطة؛ إذا انحرف `publicUrl`، تفشل توقيعات Twilio. في الإنتاج: فضّل نطاقًا مستقرًا أو نفق Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل أبدًا إطار `start` صالحًا.
    - يحد `streaming.maxPendingConnections` إجمالي مقابس ما قبل البدء غير المصادق عليها.
    - يحد `streaming.maxPendingConnectionsPerIp` مقابس ما قبل البدء غير المصادق عليها لكل عنوان IP مصدر.
    - يحد `streaming.maxConnections` إجمالي مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="Legacy config migrations">
    تتم إعادة كتابة الإعدادات الأقدم التي تستخدم `provider: "log"`، أو `twilio.from`، أو مفاتيح OpenAI
    القديمة في `streaming.*` بواسطة `openclaw doctor --fix`.
    لا يزال بديل وقت التشغيل يقبل مفاتيح المكالمات الصوتية القديمة حاليًا، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح التدفق التي يتم ترحيلها تلقائيًا:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## نطاق الجلسة

افتراضيًا، تستخدم المكالمات الصوتية `sessionScope: "per-phone"` بحيث تحتفظ
المكالمات المتكررة من المتصل نفسه بذاكرة المحادثة. اضبط `sessionScope: "per-call"` عندما
ينبغي أن تبدأ كل مكالمة من شركة الاتصالات بسياق جديد، مثل الاستقبال،
أو الحجز، أو IVR، أو تدفقات جسر Google Meet حيث قد
يمثل رقم الهاتف نفسه اجتماعات مختلفة.

## محادثات الصوت الفورية

يختار `realtime` مزوّد صوت فوري ثنائي الاتجاه بالكامل لصوت المكالمة
المباشر. وهو منفصل عن `streaming`، الذي يوجّه الصوت فقط إلى
مزوّدي التفريغ النصي الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر وضعًا صوتيًا
واحدًا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- يتم دعم `realtime.enabled` لتدفقات وسائط Twilio.
- `realtime.provider` اختياري. إذا لم يتم ضبطه، تستخدم المكالمات الصوتية أول مزوّد صوت فوري مسجل.
- مزوّدو الصوت الفوري المضمنون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويتم تسجيلهم بواسطة Plugins المزوّدين الخاصة بهم.
- يوجد الإعداد الخام المملوك للمزوّد ضمن `realtime.providers.<providerId>`.
- تعرض المكالمات الصوتية أداة `openclaw_agent_consult` الفورية المشتركة افتراضيًا. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل استدلالًا أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- يضيف `realtime.consultPolicy` اختياريًا إرشادات حول متى ينبغي للنموذج الفوري استدعاء `openclaw_agent_consult`.
- يكون `realtime.agentContext.enabled` معطلًا افتراضيًا. عند تفعيله، تحقن المكالمات الصوتية هوية وكيل محدودة، وتجاوز مطالبة النظام، وكبسولة ملف مساحة عمل محددة في تعليمات المزوّد الفوري عند إعداد الجلسة.
- يكون `realtime.fastContext.enabled` معطلًا افتراضيًا. عند تفعيله، تبحث المكالمات الصوتية أولًا في الذاكرة المفهرسة/سياق الجلسة عن سؤال الاستشارة وتعيد تلك المقاطع إلى النموذج الفوري ضمن `realtime.fastContext.timeoutMs` قبل الرجوع إلى وكيل الاستشارة الكامل فقط إذا كانت `realtime.fastContext.fallbackToConsult` بالقيمة true.
- إذا أشار `realtime.provider` إلى مزوّد غير مسجل، أو لم يكن أي مزوّد صوت فوري مسجلًا على الإطلاق، فسيسجل Plugin المكالمات الصوتية تحذيرًا ويتجاوز الوسائط الفورية بدلًا من إفشال Plugin بالكامل.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة المكالمة المخزنة عند توفرها، ثم ترجع إلى `sessionScope` المضبوط (`per-phone` افتراضيًا، أو `per-call` للمكالمات المعزولة).

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة          | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | يعرّض أداة الاستشارة ويقيّد الوكيل العادي إلى `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | يعرّض أداة الاستشارة ويسمح للوكيل العادي باستخدام سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا يعرّض أداة الاستشارة. لا تزال `realtime.tools` المخصصة تمرر إلى المزوّد الفوري.                               |

يتحكم `realtime.consultPolicy` فقط في تعليمات النموذج الفوري:

| السياسة       | الإرشادات                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | احتفظ بالمطالبة الافتراضية واترك للمزوّد تقرير متى يستدعي أداة الاستشارة.              |
| `substantive` | أجب مباشرة عن الربط الحواري البسيط واستشر قبل الحقائق أو الذاكرة أو الأدوات أو السياق. |
| `always`      | استشر قبل كل إجابة جوهرية.                                                        |

### سياق صوت الوكيل

فعّل `realtime.agentContext` عندما ينبغي لجسر الصوت أن يبدو مثل وكيل
OpenClaw المضبوط من دون دفع تكلفة رحلة ذهاب وإياب كاملة لاستشارة الوكيل في
الجولات العادية. تتم إضافة كبسولة السياق مرة واحدة عند إنشاء الجلسة الفورية،
لذلك لا تضيف زمن تأخير لكل جولة. لا تزال استدعاءات
`openclaw_agent_consult` تشغّل وكيل OpenClaw الكامل ويجب استخدامها
لعمل الأدوات، أو المعلومات الحالية، أو عمليات البحث في الذاكرة، أو حالة مساحة العمل.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### أمثلة موفّري الوقت الحقيقي

<Tabs>
  <Tab title="Google Gemini Live">
    القيم الافتراضية: مفتاح API من `realtime.providers.google.apiKey` أو
    `GEMINI_API_KEY` أو `GOOGLE_GENERATIVE_AI_API_KEY`؛ النموذج
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ الصوت `Kore`.
    يكون `sessionResumption` و`contextWindowCompression` مفعّلين افتراضيًا للمكالمات الأطول
    والقابلة لإعادة الاتصال. استخدم `silenceDurationMs` و`startSensitivity` و
    `endSensitivity` لضبط تبادل الأدوار بسرعة أكبر على صوت الاتصالات الهاتفية.

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
                consultPolicy: "substantive",
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

راجع [موفّر Google](/ar/providers/google) و
[موفّر OpenAI](/ar/providers/openai) للاطلاع على خيارات الصوت في الوقت الحقيقي
الخاصة بكل موفّر.

## النسخ المتدفّق

يحدد `streaming` موفّر نسخ في الوقت الحقيقي لصوت المكالمات المباشرة.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُعيّن، يستخدم Voice Call أول موفّر نسخ في الوقت الحقيقي مسجّل.
- موفّرو النسخ في الوقت الحقيقي المضمّنون: Deepgram (`deepgram`) وElevenLabs (`elevenlabs`) وMistral (`mistral`) وOpenAI (`openai`) وxAI (`xai`)، وتُسجّلها Plugins الموفّرين الخاصة بها.
- يوجد إعداد الموفّر الخام المملوك للموفّر تحت `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لبث مقبول، يسجّل Voice Call البث فورًا، ويضع الوسائط الواردة في قائمة انتظار عبر موفّر النسخ أثناء اتصال الموفّر، ولا يبدأ التحية الأولية إلا بعد أن يصبح النسخ في الوقت الحقيقي جاهزًا.
- إذا أشار `streaming.provider` إلى موفّر غير مسجّل، أو لم يكن أي موفّر مسجّلًا، يسجّل Voice Call تحذيرًا ويتخطى بث الوسائط بدلًا من إفشال Plugin بالكامل.

### أمثلة موفّري البث

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

يستخدم Voice Call إعداد `messages.tts` الأساسي لبث
الكلام في المكالمات. يمكنك تجاوزه ضمن إعداد Plugin
**بنفس الشكل** — إذ يُدمج بعمق مع `messages.tts`.

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
**يُتجاهل كلام Microsoft في مكالمات الصوت.** يحتاج صوت الاتصالات الهاتفية إلى PCM؛
ولا يوفّر نقل Microsoft الحالي مخرج PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- تُصلح `openclaw doctor --fix` مفاتيح `tts.<provider>` القديمة داخل إعداد Plugin (`openai` و`elevenlabs` و`microsoft` و`edge`)؛ يجب أن يستخدم الإعداد الملتزم به `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تفعيل بث وسائط Twilio؛ وإلا تعود المكالمات إلى أصوات الموفّر الأصلية.
- إذا كان بث وسائط Twilio نشطًا بالفعل، لا يعود Voice Call إلى TwiML `<Say>`. إذا كان TTS الهاتفي غير متاح في تلك الحالة، يفشل طلب التشغيل بدلًا من خلط مساري تشغيل.
- عندما يعود TTS الهاتفي إلى موفّر ثانوي، يسجّل Voice Call تحذيرًا يتضمن سلسلة الموفّرين (`from` و`to` و`attempts`) للتصحيح.
- عندما يمسح الاقتحام الصوتي في Twilio أو تفكيك البث قائمة انتظار TTS المعلّقة، تُسوّى طلبات التشغيل المنتظرة بدلًا من إبقاء المتصلين عالقين في انتظار اكتمال التشغيل.

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

تكون سياسة الوارد افتراضيًا `disabled`. لتفعيل المكالمات الواردة، عيّن:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` هو فحص منخفض الضمان لمعرّف المتصل. يقوم
Plugin بتطبيع قيمة `From` التي يوفّرها الموفّر ومقارنتها مع
`allowFrom`. يتحقق Webhook من أصالة تسليم الموفّر
وسلامة الحمولة، لكنه **لا** يثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كترشيح لمعرّف المتصل، وليس كهوية قوية للمتصل.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel` و
`responseSystemPrompt` و`responseTimeoutMs`.

### التوجيه حسب الرقم

استخدم `numbers` عندما يتلقى Plugin واحد من Voice Call مكالمات لعدة أرقام هاتفية
ويجب أن يتصرف كل رقم كخط مختلف. على سبيل المثال، يمكن لرقم واحد
استخدام مساعد شخصي عفوي بينما يستخدم رقم آخر شخصية عمل
ووكيل رد مختلفًا وصوت TTS مختلفًا.

تُختار المسارات من رقم `To` المطلوب الذي يوفّره الموفّر. يجب أن تكون المفاتيح
أرقام E.164. عند وصول مكالمة، يحل Voice Call المسار المطابق مرة واحدة،
ويخزن المسار المطابق في سجل المكالمة، ويعيد استخدام ذلك الإعداد الفعّال
للتحية، ومسار الرد التلقائي الكلاسيكي، ومسار الاستشارة في الوقت الحقيقي، وتشغيل TTS.
إذا لم يطابق أي مسار، يُستخدم إعداد Voice Call العام.
لا تستخدم المكالمات الصادرة `numbers`؛ مرّر الهدف الصادر والرسالة
والجلسة صراحةً عند بدء المكالمة.

تدعم تجاوزات المسارات حاليًا:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تُدمج قيمة مسار `tts` بعمق فوق إعداد `tts` العام في Voice Call، لذا
يمكنك عادةً تجاوز صوت الموفّر فقط:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### عقد المخرجات المنطوقة

بالنسبة إلى الردود التلقائية، يضيف Voice Call عقد مخرجات منطوقة صارمًا إلى
موجه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات الموسومة كمحتوى استدلال/خطأ.
- يحلل JSON مباشرًا، أو JSON داخل سياج، أو مفاتيح `"spoken"` ضمنية.
- يعود إلى النص العادي ويزيل فقرات المقدمة المحتملة للتخطيط/البيانات الوصفية.

هذا يبقي تشغيل الكلام مركّزًا على النص الموجّه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، ترتبط معالجة الرسالة الأولى بحالة
التشغيل المباشر:

- يُمنع مسح قائمة انتظار الاقتحام الصوتي والرد التلقائي فقط أثناء نطق التحية الأولية بنشاط.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث من دون تأخير إضافي.
- يوقف الاقتحام الصوتي التشغيل النشط ويمسح إدخالات Twilio TTS الموضوعة في قائمة الانتظار والتي لم يبدأ تشغيلها بعد. تُحل الإدخالات الممسوحة كمتخطاة، بحيث يمكن لمنطق الرد اللاحق أن يستمر من دون انتظار صوت لن يُشغّل أبدًا.
- تستخدم محادثات الصوت في الوقت الحقيقي الدور الافتتاحي الخاص ببث الوقت الحقيقي. لا ينشر Voice Call تحديث TwiML قديمًا من نوع `<Say>` لتلك الرسالة الأولية، لذلك تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة فصل بث Twilio

عند انقطاع بث وسائط Twilio، ينتظر Voice Call **2000 ms** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعاد البث الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجّل أي بث من جديد بعد فترة المهلة، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## حاصد المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدًا Webhook
نهائيًا (على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية
هي `0` (معطّل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات نمط الإشعار.
- اجعل هذه القيمة **أعلى من `maxDurationSeconds`** حتى تكتمل الاستدعاءات العادية. نقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

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

عندما يكون proxy أو tunnel أمام Gateway، يعيد Plugin
بناء عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات
في رؤوس إعادة التوجيه الموثوقة:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  قائمة سماح للمضيفين من رؤوس إعادة التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  الوثوق برؤوس إعادة التوجيه من دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  لا تثق برؤوس إعادة التوجيه إلا عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- يتم تفعيل **الحماية من إعادة تشغيل Webhook** لـ Twilio وPlivo. يتم الإقرار بطلبات Webhook الصالحة المعاد تشغيلها، لكن يتم تخطي آثارها الجانبية.
- تتضمن منعطفات محادثة Twilio رمزًا مميزًا لكل منعطف في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها إرضاء منعطف نص معلق أحدث.
- يتم رفض طلبات Webhook غير الموثقة قبل قراءة الجسم عندما تكون رؤوس التوقيع المطلوبة من المزود مفقودة.
- يستخدم Webhook المكالمات الصوتية ملف جسم ما قبل المصادقة المشترك (64 كيلوبايت / 5 ثوانٍ)، إضافة إلى حد أقصى للطلبات الجارية لكل عنوان IP قبل التحقق من التوقيع.

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
إلى وقت تشغيل المكالمات الصوتية المملوك لـ Gateway حتى لا يربط CLI خادم
Webhook ثانيًا. إذا لم يكن أي Gateway قابلًا للوصول، تعود الأوامر إلى
وقت تشغيل CLI مستقل.

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين المكالمات الصوتية الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لقصر
التحليل على آخر N سجلات (الافتراضي 200). يتضمن الخرج p50/p90/p99
لزمن انتقال المنعطف وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء          | الوسائط                                    |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يشحن هذا المستودع مستند Skill مطابقًا في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة              | الوسائط                                    |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

لا يكون `dtmfSequence` صالحًا إلا مع `mode: "conversation"`. ينبغي لمكالمات نمط الإشعار
استخدام `voicecall.dtmf` بعد وجود المكالمة إذا كانت تحتاج إلى أرقام بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في إتاحة Webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن يكون `webhook-exposure` أخضر. لا يزال
`publicUrl` المكوّن يفشل عندما يشير إلى مساحة شبكة محلية أو خاصة،
لأن شركة الاتصالات لا تستطيع معاودة الاتصال بهذه العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x`
أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كـ `publicUrl`.

ترسل مكالمات Twilio الصادرة بنمط الإشعار TwiML الأولي لـ `<Say>` مباشرة في
طلب إنشاء المكالمة، لذلك لا تعتمد الرسالة المنطوقة الأولى على جلب Twilio
لـ Webhook TwiML. لا يزال Webhook عام مطلوبًا لاستدعاءات الحالة،
ومكالمات المحادثة، وDTMF قبل الاتصال، والتدفقات الفورية، والتحكم بالمكالمة
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

`voicecall smoke` هو تشغيل تجريبي جاف ما لم تمرر `--yes`.

### فشل بيانات اعتماد المزود

تحقق من المزود المحدد وحقول بيانات الاعتماد المطلوبة:

- Twilio: `twilio.accountSid` و`twilio.authToken` و`fromNumber`، أو
  `TWILIO_ACCOUNT_SID` و`TWILIO_AUTH_TOKEN` و`TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey` و`telnyx.connectionId` و`telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId` و`plivo.authToken` و`fromNumber`.

يجب أن تكون بيانات الاعتماد موجودة على مضيف Gateway. لا يؤثر تعديل ملف تعريف shell محلي
في Gateway قيد التشغيل بالفعل حتى يعاد تشغيله أو يعاد تحميل
بيئته.

### تبدأ المكالمات لكن Webhook المزود لا يصل

تأكد من أن وحدة تحكم المزود تشير إلى عنوان URL العام الدقيق لـ Webhook:

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
- تغيّر عنوان URL الخاص بالنفق بعد بدء Gateway.
- يمرر proxy الطلب لكنه يزيل أو يعيد كتابة رؤوس host/proto.
- يوجه جدار الحماية أو DNS اسم المضيف العام إلى مكان آخر غير Gateway.
- تمت إعادة تشغيل Gateway من دون تفعيل Plugin Voice Call.

عندما يكون reverse proxy أو tunnel أمام Gateway، عيّن
`webhookSecurity.allowedHosts` إلى اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان proxy معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود proxy تحت
سيطرتك.

### فشل التحقق من التوقيع

يتم التحقق من تواقيع المزود مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التواقيع:

- تأكد من أن عنوان URL الخاص بـ Webhook لدى المزود يطابق `publicUrl` تمامًا، بما في ذلك
  المخطط والمضيف والمسار.
- بالنسبة إلى عناوين URL في الطبقة المجانية من ngrok، حدّث `publicUrl` عندما يتغير اسم مضيف النفق.
- تأكد من أن proxy يحافظ على رؤوس المضيف والبروتوكول الأصلية، أو اضبط
  `webhookSecurity.allowedHosts`.
- لا تفعّل `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمام Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin لعمليات الانضمام عبر اتصال Twilio. تحقق أولًا من Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق من نقل Google Meet صراحة:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كان Voice Call أخضر لكن مشارك Meet لا ينضم أبدًا، فتحقق من رقم الاتصال الهاتفي لـ Meet
ورقم PIN و`--dtmf-sequence`. يمكن أن تكون المكالمة الهاتفية سليمة بينما
يرفض الاجتماع تسلسل DTMF غير صحيح أو يتجاهله.

يبدأ Google Meet ساق هاتف Twilio عبر `voicecall.start` مع
تسلسل DTMF قبل الاتصال. تتضمن التسلسلات المشتقة من PIN قيمة
`voiceCall.dtmfDelayMs` الخاصة بـ Plugin Google Meet كأرقام انتظار Twilio بادئة. الافتراضي هو 12 ثانية
لأن مطالبات الاتصال الهاتفي في Meet قد تصل متأخرة. ثم يعيد Voice Call التوجيه إلى
المعالجة الفورية قبل طلب تحية المقدمة.

استخدم `openclaw logs --follow` لتتبع المرحلة المباشرة. يسجل انضمام Twilio Meet السليم
هذا الترتيب:

- يفوض Google Meet انضمام Twilio إلى Voice Call.
- يخزن Voice Call ‏TwiML DTMF قبل الاتصال.
- يتم استهلاك TwiML الأولي من Twilio وتقديمه قبل المعالجة الفورية.
- يقدم Voice Call ‏TwiML الفوري لمكالمة Twilio.
- يطلب Google Meet كلام المقدمة باستخدام `voicecall.speak` بعد تأخير ما بعد DTMF.

لا يزال `openclaw voicecall tail` يعرض سجلات المكالمات المستمرة؛ وهو مفيد
لحالة المكالمة والنصوص، لكن لا يظهر هناك كل انتقال Webhook/فوري.

### لا يوجد كلام في المكالمة الفورية

تأكد من تفعيل وضع صوت واحد فقط. لا يمكن أن يكون `realtime.enabled` و
`streaming.enabled` كلاهما true.

بالنسبة إلى مكالمات Twilio الفورية، تحقق أيضًا مما يلي:

- تم تحميل Plugin مزود فوري وتسجيله.
- `realtime.provider` غير مضبوط أو يسمي مزودًا مسجلًا.
- مفتاح API الخاص بالمزود متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML الفوري، وبدء الجسر الفوري،
  ووضع التحية الأولية في قائمة الانتظار.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [التنبيه الصوتي](/ar/nodes/voicewake)
