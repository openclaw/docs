---
read_when:
    - 你想為代理執行啟用 OpenClaw 程式碼模式
    - 你需要說明為什麼程式碼模式不同於 Codex Code 模式
    - 你正在審查 exec/wait 合約、QuickJS-WASI 沙盒、TypeScript 轉換，或隱藏工具目錄橋接
    - 你正在新增或審查內部 code-mode 命名空間登錄整合
sidebarTitle: Code mode
summary: OpenClaw 程式碼模式：由 QuickJS-WASI 和隱藏的執行範圍工具目錄支援的選用 exec/wait 工具介面
title: 程式碼模式
x-i18n:
    generated_at: "2026-06-27T19:59:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Code mode 是 OpenClaw agent-runtime 的實驗性功能。預設為關閉。啟用後，OpenClaw 會變更模型在單次執行中看到的內容：不再直接公開每個已啟用的工具結構描述，而是讓模型只看到 `exec` 和 `wait`。

本頁記錄 OpenClaw code mode。它不是 Codex Code mode。這兩個功能共用名稱，但由不同 runtime 實作，並公開不同的 `exec` 合約：

- Codex Code Mode 會在 Codex app-server threads 中啟用，除非受限制的工具政策停用原生 code mode。它在 Codex coding harness 中執行，模型會透過 `exec.command` 合約撰寫 shell 指令。
- OpenClaw code mode 預設停用，除非設定 `tools.codeMode.enabled: true`。它在 OpenClaw 通用代理 runtime 中執行，模型會透過 `exec.code` 合約撰寫 JavaScript 或 TypeScript 程式。

Codex Code Mode 和 Codex 原生動態工具搜尋是穩定的 Codex harness surface。OpenClaw code mode 是 OpenClaw 擁有的實驗性工具 surface adapter，供通用 OpenClaw 執行使用。它使用 `quickjs-wasi`、隱藏的 OpenClaw 工具目錄，以及一般 OpenClaw 工具執行器。

## 這是什麼？

OpenClaw code mode 讓模型撰寫一小段 JavaScript 或 TypeScript 程式，而不是直接從一長串工具中選擇。

啟用 code mode 時：

- 模型可見的工具清單正好是 `exec` 和 `wait`。
- `exec` 會在受限的 QuickJS-WASI worker 中評估模型產生的 JavaScript 或 TypeScript。
- 一般 OpenClaw 工具會從模型提示中隱藏，並透過 `ALL_TOOLS` 和 `tools` 在 guest 程式內公開。
- Guest code 可以搜尋隱藏目錄、描述工具，並透過一般代理回合使用的同一條 OpenClaw 執行路徑呼叫工具。
- MCP 工具會分組在 `MCP` 命名空間下。在 code mode 中，此命名空間是呼叫 MCP 工具唯一支援的方式。
- 當巢狀工具呼叫仍在等待時，`wait` 會恢復暫停的 code-mode 執行。

重要區別：code mode 會變更面向模型的 orchestration surface。它不會取代 OpenClaw 工具、外掛工具、MCP 工具、auth、核准政策、channel 行為或模型選擇。

## 為什麼這很好？

Code mode 讓大型工具目錄更容易供模型使用。

- 較小的提示 surface：供應商會收到兩個控制工具，而不是數十或數百個完整工具結構描述。
- 更好的 orchestration：模型可以在單一 code cell 內使用迴圈、join、小型轉換、條件邏輯，以及平行巢狀工具呼叫。
- 供應商中立：它可用於 OpenClaw、外掛、MCP 和 client tools，不依賴供應商原生程式碼執行。
- 既有政策持續生效：巢狀工具呼叫仍會經過 OpenClaw 政策、核准、hooks、session context 和稽核路徑。
- 明確的失敗模式：當 code mode 明確啟用且 runtime 無法使用時，OpenClaw 會 fail closed，而不是退回到廣泛直接公開工具。

Code mode 對於已啟用大型工具目錄的代理，或模型需要反覆搜尋、組合並呼叫工具後才產生答案的工作流程，特別有用。

## 如何啟用

將 `tools.codeMode.enabled: true` 加入代理或 runtime 設定：

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

也接受簡寫：

```json5
{
  tools: {
    codeMode: true,
  },
}
```

當省略 `tools.codeMode`、設為 `false`，或物件未包含 `enabled: true` 時，code mode 會維持關閉。

