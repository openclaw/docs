---
read_when:
    - ClawHub सुरक्षा ऑडिट परिणामों को समझना
    - Skill या Plugin इंस्टॉल करना है या नहीं तय करना
    - ClawHub ऑडिट स्थिति, जोखिम स्तर, या निष्कर्षों की व्याख्या
sidebarTitle: Security Audits
summary: किसी स्किल या Plugin को इंस्टॉल करने से पहले ClawHub सुरक्षा ऑडिट परिणामों को कैसे समझें।
title: सुरक्षा ऑडिट
x-i18n:
    generated_at: "2026-07-04T10:41:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# सुरक्षा ऑडिट

ClawHub सुरक्षा ऑडिट आपको यह तय करने में मदद करते हैं कि कोई स्किल या plugin इंस्टॉल करने के लिए पर्याप्त सुरक्षित है या नहीं। वे दिखाते हैं कि कोई रिलीज़ क्या करती है, वह कौन-सा अधिकार मांगती है, और फ़ाइलों, खातों, क्रेडेंशियल्स, कोड, या बाहरी सेवाओं तक पहुंच पाने से पहले क्या किसी चीज़ पर अतिरिक्त ध्यान देने की ज़रूरत है।

ऑडिट मजबूत सुरक्षा संकेत हैं, लेकिन वे यह गारंटी नहीं हैं कि कोई रिलीज़ जोखिम-मुक्त है। संवेदनशील पहुंच देने से पहले हमेशा अपने विवेक का उपयोग करें।

[Security](/clawhub/security), [Acceptable usage](/clawhub/acceptable-usage), और [Moderation and Account Safety](/clawhub/moderation) भी देखें।

## इंस्टॉल करने से पहले क्या जांचें

इंस्टॉल करने से पहले, समीक्षा करें:

- समग्र ऑडिट स्थिति
- जोखिम स्तर
- सूचीबद्ध कोई भी निष्कर्ष
- आवश्यक क्रेडेंशियल्स, अनुमतियां, या environment variables
- मालिक, स्रोत, संस्करण, changelog, डाउनलोड, stars, और अन्य भरोसे के संकेत

केवल वही सामग्री इंस्टॉल करें जिसे आप समझते और भरोसा करते हैं।

## ऑडिट स्थिति

ऑडिट स्थिति बताती है कि आपको ऑडिट परिणाम पर कैसे प्रतिक्रिया देनी चाहिए:

| स्थिति | अर्थ |
| ----------- | ------------------------------------------------------------------------- |
| `Pass` | कम जोखिम से ऊपर कोई दिखाई देने वाली समस्या नहीं मिली। |
| `Review` | इंस्टॉल करने से पहले निष्कर्ष पढ़ें। रिलीज़ फिर भी वैध हो सकती है। |
| `Warn` | अतिरिक्त सावधानी बरतें। ClawHub को कोई उच्च-प्रभाव चिंता या चेतावनी संकेत मिला। |
| `Malicious` | इंस्टॉल न करें। |
| `Pending` | ऑडिट अभी पूरे नहीं हुए हैं। |
| `Error` | ऑडिट पूरा नहीं किया जा सका। |

`Pass` आश्वस्त करता है, लेकिन यह आपके अपने विवेक का विकल्प नहीं है। यह उन टूल्स के लिए सबसे अधिक मायने रखता है जो सामग्री प्रकाशित कर सकते हैं, डेटा संपादित कर सकते हैं, कमांड चला सकते हैं, फ़ाइलें पढ़ सकते हैं, या production systems तक पहुंच सकते हैं।

## जोखिम स्तर

जोखिम स्तर blast radius का वर्णन करता है: यदि आप रिलीज़ को उसके अपेक्षित तरीके से उपयोग करते हैं, तो उसके पास कितनी शक्ति दिखाई देती है।

| जोखिम स्तर | अर्थ |
| ---------- | ----------------------------------------------------------------------------- |
| `Low` | कम संवेदनशील अधिकार या उपयोगकर्ता प्रभाव मिला। |
| `Medium` | रिलीज़ के पास सार्थक अधिकार हैं, जैसे account access या डेटा परिवर्तन। |
| `High` | रिलीज़ के पास उच्च-प्रभाव अधिकार, गंभीर निष्कर्ष, या दुर्भावनापूर्ण संकेत हैं। |

जोखिम स्तर और ऑडिट स्थिति अलग-अलग सवालों के जवाब देते हैं:

- जोखिम स्तर पूछता है: "यहां कितनी शक्ति है?"
- ऑडिट स्थिति पूछती है: "मुझे इस परिणाम के साथ क्या करना चाहिए?"

उदाहरण के लिए, कोई publishing skill `Medium` जोखिम के साथ `Review` दिखा सकती है। इसका मतलब यह नहीं है कि वह दुर्भावनापूर्ण है। इसका मतलब है कि skill उद्देश्य के अनुरूप दिखाई देती है, लेकिन वह सार्थक account authority के साथ कार्रवाई कर सकती है।

## निष्कर्ष

निष्कर्ष बताते हैं कि कोई ऑडिट परिणाम क्यों दिखाया गया। हर निष्कर्ष में आमतौर पर शामिल होता है:

- इसका क्या मतलब है
- इसे क्यों चिह्नित किया गया
- संबंधित skill या plugin सामग्री
- एक अनुशंसा

निष्कर्षों को `Info`, `Low`, `Medium`, `High`, या `Critical` लेबल किया जा सकता है। अधिक गंभीर निष्कर्ष जोखिम स्तर और ऑडिट स्थिति में अधिक मजबूत योगदान देते हैं।

कम-विश्वास वाले निष्कर्ष सार्वजनिक ऑडिट रोलअप से छिपाए जाते हैं ताकि पेज उपयोगी प्रमाण पर केंद्रित रहे।

## ClawHub क्या जांचता है

ClawHub सबमिट किए गए रिलीज़ artifacts का ऑडिट करता है, जिनमें शामिल हैं:

- skill निर्देश या plugin metadata
- घोषित environment variables और permissions
- install instructions और package metadata
- शामिल फ़ाइलें और file manifests
- compatibility और capability metadata

मुख्य सवाल coherence का है: क्या नाम, सारांश, metadata, अनुरोधित authority, और वास्तविक सामग्री उन बातों से मेल खाते हैं जिनकी उपयोगकर्ता उचित रूप से उम्मीद करेंगे?

शक्तिशाली व्यवहार अपने-आप खराब नहीं होता। कई उपयोगी टूल्स को credentials, local commands, provider APIs, या package installs की ज़रूरत होती है। ऑडिट जांचता है कि क्या वह शक्ति अपेक्षित, घोषित, और अनुपातिक है।

Artifact pages पूर्ण ऑडिट से यहां लिंक करते हैं:

```text
/<owner>/skills/<slug>/security-audit
```

ऑडिट पेज जोड़ता है:

1. SkillSpector
2. VirusTotal
3. जोखिम विश्लेषण

## VirusTotal

ClawHub ऑडिट stack में VirusTotal को malware telemetry के रूप में उपयोग करता है। VirusTotal file reputation और malware scanning के लिए एक भरोसेमंद industry standard है, और हमारी partnership ClawHub को skill और plugin review में व्यापक सुरक्षा intelligence जोड़ने देती है।

VirusTotal ज्ञात malicious artifacts, engine hits, और reputation signals के लिए खास तौर पर उपयोगी है, जो ClawHub की agent-aware review को पूरक बनाते हैं। जब vendor engine counts उपलब्ध होते हैं, तो ऑडिट उन्हें सरल भाषा में सारांशित करता है, जैसे:

```text
62/62 vendors flagged this skill as clean.
```

या:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

जब ClawHub के पास सारांशित करने के लिए कोई vendor-count telemetry नहीं होती, तो ऑडिट कहता है:

```text
No VirusTotal findings
```

VirusTotal telemetry ही रहता है। यह ClawHub के अपने artifact-aware risk analysis का विकल्प नहीं है।

## जोखिम विश्लेषण

जोखिम विश्लेषण आंतरिक रूप से ClawScan द्वारा संचालित होता है, जो ClawHub का अपना security audit system है। यह हर रिलीज़ की agent-facing artifact के रूप में समीक्षा करता है: निर्देश, metadata, घोषित permissions, files, capability signals, static scan signals, SkillSpector findings, VirusTotal telemetry, और publisher-provided context। Static scan signals इस review के लिए internal context हैं; वे standalone public audit section या install-blocking verdict नहीं हैं।

जोखिम विश्लेषण
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
को prompt injection, tool misuse, credential exposure, unsafe execution, memory या context poisoning, और excessive agency जैसे जोखिमों के लिए lens के रूप में उपयोग करता है।

ClawScan किसी डरावनी दिखने वाली capability को अपने-आप malicious नहीं मानता। यह पूछता है कि capability disclosed है या नहीं, purpose-aligned है या नहीं, और release के stated use case द्वारा supported है या नहीं।
