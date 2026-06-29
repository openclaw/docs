---
doc-schema-version: 1
read_when:
    - आप त्वरित Plugin सूची, इंस्टॉल, अपडेट, निरीक्षण या अनइंस्टॉल उदाहरण चाहते हैं
    - आप Plugin इंस्टॉल स्रोत चुनना चाहते हैं
    - आप Plugin पैकेज प्रकाशित करने के लिए सही संदर्भ चाहते हैं
sidebarTitle: Manage plugins
summary: OpenClaw Plugin को सूचीबद्ध करने, इंस्टॉल करने, अपडेट करने, निरीक्षण करने और अनइंस्टॉल करने के त्वरित उदाहरण
title: Plugin प्रबंधित करें
x-i18n:
    generated_at: "2026-06-28T23:37:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

सामान्य Plugin प्रबंधन कमांड के लिए इस पेज का उपयोग करें। संपूर्ण कमांड
कॉन्ट्रैक्ट, फ्लैग, स्रोत-चयन नियमों, और किनारे के मामलों के लिए,
[`openclaw plugins`](/hi/cli/plugins) देखें।

अधिकांश इंस्टॉल वर्कफ़्लो ये हैं:

1. कोई पैकेज खोजें
2. उसे ClawHub, npm, git, या स्थानीय पाथ से इंस्टॉल करें
3. प्रबंधित Gateway को अपने-आप रीस्टार्ट होने दें, या अप्रबंधित होने पर उसे मैन्युअल रूप से रीस्टार्ट करें
4. Plugin के रनटाइम पंजीकरणों को सत्यापित करें

## Plugin सूचीबद्ध करें और खोजें

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

