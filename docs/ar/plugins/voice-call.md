---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بإعداد Plugin المكالمات الصوتية أو تطويره
    - تحتاج إلى صوت في الوقت الفعلي أو نسخ صوتي متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: أجرِ مكالمات صوتية صادرة واستقبل مكالمات واردة عبر Twilio أو Telnyx أو Plivo، مع صوت آني ونسخ متدفق اختياريين
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-07-12T06:25:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

مكالمات صوتية لـ OpenClaw عبر Plugin: إشعارات صادرة، ومحادثات متعددة الأدوار،
وصوت آني مزدوج الاتجاه بالكامل، ونسخ متدفق، ومكالمات واردة بسياسات قوائم السماح.

**المزوّدون:** `mock` (للتطوير، بلا شبكة)، و`plivo` (واجهة Voice API + نقل XML +
التقاط الكلام عبر GetInput)، و`telnyx` (Call Control v2)، و`twilio` (Programmable Voice +
Media Streams).

<Note>
يعمل Plugin المكالمات الصوتية **داخل عملية Gateway**. إذا كنت تستخدم
Gateway بعيدًا، فثبّت Plugin واضبطه على الجهاز الذي يشغّل
Gateway، ثم أعد تشغيل Gateway لتحميله.
</Note>

## البدء السريع

