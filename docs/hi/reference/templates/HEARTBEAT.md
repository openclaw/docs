---
read_when:
    - कार्यस्थान को मैन्युअल रूप से बूटस्ट्रैप करना
summary: HEARTBEAT.md के लिए कार्यक्षेत्र टेम्पलेट
title: HEARTBEAT.md टेम्पलेट
x-i18n:
    generated_at: "2026-06-29T00:10:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md टेम्पलेट

`HEARTBEAT.md` एजेंट कार्यक्षेत्र में रहता है। जब आप चाहते हैं कि OpenClaw heartbeat मॉडल कॉल छोड़ दे, तो फ़ाइल को खाली रखें, या केवल Markdown टिप्पणियों और शीर्षकों के साथ रखें।

डिफ़ॉल्ट runtime टेम्पलेट है:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

टिप्पणियों के नीचे छोटे कार्य केवल तब जोड़ें जब आप चाहते हैं कि एजेंट समय-समय पर कुछ जांचे। heartbeat निर्देश छोटे रखें क्योंकि वे आवर्ती जागरणों के दौरान पढ़े जाते हैं।

## संबंधित

- [Heartbeat कॉन्फ़िगरेशन](/hi/gateway/config-agents)
