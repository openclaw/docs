---
read_when:
    - 你想為代理程式執行啟用 OpenClaw 程式碼模式
    - 你需要說明為什麼程式碼模式不同於 Codex Code 模式
    - 你正在審查 exec/wait 契約、QuickJS-WASI 沙箱、TypeScript 轉換，或隱藏的工具目錄橋接器
    - 你正在新增或審閱內部程式碼模式命名空間註冊表整合
sidebarTitle: Code mode
summary: OpenClaw 程式碼模式：由 QuickJS-WASI 與隱藏的執行範圍工具目錄支援、可選擇啟用的 exec/wait 工具介面
title: 程式碼模式
x-i18n:
    generated_at: "2026-07-05T11:39:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: da4803ad63634fd0f58adf09d143032fc6740331dab4e0769fae32461812f08c
    source_path: reference/code-mode.md
    workflow: 16
---

程式碼模式是 OpenClaw agent-runtime 的實驗性、選擇啟用功能。啟用後，模型不再看到每個已啟用的工具結構描述；相反地，該次執行只會看到兩個工具：`exec` 和 `wait`。模型會撰寫一小段 JavaScript 或 TypeScript 程式，用來搜尋、描述並呼叫隱藏的工具目錄。

本頁說明的是 OpenClaw 程式碼模式，而不是 Codex 程式碼模式。這兩項功能共用名稱與相同的模型可見工具名稱（`exec`、`wait`），但它們是不同的實作：

- Codex 程式碼模式在 Codex coding harness 內執行。它的 `exec` 工具是
  freeform-grammar 工具：模型撰寫原始 JavaScript 原始碼（可選擇在前面加上
  `// @exec: {...}` pragma 行作為執行選項），並在 Deno/V8 runtime 中執行。
- OpenClaw 程式碼模式在通用 OpenClaw agent runtime 中執行，除非設定
  `tools.codeMode.enabled: true`，否則會停用。它的 `exec`
  工具接受 JSON `{ code, language }` payload，並在 QuickJS-WASI
  worker 中執行。

兩者都是 JavaScript 執行介面，不是 shell-command 介面。請把它們視為彼此獨立、實作不同，只是剛好公開同名 `exec`/`wait` 工具的功能。

## 功能

- 模型可見工具清單會精確變成 `exec` 和 `wait`。
- `exec` 會在隔離的 QuickJS-WASI worker thread 中評估模型產生的 JavaScript 或 TypeScript。
- 其他所有已啟用工具（OpenClaw core、外掛、MCP、client）都會從模型 prompt 中隱藏，並透過 `ALL_TOOLS`
  和 `tools` 在 guest 程式內公開。
- Guest 程式碼會搜尋隱藏目錄、描述工具的結構描述，並透過一般 agent turns 所使用的相同執行路徑呼叫工具（policy、
  approvals、hooks、telemetry 仍都會套用）。
- MCP 工具會分組在 `MCP` namespace 下；在程式碼模式中，這是呼叫它們唯一支援的方式。
- 當巢狀工具呼叫仍在等待時，`wait` 會恢復已暫停的 code-mode run。

程式碼模式只會改變面向模型的 orchestration 介面。它不會取代 tools、外掛 tools、MCP tools、auth、approval policy、channel
behavior 或 model selection。

## 使用原因

- 更小的 prompt 介面：providers 取得兩個 control tools，而不是數十或數百個完整 tool schemas。
- 更好的 orchestration：模型可以在單一 code cell 內使用 loops、joins、小型 transforms、conditional logic，以及 parallel nested tool calls。
- Provider 中立：適用於 OpenClaw、外掛、MCP 和 client tools，不依賴 provider-native code execution。
- 失敗關閉：如果已啟用程式碼模式但 QuickJS-WASI runtime 不可用，該次執行會失敗，而不是靜默退回到廣泛的直接工具公開。

最適合已啟用大型工具目錄的 agents，或模型需要在回答前搜尋、合併並呼叫多個工具的 workflows。

## 啟用

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

簡寫：

```json5
{
  tools: {
    codeMode: true,
  },
}
```

當省略 `tools.codeMode`、設為 `false`，或設為沒有 `enabled: true` 的物件時，程式碼模式會保持關閉。

如果你使用已設定 MCP servers 的沙箱化 agents，也請在沙箱工具 policy 中允許 bundled MCP 外掛，例如
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。請參閱
[設定 - tools 與自訂 providers](/zh-TW/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)。