<Steps>
  <Step title="تثبيت Plugin">
    <Tabs>
      <Tab title="من npm">
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

    استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الحالي. ثبّت إصدارًا دقيقًا
    فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج. أعد تشغيل Gateway
    بعد ذلك ليتم تحميل Plugin.

  </Step>
  <Step title="ضبط المزوّد وWebhook">
    عيّن الإعدادات ضمن `plugins.entries.voice-call.config` (راجع
    [الإعداد](#configuration) أدناه). الحد الأدنى المطلوب: `provider`، وبيانات اعتماد
    المزوّد، و`fromNumber`، وعنوان URL لـ Webhook يمكن الوصول إليه علنًا.
  </Step>
  <Step title="التحقق من الإعداد">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    يتحقق من تمكين Plugin، وبيانات اعتماد المزوّد، وإتاحة Webhook، ومن
    تفعيل وضع صوتي واحد فقط (`streaming` أو `realtime`).

  </Step>
  <Step title="اختبار أولي">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    كلاهما تشغيل تجريبي افتراضيًا. أضف `--yes` لإجراء مكالمة
    إشعار صادرة قصيرة:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن ينتج الإعداد **عنوان URL عامًا لـ Webhook**.
إذا أدّى `publicUrl` أو عنوان URL للنفق أو عنوان URL لـ Tailscale أو خيار التقديم الاحتياطي
إلى local loopback أو نطاق شبكة خاصة، يفشل الإعداد بدلًا من
بدء مزوّد لا يمكنه تلقّي Webhooks من شركة الاتصالات.
</Warning>

## الإعداد

إذا كانت `enabled: true` لكن بيانات اعتماد المزوّد المحدد مفقودة، فسيسجّل بدء تشغيل Gateway
تحذيرًا بأن الإعداد غير مكتمل مع ذكر المفاتيح المفقودة، ويتخطى
بدء بيئة التشغيل. ومع ذلك، تظل الأوامر واستدعاءات RPC وأدوات الوكيل تُرجع
الإعدادات المفقودة بدقة عند استخدامها.

<Note>
تقبل بيانات اعتماد المكالمات الصوتية SecretRefs. تُحلّ `plugins.entries.voice-call.config.twilio.authToken` و`plugins.entries.voice-call.config.realtime.providers.*.apiKey` و`plugins.entries.voice-call.config.streaming.providers.*.apiKey` و`plugins.entries.voice-call.config.tts.providers.*.apiKey` عبر واجهة SecretRef القياسية؛ راجع [واجهة بيانات اعتماد SecretRef](/ar/reference/secretref-credential-surface).
</Note>

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "مرحبًا بكم في Silver Fox Cards، كيف يمكنني المساعدة؟",
              responseSystemPrompt: "أنت متخصص موجز في بطاقات البيسبول.",
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
            // region: "ie1", // اختياري: us1 | ie1 | au1؛ القيمة الافتراضية us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // المفتاح العام لـ Webhook الخاص بـ Telnyx من Mission Control Portal
            // (Base64؛ يمكن تعيينه أيضًا عبر TELNYX_PUBLIC_KEY).
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

          // أمان Webhook (موصى به للأنفاق/الوكلاء)
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

          streaming: { enabled: true /* راجع النسخ المتدفق */ },
          realtime: { enabled: false /* راجع المحادثات الصوتية الآنية */ },
        },
      },
    },
  },
}
```

### مرجع الإعدادات

مفاتيح المستوى الأعلى ضمن `plugins.entries.voice-call.config` غير الموضحة أعلاه:

| المفتاح                          | القيمة الافتراضية | ملاحظات                                                                                |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | مفتاح التشغيل/الإيقاف الرئيسي.                                                        |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. راجع [المكالمات الواردة](#inbound-calls). |
| `allowFrom`                     | `[]`         | قائمة سماح بصيغة E.164 لـ `inboundPolicy: "allowlist"`.                                |
| `maxDurationSeconds`            | `300`        | حد أقصى صارم لمدة كل مكالمة، يُفرض بغض النظر عن حالة الرد.                            |
| `staleCallReaperSeconds`        | `120`        | راجع [منظّف المكالمات القديمة](#stale-call-reaper). تؤدي القيمة `0` إلى تعطيله.        |
| `silenceTimeoutMs`              | `800`        | اكتشاف صمت نهاية الكلام للمسار التقليدي (غير الآني).                                  |
| `transcriptTimeoutMs`           | `180000`     | أقصى مدة انتظار لنسخة كلام المتصل قبل التخلي عن الدور.                                |
| `ringTimeoutMs`                 | `30000`      | مهلة الرنين للمكالمات الصادرة.                                                        |
| `maxConcurrentCalls`            | `1`          | تُرفض المكالمات الصادرة التي تتجاوز هذا الحد.                                         |
| `outbound.notifyHangupDelaySec` | `3`          | عدد ثواني الانتظار بعد TTS قبل إنهاء المكالمة تلقائيًا في وضع الإشعار.                 |
| `skipSignatureVerification`     | `false`      | للاختبار المحلي فقط؛ لا تفعّله مطلقًا في بيئة الإنتاج.                                |
| `store`                         | غير معيّن    | يتجاوز مسار سجل المكالمات الافتراضي `~/.openclaw/voice-calls`.                        |
| `agentId`                       | `"main"`     | الوكيل المستخدم لإنشاء الردود وتخزين الجلسات.                                         |
| `responseModel`                 | غير معيّن    | يتجاوز النموذج الافتراضي للردود التقليدية (غير الآنية).                               |
| `responseSystemPrompt`          | مُنشأ        | مطالبة نظام مخصصة للردود التقليدية.                                                    |
| `responseTimeoutMs`             | `30000`      | مهلة إنشاء الرد التقليدي (بالمللي ثانية).                                              |

يستخدم Twilio افتراضيًا نقطة نهاية REST الخاصة بمنطقة US1. لمعالجة المكالمات في منطقة
مدعومة خارج الولايات المتحدة، عيّن `twilio.region` إلى `ie1` أو `au1` واستخدم بيانات اعتماد
تلك المنطقة. راجع
[دليل Twilio لواجهة REST API في المناطق خارج الولايات المتحدة](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="ملاحظات إتاحة المزوّد وأمانه">
    - يتطلب كل من Twilio وTelnyx وPlivo عنوان URL لـ Webhook **يمكن الوصول إليه علنًا**.
    - `mock` مزوّد محلي للتطوير (بلا استدعاءات شبكية).
    - يتطلب Telnyx القيمة `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` بقيمة true.
    - `skipSignatureVerification` مخصصة للاختبار المحلي فقط.
    - في الخطة المجانية من ngrok، عيّن `publicUrl` إلى عنوان URL الدقيق لـ ngrok؛ ويُفرض التحقق من التوقيع دائمًا.
    - تسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ Webhooks الخاصة بـ Twilio ذات التوقيعات غير الصالحة **فقط** عندما تكون `tunnel.provider="ngrok"` و`serve.bind` هي local loopback (وكيل ngrok المحلي). للتطوير المحلي فقط.
    - يمكن أن تتغير عناوين URL للخطة المجانية من Ngrok أو تضيف سلوك صفحات وسيطة؛ وإذا انحرفت قيمة `publicUrl` تفشل توقيعات Twilio. للإنتاج: فضّل نطاقًا ثابتًا أو نفق Tailscale.

  </Accordion>
  <Accordion title="حدود اتصالات البث">
    - تغلق `streaming.preStartTimeoutMs` (القيمة الافتراضية `5000`) المقابس التي لا ترسل مطلقًا إطار `start` صالحًا.
    - تحدّ `streaming.maxPendingConnections` (القيمة الافتراضية `32`) إجمالي المقابس غير الموثقة قبل البدء.
    - تحدّ `streaming.maxPendingConnectionsPerIp` (القيمة الافتراضية `4`) المقابس غير الموثقة قبل البدء لكل عنوان IP مصدر.
    - تحدّ `streaming.maxConnections` (القيمة الافتراضية `128`) جميع مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).

  </Accordion>
  <Accordion title="ترحيلات الإعدادات القديمة">
    توحّد عملية تحليل الإعدادات هذه المفاتيح القديمة تلقائيًا وتسجّل
    تحذيرًا يذكر المسار البديل؛ وستُزال طبقة التوافق في إصدار مستقبلي
    (`2026.6.0`)، لذا شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات الملتزم بها
    إلى الشكل القياسي:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - أُزيلت `realtime.agentContext.includeSystemPrompt` (يستخدم السياق الآني الآن مطالبة الوكيل المُنشأة)

  </Accordion>
</AccordionGroup>

## نطاق الجلسة

تستخدم المكالمات الصوتية افتراضيًا `sessionScope: "per-phone"` بحيث تحتفظ المكالمات المتكررة من
المتصل نفسه بذاكرة المحادثة. عيّن `sessionScope: "per-call"` عندما
ينبغي أن تبدأ كل مكالمة عبر شركة الاتصالات بسياق جديد، مثل تدفقات الاستقبال،
أو الحجز، أو الرد الصوتي التفاعلي (IVR)، أو جسر Google Meet، حيث قد يمثّل رقم الهاتف نفسه
اجتماعات مختلفة.

تخزّن المكالمات الصوتية مفاتيح الجلسات المُنشأة ضمن مساحة أسماء الوكيل المضبوطة
(`agent:<agentId>:voice:*`). وتُحل مفاتيح التكامل الصريحة الخام ضمن مساحة الأسماء
نفسها: يحتفظ المفتاح القياسي `agent:<configuredAgentId>:*` بذلك
المالك ويراعي الأسماء البديلة للنطاق العام/`session.mainKey` في النواة؛ أما إدخال
`agent:*` الأجنبي أو غير الصحيح فيُحدّد نطاقه كمفتاح مبهم ضمن الوكيل
المضبوط؛ وتبقى `global` و`unknown` قيمتين حارستين عامتين.

## المحادثات الصوتية الآنية

تحدد `realtime` مزوّدًا صوتيًا آنيًا مزدوج الاتجاه بالكامل لصوت المكالمات المباشرة.
وهي منفصلة عن `streaming`، الذي لا يفعل سوى تمرير الصوت إلى مزوّدي
النسخ الآني.

<Warning>
لا يمكن الجمع بين `realtime.enabled` و`streaming.enabled`. اختر وضعًا
صوتيًا واحدًا لكل مكالمة.
</Warning>

سلوك بيئة التشغيل الحالي:

- يُدعَم `realtime.enabled` مع Twilio وTelnyx.
- الحقل `realtime.provider` اختياري. إذا لم يُعيَّن، تستخدم ميزة المكالمات الصوتية أول موفّر صوت مسجّل يعمل في الوقت الفعلي.
- موفّرو الصوت المضمّنون للعمل في الوقت الفعلي: Google Gemini Live‏ (`google`) وOpenAI‏ (`openai`)، وتسجّلهم Plugins الخاصة بموفّريهم.
- يوجد الإعداد الخام المملوك للموفّر ضمن `realtime.providers.<providerId>`.
- تتيح ميزة المكالمات الصوتية أداة الوقت الفعلي المشتركة `openclaw_agent_consult` افتراضيًا. يمكن للنموذج العامل في الوقت الفعلي استدعاؤها عندما يطلب المتصل استدلالًا أعمق أو معلومات حالية أو أدوات OpenClaw المعتادة.
- يضيف `realtime.consultPolicy` اختياريًا إرشادات تحدد متى ينبغي للنموذج العامل في الوقت الفعلي استدعاء `openclaw_agent_consult`.
- يكون `realtime.agentContext.enabled` معطّلًا افتراضيًا. عند تمكينه، تُدرج ميزة المكالمات الصوتية هوية محدودة للوكيل وحزمة مختارة من ملفات مساحة العمل ضمن تعليمات موفّر الوقت الفعلي عند إعداد الجلسة.
- يكون `realtime.fastContext.enabled` معطّلًا افتراضيًا. عند تمكينه، تبحث ميزة المكالمات الصوتية أولًا في سياق الذاكرة والجلسات المفهرس عن سؤال الاستشارة، وتعيد تلك المقتطفات إلى النموذج العامل في الوقت الفعلي خلال `realtime.fastContext.timeoutMs`، ثم لا تلجأ إلى وكيل الاستشارة الكامل إلا إذا كانت قيمة `realtime.fastContext.fallbackToConsult` هي `true`.
- إذا كان `realtime.provider` يشير إلى موفّر غير مسجّل، أو لم يكن أي موفّر صوت للعمل في الوقت الفعلي مسجّلًا أصلًا، فتسجّل ميزة المكالمات الصوتية تحذيرًا وتتجاوز وسائط الوقت الفعلي بدلًا من إفشال Plugin بالكامل.
- يجب ألا تكون قيمة `inboundPolicy` هي `"disabled"` عندما تكون قيمة `realtime.enabled` هي `true`؛ إذ يرفض `validateProviderConfig` هذه التوليفة.
- تعيد مفاتيح جلسة الاستشارة استخدام جلسة المكالمة المخزّنة عند توفرها، ثم تلجأ إلى `sessionScope` المضبوط (`per-phone` افتراضيًا، أو `per-call` للمكالمات المعزولة).

### سياسة الأدوات

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

| السياسة         | السلوك                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | إتاحة أداة الاستشارة وقصر الوكيل العادي على `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و`memory_get`. |
| `owner`          | إتاحة أداة الاستشارة والسماح للوكيل العادي باستخدام سياسة أدوات الوكيل المعتادة.                                                      |
| `none`           | عدم إتاحة أداة الاستشارة. تظل أدوات `realtime.tools` المخصّصة تمرَّر إلى موفّر الوقت الفعلي.                               |

