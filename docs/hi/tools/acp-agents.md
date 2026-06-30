---
read_when:
    - ACP के माध्यम से कोडिंग हार्नेस चलाना
    - मैसेजिंग चैनलों पर बातचीत से बंधे ACP सत्र सेट अप करना
    - किसी संदेश-चैनल वार्तालाप को स्थायी ACP सत्र से बाइंड करना
    - ACP बैकएंड, plugin वायरिंग, या completion डिलीवरी का समस्या निवारण
    - चैट से /acp कमांड संचालित करना
sidebarTitle: ACP agents
summary: ACP बैकएंड के माध्यम से बाहरी कोडिंग हार्नेस (Claude Code, Cursor, Gemini CLI, explicit Codex ACP, OpenClaw ACP, OpenCode) चलाएँ
title: ACP एजेंट
x-i18n:
    generated_at: "2026-06-30T14:07:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) सत्र
OpenClaw को किसी ACP बैकएंड Plugin के ज़रिए बाहरी कोडिंग हार्नेस
(उदाहरण के लिए Claude Code, Cursor, Copilot, Droid, OpenClaw ACP,
OpenCode, Gemini CLI, और अन्य समर्थित ACPX हार्नेस) चलाने देते हैं।

हर ACP सत्र स्पॉन को [पृष्ठभूमि कार्य](/hi/automation/tasks) के रूप में ट्रैक किया जाता है।

<Note>
**ACP बाहरी-हार्नेस पथ है, डिफ़ॉल्ट Codex पथ नहीं।** नेटिव
Codex ऐप-सर्वर Plugin `/codex ...` नियंत्रणों और एजेंट टर्न के लिए डिफ़ॉल्ट
`openai/gpt-*` एंबेडेड रनटाइम का स्वामी है; ACP
`/acp ...` नियंत्रणों और `sessions_spawn({ runtime: "acp" })` सत्रों का स्वामी है।

यदि आप चाहते हैं कि Codex या Claude Code किसी बाहरी MCP क्लाइंट के रूप में
मौजूदा OpenClaw चैनल वार्तालापों से सीधे कनेक्ट हो, तो ACP के बजाय
[`openclaw mcp serve`](/hi/cli/mcp) का उपयोग करें।
</Note>

## मुझे कौन-सा पृष्ठ चाहिए?

| आप यह करना चाहते हैं…                                                                          | इसका उपयोग करें                       | नोट्स                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| मौजूदा वार्तालाप में Codex को बाइंड या नियंत्रित करना                                           | `/codex bind`, `/codex threads`       | जब `codex` Plugin सक्षम हो, तो नेटिव Codex ऐप-सर्वर पथ; इसमें बाउंड चैट उत्तर, इमेज फ़ॉरवर्डिंग, मॉडल/फ़ास्ट/अनुमतियाँ, स्टॉप, और स्टीयर नियंत्रण शामिल हैं। ACP एक स्पष्ट फ़ॉलबैक है |
| Claude Code, Gemini CLI, स्पष्ट Codex ACP, या कोई अन्य बाहरी हार्नेस OpenClaw _के ज़रिए_ चलाना | यह पृष्ठ                             | चैट-बाउंड सत्र, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, पृष्ठभूमि कार्य, रनटाइम नियंत्रण                                                                                   |
| किसी OpenClaw Gateway सत्र को किसी एडिटर या क्लाइंट के लिए ACP सर्वर _के रूप में_ उजागर करना     | [`openclaw acp`](/hi/cli/acp)            | ब्रिज मोड। IDE/क्लाइंट stdio/WebSocket पर OpenClaw से ACP के माध्यम से बात करता है                                                                                                                            |
| किसी स्थानीय AI CLI को केवल-पाठ फ़ॉलबैक मॉडल के रूप में फिर से उपयोग करना                       | [CLI बैकएंड](/hi/gateway/cli-backends) | ACP नहीं। कोई OpenClaw टूल नहीं, कोई ACP नियंत्रण नहीं, कोई हार्नेस रनटाइम नहीं                                                                                                                               |

## क्या यह बिना अतिरिक्त सेटअप के काम करता है?

हाँ, आधिकारिक ACP रनटाइम Plugin इंस्टॉल करने के बाद:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

सोर्स चेकआउट `pnpm install` के बाद स्थानीय `extensions/acpx` वर्कस्पेस
Plugin का उपयोग कर सकते हैं। तैयारी जाँच के लिए `/acp doctor` चलाएँ।

OpenClaw एजेंटों को ACP स्पॉनिंग के बारे में केवल तब सिखाता है जब ACP **वास्तव में
उपयोग योग्य** हो: ACP सक्षम होना चाहिए, डिस्पैच अक्षम नहीं होना चाहिए, मौजूदा
सत्र sandbox से अवरुद्ध नहीं होना चाहिए, और रनटाइम बैकएंड लोड होना चाहिए।
यदि ये शर्तें पूरी नहीं हैं, तो ACP Plugin Skills और
`sessions_spawn` ACP मार्गदर्शन छिपा रहता है ताकि एजेंट अनुपलब्ध बैकएंड
का सुझाव न दे।

<AccordionGroup>
  <Accordion title="First-run gotchas">
    - यदि `plugins.allow` सेट है, तो यह एक प्रतिबंधात्मक Plugin इन्वेंटरी है और इसमें **अवश्य** `acpx` शामिल होना चाहिए; अन्यथा इंस्टॉल किया गया ACP बैकएंड जानबूझकर अवरुद्ध किया जाता है और `/acp doctor` अनुपलब्ध allowlist प्रविष्टि की रिपोर्ट करता है।
    - Codex ACP अडैप्टर `acpx` Plugin के साथ स्टेज किया जाता है और संभव होने पर स्थानीय रूप से लॉन्च किया जाता है।
    - Codex ACP एक अलग `CODEX_HOME` के साथ चलता है; OpenClaw होस्ट Codex कॉन्फ़िग से विश्वसनीय प्रोजेक्ट प्रविष्टियाँ और सुरक्षित मॉडल/प्रदाता रूटिंग कॉन्फ़िग कॉपी करता है, जबकि auth, नोटिफ़िकेशन, और hooks होस्ट कॉन्फ़िग पर रहते हैं।
    - अन्य लक्ष्य हार्नेस अडैप्टर पहली बार उपयोग करने पर अभी भी माँग पर `npx` से फ़ेच किए जा सकते हैं।
    - उस हार्नेस के लिए विक्रेता auth अभी भी होस्ट पर मौजूद होना चाहिए।
    - यदि होस्ट के पास npm या नेटवर्क एक्सेस नहीं है, तो पहली बार अडैप्टर फ़ेच तब तक विफल होते हैं जब तक caches पहले से तैयार न हों या अडैप्टर किसी दूसरे तरीके से इंस्टॉल न किया गया हो।

  </Accordion>
  <Accordion title="Runtime prerequisites">
    ACP एक वास्तविक बाहरी हार्नेस प्रक्रिया लॉन्च करता है। OpenClaw रूटिंग,
    पृष्ठभूमि-कार्य स्थिति, डिलीवरी, बाइंडिंग, और नीति का स्वामी है; हार्नेस
    अपने प्रदाता लॉगिन, मॉडल कैटलॉग, फ़ाइलसिस्टम व्यवहार, और नेटिव टूल्स
    का स्वामी है।

    OpenClaw को दोष देने से पहले, सत्यापित करें:

    - `/acp doctor` सक्षम, स्वस्थ बैकएंड की रिपोर्ट करता है।
    - जब allowlist सेट हो, तो लक्ष्य id `acp.allowedAgents` द्वारा अनुमत है।
    - हार्नेस कमांड Gateway होस्ट पर शुरू हो सकता है।
    - उस हार्नेस (`claude`, `codex`, `gemini`, `opencode`, `droid`, आदि) के लिए प्रदाता auth मौजूद है।
    - चयनित मॉडल उस हार्नेस के लिए मौजूद है - मॉडल ids हार्नेसों के बीच पोर्टेबल नहीं होते।
    - अनुरोधित `cwd` मौजूद और सुलभ है, या `cwd` छोड़ दें और बैकएंड को अपना डिफ़ॉल्ट उपयोग करने दें।
    - अनुमति मोड काम से मेल खाता है। नॉन-इंटरैक्टिव सत्र नेटिव अनुमति प्रॉम्प्ट पर क्लिक नहीं कर सकते, इसलिए write/exec-भारी कोडिंग रन को आमतौर पर ऐसे ACPX अनुमति प्रोफ़ाइल की आवश्यकता होती है जो headlessly आगे बढ़ सके।

  </Accordion>
