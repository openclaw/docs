---
read_when:
    - आप चाहते हैं कि Codex-मोड वाले OpenClaw एजेंट Codex Computer Use का उपयोग करें
    - आप Codex Computer Use, PeekabooBridge और सीधे cua-driver MCP में से चयन कर रहे हैं
    - आप बंडल किए गए Codex Plugin के लिए computerUse कॉन्फ़िगर कर रहे हैं
    - आप /codex कंप्यूटर-उपयोग की स्थिति या इंस्टॉलेशन की समस्या का निवारण कर रहे हैं
summary: Codex-मोड OpenClaw एजेंटों के लिए Codex Computer Use सेट अप करें
title: Codex कंप्यूटर उपयोग
x-i18n:
    generated_at: "2026-07-16T15:51:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use स्थानीय डेस्कटॉप नियंत्रण के लिए Codex-नेटिव MCP plugin है। OpenClaw
न तो डेस्कटॉप ऐप को अपने साथ पैकेज करता है, न स्वयं डेस्कटॉप क्रियाएँ निष्पादित करता है, और न ही
Codex अनुमतियों को बायपास करता है। बंडल किया गया `codex` plugin केवल Codex app-server को तैयार करता है:
यह Codex plugin समर्थन सक्षम करता है, कॉन्फ़िगर किया गया Computer Use
plugin ढूँढता या इंस्टॉल करता है, जाँचता है कि `computer-use` MCP सर्वर उपलब्ध है, और फिर
Codex-मोड टर्न के दौरान नेटिव MCP टूल कॉल का नियंत्रण Codex को देता है।

इस पेज का उपयोग तब करें जब OpenClaw पहले से नेटिव Codex हार्नेस का उपयोग कर रहा हो। स्वयं
रनटाइम सेटअप के लिए, [Codex हार्नेस](/hi/plugins/codex-harness) देखें।

यह OpenClaw के अंतर्निहित [Node-समर्थित कंप्यूटर टूल](/hi/nodes/computer-use) से अलग है। अंतर्निहित टूल का उपयोग तब करें जब वही एजेंट अनुबंध किसी पेयर किए गए Mac को नियंत्रित करे, चाहे एजेंट Gateway पर चले या किसी अन्य Node पर। Codex Computer Use का उपयोग तब करें जब Codex app-server को स्थानीय MCP इंस्टॉलेशन, अनुमतियों और नेटिव टूल कॉल का नियंत्रण संभालना हो।

## OpenClaw.app और Peekaboo

OpenClaw.app का Peekaboo एकीकरण Codex Computer Use से अलग है।
macOS ऐप PeekabooBridge सॉकेट होस्ट कर सकता है, ताकि `peekaboo` CLI
Peekaboo के अपने ऑटोमेशन टूल के लिए ऐप की स्थानीय Accessibility और Screen Recording
अनुमतियों का पुनः उपयोग कर सके। वह ब्रिज Codex Computer Use को इंस्टॉल या प्रॉक्सी नहीं करता, और
Codex Computer Use, PeekabooBridge सॉकेट के माध्यम से कॉल नहीं करता।

जब आप चाहते हों कि OpenClaw.app, Peekaboo CLI ऑटोमेशन के लिए
अनुमति-जागरूक होस्ट बने, तब [Peekaboo ब्रिज](/hi/platforms/mac/peekaboo) का उपयोग करें। इस पेज का उपयोग तब करें जब
Codex-मोड OpenClaw एजेंट के लिए टर्न शुरू होने से पहले Codex का नेटिव `computer-use` MCP plugin
उपलब्ध होना चाहिए।

## iOS ऐप

iOS ऐप Codex Computer Use से अलग है। यह Codex
`computer-use` MCP सर्वर को इंस्टॉल या प्रॉक्सी नहीं करता और यह डेस्कटॉप-नियंत्रण बैकएंड नहीं है।
इसके बजाय, iOS ऐप OpenClaw Node के रूप में कनेक्ट होता है और
`canvas.*`, `camera.*`, `screen.*`,
`location.*`, और `talk.*` जैसे Node कमांड के माध्यम से मोबाइल
क्षमताएँ उपलब्ध कराता है।

