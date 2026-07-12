---
read_when:
    - 你想為代理程式執行啟用 OpenClaw 程式碼模式
    - 你需要說明為什麼程式碼模式與 Codex Code 模式不同
    - 你正在檢閱精簡工具合約、QuickJS-WASI 沙箱、TypeScript 轉換或隱藏的工具目錄橋接機制
    - 你正在新增或審查內部程式碼模式命名空間登錄整合功能
sidebarTitle: Code mode
summary: OpenClaw 程式碼模式：由 QuickJS-WASI 與隱藏的單次執行範圍工具目錄支援，需選擇啟用的精簡工具介面
title: 程式碼模式
x-i18n:
    generated_at: "2026-07-12T14:46:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

程式碼模式是一項實驗性、需選擇啟用的 OpenClaw 代理執行階段功能。啟用後，模型不再看到每個已啟用工具的結構描述；而是只看到 `exec`、`wait`，以及其結構化結果無法通過僅支援 JSON 的客體橋接器、因此只能直接呼叫的工具。模型會撰寫一小段 JavaScript 或 TypeScript 程式，用來搜尋、描述及呼叫隱藏的工具目錄。

本頁說明的是 OpenClaw 程式碼模式，而非 Codex Code Mode。這兩項功能名稱相同，控制工具名稱（`exec`、`wait`）也相同，但屬於不同的實作：

- Codex Code Mode 在 Codex 程式設計框架內執行。其 `exec` 工具是自由格式文法工具：模型會撰寫原始 JavaScript 原始碼（可選擇在前面加上 `// @exec: {...}` pragma 行來指定執行選項），並在 Deno/V8 執行階段中執行。
- OpenClaw 程式碼模式在通用 OpenClaw 代理執行階段中執行，除非設定 `tools.codeMode.enabled: true`，否則會停用。其 `exec` 工具接受 JSON `{ code, language }` 承載資料，並在 QuickJS-WASI worker 中執行。

兩者都是 JavaScript 執行介面，而非 shell 命令介面。請將它們視為彼此獨立、實作方式不同，只是剛好公開同名 `exec`/`wait` 工具的功能。

## 功能說明

- 模型可見的工具清單會變成 `exec`、`wait`，以及任何只能直接呼叫的工具，例如影像結果無法通過客體橋接器的 `computer`。
- `exec` 會在隔離的 QuickJS-WASI worker 執行緒中評估模型產生的 JavaScript 或 TypeScript。
- 每個符合目錄資格且已啟用的工具（OpenClaw 核心、外掛、MCP、用戶端）都會從模型提示中隱藏，並透過 `ALL_TOOLS` 和 `tools` 在客體程式中公開。
- 客體程式碼會搜尋隱藏目錄、描述工具的結構描述，並透過一般代理回合所使用的相同執行路徑呼叫工具（政策、核准、掛鉤、遙測仍全數適用）。
- MCP 工具會歸入 `MCP` 命名空間；在程式碼模式下，這是唯一支援的呼叫方式。
- 當巢狀工具呼叫仍在等待時，`wait` 會繼續已暫停的程式碼模式執行。

程式碼模式只會變更面向模型的協調介面。它不會取代工具、外掛工具、MCP 工具、驗證、核准政策、頻道行為或模型選擇。

## 使用理由

- 更小的提示介面：提供者只會收到兩個控制工具和少數必要的直接工具，而不是數十或數百個完整工具結構描述。
- 更佳的協調能力：模型可在單一程式碼儲存格中使用迴圈、聯結、小型轉換、條件邏輯及平行巢狀工具呼叫。
- 不受提供者限制：適用於 OpenClaw、外掛、MCP 和用戶端工具，不依賴提供者原生的程式碼執行功能。
- 失敗時關閉：若已啟用程式碼模式，但 QuickJS-WASI 執行階段無法使用，該次執行會失敗，而不會在未提示的情況下退回廣泛的直接工具公開方式。

這最適合已啟用大量工具目錄的代理，或模型在回答前需要搜尋、組合及呼叫多個工具的工作流程。

## 啟用方式

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

若省略 `tools.codeMode`、將其設為 `false`，或設為不含 `enabled: true` 的物件，程式碼模式會維持關閉。

