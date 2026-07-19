---
read_when:
    - एजेंट के माध्यम से वीडियो जनरेट करना
    - वीडियो जनरेशन प्रदाताओं और मॉडलों को कॉन्फ़िगर करना
    - video_generate टूल के पैरामीटर को समझना
sidebarTitle: Video generation
summary: 16 प्रदाता बैकएंड में टेक्स्ट, इमेज या वीडियो संदर्भों से video_generate के माध्यम से वीडियो जनरेट करें
title: वीडियो निर्माण
x-i18n:
    generated_at: "2026-07-19T10:01:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9ec1b1fb7054c1a4ce16b9d1aae910774175381233fa7b9b8fd7df32c22ba3f8
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw एजेंट टेक्स्ट प्रॉम्प्ट, संदर्भ इमेज या मौजूदा वीडियो से
`video_generate` के माध्यम से वीडियो बनाते हैं। सोलह प्रोवाइडर बैकएंड
समर्थित हैं; एजेंट कॉन्फ़िगरेशन और उपलब्ध API कुंजियों के आधार पर अपने-आप
सही बैकएंड चुनता है।

<Note>
`video_generate` केवल तभी दिखाई देता है, जब कम-से-कम एक वीडियो-जनरेशन प्रोवाइडर
उपलब्ध हो। यदि यह आपके एजेंट टूल में मौजूद नहीं है, तो किसी प्रोवाइडर की API कुंजी सेट करें या
`agents.defaults.videoGenerationModel` कॉन्फ़िगर करें।
</Note>

`video_generate` में तीन रनटाइम मोड हैं, जिन्हें कॉल के संदर्भ इनपुट
से निर्धारित किया जाता है:

- `generate` - कोई संदर्भ मीडिया नहीं (टेक्स्ट-से-वीडियो)।
- `imageToVideo` - एक या अधिक संदर्भ इमेज।
- `videoToVideo` - एक या अधिक संदर्भ वीडियो।

प्रोवाइडर इन मोड के किसी भी उपसमुच्चय का समर्थन कर सकते हैं। टूल सबमिशन से पहले
सक्रिय मोड को सत्यापित करता है और `action=list` में समर्थित मोड की जानकारी देता है।

## त्वरित शुरुआत

<Steps>
  <Step title="प्रमाणीकरण कॉन्फ़िगर करें">
    किसी भी समर्थित प्रोवाइडर के लिए API कुंजी सेट करें:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="डिफ़ॉल्ट मॉडल चुनें (वैकल्पिक)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="एजेंट से कहें">
    > सूर्यास्त के समय सर्फ़िंग करते हुए एक दोस्ताना लॉब्स्टर का 5-सेकंड का सिनेमाई वीडियो बनाएँ।

    एजेंट अपने-आप `video_generate` को कॉल करता है। टूल को अनुमति-सूची में जोड़ने की
    आवश्यकता नहीं है।

  </Step>
</Steps>

## एसिंक्रोनस जनरेशन कैसे काम करता है

वीडियो जनरेशन एसिंक्रोनस होता है:

1. OpenClaw प्रोवाइडर को अनुरोध सबमिट करता है और तुरंत एक टास्क आईडी लौटाता है।
2. प्रोवाइडर बैकग्राउंड में जॉब को प्रोसेस करता है (आमतौर पर प्रोवाइडर और रिज़ॉल्यूशन के आधार पर 30 सेकंड से कई मिनट तक; धीमे कतार-समर्थित प्रोवाइडर कॉन्फ़िगर किए गए टाइमआउट तक चल सकते हैं)।
3. वीडियो तैयार होने पर OpenClaw उसी सेशन को एक आंतरिक पूर्णता इवेंट के साथ सक्रिय करता है।
4. एजेंट सेशन के सामान्य दृश्यमान-जवाब मोड के माध्यम से इसकी जानकारी देता है:
   स्वचालित अंतिम जवाब, या जब सेशन को मैसेज टूल की आवश्यकता हो तब
   `message(action="send")`। यदि अनुरोधकर्ता सेशन निष्क्रिय है, या उसका सक्रियण विफल हो जाता है और
   जनरेट किया गया मीडिया अभी भी पूर्णता जवाब में नहीं है, तो OpenClaw
   मीडिया के साथ एक आइडेम्पोटेंट सीधा फ़ॉलबैक भेजता है।

