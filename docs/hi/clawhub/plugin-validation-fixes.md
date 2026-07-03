---
read_when:
    - आपने clawhub package validate चलाया और Plugin निष्कर्षों को ठीक करना है
    - ClawHub ने Plugin पैकेज प्रकाशन को अस्वीकार किया या चेतावनी दी
    - आप रिलीज़ से पहले Plugin पैकेज मेटाडेटा अपडेट कर रहे हैं
summary: प्रकाशित करने से पहले ClawHub Plugin पैकेज सत्यापन निष्कर्षों को ठीक करें
title: Plugin सत्यापन सुधार
x-i18n:
    generated_at: "2026-07-03T13:30:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin सत्यापन सुधार

ClawHub publish से पहले Plugin पैकेजों को सत्यापित करता है और automated पैकेज scans से मिले निष्कर्ष भी दिखा सकता है। यह पेज लेखक-दृश्य निष्कर्षों को कवर करता है, यानी वे निष्कर्ष जिन्हें Plugin लेखक अपने पैकेज metadata, manifest, SDK imports, या प्रकाशित artifact में ठीक कर सकता है।

यह internal Plugin Inspector coverage findings को कवर नहीं करता। यदि किसी पूर्ण रिपोर्ट में लेखक remediation guidance के बिना scanner maintenance codes हैं, तो वे Plugin लेखकों के बजाय OpenClaw maintainers के लिए हैं।

कोई भी सुधार लागू करने के बाद, फिर से चलाएं:

```bash
clawhub package validate <path-to-plugin>
```

## लेखक-दृश्य निष्कर्ष

