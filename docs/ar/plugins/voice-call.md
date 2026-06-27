---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بتكوين Plugin المكالمات الصوتية أو تطويره
    - تحتاج إلى صوت في الوقت الفعلي أو نسخ تدفقي عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: إجراء مكالمات صوتية صادرة وقبول مكالمات صوتية واردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الفعلي والنسخ المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-06-27T18:21:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

المكالمات الصوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الجولات، والصوت الفوري ثنائي الاتجاه بالكامل، والنسخ
المتدفق، والمكالمات الواردة مع سياسات قوائم السماح.

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

    استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت
    إصدارًا محددًا بدقة فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

    أعد تشغيل Gateway بعد ذلك حتى يتم تحميل Plugin.

  </Step>
  <Step title="Configure provider and webhook">
    اضبط الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [التكوين](#configuration) أدناه للاطلاع على الشكل الكامل). كحد أدنى:
    `provider`، واعتمادات المزوّد، و`fromNumber`، وعنوان Webhook URL يمكن
    الوصول إليه علنًا.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    يكون الخرج الافتراضي مقروءًا في سجلات الدردشة والطرفيات. يتحقق من
    تفعيل Plugin، واعتمادات المزوّد، وإتاحة Webhook، وأن وضعًا صوتيًا
    واحدًا فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للبرامج النصية.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيل تجريبي بلا تنفيذ فعلي افتراضيًا. أضف `--yes` لإجراء
    مكالمة إشعار صادرة قصيرة فعليًا:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن ينتهي الإعداد إلى **عنوان Webhook URL عام**.
إذا انتهى `publicUrl` أو عنوان URL للنفق أو عنوان URL الخاص بـ Tailscale أو بديل
الخدمة إلى loopback أو مساحة شبكة خاصة، يفشل الإعداد بدلًا من
بدء مزوّد لا يستطيع تلقي Webhookات شركات الاتصال.
</Warning>

## التكوين

إذا كان `enabled: true` لكن المزوّد المحدد تنقصه الاعتمادات،
تسجل بداية تشغيل Gateway تحذيرًا بأن الإعداد غير مكتمل مع المفاتيح الناقصة
وتتخطى بدء وقت التشغيل. تظل الأوامر ونداءات RPC وأدوات الوكيل
تعيد تكوين المزوّد الناقص بدقة عند استخدامها.

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
                  openai: { speakerVoice: "alloy" },
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
    - تتطلب Twilio وTelnyx وPlivo جميعًا عنوان Webhook URL **يمكن الوصول إليه علنًا**.
    - `mock` مزوّد تطوير محلي (بلا نداءات شبكة).
    - يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` مضبوطة على true.
    - `skipSignatureVerification` مخصص للاختبار المحلي فقط.
    - في الطبقة المجانية من ngrok، اضبط `publicUrl` على عنوان URL الدقيق لـ ngrok؛ يتم فرض التحقق من التوقيع دائمًا.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhookات Twilio ذات التوقيعات غير الصالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن أن تتغير عناوين URL في الطبقة المجانية من Ngrok أو تضيف سلوك صفحات وسيطة؛ إذا انحرف `publicUrl`، تفشل توقيعات Twilio. للإنتاج: فضّل نطاقًا مستقرًا أو نفق Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - يغلق `streaming.preStartTimeoutMs` المقابس التي لا ترسل إطار `start` صالحًا أبدًا.
    - يحدد `streaming.maxPendingConnections` سقف إجمالي المقابس غير المصادق عليها قبل البدء.
    - يحدد `streaming.maxPendingConnectionsPerIp` سقف المقابس غير المصادق عليها قبل البدء لكل عنوان IP مصدر.
    - يحدد `streaming.maxConnections` سقف إجمالي مقابس بث الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="Legacy config migrations">
    تعيد `openclaw doctor --fix` كتابة التكوينات الأقدم التي تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة
    ضمن `streaming.*`.
    ما زال بديل وقت التشغيل يقبل مفاتيح المكالمات الصوتية القديمة حاليًا، لكن
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

افتراضيًا، تستخدم المكالمات الصوتية `sessionScope: "per-phone"` بحيث تحتفظ
المكالمات المتكررة من المتصل نفسه بذاكرة المحادثة. اضبط `sessionScope: "per-call"` عندما
ينبغي أن تبدأ كل مكالمة من شركة الاتصال بسياق جديد، مثل تدفقات الاستقبال
أو الحجز أو IVR أو جسر Google Meet حيث قد يمثّل رقم الهاتف نفسه
اجتماعات مختلفة.

تخزن المكالمات الصوتية مفاتيح الجلسات المولدة ضمن مساحة أسماء الوكيل المضبوطة
(`agent:<agentId>:voice:*`) بحيث تبقى ذاكرة المكالمات بعد توحيد مفاتيح جلسات
Gateway بعد إعادة التشغيل. تستخدم مفاتيح التكامل الصريحة الخام مساحة أسماء
الوكيل نفسها. يحافظ مفتاح `agent:<configuredAgentId>:*` القياسي على ذلك المالك،
وتحترم أسماؤه المستعارة الرئيسية `session.mainKey` في النواة والنطاق العام. تُنطَق
مدخلات `agent:*` الأجنبية أو المشوهة كمفتاح مبهم ضمن الوكيل المضبوط؛ وتبقى
`global` و`unknown` حارسين عامين. ترقّي بداية تشغيل Gateway المفاتيح الخام الأقدم
في المخازن الافتراضية أو المخازن ذات قالب `{agentId}` عندما يثبت المسار مالكًا
واحدًا. في المخازن المخصصة الثابتة، تبقى الصفوف القديمة الملتبسة بلا تغيير لأنها
لا تحتوي على معلومات كافية لاختيار مالك؛ وتستخدم المكالمات الجديدة سجلًا
قياسيًا بنطاق الوكيل.

## محادثات الصوت الفوري

يحدد `realtime` مزوّد صوت فوري ثنائي الاتجاه بالكامل لصوت المكالمات
المباشرة. وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
مزوّدي النسخ الفوري.

<Warning>
لا يمكن دمج `realtime.enabled` مع `streaming.enabled`. اختر وضعًا
صوتيًا واحدًا لكل مكالمة.
</Warning>

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لـ Twilio Media Streams.
- `realtime.provider` اختياري. إذا لم يُضبط، تستخدم المكالمات الصوتية أول مزوّد صوت فوري مسجل.
- مزوّدو الصوت الفوري المضمّنون: Google Gemini Live (`google`) وOpenAI (`openai`)، ويسجلهم Pluginات المزوّدين الخاصة بهم.
- يعيش التكوين الخام المملوك للمزوّد ضمن `realtime.providers.<providerId>`.
- تعرض المكالمات الصوتية أداة `openclaw_agent_consult` الفورية المشتركة افتراضيًا. يستطيع النموذج الفوري استدعاءها عندما يطلب المتصل تفكيرًا أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- يضيف `realtime.consultPolicy` اختياريًا إرشادًا حول متى ينبغي للنموذج الفوري استدعاء `openclaw_agent_consult`.
- يكون `realtime.agentContext.enabled` متوقفًا افتراضيًا. عند تفعيله، تحقن المكالمات الصوتية هوية وكيل محدودة وكبسولة ملفات مساحة عمل مختارة في تعليمات المزوّد الفوري عند إعداد الجلسة.
- يكون `realtime.fastContext.enabled` متوقفًا افتراضيًا. عند تفعيله، تبحث المكالمات الصوتية أولًا في الذاكرة المفهرسة/سياق الجلسة عن سؤال الاستشارة وتعيد تلك المقتطفات إلى النموذج الفوري ضمن `realtime.fastContext.timeoutMs` قبل الرجوع إلى وكيل الاستشارة الكامل فقط إذا كانت `realtime.fastContext.fallbackToConsult` مضبوطة على true.
- إذا أشار `realtime.provider` إلى مزوّد غير مسجل، أو لم يكن أي مزوّد صوت فوري مسجلًا على الإطلاق، تسجل المكالمات الصوتية تحذيرًا وتتخطى الوسائط الفورية بدلًا من إفشال Plugin بأكمله.
- تعيد مفاتيح جلسات الاستشارة استخدام جلسة المكالمة المخزنة عندما تكون متاحة، ثم ترجع إلى `sessionScope` المضبوط (`per-phone` افتراضيًا، أو `per-call` للمكالمات المعزولة).

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة           | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | اعرض أداة الاستشارة واقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | اعرض أداة الاستشارة ودع الوكيل العادي يستخدم سياسة أدوات الوكيل العادية.                                                      |
| `none`           | لا تعرض أداة الاستشارة. ما زال يتم تمرير `realtime.tools` المخصصة إلى المزوّد الفوري.                               |

يتحكم `realtime.consultPolicy` في تعليمات النموذج الفوري فقط:

| السياسة        | الإرشاد                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | أبقِ الموجّه الافتراضي ودع المزوّد يقرر متى يستدعي أداة الاستشارة.              |
| `substantive` | أجب عن وصلات المحادثة البسيطة مباشرة واستشر قبل الحقائق أو الذاكرة أو الأدوات أو السياق. |
| `always`      | استشر قبل كل إجابة ذات مضمون.                                                        |

### سياق صوت الوكيل

فعّل `realtime.agentContext` عندما يجب أن يبدو جسر الصوت مثل وكيل OpenClaw
المكوّن من دون دفع تكلفة رحلة ذهاب وإياب كاملة لاستشارة الوكيل في
الدورات العادية. تُضاف كبسولة السياق مرة واحدة عند إنشاء جلسة الوقت الفعلي،
لذلك لا تضيف زمن انتقال لكل دورة. ما تزال استدعاءات
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

### أمثلة موفري الوقت الفعلي

<Tabs>
  <Tab title="Google Gemini Live">
    القيم الافتراضية: مفتاح API من `realtime.providers.google.apiKey`،
    أو `GEMINI_API_KEY`، أو `GOOGLE_GENERATIVE_AI_API_KEY`؛ النموذج
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ الصوت `Kore`.
    يكون `sessionResumption` و`contextWindowCompression` مفعّلين افتراضيًا للمكالمات الأطول
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
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
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

راجع [موفر Google](/ar/providers/google) و
[موفر OpenAI](/ar/providers/openai) للاطلاع على خيارات الصوت في الوقت الفعلي
الخاصة بالموفر.

## النسخ النصي المتدفق

يحدد `streaming` موفر نسخ نصي في الوقت الفعلي لصوت المكالمات المباشرة.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول موفر نسخ نصي في الوقت الفعلي مسجل.
- موفرو النسخ النصي في الوقت الفعلي المضمّنون: Deepgram (`deepgram`)، وElevenLabs (`elevenlabs`)، وMistral (`mistral`)، وOpenAI (`openai`)، وxAI (`xai`)، وتُسجلهم Plugins موفريهم.
- توجد تهيئة الموفر الخام التي يملكها الموفر تحت `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لتدفق مقبول، يسجل Voice Call التدفق فورًا، ويضع الوسائط الواردة في قائمة انتظار عبر موفر النسخ النصي أثناء اتصال الموفر، ويبدأ التحية الأولية فقط بعد أن يصبح النسخ النصي في الوقت الفعلي جاهزًا.
- إذا كان `streaming.provider` يشير إلى موفر غير مسجل، أو لم يكن أي موفر مسجلًا، يسجل Voice Call تحذيرًا ويتخطى تدفق الوسائط بدلًا من إفشال Plugin بالكامل.

### أمثلة موفري التدفق

<Tabs>
  <Tab title="OpenAI">
    القيم الافتراضية: مفتاح API من `streaming.providers.openai.apiKey` أو
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
    القيم الافتراضية: مفتاح API من `streaming.providers.xai.apiKey` أو `XAI_API_KEY`؛
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
بالشكل **نفسه** — إذ تُدمج بعمق مع `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**يُتجاهل Microsoft speech في المكالمات الصوتية.** يحتاج صوت الاتصالات الهاتفية إلى PCM؛
لا يعرض نقل Microsoft الحالي إخراج PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- تُصلح `openclaw doctor --fix` مفاتيح `tts.<provider>` القديمة داخل تهيئة Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`)؛ ويجب أن تستخدم التهيئة الملتزم بها `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تفعيل تدفق وسائط Twilio؛ وإلا تعود المكالمات إلى أصوات الموفر الأصلية.
- إذا كان تدفق وسائط Twilio نشطًا بالفعل، فلا يعود Voice Call إلى TwiML `<Say>`. إذا لم يكن TTS الاتصالات الهاتفية متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من مزج مساري تشغيل.
- عندما يعود TTS الاتصالات الهاتفية إلى موفر ثانوي، يسجل Voice Call تحذيرًا بسلسلة الموفرين (`from`، `to`، `attempts`) لأغراض التصحيح.
- عندما يؤدي اقتحام Twilio أو تفكيك التدفق إلى مسح قائمة انتظار TTS المعلقة، تُسوّى طلبات التشغيل في قائمة الانتظار بدلًا من تعليق المتصلين المنتظرين اكتمال التشغيل.

### أمثلة TTS

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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
`inboundPolicy: "allowlist"` هي شاشة رقم متصل منخفضة الضمان. يقوم
Plugin بتطبيع قيمة `From` المقدمة من الموفر ومقارنتها بـ
`allowFrom`. تتحقق مصادقة Webhook من تسليم الموفر وسلامة
الحمولة، لكنها **لا** تثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كترشيح لرقم المتصل، وليس كهوية متصل قوية.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel` و
`responseSystemPrompt` و`responseTimeoutMs`.