設定明確限制以收緊界線：

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

若要在偵錯時確認模型 payload shape，請以目標式 logging 執行閘道：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

程式碼模式啟用時，記錄中的模型面向工具名稱應為 `exec` 和 `wait`。若要取得完整的 redacted provider payload，請在短暫的偵錯工作階段中加入
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 技術導覽

本頁其餘內容涵蓋 runtime contract 與 implementation details，對象是 maintainers、正在偵錯 tool exposure 的外掛 authors，以及正在驗證高風險 deployments 的 operators。

## Runtime 狀態

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Runtime             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| 預設狀態            | 已停用                                                                                      |
| 穩定性              | 實驗性 OpenClaw 介面（Codex 程式碼模式是獨立、穩定的 Codex harness 介面）                  |
| 目標介面            | 通用 OpenClaw agent runs                                                                    |
| 安全態勢            | model code 具有敵意                                                                         |
| 面向使用者的承諾    | 啟用程式碼模式絕不會靜默退回到廣泛的直接工具公開                                           |

## 範圍

程式碼模式擁有 prepared run 的模型面向 orchestration shape。它不擁有 model selection、channel behavior、auth、tool policy 或 tool
implementations。

範圍內：模型可見的 `exec`/`wait` definitions、hidden tool catalog construction、JavaScript/TypeScript guest execution、QuickJS-WASI worker
runtime、用於 search/describe/call 的 host callbacks、suspended guest programs 的 resumable state、output/timeout/memory/pending-call/snapshot limits，以及 nested tool calls 的 telemetry/trajectory projection。

範圍外：provider-native remote code execution、shell execution semantics、變更現有 tool authorization、persistent user-authored
scripts、guest code 中的 package manager/file/network/module access，以及直接重用 Codex 程式碼模式 internals。

Provider 擁有的 tools（例如 remote Python sandboxes）是獨立工具。請參閱
[程式碼執行](/zh-TW/tools/code-execution)。

## 詞彙

- **程式碼模式**：OpenClaw runtime mode，會隱藏一般模型 tools，且只公開 `exec` 和 `wait`。
- **Guest runtime**：評估模型程式碼的 QuickJS-WASI JavaScript VM。
- **Host bridge**：從 guest code 回到 OpenClaw 的窄版 JSON-compatible callback surface。
- **Catalog**：在一般 tool policy、外掛、MCP 和 client-tool resolution 後，run-scoped 的有效工具清單。
- **Nested tool call**：從 guest code 透過 host bridge 發出的 tool call。
- **Snapshot**：序列化的 QuickJS-WASI VM state，會儲存起來，讓 `wait` 可以繼續 suspended code-mode run。

## 設定

`tools.codeMode.enabled` 是 activation gate；設定其他欄位本身不會啟用此功能。

| 欄位                  | 預設值                         | 限制                                            |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | boolean；只有 `true` 會啟用程式碼模式          |
| `runtime`             | `"quickjs-wasi"`               | 唯一支援的值                                    |
| `mode`                | `"only"`                       | 公開 `exec`/`wait`，隱藏一般模型 tools         |
| `languages`           | `["javascript", "typescript"]` | 兩者的任意子集                                  |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | 限制到 `maxSearchLimit`                         |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

如果已啟用程式碼模式但 QuickJS-WASI 無法載入，OpenClaw 會對該次執行失敗關閉；它不會靜默公開一般 tools 作為 fallback。

## 啟用流程

程式碼模式會在有效工具 policy 已知之後、最終 model request 組裝之前評估：

1. 解析 agent、model、provider、sandbox、channel、sender 和 run
   policy。
2. 建立有效的 OpenClaw tool list，加入符合資格的外掛、MCP 和
   client tools。
3. 套用 allow/deny policy。
4. 如果 `tools.codeMode.enabled` 為 false，繼續使用一般工具公開。
5. 如果已啟用，且該次執行 tools 啟用，則在 code-mode catalog 中註冊有效工具。
6. 從模型可見清單移除所有一般 tools；加入 `exec` 和
   `wait`。

刻意沒有 tools 的執行（raw model calls、`disableTools: true`，或空的 `tools.allow` 清單）即使設定了
`tools.codeMode.enabled: true`，也不會啟用 code-mode surface。程式碼模式和 OpenClaw Tool
Search 在單次執行中互斥；如果程式碼模式啟用，Tool Search 的壓縮不會啟用。

Code-mode catalog 是 run-scoped，且不得洩漏另一個 agent、session、sender 或 run 的 tools。