</AccordionGroup>

OpenClaw Plugin टूल और बिल्ट-इन OpenClaw टूल डिफ़ॉल्ट रूप से
ACP हार्नेसों को उजागर **नहीं** किए जाते। [ACP एजेंट - सेटअप](/hi/tools/acp-agents-setup)
में स्पष्ट MCP ब्रिज केवल तब सक्षम करें जब हार्नेस को उन टूल्स को सीधे
कॉल करना चाहिए।

## समर्थित हार्नेस लक्ष्य

`acpx` बैकएंड के साथ, इन हार्नेस ids को `/acp spawn <id>`
या `sessions_spawn({ runtime: "acp", agentId: "<id>" })` लक्ष्य के रूप में उपयोग करें:

| हार्नेस id | सामान्य बैकएंड                                | नोट्स                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP अडैप्टर                        | होस्ट पर Claude Code auth आवश्यक है।                                              |
| `codex`    | Codex ACP अडैप्टर                              | केवल स्पष्ट ACP फ़ॉलबैक, जब नेटिव `/codex` अनुपलब्ध हो या ACP का अनुरोध किया गया हो। |
| `copilot`  | GitHub Copilot ACP अडैप्टर                     | Copilot CLI/रनटाइम auth आवश्यक है।                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | यदि स्थानीय इंस्टॉल अलग ACP entrypoint उजागर करता है, तो acpx कमांड override करें।    |
| `droid`    | Factory Droid CLI                              | हार्नेस वातावरण में Factory/Droid auth या `FACTORY_API_KEY` आवश्यक है।        |
| `gemini`   | Gemini CLI ACP अडैप्टर                         | Gemini CLI auth या API key सेटअप आवश्यक है।                                          |
| `iflow`    | iFlow CLI                                      | अडैप्टर उपलब्धता और मॉडल नियंत्रण इंस्टॉल किए गए CLI पर निर्भर करते हैं।                 |
| `kilocode` | Kilo Code CLI                                  | अडैप्टर उपलब्धता और मॉडल नियंत्रण इंस्टॉल किए गए CLI पर निर्भर करते हैं।                 |
| `kimi`     | Kimi/Moonshot CLI                              | होस्ट पर Kimi/Moonshot auth आवश्यक है।                                            |
| `kiro`     | Kiro CLI                                       | अडैप्टर उपलब्धता और मॉडल नियंत्रण इंस्टॉल किए गए CLI पर निर्भर करते हैं।                 |
| `opencode` | OpenCode ACP अडैप्टर                           | OpenCode CLI/प्रदाता auth आवश्यक है।                                                |
| `openclaw` | `openclaw acp` के ज़रिए OpenClaw Gateway ब्रिज | ACP-सक्षम हार्नेस को OpenClaw Gateway सत्र से वापस बात करने देता है।                 |
| `qwen`     | Qwen Code / Qwen CLI                           | होस्ट पर Qwen-संगत auth आवश्यक है।                                          |

कस्टम acpx एजेंट उपनाम acpx में ही कॉन्फ़िग किए जा सकते हैं, लेकिन OpenClaw
नीति फिर भी डिस्पैच से पहले `acp.allowedAgents` और किसी भी
`agents.list[].runtime.acp.agent` मैपिंग की जाँच करती है।

## ऑपरेटर रनबुक

