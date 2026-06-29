---
read_when:
    - आप OpenClaw में MiniMax मॉडल चाहते हैं
    - आपको MiniMax सेटअप मार्गदर्शन चाहिए
summary: OpenClaw में MiniMax मॉडल का उपयोग करें
title: MiniMax
x-i18n:
    generated_at: "2026-06-29T00:00:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw का MiniMax प्रदाता डिफ़ॉल्ट रूप से **MiniMax M3** का उपयोग करता है।

MiniMax यह भी प्रदान करता है:

- T2A v2 के ज़रिए बंडल्ड स्पीच सिंथेसिस
- `MiniMax-VL-01` के ज़रिए बंडल्ड इमेज अंडरस्टैंडिंग
- `music-2.6` के ज़रिए बंडल्ड संगीत जनरेशन
- MiniMax Token Plan search API के ज़रिए बंडल्ड `web_search`

प्रदाता विभाजन:

| प्रदाता ID      | प्रमाणीकरण    | क्षमताएँ                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API कुंजी | टेक्स्ट, इमेज जनरेशन, संगीत जनरेशन, वीडियो जनरेशन, इमेज अंडरस्टैंडिंग, स्पीच, वेब खोज |
| `minimax-portal` | OAuth   | टेक्स्ट, इमेज जनरेशन, संगीत जनरेशन, वीडियो जनरेशन, इमेज अंडरस्टैंडिंग, स्पीच             |

## बिल्ट-इन कैटलॉग

| मॉडल                    | प्रकार             | विवरण                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | चैट (रीजनिंग) | डिफ़ॉल्ट होस्टेड रीजनिंग मॉडल           |
| `MiniMax-M2.7`           | चैट (रीजनिंग) | पिछला होस्टेड रीजनिंग मॉडल          |
| `MiniMax-M2.7-highspeed` | चैट (रीजनिंग) | तेज़ M2.7 रीजनिंग टियर               |
| `MiniMax-VL-01`          | विज़न           | इमेज अंडरस्टैंडिंग मॉडल                |
| `image-01`               | इमेज जनरेशन | टेक्स्ट-से-इमेज और इमेज-से-इमेज संपादन |
| `music-2.6`              | संगीत जनरेशन | डिफ़ॉल्ट संगीत मॉडल                      |
| `music-2.5`              | संगीत जनरेशन | पिछला संगीत जनरेशन टियर           |
| `music-2.0`              | संगीत जनरेशन | लेगेसी संगीत जनरेशन टियर             |
| `MiniMax-Hailuo-2.3`     | वीडियो जनरेशन | टेक्स्ट-से-वीडियो और इमेज रेफ़रेंस फ़्लो  |

## शुरू करना

