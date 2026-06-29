---
read_when:
    - आपको यह जानना होगा कि किस SDK सबपाथ से इम्पोर्ट करना है
    - आप OpenClawPluginApi पर सभी पंजीकरण विधियों के लिए एक संदर्भ चाहते हैं
    - आप किसी विशिष्ट SDK export को खोज रहे हैं
sidebarTitle: Plugin SDK overview
summary: इम्पोर्ट मैप, पंजीकरण API संदर्भ, और SDK आर्किटेक्चर
title: Plugin SDK का अवलोकन
x-i18n:
    generated_at: "2026-06-28T23:52:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK, plugins और core के बीच typed contract है। यह पृष्ठ **क्या import करना है** और **क्या register किया जा सकता है** के लिए संदर्भ है।

<Note>
  यह पृष्ठ OpenClaw के अंदर `openclaw/plugin-sdk/*` का उपयोग करने वाले plugin authors के लिए है। बाहरी apps, scripts, dashboards, CI jobs, और IDE extensions के लिए, जो Gateway के माध्यम से agents चलाना चाहते हैं, इसके बजाय [बाहरी apps के लिए Gateway integrations](/hi/gateway/external-apps) का उपयोग करें।
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

हर subpath एक छोटा, self-contained module है। इससे startup तेज रहता है और circular dependency समस्याएं रुकती हैं। channel-specific entry/build helpers के लिए, `openclaw/plugin-sdk/channel-core` को प्राथमिकता दें; व्यापक umbrella surface और `buildChannelConfigSchema` जैसे shared helpers के लिए `openclaw/plugin-sdk/core` रखें।

channel config के लिए, channel-owned JSON Schema को `openclaw.plugin.json#channelConfigs` के माध्यम से publish करें। `plugin-sdk/channel-config-schema` subpath shared schema primitives और generic builder के लिए है। OpenClaw के bundled plugins retained bundled-channel schemas के लिए `plugin-sdk/bundled-channel-config-schema` का उपयोग करते हैं। Deprecated compatibility exports `plugin-sdk/channel-config-schema-legacy` पर बने रहते हैं; कोई भी bundled schema subpath नए plugins के लिए pattern नहीं है।

<Warning>
  provider- या channel-branded convenience seams import न करें, उदाहरण के लिए `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`। Bundled plugins अपने `api.ts` / `runtime-api.ts` barrels के अंदर generic SDK subpaths compose करते हैं; core consumers को या तो वे plugin-local barrels उपयोग करने चाहिए या जब कोई आवश्यकता वास्तव में cross-channel हो, तब narrow generic SDK contract जोड़ना चाहिए।

bundled-plugin helper seams का एक छोटा set generated export map में अभी भी दिखाई देता है, जब उनके पास tracked owner usage हो। वे केवल bundled-plugin maintenance के लिए मौजूद हैं और नए third-party plugins के लिए recommended import paths नहीं हैं।

`openclaw/plugin-sdk/discord` और `openclaw/plugin-sdk/telegram-account` को tracked owner usage के लिए deprecated compatibility facades के रूप में भी रखा गया है। उन import paths को नए plugins में copy न करें; इसके बजाय injected runtime helpers और generic channel SDK subpaths का उपयोग करें।
</Warning>

## Subpath reference

Plugin SDK को area के अनुसार grouped narrow subpaths के set के रूप में expose किया गया है: plugin entry, channel, provider, auth, runtime, capability, memory, और reserved bundled-plugin helpers। पूरे catalog के लिए, grouped और linked रूप में, [Plugin SDK subpaths](/hi/plugins/sdk-subpaths) देखें।

compiler entrypoint inventory `scripts/lib/plugin-sdk-entrypoints.json` में रहती है; package exports, `scripts/lib/plugin-sdk-private-local-only-subpaths.json` में listed repo-local test/internal subpaths घटाने के बाद public subset से generate किए जाते हैं। public export count audit करने के लिए `pnpm plugin-sdk:surface` चलाएं। Deprecated public subpaths, जो काफी पुराने हैं और bundled extension production code द्वारा unused हैं, `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` में track किए जाते हैं; broad deprecated re-export barrels `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` में track किए जाते हैं।