如果你使用已設定 MCP 伺服器的沙箱代理，也請在沙箱工具政策中允許內建的 MCP 外掛，例如 `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。請參閱[設定 — 沙箱工具政策內的工具與自訂提供者](/zh-TW/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)。

若要設定更嚴格的界限，請明確指定限制：

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

若要在偵錯時確認模型承載資料的形狀，請使用目標式記錄啟動閘道：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

啟用程式碼模式後，記錄中面向模型的工具名稱應為 `exec` 和 `wait`。若要取得完整但經過遮蔽處理的提供者承載資料，請在短時間偵錯工作階段中加入 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 技術導覽

本頁其餘部分將介紹執行階段合約與實作細節，供維護者、偵錯工具公開方式的外掛作者，以及驗證高風險部署的操作人員參考。

## 執行階段狀態

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| 執行階段            | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| 預設狀態            | 已停用                                                                                      |
| 穩定性              | 實驗性 OpenClaw 介面（Codex Code Mode 是獨立且穩定的 Codex 框架介面）                       |
| 目標介面            | 通用 OpenClaw 代理執行                                                                      |
| 安全立場            | 模型程式碼具有敵意                                                                          |
| 面向使用者的承諾    | 啟用程式碼模式後，絕不會在未提示的情況下退回廣泛的直接工具公開方式                          |

## 範圍

程式碼模式負責已準備執行中面向模型的協調形態。它不負責模型選擇、頻道行為、驗證、工具政策或工具實作。

範圍內：模型可見的控制／直接工具定義、隱藏工具目錄建構、JavaScript／TypeScript 客體執行、QuickJS-WASI worker 執行階段、搜尋／描述／呼叫的主機回呼、暫停客體程式的可繼續狀態、輸出／逾時／記憶體／待處理呼叫／快照限制，以及巢狀工具呼叫的遙測／軌跡投影。

範圍外：提供者原生的遠端程式碼執行、shell 執行語意、變更現有工具授權、使用者撰寫的持久性指令碼、客體程式碼中的套件管理員／檔案／網路／模組存取，以及直接重複使用 Codex Code Mode 內部元件。

由提供者擁有的工具（例如遠端 Python 沙箱）是獨立工具。請參閱[程式碼執行](/zh-TW/tools/code-execution)。

## 術語

- **程式碼模式**：OpenClaw 執行階段模式，會隱藏與目錄相容的模型工具，並公開 `exec`、`wait` 及必要的只能直接呼叫工具。
- **客體執行階段**：評估模型程式碼的 QuickJS-WASI JavaScript VM。
- **主機橋接器**：客體程式碼回到 OpenClaw 的精簡 JSON 相容回呼介面。
- **目錄**：套用一般工具政策、外掛、MCP 及用戶端工具解析後，以單次執行為範圍的有效工具清單。
- **巢狀工具呼叫**：客體程式碼透過主機橋接器發出的工具呼叫。
- **快照**：序列化的 QuickJS-WASI VM 狀態，儲存後可讓 `wait` 繼續已暫停的程式碼模式執行。

## 設定

`tools.codeMode.enabled` 是啟用閘門；只設定其他欄位不會自行啟用此功能。

| 欄位                  | 預設值                         | 限制                                             |
| --------------------- | ------------------------------ | ------------------------------------------------ |
| `enabled`             | `false`                        | 布林值；只有 `true` 會啟用程式碼模式             |
| `runtime`             | `"quickjs-wasi"`               | 唯一支援的值                                     |
| `mode`                | `"only"`                       | 公開控制／直接工具，並將其餘工具編入目錄         |
| `languages`           | `["javascript", "typescript"]` | 兩者的任意子集                                   |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                    |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                           |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                                |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                               |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                        |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                      |
| `searchDefaultLimit`  | `8`                            | 限制為不超過 `maxSearchLimit`                    |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                         |

若已啟用程式碼模式，但無法載入 QuickJS-WASI，OpenClaw 會針對該次執行採取失敗時關閉；它不會在未提示的情況下公開一般工具作為後備方案。

## 啟用流程

程式碼模式會在確定有效工具政策後、組裝最終模型請求前進行評估：

1. 解析代理、模型、提供者、沙箱、頻道、傳送者及執行政策。
2. 建立有效的 OpenClaw 工具清單，加入符合資格的外掛、MCP 及用戶端工具。
3. 套用允許／拒絕政策。
4. 若 `tools.codeMode.enabled` 為 false，繼續使用一般工具公開方式。
5. 若已啟用且該次執行有啟用工具，保留必要的只能直接呼叫工具，並將每個符合目錄資格的有效工具註冊至程式碼模式目錄。
6. 從模型可見清單中移除已編入目錄的工具；在保留的只能直接呼叫工具旁加入 `exec` 和 `wait`。

即使已設定 `tools.codeMode.enabled: true`，刻意不使用工具的執行（原始模型呼叫、`disableTools: true`，或空白的 `tools.allow` 清單）也不會啟用程式碼模式介面。在單次執行中，程式碼模式與 OpenClaw 工具搜尋互斥；若啟用程式碼模式，便不會進行工具搜尋的壓縮。

程式碼模式目錄以單次執行為範圍，且不得洩漏其他代理、工作階段、傳送者或執行的工具。

## 模型可見工具

啟用程式碼模式後，模型會看到 `exec`、`wait` 及任何必要的只能直接呼叫工具。其他所有已啟用的工具都會從面向模型的工具清單中隱藏，並註冊至程式碼模式目錄。

使用 `exec` 進行工具協調、資料聯結、迴圈、平行巢狀呼叫及結構化轉換。只有在 `exec` 傳回可繼續的 `waiting` 結果時才使用 `wait`。

## `exec`

`exec` 會啟動程式碼模式儲存格並傳回一個結果。輸入程式碼由模型產生，必須視為具有敵意。

輸入：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

規則：

- `code` 或 `command` 其中之一必須為非空值。
- `code` 是文件所述的面向模型欄位。
- `command` 可作為與 exec 相容的別名，供掛鉤政策和受信任的重寫使用（一般 OpenClaw shell exec 工具也使用 `command` 欄位）；若兩者同時存在，其值必須相符。
- `language` 預設為 `"javascript"`；結構描述會將其公開為扁平字串列舉（`"javascript" | "typescript"`），而不是 `oneOf`/`anyOf` 聯集，因為部分提供者會拒絕這些形狀。
- 若 `language` 為 `"typescript"`，OpenClaw 會在評估前進行轉譯。
- `exec` 會拒絕 `import`、`require`、動態 import 及模組載入器模式。
- `exec` 絕不會以遞迴方式公開一般 shell `exec` 實作。
- 外層程式碼模式 `exec` 掛鉤事件會攜帶 `toolKind: "code_mode_exec"` 及 `toolInputKind: "javascript" | "typescript"`（若已知），讓政策能區分程式碼模式儲存格與共用相同工具名稱的 shell 形式 `exec` 呼叫。

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

當 QuickJS VM 暫停並保留可恢復的狀態，且仍需要模型可見的後續處理時，`exec` 會傳回 `waiting`；結果會包含供 `wait` 使用的 `runId`。命名空間橋接呼叫（包括 MCP 命名空間呼叫）只要已就緒，就會在同一次 `exec`/`wait` 呼叫內自動清空，因此精簡的程式碼區塊可以呼叫 MCP 工具，而不必讓模型為每次命名空間的 await 強制發出一次工具呼叫。

只有當客體 VM 沒有待處理工作，且最終值經過 OpenClaw 的輸出配接器處理後與 JSON 相容時，`exec` 才會傳回 `completed`。

## `wait`

`wait` 會繼續執行已暫停的程式碼模式 VM。

輸入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

輸出與 `exec` 傳回的 `CodeModeResult` 聯集相同。

之所以需要 `wait`，是因為巢狀 OpenClaw 工具可能執行緩慢、需要互動、受核准機制限制，或串流傳回部分更新；主機等待外部工作時，模型不應需要持續開啟一個長時間執行的 `exec` 呼叫。

QuickJS-WASI 快照／還原是恢復執行的機制：

1. `exec` 會評估程式碼，直到完成、失敗或暫停。
2. 暫停時，OpenClaw 會建立 QuickJS VM 的快照，並記錄待處理的主機工作。
3. 待處理工作完成後，`wait` 會還原 VM 快照，並以穩定名稱重新註冊主機回呼。
4. OpenClaw 會將巢狀工具結果傳入還原後的 VM，並清空 QuickJS 的待處理工作。
5. `wait` 會傳回 `completed`、`failed`，或另一個 `waiting` 結果。

快照是執行階段狀態，而非使用者成品：它們只存在於處理程序內的對應表中（不寫入資料庫或磁碟）、有大小限制、會過期，且僅限於建立它們的執行與工作階段範圍。

在下列情況下，`wait` 會失敗（傳回 `failed` 結果）：

- `runId` 未知，或其快照已過期。
- 呼叫者與已暫停的執行不在相同的執行／工作階段範圍內。
- 該 `runId` 已有一個正在進行的 `wait`。
- QuickJS-WASI 還原失敗。
- 恢復執行會超過 `maxOutputBytes` 或 `maxSnapshotBytes`。

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

`ALL_TOOLS` 是執行範圍目錄的精簡中繼資料；預設不包含完整結構描述。

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

外掛工具使用 `source: "openclaw"`，並將 `sourceName` 設為所屬外掛的 ID；沒有獨立的 `"plugin"` 來源值。`source: "mcp"` 僅用於 `sourceName`/`mcp` 中繼資料中的 MCP 項目（並且會從 `ALL_TOOLS`/`tools.*` 中篩除，請見下文）。

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

便捷工具函式只會為不含歧義的安全名稱安裝：

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// 如果隱藏目錄具有不含歧義的 `web_search` 項目：
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

在程式碼模式中，無法透過 `tools.call(...)` 或便捷函式呼叫 MCP 目錄項目；它們只會透過產生的 `MCP` 命名空間公開。唯讀 `API` 虛擬檔案介面提供 TypeScript 風格的宣告檔案，因此代理程式無須將 MCP 結構描述加入提示詞，即可檢查 MCP 簽章：

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

`API.read("mcp/<server>.d.ts")` 會傳回根據 MCP 工具中繼資料推導出的精簡宣告：

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** 傳回此 TypeScript 風格的 API 標頭。 */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * 建立 GitHub 議題。
   * @param owner 儲存庫擁有者
   * @param repo 儲存庫名稱
   * @param title 議題標題
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

宣告檔案是虛擬的，不會寫入工作區或狀態目錄。對於每次程式碼模式的 `exec` 呼叫，OpenClaw 都會建立執行範圍的工具目錄、保留可見的 MCP 項目、轉譯 `mcp/index.d.ts`，以及為每個可見伺服器轉譯一個 `mcp/<server>.d.ts`，接著將這個小型唯讀對應表注入 QuickJS 工作執行緒。客體程式碼只能看到 `API` 物件：`API.list(prefix?)` 會傳回檔案中繼資料，而 `API.read(path)` 會傳回選定的宣告內容。未知路徑及 `.`/`..` 路徑片段會遭到拒絕。

這可避免將大型 MCP 結構描述放入模型提示詞：代理程式會從 `exec` 工具說明得知虛擬 API 的存在，只讀取所需的宣告檔案，然後以單一物件引數呼叫 `MCP.<server>.<tool>()`。`MCP.<server>.$api()` 仍可作為程式內單一工具結構描述回應的內嵌備援方式。

客體執行階段絕不會直接看到主機物件。輸入與輸出會以具明確大小上限的 JSON 相容值跨越橋接層。

## 內部命名空間

內部命名空間可讓程式碼模式使用精簡的領域 API，而不必新增更多模型可見的工具。由載入器管理的整合會註冊如 `Issues` 或 `Calendar` 的命名空間；客體程式碼接著在 QuickJS 程式內呼叫該命名空間，而模型仍只會看到精簡的控制／直接介面。

目前命名空間僅供內部使用。現在沒有公開的外掛 SDK 命名空間 API：外部外掛命名空間需要由載入器管理的合約，確保外掛身分、已安裝的資訊清單、驗證狀態與快取的目錄描述元，不會和支援該命名空間的外掛工具產生偏差。核心程式碼模式只負責沙箱、序列化、目錄閘控及橋接分派。

客體程式碼可以使用直接的全域變數或 `namespaces` 對應表：

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 登錄生命週期

命名空間登錄位於處理程序本機，並以命名空間 ID 作為索引鍵：

1. 受信任的載入器呼叫 `registerCodeModeNamespaceForPlugin(pluginId, registration)`。
2. 程式碼模式為該次執行建立隱藏的 `ToolSearchRuntime`，並讀取其執行範圍目錄。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` 只保留其所有 `requiredToolNames` 均可見，且由同一個 `pluginId` 擁有的註冊項目。
4. 每個可見的命名空間都會為目前執行呼叫 `createScope(ctx)`，接收 `agentId`、`sessionKey`、`sessionId`、`runId`、設定及中止狀態等執行內容。
5. 範圍資料會序列化成純描述元，並以直接全域變數和 `namespaces.<globalName>` 的形式注入 QuickJS。
6. 客體呼叫會透過工作執行緒橋接層暫停、在主機上解析命名空間路徑、將呼叫對應至已宣告且由外掛擁有的目錄工具，並透過 `ToolSearchRuntime.callExactId` 執行該工具。
7. 已就緒的命名空間橋接呼叫會在作用中的 `exec`/`wait` 呼叫內自動清空；如果命名空間工作在逾時時仍待處理，或客體明確讓出控制權，`wait` 稍後會恢復同一個命名空間執行階段。
8. 外掛回復或解除安裝時會呼叫 `clearCodeModeNamespacesForPlugin(pluginId)`，使過時的全域變數不會在外掛載入失敗後繼續存在。