जब कोई जॉब चल रहा होता है, तो उसी सेशन में डुप्लिकेट `video_generate`
कॉल नया जनरेशन शुरू करने के बजाय वर्तमान टास्क स्थिति लौटाते हैं।
नया जनरेशन ट्रिगर किए बिना जाँचने के लिए `action: "status"`, या CLI से
`openclaw tasks list` / `openclaw tasks show <lookup>` का उपयोग करें
([बैकग्राउंड टास्क](/hi/automation/tasks) देखें)।

सेशन-समर्थित एजेंट रन के बाहर (उदाहरण के लिए, सीधे टूल इनवोकेशन में),
टूल इनलाइन जनरेशन पर वापस जाता है और उसी टर्न में अंतिम मीडिया पाथ
लौटाता है।

जब प्रोवाइडर बाइट लौटाता है, तो जनरेट की गई वीडियो फ़ाइलें OpenClaw-प्रबंधित
मीडिया स्टोरेज में सहेजी जाती हैं। डिफ़ॉल्ट सीमा 16MB (साझा वीडियो मीडिया
सीमा) है; बड़े रेंडर के लिए `agents.defaults.mediaMaxMb` इसे बढ़ाता है। जब कोई
प्रोवाइडर होस्ट किया गया आउटपुट URL भी लौटाता है, तो स्थानीय स्थायी भंडारण द्वारा
अधिक आकार वाली फ़ाइल अस्वीकार किए जाने पर टास्क को विफल करने के बजाय OpenClaw वह URL भेजता है।

### टास्क जीवनचक्र

| स्थिति       | अर्थ                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | टास्क बनाया गया है और प्रोवाइडर द्वारा स्वीकार किए जाने की प्रतीक्षा कर रहा है।                                                   |
| `running`   | प्रोवाइडर प्रोसेस कर रहा है (आमतौर पर प्रोवाइडर और रिज़ॉल्यूशन के आधार पर 30 सेकंड से कई मिनट तक)। |
| `succeeded` | वीडियो तैयार है; एजेंट सक्रिय होकर उसे बातचीत में पोस्ट करता है।                                         |
| `failed`    | प्रोवाइडर त्रुटि या टाइमआउट; एजेंट त्रुटि विवरण के साथ सक्रिय होता है।                                         |

CLI से स्थिति जाँचें:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## समर्थित प्रोवाइडर

