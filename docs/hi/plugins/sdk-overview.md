---
read_when:
    - आपको जानना होगा कि किस SDK सबपाथ से इम्पोर्ट करना है
    - आप OpenClawPluginApi पर सभी पंजीकरण विधियों के लिए एक संदर्भ चाहते हैं
    - आप एक विशिष्ट SDK निर्यात देख रहे हैं
sidebarTitle: Plugin SDK overview
summary: इम्पोर्ट मैप, पंजीकरण API संदर्भ, और SDK आर्किटेक्चर
title: Plugin SDK अवलोकन
x-i18n:
    generated_at: "2026-07-01T18:13:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, plugins और कोर के बीच typed अनुबंध है। यह पेज
**क्या import करना है** और **क्या register कर सकते हैं** के लिए संदर्भ है।

<Note>
  यह पेज OpenClaw के अंदर `openclaw/plugin-sdk/*` का उपयोग करने वाले Plugin
  लेखकों के लिए है। बाहरी apps, scripts, dashboards, CI jobs, और IDE extensions
  जो Gateway के जरिए agents चलाना चाहते हैं, वे इसके बजाय
  [बाहरी apps के लिए Gateway integrations](/hi/gateway/external-apps) का उपयोग करें।
</Note>

<Tip>
इसके बजाय how-to guide खोज रहे हैं? [Plugins बनाना](/hi/plugins/building-plugins) से शुरू करें, channel plugins के लिए [Channel plugins](/hi/plugins/sdk-channel-plugins), provider plugins के लिए [Provider plugins](/hi/plugins/sdk-provider-plugins), local AI CLI backends के लिए [CLI backend plugins](/hi/plugins/cli-backend-plugins), और tool या lifecycle hook plugins के लिए [Plugin hooks](/hi/plugins/hooks) का उपयोग करें।
</Tip>

## Import convention

हमेशा किसी विशिष्ट subpath से import करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

हर subpath एक छोटा, self-contained module है। इससे startup तेज रहता है और
circular dependency समस्याएं रुकती हैं। channel-specific entry/build helpers के लिए
`openclaw/plugin-sdk/channel-core` को प्राथमिकता दें; व्यापक umbrella surface और
`buildChannelConfigSchema` जैसे shared helpers के लिए `openclaw/plugin-sdk/core` रखें।

channel config के लिए, channel-owned JSON Schema को
`openclaw.plugin.json#channelConfigs` के जरिए publish करें। `plugin-sdk/channel-config-schema`
subpath shared schema primitives और generic builder के लिए है। OpenClaw के
bundled plugins, retained bundled-channel schemas के लिए `plugin-sdk/bundled-channel-config-schema` का उपयोग करते हैं। Deprecated compatibility exports
`plugin-sdk/channel-config-schema-legacy` पर बने रहते हैं; कोई भी bundled schema subpath
नए plugins के लिए pattern नहीं है।

