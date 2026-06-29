---
read_when:
    - आप सुरक्षा निष्कर्षों या खतरे के परिदृश्यों में योगदान देना चाहते हैं
    - थ्रेट मॉडल की समीक्षा करना या उसे अद्यतन करना
summary: OpenClaw खतरा मॉडल में योगदान कैसे करें
title: खतरा मॉडल में योगदान देना
x-i18n:
    generated_at: "2026-06-29T00:11:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

OpenClaw को अधिक सुरक्षित बनाने में मदद करने के लिए धन्यवाद। यह खतरा मॉडल एक जीवंत दस्तावेज़ है और हम किसी से भी योगदान का स्वागत करते हैं - आपको सुरक्षा विशेषज्ञ होने की आवश्यकता नहीं है।

## योगदान करने के तरीके

### खतरा जोड़ें

क्या आपने कोई आक्रमण वेक्टर या जोखिम देखा है जिसे हमने कवर नहीं किया है? [openclaw/trust](https://github.com/openclaw/trust/issues) पर एक issue खोलें और उसे अपने शब्दों में वर्णित करें। आपको किसी framework को जानने या हर फ़ील्ड भरने की आवश्यकता नहीं है - बस परिदृश्य का वर्णन करें।

**शामिल करना उपयोगी है (लेकिन आवश्यक नहीं):**

- आक्रमण परिदृश्य और उसका दुरुपयोग कैसे किया जा सकता है
- OpenClaw के कौन से हिस्से प्रभावित हैं (CLI, Gateway, चैनल, ClawHub, MCP सर्वर आदि)
- आपको लगता है कि यह कितना गंभीर है (कम / मध्यम / उच्च / गंभीर)
- संबंधित शोध, CVE, या वास्तविक दुनिया के उदाहरणों के कोई भी लिंक

हम समीक्षा के दौरान ATLAS मैपिंग, खतरा IDs, और जोखिम मूल्यांकन संभालेंगे। यदि आप वे विवरण शामिल करना चाहते हैं, तो अच्छा है - लेकिन इसकी अपेक्षा नहीं है।

> **यह खतरा मॉडल में जोड़ने के लिए है, लाइव vulnerabilities रिपोर्ट करने के लिए नहीं।** यदि आपको कोई exploitable vulnerability मिली है, तो responsible disclosure निर्देशों के लिए हमारा [Trust पेज](https://trust.openclaw.ai) देखें।

### शमन सुझाएँ

क्या आपके पास किसी मौजूदा खतरे को संबोधित करने का विचार है? उस खतरे का संदर्भ देते हुए कोई issue या PR खोलें। उपयोगी शमन विशिष्ट और कार्रवाई योग्य होते हैं - उदाहरण के लिए, "Gateway पर प्रति-sender 10 messages/minute की rate limiting" "rate limiting लागू करें" से बेहतर है।

### आक्रमण श्रृंखला प्रस्तावित करें

आक्रमण श्रृंखलाएँ दिखाती हैं कि कई खतरे मिलकर एक वास्तविक आक्रमण परिदृश्य कैसे बनाते हैं। यदि आपको कोई खतरनाक संयोजन दिखता है, तो चरणों का वर्णन करें और बताएँ कि कोई attacker उन्हें कैसे chain करेगा। व्यवहार में आक्रमण कैसे सामने आता है, इसका एक छोटा narrative किसी औपचारिक template से अधिक मूल्यवान है।

### मौजूदा सामग्री ठीक करें या सुधारें

टाइपो, स्पष्टीकरण, पुरानी जानकारी, बेहतर उदाहरण - PRs स्वागत योग्य हैं, issue की आवश्यकता नहीं है।

## हम क्या उपयोग करते हैं

### MITRE ATLAS framework

यह खतरा मॉडल [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems) पर बनाया गया है, जो prompt injection, tool misuse, और agent exploitation जैसे AI/ML खतरों के लिए विशेष रूप से डिज़ाइन किया गया framework है। योगदान देने के लिए आपको ATLAS जानने की आवश्यकता नहीं है - हम समीक्षा के दौरान submissions को framework से map करते हैं।

### खतरा ids

हर खतरे को `T-EXEC-003` जैसा ID मिलता है। श्रेणियाँ ये हैं:

| Code    | श्रेणी                                      |
| ------- | ------------------------------------------ |
| RECON   | टोह - जानकारी एकत्र करना                   |
| ACCESS  | प्रारंभिक पहुँच - प्रवेश प्राप्त करना      |
| EXEC    | निष्पादन - दुर्भावनापूर्ण actions चलाना    |
| PERSIST | दृढ़ता - पहुँच बनाए रखना                   |
| EVADE   | रक्षा चकमा - detection से बचना             |
| DISC    | Discovery - environment के बारे में जानना  |
| EXFIL   | Exfiltration - डेटा चोरी करना              |
| IMPACT  | प्रभाव - क्षति या व्यवधान                  |

IDs समीक्षा के दौरान maintainers द्वारा assigned किए जाते हैं। आपको एक चुनने की आवश्यकता नहीं है।

### जोखिम स्तर

| स्तर         | अर्थ                                                             |
| ------------ | ---------------------------------------------------------------- |
| **गंभीर**    | पूरा system compromise, या उच्च संभावना + गंभीर प्रभाव           |
| **उच्च**     | महत्वपूर्ण क्षति की संभावना, या मध्यम संभावना + गंभीर प्रभाव    |
| **मध्यम**    | मध्यम जोखिम, या कम संभावना + उच्च प्रभाव                        |
| **कम**       | असंभावित और सीमित प्रभाव                                        |

यदि आप जोखिम स्तर के बारे में निश्चित नहीं हैं, तो बस प्रभाव का वर्णन करें और हम उसका मूल्यांकन करेंगे।

## समीक्षा प्रक्रिया

1. **Triage** - हम 48 घंटों के भीतर नए submissions की समीक्षा करते हैं
2. **मूल्यांकन** - हम feasibility verify करते हैं, ATLAS mapping और threat ID assign करते हैं, जोखिम स्तर validate करते हैं
3. **Documentation** - हम सुनिश्चित करते हैं कि सब कुछ formatted और complete है
4. **Merge** - खतरा मॉडल और visualization में जोड़ा गया

## संसाधन

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/hi/security/THREAT-MODEL-ATLAS)

## संपर्क

- **Security vulnerabilities:** रिपोर्टिंग निर्देशों के लिए हमारा [Trust पेज](https://trust.openclaw.ai) देखें
- **खतरा मॉडल प्रश्न:** [openclaw/trust](https://github.com/openclaw/trust/issues) पर एक issue खोलें
- **सामान्य चैट:** Discord #security चैनल

## मान्यता

खतरा मॉडल में योगदानकर्ताओं को महत्वपूर्ण योगदानों के लिए खतरा मॉडल acknowledgments, release notes, और OpenClaw security hall of fame में मान्यता दी जाती है।

## संबंधित

- [खतरा मॉडल](/hi/security/THREAT-MODEL-ATLAS)
- [Formal verification](/hi/security/formal-verification)