當你使用已設定 MCP servers 的沙箱代理時，也請確認沙箱工具政策允許 bundled MCP 外掛，例如使用 `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。請參閱[設定 - 工具與自訂供應商](/zh-TW/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)。

需要更嚴格界限時，請使用明確限制：

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

若要在偵錯時確認模型 payload 形狀，請以目標式記錄執行閘道：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

啟用 code mode 時，記錄的面向模型工具名稱應為 `exec` 和 `wait`。如果需要遮蔽後的供應商 payload，請在短暫偵錯期間加入 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 技術導覽

本頁其餘部分說明 runtime 合約和實作細節。它適用於維護者、正在偵錯工具公開的外掛作者，以及驗證高風險部署的操作者。

## Runtime 狀態

- Runtime：[`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)。
- 預設狀態：停用。
- 穩定性：實驗性 OpenClaw surface；Codex Code mode 是獨立的穩定 Codex harness surface。
- 目標 surface：通用 OpenClaw agent runs。
- 安全態勢：模型程式碼具敵意。
- 面向使用者承諾：啟用 code mode 絕不會靜默退回到廣泛直接公開工具。

## 範圍

Code mode 擁有已準備執行中面向模型的 orchestration 形狀。它不擁有模型選擇、channel 行為、auth、工具政策或工具實作。

範圍內：

- 模型可見的 `exec` 和 `wait` 工具定義
- 隱藏工具目錄建構
- JavaScript 和 TypeScript guest 執行
- QuickJS-WASI worker runtime
- 用於目錄搜尋、結構描述說明和工具呼叫的 host callbacks
- 暫停 guest 程式的可恢復狀態
- 輸出、逾時、記憶體、等待中呼叫和快照限制
- 巢狀工具呼叫的 telemetry 和 trajectory projection

範圍外：

- 供應商原生遠端程式碼執行
- shell 執行語意
- 變更既有工具授權
- 持久化的使用者自訂指令碼
- guest code 中的 package manager、檔案、網路或 module 存取
- 直接重用 Codex Code mode 內部實作

供應商擁有的工具，例如遠端 Python sandboxes，仍然是獨立工具。請參閱[程式碼執行](/zh-TW/tools/code-execution)。

## 術語

**Code mode** 是 OpenClaw runtime 模式，會隱藏一般模型工具並只公開 `exec` 和 `wait`。

**Guest runtime** 是評估模型程式碼的 QuickJS-WASI JavaScript VM。

**Host bridge** 是從 guest code 回到 OpenClaw 的狹窄 JSON 相容 callback surface。

**Catalog** 是在一般工具政策、外掛、MCP 和 client-tool resolution 後，執行範圍內的有效工具清單。

**Nested tool call** 是從 guest code 透過 host bridge 發出的工具呼叫。

**Snapshot** 是序列化的 QuickJS-WASI VM 狀態，會被儲存，讓 `wait` 能繼續暫停的 code-mode 執行。

## 設定

`tools.codeMode.enabled` 是啟用閘門。設定其他 code-mode 欄位不會啟用此功能。

支援欄位：

- `enabled`：boolean。預設 `false`。只有在 `true` 時才啟用 code mode。
- `runtime`：`"quickjs-wasi"`。唯一支援的 runtime。
- `mode`：`"only"`。公開 `exec` 和 `wait`，隱藏一般模型工具。
- `languages`：`"javascript"` 和 `"typescript"` 的陣列。預設包含兩者。
- `timeoutMs`：單次 `exec` 或 `wait` 的 wall-clock 上限。預設 `10000`。Runtime clamp：`100` 到 `60000`。
- `memoryLimitBytes`：QuickJS heap 上限。預設 `67108864`。Runtime clamp：`1048576` 到 `1073741824`。
- `maxOutputBytes`：回傳文字、JSON 和 logs 的上限。預設 `65536`。Runtime clamp：`1024` 到 `10485760`。
- `maxSnapshotBytes`：序列化 VM snapshots 的上限。預設 `10485760`。Runtime clamp：`1024` 到 `268435456`。
- `maxPendingToolCalls`：並行巢狀工具呼叫上限。預設 `16`。Runtime clamp：`1` 到 `128`。
- `snapshotTtlSeconds`：暫停 VM 可恢復的時間長度。預設 `900`。Runtime clamp：`1` 到 `86400`。
- `searchDefaultLimit`：預設隱藏目錄搜尋結果數。預設 `8`。Runtime 會將其 clamp 到 `maxSearchLimit`。
- `maxSearchLimit`：最大隱藏目錄搜尋結果數。預設 `50`。Runtime clamp：`1` 到 `50`。

