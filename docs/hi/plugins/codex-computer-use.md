---
read_when:
    - आप चाहते हैं कि Codex-मोड OpenClaw एजेंट Codex Computer Use का उपयोग करें
    - आप Codex Computer Use, PeekabooBridge और सीधे cua-driver MCP में से चयन कर रहे हैं
    - आप बंडल किए गए Codex Plugin के लिए computerUse कॉन्फ़िगर कर रहे हैं
    - आप /codex कंप्यूटर-उपयोग की स्थिति या इंस्टॉलेशन की समस्या का निवारण कर रहे हैं
summary: Codex-मोड OpenClaw एजेंटों के लिए Codex Computer Use सेट अप करें
title: Codex कंप्यूटर उपयोग
x-i18n:
    generated_at: "2026-07-21T17:04:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 268fc5659f776eff4cfb9bec8a95cd7ab5c6cbdf13793914409444da72f9e98e
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use स्थानीय डेस्कटॉप नियंत्रण के लिए Codex-नेटिव MCP Plugin है। OpenClaw
न तो डेस्कटॉप ऐप को अपने साथ शामिल करता है, न स्वयं डेस्कटॉप क्रियाएँ निष्पादित करता है, और न ही
Codex अनुमतियों को बायपास करता है। बंडल किया गया `codex` Plugin केवल Codex app-server को तैयार करता है:
यह Codex Plugin समर्थन सक्षम करता है, कॉन्फ़िगर किए गए Computer Use
Plugin को खोजता या इंस्टॉल करता है, जाँचता है कि `computer-use` MCP सर्वर उपलब्ध है, और फिर
Codex-मोड टर्न के दौरान नेटिव MCP टूल कॉल का स्वामित्व Codex को देता है।

इस पृष्ठ का उपयोग तब करें जब OpenClaw पहले से नेटिव Codex हार्नेस का उपयोग कर रहा हो। स्वयं
रनटाइम सेटअप के लिए, [Codex हार्नेस](/hi/plugins/codex-harness) देखें।

यह OpenClaw के अंतर्निहित [Node-समर्थित कंप्यूटर टूल](/hi/nodes/computer-use) से अलग है। अंतर्निहित टूल का उपयोग तब करें जब एक ही एजेंट अनुबंध को किसी युग्मित Mac को नियंत्रित करना हो, चाहे एजेंट Gateway पर चले या किसी अन्य Node पर। Codex Computer Use का उपयोग तब करें जब Codex app-server को स्थानीय MCP इंस्टॉलेशन, अनुमतियों और नेटिव टूल कॉल का स्वामित्व लेना हो।

## OpenClaw.app और Peekaboo

OpenClaw.app का Peekaboo एकीकरण Codex Computer Use से अलग है।
macOS ऐप एक PeekabooBridge सॉकेट होस्ट कर सकता है, ताकि `peekaboo` CLI, Peekaboo के अपने
ऑटोमेशन टूल के लिए ऐप की स्थानीय Accessibility और Screen Recording अनुमतियों का पुनः उपयोग कर सके।
वह ब्रिज Codex Computer Use को इंस्टॉल या प्रॉक्सी नहीं करता, और
Codex Computer Use, PeekabooBridge सॉकेट के माध्यम से कॉल नहीं करता।

जब आप चाहते हैं कि OpenClaw.app, Peekaboo CLI ऑटोमेशन के लिए
अनुमति-सजग होस्ट बने, तब [Peekaboo ब्रिज](/hi/platforms/mac/peekaboo) का उपयोग करें। इस पृष्ठ का उपयोग तब करें जब किसी
Codex-मोड OpenClaw एजेंट के लिए टर्न शुरू होने से पहले Codex का नेटिव `computer-use` MCP Plugin
उपलब्ध होना चाहिए।

## iOS ऐप

iOS ऐप Codex Computer Use से अलग है। यह Codex
`computer-use` MCP सर्वर को इंस्टॉल या प्रॉक्सी नहीं करता और यह डेस्कटॉप-नियंत्रण बैकएंड नहीं है।
इसके बजाय, iOS ऐप OpenClaw Node के रूप में कनेक्ट होता है और
`canvas.*`, `camera.*`, `screen.*`,
`location.*`, और `talk.*` जैसे Node कमांड के माध्यम से मोबाइल
क्षमताएँ उपलब्ध कराता है।

