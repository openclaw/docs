---
read_when:
    - संदेश कार्ड, चार्ट, तालिका, बटन या चयन रेंडरिंग जोड़ना या संशोधित करना
    - समृद्ध आउटबाउंड संदेशों का समर्थन करने वाला चैनल Plugin बनाना
    - संदेश टूल की प्रस्तुति या डिलीवरी क्षमताओं में बदलाव करना
    - प्रदाता-विशिष्ट कार्ड/ब्लॉक/कंपोनेंट रेंडरिंग प्रतिगमों की डीबगिंग
summary: चैनल plugins के लिए अर्थपूर्ण संदेश कार्ड, चार्ट, तालिकाएँ, नियंत्रण, फ़ॉलबैक टेक्स्ट और डिलीवरी संकेत
title: संदेश प्रस्तुति
x-i18n:
    generated_at: "2026-07-19T09:29:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0b56ed47ce837e865aa7ac218f02f4d5523b3b71ae22dd0074f2aab00aeecb7a
    source_path: plugins/message-presentation.md
    workflow: 16
---

संदेश प्रस्तुति समृद्ध आउटबाउंड चैट UI के लिए OpenClaw का साझा अनुबंध है।
यह एजेंटों, CLI कमांडों, अनुमोदन प्रवाहों और plugins को संदेश का
आशय एक बार वर्णित करने देता है, जबकि प्रत्येक चैनल plugin उसे उपलब्ध सर्वोत्तम नेटिव रूप में रेंडर करता है।

पोर्टेबल संदेश UI के लिए प्रस्तुति का उपयोग करें: टेक्स्ट अनुभाग, छोटा संदर्भ/फुटर
टेक्स्ट, विभाजक, चार्ट, तालिकाएँ, बटन, चयन मेनू और कार्ड शीर्षक/टोन।