如果已啟用 code mode 但 QuickJS-WASI 無法載入，OpenClaw 會針對該次執行 fail closed。它不會靜默公開一般工具作為 fallback。

## 啟用

Code mode 會在有效工具政策已知後、最終模型請求組裝前進行評估。

啟用順序：

1. 解析代理、模型、供應商、沙箱、channel、sender 和執行政策。
2. 建立有效的 OpenClaw 工具清單。
3. 加入符合資格的外掛、MCP 和 client tools。
4. 套用 allow 和 deny policy。
5. 如果 `tools.codeMode.enabled` 為 false，繼續一般工具公開。
6. 如果已啟用且工具在本次執行中為 active，將有效工具註冊到 code-mode catalog。
7. 從模型可見工具清單移除所有一般工具。
8. 加入 code-mode `exec` 和 `wait`。

有意不使用工具的執行，例如 raw model calls、`disableTools` 或空 allowlist，即使設定包含 `tools.codeMode.enabled: true`，也不會啟用 code-mode surface。

Code-mode catalog 以執行為範圍。它不得洩漏來自其他代理、session、sender 或執行的工具。

## 模型可見工具

啟用 code mode 時，模型正好會看到這些頂層工具：

- `exec`
- `wait`

所有其他已啟用工具都會從面向模型的工具清單中隱藏，並註冊到 code-mode catalog。

模型應使用 `exec` 進行工具 orchestration、資料 joining、迴圈、平行巢狀呼叫和結構化轉換。模型只有在 `exec` 回傳可恢復的 `waiting` 結果時，才應使用 `wait`。

## `exec`

`exec` 會啟動一個 code-mode cell 並回傳一個結果。輸入程式碼由模型產生，必須視為具敵意。

輸入：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

輸入規則：

- `code` 或 `command` 其中之一必須非空。
- `code` 是已記錄的面向模型欄位。
- `command` 可作為 exec-compatible alias，用於 hook policies 和 trusted rewrites；兩者同時存在時，值必須相符。
- 外層 code-mode `exec` hook events 會包含 `toolKind: "code_mode_exec"`，並在輸入語言已知時包含 `toolInputKind: "javascript" | "typescript"`，讓 policies 可以區分 code-mode cells 與共用相同工具名稱的 shell-style `exec` calls。
- `language` 預設為 `"javascript"`。
- 如果 `language` 是 `"typescript"`，OpenClaw 會在評估前轉譯。
- `exec` 在 v1 中會拒絕 `import`、`require`、dynamic import 和 module-loader patterns。
- `exec` 不會遞迴公開一般 shell `exec` 實作。

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

當 QuickJS VM 以可恢復狀態暫停，且仍需要模型可見的 continuation 時，`exec` 會回傳 `waiting`。結果包含供 `wait` 使用的 `runId`。命名空間 bridge 呼叫，包括 MCP 命名空間呼叫，會在同一個 `exec`/`wait` 呼叫內於 ready 時自動 drain，因此精簡的 code block 可以檢查 `$api()` 並呼叫 MCP 工具，而不必強制每個 namespace await 都產生一次模型工具呼叫。

`exec` 只有在客體 VM 沒有待處理工作，且最終值在 OpenClaw 的輸出配接器執行後與 JSON 相容時，才會回傳 `completed`。

## `wait`

`wait` 會繼續已暫停的程式碼模式 VM。

輸入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

輸出與 `exec` 回傳的 `CodeModeResult` 聯集相同。

`wait` 存在的原因是巢狀 OpenClaw 工具可能很慢、具互動性、受核准閘門限制，或會串流部分更新。模型不應需要在主機等待外部工作時，保持一個長時間的 `exec` 呼叫開啟。

QuickJS-WASI 快照與還原是 v1 的續接機制：

1. `exec` 會評估程式碼，直到完成、失敗或暫停。
2. 暫停時，OpenClaw 會建立 QuickJS VM 快照並記錄待處理的主機工作。
3. 待處理工作穩定後，`wait` 會還原 VM 快照。
4. OpenClaw 會依穩定名稱重新註冊主機回呼。
5. OpenClaw 會將巢狀工具結果送入已還原的 VM。
6. OpenClaw 會清空 QuickJS 待處理工作。
7. `wait` 會回傳 `completed`、`failed`，或另一個 `waiting` 結果。

