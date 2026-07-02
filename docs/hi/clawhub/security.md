---
read_when:
    - ClawHub सुरक्षा समस्या की रिपोर्ट करना
    - ClawHub भेद्यता प्रकटीकरण को समझना
    - ClawHub प्लेटफ़ॉर्म समस्याओं को तृतीय-पक्ष skill या plugin समस्याओं से अलग करना
sidebarTitle: Security
summary: ClawHub सुरक्षा समस्याओं की रिपोर्ट कैसे करें और कमजोरियों का सार्वजनिक खुलासा कब किया जाता है।
title: सुरक्षा
x-i18n:
    generated_at: "2026-07-02T00:56:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# सुरक्षा

ClawHub सुरक्षा समस्याओं की रिपोर्ट `openclaw/clawhub` के लिए GitHub Security Advisories के माध्यम से की जा सकती है।

ClawHub में मौजूद कमजोरियों के लिए GitHub Security Advisories का उपयोग करें। अच्छी ClawHub advisory रिपोर्ट में इनसे जुड़े बग शामिल होते हैं:

- ClawHub वेबसाइट, API, या CLI
- registry publishing, downloads, installs, या artifact integrity
- authentication, authorization, या API tokens
- scanning, moderation, या report handling

किसी तृतीय-पक्ष skill या plugin के अपने source code में मौजूद कमजोरियों के लिए ClawHub advisories का उपयोग न करें। उनकी रिपोर्ट सीधे publisher या ClawHub listing से जुड़े source repository को करें।

## कमजोरी का खुलासा

क्योंकि ClawHub एक hosted cloud application है, ClawHub service vulnerabilities डिफ़ॉल्ट रूप से सार्वजनिक रूप से प्रकट नहीं की जातीं। उन्हें तब सार्वजनिक रूप से प्रकट किया जाता है जब वास्तविक user impact का प्रमाण हो या जब users को कार्रवाई करने की आवश्यकता हो।

वास्तविक user impact के उदाहरणों में confirmed exploitation, user data या secrets का exposure, platform failure के कारण users तक malicious content का पहुंचना, या कोई भी issue शामिल है जिसके लिए users को credentials rotate करने, local software update करने, या अन्य protective action लेने की आवश्यकता हो।

user-installed software में मौजूद कमजोरियों को सार्वजनिक रूप से प्रकट किया जाता है, जैसे ClawHub CLI packages, binaries, libraries, या अन्य release artifacts जिन्हें users को locally update करना होता है।

## संबंधित पृष्ठ

install-time audit labels, risk levels, findings, और interpretation के लिए, [Security Audits](/clawhub/security-audits) देखें।

marketplace reports, moderation holds, hidden listings, bans, और account standing के लिए, [Moderation and Account Safety](/clawhub/moderation) देखें।
