---
read_when:
    - आप चाहते हैं कि Codex-mode OpenClaw एजेंट Codex Computer Use का उपयोग करें
    - आप Codex Computer Use, PeekabooBridge, और प्रत्यक्ष cua-driver MCP के बीच चयन कर रहे हैं
    - आप Codex Computer Use और प्रत्यक्ष cua-driver MCP सेटअप के बीच निर्णय ले रहे हैं
    - आप बंडल किए गए Codex Plugin के लिए computerUse कॉन्फ़िगर कर रहे हैं
    - आप /codex computer-use स्थिति या इंस्टॉल की समस्या निवारण कर रहे हैं
summary: Codex-मोड OpenClaw एजेंटों के लिए Codex Computer Use सेट अप करें
title: Codex कंप्यूटर उपयोग
x-i18n:
    generated_at: "2026-06-30T14:03:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use स्थानीय डेस्कटॉप नियंत्रण के लिए Codex-native MCP Plugin है। OpenClaw
डेस्कटॉप ऐप को vendor नहीं करता, स्वयं डेस्कटॉप actions निष्पादित नहीं करता, या
Codex अनुमतियों को bypass नहीं करता। bundled `codex` Plugin केवल Codex app-server तैयार करता है:
यह Codex Plugin support सक्षम करता है, configured Codex
Computer Use Plugin को ढूंढता या install करता है, जांचता है कि `computer-use` MCP server उपलब्ध है, और
फिर Codex-mode turns के दौरान native MCP tool calls का स्वामित्व Codex को देता है।

इस पृष्ठ का उपयोग तब करें जब OpenClaw पहले से native Codex harness का उपयोग कर रहा हो। स्वयं
runtime setup के लिए, [Codex harness](/hi/plugins/codex-harness) देखें।

## OpenClaw.app और Peekaboo

OpenClaw.app का Peekaboo integration Codex Computer Use से अलग है। macOS
app एक PeekabooBridge socket host कर सकता है ताकि `peekaboo` CLI, Peekaboo के अपने
automation tools के लिए app की स्थानीय Accessibility और Screen Recording grants का पुनः उपयोग कर सके।
वह bridge Codex Computer Use को install या proxy नहीं करता, और
Codex Computer Use PeekabooBridge socket के माध्यम से call नहीं करता।

जब आप चाहते हैं कि OpenClaw.app Peekaboo CLI automation के लिए
permission-aware host बने, तो [Peekaboo bridge](/hi/platforms/mac/peekaboo) का उपयोग करें। इस पृष्ठ का उपयोग तब करें जब किसी
Codex-mode OpenClaw agent के लिए turn शुरू होने से पहले Codex का native `computer-use` MCP Plugin
उपलब्ध होना चाहिए।

## iOS app

iOS app Codex Computer Use से अलग है। यह Codex `computer-use` MCP server को
install या proxy नहीं करता और यह desktop-control backend नहीं है।
इसके बजाय, iOS app OpenClaw node के रूप में connect करता है और `canvas.*`, `camera.*`, `screen.*`,
`location.*`, और `talk.*` जैसे node commands के माध्यम से mobile
capabilities expose करता है।

जब आप चाहते हैं कि कोई agent gateway के माध्यम से iPhone node चलाए, तो
[iOS](/hi/platforms/ios) का उपयोग करें। इस पृष्ठ का उपयोग तब करें जब Codex-mode agent को Codex के native Computer Use Plugin के माध्यम से स्थानीय
macOS desktop नियंत्रित करना चाहिए।

## Direct cua-driver MCP

Codex Computer Use desktop control expose करने का एकमात्र तरीका नहीं है। यदि आप चाहते हैं कि
OpenClaw-managed runtimes TryCua के driver को सीधे call करें, तो
Codex-specific marketplace flow के बजाय OpenClaw की MCP registry के माध्यम से upstream
`cua-driver mcp` server का उपयोग करें।

`cua-driver` install करने के बाद, या तो उससे OpenClaw command मांगें:

```bash
cua-driver mcp-config --client openclaw
```

या stdio server स्वयं register करें:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

वह path upstream MCP tool surface को intact रखता है, जिसमें driver
schemas और structured MCP responses शामिल हैं। इसका उपयोग तब करें जब आप CUA driver को
सामान्य OpenClaw MCP server के रूप में उपलब्ध चाहते हैं। इस पृष्ठ पर Codex Computer Use setup का उपयोग तब करें जब
Codex app-server को Plugin installation, MCP reloads,
और Codex-mode turns के भीतर native tool calls का स्वामित्व रखना चाहिए।