## 模型可見工具

程式碼模式啟用時，模型只會看到 `exec` 和 `wait`。其他所有已啟用工具都會從模型面向工具清單中隱藏，並註冊到 code-mode catalog。

使用 `exec` 進行 tool orchestration、data joining、loops、parallel nested calls 和 structured transforms。只有在 `exec` 回傳可恢復的
`waiting` 結果時，才使用 `wait`。

## `exec`

`exec` 會啟動一個 code-mode cell，並回傳一個結果。輸入程式碼由模型產生，必須視為具有敵意。

輸入：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

規則：

- `code` 或 `command` 其中之一必須為非空。
- `code` 是文件記載的模型面向欄位。
- `command` 作為 hook policies 與 trusted rewrites 的 exec-compatible alias 被接受（一般 OpenClaw shell exec tool 也使用
  `command` 欄位）；兩者同時存在時，值必須相符。
- `language` 預設為 `"javascript"`；schema 會把它公開為 flat
  string enum（`"javascript" | "typescript"`），而不是 `oneOf`/`anyOf` union，
  因為有些 providers 會拒絕那些 shapes。
- 如果 `language` 是 `"typescript"`，OpenClaw 會先 transpile 再評估。
- `exec` 會拒絕 `import`、`require`、dynamic import，以及 module-loader
  patterns。
- `exec` 絕不會遞迴公開一般 shell `exec` implementation。
- 外層 code-mode `exec` hook events 會帶有 `toolKind: "code_mode_exec"` 和
  `toolInputKind: "javascript" | "typescript"`（已知時），讓 policies 可以區分 code-mode cells 與共用相同 tool name 的 shell-style
  `exec` calls。

結果：

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

`exec` 會在 QuickJS VM 以可恢復狀態暫停，且仍需要模型可見的接續時傳回 `waiting`；結果包含供 `wait` 使用的 `runId`。命名空間橋接呼叫，包括 MCP 命名空間呼叫，會在同一個 `exec`/`wait` 呼叫內於就緒時自動清空，因此精簡的程式碼區塊可以呼叫 MCP 工具，而不必讓每一次命名空間 await 都強制對應一次模型工具呼叫。

`exec` 只有在客體 VM 沒有待處理工作，且最終值在 OpenClaw 的輸出配接器執行後相容於 JSON 時，才會傳回 `completed`。

## `wait`

`wait` 會接續已暫停的程式碼模式 VM。

輸入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

輸出是與 `exec` 傳回相同的 `CodeModeResult` 聯集。

`wait` 存在的原因是巢狀 OpenClaw 工具可能很慢、具互動性、受核准閘門限制，或會串流部分更新；模型不應該需要在主機等待外部工作時，持續開著一個很長的 `exec` 呼叫。

QuickJS-WASI 快照/還原是恢復機制：

1. `exec` 會評估程式碼直到完成、失敗或暫停。
2. 暫停時，OpenClaw 會建立 QuickJS VM 快照並記錄待處理的主機工作。
3. 待處理工作穩定後，`wait` 會還原 VM 快照，並以穩定名稱重新註冊主機回呼。
4. OpenClaw 會將巢狀工具結果傳遞到已還原的 VM，並清空 QuickJS 待處理工作。
5. `wait` 會傳回 `completed`、`failed`，或另一個 `waiting` 結果。

快照是執行階段狀態，不是使用者成品：它們只存在於程序內映射中（不寫入資料庫或磁碟）、有大小限制、會過期，且作用範圍限於建立它們的執行與工作階段。

`wait` 會在下列情況失敗（作為 `failed` 結果）：

- `runId` 不明，或其快照已過期。
- 呼叫者不在已暫停執行的相同執行/工作階段作用範圍內。
- 該 `runId` 已有一個 `wait` 正在進行。
- QuickJS-WASI 還原失敗。
- 恢復會超過 `maxOutputBytes` 或 `maxSnapshotBytes`。