### التوجيه لكل رقم

استخدم `numbers` عندما يتلقى Plugin Voice Call واحد مكالمات لأرقام هاتف متعددة
ويجب أن يتصرف كل رقم كخط مختلف. على سبيل المثال، يمكن أن يستخدم أحد
الأرقام مساعدًا شخصيًا عاديًا بينما يستخدم آخر شخصية أعمال،
ووكيل استجابة مختلفًا، وصوت TTS مختلفًا.

تُحدد المسارات من رقم `To` المطلوب الذي يقدمه الموفر. يجب أن تكون المفاتيح
أرقام E.164. عند وصول مكالمة، يحل Voice Call المسار المطابق مرة واحدة،
ويخزن المسار المطابق في سجل المكالمة، ويعيد استخدام تلك التهيئة الفعالة
للتحية، ومسار الرد التلقائي الكلاسيكي، ومسار الاستشارة في الوقت الفعلي، وتشغيل TTS.
إذا لم يطابق أي مسار، تُستخدم تهيئة Voice Call العامة.
لا تستخدم المكالمات الصادرة `numbers`؛ مرّر الهدف الصادر والرسالة
والجلسة صراحة عند بدء المكالمة.

تدعم تجاوزات المسارات حاليًا:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تُدمج قيمة مسار `tts` بعمق فوق تهيئة `tts` العامة لـ Voice Call، لذلك
يمكنك عادةً تجاوز صوت الموفر فقط:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### عقد الإخراج المنطوق

