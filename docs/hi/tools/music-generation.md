---
read_when:
    - एजेंट के माध्यम से संगीत या ऑडियो जनरेट करना
    - संगीत-निर्माण प्रदाताओं और मॉडलों को कॉन्फ़िगर करना
    - music_generate टूल पैरामीटर समझना
sidebarTitle: Music generation
summary: ComfyUI, fal, Google Lyria, MiniMax, और OpenRouter वर्कफ़्लो में music_generate के ज़रिए संगीत जनरेट करें
title: संगीत जनरेशन
x-i18n:
    generated_at: "2026-06-29T00:21:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` टूल एजेंट को कॉन्फ़िगर किए गए प्रदाताओं — ComfyUI,
fal, Google, MiniMax, और आज OpenRouter — के साथ साझा संगीत-जनरेशन
क्षमता के माध्यम से संगीत या ऑडियो बनाने देता है।

सेशन-समर्थित एजेंट रन के लिए, OpenClaw संगीत जनरेशन को
बैकग्राउंड टास्क के रूप में शुरू करता है, उसे टास्क लेजर में ट्रैक करता है,
फिर ट्रैक तैयार होने पर एजेंट को फिर से जगाता है ताकि एजेंट उपयोगकर्ता को बता सके
और तैयार ऑडियो संलग्न कर सके। पूर्णता एजेंट सेशन के सामान्य दृश्यमान-उत्तर
मोड का पालन करता है: कॉन्फ़िगर होने पर स्वचालित अंतिम उत्तर डिलीवरी, या
`message(action="send")` जब सेशन को message टूल की आवश्यकता होती है। यदि अनुरोधकर्ता सेशन
निष्क्रिय है या उसका सक्रिय वेक विफल हो जाता है, और कुछ जनरेट किया गया ऑडियो अभी भी
पूर्णता उत्तर से गायब है, तो OpenClaw केवल गायब ऑडियो के साथ
एक इडेम्पोटेंट प्रत्यक्ष फ़ॉलबैक भेजता है।

<Note>
बिल्ट-इन साझा टूल केवल तब दिखाई देता है जब कम से कम एक संगीत-जनरेशन
प्रदाता उपलब्ध हो। यदि आपको अपने एजेंट के
टूल में `music_generate` नहीं दिखता है, तो `agents.defaults.musicGenerationModel` कॉन्फ़िगर करें या
प्रदाता API कुंजी सेट करें।
</Note>

## त्वरित शुरुआत

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        कम से कम एक प्रदाता के लिए API कुंजी सेट करें — उदाहरण के लिए
        `GEMINI_API_KEY` या `MINIMAX_API_KEY`।
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        एजेंट `music_generate` को स्वचालित रूप से कॉल करता है। किसी टूल
        allow-listing की आवश्यकता नहीं है।
      </Step>
    </Steps>

    सेशन-समर्थित एजेंट रन के बिना प्रत्यक्ष सिंक्रोनस संदर्भों के लिए,
    बिल्ट-इन टूल अब भी इनलाइन जनरेशन पर फ़ॉलबैक करता है और टूल परिणाम में
    अंतिम मीडिया पथ लौटाता है।

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        वर्कफ़्लो JSON और prompt/output nodes के साथ
        `plugins.entries.comfy.config.music` कॉन्फ़िगर करें।
      </Step>
      <Step title="Cloud auth (optional)">
        Comfy Cloud के लिए, `COMFY_API_KEY` या `COMFY_CLOUD_API_KEY` सेट करें।
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

उदाहरण प्रॉम्प्ट:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## समर्थित प्रदाता

