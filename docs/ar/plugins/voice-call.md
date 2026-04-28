---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بإعداد Plugin المكالمات الصوتية أو تطويره
    - تحتاج إلى صوت فوري أو نسخ تدريجي للبث على الاتصالات الهاتفية
sidebarTitle: Voice call
summary: أجرِ مكالمات صوتية صادرة واستقبل المكالمات الواردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت الفوري والنسخ التدريجي للبث الصوتي
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-04-26T11:38:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة،
والمحادثات متعددة الأدوار، والصوت الفوري الكامل ثنائي الاتجاه، والنسخ
التدريجي للبث، والمكالمات الواردة مع سياسات قائمة السماح.

**الموفّرون الحاليون:** `twilio` ‏(Programmable Voice + Media Streams)،
و`telnyx` ‏(Call Control v2)، و`plivo` ‏(Voice API + XML transfer + GetInput
speech)، و`mock` ‏(للتطوير/من دون شبكة).

<Note>
يعمل Plugin المكالمات الصوتية **داخل عملية Gateway**. إذا كنت تستخدم
Gateway بعيدًا، فثبّت Plugin واضبطه على الجهاز الذي يشغّل
Gateway، ثم أعد تشغيل Gateway لتحميله.
</Note>

## البدء السريع

<Steps>
  <Step title="ثبّت Plugin">
    <Tabs>
      <Tab title="من npm (مستحسن)">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="من مجلد محلي (للتطوير)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    أعد تشغيل Gateway بعد ذلك حتى يتم تحميل Plugin.

  </Step>
  <Step title="اضبط الموفّر وWebhook">
    اضبط الإعدادات تحت `plugins.entries.voice-call.config` (راجع
    [الإعدادات](#configuration) أدناه للاطلاع على البنية الكاملة). كحد أدنى:
    `provider`، وبيانات اعتماد الموفّر، و`fromNumber`، وعنوان URL لـ Webhook
    يمكن الوصول إليه علنًا.
  </Step>
  <Step title="تحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    ```

    تكون المخرجات الافتراضية قابلة للقراءة في سجلات الدردشة والطرفيات. وهي تتحقق
    من تفعيل Plugin، وبيانات اعتماد الموفّر، وإتاحة Webhook للعامة، ومن أن
    وضعًا صوتيًا واحدًا فقط (`streaming` أو `realtime`) نشط. استخدم
    `--json` للسكريبتات.

  </Step>
  <Step title="اختبار smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيل تجريبي افتراضيًا. أضف `--yes` لإجراء
    مكالمة إشعار صادرة قصيرة فعلًا:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن يُحل الإعداد إلى **عنوان URL عام لـ Webhook**.
إذا كان `publicUrl`، أو عنوان URL الخاص بالنفق، أو عنوان URL الخاص بـ Tailscale، أو بديل
الخدمة يشير إلى local loopback أو إلى مساحة شبكة خاصة، يفشل الإعداد بدلًا من
بدء موفّر لا يمكنه استقبال Webhooks من شركة الاتصالات.
</Warning>

## الإعدادات

إذا كان `enabled: true` لكن الموفّر المحدد يفتقد إلى بيانات الاعتماد،
فإن بدء Gateway يسجّل تحذيرًا بأن الإعداد غير مكتمل مع المفاتيح المفقودة
ويتجاوز بدء بيئة التشغيل. ومع ذلك، لا تزال الأوامر واستدعاءات RPC وأدوات الوكيل
تعيد الإعداد المفقود الخاص بالموفّر بدقة عند استخدامها.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // أو "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // أو TWILIO_FROM_NUMBER لـ Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // المفتاح العام لـ Telnyx Webhook من Mission Control Portal
            // (Base64؛ ويمكن أيضًا ضبطه عبر TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // خادم Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // أمان Webhook (مستحسن للأنفاق/الوكلاء العكسيين)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // الإتاحة العامة (اختر واحدًا)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* راجع النسخ التدريجي للبث */ },
          realtime: { enabled: false /* راجع الصوت الفوري */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ملاحظات حول إتاحة الموفّر والأمان">
    - يتطلب كل من Twilio وTelnyx وPlivo **عنوان URL عامًا يمكن الوصول إليه** لـ Webhook.
    - `mock` هو موفّر تطوير محلي (من دون استدعاءات شبكة).
    - يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
    - `skipSignatureVerification` مخصص للاختبار المحلي فقط.
    - في المستوى المجاني من ngrok، اضبط `publicUrl` على عنوان URL الدقيق الخاص بـ ngrok؛ إذ يُفرض التحقق من التوقيع دائمًا.
    - يسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhooks من Twilio ذات التوقيعات غير الصالحة **فقط** عندما تكون `tunnel.provider="ngrok"` و`serve.bind` هي local loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - قد تتغير عناوين URL الخاصة بالمستوى المجاني من Ngrok أو تضيف سلوكًا وسيطًا؛ وإذا انحرف `publicUrl`، فسيفشل التحقق من توقيعات Twilio. في الإنتاج: يُفضَّل استخدام نطاق ثابت أو funnel عبر Tailscale.

  </Accordion>
  <Accordion title="حدود اتصالات البث">
    - يقوم `streaming.preStartTimeoutMs` بإغلاق المقابس التي لا ترسل إطار `start` صالحًا مطلقًا.
    - يضع `streaming.maxPendingConnections` حدًا إجماليًا للمقابس غير الموثقة قبل البدء.
    - يضع `streaming.maxPendingConnectionsPerIp` حدًا للمقابس غير الموثقة قبل البدء لكل عنوان IP مصدر.
    - يضع `streaming.maxConnections` حدًا إجماليًا للمقابس المفتوحة لتدفق الوسائط (المعلّقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات الإعدادات القديمة">
    تُعاد كتابة الإعدادات الأقدم التي تستخدم `provider: "log"`، أو `twilio.from`، أو مفاتيح OpenAI القديمة الخاصة بـ `streaming.*` بواسطة `openclaw doctor --fix`.
    ولا يزال البديل في بيئة التشغيل يقبل مفاتيح voice-call القديمة في الوقت الحالي، لكن
    مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق
    مؤقتة.

    مفاتيح البث التي تُرحَّل تلقائيًا:

    - `streaming.sttProvider` ← `streaming.provider`
    - `streaming.openaiApiKey` ← `streaming.providers.openai.apiKey`
    - `streaming.sttModel` ← `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` ← `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` ← `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## محادثات الصوت الفوري

يختار `realtime` موفّر صوت فوري كامل ثنائي الاتجاه للصوت المباشر
في المكالمات. وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
موفّري النسخ الفوري.

<Warning>
لا يمكن الجمع بين `realtime.enabled` و`streaming.enabled`. اختر
وضعًا صوتيًا واحدًا لكل مكالمة.
</Warning>

السلوك الحالي لبيئة التشغيل:

- `realtime.enabled` مدعوم لتدفقات الوسائط في Twilio.
- `realtime.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول موفّر صوت فوري مسجّل.
- موفّرو الصوت الفوري المضمّنون: Google Gemini Live ‏(`google`) وOpenAI ‏(`openai`)، ويُسجَّلون بواسطة Plugins الموفّرين الخاصة بهم.
- توجد إعدادات الموفّر الخام الخاصة به تحت `realtime.providers.<providerId>`.
- يعرّض Voice Call أداة `openclaw_agent_consult` الفورية المشتركة افتراضيًا. ويمكن للنموذج الفوري استدعاؤها عندما يطلب المتصل reasoning أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية.
- إذا كان `realtime.provider` يشير إلى موفّر غير مسجّل، أو لم يكن هناك أي موفّر صوت فوري مسجّل أصلًا، يسجّل Voice Call تحذيرًا ويتجاوز الوسائط الفورية بدلًا من إسقاط Plugin بالكامل.
- تعيد مفاتيح جلسة consult استخدام جلسة الصوت الحالية عند توفرها، ثم تعود إلى رقم هاتف المتصل/المتلقي حتى تحافظ استدعاءات consult اللاحقة على السياق أثناء المكالمة.

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل consult:

| السياسة          | السلوك                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | يعرض أداة consult ويقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | يعرض أداة consult ويتيح للوكيل العادي استخدام سياسة أدوات الوكيل العادية.                                                                     |
| `none`           | لا يعرّض أداة consult. ولا تزال `realtime.tools` المخصصة تمرَّر إلى الموفّر الفوري.                                                           |

### أمثلة على موفّري الصوت الفوري

<Tabs>
  <Tab title="Google Gemini Live">
    القيم الافتراضية: مفتاح API من `realtime.providers.google.apiKey`،
    أو `GEMINI_API_KEY`، أو `GOOGLE_GENERATIVE_AI_API_KEY`؛ والنموذج
    `gemini-2.5-flash-native-audio-preview-12-2025`؛ والصوت `Kore`.

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
                instructions: "تحدث بإيجاز. استدعِ openclaw_agent_consult قبل استخدام أدوات أعمق.",
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

راجع [موفّر Google](/ar/providers/google) و
[موفّر OpenAI](/ar/providers/openai) للاطلاع على خيارات
الصوت الفوري الخاصة بكل موفّر.

## النسخ التدريجي للبث

يختار `streaming` موفّر نسخ فوري للصوت المباشر في المكالمات.

السلوك الحالي لبيئة التشغيل:

- `streaming.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول موفّر نسخ فوري مسجّل.
- موفّرو النسخ الفوري المضمّنون: Deepgram ‏(`deepgram`) وElevenLabs ‏(`elevenlabs`) وMistral ‏(`mistral`) وOpenAI ‏(`openai`) وxAI ‏(`xai`)، ويُسجَّلون بواسطة Plugins الموفّرين الخاصة بهم.
- توجد إعدادات الموفّر الخام الخاصة به تحت `streaming.providers.<providerId>`.
- إذا كان `streaming.provider` يشير إلى موفّر غير مسجّل، أو لم يكن أي موفّر مسجّلًا، يسجّل Voice Call تحذيرًا ويتجاوز بث الوسائط بدلًا من إسقاط Plugin بالكامل.

### أمثلة على موفّري النسخ التدريجي

<Tabs>
  <Tab title="OpenAI">
    القيم الافتراضية: مفتاح API ‏`streaming.providers.openai.apiKey` أو
    `OPENAI_API_KEY`؛ والنموذج `gpt-4o-transcribe`؛ و`silenceDurationMs: 800`؛
    و`vadThreshold: 0.5`.

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
                    apiKey: "sk-...", // اختياري إذا كان OPENAI_API_KEY مضبوطًا
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
    ونقطة النهاية `wss://api.x.ai/v1/stt`؛ والترميز `mulaw`؛ ومعدل العينة `8000`؛
    و`endpointingMs: 800`؛ و`interimResults: true`.

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
                    apiKey: "${XAI_API_KEY}", // اختياري إذا كان XAI_API_KEY مضبوطًا
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

يستخدم Voice Call إعداد `messages.tts` الأساسي من أجل
بث الكلام في المكالمات. ويمكنك تجاوزه تحت إعدادات Plugin باستخدام
**البنية نفسها** — إذ يُدمَج دمجًا عميقًا مع `messages.tts`.

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
ولا يعرّض نقل Microsoft الحالي خرج PCM الخاص بالاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- تُصلَح مفاتيح `tts.<provider>` القديمة داخل إعدادات Plugin (`openai` و`elevenlabs` و`microsoft` و`edge`) بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم الإعدادات المعتمدة `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عندما يكون بث وسائط Twilio مفعّلًا؛ وإلا فتعود المكالمات إلى الأصوات الأصلية الخاصة بالموفّر.
- إذا كان بث وسائط Twilio نشطًا بالفعل، فلن يعود Voice Call إلى TwiML ‏`<Say>`. وإذا لم يكن TTS الخاص بالاتصالات الهاتفية متاحًا في هذه الحالة، يفشل طلب التشغيل بدلًا من مزج مساري تشغيل.
- عندما يعود TTS الخاص بالاتصالات الهاتفية إلى موفّر ثانوي، يسجّل Voice Call تحذيرًا مع سلسلة الموفّرين (`from` و`to` و`attempts`) لأغراض التصحيح.
- عندما يؤدي barge-in في Twilio أو إنهاء البث إلى مسح قائمة TTS المعلّقة، تُسوَّى طلبات التشغيل الموضوعة في القائمة بدلًا من ترك المتصلين معلّقين في انتظار اكتمال التشغيل.

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

تكون سياسة المكالمات الواردة افتراضيًا `disabled`. ولتفعيل المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "مرحبًا! كيف يمكنني المساعدة؟",
}
```

<Warning>
تمثل `inboundPolicy: "allowlist"` فحصًا منخفض الضمان لمعرّف المتصل. يقوم
Plugin بتطبيع قيمة `From` التي يوفّرها الموفّر ويقارنها مع
`allowFrom`. ويوثّق التحقق من Webhook تسليم الموفّر وسلامة
الحمولة، لكنه **لا** يثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` على أنه تصفية لمعرّف المتصل، وليس هوية قوية
للمتصل.
</Warning>

تستخدم الاستجابات التلقائية نظام الوكيل. ويمكن ضبطها باستخدام `responseModel`،
و`responseSystemPrompt`، و`responseTimeoutMs`.

### عقد المخرجات المنطوقة

بالنسبة إلى الاستجابات التلقائية، يضيف Voice Call عقدًا صارمًا للمخرجات المنطوقة إلى
موجّه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات التي تحمل علامة محتوى reasoning/error.
- يحلل JSON المباشر، أو JSON المحاط بسياج، أو مفاتيح `"spoken"` المضمنة.
- يعود إلى النص العادي ويزيل الفقرات التمهيدية التي يُرجَّح أنها تخطيط/بيانات وصفية.

وهذا يُبقي التشغيل المنطوق مركّزًا على النص الموجّه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة
التشغيل المباشر:

- لا يُمنع مسح قائمة barge-in والاستجابة التلقائية إلا عندما تكون التحية الأولية تُنطق فعليًا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في القائمة لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث من دون تأخير إضافي.
- يؤدي barge-in إلى إيقاف التشغيل النشط ومسح إدخالات TTS الخاصة بـ Twilio التي وُضعت في القائمة ولم تبدأ التشغيل بعد. وتُسوّى الإدخالات التي تمت إزالتها على أنها متخطاة، حتى يتمكن منطق الاستجابة اللاحقة من المتابعة من دون انتظار صوت لن يُشغّل أبدًا.
- تستخدم محادثات الصوت الفوري الدور الافتتاحي الخاص ببثها الفوري نفسه. لا ينشر Voice Call تحديث TwiML ‏`<Say>` قديمًا لتلك الرسالة الأولية، بحيث تبقى جلسات `<Connect><Stream>` الصادرة مرتبطة.

### مهلة السماح عند انقطاع بث Twilio

عند انقطاع بث وسائط Twilio، ينتظر Voice Call **2000 ms** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعاد البث الاتصال خلال هذه النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجَّل أي بث من جديد بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## منظف المكالمات الراكدة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدًا
Webhook نهائيًا (على سبيل المثال، المكالمات بوضع notify التي لا تكتمل أبدًا). القيمة الافتراضية
هي `0` ‏(معطّل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات بأسلوب notify.
- اجعل هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات العادية من الاكتمال. ونقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

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

عندما يكون وكيل أو نفق أمام Gateway، يقوم Plugin
بإعادة تكوين عنوان URL العام من أجل التحقق من التوقيع. وتتحكم هذه الخيارات
في رؤوس إعادة التوجيه الموثوق بها:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  قائمة سماح للمضيفين من رؤوس إعادة التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  ثق في الرؤوس المعاد توجيهها من دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  لا تثق في الرؤوس المعاد توجيهها إلا عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

وسائل حماية إضافية:

- تكون **الحماية من إعادة تشغيل** Webhook مفعّلة لكل من Twilio وPlivo. ويُقَرّ بطلبات Webhook الصالحة المعاد تشغيلها لكن تُتخطى آثارها الجانبية.
- تتضمن أدوار محادثات Twilio رمزًا مميزًا لكل دور في استدعاءات `<Gather>`، بحيث لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها أن تلبّي دورًا أحدث معلّقًا في السجل.
- تُرفض طلبات Webhook غير الموثقة قبل قراءة الجسم عندما تكون رؤوس التوقيع المطلوبة من الموفّر مفقودة.
- يستخدم Webhook الخاص بـ voice-call ملف الجسم المشترك قبل المصادقة (64 KB / 5 ثوانٍ) بالإضافة إلى حدّ لكل IP للطلبات قيد التنفيذ قبل التحقق من التوقيع.

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
openclaw voicecall start --to "+15555550123"   # اسم مستعار لـ call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # تلخيص كمون الأدوار من السجلات
openclaw voicecall expose --mode funnel
```

يقرأ `latency` ملف `calls.jsonl` من مسار التخزين الافتراضي الخاص بـ voice-call.
استخدم `--file <path>` للإشارة إلى سجل مختلف، و`--last <n>` لقصر
التحليل على آخر N من السجلات (الافتراضي 200). ويتضمن الناتج القيم p50/p90/p99
لكمون الأدوار وأزمنة انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء          | الوسائط                  |
| ---------------- | ------------------------ |
| `initiate_call`  | `message`, `to?`, `mode?` |
| `continue_call`  | `callId`, `message`      |
| `speak_to_user`  | `callId`, `message`      |
| `send_dtmf`      | `callId`, `digits`       |
| `end_call`       | `callId`                 |
| `get_status`     | `callId`                 |

يشحن هذا المستودع ملف مهارة مطابقًا في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة             | الوسائط                  |
| ------------------- | ------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`      |
| `voicecall.speak`    | `callId`, `message`      |
| `voicecall.dtmf`     | `callId`, `digits`       |
| `voicecall.end`      | `callId`                 |
| `voicecall.status`   | `callId`                 |

## ذو صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [التنبيه الصوتي](/ar/nodes/voicewake)