بالنسبة للردود التلقائية، يضيف Voice Call عقد إخراج منطوقًا صارمًا إلى
مطالبة النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات المعلّمة كمحتوى تفكير/خطأ.
- يحلل JSON مباشرًا، أو JSON داخل سياج، أو مفاتيح `"spoken"` المضمنة.
- يعود إلى النص العادي ويزيل الفقرات الافتتاحية المرجح أنها تخطيطية/وصفية.

يبقي هذا تشغيل الكلام مركزًا على النص الموجه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة لمكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة
التشغيل المباشر:

- لا يُكبت مسح قائمة انتظار الاقتحام والرد التلقائي إلا أثناء نطق التحية الأولية بنشاط.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتظل الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لتدفق Twilio عند اتصال التدفق من دون تأخير إضافي.
- يوقف الاقتحام التشغيل النشط ويمسح إدخالات Twilio TTS الموضوعة في قائمة الانتظار والتي لم يبدأ تشغيلها بعد. تُحل الإدخالات الممسوحة كمتخطاة، بحيث يمكن لمنطق الرد اللاحق المتابعة من دون انتظار صوت لن يُشغّل أبدًا.
- تستخدم محادثات الصوت في الوقت الفعلي الدور الافتتاحي الخاص بتدفق الوقت الفعلي. لا ينشر Voice Call تحديث TwiML `<Say>` قديمًا لتلك الرسالة الأولية، لذلك تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة سماح فصل تدفق Twilio

