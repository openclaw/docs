---
read_when:
    - एजेंट के माध्यम से संगीत या ऑडियो जनरेट करना
    - संगीत-निर्माण प्रदाताओं और मॉडलों को कॉन्फ़िगर करना
    - music_generate टूल के पैरामीटर को समझना
sidebarTitle: Music generation
summary: ComfyUI, fal, Google Lyria, MiniMax और OpenRouter वर्कफ़्लो में music_generate के ज़रिए संगीत जनरेट करें
title: संगीत निर्माण
x-i18n:
    generated_at: "2026-07-16T17:50:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` टूल, ComfyUI, fal, Google, MiniMax और
OpenRouter द्वारा समर्थित साझा संगीत-जनरेशन क्षमता के माध्यम से संगीत या ऑडियो बनाता है।

<Note>
`music_generate` केवल तभी दिखाई देता है जब कम-से-कम एक संगीत-जनरेशन प्रदाता
उपलब्ध हो: स्पष्ट `agents.defaults.musicGenerationModel` कॉन्फ़िगरेशन, या
प्रमाणीकरण-कॉन्फ़िगर किया गया प्रदाता (उदाहरण के लिए, सेट की गई API कुंजी)।
</Note>

सेशन-समर्थित एजेंट रन के लिए, `music_generate` एक बैकग्राउंड टास्क के रूप में शुरू होता है,
टास्क लेजर में प्रगति ट्रैक करता है, फिर ट्रैक तैयार होने पर एजेंट को सक्रिय करता है
ताकि वह उपयोगकर्ता को बता सके और तैयार ऑडियो संलग्न कर सके। पूर्णता
एजेंट सेशन के दृश्य-उत्तर अनुबंध का पालन करता है: कॉन्फ़िगर होने पर
स्वचालित अंतिम उत्तर, या जब सेशन को संदेश टूल की आवश्यकता हो तब
`message(action="send")`। यदि अनुरोधकर्ता सेशन निष्क्रिय है या उसे सक्रिय करना विफल रहता है और
जनरेट किया गया ऑडियो अब भी उत्तर में नहीं है, तो OpenClaw केवल अनुपस्थित ऑडियो के साथ
एक आइडेम्पोटेंट प्रत्यक्ष फ़ॉलबैक भेजता है।

## तुरंत शुरू करें

