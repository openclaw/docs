---
read_when:
    - आप OpenClaw सेटिंग्स को लिखी गई policy.jsonc के विरुद्ध जाँचना चाहते हैं
    - आप doctor lint में नीति संबंधी निष्कर्ष चाहते हैं
    - आपको ऑडिट साक्ष्य के लिए नीति सत्यापन हैश चाहिए
summary: CLI संदर्भ `openclaw policy` अनुपालन जांचों के लिए
title: नीति
x-i18n:
    generated_at: "2026-06-28T22:52:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` बंडल किए गए Policy Plugin द्वारा प्रदान किया जाता है। Policy मौजूदा OpenClaw सेटिंग्स के ऊपर एक
एंटरप्राइज़ अनुरूपता परत है। यह दूसरी
कॉन्फ़िगरेशन प्रणाली नहीं जोड़ता। `policy.jsonc` लिखी गई आवश्यकताओं को परिभाषित करता है,
OpenClaw सक्रिय वर्कस्पेस को प्रमाण के रूप में देखता है, और नीति स्वास्थ्य जांच
`doctor --lint` के माध्यम से विचलन रिपोर्ट करती हैं। अंतिम अनुरूपता संकेत एक साफ़
`doctor --lint` रन है; नीति अलग स्वास्थ्य गेट बनाने के बजाय
उस साझा lint सतह में निष्कर्ष जोड़ती है।

Policy वर्तमान में कॉन्फ़िगर किए गए चैनल, MCP सर्वर, मॉडल प्रदाता,
नेटवर्क SSRF मुद्रा, प्रवेश/चैनल एक्सेस मुद्रा, Gateway एक्सपोज़र मुद्रा, एजेंट वर्कस्पेस मुद्रा,
डेटा-हैंडलिंग मुद्रा, OpenClaw कॉन्फ़िग सीक्रेट प्रदाता/ऑथ प्रोफ़ाइल मुद्रा, और शासित टूल
घोषणाओं को प्रबंधित करती है। उदाहरण के लिए, IT या कोई वर्कस्पेस ऑपरेटर रिकॉर्ड कर सकता है कि Telegram
स्वीकृत चैनल प्रदाता नहीं है, MCP सर्वर और मॉडल refs को
स्वीकृत प्रविष्टियों तक सीमित कर सकता है, निजी-नेटवर्क fetch/browser एक्सेस को
अक्षम बने रहने की आवश्यकता रख सकता है, डायरेक्ट-मैसेज सेशन आइसोलेशन और चैनल प्रवेश मुद्रा को
समीक्षित सीमाओं में बने रहने की आवश्यकता रख सकता है, Gateway bind/auth/HTTP एक्सपोज़र को समीक्षित
सीमाओं में बने रहने की आवश्यकता रख सकता है, एजेंट वर्कस्पेस एक्सेस और टूल denies को समीक्षित
मुद्रा में बने रहने की आवश्यकता रख सकता है, OpenClaw कॉन्फ़िग SecretRefs को प्रबंधित प्रदाताओं का उपयोग करने की आवश्यकता रख सकता है,
कॉन्फ़िग ऑथ प्रोफ़ाइलों में प्रदाता/मोड मेटाडेटा होने की आवश्यकता रख सकता है, शासित टूल में
जोखिम और संवेदनशीलता मेटाडेटा होने की आवश्यकता रख सकता है, संवेदनशील लॉगिंग रिडैक्शन की आवश्यकता रख सकता है,
टेलीमेट्री सामग्री कैप्चर से मना कर सकता है, सेशन रिटेंशन रखरखाव की आवश्यकता रख सकता है, सेशन
ट्रांसक्रिप्ट मेमोरी इंडेक्सिंग से मना कर सकता है, और फिर साझा
अनुरूपता गेट के रूप में `doctor --lint` का उपयोग कर सकता है।

नीति का उपयोग तब करें जब किसी वर्कस्पेस को "ये चैनल
सक्षम नहीं होने चाहिए" या "शासित टूल को अनुमोदन मेटाडेटा घोषित करना चाहिए" जैसा टिकाऊ कथन और
यह साबित करने का दोहराने योग्य तरीका चाहिए कि OpenClaw अब भी उस कथन के अनुरूप है। केवल
स्थानीय व्यवहार की आवश्यकता होने और नीति निष्कर्षों या attest output की आवश्यकता न होने पर
सामान्य कॉन्फ़िग और वर्कस्पेस दस्तावेज़ों का ही उपयोग करें।

## त्वरित शुरुआत

पहले उपयोग से पहले बंडल किए गए Policy Plugin को सक्षम करें:

```bash
openclaw plugins enable policy
```

जब नीति सक्षम होती है, doctor मनमाने plugins को सक्रिय किए बिना नीति स्वास्थ्य जांच लोड कर सकता है।
यदि `policy.jsonc` अनुपस्थित है तब भी Plugin सक्षम रहता है, ताकि
doctor अनुपस्थित artifact की रिपोर्ट कर सके।

नीति लिखी जाती है, उपयोगकर्ता की मौजूदा सेटिंग्स से जनरेट नहीं होती। चैनलों, MCP सर्वरों, मॉडल प्रदाताओं, नेटवर्क मुद्रा, प्रवेश/चैनल एक्सेस, Gateway
एक्सपोज़र, एजेंट वर्कस्पेस मुद्रा, कॉन्फ़िगर किए गए sandbox runtime मुद्रा, OpenClaw
डेटा-हैंडलिंग मुद्रा, कॉन्फ़िग सीक्रेट प्रदाता/ऑथ प्रोफ़ाइल मुद्रा, exec approval
फ़ाइल मुद्रा, और टूल मेटाडेटा के लिए एक न्यूनतम
नीति ऐसी दिखती है:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

