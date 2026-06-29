---
read_when:
    - सुरक्षा रिपोर्ट या संदिग्ध सुरक्षा घटना का जवाब देना
    - समन्वित प्रकटीकरण या पैचयुक्त सुरक्षा रिलीज़ की तैयारी
    - घटना के बाद की अनुवर्ती अपेक्षाओं की समीक्षा करना
summary: OpenClaw सुरक्षा घटनाओं की छंटाई, प्रतिक्रिया और अनुवर्ती कार्रवाई कैसे करता है
title: घटना प्रतिक्रिया
x-i18n:
    generated_at: "2026-06-29T00:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
---

## 1. पहचान और ट्रायज

हम सुरक्षा संकेतों की निगरानी इनसे करते हैं:

- GitHub Security Advisories (GHSA) और निजी भेद्यता रिपोर्ट।
- सार्वजनिक GitHub मुद्दे/चर्चाएँ, जब रिपोर्ट संवेदनशील न हों।
- स्वचालित संकेत (उदाहरण के लिए Dependabot, CodeQL, npm advisories, और secret scanning)।

प्रारंभिक ट्रायज:

1. प्रभावित घटक, संस्करण, और विश्वास-सीमा प्रभाव की पुष्टि करें।
2. repository `SECURITY.md` scope और out-of-scope rules का उपयोग करके security issue बनाम hardening/no-action के रूप में वर्गीकृत करें।
3. incident owner तदनुसार प्रतिक्रिया देता है।

## 2. आकलन

गंभीरता मार्गदर्शिका:

- **Critical:** Package/release/repository compromise, active exploitation, या unauthenticated trust-boundary bypass जिसके साथ उच्च-प्रभाव नियंत्रण या data exposure हो।
- **High:** सीमित preconditions की आवश्यकता वाला सत्यापित trust-boundary bypass (उदाहरण के लिए authenticated but unauthorized high-impact action), या OpenClaw-owned sensitive credentials का exposure।
- **Medium:** व्यावहारिक प्रभाव वाली महत्वपूर्ण security weakness, लेकिन सीमित exploitability या पर्याप्त prerequisites के साथ।
- **Low:** Defense-in-depth findings, संकीर्ण दायरे वाला denial-of-service, या demonstrated trust-boundary bypass के बिना hardening/parity gaps।

## 3. प्रतिक्रिया

1. रिपोर्टर को प्राप्ति की पुष्टि दें (संवेदनशील होने पर निजी रूप से)।
2. supported releases और नवीनतम `main` पर पुनरुत्पादित करें, फिर regression coverage के साथ patch लागू और validate करें।
3. critical/high incidents के लिए, patched release(s) जितनी जल्दी व्यावहारिक हो तैयार करें।
4. medium/low incidents के लिए, normal release flow में patch करें और mitigation guidance दस्तावेज़ित करें।

## 4. संचार

हम इनके माध्यम से संचार करते हैं:

- प्रभावित repository में GitHub Security Advisories।
- fixed versions के लिए release notes/changelog entries।
- status और resolution पर direct reporter follow-up।

Disclosure policy:

- Critical/high incidents को coordinated disclosure मिलना चाहिए, उपयुक्त होने पर CVE issuance के साथ।
- Low-risk hardening findings को impact और user exposure के आधार पर CVE के बिना release notes या advisories में दस्तावेज़ित किया जा सकता है।

## 5. रिकवरी और फ़ॉलो-अप

fix ship करने के बाद:

1. CI और release artifacts में remediations सत्यापित करें।
2. एक छोटा post-incident review चलाएँ (timeline, root cause, detection gap, prevention plan)।
3. follow-up hardening/tests/docs tasks जोड़ें और उन्हें completion तक track करें।
