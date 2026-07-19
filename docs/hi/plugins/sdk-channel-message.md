---
summary: /plugins/sdk-channel-outbound पर रीडायरेक्ट करें
title: चैनल संदेश API
x-i18n:
    generated_at: "2026-07-19T09:08:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

यह पृष्ठ [चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) पर स्थानांतरित हो गया है।

`openclaw/plugin-sdk/channel-message` और
`openclaw/plugin-sdk/channel-message-runtime` पुराने plugins के लिए अप्रचलित संगतता
उपपथ बने हुए हैं; दोनों साझा चैनल संदेश कोर के सरल उपनाम हैं।
नए चैनल plugins को अप्रचलित उपपथों में नए हेल्पर जोड़ने के बजाय
संदेश जीवनचक्र, रसीद, टिकाऊ प्रेषण और लाइव पूर्वावलोकन हेल्पर के लिए
`openclaw/plugin-sdk/channel-outbound` का उपयोग करना चाहिए।

हटाने की योजना: बाहरी plugin माइग्रेशन अवधि के दौरान इन उपनामों को बनाए रखें,
फिर कॉलर के `channel-outbound` पर स्थानांतरित हो जाने के बाद अगले प्रमुख SDK
क्लीनअप में इन्हें हटा दें।