नियम ही प्राधिकरण हैं। कोई category block केवल namespace है; जांचें
तभी चलती हैं जब कोई ठोस नियम मौजूद हो। OpenClaw मौजूदा `channels.*` सेटिंग्स
`mcp.servers.*`, `models.providers.*`, चयनित एजेंट मॉडल refs, नेटवर्क SSRF
सेटिंग्स, डायरेक्ट-मैसेज सेशन scope, चैनल DM नीति, चैनल group नीति,
चैनल/group mention gates, Gateway bind/auth/Control UI/Tailscale/remote/HTTP
मुद्रा, OpenClaw कॉन्फ़िग एजेंट sandbox workspace access और tool deny मुद्रा,
डेटा-हैंडलिंग कॉन्फ़िग मुद्रा, कॉन्फ़िग सीक्रेट
प्रदाता और SecretRef provenance, कॉन्फ़िग ऑथ प्रोफ़ाइल मेटाडेटा, कॉन्फ़िगर की गई
global/per-agent tool मुद्रा, और `TOOLS.md` घोषणाओं को प्रमाण के रूप में पढ़ता है, फिर
उस देखी गई स्थिति की रिपोर्ट करता है जो अनुरूप नहीं है। यदि कोई नीति non-loopback
Gateway binds से मना करती है, तो `gateway.bind` को केवल तब छोड़ें जब आप
runtime default की समीक्षा करने को तैयार हों; सख्त कॉन्फ़िग अनुरूपता के लिए `gateway.bind=loopback` सेट करें।
read-only एजेंट मुद्रा के लिए, लागू defaults या agent पर sandbox mode
कॉन्फ़िगर करें और `workspaceAccess` को `none` या
`ro` पर सेट करें; अनुपस्थित या `off` sandbox mode read-only/no-write
नीति को संतुष्ट नहीं करता। `agents.workspace.denyTools` `exec`, `process`, `write`,
`edit`, और `apply_patch` का समर्थन करता है; OpenClaw कॉन्फ़िग `group:fs` फ़ाइल mutation tools को कवर करता है
और `group:runtime` shell/process tools को कवर करता है। Tool मुद्रा नीति
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled`, और वही per-agent
`agents.list[].tools.*` overrides देखती है। Exec approval नीति नामित
`exec-approvals.json` product artifact को केवल तब पढ़ती है जब `execApprovals` नियम
मौजूद हो; प्रमाण defaults, per-agent मुद्रा, और allowlist patterns को
socket tokens या last-used command text के बिना रिकॉर्ड करता है। नीति runtime पर tool
calls लागू नहीं करती। Secret evidence
provider/source मुद्रा और SecretRef metadata रिकॉर्ड करता है, कभी raw secret values नहीं। नीति
per-agent credential stores जैसे `auth-profiles.json` को नहीं पढ़ती या attest नहीं करती;
वे stores मौजूदा auth और credential flows के स्वामित्व में रहते हैं।
Data-handling evidence केवल config-level मुद्रा है: यह कॉन्फ़िगर किए गए
redaction mode, telemetry content-capture toggles, session maintenance mode, और
session-transcript memory indexing settings की जांच करता है। यह raw logs,
telemetry exports, transcript contents, memory files का निरीक्षण नहीं करता, या यह साबित नहीं करता
कि कोई personal data या secrets मौजूद नहीं हैं।

### नीति नियम संदर्भ

नीचे दिया गया प्रत्येक policy field वैकल्पिक है। कोई जांच तभी चलती है जब matching rule
`policy.jsonc` में मौजूद हो। देखी गई स्थिति मौजूदा OpenClaw config या
workspace metadata है; नीति विचलन रिपोर्ट करती है लेकिन runtime behavior को दोबारा नहीं लिखती
जब तक कोई repair path स्पष्ट रूप से उपलब्ध और सक्षम न हो।
Policy files सख्त हैं: unsupported sections या rule keys को अनदेखा करने के बजाय
`policy/policy-jsonc-invalid` के रूप में रिपोर्ट किया जाता है।

Policy overlays broad top-level rules को global रखते हैं, फिर named scope blocks को
explicit selectors के लिए अधिक सख्त सामान्य policy sections जोड़ने देते हैं। scope name केवल
एक वर्णनात्मक bucket है; matching scope के अंदर selector values का उपयोग करती है।
overlay additive है: global claims अब भी चलती हैं, और scoped claim उसी observed config के विरुद्ध
अपना finding emit कर सकती है।

#### Scoped overlays

`scopes.<scopeName>` का उपयोग करें जब agents या channels के किसी set को
top-level baseline से अधिक सख्त नीति चाहिए। Agent-scoped sections `agentIds` का उपयोग करते हैं, जो
`tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`,
और `execApprovals.*` का समर्थन करता है। Channel-scoped
ingress `channelIds` का उपयोग करता है, जो `ingress.channels.*` का समर्थन करता है। Unsupported
sections को अनदेखा करने के बजाय अस्वीकार किया जाता है। यदि कोई `agentIds` entry
`agents.list[]` में मौजूद नहीं है, तो OpenClaw उस runtime agent id के लिए inherited
global/default मुद्रा के विरुद्ध scoped rule का मूल्यांकन करता है।

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

एक ही agent कई scopes में आ सकता है जब प्रत्येक scope अलग-अलग
fields को governs करता है, जैसा ऊपर दिखाया गया है। समान agent के लिए repeated scoped field को
policy metadata के अनुसार समान या अधिक restrictive होना चाहिए; weaker duplicate
claims अस्वीकार की जाती हैं। Strictness metadata allow-lists को subsets,
deny-lists को supersets, और required booleans को fixed requirements मानता है।

Container मुद्रा नीति का मूल्यांकन केवल उस evidence के विरुद्ध किया जाता है जिसे OpenClaw matched agent के लिए
देख सकता है। यदि enabled `sandbox.containers.*` rule ऐसे
agent पर लागू होता है जिसका sandbox backend वह field expose नहीं कर सकता, तो policy claim को
passing मानने के बजाय `policy/sandbox-container-posture-unobservable` रिपोर्ट करती है।
अलग-अलग sandbox backends का उपयोग करने वाले agent groups के लिए अलग `agentIds` scopes का उपयोग करें,
और उन groups के लिए unsupported container rules unset या false छोड़ें
जहां वे fields observed नहीं किए जा सकते।

Top-level `ingress.session.requireDmScope` global रहता है क्योंकि
`session.dmScope` channel-attributable evidence नहीं है।

| चयनकर्ता     | समर्थित अनुभाग                                                                 | कब उपयोग करें                                          |
| ------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, और `execApprovals` | एक या अधिक रनटाइम एजेंटों को अधिक सख्त नियमों की आवश्यकता हो।   |
| `channelIds` | `ingress.channels`                                                                 | एक या अधिक चैनलों को अधिक सख्त इनग्रेस नियमों की आवश्यकता हो। |

`policy.jsonc` में मौजूद हर स्कोप वैध और लागू करने योग्य होना चाहिए।

#### चैनल

| नीति फ़ील्ड                         | देखी गई स्थिति                          | कब उपयोग करें                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` प्रदाता और सक्षम स्थिति | `telegram` जैसे प्रदाता से कॉन्फ़िगर किए गए चैनलों को अस्वीकार करें। |
| `channels.denyRules[].reason`        | खोज संदेश और मरम्मत संकेत संदर्भ | समझाएँ कि प्रदाता को क्यों अस्वीकार किया गया है।                          |