अपनी पसंदीदा प्रमाणीकरण विधि चुनें और सेटअप चरणों का पालन करें।

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **सर्वोत्तम उपयोग:** OAuth के ज़रिए MiniMax Coding Plan के साथ त्वरित सेटअप, API कुंजी आवश्यक नहीं।

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            यह `api.minimax.io` के विरुद्ध प्रमाणीकरण करता है।
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            यह `api.minimaxi.com` के विरुद्ध प्रमाणीकरण करता है।
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth सेटअप `minimax-portal` प्रदाता id का उपयोग करते हैं। मॉडल refs `minimax-portal/MiniMax-M3` फ़ॉर्म का पालन करते हैं।
    </Note>

    <Tip>
    MiniMax Coding Plan के लिए रेफ़रल लिंक (10% छूट): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **सर्वोत्तम उपयोग:** Anthropic-संगत API के साथ होस्टेड MiniMax।

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            यह `api.minimax.io` को बेस URL के रूप में कॉन्फ़िगर करता है।
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            यह `api.minimaxi.com` को बेस URL के रूप में कॉन्फ़िगर करता है।
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### कॉन्फ़िग उदाहरण

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Anthropic-संगत स्ट्रीमिंग पथ पर, OpenClaw डिफ़ॉल्ट रूप से MiniMax M2.x thinking को अक्षम करता है, जब तक कि आप स्वयं स्पष्ट रूप से `thinking` सेट न करें। M2.x का स्ट्रीमिंग endpoint native Anthropic thinking blocks के बजाय OpenAI-शैली delta chunks में `reasoning_content` उत्सर्जित करता है, जो implicit रूप से सक्षम रहने पर internal reasoning को visible output में लीक कर सकता है। MiniMax-M3 (और forward-compatible M3.x) इस डिफ़ॉल्ट से मुक्त है: M3 उचित Anthropic thinking blocks उत्सर्जित करता है और visible content बनाने के लिए thinking active होना आवश्यक है, इसलिए OpenClaw M3 को प्रदाता के omitted/adaptive thinking path पर रखता है।
    </Warning>

    <Note>
    API-key सेटअप `minimax` प्रदाता id का उपयोग करते हैं। मॉडल refs `minimax/MiniMax-M3` फ़ॉर्म का पालन करते हैं।
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` के ज़रिए कॉन्फ़िगर करें

JSON संपादित किए बिना MiniMax सेट करने के लिए इंटरैक्टिव कॉन्फ़िग विज़र्ड का उपयोग करें:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    मेनू से **Model/auth** चुनें।
  </Step>
  <Step title="Choose a MiniMax auth option">
    उपलब्ध MiniMax विकल्पों में से एक चुनें:

    | प्रमाणीकरण विकल्प | विवरण |
    | --- | --- |
    | `minimax-global-oauth` | अंतरराष्ट्रीय OAuth (Coding Plan) |
    | `minimax-cn-oauth` | चीन OAuth (Coding Plan) |
    | `minimax-global-api` | अंतरराष्ट्रीय API कुंजी |
    | `minimax-cn-api` | चीन API कुंजी |

  </Step>
  <Step title="Pick your default model">
    संकेत मिलने पर अपना डिफ़ॉल्ट मॉडल चुनें।
  </Step>
</Steps>

## क्षमताएँ

### इमेज जनरेशन

MiniMax Plugin `image_generate` टूल के लिए `image-01` मॉडल रजिस्टर करता है। यह समर्थन करता है:

- aspect ratio control के साथ **टेक्स्ट-से-इमेज जनरेशन**
- aspect ratio control के साथ **इमेज-से-इमेज संपादन** (subject reference)
- प्रति अनुरोध अधिकतम **9 output images**
- प्रति edit request अधिकतम **1 reference image**
- समर्थित aspect ratios: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

इमेज जनरेशन के लिए MiniMax का उपयोग करने हेतु, इसे इमेज जनरेशन प्रदाता के रूप में सेट करें:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin टेक्स्ट मॉडल जैसी ही `MINIMAX_API_KEY` या OAuth प्रमाणीकरण का उपयोग करता है। यदि MiniMax पहले से सेट है, तो कोई अतिरिक्त कॉन्फ़िगरेशन आवश्यक नहीं है।

`minimax` और `minimax-portal` दोनों समान
`image-01` मॉडल के साथ `image_generate` रजिस्टर करते हैं। API-key सेटअप `MINIMAX_API_KEY` का उपयोग करते हैं; OAuth सेटअप इसके बजाय
बंडल्ड `minimax-portal` प्रमाणीकरण पथ का उपयोग कर सकते हैं।

इमेज जनरेशन हमेशा MiniMax के समर्पित image endpoint
(`/v1/image_generation`) का उपयोग करता है और `models.providers.minimax.baseUrl` को अनदेखा करता है,
क्योंकि वह फ़ील्ड chat/Anthropic-compatible base URL को कॉन्फ़िगर करता है। इमेज जनरेशन को
CN endpoint के ज़रिए route करने के लिए
`MINIMAX_API_HOST=https://api.minimaxi.com` सेट करें; डिफ़ॉल्ट global endpoint
`https://api.minimax.io` है।

जब onboarding या API-key setup स्पष्ट `models.providers.minimax`
entries लिखता है, OpenClaw `MiniMax-M3`, `MiniMax-M2.7`, और
`MiniMax-M2.7-highspeed` को chat models के रूप में materialize करता है। M3 टेक्स्ट और इमेज input advertise करता है;
image understanding अलग से Plugin-owned
`MiniMax-VL-01` media provider के ज़रिए exposed रहता है।