जब आप चाहते हों कि कोई एजेंट Gateway के माध्यम से iPhone Node को संचालित करे, तब [iOS](/hi/platforms/ios) का उपयोग करें।
इस पेज का उपयोग तब करें जब Codex-मोड एजेंट को Codex के नेटिव Computer Use plugin के माध्यम से
स्थानीय macOS डेस्कटॉप नियंत्रित करना हो।

## सीधे cua-driver MCP का उपयोग

डेस्कटॉप नियंत्रण उपलब्ध कराने का एकमात्र तरीका Codex Computer Use नहीं है। यदि आप चाहते हैं कि
OpenClaw-प्रबंधित रनटाइम सीधे TryCua के ड्राइवर को कॉल करें, तो
Codex-विशिष्ट मार्केटप्लेस प्रवाह के बजाय OpenClaw की MCP रजिस्ट्री के माध्यम से अपस्ट्रीम
`cua-driver mcp` सर्वर का उपयोग करें।

`cua-driver` इंस्टॉल करने के बाद, या तो उससे OpenClaw कमांड माँगें:

```bash
cua-driver mcp-config --client openclaw
```

या stdio सर्वर को सीधे रजिस्टर करें:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

यह मार्ग ड्राइवर
स्कीमा और संरचित MCP प्रतिक्रियाओं सहित अपस्ट्रीम MCP टूल सतह को अक्षुण्ण रखता है। इसका उपयोग तब करें जब आप CUA ड्राइवर को
सामान्य OpenClaw MCP सर्वर के रूप में उपलब्ध कराना चाहते हों। इस पेज पर दिए गए Codex Computer Use सेटअप का उपयोग
तब करें जब Codex app-server को Codex-मोड टर्न के भीतर plugin इंस्टॉलेशन, MCP रीलोड
और नेटिव टूल कॉल का नियंत्रण संभालना हो।

CUA का ड्राइवर macOS-विशिष्ट है और इसके ऐप द्वारा माँगी जाने वाली स्थानीय macOS अनुमतियाँ,
जैसे Accessibility और Screen Recording, अभी भी आवश्यक हैं। OpenClaw
`cua-driver` इंस्टॉल नहीं करता, वे अनुमतियाँ प्रदान नहीं करता, और न ही अपस्ट्रीम
ड्राइवर के सुरक्षा मॉडल को बायपास करता है।

## त्वरित सेटअप

जब थ्रेड शुरू होने से पहले Codex-मोड टर्न के लिए
Computer Use उपलब्ध होना आवश्यक हो, तब `plugins.entries.codex.config.computerUse` सेट करें। `autoInstall: true`,
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
टर्न से पहले Codex app-server की जाँच करता है। यदि Computer Use मौजूद नहीं है, लेकिन Codex app-server ने पहले ही
इंस्टॉल करने योग्य मार्केटप्लेस खोज लिया है, तो OpenClaw, Codex app-server से plugin इंस्टॉल या
पुनः सक्षम करने और MCP सर्वर रीलोड करने को कहता है। macOS पर, जब कोई मेल खाता
मार्केटप्लेस रजिस्टर नहीं है और मानक डेस्कटॉप ऐप बंडल मौजूद है, तब OpenClaw
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` से बंडल किया गया Codex मार्केटप्लेस रजिस्टर करने का भी प्रयास करता है, और
पुराने स्टैंडअलोन इंस्टॉलेशन के लिए
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` को फ़ॉलबैक के रूप में बनाए रखता है। यदि सेटअप फिर भी
MCP सर्वर उपलब्ध नहीं करा पाता, तो थ्रेड शुरू होने से पहले टर्न विफल हो जाता है।

Computer Use कॉन्फ़िगरेशन बदलने के बाद, यदि कोई मौजूदा Codex थ्रेड पहले ही शुरू हो चुका है, तो परीक्षण से पहले प्रभावित
चैट में `/new` या `/reset` का उपयोग करें।

