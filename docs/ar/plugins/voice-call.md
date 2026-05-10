---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تهيئ أو تطوّر Plugin المكالمات الصوتية
    - تحتاج إلى الصوت في الوقت الفعلي أو التفريغ النصي المتدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: إجراء مكالمات صوتية صادرة وقبول مكالمات صوتية واردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الفعلي والتفريغ النصي المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-05-10T19:56:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الأدوار، والصوت الفوري ثنائي الاتجاه الكامل، والتفريغ النصي
المتدفق، والمكالمات الواردة مع سياسات قائمة السماح.

**المزوّدون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (تطوير/بلا شبكة).

<Note>
يعمل Voice Call plugin **داخل عملية Gateway**. إذا كنت تستخدم
Gateway بعيداً، فثبّت Plugin وهيئه على الجهاز الذي يشغّل
Gateway، ثم أعد تشغيل Gateway لتحميله.
</Note>

## البدء السريع

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

    استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصداراً
    محدداً بالضبط فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

    أعد تشغيل Gateway بعد ذلك حتى يتم تحميل Plugin.

  </Step>
  <Step title="هيّئ المزوّد وWebhook">
    اضبط الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [الإعدادات](#configuration) أدناه للاطلاع على الشكل الكامل). كحد أدنى:
    `provider`، وبيانات اعتماد المزوّد، و`fromNumber`، وعنوان URL لـ Webhook
    يمكن الوصول إليه علناً.
  </Step>
  <Step title="تحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    ```

    يكون الخرج الافتراضي قابلاً للقراءة في سجلات الدردشة والطرفيات. يتحقق من
    تفعيل Plugin، وبيانات اعتماد المزوّد، وإتاحة Webhook، وأن وضعاً صوتياً
    واحداً فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للسكربتات.

  </Step>
  <Step title="اختبار سريع">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيلات جافة افتراضياً. أضف `--yes` لإجراء مكالمة إشعار صادرة
    قصيرة فعلياً:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن ينتهي الإعداد إلى **عنوان URL علني لـ Webhook**.
إذا كان `publicUrl`، أو عنوان URL للنفق، أو عنوان URL لـ Tailscale، أو احتياطي الخدمة
ينتهي إلى loopback أو مساحة شبكة خاصة، فسيفشل الإعداد بدلاً من
بدء مزوّد لا يمكنه تلقي Webhook من شركات الاتصالات.
</Warning>

## الإعدادات

إذا كان `enabled: true` لكن المزوّد المحدد يفتقد بيانات الاعتماد،
تسجل عملية بدء Gateway تحذيراً بأن الإعداد غير مكتمل مع المفاتيح المفقودة
وتتخطى بدء وقت التشغيل. تظل الأوامر، واستدعاءات RPC، وأدوات الوكيل
تعيد إعدادات المزوّد المفقودة بالضبط عند استخدامها.

<Note>
تقبل بيانات اعتماد مكالمات الصوت SecretRefs. يتم حل `plugins.entries.voice-call.config.twilio.authToken`، و`plugins.entries.voice-call.config.realtime.providers.*.apiKey`، و`plugins.entries.voice-call.config.streaming.providers.*.apiKey`، و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر سطح SecretRef القياسي؛ راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
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
  <Accordion title="ملاحظات إتاحة المزوّد والأمان">
    - تتطلب Twilio وTelnyx وPlivo جميعها عنوان URL لـ Webhook **يمكن الوصول إليه علناً**.
    - `mock` هو مزوّد تطوير محلي (بلا استدعاءات شبكة).
    - يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
    - `skipSignatureVerification` للاختبار المحلي فقط.
    - في الطبقة المجانية من ngrok، اضبط `publicUrl` على عنوان URL الدقيق لـ ngrok؛ يتم فرض التحقق من التوقيع دائماً.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhook من Twilio ذات التواقيع غير الصالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن أن تتغير عناوين URL للطبقة المجانية من Ngrok أو تضيف سلوك صفحات بينية؛ إذا انحرف `publicUrl`، تفشل تواقيع Twilio. في الإنتاج: فضّل نطاقاً ثابتاً أو Tailscale funnel.

  </Accordion>
  <Accordion title="حدود اتصالات البث">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل أبداً إطار `start` صالحاً.
    - يحد `streaming.maxPendingConnections` العدد الإجمالي لمقابس ما قبل البدء غير المصادقة.
    - يحد `streaming.maxPendingConnectionsPerIp` مقابس ما قبل البدء غير المصادقة لكل عنوان IP مصدر.
    - يحد `streaming.maxConnections` العدد الإجمالي لمقابس بث الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات الإعدادات القديمة">
    يعيد `openclaw doctor --fix` كتابة الإعدادات الأقدم التي تستخدم `provider: "log"`، أو `twilio.from`، أو مفاتيح OpenAI القديمة
    ضمن `streaming.*`. لا يزال احتياطي وقت التشغيل يقبل مفاتيح voice-call القديمة حالياً، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح البث التي يتم ترحيلها تلقائياً:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## نطاق الجلسة

افتراضياً، يستخدم Voice Call `sessionScope: "per-phone"` بحيث تحتفظ المكالمات المتكررة من
المتصل نفسه بذاكرة المحادثة. اضبط `sessionScope: "per-call"` عندما
ينبغي أن تبدأ كل مكالمة من شركة الاتصالات بسياق جديد، مثل تدفقات الاستقبال،
أو الحجز، أو IVR، أو جسر Google Meet حيث قد يمثل رقم الهاتف نفسه
اجتماعات مختلفة.

## محادثات الصوت الفوري

يحدد `realtime` مزوّد صوت فوري ثنائي الاتجاه الكامل لصوت المكالمة الحي.
وهو منفصل عن `streaming`، الذي يرسل الصوت فقط إلى
مزوّدي التفريغ النصي الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر وضعاً
صوتياً واحداً لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لـ Twilio Media Streams.
- `realtime.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول مزوّد صوت فوري مسجل.
- مزوّدو الصوت الفوري المضمنون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويتم تسجيلهم بواسطة Plugins المزوّد الخاصة بهم.
- توجد إعدادات المزوّد الخام المملوكة للمزوّد ضمن `realtime.providers.<providerId>`.
- يكشف Voice Call أداة `openclaw_agent_consult` الفورية المشتركة افتراضياً. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل استدلالاً أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- يضيف `realtime.consultPolicy` اختيارياً إرشادات حول متى يجب أن يستدعي النموذج الفوري `openclaw_agent_consult`.
- يكون `realtime.agentContext.enabled` معطلاً افتراضياً. عند تفعيله، يحقن Voice Call هوية وكيل محدودة، وتجاوز موجه النظام، وكبسولة محددة لملف مساحة العمل في تعليمات المزوّد الفوري عند إعداد الجلسة.
- يكون `realtime.fastContext.enabled` معطلاً افتراضياً. عند تفعيله، يبحث Voice Call أولاً في الذاكرة/سياق الجلسة المفهرس عن سؤال الاستشارة ويعيد تلك المقاطع إلى النموذج الفوري ضمن `realtime.fastContext.timeoutMs` قبل الرجوع إلى وكيل الاستشارة الكامل فقط إذا كانت `realtime.fastContext.fallbackToConsult` تساوي true.
- إذا كان `realtime.provider` يشير إلى مزوّد غير مسجل، أو لم يكن أي مزوّد صوت فوري مسجلاً إطلاقاً، يسجل Voice Call تحذيراً ويتخطى وسائط الوقت الفوري بدلاً من إفشال Plugin بالكامل.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة المكالمة المخزنة عندما تكون متاحة، ثم تعود إلى `sessionScope` المهيأ (`per-phone` افتراضياً، أو `per-call` للمكالمات المعزولة).

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | يكشف أداة الاستشارة ويقصر الوكيل العادي على `read`، و`web_search`، و`web_fetch`، و`x_search`، و`memory_search`، و`memory_get`. |
| `owner`          | يكشف أداة الاستشارة ويتيح للوكيل العادي استخدام سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا يكشف أداة الاستشارة. تظل `realtime.tools` المخصصة تمرر إلى المزوّد الفوري.                               |

يتحكم `realtime.consultPolicy` في تعليمات النموذج الفوري فقط:

| السياسة        | الإرشادات                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | أبقِ الموجه الافتراضي ودع المزوّد يقرر متى يستدعي أداة الاستشارة.              |
| `substantive` | أجب مباشرة عن العبارات الحوارية البسيطة واستشر قبل الحقائق، أو الذاكرة، أو الأدوات، أو السياق. |
| `always`      | استشر قبل كل إجابة ذات مضمون.                                                        |

### سياق صوت الوكيل

فعّل `realtime.agentContext` عندما ينبغي لجسر الصوت أن يبدو مثل وكيل
OpenClaw المهيأ دون دفع تكلفة ذهاب وإياب لاستشارة الوكيل الكاملة في
الأدوار العادية. تُضاف كبسولة السياق مرة واحدة عند إنشاء الجلسة الفورية،
لذا فهي لا تضيف زمناً لكل دور. لا تزال استدعاءات
`openclaw_agent_consult` تشغّل وكيل OpenClaw الكامل ويجب استخدامها
لأعمال الأدوات، أو المعلومات الحالية، أو عمليات البحث في الذاكرة، أو حالة مساحة العمل.

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

### أمثلة مزوّد الوقت الحقيقي

<Tabs>
  <Tab title="Google Gemini Live">
    القيم الافتراضية: مفتاح API من `realtime.providers.google.apiKey`،
    `GEMINI_API_KEY`، أو `GOOGLE_GENERATIVE_AI_API_KEY`؛ النموذج
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
                consultThinkingLevel: "low",
                consultFastMode: true,
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
[مزوّد OpenAI](/ar/providers/openai) للاطلاع على خيارات الصوت في الوقت الحقيقي
الخاصة بكل مزوّد.

## النسخ المتدفق

يحدّد `streaming` مزوّد نسخ في الوقت الحقيقي لصوت المكالمات الحية.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُضبط، تستخدم المكالمة الصوتية أول مزوّد نسخ في الوقت الحقيقي مسجّل.
- مزوّدو النسخ في الوقت الحقيقي المضمّنون: Deepgram (`deepgram`)، وElevenLabs (`elevenlabs`)، وMistral (`mistral`)، وOpenAI (`openai`)، وxAI (`xai`)، وتُسجَّل بواسطة Plugins المزوّدين الخاصة بها.
- يوجد الإعداد الخام المملوك للمزوّد ضمن `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لبث مقبول، تسجّل المكالمة الصوتية البث فورًا، وتضع الوسائط الواردة في الصف عبر مزوّد النسخ بينما يتصل المزوّد، وتبدأ التحية الأولية فقط بعد أن يصبح النسخ في الوقت الحقيقي جاهزًا.
- إذا كان `streaming.provider` يشير إلى مزوّد غير مسجّل، أو لم يكن أي مزوّد مسجّلًا، تسجل المكالمة الصوتية تحذيرًا وتتخطى بث الوسائط بدلًا من إفشال Plugin بالكامل.

### أمثلة مزوّد البث

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

تستخدم المكالمة الصوتية إعدادات `messages.tts` الأساسية لبث
الكلام في المكالمات. يمكنك تجاوزها ضمن إعدادات Plugin
**بنفس الشكل** — إذ تُدمج دمجًا عميقًا مع `messages.tts`.

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
**يتم تجاهل الكلام من Microsoft للمكالمات الصوتية.** يتطلب صوت الاتصالات الهاتفية PCM؛
ولا يكشف نقل Microsoft الحالي عن مخرجات PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- تُصلَح مفاتيح `tts.<provider>` القديمة داخل إعدادات Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) بواسطة `openclaw doctor --fix`؛ وينبغي أن يستخدم الإعداد الملتزم `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تفعيل بث وسائط Twilio؛ وإلا تعود المكالمات إلى أصوات المزوّد الأصلية.
- إذا كان بث وسائط Twilio نشطًا بالفعل، فلا تعود المكالمة الصوتية إلى TwiML `<Say>`. إذا لم يكن TTS الهاتفي متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من مزج مساري تشغيل.
- عندما يعود TTS الهاتفي إلى مزوّد ثانوي، تسجّل المكالمة الصوتية تحذيرًا مع سلسلة المزوّدين (`from`، `to`، `attempts`) لأغراض التصحيح.
- عندما يؤدي مقاطعة الكلام من Twilio أو تفكيك البث إلى مسح صف TTS المعلّق، تُسوّى طلبات التشغيل الموضوعة في الصف بدلًا من ترك المتصلين معلّقين بانتظار اكتمال التشغيل.

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

تكون سياسة الوارد افتراضيًا `disabled`. لتفعيل المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` هو فحص منخفض الضمان لمعرّف المتصل. يقوم
Plugin بتطبيع قيمة `From` المقدّمة من المزوّد ومقارنتها مع
`allowFrom`. تتحقق مصادقة Webhook من تسليم المزوّد وسلامة
الحمولة، لكنها **لا** تثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كتصفية لمعرّف المتصل، لا كهوية قوية
للمتصل.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`،
`responseSystemPrompt`، و`responseTimeoutMs`.

### التوجيه لكل رقم

استخدم `numbers` عندما يتلقى Plugin مكالمة صوتية واحد مكالمات لعدة أرقام هاتف
وينبغي أن يتصرف كل رقم كخط مختلف. على سبيل المثال، يمكن أن يستخدم أحد
الأرقام مساعدًا شخصيًا غير رسمي بينما يستخدم آخر شخصية أعمال،
ووكيل استجابة مختلفًا، وصوت TTS مختلفًا.

تُختار المسارات من رقم `To` المطلوب الذي يقدمه المزوّد. يجب أن تكون المفاتيح
أرقام E.164. عند وصول مكالمة، تحل المكالمة الصوتية المسار المطابق مرة واحدة،
وتخزّن المسار المطابق في سجل المكالمة، وتعيد استخدام ذلك الإعداد الفعّال
للتحية، ومسار الرد التلقائي الكلاسيكي، ومسار استشارة الوقت الحقيقي، وتشغيل TTS.
إذا لم يطابق أي مسار، يُستخدم إعداد المكالمة الصوتية العام.
لا تستخدم المكالمات الصادرة `numbers`؛ مرّر هدف الصادر والرسالة
والجلسة صراحةً عند بدء المكالمة.

تدعم تجاوزات المسارات حاليًا:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تُدمج قيمة مسار `tts` دمجًا عميقًا فوق إعداد `tts` العام للمكالمة الصوتية، لذا
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

بالنسبة إلى الردود التلقائية، تضيف المكالمة الصوتية عقد مخرجات منطوقة صارمًا إلى
موجّه النظام:

```text
{"spoken":"..."}
```

تستخرج المكالمة الصوتية نص الكلام بأسلوب دفاعي:

- تتجاهل الحمولات الموسومة كمحتوى تفكير/خطأ.
- تحلل JSON المباشر، أو JSON داخل سياج، أو مفاتيح `"spoken"` المضمنة.
- تعود إلى النص العادي وتزيل فقرات الاستهلال التي تبدو تخطيطية/وصفية.

يحافظ ذلك على تركيز التشغيل المنطوق على النص الموجّه للمتصل، ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، ترتبط معالجة الرسالة الأولى بحالة
التشغيل الحية:

- لا يتم إخماد مسح صف مقاطعة الكلام والرد التلقائي إلا أثناء نطق التحية الأولية بنشاط.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في الصف لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث دون تأخير إضافي.
- تقاطع مقاطعة الكلام التشغيل النشط وتمسح إدخالات TTS الخاصة بـ Twilio الموضوعة في الصف والتي لم تبدأ التشغيل بعد. تُحل الإدخالات الممسوحة كمتخطاة، بحيث يمكن لمنطق الاستجابة اللاحقة المتابعة دون انتظار صوت لن يُشغّل أبدًا.
- تستخدم محادثات الصوت في الوقت الحقيقي دور الافتتاح الخاص ببث الوقت الحقيقي نفسه. لا تنشر المكالمة الصوتية تحديث TwiML قديمًا عبر `<Say>` لتلك الرسالة الأولية، لذلك تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### فترة السماح لانقطاع بث Twilio

عند انقطاع بث وسائط Twilio، تنتظر المكالمة الصوتية **2000 ms** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعاد البث الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجَّل أي بث مجددًا بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## منظف المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدًا
Webhook نهائيًا (على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية
هي `0` (معطّل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات نمط الإشعار.
- أبقِ هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن الاستدعاءات العادية من الاكتمال. نقطة بدء جيدة هي `maxDurationSeconds + 30–60` ثانية.

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

عندما يوجد وكيل أو نفق أمام Gateway، يعيد Plugin
بناء عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات
في ترويسات التوجيه التي يتم الوثوق بها:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  قائمة سماح بالمضيفين من ترويسات التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  الوثوق بترويسات التوجيه دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  لا تثق بترويسات التوجيه إلا عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- يتم تمكين **الحماية من إعادة تشغيل Webhook** لـ Twilio وPlivo. يتم الإقرار بطلبات Webhook الصالحة المعاد تشغيلها، لكن يتم تخطي آثارها الجانبية.
- تتضمن أدوار محادثة Twilio رمزا مميزا لكل دور في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة أو المعاد تشغيلها أن تفي بدور نسخة نصية معلقة أحدث.
- يتم رفض طلبات Webhook غير المصادق عليها قبل قراءة النص عندما تكون ترويسات التوقيع المطلوبة من المزوّد مفقودة.
- يستخدم Webhook الخاص بالمكالمات الصوتية ملف تعريف النص المشترك قبل المصادقة (64 كيلوبايت / 5 ثوان) إضافة إلى حد أقصى للطلبات الجارية لكل عنوان IP قبل التحقق من التوقيع.

مثال باستخدام مضيف عام ثابت:

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
إلى بيئة تشغيل المكالمات الصوتية المملوكة لـ Gateway حتى لا يربط CLI خادم
Webhook ثانيا. إذا تعذر الوصول إلى أي Gateway، تعود الأوامر إلى
بيئة تشغيل CLI مستقلة.

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين المكالمات الصوتية الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لتقييد
التحليل بآخر N سجلات (الافتراضي 200). يتضمن الإخراج p50/p90/p99
لزمن انتقال الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء          | الوسيطات                                   |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يشحن هذا المستودع مستند مهارة مطابقا في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة              | الوسيطات                                   |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

يكون `dtmfSequence` صالحا فقط مع `mode: "conversation"`. يجب على مكالمات
وضع الإشعار استخدام `voicecall.dtmf` بعد وجود المكالمة إذا كانت تحتاج إلى
أرقام بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في كشف Webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن يكون `webhook-exposure` أخضر. سيظل
`publicUrl` المكوّن يفشل عندما يشير إلى مساحة شبكة محلية أو خاصة، لأن شركة الاتصالات لا تستطيع معاودة الاتصال بتلك العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو
`192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كـ `publicUrl`.