जब आप चाहते हैं कि कोई एजेंट Gateway के माध्यम से iPhone Node को संचालित करे,
तब [iOS](/hi/platforms/ios) का उपयोग करें। इस पृष्ठ का उपयोग तब करें जब किसी Codex-मोड एजेंट को
Codex के नेटिव Computer Use Plugin के माध्यम से स्थानीय macOS डेस्कटॉप नियंत्रित करना हो।

## प्रत्यक्ष cua-driver MCP

डेस्कटॉप नियंत्रण उपलब्ध कराने का एकमात्र तरीका Codex Computer Use नहीं है। यदि आप चाहते हैं कि
OpenClaw-प्रबंधित रनटाइम TryCua के ड्राइवर को सीधे कॉल करें, तो
Codex-विशिष्ट मार्केटप्लेस प्रवाह के बजाय OpenClaw की MCP रजिस्ट्री के माध्यम से अपस्ट्रीम
`cua-driver mcp` सर्वर का उपयोग करें।

`cua-driver` इंस्टॉल करने के बाद, या तो उससे OpenClaw कमांड माँगें:

```bash
cua-driver mcp-config --client openclaw
```

या stdio सर्वर को सीधे पंजीकृत करें:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

यह पथ ड्राइवर
स्कीमा और संरचित MCP प्रतिक्रियाओं सहित अपस्ट्रीम MCP टूल सतह को अक्षुण्ण रखता है। इसका उपयोग तब करें जब आप CUA ड्राइवर को
सामान्य OpenClaw MCP सर्वर के रूप में उपलब्ध कराना चाहते हैं। इस
पृष्ठ पर दिए Codex Computer Use सेटअप का उपयोग तब करें जब Codex app-server को Codex-मोड टर्न के भीतर Plugin इंस्टॉलेशन, MCP रीलोड
और नेटिव टूल कॉल का स्वामित्व लेना हो।

CUA का ड्राइवर macOS, Windows (x64 और ARM64), और
Linux (x64 और ARM64, पूर्वावलोकन स्तर) के लिए प्री-रिलीज़ बिल्ड प्रदान करता है। इसे अब भी उन स्थानीय OS
अनुमतियों की आवश्यकता होती है जिनके लिए इसका ऐप संकेत देता है, जैसे macOS पर Accessibility और Screen Recording।
OpenClaw न तो `cua-driver` इंस्टॉल करता है, न वे अनुमतियाँ देता है, और न ही
अपस्ट्रीम ड्राइवर के सुरक्षा मॉडल को बायपास करता है।

## त्वरित सेटअप

जब किसी थ्रेड के शुरू होने से पहले Codex-मोड टर्न के लिए
Computer Use उपलब्ध होना अनिवार्य हो, तब `plugins.entries.codex.config.computerUse` सेट करें। `autoInstall: true`
Computer Use को सक्रिय करता है और OpenClaw को टर्न से पहले इसे इंस्टॉल या पुनः सक्षम करने देता है:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

इस कॉन्फ़िगरेशन के साथ, OpenClaw प्रत्येक Codex-मोड
टर्न से पहले Codex app-server की जाँच करता है। यदि Computer Use अनुपलब्ध है, लेकिन Codex app-server पहले ही
इंस्टॉल किए जा सकने वाले मार्केटप्लेस का पता लगा चुका है, तो OpenClaw, Codex app-server से Plugin इंस्टॉल या
पुनः सक्षम करने और MCP सर्वर रीलोड करने को कहता है। macOS पर, जब कोई मेल खाता
मार्केटप्लेस पंजीकृत नहीं है और मानक डेस्कटॉप ऐप बंडल मौजूद है, तब OpenClaw
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` से बंडल किए गए Codex मार्केटप्लेस को पंजीकृत करने का भी प्रयास करता है, और
पुराने स्टैंडअलोन इंस्टॉलेशन के लिए `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
को फ़ॉलबैक के रूप में बनाए रखता है। यदि इसके बाद भी सेटअप
MCP सर्वर को उपलब्ध नहीं करा पाता, तो थ्रेड शुरू होने से पहले टर्न विफल हो जाता है।