يتحكم `realtime.consultPolicy` في تعليمات النموذج العامل في الوقت الفعلي فقط:

| السياسة      | الإرشادات                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | الاحتفاظ بالموجّه الافتراضي وترك قرار توقيت استدعاء أداة الاستشارة للموفّر.              |
| `substantive` | الإجابة مباشرةً عن العبارات الحوارية البسيطة، والاستشارة قبل تقديم الحقائق أو استخدام الذاكرة أو الأدوات أو السياق. |
| `always`      | الاستشارة قبل كل إجابة جوهرية.                                                        |

### السياق الصوتي للوكيل

مكّن `realtime.agentContext` عندما ينبغي للجسر الصوتي أن يبدو مثل وكيل
OpenClaw المضبوط من دون تحمّل زمن رحلة كاملة ذهابًا وإيابًا لاستشارة الوكيل
في التفاعلات العادية. تُضاف حزمة السياق مرة واحدة عند إنشاء جلسة الوقت
الفعلي، ولذلك لا تضيف زمن انتقال لكل تفاعل. تظل استدعاءات
`openclaw_agent_consult` تشغّل وكيل OpenClaw الكامل، وينبغي استخدامها
للعمل بالأدوات أو المعلومات الحالية أو عمليات البحث في الذاكرة أو حالة مساحة العمل.

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

