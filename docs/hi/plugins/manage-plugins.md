---
doc-schema-version: 1
read_when:
    - आप Control UI में plugins ब्राउज़, इंस्टॉल, सक्षम या अक्षम करना चाहते हैं
    - आप Plugin की सूची देखने, इंस्टॉल करने, अपडेट करने, निरीक्षण करने या अनइंस्टॉल करने के त्वरित उदाहरण चाहते हैं
    - आप Plugin इंस्टॉल करने का स्रोत चुनना चाहते हैं
    - आप Plugin पैकेज प्रकाशित करने के लिए सही संदर्भ चाहते हैं
sidebarTitle: Manage plugins
summary: Control UI या CLI से OpenClaw plugins प्रबंधित करें
title: Plugin प्रबंधित करें
x-i18n:
    generated_at: "2026-07-16T16:06:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI सामान्य खोज, इंस्टॉल, सक्षम और अक्षम करने के
वर्कफ़्लो को कवर करता है। CLI अपडेट, अनइंस्टॉल, उन्नत कॉन्फ़िगरेशन और स्पष्ट
इंस्टॉल-स्रोत नियंत्रण जोड़ता है। इसके पूर्ण कमांड अनुबंध, फ़्लैग, स्रोत-चयन
नियमों और विशेष स्थितियों के लिए, [`openclaw plugins`](/hi/cli/plugins) देखें।

सामान्य CLI वर्कफ़्लो: कोई पैकेज खोजें, उसे ClawHub, npm, git या किसी
स्थानीय पथ से इंस्टॉल करें, प्रबंधित Gateway को स्वतः पुनरारंभ होने दें (या उसे मैन्युअल रूप से पुनरारंभ करें), फिर
Plugin के रनटाइम पंजीकरण सत्यापित करें।

## Control UI का उपयोग करें

Control UI में **Plugins** खोलें, या कॉन्फ़िगर किए गए Control UI आधार पथ के सापेक्ष
`/settings/plugins` का उपयोग करें। उदाहरण के लिए, `/openclaw` आधार पथ
`/openclaw/settings/plugins` का उपयोग करता है। पृष्ठ में दो टैब हैं:

- **इंस्टॉल किए गए** श्रेणी के अनुसार समूहीकृत पूरी स्थानीय सूची दिखाता है (चैनल,
  मॉडल प्रदाता, मेमोरी, टूल)। प्रत्येक पंक्ति एक विस्तृत दृश्य खोलती है; उसका ओवरफ़्लो
  (`…`) मेन्यू Plugin को सक्षम या अक्षम करता है और बाहरी रूप से इंस्टॉल किए गए
  Plugins के लिए **हटाएँ** विकल्प देता है। यह टैब समान मेन्यू-आधारित सक्षम, अक्षम और हटाने की
  कार्रवाइयों के साथ कॉन्फ़िगर किए गए [MCP सर्वर](/hi/cli/mcp) भी सूचीबद्ध करता है,
  जो Gateway कॉन्फ़िगरेशन में `mcp.servers` को संपादित करता है।
