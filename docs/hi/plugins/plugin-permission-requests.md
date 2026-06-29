---
read_when:
    - किसी साइड इफ़ेक्ट के चलने से पहले पूछने के लिए आपको एक Plugin हुक या उपकरण चाहिए
    - आपको कॉन्फ़िगर करना होगा कि Plugin अनुमोदन प्रॉम्प्ट कहाँ डिलीवर किए जाएँ
    - आप वैकल्पिक टूल, exec अनुमोदनों और Plugin अनुमोदनों के बीच निर्णय ले रहे हैं
sidebarTitle: Permission requests
summary: उपयोगकर्ताओं से Plugin टूल कॉल्स और Plugin-स्वामित्व वाले अनुमति प्रॉम्प्ट को मंज़ूरी देने के लिए कहें
title: Plugin अनुमति अनुरोध
x-i18n:
    generated_at: "2026-06-28T23:39:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin अनुमति अनुरोधों से Plugin कोड किसी टूल कॉल या Plugin-स्वामित्व वाले
ऑपरेशन को तब तक रोक सकता है जब तक कोई उपयोगकर्ता उसे स्वीकृत या अस्वीकृत न कर दे। वे Gateway
`plugin.approval.*` फ़्लो और उन्हीं स्वीकृति UI सतहों का उपयोग करते हैं जो चैट
स्वीकृति बटन और `/approve` कमांड संभालती हैं।

Plugin/app अनुमतियों के लिए Plugin अनुमति अनुरोधों का उपयोग करें। वे
होस्ट exec स्वीकृतियों, वैकल्पिक टूल अनुमति-सूचियों, या Codex की मूल अनुमति
समीक्षा को प्रतिस्थापित नहीं करते।

## सही गेट चुनें

आपको जिस निर्णय बिंदु की आवश्यकता है, उससे मेल खाने वाला गेट चुनें:

| गेट                              | इसका उपयोग कब करें                                                       | यह क्या नियंत्रित करता है                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| वैकल्पिक टूल                    | उपयोगकर्ता के ऑप्ट इन करने तक कोई टूल मॉडल को दिखाई नहीं देना चाहिए।    | `tools.allow` के माध्यम से टूल प्रदर्शन।                                                                         |
| Plugin अनुमति अनुरोध             | किसी Plugin हुक या Plugin-स्वामित्व वाले ऑपरेशन को एक क्रिया चलने से पहले पूछना होगा। | `plugin.approval.*` के माध्यम से रनटाइम स्वीकृति।                                                                |
| Exec स्वीकृतियां                 | किसी होस्ट कमांड या shell-जैसे टूल को ऑपरेटर स्वीकृति चाहिए।             | होस्ट exec नीति और टिकाऊ exec अनुमति-सूचियां।                                                                    |
| Codex मूल अनुमति अनुरोध          | Codex मूल shell, फ़ाइल, MCP, या app-server क्रियाओं से पहले पूछता है।     | Codex app-server या मूल हुक स्वीकृति हैंडलिंग, जब OpenClaw प्रॉम्प्ट का स्वामी हो तो Plugin स्वीकृतियों के माध्यम से रूट की जाती है। |
| MCP स्वीकृति अनुरोध              | कोई Codex MCP सर्वर किसी टूल कॉल के लिए स्वीकृति मांगता है।              | OpenClaw Plugin स्वीकृतियों के माध्यम से ब्रिज किए गए MCP स्वीकृति जवाब।                                         |

वैकल्पिक टूल discovery-time गेट हैं। Plugin अनुमति अनुरोध
per-call गेट हैं। दोनों का उपयोग तब करें जब किसी संवेदनशील टूल को मॉडल के
उसे देखने से पहले स्पष्ट ऑप्ट इन और क्रिया चलने से पहले स्वीकृति की आवश्यकता हो।

## टूल कॉल से पहले स्वीकृति मांगें

