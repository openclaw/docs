---
read_when:
    - ACP के माध्यम से कोडिंग हार्नेस चलाना
    - मैसेजिंग चैनलों पर बातचीत-बाउंड ACP सत्र सेट अप करना
    - संदेश-चैनल बातचीत को स्थायी ACP सत्र से बाँधना
    - ACP बैकएंड, Plugin वायरिंग, या कंप्लीशन डिलीवरी का समस्या निवारण
    - चैट से /acp कमांड संचालित करना
sidebarTitle: ACP agents
summary: बाहरी कोडिंग हार्नेस (Claude Code, Cursor, Gemini CLI, स्पष्ट Codex ACP, OpenClaw ACP, OpenCode) को ACP बैकएंड के माध्यम से चलाएँ
title: ACP एजेंट्स
x-i18n:
    generated_at: "2026-06-29T00:15:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) सत्र
OpenClaw को ACP बैकएंड Plugin के माध्यम से बाहरी कोडिंग हार्नेस (उदाहरण के लिए Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, और अन्य
समर्थित ACPX हार्नेस) चलाने देते हैं।

प्रत्येक ACP सत्र स्पॉन को [पृष्ठभूमि कार्य](/hi/automation/tasks) के रूप में ट्रैक किया जाता है।

<Note>
**ACP बाहरी-हार्नेस पथ है, डिफ़ॉल्ट Codex पथ नहीं।** नेटिव Codex app-server Plugin `/codex ...` नियंत्रणों और एजेंट टर्न के लिए डिफ़ॉल्ट
`openai/gpt-*` एम्बेडेड रनटाइम का स्वामी है; ACP
`/acp ...` नियंत्रणों और `sessions_spawn({ runtime: "acp" })` सत्रों का स्वामी है।

यदि आप चाहते हैं कि Codex या Claude Code बाहरी MCP क्लाइंट के रूप में
मौजूदा OpenClaw चैनल वार्तालापों से सीधे जुड़े, तो ACP के बजाय
[`openclaw mcp serve`](/hi/cli/mcp) का उपयोग करें।
</Note>

## मुझे कौन-सा पेज चाहिए?

| आप चाहते हैं…                                                                                    | इसका उपयोग करें                              | नोट्स                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| मौजूदा वार्तालाप में Codex को बाइंड या नियंत्रित करना                                               | `/codex bind`, `/codex threads`       | जब `codex` Plugin सक्षम हो तो नेटिव Codex app-server पथ; इसमें बाउंड चैट उत्तर, इमेज फ़ॉरवर्डिंग, मॉडल/फास्ट/अनुमतियां, रोकना और दिशा-निर्देशन नियंत्रण शामिल हैं। ACP एक स्पष्ट फ़ॉलबैक है |
| Claude Code, Gemini CLI, स्पष्ट Codex ACP, या किसी अन्य बाहरी हार्नेस को OpenClaw _के माध्यम से_ चलाना | यह पेज                             | चैट-बाउंड सत्र, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, पृष्ठभूमि कार्य, रनटाइम नियंत्रण                                                                                   |
| किसी editor या क्लाइंट के लिए OpenClaw Gateway सत्र को ACP सर्वर _के रूप में_ उजागर करना                   | [`openclaw acp`](/hi/cli/acp)            | ब्रिज मोड। IDE/क्लाइंट stdio/WebSocket पर ACP के जरिए OpenClaw से बात करता है                                                                                                                            |
| किसी local AI CLI को केवल-पाठ फ़ॉलबैक मॉडल के रूप में पुन: उपयोग करना                                              | [CLI बैकएंड](/hi/gateway/cli-backends) | ACP नहीं। कोई OpenClaw टूल नहीं, कोई ACP नियंत्रण नहीं, कोई हार्नेस रनटाइम नहीं                                                                                                                               |

## क्या यह सीधे काम करता है?

हां, आधिकारिक ACP रनटाइम Plugin इंस्टॉल करने के बाद:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

सोर्स checkout `pnpm install` के बाद स्थानीय `extensions/acpx` workspace Plugin का उपयोग कर सकते हैं। तैयारी जांच के लिए `/acp doctor` चलाएं।

OpenClaw एजेंटों को ACP spawning के बारे में केवल तभी सिखाता है जब ACP **वास्तव में
उपयोग योग्य** हो: ACP सक्षम होना चाहिए, dispatch अक्षम नहीं होना चाहिए, मौजूदा
सत्र sandbox-blocked नहीं होना चाहिए, और रनटाइम बैकएंड
लोड होना चाहिए। यदि ये शर्तें पूरी नहीं होतीं, तो ACP Plugin Skills और
`sessions_spawn` ACP guidance छिपी रहती है ताकि एजेंट किसी अनुपलब्ध
बैकएंड का सुझाव न दे।

<AccordionGroup>
  <Accordion title="पहली बार चलाने की सावधानियां">
    - यदि `plugins.allow` सेट है, तो यह प्रतिबंधात्मक Plugin inventory है और इसमें `acpx` **ज़रूर** शामिल होना चाहिए; अन्यथा इंस्टॉल किया गया ACP बैकएंड जानबूझकर ब्लॉक किया जाता है और `/acp doctor` missing allowlist entry रिपोर्ट करता है।
    - Codex ACP adapter `acpx` Plugin के साथ staged होता है और संभव होने पर स्थानीय रूप से लॉन्च किया जाता है।
    - Codex ACP एक अलग `CODEX_HOME` के साथ चलता है; OpenClaw होस्ट Codex config से trusted project entries और सुरक्षित model/provider routing config कॉपी करता है, जबकि auth, notifications, और hooks होस्ट config पर रहते हैं।
    - अन्य target harness adapters पहली बार उपयोग करते समय अभी भी मांग पर `npx` से fetched हो सकते हैं।
    - उस harness के लिए vendor auth अभी भी host पर मौजूद होना चाहिए।
    - यदि host के पास npm या network access नहीं है, तो first-run adapter fetches तब तक fail होते हैं जब तक caches pre-warmed न हों या adapter किसी और तरीके से installed न हो।

  </Accordion>
  <Accordion title="रनटाइम prerequisites">
    ACP एक वास्तविक बाहरी harness process लॉन्च करता है। OpenClaw routing,
    background-task state, delivery, bindings, और policy का स्वामी है; harness
    अपने provider login, model catalog, filesystem behavior, और
    native tools का स्वामी है।

    OpenClaw को दोष देने से पहले सत्यापित करें:

    - `/acp doctor` enabled, healthy backend रिपोर्ट करता है।
    - जब allowlist सेट हो, target id `acp.allowedAgents` द्वारा allowed हो।
    - harness command Gateway host पर start हो सकता है।
    - उस harness (`claude`, `codex`, `gemini`, `opencode`, `droid`, आदि) के लिए provider auth मौजूद है।
    - चुना गया model उस harness के लिए मौजूद है - model ids harnesses के बीच portable नहीं हैं।
    - अनुरोधित `cwd` मौजूद और accessible है, या `cwd` छोड़ दें और backend को उसका default उपयोग करने दें।
    - Permission mode काम से मेल खाता है। Non-interactive sessions native permission prompts पर click नहीं कर सकते, इसलिए write/exec-heavy coding runs को आमतौर पर ऐसे ACPX permission profile की ज़रूरत होती है जो headlessly आगे बढ़ सके।

  </Accordion>