#### MCP सर्वर

| नीति फ़ील्ड        | देखी गई स्थिति      | कब उपयोग करें                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ids | हर कॉन्फ़िगर किए गए MCP सर्वर को अनुमति-सूची में होना आवश्यक करें। |
| `mcp.servers.deny`  | `mcp.servers.*` ids | विशिष्ट कॉन्फ़िगर किए गए MCP सर्वर ids को अस्वीकार करें।                   |

#### मॉडल प्रदाता

| नीति फ़ील्ड             | देखी गई स्थिति                                   | कब उपयोग करें                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ids और चयनित मॉडल refs | कॉन्फ़िगर किए गए प्रदाताओं और चयनित मॉडल refs के लिए स्वीकृत प्रदाताओं का उपयोग आवश्यक करें। |
| `models.providers.deny`  | `models.providers.*` ids और चयनित मॉडल refs | कॉन्फ़िगर किए गए प्रदाताओं और चयनित मॉडल refs को प्रदाता id के आधार पर अस्वीकार करें।               |

#### नेटवर्क

| नीति फ़ील्ड                   | देखी गई स्थिति                      | कब उपयोग करें                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | निजी-नेटवर्क SSRF निकास मार्ग | निजी-नेटवर्क पहुंच को निष्क्रिय बनाए रखना आवश्यक करने के लिए `false` पर सेट करें। |

#### इनग्रेस और चैनल पहुंच

| नीति फ़ील्ड                              | देखी गई स्थिति                                                 | कब उपयोग करें                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | समीक्षा किया गया प्रत्यक्ष-संदेश आइसोलेशन स्कोप आवश्यक करें।                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` और पुराने चैनल DM नीति फ़ील्ड      | केवल समीक्षा की गई प्रत्यक्ष-संदेश चैनल नीतियों की अनुमति दें।               |
| `ingress.channels.denyOpenGroups`         | चैनल, खाता, और समूह इनग्रेस नीति                     | कॉन्फ़िगर किए गए चैनलों और खातों के लिए खुले समूह इनग्रेस को अस्वीकार करें।      |
| `ingress.channels.requireMentionInGroups` | चैनल, खाता, समूह, गिल्ड, और नेस्टेड मेंशन गेट कॉन्फ़िग | जब समूह इनग्रेस खुला या मेंशन-गेटेड हो, तब मेंशन गेट आवश्यक करें। |

#### Gateway

| नीति फ़ील्ड                            | देखी गई स्थिति                                 | कब उपयोग करें                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | loopback Gateway बाइंडिंग आवश्यक करने के लिए `false` पर सेट करें।          |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale सर्व/फनल Gateway अवस्था         | Tailscale Funnel एक्सपोज़र को अस्वीकार करने के लिए `false` पर सेट करें।            |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | निष्क्रिय Gateway auth को अस्वीकार करने के लिए `true` पर सेट करें।               |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | स्पष्ट auth rate-limit कॉन्फ़िग आवश्यक करने के लिए `true` पर सेट करें।    |
| `gateway.controlUi.allowInsecure`       | Control UI असुरक्षित auth/device/origin टॉगल | असुरक्षित Control UI एक्सपोज़र टॉगल अस्वीकार करने के लिए `false` पर सेट करें। |
| `gateway.remote.allow`                  | रिमोट Gateway मोड/कॉन्फ़िग                     | रिमोट Gateway मोड अस्वीकार करने के लिए `false` पर सेट करें।                  |
| `gateway.http.denyEndpoints`            | Gateway HTTP API एंडपॉइंट                     | `chatCompletions` या `responses` जैसे एंडपॉइंट ids अस्वीकार करें।  |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL-fetch इनपुट                  | URL-fetch इनपुट पर URL अनुमति-सूचियाँ आवश्यक करने के लिए `true` पर सेट करें। |

#### एजेंट वर्कस्पेस

| नीति फ़ील्ड                     | देखी गई स्थिति                                                                        | कब उपयोग करें                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` और `agents.list[].sandbox.workspaceAccess` | केवल `none` या `ro` जैसे sandbox वर्कस्पेस पहुंच मानों की अनुमति दें।                                                  |
| `agents.workspace.denyTools`     | वैश्विक और प्रति-एजेंट टूल अस्वीकार कॉन्फ़िग                                                 | `exec`, `process`, `write`, `edit`, या `apply_patch` जैसे वर्कस्पेस/रनटाइम म्यूटेशन टूल अस्वीकार करना आवश्यक करें। |