## 客體執行階段 API

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` 是執行作用範圍目錄的精簡中繼資料；預設不包含完整結構描述。

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

外掛工具會使用 `source: "openclaw"`，並將 `sourceName` 設為擁有該工具的外掛 id；沒有獨立的 `"plugin"` 來源值。`source: "mcp"` 只會用於 `sourceName`/`mcp` 中繼資料中的 MCP 項目（且會從 `ALL_TOOLS`/`tools.*` 中篩除，見下方）。

完整結構描述只會在需要時載入：

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

目錄輔助工具：

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

便利工具函式只會為明確無歧義的安全名稱安裝：

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP 目錄項目無法在程式碼模式中透過 `tools.call(...)` 或便利函式呼叫；它們只會透過產生的 `MCP` 命名空間公開。TypeScript 風格宣告檔可透過唯讀 `API` 虛擬檔案介面取得，因此代理程式可以檢查 MCP 簽章，而不必將 MCP 結構描述加入提示：

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

`API.read("mcp/<server>.d.ts")` 會傳回由 MCP 工具中繼資料推斷出的精簡宣告：

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

宣告檔是虛擬的，不會寫入工作區或狀態目錄。對於每一次程式碼模式 `exec` 呼叫，OpenClaw 會建立執行作用範圍的工具目錄、保留可見的 MCP 項目、轉譯 `mcp/index.d.ts` 加上每個可見伺服器一個 `mcp/<server>.d.ts`，並將該小型唯讀表注入 QuickJS worker。客體程式碼只會看到 `API` 物件：`API.list(prefix?)` 會傳回檔案中繼資料，而 `API.read(path)` 會傳回選定的宣告內容。未知路徑與 `.`/`..` 片段會被拒絕。

這可讓大型 MCP 結構描述不進入模型提示：代理程式會從 `exec` 工具描述得知虛擬 API 存在，只讀取需要的宣告檔，然後以一個物件引數呼叫 `MCP.<server>.<tool>()`。`MCP.<server>.$api()` 仍可作為程式內單一工具結構描述回應的內嵌備援。

客體執行階段永遠不會直接看到主機物件。輸入與輸出會以 JSON 相容值跨越橋接，並套用明確大小上限。

## 內部命名空間

內部命名空間讓程式碼模式能提供精簡的領域 API，而不必增加更多模型可見工具。由載入器擁有的整合會註冊例如 `Issues` 或 `Calendar` 的命名空間；客體程式碼接著可在 QuickJS 程式中呼叫該命名空間，而模型仍只會看到 `exec` 與 `wait`。

命名空間目前是內部功能。沒有公開的外掛 SDK 命名空間 API：外部外掛命名空間需要由載入器擁有的合約，讓外掛身分、已安裝 manifest、驗證狀態與快取的目錄描述元不會與支撐該命名空間的外掛工具發生偏移。核心程式碼模式只擁有沙箱、序列化、目錄閘門與橋接分派。

客體程式碼可以使用直接全域或 `namespaces` 映射：

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 登錄生命週期

命名空間登錄是程序本機的，並以命名空間 id 為鍵：

1. 受信任的載入器呼叫 `registerCodeModeNamespaceForPlugin(pluginId, registration)`。
2. 程式碼模式為該執行建立隱藏的 `ToolSearchRuntime`，並讀取其執行作用範圍目錄。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` 只保留其 `requiredToolNames` 全都可見且由相同 `pluginId` 擁有的註冊。
4. 每個可見命名空間都會為目前執行呼叫 `createScope(ctx)`，接收例如 `agentId`、`sessionKey`、`sessionId`、`runId`、設定與中止狀態等執行內容。
5. 作用範圍資料會被序列化為一般描述元，並以直接全域與 `namespaces.<globalName>` 注入 QuickJS。
6. 客體呼叫會透過 worker 橋接暫停，在主機解析命名空間路徑，將呼叫映射到宣告的外掛擁有目錄工具，並透過 `ToolSearchRuntime.callExactId` 執行該工具。
7. 就緒的命名空間橋接呼叫會在作用中的 `exec`/`wait` 呼叫內自動清空；如果命名空間工作在逾時時仍待處理，或客體明確讓出，`wait` 之後會恢復同一個命名空間執行階段。
8. 外掛回復或解除安裝會呼叫 `clearCodeModeNamespacesForPlugin(pluginId)`，讓過時的全域不會在外掛載入失敗後殘留。

命名空間呼叫就是目錄工具呼叫：它們會使用與 `tools.call(...)` 相同的政策掛鉤、核准、中止處理、遙測、逐字稿投影，以及暫停/恢復行為。

### 註冊形狀

從擁有後端工具的整合註冊命名空間。保持作用範圍小，只公開會映射到已宣告目錄工具的領域動詞。

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

`createCodeModeNamespaceTool(toolName, inputMapper)` 會將作用範圍成員標記為可呼叫的命名空間函式。選用的 `inputMapper` 會接收客體引數，並為後端目錄工具傳回輸入物件；若沒有提供，會使用第一個客體引數，省略時則使用 `{}`。

