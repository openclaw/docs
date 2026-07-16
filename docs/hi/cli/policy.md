---
read_when:
    - आप OpenClaw सेटिंग्स को किसी तैयार की गई policy.jsonc के अनुरूप जाँचना चाहते हैं
    - आप doctor lint में नीति संबंधी निष्कर्ष चाहते हैं
    - ऑडिट साक्ष्य के लिए आपको नीति अनुपालन-पुष्टि हैश की आवश्यकता है
summary: '`openclaw policy` अनुरूपता जाँच के लिए CLI संदर्भ'
title: नीति
x-i18n:
    generated_at: "2026-07-16T14:12:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` बंडल किए गए Policy plugin द्वारा प्रदान किया जाता है। यह मौजूदा OpenClaw सेटिंग्स के ऊपर एक एंटरप्राइज़
अनुरूपता परत है, कोई दूसरी कॉन्फ़िगरेशन
प्रणाली नहीं। आप `policy.jsonc` में आवश्यकताएँ लिखते हैं; OpenClaw सक्रिय
वर्कस्पेस को साक्ष्य के रूप में देखता है; policy `doctor --lint` के माध्यम से विचलन की रिपोर्ट करती है। Policy
टूल कॉल लागू नहीं करती या अनुरोध के समय रनटाइम व्यवहार को फिर से नहीं लिखती, और यह
`auth-profiles.json` जैसे प्रति-एजेंट क्रेडेंशियल स्टोर को प्रमाणित नहीं करती।

Policy कॉन्फ़िगर किए गए चैनलों, MCP सर्वरों, मॉडल प्रदाताओं, नेटवर्क SSRF
स्थिति, इनग्रेस/चैनल पहुँच, Gateway एक्सपोज़र और node कमांड स्थिति,
एजेंट वर्कस्पेस पहुँच, सैंडबॉक्स स्थिति, डेटा-हैंडलिंग स्थिति, सीक्रेट
प्रदाता/प्रमाणीकरण प्रोफ़ाइल स्थिति, और नियंत्रित टूल मेटाडेटा (`TOOLS.md`) की जाँच करती है। इसका उपयोग
तब करें जब किसी वर्कस्पेस को "Telegram सक्षम नहीं होना चाहिए"
या "नियंत्रित टूल को जोखिम और स्वामी मेटाडेटा घोषित करना आवश्यक है" जैसे स्थायी, जाँच योग्य कथन की आवश्यकता हो। यदि
आपको बिना किसी प्रमाणीकरण या विचलन पहचान के केवल स्थानीय व्यवहार चाहिए, तो सामान्य
कॉन्फ़िगरेशन पर्याप्त है।

## त्वरित शुरुआत

```bash
openclaw plugins enable policy
```

`policy.jsonc` अनुपस्थित होने पर भी plugin सक्षम रहता है, ताकि doctor
जाँचों को चुपचाप छोड़ने के बजाय अनुपस्थित आर्टिफ़ैक्ट की रिपोर्ट कर सके।