<Warning>
  provider- या channel-branded convenience seams import न करें (उदाहरण के लिए
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`)।
  Bundled plugins अपने `api.ts` /
  `runtime-api.ts` barrels के अंदर generic SDK subpaths compose करते हैं; core consumers को या तो वे plugin-local
  barrels उपयोग करने चाहिए या जब जरूरत सचमुच cross-channel हो तब एक narrow generic SDK contract जोड़ना चाहिए।

Generated export map में bundled-plugin helper seams का एक छोटा set अब भी दिखता है
जब उनका tracked owner usage हो। वे सिर्फ bundled-plugin
maintenance के लिए मौजूद हैं और नए third-party
plugins के लिए recommended import paths नहीं हैं।

`openclaw/plugin-sdk/discord` और `openclaw/plugin-sdk/telegram-account` को
tracked owner usage के लिए deprecated compatibility facades के रूप में भी रखा गया है। उन
import paths को नए plugins में copy न करें; इसके बजाय injected runtime helpers और
generic channel SDK subpaths का उपयोग करें।
</Warning>

## Subpath reference

Plugin SDK को area के अनुसार grouped narrow subpaths के set के रूप में expose किया गया है (plugin
entry, channel, provider, auth, runtime, capability, memory, और reserved
bundled-plugin helpers)। पूरे catalog के लिए — grouped और linked — देखें
[Plugin SDK subpaths](/hi/plugins/sdk-subpaths)।

compiler entrypoint inventory
`scripts/lib/plugin-sdk-entrypoints.json` में रहता है; package exports, public subset से
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` में listed repo-local test/internal subpaths घटाने के बाद generated होते हैं।
public export count audit करने के लिए
`pnpm plugin-sdk:surface` चलाएं। Deprecated public
subpaths जो पर्याप्त पुराने हैं और bundled extension production code द्वारा unused हैं,
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` में tracked हैं; broad
deprecated re-export barrels
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` में tracked हैं।

## Registration API

`register(api)` callback को इन
methods वाला `OpenClawPluginApi` object मिलता है:

### Capability registration

| Method                                           | यह क्या register करता है              |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Text inference (LLM)                  |
| `api.registerAgentHarness(...)`                  | Experimental low-level agent executor |
| `api.registerCliBackend(...)`                    | Local CLI inference backend           |
| `api.registerChannel(...)`                       | Messaging channel                     |
| `api.registerEmbeddingProvider(...)`             | Reusable vector embedding provider    |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis        |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcription      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex realtime voice sessions        |
| `api.registerMediaUnderstandingProvider(...)`    | Image/audio/video analysis            |
| `api.registerImageGenerationProvider(...)`       | Image generation                      |
| `api.registerMusicGenerationProvider(...)`       | Music generation                      |
| `api.registerVideoGenerationProvider(...)`       | Video generation                      |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider           |
| `api.registerWebSearchProvider(...)`             | Web search                            |

`api.registerEmbeddingProvider(...)` के साथ registered embedding providers को
plugin manifest में `contracts.embeddingProviders` में भी listed होना चाहिए। यह
reusable vector generation के लिए generic embedding surface है। Memory search
इस generic provider surface को consume कर सकता है। पुराना
`api.registerMemoryEmbeddingProvider(...)` और
`contracts.memoryEmbeddingProviders` seam deprecated compatibility है, जब तक
existing memory-specific providers migrate होते हैं।

Memory-specific providers जो अभी भी runtime `batchEmbed(...)` expose करते हैं, वे
existing per-file batching contract पर रहते हैं, जब तक उनका runtime explicitly
`sourceWideBatchEmbed: true` set न करे। वह opt-in memory host को host batch limits तक
multiple dirty memory files और enabled sources से chunks को एक `batchEmbed(...)` call में submit करने देता है। JSONL request files upload करने वाले Batch adapters को
अपने upload-size cap के साथ-साथ अपने request-count
cap से पहले provider jobs split करने होंगे। provider को input chunk प्रति एक embedding उसी order में return करनी होगी जैसे
`batch.chunks`; जब provider file-local batches expect करता हो या
larger source-wide job में input ordering preserve नहीं कर सकता हो, flag omit करें।

### Tools and commands

fixed tool names वाले simple tool-only plugins के लिए [`defineToolPlugin`](/hi/plugins/tool-plugins) का उपयोग करें।
mixed plugins
या fully dynamic tool registration के लिए सीधे `api.registerTool(...)` का उपयोग करें।

| Method                          | यह क्या register करता है                        |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Agent tool (required या `{ optional: true }`)    |
| `api.registerCommand(def)`      | Custom command (LLM को bypass करता है)           |

जब agent को short,
command-owned routing hint चाहिए हो, Plugin commands `agentPromptGuidance` set कर सकते हैं। वह text command के बारे में ही रखें; core prompt builders में
provider- या plugin-specific policy न जोड़ें।

Guidance entries legacy strings हो सकती हैं, जो हर prompt surface पर लागू होती हैं, या
structured entries:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Structured `surfaces` में `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend`, या `subagent` शामिल हो सकते हैं। `pi_main`, `openclaw_main` के लिए deprecated alias बना रहता है। intentional all-surface guidance के लिए `surfaces` omit करें। खाली `surfaces` array pass न करें; उसे reject किया जाता है ताकि accidental scope loss
global prompt text न बन जाए।

Native Codex app-server developer instructions बाकी prompt
surfaces से अधिक strict हैं: केवल `codex_app_server` पर explicitly scoped guidance को
उस higher-priority lane में promote किया जाता है। Legacy string guidance और unscoped structured
guidance compatibility के लिए non-Codex prompt surfaces पर उपलब्ध रहती हैं।

### Infrastructure

| Method                                         | यह क्या register करता है                  |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Event hook                                 |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                      |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                         |
| `api.registerGatewayDiscoveryService(service)` | Local Gateway discovery advertiser         |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                             |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` के तहत Node feature CLI   |
| `api.registerService(service)`                 | Background service                         |
| `api.registerInteractiveHandler(registration)` | Interactive handler                        |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result middleware             |
| `api.registerMemoryPromptSupplement(builder)`  | Additive memory-adjacent prompt section    |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additive memory search/read corpus         |

### Workflow plugins के लिए host hooks

Host hooks उन plugins के लिए SDK seams हैं जिन्हें सिर्फ provider, channel, या tool जोड़ने के बजाय host
lifecycle में participate करना होता है। वे
generic contracts हैं; Plan Mode उनका उपयोग कर सकता है, लेकिन approval workflows,
workspace policy gates, background monitors, setup wizards, और UI companion
plugins भी कर सकते हैं।

| विधि                                                                               | इसका स्वामित्व वाला अनुबंध                                                                                                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-स्वामित्व वाली, JSON-संगत सत्र स्थिति, जो Gateway सत्रों के माध्यम से प्रोजेक्ट की जाती है                                                                             |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | एक सत्र के लिए अगले एजेंट टर्न में इंजेक्ट किया गया टिकाऊ exactly-once संदर्भ                                                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Manifest-gated विश्वसनीय pre-plugin टूल नीति, जो टूल पैरामीटर ब्लॉक या फिर से लिख सकती है                                                                        |
| `api.registerToolMetadata(...)`                                                      | टूल कार्यान्वयन बदले बिना टूल कैटलॉग प्रदर्शन मेटाडेटा                                                                                     |
| `api.registerCommand(...)`                                                           | स्कोप किए गए plugin कमांड; कमांड परिणाम `continueAgent: true` या `suppressReply: true` सेट कर सकते हैं; Discord नेटिव कमांड `descriptionLocalizations` का समर्थन करते हैं |
| `api.session.controls.registerControlUiDescriptor(...)`                              | सत्र, टूल, रन या सेटिंग सतहों के लिए Control UI योगदान descriptor                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | रीसेट/डिलीट/रीलोड पथों पर plugin-स्वामित्व वाले runtime संसाधनों के लिए cleanup callbacks                                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | workflow स्थिति और monitors के लिए sanitized event subscriptions                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | प्रति-रन plugin scratch state, जो terminal run lifecycle पर साफ की जाती है                                                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | plugin-स्वामित्व वाली scheduler jobs के लिए cleanup metadata; काम schedule नहीं करता या task records नहीं बनाता                                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | सक्रिय direct-outbound सत्र route पर bundled-only host-mediated file attachment delivery                                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | bundled-only Cron-backed scheduled session turns और tag-based cleanup                                                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | typed session actions जिन्हें clients Gateway के माध्यम से dispatch कर सकते हैं                                                                                             |

नए plugin कोड के लिए grouped namespaces का उपयोग करें:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

बराबर flat methods मौजूदा plugins के लिए deprecated compatibility
aliases के रूप में उपलब्ध रहेंगे। ऐसा नया plugin कोड न जोड़ें जो सीधे
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, या
`api.unscheduleSessionTurnsByTag` को कॉल करता हो।

`scheduleSessionTurn(...)` Gateway Cron scheduler पर session-scoped सुविधा है।
Cron timing का स्वामी है और turn चलने पर background task record बनाता है;
Plugin SDK केवल target session, plugin-स्वामित्व वाली naming और cleanup को
सीमित करता है। जब काम को खुद durable multi-step Task Flow state चाहिए, तो scheduled
turn के अंदर `api.runtime.tasks.managedFlows` का उपयोग करें।

अनुबंध जानबूझकर authority को विभाजित करते हैं:

- External plugins session extensions, UI descriptors, commands, tool
  metadata, next-turn injections और normal hooks के स्वामी हो सकते हैं।
- Trusted tool policies सामान्य `before_tool_call` hooks से पहले चलती हैं और
  host-trusted होती हैं। Bundled policies पहले चलती हैं; installed-plugin policies को
  explicit enablement और
  `contracts.trustedToolPolicies` में उनके local ids की आवश्यकता होती है, और वे plugin-load order में आगे चलती हैं। Policy ids
  registering plugin के scope में होते हैं।
- Reserved command ownership bundled-only है। External plugins को अपने
  command names या aliases का उपयोग करना चाहिए।
- `allowPromptInjection=false` prompt-mutating hooks को निष्क्रिय करता है, जिनमें
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  legacy `before_agent_start` से prompt fields, और
  `enqueueNextTurnInjection` शामिल हैं।

non-Plan consumers के उदाहरण:

| Plugin archetype             | उपयोग किए गए hooks                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Approval workflow            | Session extension, command continuation, next-turn injection, UI descriptor                                                            |
| Budget/workspace policy gate | Trusted tool policy, tool metadata, session projection                                                                                 |
| Background lifecycle monitor | Runtime lifecycle cleanup, agent event subscription, session scheduler ownership/cleanup, heartbeat prompt contribution, UI descriptor |
| Setup या onboarding wizard   | Session extension, scoped commands, Control UI descriptor                                                                              |

<Note>
  Reserved core admin namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) हमेशा `operator.admin` रहते हैं, भले ही कोई plugin एक
  संकरे gateway method scope को assign करने की कोशिश करे। Plugin-स्वामित्व वाली methods के लिए
  plugin-specific prefixes को प्राथमिकता दें।
</Note>

<Accordion title="tool-result middleware का उपयोग कब करें">
  Bundled plugins और matching
  manifest contracts वाले explicitly enabled installed plugins `api.registerAgentToolResultMiddleware(...)` का उपयोग तब कर सकते हैं जब
  उन्हें execution के बाद और runtime द्वारा उस result को model में वापस feed करने से पहले
  tool result को फिर से लिखना हो। यह tokenjuice जैसे async output reducers के लिए trusted runtime-neutral
  seam है।

Plugins को प्रत्येक targeted
runtime के लिए `contracts.agentToolResultMiddleware` declare करना होगा,
उदाहरण के लिए `["openclaw", "codex"]`। उस
contract के बिना, या explicit enablement के बिना, installed plugins यह middleware register नहीं कर सकते; ऐसे काम के लिए
normal OpenClaw plugin hooks रखें जिन्हें pre-model tool-result
timing की आवश्यकता नहीं है। पुराना
embedded-runner-only extension factory registration path हटा दिया गया है।
</Accordion>

### Gateway discovery registration

`api.registerGatewayDiscoveryService(...)` plugin को active
Gateway को mDNS/Bonjour जैसे local discovery transport पर advertise करने देता है। OpenClaw
service को Gateway startup के दौरान कॉल करता है जब local discovery सक्षम हो, current
Gateway ports और non-secret TXT hint data पास करता है, और Gateway shutdown के दौरान लौटाए गए
`stop` handler को कॉल करता है।

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway discovery plugins को advertised TXT values को secrets या
authentication नहीं मानना चाहिए। Discovery एक routing hint है; Gateway auth और TLS pinning अभी भी
trust के स्वामी हैं।

### CLI registration metadata

`api.registerCli(registrar, opts?)` दो प्रकार के command metadata स्वीकार करता है:

- `commands`: registrar के स्वामित्व वाले explicit command names
- `descriptors`: CLI help,
  routing और lazy plugin CLI registration के लिए उपयोग किए जाने वाले parse-time command descriptors
- `parentPath`: nested command groups के लिए वैकल्पिक parent command path, जैसे
  `["nodes"]`

paired-node features के लिए,
`api.registerNodeCliFeature(registrar, opts?)` को प्राथमिकता दें। यह
`api.registerCli(..., { parentPath: ["nodes"] })` के around एक छोटा wrapper है और
`openclaw nodes canvas` जैसे commands को explicit plugin-स्वामित्व वाली node features बनाता है।

यदि आप चाहते हैं कि कोई plugin command सामान्य root CLI path में lazy-loaded रहे,
तो ऐसे `descriptors` दें जो उस
registrar द्वारा expose किए गए हर top-level command root को cover करें।

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Nested commands को resolved parent command `program` के रूप में मिलता है:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

`commands` को अकेले केवल तब उपयोग करें जब आपको lazy root CLI registration की आवश्यकता न हो।
वह eager compatibility path समर्थित रहता है, लेकिन वह parse-time lazy loading के लिए
descriptor-backed placeholders install नहीं करता।

### CLI backend registration

`api.registerCliBackend(...)` plugin को `claude-cli` या `my-cli` जैसे local
AI CLI backend के लिए default config का स्वामी बनने देता है।

- बैकएंड `id`, `my-cli/gpt-5` जैसे मॉडल refs में provider prefix बन जाता है।
- बैकएंड `config`, `agents.defaults.cliBackends.<id>` जैसी ही आकृति का उपयोग करता है।
- उपयोगकर्ता config फिर भी प्राथमिक रहती है। CLI चलाने से पहले OpenClaw, plugin default के ऊपर
  `agents.defaults.cliBackends.<id>` को merge करता है।
- जब किसी बैकएंड को merge के बाद compatibility rewrites की आवश्यकता हो, तो `normalizeConfig` का उपयोग करें
  (उदाहरण के लिए पुराने flag shapes को normalize करना)।
- request-scoped argv rewrites के लिए `resolveExecutionArgs` का उपयोग करें, जो
  CLI dialect से संबंधित हों, जैसे OpenClaw thinking levels को native effort
  flag पर map करना। hook को `ctx.executionMode` मिलता है; ephemeral `/btw` calls के लिए
  backend-native isolation flags जोड़ने हेतु `"side-question"` का उपयोग करें। यदि वे flags
  किसी अन्यथा हमेशा चालू CLI के लिए native tools को भरोसेमंद ढंग से disable करते हैं, तो
  `sideQuestionToolMode: "disabled"` भी घोषित करें।

end-to-end authoring guide के लिए, देखें
[CLI backend plugins](/hi/plugins/cli-backend-plugins).

### Exclusive slots

| Method                                     | यह क्या register करता है                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (एक समय में एक active)। Lifecycle callbacks को `runtimeSettings` मिलता है जब host model/provider/mode diagnostics दे सकता है; पुराने strict engines को उस key के बिना फिर से try किया जाता है। |
| `api.registerMemoryCapability(capability)` | Unified memory capability                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | Memory prompt section builder                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Memory flush plan resolver                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Memory runtime adapter                                                                                                                                                                             |

### Deprecated memory embedding adapters

| Method                                         | यह क्या register करता है                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | active plugin के लिए Memory embedding adapter |

- `registerMemoryCapability` पसंदीदा exclusive memory-plugin API है।
- `registerMemoryCapability`, `publicArtifacts.listArtifacts(...)` को भी expose कर सकता है
  ताकि companion plugins किसी specific
  memory plugin के private layout में जाने के बजाय
  `openclaw/plugin-sdk/memory-host-core` के जरिए exported memory artifacts का उपयोग कर सकें।
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, और
  `registerMemoryRuntime` legacy-compatible exclusive memory-plugin APIs हैं।
- `MemoryFlushPlan.model`, active fallback
  chain inherit किए बिना flush turn को exact `provider/model`
  reference पर pin कर सकता है, जैसे `ollama/qwen3:8b`।
- `registerMemoryEmbeddingProvider` deprecated है। नए embedding providers को
  `api.registerEmbeddingProvider(...)` और
  `contracts.embeddingProviders` का उपयोग करना चाहिए।
- Existing memory-specific providers migration
  window के दौरान काम करना जारी रखते हैं, लेकिन plugin inspection इसे
  non-bundled plugins के लिए compatibility debt के रूप में report करता है।

### Events और lifecycle

| Method                                       | यह क्या करता है                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typed lifecycle hook          |
| `api.onConversationBindingResolved(handler)` | Conversation binding callback |

उदाहरणों, common hook names, और guard
semantics के लिए [Plugin hooks](/hi/plugins/hooks) देखें।

### Hook decision semantics

`before_install` plugin-runtime lifecycle hook है, operator install
policy surface नहीं। जब allow/block decision को CLI और Gateway-backed install या update paths
को cover करना हो, तो `security.installPolicy` का उपयोग करें।

- `before_tool_call`: `{ block: true }` लौटाना terminal है। जब कोई भी handler इसे set करता है, lower-priority handlers skip हो जाते हैं।
- `before_tool_call`: `{ block: false }` लौटाना no decision माना जाता है (`block` omit करने जैसा), override नहीं।
- `before_install`: `{ block: true }` लौटाना terminal है। जब कोई भी handler इसे set करता है, lower-priority handlers skip हो जाते हैं।
- `before_install`: `{ block: false }` लौटाना no decision माना जाता है (`block` omit करने जैसा), override नहीं।
- `reply_dispatch`: `{ handled: true, ... }` लौटाना terminal है। जब कोई handler dispatch claim करता है, lower-priority handlers और default model dispatch path skip हो जाते हैं।
- `message_sending`: `{ cancel: true }` लौटाना terminal है। जब कोई भी handler इसे set करता है, lower-priority handlers skip हो जाते हैं।
- `message_sending`: `{ cancel: false }` लौटाना no decision माना जाता है (`cancel` omit करने जैसा), override नहीं।
- `message_received`: जब आपको inbound thread/topic routing की आवश्यकता हो, तो typed `threadId` field का उपयोग करें। channel-specific extras के लिए `metadata` रखें।
- `message_sending`: channel-specific `metadata` पर fallback करने से पहले typed `replyToId` / `threadId` routing fields का उपयोग करें।
- `gateway_start`: internal `gateway:startup` hooks पर निर्भर रहने के बजाय gateway-owned startup state के लिए `ctx.config`, `ctx.workspaceDir`, और `ctx.getCron?.()` का उपयोग करें।
- `cron_changed`: gateway-owned cron lifecycle changes को observe करें। external wake schedulers को sync करते समय `event.job?.state?.nextRunAtMs` और `ctx.getCron?.()` का उपयोग करें, और due checks तथा execution के लिए OpenClaw को source of truth बनाए रखें।

### API object fields

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | Display name                                                                                |
| `api.version`            | `string?`                 | Plugin version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin description (optional)                                                               |
| `api.source`             | `string`                  | Plugin source path                                                                          |
| `api.rootDir`            | `string?`                 | Plugin root directory (optional)                                                            |
| `api.config`             | `OpenClawConfig`          | Current config snapshot (available होने पर active in-memory runtime snapshot)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` से Plugin-specific config                                   |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/hi/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Scoped logger (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Current load mode; `"setup-runtime"` lightweight pre-full-entry startup/setup window है |
| `api.resolvePath(input)` | `(string) => string`      | plugin root के सापेक्ष path resolve करें                                                        |

## Internal module convention

अपने plugin के भीतर, internal imports के लिए local barrel files का उपयोग करें:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  production code से अपने ही plugin को `openclaw/plugin-sdk/<your-plugin>`
  के जरिए कभी import न करें। internal imports को `./api.ts` या
  `./runtime-api.ts` से route करें। SDK path केवल external contract है।
</Warning>

Facade-loaded bundled plugin public surfaces (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, और समान public entry files), जब OpenClaw पहले से चल रहा हो, तो
active runtime config snapshot को प्राथमिकता देते हैं। यदि अभी कोई runtime
snapshot मौजूद नहीं है, तो वे disk पर resolved config file पर fallback करते हैं।
Packaged bundled plugin facades को OpenClaw के plugin
facade loaders के जरिए load किया जाना चाहिए; `dist/extensions/...` से direct imports manifest
और runtime sidecar checks को bypass करते हैं, जिन्हें packaged installs plugin-owned code के लिए उपयोग करते हैं।

Provider plugins एक narrow plugin-local contract barrel expose कर सकते हैं जब कोई
helper जानबूझकर provider-specific हो और अभी generic SDK
subpath में न आता हो। Bundled examples:

- **Anthropic**: Claude
  beta-header और `service_tier` stream helpers के लिए public `api.ts` / `contract-api.ts` seam।
- **`@openclaw/openai-provider`**: `api.ts` provider builders,
  default-model helpers, और realtime provider builders export करता है।
- **`@openclaw/openrouter-provider`**: `api.ts` provider builder
  के साथ onboarding/config helpers export करता है।

<Warning>
  Extension production code को `openclaw/plugin-sdk/<other-plugin>`
  imports से भी बचना चाहिए। यदि कोई helper सचमुच shared है, तो दो plugins को couple करने के बजाय
  उसे neutral SDK subpath में promote करें
  जैसे `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, या कोई अन्य
  capability-oriented surface।
</Warning>

## संबंधित

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/hi/plugins/sdk-entrypoints">
    `definePluginEntry` और `defineChannelPluginEntry` options।
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/hi/plugins/sdk-runtime">
    पूरा `api.runtime` namespace reference।
  </Card>
  <Card title="Setup और config" icon="sliders" href="/hi/plugins/sdk-setup">
    Packaging, manifests, और config schemas।
  </Card>
  <Card title="Testing" icon="vial" href="/hi/plugins/sdk-testing">
    Test utilities और lint rules।
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/hi/plugins/sdk-migration">
    deprecated surfaces से migrate करना।
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/hi/plugins/architecture">
    गहरी architecture और capability model।
  </Card>
</CardGroup>
