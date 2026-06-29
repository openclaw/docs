---
read_when:
    - आप OpenClaw से आउटबाउंड वॉयस कॉल करना चाहते हैं
    - आप voice-call Plugin को कॉन्फ़िगर या विकसित कर रहे हैं
    - आपको टेलीफोनी पर रीयल-टाइम वॉयस या स्ट्रीमिंग ट्रांसक्रिप्शन चाहिए
sidebarTitle: Voice call
summary: Twilio, Telnyx, या Plivo के ज़रिए आउटबाउंड वॉइस कॉल करें और इनबाउंड वॉइस कॉल स्वीकार करें, वैकल्पिक रीयल-टाइम वॉइस और स्ट्रीमिंग ट्रांसक्रिप्शन के साथ
title: वॉइस कॉल Plugin
x-i18n:
    generated_at: "2026-06-28T23:55:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw के लिए Plugin के माध्यम से वॉयस कॉल। आउटबाउंड सूचनाओं,
मल्टी-टर्न बातचीत, फुल-डुप्लेक्स रियलटाइम वॉयस, स्ट्रीमिंग
ट्रांसक्रिप्शन, और allowlist नीतियों के साथ इनबाउंड कॉल का समर्थन करता है।

**मौजूदा प्रदाता:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/no network).

<Note>
Voice Call Plugin **Gateway प्रक्रिया के अंदर** चलता है। यदि आप रिमोट
Gateway का उपयोग करते हैं, तो Gateway चलाने वाली मशीन पर Plugin इंस्टॉल
और कॉन्फ़िगर करें, फिर उसे लोड करने के लिए Gateway रीस्टार्ट करें।
</Note>