साझा संदेश टूल में Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` या Feishu `card` जैसे नए प्रदाता-नेटिव फ़ील्ड न जोड़ें।
ये चैनल plugin के स्वामित्व वाले रेंडरर आउटपुट हैं।

## अनुबंध

Plugin लेखक सार्वजनिक अनुबंध को यहाँ से इंपोर्ट करते हैं:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

संरचना:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | {
      type: "question";
      questionId: string;
      optionValue: string;
    }
  | { type: "url"; url: string }
  | {
      type: "web-app";
      url: string;
      widgetId?: string;
    }
  | {
      type: "web-app";
      url?: string;
      widgetId: string;
    };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** पुराना कॉलबैक मान। नए नियंत्रणों के लिए action को प्राथमिकता दें। */
  value?: string;
  /** @deprecated "url" प्रकार वाले action का उपयोग करें। */
  url?: string;
  /** @deprecated "web-app" प्रकार वाले action का उपयोग करें। */
  webApp?: { url: string };
  /** @deprecated "web-app" प्रकार वाले action का उपयोग करें। */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** पुराना कॉलबैक मान। नए नियंत्रणों के लिए action को प्राथमिकता दें। */
  value?: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

बटन का अर्थ-विज्ञान:

- `action.type: "command"` कोर के कमांड
  पथ के माध्यम से एक नेटिव स्लैश कमांड चलाता है। अंतर्निहित कमांड बटन और मेनू के लिए इसका उपयोग करें।
- `action.type: "callback"` चैनल के
  इंटरैक्शन पथ के माध्यम से अपारदर्शी plugin डेटा ले जाता है। चैनल plugins को कॉलबैक डेटा की स्लैश
  कमांड के रूप में पुनर्व्याख्या नहीं करनी चाहिए।
- `action.type: "approval"` एक स्थायी ऑपरेटर अनुमोदन, उसके
  स्पष्ट `exec` या `plugin` प्रकार और अनुरोधित निर्णय की पहचान करता है। चैनल plugins
  उस कार्रवाई को ट्रांसपोर्ट-निजी कॉलबैक में एन्कोड करके अनुमोदन सेवा के माध्यम से
  उसका समाधान करते हैं; उन्हें `/approve` कमांड टेक्स्ट पार्स नहीं करना चाहिए या ID से
  प्रकार का अनुमान नहीं लगाना चाहिए।
- `action.type: "question"` किसी सक्रिय, रनटाइम द्वारा रचित
  `ask_user` प्रश्न के एक विकल्प की पहचान करता है। `approval` की तरह, यह OpenClaw रनटाइम कार्रवाई है;
  एजेंटों और plugins को प्रश्न ID संश्लेषित नहीं करनी चाहिए। Telegram, Discord और
  Slack इसे ट्रांसपोर्ट-निजी नेटिव कॉलबैक में मैप करते हैं और Gateway के माध्यम से विकल्प का
  समाधान करते हैं। जब प्रश्न का उत्तर दिया जाता है, उसकी अवधि समाप्त हो जाती है या उसे
  रद्द किया जाता है, तो ये चैनल वितरित संदेश को संपादित करते हैं, उसकी कार्रवाइयाँ हटाते हैं
  और अंतिम स्थिति जोड़ते हैं। WhatsApp, Signal और iMessage अधिकतम
  चार एकल-चयन विकल्पों को `1️⃣` से `4️⃣` प्रतिक्रियाओं के रूप में रेंडर करते हैं। अन्य प्रश्न
  संरचनाएँ लेबल टेक्स्ट में अवक्रमित हो जाती हैं और उपयोगकर्ता सादे-टेक्स्ट
  उत्तर से जवाब दे सकता है।
- `action.type: "url"` एक सामान्य लिंक खोलता है।
- `action.type: "web-app"` चैनल-नेटिव वेब ऐप लॉन्च करता है। URL-आधारित ऐप के लिए `url`
  या OpenClaw द्वारा होस्ट किए गए ऐसे विजेट के लिए `widgetId` सेट करें जिसकी लॉन्च
  प्रक्रिया चैनल के स्वामित्व में है; कम-से-कम एक आवश्यक है। दोनों मौजूद होने पर
  चैनल अपने नेटिव होस्टेड-विजेट लॉन्च को प्राथमिकता दे सकता है और जहाँ वह प्रक्रिया
  उपलब्ध नहीं है वहाँ URL का उपयोग कर सकता है।
- `value` पुराना अपारदर्शी कॉलबैक मान है। नए नियंत्रणों को `action` का उपयोग करना चाहिए
  ताकि चैनल plugins टेक्स्ट से अनुमान लगाए बिना कमांड और कॉलबैक मैप कर सकें।
- `url`, `webApp` और `web_app` बहिष्कृत सीमा इनपुट के रूप में स्वीकार किए जाते हैं।
  नॉर्मलाइज़र इन फ़ील्डों को सुरक्षित रखते हैं ताकि रेंडरर जारी किए गए पुराने
  अर्थ-विज्ञान को स्पष्ट टाइप की गई कार्रवाइयों से अलग कर सकें। नए उत्पादकों को `action` का उपयोग करना चाहिए।
- `label` आवश्यक है और टेक्स्ट फ़ॉलबैक में भी उपयोग किया जाता है।
- `style` परामर्शात्मक है। रेंडररों को असमर्थित शैलियों को किसी सुरक्षित
  डिफ़ॉल्ट में मैप करना चाहिए, न कि प्रेषण विफल करना चाहिए।
- `priority` वैकल्पिक है। जब कोई चैनल कार्रवाई सीमाएँ घोषित करता है और नियंत्रण
  हटाने पड़ते हैं, तो कोर उच्च-प्राथमिकता वाले बटनों को पहले रखता है और समान प्राथमिकता वाले
  बटनों का मूल क्रम सुरक्षित रखता है। जब सभी नियंत्रण समा जाते हैं, तो रचित
  क्रम सुरक्षित रहता है।
- `disabled` वैकल्पिक है। चैनलों को `supportsDisabled` के साथ स्पष्ट सहमति देनी होगी; अन्यथा
  कोर अक्षम नियंत्रण को गैर-इंटरैक्टिव फ़ॉलबैक टेक्स्ट में अवक्रमित करता है। कोई
  अक्षम बटन फ़ॉलबैक टेक्स्ट में हमेशा केवल लेबल के रूप में रेंडर होता है, भले ही उसमें
  `command` कार्रवाई हो।
- `reusable` वैकल्पिक है। पुनः उपयोग योग्य नेटिव कॉलबैक का समर्थन करने वाले चैनल
  सफल इंटरैक्शन के बाद कार्रवाई को उपलब्ध रख सकते हैं। इसका उपयोग
  रीफ़्रेश, निरीक्षण या अधिक विवरण जैसी दोहराने योग्य अथवा आइडेम्पोटेंट कार्रवाइयों के लिए करें;
  सामान्य एक-बार के अनुमोदनों और विनाशकारी कार्रवाइयों के लिए इसे सेट न करें।

चयन का अर्थ-विज्ञान:

- `options[].action` केवल `command` या `callback` स्वीकार करता है; अनुमोदन और लिंक कार्रवाइयाँ केवल बटन के लिए हैं।
- `options[].value` पुराना चयनित एप्लिकेशन मान है।
- `placeholder` परामर्शात्मक है और नेटिव
  चयन समर्थन के बिना चैनल इसे अनदेखा कर सकते हैं।
- यदि कोई चैनल चयन का समर्थन नहीं करता है, तो फ़ॉलबैक टेक्स्ट लेबलों को सूचीबद्ध करता है।

चार्ट का अर्थ-विज्ञान:

- `pie` के लिए धनात्मक खंड मान आवश्यक हैं।
- `bar`, `area` और `line` एक क्रमबद्ध `categories` सरणी का उपयोग करते हैं। प्रत्येक शृंखला
  उसी क्रम में प्रत्येक श्रेणी के लिए ठीक एक परिमित मान प्रदान करती है।
- श्रेणी लेबल और शृंखला नाम अद्वितीय होने चाहिए। अमान्य या अपूर्ण चार्ट
  ब्लॉक डेटा को चुपचाप बदलने के बजाय नॉर्मलाइज़ेशन के दौरान हटा दिए जाते हैं।
- नेटिव चार्ट रेंडरिंग के लिए `presentationCapabilities.charts` के माध्यम से स्पष्ट सहमति आवश्यक है।
  अन्य चैनलों को चार्ट शीर्षक, अक्ष, श्रेणियाँ, शृंखलाएँ और मान
  नियतात्मक टेक्स्ट के रूप में मिलते हैं। यह अभिगम्यता फ़ॉलबैक भी है।

तालिका का अर्थ-विज्ञान:

- `caption` एक आवश्यक छोटा शीर्षक है। `headers` में कम-से-कम एक
  अद्वितीय, गैर-रिक्त स्तंभ लेबल होना चाहिए।
- `rows` में कम-से-कम एक पंक्ति होनी चाहिए। प्रत्येक पंक्ति में प्रत्येक
  हेडर के लिए ठीक एक सेल होना चाहिए और प्रत्येक सेल एक गैर-रिक्त स्ट्रिंग या परिमित संख्या होनी चाहिए।
- `rowHeaderColumnIndex` एक वैकल्पिक शून्य-आधारित इंडेक्स है, जो उस स्तंभ की पहचान करता है
  जिसके सेल नेटिव रेंडररों द्वारा पंक्ति हेडर के रूप में प्रस्तुत किए जाने चाहिए।
- तालिका नॉर्मलाइज़ेशन परमाण्विक है। कोई अमान्य कैप्शन, हेडर, पंक्ति की चौड़ाई, सेल
  या पंक्ति-हेडर इंडेक्स डेटा को काटने या सुधारने के बजाय तालिका ब्लॉक को
  हटा देता है।
- नेटिव तालिका रेंडरिंग के लिए `presentationCapabilities.tables` के माध्यम से स्पष्ट सहमति आवश्यक है।
  अन्य चैनलों को कैप्शन और प्रत्येक पंक्ति नियतात्मक रैखिक
  टेक्स्ट के रूप में मिलती है, जिसमें आंतरिक रिक्त स्थान संक्षिप्त किए जाते हैं:

  ```text
  खुली पाइपलाइन (तालिका)
  - खाता: Acme; चरण: जीता गया; ARR: 125000
  - खाता: Globex; चरण: समीक्षा; ARR: 82000
  ```

कोई अलग `report` विभेदक नहीं है। `title`,
`tone`, `text`, `context`, `chart`, `table` और कार्रवाई ब्लॉकों से रिपोर्ट बनाएँ। इससे प्रत्येक
ब्लॉक स्वतंत्र रूप से रेंडर करने योग्य रहता है और पूरी रिपोर्ट को वही
नियतात्मक टेक्स्ट फ़ॉलबैक मिलता है।

## उत्पादक उदाहरण

सरल कार्ड:

```json
{
  "title": "डिप्लॉयमेंट अनुमोदन",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "कैनरी अब प्रोमोट करने के लिए तैयार है।" },
    { "type": "context", "text": "बिल्ड 1234, स्टेजिंग सफल रही।" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "अनुमोदित करें",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "अस्वीकार करें",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

केवल-URL लिंक बटन:

```json
{
  "blocks": [
    { "type": "text", "text": "रिलीज़ नोट तैयार हैं।" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "नोट खोलें",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
    }
  ]
}
```

Telegram Mini App बटन:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "लॉन्च करें",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

चयन मेनू:

```json
{
  "title": "परिवेश चुनें",
  "blocks": [
    {
      "type": "select",
      "placeholder": "परिवेश",
      "options": [
        { "label": "कैनरी", "value": "env:canary" },
        { "label": "प्रोडक्शन", "value": "env:prod" }
      ]
    }
  ]
}
```

चार्ट:

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "त्रैमासिक राजस्व",
      "categories": ["Q1", "Q2", "Q3"],
      "series": [
        { "name": "उत्पाद", "values": [120, 145, 138] },
        { "name": "सेवाएँ", "values": [80, 95, 104] }
      ],
      "xLabel": "तिमाही",
      "yLabel": "राजस्व"
    }
  ]
}
```

तालिका रिपोर्ट:

```json
{
  "title": "पाइपलाइन रिपोर्ट",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "चरण के अनुसार वर्तमान अवसर।" },
    {
      "type": "table",
      "caption": "खुली पाइपलाइन",
      "headers": ["खाता", "चरण", "ARR"],
      "rows": [
        ["Acme", "जीता गया", 125000],
        ["Globex", "समीक्षा", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "CRM स्नैपशॉट से अपडेट किया गया।" }
  ]
}
```

CLI प्रेषण:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "डिप्लॉयमेंट अनुमोदन" \
  --presentation '{"title":"डिप्लॉयमेंट अनुमोदन","tone":"warning","blocks":[{"type":"text","text":"कैनरी तैयार है।"},{"type":"buttons","buttons":[{"label":"अनुमोदित करें","value":"deploy:approve","style":"success"},{"label":"अस्वीकार करें","value":"deploy:decline","style":"danger"}]}]}'
```