命名空間呼叫就是目錄工具呼叫：它們與 `tools.call(...)` 使用相同的原則掛鉤、核准、中止處理、遙測、逐字稿投影，以及暫停／恢復行為。

### 註冊形式

請從擁有後端工具的整合註冊命名空間。保持範圍精簡，且只公開能對應至已宣告目錄工具的領域動詞。

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

`createCodeModeNamespaceTool(toolName, inputMapper)` 會將範圍成員標記為可呼叫的命名空間函式。選用的 `inputMapper` 會接收客體引數，並傳回後端目錄工具的輸入物件；若未提供，則使用第一個客體引數，省略時則使用 `{}`。

客體程式碼執行前，原始主機函式會遭到拒絕：

```typescript
createScope: () => ({
  // 錯誤：這會繞過目錄工具生命週期，因此將遭到拒絕。
  list: async () => githubClient.listIssues(),
});
```

### 擁有權與可見性

命名空間的擁有權會繫結至註冊呼叫者的 `pluginId`。`requiredToolNames` 同時是可見性閘門與擁有權檢查：

- 每個必要工具都必須存在於執行目錄中
- 每個必要工具都必須符合 `sourceName === pluginId`
- 只要有任何必要工具不存在或由另一個外掛擁有，就會隱藏該命名空間
- 每個可呼叫路徑只能以 `requiredToolNames` 中列出的工具為目標

