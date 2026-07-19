---
read_when:
    - Mac ऐप को Gateway जीवनचक्र के साथ एकीकृत करना
summary: macOS पर Gateway का जीवनचक्र (launchd)
title: macOS पर Gateway का जीवनचक्र
x-i18n:
    generated_at: "2026-07-19T09:34:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS ऐप डिफ़ॉल्ट रूप से **launchd** के माध्यम से Gateway को प्रबंधित करता है और
Gateway को चाइल्ड प्रोसेस के रूप में आरंभ नहीं करता। यह पहले कॉन्फ़िगर किए गए पोर्ट पर
पहले से चल रहे Gateway से जुड़ने का प्रयास करता है; यदि कोई पहुँच योग्य नहीं है, तो यह
बाहरी `openclaw` CLI के माध्यम से launchd सेवा को सक्षम करता है (कोई एम्बेडेड
रनटाइम नहीं)। इससे लॉगिन पर विश्वसनीय स्वचालित शुरुआत और क्रैश होने पर पुनः शुरुआत मिलती है।

चाइल्ड-प्रोसेस मोड (ऐप द्वारा सीधे आरंभ किया गया Gateway) का आज **उपयोग नहीं हो रहा है**।
यदि UI के साथ अधिक निकट समन्वय आवश्यक है, तो टर्मिनल में Gateway को मैन्युअल रूप से चलाएँ।

## डिफ़ॉल्ट व्यवहार (launchd)

- ऐप `ai.openclaw.gateway` लेबल वाला प्रति-उपयोगकर्ता LaunchAgent इंस्टॉल करता है (या
  `--profile`/`OPENCLAW_PROFILE` का उपयोग करते समय `ai.openclaw.<profile>`)।
- Local मोड सक्षम होने पर, ऐप सुनिश्चित करता है कि LaunchAgent लोड हो और
  आवश्यकता होने पर Gateway शुरू करता है।
- लॉग launchd Gateway लॉग पथ पर लिखे जाते हैं (Debug Settings में दिखाई देते हैं)।

सामान्य कमांड:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

नामित प्रोफ़ाइल चलाते समय लेबल को `ai.openclaw.<profile>` से बदलें।

## अहस्ताक्षरित डेवलपमेंट बिल्ड

`scripts/restart-mac.sh --no-sign` साइनिंग कुंजियों के बिना तेज़ स्थानीय बिल्ड के लिए है।
launchd को अहस्ताक्षरित रिले बाइनरी की ओर इंगित करने से रोकने के लिए, यह
`~/.openclaw/disable-launchagent` लिखता है।

`scripts/restart-mac.sh` के हस्ताक्षरित रन, मार्कर मौजूद होने पर इस ओवरराइड को
हटा देते हैं। मैन्युअल रूप से रीसेट करने के लिए:

```bash
rm ~/.openclaw/disable-launchagent
```

## केवल-अटैच मोड

macOS ऐप को launchd कभी भी इंस्टॉल या प्रबंधित न करने के लिए बाध्य करने हेतु, इसे
`--attach-only` (या `--no-launchd`) के साथ लॉन्च करें। इससे
`~/.openclaw/disable-launchagent` सेट होता है, इसलिए ऐप केवल पहले से चल रहे
Gateway से जुड़ता है। Debug Settings में इसी व्यवहार को टॉगल करें।

## रिमोट मोड

रिमोट मोड कभी भी स्थानीय Gateway शुरू नहीं करता। ऐप रिमोट होस्ट के लिए SSH टनल का
उपयोग करता है और उसी टनल के माध्यम से कनेक्ट होता है।

## हम launchd को प्राथमिकता क्यों देते हैं

- लॉगिन पर स्वचालित शुरुआत।
- अंतर्निहित पुनः शुरुआत/KeepAlive व्यवहार।
- पूर्वानुमेय लॉग और पर्यवेक्षण।

यदि वास्तविक चाइल्ड-प्रोसेस मोड की फिर कभी आवश्यकता हो, तो इसे एक अलग, स्पष्ट,
केवल-डेवलपमेंट मोड के रूप में दस्तावेज़ित किया जाना चाहिए।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [Gateway रनबुक](/hi/gateway)