快照是執行階段狀態，不是使用者成品。它們有大小限制、會過期，且限定於建立它們的執行與工作階段範圍。

`wait` 會在下列情況失敗：

- `runId` 未知。
- 快照已過期。
- 父執行或工作階段已中止。
- 呼叫者不在相同的執行/工作階段範圍內。
- QuickJS-WASI 還原失敗。
- 還原會超出已設定的限制。

## 客體執行階段 API

客體執行階段會公開一組小型全域 API：

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` 是執行範圍目錄的精簡中繼資料。預設不包含完整結構描述。

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

完整結構描述只會依需求載入：

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

在程式碼模式中，MCP 目錄項目無法透過 `tools.call(...)` 或便利函式呼叫。它們只會透過產生的 `MCP` 命名空間公開。TypeScript 風格的宣告檔可透過唯讀 `API` 虛擬檔案介面取得，因此代理可以檢查 MCP 簽章，而不必將 MCP 結構描述加入提示：

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

`API.read("mcp/<server>.d.ts")` 會回傳從 MCP 工具中繼資料推斷出的精簡宣告：

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

宣告檔是虛擬的，不是寫入工作區或狀態目錄下的檔案。對每個程式碼模式 `exec` 呼叫，OpenClaw 都會建置執行範圍工具目錄、保留可見的 MCP 項目、呈現 `mcp/index.d.ts` 加上每個可見伺服器一份 `mcp/<server>.d.ts` 宣告，並將該小型唯讀表格注入 QuickJS worker。客體程式碼只會看到 `API` 物件：`API.list(prefix?)` 會回傳檔案中繼資料，而 `API.read(path)` 會回傳選取的宣告內容。未知路徑以及 `.` / `..` 片段會被拒絕。

這可讓大型 MCP 結構描述不進入模型提示。代理會從 `exec` 工具描述得知虛擬 API 存在，只讀取所需的宣告檔，然後以單一物件引數呼叫 `MCP.<server>.<tool>()`。當代理需要在程式內取得單一工具結構描述回應時，`MCP.<server>.$api()` 仍可作為內嵌備援使用。

客體執行階段不得直接公開主機物件。輸入與輸出會以明確大小上限的 JSON 相容值跨越橋接層。

## 內部命名空間

內部命名空間讓程式碼模式能使用精簡的領域 API，而不必新增更多模型可見工具。由載入器擁有的整合可以註冊 `Issues`、`Fictions` 或 `Calendar` 這類命名空間；客體程式碼接著會在 QuickJS 程式內呼叫該命名空間，同時 OpenClaw 對模型仍只顯示 `exec` 與 `wait`。

命名空間目前是內部功能。沒有公開的外掛 SDK 命名空間 API：外部外掛命名空間需要由載入器擁有的合約，讓外掛身分、已安裝資訊清單、驗證狀態與已快取的目錄描述子不會偏離支援該命名空間的外掛工具。核心程式碼模式只擁有沙盒、序列化、目錄閘門與橋接分派。

客體程式碼接著可以使用直接全域或 `namespaces` 對應：

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 登錄生命週期

命名空間登錄是程序本機的，並以命名空間 ID 為鍵。典型執行會遵循此路徑：

1. 受信任的載入器呼叫 `registerCodeModeNamespaceForPlugin(pluginId, registration)`。
2. 程式碼模式會為該執行建立隱藏的 `ToolSearchRuntime`，並讀取其執行範圍目錄。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` 只保留 `requiredToolNames` 全部可見且由相同 `pluginId` 擁有的註冊。
4. 每個可見命名空間會為目前執行呼叫 `createScope(ctx)`。該範圍會接收 `agentId`、`sessionKey`、`sessionId`、`runId`、設定與中止狀態等執行內容。
5. 範圍資料會序列化為純描述子，並作為直接全域與 `namespaces.<globalName>` 注入 QuickJS。
6. 客體呼叫會透過 worker 橋接層暫停，在主機上解析命名空間路徑，將該呼叫對應到已宣告、由外掛擁有的目錄工具，並透過 `ToolSearchRuntime.call` 執行該工具。
7. OpenClaw 會在作用中的 `exec`/`wait` 工具呼叫內自動清空已就緒的命名空間橋接呼叫。若命名空間工作在逾時時仍待處理，或客體明確讓出，`wait` 稍後會恢復同一個命名空間執行階段。
8. 外掛復原或解除安裝會呼叫 `clearCodeModeNamespacesForPlugin(pluginId)`，因此過時的全域不會在外掛載入失敗後存續。

