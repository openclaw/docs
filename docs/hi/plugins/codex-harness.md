---
read_when:
    - आप bundled Codex app-server harness का उपयोग करना चाहते हैं
    - आपको Codex हार्नेस कॉन्फ़िगरेशन उदाहरणों की आवश्यकता है
    - आप चाहते हैं कि केवल Codex वाले परिनियोजन OpenClaw पर फ़ॉलबैक करने के बजाय विफल हों
summary: बंडल किए गए Codex ऐप-सर्वर हार्नेस के माध्यम से OpenClaw एम्बेडेड एजेंट टर्न चलाएँ
title: Codex हार्नेस
x-i18n:
    generated_at: "2026-06-30T14:06:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

बंडल किया गया `codex` Plugin OpenClaw को अंतर्निहित OpenClaw हार्नेस के बजाय
Codex app-server के माध्यम से एम्बेडेड OpenAI एजेंट टर्न चलाने देता है।

Codex हार्नेस का उपयोग तब करें जब आप चाहते हैं कि निम्न-स्तरीय एजेंट सत्र का स्वामित्व Codex के पास हो:
नेटिव थ्रेड रिज्यूम, नेटिव टूल कंटिन्यूएशन, नेटिव Compaction, और
app-server निष्पादन। OpenClaw अब भी चैट चैनलों, सत्र फ़ाइलों, मॉडल
चयन, OpenClaw डायनामिक टूल्स, अनुमोदनों, मीडिया डिलीवरी, और दिखने वाले
ट्रांसक्रिप्ट मिरर का स्वामी रहता है।

सामान्य सेटअप `openai/gpt-5.5` जैसे कैनॉनिकल OpenAI मॉडल रेफ का उपयोग करता है।
लेगेसी Codex GPT रेफ कॉन्फ़िगर न करें। OpenAI एजेंट auth क्रम
`auth.order.openai` के अंतर्गत रखें; पुराने लेगेसी Codex auth प्रोफ़ाइल आईडी और
लेगेसी Codex auth क्रम प्रविष्टियाँ ऐसी लेगेसी अवस्था हैं जिन्हें
`openclaw doctor --fix` द्वारा सुधारा जाता है।

जब कोई OpenClaw सैंडबॉक्स सक्रिय नहीं होता, OpenClaw Codex app-server थ्रेड्स को
Codex नेटिव कोड मोड सक्षम करके शुरू करता है, जबकि code-mode-only को डिफ़ॉल्ट रूप से बंद रखता है।
इससे Codex नेटिव वर्कस्पेस और कोड क्षमताएँ उपलब्ध रहती हैं, जबकि
OpenClaw डायनामिक टूल्स app-server `item/tool/call` ब्रिज के माध्यम से जारी रहते हैं।
सक्रिय OpenClaw सैंडबॉक्सिंग और प्रतिबंधित टूल नीतियाँ नेटिव कोड मोड को
पूरी तरह अक्षम कर देती हैं, जब तक कि आप प्रायोगिक सैंडबॉक्स exec-server पथ में ऑप्ट इन न करें।

यह Codex-नेटिव सुविधा
[OpenClaw कोड मोड](/hi/reference/code-mode) से अलग है, जो अलग `exec` इनपुट आकार वाले
सामान्य OpenClaw रन के लिए एक ऑप्ट-इन QuickJS-WASI
रनटाइम है।

व्यापक मॉडल/प्रदाता/रनटाइम विभाजन के लिए,
[एजेंट रनटाइम](/hi/concepts/agent-runtimes) से शुरू करें। संक्षिप्त रूप:
`openai/gpt-5.5` मॉडल रेफ है, `codex` रनटाइम है, और Telegram,
Discord, Slack, या कोई अन्य चैनल संचार सतह रहता है।

## आवश्यकताएँ

- OpenClaw, जिसमें बंडल किया गया `codex` Plugin उपलब्ध हो।
- यदि आपका कॉन्फ़िग `plugins.allow` का उपयोग करता है, तो `codex` शामिल करें।
- Codex app-server `0.125.0` या नया। बंडल किया गया Plugin डिफ़ॉल्ट रूप से एक संगत
  Codex app-server बाइनरी प्रबंधित करता है, इसलिए `PATH` पर स्थानीय `codex` कमांड
  सामान्य हार्नेस स्टार्टअप को प्रभावित नहीं करते।
- Codex auth `openclaw models auth login --provider openai` के माध्यम से,
  एजेंट के Codex होम में app-server खाते के रूप में, या स्पष्ट Codex API-key
  auth प्रोफ़ाइल के रूप में उपलब्ध हो।

