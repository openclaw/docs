---
read_when:
    - आप स्थानीय Docker के बजाय क्लाउड-प्रबंधित सैंडबॉक्स चाहते हैं
    - आप OpenShell Plugin सेट अप कर रहे हैं
    - आपको मिरर और रिमोट वर्कस्पेस मोड में से किसी एक को चुनना होगा
summary: OpenClaw एजेंटों के लिए प्रबंधित सैंडबॉक्स बैकएंड के रूप में OpenShell का उपयोग करें
title: OpenShell
x-i18n:
    generated_at: "2026-07-19T08:51:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell एक प्रबंधित सैंडबॉक्स बैकएंड है: Docker कंटेनरों को स्थानीय रूप से चलाने के बजाय,
OpenClaw सैंडबॉक्स जीवनचक्र को `openshell` CLI को सौंपता है, जो
रिमोट परिवेशों का प्रावधान करता है और SSH पर कमांड निष्पादित करता है।

Plugin सामान्य [SSH बैकएंड](/hi/gateway/sandboxing#ssh-backend) के समान SSH ट्रांसपोर्ट
और रिमोट फ़ाइलसिस्टम ब्रिज का पुनः उपयोग करता है, और इसमें OpenShell
जीवनचक्र (`sandbox create/get/delete/ssh-config`) तथा वैकल्पिक `mirror`
वर्कस्पेस सिंक मोड जोड़ता है।

## पूर्वापेक्षाएँ

- OpenShell Plugin इंस्टॉल हो (`openclaw plugins install @openclaw/openshell-sandbox`)
- `openshell` CLI `PATH` पर हो (या
  `plugins.entries.openshell.config.command` के माध्यम से कस्टम पथ)
- सैंडबॉक्स एक्सेस वाला OpenShell खाता
- होस्ट पर चल रहा OpenClaw Gateway

## त्वरित शुरुआत

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

Gateway को पुनः आरंभ करें। अगले एजेंट टर्न पर OpenClaw एक OpenShell
सैंडबॉक्स बनाता है और टूल निष्पादन को उसके माध्यम से रूट करता है। इससे सत्यापित करें:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## वर्कस्पेस मोड

यह OpenShell से संबंधित सबसे महत्वपूर्ण निर्णय है।

### mirror (डिफ़ॉल्ट)

`plugins.entries.openshell.config.mode: "mirror"` **स्थानीय वर्कस्पेस को
कैनोनिकल** रखता है:

- `exec` से पहले, OpenClaw स्थानीय वर्कस्पेस को सैंडबॉक्स में सिंक करता है।
- `exec` के बाद, OpenClaw रिमोट वर्कस्पेस को वापस स्थानीय वर्कस्पेस में सिंक करता है।
- फ़ाइल टूल सैंडबॉक्स ब्रिज से होकर जाते हैं, लेकिन टर्न के बीच स्थानीय वर्कस्पेस
  सत्य का स्रोत बना रहता है।

डेवलपमेंट वर्कफ़्लो के लिए सर्वोत्तम: OpenClaw के बाहर किए गए स्थानीय संपादन
अगले निष्पादन में दिखाई देते हैं, और सैंडबॉक्स का व्यवहार Docker बैकएंड के काफ़ी करीब होता है।

समझौता: प्रत्येक निष्पादन टर्न पर अपलोड + डाउनलोड की लागत।

### remote

`mode: "remote"` **OpenShell वर्कस्पेस को कैनोनिकल** बनाता है:

- पहली बार सैंडबॉक्स बनाए जाने पर, OpenClaw स्थानीय वर्कस्पेस से रिमोट वर्कस्पेस को
  केवल एक बार सीड करता है।
- इसके बाद, `exec`, `read`, `write`, `edit`, और `apply_patch`
  सीधे रिमोट वर्कस्पेस पर काम करते हैं। OpenClaw रिमोट परिवर्तनों को वापस
  स्थानीय वर्कस्पेस में सिंक **नहीं** करता।
- प्रॉम्प्ट-समय के मीडिया रीड अभी भी काम करते हैं (फ़ाइल/मीडिया टूल
  सैंडबॉक्स ब्रिज के माध्यम से पढ़ते हैं)।

लंबे समय तक चलने वाले एजेंट और CI के लिए सर्वोत्तम: प्रति-टर्न ओवरहेड कम होता है,
और होस्ट-स्थानीय संपादन रिमोट स्थिति को चुपचाप अधिलेखित नहीं कर सकते।

<Warning>
प्रारंभिक सीड के बाद OpenClaw के बाहर होस्ट पर फ़ाइलों में किए गए संपादन रिमोट सैंडबॉक्स को दिखाई नहीं देते। फिर से सीड करने के लिए `openclaw sandbox recreate` चलाएँ।
</Warning>

### मोड चुनना

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **कैनोनिकल वर्कस्पेस**  | स्थानीय होस्ट                 | रिमोट OpenShell          |
| **सिंक दिशा**       | द्विदिशात्मक (प्रत्येक निष्पादन पर) | एक-बार सीड             |
| **प्रति-टर्न ओवरहेड**    | अधिक (अपलोड + डाउनलोड) | कम (सीधे रिमोट संचालन) |
| **स्थानीय संपादन दिखाई देते हैं?** | हाँ, अगले निष्पादन पर          | नहीं, दोबारा बनाए जाने तक        |
| **इनके लिए सर्वोत्तम**             | डेवलपमेंट वर्कफ़्लो      | लंबे समय तक चलने वाले एजेंट, CI   |

## कॉन्फ़िगरेशन संदर्भ

सभी OpenShell कॉन्फ़िगरेशन `plugins.entries.openshell.config` के अंतर्गत रहते हैं:

| कुंजी                       | प्रकार                     | डिफ़ॉल्ट       | विवरण                                                                            |
| ------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` या `"remote"` | `"mirror"`    | वर्कस्पेस सिंक मोड                                                                    |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI का पथ या नाम                                                    |
| `from`                    | `string`                 | `"openclaw"`  | पहली बार बनाए जाने वाले सैंडबॉक्स का स्रोत                                                   |
| `gateway`                 | `string`                 | सेट नहीं         | OpenShell Gateway का नाम (शीर्ष-स्तरीय `--gateway`)                                         |
| `gatewayEndpoint`         | `string`                 | सेट नहीं         | OpenShell Gateway एंडपॉइंट (शीर्ष-स्तरीय `--gateway-endpoint`)                            |
| `policy`                  | `string`                 | सेट नहीं         | सैंडबॉक्स निर्माण के लिए OpenShell नीति ID                                               |
| `providers`               | `string[]`               | `[]`          | सैंडबॉक्स निर्माण के समय जोड़े गए प्रदाता नाम (डुप्लिकेट हटाए गए, प्रत्येक प्रविष्टि पर एक `--provider` फ़्लैग) |
| `gpu`                     | `boolean`                | `false`       | GPU संसाधनों का अनुरोध करें (`--gpu`)                                                        |
| `autoProviders`           | `boolean`                | `true`        | निर्माण के दौरान `--auto-providers` (या false होने पर `--no-auto-providers`) पास करें            |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | सैंडबॉक्स के भीतर प्राथमिक लिखने योग्य वर्कस्पेस                                          |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | एजेंट वर्कस्पेस माउंट पथ (जब वर्कस्पेस एक्सेस `rw` नहीं हो तो केवल-पढ़ने योग्य)               |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI संचालनों के लिए टाइमआउट                                                 |

`remoteWorkspaceDir` और `remoteAgentWorkspaceDir` पूर्ण पथ होने चाहिए और
प्रबंधित रूट `/sandbox` या `/agent` के अंतर्गत रहने चाहिए; अन्य पूर्ण पथ
अस्वीकार कर दिए जाते हैं।

सैंडबॉक्स-स्तरीय सेटिंग्स (`mode`, `scope`, `workspaceAccess`) किसी भी बैकएंड की तरह
`agents.defaults.sandbox` के अंतर्गत रहती हैं। पूर्ण मैट्रिक्स के लिए
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

## जीवनचक्र प्रबंधन

```bash
# सभी सैंडबॉक्स रनटाइम सूचीबद्ध करें (Docker + OpenShell)
openclaw sandbox list

# प्रभावी नीति का निरीक्षण करें
openclaw sandbox explain

# दोबारा बनाएँ (रिमोट वर्कस्पेस हटाता है, अगले उपयोग पर फिर से सीड करता है)
openclaw sandbox recreate --all
```

`remote` मोड के लिए, दोबारा बनाना विशेष रूप से महत्वपूर्ण है: यह उस स्कोप के
कैनोनिकल रिमोट वर्कस्पेस को हटा देता है, और अगला उपयोग स्थानीय वर्कस्पेस से
एक नया वर्कस्पेस सीड करता है। `mirror` मोड के लिए, दोबारा बनाना मुख्यतः रिमोट निष्पादन
परिवेश को रीसेट करता है क्योंकि स्थानीय वर्कस्पेस कैनोनिकल रहता है।

इनमें से किसी को बदलने के बाद दोबारा बनाएँ:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## सुरक्षा सुदृढ़ीकरण

मिरर-मोड फ़ाइलसिस्टम ब्रिज स्थानीय वर्कस्पेस रूट को पिन करता है और प्रत्येक रीड,
राइट, mkdir, रिमूव और रीनेम से पहले कैनोनिकल पथों की (realpath के माध्यम से)
दोबारा जाँच करता है तथा मध्य-पथ सिमलिंक अस्वीकार करता है। सिमलिंक स्वैप या दोबारा
माउंट किया गया वर्कस्पेस फ़ाइल एक्सेस को मिरर किए गए ट्री के बाहर रीडायरेक्ट नहीं कर सकता।

## वर्तमान सीमाएँ

- OpenShell बैकएंड पर सैंडबॉक्स ब्राउज़र समर्थित नहीं है।
- `sandbox.docker.binds` OpenShell पर लागू नहीं होता; यदि बाइंड कॉन्फ़िगर किए गए हों
  तो सैंडबॉक्स निर्माण विफल हो जाता है।
- `sandbox.docker.*` के अंतर्गत Docker-विशिष्ट रनटाइम विकल्प (`env` के अलावा)
  केवल Docker बैकएंड पर लागू होते हैं।

## यह कैसे काम करता है

1. OpenClaw सैंडबॉक्स नाम के लिए `sandbox get` चलाता है (कॉन्फ़िगर किए गए किसी भी
   `--gateway`/`--gateway-endpoint` के साथ); यदि वह विफल होता है तो यह
   `sandbox create` के साथ एक सैंडबॉक्स बनाता है, और सेट होने पर `--name`, `--from`, `--policy`, सक्षम होने पर `--gpu`,
   `--auto-providers`/`--no-auto-providers`, तथा प्रत्येक कॉन्फ़िगर किए गए प्रदाता के लिए एक
   `--provider` फ़्लैग पास करता है।
2. OpenClaw SSH कनेक्शन विवरण प्राप्त करने के लिए सैंडबॉक्स नाम के साथ `sandbox ssh-config`
   चलाता है।
3. कोर SSH कॉन्फ़िगरेशन को एक अस्थायी फ़ाइल में लिखता है और सामान्य SSH बैकएंड वाले
   उसी रिमोट फ़ाइलसिस्टम ब्रिज के माध्यम से SSH सत्र खोलता है।
4. `mirror` मोड में: निष्पादन से पहले स्थानीय से रिमोट में सिंक करें, चलाएँ, फिर बाद में वापस सिंक करें।
5. `remote` मोड में: निर्माण के समय एक बार सीड करें, फिर सीधे रिमोट
   वर्कस्पेस पर काम करें।

## संबंधित

- [सैंडबॉक्सिंग](/hi/gateway/sandboxing) - मोड, स्कोप और बैकएंड तुलना
- [सैंडबॉक्स बनाम टूल नीति बनाम उन्नत](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) - अवरुद्ध टूल की डीबगिंग
- [मल्टी-एजेंट सैंडबॉक्स और टूल](/hi/tools/multi-agent-sandbox-tools) - प्रति-एजेंट ओवरराइड
- [सैंडबॉक्स CLI](/hi/cli/sandbox) - `openclaw sandbox` कमांड