macOS पर, Computer Use के लिए प्रबंधित स्टार्टअप पहले
`/Applications/ChatGPT.app/Contents/Resources/codex` पर स्थित डेस्कटॉप ऐप बाइनरी को प्राथमिकता देता है, फिर पुराने
स्टैंडअलोन इंस्टॉलेशन के लिए `/Applications/Codex.app/Contents/Resources/codex` पर
फ़ॉलबैक करता है। यह उन एकबारगी Computer Use स्थिति और
इंस्टॉल कमांड पर भी लागू होता है, जो अपना क्लाइंट शुरू करते हैं। इससे डेस्कटॉप नियंत्रण
उस ऐप बंडल के अधीन रहता है जिसके पास स्थानीय macOS अनुमतियाँ हैं। यदि डेस्कटॉप ऐप
इंस्टॉल नहीं है, तो OpenClaw plugin के साथ इंस्टॉल किए गए प्रबंधित Codex बाइनरी पर फ़ॉलबैक करता है।
डिफ़ॉल्ट पृथक एजेंट होम वाले सामान्य प्रबंधित Codex टर्न पहले उस पिन किए गए पैकेज को प्राथमिकता देते हैं,
ताकि कोई पुराना डेस्कटॉप ऐप मौजूदा मॉडल समर्थन को ओझल न कर सके। उपयोगकर्ता-स्कोप वाले होम
डेस्कटॉप-प्रथम बने रहते हैं, क्योंकि वे नेटिव Computer Use स्थिति लोड कर सकते हैं। ऐसा पृथक एजेंट होम,
जिसका प्रभावी Codex कॉन्फ़िगरेशन Computer Use सक्षम करता है, भी डेस्कटॉप-प्रथम बना रहता है। स्पष्ट
`appServer.command` कॉन्फ़िगरेशन या `OPENCLAW_CODEX_APP_SERVER_BIN` अब भी
इस प्रबंधित चयन को ओवरराइड करता है।

OpenClaw एक चल रहे Gateway के भीतर नेटिव Codex कॉन्फ़िगरेशन रीड और Computer Use इंस्टॉलेशन को
क्रमिक रूप से निष्पादित करता है। कोई अलग Codex प्रक्रिया या दूसरा Gateway
उस सुरक्षा-सीमा का हिस्सा नहीं है। Gateway के बाहर नेटिव Codex plugin कॉन्फ़िगरेशन बदलने के बाद,
नए चयन पर निर्भर होने से पहले Gateway पुनः आरंभ करें और नई चैट शुरू करें।

## कमांड

