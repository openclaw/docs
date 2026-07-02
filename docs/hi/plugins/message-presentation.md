---
read_when:
    - संदेश कार्ड, बटन या चयन रेंडरिंग जोड़ना या संशोधित करना
    - समृद्ध आउटबाउंड संदेशों का समर्थन करने वाला चैनल Plugin बनाना
    - संदेश टूल प्रस्तुति या डिलीवरी क्षमताएँ बदलना
    - प्रदाता-विशिष्ट कार्ड/ब्लॉक/घटक रेंडरिंग रिग्रेशन को डीबग करना
summary: चैनल Plugin के लिए सिमेंटिक संदेश कार्ड, बटन, चयन, फ़ॉलबैक टेक्स्ट और डिलीवरी संकेत
title: संदेश प्रस्तुति
x-i18n:
    generated_at: "2026-07-02T22:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

संदेश प्रस्तुति समृद्ध आउटबाउंड चैट UI के लिए OpenClaw का साझा अनुबंध है।
यह एजेंटों, CLI कमांड, अनुमोदन प्रवाहों, और plugins को संदेश का
इरादा एक बार बताने देता है, जबकि प्रत्येक channel plugin अपनी क्षमता के अनुसार सबसे अच्छा मूल रूप रेंडर करता है।

पोर्टेबल संदेश UI के लिए presentation का उपयोग करें:

- टेक्स्ट सेक्शन
- छोटा context/footer टेक्स्ट
- विभाजक
- बटन
- चयन मेनू
- कार्ड शीर्षक और टोन

