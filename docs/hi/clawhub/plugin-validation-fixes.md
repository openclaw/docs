---
read_when:
    - आपने `clawhub package validate` चलाया और Plugin निष्कर्षों को ठीक करना है
    - ClawHub ने Plugin पैकेज प्रकाशित करने पर अस्वीकार किया या चेतावनी दी
    - आप रिलीज़ से पहले Plugin पैकेज मेटाडेटा अपडेट कर रहे हैं
summary: प्रकाशित करने से पहले ClawHub Plugin पैकेज सत्यापन निष्कर्षों को ठीक करें
title: Plugin सत्यापन सुधार
x-i18n:
    generated_at: "2026-07-04T20:32:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin सत्यापन सुधार

ClawHub प्रकाशित करने से पहले plugin पैकेजों को सत्यापित करता है और स्वचालित पैकेज स्कैन से मिली findings भी दिखा सकता है। यह पृष्ठ author-facing findings को कवर करता है, यानी वे findings जिन्हें plugin author अपने पैकेज metadata, manifest, SDK imports, या published artifact में ठीक कर सकता है।

यह आंतरिक Plugin Inspector coverage findings को कवर नहीं करता। यदि किसी पूर्ण रिपोर्ट में author remediation guidance के बिना scanner maintenance codes हों, तो वे plugin authors के बजाय OpenClaw maintainers के लिए हैं।

कोई भी fix लागू करने के बाद, फिर से चलाएँ:

```bash
clawhub package validate <path-to-plugin>
```

## Author-facing findings