स्क्रिप्ट के लिए `--json` का उपयोग करें:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` एक कोल्ड इन्वेंटरी जांच है। यह दिखाता है कि OpenClaw
कॉन्फ़िग, मैनिफ़ेस्ट, और Plugin रजिस्ट्री से क्या खोज सकता है; यह साबित नहीं
करता कि पहले से चल रहे Gateway ने Plugin रनटाइम इंपोर्ट किया है। JSON आउटपुट में
रजिस्ट्री डायग्नॉस्टिक्स और हर Plugin का स्थिर `dependencyStatus` शामिल होता है,
जब Plugin पैकेज `dependencies` या `optionalDependencies` घोषित करता है।

`plugins search` इंस्टॉल किए जा सकने वाले Plugin पैकेज के लिए ClawHub को क्वेरी
करता है और `openclaw plugins install clawhub:<package>` जैसे इंस्टॉल संकेत प्रिंट
करता है।

## Plugin इंस्टॉल करें

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

लॉन्च कटओवर के दौरान नंगे पैकेज स्पेक npm से इंस्टॉल होते हैं। जब आपको
निर्धारित स्रोत चयन चाहिए, तो `clawhub:`, `npm:`, `git:`, या `npm-pack:` का
उपयोग करें। अगर नंगा नाम किसी आधिकारिक Plugin id से मेल खाता है, तो OpenClaw
कैटलॉग प्रविष्टि को सीधे इंस्टॉल कर सकता है।

`--force` का उपयोग केवल तब करें जब आप जानबूझकर किसी मौजूदा इंस्टॉल लक्ष्य को
ओवरराइट करना चाहते हों। ट्रैक किए गए npm, ClawHub, या hook-pack इंस्टॉल के
नियमित अपग्रेड के लिए, `openclaw plugins update` का उपयोग करें।

## रीस्टार्ट करें और निरीक्षण करें

Plugin कोड इंस्टॉल, अपडेट, या अनइंस्टॉल करने के बाद, कॉन्फ़िग रीलोड सक्षम होने
पर चल रहा प्रबंधित Gateway अपने-आप रीस्टार्ट हो जाता है। अगर Gateway प्रबंधित
नहीं है या रीलोड अक्षम है, तो लाइव रनटाइम सतहें जांचने से पहले उसे खुद रीस्टार्ट
करें:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

जब आपको यह प्रमाण चाहिए कि Plugin ने टूल, हुक, सेवाएं, Gateway मेथड, HTTP रूट,
या Plugin-स्वामित्व वाले CLI कमांड जैसी रनटाइम सतहें पंजीकृत की हैं, तो
`inspect --runtime` का उपयोग करें। सामान्य `inspect` और `list` कोल्ड
मैनिफ़ेस्ट, कॉन्फ़िग, और रजिस्ट्री जांचें हैं।

## Plugin अपडेट करें

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

जब आप कोई Plugin id पास करते हैं, तो OpenClaw ट्रैक किए गए इंस्टॉल स्पेक का
दोबारा उपयोग करता है। संग्रहीत dist-tags जैसे `@beta` और सटीक पिन किए गए संस्करण
बाद के `update <plugin-id>` रन में भी उपयोग किए जाते रहते हैं।

`openclaw plugins update --all` बल्क रखरखाव पाथ है। यह फिर भी सामान्य ट्रैक किए
गए इंस्टॉल स्पेक का सम्मान करता है, लेकिन विश्वसनीय आधिकारिक OpenClaw Plugin
रिकॉर्ड किसी पुराने सटीक आधिकारिक पैकेज पर रहने के बजाय मौजूदा आधिकारिक कैटलॉग
लक्ष्य से सिंक कर सकते हैं। अगर `update.channel` को `beta` पर सेट किया गया है, तो
वह बल्क आधिकारिक सिंक beta-channel संदर्भ का उपयोग करता है। जब आप जानबूझकर किसी
सटीक या टैग किए गए आधिकारिक स्पेक को अनछुआ रखना चाहते हों, तो लक्षित
`update <plugin-id>` का उपयोग करें।

npm इंस्टॉल के लिए, ट्रैक किए गए रिकॉर्ड को बदलने के लिए आप स्पष्ट पैकेज स्पेक
पास कर सकते हैं:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

दूसरा कमांड किसी Plugin को रजिस्ट्री की डिफ़ॉल्ट रिलीज़ लाइन पर वापस ले जाता है,
जब वह पहले किसी सटीक संस्करण या टैग पर पिन किया गया था।

जब `openclaw update` beta चैनल पर चलता है, तो Plugin रिकॉर्ड मिलती-जुलती `@beta`
रिलीज़ को प्राथमिकता दे सकते हैं। सटीक फ़ॉलबैक और पिनिंग नियमों के लिए,
[`openclaw plugins`](/hi/cli/plugins#update) देखें।

## Plugin अनइंस्टॉल करें

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

अनइंस्टॉल Plugin की कॉन्फ़िग प्रविष्टि, स्थायी Plugin इंडेक्स रिकॉर्ड,
allow/deny सूची प्रविष्टियां, और लागू होने पर लिंक किए गए लोड पाथ हटाता है।
प्रबंधित इंस्टॉल डायरेक्टरी हटा दी जाती हैं, जब तक आप `--keep-files` पास नहीं
करते। जब अनइंस्टॉल Plugin स्रोत बदलता है, तो चल रहा प्रबंधित Gateway अपने-आप
रीस्टार्ट हो जाता है।

Nix मोड (`OPENCLAW_NIX_MODE=1`) में, Plugin इंस्टॉल, अपडेट, अनइंस्टॉल, सक्षम,
और अक्षम करने वाले कमांड अक्षम होते हैं। इसके बजाय इंस्टॉल के लिए Nix स्रोत में
उन विकल्पों को प्रबंधित करें।

## स्रोत चुनें

| स्रोत       | कब उपयोग करें                                                               | उदाहरण                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | आपको OpenClaw-नेटिव खोज, स्कैन सारांश, संस्करण, और संकेत चाहिए             | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | आप पहले से JavaScript पैकेज शिप करते हैं या npm dist-tags/private registry चाहिए | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | आपको किसी रिपॉज़िटरी से branch, tag, या commit चाहिए                       | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| स्थानीय पाथ | आप उसी मशीन पर किसी Plugin को विकसित या परीक्षण कर रहे हैं                 | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | आप npm install semantics के माध्यम से किसी स्थानीय पैकेज artifact को साबित कर रहे हैं | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | आप Claude-संगत marketplace Plugin इंस्टॉल कर रहे हैं                       | `openclaw plugins install <plugin> --marketplace <source>`     |

प्रबंधित स्थानीय पाथ इंस्टॉल Plugin डायरेक्टरी या आर्काइव होने चाहिए। स्वतंत्र
Plugin फ़ाइलों को `plugins install` से इंस्टॉल करने के बजाय `plugins.load.paths`
में रखें।

## Plugin प्रकाशित करें

ClawHub OpenClaw Plugin के लिए प्राथमिक सार्वजनिक खोज सतह है। जब आप चाहते हैं कि
उपयोगकर्ता इंस्टॉल करने से पहले Plugin मेटाडेटा, संस्करण इतिहास, रजिस्ट्री स्कैन
परिणाम, और इंस्टॉल संकेत खोज सकें, तो वहां प्रकाशित करें।

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

नेटिव npm Plugin में प्रकाशित करने से पहले Plugin मैनिफ़ेस्ट और पैकेज मेटाडेटा
शामिल होना चाहिए:

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

इस पेज को प्रकाशन संदर्भ मानने के बजाय, पूर्ण प्रकाशन कॉन्ट्रैक्ट के लिए इन पेजों
का उपयोग करें:

- [ClawHub प्रकाशन](/hi/clawhub/publishing) owners, scopes, releases,
  review, package validation, और package transfer समझाता है।
- [Plugin बनाना](/hi/plugins/building-plugins) Plugin पैकेज का आकार और पहला
  publish वर्कफ़्लो दिखाता है।
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) नेटिव Plugin मैनिफ़ेस्ट फ़ील्ड परिभाषित करता है।

अगर वही पैकेज ClawHub और npm दोनों पर उपलब्ध है, तो जब आपको किसी एक स्रोत को
बलपूर्वक चुनना हो, स्पष्ट `clawhub:` या `npm:` प्रीफ़िक्स का उपयोग करें।

## संबंधित

- [Plugin](/hi/tools/plugin) - इंस्टॉल, कॉन्फ़िगर, रीस्टार्ट, और समस्या निवारण
- [`openclaw plugins`](/hi/cli/plugins) - पूर्ण CLI संदर्भ
- [समुदाय Plugin](/hi/plugins/community) - सार्वजनिक खोज और ClawHub प्रकाशन
- [ClawHub](/hi/clawhub/cli) - रजिस्ट्री CLI ऑपरेशन
- [Plugin बनाना](/hi/plugins/building-plugins) - Plugin पैकेज बनाएं
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - मैनिफ़ेस्ट और पैकेज मेटाडेटा