किसी भी ऐसे चैट इंटरफ़ेस से `/codex computer-use` कमांड का उपयोग करें जहाँ
`codex` plugin कमांड सतह उपलब्ध हो। ये OpenClaw चैट/रनटाइम
कमांड हैं, `openclaw codex ...` CLI उपकमांड नहीं:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` डिफ़ॉल्ट क्रिया है और केवल-पठन है: यह मार्केटप्लेस
स्रोत नहीं जोड़ती, plugin इंस्टॉल नहीं करती, या Codex plugin समर्थन सक्षम नहीं करती। यदि कोई कॉन्फ़िगरेशन
Computer Use को सक्रिय नहीं करता, तो एकबारगी इंस्टॉल कमांड के बाद भी `status`
अक्षम स्थिति रिपोर्ट कर सकता है।

`install`, Codex app-server plugin समर्थन सक्षम करता है, वैकल्पिक रूप से
कॉन्फ़िगर किया गया मार्केटप्लेस स्रोत जोड़ता है, Codex app-server के माध्यम से कॉन्फ़िगर किया गया plugin
इंस्टॉल या पुनः सक्षम करता है, MCP सर्वर रीलोड करता है, और सत्यापित करता है कि MCP
सर्वर टूल उपलब्ध कराता है। चूँकि इंस्टॉलेशन विश्वसनीय होस्ट संसाधनों को बदलता है,
केवल स्वामी या `operator.admin` Gateway क्लाइंट ही `install` चला सकता है। अन्य
अधिकृत प्रेषक ओवरराइड सहित केवल-पठन `status` कमांड का उपयोग जारी रख सकते हैं।

पुराने रिलीज़ एकबारगी `--plugin`, `--server`, और `--mcp-server`
पहचान ओवरराइड स्वीकार करते थे। इसके बजाय `computerUse.pluginName` और
`computerUse.mcpServerName` को स्थायी रूप से कॉन्फ़िगर करें। जब किसी पुराने पहचान फ़्लैग का
उपयोग किया जाता है, तो कमांड स्थायी रूप से कॉन्फ़िगर की जाने वाली सटीक सेटिंग बताता है और अपने
माइग्रेशन मार्गदर्शन में अनुरोधित क्रिया तथा सभी समर्थित मार्केटप्लेस फ़्लैग दोहराता है।

## मार्केटप्लेस विकल्प

OpenClaw उसी app-server API का उपयोग करता है जिसे Codex स्वयं उपलब्ध कराता है।
मार्केटप्लेस फ़ील्ड यह चुनते हैं कि Codex को `computer-use` कहाँ ढूँढना चाहिए।

| फ़ील्ड                | कब उपयोग करें                                                        | इंस्टॉलेशन समर्थन                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| कोई मार्केटप्लेस फ़ील्ड नहीं | आप चाहते हैं कि Codex app-server उन मार्केटप्लेस का उपयोग करे जिन्हें वह पहले से जानता है। | हाँ, जब app-server कोई स्थानीय मार्केटप्लेस लौटाता है।        |
| `marketplaceSource`  | आपके पास ऐसा Codex मार्केटप्लेस स्रोत है जिसे app-server जोड़ सकता है।         | हाँ, स्पष्ट `/codex computer-use install` के लिए।         |
| `marketplacePath`    | आप होस्ट पर स्थानीय मार्केटप्लेस फ़ाइल पथ पहले से जानते हैं।   | हाँ, स्पष्ट इंस्टॉल और टर्न-प्रारंभ स्वतः-इंस्टॉल के लिए।   |
| `marketplaceName`    | आप पहले से रजिस्टर किए गए किसी मार्केटप्लेस को नाम से चुनना चाहते हैं।  | केवल तब हाँ, जब चुने गए मार्केटप्लेस का स्थानीय पथ हो। |

नए Codex होम को अपने आधिकारिक
मार्केटप्लेस आरंभ करने के लिए थोड़ा समय लग सकता है। इंस्टॉलेशन के दौरान, OpenClaw
`plugin/list` को अधिकतम `marketplaceDiscoveryTimeoutMs` मिलीसेकंड तक पोल करता है
(डिफ़ॉल्ट 60 सेकंड)।

यदि एक से अधिक ज्ञात मार्केटप्लेस में Computer Use मौजूद है, तो OpenClaw पहले
`openai-bundled`, फिर `openai-curated`, और फिर `local` को प्राथमिकता देता है। अज्ञात अस्पष्ट
मिलानों पर यह सुरक्षित रूप से विफल होता है और आपसे `marketplaceName` या
`marketplacePath` सेट करने को कहता है।

## बंडल किया गया macOS मार्केटप्लेस

वर्तमान ChatGPT डेस्कटॉप बिल्ड यहाँ Computer Use बंडल करते हैं; पुराने स्टैंडअलोन
Codex डेस्कटॉप बिल्ड `Codex.app` के अंतर्गत इसी लेआउट का उपयोग करते हैं:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

जब `computerUse.autoInstall` true हो और `computer-use` वाला कोई
मार्केटप्लेस रजिस्टर न हो, तो OpenClaw मौजूद प्रथम मानक
बंडल किए गए मार्केटप्लेस रूट को जोड़ने का प्रयास करता है:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

आप इसे Codex के साथ शेल से भी स्पष्ट रूप से रजिस्टर कर सकते हैं:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

यदि आप गैर-मानक Codex ऐप पथ का उपयोग करते हैं, तो `/codex computer-use install
--source <marketplace-root>` एक बार चलाएँ, या `computerUse.marketplacePath` को
स्थानीय मार्केटप्लेस फ़ाइल पथ पर सेट करें। `--marketplace-path` का उपयोग केवल तब करें जब आपके पास
मार्केटप्लेस JSON फ़ाइल पथ हो, बंडल किया गया मार्केटप्लेस रूट नहीं।

### साझा plugin कैश

डिफ़ॉल्ट `pluginCacheMode: "independent"` प्रत्येक Codex होम और उसके
plugin कैश को अप्रबंधित छोड़ता है। app-server स्टार्टअप से पहले बंडल किए गए
Computer Use plugin को सक्रिय Codex होम के खोजयोग्य plugin कैश में कॉपी करने के लिए `pluginCacheMode: "shared"` सेट करें।
साझा मोड पुराने कैश किए गए संस्करणों को सुरक्षित रखता है, क्योंकि
चल रहे Codex क्लाइंट अभी भी अपने संस्करणयुक्त plugin डायरेक्टरी का संदर्भ ले सकते हैं; विफल
प्रतिस्थापन कॉपी भी सक्रिय कैश को सुरक्षित रखती है। स्पष्ट
`marketplaceName` या `marketplacePath` कॉन्फ़िगरेशन इस
समन्वयन को अक्षम करता है, ताकि OpenClaw उस चयन को ओवरराइड न करे।

## रिमोट कैटलॉग सीमा

Codex app-server केवल-रिमोट कैटलॉग प्रविष्टियों को सूचीबद्ध और पढ़ सकता है, लेकिन यह
वर्तमान में रिमोट `plugin/install` का समर्थन नहीं करता। इसका अर्थ है कि `marketplaceName`
स्थिति जाँच के लिए केवल-रिमोट मार्केटप्लेस चुन सकता है, लेकिन इंस्टॉलेशन और
पुनः-सक्षमीकरण के लिए अब भी `marketplaceSource` या
`marketplacePath` के माध्यम से स्थानीय मार्केटप्लेस आवश्यक है।

यदि स्थिति बताती है कि plugin किसी रिमोट Codex मार्केटप्लेस में उपलब्ध है, लेकिन
रिमोट इंस्टॉलेशन समर्थित नहीं है, तो स्थानीय स्रोत या पथ के साथ इंस्टॉल चलाएँ:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## कॉन्फ़िगरेशन संदर्भ

| फ़ील्ड                           | डिफ़ॉल्ट        | अर्थ                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | अनुमानित       | Computer Use आवश्यक करें। किसी अन्य Computer Use फ़ील्ड के सेट होने पर डिफ़ॉल्ट रूप से true होता है। |
| `autoInstall`                   | false          | टर्न शुरू होने पर पहले से खोजे गए मार्केटप्लेस से इंस्टॉल या फिर से सक्षम करें।       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Codex app-server द्वारा मार्केटप्लेस खोजे जाने के लिए इंस्टॉल कितनी देर प्रतीक्षा करता है।             |
| `liveTestTimeoutMs`             | 60000          | अस्थायी तत्परता थ्रेड और उसके क्लीनअप अनुरोधों की समय-सीमा।           |
| `toolCallTimeoutMs`             | 60000          | Computer Use `list_apps` तत्परता टूल कॉल की समय-सीमा।                  |
| `healthCheckEnabled`            | false          | स्वामी app-server क्लाइंट के सक्रिय रहने के दौरान समय-समय पर तत्परता जाँच चलाएँ।    |
| `healthCheckIntervalMinutes`    | 60             | जाँच की आवृत्ति; स्वीकृत मान 30, 60, 120 या 240 मिनट हैं।                |
| `pluginCacheMode`               | `independent`  | बंडल किए गए डेस्कटॉप Plugin से Codex-home कैश रीफ़्रेश करने के लिए `shared` का उपयोग करें।  |
| `strictReadiness`               | false          | चेतावनी के साथ जारी रखने के बजाय विफल लाइव जाँच पर स्टार्टअप रोकें।      |
| `autoRepair`                    | false          | पुराने स्कोप किए गए Computer Use MCP चाइल्ड प्रोसेस समाप्त करें और विफल जाँच का एक बार पुनः प्रयास करें।     |
| `marketplaceSource`             | सेट नहीं          | Codex app-server `marketplace/add` को दी जाने वाली स्रोत स्ट्रिंग।                    |
| `marketplacePath`               | सेट नहीं          | Plugin वाली स्थानीय Codex मार्केटप्लेस फ़ाइल का पथ।                       |
| `marketplaceName`               | सेट नहीं          | चुनने के लिए पंजीकृत Codex मार्केटप्लेस नाम।                                   |
| `pluginName`                    | `computer-use` | Codex मार्केटप्लेस Plugin का नाम।                                                 |
| `mcpServerName`                 | `computer-use` | इंस्टॉल किए गए Plugin द्वारा उपलब्ध कराया गया MCP सर्वर नाम।                               |

टर्न-स्टार्ट ऑटो-इंस्टॉल जानबूझकर कॉन्फ़िगर किए गए `marketplaceSource`
मानों को अस्वीकार करता है। नया स्रोत जोड़ना एक स्पष्ट सेटअप कार्रवाई है, इसलिए
`/codex computer-use install --source <marketplace-source>` का एक बार उपयोग करें, फिर खोजे गए स्थानीय मार्केटप्लेस से
भविष्य में फिर से सक्षम करने का काम `autoInstall` को करने दें।
टर्न-स्टार्ट ऑटो-इंस्टॉल कॉन्फ़िगर किए गए `marketplacePath` का उपयोग कर सकता है, क्योंकि वह
होस्ट पर पहले से ही एक स्थानीय पथ है।

हर फ़ील्ड एक पर्यावरण चर ओवरराइड भी स्वीकार करता है, जिसकी जाँच तब की जाती है जब
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

OpenClaw आंतरिक रूप से एक स्थिर सेटअप कारण रिपोर्ट करता है और
चैट के लिए उपयोगकर्ता-दृश्य स्थिति को प्रारूपित करता है:

| कारण                       | अर्थ                                                | अगला चरण                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` का परिणाम false आया।               | `enabled` या कोई अन्य Computer Use फ़ील्ड सेट करें।  |
| `marketplace_missing`        | कोई मेल खाता मार्केटप्लेस उपलब्ध नहीं था।                 | स्रोत, पथ या मार्केटप्लेस नाम कॉन्फ़िगर करें।  |
| `plugin_not_installed`       | मार्केटप्लेस मौजूद है, लेकिन Plugin इंस्टॉल नहीं है।   | इंस्टॉल चलाएँ या `autoInstall` सक्षम करें।          |
| `plugin_disabled`            | Plugin इंस्टॉल है, लेकिन Codex कॉन्फ़िगरेशन में अक्षम है।      | इसे फिर से सक्षम करने के लिए इंस्टॉल चलाएँ।                  |
| `remote_install_unsupported` | चयनित मार्केटप्लेस केवल रिमोट है।                   | `marketplaceSource` या `marketplacePath` का उपयोग करें। |
| `mcp_missing`                | Plugin सक्षम है, लेकिन MCP सर्वर अनुपलब्ध है।  | Codex Computer Use और OS अनुमतियाँ जाँचें।  |
| `ready`                      | Plugin और MCP टूल उपलब्ध हैं।                    | Codex-मोड टर्न शुरू करें।                    |
| `check_failed`               | स्थिति जाँच के दौरान Codex app-server अनुरोध विफल हुआ। | app-server कनेक्टिविटी और लॉग जाँचें।       |
| `auto_install_blocked`       | टर्न-स्टार्ट सेटअप के लिए नया स्रोत जोड़ना आवश्यक होगा।       | पहले स्पष्ट रूप से इंस्टॉल चलाएँ।                   |