## Registration API

`register(api)` callback को इन methods वाला `OpenClawPluginApi` object मिलता है:

### Capability registration

| Method                                           | यह क्या register करता है                     |
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

`api.registerEmbeddingProvider(...)` के साथ register किए गए embedding providers को plugin manifest में `contracts.embeddingProviders` में भी listed होना चाहिए। यह reusable vector generation के लिए generic embedding surface है। Memory search इस generic provider surface को consume कर सकता है। पुराना `api.registerMemoryEmbeddingProvider(...)` और `contracts.memoryEmbeddingProviders` seam deprecated compatibility है, जबकि मौजूदा memory-specific providers migrate कर रहे हैं।

Memory-specific providers जो अभी भी runtime `batchEmbed(...)` expose करते हैं, वे मौजूदा per-file batching contract पर रहते हैं, जब तक उनका runtime स्पष्ट रूप से `sourceWideBatchEmbed: true` set न करे। वह opt-in memory host को multiple dirty memory files और enabled sources से chunks को host batch limits तक एक `batchEmbed(...)` call में submit करने देता है। JSONL request files upload करने वाले batch adapters को provider jobs को उनके upload-size cap और request-count cap से पहले split करना होगा। provider को `batch.chunks` के समान क्रम में हर input chunk के लिए एक embedding return करनी होगी; जब provider file-local batches expect करता है या बड़े source-wide job में input ordering preserve नहीं कर सकता, तो flag छोड़ दें।

### Tools and commands

Fixed tool names वाले simple tool-only plugins के लिए [`defineToolPlugin`](/hi/plugins/tool-plugins) का उपयोग करें। mixed plugins या fully dynamic tool registration के लिए `api.registerTool(...)` को सीधे उपयोग करें।

| Method                          | यह क्या register करता है                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent tool (required या `{ optional: true }`) |
| `api.registerCommand(def)`      | Custom command (LLM को bypass करता है)             |

Plugin commands `agentPromptGuidance` set कर सकते हैं, जब agent को छोटा command-owned routing hint चाहिए। उस text को command itself के बारे में रखें; core prompt builders में provider- या plugin-specific policy न जोड़ें।

Guidance entries legacy strings हो सकती हैं, जो हर prompt surface पर apply होती हैं, या structured entries:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Structured `surfaces` में `openclaw_main`, `codex_app_server`, `cli_backend`, `acp_backend`, या `subagent` शामिल हो सकते हैं। `pi_main`, `openclaw_main` के लिए deprecated alias बना हुआ है। intentional all-surface guidance के लिए `surfaces` omit करें। खाली `surfaces` array pass न करें; इसे reject किया जाता है ताकि accidental scope loss global prompt text न बन जाए।

Native Codex app-server developer instructions अन्य prompt surfaces से अधिक strict हैं: केवल `codex_app_server` के लिए explicitly scoped guidance ही उस higher-priority lane में promote की जाती है। Legacy string guidance और unscoped structured guidance compatibility के लिए non-Codex prompt surfaces को available रहती हैं।

### Infrastructure