यदि कोई मौजूदा Codex थ्रेड पहले ही शुरू हो चुका है, तो Computer Use कॉन्फ़िगरेशन बदलने के बाद परीक्षण से पहले प्रभावित
चैट में `/new` या `/reset` का उपयोग करें।

macOS पर, Computer Use के लिए प्रबंधित स्टार्टअप पहले
`/Applications/ChatGPT.app/Contents/Resources/codex` पर स्थित डेस्कटॉप ऐप बाइनरी को प्राथमिकता देता है, फिर पुराने
स्टैंडअलोन इंस्टॉलेशन के लिए `/Applications/Codex.app/Contents/Resources/codex` का
फ़ॉलबैक उपयोग करता है। यह उन एकबारगी Computer Use स्थिति और
इंस्टॉल कमांड पर भी लागू होता है जो अपना स्वयं का क्लाइंट शुरू करते हैं। इससे डेस्कटॉप नियंत्रण
उस ऐप बंडल के अधीन रहता है जिसके पास स्थानीय macOS अनुमतियाँ हैं। यदि डेस्कटॉप ऐप
इंस्टॉल नहीं है, तो OpenClaw Plugin के साथ इंस्टॉल की गई प्रबंधित Codex बाइनरी का फ़ॉलबैक उपयोग करता है।
डिफ़ॉल्ट पृथक एजेंट होम वाले सामान्य प्रबंधित Codex टर्न पहले
उस पिन किए गए पैकेज को प्राथमिकता देते हैं, ताकि कोई पुराना डेस्कटॉप ऐप वर्तमान मॉडल
समर्थन को ओझल न कर सके। उपयोगकर्ता-स्कोप वाले होम डेस्कटॉप को प्राथमिकता देते हैं, क्योंकि वे नेटिव
Computer Use स्थिति लोड कर सकते हैं। वह पृथक एजेंट होम भी डेस्कटॉप को प्राथमिकता देता है, जिसके प्रभावी Codex कॉन्फ़िगरेशन में
Computer Use सक्षम है। स्पष्ट
`appServer.command` कॉन्फ़िगरेशन या `OPENCLAW_CODEX_APP_SERVER_BIN` अब भी
इस प्रबंधित चयन को ओवरराइड करता है।

OpenClaw एक चालू Gateway के भीतर नेटिव Codex कॉन्फ़िगरेशन पठन और Computer Use इंस्टॉलेशन को
क्रमबद्ध करता है। कोई अलग Codex प्रक्रिया या दूसरा Gateway
उस सुरक्षा-सीमा का हिस्सा नहीं है। Gateway के बाहर नेटिव Codex Plugin कॉन्फ़िगरेशन बदलने के बाद,
नए चयन पर निर्भर होने से पहले Gateway पुनः आरंभ करें और नई चैट शुरू करें।

## कमांड

