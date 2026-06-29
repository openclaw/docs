---
read_when:
    - आप किसी एजेंट रन के लिए OpenClaw कोड मोड सक्षम करना चाहते हैं
    - आपको यह समझाना होगा कि कोड मोड Codex Code mode से अलग क्यों है
    - आप exec/wait अनुबंध, QuickJS-WASI सैंडबॉक्स, TypeScript ट्रांसफ़ॉर्म, या छिपे हुए टूल-कैटलॉग ब्रिज की समीक्षा कर रहे हैं
    - आप एक आंतरिक कोड-मोड नामस्थान रजिस्ट्री एकीकरण जोड़ रहे हैं या उसकी समीक्षा कर रहे हैं
sidebarTitle: Code mode
summary: 'OpenClaw कोड मोड: QuickJS-WASI द्वारा समर्थित और छिपे हुए रन-स्कोप्ड टूल कैटलॉग वाला वैकल्पिक रूप से सक्षम exec/wait टूल सतह'
title: कोड मोड
x-i18n:
    generated_at: "2026-06-29T00:07:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

कोड मोड OpenClaw agent-runtime की एक प्रयोगात्मक सुविधा है। यह डिफ़ॉल्ट रूप से
बंद रहती है। जब आप इसे सक्षम करते हैं, तो OpenClaw एक रन के लिए मॉडल जो देखता है
उसे बदल देता है: हर सक्षम tool schema को सीधे उजागर करने के बजाय, मॉडल केवल
`exec` और `wait` देखता है।

यह पेज OpenClaw कोड मोड का दस्तावेजीकरण करता है। यह Codex Code mode नहीं है। दोनों
सुविधाओं का नाम समान है, लेकिन वे अलग-अलग runtimes द्वारा लागू की गई हैं और अलग
`exec` contracts उजागर करती हैं:

- Codex Code Mode, Codex app-server threads के लिए सक्षम होता है जब तक सीमित
  tool policy native code mode को अक्षम न कर दे। यह Codex coding harness में चलता है,
  जहां मॉडल `exec.command` contract के जरिए shell commands लिखता है।
- OpenClaw कोड मोड तब तक अक्षम रहता है जब तक `tools.codeMode.enabled: true`
  कॉन्फ़िगर न हो। यह OpenClaw generic agent runtime में चलता है, जहां मॉडल
  `exec.code` contract के जरिए JavaScript या TypeScript programs लिखता है।

Codex Code Mode और Codex-native dynamic tool search स्थिर Codex harness
surfaces हैं। OpenClaw कोड मोड generic OpenClaw runs के लिए OpenClaw-स्वामित्व वाला
प्रयोगात्मक tool-surface adapter है। यह `quickjs-wasi`, एक छिपा हुआ OpenClaw
tool catalog, और सामान्य OpenClaw tool executor का उपयोग करता है।

## यह क्या है?

OpenClaw कोड मोड मॉडल को tools की लंबी सूची से सीधे चुनने के बजाय एक छोटा
JavaScript या TypeScript program लिखने देता है।

जब कोड मोड सक्रिय होता है:

- मॉडल-दृश्यमान tool सूची ठीक `exec` और `wait` होती है।
- `exec` मॉडल-जनित JavaScript या TypeScript को constrained QuickJS-WASI worker में
  evaluate करता है।
- सामान्य OpenClaw tools मॉडल prompt से छिपे रहते हैं और guest program के अंदर
  `ALL_TOOLS` और `tools` के जरिए उजागर होते हैं।
- Guest code छिपे catalog को search कर सकता है, किसी tool का वर्णन कर सकता है,
  और सामान्य agent turns द्वारा उपयोग किए जाने वाले उसी OpenClaw execution path
  के जरिए tool call कर सकता है।
- MCP tools `MCP` namespace के अंतर्गत समूहबद्ध होते हैं। कोड मोड में, यह namespace
  MCP tools को call करने का एकमात्र समर्थित तरीका है।
- जब nested tool calls अभी भी pending हों, तो `wait` suspended code-mode run को
  resume करता है।

महत्वपूर्ण अंतर: कोड मोड model-facing orchestration surface को बदलता है। यह
OpenClaw tools, Plugin tools, MCP tools, auth, approval policy, channel behavior,
या model selection को replace नहीं करता।

## यह अच्छा क्यों है?

कोड मोड बड़े tool catalogs को models के लिए उपयोग करना आसान बनाता है।

- छोटा prompt surface: providers को दर्जनों या सैकड़ों full tool schemas के बजाय
  दो control tools मिलते हैं।
- बेहतर orchestration: मॉडल एक code cell के अंदर loops, joins, छोटे transforms,
  conditional logic, और parallel nested tool calls का उपयोग कर सकता है।
- Provider neutral: यह provider-native code execution पर निर्भर किए बिना OpenClaw,
  Plugin, MCP, और client tools के लिए काम करता है।
- मौजूदा policy लागू रहती है: nested tool calls अभी भी OpenClaw policy, approvals,
  hooks, session context, और audit paths से होकर गुजरते हैं।
