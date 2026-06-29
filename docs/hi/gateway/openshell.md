---
read_when:
    - आप स्थानीय Docker के बजाय क्लाउड-प्रबंधित सैंडबॉक्स चाहते हैं
    - आप OpenShell Plugin सेट अप कर रहे हैं
    - आपको मिरर और रिमोट वर्कस्पेस मोड के बीच चुनना होगा
summary: OpenClaw एजेंटों के लिए OpenShell को managed sandbox backend के रूप में उपयोग करें
title: OpenShell
x-i18n:
    generated_at: "2026-06-28T23:11:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell, OpenClaw के लिए एक प्रबंधित सैंडबॉक्स बैकएंड है। Docker
कंटेनर स्थानीय रूप से चलाने के बजाय, OpenClaw सैंडबॉक्स लाइफ़साइकल को `openshell` CLI को सौंपता है,
जो SSH-आधारित कमांड निष्पादन के साथ रिमोट परिवेश उपलब्ध कराता है।

OpenShell Plugin वही मूल SSH ट्रांसपोर्ट और रिमोट फ़ाइल सिस्टम
ब्रिज दोबारा उपयोग करता है जो सामान्य [SSH बैकएंड](/hi/gateway/sandboxing#ssh-backend) में है। यह
OpenShell-विशिष्ट लाइफ़साइकल (`sandbox create/get/delete`, `sandbox ssh-config`)
और एक वैकल्पिक `mirror` कार्यस्थान मोड जोड़ता है।

## पूर्वापेक्षाएँ

- OpenShell Plugin इंस्टॉल हो (`openclaw plugins install @openclaw/openshell-sandbox`)
- `openshell` CLI इंस्टॉल हो और `PATH` पर हो (या
  `plugins.entries.openshell.config.command` के ज़रिए कस्टम पथ सेट करें)
- सैंडबॉक्स एक्सेस वाला OpenShell खाता
- होस्ट पर OpenClaw Gateway चल रहा हो

## त्वरित शुरुआत

1. Plugin इंस्टॉल और सक्षम करें, फिर सैंडबॉक्स बैकएंड सेट करें:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Gateway पुनः शुरू करें। अगले एजेंट टर्न पर, OpenClaw एक OpenShell
   सैंडबॉक्स बनाता है और टूल निष्पादन को उसके ज़रिए रूट करता है।

3. सत्यापित करें:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## कार्यस्थान मोड

OpenShell का उपयोग करते समय यह सबसे महत्वपूर्ण निर्णय है।

### `mirror`

जब आप चाहते हैं कि **स्थानीय
कार्यस्थान canonical बना रहे**, तब `plugins.entries.openshell.config.mode: "mirror"` का उपयोग करें।

व्यवहार:

- `exec` से पहले, OpenClaw स्थानीय कार्यस्थान को OpenShell सैंडबॉक्स में सिंक करता है।
- `exec` के बाद, OpenClaw रिमोट कार्यस्थान को वापस स्थानीय कार्यस्थान में सिंक करता है।
- फ़ाइल टूल अब भी सैंडबॉक्स ब्रिज के ज़रिए काम करते हैं, लेकिन स्थानीय कार्यस्थान
  टर्न के बीच सत्य का स्रोत बना रहता है।

इसके लिए सर्वोत्तम:

- आप OpenClaw के बाहर स्थानीय रूप से फ़ाइलें संपादित करते हैं और चाहते हैं कि वे बदलाव
  सैंडबॉक्स में अपने-आप दिखें।
- आप चाहते हैं कि OpenShell सैंडबॉक्स Docker बैकएंड जैसा
  अधिकतम व्यवहार करे।
- आप चाहते हैं कि प्रत्येक exec टर्न के बाद होस्ट कार्यस्थान में सैंडबॉक्स लिखाइयाँ दिखें।

ट्रेडऑफ़: प्रत्येक exec से पहले और बाद अतिरिक्त सिंक लागत।

### `remote`

जब आप चाहते हैं कि
**OpenShell कार्यस्थान canonical बन जाए**, तब `plugins.entries.openshell.config.mode: "remote"` का उपयोग करें।

व्यवहार:

- जब सैंडबॉक्स पहली बार बनाया जाता है, OpenClaw स्थानीय कार्यस्थान से
  रिमोट कार्यस्थान को एक बार सीड करता है।
- उसके बाद, `exec`, `read`, `write`, `edit`, और `apply_patch` सीधे
  रिमोट OpenShell कार्यस्थान पर काम करते हैं।
- OpenClaw रिमोट बदलावों को स्थानीय कार्यस्थान में वापस सिंक **नहीं** करता।
- प्रॉम्प्ट-समय मीडिया रीड अब भी काम करते हैं क्योंकि फ़ाइल और मीडिया टूल
  सैंडबॉक्स ब्रिज के ज़रिए पढ़ते हैं।

इसके लिए सर्वोत्तम:

- सैंडबॉक्स मुख्यतः रिमोट पक्ष पर रहना चाहिए।
- आप प्रति-टर्न सिंक ओवरहेड कम चाहते हैं।
- आप नहीं चाहते कि होस्ट-स्थानीय संपादन चुपचाप रिमोट सैंडबॉक्स स्थिति को ओवरराइट करें।

<Warning>
यदि आप शुरुआती सीड के बाद OpenClaw के बाहर होस्ट पर फ़ाइलें संपादित करते हैं, तो रिमोट सैंडबॉक्स वे बदलाव **नहीं** देखता। दोबारा सीड करने के लिए `openclaw sandbox recreate` का उपयोग करें।
</Warning>

### मोड चुनना

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Canonical कार्यस्थान** | स्थानीय होस्ट              | रिमोट OpenShell           |
| **सिंक दिशा**            | द्विदिश (प्रत्येक exec)    | एक-बार सीड                |
| **प्रति-टर्न ओवरहेड**    | अधिक (अपलोड + डाउनलोड)    | कम (सीधे रिमोट ऑपरेशन)   |
| **स्थानीय संपादन दिखते हैं?** | हाँ, अगले exec पर      | नहीं, recreate तक         |
| **इसके लिए सर्वोत्तम**   | विकास वर्कफ़्लो            | लंबे समय तक चलने वाले एजेंट, CI |

## कॉन्फ़िगरेशन संदर्भ

सभी OpenShell कॉन्फ़िगरेशन `plugins.entries.openshell.config` के अंतर्गत रहते हैं:

| कुंजी                     | प्रकार                   | डिफ़ॉल्ट      | विवरण                                                 |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` या `"remote"` | `"mirror"`    | कार्यस्थान सिंक मोड                                   |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI का पथ या नाम                          |
| `from`                    | `string`                 | `"openclaw"`  | पहली बार बनाने के लिए सैंडबॉक्स स्रोत                 |
| `gateway`                 | `string`                 | —             | OpenShell Gateway नाम (`--gateway`)                   |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway एंडपॉइंट URL (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | सैंडबॉक्स निर्माण के लिए OpenShell नीति ID            |
| `providers`               | `string[]`               | `[]`          | सैंडबॉक्स बनाते समय संलग्न करने के लिए प्रदाता नाम   |
| `gpu`                     | `boolean`                | `false`       | GPU संसाधन अनुरोध करें                                |
| `autoProviders`           | `boolean`                | `true`        | सैंडबॉक्स बनाते समय `--auto-providers` पास करें       |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | सैंडबॉक्स के भीतर प्राथमिक लिखने योग्य कार्यस्थान    |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | एजेंट कार्यस्थान माउंट पथ (रीड-ओनली एक्सेस के लिए)   |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI ऑपरेशन के लिए टाइमआउट                 |

सैंडबॉक्स-स्तर सेटिंग्स (`mode`, `scope`, `workspaceAccess`) किसी भी बैकएंड की तरह
`agents.defaults.sandbox` के अंतर्गत कॉन्फ़िगर की जाती हैं। पूर्ण मैट्रिक्स के लिए
[सैंडबॉक्सिंग](/hi/gateway/sandboxing) देखें।

## उदाहरण

### न्यूनतम रिमोट सेटअप

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### GPU के साथ मिरर मोड

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### कस्टम Gateway के साथ प्रति-एजेंट OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## लाइफ़साइकल प्रबंधन

OpenShell सैंडबॉक्स सामान्य सैंडबॉक्स CLI के ज़रिए प्रबंधित किए जाते हैं:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

`remote` मोड के लिए, **recreate विशेष रूप से महत्वपूर्ण है**: यह उस स्कोप के लिए canonical
रिमोट कार्यस्थान मिटा देता है। अगला उपयोग स्थानीय कार्यस्थान से एक नया रिमोट कार्यस्थान
सीड करता है।

`mirror` मोड के लिए, recreate मुख्य रूप से रिमोट निष्पादन परिवेश रीसेट करता है क्योंकि
स्थानीय कार्यस्थान canonical बना रहता है।

### कब recreate करें

इनमें से कोई भी बदलने के बाद recreate करें:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## सुरक्षा सख्ती

OpenShell कार्यस्थान root fd को pin करता है और प्रत्येक
read से पहले सैंडबॉक्स पहचान दोबारा जाँचता है, इसलिए symlink swaps या फिर से माउंट किया गया कार्यस्थान
रीड को इच्छित रिमोट कार्यस्थान से बाहर redirect नहीं कर सकता।

## मौजूदा सीमाएँ

- सैंडबॉक्स ब्राउज़र OpenShell बैकएंड पर समर्थित नहीं है।
- `sandbox.docker.binds` OpenShell पर लागू नहीं होता।
- `sandbox.docker.*` के अंतर्गत Docker-विशिष्ट रनटाइम knobs केवल Docker
  बैकएंड पर लागू होते हैं।

## यह कैसे काम करता है

1. OpenClaw `openshell sandbox create` को कॉल करता है (कॉन्फ़िगर किए अनुसार `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` फ़्लैग के साथ)।
2. OpenClaw सैंडबॉक्स के लिए SSH कनेक्शन
   विवरण पाने हेतु `openshell sandbox ssh-config <name>` कॉल करता है।
3. Core SSH कॉन्फ़िग को एक अस्थायी फ़ाइल में लिखता है और सामान्य SSH बैकएंड जैसे
   उसी रिमोट फ़ाइल सिस्टम ब्रिज का उपयोग करके SSH सत्र खोलता है।
4. `mirror` मोड में: exec से पहले स्थानीय को रिमोट पर सिंक करें, चलाएँ, exec के बाद वापस सिंक करें।
5. `remote` मोड में: create पर एक बार सीड करें, फिर सीधे रिमोट
   कार्यस्थान पर काम करें।

## संबंधित

- [सैंडबॉक्सिंग](/hi/gateway/sandboxing) -- मोड, स्कोप, और बैकएंड तुलना
- [सैंडबॉक्स बनाम टूल नीति बनाम Elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) -- ब्लॉक किए गए टूल डीबग करना
- [मल्टी-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools) -- प्रति-एजेंट ओवरराइड
- [सैंडबॉक्स CLI](/hi/cli/sandbox) -- `openclaw sandbox` कमांड
