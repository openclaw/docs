---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت بصدد تكوين Plugin المكالمات الصوتية أو تطويره
    - تحتاج إلى صوت في الوقت الفعلي أو نسخ متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: إجراء مكالمات صوتية صادرة وقبول مكالمات واردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الفعلي والتفريغ النصي المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-05-06T08:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc608883e8f36cdd2075c3a8c7ab002d89d0616e119f488437bd18c995f066f9
    source_path: plugins/voice-call.md
    workflow: 16
---

المكالمات الصوتية لـ OpenClaw عبر plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الجولات، والصوت الفوري ثنائي الاتجاه الكامل، والنسخ
المتدفق، والمكالمات الواردة بسياسات قوائم السماح.

**المزوّدون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (تطوير/بلا شبكة).

<Note>
يعمل Voice Call plugin **داخل عملية Gateway**. إذا كنت تستخدم Gateway
بعيدًا، فثبّت plugin واضبطه على الجهاز الذي يشغّل
Gateway، ثم أعد تشغيل Gateway لتحميله.
</Note>

## البدء السريع

<Steps>
  <Step title="تثبيت plugin">
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

    استخدم الحزمة العارية لمتابعة وسم الإصدار الرسمي الحالي. ثبّت
    إصدارًا دقيقًا فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

    أعد تشغيل Gateway بعد ذلك لكي يتم تحميل plugin.

  </Step>
  <Step title="ضبط المزوّد وwebhook">
    اضبط الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [التكوين](#configuration) أدناه للاطلاع على الشكل الكامل). كحد أدنى:
    `provider`، وبيانات اعتماد المزوّد، و`fromNumber`، وعنوان webhook URL
    يمكن الوصول إليه علنًا.
  </Step>
  <Step title="التحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    ```

    يكون الخرج الافتراضي مقروءًا في سجلات الدردشة والطرفيات. يتحقق من
    تمكين plugin، وبيانات اعتماد المزوّد، وانكشاف webhook، وأن وضعًا صوتيًا
    واحدًا فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للبرامج النصية.

  </Step>
  <Step title="اختبار smoke">
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
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن ينتهي الإعداد إلى **عنوان webhook URL عام**.
إذا انتهى `publicUrl`، أو عنوان URL للنفق، أو عنوان URL لـ Tailscale، أو بديل
التقديم إلى local loopback أو مساحة شبكة خاصة، فسيفشل الإعداد بدلًا من
تشغيل مزوّد لا يستطيع تلقي webhooks من شركات الاتصالات.
</Warning>

## التكوين

إذا كان `enabled: true` لكن المزوّد المحدد يفتقد بيانات الاعتماد،
تسجل عملية بدء Gateway تحذيرًا بأن الإعداد غير مكتمل مع المفاتيح الناقصة
وتتخطى تشغيل وقت التشغيل. لا تزال الأوامر واستدعاءات RPC وأدوات الوكيل
تعيد تكوين المزوّد الناقص بدقة عند استخدامها.

<Note>
تقبل بيانات اعتماد voice-call مراجع SecretRef. يتم حل `plugins.entries.voice-call.config.twilio.authToken`، و`plugins.entries.voice-call.config.realtime.providers.*.apiKey`، و`plugins.entries.voice-call.config.streaming.providers.*.apiKey`، و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر سطح SecretRef القياسي؛ راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
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
  <Accordion title="ملاحظات انكشاف المزوّد والأمان">
    - تتطلب Twilio وTelnyx وPlivo جميعها عنوان webhook URL **يمكن الوصول إليه علنًا**.
    - `mock` مزوّد تطوير محلي (بلا استدعاءات شبكة).
    - يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
    - `skipSignatureVerification` للاختبار المحلي فقط.
    - في الطبقة المجانية من ngrok، اضبط `publicUrl` على عنوان ngrok URL الدقيق؛ يتم فرض التحقق من التوقيع دائمًا.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Twilio webhooks ذات توقيعات غير صالحة **فقط** عندما تكون `tunnel.provider="ngrok"` ويكون `serve.bind` هو local loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن أن تتغير عناوين URL للطبقة المجانية من Ngrok أو تضيف سلوكًا اعتراضيًا؛ إذا انحرف `publicUrl`، تفشل توقيعات Twilio. في الإنتاج: فضّل نطاقًا ثابتًا أو Tailscale funnel.

  </Accordion>
  <Accordion title="حدود اتصالات البث">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل أبدًا إطار `start` صالحًا.
    - يحد `streaming.maxPendingConnections` إجمالي مقابس ما قبل البدء غير المصادقة.
    - يحد `streaming.maxPendingConnectionsPerIp` مقابس ما قبل البدء غير المصادقة لكل عنوان IP مصدر.
    - يحد `streaming.maxConnections` إجمالي مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات التكوين القديمة">
    يعيد `openclaw doctor --fix` كتابة التكوينات الأقدم التي تستخدم `provider: "log"`، أو `twilio.from`، أو مفاتيح
    OpenAI القديمة ضمن `streaming.*`. لا يزال بديل وقت التشغيل يقبل مفاتيح voice-call القديمة في الوقت الحالي، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق المؤقتة
    مؤقتة.

    مفاتيح البث المرحّلة تلقائيًا:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## نطاق الجلسة

افتراضيًا، يستخدم Voice Call الإعداد `sessionScope: "per-phone"` لكي تحتفظ
المكالمات المتكررة من المتصل نفسه بذاكرة المحادثة. اضبط `sessionScope: "per-call"` عندما
ينبغي أن تبدأ كل مكالمة عبر شركة الاتصالات بسياق جديد، مثل الاستقبال،
أو الحجز، أو IVR، أو تدفقات جسر Google Meet حيث قد يمثل رقم الهاتف نفسه
اجتماعات مختلفة.

## محادثات الصوت الفوري

يحدد `realtime` مزوّد صوت فوري ثنائي الاتجاه الكامل لصوت المكالمة الحي.
وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
مزوّدي النسخ الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر وضعًا صوتيًا
واحدًا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- يتم دعم `realtime.enabled` لـ Twilio Media Streams.
- `realtime.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول مزوّد صوت فوري مسجل.
- مزوّدو الصوت الفوري المرفقون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويتم تسجيلهم بواسطة plugins المزوّدين الخاصة بهم.
- يعيش التكوين الخام المملوك للمزوّد ضمن `realtime.providers.<providerId>`.
- يكشف Voice Call أداة `openclaw_agent_consult` الفورية المشتركة افتراضيًا. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل تفكيرًا أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- يضيف `realtime.consultPolicy` اختياريًا إرشادات حول متى ينبغي للنموذج الفوري استدعاء `openclaw_agent_consult`.
- يكون `realtime.agentContext.enabled` معطلًا افتراضيًا. عند تمكينه، يحقن Voice Call هوية وكيل محدودة، وتجاوزًا لموجه النظام، وكبسولة محددة من ملفات مساحة العمل في تعليمات المزوّد الفوري عند إعداد الجلسة.
- يكون `realtime.fastContext.enabled` معطلًا افتراضيًا. عند تمكينه، يبحث Voice Call أولًا في الذاكرة المفهرسة/سياق الجلسة عن سؤال الاستشارة ويعيد تلك المقاطع إلى النموذج الفوري ضمن `realtime.fastContext.timeoutMs` قبل الرجوع إلى وكيل الاستشارة الكامل فقط إذا كانت `realtime.fastContext.fallbackToConsult` تساوي true.
- إذا أشار `realtime.provider` إلى مزوّد غير مسجل، أو لم يكن هناك أي مزوّد صوت فوري مسجل على الإطلاق، يسجل Voice Call تحذيرًا ويتخطى الوسائط الفورية بدلًا من إفشال plugin بالكامل.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة المكالمة المخزنة عندما تكون متاحة، ثم تعود إلى `sessionScope` المضبوط (`per-phone` افتراضيًا، أو `per-call` للمكالمات المعزولة).

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | يكشف أداة الاستشارة ويقصر الوكيل العادي على `read`، و`web_search`، و`web_fetch`، و`x_search`، و`memory_search`، و`memory_get`. |
| `owner`          | يكشف أداة الاستشارة ويدع الوكيل العادي يستخدم سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا يكشف أداة الاستشارة. لا تزال `realtime.tools` المخصصة تمرر إلى المزوّد الفوري.                               |

يتحكم `realtime.consultPolicy` في تعليمات النموذج الفوري فقط:

| السياسة        | الإرشاد                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | أبقِ الموجه الافتراضي ودع المزوّد يقرر متى يستدعي أداة الاستشارة.              |
| `substantive` | أجب مباشرة عن الروابط الحوارية البسيطة واستشر قبل الحقائق، أو الذاكرة، أو الأدوات، أو السياق. |
| `always`      | استشر قبل كل إجابة ذات مضمون.                                                        |

### سياق صوت الوكيل

فعّل `realtime.agentContext` عندما ينبغي لجسر الصوت أن يبدو مثل وكيل
OpenClaw المضبوط دون دفع تكلفة رحلة ذهاب وعودة كاملة لاستشارة الوكيل في
الأدوار العادية. تتم إضافة كبسولة السياق مرة واحدة عند إنشاء الجلسة الفورية،
لذلك لا تضيف زمن انتظار لكل دور. لا تزال استدعاءات
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

### أمثلة مزوّدي الوقت الفعلي

<Tabs>
  <Tab title="Google Gemini Live">
    القيم الافتراضية: مفتاح API من `realtime.providers.google.apiKey`،
    أو `GEMINI_API_KEY`، أو `GOOGLE_GENERATIVE_AI_API_KEY`؛ النموذج
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ الصوت `Kore`.
    يتم تفعيل `sessionResumption` و`contextWindowCompression` افتراضياً للمكالمات الأطول
    والقابلة لإعادة الاتصال. استخدم `silenceDurationMs` و`startSensitivity` و
    `endSensitivity` لضبط تبادل الأدوار بشكل أسرع على صوت الاتصالات الهاتفية.

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

راجع [مزوّد Google](/ar/providers/google) و
[مزوّد OpenAI](/ar/providers/openai) لمعرفة خيارات الصوت الفوري
الخاصة بكل مزوّد.

## النسخ المتدفق

يحدد `streaming` مزوّد نسخ فوري لصوت المكالمات الحية.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يتم ضبطه، يستخدم Voice Call أول مزوّد نسخ فوري مسجل.
- مزوّدو النسخ الفوري المضمنون: Deepgram (`deepgram`) وElevenLabs (`elevenlabs`) وMistral (`mistral`) وOpenAI (`openai`) وxAI (`xai`)، ويتم تسجيلهم بواسطة Plugins الخاصة بالمزوّدين.
- تعيش تهيئة المزوّد الخام التي يملكها المزوّد ضمن `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لبث مقبول، يسجل Voice Call البث فوراً، ويضع الوسائط الواردة في قائمة انتظار عبر مزوّد النسخ بينما يتصل المزوّد، ويبدأ التحية الأولية فقط بعد أن يصبح النسخ الفوري جاهزاً.
- إذا كان `streaming.provider` يشير إلى مزوّد غير مسجل، أو لم يكن أي مزوّد مسجلاً، يسجل Voice Call تحذيراً ويتجاوز بث الوسائط بدلاً من إفشال Plugin بأكمله.

### أمثلة مزوّدي البث

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

يستخدم Voice Call تهيئة `messages.tts` الأساسية لبث
الكلام في المكالمات. يمكنك تجاوزها ضمن تهيئة Plugin
**بالشكل نفسه** — فهي تدمج بعمق مع `messages.tts`.

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
**يتم تجاهل Microsoft speech للمكالمات الصوتية.** يحتاج صوت الاتصالات الهاتفية إلى PCM؛
ولا يكشف نقل Microsoft الحالي عن إخراج PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- يتم إصلاح مفاتيح `tts.<provider>` القديمة داخل تهيئة Plugin (`openai` و`elevenlabs` و`microsoft` و`edge`) بواسطة `openclaw doctor --fix`؛ يجب أن تستخدم التهيئة الملتزم بها `tts.providers.<provider>`.
- يتم استخدام TTS الأساسي عند تفعيل بث وسائط Twilio؛ وإلا تعود المكالمات إلى الأصوات الأصلية لدى المزوّد.
- إذا كان بث وسائط Twilio نشطاً بالفعل، لا يعود Voice Call إلى TwiML `<Say>`. إذا كان TTS للاتصالات الهاتفية غير متاح في تلك الحالة، يفشل طلب التشغيل بدلاً من مزج مساري تشغيل.
- عندما يعود TTS للاتصالات الهاتفية إلى مزوّد ثانوي، يسجل Voice Call تحذيراً مع سلسلة المزوّدين (`from` و`to` و`attempts`) للتصحيح.
- عندما يؤدي اقتحام Twilio أو تفكيك البث إلى مسح قائمة انتظار TTS المعلقة، تستقر طلبات التشغيل الموضوعة في قائمة الانتظار بدلاً من إبقاء المتصلين عالقين بانتظار اكتمال التشغيل.

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

القيمة الافتراضية لسياسة الوارد هي `disabled`. لتفعيل المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` هي شاشة معرف متصل منخفضة الضمان. يقوم
Plugin بتطبيع قيمة `From` المقدمة من المزوّد ويقارنها مع
`allowFrom`. تتحقق مصادقة Webhook من تسليم المزوّد وسلامة
الحمولة، لكنها **لا** تثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كترشيح لمعرف المتصل، وليس كهوية متصل
قوية.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel` و
`responseSystemPrompt` و`responseTimeoutMs`.

### التوجيه لكل رقم

استخدم `numbers` عندما يتلقى Plugin واحد من Voice Call مكالمات لعدة أرقام هاتفية
ويجب أن يتصرف كل رقم كخط مختلف. على سبيل المثال، يمكن لرقم واحد
استخدام مساعد شخصي غير رسمي بينما يستخدم رقم آخر شخصية عمل،
ووكيل رد مختلفاً، وصوت TTS مختلفاً.

يتم اختيار المسارات من رقم `To` المطلوب المقدم من المزوّد. يجب أن تكون المفاتيح
أرقام E.164. عند وصول مكالمة، يحل Voice Call المسار المطابق مرة واحدة،
ويخزن المسار المطابق في سجل المكالمة، ويعيد استخدام تلك التهيئة الفعالة
للتحية، ومسار الرد التلقائي الكلاسيكي، ومسار الاستشارة الفورية، وتشغيل TTS.
إذا لم يطابق أي مسار، يتم استخدام تهيئة Voice Call العامة.
لا تستخدم المكالمات الصادرة `numbers`؛ مرر الهدف الصادر والرسالة
والجلسة صراحةً عند بدء المكالمة.

تدعم تجاوزات المسارات حالياً:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تدمج قيمة المسار `tts` بعمق فوق تهيئة `tts` العامة في Voice Call، لذا
يمكنك عادةً تجاوز صوت المزوّد فقط:

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

بالنسبة للردود التلقائية، يضيف Voice Call عقد مخرجات منطوقة صارماً إلى
موجّه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام دفاعياً:

- يتجاهل الحمولات المعلّمة كمحتوى تفكير/خطأ.
- يحلل JSON المباشر، أو JSON داخل سياج، أو مفاتيح `"spoken"` المضمنة.
- يعود إلى النص العادي ويزيل فقرات المقدمة التي تبدو كتخطيط/بيانات وصفية.

يحافظ ذلك على تركيز التشغيل المنطوق على النص الموجه إلى المتصل، ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة لمكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة
التشغيل الحية:

- لا يتم كبح مسح قائمة انتظار الاقتحام والرد التلقائي إلا أثناء نطق التحية الأولية بنشاط.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث دون تأخير إضافي.
- يجهض الاقتحام التشغيل النشط ويمسح إدخالات Twilio TTS الموضوعة في قائمة الانتظار والتي لم يبدأ تشغيلها بعد. يتم حل الإدخالات الممسوحة كمتجاوزة، بحيث يمكن لمنطق الرد اللاحق أن يستمر دون انتظار صوت لن يتم تشغيله أبداً.
- تستخدم محادثات الصوت الفوري الدور الافتتاحي الخاص بالبث الفوري نفسه. لا ينشر Voice Call تحديث TwiML `<Say>` قديماً لتلك الرسالة الأولية، لذلك تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة سماح انقطاع بث Twilio

عندما ينقطع بث وسائط Twilio، ينتظر Voice Call مدة **2000 ms** قبل
إنهاء المكالمة تلقائياً:

- إذا أعاد البث الاتصال خلال تلك النافذة، يتم إلغاء الإنهاء التلقائي.
- إذا لم تتم إعادة تسجيل أي بث بعد فترة السماح، يتم إنهاء المكالمة لمنع بقاء مكالمات نشطة عالقة.

## حاصد المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبداً Webhook
نهائياً (على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبداً). القيمة الافتراضية
هي `0` (معطّل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية للتدفقات بنمط الإشعار.
- أبقِ هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن الاستدعاءات العادية من الاكتمال. نقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

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

عندما يكون Proxy أو نفق أمام Gateway، يعيد Plugin
بناء عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات
في رؤوس التوجيه التي يتم الوثوق بها:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  السماح بالمضيفين من رؤوس التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  الوثوق بالرؤوس المعاد توجيهها دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  الوثوق بالرؤوس المعاد توجيهها فقط عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- تم تفعيل **الحماية من إعادة تشغيل Webhook** لـ Twilio وPlivo. يتم الإقرار بطلبات Webhook الصالحة المعاد تشغيلها، لكن يتم تخطي آثارها الجانبية.
- تتضمن أدوار محادثة Twilio رمزًا لكل دور في عمليات رد نداء `<Gather>`، لذلك لا يمكن لردود نداء الكلام القديمة أو المعاد تشغيلها تلبية دور نص منسوخ معلّق أحدث.
- يتم رفض طلبات Webhook غير المصادق عليها قبل قراءة الجسم عندما تكون رؤوس التوقيع المطلوبة من المزوّد مفقودة.
- يستخدم Webhook الخاص بالمكالمات الصوتية ملف تعريف الجسم المشترك قبل المصادقة (64 كيلوبايت / 5 ثوانٍ) بالإضافة إلى حد للطلبات قيد التنفيذ لكل عنوان IP قبل التحقق من التوقيع.

مثال بمضيف عام ثابت:

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

عندما يكون Gateway قيد التشغيل بالفعل، تفوّض أوامر `voicecall` التشغيلية
إلى وقت تشغيل المكالمات الصوتية المملوك لـ Gateway حتى لا يربط CLI خادم
Webhook ثانيًا. إذا لم يكن أي Gateway قابلًا للوصول، تعود الأوامر إلى
وقت تشغيل CLI مستقل.

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين المكالمات الصوتية الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لحصر
التحليل في آخر N سجلًا (الافتراضي 200). يتضمن الإخراج p50/p90/p99
لكمون الدور وأوقات انتظار الاستماع.

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

يوفّر هذا المستودع مستند Skills مطابقًا في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة              | الوسائط                                    |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

يكون `dtmfSequence` صالحًا فقط مع `mode: "conversation"`. يجب على مكالمات
وضع الإشعار استخدام `voicecall.dtmf` بعد وجود المكالمة إذا احتاجت إلى
أرقام بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### يفشل الإعداد في إظهار Webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن تكون حالة `webhook-exposure` خضراء. يفشل
`publicUrl` المكوّن أيضًا عندما يشير إلى مساحة شبكة محلية أو خاصة،
لأن شركة الاتصالات لا تستطيع معاودة الاتصال بهذه العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x`
أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كقيمة `publicUrl`.

ترسل مكالمات Twilio الصادرة بوضع الإشعار TwiML الأولي الخاص بـ `<Say>` مباشرة في
طلب إنشاء المكالمة، لذلك لا تعتمد أول رسالة منطوقة على جلب Twilio
لـ Webhook TwiML. يبقى Webhook عام مطلوبًا لردود نداء الحالة،
ومكالمات المحادثة، وDTMF قبل الاتصال، والبث في الوقت الحقيقي، والتحكم في المكالمة
بعد الاتصال.

استخدم مسار إظهار عام واحدًا:

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

### فشل بيانات اعتماد المزوّد

تحقق من المزوّد المحدد وحقول بيانات الاعتماد المطلوبة:

- Twilio: `twilio.accountSid` و`twilio.authToken` و`fromNumber`، أو
  `TWILIO_ACCOUNT_SID` و`TWILIO_AUTH_TOKEN` و`TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey` و`telnyx.connectionId` و`telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId` و`plivo.authToken` و`fromNumber`.

يجب أن توجد بيانات الاعتماد على مضيف Gateway. لا يؤثر تعديل ملف تعريف
صدفة محلي في Gateway قيد التشغيل بالفعل حتى يعيد التشغيل أو يعيد تحميل
بيئته.

### تبدأ المكالمات لكن Webhooks الخاصة بالمزوّد لا تصل

تأكد من أن لوحة تحكم المزوّد تشير إلى عنوان URL العام الدقيق لـ Webhook:

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
- يقوم Proxy بتمرير الطلب لكنه يزيل أو يعيد كتابة رؤوس المضيف/البروتوكول.
- يوجّه الجدار الناري أو DNS اسم المضيف العام إلى مكان آخر غير Gateway.
- أُعيد تشغيل Gateway دون تفعيل Plugin المكالمات الصوتية.

عندما يكون Reverse Proxy أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان Proxy معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود Proxy تحت
سيطرتك.

### فشل التحقق من التوقيع

يتم فحص تواقيع المزوّد مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التواقيع:

- تأكد من أن عنوان URL الخاص بـ Webhook لدى المزوّد يطابق `publicUrl` تمامًا، بما في ذلك
  المخطط والمضيف والمسار.
- بالنسبة إلى عناوين URL في الطبقة المجانية من ngrok، حدّث `publicUrl` عندما يتغير اسم مضيف النفق.
- تأكد من أن Proxy يحافظ على رؤوس المضيف والبروتوكول الأصلية، أو اضبط
  `webhookSecurity.allowedHosts`.
- لا تفعّل `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمامات Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin لانضمامات الطلب الهاتفي عبر Twilio. تحقق أولًا من المكالمات الصوتية:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق صراحة من نقل Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كانت المكالمات الصوتية سليمة لكن مشارك Meet لا ينضم أبدًا، فتحقق من رقم
الاتصال الهاتفي لـ Meet ورقم PIN و`--dtmf-sequence`. يمكن أن تكون المكالمة الهاتفية سليمة بينما
يرفض الاجتماع تسلسل DTMF غير صحيح أو يتجاهله.

يمرر Google Meet تسلسل DTMF الخاص بـ Meet ونص المقدمة إلى `voicecall.start`.
بالنسبة إلى مكالمات Twilio، تقدّم المكالمات الصوتية TwiML الخاص بـ DTMF أولًا، ثم تعيد التوجيه إلى
Webhook، ثم تفتح بث الوسائط في الوقت الحقيقي حتى يتم إنشاء المقدمة المحفوظة
بعد أن ينضم المشارك الهاتفي إلى الاجتماع.

استخدم `openclaw logs --follow` لتتبع المرحلة المباشرة. يسجّل انضمام Twilio Meet
السليم هذا الترتيب:

- يفوّض Google Meet انضمام Twilio إلى المكالمات الصوتية.
- تخزّن المكالمات الصوتية TwiML الخاص بـ DTMF قبل الاتصال.
- يتم استهلاك TwiML الأولي من Twilio وتقديمه قبل المعالجة في الوقت الحقيقي.
- تقدّم المكالمات الصوتية TwiML في الوقت الحقيقي لمكالمة Twilio.
- يبدأ الجسر في الوقت الحقيقي مع وضع التحية الأولية في قائمة الانتظار.

لا يزال `openclaw voicecall tail` يعرض سجلات المكالمات المحفوظة؛ وهو مفيد
لحالة المكالمة والنصوص المنسوخة، لكن لا يظهر كل انتقال Webhook/الوقت الحقيقي
هناك.

### مكالمة الوقت الحقيقي بلا كلام

تأكد من تفعيل وضع صوت واحد فقط. لا يمكن أن يكون كل من `realtime.enabled` و
`streaming.enabled` بالقيمة true في الوقت نفسه.

بالنسبة إلى مكالمات Twilio في الوقت الحقيقي، تحقق أيضًا مما يلي:

- تم تحميل Plugin مزوّد الوقت الحقيقي وتسجيله.
- `realtime.provider` غير مضبوط أو يذكر مزوّدًا مسجلًا.
- مفتاح API الخاص بالمزوّد متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML في الوقت الحقيقي، وبدء الجسر في الوقت الحقيقي،
  ووضع التحية الأولية في قائمة الانتظار.

## ذو صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [التنبيه الصوتي](/ar/nodes/voicewake)