- स्पष्ट failure mode: जब कोड मोड स्पष्ट रूप से सक्षम हो और runtime उपलब्ध न हो,
  तो OpenClaw broad direct tool exposure पर वापस जाने के बजाय fail closed करता है।

कोड मोड खासकर उन agents के लिए उपयोगी है जिनके पास बड़ा enabled tool catalog है या
उन workflows के लिए जहां मॉडल को उत्तर तैयार करने से पहले बार-बार tools को
search, combine, और call करना पड़ता है।

## इसे कैसे सक्षम करें

agent या runtime config में `tools.codeMode.enabled: true` जोड़ें:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

shorthand भी स्वीकार किया जाता है:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

जब `tools.codeMode` छोड़ा गया हो, `false` हो, या ऐसा object हो जिसमें
`enabled: true` न हो, तो कोड मोड बंद ही रहता है।

जब आप configured MCP servers के साथ sandboxed agents का उपयोग करें, तो यह भी
सुनिश्चित करें कि sandbox tool policy bundled MCP Plugin को अनुमति देती है, उदाहरण
के लिए `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]` के साथ। देखें
[कॉन्फ़िगरेशन - tools और custom providers](/hi/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

जब आपको सख्त bounds चाहिए हों, तो explicit limits का उपयोग करें:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

debugging के दौरान model payload shape की पुष्टि करने के लिए, Gateway को targeted
logging के साथ चलाएं:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

कोड मोड सक्रिय होने पर, logged model-facing tool names `exec` और `wait` होने चाहिए।
यदि आपको redacted provider payload चाहिए, तो छोटी debugging session के लिए
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` जोड़ें।

## तकनीकी अवलोकन

इस पेज का बाकी हिस्सा runtime contract और implementation details का वर्णन करता है।
यह maintainers, tool exposure debug करने वाले Plugin authors, और high-risk
deployments validate करने वाले operators के लिए है।

## Runtime स्थिति

- Runtime: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Default state: disabled.
- Stability: experimental OpenClaw surface; Codex Code mode एक अलग stable
  Codex harness surface है।
- Target surface: generic OpenClaw agent runs.
- Security posture: model code hostile है।
- User-facing promise: code mode सक्षम करने से broad direct tool exposure पर
  कभी silent fallback नहीं होता।

## Scope

कोड मोड prepared run के लिए model-facing orchestration shape का मालिक है। यह
model selection, channel behavior, auth, tool policy, या tool implementations का
मालिक नहीं है।

In scope:

- model-visible `exec` और `wait` tool definitions
- hidden tool catalog construction
- JavaScript और TypeScript guest execution
- QuickJS-WASI worker runtime
- catalog search, schema describe, और tool call के लिए host callbacks
- suspended guest programs के लिए resumable state
- output, timeout, memory, pending-call, और snapshot limits
- nested tool calls के लिए telemetry और trajectory projection

Out of scope:

- provider-native remote code execution
- shell execution semantics
- existing tool authorization बदलना
- persistent user-authored scripts
- guest code में package manager, file, network, या module access
- Codex Code mode internals का direct reuse

remote Python sandboxes जैसे provider-owned tools अलग tools बने रहते हैं। देखें
[Code execution](/hi/tools/code-execution).

## Terms

**Code mode** वह OpenClaw runtime mode है जो सामान्य model tools को छिपाता है और
केवल `exec` और `wait` उजागर करता है।

**Guest runtime** QuickJS-WASI JavaScript VM है जो model code को evaluate करता है।

**Host bridge** guest code से वापस OpenClaw में जाने वाला narrow JSON-compatible
callback surface है।

**Catalog** normal tool policy, Plugin, MCP, और client-tool resolution के बाद
effective tools की run-scoped सूची है।

**Nested tool call** host bridge के जरिए guest code से किया गया tool call है।

**Snapshot** serialized QuickJS-WASI VM state है जिसे सहेजा जाता है ताकि `wait`
suspended code-mode run को continue कर सके।

## Configuration

`tools.codeMode.enabled` activation gate है। दूसरे code-mode fields set करने से
feature सक्षम नहीं होता।

Supported fields:

- `enabled`: boolean. Default `false`. केवल `true` होने पर code mode सक्षम करता है।
- `runtime`: `"quickjs-wasi"`. केवल supported runtime.
- `mode`: `"only"`. `exec` और `wait` उजागर करता है, normal model tools छिपाता है।
- `languages`: `"javascript"` और `"typescript"` की array. Default दोनों शामिल हैं।
- `timeoutMs`: एक `exec` या `wait` के लिए wall-clock cap. Default `10000`.
  Runtime clamp: `100` to `60000`.
- `memoryLimitBytes`: QuickJS heap cap. Default `67108864`. Runtime clamp:
  `1048576` to `1073741824`.
- `maxOutputBytes`: returned text, JSON, और logs के लिए cap. Default `65536`.
  Runtime clamp: `1024` to `10485760`.
- `maxSnapshotBytes`: serialized VM snapshots के लिए cap. Default `10485760`.
  Runtime clamp: `1024` to `268435456`.
- `maxPendingToolCalls`: concurrent nested tool calls के लिए cap. Default `16`.
  Runtime clamp: `1` to `128`.
- `snapshotTtlSeconds`: suspended VM को कितनी देर resume किया जा सकता है। Default `900`.
  Runtime clamp: `1` to `86400`.
- `searchDefaultLimit`: default hidden-catalog search result count. Default `8`.
  Runtime इसे `maxSearchLimit` तक clamp करता है।
- `maxSearchLimit`: maximum hidden-catalog search result count. Default `50`.
  Runtime clamp: `1` to `50`.

यदि code mode सक्षम है लेकिन QuickJS-WASI load नहीं हो सकता, तो OpenClaw उस run के
लिए fail closed करता है। यह fallback के रूप में normal tools को silently expose
नहीं करता।

## Activation

Code mode effective tool policy ज्ञात होने के बाद और final model request assemble
होने से पहले evaluate होता है।

Activation order:

1. agent, model, provider, sandbox, channel, sender, और run policy resolve करें।
2. effective OpenClaw tool list build करें।
3. eligible Plugin, MCP, और client tools जोड़ें।
4. allow और deny policy लागू करें।
5. यदि `tools.codeMode.enabled` false है, तो normal tool exposure के साथ continue करें।
6. यदि enabled है और run के लिए tools active हैं, तो effective tools को
   code-mode catalog में register करें।
7. model-visible tool list से सभी normal tools हटाएं।
8. code-mode `exec` और `wait` जोड़ें।

जिन runs में जानबूझकर कोई tools नहीं होते, जैसे raw model calls, `disableTools`,
या empty allowlist, वे code-mode surface को activate नहीं करते, भले ही config में
`tools.codeMode.enabled: true` हो।

code-mode catalog run-scoped है। इसे किसी दूसरे agent, session, sender, या run से
tools leak नहीं करने चाहिए।

## Model-visible tools

जब code mode सक्रिय होता है, तो model ठीक ये top-level tools देखता है:

- `exec`
- `wait`

बाकी सभी enabled tools model-facing tool list से छिपे रहते हैं और code-mode
catalog में registered होते हैं।

model को tool orchestration, data joining, loops, parallel nested calls, और
structured transformations के लिए `exec` का उपयोग करना चाहिए। model को `wait` का
उपयोग केवल तब करना चाहिए जब `exec` resumable `waiting` result लौटाए।

## `exec`

`exec` code-mode cell शुरू करता है और एक result लौटाता है। input code model
generated है और hostile माना जाना चाहिए।

Input:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Input rules:

- `code` या `command` में से एक non-empty होना चाहिए।
- `code` documented model-facing field है।
- `command` hook policies और trusted rewrites के लिए exec-compatible alias के रूप
  में स्वीकार किया जाता है; जब दोनों मौजूद हों, तो values match होनी चाहिए।
- Outer code-mode `exec` hook events में `toolKind: "code_mode_exec"` शामिल होता है और
  input language ज्ञात होने पर `toolInputKind: "javascript" | "typescript"` शामिल
  होता है, ताकि policies code-mode cells को उसी tool name वाले shell-style `exec`
  calls से अलग कर सकें।
- `language` default रूप से `"javascript"` होता है।
- यदि `language` `"typescript"` है, तो OpenClaw evaluation से पहले transpile करता है।
- `exec` v1 में `import`, `require`, dynamic import, और module-loader patterns को reject करता है।
- `exec` normal shell `exec` implementation को recursively expose नहीं करता।

Result:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` तब `waiting` लौटाता है जब QuickJS VM resumable state के साथ suspend होता है
जिसे अभी भी model-visible continuation चाहिए। result में `wait` के लिए `runId`
शामिल होता है। MCP namespace calls सहित namespace bridge calls उसी `exec`/`wait`
call के अंदर auto-drained होते हैं जब वे ready हों, इसलिए compact code block
`$api()` inspect कर सकता है और namespace await प्रति एक model tool call मजबूर किए
बिना MCP tool call कर सकता है।

`exec` `completed` केवल तब लौटाता है जब अतिथि VM के पास कोई लंबित काम नहीं होता और
OpenClaw का आउटपुट एडेप्टर चलने के बाद अंतिम मान JSON-संगत होता है।

## `wait`

`wait` निलंबित code-mode VM को जारी रखता है।

इनपुट:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

आउटपुट वही `CodeModeResult` union है जो `exec` लौटाता है।

`wait` इसलिए मौजूद है क्योंकि nested OpenClaw tools धीमे, interactive, approval
gated हो सकते हैं या partial updates stream कर सकते हैं। मॉडल को एक लंबी
`exec` call खुली रखने की जरूरत नहीं होनी चाहिए जब host बाहरी काम की प्रतीक्षा कर रहा हो।

QuickJS-WASI snapshot और restore v1 resume mechanism है:

1. `exec` code को completion, failure, या suspension तक evaluate करता है।
2. suspension पर, OpenClaw QuickJS VM का snapshot लेता है और pending host
   work रिकॉर्ड करता है।
3. जब pending work settle हो जाता है, `wait` VM snapshot restore करता है।
4. OpenClaw stable names द्वारा host callbacks को फिर से register करता है।
5. OpenClaw nested tool results को restored VM में deliver करता है।
6. OpenClaw QuickJS pending jobs को drain करता है।
7. `wait` `completed`, `failed`, या कोई दूसरा `waiting` result लौटाता है।

Snapshots runtime state हैं, user artifacts नहीं। वे size-limited, expired,
और उन्हें बनाने वाले run और session तक scoped होते हैं।

`wait` विफल होता है जब:

- `runId` अज्ञात हो।
- snapshot expire हो गया हो।
- parent run या session abort किया गया हो।
- caller उसी run/session scope में न हो।
- QuickJS-WASI restore विफल हो।
- restore करने से configured limits exceed हों।

## अतिथि runtime API

अतिथि runtime एक छोटा global API expose करता है:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` run-scoped catalog के लिए compact metadata है। इसमें default रूप से
full schemas शामिल नहीं होते।

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Full schema केवल मांग पर load किया जाता है:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Catalog helpers:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Convenience tool functions केवल unambiguous safe names के लिए install किए जाते हैं:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP catalog entries code mode में `tools.call(...)` या convenience
functions के माध्यम से callable नहीं हैं। वे केवल generated `MCP`
namespace के माध्यम से expose होते हैं। TypeScript-style declaration files
read-only `API` virtual file surface के माध्यम से उपलब्ध हैं, ताकि agents MCP signatures
को prompt में MCP schemas जोड़े बिना inspect कर सकें:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` MCP tool metadata से inferred compact declarations
लौटाता है:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Declaration files virtual हैं, workspace या state directory के अंतर्गत लिखी गई files नहीं।
हर code-mode `exec` call के लिए, OpenClaw run-scoped
tool catalog बनाता है, visible MCP entries रखता है, `mcp/index.d.ts` और हर visible server के लिए एक
`mcp/<server>.d.ts` declaration render करता है, और उस छोटे
read-only table को QuickJS worker में inject करता है। Guest code केवल `API` object देखता है:
`API.list(prefix?)` file metadata लौटाता है और `API.read(path)` selected
declaration content लौटाता है। Unknown paths और `.` / `..` segments reject किए जाते हैं।

इससे बड़े MCP schemas model prompt से बाहर रहते हैं। Agent `exec` tool description से सीखता है कि
virtual API मौजूद है, केवल जरूरी declaration file पढ़ता है,
और फिर एक object argument के साथ `MCP.<server>.<tool>()` call करता है।
जब agent को program के भीतर single-tool schema response चाहिए, तब
`MCP.<server>.$api()` inline fallback के रूप में उपलब्ध रहता है।

Guest runtime को host objects सीधे expose नहीं करने चाहिए। Inputs और outputs
explicit size caps के साथ JSON-compatible values के रूप में bridge cross करते हैं।

## आंतरिक namespaces

Internal namespaces code mode को ज्यादा model-visible tools जोड़े बिना एक concise domain API देते हैं।
Loader-owned integration `Issues`, `Fictions`, या `Calendar` जैसा namespace register कर सकता है;
guest code फिर QuickJS program के भीतर उस namespace को call करता है, जबकि OpenClaw model को
अब भी केवल `exec` और `wait` दिखाता है।

Namespaces अभी internal हैं। कोई public plugin SDK namespace API नहीं है:
external plugin namespaces को loader-owned contract चाहिए ताकि plugin identity,
installed manifests, auth state, और cached catalog descriptors उन plugin tools से drift न हों
जो namespace को back करते हैं। Core code mode केवल sandbox, serialization,
catalog gating, और bridge dispatch own करता है।

Guest code फिर direct global या `namespaces` map में से किसी एक का उपयोग कर सकता है:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Registry lifecycle

Namespace registry process-local है और namespace id से keyed है। एक typical
run यह path follow करता है:

1. कोई trusted loader `registerCodeModeNamespaceForPlugin(pluginId, registration)` call करता है।
2. Code mode run के लिए hidden `ToolSearchRuntime` बनाता है और उसका
   run-scoped catalog पढ़ता है।
3. `createCodeModeNamespaceRuntime(ctx, catalog)` केवल वे registrations रखता है
   जिनके सभी `requiredToolNames` visible हैं और उसी `pluginId` के owned हैं।
4. हर visible namespace current run के लिए `createScope(ctx)` call करता है। Scope को
   `agentId`, `sessionKey`, `sessionId`, `runId`, config, और abort state जैसे run context मिलते हैं।
5. Scope data plain descriptor में serialize किया जाता है और QuickJS में
   direct globals और `namespaces.<globalName>` के रूप में inject किया जाता है।
6. Guest calls worker bridge के माध्यम से suspend होती हैं, host पर namespace path resolve करती हैं,
   call को declared plugin-owned catalog tool पर map करती हैं, और
   `ToolSearchRuntime.call` के माध्यम से उस tool को execute करती हैं।
7. OpenClaw active `exec`/`wait` tool call के भीतर ready namespace bridge calls को auto-drain करता है।
   अगर timeout पर namespace work अब भी pending है या
   guest explicitly yield करता है, तो `wait` बाद में उसी namespace runtime को resume करता है।
8. Plugin rollback या uninstall `clearCodeModeNamespacesForPlugin(pluginId)` call करता है
   ताकि stale globals failed plugin load के बाद न बचें।

महत्वपूर्ण invariant: namespace calls catalog tool calls हैं। वे
`tools.call(...)` जैसे ही policy hooks, approvals, abort handling, telemetry, transcript projection,
और suspend/resume behavior का उपयोग करती हैं।

### Registration shape

Namespaces को उस integration से register करें जो backing tools own करता है। Scope को
छोटा रखें और केवल वे domain verbs expose करें जो declared catalog tools पर map होते हैं।

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` किसी scope member को
callable namespace function के रूप में mark करता है। वैकल्पिक `inputMapper` guest
arguments receive करता है और backing catalog tool के लिए input object लौटाता है। Input mapper न होने पर,
पहला guest argument उपयोग किया जाता है, या omit होने पर `{}`।

Raw host functions guest code चलने से पहले reject कर दिए जाते हैं:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Ownership और visibility

Namespace ownership registration caller के `pluginId` से bound है।
`requiredToolNames` visibility gate और ownership check दोनों है:

- हर required tool run catalog में मौजूद होना चाहिए
- हर required tool में `sourceName === pluginId` होना चाहिए
- कोई required tool absent हो या किसी दूसरे plugin द्वारा owned हो तो namespace hidden होता है
- हर callable path केवल `requiredToolNames` में named tool को target कर सकता है

यह किसी दूसरे plugin को same-named tool register करके namespace expose करने से रोकता है।
यह namespaces को ordinary agent policy के साथ aligned भी रखता है:
अगर run backing tools नहीं देख सकता, तो वह namespace नहीं देख सकता।

उदाहरण के लिए, GitHub namespace को GitHub-owned extension के पीछे रहना चाहिए जो
GitHub auth, REST या GraphQL clients, rate limits, write approvals, और
tests own करता हो। Core code mode को GitHub-specific APIs, token handling, या
provider policy embed नहीं करनी चाहिए।

### Scope serialization rules

`createScope(ctx)` JSON-compatible values, arrays, nested objects, और
`createCodeModeNamespaceTool(...)` call markers वाले plain object को return कर सकता है।
Host objects कभी सीधे QuickJS में enter नहीं करते।

Serializer reject करता है:

- raw functions
- circular object graphs
- unsafe path segments: `__proto__`, `constructor`, `prototype`, empty keys, या
  internal path separator वाली keys
- `globalName` values जो JavaScript identifiers नहीं हैं
- built-in code-mode globals जैसे `tools`, `namespaces`, `text`, `json`,
  `yield_control`, या `__openclaw*` के साथ `globalName` collisions

जो values JSON-serialized नहीं हो सकतीं, उन्हें bridge cross करने से पहले JSON-safe fallback
values में convert किया जाता है। Binary data, handles, sockets, clients, और
class instances ordinary catalog tools के पीछे रहने चाहिए।

### Prompts

Namespace `description` और optional `prompt` model-visible `exec` schema में केवल
तभी append किए जाते हैं जब namespace उस run के लिए visible हो। इनका उपयोग
सबसे छोटी useful surface सिखाने के लिए करें:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Prompts को namespace contract के बारे में रखें, auth setup, implementation
history, या unrelated plugin behavior के बारे में नहीं।

### Cleanup

नेमस्पेस प्रक्रिया-स्थानीय पंजीकरण हैं। जब स्वामी plugin
अक्षम, अनइंस्टॉल, या रोल बैक हो जाए, तो उन्हें हटाएँ:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

कोड-मोड cleanup plugin-स्वामित्व वाला है; प्रति-नेमस्पेस teardown handles रखने
के बजाय उसके lifecycle समाप्त होने पर plugin के namespace registrations साफ करें। Tests
cases के बीच registrations leak होने से बचने के लिए `clearCodeModeNamespacesForTest()` call
कर सकते हैं।

### परीक्षण checklist

Namespace changes को security boundary और guest behavior cover करना चाहिए:

- namespace prompt text केवल तभी दिखाई देता है जब backing tools visible हों
- किसी अन्य `sourceName` से same-named tools namespace expose नहीं करते
- raw scope functions reject किए जाते हैं
- forged namespace ids और forged paths reject किए जाते हैं
- callable paths undeclared tools को target नहीं कर सकते
- nested objects और shared references सही तरीके से serialize होते हैं
- namespace calls catalog tools के ज़रिए execute होते हैं और JSON-safe details return करते हैं
- failures को guest code द्वारा पकड़ा जा सकता है
- suspended namespace calls `wait` के ज़रिए resume होते हैं
- plugin rollback owning namespace registrations clear करता है

Namespaces generic `tools.search` / `tools.call` catalog के पूरक हैं। arbitrary
enabled OpenClaw, plugin, और client tools के लिए catalog का उपयोग करें; MCP tools के लिए
`MCP` का उपयोग करें; plugin-owned, documented domain APIs के लिए अन्य namespaces का
उपयोग करें जहाँ repeated schema lookups की तुलना में concise code अधिक reliable हो।

## Output API

`text(value)` human-readable output को `output` array में append करता है।

`json(value)` JSON-compatible serialization के बाद structured output item append करता है।

guest code का final returned value `completed` result में `value` बन जाता है।

Output item:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Output rules:

- output order guest calls से match करता है
- output `maxOutputBytes` द्वारा capped है
- non-serializable values plain strings या errors में convert किए जाते हैं
- binary values v1 में supported नहीं हैं
- images और files साधारण OpenClaw tools के ज़रिए travel करते हैं, code-mode bridge के
  ज़रिए नहीं

## Tool catalog

hidden catalog में effective policy filtering के बाद tools शामिल होते हैं:

1. OpenClaw core tools.
2. Bundled plugin tools.
3. External plugin tools.
4. MCP tools.
5. current run के लिए Client-provided tools.

Catalog ids एक run के भीतर stable होते हैं और equivalent tool
sets के across जहाँ संभव हो deterministic होते हैं।

Recommended id shape:

```text
<source>:<owner>:<tool-name>
```

Examples:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

catalog code-mode control tools omit करता है:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

यह recursion रोकता है और model-facing contract को narrow रखता है।

MCP entries run-scoped catalog में रहती हैं ताकि policy, approvals, hooks,
telemetry, transcript projection, और exact tool ids normal tool execution के साथ shared
रहें। guest-facing `ALL_TOOLS`, `tools.search(...)`, `tools.describe(...)`, और
`tools.call(...)` views MCP entries omit करते हैं। generated
`MCP.<server>.<tool>({ ...input })` namespace exact catalog id पर वापस resolve होता है
और फिर उसी executor path के ज़रिए dispatch करता है।

## Tool Search interaction

Code mode उन runs के लिए OpenClaw Tool Search model surface को supersede करता है जहाँ यह
active है।

जब `tools.codeMode.enabled` true हो और code mode activate हो:

- OpenClaw `tool_search_code`, `tool_search`, `tool_describe`,
  या `tool_call` को model-visible tools के रूप में expose नहीं करता।
- वही cataloging idea guest runtime के अंदर चला जाता है।
- guest runtime को compact `ALL_TOOLS` metadata और non-MCP tools के लिए search, describe,
  और call helpers मिलते हैं।
- MCP calls generated `MCP` namespace और उसके `$api()` headers का उपयोग करते हैं,
  `tools.call(...)` के बजाय।
- Nested calls उसी OpenClaw executor path के ज़रिए dispatch होते हैं जिसे Tool Search
  उपयोग करता है।

मौजूदा [Tool Search](/hi/tools/tool-search) page OpenClaw compact
catalog bridge का वर्णन करता है। Code mode उन runs के लिए generic OpenClaw alternative है
जो `exec` और `wait` उपयोग कर सकते हैं।

## Tool names and collisions

model-visible `exec` tool code-mode tool है। यदि normal OpenClaw
shell `exec` tool enabled है, तो वह model से hidden होता है और किसी भी अन्य tool की तरह
cataloged होता है।

guest runtime के अंदर:

- `tools.call("openclaw:core:exec", input)` shell exec tool को call कर सकता है यदि
  policy इसकी अनुमति देती है।
- `tools.exec(...)` केवल तभी installed होता है जब shell exec catalog entry का
  unambiguous safe name हो।
- code-mode `exec` tool `tools` के ज़रिए कभी recursively available नहीं होता।

यदि दो tools समान safe convenience name में normalize होते हैं, तो OpenClaw
convenience function omit करता है और `tools.call(id, input)` आवश्यक करता है।

## Nested tool execution

हर nested tool call host bridge को cross करता है और OpenClaw में फिर से enter करता है।

Nested execution preserve करता है:

- active agent id
- session id और session key
- sender और channel context
- sandbox policy
- approval policy
- plugin `before_tool_call` hooks
- abort signal
- streaming updates जहाँ available हों
- trajectory और audit events

Nested calls transcript में real tool calls के रूप में project होते हैं ताकि support bundles
दिखा सकें कि क्या हुआ। projection parent code-mode tool call
और nested tool id को identify करता है।

Parallel nested calls `maxPendingToolCalls` तक allowed हैं।

## Runtime state

हर code-mode run की state machine होती है:

- `running`: VM execute कर रहा है या nested calls in flight हैं।
- `waiting`: VM snapshot exists करता है और `wait` के साथ resume किया जा सकता है।
- `completed`: final value returned; snapshot deleted.
- `failed`: error returned; snapshot deleted.
- `expired`: snapshot या pending state ने retention exceed कर दिया; resume नहीं कर सकता।
- `aborted`: parent run/session cancelled; snapshot deleted.

State agent run, session, और tool call id द्वारा scoped है। किसी अलग run या session से
`wait` call fail होता है।

Snapshot storage bounded है:

- प्रति run maximum snapshot bytes
- प्रति process maximum live snapshots
- snapshot TTL
- run end पर cleanup
- Gateway shutdown पर cleanup जहाँ persistence supported नहीं है

## QuickJS-WASI runtime

OpenClaw owning package में `quickjs-wasi` को direct dependency के रूप में load करता है। runtime
proxy, PAC, या अन्य unrelated dependencies के लिए installed transitive copy पर rely नहीं करता।

Runtime responsibilities:

- QuickJS-WASI WebAssembly module compile या load करना
- प्रति code-mode run या resume एक isolated VM create करना
- stable names द्वारा host callbacks register करना
- memory और interrupt limits set करना
- JavaScript evaluate करना
- pending jobs drain करना
- suspended VM state snapshot करना
- `wait` के लिए snapshots restore करना
- terminal states के बाद VM handles और snapshots dispose करना

runtime worker में OpenClaw के main event loop के बाहर execute होता है। guest
infinite loop को Gateway process को indefinite रूप से block नहीं करना चाहिए।

## TypeScript

TypeScript support केवल source transform है:

- accepted input: एक TypeScript code string
- output: QuickJS-WASI द्वारा evaluated JavaScript string
- no typechecking
- no module resolution
- v1 में कोई `import` या `require` नहीं
- diagnostics `failed` results के रूप में returned होते हैं

TypeScript compiler केवल TypeScript cells के लिए lazily loaded होता है। Plain
JavaScript cells और disabled code mode compiler load नहीं करते।

जहाँ feasible हो, transform को useful line numbers preserve करने चाहिए।

## Security boundary

Model code hostile है। runtime defense in depth उपयोग करता है:

- QuickJS-WASI को main event loop के बाहर run करें
- `quickjs-wasi` को direct dependency के रूप में load करें, Codex या transitive
  package के ज़रिए नहीं
- guest में कोई filesystem, network, subprocess, module import, environment variables, या
  host global objects नहीं
- QuickJS memory और interrupt limits का उपयोग करें
- parent-process wall-clock timeout enforce करें
- output, snapshot, log, और pending-call caps enforce करें
- narrow JSON adapter के ज़रिए host bridge values serialize करें
- host errors को plain guest errors में convert करें, host realm objects में कभी नहीं
- timeout, abort, session end, या expiry पर snapshots drop करें
- `exec`, `wait`, और Tool Search control tools तक recursive access reject करें
- convenience-name collisions को catalog helpers shadow करने से रोकें

sandbox एक security layer है। high-risk deployments के लिए operators को अभी भी OS-level hardening
की आवश्यकता हो सकती है।

## Error codes

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

guest को returned errors plain data हैं। Host `Error` instances, stack
objects, prototypes, और host functions QuickJS में cross नहीं करते।

## Telemetry

Code mode report करता है:

- model को भेजे गए visible tool names
- hidden catalog size और source breakdown
- `exec` और `wait` counts
- nested search, describe, और call counts
- called nested tool ids
- timeout, memory, snapshot, और output cap failures
- snapshot lifecycle events

Telemetry में existing OpenClaw trajectory policy से परे secrets, raw environment values, या unredacted tool
inputs शामिल नहीं होने चाहिए।

## Debugging

जब code mode normal tool run से अलग behave करे, तो targeted model transport logging उपयोग करें:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

payload-shape debugging के लिए, `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` उपयोग करें।
यह model request का capped, redacted JSON snapshot log करता है; इसे केवल
debugging के दौरान उपयोग करना चाहिए क्योंकि prompts और message text अभी भी appear हो सकते हैं।

stream debugging के लिए, पहले पाँच redacted SSE events log करने के लिए `OPENCLAW_DEBUG_SSE=peek` उपयोग करें।
Code mode fail closed भी करता है यदि final provider payload में code-mode surface
activate होने के बाद exactly `exec` और `wait` न हों।

## Implementation layout

Implementation units:

- config contract: `tools.codeMode`
- catalog builder: effective tools to compact entries and id map
- model-surface adapter: visible tools को `exec` और `wait` से replace करना
- QuickJS-WASI runtime adapter: load, eval, snapshot, restore, dispose
- worker supervisor: timeout, abort, crash isolation
- bridge adapter: JSON-safe host callbacks और result delivery
- TypeScript transform adapter
- snapshot store: TTL, size caps, run/session scoping
- nested tool calls के लिए trajectory projection
- telemetry counters और diagnostics

implementation Tool Search से catalog और executor concepts reuse करता है, लेकिन
sandbox के रूप में `node:vm` child का उपयोग नहीं करता।

## Validation checklist

Code mode coverage को prove करना चाहिए:

- अक्षम कॉन्फ़िग मौजूदा टूल एक्सपोज़र को अपरिवर्तित छोड़ता है
- `enabled: true` के बिना ऑब्जेक्ट कॉन्फ़िग कोड मोड को अक्षम छोड़ता है
- सक्षम कॉन्फ़िग रन के लिए टूल सक्रिय होने पर मॉडल को केवल `exec` और `wait` एक्सपोज़ करता है
- कच्चे नो-टूल रन, `disableTools`, और खाली अलाउलिस्ट code-mode पेलोड प्रवर्तन को ट्रिगर नहीं करते
- सभी प्रभावी गैर-MCP टूल `ALL_TOOLS` में दिखाई देते हैं
- अस्वीकृत टूल `ALL_TOOLS` में दिखाई नहीं देते
- `tools.search`, `tools.describe`, और `tools.call` OpenClaw टूल के लिए काम करते हैं
- `API.list("mcp")` और `API.read("mcp/<server>.d.ts")` बिना bridge/tool call के TypeScript-शैली MCP घोषणाएँ एक्सपोज़ करते हैं
- MCP नेमस्पेस `$api()` स्कीमा के लिए इनलाइन फ़ॉलबैक के रूप में उपलब्ध रहता है
- MCP नेमस्पेस कॉल एक ऑब्जेक्ट इनपुट वाले दृश्यमान MCP टूल के लिए काम करते हैं, जबकि सीधे MCP कैटलॉग प्रविष्टियाँ `tools.*` से अनुपस्थित रहती हैं
- Tool Search नियंत्रण टूल मॉडल सतह और छिपे हुए कैटलॉग दोनों से छिपे रहते हैं
- नेस्टेड कॉल अनुमोदन और hook व्यवहार को सुरक्षित रखते हैं
- shell `exec` मॉडल से छिपा रहता है लेकिन अनुमति होने पर कैटलॉग id द्वारा कॉल किया जा सकता है
- रिकर्सिव code-mode `exec` और `wait` गेस्ट कोड से कॉल नहीं किए जा सकते
- TypeScript इनपुट को रूपांतरित और मूल्यांकित किया जाता है, बिना TypeScript को अक्षम या केवल-JavaScript पथों पर लोड किए
- `import`, `require`, filesystem, network, और environment access विफल होते हैं
- अनंत लूप टाइम आउट होते हैं और Gateway को ब्लॉक नहीं कर सकते
- मेमोरी कैप विफलताएँ गेस्ट VM को समाप्त कर देती हैं
- पूर्ण और निलंबित कॉल के लिए आउटपुट और स्नैपशॉट कैप लागू किए जाते हैं
- `wait` निलंबित स्नैपशॉट को फिर शुरू करता है और अंतिम मान लौटाता है
- समाप्त, निरस्त, गलत-सत्र, और अज्ञात `runId` मान विफल होते हैं
- transcript replay और persistence code-mode नियंत्रण कॉल को सुरक्षित रखते हैं
- transcript और telemetry नेस्टेड टूल कॉल को स्पष्ट रूप से दिखाते हैं

## E2E परीक्षण योजना

runtime बदलते समय इन्हें integration या end-to-end परीक्षणों के रूप में चलाएँ:

1. `tools.codeMode.enabled: false` के साथ Gateway शुरू करें।
2. छोटे direct tool set के साथ agent turn भेजें।
3. सत्यापित करें कि मॉडल-दृश्यमान टूल अपरिवर्तित हैं।
4. `tools.codeMode.enabled: true` के साथ पुनः शुरू करें।
5. OpenClaw, plugin, MCP, और client test tools के साथ agent turn भेजें।
6. सत्यापित करें कि मॉडल-दृश्यमान टूल सूची ठीक `exec`, `wait` है।
7. `exec` में, `ALL_TOOLS` पढ़ें और सत्यापित करें कि प्रभावी test tools मौजूद हैं।
8. `exec` में, `tools.search`, `tools.describe`, और `tools.call` के माध्यम से OpenClaw/plugin/client tools को कॉल करें।
9. `exec` में, `API.list("mcp")` और `API.read("mcp/<server>.d.ts")` कॉल करें और सत्यापित करें कि declaration files दृश्यमान MCP टूल का वर्णन करती हैं।
10. `exec` में, `MCP.<server>.<tool>({ ...input })` के माध्यम से MCP टूल कॉल करें और सत्यापित करें कि direct MCP catalog entries `ALL_TOOLS` और `tools.*` से अनुपस्थित हैं।
11. सत्यापित करें कि अस्वीकृत टूल अनुपस्थित हैं और अनुमानित id से कॉल नहीं किए जा सकते।
12. एक nested tool call शुरू करें जो `exec` द्वारा `waiting` लौटाने के बाद resolve होता है।
13. `wait` कॉल करें और सत्यापित करें कि पुनर्स्थापित VM को टूल परिणाम मिलता है।
14. सत्यापित करें कि अंतिम उत्तर में restore के बाद उत्पादित आउटपुट शामिल है।
15. सत्यापित करें कि timeout, abort, और snapshot expiry runtime state को साफ़ करते हैं।
16. trajectory निर्यात करें और सत्यापित करें कि nested calls पैरेंट code-mode call के अंतर्गत दिखाई देते हैं।

इस पृष्ठ में docs-only बदलावों के लिए भी `pnpm check:docs` चलाना चाहिए।

## संबंधित

- [Tool Search](/hi/tools/tool-search)
- [Agent runtimes](/hi/concepts/agent-runtimes)
- [Exec tool](/hi/tools/exec)
- [Code execution](/hi/tools/code-execution)