這可防止另一個外掛透過註冊同名工具來公開命名空間，並使命名空間與一般代理程式原則保持一致：如果該次執行看不到後端工具，也就看不到該命名空間。

例如，GitHub 命名空間應置於由 GitHub 擁有的外掛之後，該外掛負責 GitHub 驗證、REST/GraphQL 用戶端、速率限制、寫入核准及測試。核心程式碼模式不應內嵌 GitHub 專用 API、權杖處理或供應商原則。

### 範圍序列化規則

`createScope(ctx)` 可以傳回包含 JSON 相容值、陣列、巢狀物件，以及 `createCodeModeNamespaceTool(...)` 呼叫標記的純物件。主機物件絕不會直接進入 QuickJS。

序列化器會拒絕：

- 原始函式
- 循環物件圖
- 不安全的路徑區段：`__proto__`、`constructor`、`prototype`、空白鍵，
  或包含內部路徑分隔符號的鍵
- 不是 JavaScript 識別字的 `globalName` 值
- 與內建程式碼模式全域變數（例如 `tools`、`namespaces`、`text`、`json`、`yield_control`、`MCP`、`API`、`ALL_TOOLS` 或
  `__openclaw*`）衝突的 `globalName`

無法進行 JSON 序列化的值，會在跨越橋接器之前轉換成 JSON 安全的後備
值。二進位資料、控制代碼、通訊端、用戶端及
類別執行個體應留在一般目錄工具之後。