साझा
message tool में Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card`, या Feishu `card` जैसे नए provider-native फ़ील्ड न जोड़ें। ये channel plugin के स्वामित्व वाले renderer outputs हैं।

## अनुबंध

Plugin लेखक public contract यहां से import करते हैं:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

आकार:

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
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
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

बटन semantics:

- `action.type: "command"` core के command
  path के माध्यम से native slash command चलाता है। इसे built-in command buttons और menus के लिए उपयोग करें।
- `action.type: "callback"` channel के
  interaction path के माध्यम से opaque plugin data ले जाता है। Channel plugins को callback data को slash
  commands के रूप में फिर से व्याख्यायित नहीं करना चाहिए।
- `value` legacy opaque callback value है। नए controls को `action`
  का उपयोग करना चाहिए ताकि channel plugins text से अनुमान लगाए बिना commands और callbacks को map कर सकें।
- `url` एक link button है। यह `value` के बिना मौजूद हो सकता है।
- `webApp` channel-native web app button का वर्णन करता है। Telegram इसे
  `web_app` के रूप में render करता है और इसे केवल private chats में support करता है। `web_app` compatibility के लिए loose JSON payloads में अब भी
  accepted है, लेकिन TypeScript producers को `webApp` का उपयोग करना चाहिए।
- `label` required है और text fallback में भी उपयोग होता है।
- `style` advisory है। Renderers को unsupported styles को safe
  default में map करना चाहिए, send को fail नहीं करना चाहिए।
- `priority` optional है। जब कोई channel action limits advertise करता है और controls
  drop करने पड़ते हैं, core higher-priority buttons को पहले रखता है और समान priority buttons के बीच
  original order सुरक्षित रखता है। जब सभी controls fit होते हैं, authored
  order सुरक्षित रहता है।
- `disabled` optional है। Channels को `supportsDisabled` के साथ opt in करना होगा; अन्यथा
  core disabled control को non-interactive fallback text में degrade करता है।
- `reusable` optional है। वे channels जो reusable native callbacks support करते हैं,
  successful interaction के बाद action को available रख सकते हैं। इसे
  refresh, inspect, या more details जैसी repeatable या idempotent actions के लिए उपयोग करें;
  normal one-shot approvals और destructive actions के लिए इसे unset छोड़ें।

Select semantics:

- `options[].action` का वही command/callback अर्थ है जो button `action` का है।
- `options[].value` legacy selected application value है।
- `placeholder` advisory है और native
  select support के बिना channels द्वारा ignore किया जा सकता है।
- यदि कोई channel selects support नहीं करता, fallback text labels को list करता है।

## Producer examples

सरल कार्ड:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

केवल-URL link button:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Telegram Mini App button:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Select menu:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI send:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Pinned delivery:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

स्पष्ट JSON के साथ pinned delivery:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer contract

Channel plugins अपने outbound adapter पर render support declare करते हैं:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
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

Capability booleans बताते हैं कि renderer क्या interactive बना सकता है। Optional
`limits` generic envelope का वर्णन करते हैं जिसे core
renderer को call करने से पहले adapt कर सकता है:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
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

Core rendering से पहले semantic controls पर generic limits लागू करता है। Renderers
अब भी native block
count, card size, URL limits, और generic contract में व्यक्त न किए जा सकने वाले provider quirks के लिए अंतिम provider-specific validation और clipping के owner हैं। यदि limits किसी block से हर control हटा दें, तो core
labels को non-interactive context text के रूप में रखता है ताकि delivered message में अब भी
visible fallback हो।

## Core render flow

जब किसी `ReplyPayload` या message action में `presentation` शामिल होता है, core:

1. presentation payload को normalize करता है।
2. target channel के outbound adapter को resolve करता है।
3. `presentationCapabilities` पढ़ता है।
4. जब adapter उन्हें advertise करता है, तो action count, label length, और
   select option count जैसी generic capability limits लागू करता है।
5. जब adapter payload render कर सकता है, तो `renderPresentation` call करता है।
6. adapter absent होने या render न कर सकने पर conservative text पर fallback करता है।
7. resulting payload को normal channel delivery path के माध्यम से भेजता है।
8. पहले successful
   sent message के बाद `delivery.pin` जैसे delivery metadata लागू करता है।

Core fallback behavior own करता है ताकि producers channel-agnostic रह सकें। Channel
plugins native rendering और interaction handling own करते हैं।

## Degradation rules

Presentation limited channels पर send करने के लिए safe होनी चाहिए।

Fallback text में शामिल है:

- पहली line के रूप में `title`
- normal paragraphs के रूप में `text` blocks
- compact context lines के रूप में `context` blocks
- visual separator के रूप में `divider` blocks
- link buttons के लिए URLs सहित button labels
- select option labels

### Button value fallback visibility

जब कोई channel interactive controls render नहीं कर सकता, button और select values
plain text पर fallback करते हैं। fallback behavior usability सुरक्षित रखता है जबकि
opaque callback data private रखता है:

- **`command`-typed actions** `label: \`command\`` के रूप में render होते हैं ताकि users
  command copy करके channel input में manually run कर सकें।
- **`callback`-typed actions** और legacy **`value`** fields
  label-only के रूप में render होते हैं। opaque callback value fallback text में exposed नहीं होती।
- **`url` / `webApp`** buttons button
  label के साथ URL text render करते हैं, क्योंकि URL user-facing है।
- **Select options** label-only के रूप में render होते हैं। underlying option value
  fallback text में exposed नहीं होती।

Channel adapters जो अपने fallback UI में manual-command guidance जोड़ते हैं (उदा.
Feishu document-comment instructions) उन्हें command-present check उसी presentation blocks
से derive करना चाहिए जिन्हें fallback renderer उपयोग करता है, ताकि
guidance text केवल तब दिखाई दे जब manual command वास्तव में दिखाई गई हो।

Unsupported native controls को पूरे send को fail करने के बजाय degrade करना चाहिए।
उदाहरण:

- inline buttons disabled होने पर Telegram text fallback भेजता है।
- select support के बिना channel select options को text के रूप में list करता है।
- URL-only button या तो native link button बनता है या fallback URL line।
- Optional pin failures delivered message को fail नहीं करते।