ترسل مكالمات Twilio الصادرة في وضع الإشعار TwiML الأولي لـ `<Say>` مباشرة في
طلب إنشاء المكالمة، لذلك لا تعتمد الرسالة المنطوقة الأولى على جلب Twilio
لـ TwiML الخاص بـ Webhook. يظل Webhook العام مطلوبا لاستدعاءات الحالة،
ومكالمات المحادثة، وDTMF قبل الاتصال، والتدفقات الفورية، والتحكم بالمكالمة
بعد الاتصال.

استخدم مسار كشف عام واحدا:

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

يكون `voicecall smoke` تشغيلا تجريبيا ما لم تمرر `--yes`.

### فشل بيانات اعتماد المزوّد

تحقق من المزوّد المحدد وحقول بيانات الاعتماد المطلوبة:

- Twilio: `twilio.accountSid` و`twilio.authToken` و`fromNumber`، أو
  `TWILIO_ACCOUNT_SID` و`TWILIO_AUTH_TOKEN` و`TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey` و`telnyx.connectionId` و`telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId` و`plivo.authToken` و`fromNumber`.

يجب أن توجد بيانات الاعتماد على مضيف Gateway. لا يؤثر تعديل ملف تعريف shell محلي
في Gateway قيد التشغيل بالفعل حتى يعيد التشغيل أو يعيد تحميل
بيئته.

