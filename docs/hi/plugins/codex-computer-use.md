---
read_when:
    - आप चाहते हैं कि Codex-मोड OpenClaw एजेंट Codex Computer Use का उपयोग करें
    - आप Codex Computer Use, PeekabooBridge, और direct cua-driver MCP के बीच निर्णय ले रहे हैं
    - आप Codex Computer Use और सीधे cua-driver MCP सेटअप के बीच निर्णय ले रहे हैं
    - आप बंडल किए गए Codex Plugin के लिए `computerUse` कॉन्फ़िगर कर रहे हैं
    - आप /codex कंप्यूटर-उपयोग स्थिति या इंस्टॉल की समस्या निवारण कर रहे हैं
summary: Codex-मोड OpenClaw एजेंटों के लिए Codex Computer Use सेट अप करें
title: Codex कंप्यूटर उपयोग
x-i18n:
    generated_at: "2026-06-28T23:32:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use स्थानीय डेस्कटॉप नियंत्रण के लिए Codex-नेटिव MCP plugin है। OpenClaw
डेस्कटॉप ऐप को vendor नहीं करता, स्वयं डेस्कटॉप actions निष्पादित नहीं करता, या
Codex permissions को bypass नहीं करता। bundled `codex` plugin केवल Codex app-server तैयार करता है:
यह Codex plugin support सक्षम करता है, configured Codex
Computer Use plugin को ढूंढता या install करता है, जांचता है कि `computer-use` MCP server उपलब्ध है, और
फिर Codex-mode turns के दौरान native MCP tool calls का स्वामित्व Codex को देता है।

इस पेज का उपयोग तब करें जब OpenClaw पहले से native Codex harness का उपयोग कर रहा हो। स्वयं
runtime setup के लिए, [Codex harness](/hi/plugins/codex-harness) देखें।

## OpenClaw.app और Peekaboo

OpenClaw.app का Peekaboo integration Codex Computer Use से अलग है। macOS app
PeekabooBridge socket host कर सकता है ताकि `peekaboo` CLI, Peekaboo के अपने
automation tools के लिए ऐप के स्थानीय Accessibility और Screen Recording grants का पुनः उपयोग कर सके।
वह bridge Codex Computer Use को install या proxy नहीं करता, और
Codex Computer Use PeekabooBridge socket के माध्यम से call नहीं करता।

जब आप चाहते हैं कि OpenClaw.app Peekaboo CLI automation के लिए
permission-aware host हो, तो [Peekaboo bridge](/hi/platforms/mac/peekaboo) का उपयोग करें। इस पेज का उपयोग तब करें जब
Codex-mode OpenClaw agent को turn शुरू होने से पहले Codex का native `computer-use` MCP plugin
उपलब्ध होना चाहिए।

## iOS app

iOS app Codex Computer Use से अलग है। यह Codex `computer-use` MCP server को install या proxy
नहीं करता और यह desktop-control backend नहीं है।
इसके बजाय, iOS app OpenClaw node के रूप में connect होता है और `canvas.*`, `camera.*`, `screen.*`,
`location.*`, और `talk.*` जैसे node commands के माध्यम से mobile
capabilities expose करता है।

जब आप चाहते हैं कि agent gateway के माध्यम से iPhone node को drive करे, तो [iOS](/hi/platforms/ios) का उपयोग करें।
इस पेज का उपयोग तब करें जब Codex-mode agent को Codex के native Computer Use plugin के माध्यम से स्थानीय
macOS desktop को control करना हो।

## Direct cua-driver MCP

Codex Computer Use desktop control expose करने का एकमात्र तरीका नहीं है। यदि आप चाहते हैं कि
OpenClaw-managed runtimes TryCua के driver को directly call करें, तो
Codex-specific marketplace flow के बजाय OpenClaw की MCP registry के माध्यम से upstream
`cua-driver mcp` server का उपयोग करें।

`cua-driver` install करने के बाद, या तो उससे OpenClaw command मांगें:

```bash
cua-driver mcp-config --client openclaw
```

या stdio server को स्वयं register करें:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