`policy.jsonc` को हाथ से लिखें; यह वर्तमान सेटिंग्स से जनरेट नहीं होता। प्रत्येक
शीर्ष-स्तरीय अनुभाग एक नियम नेमस्पेस है: कोई जाँच केवल तभी चलती है जब उसके अंतर्गत कोई ठोस नियम
मौजूद हो (असमर्थित अनुभाग या कुंजियाँ चुपचाप अनदेखी होने के बजाय
`policy/policy-jsonc-invalid` के रूप में विफल होती हैं)। प्रत्येक समर्थित अनुभाग को समेटने वाला न्यूनतम
उदाहरण:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "इस वर्कस्पेस के लिए Telegram स्वीकृत नहीं है।",
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
    "nodes": {
      "denyCommands": ["system.run"],
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

नीचे दी गई नियम तालिकाओं से स्पष्ट न होने वाले व्यापक नोट:

- गैर-लूपबैक बाइंड को अस्वीकार करते समय `gateway.bind` को छोड़ने का अर्थ है कि आप
  रनटाइम डिफ़ॉल्ट स्वीकार करते हैं; सख्त अनुरूपता के लिए `gateway.bind: "loopback"` सेट करें।
- केवल-पढ़ने योग्य एजेंट के लिए, लागू डिफ़ॉल्ट/एजेंट पर सैंडबॉक्स `mode` को `all` या `non-main` पर
  और `workspaceAccess` को `none` या `ro` पर सेट करें। अनुपस्थित या
  `off` सैंडबॉक्स मोड केवल-पढ़ने योग्य policy को संतुष्ट नहीं करता।
- `agents.workspace.denyTools` में `exec`, `process`, `write`, `edit`,
  `apply_patch` स्वीकार किए जाते हैं। कॉन्फ़िगरेशन के टूल-अस्वीकृति समूह `group:fs` (फ़ाइल परिवर्तन) और
  `group:runtime` (शेल/प्रक्रिया) समतुल्य स्थिति को संतुष्ट करते हैं।
- Exec-अनुमोदन जाँचें लाइव `exec-approvals.json` आर्टिफ़ैक्ट को केवल तभी पढ़ती हैं जब
  कोई `execApprovals` नियम मौजूद हो; अनुपस्थित या अमान्य आर्टिफ़ैक्ट
  अप्रेक्षणीय साक्ष्य है, कृत्रिम रूप से सफल परिणाम नहीं।
- सीक्रेट और प्रमाणीकरण-प्रोफ़ाइल साक्ष्य केवल प्रदाता/स्रोत स्थिति और
  SecretRef मेटाडेटा रिकॉर्ड करते हैं, वास्तविक मान कभी नहीं। Policy `auth-profiles.json` जैसे
  प्रति-एजेंट क्रेडेंशियल स्टोर को न तो पढ़ती है, न प्रमाणित करती है।
- डेटा-हैंडलिंग साक्ष्य केवल कॉन्फ़िगरेशन-स्तरीय स्थिति है (संशोधन मोड,
  टेलीमेट्री कैप्चर टॉगल, सत्र रखरखाव मोड, ट्रांसक्रिप्ट-इंडेक्सिंग
  सेटिंग)। यह लॉग, टेलीमेट्री निर्यात, ट्रांसक्रिप्ट या
  मेमोरी फ़ाइलों की जाँच नहीं करता, और साफ़ परिणाम यह सिद्ध नहीं करता कि उनमें कोई व्यक्तिगत डेटा या
  सीक्रेट मौजूद नहीं है।

### Policy नियम संदर्भ

नीचे दिया गया प्रत्येक नियम वैकल्पिक है; जाँच केवल तभी चलती है जब नियम मौजूद हो। देखी गई
स्थिति मौजूदा OpenClaw कॉन्फ़िगरेशन या वर्कस्पेस मेटाडेटा होती है।

#### दायरा-आधारित ओवरले

जब विशिष्ट एजेंट या चैनलों को शीर्ष-स्तरीय आधाररेखा से अधिक सख्त policy की
आवश्यकता हो, तो `scopes.<scopeName>` का उपयोग करें। दायरे का नाम केवल एक लेबल है; मिलान दायरे के
अंदर मौजूद चयनकर्ता का उपयोग करता है। ओवरले योगात्मक होते हैं: वैश्विक नियम फिर भी चलता है,
और दायरा-आधारित नियम उसी साक्ष्य के विरुद्ध अपना निष्कर्ष जोड़ सकता है।

| चयनकर्ता     | समर्थित अनुभाग                                                             | उपयोग कब करें                                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | जब एक या अधिक रनटाइम एजेंट को अधिक सख्त नियम चाहिए।   |
| `channelIds` | `ingress.channels`                                                             | जब एक या अधिक चैनल को अधिक सख्त इनग्रेस नियम चाहिए। |

यदि कोई `agentIds` प्रविष्टि `agents.list[]` में मौजूद नहीं है, तो OpenClaw
उसे छोड़ने के बजाय उस रनटाइम एजेंट आईडी के लिए विरासत में मिली वैश्विक/डिफ़ॉल्ट स्थिति के विरुद्ध
दायरा-आधारित नियम का मूल्यांकन करता है।

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

जैसा कि ऊपर दिखाया गया है, यदि प्रत्येक दायरा किसी अलग फ़ील्ड को नियंत्रित करता है, तो एक ही एजेंट कई दायरों में दिखाई दे सकता है।
एक ही एजेंट के लिए दोहराया गया दायरा-आधारित फ़ील्ड समान रूप से या
अधिक प्रतिबंधात्मक होना चाहिए; कमज़ोर दोहराया गया दावा अस्वीकार कर दिया जाता है (अनुमति-सूचियाँ
उपसमुच्चय, अस्वीकृति-सूचियाँ अधिसमुच्चय होती हैं, आवश्यक बूलियन स्थिर होते हैं)।

कंटेनर स्थिति नियम (`sandbox.containers.*`) की जाँच केवल उस
साक्ष्य के विरुद्ध की जाती है जिसे मिलान किए गए एजेंट का सैंडबॉक्स बैकएंड उजागर कर सकता है। यदि कोई बैकएंड
उसके लिए सक्षम किए गए नियम को नहीं देख सकता, तो policy सफल परिणाम देने के बजाय
`policy/sandbox-container-posture-unobservable` की रिपोर्ट करती है; कंटेनर नियमों का दायरा उन एजेंट समूहों तक
सीमित रखें जो ऐसा बैकएंड उपयोग करते हैं जो उन्हें उजागर कर सकता है।

शीर्ष-स्तरीय `ingress.session.requireDmScope` वैश्विक रहता है; `session.dmScope`
चैनल से संबद्ध किया जा सकने वाला साक्ष्य नहीं है, इसलिए इसे `channelIds` द्वारा दायरे में नहीं रखा जा सकता।

`policy.jsonc` में मौजूद प्रत्येक दायरा मान्य और लागू करने योग्य होना चाहिए।

#### चैनल

| Policy फ़ील्ड                         | देखी गई स्थिति                          | उपयोग कब करें                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` प्रदाता और सक्षम स्थिति | `telegram` जैसे प्रदाता से कॉन्फ़िगर किए गए चैनलों को अस्वीकार करें। |
| `channels.denyRules[].reason`        | निष्कर्ष संदेश और सुधार संकेत का संदर्भ | बताएँ कि प्रदाता को क्यों अस्वीकार किया गया है।                          |

#### MCP सर्वर

| Policy फ़ील्ड        | देखी गई स्थिति      | उपयोग कब करें                                                   |
| ------------------- | ------------------- | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` आईडी | प्रत्येक कॉन्फ़िगर किए गए MCP सर्वर का अनुमति-सूची में होना आवश्यक करें। |
| `mcp.servers.deny`  | `mcp.servers.*` आईडी | विशिष्ट कॉन्फ़िगर किए गए MCP सर्वर आईडी अस्वीकार करें।                   |

#### मॉडल प्रदाता

| Policy फ़ील्ड             | देखी गई स्थिति                                   | उपयोग कब करें                                                                        |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` आईडी और चयनित मॉडल संदर्भ | कॉन्फ़िगर किए गए प्रदाताओं और चयनित मॉडल संदर्भों के लिए स्वीकृत प्रदाताओं का उपयोग आवश्यक करें। |
| `models.providers.deny`  | `models.providers.*` आईडी और चयनित मॉडल संदर्भ | प्रदाता आईडी के आधार पर कॉन्फ़िगर किए गए प्रदाताओं और चयनित मॉडल संदर्भों को अस्वीकार करें।               |

#### नेटवर्क

| Policy फ़ील्ड                   | देखी गई स्थिति                      | उपयोग कब करें                                                           |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| `network.privateNetwork.allow` | निजी-नेटवर्क SSRF बचाव मार्ग | निजी-नेटवर्क पहुँच को अक्षम रखना आवश्यक करने के लिए इसे `false` पर सेट करें। |

#### इनग्रेस और चैनल पहुँच

| नीति फ़ील्ड                              | देखी गई स्थिति                                                 | कब उपयोग करें                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | समीक्षा किया गया प्रत्यक्ष-संदेश पृथक्करण स्कोप आवश्यक करें।                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` और पुराने चैनल DM नीति फ़ील्ड      | केवल समीक्षा की गई प्रत्यक्ष-संदेश चैनल नीतियों की अनुमति दें।               |
| `ingress.channels.denyOpenGroups`         | चैनल, अकाउंट और समूह इनग्रेस नीति                     | कॉन्फ़िगर किए गए चैनलों और अकाउंट के लिए खुला समूह इनग्रेस अस्वीकार करें।      |
| `ingress.channels.requireMentionInGroups` | चैनल, अकाउंट, समूह, गिल्ड और नेस्टेड उल्लेख गेट कॉन्फ़िगरेशन | समूह इनग्रेस खुला या उल्लेख-गेटेड होने पर उल्लेख गेट आवश्यक करें। |

#### Gateway

| नीति फ़ील्ड                            | देखी गई स्थिति                                 | कब उपयोग करें                                                                             |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | लूपबैक Gateway बाइंडिंग आवश्यक करने के लिए `false` पर सेट करें।                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale सर्व/फ़नल Gateway सुरक्षा मुद्रा         | Tailscale Funnel एक्सपोज़र अस्वीकार करने के लिए `false` पर सेट करें।                                    |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | अक्षम Gateway प्रमाणीकरण अस्वीकार करने के लिए `true` पर सेट करें।                                       |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | स्पष्ट प्रमाणीकरण दर-सीमा कॉन्फ़िगरेशन आवश्यक करने के लिए `true` पर सेट करें।                            |
| `gateway.controlUi.allowInsecure`       | Control UI के असुरक्षित प्रमाणीकरण/डिवाइस/ओरिजिन टॉगल | असुरक्षित Control UI एक्सपोज़र टॉगल अस्वीकार करने के लिए `false` पर सेट करें।                         |
| `gateway.remote.allow`                  | रिमोट Gateway मोड/कॉन्फ़िगरेशन                     | रिमोट Gateway मोड अस्वीकार करने के लिए `false` पर सेट करें।                                          |
| `gateway.http.denyEndpoints`            | Gateway HTTP API एंडपॉइंट                     | `chatCompletions` या `responses` जैसे एंडपॉइंट आईडी अस्वीकार करें।                          |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL-फ़ेच इनपुट                  | URL-फ़ेच इनपुट पर URL अनुमति-सूचियाँ आवश्यक करने के लिए `true` पर सेट करें।                         |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                   | OpenClaw कॉन्फ़िगरेशन में `system.run` जैसी सटीक Node कमांड आईडी अस्वीकार करना आवश्यक करें। |

`gateway.nodes.denyCommands` एक सटीक, केस-संवेदी अस्वीकरण-सुपरसेट नियम है।
इसका उपयोग तब करें जब नीति को यह प्रमाणित करना हो कि विशेषाधिकार-प्राप्त Node कमांड OpenClaw कॉन्फ़िगरेशन द्वारा स्पष्ट रूप से
अस्वीकृत हैं। जो परिनियोजन जानबूझकर किसी विशेषाधिकार-प्राप्त
Node कमांड की अनुमति देता है, उसे केवल
`gateway.nodes.allowCommands` पर निर्भर रहने के बजाय समीक्षा के बाद `policy.jsonc` अपडेट करना चाहिए।

#### एजेंट कार्यस्थान

| नीति फ़ील्ड                     | देखी गई स्थिति                                                                        | कब उपयोग करें                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` और `agents.list[].sandbox.workspaceAccess` | केवल `none` या `ro` जैसे सैंडबॉक्स कार्यस्थान एक्सेस मानों की अनुमति दें।                       |
| `agents.workspace.denyTools`     | वैश्विक और प्रति-एजेंट टूल अस्वीकरण कॉन्फ़िगरेशन                                                 | म्यूटेशन टूल (`exec`, `process`, `write`, `edit`, `apply_patch`) अस्वीकार करना आवश्यक करें। |

#### सैंडबॉक्स सुरक्षा मुद्रा

| नीति फ़ील्ड                                          | देखी गई स्थिति                                          | कब उपयोग करें                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` और प्रति-एजेंट मोड       | केवल `all` या `non-main` जैसे समीक्षा किए गए सैंडबॉक्स मोड की अनुमति दें। |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` और प्रति-एजेंट बैकएंड | केवल `docker` जैसे समीक्षा किए गए सैंडबॉक्स बैकएंड की अनुमति दें।         |
| `sandbox.containers.denyHostNetwork`                  | कंटेनर-समर्थित सैंडबॉक्स/ब्राउज़र नेटवर्क मोड           | होस्ट नेटवर्क मोड अस्वीकार करें।                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | कंटेनर-समर्थित सैंडबॉक्स/ब्राउज़र नेटवर्क मोड           | किसी अन्य कंटेनर के नेटवर्क नेमस्पेस में शामिल होना अस्वीकार करें।              |
| `sandbox.containers.requireReadOnlyMounts`            | कंटेनर-समर्थित सैंडबॉक्स/ब्राउज़र माउंट मोड             | माउंट का केवल-पढ़ने योग्य होना आवश्यक करें।                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | कंटेनर-समर्थित सैंडबॉक्स/ब्राउज़र माउंट लक्ष्य          | कंटेनर रनटाइम सॉकेट माउंट अस्वीकार करें।                          |
| `sandbox.containers.denyUnconfinedProfiles`           | कंटेनर सुरक्षा प्रोफ़ाइल मुद्रा                      | अप्रतिबंधित कंटेनर सुरक्षा प्रोफ़ाइल अस्वीकार करें।                   |
| `sandbox.browser.requireCdpSourceRange`               | सैंडबॉक्स ब्राउज़र CDP स्रोत रेंज                        | ब्राउज़र CDP एक्सपोज़र में स्रोत रेंज घोषित करना आवश्यक करें।        |

नीति अनुपस्थित `sandbox.mode` को उसका अंतर्निहित डिफ़ॉल्ट `off` मानती है, इसलिए
`sandbox.requireMode` किसी नए या अकॉन्फ़िगर किए गए सैंडबॉक्स को
`["all"]` जैसी अनुमति-सूची के बाहर रिपोर्ट करता है।

#### डेटा प्रबंधन

| नीति फ़ील्ड                                        | देखी गई स्थिति                                                                       | कब उपयोग करें                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"` अस्वीकार करने के लिए `true` पर सेट करें।              |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | टेलीमेट्री सामग्री कैप्चर अस्वीकार करने के लिए `true` पर सेट करें।                     |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | प्रभावी सत्र रखरखाव मोड `enforce` आवश्यक करने के लिए `true` पर सेट करें। |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` और `agents.*.memorySearch.experimental.sessionMemory` | मेमोरी में सत्र ट्रांसक्रिप्ट इंडेक्सिंग अस्वीकार करने के लिए `true` पर सेट करें।       |

#### गोपनीय मान

| नीति फ़ील्ड                      | देखी गई स्थिति                                           | कब उपयोग करें                                                                |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | कॉन्फ़िगरेशन SecretRefs और `secrets.providers.*` घोषणाएँ | SecretRefs का घोषित प्रदाताओं की ओर संकेत करना आवश्यक करने के लिए `true` पर सेट करें।     |
| `secrets.denySources`             | गोपनीय मान प्रदाता स्रोत और SecretRef स्रोत            | `exec`, `file`, या किसी अन्य कॉन्फ़िगर किए गए स्रोत नाम जैसे स्रोत अस्वीकार करें। |
| `secrets.allowInsecureProviders`  | असुरक्षित गोपनीय मान-प्रदाता मुद्रा फ़्लैग                   | असुरक्षित मुद्रा चुनने वाले प्रदाताओं को अस्वीकार करने के लिए `false` पर सेट करें।      |

#### Exec अनुमोदन

Exec-अनुमोदन जाँचें रनटाइम `exec-approvals.json` आर्टिफ़ैक्ट पढ़ती हैं:
डिफ़ॉल्ट रूप से `~/.openclaw/exec-approvals.json`, या
`OPENCLAW_STATE_DIR` सेट होने पर `$OPENCLAW_STATE_DIR/exec-approvals.json`।
`execApprovals.defaults.*` या `execApprovals.agents.*` के अंतर्गत मुद्रा नियमों के लिए
पढ़ने योग्य आर्टिफ़ैक्ट प्रमाण आवश्यक है; अनुपस्थित या अमान्य आर्टिफ़ैक्ट को
सर्वोत्तम-प्रयास पास के बजाय अप्रेक्षणीय प्रमाण के रूप में रिपोर्ट किया जाता है। पढ़ने योग्य होने के बाद, छोड़े गए
फ़ील्ड रनटाइम डिफ़ॉल्ट प्राप्त करते हैं: अनुपस्थित `defaults.security`, `full` होता है, और
अनुपस्थित एजेंट सुरक्षा वह डिफ़ॉल्ट प्राप्त करती है। प्रमाण में `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, वैकल्पिक `argPattern`, प्रभावी
`autoAllowSkills` मुद्रा और प्रविष्टि स्रोत शामिल हैं — सॉकेट पथ/टोकन,
`commandText`, `lastUsedCommand`, समाधान किए गए पथ या टाइमस्टैम्प कभी नहीं।

| नीति फ़ील्ड                                | देखी गई स्थिति                                                                         | कब उपयोग करें                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | सक्रिय रनटाइम `exec-approvals.json` पथ                                              | अनुमोदन आर्टिफ़ैक्ट का अस्तित्व और पार्स होना आवश्यक करने के लिए `true` पर सेट करें।                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, जिसका डिफ़ॉल्ट `full` है                                              | केवल अनुमोदित डिफ़ॉल्ट अनुमोदन सुरक्षा मोड की अनुमति दें।                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, जो डिफ़ॉल्ट प्राप्त करता है                                               | केवल अनुमोदित प्रति-एजेंट प्रभावी अनुमोदन सुरक्षा मोड की अनुमति दें।                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` और `agents.*.autoAllowSkills`, जो रनटाइम डिफ़ॉल्ट प्राप्त करते हैं | अंतर्निहित skill CLI अनुमोदन के बिना कठोर मैन्युअल अनुमति-सूचियाँ आवश्यक करने के लिए `false` पर सेट करें। |
| `execApprovals.agents.allowlist.expected`   | समेकित `agents.*.allowlist[]` पैटर्न और वैकल्पिक argPattern प्रविष्टियाँ               | अनुमोदन अनुमति-सूची का समीक्षा किए गए पैटर्न सेट से मेल खाना आवश्यक करें।                      |

उदाहरण: अनुमोदन आर्टिफ़ैक्ट आवश्यक करें, अत्यधिक अनुमतिशील डिफ़ॉल्ट अस्वीकार करें और
चयनित एजेंट के लिए केवल समीक्षा की गई exec अनुमोदन मुद्रा की अनुमति दें।

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // सुरक्षा मोड: "deny", "allowlist", या "full"।
      // यह डिफ़ॉल्ट केवल लॉक-डाउन अस्वीकरण मुद्रा की अनुमति देता है।
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // चयनित एजेंट समीक्षा की गई अनुमति-सूची मुद्रा का उपयोग कर सकते हैं, लेकिन "full" का नहीं।
          "allowSecurity": ["allowlist"],
          // false का अर्थ है कि skill CLI को autoAllowSkills द्वारा
          // अंतर्निहित रूप से अनुमोदित होने के बजाय समीक्षा की गई अनुमति-सूची में उपस्थित होना चाहिए।
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // सरल प्रविष्टि: बिना argPattern के सटीक समीक्षा किया गया निष्पादन-योग्य पैटर्न।
              "travel-hub",
              // सीमित प्रविष्टि: पैटर्न और समीक्षा की गई आर्ग्युमेंट रेगुलर एक्सप्रेशन।
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

#### प्रमाणीकरण प्रोफ़ाइल

| नीति फ़ील्ड                    | देखी गई स्थिति                               | कब उपयोग करें                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` प्रदाता और मोड मेटाडेटा | कॉन्फ़िगरेशन प्रमाणीकरण प्रोफ़ाइलों पर `provider` और `mode` जैसी मेटाडेटा कुंजियाँ आवश्यक करें।               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | केवल `api_key`, `aws-sdk`, `oauth`, या `token` जैसे समर्थित प्रमाणीकरण प्रोफ़ाइल मोड की अनुमति दें। |

#### टूल मेटाडेटा

| नीति फ़ील्ड            | देखी गई स्थिति                   | कब उपयोग करें                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | शासित `TOOLS.md` घोषणाएँ | शासित टूल को `risk`, `sensitivity`, या `owner` जैसी मेटाडेटा कुंजियाँ घोषित करना आवश्यक करें। |

#### टूल की स्थिति

| नीति फ़ील्ड                    | देखी गई स्थिति                                              | कब उपयोग करें                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` और `agents.list[].tools.profile`           | केवल `minimal`, `messaging`, या `coding` जैसी टूल प्रोफ़ाइल आईडी की अनुमति दें।                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` और प्रति-एजेंट `tools.fs` ओवरराइड | केवल कार्यस्थान वाली फ़ाइल-सिस्टम टूल स्थिति आवश्यक करने के लिए `true` पर सेट करें।                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` और प्रति-एजेंट निष्पादन सुरक्षा           | केवल `deny` या `allowlist` जैसे निष्पादन सुरक्षा मोड की अनुमति दें।                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` और प्रति-एजेंट निष्पादन पूछताछ मोड                | `always` जैसी अनुमोदन स्थिति आवश्यक करें।                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` और प्रति-एजेंट निष्पादन होस्ट रूटिंग           | केवल `sandbox` जैसे निष्पादन होस्ट रूटिंग मोड की अनुमति दें।                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` और प्रति-एजेंट उन्नत स्थिति     | उन्नत टूल मोड को अक्षम रखना आवश्यक करने के लिए `false` पर सेट करें।                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` और प्रति-एजेंट `tools.alsoAllow`           | सटीक `alsoAllow` प्रविष्टियाँ आवश्यक करें और अनुपलब्ध या अनपेक्षित अतिरिक्त टूल अनुदानों की रिपोर्ट दें।                 |
| `tools.denyTools`               | `tools.deny` और `agents.list[].tools.deny`                 | कॉन्फ़िगर की गई टूल अस्वीकरण सूचियों में `group:runtime` और `group:fs` जैसी टूल आईडी या समूह शामिल करना आवश्यक करें। |

## जाँच चलाएँ

लेखन के दौरान केवल नीति वाली जाँच चलाएँ:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` केवल नीति जाँच समुच्चय चलाता है और साक्ष्य, निष्कर्ष,
तथा सत्यापन हैश उत्सर्जित करता है। Policy plugin सक्षम होने पर वही निष्कर्ष
`openclaw doctor --lint` में भी दिखाई देते हैं।

किसी ऑपरेटर नीति फ़ाइल की तुलना लिखित आधाररेखा से करें:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` नीति-फ़ाइल सिंटैक्स की जाँच नीति-फ़ाइल सिंटैक्स के विरुद्ध करता है; यह
रनटाइम स्थिति, साक्ष्य, क्रेडेंशियल या सीक्रेट का निरीक्षण नहीं करता। यह उन्हीं
नियम मेटाडेटा का उपयोग करता है जो दायरा-निर्धारित ओवरले को नियंत्रित करते हैं: अनुमति सूचियाँ समान या
अधिक संकीर्ण रहनी चाहिए, अस्वीकरण सूचियाँ समान या अधिक व्यापक रहनी चाहिए, आवश्यक बूलियन को
अपना मान बनाए रखना चाहिए, क्रमबद्ध स्ट्रिंग केवल कॉन्फ़िगर किए गए क्रम के अधिक कठोर सिरे की ओर
जा सकती हैं, और सटीक सूचियाँ मेल खानी चाहिए। आधाररेखा किसी
संगठन द्वारा लिखी गई नीति हो सकती है; जाँची गई नीति अधिक कठोर मान या
अतिरिक्त नियम जोड़ सकती है। शीर्ष-स्तरीय जाँचा गया नियम किसी दायरा-निर्धारित आधाररेखा नियम को तब संतुष्ट कर सकता है जब
वह समान रूप से या अधिक प्रतिबंधात्मक हो। फ़ाइलों के बीच दायरा नामों का मेल होना
आवश्यक नहीं है; तुलना चयनकर्ता (`agentIds`/`channelIds`) और फ़ील्ड के आधार पर कुंजीबद्ध होती है।

स्वच्छ तुलना (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

स्वच्छ `policy check --json` आउटपुट में स्थिर हैश शामिल होते हैं, जिन्हें कोई ऑपरेटर या
पर्यवेक्षक दर्ज कर सकता है:

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

## नीति कॉन्फ़िगर करें

नीति कॉन्फ़िगरेशन `plugins.entries.policy.config` के अंतर्गत रहता है।

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
| `enabled`                 | `policy.jsonc` के अस्तित्व में आने से पहले भी नीति जाँच सक्षम करें।         |
| `workspaceRepairs`        | `doctor --fix` को नीति-प्रबंधित कार्यस्थान सेटिंग संपादित करने की अनुमति दें। |
| `expectedHash`            | अनुमोदित नीति आर्टिफ़ैक्ट के लिए वैकल्पिक हैश-लॉक।            |
| `expectedAttestationHash` | पिछली स्वीकृत स्वच्छ नीति जाँच के लिए वैकल्पिक हैश-लॉक।    |
| `path`                    | नीति आर्टिफ़ैक्ट का कार्यस्थान-सापेक्ष स्थान।             |

Plugin को इंस्टॉल रखते हुए किसी कार्यस्थान के लिए नीति
जाँच अक्षम करने हेतु `plugins.entries.policy.config.enabled` को `false` पर सेट करें।

## नीति स्थिति स्वीकार करें

उदाहरण JSON आउटपुट:

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
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
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

`attestation.policy.hash` लिखित नियम आर्टिफ़ैक्ट की पहचान करता है। `evidence`
जाँच में उपयोग की गई देखी हुई OpenClaw स्थिति दर्ज करता है, और
`workspace.hash` उस साक्ष्य पेलोड की पहचान करता है। `findingsHash`
सटीक निष्कर्ष समुच्चय की पहचान करता है। `checkedAt` जाँच चलने का समय दर्ज करता है।
`attestationHash` स्थिर दावे (नीति हैश, साक्ष्य हैश,
निष्कर्ष हैश और स्वच्छ/अस्वच्छ स्थिति) की पहचान करता है और जानबूझकर `checkedAt` को बाहर रखता है,
इसलिए समान नीति स्थिति हमेशा समान सत्यापन हैश उत्पन्न करती है। ये
चारों मान मिलकर एक नीति जाँच के लिए ऑडिट ट्यूपल बनाते हैं।

यदि कोई Gateway या पर्यवेक्षक किसी रनटाइम कार्रवाई को अवरुद्ध, अनुमोदित या टिप्पणीबद्ध करने के लिए नीति का उपयोग करता है,
तो उसे पिछली स्वच्छ जाँच का सत्यापन हैश दर्ज करना चाहिए।
`checkedAt` ऑडिट लॉग के लिए JSON आउटपुट में रहता है, लेकिन
स्थिर हैश का हिस्सा नहीं है।

नीति स्थिति स्वीकार करने का जीवनचक्र:

1. `policy.jsonc` लिखें या उसकी समीक्षा करें।
2. `openclaw policy check --json` चलाएँ।
3. यदि स्वच्छ हो, तो `attestation.policy.hash` को `expectedHash` के रूप में दर्ज करें।
4. `attestation.attestationHash` को `expectedAttestationHash` के रूप में दर्ज करें।
5. CI या रिलीज़ गेट में `openclaw doctor --lint` फिर से चलाएँ।

यदि नीति नियम जानबूझकर बदलते हैं, तो स्वच्छ जाँच से दोनों स्वीकृत हैश
अपडेट करें। यदि केवल कार्यस्थान सेटिंग बदलती हैं (नीति समान रहती है),
तो सामान्यतः केवल `expectedAttestationHash` बदलता है।

`agents.workspace` नियमों को सक्षम या अपग्रेड करने से कार्यस्थान हैश और सत्यापन हैश में
`agentWorkspace` साक्ष्य जुड़ता है; सक्षम करने के बाद नए साक्ष्य की समीक्षा करें और
स्वीकृत सत्यापन हैश को रीफ़्रेश करें। टूल स्थिति नियमों को सक्षम या अपग्रेड करने से
उसी तरह `toolPosture` साक्ष्य जुड़ता है।

`openclaw policy watch` जाँच को फिर से चलाता है और बताता है कि वर्तमान साक्ष्य कब
`expectedAttestationHash` से मेल खाना बंद कर देता है:

```bash
openclaw policy watch --json
```

एकल ड्रिफ़्ट मूल्यांकन की आवश्यकता वाले CI या स्क्रिप्ट में `--once` का उपयोग करें।
`--once` के बिना, यह डिफ़ॉल्ट रूप से हर दो सेकंड में पोल करता है; अंतराल बदलने के लिए
`--interval-ms` का उपयोग करें।

## निष्कर्ष

| जाँच आईडी                                                 | निष्कर्ष                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | नीति सक्षम है, लेकिन `policy.jsonc` अनुपस्थित है।                                  |
| `policy/policy-jsonc-invalid`                            | नीति को पार्स नहीं किया जा सकता या उसमें विकृत नियम प्रविष्टियाँ हैं।                       |
| `policy/policy-hash-mismatch`                            | नीति कॉन्फ़िगर किए गए `expectedHash` से मेल नहीं खाती।                                  |
| `policy/attestation-hash-mismatch`                       | वर्तमान नीति साक्ष्य अब स्वीकृत सत्यापन से मेल नहीं खाता।               |
| `policy/policy-conformance-invalid`                      | किसी बेसलाइन या जाँची गई नीति फ़ाइल में अमान्य तुलना सिंटैक्स है।                  |
| `policy/policy-conformance-missing`                      | किसी जाँची गई नीति फ़ाइल में बेसलाइन नीति फ़ाइल द्वारा आवश्यक नियम अनुपस्थित है।     |
| `policy/policy-conformance-weaker`                       | किसी जाँची गई नीति फ़ाइल का मान बेसलाइन नीति फ़ाइल से कमज़ोर है।           |
| `policy/channels-denied-provider`                        | कोई सक्षम चैनल, चैनल-अस्वीकृति नियम से मेल खाता है।                                   |
| `policy/mcp-denied-server`                               | कॉन्फ़िगर किया गया MCP सर्वर नीति द्वारा अस्वीकृत है।                                      |
| `policy/mcp-unapproved-server`                           | कॉन्फ़िगर किया गया MCP सर्वर अनुमति-सूची से बाहर है।                                 |
| `policy/models-denied-provider`                          | कॉन्फ़िगर किया गया मॉडल प्रदाता या मॉडल संदर्भ किसी अस्वीकृत प्रदाता का उपयोग करता है।                  |
| `policy/models-unapproved-provider`                      | कॉन्फ़िगर किया गया मॉडल प्रदाता या मॉडल संदर्भ अनुमति-सूची से बाहर है।                |
| `policy/network-private-access-enabled`                  | जब नीति निजी-नेटवर्क SSRF अपवाद को अस्वीकार करती है, तब वह सक्षम है।             |
| `policy/ingress-dm-policy-unapproved`                    | किसी चैनल की DM नीति, नीति की अनुमति-सूची से बाहर है।                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` नीति द्वारा आवश्यक DM पृथक्करण दायरे से मेल नहीं खाता।          |
| `policy/ingress-open-groups-denied`                      | किसी चैनल की समूह नीति `open` है, जबकि नीति खुले समूह इनग्रेस को अस्वीकार करती है।          |
| `policy/ingress-group-mention-required`                  | किसी चैनल या समूह की प्रविष्टि उल्लेख गेट अक्षम करती है, जबकि नीति उन्हें आवश्यक बनाती है।       |
| `policy/gateway-non-loopback-bind`                       | Gateway बाइंड स्थिति गैर-लूपबैक एक्सपोज़र की अनुमति देती है, जबकि नीति इसे अस्वीकार करती है।         |
| `policy/gateway-auth-disabled`                           | Gateway प्रमाणीकरण अक्षम है, जबकि नीति के अनुसार प्रमाणीकरण आवश्यक है।                     |
| `policy/gateway-rate-limit-missing`                      | Gateway प्रमाणीकरण दर-सीमा स्थिति स्पष्ट नहीं है, जबकि नीति के अनुसार यह आवश्यक है।          |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI के असुरक्षित एक्सपोज़र टॉगल सक्षम हैं।                         |
| `policy/gateway-tailscale-funnel`                        | Gateway Tailscale Funnel एक्सपोज़र सक्षम है, जबकि नीति इसे अस्वीकार करती है।               |
| `policy/gateway-remote-enabled`                          | Gateway रिमोट मोड सक्रिय है, जबकि नीति इसे अस्वीकार करती है।                              |
| `policy/gateway-http-endpoint-enabled`                   | Gateway HTTP API एंडपॉइंट सक्षम है, जबकि नीति इसे अस्वीकार करती है।                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL-फ़ेच इनपुट में आवश्यक URL अनुमति-सूची नहीं है।                      |
| `policy/gateway-node-command-denied`                     | नीति द्वारा अस्वीकृत Node कमांड को OpenClaw कॉन्फ़िगरेशन द्वारा अस्वीकृत नहीं किया गया है।                 |
| `policy/agents-workspace-access-denied`                  | एजेंट सैंडबॉक्स मोड या कार्यस्थान पहुँच, नीति की अनुमति-सूची से बाहर है।           |
| `policy/agents-tool-not-denied`                          | किसी एजेंट या डिफ़ॉल्ट कॉन्फ़िगरेशन में नीति द्वारा आवश्यक टूल अस्वीकृत नहीं है।               |
| `policy/tools-profile-unapproved`                        | कॉन्फ़िगर की गई वैश्विक या प्रति-एजेंट टूल प्रोफ़ाइल अनुमति-सूची से बाहर है।           |
| `policy/tools-fs-workspace-only-required`                | फ़ाइल-सिस्टम टूल केवल-कार्यस्थान पथ स्थिति के साथ कॉन्फ़िगर नहीं किए गए हैं।             |
| `policy/tools-exec-security-unapproved`                  | निष्पादन सुरक्षा मोड, नीति की अनुमति-सूची से बाहर है।                               |
| `policy/tools-exec-ask-unapproved`                       | निष्पादन पूछताछ मोड, नीति की अनुमति-सूची से बाहर है।                                    |
| `policy/tools-exec-host-unapproved`                      | निष्पादन होस्ट रूटिंग, नीति की अनुमति-सूची से बाहर है।                                |
| `policy/tools-elevated-enabled`                          | उन्नत टूल मोड सक्षम है, जबकि नीति इसे अस्वीकार करती है।                              |
| `policy/tools-also-allow-missing`                        | कॉन्फ़िगर की गई `alsoAllow` सूची में नीति द्वारा आवश्यक प्रविष्टि अनुपस्थित है।             |
| `policy/tools-also-allow-unexpected`                     | कॉन्फ़िगर की गई `alsoAllow` सूची में ऐसी प्रविष्टि शामिल है जिसकी नीति को अपेक्षा नहीं है।           |
| `policy/tools-required-deny-missing`                     | वैश्विक या प्रति-एजेंट टूल अस्वीकृति सूची में आवश्यक अस्वीकृत टूल शामिल नहीं है।     |
| `policy/sandbox-mode-unapproved`                         | सैंडबॉक्स मोड, नीति की अनुमति-सूची से बाहर है।                                     |
| `policy/sandbox-backend-unapproved`                      | सैंडबॉक्स बैकएंड, नीति की अनुमति-सूची से बाहर है।                                  |
| `policy/sandbox-container-posture-unobservable`          | कंटेनर स्थिति नियम ऐसे बैकएंड के लिए सक्षम है जो इसका निरीक्षण नहीं कर सकता।         |
| `policy/sandbox-container-host-network-denied`           | कंटेनर-समर्थित सैंडबॉक्स या ब्राउज़र, होस्ट नेटवर्क मोड का उपयोग करता है।                     |
| `policy/sandbox-container-namespace-join-denied`         | कंटेनर-समर्थित सैंडबॉक्स या ब्राउज़र किसी अन्य कंटेनर नेमस्पेस से जुड़ता है।          |
| `policy/sandbox-container-mount-mode-required`           | कंटेनर-समर्थित सैंडबॉक्स या ब्राउज़र माउंट केवल-पढ़ने योग्य नहीं है।                     |
| `policy/sandbox-container-runtime-socket-mount`          | कंटेनर-समर्थित सैंडबॉक्स या ब्राउज़र माउंट, कंटेनर रनटाइम सॉकेट को उजागर करता है। |
| `policy/sandbox-container-unconfined-profile`            | कंटेनर सैंडबॉक्स प्रोफ़ाइल अप्रतिबंधित है, जबकि नीति इसे अस्वीकार करती है।                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | सैंडबॉक्स ब्राउज़र CDP स्रोत सीमा अनुपस्थित है, जबकि नीति के अनुसार यह आवश्यक है।             |
| `policy/data-handling-redaction-disabled`                | संवेदनशील लॉगिंग संपादन अक्षम है, जबकि नीति के अनुसार यह आवश्यक है।                  |
| `policy/data-handling-telemetry-content-capture`         | टेलीमेट्री सामग्री कैप्चर सक्षम है, जबकि नीति इसे अस्वीकार करती है।                       |
| `policy/data-handling-session-retention-not-enforced`    | सत्र प्रतिधारण रखरखाव लागू नहीं है, जबकि नीति के अनुसार यह आवश्यक है।            |
| `policy/data-handling-session-transcript-memory-enabled` | सत्र प्रतिलेख मेमोरी इंडेक्सिंग सक्षम है, जबकि नीति इसे अस्वीकार करती है।              |
| `policy/secrets-unmanaged-provider`                      | कोई कॉन्फ़िगरेशन SecretRef ऐसे प्रदाता को संदर्भित करता है जिसे `secrets.providers` के अंतर्गत घोषित नहीं किया गया है।  |
| `policy/secrets-denied-provider-source`                  | कोई कॉन्फ़िगरेशन सीक्रेट प्रदाता या SecretRef ऐसे स्रोत का उपयोग करता है जिसे नीति अस्वीकार करती है।             |
| `policy/secrets-insecure-provider`                       | कोई सीक्रेट प्रदाता असुरक्षित स्थिति चुनता है, जबकि नीति इसे अस्वीकार करती है।               |
| `policy/auth-profile-invalid-metadata`                   | किसी कॉन्फ़िगरेशन प्रमाणीकरण प्रोफ़ाइल में मान्य प्रदाता या मोड मेटाडेटा अनुपस्थित है।                 |
| `policy/auth-profile-unapproved-mode`                    | किसी कॉन्फ़िगरेशन प्रमाणीकरण प्रोफ़ाइल का मोड, नीति की अनुमति-सूची से बाहर है।                       |
| `policy/exec-approvals-missing`                          | नीति के अनुसार `exec-approvals.json` आवश्यक है, लेकिन आर्टिफ़ैक्ट अनुपस्थित है।               |
| `policy/exec-approvals-invalid`                          | कॉन्फ़िगर किए गए निष्पादन स्वीकृति आर्टिफ़ैक्ट को पार्स नहीं किया जा सकता।                          |
| `policy/exec-approvals-default-security-unapproved`      | निष्पादन स्वीकृति डिफ़ॉल्ट ऐसे सुरक्षा मोड का उपयोग करते हैं जो नीति की अनुमति-सूची से बाहर है।          |
| `policy/exec-approvals-agent-security-unapproved`        | किसी प्रति-एजेंट प्रभावी निष्पादन स्वीकृति का सुरक्षा मोड अनुमति-सूची से बाहर है।       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | कोई निष्पादन स्वीकृति एजेंट Skills CLI को निहित रूप से स्वतः अनुमति देता है, जबकि नीति इसे अस्वीकार करती है।   |
| `policy/exec-approvals-allowlist-missing`                | स्वीकृति अनुमति-सूची में नीति द्वारा आवश्यक पैटर्न अनुपस्थित है।                  |
| `policy/exec-approvals-allowlist-unexpected`             | स्वीकृति अनुमति-सूची में ऐसा पैटर्न शामिल है जिसकी नीति को अपेक्षा नहीं है।                |
| `policy/tools-missing-risk-level`                        | किसी नियंत्रित टूल घोषणा में जोखिम मेटाडेटा अनुपस्थित है।                             |
| `policy/tools-unknown-risk-level`                        | किसी नियंत्रित टूल घोषणा में अज्ञात जोखिम मान का उपयोग किया गया है।                           |
| `policy/tools-missing-sensitivity-token`                 | किसी नियंत्रित टूल घोषणा में संवेदनशीलता मेटाडेटा अनुपस्थित है।                      |
| `policy/tools-missing-owner`                             | किसी नियंत्रित टूल घोषणा में स्वामी मेटाडेटा अनुपस्थित है।                            |
| `policy/tools-unknown-sensitivity-token`                 | किसी नियंत्रित टूल घोषणा में अज्ञात संवेदनशीलता मान का उपयोग किया गया है।                    |

किसी निष्कर्ष में `target` (कार्यस्थान में देखी गई वह वस्तु जो
अनुरूप नहीं है) और `requirement` (वह लिखित नियम जिसने इसे निष्कर्ष बनाया)
दोनों शामिल हो सकते हैं। वर्तमान में दोनों `oc://` पता स्ट्रिंग हैं, लेकिन फ़ील्ड नाम पते के
प्रारूप के बजाय नीति की भूमिका बताते हैं।

निष्कर्षों के उदाहरण:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "चैनल 'telegram' अस्वीकृत प्रदाता 'telegram' का उपयोग करता है।",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "इस कार्यस्थान के लिए Telegram स्वीकृत नहीं है।"
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md टूल 'deploy' का कोई स्पष्ट जोखिम वर्गीकरण नहीं है।",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP सर्वर 'remote' नीति की अनुमति-सूची में नहीं है।",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "मॉडल संदर्भ 'anthropic/claude-sonnet-4.7' अस्वीकृत प्रदाता 'anthropic' का उपयोग करता है।",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "नेटवर्क सेटिंग 'browser-private-network' निजी-नेटवर्क पहुँच की अनुमति देती है।",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway बाइंड सेटिंग 'gateway-bind' गैर-लूपबैक एक्सपोज़र की अनुमति देती है।",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway Node कमांड 'system.run' नीति द्वारा अस्वीकृत है, लेकिन OpenClaw कॉन्फ़िगरेशन द्वारा अस्वीकृत नहीं है।",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "'system.run' को gateway.nodes.denyCommands में जोड़ें या समीक्षा के बाद नीति अपडेट करें।"
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "नीति agents.defaults sandbox workspaceAccess 'rw' की अनुमति नहीं देती है।",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## सुधार

`doctor --lint` और `policy check` केवल-पढ़ने योग्य हैं।

`doctor --fix` नीति-प्रबंधित कार्यक्षेत्र सेटिंग्स को केवल तभी संपादित करता है, जब
`workspaceRepairs` स्पष्ट रूप से सक्षम हो; अन्यथा जाँचें बताती हैं कि वे क्या
सुधारतीं और सेटिंग्स को अपरिवर्तित छोड़ देती हैं।

इस संस्करण में, सुधार `channels.denyRules` द्वारा अस्वीकृत चैनलों को अक्षम कर सकता है और
नीचे सूचीबद्ध स्वचालित सीमितकरण सुधार लागू कर सकता है। `workspaceRepairs` को
नीति फ़ाइल की समीक्षा के बाद ही सक्षम करें, क्योंकि कोई मान्य नियम
कार्यस्थल कॉन्फ़िगरेशन बदल सकता है:

- जब कोई वैश्विक नीति उन्नत टूल को प्रतिबंधित करती है, तब `tools.elevated.enabled=false` सेट करें
- जब नीति के अनुसार उन टूल का अस्वीकृत होना आवश्यक हो, तब अनुपस्थित आवश्यक-अस्वीकृति टूल आईडी को `tools.deny` या
  `agents.list[].tools.deny` में जोड़ें
- असुरक्षित `gateway.controlUi.*` टॉगल को `false` पर सेट करें
- जब नीति दूरस्थ Gateway मोड को अस्वीकार करती है, तब `gateway.mode=local` सेट करें
- जब नीति Gateway HTTP API एंडपॉइंट को अस्वीकार करती है, तब रिपोर्ट किए गए `gateway.http.endpoints.*.enabled` पथों को `false` पर सेट करें
- जब नीति खुले समूह के इनग्रेस को अस्वीकार करती है, तब रिपोर्ट किए गए चैनल इनग्रेस `groupPolicy` पथों को `allowlist` पर सेट करें
- जब नीति के अनुसार समूह उल्लेख आवश्यक हों, तब रिपोर्ट किए गए चैनल इनग्रेस `requireMention` पथों को `true` पर सेट करें
- जब नीति के अनुसार संवेदनशील लॉगिंग का
  संशोधन आवश्यक हो, तब `logging.redactSensitive=tools` सेट करें
- जब नीति टेलीमेट्री सामग्री कैप्चर को अस्वीकार करती है, तब `diagnostics.otel.captureContent=false`, या
  ऑब्जेक्ट-रूप टेलीमेट्री कैप्चर सेटिंग्स के लिए
  `diagnostics.otel.captureContent.enabled=false` सेट करें

दायरे में आने वाले उन्नत-टूल सुधार केवल पहचान करते हैं। दायरे में आने वाले डेटा-प्रबंधन सुधारों को
तब भी छोड़ दिया जाता है, जब निष्कर्ष साझा लॉगिंग या टेलीमेट्री कॉन्फ़िगरेशन की रिपोर्ट करता है,
क्योंकि साझा सेटिंग बदलने से दायरे वाली नीति के
लक्ष्य से अधिक प्रभावित होंगे।

दायरे में आने वाले आवश्यक-अस्वीकृति सुधारों को तब छोड़ दिया जाता है, जब निष्कर्ष इनहेरिट किए गए
रूट `tools.deny` की रिपोर्ट करता है, क्योंकि आवश्यक टूल को रूट कॉन्फ़िगरेशन में जोड़ने से
दायरे वाली नीति के लक्ष्य से अधिक प्रभावित होंगे। एजेंट-स्थानीय आवश्यक-अस्वीकृति सुधार
रिपोर्ट किए गए `agents.list[].tools.deny` पथ को अपडेट कर सकते हैं।

दायरे में आने वाले चैनल इनग्रेस सुधारों को तब छोड़ दिया जाता है, जब निष्कर्ष इनहेरिट किए गए
`channels.defaults.*` की रिपोर्ट करता है, क्योंकि साझा चैनल डिफ़ॉल्ट बदलने से
दायरे वाली नीति के लक्ष्य से अधिक प्रभावित होंगे। Gateway HTTP URL-फ़ेच अनुमति-सूची के निष्कर्ष
मैन्युअल रहते हैं, क्योंकि स्वचालित सुधार सही एंडपॉइंट URL
अनुमति-सूची मान नहीं चुन सकता।

Gateway बाइंड और Node-कमांड निष्कर्षों के लिए समीक्षा आवश्यक रहती है। जब
`policy/gateway-non-loopback-bind` या `policy/gateway-node-command-denied`
को किसी कॉन्फ़िगरेशन पथ से मैप किया जा सकता है, तब `doctor --fix` प्रस्तावित
`gateway.bind` या `gateway.nodes.denyCommands` परिवर्तन को छोड़े गए पूर्वावलोकन
मार्गदर्शन के रूप में रिपोर्ट करता है। यह परिवर्तन लागू नहीं करता, और निष्कर्ष को तब तक
सुधारा हुआ नहीं माना जाता, जब तक कोई ऑपरेटर समीक्षा करके कॉन्फ़िगरेशन या नीति अपडेट नहीं करता।

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

## निकास कोड

| कमांड          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | थ्रेशोल्ड पर कोई निष्कर्ष नहीं।                          | एक या अधिक निष्कर्ष थ्रेशोल्ड तक पहुँचे।                             | आर्ग्युमेंट या रनटाइम विफलता। |
| `policy compare` | नीति फ़ाइल कम-से-कम बेसलाइन जितनी सख्त है। | नीति फ़ाइल अमान्य है, अनुपस्थित है या बेसलाइन नियमों से कमजोर है। | आर्ग्युमेंट या रनटाइम विफलता। |
| `policy watch`   | कोई निष्कर्ष नहीं और स्वीकृत हैश वर्तमान है।              | निष्कर्ष मौजूद हैं या स्वीकृत सत्यापन पुराना है।                    | आर्ग्युमेंट या रनटाइम विफलता। |

## संबंधित

- [Doctor लिंट मोड](/hi/cli/doctor#lint-mode)
- [पथ CLI](/hi/cli/path)