### 提示詞

只有當命名空間在該次執行中可見時，命名空間的 `description` 和選用的 `prompt`
才會附加至模型可見的 `exec` 結構描述。請使用
它們來說明最精簡且實用的介面：

```typescript
{
  description: "小說製作服務輔助工具。",
  prompt:
    "使用 Fictions.riskAudit()、Fictions.promoteIfReady(id, status) 和 Fictions.unpaidOver(amount)。",
}
```

提示詞應聚焦於命名空間契約，而非驗證設定、實作
歷程或不相關的外掛行為。

### 清理

命名空間是程序區域的註冊項目。當擁有它們的
外掛遭停用、解除安裝或回復時，請將其移除：

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

程式碼模式的清理由外掛負責；當外掛的生命週期結束時，
請清除該外掛的命名空間註冊，而不要保留各命名空間的拆除控制代碼。
測試可呼叫 `clearCodeModeNamespacesForTest()`，以免註冊項目
洩漏至其他測試案例。

### 測試檢查清單

命名空間變更應涵蓋安全邊界與客體行為：

- 只有在後端工具可見時，命名空間提示詞文字才會出現
- 來自其他 `sourceName` 的同名工具不會公開該命名空間
- 原始範圍函式會遭拒絕
- 偽造的命名空間 ID 和偽造的路徑會遭拒絕
- 可呼叫路徑不能以未宣告的工具為目標
- 巢狀物件和共用參照可正確序列化
- 命名空間呼叫會透過目錄工具執行，並傳回 JSON 安全的詳細資料
- 客體程式碼可捕捉失敗
- 暫停的命名空間呼叫可透過 `wait` 恢復
- 外掛回復會清除其擁有的命名空間註冊

命名空間是通用 `tools.search`/`tools.call` 目錄的補充：將目錄用於
任意已啟用的 OpenClaw、外掛及用戶端工具；將 `MCP`
用於 MCP 工具；其他命名空間則用於外掛擁有且已有文件說明的領域 API，
在這些情況下，精簡程式碼比反覆查詢結構描述更可靠。

## 輸出 API

- `text(value)` 將人類可讀的輸出附加至 `output` 陣列。
- `json(value)` 在進行 JSON 相容序列化後，附加結構化輸出項目。
- 客體程式碼最後傳回的值會成為 `completed`
  結果中的 `value`。

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

規則：輸出順序與客體呼叫順序一致；輸出受
`maxOutputBytes` 限制；不可序列化的值會轉換成純文字字串或
錯誤；不支援二進位值。影像和檔案會透過
一般 OpenClaw 工具傳輸，而非程式碼模式橋接器。

## 工具目錄

隱藏目錄會在套用有效原則篩選後納入工具，順序如下：
OpenClaw 核心工具、隨附外掛工具、外部外掛工具、MCP
工具，接著是用戶端為目前執行提供的工具。

目錄 ID 在單次執行期間保持穩定，且在可行情況下，對等價的
工具集會維持確定性。實際格式：

```text
<source>:<owner>:<tool-name>
```