वह path upstream MCP tool surface को intact रखता है, जिसमें driver
schemas और structured MCP responses शामिल हैं। इसका उपयोग तब करें जब आप CUA driver को
सामान्य OpenClaw MCP server के रूप में उपलब्ध चाहते हैं। इस पेज पर दिए गए Codex Computer Use setup का उपयोग तब करें जब
Codex app-server को Codex-mode turns के अंदर plugin installation, MCP reloads,
और native tool calls का स्वामित्व लेना चाहिए।

CUA का driver macOS-specific है और अब भी स्थानीय macOS permissions की आवश्यकता रखता है
जिनके लिए उसका app prompt करता है, जैसे Accessibility और Screen Recording। OpenClaw
`cua-driver` install नहीं करता, वे permissions grant नहीं करता, या upstream
driver के safety model को bypass नहीं करता।

## Quick setup

जब Codex-mode turns में thread शुरू होने से पहले Computer Use उपलब्ध होना आवश्यक हो, तो
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

इस config के साथ, OpenClaw प्रत्येक Codex-mode turn से पहले Codex app-server को check करता है।
यदि Computer Use missing है लेकिन Codex app-server ने पहले ही installable marketplace discover कर लिया है,
तो OpenClaw Codex app-server से plugin install या re-enable करने और MCP servers reload करने को कहता है।
macOS पर, जब कोई matching marketplace registered नहीं है और standard Codex app bundle मौजूद है,
तो OpenClaw fail होने से पहले
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` से bundled Codex marketplace
register करने का भी प्रयास करता है। यदि setup फिर भी MCP server उपलब्ध नहीं करा सकता,
तो thread शुरू होने से पहले turn fail हो जाता है।

Computer Use config बदलने के बाद, यदि कोई existing Codex thread पहले ही शुरू हो चुका है, तो
testing से पहले प्रभावित chat में `/new` या `/reset` का उपयोग करें।

macOS managed stdio startup पर, OpenClaw signed desktop Codex app
bundle को `/Applications/Codex.app/Contents/Resources/codex` पर prefer करता है जब वह मौजूद होता है।
यह Computer Use को उस app bundle के अंतर्गत रखता है जिसके पास स्थानीय desktop-control
permissions हैं। यदि desktop app installed नहीं है, तो OpenClaw plugin के साथ installed
managed Codex binary पर fall back करता है। यदि installed desktop app
unsupported app-server version के साथ initialize होता है, तो OpenClaw उस child को close करता है
और stale desktop app को plugin-local fallback shadow करने देने के बजाय next managed binary candidate retry करता है।
Explicit `appServer.command`
config या `OPENCLAW_CODEX_APP_SERVER_BIN` अभी भी इस managed
selection को override करता है।

## Commands

किसी भी chat surface से `/codex computer-use` commands का उपयोग करें जहां `codex`
plugin command surface उपलब्ध है। ये OpenClaw chat/runtime commands हैं,
`openclaw codex ...` CLI subcommands नहीं:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` केवल-पठन है। यह मार्केटप्लेस स्रोत नहीं जोड़ता, Plugin इंस्टॉल नहीं करता, या
Codex Plugin समर्थन सक्षम नहीं करता। यदि कोई कॉन्फ़िग Computer Use को ऑप्ट इन नहीं करता, तो `status`
एक बार के इंस्टॉल कमांड के बाद भी अक्षम रिपोर्ट कर सकता है।

`install` Codex ऐप-सर्वर Plugin समर्थन सक्षम करता है, वैकल्पिक रूप से एक कॉन्फ़िगर किया गया
मार्केटप्लेस स्रोत जोड़ता है, Codex ऐप-सर्वर के माध्यम से कॉन्फ़िगर किए गए Plugin को
इंस्टॉल या फिर से सक्षम करता है, MCP सर्वर रीलोड करता है, और सत्यापित करता है कि MCP सर्वर टूल्स उपलब्ध कराता है।

## मार्केटप्लेस विकल्प

OpenClaw वही ऐप-सर्वर API उपयोग करता है जो Codex स्वयं उपलब्ध कराता है। ये
मार्केटप्लेस फ़ील्ड चुनते हैं कि Codex को `computer-use` कहाँ ढूँढना चाहिए।