चैट आउटपुट में Plugin की स्थिति, MCP सर्वर की स्थिति, मार्केटप्लेस,
उपलब्ध होने पर टूल और विफल सेटअप चरण के लिए विशिष्ट संदेश शामिल होते हैं।

## macOS अनुमतियाँ

Computer Use केवल macOS के लिए है। Codex के स्वामित्व वाले MCP सर्वर को ऐप्स का
निरीक्षण या नियंत्रण करने से पहले स्थानीय OS अनुमतियों की आवश्यकता हो सकती है। यदि OpenClaw कहता है कि Computer
Use इंस्टॉल है, लेकिन MCP सर्वर अनुपलब्ध है, तो पहले Codex की ओर का
Computer Use सेटअप सत्यापित करें:

- Codex app-server उसी होस्ट पर चल रहा है जहाँ डेस्कटॉप नियंत्रण
  होना चाहिए।
- Computer Use Plugin Codex कॉन्फ़िगरेशन में सक्षम है।
- `computer-use` MCP सर्वर Codex app-server की MCP स्थिति में दिखाई देता है।
- macOS ने डेस्कटॉप-नियंत्रण ऐप के लिए आवश्यक अनुमतियाँ प्रदान की हैं।
- वर्तमान होस्ट सत्र नियंत्रित किए जा रहे डेस्कटॉप तक पहुँच सकता है।