<Tabs>
  <Tab title="साझा प्रदाता-समर्थित">
    <Steps>
      <Step title="प्रमाणीकरण कॉन्फ़िगर करें">
        कम-से-कम एक प्रदाता के लिए API कुंजी सेट करें — उदाहरण के लिए
        `GEMINI_API_KEY` या `MINIMAX_API_KEY`।
      </Step>
      <Step title="डिफ़ॉल्ट मॉडल चुनें (वैकल्पिक)">
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
      </Step>
      <Step title="एजेंट से कहें">
        _"नीऑन शहर में रात की ड्राइव के बारे में उत्साहपूर्ण सिंथपॉप ट्रैक
        जनरेट करें।"_

        एजेंट स्वचालित रूप से `music_generate` को कॉल करता है। टूल को
        अनुमति-सूची में जोड़ने की आवश्यकता नहीं है।
      </Step>
    </Steps>

    सेशन-समर्थित एजेंट रन के बिना (प्रत्यक्ष/स्थानीय संदर्भों में), टूल
    इनलाइन चलता है और उसी टूल परिणाम में अंतिम मीडिया पथ लौटाता है।

  </Tab>
  <Tab title="ComfyUI वर्कफ़्लो">
    <Steps>
      <Step title="वर्कफ़्लो कॉन्फ़िगर करें">
        वर्कफ़्लो JSON और प्रॉम्प्ट/आउटपुट नोड के साथ
        `plugins.entries.comfy.config.music` कॉन्फ़िगर करें।
      </Step>
      <Step title="क्लाउड प्रमाणीकरण (वैकल्पिक)">
        Comfy Cloud के लिए, `COMFY_API_KEY` या `COMFY_CLOUD_API_KEY` सेट करें।
      </Step>
      <Step title="टूल को कॉल करें">
        ```text
        /tool music_generate prompt="सौम्य टेप टेक्सचर वाला मधुर एम्बिएंट सिंथ लूप"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

उदाहरण प्रॉम्प्ट:

```text
सौम्य स्ट्रिंग्स और बिना वोकल वाला सिनेमाई पियानो ट्रैक जनरेट करें।
```

```text
सूर्योदय के समय रॉकेट लॉन्च करने के बारे में ऊर्जावान चिपट्यून लूप जनरेट करें।
```

उपलब्ध प्रदाताओं/मॉडलों की जाँच करने के लिए `action: "list"` और
सक्रिय सेशन-समर्थित संगीत टास्क की जाँच करने के लिए `action: "status"` का उपयोग करें:

```text
/tool music_generate action=list
/tool music_generate action=status
```

प्रत्यक्ष जनरेशन का उदाहरण:

```text
/tool music_generate prompt="विनाइल टेक्सचर और हल्की बारिश वाला स्वप्निल लो-फ़ाई हिप हॉप" instrumental=true
```

## समर्थित प्रदाता

| प्रदाता   | डिफ़ॉल्ट मॉडल                | संदर्भ इनपुट | समर्थित नियंत्रण                                    | प्रमाणीकरण                                   |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | अधिकतम 1 इमेज    | वर्कफ़्लो-निर्धारित संगीत या ऑडियो                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | कोई नहीं             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` या `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | अधिकतम 10 इमेज  | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | कोई नहीं             | `lyrics`, `instrumental`, `format` (केवल mp3)         | `MINIMAX_API_KEY` या MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | अधिकतम 1 इमेज    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax समान मॉडल साझा करने वाली दो प्रदाता id पंजीकृत करता है: API-कुंजी
प्रमाणीकरण के लिए `minimax` और OAuth के लिए `minimax-portal`। मॉडल संदर्भ
प्रमाणीकरण पथ का अनुसरण करते हैं (`minimax/music-2.6` बनाम `minimax-portal/music-2.6`); देखें
[MiniMax](/hi/providers/minimax#music-generation)।

fal अपने डिफ़ॉल्ट MiniMax-समर्थित मॉडल के साथ `fal-ai/ace-step/prompt-to-audio` (wav, कोई गीत नहीं,
कोई इंस्ट्रुमेंटल टॉगल नहीं) और `fal-ai/stable-audio-25/text-to-audio` (wav,
केवल प्रॉम्प्ट) भी उपलब्ध कराता है। Google का डिफ़ॉल्ट
`lyria-3-clip-preview` केवल mp3 आउटपुट देता है; `lyria-3-pro-preview` wav का भी समर्थन करता है।
MiniMax, `music-2.6-free`, `music-cover` और
`music-cover-free` भी उपलब्ध कराता है। OpenRouter, `google/lyria-3-clip-preview` भी उपलब्ध कराता है।

### क्षमता मैट्रिक्स

`music_generate`, अनुबंध परीक्षणों और साझा लाइव स्वीप द्वारा उपयोग किया जाने वाला
स्पष्ट मोड अनुबंध:

| प्रदाता   | `generate` | `edit` | संपादन सीमा | साझा लाइव लेन                                                         |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 इमेज    | साझा स्वीप में नहीं; `extensions/comfy/comfy.live.test.ts` द्वारा कवर किया गया |
| fal        |     ✓      |   —    | कोई नहीं       | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 इमेज  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | कोई नहीं       | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 इमेज    | `generate`, `edit`                                                        |

## टूल पैरामीटर

<ParamField path="prompt" type="string" required>
  संगीत जनरेशन प्रॉम्प्ट। `action: "generate"` के लिए आवश्यक।
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` वर्तमान सेशन टास्क लौटाता है; `"list"` प्रदाताओं की जाँच करता है।
</ParamField>
<ParamField path="model" type="string">
  प्रदाता/मॉडल ओवरराइड (जैसे `google/lyria-3-pro-preview`,
  `comfy/workflow`)।
</ParamField>
<ParamField path="lyrics" type="string">
  जब प्रदाता स्पष्ट गीत इनपुट का समर्थन करता हो, तब वैकल्पिक गीत।
</ParamField>
<ParamField path="instrumental" type="boolean">
  जब प्रदाता इसका समर्थन करता हो, तब केवल इंस्ट्रुमेंटल आउटपुट का अनुरोध करें।
</ParamField>
<ParamField path="image" type="string">
  एकल संदर्भ इमेज पथ या URL।
</ParamField>
<ParamField path="images" type="string[]">
  एकाधिक संदर्भ इमेज (समर्थित प्रदाताओं पर अधिकतम 10)।