| Method                                         | यह क्या register करता है                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | Gateway HTTP endpoint                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC method                      |
| `api.registerGatewayDiscoveryService(service)` | Local Gateway discovery advertiser      |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                          |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` के तहत Node feature CLI |
| `api.registerService(service)`                 | Background service                      |
| `api.registerInteractiveHandler(registration)` | Interactive handler                     |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result middleware          |
| `api.registerMemoryPromptSupplement(builder)`  | Additive memory-adjacent prompt section |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additive memory search/read corpus      |

### Host hooks for workflow plugins

Host hooks उन plugins के लिए SDK seams हैं जिन्हें केवल provider, channel, या tool जोड़ने के बजाय host lifecycle में participate करना होता है। वे generic contracts हैं; Plan Mode उनका उपयोग कर सकता है, लेकिन approval workflows, workspace policy gates, background monitors, setup wizards, और UI companion plugins भी कर सकते हैं।

| विधि                                                                                 | इसके स्वामित्व वाला अनुबंध                                                                                                                   |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-स्वामित्व वाली, JSON-संगत सत्र स्थिति जो Gateway सत्रों के माध्यम से प्रक्षेपित होती है                                                 |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | एक सत्र के लिए अगले एजेंट टर्न में इंजेक्ट किया गया टिकाऊ ठीक-एक-बार संदर्भ                                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | मेनिफेस्ट-गेटेड विश्वसनीय प्री-Plugin टूल नीति जो टूल पैरामीटरों को रोक या फिर से लिख सकती है                                                  |
| `api.registerToolMetadata(...)`                                                      | टूल कार्यान्वयन बदले बिना टूल कैटलॉग प्रदर्शन मेटाडेटा                                                                                        |
| `api.registerCommand(...)`                                                           | स्कोप किए गए Plugin कमांड; कमांड परिणाम `continueAgent: true` सेट कर सकते हैं; Discord नेटिव कमांड `descriptionLocalizations` का समर्थन करते हैं |
| `api.session.controls.registerControlUiDescriptor(...)`                              | सत्र, टूल, रन, या सेटिंग सतहों के लिए Control UI योगदान डिस्क्रिप्टर                                                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | रीसेट/डिलीट/रीलोड पथों पर Plugin-स्वामित्व वाले रनटाइम संसाधनों के लिए क्लीनअप कॉलबैक                                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | वर्कफ़्लो स्थिति और मॉनिटर के लिए सैनिटाइज़ किए गए इवेंट सब्सक्रिप्शन                                                                          |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | प्रति-रन Plugin स्क्रैच स्थिति जो टर्मिनल रन जीवनचक्र पर साफ़ की जाती है                                                                        |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin-स्वामित्व वाले शेड्यूलर जॉब के लिए क्लीनअप मेटाडेटा; काम शेड्यूल नहीं करता या टास्क रिकॉर्ड नहीं बनाता                                  |
| `api.session.workflow.sendSessionAttachment(...)`                                    | सक्रिय डायरेक्ट-आउटबाउंड सत्र रूट तक बंडल्ड-केवल होस्ट-मध्यस्थ फ़ाइल अटैचमेंट डिलीवरी                                                          |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | बंडल्ड-केवल Cron-समर्थित शेड्यूल किए गए सत्र टर्न और टैग-आधारित क्लीनअप                                                                        |
| `api.session.controls.registerSessionAction(...)`                                    | टाइप किए गए सत्र एक्शन जिन्हें क्लाइंट Gateway के माध्यम से डिस्पैच कर सकते हैं                                                                 |

नए Plugin कोड के लिए समूहित नेमस्पेस का उपयोग करें:

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

समतुल्य फ्लैट विधियां मौजूदा plugins के लिए डिप्रिकेटेड संगतता
उपनामों के रूप में उपलब्ध रहती हैं। ऐसा नया Plugin कोड न जोड़ें जो
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn`, या
`api.unscheduleSessionTurnsByTag` को सीधे कॉल करता हो।

`scheduleSessionTurn(...)` Gateway Cron शेड्यूलर के ऊपर सत्र-स्कोप की गई सुविधा है।
Cron टाइमिंग का स्वामी है और टर्न चलने पर बैकग्राउंड टास्क रिकॉर्ड बनाता है;
Plugin SDK केवल लक्ष्य सत्र, Plugin-स्वामित्व वाली नामकरण पद्धति, और क्लीनअप को सीमित करता है।
जब काम को स्वयं टिकाऊ बहु-चरणीय TaskFlow स्थिति चाहिए, तो शेड्यूल किए गए
टर्न के अंदर `api.runtime.tasks.managedFlows` का उपयोग करें।

अनुबंध जानबूझकर अधिकार को अलग करते हैं:

- बाहरी plugins सत्र एक्सटेंशन, UI डिस्क्रिप्टर, कमांड, टूल
  मेटाडेटा, नेक्स्ट-टर्न इंजेक्शन, और सामान्य हुक के स्वामी हो सकते हैं।
- विश्वसनीय टूल नीतियां सामान्य `before_tool_call` हुक से पहले चलती हैं और
  होस्ट-विश्वसनीय होती हैं। बंडल्ड नीतियां पहले चलती हैं; इंस्टॉल किए गए Plugin की नीतियों को
  स्पष्ट सक्षमकरण और `contracts.trustedToolPolicies` में उनके स्थानीय ids की आवश्यकता होती है,
  और वे Plugin-लोड क्रम में अगली चलती हैं। नीति ids रजिस्टर करने वाले Plugin तक
  स्कोप किए जाते हैं।
- आरक्षित कमांड स्वामित्व केवल बंडल्ड है। बाहरी plugins को अपने
  स्वयं के कमांड नामों या उपनामों का उपयोग करना चाहिए।
- `allowPromptInjection=false` प्रॉम्प्ट बदलने वाले हुक को अक्षम करता है, जिनमें
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  पुराने `before_agent_start` से प्रॉम्प्ट फ़ील्ड, और
  `enqueueNextTurnInjection` शामिल हैं।

गैर-Plan उपभोक्ताओं के उदाहरण:

| Plugin आर्केटाइप           | उपयोग किए गए हुक                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| अनुमोदन वर्कफ़्लो          | सत्र एक्सटेंशन, कमांड कंटिन्यूएशन, नेक्स्ट-टर्न इंजेक्शन, UI डिस्क्रिप्टर                                                               |
| बजट/वर्कस्पेस नीति गेट     | विश्वसनीय टूल नीति, टूल मेटाडेटा, सत्र प्रोजेक्शन                                                                                       |
| बैकग्राउंड जीवनचक्र मॉनिटर | रनटाइम जीवनचक्र क्लीनअप, एजेंट इवेंट सब्सक्रिप्शन, सत्र शेड्यूलर स्वामित्व/क्लीनअप, Heartbeat प्रॉम्प्ट योगदान, UI डिस्क्रिप्टर          |
| सेटअप या ऑनबोर्डिंग विज़ार्ड | सत्र एक्सटेंशन, स्कोप किए गए कमांड, Control UI डिस्क्रिप्टर                                                                             |

<Note>
  आरक्षित कोर एडमिन नेमस्पेस (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) हमेशा `operator.admin` ही रहते हैं, भले ही कोई Plugin
  संकुचित gateway विधि स्कोप असाइन करने की कोशिश करे। Plugin-स्वामित्व वाली
  विधियों के लिए Plugin-विशिष्ट प्रीफ़िक्स को प्राथमिकता दें।
</Note>

<Accordion title="When to use tool-result middleware">
  बंडल्ड plugins और मेल खाते मेनिफेस्ट अनुबंधों के साथ स्पष्ट रूप से सक्षम
  इंस्टॉल किए गए plugins `api.registerAgentToolResultMiddleware(...)` का उपयोग तब कर सकते हैं
  जब उन्हें निष्पादन के बाद और रनटाइम द्वारा उस परिणाम को मॉडल में वापस
  देने से पहले टूल परिणाम को फिर से लिखना हो। यह tokenjuice जैसे असिंक
  आउटपुट रिड्यूसर के लिए विश्वसनीय रनटाइम-न्यूट्रल सीमा है।

plugins को हर लक्षित रनटाइम के लिए `contracts.agentToolResultMiddleware`
घोषित करना होगा, उदाहरण के लिए `["openclaw", "codex"]`। उस
अनुबंध के बिना, या स्पष्ट सक्षमकरण के बिना, इंस्टॉल किए गए plugins यह
मिडलवेयर रजिस्टर नहीं कर सकते; ऐसे काम के लिए सामान्य OpenClaw Plugin हुक रखें
जिसे प्री-मॉडल टूल-परिणाम टाइमिंग की आवश्यकता नहीं है। पुराना
केवल-एम्बेडेड-रनर एक्सटेंशन फ़ैक्टरी रजिस्ट्रेशन पथ हटा दिया गया है।
</Accordion>