| प्रोवाइडर              | डिफ़ॉल्ट मॉडल                   | टेक्स्ट | इमेज संदर्भ                                            | वीडियो संदर्भ                                       | प्रमाणीकरण                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | हाँ (रिमोट URL)                                     | हाँ (रिमोट URL)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (बंडल किया गया)    | `seedance-1-0-pro-250528`       |  ✓   | अधिकतम 2 इमेज (पहला + अंतिम फ़्रेम)                  | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus 1.5 Plugin   | `seedance-1-5-pro-251215`       |  ✓   | अधिकतम 2 इमेज (भूमिका के माध्यम से पहला + अंतिम फ़्रेम)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | अधिकतम 9 संदर्भ इमेज                             | अधिकतम 3 वीडियो                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 इमेज                                              | -                                               | `COMFY_API_KEY` या `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 इमेज; Seedance संदर्भ-से-वीडियो के साथ अधिकतम 9    | Seedance संदर्भ-से-वीडियो के साथ अधिकतम 3 वीडियो | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 इमेज                                              | 1 वीडियो                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 इमेज                                              | -                                               | `MINIMAX_API_KEY` या MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1 इमेज                                              | 1 वीडियो                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | अधिकतम 4 इमेज (पहला/अंतिम फ़्रेम या संदर्भ)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | हाँ (रिमोट URL)                                     | हाँ (रिमोट URL)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 इमेज                                              | 1 वीडियो                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | केवल `Wan-AI/Wan2.2-I2V-A14B`                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 इमेज (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classic: 1 पहला फ़्रेम या 7 संदर्भ; 1.5: 1 फ़्रेम | Classic: 1 वीडियो                                | `XAI_API_KEY`                            |

कुछ प्रोवाइडर अतिरिक्त या वैकल्पिक API कुंजी एनवायरनमेंट वेरिएबल स्वीकार करते हैं।
विवरण के लिए अलग-अलग [प्रोवाइडर पेज](#related) देखें।

रनटाइम पर उपलब्ध प्रोवाइडर, मॉडल और रनटाइम मोड देखने के लिए
`video_generate action=list` चलाएँ।

### क्षमता मैट्रिक्स

`video_generate`, अनुबंध परीक्षणों और साझा लाइव स्वीप द्वारा उपयोग किया जाने वाला
स्पष्ट मोड अनुबंध:

| प्रोवाइडर   | `generate` | `imageToVideo` | `videoToVideo` | आज की साझा लाइव लेन                                                                                                                 |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` छोड़ दिया गया है क्योंकि इस प्रोवाइडर को रिमोट `http(s)` वीडियो URL चाहिए                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | साझा स्वीप में नहीं; वर्कफ़्लो-विशिष्ट कवरेज Comfy परीक्षणों में मौजूद है                                                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`; Plugin अनुबंध में नेटिव DeepInfra वीडियो स्कीमा टेक्स्ट-से-वीडियो हैं                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` केवल Seedance संदर्भ-से-वीडियो का उपयोग करते समय                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; साझा `videoToVideo` छोड़ दिया गया है क्योंकि वर्तमान बफ़र-समर्थित Gemini/Veo स्वीप उस इनपुट को स्वीकार नहीं करता |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; साझा `videoToVideo` छोड़ दिया गया है क्योंकि इस संगठन/इनपुट पाथ को वर्तमान में प्रोवाइडर-पक्षीय वीडियो संपादन पहुँच की आवश्यकता है   |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` छोड़ दिया गया है क्योंकि इस प्रोवाइडर को रिमोट `http(s)` वीडियो URL चाहिए                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`; `videoToVideo` केवल तभी चलता है जब चयनित मॉडल `runway/gen4_aleph` हो                                     |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`; साझा `imageToVideo` छोड़ दिया गया है क्योंकि बंडल किया गया `veo3` केवल टेक्स्ट के लिए है और बंडल किए गए `kling` को रिमोट इमेज URL चाहिए           |
| xAI        |     ✓      |       ✓        |       ✓        | Classic सभी मोड का समर्थन करता है; Video 1.5 केवल इमेज-से-वीडियो है; रिमोट MP4 इनपुट के कारण `videoToVideo` साझा स्वीप से बाहर रहता है             |

## टूल पैरामीटर

### आवश्यक

<ParamField path="prompt" type="string" required>
  जनरेट किए जाने वाले वीडियो का पाठ विवरण। `action: "generate"` के लिए आवश्यक।
</ParamField>

### सामग्री इनपुट

<ParamField path="image" type="string">एकल संदर्भ छवि (पथ या URL)।</ParamField>
<ParamField path="images" type="string[]">एकाधिक संदर्भ छवियाँ (अधिकतम 9)।</ParamField>
<ParamField path="imageRoles" type="string[]">
संयुक्त छवि सूची के समानांतर वैकल्पिक प्रति-स्थान भूमिका संकेत।
मानक मान: `first_frame`, `last_frame`, `reference_image`।
</ParamField>
<ParamField path="video" type="string">एकल संदर्भ वीडियो (पथ या URL)।</ParamField>
<ParamField path="videos" type="string[]">एकाधिक संदर्भ वीडियो (अधिकतम 4)।</ParamField>
<ParamField path="videoRoles" type="string[]">
संयुक्त वीडियो सूची के समानांतर वैकल्पिक प्रति-स्थान भूमिका संकेत।
मानक मान: `reference_video`।
</ParamField>
<ParamField path="audioRef" type="string">
एकल संदर्भ ऑडियो (पथ या URL)। जब प्रदाता ऑडियो इनपुट का समर्थन करता है,
तब पृष्ठभूमि संगीत या आवाज़ के संदर्भ के लिए उपयोग किया जाता है।
</ParamField>
<ParamField path="audioRefs" type="string[]">एकाधिक संदर्भ ऑडियो (अधिकतम 3)।</ParamField>
<ParamField path="audioRoles" type="string[]">
संयुक्त ऑडियो सूची के समानांतर वैकल्पिक प्रति-स्थान भूमिका संकेत।
मानक मान: `reference_audio`।
</ParamField>

<Note>
भूमिका संकेत प्रदाता को ज्यों के त्यों अग्रेषित किए जाते हैं। मानक मान
`VideoGenerationAssetRole` यूनियन से आते हैं, लेकिन प्रदाता अतिरिक्त भूमिका
स्ट्रिंग स्वीकार कर सकते हैं। `*Roles` सरणियों में संबंधित
संदर्भ सूची से अधिक प्रविष्टियाँ नहीं होनी चाहिए; एक स्थान की चूक पर स्पष्ट त्रुटि मिलती है।
किसी स्थान को सेट न करने के लिए रिक्त स्ट्रिंग का उपयोग करें। xAI में उसके
`reference_images` जनरेशन मोड का उपयोग करने के लिए प्रत्येक छवि भूमिका को
`reference_image` पर सेट करें; एकल-छवि से वीडियो के लिए भूमिका को छोड़ दें
या `first_frame` का उपयोग करें।
</Note>

### शैली नियंत्रण

<ParamField path="aspectRatio" type="string">
  पक्षानुपात संकेत, जैसे `1:1`, `16:9`, `9:16`, `adaptive`, या प्रदाता-विशिष्ट मान। OpenClaw प्रत्येक प्रदाता के अनुसार असमर्थित मानों को सामान्यीकृत करता है या अनदेखा करता है।
</ParamField>
<ParamField path="resolution" type="string">रिज़ॉल्यूशन संकेत, जैसे `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K`, या प्रदाता-विशिष्ट मान। OpenClaw प्रत्येक प्रदाता के अनुसार असमर्थित मानों को सामान्यीकृत करता है या अनदेखा करता है।</ParamField>
<ParamField path="durationSeconds" type="number">
  सेकंड में लक्षित अवधि (प्रदाता द्वारा समर्थित निकटतम मान तक पूर्णांकित)।
</ParamField>
<ParamField path="size" type="string">प्रदाता द्वारा समर्थित होने पर आकार संकेत।</ParamField>
<ParamField path="audio" type="boolean">
  समर्थित होने पर आउटपुट में जनरेट किया गया ऑडियो सक्षम करें। `audioRef*` (इनपुट) से भिन्न।
</ParamField>
<ParamField path="watermark" type="boolean">समर्थित होने पर प्रदाता के वॉटरमार्क को टॉगल करें।</ParamField>

`adaptive` एक प्रदाता-विशिष्ट सेंटिनल है: इसे उन प्रदाताओं को
ज्यों का त्यों अग्रेषित किया जाता है जो अपनी क्षमताओं में `adaptive`
घोषित करते हैं (उदाहरण के लिए, BytePlus Seedance इनपुट छवि के आयामों से
अनुपात का स्वतः पता लगाने के लिए इसका उपयोग करता है)। जो प्रदाता इसे घोषित
नहीं करते, वे टूल परिणाम में `details.ignoredOverrides` के माध्यम से यह मान दिखाते
हैं, ताकि हटाया जाना दिखाई दे।

### उन्नत

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` वर्तमान सत्र का कार्य लौटाता है; `"list"` प्रदाताओं का निरीक्षण करता है।
</ParamField>
<ParamField path="model" type="string">प्रदाता/मॉडल ओवरराइड (उदाहरण के लिए `runway/gen4.5`)।</ParamField>
<ParamField path="filename" type="string">आउटपुट फ़ाइलनाम संकेत।</ParamField>
<ParamField path="timeoutMs" type="number">मिलीसेकंड में वैकल्पिक प्रदाता संचालन टाइमआउट। इसे छोड़ने पर, यदि `agents.defaults.videoGenerationModel.timeoutMs` कॉन्फ़िगर किया गया है तो OpenClaw उसका उपयोग करता है, अन्यथा उपलब्ध होने पर Plugin द्वारा निर्धारित प्रदाता डिफ़ॉल्ट का उपयोग करता है।</ParamField>
<ParamField path="providerOptions" type="object">
  JSON ऑब्जेक्ट के रूप में प्रदाता-विशिष्ट विकल्प (उदाहरण के लिए `{"seed": 42, "draft": true}`)।
  टाइप किया गया स्कीमा घोषित करने वाले प्रदाता कुंजियों और प्रकारों को सत्यापित करते हैं;
  अज्ञात कुंजियों या असंगतियों के कारण फ़ॉलबैक के दौरान उम्मीदवार को छोड़ दिया जाता है।
  घोषित स्कीमा के बिना प्रदाताओं को विकल्प ज्यों के त्यों प्राप्त होते हैं। प्रत्येक प्रदाता
  क्या स्वीकार करता है, यह देखने के लिए `video_generate action=list` चलाएँ।