### أمثلة على موفّري الوقت الفعلي

<Tabs>
  <Tab title="Google Gemini Live">
    الإعدادات الافتراضية: مفتاح API من `realtime.providers.google.apiKey` أو `GEMINI_API_KEY`
    أو `GOOGLE_API_KEY`؛ والنموذج `gemini-3.1-flash-live-preview`؛
    والصوت `Kore`. يكون `sessionResumption` و`contextWindowCompression` مفعّلين
    افتراضيًا للمكالمات الأطول القابلة لإعادة الاتصال. استخدم `silenceDurationMs`
    و`startSensitivity` و`endSensitivity` لضبط تبادل أدوار أسرع عبر
    صوت الاتصالات الهاتفية.

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
                    model: "gemini-3.1-flash-live-preview",
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

راجع [موفّر Google](/ar/providers/google) و
[موفّر OpenAI](/ar/providers/openai) للاطلاع على خيارات الصوت في الوقت الفعلي
الخاصة بكل موفّر.

## النسخ النصي المتدفق

يحدد `streaming` موفّر نسخ نصي في الوقت الفعلي لصوت المكالمات المباشرة.

سلوك وقت التشغيل الحالي:

- الحقل `streaming.provider` اختياري. إذا لم يُعيَّن، تستخدم ميزة المكالمات الصوتية أول موفّر نسخ نصي مسجّل يعمل في الوقت الفعلي.
- موفّرو النسخ النصي المضمّنون للعمل في الوقت الفعلي: Deepgram‏ (`deepgram`) وElevenLabs‏ (`elevenlabs`) وMistral‏ (`mistral`) وOpenAI‏ (`openai`) وxAI‏ (`xai`)، وتسجّلهم Plugins الخاصة بموفّريهم.
- يوجد الإعداد الخام المملوك للموفّر ضمن `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` مقبولة للتدفق، تسجّل ميزة المكالمات الصوتية التدفق فورًا، وتضع الوسائط الواردة في قائمة انتظار لتمريرها عبر موفّر النسخ النصي أثناء اتصاله، ولا تبدأ التحية الأولية إلا بعد أن يصبح النسخ النصي في الوقت الفعلي جاهزًا.
- إذا كان `streaming.provider` يشير إلى موفّر غير مسجّل، أو لم يكن أي موفّر مسجّلًا، فتسجّل ميزة المكالمات الصوتية تحذيرًا وتتجاوز تدفق الوسائط بدلًا من إفشال Plugin بالكامل.

### أمثلة على موفّري التدفق