عند انقطاع تدفق وسائط Twilio، ينتظر Voice Call مدة **2000 مللي ثانية** قبل
إنهاء المكالمة تلقائيا:

- إذا أعاد التدفق الاتصال خلال هذه النافذة، يلغى الإنهاء التلقائي.
- إذا لم يعد أي تدفق للتسجيل بعد فترة السماح، تنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## منظف المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى Webhook
نهائيا (مثلا، مكالمات نمط الإشعار التي لا تكتمل أبدا). القيمة الافتراضية
هي `0` (معطل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات نمط الإشعار.
- أبق هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات العادية من الاكتمال. نقطة بدء جيدة هي `maxDurationSeconds + 30–60` ثانية.

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
في ترويسات إعادة التوجيه الموثوق بها:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  قائمة سماح للمضيفين من ترويسات إعادة التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  الوثوق بترويسات إعادة التوجيه دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  الوثوق بترويسات إعادة التوجيه فقط عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- **حماية إعادة تشغيل Webhook** مفعلة لـ Twilio وPlivo. يتم الإقرار بطلبات Webhook الصالحة المعاد تشغيلها لكن يتم تخطي آثارها الجانبية.
- تتضمن أدوار محادثة Twilio رمزا لكل دور في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة أو المعاد تشغيلها تلبية دور نص معلق أحدث.
- ترفض طلبات Webhook غير الموثقة قبل قراءة الجسم عندما تكون ترويسات التوقيع المطلوبة من المزود مفقودة.
- يستخدم Webhook الخاص بـ voice-call ملف جسم ما قبل المصادقة المشترك (64 كيلوبايت / 5 ثوان) إضافة إلى حد أقصى لكل IP للطلبات قيد التنفيذ قبل التحقق من التوقيع.

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

عندما يكون Gateway قيد التشغيل بالفعل، تفوض أوامر `voicecall` التشغيلية
إلى وقت تشغيل voice-call المملوك لـ Gateway حتى لا يربط CLI خادم Webhook ثانيا.
إذا لم يكن أي Gateway قابلا للوصول، تعود الأوامر إلى وقت تشغيل CLI مستقل.

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين voice-call الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لحصر
التحليل في آخر N سجلات (الافتراضي 200). يتضمن الإخراج p50/p90/p99
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

يشحن Plugin الخاص بـ voice-call مهارة وكيل مطابقة.

## RPC الخاص بـ Gateway

| الطريقة               | الوسائط                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

يكون `dtmfSequence` صالحا فقط مع `mode: "conversation"`. ينبغي لمكالمات نمط الإشعار
استخدام `voicecall.dtmf` بعد وجود المكالمة إذا احتاجت إلى أرقام بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في إتاحة Webhook

شغل الإعداد من البيئة نفسها التي تشغل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن يكون `webhook-exposure` أخضر. يفشل
`publicUrl` المكون إذا كان يشير إلى مساحة شبكة محلية أو خاصة، لأن شركة الاتصالات
لا تستطيع معاودة الاتصال بهذه العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو
`192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كقيمة `publicUrl`.

ترسل مكالمات Twilio الصادرة بنمط الإشعار رسالة `<Say>` الأولى من TwiML مباشرة في
طلب إنشاء المكالمة، لذلك لا تعتمد أول رسالة منطوقة على جلب Twilio
لـ TwiML الخاص بـ Webhook. يظل Webhook عام مطلوبا لاستدعاءات الحالة،
ومكالمات المحادثة، وDTMF قبل الاتصال، والتدفقات الفورية، والتحكم في المكالمة
بعد الاتصال.

استخدم مسار إتاحة عام واحدا:

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

بعد تغيير التكوين، أعد تشغيل Gateway أو أعد تحميله، ثم شغل:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

يكون `voicecall smoke` تشغيلا تجريبيا جافا ما لم تمرر `--yes`.

### فشل بيانات اعتماد المزود

تحقق من المزود المحدد وحقول بيانات الاعتماد المطلوبة:

- Twilio: `twilio.accountSid` و`twilio.authToken` و`fromNumber`، أو
  `TWILIO_ACCOUNT_SID` و`TWILIO_AUTH_TOKEN` و`TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey` و`telnyx.connectionId` و`telnyx.publicKey` و
  `fromNumber`.
- Plivo: `plivo.authId` و`plivo.authToken` و`fromNumber`.

يجب أن تكون بيانات الاعتماد موجودة على مضيف Gateway. لا يؤثر تحرير ملف تعريف
صدفة محلية في Gateway قيد التشغيل بالفعل حتى يعاد تشغيله أو يعيد تحميل
بيئته.

### تبدأ المكالمات لكن Webhooks المزود لا تصل

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

أسباب شائعة:

- يشير `publicUrl` إلى مسار مختلف عن `serve.path`.
- تغير عنوان URL الخاص بالنفق بعد بدء Gateway.
- يمرر وكيل الطلب لكنه يزيل أو يعيد كتابة ترويسات المضيف/البروتوكول.
- يوجه الجدار الناري أو DNS اسم المضيف العام إلى مكان غير Gateway.
- أعيد تشغيل Gateway دون تمكين Plugin الخاص بـ Voice Call.

عندما يكون وكيل عكسي أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما يكون حد الوكيل تحت
سيطرتك.

### فشل التحقق من التوقيع

تتحقق تواقيع المزود مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التواقيع:

- تأكد من أن عنوان URL الخاص بـ Webhook لدى المزود يطابق `publicUrl` تماما، بما في ذلك
  المخطط والمضيف والمسار.
- لعناوين URL من فئة ngrok المجانية، حدث `publicUrl` عندما يتغير اسم مضيف النفق.
- تأكد من أن الوكيل يحافظ على ترويسات المضيف والبروتوكول الأصلية، أو كون
  `webhookSecurity.allowedHosts`.
- لا تمكن `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمام Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin لانضمامات الاتصال الهاتفي عبر Twilio. تحقق أولا من Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق من نقل Google Meet صراحة:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كان Voice Call أخضر لكن مشارك Meet لا ينضم أبدا، فتحقق من رقم الاتصال
الهاتفي لـ Meet ورقم PIN و`--dtmf-sequence`. يمكن أن تكون المكالمة الهاتفية سليمة بينما
يرفض الاجتماع تسلسل DTMF غير صحيح أو يتجاهله.

يبدأ Google Meet ساق الهاتف عبر Twilio من خلال `voicecall.start` مع
تسلسل DTMF قبل الاتصال. تتضمن التسلسلات المشتقة من PIN قيمة
`voiceCall.dtmfDelayMs` الخاصة بـ Plugin Google Meet كأرقام انتظار Twilio بادئة. القيمة الافتراضية 12 ثانية
لأن مطالبات الاتصال الهاتفي في Meet قد تصل متأخرة. ثم يعيد Voice Call التوجيه إلى
المعالجة الفورية قبل طلب تحية المقدمة.

استخدم `openclaw logs --follow` لتتبع المرحلة الحية. يسجل انضمام Twilio Meet السليم
هذا الترتيب:

- يفوض Google Meet انضمام Twilio إلى Voice Call.
- يخزن Voice Call‏ TwiML الخاص بـ DTMF قبل الاتصال.
- يستهلك TwiML الأولي من Twilio ويقدم قبل المعالجة الفورية.
- يقدم Voice Call‏ TwiML فوريا لمكالمة Twilio.
- يطلب Google Meet كلام المقدمة باستخدام `voicecall.speak` بعد تأخير ما بعد DTMF.

لا يزال `openclaw voicecall tail` يعرض سجلات المكالمات المحفوظة؛ وهو مفيد
لحالة المكالمة والنصوص، لكن لا يظهر فيه كل انتقال Webhook/فوري.

### مكالمة فورية بلا كلام

تأكد من تمكين نمط صوت واحد فقط. لا يمكن أن يكون كل من `realtime.enabled` و
`streaming.enabled` صحيحا في الوقت نفسه.

بالنسبة إلى مكالمات Twilio الفورية، تحقق أيضا مما يلي:

- تم تحميل Plugin مزود فوري وتسجيله.
- `realtime.provider` غير مضبوط أو يسمي مزودا مسجلا.
- مفتاح API الخاص بالمزود متاح لعملية Gateway.
- يعرض `openclaw logs --follow` تقديم TwiML الفوري، وبدء الجسر الفوري،
  وإدراج التحية الأولية في قائمة الانتظار.

## ذات صلة

- [نمط المحادثة](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [التنبيه الصوتي](/ar/nodes/voicewake)