其中 `<source>` 是 `openclaw`、`mcp` 或 `client`（外掛工具使用
`openclaw`，並以外掛 ID 作為 `<owner>`；核心工具使用 `openclaw:core:*`）。
範例：

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目錄會省略程式碼模式控制工具（`exec`、`wait`、`tool_search_code`、
`tool_search`、`tool_describe`、`tool_call`）及僅限直接呼叫的工具。控制工具
不得透過目錄遞迴呼叫；僅限直接呼叫的工具仍會對模型可見，
因為其結構化結果無法跨越 QuickJS 橋接器。

MCP 項目會保留在執行範圍的目錄中，因此原則、核准、鉤子、
遙測、文字記錄投影及確切工具 ID 仍與
一般工具執行共用。面向客體的 `ALL_TOOLS`、`tools.search(...)`、
`tools.describe(...)` 和 `tools.call(...)` 檢視會省略 MCP 項目。
產生的 `MCP.<server>.<tool>({ ...input })` 命名空間會解析回
確切的目錄 ID，並透過相同的執行器路徑分派。

## 與工具搜尋的互動

在程式碼模式啟用的執行中，程式碼模式會取代 OpenClaw 工具搜尋的模型介面。

當 `tools.codeMode.enabled` 為 true 且程式碼模式啟用時：

- OpenClaw 不會將 `tool_search_code`、`tool_search`、`tool_describe`
  或 `tool_call` 公開為模型可見的工具。
- 相同的目錄化概念會移至客體執行階段內。
- 客體執行階段會接收精簡的 `ALL_TOOLS` 中繼資料，以及非 MCP 工具的搜尋／描述／
  呼叫輔助工具。
- MCP 呼叫會使用產生的 `MCP` 命名空間及其 `$api()` 標頭，
  而非 `tools.call(...)`。
- 巢狀呼叫會透過工具搜尋所使用的相同 OpenClaw 執行器路徑分派。

請參閱[工具搜尋](/zh-TW/tools/tool-search)，了解在啟用中的執行裡由程式碼模式
取代的 OpenClaw 精簡目錄橋接器。

## 工具名稱與衝突

模型可見的 `exec` 工具是程式碼模式工具。如果一般 OpenClaw
shell `exec` 工具已啟用，模型將無法看見它，且它會像
任何其他工具一樣納入目錄。

在客體執行階段內：

- 若政策允許，`tools.call("openclaw:core:exec", input)` 可以呼叫 shell exec 工具。
- 只有當 shell exec 目錄項目具有明確且唯一的安全名稱時，才會安裝 `tools.exec(...)`。
- 絕不會透過 `tools` 遞迴提供程式碼模式的 `exec` 工具。

如果兩個工具正規化為相同的安全便利名稱，OpenClaw 會省略該便利函式，並要求使用 `tools.call(id, input)`。

## 巢狀工具執行

每個巢狀工具呼叫都會跨越主機橋接器並重新進入 OpenClaw，同時保留下列資訊：作用中的代理程式 ID、工作階段 ID 與金鑰、傳送者與頻道情境、沙箱政策、核准政策、外掛 `before_tool_call` 掛鉤、中止訊號、可用時的串流更新，以及軌跡／稽核事件。

巢狀呼叫會以實際工具呼叫的形式投射至逐字記錄，因此支援套件能顯示發生了什麼事，且投射內容會識別父層程式碼模式工具呼叫與巢狀工具 ID。

最多允許 `maxPendingToolCalls` 個平行巢狀呼叫。

## 執行與快照生命週期

每次程式碼模式執行都會在程序內映射中追蹤，並以 `runId` 作為索引鍵（不會保存到磁碟或資料庫）。`exec`/`wait` 會傳回三種結果狀態之一：`completed`、`waiting` 或 `failed`。

- `waiting` 結果會儲存 QuickJS 快照、待處理的橋接要求，以及範圍中繼資料（代理程式執行 ID、工作階段 ID／金鑰），直到 `wait` 恢復執行或其過期為止。
- 過期、工作階段錯誤、執行錯誤，以及未知／已在恢復中的 `runId` 值不會產生不同的終止狀態；它們會呈現為 `failed` 結果（`code: "invalid_input"`），並附帶例如 `code mode
run is unavailable or expired.` 或 `code mode run belongs to a different
session.` 的訊息。
- 執行的快照會在結果確定為 `completed` 或 `failed` 時立即從映射中移除，或在閘道關閉時捨棄（重新啟動後不會保留任何內容：這是暫時性的執行階段狀態）。
- 對於唯讀工作，`exec` 可以設定 `restartSafe: true`。OpenClaw 隨後會在執行前拒絕有副作用的目錄呼叫與外掛命名空間，並將暫停的結果標示為可安全重播。如果重新啟動中斷 `wait`，[重新啟動復原](/zh-TW/gateway/restart-recovery)會從逐字記錄重建該回合，而不是還原程序本機快照。復原回合本身仍僅限於經稽核的唯讀核心工具，以及明確標示為可安全重播的外掛工具。
- OpenClaw 會限制每個程序中同時暫停的執行數量（64）；超過此上限的新暫停要求會以 `too many suspended code mode
runs.` 拒絕。