| फ़ील्ड                | कब उपयोग करें                                                        | इंस्टॉल समर्थन                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| कोई मार्केटप्लेस फ़ील्ड नहीं | आप चाहते हैं कि Codex ऐप-सर्वर उन मार्केटप्लेस का उपयोग करे जिन्हें वह पहले से जानता है। | हाँ, जब ऐप-सर्वर कोई स्थानीय मार्केटप्लेस लौटाता है।        |
| `marketplaceSource`  | आपके पास एक Codex मार्केटप्लेस स्रोत है जिसे ऐप-सर्वर जोड़ सकता है।         | हाँ, स्पष्ट `/codex computer-use install` के लिए।         |
| `marketplacePath`    | आपको होस्ट पर स्थानीय मार्केटप्लेस फ़ाइल पथ पहले से पता है।   | हाँ, स्पष्ट इंस्टॉल और टर्न-स्टार्ट ऑटो-इंस्टॉल के लिए।   |
| `marketplaceName`    | आप नाम से पहले से पंजीकृत एक मार्केटप्लेस चुनना चाहते हैं।  | हाँ, केवल जब चुने गए मार्केटप्लेस के पास स्थानीय पथ हो। |

नए Codex होम को अपने आधिकारिक मार्केटप्लेस सीड करने के लिए थोड़ा समय लग सकता है।
इंस्टॉल के दौरान, OpenClaw `plugin/list` को
`marketplaceDiscoveryTimeoutMs` मिलीसेकंड तक पोल करता है। डिफ़ॉल्ट 60 सेकंड है।

यदि कई ज्ञात मार्केटप्लेस में Computer Use है, तो OpenClaw
`openai-bundled`, फिर `openai-curated`, फिर `local` को प्राथमिकता देता है। अज्ञात अस्पष्ट मिलान
सुरक्षित रूप से विफल होते हैं और आपसे `marketplaceName` या `marketplacePath` सेट करने को कहते हैं।

## बंडल किया गया macOS मार्केटप्लेस

हाल के Codex डेस्कटॉप बिल्ड Computer Use को यहाँ बंडल करते हैं:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

जब `computerUse.autoInstall` true हो और `computer-use` वाला कोई मार्केटप्लेस
पंजीकृत न हो, तो OpenClaw मानक बंडल किए गए मार्केटप्लेस रूट को अपने-आप जोड़ने की कोशिश करता है:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

आप इसे Codex के साथ शेल से स्पष्ट रूप से भी पंजीकृत कर सकते हैं:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

यदि आप गैर-मानक Codex ऐप पथ उपयोग करते हैं, तो `/codex computer-use install
--source <marketplace-root>` एक बार चलाएँ या `computerUse.marketplacePath` को
स्थानीय मार्केटप्लेस फ़ाइल पथ पर सेट करें। `--marketplace-path` का उपयोग केवल तब करें जब आपके पास
मार्केटप्लेस JSON फ़ाइल पथ हो, बंडल किया गया मार्केटप्लेस रूट नहीं।

## रिमोट कैटलॉग सीमा

Codex ऐप-सर्वर केवल-रिमोट कैटलॉग प्रविष्टियों को सूचीबद्ध और पढ़ सकता है, लेकिन यह
वर्तमान में रिमोट `plugin/install` का समर्थन नहीं करता। इसका मतलब है कि `marketplaceName`
स्थिति जाँच के लिए केवल-रिमोट मार्केटप्लेस चुन सकता है, लेकिन इंस्टॉल और फिर से सक्षम करने के लिए
अब भी `marketplaceSource` या `marketplacePath` के माध्यम से स्थानीय मार्केटप्लेस चाहिए।

यदि स्थिति कहती है कि Plugin किसी रिमोट Codex मार्केटप्लेस में उपलब्ध है, लेकिन रिमोट
इंस्टॉल असमर्थित है, तो स्थानीय स्रोत या पथ के साथ इंस्टॉल चलाएँ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## कॉन्फ़िगरेशन संदर्भ

