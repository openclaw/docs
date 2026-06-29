---
read_when:
    - मीडिया समझ को डिज़ाइन या रिफैक्टर करना
    - इनबाउंड ऑडियो/वीडियो/इमेज प्रीप्रोसेसिंग को ट्यून करना
sidebarTitle: Media understanding
summary: इनबाउंड छवि/ऑडियो/वीडियो समझ (वैकल्पिक), प्रदाता + CLI फ़ॉलबैक के साथ
title: मीडिया की समझ
x-i18n:
    generated_at: "2026-06-28T23:25:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw उत्तर पाइपलाइन चलने से पहले **इनबाउंड मीडिया का सारांश** (छवि/ऑडियो/वीडियो) बना सकता है। यह अपने-आप पता लगाता है कि स्थानीय टूल या प्रदाता कुंजियां उपलब्ध हैं या नहीं, और इसे अक्षम या अनुकूलित किया जा सकता है। यदि समझना बंद है, तो मॉडल फिर भी हमेशा की तरह मूल फाइलें/URL प्राप्त करते हैं।

विक्रेता-विशिष्ट मीडिया व्यवहार विक्रेता plugins द्वारा पंजीकृत किया जाता है, जबकि OpenClaw core साझा `tools.media` कॉन्फिग, fallback क्रम, और उत्तर-पाइपलाइन एकीकरण का स्वामी है।

## लक्ष्य

- वैकल्पिक: तेज़ routing + बेहतर command parsing के लिए इनबाउंड मीडिया को छोटे पाठ में पहले से digest करना।
- मॉडल तक मूल मीडिया डिलीवरी सुरक्षित रखें (हमेशा)।
- **प्रदाता APIs** और **CLI fallbacks** का समर्थन करें।
- क्रमबद्ध fallback (त्रुटि/आकार/timeout) के साथ कई मॉडलों की अनुमति दें।

## उच्च-स्तरीय व्यवहार

<Steps>
  <Step title="अटैचमेंट इकट्ठा करें">
    इनबाउंड अटैचमेंट (`MediaPaths`, `MediaUrls`, `MediaTypes`) इकट्ठा करें।
  </Step>
  <Step title="प्रति-क्षमता चुनें">
    हर सक्षम क्षमता (छवि/ऑडियो/वीडियो) के लिए, नीति के अनुसार अटैचमेंट चुनें (डिफॉल्ट: **पहला**)।
  </Step>
  <Step title="मॉडल चुनें">
    पहला योग्य मॉडल entry चुनें (आकार + क्षमता + auth)।
  </Step>
  <Step title="विफलता पर fallback">
    यदि कोई मॉडल विफल होता है या मीडिया बहुत बड़ा है, तो **अगली entry पर fallback करें**।
  </Step>
  <Step title="सफलता ब्लॉक लागू करें">
    सफलता पर:

    - `Body` `[Image]`, `[Audio]`, या `[Video]` block बन जाता है।
    - ऑडियो `{{Transcript}}` सेट करता है; command parsing caption text मौजूद होने पर उसका उपयोग करती है, अन्यथा transcript का।
    - captions को block के अंदर `User text:` के रूप में सुरक्षित रखा जाता है।

  </Step>
</Steps>

यदि समझना विफल होता है या अक्षम है, तो **उत्तर flow जारी रहता है** मूल body + attachments के साथ।

## कॉन्फिग overview

`tools.media` **साझा models** और प्रति-क्षमता overrides का समर्थन करता है:

<AccordionGroup>
  <Accordion title="शीर्ष-स्तरीय keys">
    - `tools.media.models`: साझा model list (`capabilities` का उपयोग gate करने के लिए करें)।
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - डिफॉल्ट (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - provider overrides (`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram` के जरिए Deepgram audio options
      - audio transcript echo controls (`echoTranscript`, डिफॉल्ट `false`; `echoFormat`)
      - वैकल्पिक **प्रति-क्षमता `models` list** (साझा models से पहले पसंदीदा)
      - `attachments` नीति (`mode`, `maxAttachments`, `prefer`)
      - `scope` (channel/chatType/session key द्वारा वैकल्पिक gating)
    - `tools.media.concurrency`: अधिकतम concurrent capability runs (डिफॉल्ट **2**)।

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### मॉडल entries

हर `models[]` entry **provider** या **CLI** हो सकती है:

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI templates इनका भी उपयोग कर सकते हैं:

    - `{{MediaDir}}` (media file वाली directory)
    - `{{OutputDir}}` (इस run के लिए बनाई गई scratch dir)
    - `{{OutputBase}}` (scratch file base path, extension नहीं)

  </Tab>
</Tabs>

### Provider credentials (`apiKey`)

Provider media understanding सामान्य model calls जैसी ही provider auth resolution का उपयोग करता है: auth profiles, environment variables, फिर `models.providers.<providerId>.apiKey`।

`tools.media.*.models[]` entries inline `apiKey` field स्वीकार नहीं करतीं। media model entry में `provider` value, जैसे `openai` या `moonshot`, के पास मानक provider auth sources में से किसी एक के जरिए credentials उपलब्ध होने चाहिए।

न्यूनतम उदाहरण:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

profiles, environment variables, और custom base URLs सहित पूर्ण provider auth reference के लिए, [Tools और custom providers](/hi/gateway/config-tools) देखें।

## डिफॉल्ट और सीमाएं

अनुशंसित डिफॉल्ट:

- `maxChars`: image/video के लिए **500** (छोटा, command-friendly)
- `maxChars`: audio के लिए **unset** (जब तक आप सीमा सेट न करें, पूरा transcript)
- `maxBytes`:
  - image: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="नियम">
    - यदि media `maxBytes` से अधिक है, तो वह model छोड़ा जाता है और **अगला model आजमाया जाता है**।
    - **1024 bytes** से छोटी audio files को खाली/corrupt माना जाता है और provider/CLI transcription से पहले छोड़ा जाता है; inbound reply context को deterministic placeholder transcript मिलता है ताकि agent जान सके कि note बहुत छोटा था।
    - यदि model `maxChars` से अधिक लौटाता है, तो output trim कर दिया जाता है।
    - `prompt` साधारण "Describe the {media}." और `maxChars` guidance (केवल image/video) पर डिफॉल्ट होता है।
    - यदि सक्रिय primary image model पहले से vision को native रूप से support करता है, तो OpenClaw `[Image]` summary block छोड़ देता है और इसके बजाय मूल image को model में पास करता है।
    - यदि Gateway/WebChat primary model text-only है, तो image attachments को offloaded `media://inbound/*` refs के रूप में सुरक्षित रखा जाता है ताकि image/PDF tools या configured image model attachment खोने के बजाय अब भी उन्हें inspect कर सकें।
    - स्पष्ट `openclaw infer image describe --model <provider/model>` requests अलग हैं: वे उस image-capable provider/model को सीधे चलाते हैं, जिनमें `ollama/qwen2.5vl:7b` जैसे Ollama refs शामिल हैं।
    - यदि `<capability>.enabled: true` है लेकिन कोई models configured नहीं हैं, तो OpenClaw **सक्रिय reply model** आजमाता है जब उसका provider क्षमता support करता है।

  </Accordion>
</AccordionGroup>

### Auto-detect media understanding (डिफॉल्ट)

यदि `tools.media.<capability>.enabled` को `false` पर सेट **नहीं** किया गया है और आपने models configure नहीं किए हैं, तो OpenClaw इस क्रम में auto-detect करता है और **पहले काम करने वाले option पर रुक जाता है**:

<Steps>
  <Step title="सक्रिय reply model">
    सक्रिय reply model जब उसका provider क्षमता support करता है।
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` primary/fallback refs (केवल image)।
    `provider/model` refs को प्राथमिकता दें। Bare refs को configured image-capable provider model entries से qualify किया जाता है, केवल जब match unique हो।
  </Step>
  <Step title="Local CLIs (केवल audio)">
    Local CLIs (यदि installed हों):

    - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens के साथ `SHERPA_ONNX_MODEL_DIR` आवश्यक)
    - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` या bundled tiny model का उपयोग करता है)
    - `whisper` (Python CLI; models अपने-आप downloads करता है)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` का उपयोग करके `gemini`।
  </Step>
  <Step title="Provider auth">
    - Configured `models.providers.*` entries जो क्षमता support करती हैं, bundled fallback order से पहले आजमाई जाती हैं।
    - image-capable model वाले image-only config providers media understanding के लिए auto-register होते हैं, भले वे bundled vendor plugin न हों।
    - Ollama image understanding स्पष्ट रूप से चुने जाने पर उपलब्ध है, उदाहरण के लिए `agents.defaults.imageModel` या `openclaw infer image describe --model ollama/<vision-model>` के जरिए।

    Bundled fallback order:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Image: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

auto-detection को अक्षम करने के लिए, सेट करें:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
Binary detection macOS/Linux/Windows पर best-effort है; सुनिश्चित करें कि CLI `PATH` पर है (हम `~` expand करते हैं), या full command path के साथ explicit CLI model सेट करें।
</Note>

### Proxy environment support (provider models)

जब provider-based **audio** और **video** media understanding सक्षम होता है, तो OpenClaw provider HTTP calls के लिए मानक outbound proxy environment variables का सम्मान करता है:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

यदि कोई proxy env vars सेट नहीं हैं, तो media understanding direct egress का उपयोग करता है। यदि proxy value malformed है, तो OpenClaw warning log करता है और direct fetch पर fallback करता है।

## क्षमताएं (वैकल्पिक)

यदि आप `capabilities` सेट करते हैं, तो entry केवल उन media types के लिए चलती है। साझा lists के लिए, OpenClaw डिफॉल्ट infer कर सकता है:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image + audio**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Any `models.providers.<id>.models[]` catalog with an image-capable model: **image**

CLI entries के लिए, अप्रत्याशित matches से बचने के लिए **`capabilities` स्पष्ट रूप से सेट करें**। यदि आप `capabilities` छोड़ देते हैं, तो entry उस list के लिए eligible है जिसमें वह दिखाई देती है।

## Provider support matrix (OpenClaw integrations)

| क्षमता | Provider integration                                                                                                         | Notes                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Vendor plugins image support register करते हैं; `openai/*` API-key या Codex OAuth routing का उपयोग कर सकता है; `codex/*` bounded Codex app-server turn का उपयोग करता है; MiniMax और MiniMax OAuth दोनों `MiniMax-VL-01` का उपयोग करते हैं; image-capable config providers auto-register होते हैं। |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Provider transcription (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral)।                                                                                                                                         |
| Video      | Google, Qwen, Moonshot                                                                                                       | Vendor plugins के जरिए provider video understanding; Qwen video understanding Standard DashScope endpoints का उपयोग करता है।                                                                                                                            |

<Note>
**MiniMax note**

- `minimax`, `minimax-cn`, `minimax-portal`, और `minimax-portal-cn` इमेज समझ Plugin-स्वामित्व वाले `MiniMax-VL-01` मीडिया प्रदाता से आती है।
- स्वचालित इमेज रूटिंग `MiniMax-VL-01` का उपयोग करती रहती है, भले ही लेगेसी MiniMax M2.x चैट मेटाडेटा इमेज इनपुट का दावा करे।

</Note>

## मॉडल चयन मार्गदर्शन

- जब गुणवत्ता और सुरक्षा महत्वपूर्ण हों, तो प्रत्येक मीडिया क्षमता के लिए उपलब्ध सबसे मजबूत नवीनतम पीढ़ी के मॉडल को प्राथमिकता दें।
- अविश्वसनीय इनपुट संभालने वाले टूल-सक्षम एजेंटों के लिए पुराने/कमजोर मीडिया मॉडल से बचें।
- उपलब्धता के लिए प्रति क्षमता कम से कम एक फ़ॉलबैक रखें (गुणवत्ता मॉडल + तेज़/सस्ता मॉडल)।
- CLI फ़ॉलबैक (`whisper-cli`, `whisper`, `gemini`) तब उपयोगी होते हैं जब प्रदाता API उपलब्ध न हों।
- `parakeet-mlx` नोट: `--output-dir` के साथ, जब आउटपुट फ़ॉर्मैट `txt` हो (या निर्दिष्ट न हो), तो OpenClaw `<output-dir>/<media-basename>.txt` पढ़ता है; गैर-`txt` फ़ॉर्मैट stdout पर फ़ॉलबैक करते हैं।

## अटैचमेंट नीति

प्रति-क्षमता `attachments` नियंत्रित करता है कि कौन-से अटैचमेंट संसाधित किए जाते हैं:

<ParamField path="mode" type='"first" | "all"' default="first">
  पहला चयनित अटैचमेंट संसाधित करना है या सभी को।
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  संसाधित की जाने वाली संख्या की सीमा लगाएं।
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  उम्मीदवार अटैचमेंट में चयन प्राथमिकता।
</ParamField>

जब `mode: "all"` हो, तो आउटपुट को `[Image 1/2]`, `[Audio 2/2]`, आदि लेबल दिए जाते हैं।

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - निकाला गया फ़ाइल टेक्स्ट मीडिया प्रॉम्प्ट में जोड़े जाने से पहले **अविश्वसनीय बाहरी सामग्री** के रूप में लपेटा जाता है।
    - इंजेक्ट किया गया ब्लॉक `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` जैसे स्पष्ट सीमा मार्कर का उपयोग करता है और इसमें `Source: External` मेटाडेटा लाइन शामिल होती है।
    - यह अटैचमेंट-निष्कर्षण पथ मीडिया प्रॉम्प्ट को अनावश्यक रूप से बड़ा होने से बचाने के लिए लंबा `SECURITY NOTICE:` बैनर जानबूझकर छोड़ देता है; सीमा मार्कर और मेटाडेटा फिर भी बने रहते हैं।
    - यदि किसी फ़ाइल में निकालने योग्य टेक्स्ट नहीं है, तो OpenClaw `[No extractable text]` इंजेक्ट करता है।
    - यदि इस पथ में कोई PDF रेंडर की गई पेज इमेज पर फ़ॉलबैक करती है, तो OpenClaw उन पेज इमेज को विज़न-सक्षम उत्तर मॉडल को अग्रेषित करता है और फ़ाइल ब्लॉक में प्लेसहोल्डर `[PDF content rendered to images]` रखता है।

  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन उदाहरण

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Audio + video only">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Image-only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Multi-modal single entry">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## स्थिति आउटपुट

जब मीडिया समझ चलती है, तो `/status` में एक संक्षिप्त सारांश लाइन शामिल होती है:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

यह प्रति-क्षमता परिणाम और लागू होने पर चुना गया प्रदाता/मॉडल दिखाता है।

## नोट्स

- समझना **सर्वोत्तम-प्रयास** है। त्रुटियां उत्तरों को ब्लॉक नहीं करतीं।
- समझ अक्षम होने पर भी अटैचमेंट मॉडल को भेजे जाते हैं।
- समझ कहां चलती है, इसे सीमित करने के लिए `scope` का उपयोग करें (जैसे केवल DM)।

## संबंधित

- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [इमेज और मीडिया समर्थन](/hi/nodes/images)
