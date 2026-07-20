---
read_when:
    - आप Gateway Plugins या संगत बंडल इंस्टॉल या प्रबंधित करना चाहते हैं
    - आप एक सरल टूल Plugin का ढाँचा बनाना या उसे सत्यापित करना चाहते हैं
    - आप Plugin लोड होने में विफलताओं को डीबग करना चाहते हैं
sidebarTitle: Plugins
summary: '`openclaw plugins` के लिए CLI संदर्भ (आरंभ करना, बिल्ड करना, सत्यापित करना, सूचीबद्ध करना, इंस्टॉल करना, मार्केटप्लेस, अनइंस्टॉल करना, सक्षम/अक्षम करना, निदान करना)'
title: Plugins
x-i18n:
    generated_at: "2026-07-20T06:47:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8db98bf732151009ca09a38c0f56d6e9feb185812196fdfa946bc0949aa09d1f
    source_path: cli/plugins.md
    workflow: 16
---

Gateway plugins, हुक पैक और संगत बंडलों को प्रबंधित करें।

<CardGroup cols={2}>
  <Card title="Plugin प्रणाली" href="/hi/tools/plugin">
    plugins को इंस्टॉल, सक्षम और समस्या-निवारण करने के लिए अंतिम-उपयोगकर्ता मार्गदर्शिका।
  </Card>
  <Card title="plugins प्रबंधित करें" href="/hi/plugins/manage-plugins">
    इंस्टॉल करने, सूचीबद्ध करने, अपडेट करने, अनइंस्टॉल करने और प्रकाशित करने के त्वरित उदाहरण।
  </Card>
  <Card title="Plugin बंडल" href="/hi/plugins/bundles">
    बंडल संगतता मॉडल।
  </Card>
  <Card title="Plugin मैनिफ़ेस्ट" href="/hi/plugins/manifest">
    मैनिफ़ेस्ट फ़ील्ड और कॉन्फ़िग स्कीमा।
  </Card>
  <Card title="सुरक्षा" href="/hi/gateway/security">
    Plugin इंस्टॉलेशन के लिए सुरक्षा सुदृढ़ीकरण।
  </Card>
</CardGroup>

## कमांड

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # inspect का उपनाम
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

धीमे इंस्टॉलेशन, निरीक्षण, अनइंस्टॉलेशन या रजिस्ट्री-रीफ़्रेश की जाँच के लिए, कमांड को
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` के साथ चलाएँ। ट्रेस चरणों का समय stderr में लिखता है
और JSON आउटपुट को पार्स करने योग्य रखता है। [डीबगिंग](/hi/help/debugging#plugin-lifecycle-trace) देखें।

<Note>
Nix मोड (`OPENCLAW_NIX_MODE=1`) में, `openclaw.json` अपरिवर्तनीय है। `install`, `update`, `uninstall`, `enable` और `disable` सभी चलने से इनकार करते हैं। इसके बजाय इस इंस्टॉलेशन के लिए Nix स्रोत संपादित करें (nix-openclaw के लिए `programs.openclaw.config` या `instances.<name>.config`), फिर दोबारा बिल्ड करें। एजेंट-प्रथम [त्वरित शुरुआत](https://github.com/openclaw/nix-openclaw#quick-start) देखें।
</Note>

<Note>
बंडल किए गए plugins OpenClaw के साथ वितरित होते हैं। कुछ डिफ़ॉल्ट रूप से सक्षम होते हैं (उदाहरण के लिए बंडल किए गए मॉडल प्रदाता, बंडल किए गए स्पीच प्रदाता और बंडल किया गया ब्राउज़र Plugin); अन्य को `plugins enable` की आवश्यकता होती है।

नेटिव OpenClaw plugins एक इनलाइन JSON Schema (`configSchema`, भले ही वह खाली हो) के साथ `openclaw.plugin.json` वितरित करते हैं। इसके बजाय संगत बंडल अपने स्वयं के बंडल मैनिफ़ेस्ट का उपयोग करते हैं।

`plugins list`, `Format: openclaw` या `Format: bundle` दिखाता है। विस्तृत सूची/जानकारी आउटपुट बंडल का उपप्रकार (`codex`, `claude` या `cursor`) और पता लगाई गई बंडल क्षमताएँ भी दिखाता है।
</Note>

## लेखन

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` डिफ़ॉल्ट रूप से एक न्यूनतम TypeScript टूल Plugin बनाता है। पहला
तर्क Plugin आईडी है; `--name` प्रदर्शन नाम निर्धारित करता है। OpenClaw डिफ़ॉल्ट
आउटपुट डायरेक्टरी और पैकेज नामकरण के लिए आईडी का उपयोग करता है। टूल स्कैफ़ोल्ड
`defineToolPlugin` का उपयोग करते हैं और `package.json` स्क्रिप्ट `plugin:build` तथा
`plugin:validate` जनरेट करते हैं, जो बिल्ड करने के बाद `openclaw plugins build`/`validate` को कॉल करती हैं।

`plugins build` बिल्ड की गई एंट्री आयात करता है, उसका स्थिर टूल मेटाडेटा पढ़ता है,
`openclaw.plugin.json` लिखता है और `package.json` के `openclaw.extensions` को संरेखित रखता है।
`plugins validate` जाँचता है कि जनरेट किया गया मैनिफ़ेस्ट, पैकेज मेटाडेटा और
वर्तमान एंट्री एक्सपोर्ट अब भी मेल खाते हैं। संपूर्ण लेखन कार्यप्रवाह के लिए
[टूल plugins](/hi/plugins/tool-plugins) देखें।

स्कैफ़ोल्ड TypeScript स्रोत लिखता है, लेकिन बिल्ड की गई
`./dist/index.js` एंट्री से मेटाडेटा जनरेट करता है, इसलिए यह कार्यप्रवाह प्रकाशित CLI के साथ भी काम करता है। जब एंट्री डिफ़ॉल्ट पैकेज एंट्री न हो, तो
`--entry <path>` का उपयोग करें। फ़ाइलों को दोबारा लिखे बिना जनरेट किया गया मेटाडेटा पुराना होने पर
विफल होने के लिए CI में `plugins build --check` का उपयोग करें।

### प्रदाता स्कैफ़ोल्ड

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

प्रदाता स्कैफ़ोल्ड API-कुंजी प्रमाणीकरण प्लंबिंग, `clawhub package validate` चलाने वाली
`npm run validate` स्क्रिप्ट, ClawHub पैकेज मेटाडेटा और GitHub
OIDC के माध्यम से भविष्य में विश्वसनीय प्रकाशन के लिए मैन्युअल रूप से
डिस्पैच किया गया GitHub Actions कार्यप्रवाह सहित एक सामान्य OpenAI-संगत मॉडल प्रदाता Plugin बनाते हैं। प्रदाता स्कैफ़ोल्ड Skills जनरेट नहीं करते और
`openclaw plugins build`/`validate` का उपयोग नहीं करते; वे कमांड टूल
स्कैफ़ोल्ड के जनरेटेड-मेटाडेटा पथ के लिए हैं।

प्रकाशित करने से पहले, प्लेसहोल्डर API बेस URL, मॉडल कैटलॉग, दस्तावेज़
रूट, क्रेडेंशियल टेक्स्ट और README सामग्री को वास्तविक प्रदाता विवरणों से बदलें। पहली बार ClawHub पर प्रकाशित करने और विश्वसनीय-प्रकाशक सेटअप के लिए
जनरेट किए गए README का उपयोग करें।

## इंस्टॉल करें