原始主機函式會在客體程式碼執行前被拒絕：

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### 擁有權與可見性

命名空間擁有權會繫結到註冊呼叫者的 `pluginId`。`requiredToolNames` 同時是可見性閘門與擁有權檢查：

- 每個必要工具都必須存在於執行目錄中
- 每個必要工具都必須有 `sourceName === pluginId`
- 當任何必要工具不存在或由另一個外掛擁有時，命名空間會被隱藏
- 每個可呼叫路徑只能以 `requiredToolNames` 中命名的工具為目標

這可防止另一個外掛透過註冊同名工具來公開命名空間，並讓命名空間與一般代理程式政策保持一致：如果該執行看不到後端工具，就看不到該命名空間。

例如，GitHub 命名空間應位於 GitHub 擁有的外掛後方，該外掛擁有 GitHub 驗證、REST/GraphQL 用戶端、速率限制、寫入核准與測試。核心程式碼模式不應嵌入 GitHub 專屬 API、權杖處理或供應者政策。

### 作用範圍序列化規則

`createScope(ctx)` 可以傳回包含 JSON 相容值、陣列、巢狀物件與 `createCodeModeNamespaceTool(...)` 呼叫標記的一般物件。主機物件永遠不會直接進入 QuickJS。

序列化器會拒絕：

- 原始函式
- 循環物件圖
- 不安全的路徑片段：`__proto__`、`constructor`、`prototype`、空鍵，或包含內部路徑分隔符的鍵
- 不是 JavaScript 識別符的 `globalName` 值
- 與內建程式碼模式全域（例如 `tools`、`namespaces`、`text`、`json`、`yield_control`、`MCP`、`API`、`ALL_TOOLS` 或 `__openclaw*`）衝突的 `globalName`

無法 JSON 序列化的值會在跨越橋接前轉換為 JSON 安全的備援值。二進位資料、控制代碼、通訊端、用戶端與類別實例應保留在一般目錄工具後方。

### 提示

命名空間的 `description` 和選用的 `prompt` 只有在該命名空間對該次執行可見時，才會附加到模型可見的 `exec` 結構描述。使用它們來教導最小但有用的介面：

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

提示應聚焦在命名空間合約，而不是驗證設定、實作歷史，或不相關的外掛行為。

### 清理

命名空間是程序本機註冊。當擁有它的外掛被停用、解除安裝或回滾時，請移除它們：

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

程式碼模式的清理由外掛擁有；在外掛生命週期結束時清除該外掛的命名空間註冊，而不是保留每個命名空間的拆除控制代碼。測試可以呼叫 `clearCodeModeNamespacesForTest()`，避免註冊洩漏到不同測試案例之間。

### 測試檢查清單

命名空間變更應涵蓋安全邊界與客體行為：

- 命名空間提示文字只在支援工具可見時出現
- 來自另一個 `sourceName` 的同名工具不會公開該命名空間
- 原始作用域函式會被拒絕
- 偽造的命名空間 ID 和偽造路徑會被拒絕
- 可呼叫路徑不能指向未宣告的工具
- 巢狀物件和共用參照能正確序列化
- 命名空間呼叫會透過目錄工具執行並回傳 JSON 安全的詳細資料
- 失敗可以由客體程式碼捕捉
- 暫停的命名空間呼叫會透過 `wait` 恢復
- 外掛回滾會清除擁有者的命名空間註冊

命名空間補充通用的 `tools.search`/`tools.call` 目錄：對任意已啟用的 OpenClaw、外掛與用戶端工具使用目錄；對 MCP 工具使用 `MCP`；對外掛擁有且已文件化的領域 API 使用其他命名空間，因為簡潔程式碼比重複查詢結構描述更可靠。

## 輸出 API

- `text(value)` 會將人類可讀輸出附加到 `output` 陣列。
- `json(value)` 會在 JSON 相容序列化後附加結構化輸出項目。
- 客體程式碼的最終回傳值會成為 `completed` 結果中的 `value`。

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

規則：輸出順序符合客體呼叫；輸出受 `maxOutputBytes` 限制；不可序列化的值會轉換為純字串或錯誤；不支援二進位值。圖片和檔案會透過一般 OpenClaw 工具傳遞，而不是透過程式碼模式橋接。

## 工具目錄

