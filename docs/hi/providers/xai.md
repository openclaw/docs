---
read_when:
    - आप OpenClaw में Grok मॉडल का उपयोग करना चाहते हैं
    - आप xAI प्रमाणीकरण या मॉडल आईडी कॉन्फ़िगर कर रहे हैं
summary: OpenClaw में xAI Grok मॉडल का उपयोग करें
title: xAI
x-i18n:
    generated_at: "2026-07-19T09:20:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9b43155943368b618236426115874d964883cb11136f3bd1afa8159a84ecd23a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw, Grok मॉडल के लिए एक बंडल किया हुआ `xai` प्रदाता Plugin प्रदान करता है। पात्र SuperGrok या X Premium
सदस्यता के साथ Grok OAuth अनुशंसित तरीका है। Gateway, कॉन्फ़िगरेशन, रूटिंग और टूल स्थानीय रहते हैं; केवल Grok
अनुरोध xAI के API पर जाते हैं।

OAuth के लिए xAI API कुंजी या Grok Build ऐप आवश्यक नहीं है। xAI फिर भी
सहमति स्क्रीन पर Grok Build दिखा सकता है, क्योंकि OpenClaw xAI के साझा
OAuth क्लाइंट का उपयोग करता है।

## सेटअप

<Steps>
  <Step title="नई स्थापना">
    डेमन स्थापना के साथ ऑनबोर्डिंग चलाएँ, फिर मॉडल/प्रमाणीकरण चरण पर xAI/Grok OAuth
    चुनें:

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS या SSH पर सीधे xAI OAuth चुनें; यह डिवाइस-कोड
    सत्यापन का उपयोग करता है और इसे localhost कॉलबैक की आवश्यकता नहीं होती:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="मौजूदा स्थापना">
    केवल xAI में साइन इन करें; केवल Grok को कनेक्ट करने के लिए पूरी ऑनबोर्डिंग दोबारा न चलाएँ:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Grok को डिफ़ॉल्ट मॉडल के रूप में अलग से लागू करें:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    पूरी ऑनबोर्डिंग केवल तभी दोबारा चलाएँ, जब आप जानबूझकर Gateway,
    डेमन, चैनल, कार्यस्थान या अन्य सेटअप विकल्प बदलना चाहते हों।

  </Step>
  <Step title="API-कुंजी का तरीका">
    API-कुंजी सेटअप अब भी xAI Console कुंजियों और उन मीडिया सतहों के लिए काम करता है
    जिन्हें कुंजी-समर्थित प्रदाता कॉन्फ़िगरेशन चाहिए:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="मॉडल चुनें">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw, बंडल किए हुए xAI ट्रांसपोर्ट के रूप में xAI Responses API का उपयोग करता है। `openclaw models auth login --provider xai --method oauth` या
`--method api-key` से प्राप्त वही क्रेडेंशियल `web_search` (प्रदाता आईडी `grok`), `x_search`,
`code_execution`, वाक्/प्रतिलेखन और xAI छवि/वीडियो जनरेशन को भी संचालित करता है। यदि आप
`plugins.entries.xai.config.webSearch.apiKey` के अंतर्गत xAI कुंजी संग्रहीत करते हैं, तो
बंडल किया हुआ xAI मॉडल प्रदाता उसे फ़ॉलबैक के रूप में भी पुनः उपयोग करता है।
</Note>

## OAuth समस्या निवारण

- SSH, Docker, VPS या अन्य रिमोट सेटअप के लिए
  `openclaw models auth login --provider xai --method oauth` का उपयोग करें; यह
  localhost कॉलबैक के बजाय डिवाइस-कोड सत्यापन का उपयोग करता है।
- यदि साइन-इन सफल हो जाता है, लेकिन Grok डिफ़ॉल्ट मॉडल नहीं है, तो
  `openclaw models set xai/grok-4.3` चलाएँ।
- सहेजी गई xAI प्रमाणीकरण प्रोफ़ाइलों की जाँच करें:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- xAI तय करता है कि कौन-से खाते OAuth API टोकन प्राप्त कर सकते हैं। यदि कोई खाता
  पात्र नहीं है, तो API-कुंजी वाले तरीके का उपयोग करें या xAI की ओर सदस्यता जाँचें।

<Tip>
SSH, Docker या VPS से साइन इन करते समय `xai-oauth` का उपयोग करें। OpenClaw एक
URL और छोटा कोड प्रिंट करता है; जब रिमोट प्रक्रिया पूर्ण टोकन विनिमय के लिए
xAI को पोल करती रहे, तब किसी भी स्थानीय ब्राउज़र में साइन-इन पूरा करें।
</Tip>