### تبدأ المكالمات لكن Webhooks الخاصة بالمزوّد لا تصل

تأكد من أن وحدة تحكم المزوّد تشير إلى عنوان URL العام الدقيق لـ Webhook:

```text
https://voice.example.com/voice/webhook
```

ثم افحص حالة بيئة التشغيل:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

الأسباب الشائعة:

- يشير `publicUrl` إلى مسار مختلف عن `serve.path`.
- تغيّر عنوان URL الخاص بالنفق بعد بدء Gateway.
- يمرر الوكيل الطلب لكنه يزيل ترويسات المضيف/البروتوكول أو يعيد كتابتها.
- يوجه جدار الحماية أو DNS اسم المضيف العام إلى مكان آخر غير Gateway.
- تمت إعادة تشغيل Gateway دون تمكين Plugin المكالمات الصوتية.

عندما يوجد وكيل عكسي أو نفق أمام Gateway، عيّن
`webhookSecurity.allowedHosts` إلى اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود الوكيل تحت
سيطرتك.

### فشل التحقق من التوقيع

يتم فحص توقيعات المزوّد مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التوقيعات:

- تأكد من أن عنوان URL الخاص بـ Webhook لدى المزوّد يطابق `publicUrl` تماما، بما في ذلك
  المخطط والمضيف والمسار.