किसी भी ऐसी चैट सतह से `/codex computer-use` कमांड का उपयोग करें जहाँ
`codex` Plugin कमांड सतह उपलब्ध है। ये OpenClaw चैट/रनटाइम
कमांड हैं, `openclaw codex ...` CLI उपकमांड नहीं:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` डिफ़ॉल्ट क्रिया है और केवल-पठन योग्य है: यह मार्केटप्लेस
स्रोत नहीं जोड़ती, Plugin इंस्टॉल नहीं करती, और Codex Plugin समर्थन सक्षम नहीं करती। यदि कोई कॉन्फ़िगरेशन
Computer Use को सक्रिय नहीं करता, तो एकबारगी इंस्टॉल
कमांड के बाद भी `status` निष्क्रिय स्थिति रिपोर्ट कर सकता है।

`install` Codex app-server Plugin समर्थन सक्षम करता है, वैकल्पिक रूप से
कॉन्फ़िगर किया गया मार्केटप्लेस स्रोत जोड़ता है, Codex app-server के माध्यम से कॉन्फ़िगर किया गया Plugin
इंस्टॉल या पुनः सक्षम करता है, MCP सर्वर रीलोड करता है, और सत्यापित करता है कि MCP
सर्वर टूल उपलब्ध कराता है। चूँकि इंस्टॉलेशन विश्वसनीय होस्ट संसाधनों को बदलता है,
केवल कोई स्वामी या `operator.admin` Gateway क्लाइंट ही `install` चला सकता है। अन्य
अधिकृत प्रेषक ओवरराइड सहित केवल-पठन योग्य `status` कमांड का
उपयोग जारी रख सकते हैं।

पुराने रिलीज़ एकबारगी `--plugin`, `--server`, और `--mcp-server`
पहचान ओवरराइड स्वीकार करते थे। इसके बजाय `computerUse.pluginName` और
`computerUse.mcpServerName` को स्थायी रूप से कॉन्फ़िगर करें। जब कोई पुराना पहचान फ़्लैग
उपयोग किया जाता है, तो कमांड स्थायी करने के लिए सटीक सेटिंग की पहचान करता है और अपनी माइग्रेशन मार्गदर्शिका में
अनुरोधित क्रिया तथा सभी समर्थित मार्केटप्लेस फ़्लैग दोहराता है।

## मार्केटप्लेस विकल्प

OpenClaw वही app-server API उपयोग करता है जिसे Codex स्वयं उपलब्ध कराता है।
मार्केटप्लेस फ़ील्ड चुनते हैं कि Codex को `computer-use` कहाँ खोजना चाहिए।

| फ़ील्ड                | कब उपयोग करें                                                        | इंस्टॉल समर्थन                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| कोई मार्केटप्लेस फ़ील्ड नहीं | आप चाहते हैं कि Codex app-server उन मार्केटप्लेस का उपयोग करे जिन्हें वह पहले से जानता है। | हाँ, जब app-server कोई स्थानीय मार्केटप्लेस लौटाता है।        |
| `marketplaceSource`  | आपके पास Codex मार्केटप्लेस स्रोत है जिसे app-server जोड़ सकता है।         | हाँ, स्पष्ट `/codex computer-use install` के लिए।         |
| `marketplacePath`    | आप होस्ट पर स्थानीय मार्केटप्लेस फ़ाइल पथ पहले से जानते हैं।   | हाँ, स्पष्ट इंस्टॉल और टर्न-प्रारंभ स्वचालित इंस्टॉल के लिए।   |
| `marketplaceName`    | आप पहले से पंजीकृत किसी मार्केटप्लेस को नाम से चुनना चाहते हैं।  | हाँ, केवल तब जब चुने गए मार्केटप्लेस का स्थानीय पथ हो। |

नए Codex होम को अपने आधिकारिक
मार्केटप्लेस आरंभ करने के लिए कुछ समय की आवश्यकता हो सकती है। इंस्टॉल के दौरान, OpenClaw
`plugin/list` को अधिकतम
`marketplaceDiscoveryTimeoutMs` मिलीसेकंड (डिफ़ॉल्ट 60 सेकंड) तक पोल करता है।

यदि एकाधिक ज्ञात मार्केटप्लेस में Computer Use मौजूद है, तो OpenClaw
`openai-bundled`, फिर `openai-curated`, फिर `local` को प्राथमिकता देता है। अज्ञात अस्पष्ट
मिलान बंद अवस्था में विफल होते हैं और आपसे `marketplaceName` या
`marketplacePath` सेट करने को कहते हैं।

## बंडल किया गया macOS मार्केटप्लेस

वर्तमान ChatGPT डेस्कटॉप बिल्ड यहाँ Computer Use बंडल करते हैं; पुराने स्टैंडअलोन
Codex डेस्कटॉप बिल्ड `Codex.app` के अंतर्गत समान लेआउट उपयोग करते हैं:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

जब `computerUse.autoInstall` true हो और
`computer-use` वाला कोई मार्केटप्लेस पंजीकृत न हो, तो OpenClaw मौजूद पहला मानक
बंडल किया गया मार्केटप्लेस रूट जोड़ने का प्रयास करता है:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

आप इसे Codex के साथ शेल से स्पष्ट रूप से भी पंजीकृत कर सकते हैं:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

यदि आप गैर-मानक Codex ऐप पथ उपयोग करते हैं, तो `/codex computer-use install
--source <marketplace-root>` एक बार चलाएँ, या `computerUse.marketplacePath` को
स्थानीय मार्केटप्लेस फ़ाइल पथ पर सेट करें। `--marketplace-path` का उपयोग केवल तब करें जब आपके पास
मार्केटप्लेस JSON फ़ाइल पथ हो, बंडल किया गया मार्केटप्लेस रूट नहीं।

### साझा Plugin कैश

डिफ़ॉल्ट `pluginCacheMode: "independent"` प्रत्येक Codex होम और उसके
Plugin कैश को अप्रबंधित छोड़ता है। app-server स्टार्टअप से पहले बंडल किए गए
Computer Use Plugin को सक्रिय Codex होम के खोजे जा सकने वाले Plugin कैश में कॉपी करने के लिए `pluginCacheMode: "shared"` सेट करें।
साझा मोड पुराने कैश किए गए संस्करण बनाए रखता है, क्योंकि
चल रहे Codex क्लाइंट अब भी अपनी संस्करणयुक्त Plugin डायरेक्टरी को संदर्भित कर सकते हैं; विफल
प्रतिस्थापन कॉपी भी सक्रिय कैश को बनाए रखती है। स्पष्ट
`marketplaceName` या `marketplacePath` कॉन्फ़िगरेशन इस
समाधान प्रक्रिया को निष्क्रिय करता है, ताकि OpenClaw उस चयन को ओवरराइड न करे।

## दूरस्थ कैटलॉग सीमा

Codex app-server केवल-दूरस्थ कैटलॉग प्रविष्टियों को सूचीबद्ध और पढ़ सकता है, लेकिन यह
वर्तमान में दूरस्थ `plugin/install` का समर्थन नहीं करता। इसका अर्थ है कि `marketplaceName`
स्थिति जाँच के लिए केवल-दूरस्थ मार्केटप्लेस चुन सकता है, लेकिन इंस्टॉल और
पुनः सक्षम करने के लिए अब भी `marketplaceSource` या
`marketplacePath` के माध्यम से स्थानीय मार्केटप्लेस चाहिए।

यदि स्थिति बताती है कि Plugin दूरस्थ Codex मार्केटप्लेस में उपलब्ध है, लेकिन
दूरस्थ इंस्टॉल असमर्थित है, तो स्थानीय स्रोत या पथ के साथ इंस्टॉल चलाएँ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## कॉन्फ़िगरेशन संदर्भ

| फ़ील्ड                           | डिफ़ॉल्ट        | अर्थ                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use आवश्यक करें। किसी अन्य Computer Use फ़ील्ड के सेट होने पर यह डिफ़ॉल्ट रूप से true होता है। |
| `autoInstall`                   | false          | टर्न शुरू होने पर पहले से खोजे गए मार्केटप्लेस से इंस्टॉल या फिर से सक्षम करें।       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Codex app-server द्वारा मार्केटप्लेस खोजे जाने के लिए इंस्टॉल कितनी देर प्रतीक्षा करता है।             |
| `liveTestTimeoutMs`             | 60000          | अस्थायी तत्परता थ्रेड और उसके क्लीनअप अनुरोधों की समय-सीमा।           |
| `toolCallTimeoutMs`             | 60000          | Computer Use `list_apps` तत्परता टूल कॉल की समय-सीमा।                  |
| `healthCheckEnabled`            | false          | स्वामी app-server क्लाइंट के सक्रिय रहने के दौरान समय-समय पर तत्परता जाँच चलाएँ।    |
| `healthCheckIntervalMinutes`    | 60             | जाँच अंतराल; स्वीकृत मान 30, 60, 120 या 240 मिनट हैं।                |
| `pluginCacheMode`               | `independent`  | बंडल किए गए डेस्कटॉप Plugin से Codex-home कैश रीफ़्रेश करने के लिए `shared` का उपयोग करें।  |
| `strictReadiness`               | false          | लाइव जाँच विफल होने पर चेतावनी के साथ जारी रखने के बजाय स्टार्टअप रोकें।      |
| `autoRepair`                    | false          | पुराने स्कोप किए गए Computer Use MCP चाइल्ड प्रोसेस समाप्त करें और विफल जाँच को एक बार फिर आज़माएँ।     |
| `marketplaceSource`             | unset          | Codex app-server `marketplace/add` को दिया जाने वाला स्रोत स्ट्रिंग।                    |
| `marketplacePath`               | unset          | Plugin वाली स्थानीय Codex मार्केटप्लेस फ़ाइल का पथ।                       |
| `marketplaceName`               | unset          | चुनने के लिए पंजीकृत Codex मार्केटप्लेस नाम।                                   |
| `pluginName`                    | `computer-use` | Codex मार्केटप्लेस Plugin का नाम।                                                 |
| `mcpServerName`                 | `computer-use` | इंस्टॉल किए गए Plugin द्वारा उपलब्ध कराया गया MCP सर्वर नाम।                               |

टर्न शुरू होने पर ऑटो-इंस्टॉल जानबूझकर कॉन्फ़िगर किए गए `marketplaceSource`
मानों को अस्वीकार करता है। नया स्रोत जोड़ना एक स्पष्ट सेटअप कार्रवाई है, इसलिए
`/codex computer-use install --source <marketplace-source>` का एक बार उपयोग करें, फिर
खोजे गए स्थानीय मार्केटप्लेस से भविष्य में फिर से सक्षम करने का काम `autoInstall` को करने दें।
टर्न शुरू होने पर ऑटो-इंस्टॉल कॉन्फ़िगर किए गए `marketplacePath` का उपयोग कर सकता है, क्योंकि वह
होस्ट पर पहले से ही एक स्थानीय पथ है।

हर फ़ील्ड पर्यावरण चर ओवरराइड भी स्वीकार करता है, जिसकी जाँच तब की जाती है जब
संबंधित कॉन्फ़िगरेशन कुंजी सेट न हो:

| फ़ील्ड                           | पर्यावरण चर                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw क्या जाँचता है

OpenClaw आंतरिक रूप से एक स्थिर सेटअप कारण की रिपोर्ट करता है और
चैट के लिए उपयोगकर्ता-दृश्य स्थिति को प्रारूपित करता है:

| कारण                       | अर्थ                                                | अगला चरण                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` का परिणाम false आया।               | `enabled` या कोई अन्य Computer Use फ़ील्ड सेट करें।  |
| `marketplace_missing`        | कोई मेल खाता मार्केटप्लेस उपलब्ध नहीं था।                 | स्रोत, पथ या मार्केटप्लेस नाम कॉन्फ़िगर करें।  |
| `plugin_not_installed`       | मार्केटप्लेस मौजूद है, लेकिन Plugin इंस्टॉल नहीं है।   | इंस्टॉल चलाएँ या `autoInstall` सक्षम करें।          |
| `plugin_disabled`            | Plugin इंस्टॉल है, लेकिन Codex कॉन्फ़िगरेशन में अक्षम है।      | इसे फिर से सक्षम करने के लिए इंस्टॉल चलाएँ।                  |
| `remote_install_unsupported` | चुना गया मार्केटप्लेस केवल रिमोट है।                   | `marketplaceSource` या `marketplacePath` का उपयोग करें। |
| `mcp_missing`                | Plugin सक्षम है, लेकिन MCP सर्वर उपलब्ध नहीं है।  | Codex Computer Use और OS अनुमतियाँ जाँचें।  |
| `ready`                      | Plugin और MCP टूल उपलब्ध हैं।                    | Codex-मोड टर्न शुरू करें।                    |
| `check_failed`               | स्थिति जाँच के दौरान Codex app-server अनुरोध विफल हुआ। | app-server कनेक्टिविटी और लॉग जाँचें।       |
| `auto_install_blocked`       | टर्न-प्रारंभ सेटअप के लिए नया स्रोत जोड़ना आवश्यक होगा।       | पहले स्पष्ट इंस्टॉल चलाएँ।                   |

