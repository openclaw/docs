---
read_when:
    - आप एक OpenClaw Plugin का रखरखाव करते हैं
    - आपको Plugin संगतता चेतावनी दिखाई देती है
    - आप Plugin SDK या मैनिफेस्ट माइग्रेशन की योजना बना रहे हैं
summary: Plugin संगतता अनुबंध, अवमूल्यन मेटाडेटा, और माइग्रेशन अपेक्षाएँ
title: Plugin संगतता
x-i18n:
    generated_at: "2026-06-28T23:35:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw पुराने Plugin अनुबंधों को हटाने से पहले नामित संगतता
अडैप्टरों के माध्यम से जोड़े रखता है। SDK, manifest, setup, config, और agent runtime अनुबंध
विकसित होने के दौरान यह मौजूदा bundled और external
Plugin की सुरक्षा करता है।

## संगतता रजिस्ट्री

Plugin संगतता अनुबंध core registry में ट्रैक किए जाते हैं:
`src/plugins/compat/registry.ts`.

हर रिकॉर्ड में होता है:

- एक स्थिर संगतता कोड
- स्थिति: `active`, `deprecated`, `removal-pending`, या `removed`
- स्वामी: SDK, config, setup, channel, provider, plugin execution, agent runtime,
  या core
- लागू होने पर introduction और deprecation तिथियां
- replacement guidance
- docs, diagnostics, और tests जो पुराने और नए व्यवहार को कवर करते हैं

रजिस्ट्री maintainer planning और भविष्य के plugin inspector
checks का स्रोत है। यदि कोई plugin-facing व्यवहार बदलता है, तो उसी बदलाव में संगतता
रिकॉर्ड जोड़ें या अपडेट करें जिसमें अडैप्टर जोड़ा जाता है।

Doctor repair और migration compatibility अलग से
`src/commands/doctor/shared/deprecation-compat.ts` पर ट्रैक की जाती है। वे रिकॉर्ड पुराने
config shapes, install-ledger layouts, और repair shims को कवर करते हैं जिन्हें runtime compatibility path हटने के बाद भी
उपलब्ध रहना पड़ सकता है।

Release sweeps को दोनों registries जांचनी चाहिए। केवल इसलिए doctor migration न हटाएं
क्योंकि matching runtime या config compatibility record expire हो गया है; पहले
सत्यापित करें कि कोई supported upgrade path अभी भी repair की जरूरत नहीं रखता। साथ ही
release planning के दौरान हर replacement annotation को फिर से validate करें क्योंकि provider और channel core से बाहर जाते समय plugin
ownership और config footprint बदल सकते हैं।

## Plugin inspector package

Plugin inspector को core OpenClaw repo के बाहर, versioned compatibility और manifest
contracts द्वारा समर्थित अलग package/repository के रूप में रहना चाहिए।

Day-one CLI होना चाहिए:

```sh
openclaw-plugin-inspector ./my-plugin
```

इसे emit करना चाहिए:

- manifest/schema validation
- जांचा जा रहा contract compatibility version
- install/source metadata checks
- cold-path import checks
- deprecation और compatibility warnings

CI annotations में stable machine-readable output के लिए `--json` का उपयोग करें। OpenClaw
core को ऐसे contracts और fixtures expose करने चाहिए जिन्हें inspector consume कर सके, लेकिन उसे
main `openclaw` package से inspector binary publish नहीं करनी चाहिए।

### Maintainer acceptance lane

External inspector को OpenClaw plugin packages के विरुद्ध validate करते समय installable-package acceptance
lane के लिए Crabbox-backed Blacksmith Testbox का उपयोग करें।
Package build होने के बाद इसे clean OpenClaw checkout से चलाएं:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

इस lane को maintainers के लिए opt-in रखें क्योंकि यह external npm
package install करता है और repo के बाहर cloned plugin packages inspect कर सकता है। Local repo
guards SDK export map, compatibility registry metadata, deprecated
SDK-import burn-down, और bundled extension import boundaries को कवर करते हैं; Testbox inspector
proof उस package को वैसे कवर करता है जैसे external plugin authors उसे consume करते हैं।

## Deprecation policy

OpenClaw को documented plugin contract को उसी release में नहीं हटाना चाहिए
जिसमें उसका replacement introduce किया गया हो।

Migration sequence है:

1. नया contract जोड़ें।
2. पुराने behavior को named compatibility adapter के माध्यम से wired रखें।
3. जब plugin authors action ले सकते हों तो diagnostics या warnings emit करें।
4. replacement और timeline document करें।
5. पुराने और नए दोनों paths test करें।
6. घोषित migration window के दौरान प्रतीक्षा करें।
7. केवल explicit breaking-release approval के साथ हटाएं।

Deprecated records में warning start date, replacement, docs link,
और warning शुरू होने के तीन महीनों से अधिक नहीं होने वाली final removal date शामिल होनी चाहिए। Open-ended removal window के साथ
deprecated compatibility path न जोड़ें, जब तक maintainers स्पष्ट रूप से यह तय न करें कि यह permanent compatibility है और इसके बजाय इसे `active`
mark न करें।

## मौजूदा संगतता क्षेत्र

मौजूदा compatibility records में शामिल हैं:

- legacy broad SDK imports जैसे `openclaw/plugin-sdk/compat`
- legacy hook-only plugin shapes और `before_agent_start`
- legacy `api.on("deactivate", ...)` cleanup hook names जबकि plugins
  `gateway_stop` पर migrate करते हैं
- legacy `activate(api)` plugin entrypoints जबकि plugins
  `register(api)` पर migrate करते हैं