</AccordionGroup>

OpenClaw Plugin tools और built-in OpenClaw tools डिफ़ॉल्ट रूप से
ACP harnesses को expose **नहीं** किए जाते। [ACP agents - setup](/hi/tools/acp-agents-setup) में explicit MCP bridges केवल तभी सक्षम करें जब harness
को वे tools सीधे call करने चाहिए।

## समर्थित harness targets

`acpx` backend के साथ, इन harness ids को `/acp spawn <id>`
या `sessions_spawn({ runtime: "acp", agentId: "<id>" })` targets के रूप में उपयोग करें:

| Harness id | सामान्य backend                                | नोट्स                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | Host पर Claude Code auth आवश्यक है।                                              |
| `codex`    | Codex ACP adapter                              | केवल तब explicit ACP fallback जब native `/codex` unavailable हो या ACP requested हो। |
| `copilot`  | GitHub Copilot ACP adapter                     | Copilot CLI/runtime auth आवश्यक है।                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | यदि local install कोई अलग ACP entrypoint expose करता है, तो acpx command override करें।    |
| `droid`    | Factory Droid CLI                              | Harness environment में Factory/Droid auth या `FACTORY_API_KEY` आवश्यक है।        |
| `gemini`   | Gemini CLI ACP adapter                         | Gemini CLI auth या API key setup आवश्यक है।                                          |
| `iflow`    | iFlow CLI                                      | Adapter availability और model control installed CLI पर निर्भर करते हैं।                 |
| `kilocode` | Kilo Code CLI                                  | Adapter availability और model control installed CLI पर निर्भर करते हैं।                 |
| `kimi`     | Kimi/Moonshot CLI                              | Host पर Kimi/Moonshot auth आवश्यक है।                                            |
| `kiro`     | Kiro CLI                                       | Adapter availability और model control installed CLI पर निर्भर करते हैं।                 |
| `opencode` | OpenCode ACP adapter                           | OpenCode CLI/provider auth आवश्यक है।                                                |
| `openclaw` | `openclaw acp` के माध्यम से OpenClaw Gateway bridge | ACP-aware harness को OpenClaw Gateway session से वापस बात करने देता है।                 |
| `qwen`     | Qwen Code / Qwen CLI                           | Host पर Qwen-compatible auth आवश्यक है।                                          |

Custom acpx agent aliases स्वयं acpx में configured किए जा सकते हैं, लेकिन OpenClaw
policy फिर भी dispatch से पहले `acp.allowedAgents` और किसी भी
`agents.list[].runtime.acp.agent` mapping की जांच करती है।

## ऑपरेटर runbook