अधिकांश Plugin-लेखित प्रॉम्प्ट `before_tool_call` हुक में शुरू होने चाहिए। यह हुक
मॉडल द्वारा टूल चुनने के बाद और OpenClaw द्वारा उसे चलाने से पहले चलता है:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

प्रॉम्प्ट टेक्स्ट उस व्यक्ति के लिए लिखें जो क्रिया को स्वीकृत करेगा:

- `title` को छोटा और क्रिया-केंद्रित रखें। Gateway अधिकतम 80
  वर्ण स्वीकार करता है।
- `description` को विशिष्ट और सीमित रखें। Gateway अधिकतम 256
  वर्ण स्वीकार करता है।
- क्रिया, लक्ष्य, और जोखिम शामिल करें। ऐसे रहस्य, टोकन, या
  निजी payload शामिल न करें जो चैट स्वीकृति सतहों में दिखाई नहीं देने चाहिए।
- `severity: "critical"` का उपयोग केवल उन क्रियाओं के लिए करें जहां गलत निर्णय
  production क्षति या डेटा हानि का कारण बन सकता है।
- जब उस क्रिया के लिए स्थायी भरोसा असुरक्षित हो, तो `allowedDecisions: ["allow-once", "deny"]`
  का उपयोग करें।

## निर्णय व्यवहार

OpenClaw `plugin:` ID के साथ एक लंबित स्वीकृति बनाता है, उसे
उपलब्ध स्वीकृति सतहों तक पहुंचाता है, और निर्णय की प्रतीक्षा करता है।

| निर्णय           | परिणाम                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| `allow-once`     | वर्तमान कॉल जारी रहती है।                                                |
| `allow-always`   | वर्तमान कॉल जारी रहती है और निर्णय Plugin को पास किया जाता है।           |
| `deny`           | कॉल अस्वीकृत टूल परिणाम के साथ ब्लॉक कर दी जाती है।                      |
| Timeout          | जब तक `timeoutBehavior` `"allow"` न हो, कॉल ब्लॉक कर दी जाती है।          |
| रद्दीकरण         | रन abort होने पर कॉल ब्लॉक कर दी जाती है।                                 |
| कोई स्वीकृति रूट नहीं | कॉल ब्लॉक कर दी जाती है क्योंकि कोई कनेक्टेड स्वीकृति सतह इसे resolve नहीं कर सकती। |

`allow-always` केवल तब टिकाऊ होता है जब अनुरोध करने वाला Plugin या रनटाइम
उस persistence को लागू करता है। सामान्य `before_tool_call.requireApproval` हुक के लिए,
OpenClaw `allow-once` और `allow-always` को वर्तमान कॉल के लिए स्वीकृति निर्णय
मानता है और resolved मान को `onResolution` में पास करता है। यदि आपका Plugin
`allow-always` प्रदान करता है, तो दस्तावेज़ित और लागू करें कि वह भविष्य की किन कॉलों पर
भरोसा करता है।

यदि हुक `params` भी लौटाता है, तो OpenClaw उन parameter बदलावों को केवल
स्वीकृति सफल होने के बाद लागू करता है। कम प्राथमिकता वाला हुक अब भी
उच्च प्राथमिकता वाले हुक द्वारा स्वीकृति मांगने के बाद ब्लॉक कर सकता है।

`allowedDecisions` उपयोगकर्ता को दिखाए जाने वाले बटन और कमांड सीमित करता है। Gateway
किसी भी ऐसे निर्णय के resolve प्रयास को अस्वीकार कर देता है जो अनुरोध ने पेश नहीं किया था।

## स्वीकृति प्रॉम्प्ट रूट करें