- legacy SDK aliases जैसे `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  status builders, `openclaw/plugin-sdk/test-utils` (focused
  `openclaw/plugin-sdk/*` test subpaths से replaced), और `ClawdbotConfig` /
  `OpenClawSchemaType` type aliases
- bundled plugin allowlist और enablement behavior
- legacy provider/channel env-var manifest metadata
- legacy provider plugin hooks और type aliases जबकि providers
  explicit catalog, auth, thinking, replay, और transport hooks पर move करते हैं
- legacy runtime aliases जैसे `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt`, और deprecated
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` flat callback fields जैसे `body`, `chatId`,
  `reply(...)`, और `mediaPath` जबकि callback consumers nested
  `WebInboundCallbackMessage` `event`, `payload`, `quote`, `group`, और
  `platform` contexts पर migrate करते हैं
- WhatsApp `WebInboundMessage` top-level admission fields जैसे `from`,
  `conversationId`, `accountId`, `accessControlPassed`, और `chatType` जबकि
  callback consumers `admission` envelope पर migrate करते हैं
- legacy memory-plugin split registration जबकि memory plugins
  `registerMemoryCapability` पर move करते हैं
- legacy memory-specific embedding provider registration जबकि embedding
  providers `api.registerEmbeddingProvider(...)` और
  `contracts.embeddingProviders` पर move करते हैं
- native message schemas, mention gating,
  inbound envelope formatting, और approval capability nesting के लिए legacy channel SDK helpers
- legacy channel route key और comparable-target helper aliases जबकि plugins
  `openclaw/plugin-sdk/channel-route` पर move करते हैं
- activation hints जिन्हें manifest contribution ownership से replace किया जा रहा है
- `setup-api` runtime fallback जबकि setup descriptors cold
  `setup.requiresRuntime: false` metadata पर move करते हैं
- provider `discovery` hooks जबकि provider catalog hooks
  `catalog.run(...)` पर move करते हैं
- channel `showConfigured` / `showInSetup` metadata जबकि channel packages
  `openclaw.channel.exposure` पर move करते हैं
- legacy runtime-policy config keys जबकि doctor operators को
  `agentRuntime` पर migrate करता है
- generated bundled channel config metadata fallback जबकि registry-first
  `channelConfigs` metadata land होता है
- persisted plugin registry disable और install-migration env flags जबकि
  repair flows operators को `openclaw plugins registry --refresh` और
  `openclaw doctor --fix` पर migrate करते हैं
- legacy plugin-owned web search, web fetch, और x_search config paths जबकि
  doctor उन्हें `plugins.entries.<plugin>.config` पर migrate करता है
- legacy `plugins.installs` authored config और bundled plugin load-path
  aliases जबकि install metadata state-managed plugin ledger में move करता है

नए plugin code को registry और specific migration guide में सूचीबद्ध replacement को प्राथमिकता देनी चाहिए।
Existing plugins तब तक compatibility path का उपयोग जारी रख सकते हैं
जब तक docs, diagnostics, और release notes removal window announce नहीं करते।

### WhatsApp Inbound Callback Flat Aliases

WhatsApp runtime callbacks `WebInboundMessage` deliver करते हैं: canonical nested
`event`, `payload`, `quote`, `group`, और `platform` contexts के साथ shipped callback fields के लिए deprecated
flat aliases। नए callback code को nested contexts पढ़ने चाहिए। Clean nested callback messages construct करने वाला code
`WebInboundCallbackMessage` का उपयोग कर सकता है; compatibility listeners जो अभी भी old flat
test या plugin messages inject करते हैं, उन्हें `LegacyFlatWebInboundMessage` या
`WebInboundMessageInput` का उपयोग करना चाहिए।

Flat aliases **2026-08-30** तक उपलब्ध रहेंगे। वह removal window
केवल flat alias access पर लागू होती है; nested callback shape canonical
runtime contract है। हर flat alias पर TypeScript `@deprecated` annotations उसका exact nested replacement बताते हैं।
सामान्य उदाहरण:

- `id`, `timestamp`, और `isBatched` `event` के अंतर्गत move होते हैं।
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`, और
  `untrustedStructuredContext` `payload` के अंतर्गत move होते हैं।
- `to`, `chatId`, sender/self fields, `sendComposing`, `reply(...)`, और
  `sendMedia(...)` `platform` के अंतर्गत move होते हैं।
- `replyTo*` fields `quote` के अंतर्गत move होते हैं, और group subject/participant/mention
  fields `group` के अंतर्गत move होते हैं।

`payload.untrustedStructuredContext` inbound provider payloads से extracted होता है।
Plugins को इसके `payload` को authoritative मानने से पहले `label`, `source`, और `type`
inspect करना चाहिए।

### WhatsApp Inbound Admission Fields

Accepted WhatsApp callback messages अब `admission` carry करते हैं, जो message admit करने वाले access-control decision के लिए public-safe
envelope है। नए callback
code को पुराने top-level admission fields के बजाय `msg.admission` से admission facts पढ़ने चाहिए।

Top-level fields **2026-08-30** तक उपलब्ध रहेंगे। TypeScript
`@deprecated` annotations हर replacement का नाम बताते हैं:

- `from` और `conversationId` `admission.conversation.id` पर move होते हैं।
- `accountId` `admission.accountId` पर move होता है।
- `accessControlPassed`
  `admission.ingress.decision === "allow"` का derived compatibility view है; उन messages पर जो पहले से
  `admission` carry करते हैं, legacy boolean लिखने से ingress graph rewrite नहीं होता।
- `chatType` `admission.conversation.kind` पर move होता है।

## Release notes

Release notes में target dates और
migration docs के links के साथ upcoming plugin deprecations शामिल होने चाहिए। यह warning compatibility
path के `removal-pending` या `removed` पर move होने से पहले होनी चाहिए।
