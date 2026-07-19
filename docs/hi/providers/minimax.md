---
read_when:
    - आप OpenClaw में MiniMax मॉडल चाहते हैं
    - आपको MiniMax सेटअप संबंधी मार्गदर्शन चाहिए
summary: OpenClaw में MiniMax मॉडल का उपयोग करें
title: MiniMax
x-i18n:
    generated_at: "2026-07-19T09:45:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ce1329cedc88128aaca3eb132be433f7115edb30368dda6df7ab115cc46031c
    source_path: providers/minimax.md
    workflow: 16
---

बंडल किया गया `minimax` plugin दो प्रदाताओं के साथ सात क्षमताएँ पंजीकृत करता है: चैट, छवि निर्माण, संगीत निर्माण, वीडियो निर्माण, छवि समझ, वाक् (T2A v2), और वेब खोज।

| प्रदाता ID      | प्रमाणीकरण    | क्षमताएँ                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API कुंजी | टेक्स्ट, छवि निर्माण, संगीत निर्माण, वीडियो निर्माण, छवि समझ, वाक्, वेब खोज |
| `minimax-portal` | OAuth   | टेक्स्ट, छवि निर्माण, संगीत निर्माण, वीडियो निर्माण, छवि समझ, वाक्             |

<Tip>
MiniMax Coding Plan के लिए रेफ़रल लिंक (10% छूट): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

## अंतर्निहित कैटलॉग

| मॉडल                    | प्रकार             | विवरण                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M3`             | चैट (तर्क) | डिफ़ॉल्ट होस्टेड तर्क मॉडल           |
| `MiniMax-M2.7`           | चैट (तर्क) | पिछला होस्टेड तर्क मॉडल          |
| `MiniMax-M2.7-highspeed` | चैट (तर्क) | अधिक तेज़ M2.7 तर्क स्तर               |
| `MiniMax-VL-01`          | विज़न           | छवि समझ मॉडल                |
| `image-01`               | छवि निर्माण | टेक्स्ट-से-छवि और छवि-से-छवि संपादन |
| `music-2.6`              | संगीत निर्माण | डिफ़ॉल्ट संगीत मॉडल                      |
| `MiniMax-Hailuo-2.3`     | वीडियो निर्माण | टेक्स्ट-से-वीडियो और छवि-से-वीडियो प्रवाह   |

मॉडल संदर्भ प्रमाणीकरण पथ का अनुसरण करते हैं: API-कुंजी सेटअप के लिए `minimax/<model>`, OAuth सेटअप के लिए `minimax-portal/<model>`।

## आरंभ करना

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **इनके लिए सर्वोत्तम:** OAuth के माध्यम से MiniMax Coding Plan के साथ त्वरित सेटअप, API कुंजी की आवश्यकता नहीं।

    <Tabs>
      <Tab title="अंतरराष्ट्रीय">
        <Steps>
          <Step title="ऑनबोर्डिंग चलाएँ">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            परिणामी प्रदाता बेस URL: `api.minimax.io`।
          </Step>
          <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="चीन">
        <Steps>
          <Step title="ऑनबोर्डिंग चलाएँ">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            परिणामी प्रदाता बेस URL: `api.minimaxi.com`।
          </Step>
          <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth सेटअप `minimax-portal` प्रदाता ID का उपयोग करते हैं। मॉडल संदर्भ `minimax-portal/MiniMax-M3` प्रारूप का अनुसरण करते हैं।
    </Note>

  </Tab>

  <Tab title="API कुंजी">
    **इनके लिए सर्वोत्तम:** Anthropic-संगत API के साथ होस्टेड MiniMax।

    <Tabs>
      <Tab title="अंतरराष्ट्रीय">
        <Steps>
          <Step title="ऑनबोर्डिंग चलाएँ">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            यह `api.minimax.io` को बेस URL के रूप में कॉन्फ़िगर करता है।
          </Step>
          <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="चीन">
        <Steps>
          <Step title="ऑनबोर्डिंग चलाएँ">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            यह `api.minimaxi.com` को बेस URL के रूप में कॉन्फ़िगर करता है।
          </Step>
          <Step title="सत्यापित करें कि मॉडल उपलब्ध है">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### कॉन्फ़िगरेशन उदाहरण

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
    MiniMax-M2.x का Anthropic-संगत स्ट्रीमिंग एंडपॉइंट मूल Anthropic थिंकिंग ब्लॉक के बजाय OpenAI-शैली के डेल्टा खंडों में `reasoning_content` उत्सर्जित करता है, जिससे थिंकिंग को अंतर्निहित रूप से सक्षम छोड़े जाने पर आंतरिक तर्क दृश्यमान आउटपुट में प्रकट हो जाता है। जब तक आप स्वयं स्पष्ट रूप से `thinking` सेट नहीं करते, OpenClaw डिफ़ॉल्ट रूप से M2.x थिंकिंग को अक्षम करता है। MiniMax-M3 (और फ़ॉरवर्ड-संगत M3.x) इससे मुक्त है: M3 उचित Anthropic थिंकिंग ब्लॉक उत्सर्जित करता है और दृश्यमान सामग्री उत्पन्न करने के लिए थिंकिंग सक्रिय होना आवश्यक है, इसलिए OpenClaw M3 को प्रदाता के अनुकूली थिंकिंग पथ पर रखता है। नीचे उन्नत कॉन्फ़िगरेशन के अंतर्गत थिंकिंग डिफ़ॉल्ट अनुभाग देखें।
    </Warning>

    <Note>
    API-कुंजी सेटअप `minimax` प्रदाता ID का उपयोग करते हैं। मॉडल संदर्भ `minimax/MiniMax-M3` प्रारूप का अनुसरण करते हैं।
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` के माध्यम से कॉन्फ़िगर करें