| Code                                    | यहां से शुरू करें                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [पैकेज metadata जोड़ें](/hi/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [पैकेज openclaw block जोड़ें](/hi/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw पैकेज entrypoints घोषित करें](/hi/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [घोषित entrypoint प्रकाशित करें](/hi/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [install metadata पूरा करें](/hi/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API compatibility घोषित करें](/hi/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [minimum host version संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [पैकेज और manifest versions संरेखित करें](/hi/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [असमर्थित OpenClaw पैकेज metadata हटाएं](/hi/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm artifact को packable बनाएं](/hi/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack output में entrypoints शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack output में metadata शामिल करें](/hi/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [manifest display name जोड़ें](/hi/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [असमर्थित manifest fields हटाएं](/hi/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [असमर्थित contract keys हटाएं](/hi/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [root SDK imports बदलें](/hi/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [reserved SDK imports हटाएं](/hi/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [whole-session-store access बदलें](/hi/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [whole-session-store writes बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [session file-path helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [legacy transcript file targets बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [low-level transcript helpers बदलें](/hi/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start बदलें](/hi/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [provider env vars को setup metadata में ले जाएं](/hi/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [current metadata में channel env vars mirror करें](/hi/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [अनुपलब्ध security manifest schema references हटाएं](/hi/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [असमर्थित security manifest files हटाएं](/hi/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## पैकेज metadata

### package-json-missing

पैकेज root में `package.json` शामिल नहीं है, इसलिए ClawHub npm पैकेज, version, entrypoints, या OpenClaw metadata की पहचान नहीं कर सकता।

- `name`, `version`, और `type` के साथ `package.json` जोड़ें।
- जब पैकेज OpenClaw Plugin ship करता हो, तो `openclaw` block जोड़ें।
- न्यूनतम पैकेज उदाहरण के लिए [Plugins बनाना](/hi/plugins/building-plugins) और पैकेज बनाम manifest विभाजन के लिए [Plugin manifest](/hi/plugins/manifest#manifest-versus-packagejson) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-openclaw-metadata-missing

पैकेज में `package.json` है, लेकिन यह OpenClaw पैकेज metadata घोषित नहीं करता।

- `package.json#openclaw` जोड़ें।
- `openclaw.extensions` या `openclaw.runtimeExtensions` जैसा entrypoint metadata शामिल करें।
- जब पैकेज ClawHub के माध्यम से प्रकाशित या install किया जाएगा, तो compatibility और install metadata जोड़ें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-openclaw-entry-missing

पैकेज metadata मौजूद है, लेकिन यह OpenClaw runtime entrypoint घोषित नहीं करता।

- native Plugin entrypoints के लिए `openclaw.extensions` जोड़ें।
- जब प्रकाशित पैकेज built JavaScript load करना चाहिए, तो `openclaw.runtimeExtensions` जोड़ें।
- सभी entrypoint paths को पैकेज directory के अंदर रखें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) और [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-entrypoint-missing

पैकेज OpenClaw entrypoint घोषित करता है, लेकिन जिस पैकेज को सत्यापित किया जा रहा है उसमें referenced file गायब है।

- `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry`, और `openclaw.runtimeSetupEntry` में हर path जांचें।
- यदि entrypoint `dist` में generate होता है, तो पैकेज build करें।
- यदि entrypoint move हो गया है, तो metadata update करें।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-install-metadata-incomplete

ClawHub यह नहीं बता सकता कि पैकेज को कैसे install या update किया जाना चाहिए।

- `openclaw.install` को समर्थित install source से भरें, जैसे `clawhubSpec`, `npmSpec`, या `localPath`।
- जब एक से अधिक install source उपलब्ध हों, तो `openclaw.install.defaultChoice` set करें।
- minimum OpenClaw host version के लिए `openclaw.install.minHostVersion` का उपयोग करें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-plugin-api-compat-missing

पैकेज उस OpenClaw Plugin API range को घोषित नहीं करता जिसे वह support करता है।

- `package.json` में `openclaw.compat.pluginApi` जोड़ें।
- वह OpenClaw Plugin API version या semver floor उपयोग करें जिसके विरुद्ध आपने build और test किया है।
- इसे पैकेज version से अलग रखें। पैकेज version Plugin release का वर्णन करता है; `openclaw.compat.pluginApi` host API contract का वर्णन करता है।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-min-host-version-drift

पैकेज minimum host version उस OpenClaw version metadata से match नहीं करता जिसके विरुद्ध पैकेज build किया गया था।

- `openclaw.install.minHostVersion` जांचें।
- पैकेज में कोई भी OpenClaw build metadata जांचें, जैसे release के दौरान उपयोग किया गया OpenClaw version।
- minimum host version को उस host version range के साथ संरेखित करें जिसे पैकेज वास्तव में support करता है।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-manifest-version-drift

पैकेज version और Plugin manifest version में असहमति है।

- पैकेज release version के रूप में `package.json#version` को प्राथमिकता दें।
- यदि `openclaw.plugin.json` में भी `version` है, तो उसे match करने के लिए update करें या जब पैकेज metadata authoritative हो तो stale manifest version metadata हटाएं।
- प्रकाशित metadata बदलने के बाद नया पैकेज version publish करें।
- [Plugin manifest](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-openclaw-unsupported-metadata

`package.json#openclaw` block में ऐसे fields हैं जो समर्थित OpenClaw पैकेज metadata नहीं हैं।

- `openclaw.bundle` जैसे असमर्थित fields हटाएं।
- native Plugin metadata को `openclaw.plugin.json` में रखें।
- पैकेज entrypoints, compatibility, install, setup, और catalog metadata को समर्थित `package.json#openclaw` fields में रखें।
- [package.json fields that affect discovery](/hi/plugins/manifest#packagejson-fields-that-affect-discovery) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

## प्रकाशित artifact

### package-npm-pack-unavailable

पैकेज को उस artifact में pack नहीं किया जा सकता जिसे ClawHub inspect या publish करेगा।

- पैकेज root से `npm pack --dry-run` चलाएं।
- invalid पैकेज metadata, broken lifecycle scripts, या ऐसी files entries ठीक करें जिनसे packing fail होती है।
- यदि यह पैकेज public publishing के लिए intended है, तो `private: true` हटाएं।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-npm-pack-entrypoint-missing

पैकेज pack किया जा सकता है, लेकिन packed artifact में `package.json#openclaw` में घोषित entrypoint files शामिल नहीं हैं।

- `npm pack --dry-run` चलाएं और शामिल की जाने वाली files inspect करें।
- packing से पहले generated entrypoints build करें।
- `files`, `.npmignore`, या build output update करें ताकि घोषित entrypoints शामिल हों।
- [Plugin entry points](/hi/plugins/sdk-entrypoints) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

### package-npm-pack-metadata-missing

packed artifact में OpenClaw metadata गायब है जो आपके source पैकेज में मौजूद है।

- `npm pack --dry-run` चलाएं और शामिल metadata files inspect करें।
- सुनिश्चित करें कि packed artifact में `package.json` में `openclaw` block शामिल है।
- जब पैकेज native OpenClaw Plugin हो, तो सुनिश्चित करें कि `openclaw.plugin.json` शामिल है।
- `files` या `.npmignore` update करें ताकि पैकेज metadata exclude न हो।
- [Plugins बनाना](/hi/plugins/building-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएं।

## Manifest metadata

### manifest-name-missing

नेटिव Plugin manifest में display name शामिल नहीं है।

- `openclaw.plugin.json` में एक गैर-रिक्त `name` फ़ील्ड जोड़ें।
- `name` को मानव-पठनीय रखें और `id` को स्थिर मशीन id के रूप में रखें।
- [Plugin manifest](/hi/plugins/manifest) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-fields

Plugin manifest में शीर्ष-स्तरीय फ़ील्ड हैं जिन्हें OpenClaw support नहीं करता।

- प्रत्येक शीर्ष-स्तरीय फ़ील्ड की तुलना
  [manifest field reference](/hi/plugins/manifest#top-level-field-reference) से करें।
- `openclaw.plugin.json` से custom फ़ील्ड हटाएँ।
- पैकेज या install metadata को manifest के बजाय supported `package.json#openclaw` फ़ील्ड में
  ले जाएँ।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### manifest-unknown-contracts

manifest `contracts` के अंदर unsupported keys घोषित करता है।

- `contracts` के अंतर्गत प्रत्येक key की तुलना
  [contracts reference](/hi/plugins/manifest#contracts-reference) से करें।
- unsupported contract keys हटाएँ।
- runtime behavior को plugin registration code में ले जाएँ, और `contracts`
  को static capability ownership metadata तक सीमित रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## SDK और compatibility migration

### legacy-root-sdk-import

Plugin deprecated root SDK barrel से import करता है:
`openclaw/plugin-sdk`.

- root-barrel imports को focused public subpath imports से बदलें।
- `definePluginEntry` के लिए `openclaw/plugin-sdk/plugin-entry` का उपयोग करें।
- channel entry helpers के लिए `openclaw/plugin-sdk/channel-core` का उपयोग करें।
- narrow import खोजने के लिए [Import conventions](/hi/plugins/building-plugins#import-conventions) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### reserved-sdk-import

Plugin bundled plugins या internal
compatibility के लिए आरक्षित SDK path import करता है।

- reserved OpenClaw internal SDK imports को documented public
  `openclaw/plugin-sdk/*` subpaths से बदलें।
- यदि behavior के लिए कोई public SDK नहीं है, तो helper को अपने package के अंदर रखें या
  public OpenClaw API का अनुरोध करें।
- supported import चुनने के लिए [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) और
  [SDK migration](/hi/plugins/sdk-migration) का उपयोग करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-load-session-store

Plugin अभी भी deprecated whole-session-store helper
`loadSessionStore` का उपयोग करता है।

- session state पढ़ते समय `getSessionEntry(...)` या `listSessionEntries(...)` का उपयोग करें।
- session state लिखते समय `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- पूरे session store object को load करने, mutate करने और save करने से बचें।
- `loadSessionStore(...)` को केवल तब तक रखें जब तक आपकी घोषित compatibility range
  अभी भी ऐसे पुराने OpenClaw versions को support करती है जिन्हें इसकी आवश्यकता है।
- [Runtime API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-store-write

Plugin अभी भी deprecated whole-session-store write helper जैसे
`saveSessionStore` या `updateSessionStore` का उपयोग करता है।

- मौजूदा session entry पर fields update करते समय `patchSessionEntry(...)` का उपयोग करें।
- session entry को replace करने या create करने पर `upsertSessionEntry(...)` का उपयोग करें।
- पूरे session store object को load करने, mutate करने और save करने से बचें।
- whole-store write helpers को केवल तब तक रखें जब तक आपकी घोषित compatibility range
  अभी भी ऐसे पुराने OpenClaw versions को support करती है जिन्हें उनकी आवश्यकता है।
- [Runtime API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-file-helper

Plugin अभी भी deprecated session file-path helpers जैसे
`resolveSessionFilePath` या `resolveAndPersistSessionFile` का उपयोग करता है।

- agent और session identity के आधार पर session metadata पढ़ने के लिए `getSessionEntry(...)` का उपयोग करें।
- session metadata persist करने के लिए `patchSessionEntry(...)` या `upsertSessionEntry(...)` का उपयोग करें।
- जब code transcript operation तैयार कर रहा हो, तो transcript identity या target helpers का उपयोग करें।
- legacy transcript file paths को persist न करें या उन पर निर्भर न रहें।
- [Runtime API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-file-target

Plugin अभी भी deprecated transcript file target helper
`resolveSessionTranscriptLegacyFileTarget` का उपयोग करता है।

- जब code को केवल public session identity चाहिए, तो `resolveSessionTranscriptIdentity(...)` का उपयोग करें।
- जब code को structured transcript operation target चाहिए, तो `resolveSessionTranscriptTarget(...)` का उपयोग करें।
- legacy transcript file targets को सीधे पढ़ने या construct करने से बचें।
- legacy helper को केवल तब तक रखें जब तक आपकी घोषित compatibility range अभी भी
  ऐसे पुराने OpenClaw versions को support करती है जिन्हें इसकी आवश्यकता है।
- [Runtime API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### sdk-session-transcript-low-level

Plugin अभी भी deprecated low-level transcript helpers जैसे
`appendSessionTranscriptMessage` या `emitSessionTranscriptUpdate` का उपयोग करता है।

- transcript appends के लिए `appendSessionTranscriptMessageByIdentity(...)` का उपयोग करें।
- transcript update
  notifications के लिए `publishSessionTranscriptUpdateByIdentity(...)` का उपयोग करें।
- structured transcript runtime surface को प्राथमिकता दें ताकि OpenClaw सही
  transaction boundaries और identity handling लागू कर सके।
- low-level transcript helpers को केवल तब तक रखें जब तक आपकी घोषित compatibility range
  अभी भी ऐसे पुराने OpenClaw versions को support करती है जिन्हें उनकी आवश्यकता है।
- [Runtime API](/hi/plugins/sdk-runtime#agent-session-state) और
  [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### legacy-before-agent-start

Plugin अभी भी legacy `before_agent_start` hook का उपयोग करता है।

- model या provider override work को `before_model_resolve` में ले जाएँ।
- prompt या context mutation work को `before_prompt_build` में ले जाएँ।
- `before_agent_start` को केवल तब तक रखें जब तक आपकी घोषित compatibility range अभी भी
  ऐसे पुराने OpenClaw versions को support करती है जिन्हें इसकी आवश्यकता है।
- [Hooks](/hi/plugins/hooks) और
  [Plugin compatibility](/hi/plugins/compatibility) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### provider-auth-env-vars

manifest अभी भी legacy `providerAuthEnvVars` provider auth metadata का उपयोग करता है।

- provider env-var metadata को `setup.providers[].envVars` में mirror करें।
- `providerAuthEnvVars` को केवल compatibility metadata के रूप में रखें, जब तक आपकी supported
  OpenClaw range को अभी भी इसकी आवश्यकता है।
- [setup reference](/hi/plugins/manifest#setup-reference) और
  [SDK migration](/hi/plugins/sdk-migration) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### channel-env-vars

manifest legacy या older channel env-var metadata का उपयोग करता है, current
setup या config metadata के बिना जिसकी ClawHub अपेक्षा करता है।

- channel env-var metadata को declarative रखें ताकि OpenClaw channel runtime load किए बिना
  setup status inspect कर सके।
- env-driven channel setup को current setup, channel config, या
  आपके plugin shape द्वारा उपयोग किए गए package channel metadata में mirror करें।
- `channelEnvVars` को केवल compatibility metadata के रूप में रखें, जब तक older supported
  OpenClaw versions को अभी भी इसकी आवश्यकता है।
- [Plugin manifest](/hi/plugins/manifest) और
  [Channel plugins](/hi/plugins/sdk-channel-plugins) देखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## Security manifest

### security-manifest-schema-unavailable

package `openclaw.security.json` को एक schema reference के साथ ship करता है जिसे ClawHub
available के रूप में recognize नहीं करता।

- यदि schema URL केवल advisory-only है, तो उसे हटा दें।
- documented versioned schema का उपयोग केवल OpenClaw द्वारा उसे publish करने के बाद करें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

### unrecognized-security-manifest

package unsupported security manifest file ship करता है।

- जब तक OpenClaw versioned security
  manifest schema और ClawHub behavior document नहीं करता, तब तक `openclaw.security.json` हटाएँ।
- manifest contract मौजूद होने तक security-sensitive behavior को अपने public package docs या
  README में documented रखें।
- `clawhub package validate <path-to-plugin>` फिर से चलाएँ।

## संबंधित

- [ClawHub CLI](/hi/clawhub/cli)
- [ClawHub publishing](/hi/clawhub/publishing)
- [Building plugins](/hi/plugins/building-plugins)
- [Plugin manifest](/hi/plugins/manifest)
- [Plugin entry points](/hi/plugins/sdk-entrypoints)
- [Plugin compatibility](/hi/plugins/compatibility)