| प्रदाता    | डिफ़ॉल्ट मॉडल              | संदर्भ इनपुट       | समर्थित नियंत्रण                                      | प्रमाणीकरण                             |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 1 छवि तक         | वर्कफ़्लो-निर्धारित संगीत या ऑडियो                    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | कोई नहीं         | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` या `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | 10 छवियों तक     | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | कोई नहीं         | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` या MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | 1 छवि तक         | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### क्षमता मैट्रिक्स

`music_generate`, अनुबंध परीक्षणों, और
साझा लाइव स्वीप द्वारा उपयोग किया जाने वाला स्पष्ट मोड अनुबंध:

| प्रदाता    | `generate` | `edit` | एडिट सीमा | साझा लाइव लेन                                                           |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 छवि      | साझा स्वीप में नहीं; `extensions/comfy/comfy.live.test.ts` द्वारा कवर किया गया |
| fal        |     ✓      |   —    | कोई नहीं   | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 छवियां  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | कोई नहीं   | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 छवि      | `generate`, `edit`                                                        |

रनटाइम पर उपलब्ध साझा प्रदाताओं और मॉडलों की जांच करने के लिए
`action: "list"` का उपयोग करें:

```text
/tool music_generate action=list
```

सक्रिय सेशन-समर्थित संगीत टास्क की जांच करने के लिए `action: "status"` का उपयोग करें:

```text
/tool music_generate action=status
```

प्रत्यक्ष जनरेशन उदाहरण:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## टूल पैरामीटर

<ParamField path="prompt" type="string" required>
  संगीत जनरेशन प्रॉम्प्ट। `action: "generate"` के लिए आवश्यक।
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` वर्तमान सत्र टास्क लौटाता है; `"list"` प्रदाताओं की जांच करता है।
</ParamField>
<ParamField path="model" type="string">
  प्रदाता/मॉडल ओवरराइड (जैसे `google/lyria-3-pro-preview`,
  `comfy/workflow`)।
</ParamField>
<ParamField path="lyrics" type="string">
  वैकल्पिक बोल, जब प्रदाता स्पष्ट बोल इनपुट का समर्थन करता हो।
</ParamField>
<ParamField path="instrumental" type="boolean">
  केवल-वाद्य आउटपुट का अनुरोध करें, जब प्रदाता इसका समर्थन करता हो।
</ParamField>
<ParamField path="image" type="string">
  एकल संदर्भ इमेज पथ या URL।
</ParamField>
<ParamField path="images" type="string[]">
  अनेक संदर्भ इमेज (समर्थन करने वाले प्रदाताओं पर 10 तक)।
</ParamField>
<ParamField path="durationSeconds" type="number">
  लक्षित अवधि सेकंड में, जब प्रदाता अवधि संकेतों का समर्थन करता हो।
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  आउटपुट फॉर्मेट संकेत, जब प्रदाता इसका समर्थन करता हो।
</ParamField>
<ParamField path="filename" type="string">आउटपुट फाइलनाम संकेत।</ParamField>

<Note>
सभी प्रदाता सभी पैरामीटर का समर्थन नहीं करते। OpenClaw फिर भी सबमिशन से
पहले इनपुट गणना जैसी कठोर सीमाओं को मान्य करता है। जब कोई प्रदाता अवधि
का समर्थन करता है, लेकिन अनुरोधित मान से कम अधिकतम अवधि का उपयोग करता है,
तो OpenClaw उसे निकटतम समर्थित अवधि तक सीमित कर देता है। सचमुच असमर्थित
वैकल्पिक संकेतों को चेतावनी के साथ अनदेखा किया जाता है, जब चयनित प्रदाता
या मॉडल उनका पालन नहीं कर सकता। टूल परिणाम लागू सेटिंग्स रिपोर्ट करते हैं;
`details.normalization` किसी भी अनुरोधित-से-लागू मैपिंग को कैप्चर करता है।
</Note>

प्रदाता अनुरोध टाइमआउट केवल ऑपरेटर कॉन्फिगरेशन हैं। कॉन्फिगर होने पर OpenClaw
`agents.defaults.musicGenerationModel.timeoutMs` का उपयोग करता है, 120000ms
से कम मानों को 120000ms तक बढ़ाता है, और अन्यथा प्रदाता अनुरोधों को
300000ms पर डिफॉल्ट करता है।

## असिंक्रोनस व्यवहार

सत्र-समर्थित संगीत जनरेशन बैकग्राउंड टास्क के रूप में चलता है:

- **बैकग्राउंड टास्क:** `music_generate` एक बैकग्राउंड टास्क बनाता है, तुरंत
  शुरू/टास्क प्रतिक्रिया लौटाता है, और तैयार ट्रैक को बाद में फॉलो-अप
  एजेंट संदेश में पोस्ट करता है।
- **डुप्लिकेट रोकथाम:** जब कोई टास्क `queued` या `running` में हो, तो उसी
  सत्र में बाद की `music_generate` कॉल एक और जनरेशन शुरू करने के बजाय
  टास्क स्थिति लौटाती हैं। स्पष्ट रूप से जांचने के लिए `action: "status"`
  का उपयोग करें।
