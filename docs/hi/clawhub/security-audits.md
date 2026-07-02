---
read_when:
    - ClawHub सुरक्षा ऑडिट परिणामों को समझना
    - Skill या Plugin इंस्टॉल करना है या नहीं, यह तय करना
    - ClawHub ऑडिट स्थिति, जोखिम स्तर, या निष्कर्ष समझाना
sidebarTitle: Security Audits
summary: किसी कौशल या प्लगइन को इंस्टॉल करने से पहले ClawHub सुरक्षा ऑडिट परिणामों को समझने का तरीका।
title: सुरक्षा ऑडिट
x-i18n:
    generated_at: "2026-07-02T08:18:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# सुरक्षा ऑडिट

ClawHub सुरक्षा ऑडिट आपको यह तय करने में मदद करते हैं कि कोई skill या plugin इंस्टॉल करने के लिए पर्याप्त सुरक्षित है या नहीं। वे दिखाते हैं कि कोई रिलीज़ क्या करती है, वह कौन-सा अधिकार मांगती है, और क्या फ़ाइलों, खातों, credentials, code, या बाहरी सेवाओं तक पहुंचने से पहले किसी चीज़ पर अतिरिक्त ध्यान देना चाहिए।

ऑडिट मजबूत सुरक्षा संकेत हैं, लेकिन वे यह गारंटी नहीं देते कि कोई रिलीज़ जोखिम-मुक्त है। संवेदनशील पहुंच देने से पहले हमेशा अपने विवेक का उपयोग करें।

यह भी देखें: [सुरक्षा](/clawhub/security), [स्वीकार्य उपयोग](/clawhub/acceptable-usage),
और [मॉडरेशन और खाता सुरक्षा](/clawhub/moderation).

## इंस्टॉल करने से पहले क्या जांचें

इंस्टॉल करने से पहले, समीक्षा करें:

- समग्र ऑडिट स्थिति
- जोखिम स्तर
- सूचीबद्ध कोई भी निष्कर्ष
- आवश्यक credentials, permissions, या environment variables
- owner, source, version, changelog, downloads, stars, और अन्य भरोसे के संकेत

केवल वही सामग्री इंस्टॉल करें जिसे आप समझते और भरोसा करते हैं।

## ऑडिट स्थिति

ऑडिट स्थिति बताती है कि ऑडिट परिणाम पर आपको कैसे प्रतिक्रिया देनी चाहिए:

| स्थिति      | अर्थ                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | कम जोखिम से ऊपर कोई दिखाई देने वाली समस्या नहीं मिली।                                |
| `Review`    | इंस्टॉल करने से पहले निष्कर्ष पढ़ें। रिलीज़ फिर भी वैध हो सकती है। |
| `Warn`      | अतिरिक्त सावधानी बरतें। ClawHub को कोई उच्च-प्रभाव वाली चिंता या चेतावनी संकेत मिला। |
| `Malicious` | इंस्टॉल न करें।                                                           |
| `Pending`   | ऑडिट अभी समाप्त नहीं हुए हैं।                                             |
| `Error`     | ऑडिट पूरा नहीं किया जा सका।                                         |

`Pass` आश्वस्त करता है, लेकिन यह आपके अपने विवेक की जगह नहीं लेता। यह उन tools के लिए सबसे अधिक मायने रखता है जो सामग्री प्रकाशित कर सकते हैं, डेटा संपादित कर सकते हैं, commands चला सकते हैं, फ़ाइलें पढ़ सकते हैं, या production systems तक पहुंच सकते हैं।

## जोखिम स्तर

जोखिम स्तर blast radius का वर्णन करता है: यदि आप रिलीज़ को उसके इच्छित तरीके से उपयोग करें, तो उसके पास कितनी शक्ति प्रतीत होती है।

| जोखिम स्तर | अर्थ                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | कम संवेदनशील अधिकार या user impact मिला।                          |
| `Medium`   | रिलीज़ के पास अर्थपूर्ण अधिकार हैं, जैसे account access या data changes। |
| `High`     | रिलीज़ के पास उच्च-प्रभाव वाला अधिकार, गंभीर निष्कर्ष, या malicious signals हैं। |

जोखिम स्तर और ऑडिट स्थिति अलग-अलग प्रश्नों का उत्तर देते हैं:

- जोखिम स्तर पूछता है: "यहां कितनी शक्ति है?"
- ऑडिट स्थिति पूछती है: "मुझे इस परिणाम के साथ क्या करना चाहिए?"

उदाहरण के लिए, कोई publishing skill `Medium` जोखिम के साथ `Review` दिखा सकती है। इसका मतलब यह नहीं है कि वह malicious है। इसका मतलब है कि skill उद्देश्य के अनुरूप प्रतीत होती है, लेकिन अर्थपूर्ण account authority के साथ कार्य कर सकती है।

## निष्कर्ष

निष्कर्ष बताते हैं कि कोई ऑडिट परिणाम क्यों दिखाया गया। प्रत्येक निष्कर्ष में आमतौर पर शामिल होता है:

- इसका क्या अर्थ है
- इसे क्यों flag किया गया
- संबंधित skill या plugin सामग्री
- एक recommendation

निष्कर्षों को `Info`, `Low`, `Medium`, `High`, या `Critical` लेबल दिया जा सकता है। अधिक severity वाले निष्कर्ष जोखिम स्तर और ऑडिट स्थिति में अधिक मजबूती से योगदान करते हैं।

कम-confidence वाले निष्कर्ष public audit rollup से छिपाए जाते हैं ताकि पेज उपयोगी evidence पर केंद्रित रहे।

## ClawHub क्या जांचता है

ClawHub जमा किए गए release artifacts का ऑडिट करता है, जिनमें शामिल हैं:

- skill instructions या plugin metadata
- घोषित environment variables और permissions
- install instructions और package metadata
- शामिल files और file manifests
- compatibility और capability metadata

मुख्य प्रश्न coherence है: क्या name, summary, metadata, requested authority, और actual content उस चीज़ से मेल खाते हैं जिसकी users उचित रूप से अपेक्षा करेंगे?

शक्तिशाली behavior अपने आप खराब नहीं होता। कई उपयोगी tools को credentials, local commands, provider APIs, या package installs की आवश्यकता होती है। ऑडिट जांचता है कि वह शक्ति expected, disclosed, और proportionate है या नहीं।

Artifact pages पूरे ऑडिट से यहां link करते हैं:

```text
/<owner>/skills/<slug>/security-audit
```

ऑडिट पेज जोड़ता है:

1. SkillSpector
2. VirusTotal
3. जोखिम विश्लेषण

## VirusTotal

ClawHub ऑडिट stack में VirusTotal को malware telemetry के रूप में उपयोग करता है। VirusTotal file reputation और malware scanning के लिए एक trusted industry standard है, और हमारी partnership ClawHub को skill और plugin review में व्यापक security intelligence जोड़ने देती है।

VirusTotal खास तौर पर known malicious artifacts, engine hits, और reputation signals के लिए उपयोगी है, जो ClawHub की agent-aware review को पूरक बनाते हैं। जब vendor engine counts उपलब्ध होते हैं, तो ऑडिट उन्हें सरल भाषा में summarize करता है, जैसे:

```text
62/62 vendors flagged this skill as clean.
```

या:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

जब ClawHub के पास summarize करने के लिए कोई vendor-count telemetry नहीं होती, तो ऑडिट कहता है:

```text
No VirusTotal findings
```

VirusTotal telemetry बना रहता है। यह ClawHub के अपने artifact-aware risk analysis की जगह नहीं लेता।

## जोखिम विश्लेषण

जोखिम विश्लेषण आंतरिक रूप से ClawScan, ClawHub के अपने security audit system, द्वारा संचालित होता है। यह प्रत्येक रिलीज़ की agent-facing artifact के रूप में समीक्षा करता है: instructions, metadata, declared permissions, files, capability signals, static scan signals, SkillSpector findings, VirusTotal telemetry, और publisher-provided context। Static scan signals इस review के लिए internal context हैं; वे standalone public audit section या install-blocking verdict नहीं हैं।

जोखिम विश्लेषण
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
को prompt injection, tool misuse, credential exposure, unsafe execution, memory या context poisoning, और excessive agency जैसे जोखिमों के लिए lens के रूप में उपयोग करता है।

ClawScan किसी डरावनी दिखने वाली capability को अपने आप malicious नहीं मानता। यह पूछता है कि capability disclosed, purpose-aligned, और release के stated use case द्वारा supported है या नहीं।
