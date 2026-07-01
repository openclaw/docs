---
read_when:
    - आपने clawhub package validate चलाया और आपको Plugin निष्कर्ष ठीक करने हैं
    - ClawHub ने Plugin पैकेज प्रकाशन को अस्वीकार किया या उस पर चेतावनी दी
    - आप रिलीज़ से पहले Plugin पैकेज मेटाडेटा अपडेट कर रहे हैं
summary: प्रकाशित करने से पहले ClawHub Plugin पैकेज सत्यापन निष्कर्षों को ठीक करें
title: Plugin सत्यापन सुधार
x-i18n:
    generated_at: "2026-07-01T15:24:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin सत्यापन सुधार

ClawHub प्रकाशित करने से पहले Plugin पैकेजों को सत्यापित करता है और
स्वचालित पैकेज स्कैन से मिले निष्कर्ष भी दिखा सकता है। यह पेज लेखक-उन्मुख निष्कर्षों को कवर करता है, यानी
वे निष्कर्ष जिन्हें Plugin लेखक अपने पैकेज मेटाडेटा, मैनिफेस्ट, SDK
imports, या प्रकाशित artifact में ठीक कर सकते हैं।

यह आंतरिक Plugin Inspector कवरेज निष्कर्षों को कवर नहीं करता। यदि पूरी रिपोर्ट में
लेखक सुधार मार्गदर्शन के बिना स्कैनर रखरखाव कोड हैं, तो वे
Plugin लेखकों के बजाय OpenClaw maintainers के लिए हैं।

कोई भी सुधार लागू करने के बाद, फिर से चलाएं:

```bash
clawhub package validate <path-to-plugin>
```

## लेखक-उन्मुख निष्कर्ष

