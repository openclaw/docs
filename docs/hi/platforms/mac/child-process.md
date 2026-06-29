---
read_when:
    - Mac ऐप को Gateway जीवनचक्र के साथ एकीकृत करना
summary: macOS पर Gateway जीवनचक्र (launchd)
title: macOS पर Gateway जीवनचक्र
x-i18n:
    generated_at: "2026-06-28T23:28:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS ऐप डिफ़ॉल्ट रूप से **launchd के ज़रिए Gateway प्रबंधित करता है** और Gateway को चाइल्ड प्रोसेस के रूप में शुरू नहीं करता। यह पहले कॉन्फ़िगर किए गए पोर्ट पर पहले से चल रहे Gateway से जुड़ने की कोशिश करता है; यदि कोई उपलब्ध नहीं है, तो यह बाहरी `openclaw` CLI के ज़रिए launchd सेवा सक्षम करता है (कोई एम्बेडेड रनटाइम नहीं)। इससे आपको लॉगिन पर भरोसेमंद ऑटो-स्टार्ट और क्रैश होने पर रीस्टार्ट मिलता है।

चाइल्ड-प्रोसेस मोड (ऐप द्वारा सीधे शुरू किया गया Gateway) आज **उपयोग में नहीं है**। यदि आपको UI के साथ अधिक कसा हुआ जुड़ाव चाहिए, तो Gateway को टर्मिनल में मैन्युअली चलाएँ।

## डिफ़ॉल्ट व्यवहार (launchd)

- ऐप `ai.openclaw.gateway` लेबल वाला प्रति-उपयोगकर्ता LaunchAgent इंस्टॉल करता है
  (या `--profile`/`OPENCLAW_PROFILE` इस्तेमाल करने पर `ai.openclaw.<profile>`; विरासत `com.openclaw.*` समर्थित है)।
- जब स्थानीय मोड सक्षम होता है, तो ऐप सुनिश्चित करता है कि LaunchAgent लोड हो और
  ज़रूरत होने पर Gateway शुरू करे।
- लॉग launchd Gateway लॉग पथ पर लिखे जाते हैं (डीबग सेटिंग्स में दिखाई देता है)।

सामान्य कमांड:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

नामित प्रोफ़ाइल चलाते समय लेबल को `ai.openclaw.<profile>` से बदलें।

## अनसाइन्ड देव बिल्ड

`scripts/restart-mac.sh --no-sign` तेज़ स्थानीय बिल्ड के लिए है, जब आपके पास
साइनिंग कुंजियाँ नहीं होतीं। launchd को किसी अनसाइन्ड रिले बाइनरी की ओर इंगित करने से रोकने के लिए, यह:

- `~/.openclaw/disable-launchagent` लिखता है।

`scripts/restart-mac.sh` के साइन्ड रन, यदि मार्कर मौजूद हो, तो इस ओवरराइड को
साफ़ कर देते हैं। मैन्युअली रीसेट करने के लिए:

```bash
rm ~/.openclaw/disable-launchagent
```

## केवल-अटैच मोड

macOS ऐप को **launchd कभी इंस्टॉल या प्रबंधित न करने** के लिए बाध्य करने हेतु, इसे
`--attach-only` (या `--no-launchd`) के साथ लॉन्च करें। यह `~/.openclaw/disable-launchagent` सेट करता है,
इसलिए ऐप केवल पहले से चल रहे Gateway से जुड़ता है। आप यही
व्यवहार डीबग सेटिंग्स में टॉगल कर सकते हैं।

## रिमोट मोड

रिमोट मोड कभी भी स्थानीय Gateway शुरू नहीं करता। ऐप रिमोट होस्ट तक SSH टनल का उपयोग करता है और उसी टनल पर कनेक्ट करता है।

## हम launchd को प्राथमिकता क्यों देते हैं

- लॉगिन पर ऑटो-स्टार्ट।
- बिल्ट-इन रीस्टार्ट/KeepAlive सेमांटिक्स।
- पूर्वानुमेय लॉग और निगरानी।

यदि कभी फिर से वास्तविक चाइल्ड-प्रोसेस मोड की ज़रूरत हो, तो इसे अलग,
स्पष्ट केवल-देव मोड के रूप में दस्तावेज़ित किया जाना चाहिए।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [Gateway रनबुक](/hi/gateway)