</ParamField>

<Note>
सभी प्रदाता सभी पैरामीटर का समर्थन नहीं करते। OpenClaw अवधि को प्रदाता द्वारा
समर्थित निकटतम मान पर सामान्यीकृत करता है और जब कोई फ़ॉलबैक प्रदाता अलग
नियंत्रण सतह प्रस्तुत करता है, तब अनुवादित ज्यामिति संकेतों, जैसे आकार से
पक्षानुपात, का पुनः मानचित्रण करता है। वास्तव में असमर्थित ओवरराइड को सर्वोत्तम
प्रयास के आधार पर अनदेखा किया जाता है और टूल परिणाम में चेतावनियों के रूप में
सूचित किया जाता है। कठोर क्षमता सीमाएँ (जैसे बहुत अधिक संदर्भ इनपुट) सबमिशन
से पहले विफल हो जाती हैं। टूल परिणाम लागू की गई सेटिंग की सूचना देते हैं;
`details.normalization` अनुरोधित से लागू किए गए किसी भी रूपांतरण को दर्ज करता है।
</Note>

संदर्भ इनपुट रनटाइम मोड चुनते हैं:

- कोई संदर्भ मीडिया नहीं -> `generate`
- कोई भी छवि संदर्भ -> `imageToVideo`
- कोई भी वीडियो संदर्भ -> `videoToVideo`
- संदर्भ ऑडियो इनपुट समाधान किए गए मोड को **नहीं** बदलते; वे छवि/वीडियो
  संदर्भों द्वारा चुने गए किसी भी मोड के अतिरिक्त लागू होते हैं और केवल उन
  प्रदाताओं के साथ कार्य करते हैं जो `maxInputAudios` घोषित करते हैं।