```bash
openclaw plugins search "calendar"                      # ClawHub plugins खोजें
openclaw plugins install @openclaw/<package>            # विश्वसनीय आधिकारिक कैटलॉग
openclaw plugins install <package>                       # मनचाहा npm पैकेज
openclaw plugins install clawhub:<package>                # केवल ClawHub
openclaw plugins install npm:<package>                    # केवल npm
openclaw plugins install npm-pack:<path.tgz>               # स्थानीय npm-pack टारबॉल
openclaw plugins install git:github.com/<owner>/<repo>     # git रिपॉज़िटरी
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # स्थानीय पथ या आर्काइव
openclaw plugins install -l <path>                         # कॉपी करने के बजाय लिंक करें
openclaw plugins install <plugin>@<marketplace>             # मार्केटप्लेस शॉर्टहैंड
openclaw plugins install <plugin> --marketplace <name>      # मार्केटप्लेस (स्पष्ट)
openclaw plugins install <package> --force                  # स्रोत की पुष्टि करें / मौजूदा को अधिलेखित करें
openclaw plugins install <package> --pin                    # समाधान किया गया npm संस्करण पिन करें
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

सेटअप-समय इंस्टॉलेशन का परीक्षण करने वाले अनुरक्षक सुरक्षित पर्यावरण चरों से स्वचालित Plugin इंस्टॉलेशन
स्रोतों को ओवरराइड कर सकते हैं। [Plugin इंस्टॉलेशन ओवरराइड](/hi/plugins/install-overrides) देखें।

<Warning>
लॉन्च परिवर्तन के दौरान साधारण पैकेज नाम डिफ़ॉल्ट रूप से npm से इंस्टॉल होते हैं, जब तक कि वे किसी बंडल किए गए या आधिकारिक Plugin आईडी से मेल न खाते हों; उस स्थिति में OpenClaw npm रजिस्ट्री से संपर्क करने के बजाय उस स्थानीय/आधिकारिक प्रति का उपयोग करता है। जब जानबूझकर किसी बाहरी npm पैकेज का उपयोग करना हो, तब `npm:<package>` का उपयोग करें। ClawHub के लिए `clawhub:<package>` का उपयोग करें। Plugin इंस्टॉलेशन को कोड चलाने जैसा समझें; पिन किए गए संस्करणों को प्राथमिकता दें।
</Warning>

<Warning>
ClawHub पैकेज और OpenClaw का बंडल किया गया/आधिकारिक कैटलॉग विश्वसनीय इंस्टॉलेशन
स्रोत हैं। कोई नया मनचाहा npm, `npm-pack:`, git, स्थानीय पथ/आर्काइव या
मार्केटप्लेस स्रोत चेतावनी देता है और जारी रखने से पहले पूछता है। गैर-इंटरैक्टिव मनचाहे
इंस्टॉलेशन में स्रोत की समीक्षा और उस पर विश्वास करने के बाद `--force` देना आवश्यक है। यही
फ़्लैग आवश्यकता पड़ने पर मौजूदा इंस्टॉलेशन लक्ष्य को अधिलेखित करता है। पहले से ट्रैक किए जा रहे इंस्टॉलेशन के
सामान्य अपडेट में इसकी आवश्यकता नहीं होती। यह पुष्टि
`--acknowledge-clawhub-risk` से अलग है, जो केवल जोखिमपूर्ण ClawHub रिलीज़ विश्वास
चेतावनियों पर लागू होती है। `--force`, `security.installPolicy` या शेष
इंस्टॉलेशन सुरक्षा जाँचों को बायपास नहीं करता।
</Warning>

`plugins search`, इंस्टॉल किए जा सकने वाले `code-plugin` और
`bundle-plugin` पैकेजों के लिए ClawHub से क्वेरी करता है (Skills के लिए नहीं; उनके लिए `openclaw skills search` का उपयोग करें)।
डिफ़ॉल्ट `--limit` 20 है, जिसकी अधिकतम सीमा 100 है। यह केवल दूरस्थ कैटलॉग पढ़ता है: कोई
स्थानीय स्थिति निरीक्षण, कॉन्फ़िग परिवर्तन, पैकेज इंस्टॉलेशन या Plugin रनटाइम
लोड नहीं होता। परिणामों में ClawHub पैकेज नाम, परिवार, चैनल, संस्करण,
सारांश और `openclaw plugins install clawhub:<package>` जैसा इंस्टॉलेशन संकेत शामिल होता है।

<Note>
ClawHub अधिकांश plugins के लिए प्राथमिक वितरण और खोज माध्यम है। Npm
एक समर्थित फ़ॉलबैक और प्रत्यक्ष-इंस्टॉलेशन पथ बना हुआ है। OpenClaw के स्वामित्व वाले
`@openclaw/*` Plugin पैकेज फिर से npm पर प्रकाशित किए जाते हैं; वर्तमान सूची
[npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) या
[Plugin इन्वेंटरी](/hi/plugins/plugin-inventory) पर देखें। स्थिर इंस्टॉलेशन `latest` का उपयोग करते हैं।
बीटा-चैनल इंस्टॉलेशन और अपडेट उपलब्ध होने पर npm `beta` dist-tag को प्राथमिकता देते हैं,
और उपलब्ध न होने पर `latest` का उपयोग करते हैं। विस्तारित-स्थिर चैनल पर, साधारण/डिफ़ॉल्ट या `latest`
आशय वाले आधिकारिक npm plugins सटीक इंस्टॉल किए गए कोर
संस्करण पर समाधान होते हैं। सटीक पिन और स्पष्ट गैर-`latest` टैग, तृतीय-पक्ष पैकेज तथा
गैर-npm स्रोत दोबारा नहीं लिखे जाते।
</Note>

<AccordionGroup>
  <Accordion title="कॉन्फ़िग समावेशन और अमान्य-कॉन्फ़िग सुधार">
    यदि आपका `plugins` अनुभाग एकल-फ़ाइल `$include` द्वारा समर्थित है, तो `plugins install/update/enable/disable/uninstall` उस सम्मिलित फ़ाइल में लिखते हैं और `openclaw.json` को अछूता छोड़ देते हैं। रूट समावेशन, समावेशन सरणियाँ और सहोदर ओवरराइड वाले समावेशन फ़्लैटन करने के बजाय बंद अवस्था में विफल होते हैं। समर्थित आकृतियों के लिए [कॉन्फ़िग समावेशन](/hi/gateway/configuration) देखें।

    यदि इंस्टॉलेशन के दौरान कॉन्फ़िग अमान्य है, तो `plugins install` सामान्यतः बंद अवस्था में विफल होता है और पहले `openclaw doctor --fix` चलाने के लिए कहता है। Gateway स्टार्टअप और हॉट रीलोड के दौरान, अमान्य Plugin कॉन्फ़िग किसी भी अन्य अमान्य कॉन्फ़िग की तरह बंद अवस्था में विफल होता है; `openclaw doctor --fix` अमान्य Plugin एंट्री को क्वारंटीन कर सकता है। दस्तावेज़ित इंस्टॉलेशन-समय का एकमात्र अपवाद उन plugins के लिए एक संकीर्ण बंडल-Plugin पुनर्प्राप्ति पथ है, जो स्पष्ट रूप से `openclaw.install.allowInvalidConfigRecovery` चुनते हैं।

  </Accordion>
  <Accordion title="--force पुष्टि तथा पुनः इंस्टॉलेशन बनाम अपडेट">
    `--force` बिना संकेत दिए किसी गैर-ClawHub स्रोत की पुष्टि करता है। यह `security.installPolicy` या शेष इंस्टॉलेशन सुरक्षा जाँचों को बायपास नहीं करता। जब Plugin या हुक पैक पहले से इंस्टॉल हो, तो यह मौजूदा लक्ष्य का दोबारा उपयोग करके उसे उसी स्थान पर अधिलेखित भी करता है। किसी मनचाहे npm, स्थानीय, आर्काइव, git या मार्केटप्लेस स्रोत की समीक्षा के बाद, या समान आईडी को जानबूझकर फिर से इंस्टॉल करते समय इसका उपयोग करें। पहले से ट्रैक किए जा रहे npm Plugin के नियमित अपग्रेड के लिए `openclaw plugins update <id-or-npm-spec>` को प्राथमिकता दें।

    यदि पहले से इंस्टॉल किसी Plugin आईडी के लिए `plugins install` चलाया जाता है, तो OpenClaw रुक जाता है और सामान्य अपग्रेड के लिए `plugins update <id-or-npm-spec>` या वर्तमान इंस्टॉलेशन को किसी अलग स्रोत से वास्तव में अधिलेखित करने के लिए `plugins install <package> --force` की ओर निर्देशित करता है। मनचाहे स्रोत अब भी इंटरैक्टिव उद्गम चेतावनी दिखाते हैं; गैर-इंटरैक्टिव इंस्टॉलेशन में समीक्षा के बाद `--force` देना आवश्यक है। विश्वसनीय ClawHub और OpenClaw-कैटलॉग स्रोतों को इसकी आवश्यकता नहीं होती। `--link` के साथ, `--force` स्रोत की पुष्टि करता है लेकिन लिंक-पथ इंस्टॉलेशन मोड नहीं बदलता।

  </Accordion>
  <Accordion title="--pin का दायरा">
    `--pin` केवल npm इंस्टॉलेशन पर लागू होता है और समाधान किया गया सटीक `<name>@<version>` दर्ज करता है। यह `git:` इंस्टॉलेशन के साथ समर्थित नहीं है (इसके बजाय विनिर्देश में रेफ़ पिन करें, जैसे `git:github.com/acme/plugin@v1.2.3`) या `--marketplace` के साथ समर्थित नहीं है (मार्केटप्लेस इंस्टॉलेशन npm विनिर्देश के बजाय मार्केटप्लेस स्रोत मेटाडेटा बनाए रखते हैं)।
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` अप्रचलित है और अब कोई कार्रवाई नहीं करता। OpenClaw अब Plugin इंस्टॉलेशन के लिए अंतर्निहित इंस्टॉलेशन-समय खतरनाक-कोड अवरोधन नहीं चलाता।

    जब होस्ट-विशिष्ट इंस्टॉल नीति आवश्यक हो, तो ऑपरेटर-स्वामित्व वाली `security.installPolicy` सतह का उपयोग करें। Plugin `before_install` हुक Plugin-रनटाइम जीवनचक्र हुक हैं, CLI इंस्टॉल के लिए प्राथमिक नीति सीमा नहीं।

    यदि ClawHub पर आपके द्वारा प्रकाशित कोई Plugin रजिस्ट्री स्कैन के कारण छिपा या अवरुद्ध है, तो [ClawHub प्रकाशन](/hi/clawhub/publishing) में दिए गए प्रकाशक चरणों का उपयोग करें। `--dangerously-force-unsafe-install` ClawHub से Plugin को फिर से स्कैन करने या अवरुद्ध रिलीज़ को सार्वजनिक करने के लिए नहीं कहता।

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    सामुदायिक ClawHub इंस्टॉल डाउनलोड करने से पहले चयनित रिलीज़ का विश्वसनीयता रिकॉर्ड जाँचते हैं। यदि ClawHub उस रिलीज़ के लिए डाउनलोड अक्षम करता है, दुर्भावनापूर्ण स्कैन निष्कर्षों की रिपोर्ट करता है, या रिलीज़ को अवरोधक मॉडरेशन स्थिति (क्वारंटीन, निरस्त) में डालता है, तो इस फ़्लैग की परवाह किए बिना OpenClaw उसे पूर्णतः अस्वीकार कर देता है। गैर-अवरोधक जोखिमपूर्ण स्कैन स्थितियों या मॉडरेशन स्थितियों के लिए, OpenClaw विश्वसनीयता विवरण दिखाता है और आगे बढ़ने से पहले पुष्टि माँगता है।

    ClawHub चेतावनी की समीक्षा करने और इंटरैक्टिव प्रॉम्प्ट के बिना आगे बढ़ने का निर्णय लेने के बाद ही `--acknowledge-clawhub-risk` का उपयोग करें। लंबित या पुराने (अभी तक स्वच्छ नहीं) स्कैन परिणाम चेतावनी देते हैं, लेकिन अभिस्वीकृति आवश्यक नहीं करते। आधिकारिक ClawHub पैकेज और बंडल किए गए OpenClaw Plugin स्रोत इस रिलीज़-विश्वसनीयता जाँच को पूरी तरह छोड़ देते हैं।

  </Accordion>
  <Accordion title="हुक पैक और npm स्पेक">
    `plugins install`, `package.json` में `openclaw.hooks` उजागर करने वाले हुक पैक के लिए भी इंस्टॉल सतह है। फ़िल्टर की गई हुक दृश्यता और प्रति-हुक सक्षमता के लिए `openclaw hooks` का उपयोग करें, पैकेज इंस्टॉलेशन के लिए नहीं।

    Npm स्पेक **केवल रजिस्ट्री** हैं (पैकेज नाम और वैकल्पिक **सटीक संस्करण** या **dist-tag**)। Git/URL/फ़ाइल स्पेक और semver श्रेणियाँ अस्वीकार की जाती हैं। सुरक्षा के लिए निर्भरता इंस्टॉल प्रत्येक Plugin के लिए एक प्रबंधित npm प्रोजेक्ट में `--ignore-scripts` के साथ चलते हैं, भले ही आपके शेल में वैश्विक npm इंस्टॉल सेटिंग्स हों। प्रबंधित Plugin npm प्रोजेक्ट OpenClaw के पैकेज-स्तरीय npm `overrides` को इनहेरिट करते हैं, इसलिए होस्ट सुरक्षा पिन होइस्ट की गई Plugin निर्भरताओं पर भी लागू होते हैं।

    npm रिज़ॉल्यूशन स्पष्ट करने के लिए `npm:<package>` का उपयोग करें। साधारण पैकेज स्पेक भी लॉन्च बदलाव के दौरान सीधे npm से इंस्टॉल होते हैं, जब तक कि वे किसी आधिकारिक Plugin आईडी से मेल न खाते हों।

    बंडल किए गए Plugin से मेल खाने वाले कच्चे `@openclaw/*` स्पेक, npm फ़ॉलबैक से पहले इमेज-स्वामित्व वाली बंडल प्रति में रिज़ॉल्व होते हैं। उदाहरण के लिए, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` प्रबंधित npm ओवरराइड बनाने के बजाय वर्तमान OpenClaw बिल्ड के बंडल किए गए Discord Plugin का उपयोग करता है। बाहरी npm पैकेज को बाध्य करने के लिए `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin` का उपयोग करें।

    साधारण स्पेक और `@latest` स्थिर ट्रैक पर बने रहते हैं। `2026.5.3-1` जैसे OpenClaw दिनांक-मुद्रित सुधार संस्करण इस जाँच के लिए स्थिर माने जाते हैं। यदि npm इनमें से किसी भी रूप को प्रीरिलीज़ में रिज़ॉल्व करता है, तो OpenClaw रुक जाता है और आपसे प्रीरिलीज़ टैग (`@beta`/`@rc`) या सटीक प्रीरिलीज़ संस्करण (`@1.2.3-beta.4`) के साथ स्पष्ट रूप से सहमति देने को कहता है।

    सटीक संस्करण के बिना npm इंस्टॉल (`npm:<package>` या `npm:<package>@latest`) के लिए, OpenClaw इंस्टॉल से पहले रिज़ॉल्व किए गए पैकेज मेटाडेटा की जाँच करता है। यदि नवीनतम स्थिर पैकेज को अधिक नया OpenClaw Plugin API या न्यूनतम होस्ट संस्करण चाहिए, तो OpenClaw पुराने स्थिर संस्करणों की जाँच करता है और इसके बजाय नवीनतम संगत रिलीज़ इंस्टॉल करता है। सटीक संस्करण और स्पष्ट dist-tag कठोर बने रहते हैं: असंगत चयन विफल होता है और आपसे OpenClaw अपग्रेड करने या संगत संस्करण चुनने को कहता है।

    यदि कोई साधारण इंस्टॉल स्पेक किसी आधिकारिक Plugin आईडी से मेल खाता है (उदाहरण के लिए `diffs`), तो OpenClaw सीधे कैटलॉग प्रविष्टि इंस्टॉल करता है। उसी नाम का npm पैकेज इंस्टॉल करने के लिए स्पष्ट स्कोप्ड स्पेक का उपयोग करें (उदाहरण के लिए `@scope/diffs`)।

  </Accordion>
  <Accordion title="Git रिपॉज़िटरी">
    किसी git रिपॉज़िटरी से सीधे इंस्टॉल करने के लिए `git:<repo>` का उपयोग करें। समर्थित रूप: `git:github.com/owner/repo`, `git:owner/repo`, पूर्ण `https://`, `ssh://`, `git://`, `file://`, और `git@host:owner/repo.git` क्लोन URL। इंस्टॉल से पहले किसी ब्रांच, टैग या कमिट को चेक आउट करने के लिए `@<ref>` या `#<ref>` जोड़ें।

    Git इंस्टॉल किसी अस्थायी डायरेक्टरी में क्लोन करते हैं, अनुरोधित रेफ़ मौजूद होने पर उसे चेक आउट करते हैं, फिर सामान्य Plugin डायरेक्टरी इंस्टॉलर का उपयोग करते हैं, इसलिए मैनिफ़ेस्ट सत्यापन, ऑपरेटर इंस्टॉल नीति, पैकेज-मैनेजर इंस्टॉल कार्य और इंस्टॉल रिकॉर्ड npm इंस्टॉल की तरह व्यवहार करते हैं। दर्ज किए गए git इंस्टॉल में स्रोत URL/रेफ़ के साथ रिज़ॉल्व किया गया कमिट शामिल होता है, ताकि `openclaw plugins update` बाद में स्रोत को फिर से रिज़ॉल्व कर सके।

    git से इंस्टॉल करने के बाद, Gateway विधियों और CLI कमांड जैसे रनटाइम पंजीकरण सत्यापित करने के लिए `openclaw plugins inspect <id> --runtime --json` का उपयोग करें। यदि Plugin ने `api.registerCli` के साथ CLI रूट पंजीकृत किया है, तो उस कमांड को सीधे OpenClaw रूट CLI के माध्यम से चलाएँ, उदाहरण के लिए `openclaw demo-plugin ping`।

  </Accordion>
  <Accordion title="आर्काइव">
    समर्थित आर्काइव: `.zip`, `.tgz`, `.tar.gz`, `.tar`। नेटिव OpenClaw Plugin आर्काइव में निकाले गए Plugin रूट पर मान्य `openclaw.plugin.json` होना आवश्यक है; केवल `package.json` वाले आर्काइव को OpenClaw द्वारा इंस्टॉल रिकॉर्ड लिखने से पहले अस्वीकार कर दिया जाता है।

    जब फ़ाइल npm-pack टारबॉल हो और आप रजिस्ट्री इंस्टॉल द्वारा उपयोग किया जाने वाला
    वही प्रति-Plugin प्रबंधित npm प्रोजेक्ट पथ चाहते हों, जिसमें
    `package-lock.json` सत्यापन, होइस्ट की गई निर्भरता स्कैनिंग
    और npm इंस्टॉल रिकॉर्ड शामिल हों, तो `npm-pack:<path.tgz>` का उपयोग करें। सामान्य आर्काइव पथ अभी भी Plugin
    एक्सटेंशन रूट के अंतर्गत स्थानीय आर्काइव के रूप में इंस्टॉल होते हैं।

    Claude मार्केटप्लेस इंस्टॉल भी समर्थित हैं।

  </Accordion>
</AccordionGroup>

ClawHub इंस्टॉल स्पष्ट `clawhub:<package>` लोकेटर का उपयोग करते हैं:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

साधारण npm-सुरक्षित Plugin स्पेक लॉन्च बदलाव के दौरान डिफ़ॉल्ट रूप से npm से इंस्टॉल होते हैं, जब तक कि वे किसी आधिकारिक Plugin आईडी से मेल न खाते हों:

```bash
openclaw plugins install openclaw-codex-app-server
```

केवल npm रिज़ॉल्यूशन स्पष्ट करने के लिए `npm:` का उपयोग करें:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw इंस्टॉल से पहले विज्ञापित Plugin API / न्यूनतम Gateway संगतता की जाँच करता है। जब चयनित ClawHub संस्करण ClawPack आर्टिफ़ैक्ट प्रकाशित करता है, तो OpenClaw संस्करणयुक्त npm-pack `.tgz` डाउनलोड करता है, ClawHub डाइजेस्ट हेडर और आर्टिफ़ैक्ट डाइजेस्ट सत्यापित करता है, फिर उसे सामान्य आर्काइव पथ से इंस्टॉल करता है। ClawPack मेटाडेटा के बिना पुराने ClawHub संस्करण अभी भी विरासत पैकेज आर्काइव सत्यापन पथ के माध्यम से इंस्टॉल होते हैं। दर्ज किए गए इंस्टॉल बाद के अपडेट के लिए अपने ClawHub स्रोत मेटाडेटा, आर्टिफ़ैक्ट प्रकार, npm अखंडता, npm shasum, टारबॉल नाम और ClawPack डाइजेस्ट तथ्यों को बनाए रखते हैं।
बिना संस्करण वाले ClawHub इंस्टॉल बिना संस्करण का दर्ज स्पेक रखते हैं, ताकि `openclaw plugins update` नए ClawHub रिलीज़ का अनुसरण कर सके; `clawhub:pkg@1.2.3` और `clawhub:pkg@beta` जैसे स्पष्ट संस्करण या टैग चयनकर्ता उसी चयनकर्ता पर पिन रहते हैं।

### मार्केटप्लेस संक्षिप्त रूप

जब Claude की स्थानीय रजिस्ट्री कैश `~/.claude/plugins/known_marketplaces.json` में मार्केटप्लेस नाम मौजूद हो, तो `plugin@marketplace` संक्षिप्त रूप का उपयोग करें:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

मार्केटप्लेस स्रोत स्पष्ट रूप से देने के लिए `--marketplace` का उपयोग करें:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="मार्केटप्लेस स्रोत">
    - `~/.claude/plugins/known_marketplaces.json` से Claude का ज्ञात-मार्केटप्लेस नाम
    - स्थानीय मार्केटप्लेस रूट या `marketplace.json` पथ
    - `owner/repo` जैसा GitHub रिपॉज़िटरी संक्षिप्त रूप
    - `https://github.com/owner/repo` जैसा GitHub रिपॉज़िटरी URL
    - git URL

  </Tab>
  <Tab title="दूरस्थ मार्केटप्लेस नियम">
    GitHub या git से लोड किए गए दूरस्थ मार्केटप्लेस के लिए, Plugin प्रविष्टियाँ क्लोन की गई मार्केटप्लेस रिपॉज़िटरी के अंदर ही रहनी चाहिए। OpenClaw उस रिपॉज़िटरी से सापेक्ष पथ स्रोत स्वीकार करता है और दूरस्थ मैनिफ़ेस्ट से HTTP(S), निरपेक्ष-पथ, git, GitHub और अन्य गैर-पथ Plugin स्रोत अस्वीकार करता है।
  </Tab>
</Tabs>

स्थानीय पथों और आर्काइव के लिए, OpenClaw स्वतः पता लगाता है:

- नेटिव OpenClaw Plugin (`openclaw.plugin.json`)
- Codex-संगत बंडल (`.codex-plugin/plugin.json`)
- Claude-संगत बंडल (`.claude-plugin/plugin.json`, या उस मैनिफ़ेस्ट फ़ाइल के अनुपस्थित होने पर डिफ़ॉल्ट Claude घटक लेआउट)
- Cursor-संगत बंडल (`.cursor-plugin/plugin.json`)

प्रबंधित स्थानीय इंस्टॉल Plugin डायरेक्टरी या आर्काइव होने चाहिए। स्वतंत्र `.js`,
`.mjs`, `.cjs`, और `.ts` Plugin फ़ाइलें `plugins install` द्वारा प्रबंधित Plugin
रूट में कॉपी नहीं की जातीं, न ही उन्हें सीधे
`~/.openclaw/extensions` या `<workspace>/.openclaw/extensions` में रखने से लोड किया जाता है; वे
स्वतः खोजे गए रूट Plugin पैकेज या बंडल डायरेक्टरी लोड करते हैं और
शीर्ष-स्तरीय स्क्रिप्ट फ़ाइलों को स्थानीय सहायक के रूप में छोड़ देते हैं। इसके बजाय स्वतंत्र फ़ाइलों को
`plugins.load.paths` में स्पष्ट रूप से सूचीबद्ध करें।

<Note>
संगत बंडल सामान्य Plugin रूट में इंस्टॉल होते हैं और उसी सूची/जानकारी/सक्षम/अक्षम प्रवाह में भाग लेते हैं। वर्तमान में, बंडल Skills, Claude कमांड-Skills, Claude `settings.json` डिफ़ॉल्ट, Claude `.lsp.json` / मैनिफ़ेस्ट-घोषित `lspServers` डिफ़ॉल्ट, Cursor कमांड-Skills और संगत Codex हुक डायरेक्टरी समर्थित हैं; अन्य पता लगाई गई बंडल क्षमताएँ निदान/जानकारी में दिखाई जाती हैं, लेकिन अभी रनटाइम निष्पादन से जुड़ी नहीं हैं।
</Note>

स्थानीय Plugin डायरेक्टरी को कॉपी किए बिना इंगित करने के लिए `-l`/`--link` का उपयोग करें (इसे
`plugins.load.paths` में जोड़ता है):

```bash
openclaw plugins install -l ./my-plugin
```

`--link`, `--marketplace` या `git:` इंस्टॉल के साथ समर्थित नहीं है और इसके लिए
पहले से मौजूद स्थानीय पथ आवश्यक है। गैर-इंटरैक्टिव स्थानीय लिंक के लिए,
स्रोत की समीक्षा करने के बाद `--force` दें; यह उद्गम की पुष्टि करता है, लेकिन
लिंक की गई डायरेक्टरी को कॉपी या अधिलेखित नहीं करता।

<Note>
वर्कस्पेस एक्सटेंशन रूट से खोजे गए वर्कस्पेस-मूल Plugin तब तक
आयात या निष्पादित नहीं किए जाते, जब तक उन्हें स्पष्ट रूप से सक्षम न किया जाए। स्थानीय विकास के लिए,
`openclaw plugins enable <plugin-id>` चलाएँ या
`plugins.entries.<plugin-id>.enabled: true` सेट करें; यदि आपका कॉन्फ़िगरेशन
`plugins.allow` उपयोग करता है, तो उसमें वही Plugin आईडी भी शामिल करें। यह विफलता-बंद नियम
तब भी लागू होता है जब चैनल सेटअप केवल सेटअप के लिए लोड करने हेतु स्पष्ट रूप से किसी वर्कस्पेस-मूल Plugin को
लक्षित करता है, इसलिए जब तक वह वर्कस्पेस Plugin अक्षम या अनुमति-सूची से बाहर रहता है,
स्थानीय चैनल Plugin सेटअप कोड नहीं चलेगा। लिंक किए गए इंस्टॉल
और स्पष्ट `plugins.load.paths` प्रविष्टियाँ अपने
रिज़ॉल्व किए गए Plugin मूल के लिए सामान्य नीति का पालन करती हैं। देखें
[Plugin नीति कॉन्फ़िगर करें](/hi/tools/plugin#configure-plugin-policy)
और [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference#plugins)।

प्रबंधित Plugin इंडेक्स में रिज़ॉल्व किया गया सटीक स्पेक (`name@version`) सहेजने के लिए npm इंस्टॉल पर `--pin` का उपयोग करें, जबकि डिफ़ॉल्ट व्यवहार अनपिन रखा जाता है।
</Note>

## सूची

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  केवल सक्षम Plugin दिखाएँ।
</ParamField>
<ParamField path="--verbose" type="boolean">
  तालिका दृश्य से प्रारूप/स्रोत/मूल/संस्करण/सक्रियण मेटाडेटा वाली प्रति-Plugin विवरण पंक्तियों पर स्विच करें।
</ParamField>
<ParamField path="--json" type="boolean">
  मशीन-पठनीय इन्वेंटरी के साथ रजिस्ट्री निदान और पैकेज निर्भरता इंस्टॉल स्थिति।
</ParamField>

<Note>
`plugins list` पहले स्थायी स्थानीय plugin रजिस्ट्री को पढ़ता है और रजिस्ट्री के अनुपलब्ध या अमान्य होने पर केवल मैनिफ़ेस्ट से व्युत्पन्न फ़ॉलबैक का उपयोग करता है। यह जाँचने के लिए उपयोगी है कि कोई plugin इंस्टॉल और सक्षम है तथा कोल्ड स्टार्टअप योजना को दिखाई देता है या नहीं, लेकिन यह पहले से चल रही Gateway प्रक्रिया की लाइव रनटाइम जाँच नहीं है। plugin कोड, सक्षमता, हुक नीति या `plugins.load.paths` बदलने के बाद, नए `register(api)` कोड या हुक के चलने की अपेक्षा करने से पहले चैनल प्रदान करने वाले Gateway को पुनः आरंभ करें। रिमोट/कंटेनर परिनियोजनों के लिए सत्यापित करें कि आप केवल किसी रैपर प्रक्रिया को नहीं, बल्कि वास्तविक `openclaw gateway run` चाइल्ड को पुनः आरंभ कर रहे हैं।

`plugins list --json`, `package.json` `dependencies` और
`optionalDependencies` से प्रत्येक plugin का `dependencyStatus` शामिल करता है। OpenClaw जाँचता है
कि वे पैकेज नाम plugin के सामान्य Node `node_modules` लुकअप पथ पर मौजूद हैं या नहीं;
यह plugin रनटाइम कोड आयात नहीं करता, पैकेज मैनेजर नहीं चलाता और अनुपलब्ध
निर्भरताओं की मरम्मत नहीं करता।
</Note>

यदि स्टार्टअप लॉग में `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` दिखाई दे,
तो plugin आईडी की पुष्टि करने के लिए सूचीबद्ध plugin आईडी के साथ `openclaw plugins list --enabled --verbose` या
`openclaw plugins inspect <id>` चलाएँ और विश्वसनीय आईडी को `openclaw.json` में
`plugins.allow` में कॉपी करें। जब चेतावनी खोजे गए प्रत्येक plugin को सूचीबद्ध कर सकती
है, तो यह चिपकाने के लिए तैयार `plugins.allow` स्निपेट प्रिंट करती है, जिसमें वे आईडी
पहले से शामिल होती हैं। यदि कोई plugin इंस्टॉल/लोड-पथ उद्गम के बिना लोड होता है, तो उस
plugin आईडी का निरीक्षण करें, फिर या तो विश्वसनीय आईडी को `plugins.allow` में पिन
करें या plugin को किसी विश्वसनीय स्रोत से पुनः इंस्टॉल करें, ताकि OpenClaw इंस्टॉल उद्गम
दर्ज कर सके।

पैकेज की गई Docker इमेज के भीतर बंडल किए गए plugin पर काम करने के लिए, plugin
स्रोत डायरेक्टरी को मेल खाते पैकेज किए गए स्रोत पथ पर बाइंड-माउंट करें, जैसे
`/app/extensions/synology-chat`। OpenClaw उस माउंट किए गए स्रोत ओवरले को
`/app/dist/extensions/synology-chat` से पहले खोजता है; केवल कॉपी की गई स्रोत डायरेक्टरी
निष्क्रिय रहती है, इसलिए सामान्य पैकेज किए गए इंस्टॉल अब भी कंपाइल किए गए dist का उपयोग करते हैं।

रनटाइम हुक डीबगिंग के लिए:

- `openclaw plugins inspect <id> --runtime --json` मॉड्यूल-लोड किए गए निरीक्षण पास से पंजीकृत हुक और निदान दिखाता है। रनटाइम निरीक्षण कभी निर्भरताएँ इंस्टॉल नहीं करता; पुरानी निर्भरता स्थिति साफ़ करने या कॉन्फ़िगरेशन द्वारा संदर्भित अनुपलब्ध डाउनलोड-योग्य plugins को पुनर्प्राप्त करने के लिए `openclaw doctor --fix` का उपयोग करें।
- `openclaw gateway status --deep --require-rpc` पहुँच योग्य Gateway URL/प्रोफ़ाइल, सेवा/प्रक्रिया संकेत, कॉन्फ़िगरेशन पथ और RPC स्वास्थ्य की पुष्टि करता है।
- गैर-बंडल वार्तालाप हुक (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) के लिए `plugins.entries.<id>.hooks.allowConversationAccess=true` आवश्यक है।

### Plugin अनुक्रमणिका

Plugin इंस्टॉल मेटाडेटा मशीन द्वारा प्रबंधित स्थिति है, उपयोगकर्ता कॉन्फ़िगरेशन नहीं। इंस्टॉल और अपडेट इसे सक्रिय OpenClaw स्थिति डायरेक्टरी के अंतर्गत साझा SQLite स्थिति डेटाबेस में लिखते हैं। `installed_plugin_index` पंक्ति स्थायी `installRecords` मेटाडेटा संग्रहीत करती है, जिसमें टूटे या अनुपलब्ध plugin मैनिफ़ेस्ट के रिकॉर्ड और `openclaw plugins update`, अनइंस्टॉल, निदान तथा कोल्ड plugin रजिस्ट्री द्वारा उपयोग किया जाने वाला मैनिफ़ेस्ट-व्युत्पन्न कोल्ड रजिस्ट्री कैश शामिल है।

`plugins.installs` एक सेवानिवृत्त, लेखित-कॉन्फ़िगरेशन सतह है। रनटाइम और अपडेट कमांड केवल SQLite इंस्टॉल किए गए-plugin अनुक्रमणिका को पढ़ते हैं। सामान्य रनटाइम उपयोग से पहले पुराने कॉन्फ़िगरेशन रिकॉर्ड को अनुक्रमणिका में आयात करने और सेवानिवृत्त कुंजी हटाने के लिए `openclaw doctor --fix` चलाएँ।

## अनइंस्टॉल

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall`, `plugins.entries` से plugin रिकॉर्ड, स्थायी plugin अनुक्रमणिका, plugin अनुमति/अस्वीकृति सूची प्रविष्टियाँ और लागू होने पर लिंक की गई `plugins.load.paths` प्रविष्टियाँ हटाता है। जब तक `--keep-files` सेट न हो, अनइंस्टॉल ट्रैक की गई प्रबंधित इंस्टॉल डायरेक्टरी भी हटाता है, लेकिन केवल तब जब उसका समाधान OpenClaw के plugin एक्सटेंशन रूट के भीतर होता है। यदि plugin वर्तमान में `memory` या `contextEngine` स्लॉट का स्वामी है, तो वह स्लॉट अपने डिफ़ॉल्ट पर रीसेट हो जाता है (मेमोरी के लिए `memory-core`, कॉन्टेक्स्ट इंजन के लिए `legacy`)।

`uninstall` हटाई जाने वाली चीज़ों का पूर्वावलोकन प्रिंट करता है, फिर परिवर्तन करने से पहले `Uninstall plugin "<id>"?` का संकेत देता है। पुष्टिकरण संकेत छोड़ने के लिए `--force` पास करें (स्क्रिप्ट और गैर-इंटरैक्टिव रन के लिए उपयोगी); इसके बिना अनइंस्टॉल के लिए इंटरैक्टिव TTY आवश्यक है। `--dry-run` वही पूर्वावलोकन प्रिंट करता है और बिना संकेत दिए या कुछ बदले बाहर निकल जाता है।

<Note>
`--keep-config`, `--keep-files` के बहिष्कृत उपनाम के रूप में समर्थित है।
</Note>

## अपडेट

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

अपडेट प्रबंधित plugin अनुक्रमणिका में ट्रैक किए गए plugin इंस्टॉल और `hooks.internal.installs` में ट्रैक किए गए हुक-पैक इंस्टॉल पर लागू होते हैं। वे उस स्रोत का पुनः उपयोग करते हैं जिसे उपयोगकर्ता ने plugin इंस्टॉल करते समय पहले ही चुना था, इसलिए उन्हें दूसरी स्रोत स्वीकृति की आवश्यकता नहीं होती।

<AccordionGroup>
  <Accordion title="plugin आईडी बनाम npm स्पेक का समाधान">
    जब आप कोई plugin आईडी पास करते हैं, तो OpenClaw उस plugin के लिए दर्ज इंस्टॉल स्पेक का पुनः उपयोग करता है। इसका अर्थ है कि पहले संग्रहीत dist-tags जैसे `@beta` और सटीक पिन किए गए संस्करण बाद के `update <id>` रन में भी उपयोग किए जाते रहते हैं।

    `update <id> --dry-run` के दौरान सटीक पिन किए गए npm इंस्टॉल पिन किए रहते हैं। यदि OpenClaw पैकेज की रजिस्ट्री डिफ़ॉल्ट लाइन का भी समाधान कर सकता है और वह डिफ़ॉल्ट लाइन इंस्टॉल किए गए पिन संस्करण से नई है, तो ड्राई रन पिन की सूचना देता है और रजिस्ट्री डिफ़ॉल्ट लाइन का अनुसरण करने के लिए स्पष्ट `@latest` पैकेज अपडेट कमांड प्रिंट करता है।

    लक्षित-अपडेट का यह नियम सामूहिक `openclaw plugins update --all` रखरखाव पथ से अलग है। सामूहिक अपडेट अब भी सामान्य ट्रैक किए गए इंस्टॉल स्पेक का सम्मान करते हैं, लेकिन विश्वसनीय आधिकारिक OpenClaw plugin रिकॉर्ड किसी पुराने सटीक आधिकारिक पैकेज पर टिके रहने के बजाय वर्तमान आधिकारिक कैटलॉग लक्ष्य के साथ सिंक हो सकते हैं। जब आप जानबूझकर किसी सटीक या टैग किए गए आधिकारिक स्पेक को अपरिवर्तित रखना चाहते हैं, तो लक्षित `update <id>` का उपयोग करें।

    npm इंस्टॉल के लिए आप dist-tag या सटीक संस्करण वाला स्पष्ट npm पैकेज स्पेक भी पास कर सकते हैं। OpenClaw उस पैकेज नाम का समाधान वापस ट्रैक किए गए plugin रिकॉर्ड में करता है, उस इंस्टॉल किए गए plugin को अपडेट करता है और भविष्य के आईडी-आधारित अपडेट के लिए नया npm स्पेक दर्ज करता है।

    बिना संस्करण या टैग के npm पैकेज नाम पास करने पर भी उसका समाधान वापस ट्रैक किए गए plugin रिकॉर्ड में होता है। इसका उपयोग तब करें जब कोई plugin सटीक संस्करण पर पिन किया गया हो और आप उसे वापस रजिस्ट्री की डिफ़ॉल्ट रिलीज़ लाइन पर ले जाना चाहते हों।

  </Accordion>
  <Accordion title="बीटा चैनल अपडेट">
    लक्षित `openclaw plugins update <id-or-npm-spec>` ट्रैक किए गए plugin स्पेक का पुनः उपयोग करता है, जब तक कि आप नया स्पेक पास न करें। सामूहिक `openclaw plugins update --all` विश्वसनीय आधिकारिक plugin रिकॉर्ड को आधिकारिक कैटलॉग लक्ष्य से सिंक करते समय कॉन्फ़िगर किए गए `update.channel` का उपयोग करता है, ताकि बीटा-चैनल इंस्टॉल चुपचाप stable/latest पर सामान्यीकृत होने के बजाय बीटा रिलीज़ लाइन पर बने रह सकें।

    `openclaw update` सक्रिय OpenClaw अपडेट चैनल को भी जानता है: बीटा चैनल पर डिफ़ॉल्ट-लाइन npm और ClawHub plugin रिकॉर्ड पहले `@beta` आज़माते हैं। यदि कोई plugin बीटा रिलीज़ मौजूद नहीं है, तो वे दर्ज डिफ़ॉल्ट/latest स्पेक पर वापस जाते हैं; npm plugins तब भी वापस जाते हैं जब बीटा पैकेज मौजूद हो लेकिन इंस्टॉल सत्यापन में विफल हो जाए। उस फ़ॉलबैक की सूचना चेतावनी के रूप में दी जाती है और उससे कोर अपडेट विफल नहीं होता। सटीक संस्करण और स्पष्ट टैग लक्षित अपडेट के लिए उसी चयनकर्ता पर पिन रहते हैं।

  </Accordion>
  <Accordion title="संस्करण जाँच और अखंडता विचलन">
    लाइव npm अपडेट से पहले OpenClaw इंस्टॉल किए गए पैकेज संस्करण की npm रजिस्ट्री मेटाडेटा से जाँच करता है। यदि इंस्टॉल किया गया संस्करण और दर्ज आर्टिफ़ैक्ट पहचान पहले से समाधान किए गए लक्ष्य से मेल खाते हैं, तो अपडेट डाउनलोड, पुनः इंस्टॉल या `openclaw.json` को दोबारा लिखे बिना छोड़ दिया जाता है।

    जब संग्रहीत अखंडता हैश मौजूद हो और प्राप्त आर्टिफ़ैक्ट हैश बदल जाए, तो OpenClaw इसे npm आर्टिफ़ैक्ट विचलन मानता है। इंटरैक्टिव `openclaw plugins update` कमांड अपेक्षित और वास्तविक हैश प्रिंट करता है और आगे बढ़ने से पहले पुष्टि माँगता है। गैर-इंटरैक्टिव अपडेट सहायक तब तक सुरक्षित रूप से विफल होते हैं, जब तक कॉलर स्पष्ट निरंतरता नीति प्रदान न करे।

  </Accordion>
  <Accordion title="अपडेट पर --dangerously-force-unsafe-install">
    संगतता के लिए `--dangerously-force-unsafe-install` को `plugins update` पर भी स्वीकार किया जाता है, लेकिन यह बहिष्कृत है और अब plugin अपडेट व्यवहार नहीं बदलता। ऑपरेटर `security.installPolicy` अब भी अपडेट अवरुद्ध कर सकता है; plugin `before_install` हुक केवल उन प्रक्रियाओं में लागू होते हैं जहाँ plugin हुक लोड किए गए हैं।
  </Accordion>
  <Accordion title="अपडेट पर --acknowledge-clawhub-risk">
    समुदाय के ClawHub-समर्थित plugin अपडेट प्रतिस्थापन पैकेज डाउनलोड करने से पहले इंस्टॉल के समान सटीक-रिलीज़ विश्वास जाँच चलाते हैं। समीक्षा किए गए स्वचालन के लिए `--acknowledge-clawhub-risk` का उपयोग करें, जिसे चयनित ClawHub रिलीज़ में जोखिमपूर्ण विश्वास चेतावनी होने पर भी जारी रहना चाहिए। आधिकारिक ClawHub पैकेज और बंडल किए गए OpenClaw plugin स्रोत इस रिलीज़-विश्वास संकेत को छोड़ देते हैं।
  </Accordion>
</AccordionGroup>

## निरीक्षण

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

डिफ़ॉल्ट रूप से plugin रनटाइम आयात किए बिना निरीक्षण पहचान, लोड स्थिति, स्रोत, मैनिफ़ेस्ट क्षमताएँ, नीति फ़्लैग, निदान, इंस्टॉल मेटाडेटा, बंडल क्षमताएँ और खोजी गई किसी भी MCP या LSP सर्वर सहायता को दिखाता है। JSON आउटपुट में `contracts.agentToolResultMiddleware` और `contracts.trustedToolPolicies` जैसे plugin मैनिफ़ेस्ट अनुबंध शामिल होते हैं, ताकि ऑपरेटर किसी plugin को सक्षम या पुनः आरंभ करने से पहले विश्वसनीय-सतह घोषणाओं का ऑडिट कर सकें। plugin मॉड्यूल लोड करने और पंजीकृत हुक, टूल, कमांड, सेवाएँ, Gateway विधियाँ और HTTP रूट शामिल करने के लिए `--runtime` जोड़ें। रनटाइम निरीक्षण अनुपलब्ध plugin निर्भरताओं की सीधे सूचना देता है; इंस्टॉल और मरम्मत `openclaw plugins install`, `openclaw plugins update` और `openclaw doctor --fix` में ही रहती हैं।

Plugin के स्वामित्व वाले CLI कमांड सामान्यतः रूट `openclaw` कमांड समूहों के रूप में इंस्टॉल किए जाते हैं, लेकिन plugins किसी कोर पैरेंट जैसे `openclaw nodes` के अंतर्गत नेस्टेड कमांड भी पंजीकृत कर सकते हैं। जब `inspect --runtime`, `cliCommands` के अंतर्गत कोई कमांड दिखाए, तो उसे सूचीबद्ध पथ पर चलाएँ; उदाहरण के लिए, `demo-git` पंजीकृत करने वाले plugin को `openclaw demo-git ping` से सत्यापित किया जा सकता है।

प्रत्येक plugin को उसके द्वारा रनटाइम पर वास्तव में पंजीकृत की जाने वाली चीज़ों के अनुसार वर्गीकृत किया जाता है:

| आकार                | अर्थ                                                               |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | ठीक एक क्षमता प्रकार (उदा. केवल-प्रदाता plugin)                    |
| `hybrid-capability` | एक से अधिक क्षमता प्रकार (उदा. टेक्स्ट + वाणी + छवियाँ)            |
| `hook-only`         | केवल हुक; कोई क्षमता, टूल, कमांड, सेवा या रूट नहीं          |
| `non-capability`    | टूल/कमांड/सेवाएँ, लेकिन कोई क्षमता नहीं                           |

क्षमता मॉडल के बारे में अधिक जानकारी के लिए [Plugin आकार](/hi/plugins/architecture#plugin-shapes) देखें।

<Note>
`--json` फ़्लैग स्क्रिप्टिंग और ऑडिटिंग के लिए उपयुक्त मशीन-पठनीय रिपोर्ट आउटपुट करता है। `inspect --all` आकार, क्षमता प्रकारों, संगतता सूचनाओं, बंडल क्षमताओं और हुक सारांश कॉलम वाली पूरे फ़्लीट की तालिका प्रस्तुत करता है। `info`, `inspect` का उपनाम है।
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` plugin लोड त्रुटियों, मैनिफ़ेस्ट/खोज निदान, संगतता सूचनाओं और अनुपलब्ध plugin स्लॉट जैसे पुराने plugin कॉन्फ़िगरेशन संदर्भों की सूचना देता है। जब इंस्टॉल ट्री और plugin कॉन्फ़िगरेशन साफ़ हों, तो यह `No plugin issues detected.` प्रिंट करता है। यदि पुराना कॉन्फ़िगरेशन बना रहे लेकिन इंस्टॉल ट्री अन्यथा स्वस्थ हो, तो पूर्ण plugin स्वास्थ्य का संकेत देने के बजाय सारांश यह स्थिति बताता है।

यदि कॉन्फ़िगर किया गया Plugin डिस्क पर मौजूद है, लेकिन लोडर की पथ-सुरक्षा जाँचों द्वारा अवरुद्ध है, तो कॉन्फ़िग सत्यापन Plugin प्रविष्टि को बनाए रखता है और उसे `present but blocked` के रूप में रिपोर्ट करता है। `plugins.entries.<id>` या `plugins.allow` कॉन्फ़िग को हटाने के बजाय, पहले दिए गए अवरुद्ध-Plugin निदान को ठीक करें, जैसे पथ का स्वामित्व या सभी के लिए लिखने योग्य अनुमतियाँ।

`register`/`activate` एक्सपोर्ट अनुपलब्ध होने जैसी मॉड्यूल-आकार विफलताओं के लिए, निदान आउटपुट में एक्सपोर्ट-आकार का संक्षिप्त सारांश शामिल करने हेतु `OPENCLAW_PLUGIN_LOAD_DEBUG=1` के साथ फिर से चलाएँ।

## रजिस्ट्री

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

स्थानीय Plugin रजिस्ट्री, इंस्टॉल किए गए Plugin की पहचान, सक्षमता, स्रोत मेटाडेटा और योगदान स्वामित्व के लिए OpenClaw का स्थायी कोल्ड-रीड मॉडल है। सामान्य स्टार्टअप, प्रोवाइडर स्वामी लुकअप, चैनल सेटअप वर्गीकरण और Plugin इन्वेंट्री, Plugin रनटाइम मॉड्यूल आयात किए बिना इसे पढ़ सकते हैं।

यह जाँचने के लिए `plugins registry` का उपयोग करें कि स्थायी रजिस्ट्री मौजूद, वर्तमान या पुरानी है। स्थायी Plugin इंडेक्स, कॉन्फ़िग नीति और मैनिफ़ेस्ट/पैकेज मेटाडेटा से इसे फिर से बनाने के लिए `--refresh` का उपयोग करें। यह मरम्मत पथ है, रनटाइम सक्रियण पथ नहीं।

`openclaw doctor --fix` रजिस्ट्री से सटे प्रबंधित npm विचलन की भी मरम्मत करता है। यदि किसी प्रबंधित Plugin npm प्रोजेक्ट या पुराने समतल प्रबंधित npm रूट के अंतर्गत कोई अनाथ या पुनर्प्राप्त `@openclaw/*` पैकेज किसी बंडल किए गए Plugin को छिपाता है, तो doctor उस पुराने पैकेज को हटा देता है और रजिस्ट्री को फिर से बनाता है, ताकि स्टार्टअप बंडल किए गए मैनिफ़ेस्ट के विरुद्ध सत्यापन करे। जब कोई प्रामाणिक इंस्टॉल रिकॉर्ड एक प्रबंधित जनरेशन चुनता है, लेकिन पुराने समतल या जनरेशन डायरेक्टरी बने रहते हैं, तो doctor Gateway के पुनः आरंभ होने के बाद छँटाई हेतु उन पुराने ट्री को निष्क्रिय कर देता है। doctor होस्ट `openclaw` पैकेज को उन प्रबंधित npm Plugins में फिर से लिंक भी करता है जो `peerDependencies.openclaw` घोषित करते हैं, ताकि अपडेट या npm मरम्मत के बाद `openclaw/plugin-sdk/*` जैसे पैकेज-स्थानीय रनटाइम आयात हल हो सकें।

## मार्केटप्लेस

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` कॉन्फ़िगर किए गए OpenClaw मार्केटप्लेस फ़ीड की प्रविष्टियाँ सूचीबद्ध करता है। डिफ़ॉल्ट रूप से यह होस्ट किए गए फ़ीड का प्रयास करता है और विफल होने पर नवीनतम स्वीकृत स्नैपशॉट या बंडल किए गए डेटा का उपयोग करता है। किसी विशिष्ट कॉन्फ़िगर किए गए प्रोफ़ाइल को पढ़ने के लिए `--feed-profile <name>`, किसी स्पष्ट होस्ट किए गए फ़ीड URL को पढ़ने के लिए `--feed-url <url>`, और फ़ीड प्राप्त किए बिना नवीनतम स्वीकृत स्नैपशॉट पढ़ने के लिए `--offline` का उपयोग करें।

`plugins marketplace refresh` कॉन्फ़िगर किए गए होस्टेड फ़ीड स्नैपशॉट को रीफ़्रेश करता है और रिपोर्ट करता है कि OpenClaw ने होस्टेड डेटा, होस्टेड स्नैपशॉट या बंडल किया गया फ़ॉलबैक डेटा स्वीकार किया। जब कॉलर चाहता है कि नया होस्टेड पेलोड पिन किए गए चेकसम से मेल न खाने पर कमांड विफल हो, तब `--expected-sha256` का उपयोग करें।

मार्केटप्लेस `list` किसी स्थानीय मार्केटप्लेस पथ, `marketplace.json` पथ, `owner/repo` जैसे GitHub शॉर्टहैंड, GitHub रिपॉज़िटरी URL या git URL को स्वीकार करता है। `--json` समाधान किया गया स्रोत लेबल, पार्स किया गया मार्केटप्लेस मैनिफ़ेस्ट और Plugin प्रविष्टियाँ प्रिंट करता है।

मार्केटप्लेस रीफ़्रेश, होस्ट किया गया OpenClaw मार्केटप्लेस फ़ीड लोड करता है और सत्यापित प्रतिक्रिया को स्थानीय होस्टेड-फ़ीड स्नैपशॉट के रूप में स्थायी करता है। विकल्पों के बिना, यह कॉन्फ़िगर किए गए डिफ़ॉल्ट फ़ीड प्रोफ़ाइल का उपयोग करता है। किसी विशिष्ट कॉन्फ़िगर किए गए प्रोफ़ाइल को रीफ़्रेश करने के लिए `--feed-profile <name>`, किसी स्पष्ट होस्ट किए गए फ़ीड URL को रीफ़्रेश करने के लिए `--feed-url <url>`, मेल खाते पेलोड चेकसम (`sha256:<hex>` या केवल 64-वर्णों का हेक्स डाइजेस्ट) की आवश्यकता लागू करने के लिए `--expected-sha256 <sha256>`, और मशीन-पठनीय आउटपुट के लिए `--json` का उपयोग करें। स्पष्ट होस्ट किए गए फ़ीड URL में क्रेडेंशियल, क्वेरी स्ट्रिंग या फ़्रैगमेंट शामिल नहीं होने चाहिए। बिना पिन किए गए रीफ़्रेश, कमांड को विफल किए बिना होस्टेड स्नैपशॉट या बंडल किए गए फ़ॉलबैक परिणाम की रिपोर्ट कर सकते हैं। पिन किए गए रीफ़्रेश तब तक विफल होते हैं जब तक वे नया होस्टेड पेलोड स्वीकार न करें, और यदि OpenClaw सत्यापित स्नैपशॉट को स्थायी नहीं कर पाता है, तो सफल होस्टेड रीफ़्रेश भी विफल होते हैं।

## संबंधित

- [Plugins बनाना](/hi/plugins/building-plugins)
- [CLI संदर्भ](/hi/cli)
- [ClawHub](/hi/clawhub)