| Code                                    | यहाँ से शुरू करें                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [package metadata जोड़ें](/hi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
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
| `sdk-session-store-write`               | [whole-session-store writes बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [session file-path helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [legacy transcript file targets बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [low-level transcript helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start बदलें](/hi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [provider env vars को setup metadata में ले जाएँ](/hi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [channel env vars को current metadata में mirror करें](/hi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [अनुपलब्ध security manifest schema references हटाएँ](/hi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [असमर्थित security manifest files हटाएँ](/hi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Package metadata

### package-json-missing

package root में `package.json` शामिल नहीं है, इसलिए ClawHub npm package, version, entrypoints, या OpenClaw metadata की पहचान नहीं कर सकता।

- `name`, `version`, और `type` के साथ `package.json` जोड़ें।
- जब package कोई OpenClaw plugin ship करता हो, तो `openclaw` block जोड़ें।
- न्यूनतम package example के लिए [Plugins बनाना](/hi/plugins/building-plugins) और package बनाम manifest split के लिए [Plugin manifest](/hi/plugins/manifest#manifest-versus-packagejson) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-metadata-missing

package में `package.json` है, लेकिन यह OpenClaw package metadata घोषित नहीं करता।

- `package.json#openclaw` जोड़ें।
- `openclaw.extensions` या `openclaw.runtimeExtensions` जैसे entrypoint metadata शामिल करें।
- जब package ClawHub के माध्यम से प्रकाशित या install किया जाएगा, तो compatibility और install metadata जोड़ें।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-entry-missing

package metadata मौजूद है, लेकिन यह OpenClaw runtime entrypoint घोषित नहीं करता।

- native plugin entrypoints के लिए `openclaw.extensions` जोड़ें।
- जब published package को built JavaScript load करना हो, तो `openclaw.runtimeExtensions` जोड़ें।
- सभी entrypoint paths को package directory के अंदर रखें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) और [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-entrypoint-missing

package कोई OpenClaw entrypoint घोषित करता है, लेकिन referenced file सत्यापित किए जा रहे package से गायब है।

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, और `openclaw.runtimeSetupEntry` में प्रत्येक path जाँचें।
- यदि entrypoint `dist` में generate होता है, तो package build करें।
- यदि entrypoint move हो गया है, तो metadata update करें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-install-metadata-incomplete

ClawHub यह नहीं बता सकता कि package को कैसे install या update किया जाना चाहिए।

- समर्थित install source, जैसे `clawhubSpec`, `npmSpec`, या `localPath`, के साथ `openclaw.install` भरें।
- जब एक से अधिक install source उपलब्ध हों, तो `openclaw.install.defaultChoice` सेट करें।
- minimum OpenClaw host version के लिए `openclaw.install.minHostVersion` का उपयोग करें।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-plugin-api-compat-missing

package समर्थित OpenClaw plugin API range घोषित नहीं करता।

- `package.json` में `openclaw.compat.pluginApi` जोड़ें।
- वह OpenClaw plugin API version या semver floor उपयोग करें जिसके विरुद्ध आपने build और test किया है।
- इसे package version से अलग रखें। package version plugin release का वर्णन करता है; `openclaw.compat.pluginApi` host API contract का वर्णन करता है।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-min-host-version-drift

package minimum host version उस OpenClaw version metadata से match नहीं करता जिसके विरुद्ध package build किया गया था।

- `openclaw.install.minHostVersion` जाँचें।
- package में कोई भी OpenClaw build metadata जाँचें, जैसे release के दौरान उपयोग किया गया OpenClaw version।
- minimum host version को उस host version range के साथ संरेखित करें जिसे package वास्तव में support करता है।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-manifest-version-drift

package version और plugin manifest version में असहमति है।

- package release version के रूप में `package.json#version` को प्राथमिकता दें।
- यदि `openclaw.plugin.json` में भी `version` है, तो उसे match करने के लिए update करें या जब package metadata authoritative हो तो stale manifest version metadata हटाएँ।
- published metadata बदलने के बाद नया package version publish करें।
- [Plugin manifest](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-unsupported-metadata

`package.json#openclaw` block में ऐसे fields हैं जो समर्थित OpenClaw package metadata नहीं हैं।

- `openclaw.bundle` जैसे असमर्थित fields हटाएँ।
- native plugin metadata को `openclaw.plugin.json` में रखें।
- package entrypoints, compatibility, install, setup, और catalog metadata को समर्थित `package.json#openclaw` fields में रखें।
- [discovery को प्रभावित करने वाले package.json fields](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## Published artifact

### package-npm-pack-unavailable

package को उस artifact में pack नहीं किया जा सकता जिसे ClawHub inspect या publish करेगा।

- package root से `npm pack --dry-run` चलाएँ।
- अमान्य package metadata, टूटे हुए lifecycle scripts, या files entries ठीक करें जिनसे packing fail होती है।
- यदि यह package public publishing के लिए intended है, तो `private: true` हटाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-entrypoint-missing

package pack किया जा सकता है, लेकिन packed artifact में `package.json#openclaw` में घोषित entrypoint files शामिल नहीं हैं।

- `npm pack --dry-run` चलाएँ और शामिल की जाने वाली files inspect करें।
- packing से पहले generated entrypoints build करें।
- `files`, `.npmignore`, या build output update करें ताकि घोषित entrypoints शामिल हों।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-metadata-missing

packed artifact में वह OpenClaw metadata गायब है जो आपके source package में मौजूद है।

- `npm pack --dry-run` चलाएँ और included metadata files inspect करें।
- सुनिश्चित करें कि `package.json` packed artifact में `openclaw` block शामिल करता है।
- जब package native OpenClaw plugin हो, तो सुनिश्चित करें कि `openclaw.plugin.json` शामिल है।
- `files` या `.npmignore` update करें ताकि package metadata exclude न हो।
- [Plugins बनाना](/hi/plugins/building-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## Manifest metadata

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
- पैकेज या इंस्टॉल मेटाडेटा को मैनिफेस्ट के बजाय समर्थित `package.json#openclaw` फ़ील्ड में
  ले जाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-contracts

मैनिफेस्ट `contracts` के अंदर असमर्थित कुंजियाँ घोषित करता है।

- `contracts` के अंतर्गत प्रत्येक कुंजी की तुलना
  [contracts संदर्भ](/hi/plugins/manifest#contracts-reference) से करें।
- असमर्थित कॉन्ट्रैक्ट कुंजियाँ हटाएँ।
- रनटाइम व्यवहार को Plugin रजिस्ट्रेशन कोड में ले जाएँ, और `contracts` को
  स्थिर क्षमता स्वामित्व मेटाडेटा तक सीमित रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## SDK और संगतता माइग्रेशन

### legacy-root-sdk-import

Plugin अप्रचलित रूट SDK बैरल से इंपोर्ट करता है:
`openclaw/plugin-sdk`.

- रूट-बैरल इंपोर्ट को केंद्रित सार्वजनिक सबपाथ इंपोर्ट से बदलें।
- `definePluginEntry` के लिए `openclaw/plugin-sdk/plugin-entry` का उपयोग करें।
- चैनल एंट्री हेल्पर के लिए `openclaw/plugin-sdk/channel-core` का उपयोग करें।
- संकीर्ण इंपोर्ट खोजने के लिए [इंपोर्ट परंपराएँ](/hi/plugins/building-plugins#import-conventions) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### reserved-sdk-import

Plugin ऐसा SDK पाथ इंपोर्ट करता है जो बंडल किए गए plugins या आंतरिक
संगतता के लिए आरक्षित है।

- आरक्षित OpenClaw आंतरिक SDK इंपोर्ट को दस्तावेज़ित सार्वजनिक
  `openclaw/plugin-sdk/*` सबपाथ से बदलें।
- यदि व्यवहार के लिए कोई सार्वजनिक SDK नहीं है, तो हेल्पर को अपने पैकेज के अंदर रखें या
  सार्वजनिक OpenClaw API का अनुरोध करें।
- समर्थित इंपोर्ट चुनने के लिए [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-load-session-store

Plugin अभी भी अप्रचलित पूर्ण-सेशन-स्टोर हेल्पर
`loadSessionStore` का उपयोग करता है।

- सेशन स्थिति पढ़ते समय `getSessionEntry(...)` या `listSessionEntries(...)` का उपयोग करें।
- सेशन स्थिति लिखते समय `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सेशन स्टोर ऑब्जेक्ट को लोड, म्यूटेट और सेव करने से बचें।
- `loadSessionStore(...)` को केवल तब तक रखें जब तक आपकी घोषित संगतता रेंज
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-store-write

Plugin अभी भी अप्रचलित पूर्ण-सेशन-स्टोर राइट हेल्पर जैसे
`saveSessionStore` या `updateSessionStore` का उपयोग करता है।

- मौजूदा सेशन एंट्री पर फ़ील्ड अपडेट करते समय `patchSessionEntry(...)` का उपयोग करें।
- सेशन एंट्री बदलते या बनाते समय `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सेशन स्टोर ऑब्जेक्ट को लोड, म्यूटेट और सेव करने से बचें।
- पूर्ण-स्टोर राइट हेल्पर को केवल तब तक रखें जब तक आपकी घोषित संगतता रेंज
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-file-helper

Plugin अभी भी अप्रचलित सेशन फ़ाइल-पाथ हेल्पर जैसे
`resolveSessionFilePath` या `resolveAndPersistSessionFile` का उपयोग करता है।

- एजेंट और सेशन पहचान के आधार पर सेशन मेटाडेटा पढ़ने के लिए `getSessionEntry(...)` का उपयोग करें।
- सेशन मेटाडेटा को स्थायी करने के लिए `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- जब कोड किसी ट्रांसक्रिप्ट ऑपरेशन की तैयारी कर रहा हो, तो ट्रांसक्रिप्ट पहचान या लक्ष्य हेल्पर का उपयोग करें।
- पुराने ट्रांसक्रिप्ट फ़ाइल पाथ पर निर्भर न रहें या उन्हें स्थायी न करें।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-file-target

Plugin अभी भी अप्रचलित ट्रांसक्रिप्ट फ़ाइल लक्ष्य हेल्पर
`resolveSessionTranscriptLegacyFileTarget` का उपयोग करता है।

- जब कोड को केवल सार्वजनिक सेशन पहचान की आवश्यकता हो, तो `resolveSessionTranscriptIdentity(...)` का उपयोग करें।
- जब कोड को संरचित ट्रांसक्रिप्ट ऑपरेशन लक्ष्य की आवश्यकता हो, तो `resolveSessionTranscriptTarget(...)` का उपयोग करें।
- पुराने ट्रांसक्रिप्ट फ़ाइल लक्ष्यों को सीधे पढ़ने या बनाने से बचें।
- पुराने हेल्पर को केवल तब तक रखें जब तक आपकी घोषित संगतता रेंज अभी भी
  पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-low-level

Plugin अभी भी अप्रचलित निम्न-स्तरीय ट्रांसक्रिप्ट हेल्पर जैसे
`appendSessionTranscriptMessage` या `emitSessionTranscriptUpdate` का उपयोग करता है।

- ट्रांसक्रिप्ट जोड़ने के लिए `appendSessionTranscriptMessageByIdentity(...)` का उपयोग करें।
- ट्रांसक्रिप्ट अपडेट सूचनाओं के लिए `publishSessionTranscriptUpdateByIdentity(...)` का उपयोग करें।
- संरचित ट्रांसक्रिप्ट रनटाइम सतह को प्राथमिकता दें ताकि OpenClaw सही
  ट्रांज़ैक्शन सीमाएँ और पहचान हैंडलिंग लागू कर सके।
- निम्न-स्तरीय ट्रांसक्रिप्ट हेल्पर को केवल तब तक रखें जब तक आपकी घोषित संगतता रेंज
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK सबपाथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### legacy-before-agent-start

Plugin अभी भी पुराने `before_agent_start` हुक का उपयोग करता है।

- मॉडल या प्रोवाइडर ओवरराइड कार्य को `before_model_resolve` में ले जाएँ।
- प्रॉम्प्ट या संदर्भ म्यूटेशन कार्य को `before_prompt_build` में ले जाएँ।
- `before_agent_start` को केवल तब तक रखें जब तक आपकी घोषित संगतता रेंज अभी भी
  पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [हुक](/hi/plugins/hooks) और
  [Plugin संगतता](/hi/plugins/compatibility) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### provider-auth-env-vars

मैनिफेस्ट अभी भी पुराना `providerAuthEnvVars` प्रोवाइडर auth मेटाडेटा उपयोग करता है।

- प्रोवाइडर env-var मेटाडेटा को `setup.providers[].envVars` में मिरर करें।
- `providerAuthEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें, जब तक आपकी समर्थित
  OpenClaw रेंज को अभी भी इसकी आवश्यकता है।
- [setup संदर्भ](/hi/plugins/manifest#setup-reference) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### channel-env-vars

मैनिफेस्ट पुराने या पुराने-तरह के चैनल env-var मेटाडेटा का उपयोग करता है, जिसमें वह मौजूदा
setup या config मेटाडेटा नहीं है जिसकी ClawHub अपेक्षा करता है।

- चैनल env-var मेटाडेटा को घोषणात्मक रखें ताकि OpenClaw चैनल रनटाइम लोड किए बिना
  setup स्थिति का निरीक्षण कर सके।
- env-चालित चैनल setup को वर्तमान setup, चैनल config, या
  आपके Plugin आकार द्वारा उपयोग किए जाने वाले पैकेज चैनल मेटाडेटा में मिरर करें।
- `channelEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें, जब तक पुराने समर्थित
  OpenClaw संस्करणों को अभी भी इसकी आवश्यकता है।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) और
  [चैनल plugins](/hi/plugins/sdk-channel-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## सुरक्षा मैनिफेस्ट

### security-manifest-schema-unavailable

पैकेज `openclaw.security.json` को ऐसे स्कीमा संदर्भ के साथ शिप करता है जिसे ClawHub
उपलब्ध के रूप में नहीं पहचानता।

- यदि स्कीमा URL केवल सलाहकारी है, तो उसे हटाएँ।
- दस्तावेज़ित संस्करणित स्कीमा का उपयोग केवल OpenClaw द्वारा उसे प्रकाशित करने के बाद करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### unrecognized-security-manifest

पैकेज एक असमर्थित सुरक्षा मैनिफेस्ट फ़ाइल शिप करता है।

- `openclaw.security.json` को तब तक हटाएँ जब तक OpenClaw किसी संस्करणित सुरक्षा
  मैनिफेस्ट स्कीमा और ClawHub व्यवहार का दस्तावेज़ीकरण नहीं करता।
- मैनिफेस्ट कॉन्ट्रैक्ट मौजूद होने तक सुरक्षा-संवेदनशील व्यवहार को अपने सार्वजनिक पैकेज docs या
  README में दस्तावेज़ित रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## संबंधित

- [ClawHub CLI](/hi/clawhub/cli)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
- [plugins बनाना](/hi/plugins/building-plugins)
- [Plugin मैनिफेस्ट](/hi/plugins/manifest)
- [Plugin एंट्री पॉइंट](/hi/plugins/sdk-entrypoints)
- [Plugin संगतता](/hi/plugins/compatibility)
