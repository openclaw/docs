---
read_when:
    - एजेंट के माध्यम से इमेज बनाना या संपादित करना
    - इमेज जनरेशन प्रदाताओं और मॉडलों को कॉन्फ़िगर करना
    - image_generate टूल के पैरामीटर को समझना
sidebarTitle: Image generation
summary: OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra पर image_generate के माध्यम से इमेज जनरेट और संपादित करें
title: छवि निर्माण
x-i18n:
    generated_at: "2026-07-19T09:53:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: add6114760bef9e137b2888b7610c8866253bb6638f6957f7a09a33cdf4d0d22
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` टूल आपके कॉन्फ़िगर किए गए प्रदाताओं के माध्यम से चित्र बनाता और संपादित करता है।
चैट सत्रों में यह एसिंक्रोनस रूप से चलता है: OpenClaw एक
बैकग्राउंड कार्य दर्ज करता है, तुरंत कार्य आईडी लौटाता है और
प्रदाता के पूरा होने पर एजेंट को सक्रिय करता है। पूर्णता एजेंट सत्र के सामान्य
दृश्यमान-उत्तर मोड का पालन करता है: कॉन्फ़िगर होने पर अंतिम उत्तर की स्वचालित डिलीवरी, या
जब सत्र को संदेश टूल की आवश्यकता हो तब `message(action="send")`। यदि
अनुरोधकर्ता सत्र निष्क्रिय है या उसका सक्रिय वेक विफल हो जाता है, तो OpenClaw जनरेट किए गए
चित्रों के साथ एक आइडेम्पोटेंट प्रत्यक्ष फ़ॉलबैक भेजता है, ताकि परिणाम
खो न जाए।

<Note>
यह टूल केवल तभी दिखाई देता है, जब कम-से-कम एक चित्र-जनरेशन प्रदाता
उपलब्ध हो। यदि आपके एजेंट के टूल में `image_generate` दिखाई नहीं देता,
तो `agents.defaults.imageGenerationModel` कॉन्फ़िगर करें, किसी प्रदाता की API कुंजी सेट अप करें,
या OpenAI ChatGPT/Codex OAuth से साइन इन करें।
</Note>

## त्वरित शुरुआत

<Steps>
  <Step title="प्रमाणीकरण कॉन्फ़िगर करें">
    कम-से-कम एक प्रदाता के लिए API कुंजी सेट करें (उदाहरण के लिए `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) या OpenAI Codex OAuth से साइन इन करें।
  </Step>
  <Step title="डिफ़ॉल्ट मॉडल चुनें (वैकल्पिक)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    ChatGPT/Codex OAuth समान `openai/gpt-image-2` मॉडल संदर्भ का उपयोग करता है। जब कोई
    `openai` OAuth प्रोफ़ाइल कॉन्फ़िगर होती है, तो OpenClaw चित्र अनुरोधों को
    पहले `OPENAI_API_KEY` आज़माने के बजाय उस OAuth प्रोफ़ाइल से रूट करता है।
    स्पष्ट `models.providers.openai` कॉन्फ़िगरेशन (API कुंजी, कस्टम/Azure बेस URL)
    पुनः प्रत्यक्ष OpenAI Images API रूट चुनता है।

  </Step>
  <Step title="एजेंट से कहें">
    _"एक मैत्रीपूर्ण रोबोट शुभंकर का चित्र बनाएँ।"_

    एजेंट स्वचालित रूप से `image_generate` को कॉल करता है। टूल की अनुमति-सूची बनाने की
    आवश्यकता नहीं है—प्रदाता उपलब्ध होने पर यह डिफ़ॉल्ट रूप से सक्षम रहता है। टूल
    बैकग्राउंड कार्य आईडी लौटाता है, फिर तैयार होने पर पूर्णता एजेंट
    जनरेट किए गए अटैचमेंट को `message` टूल के माध्यम से भेजता है।

  </Step>
</Steps>