- **स्थिति लुकअप:** `openclaw tasks list` या `openclaw tasks show <taskId>`
  कतारबद्ध, चल रही, और अंतिम स्थिति की जांच करता है।
- **पूर्णता वेक:** OpenClaw उसी सत्र में एक आंतरिक पूर्णता इवेंट वापस
  इंजेक्ट करता है ताकि मॉडल उपयोगकर्ता-मुखी फॉलो-अप स्वयं लिख सके।
- **प्रॉम्प्ट संकेत:** उसी सत्र में बाद की उपयोगकर्ता/मैनुअल टर्न को एक छोटा
  रनटाइम संकेत मिलता है जब कोई संगीत टास्क पहले से चल रहा हो, ताकि मॉडल
  बिना सोचे `music_generate` फिर से कॉल न करे।
- **बिना-सत्र फॉलबैक:** वास्तविक एजेंट सत्र के बिना प्रत्यक्ष/local संदर्भ
  इनलाइन चलते हैं और अंतिम ऑडियो परिणाम उसी टर्न में लौटाते हैं।

### टास्क जीवनचक्र

| स्थिति       | अर्थ                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | टास्क बनाया गया, प्रदाता द्वारा स्वीकार किए जाने की प्रतीक्षा में।                                           |
| `running`   | प्रदाता प्रोसेस कर रहा है (आमतौर पर प्रदाता और अवधि के आधार पर 30 सेकंड से 3 मिनट)। |
| `succeeded` | ट्रैक तैयार है; एजेंट जागता है और उसे बातचीत में पोस्ट करता है।                                 |
| `failed`    | प्रदाता त्रुटि या टाइमआउट; एजेंट त्रुटि विवरणों के साथ जागता है।                                 |

CLI से स्थिति जांचें:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## कॉन्फिगरेशन

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

OpenClaw इस क्रम में प्रदाताओं को आजमाता है:

1. टूल कॉल से `model` पैरामीटर (यदि एजेंट कोई निर्दिष्ट करता है)।
2. कॉन्फिग से `musicGenerationModel.primary`।
3. क्रम में `musicGenerationModel.fallbacks`।
4. केवल auth-समर्थित प्रदाता डिफॉल्ट का उपयोग करके स्वतः-पहचान:
   - पहले वर्तमान डिफॉल्ट प्रदाता;
   - बाकी पंजीकृत संगीत-जनरेशन प्रदाता, प्रदाता ID क्रम में।

यदि कोई प्रदाता विफल होता है, तो अगला उम्मीदवार अपने-आप आजमाया जाता है। यदि सभी
विफल होते हैं, तो त्रुटि में प्रत्येक प्रयास का विवरण शामिल होता है।

केवल स्पष्ट `model`, `primary`, और `fallbacks` प्रविष्टियों का उपयोग करने के लिए
`agents.defaults.mediaGenerationAutoProviderFallback: false` सेट करें।

## प्रदाता नोट्स

<AccordionGroup>
  <Accordion title="ComfyUI">
    वर्कफ्लो-चालित है और प्रॉम्प्ट/आउटपुट फील्ड के लिए कॉन्फिगर किए गए ग्राफ
    और नोड मैपिंग पर निर्भर करता है। बंडल किया गया `comfy` Plugin साझा
    `music_generate` टूल में संगीत-जनरेशन प्रदाता रजिस्ट्री के माध्यम से
    जुड़ता है।
  </Accordion>
  <Accordion title="fal">
    साझा प्रदाता auth पथ के माध्यम से fal मॉडल एंडपॉइंट का उपयोग करता है।
    बंडल किया गया प्रदाता `fal-ai/minimax-music/v2.6` पर डिफॉल्ट करता है और
    प्रॉम्प्ट-से-ऑडियो अनुरोधों के लिए `fal-ai/ace-step/prompt-to-audio` और
    `fal-ai/stable-audio-25/text-to-audio` भी उजागर करता है।
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Lyria 3 बैच जनरेशन का उपयोग करता है। वर्तमान बंडल किया गया फ्लो
    प्रॉम्प्ट, वैकल्पिक बोल टेक्स्ट, और वैकल्पिक संदर्भ इमेज का समर्थन करता है।
  </Accordion>
  <Accordion title="MiniMax">
    बैच `music_generation` एंडपॉइंट का उपयोग करता है। प्रॉम्प्ट, वैकल्पिक
    बोल, वाद्य मोड, और mp3 आउटपुट का समर्थन करता है, या तो `minimax`
    API-key auth या `minimax-portal` OAuth के माध्यम से।
  </Accordion>
  <Accordion title="OpenRouter">
    स्ट्रीमिंग सक्षम करके OpenRouter चैट कम्प्लीशन्स ऑडियो आउटपुट का उपयोग
    करता है। बंडल किया गया प्रदाता `google/lyria-3-pro-preview` पर डिफॉल्ट करता
    है और `openrouter/google/lyria-3-clip-preview` भी उजागर करता है।
  </Accordion>
