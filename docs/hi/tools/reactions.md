---
read_when:
    - किसी भी चैनल में प्रतिक्रियाओं पर काम करना
    - यह समझना कि प्लेटफ़ॉर्मों के बीच इमोजी प्रतिक्रियाएँ कैसे अलग होती हैं
summary: सभी समर्थित चैनलों में प्रतिक्रिया टूल के अर्थ-विज्ञान
title: प्रतिक्रियाएँ
x-i18n:
    generated_at: "2026-06-29T00:22:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

एजेंट `message` टूल को `react` कार्रवाई के साथ इस्तेमाल करके संदेशों पर इमोजी प्रतिक्रियाएं जोड़ और हटा सकता है। प्रतिक्रिया व्यवहार चैनल और ट्रांसपोर्ट के अनुसार बदलता है।

## यह कैसे काम करता है

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- प्रतिक्रिया जोड़ते समय `emoji` आवश्यक है।
- बॉट की प्रतिक्रिया(ओं) को हटाने के लिए `emoji` को खाली स्ट्रिंग (`""`) पर सेट करें।
- किसी विशिष्ट इमोजी को हटाने के लिए `remove: true` सेट करें (गैर-खाली `emoji` आवश्यक है)।
- स्थिति प्रतिक्रियाओं का समर्थन करने वाले चैनलों पर, किसी प्रतिक्रिया पर `trackToolCalls: true` रनटाइम को उसी टर्न के दौरान बाद की टूल प्रगति प्रतिक्रियाओं के लिए उस प्रतिक्रिया वाले संदेश का उपयोग करने देता है।

## चैनल व्यवहार

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - खाली `emoji` संदेश पर बॉट की सभी प्रतिक्रियाएं हटा देता है।
    - `remove: true` केवल निर्दिष्ट इमोजी को हटाता है।

  </Accordion>

  <Accordion title="Google Chat">
    - खाली `emoji` संदेश पर ऐप की प्रतिक्रियाएं हटा देता है।
    - `remove: true` केवल निर्दिष्ट इमोजी को हटाता है।

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - केवल प्रतिक्रियाएं जोड़ना: `emoji` आवश्यक है और गैर-खाली होना चाहिए।
    - प्रतिक्रिया हटाना अभी समर्थित नहीं है; `remove: true` (या खाली `emoji`) वाली कॉल चुपचाप कोई कार्रवाई न करने के बजाय स्पष्ट त्रुटि के साथ अस्वीकार की जाती हैं।
    - Talk बॉट का `reaction` सुविधा के साथ पंजीकृत होना आवश्यक है ([Nextcloud Talk चैनल दस्तावेज़](/hi/channels/nextcloud-talk) देखें)।

  </Accordion>

  <Accordion title="Telegram">
    - खाली `emoji` बॉट की प्रतिक्रियाएं हटा देता है।
    - `remove: true` भी प्रतिक्रियाएं हटाता है, लेकिन टूल सत्यापन के लिए अब भी गैर-खाली `emoji` आवश्यक है।

  </Accordion>

  <Accordion title="WhatsApp">
    - खाली `emoji` बॉट प्रतिक्रिया को हटाता है।
    - `remove: true` आंतरिक रूप से खाली इमोजी पर मैप होता है (टूल कॉल में अब भी `emoji` आवश्यक है)।
    - WhatsApp में प्रति संदेश एक बॉट प्रतिक्रिया स्लॉट होता है; स्थिति प्रतिक्रिया अपडेट कई इमोजी को जमा करने के बजाय उस स्लॉट को बदल देते हैं।

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - गैर-खाली `emoji` आवश्यक है।
    - `remove: true` उस विशिष्ट इमोजी प्रतिक्रिया को हटाता है।

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove`, और `list` कार्रवाइयों के साथ `feishu_reaction` टूल का उपयोग करें।
    - जोड़ने/हटाने के लिए `emoji_type` आवश्यक है; हटाने के लिए `reaction_id` भी आवश्यक है।

  </Accordion>

  <Accordion title="Signal">
    - इनबाउंड प्रतिक्रिया सूचनाएं `channels.signal.reactionNotifications` द्वारा नियंत्रित होती हैं: `"off"` उन्हें अक्षम करता है, `"own"` (डिफ़ॉल्ट) तब इवेंट उत्सर्जित करता है जब उपयोगकर्ता बॉट संदेशों पर प्रतिक्रिया देते हैं, और `"all"` सभी प्रतिक्रियाओं के लिए इवेंट उत्सर्जित करता है।

  </Accordion>

  <Accordion title="iMessage">
    - आउटबाउंड प्रतिक्रियाएं iMessage tapbacks हैं (`love`, `like`, `dislike`, `laugh`, `emphasize`, और `question`)।
    - इनबाउंड tapback सूचनाएं `channels.imessage.reactionNotifications` द्वारा नियंत्रित होती हैं: `"off"` उन्हें अक्षम करता है, `"own"` (डिफ़ॉल्ट) तब इवेंट उत्सर्जित करता है जब उपयोगकर्ता बॉट द्वारा लिखे गए संदेशों पर प्रतिक्रिया देते हैं, और `"all"` अधिकृत प्रेषकों से सभी tapbacks के लिए इवेंट उत्सर्जित करता है।

  </Accordion>
</AccordionGroup>

## प्रतिक्रिया स्तर

प्रति-चैनल `reactionLevel` कॉन्फ़िग नियंत्रित करता है कि एजेंट कितने व्यापक रूप से प्रतिक्रियाओं का उपयोग करता है। मान आम तौर पर `off`, `ack`, `minimal`, या `extensive` होते हैं।

- [Telegram reactionLevel](/hi/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/hi/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

हर प्लेटफ़ॉर्म पर एजेंट संदेशों पर कितनी सक्रियता से प्रतिक्रिया देता है, इसे समायोजित करने के लिए अलग-अलग चैनलों पर `reactionLevel` सेट करें।

## संबंधित

- [एजेंट भेजना](/hi/tools/agent-send) — `message` टूल जिसमें `react` शामिल है
- [चैनल](/hi/channels) — चैनल-विशिष्ट कॉन्फ़िगरेशन
