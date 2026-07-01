---
read_when:
    - आपने clawhub package validate चलाया और Plugin findings ठीक करने की आवश्यकता है
    - ClawHub ने Plugin पैकेज के प्रकाशन को अस्वीकार किया या उस पर चेतावनी दी
    - आप रिलीज़ से पहले Plugin पैकेज मेटाडेटा अपडेट कर रहे हैं
summary: ClawHub Plugin पैकेज सत्यापन निष्कर्षों को प्रकाशित करने से पहले ठीक करें
title: Plugin सत्यापन सुधार
x-i18n:
    generated_at: "2026-07-01T12:58:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin सत्यापन सुधार

ClawHub प्रकाशित करने से पहले Plugin पैकेजों को सत्यापित करता है और स्वचालित पैकेज स्कैन से मिले निष्कर्ष भी दिखा सकता है। यह पृष्ठ लेखक-संबंधी निष्कर्षों को कवर करता है, यानी वे निष्कर्ष जिन्हें Plugin लेखक अपने पैकेज मेटाडेटा, मैनिफ़ेस्ट, SDK imports, या प्रकाशित आर्टिफ़ैक्ट में ठीक कर सकता है।

यह आंतरिक Plugin Inspector कवरेज निष्कर्षों को कवर नहीं करता। यदि किसी पूर्ण रिपोर्ट में लेखक के लिए remediation मार्गदर्शन के बिना स्कैनर रखरखाव कोड हों, तो वे Plugin लेखकों के बजाय OpenClaw अनुरक्षकों के लिए हैं।

कोई भी सुधार लागू करने के बाद, दोबारा चलाएँ:

```bash
clawhub package validate <path-to-plugin>
```

## लेखक-संबंधी निष्कर्ष

