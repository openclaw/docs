---
read_when:
    - आपने clawhub package validate चलाया और Plugin निष्कर्षों को ठीक करना है
    - Plugin पैकेज प्रकाशित करने पर ClawHub ने अस्वीकार किया या चेतावनी दी
    - आप रिलीज़ से पहले Plugin पैकेज मेटाडेटा अपडेट कर रहे हैं
summary: प्रकाशित करने से पहले ClawHub Plugin पैकेज सत्यापन निष्कर्षों को ठीक करें
title: Plugin सत्यापन सुधार
x-i18n:
    generated_at: "2026-06-28T22:44:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin सत्यापन सुधार

ClawHub प्रकाशित करने से पहले Plugin पैकेजों को सत्यापित करता है और स्वचालित पैकेज स्कैन से मिली findings भी दिखा सकता है। यह पृष्ठ लेखक-उन्मुख findings को कवर करता है, यानी ऐसी findings जिन्हें Plugin लेखक अपने पैकेज metadata, manifest, SDK imports, या प्रकाशित artifact में ठीक कर सकता है।

यह आंतरिक Plugin Inspector coverage findings को कवर नहीं करता। यदि किसी पूर्ण रिपोर्ट में लेखक remediation मार्गदर्शन के बिना scanner maintenance codes हों, तो वे Plugin लेखकों के बजाय OpenClaw maintainers के लिए हैं।

कोई भी सुधार लागू करने के बाद, फिर से चलाएँ:

```bash
clawhub package validate <path-to-plugin>
```

## लेखक-उन्मुख findings