पिन की गई डिलीवरी:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "विषय खोला गया" \
  --pin
```

स्पष्ट JSON के साथ पिन की गई डिलीवरी:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## रेंडरर अनुबंध

चैनल Plugin अपने आउटबाउंड अडैप्टर पर रेंडर समर्थन घोषित करते हैं:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

क्षमता बूलियन बताते हैं कि रेंडरर किन चीज़ों को इंटरैक्टिव बना सकता है। वैकल्पिक
`limits` उस सामान्य एनवेलप का वर्णन करते हैं जिसे कोर रेंडरर को कॉल करने से पहले
अनुकूलित कर सकता है:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

कोर रेंडरिंग से पहले सिमेंटिक नियंत्रणों पर सामान्य सीमाएँ लागू करता है। रेंडरर
अब भी मूल ब्लॉक संख्या, कार्ड आकार, URL सीमाओं और उन प्रदाता-विशिष्ट विशिष्टताओं
के लिए अंतिम सत्यापन और क्लिपिंग के स्वामी हैं जिन्हें सामान्य अनुबंध में व्यक्त
नहीं किया जा सकता। यदि सीमाएँ किसी ब्लॉक से प्रत्येक नियंत्रण हटा देती हैं, तो कोर
लेबलों को गैर-इंटरैक्टिव संदर्भ टेक्स्ट के रूप में रखता है, ताकि डिलीवर किए गए संदेश
में फिर भी दृश्यमान फ़ॉलबैक रहे।

## कोर रेंडर प्रवाह

CLI और मानक संदेश क्रियाओं द्वारा उपयोग किए जाने वाले कैननिकल आउटबाउंड पथ पर, कोर:

1. प्रस्तुति पेलोड को सामान्यीकृत करता है।
2. लक्षित चैनल के आउटबाउंड अडैप्टर को रिज़ॉल्व करता है।
3. `presentationCapabilities` को पढ़ता है।
4. जब अडैप्टर उन्हें घोषित करता है, तब क्रिया संख्या, लेबल लंबाई और
   चयन विकल्प संख्या जैसी सामान्य क्षमता सीमाएँ लागू करता है। चार्ट और तालिका ब्लॉक
   क्रमशः तब तक नियतात्मक टेक्स्ट बन जाते हैं, जब तक अडैप्टर स्पष्ट रूप से
   `charts: true` या `tables: true` घोषित नहीं करता।
5. जब अडैप्टर पेलोड को रेंडर कर सकता है, तब `renderPresentation` को कॉल करता है।
6. अडैप्टर अनुपस्थित होने या रेंडर न कर पाने पर रूढ़िवादी टेक्स्ट पर फ़ॉलबैक करता है।
7. परिणामी पेलोड को सामान्य चैनल डिलीवरी पथ से भेजता है।
8. पहले संदेश के सफलतापूर्वक भेजे जाने के बाद `delivery.pin` जैसे
   डिलीवरी मेटाडेटा लागू करता है।

चैनल-स्थानीय उत्तर या पूर्वावलोकन फ़नल, जो सीधे `ReplyPayload` का उपभोग करते हैं,
उन्हें या तो उस कैननिकल पथ में प्रवेश करना चाहिए या पेलोड को सादे टेक्स्ट/मीडिया में
प्रक्षेपित करने से पहले समान प्रस्तुति फ़ॉलबैक को मूर्त रूप देना चाहिए।

कोर फ़ॉलबैक व्यवहार का स्वामी है, ताकि उत्पादक चैनल-अज्ञेय रह सकें। चैनल
Plugin मूल रेंडरिंग और इंटरैक्शन प्रबंधन के स्वामी हैं।

## अवक्रमण नियम

प्रस्तुति को सीमित चैनलों पर भेजना सुरक्षित होना चाहिए।

फ़ॉलबैक टेक्स्ट में शामिल हैं:

- `title` पहली पंक्ति के रूप में
- `text` ब्लॉक सामान्य अनुच्छेदों के रूप में
- `context` ब्लॉक संक्षिप्त संदर्भ पंक्तियों के रूप में
- `divider` ब्लॉक दृश्य विभाजक के रूप में
- बटन लेबल, लिंक बटनों के URL सहित
- चयन विकल्प लेबल
- चार्ट शीर्षक, प्रकार, अक्ष, श्रेणियाँ, शृंखलाएँ और मान
- तालिका कैप्शन, शीर्षलेख और प्रत्येक पंक्ति का मान

### बटन मान की फ़ॉलबैक दृश्यता

जब कोई चैनल इंटरैक्टिव नियंत्रणों को रेंडर नहीं कर सकता, तो बटन और चयन मान
सादे टेक्स्ट पर फ़ॉलबैक होते हैं। फ़ॉलबैक व्यवहार अपारदर्शी कॉलबैक डेटा को निजी
रखते हुए उपयोगिता बनाए रखता है:

- **`command`-प्रकार की क्रियाएँ** `` label: `command` `` के रूप में रेंडर होती हैं, ताकि उपयोगकर्ता
  कमांड कॉपी करके उसे चैनल इनपुट में मैन्युअल रूप से चला सकें।
- **`callback`-प्रकार की क्रियाएँ** और पुराने **`value`** फ़ील्ड केवल
  लेबल के रूप में रेंडर होते हैं। अपारदर्शी कॉलबैक मान फ़ॉलबैक टेक्स्ट में उजागर नहीं होता।
- **`approval`-प्रकार की क्रियाएँ** केवल लेबल के रूप में रेंडर होती हैं। अनुमोदन ID और निर्णय
  ट्रांसपोर्ट डेटा हैं और सामान्य स्केलर सहायकों या फ़ॉलबैक टेक्स्ट के माध्यम से
  उजागर नहीं किए जाते।
- **`url` क्रियाएँ**, URL-समर्थित **`web-app` क्रियाएँ**, और अप्रचलित **`url` /
  `webApp` / `web_app`** इनपुट बटन लेबल के साथ URL टेक्स्ट रेंडर करते हैं,
  क्योंकि URL उपयोगकर्ता-दृश्य है। केवल होस्ट किए गए विजेट की क्रियाएँ मूल विजेट
  लॉन्च के बिना चैनलों पर केवल लेबल के रूप में रेंडर होती हैं।
- **चयन विकल्प** केवल लेबल के रूप में रेंडर होते हैं। अंतर्निहित विकल्प मान
  फ़ॉलबैक टेक्स्ट में उजागर नहीं होता।

जो चैनल अडैप्टर अपने फ़ॉलबैक UI में मैन्युअल-कमांड मार्गदर्शन जोड़ते हैं (जैसे
Feishu दस्तावेज़-टिप्पणी निर्देश), उन्हें कमांड-उपस्थिति जाँच उन्हीं प्रस्तुति
ब्लॉकों से प्राप्त करनी चाहिए जिनका उपयोग फ़ॉलबैक रेंडरर करता है, ताकि मार्गदर्शन
टेक्स्ट केवल तभी दिखाई दे जब वास्तव में कोई मैन्युअल कमांड दिखाया गया हो।

असमर्थित मूल नियंत्रणों को पूरा प्रेषण विफल करने के बजाय अवक्रमित होना चाहिए।
उदाहरण:

- इनलाइन बटन अक्षम होने पर Telegram टेक्स्ट फ़ॉलबैक भेजता है।
- चयन समर्थन के बिना चैनल चयन विकल्पों को टेक्स्ट के रूप में सूचीबद्ध करता है।
- मूल चार्ट समर्थन के बिना चैनल चार्ट डेटा को टेक्स्ट के रूप में सूचीबद्ध करता है।
- मूल तालिका समर्थन के बिना चैनल प्रत्येक तालिका पंक्ति को टेक्स्ट के रूप में सूचीबद्ध करता है।
- केवल-URL बटन या तो मूल लिंक बटन या फ़ॉलबैक URL पंक्ति बन जाता है।
- वैकल्पिक पिन विफलताएँ डिलीवर किए गए संदेश को विफल नहीं करतीं।

मुख्य अपवाद `delivery.pin.required: true` है; यदि पिन करना
अनिवार्य रूप से अनुरोध किया गया है और चैनल भेजे गए संदेश को पिन नहीं कर सकता, तो डिलीवरी विफलता की रिपोर्ट करती है।

## प्रदाता मैपिंग

वर्तमान बंडल किए गए रेंडरर:

| चैनल          | मूल रेंडर लक्ष्य                           | टिप्पणियाँ                                                                                                                                                                                                            |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | कॉम्पोनेंट और कॉम्पोनेंट कंटेनर             | मौजूदा प्रदाता-मूल पेलोड उत्पादकों के लिए पुराने `channelData.discord.components` को संरक्षित करता है, लेकिन नए साझा प्रेषणों को `presentation` का उपयोग करना चाहिए।                                                                 |
| Feishu          | इंटरैक्टिव कार्ड                           | कार्ड शीर्षलेख `title` का उपयोग कर सकता है; मुख्य भाग उस शीर्षक की पुनरावृत्ति से बचता है।                                                                                                                                                  |
| Matrix          | टेक्स्ट फ़ॉलबैक और संरचित इवेंट फ़ील्ड     | बटन/चयन समर्थित के रूप में घोषित होते हैं, लेकिन वर्तमान में प्रत्येक ब्लॉक मूल इंटरैक्टिव विजेट के बजाय `com.openclaw.presentation` इवेंट फ़ील्ड में ले जाए गए `renderMessagePresentationFallbackText` आउटपुट के रूप में रेंडर होता है। |
| Mattermost      | टेक्स्ट और इंटरैक्टिव प्रॉप्स               | चयन और विभाजक समर्थित नहीं हैं; वे ब्लॉक टेक्स्ट में अवक्रमित होते हैं।                                                                                                                                             |
| Microsoft Teams | Adaptive Cards                            | दोनों उपलब्ध होने पर कार्ड के साथ सादा `message` टेक्स्ट शामिल किया जाता है। चयन, शैलियाँ और अक्षम अवस्था समर्थित नहीं हैं।                                                                                     |
| Slack           | Block Kit                                 | `chart` को मूल `data_visualization` और `table` को मूल `data_table` के रूप में रेंडर करता है; पुराने `channelData.slack.blocks` को संरक्षित करता है, लेकिन नए साझा प्रेषणों को `presentation` का उपयोग करना चाहिए।                                   |
| Telegram        | टेक्स्ट और इनलाइन कीबोर्ड                   | बटन/चयन को लक्षित सतह के लिए इनलाइन बटन क्षमता की आवश्यकता होती है; अन्यथा टेक्स्ट फ़ॉलबैक का उपयोग किया जाता है।                                                                                                         |
| साधारण चैनल     | टेक्स्ट फ़ॉलबैक                            | रेंडरर के बिना चैनलों को भी पठनीय आउटपुट मिलता है।                                                                                                                                                            |

प्रदाता-मूल पेलोड संगतता मौजूदा उत्तर उत्पादकों के लिए संक्रमणकालीन सुविधा है।
यह नए साझा मूल फ़ील्ड जोड़ने का कारण नहीं है।

## प्रस्तुति बनाम InteractiveReply

`InteractiveReply` अनुमोदन और इंटरैक्शन सहायकों द्वारा उपयोग किया जाने वाला पुराना आंतरिक उपसमुच्चय है।
यह समर्थन करता है:

- टेक्स्ट
- बटन
- चयन

`MessagePresentation` कैननिकल साझा प्रेषण अनुबंध है। यह जोड़ता है:

- शीर्षक
- स्वर
- संदर्भ
- विभाजक
- चार्ट
- तालिका
- केवल-URL बटन
- `ReplyPayload.delivery` के माध्यम से सामान्य डिलीवरी मेटाडेटा

पुराने कोड को जोड़ते समय `openclaw/plugin-sdk/interactive-runtime` के सहायकों का उपयोग करें:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  hasMessagePresentationBlocks,
  interactiveReplyToPresentation,
  isMessagePresentationInteractiveBlock,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationChartFallbackText,
  renderMessagePresentationFallbackText,
  renderMessagePresentationTableFallbackText,
  resolveMessagePresentationActionValue,
  resolveMessagePresentationButtonAction,
  resolveMessagePresentationControlValue,
  resolveMessagePresentationOptionAction,
} from "openclaw/plugin-sdk/interactive-runtime";
```