### Gateway डिस्कवरी रजिस्ट्रेशन

`api.registerGatewayDiscoveryService(...)` किसी Plugin को mDNS/Bonjour जैसे
स्थानीय डिस्कवरी ट्रांसपोर्ट पर सक्रिय Gateway का विज्ञापन करने देता है। OpenClaw
स्थानीय डिस्कवरी सक्षम होने पर Gateway स्टार्टअप के दौरान सेवा को कॉल करता है,
वर्तमान Gateway पोर्ट और गैर-गोपनीय TXT संकेत डेटा पास करता है, और Gateway
शटडाउन के दौरान लौटाए गए `stop` हैंडलर को कॉल करता है।

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

Gateway डिस्कवरी plugins को विज्ञापित TXT मानों को गोपनीय या प्रमाणीकरण नहीं मानना चाहिए।
डिस्कवरी एक रूटिंग संकेत है; Gateway auth और TLS pinning अभी भी
विश्वास के स्वामी हैं।

### CLI रजिस्ट्रेशन मेटाडेटा

`api.registerCli(registrar, opts?)` दो प्रकार के कमांड मेटाडेटा स्वीकार करता है:

- `commands`: रजिस्ट्रार के स्वामित्व वाले स्पष्ट कमांड नाम
- `descriptors`: CLI सहायता, रूटिंग, और lazy Plugin CLI रजिस्ट्रेशन के लिए
  पार्स-टाइम कमांड डिस्क्रिप्टर
- `parentPath`: नेस्टेड कमांड समूहों के लिए वैकल्पिक पैरेंट कमांड पथ, जैसे
  `["nodes"]`

पेयर किए गए node फीचर के लिए,
`api.registerNodeCliFeature(registrar, opts?)` को प्राथमिकता दें। यह
`api.registerCli(..., { parentPath: ["nodes"] })` के चारों ओर एक छोटा रैपर है
और `openclaw nodes canvas` जैसे कमांड को स्पष्ट Plugin-स्वामित्व वाले node फीचर बनाता है।

यदि आप चाहते हैं कि कोई Plugin कमांड सामान्य रूट CLI पथ में lazy-loaded रहे,
तो ऐसे `descriptors` दें जो उस रजिस्ट्रार द्वारा उजागर किए गए हर शीर्ष-स्तरीय
कमांड रूट को कवर करते हों।

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

नेस्टेड कमांड को resolved पैरेंट कमांड `program` के रूप में मिलता है:

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

`commands` को अकेले केवल तब उपयोग करें जब आपको lazy रूट CLI रजिस्ट्रेशन की
आवश्यकता न हो। वह eager संगतता पथ समर्थित रहता है, लेकिन वह पार्स-टाइम
lazy loading के लिए डिस्क्रिप्टर-समर्थित placeholders इंस्टॉल नहीं करता।

### CLI बैकएंड रजिस्ट्रेशन

`api.registerCliBackend(...)` किसी Plugin को `claude-cli` या `my-cli` जैसे
स्थानीय AI CLI बैकएंड के लिए डिफ़ॉल्ट कॉन्फ़िगरेशन का स्वामी बनने देता है।

- बैकएंड `id`, `my-cli/gpt-5` जैसे मॉडल refs में प्रदाता प्रीफ़िक्स बन जाता है।
- बैकएंड `config` वही आकार उपयोग करता है जो `agents.defaults.cliBackends.<id>` का है।
- उपयोगकर्ता कॉन्फ़िगरेशन फिर भी प्राथमिक रहता है। OpenClaw CLI चलाने से पहले
  `agents.defaults.cliBackends.<id>` को Plugin डिफ़ॉल्ट के ऊपर मर्ज करता है।
- जब किसी बैकएंड को मर्ज के बाद संगतता पुनर्लेखन चाहिए हों, तो `normalizeConfig`
  का उपयोग करें (उदाहरण के लिए पुराने फ़्लैग आकारों को सामान्य करना)।
