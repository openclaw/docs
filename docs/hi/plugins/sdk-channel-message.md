---
summary: Redirect to /plugins/sdk-channel-outbound
title: चैनल संदेश API
x-i18n:
    generated_at: "2026-06-28T23:51:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

यह पेज [चैनल आउटबाउंड API](/hi/plugins/sdk-channel-outbound) पर स्थानांतरित हो गया है।

`openclaw/plugin-sdk/channel-message` और
`openclaw/plugin-sdk/channel-message-runtime` पुराने Plugin के लिए अप्रचलित संगतता
उप-पथ बने रहेंगे। नए चैनल Plugin को संदेश जीवनचक्र, रसीद, टिकाऊ
भेजने और लाइव पूर्वावलोकन हेल्पर के लिए
`openclaw/plugin-sdk/channel-outbound` का उपयोग करना चाहिए। अप्रचलित उप-पथ साझा
चैनल संदेश कोर और केंद्रित इनबाउंड/आउटबाउंड SDK सतहों पर पतले उपनाम हैं;
वहाँ नए हेल्पर न जोड़ें।

हटाने की योजना: इन उपनामों को बाहरी Plugin माइग्रेशन विंडो तक रखें,
फिर कॉलर के `channel-outbound` पर स्थानांतरित हो जाने के बाद अगले बड़े SDK क्लीनअप में
इन्हें हटा दें।