`computerUse.enabled` के true होने पर OpenClaw जानबूझकर विफल होकर बंद हो जाता है।
Codex-मोड टर्न को कॉन्फ़िगरेशन द्वारा आवश्यक मूल डेस्कटॉप टूल के बिना
चुपचाप आगे नहीं बढ़ना चाहिए।

## समस्या निवारण

**स्थिति कहती है कि इंस्टॉल नहीं है।** `/codex computer-use install` चलाएँ। यदि
मार्केटप्लेस खोजा नहीं जाता है, तो `--source` या `--marketplace-path` दें।

**स्थिति कहती है कि इंस्टॉल है लेकिन अक्षम है।** `/codex computer-use install`
फिर से चलाएँ। Codex app-server इंस्टॉल Plugin कॉन्फ़िगरेशन को वापस सक्षम स्थिति में लिखता है।

**स्थिति कहती है कि रिमोट इंस्टॉल समर्थित नहीं है।** स्थानीय मार्केटप्लेस
स्रोत या पथ का उपयोग करें। केवल-रिमोट कैटलॉग प्रविष्टियों का निरीक्षण किया जा सकता है, लेकिन उन्हें
वर्तमान app-server API के माध्यम से इंस्टॉल नहीं किया जा सकता।

**स्थिति कहती है कि MCP सर्वर अनुपलब्ध है।** MCP
सर्वरों को फिर से लोड करने के लिए इंस्टॉल एक बार फिर चलाएँ। यदि वह अनुपलब्ध रहता है, तो Codex Computer Use ऐप,
Codex app-server MCP स्थिति या macOS अनुमतियाँ ठीक करें।