चैट आउटपुट में Plugin की स्थिति, MCP सर्वर की स्थिति, मार्केटप्लेस,
उपलब्ध होने पर टूल और विफल सेटअप चरण का विशिष्ट संदेश शामिल होता है।

## macOS अनुमतियाँ

Computer Use केवल macOS के लिए है। Codex के स्वामित्व वाले MCP सर्वर को ऐप्स की
जाँच या नियंत्रण करने से पहले स्थानीय OS अनुमतियों की आवश्यकता हो सकती है। यदि OpenClaw बताता है कि Computer
Use इंस्टॉल है, लेकिन MCP सर्वर उपलब्ध नहीं है, तो पहले Codex-पक्ष का
Computer Use सेटअप सत्यापित करें:

- Codex app-server उसी होस्ट पर चल रहा है जहाँ डेस्कटॉप नियंत्रण
  होना चाहिए।
- Computer Use Plugin Codex कॉन्फ़िगरेशन में सक्षम है।
- `computer-use` MCP सर्वर Codex app-server MCP स्थिति में दिखाई देता है।
- macOS ने डेस्कटॉप-नियंत्रण ऐप को आवश्यक अनुमतियाँ प्रदान की हैं।
- वर्तमान होस्ट सत्र नियंत्रित किए जा रहे डेस्कटॉप तक पहुँच सकता है।

