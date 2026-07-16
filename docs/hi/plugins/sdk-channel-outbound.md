---
read_when:
    - आप किसी मैसेजिंग चैनल Plugin के भेजने के पथ का निर्माण या पुनर्संरचना कर रहे हैं
    - आपको अंतिम उत्तर की टिकाऊ डिलीवरी, प्राप्ति रसीदें, लाइव पूर्वावलोकन को अंतिम रूप देना, या प्राप्ति की अभिस्वीकृति नीति चाहिए
    - आप channel-message, channel-message-runtime या पुराने reply dispatch सहायकों से माइग्रेट कर रहे हैं
summary: 'चैनल plugins के लिए आउटबाउंड संदेश जीवनचक्र API: एडेप्टर, प्राप्ति रसीदें, टिकाऊ प्रेषण, लाइव पूर्वावलोकन और उत्तर पाइपलाइन सहायक फ़ंक्शन'
title: चैनल आउटबाउंड API
x-i18n:
    generated_at: "2026-07-16T16:19:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

Channel plugins, `openclaw/plugin-sdk/channel-outbound` से आउटबाउंड संदेश व्यवहार उजागर करते हैं। प्राप्ति/संदर्भ/डिस्पैच
ऑर्केस्ट्रेशन के लिए `openclaw/plugin-sdk/channel-inbound` का उपयोग करें।

कोर कतारबद्धता, टिकाऊपन, सामान्य पुनःप्रयास नीति, हुक, रसीदों और
साझा `message` टूल का स्वामी है। Plugin नेटिव भेजने/संपादित करने/हटाने की कॉल,
लक्ष्य सामान्यीकरण, प्लेटफ़ॉर्म थ्रेडिंग, चयनित उद्धरण, सूचना
फ़्लैग, खाता स्थिति और प्लेटफ़ॉर्म-विशिष्ट पार्श्व प्रभावों का स्वामी है।

## अडैप्टर

अधिकांश plugins एक `message` अडैप्टर परिभाषित करते हैं:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

केवल उन्हीं क्षमताओं की घोषणा करें जिन्हें नेटिव ट्रांसपोर्ट वास्तव में सुरक्षित रखता है। घोषित
प्रत्येक भेजने, रसीद, लाइव-पूर्वावलोकन और प्राप्ति-स्वीकृति क्षमता को
इस उपपथ से निर्यात किए गए अनुबंध सहायकों से कवर करें।

## सादे-पाठ का स्वच्छीकरण

जब किसी आउटबाउंड अडैप्टर को समर्थित HTML फ़ॉर्मैटिंग टैग को हल्के टेक्स्ट मार्कअप में बदलने की आवश्यकता हो, तब
`sanitizeForPlainText(...)` का उपयोग करें। डिफ़ॉल्ट मौजूदा
चैट-शैली के बोल्ड और स्ट्राइकथ्रू चिह्नों को बनाए रखता है। केवल तभी
`{ style: "markdown" }` पास करें जब चैनल परिणाम को Markdown के रूप में दोबारा पार्स करता हो:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Markdown शैली `**bold**` और `~~strikethrough~~` का उपयोग करती है; इटैलिक और इनलाइन
कोड दोनों शैलियों में `_italic_` और बैकटिक चिह्न बनाए रखते हैं। स्वच्छीकरण के बाद
चिह्न-पाठ को दोबारा लिखने के बजाय चैनल सीमा पर शैली चुनें।

## डिलीवरी प्रमाण

एक `MessageReceipt`, चैनल अडैप्टर द्वारा लौटाए गए परिणाम को दर्ज करता है। ठोस
प्लेटफ़ॉर्म संदेश पहचानकर्ता दर्शाते हैं कि प्लेटफ़ॉर्म भेजने के पथ ने
संदेश स्वीकार किया; वे यह सिद्ध नहीं करते कि प्राप्तकर्ता के डिवाइस ने उसे प्रदर्शित किया या पढ़ा।
प्लेटफ़ॉर्म संदेश पहचानकर्ताओं के बिना रसीदें केवल स्थानीय रसीद मेटाडेटा हैं।
पठन रसीदों या डिवाइस-डिलीवरी स्थिति वाले चैनलों को उन तथ्यों को
एक अलग चैनल-विशिष्ट पथ के माध्यम से ट्रैक करना चाहिए।

