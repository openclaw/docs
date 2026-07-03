---
read_when:
    - आप बंडल किए गए Codex app-server हार्नेस का उपयोग करना चाहते हैं
    - आपको Codex हार्नेस कॉन्फ़िगरेशन उदाहरण चाहिए
    - आप चाहते हैं कि केवल Codex परिनियोजन OpenClaw पर वापस जाने के बजाय विफल हों
summary: बंडल किए गए Codex ऐप-सर्वर हार्नेस के माध्यम से OpenClaw एम्बेडेड एजेंट टर्न चलाएँ
title: Codex हार्नेस
x-i18n:
    generated_at: "2026-07-03T13:32:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

बंडल किया गया `codex` Plugin OpenClaw को बिल्ट-इन OpenClaw हार्नेस के बजाय Codex ऐप-सर्वर के जरिए एम्बेडेड OpenAI एजेंट टर्न चलाने देता है.

Codex हार्नेस का उपयोग तब करें जब आप चाहते हों कि Codex निम्न-स्तरीय एजेंट सेशन का मालिक हो: नेटिव थ्रेड रिज्यूम, नेटिव टूल कंटिन्युएशन, नेटिव compaction, और ऐप-सर्वर निष्पादन। OpenClaw अब भी चैट चैनल, सेशन फाइलें, मॉडल चयन, OpenClaw डायनेमिक टूल, स्वीकृतियां, मीडिया डिलीवरी, और दिखने वाला ट्रांसक्रिप्ट मिरर संभालता है.

सामान्य सेटअप `openai/gpt-5.5` जैसे कैननिकल OpenAI मॉडल रेफ का उपयोग करता है। पुराने Codex GPT रेफ कॉन्फिगर न करें। OpenAI एजेंट ऑथ ऑर्डर को `auth.order.openai` के अंतर्गत रखें; पुराने लेगेसी Codex ऑथ प्रोफाइल ids और लेगेसी Codex ऑथ ऑर्डर एंट्रियां लेगेसी स्थिति हैं जिन्हें `openclaw doctor --fix` द्वारा सुधारा जाता है.

जब कोई OpenClaw सैंडबॉक्स सक्रिय नहीं होता, OpenClaw Codex ऐप-सर्वर थ्रेड को Codex नेटिव कोड मोड सक्षम करके शुरू करता है, जबकि कोड-मोड-ओनली को डिफॉल्ट रूप से बंद रखता है। इससे Codex नेटिव वर्कस्पेस और कोड क्षमताएं उपलब्ध रहती हैं, जबकि OpenClaw डायनेमिक टूल ऐप-सर्वर `item/tool/call` ब्रिज के जरिए जारी रहते हैं। सक्रिय OpenClaw सैंडबॉक्सिंग और प्रतिबंधित टूल नीतियां नेटिव कोड मोड को पूरी तरह अक्षम कर देती हैं, जब तक कि आप प्रायोगिक सैंडबॉक्स exec-server पथ में ऑप्ट इन न करें.

यह Codex-नेटिव फीचर [OpenClaw कोड मोड](/hi/reference/code-mode) से अलग है, जो अलग `exec` इनपुट आकार के साथ सामान्य OpenClaw रन के लिए एक ऑप्ट-इन QuickJS-WASI रनटाइम है.

व्यापक मॉडल/प्रोवाइडर/रनटाइम विभाजन के लिए, [एजेंट रनटाइम](/hi/concepts/agent-runtimes) से शुरू करें। संक्षेप में: `openai/gpt-5.5` मॉडल रेफ है, `codex` रनटाइम है, और Telegram, Discord, Slack, या कोई अन्य चैनल संचार सतह बना रहता है.

## आवश्यकताएं

- OpenClaw जिसमें बंडल किया गया `codex` Plugin उपलब्ध हो.
- यदि आपका कॉन्फिग `plugins.allow` का उपयोग करता है, तो `codex` शामिल करें.
- Codex ऐप-सर्वर `0.125.0` या नया। बंडल किया गया Plugin डिफॉल्ट रूप से संगत Codex ऐप-सर्वर बाइनरी प्रबंधित करता है, इसलिए `PATH` पर मौजूद स्थानीय `codex` कमांड सामान्य हार्नेस स्टार्टअप को प्रभावित नहीं करते.
- Codex ऑथ `openclaw models auth login --provider openai` के जरिए उपलब्ध हो, एजेंट के Codex होम में ऐप-सर्वर अकाउंट हो, या स्पष्ट Codex API-key ऑथ प्रोफाइल हो.

