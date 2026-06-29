---
read_when:
    - चैनल संदेश UI, इंटरैक्टिव पेलोड, या नेटिव चैनल रेंडरर की रिफैक्टरिंग
    - संदेश टूल क्षमताएँ, डिलीवरी संकेत, या क्रॉस-कॉन्टेक्स्ट मार्कर बदलना
    - Discord Carbon इम्पोर्ट फैनआउट या चैनल Plugin रनटाइम लेज़ीनेस की डीबगिंग
summary: अर्थगत संदेश प्रस्तुति को चैनल के मूल UI रेंडरर से अलग करें।
title: चैनल प्रस्तुति रीफैक्टर योजना
x-i18n:
    generated_at: "2026-06-28T23:26:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## स्थिति

साझा एजेंट, CLI, Plugin क्षमता, और आउटबाउंड डिलीवरी सतहों के लिए लागू किया गया:

- `ReplyPayload.presentation` अर्थपूर्ण संदेश UI रखता है।
- `ReplyPayload.delivery.pin` भेजे गए संदेश को पिन करने के अनुरोध रखता है।
- साझा संदेश क्रियाएं प्रदाता-नेटिव `components`, `blocks`, `buttons`, या `card` के बजाय `presentation`, `delivery`, और `pin` उजागर करती हैं।
- कोर Plugin-घोषित आउटबाउंड क्षमताओं के माध्यम से प्रस्तुति को रेंडर या अपने आप डीग्रेड करता है।
- Discord, Slack, Telegram, Mattermost, MS Teams, और Feishu रेंडरर सामान्य अनुबंध का उपयोग करते हैं।
- Discord चैनल कंट्रोल-प्लेन कोड अब Carbon-आधारित UI कंटेनर आयात नहीं करता।

कैनोनिकल दस्तावेज़ अब [संदेश प्रस्तुति](/hi/plugins/message-presentation) में रहते हैं।
इस योजना को ऐतिहासिक कार्यान्वयन संदर्भ के रूप में रखें; अनुबंध, रेंडरर,
या फॉलबैक व्यवहार में बदलावों के लिए कैनोनिकल गाइड अपडेट करें।

## समस्या

चैनल UI अभी कई असंगत सतहों में बंटा हुआ है:

- कोर `buildCrossContextComponents` के माध्यम से Discord-आकार वाला क्रॉस-कॉन्टेक्स्ट रेंडरर हुक रखता है।
- Discord `channel.ts` `DiscordUiContainer` के माध्यम से नेटिव Carbon UI आयात कर सकता है, जो रनटाइम UI निर्भरताओं को चैनल Plugin कंट्रोल प्लेन में खींचता है।
- एजेंट और CLI Discord `components`, Slack `blocks`, Telegram या Mattermost `buttons`, और Teams या Feishu `card` जैसे नेटिव पेलोड एस्केप हैच उजागर करते हैं।
- `ReplyPayload.channelData` ट्रांसपोर्ट संकेत और नेटिव UI एनवेलप दोनों रखता है।
- सामान्य `interactive` मॉडल मौजूद है, लेकिन यह Discord, Slack, Teams, Feishu, LINE, Telegram, और Mattermost द्वारा पहले से उपयोग किए जा रहे समृद्ध लेआउट से संकरा है।

इससे कोर नेटिव UI आकारों से अवगत हो जाता है, Plugin रनटाइम लेज़ीनेस कमजोर होती है, और एजेंटों को उसी संदेश इरादे को व्यक्त करने के लिए बहुत अधिक प्रदाता-विशिष्ट तरीके मिलते हैं।

## लक्ष्य

- कोर घोषित क्षमताओं से किसी संदेश के लिए सर्वोत्तम अर्थपूर्ण प्रस्तुति तय करता है।
- एक्सटेंशन क्षमताएं घोषित करते हैं और अर्थपूर्ण प्रस्तुति को नेटिव ट्रांसपोर्ट पेलोड में रेंडर करते हैं।
- वेब कंट्रोल UI चैट नेटिव UI से अलग रहता है।
- साझा एजेंट या CLI संदेश सतह के माध्यम से नेटिव चैनल पेलोड उजागर नहीं किए जाते।
- असमर्थित प्रस्तुति सुविधाएं अपने आप सर्वोत्तम टेक्स्ट प्रतिनिधित्व में डीग्रेड होती हैं।
- भेजे गए संदेश को पिन करने जैसा डिलीवरी व्यवहार सामान्य डिलीवरी मेटाडेटा है, प्रस्तुति नहीं।

## गैर-लक्ष्य

- `buildCrossContextComponents` के लिए कोई पिछड़ा-संगतता शिम नहीं।
- `components`, `blocks`, `buttons`, या `card` के लिए कोई सार्वजनिक नेटिव एस्केप हैच नहीं।
- चैनल-नेटिव UI लाइब्रेरी का कोई कोर आयात नहीं।
- बंडल किए गए चैनलों के लिए कोई प्रदाता-विशिष्ट SDK सीम नहीं।

## लक्ष्य मॉडल

`ReplyPayload` में कोर-स्वामित्व वाला `presentation` फ़ील्ड जोड़ें।

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