- अनुरोध-स्कोप किए गए argv पुनर्लेखन के लिए `resolveExecutionArgs` का उपयोग करें
  जो CLI डायलेक्ट से संबंधित हों, जैसे OpenClaw thinking स्तरों को किसी नेटिव effort
  फ़्लैग से मैप करना। हुक को `ctx.executionMode` मिलता है; ephemeral `/btw` कॉल के लिए
  बैकएंड-नेटिव isolation फ़्लैग जोड़ने हेतु `"side-question"` का उपयोग करें। यदि वे फ़्लैग
  अन्यथा हमेशा-ऑन CLI के लिए नेटिव टूल को विश्वसनीय रूप से अक्षम करते हैं, तो
  `sideQuestionToolMode: "disabled"` भी घोषित करें।

एंड-टू-एंड लेखन गाइड के लिए, देखें
[CLI बैकएंड plugins](/hi/plugins/cli-backend-plugins).

### एक्सक्लूसिव स्लॉट

| विधि                                      | यह क्या पंजीकृत करती है                                                                                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | संदर्भ इंजन (एक समय में एक सक्रिय)। जब होस्ट मॉडल/प्रदाता/मोड निदान दे सकता है, तो जीवनचक्र कॉलबैक `runtimeSettings` प्राप्त करते हैं; पुराने सख्त इंजन उस कुंजी के बिना फिर से आजमाए जाते हैं। |
| `api.registerMemoryCapability(capability)` | एकीकृत स्मृति क्षमता                                                                                                                                                                          |
| `api.registerMemoryPromptSection(builder)` | स्मृति प्रॉम्प्ट सेक्शन बिल्डर                                                                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | स्मृति फ्लश प्लान रिज़ॉल्वर                                                                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | स्मृति रनटाइम अडैप्टर                                                                                                                                                                             |

### अप्रचलित स्मृति एम्बेडिंग अडैप्टर

| विधि                                          | यह क्या पंजीकृत करती है                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | सक्रिय Plugin के लिए स्मृति एम्बेडिंग अडैप्टर |

- `registerMemoryCapability` पसंदीदा विशिष्ट स्मृति-Plugin API है।
- `registerMemoryCapability` `publicArtifacts.listArtifacts(...)` भी उजागर कर सकता है,
  ताकि सहयोगी plugins किसी विशिष्ट स्मृति Plugin के निजी लेआउट में जाने के बजाय
  `openclaw/plugin-sdk/memory-host-core` के माध्यम से निर्यातित स्मृति आर्टिफैक्ट्स का उपयोग कर सकें।
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, और
  `registerMemoryRuntime` विरासत-संगत विशिष्ट स्मृति-Plugin APIs हैं।
- `MemoryFlushPlan.model` सक्रिय फॉलबैक चेन को विरासत में लिए बिना फ्लश टर्न को किसी सटीक `provider/model`
  संदर्भ, जैसे `ollama/qwen3:8b`, पर पिन कर सकता है।
- `registerMemoryEmbeddingProvider` अप्रचलित है। नए एम्बेडिंग प्रदाताओं को
  `api.registerEmbeddingProvider(...)` और
  `contracts.embeddingProviders` का उपयोग करना चाहिए।
- मौजूदा स्मृति-विशिष्ट प्रदाता माइग्रेशन अवधि के दौरान काम करते रहेंगे,
  लेकिन Plugin निरीक्षण इसे गैर-बंडल plugins के लिए संगतता ऋण के रूप में रिपोर्ट करता है।

### इवेंट और जीवनचक्र

| विधि                                        | यह क्या करती है                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | टाइप किया गया जीवनचक्र हुक          |
| `api.onConversationBindingResolved(handler)` | बातचीत बाइंडिंग कॉलबैक |

उदाहरणों, सामान्य हुक नामों, और गार्ड सेमांटिक्स के लिए [Plugin हुक](/hi/plugins/hooks)
देखें।

