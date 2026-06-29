---
read_when:
    - एजेंट के माध्यम से छवियाँ बनाना या संपादित करना
    - छवि-निर्माण प्रदाताओं और मॉडलों को कॉन्फ़िगर करना
    - image_generate टूल पैरामीटर को समझना
sidebarTitle: Image generation
summary: image_generate के ज़रिए OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra पर इमेज जेनरेट और एडिट करें
title: छवि निर्माण
x-i18n:
    generated_at: "2026-06-29T00:20:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` टूल एजेंट को आपके कॉन्फ़िगर किए गए प्रदाताओं का उपयोग करके इमेज बनाने और संपादित करने देता है। चैट सत्रों में, इमेज जनरेशन असिंक्रोनस रूप से चलता है: OpenClaw एक पृष्ठभूमि कार्य दर्ज करता है, कार्य id तुरंत लौटाता है, और प्रदाता के पूरा होने पर एजेंट को जगाता है। पूर्णता एजेंट सत्र के सामान्य दृश्यमान-उत्तर मोड का पालन करता है: कॉन्फ़िगर होने पर स्वचालित अंतिम उत्तर डिलीवरी, या जब सत्र को message टूल की आवश्यकता हो तब `message(action="send")`। यदि अनुरोधकर्ता सत्र निष्क्रिय है या उसका सक्रिय वेक विफल हो जाता है, और कुछ जेनरेट की गई इमेज अभी भी पूर्णता उत्तर से गायब हैं, तो OpenClaw केवल गायब इमेज के साथ एक idempotent प्रत्यक्ष fallback भेजता है।

<Note>
यह टूल केवल तब दिखाई देता है जब कम से कम एक इमेज-जनरेशन प्रदाता उपलब्ध हो। यदि आपको अपने एजेंट के टूल में `image_generate` नहीं दिखता, तो `agents.defaults.imageGenerationModel` कॉन्फ़िगर करें, प्रदाता API key सेट करें, या OpenAI ChatGPT/Codex OAuth से साइन इन करें।
</Note>

## त्वरित शुरुआत

