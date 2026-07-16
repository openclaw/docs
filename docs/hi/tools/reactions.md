---
read_when:
    - किसी भी चैनल में प्रतिक्रियाओं पर कार्य करना
    - अलग-अलग प्लेटफ़ॉर्म पर इमोजी प्रतिक्रियाओं में अंतर को समझना
summary: सभी समर्थित चैनलों में रिएक्शन टूल के अर्थ-विज्ञान
title: प्रतिक्रियाएँ
x-i18n:
    generated_at: "2026-07-16T17:35:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

एजेंट `message` टूल की `react`
कार्रवाई से इमोजी प्रतिक्रियाएँ जोड़ता और हटाता है। व्यवहार चैनल के अनुसार अलग-अलग होता है।

## यह कैसे काम करता है

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- प्रतिक्रिया जोड़ते समय `emoji` आवश्यक है।
- इसका समर्थन करने वाले चैनलों पर बॉट की प्रतिक्रिया/प्रतिक्रियाएँ हटाने के लिए `emoji` को रिक्त स्ट्रिंग (`""`) पर सेट करें।
- किसी एक विशिष्ट इमोजी को हटाने के लिए `remove: true` सेट करें (इसके लिए गैर-रिक्त
  `emoji` आवश्यक है)।
- स्थिति प्रतिक्रियाओं वाले चैनलों पर, किसी प्रतिक्रिया में `trackToolCalls: true` होने से
  रनटाइम उसी टर्न के दौरान बाद की टूल-प्रगति
  प्रतिक्रियाओं के लिए उस प्रतिक्रिया वाले संदेश का दोबारा उपयोग कर सकता है।

## चैनल का व्यवहार

<AccordionGroup>
  <Accordion title="Discord और Slack">
    - रिक्त `emoji` संदेश से बॉट की सभी प्रतिक्रियाएँ हटा देता है।
    - `remove: true` केवल निर्दिष्ट इमोजी को हटाता है।

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - केवल प्रतिक्रियाएँ जोड़ना: `emoji` आवश्यक है और गैर-रिक्त होना चाहिए।
    - प्रतिक्रिया हटाना अभी डिलीट कॉल से जुड़ा नहीं है; बिना कुछ किए चुपचाप समाप्त होने के बजाय `remove: true` को स्पष्ट त्रुटि के साथ अस्वीकार किया जाता है।
    - `reaction` सुविधा के साथ पंजीकृत Talk बॉट आवश्यक है ([Nextcloud Talk चैनल दस्तावेज़](/hi/channels/nextcloud-talk) देखें)।

  </Accordion>

  <Accordion title="Telegram">
    - रिक्त `emoji` बॉट की प्रतिक्रियाएँ हटा देता है।
    - `remove: true` भी प्रतिक्रियाएँ हटाता है, लेकिन टूल सत्यापन के लिए फिर भी गैर-रिक्त `emoji` आवश्यक है।

  </Accordion>

  <Accordion title="WhatsApp">
    - रिक्त `emoji` बॉट की प्रतिक्रिया हटा देता है।
    - `remove: true` आंतरिक रूप से रिक्त इमोजी से मैप होता है (टूल कॉल में फिर भी `emoji` आवश्यक है)।
    - WhatsApp में प्रत्येक संदेश के लिए बॉट की प्रतिक्रिया का एक स्लॉट होता है; नई प्रतिक्रिया भेजने पर कई इमोजी जमा होने के बजाय मौजूदा प्रतिक्रिया बदल जाती है।

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - जोड़ने और हटाने, दोनों के लिए गैर-रिक्त `emoji` आवश्यक है।
    - `remove: true` उस विशिष्ट इमोजी प्रतिक्रिया को हटाता है।

  </Accordion>

  <Accordion title="Feishu/Lark">
    - यह किसी अलग टूल के बजाय अन्य चैनलों जैसी ही `react` कार्रवाई का उपयोग करता है (संदेश प्रतिक्रिया आईडी के माध्यम से जोड़ना/हटाना/सूचीबद्ध करना)।
    - जोड़ने के लिए गैर-रिक्त `emoji` आवश्यक है (जिसे Feishu के `emoji_type` से मैप किया जाता है, जैसे `SMILE`, `THUMBSUP`, `HEART`)।
    - `remove: true` के लिए गैर-रिक्त `emoji` आवश्यक है और यह उस इमोजी प्रकार से मेल खाने वाली बॉट की अपनी प्रतिक्रिया को हटाता है।
    - `clearAll: true` के साथ रिक्त `emoji` संदेश से बॉट की सभी प्रतिक्रियाएँ हटा देता है।

  </Accordion>

  <Accordion title="Signal">
    - आने वाली प्रतिक्रिया सूचनाएँ `channels.signal.reactionNotifications` द्वारा नियंत्रित होती हैं: `"off"` उन्हें अक्षम करता है, `"own"` (डिफ़ॉल्ट) तब ईवेंट जारी करता है जब उपयोगकर्ता बॉट संदेशों पर प्रतिक्रिया करते हैं, `"all"` सभी प्रतिक्रियाओं के लिए ईवेंट जारी करता है, और `"allowlist"` केवल `channels.signal.reactionAllowlist` में शामिल प्रेषकों के लिए ईवेंट जारी करता है।

  </Accordion>

  <Accordion title="iMessage">
    - बाहर भेजी जाने वाली प्रतिक्रियाएँ iMessage टैपबैक (`love`, `like`, `dislike`, `laugh`, `emphasize`, और `question`) होती हैं; प्रतिक्रिया जोड़ने के लिए `emoji` को इनमें से किसी एक प्रकार से मैप होना चाहिए।
    - मान्य टैपबैक प्रकार के बिना `remove: true` सभी टैपबैक प्रकारों को हटा देता है; मान्य प्रकार के साथ यह केवल उसी को हटाता है।

  </Accordion>
</AccordionGroup>

## प्रतिक्रिया स्तर

प्रत्येक चैनल का `reactionLevel` नियंत्रित करता है कि एजेंट कितनी बार अपनी
प्रतिक्रियाएँ भेजता है। मान: `off`, `ack`, `minimal`, या `extensive`।

- [Telegram प्रतिक्रिया सूचनाएँ](/hi/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (डिफ़ॉल्ट `minimal`)
- [WhatsApp प्रतिक्रिया स्तर](/hi/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (डिफ़ॉल्ट `minimal`)
- [Signal प्रतिक्रियाएँ](/hi/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (डिफ़ॉल्ट `minimal`)

## संबंधित

- [एजेंट प्रेषण](/hi/tools/agent-send) - `message` टूल, जिसमें `react` शामिल है
- [चैनल](/hi/channels) - चैनल-विशिष्ट कॉन्फ़िगरेशन