मुख्य exception `delivery.pin.required: true` है; यदि pinning required के रूप में requested है
और channel sent message को pin नहीं कर सकता, तो delivery failure report करती है।

## Provider mapping

वर्तमान bundled renderers:

| चैनल         | नेटिव रेंडर लक्ष्य                | नोट्स                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | घटक और घटक कंटेनर | मौजूदा प्रदाता-नेटिव पेलोड उत्पादकों के लिए पुराने `channelData.discord.components` को सुरक्षित रखता है, लेकिन नए साझा भेजावों को `presentation` का उपयोग करना चाहिए। |
| Slack           | Block Kit                           | मौजूदा प्रदाता-नेटिव पेलोड उत्पादकों के लिए पुराने `channelData.slack.blocks` को सुरक्षित रखता है, लेकिन नए साझा भेजावों को `presentation` का उपयोग करना चाहिए।       |
| Telegram        | टेक्स्ट और इनलाइन कीबोर्ड          | बटन/चयन के लिए लक्ष्य सतह पर इनलाइन बटन क्षमता चाहिए; अन्यथा टेक्स्ट फ़ॉलबैक उपयोग किया जाता है।                                         |
| Mattermost      | टेक्स्ट और इंटरैक्टिव प्रॉप्स         | अन्य ब्लॉक टेक्स्ट में घट जाते हैं।                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | जब दोनों दिए जाते हैं, तो सादा `message` टेक्स्ट कार्ड के साथ शामिल किया जाता है।                                                                            |
| Feishu          | इंटरैक्टिव कार्ड                   | कार्ड हेडर `title` का उपयोग कर सकता है; बॉडी उस शीर्षक की पुनरावृत्ति से बचती है।                                                                                  |
| सादे चैनल  | टेक्स्ट फ़ॉलबैक                       | बिना रेंडरर वाले चैनलों को भी पढ़ने योग्य आउटपुट मिलता है।                                                                                            |

प्रदाता-नेटिव पेलोड संगतता मौजूदा जवाब उत्पादकों के लिए एक संक्रमण सुविधा है।
यह नए साझा नेटिव फ़ील्ड जोड़ने का कारण नहीं है।

## प्रस्तुति बनाम InteractiveReply

`InteractiveReply` स्वीकृति और इंटरैक्शन हेल्परों द्वारा उपयोग किया जाने वाला पुराना आंतरिक उपसमूह है।
यह समर्थन करता है:

- टेक्स्ट
- बटन
- चयन

`MessagePresentation` कैननिकल साझा भेजाव अनुबंध है। यह जोड़ता है:

- शीर्षक
- टोन
- संदर्भ
- विभाजक
- केवल-URL बटन
- `ReplyPayload.delivery` के माध्यम से सामान्य डिलीवरी मेटाडेटा

पुराने कोड को ब्रिज करते समय `openclaw/plugin-sdk/interactive-runtime` से हेल्पर उपयोग करें:
__OC_I18N_900011__
नए कोड को सीधे `MessagePresentation` स्वीकार या उत्पन्न करना चाहिए। मौजूदा
`interactive` पेलोड `presentation` का अप्रचलित उपसमूह हैं; पुराने उत्पादकों के लिए रनटाइम
समर्थन बना रहता है।

पुराने `InteractiveReply*` प्रकार और रूपांतरण हेल्पर SDK में
`@deprecated` चिह्नित हैं:

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
`presentationToInteractiveControlsReply(...)` पुराने चैनल कार्यान्वयनों के लिए रेंडरर
ब्रिज के रूप में उपलब्ध रहते हैं। नए उत्पादक कोड को उन्हें कॉल नहीं करना चाहिए;
`presentation` भेजें और कोर/चैनल अनुकूलन को रेंडरिंग संभालने दें।

स्वीकृति हेल्परों के लिए भी प्रस्तुति-प्रथम प्रतिस्थापन हैं:

- `buildApprovalInteractiveReplyFromActionDescriptors(...)` के बजाय `buildApprovalPresentationFromActionDescriptors(...)` का उपयोग करें
- `buildApprovalInteractiveReply(...)` के बजाय `buildApprovalPresentation(...)` का उपयोग करें
- `buildExecApprovalInteractiveReply(...)` के बजाय `buildExecApprovalPresentation(...)` का उपयोग करें

`renderMessagePresentationFallbackText(...)` उन प्रस्तुति ब्लॉकों के लिए खाली स्ट्रिंग लौटाता है
जिनका कोई टेक्स्ट फ़ॉलबैक नहीं है, जैसे केवल-विभाजक
प्रस्तुति। जिन ट्रांसपोर्ट को गैर-खाली भेजाव बॉडी चाहिए वे डिफ़ॉल्ट फ़ॉलबैक
अनुबंध बदले बिना न्यूनतम बॉडी चुनने के लिए `emptyFallback` पास कर सकते हैं।

## डिलीवरी पिन

पिन करना डिलीवरी व्यवहार है, प्रस्तुति नहीं। `channelData.telegram.pin` जैसे
प्रदाता-नेटिव फ़ील्ड के बजाय `delivery.pin` का उपयोग करें।

अर्थ:

- `pin: true` पहले सफलतापूर्वक डिलीवर हुए संदेश को पिन करता है।
- `pin.notify` का डिफ़ॉल्ट `false` है।
- `pin.required` का डिफ़ॉल्ट `false` है।
- वैकल्पिक पिन विफलताएं घट जाती हैं और भेजे गए संदेश को जस का तस छोड़ती हैं।
- आवश्यक पिन विफलताएं डिलीवरी को विफल करती हैं।
- खंडित संदेश पहले डिलीवर हुए खंड को पिन करते हैं, अंतिम खंड को नहीं।

मैन्युअल `pin`, `unpin`, और `pins` संदेश कार्रवाइयां मौजूदा
संदेशों के लिए अब भी मौजूद हैं, जहां प्रदाता उन ऑपरेशनों का समर्थन करता है।

## Plugin लेखक चेकलिस्ट

- जब चैनल सेमांटिक प्रस्तुति को रेंडर या सुरक्षित रूप से घटा सकता हो, तो `describeMessageTool(...)` से `presentation` घोषित करें।
- रनटाइम आउटबाउंड अडैप्टर में `presentationCapabilities` जोड़ें।
- रनटाइम कोड में `renderPresentation` लागू करें, कंट्रोल-प्लेन Plugin
  सेटअप कोड में नहीं।
- नेटिव UI लाइब्रेरियों को हॉट सेटअप/कैटलॉग पथों से बाहर रखें।
- ज्ञात होने पर `presentationCapabilities.limits` पर सामान्य क्षमता सीमाएं घोषित करें।
- रेंडरर और परीक्षणों में अंतिम प्लेटफ़ॉर्म सीमाएं सुरक्षित रखें।
- असमर्थित बटनों, चयनों, URL बटनों, शीर्षक/टेक्स्ट
  पुनरावृत्ति, और मिश्रित `message` तथा `presentation` भेजावों के लिए फ़ॉलबैक परीक्षण जोड़ें।
- `deliveryCapabilities.pin` और
  `pinDeliveredMessage` के माध्यम से डिलीवरी पिन समर्थन केवल तब जोड़ें जब प्रदाता भेजे गए संदेश id को पिन कर सकता हो।
- साझा संदेश कार्रवाई स्कीमा के माध्यम से नए प्रदाता-नेटिव कार्ड/ब्लॉक/घटक/बटन फ़ील्ड उजागर न करें।

## संबंधित दस्तावेज़

- [Message CLI](/hi/cli/message)
- [Plugin SDK अवलोकन](/hi/plugins/sdk-overview)
- [Plugin आर्किटेक्चर](/hi/plugins/architecture-internals#message-tool-schemas)
- [चैनल प्रस्तुति रिफ़ैक्टर योजना](/hi/plan/ui-channels)