यदि कोई चैनल अडैप्टर सिद्ध कर सकता है कि विफलता का पुनःप्रयास प्राप्तकर्ता को दिखाई देने वाला
डुप्लिकेट प्रेषण नहीं कर सकता और अंतिम रूप देने में सक्षम कोई कॉल शुरू नहीं हुई, तो
`openclaw/plugin-sdk/error-runtime` से
`new PlatformMessageNotDispatchedError("...", { cause: error })` थ्रो करें। इसके बाद कोर पुराने प्रेषण-प्रयास
प्रमाण को साफ़ करके कतारबद्ध इरादे का सुरक्षित रूप से पुनःप्रयास कर सकता है। केवल अंतिम
डिस्पैच सीमा का स्वामी अडैप्टर ही यह दावा कर सकता है। अंतिम रूप देने/भेजने की
कॉल शुरू होने या अस्पष्ट परिणाम लौटाने के बाद इस चिह्न का कभी उपयोग न करें; गलत चिह्नांकन
संदेशों की प्रतिलिपि बना सकता है।

## मौजूदा आउटबाउंड अडैप्टर

यदि चैनल में पहले से संगत `outbound` अडैप्टर है, तो भेजने के कोड की प्रतिलिपि बनाने के बजाय
संदेश अडैप्टर को उससे व्युत्पन्न करें:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## टिकाऊ प्रेषण

रनटाइम प्रेषण सहायक भी `channel-outbound` पर उपलब्ध हैं:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- ड्राफ़्ट स्ट्रीमिंग/प्रगति सहायक, जैसे `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` एक स्पष्ट परिणाम लौटाता है:

| परिणाम          | अर्थ                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `sent`           | प्लेटफ़ॉर्म भेजने के पथ ने कम-से-कम एक दृश्यमान प्लेटफ़ॉर्म संदेश स्वीकार किया            |
| `suppressed`     | किसी भी प्लेटफ़ॉर्म संदेश को अनुपलब्ध नहीं माना जाना चाहिए                                        |
| `partial_failed` | बाद का पेलोड या पार्श्व प्रभाव विफल होने से पहले कम-से-कम एक प्लेटफ़ॉर्म संदेश स्वीकार किया गया |
| `failed`         | कोई प्लेटफ़ॉर्म रसीद उत्पन्न नहीं हुई                                                        |

जब किसी बैच में भेजे गए, दबाए गए और विफल पेलोड मिश्रित हों, तब `payloadOutcomes` का उपयोग करें।
रिक्त पुराने प्रत्यक्ष-डिलीवरी परिणाम से हुक रद्दीकरण का अनुमान न लगाएँ।

## स्थगित डिलीवरी प्रवेश

जब कोई समाधान किया गया खाता कोर-प्रबंधित आउटबाउंड या स्थगित डिलीवरी को
सुरक्षित रूप से स्वीकार नहीं कर सकता, तब `message.durableFinal.admitDeferredDelivery(...)` का उपयोग करें।
कोर लाइव आउटबाउंड कार्य से पहले इस हुक को समकालिक रूप से कॉल करता है, जिसमें कतार
स्थायित्व छोड़ने वाले पथ भी शामिल हैं, और पुनर्प्राप्त इरादे को दोबारा चलाने से पहले इसे फिर कॉल करता है। संदर्भ में
`cfg`, `channel`, `to`, `accountId`, और `live` या
`recovery` का एक `phase` शामिल होता है।

जारी रखने के लिए `{ status: "allowed" }` लौटाएँ। जब डिलीवरी को
स्थायी नहीं किया जाना चाहिए, सीधे नहीं भेजा जाना चाहिए या दोबारा नहीं चलाया जाना चाहिए, तब
`{ status: "permanent_rejection", reason }` लौटाएँ। लाइव अस्वीकृति कतार
निर्माण, संदेश हुक या प्लेटफ़ॉर्म कार्य से पहले विफल होती है। पुनर्प्राप्ति अस्वीकृति
कतारबद्ध रिकॉर्ड को विफल चिह्नित करती है और मिलान तथा पुनःचालन को छोड़ देती है। हुक को
छोड़ने का अर्थ अनुमति है।

हुक एक समकालिक प्रवेश निर्णय है, प्रेषण पथ नहीं। केवल
पहले से लोड किया गया कॉन्फ़िगरेशन या रनटाइम स्थिति पढ़ें; नेटवर्क, फ़ाइल सिस्टम या
अन्य अतुल्यकालिक I/O न करें। अनुबंध परीक्षणों को
`openclaw/plugin-sdk/channel-outbound` से `ChannelMessageDurableFinalAdapter` के माध्यम से दोनों चरणों और दोनों
परिणाम प्रकारों का परीक्षण करना चाहिए।

## संगतता डिस्पैच

`channel-inbound` से `dispatchChannelInboundReply(...)` के माध्यम से इनबाउंड उत्तर डिस्पैच
संयोजित करें। प्लेटफ़ॉर्म डिलीवरी को डिलीवरी अडैप्टर में रखें; संदेश अडैप्टर,
टिकाऊ प्रेषण, रसीदों, लाइव पूर्वावलोकन और उत्तर पाइपलाइन विकल्पों के लिए
`channel-outbound` का उपयोग करें।
