---
read_when:
    - आप बंडल किए गए Codex app-server हार्नेस का उपयोग करना चाहते हैं
    - आपको Codex harness कॉन्फ़िगरेशन उदाहरण चाहिए
    - आप चाहते हैं कि केवल Codex वाले परिनियोजन OpenClaw पर वापस जाने के बजाय विफल हों
summary: बंडल किए गए Codex ऐप-सर्वर हार्नेस के माध्यम से OpenClaw एम्बेडेड एजेंट टर्न चलाएँ
title: Codex हार्नेस
x-i18n:
    generated_at: "2026-06-28T23:33:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

बंडल किया गया `codex` Plugin OpenClaw को बिल्ट-इन OpenClaw हार्नेस के बजाय
Codex app-server के माध्यम से एम्बेडेड OpenAI एजेंट टर्न चलाने देता है.

Codex हार्नेस का उपयोग तब करें जब आप चाहते हैं कि निम्न-स्तरीय एजेंट सत्र का
स्वामित्व Codex के पास हो: नेटिव थ्रेड रिज्यूम, नेटिव टूल कंटिन्यूएशन, नेटिव
Compaction, और app-server निष्पादन. OpenClaw अब भी चैट चैनलों, सत्र फ़ाइलों,
मॉडल चयन, OpenClaw डायनेमिक टूल्स, अनुमोदनों, मीडिया डिलीवरी, और दिखने वाले
ट्रांसक्रिप्ट मिरर का स्वामी रहता है.

सामान्य सेटअप `openai/gpt-5.5` जैसे कैनोनिकल OpenAI मॉडल रेफ़ इस्तेमाल करता है.
लेगेसी Codex GPT रेफ़ कॉन्फ़िगर न करें. OpenAI एजेंट ऑथ क्रम को
`auth.order.openai` के अंतर्गत रखें; पुराने लेगेसी Codex ऑथ प्रोफ़ाइल ids और
लेगेसी Codex ऑथ क्रम प्रविष्टियां लेगेसी स्टेट हैं जिन्हें
`openclaw doctor --fix` द्वारा सुधारा जाता है.

जब कोई OpenClaw सैंडबॉक्स सक्रिय नहीं होता, OpenClaw Codex app-server थ्रेड्स
को Codex नेटिव कोड मोड सक्षम करके शुरू करता है, जबकि code-mode-only को डिफ़ॉल्ट
रूप से बंद छोड़ता है. इससे Codex नेटिव वर्कस्पेस और कोड क्षमताएं उपलब्ध रहती
हैं, जबकि OpenClaw डायनेमिक टूल्स app-server `item/tool/call` ब्रिज के माध्यम से
जारी रहते हैं. सक्रिय OpenClaw सैंडबॉक्सिंग और प्रतिबंधित टूल नीतियां नेटिव कोड
मोड को पूरी तरह अक्षम कर देती हैं, जब तक कि आप प्रायोगिक सैंडबॉक्स exec-server
पथ में ऑप्ट इन न करें.

यह Codex-नेटिव सुविधा
[OpenClaw कोड मोड](/hi/reference/code-mode) से अलग है, जो अलग `exec` इनपुट आकार के
साथ जेनेरिक OpenClaw रन के लिए एक ऑप्ट-इन QuickJS-WASI रनटाइम है.

व्यापक मॉडल/प्रोवाइडर/रनटाइम विभाजन के लिए,
[एजेंट रनटाइम्स](/hi/concepts/agent-runtimes) से शुरू करें. छोटा संस्करण यह है:
`openai/gpt-5.5` मॉडल रेफ़ है, `codex` रनटाइम है, और Telegram,
Discord, Slack, या कोई अन्य चैनल संचार सतह रहता है.

## आवश्यकताएं

- OpenClaw जिसमें बंडल किया गया `codex` Plugin उपलब्ध हो.
- यदि आपका कॉन्फ़िग `plugins.allow` इस्तेमाल करता है, तो `codex` शामिल करें.
- Codex app-server `0.125.0` या नया. बंडल किया गया Plugin डिफ़ॉल्ट रूप से संगत
  Codex app-server बाइनरी प्रबंधित करता है, इसलिए `PATH` पर स्थानीय `codex`
  कमांड सामान्य हार्नेस स्टार्टअप को प्रभावित नहीं करते.
- Codex ऑथ `openclaw models auth login --provider openai` के माध्यम से, एजेंट के
  Codex होम में app-server अकाउंट के माध्यम से, या स्पष्ट Codex API-key ऑथ
  प्रोफ़ाइल के माध्यम से उपलब्ध हो.