#### Sandbox अवस्था

| नीति फ़ील्ड                                          | देखी गई स्थिति                                          | कब उपयोग करें                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` और प्रति-एजेंट मोड       | केवल `all` या `non-main` जैसे समीक्षा किए गए sandbox मोड की अनुमति दें। |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` और प्रति-एजेंट बैकएंड | केवल `docker` जैसे समीक्षा किए गए sandbox बैकएंड की अनुमति दें।         |
| `sandbox.containers.denyHostNetwork`                  | कंटेनर-आधारित sandbox/browser नेटवर्क मोड           | होस्ट नेटवर्क मोड अस्वीकार करें।                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | कंटेनर-आधारित sandbox/browser नेटवर्क मोड           | किसी अन्य कंटेनर नेटवर्क नेमस्पेस से जुड़ना अस्वीकार करें।              |
| `sandbox.containers.requireReadOnlyMounts`            | कंटेनर-आधारित sandbox/browser माउंट मोड             | माउंट को केवल-पढ़ने योग्य होना आवश्यक करें।                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | कंटेनर-आधारित sandbox/browser माउंट लक्ष्य          | कंटेनर रनटाइम सॉकेट माउंट अस्वीकार करें।                          |
| `sandbox.containers.denyUnconfinedProfiles`           | कंटेनर सुरक्षा प्रोफ़ाइल अवस्था                      | अनकन्फ़ाइन्ड कंटेनर सुरक्षा प्रोफ़ाइल अस्वीकार करें।                   |
| `sandbox.browser.requireCdpSourceRange`               | Sandbox browser CDP स्रोत सीमा                        | browser CDP एक्सपोज़र के लिए स्रोत सीमा घोषित करना आवश्यक करें।        |

नीति अनुपस्थित `sandbox.mode` को अंतर्निहित डिफ़ॉल्ट `off` मानती है, इसलिए
`sandbox.requireMode` किसी नए या अनकॉन्फ़िगर किए गए sandbox को
`["all"]` जैसी अनुमति-सूची से बाहर रिपोर्ट करता है।

#### डेटा हैंडलिंग

| नीति फ़ील्ड                                        | देखी गई स्थिति                                                                       | कब उपयोग करें                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"` को अस्वीकार करने के लिए `true` पर सेट करें।              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | टेलीमेट्री सामग्री कैप्चर अस्वीकार करने के लिए `true` पर सेट करें।                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | प्रभावी सेशन मेंटेनेंस मोड `enforce` आवश्यक करने के लिए `true` पर सेट करें। |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` और `agents.*.memorySearch.experimental.sessionMemory` | सेशन ट्रांसक्रिप्ट को मेमरी में इंडेक्स करना अस्वीकार करने के लिए `true` पर सेट करें।       |

#### सीक्रेट्स

| नीति फ़ील्ड                      | देखी गई स्थिति                                           | कब उपयोग करें                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | कॉन्फ़िग SecretRefs और `secrets.providers.*` घोषणाएँ | SecretRefs को घोषित प्रदाताओं की ओर इंगित करना आवश्यक करने के लिए `true` पर सेट करें।     |
| `secrets.denySources`             | सीक्रेट प्रदाता स्रोत और SecretRef स्रोत            | `exec`, `file`, या किसी अन्य कॉन्फ़िगर किए गए स्रोत नाम जैसे स्रोतों को अस्वीकार करें। |
| `secrets.allowInsecureProviders`  | असुरक्षित सीक्रेट-प्रदाता अवस्था फ़्लैग                   | असुरक्षित अवस्था में ऑप्ट इन करने वाले प्रदाताओं को अस्वीकार करने के लिए `false` पर सेट करें।      |

#### Exec अनुमोदन

Exec अनुमोदन नीति सक्रिय रनटाइम `exec-approvals.json`
आर्टिफ़ैक्ट को देखती है। डिफ़ॉल्ट रूप से यह `~/.openclaw/exec-approvals.json` है; जब
`OPENCLAW_STATE_DIR` सेट होता है, नीति
`$OPENCLAW_STATE_DIR/exec-approvals.json` पढ़ती है। वास्तविक अवस्था नियम जैसे
`execApprovals.defaults.*` या `execApprovals.agents.*` के लिए पढ़ने योग्य आर्टिफ़ैक्ट
साक्ष्य आवश्यक है; अनुपस्थित या अमान्य आर्टिफ़ैक्ट को सिंथेटिक रनटाइम डिफ़ॉल्ट के विरुद्ध
सर्वोत्तम-प्रयास पास बनने के बजाय अदृश्य साक्ष्य के रूप में रिपोर्ट किया जाता है। जब
आर्टिफ़ैक्ट पढ़ने योग्य हो जाता है, छोड़े गए अनुमोदन फ़ील्ड रनटाइम डिफ़ॉल्ट इनहेरिट करते हैं: अनुपस्थित
`defaults.security` `full` होता है, और अनुपस्थित एजेंट सुरक्षा वह
डिफ़ॉल्ट इनहेरिट करती है। साक्ष्य में `defaults`, `agents.*`, और
`agents.*.allowlist[].pattern` के साथ वैकल्पिक `argPattern`, प्रभावी
`autoAllowSkills` अवस्था, और प्रविष्टि स्रोत शामिल हैं। इसमें सॉकेट
path/token, `commandText`, `lastUsedCommand`, रिज़ॉल्व किए गए पथ, या टाइमस्टैम्प शामिल नहीं हैं।

