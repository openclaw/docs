---
read_when:
    - आप cron job बनाए बिना एक system event को enqueue करना चाहते हैं
    - आपको Heartbeat सक्षम या अक्षम करने की आवश्यकता है
    - आप सिस्टम उपस्थिति प्रविष्टियों का निरीक्षण करना चाहते हैं
summary: '`openclaw system` के लिए CLI संदर्भ (सिस्टम इवेंट, heartbeat, उपस्थिति)'
title: सिस्टम
x-i18n:
    generated_at: "2026-06-28T22:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway के लिए सिस्टम-स्तरीय सहायक: सिस्टम इवेंट कतारबद्ध करें, Heartbeat नियंत्रित करें,
और उपस्थिति देखें।

सभी `system` उपकमांड Gateway RPC का उपयोग करते हैं और साझा क्लाइंट फ़्लैग स्वीकार करते हैं:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## सामान्य कमांड

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

डिफ़ॉल्ट रूप से **main** सत्र पर सिस्टम इवेंट कतारबद्ध करें। अगला Heartbeat
इसे प्रॉम्प्ट में `System:` पंक्ति के रूप में इंजेक्ट करेगा। Heartbeat को तुरंत ट्रिगर करने के लिए
`--mode now` का उपयोग करें; `next-heartbeat` अगले निर्धारित टिक की प्रतीक्षा करता है।

किसी विशिष्ट सत्र को लक्ष्य करने के लिए `--session-key` पास करें (उदाहरण के लिए किसी
async-task पूर्णता को उसे शुरू करने वाले चैनल पर वापस रिले करने हेतु)।

> **`--session-key` के साथ समय-निर्धारण अपवाद:** जब `--session-key` दिया जाता है,
> `--mode next-heartbeat` अगले निर्धारित टिक की प्रतीक्षा करने के बजाय
> तत्काल लक्षित वेक में सिमट जाता है। लक्षित वेक Heartbeat intent
> `immediate` का उपयोग करते हैं, इसलिए वे runner के not-due gate को बायपास करते हैं, जो अन्यथा
> `event`-intent वेक को स्थगित (और प्रभावी रूप से ड्रॉप) कर देता। यदि आप विलंबित
> डिलीवरी चाहते हैं, तो `--session-key` छोड़ दें ताकि इवेंट मुख्य सत्र पर पहुँचे और
> अगले नियमित Heartbeat के साथ चले।

फ़्लैग:

- `--text <text>`: आवश्यक सिस्टम इवेंट टेक्स्ट।
- `--mode <mode>`: `now` या `next-heartbeat` (डिफ़ॉल्ट)।
- `--session-key <sessionKey>`: वैकल्पिक; एजेंट के मुख्य सत्र के बजाय किसी विशिष्ट एजेंट सत्र को लक्ष्य करें।
  जिन कुंजियों का संबंध
  रिज़ॉल्व किए गए एजेंट से नहीं है, वे एजेंट के मुख्य सत्र पर वापस चली जाती हैं।
- `--json`: मशीन-पठनीय आउटपुट।
- `--url`, `--token`, `--timeout`, `--expect-final`: साझा Gateway RPC फ़्लैग।

## `system heartbeat last|enable|disable`

Heartbeat नियंत्रण:

- `last`: अंतिम Heartbeat इवेंट दिखाएँ।
- `enable`: Heartbeat फिर से चालू करें (यदि वे अक्षम थे तो इसका उपयोग करें)।
- `disable`: Heartbeat रोकें।

फ़्लैग:

- `--json`: मशीन-पठनीय आउटपुट।
- `--url`, `--token`, `--timeout`, `--expect-final`: साझा Gateway RPC फ़्लैग।

## `system presence`

Gateway को ज्ञात वर्तमान सिस्टम उपस्थिति प्रविष्टियाँ सूचीबद्ध करें (नोड,
इंस्टेंस, और समान स्थिति पंक्तियाँ)।

फ़्लैग:

- `--json`: मशीन-पठनीय आउटपुट।
- `--url`, `--token`, `--timeout`, `--expect-final`: साझा Gateway RPC फ़्लैग।

## नोट्स

- आपके वर्तमान कॉन्फ़िगरेशन (स्थानीय या रिमोट) द्वारा पहुँच योग्य चालू Gateway आवश्यक है।
- सिस्टम इवेंट अस्थायी होते हैं और रीस्टार्ट के बाद कायम नहीं रहते।

## संबंधित

- [CLI संदर्भ](/hi/cli)
