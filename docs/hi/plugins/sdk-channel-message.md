---
summary: /plugins/sdk-channel-outbound पर रीडायरेक्ट करें
title: चैनल संदेश API
x-i18n:
    generated_at: "2026-07-20T07:19:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf0d607bd3287233cbb1fe47c15958bf57a81267ae1e37e45a1881f56e1370cb
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

यह पृष्ठ [चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) पर स्थानांतरित हो गया है।

`openclaw/plugin-sdk/channel-message` पुराने plugins के लिए एक अप्रचलित संगतता
उपपथ बना हुआ है। नए चैनल plugins को अप्रचलित उपपथ में नए सहायक जोड़ने के बजाय
संदेश जीवनचक्र, रसीद, टिकाऊ प्रेषण और लाइव पूर्वावलोकन सहायकों के लिए
`openclaw/plugin-sdk/channel-outbound` का उपयोग करना चाहिए।

हटाने की योजना: बाहरी plugin माइग्रेशन अवधि के दौरान इन उपनामों को बनाए रखें,
फिर कॉलर के `channel-outbound` पर स्थानांतरित हो जाने के बाद अगले प्रमुख SDK
क्लीनअप में इन्हें हटा दें।