<Tabs>
  <Tab title="OpenAI">
    الإعدادات الافتراضية: مفتاح API من `streaming.providers.openai.apiKey` أو
    `OPENAI_API_KEY`؛ والنموذج `gpt-4o-transcribe`؛ والقيمة `silenceDurationMs: 800`؛
    والقيمة `vadThreshold: 0.5`.

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
    الإعدادات الافتراضية: مفتاح API من `streaming.providers.xai.apiKey` أو `XAI_API_KEY` (مع
    الرجوع إلى ملف تعريف مصادقة OAuth لـxAI إذا لم يُعيَّن أي منهما)؛ ونقطة النهاية
    `wss://api.x.ai/v1/stt`؛ والترميز `mulaw`؛ ومعدل أخذ العينات `8000`؛
    والقيمة `endpointingMs: 800`؛ والقيمة `interimResults: true`.

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

## تحويل النص إلى كلام للمكالمات

تستخدم ميزة المكالمات الصوتية إعداد `messages.tts` الأساسي لتدفق الكلام في
المكالمات. يمكنك تجاوزه ضمن إعداد Plugin باستخدام **البنية نفسها** —
حيث يُدمَج بعمق مع `messages.tts`.

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
**يُتجاهل تحويل الكلام من Microsoft في المكالمات الصوتية.** يتطلب التوليد الصوتي للاتصالات الهاتفية
موفّرًا ينفّذ إخراجًا مخصصًا للاتصالات الهاتفية؛ ولا يوفّر موفّر الكلام من Microsoft
ذلك، لذا يُتجاوز في المكالمات وتُجرَّب بدلًا منه الموفّرات الأخرى في
سلسلة الرجوع.
</Warning>

ملاحظات السلوك:

- يُصلح `openclaw doctor --fix` مفاتيح `tts.<provider>` القديمة داخل إعداد Plugin‏ (`openai` و`elevenlabs` و`microsoft` و`edge`)؛ وينبغي أن يستخدم الإعداد المحفوظ `tts.providers.<provider>`.
- يُستخدم تحويل النص إلى كلام الأساسي عند تمكين تدفق وسائط Twilio؛ وإلا ترجع المكالمات إلى الأصوات الأصلية للموفّر.
- إذا كان تدفق وسائط Twilio نشطًا بالفعل، فلا ترجع ميزة المكالمات الصوتية إلى `<Say>` في TwiML. وإذا لم يكن تحويل النص إلى كلام للاتصالات الهاتفية متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من خلط مساري تشغيل.
- عندما يرجع تحويل النص إلى كلام للاتصالات الهاتفية إلى موفّر ثانوي، تسجّل ميزة المكالمات الصوتية تحذيرًا يتضمن سلسلة الموفّرين (`from` و`to` و`attempts`) لأغراض تصحيح الأخطاء.
- عندما تؤدي مقاطعة الكلام في Twilio أو إزالة التدفق إلى مسح قائمة انتظار تحويل النص إلى كلام المعلّقة، تُسوّى طلبات التشغيل الموضوعة في قائمة الانتظار بدلًا من ترك المتصلين الذين ينتظرون اكتمال التشغيل عالقين.

### أمثلة على تحويل النص إلى كلام

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

