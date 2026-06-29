---
read_when:
    - Gateway प्रक्रिया चलाना या डीबग करना
    - एकल-इंस्टेंस प्रवर्तन की जाँच
summary: WebSocket listener bind का उपयोग करने वाला Gateway singleton guard
title: Gateway लॉक
x-i18n:
    generated_at: "2026-06-28T23:09:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 85a1cb55f08d47d36fde25900e4247ef01c9a6800bf017fbff44a337f299ce13
    source_path: gateway/gateway-lock.md
    workflow: 16
---

## क्यों

- सुनिश्चित करें कि उसी होस्ट पर प्रति बेस पोर्ट केवल एक Gateway इंस्टेंस चले; अतिरिक्त Gateway को अलग-थलग प्रोफ़ाइल और अद्वितीय पोर्ट का उपयोग करना होगा।
- क्रैश/SIGKILL के बाद भी stale लॉक फ़ाइलें छोड़े बिना जारी रहें।
- जब कंट्रोल पोर्ट पहले से व्यस्त हो, तो स्पष्ट त्रुटि के साथ तुरंत विफल हों।

## तंत्र

- Gateway पहले स्टेट लॉक डायरेक्टरी के तहत प्रति-कॉन्फ़िग लॉक फ़ाइल प्राप्त करता है और किसी मौजूदा listener के लिए कॉन्फ़िगर किए गए पोर्ट की जांच करता है।
- यदि दर्ज किया गया लॉक owner समाप्त हो चुका है, पोर्ट खाली है, या लॉक stale है, तो startup लॉक को फिर से हासिल करता है और जारी रहता है।
- इसके बाद Gateway एक exclusive TCP listener का उपयोग करके HTTP/WebSocket listener (डिफ़ॉल्ट `ws://127.0.0.1:18789`) को bind करता है।
- यदि bind `EADDRINUSE` के साथ विफल होता है, तो startup `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` फेंकता है।
- shutdown पर Gateway HTTP/WebSocket server को बंद करता है और लॉक फ़ाइल हटाता है।

## त्रुटि सतह

- यदि कोई दूसरा process पोर्ट को hold कर रहा है, तो startup `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` फेंकता है।
- अन्य bind विफलताएं `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` के रूप में सामने आती हैं।

## संचालन संबंधी नोट्स

- यदि पोर्ट _किसी अन्य_ process द्वारा occupied है, तो त्रुटि वही रहती है; पोर्ट खाली करें या `openclaw gateway --port <port>` के साथ दूसरा चुनें।
- किसी service supervisor के तहत, नया Gateway process जो मौजूदा स्वस्थ `/healthz` responder देखता है, उस process को नियंत्रण में रहने देता है। systemd पर, duplicate starter कोड 78 के साथ exit करता है ताकि डिफ़ॉल्ट `RestartPreventExitStatus=78` `Restart=always` को लॉक या `EADDRINUSE` conflict पर loop करने से रोक सके। यदि मौजूदा process कभी healthy नहीं बनता, तो retries सीमित रहती हैं और startup हमेशा loop करने के बजाय स्पष्ट लॉक त्रुटि के साथ विफल होता है।
- macOS app अभी भी Gateway spawn करने से पहले अपना हल्का PID guard बनाए रखता है; runtime लॉक को लॉक फ़ाइल और HTTP/WebSocket bind द्वारा enforce किया जाता है।

## संबंधित

- [एकाधिक Gateway](/hi/gateway/multiple-gateways) — अद्वितीय पोर्ट के साथ कई इंस्टेंस चलाना
- [समस्या निवारण](/hi/gateway/troubleshooting) — `EADDRINUSE` और पोर्ट conflicts का निदान करना