CUA का driver macOS-specific है और अब भी स्थानीय macOS permissions की आवश्यकता रखता है
जिनके लिए उसका app prompt करता है, जैसे Accessibility और Screen Recording। OpenClaw
`cua-driver` install नहीं करता, वे permissions grant नहीं करता, या upstream
driver के safety model को bypass नहीं करता।

## Quick setup

जब Codex-mode turns में thread शुरू होने से पहले Computer Use उपलब्ध होना आवश्यक हो, तब
`plugins.entries.codex.config.computerUse` set करें। `autoInstall: true`
Computer Use को opt in करता है और OpenClaw को turn से पहले इसे install या re-enable करने देता है:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
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

इस config के साथ, OpenClaw प्रत्येक Codex-mode turn से पहले Codex app-server जांचता है।
यदि Computer Use missing है लेकिन Codex app-server ने पहले ही installable marketplace discover कर लिया है, तो
OpenClaw Codex app-server से Plugin install या re-enable करने और MCP servers reload करने को कहता है।
macOS पर, जब कोई matching marketplace registered नहीं है
और standard Codex app bundle मौजूद है, तो OpenClaw fail होने से पहले
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` से bundled Codex marketplace register करने का भी प्रयास करता है।
यदि setup फिर भी MCP server उपलब्ध नहीं करा पाता, तो turn
thread शुरू होने से पहले fail हो जाता है।

Computer Use config बदलने के बाद, यदि कोई existing Codex thread पहले ही शुरू हो चुका है, तो testing से पहले affected chat में `/new` या `/reset` का उपयोग करें।

macOS managed stdio startup पर, OpenClaw signed desktop Codex app
bundle को `/Applications/Codex.app/Contents/Resources/codex` पर prefer करता है जब यह मौजूद हो।
यह Computer Use को उस app bundle के अधीन रखता है जो स्थानीय desktop-control
permissions का स्वामी है। यदि desktop app installed नहीं है, तो OpenClaw Plugin के पास installed
managed Codex binary पर fallback करता है। यदि कोई installed desktop app
unsupported app-server version के साथ initialize करता है, तो OpenClaw उस child को close करता है
और stale desktop app को plugin-local fallback shadow करने देने के बजाय अगले managed binary candidate को retry करता है।
Explicit `appServer.command`
config या `OPENCLAW_CODEX_APP_SERVER_BIN` अब भी इस managed
selection को override करता है।

## Commands

किसी भी chat surface से `/codex computer-use` commands का उपयोग करें जहां `codex`
Plugin command surface उपलब्ध है। ये OpenClaw chat/runtime commands हैं,
`openclaw codex ...` CLI subcommands नहीं:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` read-only है। यह marketplace sources add नहीं करता, Plugins install नहीं करता, या
Codex Plugin support enable नहीं करता। यदि कोई config Computer Use को opt in नहीं करता, तो `status`
one-off install command के बाद भी disabled report कर सकता है।

`install` Codex app-server Plugin support enable करता है, optionally configured
marketplace source add करता है, Codex
app-server के माध्यम से configured Plugin install या re-enable करता है, MCP servers reload करता है, और verify करता है कि MCP server tools expose करता है।
क्योंकि installation trusted host resources बदलता है, केवल owner या
`operator.admin` Gateway client `install` चला सकता है। अन्य authorized senders
overrides सहित read-only `status` command का उपयोग जारी रख सकते हैं।

## Marketplace choices

OpenClaw वही app-server API उपयोग करता है जिसे Codex स्वयं expose करता है। marketplace
fields चुनते हैं कि Codex को `computer-use` कहां ढूंढना चाहिए।

| Field                | कब उपयोग करें                                                   | Install support                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| No marketplace field | आप चाहते हैं कि Codex app-server उन marketplaces का उपयोग करे जिन्हें वह पहले से जानता है। | हां, जब app-server local marketplace return करता है। |
| `marketplaceSource`  | आपके पास Codex marketplace source है जिसे app-server add कर सकता है। | हां, explicit `/codex computer-use install` के लिए। |
| `marketplacePath`    | आप host पर local marketplace file path पहले से जानते हैं। | हां, explicit install और turn-start auto-install के लिए। |
| `marketplaceName`    | आप name से पहले से registered एक marketplace चुनना चाहते हैं। | हां, केवल तब जब selected marketplace का local path हो। |