ऑथ प्रिसीडेंस, एनवायरनमेंट आइसोलेशन, कस्टम ऐप-सर्वर कमांड, मॉडल डिस्कवरी, और सभी कॉन्फिग फील्ड के लिए, [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें.

## क्विकस्टार्ट

OpenClaw में Codex चाहने वाले अधिकांश उपयोगकर्ता यह पथ चाहते हैं: ChatGPT/Codex सब्सक्रिप्शन से साइन इन करें, बंडल किया गया `codex` Plugin सक्षम करें, और कैननिकल `openai/gpt-*` मॉडल रेफ का उपयोग करें.

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

यदि आपका कॉन्फिग `plugins.allow` का उपयोग करता है, तो वहां भी `codex` जोड़ें:

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

Plugin कॉन्फिग बदलने के बाद Gateway रीस्टार्ट करें। यदि मौजूदा चैट में पहले से कोई सेशन है, तो रनटाइम बदलावों का परीक्षण करने से पहले `/new` या `/reset` का उपयोग करें ताकि अगला टर्न वर्तमान कॉन्फिग से हार्नेस रिजॉल्व करे.

## कॉन्फिगरेशन

क्विकस्टार्ट कॉन्फिग न्यूनतम व्यवहार्य Codex हार्नेस कॉन्फिग है। Codex हार्नेस विकल्प OpenClaw कॉन्फिग में सेट करें, और CLI का उपयोग केवल Codex ऑथ के लिए करें:

| आवश्यकता | सेट करें | कहां |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| हार्नेस सक्षम करें | `plugins.entries.codex.enabled: true` | OpenClaw कॉन्फिग |
| allowlisted Plugin इंस्टॉल बनाए रखें | `plugins.allow` में `codex` शामिल करें | OpenClaw कॉन्फिग |
| OpenAI एजेंट टर्न Codex के जरिए रूट करें | `agents.defaults.model` या `agents.list[].model` को `openai/gpt-*` के रूप में | OpenClaw एजेंट कॉन्फिग |
| ChatGPT/Codex OAuth से साइन इन करें | `openclaw models auth login --provider openai` | CLI ऑथ प्रोफाइल |
| Codex रन के लिए API-key बैकअप जोड़ें | `auth.order.openai` में सब्सक्रिप्शन ऑथ के बाद सूचीबद्ध `openai:*` API-key प्रोफाइल | CLI ऑथ प्रोफाइल + OpenClaw कॉन्फिग |
| Codex अनुपलब्ध होने पर fail closed करें | प्रोवाइडर या मॉडल `agentRuntime.id: "codex"` | OpenClaw मॉडल/प्रोवाइडर कॉन्फिग |
| सीधा OpenAI API ट्रैफिक उपयोग करें | सामान्य OpenAI ऑथ के साथ प्रोवाइडर या मॉडल `agentRuntime.id: "openclaw"` | OpenClaw मॉडल/प्रोवाइडर कॉन्फिग |
| ऐप-सर्वर व्यवहार ट्यून करें | `plugins.entries.codex.config.appServer.*` | Codex Plugin कॉन्फिग |
| नेटिव Codex Plugin ऐप्स सक्षम करें | `plugins.entries.codex.config.codexPlugins.*` | Codex Plugin कॉन्फिग |
| Codex Computer Use सक्षम करें | `plugins.entries.codex.config.computerUse.*` | Codex Plugin कॉन्फिग |

Codex-समर्थित OpenAI एजेंट टर्न के लिए `openai/gpt-*` मॉडल रेफ का उपयोग करें। सब्सक्रिप्शन-फर्स्ट/API-key-बैकअप क्रम के लिए `auth.order.openai` को प्राथमिकता दें। मौजूदा लेगेसी Codex ऑथ प्रोफाइल ids और लेगेसी Codex ऑथ ऑर्डर केवल doctor-लेगेसी स्थिति हैं; नए लेगेसी Codex GPT रेफ न लिखें.

Codex-समर्थित एजेंट पर `compaction.model` या `compaction.provider` सेट न करें। Codex अपने नेटिव ऐप-सर्वर थ्रेड स्टेट के जरिए compact करता है, इसलिए OpenClaw रनटाइम पर उन स्थानीय समराइजर ओवरराइड को अनदेखा करता है और जब एजेंट Codex का उपयोग करता है तो `openclaw doctor --fix` उन्हें हटा देता है.

Lossless Codex टर्न के आसपास असेंबली, इनजेशन, और मेंटेनेंस के लिए कॉन्टेक्स्ट इंजन के रूप में समर्थित रहता है। इसे `agents.defaults.compaction.provider` के जरिए नहीं, बल्कि `plugins.slots.contextEngine: "lossless-claw"` और `plugins.entries.lossless-claw.config.summaryModel` के जरिए कॉन्फिगर करें। जब Codex सक्रिय रनटाइम होता है, `openclaw doctor --fix` पुराने `compaction.provider: "lossless-claw"` आकार को Lossless कॉन्टेक्स्ट-इंजन स्लॉट में माइग्रेट करता है, लेकिन नेटिव Codex अब भी compaction का मालिक रहता है.

नेटिव Codex ऐप-सर्वर हार्नेस उन कॉन्टेक्स्ट इंजनों का समर्थन करता है जिन्हें प्री-प्रॉम्प्ट असेंबली की आवश्यकता होती है। `codex-cli` सहित सामान्य CLI बैकएंड वह होस्ट क्षमता प्रदान नहीं करते.

Codex-समर्थित एजेंट के लिए, `/compact` बाउंड थ्रेड पर नेटिव Codex ऐप-सर्वर compaction शुरू करता है। OpenClaw पूर्णता की प्रतीक्षा नहीं करता, OpenClaw टाइमआउट लागू नहीं करता, साझा ऐप-सर्वर रीस्टार्ट नहीं करता, और कॉन्टेक्स्ट-इंजन या सार्वजनिक OpenAI समराइजर पर fallback नहीं करता। यदि नेटिव Codex थ्रेड बाइंडिंग गायब या पुरानी है, तो कमांड fail closed होता है ताकि ऑपरेटर compaction बैकएंड को चुपचाप बदलते देखने के बजाय वास्तविक रनटाइम सीमा देखे.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

उस आकार में, दोनों प्रोफाइल `openai/gpt-*` एजेंट टर्न के लिए अब भी Codex के जरिए चलते हैं। API key केवल ऑथ fallback है, OpenClaw या साधारण OpenAI Responses पर स्विच करने का अनुरोध नहीं.

इस पेज का बाकी हिस्सा उन सामान्य वेरिएंट को कवर करता है जिनमें उपयोगकर्ताओं को चुनना होता है: डिप्लॉयमेंट आकार, fail-closed रूटिंग, guardian स्वीकृति नीति, नेटिव Codex Plugins, और Computer Use। पूर्ण विकल्प सूचियों, डिफॉल्ट, enums, डिस्कवरी, एनवायरनमेंट आइसोलेशन, टाइमआउट, और ऐप-सर्वर ट्रांसपोर्ट फील्ड के लिए, [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें.

## Codex रनटाइम सत्यापित करें

जिस चैट में आप Codex की अपेक्षा करते हैं, उसमें `/status` का उपयोग करें। Codex-समर्थित OpenAI एजेंट टर्न दिखाता है:

```text
Runtime: OpenAI Codex
```

फिर Codex ऐप-सर्वर स्टेट जांचें:

```text
/codex status
/codex models
```

`/codex status` ऐप-सर्वर कनेक्टिविटी, अकाउंट, रेट लिमिट, MCP सर्वर, और Skills रिपोर्ट करता है। `/codex models` हार्नेस और अकाउंट के लिए लाइव Codex ऐप-सर्वर कैटलॉग सूचीबद्ध करता है। यदि `/status` अप्रत्याशित है, तो [समस्या निवारण](#troubleshooting) देखें.

## रूटिंग और मॉडल चयन

प्रोवाइडर रेफ और रनटाइम नीति को अलग रखें:

- Codex के जरिए OpenAI एजेंट टर्न के लिए `openai/gpt-*` का उपयोग करें.
- कॉन्फिग में लेगेसी Codex GPT रेफ का उपयोग न करें। लेगेसी रेफ और पुराने सेशन रूट पिन सुधारने के लिए `openclaw doctor --fix` चलाएं.
- सामान्य OpenAI ऑटो मोड के लिए `agentRuntime.id: "codex"` वैकल्पिक है, लेकिन तब उपयोगी है जब किसी डिप्लॉयमेंट को Codex अनुपलब्ध होने पर fail closed होना चाहिए.
- `agentRuntime.id: "openclaw"` किसी प्रोवाइडर या मॉडल को OpenClaw एम्बेडेड रनटाइम में ऑप्ट करता है, जब यह जानबूझकर किया गया हो.
- `/codex ...` चैट से नेटिव Codex ऐप-सर्वर बातचीत नियंत्रित करता है.
- ACP/acpx एक अलग बाहरी हार्नेस पथ है। इसका उपयोग केवल तब करें जब उपयोगकर्ता ACP/acpx या बाहरी हार्नेस अडैप्टर मांगे.

सामान्य कमांड रूटिंग:

| उपयोगकर्ता का उद्देश्य | उपयोग करें |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| वर्तमान चैट अटैच करें | `/codex bind [--cwd <path>]` |
| मौजूदा Codex थ्रेड रिज्यूम करें | `/codex resume <thread-id>` |
| Codex थ्रेड सूचीबद्ध या फिल्टर करें | `/codex threads [filter]` |
| नेटिव Codex Plugins सूचीबद्ध करें | `/codex plugins list` |
| कॉन्फिगर किया गया नेटिव Codex Plugin सक्षम या अक्षम करें | `/codex plugins enable <name>`, `/codex plugins disable <name>` |
| पेयर्ड नोड पर मौजूदा Codex CLI सेशन अटैच करें | `/codex sessions --host <node> [filter]`, फिर `/codex resume <session-id> --host <node> --bind here` |
| केवल Codex फीडबैक भेजें | `/codex diagnostics [note]` |
| ACP/acpx टास्क शुरू करें | ACP/acpx सेशन कमांड, `/codex` नहीं |

| उपयोग मामला                                           | कॉन्फ़िगर करें                                                         | सत्यापित करें                          | नोट्स                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| मूल Codex रनटाइम के साथ ChatGPT/Codex सदस्यता | `openai/gpt-*` और सक्षम `codex` Plugin                             | `/status` `Runtime: OpenAI Codex` दिखाता है | अनुशंसित पथ                      |
| यदि Codex उपलब्ध न हो तो fail-closed                  | Provider या मॉडल `agentRuntime.id: "codex"`                           | एम्बेडेड fallback के बजाय turn विफल होता है | केवल-Codex deployments के लिए उपयोग करें        |
| OpenClaw के माध्यम से सीधा OpenAI API-key ट्रैफ़िक       | Provider या मॉडल `agentRuntime.id: "openclaw"` और सामान्य OpenAI auth | `/status` OpenClaw रनटाइम दिखाता है        | केवल तब उपयोग करें जब OpenClaw जानबूझकर चुना गया हो |
| लेगेसी कॉन्फ़िगरेशन                                        | लेगेसी Codex GPT संदर्भ                                                  | `openclaw doctor --fix` इसे फिर से लिखता है     | इस तरह नया कॉन्फ़िगरेशन न लिखें      |
| ACP/acpx Codex adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP task/session status                 | मूल Codex harness से अलग    |

`agents.defaults.imageModel` वही prefix विभाजन अपनाता है। सामान्य OpenAI route
के लिए `openai/gpt-*` का उपयोग करें और `codex/gpt-*` केवल तब जब image understanding
एक सीमित Codex app-server turn के माध्यम से चलना चाहिए। लेगेसी Codex GPT संदर्भों
का उपयोग न करें; doctor उस लेगेसी prefix को `openai/gpt-*` में फिर से लिखता है।

## Deployment patterns

### बुनियादी Codex deployment

जब सभी OpenAI agent turns को default रूप से Codex का उपयोग करना चाहिए, तब quickstart
config का उपयोग करें।

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

यह shape Claude को default agent रखता है और एक named Codex agent जोड़ता है:

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

OpenAI agent turns के लिए, जब bundled Plugin उपलब्ध होता है तो `openai/gpt-*` पहले
से ही Codex पर resolve होता है। जब आपको लिखित fail-closed rule चाहिए, तब स्पष्ट
runtime policy जोड़ें:

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

Codex को forced करने पर, यदि Codex Plugin disabled है, app-server बहुत पुराना है,
या app-server शुरू नहीं हो सकता, तो OpenClaw जल्दी विफल हो जाता है।

## App-server policy

Default रूप से, Plugin OpenClaw के managed Codex binary को stdio transport के साथ
स्थानीय रूप से शुरू करता है। `appServer.command` केवल तब set करें जब आप जानबूझकर
कोई अलग executable चलाना चाहते हों। WebSocket transport केवल तब उपयोग करें जब
app-server कहीं और पहले से चल रहा हो:

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

स्थानीय stdio app-server sessions default रूप से trusted local operator posture अपनाते हैं:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, और
`sandbox: "danger-full-access"`। यदि स्थानीय Codex requirements उस implicit YOLO
posture की अनुमति नहीं देतीं, तो OpenClaw इसके बजाय allowed guardian permissions
चुनता है। जब session के लिए OpenClaw sandbox सक्रिय होता है, तो OpenClaw उस turn
के लिए Codex native Code Mode, user MCP servers, और app-backed Plugin execution को
disable कर देता है, Codex host-side sandboxing पर निर्भर रहने के बजाय। जब सामान्य
exec/process tools उपलब्ध हों, तो Shell access OpenClaw sandbox-backed dynamic tools
जैसे `sandbox_exec` और `sandbox_process` के माध्यम से expose किया जाता है।

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
Guardian-reviewed approvals में map करता है, आमतौर पर
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, और
`sandbox: "workspace-write"` जब स्थानीय requirements उन values की अनुमति देती हैं।
`tools.exec.mode: "auto"` में, OpenClaw लेगेसी unsafe Codex
`approvalPolicy: "never"` या `sandbox: "danger-full-access"` overrides को preserve
नहीं करता; जानबूझकर no-approval Codex posture के लिए `tools.exec.mode: "full"` का
उपयोग करें। लेगेसी `plugins.entries.codex.config.appServer.mode: "guardian"` preset
अब भी काम करता है, लेकिन `tools.exec.mode: "auto"` normalized OpenClaw surface है।

host exec approvals और ACPX permissions के साथ mode-level तुलना के लिए,
[Permission modes](/hi/tools/permission-modes) देखें।

हर app-server field, auth order, environment isolation, discovery, और timeout
behavior के लिए, [Codex harness reference](/hi/plugins/codex-harness-reference) देखें।

## Commands and diagnostics

bundled Plugin `/codex` को किसी भी ऐसे channel पर slash command के रूप में register
करता है जो OpenClaw text commands का समर्थन करता है।

Native execution और control के लिए owner या `operator.admin` Gateway client चाहिए।
इसमें threads bind या resume करना, turns भेजना या रोकना, model, fast-mode, या
permission state बदलना, compacting या reviewing करना, और binding detach करना शामिल है।
अन्य authorized senders read-only status, help, account, model, thread, MCP server,
skill, और binding inspection commands बनाए रखते हैं।

सामान्य forms:

- `/codex status` app-server connectivity, models, account, rate limits,
  MCP servers, और Skills जांचता है।
- `/codex models` live Codex app-server models सूचीबद्ध करता है।
- `/codex threads [filter]` हाल के Codex app-server threads सूचीबद्ध करता है।
- `/codex resume <thread-id>` current OpenClaw session को मौजूदा Codex thread से
  attach करता है।
- `/codex compact` Codex app-server से attached thread को compact करने के लिए कहता है।
- `/codex review` attached thread के लिए Codex native review शुरू करता है।
- `/codex diagnostics [note]` attached thread के लिए Codex feedback भेजने से पहले पूछता है।
- `/codex account` account और rate-limit status दिखाता है।
- `/codex mcp` Codex app-server MCP server status सूचीबद्ध करता है।
- `/codex skills` Codex app-server Skills सूचीबद्ध करता है।

अधिकांश support reports के लिए, उस conversation में `/diagnostics [note]` से शुरू करें
जहां bug हुआ था। यह एक Gateway diagnostics report बनाता है और, Codex harness sessions
के लिए, संबंधित Codex feedback bundle भेजने की approval मांगता है। privacy model और
group chat behavior के लिए [Diagnostics export](/hi/gateway/diagnostics) देखें।

`/codex diagnostics [note]` केवल तब उपयोग करें जब आपको full Gateway diagnostics bundle
के बिना currently attached thread के लिए विशेष रूप से Codex feedback upload चाहिए।

### Codex threads को स्थानीय रूप से inspect करें

खराब Codex run inspect करने का सबसे तेज़ तरीका अक्सर native Codex thread को सीधे
खोलना होता है:

```bash
codex resume <thread-id>
```

thread id completed `/diagnostics` reply, `/codex binding`, या
`/codex threads [filter]` से लें।

upload mechanics और runtime-level diagnostics boundaries के लिए,
[Codex harness runtime](/hi/plugins/codex-harness-runtime#codex-feedback-upload) देखें।

Auth इस क्रम में चुना जाता है:

1. agent के लिए ordered OpenAI auth profiles, प्राथमिक रूप से
   `auth.order.openai` के अंतर्गत। पुराने लेगेसी Codex auth profile ids और
   लेगेसी Codex auth order migrate करने के लिए `openclaw doctor --fix` चलाएं।
2. उस agent के Codex home में app-server का मौजूदा account।
3. केवल स्थानीय stdio app-server launches के लिए, `CODEX_API_KEY`, फिर
   `OPENAI_API_KEY`, जब कोई app-server account मौजूद न हो और OpenAI auth अब भी
   required हो।

जब OpenClaw ChatGPT subscription-style Codex auth profile देखता है, तो यह spawned
Codex child process से `CODEX_API_KEY` और `OPENAI_API_KEY` हटा देता है। इससे embeddings
या direct OpenAI models के लिए Gateway-level API keys उपलब्ध रहती हैं, बिना native
Codex app-server turns को गलती से API के माध्यम से bill कराए। Explicit Codex API-key
profiles और local stdio env-key fallback inherited child-process env के बजाय
app-server login का उपयोग करते हैं। WebSocket app-server connections को Gateway env
API-key fallback नहीं मिलता; explicit auth profile या remote app-server के अपने account
का उपयोग करें।
जब native Codex Plugins configured हों, तो OpenClaw उन Plugins को connected app-server
के माध्यम से install या refresh करता है, फिर Plugin-owned apps को Codex thread के लिए
expose करता है। `app/list` app ids, accessibility, और metadata के लिए source of truth
रहता है, लेकिन per-thread enablement decision OpenClaw own करता है: यदि policy किसी
listed accessible app की अनुमति देती है, तो OpenClaw
`thread/start.config.apps[appId].enabled = true` भेजता है, भले ही `app/list` वर्तमान में
उस app को disabled report करे। यह path unknown ids के लिए app installation invent
नहीं करता; OpenClaw केवल marketplace Plugins को `plugin/install` के साथ activate करता है
और फिर inventory refresh करता है।

यदि subscription profile Codex usage limit से टकराता है, तो जब Codex reset time report
करता है, OpenClaw उसे record करता है और उसी Codex run के लिए अगले ordered auth profile
को try करता है। reset time बीतने पर, subscription profile selected `openai/gpt-*` model
या Codex runtime बदले बिना फिर eligible हो जाता है।

स्थानीय stdio app-server launches के लिए, OpenClaw `CODEX_HOME` को per-agent directory
पर set करता है ताकि Codex config, auth/account files, Plugin cache/data, और native
thread state default रूप से operator के personal `~/.codex` को read या write न करें।
OpenClaw सामान्य process `HOME` preserve करता है; Codex-run subprocesses अब भी
user-home config और tokens ढूंढ सकते हैं, और Codex shared `$HOME/.agents/skills` और
`$HOME/.agents/plugins/marketplace.json` entries discover कर सकता है।

यदि deployment को अतिरिक्त environment isolation चाहिए, तो वे variables
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
`CODEX_HOME` per-agent रहता है, और `HOME` inherited रहता है ताकि subprocesses सामान्य
user-home state का उपयोग कर सकें।

Codex गतिशील टूल डिफ़ॉल्ट रूप से `searchable` लोडिंग का उपयोग करते हैं। OpenClaw ऐसे
गतिशील टूल उजागर नहीं करता जो Codex-नेटिव कार्यस्थान कार्रवाइयों की नकल करते हैं: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, और `update_plan`। शेष अधिकांश
OpenClaw इंटीग्रेशन टूल, जैसे मैसेजिंग, मीडिया, cron, ब्राउज़र, nodes,
gateway, और `heartbeat_respond`, `openclaw` namespace के तहत Codex टूल खोज के माध्यम से
उपलब्ध हैं, जिससे प्रारंभिक मॉडल संदर्भ छोटा रहता है। खोज सक्षम होने और कोई
प्रबंधित प्रदाता चयनित न होने पर वेब खोज डिफ़ॉल्ट रूप से Codex के होस्ट किए गए `web_search` टूल का उपयोग करती है।
नेटिव होस्टेड खोज और OpenClaw का प्रबंधित
`web_search` गतिशील टूल परस्पर अनन्य हैं ताकि प्रबंधित खोज
नेटिव डोमेन प्रतिबंधों को बायपास न कर सके। OpenClaw प्रबंधित टूल का उपयोग तब करता है जब होस्टेड खोज
अनुपलब्ध हो, स्पष्ट रूप से अक्षम हो, या किसी चयनित प्रबंधित प्रदाता से बदली गई हो।
OpenClaw Codex के standalone `web.run` एक्सटेंशन को अक्षम रखता है क्योंकि
प्रोडक्शन ऐप-सर्वर ट्रैफ़िक उसके उपयोगकर्ता-परिभाषित `web` namespace को अस्वीकार करता है।
`tools.web.search.enabled: false` दोनों पथों को अक्षम करता है, जैसा कि टूल-अक्षम
केवल-LLM रन भी करते हैं। Codex `"cached"` को प्राथमिकता के रूप में मानता है और अप्रतिबंधित ऐप-सर्वर turns के लिए
इसे लाइव बाहरी पहुंच में हल करता है। नेटिव `allowedDomains` सेट होने पर स्वचालित प्रबंधित fallback
fail closed होता है ताकि allowlist को
बायपास न किया जा सके। स्थायी प्रभावी खोज-नीति बदलाव अगले turn से पहले bound Codex
thread को rotate करते हैं। अस्थायी प्रति-turn प्रतिबंध एक अस्थायी
restricted thread का उपयोग करते हैं और बाद में resume के लिए मौजूदा binding को सुरक्षित रखते हैं।
`sessions_yield` और message-tool-only source replies direct रहते हैं क्योंकि
वे turn-control contracts हैं। `sessions_spawn` searchable रहता है ताकि Codex का
नेटिव `spawn_agent` प्राथमिक Codex subagent surface बना रहे, जबकि explicit
OpenClaw या ACP delegation अब भी `openclaw` dynamic
tool namespace के माध्यम से उपलब्ध है। Heartbeat सहयोग निर्देश Codex को कहते हैं कि
heartbeat turn समाप्त करने से पहले `heartbeat_respond` खोजे, जब tool पहले से
लोड न हो।

`codexDynamicToolsLoading: "direct"` केवल तब सेट करें जब किसी custom Codex
app-server से कनेक्ट कर रहे हों जो deferred dynamic tools खोज नहीं सकता, या जब पूर्ण
tool payload को debug कर रहे हों।

समर्थित top-level Codex Plugin fields:

| Field                      | Default        | Meaning                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | प्रारंभिक Codex tool context में OpenClaw dynamic tools को सीधे रखने के लिए `"direct"` का उपयोग करें। |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server turns से हटाने के लिए अतिरिक्त OpenClaw dynamic tool names।              |
| `codexPlugins`             | disabled       | migrated source-installed curated plugins के लिए नेटिव Codex plugin/app support।           |

समर्थित `appServer` fields:

| फ़ील्ड                                         | डिफ़ॉल्ट                                                | अर्थ                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` Codex को spawn करता है; `"websocket"` `url` से कनेक्ट करता है।                                                                                                                                                                                                                                                                                                                                        |
| `command`                                     | प्रबंधित Codex बाइनरी                                   | stdio transport के लिए executable। प्रबंधित बाइनरी का उपयोग करने के लिए इसे unset छोड़ें; इसे केवल स्पष्ट override के लिए सेट करें।                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio transport के लिए arguments।                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | unset                                                  | WebSocket app-server URL।                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | unset                                                  | WebSocket transport के लिए Bearer token। कोई literal string या SecretInput स्वीकार करता है, जैसे `${CODEX_APP_SERVER_TOKEN}`।                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | अतिरिक्त WebSocket headers। Header values literal strings या SecretInput values स्वीकार करते हैं, उदाहरण के लिए `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`।                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw द्वारा अपना inherited environment बनाने के बाद spawned stdio app-server process से हटाए गए अतिरिक्त environment variable names। OpenClaw local launches के लिए प्रति-agent `CODEX_HOME` और inherited `HOME` रखता है।                                                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | Codex के code-mode-only tool surface में opt in करें। OpenClaw dynamic tools Codex के साथ registered रहते हैं ताकि nested `tools.*` calls app-server `item/tool/call` bridge के माध्यम से वापस आएँ।                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | unset                                                  | Remote Codex app-server workspace root। सेट होने पर, OpenClaw resolved OpenClaw workspace से local workspace root infer करता है, इस remote root के अंतर्गत वर्तमान cwd suffix को preserve करता है, और केवल अंतिम app-server cwd Codex को भेजता है। यदि cwd resolved OpenClaw workspace root के बाहर है, तो OpenClaw remote app-server को gateway-local path भेजने के बजाय fail closed करता है। |
| `requestTimeoutMs`                            | `60000`                                                | app-server control-plane calls के लिए timeout।                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex द्वारा turn स्वीकार करने के बाद या turn-scoped app-server request के बाद quiet window, जब OpenClaw `turn/completed` की प्रतीक्षा करता है।                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Tool handoff, native tool completion, post-tool raw assistant progress, raw reasoning completion, या reasoning progress के बाद उपयोग किया जाने वाला completion-idle और progress guard, जब OpenClaw `turn/completed` की प्रतीक्षा करता है। इसे trusted या heavy workloads के लिए उपयोग करें जहाँ post-tool synthesis अंतिम assistant release budget से अधिक समय तक वैध रूप से quiet रह सकता है।                                |
| `mode`                                        | `"yolo"` जब तक local Codex requirements YOLO को अस्वीकार न करें | YOLO या guardian-reviewed execution के लिए preset। Local stdio requirements जो `danger-full-access`, `never` approval, या `user` reviewer को omit करती हैं, implicit default को guardian बनाती हैं।                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` या कोई allowed guardian approval policy       | Thread start/resume/turn को भेजी गई native Codex approval policy। Guardian defaults allowed होने पर `"on-request"` को prefer करते हैं।                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` या कोई allowed guardian sandbox  | Thread start/resume को भेजा गया native Codex sandbox mode। Guardian defaults allowed होने पर `"workspace-write"` को prefer करते हैं, अन्यथा `"read-only"`। जब OpenClaw sandbox active होता है, तो `danger-full-access` turns OpenClaw sandbox egress setting से derived network access के साथ Codex `workspace-write` का उपयोग करते हैं।                                                                                     |
| `approvalsReviewer`                           | `"user"` या कोई allowed guardian reviewer               | Allowed होने पर Codex को native approval prompts review करने देने के लिए `"auto_review"` का उपयोग करें, अन्यथा `guardian_subagent` या `user`। `guardian_subagent` legacy alias बना रहता है।                                                                                                                                                                                                                              |
| `serviceTier`                                 | unset                                                  | वैकल्पिक Codex app-server service tier। `"priority"` fast-mode routing सक्षम करता है, `"flex"` flex processing का अनुरोध करता है, `null` override clear करता है, और legacy `"fast"` को `"priority"` के रूप में स्वीकार किया जाता है।                                                                                                                                                                                                 |
| `networkProxy`                                | अक्षम                                               | app-server commands के लिए Codex permissions-profile networking में opt in करें। OpenClaw `sandbox` भेजने के बजाय चयनित `permissions.<profile>.network` config define करता है और उसे `default_permissions` के साथ चुनता है।                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Preview opt-in जो Codex app-server 0.132.0 या नए के साथ OpenClaw sandbox-backed Codex environment register करता है, ताकि native Codex execution active OpenClaw sandbox के अंदर चल सके।                                                                                                                                                                                                         |

`appServer.networkProxy` explicit है क्योंकि यह Codex sandbox
contract को बदलता है। Enabled होने पर, OpenClaw Codex thread config में
`features.network_proxy.enabled` और `default_permissions` भी सेट करता है ताकि generated permission
profile Codex managed networking शुरू कर सके। डिफ़ॉल्ट रूप से, OpenClaw
profile body से collision-resistant `openclaw-network-<fingerprint>` profile name generate करता है;
`profileName` का उपयोग केवल तब करें जब stable local name आवश्यक हो।

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

यदि सामान्य app-server runtime `danger-full-access` होता, तो
`networkProxy` enable करने पर generated permission profile के लिए
workspace-style filesystem access उपयोग होता। Codex managed network enforcement sandboxed networking है,
इसलिए full-access profile outbound traffic की रक्षा नहीं करेगा।
Domain entries `allow` या `deny` का उपयोग करती हैं; Unix socket entries Codex के
`allow` या `none` values का उपयोग करती हैं।

OpenClaw-स्वामित्व वाली डायनेमिक टूल कॉल
`appServer.requestTimeoutMs` से स्वतंत्र रूप से सीमित होती हैं: Codex `item/tool/call` अनुरोध डिफ़ॉल्ट रूप से 90 सेकंड के
OpenClaw watchdog का उपयोग करते हैं। कोई सकारात्मक प्रति-कॉल `timeoutMs` आर्ग्युमेंट
उस विशिष्ट टूल बजट को बढ़ाता या घटाता है। `image_generate` टूल
`agents.defaults.imageGenerationModel.timeoutMs` का उपयोग करता है जब टूल कॉल अपना
timeout नहीं देती, या अन्यथा 120 सेकंड का इमेज-जेनरेशन डिफ़ॉल्ट उपयोग करती है।
मीडिया-अंडरस्टैंडिंग `image` टूल
`tools.media.image.timeoutSeconds` या अपने 60 सेकंड के मीडिया डिफ़ॉल्ट का उपयोग करता है। इमेज
अंडरस्टैंडिंग के लिए, वह timeout स्वयं अनुरोध पर लागू होता है और पहले के
तैयारी कार्य से कम नहीं होता। डायनेमिक टूल बजट
600000 ms पर कैप होते हैं। timeout पर, OpenClaw जहां समर्थित हो वहां टूल सिग्नल को abort करता है
और Codex को failed dynamic-tool response लौटाता है ताकि turn
session को `processing` में छोड़े बिना जारी रह सके।
यह watchdog बाहरी डायनेमिक `item/tool/call` बजट है; provider-specific
request timeouts उस कॉल के अंदर चलते हैं और अपनी timeout semantics बनाए रखते हैं।

Codex द्वारा turn स्वीकार करने के बाद, और OpenClaw द्वारा turn-scoped
app-server request का जवाब देने के बाद, harness अपेक्षा करता है कि Codex current-turn progress करे और
अंततः native turn को `turn/completed` के साथ finish करे। यदि app-server
`appServer.turnCompletionIdleTimeoutMs` तक शांत रहता है, तो OpenClaw best-effort से
Codex turn को interrupt करता है, diagnostic timeout रिकॉर्ड करता है, और
OpenClaw session lane को release करता है ताकि follow-up chat messages किसी stale
native turn के पीछे queued न रहें। उसी turn के लिए अधिकांश non-terminal notifications उस छोटे
watchdog को disarm कर देते हैं क्योंकि Codex ने साबित कर दिया है कि turn अभी भी alive है। Tool handoffs
लंबे post-tool idle budget का उपयोग करते हैं: OpenClaw द्वारा `item/tool/call`
response लौटाने के बाद, `commandExecution` जैसे native tool items complete होने के बाद, raw
`custom_tool_call_output` completions के बाद, और post-tool raw assistant
progress, raw reasoning completions, या reasoning progress के बाद। guard
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` configured होने पर उसका उपयोग करता है और
अन्यथा पांच मिनट पर default करता है। वही post-tool budget उस silent synthesis window के लिए भी
progress watchdog को extend करता है, जब Codex अगला current-turn event emit करने से पहले शांत रहता है।
Global app-server notifications, जैसे rate-limit updates,
turn-idle progress को reset नहीं करते। Reasoning completions, commentary
`agentMessage` completions, और pre-tool raw reasoning या assistant progress के बाद
automatic final reply आ सकता है, इसलिए वे session lane को तुरंत release करने के बजाय
post-progress reply guard का उपयोग करते हैं। केवल final/non-commentary completed
`agentMessage` items और pre-tool raw assistant completions assistant-output release को arm करते हैं:
यदि Codex फिर `turn/completed` के बिना शांत हो जाता है, तो OpenClaw best-effort से native turn को interrupt करता है और
session lane release करता है। यदि कोई दूसरा turn watch उस release race को जीत जाता है,
तो OpenClaw तब भी completed final assistant item स्वीकार करता है जब कोई native
request, item, या dynamic tool completion active नहीं रहता और
assistant-output release अभी भी latest completed item से संबंधित होता है, तथा कोई
बाद की item completion नहीं होती। यह completed tool
work के बाद final answer को turn replay किए बिना preserve कर सकता है। Partial assistant deltas, stale earlier
replies, और empty later completions qualify नहीं करते। Replay-safe stdio
app-server failures,
जिनमें assistant, tool, active-item,
या side-effect evidence के बिना turn-completion idle timeouts शामिल हैं, fresh app-server attempt पर एक बार retry किए जाते हैं। Unsafe
timeouts अभी भी stuck app-server client को retire करते हैं और OpenClaw
session lane release करते हैं। वे automatic replay के बजाय stale native thread binding को भी clear करते हैं।
Completion-watch timeouts Codex-specific timeout
text दिखाते हैं: replay-safe cases कहते हैं कि response incomplete हो सकता है, जबकि unsafe cases
user से retry करने से पहले current state verify करने को कहते हैं। Public timeout diagnostics
structural fields शामिल करते हैं जैसे last app-server notification method,
raw assistant response item id/type/role, active request/item counts, और armed
watch state। जब last notification raw assistant response item होता है, तो वे
bounded assistant text preview भी शामिल करते हैं। वे raw prompt या
tool content शामिल नहीं करते।

Local testing के लिए environment overrides उपलब्ध रहते हैं:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`, जब
`appServer.command` unset हो, managed binary को bypass करता है।

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` हटा दिया गया था। इसके बजाय
`plugins.entries.codex.config.appServer.mode: "guardian"` का उपयोग करें, या
one-off local testing के लिए `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` उपयोग करें। Repeatable deployments के लिए
config preferred है क्योंकि यह Plugin behavior को बाकी Codex harness setup वाली
same reviewed file में रखता है।

## नेटिव Codex Plugin

नेटिव Codex Plugin support, OpenClaw harness turn वाली same Codex thread में
Codex app-server की अपनी app और Plugin capabilities का उपयोग करता है। OpenClaw
Codex Plugin को synthetic `codex_plugin_*` OpenClaw
dynamic tools में translate नहीं करता।

`codexPlugins` केवल उन sessions को प्रभावित करता है जो native Codex harness चुनते हैं। इसका
built-in harness runs, normal OpenAI provider runs, ACP conversation
bindings, या अन्य harnesses पर कोई effect नहीं है।

Minimal migrated config:

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

Thread app config तब computed होता है जब OpenClaw Codex harness session establish करता है
या stale Codex thread binding replace करता है। यह हर turn पर recompute नहीं होता।
`codexPlugins` बदलने के बाद, `/new`, `/reset` का उपयोग करें, या gateway restart करें ताकि
future Codex harness sessions updated app set के साथ start हों।

Migration eligibility, app inventory, destructive action policy,
elicitations, और native Plugin diagnostics के लिए, देखें
[नेटिव Codex Plugin](/hi/plugins/codex-native-plugins).

OpenAI-side app और Plugin access signed-in Codex account द्वारा नियंत्रित होता है
और, Business और Enterprise/Edu workspaces के लिए, workspace app controls द्वारा। देखें
[अपने ChatGPT plan के साथ Codex का उपयोग करना](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
OpenAI के account और workspace-control overview के लिए।

## कंप्यूटर उपयोग

Computer Use अपनी setup guide में covered है:
[Codex Computer Use](/hi/plugins/codex-computer-use).

Short version: OpenClaw desktop-control app को vendor नहीं करता या
desktop actions स्वयं execute नहीं करता। यह Codex app-server prepare करता है, verify करता है कि
`computer-use` MCP server available है, और फिर Codex-mode turns के दौरान native MCP
tool calls का ownership Codex को देता है।

## Runtime boundaries

Codex harness केवल low-level embedded agent executor बदलता है।

- OpenClaw dynamic tools supported हैं। Codex OpenClaw से उन
  tools को execute करने को कहता है, इसलिए OpenClaw execution path में रहता है।
- Codex-native shell, patch, MCP, और native app tools Codex के स्वामित्व में हैं।
  OpenClaw supported relay के माध्यम से selected native events observe या block कर सकता है,
  लेकिन यह native tool arguments rewrite नहीं करता।
- Codex native compaction own करता है। OpenClaw channel
  history, search, `/new`, `/reset`, और future model या harness switching के लिए transcript mirror रखता है, लेकिन
  यह Codex compaction को OpenClaw या context-engine
  summarizer से replace नहीं करता।
- Media generation, media understanding, TTS, approvals, और messaging-tool
  output matching OpenClaw provider/model settings के माध्यम से जारी रहते हैं।
- `tool_result_persist` OpenClaw-owned transcript tool results पर लागू होता है, न कि
  Codex-native tool result records पर।

Hook layers, supported V1 surfaces, native permission handling, queue
steering, Codex feedback upload mechanics, और compaction details के लिए, देखें
[Codex harness runtime](/hi/plugins/codex-harness-runtime).

## समस्या निवारण

**Codex normal `/model` provider के रूप में नहीं दिखता:** नए configs के लिए यह expected है।
`openai/gpt-*` model चुनें, `plugins.entries.codex.enabled` enable करें, और check करें कि
`plugins.allow` `codex` को exclude तो नहीं करता।

**OpenClaw Codex के बजाय built-in harness का उपयोग करता है:** सुनिश्चित करें कि model ref
official OpenAI provider पर `openai/gpt-*` है और Codex Plugin
installed और enabled है। यदि testing के दौरान strict proof चाहिए, तो provider या
model `agentRuntime.id: "codex"` set करें। Forced Codex runtime
OpenClaw पर fallback करने के बजाय fail करता है।

**OpenAI Codex runtime API-key path पर fallback करता है:** ऐसा redacted
gateway excerpt collect करें जो model, runtime, selected provider, और failure दिखाता हो।
Affected collaborators से कहें कि वे अपने OpenClaw host पर यह read-only command run करें:

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

Useful excerpts आमतौर पर `openai/gpt-5.5` या `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` या `harnessRuntime`,
`candidateProvider: "openai"`, और `401`, `Incorrect API key`, या
`No API key` result शामिल करते हैं। Corrected run में plain OpenAI API-key failure के बजाय OpenAI OAuth
path दिखना चाहिए।

**Legacy Codex model refs config remains:** `openclaw doctor --fix` run करें।
Doctor legacy model refs को `openai/*` में rewrite करता है, stale session और
whole-agent runtime pins हटाता है, और existing auth-profile overrides preserve करता है।

**App-server rejected है:** Codex app-server `0.125.0` या newer उपयोग करें।
Same-version prereleases या build-suffixed versions जैसे
`0.125.0-alpha.2` या `0.125.0+custom` rejected हैं क्योंकि OpenClaw
stable `0.125.0` protocol floor test करता है।

**`/codex status` connect नहीं कर सकता:** check करें कि bundled `codex` Plugin
enabled है, allowlist configured होने पर `plugins.allow` उसे include करता है, और
कोई भी custom `appServer.command`, `url`, `authToken`, या headers valid हैं।

**Model discovery slow है:** 
`plugins.entries.codex.config.discovery.timeoutMs` कम करें या discovery disable करें। देखें
[Codex harness reference](/hi/plugins/codex-harness-reference#model-discovery).

**WebSocket transport तुरंत fail होता है:** `appServer.url`, `authToken`,
headers check करें, और यह कि remote app-server same Codex app-server
protocol version बोलता है।

**नेटिव shell या patch टूल `Native hook relay unavailable` के साथ ब्लॉक हैं:**
Codex थ्रेड अब भी ऐसे नेटिव हुक रिले id का उपयोग करने की कोशिश कर रहा है जिसे OpenClaw ने अब पंजीकृत नहीं रखा है। यह नेटिव Codex हुक ट्रांसपोर्ट समस्या है, ACP बैकएंड, प्रदाता, GitHub, या shell-कमांड विफलता नहीं। प्रभावित चैट में `/new` या `/reset` के साथ नया सत्र शुरू करें, फिर कोई सुरक्षित कमांड दोबारा आज़माएँ। यदि वह एक बार काम करता है लेकिन अगली नेटिव टूल कॉल फिर विफल हो जाती है, तो `/new` को केवल अस्थायी उपाय मानें: Codex app-server या OpenClaw Gateway को फिर से शुरू करने के बाद प्रॉम्प्ट को नए सत्र में कॉपी करें, ताकि पुराने थ्रेड हट जाएँ और नेटिव हुक पंजीकरण फिर से बनाए जाएँ।

**गैर-Codex मॉडल बिल्ट-इन हार्नेस का उपयोग करता है:** यह अपेक्षित है, जब तक प्रदाता या मॉडल रनटाइम नीति इसे किसी दूसरे हार्नेस पर रूट न करे। साधारण गैर-OpenAI प्रदाता refs `auto` मोड में अपने सामान्य प्रदाता पथ पर रहते हैं।

**Computer Use इंस्टॉल है लेकिन टूल नहीं चलते:** नए सत्र से `/codex computer-use status` जाँचें। यदि कोई टूल `Native hook relay unavailable` रिपोर्ट करता है, तो ऊपर दी गई नेटिव हुक रिले रिकवरी का उपयोग करें। [Codex Computer Use](/hi/plugins/codex-computer-use#troubleshooting) देखें।

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