मिश्रित छवि और वीडियो संदर्भ एक स्थिर साझा क्षमता सतह नहीं हैं।
प्रत्येक अनुरोध में एक संदर्भ प्रकार को प्राथमिकता दें।

#### फ़ॉलबैक और टाइप किए गए विकल्प

कुछ क्षमता जाँच टूल सीमा के बजाय फ़ॉलबैक परत पर लागू होती हैं, इसलिए
प्राथमिक प्रदाता की सीमा पार करने वाला अनुरोध भी किसी सक्षम फ़ॉलबैक पर
चल सकता है:

- यदि अनुरोध में ऑडियो संदर्भ हैं, तो कोई `maxInputAudios` (या `0`)
  घोषित न करने वाले सक्रिय उम्मीदवार को छोड़कर अगला उम्मीदवार आज़माया जाता है।
  यही सुरक्षा `maxInputImages`/`maxInputVideos` के विरुद्ध छवि और वीडियो
  संदर्भ संख्या पर लागू होती है।
- अनुरोधित `durationSeconds` से कम सक्रिय उम्मीदवार का `maxDurationSeconds`,
  और कोई घोषित `supportedDurationSeconds` सूची नहीं -> छोड़ दिया जाता है।
- अनुरोध में `providerOptions` है और सक्रिय उम्मीदवार स्पष्ट रूप से
  टाइप किया गया `providerOptions` स्कीमा घोषित करता है -> यदि दी गई कुंजियाँ
  स्कीमा में नहीं हैं या मान प्रकार मेल नहीं खाते, तो छोड़ दिया जाता है। घोषित
  स्कीमा के बिना प्रदाताओं को विकल्प ज्यों के त्यों प्राप्त होते हैं (पश्चगामी-संगत
  पास-थ्रू)। कोई प्रदाता रिक्त स्कीमा (`capabilities.providerOptions: {}`) घोषित करके सभी
  प्रदाता विकल्पों से बाहर रह सकता है, जिससे प्रकार असंगति की तरह ही उसे
  छोड़ दिया जाता है।

अनुरोध में छोड़ने का पहला कारण `warn` पर लॉग होता है, ताकि ऑपरेटरों को पता
चले कि उनके प्राथमिक प्रदाता को कब छोड़ दिया गया; लंबे फ़ॉलबैक क्रमों को शांत रखने के लिए
बाद के कारण `debug` पर लॉग होते हैं। यदि प्रत्येक उम्मीदवार को छोड़ दिया जाता
है, तो समेकित त्रुटि में प्रत्येक का कारण शामिल होता है।

## कार्रवाइयाँ

| कार्रवाई     | यह क्या करती है                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | डिफ़ॉल्ट। दिए गए प्रॉम्प्ट और वैकल्पिक संदर्भ इनपुट से वीडियो बनाएँ।                             |
| `status`   | दूसरी जनरेशन शुरू किए बिना वर्तमान सत्र के प्रगतिरत वीडियो कार्य की स्थिति जाँचें। |
| `list`     | उपलब्ध प्रदाता, मॉडल और उनकी क्षमताएँ दिखाएँ।                                                |

## मॉडल चयन

OpenClaw इस क्रम में मॉडल निर्धारित करता है:

1. **`model` टूल पैरामीटर** - यदि एजेंट कॉल में कोई मान निर्दिष्ट करता है।
2. कॉन्फ़िग से **`videoGenerationModel.primary`**।
3. क्रम से **`videoGenerationModel.fallbacks`**।
4. **स्वतः पहचान** - वैध प्रमाणीकरण वाले प्रदाता, वर्तमान डिफ़ॉल्ट
   प्रदाता से शुरू करके, फिर शेष प्रदाता वर्णानुक्रम में।

यदि कोई प्रदाता विफल होता है, तो अगला उम्मीदवार स्वतः आज़माया जाता है। यदि सभी
उम्मीदवार विफल होते हैं, तो त्रुटि में प्रत्येक प्रयास का विवरण शामिल होता है।

केवल स्पष्ट `model`, `primary`, और `fallbacks`
प्रविष्टियों का उपयोग करने के लिए `agents.defaults.mediaGenerationAutoProviderFallback: false` सेट करें।

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // वैकल्पिक प्रति-टूल प्रदाता अनुरोध टाइमआउट ओवरराइड
      },
    },
  },
}
```

## प्रदाता संबंधी टिप्पणियाँ

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio के एसिंक्रोनस एंडपॉइंट का उपयोग करता है। संदर्भ छवियाँ और
    वीडियो दूरस्थ `http(s)` URL होने चाहिए।
  </Accordion>
  <Accordion title="BytePlus (बंडल किया गया)">
    प्रदाता आईडी: `byteplus`।

    मॉडल: `seedance-1-0-pro-250528` (डिफ़ॉल्ट),
    `seedance-1-5-pro-251215`।

    एकीकृत `content[]` API का उपयोग करता है। अधिकतम 2 इनपुट छवियों
    (`first_frame` + `last_frame`) का समर्थन करता है। छवियाँ स्थानानुसार
    दें या प्रत्येक छवि का `role` स्पष्ट रूप से सेट करें।

    समर्थित `providerOptions` कुंजियाँ: `seed` (संख्या), `draft` (बूलियन -
    480p को बाध्य करता है), `camera_fixed` (बूलियन)।

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5 Plugin">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin आवश्यक है (बाहरी, बंडल नहीं किया गया)। प्रदाता आईडी: `byteplus-seedance15`। मॉडल:
    `seedance-1-5-pro-251215`।

    एकीकृत `content[]` API का उपयोग करता है। अधिकतम 2 इनपुट छवियों
    (`first_frame` + `last_frame`) का समर्थन करता है। सभी इनपुट दूरस्थ
    `https://` URL होने चाहिए। प्रत्येक छवि पर `role: "first_frame"` /
    `"last_frame"` सेट करें, या छवियाँ स्थानानुसार दें।

    `aspectRatio: "adaptive"` इनपुट छवि से अनुपात का स्वतः पता लगाता है।
    `audio: true` को `generate_audio` में मैप किया जाता है। `providerOptions.seed`
    (संख्या) अग्रेषित किया जाता है।

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin आवश्यक है (बाहरी, बंडल नहीं किया गया)। प्रदाता आईडी: `byteplus-seedance2`। मॉडल:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`।

    एकीकृत `content[]` API का उपयोग करता है। अधिकतम 9 संदर्भ छवियों,
    3 संदर्भ वीडियो और 3 संदर्भ ऑडियो का समर्थन करता है। सभी इनपुट दूरस्थ
    `https://` URL होने चाहिए। प्रत्येक एसेट पर `role` सेट करें - समर्थित मान:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`।

    `aspectRatio: "adaptive"` इनपुट छवि से अनुपात का स्वतः पता लगाता है।
    `audio: true` को `generate_audio` में मैप किया जाता है। `providerOptions.seed`
    (संख्या) अग्रेषित किया जाता है।

  </Accordion>
  <Accordion title="ComfyUI">
    वर्कफ़्लो-संचालित स्थानीय या क्लाउड निष्पादन। कॉन्फ़िगर किए गए ग्राफ़ के माध्यम से
    टेक्स्ट-से-वीडियो और इमेज-से-वीडियो का समर्थन करता है।
  </Accordion>
  <Accordion title="fal">
    लंबे समय तक चलने वाले कार्यों के लिए कतार-समर्थित प्रवाह का उपयोग करता है। OpenClaw किसी
    प्रगतिरत fal कतार कार्य को टाइम आउट मानने से पहले डिफ़ॉल्ट रूप से 20
    मिनट तक प्रतीक्षा करता है। अधिकांश fal वीडियो मॉडल
    एकल इमेज संदर्भ स्वीकार करते हैं। Seedance 2.0 संदर्भ-से-वीडियो
    मॉडल अधिकतम 9 इमेज, 3 वीडियो और 3 ऑडियो संदर्भ स्वीकार करते हैं, जिनमें
    कुल संदर्भ फ़ाइलों की अधिकतम संख्या 12 होती है।
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    एक इमेज या एक वीडियो संदर्भ का समर्थन करता है। Gemini API पथ पर जनरेटेड-ऑडियो अनुरोधों को
    चेतावनी के साथ अनदेखा किया जाता है, क्योंकि वह API वर्तमान Veo वीडियो जनरेशन के लिए
    `generateAudio` पैरामीटर को अस्वीकार करता है।
  </Accordion>
  <Accordion title="MiniMax">
    केवल एकल इमेज संदर्भ। MiniMax `768P` और `1080P`
    रिज़ॉल्यूशन स्वीकार करता है; `720P` जैसे अनुरोध सबमिशन से पहले निकटतम
    समर्थित मान में सामान्यीकृत किए जाते हैं।
  </Accordion>
  <Accordion title="OpenAI">
    केवल `size` ओवरराइड अग्रेषित किया जाता है। अन्य शैली ओवरराइड
    (`aspectRatio`, `resolution`, `audio`, `watermark`) को
    चेतावनी के साथ अनदेखा किया जाता है।
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter के एसिंक्रोनस `/videos` API का उपयोग करता है। OpenClaw
    कार्य सबमिट करता है, `polling_url` को पोल करता है और या तो `unsigned_urls` या
    प्रलेखित कार्य सामग्री एंडपॉइंट डाउनलोड करता है। बंडल किया गया `google/veo-3.1-fast` डिफ़ॉल्ट
    4/6/8 सेकंड की अवधियाँ, `720P`/`1080P` रिज़ॉल्यूशन और
    `16:9`/`9:16` आस्पेक्ट रेशियो घोषित करता है।
  </Accordion>
  <Accordion title="Qwen">
    Alibaba के समान DashScope बैकएंड। संदर्भ इनपुट दूरस्थ
    `http(s)` URL होने चाहिए; स्थानीय फ़ाइलें पहले ही अस्वीकार कर दी जाती हैं।
  </Accordion>
  <Accordion title="Runway">
    डेटा URI के माध्यम से स्थानीय फ़ाइलों का समर्थन करता है। वीडियो-से-वीडियो के लिए
    `runway/gen4_aleph` आवश्यक है। केवल-टेक्स्ट रन `16:9` और `9:16` आस्पेक्ट
    रेशियो उपलब्ध कराते हैं।
  </Accordion>
  <Accordion title="Together">
    केवल एकल इमेज संदर्भ।
  </Accordion>
  <Accordion title="Vydra">
    प्रमाणीकरण हटाने वाले रीडायरेक्ट से बचने के लिए सीधे `https://www.vydra.ai/api/v1` का उपयोग करता है।
    `veo3` केवल टेक्स्ट-से-वीडियो के रूप में बंडल किया गया है; `kling` के लिए
    दूरस्थ इमेज URL आवश्यक है।
  </Accordion>
  <Accordion title="xAI">
    डिफ़ॉल्ट `grok-imagine-video` मॉडल टेक्स्ट-से-वीडियो, एकल
    प्रथम-फ़्रेम इमेज-से-वीडियो, xAI `reference_images` के माध्यम से अधिकतम 7
    `reference_image` इनपुट और दूरस्थ वीडियो संपादन/विस्तार प्रवाह का समर्थन करता है। जनरेशन
    डिफ़ॉल्ट रूप से `480P` होता है; `aspectRatio` न दिए जाने पर एकल-इमेज
    इमेज-से-वीडियो स्रोत अनुपात ग्रहण करता है। वीडियो संपादन/विस्तार इनपुट ज्यामिति ग्रहण करते हैं और
    आस्पेक्ट-रेशियो या रिज़ॉल्यूशन ओवरराइड स्वीकार नहीं करते। विस्तार 2-10
    सेकंड स्वीकार करता है।

    `grok-imagine-video-1.5` केवल इमेज-से-वीडियो है: ठीक एक इमेज प्रदान करें।
    यह 1-15 सेकंड और `480P`, `720P` या `1080P` का समर्थन करता है, जिसका डिफ़ॉल्ट
    `480P` है; स्रोत इमेज अनुपात ग्रहण करने के लिए `aspectRatio` को छोड़ दें। प्रीव्यू
    और दिनांकित 1.5 पहचानकर्ताओं पर समान सत्यापन लागू होता है और उन्हें
    अपरिवर्तित अग्रेषित किया जाता है।

  </Accordion>