隱藏目錄會在有效政策篩選後包含工具，順序如下：OpenClaw 核心工具、內建外掛工具、外部外掛工具、MCP 工具，接著是目前執行的用戶端提供工具。

目錄 ID 在單次執行內穩定，且在可行情況下，對等效工具集合具備決定性。實際形狀：

```text
<source>:<owner>:<tool-name>
```

其中 `<source>` 是 `openclaw`、`mcp` 或 `client`（外掛工具使用 `openclaw`，並以外掛 ID 作為 `<owner>`；核心工具使用 `openclaw:core:*`）。範例：

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目錄會省略程式碼模式控制工具：`exec`、`wait`、`tool_search_code`、`tool_search`、`tool_describe`、`tool_call`。這能防止遞迴，並保持面向模型的合約狹窄。

MCP 項目會留在執行範圍的目錄中，因此政策、核准、鉤子、遙測、逐字稿投影和精確工具 ID 會與一般工具執行共用。面向客體的 `ALL_TOOLS`、`tools.search(...)`、`tools.describe(...)` 和 `tools.call(...)` 檢視會省略 MCP 項目。產生的 `MCP.<server>.<tool>({ ...input })` 命名空間會解析回精確目錄 ID，並透過相同的執行器路徑分派。

## 工具搜尋互動

在程式碼模式啟用的執行中，程式碼模式會取代 OpenClaw 工具搜尋模型介面。

當 `tools.codeMode.enabled` 為 true 且程式碼模式啟動時：

- OpenClaw 不會將 `tool_search_code`、`tool_search`、`tool_describe` 或 `tool_call` 作為模型可見工具公開。
- 相同的目錄化概念會移入客體執行階段。
- 客體執行階段會接收精簡的 `ALL_TOOLS` 中繼資料，以及非 MCP 工具的搜尋/描述/呼叫輔助函式。
- MCP 呼叫會使用產生的 `MCP` 命名空間及其 `$api()` 標頭，而不是 `tools.call(...)`。
- 巢狀呼叫會透過工具搜尋所使用的相同 OpenClaw 執行器路徑分派。

請參閱[工具搜尋](/zh-TW/tools/tool-search)，了解 OpenClaw 的精簡目錄橋接；在有效執行中，程式碼模式會取代它。

## 工具名稱與衝突

模型可見的 `exec` 工具是程式碼模式工具。如果啟用一般 OpenClaw shell `exec` 工具，它會對模型隱藏，並像其他工具一樣被編入目錄。

在客體執行階段內：

- 如果政策允許，`tools.call("openclaw:core:exec", input)` 可以呼叫 shell exec 工具。
- 只有在 shell exec 目錄項目具有明確安全名稱時，才會安裝 `tools.exec(...)`。
- 程式碼模式的 `exec` 工具永遠不會透過 `tools` 遞迴可用。

如果兩個工具正規化成相同的安全便利名稱，OpenClaw 會省略便利函式，並要求使用 `tools.call(id, input)`。

## 巢狀工具執行

每個巢狀工具呼叫都會跨越主機橋接並重新進入 OpenClaw，同時保留：作用中代理 ID、工作階段 ID 與金鑰、傳送者與通道脈絡、沙箱政策、核准政策、外掛 `before_tool_call` 鉤子、中止訊號、可用時的串流更新，以及軌跡/稽核事件。

巢狀呼叫會作為真實工具呼叫投影到逐字稿中，因此支援套件會顯示發生了什麼，且投影會識別父層程式碼模式工具呼叫與巢狀工具 ID。

平行巢狀呼叫允許最多 `maxPendingToolCalls` 個。

## 執行與快照生命週期

每次程式碼模式執行都會在以 `runId` 為鍵的程序內映射中追蹤（不持久化到磁碟或資料庫）。`exec`/`wait` 會回傳三種結果狀態之一：`completed`、`waiting` 或 `failed`。

- `waiting` 結果會儲存 QuickJS 快照、待處理橋接請求和作用域中繼資料（代理執行 ID、工作階段 ID/金鑰），直到 `wait` 恢復它或它過期。
- 過期、錯誤工作階段、錯誤執行，以及未知/已在恢復中的 `runId` 值不會產生不同的終端狀態；它們會呈現為 `failed` 結果（`code: "invalid_input"`），並帶有像是 `code mode run is unavailable or expired.` 或 `code mode run belongs to a different session.` 的訊息。
- 執行的快照一旦穩定為 `completed` 或 `failed`，就會從映射中移除；或在 Gateway 關閉時被丟棄（依設計，沒有任何內容會在重新啟動後保留：這是暫態執行階段狀態）。
- OpenClaw 會限制每個程序可同時暫停的執行數量（64），並在超過該上限時以 `too many suspended code mode runs.` 拒絕新的暫停。