Fresh Codex homes को अपनी official marketplaces seed करने के लिए थोड़ा समय लग सकता है।
Install के दौरान, OpenClaw `plugin/list` को
`marketplaceDiscoveryTimeoutMs` milliseconds तक poll करता है। default 60 seconds है।

यदि multiple known marketplaces में Computer Use है, तो OpenClaw
`openai-bundled`, फिर `openai-curated`, फिर `local` को prefer करता है। Unknown ambiguous matches
fail closed करते हैं और आपसे `marketplaceName` या `marketplacePath` set करने को कहते हैं।

## Bundled macOS marketplace

Recent Codex desktop builds यहां Computer Use bundle करते हैं:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

जब `computerUse.autoInstall` true है और `computer-use` containing कोई marketplace
registered नहीं है, तो OpenClaw standard bundled
marketplace root को automatically add करने का प्रयास करता है:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

आप इसे Codex के साथ shell से explicitly भी register कर सकते हैं:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

यदि आप nonstandard Codex app path उपयोग करते हैं, तो `/codex computer-use install
--source <marketplace-root>` एक बार चलाएं या `computerUse.marketplacePath` को
local marketplace file path पर set करें। `--marketplace-path` का उपयोग केवल तब करें जब आपके पास
marketplace JSON file path हो, bundled marketplace root नहीं।

## Remote catalog limit

Codex app-server remote-only catalog entries list और read कर सकता है, लेकिन यह
वर्तमान में remote `plugin/install` support नहीं करता। इसका अर्थ है कि `marketplaceName`
status checks के लिए remote-only marketplace select कर सकता है, लेकिन installs और re-enables को
अब भी `marketplaceSource` या `marketplacePath` के माध्यम से local marketplace चाहिए।

यदि status कहता है कि Plugin remote Codex marketplace में उपलब्ध है लेकिन remote
install unsupported है, तो local source या path के साथ install चलाएं:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Configuration reference

| Field                           | Default        | Meaning                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use require करें। जब कोई अन्य Computer Use field set हो, तो default true होता है। |
| `autoInstall`                   | false          | Turn start पर already discovered marketplaces से install या re-enable करें। |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Install कितनी देर तक Codex app-server marketplace discovery की प्रतीक्षा करता है। |
| `marketplaceSource`             | unset          | Codex app-server `marketplace/add` को pass की जाने वाली source string। |
| `marketplacePath`               | unset          | Plugin containing local Codex marketplace file path। |
| `marketplaceName`               | unset          | Select करने के लिए registered Codex marketplace name। |
| `pluginName`                    | `computer-use` | Codex marketplace Plugin name। |
| `mcpServerName`                 | `computer-use` | Installed Plugin द्वारा exposed MCP server name। |

Turn-start auto-install configured `marketplaceSource`
values को जानबूझकर refuse करता है। नया source add करना explicit setup operation है, इसलिए
`/codex computer-use install --source <marketplace-source>` एक बार उपयोग करें, फिर
`autoInstall` को discovered local marketplaces से future re-enables handle करने दें।
Turn-start auto-install configured `marketplacePath` उपयोग कर सकता है, क्योंकि वह
host पर पहले से local path है।

## What OpenClaw checks

OpenClaw internally stable setup reason report करता है और chat के लिए user-facing
status format करता है:

| कारण                         | अर्थ                                                    | अगला कदम                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false पर रिज़ॉल्व हुआ।           | `enabled` या कोई अन्य Computer Use फ़ील्ड सेट करें। |
| `marketplace_missing`        | कोई मेल खाता marketplace उपलब्ध नहीं था।              | source, path, या marketplace नाम कॉन्फ़िगर करें। |
| `plugin_not_installed`       | Marketplace मौजूद है, लेकिन plugin इंस्टॉल नहीं है।   | install चलाएँ या `autoInstall` सक्षम करें।   |
| `plugin_disabled`            | Plugin इंस्टॉल है लेकिन Codex config में disabled है।  | इसे फिर से सक्षम करने के लिए install चलाएँ।  |
| `remote_install_unsupported` | चुना गया marketplace केवल remote है।                  | `marketplaceSource` या `marketplacePath` का उपयोग करें। |
| `mcp_missing`                | Plugin सक्षम है, लेकिन MCP server उपलब्ध नहीं है।     | Codex Computer Use और OS permissions जाँचें।  |
| `ready`                      | Plugin और MCP tools उपलब्ध हैं।                       | Codex-mode turn शुरू करें।                    |
| `check_failed`               | status check के दौरान Codex app-server request विफल हुई। | app-server connectivity और logs जाँचें।       |
| `auto_install_blocked`       | turn-start setup को नया source जोड़ना पड़ेगा।         | पहले explicit install चलाएँ।                  |

