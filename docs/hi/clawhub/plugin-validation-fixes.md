---
read_when:
    - आपने clawhub package validate चलाया और Plugin निष्कर्षों को ठीक करना है
    - ClawHub ने Plugin पैकेज प्रकाशन को अस्वीकार किया या उस पर चेतावनी दी
    - आप रिलीज़ से पहले Plugin पैकेज मेटाडेटा अपडेट कर रहे हैं
summary: प्रकाशन से पहले ClawHub Plugin पैकेज सत्यापन निष्कर्षों को ठीक करें
title: Plugin सत्यापन सुधार
x-i18n:
    generated_at: "2026-07-02T08:16:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin वैलिडेशन सुधार

ClawHub प्रकाशित करने से पहले Plugin पैकेजों को वैलिडेट करता है और स्वचालित पैकेज स्कैन से मिली खोजें भी दिखा सकता है। यह पेज लेखक-उन्मुख खोजों को कवर करता है, यानी वे खोजें जिन्हें Plugin लेखक अपने पैकेज मेटाडेटा, मैनिफ़ेस्ट, SDK imports, या प्रकाशित आर्टिफ़ैक्ट में ठीक कर सकता है।

यह आंतरिक Plugin Inspector कवरेज खोजों को कवर नहीं करता। अगर किसी पूरी रिपोर्ट में लेखक के लिए सुधार मार्गदर्शन के बिना स्कैनर रखरखाव कोड शामिल हैं, तो वे Plugin लेखकों के बजाय OpenClaw maintainers के लिए हैं।

कोई भी सुधार लागू करने के बाद, फिर से चलाएँ:

```bash
clawhub package validate <path-to-plugin>
```

## लेखक-उन्मुख खोजें