تكون سياسة المكالمات الواردة `disabled` افتراضيًا. لتمكين المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
يُعدّ `inboundPolicy: "allowlist"` فحصًا منخفض الموثوقية لمعرّف المتصل. يطبّع الـ plugin
قيمة `From` التي يوفّرها المزوّد ويقارنها بـ `allowFrom`.
تتحقق مصادقة Webhook من صحة تسليم المزوّد وسلامة الحمولة،
لكنها **لا** تثبت ملكية رقم المتصل عبر PSTN/VoIP. تعامل مع
`allowFrom` على أنه ترشيح لمعرّف المتصل، وليس إثباتًا قويًا لهوية المتصل.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`
و`responseSystemPrompt` و`responseTimeoutMs`.

### التوجيه حسب الرقم

استخدم `numbers` عندما يتلقى plugin المكالمات الصوتية الواحد مكالمات لعدة أرقام هاتف
ويجب أن يتصرف كل رقم كخط مختلف. على سبيل المثال،
يمكن لرقم استخدام مساعد شخصي بطابع غير رسمي، بينما يستخدم رقم آخر شخصية
تجارية ووكيل رد مختلفًا وصوت TTS مختلفًا.

تُحدَّد المسارات من رقم `To` المطلوب الذي يوفّره المزوّد. يجب أن تكون المفاتيح
أرقامًا بتنسيق E.164. عند ورود مكالمة، تحل المكالمات الصوتية المسار المطابق
مرة واحدة، وتخزّن المسار المطابق في سجل المكالمة، وتعيد استخدام
الإعداد الفعلي للتحية، ومسار الرد التلقائي التقليدي، ومسار
الاستشارة في الوقت الفعلي، وتشغيل TTS. إذا لم يطابق أي مسار، يُستخدم إعداد
المكالمات الصوتية العام. لا تستخدم المكالمات الصادرة `numbers`؛ مرّر
الوجهة الصادرة والرسالة والجلسة صراحةً عند بدء المكالمة.

تدعم تجاوزات المسار حاليًا:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تُدمج قيمة `tts` للمسار دمجًا عميقًا فوق إعداد `tts` العام للمكالمات الصوتية، لذا
يمكنك عادةً تجاوز صوت المزوّد فقط:

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

### عقد المخرجات المنطوقة

بالنسبة إلى الردود التلقائية، تُلحق المكالمات الصوتية عقدًا صارمًا للمخرجات المنطوقة
بموجّه النظام، يفرض رد JSON بالتنسيق `{"spoken":"..."}`. تستخرج المكالمات الصوتية
نص الكلام بصورة دفاعية:

- تتجاهل الحمولات الموسومة كمحتوى استدلال أو خطأ.
- تحلل JSON المباشر، أو JSON داخل سياج، أو مفاتيح `"spoken"` المضمّنة.
- تعود إلى النص العادي وتزيل الفقرات الاستهلالية التي يُرجّح أن تكون للتخطيط أو معلومات وصفية.

يحافظ ذلك على تركيز التشغيل المنطوق على النص الموجّه للمتصل، ويمنع تسريب
نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، ترتبط معالجة الرسالة الأولى بحالة
التشغيل المباشر:

- لا يُعطّل مسح قائمة الانتظار عند مقاطعة الكلام والرد التلقائي إلا أثناء نطق التحية الأولية فعليًا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتظل الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث دون تأخير إضافي.
- تؤدي مقاطعة الكلام إلى إيقاف التشغيل النشط ومسح إدخالات TTS الخاصة بـ Twilio الموجودة في قائمة الانتظار والتي لم يبدأ تشغيلها بعد. تُحل الإدخالات الممسوحة باعتبارها متخطاة، بحيث يمكن لمنطق الرد اللاحق الاستمرار دون انتظار صوت لن يُشغّل أبدًا.
- تستخدم المحادثات الصوتية في الوقت الفعلي دور الافتتاح الخاص ببث الوقت الفعلي. **لا** تنشر المكالمات الصوتية تحديث TwiML قديمًا من نوع `<Say>` لتلك الرسالة الأولية، لذلك تظل جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة السماح لانقطاع بث Twilio

عند انقطاع بث وسائط Twilio، تنتظر المكالمات الصوتية **2000 مللي ثانية** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعيد اتصال البث خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجّل أي بث مجددًا بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## منظّف المكالمات القديمة

استخدم `staleCallReaperSeconds` (القيمة الافتراضية **120**) لإنهاء المكالمات التي لا
يُرد عليها مطلقًا ولا تصل إلى حالة محادثة مباشرة، مثل مكالمات وضع الإشعار
التي لا يسلّم فيها المزوّد Webhook نهائيًا. اضبطه على `0`
لتعطيله.

يعمل المنظّف كل 30 ثانية، ولا ينهي إلا المكالمات التي لا تحتوي على طابع زمني
`answeredAt` وليست بالفعل في حالة نهائية أو مباشرة
(`speaking`/`listening`)، لذلك لا ينظّف هذا المؤقت المحادثات التي تم الرد عليها
أبدًا؛ ويمثل `maxDurationSeconds` (القيمة الافتراضية 300) الحد المنفصل الذي
ينهي المكالمات المُجاب عنها إذا استمرت وقتًا طويلًا.

بالنسبة إلى التدفقات ذات نمط الإشعار، حيث قد تتأخر شركات الاتصالات في تسليم Webhook
الرنين/الرد، ارفع `staleCallReaperSeconds` فوق القيمة الافتراضية حتى لا تُنظّف
المكالمات البطيئة ولكن الطبيعية مبكرًا؛ ويُعد النطاق `120`-`300` ثانية نطاقًا معقولًا
لبيئة الإنتاج.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## أمان Webhook

عند وجود وكيل أو نفق أمام Gateway، يعيد الـ plugin إنشاء
عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات في ترويسات
إعادة التوجيه الموثوقة:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  مضيفو قائمة السماح من ترويسات إعادة التوجيه.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  الوثوق بترويسات إعادة التوجيه دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  الوثوق بترويسات إعادة التوجيه فقط عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

وسائل حماية إضافية:

- تُفعّل **الحماية من إعادة تشغيل** Webhook لكل من Twilio وTelnyx وPlivo. يُقر باستلام طلبات Webhook الصالحة المعاد تشغيلها، لكن تُتخطى آثارها الجانبية.
- تتضمن أدوار محادثات Twilio رمزًا مميزًا لكل دور في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها إكمال دور نص معلّق أحدث.
- تُرفض طلبات Webhook غير المصادق عليها قبل قراءة المحتوى عندما تكون ترويسات التوقيع المطلوبة من المزوّد مفقودة.
- يستخدم Webhook الخاص بالمكالمات الصوتية ملف قراءة المحتوى المشترك السابق للمصادقة (حد أقصى للمحتوى 64 كيلوبايت، ومهلة قراءة 5 ثوانٍ)، بالإضافة إلى حد للطلبات الجارية لكل مفتاح (8 طلبات متزامنة لكل مفتاح افتراضيًا) قبل التحقق من التوقيع.

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

عندما يكون Gateway قيد التشغيل بالفعل، تفوّض أوامر `voicecall` التشغيلية
إلى وقت تشغيل المكالمات الصوتية المملوك لـ Gateway، حتى لا يربط CLI
خادم Webhook ثانيًا. إذا تعذر الوصول إلى Gateway، تعود الأوامر إلى
وقت تشغيل مستقل لـ CLI.

يقرأ `latency` ملف `calls.jsonl` من مسار تخزين المكالمات الصوتية الافتراضي. استخدم
`--file <path>` للإشارة إلى سجل مختلف، و`--last <n>` لقصر
التحليل على آخر N من السجلات (القيمة الافتراضية 200). يتضمن الإخراج الحد الأدنى/الأقصى/المتوسط،
وp50، وp95 لزمن استجابة الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء          | الوسائط                                     |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يأتي plugin المكالمات الصوتية مع Skill وكيل مطابق.

## RPC الخاص بـ Gateway

| الطريقة                     | الوسائط                                                          | الملاحظات                                                                 |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | يعود إلى إعداد `toNumber` عند حذف `to`.                                   |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | مماثل لـ `initiate`، لكنه يقبل أيضًا `dtmfSequence` قبل الاتصال.          |
| `voicecall.continue`        | `callId`, `message`                                              | يحظر التنفيذ حتى اكتمال الدور؛ ويعيد النص المنسوخ.                        |
| `voicecall.continue.start`  | `callId`, `message`                                              | صيغة غير متزامنة: تعيد `operationId` فورًا.                               |
| `voicecall.continue.result` | `operationId`                                                    | تستعلم عن عملية `voicecall.continue.start` معلّقة للحصول على نتيجتها.     |
| `voicecall.speak`           | `callId`, `message`                                              | ينطق دون انتظار؛ ويستخدم جسر الوقت الفعلي عند تفعيل `realtime.enabled`.   |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | احذف `callId` لسرد جميع المكالمات النشطة.                                 |

لا تكون `dtmfSequence` صالحة إلا مع `mode: "conversation"`؛ أما مكالمات وضع الإشعار
فيجب أن تستخدم `voicecall.dtmf` بعد إنشاء المكالمة إذا كانت تحتاج إلى
أرقام بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في إتاحة Webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن تكون حالة `webhook-exposure` خضراء. ويظل
`publicUrl` المهيأ يفشل عندما يشير إلى مساحة شبكة محلية أو خاصة،
لأن شركة الاتصالات لا يمكنها معاودة الاتصال بتلك العناوين.
لا تستخدم `localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x`
أو `192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` أو نطاقات
NAT الأخرى الخاصة بشركات الاتصالات بصفتها `publicUrl`.

ترسل مكالمات Twilio الصادرة في وضع الإشعار TwiML الأولي من نوع `<Say>` مباشرةً
في طلب إنشاء المكالمة، لذلك لا تعتمد الرسالة المنطوقة الأولى على
جلب Twilio لـ TwiML عبر Webhook. يظل Webhook العام مطلوبًا لاستدعاءات الحالة،
ومكالمات المحادثة، وDTMF قبل الاتصال، والبث في الوقت الفعلي،
والتحكم في المكالمات بعد الاتصال.

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

بعد تغيير الإعداد، أعد تشغيل Gateway أو أعد تحميله، ثم شغّل:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

يُعد `voicecall smoke` تشغيلًا تجريبيًا ما لم تمرر `--yes`.

### فشل بيانات اعتماد المزوّد

تحقق من المزوّد المحدد وحقول بيانات الاعتماد المطلوبة:

- Twilio: ‏`twilio.accountSid` و`twilio.authToken` و`fromNumber`، أو
  `TWILIO_ACCOUNT_SID` و`TWILIO_AUTH_TOKEN` و`TWILIO_FROM_NUMBER`.
- Telnyx: ‏`telnyx.apiKey` و`telnyx.connectionId` و`telnyx.publicKey` و
  `fromNumber`، أو `TELNYX_API_KEY` و`TELNYX_CONNECTION_ID` و
  `TELNYX_PUBLIC_KEY`.
- Plivo: ‏`plivo.authId` و`plivo.authToken` و`fromNumber`، أو
  `PLIVO_AUTH_ID` و`PLIVO_AUTH_TOKEN`.

يجب أن تكون بيانات الاعتماد موجودة على مضيف Gateway. لا يؤثر تعديل ملف تعريف الصدفة المحلي
في Gateway قيد التشغيل بالفعل حتى يُعاد تشغيله أو يعيد تحميل
بيئته.

### تبدأ المكالمات، لكن Webhook الخاصة بمزوّد الخدمة لا تصل

تأكّد من أن وحدة تحكم مزوّد الخدمة تشير إلى عنوان URL العام الدقيق لـ Webhook:

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
- يمرّر وكيل الطلب، لكنه يزيل ترويسات المضيف/البروتوكول أو يعيد كتابتها.
- يوجّه جدار الحماية أو DNS اسم المضيف العام إلى مكان آخر غير Gateway.
- أُعيد تشغيل Gateway من دون تمكين Plugin المكالمات الصوتية.

عندما يكون وكيل عكسي أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. لا تستخدم
`webhookSecurity.trustForwardingHeaders` إلا عندما تكون حدود الوكيل
تحت سيطرتك.

### يفشل التحقق من التوقيع

تُفحص توقيعات مزوّد الخدمة مقابل عنوان URL العام الذي يعيد OpenClaw تكوينه
من الطلب الوارد. إذا فشلت التوقيعات:

- تأكّد من أن عنوان URL الخاص بـ Webhook لدى مزوّد الخدمة يطابق `publicUrl` تمامًا، بما في ذلك المخطط والمضيف والمسار.
- بالنسبة إلى عناوين URL في الطبقة المجانية من ngrok، حدّث `publicUrl` عند تغيّر اسم مضيف النفق.
- تأكّد من أن الوكيل يحافظ على ترويسات المضيف والبروتوكول الأصلية، أو اضبط `webhookSecurity.allowedHosts`.
- لا تمكّن `skipSignatureVerification` خارج الاختبار المحلي.

### تفشل عمليات انضمام Google Meet عبر Twilio

يستخدم Google Meet هذا الـ Plugin للانضمام عبر الاتصال الهاتفي باستخدام Twilio. تحقّق أولًا من المكالمات
الصوتية:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقّق صراحةً من وسيلة نقل Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كانت المكالمات الصوتية سليمة، لكن المشارك في Meet لا ينضم أبدًا، فتحقّق من رقم
الاتصال الهاتفي لـ Meet ورمز PIN و`--dtmf-sequence`. قد تكون المكالمة الهاتفية سليمة
بينما يرفض الاجتماع تسلسل DTMF غير الصحيح أو يتجاهله.

يبدأ Google Meet جزء المكالمة الهاتفية عبر Twilio من خلال `voicecall.start` باستخدام
تسلسل DTMF يسبق الاتصال. تتضمن التسلسلات المشتقة من رمز PIN قيمة
`voiceCall.dtmfDelayMs` الخاصة بـ Plugin Google Meet (القيمة الافتراضية **12000 مللي ثانية**) على هيئة أرقام انتظار بادئة في Twilio،
لأن مطالبات الاتصال الهاتفي في Meet قد تصل متأخرة. ثم تعيد المكالمات الصوتية
التوجيه إلى المعالجة في الوقت الفعلي قبل طلب التحية الافتتاحية.

استخدم `openclaw logs --follow` لتتبّع المراحل المباشر. يسجّل انضمام Twilio السليم
إلى Meet هذا الترتيب:

- يفوّض Google Meet الانضمام عبر Twilio إلى المكالمات الصوتية.
- تخزّن المكالمات الصوتية TwiML الخاص بـ DTMF السابق للاتصال.
- يُستهلك TwiML الأولي لـ Twilio ويُقدَّم قبل المعالجة في الوقت الفعلي.
- تقدّم المكالمات الصوتية TwiML في الوقت الفعلي لمكالمة Twilio.
- يطلب Google Meet الكلام الافتتاحي باستخدام `voicecall.speak` بعد مهلة ما بعد DTMF.

يظل `openclaw voicecall tail` يعرض سجلات المكالمات المحفوظة؛ وهو مفيد
لحالة المكالمة والنصوص المفرّغة، لكن لا تظهر فيه كل انتقالات Webhook/الوقت الفعلي.

### لا يوجد كلام في المكالمة الآنية

تأكّد من تمكين وضع صوتي واحد فقط: لا يمكن أن تكون
`realtime.enabled` و`streaming.enabled` كلتاهما بالقيمة true.

بالنسبة إلى مكالمات Twilio/Telnyx الآنية، تحقّق أيضًا مما يلي:

- تم تحميل Plugin لمزوّد آني وتسجيله.
- أن يكون `realtime.provider` غير مضبوط أو أن يسمّي مزوّدًا مسجّلًا.
- مفتاح API الخاص بالمزوّد متاح لعملية Gateway.
- يُظهر `openclaw logs --follow` تقديم TwiML الآني، وبدء الجسر الآني، وإضافة التحية الأولية إلى قائمة الانتظار.

## ذو صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [التنبيه الصوتي](/ar/nodes/voicewake)