重要不變式：命名空間呼叫就是目錄工具呼叫。它們使用與 `tools.call(...)` 相同的政策鉤子、核准、中止處理、遙測、轉錄投影，以及暫停/續接行為。

### 註冊形狀

請從擁有後端工具的整合註冊命名空間。保持範圍小，且只公開會對應到已宣告目錄工具的領域動詞。

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

`createCodeModeNamespaceTool(toolName, inputMapper)` 會將範圍成員標記為可呼叫的命名空間函式。選用的 `inputMapper` 會接收客體引數，並回傳後端目錄工具的輸入物件。若沒有輸入對應器，會使用第一個客體引數，省略時則使用 `{}`。

原始主機函式會在客體程式碼執行前遭到拒絕：

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
- 每個可呼叫路徑只能指向 `requiredToolNames` 中命名的工具

這可防止另一個外掛透過註冊同名工具來公開命名空間。它也會讓命名空間與一般代理政策保持一致：如果該執行看不到後端工具，就看不到該命名空間。

例如，GitHub 命名空間應位於由 GitHub 擁有的擴充功能之後，該擴充功能擁有 GitHub 驗證、REST 或 GraphQL 用戶端、速率限制、寫入核准與測試。核心程式碼模式不應嵌入 GitHub 特定 API、權杖處理或提供者政策。

### 範圍序列化規則

`createScope(ctx)` 可以回傳包含 JSON 相容值、陣列、巢狀物件與 `createCodeModeNamespaceTool(...)` 呼叫標記的純物件。主機物件絕不會直接進入 QuickJS。

序列化器會拒絕：

- 原始函式
- 循環物件圖
- 不安全的路徑片段：`__proto__`、`constructor`、`prototype`、空鍵，或包含內部路徑分隔符的鍵
- 不是 JavaScript 識別符的 `globalName` 值
- 與內建程式碼模式全域發生衝突的 `globalName`，例如 `tools`、`namespaces`、`text`、`json`、`yield_control` 或 `__openclaw*`

無法序列化為 JSON 的值，會在跨越橋接層前轉換為 JSON 安全的備援值。二進位資料、控制代碼、通訊端、用戶端與類別實例應留在一般目錄工具後方。

### 提示

只有當命名空間在該執行中可見時，命名空間的 `description` 與選用 `prompt` 才會附加到模型可見的 `exec` 結構描述。請用它們教授最小可用介面：

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

提示應聚焦於命名空間合約，而不是驗證設定、實作歷史或不相關的外掛行為。

### 清理

命名空間是程序本機註冊。當所屬外掛
被停用、解除安裝或回復時，請移除它們：

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

程式碼模式清理由外掛擁有；在其生命週期結束時清除外掛的命名空間註冊，
而不是保留每個命名空間的拆卸控制代碼。測試可以呼叫 `clearCodeModeNamespacesForTest()`，以避免註冊在
案例之間洩漏。

### 測試檢查清單

命名空間變更應涵蓋安全邊界與訪客行為：

- 命名空間提示文字只會在支援工具可見時出現
- 來自另一個 `sourceName` 的同名工具不會暴露命名空間
- 原始範圍函式會被拒絕
- 偽造的命名空間 ID 與偽造的路徑會被拒絕
- 可呼叫路徑不能以未宣告的工具為目標
- 巢狀物件與共享參照會正確序列化
- 命名空間呼叫會透過目錄工具執行，並傳回 JSON 安全的詳細資料
- 失敗可由訪客程式碼捕捉
- 暫停的命名空間呼叫會透過 `wait` 恢復
- 外掛回復會清除所屬的命名空間註冊

命名空間補足泛用 `tools.search` / `tools.call` 目錄。任意已啟用的 OpenClaw、外掛與用戶端工具請使用
目錄；MCP 工具請使用 `MCP`；外掛擁有且具文件說明的領域 API，若簡潔程式碼比重複查詢結構描述更可靠，請使用其他命名空間。

## 輸出 API

`text(value)` 會將人類可讀的輸出附加到 `output` 陣列。

