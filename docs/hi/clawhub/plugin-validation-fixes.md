---
read_when:
    - आपने clawhub package validate चलाया और Plugin निष्कर्षों को ठीक करना है
    - ClawHub ने Plugin पैकेज प्रकाशन को अस्वीकार किया या उस पर चेतावनी दी
    - आप रिलीज़ से पहले Plugin पैकेज मेटाडेटा अपडेट कर रहे हैं
summary: प्रकाशन से पहले ClawHub Plugin पैकेज सत्यापन निष्कर्षों को ठीक करें
title: Plugin सत्यापन सुधार
x-i18n:
    generated_at: "2026-07-02T14:03:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin सत्यापन सुधार

ClawHub publish से पहले Plugin पैकेजों को सत्यापित करता है और automated package scans से मिली findings भी दिखा सकता है। यह पृष्ठ author-facing findings को कवर करता है, यानी वे findings जिन्हें Plugin author अपने package metadata, manifest, SDK imports, या published artifact में ठीक कर सकता है।

यह internal Plugin Inspector coverage findings को कवर नहीं करता। यदि किसी full report में author remediation guidance के बिना scanner maintenance codes शामिल हैं, तो वे Plugin authors के बजाय OpenClaw maintainers के लिए हैं।

कोई भी सुधार लागू करने के बाद, फिर से चलाएँ:

```bash
clawhub package validate <path-to-plugin>
```

## Author-facing findings