快照儲存空間受每次執行的 `maxSnapshotBytes`、上述每程序暫停執行上限，以及 `snapshotTtlSeconds` 限制。

## QuickJS-WASI 執行階段

OpenClaw 會將 `quickjs-wasi` 作為所屬套件的直接相依套件載入；它不依賴為不相關相依套件安裝的間接副本。

執行階段的職責：編譯／載入 QuickJS-WASI WebAssembly 模組；為每次程式碼模式執行或恢復建立一個隔離的 VM；以穩定名稱註冊主機回呼；設定記憶體與中斷限制；評估 JavaScript；清空待處理工作；建立暫停 VM 狀態的快照；為 `wait` 還原快照；在終止狀態後處置 VM 控制代碼與快照。

執行階段會在 Node.js 工作執行緒中執行，位於 OpenClaw 的主要事件迴圈之外。客體中的無限迴圈不得無限期阻塞閘道程序；工作執行緒的中斷處理常式會強制執行實際時間逾時，不依賴客體程式碼的配合。

## TypeScript

TypeScript 支援僅是一項原始碼轉換：接受的輸入是一個 TypeScript 程式碼字串；輸出則是由 QuickJS-WASI 評估的 JavaScript 字串。不會進行型別檢查、模組解析，也不支援 `import`/`require`。診斷資訊會以 `failed` 結果傳回。

只有 TypeScript 儲存格才會延遲載入 TypeScript 編譯器；純 JavaScript 儲存格和停用的程式碼模式絕不會載入它。

## 安全界線

模型程式碼具有敵意。執行階段採用縱深防禦：

- 在主要事件迴圈之外的工作執行緒中執行 QuickJS-WASI
- 將 `quickjs-wasi` 作為直接相依套件載入，而非透過 Codex 或間接套件
- 客體中沒有檔案系統、網路、子程序、模組匯入、環境變數或主機全域物件
- 使用 QuickJS 記憶體與中斷限制，並搭配父程序的實際時間逾時
- 強制執行輸出、快照、記錄與待處理呼叫上限
- 透過範圍受限的 JSON 介面卡序列化主機橋接值
- 將主機錯誤轉換為普通的客體錯誤，絕不傳遞主機領域物件
- 在逾時、中止、工作階段結束或過期時捨棄快照
- 拒絕遞迴存取 `exec`、`wait` 與工具搜尋控制工具
- 防止便利名稱衝突遮蔽目錄輔助函式

沙箱是其中一層安全防護；對於高風險部署，營運人員可能仍需進行作業系統層級的強化。