- بالنسبة إلى عناوين URL في الطبقة المجانية من ngrok، حدّث `publicUrl` عندما يتغير اسم مضيف النفق.
- تأكد من أن الوكيل يحافظ على ترويسات المضيف والبروتوكول الأصلية، أو كوّن
  `webhookSecurity.allowedHosts`.
- لا تمكّن `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمام Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin للانضمام عبر اتصال Twilio الهاتفي. تحقق أولا من Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق صراحة من نقل Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كان Voice Call أخضر لكن مشارك Meet لا ينضم أبدا، فتحقق من رقم الاتصال الهاتفي لـ Meet ورقم PIN و`--dtmf-sequence`. يمكن أن تكون المكالمة الهاتفية سليمة بينما يرفض الاجتماع تسلسل DTMF غير الصحيح أو يتجاهله.

يبدأ Google Meet طرف مكالمة Twilio الهاتفية عبر `voicecall.start` مع تسلسل
DTMF قبل الاتصال. تتضمن التسلسلات المشتقة من PIN قيمة
`voiceCall.dtmfDelayMs` الخاصة بـ Plugin Google Meet كأرقام انتظار Twilio بادئة. القيمة الافتراضية هي 12 ثانية
لأن مطالبات الاتصال الهاتفي في Meet قد تصل متأخرة. ثم يعيد Voice Call التوجيه إلى
المعالجة الفورية قبل طلب تحية المقدمة.

استخدم `openclaw logs --follow` لتتبع المرحلة الحية. يسجل انضمام Twilio Meet
السليم هذا الترتيب:

- يفوض Google Meet انضمام Twilio إلى Voice Call.
- يخزن Voice Call ملف TwiML الخاص بـ DTMF قبل الاتصال.
- يتم استهلاك TwiML الأولي من Twilio وتقديمه قبل المعالجة الفورية.
- يقدم Voice Call ملف TwiML الفوري لمكالمة Twilio.
- يطلب Google Meet كلام المقدمة باستخدام `voicecall.speak` بعد تأخير ما بعد DTMF.

ما زال `openclaw voicecall tail` يعرض سجلات المكالمات المستمرة؛ وهو مفيد
لحالة المكالمة والنسخ النصية، لكن لا يظهر كل انتقال Webhook/فوري
هناك.

### المكالمة الفورية بلا كلام

تأكد من تمكين وضع صوت واحد فقط. لا يمكن أن يكون `realtime.enabled` و
`streaming.enabled` كلاهما `true`.

بالنسبة إلى مكالمات Twilio الفورية، تحقق أيضا مما يلي:

- تم تحميل Plugin مزوّد فوري وتسجيله.
- `realtime.provider` غير معيّن أو يسمي مزوّدا مسجلا.
- مفتاح API الخاص بالمزوّد متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML الفوري، وبدء الجسر الفوري،
  وإدراج التحية الأولية في قائمة الانتظار.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [إيقاظ صوتي](/ar/nodes/voicewake)