स्वीकृति प्रॉम्प्ट स्थानीय UI सतहों या उन चैट चैनलों में resolve हो सकते हैं जो
स्वीकृति हैंडलिंग का समर्थन करते हैं। Plugin स्वीकृति प्रॉम्प्ट को स्पष्ट चैट
लक्ष्यों तक forward करने के लिए, `approvals.plugin` कॉन्फ़िगर करें:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` `approvals.exec` से स्वतंत्र है। exec स्वीकृति
forwarding सक्षम करने से Plugin स्वीकृति प्रॉम्प्ट रूट नहीं होते, और Plugin स्वीकृति
forwarding सक्षम करने से होस्ट exec नीति नहीं बदलती।

जब किसी प्रॉम्प्ट में मैन्युअल स्वीकृति टेक्स्ट शामिल हो, तो उसे दिए गए
निर्णयों में से किसी एक के साथ resolve करें:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

पूर्ण forwarding मॉडल, same-chat स्वीकृति व्यवहार, मूल चैनल
delivery, और चैनल-विशिष्ट approver नियमों के लिए [उन्नत exec स्वीकृतियां](/hi/tools/exec-approvals-advanced#plugin-approval-forwarding)
देखें।

## Codex मूल अनुमतियां

Codex मूल अनुमति प्रॉम्प्ट भी Plugin स्वीकृतियों के माध्यम से जा सकते हैं, लेकिन
उनका स्वामित्व Plugin-लेखित हुक से अलग होता है।

- Codex app-server स्वीकृति अनुरोध Codex समीक्षा के बाद OpenClaw के माध्यम से रूट होते हैं।
- मूल हुक `permission_request` relay, जब वह relay सक्षम हो, तो
  `plugin.approval.request` के माध्यम से पूछ सकता है।
- जब Codex `_meta.codex_approval_kind` को `"mcp_tool_call"` के रूप में चिह्नित करता है, तब MCP टूल स्वीकृति अनुरोध
  Plugin स्वीकृतियों के माध्यम से रूट होते हैं।

Codex-विशिष्ट व्यवहार और fallback नियमों के लिए [Codex harness रनटाइम](/hi/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
देखें।

## समस्या निवारण

**टूल कहता है कि Plugin स्वीकृतियां उपलब्ध नहीं हैं।** किसी स्वीकृति UI या कॉन्फ़िगर किए गए
स्वीकृति रूट ने अनुरोध स्वीकार नहीं किया। स्वीकृति-सक्षम क्लाइंट कनेक्ट करें, ऐसा
चैनल उपयोग करें जो same-chat `/approve` का समर्थन करता हो, या `approvals.plugin` कॉन्फ़िगर करें।

**`allow-always` दिखाई देता है लेकिन अगली कॉल फिर प्रॉम्प्ट करती है।** सामान्य Plugin
स्वीकृति फ़्लो arbitrary हुक के लिए भरोसे को अपने आप persist नहीं करता। `onResolution("allow-always")` के बाद
अपने Plugin में Plugin-स्वामित्व वाले भरोसे को persist करें, या
केवल `allow-once` और `deny` पेश करें।

**`/approve` निर्णय को अस्वीकार करता है।** अनुरोध ने
`allowedDecisions` सीमित किया है। प्रॉम्प्ट में मुद्रित निर्णयों में से किसी एक का उपयोग करें।

**Slack, Discord, Telegram, या Matrix प्रॉम्प्ट exec
स्वीकृतियों से अलग तरीके से रूट होता है।** Plugin स्वीकृतियां और exec स्वीकृतियां अलग कॉन्फ़िग का उपयोग करती हैं और
अलग authorization जांचों का उपयोग कर सकती हैं। केवल `approvals.exec` जांचने के बजाय
`approvals.plugin` और चैनल के Plugin स्वीकृति समर्थन को सत्यापित करें।

## संबंधित

- [Plugin हुक](/hi/plugins/hooks#tool-call-policy)
- [Plugin बनाना](/hi/plugins/building-plugins#registering-agent-tools)
- [उन्नत exec स्वीकृतियां](/hi/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway protocol](/hi/gateway/protocol)
- [Codex harness रनटाइम](/hi/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