<Steps>
  <Step title="Configure auth">
    कम से कम एक प्रदाता के लिए API key सेट करें (उदाहरण के लिए `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) या OpenAI Codex OAuth से साइन इन करें।
  </Step>
  <Step title="Pick a default model (optional)">
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

    ChatGPT/Codex OAuth उसी `openai/gpt-image-2` मॉडल संदर्भ का उपयोग करता है। जब कोई `openai` OAuth प्रोफ़ाइल कॉन्फ़िगर होती है, तो OpenClaw पहले `OPENAI_API_KEY` आज़माने के बजाय उस OAuth प्रोफ़ाइल के माध्यम से इमेज अनुरोध रूट करता है। स्पष्ट `models.providers.openai` कॉन्फ़िगरेशन (API key, custom/Azure base URL) प्रत्यक्ष OpenAI Images API रूट में वापस opt in करता है।

  </Step>
  <Step title="Ask the agent">
    _"एक दोस्ताना रोबोट mascot की इमेज जेनरेट करें।"_

    एजेंट स्वतः `image_generate` कॉल करता है। किसी टूल allow-listing की आवश्यकता नहीं - प्रदाता उपलब्ध होने पर यह डिफ़ॉल्ट रूप से सक्षम होता है। टूल एक पृष्ठभूमि कार्य id लौटाता है, फिर तैयार होने पर पूर्णता एजेंट `message` टूल के माध्यम से जेनरेट किया गया attachment भेजता है।

  </Step>
</Steps>

<Warning>
LocalAI जैसे OpenAI-संगत LAN endpoints के लिए, custom `models.providers.openai.baseUrl` रखें और `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` के साथ स्पष्ट रूप से opt in करें। निजी और आंतरिक इमेज endpoints डिफ़ॉल्ट रूप से अवरुद्ध रहते हैं।
</Warning>

## सामान्य रूट

| लक्ष्य                                                | मॉडल संदर्भ                                      | प्रमाणीकरण                              |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API billing के साथ OpenAI इमेज जनरेशन             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex subscription auth के साथ OpenAI इमेज जनरेशन | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI पारदर्शी-background PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` या OpenAI Codex OAuth |
| DeepInfra इमेज जनरेशन                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 अभिव्यंजक/style-directed जनरेशन      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter इमेज जनरेशन                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM इमेज जनरेशन                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI इमेज जनरेशन               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` या Entra ID     |
| Google Gemini इमेज जनरेशन                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` या `GOOGLE_API_KEY`   |

वही `image_generate` टूल text-to-image और reference-image संपादन संभालता है। एक संदर्भ के लिए `image` या कई संदर्भों के लिए `images` का उपयोग करें। fal पर Krea 2 मॉडल के लिए, वे संदर्भ edit inputs के बजाय style references के रूप में भेजे जाते हैं।
प्रदाता-समर्थित output hints जैसे `quality`, `outputFormat`, और `background` उपलब्ध होने पर आगे भेजे जाते हैं और जब कोई प्रदाता उनका समर्थन नहीं करता तो ignored के रूप में रिपोर्ट किए जाते हैं। Bundled पारदर्शी-background समर्थन OpenAI-विशिष्ट है; अन्य प्रदाता तब भी PNG alpha बनाए रख सकते हैं यदि उनका backend उसे emit करता है।

## समर्थित प्रदाता

| प्रदाता           | डिफ़ॉल्ट मॉडल                         | संपादन समर्थन                    | प्रमाणीकरण                                            |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | हाँ (1 इमेज, workflow-configured) | cloud के लिए `COMFY_API_KEY` या `COMFY_CLOUD_API_KEY` |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | हाँ (1 इमेज)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | हाँ (model-specific सीमाएँ)       | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | हाँ                                | `GEMINI_API_KEY` या `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | हाँ (अधिकतम 5 input images)       | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | हाँ (केवल MAI-Image-2.5 मॉडल)     | `AZURE_OPENAI_API_KEY` या Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | हाँ (subject reference)            | `MINIMAX_API_KEY` या MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | हाँ (अधिकतम 4 इमेज)               | `OPENAI_API_KEY` या OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | हाँ (अधिकतम 5 input images)       | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | नहीं                               | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | हाँ (अधिकतम 5 इमेज)               | `XAI_API_KEY`                                         |

runtime पर उपलब्ध प्रदाताओं और मॉडलों को देखने के लिए `action: "list"` का उपयोग करें:

```text
/tool image_generate action=list
```

वर्तमान सत्र के लिए सक्रिय इमेज-जनरेशन कार्य देखने के लिए `action: "status"` का उपयोग करें:

```text
/tool image_generate action=status
```

## प्रदाता क्षमताएँ

| क्षमता                | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| जेनरेट करें (अधिकतम संख्या) | Workflow-defined   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| संपादन / संदर्भ      | 1 इमेज (workflow) | 1 इमेज   | Flux: 1; GPT: 10; Krea style refs: 10; NB2: 14 | अधिकतम 5 इमेज | 1 इमेज           | 1 इमेज (subject ref) | अधिकतम 5 इमेज | -     | अधिकतम 5 इमेज |
| आकार नियंत्रण        | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | अधिकतम 4K      | -     | -              |
| Aspect ratio          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Resolution (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## टूल पैरामीटर

<ParamField path="prompt" type="string" required>
  इमेज जनरेशन prompt। `action: "generate"` के लिए आवश्यक।
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  सक्रिय सत्र कार्य देखने के लिए `"status"` या runtime पर उपलब्ध प्रदाताओं और मॉडलों को देखने के लिए `"list"` का उपयोग करें।
</ParamField>
<ParamField path="model" type="string">
  प्रदाता/मॉडल override (जैसे `openai/gpt-image-2`)। पारदर्शी OpenAI backgrounds के लिए `openai/gpt-image-1.5` का उपयोग करें।
</ParamField>
<ParamField path="image" type="string">
  edit mode के लिए एकल reference image path या URL।
</ParamField>
<ParamField path="images" type="string[]">
  edit mode या style-reference मॉडल के लिए कई reference images (shared tool के माध्यम से अधिकतम 10; प्रदाता-विशिष्ट सीमाएँ फिर भी लागू होती हैं)।
</ParamField>
<ParamField path="size" type="string">
  Size hint: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`।
</ParamField>
<ParamField path="aspectRatio" type="string">
  Aspect ratio: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`। प्रदाता अपने model-specific subset को validate करते हैं।
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Resolution hint।</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  जब प्रदाता इसका समर्थन करता है तब quality hint।
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  जब प्रदाता इसका समर्थन करता है तब output format hint।
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  जब प्रदाता इसका समर्थन करता है तब background hint। transparency-capable प्रदाताओं के लिए `outputFormat: "png"` या `"webp"` के साथ `transparent` का उपयोग करें।
</ParamField>
<ParamField path="count" type="number">जेनरेट की जाने वाली इमेज की संख्या (1-4)।</ParamField>
<ParamField path="timeoutMs" type="number">
  मिलीसेकंड में वैकल्पिक प्रदाता अनुरोध timeout। जब Codex dynamic tools के माध्यम से `image_generate` कॉल करता है, तब भी यह per-call value कॉन्फ़िगर किए गए डिफ़ॉल्ट को override करती है और 600000 ms पर capped होती है।
</ParamField>
<ParamField path="filename" type="string">Output filename hint।</ParamField>
<ParamField path="openai" type="object">
  केवल-OpenAI hints: `background`, `moderation`, `outputCompression`, और `user`।
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 creativity control। डिफ़ॉल्ट `medium` है।
</ParamField>

<Note>
सभी प्रदाता सभी पैरामीटर का समर्थन नहीं करते। जब fallback प्रदाता सटीक अनुरोधित विकल्प के बजाय निकटतम geometry option का समर्थन करता है, तो OpenClaw submission से पहले सबसे निकट समर्थित size, aspect ratio, या resolution पर remap करता है। Unsupported output hints उन प्रदाताओं के लिए dropped किए जाते हैं जो समर्थन घोषित नहीं करते और tool result में रिपोर्ट किए जाते हैं। Tool results लागू settings रिपोर्ट करते हैं; `details.normalization` requested-to-applied translation को capture करता है।
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
2. कॉन्फिग से **`imageGenerationModel.primary`**।
3. क्रम में **`imageGenerationModel.fallbacks`**।
4. **स्वतः-पहचान** - केवल प्रमाणीकरण-समर्थित प्रदाता डिफॉल्ट:
   - पहले वर्तमान डिफॉल्ट प्रदाता;
   - बाकी पंजीकृत इमेज-जनरेशन प्रदाता, प्रदाता-id क्रम में।

यदि कोई प्रदाता विफल होता है (प्रमाणीकरण त्रुटि, दर सीमा, आदि), तो अगला कॉन्फिगर किया गया
उम्मीदवार अपने आप आजमाया जाता है। यदि सभी विफल होते हैं, तो त्रुटि में प्रत्येक प्रयास के
विवरण शामिल होते हैं।

<AccordionGroup>
  <Accordion title="प्रति-कॉल मॉडल ओवरराइड सटीक होते हैं">
    प्रति-कॉल `model` ओवरराइड केवल उसी प्रदाता/मॉडल को आजमाता है और
    कॉन्फिगर किए गए primary/fallback या स्वतः-पहचाने गए प्रदाताओं पर आगे नहीं बढ़ता।
  </Accordion>
  <Accordion title="स्वतः-पहचान प्रमाणीकरण-सचेत है">
    कोई प्रदाता डिफॉल्ट उम्मीदवार सूची में केवल तब आता है जब OpenClaw उस प्रदाता को
    वास्तव में प्रमाणित कर सकता है। केवल स्पष्ट `model`, `primary`, और `fallbacks`
    प्रविष्टियों का उपयोग करने के लिए
    `agents.defaults.mediaGenerationAutoProviderFallback: false` सेट करें।
  </Accordion>
  <Accordion title="टाइमआउट">
    धीमे इमेज बैकएंड के लिए `agents.defaults.imageGenerationModel.timeoutMs` सेट करें।
    प्रति-कॉल `timeoutMs` टूल पैरामीटर कॉन्फिगर किए गए डिफॉल्ट को ओवरराइड करता है,
    और कॉन्फिगर किए गए डिफॉल्ट plugin-लेखित प्रदाता डिफॉल्ट को ओवरराइड करते हैं।
    Google और OpenRouter होस्टेड इमेज प्रदाता 180 सेकंड के डिफॉल्ट का उपयोग करते हैं;
    Microsoft Foundry MAI, xAI, और Azure OpenAI इमेज जनरेशन 600 सेकंड का उपयोग करते हैं।
    Codex डायनेमिक-टूल कॉल 120 सेकंड के `image_generate` ब्रिज डिफॉल्ट का उपयोग करते हैं
    और कॉन्फिगर होने पर वही टाइमआउट बजट मानते हैं, जो OpenClaw के 600000 ms
    डायनेमिक-टूल ब्रिज अधिकतम से सीमित होता है।
  </Accordion>
  <Accordion title="रनटाइम पर निरीक्षण करें">
    वर्तमान में पंजीकृत प्रदाताओं, उनके डिफॉल्ट मॉडलों, और प्रमाणीकरण env-var संकेतों का
    निरीक्षण करने के लिए `action: "list"` का उपयोग करें।
  </Accordion>
</AccordionGroup>

### इमेज संपादन

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI, और xAI संदर्भ इमेज संपादित करने का समर्थन करते हैं। fal पर Krea 2 मॉडल संपादन इनपुट के बजाय
स्टाइल संदर्भों के रूप में वही `image` / `images` फील्ड उपयोग करते हैं। एक संदर्भ इमेज पथ या URL दें:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google, और xAI `images` पैरामीटर के जरिए 5 तक संदर्भ इमेज का समर्थन करते हैं।
fal Flux image-to-image के लिए 1 संदर्भ इमेज, GPT Image 2 संपादनों के लिए 10 तक,
Krea 2 के लिए 10 तक स्टाइल संदर्भ, और Nano Banana 2 संपादनों के लिए 14 तक समर्थन करता है।
Microsoft Foundry, MiniMax, और ComfyUI 1 का समर्थन करते हैं।

## प्रदाता की गहन जानकारी

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (और gpt-image-1.5)">
    OpenAI इमेज जनरेशन का डिफॉल्ट `openai/gpt-image-2` है। यदि कोई
    `openai` OAuth प्रोफाइल कॉन्फिगर है, तो OpenClaw वही OAuth प्रोफाइल फिर से उपयोग करता है
    जो Codex सब्सक्रिप्शन चैट मॉडलों द्वारा उपयोग किया जाता है और इमेज अनुरोध को
    Codex Responses बैकएंड के जरिए भेजता है। पुराने Codex बेस URL जैसे
    `https://chatgpt.com/backend-api` को इमेज अनुरोधों के लिए
    `https://chatgpt.com/backend-api/codex` में canonicalize किया जाता है। OpenClaw
    उस अनुरोध के लिए चुपचाप `OPENAI_API_KEY` पर fallback **नहीं** करता -
    सीधे OpenAI Images API रूटिंग को बाध्य करने के लिए,
    `models.providers.openai` को API key, कस्टम बेस URL,
    या Azure endpoint के साथ स्पष्ट रूप से कॉन्फिगर करें।

    `openai/gpt-image-1.5`, `openai/gpt-image-1`, और
    `openai/gpt-image-1-mini` मॉडल अब भी स्पष्ट रूप से चुने जा सकते हैं। पारदर्शी-background
    PNG/WebP आउटपुट के लिए `gpt-image-1.5` का उपयोग करें; वर्तमान
    `gpt-image-2` API `background: "transparent"` को अस्वीकार करता है।

    `gpt-image-2` एक ही `image_generate` टूल के जरिए text-to-image जनरेशन और
    संदर्भ-इमेज संपादन दोनों का समर्थन करता है।
    OpenClaw `prompt`, `count`, `size`, `quality`, `outputFormat`,
    और संदर्भ इमेज OpenAI को अग्रेषित करता है। OpenAI को
    `aspectRatio` या `resolution` सीधे **नहीं** मिलते; जब संभव हो, OpenClaw
    उन्हें समर्थित `size` में मैप करता है, अन्यथा टूल उन्हें
    अनदेखे ओवरराइड के रूप में रिपोर्ट करता है।

    OpenAI-विशिष्ट विकल्प `openai` ऑब्जेक्ट के अंतर्गत रहते हैं:

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

    `openai.background` `transparent`, `opaque`, या `auto` स्वीकार करता है;
    पारदर्शी आउटपुट के लिए `outputFormat` `png` या `webp` और
    पारदर्शिता-सक्षम OpenAI इमेज मॉडल चाहिए। OpenClaw डिफॉल्ट
    `gpt-image-2` पारदर्शी-background अनुरोधों को `gpt-image-1.5` पर रूट करता है।
    `openai.outputCompression` JPEG/WebP आउटपुट पर लागू होता है और
    PNG आउटपुट के लिए अनदेखा किया जाता है।

    शीर्ष-स्तरीय `background` संकेत प्रदाता-तटस्थ है और वर्तमान में
    OpenAI प्रदाता चुने जाने पर उसी OpenAI `background` अनुरोध फील्ड पर मैप होता है।
    जो प्रदाता background समर्थन घोषित नहीं करते, वे असमर्थित पैरामीटर प्राप्त करने के बजाय
    इसे `ignoredOverrides` में लौटाते हैं।

    `api.openai.com` के बजाय Azure OpenAI deployment के जरिए OpenAI इमेज जनरेशन रूट करने के लिए,
    [Azure OpenAI endpoints](/hi/providers/openai#azure-openai-endpoints) देखें।

  </Accordion>
  <Accordion title="Microsoft Foundry MAI इमेज मॉडल">
    Microsoft Foundry इमेज जनरेशन `microsoft-foundry/` प्रदाता prefix के अंतर्गत
    deploy किए गए MAI इमेज deployment नामों का उपयोग करता है। कोई प्रदाता-स्तर
    डिफॉल्ट मॉडल नहीं है क्योंकि MAI API `model` फील्ड में आपके deployment नाम की अपेक्षा करता है:

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

    प्रदाता OpenAI Images API नहीं, बल्कि Microsoft Foundry की MAI API का उपयोग करता है:

    - जनरेशन endpoint: `/mai/v1/images/generations`
    - संपादन endpoint: `/mai/v1/images/edits`
    - प्रमाणीकरण: `AZURE_OPENAI_API_KEY` / प्रदाता API key, या `az login` के जरिए Entra ID
    - आउटपुट: एक PNG इमेज
    - आकार: डिफॉल्ट `1024x1024`; चौड़ाई और ऊंचाई प्रत्येक कम से कम 768 px होनी चाहिए,
      और कुल पिक्सेल अधिकतम 1,048,576 होने चाहिए
    - संपादन: एक PNG या JPEG संदर्भ इमेज, केवल
      `MAI-Image-2.5-Flash` और `MAI-Image-2.5` deployments द्वारा समर्थित

    केवल-prompt जनरेशन केवल Foundry endpoint कॉन्फिगर करके कस्टम deployment नाम का उपयोग कर सकता है।
    कस्टम deployment नामों के साथ संपादन के लिए onboarding/model metadata चाहिए ताकि OpenClaw सत्यापित कर सके कि deployment
    `MAI-Image-2.5-Flash` या `MAI-Image-2.5` द्वारा समर्थित है।

    वर्तमान MAI इमेज मॉडल `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e`, और `MAI-Image-2` हैं। सेटअप और chat-model व्यवहार के लिए
    [Microsoft Foundry plugin](/hi/plugins/reference/microsoft-foundry) देखें।

  </Accordion>
  <Accordion title="OpenRouter इमेज मॉडल">
    OpenRouter इमेज जनरेशन वही `OPENROUTER_API_KEY` उपयोग करता है और
    OpenRouter की chat completions image API के जरिए रूट करता है। `openrouter/` prefix के साथ
    OpenRouter इमेज मॉडल चुनें:

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
    Gemini-संगत `aspectRatio` / `resolution` संकेत OpenRouter को अग्रेषित करता है।
    वर्तमान built-in OpenRouter इमेज मॉडल shortcuts में
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview`, और `openai/gpt-5.4-image-2` शामिल हैं।
    आपके कॉन्फिगर किए गए plugin क्या expose करता है, यह देखने के लिए `action: "list"` का उपयोग करें।

  </Accordion>
  <Accordion title="fal Krea 2">
    fal पर Krea 2 मॉडल Flux द्वारा उपयोग किए गए generic
    `image_size` schema के बजाय fal के native Krea schema का उपयोग करते हैं। OpenClaw भेजता है:

    - aspect-ratio संकेतों के लिए `aspect_ratio`
    - `creativity`, जिसका डिफॉल्ट `medium` है
    - `image` या `images` दिए जाने पर `image_style_references`

    तेज expressive illustration के लिए Krea 2 Medium और धीमे, अधिक विस्तृत photoreal और textured looks के लिए Krea 2 Large चुनें:

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

    Krea 2 वर्तमान में प्रति अनुरोध एक इमेज लौटाता है। Krea के लिए `aspectRatio` को प्राथमिकता दें;
    OpenClaw `size` को निकटतम समर्थित Krea aspect ratio पर मैप करता है और
    Krea के लिए `resolution` को छोड़ने के बजाय अस्वीकार करता है। जब आप native Krea creativity level चाहते हैं, तो `fal.creativity` का उपयोग करें:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax इमेज जनरेशन दोनों bundled MiniMax प्रमाणीकरण पथों के जरिए उपलब्ध है:

    - API-key setups के लिए `minimax/image-01`
    - OAuth setups के लिए `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    bundled xAI प्रदाता prompt-only अनुरोधों के लिए `/v1/images/generations` और
    `image` या `images` मौजूद होने पर `/v1/images/edits` का उपयोग करता है।

    - मॉडल: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - संख्या: 4 तक
    - संदर्भ: एक `image` या पांच तक `images`
    - Aspect ratios: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resolutions: `1K`, `2K`
    - आउटपुट: OpenClaw-प्रबंधित इमेज attachments के रूप में लौटाए जाते हैं

    OpenClaw जानबूझकर xAI-native `quality`, `mask`,
    `user`, या अतिरिक्त native-only aspect ratios expose नहीं करता, जब तक वे controls
    shared cross-provider `image_generate` contract में मौजूद नहीं होते।

  </Accordion>
</AccordionGroup>

## उदाहरण

<Tabs>
  <Tab title="जनरेट करें (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="जनरेट करें (transparent PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

समतुल्य CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="जनरेट करें (OpenAI low quality)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

समतुल्य CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

यही `--output-format`, `--background`, `--quality`, और
`--openai-moderation` फ्लैग `openclaw infer image edit` पर उपलब्ध हैं;
`--openai-background` OpenAI-विशिष्ट उपनाम के रूप में बना रहता है। OpenAI के अलावा बंडल किए गए प्रदाता
आज स्पष्ट background नियंत्रण घोषित नहीं करते, इसलिए
`background: "transparent"` उनके लिए अनदेखा किया गया रिपोर्ट होता है।

## संबंधित

- [टूल्स अवलोकन](/hi/tools) - सभी उपलब्ध एजेंट टूल्स
- [ComfyUI](/hi/providers/comfy) - स्थानीय ComfyUI और Comfy Cloud वर्कफ़्लो सेटअप
- [fal](/hi/providers/fal) - fal इमेज और वीडियो प्रदाता सेटअप
- [Google (Gemini)](/hi/providers/google) - Gemini इमेज प्रदाता सेटअप
- [Microsoft Foundry प्लगइन](/hi/plugins/reference/microsoft-foundry) - Microsoft Foundry चैट और MAI इमेज सेटअप
- [MiniMax](/hi/providers/minimax) - MiniMax इमेज प्रदाता सेटअप
- [OpenAI](/hi/providers/openai) - OpenAI Images प्रदाता सेटअप
- [Vydra](/hi/providers/vydra) - Vydra इमेज, वीडियो, और स्पीच सेटअप
- [xAI](/hi/providers/xai) - Grok इमेज, वीडियो, खोज, कोड निष्पादन, और TTS सेटअप
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agent-defaults) - `imageGenerationModel` कॉन्फ़िग
- [मॉडल](/hi/concepts/models) - मॉडल कॉन्फ़िगरेशन और failover