<Warning>
LocalAI जैसे OpenAI-संगत LAN एंडपॉइंट के लिए कस्टम
`models.providers.openai.baseUrl` बनाए रखें और
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` से स्पष्ट रूप से ऑप्ट इन करें। निजी और
आंतरिक चित्र एंडपॉइंट डिफ़ॉल्ट रूप से अवरुद्ध रहते हैं।
</Warning>

## सामान्य रूट

| लक्ष्य                                                 | मॉडल संदर्भ                                          | प्रमाणीकरण                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API बिलिंग के साथ OpenAI चित्र जनरेशन             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex सदस्यता प्रमाणीकरण के साथ OpenAI चित्र जनरेशन | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| पारदर्शी-बैकग्राउंड वाला OpenAI PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` या OpenAI Codex OAuth |
| DeepInfra चित्र जनरेशन                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 अभिव्यंजक/शैली-निर्देशित जनरेशन      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter चित्र जनरेशन                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM चित्र जनरेशन                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI चित्र जनरेशन               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` या Entra ID     |
| Google Gemini चित्र जनरेशन                       | `google/gemini-3.1-flash-image`                    | `GEMINI_API_KEY` या `GOOGLE_API_KEY`   |

यही टूल टेक्स्ट-से-चित्र और संदर्भ-चित्र संपादन दोनों को संभालता है। एक संदर्भ के लिए `image`
या एकाधिक संदर्भों के लिए `images` का उपयोग करें। fal पर Krea 2 मॉडल के लिए वे
संदर्भ संपादन इनपुट के बजाय शैली संदर्भ के रूप में भेजे जाते हैं।
`quality`, `outputFormat` और
`background` जैसे प्रदाता-समर्थित आउटपुट संकेत उपलब्ध होने पर अग्रेषित किए जाते हैं और जब
कोई प्रदाता समर्थन घोषित नहीं करता, तो उन्हें अनदेखा किया गया बताया जाता है। बंडल किया गया पारदर्शी-बैकग्राउंड समर्थन
OpenAI-विशिष्ट है; यदि अन्य प्रदाताओं का
बैकएंड इसे उत्सर्जित करता है, तो वे भी PNG अल्फ़ा बनाए रख सकते हैं।

## समर्थित प्रदाता

| प्रदाता          | डिफ़ॉल्ट मॉडल                           | संपादन समर्थन                       | प्रमाणीकरण                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | हाँ (1 चित्र, वर्कफ़्लो-कॉन्फ़िगर किया गया) | क्लाउड के लिए `COMFY_API_KEY` या `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | हाँ (1 चित्र)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | हाँ (मॉडल-विशिष्ट सीमाएँ)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image`                | हाँ (अधिकतम 5 चित्र)               | `GEMINI_API_KEY` या `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | हाँ (अधिकतम 5 इनपुट चित्र)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | हाँ (केवल MAI-Image-2.5 मॉडल)    | `AZURE_OPENAI_API_KEY` या Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | हाँ (विषय संदर्भ)            | `MINIMAX_API_KEY` या MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | हाँ (अधिकतम 5 चित्र)               | `OPENAI_API_KEY` या OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | हाँ (अधिकतम 5 इनपुट चित्र)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | नहीं                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | हाँ (अधिकतम 3 चित्र)               | `XAI_API_KEY`                                         |

रनटाइम पर उपलब्ध प्रदाताओं और मॉडलों का निरीक्षण करने के लिए `action: "list"` का उपयोग करें:

```text
/tool image_generate action=list
```

वर्तमान सत्र के सक्रिय चित्र-जनरेशन कार्य का निरीक्षण करने के लिए
`action: "status"` का उपयोग करें:

```text
/tool image_generate action=status
```

## प्रदाता क्षमताएँ