`json(value)` 會在 JSON 相容序列化後附加一個結構化輸出項目。

訪客程式碼最終傳回的值會成為 `completed` 結果中的 `value`。

輸出項目：

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

輸出規則：

- 輸出順序與訪客呼叫一致
- 輸出受 `maxOutputBytes` 限制
- 無法序列化的值會轉換為純字串或錯誤
- v1 不支援二進位值
- 圖片與檔案會透過一般 OpenClaw 工具傳遞，而不是透過
  程式碼模式橋接

## 工具目錄

隱藏目錄包含有效政策篩選後的工具：

1. OpenClaw 核心工具。
2. 內建外掛工具。
3. 外部外掛工具。
4. MCP 工具。
5. 目前執行的用戶端提供工具。

目錄 ID 在單次執行內穩定，並且在可行時於等效工具集合之間具決定性。

建議的 ID 形狀：

```text
<source>:<owner>:<tool-name>
```

範例：

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目錄會省略程式碼模式控制工具：

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

這會防止遞迴，並讓面向模型的合約保持狹窄。

MCP 項目會保留在執行範圍目錄中，因此政策、核准、掛鉤、
遙測、轉錄投影與精確工具 ID 會與一般工具執行共用。面向訪客的 `ALL_TOOLS`、`tools.search(...)`、
`tools.describe(...)` 與 `tools.call(...)` 檢視會省略 MCP 項目。
產生的 `MCP.<server>.<tool>({ ...input })` 命名空間會解析回精確的目錄 ID，然後透過相同的執行器路徑分派。

## Tool Search 互動

程式碼模式會在啟用它的執行中取代 OpenClaw Tool Search 模型介面。

當 `tools.codeMode.enabled` 為 true 且程式碼模式啟動時：

- OpenClaw 不會將 `tool_search_code`、`tool_search`、`tool_describe`
  或 `tool_call` 暴露為模型可見工具。
- 相同的目錄概念會移入訪客執行階段。
- 訪客執行階段會收到精簡的 `ALL_TOOLS` 中繼資料，以及非 MCP 工具的搜尋、描述與呼叫輔助工具。
- MCP 呼叫會使用產生的 `MCP` 命名空間及其 `$api()` 標頭，
  而不是 `tools.call(...)`。
- 巢狀呼叫會透過 Tool Search 使用的相同 OpenClaw 執行器路徑分派。

現有的 [Tool Search](/zh-TW/tools/tool-search) 頁面描述 OpenClaw 精簡
目錄橋接。程式碼模式是可使用 `exec` 與 `wait` 的執行之泛用 OpenClaw 替代方案。

## 工具名稱與衝突

模型可見的 `exec` 工具是程式碼模式工具。如果一般 OpenClaw
shell `exec` 工具已啟用，它會對模型隱藏，並像任何其他工具一樣被編入目錄。

在訪客執行階段內：

- 若政策允許，`tools.call("openclaw:core:exec", input)` 可以呼叫 shell exec 工具。
- 只有在 shell exec 目錄項目具有明確安全名稱時，才會安裝 `tools.exec(...)`。
- 程式碼模式 `exec` 工具絕不會透過 `tools` 以遞迴方式提供。

如果兩個工具正規化為相同的安全便利名稱，OpenClaw 會省略該便利函式，並要求使用 `tools.call(id, input)`。

## 巢狀工具執行

每個巢狀工具呼叫都會跨越主機橋接並重新進入 OpenClaw。

巢狀執行會保留：

- 作用中的代理 ID
- 工作階段 ID 與工作階段金鑰
- 傳送者與頻道內容
- 沙盒政策
- 核准政策
- 外掛 `before_tool_call` 掛鉤
- 中止訊號
- 可用時的串流更新
- 軌跡與稽核事件

巢狀呼叫會以真實工具呼叫投影到轉錄中，因此支援套件可顯示發生了什麼。投影會識別父層程式碼模式工具呼叫與巢狀工具 ID。

允許平行巢狀呼叫，最多至 `maxPendingToolCalls`。

## 執行階段狀態

每次程式碼模式執行都有一個狀態機：

- `running`：VM 正在執行或巢狀呼叫正在進行。
- `waiting`：VM 快照存在，且可用 `wait` 恢復。
- `completed`：已傳回最終值；快照已刪除。
- `failed`：已傳回錯誤；快照已刪除。
- `expired`：快照或待處理狀態超過保留期限；無法恢復。
- `aborted`：父層執行/工作階段已取消；快照已刪除。

