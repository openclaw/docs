---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بتكوين أو تطوير Plugin المكالمات الصوتية
    - تحتاج إلى الصوت في الوقت الفعلي أو التفريغ النصي المتدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: أجرِ مكالمات صوتية صادرة واقبل مكالمات صوتية واردة عبر Twilio أو Telnyx أو Plivo، مع صوت في الوقت الفعلي ونسخ نصي متدفق اختياريين
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-05-02T21:01:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الأدوار، والصوت الفوري ثنائي الاتجاه بالكامل، والتفريغ النصي المتدفق،
والمكالمات الواردة مع سياسات قائمة السماح.

**الموفرون الحاليون:** `twilio` (Programmable Voice + Media Streams)،
`telnyx` (Call Control v2)، `plivo` (Voice API + XML transfer + GetInput
speech)، `mock` (تطوير/بلا شبكة).

<Note>
يعمل Voice Call Plugin **داخل عملية Gateway**. إذا كنت تستخدم Gateway
بعيدا، فثبّت Plugin وهيئه على الجهاز الذي يشغل
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

    إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فإن إصدار الحزمة هذا
    يعود إلى مسار حزم خارجي أقدم؛ استخدم بناء OpenClaw
    محزما حاليا أو مسار المجلد المحلي إلى أن تُنشر حزمة npm أحدث.

    أعد تشغيل Gateway بعد ذلك حتى يُحمّل Plugin.

  </Step>
  <Step title="هيئ الموفر وWebhook">
    اضبط التكوين ضمن `plugins.entries.voice-call.config` (راجع
    [التكوين](#configuration) أدناه للاطلاع على البنية الكاملة). الحد الأدنى:
    `provider`، وبيانات اعتماد الموفر، و`fromNumber`، وعنوان URL لـ Webhook
    يمكن الوصول إليه علنا.
  </Step>
  <Step title="تحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    ```

    يكون الإخراج الافتراضي قابلا للقراءة في سجلات الدردشة والطرفيات. يتحقق من
    تمكين Plugin، وبيانات اعتماد الموفر، وإتاحة Webhook، وأن
    نمط صوت واحدا فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للبرامج النصية.

  </Step>
  <Step title="اختبار دخان">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيلان تجريبيان افتراضيا. أضف `--yes` لإجراء مكالمة إشعار
    صادرة قصيرة فعليا:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن ينتهي الإعداد إلى **عنوان URL عام لـ Webhook**.
إذا كان `publicUrl` أو عنوان URL للنفق أو عنوان URL لـ Tailscale أو بديل الخدمة
ينتهي إلى loopback أو مساحة شبكة خاصة، فسيفشل الإعداد بدلا من
بدء موفر لا يستطيع تلقي Webhookات شركة الاتصالات.
</Warning>

## التكوين

إذا كانت `enabled: true` لكن الموفر المحدد يفتقد بيانات الاعتماد،
فسيسجل بدء تشغيل Gateway تحذيرا بأن الإعداد غير مكتمل مع المفاتيح الناقصة،
ويتخطى بدء وقت التشغيل. تظل الأوامر واستدعاءات RPC وأدوات الوكيل
تعيد تكوين الموفر الناقص نفسه عند استخدامها.

<Note>
تقبل بيانات اعتماد Voice-call مراجع SecretRef. تُحل `plugins.entries.voice-call.config.twilio.authToken` و`plugins.entries.voice-call.config.realtime.providers.*.apiKey` و`plugins.entries.voice-call.config.streaming.providers.*.apiKey` و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر سطح SecretRef القياسي؛ راجع [سطح بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
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
  <Accordion title="ملاحظات إتاحة الموفر وأمانه">
    - تتطلب Twilio وTelnyx وPlivo كلها عنوان URL لـ Webhook **يمكن الوصول إليه علنا**.
    - `mock` موفر تطوير محلي (بلا استدعاءات شبكة).
    - يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
    - `skipSignatureVerification` مخصص للاختبار المحلي فقط.
    - في طبقة ngrok المجانية، اضبط `publicUrl` على عنوان URL الدقيق لـ ngrok؛ يتم فرض التحقق من التوقيع دائما.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhookات Twilio ذات التواقيع غير الصالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - قد تتغير عناوين URL للطبقة المجانية من Ngrok أو تضيف سلوكا وسيطا؛ إذا انحرف `publicUrl`، تفشل تواقيع Twilio. للإنتاج: فضّل نطاقا مستقرا أو قناة Tailscale funnel.

  </Accordion>
  <Accordion title="حدود اتصالات البث">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل أبدا إطار `start` صالحا.
    - يحد `streaming.maxPendingConnections` من إجمالي مقابس ما قبل البدء غير المصادق عليها.
    - يحد `streaming.maxPendingConnectionsPerIp` من مقابس ما قبل البدء غير المصادق عليها لكل IP مصدر.
    - يحد `streaming.maxConnections` من إجمالي مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات التكوين القديمة">
    يعيد `openclaw doctor --fix` كتابة التكوينات الأقدم التي تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة ضمن
    `streaming.*`.
    لا يزال بديل وقت التشغيل يقبل مفاتيح voice-call القديمة حاليا، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح البث التي تُرحّل تلقائيا:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## نطاق الجلسة

افتراضيا، يستخدم Voice Call ‏`sessionScope: "per-phone"` بحيث تحتفظ المكالمات المتكررة من
المتصل نفسه بذاكرة المحادثة. اضبط `sessionScope: "per-call"` عندما
ينبغي أن تبدأ كل مكالمة شركة اتصالات بسياق جديد، مثل مسارات الاستقبال،
أو الحجز، أو IVR، أو جسر Google Meet حيث قد
يمثل رقم الهاتف نفسه اجتماعات مختلفة.

## محادثات صوتية فورية

يحدد `realtime` موفر صوت فوري ثنائي الاتجاه بالكامل لصوت المكالمة
المباشر. وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
موفري التفريغ النصي الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر نمط
صوت واحدا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لتدفقات وسائط Twilio.
- `realtime.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول موفر صوت فوري مسجل.
- موفرو الصوت الفوري المضمنون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويسجلهم Plugins الموفر الخاصة بهم.
- يعيش التكوين الخام المملوك للموفر ضمن `realtime.providers.<providerId>`.
- يكشف Voice Call أداة `openclaw_agent_consult` الفورية المشتركة افتراضيا. يمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل تفكيرا أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- يكون `realtime.fastContext.enabled` معطلا افتراضيا. عند تمكينه، يبحث Voice Call أولا في ذاكرة/سياق الجلسة المفهرس عن سؤال الاستشارة ويعيد تلك المقاطع إلى النموذج الفوري ضمن `realtime.fastContext.timeoutMs` قبل الرجوع إلى وكيل الاستشارة الكامل فقط إذا كانت `realtime.fastContext.fallbackToConsult` تساوي true.
- إذا أشار `realtime.provider` إلى موفر غير مسجل، أو لم يكن أي موفر صوت فوري مسجلا على الإطلاق، فسيسجل Voice Call تحذيرا ويتخطى الوسائط الفورية بدلا من إفشال Plugin بأكمله.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة المكالمة المخزنة عند توفرها، ثم ترجع إلى `sessionScope` المكوّن (`per-phone` افتراضيا، أو `per-call` للمكالمات المعزولة).

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | يكشف أداة الاستشارة ويقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | يكشف أداة الاستشارة ويسمح للوكيل العادي باستخدام سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا يكشف أداة الاستشارة. لا تزال `realtime.tools` المخصصة تمرر إلى الموفر الفوري.                               |

### أمثلة موفري الصوت الفوري

<Tabs>
  <Tab title="Google Gemini Live">
    الإعدادات الافتراضية: مفتاح API من `realtime.providers.google.apiKey`،
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

يحدد `streaming` موفر تفريغ نصي فوريا لصوت المكالمة المباشر.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول مزوّد مسجّل للنسخ الفوري.
- مزوّدو النسخ الفوري المضمّنون: Deepgram (`deepgram`)، وElevenLabs (`elevenlabs`)، وMistral (`mistral`)، وOpenAI (`openai`)، وxAI (`xai`)، ويسجّلها كلٌّ من Plugin المزوّد الخاص به.
- توجد الإعدادات الخام المملوكة للمزوّد تحت `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لبث مقبول، يسجّل Voice Call البث فورًا، ويضع الوسائط الواردة في صف الانتظار عبر مزوّد النسخ بينما يتصل المزوّد، ويبدأ التحية الأولية فقط بعد أن يصبح النسخ الفوري جاهزًا.
- إذا كان `streaming.provider` يشير إلى مزوّد غير مسجّل، أو لم يكن هناك أي مزوّد مسجّل، يسجّل Voice Call تحذيرًا ويتجاوز بث الوسائط بدلًا من إفشال Plugin بالكامل.

### أمثلة مزوّدي البث

<Tabs>
  <Tab title="OpenAI">
    الافتراضيات: مفتاح API ‏`streaming.providers.openai.apiKey` أو
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
    الافتراضيات: مفتاح API ‏`streaming.providers.xai.apiKey` أو `XAI_API_KEY`؛
    نقطة النهاية `wss://api.x.ai/v1/stt`؛ الترميز `mulaw`؛ معدّل العينة `8000`؛
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
الكلام في المكالمات. يمكنك تجاوزها ضمن إعدادات Plugin بالشكل
**نفسه** — إذ تُدمَج دمجًا عميقًا مع `messages.tts`.

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
لا يوفّر نقل Microsoft الحالي خرج PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- يتم إصلاح مفاتيح `tts.<provider>` القديمة داخل إعدادات Plugin (`openai`، و`elevenlabs`، و`microsoft`، و`edge`) بواسطة `openclaw doctor --fix`؛ يجب أن تستخدم الإعدادات الملتزم بها `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تمكين بث وسائط Twilio؛ وإلا تعود المكالمات إلى الأصوات الأصلية الخاصة بالمزوّد.
- إذا كان بث وسائط Twilio نشطًا بالفعل، لا يعود Voice Call إلى TwiML ‏`<Say>`. إذا لم يكن TTS الهاتفي متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من خلط مساري تشغيل.
- عندما يعود TTS الهاتفي إلى مزوّد ثانوي، يسجّل Voice Call تحذيرًا مع سلسلة المزوّدين (`from`، و`to`، و`attempts`) لتسهيل التصحيح.
- عندما يؤدي اقتحام Twilio أو تفكيك البث إلى مسح قائمة انتظار TTS المعلّقة، تتم تسوية طلبات التشغيل الموضوعة في الصف بدلًا من تعليق المتصلين بانتظار اكتمال التشغيل.

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
  <Tab title="التجاوز إلى ElevenLabs (للمكالمات فقط)">
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
`inboundPolicy: "allowlist"` هي شاشة معرّف متصل منخفضة الضمان. يقوم
Plugin بتطبيع قيمة `From` التي يوفّرها المزوّد ومقارنتها مع
`allowFrom`. يثبت تحقق Webhook صحة تسليم المزوّد
وسلامة الحمولة، لكنه **لا** يثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كترشيح لمعرّف المتصل، وليس كهوية متصل
قوية.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`،
و`responseSystemPrompt`، و`responseTimeoutMs`.

### التوجيه حسب الرقم

استخدم `numbers` عندما يتلقى Plugin واحد من Voice Call مكالمات لعدة أرقام هاتف
ويجب أن يتصرف كل رقم كأنه خط مختلف. على سبيل المثال، يمكن لرقم
أن يستخدم مساعدًا شخصيًا بأسلوب غير رسمي بينما يستخدم رقم آخر شخصية تجارية
ووكيل استجابة مختلفًا وصوت TTS مختلفًا.

تُختار المسارات من رقم `To` المطلوب الذي يوفّره المزوّد. يجب أن تكون المفاتيح
أرقام E.164. عند وصول مكالمة، يحل Voice Call المسار المطابق مرة واحدة،
ويخزّن المسار المطابق في سجل المكالمة، ويعيد استخدام ذلك الإعداد الفعّال
للتحية، ومسار الرد التلقائي الكلاسيكي، ومسار الاستشارة الفورية، وتشغيل TTS.
إذا لم يطابق أي مسار، تُستخدم إعدادات Voice Call العامة.
لا تستخدم المكالمات الصادرة `numbers`؛ مرّر هدف الصادر والرسالة
والجلسة صراحة عند بدء المكالمة.

تدعم تجاوزات المسارات حاليًا:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تُدمَج قيمة المسار `tts` دمجًا عميقًا فوق إعدادات `tts` العامة في Voice Call، لذا
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

بالنسبة للردود التلقائية، يلحق Voice Call عقد مخرجات منطوقة صارمًا
بموجّه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بطريقة دفاعية:

- يتجاهل الحمولات المعلّمة كمحتوى تفكير/خطأ.
- يحلّل JSON مباشرًا، أو JSON داخل سياج، أو مفاتيح `"spoken"` مضمّنة.
- يعود إلى النص العادي ويزيل الفقرات الاستهلالية المحتملة الخاصة بالتخطيط/البيانات الوصفية.

يبقي ذلك التشغيل الصوتي مركّزًا على النص الموجّه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة لمكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى
بحالة التشغيل الحية:

- لا يتم كبت مسح قائمة انتظار الاقتحام والرد التلقائي إلا أثناء نطق التحية الأولية بنشاط.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في الصف لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث دون تأخير إضافي.
- يوقف الاقتحام التشغيل النشط ويمسح إدخالات TTS الخاصة بـ Twilio الموضوعة في الصف والتي لم يبدأ تشغيلها بعد. تُحل الإدخالات التي تم مسحها كمتخطاة، حتى يتمكن منطق الاستجابة اللاحقة من المتابعة دون انتظار صوت لن يُشغّل أبدًا.
- تستخدم محادثات الصوت الفورية الدور الافتتاحي الخاص بالبث الفوري. لا ينشر Voice Call تحديث TwiML قديمًا عبر `<Say>` لتلك الرسالة الأولية، لذا تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة سماح قطع اتصال بث Twilio

عند قطع اتصال بث وسائط Twilio، ينتظر Voice Call مدة **2000 ms** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعاد البث الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُعاد تسجيل أي بث بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## منظّف المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى Webhook نهائيًا
(على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية
هي `0` (معطّل).

النطاقات الموصى بها:

- **الإنتاج:** `120`–`300` ثانية لتدفقات نمط الإشعار.
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

عندما يكون وكيل عكسي أو نفق أمام Gateway، يعيد Plugin
بناء عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات
في الرؤوس المُمرّرة التي يتم الوثوق بها:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  اسمح بالمضيفين من رؤوس التمرير.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  ثق بالرؤوس المُمرّرة دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  لا تثق بالرؤوس المُمرّرة إلا عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- يتم تمكين **الحماية من إعادة تشغيل Webhook** لـ Twilio وPlivo. يتم الإقرار بطلبات Webhook الصالحة المعاد تشغيلها، لكنها تُتجاوز من حيث الآثار الجانبية.
- تتضمن أدوار محادثة Twilio رمزًا لكل دور في استدعاءات `<Gather>`، لذا لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها أن تلبي دور نسخة معلّق أحدث.
- تُرفض طلبات Webhook غير المصادقة قبل قراءة الجسم عندما تكون رؤوس التوقيع المطلوبة من المزوّد مفقودة.
- يستخدم Webhook الخاص بـ voice-call ملف تعريف الجسم المشترك قبل المصادقة (64 KB / 5 ثوانٍ) بالإضافة إلى حد أقصى للطلبات الجارية لكل IP قبل التحقق من التوقيع.

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
إلى وقت تشغيل voice-call المملوك لـ Gateway حتى لا يربط CLI خادم Webhook
ثانيًا. إذا لم يكن أي Gateway قابلًا للوصول، تعود الأوامر إلى
وقت تشغيل CLI مستقل.

`latency` يقرأ `calls.jsonl` من مسار تخزين مكالمات الصوت الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لحصر
التحليل في آخر N سجل (الافتراضي 200). يتضمن الخرج p50/p90/p99
لزمن انتقال الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء        | الوسيطات                                  |
| -------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يشحن هذا المستودع مستند مهارة مطابقًا في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة              | الوسيطات                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

يكون `dtmfSequence` صالحًا فقط مع `mode: "conversation"`. يجب على مكالمات وضع الإشعار
استخدام `voicecall.dtmf` بعد وجود المكالمة إذا احتاجت إلى أرقام بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في كشف Webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن يكون `webhook-exposure` أخضر. يفشل
`publicUrl` المُعدّ أيضًا عندما يشير إلى مساحة شبكة محلية أو خاصة،
لأن شركة الاتصالات لا تستطيع إعادة الاتصال بتلك العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x`
أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كـ `publicUrl`.

ترسل مكالمات Twilio الصادرة في وضع الإشعار TwiML الأولي الخاص بـ `<Say>` مباشرةً في
طلب إنشاء المكالمة، لذلك لا تعتمد أول رسالة منطوقة على جلب Twilio لـ TwiML من Webhook.
لا يزال Webhook عام مطلوبًا لاستدعاءات الحالة، ومكالمات المحادثة، وDTMF قبل الاتصال،
والبثوث الفورية، والتحكم بالمكالمة بعد الاتصال.

استخدم مسار كشف عام واحدًا:

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

يجب أن تكون بيانات الاعتماد موجودة على مضيف Gateway. لا يؤثر تعديل ملف تعريف shell محلي
في Gateway قيد التشغيل بالفعل حتى يُعاد تشغيله أو يُعاد تحميل
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
- يمرر الوكيل الطلب لكنه يزيل أو يعيد كتابة ترويسات host/proto.
- يوجه الجدار الناري أو DNS اسم المضيف العام إلى مكان غير Gateway.
- أُعيد تشغيل Gateway من دون تمكين Plugin Voice Call.

عندما يكون وكيل عكسي أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود الوكيل تحت
تحكمك.

### فشل التحقق من التوقيع

تُفحص توقيعات المزوّد مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التوقيعات:

- تأكد من أن عنوان URL الخاص بـ Webhook لدى المزوّد يطابق `publicUrl` تمامًا، بما في ذلك
  المخطط، والمضيف، والمسار.
- بالنسبة إلى عناوين ngrok في الطبقة المجانية، حدّث `publicUrl` عندما يتغير اسم مضيف النفق.
- تأكد من أن الوكيل يحافظ على ترويسات المضيف والبروتوكول الأصلية، أو اضبط
  `webhookSecurity.allowedHosts`.
- لا تفعّل `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمامات Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin للانضمام عبر اتصال Twilio. تحقق أولًا من Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق من نقل Google Meet صراحةً:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كان Voice Call أخضر لكن مشارك Meet لا ينضم مطلقًا، فتحقق من
رقم الاتصال الهاتفي لـ Meet، ورقم PIN، و`--dtmf-sequence`. يمكن أن تكون المكالمة الهاتفية سليمة بينما
يرفض الاجتماع تسلسل DTMF غير صحيح أو يتجاهله.

يمرر Google Meet تسلسل DTMF الخاص بـ Meet ونص المقدمة إلى `voicecall.start`.
بالنسبة إلى مكالمات Twilio، يقدّم Voice Call TwiML الخاص بـ DTMF أولًا، ثم يعيد التوجيه إلى
Webhook، ثم يفتح بث الوسائط الفوري حتى تُنشأ المقدمة المحفوظة
بعد انضمام مشارك الهاتف إلى الاجتماع.

استخدم `openclaw logs --follow` لتتبع المرحلة المباشرة. يسجل انضمام Twilio Meet السليم
هذا الترتيب:

- يفوّض Google Meet انضمام Twilio إلى Voice Call.
- يخزن Voice Call ‏DTMF TwiML قبل الاتصال.
- يُستهلك TwiML الأولي من Twilio ويُقدَّم قبل المعالجة الفورية.
- يقدّم Voice Call ‏TwiML الفوري لمكالمة Twilio.
- يبدأ الجسر الفوري مع إدراج التحية الأولية في قائمة الانتظار.

لا يزال `openclaw voicecall tail` يعرض سجلات المكالمات المستمرة؛ وهو مفيد
لحالة المكالمة والنصوص، لكن لا يظهر كل انتقال Webhook/فوري
هناك.

### مكالمة فورية بلا كلام

تأكد من تمكين وضع صوت واحد فقط. لا يمكن أن يكون `realtime.enabled` و
`streaming.enabled` كلاهما صحيحين.

بالنسبة إلى مكالمات Twilio الفورية، تحقق أيضًا مما يلي:

- تم تحميل Plugin مزوّد فوري وتسجيله.
- `realtime.provider` غير مضبوط أو يحدد اسم مزوّد مسجل.
- مفتاح API للمزوّد متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML الفوري، وبدء الجسر الفوري،
  وإدراج التحية الأولية في قائمة الانتظار.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [التنبيه الصوتي](/ar/nodes/voicewake)