`computerUse.enabled` के true होने पर OpenClaw जानबूझकर बंद अवस्था में विफल होता है। किसी
Codex-मोड टर्न को उन मूल डेस्कटॉप टूल के बिना चुपचाप आगे नहीं बढ़ना चाहिए
जिनकी कॉन्फ़िगरेशन में आवश्यकता है।

## समस्या निवारण

**स्थिति बताती है कि इंस्टॉल नहीं है।** `/codex computer-use install` चलाएँ। यदि
मार्केटप्लेस नहीं खोजा गया है, तो `--source` या `--marketplace-path` दें।

**स्थिति बताती है कि इंस्टॉल है, लेकिन अक्षम है।** `/codex computer-use install`
फिर से चलाएँ। Codex app-server इंस्टॉल Plugin कॉन्फ़िगरेशन को फिर से सक्षम स्थिति में लिखता है।

**स्थिति बताती है कि रिमोट इंस्टॉल समर्थित नहीं है।** स्थानीय मार्केटप्लेस
स्रोत या पथ का उपयोग करें। केवल-रिमोट कैटलॉग प्रविष्टियों की जाँच की जा सकती है, लेकिन
वर्तमान app-server API के माध्यम से उन्हें इंस्टॉल नहीं किया जा सकता।

**स्थिति बताती है कि MCP सर्वर उपलब्ध नहीं है।** इंस्टॉल एक बार फिर चलाएँ ताकि MCP
सर्वर पुनः लोड हों। यदि यह फिर भी उपलब्ध नहीं होता, तो Codex Computer Use ऐप,
Codex app-server MCP स्थिति या macOS अनुमतियाँ ठीक करें।

