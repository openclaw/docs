---
read_when:
    - क्रेडेंशियल टोकन, API कुंजियाँ, या क्रेडेंशियल स्निपेट शामिल करने वाले दस्तावेज़ लिखना
    - उन उदाहरणों को अपडेट करना जिन्हें secret-detection tooling द्वारा स्कैन किया जा सकता है
summary: दस्तावेज़ों और उदाहरणों के लिए सीक्रेट-स्कैनर-सुरक्षित प्लेसहोल्डर परंपराएँ
title: गोपनीय प्लेसहोल्डर परंपराएँ
x-i18n:
    generated_at: "2026-06-29T00:08:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# गुप्त प्लेसहोल्डर परंपराएँ

ऐसे प्लेसहोल्डर का उपयोग करें जो मनुष्यों द्वारा पढ़े जा सकें, लेकिन वास्तविक गुप्त मानों जैसे न दिखें।

## अनुशंसित शैली

- `example-openai-key-not-real` या `example-discord-bot-token` जैसे वर्णनात्मक मानों को प्राथमिकता दें।
- shell स्निपेट के लिए, inline token-जैसी स्ट्रिंग के बजाय `${OPENAI_API_KEY}` को प्राथमिकता दें।
- उदाहरणों को स्पष्ट रूप से नकली और उद्देश्य तक सीमित रखें (provider, channel, auth type)।

## docs में इन पैटर्न से बचें

- शाब्दिक PEM निजी-key header या footer टेक्स्ट।
- ऐसे prefixes जो live credentials जैसे दिखें, उदाहरण के लिए `sk-...`, `xoxb-...`, `AKIA...`।
- runtime logs से कॉपी किए गए यथार्थवादी दिखने वाले bearer tokens।

## उदाहरण

```bash
# अच्छा
export OPENAI_API_KEY="example-openai-key-not-real"

# बेहतर (जब doc env wiring के बारे में हो)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