| फ़ील्ड                           | डिफ़ॉल्ट        | अर्थ                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use आवश्यक करें। किसी अन्य Computer Use फ़ील्ड के सेट होने पर डिफ़ॉल्ट true होता है। |
| `autoInstall`                   | false          | टर्न शुरू होने पर पहले से खोजे गए मार्केटप्लेस से इंस्टॉल या फिर से सक्षम करें।       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Codex ऐप-सर्वर मार्केटप्लेस खोज के लिए इंस्टॉल कितनी देर प्रतीक्षा करता है।             |
| `marketplaceSource`             | unset          | Codex ऐप-सर्वर `marketplace/add` को पास की गई स्रोत स्ट्रिंग।                    |
| `marketplacePath`               | unset          | Plugin वाले स्थानीय Codex मार्केटप्लेस फ़ाइल पथ।                       |
| `marketplaceName`               | unset          | चुनने के लिए पंजीकृत Codex मार्केटप्लेस नाम।                                   |
| `pluginName`                    | `computer-use` | Codex मार्केटप्लेस Plugin नाम।                                                 |
| `mcpServerName`                 | `computer-use` | इंस्टॉल किए गए Plugin द्वारा उपलब्ध कराया गया MCP सर्वर नाम।                               |

टर्न-स्टार्ट ऑटो-इंस्टॉल जानबूझकर कॉन्फ़िगर किए गए `marketplaceSource`
मानों को अस्वीकार करता है। नया स्रोत जोड़ना एक स्पष्ट सेटअप कार्रवाई है, इसलिए
`/codex computer-use install --source <marketplace-source>` एक बार उपयोग करें, फिर
`autoInstall` को खोजे गए स्थानीय मार्केटप्लेस से भविष्य में फिर से सक्षम करने दें।
टर्न-स्टार्ट ऑटो-इंस्टॉल कॉन्फ़िगर किया गया `marketplacePath` उपयोग कर सकता है, क्योंकि वह
पहले से ही होस्ट पर स्थानीय पथ है।

## OpenClaw क्या जाँचता है

OpenClaw आंतरिक रूप से एक स्थिर सेटअप कारण रिपोर्ट करता है और चैट के लिए उपयोगकर्ता-सामने
स्थिति फ़ॉर्मैट करता है:

| कारण                       | अर्थ                                                | अगला चरण                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false पर निर्धारित हुआ।               | `enabled` या कोई अन्य Computer Use फ़ील्ड सेट करें।  |
| `marketplace_missing`        | कोई मेल खाता marketplace उपलब्ध नहीं था।                 | स्रोत, पथ, या marketplace नाम कॉन्फ़िगर करें।  |
| `plugin_not_installed`       | Marketplace मौजूद है, लेकिन Plugin इंस्टॉल नहीं है।   | इंस्टॉल चलाएँ या `autoInstall` सक्षम करें।          |
| `plugin_disabled`            | Plugin इंस्टॉल है लेकिन Codex कॉन्फ़िग में अक्षम है।      | इसे फिर से सक्षम करने के लिए इंस्टॉल चलाएँ।                  |
| `remote_install_unsupported` | चयनित marketplace केवल remote है।                   | `marketplaceSource` या `marketplacePath` का उपयोग करें। |
| `mcp_missing`                | Plugin सक्षम है, लेकिन MCP server उपलब्ध नहीं है।  | Codex Computer Use और OS अनुमतियाँ जाँचें।  |
| `ready`                      | Plugin और MCP tools उपलब्ध हैं।                    | Codex-मोड टर्न शुरू करें।                    |
| `check_failed`               | स्थिति जाँच के दौरान Codex app-server अनुरोध विफल हुआ। | app-server कनेक्टिविटी और लॉग जाँचें।       |
| `auto_install_blocked`       | टर्न-स्टार्ट सेटअप को नया स्रोत जोड़ना पड़ेगा।       | पहले स्पष्ट इंस्टॉल चलाएँ।                   |

चैट आउटपुट में उपलब्ध होने पर Plugin स्थिति, MCP server स्थिति, marketplace, tools,
और विफल सेटअप चरण के लिए विशिष्ट संदेश शामिल होते हैं।

## macOS अनुमतियाँ