## 錯誤代碼

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` 涵蓋錯誤的 `exec`/`wait` 引數、停用的語言、遭拒的模組存取、TypeScript 轉換失敗、未知／過期／範圍錯誤的 `runId` 值，以及暫停執行數量過多。`runtime_unavailable` 涵蓋無法啟動或以非零狀態退出的 QuickJS 工作執行緒。

傳回客體的錯誤是普通資料；主機 `Error` 執行個體、堆疊物件、原型和主機函式不會進入 QuickJS。

## 遙測

每個結果的 `telemetry` 欄位會回報：隱藏目錄的大小及來源明細（`openclaw`/`mcp`/`client` 計數）、該次執行目錄的累計搜尋／描述／呼叫計數，以及模型可見的工具名稱（`exec`、`wait` 和保留的僅限直接呼叫工具）。

除了現有 OpenClaw 軌跡政策允許的範圍外，遙測不得包含祕密、原始環境值或未遮蔽的工具輸入。

## 偵錯

當程式碼模式的行為與一般工具執行不同時，請使用針對性的模型傳輸記錄：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

若要偵錯承載資料的形狀，請使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。這會記錄一份有大小上限且經遮蔽的模型要求 JSON 快照；由於提示與訊息文字仍可能出現，請僅在偵錯時使用。

若要進行串流偵錯，請使用 `OPENCLAW_DEBUG_SSE=peek` 記錄前五個
經過遮蔽的 SSE 事件。程式碼模式介面啟用後，如果最終提供者
酬載未恰好包含一個 `exec`、一個 `wait`，以及僅包含核准的
僅限直接呼叫工具，程式碼模式也會採取失敗關閉。

## 實作配置

- 設定合約：`tools.codeMode`
- 目錄建構器：將有效工具轉換為精簡項目與 ID 對應表
- 模型介面配接器：以控制工具／直接呼叫工具取代可見工具
- QuickJS-WASI 執行階段配接器：載入、求值、建立快照、還原、釋放
- 工作程序監督器：逾時、中止、當機隔離
- 橋接配接器：JSON 安全的主機回呼與結果傳遞
- TypeScript 轉換配接器
- 快照儲存區：TTL、大小上限、執行／工作階段範圍
- 巢狀工具呼叫的軌跡投影
- 遙測計數器與診斷

此實作重用工具搜尋的目錄與執行器概念，但不使用 `node:vm`
子程序作為沙箱。

## 驗證檢查清單

程式碼模式的涵蓋範圍應證明：

- 停用設定不會改變現有的工具公開方式
- 未包含 `enabled: true` 的物件設定會讓程式碼模式維持停用
- 啟用設定後，若該次執行已啟用工具，僅向模型公開 `exec`、`wait`
  及必要的僅限直接呼叫工具
- 原始的無工具執行、`disableTools` 與空白允許清單不會觸發
  程式碼模式酬載強制檢查
- 所有符合目錄資格的有效非 MCP 工具都會出現在 `ALL_TOOLS` 中
- 僅限直接呼叫工具會保持對模型可見，且不會出現在 `ALL_TOOLS` 中
- 遭拒絕的工具不會出現在 `ALL_TOOLS` 中
- `tools.search`、`tools.describe` 與 `tools.call` 可用於 OpenClaw 工具
- `API.list("mcp")` 與 `API.read("mcp/<server>.d.ts")` 無須橋接／工具呼叫，
  即可公開 TypeScript 風格的 MCP 宣告
- MCP 命名空間 `$api()` 仍可作為結構描述的行內備援
- MCP 命名空間呼叫可搭配單一物件輸入用於可見的 MCP 工具，同時
  `tools.*` 中不存在直接 MCP 目錄項目
- 工具搜尋控制工具會同時從模型介面與隱藏目錄中隱藏
- 巢狀呼叫會保留核准與掛鉤行為
- Shell `exec` 不會向模型顯示，但在允許時可透過目錄 ID 呼叫
- 無法從訪客程式碼遞迴呼叫程式碼模式的 `exec` 與 `wait`
- TypeScript 輸入會經過轉換並求值，而停用路徑或僅限 JavaScript
  的路徑不會載入 TypeScript
- `import`、`require`、檔案系統、網路及環境存取皆會失敗
- 無限迴圈會逾時，且無法阻塞閘道
- 記憶體上限失敗會終止訪客 VM
- 已完成及暫停的呼叫都會強制套用輸出與快照上限
- `wait` 會繼續執行暫停的快照並傳回最終值
- 已過期、已中止、工作階段錯誤及未知的 `runId` 值都會失敗
- 文字記錄重播與持久化會保留程式碼模式控制呼叫
- 文字記錄與遙測會清楚顯示巢狀工具呼叫

## E2E 測試計畫

變更執行階段時，請將下列項目作為整合或端對端測試執行：

1. 啟動一個設定為 `tools.codeMode.enabled: false` 的閘道。
2. 使用一小組直接呼叫工具傳送一次代理程式回合。
3. 斷言模型可見的工具維持不變。
4. 使用 `tools.codeMode.enabled: true` 重新啟動。
5. 使用 OpenClaw、外掛、MCP 與用戶端測試工具傳送一次代理程式回合。
6. 斷言模型可見的工具清單為 `exec`、`wait`，以及僅包含已設定的
   僅限直接呼叫工具。
7. 在 `exec` 中讀取 `ALL_TOOLS`，並斷言符合目錄資格的有效測試
   工具存在，而僅限直接呼叫工具不存在。
8. 在 `exec` 中，透過 `tools.search`、`tools.describe` 與 `tools.call`
   呼叫 OpenClaw／外掛／用戶端工具。
9. 在 `exec` 中呼叫 `API.list("mcp")` 與 `API.read("mcp/<server>.d.ts")`，
   並斷言宣告檔案描述了可見的 MCP 工具。
10. 在 `exec` 中，透過 `MCP.<server>.<tool>({ ...input })` 呼叫 MCP 工具，
    並斷言 `ALL_TOOLS` 與 `tools.*` 中不存在直接 MCP 目錄項目。
11. 斷言遭拒絕的工具不存在，且無法透過猜測的 ID 呼叫。
12. 啟動一個會在 `exec` 傳回 `waiting` 後才解析完成的巢狀工具呼叫。
13. 呼叫 `wait`，並斷言還原後的 VM 會收到工具結果。
14. 斷言最終答案包含還原後產生的輸出。
15. 斷言逾時、中止與快照過期會清除執行階段狀態。
16. 匯出軌跡，並斷言巢狀呼叫會顯示在父層程式碼模式呼叫之下。

若僅變更此頁面的文件，仍應執行 `pnpm check:docs`。

## 相關內容

- [工具搜尋](/zh-TW/tools/tool-search)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [Exec 工具](/zh-TW/tools/exec)
- [程式碼執行](/zh-TW/tools/code-execution)