| नीति फ़ील्ड                                | देखी गई स्थिति                                                                         | कब उपयोग करें                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | सक्रिय runtime `exec-approvals.json` पथ                                              | approvals artifact के मौजूद होने और parse होने की आवश्यकता के लिए `true` पर सेट करें।                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, डिफ़ॉल्ट `full` पर                                              | केवल स्वीकृत default approval security modes की अनुमति दें।                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, defaults से inherited                                               | केवल स्वीकृत per-agent effective approval security modes की अनुमति दें।                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` और `agents.*.autoAllowSkills`, runtime defaults से inherited | implicit skill CLI approval के बिना strict manual allowlists आवश्यक करने के लिए `false` पर सेट करें। |
| `execApprovals.agents.allowlist.expected`   | कुल `agents.*.allowlist[]` pattern और वैकल्पिक argPattern entries               | approvals allowlist का reviewed pattern set से मेल खाना आवश्यक करें।                      |

उदाहरण के लिए, approvals artifact आवश्यक करें, permissive defaults अस्वीकार करें, और
चुने गए agents के लिए केवल reviewed exec approval posture की अनुमति दें:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Auth profiles

| नीति फ़ील्ड                    | देखी गई स्थिति                               | कब उपयोग करें                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` provider और mode metadata | config auth profiles पर `provider` और `mode` जैसी metadata keys आवश्यक करें।               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | केवल समर्थित auth profile modes जैसे `api_key`, `aws-sdk`, `oauth`, या `token` की अनुमति दें। |

#### Tool metadata

| नीति फ़ील्ड            | देखी गई स्थिति                   | कब उपयोग करें                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Governed `TOOLS.md` declarations | governed tools के लिए `risk`, `sensitivity`, या `owner` जैसी metadata keys घोषित करना आवश्यक करें। |

#### Tool posture

| नीति फ़ील्ड                    | देखी गई स्थिति                                              | कब उपयोग करें                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` और `agents.list[].tools.profile`           | केवल tool profile ids जैसे `minimal`, `messaging`, या `coding` की अनुमति दें।                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` और per-agent `tools.fs` overrides | workspace-only filesystem tool posture आवश्यक करने के लिए `true` पर सेट करें।                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` और per-agent exec security           | केवल exec security modes जैसे `deny` या `allowlist` की अनुमति दें।                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` और per-agent exec ask mode                | approval posture जैसे `always` आवश्यक करें।                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` और per-agent exec host routing           | केवल exec host routing modes जैसे `sandbox` की अनुमति दें।                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` और per-agent elevated posture     | elevated tool mode को disabled बनाए रखना आवश्यक करने के लिए `false` पर सेट करें।                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` और per-agent `tools.alsoAllow`           | exact `alsoAllow` entries आवश्यक करें और missing या unexpected additive tool grants रिपोर्ट करें।                 |
| `tools.denyTools`               | `tools.deny` और `agents.list[].tools.deny`                 | configured tool deny lists में `group:runtime` और `group:fs` जैसे tool ids या groups शामिल होना आवश्यक करें। |

लेखन के दौरान policy-only checks चलाएँ:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` केवल policy check set चलाता है और evidence, findings, और
attestation hashes उत्सर्जित करता है। वही findings `openclaw doctor --lint` में भी दिखाई देती हैं
जब Policy plugin enabled हो।