## त्वरित शुरुआत

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    <Tabs>
      <Tab title="npm से">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="स्थानीय फ़ोल्डर से (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    मौजूदा आधिकारिक रिलीज़ टैग का अनुसरण करने के लिए bare package का उपयोग करें।
    सटीक संस्करण केवल तब pin करें जब आपको पुनरुत्पाद्य इंस्टॉल चाहिए।

    इसके बाद Gateway रीस्टार्ट करें ताकि Plugin लोड हो सके।

  </Step>
  <Step title="प्रदाता और Webhook कॉन्फ़िगर करें">
    `plugins.entries.voice-call.config` के अंतर्गत config सेट करें (पूरा आकार
    नीचे [कॉन्फ़िगरेशन](#configuration) में देखें)। न्यूनतम रूप से:
    `provider`, प्रदाता credentials, `fromNumber`, और सार्वजनिक रूप से
    पहुंच योग्य Webhook URL चाहिए।
  </Step>
  <Step title="सेटअप सत्यापित करें">
    ```bash
    openclaw voicecall setup
    ```

    डिफ़ॉल्ट आउटपुट chat logs और terminals में पढ़ने योग्य होता है। यह
    Plugin enablement, प्रदाता credentials, Webhook exposure, और यह जांचता है
    कि केवल एक audio mode (`streaming` या `realtime`) सक्रिय है। scripts के
    लिए `--json` का उपयोग करें।

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    दोनों डिफ़ॉल्ट रूप से dry runs हैं। वास्तव में छोटा outbound notify call
    करने के लिए `--yes` जोड़ें:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, और Plivo के लिए, setup को **सार्वजनिक Webhook URL** तक resolve
होना चाहिए। यदि `publicUrl`, tunnel URL, Tailscale URL, या serve fallback
loopback या private network space तक resolve होता है, तो setup ऐसे प्रदाता को
शुरू करने के बजाय fail हो जाता है जो carrier webhooks प्राप्त नहीं कर सकता।
</Warning>

## कॉन्फ़िगरेशन

यदि `enabled: true` है लेकिन चुने गए प्रदाता में credentials नहीं हैं, तो
Gateway startup missing keys के साथ setup-incomplete चेतावनी log करता है और
runtime शुरू करना छोड़ देता है। Commands, RPC calls, और agent tools उपयोग किए
जाने पर अब भी सटीक missing provider configuration लौटाते हैं।

<Note>
Voice-call credentials SecretRefs स्वीकार करते हैं। `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, और `plugins.entries.voice-call.config.tts.providers.*.apiKey` standard SecretRef surface के माध्यम से resolve होते हैं; [SecretRef credential surface](/hi/reference/secretref-credential-surface) देखें।
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
  <Accordion title="प्रदाता exposure और सुरक्षा नोट्स">
    - Twilio, Telnyx, और Plivo सभी को **सार्वजनिक रूप से पहुंच योग्य** Webhook URL चाहिए।
    - `mock` एक local dev provider है (कोई network calls नहीं)।
    - Telnyx को `telnyx.publicKey` (या `TELNYX_PUBLIC_KEY`) चाहिए, जब तक `skipSignatureVerification` true न हो।
    - `skipSignatureVerification` केवल local testing के लिए है।
    - ngrok free tier पर, `publicUrl` को exact ngrok URL पर सेट करें; signature verification हमेशा enforce होता है।
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` invalid signatures वाले Twilio webhooks को **केवल** तब अनुमति देता है जब `tunnel.provider="ngrok"` और `serve.bind` loopback हो (ngrok local agent)। केवल local dev।
    - Ngrok free-tier URLs बदल सकते हैं या interstitial behaviour जोड़ सकते हैं; यदि `publicUrl` drift होता है, तो Twilio signatures fail हो जाते हैं। Production: stable domain या Tailscale funnel को प्राथमिकता दें।

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` उन sockets को बंद करता है जो कभी valid `start` frame नहीं भेजते।
    - `streaming.maxPendingConnections` कुल unauthenticated pre-start sockets को cap करता है।
    - `streaming.maxPendingConnectionsPerIp` प्रति source IP unauthenticated pre-start sockets को cap करता है।
    - `streaming.maxConnections` कुल open media stream sockets (pending + active) को cap करता है।

  </Accordion>
  <Accordion title="Legacy config migrations">
    `provider: "log"`, `twilio.from`, या legacy
    `streaming.*` OpenAI keys का उपयोग करने वाले पुराने configs को `openclaw doctor --fix`
    द्वारा rewrite किया जाता है। Runtime fallback अभी के लिए पुराने voice-call keys
    स्वीकार करता है, लेकिन rewrite path `openclaw doctor --fix` है और compat shim
    अस्थायी है।

    Auto-migrated streaming keys:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Session scope

डिफ़ॉल्ट रूप से, Voice Call `sessionScope: "per-phone"` का उपयोग करता है ताकि
उसी caller से repeat calls conversation memory बनाए रखें। जब हर carrier call
fresh context से शुरू होनी चाहिए, जैसे reception, booking, IVR, या Google Meet
bridge flows जहां वही phone number अलग meetings का प्रतिनिधित्व कर सकता है,
तब `sessionScope: "per-call"` सेट करें।

Voice Call generated session keys को configured agent namespace
(`agent:<agentId>:voice:*`) के अंतर्गत store करता है ताकि restarts के बाद
Gateway session-key canonicalization के बावजूद call memory बनी रहे। Raw explicit
integration keys उसी agent namespace का उपयोग करती हैं। canonical
`agent:<configuredAgentId>:*` key उस owner को बनाए रखती है, और उसके main aliases
core `session.mainKey` और global scope का सम्मान करते हैं। Foreign या malformed
`agent:*` input को configured agent के अंतर्गत opaque key की तरह scoped किया जाता है;
`global` और `unknown` global sentinels बने रहते हैं। Gateway startup default या
`{agentId}`-templated stores में पुराने raw keys को promote करता है जहां path एक
owner साबित करता है। Fixed custom stores में, ambiguous legacy rows untouched
रहते हैं क्योंकि उनमें owner चुनने के लिए पर्याप्त जानकारी नहीं होती; नए calls
canonical agent-scoped history का उपयोग करते हैं।

## Realtime voice conversations

`realtime` live call audio के लिए full-duplex realtime voice provider चुनता है।
यह `streaming` से अलग है, जो केवल audio को realtime transcription providers को
forward करता है।

<Warning>
`realtime.enabled` को `streaming.enabled` के साथ combine नहीं किया जा सकता।
हर call के लिए एक audio mode चुनें।
</Warning>

मौजूदा runtime व्यवहार:

- `realtime.enabled` Twilio Media Streams के लिए समर्थित है।
- `realtime.provider` वैकल्पिक है। यदि unset है, तो Voice Call पहला registered realtime voice provider उपयोग करता है।
- Bundled realtime voice providers: Google Gemini Live (`google`) और OpenAI (`openai`), जो उनके provider plugins द्वारा registered हैं।
- Provider-owned raw config `realtime.providers.<providerId>` के अंतर्गत रहता है।
- Voice Call shared `openclaw_agent_consult` realtime tool को डिफ़ॉल्ट रूप से expose करता है। जब caller deeper reasoning, current information, या सामान्य OpenClaw tools मांगता है, तो realtime model इसे call कर सकता है।
- `realtime.consultPolicy` वैकल्पिक रूप से guidance जोड़ता है कि realtime model को `openclaw_agent_consult` कब call करना चाहिए।
- `realtime.agentContext.enabled` default-off है। enabled होने पर, Voice Call session setup पर realtime provider instructions में bounded agent identity और selected workspace-file capsule inject करता है।
- `realtime.fastContext.enabled` default-off है। enabled होने पर, Voice Call पहले consult question के लिए indexed memory/session context खोजता है और full consult agent पर fallback करने से पहले उन snippets को `realtime.fastContext.timeoutMs` के भीतर realtime model को लौटाता है, केवल यदि `realtime.fastContext.fallbackToConsult` true हो।
- यदि `realtime.provider` unregistered provider की ओर point करता है, या कोई realtime voice provider registered नहीं है, तो Voice Call पूरे Plugin को fail करने के बजाय warning log करता है और realtime media छोड़ देता है।
- Consult session keys उपलब्ध होने पर stored call session का reuse करती हैं, फिर configured `sessionScope` पर fallback करती हैं (डिफ़ॉल्ट रूप से `per-phone`, या isolated calls के लिए `per-call`)।

### Tool policy

`realtime.toolPolicy` consult run को control करता है:

| नीति           | व्यवहार                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult tool expose करें और regular agent को `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, और `memory_get` तक सीमित करें। |
| `owner`          | consult tool expose करें और regular agent को normal agent tool policy उपयोग करने दें।                                                      |
| `none`           | consult tool expose न करें। Custom `realtime.tools` अब भी realtime provider तक pass through होते हैं।                               |

`realtime.consultPolicy` केवल realtime model instructions को control करता है:

| नीति        | Guidance                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | default prompt रखें और provider को decide करने दें कि consult tool कब call करना है।              |
| `substantive` | simple conversational glue का सीधे answer दें और facts, memory, tools, या context से पहले consult करें। |
| `always`      | हर substantive answer से पहले consult करें।                                                        |

### Agent voice context

सामान्य टर्न पर पूर्ण एजेंट-कंसल्ट राउंड ट्रिप का खर्च किए बिना, जब वॉइस ब्रिज को कॉन्फ़िगर किए गए OpenClaw एजेंट जैसा सुनाई देना चाहिए, तब `realtime.agentContext` सक्षम करें। संदर्भ कैप्सूल रीयलटाइम सत्र बनाते समय एक बार जोड़ा जाता है, इसलिए यह प्रति-टर्न विलंबता नहीं जोड़ता। `openclaw_agent_consult` को की गई कॉल अब भी पूरा OpenClaw एजेंट चलाती हैं और इन्हें टूल कार्य, वर्तमान जानकारी, मेमोरी लुकअप, या workspace स्थिति के लिए उपयोग किया जाना चाहिए।

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

### रीयलटाइम प्रदाता उदाहरण

<Tabs>
  <Tab title="Google Gemini Live">
    डिफ़ॉल्ट: API कुंजी `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, या `GOOGLE_GENERATIVE_AI_API_KEY` से; मॉडल
    `gemini-2.5-flash-native-audio-preview-12-2025`; वॉइस `Kore`।
    लंबी, फिर से कनेक्ट हो सकने वाली कॉल के लिए `sessionResumption` और
    `contextWindowCompression` डिफ़ॉल्ट रूप से चालू रहते हैं। टेलीफ़ोनी ऑडियो पर
    तेज़ टर्न-टेकिंग ट्यून करने के लिए `silenceDurationMs`, `startSensitivity`, और
    `endSensitivity` का उपयोग करें।

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

प्रदाता-विशिष्ट रीयलटाइम वॉइस विकल्पों के लिए [Google प्रदाता](/hi/providers/google) और
[OpenAI प्रदाता](/hi/providers/openai) देखें।

## स्ट्रीमिंग ट्रांसक्रिप्शन

`streaming` लाइव कॉल ऑडियो के लिए एक रीयलटाइम ट्रांसक्रिप्शन प्रदाता चुनता है।

वर्तमान runtime व्यवहार:

- `streaming.provider` वैकल्पिक है। यदि सेट नहीं है, तो वॉइस कॉल पहले पंजीकृत रीयलटाइम ट्रांसक्रिप्शन प्रदाता का उपयोग करता है।
- बंडल किए गए रीयलटाइम ट्रांसक्रिप्शन प्रदाता: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), और xAI (`xai`), जिन्हें उनके प्रदाता plugins द्वारा पंजीकृत किया जाता है।
- प्रदाता-स्वामित्व वाला raw config `streaming.providers.<providerId>` के अंतर्गत रहता है।
- Twilio द्वारा स्वीकृत stream `start` संदेश भेजने के बाद, वॉइस कॉल stream को तुरंत पंजीकृत करता है, प्रदाता के कनेक्ट होने के दौरान inbound media को ट्रांसक्रिप्शन प्रदाता के माध्यम से queue करता है, और प्रारंभिक greeting केवल रीयलटाइम ट्रांसक्रिप्शन तैयार होने के बाद शुरू करता है।
- यदि `streaming.provider` किसी अपंजीकृत प्रदाता की ओर इशारा करता है, या कोई भी पंजीकृत नहीं है, तो वॉइस कॉल चेतावनी log करता है और पूरे plugin को विफल करने के बजाय media streaming छोड़ देता है।

### स्ट्रीमिंग प्रदाता उदाहरण

<Tabs>
  <Tab title="OpenAI">
    डिफ़ॉल्ट: API कुंजी `streaming.providers.openai.apiKey` या
    `OPENAI_API_KEY`; मॉडल `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`।

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
    डिफ़ॉल्ट: API कुंजी `streaming.providers.xai.apiKey` या `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; encoding `mulaw`; sample rate `8000`;
    `endpointingMs: 800`; `interimResults: true`।

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

## कॉल के लिए TTS

वॉइस कॉल, कॉल पर streaming speech के लिए core `messages.tts` कॉन्फ़िगरेशन का उपयोग करता है। आप इसे plugin config के अंतर्गत **उसी shape** से override कर सकते हैं — यह `messages.tts` के साथ deep-merge होता है।

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
**Microsoft speech को voice calls के लिए अनदेखा किया जाता है।** टेलीफ़ोनी ऑडियो को PCM चाहिए;
वर्तमान Microsoft transport टेलीफ़ोनी PCM output उजागर नहीं करता।
</Warning>

व्यवहार नोट्स:

- plugin config के अंदर legacy `tts.<provider>` कुंजियां (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` द्वारा repair की जाती हैं; committed config को `tts.providers.<provider>` का उपयोग करना चाहिए।
- Twilio media streaming सक्षम होने पर core TTS का उपयोग किया जाता है; अन्यथा calls प्रदाता-native voices पर fallback करती हैं।
- यदि Twilio media stream पहले से सक्रिय है, तो वॉइस कॉल TwiML `<Say>` पर fallback नहीं करता। यदि उस स्थिति में telephony TTS उपलब्ध नहीं है, तो playback request दो playback paths मिलाने के बजाय विफल हो जाती है।
- जब telephony TTS किसी secondary provider पर fallback करता है, तो वॉइस कॉल debugging के लिए provider chain (`from`, `to`, `attempts`) के साथ चेतावनी log करता है।
- जब Twilio barge-in या stream teardown pending TTS queue को clear करता है, तो queued playback requests, playback completion की प्रतीक्षा कर रहे callers को अटकाने के बजाय settle हो जाती हैं।

### TTS उदाहरण

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

## Inbound calls

Inbound policy का default `disabled` है। inbound calls सक्षम करने के लिए, सेट करें:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` कम-आश्वासन वाला caller-ID screen है। Plugin प्रदाता द्वारा दिए गए `From` value को normalize करता है और उसे
`allowFrom` से compare करता है। Webhook verification प्रदाता delivery और
payload integrity को authenticate करता है, लेकिन यह PSTN/VoIP caller-number
ownership को **सिद्ध नहीं** करता। `allowFrom` को caller-ID filtering मानें, strong caller
identity नहीं।
</Warning>

Auto-responses एजेंट system का उपयोग करते हैं। `responseModel`,
`responseSystemPrompt`, और `responseTimeoutMs` से ट्यून करें।

### प्रति-number Routing

जब एक वॉइस कॉल Plugin कई phone numbers के लिए calls प्राप्त करता है और हर number को अलग line की तरह व्यवहार करना चाहिए, तब `numbers` का उपयोग करें। उदाहरण के लिए, एक number casual personal assistant का उपयोग कर सकता है, जबकि दूसरा business persona, अलग response agent, और अलग TTS voice का उपयोग करता है।

Routes प्रदाता द्वारा दिए गए dialed `To` number से चुने जाते हैं। Keys
E.164 numbers होनी चाहिए। जब call आती है, वॉइस कॉल matching route को एक बार resolve करता है,
matched route को call record पर store करता है, और greeting, classic auto-response path, realtime consult path, और TTS
playback के लिए उसी effective config को reuse करता है। यदि कोई route match नहीं करता, तो global वॉइस कॉल config का उपयोग होता है।
Outbound calls `numbers` का उपयोग नहीं करतीं; call शुरू करते समय outbound target, message, और
session स्पष्ट रूप से pass करें।

Route overrides वर्तमान में support करते हैं:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` route value global वॉइस कॉल `tts` config के ऊपर deep-merge होती है, इसलिए
आप आमतौर पर केवल provider voice override कर सकते हैं:

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

### बोले गए output contract

Auto-responses के लिए, वॉइस कॉल system prompt में एक strict spoken-output contract जोड़ता है:

```text
{"spoken":"..."}
```

वॉइस कॉल speech text को defensive ढंग से extract करता है:

- reasoning/error content के रूप में चिह्नित payloads को अनदेखा करता है।
- direct JSON, fenced JSON, या inline `"spoken"` keys parse करता है।
- plain text पर fallback करता है और संभावित planning/meta lead-in paragraphs हटाता है।

यह spoken playback को caller-facing text पर केंद्रित रखता है और
planning text को audio में leak होने से बचाता है।

### Conversation startup behavior

Outbound `conversation` calls के लिए, first-message handling live
playback state से बंधी है:

- Barge-in queue clear और auto-response केवल तब suppress होते हैं जब initial greeting सक्रिय रूप से बोल रहा हो।
- यदि initial playback विफल हो जाता है, तो call `listening` पर लौट आती है और initial message retry के लिए queued रहता है।
- Twilio streaming के लिए initial playback stream connect पर बिना extra delay के शुरू होता है।
- Barge-in active playback को abort करता है और queued-but-not-yet-playing Twilio TTS entries को clear करता है। Cleared entries skipped के रूप में resolve होती हैं, ताकि follow-up response logic कभी न चलने वाले audio की प्रतीक्षा किए बिना जारी रह सके।
- Realtime voice conversations realtime stream के अपने opening turn का उपयोग करती हैं। वॉइस कॉल उस initial message के लिए legacy `<Say>` TwiML update post **नहीं** करता, इसलिए outbound `<Connect><Stream>` sessions attached रहते हैं।

### Twilio stream disconnect grace

जब Twilio मीडिया स्ट्रीम डिस्कनेक्ट होती है, Voice Call कॉल को
अपने-आप समाप्त करने से पहले **2000 ms** प्रतीक्षा करता है:

- अगर उस अवधि में स्ट्रीम फिर से कनेक्ट हो जाती है, तो auto-end रद्द कर दिया जाता है।
- अगर grace period के बाद कोई स्ट्रीम फिर से register नहीं होती, तो अटकी हुई सक्रिय कॉलों को रोकने के लिए कॉल समाप्त कर दी जाती है।

## पुरानी कॉल reaper

उन कॉलों को समाप्त करने के लिए `staleCallReaperSeconds` का उपयोग करें जिन्हें कभी terminal
webhook नहीं मिलता (उदाहरण के लिए, notify-mode कॉल जो कभी पूरी नहीं होतीं)। डिफ़ॉल्ट
`0` है (disabled)।

अनुशंसित रेंज:

- **Production:** notify-style flows के लिए `120`–`300` सेकंड।
- इस मान को **`maxDurationSeconds` से अधिक** रखें ताकि सामान्य कॉल पूरी हो सकें। एक अच्छा शुरुआती मान `maxDurationSeconds + 30–60` सेकंड है।

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

## Webhook सुरक्षा

जब Gateway के सामने कोई proxy या tunnel होता है, तो Plugin signature verification के लिए
public URL को फिर से बनाता है। ये विकल्प नियंत्रित करते हैं कि कौन-से forwarded headers
trusted हैं:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  forwarding headers से hosts को allowlist करें।
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  allowlist के बिना forwarded headers पर trust करें।
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  forwarded headers पर केवल तब trust करें जब request remote IP सूची से match करे।
</ParamField>

अतिरिक्त सुरक्षाएं:

- Twilio और Plivo के लिए Webhook **replay protection** enabled है। replay की गई valid webhook requests को acknowledge किया जाता है, लेकिन side effects के लिए skip किया जाता है।
- Twilio conversation turns में `<Gather>` callbacks में प्रति-turn token शामिल होता है, इसलिए stale/replayed speech callbacks किसी नए pending transcript turn को satisfy नहीं कर सकते।
- जब provider के required signature headers missing होते हैं, तो unauthenticated webhook requests को body reads से पहले reject कर दिया जाता है।
- voice-call webhook shared pre-auth body profile (64 KB / 5 सेकंड) और signature verification से पहले per-IP in-flight cap का उपयोग करता है।

stable public host के साथ उदाहरण:

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

जब Gateway पहले से चल रहा हो, operational `voicecall` commands Gateway-owned
voice-call runtime को delegate करते हैं ताकि CLI दूसरा webhook server bind न करे।
अगर कोई Gateway reachable नहीं है, तो commands standalone CLI runtime पर fall back करती हैं।

`latency` default voice-call storage path से `calls.jsonl` पढ़ता है।
किसी अलग log की ओर point करने के लिए `--file <path>` और analysis को अंतिम N records
तक सीमित करने के लिए `--last <n>` का उपयोग करें (default 200)। Output में turn latency
और listen-wait times के लिए p50/p90/p99 शामिल होते हैं।

## Agent tool

Tool नाम: `voice_call`.

| Action          | Args                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

voice-call Plugin एक matching agent skill के साथ ship होता है।

## Gateway RPC

| Method               | Args                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` केवल `mode: "conversation"` के साथ valid है। Notify-mode calls को
post-connect digits की आवश्यकता होने पर call मौजूद होने के बाद `voicecall.dtmf` का
उपयोग करना चाहिए।

## समस्या निवारण

### Setup webhook exposure में fail होता है

उसी environment से setup चलाएं जो Gateway चलाता है:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx`, और `plivo` के लिए, `webhook-exposure` green होना चाहिए। configured
`publicUrl` तब भी fail होता है जब वह local या private network space की ओर point करता है,
क्योंकि carrier उन addresses में callback नहीं कर सकता। `publicUrl` के रूप में
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, या `fd00::/8` का उपयोग न करें।

Twilio notify-mode outbound calls अपना initial `<Say>` TwiML सीधे create-call request में
भेजती हैं, इसलिए पहला spoken message Twilio के webhook TwiML fetch करने पर depend नहीं करता।
status callbacks, conversation calls, pre-connect DTMF, realtime streams, और post-connect call
control के लिए public webhook फिर भी required है।

एक public exposure path का उपयोग करें:

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

config बदलने के बाद, Gateway को restart या reload करें, फिर चलाएं:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` dry run है, जब तक आप `--yes` pass नहीं करते।

### Provider credentials fail होते हैं

selected provider और required credential fields जांचें:

- Twilio: `twilio.accountSid`, `twilio.authToken`, और `fromNumber`, या
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, और `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, और
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken`, और `fromNumber`.

Credentials Gateway host पर मौजूद होने चाहिए। local shell profile को edit करने से
पहले से चल रहे Gateway पर असर नहीं पड़ता, जब तक वह restart या अपना environment reload नहीं करता।

### Calls start होती हैं लेकिन provider webhooks नहीं आते

Confirm करें कि provider console exact public webhook URL की ओर point करता है:

```text
https://voice.example.com/voice/webhook
```

फिर runtime state inspect करें:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

सामान्य कारण:

- `publicUrl`, `serve.path` से अलग path की ओर point करता है।
- Gateway start होने के बाद tunnel URL बदल गया।
- कोई proxy request forward करता है लेकिन host/proto headers strip या rewrite कर देता है।
- Firewall या DNS public hostname को Gateway के अलावा कहीं और route करता है।
- Gateway को Voice Call Plugin enabled किए बिना restart किया गया था।

जब Gateway के सामने reverse proxy या tunnel हो, तो `webhookSecurity.allowedHosts` को
public hostname पर set करें, या known proxy address के लिए `webhookSecurity.trustedProxyIPs`
का उपयोग करें। `webhookSecurity.trustForwardingHeaders` का उपयोग केवल तब करें जब proxy boundary
आपके control में हो।

### Signature verification fail होता है

Provider signatures उस public URL के against check किए जाते हैं जिसे OpenClaw incoming request
से reconstruct करता है। अगर signatures fail हों:

- Confirm करें कि provider webhook URL scheme, host, और path सहित `publicUrl` से exactly match करता है।
- ngrok free-tier URLs के लिए, tunnel hostname बदलने पर `publicUrl` update करें।
- Ensure करें कि proxy original host और proto headers preserve करता है, या
  `webhookSecurity.allowedHosts` configure करें।
- local testing के बाहर `skipSignatureVerification` enable न करें।

### Google Meet Twilio joins fail होते हैं

Google Meet, Twilio dial-in joins के लिए इस Plugin का उपयोग करता है। पहले Voice Call verify करें:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

फिर Google Meet transport को explicit रूप से verify करें:

```bash
openclaw googlemeet setup --transport twilio
```

अगर Voice Call green है लेकिन Meet participant कभी join नहीं करता, तो Meet
dial-in number, PIN, और `--dtmf-sequence` जांचें। phone call healthy हो सकती है जबकि
meeting incorrect DTMF sequence को reject या ignore करे।

Google Meet, `voicecall.start` के माध्यम से pre-connect DTMF sequence के साथ Twilio phone leg
start करता है। PIN-derived sequences में leading Twilio wait digits के रूप में Google Meet Plugin का
`voiceCall.dtmfDelayMs` शामिल होता है। default 12 सेकंड है क्योंकि Meet dial-in prompts देर से आ सकते हैं।
Voice Call फिर intro greeting requested होने से पहले realtime handling पर वापस redirect करता है।

live phase trace के लिए `openclaw logs --follow` का उपयोग करें। healthy Twilio Meet
join इस order को log करता है:

- Google Meet Twilio join को Voice Call को delegate करता है।
- Voice Call pre-connect DTMF TwiML store करता है।
- Twilio initial TwiML consume और serve होता है, realtime handling से पहले।
- Voice Call Twilio call के लिए realtime TwiML serve करता है।
- Google Meet post-DTMF delay के बाद `voicecall.speak` के साथ intro speech request करता है।

`openclaw voicecall tail` अभी भी persisted call records दिखाता है; यह
call state और transcripts के लिए उपयोगी है, लेकिन हर webhook/realtime transition
वहां दिखाई नहीं देता।

### Realtime call में speech नहीं है

Confirm करें कि केवल एक audio mode enabled है। `realtime.enabled` और
`streaming.enabled` दोनों true नहीं हो सकते।

realtime Twilio calls के लिए, यह भी verify करें:

- एक realtime provider Plugin loaded और registered है।
- `realtime.provider` unset है या किसी registered provider को नाम देता है।
- provider API key Gateway process के लिए available है।
- `openclaw logs --follow` दिखाता है कि realtime TwiML served है, realtime bridge
  started है, और initial greeting queued है।

## संबंधित

- [Talk mode](/hi/nodes/talk)
- [Text-to-speech](/hi/tools/tts)
- [Voice wake](/hi/nodes/voicewake)