नए कोड को सीधे `MessagePresentation` स्वीकार या उत्पादित करना चाहिए। मौजूदा
`interactive` पेलोड `presentation` का अप्रचलित उपसमुच्चय हैं; पुराने
उत्पादकों के लिए रनटाइम समर्थन बना हुआ है।

जानने योग्य गैर-अप्रचलित सहायक:

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  किसी प्रकार-रहित पेलोड (उदाहरण के लिए, CLI के
  `--presentation` फ़्लैग से प्राप्त JSON) को सत्यापित करके `MessagePresentation` में रूपांतरित करें।
- `isMessagePresentationInteractiveBlock(block)` किसी ब्लॉक को
  `buttons` | `select` यूनियन तक सीमित करता है।
- `resolveMessagePresentationButtonAction(button)` और
  `resolveMessagePresentationOptionAction(option)` अप्रचलित सीमा फ़ील्ड स्वीकार करते हुए प्रामाणिक टाइप की गई
  कार्रवाई लौटाते हैं। स्पष्ट `action` को हमेशा प्राथमिकता मिलती है।
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` केवल कमांड/कॉलबैक
  स्केलर मान पढ़ते हैं। कोई गैर-स्केलर प्रामाणिक कार्रवाई कभी भी लीगेसी शैडो
  `value` पर नहीं जाती, इसलिए अनुमोदन ID और लिंक लक्ष्य टाइप किए हुए रहते हैं।
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` चैनल-विशिष्ट फ़ॉलबैक पथों के लिए एक संरचित
  डेटा ब्लॉक को नियतात्मक टेक्स्ट के रूप में रेंडर करते हैं।