operator policy file की authored baseline policy file से तुलना करें:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` policy file syntax की policy file syntax से तुलना करता है। यह
OpenClaw runtime state, evidence, credentials, या secrets की जाँच नहीं करता। command
वही policy rule metadata उपयोग करता है जो scoped overlays को govern करता है: allowlists को
बराबर या अधिक संकीर्ण रहना चाहिए, denylists को बराबर या अधिक व्यापक रहना चाहिए, required booleans
को अपना required value बनाए रखना चाहिए, ordered strings को configured order के अधिक
restrictive end की ओर ही बढ़ना चाहिए, और exact lists को match करना चाहिए।

baseline file एक organization-authored policy हो सकती है। checked policy
stricter values उपयोग कर सकती है या extra policy rules जोड़ सकती है। top-level checked rule भी
scoped baseline rule को satisfy कर सकता है जब वह equally या more restrictive हो क्योंकि
top-level policy व्यापक रूप से लागू होती है। Scope names का match होना आवश्यक नहीं है; scoped
comparison selector value जैसे `agentIds` या `channelIds` और checked policy field के आधार पर keyed होती है।

Example clean compare JSON output केवल policy-file comparison state रिपोर्ट करता है:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Example clean `policy check --json` output में stable hashes शामिल होते हैं जिन्हें
operator या supervisor द्वारा recorded किया जा सकता है:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Policy configure करें

Policy config `plugins.entries.policy.config` के अंतर्गत रहता है।

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| सेटिंग                   | उद्देश्य                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | `policy.jsonc` मौजूद होने से पहले भी policy checks enable करें।         |
| `workspaceRepairs`        | `doctor --fix` को policy-managed workspace settings edit करने दें। |
| `expectedHash`            | approved policy artifact के लिए वैकल्पिक hash-lock।            |
| `expectedAttestationHash` | last accepted clean policy check के लिए वैकल्पिक hash-lock।    |
| `path`                    | policy artifact की workspace-relative location।             |

workspace के लिए policy checks disable करने के लिए `plugins.entries.policy.config.enabled` को
`false` पर सेट करें, जबकि plugin installed रहे।

Tool metadata requirements `policy.jsonc` में
`tools.requireMetadata` के साथ लिखी जाती हैं, उदाहरण के लिए `["risk", "sensitivity", "owner"]`।

## Policy state स्वीकार करें

Example JSON output:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

नीति हैश लिखे गए नियम आर्टिफैक्ट की पहचान करता है। साक्ष्य ब्लॉक
नीति जांचों द्वारा उपयोग की गई देखी गई OpenClaw स्थिति रिकॉर्ड करता है।
`workspace.hash` मान जांचे गए स्कोप के लिए उस साक्ष्य पेलोड की पहचान करता है।
निष्कर्ष हैश जांच द्वारा लौटाए गए सटीक निष्कर्ष सेट की पहचान करता है।
`checkedAt` रिकॉर्ड करता है कि मूल्यांकन कब चला। अभिप्रमाणन हैश
स्थिर दावे की पहचान करता है: नीति हैश, साक्ष्य हैश, निष्कर्ष हैश, और यह कि
परिणाम साफ था या नहीं। यह जानबूझकर `checkedAt` को शामिल नहीं करता, इसलिए वही
नीति स्थिति दोहराई गई जांचों में वही अभिप्रमाणन उत्पन्न करती है। साथ में,
ये इस नीति जांच के लिए ऑडिट ट्यूपल बनाते हैं।

यदि बाद का Gateway या सुपरवाइजर किसी रनटाइम कार्रवाई को ब्लॉक करने, स्वीकृत
करने, या एनोटेट करने के लिए नीति का उपयोग करता है, तो उसे अंतिम साफ नीति जांच
से अभिप्रमाणन हैश रिकॉर्ड करना चाहिए। `checkedAt` ऑडिट लॉग के लिए JSON आउटपुट
में रहता है, लेकिन स्थिर अभिप्रमाणन हैश का हिस्सा नहीं है।

नीति स्थिति स्वीकार करते समय इस जीवनचक्र का उपयोग करें:

1. `policy.jsonc` लिखें या समीक्षा करें।
2. `openclaw policy check --json` चलाएं।
3. यदि परिणाम साफ है, तो `attestation.policy.hash` को `expectedHash` के रूप में रिकॉर्ड करें।
4. `attestation.attestationHash` को `expectedAttestationHash` के रूप में रिकॉर्ड करें।
5. CI या रिलीज गेट में `openclaw doctor --lint` फिर से चलाएं।

यदि नीति नियम जानबूझकर बदलते हैं, तो साफ जांच से दोनों स्वीकार किए गए हैश
अपडेट करें। यदि वर्कस्पेस सेटिंग्स जानबूझकर बदलती हैं लेकिन नीति वही रहती है,
तो आमतौर पर केवल `expectedAttestationHash` बदलता है।

`agents.workspace` नियमों को सक्षम या अपग्रेड करने से वर्कस्पेस हैश और
अभिप्रमाणन हैश में `agentWorkspace` साक्ष्य जुड़ता है। ऑपरेटरों को इन नियमों
को सक्षम करने के बाद नए साक्ष्य की समीक्षा करनी चाहिए और स्वीकार किए गए
अभिप्रमाणन हैश रीफ्रेश करने चाहिए। टूल पोश्चर नियमों को सक्षम या अपग्रेड
करने से इसी तरह `toolPosture` साक्ष्य जुड़ता है।

`openclaw policy watch` वही जांच बार-बार चलाता है और रिपोर्ट करता है जब
मौजूदा साक्ष्य अब `expectedAttestationHash` से मेल नहीं खाते:

```bash
openclaw policy watch --json
```

CI या उन स्क्रिप्ट में `--once` का उपयोग करें जिन्हें केवल एक ड्रिफ्ट मूल्यांकन
की आवश्यकता है। `--once` के बिना, कमांड डिफ़ॉल्ट रूप से हर दो सेकंड में पोल
करता है; अलग अंतराल चुनने के लिए `--interval-ms` का उपयोग करें।

## निष्कर्ष

नीति वर्तमान में सत्यापित करती है:

| जाँच आईडी                                                | निष्कर्ष                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | नीति सक्षम है लेकिन `policy.jsonc` अनुपस्थित है।                                  |
| `policy/policy-jsonc-invalid`                            | नीति पार्स नहीं की जा सकती या उसमें विकृत नियम प्रविष्टियाँ हैं।                  |
| `policy/policy-hash-mismatch`                            | नीति कॉन्फ़िगर किए गए `expectedHash` से मेल नहीं खाती।                            |
| `policy/attestation-hash-mismatch`                       | मौजूदा नीति साक्ष्य अब स्वीकृत attestations से मेल नहीं खाते।                     |
| `policy/policy-conformance-invalid`                      | किसी baseline या जाँची गई नीति फ़ाइल में अमान्य तुलना सिंटैक्स है।                |
| `policy/policy-conformance-missing`                      | किसी जाँची गई नीति फ़ाइल में baseline नीति फ़ाइल द्वारा आवश्यक नियम अनुपस्थित है। |
| `policy/policy-conformance-weaker`                       | किसी जाँची गई नीति फ़ाइल में baseline नीति फ़ाइल की तुलना में कमजोर मान है।       |
| `policy/channels-denied-provider`                        | कोई सक्षम चैनल, चैनल-अस्वीकार नियम से मेल खाता है।                               |
| `policy/mcp-denied-server`                               | कॉन्फ़िगर किया गया MCP सर्वर नीति द्वारा अस्वीकृत है।                             |
| `policy/mcp-unapproved-server`                           | कॉन्फ़िगर किया गया MCP सर्वर allowlist से बाहर है।                                |
| `policy/models-denied-provider`                          | कॉन्फ़िगर किया गया मॉडल प्रदाता या मॉडल ref अस्वीकृत प्रदाता का उपयोग करता है।   |
| `policy/models-unapproved-provider`                      | कॉन्फ़िगर किया गया मॉडल प्रदाता या मॉडल ref allowlist से बाहर है।                 |
| `policy/network-private-access-enabled`                  | नीति द्वारा अस्वीकार किए जाने पर भी निजी-नेटवर्क SSRF escape hatch सक्षम है।      |
| `policy/ingress-dm-policy-unapproved`                    | चैनल DM नीति, नीति allowlist से बाहर है।                                          |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` नीति-आवश्यक DM isolation scope से मेल नहीं खाता।                |
| `policy/ingress-open-groups-denied`                      | चैनल समूह नीति `open` है जबकि नीति खुले समूह ingress को अस्वीकार करती है।         |
| `policy/ingress-group-mention-required`                  | कोई चैनल या समूह प्रविष्टि mention gates अक्षम करती है जबकि नीति उन्हें आवश्यक बनाती है। |
| `policy/gateway-non-loopback-bind`                       | Gateway bind posture non-loopback exposure की अनुमति देता है जबकि नीति इसे अस्वीकार करती है। |
| `policy/gateway-auth-disabled`                           | नीति द्वारा auth आवश्यक होने पर Gateway authentication अक्षम है।                  |
| `policy/gateway-rate-limit-missing`                      | नीति द्वारा आवश्यक होने पर Gateway auth rate-limit posture स्पष्ट नहीं है।        |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI असुरक्षित exposure toggles सक्षम हैं।                          |
| `policy/gateway-tailscale-funnel`                        | नीति द्वारा अस्वीकार किए जाने पर भी Gateway Tailscale Funnel exposure सक्षम है।   |
| `policy/gateway-remote-enabled`                          | नीति द्वारा अस्वीकार किए जाने पर भी Gateway remote mode सक्रिय है।                |
| `policy/gateway-http-endpoint-enabled`                   | नीति द्वारा अस्वीकार किए जाने पर भी Gateway HTTP API endpoint सक्षम है।           |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL-fetch इनपुट में आवश्यक URL allowlist नहीं है।                    |
| `policy/agents-workspace-access-denied`                  | Agent sandbox mode या workspace access नीति allowlist से बाहर है।                 |
| `policy/agents-tool-not-denied`                          | कोई agent या default config नीति द्वारा आवश्यक tool को अस्वीकार नहीं करता।        |
| `policy/tools-profile-unapproved`                        | कॉन्फ़िगर किया गया global या per-agent tool profile allowlist से बाहर है।         |
| `policy/tools-fs-workspace-only-required`                | Filesystem tools workspace-only path posture के साथ कॉन्फ़िगर नहीं हैं।           |
| `policy/tools-exec-security-unapproved`                  | Exec security mode नीति allowlist से बाहर है।                                     |
| `policy/tools-exec-ask-unapproved`                       | Exec ask mode नीति allowlist से बाहर है।                                          |
| `policy/tools-exec-host-unapproved`                      | Exec host routing नीति allowlist से बाहर है।                                      |
| `policy/tools-elevated-enabled`                          | नीति द्वारा अस्वीकार किए जाने पर भी elevated tool mode सक्षम है।                  |
| `policy/tools-also-allow-missing`                        | कॉन्फ़िगर की गई `alsoAllow` सूची में नीति द्वारा आवश्यक प्रविष्टि अनुपस्थित है।   |
| `policy/tools-also-allow-unexpected`                     | कॉन्फ़िगर की गई `alsoAllow` सूची में नीति द्वारा अपेक्षित नहीं की गई प्रविष्टि शामिल है। |
| `policy/tools-required-deny-missing`                     | global या per-agent tool deny list में आवश्यक अस्वीकृत tool शामिल नहीं है।        |
| `policy/sandbox-mode-unapproved`                         | Sandbox mode नीति allowlist से बाहर है।                                           |
| `policy/sandbox-backend-unapproved`                      | Sandbox backend नीति allowlist से बाहर है।                                        |
| `policy/sandbox-container-posture-unobservable`          | किसी ऐसे backend के लिए container posture rule सक्षम है जो उसे observe नहीं कर सकता। |
| `policy/sandbox-container-host-network-denied`           | container-backed sandbox या browser host network mode का उपयोग करता है।           |
| `policy/sandbox-container-namespace-join-denied`         | container-backed sandbox या browser किसी अन्य container namespace से जुड़ता है।   |
| `policy/sandbox-container-mount-mode-required`           | container-backed sandbox या browser mount read-only नहीं है।                      |
| `policy/sandbox-container-runtime-socket-mount`          | container-backed sandbox या browser mount container runtime socket को expose करता है। |
| `policy/sandbox-container-unconfined-profile`            | नीति द्वारा अस्वीकार किए जाने पर भी container sandbox profile unconfined है।      |
| `policy/sandbox-browser-cdp-source-range-missing`        | नीति द्वारा आवश्यक होने पर Sandbox browser CDP source range अनुपस्थित है।         |
| `policy/data-handling-redaction-disabled`                | नीति द्वारा आवश्यक होने पर sensitive logging redaction अक्षम है।                  |
| `policy/data-handling-telemetry-content-capture`         | नीति द्वारा अस्वीकार किए जाने पर भी telemetry content capture सक्षम है।           |
| `policy/data-handling-session-retention-not-enforced`    | नीति द्वारा आवश्यक होने पर session retention maintenance लागू नहीं है।            |
| `policy/data-handling-session-transcript-memory-enabled` | नीति द्वारा अस्वीकार किए जाने पर भी session transcript memory indexing सक्षम है।  |
| `policy/secrets-unmanaged-provider`                      | कोई config SecretRef ऐसे provider को reference करता है जो `secrets.providers` के अंतर्गत घोषित नहीं है। |
| `policy/secrets-denied-provider-source`                  | कोई config secret provider या SecretRef नीति द्वारा अस्वीकृत source का उपयोग करता है। |
| `policy/secrets-insecure-provider`                       | नीति द्वारा अस्वीकार किए जाने पर भी कोई secret provider insecure posture चुनता है। |
| `policy/auth-profile-invalid-metadata`                   | किसी config auth profile में मान्य provider या mode metadata अनुपस्थित है।        |
| `policy/auth-profile-unapproved-mode`                    | कोई config auth profile mode नीति allowlist से बाहर है।                           |
| `policy/exec-approvals-missing`                          | नीति को `exec-approvals.json` की आवश्यकता है, लेकिन artifact अनुपस्थित है।        |
| `policy/exec-approvals-invalid`                          | कॉन्फ़िगर किया गया exec approvals artifact पार्स नहीं किया जा सकता।               |
| `policy/exec-approvals-default-security-unapproved`      | Exec approval defaults, नीति allowlist से बाहर के security mode का उपयोग करते हैं। |
| `policy/exec-approvals-agent-security-unapproved`        | कोई per-agent effective exec approval security mode allowlist से बाहर है।         |
| `policy/exec-approvals-auto-allow-skills-enabled`        | नीति द्वारा अस्वीकार किए जाने पर भी कोई exec approval agent skill CLIs को implicitly auto-allow करता है। |
| `policy/exec-approvals-allowlist-missing`                | approvals allowlist में नीति द्वारा आवश्यक pattern अनुपस्थित है।                  |
| `policy/exec-approvals-allowlist-unexpected`             | approvals allowlist में नीति द्वारा अपेक्षित नहीं किया गया pattern शामिल है।      |
| `policy/tools-missing-risk-level`                        | किसी governed tool declaration में risk metadata अनुपस्थित है।                    |
| `policy/tools-unknown-risk-level`                        | कोई governed tool declaration अज्ञात risk value का उपयोग करता है।                 |
| `policy/tools-missing-sensitivity-token`                 | किसी governed tool declaration में sensitivity metadata अनुपस्थित है।             |
| `policy/tools-missing-owner`                             | किसी governed tool declaration में owner metadata अनुपस्थित है।                   |
| `policy/tools-unknown-sensitivity-token`                 | कोई governed tool declaration अज्ञात sensitivity value का उपयोग करता है।          |