快照儲存受每次執行的 `maxSnapshotBytes`、上述每程序暫停執行上限，以及 `snapshotTtlSeconds` 限制。

## QuickJS-WASI 執行階段

OpenClaw 會在擁有套件中將 `quickjs-wasi` 載入為直接相依項；它不依賴為不相關相依項安裝的傳遞副本。

執行階段職責：編譯/載入 QuickJS-WASI WebAssembly 模組；為每次程式碼模式執行或恢復建立一個隔離 VM；以穩定名稱註冊主機回呼；設定記憶體與中斷限制；評估 JavaScript；清空待處理工作；快照暫停的 VM 狀態；為 `wait` 還原快照；在終端狀態後釋放 VM 控制代碼與快照。

執行階段在 Node.js worker 執行緒中執行，位於 OpenClaw 主事件迴圈之外。客體無窮迴圈不得無限期阻塞 Gateway 程序；worker 的中斷處理常式會在不依賴客體程式碼配合的情況下強制執行牆鐘逾時。

## TypeScript

TypeScript 支援只是來源轉換：接受的輸入是一個 TypeScript 程式碼字串；輸出是由 QuickJS-WASI 評估的 JavaScript 字串。沒有型別檢查、沒有模組解析，也沒有 `import`/`require`。診斷會作為 `failed` 結果回傳。

TypeScript 編譯器只會對 TypeScript 儲存格延遲載入；純 JavaScript 儲存格和停用的程式碼模式永遠不會載入它。

## 安全邊界

模型程式碼是敵對的。執行階段採用深度防禦：

- 在主事件迴圈之外的 worker 執行緒中執行 QuickJS-WASI
- 將 `quickjs-wasi` 載入為直接相依項，而不是透過 Codex 或傳遞套件
- 客體中沒有檔案系統、網路、子程序、模組匯入、環境變數或主機全域物件
- 使用 QuickJS 記憶體與中斷限制，加上父程序牆鐘逾時
- 強制執行輸出、快照、日誌和待處理呼叫上限
- 透過狹窄的 JSON 轉接器序列化主機橋接值
- 將主機錯誤轉換為純客體錯誤，絕不傳遞主機領域物件
- 在逾時、中止、工作階段結束或過期時丟棄快照
- 拒絕對 `exec`、`wait` 和工具搜尋控制工具的遞迴存取
- 防止便利名稱衝突遮蔽目錄輔助函式

沙箱是一層安全機制；對於高風險部署，操作者仍可能需要作業系統層級的強化。