auth प्राथमिकता, वातावरण अलगाव, कस्टम app-server कमांड, मॉडल
डिस्कवरी, और सभी कॉन्फ़िग फ़ील्ड के लिए,
[Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें।

## त्वरित आरंभ

अधिकांश उपयोगकर्ता जो OpenClaw में Codex चाहते हैं, यह पथ चाहते हैं: किसी
ChatGPT/Codex सदस्यता से साइन इन करें, बंडल किया गया `codex` Plugin सक्षम करें, और
कैनॉनिकल `openai/gpt-*` मॉडल रेफ का उपयोग करें।

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

यदि आपका कॉन्फ़िग `plugins.allow` का उपयोग करता है, तो वहाँ भी `codex` जोड़ें:

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

Plugin कॉन्फ़िग बदलने के बाद Gateway को पुनः आरंभ करें। यदि किसी मौजूदा चैट में पहले से
सत्र है, तो रनटाइम बदलावों का परीक्षण करने से पहले `/new` या `/reset` का उपयोग करें
ताकि अगला टर्न वर्तमान कॉन्फ़िग से हार्नेस हल करे।

## कॉन्फ़िगरेशन

त्वरित आरंभ कॉन्फ़िग न्यूनतम व्यवहार्य Codex हार्नेस कॉन्फ़िग है। Codex
हार्नेस विकल्प OpenClaw कॉन्फ़िग में सेट करें, और CLI का उपयोग केवल Codex auth के लिए करें:

| आवश्यकता                              | सेट करें                                                                          | कहाँ                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| हार्नेस सक्षम करें                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw कॉन्फ़िग                  |
| allowlist वाला Plugin इंस्टॉल रखें     | `plugins.allow` में `codex` शामिल करें                                           | OpenClaw कॉन्फ़िग                  |
| OpenAI एजेंट टर्न Codex से रूट करें    | `agents.defaults.model` या `agents.list[].model` को `openai/gpt-*` के रूप में    | OpenClaw एजेंट कॉन्फ़िग            |
| ChatGPT/Codex OAuth से साइन इन करें    | `openclaw models auth login --provider openai`                                   | CLI auth प्रोफ़ाइल                 |
| Codex रन के लिए API-key बैकअप जोड़ें  | सदस्यता auth के बाद `auth.order.openai` में सूचीबद्ध `openai:*` API-key प्रोफ़ाइल | CLI auth प्रोफ़ाइल + OpenClaw कॉन्फ़िग |
| Codex अनुपलब्ध होने पर बंद-अवस्था में विफल हों | प्रदाता या मॉडल `agentRuntime.id: "codex"`                                      | OpenClaw मॉडल/प्रदाता कॉन्फ़िग     |
| प्रत्यक्ष OpenAI API ट्रैफ़िक उपयोग करें | सामान्य OpenAI auth के साथ प्रदाता या मॉडल `agentRuntime.id: "openclaw"`        | OpenClaw मॉडल/प्रदाता कॉन्फ़िग     |
| app-server व्यवहार ट्यून करें          | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin कॉन्फ़िग              |
| नेटिव Codex Plugin ऐप्स सक्षम करें     | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin कॉन्फ़िग              |
| Codex Computer Use सक्षम करें          | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin कॉन्फ़िग              |

Codex-समर्थित OpenAI एजेंट टर्न के लिए `openai/gpt-*` मॉडल रेफ का उपयोग करें।
सदस्यता-पहले/API-key-बैकअप क्रम के लिए
`auth.order.openai` को प्राथमिकता दें। मौजूदा
लेगेसी Codex auth प्रोफ़ाइल आईडी और लेगेसी Codex auth क्रम केवल doctor-के लिए
लेगेसी अवस्था हैं; नए लेगेसी Codex GPT रेफ न लिखें।

Codex-समर्थित एजेंटों पर `compaction.model` या `compaction.provider` सेट न करें।
Codex अपनी नेटिव app-server थ्रेड अवस्था के माध्यम से compaction करता है, इसलिए OpenClaw
रनटाइम पर उन स्थानीय summarizer overrides को अनदेखा करता है और जब एजेंट Codex का उपयोग करता है
तो `openclaw doctor --fix` उन्हें हटा देता है।

Lossless, Codex टर्न के आसपास असेंबली, इनजेशन, और
मेंटेनेंस के लिए context engine के रूप में समर्थित रहता है। इसे
`plugins.slots.contextEngine: "lossless-claw"` और
`plugins.entries.lossless-claw.config.summaryModel` के माध्यम से कॉन्फ़िगर करें,
`agents.defaults.compaction.provider` के माध्यम से नहीं। जब Codex सक्रिय रनटाइम होता है,
`openclaw doctor --fix` पुराने
`compaction.provider: "lossless-claw"` आकार को Lossless context-engine slot में माइग्रेट करता है,
लेकिन नेटिव Codex अब भी Compaction का स्वामी रहता है।

नेटिव Codex app-server हार्नेस ऐसे context engines का समर्थन करता है जिन्हें
pre-prompt assembly चाहिए। `codex-cli` सहित सामान्य CLI बैकएंड्स
वह होस्ट क्षमता प्रदान नहीं करते।

Codex-समर्थित एजेंटों के लिए, `/compact` बाउंड थ्रेड पर नेटिव Codex app-server Compaction शुरू करता है।
OpenClaw पूर्णता की प्रतीक्षा नहीं करता, OpenClaw
टाइमआउट लागू नहीं करता, साझा app-server को पुनः आरंभ नहीं करता, या context-engine या
सार्वजनिक OpenAI summarizer पर वापस नहीं जाता। यदि नेटिव Codex थ्रेड बाइंडिंग गायब या
पुरानी है, तो कमांड बंद-अवस्था में विफल होता है ताकि ऑपरेटर को वास्तविक रनटाइम सीमा दिखे,
बिना Compaction बैकएंड को चुपचाप बदलने के।

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

उस आकार में, दोनों प्रोफ़ाइल `openai/gpt-*` एजेंट
टर्न के लिए अब भी Codex के माध्यम से चलती हैं। API key केवल auth fallback है,
OpenClaw या साधारण OpenAI Responses पर स्विच करने का अनुरोध नहीं।

इस पृष्ठ का बाकी भाग उन सामान्य विकल्पों को कवर करता है जिनमें उपयोगकर्ताओं को चयन करना होता है:
deployment आकार, fail-closed routing, guardian approval policy, नेटिव Codex
Plugins, और Computer Use। पूर्ण विकल्प सूचियों, डिफ़ॉल्ट्स, enums, discovery,
environment isolation, timeouts, और app-server transport fields के लिए,
[Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें।

## Codex रनटाइम सत्यापित करें

जहाँ आप Codex की अपेक्षा करते हैं, उस चैट में `/status` का उपयोग करें। Codex-समर्थित OpenAI एजेंट
टर्न दिखाता है:

```text
Runtime: OpenAI Codex
```

फिर Codex app-server अवस्था जाँचें:

```text
/codex status
/codex models
```

`/codex status` app-server connectivity, account, rate limits, MCP
servers, और Skills रिपोर्ट करता है। `/codex models` हार्नेस और खाते के लिए
लाइव Codex app-server catalog सूचीबद्ध करता है। यदि `/status` चौंकाता है, तो
[समस्या निवारण](#troubleshooting) देखें।

## रूटिंग और मॉडल चयन

प्रदाता रेफ और रनटाइम नीति को अलग रखें:

- Codex के माध्यम से OpenAI एजेंट टर्न के लिए `openai/gpt-*` का उपयोग करें।
- कॉन्फ़िग में लेगेसी Codex GPT रेफ का उपयोग न करें। लेगेसी रेफ और पुराने session route pins
  सुधारने के लिए `openclaw doctor --fix` चलाएँ।
- सामान्य OpenAI auto mode के लिए `agentRuntime.id: "codex"` वैकल्पिक है, लेकिन
  तब उपयोगी है जब deployment को Codex अनुपलब्ध होने पर बंद-अवस्था में विफल होना चाहिए।
- `agentRuntime.id: "openclaw"` किसी प्रदाता या मॉडल को OpenClaw
  embedded runtime में ऑप्ट करता है, जब यह जानबूझकर किया गया हो।
- `/codex ...` चैट से नेटिव Codex app-server वार्तालापों को नियंत्रित करता है।
- ACP/acpx एक अलग बाहरी हार्नेस पथ है। इसका उपयोग केवल तब करें जब उपयोगकर्ता
  ACP/acpx या बाहरी हार्नेस adapter माँगे।

सामान्य कमांड रूटिंग:

| उपयोगकर्ता आशय                                      | उपयोग करें                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| वर्तमान चैट संलग्न करें                              | `/codex bind [--cwd <path>]`                                                                          |
| मौजूदा Codex थ्रेड रिज्यूम करें                       | `/codex resume <thread-id>`                                                                           |
| Codex थ्रेड सूचीबद्ध या फ़िल्टर करें                  | `/codex threads [filter]`                                                                             |
| नेटिव Codex Plugins सूचीबद्ध करें                     | `/codex plugins list`                                                                                 |
| कॉन्फ़िगर किया गया नेटिव Codex Plugin सक्षम या अक्षम करें | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| paired node पर मौजूदा Codex CLI सत्र संलग्न करें      | `/codex sessions --host <node> [filter]`, फिर `/codex resume <session-id> --host <node> --bind here` |
| केवल Codex प्रतिक्रिया भेजें                          | `/codex diagnostics [note]`                                                                           |
| ACP/acpx कार्य शुरू करें                              | ACP/acpx सत्र कमांड, `/codex` नहीं                                                                    |

| उपयोग मामला                                             | कॉन्फ़िगर करें                                                              | सत्यापित करें                                  | नोट्स                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| मूल Codex रनटाइम के साथ ChatGPT/Codex सदस्यता | `openai/gpt-*` और सक्षम `codex` plugin                             | `/status` में `Runtime: OpenAI Codex` दिखता है | अनुशंसित पथ                      |
| Codex अनुपलब्ध होने पर fail closed                  | Provider या model `agentRuntime.id: "codex"`                           | Turn embedded fallback के बजाय विफल होता है | केवल-Codex deployments के लिए उपयोग करें        |
| OpenClaw के माध्यम से सीधा OpenAI API-key ट्रैफ़िक       | Provider या model `agentRuntime.id: "openclaw"` और सामान्य OpenAI auth | `/status` में OpenClaw रनटाइम दिखता है        | केवल तब उपयोग करें जब OpenClaw जानबूझकर चुना गया हो |
| Legacy config                                        | legacy Codex GPT refs                                                  | `openclaw doctor --fix` इसे फिर से लिखता है     | इस तरीके से नया config न लिखें      |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP task/session स्थिति                 | मूल Codex harness से अलग    |

`agents.defaults.imageModel` वही prefix विभाजन अपनाता है। सामान्य OpenAI route के लिए `openai/gpt-*`
का उपयोग करें और `codex/gpt-*` का उपयोग केवल तब करें जब image understanding
एक bounded Codex app-server turn के माध्यम से चलनी चाहिए। legacy Codex GPT refs का उपयोग न करें;
doctor उस legacy prefix को `openai/gpt-*` में फिर से लिखता है।

## Deployment patterns

### मूल Codex deployment

जब सभी OpenAI agent turns को डिफ़ॉल्ट रूप से Codex का उपयोग करना चाहिए, तब quickstart config
का उपयोग करें।

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

यह आकार Claude को डिफ़ॉल्ट agent के रूप में रखता है और एक नामित Codex agent जोड़ता है:

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

OpenAI agent turns के लिए, bundled plugin उपलब्ध होने पर `openai/gpt-*` पहले से ही Codex पर resolve होता है।
जब आप लिखित fail-closed नियम चाहते हों, तब explicit runtime policy जोड़ें:

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

Codex forced होने पर, यदि Codex plugin disabled है, app-server बहुत पुराना है,
या app-server शुरू नहीं हो सकता, तो OpenClaw जल्दी विफल हो जाता है।

## App-server policy

डिफ़ॉल्ट रूप से, plugin OpenClaw के managed Codex binary को stdio
transport के साथ locally शुरू करता है। `appServer.command` केवल तब सेट करें जब आप जानबूझकर कोई
अलग executable चलाना चाहते हों। WebSocket transport का उपयोग केवल तब करें जब कोई app-server पहले से
कहीं और चल रहा हो:

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

Local stdio app-server sessions डिफ़ॉल्ट रूप से trusted local operator posture अपनाते हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यदि local Codex requirements उस
implicit YOLO posture की अनुमति नहीं देतीं, तो OpenClaw इसके बजाय allowed guardian permissions चुनता है।
जब session के लिए OpenClaw sandbox सक्रिय होता है, तो OpenClaw उस
turn के लिए Codex native Code Mode, user MCP servers, और app-backed plugin execution को निष्क्रिय कर देता है,
Codex host-side sandboxing पर निर्भर रहने के बजाय। सामान्य exec/process tools उपलब्ध होने पर shell access
OpenClaw sandbox-backed dynamic tools जैसे `sandbox_exec` और
`sandbox_process` के माध्यम से expose किया जाता है।

जब आप sandbox escapes या अतिरिक्त permissions से पहले Codex native auto-review चाहते हों,
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
Guardian-reviewed approvals पर map करता है, आमतौर पर
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, और
`sandbox: "workspace-write"` जब local requirements उन values की अनुमति देती हैं।
`tools.exec.mode: "auto"` में, OpenClaw legacy unsafe Codex
`approvalPolicy: "never"` या `sandbox: "danger-full-access"` overrides को preserve नहीं करता; intentional no-approval Codex posture के लिए
`tools.exec.mode: "full"` का उपयोग करें। legacy `plugins.entries.codex.config.appServer.mode: "guardian"` preset अब भी
काम करता है, लेकिन `tools.exec.mode: "auto"` normalized OpenClaw surface है।

host exec approvals और ACPX permissions के साथ mode-level comparison के लिए,
[Permission modes](/hi/tools/permission-modes) देखें।

हर app-server field, auth order, environment isolation, discovery, और
timeout behavior के लिए, [Codex harness reference](/hi/plugins/codex-harness-reference) देखें।

## Commands और diagnostics

bundled plugin `/codex` को किसी भी channel पर slash command के रूप में register करता है जो
OpenClaw text commands का समर्थन करता है।

Native execution और control के लिए owner या `operator.admin` Gateway
client आवश्यक है। इसमें threads को bind या resume करना, turns भेजना या रोकना,
model, fast-mode, या permission state बदलना, compacting या reviewing, और
binding detach करना शामिल है। अन्य authorized senders read-only status, help,
account, model, thread, MCP server, skill, और binding inspection commands रखते हैं।

सामान्य रूप:

- `/codex status` app-server connectivity, models, account, rate limits,
  MCP servers, और skills की जांच करता है।
- `/codex models` live Codex app-server models सूचीबद्ध करता है।
- `/codex threads [filter]` हाल के Codex app-server threads सूचीबद्ध करता है।
- `/codex resume <thread-id>` मौजूदा Codex thread से वर्तमान OpenClaw session को attach करता है।
- `/codex compact` Codex app-server से attached thread को compact करने के लिए कहता है।
- `/codex review` attached thread के लिए Codex native review शुरू करता है।
- `/codex diagnostics [note]` attached thread के लिए Codex feedback भेजने से पहले पूछता है।
- `/codex account` account और rate-limit status दिखाता है।
- `/codex mcp` Codex app-server MCP server status सूचीबद्ध करता है।
- `/codex skills` Codex app-server skills सूचीबद्ध करता है।

अधिकांश support reports के लिए, उस conversation में `/diagnostics [note]` से शुरू करें
जहां bug हुआ था। यह एक Gateway diagnostics report बनाता है और, Codex
harness sessions के लिए, relevant Codex feedback bundle भेजने की approval मांगता है।
privacy model और group chat behavior के लिए [Diagnostics export](/hi/gateway/diagnostics) देखें।

`/codex diagnostics [note]` का उपयोग केवल तब करें जब आप specifically वर्तमान में attached thread के लिए Codex
feedback upload चाहते हों, full Gateway
diagnostics bundle के बिना।

### Codex threads को locally inspect करें

खराब Codex run को inspect करने का सबसे तेज़ तरीका अक्सर native Codex
thread को सीधे खोलना होता है:

```bash
codex resume <thread-id>
```

thread id completed `/diagnostics` reply, `/codex binding`, या
`/codex threads [filter]` से प्राप्त करें।

upload mechanics और runtime-level diagnostics boundaries के लिए,
[Codex harness runtime](/hi/plugins/codex-harness-runtime#codex-feedback-upload) देखें।

Auth इस क्रम में चुना जाता है:

1. agent के लिए ordered OpenAI auth profiles, बेहतर है
   `auth.order.openai` के अंतर्गत। पुराने
   legacy Codex auth profile ids और legacy Codex auth order migrate करने के लिए `openclaw doctor --fix` चलाएँ।
2. उस agent के Codex home में app-server का मौजूदा account।
3. केवल local stdio app-server launches के लिए, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`, जब कोई app-server account मौजूद नहीं है और OpenAI auth
   अब भी आवश्यक है।

जब OpenClaw को ChatGPT subscription-style Codex auth profile दिखाई देता है, तो यह spawned Codex child process से
`CODEX_API_KEY` और `OPENAI_API_KEY` हटा देता है। इससे embeddings या direct OpenAI models
के लिए Gateway-level API keys उपलब्ध रहती हैं
बिना native Codex app-server turns को गलती से API के माध्यम से bill किए।
Explicit Codex API-key profiles और local stdio env-key fallback inherited child-process env के बजाय app-server
login का उपयोग करते हैं। WebSocket app-server connections
Gateway env API-key fallback प्राप्त नहीं करते; explicit auth profile या
remote app-server का अपना account उपयोग करें।
जब native Codex plugins configured होते हैं, OpenClaw connected app-server के माध्यम से उन
plugins को install या refresh करता है, फिर plugin-owned apps को
Codex thread में expose करता है। `app/list` app ids,
accessibility, और metadata के लिए source of truth बना रहता है, लेकिन OpenClaw per-thread enablement
decision का मालिक है: यदि policy किसी listed accessible app की अनुमति देती है, तो OpenClaw
`thread/start.config.apps[appId].enabled = true` भेजता है, भले ही `app/list` वर्तमान में
उस app को disabled बताए। यह path unknown ids के लिए app installation invent नहीं करता;
OpenClaw केवल marketplace plugins को `plugin/install` के साथ activate करता है
और फिर inventory refresh करता है।

यदि subscription profile Codex usage limit तक पहुँचता है, तो Codex द्वारा reset
time report करने पर OpenClaw उसे record करता है और उसी
Codex run के लिए अगले ordered auth profile को try करता है। reset time बीतने पर subscription profile फिर eligible
हो जाता है, selected `openai/gpt-*` model या Codex runtime बदले बिना।

Local stdio app-server launches के लिए, OpenClaw `CODEX_HOME` को per-agent
directory पर सेट करता है ताकि Codex config, auth/account files, plugin cache/data, और native
thread state डिफ़ॉल्ट रूप से operator के personal `~/.codex` को read या write न करें।
OpenClaw सामान्य process `HOME` preserve करता है; Codex-run subprocesses
अब भी user-home config और tokens ढूंढ सकते हैं, और Codex shared
`$HOME/.agents/skills` और `$HOME/.agents/plugins/marketplace.json` entries discover कर सकता है।

यदि deployment को अतिरिक्त environment isolation चाहिए, तो उन variables को
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

`appServer.clearEnv` केवल spawned Codex app-server child process को प्रभावित करता है।
OpenClaw local launch normalization के दौरान इस list से `CODEX_HOME` और `HOME` हटाता है:
`CODEX_HOME` per-agent रहता है, और `HOME` inherited रहता है ताकि
subprocesses सामान्य user-home state का उपयोग कर सकें।

Codex डायनेमिक टूल डिफ़ॉल्ट रूप से `searchable` लोडिंग पर सेट होते हैं। OpenClaw ऐसे
डायनेमिक टूल उजागर नहीं करता जो Codex-native workspace ऑपरेशन की नकल करते हों: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, और `update_plan`। बाकी अधिकांश
OpenClaw इंटीग्रेशन टूल, जैसे messaging, media, cron, browser, nodes,
gateway, और `heartbeat_respond`, `openclaw` namespace के अंतर्गत Codex टूल खोज के ज़रिए
उपलब्ध होते हैं, जिससे शुरुआती मॉडल संदर्भ छोटा रहता है। खोज सक्षम होने और कोई
managed provider चयनित न होने पर वेब खोज डिफ़ॉल्ट रूप से Codex के hosted `web_search` टूल का उपयोग
करती है। Native hosted search और OpenClaw का managed
`web_search` डायनेमिक टूल परस्पर अनन्य हैं, ताकि managed search native domain restrictions को बायपास न कर सके। OpenClaw managed टूल का उपयोग तब करता है जब hosted search
उपलब्ध न हो, स्पष्ट रूप से अक्षम हो, या किसी चयनित managed provider से बदला गया हो।
OpenClaw Codex के standalone `web.run` extension को अक्षम रखता है क्योंकि
production app-server traffic उसके user-defined `web` namespace को अस्वीकार करता है।
`tools.web.search.enabled: false` दोनों paths को अक्षम करता है, जैसे tool-disabled
LLM-only runs भी करते हैं। Codex `"cached"` को preference मानता है और unrestricted app-server turns के लिए इसे live
external access में resolve करता है। Native `allowedDomains` सेट होने पर automatic managed fallback
fail closed करता है ताकि allowlist को बायपास न किया जा सके। Persistent effective search-policy changes अगले turn से पहले bound Codex
thread को rotate करते हैं। Transient per-turn restrictions temporary
restricted thread का उपयोग करते हैं और बाद में resume के लिए मौजूदा binding को बनाए रखते हैं।
`sessions_yield` और message-tool-only source replies direct रहते हैं क्योंकि
वे turn-control contracts हैं। `sessions_spawn` searchable रहता है ताकि Codex का
native `spawn_agent` प्राथमिक Codex subagent surface बना रहे, जबकि explicit
OpenClaw या ACP delegation अब भी `openclaw` dynamic
tool namespace के ज़रिए उपलब्ध है। Heartbeat collaboration instructions Codex को बताते हैं कि यदि tool पहले से
loaded नहीं है, तो heartbeat turn समाप्त करने से पहले `heartbeat_respond` खोजे।

`codexDynamicToolsLoading: "direct"` केवल तब सेट करें जब ऐसे custom Codex
app-server से कनेक्ट कर रहे हों जो deferred dynamic tools खोज नहीं सकता, या जब full
tool payload debug कर रहे हों।

समर्थित top-level Codex plugin fields:

| Field                      | Default        | अर्थ                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw dynamic tools को सीधे शुरुआती Codex tool context में रखने के लिए `"direct"` का उपयोग करें। |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server turns से हटाने के लिए अतिरिक्त OpenClaw dynamic tool names।              |
| `codexPlugins`             | disabled       | migrated source-installed curated plugins के लिए native Codex plugin/app support।           |

समर्थित `appServer` fields:

| फ़ील्ड                                         | डिफ़ॉल्ट                                                | अर्थ                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex को spawn करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | प्रबंधित Codex binary                                   | stdio transport के लिए executable। प्रबंधित binary का उपयोग करने के लिए unset छोड़ें; इसे केवल स्पष्ट override के लिए सेट करें।                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio transport के लिए arguments।                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | unset                                                  | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | unset                                                  | WebSocket transport के लिए Bearer token। कोई literal string या SecretInput स्वीकार करता है, जैसे `${CODEX_APP_SERVER_TOKEN}`।                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket headers। Header values literal strings या SecretInput values स्वीकार करते हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना inherited environment बनाने के बाद spawned stdio app-server process से हटाए गए अतिरिक्त environment variable names। OpenClaw स्थानीय launches के लिए प्रति-agent `CODEX_HOME` और inherited `HOME` रखता है।                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | Codex के code-mode-only tool surface में opt in करें। OpenClaw dynamic tools Codex के साथ registered रहते हैं ताकि nested `tools.*` calls app-server `item/tool/call` bridge के ज़रिए लौटें।                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | unset                                                  | Remote Codex app-server workspace root। सेट होने पर, OpenClaw resolved OpenClaw workspace से local workspace root का अनुमान लगाता है, इस remote root के तहत वर्तमान cwd suffix को सुरक्षित रखता है, और केवल final app-server cwd को Codex को भेजता है। यदि cwd resolved OpenClaw workspace root के बाहर है, तो OpenClaw remote app-server को gateway-local path भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server control-plane calls के लिए timeout।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा turn स्वीकार करने के बाद या turn-scoped app-server request के बाद quiet window, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है।                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Tool handoff, native tool completion, post-tool raw assistant progress, raw reasoning completion, या reasoning progress के बाद उपयोग किया जाने वाला completion-idle और progress guard, जबकि OpenClaw `turn/completed` की प्रतीक्षा करता है। इसे trusted या heavy workloads के लिए उपयोग करें जहां post-tool synthesis final assistant release budget से अधिक समय तक वैध रूप से शांत रह सकता है।                                |
| `mode`                                        | `"yolo"` जब तक local Codex requirements YOLO को अस्वीकार न करें | YOLO या guardian-reviewed execution के लिए preset। Local stdio requirements जो `danger-full-access`, `never` approval, या `user` reviewer को omit करती हैं, implicit default को guardian बनाती हैं।                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` या allowed guardian approval policy       | Thread start/resume/turn को भेजी गई native Codex approval policy। Guardian defaults अनुमति होने पर `"on-request"` को प्राथमिकता देते हैं।                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` या allowed guardian sandbox  | Thread start/resume को भेजा गया native Codex sandbox mode। Guardian defaults अनुमति होने पर `"workspace-write"` को प्राथमिकता देते हैं, अन्यथा `"read-only"`। जब OpenClaw sandbox सक्रिय होता है, तो `danger-full-access` turns OpenClaw sandbox egress setting से derived network access के साथ Codex `workspace-write` का उपयोग करते हैं।                                                                                     |
| `approvalsReviewer`                           | `"user"` या allowed guardian reviewer               | अनुमति होने पर Codex को native approval prompts review करने देने के लिए `"auto_review"` का उपयोग करें, अन्यथा `guardian_subagent` या `user`। `guardian_subagent` legacy alias बना रहता है।                                                                                                                                                                                                                              |
| `serviceTier`                                 | unset                                                  | वैकल्पिक Codex app-server service tier। `"priority"` fast-mode routing सक्षम करता है, `"flex"` flex processing का अनुरोध करता है, `null` override साफ़ करता है, और legacy `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                                                 |
| `networkProxy`                                | अक्षम                                               | app-server commands के लिए Codex permissions-profile networking में opt in करें। OpenClaw selected `permissions.<profile>.network` config परिभाषित करता है और `sandbox` भेजने के बजाय `default_permissions` से उसे चुनता है।                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Preview opt-in जो Codex app-server 0.132.0 या नए के साथ OpenClaw sandbox-backed Codex environment register करता है ताकि native Codex execution सक्रिय OpenClaw sandbox के अंदर चल सके।                                                                                                                                                                                                         |

`appServer.networkProxy` explicit है क्योंकि यह Codex sandbox
contract बदलता है। सक्षम होने पर, OpenClaw Codex thread config में
`features.network_proxy.enabled` और
`default_permissions` भी सेट करता है ताकि generated permission
profile Codex managed networking शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw
profile body से collision-resistant `openclaw-network-<fingerprint>` profile name
generate करता है; `profileName` का उपयोग केवल तब करें जब stable local name आवश्यक हो।

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

यदि normal app-server runtime `danger-full-access` होगा, तो
`networkProxy` सक्षम करने पर generated
permission profile के लिए workspace-style filesystem access का उपयोग होता है।
Codex managed network enforcement sandboxed networking है,
इसलिए full-access profile outbound traffic की रक्षा नहीं करेगा।
Domain entries `allow` या `deny` का उपयोग करती हैं; Unix socket entries Codex के
`allow` या `none` values का उपयोग करती हैं।

OpenClaw-स्वामित्व वाली डायनेमिक टूल कॉलें
`appServer.requestTimeoutMs` से स्वतंत्र रूप से सीमित होती हैं: Codex `item/tool/call` अनुरोध डिफ़ॉल्ट रूप से 90 सेकंड के
OpenClaw वॉचडॉग का उपयोग करते हैं। सकारात्मक प्रति-कॉल `timeoutMs` आर्ग्युमेंट
उस विशिष्ट टूल बजट को बढ़ाता या घटाता है। `image_generate` टूल
`agents.defaults.imageGenerationModel.timeoutMs` का उपयोग करता है जब टूल कॉल अपना
टाइमआउट नहीं देता, अन्यथा 120 सेकंड का इमेज-जनरेशन डिफ़ॉल्ट उपयोग करता है।
मीडिया-अंडरस्टैंडिंग `image` टूल
`tools.media.image.timeoutSeconds` या अपने 60 सेकंड के मीडिया डिफ़ॉल्ट का उपयोग करता है। इमेज
अंडरस्टैंडिंग के लिए, वह टाइमआउट अनुरोध पर ही लागू होता है और पहले की तैयारी के काम से
कम नहीं किया जाता। डायनेमिक टूल बजट
600000 ms पर कैप किए जाते हैं। टाइमआउट पर, OpenClaw जहां समर्थित हो वहां टूल सिग्नल को अबॉर्ट करता है
और Codex को विफल डायनेमिक-टूल प्रतिक्रिया लौटाता है ताकि टर्न
सत्र को `processing` में छोड़े बिना जारी रह सके।
यह वॉचडॉग बाहरी डायनेमिक `item/tool/call` बजट है; प्रदाता-विशिष्ट
अनुरोध टाइमआउट उसी कॉल के भीतर चलते हैं और अपनी टाइमआउट सिमैंटिक्स बनाए रखते हैं।

Codex द्वारा कोई टर्न स्वीकार करने के बाद, और OpenClaw द्वारा किसी टर्न-स्कोप्ड
ऐप-सर्वर अनुरोध का उत्तर देने के बाद, हार्नेस अपेक्षा करता है कि Codex मौजूदा-टर्न प्रगति करे और
अंततः नेटिव टर्न को `turn/completed` के साथ पूरा करे। यदि ऐप-सर्वर
`appServer.turnCompletionIdleTimeoutMs` तक शांत रहता है, तो OpenClaw सर्वोत्तम-प्रयास से
Codex टर्न को बाधित करता है, डायग्नोस्टिक टाइमआउट रिकॉर्ड करता है, और
OpenClaw सत्र लेन रिलीज़ करता है ताकि आगे के चैट संदेश पुराने
नेटिव टर्न के पीछे कतारबद्ध न हों। उसी टर्न के लिए अधिकांश नॉन-टर्मिनल नोटिफिकेशन उस छोटे
वॉचडॉग को निष्क्रिय कर देते हैं क्योंकि Codex ने साबित कर दिया है कि टर्न अभी भी जीवित है। टूल हैंडऑफ़
लंबे पोस्ट-टूल आइडल बजट का उपयोग करते हैं: OpenClaw द्वारा `item/tool/call`
प्रतिक्रिया लौटाने के बाद, `commandExecution` जैसे नेटिव टूल आइटम पूरे होने के बाद, रॉ
`custom_tool_call_output` कम्प्लीशन के बाद, और पोस्ट-टूल रॉ असिस्टेंट
प्रगति, रॉ रीजनिंग कम्प्लीशन, या रीजनिंग प्रगति के बाद। गार्ड
कॉन्फ़िगर होने पर `appServer.postToolRawAssistantCompletionIdleTimeoutMs` का उपयोग करता है और
अन्यथा डिफ़ॉल्ट रूप से पांच मिनट लेता है। वही पोस्ट-टूल बजट Codex द्वारा अगला
मौजूदा-टर्न इवेंट उत्सर्जित करने से पहले की मौन सिंथेसिस विंडो के लिए
प्रगति वॉचडॉग को भी बढ़ाता है। वैश्विक ऐप-सर्वर नोटिफिकेशन, जैसे रेट-लिमिट अपडेट,
टर्न-आइडल प्रगति को रीसेट नहीं करते। रीजनिंग कम्प्लीशन, commentary
`agentMessage` कम्प्लीशन, और प्री-टूल रॉ रीजनिंग या असिस्टेंट प्रगति के बाद
स्वचालित अंतिम उत्तर आ सकता है, इसलिए वे सत्र लेन को तुरंत रिलीज़ करने के बजाय
पोस्ट-प्रोग्रेस रिप्लाई गार्ड का उपयोग करते हैं। केवल
अंतिम/नॉन-commentary पूर्ण `agentMessage` आइटम और प्री-टूल रॉ
असिस्टेंट कम्प्लीशन असिस्टेंट-आउटपुट रिलीज़ को आर्म करते हैं: यदि Codex फिर
`turn/completed` के बिना शांत हो जाता है, तो OpenClaw सर्वोत्तम-प्रयास से नेटिव टर्न को बाधित करता है और
सत्र लेन रिलीज़ करता है। रीप्ले-सुरक्षित stdio ऐप-सर्वर विफलताएं, जिनमें
असिस्टेंट, टूल, सक्रिय-आइटम, या साइड-इफ़ेक्ट साक्ष्य के बिना
टर्न-कम्प्लीशन आइडल टाइमआउट शामिल हैं, नए ऐप-सर्वर प्रयास पर एक बार फिर कोशिश की जाती हैं। असुरक्षित
टाइमआउट फिर भी अटके हुए ऐप-सर्वर क्लाइंट को रिटायर करते हैं और OpenClaw
सत्र लेन रिलीज़ करते हैं। वे स्वचालित रूप से रीप्ले होने के बजाय
पुरानी नेटिव थ्रेड बाइंडिंग भी साफ़ करते हैं। कम्प्लीशन-वॉच टाइमआउट Codex-विशिष्ट टाइमआउट
टेक्स्ट दिखाते हैं: रीप्ले-सुरक्षित मामलों में कहा जाता है कि प्रतिक्रिया अधूरी हो सकती है, जबकि असुरक्षित मामले
उपयोगकर्ता से दोबारा कोशिश करने से पहले मौजूदा स्थिति सत्यापित करने को कहते हैं। सार्वजनिक टाइमआउट डायग्नोस्टिक्स
संरचनात्मक फ़ील्ड शामिल करते हैं, जैसे अंतिम ऐप-सर्वर नोटिफिकेशन मेथड,
रॉ असिस्टेंट प्रतिक्रिया आइटम id/type/role, सक्रिय अनुरोध/आइटम गणनाएं, और आर्म्ड
वॉच स्थिति। जब अंतिम नोटिफिकेशन रॉ असिस्टेंट प्रतिक्रिया आइटम होता है, तो वे
सीमित असिस्टेंट टेक्स्ट प्रीव्यू भी शामिल करते हैं। वे रॉ प्रॉम्प्ट या
टूल सामग्री शामिल नहीं करते।

लोकल टेस्टिंग के लिए एनवायरनमेंट ओवरराइड उपलब्ध रहते हैं:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` प्रबंधित बाइनरी को बायपास करता है जब
`appServer.command` अनसेट हो।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटा दिया गया था। इसके बजाय
`plugins.entries.codex.config.appServer.mode: "guardian"` का उपयोग करें, या
एकबारगी लोकल टेस्टिंग के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` का उपयोग करें। दोहराने योग्य डिप्लॉयमेंट के लिए
कॉन्फ़िग प्राथमिक है क्योंकि यह Plugin व्यवहार को Codex हार्नेस सेटअप के बाकी हिस्से की तरह
उसी समीक्षित फ़ाइल में रखता है।

## नेटिव Codex Plugin

नेटिव Codex Plugin समर्थन OpenClaw हार्नेस टर्न वाली ही Codex थ्रेड में Codex ऐप-सर्वर की अपनी ऐप और Plugin
क्षमताओं का उपयोग करता है। OpenClaw
Codex Plugin को सिंथेटिक `codex_plugin_*` OpenClaw
डायनेमिक टूल में अनुवादित नहीं करता।

`codexPlugins` केवल उन सत्रों को प्रभावित करता है जो नेटिव Codex हार्नेस चुनते हैं। इसका
बिल्ट-इन हार्नेस रन, सामान्य OpenAI प्रदाता रन, ACP conversation
bindings, या अन्य हार्नेस पर कोई प्रभाव नहीं है।

न्यूनतम माइग्रेटेड कॉन्फ़िग:

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

थ्रेड ऐप कॉन्फ़िग तब कम्प्यूट किया जाता है जब OpenClaw कोई Codex हार्नेस सत्र स्थापित करता है
या पुरानी Codex थ्रेड बाइंडिंग को बदलता है। इसे हर टर्न पर फिर से कम्प्यूट नहीं किया जाता।
`codexPlugins` बदलने के बाद, `/new`, `/reset` का उपयोग करें, या Gateway रीस्टार्ट करें ताकि
भविष्य के Codex हार्नेस सत्र अपडेटेड ऐप सेट के साथ शुरू हों।

माइग्रेशन पात्रता, ऐप इन्वेंटरी, विनाशकारी कार्रवाई नीति,
एलिसिटेशन, और नेटिव Plugin डायग्नोस्टिक्स के लिए, देखें
[नेटिव Codex Plugin](/hi/plugins/codex-native-plugins).

OpenAI-साइड ऐप और Plugin एक्सेस साइन-इन किए हुए Codex खाते द्वारा नियंत्रित होता है
और, Business और Enterprise/Edu वर्कस्पेस के लिए, वर्कस्पेस ऐप कंट्रोल द्वारा। OpenAI के खाते और वर्कस्पेस-कंट्रोल अवलोकन के लिए
[अपने ChatGPT प्लान के साथ Codex का उपयोग करना](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
देखें।

## कंप्यूटर उपयोग

कंप्यूटर उपयोग अपनी अलग सेटअप गाइड में कवर किया गया है:
[Codex कंप्यूटर उपयोग](/hi/plugins/codex-computer-use).

संक्षेप में: OpenClaw डेस्कटॉप-कंट्रोल ऐप को वेंडर नहीं करता या
डेस्कटॉप कार्रवाइयां स्वयं निष्पादित नहीं करता। यह Codex ऐप-सर्वर तैयार करता है,
सत्यापित करता है कि `computer-use` MCP सर्वर उपलब्ध है, और फिर Codex-mode टर्न के दौरान
नेटिव MCP टूल कॉल का स्वामित्व Codex को देता है।

## रनटाइम सीमाएं

Codex हार्नेस केवल लो-लेवल एम्बेडेड एजेंट एक्ज़ीक्यूटर को बदलता है।

- OpenClaw डायनेमिक टूल समर्थित हैं। Codex OpenClaw से उन
  टूल को निष्पादित करने के लिए कहता है, इसलिए OpenClaw निष्पादन पथ में बना रहता है।
- Codex-नेटिव शेल, पैच, MCP, और नेटिव ऐप टूल Codex के स्वामित्व में हैं।
  OpenClaw समर्थित
  रिले के माध्यम से चुने हुए नेटिव इवेंट देख या ब्लॉक कर सकता है, लेकिन यह नेटिव टूल आर्ग्युमेंट फिर से नहीं लिखता।
- Codex नेटिव Compaction का स्वामी है। OpenClaw चैनल
  इतिहास, खोज, `/new`, `/reset`, और भविष्य के मॉडल या हार्नेस स्विचिंग के लिए ट्रांसक्रिप्ट मिरर रखता है, लेकिन
  यह Codex Compaction को OpenClaw या कॉन्टेक्स्ट-इंजन
  समराइज़र से प्रतिस्थापित नहीं करता।
- मीडिया जनरेशन, मीडिया अंडरस्टैंडिंग, TTS, अनुमोदन, और मैसेजिंग-टूल
  आउटपुट संबंधित OpenClaw प्रदाता/मॉडल सेटिंग्स से जारी रहते हैं।
- `tool_result_persist` OpenClaw-स्वामित्व वाले ट्रांसक्रिप्ट टूल परिणामों पर लागू होता है, न कि
  Codex-नेटिव टूल परिणाम रिकॉर्ड पर।

हुक लेयर, समर्थित V1 सरफेस, नेटिव अनुमति हैंडलिंग, क्यू
स्टीयरिंग, Codex फ़ीडबैक अपलोड मैकेनिक्स, और Compaction विवरण के लिए, देखें
[Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime).

## समस्या निवारण

**Codex सामान्य `/model` प्रदाता के रूप में दिखाई नहीं देता:** नए
कॉन्फ़िग के लिए यह अपेक्षित है। कोई `openai/gpt-*` मॉडल चुनें,
`plugins.entries.codex.enabled` सक्षम करें, और जांचें कि `plugins.allow`
`codex` को बाहर तो नहीं कर रहा।

**OpenClaw Codex के बजाय बिल्ट-इन हार्नेस का उपयोग करता है:** सुनिश्चित करें कि मॉडल ref
आधिकारिक OpenAI प्रदाता पर `openai/gpt-*` है और Codex Plugin
इंस्टॉल और सक्षम है। यदि टेस्टिंग के दौरान आपको कठोर प्रमाण चाहिए, तो प्रदाता या
मॉडल `agentRuntime.id: "codex"` सेट करें। मजबूर Codex रनटाइम
OpenClaw पर वापस गिरने के बजाय विफल होता है।

**OpenAI Codex रनटाइम API-key पथ पर वापस गिरता है:** एक रिडैक्टेड
Gateway अंश इकट्ठा करें जो मॉडल, रनटाइम, चुना गया प्रदाता, और विफलता दिखाता हो।
प्रभावित सहयोगियों से उनके OpenClaw होस्ट पर यह रीड-ओनली कमांड चलाने को कहें:

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

उपयोगी अंशों में आम तौर पर `openai/gpt-5.5` या `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` या `harnessRuntime`,
`candidateProvider: "openai"`, और `401`, `Incorrect API key`, या
`No API key` परिणाम शामिल होते हैं। सुधरे हुए रन में साधारण OpenAI API-key विफलता के बजाय OpenAI OAuth
पथ दिखना चाहिए।

**लेगेसी Codex मॉडल refs कॉन्फ़िग शेष है:** `openclaw doctor --fix` चलाएं।
Doctor लेगेसी मॉडल refs को `openai/*` में फिर से लिखता है, पुराने सत्र और
पूरे-एजेंट रनटाइम पिन हटाता है, और मौजूदा auth-profile ओवरराइड सुरक्षित रखता है।

**ऐप-सर्वर अस्वीकार किया गया है:** Codex ऐप-सर्वर `0.125.0` या नया उपयोग करें।
समान-वर्ज़न प्रीरिलीज़ या बिल्ड-सफ़िक्स्ड वर्ज़न जैसे
`0.125.0-alpha.2` या `0.125.0+custom` अस्वीकार किए जाते हैं क्योंकि OpenClaw
स्थिर `0.125.0` प्रोटोकॉल फ़्लोर की जांच करता है।

**`/codex status` कनेक्ट नहीं कर सकता:** जांचें कि बंडल किया गया `codex` Plugin
सक्षम है, कि allowlist कॉन्फ़िगर होने पर `plugins.allow` में वह शामिल है, और
कि कोई भी कस्टम `appServer.command`, `url`, `authToken`, या हेडर वैध हैं।

**मॉडल डिस्कवरी धीमी है:** 
`plugins.entries.codex.config.discovery.timeoutMs` कम करें या डिस्कवरी अक्षम करें। देखें
[Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference#model-discovery).

**WebSocket ट्रांसपोर्ट तुरंत विफल हो जाता है:** `appServer.url`, `authToken`,
हेडर, और यह जांचें कि रिमोट ऐप-सर्वर वही Codex ऐप-सर्वर
प्रोटोकॉल वर्ज़न बोलता है।

**नेटिव शेल या पैच टूल `Native hook relay unavailable` के साथ ब्लॉक हैं:**
Codex थ्रेड अभी भी ऐसे नेटिव हुक रिले id का उपयोग करने की कोशिश कर रही है जिसे OpenClaw ने अब
रजिस्टर नहीं रखा है। यह नेटिव Codex हुक ट्रांसपोर्ट समस्या है, ACP
बैकएंड, प्रदाता, GitHub, या शेल-कमांड विफलता नहीं। प्रभावित चैट में
`/new` या `/reset` के साथ नया सत्र शुरू करें, फिर कोई हानिरहित कमांड फिर से आज़माएं। यदि वह
एक बार काम करता है लेकिन अगली नेटिव टूल कॉल फिर विफल हो जाती है, तो `/new` को केवल अस्थायी
वर्कअराउंड मानें: Codex ऐप-सर्वर या OpenClaw Gateway को रीस्टार्ट करने के बाद प्रॉम्प्ट को नए सत्र में कॉपी करें ताकि पुरानी थ्रेड हट जाएं और नेटिव हुक
रजिस्ट्रेशन फिर बनाए जाएं।

**नॉन-Codex मॉडल बिल्ट-इन हार्नेस का उपयोग करता है:** यह अपेक्षित है जब तक
प्रदाता या मॉडल रनटाइम नीति उसे किसी दूसरे हार्नेस पर रूट नहीं करती। साधारण नॉन-OpenAI
प्रदाता refs `auto` मोड में अपने सामान्य प्रदाता पथ पर रहते हैं।

**Computer Use इंस्टॉल है लेकिन टूल नहीं चलते:** नए सत्र से
`/codex computer-use status` जांचें। अगर कोई टूल
`Native hook relay unavailable` रिपोर्ट करता है, तो ऊपर दिया गया नेटिव हुक रिले रिकवरी इस्तेमाल करें। देखें
[Codex Computer Use](/hi/plugins/codex-computer-use).

## संबंधित

- [Codex harness संदर्भ](/hi/plugins/codex-harness-reference)
- [Codex harness रनटाइम](/hi/plugins/codex-harness-runtime)
- [नेटिव Codex plugins](/hi/plugins/codex-native-plugins)
- [Codex Computer Use](/hi/plugins/codex-computer-use)
- [Agent रनटाइम](/hi/concepts/agent-runtimes)
- [मॉडल providers](/hi/concepts/model-providers)
- [OpenAI provider](/hi/providers/openai)
- [OpenAI Codex सहायता](https://help.openai.com/en/collections/14937394-codex)
- [Agent harness plugins](/hi/plugins/sdk-agent-harness)
- [Plugin hooks](/hi/plugins/hooks)
- [Diagnostics export](/hi/gateway/diagnostics)
- [Status](/hi/cli/status)
- [Testing](/hi/help/testing-live#live-codex-app-server-harness-smoke)