चैट से त्वरित `/acp` फ़्लो:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, या स्पष्ट
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Work">
    बाउंड वार्तालाप या थ्रेड में जारी रखें (या सत्र
    key को स्पष्ट रूप से लक्षित करें)।
  </Step>
  <Step title="Check state">
    `/acp status`
  </Step>
  <Step title="Tune">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Steer">
    संदर्भ बदले बिना: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stop">
    `/acp cancel` (मौजूदा टर्न) या `/acp close` (सत्र + बाइंडिंग)।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle details">
    - स्पॉन ACP रनटाइम सत्र बनाता या फिर से शुरू करता है, OpenClaw सत्र स्टोर में ACP मेटाडेटा रिकॉर्ड करता है, और जब रन parent-owned हो तो पृष्ठभूमि कार्य बना सकता है।
    - Parent-owned ACP सत्रों को पृष्ठभूमि कार्य माना जाता है, भले ही रनटाइम सत्र persistent हो; पूर्णता और cross-surface डिलीवरी सामान्य user-facing चैट सत्र की तरह कार्य करने के बजाय parent task notifier से गुजरती है।
    - कार्य रखरखाव terminal या orphaned parent-owned one-shot ACP सत्रों को बंद करता है। Persistent ACP सत्र तब तक संरक्षित रहते हैं जब तक सक्रिय वार्तालाप बाइंडिंग बनी रहती है; सक्रिय बाइंडिंग के बिना stale persistent सत्र बंद कर दिए जाते हैं ताकि owning task पूरा होने या उसका task record हट जाने के बाद उन्हें चुपचाप फिर से शुरू न किया जा सके।
    - बाउंड follow-up संदेश सीधे ACP सत्र में जाते हैं जब तक बाइंडिंग बंद, unfocused, reset, या expired न हो जाए।
    - Gateway कमांड स्थानीय रहते हैं। `/acp ...`, `/status`, और `/unfocus` को कभी भी सामान्य prompt text के रूप में बाउंड ACP हार्नेस को नहीं भेजा जाता।
    - जब बैकएंड cancellation का समर्थन करता है, तो `cancel` सक्रिय टर्न को रोकता है; यह बाइंडिंग या सत्र मेटाडेटा को नहीं हटाता।
    - `close` OpenClaw के दृष्टिकोण से ACP सत्र समाप्त करता है और बाइंडिंग हटाता है। यदि हार्नेस resume का समर्थन करता है, तो वह अभी भी अपना upstream history रख सकता है।
    - acpx Plugin `close` के बाद OpenClaw-owned wrapper और अडैप्टर process trees साफ करता है, और Gateway startup के दौरान stale OpenClaw-owned ACPX orphans को reap करता है।
    - Idle रनटाइम workers `acp.runtime.ttlMinutes` के बाद cleanup के पात्र होते हैं; संग्रहित सत्र मेटाडेटा `/acp sessions` के लिए उपलब्ध रहता है।

  </Accordion>
  <Accordion title="Native Codex routing rules">
    Natural-language triggers जिन्हें सक्षम होने पर **नेटिव Codex
    Plugin** तक route होना चाहिए:

    - "इस Discord चैनल को Codex से bind करें।"
    - "इस चैट को Codex thread `<id>` से attach करें।"
    - "Codex threads दिखाएँ, फिर इसे bind करें।"

    नेटिव Codex बातचीत बाइंडिंग डिफ़ॉल्ट चैट-नियंत्रण पथ है।
    OpenClaw डायनामिक टूल अब भी OpenClaw के माध्यम से निष्पादित होते हैं, जबकि
    shell/apply-patch जैसे Codex-नेटिव टूल Codex के भीतर निष्पादित होते हैं।
    Codex-नेटिव टूल इवेंट्स के लिए, OpenClaw प्रति-टर्न नेटिव
    hook relay इंजेक्ट करता है ताकि plugin hooks `before_tool_call` को ब्लॉक कर सकें, `after_tool_call` को देख सकें,
    और Codex `PermissionRequest` इवेंट्स को
    OpenClaw अनुमोदनों के माध्यम से रूट कर सकें। Codex `Stop` hooks को
    OpenClaw `before_agent_finalize` तक रिले किया जाता है, जहां plugins Codex द्वारा अपना उत्तर अंतिम करने से पहले एक और
    model pass का अनुरोध कर सकते हैं। relay जानबूझकर
    संयमित रहता है: यह Codex-नेटिव टूल
    arguments को mutate नहीं करता या Codex thread records को rewrite नहीं करता। स्पष्ट ACP का उपयोग केवल
    तब करें जब आप ACP runtime/session model चाहते हों। embedded Codex
    support boundary को
    [Codex harness v1 support contract](/hi/plugins/codex-harness-runtime#v1-support-contract) में दस्तावेज़ित किया गया है।

  </Accordion>
  <Accordion title="Model / provider / runtime चयन cheat sheet">
    - legacy Codex model refs - legacy Codex OAuth/subscription model route जिसे doctor द्वारा सुधारा गया।
    - `openai/*` - OpenAI agent turns के लिए नेटिव Codex app-server embedded runtime।
    - `/codex ...` - नेटिव Codex conversation control।
    - `/acp ...` या `runtime: "acp"` - स्पष्ट ACP/acpx control।

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    वे triggers जिन्हें ACP runtime पर route होना चाहिए:

    - "इसे one-shot Claude Code ACP session के रूप में चलाएं और परिणाम का सारांश दें।"
    - "इस task के लिए Gemini CLI को thread में उपयोग करें, फिर follow-ups उसी thread में रखें।"
    - "Codex को ACP के माध्यम से background thread में चलाएं।"

    OpenClaw `runtime: "acp"` चुनता है, harness `agentId` resolve करता है,
    supported होने पर current conversation या thread से bind करता है, और
    close/expiry तक follow-ups को उस session में route करता है। Codex इस path का अनुसरण केवल
    तब करता है जब ACP/acpx स्पष्ट हो या native Codex
    plugin requested operation के लिए unavailable हो।

    `sessions_spawn` के लिए, `runtime: "acp"` केवल तब advertised होता है जब ACP
    enabled हो, requester sandboxed न हो, और ACP runtime
    backend loaded हो। `acp.dispatch.enabled=false` automatic
    ACP thread dispatch को pause करता है, लेकिन explicit
    `sessions_spawn({ runtime: "acp" })` calls को hide या block नहीं करता। यह `codex`,
    `claude`, `droid`, `gemini`, या `opencode` जैसे ACP harness ids को target करता है। `agents_list` से कोई normal
    OpenClaw config agent id pass न करें, जब तक वह entry
    explicitly `agents.list[].runtime.type="acp"` के साथ configured न हो;
    अन्यथा default sub-agent runtime का उपयोग करें। जब कोई OpenClaw agent
    `runtime.type="acp"` के साथ configured होता है, OpenClaw
    `runtime.acp.agent` को underlying harness id के रूप में उपयोग करता है।

  </Accordion>
</AccordionGroup>

## ACP बनाम sub-agents

जब आप external harness runtime चाहते हों तो ACP का उपयोग करें। `codex`
plugin enabled होने पर Codex conversation binding/control के लिए **native Codex
app-server** का उपयोग करें। जब आप OpenClaw-native
delegated runs चाहते हों तो **sub-agents** का उपयोग करें।

| क्षेत्र          | ACP session                           | Sub-agent run                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP backend plugin (उदाहरण के लिए acpx) | OpenClaw native sub-agent runtime  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| मुख्य commands | `/acp ...`                            | `/subagents ...`                   |
| Spawn tool    | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn` (default runtime) |

यह भी देखें [Sub-agents](/hi/tools/subagents)।

## ACP Claude Code कैसे चलाता है

ACP के माध्यम से Claude Code के लिए, stack है:

1. OpenClaw ACP session control plane।
2. Official `@openclaw/acpx` runtime plugin।
3. Claude ACP adapter।
4. Claude-side runtime/session machinery।

ACP Claude एक **harness session** है जिसमें ACP controls, session resume,
background-task tracking, और optional conversation/thread binding होते हैं।

CLI backends अलग text-only local fallback runtimes हैं - देखें
[CLI Backends](/hi/gateway/cli-backends)।

Operators के लिए, practical rule है:

- **क्या `/acp spawn`, bindable sessions, runtime controls, या persistent harness work चाहिए?** ACP का उपयोग करें।
- **क्या raw CLI के माध्यम से simple local text fallback चाहिए?** CLI backends का उपयोग करें।

## Bound sessions

### Mental model

- **Chat surface** - जहां लोग बात करना जारी रखते हैं (Discord channel, Telegram topic, iMessage chat)।
- **ACP session** - टिकाऊ Codex/Claude/Gemini runtime state जिसे OpenClaw route करता है।
- **Child thread/topic** - केवल `--thread ...` द्वारा बनाया गया optional extra messaging surface।
- **Runtime workspace** - filesystem location (`cwd`, repo checkout, backend workspace) जहां harness चलता है। chat surface से स्वतंत्र।

### Current-conversation binds

`/acp spawn <harness> --bind here` current conversation को
spawned ACP session से pin करता है - कोई child thread नहीं, वही chat surface। OpenClaw
transport, auth, safety, और delivery का स्वामी बना रहता है। उस
conversation में follow-up messages उसी session पर route होते हैं; `/new` और `/reset`
session को वहीं reset करते हैं; `/acp close` binding को हटाता है।

Examples:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Binding rules and exclusivity">
    - `--bind here` और `--thread ...` परस्पर exclusive हैं।
    - `--bind here` केवल उन channels पर काम करता है जो current-conversation binding advertise करते हैं; अन्यथा OpenClaw एक स्पष्ट unsupported message लौटाता है। Bindings gateway restarts के पार persist रहती हैं।
    - Discord पर, `spawnSessions` `--thread auto|here` के लिए child thread creation को gate करता है - `--bind here` को नहीं।
    - यदि आप `--cwd` के बिना किसी अलग ACP agent पर spawn करते हैं, तो OpenClaw default रूप से **target agent's** workspace inherit करता है। Missing inherited paths (`ENOENT`/`ENOTDIR`) backend default पर fall back करते हैं; अन्य access errors (जैसे `EACCES`) spawn errors के रूप में surface होते हैं।
    - Gateway management commands bound conversations में local रहती हैं - `/acp ...` commands OpenClaw द्वारा handled होती हैं, भले ही normal follow-up text bound ACP session पर route हो; `/status` और `/unfocus` भी तब local रहते हैं जब उस surface के लिए command handling enabled हो।

  </Accordion>
  <Accordion title="Thread-bound sessions">
    जब किसी channel adapter के लिए thread bindings enabled हों:

    - OpenClaw किसी thread को target ACP session से bind करता है।
    - उस thread में follow-up messages bound ACP session पर route होते हैं।
    - ACP output उसी thread में वापस delivered होता है।
    - Unfocus/close/archive/idle-timeout या max-age expiry binding को हटा देता है।
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, और `/unfocus` Gateway commands हैं, ACP harness के लिए prompts नहीं।

    Thread-bound ACP के लिए आवश्यक feature flags:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` default रूप से on है (`false` set करें ताकि automatic ACP thread dispatch pause हो; explicit `sessions_spawn({ runtime: "acp" })` calls फिर भी काम करते हैं)।
    - Channel-adapter thread session spawns enabled (default: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Thread binding support adapter-specific है। यदि active channel
    adapter thread bindings support नहीं करता, तो OpenClaw एक स्पष्ट
    unsupported/unavailable message लौटाता है।

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - कोई भी channel adapter जो session/thread binding capability expose करता है।
    - Current built-in support: **Discord** threads/channels, **Telegram** topics (groups/supergroups में forum topics और DM topics)।
    - Plugin channels उसी binding interface के माध्यम से support जोड़ सकते हैं।

  </Accordion>
</AccordionGroup>

## Persistent channel bindings

Non-ephemeral workflows के लिए, persistent ACP bindings को
top-level `bindings[]` entries में configure करें।

### Binding model

<ParamField path="bindings[].type" type='"acp"'>
  Persistent ACP conversation binding mark करता है।
</ParamField>
<ParamField path="bindings[].match" type="object">
  Target conversation identify करता है। Per-channel shapes:

- **Discord channel/thread:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack channel/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`। Stable Slack ids को prefer करें; channel bindings उस channel के threads के अंदर replies से भी match करती हैं।
- **Telegram forum topic:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/group:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`। Direct chats के लिए `+15555550123` जैसे E.164 numbers और groups के लिए `120363424282127706@g.us` जैसे WhatsApp group JIDs उपयोग करें।
- **iMessage DM/group:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`। Stable group bindings के लिए `chat_id:*` prefer करें।

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Owning OpenClaw agent id।
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Optional ACP override।
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Optional operator-facing label।
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Optional runtime working directory।
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Optional backend override।
</ParamField>

### Runtime defaults per agent

प्रति agent ACP defaults को एक बार define करने के लिए `agents.list[].runtime` का उपयोग करें:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, जैसे `codex` या `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP bound sessions के लिए override precedence:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Global ACP defaults (जैसे `acp.backend`)

### Example

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### व्यवहार

- OpenClaw चैनल-विशिष्ट प्रवेश के बाद और उपयोग से पहले सुनिश्चित करता है कि कॉन्फ़िगर किया गया ACP सत्र मौजूद है।
- उस चैनल, टॉपिक, या चैट के संदेश कॉन्फ़िगर किए गए ACP सत्र पर रूट होते हैं।
- कॉन्फ़िगर किए गए ACP बाइंडिंग अपने सत्र रूट के स्वामी होते हैं। चैनल ब्रॉडकास्ट फैन-आउट किसी मिलान हुए बाइंडिंग के लिए कॉन्फ़िगर किए गए ACP सत्र को प्रतिस्थापित नहीं करता।
- बाउंड बातचीत में, `/new` और `/reset` उसी ACP सत्र कुंजी को उसी स्थान पर रीसेट करते हैं।
- अस्थायी रनटाइम बाइंडिंग (उदाहरण के लिए थ्रेड-फोकस फ्लो द्वारा बनाए गए) जहां मौजूद हों वहां अब भी लागू होते हैं।
- स्पष्ट `cwd` के बिना क्रॉस-एजेंट ACP स्पॉन के लिए, OpenClaw एजेंट कॉन्फ़िगरेशन से लक्ष्य एजेंट वर्कस्पेस इनहेरिट करता है।
- अनुपस्थित इनहेरिट किए गए वर्कस्पेस पथ बैकएंड डिफ़ॉल्ट cwd पर वापस जाते हैं; गैर-अनुपस्थित एक्सेस विफलताएं स्पॉन त्रुटियों के रूप में सतह पर आती हैं।

## ACP सत्र शुरू करें

ACP सत्र शुरू करने के दो तरीके:

<Tabs>
  <Tab title="sessions_spawn से">
    एजेंट टर्न या टूल कॉल से ACP सत्र शुरू करने के लिए `runtime: "acp"` का उपयोग करें।

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` डिफ़ॉल्ट रूप से `subagent` होता है, इसलिए ACP सत्रों के लिए स्पष्ट रूप से
    `runtime: "acp"` सेट करें। यदि `agentId` छोड़ा गया है, तो OpenClaw कॉन्फ़िगर होने पर
    `acp.defaultAgent` का उपयोग करता है। स्थायी बाउंड बातचीत बनाए रखने के लिए
    `mode: "session"` को `thread: true` की आवश्यकता होती है।
    </Note>

  </Tab>
  <Tab title="/acp कमांड से">
    चैट से स्पष्ट ऑपरेटर नियंत्रण के लिए `/acp spawn` का उपयोग करें।

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    मुख्य फ़्लैग:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    [स्लैश कमांड](/hi/tools/slash-commands) देखें।

  </Tab>
</Tabs>

### `sessions_spawn` पैरामीटर

<ParamField path="task" type="string" required>
  ACP सत्र को भेजा गया प्रारंभिक प्रॉम्प्ट।
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP सत्रों के लिए `"acp"` होना चाहिए।
</ParamField>
<ParamField path="agentId" type="string">
  ACP लक्ष्य हार्नेस id। सेट होने पर `acp.defaultAgent` पर वापस जाता है।
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  जहां समर्थित हो वहां थ्रेड बाइंडिंग फ्लो का अनुरोध करें।
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` वन-शॉट है; `"session"` स्थायी है। यदि `thread: true` है और
  `mode` छोड़ा गया है, तो OpenClaw रनटाइम पथ के अनुसार स्थायी व्यवहार को डिफ़ॉल्ट कर सकता है।
  `mode: "session"` को `thread: true` की आवश्यकता होती है।
</ParamField>
<ParamField path="cwd" type="string">
  अनुरोधित रनटाइम कार्यशील डायरेक्टरी (बैकएंड/रनटाइम नीति द्वारा सत्यापित)।
  यदि छोड़ा गया है, तो ACP स्पॉन कॉन्फ़िगर होने पर लक्ष्य एजेंट वर्कस्पेस इनहेरिट करता है;
  अनुपस्थित इनहेरिट किए गए पथ बैकएंड डिफ़ॉल्ट पर वापस जाते हैं, जबकि वास्तविक एक्सेस त्रुटियां लौटाई जाती हैं।
</ParamField>
<ParamField path="label" type="string">
  सत्र/बैनर टेक्स्ट में उपयोग किया जाने वाला ऑपरेटर-फेसिंग लेबल।
</ParamField>
<ParamField path="resumeSessionId" type="string">
  नया सत्र बनाने के बजाय मौजूदा ACP सत्र फिर से शुरू करें। एजेंट
  `session/load` के जरिए अपने बातचीत इतिहास को फिर से चलाता है। `runtime: "acp"` आवश्यक है।
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` प्रारंभिक ACP रन प्रगति सारांशों को सिस्टम ईवेंट के रूप में
  अनुरोधकर्ता सत्र में वापस स्ट्रीम करता है। स्वीकृत प्रतिक्रियाओं में
  `streamLogPath` शामिल है जो सत्र-स्कोप्ड JSONL लॉग
  (`<sessionId>.acp-stream.jsonl`) की ओर संकेत करता है, जिसे आप पूर्ण रिले इतिहास के लिए tail कर सकते हैं।
  पैरेंट प्रगति स्ट्रीम डिफ़ॉल्ट रूप से सहायक टिप्पणी और ACP स्थिति प्रगति दिखाते हैं,
  जब तक `streaming.progress.commentary=false` न हो। कोई स्ट्रीम मोड कॉन्फ़िगर न होने पर Discord भी
  पैरेंट प्रीव्यू को डिफ़ॉल्ट रूप से प्रगति मोड में रखता है। स्थिति प्रगति अब भी
  `acp.stream.tagVisibility` का सम्मान करती है, इसलिए `plan` जैसे टैग स्पष्ट रूप से सक्षम न होने तक छिपे रहते हैं।
</ParamField>

ACP `sessions_spawn` रन अपने डिफ़ॉल्ट चाइल्ड टर्न सीमा के लिए
`agents.defaults.subagents.runTimeoutSeconds` का उपयोग करते हैं। टूल प्रति-कॉल टाइमआउट
ओवरराइड स्वीकार नहीं करता।

<ParamField path="model" type="string">
  ACP चाइल्ड सत्र के लिए स्पष्ट मॉडल ओवरराइड। Codex ACP स्पॉन
  `session/new` से पहले `openai/gpt-5.4` जैसे OpenAI refs को Codex ACP स्टार्टअप
  कॉन्फ़िगरेशन में सामान्यीकृत करते हैं; `openai/gpt-5.4/high` जैसे स्लैश रूप
  Codex ACP reasoning effort भी सेट करते हैं।
  छोड़े जाने पर, `sessions_spawn({ runtime: "acp" })` कॉन्फ़िगर होने पर मौजूदा
  सबएजेंट मॉडल डिफ़ॉल्ट (`agents.defaults.subagents.model` या
  `agents.list[].subagents.model`) का उपयोग करता है; अन्यथा यह ACP हार्नेस को
  अपना डिफ़ॉल्ट मॉडल उपयोग करने देता है।
  अन्य हार्नेस को ACP `models` विज्ञापित करने और
  `session/set_model` का समर्थन करने की आवश्यकता है; अन्यथा OpenClaw/acpx लक्ष्य एजेंट डिफ़ॉल्ट पर चुपचाप
  वापस जाने के बजाय स्पष्ट रूप से विफल होता है।
</ParamField>
<ParamField path="thinking" type="string">
  स्पष्ट सोच/reasoning effort। Codex ACP के लिए, `minimal` कम प्रयास पर मैप होता है,
  `low`/`medium`/`high`/`xhigh` सीधे मैप होते हैं, और `off`
  reasoning-effort स्टार्टअप ओवरराइड को छोड़ देता है।
  छोड़े जाने पर, ACP स्पॉन चयनित मॉडल के लिए मौजूदा सबएजेंट thinking डिफ़ॉल्ट और
  प्रति-मॉडल `agents.defaults.models["provider/model"].params.thinking`
  का उपयोग करते हैं।
</ParamField>

## स्पॉन बाइंड और थ्रेड मोड

<Tabs>
  <Tab title="--bind here|off">
    | मोड   | व्यवहार                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | वर्तमान सक्रिय बातचीत को उसी स्थान पर बाइंड करें; कोई सक्रिय न हो तो विफल हों। |
    | `off`  | वर्तमान-बातचीत बाइंडिंग न बनाएं।                          |

    नोट:

    - `--bind here` "इस चैनल या चैट को Codex-समर्थित बनाएं" के लिए सबसे सरल ऑपरेटर पथ है।
    - `--bind here` चाइल्ड थ्रेड नहीं बनाता।
    - `--bind here` केवल उन चैनलों पर उपलब्ध है जो वर्तमान-बातचीत बाइंडिंग समर्थन उजागर करते हैं।
    - एक ही `/acp spawn` कॉल में `--bind` और `--thread` को साथ नहीं जोड़ा जा सकता।

  </Tab>
  <Tab title="--thread auto|here|off">
    | मोड   | व्यवहार                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | सक्रिय थ्रेड में: उस थ्रेड को बाइंड करें। थ्रेड के बाहर: समर्थित होने पर चाइल्ड थ्रेड बनाएं/बाइंड करें। |
    | `here` | वर्तमान सक्रिय थ्रेड आवश्यक है; यदि उसमें नहीं हैं तो विफल हों।                                                  |
    | `off`  | कोई बाइंडिंग नहीं। सत्र अनबाउंड शुरू होता है।                                                                 |

    नोट:

    - गैर-थ्रेड बाइंडिंग सतहों पर, डिफ़ॉल्ट व्यवहार प्रभावी रूप से `off` है।
    - थ्रेड-बाउंड स्पॉन को चैनल नीति समर्थन की आवश्यकता होती है:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - जब आप चाइल्ड थ्रेड बनाए बिना वर्तमान बातचीत को पिन करना चाहते हों, तो `--bind here` का उपयोग करें।

  </Tab>
</Tabs>

## डिलीवरी मॉडल

ACP सत्र या तो इंटरैक्टिव वर्कस्पेस हो सकते हैं या पैरेंट-स्वामित्व वाला
बैकग्राउंड कार्य। डिलीवरी पथ उस रूप पर निर्भर करता है।

<AccordionGroup>
  <Accordion title="इंटरैक्टिव ACP सत्र">
    इंटरैक्टिव सत्रों का उद्देश्य दृश्यमान चैट सतह पर बातचीत जारी रखना है:

    - `/acp spawn ... --bind here` वर्तमान बातचीत को ACP सत्र से बाइंड करता है।
    - `/acp spawn ... --thread ...` चैनल थ्रेड/टॉपिक को ACP सत्र से बाइंड करता है।
    - स्थायी कॉन्फ़िगर किए गए `bindings[].type="acp"` मिलती हुई बातचीतों को उसी ACP सत्र पर रूट करते हैं।

    बाउंड बातचीत में फॉलो-अप संदेश सीधे ACP सत्र पर रूट होते हैं, और ACP आउटपुट उसी
    चैनल/थ्रेड/टॉपिक पर वापस डिलीवर किया जाता है।

    OpenClaw हार्नेस को क्या भेजता है:

    - सामान्य बाउंड फॉलो-अप प्रॉम्प्ट टेक्स्ट के रूप में भेजे जाते हैं, साथ में अटैचमेंट केवल तब जब हार्नेस/बैकएंड उनका समर्थन करता हो।
    - ACP डिस्पैच से पहले `/acp` प्रबंधन कमांड और स्थानीय Gateway कमांड इंटरसेप्ट किए जाते हैं।
    - रनटाइम-जनित completion ईवेंट प्रति लक्ष्य materialized होते हैं। OpenClaw एजेंटों को OpenClaw का आंतरिक runtime-context envelope मिलता है; बाहरी ACP हार्नेस को चाइल्ड परिणाम और निर्देश के साथ एक सामान्य प्रॉम्प्ट मिलता है। कच्चा `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope कभी भी बाहरी हार्नेस को नहीं भेजा जाना चाहिए या ACP उपयोगकर्ता transcript टेक्स्ट के रूप में persisted नहीं होना चाहिए।
    - ACP transcript प्रविष्टियां उपयोगकर्ता-दृश्यमान ट्रिगर टेक्स्ट या सामान्य completion प्रॉम्प्ट का उपयोग करती हैं। आंतरिक ईवेंट मेटाडेटा जहां संभव हो OpenClaw में संरचित रहता है और उसे उपयोगकर्ता-लिखित चैट सामग्री की तरह नहीं माना जाता।

  </Accordion>
  <Accordion title="पैरेंट-स्वामित्व वाले वन-शॉट ACP सत्र">
    किसी अन्य एजेंट रन द्वारा स्पॉन किए गए वन-शॉट ACP सत्र बैकग्राउंड
    चाइल्ड होते हैं, सब-एजेंटों जैसे:

    - पैरेंट `sessions_spawn({ runtime: "acp", mode: "run" })` के साथ कार्य मांगता है।
    - चाइल्ड अपने ACP हार्नेस सत्र में चलता है।
    - चाइल्ड टर्न उसी बैकग्राउंड लेन पर चलते हैं जिसका उपयोग native सब-एजेंट स्पॉन करते हैं, इसलिए धीमा ACP हार्नेस असंबंधित मुख्य-सत्र कार्य को ब्लॉक नहीं करता।
    - completion task-completion announce पथ के जरिए वापस रिपोर्ट करता है। OpenClaw आंतरिक completion मेटाडेटा को बाहरी हार्नेस को भेजने से पहले सामान्य ACP प्रॉम्प्ट में बदलता है, ताकि हार्नेस OpenClaw-only रनटाइम context markers न देखें।
    - जब उपयोगकर्ता-फेसिंग उत्तर उपयोगी हो, तो पैरेंट चाइल्ड परिणाम को सामान्य सहायक आवाज़ में फिर से लिखता है।

    इस पथ को पैरेंट और चाइल्ड के बीच peer-to-peer चैट के रूप में **न** मानें। चाइल्ड के पास पहले से ही पैरेंट तक वापस completion चैनल है।

  </Accordion>
  <Accordion title="sessions_send और A2A डिलीवरी">
    `sessions_send` स्पॉन के बाद किसी अन्य सत्र को लक्षित कर सकता है। सामान्य
    peer सत्रों के लिए, OpenClaw संदेश इंजेक्ट करने के बाद agent-to-agent (A2A) फॉलो-अप पथ का उपयोग करता है:

    - लक्ष्य सत्र के उत्तर की प्रतीक्षा करें।
    - वैकल्पिक रूप से अनुरोधकर्ता और लक्ष्य को फॉलो-अप टर्न की सीमित संख्या का आदान-प्रदान करने दें।
    - लक्ष्य से announce संदेश बनाने को कहें।
    - उस announce को दृश्यमान चैनल या थ्रेड पर डिलीवर करें।

    वह A2A पथ peer sends के लिए fallback है जहां प्रेषक को दृश्यमान फॉलो-अप की आवश्यकता होती है।
    यह तब सक्षम रहता है जब कोई असंबंधित सत्र ACP लक्ष्य को देख और संदेश भेज सकता है,
    उदाहरण के लिए व्यापक `tools.sessions.visibility` सेटिंग्स के अंतर्गत।

    OpenClaw A2A फ़ॉलो-अप केवल तब छोड़ता है जब अनुरोधकर्ता अपने ही
    parent-स्वामित्व वाले एक-बार चलने वाले ACP child का parent हो। उस स्थिति में,
    task completion के ऊपर A2A चलाने से parent child के परिणाम के साथ जाग सकता है,
    parent का उत्तर वापस child में फ़ॉरवर्ड हो सकता है, और
    parent/child echo loop बन सकता है। `sessions_send` परिणाम उस
    owned-child मामले के लिए `delivery.status="skipped"` रिपोर्ट करता है क्योंकि
    completion path पहले से ही परिणाम के लिए ज़िम्मेदार है।

  </Accordion>
  <Accordion title="मौजूदा session फिर से शुरू करें">
    नया शुरू करने के बजाय पिछली ACP session जारी रखने के लिए `resumeSessionId` का उपयोग करें।
    agent अपनी conversation history को `session/load` के ज़रिए फिर से चलाता है,
    इसलिए यह पहले के पूरे संदर्भ के साथ आगे बढ़ता है।

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    सामान्य उपयोग के मामले:

    - अपने laptop से अपने phone पर Codex session hand off करें - अपने agent को वहीं से आगे बढ़ने को कहें जहाँ आपने छोड़ा था।
    - CLI में interactively शुरू की गई coding session को अब अपने agent के ज़रिए headlessly जारी रखें।
    - gateway restart या idle timeout से बाधित हुआ काम फिर से शुरू करें।

    नोट्स:

    - `resumeSessionId` केवल तब लागू होता है जब `runtime: "acp"` हो; default sub-agent runtime इस ACP-only field को अनदेखा करता है।
    - `streamTo` केवल तब लागू होता है जब `runtime: "acp"` हो; default sub-agent runtime इस ACP-only field को अनदेखा करता है।
    - `resumeSessionId` एक host-local ACP/harness resume id है, OpenClaw channel session key नहीं; OpenClaw dispatch से पहले अब भी ACP spawn policy और target agent policy की जाँच करता है, जबकि ACP backend या harness उस upstream id को load करने की authorization का स्वामी होता है।
    - `resumeSessionId` upstream ACP conversation history को restore करता है; `thread` और `mode` आपके बनाए जा रहे नए OpenClaw session पर सामान्य रूप से लागू होते हैं, इसलिए `mode: "session"` के लिए अब भी `thread: true` आवश्यक है।
    - target agent को `session/load` support करना चाहिए (Codex और Claude Code करते हैं)।
    - यदि session id नहीं मिलती, तो spawn स्पष्ट error के साथ fail होता है - नए session पर कोई silent fallback नहीं।

  </Accordion>
  <Accordion title="Deploy के बाद smoke test">
    gateway deploy के बाद, unit tests पर भरोसा करने के बजाय live end-to-end check चलाएँ:

    1. target host पर deployed gateway version और commit verify करें।
    2. live agent के लिए अस्थायी ACPX bridge session खोलें।
    3. उस agent से `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` और task `Reply with exactly LIVE-ACP-SPAWN-OK` के साथ `sessions_spawn` call करने को कहें।
    4. `accepted=yes`, वास्तविक `childSessionKey`, और कोई validator error न होना verify करें।
    5. अस्थायी bridge session clean up करें।

    gate को `mode: "run"` पर रखें और `streamTo: "parent"` skip करें -
    thread-bound `mode: "session"` और stream-relay paths अलग
    अधिक समृद्ध integration passes हैं।

  </Accordion>
</AccordionGroup>

## Sandbox compatibility

ACP sessions अभी host runtime पर चलती हैं, OpenClaw sandbox के अंदर **नहीं**।

<Warning>
**Security boundary:**

- external harness अपनी CLI permissions और चुने गए `cwd` के अनुसार read/write कर सकता है।
- OpenClaw की sandbox policy ACP harness execution को wrap **नहीं** करती।
- OpenClaw अब भी ACP feature gates, allowed agents, session ownership, channel bindings, और Gateway delivery policy लागू करता है।
- sandbox-enforced OpenClaw-native work के लिए `runtime: "subagent"` का उपयोग करें।

</Warning>

मौजूदा सीमाएँ:

- यदि requester session sandboxed है, तो ACP spawns `sessions_spawn({ runtime: "acp" })` और `/acp spawn` दोनों के लिए blocked होते हैं।
- `runtime: "acp"` के साथ `sessions_spawn`, `sandbox: "require"` support नहीं करता।

## Session target resolution

अधिकांश `/acp` actions एक वैकल्पिक session target (`session-key`,
`session-id`, या `session-label`) स्वीकार करते हैं।

**Resolution order:**

1. Explicit target argument (या `/acp steer` के लिए `--session`)
   - पहले key आज़माता है
   - फिर UUID-shaped session id
   - फिर label
2. Current thread binding (यदि यह conversation/thread किसी ACP session से bound है)।
3. Current requester session fallback।

Current-conversation bindings और thread bindings दोनों
step 2 में भाग लेते हैं।

यदि कोई target resolve नहीं होता, तो OpenClaw स्पष्ट error लौटाता है
(`Unable to resolve session target: ...`)।

## ACP controls

| Command              | यह क्या करता है                                           | उदाहरण                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP session बनाएँ; वैकल्पिक current bind या thread bind। | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | target session के in-flight turn को cancel करें।          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | running session को steer instruction भेजें।               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | session बंद करें और thread targets unbind करें।           | `/acp close`                                                  |
| `/acp status`        | backend, mode, state, runtime options, capabilities दिखाएँ। | `/acp status`                                                 |
| `/acp set-mode`      | target session के लिए runtime mode set करें।              | `/acp set-mode plan`                                          |
| `/acp set`           | generic runtime config option write।                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | runtime working directory override set करें।              | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | approval policy profile set करें।                         | `/acp permissions strict`                                     |
| `/acp timeout`       | runtime timeout (seconds) set करें।                       | `/acp timeout 120`                                            |
| `/acp model`         | runtime model override set करें।                          | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | session runtime option overrides हटाएँ।                   | `/acp reset-options`                                          |
| `/acp sessions`      | store से हाल की ACP sessions list करें।                   | `/acp sessions`                                               |
| `/acp doctor`        | backend health, capabilities, actionable fixes।           | `/acp doctor`                                                 |
| `/acp install`       | deterministic install और enable steps print करें।         | `/acp install`                                                |

Runtime controls (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, और `reset-options`) को
external channels से owner identity और internal Gateway clients से
`operator.admin` की आवश्यकता होती है। Authorized non-owner senders अब भी
`sessions`, `doctor`, `install`, और `help` का उपयोग कर सकते हैं।

`/acp status` effective runtime options के साथ runtime-level और
backend-level session identifiers दिखाता है। जब किसी backend में capability नहीं होती,
unsupported-control errors स्पष्ट रूप से दिखते हैं। `/acp sessions`
current bound या requester session के लिए store पढ़ता है; target tokens
(`session-key`, `session-id`, या `session-label`)
gateway session discovery के ज़रिए resolve होते हैं, जिसमें custom per-agent
`session.store` roots शामिल हैं।

### Runtime options mapping

`/acp` में convenience commands और generic setter है। Equivalent
operations:

| Command                      | इससे map होता है                     | नोट्स                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime config key `model`           | Codex ACP के लिए, OpenClaw `openai/<model>` को adapter model id में normalize करता है और `openai/gpt-5.4/high` जैसे slash reasoning suffixes को `reasoning_effort` में map करता है।                                         |
| `/acp set thinking <level>`  | canonical option `thinking`          | OpenClaw present होने पर backend-advertised equivalent भेजता है, `thinking`, फिर `effort`, `reasoning_effort`, या `thought_level` को preference देता है। Codex ACP के लिए, adapter values को `reasoning_effort` में map करता है। |
| `/acp permissions <profile>` | canonical option `permissionProfile` | OpenClaw present होने पर backend-advertised equivalent भेजता है, जैसे `approval_policy`, `permission_profile`, `permissions`, या `permission_mode`।                                                       |
| `/acp timeout <seconds>`     | canonical option `timeoutSeconds`    | OpenClaw present होने पर backend-advertised equivalent भेजता है, जैसे `timeout` या `timeout_seconds`।                                                                                                     |
| `/acp cwd <path>`            | runtime cwd override                 | Direct update।                                                                                                                                                                                             |
| `/acp set <key> <value>`     | generic                              | `key=cwd` cwd override path का उपयोग करता है।                                                                                                                                                                      |
| `/acp reset-options`         | सभी runtime overrides clear करता है  | -                                                                                                                                                                                                          |

## acpx harness, plugin setup, और permissions

acpx harness configuration (Claude Code / Codex / Gemini CLI
aliases), plugin-tools और OpenClaw-tools MCP bridges, और ACP
permission modes के लिए, देखें
[ACP agents - setup](/hi/tools/acp-agents-setup).

## Troubleshooting

| लक्षण                                                                     | संभावित कारण                                                                                                           | समाधान                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Backend Plugin गायब है, अक्षम है, या `plugins.allow` से अवरुद्ध है।                                                       | Backend Plugin इंस्टॉल और सक्षम करें, जब वह allowlist सेट हो तो `plugins.allow` में `acpx` शामिल करें, फिर `/acp doctor` चलाएँ।                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP वैश्विक रूप से अक्षम है।                                                                                                 | `acp.enabled=true` सेट करें।                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | सामान्य thread संदेशों से स्वचालित dispatch अक्षम है।                                                               | स्वचालित thread routing फिर से शुरू करने के लिए `acp.dispatch.enabled=true` सेट करें; स्पष्ट `sessions_spawn({ runtime: "acp" })` कॉल अब भी काम करते हैं।                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent allowlist में नहीं है।                                                                                                | अनुमत `agentId` इस्तेमाल करें या `acp.allowedAgents` अपडेट करें।                                                                                                                     |
| `/acp doctor` startup के तुरंत बाद backend तैयार नहीं बताता                 | Backend Plugin गायब है, अक्षम है, allow/deny policy से अवरुद्ध है, या उसका configured executable उपलब्ध नहीं है।        | Backend Plugin इंस्टॉल/सक्षम करें, `/acp doctor` फिर से चलाएँ, और अगर वह अस्वस्थ रहता है तो backend install या policy error जाँचें।                                           |
| Harness command नहीं मिला                                                   | Adapter CLI इंस्टॉल नहीं है, external Plugin गायब है, या non-Codex adapter के लिए पहली बार का `npx` fetch विफल हुआ। | `/acp doctor` चलाएँ, Gateway host पर adapter इंस्टॉल/prewarm करें, या acpx agent command को स्पष्ट रूप से configure करें।                                                      |
| Harness से model-not-found                                            | Model id किसी दूसरे provider/harness के लिए valid है, लेकिन इस ACP target के लिए नहीं।                                                | उस harness द्वारा सूचीबद्ध model इस्तेमाल करें, harness में model configure करें, या override छोड़ दें।                                                                            |
| Harness से vendor auth error                                          | OpenClaw स्वस्थ है, लेकिन target CLI/provider logged in नहीं है।                                                     | Gateway host environment पर log in करें या आवश्यक provider key दें।                                                                                             |
| `Unable to resolve session target: ...`                                     | गलत key/id/label token।                                                                                                | `/acp sessions` चलाएँ, सटीक key/label copy करें, retry करें।                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` को active bindable conversation के बिना इस्तेमाल किया गया।                                                            | target chat/channel में जाएँ और retry करें, या unbound spawn इस्तेमाल करें।                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter में current-conversation ACP binding capability नहीं है।                                                             | जहाँ supported हो वहाँ `/acp spawn ... --thread ...` इस्तेमाल करें, top-level `bindings[]` configure करें, या supported channel पर जाएँ।                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` को thread context के बाहर इस्तेमाल किया गया।                                                                         | target thread में जाएँ या `--thread auto`/`off` इस्तेमाल करें।                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | active binding target का owner कोई और user है।                                                                           | owner के रूप में rebind करें या कोई अलग conversation या thread इस्तेमाल करें।                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter में thread binding capability नहीं है।                                                                               | `--thread off` इस्तेमाल करें या supported adapter/channel पर जाएँ।                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime host-side है; requester session sandboxed है।                                                              | sandboxed sessions से `runtime="subagent"` इस्तेमाल करें, या ACP spawn को non-sandboxed session से चलाएँ।                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP runtime के लिए `sandbox="require"` माँगा गया।                                                                         | required sandboxing के लिए `runtime="subagent"` इस्तेमाल करें, या non-sandboxed session से `sandbox="inherit"` के साथ ACP इस्तेमाल करें।                                                      |
| `Cannot apply --model ... did not advertise model support`                  | target harness generic ACP model switching expose नहीं करता।                                                        | ऐसा harness इस्तेमाल करें जो ACP `models`/`session/set_model` advertise करता हो, Codex ACP model refs इस्तेमाल करें, या अगर harness का अपना startup flag है तो model को सीधे harness में configure करें। |
| bound session के लिए ACP metadata missing                                      | stale/deleted ACP session metadata।                                                                                    | `/acp spawn` से फिर बनाएँ, फिर thread को rebind/focus करें।                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` non-interactive ACP session में writes/exec रोकता है।                                                    | `plugins.entries.acpx.config.permissionMode` को `approve-all` पर सेट करें और gateway restart करें। [Permission configuration](/hi/tools/acp-agents-setup#permission-configuration) देखें। |
| ACP session बहुत कम output के साथ जल्दी fail हो जाता है                                  | Permission prompts `permissionMode`/`nonInteractivePermissions` से blocked हैं।                                        | `AcpRuntimeError` के लिए gateway logs जाँचें। full permissions के लिए `permissionMode=approve-all` सेट करें; graceful degradation के लिए `nonInteractivePermissions=deny` सेट करें।        |
| ACP session काम पूरा करने के बाद अनिश्चित काल तक stall रहता है                       | Harness process समाप्त हो गया, लेकिन ACP session ने completion report नहीं की।                                                    | OpenClaw अपडेट करें; current acpx cleanup close और Gateway startup पर OpenClaw-owned stale wrapper और adapter processes को reap करता है।                                             |
| Harness को `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` दिखता है                        | Internal event envelope ACP boundary के पार leak हो गया।                                                                | OpenClaw अपडेट करें और completion flow फिर से चलाएँ; external harnesses को केवल plain completion prompts मिलने चाहिए।                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` native Codex hook relay से संबंधित है,
ACP/acpx से नहीं। bound Codex chat में, `/new` या `/reset` से fresh
session शुरू करें; अगर यह एक बार काम करता है और फिर अगली
native tool call पर लौट आता है, तो बार-बार `/new` चलाने के बजाय
Codex app-server या OpenClaw Gateway restart करें। [Codex harness troubleshooting](/hi/plugins/codex-harness#troubleshooting) देखें।
</Note>

## संबंधित

- [ACP agents - setup](/hi/tools/acp-agents-setup)
- [Agent send](/hi/tools/agent-send)
- [CLI Backends](/hi/gateway/cli-backends)
- [Codex harness](/hi/plugins/codex-harness)
- [Codex harness runtime](/hi/plugins/codex-harness-runtime)
- [Multi-agent sandbox tools](/hi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (bridge mode)](/hi/cli/acp)
- [Sub-agents](/hi/tools/subagents)
