---
read_when:
    - यह समझाना कि चैनलों पर स्ट्रीमिंग या चंकिंग कैसे काम करती है
    - ब्लॉक स्ट्रीमिंग या चैनल चंकिंग व्यवहार बदलना
    - डुप्लिकेट/प्रारंभिक ब्लॉक उत्तरों या चैनल पूर्वावलोकन स्ट्रीमिंग की डिबगिंग
summary: स्ट्रीमिंग + खंडों में बाँटने का व्यवहार (ब्लॉक जवाब, चैनल पूर्वावलोकन स्ट्रीमिंग, मोड मैपिंग)
title: स्ट्रीमिंग और चंकिंग
x-i18n:
    generated_at: "2026-07-01T05:43:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2724c21414dd470780f0c7f634380bef3feeb54a08bd0da3e944173340df1c80
    source_path: concepts/streaming.md
    workflow: 16
---

OpenClaw में दो अलग-अलग स्ट्रीमिंग परतें हैं:

- **ब्लॉक स्ट्रीमिंग (चैनल):** assistant के लिखते समय पूरे हो चुके **ब्लॉक** उत्सर्जित करें। ये सामान्य चैनल संदेश हैं (टोकन डेल्टा नहीं)।
- **पूर्वावलोकन स्ट्रीमिंग (Telegram/Discord/Slack):** जनरेट करते समय एक अस्थायी **पूर्वावलोकन संदेश** अपडेट करें।

आज चैनल संदेशों के लिए **वास्तविक टोकन-डेल्टा स्ट्रीमिंग नहीं** है। पूर्वावलोकन स्ट्रीमिंग संदेश-आधारित है (भेजना + संपादन/जोड़ना)।

## ब्लॉक स्ट्रीमिंग (चैनल संदेश)

ब्लॉक स्ट्रीमिंग assistant आउटपुट उपलब्ध होते ही मोटे हिस्सों में भेजती है।

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

लीजेंड:

- `text_delta/events`: मॉडल स्ट्रीम इवेंट (नॉन-स्ट्रीमिंग मॉडल के लिए विरल हो सकते हैं)।
- `chunker`: `EmbeddedBlockChunker` जो न्यूनतम/अधिकतम सीमाएं + ब्रेक वरीयता लागू करता है।
- `channel send`: वास्तविक आउटबाउंड संदेश (ब्लॉक जवाब)।

