---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بإعداد أو تطوير Plugin المكالمات الصوتية
    - تحتاج إلى صوت في الوقت الفعلي أو تفريغ نصي متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: إجراء مكالمات صوتية صادرة وقبول مكالمات واردة عبر Twilio أو Telnyx أو Plivo، مع صوت اختياري في الوقت الفعلي وتفريغ نصي متدفق
title: Plugin الاتصال الصوتي
x-i18n:
    generated_at: "2026-05-04T07:08:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم إشعارات صادرة،
ومحادثات متعددة الأدوار، وصوتًا فوريًا ثنائي الاتجاه بالكامل، ونسخًا
متدفقًا، ومكالمات واردة مع سياسات قائمة السماح.

**المزوّدون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (تطوير/بلا شبكة).

<Note>
يعمل Plugin المكالمات الصوتية **داخل عملية Gateway**. إذا كنت تستخدم
Gateway بعيدًا، فثبّت Plugin واضبطه على الجهاز الذي يشغّل
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

    استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت
    إصدارًا محددًا فقط عندما تحتاج إلى تثبيت قابل للتكرار.

    أعد تشغيل Gateway بعد ذلك حتى يتم تحميل Plugin.

  </Step>
  <Step title="اضبط المزوّد وWebhook">
    عيّن الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [التكوين](#configuration) أدناه للشكل الكامل). كحد أدنى:
    `provider`، وبيانات اعتماد المزوّد، و`fromNumber`، وعنوان URL لـ Webhook
    يمكن الوصول إليه علنًا.
  </Step>
  <Step title="تحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    ```

    يكون الخرج الافتراضي مقروءًا في سجلات الدردشة والطرفيات. يتحقق من
    تمكين Plugin، وبيانات اعتماد المزوّد، وتعرّض Webhook، وأن وضع صوت واحد فقط
    (`streaming` أو `realtime`) نشط. استخدم
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
إذا انتهى `publicUrl`، أو عنوان URL للنفق، أو عنوان URL لـ Tailscale، أو بديل التقديم
إلى local loopback أو مساحة شبكة خاصة، يفشل الإعداد بدلًا من
بدء مزوّد لا يستطيع استقبال Webhooks من شركات الاتصالات.
</Warning>

## التكوين

إذا كان `enabled: true` لكن المزوّد المحدد يفتقد بيانات الاعتماد،
تسجل بداية تشغيل Gateway تحذيرًا بأن الإعداد غير مكتمل مع المفاتيح الناقصة
وتتخطى بدء وقت التشغيل. لا تزال الأوامر، واستدعاءات RPC، وأدوات الوكيل
ترجع تكوين المزوّد الناقص بدقة عند استخدامها.

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
  <Accordion title="ملاحظات تعريض المزوّد والأمان">
    - تتطلب Twilio وTelnyx وPlivo جميعها عنوان URL لـ Webhook **يمكن الوصول إليه علنًا**.
    - `mock` هو مزوّد تطوير محلي (بلا استدعاءات شبكة).
    - يتطلب Telnyx `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` صحيحة.
    - `skipSignatureVerification` مخصص للاختبار المحلي فقط.
    - في طبقة ngrok المجانية، عيّن `publicUrl` إلى عنوان URL الدقيق من ngrok؛ يتم فرض التحقق من التوقيع دائمًا.
    - يتيح `tunnel.allowNgrokFreeTierLoopbackBypass: true` Webhooks من Twilio ذات تواقيع غير صالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو local loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن أن تتغير عناوين URL في طبقة Ngrok المجانية أو تضيف سلوك صفحات وسيطة؛ إذا انحرف `publicUrl`، تفشل تواقيع Twilio. في الإنتاج: فضّل نطاقًا ثابتًا أو قناة Tailscale funnel.

  </Accordion>
  <Accordion title="حدود اتصالات البث">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل إطار `start` صالحًا مطلقًا.
    - يحد `streaming.maxPendingConnections` من إجمالي مقابس ما قبل البدء غير المصادقة.
    - يحد `streaming.maxPendingConnectionsPerIp` من مقابس ما قبل البدء غير المصادقة لكل عنوان IP مصدر.
    - يحد `streaming.maxConnections` من إجمالي مقابس تدفق الوسائط المفتوحة (المعلّقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات التكوين القديمة">
    تتم إعادة كتابة التكوينات الأقدم التي تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة
    ضمن `streaming.*` بواسطة `openclaw doctor --fix`.
    لا يزال بديل وقت التشغيل يقبل مفاتيح voice-call القديمة في الوقت الحالي، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح البث المهاجرة تلقائيًا:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## نطاق الجلسة

افتراضيًا، تستخدم المكالمات الصوتية `sessionScope: "per-phone"` حتى تحتفظ المكالمات المتكررة من
نفس المتصل بذاكرة المحادثة. عيّن `sessionScope: "per-call"` عندما
ينبغي أن تبدأ كل مكالمة من شركة الاتصالات بسياق جديد، مثل تدفقات الاستقبال،
والحجز، وIVR، أو جسر Google Meet حيث قد
يمثل رقم الهاتف نفسه اجتماعات مختلفة.

## محادثات الصوت الفوري

يحدد `realtime` مزوّد صوت فوري ثنائي الاتجاه بالكامل لصوت المكالمة
المباشر. وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
مزوّدي النسخ الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر وضع
صوت واحدًا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لـ Twilio Media Streams.
- `realtime.provider` اختياري. إذا لم يُعيّن، تستخدم المكالمات الصوتية أول مزوّد صوت فوري مسجّل.
- مزوّدو الصوت الفوري المضمنون: Google Gemini Live (`google`) وOpenAI (`openai`)، يتم تسجيلهم بواسطة Plugins المزوّدين الخاصة بهم.
- يعيش التكوين الخام المملوك للمزوّد ضمن `realtime.providers.<providerId>`.
- تعرض المكالمات الصوتية أداة `openclaw_agent_consult` الفورية المشتركة افتراضيًا. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل تفكيرًا أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- يكون `realtime.fastContext.enabled` معطلًا افتراضيًا. عند تمكينه، تبحث المكالمات الصوتية أولًا في الذاكرة المفهرسة/سياق الجلسة عن سؤال الاستشارة وتعيد تلك المقتطفات إلى النموذج الفوري ضمن `realtime.fastContext.timeoutMs` قبل الرجوع إلى وكيل الاستشارة الكامل فقط إذا كانت `realtime.fastContext.fallbackToConsult` صحيحة.
- إذا أشار `realtime.provider` إلى مزوّد غير مسجّل، أو لم يكن أي مزوّد صوت فوري مسجّلًا على الإطلاق، تسجل المكالمات الصوتية تحذيرًا وتتخطى الوسائط الفورية بدلًا من إفشال Plugin بالكامل.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة المكالمة المخزنة عندما تكون متاحة، ثم ترجع إلى `sessionScope` المضبوط (`per-phone` افتراضيًا، أو `per-call` للمكالمات المعزولة).

### سياسة الأداة

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | اعرض أداة الاستشارة واقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | اعرض أداة الاستشارة ودع الوكيل العادي يستخدم سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا تعرض أداة الاستشارة. لا تزال `realtime.tools` المخصصة تُمرر إلى المزوّد الفوري.                               |

### أمثلة مزوّدي الوقت الفوري

<Tabs>
  <Tab title="Google Gemini Live">
    الإعدادات الافتراضية: مفتاح API من `realtime.providers.google.apiKey`،
    أو `GEMINI_API_KEY`، أو `GOOGLE_GENERATIVE_AI_API_KEY`؛ النموذج
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ الصوت `Kore`.
    يتم تشغيل `sessionResumption` و`contextWindowCompression` افتراضيًا للمكالمات الأطول
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
[مزوّد OpenAI](/ar/providers/openai) للاطلاع على خيارات الصوت الفوري
الخاصة بكل مزوّد.

## النسخ المتدفّق

يحدّد `streaming` مزوّد نسخ فوريًا لصوت المكالمات المباشرة.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول مزوّد نسخ فوري مسجّل.
- مزوّدو النسخ الفوري المضمّنون: Deepgram (`deepgram`)، وElevenLabs (`elevenlabs`)، وMistral (`mistral`)، وOpenAI (`openai`)، وxAI (`xai`)، ويتم تسجيلهم بواسطة Plugins المزوّدين الخاصة بهم.
- توجد إعدادات المزوّد الخام التي يملكها المزوّد تحت `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لتدفّق مقبول، يسجّل Voice Call التدفّق فورًا، ويضع الوسائط الواردة في قائمة انتظار عبر مزوّد النسخ بينما يتصل المزوّد، ولا يبدأ التحية الأولية إلا بعد أن يصبح النسخ الفوري جاهزًا.
- إذا أشار `streaming.provider` إلى مزوّد غير مسجّل، أو لم يكن هناك أي مزوّد مسجّل، يسجّل Voice Call تحذيرًا ويتخطى تدفّق الوسائط بدلًا من إفشال Plugin بأكمله.

### أمثلة مزوّد التدفّق

<Tabs>
  <Tab title="OpenAI">
    القيم الافتراضية: مفتاح API ‏`streaming.providers.openai.apiKey` أو
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
    القيم الافتراضية: مفتاح API ‏`streaming.providers.xai.apiKey` أو `XAI_API_KEY`؛
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

يستخدم Voice Call إعدادات `messages.tts` الأساسية للصوت المتدفّق
في المكالمات. يمكنك تجاوزها ضمن إعدادات Plugin باستخدام
**البنية نفسها** — إذ تُدمج دمجًا عميقًا مع `messages.tts`.

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
**يتم تجاهل Microsoft speech في المكالمات الصوتية.** يتطلب صوت الهاتف PCM؛
ولا يوفّر نقل Microsoft الحالي إخراج PCM هاتفيًا.
</Warning>

ملاحظات السلوك:

- يتم إصلاح مفاتيح `tts.<provider>` القديمة داخل إعدادات Plugin (`openai`، و`elevenlabs`، و`microsoft`، و`edge`) بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم الإعدادات الملتزم بها `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تمكين تدفّق وسائط Twilio؛ وإلا تعود المكالمات إلى أصوات المزوّد الأصلية.
- إذا كان تدفّق وسائط Twilio نشطًا بالفعل، لا يعود Voice Call إلى TwiML ‏`<Say>`. إذا لم يكن TTS الهاتفي متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من مزج مساري تشغيل.
- عندما يعود TTS الهاتفي إلى مزوّد ثانوي، يسجّل Voice Call تحذيرًا يتضمن سلسلة المزوّدين (`from`، و`to`، و`attempts`) للمساعدة في التصحيح.
- عندما يؤدي مقاطعة المتصل في Twilio أو تفكيك التدفّق إلى مسح قائمة انتظار TTS المعلّقة، تتم تسوية طلبات التشغيل في قائمة الانتظار بدلًا من إبقاء المتصلين معلّقين بانتظار اكتمال التشغيل.

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

تكون سياسة الوارد افتراضيًا `disabled`. لتمكين المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` فحص منخفض الضمان لمعرّف المتصل. يقوم
Plugin بتطبيع قيمة `From` التي يوفّرها المزوّد ومقارنتها مع
`allowFrom`. يتحقق Webhook من تسليم المزوّد وسلامة الحمولة،
لكنه **لا** يثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كتصفية لمعرّف المتصل، وليس كهوية قوية
للمتصل.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`،
و`responseSystemPrompt`، و`responseTimeoutMs`.

### التوجيه لكل رقم

استخدم `numbers` عندما يتلقى Plugin واحد من Voice Call مكالمات لعدة أرقام
هاتفية ويجب أن يتصرف كل رقم كخط مختلف. على سبيل المثال، يمكن لرقم واحد
استخدام مساعد شخصي بأسلوب غير رسمي بينما يستخدم رقم آخر شخصية عمل،
ووكيل استجابة مختلفًا، وصوت TTS مختلفًا.

يتم اختيار المسارات من رقم `To` الذي تم الاتصال به والمقدّم من المزوّد. يجب أن تكون المفاتيح
أرقام E.164. عندما تصل مكالمة، يحل Voice Call المسار المطابق مرة واحدة،
ويخزّن المسار المطابق في سجل المكالمة، ويعيد استخدام تلك الإعدادات الفعّالة
للتحية، ومسار الرد التلقائي الكلاسيكي، ومسار الاستشارة الفورية، وتشغيل TTS.
إذا لم يطابق أي مسار، تُستخدم إعدادات Voice Call العامة.
لا تستخدم المكالمات الصادرة `numbers`؛ مرّر هدف الاتصال الصادر، والرسالة،
والجلسة صراحة عند بدء المكالمة.

تدعم تجاوزات المسارات حاليًا:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تُدمج قيمة المسار `tts` دمجًا عميقًا فوق إعدادات `tts` العامة في Voice Call، لذا
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

### عقد الإخراج المنطوق

بالنسبة للردود التلقائية، يضيف Voice Call عقد إخراج منطوقًا صارمًا إلى
موجّه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بأسلوب دفاعي:

- يتجاهل الحمولات المعلّمة كمحتوى تفكير/خطأ.
- يحلل JSON مباشرًا، أو JSON داخل سياج، أو مفاتيح `"spoken"` مضمنة.
- يعود إلى النص العادي ويزيل فقرات المقدمة المحتملة الخاصة بالتخطيط/الميتا.

يحافظ هذا على تركيز التشغيل المنطوق على النص الموجّه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة لمكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة
التشغيل المباشر:

- لا يتم كبت مسح قائمة انتظار المقاطعة والرد التلقائي إلا أثناء نطق التحية الأولية بنشاط.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتظل الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لتدفّق Twilio عند اتصال التدفّق دون تأخير إضافي.
- توقف المقاطعة التشغيل النشط وتمسح إدخالات TTS الخاصة بـ Twilio الموجودة في قائمة الانتظار ولم يبدأ تشغيلها بعد. تُحل الإدخالات التي مُسحت باعتبارها متخطاة، بحيث يمكن لمنطق الاستجابة اللاحقة المتابعة دون انتظار صوت لن يتم تشغيله أبدًا.
- تستخدم محادثات الصوت الفوري دور الافتتاح الخاص بالتدفّق الفوري نفسه. لا ينشر Voice Call تحديث TwiML قديمًا من نوع `<Say>` لتلك الرسالة الأولية، لذلك تظل جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة سماح انقطاع تدفّق Twilio

عندما ينقطع تدفّق وسائط Twilio، ينتظر Voice Call مدة **2000 ms** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعاد التدفّق الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُعاد تسجيل أي تدفّق بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## أداة حصاد المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى Webhook نهائيًا
أبدًا (على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية
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

عندما يكون وكيل أو نفق أمام Gateway، يعيد Plugin
بناء عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات
في ترويسات إعادة التوجيه الموثوقة:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  اسمح بالمضيفين من ترويسات إعادة التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  ثِق بترويسات إعادة التوجيه دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  لا تثق بترويسات إعادة التوجيه إلا عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- يتم تمكين **حماية إعادة تشغيل Webhook** لـ Twilio وPlivo. يتم الإقرار بطلبات Webhook الصالحة المعاد تشغيلها لكن يتم تخطي آثارها الجانبية.
- تتضمن أدوار محادثة Twilio رمزًا مميزًا لكل دور في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها أن تحقق دور نص معلّق أحدث.
- تُرفض طلبات Webhook غير المصادقة قبل قراءة الجسم عندما تكون ترويسات التوقيع المطلوبة من المزوّد مفقودة.
- يستخدم Webhook الخاص بـ voice-call ملف تعريف الجسم المشترك قبل المصادقة (64 KB / 5 ثوانٍ) بالإضافة إلى حد للطلبات الجارية لكل عنوان IP قبل التحقق من التوقيع.

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

عندما يكون Gateway قيد التشغيل بالفعل، تفوّض أوامر `voicecall` التشغيلية
إلى وقت تشغيل المكالمات الصوتية المملوك لـ Gateway بحيث لا يربط CLI خادم
webhook ثانيا. إذا لم يكن هناك Gateway يمكن الوصول إليه، تعود الأوامر إلى
وقت تشغيل CLI مستقل.

يقرأ `latency` ملف `calls.jsonl` من مسار التخزين الافتراضي للمكالمات الصوتية.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لقصر التحليل
على آخر N سجل (الافتراضي 200). يتضمن الخرج p50/p90/p99
لزمن انتقال الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء         | المعاملات                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يشحن هذا المستودع مستند Skills مطابقا في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة              | المعاملات                                 |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

لا يكون `dtmfSequence` صالحا إلا مع `mode: "conversation"`. ينبغي أن تستخدم
مكالمات وضع الإشعار `voicecall.dtmf` بعد وجود المكالمة إذا كانت تحتاج إلى
أرقام بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في إتاحة webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن يكون `webhook-exposure` أخضر. يفشل
`publicUrl` المكوّن أيضا عندما يشير إلى مساحة شبكة محلية أو خاصة، لأن شركة
الاتصال لا تستطيع معاودة الاتصال بهذه العناوين. لا تستخدم `localhost` أو
`127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو
`192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كقيمة `publicUrl`.

ترسل مكالمات Twilio الصادرة في وضع الإشعار `<Say>` TwiML الأولي مباشرة ضمن
طلب إنشاء المكالمة، لذلك لا تعتمد أول رسالة منطوقة على جلب Twilio لـ webhook
TwiML. يظل وجود webhook عام مطلوبا لاستدعاءات الحالة، ومكالمات المحادثة،
وDTMF قبل الاتصال، والتدفقات الفورية، والتحكم بالمكالمة بعد الاتصال.

استخدم مسارا عاما واحدا للإتاحة:

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

بعد تغيير التكوين، أعد تشغيل Gateway أو أعد تحميله، ثم شغّل:

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

يجب أن توجد بيانات الاعتماد على مضيف Gateway. لا يؤثر تحرير ملف تعريف shell
محلي في Gateway قيد التشغيل بالفعل حتى يعيد تشغيله أو يعيد تحميل بيئته.

### تبدأ المكالمات لكن webhooks المزوّد لا تصل

تأكد من أن وحدة تحكم المزوّد تشير إلى عنوان URL العام الدقيق لـ webhook:

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
- يمرر وكيل الطلب لكنه يزيل أو يعيد كتابة ترويسات المضيف/البروتوكول.
- يوجّه الجدار الناري أو DNS اسم المضيف العام إلى مكان غير Gateway.
- أُعيد تشغيل Gateway من دون تمكين Plugin المكالمات الصوتية.

عندما يكون وكيل عكسي أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود الوكيل تحت
سيطرتك.

### فشل التحقق من التوقيع

تُفحص توقيعات المزوّد مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التوقيعات:

- تأكد من أن عنوان URL الخاص بـ webhook لدى المزوّد يطابق `publicUrl` تماما، بما في ذلك
  المخطط والمضيف والمسار.
- بالنسبة إلى عناوين URL في الطبقة المجانية من ngrok، حدّث `publicUrl` عندما يتغير اسم مضيف النفق.
- تأكد من أن الوكيل يحافظ على ترويسات المضيف والبروتوكول الأصلية، أو كوّن
  `webhookSecurity.allowedHosts`.
- لا تفعّل `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمام Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin لانضمامات الاتصال الهاتفي عبر Twilio. تحقق أولا من المكالمات الصوتية:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق صراحة من نقل Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كانت المكالمات الصوتية سليمة لكن مشارك Meet لا ينضم أبدا، فتحقق من رقم
الاتصال الهاتفي لـ Meet، ورقم PIN، و`--dtmf-sequence`. يمكن أن تكون المكالمة الهاتفية
سليمة بينما يرفض الاجتماع تسلسل DTMF غير صحيح أو يتجاهله.

يمرر Google Meet تسلسل DTMF الخاص بـ Meet ونص المقدمة إلى `voicecall.start`.
بالنسبة إلى مكالمات Twilio، يقدم Voice Call أولا DTMF TwiML، ثم يعيد التوجيه إلى
webhook، ثم يفتح تدفق الوسائط الفوري بحيث تُنشأ المقدمة المحفوظة
بعد انضمام مشارك الهاتف إلى الاجتماع.

استخدم `openclaw logs --follow` لتتبع المرحلة المباشرة. يسجل انضمام Twilio Meet
السليم هذا الترتيب:

- يفوض Google Meet انضمام Twilio إلى Voice Call.
- يخزن Voice Call ‏DTMF TwiML قبل الاتصال.
- يُستهلك Twilio TwiML الأولي ويُقدّم قبل المعالجة الفورية.
- يقدّم Voice Call ‏TwiML الفوري لمكالمة Twilio.
- يبدأ الجسر الفوري مع وضع التحية الأولية في قائمة الانتظار.

لا يزال `openclaw voicecall tail` يعرض سجلات المكالمات المحفوظة؛ وهو مفيد
لحالة المكالمات والنصوص، لكن لا تظهر فيه كل انتقالات webhook/الفورية.

### مكالمة فورية بلا كلام

تأكد من تمكين وضع صوت واحد فقط. لا يمكن أن يكون `realtime.enabled` و
`streaming.enabled` كلاهما true.

بالنسبة إلى مكالمات Twilio الفورية، تحقق أيضا من الآتي:

- تم تحميل Plugin مزوّد فوري وتسجيله.
- `realtime.provider` غير مضبوط أو يسمي مزودا مسجلا.
- مفتاح API الخاص بالمزوّد متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML الفوري، وبدء الجسر الفوري،
  ووضع التحية الأولية في قائمة الانتظار.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [تنبيه صوتي](/ar/nodes/voicewake)