Chat से त्वरित `/acp` flow:

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, या explicit
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Work">
    Bound conversation या thread में जारी रखें (या session
    key को explicitly target करें).
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
    Context बदले बिना: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Stop">
    `/acp cancel` (current turn) या `/acp close` (session + bindings).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle details">
    - Spawn ACP runtime session बनाता या resume करता है, OpenClaw session store में ACP metadata record करता है, और जब run parent-owned हो तो background task बना सकता है।
    - Parent-owned ACP sessions को background work माना जाता है, भले ही runtime session persistent हो; completion और cross-surface delivery सामान्य user-facing chat session की तरह act करने के बजाय parent task notifier से गुजरते हैं।
    - Task maintenance terminal या orphaned parent-owned one-shot ACP sessions को close करता है। Persistent ACP sessions तब तक preserved रहते हैं जब तक active conversation binding बनी रहे; active binding के बिना stale persistent sessions close कर दिए जाते हैं ताकि owning task done होने या task record gone होने के बाद वे silently resumed न हो सकें।
    - Bound follow-up messages binding closed, unfocused, reset, या expired होने तक सीधे ACP session को जाते हैं।
    - Gateway commands local रहते हैं। `/acp ...`, `/status`, और `/unfocus` कभी भी bound ACP harness को normal prompt text के रूप में नहीं भेजे जाते।
    - `cancel` active turn को abort करता है जब backend cancellation support करता है; यह binding या session metadata delete नहीं करता।
    - `close` OpenClaw के दृष्टिकोण से ACP session समाप्त करता है और binding हटाता है। यदि harness resume support करता है, तो वह अपना upstream history अभी भी रख सकता है।
    - acpx Plugin `close` के बाद OpenClaw-owned wrapper और adapter process trees clean up करता है, और Gateway startup के दौरान stale OpenClaw-owned ACPX orphans को reap करता है।
    - Idle runtime workers `acp.runtime.ttlMinutes` के बाद cleanup के eligible होते हैं; stored session metadata `/acp sessions` के लिए available रहता है।

  </Accordion>
  <Accordion title="Native Codex routing rules">
    Natural-language triggers जिन्हें enabled होने पर **native Codex
    Plugin** को route करना चाहिए:

    - "इस Discord channel को Codex से bind करें।"
    - "इस chat को Codex thread `<id>` से attach करें।"
    - "Codex threads दिखाएं, फिर इसे bind करें।"

    मूल Codex वार्तालाप बाइंडिंग डिफ़ॉल्ट चैट-नियंत्रण पथ है।
    OpenClaw डायनेमिक टूल अभी भी OpenClaw के माध्यम से निष्पादित होते हैं, जबकि
    शेल/apply-patch जैसे Codex-मूल टूल Codex के अंदर निष्पादित होते हैं।
    Codex-मूल टूल इवेंट के लिए, OpenClaw प्रति-टर्न मूल
    हुक रिले इंजेक्ट करता है ताकि plugin हुक `before_tool_call` को ब्लॉक कर सकें,
    `after_tool_call` को देख सकें, और Codex `PermissionRequest` इवेंट को
    OpenClaw अनुमोदनों के माध्यम से रूट कर सकें। Codex `Stop` हुक
    OpenClaw `before_agent_finalize` तक रिले किए जाते हैं, जहाँ plugin Codex के अपना उत्तर
    अंतिम करने से पहले एक और मॉडल पास का अनुरोध कर सकते हैं। रिले जानबूझकर
    रूढ़िवादी रहता है: यह Codex-मूल टूल
    आर्ग्युमेंट को बदलता नहीं है या Codex थ्रेड रिकॉर्ड को फिर से नहीं लिखता है। स्पष्ट ACP का उपयोग केवल
    तब करें जब आप ACP रनटाइम/सेशन मॉडल चाहते हों। एम्बेडेड Codex
    समर्थन सीमा
    [Codex हार्नेस v1 समर्थन अनुबंध](/hi/plugins/codex-harness-runtime#v1-support-contract) में दस्तावेज़ित है।

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - लेगेसी Codex मॉडल रेफ़ - लेगेसी Codex OAuth/सदस्यता मॉडल रूट doctor द्वारा सुधारा गया।
    - `openai/*` - OpenAI एजेंट टर्न के लिए मूल Codex ऐप-सर्वर एम्बेडेड रनटाइम।
    - `/codex ...` - मूल Codex वार्तालाप नियंत्रण।
    - `/acp ...` या `runtime: "acp"` - स्पष्ट ACP/acpx नियंत्रण।

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    वे ट्रिगर जिन्हें ACP रनटाइम पर रूट होना चाहिए:

    - "इसे एक-बारगी Claude Code ACP सेशन के रूप में चलाएँ और परिणाम का सारांश दें।"
    - "इस कार्य के लिए Gemini CLI का उपयोग एक थ्रेड में करें, फिर फ़ॉलो-अप उसी थ्रेड में रखें।"
    - "Codex को ACP के माध्यम से बैकग्राउंड थ्रेड में चलाएँ।"

    OpenClaw `runtime: "acp"` चुनता है, हार्नेस `agentId` को रिज़ॉल्व करता है,
    समर्थित होने पर वर्तमान वार्तालाप या थ्रेड से बाइंड करता है, और
    बंद/समाप्ति तक फ़ॉलो-अप को उस सेशन पर रूट करता है। Codex इस पथ का पालन केवल
    तब करता है जब ACP/acpx स्पष्ट हो या अनुरोधित ऑपरेशन के लिए मूल Codex
    plugin उपलब्ध न हो।

    `sessions_spawn` के लिए, `runtime: "acp"` केवल तब विज्ञापित किया जाता है जब ACP
    सक्षम हो, अनुरोधकर्ता सैंडबॉक्स्ड न हो, और कोई ACP रनटाइम
    बैकएंड लोड हो। `acp.dispatch.enabled=false` स्वचालित
    ACP थ्रेड डिस्पैच को रोकता है, लेकिन स्पष्ट
    `sessions_spawn({ runtime: "acp" })` कॉल को छिपाता या ब्लॉक नहीं करता। यह `codex`,
    `claude`, `droid`, `gemini`, या `opencode` जैसे ACP हार्नेस id को लक्षित करता है। `agents_list` से कोई सामान्य
    OpenClaw कॉन्फ़िग एजेंट id पास न करें, जब तक कि वह एंट्री
    स्पष्ट रूप से `agents.list[].runtime.type="acp"` के साथ कॉन्फ़िग न हो;
    अन्यथा डिफ़ॉल्ट सब-एजेंट रनटाइम का उपयोग करें। जब कोई OpenClaw एजेंट
    `runtime.type="acp"` के साथ कॉन्फ़िग होता है, OpenClaw अंतर्निहित हार्नेस id के रूप में
    `runtime.acp.agent` का उपयोग करता है।

  </Accordion>
</AccordionGroup>

## ACP बनाम सब-एजेंट

जब आप बाहरी हार्नेस रनटाइम चाहते हों, ACP का उपयोग करें। जब `codex`
plugin सक्षम हो, Codex वार्तालाप बाइंडिंग/नियंत्रण के लिए **मूल Codex
ऐप-सर्वर** का उपयोग करें। जब आप OpenClaw-मूल
डेलीगेटेड रन चाहते हों, **सब-एजेंट** का उपयोग करें।

| क्षेत्र          | ACP सेशन                           | सब-एजेंट रन                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| रनटाइम       | ACP बैकएंड plugin (उदाहरण के लिए acpx) | OpenClaw मूल सब-एजेंट रनटाइम  |
| सेशन कुंजी   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| मुख्य कमांड | `/acp ...`                            | `/subagents ...`                   |
| स्पॉन टूल    | `runtime:"acp"` के साथ `sessions_spawn` | `sessions_spawn` (डिफ़ॉल्ट रनटाइम) |

[सब-एजेंट](/hi/tools/subagents) भी देखें।

## ACP Claude Code कैसे चलाता है

ACP के माध्यम से Claude Code के लिए, स्टैक है:

1. OpenClaw ACP सेशन नियंत्रण प्लेन।
2. आधिकारिक `@openclaw/acpx` रनटाइम plugin।
3. Claude ACP एडैप्टर।
4. Claude-पक्ष रनटाइम/सेशन मशीनरी।

ACP Claude ACP नियंत्रणों, सेशन रिज़्यूम,
बैकग्राउंड-टास्क ट्रैकिंग, और वैकल्पिक वार्तालाप/थ्रेड बाइंडिंग वाला एक **हार्नेस सेशन** है।

CLI बैकएंड अलग टेक्स्ट-केवल स्थानीय फ़ॉलबैक रनटाइम हैं - देखें
[CLI बैकएंड](/hi/gateway/cli-backends)।

ऑपरेटरों के लिए, व्यावहारिक नियम है:

- **`/acp spawn`, बाइंड किए जा सकने वाले सेशन, रनटाइम नियंत्रण, या स्थायी हार्नेस कार्य चाहते हैं?** ACP का उपयोग करें।
- **कच्चे CLI के माध्यम से सरल स्थानीय टेक्स्ट फ़ॉलबैक चाहते हैं?** CLI बैकएंड का उपयोग करें।

## बाउंड सेशन

### मानसिक मॉडल

- **चैट सतह** - जहाँ लोग बातचीत जारी रखते हैं (Discord चैनल, Telegram टॉपिक, iMessage चैट)।
- **ACP सेशन** - टिकाऊ Codex/Claude/Gemini रनटाइम स्थिति जिस पर OpenClaw रूट करता है।
- **चाइल्ड थ्रेड/टॉपिक** - केवल `--thread ...` द्वारा बनाई गई वैकल्पिक अतिरिक्त मैसेजिंग सतह।
- **रनटाइम वर्कस्पेस** - फ़ाइलसिस्टम स्थान (`cwd`, रेपो चेकआउट, बैकएंड वर्कस्पेस) जहाँ हार्नेस चलता है। चैट सतह से स्वतंत्र।

### वर्तमान-वार्तालाप बाइंड

`/acp spawn <harness> --bind here` वर्तमान वार्तालाप को
स्पॉन किए गए ACP सेशन से पिन करता है - कोई चाइल्ड थ्रेड नहीं, वही चैट सतह। OpenClaw
ट्रांसपोर्ट, ऑथ, सुरक्षा, और डिलीवरी का स्वामित्व बनाए रखता है। उस
वार्तालाप में फ़ॉलो-अप संदेश उसी सेशन पर रूट होते हैं; `/new` और `/reset`
सेशन को उसी जगह रीसेट करते हैं; `/acp close` बाइंडिंग हटाता है।

उदाहरण:

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
    - `--bind here` और `--thread ...` परस्पर अनन्य हैं।
    - `--bind here` केवल उन चैनलों पर काम करता है जो वर्तमान-वार्तालाप बाइंडिंग विज्ञापित करते हैं; अन्यथा OpenClaw स्पष्ट असमर्थित संदेश लौटाता है। बाइंडिंग Gateway रीस्टार्ट के पार बनी रहती हैं।
    - Discord पर, `spawnSessions` `--thread auto|here` के लिए चाइल्ड थ्रेड निर्माण को गेट करता है - `--bind here` को नहीं।
    - यदि आप `--cwd` के बिना किसी अलग ACP एजेंट पर स्पॉन करते हैं, तो OpenClaw डिफ़ॉल्ट रूप से **लक्ष्य एजेंट का** वर्कस्पेस इनहेरिट करता है। अनुपस्थित इनहेरिट किए गए पथ (`ENOENT`/`ENOTDIR`) बैकएंड डिफ़ॉल्ट पर फ़ॉलबैक करते हैं; अन्य एक्सेस त्रुटियाँ (जैसे `EACCES`) स्पॉन त्रुटियों के रूप में सामने आती हैं।
    - Gateway प्रबंधन कमांड बाउंड वार्तालापों में स्थानीय रहते हैं - `/acp ...` कमांड OpenClaw द्वारा संभाले जाते हैं, भले ही सामान्य फ़ॉलो-अप टेक्स्ट बाउंड ACP सेशन पर रूट हो; `/status` और `/unfocus` भी जब भी उस सतह के लिए कमांड हैंडलिंग सक्षम हो, स्थानीय रहते हैं।

  </Accordion>
  <Accordion title="Thread-bound sessions">
    जब किसी चैनल एडैप्टर के लिए थ्रेड बाइंडिंग सक्षम हों:

    - OpenClaw किसी थ्रेड को लक्ष्य ACP सेशन से बाइंड करता है।
    - उस थ्रेड में फ़ॉलो-अप संदेश बाउंड ACP सेशन पर रूट होते हैं।
    - ACP आउटपुट उसी थ्रेड में वापस डिलीवर किया जाता है।
    - अनफ़ोकस/बंद/आर्काइव/आइडल-टाइमआउट या अधिकतम-आयु समाप्ति बाइंडिंग हटाती है।
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, और `/unfocus` Gateway कमांड हैं, ACP हार्नेस के लिए प्रॉम्प्ट नहीं।

    थ्रेड-बाउंड ACP के लिए आवश्यक फ़ीचर फ़्लैग:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` डिफ़ॉल्ट रूप से चालू है (स्वचालित ACP थ्रेड डिस्पैच रोकने के लिए `false` सेट करें; स्पष्ट `sessions_spawn({ runtime: "acp" })` कॉल अभी भी काम करते हैं)।
    - चैनल-एडैप्टर थ्रेड सेशन स्पॉन सक्षम (डिफ़ॉल्ट: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    थ्रेड बाइंडिंग समर्थन एडैप्टर-विशिष्ट है। यदि सक्रिय चैनल
    एडैप्टर थ्रेड बाइंडिंग का समर्थन नहीं करता, तो OpenClaw स्पष्ट
    असमर्थित/अनुपलब्ध संदेश लौटाता है।

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - कोई भी चैनल एडैप्टर जो सेशन/थ्रेड बाइंडिंग क्षमता उजागर करता है।
    - वर्तमान अंतर्निहित समर्थन: **Discord** थ्रेड/चैनल, **Telegram** टॉपिक (समूहों/सुपरग्रुप में फ़ोरम टॉपिक और DM टॉपिक)।
    - Plugin चैनल उसी बाइंडिंग इंटरफ़ेस के माध्यम से समर्थन जोड़ सकते हैं।

  </Accordion>
</AccordionGroup>

## स्थायी चैनल बाइंडिंग

गैर-क्षणिक वर्कफ़्लो के लिए, शीर्ष-स्तरीय
`bindings[]` एंट्री में स्थायी ACP बाइंडिंग कॉन्फ़िग करें।

### बाइंडिंग मॉडल

<ParamField path="bindings[].type" type='"acp"'>
  स्थायी ACP वार्तालाप बाइंडिंग को चिह्नित करता है।
</ParamField>
<ParamField path="bindings[].match" type="object">
  लक्ष्य वार्तालाप की पहचान करता है। प्रति-चैनल आकार:

- **Discord चैनल/थ्रेड:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack चैनल/DM:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`। स्थिर Slack ids को प्राथमिकता दें; चैनल बाइंडिंग उस चैनल के थ्रेड के अंदर जवाबों से भी मेल खाती हैं।
- **Telegram फ़ोरम टॉपिक:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/समूह:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`। सीधे चैट के लिए `+15555550123` जैसे E.164 नंबर और समूहों के लिए `120363424282127706@g.us` जैसे WhatsApp समूह JID उपयोग करें।
- **iMessage DM/समूह:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`। स्थिर समूह बाइंडिंग के लिए `chat_id:*` को प्राथमिकता दें।

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  स्वामी OpenClaw एजेंट id।
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  वैकल्पिक ACP ओवरराइड।
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  वैकल्पिक ऑपरेटर-समक्ष लेबल।
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  वैकल्पिक रनटाइम कार्यशील डायरेक्टरी।
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  वैकल्पिक बैकएंड ओवरराइड।
</ParamField>

### प्रति एजेंट रनटाइम डिफ़ॉल्ट

प्रति एजेंट एक बार ACP डिफ़ॉल्ट परिभाषित करने के लिए `agents.list[].runtime` का उपयोग करें:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (हार्नेस id, जैसे `codex` या `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP बाउंड सेशन के लिए ओवरराइड प्राथमिकता:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. वैश्विक ACP डिफ़ॉल्ट (जैसे `acp.backend`)

### उदाहरण

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

- OpenClaw चैनल-विशिष्ट प्रवेश के बाद और उपयोग से पहले सुनिश्चित करता है कि कॉन्फ़िगर किया गया ACP सेशन मौजूद है।
- उस चैनल, टॉपिक या चैट के संदेश कॉन्फ़िगर किए गए ACP सेशन पर रूट होते हैं।
- कॉन्फ़िगर की गई ACP bindings अपने सेशन रूट की मालिक होती हैं। चैनल broadcast fan-out मिलान वाली binding के लिए कॉन्फ़िगर किए गए ACP सेशन को प्रतिस्थापित नहीं करता।
- बाउंड बातचीत में, `/new` और `/reset` उसी ACP सेशन कुंजी को उसी स्थान पर रीसेट करते हैं।
- अस्थायी runtime bindings (उदाहरण के लिए thread-focus flows द्वारा बनाई गई) मौजूद होने पर अब भी लागू होती हैं।
- स्पष्ट `cwd` के बिना cross-agent ACP spawns के लिए, OpenClaw agent config से target agent workspace इनहेरिट करता है।
- गुम inherited workspace paths backend default cwd पर fallback करते हैं; गैर-गुम access failures spawn errors के रूप में सामने आते हैं।

## ACP सेशन शुरू करें

ACP सेशन शुरू करने के दो तरीके:

<Tabs>
  <Tab title="From sessions_spawn">
    agent turn या tool call से ACP सेशन शुरू करने के लिए `runtime: "acp"` का उपयोग करें।

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
    `runtime` का default `subagent` है, इसलिए ACP सेशन के लिए `runtime: "acp"` स्पष्ट रूप से सेट करें। यदि `agentId` छोड़ा गया है, तो कॉन्फ़िगर होने पर OpenClaw `acp.defaultAgent` का उपयोग करता है। `mode: "session"` को persistent bound conversation बनाए रखने के लिए `thread: true` चाहिए।
    </Note>

  </Tab>
  <Tab title="From /acp command">
    चैट से स्पष्ट ऑपरेटर नियंत्रण के लिए `/acp spawn` का उपयोग करें।

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    मुख्य flags:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    [Slash commands](/hi/tools/slash-commands) देखें।

  </Tab>
</Tabs>

### `sessions_spawn` पैरामीटर

<ParamField path="task" type="string" required>
  ACP सेशन को भेजा गया प्रारंभिक prompt।
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP सेशन के लिए `"acp"` होना चाहिए।
</ParamField>
<ParamField path="agentId" type="string">
  ACP target harness id। सेट होने पर `acp.defaultAgent` पर fallback करता है।
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  जहां समर्थित हो, thread binding flow का अनुरोध करें।
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` one-shot है; `"session"` persistent है। यदि `thread: true` है और
  `mode` छोड़ा गया है, तो OpenClaw runtime path के अनुसार persistent behaviour को default कर सकता है। `mode: "session"` को `thread: true` चाहिए।
</ParamField>
<ParamField path="cwd" type="string">
  अनुरोधित runtime working directory (backend/runtime policy द्वारा validate की गई)। यदि छोड़ा गया है, तो ACP spawn कॉन्फ़िगर होने पर target agent workspace इनहेरिट करता है; गुम inherited paths backend defaults पर fallback करते हैं, जबकि वास्तविक access errors लौटाए जाते हैं।
</ParamField>
<ParamField path="label" type="string">
  सेशन/banner text में उपयोग होने वाला operator-facing label।
</ParamField>
<ParamField path="resumeSessionId" type="string">
  नया बनाने के बजाय मौजूदा ACP सेशन resume करें। agent अपनी conversation history को `session/load` के माध्यम से replay करता है। `runtime: "acp"` आवश्यक है।
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` प्रारंभिक ACP run progress summaries को system events के रूप में requester session पर वापस stream करता है। स्वीकृत responses में session-scoped JSONL log की ओर इशारा करने वाला `streamLogPath` शामिल है
  (`<sessionId>.acp-stream.jsonl`) जिसे आप पूर्ण relay history के लिए tail कर सकते हैं।
  Parent progress streams default रूप से assistant commentary और ACP status progress दिखाते हैं, जब तक `streaming.progress.commentary=false` न हो। जब कोई stream mode कॉन्फ़िगर नहीं होता, तो Discord भी parent previews को default रूप से progress mode में रखता है। Status progress अब भी `acp.stream.tagVisibility` का पालन करता है, इसलिए `plan` जैसे tags स्पष्ट रूप से enabled न होने तक छिपे रहते हैं।
</ParamField>

ACP `sessions_spawn` runs अपने default child turn limit के लिए `agents.defaults.subagents.runTimeoutSeconds` का उपयोग करते हैं। tool per-call timeout overrides स्वीकार नहीं करता।

<ParamField path="model" type="string">
  ACP child session के लिए स्पष्ट model override। Codex ACP spawns `openai/gpt-5.4` जैसे OpenAI refs को `session/new` से पहले Codex ACP startup config में normalize करते हैं; `openai/gpt-5.4/high` जैसे slash forms Codex ACP reasoning effort भी सेट करते हैं।
  छोड़े जाने पर, `sessions_spawn({ runtime: "acp" })` कॉन्फ़िगर होने पर मौजूदा subagent model defaults (`agents.defaults.subagents.model` या
  `agents.list[].subagents.model`) का उपयोग करता है; अन्यथा यह ACP harness को अपना default model उपयोग करने देता है।
  अन्य harnesses को ACP `models` advertise करने और `session/set_model` support करने होंगे; अन्यथा OpenClaw/acpx target agent default पर चुपचाप fallback करने के बजाय स्पष्ट रूप से fail करता है।
</ParamField>
<ParamField path="thinking" type="string">
  स्पष्ट thinking/reasoning effort। Codex ACP के लिए, `minimal` low effort पर map होता है, `low`/`medium`/`high`/`xhigh` सीधे map होते हैं, और `off` reasoning-effort startup override को छोड़ देता है।
  छोड़े जाने पर, ACP spawns selected model के लिए मौजूदा subagent thinking defaults और per-model `agents.defaults.models["provider/model"].params.thinking` का उपयोग करते हैं।
</ParamField>

## Spawn bind और thread modes

<Tabs>
  <Tab title="--bind here|off">
    | Mode   | व्यवहार                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | वर्तमान active conversation को उसी स्थान पर bind करें; कोई active न हो तो fail करें। |
    | `off`  | current-conversation binding न बनाएं।                          |

    नोट्स:

    - `--bind here` "इस channel या chat को Codex-backed बनाएं" के लिए सबसे सरल operator path है।
    - `--bind here` child thread नहीं बनाता।
    - `--bind here` केवल उन channels पर उपलब्ध है जो current-conversation binding support expose करते हैं।
    - `--bind` और `--thread` को एक ही `/acp spawn` call में combine नहीं किया जा सकता।

  </Tab>
  <Tab title="--thread auto|here|off">
    | Mode   | व्यवहार                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | active thread में: उस thread को bind करें। thread के बाहर: supported होने पर child thread create/bind करें। |
    | `here` | current active thread आवश्यक है; उसमें न होने पर fail करें।                                                  |
    | `off`  | कोई binding नहीं। Session unbound शुरू होता है।                                                                 |

    नोट्स:

    - non-thread binding surfaces पर, default behavior प्रभावी रूप से `off` है।
    - Thread-bound spawn को channel policy support चाहिए:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - जब आप child thread बनाए बिना current conversation को pin करना चाहते हैं, तो `--bind here` का उपयोग करें।

  </Tab>
</Tabs>

## डिलीवरी मॉडल

ACP सेशन या तो interactive workspaces हो सकते हैं या parent-owned background work। delivery path उस shape पर निर्भर करता है।

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Interactive sessions का उद्देश्य visible chat surface पर बातचीत जारी रखना है:

    - `/acp spawn ... --bind here` current conversation को ACP session से bind करता है।
    - `/acp spawn ... --thread ...` channel thread/topic को ACP session से bind करता है।
    - Persistent configured `bindings[].type="acp"` matching conversations को उसी ACP session पर route करते हैं।

    bound conversation में follow-up messages सीधे ACP session पर route होते हैं, और ACP output उसी channel/thread/topic पर वापस deliver होता है।

    OpenClaw harness को क्या भेजता है:

    - सामान्य bound follow-ups prompt text के रूप में भेजे जाते हैं, साथ में attachments केवल तब जब harness/backend उनका support करता है।
    - `/acp` management commands और local Gateway commands ACP dispatch से पहले intercept किए जाते हैं।
    - Runtime-generated completion events per target materialize किए जाते हैं। OpenClaw agents को OpenClaw का internal runtime-context envelope मिलता है; external ACP harnesses को child result और instruction के साथ plain prompt मिलता है। raw `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope को external harnesses पर कभी नहीं भेजना चाहिए या ACP user transcript text के रूप में persist नहीं करना चाहिए।
    - ACP transcript entries user-visible trigger text या plain completion prompt का उपयोग करती हैं। Internal event metadata जहां संभव हो OpenClaw में structured रहता है और user-authored chat content के रूप में treat नहीं किया जाता।

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    दूसरे agent run द्वारा spawned one-shot ACP sessions, sub-agents की तरह, background children होते हैं:

    - parent `sessions_spawn({ runtime: "acp", mode: "run" })` के साथ work मांगता है।
    - child अपने ACP harness session में चलता है।
    - Child turns native sub-agent spawns द्वारा उपयोग की जाने वाली उसी background lane पर चलते हैं, इसलिए धीमा ACP harness unrelated main-session work को block नहीं करता।
    - Completion task-completion announce path के माध्यम से वापस report होती है। OpenClaw internal completion metadata को external harness पर भेजने से पहले plain ACP prompt में convert करता है, इसलिए harnesses OpenClaw-only runtime context markers नहीं देखते।
    - user-facing reply उपयोगी होने पर parent child result को normal assistant voice में rewrite करता है।

    इस path को parent और child के बीच peer-to-peer chat के रूप में **न** मानें। child के पास parent तक वापस completion channel पहले से है।

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` spawn के बाद किसी अन्य session को target कर सकता है। सामान्य peer sessions के लिए, OpenClaw message inject करने के बाद agent-to-agent (A2A) follow-up path का उपयोग करता है:

    - target session के reply की प्रतीक्षा करें।
    - वैकल्पिक रूप से requester और target को follow-up turns की bounded number exchange करने दें।
    - target से announce message produce करने को कहें।
    - उस announce को visible channel या thread पर deliver करें।

    वह A2A path peer sends के लिए fallback है जहां sender को visible follow-up चाहिए। यह तब enabled रहता है जब unrelated session ACP target को देख और message कर सकता है, उदाहरण के लिए व्यापक `tools.sessions.visibility` settings के अंतर्गत।

    OpenClaw A2A फ़ॉलो-अप को केवल तब छोड़ता है जब अनुरोधकर्ता अपने
    ही पैरेंट-स्वामित्व वाले वन-शॉट ACP चाइल्ड का पैरेंट हो। उस स्थिति में,
    टास्क पूरा होने के ऊपर A2A चलाने से पैरेंट चाइल्ड के परिणाम के साथ जाग सकता है,
    पैरेंट का उत्तर वापस चाइल्ड में फ़ॉरवर्ड हो सकता है, और
    पैरेंट/चाइल्ड इको लूप बन सकता है। `sessions_send` परिणाम
    उस स्वामित्व वाले-चाइल्ड मामले के लिए `delivery.status="skipped"` रिपोर्ट करता है क्योंकि
    completion path पहले से ही परिणाम के लिए जिम्मेदार है।

  </Accordion>
  <Accordion title="मौजूदा सत्र फिर से शुरू करें">
    नए सिरे से शुरू करने के बजाय पिछले ACP सत्र को जारी रखने के लिए
    `resumeSessionId` का उपयोग करें। एजेंट अपना बातचीत इतिहास
    `session/load` के ज़रिए फिर से चलाता है, इसलिए वह पहले हुई बातों के पूरे संदर्भ के साथ आगे बढ़ता है।

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    सामान्य उपयोग मामले:

    - अपने लैपटॉप से फ़ोन पर Codex सत्र सौंपें - अपने एजेंट से कहें कि जहाँ आपने छोड़ा था, वहीं से आगे बढ़े।
    - CLI में इंटरैक्टिव रूप से शुरू किए गए कोडिंग सत्र को अब अपने एजेंट के ज़रिए हेडलेस रूप से जारी रखें।
    - Gateway रीस्टार्ट या निष्क्रियता टाइमआउट से बाधित हुए काम को फिर से शुरू करें।

    नोट्स:

    - `resumeSessionId` केवल तब लागू होता है जब `runtime: "acp"` हो; डिफ़ॉल्ट सब-एजेंट रनटाइम इस केवल-ACP फ़ील्ड को अनदेखा करता है।
    - `streamTo` केवल तब लागू होता है जब `runtime: "acp"` हो; डिफ़ॉल्ट सब-एजेंट रनटाइम इस केवल-ACP फ़ील्ड को अनदेखा करता है।
    - `resumeSessionId` एक होस्ट-लोकल ACP/हार्नेस रिज़्यूम id है, OpenClaw चैनल सत्र कुंजी नहीं; OpenClaw डिस्पैच से पहले अब भी ACP स्पॉन नीति और लक्ष्य एजेंट नीति जाँचता है, जबकि ACP बैकएंड या हार्नेस उस अपस्ट्रीम id को लोड करने के प्राधिकरण का स्वामी होता है।
    - `resumeSessionId` अपस्ट्रीम ACP बातचीत इतिहास को पुनर्स्थापित करता है; `thread` और `mode` आपके बनाए जा रहे नए OpenClaw सत्र पर अब भी सामान्य रूप से लागू होते हैं, इसलिए `mode: "session"` के लिए अब भी `thread: true` आवश्यक है।
    - लक्ष्य एजेंट को `session/load` का समर्थन करना चाहिए (Codex और Claude Code करते हैं)।
    - यदि सत्र id नहीं मिलता है, तो स्पॉन स्पष्ट त्रुटि के साथ विफल होता है - नए सत्र पर कोई मौन फ़ॉलबैक नहीं होता।

  </Accordion>
  <Accordion title="परिनियोजन के बाद स्मोक टेस्ट">
    Gateway परिनियोजन के बाद, यूनिट टेस्ट पर भरोसा करने के बजाय
    लाइव एंड-टू-एंड जाँच चलाएँ:

    1. लक्ष्य होस्ट पर परिनियोजित Gateway संस्करण और कमिट सत्यापित करें।
    2. किसी लाइव एजेंट के लिए अस्थायी ACPX ब्रिज सत्र खोलें।
    3. उस एजेंट से `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, और टास्क `Reply with exactly LIVE-ACP-SPAWN-OK` के साथ `sessions_spawn` कॉल करने को कहें।
    4. `accepted=yes`, वास्तविक `childSessionKey`, और कोई वैलिडेटर त्रुटि न होना सत्यापित करें।
    5. अस्थायी ब्रिज सत्र साफ़ करें।

    गेट को `mode: "run"` पर रखें और `streamTo: "parent"` छोड़ दें -
    थ्रेड-बाउंड `mode: "session"` और स्ट्रीम-रिले पथ अलग
    अधिक समृद्ध इंटीग्रेशन पास हैं।

  </Accordion>
</AccordionGroup>

## सैंडबॉक्स संगतता

ACP सत्र वर्तमान में होस्ट रनटाइम पर चलते हैं, OpenClaw सैंडबॉक्स के
अंदर **नहीं**।

<Warning>
**सुरक्षा सीमा:**

- बाहरी हार्नेस अपनी CLI अनुमतियों और चुने गए `cwd` के अनुसार पढ़/लिख सकता है।
- OpenClaw की सैंडबॉक्स नीति ACP हार्नेस निष्पादन को **नहीं** लपेटती।
- OpenClaw अब भी ACP फ़ीचर गेट, अनुमत एजेंट, सत्र स्वामित्व, चैनल बाइंडिंग, और Gateway डिलीवरी नीति लागू करता है।
- सैंडबॉक्स-लागू OpenClaw-नेटिव काम के लिए `runtime: "subagent"` का उपयोग करें।

</Warning>

वर्तमान सीमाएँ:

- यदि अनुरोधकर्ता सत्र सैंडबॉक्स्ड है, तो ACP स्पॉन `sessions_spawn({ runtime: "acp" })` और `/acp spawn` दोनों के लिए ब्लॉक होते हैं।
- `runtime: "acp"` के साथ `sessions_spawn`, `sandbox: "require"` का समर्थन नहीं करता।

## सत्र लक्ष्य समाधान

अधिकांश `/acp` कार्रवाइयाँ वैकल्पिक सत्र लक्ष्य (`session-key`,
`session-id`, या `session-label`) स्वीकार करती हैं।

**समाधान क्रम:**

1. स्पष्ट लक्ष्य आर्ग्युमेंट (या `/acp steer` के लिए `--session`)
   - कुंजी आज़माता है
   - फिर UUID-आकार का सत्र id
   - फिर लेबल
2. वर्तमान थ्रेड बाइंडिंग (यदि यह बातचीत/थ्रेड किसी ACP सत्र से बंधा है)।
3. वर्तमान अनुरोधकर्ता सत्र फ़ॉलबैक।

वर्तमान-बातचीत बाइंडिंग और थ्रेड बाइंडिंग दोनों
चरण 2 में भाग लेते हैं।

यदि कोई लक्ष्य हल नहीं होता, तो OpenClaw स्पष्ट त्रुटि लौटाता है
(`Unable to resolve session target: ...`)।

## ACP नियंत्रण

| कमांड              | यह क्या करता है                                              | उदाहरण                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | ACP सत्र बनाएँ; वैकल्पिक वर्तमान बाइंड या थ्रेड बाइंड। | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | लक्ष्य सत्र के लिए चल रहा टर्न रद्द करें।                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | चल रहे सत्र को steer निर्देश भेजें।                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | सत्र बंद करें और थ्रेड लक्ष्यों को अनबाइंड करें।                  | `/acp close`                                                  |
| `/acp status`        | बैकएंड, मोड, स्थिति, रनटाइम विकल्प, क्षमताएँ दिखाएँ। | `/acp status`                                                 |
| `/acp set-mode`      | लक्ष्य सत्र के लिए रनटाइम मोड सेट करें।                      | `/acp set-mode plan`                                          |
| `/acp set`           | सामान्य रनटाइम कॉन्फ़िग विकल्प लिखें।                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | रनटाइम कार्यशील डायरेक्टरी ओवरराइड सेट करें।                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | अनुमोदन नीति प्रोफ़ाइल सेट करें।                              | `/acp permissions strict`                                     |
| `/acp timeout`       | रनटाइम टाइमआउट (सेकंड) सेट करें।                            | `/acp timeout 120`                                            |
| `/acp model`         | रनटाइम मॉडल ओवरराइड सेट करें।                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | सत्र रनटाइम विकल्प ओवरराइड हटाएँ।                  | `/acp reset-options`                                          |
| `/acp sessions`      | स्टोर से हाल के ACP सत्र सूचीबद्ध करें।                      | `/acp sessions`                                               |
| `/acp doctor`        | बैकएंड स्वास्थ्य, क्षमताएँ, कार्रवाई योग्य सुधार।           | `/acp doctor`                                                 |
| `/acp install`       | निर्धारक इंस्टॉल और सक्षम करने के चरण प्रिंट करें।             | `/acp install`                                                |

`/acp status` प्रभावी रनटाइम विकल्पों के साथ रनटाइम-स्तर और
बैकएंड-स्तर सत्र पहचानकर्ता दिखाता है। जब किसी बैकएंड में क्षमता नहीं होती,
तो असमर्थित-नियंत्रण त्रुटियाँ स्पष्ट रूप से सामने आती हैं। `/acp sessions`
वर्तमान बाउंड या अनुरोधकर्ता सत्र के लिए स्टोर पढ़ता है; लक्ष्य टोकन
(`session-key`, `session-id`, या `session-label`) Gateway सत्र खोज के ज़रिए
हल होते हैं, जिसमें कस्टम प्रति-एजेंट `session.store`
रूट शामिल हैं।

### रनटाइम विकल्प मैपिंग

`/acp` में सुविधा कमांड और एक सामान्य सेटर है। समतुल्य
ऑपरेशन:

| कमांड                      | इससे मैप होता है                              | नोट्स                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | रनटाइम कॉन्फ़िग कुंजी `model`           | Codex ACP के लिए, OpenClaw `openai/<model>` को एडेप्टर मॉडल id में सामान्यीकृत करता है और `openai/gpt-5.4/high` जैसे स्लैश reasoning प्रत्ययों को `reasoning_effort` से मैप करता है।                                         |
| `/acp set thinking <level>`  | canonical विकल्प `thinking`          | OpenClaw मौजूद होने पर बैकएंड-विज्ञापित समतुल्य भेजता है, `thinking`, फिर `effort`, `reasoning_effort`, या `thought_level` को प्राथमिकता देता है। Codex ACP के लिए, एडेप्टर मानों को `reasoning_effort` से मैप करता है। |
| `/acp permissions <profile>` | canonical विकल्प `permissionProfile` | OpenClaw मौजूद होने पर बैकएंड-विज्ञापित समतुल्य भेजता है, जैसे `approval_policy`, `permission_profile`, `permissions`, या `permission_mode`।                                                       |
| `/acp timeout <seconds>`     | canonical विकल्प `timeoutSeconds`    | OpenClaw मौजूद होने पर बैकएंड-विज्ञापित समतुल्य भेजता है, जैसे `timeout` या `timeout_seconds`।                                                                                                     |
| `/acp cwd <path>`            | रनटाइम cwd ओवरराइड                 | सीधा अपडेट।                                                                                                                                                                                             |
| `/acp set <key> <value>`     | सामान्य                              | `key=cwd` cwd ओवरराइड पथ का उपयोग करता है।                                                                                                                                                                      |
| `/acp reset-options`         | सभी रनटाइम ओवरराइड साफ़ करता है         | -                                                                                                                                                                                                          |

## acpx हार्नेस, Plugin सेटअप, और अनुमतियाँ

acpx हार्नेस कॉन्फ़िगरेशन (Claude Code / Codex / Gemini CLI
उपनाम), plugin-tools और OpenClaw-tools MCP ब्रिज, और ACP
अनुमति मोड के लिए, देखें
[ACP एजेंट - सेटअप](/hi/tools/acp-agents-setup).

## समस्या निवारण

| लक्षण                                                                       | संभावित कारण                                                                                                           | सुधार                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | बैकएंड Plugin अनुपस्थित, अक्षम है, या `plugins.allow` से अवरुद्ध है।                                                       | बैकएंड Plugin इंस्टॉल और सक्षम करें, जब वह allowlist सेट हो तो `plugins.allow` में `acpx` शामिल करें, फिर `/acp doctor` चलाएँ।                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP वैश्विक रूप से अक्षम है।                                                                                                 | `acp.enabled=true` सेट करें।                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | सामान्य थ्रेड संदेशों से स्वचालित डिस्पैच अक्षम है।                                                               | स्वचालित थ्रेड रूटिंग फिर से शुरू करने के लिए `acp.dispatch.enabled=true` सेट करें; स्पष्ट `sessions_spawn({ runtime: "acp" })` कॉल अब भी काम करती हैं।                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | एजेंट allowlist में नहीं है।                                                                                                | अनुमत `agentId` का उपयोग करें या `acp.allowedAgents` अपडेट करें।                                                                                                                     |
| `/acp doctor` रिपोर्ट करता है कि बैकएंड स्टार्टअप के तुरंत बाद तैयार नहीं है                 | बैकएंड Plugin अनुपस्थित है, अक्षम है, allow/deny नीति से अवरुद्ध है, या उसका कॉन्फ़िगर किया गया executable उपलब्ध नहीं है।        | बैकएंड Plugin इंस्टॉल/सक्षम करें, `/acp doctor` फिर से चलाएँ, और अगर वह अस्वस्थ रहता है तो बैकएंड इंस्टॉल या नीति त्रुटि की जाँच करें।                                           |
| हार्नेस कमांड नहीं मिला                                                   | Adapter CLI इंस्टॉल नहीं है, बाहरी Plugin अनुपस्थित है, या non-Codex adapter के लिए पहली बार का `npx` fetch विफल हुआ। | `/acp doctor` चलाएँ, Gateway होस्ट पर adapter इंस्टॉल/prewarm करें, या acpx एजेंट कमांड स्पष्ट रूप से कॉन्फ़िगर करें।                                                      |
| हार्नेस से model-not-found                                            | मॉडल id किसी अन्य provider/हार्नेस के लिए मान्य है, लेकिन इस ACP लक्ष्य के लिए नहीं।                                                | उस हार्नेस द्वारा सूचीबद्ध मॉडल का उपयोग करें, हार्नेस में मॉडल कॉन्फ़िगर करें, या override छोड़ दें।                                                                            |
| हार्नेस से vendor auth त्रुटि                                          | OpenClaw स्वस्थ है, लेकिन लक्ष्य CLI/provider लॉग इन नहीं है।                                                     | Gateway होस्ट environment पर लॉग इन करें या आवश्यक provider key दें।                                                                                             |
| `Unable to resolve session target: ...`                                     | खराब key/id/label token।                                                                                                | `/acp sessions` चलाएँ, सटीक key/label कॉपी करें, फिर से प्रयास करें।                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` का उपयोग सक्रिय bindable conversation के बिना किया गया।                                                            | लक्ष्य chat/channel पर जाएँ और फिर से प्रयास करें, या unbound spawn का उपयोग करें।                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter में current-conversation ACP binding क्षमता नहीं है।                                                             | जहाँ समर्थित हो वहाँ `/acp spawn ... --thread ...` का उपयोग करें, top-level `bindings[]` कॉन्फ़िगर करें, या समर्थित channel पर जाएँ।                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` का उपयोग thread context के बाहर किया गया।                                                                         | लक्ष्य thread पर जाएँ या `--thread auto`/`off` का उपयोग करें।                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | कोई दूसरा user सक्रिय binding target का owner है।                                                                           | Owner के रूप में rebind करें या अलग conversation या thread का उपयोग करें।                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter में thread binding क्षमता नहीं है।                                                                               | `--thread off` का उपयोग करें या समर्थित adapter/channel पर जाएँ।                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime होस्ट-साइड है; requester session sandboxed है।                                                              | sandboxed sessions से `runtime="subagent"` का उपयोग करें, या non-sandboxed session से ACP spawn चलाएँ।                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP runtime के लिए `sandbox="require"` अनुरोधित किया गया।                                                                         | आवश्यक sandboxing के लिए `runtime="subagent"` का उपयोग करें, या non-sandboxed session से `sandbox="inherit"` के साथ ACP का उपयोग करें।                                                      |
| `Cannot apply --model ... did not advertise model support`                  | लक्ष्य हार्नेस generic ACP model switching उजागर नहीं करता।                                                        | ऐसा हार्नेस उपयोग करें जो ACP `models`/`session/set_model` advertise करता हो, Codex ACP model refs उपयोग करें, या अगर उसका अपना startup flag है तो मॉडल सीधे हार्नेस में कॉन्फ़िगर करें। |
| bound session के लिए ACP metadata अनुपस्थित                                      | पुराना/हटाया गया ACP session metadata।                                                                                    | `/acp spawn` से फिर से बनाएँ, फिर thread को rebind/focus करें।                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` non-interactive ACP session में writes/exec को अवरुद्ध करता है।                                                    | `plugins.entries.acpx.config.permissionMode` को `approve-all` पर सेट करें और gateway restart करें। [अनुमति कॉन्फ़िगरेशन](/hi/tools/acp-agents-setup#permission-configuration) देखें। |
| ACP session कम output के साथ जल्दी विफल हो जाता है                                  | Permission prompts `permissionMode`/`nonInteractivePermissions` से अवरुद्ध हैं।                                        | `AcpRuntimeError` के लिए gateway logs देखें। पूर्ण permissions के लिए, `permissionMode=approve-all` सेट करें; graceful degradation के लिए, `nonInteractivePermissions=deny` सेट करें।        |
| ACP session काम पूरा करने के बाद अनिश्चितकाल तक अटका रहता है                       | हार्नेस process समाप्त हो गया लेकिन ACP session ने completion रिपोर्ट नहीं की।                                                    | OpenClaw अपडेट करें; वर्तमान acpx cleanup close और Gateway startup पर OpenClaw-owned stale wrapper और adapter processes को reap करता है।                                             |
| हार्नेस `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` देखता है                        | आंतरिक event envelope ACP boundary के पार leak हो गया।                                                                | OpenClaw अपडेट करें और completion flow फिर से चलाएँ; बाहरी harnesses को केवल plain completion prompts मिलने चाहिए।                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable`
native Codex hook relay से संबंधित है, ACP/acpx से नहीं। Bound Codex chat में, `/new` या `/reset` से नई
session शुरू करें; अगर यह एक बार काम करता है और फिर अगली native tool call पर लौट आता है, तो
`/new` दोहराने के बजाय Codex app-server या OpenClaw Gateway restart करें। [Codex हार्नेस troubleshooting](/hi/plugins/codex-harness#troubleshooting) देखें।
</Note>

## संबंधित

- [ACP agents - setup](/hi/tools/acp-agents-setup)
- [Agent भेजना](/hi/tools/agent-send)
- [CLI बैकएंड](/hi/gateway/cli-backends)
- [Codex हार्नेस](/hi/plugins/codex-harness)
- [Codex हार्नेस runtime](/hi/plugins/codex-harness-runtime)
- [बहु-एजेंट सैंडबॉक्स टूल](/hi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (bridge mode)](/hi/cli/acp)
- [उप-एजेंट](/hi/tools/subagents)
