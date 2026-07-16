---
read_when:
    - एजेंट के माध्यम से इमेज जनरेट या संपादित करना
    - इमेज जनरेशन प्रदाताओं और मॉडल को कॉन्फ़िगर करना
    - image_generate टूल के पैरामीटर को समझना
sidebarTitle: Image generation
summary: OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra पर image_generate के माध्यम से इमेज जनरेट और संपादित करें
title: छवि निर्माण
x-i18n:
    generated_at: "2026-07-16T17:45:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` टूल आपके कॉन्फ़िगर किए गए
प्रोवाइडरों के माध्यम से इमेज बनाता और संपादित करता है। चैट सेशन में यह असिंक्रोनस रूप से चलता है: OpenClaw एक
बैकग्राउंड टास्क दर्ज करता है, तुरंत टास्क आईडी लौटाता है, और
प्रोवाइडर का काम पूरा होने पर एजेंट को सक्रिय करता है। पूर्णता एजेंट सेशन के सामान्य
दृश्य-उत्तर मोड का पालन करता है: कॉन्फ़िगर होने पर अंतिम उत्तर स्वतः डिलीवर होता है, या
सेशन को मैसेज टूल की आवश्यकता होने पर
`message(action="send")` होता है। यदि अनुरोधकर्ता सेशन निष्क्रिय है या उसका सक्रिय वेक विफल रहता है, तो OpenClaw जनरेट की गई इमेज के साथ
एक आइडेम्पोटेंट प्रत्यक्ष फ़ॉलबैक भेजता है, ताकि परिणाम
खो न जाए।

<Note>
टूल केवल तभी दिखाई देता है, जब कम-से-कम एक इमेज-जनरेशन प्रोवाइडर
उपलब्ध हो। यदि आपके एजेंट के टूल में `image_generate` दिखाई नहीं देता,
तो `agents.defaults.imageGenerationModel` कॉन्फ़िगर करें, किसी प्रोवाइडर की API कुंजी सेट अप करें,
या OpenAI ChatGPT/Codex OAuth से साइन इन करें।
</Note>

## त्वरित शुरुआत

