---
read_when:
    - किसी वर्कस्पेस को मैन्युअल रूप से बूटस्ट्रैप करना
summary: HEARTBEAT.md के लिए वर्कस्पेस टेम्पलेट
title: HEARTBEAT.md टेम्पलेट
x-i18n:
    generated_at: "2026-07-19T09:50:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1605f546995e0bdcb11f9bf905173b14aca25cfad664fe2c7644d18c2b4142e2
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# HEARTBEAT.md टेम्पलेट

`HEARTBEAT.md` एजेंट कार्यस्थान में रहती है और आवधिक Heartbeat जाँच-सूची रखती है। इसे खाली रखें, या इसमें केवल रिक्त स्थान, Markdown टिप्पणियाँ, ATX शीर्षक, खाली सूची स्टब (`- `, `* [ ]`), या फ़ेंस मार्कर रखें, ताकि OpenClaw Heartbeat मॉडल कॉल को पूरी तरह छोड़ दे (`reason=empty-heartbeat-file`)।

प्रेषित डिफ़ॉल्ट सामग्री:

```markdown
<!-- Heartbeat template; comments-only content prevents scheduled heartbeat API calls. -->

# Heartbeat API कॉल छोड़ने के लिए इस फ़ाइल को खाली रखें (या इसमें केवल टिप्पणियाँ रखें)।

# जब आप चाहते हैं कि एजेंट समय-समय पर किसी चीज़ की जाँच करे, तो नीचे कार्य जोड़ें।
```

केवल तभी टिप्पणी पंक्तियों के नीचे छोटे कार्य जोड़ें, जब आप आवधिक जाँच चाहते हों। इसे छोटा रखें: Heartbeat रन हर टिक पर इस फ़ाइल को पढ़ते हैं (डिफ़ॉल्ट रूप से हर 30 मिनट में), इसलिए अनावश्यक रूप से लंबे निर्देश हर बार सक्रिय होने पर टोकन खर्च करते हैं।

साधारण जाँच-सूची के बजाय केवल नियत जाँचों के लिए, प्रति-कार्य `interval` और `prompt` फ़ील्ड वाला संरचित `tasks:` ब्लॉक उपयोग करें; प्रारूप और व्यवहार के लिए [HEARTBEAT.md](/hi/gateway/heartbeat#heartbeatmd-optional) देखें।

## संबंधित

- [Heartbeat](/hi/gateway/heartbeat)
- [Heartbeat कॉन्फ़िगरेशन](/hi/gateway/config-agents)