| कोड                                    | यहां से शुरू करें                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [पैकेज मेटाडेटा जोड़ें](/hi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [पैकेज openclaw ब्लॉक जोड़ें](/hi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw पैकेज प्रवेश-बिंदु घोषित करें](/hi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [घोषित प्रवेश-बिंदु प्रकाशित करें](/hi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [install मेटाडेटा पूरा करें](/hi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API संगतता घोषित करें](/hi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [न्यूनतम host version संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [पैकेज और मैनिफेस्ट versions संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [असमर्थित OpenClaw पैकेज मेटाडेटा हटाएं](/hi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm artifact को pack करने योग्य बनाएं](/hi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack output में प्रवेश-बिंदु शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack output में मेटाडेटा शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [मैनिफेस्ट display name जोड़ें](/hi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [असमर्थित मैनिफेस्ट fields हटाएं](/hi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [असमर्थित contract keys हटाएं](/hi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [root SDK imports बदलें](/hi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [आरक्षित SDK imports हटाएं](/hi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [पूरे-session-store access को बदलें](/hi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [पूरे-session-store writes को बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [session file-path helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [legacy transcript file targets बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [low-level transcript helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start बदलें](/hi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [provider env vars को setup मेटाडेटा में ले जाएं](/hi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [channel env vars को मौजूदा मेटाडेटा में mirror करें](/hi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [अनुपलब्ध security manifest schema references हटाएं](/hi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [असमर्थित security manifest files हटाएं](/hi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## पैकेज मेटाडेटा

### package-json-missing

पैकेज root में `package.json` शामिल नहीं है, इसलिए ClawHub
npm पैकेज, version, प्रवेश-बिंदु, या OpenClaw मेटाडेटा की पहचान नहीं कर सकता।

- `name`, `version`, और `type` के साथ `package.json` जोड़ें।
- जब पैकेज OpenClaw Plugin भेजता है, तो `openclaw` ब्लॉक जोड़ें।
- न्यूनतम पैकेज उदाहरण के लिए [Plugin बनाना](/hi/plugins/building-plugins)
  और पैकेज बनाम मैनिफेस्ट विभाजन के लिए [Plugin मैनिफेस्ट](/hi/plugins/manifest#manifest-versus-packagejson)
  का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-openclaw-metadata-missing

पैकेज में `package.json` है, लेकिन यह OpenClaw पैकेज
मेटाडेटा घोषित नहीं करता।

- `package.json#openclaw` जोड़ें।
- `openclaw.extensions` या
  `openclaw.runtimeExtensions` जैसे प्रवेश-बिंदु मेटाडेटा शामिल करें।
- जब पैकेज ClawHub के माध्यम से प्रकाशित या install किया जाएगा, तो
  compatibility और install मेटाडेटा जोड़ें।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-openclaw-entry-missing

पैकेज मेटाडेटा मौजूद है, लेकिन यह OpenClaw runtime
प्रवेश-बिंदु घोषित नहीं करता।

- native Plugin प्रवेश-बिंदुओं के लिए `openclaw.extensions` जोड़ें।
- जब प्रकाशित पैकेज को built
  JavaScript load करना चाहिए, तो `openclaw.runtimeExtensions` जोड़ें।
- सभी प्रवेश-बिंदु paths को पैकेज directory के अंदर रखें।
- [Plugin प्रवेश-बिंदु](/hi/plugins/sdk-entrypoints) और
  [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-entrypoint-missing

पैकेज OpenClaw प्रवेश-बिंदु घोषित करता है, लेकिन संदर्भित file
सत्यापित किए जा रहे पैकेज से गायब है।

- `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry`, और `openclaw.runtimeSetupEntry` में हर path जांचें।
- यदि प्रवेश-बिंदु `dist` में generated है, तो पैकेज build करें।
- यदि प्रवेश-बिंदु move हो गया है, तो मेटाडेटा update करें।
- [Plugin प्रवेश-बिंदु](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-install-metadata-incomplete

ClawHub यह नहीं बता सकता कि पैकेज कैसे install या update किया जाना चाहिए।

- समर्थित install source, जैसे
  `clawhubSpec`, `npmSpec`, या `localPath` के साथ `openclaw.install` भरें।
- जब एक से अधिक install source उपलब्ध हों, तो
  `openclaw.install.defaultChoice` set करें।
- न्यूनतम OpenClaw host version के लिए `openclaw.install.minHostVersion` का उपयोग करें।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-plugin-api-compat-missing

पैकेज समर्थित OpenClaw Plugin API range घोषित नहीं करता।

- `package.json` में `openclaw.compat.pluginApi` जोड़ें।
- वह OpenClaw Plugin API version या semver floor उपयोग करें जिसके विरुद्ध आपने build और test किया है।
- इसे पैकेज version से अलग रखें। पैकेज version
  Plugin release का वर्णन करता है; `openclaw.compat.pluginApi` host API contract का वर्णन करता है।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-min-host-version-drift

पैकेज का न्यूनतम host version उस OpenClaw version मेटाडेटा से मेल नहीं खाता
जिसके विरुद्ध पैकेज build किया गया था।

- `openclaw.install.minHostVersion` जांचें।
- पैकेज में कोई भी OpenClaw build मेटाडेटा जांचें, जैसे release के दौरान उपयोग किया गया
  OpenClaw version।
- न्यूनतम host version को उस host version range के साथ संरेखित करें जिसे पैकेज
  वास्तव में support करता है।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-manifest-version-drift

पैकेज version और Plugin मैनिफेस्ट version असहमत हैं।

- पैकेज release version के रूप में `package.json#version` को प्राथमिकता दें।
- यदि `openclaw.plugin.json` में भी `version` है, तो उसे मिलाने के लिए update करें या
  जब पैकेज मेटाडेटा authoritative हो, तो stale मैनिफेस्ट version मेटाडेटा हटाएं।
- प्रकाशित मेटाडेटा बदलने के बाद नया पैकेज version प्रकाशित करें।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-openclaw-unsupported-metadata

`package.json#openclaw` ब्लॉक में ऐसे fields हैं जो समर्थित
OpenClaw पैकेज मेटाडेटा नहीं हैं।

- `openclaw.bundle` जैसे असमर्थित fields हटाएं।
- native Plugin मेटाडेटा `openclaw.plugin.json` में रखें।
- पैकेज प्रवेश-बिंदु, compatibility, install, setup, और catalog मेटाडेटा को
  समर्थित `package.json#openclaw` fields में रखें।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

## प्रकाशित artifact

### package-npm-pack-unavailable

पैकेज को उस artifact में pack नहीं किया जा सकता जिसे ClawHub inspect या
publish करेगा।

- पैकेज root से `npm pack --dry-run` चलाएं।
- invalid पैकेज मेटाडेटा, broken lifecycle scripts, या ऐसी files entries ठीक करें जो
  packing को fail कराती हैं।
- यदि यह पैकेज public publishing के लिए है, तो `private: true` हटाएं।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-npm-pack-entrypoint-missing

पैकेज pack किया जा सकता है, लेकिन packed artifact में
`package.json#openclaw` में घोषित प्रवेश-बिंदु files शामिल नहीं हैं।

- `npm pack --dry-run` चलाएं और शामिल होने वाली files inspect करें।
- packing से पहले generated प्रवेश-बिंदु build करें।
- `files`, `.npmignore`, या build output update करें ताकि घोषित प्रवेश-बिंदु
  शामिल हों।
- [Plugin प्रवेश-बिंदु](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-npm-pack-metadata-missing

packed artifact में वह OpenClaw मेटाडेटा गायब है जो आपके source
पैकेज में मौजूद है।

- `npm pack --dry-run` चलाएं और शामिल metadata files inspect करें।
- सुनिश्चित करें कि packed artifact में `package.json` में `openclaw` ब्लॉक शामिल है।
- जब पैकेज native
  OpenClaw Plugin हो, तो सुनिश्चित करें कि `openclaw.plugin.json` शामिल है।
- `files` या `.npmignore` update करें ताकि पैकेज मेटाडेटा exclude न हो।
- [Plugin बनाना](/hi/plugins/building-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

## मैनिफेस्ट मेटाडेटा

### manifest-name-missing

नेटिव Plugin मैनिफेस्ट में डिस्प्ले नाम शामिल नहीं है।

- `openclaw.plugin.json` में एक गैर-खाली `name` फ़ील्ड जोड़ें।
- `name` को मानव-पठनीय रखें और `id` को स्थिर मशीन id के रूप में रखें।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-fields

Plugin मैनिफेस्ट में शीर्ष-स्तरीय फ़ील्ड हैं जिनका OpenClaw समर्थन नहीं करता।

- प्रत्येक शीर्ष-स्तरीय फ़ील्ड की तुलना
  [मैनिफेस्ट फ़ील्ड संदर्भ](/hi/plugins/manifest#top-level-field-reference) से करें।
- `openclaw.plugin.json` से कस्टम फ़ील्ड हटाएँ।
- पैकेज या इंस्टॉल मेटाडेटा को मैनिफेस्ट के बजाय समर्थित
  `package.json#openclaw` फ़ील्ड में ले जाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-contracts

मैनिफेस्ट `contracts` के अंदर असमर्थित कुंजियाँ घोषित करता है।

- `contracts` के अंतर्गत प्रत्येक कुंजी की तुलना
  [contracts संदर्भ](/hi/plugins/manifest#contracts-reference) से करें।
- असमर्थित कॉन्ट्रैक्ट कुंजियाँ हटाएँ।
- रनटाइम व्यवहार को Plugin रजिस्ट्रेशन कोड में ले जाएँ, और `contracts`
  को स्थिर क्षमता स्वामित्व मेटाडेटा तक सीमित रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## SDK और संगतता माइग्रेशन

### legacy-root-sdk-import

Plugin अप्रचलित रूट SDK बैरल से इंपोर्ट करता है:
`openclaw/plugin-sdk`.

- रूट-बैरल इंपोर्ट को केंद्रित सार्वजनिक सबपाथ इंपोर्ट से बदलें।
- `definePluginEntry` के लिए `openclaw/plugin-sdk/plugin-entry` का उपयोग करें।
- चैनल एंट्री हेल्पर के लिए `openclaw/plugin-sdk/channel-core` का उपयोग करें।
- संकीर्ण इंपोर्ट खोजने के लिए [इंपोर्ट कन्वेंशन](/hi/plugins/building-plugins#import-conventions) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### reserved-sdk-import

Plugin ऐसा SDK पाथ इंपोर्ट करता है जो बंडल किए गए Plugin या आंतरिक
संगतता के लिए आरक्षित है।

- आरक्षित OpenClaw आंतरिक SDK इंपोर्ट को प्रलेखित सार्वजनिक
  `openclaw/plugin-sdk/*` सबपाथ से बदलें।
- यदि व्यवहार के लिए कोई सार्वजनिक SDK नहीं है, तो हेल्पर को अपने पैकेज के अंदर रखें या
  सार्वजनिक OpenClaw API का अनुरोध करें।
- समर्थित इंपोर्ट चुनने के लिए [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-load-session-store

Plugin अभी भी अप्रचलित पूरे-सेशन-स्टोर हेल्पर
`loadSessionStore` का उपयोग करता है।

- सेशन स्थिति पढ़ते समय `getSessionEntry(...)` या `listSessionEntries(...)` का उपयोग करें।
- सेशन स्थिति लिखते समय `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सेशन स्टोर ऑब्जेक्ट को लोड करने, बदलने और सहेजने से बचें।
- `loadSessionStore(...)` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-store-write

Plugin अभी भी अप्रचलित पूरे-सेशन-स्टोर लिखने वाले हेल्पर, जैसे
`saveSessionStore` या `updateSessionStore`, का उपयोग करता है।

- मौजूदा सेशन एंट्री पर फ़ील्ड अपडेट करते समय `patchSessionEntry(...)` का उपयोग करें।
- सेशन एंट्री को बदलते या बनाते समय `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सेशन स्टोर ऑब्जेक्ट को लोड करने, बदलने और सहेजने से बचें।
- पूरे-स्टोर लिखने वाले हेल्पर केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-file-helper

Plugin अभी भी अप्रचलित सेशन फ़ाइल-पाथ हेल्पर, जैसे
`resolveSessionFilePath` या `resolveAndPersistSessionFile`, का उपयोग करता है।

- एजेंट और सेशन पहचान के आधार पर सेशन मेटाडेटा पढ़ने के लिए `getSessionEntry(...)` का उपयोग करें।
- सेशन मेटाडेटा को स्थायी करने के लिए `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- जब कोड ट्रांसक्रिप्ट ऑपरेशन तैयार कर रहा हो, तो ट्रांसक्रिप्ट पहचान या टारगेट हेल्पर का उपयोग करें।
- पुराने ट्रांसक्रिप्ट फ़ाइल पाथ पर निर्भर न रहें या उन्हें स्थायी न करें।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-file-target

Plugin अभी भी अप्रचलित ट्रांसक्रिप्ट फ़ाइल टारगेट हेल्पर
`resolveSessionTranscriptLegacyFileTarget` का उपयोग करता है।

- जब कोड को केवल सार्वजनिक सेशन पहचान की आवश्यकता हो, तो `resolveSessionTranscriptIdentity(...)` का उपयोग करें।
- जब कोड को संरचित ट्रांसक्रिप्ट ऑपरेशन टारगेट की आवश्यकता हो, तो `resolveSessionTranscriptTarget(...)` का उपयोग करें।
- पुराने ट्रांसक्रिप्ट फ़ाइल टारगेट को सीधे पढ़ने या बनाने से बचें।
- पुराने हेल्पर को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अभी भी
  उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-low-level

Plugin अभी भी अप्रचलित निम्न-स्तरीय ट्रांसक्रिप्ट हेल्पर, जैसे
`appendSessionTranscriptMessage` या `emitSessionTranscriptUpdate`, का उपयोग करता है।

- ट्रांसक्रिप्ट जोड़ने के लिए `appendSessionTranscriptMessageByIdentity(...)` का उपयोग करें।
- ट्रांसक्रिप्ट अपडेट सूचनाओं के लिए `publishSessionTranscriptUpdateByIdentity(...)` का उपयोग करें।
- संरचित ट्रांसक्रिप्ट रनटाइम सतह को प्राथमिकता दें ताकि OpenClaw सही
  ट्रांज़ैक्शन सीमाएँ और पहचान प्रबंधन लागू कर सके।
- निम्न-स्तरीय ट्रांसक्रिप्ट हेल्पर केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### legacy-before-agent-start

Plugin अभी भी पुराने `before_agent_start` हुक का उपयोग करता है।

- मॉडल या प्रदाता ओवरराइड कार्य को `before_model_resolve` में ले जाएँ।
- प्रॉम्प्ट या कॉन्टेक्स्ट म्यूटेशन कार्य को `before_prompt_build` में ले जाएँ।
- `before_agent_start` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अभी भी
  उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [हुक](/hi/plugins/hooks) और
  [Plugin संगतता](/hi/plugins/compatibility) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### provider-auth-env-vars

मैनिफेस्ट अभी भी पुराने `providerAuthEnvVars` प्रदाता auth मेटाडेटा का उपयोग करता है।

- प्रदाता env-var मेटाडेटा को `setup.providers[].envVars` में मिरर करें।
- `providerAuthEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें, जब तक आपकी समर्थित
  OpenClaw सीमा को अभी भी इसकी आवश्यकता है।
- [setup संदर्भ](/hi/plugins/manifest#setup-reference) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### channel-env-vars

मैनिफेस्ट वर्तमान setup या config मेटाडेटा के बिना पुराने या पुरातन चैनल env-var मेटाडेटा का उपयोग करता है
जिसकी ClawHub अपेक्षा करता है।

- चैनल env-var मेटाडेटा को घोषणात्मक रखें ताकि OpenClaw चैनल रनटाइम लोड किए बिना
  setup स्थिति की जाँच कर सके।
- env-आधारित चैनल setup को आपके Plugin आकार द्वारा उपयोग किए जाने वाले वर्तमान setup, चैनल config, या
  पैकेज चैनल मेटाडेटा में मिरर करें।
- `channelEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें, जब तक पुराने समर्थित
  OpenClaw संस्करणों को अभी भी इसकी आवश्यकता है।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) और
  [चैनल Plugin](/hi/plugins/sdk-channel-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## सुरक्षा मैनिफेस्ट

### security-manifest-schema-unavailable

पैकेज `openclaw.security.json` को ऐसे स्कीमा संदर्भ के साथ शिप करता है जिसे ClawHub
उपलब्ध के रूप में नहीं पहचानता।

- यदि स्कीमा URL केवल सलाहकारी है, तो उसे हटाएँ।
- OpenClaw द्वारा कोई संस्करणित स्कीमा प्रकाशित करने के बाद ही प्रलेखित संस्करणित स्कीमा का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### unrecognized-security-manifest

पैकेज एक असमर्थित सुरक्षा मैनिफेस्ट फ़ाइल शिप करता है।

- जब तक OpenClaw संस्करणित सुरक्षा मैनिफेस्ट स्कीमा और ClawHub व्यवहार का दस्तावेज़ीकरण नहीं करता,
  `openclaw.security.json` हटाएँ।
- मैनिफेस्ट कॉन्ट्रैक्ट मौजूद होने तक सुरक्षा-संवेदनशील व्यवहार को अपने सार्वजनिक पैकेज दस्तावेज़ों या
  README में प्रलेखित रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## संबंधित

- [ClawHub CLI](/hi/clawhub/cli)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
- [Plugin बनाना](/hi/plugins/building-plugins)
- [Plugin मैनिफेस्ट](/hi/plugins/manifest)
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints)
- [Plugin संगतता](/hi/plugins/compatibility)