<Note>
साझा tool parameters, provider selection, और failover behavior के लिए [इमेज जनरेशन](/hi/tools/image-generation) देखें।
</Note>

### टेक्स्ट-से-स्पीच

बंडल्ड `minimax` Plugin MiniMax T2A v2 को
`messages.tts` के लिए speech provider के रूप में रजिस्टर करता है।

- डिफ़ॉल्ट TTS मॉडल: `speech-2.8-hd`
- डिफ़ॉल्ट आवाज़: `English_expressive_narrator`
- समर्थित बंडल्ड model ids में `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, और `speech-01-turbo` शामिल हैं।
- Auth resolution `messages.tts.providers.minimax.apiKey`, फिर
  `minimax-portal` OAuth/token auth profiles, फिर Token Plan environment
  keys (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), फिर `MINIMAX_API_KEY` है।
- यदि कोई TTS host कॉन्फ़िगर नहीं है, OpenClaw कॉन्फ़िगर किए गए
  `minimax-portal` OAuth host का फिर से उपयोग करता है और `/anthropic` जैसे
  Anthropic-compatible path suffixes हटा देता है।
- सामान्य audio attachments MP3 रहते हैं।
- Feishu और Telegram जैसे voice-note targets को MiniMax
  MP3 से 48kHz Opus में `ffmpeg` के साथ transcode किया जाता है, क्योंकि Feishu/Lark file API native audio messages के लिए केवल
  `file_type: "opus"` स्वीकार करता है।
- MiniMax T2A fractional `speed` और `vol` स्वीकार करता है, लेकिन `pitch` integer के रूप में भेजा जाता है; OpenClaw API request से पहले fractional `pitch` values को truncate करता है।

| सेटिंग                                         | Env var                | डिफ़ॉल्ट                       | विवरण                      |
| ----------------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API host.            |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model id.                    |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | speech output के लिए उपयोग की गई voice id. |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Playback speed, `0.5..2.0`.      |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Volume, `(0, 10]`.               |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Integer pitch shift, `-12..12`.  |

### संगीत जनरेशन

बंडल्ड MiniMax Plugin `minimax` और `minimax-portal` दोनों के लिए साझा
`music_generate` टूल के ज़रिए संगीत जनरेशन रजिस्टर करता है।

- डिफ़ॉल्ट संगीत मॉडल: `minimax/music-2.6`
- OAuth संगीत मॉडल: `minimax-portal/music-2.6`
- `minimax/music-2.5` और `minimax/music-2.0` का भी समर्थन करता है
- प्रॉम्प्ट नियंत्रण: `lyrics`, `instrumental`
- आउटपुट फ़ॉर्मैट: `mp3`
- सेशन-समर्थित रन साझा task/status फ़्लो के माध्यम से अलग हो जाते हैं, जिसमें `action: "status"` शामिल है

MiniMax को डिफ़ॉल्ट संगीत प्रदाता के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रदाता चयन, और failover व्यवहार के लिए [संगीत जनरेशन](/hi/tools/music-generation) देखें।
</Note>

### वीडियो जनरेशन

बंडल किया गया MiniMax Plugin `minimax` और `minimax-portal` दोनों के लिए साझा
`video_generate` टूल के माध्यम से वीडियो जनरेशन रजिस्टर करता है।

- डिफ़ॉल्ट वीडियो मॉडल: `minimax/MiniMax-Hailuo-2.3`
- OAuth वीडियो मॉडल: `minimax-portal/MiniMax-Hailuo-2.3`
- मोड: text-to-video और single-image reference फ़्लो
- `aspectRatio` और `resolution` का समर्थन करता है

MiniMax को डिफ़ॉल्ट वीडियो प्रदाता के रूप में उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रदाता चयन, और failover व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
</Note>

### इमेज समझ

MiniMax Plugin इमेज समझ को टेक्स्ट
कैटलॉग से अलग रजिस्टर करता है:

| प्रदाता ID      | डिफ़ॉल्ट इमेज मॉडल |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

इसीलिए स्वचालित मीडिया रूटिंग MiniMax इमेज समझ का उपयोग कर सकती है, भले ही
बंडल किए गए टेक्स्ट-प्रदाता कैटलॉग में M3 image-capable chat refs भी शामिल हों।

### वेब खोज

MiniMax Plugin MiniMax Token Plan
search API के माध्यम से `web_search` भी रजिस्टर करता है।

- प्रदाता id: `minimax`
- संरचित परिणाम: शीर्षक, URL, स्निपेट, संबंधित क्वेरी
- पसंदीदा env var: `MINIMAX_CODE_PLAN_KEY`
- स्वीकृत env aliases: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- संगतता fallback: `MINIMAX_API_KEY` जब वह पहले से token-plan क्रेडेंशियल की ओर इशारा करता हो
- क्षेत्र पुनः उपयोग: `plugins.entries.minimax.config.webSearch.region`, फिर `MINIMAX_API_HOST`, फिर MiniMax प्रदाता base URLs
- खोज प्रदाता id `minimax` पर रहती है; OAuth CN/global सेटअप `models.providers.minimax-portal.baseUrl` के माध्यम से अप्रत्यक्ष रूप से क्षेत्र निर्देशित कर सकता है और `MINIMAX_OAUTH_TOKEN` के माध्यम से bearer auth दे सकता है

कॉन्फ़िग `plugins.entries.minimax.config.webSearch.*` के अंतर्गत रहता है।

<Note>
पूर्ण वेब खोज कॉन्फ़िगरेशन और उपयोग के लिए [MiniMax Search](/hi/tools/minimax-search) देखें।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="कॉन्फ़िगरेशन विकल्प">
    | विकल्प | विवरण |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` को प्राथमिकता दें (Anthropic-compatible); `https://api.minimax.io/v1` OpenAI-compatible payloads के लिए वैकल्पिक है |
    | `models.providers.minimax.api` | `anthropic-messages` को प्राथमिकता दें; `openai-completions` OpenAI-compatible payloads के लिए वैकल्पिक है |
    | `models.providers.minimax.apiKey` | MiniMax API key (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` परिभाषित करें |
    | `agents.defaults.models` | उन मॉडलों को alias करें जिन्हें आप allowlist में चाहते हैं |
    | `models.mode` | यदि आप built-ins के साथ MiniMax जोड़ना चाहते हैं तो `merge` रखें |
  </Accordion>

  <Accordion title="Thinking डिफ़ॉल्ट">
    `api: "anthropic-messages"` पर, OpenClaw MiniMax M2.x मॉडलों के लिए `thinking: { type: "disabled" }` इंजेक्ट करता है, जब तक कि thinking पहले से params/config में स्पष्ट रूप से सेट न हो।

    यह M2.x के streaming endpoint को OpenAI-style delta chunks में `reasoning_content` उत्सर्जित करने से रोकता है, जिससे आंतरिक reasoning दृश्यमान आउटपुट में लीक हो सकती थी।

    MiniMax-M3 (और M3.x) अपवाद है: M3 सही Anthropic thinking blocks उत्सर्जित करता है और thinking अक्षम होने पर `stop_reason: "end_turn"` के साथ खाली `content` array लौटाता है, इसलिए wrapper M3 को प्रदाता के omitted/adaptive thinking path पर रखता है।

  </Accordion>

  <Accordion title="तेज़ मोड">
    Anthropic-compatible stream path पर `/fast on` या `params.fastMode: true` `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` में फिर से लिखता है।
  </Accordion>

  <Accordion title="Fallback उदाहरण">
    **इसके लिए सर्वोत्तम:** अपने सबसे मजबूत latest-generation मॉडल को primary रखें, MiniMax M2.7 पर fail over करें। नीचे का उदाहरण Opus को ठोस primary के रूप में उपयोग करता है; इसे अपने पसंदीदा latest-gen primary मॉडल से बदलें।

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan उपयोग विवरण">
    - Coding Plan उपयोग API: `https://api.minimaxi.com/v1/token_plan/remains` या `https://api.minimax.io/v1/token_plan/remains` (coding plan key आवश्यक है)।
    - उपयोग polling कॉन्फ़िगर होने पर `models.providers.minimax-portal.baseUrl` या `models.providers.minimax.baseUrl` से host प्राप्त करती है, इसलिए `https://api.minimax.io/anthropic` का उपयोग करने वाले global setups `api.minimax.io` को poll करते हैं। अनुपस्थित या malformed base URLs संगतता के लिए CN fallback रखते हैं।
    - OpenClaw MiniMax coding-plan उपयोग को अन्य प्रदाताओं द्वारा उपयोग किए जाने वाले उसी `% left` डिस्प्ले में normalize करता है। MiniMax के raw `usage_percent` / `usagePercent` फ़ील्ड remaining quota हैं, consumed quota नहीं, इसलिए OpenClaw उन्हें invert करता है। मौजूद होने पर count-based फ़ील्ड प्राथमिकता पाते हैं।
    - जब API `model_remains` लौटाता है, OpenClaw chat-model entry को प्राथमिकता देता है, आवश्यकता होने पर `start_time` / `end_time` से window label निकालता है, और plan label में चुने गए मॉडल का नाम शामिल करता है ताकि coding-plan windows को अलग करना आसान हो।
    - उपयोग snapshots `minimax`, `minimax-cn`, और `minimax-portal` को उसी MiniMax quota surface के रूप में मानते हैं, और Coding Plan key env vars पर fallback करने से पहले संग्रहित MiniMax OAuth को प्राथमिकता देते हैं।

  </Accordion>
</AccordionGroup>

## नोट्स

- मॉडल refs auth path का पालन करते हैं:
  - API-key सेटअप: `minimax/<model>`
  - OAuth सेटअप: `minimax-portal/<model>`
- डिफ़ॉल्ट chat मॉडल: `MiniMax-M3`
- वैकल्पिक chat मॉडल: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- Onboarding और direct API-key सेटअप M3 और दोनों M2.7 variants के लिए मॉडल definitions लिखते हैं
- इमेज समझ plugin-owned `MiniMax-VL-01` media provider का उपयोग करती है
- यदि आपको सटीक cost tracking चाहिए तो `models.json` में pricing values अपडेट करें
- वर्तमान प्रदाता id की पुष्टि करने के लिए `openclaw models list` का उपयोग करें, फिर `openclaw models set minimax/MiniMax-M3` या `openclaw models set minimax-portal/MiniMax-M3` से स्विच करें

<Tip>
MiniMax Coding Plan के लिए referral link (10% छूट): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
प्रदाता नियमों के लिए [मॉडल प्रदाता](/hi/concepts/model-providers) देखें।
</Note>

## समस्या निवारण

<AccordionGroup>
  <Accordion title='"अज्ञात मॉडल: minimax/MiniMax-M3"'>
    आमतौर पर इसका मतलब है कि **MiniMax प्रदाता कॉन्फ़िगर नहीं है** (कोई matching provider entry नहीं और कोई MiniMax auth profile/env key नहीं मिला)। इस detection के लिए एक fix **2026.1.12** में है। ठीक करने के लिए:

    - **2026.1.12** पर upgrade करें (या source `main` से चलाएँ), फिर gateway restart करें।
    - `openclaw configure` चलाएँ और **MiniMax** auth option चुनें, या
    - matching `models.providers.minimax` या `models.providers.minimax-portal` block मैन्युअल रूप से जोड़ें, या
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, या MiniMax auth profile सेट करें ताकि matching provider inject किया जा सके।

    सुनिश्चित करें कि model id **case-sensitive** है:

    - API-key path: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7`, या `minimax/MiniMax-M2.7-highspeed`
    - OAuth path: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7`, या `minimax-portal/MiniMax-M2.7-highspeed`

    फिर इससे दोबारा जाँचें:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [FAQ](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल refs, और failover व्यवहार को चुनना।
  </Card>
  <Card title="इमेज जनरेशन" href="/hi/tools/image-generation" icon="image">
    साझा इमेज टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="संगीत जनरेशन" href="/hi/tools/music-generation" icon="music">
    साझा संगीत टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="MiniMax Search" href="/hi/tools/minimax-search" icon="magnifying-glass">
    MiniMax Token Plan के माध्यम से वेब खोज कॉन्फ़िगरेशन।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और FAQ।
  </Card>
</CardGroup>