</ParamField>
<ParamField path="durationSeconds" type="number">
  जब प्रदाता अवधि संकेतों का समर्थन करता हो, तब सेकंड में लक्षित अवधि।
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  जब प्रदाता इसका समर्थन करता हो, तब आउटपुट फ़ॉर्मेट संकेत।
</ParamField>
<ParamField path="filename" type="string">आउटपुट फ़ाइलनाम संकेत।</ParamField>

<Note>
सभी प्रदाता सभी पैरामीटर का समर्थन नहीं करते। OpenClaw फिर भी सबमिशन से पहले
इनपुट संख्या जैसी कठोर सीमाओं को सत्यापित करता है। जब कोई प्रदाता अवधि का समर्थन करता है,
लेकिन अनुरोधित मान से कम अधिकतम सीमा का उपयोग करता है, तो OpenClaw इसे निकटतम
समर्थित अवधि तक सीमित कर देता है। यदि चयनित प्रदाता या मॉडल वास्तव में असमर्थित
वैकल्पिक संकेतों का पालन नहीं कर सकता, तो उन्हें चेतावनी के साथ अनदेखा कर दिया जाता है।
टूल परिणाम लागू की गई सेटिंग्स की रिपोर्ट करते हैं; `details.normalization`
अनुरोधित-से-लागू किसी भी मैपिंग को दर्ज करता है।
</Note>

प्रदाता अनुरोध टाइमआउट केवल ऑपरेटर कॉन्फ़िगरेशन हैं। कॉन्फ़िगर होने पर OpenClaw
`agents.defaults.musicGenerationModel.timeoutMs` का उपयोग करता है, 120000ms से कम
मानों को बढ़ाकर 120000ms करता है और अन्यथा प्रदाता अनुरोधों के लिए
डिफ़ॉल्ट रूप से 300000ms का उपयोग करता है।

## एसिंक्रोनस व्यवहार

सेशन-समर्थित संगीत जनरेशन बैकग्राउंड टास्क के रूप में चलता है:

- **बैकग्राउंड टास्क:** `music_generate` एक बैकग्राउंड टास्क बनाता है, तत्काल
  आरंभ किया गया/टास्क उत्तर लौटाता है और तैयार ट्रैक को बाद में
  अनुवर्ती एजेंट संदेश में पोस्ट करता है।
- **डुप्लिकेट रोकथाम:** जब कोई टास्क `queued` या `running` हो, तब उसी
  सेशन में बाद की `music_generate` कॉल नया जनरेशन शुरू करने के बजाय
  टास्क स्थिति लौटाती हैं। स्पष्ट रूप से जाँचने के लिए `action: "status"` का उपयोग करें।
  हाल ही में पूर्ण हुए मेल खाते अनुरोध को भी 2 मिनट तक डीडुप्लिकेट किया जाता है।
- **स्थिति जाँच:** `openclaw tasks list` या `openclaw tasks show <taskId>`
  कतारबद्ध, चल रही और अंतिम स्थिति की जाँच करता है।
- **पूर्णता सक्रियण:** OpenClaw उसी सेशन में एक आंतरिक पूर्णता इवेंट वापस
  इंजेक्ट करता है, ताकि मॉडल स्वयं उपयोगकर्ता-दृश्य अनुवर्ती संदेश लिख सके।
- **प्रॉम्प्ट संकेत:** उसी सेशन में बाद के उपयोगकर्ता/मैन्युअल टर्न को एक छोटा
  रनटाइम संकेत मिलता है, जब कोई संगीत टास्क पहले से चल रहा हो, ताकि मॉडल
  बिना सोचे `music_generate` को फिर से कॉल न करे।
- **सेशन-रहित फ़ॉलबैक:** वास्तविक एजेंट सेशन के बिना प्रत्यक्ष/स्थानीय संदर्भ
  इनलाइन चलते हैं और उसी टर्न में अंतिम ऑडियो परिणाम लौटाते हैं।

### टास्क जीवनचक्र