**स्थिति या कोई जाँच `computer-use.list_apps` पर समय-सीमा पार कर जाती है।** Plugin और
MCP सर्वर मौजूद हैं, लेकिन स्थानीय Computer Use ब्रिज ने उत्तर नहीं दिया।
Codex Computer Use को बंद या पुनः प्रारंभ करें, आवश्यकता होने पर Codex Desktop फिर से लॉन्च करें, फिर
नए OpenClaw सत्र में दोबारा प्रयास करें। यदि होस्ट ने पहले किसी पुराने प्रबंधित Codex app-server
के माध्यम से Computer Use चलाया था, तो इंस्टॉल किए गए Plugin को
डेस्कटॉप के बंडल किए गए मार्केटप्लेस से रीफ़्रेश करें (स्वतंत्र
Codex डेस्कटॉप इंस्टॉल के लिए `Codex.app` पथ का उपयोग करें):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use टूल `Native hook relay unavailable` बताता है।**
Codex-मूल टूल हुक स्थानीय ब्रिज या Gateway फ़ॉलबैक के माध्यम से किसी सक्रिय OpenClaw रिले तक नहीं पहुँच सका।
`/new` या `/reset` के साथ नया OpenClaw सत्र शुरू करें। यदि यह एक बार काम करता है और बाद की टूल कॉल पर
फिर विफल हो जाता है, तो `/new` केवल वर्तमान प्रयास को साफ़ कर रहा है; Codex app-server या
OpenClaw Gateway पुनः प्रारंभ करें ताकि पुराने थ्रेड और हुक पंजीकरण हटा दिए जाएँ, फिर
नए सत्र में दोबारा प्रयास करें।

**टर्न-प्रारंभ ऑटो-इंस्टॉल किसी स्रोत को अस्वीकार करता है।** यह जानबूझकर किया गया है। पहले
स्पष्ट `/codex computer-use install --source
<marketplace-source>` के साथ स्रोत जोड़ें, फिर भविष्य का टर्न-प्रारंभ ऑटो-इंस्टॉल
खोजे गए स्थानीय मार्केटप्लेस का उपयोग कर सकता है।

## संबंधित

- [Codex हार्नेस](/hi/plugins/codex-harness)
- [Peekaboo ब्रिज](/hi/platforms/mac/peekaboo)
- [iOS ऐप](/hi/platforms/ios)