| क्षमता            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| जनरेट करें (अधिकतम संख्या)  | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| संपादन / संदर्भ      | 1 चित्र (वर्कफ़्लो) | 1 चित्र   | Flux: 1; GPT: 10; Krea शैली संदर्भ: 10; NB2: 14 | अधिकतम 5 चित्र | 1 चित्र           | 1 चित्र (विषय संदर्भ) | अधिकतम 5 चित्र | -     | अधिकतम 3 चित्र |
| आकार नियंत्रण          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | अधिकतम 4K       | -     | -              |
| पक्षानुपात          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| रिज़ॉल्यूशन (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## टूल पैरामीटर

<ParamField path="prompt" type="string" required>
  चित्र जनरेशन प्रॉम्प्ट। `action: "generate"` के लिए आवश्यक।
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  सक्रिय सत्र कार्य का निरीक्षण करने के लिए `"status"` या रनटाइम पर
  उपलब्ध प्रदाताओं और मॉडलों का निरीक्षण करने के लिए `"list"` का उपयोग करें।
</ParamField>
<ParamField path="model" type="string">
  प्रदाता/मॉडल ओवरराइड (जैसे `openai/gpt-image-2`)। पारदर्शी OpenAI बैकग्राउंड के लिए
  `openai/gpt-image-1.5` का उपयोग करें।
</ParamField>
<ParamField path="image" type="string">
  संपादन मोड के लिए एकल संदर्भ चित्र पथ या URL।
</ParamField>
<ParamField path="images" type="string[]">
  संपादन मोड या शैली-संदर्भ मॉडल के लिए एकाधिक संदर्भ चित्र (साझा टूल के माध्यम से
  अधिकतम 14; प्रदाता-विशिष्ट सीमाएँ फिर भी लागू होती हैं)।
</ParamField>
<ParamField path="size" type="string">
  आकार संकेत: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`।
</ParamField>
<ParamField path="aspectRatio" type="string">
  पक्षानुपात: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`। प्रदाता अपने मॉडल-विशिष्ट उपसमुच्चय को सत्यापित करते हैं।
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>रिज़ॉल्यूशन संकेत।</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  प्रदाता द्वारा समर्थित होने पर गुणवत्ता संकेत।
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  प्रदाता द्वारा समर्थित होने पर आउटपुट प्रारूप संकेत।
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  प्रदाता द्वारा समर्थित होने पर बैकग्राउंड संकेत। पारदर्शिता-समर्थ प्रदाताओं के लिए
  `outputFormat: "png"` या `"webp"` के साथ `transparent` का उपयोग करें।
</ParamField>
<ParamField path="count" type="number">जनरेट किए जाने वाले चित्रों की संख्या (1-4)।</ParamField>
<ParamField path="timeoutMs" type="number">
  मिलीसेकंड में वैकल्पिक प्रदाता अनुरोध टाइमआउट। जब Codex डायनेमिक टूल के माध्यम से
  `image_generate` को कॉल करता है, तब भी यह प्रति-कॉल मान कॉन्फ़िगर किए गए डिफ़ॉल्ट को ओवरराइड करता है
  और इसकी अधिकतम सीमा 600000 ms होती है।
</ParamField>
<ParamField path="filename" type="string">आउटपुट फ़ाइल नाम संकेत।</ParamField>
<ParamField path="openai" type="object">
  केवल OpenAI के संकेत: `background`, `moderation`, `outputCompression` और `user`।
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 रचनात्मकता नियंत्रण। डिफ़ॉल्ट `medium` है।
</ParamField>

<Note>
सभी प्रदाता सभी पैरामीटर का समर्थन नहीं करते। जब कोई फ़ॉलबैक प्रदाता
सटीक अनुरोधित विकल्प के बजाय निकटवर्ती ज्यामिति विकल्प का समर्थन करता है, तो OpenClaw सबमिशन से पहले
सबसे निकटतम समर्थित आकार, पक्षानुपात या रिज़ॉल्यूशन पर रीमैप करता है।
समर्थन घोषित न करने वाले प्रदाताओं के लिए असमर्थित आउटपुट संकेत हटा दिए जाते हैं
और टूल परिणाम में उनकी सूचना दी जाती है। टूल परिणाम लागू की गई
सेटिंग की रिपोर्ट करते हैं; `details.normalization` अनुरोधित-से-लागू
रूपांतरण को दर्ज करता है।
</Note>

## कॉन्फ़िगरेशन

### मॉडल चयन

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### प्रदाता चयन क्रम

OpenClaw इस क्रम में प्रदाताओं को आज़माता है:

1. टूल कॉल से **`model` पैरामीटर** (यदि एजेंट कोई निर्दिष्ट करता है)।
2. कॉन्फ़िगरेशन से **`imageGenerationModel.primary`**।
3. क्रमानुसार **`imageGenerationModel.fallbacks`**।
4. **स्वतः पहचान** - केवल प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट:
   - पहले वर्तमान डिफ़ॉल्ट प्रदाता;
   - फिर शेष पंजीकृत इमेज-जनरेशन प्रदाता, प्रदाता आईडी के क्रम में।

यदि कोई प्रदाता विफल होता है (प्रमाणीकरण त्रुटि, दर सीमा आदि), तो अगले कॉन्फ़िगर किए गए
उम्मीदवार को स्वतः आज़माया जाता है। यदि सभी विफल हों, तो त्रुटि में प्रत्येक प्रयास का
विवरण शामिल होता है।

<AccordionGroup>
  <Accordion title="प्रति-कॉल मॉडल ओवरराइड सटीक होते हैं">
    प्रति-कॉल `model` ओवरराइड केवल उसी प्रदाता/मॉडल को आज़माता है और
    कॉन्फ़िगर किए गए प्राथमिक/फ़ॉलबैक या स्वतः पहचाने गए प्रदाताओं पर आगे नहीं बढ़ता।
  </Accordion>
  <Accordion title="स्वतः पहचान प्रमाणीकरण-सचेत है">
    कोई प्रदाता डिफ़ॉल्ट उम्मीदवार सूची में तभी आता है जब OpenClaw वास्तव में
    उस प्रदाता को प्रमाणित कर सकता हो। केवल स्पष्ट
    `model`, `primary`, और `fallbacks` प्रविष्टियों का उपयोग करने के लिए
    `agents.defaults.mediaGenerationAutoProviderFallback: false` सेट करें।
  </Accordion>
  <Accordion title="टाइमआउट">
    धीमे इमेज बैकएंड के लिए `agents.defaults.imageGenerationModel.timeoutMs` सेट करें।
    प्रति-कॉल `timeoutMs` टूल पैरामीटर कॉन्फ़िगर किए गए डिफ़ॉल्ट को ओवरराइड करता है,
    और कॉन्फ़िगर किए गए डिफ़ॉल्ट, Plugin द्वारा निर्धारित प्रदाता डिफ़ॉल्ट को ओवरराइड करते हैं।
    Google और OpenRouter द्वारा होस्ट किए गए इमेज प्रदाता 180 सेकंड के
    डिफ़ॉल्ट का उपयोग करते हैं; Microsoft Foundry MAI, xAI, और Azure OpenAI इमेज जनरेशन
    600 सेकंड का उपयोग करते हैं। Codex डायनेमिक-टूल कॉल 120 सेकंड के `image_generate`
    ब्रिज डिफ़ॉल्ट का उपयोग करते हैं और कॉन्फ़िगर होने पर उसी टाइमआउट सीमा का पालन करते हैं,
    जिसे OpenClaw के 600000 ms डायनेमिक-टूल ब्रिज अधिकतम द्वारा सीमित किया जाता है।
  </Accordion>
  <Accordion title="रनटाइम पर निरीक्षण करें">
    वर्तमान में पंजीकृत प्रदाताओं, उनके डिफ़ॉल्ट मॉडल और प्रमाणीकरण
    एनवायरनमेंट-वेरिएबल संकेतों का निरीक्षण करने के लिए `action: "list"` का उपयोग करें।
  </Accordion>
</AccordionGroup>

### इमेज संपादन

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI, और xAI संदर्भ इमेज के संपादन का समर्थन करते हैं। fal पर Krea 2 मॉडल,
संपादन इनपुट के बजाय शैली संदर्भों के रूप में उन्हीं `image` / `images`
फ़ील्ड का उपयोग करते हैं। संदर्भ इमेज का पथ या URL दें:

```text
"इस फ़ोटो का वॉटरकलर संस्करण बनाएँ" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, और Google `images` पैरामीटर के माध्यम से अधिकतम 5 संदर्भ इमेज
का समर्थन करते हैं; xAI अधिकतम 3 का समर्थन करता है। fal, Flux इमेज-टू-इमेज के लिए
1 संदर्भ इमेज, GPT Image 2 संपादनों के लिए अधिकतम 10, Krea 2 के लिए अधिकतम 10 शैली संदर्भ,
और Nano Banana 2 संपादनों के लिए अधिकतम 14 का समर्थन करता है। Microsoft Foundry, MiniMax,
और ComfyUI 1 का समर्थन करते हैं।

## प्रदाताओं का विस्तृत विश्लेषण

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (और gpt-image-1.5)">
    OpenAI इमेज जनरेशन का डिफ़ॉल्ट `openai/gpt-image-2` है। यदि कोई
    `openai` OAuth प्रोफ़ाइल कॉन्फ़िगर की गई है, तो OpenClaw Codex सदस्यता
    चैट मॉडल द्वारा उपयोग की जाने वाली उसी OAuth प्रोफ़ाइल का पुनः उपयोग करता है और
    इमेज अनुरोध को Codex Responses बैकएंड के माध्यम से भेजता है। `https://chatgpt.com/backend-api`
    जैसे पुराने Codex आधार URL को इमेज अनुरोधों के लिए
    `https://chatgpt.com/backend-api/codex` में कैनोनिकलाइज़ किया जाता है। OpenClaw उस अनुरोध के लिए
    चुपचाप `OPENAI_API_KEY` पर फ़ॉलबैक **नहीं** करता -
    प्रत्यक्ष OpenAI Images API रूटिंग को बाध्य करने के लिए API कुंजी, कस्टम आधार URL,
    या Azure एंडपॉइंट के साथ `models.providers.openai` को स्पष्ट रूप से कॉन्फ़िगर करें।

    `openai/gpt-image-1.5`, `openai/gpt-image-1`, और
    `openai/gpt-image-1-mini` मॉडल अब भी स्पष्ट रूप से चुने जा सकते हैं। पारदर्शी-पृष्ठभूमि
    PNG/WebP आउटपुट के लिए `gpt-image-1.5` का उपयोग करें; वर्तमान
    `gpt-image-2` API, `background: "transparent"` को अस्वीकार करता है।

    `gpt-image-2` उसी `image_generate` टूल के माध्यम से टेक्स्ट-टू-इमेज जनरेशन
    और संदर्भ-इमेज संपादन, दोनों का समर्थन करता है।
    OpenClaw `prompt`, `count`, `size`, `quality`, `outputFormat`,
    और संदर्भ इमेज को OpenAI तक अग्रेषित करता है। OpenAI को
    `aspectRatio` या `resolution` सीधे प्राप्त **नहीं** होते; जहाँ संभव हो,
    OpenClaw उन्हें समर्थित `size` में मैप करता है, अन्यथा टूल उन्हें
    अनदेखे ओवरराइड के रूप में रिपोर्ट करता है।

    OpenAI-विशिष्ट विकल्प `openai` ऑब्जेक्ट के अंतर्गत होते हैं:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background`, `transparent`, `opaque`, या `auto` स्वीकार करता है;
    पारदर्शी आउटपुट के लिए `outputFormat` `png` या `webp` और
    पारदर्शिता-सक्षम OpenAI इमेज मॉडल आवश्यक है। OpenClaw डिफ़ॉल्ट
    `gpt-image-2` पारदर्शी-पृष्ठभूमि अनुरोधों को `gpt-image-1.5` पर रूट करता है।
    `openai.outputCompression` JPEG/WebP आउटपुट पर लागू होता है और PNG आउटपुट के लिए
    अनदेखा किया जाता है।

    शीर्ष-स्तरीय `background` संकेत प्रदाता-निरपेक्ष है और OpenAI प्रदाता चुने जाने पर
    वर्तमान में उसी OpenAI `background` अनुरोध फ़ील्ड पर मैप होता है।
    जो प्रदाता पृष्ठभूमि समर्थन घोषित नहीं करते, वे असमर्थित पैरामीटर प्राप्त करने के बजाय
    इसे `ignoredOverrides` में लौटाते हैं।

    OpenAI इमेज जनरेशन को `api.openai.com` के बजाय Azure OpenAI डिप्लॉयमेंट के माध्यम से
    रूट करने के लिए [Azure OpenAI एंडपॉइंट](/hi/providers/openai#azure-openai-endpoints) देखें।

  </Accordion>
  <Accordion title="Microsoft Foundry MAI इमेज मॉडल">
    Microsoft Foundry इमेज जनरेशन, `microsoft-foundry/` प्रदाता उपसर्ग के अंतर्गत
    डिप्लॉय किए गए MAI इमेज डिप्लॉयमेंट नामों का उपयोग करता है। कोई प्रदाता-स्तरीय
    डिफ़ॉल्ट मॉडल नहीं है, क्योंकि MAI API को `model` फ़ील्ड में
    आपके डिप्लॉयमेंट नाम की अपेक्षा होती है:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    प्रदाता OpenAI Images API का नहीं, बल्कि Microsoft Foundry के MAI API का उपयोग करता है:

    - जनरेशन एंडपॉइंट: `/mai/v1/images/generations`
    - संपादन एंडपॉइंट: `/mai/v1/images/edits`
    - प्रमाणीकरण: `AZURE_OPENAI_API_KEY` / प्रदाता API कुंजी, या `az login` के माध्यम से Entra ID
    - आउटपुट: एक PNG इमेज
    - आकार: डिफ़ॉल्ट `1024x1024`; चौड़ाई और ऊँचाई प्रत्येक कम-से-कम 768 px होनी चाहिए,
      और कुल पिक्सेल अधिकतम 1,048,576 होने चाहिए
    - संपादन: एक PNG या JPEG संदर्भ इमेज, केवल
      `MAI-Image-2.5-Flash` और `MAI-Image-2.5` डिप्लॉयमेंट द्वारा समर्थित

    केवल प्रॉम्प्ट वाला जनरेशन, सिर्फ़ Foundry एंडपॉइंट कॉन्फ़िगर करके कस्टम डिप्लॉयमेंट नाम
    का उपयोग कर सकता है। कस्टम डिप्लॉयमेंट नामों वाले संपादनों को ऑनबोर्डिंग/मॉडल मेटाडेटा
    की आवश्यकता होती है, ताकि OpenClaw सत्यापित कर सके कि डिप्लॉयमेंट
    `MAI-Image-2.5-Flash` या `MAI-Image-2.5` द्वारा समर्थित है।

    वर्तमान MAI इमेज मॉडल `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e`, और `MAI-Image-2` हैं। सेटअप और चैट-मॉडल व्यवहार के लिए
    [Microsoft Foundry Plugin](/hi/plugins/reference/microsoft-foundry) देखें।

  </Accordion>
  <Accordion title="OpenRouter इमेज मॉडल">
    OpenRouter इमेज जनरेशन उसी `OPENROUTER_API_KEY` का उपयोग करता है और
    OpenRouter के चैट कम्प्लीशन इमेज API के माध्यम से रूट करता है।
    `openrouter/` उपसर्ग के साथ OpenRouter इमेज मॉडल चुनें:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw `prompt`, `count`, संदर्भ इमेज, और
    Gemini-संगत `aspectRatio` / `resolution` संकेतों को OpenRouter तक अग्रेषित करता है।
    वर्तमान अंतर्निहित OpenRouter इमेज मॉडल शॉर्टकट में
    `google/gemini-3.1-flash-image`,
    `google/gemini-3-pro-image`, और `openai/gpt-5.4-image-2` शामिल हैं। आपका कॉन्फ़िगर किया गया Plugin
    क्या उपलब्ध कराता है, यह देखने के लिए `action: "list"` का उपयोग करें।

  </Accordion>
  <Accordion title="fal Krea 2">
    fal पर Krea 2 मॉडल, Flux द्वारा उपयोग किए जाने वाले सामान्य
    `image_size` स्कीमा के बजाय fal के मूल Krea स्कीमा का उपयोग करते हैं।
    OpenClaw यह भेजता है:

    - आस्पेक्ट रेशियो संकेतों के लिए `aspect_ratio`
    - `creativity`, जिसका डिफ़ॉल्ट `medium` है
    - `image_style_references`, जब `image` या `images` दिए जाते हैं

    अधिक तेज़, अभिव्यंजक चित्रण के लिए Krea 2 Medium और अधिक धीमे, अधिक विस्तृत
    फ़ोटो-यथार्थवादी तथा टेक्सचरयुक्त रूप के लिए Krea 2 Large चुनें:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 वर्तमान में प्रति अनुरोध एक इमेज लौटाता है। Krea के लिए `aspectRatio` को
    प्राथमिकता दें; OpenClaw `size` को निकटतम समर्थित Krea आस्पेक्ट रेशियो पर मैप करता है
    और `resolution` को हटाने के बजाय Krea के लिए अस्वीकार करता है। जब आपको
    मूल Krea रचनात्मकता स्तर चाहिए, तो `fal.creativity` का उपयोग करें:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "रिसोग्राफ टेक्सचर वाला साइबर ज़ीन पोर्ट्रेट",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax दोहरा प्रमाणीकरण">
    MiniMax इमेज जनरेशन दोनों बंडल किए गए MiniMax प्रमाणीकरण पथों के माध्यम से उपलब्ध है:

    - API-कुंजी सेटअप के लिए `minimax/image-01`
    - OAuth सेटअप के लिए `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    बंडल किया गया xAI प्रदाता केवल प्रॉम्प्ट वाले अनुरोधों के लिए `/v1/images/generations`
    और `image` या `images` मौजूद होने पर `/v1/images/edits` का उपयोग करता है।

    - मॉडल: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - संख्या: अधिकतम 4
    - संदर्भ: एक `image` या अधिकतम तीन `images`
    - आस्पेक्ट रेशियो: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - रिज़ॉल्यूशन: `1K`, `2K`
    - आउटपुट: OpenClaw-प्रबंधित इमेज अटैचमेंट के रूप में लौटाए जाते हैं

    OpenClaw जानबूझकर xAI के मूल `quality`, `mask`,
    `user`, या `auto` आस्पेक्ट रेशियो को तब तक उपलब्ध नहीं कराता,
    जब तक वे नियंत्रण साझा क्रॉस-प्रदाता `image_generate` अनुबंध में मौजूद न हों।

  </Accordion>
</AccordionGroup>

## उदाहरण

<Tabs>
  <Tab title="जनरेट करें (4K लैंडस्केप)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw इमेज जनरेशन के लिए एक साफ़-सुथरा संपादकीय पोस्टर" size=3840x2160 count=1
```
  </Tab>
  <Tab title="जनरेट करें (पारदर्शी PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="पारदर्शी पृष्ठभूमि पर लाल वृत्त का एक सरल स्टिकर" outputFormat=png background=transparent
```

समतुल्य CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "पारदर्शी पृष्ठभूमि पर लाल वृत्त का एक सरल स्टिकर" \
  --json
```

  </Tab>
  <Tab title="जनरेट करें (OpenAI निम्न गुणवत्ता)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="एक शांत उत्पादकता ऐप के लिए कम लागत वाला प्रारूप पोस्टर" quality=low openai='{"moderation":"low"}'
```

समतुल्य CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "एक शांत उत्पादकता ऐप के लिए कम लागत वाला प्रारूप पोस्टर" \
  --json
```

  </Tab>
  <Tab title="जनरेट करें (दो वर्गाकार)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="एक शांत उत्पादकता ऐप आइकन के लिए दो दृश्य दिशाएँ" size=1024x1024 count=2
```
  </Tab>
  <Tab title="संपादित करें (एक संदर्भ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="विषय को बनाए रखें, पृष्ठभूमि को चमकदार स्टूडियो सेटअप से बदलें" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="संपादित करें (कई संदर्भ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="पहली छवि की पात्र पहचान को दूसरी छवि के रंग पैलेट के साथ संयोजित करें" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea शैली संदर्भ">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="इस रंग पैलेट और प्रिंट बनावट का उपयोग करते हुए एक अभिव्यंजक संपादकीय पोर्ट्रेट" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

वही `--output-format`, `--background`, `--quality`, और
`--openai-moderation` फ़्लैग `openclaw infer image edit` पर उपलब्ध हैं;
`--openai-background` OpenAI-विशिष्ट उपनाम के रूप में बना हुआ है। OpenAI के
अलावा अन्य बंडल किए गए प्रदाता वर्तमान में स्पष्ट पृष्ठभूमि नियंत्रण घोषित
नहीं करते हैं, इसलिए उनके लिए `background: "transparent"` को उपेक्षित बताया जाता है।

## संबंधित

- [टूल का अवलोकन](/hi/tools) - सभी उपलब्ध एजेंट टूल
- [ComfyUI](/hi/providers/comfy) - स्थानीय ComfyUI और Comfy Cloud वर्कफ़्लो सेटअप
- [fal](/hi/providers/fal) - fal छवि और वीडियो प्रदाता सेटअप
- [Google (Gemini)](/hi/providers/google) - Gemini छवि प्रदाता सेटअप
- [Microsoft Foundry Plugin](/hi/plugins/reference/microsoft-foundry) - Microsoft Foundry चैट और MAI छवि सेटअप
- [MiniMax](/hi/providers/minimax) - MiniMax छवि प्रदाता सेटअप
- [OpenAI](/hi/providers/openai) - OpenAI Images प्रदाता सेटअप
- [Vydra](/hi/providers/vydra) - Vydra छवि, वीडियो और वाक् सेटअप
- [xAI](/hi/providers/xai) - Grok छवि, वीडियो, खोज, कोड निष्पादन और TTS सेटअप
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agent-defaults) - `imageGenerationModel` कॉन्फ़िगरेशन
- [मॉडल](/hi/concepts/models) - मॉडल कॉन्फ़िगरेशन और फ़ेलओवर
