---
read_when:
    - BOOT.md चेकलिस्ट जोड़ना
summary: BOOT.md के लिए कार्यस्थान टेम्पलेट
title: BOOT.md टेम्पलेट
x-i18n:
    generated_at: "2026-07-16T17:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

यहाँ संक्षिप्त और स्पष्ट स्टार्टअप निर्देश जोड़ें। यदि यह फ़ाइल मौजूद है और इसमें गैर-रिक्त-स्पेस सामग्री है, तो बंडल किया गया `boot-md` हुक gateway के हर बार शुरू होने पर प्रत्येक एजेंट वर्कस्पेस के लिए इस फ़ाइल को एक बार चलाता है। एक वर्कस्पेस साझा करने वाले कई एजेंट केवल एक बार इसे चलाते हैं।

हुक डिफ़ॉल्ट रूप से अक्षम रहता है। पहले इसे सक्षम करें:

```bash
openclaw hooks enable boot-md
```

यदि चेकलिस्ट का कोई आइटम संदेश भेजता है, तो मैसेज टूल का उपयोग करें, फिर ठीक साइलेंट टोकन `NO_REPLY` के साथ उत्तर दें (अक्षरों के केस से अप्रभावित)।

## संबंधित

- [एजेंट वर्कस्पेस](/hi/concepts/agent-workspace)
- [हुक](/hi/automation/hooks#boot-md)