माइग्रेशन के दौरान `interactive`, `presentation` का उपसमुच्चय बन जाता है:

- `interactive` टेक्स्ट ब्लॉक `presentation.blocks[].type = "text"` पर मैप होता है।
- `interactive` बटन ब्लॉक `presentation.blocks[].type = "buttons"` पर मैप होता है।
- `interactive` सेलेक्ट ब्लॉक `presentation.blocks[].type = "select"` पर मैप होता है।

बाहरी एजेंट और CLI स्कीमा अब `presentation` का उपयोग करते हैं; `interactive` मौजूदा रिप्लाई उत्पादकों के लिए एक आंतरिक लेगेसी पार्सर/रेंडरिंग हेल्पर बना रहता है।
सार्वजनिक उत्पादक-मुखी API `interactive` को अप्रचलित मानता है। रनटाइम
समर्थन बना रहता है ताकि मौजूदा अनुमोदन हेल्पर और पुराने plugins काम करते
रहें, जबकि नया कोड `presentation` उत्सर्जित करे।

## डिलीवरी मेटाडेटा

भेजने के ऐसे व्यवहार के लिए कोर-स्वामित्व वाला `delivery` फ़ील्ड जोड़ें जो UI नहीं है।

```ts
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

अर्थ:

- `delivery.pin = true` का अर्थ है पहले सफलतापूर्वक डिलीवर किए गए संदेश को पिन करना।
- `notify` डिफ़ॉल्ट रूप से `false` होता है।
- `required` डिफ़ॉल्ट रूप से `false` होता है; असमर्थित चैनल या असफल पिनिंग डिलीवरी जारी रखते हुए अपने आप डीग्रेड होते हैं।
- मौजूदा संदेशों के लिए मैनुअल `pin`, `unpin`, और `list-pins` संदेश क्रियाएं बनी रहती हैं।

वर्तमान Telegram ACP टॉपिक बाइंडिंग को `channelData.telegram.pin = true` से `delivery.pin = true` पर जाना चाहिए।

## रनटाइम क्षमता अनुबंध

प्रस्तुति और डिलीवरी रेंडर हुक रनटाइम आउटबाउंड अडैप्टर में जोड़ें, कंट्रोल-प्लेन चैनल Plugin में नहीं।

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

कोर व्यवहार:

- लक्ष्य चैनल और रनटाइम अडैप्टर रिज़ॉल्व करें।
- प्रस्तुति क्षमताओं के लिए पूछें।
- असमर्थित ब्लॉक डीग्रेड करें और रेंडरिंग से पहले सामान्य क्षमता सीमाएं
  लागू करें।
- `renderPresentation` कॉल करें।
- यदि कोई रेंडरर मौजूद नहीं है, तो प्रस्तुति को टेक्स्ट फॉलबैक में बदलें।
- सफल भेजने के बाद, जब `delivery.pin` अनुरोध किया गया हो और समर्थित हो, तो `pinDeliveredMessage` कॉल करें।

## चैनल मैपिंग

Discord:

- रनटाइम-केवल मॉड्यूल में `presentation` को components v2 और Carbon कंटेनर में रेंडर करें।
- हल्के मॉड्यूल में एक्सेंट रंग हेल्पर रखें।
- चैनल Plugin कंट्रोल-प्लेन कोड से `DiscordUiContainer` आयात हटाएं।

Slack:

- `presentation` को Block Kit में रेंडर करें।
- एजेंट और CLI `blocks` इनपुट हटाएं।

Telegram:

- टेक्स्ट, कॉन्टेक्स्ट, और डिवाइडर को टेक्स्ट के रूप में रेंडर करें।
- लक्ष्य सतह के लिए कॉन्फ़िगर और अनुमत होने पर क्रियाओं और सेलेक्ट को inline keyboards के रूप में रेंडर करें।
- inline buttons अक्षम होने पर टेक्स्ट फॉलबैक का उपयोग करें।
- ACP टॉपिक पिनिंग को `delivery.pin` पर ले जाएं।

Mattermost:

- जहां कॉन्फ़िगर किया गया हो, क्रियाओं को इंटरैक्टिव बटन के रूप में रेंडर करें।
- अन्य ब्लॉक को टेक्स्ट फॉलबैक के रूप में रेंडर करें।

MS Teams:

- `presentation` को Adaptive Cards में रेंडर करें।
- मैनुअल pin/unpin/list-pins क्रियाएं रखें।
- यदि लक्ष्य बातचीत के लिए Graph समर्थन भरोसेमंद हो, तो वैकल्पिक रूप से `pinDeliveredMessage` लागू करें।

Feishu:

- `presentation` को इंटरैक्टिव कार्ड में रेंडर करें।
- मैनुअल pin/unpin/list-pins क्रियाएं रखें।
- यदि API व्यवहार भरोसेमंद हो, तो भेजे गए संदेश की पिनिंग के लिए वैकल्पिक रूप से `pinDeliveredMessage` लागू करें।

LINE:

- जहां संभव हो, `presentation` को Flex या template messages में रेंडर करें।
- असमर्थित ब्लॉक के लिए टेक्स्ट पर फॉलबैक करें।
- `channelData` से LINE UI पेलोड हटाएं।

साधारण या सीमित चैनल:

- प्रस्तुति को संयमित फ़ॉर्मैटिंग के साथ टेक्स्ट में बदलें।

## रिफैक्टर चरण

1. वह Discord रिलीज़ फिक्स फिर से लागू करें जो `ui-colors.ts` को Carbon-आधारित UI से अलग करता है और `extensions/discord/src/channel.ts` से `DiscordUiContainer` हटाता है।
2. `ReplyPayload`, आउटबाउंड पेलोड नॉर्मलाइज़ेशन, डिलीवरी सारांश, और हुक पेलोड में `presentation` और `delivery` जोड़ें।
3. संकरे SDK/रनटाइम सबपाथ में `MessagePresentation` स्कीमा और पार्सर हेल्पर जोड़ें।
4. संदेश क्षमताओं `buttons`, `cards`, `components`, और `blocks` को अर्थपूर्ण प्रस्तुति क्षमताओं से बदलें।
5. प्रस्तुति रेंडर और डिलीवरी पिनिंग के लिए रनटाइम आउटबाउंड अडैप्टर हुक जोड़ें।
6. क्रॉस-कॉन्टेक्स्ट कंपोनेंट निर्माण को `buildCrossContextPresentation` से बदलें।
7. `src/infra/outbound/channel-adapters.ts` हटाएं और चैनल Plugin प्रकारों से `buildCrossContextComponents` हटाएं।
8. `maybeApplyCrossContextMarker` को नेटिव params के बजाय `presentation` संलग्न करने के लिए बदलें।
9. Plugin-डिस्पैच भेजने वाले पाथ अपडेट करें ताकि वे केवल अर्थपूर्ण प्रस्तुति और डिलीवरी मेटाडेटा का उपयोग करें।
10. एजेंट और CLI नेटिव पेलोड params हटाएं: `components`, `blocks`, `buttons`, और `card`।
11. नेटिव message-tool स्कीमा बनाने वाले SDK हेल्पर हटाएं, और उन्हें प्रस्तुति स्कीमा हेल्पर से बदलें।
12. `channelData` से UI/नेटिव एनवेलप हटाएं; हर शेष फ़ील्ड की समीक्षा होने तक केवल ट्रांसपोर्ट मेटाडेटा रखें।
13. Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, और LINE रेंडरर माइग्रेट करें।
14. संदेश CLI, चैनल पेज, Plugin SDK, और क्षमता कुकबुक के लिए दस्तावेज़ अपडेट करें।
15. Discord और प्रभावित चैनल एंट्रीपॉइंट के लिए import fanout profiling चलाएं।

इस रिफैक्टर में साझा एजेंट, CLI, Plugin क्षमता, और आउटबाउंड अडैप्टर अनुबंधों के लिए चरण 1-11 और 13-14 लागू किए गए हैं। चरण 12 प्रदाता-निजी `channelData` ट्रांसपोर्ट एनवेलप के लिए अधिक गहरा आंतरिक क्लीनअप पास बना रहता है। यदि हमें प्रकार/टेस्ट गेट से आगे परिमाणित import-fanout संख्याएं चाहिए, तो चरण 15 फॉलो-अप सत्यापन बना रहता है।

## टेस्ट

जोड़ें या अपडेट करें:

- प्रस्तुति नॉर्मलाइज़ेशन टेस्ट।
- असमर्थित ब्लॉक के लिए प्रस्तुति ऑटो-डीग्रेड टेस्ट।
- Plugin डिस्पैच और कोर डिलीवरी पाथ के लिए क्रॉस-कॉन्टेक्स्ट मार्कर टेस्ट।
- Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE, और टेक्स्ट फॉलबैक के लिए चैनल रेंडर मैट्रिक्स टेस्ट।
- संदेश टूल स्कीमा टेस्ट जो साबित करें कि नेटिव फ़ील्ड हट गए हैं।
- CLI टेस्ट जो साबित करें कि नेटिव फ़्लैग हट गए हैं।
- Carbon को कवर करने वाला Discord एंट्रीपॉइंट import-laziness रिग्रेशन।
- Telegram और सामान्य फॉलबैक को कवर करने वाले डिलीवरी पिन टेस्ट।

## खुले प्रश्न

- क्या `delivery.pin` को पहले पास में Discord, Slack, MS Teams, और Feishu के लिए लागू किया जाना चाहिए, या पहले केवल Telegram?
- क्या `delivery` को अंततः `replyToId`, `replyToCurrent`, `silent`, और `audioAsVoice` जैसे मौजूदा फ़ील्ड समाहित करने चाहिए, या पोस्ट-सेंड व्यवहारों पर केंद्रित रहना चाहिए?
- क्या प्रस्तुति को सीधे इमेज या फ़ाइल संदर्भों का समर्थन करना चाहिए, या अभी मीडिया को UI लेआउट से अलग रहना चाहिए?

## संबंधित

- [चैनल अवलोकन](/hi/channels)
- [संदेश प्रस्तुति](/hi/plugins/message-presentation)