<Steps>
  <Step title="विज़ार्ड शुरू करें">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth चुनें">
    मेनू से **Model/auth** चुनें।
  </Step>
  <Step title="MiniMax प्रमाणीकरण विकल्प चुनें">
    | प्रमाणीकरण विकल्प            | विवरण                        |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | अंतरराष्ट्रीय OAuth (Coding Plan)  |
    | `minimax-cn-oauth`     | चीन OAuth (Coding Plan)          |
    | `minimax-global-api`   | अंतरराष्ट्रीय API कुंजी              |
    | `minimax-cn-api`       | चीन API कुंजी                      |
  </Step>
  <Step title="अपना डिफ़ॉल्ट मॉडल चुनें">
    संकेत मिलने पर अपना डिफ़ॉल्ट मॉडल चुनें।
  </Step>
</Steps>

## क्षमताएँ

### छवि निर्माण

MiniMax plugin `image_generate` टूल के लिए `image-01` मॉडल को `minimax` और `minimax-portal` दोनों पर पंजीकृत करता है, और टेक्स्ट मॉडल के समान `MINIMAX_API_KEY` या OAuth प्रमाणीकरण का पुनः उपयोग करता है।

- टेक्स्ट-से-छवि निर्माण और छवि-से-छवि संपादन (विषय संदर्भ), दोनों में अभिमुखता अनुपात नियंत्रण
- प्रति अनुरोध अधिकतम 9 आउटपुट छवियाँ, प्रति संपादन अनुरोध 1 संदर्भ छवि
- समर्थित अभिमुखता अनुपात: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

छवि निर्माण हमेशा MiniMax के समर्पित छवि एंडपॉइंट (`/v1/image_generation`) का उपयोग करता है और `models.providers.minimax.baseUrl` को अनदेखा करता है, क्योंकि वह फ़ील्ड इसके बजाय चैट/Anthropic-संगत बेस URL को कॉन्फ़िगर करती है। छवि निर्माण को CN एंडपॉइंट के माध्यम से रूट करने के लिए `MINIMAX_API_HOST=https://api.minimaxi.com` सेट करें; डिफ़ॉल्ट वैश्विक एंडपॉइंट `https://api.minimax.io` है।

<Note>
साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए [छवि निर्माण](/hi/tools/image-generation) देखें।
</Note>

### टेक्स्ट-से-वाक्

बंडल किया गया `minimax` plugin `messages.tts` के लिए MiniMax T2A v2 को वाक् प्रदाता के रूप में पंजीकृत करता है।