| कोड                                    | यहाँ से शुरू करें                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [पैकेज मेटाडेटा जोड़ें](/hi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [पैकेज openclaw ब्लॉक जोड़ें](/hi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw पैकेज एंट्रीपॉइंट घोषित करें](/hi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [घोषित एंट्रीपॉइंट प्रकाशित करें](/hi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [इंस्टॉल मेटाडेटा पूरा करें](/hi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API संगतता घोषित करें](/hi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [न्यूनतम होस्ट संस्करण संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [पैकेज और मैनिफ़ेस्ट संस्करण संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [असमर्थित OpenClaw पैकेज मेटाडेटा हटाएँ](/hi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm आर्टिफ़ैक्ट को packable बनाएँ](/hi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack आउटपुट में एंट्रीपॉइंट शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack आउटपुट में मेटाडेटा शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [मैनिफ़ेस्ट प्रदर्शन नाम जोड़ें](/hi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [असमर्थित मैनिफ़ेस्ट फ़ील्ड हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [असमर्थित कॉन्ट्रैक्ट कुंजियाँ हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [रूट SDK imports बदलें](/hi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [आरक्षित SDK imports हटाएँ](/hi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [whole-session-store पहुँच बदलें](/hi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [whole-session-store writes बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [session file-path helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [लेगेसी transcript file targets बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [low-level transcript helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start बदलें](/hi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [प्रदाता env vars को setup metadata में ले जाएँ](/hi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [channel env vars को current metadata में मिरर करें](/hi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [अनुपलब्ध सुरक्षा मैनिफ़ेस्ट स्कीमा संदर्भ हटाएँ](/hi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [असमर्थित सुरक्षा मैनिफ़ेस्ट फ़ाइलें हटाएँ](/hi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## पैकेज मेटाडेटा

### package-json-missing

पैकेज रूट में `package.json` शामिल नहीं है, इसलिए ClawHub npm पैकेज, संस्करण, एंट्रीपॉइंट, या OpenClaw मेटाडेटा की पहचान नहीं कर सकता।

- `name`, `version`, और `type` के साथ `package.json` जोड़ें।
- जब पैकेज OpenClaw Plugin शिप करता है, तो `openclaw` ब्लॉक जोड़ें।
- न्यूनतम पैकेज उदाहरण के लिए [Plugin बनाना](/hi/plugins/building-plugins) और पैकेज बनाम मैनिफ़ेस्ट विभाजन के लिए [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest#manifest-versus-packagejson) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-openclaw-metadata-missing

पैकेज में `package.json` है, लेकिन यह OpenClaw पैकेज मेटाडेटा घोषित नहीं करता।

- `package.json#openclaw` जोड़ें।
- `openclaw.extensions` या `openclaw.runtimeExtensions` जैसे एंट्रीपॉइंट मेटाडेटा शामिल करें।
- जब पैकेज ClawHub के माध्यम से प्रकाशित या इंस्टॉल किया जाएगा, तो संगतता और इंस्टॉल मेटाडेटा जोड़ें।
- [खोज को प्रभावित करने वाले package.json फ़ील्ड](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-openclaw-entry-missing

पैकेज मेटाडेटा मौजूद है, लेकिन यह OpenClaw रनटाइम एंट्रीपॉइंट घोषित नहीं करता।

- नेटिव Plugin एंट्रीपॉइंट के लिए `openclaw.extensions` जोड़ें।
- जब प्रकाशित पैकेज को निर्मित JavaScript लोड करना चाहिए, तो `openclaw.runtimeExtensions` जोड़ें।
- सभी एंट्रीपॉइंट पाथ पैकेज डायरेक्टरी के अंदर रखें।
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints) और [खोज को प्रभावित करने वाले package.json फ़ील्ड](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-entrypoint-missing

पैकेज एक OpenClaw एंट्रीपॉइंट घोषित करता है, लेकिन संदर्भित फ़ाइल सत्यापित किए जा रहे पैकेज से गायब है।

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, और `openclaw.runtimeSetupEntry` में प्रत्येक पाथ जाँचें।
- यदि एंट्रीपॉइंट `dist` में जनरेट होता है, तो पैकेज बनाएँ।
- यदि एंट्रीपॉइंट स्थानांतरित हो गया है, तो मेटाडेटा अपडेट करें।
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-install-metadata-incomplete

ClawHub यह नहीं बता सकता कि पैकेज कैसे इंस्टॉल या अपडेट किया जाना चाहिए।

- `openclaw.install` को समर्थित इंस्टॉल स्रोत से भरें, जैसे `clawhubSpec`, `npmSpec`, या `localPath`।
- जब एक से अधिक इंस्टॉल स्रोत उपलब्ध हों, तो `openclaw.install.defaultChoice` सेट करें।
- न्यूनतम OpenClaw होस्ट संस्करण के लिए `openclaw.install.minHostVersion` का उपयोग करें।
- [खोज को प्रभावित करने वाले package.json फ़ील्ड](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-plugin-api-compat-missing

पैकेज वह OpenClaw Plugin API रेंज घोषित नहीं करता जिसका यह समर्थन करता है।

- `package.json` में `openclaw.compat.pluginApi` जोड़ें।
- वह OpenClaw Plugin API संस्करण या semver floor उपयोग करें जिसके विरुद्ध आपने बनाया और परीक्षण किया है।
- इसे पैकेज संस्करण से अलग रखें। पैकेज संस्करण Plugin रिलीज़ का वर्णन करता है; `openclaw.compat.pluginApi` होस्ट API कॉन्ट्रैक्ट का वर्णन करता है।
- [खोज को प्रभावित करने वाले package.json फ़ील्ड](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-min-host-version-drift

पैकेज का न्यूनतम होस्ट संस्करण उस OpenClaw संस्करण मेटाडेटा से मेल नहीं खाता जिसके विरुद्ध पैकेज बनाया गया था।

- `openclaw.install.minHostVersion` जाँचें।
- पैकेज में कोई भी OpenClaw build metadata जाँचें, जैसे रिलीज़ के दौरान उपयोग किया गया OpenClaw संस्करण।
- न्यूनतम होस्ट संस्करण को उस होस्ट संस्करण रेंज के साथ संरेखित करें जिसका पैकेज वास्तव में समर्थन करता है।
- [खोज को प्रभावित करने वाले package.json फ़ील्ड](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-manifest-version-drift

पैकेज संस्करण और Plugin मैनिफ़ेस्ट संस्करण असहमत हैं।

- पैकेज रिलीज़ संस्करण के रूप में `package.json#version` को प्राथमिकता दें।
- यदि `openclaw.plugin.json` में भी `version` है, तो इसे मिलान करने के लिए अपडेट करें या जब पैकेज मेटाडेटा प्रामाणिक हो तो पुराने मैनिफ़ेस्ट संस्करण मेटाडेटा को हटाएँ।
- प्रकाशित मेटाडेटा बदलने के बाद नया पैकेज संस्करण प्रकाशित करें।
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-openclaw-unsupported-metadata

`package.json#openclaw` ब्लॉक में ऐसे फ़ील्ड हैं जो OpenClaw पैकेज मेटाडेटा के रूप में समर्थित नहीं हैं।

- `openclaw.bundle` जैसे असमर्थित फ़ील्ड हटाएँ।
- नेटिव Plugin मेटाडेटा `openclaw.plugin.json` में रखें।
- पैकेज एंट्रीपॉइंट, संगतता, इंस्टॉल, setup, और कैटलॉग मेटाडेटा समर्थित `package.json#openclaw` फ़ील्ड में रखें।
- [खोज को प्रभावित करने वाले package.json फ़ील्ड](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

## प्रकाशित आर्टिफ़ैक्ट

### package-npm-pack-unavailable

पैकेज को उस आर्टिफ़ैक्ट में पैक नहीं किया जा सकता जिसे ClawHub निरीक्षण या प्रकाशित करेगा।

- पैकेज रूट से `npm pack --dry-run` चलाएँ।
- अमान्य पैकेज मेटाडेटा, टूटे lifecycle scripts, या ऐसी files entries ठीक करें जिनसे पैकिंग विफल होती है।
- यदि यह पैकेज सार्वजनिक प्रकाशन के लिए है, तो `private: true` हटाएँ।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-npm-pack-entrypoint-missing

पैकेज पैक किया जा सकता है, लेकिन पैक किए गए आर्टिफ़ैक्ट में `package.json#openclaw` में घोषित एंट्रीपॉइंट फ़ाइलें शामिल नहीं हैं।

- `npm pack --dry-run` चलाएँ और शामिल होने वाली फ़ाइलों का निरीक्षण करें।
- पैकिंग से पहले जनरेट किए गए एंट्रीपॉइंट बनाएँ।
- `files`, `.npmignore`, या build output अपडेट करें ताकि घोषित एंट्रीपॉइंट शामिल हों।
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### package-npm-pack-metadata-missing

पैक किए गए आर्टिफ़ैक्ट में वह OpenClaw मेटाडेटा गायब है जो आपके स्रोत पैकेज में मौजूद है।

- `npm pack --dry-run` चलाएँ और शामिल मेटाडेटा फ़ाइलों का निरीक्षण करें।
- सुनिश्चित करें कि `package.json` में पैक किए गए आर्टिफ़ैक्ट में `openclaw` ब्लॉक शामिल है।
- जब पैकेज नेटिव OpenClaw Plugin हो, तो सुनिश्चित करें कि `openclaw.plugin.json` शामिल है।
- `files` या `.npmignore` अपडेट करें ताकि पैकेज मेटाडेटा बाहर न हो।
- [Plugin बनाना](/hi/plugins/building-plugins) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

## मैनिफ़ेस्ट मेटाडेटा

### manifest-name-missing

नेटिव Plugin मैनिफेस्ट में प्रदर्शन नाम शामिल नहीं है।

- `openclaw.plugin.json` में एक गैर-रिक्त `name` फ़ील्ड जोड़ें।
- `name` को मानव-पठनीय रखें और `id` को स्थिर मशीन id के रूप में रखें।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-fields

Plugin मैनिफेस्ट में शीर्ष-स्तरीय फ़ील्ड हैं जिन्हें OpenClaw समर्थित नहीं करता।

- प्रत्येक शीर्ष-स्तरीय फ़ील्ड की तुलना
  [मैनिफेस्ट फ़ील्ड संदर्भ](/hi/plugins/manifest#top-level-field-reference) से करें।
- `openclaw.plugin.json` से कस्टम फ़ील्ड हटाएँ।
- पैकेज या इंस्टॉल मेटाडेटा को मैनिफेस्ट के बजाय समर्थित `package.json#openclaw` फ़ील्ड में
  ले जाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-contracts

मैनिफेस्ट `contracts` के अंदर असमर्थित कुंजियाँ घोषित करता है।

- `contracts` के अंतर्गत प्रत्येक कुंजी की तुलना
  [contracts संदर्भ](/hi/plugins/manifest#contracts-reference) से करें।
- असमर्थित contract कुंजियाँ हटाएँ।
- रनटाइम व्यवहार को Plugin पंजीकरण कोड में ले जाएँ, और `contracts` को
  स्थिर क्षमता स्वामित्व मेटाडेटा तक सीमित रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## SDK और संगतता माइग्रेशन

### legacy-root-sdk-import

Plugin अप्रचलित रूट SDK barrel से इम्पोर्ट करता है:
`openclaw/plugin-sdk`.

- रूट-barrel इम्पोर्ट को केंद्रित सार्वजनिक subpath इम्पोर्ट से बदलें।
- `definePluginEntry` के लिए `openclaw/plugin-sdk/plugin-entry` का उपयोग करें।
- चैनल entry helpers के लिए `openclaw/plugin-sdk/channel-core` का उपयोग करें।
- संकीर्ण इम्पोर्ट खोजने के लिए [इम्पोर्ट परंपराएँ](/hi/plugins/building-plugins#import-conventions) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### reserved-sdk-import

Plugin ऐसे SDK path को इम्पोर्ट करता है जो bundled plugins या आंतरिक
संगतता के लिए आरक्षित है।

- आरक्षित OpenClaw आंतरिक SDK इम्पोर्ट को दस्तावेजीकृत सार्वजनिक
  `openclaw/plugin-sdk/*` subpaths से बदलें।
- यदि व्यवहार के लिए कोई सार्वजनिक SDK नहीं है, तो helper को अपने पैकेज के अंदर रखें या
  सार्वजनिक OpenClaw API का अनुरोध करें।
- समर्थित इम्पोर्ट चुनने के लिए [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-load-session-store

Plugin अभी भी अप्रचलित whole-session-store helper
`loadSessionStore` का उपयोग करता है।

- session
  state पढ़ते समय `getSessionEntry(...)` या `listSessionEntries(...)` का उपयोग करें।
- session
  state लिखते समय `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- पूरे session store object को लोड, mutate और save करने से बचें।
- `loadSessionStore(...)` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-store-write

Plugin अभी भी `saveSessionStore` या `updateSessionStore` जैसे
अप्रचलित whole-session-store write helper का उपयोग करता है।

- मौजूदा session
  entry पर फ़ील्ड अपडेट करते समय `patchSessionEntry(...)` का उपयोग करें।
- session entry को बदलते या बनाते समय `upsertSessionEntry(...)` का उपयोग करें।
- पूरे session store object को लोड, mutate और save करने से बचें।
- whole-store write helpers को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-file-helper

Plugin अभी भी `resolveSessionFilePath` या `resolveAndPersistSessionFile` जैसे
अप्रचलित session file-path helpers का उपयोग करता है।

- agent और session
  identity के अनुसार session metadata पढ़ने के लिए `getSessionEntry(...)` का उपयोग करें।
- session
  metadata persist करने के लिए `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- जब कोड transcript operation तैयार कर रहा हो, तो transcript identity या target helpers का उपयोग करें।
- legacy transcript file paths को persist न करें और उन पर निर्भर न रहें।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-file-target

Plugin अभी भी अप्रचलित transcript file target helper
`resolveSessionTranscriptLegacyFileTarget` का उपयोग करता है।

- जब कोड को केवल सार्वजनिक
  session identity चाहिए, तो `resolveSessionTranscriptIdentity(...)` का उपयोग करें।
- जब कोड को संरचित
  transcript operation target चाहिए, तो `resolveSessionTranscriptTarget(...)` का उपयोग करें।
- legacy transcript file targets को सीधे पढ़ने या बनाने से बचें।
- legacy helper को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अभी भी
  पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-low-level

Plugin अभी भी `appendSessionTranscriptMessage` या `emitSessionTranscriptUpdate` जैसे
अप्रचलित low-level transcript helpers का उपयोग करता है।

- transcript appends के लिए `appendSessionTranscriptMessageByIdentity(...)` का उपयोग करें।
- transcript update
  notifications के लिए `publishSessionTranscriptUpdateByIdentity(...)` का उपयोग करें।
- संरचित transcript runtime surface को प्राथमिकता दें ताकि OpenClaw सही
  transaction boundaries और identity handling लागू कर सके।
- low-level transcript helpers को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### legacy-before-agent-start

Plugin अभी भी legacy `before_agent_start` hook का उपयोग करता है।

- model या provider override कार्य को `before_model_resolve` में ले जाएँ।
- prompt या context mutation कार्य को `before_prompt_build` में ले जाएँ।
- `before_agent_start` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अभी भी
  पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [Hooks](/hi/plugins/hooks) और
  [Plugin संगतता](/hi/plugins/compatibility) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### provider-auth-env-vars

मैनिफेस्ट अभी भी legacy `providerAuthEnvVars` provider auth metadata का उपयोग करता है।

- provider env-var metadata को `setup.providers[].envVars` में mirror करें।
- `providerAuthEnvVars` को केवल compatibility metadata के रूप में रखें, जब तक आपकी समर्थित
  OpenClaw सीमा को अभी भी इसकी आवश्यकता है।
- [setup संदर्भ](/hi/plugins/manifest#setup-reference) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### channel-env-vars

मैनिफेस्ट मौजूदा setup या config metadata के बिना legacy या पुराने channel env-var metadata का उपयोग करता है, जिसकी ClawHub अपेक्षा करता है।

- channel env-var metadata को declarative रखें ताकि OpenClaw channel runtime लोड किए बिना
  setup status का निरीक्षण कर सके।
- env-driven channel setup को आपके Plugin shape द्वारा उपयोग किए जाने वाले मौजूदा setup, channel config, या
  package channel metadata में mirror करें।
- `channelEnvVars` को केवल compatibility metadata के रूप में रखें, जब तक पुराने समर्थित
  OpenClaw संस्करणों को अभी भी इसकी आवश्यकता है।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) और
  [Channel plugins](/hi/plugins/sdk-channel-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## सुरक्षा मैनिफेस्ट

### security-manifest-schema-unavailable

पैकेज `openclaw.security.json` को ऐसे schema reference के साथ ship करता है जिसे ClawHub
उपलब्ध के रूप में नहीं पहचानता।

- यदि schema URL केवल advisory है, तो उसे हटाएँ।
- OpenClaw द्वारा प्रकाशित किए जाने के बाद ही दस्तावेजीकृत versioned schema का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### unrecognized-security-manifest

पैकेज एक असमर्थित security manifest file ship करता है।

- जब तक OpenClaw versioned security
  manifest schema और ClawHub behavior दस्तावेजीकृत नहीं करता, `openclaw.security.json` हटाएँ।
- manifest contract उपलब्ध होने तक security-sensitive behavior को अपने सार्वजनिक package docs या
  README में दस्तावेजीकृत रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## संबंधित

- [ClawHub CLI](/hi/clawhub/cli)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
- [plugins बनाना](/hi/plugins/building-plugins)
- [Plugin मैनिफेस्ट](/hi/plugins/manifest)
- [Plugin entry points](/hi/plugins/sdk-entrypoints)
- [Plugin संगतता](/hi/plugins/compatibility)