Chat output में plugin state, MCP server state, marketplace, उपलब्ध होने पर tools,
और विफल setup step के लिए विशिष्ट message शामिल होता है।

## macOS permissions

Computer Use macOS-specific है। Codex-owned MCP server को apps का निरीक्षण या
control करने से पहले local OS permissions की ज़रूरत हो सकती है। अगर OpenClaw कहता है कि Computer Use
इंस्टॉल है लेकिन MCP server उपलब्ध नहीं है, तो पहले Codex-side Computer
Use setup सत्यापित करें:

- Codex app-server उसी host पर चल रहा है जहाँ desktop control होना चाहिए।
- Computer Use plugin Codex config में सक्षम है।
- `computer-use` MCP server Codex app-server MCP status में दिखाई देता है।
- macOS ने desktop-control app के लिए आवश्यक permissions दे दिए हैं।
- वर्तमान host session नियंत्रित किए जा रहे desktop तक पहुँच सकता है।

जब `computerUse.enabled` true होता है, तो OpenClaw जानबूझकर fail closed करता है। एक
Codex-mode turn को उन native desktop tools के बिना चुपचाप आगे नहीं बढ़ना चाहिए
जिनकी config ने आवश्यकता बताई है।

## Troubleshooting

**Status कहता है कि installed नहीं है।** `/codex computer-use install` चलाएँ। अगर
marketplace discover नहीं होता है, तो `--source` या `--marketplace-path` पास करें।

**Status कहता है कि installed है लेकिन disabled है।** `/codex computer-use install` फिर से चलाएँ।
Codex app-server install plugin config को वापस enabled पर लिखता है।

**Status कहता है कि remote install unsupported है।** local marketplace source या
path का उपयोग करें। Remote-only catalog entries को inspect किया जा सकता है लेकिन
वर्तमान app-server API के माध्यम से install नहीं किया जा सकता।

**Status कहता है कि MCP server unavailable है।** MCP
servers reload कराने के लिए install एक बार फिर चलाएँ। अगर यह फिर भी unavailable रहता है, तो Codex Computer Use app,
Codex app-server MCP status, या macOS permissions ठीक करें।

**Status या probe `computer-use.list_apps` पर time out होता है।** Plugin और MCP
server मौजूद हैं, लेकिन local Computer Use bridge ने जवाब नहीं दिया। Codex Computer Use को quit या
restart करें, ज़रूरत हो तो Codex Desktop को relaunch करें, फिर एक
fresh OpenClaw session में retry करें। अगर host ने पहले पुराने
managed Codex app-server के ज़रिए Computer Use चलाया था, तो desktop bundled
marketplace से installed plugin refresh करें:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use tool कहता है `Native hook relay unavailable`।** Codex-native
tool hook local bridge या Gateway fallback के ज़रिए active OpenClaw relay तक नहीं पहुँच सका।
`/new` या `/reset` के साथ fresh OpenClaw session शुरू करें। अगर यह
एक बार काम करता है और बाद में किसी tool call पर फिर fail होता है, तो `/new` केवल
वर्तमान attempt को clear कर रहा है; Codex app-server या OpenClaw Gateway को restart करें ताकि पुराने threads
और hook registrations drop हो जाएँ, फिर fresh session में retry करें।

**Turn-start auto-install source से इनकार करता है।** यह intentional है। पहले
explicit `/codex computer-use install --source <marketplace-source>` के साथ
source जोड़ें, फिर भविष्य का turn-start auto-install discovered local
marketplace का उपयोग कर सकेगा।

## Related

- [Codex harness](/hi/plugins/codex-harness)
- [Peekaboo bridge](/hi/platforms/mac/peekaboo)
- [iOS app](/hi/platforms/ios)