नीति निष्कर्षों में `target` और `requirement` दोनों शामिल हो सकते हैं। `target` वह
observed workspace thing है जो conform नहीं करता। `requirement` authored
policy rule है जिसने इसे finding बनाया। आज दोनों मान addresses हैं, आम तौर पर
`oc://` paths, लेकिन field names address format के बजाय उनकी policy role बताते हैं।

उदाहरण JSON निष्कर्ष:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

उदाहरण tool निष्कर्ष:

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

उदाहरण MCP निष्कर्ष:

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

उदाहरण model-provider निष्कर्ष:

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

उदाहरण network निष्कर्ष:

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

Gateway एक्सपोज़र निष्कर्ष का उदाहरण:

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

एजेंट कार्यक्षेत्र निष्कर्ष का उदाहरण:

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## सुधार

`doctor --lint` और `policy check` केवल-पढ़ने योग्य हैं।

`doctor --fix` नीति-प्रबंधित कार्यक्षेत्र सेटिंग्स को केवल तब संपादित करता है जब
`workspaceRepairs` स्पष्ट रूप से सक्षम हो। इस ऑप्ट-इन के बिना, नीति जांचें
बताती हैं कि वे क्या सुधारेंगी और सेटिंग्स को अपरिवर्तित छोड़ देती हैं।