## 錯誤碼

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` 涵蓋錯誤的 `exec`/`wait` 引數、已停用語言、被拒絕的模組存取、TypeScript 轉換失敗、未知/過期/錯誤作用域的 `runId` 值，以及過多暫停執行。`runtime_unavailable` 涵蓋無法啟動或以非零狀態結束的 QuickJS worker。

回傳給客體的錯誤是純資料；主機 `Error` 執行個體、堆疊物件、原型和主機函式不會跨入 QuickJS。

## 遙測

每個結果的 `telemetry` 欄位會回報：隱藏目錄大小和來源分解（`openclaw`/`mcp`/`client` 計數）、該執行目錄的累計搜尋/描述/呼叫計數，以及模型可見工具名稱（`exec`、`wait`）。

遙測不得包含秘密、原始環境值，或超出現有 OpenClaw 軌跡政策的未遮蔽工具輸入。

## 偵錯

當程式碼模式的行為與一般工具執行不同時，使用目標式模型傳輸日誌：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

若要偵錯酬載形狀，請使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。這會記錄有上限且已遮蔽的模型請求 JSON 快照；請只在偵錯時使用，因為提示和訊息文字仍可能出現。

若要偵錯串流，請使用 `OPENCLAW_DEBUG_SSE=peek` 記錄前五個已遮蔽 SSE 事件。如果在程式碼模式介面已啟動後，最終供應商酬載未精確包含 `exec` 和 `wait`，程式碼模式也會封閉失敗。

## 實作配置

- 設定合約：`tools.codeMode`
- 目錄建構器：將有效工具轉為精簡項目與 ID 映射
- 模型介面轉接器：以 `exec` 和 `wait` 取代可見工具
- QuickJS-WASI 執行階段轉接器：載入、評估、快照、還原、釋放
- worker 監督器：逾時、中止、當機隔離
- 橋接轉接器：JSON 安全的主機回呼與結果傳遞
- TypeScript 轉換轉接器
- 快照儲存：TTL、大小上限、執行/工作階段作用域
- 巢狀工具呼叫的軌跡投影
- 遙測計數器與診斷

實作會重用工具搜尋的目錄與執行器概念，但不使用 `node:vm` 子項作為沙箱。

## 驗證檢查清單

程式碼模式涵蓋範圍應證明：

- 停用的設定會讓既有工具暴露保持不變
- 沒有 `enabled: true` 的物件設定會讓程式碼模式維持停用
- 啟用的設定只會在工具於該次執行中處於作用中時，向模型暴露 `exec` 和 `wait`
- 原始無工具執行、`disableTools` 和空白允許清單不會觸發程式碼模式酬載強制檢查
- 所有有效的非 MCP 工具都會出現在 `ALL_TOOLS`
- 被拒絕的工具不會出現在 `ALL_TOOLS`
- `tools.search`、`tools.describe` 和 `tools.call` 可用於 OpenClaw 工具
- `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")` 會暴露 TypeScript 風格的 MCP 宣告，而不需橋接／工具呼叫
- MCP 命名空間 `$api()` 仍可作為結構描述的行內後援使用
- MCP 命名空間呼叫可用於具有一個物件輸入的可見 MCP 工具，而直接 MCP 目錄項目不會出現在 `tools.*`
- Tool Search 控制工具會同時從模型表面與隱藏目錄中隱藏
- 巢狀呼叫會保留核准與 hook 行為
- shell `exec` 會從模型中隱藏，但在允許時可透過目錄 id 呼叫
- 遞迴的程式碼模式 `exec` 和 `wait` 無法從客體程式碼呼叫
- TypeScript 輸入會被轉換並評估，而不會在停用或僅 JavaScript 的路徑上載入 TypeScript
- `import`、`require`、檔案系統、網路和環境存取會失敗
- 無限迴圈會逾時，且無法阻塞閘道
- 記憶體上限失敗會終止客體 VM
- 輸出與快照上限會套用於已完成與已暫停的呼叫
- `wait` 會恢復已暫停的快照並回傳最終值
- 已過期、已中止、錯誤工作階段和未知的 `runId` 值會失敗
- 轉錄重播與持久化會保留程式碼模式控制呼叫
- 轉錄與遙測會清楚顯示巢狀工具呼叫

## E2E 測試計畫

在變更執行階段時，將這些作為整合或端對端測試執行：

1. 以 `tools.codeMode.enabled: false` 啟動閘道。
2. 以一組小型直接工具傳送代理回合。
3. 斷言模型可見工具保持不變。
4. 以 `tools.codeMode.enabled: true` 重新啟動。
5. 以 OpenClaw、外掛、MCP 和用戶端測試工具傳送代理回合。
6. 斷言模型可見工具清單正好是 `exec`、`wait`。
7. 在 `exec` 中讀取 `ALL_TOOLS`，並斷言有效的測試工具存在。
8. 在 `exec` 中透過 `tools.search`、`tools.describe` 和 `tools.call` 呼叫 OpenClaw／外掛／用戶端工具。
9. 在 `exec` 中呼叫 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，並斷言宣告檔描述可見的 MCP 工具。
10. 在 `exec` 中透過 `MCP.<server>.<tool>({ ...input })` 呼叫 MCP 工具，並斷言直接 MCP 目錄項目不存在於 `ALL_TOOLS` 和 `tools.*`。
11. 斷言被拒絕的工具不存在，且無法透過猜測的 id 呼叫。
12. 啟動一個在 `exec` 回傳 `waiting` 後才解析的巢狀工具呼叫。
13. 呼叫 `wait`，並斷言已還原的 VM 收到工具結果。
14. 斷言最終答案包含還原後產生的輸出。
15. 斷言逾時、中止和快照到期會清理執行階段狀態。
16. 匯出軌跡，並斷言巢狀呼叫在父層程式碼模式呼叫下可見。

此頁面的純文件變更仍應執行 `pnpm check:docs`。

## 相關

- [Tool Search](/zh-TW/tools/tool-search)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [Exec 工具](/zh-TW/tools/exec)
- [程式碼執行](/zh-TW/tools/code-execution)