ऑथ प्राथमिकता, वातावरण आइसोलेशन, कस्टम app-server कमांड, मॉडल डिस्कवरी, और सभी
कॉन्फ़िग फ़ील्ड के लिए,
[Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें.

## क्विकस्टार्ट

अधिकांश उपयोगकर्ता जो OpenClaw में Codex चाहते हैं, यह पथ चाहते हैं: ChatGPT/Codex
सब्सक्रिप्शन से साइन इन करें, बंडल किया गया `codex` Plugin सक्षम करें, और
कैनोनिकल `openai/gpt-*` मॉडल रेफ़ इस्तेमाल करें.

Codex OAuth से साइन इन करें:

```bash
openclaw models auth login --provider openai
```

बंडल किया गया `codex` Plugin सक्षम करें और OpenAI एजेंट मॉडल चुनें:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

यदि आपका कॉन्फ़िग `plugins.allow` इस्तेमाल करता है, तो वहां भी `codex` जोड़ें:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Plugin कॉन्फ़िग बदलने के बाद Gateway को रीस्टार्ट करें. यदि किसी मौजूदा चैट में
पहले से सत्र है, तो रनटाइम बदलावों की जांच करने से पहले `/new` या `/reset`
इस्तेमाल करें ताकि अगला टर्न वर्तमान कॉन्फ़िग से हार्नेस रिज़ॉल्व करे.

## कॉन्फ़िगरेशन

क्विकस्टार्ट कॉन्फ़िग न्यूनतम व्यवहार्य Codex हार्नेस कॉन्फ़िग है. Codex हार्नेस
विकल्प OpenClaw कॉन्फ़िग में सेट करें, और CLI का उपयोग केवल Codex ऑथ के लिए
करें:

| आवश्यकता                              | सेट करें                                                                         | कहां                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| हार्नेस सक्षम करें                    | `plugins.entries.codex.enabled: true`                                            | OpenClaw कॉन्फ़िग                  |
| allowlisted Plugin इंस्टॉल रखें       | `plugins.allow` में `codex` शामिल करें                                           | OpenClaw कॉन्फ़िग                  |
| OpenAI एजेंट टर्न Codex से रूट करें   | `agents.defaults.model` या `agents.list[].model` को `openai/gpt-*` के रूप में    | OpenClaw एजेंट कॉन्फ़िग            |
| ChatGPT/Codex OAuth से साइन इन करें   | `openclaw models auth login --provider openai`                                   | CLI ऑथ प्रोफ़ाइल                  |
| Codex रन के लिए API-key बैकअप जोड़ें  | `auth.order.openai` में सब्सक्रिप्शन ऑथ के बाद सूचीबद्ध `openai:*` API-key प्रोफ़ाइल | CLI ऑथ प्रोफ़ाइल + OpenClaw कॉन्फ़िग |
| Codex अनुपलब्ध हो तो fail closed करें | प्रोवाइडर या मॉडल `agentRuntime.id: "codex"`                                     | OpenClaw मॉडल/प्रोवाइडर कॉन्फ़िग  |
| सीधे OpenAI API ट्रैफ़िक इस्तेमाल करें | सामान्य OpenAI ऑथ के साथ प्रोवाइडर या मॉडल `agentRuntime.id: "openclaw"`        | OpenClaw मॉडल/प्रोवाइडर कॉन्फ़िग  |
| app-server व्यवहार ट्यून करें         | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin कॉन्फ़िग              |
| नेटिव Codex Plugin ऐप्स सक्षम करें    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin कॉन्फ़िग              |
| Codex Computer Use सक्षम करें         | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin कॉन्फ़िग              |

Codex-समर्थित OpenAI एजेंट टर्न के लिए `openai/gpt-*` मॉडल रेफ़ इस्तेमाल करें.
सब्सक्रिप्शन-प्रथम/API-key-बैकअप क्रम के लिए `auth.order.openai` को प्राथमिकता
दें. मौजूदा लेगेसी Codex ऑथ प्रोफ़ाइल ids और लेगेसी Codex ऑथ क्रम केवल doctor
लेगेसी स्टेट हैं; नए लेगेसी Codex GPT रेफ़ न लिखें.

Codex-समर्थित एजेंटों पर `compaction.model` या `compaction.provider` सेट न करें.
Codex अपनी नेटिव app-server थ्रेड स्टेट के माध्यम से compact करता है, इसलिए
OpenClaw रनटाइम पर उन स्थानीय summarizer ओवरराइड्स को अनदेखा करता है और जब
एजेंट Codex इस्तेमाल करता है तो `openclaw doctor --fix` उन्हें हटा देता है.

Lossless अब भी Codex टर्न के आस-पास असेंबली, ingestion, और मेंटेनेंस के लिए
context engine के रूप में समर्थित है. इसे
`plugins.slots.contextEngine: "lossless-claw"` और
`plugins.entries.lossless-claw.config.summaryModel` के माध्यम से कॉन्फ़िगर करें,
`agents.defaults.compaction.provider` के माध्यम से नहीं. जब Codex सक्रिय रनटाइम
होता है, `openclaw doctor --fix` पुराने `compaction.provider: "lossless-claw"`
आकार को Lossless context-engine स्लॉट में माइग्रेट करता है, लेकिन नेटिव Codex अब
भी compaction का स्वामी रहता है.

नेटिव Codex app-server हार्नेस ऐसे context engines का समर्थन करता है जिन्हें
pre-prompt असेंबली चाहिए. `codex-cli` सहित जेनेरिक CLI बैकएंड वह होस्ट क्षमता
प्रदान नहीं करते.

Codex-समर्थित एजेंटों के लिए, `/compact` बाउंड थ्रेड पर नेटिव Codex app-server
compaction शुरू करता है. OpenClaw पूर्णता की प्रतीक्षा नहीं करता, OpenClaw
टाइमआउट लागू नहीं करता, साझा app-server को रीस्टार्ट नहीं करता, या context-engine
या सार्वजनिक OpenAI summarizer पर वापस नहीं जाता. यदि नेटिव Codex थ्रेड बाइंडिंग
गुम या stale है, तो कमांड fail closed करता है ताकि ऑपरेटर को compaction बैकएंड
चुपचाप बदलने के बजाय वास्तविक रनटाइम सीमा दिखे.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

उस आकार में, दोनों प्रोफ़ाइल अब भी `openai/gpt-*` एजेंट टर्न के लिए Codex के
माध्यम से चलते हैं. API key केवल ऑथ fallback है, OpenClaw या साधारण OpenAI
Responses पर स्विच करने का अनुरोध नहीं.

इस पेज का बाकी भाग उन सामान्य वैरिएंट्स को कवर करता है जिनके बीच उपयोगकर्ताओं को
चुनना होता है: deployment shape, fail-closed routing, guardian approval policy,
नेटिव Codex plugins, और Computer Use. पूर्ण विकल्प सूचियों, डिफ़ॉल्ट्स, enums,
discovery, environment isolation, timeouts, और app-server transport fields के लिए,
[Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें.

## Codex रनटाइम सत्यापित करें

जिस चैट में आप Codex की अपेक्षा करते हैं, उसमें `/status` इस्तेमाल करें. Codex-समर्थित
OpenAI एजेंट टर्न दिखाता है:

```text
Runtime: OpenAI Codex
```

फिर Codex app-server स्टेट जांचें:

```text
/codex status
/codex models
```

`/codex status` app-server कनेक्टिविटी, अकाउंट, rate limits, MCP servers, और
skills रिपोर्ट करता है. `/codex models` हार्नेस और अकाउंट के लिए लाइव Codex
app-server catalog सूचीबद्ध करता है. यदि `/status` चौंकाता है, तो
[समस्या निवारण](#troubleshooting) देखें.

## रूटिंग और मॉडल चयन

प्रोवाइडर रेफ़ और रनटाइम नीति को अलग रखें:

- Codex के माध्यम से OpenAI एजेंट टर्न के लिए `openai/gpt-*` इस्तेमाल करें.
- कॉन्फ़िग में लेगेसी Codex GPT रेफ़ इस्तेमाल न करें. लेगेसी रेफ़ और stale
  session route pins सुधारने के लिए `openclaw doctor --fix` चलाएं.
- `agentRuntime.id: "codex"` सामान्य OpenAI auto mode के लिए वैकल्पिक है, लेकिन
  तब उपयोगी है जब deployment को Codex अनुपलब्ध होने पर fail closed करना चाहिए.
- `agentRuntime.id: "openclaw"` किसी प्रोवाइडर या मॉडल को OpenClaw एम्बेडेड
  रनटाइम में ऑप्ट करता है, जब यह इरादतन हो.
- `/codex ...` चैट से नेटिव Codex app-server conversations को नियंत्रित करता है.
- ACP/acpx एक अलग बाहरी हार्नेस पथ है. इसका उपयोग केवल तब करें जब उपयोगकर्ता
  ACP/acpx या बाहरी हार्नेस adapter मांगे.

सामान्य कमांड रूटिंग:

| उपयोगकर्ता आशय                                      | उपयोग करें                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| वर्तमान चैट अटैच करें                              | `/codex bind [--cwd <path>]`                                                                          |
| मौजूदा Codex थ्रेड रिज्यूम करें                    | `/codex resume <thread-id>`                                                                           |
| Codex थ्रेड सूचीबद्ध या फ़िल्टर करें               | `/codex threads [filter]`                                                                             |
| नेटिव Codex plugins सूचीबद्ध करें                  | `/codex plugins list`                                                                                 |
| कॉन्फ़िगर किया गया नेटिव Codex Plugin सक्षम या अक्षम करें | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| paired node पर मौजूदा Codex CLI सत्र अटैच करें     | `/codex sessions --host <node> [filter]`, फिर `/codex resume <session-id> --host <node> --bind here` |
| केवल Codex feedback भेजें                          | `/codex diagnostics [note]`                                                                           |
| ACP/acpx task शुरू करें                            | ACP/acpx session commands, `/codex` नहीं                                                              |

| उपयोग का मामला                                             | कॉन्फ़िगर करें                                                              | सत्यापित करें                                  | नोट्स                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| मूल Codex runtime के साथ ChatGPT/Codex सदस्यता | सक्षम `codex` plugin के साथ `openai/gpt-*`                             | `/status` `Runtime: OpenAI Codex` दिखाता है | अनुशंसित पथ                      |
| यदि Codex अनुपलब्ध हो तो fail closed करें                  | Provider या model `agentRuntime.id: "codex"`                           | एम्बेडेड fallback के बजाय turn विफल होता है | केवल Codex deployments के लिए उपयोग करें        |
| OpenClaw के माध्यम से प्रत्यक्ष OpenAI API-key ट्रैफ़िक       | Provider या model `agentRuntime.id: "openclaw"` और सामान्य OpenAI auth | `/status` OpenClaw runtime दिखाता है        | केवल तब उपयोग करें जब OpenClaw जानबूझकर हो |
| Legacy config                                        | legacy Codex GPT refs                                                  | `openclaw doctor --fix` इसे फिर से लिखता है     | इस तरह नया config न लिखें      |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP task/session status                 | मूल Codex harness से अलग    |

`agents.defaults.imageModel` वही prefix split अपनाता है। सामान्य OpenAI route
के लिए `openai/gpt-*` और `codex/gpt-*` केवल तब उपयोग करें जब image understanding
एक bounded Codex app-server turn के माध्यम से चलनी चाहिए। legacy Codex GPT refs
का उपयोग न करें; doctor उस legacy prefix को `openai/gpt-*` में फिर से लिखता है।

## Deployment patterns

### बुनियादी Codex deployment

जब सभी OpenAI agent turns को default रूप से Codex का उपयोग करना चाहिए, तो
quickstart config का उपयोग करें।

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### मिश्रित provider deployment

यह shape Claude को default agent के रूप में रखता है और एक named Codex agent जोड़ता है:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

इस config के साथ, `main` agent अपने सामान्य provider path का उपयोग करता है और
`codex` agent Codex app-server का उपयोग करता है।

### Fail-closed Codex deployment

OpenAI agent turns के लिए, `openai/gpt-*` पहले से ही Codex पर resolve होता है जब
bundled plugin उपलब्ध हो। जब आप एक लिखित fail-closed rule चाहते हैं, तो explicit runtime policy जोड़ें:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex को force करने पर, यदि Codex plugin disabled है, app-server बहुत पुराना है,
या app-server शुरू नहीं हो सकता, तो OpenClaw जल्दी विफल हो जाता है।

## App-server policy

Default रूप से, plugin stdio transport के साथ OpenClaw की managed Codex binary को
local रूप से शुरू करता है। `appServer.command` केवल तब set करें जब आप जानबूझकर
एक अलग executable चलाना चाहते हों। WebSocket transport केवल तब उपयोग करें जब कोई
app-server पहले से कहीं और चल रहा हो:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Local stdio app-server sessions trusted local operator posture पर default होते हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यदि local Codex requirements उस implicit YOLO
posture की अनुमति नहीं देतीं, तो OpenClaw इसके बजाय allowed guardian permissions चुनता है।
जब session के लिए OpenClaw sandbox active हो, तो OpenClaw उस turn के लिए Codex
native Code Mode, user MCP servers, और app-backed plugin execution को disable करता है,
Codex host-side sandboxing पर निर्भर रहने के बजाय। Shell access सामान्य
exec/process tools उपलब्ध होने पर `sandbox_exec` और `sandbox_process` जैसे
OpenClaw sandbox-backed dynamic tools के माध्यम से expose किया जाता है।

जब आप sandbox escapes या extra permissions से पहले Codex native auto-review चाहते हों,
तो normalized OpenClaw exec mode का उपयोग करें:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex app-server sessions के लिए, OpenClaw `tools.exec.mode: "auto"` को Codex
Guardian-reviewed approvals पर map करता है, आम तौर पर
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, और
`sandbox: "workspace-write"` जब local requirements उन values की अनुमति देती हैं।
`tools.exec.mode: "auto"` में, OpenClaw legacy unsafe Codex
`approvalPolicy: "never"` या `sandbox: "danger-full-access"` overrides को preserve
नहीं करता; जानबूझकर no-approval Codex posture के लिए `tools.exec.mode: "full"` का
उपयोग करें। legacy `plugins.entries.codex.config.appServer.mode: "guardian"` preset
अब भी काम करता है, लेकिन `tools.exec.mode: "auto"` normalized OpenClaw surface है।

host exec approvals और ACPX permissions के साथ mode-level comparison के लिए,
[Permission modes](/hi/tools/permission-modes) देखें।

हर app-server field, auth order, environment isolation, discovery, और
timeout behavior के लिए, [Codex harness reference](/hi/plugins/codex-harness-reference) देखें।

## Commands और diagnostics

bundled plugin किसी भी ऐसे channel पर `/codex` को slash command के रूप में register करता है
जो OpenClaw text commands को support करता है।

सामान्य forms:

- `/codex status` app-server connectivity, models, account, rate limits,
  MCP servers, और skills की जाँच करता है।
- `/codex models` live Codex app-server models सूचीबद्ध करता है।
- `/codex threads [filter]` हाल के Codex app-server threads सूचीबद्ध करता है।
- `/codex resume <thread-id>` वर्तमान OpenClaw session को किसी
  मौजूदा Codex thread से जोड़ता है।
- `/codex compact` Codex app-server से attached thread को compact करने के लिए कहता है।
- `/codex review` attached thread के लिए Codex native review शुरू करता है।
- `/codex diagnostics [note]` attached thread के लिए Codex feedback भेजने से पहले पूछता है।
- `/codex account` account और rate-limit status दिखाता है।
- `/codex mcp` Codex app-server MCP server status सूचीबद्ध करता है।
- `/codex skills` Codex app-server skills सूचीबद्ध करता है।

अधिकांश support reports के लिए, उस conversation में `/diagnostics [note]` से शुरू करें
जहाँ bug हुआ था। यह एक Gateway diagnostics report बनाता है और, Codex
harness sessions के लिए, relevant Codex feedback bundle भेजने की approval माँगता है।
privacy model और group chat behavior के लिए [Diagnostics export](/hi/gateway/diagnostics) देखें।

`/codex diagnostics [note]` केवल तब उपयोग करें जब आप full Gateway diagnostics bundle
के बिना currently attached thread के लिए specifically Codex feedback upload चाहते हों।

### Codex threads को local रूप से inspect करें

खराब Codex run को inspect करने का सबसे तेज़ तरीका अक्सर native Codex
thread को सीधे खोलना होता है:

```bash
codex resume <thread-id>
```

thread id completed `/diagnostics` reply, `/codex binding`, या
`/codex threads [filter]` से प्राप्त करें।

upload mechanics और runtime-level diagnostics boundaries के लिए,
[Codex harness runtime](/hi/plugins/codex-harness-runtime#codex-feedback-upload) देखें।

Auth इस order में चुना जाता है:

1. agent के लिए ordered OpenAI auth profiles, अधिमानतः
   `auth.order.openai` के अंतर्गत। पुराने legacy Codex auth profile ids और
   legacy Codex auth order को migrate करने के लिए `openclaw doctor --fix` चलाएँ।
2. उस agent के Codex home में app-server का मौजूदा account।
3. केवल local stdio app-server launches के लिए, जब कोई app-server account मौजूद न हो और OpenAI auth
   अब भी required हो, तो `CODEX_API_KEY`, फिर `OPENAI_API_KEY`।

जब OpenClaw को ChatGPT subscription-style Codex auth profile दिखती है, तो यह spawned
Codex child process से `CODEX_API_KEY` और `OPENAI_API_KEY` हटा देता है। इससे
Gateway-level API keys embeddings या direct OpenAI models के लिए उपलब्ध रहती हैं,
बिना native Codex app-server turns को गलती से API के माध्यम से bill कराए।
Explicit Codex API-key profiles और local stdio env-key fallback inherited child-process
env के बजाय app-server login का उपयोग करते हैं। WebSocket app-server connections
Gateway env API-key fallback प्राप्त नहीं करते; explicit auth profile या
remote app-server के अपने account का उपयोग करें।
जब native Codex plugins configured होते हैं, तो OpenClaw Codex thread को
plugin-owned apps expose करने से पहले connected app-server के माध्यम से उन
plugins को install या refresh करता है। `app/list` app ids, accessibility, और metadata
के लिए source of truth रहता है, लेकिन OpenClaw per-thread enablement decision का owner है:
यदि policy किसी listed accessible app की अनुमति देती है, तो OpenClaw
`thread/start.config.apps[appId].enabled = true` भेजता है, भले ही `app/list` वर्तमान में
उस app को disabled report करे। यह path unknown ids के लिए app installation invent नहीं करता;
OpenClaw केवल marketplace plugins को `plugin/install` के साथ activate करता है
और फिर inventory refresh करता है।

यदि subscription profile Codex usage limit से टकराता है, तो जब Codex reset time
report करता है, OpenClaw उसे record करता है और उसी Codex run के लिए अगले ordered
auth profile को try करता है। reset time बीतने पर, subscription profile फिर eligible
हो जाता है, selected `openai/gpt-*` model या Codex runtime बदले बिना।

local stdio app-server launches के लिए, OpenClaw `CODEX_HOME` को per-agent
directory पर set करता है ताकि Codex config, auth/account files, plugin cache/data,
और native thread state default रूप से operator के personal `~/.codex` को read या write
न करें। OpenClaw सामान्य process `HOME` preserve करता है; Codex-run subprocesses
अब भी user-home config और tokens ढूँढ़ सकते हैं, और Codex shared
`$HOME/.agents/skills` और `$HOME/.agents/plugins/marketplace.json` entries discover कर सकता है।

यदि किसी deployment को additional environment isolation चाहिए, तो वे variables
`appServer.clearEnv` में जोड़ें:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` केवल spawned Codex app-server child process को affect करता है।
OpenClaw local launch normalization के दौरान इस list से `CODEX_HOME` और `HOME` हटा देता है:
`CODEX_HOME` per-agent रहता है, और `HOME` inherited रहता है ताकि
subprocesses सामान्य user-home state का उपयोग कर सकें।

Codex dynamic tools डिफ़ॉल्ट रूप से `searchable` लोडिंग का उपयोग करते हैं। OpenClaw
ऐसे dynamic tools उजागर नहीं करता जो Codex-नेटिव कार्यक्षेत्र ऑपरेशन की नक़ल करते हैं:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, और `update_plan`। शेष अधिकांश
OpenClaw इंटीग्रेशन tools, जैसे मैसेजिंग, मीडिया, Cron, ब्राउज़र, नोड्स,
Gateway, और `heartbeat_respond`, `openclaw` namespace के तहत Codex tool search के
माध्यम से उपलब्ध हैं, जिससे प्रारंभिक मॉडल संदर्भ छोटा रहता है। जब खोज सक्षम हो और
कोई managed provider चयनित न हो, तो वेब खोज डिफ़ॉल्ट रूप से Codex के होस्टेड
`web_search` tool का उपयोग करती है। नेटिव होस्टेड खोज और OpenClaw का managed
`web_search` dynamic tool परस्पर अनन्य हैं, ताकि managed खोज नेटिव डोमेन प्रतिबंधों
को बायपास न कर सके। OpenClaw managed tool का उपयोग तब करता है जब होस्टेड खोज
अनुपलब्ध हो, स्पष्ट रूप से अक्षम हो, या किसी चयनित managed provider से बदल दी गई हो।
OpenClaw Codex के standalone `web.run` एक्सटेंशन को अक्षम रखता है क्योंकि
production app-server ट्रैफ़िक उसके उपयोगकर्ता-परिभाषित `web` namespace को अस्वीकार
करता है। `tools.web.search.enabled: false` दोनों paths को अक्षम करता है, जैसे
tool-disabled केवल-LLM रन करते हैं। Codex `"cached"` को प्राथमिकता के रूप में मानता
है और unrestricted app-server turns के लिए उसे live external access में resolve करता है।
Automatic managed fallback तब fail closed होता है जब native `allowedDomains` सेट हों,
ताकि allowlist को बायपास न किया जा सके। Persistent effective search-policy बदलाव
अगले turn से पहले bound Codex thread को rotate करते हैं। Transient per-turn प्रतिबंध
एक अस्थायी restricted thread का उपयोग करते हैं और बाद में resume के लिए मौजूदा binding
को बनाए रखते हैं। `sessions_yield` और केवल message-tool वाले source replies सीधे रहते हैं
क्योंकि वे turn-control contracts हैं। `sessions_spawn` searchable रहता है ताकि Codex का
native `spawn_agent` प्राथमिक Codex subagent surface बना रहे, जबकि explicit OpenClaw
या ACP delegation अब भी `openclaw` dynamic tool namespace के माध्यम से उपलब्ध है।
Heartbeat collaboration निर्देश Codex से कहते हैं कि जब tool पहले से लोड न हो, तो
Heartbeat turn समाप्त करने से पहले `heartbeat_respond` खोजे।

`codexDynamicToolsLoading: "direct"` केवल तब सेट करें जब किसी custom Codex
app-server से कनेक्ट कर रहे हों जो deferred dynamic tools खोज नहीं सकता, या जब पूरे
tool payload को debug कर रहे हों।

समर्थित top-level Codex plugin fields:

| Field                      | Default        | अर्थ                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dynamic tools को सीधे प्रारंभिक Codex tool context में रखने के लिए `"direct"` का उपयोग करें। |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server turns से हटाए जाने वाले अतिरिक्त OpenClaw dynamic tool नाम।              |
| `codexPlugins`             | अक्षम       | migrated source-installed curated plugins के लिए native Codex plugin/app समर्थन।           |

समर्थित `appServer` fields:

| फ़ील्ड                                         | डिफ़ॉल्ट                                                | अर्थ                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex को स्पॉन करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | प्रबंधित Codex बाइनरी                                   | stdio ट्रांसपोर्ट के लिए निष्पादन योग्य फ़ाइल। प्रबंधित बाइनरी का उपयोग करने के लिए इसे सेट न करें; इसे केवल स्पष्ट ओवरराइड के लिए सेट करें।                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio ट्रांसपोर्ट के लिए आर्ग्युमेंट।                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | सेट नहीं                                                  | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | सेट नहीं                                                  | WebSocket ट्रांसपोर्ट के लिए Bearer टोकन। शाब्दिक स्ट्रिंग या SecretInput स्वीकार करता है, जैसे `${CODEX_APP_SERVER_TOKEN}`।                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket हेडर। हेडर मान शाब्दिक स्ट्रिंग या SecretInput मान स्वीकार करते हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना विरासत में मिला परिवेश बनाने के बाद, स्पॉन की गई stdio app-server प्रक्रिया से हटाए गए अतिरिक्त परिवेश वैरिएबल नाम। OpenClaw स्थानीय लॉन्च के लिए प्रति-एजेंट `CODEX_HOME` और विरासत में मिला `HOME` रखता है।                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | Codex के केवल-कोड-मोड टूल सरफ़ेस में ऑप्ट इन करें। OpenClaw डायनामिक टूल Codex के साथ पंजीकृत रहते हैं ताकि नेस्टेड `tools.*` कॉल app-server `item/tool/call` ब्रिज के माध्यम से लौटें।                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | सेट नहीं                                                  | रिमोट Codex app-server वर्कस्पेस रूट। सेट होने पर, OpenClaw हल किए गए OpenClaw वर्कस्पेस से स्थानीय वर्कस्पेस रूट का अनुमान लगाता है, इस रिमोट रूट के अंतर्गत वर्तमान cwd सफ़िक्स को सुरक्षित रखता है, और केवल अंतिम app-server cwd Codex को भेजता है। यदि cwd हल किए गए OpenClaw वर्कस्पेस रूट के बाहर है, तो OpenClaw रिमोट app-server को Gateway-स्थानीय पाथ भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server कंट्रोल-प्लेन कॉल के लिए टाइमआउट।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा टर्न स्वीकार करने के बाद या टर्न-स्कोप वाले app-server अनुरोध के बाद शांत अवधि, जब OpenClaw `turn/completed` की प्रतीक्षा करता है।                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | टूल हैंडऑफ़, नेटिव टूल पूर्णता, पोस्ट-टूल रॉ असिस्टेंट प्रगति, रॉ रीजनिंग पूर्णता, या रीजनिंग प्रगति के बाद उपयोग किया गया पूर्णता-निष्क्रिय और प्रगति गार्ड, जब OpenClaw `turn/completed` की प्रतीक्षा करता है। इसे विश्वसनीय या भारी वर्कलोड के लिए उपयोग करें, जहां पोस्ट-टूल सिंथेसिस अंतिम असिस्टेंट रिलीज़ बजट से अधिक समय तक वैध रूप से शांत रह सकता है।                                |
| `mode`                                        | `"yolo"` जब तक स्थानीय Codex आवश्यकताएं YOLO की अनुमति न दें | YOLO या गार्डियन-समीक्षित निष्पादन के लिए प्रीसेट। स्थानीय stdio आवश्यकताएं जो `danger-full-access`, `never` अनुमोदन, या `user` समीक्षक को छोड़ती हैं, निहित डिफ़ॉल्ट को गार्डियन बनाती हैं।                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` या अनुमत गार्डियन अनुमोदन नीति       | थ्रेड शुरू/फिर शुरू/टर्न को भेजी गई नेटिव Codex अनुमोदन नीति। गार्डियन डिफ़ॉल्ट अनुमति होने पर `"on-request"` को प्राथमिकता देते हैं।                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` या अनुमत गार्डियन सैंडबॉक्स  | थ्रेड शुरू/फिर शुरू करने को भेजा गया नेटिव Codex सैंडबॉक्स मोड। गार्डियन डिफ़ॉल्ट अनुमति होने पर `"workspace-write"` को प्राथमिकता देते हैं, अन्यथा `"read-only"`। जब OpenClaw सैंडबॉक्स सक्रिय होता है, तो `danger-full-access` टर्न OpenClaw सैंडबॉक्स इग्रेस सेटिंग से प्राप्त नेटवर्क एक्सेस के साथ Codex `workspace-write` का उपयोग करते हैं।                                                                                     |
| `approvalsReviewer`                           | `"user"` या अनुमत गार्डियन समीक्षक               | अनुमति होने पर Codex को नेटिव अनुमोदन प्रॉम्प्ट की समीक्षा करने देने के लिए `"auto_review"` का उपयोग करें, अन्यथा `guardian_subagent` या `user`। `guardian_subagent` एक लेगेसी उपनाम बना रहता है।                                                                                                                                                                                                                              |
| `serviceTier`                                 | सेट नहीं                                                  | वैकल्पिक Codex app-server सेवा स्तर। `"priority"` तेज-मोड रूटिंग सक्षम करता है, `"flex"` flex प्रोसेसिंग का अनुरोध करता है, `null` ओवरराइड साफ़ करता है, और लेगेसी `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                                                 |
| `networkProxy`                                | अक्षम                                               | app-server कमांड के लिए Codex permissions-profile नेटवर्किंग में ऑप्ट इन करें। OpenClaw चयनित `permissions.<profile>.network` कॉन्फ़िग परिभाषित करता है और `sandbox` भेजने के बजाय `default_permissions` के साथ उसे चुनता है।                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | प्रीव्यू ऑप्ट-इन जो Codex app-server 0.132.0 या नए के साथ OpenClaw सैंडबॉक्स-समर्थित Codex परिवेश पंजीकृत करता है, ताकि नेटिव Codex निष्पादन सक्रिय OpenClaw सैंडबॉक्स के अंदर चल सके।                                                                                                                                                                                                         |

`appServer.networkProxy` स्पष्ट है क्योंकि यह Codex सैंडबॉक्स
कॉन्ट्रैक्ट बदलता है। सक्षम होने पर, OpenClaw Codex थ्रेड कॉन्फ़िग में
`features.network_proxy.enabled` और
`default_permissions` भी सेट करता है, ताकि जनरेट की गई अनुमति
प्रोफ़ाइल Codex प्रबंधित नेटवर्किंग शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw
प्रोफ़ाइल बॉडी से टक्कर-प्रतिरोधी `openclaw-network-<fingerprint>` प्रोफ़ाइल नाम
जनरेट करता है; `profileName` का उपयोग केवल तब करें जब स्थिर स्थानीय नाम आवश्यक हो।

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

यदि सामान्य app-server रनटाइम `danger-full-access` होता, तो
`networkProxy` सक्षम करने से जनरेट की गई अनुमति प्रोफ़ाइल के लिए
वर्कस्पेस-शैली फ़ाइलसिस्टम एक्सेस उपयोग होता है। Codex प्रबंधित नेटवर्क
प्रवर्तन सैंडबॉक्स्ड नेटवर्किंग है, इसलिए full-access प्रोफ़ाइल आउटबाउंड
ट्रैफ़िक की सुरक्षा नहीं करेगी।
डोमेन एंट्री `allow` या `deny` का उपयोग करती हैं; Unix सॉकेट एंट्री Codex के
`allow` या `none` मानों का उपयोग करती हैं।

OpenClaw-स्वामित्व वाली गतिशील टूल कॉल
`appServer.requestTimeoutMs` से स्वतंत्र रूप से सीमित होती हैं: Codex `item/tool/call` अनुरोध डिफ़ॉल्ट रूप से 90 सेकंड का
OpenClaw वॉचडॉग उपयोग करते हैं। सकारात्मक प्रति-कॉल `timeoutMs` आर्ग्युमेंट
उस विशिष्ट टूल बजट को बढ़ाता या घटाता है। `image_generate` टूल
`agents.defaults.imageGenerationModel.timeoutMs` का उपयोग करता है जब टूल कॉल
अपना टाइमआउट प्रदान नहीं करती, या अन्यथा 120 सेकंड का इमेज-जेनरेशन डिफ़ॉल्ट उपयोग करती है।
मीडिया-अंडरस्टैंडिंग `image` टूल
`tools.media.image.timeoutSeconds` या अपने 60 सेकंड के मीडिया डिफ़ॉल्ट का उपयोग करता है। इमेज
अंडरस्टैंडिंग के लिए, वह टाइमआउट अनुरोध पर ही लागू होता है और पहले की तैयारी के काम से
घटाया नहीं जाता। गतिशील टूल बजट
600000 ms पर कैप किए जाते हैं। टाइमआउट पर, OpenClaw जहाँ समर्थित हो वहाँ टूल सिग्नल को abort करता है
और Codex को एक विफल गतिशील-टूल प्रतिक्रिया लौटाता है ताकि टर्न
सत्र को `processing` में छोड़े बिना जारी रह सके।
यह वॉचडॉग बाहरी गतिशील `item/tool/call` बजट है; provider-विशिष्ट
अनुरोध टाइमआउट उस कॉल के भीतर चलते हैं और अपनी टाइमआउट semantics बनाए रखते हैं।

Codex द्वारा टर्न स्वीकार करने के बाद, और OpenClaw द्वारा टर्न-स्कोप्ड
app-server अनुरोध का जवाब देने के बाद, harness अपेक्षा करता है कि Codex वर्तमान-टर्न प्रगति करे और
आखिरकार नेटिव टर्न को `turn/completed` के साथ समाप्त करे। यदि app-server
`appServer.turnCompletionIdleTimeoutMs` तक शांत रहता है, तो OpenClaw best-effort
Codex टर्न को interrupt करता है, diagnostic timeout रिकॉर्ड करता है, और
OpenClaw session lane को रिलीज़ करता है ताकि follow-up chat संदेश stale
नेटिव टर्न के पीछे कतारबद्ध न हों। उसी टर्न के लिए अधिकांश non-terminal notifications उस छोटे
watchdog को disarm कर देते हैं क्योंकि Codex ने साबित कर दिया है कि टर्न अभी भी सक्रिय है। टूल handoff एक
लंबा post-tool idle budget उपयोग करते हैं: OpenClaw द्वारा `item/tool/call`
response लौटाने के बाद, `commandExecution` जैसे native tool items पूरे होने के बाद, raw
`custom_tool_call_output` completions के बाद, और post-tool raw assistant
progress, raw reasoning completions, या reasoning progress के बाद। guard
configured होने पर `appServer.postToolRawAssistantCompletionIdleTimeoutMs` उपयोग करता है और
अन्यथा पाँच मिनट पर default करता है। वही post-tool budget Codex द्वारा अगला
current-turn event emit करने से पहले की silent synthesis window के लिए
progress watchdog को भी extend करता है। Global app-server notifications, जैसे rate-limit updates,
turn-idle progress को reset नहीं करते। Reasoning completions, commentary
`agentMessage` completions, और pre-tool raw reasoning या assistant progress के बाद
automatic final reply आ सकती है, इसलिए वे session lane को तुरंत रिलीज़ करने के बजाय post-progress reply
guard उपयोग करते हैं। केवल
final/non-commentary completed `agentMessage` items और pre-tool raw
assistant completions assistant-output release को arm करते हैं: यदि Codex फिर
`turn/completed` के बिना शांत हो जाता है, तो OpenClaw best-effort native turn को interrupt करता है और
session lane रिलीज़ करता है। Replay-safe stdio app-server failures, जिनमें
assistant, tool, active-item, या side-effect evidence के बिना turn-completion idle timeouts शामिल हैं,
fresh app-server attempt पर एक बार retry किए जाते हैं। Unsafe
timeouts फिर भी stuck app-server client को retire करते हैं और OpenClaw
session lane रिलीज़ करते हैं। वे stale native thread binding को भी automatic replay करने के बजाय
clear कर देते हैं। Completion-watch timeouts Codex-विशिष्ट timeout
text दिखाते हैं: replay-safe cases कहते हैं कि response incomplete हो सकती है, जबकि unsafe cases
user को retry करने से पहले current state verify करने के लिए कहते हैं। Public timeout diagnostics
last app-server notification method,
raw assistant response item id/type/role, active request/item counts, और armed
watch state जैसे structural fields शामिल करते हैं। जब last notification raw assistant response item हो, तो वे
bounded assistant text preview भी शामिल करते हैं। वे raw prompt या
tool content शामिल नहीं करते।

स्थानीय testing के लिए environment overrides उपलब्ध रहते हैं:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, जब
`appServer.command` unset हो, managed binary को bypass करता है।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटा दिया गया था। इसके बजाय
`plugins.entries.codex.config.appServer.mode: "guardian"` उपयोग करें, या
one-off local testing के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`।
Repeatable deployments के लिए config बेहतर है क्योंकि यह Plugin behavior को
Codex harness setup के बाकी हिस्से वाली उसी reviewed file में रखता है।

## नेटिव Codex Plugin

नेटिव Codex Plugin support, OpenClaw harness turn वाली उसी Codex thread में Codex app-server की अपनी app और Plugin
capabilities का उपयोग करता है। OpenClaw
Codex Plugin को synthetic `codex_plugin_*` OpenClaw
dynamic tools में translate नहीं करता।

`codexPlugins` केवल उन sessions को प्रभावित करता है जो native Codex harness चुनते हैं। इसका
built-in harness runs, normal OpenAI provider runs, ACP conversation
bindings, या दूसरे harnesses पर कोई प्रभाव नहीं है।

न्यूनतम migrated config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Thread app config तब compute होता है जब OpenClaw Codex harness session स्थापित करता है
या stale Codex thread binding को replace करता है। यह हर turn पर recompute नहीं होता।
`codexPlugins` बदलने के बाद, `/new`, `/reset` उपयोग करें, या gateway restart करें ताकि
भविष्य के Codex harness sessions updated app set के साथ शुरू हों।

Migration eligibility, app inventory, destructive action policy,
elicitations, और native Plugin diagnostics के लिए देखें
[नेटिव Codex Plugin](/hi/plugins/codex-native-plugins).

OpenAI-side app और Plugin access signed-in Codex account द्वारा controlled होता है
और, Business और Enterprise/Edu workspaces के लिए, workspace app controls द्वारा। OpenAI के account और workspace-control overview के लिए देखें
[अपने ChatGPT plan के साथ Codex का उपयोग करना](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Computer Use

Computer Use अपनी अलग setup guide में covered है:
[Codex Computer Use](/hi/plugins/codex-computer-use).

संक्षेप में: OpenClaw desktop-control app को vendor नहीं करता या
desktop actions खुद execute नहीं करता। यह Codex app-server तैयार करता है, verify करता है कि
`computer-use` MCP server उपलब्ध है, और फिर Codex-mode turns के दौरान native MCP
tool calls का ownership Codex को देता है।

## Runtime boundaries

Codex harness केवल low-level embedded agent executor को बदलता है।

- OpenClaw dynamic tools supported हैं। Codex OpenClaw से उन
  tools को execute करने के लिए कहता है, इसलिए OpenClaw execution path में रहता है।
- Codex-native shell, patch, MCP, और native app tools Codex के owned हैं।
  OpenClaw supported relay के through selected native events observe या block कर सकता है,
  लेकिन यह native tool arguments rewrite नहीं करता।
- Codex native compaction own करता है। OpenClaw channel
  history, search, `/new`, `/reset`, और future model या harness switching के लिए transcript mirror रखता है, लेकिन
  यह Codex compaction को OpenClaw या context-engine
  summarizer से replace नहीं करता।
- Media generation, media understanding, TTS, approvals, और messaging-tool
  output matching OpenClaw provider/model settings के through जारी रहते हैं।
- `tool_result_persist` OpenClaw-owned transcript tool results पर लागू होता है, न कि
  Codex-native tool result records पर।

Hook layers, supported V1 surfaces, native permission handling, queue
steering, Codex feedback upload mechanics, और compaction details के लिए देखें
[Codex harness runtime](/hi/plugins/codex-harness-runtime).

## समस्या निवारण

**Codex normal `/model` provider के रूप में दिखाई नहीं देता:** नए configs के लिए यह अपेक्षित है।
`openai/gpt-*` model चुनें, `plugins.entries.codex.enabled` enable करें, और check करें कि क्या `plugins.allow`
`codex` को exclude करता है।

**OpenClaw Codex के बजाय built-in harness उपयोग करता है:** सुनिश्चित करें कि model ref
official OpenAI provider पर `openai/gpt-*` है और Codex Plugin
installed और enabled है। Testing के दौरान strict proof चाहिए तो provider या
model `agentRuntime.id: "codex"` set करें। Forced Codex runtime
OpenClaw पर fallback करने के बजाय fail करता है।

**OpenAI Codex runtime API-key path पर fallback करता है:** model, runtime, selected provider, और failure दिखाने वाला redacted
gateway excerpt collect करें।
Affected collaborators से उनके OpenClaw host पर यह read-only command चलाने को कहें:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Useful excerpts में आमतौर पर `openai/gpt-5.5` या `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` या `harnessRuntime`,
`candidateProvider: "openai"`, और `401`, `Incorrect API key`, या
`No API key` result शामिल होते हैं। Corrected run को plain OpenAI API-key failure के बजाय OpenAI OAuth
path दिखाना चाहिए।

**Legacy Codex model refs config बचा हुआ है:** `openclaw doctor --fix` चलाएँ।
Doctor legacy model refs को `openai/*` में rewrite करता है, stale session और
whole-agent runtime pins हटाता है, और existing auth-profile overrides preserve करता है।

**App-server rejected है:** Codex app-server `0.125.0` या newer उपयोग करें।
Same-version prereleases या build-suffixed versions जैसे
`0.125.0-alpha.2` या `0.125.0+custom` rejected हैं क्योंकि OpenClaw stable
`0.125.0` protocol floor test करता है।

**`/codex status` connect नहीं कर सकता:** check करें कि bundled `codex` Plugin
enabled है, allowlist configured होने पर `plugins.allow` उसे include करता है, और
कोई custom `appServer.command`, `url`, `authToken`, या headers valid हैं।

**Model discovery slow है:** 
`plugins.entries.codex.config.discovery.timeoutMs` कम करें या discovery disable करें। देखें
[Codex harness reference](/hi/plugins/codex-harness-reference#model-discovery).

**WebSocket transport तुरंत fail होता है:** `appServer.url`, `authToken`,
headers, और remote app-server same Codex app-server
protocol version बोलता है यह check करें।

**Native shell या patch tools `Native hook relay unavailable` के साथ blocked हैं:**
Codex thread अब भी native hook relay id उपयोग करने की कोशिश कर रही है जिसे OpenClaw ने
अब registered नहीं रखा है। यह native Codex hook transport problem है, ACP
backend, provider, GitHub, या shell-command failure नहीं। Affected chat में
`/new` या `/reset` के साथ fresh session शुरू करें, फिर harmless command retry करें। यदि वह
एक बार काम करता है लेकिन अगली native tool call फिर fail होती है, तो `/new` को केवल temporary
workaround मानें: Codex app-server या OpenClaw Gateway restart करने के बाद prompt को fresh session में copy करें
ताकि old threads dropped हों और native hook
registrations फिर से recreated हों।

**Non-Codex model built-in harness उपयोग करता है:** यह अपेक्षित है जब तक
provider या model runtime policy उसे किसी दूसरे harness पर route न करे। Plain non-OpenAI
provider refs `auto` mode में अपने normal provider path पर रहते हैं।

**Computer Use इंस्टॉल है लेकिन उपकरण नहीं चलते:** नए सत्र से
`/codex computer-use status` जांचें। यदि कोई उपकरण
`Native hook relay unavailable` रिपोर्ट करता है, तो ऊपर दी गई नेटिव हुक रिले रिकवरी का उपयोग करें। देखें
[Codex Computer Use](/hi/plugins/codex-computer-use#troubleshooting).

## संबंधित

- [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference)
- [Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime)
- [नेटिव Codex Plugin](/hi/plugins/codex-native-plugins)
- [Codex Computer Use](/hi/plugins/codex-computer-use)
- [एजेंट रनटाइम](/hi/concepts/agent-runtimes)
- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [OpenAI प्रदाता](/hi/providers/openai)
- [OpenAI Codex सहायता](https://help.openai.com/en/collections/14937394-codex)
- [एजेंट हार्नेस Plugin](/hi/plugins/sdk-agent-harness)
- [Plugin हुक](/hi/plugins/hooks)
- [डायग्नोस्टिक्स निर्यात](/hi/gateway/diagnostics)
- [स्थिति](/hi/cli/status)
- [परीक्षण](/hi/help/testing-live#live-codex-app-server-harness-smoke)