- **खोजें** स्टोर है: OpenClaw में शामिल विशेष Plugins, आधिकारिक
  बाहरी Plugins और क्यूरेट किया गया कनेक्टर संग्रह। कनेक्टर कार्ड या तो एक क्लिक में
  होस्ट किया गया MCP सर्वर जोड़ते हैं (GitHub, Notion, Linear, Sentry,
  Home Assistant) या पहले से भरी हुई ClawHub खोज पर ले जाते हैं। खोज
  बॉक्स में टाइप करने पर [ClawHub](https://clawhub.ai/plugins) में इनलाइन क्वेरी की जाती है और डाउनलोड संख्या तथा स्रोत-सत्यापन बैज वाला
  **ClawHub से** अनुभाग जोड़ा जाता है।

शामिल Plugins के लिए पैकेज इंस्टॉल करने की आवश्यकता नहीं होती। उनकी मेन्यू कार्रवाई **सक्षम करें**
या **अक्षम करें** होती है। उदाहरण के लिए, Workboard OpenClaw में शामिल है और डिफ़ॉल्ट रूप से
अक्षम रहता है, इसलिए उसे चालू करने के लिए **सक्षम करें** चुनें। बंडल किए गए Plugins को
हटाया नहीं जा सकता, केवल अक्षम किया जा सकता है।

कैटलॉग और खोज की पहुँच के लिए `operator.read` आवश्यक है। इंस्टॉल, सक्षम, अक्षम,
हटाने और MCP सर्वर में परिवर्तन के लिए `operator.admin` आवश्यक है। ClawHub इंस्टॉल
Gateway द्वारा किया जाता है और उसके विश्वास, अखंडता तथा Plugin-इंस्टॉल
नीति जाँचों को बनाए रखता है। किसी इंस्टॉल किए गए Plugin को व्यवस्थापक के रूप में सक्षम करने पर
चयनित Plugin को मौजूदा प्रतिबंधात्मक
`plugins.allow` सूची में जोड़कर उस स्पष्ट विश्वास को भी दर्ज किया जाता है। स्पष्ट `plugins.deny` प्रविष्टि प्रामाणिक बनी रहती है और
Plugin को सक्षम करने से पहले उसे हटाना आवश्यक है।

Plugin कोड इंस्टॉल करने या हटाने के लिए Gateway पुनरारंभ करना आवश्यक है। सक्षमता
परिवर्तनों को बिना पुनरारंभ किए लागू किया जा सकता है, बशर्ते इंस्टॉल किया गया Plugin और वर्तमान
Gateway रनटाइम इसका समर्थन करते हों; अन्यथा UI बताता है कि पुनरारंभ आवश्यक है।
OAuth-समर्थित MCP कनेक्टर जोड़े जाने के बाद भी CLI से एक बार `openclaw mcp login <name>`
की आवश्यकता होती है।

Control UI मनमाने npm, git या स्थानीय-पथ स्रोतों से इंस्टॉल नहीं करता,
Plugins अपडेट नहीं करता और विस्तृत Plugin कॉन्फ़िगरेशन उपलब्ध नहीं कराता। उन कार्रवाइयों के लिए
नीचे दिए गए CLI वर्कफ़्लो का उपयोग करें।

## Plugins सूचीबद्ध करें और खोजें

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

स्क्रिप्ट के लिए `--json`:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` एक कोल्ड इन्वेंट्री जाँच है: OpenClaw कॉन्फ़िगरेशन,
मैनिफ़ेस्ट और स्थायी Plugin रजिस्ट्री से क्या खोज सकता है। यह प्रमाणित नहीं करता कि
पहले से चल रहे Gateway ने Plugin रनटाइम आयात किया है। JSON आउटपुट में
रजिस्ट्री निदान और प्रत्येक Plugin का `dependencyStatus` शामिल होता है (क्या घोषित
`dependencies`/`optionalDependencies` डिस्क पर उपलब्ध हैं)।

`plugins search` इंस्टॉल किए जा सकने वाले Plugin पैकेजों के लिए ClawHub से क्वेरी करता है और
प्रत्येक परिणाम के लिए एक इंस्टॉल संकेत (`openclaw plugins install clawhub:<package>`) प्रिंट करता है।

## Plugins सक्षम और अक्षम करें

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

इंस्टॉल की गई फ़ाइलों को छुए बिना Plugin की कॉन्फ़िगरेशन प्रविष्टि को टॉगल करता है। कुछ
बंडल किए गए Plugins (बंडल किए गए मॉडल/स्पीच प्रदाता और बंडल किया गया ब्राउज़र Plugin)
डिफ़ॉल्ट रूप से सक्षम होते हैं; अन्य के लिए इंस्टॉल के बाद `enable` आवश्यक है।

## Plugins इंस्टॉल करें

```bash
# Plugin पैकेजों के लिए ClawHub खोजें।
openclaw plugins search "calendar"

# ClawHub से इंस्टॉल करें।
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# npm से इंस्टॉल करें।
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# स्थानीय npm-pack आर्टिफ़ैक्ट से इंस्टॉल करें।
openclaw plugins install npm-pack:<path.tgz>

# git या स्थानीय विकास चेकआउट से इंस्टॉल करें।
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

लॉन्च कटओवर के दौरान बिना उपसर्ग वाले पैकेज विनिर्देश npm से इंस्टॉल होते हैं, जब तक
नाम किसी बंडल किए गए या आधिकारिक Plugin id से मेल न खाता हो; ऐसी स्थिति में OpenClaw
उस स्थानीय/आधिकारिक प्रति का उपयोग करता है। नियतात्मक स्रोत चयन के लिए `clawhub:`, `npm:`, `git:` या
`npm-pack:` का उपयोग करें। OpenClaw के बंडल किए गए और आधिकारिक
कैटलॉग पैकेजों को ClawHub पैकेजों के साथ विश्वसनीय माना जाता है। नए मनमाने npm,
git, स्थानीय पथ/आर्काइव, `npm-pack:` या मार्केटप्लेस स्रोतों के लिए
स्रोत की समीक्षा और उस पर विश्वास करने के बाद गैर-इंटरैक्टिव इंस्टॉल में
`--force` आवश्यक है।

`--force` बिना संकेत माँगे गैर-ClawHub स्रोत की पुष्टि करता है और
आवश्यकता होने पर मौजूदा इंस्टॉल लक्ष्य को अधिलेखित करता है। ट्रैक किए गए npm,
ClawHub या hook-pack इंस्टॉल के नियमित अपग्रेड के लिए इसके बजाय `openclaw plugins update` का उपयोग करें।
`--link` के साथ, `--force` केवल स्रोत की पुष्टि करता है; लिंक की गई निर्देशिका को
कॉपी या अधिलेखित नहीं किया जाता।

## पुनरारंभ और निरीक्षण करें

कॉन्फ़िगरेशन रीलोड सक्षम होने पर चल रहा प्रबंधित Gateway, Plugin कोड इंस्टॉल,
अपडेट या अनइंस्टॉल करने के बाद अपने आप पुनरारंभ हो जाता है। यदि Gateway
अप्रबंधित है या रीलोड अक्षम है, तो लाइव रनटाइम सतहों की जाँच करने से पहले उसे
स्वयं पुनरारंभ करें:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` Plugin मॉड्यूल लोड करता है और प्रमाणित करता है कि उसने रनटाइम
सतहें पंजीकृत की हैं (टूल, हुक, सेवाएँ, Gateway विधियाँ, HTTP रूट, Plugin-स्वामित्व वाले
CLI कमांड)। साधारण `inspect` और `list` केवल कोल्ड मैनिफ़ेस्ट/कॉन्फ़िगरेशन/रजिस्ट्री
जाँच हैं।

## Plugins अपडेट करें

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Plugin id देने पर उसके ट्रैक किए गए इंस्टॉल विनिर्देश का पुनः उपयोग होता है: संग्रहित dist-tags
(`@beta`) और सटीक पिन किए गए संस्करण बाद के `update <plugin-id>`
रन में बने रहते हैं।

`openclaw plugins update --all` सामूहिक रखरखाव का मार्ग है। यह फिर भी
सामान्य ट्रैक किए गए इंस्टॉल विनिर्देशों का सम्मान करता है, लेकिन विश्वसनीय आधिकारिक OpenClaw
Plugin रिकॉर्ड किसी पुराने सटीक आधिकारिक पैकेज पर पिन रहने के बजाय
वर्तमान आधिकारिक कैटलॉग लक्ष्य से सिंक होते हैं; जब `update.channel`
`beta` होता है, तो वह सिंक बीटा रिलीज़ लाइन को प्राथमिकता देता है। किसी सटीक या टैग किए गए आधिकारिक विनिर्देश को अपरिवर्तित रखने के लिए लक्षित
`update <plugin-id>` का उपयोग करें।

npm इंस्टॉल के लिए ट्रैक किए गए रिकॉर्ड को बदलने हेतु स्पष्ट पैकेज विनिर्देश दें:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

दूसरा कमांड किसी Plugin को रजिस्ट्री की डिफ़ॉल्ट रिलीज़
लाइन पर वापस ले जाता है, यदि वह पहले किसी सटीक संस्करण या टैग पर पिन था।

सटीक फ़ॉलबैक और पिनिंग नियमों के लिए [`openclaw plugins`](/hi/cli/plugins#update)
देखें।

## Plugins अनइंस्टॉल करें

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

अनइंस्टॉल करने पर Plugin की कॉन्फ़िगरेशन प्रविष्टि, स्थायी Plugin इंडेक्स रिकॉर्ड,
अनुमति/निषेध सूची प्रविष्टियाँ और लागू होने पर लिंक की गई `plugins.load.paths` प्रविष्टियाँ
हटा दी जाती हैं। प्रबंधित इंस्टॉल निर्देशिका हटा दी जाती है, जब तक आप
`--keep-files` न दें। अनइंस्टॉल से Plugin स्रोत बदलने पर चल रहा प्रबंधित Gateway
अपने आप पुनरारंभ हो जाता है।

Nix मोड (`OPENCLAW_NIX_MODE=1`) में Plugin इंस्टॉल, अपडेट, अनइंस्टॉल,
सक्षम और अक्षम करना, सभी अक्षम होते हैं; इसके बजाय इंस्टॉल के Nix स्रोत में
इन विकल्पों को प्रबंधित करें।

## स्रोत चुनें

| स्रोत       | कब उपयोग करें                                                               | उदाहरण                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | जब आपको OpenClaw-मूल खोज, स्कैन सारांश, संस्करण और संकेत चाहिए             | `openclaw plugins install clawhub:<package>`                   |
| git         | जब आपको किसी रिपॉज़िटरी से ब्रांच, टैग या कमिट चाहिए                        | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| स्थानीय पथ | जब आप उसी मशीन पर किसी Plugin का विकास या परीक्षण कर रहे हों               | `openclaw plugins install --link ./my-plugin`                  |
| मार्केटप्लेस | जब आप Claude-संगत मार्केटप्लेस Plugin इंस्टॉल कर रहे हों                   | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | जब आप npm इंस्टॉल अर्थ-विज्ञान के माध्यम से स्थानीय पैकेज आर्टिफ़ैक्ट प्रमाणित कर रहे हों | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | जब आप पहले से JavaScript पैकेज वितरित करते हों या npm dist-tags/निजी रजिस्ट्री की आवश्यकता हो | `openclaw plugins install npm:@acme/openclaw-plugin`           |

प्रबंधित स्थानीय पथ इंस्टॉल Plugin निर्देशिकाएँ या आर्काइव होने चाहिए। स्वतंत्र
Plugin फ़ाइलों को `plugins install` से इंस्टॉल करने के बजाय
`plugins.load.paths` में रखें।

## Plugins प्रकाशित करें

ClawHub, OpenClaw Plugins के लिए प्राथमिक सार्वजनिक खोज सतह है। जब आप चाहते हैं कि
उपयोगकर्ता इंस्टॉल करने से पहले Plugin मेटाडेटा, संस्करण इतिहास, रजिस्ट्री
स्कैन परिणाम और इंस्टॉल संकेत खोज सकें, तो वहाँ प्रकाशित करें।

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

मूल npm Plugins को प्रकाशित करने से पहले Plugin मैनिफ़ेस्ट (`openclaw.plugin.json`) और
`package.json` मेटाडेटा प्रदान करना आवश्यक है:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

इस पृष्ठ को प्रकाशन संदर्भ मानने के बजाय पूर्ण प्रकाशन अनुबंध के लिए इन पृष्ठों का उपयोग करें:

- [ClawHub प्रकाशन](/hi/clawhub/publishing) स्वामियों, स्कोप,
  रिलीज़, समीक्षा, पैकेज सत्यापन और पैकेज हस्तांतरण की व्याख्या करता है।
- [Plugins बनाना](/hi/plugins/building-plugins) संपूर्ण Plugin
  पैकेज संरचना (`openclaw.plugin.json` सहित) और पहला प्रकाशन
  वर्कफ़्लो दिखाता है।
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) मूल Plugin मैनिफ़ेस्ट
  फ़ील्ड परिभाषित करता है।

यदि समान पैकेज ClawHub और npm दोनों पर उपलब्ध है, तो किसी एक स्रोत को बाध्य करने के लिए स्पष्ट
`clawhub:` या `npm:` उपसर्ग का उपयोग करें।

## संबंधित

- [Plugins](/hi/tools/plugin) - इंस्टॉल, कॉन्फ़िगर, पुनरारंभ और समस्या निवारण
- [`openclaw plugins`](/hi/cli/plugins) - संपूर्ण CLI संदर्भ
- [सामुदायिक Plugins](/hi/plugins/community) - सार्वजनिक खोज और ClawHub प्रकाशन
- [ClawHub](/hi/clawhub/cli) - रजिस्ट्री CLI कार्रवाइयाँ
- [Plugins बनाना](/hi/plugins/building-plugins) - Plugin पैकेज बनाएँ
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - मैनिफ़ेस्ट और पैकेज मेटाडेटा