### हुक निर्णय सेमांटिक्स

`before_install` एक Plugin-रनटाइम जीवनचक्र हुक है, ऑपरेटर इंस्टॉल नीति सतह
नहीं। जब किसी अनुमति/ब्लॉक निर्णय को CLI और Gateway-समर्थित इंस्टॉल या अपडेट पथों
को कवर करना हो, तो `security.installPolicy` का उपयोग करें।

- `before_tool_call`: `{ block: true }` लौटाना टर्मिनल है। जब कोई भी हैंडलर इसे सेट कर देता है, तो कम-प्राथमिकता वाले हैंडलर छोड़ दिए जाते हैं।
- `before_tool_call`: `{ block: false }` लौटाना कोई निर्णय नहीं माना जाता है (`block` को छोड़ने जैसा), ओवरराइड नहीं।
- `before_install`: `{ block: true }` लौटाना टर्मिनल है। जब कोई भी हैंडलर इसे सेट कर देता है, तो कम-प्राथमिकता वाले हैंडलर छोड़ दिए जाते हैं।
- `before_install`: `{ block: false }` लौटाना कोई निर्णय नहीं माना जाता है (`block` को छोड़ने जैसा), ओवरराइड नहीं।
- `reply_dispatch`: `{ handled: true, ... }` लौटाना टर्मिनल है। जब कोई भी हैंडलर डिस्पैच का दावा करता है, तो कम-प्राथमिकता वाले हैंडलर और डिफॉल्ट मॉडल डिस्पैच पथ छोड़ दिए जाते हैं।
- `message_sending`: `{ cancel: true }` लौटाना टर्मिनल है। जब कोई भी हैंडलर इसे सेट कर देता है, तो कम-प्राथमिकता वाले हैंडलर छोड़ दिए जाते हैं।
- `message_sending`: `{ cancel: false }` लौटाना कोई निर्णय नहीं माना जाता है (`cancel` को छोड़ने जैसा), ओवरराइड नहीं।
- `message_received`: जब आपको इनबाउंड थ्रेड/टॉपिक रूटिंग चाहिए, तो टाइप किए गए `threadId` फ़ील्ड का उपयोग करें। चैनल-विशिष्ट अतिरिक्त चीजों के लिए `metadata` रखें।
- `message_sending`: चैनल-विशिष्ट `metadata` पर लौटने से पहले टाइप किए गए `replyToId` / `threadId` रूटिंग फ़ील्ड का उपयोग करें।
- `gateway_start`: आंतरिक `gateway:startup` हुक पर निर्भर रहने के बजाय gateway-स्वामित्व वाली स्टार्टअप स्थिति के लिए `ctx.config`, `ctx.workspaceDir`, और `ctx.getCron?.()` का उपयोग करें।
- `cron_changed`: gateway-स्वामित्व वाले cron जीवनचक्र परिवर्तनों को देखें। बाहरी वेक शेड्यूलरों को सिंक करते समय `event.job?.state?.nextRunAtMs` और `ctx.getCron?.()` का उपयोग करें, और देय जांचों और निष्पादन के लिए OpenClaw को सत्य का स्रोत बनाए रखें।

### API ऑब्जेक्ट फ़ील्ड