- डिफ़ॉल्ट TTS मॉडल: `speech-2.8-hd`
- डिफ़ॉल्ट आवाज़: `English_expressive_narrator`
- बंडल किए गए मॉडल ID: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`
- प्रमाणीकरण समाधान क्रम: `messages.tts.providers.minimax.apiKey`, फिर `minimax-portal` OAuth/टोकन प्रमाणीकरण प्रोफ़ाइल, फिर Token Plan परिवेश कुंजियाँ (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`), फिर `MINIMAX_API_KEY`
- यदि कोई TTS होस्ट कॉन्फ़िगर नहीं किया गया है, तो OpenClaw कॉन्फ़िगर किए गए `minimax-portal` OAuth होस्ट का पुनः उपयोग करता है और `/anthropic` जैसे Anthropic-संगत पथ प्रत्यय हटा देता है
- सामान्य ऑडियो अनुलग्नक MP3 में रहते हैं। वॉइस-नोट लक्ष्य (Feishu, Telegram और अन्य चैनल जो वॉइस-नोट-संगत अनुलग्नक का अनुरोध करते हैं) `ffmpeg` के साथ MiniMax MP3 से 48kHz Opus में ट्रांसकोड किए जाते हैं, क्योंकि उदाहरण के लिए Feishu/Lark फ़ाइल API मूल ऑडियो संदेशों के लिए केवल `file_type: "opus"` स्वीकार करता है
- MiniMax T2A भिन्नात्मक `speed` और `vol` स्वीकार करता है, लेकिन `pitch` पूर्णांक के रूप में भेजा जाता है; OpenClaw API अनुरोध से पहले भिन्नात्मक `pitch` मानों को छोटा करता है

| सेटिंग                                  | परिवेश चर                | डिफ़ॉल्ट                       | विवरण                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API होस्ट।            |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS मॉडल ID।                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | वाक् आउटपुट के लिए उपयोग किया जाने वाला आवाज़ ID। |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | प्लेबैक गति, `0.5..2.0`।      |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | वॉल्यूम, `(0, 10]`।               |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | पूर्णांक पिच बदलाव, `-12..12`।  |

### संगीत निर्माण

बंडल किया गया MiniMax plugin `minimax` और `minimax-portal` दोनों के लिए साझा `music_generate` टूल के माध्यम से संगीत निर्माण पंजीकृत करता है।

- डिफ़ॉल्ट संगीत मॉडल: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- `music-2.6-free`, `music-cover`, और `music-cover-free` का भी समर्थन करता है
- प्रॉम्प्ट नियंत्रण: `lyrics`, `instrumental`
- आउटपुट प्रारूप: `mp3`
- सत्र-समर्थित रन साझा कार्य/स्थिति प्रवाह के माध्यम से अलग होते हैं, जिसमें `action: "status"` शामिल है

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए [संगीत निर्माण](/hi/tools/music-generation) देखें।
</Note>

### वीडियो निर्माण

बंडल किया गया MiniMax plugin `minimax` और `minimax-portal` दोनों के लिए साझा `video_generate` टूल के माध्यम से वीडियो निर्माण पंजीकृत करता है।