</AccordionGroup>

## प्रदाता क्षमता मोड

साझा वीडियो-जनरेशन अनुबंध केवल समतल समग्र सीमाओं के बजाय
मोड-विशिष्ट क्षमताओं का समर्थन करता है। नए प्रदाता कार्यान्वयनों को
स्पष्ट मोड ब्लॉक को प्राथमिकता देनी चाहिए:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages` और `maxInputVideos` जैसे समतल समग्र फ़ील्ड
रूपांतरण-मोड समर्थन घोषित करने के लिए पर्याप्त **नहीं** हैं। प्रदाताओं को
`generate`, `imageToVideo` और `videoToVideo` स्पष्ट रूप से घोषित करने चाहिए, ताकि लाइव
टेस्ट, अनुबंध टेस्ट और साझा `video_generate` टूल मोड समर्थन को
नियतात्मक रूप से सत्यापित कर सकें।

जब किसी प्रदाता का एक मॉडल अन्य मॉडलों की तुलना में अधिक व्यापक संदर्भ-इनपुट समर्थन देता हो,
तो पूरे मोड की सीमा बढ़ाने के बजाय `maxInputImagesByModel`, `maxInputVideosByModel` या
`maxInputAudiosByModel` का उपयोग करें।

## लाइव टेस्ट

साझा बंडल किए गए प्रदाताओं के लिए वैकल्पिक लाइव कवरेज:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

रेपो रैपर:

```bash
pnpm test:live:media video
```

यह लाइव फ़ाइल डिफ़ॉल्ट रूप से संग्रहीत प्रमाणीकरण प्रोफ़ाइल से पहले पहले से निर्यात किए गए प्रदाता एनवायरनमेंट वेरिएबल का उपयोग करती है,
और डिफ़ॉल्ट रूप से रिलीज़-सुरक्षित स्मोक चलाती है:

- `generate` स्वीप में प्रत्येक गैर-FAL प्रदाता के लिए।
- एक-सेकंड का लॉब्स्टर प्रॉम्प्ट।
- प्रति-प्रदाता ऑपरेशन सीमा
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` से (डिफ़ॉल्ट रूप से `180000`)।