| फ़ील्ड                    | प्रकार                     | विवरण                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                   |
| `api.name`               | `string`                  | प्रदर्शन नाम                                                                                |
| `api.version`            | `string?`                 | Plugin संस्करण (वैकल्पिक)                                                                   |
| `api.description`        | `string?`                 | Plugin विवरण (वैकल्पिक)                                                               |
| `api.source`             | `string`                  | Plugin स्रोत पथ                                                                          |
| `api.rootDir`            | `string?`                 | Plugin रूट डायरेक्टरी (वैकल्पिक)                                                            |
| `api.config`             | `OpenClawConfig`          | मौजूदा कॉन्फ़िग स्नैपशॉट (उपलब्ध होने पर सक्रिय इन-मेमरी रनटाइम स्नैपशॉट)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | `plugins.entries.<id>.config` से Plugin-विशिष्ट कॉन्फ़िग                                   |
| `api.runtime`            | `PluginRuntime`           | [रनटाइम सहायक](/hi/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | स्कोप्ड लॉगर (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | मौजूदा लोड मोड; `"setup-runtime"` हल्की प्री-फुल-एंट्री स्टार्टअप/सेटअप विंडो है |
| `api.resolvePath(input)` | `(string) => string`      | Plugin रूट के सापेक्ष पथ रिज़ॉल्व करें                                                        |

## आंतरिक मॉड्यूल परंपरा

अपने Plugin के भीतर, आंतरिक imports के लिए स्थानीय barrel फ़ाइलों का उपयोग करें:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  उत्पादन कोड से अपने ही Plugin को `openclaw/plugin-sdk/<your-plugin>`
  के माध्यम से कभी import न करें। आंतरिक imports को `./api.ts` या
  `./runtime-api.ts` के माध्यम से रूट करें। SDK पथ केवल बाहरी अनुबंध है।
</Warning>

Facade-लोडेड बंडल Plugin सार्वजनिक सतहें (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, और समान सार्वजनिक एंट्री फ़ाइलें) जब OpenClaw पहले से चल रहा हो,
तो सक्रिय रनटाइम कॉन्फ़िग स्नैपशॉट को प्राथमिकता देती हैं। यदि अभी कोई रनटाइम
स्नैपशॉट मौजूद नहीं है, तो वे डिस्क पर रिज़ॉल्व की गई कॉन्फ़िग फ़ाइल पर लौटती हैं।
पैकेज किए गए बंडल Plugin facades को OpenClaw के Plugin
facade loaders के माध्यम से लोड किया जाना चाहिए; `dist/extensions/...` से सीधे imports manifest
और रनटाइम sidecar जांचों को बायपास करते हैं, जिन्हें पैकेज किए गए installs Plugin-स्वामित्व वाले कोड के लिए उपयोग करते हैं।

प्रदाता plugins एक संकीर्ण Plugin-स्थानीय अनुबंध barrel उजागर कर सकते हैं, जब कोई
सहायक जानबूझकर प्रदाता-विशिष्ट हो और अभी किसी सामान्य SDK
subpath में न आता हो। बंडल उदाहरण:

- **Anthropic**: Claude
  beta-header और `service_tier` स्ट्रीम सहायकों के लिए सार्वजनिक `api.ts` / `contract-api.ts` सतह।
- **`@openclaw/openai-provider`**: `api.ts` प्रदाता builders,
  डिफॉल्ट-मॉडल सहायकों, और realtime प्रदाता builders को निर्यात करता है।
- **`@openclaw/openrouter-provider`**: `api.ts` प्रदाता builder
  के साथ onboarding/config सहायकों को निर्यात करता है।

<Warning>
  Extension उत्पादन कोड को `openclaw/plugin-sdk/<other-plugin>`
  imports से भी बचना चाहिए। यदि कोई सहायक सचमुच साझा है, तो दो plugins को जोड़ने के बजाय
  उसे `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, या किसी अन्य
  क्षमता-उन्मुख सतह जैसे तटस्थ SDK subpath में बढ़ावा दें।
</Warning>

## संबंधित

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/hi/plugins/sdk-entrypoints">
    `definePluginEntry` और `defineChannelPluginEntry` विकल्प।
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/hi/plugins/sdk-runtime">
    पूरा `api.runtime` namespace संदर्भ।
  </Card>
  <Card title="Setup and config" icon="sliders" href="/hi/plugins/sdk-setup">
    पैकेजिंग, manifests, और config schemas।
  </Card>
  <Card title="Testing" icon="vial" href="/hi/plugins/sdk-testing">
    परीक्षण उपयोगिताएं और lint नियम।
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/hi/plugins/sdk-migration">
    अप्रचलित सतहों से माइग्रेट करना।
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/hi/plugins/architecture">
    गहन आर्किटेक्चर और क्षमता मॉडल।
  </Card>
</CardGroup>