- डिफ़ॉल्ट वीडियो मॉडल: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live`, और `I2V-01` का भी समर्थन करता है
- मोड: टेक्स्ट-से-वीडियो और एकल-छवि संदर्भ प्रवाह
- `resolution` का समर्थन करता है (Hailuo 2.3/02 मॉडल पर `768P` या `1080P`); `aspectRatio` समर्थित नहीं है और इसे अनदेखा किया जाता है

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
</Note>

### छवि की समझ

MiniMax Plugin छवि की समझ को टेक्स्ट कैटलॉग से अलग पंजीकृत करता है:

| प्रदाता ID      | डिफ़ॉल्ट छवि मॉडल | PDF टेक्स्ट निष्कर्षण |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

यही कारण है कि स्वचालित मीडिया रूटिंग MiniMax की छवि समझ का उपयोग कर सकती है, भले ही बंडल किए गए टेक्स्ट-प्रदाता कैटलॉग में छवि-सक्षम M3 चैट संदर्भ भी शामिल हों। PDF की समझ केवल टेक्स्ट निष्कर्षण के लिए `MiniMax-M2.7` का उपयोग करती है; MiniMax कोई PDF-से-छवि रूपांतरण पथ पंजीकृत नहीं करता।

### वेब खोज

MiniMax Plugin, MiniMax Token Plan खोज API (`/v1/coding_plan/search`) के माध्यम से `web_search` को भी पंजीकृत करता है।

- प्रदाता id: `minimax`
- संरचित परिणाम: शीर्षक, URL, स्निपेट, संबंधित क्वेरी
- पसंदीदा env var: `MINIMAX_CODE_PLAN_KEY`
- स्वीकृत env उपनाम: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- संगतता फ़ॉलबैक: `MINIMAX_API_KEY`, जब यह पहले से किसी token-plan क्रेडेंशियल की ओर संकेत करता हो
- क्षेत्र का पुनः उपयोग: `plugins.entries.minimax.config.webSearch.region`, फिर `MINIMAX_API_HOST`, फिर MiniMax प्रदाता के आधार URL
- खोज प्रदाता id `minimax` पर बनी रहती है; OAuth CN/वैश्विक सेटअप `models.providers.minimax-portal.baseUrl` के माध्यम से अप्रत्यक्ष रूप से क्षेत्र निर्देशित कर सकता है और `MINIMAX_OAUTH_TOKEN` के माध्यम से bearer प्रमाणीकरण प्रदान कर सकता है

कॉन्फ़िगरेशन `plugins.entries.minimax.config.webSearch.*` के अंतर्गत रहता है।

<Note>
वेब खोज के संपूर्ण कॉन्फ़िगरेशन और उपयोग के लिए [MiniMax खोज](/hi/tools/minimax-search) देखें।
</Note>

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="कॉन्फ़िगरेशन विकल्प">
    | विकल्प | विवरण |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` को प्राथमिकता दें (Anthropic-संगत); OpenAI-संगत पेलोड के लिए `https://api.minimax.io/v1` वैकल्पिक है |
    | `models.providers.minimax.api` | `anthropic-messages` को प्राथमिकता दें; OpenAI-संगत पेलोड के लिए `openai-completions` वैकल्पिक है |
    | `models.providers.minimax.apiKey` | MiniMax API कुंजी (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` परिभाषित करें |
    | `agents.defaults.models` | प्रति-मॉडल उपनाम, पैरामीटर और मेटाडेटा |
    | `agents.defaults.modelPolicy.allow` | वैकल्पिक स्पष्ट मॉडल अनुमतिसूची |
    | `models.mode` | यदि आप अंतर्निर्मित विकल्पों के साथ MiniMax जोड़ना चाहते हैं, तो `merge` बनाए रखें |
  </Accordion>

  <Accordion title="थिंकिंग के डिफ़ॉल्ट">
    `api: "anthropic-messages"` पर, OpenClaw MiniMax M2.x मॉडल के लिए `thinking: { type: "disabled" }` अंतःक्षेपित करता है, जब तक कि किसी पहले के रैपर ने पेलोड में `thinking` फ़ील्ड पहले से सेट न किया हो। यह M2.x के स्ट्रीमिंग एंडपॉइंट को OpenAI-शैली के डेल्टा चंक में `reasoning_content` उत्सर्जित करने से रोकता है, जिससे आंतरिक तर्क दृश्यमान आउटपुट में लीक हो सकता था।

    MiniMax-M3 (और M3.x) को छूट है: थिंकिंग अक्षम होने पर M3, `stop_reason: "end_turn"` के साथ एक खाली `content` ऐरे लौटाता है, इसलिए OpenClaw M3 के लिए अंतर्निहित अक्षम डिफ़ॉल्ट हटा देता है और थिंकिंग स्तर सेट होने पर इसके बजाय `thinking: { type: "adaptive" }` को बाध्य करता है।

    प्रत्येक मॉडल परिवार के लिए उपलब्ध थिंकिंग स्तर:

    | मॉडल परिवार   | स्तर                                   | डिफ़ॉल्ट    |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="तेज़ मोड">
    `/fast on` या `params.fastMode: true`, Anthropic-संगत स्ट्रीम पथ (`api: "anthropic-messages"`, प्रदाता `minimax` या `minimax-portal`) पर `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` में पुनर्लिखता है।
  </Accordion>

  <Accordion title="फ़ॉलबैक उदाहरण">
    **इसके लिए सर्वोत्तम:** नवीनतम पीढ़ी के अपने सबसे शक्तिशाली मॉडल को प्राथमिक रखें और विफलता होने पर MiniMax M2.7 पर स्विच करें। नीचे दिए उदाहरण में Opus को ठोस प्राथमिक मॉडल के रूप में उपयोग किया गया है; इसे अपनी पसंद के नवीनतम-पीढ़ी के प्राथमिक मॉडल से बदलें।

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

  <Accordion title="Coding Plan उपयोग का विवरण">
    - Coding Plan उपयोग API: `https://api.minimaxi.com/v1/token_plan/remains` या `https://api.minimax.io/v1/token_plan/remains` (coding plan कुंजी आवश्यक है)।
    - कॉन्फ़िगर होने पर उपयोग पोलिंग, होस्ट को `models.providers.minimax-portal.baseUrl` या `models.providers.minimax.baseUrl` से प्राप्त करती है, इसलिए `https://api.minimax.io/anthropic` का उपयोग करने वाले वैश्विक सेटअप `api.minimax.io` को पोल करते हैं। अनुपलब्ध या विकृत आधार URL संगतता के लिए CN फ़ॉलबैक बनाए रखते हैं।
    - OpenClaw, MiniMax coding-plan उपयोग को वही `% left` प्रदर्शन स्वरूप देता है जिसका उपयोग अन्य प्रदाता करते हैं। MiniMax के मूल `usage_percent` / `usagePercent` फ़ील्ड शेष कोटा दर्शाते हैं, उपभोग किया गया कोटा नहीं, इसलिए OpenClaw उन्हें उलट देता है। मौजूद होने पर गणना-आधारित फ़ील्ड को प्राथमिकता मिलती है।
    - जब API `model_remains` लौटाता है, तो OpenClaw चैट-मॉडल प्रविष्टि को प्राथमिकता देता है, आवश्यकता होने पर `start_time` / `end_time` से विंडो लेबल प्राप्त करता है और योजना लेबल में चयनित मॉडल का नाम शामिल करता है, ताकि coding-plan विंडो को अलग पहचानना आसान हो।
    - उपयोग स्नैपशॉट `minimax`, `minimax-cn`, `minimax-portal`, और `minimax-portal-cn` को समान MiniMax कोटा सतह मानते हैं और Coding Plan कुंजी env var पर फ़ॉलबैक करने से पहले संग्रहीत MiniMax OAuth को प्राथमिकता देते हैं।

  </Accordion>
</AccordionGroup>

## टिप्पणियाँ

- डिफ़ॉल्ट चैट मॉडल: `MiniMax-M3`। वैकल्पिक चैट मॉडल: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- ऑनबोर्डिंग और प्रत्यक्ष API-कुंजी सेटअप M3 और M2.7 के दोनों वेरिएंट के लिए मॉडल परिभाषाएँ लिखते हैं
- छवि की समझ Plugin-स्वामित्व वाले `MiniMax-VL-01` मीडिया प्रदाता का उपयोग करती है
- यदि आपको सटीक लागत ट्रैकिंग चाहिए, तो `models.json` में मूल्य निर्धारण मान अपडेट करें
- वर्तमान प्रदाता id की पुष्टि करने के लिए `openclaw models list` का उपयोग करें, फिर `openclaw models set minimax/MiniMax-M3` या `openclaw models set minimax-portal/MiniMax-M3` से स्विच करें

<Note>
प्रदाता नियमों के लिए [मॉडल प्रदाता](/hi/concepts/model-providers) देखें।
</Note>

## समस्या निवारण

<AccordionGroup>
  <Accordion title='"अज्ञात मॉडल: minimax/MiniMax-M3"'>
    इसका आम तौर पर अर्थ है कि **MiniMax प्रदाता कॉन्फ़िगर नहीं है** (कोई मेल खाती प्रदाता प्रविष्टि नहीं है और कोई MiniMax प्रमाणीकरण प्रोफ़ाइल/env कुंजी नहीं मिली)। इसे ऐसे ठीक करें:

    - `openclaw configure` चलाकर कोई **MiniMax** प्रमाणीकरण विकल्प चुनें, या
    - मेल खाता `models.providers.minimax` या `models.providers.minimax-portal` ब्लॉक मैन्युअल रूप से जोड़ें, या
    - `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, या कोई MiniMax प्रमाणीकरण प्रोफ़ाइल सेट करें, ताकि मेल खाता प्रदाता अंतःक्षेपित किया जा सके।

    सुनिश्चित करें कि मॉडल id **केस-सेंसिटिव** है:

    - API-कुंजी पथ: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7`, या `minimax/MiniMax-M2.7-highspeed`
    - OAuth पथ: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7`, या `minimax-portal/MiniMax-M2.7-highspeed`

    फिर इससे दोबारा जाँचें:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
अधिक सहायता: [समस्या निवारण](/hi/help/troubleshooting) और [अक्सर पूछे जाने वाले प्रश्न](/hi/help/faq)।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल संदर्भों और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="छवि जनरेशन" href="/hi/tools/image-generation" icon="image">
    साझा छवि टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="संगीत जनरेशन" href="/hi/tools/music-generation" icon="music">
    साझा संगीत टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="MiniMax खोज" href="/hi/tools/minimax-search" icon="magnifying-glass">
    MiniMax Token Plan के माध्यम से वेब खोज कॉन्फ़िगरेशन।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्या निवारण और अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