| Code                                    | यहाँ से शुरू करें                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [पैकेज metadata जोड़ें](/hi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [package openclaw block जोड़ें](/hi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw package entrypoints घोषित करें](/hi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [घोषित entrypoint प्रकाशित करें](/hi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [install metadata पूरा करें](/hi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [plugin API compatibility घोषित करें](/hi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [minimum host version संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [package और manifest versions संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [असमर्थित OpenClaw package metadata हटाएँ](/hi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm artifact को packable बनाएँ](/hi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack output में entrypoints शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack output में metadata शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [manifest display name जोड़ें](/hi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [असमर्थित manifest fields हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [असमर्थित contract keys हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [root SDK imports बदलें](/hi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [reserved SDK imports हटाएँ](/hi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [whole-session-store access बदलें](/hi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [before_agent_start बदलें](/hi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [provider env vars को setup metadata में ले जाएँ](/hi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [channel env vars को current metadata में mirror करें](/hi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [अनुपलब्ध security manifest schema references हटाएँ](/hi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [असमर्थित security manifest files हटाएँ](/hi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## पैकेज metadata

### package-json-missing

पैकेज root में `package.json` शामिल नहीं है, इसलिए ClawHub npm पैकेज, version, entrypoints, या OpenClaw metadata की पहचान नहीं कर सकता।

- `name`, `version`, और `type` के साथ `package.json` जोड़ें।
- जब पैकेज OpenClaw Plugin भेजता हो, तो `openclaw` block जोड़ें।
- न्यूनतम पैकेज उदाहरण के लिए [Plugins बनाना](/hi/plugins/building-plugins) और package बनाम manifest विभाजन के लिए [Plugin manifest](/hi/plugins/manifest#manifest-versus-packagejson) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-metadata-missing

पैकेज में `package.json` है, लेकिन यह OpenClaw package metadata घोषित नहीं करता।

- `package.json#openclaw` जोड़ें।
- `openclaw.extensions` या `openclaw.runtimeExtensions` जैसे entrypoint metadata शामिल करें।
- जब पैकेज ClawHub के माध्यम से प्रकाशित या install किया जाएगा, तो compatibility और install metadata जोड़ें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-entry-missing

पैकेज metadata मौजूद है, लेकिन यह OpenClaw runtime entrypoint घोषित नहीं करता।

- native plugin entrypoints के लिए `openclaw.extensions` जोड़ें।
- जब प्रकाशित पैकेज को built JavaScript load करना हो, तो `openclaw.runtimeExtensions` जोड़ें।
- सभी entrypoint paths को पैकेज directory के अंदर रखें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) और [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-entrypoint-missing

पैकेज OpenClaw entrypoint घोषित करता है, लेकिन संदर्भित file सत्यापित किए जा रहे पैकेज से गायब है।

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, और `openclaw.runtimeSetupEntry` में प्रत्येक path जाँचें।
- यदि entrypoint `dist` में generate होता है, तो पैकेज build करें।
- यदि entrypoint स्थानांतरित हो गया है, तो metadata update करें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-install-metadata-incomplete

ClawHub यह नहीं बता सकता कि पैकेज को कैसे install या update किया जाना चाहिए।

- समर्थित install source, जैसे `clawhubSpec`, `npmSpec`, या `localPath`, के साथ `openclaw.install` भरें।
- जब एक से अधिक install source उपलब्ध हों, तो `openclaw.install.defaultChoice` set करें।
- न्यूनतम OpenClaw host version के लिए `openclaw.install.minHostVersion` का उपयोग करें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-plugin-api-compat-missing

पैकेज समर्थित OpenClaw plugin API range घोषित नहीं करता।

- `package.json` में `openclaw.compat.pluginApi` जोड़ें।
- जिस OpenClaw plugin API version या semver floor के विरुद्ध आपने build और test किया है, उसका उपयोग करें।
- इसे package version से अलग रखें। package version Plugin release का वर्णन करता है; `openclaw.compat.pluginApi` host API contract का वर्णन करता है।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-min-host-version-drift

पैकेज minimum host version उस OpenClaw version metadata से मेल नहीं खाता जिसके विरुद्ध पैकेज build किया गया था।

- `openclaw.install.minHostVersion` जाँचें।
- पैकेज में कोई भी OpenClaw build metadata जाँचें, जैसे release के दौरान उपयोग किया गया OpenClaw version।
- minimum host version को उस host version range के साथ संरेखित करें जिसका पैकेज वास्तव में समर्थन करता है।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-manifest-version-drift

package version और Plugin manifest version में असहमति है।

- package release version के रूप में `package.json#version` को प्राथमिकता दें।
- यदि `openclaw.plugin.json` में भी `version` है, तो उसे match करने के लिए update करें या जब package metadata authoritative हो तो stale manifest version metadata हटाएँ।
- published metadata बदलने के बाद नया package version publish करें।
- [Plugin manifest](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-unsupported-metadata

`package.json#openclaw` block में ऐसे fields हैं जो समर्थित OpenClaw package metadata नहीं हैं।

- `openclaw.bundle` जैसे unsupported fields हटाएँ।
- native plugin metadata को `openclaw.plugin.json` में रखें।
- package entrypoints, compatibility, install, setup, और catalog metadata को supported `package.json#openclaw` fields में रखें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## प्रकाशित artifact

### package-npm-pack-unavailable

पैकेज उस artifact में pack नहीं किया जा सकता जिसे ClawHub inspect या publish करेगा।

- package root से `npm pack --dry-run` चलाएँ।
- invalid package metadata, broken lifecycle scripts, या files entries को ठीक करें जो packing को fail कराते हैं।
- यदि यह package public publishing के लिए intended है, तो `private: true` हटाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-entrypoint-missing

पैकेज pack किया जा सकता है, लेकिन packed artifact में `package.json#openclaw` में घोषित entrypoint files शामिल नहीं हैं।

- `npm pack --dry-run` चलाएँ और शामिल होने वाली files inspect करें।
- packing से पहले generated entrypoints build करें।
- `files`, `.npmignore`, या build output update करें ताकि घोषित entrypoints शामिल हों।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-metadata-missing

packed artifact में आपके source package में मौजूद OpenClaw metadata गायब है।

- `npm pack --dry-run` चलाएँ और included metadata files inspect करें।
- सुनिश्चित करें कि packed artifact में `package.json` में `openclaw` block शामिल हो।
- जब package native OpenClaw Plugin हो, तो सुनिश्चित करें कि `openclaw.plugin.json` शामिल हो।
- `files` या `.npmignore` update करें ताकि package metadata exclude न हो।
- [Plugins बनाना](/hi/plugins/building-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## Manifest metadata

### manifest-name-missing

native plugin manifest में display name शामिल नहीं है।

- `openclaw.plugin.json` में non-empty `name` field जोड़ें।
- `name` को human-readable रखें और `id` को stable machine id के रूप में रखें।
- [Plugin manifest](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-fields

Plugin manifest में top-level fields हैं जिनका OpenClaw समर्थन नहीं करता।

- हर शीर्ष-स्तरीय फ़ील्ड की तुलना
  [मैनिफेस्ट फ़ील्ड संदर्भ](/hi/plugins/manifest#top-level-field-reference) से करें।
- `openclaw.plugin.json` से कस्टम फ़ील्ड हटाएँ।
- पैकेज या इंस्टॉल मेटाडेटा को मैनिफेस्ट के बजाय समर्थित
  `package.json#openclaw` फ़ील्ड में ले जाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-contracts

मैनिफेस्ट `contracts` के अंदर असमर्थित कुंजियाँ घोषित करता है।

- `contracts` के अंतर्गत हर कुंजी की तुलना
  [कॉन्ट्रैक्ट संदर्भ](/hi/plugins/manifest#contracts-reference) से करें।
- असमर्थित कॉन्ट्रैक्ट कुंजियाँ हटाएँ।
- रनटाइम व्यवहार को Plugin पंजीकरण कोड में ले जाएँ, और `contracts`
  को स्थिर क्षमता स्वामित्व मेटाडेटा तक सीमित रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## SDK और संगतता माइग्रेशन

### legacy-root-sdk-import

Plugin अप्रचलित रूट SDK बैरल से इम्पोर्ट करता है:
`openclaw/plugin-sdk`.

- रूट-बैरल इम्पोर्ट को केंद्रित सार्वजनिक सबपाथ इम्पोर्ट से बदलें।
- `definePluginEntry` के लिए `openclaw/plugin-sdk/plugin-entry` का उपयोग करें।
- चैनल एंट्री हेल्पर के लिए `openclaw/plugin-sdk/channel-core` का उपयोग करें।
- संकीर्ण इम्पोर्ट खोजने के लिए [इम्पोर्ट परंपराएँ](/hi/plugins/building-plugins#import-conventions) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### reserved-sdk-import

Plugin ऐसा SDK पथ इम्पोर्ट करता है जो बंडल किए गए Plugin या आंतरिक
संगतता के लिए आरक्षित है।

- आरक्षित OpenClaw आंतरिक SDK इम्पोर्ट को दस्तावेजीकृत सार्वजनिक
  `openclaw/plugin-sdk/*` सबपाथ से बदलें।
- यदि व्यवहार के लिए कोई सार्वजनिक SDK नहीं है, तो हेल्पर को अपने पैकेज के अंदर रखें या
  सार्वजनिक OpenClaw API का अनुरोध करें।
- समर्थित इम्पोर्ट चुनने के लिए [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-load-session-store

Plugin अब भी अप्रचलित पूर्ण-सेशन-स्टोर हेल्पर
`loadSessionStore` का उपयोग करता है।

- सेशन स्थिति पढ़ते समय `getSessionEntry(...)` या `listSessionEntries(...)` का उपयोग करें।
- सेशन स्थिति लिखते समय `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सेशन स्टोर ऑब्जेक्ट को लोड, म्यूटेट और सेव करने से बचें।
- `loadSessionStore(...)` केवल तब तक रखें जब तक आपकी घोषित संगतता रेंज
  उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### legacy-before-agent-start

Plugin अब भी पुराने `before_agent_start` हुक का उपयोग करता है।

- मॉडल या प्रदाता ओवरराइड कार्य को `before_model_resolve` में ले जाएँ।
- प्रॉम्प्ट या संदर्भ म्यूटेशन कार्य को `before_prompt_build` में ले जाएँ।
- `before_agent_start` केवल तब तक रखें जब तक आपकी घोषित संगतता रेंज अब भी
  उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [हुक](/hi/plugins/hooks) और
  [Plugin संगतता](/hi/plugins/compatibility) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### provider-auth-env-vars

मैनिफेस्ट अब भी पुराने `providerAuthEnvVars` प्रदाता auth मेटाडेटा का उपयोग करता है।

- प्रदाता env-var मेटाडेटा को `setup.providers[].envVars` में मिरर करें।
- `providerAuthEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें, जब तक आपकी समर्थित
  OpenClaw रेंज को अब भी इसकी आवश्यकता है।
- [सेटअप संदर्भ](/hi/plugins/manifest#setup-reference) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### channel-env-vars

मैनिफेस्ट पुराने या पुरातन चैनल env-var मेटाडेटा का उपयोग करता है जिसमें वर्तमान
सेटअप या कॉन्फ़िग मेटाडेटा नहीं है जिसकी ClawHub अपेक्षा करता है।

- चैनल env-var मेटाडेटा को घोषणात्मक रखें ताकि OpenClaw चैनल रनटाइम लोड किए बिना
  सेटअप स्थिति का निरीक्षण कर सके।
- env-संचालित चैनल सेटअप को अपने Plugin आकार द्वारा उपयोग किए जाने वाले वर्तमान सेटअप, चैनल कॉन्फ़िग या
  पैकेज चैनल मेटाडेटा में मिरर करें।
- `channelEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें, जब तक पुराने समर्थित
  OpenClaw संस्करणों को अब भी इसकी आवश्यकता है।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) और
  [चैनल Plugin](/hi/plugins/sdk-channel-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## सुरक्षा मैनिफेस्ट

### security-manifest-schema-unavailable

पैकेज `openclaw.security.json` को ऐसे स्कीमा संदर्भ के साथ शिप करता है जिसे ClawHub
उपलब्ध के रूप में नहीं पहचानता।

- यदि स्कीमा URL केवल सलाहकारी है, तो उसे हटाएँ।
- दस्तावेजीकृत संस्करणित स्कीमा का उपयोग केवल OpenClaw द्वारा उसे प्रकाशित करने के बाद करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### unrecognized-security-manifest

पैकेज एक असमर्थित सुरक्षा मैनिफेस्ट फ़ाइल शिप करता है।

- `openclaw.security.json` को तब तक हटाएँ जब तक OpenClaw कोई संस्करणित सुरक्षा
  मैनिफेस्ट स्कीमा और ClawHub व्यवहार दस्तावेजीकृत नहीं करता।
- सुरक्षा-संवेदनशील व्यवहार को अपने सार्वजनिक पैकेज दस्तावेज़ों या
  README में तब तक दस्तावेजीकृत रखें जब तक मैनिफेस्ट कॉन्ट्रैक्ट मौजूद न हो।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## संबंधित

- [ClawHub CLI](/hi/clawhub/cli)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
- [Plugin बनाना](/hi/plugins/building-plugins)
- [Plugin मैनिफेस्ट](/hi/plugins/manifest)
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints)
- [Plugin संगतता](/hi/plugins/compatibility)