## अंतर्निहित कैटलॉग

मॉडल चयनकर्ताओं में चुने जा सकने वाले आईडी। Plugin अब भी मौजूदा कॉन्फ़िगरेशन के लिए पुराने Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast और Grok Code आईडी को रिज़ॉल्व करता है;
[पुरानी संगतता और बदलते उपनाम](#legacy-compatibility-and-moving-aliases) देखें।

| परिवार         | मॉडल आईडी                                                    |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (उपनाम: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (उपनाम: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
जहाँ उपलब्ध हो, सामान्य चैट, कोडिंग और एजेंट-आधारित कार्य के लिए `grok-4.5` का उपयोग करें।
Grok 4.3 क्षेत्रीय रूप से सुरक्षित सेटअप डिफ़ॉल्ट बना रहता है; `grok-build-0.1` और
तारीख़ वाले दोनों Grok 4.20 प्रकार चुने जा सकते हैं।
</Tip>

कैटलॉग संदर्भ और टोकन-लागत मेटाडेटा xAI के लाइव
[मॉडल पृष्ठों](https://docs.x.ai/developers/models) और
[मूल्य निर्धारण पृष्ठ](https://docs.x.ai/developers/pricing) का अनुसरण करता है। जब कोई अनुरोध उसकी दस्तावेज़ीकृत
लंबे-संदर्भ सीमा को पार करता है, तो xAI अधिक दरें लागू करता है; OpenClaw के समान
कैटलॉग लागत फ़ील्ड छोटे-संदर्भ की दरें दर्ज करते हैं। xAI का अलग
कोडिंग-एजेंट CLI, Grok Build, [x.ai/cli](https://x.ai/cli) पर उपलब्ध है और वर्तमान में
Grok 4.5 का उपयोग करता है।

## सुविधा कवरेज

बंडल किया हुआ Plugin समर्थित xAI API को OpenClaw के साझा प्रदाता और
टूल अनुबंधों पर मैप करता है। साझा अनुबंध में समाहित न होने वाली क्षमताएँ
नीचे या ज्ञात सीमाओं के अंतर्गत सूचीबद्ध हैं।

| xAI क्षमता                  | OpenClaw सतह                           | स्थिति                                               |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| चैट / Responses            | `xai/<model>` मॉडल प्रदाता            | हाँ                                                  |
| सर्वर-साइड वेब खोज         | `web_search` प्रदाता `grok`            | हाँ                                                  |
| सर्वर-साइड X खोज           | `x_search` टूल                         | हाँ                                                  |
| सर्वर-साइड कोड निष्पादन    | `code_execution` टूल                   | हाँ                                                  |
| छवियाँ                     | `image_generate`                        | हाँ                                                  |
| वीडियो                     | `video_generate`                        | हाँ                                                  |
| बैच टेक्स्ट-टू-स्पीच       | `messages.tts.provider: "xai"` / `tts`  | हाँ                                                  |
| स्ट्रीमिंग TTS              | `textToSpeechStream`                    | `wss://api.x.ai/v1/tts` के माध्यम से हाँ (रीयलटाइम वॉइस नहीं) |
| बैच स्पीच-टू-टेक्स्ट       | `tools.media.audio` मीडिया समझ | हाँ                                                  |
| स्ट्रीमिंग स्पीच-टू-टेक्स्ट | Voice Call `streaming.provider: "xai"`  | हाँ                                                  |
| रीयलटाइम वॉइस              | Talk `talk.realtime.provider: "xai"`    | हाँ; नेटिव Talk Node के लिए Gateway-रिले             |
| फ़ाइलें / बैच              | केवल सामान्य मॉडल API संगतता           | प्रथम-श्रेणी OpenClaw टूल नहीं                        |

<Note>
OpenClaw मीडिया जनरेशन और बैच प्रतिलेखन के लिए xAI के REST छवि/वीडियो/TTS/STT API,
लाइव वॉइस-कॉल प्रतिलेखन के लिए xAI का स्ट्रीमिंग STT WebSocket,
Talk रीयलटाइम सत्रों के लिए xAI का Grok Voice Agent WebSocket,
और चैट, खोज तथा कोड-निष्पादन टूल के लिए Responses API का उपयोग करता है।
</Note>

### पुराने फ़ास्ट-मोड की संगतता

`/fast on` या `agents.defaults.models["xai/<model>"].params.fastMode: true`
अब भी पुराने xAI कॉन्फ़िगरेशन को निम्न प्रकार पुनर्लिखता है। ये लक्ष्य आईडी
केवल संगतता के लिए रखे गए हैं; नए कॉन्फ़िगरेशन के लिए वर्तमान चयन योग्य मॉडल
का उपयोग करें।

| स्रोत मॉडल     | फ़ास्ट-मोड लक्ष्य   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### पुरानी संगतता और बदलते उपनाम

पुराने उपनाम निम्न प्रकार सामान्यीकृत होते हैं:

| पुराना उपनाम                                                   | सामान्यीकृत आईडी |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

0309 तारीख़ वाले आईडी चयन योग्य कैटलॉग प्रविष्टियाँ हैं। OpenClaw अन्य सभी
वर्तमान Grok 4.20 उपनामों को ज्यों का त्यों भेजता है, ताकि xAI स्थिर, नवीनतम,
बीटा, प्रयोगात्मक और तारीख़ वाले उपनामों के अर्थों पर नियंत्रण बनाए रखे। वैश्विक `grok-latest` उपनाम भी
ज्यों का त्यों सुरक्षित रखा जाता है।

xAI ने निम्न सटीक आईडी को सेवानिवृत्त कर दिया है। OpenClaw उन्हें जारी किए गए कॉन्फ़िगरेशन के लिए
छिपी हुई संगतता पंक्तियों के रूप में रखता है, जिनकी सीमाएँ और मूल्य निर्धारण उनके वर्तमान
रीडायरेक्ट लक्ष्यों के अनुरूप हैं:

| सेवानिवृत्त आईडी                                                     | वर्तमान व्यवहार                       |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | `low` रीजनिंग के साथ Grok 4.3    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | रीजनिंग अक्षम के साथ Grok 4.3 |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine छवि गुणवत्ता       |

`openclaw doctor --fix` स्थायी xAI सर्वर-टूल डिफ़ॉल्ट और
सेवानिवृत्त गुणवत्ता छवि स्लग को अपडेट करता है, पुराने जनरेट किए गए कैटलॉग पंक्तियाँ हटाता है और
सक्रिय 4.20 पंक्तियों पर पुराने संदर्भ मेटाडेटा की मरम्मत करता है। यह सक्रिय 4.20
`beta-latest` उपनामों को तारीख़ वाले स्नैपशॉट पर पिन नहीं करता।

## सुविधाएँ

<Warning>
  `x_search` और `code_execution` xAI के सर्वरों पर चलते हैं। xAI प्रति 1,000
  टूल कॉल के लिए $5, साथ ही मॉडल के इनपुट और आउटपुट टोकन का शुल्क लेता है। प्रत्येक टूल की
  `enabled` सेटिंग छोड़े जाने पर, OpenClaw उसे केवल सक्रिय xAI मॉडल के लिए उपलब्ध कराता है।
  किसी ज्ञात गैर-xAI मॉडल प्रदाता के लिए स्पष्ट प्रति-टूल `enabled: true` आवश्यक है;
  अनुपस्थित या अनरिज़ॉल्व्ड प्रदाता बंद स्थिति में विफल होता है। xAI प्रमाणीकरण हमेशा आवश्यक है,
  और `enabled: false` प्रत्येक प्रदाता के लिए टूल अक्षम कर देता है।
</Warning>

<AccordionGroup>
  <Accordion title="वेब खोज">
    बंडल किया हुआ `grok` वेब-खोज प्रदाता पहले xAI OAuth को प्राथमिकता देता है, फिर
    `XAI_API_KEY` या Plugin वेब-खोज कुंजी का फ़ॉलबैक उपयोग करता है:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="वीडियो जनरेशन">
    बंडल किया हुआ `xai` Plugin साझा
    `video_generate` टूल के माध्यम से वीडियो जनरेशन पंजीकृत करता है।

    - डिफ़ॉल्ट मॉडल: `xai/grok-imagine-video`
    - अतिरिक्त मॉडल: `xai/grok-imagine-video-1.5`
    - क्लासिक मोड: टेक्स्ट-टू-वीडियो, इमेज-टू-वीडियो, संदर्भ-छवि जनरेशन,
      रिमोट वीडियो संपादन और रिमोट वीडियो विस्तार
    - Video 1.5 मोड: केवल इमेज-टू-वीडियो, ठीक एक प्रथम-फ़्रेम छवि के साथ
    - आस्पेक्ट अनुपात: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      छोड़े जाने पर क्लासिक और Video 1.5 इमेज-टू-वीडियो स्रोत छवि का अनुपात
      अपनाते हैं
    - रिज़ॉल्यूशन: क्लासिक `480P`/`720P`; Video 1.5, `1080P` का भी समर्थन करता है; सभी
      जनरेशन मोड का डिफ़ॉल्ट `480P` है
    - अवधि: जनरेशन/इमेज-टू-वीडियो के लिए 1-15 सेकंड, क्लासिक
      `reference_image` भूमिकाओं का उपयोग करते समय 1-10 सेकंड, क्लासिक विस्तार के लिए 2-10 सेकंड
    - संदर्भ-छवि जनरेशन: दी गई प्रत्येक छवि के लिए `imageRoles` को
      `reference_image` पर सेट करें; xAI ऐसी अधिकतम 7 छवियाँ स्वीकार करता है
    - वीडियो संपादन/विस्तार इनपुट वीडियो का आस्पेक्ट अनुपात और रिज़ॉल्यूशन अपनाते हैं;
      वे ऑपरेशन ज्यामिति ओवरराइड स्वीकार नहीं करते
    - डिफ़ॉल्ट ऑपरेशन टाइमआउट: 600 सेकंड, जब तक `video_generate.timeoutMs`
      या `agents.defaults.videoGenerationModel.timeoutMs` सेट न हो

    <Warning>
    स्थानीय वीडियो बफ़र स्वीकार नहीं किए जाते। वीडियो संपादन/विस्तार इनपुट के लिए रिमोट `http(s)` URL का उपयोग करें।
    इमेज-टू-वीडियो स्थानीय छवि बफ़र स्वीकार करता है, क्योंकि
    OpenClaw उन्हें xAI के लिए डेटा URL के रूप में एन्कोड करता है।
    </Warning>

    Video 1.5, xAI के `grok-imagine-video-1.5-preview` और
    `grok-imagine-video-1.5-2026-05-30` पहचानकर्ताओं को भी पहचानता है। OpenClaw
    चयनित पहचानकर्ता को अपरिवर्तित अग्रेषित करता है, लेकिन वही केवल-छवि सत्यापन लागू करता है।

    xAI को डिफ़ॉल्ट वीडियो प्रदाता के रूप में उपयोग करने के लिए:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    साझा टूल पैरामीटर, प्रोवाइडर चयन और फ़ेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
    </Note>

  </Accordion>

  <Accordion title="इमेज जनरेशन">
    बंडल किया गया `xai` Plugin साझा
    `image_generate` टूल के माध्यम से इमेज जनरेशन पंजीकृत करता है।

    - डिफ़ॉल्ट इमेज मॉडल: `xai/grok-imagine-image`
    - अतिरिक्त मॉडल: `xai/grok-imagine-image-quality`
    - मोड: टेक्स्ट-टू-इमेज और संदर्भ-इमेज संपादन
    - संदर्भ इनपुट: एक `image` या अधिकतम तीन `images`
    - आस्पेक्ट रेशियो: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - रिज़ॉल्यूशन: `1K`, `2K`
    - संख्या: अधिकतम 4 इमेज
    - डिफ़ॉल्ट ऑपरेशन टाइमआउट: 600 सेकंड, जब तक `image_generate.timeoutMs`
      या `agents.defaults.imageGenerationModel.timeoutMs` सेट न हो

    OpenClaw xAI से `b64_json` इमेज प्रतिक्रियाएँ माँगता है, ताकि जनरेट किया गया मीडिया
    सामान्य चैनल अटैचमेंट पथ के माध्यम से संग्रहीत और वितरित किया जा सके। स्थानीय
    संदर्भ इमेज को डेटा URL में बदला जाता है; रिमोट `http(s)` संदर्भ
    बिना बदलाव के आगे भेजे जाते हैं।

    xAI को डिफ़ॉल्ट इमेज प्रोवाइडर के रूप में उपयोग करने के लिए:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI `quality`, `mask`, `user` और एक `auto` आस्पेक्ट रेशियो का भी दस्तावेज़ीकरण करता है।
    OpenClaw फ़िलहाल केवल साझा क्रॉस-प्रोवाइडर इमेज नियंत्रण आगे भेजता है;
    ये केवल-नेटिव नियंत्रण `image_generate` के माध्यम से उपलब्ध नहीं कराए जाते।
    </Note>

  </Accordion>

  <Accordion title="टेक्स्ट-टू-स्पीच">
    बंडल किया गया `xai` Plugin साझा `tts`
    प्रोवाइडर सतह के माध्यम से टेक्स्ट-टू-स्पीच पंजीकृत करता है।

    - आवाज़ें: xAI से प्रमाणित लाइव कैटलॉग; इसे
      `openclaw infer tts voices --provider xai` से सूचीबद्ध करें
    - ऑफ़लाइन फ़ॉलबैक आवाज़ें: `ara`, `eve`, `leo`, `rex`, `sal`
    - डिफ़ॉल्ट आवाज़: `eve`
    - खाते की कस्टम वॉइस ID बिल्ट-इन कैटलॉग प्रतिक्रिया में अनुपस्थित होने पर भी
      आगे भेजी जाती हैं
    - फ़ॉर्मेट: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - भाषा: BCP-47 कोड या `auto`
    - गति: प्रोवाइडर-नेटिव गति ओवरराइड
    - नेटिव Opus वॉइस-नोट फ़ॉर्मेट समर्थित नहीं है

    xAI को डिफ़ॉल्ट TTS प्रोवाइडर के रूप में उपयोग करने के लिए:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw बफ़र किए गए सिंथेसिस के लिए xAI के बैच `/v1/tts` एंडपॉइंट,
    प्रमाणित `/v1/tts/voices` कैटलॉग खोज और स्ट्रीमिंग सिंथेसिस के लिए नेटिव
    `wss://api.x.ai/v1/tts` का उपयोग करता है। स्ट्रीमिंग नेटिव
    `api.x.ai` होस्ट तक सीमित है, इसलिए इस पथ पर कस्टम `baseUrl` मान अस्वीकार कर दिए जाते हैं।
    यह मौजूदा भाषा, आवाज़, कोडेक और गति नियंत्रणों का उपयोग करता है; सैंपल रेट
    और बिट रेट पर xAI के डिफ़ॉल्ट लागू होते हैं। ऑडियो-फ़ाइल सिंथेसिस सभी
    कॉन्फ़िगर किए गए कोडेक का पालन करता है। वॉइस-नोट लक्ष्य स्ट्रीमिंग और बफ़र किए गए
    फ़ॉलबैक के लिए MP3 का उपयोग करते हैं, क्योंकि xAI के रॉ कोडेक में कोडेक/रेट मेटाडेटा नहीं होता।
    स्ट्रीम `text.delta` और फिर
    `text.done` भेजती है, `audio.delta`, `audio.done` या `error` प्राप्त करती है और ऐसा
    निष्क्रिय `timeoutMs` लागू करती है जो प्रत्येक ऑडियो चंक पर रीफ़्रेश होता है। यह
    रियलटाइम वॉइस सत्रों से अलग है। xAI का [स्ट्रीमिंग TTS API](https://docs.x.ai/developers/rest-api-reference/inference/voice) अनुबंध देखें।
    </Note>

  </Accordion>

  <Accordion title="स्पीच-टू-टेक्स्ट">
    बंडल किया गया `xai` Plugin OpenClaw की
    मीडिया-अंडरस्टैंडिंग ट्रांसक्रिप्शन सतह के माध्यम से बैच स्पीच-टू-टेक्स्ट पंजीकृत करता है।

    - एंडपॉइंट: xAI REST `/v1/stt`
    - इनपुट पथ: मल्टीपार्ट ऑडियो फ़ाइल अपलोड
    - मॉडल चयन: xAI ट्रांसक्रिप्शन मॉडल को आंतरिक रूप से चुनता है;
      एंडपॉइंट में कोई मॉडल चयनकर्ता नहीं है
    - जहाँ भी इनबाउंड ऑडियो ट्रांसक्रिप्शन `tools.media.audio` को पढ़ता है, वहाँ उपयोग होता है,
      जिसमें Discord वॉइस-चैनल सेगमेंट और चैनल ऑडियो अटैचमेंट शामिल हैं

    इनबाउंड ऑडियो ट्रांसक्रिप्शन के लिए xAI को बाध्य करने हेतु:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    भाषा साझा ऑडियो मीडिया कॉन्फ़िगरेशन या प्रति-कॉल
    ट्रांसक्रिप्शन अनुरोध के माध्यम से दी जा सकती है। प्रॉम्प्ट संकेत साझा OpenClaw
    सतह द्वारा स्वीकार किए जाते हैं, लेकिन xAI REST STT एकीकरण केवल फ़ाइल और भाषा
    आगे भेजता है, क्योंकि वर्तमान सार्वजनिक xAI एंडपॉइंट में केवल इन्हीं का मैपिंग होता है।

  </Accordion>

  <Accordion title="स्ट्रीमिंग स्पीच-टू-टेक्स्ट">
    बंडल किया गया `xai` Plugin लाइव वॉइस-कॉल ऑडियो के लिए
    एक रियलटाइम ट्रांसक्रिप्शन प्रोवाइडर भी पंजीकृत करता है।

    - एंडपॉइंट: xAI WebSocket `wss://api.x.ai/v1/stt`
    - डिफ़ॉल्ट एन्कोडिंग: `mulaw`
    - डिफ़ॉल्ट सैंपल रेट: `8000`
    - डिफ़ॉल्ट एंडपॉइंटिंग: `800ms`
    - अंतरिम ट्रांसक्रिप्ट: डिफ़ॉल्ट रूप से सक्षम

    Voice Call की Twilio मीडिया स्ट्रीम G.711 mu-law ऑडियो फ़्रेम भेजती है, इसलिए
    xAI प्रोवाइडर उन फ़्रेम को ट्रांसकोड किए बिना सीधे आगे भेजता है:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
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

    प्रोवाइडर-स्वामित्व वाला कॉन्फ़िगरेशन
    `plugins.entries.voice-call.config.streaming.providers.xai` के अंतर्गत रहता है। समर्थित
    कुंजियाँ `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` या
    `alaw`), `interimResults`, `endpointingMs` और `language` हैं।

    <Note>
    यह स्ट्रीमिंग प्रोवाइडर Voice Call के रियलटाइम ट्रांसक्रिप्शन पथ के लिए है।
    Discord वॉइस छोटे सेगमेंट रिकॉर्ड करता है और इसके बजाय बैच
    `tools.media.audio` ट्रांसक्रिप्शन पथ का उपयोग करता है।
    </Note>

  </Accordion>

  <Accordion title="रियलटाइम वॉइस (Talk)">
    बंडल किया गया `xai` Plugin साझा `registerRealtimeVoiceProvider` अनुबंध के माध्यम से
    Talk मोड के लिए Grok Voice Agent रियलटाइम सत्र पंजीकृत करता है।

    - एंडपॉइंट: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - डिफ़ॉल्ट मॉडल: `grok-voice-latest`
    - डिफ़ॉल्ट आवाज़: `eve`
    - ट्रांसपोर्ट: `gateway-relay` (iOS, Android और Control UI रिले पथ)
    - ऑडियो: PCM16 24 kHz या G.711 µ-law 8 kHz
    - बार्ज-इन: xAI सर्वर VAD प्रतिक्रिया को बाधित करता है; OpenClaw कतारबद्ध प्लेबैक साफ़ करता है
      और न चलाए गए प्रोवाइडर इतिहास को ट्रंकेट करता है

    Gateway पर Talk कॉन्फ़िगर करें:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // केवल तभी ऑप्ट इन करें जब प्रोवाइडर-पक्षीय सत्र रीप्ले स्वीकार्य हो।
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    जब Voice Call या साझा रियलटाइम चयनकर्ता उसी प्रोवाइडर मैप का पुनः उपयोग करते हैं,
    तब प्रोवाइडर-स्वामित्व वाला कॉन्फ़िगरेशन
    `plugins.entries.voice-call.config.realtime.providers.xai` से भी रिज़ॉल्व होता है। समर्थित कुंजियाँ
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` और `sessionResumption` हैं।
    xAI Voice Agent API से मेल खाते हुए, `reasoningEffort` केवल `high` या `none` स्वीकार करता है।

    xAI का सर्वर VAD हमेशा प्रतिक्रियाएँ बनाता है और ऑडियो व्यवधान संभालता है।
    `consultRouting: "provider-direct"` का उपयोग करें; बाध्य ट्रांसक्रिप्ट रूटिंग और
    इनपुट-ऑडियो व्यवधान अक्षम करना xAI Voice Agent प्रोटोकॉल द्वारा समर्थित नहीं है।

    <Note>
    xAI OAuth या `XAI_API_KEY` रियलटाइम वॉइस को प्रमाणित कर सकता है। ब्राउज़र-स्वामित्व वाला
    WebRTC अभी इस प्रोवाइडर सतह का हिस्सा नहीं है; नेटिव Node पर gateway-relay Talk या
    Control UI रिले पथ का उपयोग करें।
    </Note>

    <Note>
    `sessionResumption` का डिफ़ॉल्ट `false` है। इसे `true` पर सेट करने पर, OpenClaw
    xAI से इतना सत्र स्टेट बनाए रखने को कहता है कि पुनः कनेक्ट होने के बाद उसी बातचीत को
    फिर से शुरू किया जा सके, और फिर लौटाई गई वार्तालाप ID के साथ पुनः कनेक्ट करता है। यदि
    प्रोवाइडर-पक्षीय रीप्ले/प्रतिधारण स्वीकार्य नहीं है, तो इसे अक्षम रखें; बाधित
    सॉकेट तब चुपचाप नई बातचीत शुरू करने के बजाय बंद होकर विफल होते हैं।
    </Note>

  </Accordion>

  <Accordion title="x_search कॉन्फ़िगरेशन">
    बंडल किया गया xAI Plugin Grok के माध्यम से X (पूर्व नाम Twitter) सामग्री खोजने हेतु
    `x_search` को OpenClaw टूल के रूप में उपलब्ध कराता है।

    कॉन्फ़िगरेशन पथ: `plugins.entries.xai.config.xSearch`

    | कुंजी              | प्रकार  | डिफ़ॉल्ट                  | विवरण                                           |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | बूलियन | xAI मॉडल के लिए स्वचालित | अक्षम करें या किसी ज्ञात गैर-xAI प्रोवाइडर के लिए ऑप्ट इन करें |
    | `model`           | स्ट्रिंग | `grok-4.3`                | x_search अनुरोधों के लिए उपयोग किया गया मॉडल    |
    | `baseUrl`         | स्ट्रिंग | -                         | xAI Responses बेस URL ओवरराइड                   |
    | `inlineCitations` | बूलियन | -                         | परिणामों में इनलाइन उद्धरण शामिल करें           |
    | `maxTurns`        | संख्या  | -                         | अधिकतम वार्तालाप टर्न                            |
    | `timeoutSeconds`  | संख्या  | `30`                      | अनुरोध टाइमआउट, सेकंड में                        |
    | `cacheTtlMinutes` | संख्या  | `15`                      | कैश टाइम-टू-लाइव, मिनट में                       |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="कोड निष्पादन कॉन्फ़िगरेशन">
    बंडल किया गया xAI Plugin xAI के सैंडबॉक्स वातावरण में
    रिमोट कोड निष्पादन के लिए `code_execution` को OpenClaw टूल के रूप में उपलब्ध कराता है।

    कॉन्फ़िगरेशन पथ: `plugins.entries.xai.config.codeExecution`

    | कुंजी              | प्रकार    | डिफ़ॉल्ट                  | विवरण                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | xAI मॉडल के लिए स्वचालित | अक्षम करें, या किसी ज्ञात गैर-xAI प्रदाता के लिए सहमति दें |
    | `model`          | string  | `grok-4.3`               | कोड निष्पादन अनुरोधों के लिए उपयोग किया जाने वाला मॉडल           |
    | `maxTurns`       | number  | -                        | वार्तालाप के अधिकतम टर्न                       |
    | `timeoutSeconds` | number  | `30`                     | अनुरोध की समय-सीमा, सेकंड में                       |

    <Note>
    यह दूरस्थ xAI सैंडबॉक्स निष्पादन है, स्थानीय [`exec`](/hi/tools/exec) नहीं।
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ज्ञात सीमाएँ">
    - xAI प्रमाणीकरण API कुंजी, पर्यावरण चर, Plugin कॉन्फ़िगरेशन
      फ़ॉलबैक, या पात्र xAI खाते के साथ OAuth का उपयोग कर सकता है। OAuth लोकलहोस्ट
      कॉलबैक के बिना डिवाइस-कोड सत्यापन का उपयोग करता है। xAI तय करता है कि किन खातों
      को OAuth API टोकन मिल सकते हैं, और सहमति पृष्ठ पर Grok Build
      दिख सकता है, भले ही OpenClaw को Grok Build ऐप की आवश्यकता नहीं है।
    - OpenClaw वर्तमान में xAI मल्टी-एजेंट मॉडल परिवार उपलब्ध नहीं कराता। xAI
      इन मॉडलों को Responses API के माध्यम से उपलब्ध कराता है, लेकिन वे OpenClaw के
      साझा एजेंट लूप द्वारा उपयोग किए जाने वाले क्लाइंट-साइड या कस्टम टूल स्वीकार नहीं करते।
      देखें
      [xAI मल्टी-एजेंट सीमाएँ](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)।
    - xAI Realtime वॉइस वर्तमान में केवल gateway-relay Talk ट्रांसपोर्ट उपलब्ध कराता है।
      ब्राउज़र-स्वामित्व वाले प्रदाता WebSocket सत्र अभी Control UI में
      जुड़े नहीं हैं।
    - xAI इमेज `quality`, इमेज `mask`, और अतिरिक्त केवल-नेटिव आस्पेक्ट रेशियो
      तब तक उपलब्ध नहीं कराए जाते, जब तक साझा `image_generate` टूल में उनके अनुरूप
      क्रॉस-प्रदाता नियंत्रण नहीं होते।
  </Accordion>

  <Accordion title="उन्नत टिप्पणियाँ">
    - OpenClaw साझा रनर पथ पर xAI-विशिष्ट टूल-स्कीमा और टूल-कॉल संगतता
      सुधार स्वचालित रूप से लागू करता है।
    - नेटिव xAI अनुरोधों में डिफ़ॉल्ट रूप से `tool_stream: true` होता है। इसे
      अक्षम करने के लिए `agents.defaults.models["xai/<model>"].params.tool_stream` को `false`
      पर सेट करें।
    - बंडल किया गया xAI रैपर नेटिव xAI अनुरोध भेजने से पहले असमर्थित contains-count स्कीमा सीमाएँ
      और असमर्थित reasoning *effort* पेलोड कुंजियाँ हटा देता है।
      Grok 4.5 निम्न, मध्यम और उच्च effort का समर्थन करता है (डिफ़ॉल्ट उच्च)।
      Grok 4.3 कोई नहीं, निम्न, मध्यम और उच्च effort का समर्थन करता है
      (डिफ़ॉल्ट निम्न)। अन्य रीजनिंग-सक्षम xAI मॉडल कॉन्फ़िगर करने योग्य
      effort नियंत्रण उपलब्ध नहीं कराते, लेकिन फिर भी `include: ["reasoning.encrypted_content"]`
      का अनुरोध करते हैं, ताकि बाद के टर्न में पिछली एन्क्रिप्ट की गई रीजनिंग
      को फिर से चलाया जा सके।
    - `web_search`, `x_search`, और `code_execution` OpenClaw
      टूल के रूप में उपलब्ध कराए जाते हैं। प्रत्येक चैट टर्न में हर नेटिव टूल जोड़ने के बजाय,
      OpenClaw प्रत्येक टूल के अनुरोध में केवल वही विशिष्ट xAI बिल्ट-इन जोड़ता है
      जिसकी उस टूल को आवश्यकता होती है।
    - Grok `web_search`, `plugins.entries.xai.config.webSearch.baseUrl` को पढ़ता है।
      `x_search`, `plugins.entries.xai.config.xSearch.baseUrl` को पढ़ता है, फिर
      Grok वेब-सर्च बेस URL पर फ़ॉलबैक करता है।
    - `x_search` और `code_execution` को मुख्य मॉडल रनटाइम में हार्डकोड करने के बजाय
      बंडल किया गया xAI Plugin नियंत्रित करता है।
    - `code_execution` दूरस्थ xAI सैंडबॉक्स निष्पादन है, स्थानीय
      [`exec`](/hi/tools/exec) नहीं।
  </Accordion>
</AccordionGroup>

## लाइव परीक्षण

xAI मीडिया पथ यूनिट परीक्षणों और ऑप्ट-इन लाइव सुइट द्वारा कवर किए जाते हैं। लाइव प्रोब
चलाने से पहले प्रक्रिया पर्यावरण में `XAI_API_KEY` निर्यात करें।

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

प्रदाता-विशिष्ट लाइव फ़ाइल सामान्य TTS और टेलीफ़ोनी-अनुकूल PCM
TTS संश्लेषित करती है, xAI बैच STT के माध्यम से ऑडियो का ट्रांसक्रिप्शन करती है, उसी PCM को xAI
रीयलटाइम STT के माध्यम से स्ट्रीम करती है, टेक्स्ट-टू-इमेज आउटपुट उत्पन्न करती है और संदर्भ इमेज संपादित करती है।
साझा इमेज लाइव फ़ाइल OpenClaw के रनटाइम चयन, फ़ॉलबैक,
नॉर्मलाइज़ेशन और मीडिया अटैचमेंट पथ के माध्यम से उसी xAI प्रदाता को सत्यापित करती है। ऑप्ट-इन
Video 1.5 केस 1080P पर उत्पन्न पहली-फ़्रेम इमेज सबमिट करता है और
पूर्ण वीडियो डाउनलोड को सत्यापित करता है।

## संबंधित

<CardGroup cols={2}>
  <Card title="मॉडल चयन" href="/hi/concepts/model-providers" icon="layers">
    प्रदाताओं, मॉडल रेफ़रेंस और फ़ेलओवर व्यवहार का चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="सभी प्रदाता" href="/hi/providers/index" icon="grid-2">
    प्रदाताओं का व्यापक अवलोकन।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और समाधान।
  </Card>
</CardGroup>