| कोड                                    | यहाँ से शुरू करें                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [पैकेज मेटाडेटा जोड़ें](/hi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [पैकेज openclaw ब्लॉक जोड़ें](/hi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw पैकेज entrypoints घोषित करें](/hi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [घोषित entrypoint प्रकाशित करें](/hi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [इंस्टॉल मेटाडेटा पूरा करें](/hi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [plugin API संगतता घोषित करें](/hi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [न्यूनतम host version संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [पैकेज और मैनिफ़ेस्ट versions संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [असमर्थित OpenClaw पैकेज मेटाडेटा हटाएँ](/hi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm आर्टिफ़ैक्ट को packable बनाएँ](/hi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack output में entrypoints शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack output में मेटाडेटा शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [मैनिफ़ेस्ट display name जोड़ें](/hi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [असमर्थित मैनिफ़ेस्ट fields हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [असमर्थित contract keys हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [root SDK imports बदलें](/hi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [आरक्षित SDK imports हटाएँ](/hi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [whole-session-store access बदलें](/hi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [whole-session-store writes बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [session file-path helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [legacy transcript file targets बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [low-level transcript helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start बदलें](/hi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [provider env vars को setup metadata में ले जाएँ](/hi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [channel env vars को मौजूदा metadata में mirror करें](/hi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [अनुपलब्ध security manifest schema references हटाएँ](/hi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [असमर्थित security manifest files हटाएँ](/hi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## पैकेज मेटाडेटा

### package-json-missing

पैकेज root में `package.json` शामिल नहीं है, इसलिए ClawHub npm पैकेज, version, entrypoints, या OpenClaw मेटाडेटा की पहचान नहीं कर सकता।

- `name`, `version`, और `type` के साथ `package.json` जोड़ें।
- जब पैकेज OpenClaw plugin शिप करता हो, तो `openclaw` ब्लॉक जोड़ें।
- न्यूनतम पैकेज उदाहरण के लिए [Plugins बनाना](/hi/plugins/building-plugins) और पैकेज बनाम मैनिफ़ेस्ट विभाजन के लिए [Plugin manifest](/hi/plugins/manifest#manifest-versus-packagejson) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-metadata-missing

पैकेज में `package.json` है, लेकिन यह OpenClaw पैकेज मेटाडेटा घोषित नहीं करता।

- `package.json#openclaw` जोड़ें।
- `openclaw.extensions` या `openclaw.runtimeExtensions` जैसा entrypoint मेटाडेटा शामिल करें।
- जब पैकेज ClawHub के माध्यम से प्रकाशित या इंस्टॉल किया जाएगा, तब संगतता और इंस्टॉल मेटाडेटा जोड़ें।
- [डिस्कवरी को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-entry-missing

पैकेज मेटाडेटा मौजूद है, लेकिन यह OpenClaw runtime entrypoint घोषित नहीं करता।

- native plugin entrypoints के लिए `openclaw.extensions` जोड़ें।
- जब प्रकाशित पैकेज को built JavaScript load करना चाहिए, तो `openclaw.runtimeExtensions` जोड़ें।
- सभी entrypoint paths को पैकेज directory के अंदर रखें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) और [डिस्कवरी को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-entrypoint-missing

पैकेज एक OpenClaw entrypoint घोषित करता है, लेकिन संदर्भित file वैलिडेट किए जा रहे पैकेज में मौजूद नहीं है।

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, और `openclaw.runtimeSetupEntry` में हर path जाँचें।
- अगर entrypoint `dist` में generate होता है, तो पैकेज build करें।
- अगर entrypoint moved हो गया है, तो metadata अपडेट करें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-install-metadata-incomplete

ClawHub यह नहीं बता सकता कि पैकेज कैसे इंस्टॉल या अपडेट किया जाना चाहिए।

- `openclaw.install` को समर्थित install source से भरें, जैसे `clawhubSpec`, `npmSpec`, या `localPath`।
- जब एक से अधिक install source उपलब्ध हों, तो `openclaw.install.defaultChoice` सेट करें।
- न्यूनतम OpenClaw host version के लिए `openclaw.install.minHostVersion` का उपयोग करें।
- [डिस्कवरी को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-plugin-api-compat-missing

पैकेज उस OpenClaw plugin API range को घोषित नहीं करता जिसे वह support करता है।

- `package.json` में `openclaw.compat.pluginApi` जोड़ें।
- वह OpenClaw plugin API version या semver floor उपयोग करें जिसके विरुद्ध आपने build और test किया है।
- इसे पैकेज version से अलग रखें। पैकेज version plugin release को वर्णित करता है; `openclaw.compat.pluginApi` host API contract को वर्णित करता है।
- [डिस्कवरी को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-min-host-version-drift

पैकेज minimum host version उस OpenClaw version metadata से मेल नहीं खाता जिसके विरुद्ध पैकेज बनाया गया था।

- `openclaw.install.minHostVersion` जाँचें।
- पैकेज में कोई भी OpenClaw build metadata जाँचें, जैसे release के दौरान उपयोग किया गया OpenClaw version।
- minimum host version को उस host version range के साथ संरेखित करें जिसे पैकेज वास्तव में support करता है।
- [डिस्कवरी को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-manifest-version-drift

पैकेज version और plugin manifest version में असहमति है।

- पैकेज release version के रूप में `package.json#version` को प्राथमिकता दें।
- अगर `openclaw.plugin.json` में भी `version` है, तो उसे match करने के लिए अपडेट करें या जब package metadata authoritative हो तो stale manifest version metadata हटाएँ।
- published metadata बदलने के बाद नया package version प्रकाशित करें।
- [Plugin manifest](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-unsupported-metadata

`package.json#openclaw` ब्लॉक में ऐसे fields हैं जो OpenClaw package metadata के रूप में supported नहीं हैं।

- `openclaw.bundle` जैसे unsupported fields हटाएँ।
- native plugin metadata को `openclaw.plugin.json` में रखें।
- package entrypoints, compatibility, install, setup, और catalog metadata को supported `package.json#openclaw` fields में रखें।
- [डिस्कवरी को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## प्रकाशित आर्टिफ़ैक्ट

### package-npm-pack-unavailable

पैकेज को उस artifact में pack नहीं किया जा सकता जिसे ClawHub inspect या publish करेगा।

- पैकेज root से `npm pack --dry-run` चलाएँ।
- invalid package metadata, broken lifecycle scripts, या ऐसी files entries ठीक करें जिनसे packing fail होती है।
- अगर यह package public publishing के लिए intended है, तो `private: true` हटाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-entrypoint-missing

पैकेज pack किया जा सकता है, लेकिन packed artifact में `package.json#openclaw` में declared entrypoint files शामिल नहीं हैं।

- `npm pack --dry-run` चलाएँ और शामिल की जाने वाली files inspect करें।
- packing से पहले generated entrypoints build करें।
- `files`, `.npmignore`, या build output अपडेट करें ताकि declared entrypoints शामिल हों।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-metadata-missing

packed artifact में वह OpenClaw metadata नहीं है जो आपके source package में मौजूद है।

- `npm pack --dry-run` चलाएँ और included metadata files inspect करें।
- सुनिश्चित करें कि `package.json` में packed artifact में `openclaw` block शामिल है।
- जब package native OpenClaw plugin हो, तो सुनिश्चित करें कि `openclaw.plugin.json` शामिल है।
- `files` या `.npmignore` अपडेट करें ताकि package metadata exclude न हो।
- [Plugins बनाना](/hi/plugins/building-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## मैनिफ़ेस्ट मेटाडेटा

### manifest-name-missing

नेटिव Plugin मैनिफेस्ट में प्रदर्शन नाम शामिल नहीं है।

- `openclaw.plugin.json` में गैर-रिक्त `name` फ़ील्ड जोड़ें।
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

Plugin ऐसे SDK पथ को इम्पोर्ट करता है जो बंडल किए गए Plugin या आंतरिक
संगतता के लिए आरक्षित है।

- आरक्षित OpenClaw आंतरिक SDK इम्पोर्ट को दस्तावेजीकृत सार्वजनिक
  `openclaw/plugin-sdk/*` सबपाथ से बदलें।
- यदि व्यवहार के लिए कोई सार्वजनिक SDK नहीं है, तो हेल्पर को अपने पैकेज के अंदर रखें या
  सार्वजनिक OpenClaw API का अनुरोध करें।
- समर्थित इम्पोर्ट चुनने के लिए [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-load-session-store

Plugin अभी भी अप्रचलित पूर्ण-सत्र-स्टोर हेल्पर
`loadSessionStore` का उपयोग करता है।

- सत्र स्थिति पढ़ते समय `getSessionEntry(...)` या `listSessionEntries(...)` का उपयोग करें।
- सत्र स्थिति लिखते समय `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सत्र स्टोर ऑब्जेक्ट को लोड करने, बदलने और सहेजने से बचें।
- `loadSessionStore(...)` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अब भी उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-store-write

Plugin अभी भी `saveSessionStore` या `updateSessionStore` जैसे अप्रचलित पूर्ण-सत्र-स्टोर लेखन हेल्पर का उपयोग करता है।

- किसी मौजूदा सत्र एंट्री पर फ़ील्ड अपडेट करते समय `patchSessionEntry(...)` का उपयोग करें।
- सत्र एंट्री बदलते या बनाते समय `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सत्र स्टोर ऑब्जेक्ट को लोड करने, बदलने और सहेजने से बचें।
- पूर्ण-स्टोर लेखन हेल्पर केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अब भी उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-file-helper

Plugin अभी भी `resolveSessionFilePath` या `resolveAndPersistSessionFile` जैसे
अप्रचलित सत्र फ़ाइल-पथ हेल्पर का उपयोग करता है।

- एजेंट और सत्र पहचान के अनुसार सत्र मेटाडेटा पढ़ने के लिए `getSessionEntry(...)` का उपयोग करें।
- सत्र मेटाडेटा स्थायी करने के लिए `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- जब कोड ट्रांसक्रिप्ट ऑपरेशन तैयार कर रहा हो, तो ट्रांसक्रिप्ट पहचान या लक्ष्य हेल्पर का उपयोग करें।
- लेगेसी ट्रांसक्रिप्ट फ़ाइल पथों को स्थायी न करें या उन पर निर्भर न रहें।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-file-target

Plugin अभी भी अप्रचलित ट्रांसक्रिप्ट फ़ाइल लक्ष्य हेल्पर
`resolveSessionTranscriptLegacyFileTarget` का उपयोग करता है।

- जब कोड को केवल सार्वजनिक सत्र पहचान चाहिए, तो `resolveSessionTranscriptIdentity(...)` का उपयोग करें।
- जब कोड को संरचित ट्रांसक्रिप्ट ऑपरेशन लक्ष्य चाहिए, तो `resolveSessionTranscriptTarget(...)` का उपयोग करें।
- लेगेसी ट्रांसक्रिप्ट फ़ाइल लक्ष्यों को सीधे पढ़ने या बनाने से बचें।
- लेगेसी हेल्पर को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अब भी
  उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-low-level

Plugin अभी भी `appendSessionTranscriptMessage` या `emitSessionTranscriptUpdate` जैसे
अप्रचलित निम्न-स्तरीय ट्रांसक्रिप्ट हेल्पर का उपयोग करता है।

- ट्रांसक्रिप्ट जोड़ने के लिए `appendSessionTranscriptMessageByIdentity(...)` का उपयोग करें।
- ट्रांसक्रिप्ट अपडेट सूचनाओं के लिए `publishSessionTranscriptUpdateByIdentity(...)` का उपयोग करें।
- संरचित ट्रांसक्रिप्ट रनटाइम सतह को प्राथमिकता दें ताकि OpenClaw सही
  लेन-देन सीमाएँ और पहचान प्रबंधन लागू कर सके।
- निम्न-स्तरीय ट्रांसक्रिप्ट हेल्पर केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अब भी उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### legacy-before-agent-start

Plugin अभी भी लेगेसी `before_agent_start` हुक का उपयोग करता है।

- मॉडल या प्रोवाइडर ओवरराइड कार्य को `before_model_resolve` में ले जाएँ।
- प्रॉम्प्ट या संदर्भ परिवर्तन कार्य को `before_prompt_build` में ले जाएँ।
- `before_agent_start` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अब भी
  उन पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [हुक](/hi/plugins/hooks) और
  [Plugin संगतता](/hi/plugins/compatibility) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### provider-auth-env-vars

मैनिफेस्ट अभी भी लेगेसी `providerAuthEnvVars` प्रोवाइडर प्रमाणीकरण मेटाडेटा का उपयोग करता है।

- प्रोवाइडर env-var मेटाडेटा को `setup.providers[].envVars` में मिरर करें।
- `providerAuthEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें, जब तक आपकी समर्थित
  OpenClaw सीमा को अब भी इसकी आवश्यकता है।
- [setup संदर्भ](/hi/plugins/manifest#setup-reference) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### channel-env-vars

मैनिफेस्ट लेगेसी या पुराने चैनल env-var मेटाडेटा का उपयोग करता है, जिसमें मौजूदा
setup या config मेटाडेटा नहीं है जिसकी ClawHub अपेक्षा करता है।

- चैनल env-var मेटाडेटा को घोषणात्मक रखें ताकि OpenClaw चैनल रनटाइम लोड किए बिना
  setup स्थिति की जाँच कर सके।
- env-संचालित चैनल setup को आपके Plugin आकार द्वारा उपयोग किए जाने वाले मौजूदा setup, चैनल config, या
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
- दस्तावेजीकृत संस्करणित स्कीमा का उपयोग केवल OpenClaw द्वारा एक प्रकाशित किए जाने के बाद करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### unrecognized-security-manifest

पैकेज एक असमर्थित सुरक्षा मैनिफेस्ट फ़ाइल शिप करता है।

- जब तक OpenClaw संस्करणित सुरक्षा मैनिफेस्ट स्कीमा और ClawHub व्यवहार का दस्तावेजीकरण नहीं करता,
  `openclaw.security.json` हटाएँ।
- जब तक मैनिफेस्ट contract मौजूद नहीं है, सुरक्षा-संवेदनशील व्यवहार को अपने सार्वजनिक पैकेज दस्तावेज़ों या
  README में दस्तावेजीकृत रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## संबंधित

- [ClawHub CLI](/hi/clawhub/cli)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
- [Plugin बनाना](/hi/plugins/building-plugins)
- [Plugin मैनिफेस्ट](/hi/plugins/manifest)
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints)
- [Plugin संगतता](/hi/plugins/compatibility)