FAL वैकल्पिक है, क्योंकि प्रदाता-पक्ष की कतार विलंबता रिलीज़
समय पर हावी हो सकती है:

```bash
pnpm test:live:media video --video-providers fal
```

उन घोषित रूपांतरण मोड को भी चलाने के लिए `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` सेट करें,
जिन्हें साझा स्वीप स्थानीय मीडिया के साथ सुरक्षित रूप से चला सकता है:

- `imageToVideo`, जब `capabilities.imageToVideo.enabled`।
- `videoToVideo`, जब `capabilities.videoToVideo.enabled` और
  प्रदाता/मॉडल साझा स्वीप में बफ़र-समर्थित स्थानीय वीडियो इनपुट स्वीकार करता हो।

वर्तमान में साझा `videoToVideo` लाइव लेन केवल तभी `runway` को कवर करती है, जब आप
`runway/gen4_aleph` चुनते हैं।

## कॉन्फ़िगरेशन

अपने OpenClaw कॉन्फ़िगरेशन में डिफ़ॉल्ट वीडियो-जनरेशन मॉडल सेट करें:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

या CLI के माध्यम से:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## संबंधित

- [Alibaba Model Studio](/hi/providers/alibaba)
- [पृष्ठभूमि कार्य](/hi/automation/tasks) - एसिंक्रोनस वीडियो जनरेशन के लिए कार्य ट्रैकिंग
- [BytePlus](/hi/concepts/model-providers#byteplus-international)
- [ComfyUI](/hi/providers/comfy)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agent-defaults)
- [fal](/hi/providers/fal)
- [Google (Gemini)](/hi/providers/google)
- [MiniMax](/hi/providers/minimax)
- [मॉडल](/hi/concepts/models)
- [OpenAI](/hi/providers/openai)
- [Qwen](/hi/providers/qwen)
- [Runway](/hi/providers/runway)
- [Together AI](/hi/providers/together)
- [टूल का अवलोकन](/hi/tools)
- [Vydra](/hi/providers/vydra)
- [xAI](/hi/providers/xai)