**नियंत्रण:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (डिफ़ॉल्ट बंद)।
- चैनल ओवरराइड: हर चैनल पर `"on"`/`"off"` बाध्य करने के लिए `*.blockStreaming` (और प्रति-अकाउंट वैरिएंट)।
- `agents.defaults.blockStreamingBreak`: `"text_end"` या `"message_end"`।
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`।
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (भेजने से पहले स्ट्रीम किए गए ब्लॉक मिलाएं)।
- चैनल हार्ड कैप: `*.textChunkLimit` (जैसे, `channels.whatsapp.textChunkLimit`)।
- चैनल चंक मोड: `*.chunkMode` (`length` डिफ़ॉल्ट, `newline` लंबाई-आधारित चंकिंग से पहले खाली पंक्तियों (पैराग्राफ सीमाओं) पर विभाजित करता है)।
- Discord सॉफ्ट कैप: `channels.discord.maxLinesPerMessage` (डिफ़ॉल्ट 17) UI कटने से बचाने के लिए लंबे जवाबों को विभाजित करता है।

**सीमा अर्थविज्ञान:**

- `text_end`: chunker जैसे ही उत्सर्जित करे, ब्लॉक स्ट्रीम करें; हर `text_end` पर फ्लश करें।
- `message_end`: assistant संदेश समाप्त होने तक प्रतीक्षा करें, फिर बफ़र किया गया आउटपुट फ्लश करें।

यदि बफ़र किया गया टेक्स्ट `maxChars` से अधिक है, तो `message_end` अब भी chunker का उपयोग करता है, इसलिए यह अंत में कई चंक उत्सर्जित कर सकता है।

### ब्लॉक स्ट्रीमिंग के साथ मीडिया डिलीवरी

स्ट्रीमिंग मीडिया को `mediaUrl` या
`mediaUrls` जैसे संरचित पेलोड फ़ील्ड का उपयोग करना चाहिए; स्ट्रीम किए गए टेक्स्ट को अटैचमेंट कमांड के रूप में पार्स नहीं किया जाता। जब ब्लॉक
स्ट्रीमिंग मीडिया जल्दी भेजती है, तो OpenClaw उस टर्न के लिए उस डिलीवरी को याद रखता है। यदि
अंतिम assistant पेलोड वही मीडिया URL दोहराता है, तो अंतिम डिलीवरी
अटैचमेंट दोबारा भेजने के बजाय डुप्लिकेट मीडिया हटा देती है।

ठीक-ठीक डुप्लिकेट अंतिम पेलोड दबा दिए जाते हैं। यदि अंतिम पेलोड पहले से स्ट्रीम किए गए मीडिया के आसपास
अलग टेक्स्ट जोड़ता है, तो OpenClaw मीडिया को एकल-डिलीवरी रखते हुए
नया टेक्स्ट फिर भी भेजता है। यह Telegram जैसे चैनलों पर डुप्लिकेट वॉइस
नोट या फ़ाइलें रोकता है।

## चंकिंग एल्गोरिदम (निम्न/उच्च सीमाएं)

ब्लॉक चंकिंग `EmbeddedBlockChunker` द्वारा लागू की जाती है:

- **निम्न सीमा:** जब तक बफ़र >= `minChars` न हो, उत्सर्जित न करें (जब तक बाध्य न किया गया हो)।
- **उच्च सीमा:** `maxChars` से पहले विभाजन पसंद करें; यदि बाध्य किया गया हो, तो `maxChars` पर विभाजित करें।
- **ब्रेक वरीयता:** `paragraph` → `newline` → `sentence` → `whitespace` → हार्ड ब्रेक।
- **कोड फ़ेंस:** फ़ेंस के अंदर कभी विभाजित न करें; `maxChars` पर बाध्य होने पर, Markdown वैध रखने के लिए फ़ेंस बंद + दोबारा खोलें।

`maxChars` को चैनल `textChunkLimit` तक सीमित किया जाता है, इसलिए आप प्रति-चैनल कैप से आगे नहीं जा सकते।

## कोएलेसिंग (स्ट्रीम किए गए ब्लॉक मिलाना)

जब ब्लॉक स्ट्रीमिंग सक्षम हो, तो OpenClaw भेजने से पहले **लगातार ब्लॉक चंक मिला** सकता है। इससे "एकल-पंक्ति स्पैम" घटता है, जबकि फिर भी
प्रगतिशील आउटपुट मिलता है।

- कोएलेसिंग फ्लश करने से पहले **निष्क्रिय अंतराल** (`idleMs`) की प्रतीक्षा करता है।
- बफ़र `maxChars` से सीमित हैं और उससे अधिक होने पर फ्लश हो जाएंगे।
- `minChars` बहुत छोटे अंशों को तब तक भेजने से रोकता है जब तक पर्याप्त टेक्स्ट जमा न हो जाए
  (अंतिम फ्लश हमेशा बचा हुआ टेक्स्ट भेजता है)।
- जॉइनर `blockStreamingChunk.breakPreference` से निकाला जाता है
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → स्पेस)।
- चैनल ओवरराइड `*.blockStreamingCoalesce` के जरिए उपलब्ध हैं (प्रति-अकाउंट कॉन्फ़िग सहित)।
- डिफ़ॉल्ट कोएलेस `minChars` Signal/Slack/Discord के लिए 1500 तक बढ़ाया जाता है, जब तक ओवरराइड न हो।

## ब्लॉक के बीच मानव-जैसी गति

जब ब्लॉक स्ट्रीमिंग सक्षम हो, तो आप ब्लॉक जवाबों के बीच (पहले ब्लॉक के बाद) **यादृच्छिक विराम** जोड़ सकते हैं। इससे बहु-बबल प्रतिक्रियाएं अधिक स्वाभाविक लगती हैं।

- कॉन्फ़िग: `agents.defaults.humanDelay` (प्रति एजेंट `agents.list[].humanDelay` से ओवरराइड करें)।
- मोड: `off` (डिफ़ॉल्ट), `natural` (800-2500ms), `custom` (`minMs`/`maxMs`)।
- केवल **ब्लॉक जवाबों** पर लागू होता है, अंतिम जवाबों या टूल सारांशों पर नहीं।

## "चंक स्ट्रीम करें या सब कुछ"

यह इससे मैप होता है:

- **चंक स्ट्रीम करें:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (जैसे-जैसे आगे बढ़ें, उत्सर्जित करें)। नॉन-Telegram चैनलों को `*.blockStreaming: true` भी चाहिए।
- **अंत में सब कुछ स्ट्रीम करें:** `blockStreamingBreak: "message_end"` (एक बार फ्लश करें, बहुत लंबा होने पर संभवतः कई चंक)।
- **कोई ब्लॉक स्ट्रीमिंग नहीं:** `blockStreamingDefault: "off"` (केवल अंतिम जवाब)।

**चैनल नोट:** ब्लॉक स्ट्रीमिंग **तब तक बंद रहती है जब तक**
`*.blockStreaming` को स्पष्ट रूप से `true` पर सेट न किया जाए। चैनल ब्लॉक जवाबों के बिना लाइव पूर्वावलोकन
(`channels.<channel>.streaming`) स्ट्रीम कर सकते हैं।

कॉन्फ़िग स्थान अनुस्मारक: `blockStreaming*` डिफ़ॉल्ट
रूट कॉन्फ़िग में नहीं, `agents.defaults` के अंतर्गत रहते हैं।

## पूर्वावलोकन स्ट्रीमिंग मोड

कैनोनिकल कुंजी: `channels.<channel>.streaming`

मोड:

- `off`: पूर्वावलोकन स्ट्रीमिंग अक्षम करें।
- `partial`: एकल पूर्वावलोकन जिसे नवीनतम टेक्स्ट से बदल दिया जाता है।
- `block`: पूर्वावलोकन चंक किए गए/जोड़े गए चरणों में अपडेट होता है।
- `progress`: जनरेशन के दौरान प्रगति/स्थिति पूर्वावलोकन, पूर्णता पर अंतिम उत्तर।

`streaming.mode: "block"` Discord और Telegram जैसे संपादन-सक्षम चैनलों के लिए पूर्वावलोकन-स्ट्रीमिंग मोड है। यह वहां चैनल ब्लॉक डिलीवरी सक्षम नहीं करता।
जब आप सामान्य ब्लॉक जवाब चाहते हैं, तो `streaming.block.enabled` या पुरानी `blockStreaming` चैनल कुंजी का उपयोग करें। Microsoft Teams अपवाद है: इसमें
ड्राफ़्ट-पूर्वावलोकन ब्लॉक ट्रांसपोर्ट नहीं है, इसलिए `streaming.mode: "block"` मूल partial/progress स्ट्रीमिंग के बजाय Teams ब्लॉक
डिलीवरी पर मैप होता है।

### चैनल मैपिंग

| चैनल    | `off` | `partial` | `block` | `progress`              |
| ---------- | ----- | --------- | ------- | ----------------------- |
| Telegram   | ✅    | ✅        | ✅      | संपादन योग्य प्रगति ड्राफ़्ट |
| Discord    | ✅    | ✅        | ✅      | संपादन योग्य प्रगति ड्राफ़्ट |
| Slack      | ✅    | ✅        | ✅      | ✅                      |
| Mattermost | ✅    | ✅        | ✅      | ✅                      |
| MS Teams   | ✅    | ✅        | ✅      | नेटिव प्रगति स्ट्रीम  |

केवल Slack:

- `channels.slack.streaming.nativeTransport`, `channels.slack.streaming.mode="partial"` होने पर Slack नेटिव स्ट्रीमिंग API कॉल टॉगल करता है (डिफ़ॉल्ट: `true`)।
- Slack नेटिव स्ट्रीमिंग और Slack assistant थ्रेड स्थिति के लिए reply thread target चाहिए। टॉप-लेवल DM वह थ्रेड-शैली पूर्वावलोकन नहीं दिखाते, लेकिन वे फिर भी Slack ड्राफ़्ट पूर्वावलोकन पोस्ट और संपादन का उपयोग कर सकते हैं।

पुरानी कुंजी माइग्रेशन:

- Telegram: पुरानी `streamMode` और स्केलर/बूलियन `streaming` मानों को doctor/config संगतता पथों द्वारा पहचाना और `streaming.mode` में माइग्रेट किया जाता है।
- Discord: `streamMode` + बूलियन `streaming`, `streaming` enum के लिए रनटाइम उपनाम बने रहते हैं; persisted config को दोबारा लिखने के लिए `openclaw doctor --fix` चलाएं।
- Slack: `streamMode`, `streaming.mode` के लिए रनटाइम उपनाम बना रहता है; बूलियन `streaming`, `streaming.mode` और `streaming.nativeTransport` के लिए रनटाइम उपनाम बना रहता है; पुराना `nativeStreaming`, `streaming.nativeTransport` के लिए रनटाइम उपनाम बना रहता है। persisted config को दोबारा लिखने के लिए `openclaw doctor --fix` चलाएं।

### रनटाइम व्यवहार

Telegram:

- DM और समूह/टॉपिक में `sendMessage` + `editMessageText` पूर्वावलोकन अपडेट का उपयोग करता है।
- छोटे शुरुआती पूर्वावलोकन push-notification UX के लिए अब भी डिबाउंस किए जाते हैं, लेकिन Telegram अब उन्हें सीमित विलंब के बाद मूर्त कर देता है ताकि सक्रिय रन दृश्य रूप से चुप न रहें।
- अंतिम टेक्स्ट सक्रिय पूर्वावलोकन को उसी जगह संपादित करता है; लंबे अंतिम उत्तर पहले चंक के लिए उसी संदेश का दोबारा उपयोग करते हैं और केवल बचे हुए चंक भेजते हैं।
- `block` मोड पूर्वावलोकन को `streaming.preview.chunk.maxChars` पर नए संदेश में घुमाता है (डिफ़ॉल्ट 800, Telegram की 4096 संपादन सीमा से कैप किया गया); अन्य मोड एक पूर्वावलोकन को 4096 वर्णों तक बढ़ाते हैं।
- `progress` मोड टूल प्रगति को संपादन योग्य स्थिति ड्राफ़्ट में रखता है, उत्तर स्ट्रीमिंग सक्रिय होने पर लेकिन अभी कोई टूल पंक्ति उपलब्ध न होने पर स्थिति लेबल को मूर्त करता है, पूर्णता पर उस ड्राफ़्ट को साफ़ करता है, और अंतिम उत्तर सामान्य डिलीवरी से भेजता है।
- यदि पूर्ण टेक्स्ट की पुष्टि से पहले अंतिम संपादन विफल हो जाता है, तो OpenClaw सामान्य अंतिम डिलीवरी का उपयोग करता है और पुराने पूर्वावलोकन को साफ़ करता है।
- Telegram ब्लॉक स्ट्रीमिंग स्पष्ट रूप से सक्षम होने पर पूर्वावलोकन स्ट्रीमिंग छोड़ी जाती है (डबल-स्ट्रीमिंग से बचने के लिए)।
- `/reasoning stream` reasoning को एक क्षणिक पूर्वावलोकन में लिख सकता है जिसे अंतिम डिलीवरी के बाद हटा दिया जाता है।

Discord:

- भेजना + संपादन पूर्वावलोकन संदेशों का उपयोग करता है।
- `block` मोड ड्राफ़्ट चंकिंग (`draftChunk`) का उपयोग करता है।
- Discord ब्लॉक स्ट्रीमिंग स्पष्ट रूप से सक्षम होने पर पूर्वावलोकन स्ट्रीमिंग छोड़ी जाती है।
- अंतिम मीडिया, त्रुटि, और स्पष्ट-जवाब पेलोड नए ड्राफ़्ट को फ्लश किए बिना लंबित पूर्वावलोकन रद्द करते हैं, फिर सामान्य डिलीवरी का उपयोग करते हैं।

Slack:

- `partial` उपलब्ध होने पर Slack नेटिव स्ट्रीमिंग (`chat.startStream`/`append`/`stop`) का उपयोग कर सकता है।
- `block` append-शैली ड्राफ़्ट पूर्वावलोकनों का उपयोग करता है।
- `progress` स्थिति पूर्वावलोकन टेक्स्ट, फिर अंतिम उत्तर का उपयोग करता है।
- reply thread के बिना टॉप-लेवल DM, Slack नेटिव स्ट्रीमिंग के बजाय ड्राफ़्ट पूर्वावलोकन पोस्ट और संपादन का उपयोग करते हैं।
- नेटिव और ड्राफ़्ट पूर्वावलोकन स्ट्रीमिंग उस टर्न के लिए ब्लॉक जवाबों को दबा देती है, इसलिए Slack जवाब केवल एक डिलीवरी पथ से स्ट्रीम होता है।
- अंतिम मीडिया/त्रुटि पेलोड और प्रगति अंतिम उत्तर फेंकने योग्य ड्राफ़्ट संदेश नहीं बनाते; केवल टेक्स्ट/ब्लॉक अंतिम उत्तर जो पूर्वावलोकन संपादित कर सकते हैं, लंबित ड्राफ़्ट टेक्स्ट फ्लश करते हैं।

Mattermost:

- सोच, टूल गतिविधि, और आंशिक जवाब टेक्स्ट को एकल ड्राफ़्ट पूर्वावलोकन पोस्ट में स्ट्रीम करता है, जो अंतिम उत्तर भेजना सुरक्षित होने पर उसी जगह अंतिम हो जाता है।
- यदि पूर्वावलोकन पोस्ट हटा दी गई हो या अंतिम रूप देने के समय अन्यथा अनुपलब्ध हो, तो ताज़ी अंतिम पोस्ट भेजने पर वापस गिरता है।
- अंतिम मीडिया/त्रुटि पेलोड सामान्य डिलीवरी से पहले लंबित पूर्वावलोकन अपडेट रद्द करते हैं, अस्थायी पूर्वावलोकन पोस्ट फ्लश नहीं करते।

Matrix:

- जब अंतिम टेक्स्ट पूर्वावलोकन इवेंट का दोबारा उपयोग कर सकता है, तो ड्राफ़्ट पूर्वावलोकन उसी जगह अंतिम हो जाते हैं।
- केवल-मीडिया, त्रुटि, और reply-target-mismatch अंतिम उत्तर सामान्य डिलीवरी से पहले लंबित पूर्वावलोकन अपडेट रद्द करते हैं; पहले से दिखाई दे रहा पुराना पूर्वावलोकन redacted किया जाता है।

### टूल-प्रगति पूर्वावलोकन अपडेट

पूर्वावलोकन स्ट्रीमिंग में **टूल-प्रगति** अपडेट भी शामिल हो सकते हैं - "वेब खोज रहा है", "फ़ाइल पढ़ रहा है", या "टूल कॉल कर रहा है" जैसी छोटी स्थिति पंक्तियां - जो टूल चलने के दौरान, अंतिम जवाब से पहले, उसी पूर्वावलोकन संदेश में दिखाई देती हैं। Codex app-server मोड में, Codex preamble/commentary संदेश इसी पूर्वावलोकन पथ का उपयोग करते हैं, इसलिए "मैं जांच रहा हूं..." जैसे छोटे प्रगति नोट अंतिम उत्तर का हिस्सा बने बिना संपादन योग्य ड्राफ़्ट में स्ट्रीम हो सकते हैं। यह बहु-चरण टूल टर्न को पहले सोच पूर्वावलोकन और अंतिम उत्तर के बीच चुप रहने के बजाय दृश्य रूप से सक्रिय रखता है।

लंबे समय तक चलने वाले टूल लौटने से पहले टाइप की गई प्रगति उत्सर्जित कर सकते हैं। उदाहरण के लिए,
`web_fetch` शुरू होने पर पांच-सेकंड का टाइमर आर्म करता है: यदि fetch अब भी
लंबित है, तो पूर्वावलोकन `Fetching page content...` दिखा सकता है; यदि fetch पूरा हो जाता है
या उससे पहले रद्द हो जाता है, तो कोई प्रगति पंक्ति उत्सर्जित नहीं होती। बाद का अंतिम टूल
परिणाम फिर भी सामान्य रूप से मॉडल को डिलीवर किया जाता है।

समर्थित सतहें:

- **Discord**, **Slack**, **Telegram**, और **Matrix** preview streaming सक्रिय होने पर डिफ़ॉल्ट रूप से tool-progress और Codex preamble अपडेट को live preview edit में stream करते हैं। Microsoft Teams निजी chats में अपनी native progress stream का उपयोग करता है।
- Telegram में `v2026.4.22` से tool-progress preview updates सक्षम होकर shipped हैं; उन्हें सक्षम रखना उस released behavior को सुरक्षित रखता है।
- **Mattermost** पहले से ही tool activity को अपने single draft preview post में समेटता है (ऊपर देखें)।
- Tool-progress edits सक्रिय preview streaming mode का पालन करते हैं; जब preview streaming `off` हो या block streaming ने message संभाल लिया हो, तो उन्हें छोड़ दिया जाता है। Telegram पर, `streaming.mode: "off"` केवल-अंतिम है: generic progress chatter को standalone status messages के रूप में deliver करने के बजाय दबा दिया जाता है, जबकि approval prompts, media payloads, और errors अभी भी सामान्य रूप से route होते हैं।
- Preview streaming बनाए रखते हुए tool-progress lines छिपाने के लिए, उस channel के लिए `streaming.preview.toolProgress` को `false` पर set करें। Command/exec text छिपाते हुए tool-progress lines दृश्यमान रखने के लिए, `streaming.preview.commandText` को `"status"` या `streaming.progress.commandText` को `"status"` पर set करें; released behavior सुरक्षित रखने के लिए default `"raw"` है। यह policy उन draft/progress channels द्वारा साझा की जाती है जो OpenClaw के compact progress renderer का उपयोग करते हैं, जिनमें Discord, Matrix, Microsoft Teams, Mattermost, Slack draft previews, और Telegram शामिल हैं। Preview edits को पूरी तरह disable करने के लिए, `streaming.mode` को `off` पर set करें।
- Telegram selected quote replies एक exception हैं: जब `replyToMode` `"off"` नहीं है और selected quote text मौजूद है, तो OpenClaw उस turn के लिए answer preview stream छोड़ देता है ताकि tool-progress preview lines render न हो सकें। Selected quote text के बिना current-message replies अभी भी preview streaming बनाए रखते हैं। विवरण के लिए [Telegram channel docs](/hi/channels/telegram) देखें।

### Commentary progress lane

Tool-progress से आगे, compact progress renderer draft में एक और lane दिखा सकता है:

- **`streaming.progress.commentary`** — model की pre-tool **commentary** (💬) render करें — छोटी “मैं जाँचूँगा… फिर…” narration — progress draft में tool lines के साथ interleaved।

```json
{
  "channels": {
    "discord": {
      "streaming": { "mode": "progress", "progress": { "commentary": true } }
    }
  }
}
```

Progress lines दृश्यमान रखें लेकिन raw command/exec text छिपाएँ:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

यही shape किसी अन्य compact progress channel key के अंतर्गत उपयोग करें, उदाहरण के लिए `channels.discord`, `channels.matrix`, `channels.msteams`, `channels.mattermost`, या Slack draft previews। Progress-draft mode के लिए, वही policy `streaming.progress` के अंतर्गत रखें:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## संबंधित

- [Message lifecycle refactor](/hi/concepts/message-lifecycle-refactor) - shared preview, edit, stream, और finalization design को लक्षित करता है
- [Progress drafts](/hi/concepts/progress-drafts) - लंबे turns के दौरान update होने वाले दृश्यमान work-in-progress messages
- [Messages](/hi/concepts/messages) - message lifecycle और delivery
- [Retry](/hi/concepts/retry) - delivery failure पर retry behavior
- [Channels](/hi/channels) - प्रति-channel streaming support
