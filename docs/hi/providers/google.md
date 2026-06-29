---
read_when:
    - आप OpenClaw के साथ Google Gemini मॉडल का उपयोग करना चाहते हैं
    - आपको API कुंजी या OAuth प्रमाणीकरण प्रवाह की आवश्यकता है
summary: Google Gemini सेटअप (API कुंजी + OAuth, इमेज जनरेशन, मीडिया समझ, TTS, वेब खोज)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-28T23:58:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Google plugin, Google AI Studio के माध्यम से Gemini मॉडलों तक पहुंच देता है, साथ ही
image generation, media understanding (image/audio/video), text-to-speech, और
Gemini Grounding के जरिए web search भी देता है.

- प्रदाता: `google`
- प्रमाणीकरण: `GEMINI_API_KEY` या `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime विकल्प: provider/model `agentRuntime.id: "google-gemini-cli"`
  Gemini CLI OAuth का फिर से उपयोग करता है, जबकि model refs को `google/*` के रूप में canonical रखता है.

## शुरू करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और सेटअप चरणों का पालन करें.

<Tabs>
  <Tab title="API key">
    **इसके लिए सर्वोत्तम:** Google AI Studio के माध्यम से मानक Gemini API पहुंच.

    <Steps>
      <Step title="ऑनबोर्डिंग चलाएं">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        या key सीधे पास करें:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="एक default model सेट करें">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Environment variables `GEMINI_API_KEY` और `GOOGLE_API_KEY` दोनों स्वीकार किए जाते हैं. जो भी आपने पहले से configure किया है, उसका उपयोग करें.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **इसके लिए सर्वोत्तम:** अलग API key के बजाय PKCE OAuth के जरिए मौजूदा Gemini CLI login का फिर से उपयोग करना.

    <Warning>
    `google-gemini-cli` provider एक unofficial integration है. कुछ users
    इस तरह OAuth उपयोग करने पर account restrictions की रिपोर्ट करते हैं. अपने जोखिम पर उपयोग करें.
    </Warning>

    <Steps>
      <Step title="Gemini CLI install करें">
        स्थानीय `gemini` command `PATH` पर उपलब्ध होनी चाहिए.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw, Homebrew installs और global npm installs दोनों का समर्थन करता है, जिसमें
        आम Windows/npm layouts शामिल हैं.
      </Step>
      <Step title="OAuth के जरिए log in करें">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="सत्यापित करें कि model उपलब्ध है">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Default model: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    Gemini 3.1 Pro का Gemini API model id `gemini-3.1-pro-preview` है. OpenClaw सुविधा alias के रूप में छोटे `google/gemini-3.1-pro` को स्वीकार करता है और provider calls से पहले उसे normalize करता है.

    **Environment variables:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (या `GEMINI_CLI_*` variants.)

    <Note>
    यदि login के बाद Gemini CLI OAuth requests fail होती हैं, तो gateway host पर `GOOGLE_CLOUD_PROJECT` या
    `GOOGLE_CLOUD_PROJECT_ID` सेट करें और retry करें.
    </Note>

    <Note>
    यदि browser flow शुरू होने से पहले login fail होता है, तो सुनिश्चित करें कि स्थानीय `gemini`
    command install है और `PATH` पर है.
    </Note>

    `google-gemini-cli/*` model refs legacy compatibility aliases हैं. नए
    configs को स्थानीय Gemini CLI execution चाहिए होने पर `google/*` model refs और `google-gemini-cli`
    runtime का उपयोग करना चाहिए.

  </Tab>
</Tabs>

## क्षमताएं

| क्षमता                 | समर्थित                        |
| ---------------------- | ----------------------------- |
| Chat completions       | हाँ                           |
| Image generation       | हाँ                           |
| Music generation       | हाँ                           |
| Text-to-speech         | हाँ                           |
| Realtime voice         | हाँ (Google Live API)         |
| Image understanding    | हाँ                           |
| Audio transcription    | हाँ                           |
| Video understanding    | हाँ                           |
| Web search (Grounding) | हाँ                           |
| Thinking/reasoning     | हाँ (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 models         | हाँ                           |

## Web search

Bundled `gemini` web-search provider, Gemini Google Search grounding का उपयोग करता है.
`plugins.entries.google.config.webSearch` के अंतर्गत एक dedicated search key configure करें,
या `GEMINI_API_KEY` के बाद इसे `models.providers.google.apiKey` का फिर से उपयोग करने दें:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Credential precedence dedicated `webSearch.apiKey`, फिर `GEMINI_API_KEY`,
फिर `models.providers.google.apiKey` है. `webSearch.baseUrl` optional है और
operator proxies या compatible Gemini API endpoints के लिए मौजूद है; जब omitted हो,
Gemini web search `models.providers.google.baseUrl` का फिर से उपयोग करता है. Provider-specific tool behavior के लिए
[Gemini search](/hi/tools/gemini-search) देखें.

<Tip>
Gemini 3 models `thinkingBudget` के बजाय `thinkingLevel` का उपयोग करते हैं. OpenClaw
Gemini 3, Gemini 3.1, और `gemini-*-latest` alias reasoning controls को
`thinkingLevel` पर map करता है, ताकि default/low-latency runs disabled
`thinkingBudget` values न भेजें.

`/think adaptive` fixed OpenClaw level चुनने के बजाय Google की dynamic thinking semantics बनाए रखता है.
Gemini 3 और Gemini 3.1 fixed `thinkingLevel` omit करते हैं, ताकि
Google level चुन सके; Gemini 2.5 Google का dynamic sentinel
`thinkingBudget: -1` भेजता है.

Gemma 4 models (उदाहरण के लिए `gemma-4-26b-a4b-it`) thinking mode का समर्थन करते हैं. OpenClaw
Gemma 4 के लिए `thinkingBudget` को supported Google `thinkingLevel` में rewrite करता है.
Thinking को `off` सेट करने पर, `MINIMAL` पर map करने के बजाय thinking disabled बनी रहती है.
</Tip>

## Image generation

Bundled `google` image-generation provider default रूप से
`google/gemini-3.1-flash-image-preview` का उपयोग करता है.

- `google/gemini-3-pro-image-preview` का भी समर्थन करता है
- Generate: प्रति request अधिकतम 4 images
- Edit mode: enabled, अधिकतम 5 input images
- Geometry controls: `size`, `aspectRatio`, और `resolution`

Google को default image provider के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Shared tool parameters, provider selection, और failover behavior के लिए [Image Generation](/hi/tools/image-generation) देखें.
</Note>

## Video generation

Bundled `google` plugin, shared
`video_generate` tool के माध्यम से video generation भी register करता है.

- Default video model: `google/veo-3.1-fast-generate-preview`
- Modes: text-to-video, image-to-video, और single-video reference flows
- `aspectRatio` (`16:9`, `9:16`) और `resolution` (`720P`, `1080P`) का समर्थन करता है; audio output आज Veo द्वारा supported नहीं है
- Supported durations: **4, 6, या 8 seconds** (अन्य values निकटतम allowed value पर snap होती हैं)

Google को default video provider के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Shared tool parameters, provider selection, और failover behavior के लिए [Video Generation](/hi/tools/video-generation) देखें.
</Note>

## Music generation

Bundled `google` plugin, shared
`music_generate` tool के माध्यम से music generation भी register करता है.

- Default music model: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` का भी समर्थन करता है
- Prompt controls: `lyrics` और `instrumental`
- Output format: default रूप से `mp3`, साथ ही `google/lyria-3-pro-preview` पर `wav`
- Reference inputs: अधिकतम 10 images
- Session-backed runs shared task/status flow के माध्यम से detach होते हैं, जिसमें `action: "status"` शामिल है

Google को default music provider के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Shared tool parameters, provider selection, और failover behavior के लिए [Music Generation](/hi/tools/music-generation) देखें.
</Note>

## Text-to-speech

Bundled `google` speech provider, Gemini API TTS path का उपयोग करता है
`gemini-3.1-flash-tts-preview` के साथ.

- Default voice: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, या `GOOGLE_API_KEY`
- Output: regular TTS attachments के लिए WAV, voice-note targets के लिए Opus, Talk/telephony के लिए PCM
- Voice-note output: Google PCM को WAV के रूप में wrap किया जाता है और `ffmpeg` के साथ 48 kHz Opus में transcode किया जाता है

Google का batch Gemini TTS path completed
`generateContent` response में generated audio लौटाता है. Lowest-latency spoken conversations के लिए, batch
TTS के बजाय Gemini Live API द्वारा backed Google realtime voice provider का उपयोग करें.

Google को default TTS provider के रूप में उपयोग करने के लिए:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS style control के लिए natural-language prompting का उपयोग करता है. Spoken text से पहले reusable style prompt prepend करने के लिए
`audioProfile` सेट करें. जब आपका prompt text किसी named speaker को refer करता हो, तब
`speakerName` सेट करें.

Gemini API TTS text में expressive square-bracket audio tags भी स्वीकार करता है,
जैसे `[whispers]` या `[laughs]`. Tags को visible chat reply से बाहर रखते हुए
TTS को भेजने के लिए, उन्हें `[[tts:text]]...[[/tts:text]]`
block के अंदर रखें:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API तक restricted Google Cloud Console API key इस
provider के लिए valid है. यह अलग Cloud Text-to-Speech API path नहीं है.
</Note>

## Realtime voice

Bundled `google` plugin, Voice Call और Google Meet जैसे backend audio bridges के लिए
Gemini Live API द्वारा backed realtime voice provider register करता है.

| सेटिंग               | कॉन्फ़िग पाथ                                                         | डिफ़ॉल्ट                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| मॉडल                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| वॉइस                 | `...google.voice`                                                   | `Kore`                                                                                |
| तापमान           | `...google.temperature`                                             | (सेट नहीं)                                                                               |
| VAD आरंभ संवेदनशीलता | `...google.startSensitivity`                                        | (सेट नहीं)                                                                               |
| VAD अंत संवेदनशीलता   | `...google.endSensitivity`                                          | (सेट नहीं)                                                                               |
| मौन अवधि      | `...google.silenceDurationMs`                                       | (सेट नहीं)                                                                               |
| गतिविधि हैंडलिंग     | `...google.activityHandling`                                        | Google डिफ़ॉल्ट, `start-of-activity-interrupts`                                        |
| टर्न कवरेज         | `...google.turnCoverage`                                            | Google डिफ़ॉल्ट, `only-activity`                                                       |
| स्वचालित VAD अक्षम करें      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| सेशन फिर से शुरू करना    | `...google.sessionResumption`                                       | `true`                                                                                |
| संदर्भ संपीड़न   | `...google.contextWindowCompression`                                | `true`                                                                                |
| API कुंजी               | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY`, या `GOOGLE_API_KEY` पर फ़ॉलबैक करता है |

Voice Call रियलटाइम कॉन्फ़िग का उदाहरण:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API WebSocket पर द्विदिश ऑडियो और फ़ंक्शन कॉलिंग का उपयोग करता है।
OpenClaw टेलीफ़ोनी/Meet ब्रिज ऑडियो को Gemini की PCM Live API स्ट्रीम के अनुरूप ढालता है और
टूल कॉल को साझा रियलटाइम वॉइस कॉन्ट्रैक्ट पर रखता है। जब तक आपको सैंपलिंग बदलावों की ज़रूरत न हो,
`temperature` को सेट न करें; OpenClaw गैर-सकारात्मक मानों को छोड़ देता है
क्योंकि Google Live `temperature: 0` के लिए ऑडियो के बिना ट्रांसक्रिप्ट लौटा सकता है।
Gemini API ट्रांसक्रिप्शन `languageCodes` के बिना सक्षम है; वर्तमान Google
SDK इस API पाथ पर भाषा-कोड संकेतों को अस्वीकार करता है।
</Note>

<Note>
Control UI Talk सीमित एक-बार उपयोग वाले टोकन के साथ Google Live ब्राउज़र सेशन का समर्थन करता है।
केवल-बैकएंड रियलटाइम वॉइस प्रदाता सामान्य
Gateway रिले ट्रांसपोर्ट के माध्यम से भी चल सकते हैं, जो प्रदाता क्रेडेंशियल को Gateway पर रखता है।
</Note>

मेंटेनर लाइव सत्यापन के लिए, चलाएँ
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
यह स्मोक OpenAI बैकएंड/WebRTC पाथ को भी कवर करता है; Google चरण वही
सीमित Live API टोकन आकार जारी करता है जिसका उपयोग Control UI Talk करता है, ब्राउज़र
WebSocket एंडपॉइंट खोलता है, शुरुआती सेटअप पेलोड भेजता है, और
`setupComplete` की प्रतीक्षा करता है।

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    सीधे Gemini API रन (`api: "google-generative-ai"`) के लिए, OpenClaw
    कॉन्फ़िगर किए गए `cachedContent` हैंडल को Gemini अनुरोधों तक पास करता है।

    - प्रति-मॉडल या वैश्विक पैरामीटर को इनमें से किसी एक के साथ कॉन्फ़िगर करें:
      `cachedContent` या लीगेसी `cached_content`
    - यदि दोनों मौजूद हैं, तो `cachedContent` प्रभावी होगा
    - उदाहरण मान: `cachedContents/prebuilt-context`
    - Gemini कैश-हिट उपयोग को अपस्ट्रीम `cachedContentTokenCount` से
      OpenClaw `cacheRead` में सामान्यीकृत किया जाता है

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI usage notes">
    `google-gemini-cli` OAuth प्रदाता का उपयोग करते समय, OpenClaw डिफ़ॉल्ट रूप से Gemini
    CLI `stream-json` आउटपुट का उपयोग करता है और अंतिम
    `stats` पेलोड से उपयोग को सामान्यीकृत करता है। लीगेसी `--output-format json` ओवरराइड अब भी
    JSON पार्सर का उपयोग करते हैं।

    - स्ट्रीम किया गया उत्तर टेक्स्ट असिस्टेंट `message` इवेंट से आता है।
    - लीगेसी JSON आउटपुट के लिए, उत्तर टेक्स्ट CLI JSON `response` फ़ील्ड से आता है।
    - जब CLI `usage` को खाली छोड़ता है, तो उपयोग `stats` पर फ़ॉलबैक करता है।
    - `stats.cached` को OpenClaw `cacheRead` में सामान्यीकृत किया जाता है।
    - यदि `stats.input` अनुपस्थित है, तो OpenClaw इनपुट टोकन को
      `stats.input_tokens - stats.cached` से निकालता है।

  </Accordion>

  <Accordion title="Environment and daemon setup">
    यदि Gateway डेमन (launchd/systemd) के रूप में चलता है, तो सुनिश्चित करें कि `GEMINI_API_KEY`
    उस प्रक्रिया के लिए उपलब्ध है (उदाहरण के लिए, `~/.openclaw/.env` में या
    `env.shellEnv` के माध्यम से)।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    प्रदाता, मॉडल रेफ़, और फ़ेलओवर व्यवहार चुनना।
  </Card>
  <Card title="Image generation" href="/hi/tools/image-generation" icon="image">
    साझा इमेज टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="Video generation" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="Music generation" href="/hi/tools/music-generation" icon="music">
    साझा संगीत टूल पैरामीटर और प्रदाता चयन।
  </Card>
</CardGroup>