狀態會依代理執行、工作階段與工具呼叫 ID 界定範圍。來自不同執行或工作階段的 `wait` 呼叫會失敗。

快照儲存有界限：

- 每次執行的最大快照位元組數
- 每個程序的最大即時快照數
- 快照 TTL
- 執行結束時清理
- 不支援持久化時，在閘道關閉時清理

## QuickJS-WASI 執行階段

OpenClaw 在所屬套件中將 `quickjs-wasi` 載入為直接相依項。
執行階段不依賴為 Proxy、PAC 或其他無關相依項安裝的傳遞副本。

執行階段職責：

- 編譯或載入 QuickJS-WASI WebAssembly 模組
- 為每次程式碼模式執行或恢復建立一個隔離 VM
- 以穩定名稱註冊主機回呼
- 設定記憶體與中斷限制
- 評估 JavaScript
- 清空待處理工作
- 快照暫停的 VM 狀態
- 為 `wait` 還原快照
- 在終止狀態後釋放 VM 控制代碼與快照

執行階段會在 worker 中於 OpenClaw 主事件迴圈之外執行。訪客
無限迴圈不得無限期阻塞閘道程序。

## TypeScript

TypeScript 支援僅是原始碼轉換：

- 接受的輸入：一個 TypeScript 程式碼字串
- 輸出：由 QuickJS-WASI 評估的 JavaScript 字串
- 無型別檢查
- 無模組解析
- v1 中無 `import` 或 `require`
- 診斷會以 `failed` 結果傳回

TypeScript 編譯器只會針對 TypeScript 儲存格延遲載入。純
JavaScript 儲存格與停用的程式碼模式不會載入編譯器。

轉換應在可行時保留有用的行號。

## 安全邊界

模型程式碼是敵對的。執行階段使用縱深防禦：

- 在主事件迴圈之外執行 QuickJS-WASI
- 將 `quickjs-wasi` 載入為直接相依項，而不是透過 Codex 或傳遞
  套件
- 訪客中沒有檔案系統、網路、子程序、模組匯入、環境變數或
  主機全域物件
- 使用 QuickJS 記憶體與中斷限制
- 強制執行父程序實際時間逾時
- 強制執行輸出、快照、記錄與待處理呼叫上限
- 透過狹窄的 JSON 介面卡序列化主機橋接值
- 將主機錯誤轉換為純訪客錯誤，絕不轉換為主機 realm 物件
- 在逾時、中止、工作階段結束或到期時丟棄快照
- 拒絕對 `exec`、`wait` 與 Tool Search 控制工具的遞迴存取
- 防止便利名稱衝突遮蔽目錄輔助工具

沙盒是一個安全層。對於高風險部署，操作人員仍可能需要作業系統層級的強化。

## 錯誤碼

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

傳回給訪客的錯誤是純資料。主機 `Error` 實例、堆疊
物件、原型與主機函式不會跨入 QuickJS。

## 遙測

程式碼模式會回報：

- 傳送給模型的可見工具名稱
- 隱藏目錄大小與來源細分
- `exec` 與 `wait` 次數
- 巢狀搜尋、描述與呼叫次數
- 已呼叫的巢狀工具 ID
- 逾時、記憶體、快照與輸出上限失敗
- 快照生命週期事件

遙測不得包含秘密、原始環境值，或超出既有 OpenClaw 軌跡政策的未遮蔽工具輸入。

## 除錯

當程式碼模式的行為不同於一般工具執行時，請使用目標式模型傳輸記錄：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

若要除錯酬載形狀，請使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。
這會記錄有上限且已遮蔽的模型請求 JSON 快照；它只應在除錯時使用，因為提示與訊息文字仍可能出現。

若要除錯串流，請使用 `OPENCLAW_DEBUG_SSE=peek` 記錄前五個
已遮蔽的 SSE 事件。若最終提供者酬載在程式碼模式介面啟動後未精確包含 `exec` 與 `wait`，程式碼模式也會失敗關閉。

## 實作配置

實作單元：

- 設定合約：`tools.codeMode`
- 目錄建構器：有效工具轉為精簡項目與 ID 對應
- 模型介面介面卡：以 `exec` 與 `wait` 取代可見工具
- QuickJS-WASI 執行階段介面卡：載入、評估、快照、還原、釋放
- worker 監督器：逾時、中止、當機隔離
- 橋接介面卡：JSON 安全的主機回呼與結果傳遞
- TypeScript 轉換介面卡
- 快照存放區：TTL、大小上限、執行/工作階段範圍
- 巢狀工具呼叫的軌跡投影
- 遙測計數器與診斷