| Code                                    | यहाँ से शुरू करें                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [package metadata जोड़ें](/hi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [package openclaw block जोड़ें](/hi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw package entrypoints घोषित करें](/hi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [घोषित entrypoint publish करें](/hi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [install metadata पूरा करें](/hi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API compatibility घोषित करें](/hi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [minimum host version align करें](/hi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [package और manifest versions align करें](/hi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [unsupported OpenClaw package metadata हटाएँ](/hi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm artifact को packable बनाएँ](/hi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack output में entrypoints शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack output में metadata शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [manifest display name जोड़ें](/hi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [unsupported manifest fields हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [unsupported contract keys हटाएँ](/hi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [root SDK imports बदलें](/hi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [reserved SDK imports हटाएँ](/hi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [whole-session-store access बदलें](/hi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [whole-session-store writes बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [session file-path helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [legacy transcript file targets बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [low-level transcript helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start बदलें](/hi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [provider env vars को setup metadata में ले जाएँ](/hi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [current metadata में channel env vars mirror करें](/hi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [unavailable security manifest schema references हटाएँ](/hi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [unsupported security manifest files हटाएँ](/hi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Package metadata

### package-json-missing

package root में `package.json` शामिल नहीं है, इसलिए ClawHub npm package, version, entrypoints, या OpenClaw metadata की पहचान नहीं कर सकता।

- `name`, `version`, और `type` के साथ `package.json` जोड़ें।
- जब package कोई OpenClaw Plugin ship करता हो, तो `openclaw` block जोड़ें।
- minimal package example के लिए [Building plugins](/hi/plugins/building-plugins) और package बनाम manifest split के लिए [Plugin manifest](/hi/plugins/manifest#manifest-versus-packagejson) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-metadata-missing

package में `package.json` है, लेकिन यह OpenClaw package metadata घोषित नहीं करता।

- `package.json#openclaw` जोड़ें।
- `openclaw.extensions` या `openclaw.runtimeExtensions` जैसे entrypoint metadata शामिल करें।
- जब package ClawHub के माध्यम से publish या install किया जाएगा, तो compatibility और install metadata जोड़ें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-entry-missing

package metadata मौजूद है, लेकिन यह OpenClaw runtime entrypoint घोषित नहीं करता।

- native Plugin entrypoints के लिए `openclaw.extensions` जोड़ें।
- जब published package को built JavaScript load करना चाहिए, तो `openclaw.runtimeExtensions` जोड़ें।
- सभी entrypoint paths को package directory के भीतर रखें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) और [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-entrypoint-missing

package एक OpenClaw entrypoint घोषित करता है, लेकिन referenced file सत्यापित किए जा रहे package से गायब है।

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, और `openclaw.runtimeSetupEntry` में प्रत्येक path जाँचें।
- यदि entrypoint `dist` में generate होता है, तो package build करें।
- यदि entrypoint move हो गया है, तो metadata update करें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-install-metadata-incomplete

ClawHub यह नहीं बता सकता कि package कैसे install या update किया जाना चाहिए।

- supported install source, जैसे `clawhubSpec`, `npmSpec`, या `localPath`, के साथ `openclaw.install` भरें।
- जब एक से अधिक install source उपलब्ध हों, तो `openclaw.install.defaultChoice` set करें।
- minimum OpenClaw host version के लिए `openclaw.install.minHostVersion` का उपयोग करें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-plugin-api-compat-missing

package वह OpenClaw Plugin API range घोषित नहीं करता जिसे यह support करता है।

- `package.json` में `openclaw.compat.pluginApi` जोड़ें।
- वह OpenClaw Plugin API version या semver floor उपयोग करें जिसके विरुद्ध आपने build और test किया है।
- इसे package version से अलग रखें। package version Plugin release का वर्णन करता है; `openclaw.compat.pluginApi` host API contract का वर्णन करता है।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-min-host-version-drift

package minimum host version उस OpenClaw version metadata से मेल नहीं खाता जिसके विरुद्ध package build किया गया था।

- `openclaw.install.minHostVersion` जाँचें।
- package में कोई भी OpenClaw build metadata जाँचें, जैसे release के दौरान उपयोग किया गया OpenClaw version।
- minimum host version को उस host version range के साथ align करें जिसे package वास्तव में support करता है।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-manifest-version-drift

package version और Plugin manifest version में असहमति है।

- package release version के रूप में `package.json#version` को प्राथमिकता दें।
- यदि `openclaw.plugin.json` में भी `version` है, तो उसे match करने के लिए update करें या जब package metadata authoritative हो, तो stale manifest version metadata हटाएँ।
- published metadata बदलने के बाद नया package version publish करें।
- [Plugin manifest](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-openclaw-unsupported-metadata

`package.json#openclaw` block में ऐसे fields हैं जो supported OpenClaw package metadata नहीं हैं।

- `openclaw.bundle` जैसे unsupported fields हटाएँ।
- native Plugin metadata को `openclaw.plugin.json` में रखें।
- package entrypoints, compatibility, install, setup, और catalog metadata को supported `package.json#openclaw` fields में रखें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## Published artifact

### package-npm-pack-unavailable

package को उस artifact में pack नहीं किया जा सकता जिसे ClawHub inspect या publish करेगा।

- package root से `npm pack --dry-run` चलाएँ।
- invalid package metadata, टूटे lifecycle scripts, या packing fail कराने वाली files entries को ठीक करें।
- यदि यह package public publishing के लिए है, तो `private: true` हटाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-entrypoint-missing

package pack किया जा सकता है, लेकिन packed artifact में `package.json#openclaw` में घोषित entrypoint files शामिल नहीं हैं।

- `npm pack --dry-run` चलाएँ और शामिल होने वाली files inspect करें।
- packing से पहले generated entrypoints build करें।
- `files`, `.npmignore`, या build output update करें ताकि घोषित entrypoints शामिल हों।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### package-npm-pack-metadata-missing

packed artifact में वह OpenClaw metadata गायब है जो आपके source package में मौजूद है।

- `npm pack --dry-run` चलाएँ और included metadata files inspect करें।
- सुनिश्चित करें कि packed artifact में `package.json` में `openclaw` block शामिल है।
- जब package native OpenClaw Plugin हो, तो सुनिश्चित करें कि `openclaw.plugin.json` शामिल है।
- `files` या `.npmignore` update करें ताकि package metadata exclude न हो।
- [Building plugins](/hi/plugins/building-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## Manifest metadata

### manifest-name-missing

नेटिव Plugin मैनिफेस्ट में प्रदर्शन नाम शामिल नहीं है।

- `openclaw.plugin.json` में गैर-रिक्त `name` फ़ील्ड जोड़ें।
- `name` को मानव-पठनीय रखें और `id` को स्थिर मशीन id के रूप में रखें।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### manifest-unknown-fields

Plugin मैनिफेस्ट में शीर्ष-स्तरीय फ़ील्ड हैं जिन्हें OpenClaw समर्थित नहीं करता।

- प्रत्येक शीर्ष-स्तरीय फ़ील्ड की तुलना
  [मैनिफेस्ट फ़ील्ड संदर्भ](/hi/plugins/manifest#top-level-field-reference) से करें।
- `openclaw.plugin.json` से कस्टम फ़ील्ड हटाएँ।
- पैकेज या इंस्टॉल मेटाडेटा को मैनिफेस्ट के बजाय समर्थित `package.json#openclaw` फ़ील्ड में
  ले जाएँ।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### manifest-unknown-contracts

मैनिफेस्ट `contracts` के अंदर असमर्थित कुंजियाँ घोषित करता है।

- `contracts` के अंतर्गत प्रत्येक कुंजी की तुलना
  [contracts संदर्भ](/hi/plugins/manifest#contracts-reference) से करें।
- असमर्थित contract कुंजियाँ हटाएँ।
- रनटाइम व्यवहार को Plugin पंजीकरण कोड में ले जाएँ, और `contracts` को
  स्थिर क्षमता स्वामित्व मेटाडेटा तक सीमित रखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

## SDK और संगतता माइग्रेशन

### legacy-root-sdk-import

Plugin पुराने हो चुके रूट SDK बैरल से आयात करता है:
`openclaw/plugin-sdk`.

- रूट-बैरल आयातों को केंद्रित सार्वजनिक उप-पथ आयातों से बदलें।
- `definePluginEntry` के लिए `openclaw/plugin-sdk/plugin-entry` का उपयोग करें।
- चैनल प्रविष्टि सहायकों के लिए `openclaw/plugin-sdk/channel-core` का उपयोग करें।
- संकरे आयात को खोजने के लिए [आयात परंपराएँ](/hi/plugins/building-plugins#import-conventions) और
  [Plugin SDK उप-पथ](/hi/plugins/sdk-subpaths) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### reserved-sdk-import

Plugin bundled plugins या आंतरिक संगतता के लिए आरक्षित SDK पथ आयात करता है।

- आरक्षित OpenClaw आंतरिक SDK आयातों को दस्तावेजीकृत सार्वजनिक
  `openclaw/plugin-sdk/*` उप-पथों से बदलें।
- यदि व्यवहार के लिए कोई सार्वजनिक SDK नहीं है, तो सहायक को अपने पैकेज के अंदर रखें या
  सार्वजनिक OpenClaw API का अनुरोध करें।
- समर्थित आयात चुनने के लिए [Plugin SDK उप-पथ](/hi/plugins/sdk-subpaths) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### sdk-load-session-store

Plugin अभी भी पुराने हो चुके पूरे-सत्र-स्टोर सहायक
`loadSessionStore` का उपयोग करता है।

- सत्र स्थिति पढ़ते समय `getSessionEntry(...)` या `listSessionEntries(...)` का उपयोग करें।
- सत्र स्थिति लिखते समय `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सत्र स्टोर ऑब्जेक्ट को लोड करने, बदलने, और सहेजने से बचें।
- `loadSessionStore(...)` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK उप-पथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### sdk-session-store-write

Plugin अभी भी `saveSessionStore` या `updateSessionStore` जैसे पुराने हो चुके
पूरे-सत्र-स्टोर लेखन सहायक का उपयोग करता है।

- मौजूदा सत्र प्रविष्टि पर फ़ील्ड अपडेट करते समय `patchSessionEntry(...)` का उपयोग करें।
- सत्र प्रविष्टि को बदलते या बनाते समय `upsertSessionEntry(...)` का उपयोग करें।
- पूरे सत्र स्टोर ऑब्जेक्ट को लोड करने, बदलने, और सहेजने से बचें।
- पूरे-स्टोर लेखन सहायकों को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK उप-पथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### sdk-session-file-helper

Plugin अभी भी `resolveSessionFilePath` या `resolveAndPersistSessionFile` जैसे
पुराने हो चुके सत्र फ़ाइल-पथ सहायकों का उपयोग करता है।

- एजेंट और सत्र पहचान के आधार पर सत्र मेटाडेटा पढ़ने के लिए `getSessionEntry(...)` का उपयोग करें।
- सत्र मेटाडेटा कायम रखने के लिए `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- जब कोड कोई ट्रांसक्रिप्ट ऑपरेशन तैयार कर रहा हो, तो ट्रांसक्रिप्ट पहचान या लक्ष्य
  सहायकों का उपयोग करें।
- पुराने ट्रांसक्रिप्ट फ़ाइल पथों को कायम न रखें या उन पर निर्भर न रहें।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK उप-पथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### sdk-session-transcript-file-target

Plugin अभी भी पुराने हो चुके ट्रांसक्रिप्ट फ़ाइल लक्ष्य सहायक
`resolveSessionTranscriptLegacyFileTarget` का उपयोग करता है।

- जब कोड को केवल सार्वजनिक सत्र पहचान चाहिए, तो `resolveSessionTranscriptIdentity(...)` का उपयोग करें।
- जब कोड को संरचित ट्रांसक्रिप्ट ऑपरेशन लक्ष्य चाहिए, तो `resolveSessionTranscriptTarget(...)` का उपयोग करें।
- पुराने ट्रांसक्रिप्ट फ़ाइल लक्ष्यों को सीधे पढ़ने या बनाने से बचें।
- पुराने सहायक को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अभी भी
  पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK उप-पथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### sdk-session-transcript-low-level

Plugin अभी भी `appendSessionTranscriptMessage` या `emitSessionTranscriptUpdate` जैसे
पुराने हो चुके निम्न-स्तरीय ट्रांसक्रिप्ट सहायकों का उपयोग करता है।

- ट्रांसक्रिप्ट जोड़ने के लिए `appendSessionTranscriptMessageByIdentity(...)` का उपयोग करें।
- ट्रांसक्रिप्ट अपडेट सूचनाओं के लिए `publishSessionTranscriptUpdateByIdentity(...)` का उपयोग करें।
- संरचित ट्रांसक्रिप्ट रनटाइम सतह को प्राथमिकता दें ताकि OpenClaw सही
  लेन-देन सीमाएँ और पहचान हैंडलिंग लागू कर सके।
- निम्न-स्तरीय ट्रांसक्रिप्ट सहायकों को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा
  अभी भी पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें उनकी आवश्यकता है।
- [रनटाइम API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK उप-पथ](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### legacy-before-agent-start

Plugin अभी भी पुराने `before_agent_start` हुक का उपयोग करता है।

- मॉडल या प्रदाता ओवरराइड कार्य को `before_model_resolve` में ले जाएँ।
- प्रॉम्प्ट या संदर्भ बदलाव कार्य को `before_prompt_build` में ले जाएँ।
- `before_agent_start` को केवल तब तक रखें जब तक आपकी घोषित संगतता सीमा अभी भी
  पुराने OpenClaw संस्करणों का समर्थन करती है जिन्हें इसकी आवश्यकता है।
- [हुक](/hi/plugins/hooks) और
  [Plugin संगतता](/hi/plugins/compatibility) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### provider-auth-env-vars

मैनिफेस्ट अभी भी पुराने `providerAuthEnvVars` प्रदाता auth मेटाडेटा का उपयोग करता है।

- प्रदाता env-var मेटाडेटा को `setup.providers[].envVars` में प्रतिबिंबित करें।
- `providerAuthEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें जब तक आपकी समर्थित
  OpenClaw सीमा को अभी भी इसकी आवश्यकता है।
- [setup संदर्भ](/hi/plugins/manifest#setup-reference) और
  [SDK माइग्रेशन](/hi/plugins/sdk-migration) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### channel-env-vars

मैनिफेस्ट पुराने या पुरानी शैली के चैनल env-var मेटाडेटा का उपयोग करता है, जिसमें वर्तमान
setup या config मेटाडेटा नहीं है जिसकी ClawHub अपेक्षा करता है।

- चैनल env-var मेटाडेटा को घोषणात्मक रखें ताकि OpenClaw चैनल रनटाइम लोड किए बिना
  setup स्थिति की जाँच कर सके।
- env-चालित चैनल setup को आपके Plugin आकार द्वारा उपयोग किए जाने वाले वर्तमान setup, चैनल config, या
  पैकेज चैनल मेटाडेटा में प्रतिबिंबित करें।
- `channelEnvVars` को केवल संगतता मेटाडेटा के रूप में रखें जब तक पुराने समर्थित
  OpenClaw संस्करणों को अभी भी इसकी आवश्यकता है।
- [Plugin मैनिफेस्ट](/hi/plugins/manifest) और
  [चैनल Plugin](/hi/plugins/sdk-channel-plugins) देखें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

## सुरक्षा मैनिफेस्ट

### security-manifest-schema-unavailable

पैकेज `openclaw.security.json` को ऐसे स्कीमा संदर्भ के साथ शिप करता है जिसे ClawHub
उपलब्ध के रूप में नहीं पहचानता।

- यदि स्कीमा URL केवल परामर्शात्मक है, तो उसे हटाएँ।
- दस्तावेजीकृत versioned स्कीमा का उपयोग केवल OpenClaw द्वारा एक प्रकाशित करने के बाद करें।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

### unrecognized-security-manifest

पैकेज एक असमर्थित सुरक्षा मैनिफेस्ट फ़ाइल शिप करता है।

- `openclaw.security.json` को तब तक हटाएँ जब तक OpenClaw कोई versioned सुरक्षा
  मैनिफेस्ट स्कीमा और ClawHub व्यवहार दस्तावेजीकृत नहीं करता।
- सुरक्षा-संवेदनशील व्यवहार को अपने सार्वजनिक पैकेज दस्तावेज़ों या
  README में तब तक दस्तावेजीकृत रखें जब तक मैनिफेस्ट contract मौजूद न हो।
- `clawhub package validate <path-to-plugin>` दोबारा चलाएँ।

## संबंधित

- [ClawHub CLI](/hi/clawhub/cli)
- [ClawHub प्रकाशन](/hi/clawhub/publishing)
- [Plugin बनाना](/hi/plugins/building-plugins)
- [Plugin मैनिफेस्ट](/hi/plugins/manifest)
- [Plugin प्रविष्टि बिंदु](/hi/plugins/sdk-entrypoints)
- [Plugin संगतता](/hi/plugins/compatibility)
