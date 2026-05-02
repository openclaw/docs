---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بتكوين Plugin المكالمات الصوتية أو تطويره
    - تحتاج إلى صوت في الوقت الفعلي أو نسخ متدفق عبر الاتصالات الهاتفية
sidebarTitle: Voice call
summary: أجرِ مكالمات صوتية صادرة واقبل المكالمات الصوتية الواردة عبر Twilio أو Telnyx أو Plivo، مع دعم اختياري للصوت في الوقت الفعلي والنسخ المتدفق
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-05-02T22:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Voice calls for OpenClaw via a plugin. Supports outbound notifications,
multi-turn conversations, full-duplex realtime voice, streaming
transcription, and inbound calls with allowlist policies.

**Current providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/no network).

<Note>
The Voice Call plugin runs **inside the Gateway process**. If you use a
remote Gateway, install and configure the plugin on the machine running
the Gateway, then restart the Gateway to load it.
</Note>

## Quick start

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

    Use the bare package to follow the current official release tag. Pin an
    exact version only when you need a reproducible install.

    Restart the Gateway afterwards so the plugin loads.

  </Step>
  <Step title="Configure provider and webhook">
    Set config under `plugins.entries.voice-call.config` (see
    [Configuration](#configuration) below for the full shape). At minimum:
    `provider`, provider credentials, `fromNumber`, and a publicly
    reachable webhook URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    The default output is readable in chat logs and terminals. It checks
    plugin enablement, provider credentials, webhook exposure, and that
    only one audio mode (`streaming` or `realtime`) is active. Use
    `--json` for scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Both are dry runs by default. Add `--yes` to actually place a short
    outbound notify call:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
For Twilio, Telnyx, and Plivo, setup must resolve to a **public webhook URL**.
If `publicUrl`, the tunnel URL, the Tailscale URL, or the serve fallback
resolves to loopback or private network space, setup fails instead of
starting a provider that cannot receive carrier webhooks.
</Warning>

## Configuration

If `enabled: true` but the selected provider is missing credentials,
Gateway startup logs a setup-incomplete warning with the missing keys and
skips starting the runtime. Commands, RPC calls, and agent tools still
return the exact missing provider configuration when used.

<Note>
Voice-call credentials accept SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, and `plugins.entries.voice-call.config.tts.providers.*.apiKey` resolve through the standard SecretRef surface; see [SecretRef credential surface](/ar/reference/secretref-credential-surface).
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
    - Twilio, Telnyx, and Plivo all require a **publicly reachable** webhook URL.
    - `mock` is a local dev provider (no network calls).
    - Telnyx requires `telnyx.publicKey` (or `TELNYX_PUBLIC_KEY`) unless `skipSignatureVerification` is true.
    - `skipSignatureVerification` is for local testing only.
    - On ngrok free tier, set `publicUrl` to the exact ngrok URL; signature verification is always enforced.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` allows Twilio webhooks with invalid signatures **only** when `tunnel.provider="ngrok"` and `serve.bind` is loopback (ngrok local agent). Local dev only.
    - Ngrok free-tier URLs can change or add interstitial behaviour; if `publicUrl` drifts, Twilio signatures fail. Production: prefer a stable domain or a Tailscale funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` closes sockets that never send a valid `start` frame.
    - `streaming.maxPendingConnections` caps total unauthenticated pre-start sockets.
    - `streaming.maxPendingConnectionsPerIp` caps unauthenticated pre-start sockets per source IP.
    - `streaming.maxConnections` caps total open media stream sockets (pending + active).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Older configs using `provider: "log"`, `twilio.from`, or legacy
    `streaming.*` OpenAI keys are rewritten by `openclaw doctor --fix`.
    Runtime fallback still accepts the old voice-call keys for now, but
    the rewrite path is `openclaw doctor --fix` and the compat shim is
    temporary.

    Auto-migrated streaming keys:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Session scope

By default, Voice Call uses `sessionScope: "per-phone"` so repeat calls from
the same caller keep conversation memory. Set `sessionScope: "per-call"` when
each carrier call should start with fresh context, for example reception,
booking, IVR, or Google Meet bridge flows where the same phone number may
represent different meetings.

## Realtime voice conversations

`realtime` selects a full-duplex realtime voice provider for live call
audio. It is separate from `streaming`, which only forwards audio to
realtime transcription providers.

<Warning>
`realtime.enabled` cannot be combined with `streaming.enabled`. Pick one
audio mode per call.
</Warning>

Current runtime behaviour:

- `realtime.enabled` is supported for Twilio Media Streams.
- `realtime.provider` is optional. If unset, Voice Call uses the first registered realtime voice provider.
- Bundled realtime voice providers: Google Gemini Live (`google`) and OpenAI (`openai`), registered by their provider plugins.
- Provider-owned raw config lives under `realtime.providers.<providerId>`.
- Voice Call exposes the shared `openclaw_agent_consult` realtime tool by default. The realtime model can call it when the caller asks for deeper reasoning, current information, or normal OpenClaw tools.
- `realtime.fastContext.enabled` is default-off. When enabled, Voice Call first searches indexed memory/session context for the consult question and returns those snippets to the realtime model within `realtime.fastContext.timeoutMs` before falling back to the full consult agent only if `realtime.fastContext.fallbackToConsult` is true.
- If `realtime.provider` points at an unregistered provider, or no realtime voice provider is registered at all, Voice Call logs a warning and skips realtime media instead of failing the whole plugin.
- Consult session keys reuse the stored call session when available, then fall back to the configured `sessionScope` (`per-phone` by default, or `per-call` for isolated calls).

### Tool policy

`realtime.toolPolicy` controls the consult run:

| Policy           | Behavior                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expose the consult tool and limit the regular agent to `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, and `memory_get`. |
| `owner`          | Expose the consult tool and let the regular agent use the normal agent tool policy.                                                      |
| `none`           | Do not expose the consult tool. Custom `realtime.tools` are still passed through to the realtime provider.                               |

### Realtime provider examples

<Tabs>
  <Tab title="Google Gemini Live">
    Defaults: API key from `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, or `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; voice `Kore`.

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

See [Google provider](/ar/providers/google) and
[OpenAI provider](/ar/providers/openai) for provider-specific realtime voice
options.

## Streaming transcription

`streaming` selects a realtime transcription provider for live call audio.

Current runtime behavior:

- `streaming.provider` اختياري. إذا لم يُضبط، يستخدم Voice Call أول مزود نسخ آني مسجل.
- مزودو النسخ الآني المضمنون: Deepgram (`deepgram`)، وElevenLabs (`elevenlabs`)، وMistral (`mistral`)، وOpenAI (`openai`)، وxAI (`xai`)، وتُسجلها Plugins المزودين الخاصة بها.
- يوجد التكوين الخام المملوك للمزود ضمن `streaming.providers.<providerId>`.
- بعد أن يرسل Twilio رسالة `start` لدفق مقبول، يسجل Voice Call الدفق فورًا، ويضع الوسائط الواردة في صف الانتظار عبر مزود النسخ أثناء اتصال المزود، ولا يبدأ التحية الأولية إلا بعد أن يصبح النسخ الآني جاهزًا.
- إذا أشار `streaming.provider` إلى مزود غير مسجل، أو لم يكن أي مزود مسجلًا، يسجل Voice Call تحذيرًا ويتخطى بث الوسائط بدلًا من إفشال Plugin بأكمله.

### أمثلة مزود البث

<Tabs>
  <Tab title="OpenAI">
    الافتراضيات: مفتاح API‏ `streaming.providers.openai.apiKey` أو
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
    الافتراضيات: مفتاح API‏ `streaming.providers.xai.apiKey` أو `XAI_API_KEY`؛
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

يستخدم Voice Call تكوين `messages.tts` الأساسي لبث
الكلام في المكالمات. يمكنك تجاوزه ضمن تكوين Plugin
**بالبنية نفسها** — إذ يُدمج بعمق مع `messages.tts`.

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
**يُتجاهل Microsoft speech للمكالمات الصوتية.** يحتاج صوت الاتصالات الهاتفية إلى PCM؛
ولا يعرض نقل Microsoft الحالي إخراج PCM للاتصالات الهاتفية.
</Warning>

ملاحظات السلوك:

- تُصلح مفاتيح `tts.<provider>` القديمة داخل تكوين Plugin (`openai`، `elevenlabs`، `microsoft`، `edge`) بواسطة `openclaw doctor --fix`؛ ويجب أن يستخدم التكوين الملتزم به `tts.providers.<provider>`.
- يُستخدم TTS الأساسي عند تمكين بث وسائط Twilio؛ وإلا تعود المكالمات إلى الأصوات الأصلية الخاصة بالمزود.
- إذا كان دفق وسائط Twilio نشطًا بالفعل، لا يعود Voice Call إلى TwiML `<Say>`. وإذا لم يكن TTS للاتصالات الهاتفية متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من مزج مساري تشغيل.
- عندما يعود TTS للاتصالات الهاتفية إلى مزود ثانوي، يسجل Voice Call تحذيرًا يتضمن سلسلة المزودين (`from`، `to`، `attempts`) لتصحيح الأخطاء.
- عندما يمسح تدخل المتصل في Twilio أو تفكيك الدفق صف انتظار TTS المعلق، تُحسم طلبات التشغيل الموضوعة في الصف بدلًا من إبقاء المتصلين معلقين بانتظار اكتمال التشغيل.

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
`inboundPolicy: "allowlist"` هو فحص منخفض الضمان لمعرف المتصل. يطبع
Plugin قيمة `From` المقدمة من المزود بصيغة موحدة ويقارنها مع
`allowFrom`. يتحقق Webhook من تسليم المزود وسلامة
الحمولة، لكنه **لا** يثبت ملكية رقم المتصل عبر PSTN/VoIP.
تعامل مع `allowFrom` كترشيح لمعرف المتصل، وليس كهوية قوية
للمتصل.
</Warning>

تستخدم الردود التلقائية نظام الوكيل. اضبطها باستخدام `responseModel`،
و`responseSystemPrompt`، و`responseTimeoutMs`.

### التوجيه حسب الرقم

استخدم `numbers` عندما يتلقى Plugin واحد من Voice Call مكالمات لعدة أرقام
هواتف ويجب أن يتصرف كل رقم كخط مختلف. على سبيل المثال، يمكن لرقم واحد
استخدام مساعد شخصي غير رسمي بينما يستخدم رقم آخر شخصية عمل
ووكيل رد مختلفًا وصوت TTS مختلفًا.

تُحدد المسارات من رقم `To` المطلوب المقدم من المزود. يجب أن تكون المفاتيح
أرقام E.164. عند وصول مكالمة، يحل Voice Call المسار المطابق مرة واحدة،
ويخزن المسار المطابق في سجل المكالمة، ويعيد استخدام ذلك التكوين الفعلي
للتحية، ومسار الرد التلقائي الكلاسيكي، ومسار الاستشارة الآنية، وتشغيل TTS.
إذا لم يطابق أي مسار، يُستخدم تكوين Voice Call العام.
لا تستخدم المكالمات الصادرة `numbers`؛ مرر هدف الاتصال الصادر، والرسالة،
والجلسة صراحةً عند بدء المكالمة.

تدعم تجاوزات المسارات حاليًا:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

تُدمج قيمة مسار `tts` بعمق فوق تكوين `tts` العام في Voice Call، لذلك
يمكنك عادةً تجاوز صوت المزود فقط:

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

بالنسبة إلى الردود التلقائية، يضيف Voice Call عقد إخراج منطوقًا صارمًا إلى
موجه النظام:

```text
{"spoken":"..."}
```

يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات الموسومة كمحتوى تفكير/خطأ.
- يحلل JSON مباشرًا، أو JSON داخل أسوار، أو مفاتيح `"spoken"` مضمنة.
- يعود إلى النص العادي ويزيل فقرات المقدمة المحتملة الخاصة بالتخطيط/البيانات الوصفية.

يحافظ هذا على تركيز التشغيل المنطوق على النص الموجه للمتصل ويتجنب
تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، ترتبط معالجة الرسالة الأولى بحالة
التشغيل الحية:

- لا يُمنع مسح صف التدخل والرد التلقائي إلا أثناء نطق التحية الأولية فعليًا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في الصف لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال الدفق دون تأخير إضافي.
- يوقف تدخل المتصل التشغيل النشط ويمسح إدخالات TTS الخاصة بـ Twilio الموضوعة في الصف ولم يبدأ تشغيلها بعد. تُحل الإدخالات الممسوحة على أنها متخطاة، بحيث يمكن لمنطق الرد اللاحق المتابعة دون انتظار صوت لن يُشغّل أبدًا.
- تستخدم محادثات الصوت الآنية الدور الافتتاحي الخاص بالدفق الآني نفسه. لا ينشر Voice Call تحديث TwiML قديمًا باستخدام `<Say>` لتلك الرسالة الأولية، لذلك تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### فترة سماح قطع اتصال دفق Twilio

عند قطع اتصال دفق وسائط Twilio، ينتظر Voice Call **2000 مللي ثانية** قبل
إنهاء المكالمة تلقائيًا:

- إذا أعاد الدفق الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجل أي دفق من جديد بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## جامع المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدًا
Webhook نهائيًا (مثل مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية
هي `0` (معطل).

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
في ترويسات التمرير الموثوقة:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  قائمة سماح بالمضيفين من ترويسات التمرير.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  الثقة بترويسات التمرير دون قائمة سماح.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  الثقة بترويسات التمرير فقط عندما يطابق عنوان IP البعيد للطلب القائمة.
</ParamField>

حمايات إضافية:

- يتم تمكين **حماية Webhook من إعادة التشغيل** لـ Twilio وPlivo. تُقر طلبات Webhook الصالحة المعاد تشغيلها ولكن تُتخطى آثارها الجانبية.
- تتضمن أدوار محادثة Twilio رمزًا مميزًا لكل دور في استدعاءات `<Gather>`، لذلك لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها تلبية دور نص معلق أحدث.
- تُرفض طلبات Webhook غير المصادق عليها قبل قراءة الجسم عندما تكون ترويسات التوقيع المطلوبة من المزود مفقودة.
- يستخدم Webhook الخاص بـ voice-call ملف تعريف الجسم المشترك قبل المصادقة (64 كيلوبايت / 5 ثوانٍ) إضافةً إلى حد أقصى للطلبات الجارية لكل عنوان IP قبل التحقق من التوقيع.

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
إلى وقت تشغيل voice-call المملوك لـ Gateway حتى لا يربط CLI خادم
Webhook ثانيًا. إذا لم يكن أي Gateway قابلًا للوصول، تعود الأوامر إلى
وقت تشغيل CLI مستقل.

`latency` يقرأ `calls.jsonl` من مسار تخزين المكالمات الصوتية الافتراضي.
استخدم `--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لحصر
التحليل في آخر N سجلًا (الافتراضي 200). يتضمن الإخراج p50/p90/p99
لزمن انتقال الدور وأوقات انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`.

| الإجراء         | الوسيطات                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

يأتي هذا المستودع مع مستند skill مطابق في `skills/voice-call/SKILL.md`.

## Gateway RPC

| الطريقة              | الوسيطات                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

يكون `dtmfSequence` صالحًا فقط مع `mode: "conversation"`. يجب أن تستخدم المكالمات
في وضع الإشعار `voicecall.dtmf` بعد وجود المكالمة إذا احتاجت إلى أرقام
بعد الاتصال.

## استكشاف الأخطاء وإصلاحها

### فشل الإعداد في تعريض Webhook

شغّل الإعداد من البيئة نفسها التي تشغّل Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

بالنسبة إلى `twilio` و`telnyx` و`plivo`، يجب أن يكون `webhook-exposure` أخضر. يفشل
`publicUrl` المكوّن رغم ذلك عندما يشير إلى مساحة شبكة محلية أو خاصة،
لأن شركة الاتصالات لا تستطيع معاودة الاتصال بتلك العناوين. لا تستخدم
`localhost` أو `127.0.0.1` أو `0.0.0.0` أو `10.x` أو `172.16.x`-`172.31.x` أو
`192.168.x` أو `169.254.x` أو `fc00::/7` أو `fd00::/8` كقيمة `publicUrl`.

ترسل مكالمات Twilio الصادرة في وضع الإشعار TwiML الأولي الخاص بـ`<Say>` مباشرةً في
طلب إنشاء المكالمة، لذلك لا تعتمد أول رسالة منطوقة على جلب Twilio
لـ TwiML الخاص بـWebhook. ما يزال Webhook عام مطلوبًا لاستدعاءات الحالة،
ومكالمات المحادثة، وDTMF قبل الاتصال، والبث في الزمن الحقيقي، والتحكم في المكالمة
بعد الاتصال.

استخدم مسار تعريض عام واحدًا:

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

يجب أن تكون بيانات الاعتماد موجودة على مضيف Gateway. لا يؤثر تعديل ملف تعريف
الصدفة المحلي في Gateway قيد التشغيل بالفعل إلى أن يعاد تشغيله أو يعاد تحميل
بيئته.

### تبدأ المكالمات لكن Webhooks الخاصة بالمزوّد لا تصل

تأكد من أن وحدة تحكم المزوّد تشير إلى عنوان URL العام الدقيق لـWebhook:

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
- يوجّه جدار الحماية أو DNS اسم المضيف العام إلى مكان غير Gateway.
- أعيد تشغيل Gateway من دون تمكين Plugin المكالمات الصوتية.

عندما يكون وكيل عكسي أو نفق أمام Gateway، اضبط
`webhookSecurity.allowedHosts` على اسم المضيف العام، أو استخدم
`webhookSecurity.trustedProxyIPs` لعنوان وكيل معروف. استخدم
`webhookSecurity.trustForwardingHeaders` فقط عندما تكون حدود الوكيل تحت
سيطرتك.

### فشل التحقق من التوقيع

تُفحص تواقيع المزوّد مقابل عنوان URL العام الذي يعيد OpenClaw بناءه
من الطلب الوارد. إذا فشلت التواقيع:

- تأكد من أن عنوان URL الخاص بـWebhook لدى المزوّد يطابق `publicUrl` تمامًا، بما في ذلك
  المخطط والمضيف والمسار.
- بالنسبة إلى عناوين URL في الطبقة المجانية من ngrok، حدّث `publicUrl` عند تغيّر اسم مضيف النفق.
- تأكد من أن الوكيل يحافظ على ترويسات المضيف والبروتوكول الأصلية، أو اضبط
  `webhookSecurity.allowedHosts`.
- لا تمكّن `skipSignatureVerification` خارج الاختبار المحلي.

### فشل انضمام Google Meet عبر Twilio

يستخدم Google Meet هذا Plugin لانضمامات الاتصال الهاتفي عبر Twilio. تحقق أولًا من Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

ثم تحقق صراحةً من ناقل Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

إذا كان Voice Call أخضر لكن مشارك Meet لا ينضم أبدًا، فتحقق من رقم الاتصال الهاتفي
لـMeet، ورمز PIN، و`--dtmf-sequence`. قد تكون المكالمة الهاتفية سليمة بينما
يرفض الاجتماع تسلسل DTMF غير صحيح أو يتجاهله.

يمرر Google Meet تسلسل DTMF الخاص بـMeet ونص المقدمة إلى `voicecall.start`.
بالنسبة إلى مكالمات Twilio، يقدّم Voice Call TwiML الخاص بـDTMF أولًا، ثم يعيد التوجيه إلى
Webhook، ثم يفتح بث الوسائط في الزمن الحقيقي بحيث تُنشأ المقدمة المحفوظة
بعد انضمام المشارك الهاتفي إلى الاجتماع.

استخدم `openclaw logs --follow` لتتبع المرحلة الحية. يسجل انضمام Twilio Meet
السليم هذا الترتيب:

- يفوض Google Meet انضمام Twilio إلى Voice Call.
- يخزن Voice Call TwiML الخاص بـDTMF قبل الاتصال.
- يُستهلك TwiML الأولي من Twilio ويُقدّم قبل معالجة الزمن الحقيقي.
- يقدّم Voice Call TwiML الخاص بالزمن الحقيقي لمكالمة Twilio.
- يبدأ جسر الزمن الحقيقي مع وضع التحية الأولية في قائمة الانتظار.

ما يزال `openclaw voicecall tail` يعرض سجلات المكالمات المستمرة؛ وهو مفيد
لحالة المكالمة والنصوص، لكن لا يظهر فيه كل انتقال Webhook/زمن حقيقي.

### مكالمة الزمن الحقيقي بلا كلام

تأكد من تمكين وضع صوت واحد فقط. لا يمكن أن تكون `realtime.enabled` و
`streaming.enabled` كلاهما true.

بالنسبة إلى مكالمات Twilio في الزمن الحقيقي، تحقق أيضًا من:

- تحميل Plugin مزوّد الزمن الحقيقي وتسجيله.
- أن `realtime.provider` غير مضبوط أو يذكر مزوّدًا مسجلًا.
- توفر مفتاح API الخاص بالمزوّد لعملية Gateway.
- أن `openclaw logs --follow` يعرض تقديم TwiML للزمن الحقيقي، وبدء جسر الزمن الحقيقي،
  ووضع التحية الأولية في قائمة الانتظار.

## ذات صلة

- [وضع التحدث](/ar/nodes/talk)
- [تحويل النص إلى كلام](/ar/tools/tts)
- [التنبيه الصوتي](/ar/nodes/voicewake)
