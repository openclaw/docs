---
read_when:
    - अनुपस्थित ऑपरेटर स्कोप त्रुटियों की डीबगिंग
    - डिवाइस या Node पेयरिंग अनुमोदनों की समीक्षा करना
    - Gateway RPC विधियाँ जोड़ना या वर्गीकृत करना
summary: Gateway क्लाइंट्स के लिए ऑपरेटर भूमिकाएँ, स्कोप, और approval-time जाँचें
title: ऑपरेटर स्कोप
x-i18n:
    generated_at: "2026-06-28T23:11:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

ऑपरेटर स्कोप यह परिभाषित करते हैं कि प्रमाणीकरण के बाद कोई Gateway क्लाइंट क्या कर सकता है।
वे एक विश्वसनीय Gateway ऑपरेटर डोमेन के भीतर control-plane guardrail हैं,
hostile multi-tenant isolation नहीं। यदि आपको लोगों, टीमों या मशीनों के बीच मजबूत अलगाव चाहिए, तो अलग OS users या hosts के अंतर्गत अलग-अलग Gateways चलाएं।

संबंधित: [सुरक्षा](/hi/gateway/security), [Gateway protocol](/hi/gateway/protocol),
[Gateway pairing](/hi/gateway/pairing), [डिवाइस CLI](/hi/cli/devices).

## भूमिकाएं

Gateway WebSocket क्लाइंट एक भूमिका के साथ कनेक्ट करते हैं:

- `operator`: control-plane क्लाइंट जैसे CLI, Control UI, automation, और
  विश्वसनीय helper processes.
- `node`: capability hosts जैसे macOS, iOS, Android, या headless nodes जो
  `node.invoke` के माध्यम से commands उजागर करते हैं।

Operator RPC methods के लिए `operator` भूमिका आवश्यक है। Node-originated methods के लिए
`node` भूमिका आवश्यक है।

## स्कोप स्तर

| स्कोप                   | अर्थ                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | केवल-पठन status, lists, catalog, logs, session reads, और अन्य non-mutating control-plane calls.                                                                                    |
| `operator.write`        | सामान्य mutating operator actions जैसे messages भेजना, tools invoke करना, talk/voice settings अपडेट करना, और node command relay. `operator.read` को भी संतुष्ट करता है।                      |
| `operator.admin`        | प्रशासनिक control-plane access. हर `operator.*` scope को संतुष्ट करता है। config mutation, updates, native hooks, sensitive reserved namespaces, और high-risk approvals के लिए आवश्यक। |
| `operator.pairing`      | Device और node pairing management, जिसमें pairing records या device tokens को list करना, approve करना, reject करना, remove करना, rotate करना, और revoke करना शामिल है।                                       |
| `operator.approvals`    | Exec और plugin approval APIs.                                                                                                                                                        |
| `operator.talk.secrets` | secrets सहित Talk configuration पढ़ना।                                                                                                                                     |

अज्ञात भविष्य के `operator.*` scopes के लिए exact match आवश्यक है, जब तक caller के पास
`operator.admin` न हो।

## Method scope केवल पहला gate है

हर Gateway RPC का एक least-privilege method scope होता है। वह method scope तय करता है
कि request handler तक पहुंच सकती है या नहीं। कुछ handlers फिर approve या mutate की जा रही
ठोस चीज़ के आधार पर अधिक कठोर approval-time checks लागू करते हैं।

उदाहरण:

- `device.pair.approve` `operator.pairing` के साथ reachable है, लेकिन किसी
  operator device को approve करना केवल वही scopes mint या preserve कर सकता है जो caller के पास पहले से हैं।
- `node.pair.approve` `operator.pairing` के साथ reachable है, फिर pending node command list से
  अतिरिक्त approval scopes derive करता है।
- `chat.send` सामान्यतः write-scoped method है, लेकिन persistent `/config set`
  और `/config unset` के लिए command level पर `operator.admin` आवश्यक है।

यह lower-scope operators को सभी pairing approval को admin-only बनाए बिना
low-risk pairing actions करने देता है।

## Device pairing approvals

Device pairing records approved roles और scopes का durable source हैं।
पहले से paired devices को चुपचाप व्यापक access नहीं मिलता: reconnects जो
broader role या broader scopes मांगते हैं, एक नई pending upgrade request बनाते हैं।

Device request approve करते समय:

- बिना operator role वाली request को operator token scope approval की आवश्यकता नहीं होती।
- किसी non-operator device role, जैसे `node`, के लिए request को
  `operator.admin` चाहिए, भले ही `device.pair.approve`
  `operator.pairing` के साथ reachable हो।
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing`, या `operator.talk.secrets` के लिए request में caller के पास
  वे scopes, या `operator.admin`, होना आवश्यक है।
- `operator.admin` के लिए request को `operator.admin` चाहिए।
- बिना explicit scopes वाली repair request मौजूदा operator
  token scopes inherit कर सकती है। यदि वह मौजूदा token admin-scoped है, तो approval के लिए फिर भी
  `operator.admin` आवश्यक है।

Non-admin shared-secret और trusted-proxy sessions operator-device
requests को केवल अपने घोषित operator scopes के भीतर approve कर सकते हैं। Non-operator
roles approve करना admin-only है, भले ही वे sessions अन्यथा
`operator.pairing` का उपयोग कर सकते हों।

Paired-device token sessions के लिए, management भी self-scoped है जब तक
caller के पास `operator.admin` न हो: non-admin callers केवल अपनी pairing
entries देखते हैं, केवल अपनी pending request approve या reject कर सकते हैं, और केवल अपनी device entry
rotate, revoke, या remove कर सकते हैं।

## Node pairing approvals

Legacy `node.pair.*` एक अलग Gateway-owned node pairing store का उपयोग करता है। WS nodes
`role: node` के साथ device pairing का उपयोग करते हैं, लेकिन वही approval-level vocabulary
लागू होती है।

`node.pair.approve` pending request command list का उपयोग करके अतिरिक्त
required scopes derive करता है:

- Commandless request: `operator.pairing`
- Non-exec node commands: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, या `system.which`:
  `operator.pairing` + `operator.admin`

Node pairing identity और trust स्थापित करता है। यह node की
अपनी `system.run` exec approval policy को replace नहीं करता।

## Shared-secret auth

Shared gateway token/password auth को उस Gateway के लिए trusted operator access माना जाता है।
OpenAI-compatible HTTP surfaces, `/tools/invoke`, और HTTP session
history endpoints shared-secret bearer auth के लिए सामान्य full operator default scope set को restore करते हैं,
भले ही caller narrower declared scopes भेजे।

Identity-bearing modes, जैसे trusted proxy auth या private-ingress `none`,
फिर भी explicit declared scopes का सम्मान कर सकते हैं। वास्तविक trust
boundary separation के लिए अलग Gateways का उपयोग करें।