लीगेसी `InteractiveReply*` प्रकार और रूपांतरण हेल्पर SDK में
`@deprecated` के रूप में चिह्नित हैं:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock`, और
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` और
`presentationToInteractiveControlsReply(...)` लीगेसी चैनल कार्यान्वयनों के लिए रेंडरर
ब्रिज के रूप में उपलब्ध रहते हैं। नए प्रोड्यूसर कोड को उन्हें कॉल नहीं करना चाहिए;
`presentation` भेजें और कोर/चैनल अनुकूलन को रेंडरिंग संभालने दें।

अनुमोदन हेल्पर के लिए भी प्रस्तुति-प्रथम प्रतिस्थापन उपलब्ध हैं:

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` के बजाय
  `buildApprovalPresentationFromActionDescriptors(...)` का उपयोग करें
- `buildApprovalInteractiveReply(...)` के बजाय
  `buildApprovalPresentation(...)` का उपयोग करें
- `buildExecApprovalInteractiveReply(...)` के बजाय
  `buildExecApprovalPresentation(...)` का उपयोग करें

वे जारी किए गए बिल्डर Plugin संगतता के लिए कमांड-समर्थित बने रहते हैं। स्थायी अनुमोदन प्रकार का स्वामित्व रखने वाले Gateway
और बंडल किए गए चैनल कोड को
`buildTypedApprovalPresentation(...)`,
`buildTypedExecApprovalPendingReplyPayload(...)`, या
`buildTypedPluginApprovalPendingReplyPayload(...)` का उपयोग करना चाहिए, ताकि ट्रांसपोर्ट को `/approve` टेक्स्ट से अर्थ का अनुमान लगाने के बजाय
स्पष्ट `approval` कार्रवाई मिले।

`renderMessagePresentationFallbackText(...)` उन प्रस्तुति ब्लॉक के लिए
रिक्त स्ट्रिंग लौटाता है जिनमें कोई टेक्स्ट फ़ॉलबैक नहीं है, जैसे केवल-विभाजक
प्रस्तुति। जिन ट्रांसपोर्ट को गैर-रिक्त प्रेषण बॉडी की आवश्यकता होती है, वे डिफ़ॉल्ट फ़ॉलबैक
अनुबंध बदले बिना न्यूनतम बॉडी चुनने के लिए `emptyFallback` पास कर सकते हैं।

## डिलीवरी पिन

पिन करना डिलीवरी व्यवहार है, प्रस्तुति नहीं। `channelData.telegram.pin` जैसे
प्रदाता-मूल फ़ील्ड के बजाय `delivery.pin` का उपयोग करें।

अर्थ-विज्ञान:

- `pin: true` सफलतापूर्वक डिलीवर किए गए पहले संदेश को पिन करता है।
- `pin.notify` का डिफ़ॉल्ट `false` है।
- `pin.required` का डिफ़ॉल्ट `false` है।
- वैकल्पिक पिन विफलताओं में कार्यक्षमता घट जाती है और भेजा गया संदेश यथावत रहता है।
- आवश्यक पिन विफलताओं से डिलीवरी विफल हो जाती है।
- खंडित संदेश अंतिम खंड के बजाय पहले डिलीवर किए गए खंड को पिन करते हैं।

मौजूदा संदेशों के लिए मैन्युअल `pin`, `unpin`, और `pins` संदेश कार्रवाइयाँ अभी भी उपलब्ध हैं,
जहाँ प्रदाता उन संक्रियाओं का समर्थन करता है।

## Plugin लेखक की जाँच-सूची

- जब चैनल अर्थपूर्ण प्रस्तुति को रेंडर कर सके या सुरक्षित रूप से उसकी कार्यक्षमता घटा सके, तब `describeMessageTool(...)` से `presentation` घोषित करें।
- रनटाइम आउटबाउंड अडैप्टर में `presentationCapabilities` जोड़ें।
- रनटाइम कोड में `renderPresentation` लागू करें, कंट्रोल-प्लेन Plugin
  सेटअप कोड में नहीं।
- मूल UI लाइब्रेरी को हॉट सेटअप/कैटलॉग पथों से बाहर रखें।
- ज्ञात होने पर `presentationCapabilities.limits` पर
  सामान्य क्षमता सीमाएँ घोषित करें।
- रेंडरर और परीक्षणों में अंतिम प्लेटफ़ॉर्म सीमाएँ बनाए रखें।
- असमर्थित चार्ट, तालिकाओं, बटन, चयन नियंत्रण, URL
  बटन, शीर्षक/टेक्स्ट दोहराव, और मिश्रित `message` तथा `presentation`
  प्रेषणों के लिए फ़ॉलबैक परीक्षण जोड़ें।
- केवल तभी `deliveryCapabilities.pin` और
  `pinDeliveredMessage` के माध्यम से डिलीवरी पिन समर्थन जोड़ें, जब प्रदाता भेजे गए संदेश की ID पिन कर सकता हो।
- साझा संदेश कार्रवाई स्कीमा के माध्यम से नए प्रदाता-मूल कार्ड/ब्लॉक/कंपोनेंट/बटन फ़ील्ड
  उजागर न करें।

## संबंधित दस्तावेज़

- [संदेश CLI](/hi/cli/message)
- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin आर्किटेक्चर](/hi/plugins/architecture-internals#message-tool-schemas)
- [चैनल प्रस्तुति रीफ़ैक्टर योजना](/hi/plan/ui-channels)