**`computer-use.list_apps` पर स्थिति या जाँच की समय-सीमा समाप्त हो जाती है।** Plugin और
MCP सर्वर मौजूद हैं, लेकिन स्थानीय Computer Use ब्रिज ने उत्तर नहीं दिया।
Codex Computer Use बंद करें या पुनः आरंभ करें, आवश्यकता होने पर Codex Desktop फिर से लॉन्च करें, फिर
नए OpenClaw सत्र में पुनः प्रयास करें। यदि होस्ट पहले किसी पुराने प्रबंधित Codex app-server के माध्यम से Computer Use
चलाता था, तो इंस्टॉल किए गए Plugin को डेस्कटॉप के साथ बंडल किए गए मार्केटप्लेस से
रीफ़्रेश करें (स्वतंत्र Codex डेस्कटॉप इंस्टॉल के लिए `Codex.app` पथ का उपयोग करें):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use टूल कहता है `Native hook relay unavailable`।** Codex-मूल
टूल हुक स्थानीय ब्रिज या Gateway फ़ॉलबैक के माध्यम से सक्रिय OpenClaw रिले तक नहीं पहुँच सका।
`/new` या `/reset` के साथ नया OpenClaw सत्र शुरू करें। यदि यह एक बार काम करता है
और बाद की किसी टूल कॉल पर फिर विफल हो जाता है, तो `/new` केवल वर्तमान प्रयास साफ़ कर रहा है;
Codex app-server या OpenClaw Gateway पुनः आरंभ करें ताकि पुराने थ्रेड और हुक पंजीकरण
हटा दिए जाएँ, फिर नए सत्र में पुनः प्रयास करें।

**टर्न-स्टार्ट ऑटो-इंस्टॉल किसी स्रोत को अस्वीकार करता है।** यह जानबूझकर है। पहले स्पष्ट
`/codex computer-use install --source
<marketplace-source>` से स्रोत जोड़ें, फिर भविष्य का टर्न-स्टार्ट ऑटो-इंस्टॉल
खोजे गए स्थानीय मार्केटप्लेस का उपयोग कर सकता है।

## संबंधित

- [Codex हार्नेस](/hi/plugins/codex-harness)
- [Peekaboo ब्रिज](/hi/platforms/mac/peekaboo)
- [iOS ऐप](/hi/platforms/ios)