Computer Use macOS-विशिष्ट है। Codex-स्वामित्व वाले MCP server को ऐप्स का निरीक्षण
या नियंत्रण करने से पहले स्थानीय OS अनुमतियों की आवश्यकता हो सकती है। यदि OpenClaw कहता है कि Computer Use
इंस्टॉल है लेकिन MCP server उपलब्ध नहीं है, तो पहले Codex-पक्ष Computer
Use सेटअप सत्यापित करें:

- Codex app-server उसी host पर चल रहा है जहाँ desktop control होना चाहिए।
- Computer Use Plugin Codex कॉन्फ़िग में सक्षम है।
- `computer-use` MCP server Codex app-server MCP स्थिति में दिखाई देता है।
- macOS ने desktop-control ऐप के लिए आवश्यक अनुमतियाँ दे दी हैं।
- वर्तमान host session नियंत्रित किए जा रहे desktop तक पहुँच सकता है।

जब `computerUse.enabled` true होता है, OpenClaw जानबूझकर बंद अवस्था में विफल होता है। एक
Codex-मोड टर्न को उन native desktop tools के बिना चुपचाप आगे नहीं बढ़ना चाहिए
जिनकी कॉन्फ़िग को आवश्यकता थी।

## समस्या निवारण

**स्थिति कहती है कि इंस्टॉल नहीं है।** `/codex computer-use install` चलाएँ। यदि
marketplace नहीं मिलता है, तो `--source` या `--marketplace-path` पास करें।

**स्थिति कहती है कि इंस्टॉल है लेकिन अक्षम है।** `/codex computer-use install` फिर से चलाएँ।
Codex app-server install Plugin कॉन्फ़िग को वापस enabled पर लिखता है।

**स्थिति कहती है कि remote install समर्थित नहीं है।** किसी स्थानीय marketplace स्रोत या
पथ का उपयोग करें। Remote-only catalog entries का निरीक्षण किया जा सकता है लेकिन
वर्तमान app-server API के माध्यम से इंस्टॉल नहीं किया जा सकता।

**स्थिति कहती है कि MCP server उपलब्ध नहीं है।** MCP
servers को reload कराने के लिए install एक बार फिर से चलाएँ। यदि यह फिर भी उपलब्ध नहीं रहता है, तो Codex Computer Use app,
Codex app-server MCP स्थिति, या macOS अनुमतियाँ ठीक करें।

**स्थिति या कोई probe `computer-use.list_apps` पर timeout हो जाता है।** Plugin और MCP
server मौजूद हैं, लेकिन स्थानीय Computer Use bridge ने जवाब नहीं दिया। Codex Computer Use को quit या
restart करें, आवश्यकता हो तो Codex Desktop फिर से launch करें, फिर एक
ताज़ा OpenClaw session में फिर से प्रयास करें। यदि host ने पहले किसी पुराने
managed Codex app-server के माध्यम से Computer Use चलाया था, तो desktop bundled
marketplace से installed Plugin refresh करें:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**कोई Computer Use tool कहता है `Native hook relay unavailable`.** Codex-native
tool hook स्थानीय bridge या Gateway fallback के माध्यम से active OpenClaw relay तक नहीं पहुँच सका।
`/new` या `/reset` के साथ ताज़ा OpenClaw session शुरू करें। यदि यह
एक बार काम करता है और फिर किसी बाद की tool call पर फिर विफल हो जाता है, तो `/new` केवल
वर्तमान प्रयास को clear कर रहा है; Codex app-server या OpenClaw Gateway restart करें ताकि पुराने threads
और hook registrations हट जाएँ, फिर ताज़ा session में पुनः प्रयास करें।

**Turn-start auto-install किसी स्रोत को अस्वीकार करता है।** यह जानबूझकर है। पहले
स्पष्ट `/codex computer-use install --source <marketplace-source>` के साथ
स्रोत जोड़ें, फिर भविष्य का turn-start auto-install खोजे गए स्थानीय
marketplace का उपयोग कर सकता है।

## संबंधित

- [Codex harness](/hi/plugins/codex-harness)
- [Peekaboo bridge](/hi/platforms/mac/peekaboo)
- [iOS app](/hi/platforms/ios)