<Steps>
  <Step title="प्रमाणीकरण कॉन्फ़िगर करें">
    कम-से-कम एक प्रोवाइडर के लिए API कुंजी सेट करें (उदाहरण के लिए `OPENAI_API_KEY`,
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

    ChatGPT/Codex OAuth उसी `openai/gpt-image-2` मॉडल संदर्भ का उपयोग करता है। जब कोई
    `openai` OAuth प्रोफ़ाइल कॉन्फ़िगर होती है, तो OpenClaw पहले `OPENAI_API_KEY` आज़माने के बजाय
    इमेज अनुरोधों को उस OAuth प्रोफ़ाइल के माध्यम से रूट करता है।
    स्पष्ट `models.providers.openai` कॉन्फ़िगरेशन (API कुंजी, कस्टम/Azure बेस URL)
    प्रत्यक्ष OpenAI Images API रूट को फिर से चुनता है।

  </Step>
  <Step title="एजेंट से कहें">
    _"एक मित्रवत रोबोट शुभंकर की इमेज बनाएँ।"_

    एजेंट स्वतः `image_generate` को कॉल करता है। टूल की अनुमति-सूची बनाने की
    आवश्यकता नहीं है—प्रोवाइडर उपलब्ध होने पर यह डिफ़ॉल्ट रूप से सक्षम होता है। टूल
    एक बैकग्राउंड टास्क आईडी लौटाता है, फिर तैयार होने पर पूर्णता एजेंट
    जनरेट किया गया अटैचमेंट `message` टूल के माध्यम से भेजता है।

  </Step>
</Steps>

<Warning>
LocalAI जैसे OpenAI-संगत LAN एंडपॉइंट के लिए, कस्टम
`models.providers.openai.baseUrl` बनाए रखें और
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` के साथ स्पष्ट रूप से विकल्प चुनें। निजी और
आंतरिक इमेज एंडपॉइंट डिफ़ॉल्ट रूप से अवरुद्ध रहते हैं।
</Warning>

## सामान्य रूट

| लक्ष्य                                                 | मॉडल संदर्भ                                          | प्रमाणीकरण                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API बिलिंग के साथ OpenAI इमेज जनरेशन             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex सदस्यता प्रमाणीकरण के साथ OpenAI इमेज जनरेशन | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI पारदर्शी-बैकग्राउंड PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` या OpenAI Codex OAuth |
| DeepInfra इमेज जनरेशन                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 अभिव्यंजक/शैली-निर्देशित जनरेशन      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter इमेज जनरेशन                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM इमेज जनरेशन                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI इमेज जनरेशन               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` या Entra ID     |
| Google Gemini इमेज जनरेशन                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` या `GOOGLE_API_KEY`   |

यही टूल टेक्स्ट-से-इमेज और संदर्भ-इमेज संपादन संभालता है। एक संदर्भ के लिए `image`
या अनेक संदर्भों के लिए `images` का उपयोग करें। fal पर Krea 2 मॉडल के लिए, वे
संदर्भ संपादन इनपुट के बजाय शैली संदर्भ के रूप में भेजे जाते हैं।
प्रोवाइडर द्वारा समर्थित आउटपुट संकेत, जैसे `quality`, `outputFormat`, और
`background`, उपलब्ध होने पर अग्रेषित किए जाते हैं और जब कोई
प्रोवाइडर समर्थन घोषित नहीं करता, तो उन्हें उपेक्षित के रूप में रिपोर्ट किया जाता है। बंडल किया गया पारदर्शी-बैकग्राउंड समर्थन
OpenAI-विशिष्ट है; अन्य प्रोवाइडर भी PNG अल्फ़ा बनाए रख सकते हैं, यदि उनका
बैकएंड इसे उत्सर्जित करता है।

## समर्थित प्रोवाइडर

| प्रोवाइडर          | डिफ़ॉल्ट मॉडल                           | संपादन समर्थन                       | प्रमाणीकरण                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | हाँ (1 इमेज, वर्कफ़्लो-कॉन्फ़िगर किया गया) | क्लाउड के लिए `COMFY_API_KEY` या `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | हाँ (1 इमेज)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | हाँ (मॉडल-विशिष्ट सीमाएँ)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | हाँ (अधिकतम 5 इमेज)               | `GEMINI_API_KEY` या `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | हाँ (अधिकतम 5 इनपुट इमेज)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | हाँ (केवल MAI-Image-2.5 मॉडल)    | `AZURE_OPENAI_API_KEY` या Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | हाँ (विषय संदर्भ)            | `MINIMAX_API_KEY` या MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | हाँ (अधिकतम 5 इमेज)               | `OPENAI_API_KEY` या OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | हाँ (अधिकतम 5 इनपुट इमेज)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | नहीं                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | हाँ (अधिकतम 3 इमेज)               | `XAI_API_KEY`                                         |

रनटाइम पर उपलब्ध प्रोवाइडरों और मॉडलों की जाँच करने के लिए `action: "list"` का उपयोग करें:

```text
/tool image_generate action=list
```

वर्तमान सेशन के सक्रिय इमेज-जनरेशन टास्क की जाँच करने के लिए
`action: "status"` का उपयोग करें:

```text
/tool image_generate action=status
```

## प्रोवाइडर क्षमताएँ

| क्षमता            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| जनरेट करें (अधिकतम संख्या)  | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| संपादन / संदर्भ      | 1 इमेज (वर्कफ़्लो) | 1 इमेज   | Flux: 1; GPT: 10; Krea शैली संदर्भ: 10; NB2: 14 | अधिकतम 5 इमेज | 1 इमेज           | 1 इमेज (विषय संदर्भ) | अधिकतम 5 इमेज | -     | अधिकतम 3 इमेज |
| आकार नियंत्रण          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | अधिकतम 4K       | -     | -              |
| अभिमुखता अनुपात          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| रिज़ॉल्यूशन (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## टूल पैरामीटर

<ParamField path="prompt" type="string" required>
  इमेज जनरेशन प्रॉम्प्ट। `action: "generate"` के लिए आवश्यक।
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  सक्रिय सेशन टास्क की जाँच के लिए `"status"` या रनटाइम पर
  उपलब्ध प्रोवाइडरों और मॉडलों की जाँच के लिए `"list"` का उपयोग करें।
</ParamField>
<ParamField path="model" type="string">
  प्रोवाइडर/मॉडल ओवरराइड (उदा. `openai/gpt-image-2`)। पारदर्शी OpenAI बैकग्राउंड के लिए
  `openai/gpt-image-1.5` का उपयोग करें।
</ParamField>
<ParamField path="image" type="string">
  संपादन मोड के लिए एकल संदर्भ इमेज पथ या URL।
</ParamField>
<ParamField path="images" type="string[]">
  संपादन मोड या शैली-संदर्भ मॉडल के लिए अनेक संदर्भ इमेज (साझा टूल के माध्यम से अधिकतम 14;
  प्रोवाइडर-विशिष्ट सीमाएँ फिर भी लागू होती हैं)।
</ParamField>
<ParamField path="size" type="string">
  आकार संकेत: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`।
</ParamField>
<ParamField path="aspectRatio" type="string">
  अभिमुखता अनुपात: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`। प्रोवाइडर अपने मॉडल-विशिष्ट उपसमुच्चय को सत्यापित करते हैं।
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>रिज़ॉल्यूशन संकेत।</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  जब प्रोवाइडर इसका समर्थन करता हो, तब गुणवत्ता संकेत।
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  जब प्रोवाइडर इसका समर्थन करता हो, तब आउटपुट प्रारूप संकेत।
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  जब प्रोवाइडर इसका समर्थन करता हो, तब बैकग्राउंड संकेत। पारदर्शिता-समर्थ प्रोवाइडरों के लिए
  `transparent` के साथ `outputFormat: "png"` या `"webp"` का उपयोग करें।
</ParamField>
<ParamField path="count" type="number">जनरेट की जाने वाली इमेज की संख्या (1-4)।</ParamField>
<ParamField path="timeoutMs" type="number">
  मिलीसेकंड में वैकल्पिक प्रोवाइडर अनुरोध टाइमआउट। जब Codex डायनेमिक टूल के माध्यम से
  `image_generate` को कॉल करता है, तब भी यह प्रति-कॉल मान
  कॉन्फ़िगर किए गए डिफ़ॉल्ट को ओवरराइड करता है और अधिकतम 600000 ms तक सीमित होता है।
</ParamField>
<ParamField path="filename" type="string">आउटपुट फ़ाइलनाम संकेत।</ParamField>
<ParamField path="openai" type="object">
  केवल OpenAI के लिए संकेत: `background`, `moderation`, `outputCompression`, और `user`।
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 रचनात्मकता नियंत्रण। डिफ़ॉल्ट `medium` है।
</ParamField>

<Note>
सभी प्रोवाइडर सभी पैरामीटर का समर्थन नहीं करते। जब कोई फ़ॉलबैक प्रोवाइडर
ठीक अनुरोधित विकल्प के बजाय निकटतम ज्यामिति विकल्प का समर्थन करता है, तो OpenClaw सबमिशन से पहले
निकटतम समर्थित आकार, अभिमुखता अनुपात या रिज़ॉल्यूशन पर रीमैप करता है।
असमर्थित आउटपुट संकेत उन प्रोवाइडरों के लिए हटा दिए जाते हैं जो
समर्थन घोषित नहीं करते, और इसकी रिपोर्ट टूल परिणाम में की जाती है। टूल परिणाम लागू की गई
सेटिंग की रिपोर्ट करते हैं; `details.normalization` अनुरोधित-से-लागू
रूपांतरण दर्ज करता है।
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
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### प्रदाता चयन क्रम

OpenClaw प्रदाताओं को इस क्रम में आज़माता है:

1. टूल कॉल से **`model` पैरामीटर** (यदि एजेंट कोई निर्दिष्ट करता है)।
2. कॉन्फ़िगरेशन से **`imageGenerationModel.primary`**।
3. क्रमानुसार **`imageGenerationModel.fallbacks`**।
4. **स्वतः पहचान** - केवल प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट:
   - पहले वर्तमान डिफ़ॉल्ट प्रदाता;
   - फिर शेष पंजीकृत छवि-निर्माण प्रदाता, प्रदाता आईडी के क्रम में।

यदि कोई प्रदाता विफल होता है (प्रमाणीकरण त्रुटि, दर सीमा आदि), तो अगला कॉन्फ़िगर किया गया
उम्मीदवार स्वतः आज़माया जाता है। यदि सभी विफल होते हैं, तो त्रुटि में
प्रत्येक प्रयास का विवरण शामिल होता है।

<AccordionGroup>
  <Accordion title="प्रति-कॉल मॉडल ओवरराइड सटीक होते हैं">
    प्रति-कॉल `model` ओवरराइड केवल उसी प्रदाता/मॉडल को आज़माता है और
    कॉन्फ़िगर किए गए प्राथमिक/फ़ॉलबैक या स्वतः पहचाने गए प्रदाताओं पर आगे नहीं बढ़ता।
  </Accordion>
  <Accordion title="स्वतः पहचान प्रमाणीकरण-सजग है">
    कोई प्रदाता डिफ़ॉल्ट उम्मीदवार सूची में तभी शामिल होता है, जब OpenClaw
    वास्तव में उस प्रदाता को प्रमाणित कर सकता हो। केवल स्पष्ट
    `model`, `primary`, और `fallbacks` प्रविष्टियों का उपयोग करने के लिए
    `agents.defaults.mediaGenerationAutoProviderFallback: false` सेट करें।
  </Accordion>
  <Accordion title="समय-सीमाएँ">
    धीमे छवि बैकएंड के लिए `agents.defaults.imageGenerationModel.timeoutMs`
    सेट करें। प्रति-कॉल `timeoutMs` टूल पैरामीटर कॉन्फ़िगर किए गए
    डिफ़ॉल्ट को ओवरराइड करता है, और कॉन्फ़िगर किए गए डिफ़ॉल्ट Plugin द्वारा बनाए गए प्रदाता
    डिफ़ॉल्ट को ओवरराइड करते हैं। Google और OpenRouter द्वारा होस्ट किए गए छवि प्रदाता 180 सेकंड के
    डिफ़ॉल्ट का उपयोग करते हैं; Microsoft Foundry MAI, xAI, और Azure OpenAI छवि निर्माण
    600 सेकंड का उपयोग करते हैं। Codex डायनेमिक-टूल कॉल 120 सेकंड के `image_generate`
    ब्रिज डिफ़ॉल्ट का उपयोग करते हैं और कॉन्फ़िगर होने पर उसी समय-सीमा बजट का पालन करते हैं, जिसकी सीमा
    OpenClaw के 600000 ms डायनेमिक-टूल ब्रिज अधिकतम द्वारा निर्धारित होती है।
  </Accordion>
  <Accordion title="रनटाइम पर निरीक्षण करें">
    वर्तमान में पंजीकृत प्रदाताओं, उनके डिफ़ॉल्ट मॉडलों और
    प्रमाणीकरण env-var संकेतों का निरीक्षण करने के लिए `action: "list"` का उपयोग करें।
  </Accordion>
</AccordionGroup>

### छवि संपादन

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI, और xAI संदर्भ छवियों के संपादन का समर्थन करते हैं। fal पर Krea 2 मॉडल
संपादन इनपुट के बजाय शैली संदर्भों के रूप में उन्हीं `image` / `images` फ़ील्ड का उपयोग
करते हैं। किसी संदर्भ छवि का पथ या URL दें:

```text
"इस फ़ोटो का जलरंग संस्करण बनाएँ" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, और Google `images` पैरामीटर के माध्यम से अधिकतम 5 संदर्भ छवियों का
समर्थन करते हैं; xAI अधिकतम 3 का समर्थन करता है। fal Flux छवि-से-छवि के लिए 1 संदर्भ छवि,
GPT Image 2 संपादनों के लिए अधिकतम 10, Krea 2 के लिए अधिकतम 10 शैली संदर्भों और
Nano Banana 2 संपादनों के लिए अधिकतम 14 का समर्थन करता है। Microsoft Foundry, MiniMax,
और ComfyUI 1 का समर्थन करते हैं।

## प्रदाताओं का विस्तृत विश्लेषण

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (और gpt-image-1.5)">
    OpenAI छवि निर्माण का डिफ़ॉल्ट `openai/gpt-image-2` है। यदि कोई
    `openai` OAuth प्रोफ़ाइल कॉन्फ़िगर की गई है, तो OpenClaw Codex सदस्यता चैट मॉडलों द्वारा
    उपयोग की जाने वाली उसी OAuth प्रोफ़ाइल का पुनः उपयोग करता है और
    छवि अनुरोध Codex Responses बैकएंड के माध्यम से भेजता है। `https://chatgpt.com/backend-api` जैसे पुराने Codex आधार
    URL को छवि अनुरोधों के लिए
    `https://chatgpt.com/backend-api/codex` में मानकीकृत किया जाता है। OpenClaw उस अनुरोध के लिए
    चुपचाप `OPENAI_API_KEY` पर फ़ॉलबैक **नहीं** करता -
    सीधे OpenAI Images API रूटिंग को बाध्य करने के लिए API कुंजी, कस्टम आधार URL
    या Azure एंडपॉइंट के साथ
    `models.providers.openai` को स्पष्ट रूप से कॉन्फ़िगर करें।

    `openai/gpt-image-1.5`, `openai/gpt-image-1`, और
    `openai/gpt-image-1-mini` मॉडल अब भी स्पष्ट रूप से चुने जा सकते हैं। पारदर्शी-पृष्ठभूमि PNG/WebP आउटपुट के लिए
    `gpt-image-1.5` का उपयोग करें; वर्तमान
    `gpt-image-2` API `background: "transparent"` को अस्वीकार करता है।

    `gpt-image-2` समान `image_generate` टूल के माध्यम से टेक्स्ट-से-छवि निर्माण और
    संदर्भ-छवि संपादन, दोनों का समर्थन करता है।
    OpenClaw `prompt`, `count`, `size`, `quality`, `outputFormat`
    और संदर्भ छवियाँ OpenAI को अग्रेषित करता है। OpenAI को
    `aspectRatio` या `resolution` सीधे **नहीं** मिलते; संभव होने पर OpenClaw
    उन्हें किसी समर्थित `size` में मैप करता है, अन्यथा टूल उन्हें
    उपेक्षित ओवरराइड के रूप में रिपोर्ट करता है।

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

    `openai.background` में `transparent`, `opaque`, या `auto` स्वीकार होते हैं;
    पारदर्शी आउटपुट के लिए `outputFormat` `png` या `webp` तथा
    पारदर्शिता-सक्षम OpenAI छवि मॉडल आवश्यक है। OpenClaw डिफ़ॉल्ट
    `gpt-image-2` पारदर्शी-पृष्ठभूमि अनुरोधों को `gpt-image-1.5` पर रूट करता है।
    `openai.outputCompression` JPEG/WebP आउटपुट पर लागू होता है और PNG आउटपुट के लिए
    उपेक्षित किया जाता है।

    शीर्ष-स्तरीय `background` संकेत प्रदाता-निरपेक्ष है और OpenAI प्रदाता
    चुने जाने पर वर्तमान में उसी OpenAI `background` अनुरोध फ़ील्ड पर मैप होता है।
    जो प्रदाता पृष्ठभूमि समर्थन घोषित नहीं करते, वे असमर्थित पैरामीटर प्राप्त करने के बजाय
    उसे `ignoredOverrides` में लौटाते हैं।

    OpenAI छवि निर्माण को `api.openai.com` के बजाय Azure OpenAI डिप्लॉयमेंट के माध्यम से
    रूट करने के लिए
    [Azure OpenAI एंडपॉइंट](/hi/providers/openai#azure-openai-endpoints) देखें।

  </Accordion>
  <Accordion title="Microsoft Foundry MAI छवि मॉडल">
    Microsoft Foundry छवि निर्माण `microsoft-foundry/` प्रदाता उपसर्ग के अंतर्गत
    डिप्लॉय किए गए MAI छवि डिप्लॉयमेंट नामों का उपयोग करता है। कोई प्रदाता-स्तरीय
    डिफ़ॉल्ट मॉडल नहीं है, क्योंकि MAI API `model` फ़ील्ड में आपके
    डिप्लॉयमेंट नाम की अपेक्षा करता है:

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

    प्रदाता OpenAI Images API नहीं, बल्कि Microsoft Foundry के MAI API का उपयोग करता है:

    - निर्माण एंडपॉइंट: `/mai/v1/images/generations`
    - संपादन एंडपॉइंट: `/mai/v1/images/edits`
    - प्रमाणीकरण: `AZURE_OPENAI_API_KEY` / प्रदाता API कुंजी, या `az login` के माध्यम से Entra ID
    - आउटपुट: एक PNG छवि
    - आकार: डिफ़ॉल्ट `1024x1024`; चौड़ाई और ऊँचाई प्रत्येक कम-से-कम 768 px होनी चाहिए,
      और कुल पिक्सेल अधिकतम 1,048,576 होने चाहिए
    - संपादन: एक PNG या JPEG संदर्भ छवि, केवल
      `MAI-Image-2.5-Flash` और `MAI-Image-2.5` डिप्लॉयमेंट द्वारा समर्थित

    केवल प्रॉम्प्ट वाला निर्माण सिर्फ़ Foundry एंडपॉइंट कॉन्फ़िगर करके किसी कस्टम
    डिप्लॉयमेंट नाम का उपयोग कर सकता है। कस्टम डिप्लॉयमेंट नामों वाले संपादनों के लिए
    ऑनबोर्डिंग/मॉडल मेटाडेटा आवश्यक है, ताकि OpenClaw सत्यापित कर सके कि डिप्लॉयमेंट
    `MAI-Image-2.5-Flash` या `MAI-Image-2.5` द्वारा समर्थित है।

    वर्तमान MAI छवि मॉडल `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e`, और `MAI-Image-2` हैं। सेटअप
    और चैट-मॉडल व्यवहार के लिए
    [Microsoft Foundry Plugin](/hi/plugins/reference/microsoft-foundry) देखें।

  </Accordion>
  <Accordion title="OpenRouter छवि मॉडल">
    OpenRouter छवि निर्माण उसी `OPENROUTER_API_KEY` का उपयोग करता है और
    OpenRouter के चैट कम्प्लीशंस छवि API के माध्यम से रूट होता है।
    `openrouter/` उपसर्ग के साथ OpenRouter छवि मॉडल चुनें:

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

    OpenClaw `prompt`, `count`, संदर्भ छवियाँ और
    Gemini-संगत `aspectRatio` / `resolution` संकेत OpenRouter को अग्रेषित करता है।
    वर्तमान अंतर्निहित OpenRouter छवि मॉडल शॉर्टकट में
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview`, और `openai/gpt-5.4-image-2` शामिल हैं। आपका कॉन्फ़िगर किया गया Plugin क्या उपलब्ध कराता है,
    यह देखने के लिए `action: "list"` का उपयोग करें।

  </Accordion>
  <Accordion title="fal Krea 2">
    fal पर Krea 2 मॉडल Flux द्वारा उपयोग किए जाने वाले सामान्य
    `image_size` स्कीमा के बजाय fal के मूल Krea स्कीमा का उपयोग करते हैं। OpenClaw भेजता है:

    - आस्पेक्ट-अनुपात संकेतों के लिए `aspect_ratio`
    - `creativity`, जिसका डिफ़ॉल्ट `medium` है
    - `image` या `images` दिए जाने पर `image_style_references`

    अधिक तेज़, अभिव्यंजक चित्रण के लिए Krea 2 Medium और
    धीमे, अधिक विस्तृत फ़ोटोरियल तथा टेक्सचरयुक्त रूपों के लिए Krea 2 Large चुनें:

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

    Krea 2 वर्तमान में प्रति अनुरोध एक छवि लौटाता है। Krea के लिए `aspectRatio` को प्राथमिकता दें;
    OpenClaw `size` को निकटतम समर्थित Krea आस्पेक्ट अनुपात पर मैप करता है और
    Krea के लिए `resolution` को हटाने के बजाय अस्वीकार करता है। जब मूल Krea रचनात्मकता स्तर चाहिए,
    तब `fal.creativity` का उपयोग करें:

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
  <Accordion title="MiniMax द्वि-प्रमाणीकरण">
    MiniMax छवि निर्माण दोनों बंडल किए गए MiniMax
    प्रमाणीकरण पथों के माध्यम से उपलब्ध है:

    - API-कुंजी सेटअप के लिए `minimax/image-01`
    - OAuth सेटअप के लिए `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    बंडल किया गया xAI प्रदाता केवल प्रॉम्प्ट वाले अनुरोधों के लिए `/v1/images/generations`
    और `image` या `images` मौजूद होने पर `/v1/images/edits` का उपयोग करता है।

    - मॉडल: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - संख्या: अधिकतम 4
    - संदर्भ: एक `image` या अधिकतम तीन `images`
    - आस्पेक्ट अनुपात: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - रिज़ॉल्यूशन: `1K`, `2K`
    - आउटपुट: OpenClaw द्वारा प्रबंधित छवि अटैचमेंट के रूप में लौटाए जाते हैं

    OpenClaw जानबूझकर xAI-मूल `quality`, `mask`,
    `user`, या `auto` आस्पेक्ट अनुपात को तब तक उपलब्ध नहीं कराता, जब तक वे नियंत्रण साझा
    क्रॉस-प्रदाता `image_generate` अनुबंध में मौजूद नहीं होते।

  </Accordion>
</AccordionGroup>

## उदाहरण

<Tabs>
  <Tab title="बनाएँ (4K लैंडस्केप)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw छवि निर्माण के लिए एक साफ़-सुथरा संपादकीय पोस्टर" size=3840x2160 count=1
```
  </Tab>
  <Tab title="बनाएँ (पारदर्शी PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="पारदर्शी पृष्ठभूमि पर एक साधारण लाल गोल स्टिकर" outputFormat=png background=transparent
```

समतुल्य CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "पारदर्शी पृष्ठभूमि पर एक साधारण लाल गोल स्टिकर" \
  --json
```

  </Tab>
  <Tab title="बनाएँ (OpenAI निम्न गुणवत्ता)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="एक शांत उत्पादकता ऐप के लिए कम लागत वाला प्रारूप पोस्टर" quality=low openai='{"moderation":"low"}'
```

समतुल्य CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "शांत उत्पादकता ऐप के लिए कम लागत वाला प्रारंभिक पोस्टर" \
  --json
```

  </Tab>
  <Tab title="जनरेट करें (दो वर्गाकार)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="शांत उत्पादकता ऐप आइकन के लिए दो दृश्य दिशाएँ" size=1024x1024 count=2
```
  </Tab>
  <Tab title="संपादित करें (एक संदर्भ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="विषय को बनाए रखें, पृष्ठभूमि को चमकदार स्टूडियो सेटअप से बदलें" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="संपादित करें (एकाधिक संदर्भ)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="पहली छवि की पात्र पहचान को दूसरी की रंग पट्टी के साथ संयोजित करें" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea शैली संदर्भ">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="इस रंग पट्टी और प्रिंट बनावट का उपयोग करते हुए एक अभिव्यंजक संपादकीय पोर्ट्रेट" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

वही `--output-format`, `--background`, `--quality`, और
`--openai-moderation` फ़्लैग `openclaw infer image edit` पर उपलब्ध हैं;
`--openai-background` OpenAI-विशिष्ट उपनाम के रूप में बना हुआ है। OpenAI के
अलावा अन्य बंडल किए गए प्रदाता वर्तमान में स्पष्ट पृष्ठभूमि नियंत्रण घोषित नहीं करते, इसलिए
उनके लिए `background: "transparent"` को अनदेखा किया गया बताया जाता है।

## संबंधित

- [टूल अवलोकन](/hi/tools) - सभी उपलब्ध एजेंट टूल
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