實作會重用 Tool Search 的目錄與執行器概念，但
不使用 `node:vm` 子項作為沙盒。

## 驗證檢查清單

程式碼模式覆蓋率應證明：

- 停用的設定會讓既有工具曝露維持不變
- 沒有 `enabled: true` 的物件設定會讓程式碼模式維持停用
- 啟用的設定在該次執行的工具為啟用狀態時，只會向模型曝露 `exec` 和 `wait`
- 原始無工具執行、`disableTools`，以及空白允許清單不會觸發程式碼模式酬載強制檢查
- 所有有效的非 MCP 工具都會出現在 `ALL_TOOLS`
- 被拒絕的工具不會出現在 `ALL_TOOLS`
- `tools.search`、`tools.describe` 和 `tools.call` 可用於 OpenClaw 工具
- `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")` 會在不經由橋接/工具呼叫的情況下曝露 TypeScript 風格的 MCP 宣告
- MCP 命名空間 `$api()` 仍可作為結構描述的內嵌後援使用
- MCP 命名空間呼叫可用於具有單一物件輸入的可見 MCP 工具，而直接 MCP 目錄項目不會出現在 `tools.*`
- 工具搜尋控制工具會同時從模型介面與隱藏目錄中隱藏
- 巢狀呼叫會保留核准與鉤子行為
- shell `exec` 對模型隱藏，但在允許時可透過目錄 id 呼叫
- 遞迴程式碼模式 `exec` 和 `wait` 無法從客體程式碼呼叫
- TypeScript 輸入會被轉換並評估，且不會在停用或僅 JavaScript 路徑上載入 TypeScript
- `import`、`require`、檔案系統、網路和環境存取都會失敗
- 無限迴圈會逾時，且無法阻塞閘道
- 記憶體上限失敗會終止客體 VM
- 已完成與已暫停呼叫都會強制套用輸出與快照上限
- `wait` 會恢復已暫停的快照並傳回最終值
- 已過期、已中止、錯誤工作階段，以及未知的 `runId` 值都會失敗
- 逐字稿重播與持久化會保留程式碼模式控制呼叫
- 逐字稿與遙測會清楚顯示巢狀工具呼叫

## E2E 測試計畫

變更執行階段時，請將這些作為整合或端對端測試執行：

1. 使用 `tools.codeMode.enabled: false` 啟動閘道。
2. 傳送含有小型直接工具集的代理程式回合。
3. 斷言模型可見工具維持不變。
4. 使用 `tools.codeMode.enabled: true` 重新啟動。
5. 傳送含有 OpenClaw、外掛、MCP 和用戶端測試工具的代理程式回合。
6. 斷言模型可見工具清單正好是 `exec`、`wait`。
7. 在 `exec` 中讀取 `ALL_TOOLS`，並斷言有效的測試工具存在。
8. 在 `exec` 中透過 `tools.search`、`tools.describe` 和 `tools.call` 呼叫 OpenClaw/外掛/用戶端工具。
9. 在 `exec` 中呼叫 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，並斷言宣告檔案會描述可見的 MCP 工具。
10. 在 `exec` 中透過 `MCP.<server>.<tool>({ ...input })` 呼叫 MCP 工具，並斷言直接 MCP 目錄項目不存在於 `ALL_TOOLS` 和 `tools.*`。
11. 斷言被拒絕的工具不存在，且無法透過猜測的 id 呼叫。
12. 啟動一個在 `exec` 傳回 `waiting` 後解析的巢狀工具呼叫。
13. 呼叫 `wait`，並斷言已恢復的 VM 會收到工具結果。
14. 斷言最終答案包含恢復後產生的輸出。
15. 斷言逾時、中止和快照過期都會清理執行階段狀態。
16. 匯出軌跡，並斷言巢狀呼叫可在父層程式碼模式呼叫下看見。

僅文件變更此頁面時，仍應執行 `pnpm check:docs`。

## 相關

- [工具搜尋](/zh-TW/tools/tool-search)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [`exec` 工具](/zh-TW/tools/exec)
- [程式碼執行](/zh-TW/tools/code-execution)