</AccordionGroup>

## सही पथ चुनना

- **साझा प्रदाता-समर्थित** जब आपको मॉडल चयन, प्रदाता फेलओवर, और अंतर्निहित
  असिंक्रोनस टास्क/स्थिति फ्लो चाहिए।
- **Plugin पथ (ComfyUI)** जब आपको कस्टम वर्कफ्लो ग्राफ या ऐसे प्रदाता की
  आवश्यकता हो जो साझा बंडल की गई संगीत क्षमता का हिस्सा नहीं है।

यदि आप ComfyUI-विशिष्ट व्यवहार डीबग कर रहे हैं, तो
[ComfyUI](/hi/providers/comfy) देखें। यदि आप साझा प्रदाता
व्यवहार डीबग कर रहे हैं, तो [fal](/hi/providers/fal), [Google (Gemini)](/hi/providers/google),
[MiniMax](/hi/providers/minimax), या [OpenRouter](/hi/providers/openrouter) से शुरू करें।

## प्रदाता क्षमता मोड

साझा संगीत-जनरेशन अनुबंध स्पष्ट मोड घोषणाओं का समर्थन करता है:

- केवल प्रॉम्प्ट वाली जनरेशन के लिए `generate`।
- जब अनुरोध में एक या अधिक संदर्भ चित्र शामिल हों, तब `edit`।

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

`maxInputImages`, `supportsLyrics`, और
`supportsFormat` जैसे पुराने फ्लैट फ़ील्ड edit समर्थन को विज्ञापित करने के लिए **पर्याप्त नहीं** हैं। प्रदाताओं को
`generate` और `edit` स्पष्ट रूप से घोषित करने चाहिए ताकि लाइव परीक्षण, अनुबंध
परीक्षण, और साझा `music_generate` टूल मोड समर्थन को
निर्धारित रूप से सत्यापित कर सकें।

## लाइव परीक्षण

साझा बंडल किए गए प्रदाताओं के लिए ऑप्ट-इन लाइव कवरेज:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

रेपो रैपर:

```bash
pnpm test:live:media music
```

यह लाइव फ़ाइल डिफ़ॉल्ट रूप से संग्रहीत auth
प्रोफ़ाइलों से पहले पहले से निर्यात किए गए प्रदाता env vars का उपयोग करती है, और जब
प्रदाता edit मोड सक्षम करता है, तब `generate` और घोषित `edit` दोनों कवरेज चलाती है। आज की कवरेज:

- `google`: `generate` और `edit`
- `fal`: केवल `generate`
- `minimax`: केवल `generate`
- `openrouter`: `generate` और `edit`
- `comfy`: अलग Comfy लाइव कवरेज, साझा प्रदाता स्वीप नहीं

बंडल किए गए ComfyUI संगीत पथ के लिए ऑप्ट-इन लाइव कवरेज:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

जब वे सेक्शन कॉन्फ़िगर किए जाते हैं, तो Comfy लाइव फ़ाइल comfy इमेज और वीडियो वर्कफ़्लो को भी कवर करती है।

## संबंधित

- [बैकग्राउंड टास्क](/hi/automation/tasks) — अलग किए गए `music_generate` रन के लिए टास्क ट्रैकिंग
- [ComfyUI](/hi/providers/comfy)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#agent-defaults) — `musicGenerationModel` config
- [Google (Gemini)](/hi/providers/google)
- [MiniMax](/hi/providers/minimax)
- [मॉडल](/hi/concepts/models) — मॉडल कॉन्फ़िगरेशन और फ़ेलओवर
- [टूल्स अवलोकन](/hi/tools)
