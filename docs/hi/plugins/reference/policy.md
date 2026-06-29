---
read_when:
    - आप नीति Plugin इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: कार्यस्थल अनुरूपता के लिए नीति-समर्थित doctor जाँचें जोड़ता है।
title: Policy Plugin
x-i18n:
    generated_at: "2026-06-28T23:48:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# नीति Plugin

वर्कस्पेस अनुरूपता के लिए नीति-समर्थित doctor जाँचें जोड़ता है।

## वितरण

- पैकेज: `@openclaw/policy`
- इंस्टॉल मार्ग: OpenClaw में शामिल

## सतह

plugin

<!-- openclaw-plugin-reference:manual-start -->

## व्यवहार

Policy plugin नीति-प्रबंधित OpenClaw
सेटिंग्स और शासित वर्कस्पेस घोषणाओं के लिए doctor स्वास्थ्य जाँचें योगदान करता है। Policy वर्तमान में चैनल
अनुरूपता, शासित टूल मेटाडेटा, MCP सर्वर स्थिति, मॉडल-प्रदाता स्थिति,
निजी-नेटवर्क पहुँच स्थिति, Gateway एक्सपोज़र स्थिति, एजेंट वर्कस्पेस/टूल
स्थिति, कॉन्फ़िगर की गई वैश्विक/प्रति-एजेंट टूल स्थिति, कॉन्फ़िगर की गई sandbox रनटाइम
स्थिति, इनग्रेस/चैनल पहुँच स्थिति, डेटा-हैंडलिंग स्थिति, और OpenClaw config secret
provider/auth profile स्थिति को कवर करती है।

Policy लिखी गई आवश्यकताओं को `policy.jsonc` में संग्रहीत करती है, मौजूदा
OpenClaw सेटिंग्स और वर्कस्पेस घोषणाओं को evidence के रूप में देखती है, और drift
को `openclaw policy check` और `openclaw doctor --lint` के माध्यम से रिपोर्ट करती है। एक clean policy
check नीति, evidence, findings, और attestation hashes उत्सर्जित करती है जिन्हें operators
audit के लिए रिकॉर्ड कर सकते हैं।

`openclaw policy compare --baseline <file>` एक policy file की दूसरी
policy file से तुलना करता है। यह केवल config-level conformance है: यह policy rule metadata
का उपयोग करके सत्यापित करता है कि जाँची गई policy लिखी गई
baseline से missing या weaker नहीं है, और यह runtime state, credentials, या secret values का निरीक्षण नहीं करता।

Tool posture rules approved profiles, workspace-only filesystem
tools, bounded exec security/ask/host settings, disabled elevated mode, exact
`alsoAllow` entries, और required tool deny entries की आवश्यकता रख सकते हैं। Evidence records
additive `alsoAllow` entries रिकॉर्ड करते हैं क्योंकि वे effective tool posture को चौड़ा कर सकते हैं।
ये जाँचें केवल config conformance देखती हैं; वे runtime approval
state नहीं पढ़तीं या runtime enforcement नहीं जोड़तीं।

Sandbox posture rules approved sandbox modes/backends की आवश्यकता रख सकते हैं, host
container networking को deny कर सकते हैं, container namespace joins को deny कर सकते हैं, read-only container
mounts की आवश्यकता रख सकते हैं, container runtime socket mounts और unconfined container profiles को deny कर सकते हैं,
और sandbox browser CDP source ranges की आवश्यकता रख सकते हैं।
ये जाँचें केवल config conformance देखती हैं; वे runtime approval
state नहीं पढ़तीं, live containers का निरीक्षण नहीं करतीं, या runtime enforcement नहीं जोड़तीं।

Data-handling rules sensitive logging redaction की आवश्यकता रख सकते हैं, telemetry
content capture को deny कर सकते हैं, session retention maintenance की आवश्यकता रख सकते हैं, और session
transcript memory indexing को deny कर सकते हैं। ये जाँचें केवल config conformance देखती हैं; वे
raw logs, telemetry exports, transcripts, memory files, secrets,
या personal data का निरीक्षण नहीं करतीं।

`scopes.<scopeName>` के अंतर्गत नामित policy scopes अपने सूचीबद्ध selector के लिए अधिक सख्त सामान्य policy
sections जोड़ सकते हैं। `agentIds` `tools`,
`agents.workspace`, `sandbox`, और `dataHandling.memory` का समर्थन करता है; `channelIds`
`ingress.channels` का समर्थन करता है।
Runtime agent ids जो `agents.list[]` में स्पष्ट रूप से सूचीबद्ध नहीं हैं, उन्हें बिना
evidence के चुपचाप पास करने के बजाय inherited global/default posture के विरुद्ध जाँचा जाता है।
`policy.jsonc` में मौजूद प्रत्येक scope अपने selector के लिए valid और enforceable
होना चाहिए। Overlay rules अतिरिक्त claims हैं, इसलिए वे
top-level policy को कमजोर नहीं करते और जब वही observed
config दोनों scopes का उल्लंघन करता है तो अपने findings उत्पन्न कर सकते हैं।

<!-- openclaw-plugin-reference:manual-end -->

## संबंधित दस्तावेज़

- [policy](/hi/cli/policy)