संगीत टास्क सामान्य टास्क रजिस्ट्री जैसी ही स्थितियाँ प्रदर्शित करता है (पूर्ण स्थिति
मशीन के लिए [बैकग्राउंड टास्क](/hi/automation/tasks#task-lifecycle) देखें,
जिसमें `timed_out`, `cancelled` और `lost` शामिल हैं)। अधिकांश संगीत रन
इन चरणों से गुजरते हैं:

| स्थिति       | अर्थ                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | टास्क बनाया गया है और प्रदाता द्वारा स्वीकार किए जाने की प्रतीक्षा कर रहा है।                                           |
| `running`   | प्रदाता प्रोसेस कर रहा है (आमतौर पर प्रदाता और अवधि के आधार पर 30 सेकंड से 3 मिनट)। |
| `succeeded` | ट्रैक तैयार है; एजेंट सक्रिय होकर इसे बातचीत में पोस्ट करता है।                                 |
| `failed`    | प्रदाता त्रुटि या टाइमआउट; एजेंट त्रुटि विवरण के साथ सक्रिय होता है।                                 |

CLI से स्थिति जाँचें:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## कॉन्फ़िगरेशन

### मॉडल चयन

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### प्रदाता चयन क्रम

OpenClaw इस क्रम में प्रदाताओं को आज़माता है:

1. टूल कॉल से `model` पैरामीटर (यदि एजेंट कोई निर्दिष्ट करता है)।
2. कॉन्फ़िगरेशन से `musicGenerationModel.primary`।
3. क्रमानुसार `musicGenerationModel.fallbacks`।
4. केवल प्रमाणीकरण-समर्थित प्रदाता डिफ़ॉल्ट का उपयोग करके स्वतः-पहचान:
   - पहले वर्तमान डिफ़ॉल्ट टेक्स्ट-मॉडल प्रदाता, यदि वह संगीत
     जनरेशन भी प्रदान करता है;
   - शेष पंजीकृत संगीत-जनरेशन प्रदाता, प्रदाता id के अनुसार
     वर्णानुक्रम में।

यदि कोई प्रदाता विफल होता है, तो अगला उम्मीदवार स्वचालित रूप से आज़माया जाता है। यदि सभी
विफल होते हैं, तो त्रुटि में प्रत्येक प्रयास का विवरण शामिल होता है।

केवल स्पष्ट `model`, `primary` और `fallbacks` प्रविष्टियों का
उपयोग करने के लिए `agents.defaults.mediaGenerationAutoProviderFallback: false` सेट करें।

## प्रदाता संबंधी टिप्पणियाँ

<AccordionGroup>
  <Accordion title="ComfyUI">
    यह वर्कफ़्लो-संचालित है और प्रॉम्प्ट/आउटपुट फ़ील्ड के लिए कॉन्फ़िगर किए गए ग्राफ़ तथा Node मैपिंग
    पर निर्भर करता है। बंडल किया गया `comfy` Plugin, संगीत-जनरेशन प्रदाता
    रजिस्ट्री के माध्यम से साझा `music_generate` टूल से जुड़ता है।
  </Accordion>
  <Accordion title="fal">
    साझा प्रदाता प्रमाणीकरण पथ के माध्यम से fal मॉडल एंडपॉइंट का उपयोग करता है। बंडल किया गया
    प्रदाता डिफ़ॉल्ट रूप से `fal-ai/minimax-music/v2.6` का उपयोग करता है और प्रॉम्प्ट-से-ऑडियो अनुरोधों के लिए
    `fal-ai/ace-step/prompt-to-audio` तथा
    `fal-ai/stable-audio-25/text-to-audio` भी उपलब्ध कराता है।
    गीत और वाद्य मोड केवल MiniMax मॉडल के लिए हैं; अन्य दोनों
    मॉडल केवल प्रॉम्प्ट का समर्थन करते हैं।
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 बैच जनरेशन का उपयोग करता है। मौजूदा बंडल किया गया प्रवाह
    प्रॉम्प्ट, वैकल्पिक गीत टेक्स्ट और वैकल्पिक संदर्भ छवियों का समर्थन करता है।
    डिफ़ॉल्ट `lyria-3-clip-preview` मॉडल केवल mp3 आउटपुट देता है;
    `lyria-3-pro-preview` मॉडल wav का भी समर्थन करता है।
  </Accordion>
  <Accordion title="MiniMax">
    बैच `music_generation` एंडपॉइंट का उपयोग करता है। प्रॉम्प्ट, वैकल्पिक
    गीत, वाद्य मोड और `minimax` API-कुंजी प्रमाणीकरण या
    `minimax-portal` OAuth के माध्यम से mp3 आउटपुट का समर्थन करता है। साथ ही `music-2.6-free`,
    `music-cover` और `music-cover-free` मॉडल भी उपलब्ध कराता है।
  </Accordion>
  <Accordion title="OpenRouter">
    स्ट्रीमिंग सक्षम करके OpenRouter चैट कम्प्लीशन ऑडियो आउटपुट का उपयोग करता है। बंडल किया गया
    प्रदाता डिफ़ॉल्ट रूप से `google/lyria-3-pro-preview` का उपयोग करता है और
    `openrouter/google/lyria-3-clip-preview` भी उपलब्ध कराता है।
  </Accordion>
</AccordionGroup>

## सही पथ चुनना

- **साझा प्रदाता-समर्थित** का उपयोग तब करें, जब आपको मॉडल चयन, प्रदाता
  फ़ेलओवर और अंतर्निहित एसिंक्रोनस कार्य/स्थिति प्रवाह चाहिए।
- **Plugin पथ (ComfyUI)** का उपयोग तब करें, जब आपको कस्टम वर्कफ़्लो ग्राफ़ या ऐसे
  प्रदाता की आवश्यकता हो जो साझा बंडल की गई संगीत क्षमता का हिस्सा नहीं है।

यदि आप ComfyUI-विशिष्ट व्यवहार को डीबग कर रहे हैं, तो
[ComfyUI](/hi/providers/comfy) देखें। यदि आप साझा प्रदाता
व्यवहार को डीबग कर रहे हैं, तो [fal](/hi/providers/fal), [Google (Gemini)](/hi/providers/google),
[MiniMax](/hi/providers/minimax), या [OpenRouter](/hi/providers/openrouter) से शुरुआत करें।

## प्रदाता क्षमता मोड

साझा संगीत-जनरेशन अनुबंध स्पष्ट मोड घोषणाओं का समर्थन करता है:

- केवल प्रॉम्प्ट से जनरेशन के लिए `generate`।
- जब अनुरोध में एक या अधिक संदर्भ छवियाँ शामिल हों, तब `edit`।

नए प्रदाता कार्यान्वयनों को स्पष्ट मोड ब्लॉक को प्राथमिकता देनी चाहिए:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`, `supportsLyrics` और
`supportsFormat` जैसे पुराने फ़्लैट फ़ील्ड, संपादन समर्थन घोषित करने के लिए **पर्याप्त नहीं** हैं। प्रदाताओं
को `generate` और `edit` स्पष्ट रूप से घोषित करने चाहिए, ताकि लाइव परीक्षण, अनुबंध
परीक्षण और साझा `music_generate` टूल मोड समर्थन को
निर्धारणात्मक रूप से सत्यापित कर सकें।

## लाइव परीक्षण

साझा बंडल किए गए प्रदाताओं (fal, Google, MiniMax,
OpenRouter) के लिए ऑप्ट-इन लाइव कवरेज:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

समकक्ष रिपॉज़िटरी रैपर, जो उसी परीक्षण फ़ाइल को चलाता है:

```bash
pnpm test:live:media:music
```

यह लाइव फ़ाइल डिफ़ॉल्ट रूप से संग्रहीत प्रमाणीकरण
प्रोफ़ाइलों से पहले पहले से निर्यात किए गए प्रदाता एनवायरनमेंट वेरिएबल का उपयोग करती है, और जब
प्रदाता संपादन मोड सक्षम करता है, तब `generate` तथा घोषित `edit` दोनों का कवरेज चलाती है।
वर्तमान कवरेज:

- `google`: `generate` और `edit`
- `fal`: केवल `generate`
- `minimax`: केवल `generate`
- `openrouter`: `generate` और `edit`
- `comfy`: अलग Comfy लाइव कवरेज, साझा प्रदाता स्वीप का हिस्सा नहीं

बंडल किए गए ComfyUI संगीत पथ के लिए ऑप्ट-इन लाइव कवरेज:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

जब संबंधित अनुभाग कॉन्फ़िगर किए जाते हैं, तब Comfy लाइव फ़ाइल
Comfy छवि और वीडियो वर्कफ़्लो को भी कवर करती है।

## संबंधित

- [पृष्ठभूमि कार्य](/hi/automation/tasks) — अलग किए गए `music_generate` रन के लिए कार्य ट्रैकिंग
- [ComfyUI](/hi/providers/comfy)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agent-defaults) — `musicGenerationModel` कॉन्फ़िगरेशन
- [Google (Gemini)](/hi/providers/google)
- [MiniMax](/hi/providers/minimax)
- [मॉडल](/hi/concepts/models) — मॉडल कॉन्फ़िगरेशन और फ़ेलओवर
- [टूल का अवलोकन](/hi/tools)