इस संस्करण में, सुधार उन चैनलों को अक्षम कर सकता है जो OpenClaw config में सक्षम हैं
लेकिन `channels.denyRules` द्वारा अस्वीकृत हैं। `workspaceRepairs` को केवल तब सक्षम करें जब
नीति फ़ाइल की समीक्षा हो चुकी हो, क्योंकि एक वैध अस्वीकार नियम किसी
कॉन्फ़िगर किए गए चैनल को बंद कर सकता है:

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## एग्ज़िट कोड

| कमांड           | `0`                                                    | `1`                                                                | `2`                         |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | थ्रेशोल्ड पर कोई निष्कर्ष नहीं।                       | एक या अधिक निष्कर्ष थ्रेशोल्ड से मिले।                            | आर्ग्युमेंट या रनटाइम विफलता। |
| `policy compare` | नीति फ़ाइल बेसलाइन जितनी सख्त या उससे अधिक सख्त है। | नीति फ़ाइल अमान्य, अनुपस्थित, या बेसलाइन नियमों से कमज़ोर है।     | आर्ग्युमेंट या रनटाइम विफलता। |
| `policy watch`   | कोई निष्कर्ष नहीं और स्वीकृत हैश वर्तमान है।          | निष्कर्ष मौजूद हैं या स्वीकृत अटेस्टेशन पुराना है।                | आर्ग्युमेंट या रनटाइम विफलता। |

## संबंधित

- [Doctor lint मोड](/hi/cli/doctor#lint-mode)
- [Path CLI](/hi/cli/path)
