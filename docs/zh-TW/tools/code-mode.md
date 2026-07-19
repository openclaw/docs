---
read_when:
    - 你想為代理程式執行啟用 OpenClaw 程式碼模式
    - 你需要說明為什麼 Code Mode 與 Codex Code Mode 不同
    - 你正在審查精簡工具合約、QuickJS-WASI 沙箱、TypeScript 轉換或隱藏的工具目錄橋接層
    - 你正在新增或審查內部程式碼模式命名空間登錄整合
sidebarTitle: Code Mode
summary: 使用 OpenClaw 程式碼模式，在精簡的 JavaScript 或 TypeScript 工作流程中探索、呼叫及組合大型工具目錄
title: 程式碼模式
x-i18n:
    generated_at: "2026-07-19T14:05:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a21df3bcfb11668da6dde1f7c69adcc284a28dc491c95f95097ce7f41e5c45bf
    source_path: tools/code-mode.md
    workflow: 16
---

程式碼模式是一項實驗性、選擇啟用的 OpenClaw 代理執行階段功能。啟用後，模型不再看到每個已啟用工具的結構描述；而是看到
`exec`、`wait`，以及任何其結構化結果無法通過僅限 JSON 的客體橋接器的僅限直接使用工具。模型會撰寫一小段 JavaScript 或 TypeScript
程式，用來搜尋、描述及呼叫隱藏的工具目錄。

本頁說明的是 OpenClaw 程式碼模式，而非 Codex 程式碼模式。這兩項功能
名稱相同，且使用相同的控制工具名稱（`exec`、`wait`），但它們是
彼此獨立的實作：

- Codex 程式碼模式在 Codex 程式設計框架內執行。其 `exec` 工具是
  自由格式文法工具：模型會撰寫原始 JavaScript 原始碼（可選擇在開頭加上
  用於執行選項的 `// @exec: {...}` pragma 行），並在 Codex 的處理程序內 V8 程式碼模式執行階段中執行。
- OpenClaw 程式碼模式在通用 OpenClaw 代理執行階段中執行，除非已設定
  `tools.codeMode.enabled: true`，否則會停用。其 `exec`
  工具接受 JSON `{ code, language }` 承載資料，並在 QuickJS-WASI
  工作程序中執行。

兩者都是 JavaScript 執行介面，而非 Shell 命令介面。應將它們視為
彼此獨立、實作方式不同的功能，只是剛好公開名稱相同的
`exec`/`wait` 工具。

## 功能

- 模型可見的工具清單會變成 `exec`、`wait`，再加上任何僅限直接使用的工具，
  例如 `computer`，或其影像結果無法通過客體橋接器的原生視覺
  `image` 載入器。
- `exec` 會在隔離的 QuickJS-WASI 工作執行緒中評估模型產生的 JavaScript 或 TypeScript。
- 所有符合目錄資格且已啟用的工具（OpenClaw 核心、外掛、MCP、用戶端）都會從
  模型的獨立工具中隱藏，並透過 `ALL_TOOLS`
  和 `tools` 在客體程式內公開。
- `exec` 描述包含有界限的快速索引，列出確切的 OpenClaw／外掛
  目錄 ID、精簡輸入提示，以及當受信任工具提供輸出結構描述時的精簡宣告輸出提示。它會省略描述、完整結構描述、
  MCP 項目及溢出項目；客體端目錄查詢仍是備用方式。
- 客體程式碼會搜尋隱藏目錄、描述工具的結構描述，並透過
  一般代理回合所使用的相同執行路徑呼叫工具（政策、
  核准、掛鉤、遙測全都仍然適用）。
- MCP 工具會歸入 `MCP` 命名空間；在程式碼模式中，這是
  唯一受支援的呼叫方式。
- `wait` 會在巢狀工具呼叫仍待處理時，繼續執行已暫停的程式碼模式執行。

程式碼模式只會變更面向模型的協調介面。它不會
取代工具、外掛工具、MCP 工具、驗證、核准政策、頻道
行為或模型選擇。

## 使用理由

- 更小的提示詞介面：提供者會取得兩個控制工具、一個有界限的原生工具
  索引，以及少數必要的直接工具，而非數十或數百個
  完整工具結構描述。
- 更佳的協調能力：模型可以在單一程式碼儲存格內使用迴圈、聯結、小型轉換、
  條件邏輯及平行巢狀工具呼叫。
- 更少的模型往返：宣告的輸出合約可讓模型在單一 `exec` 中
  呼叫並轉換工具結果；未知輸出仍會先以原始形式處理。
- 不受提供者限制：適用於 OpenClaw、外掛、MCP 及用戶端工具，
  不依賴提供者原生的程式碼執行。
- 採取失敗時關閉：如果已啟用程式碼模式，但 QuickJS-WASI 執行階段
  無法使用，該次執行會失敗，而不會悄悄改回廣泛公開
  直接工具。

此功能最適合啟用大量工具目錄的代理，或模型需要在回答前
搜尋、組合及呼叫多個工具的工作流程。

若工具目錄較小，或模型無法可靠地撰寫短程式，請維持直接公開工具。若你想要
精簡目錄，但偏好使用結構化的搜尋／描述／呼叫控制，而非
QuickJS-WASI 客體，請使用[工具搜尋](/zh-TW/tools/tool-search)。

## 快速入門

### 啟用程式碼模式

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

當省略 `tools.codeMode`、`false`，或物件中沒有
`enabled: true` 時，程式碼模式會維持關閉。

如果你使用已設定 MCP 伺服器的沙箱代理，也要在
沙箱工具政策中允許隨附的 MCP 外掛，例如
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`。請參閱
[設定－沙箱工具政策內的工具與自訂提供者](/zh-TW/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)。

設定明確限制，以施加更嚴格的界限：

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

### 模型執行的操作

對於具有已宣告輸出的工具，例如
`Array<{ id: string; paid: boolean; tons: number }>`，單一客體程式可以
選取、呼叫及轉換它：

```javascript
const [shipmentTool] = await tools.search("list shipments");
const shipments = await tools.callValue(shipmentTool.id, {});
return shipments.filter((shipment) => !shipment.paid && shipment.tons > 10);
```

當快速索引行以 `-> ?` 結尾時，代表輸出形狀未知。第一次
`exec` 必須原封不動地傳回 `await tools.callValue(...)`。之後的 `exec` 可以
轉換已觀察到的值。這會多耗費一個模型回合，但可防止
模型猜測欄位名稱。

### 驗證作用中的介面

若要在偵錯時確認模型承載資料的形狀，請以
針對性記錄執行閘道：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

當程式碼模式作用中時，記錄中的面向模型工具名稱應為 `exec` 和
`wait`。若要取得完整的已遮蔽提供者承載資料，請在短暫的偵錯工作階段中加入
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。

## 使用 Swarm 進行代理分流

[Swarm](/tools/swarm) 會加入 `agents.run()`、`phase()` 和 `log()` 客體全域變數，
用來從程式碼模式指令碼協調並行子代理。同時啟用
`tools.codeMode` 和 `tools.swarm`，然後使用一般 JavaScript 控制流程進行
分流、決策閘門及結構化收集。Swarm 是獨立的選擇啟用
閘門；只啟用程式碼模式不會公開 `agents.*` API。

## 技術導覽

本頁其餘內容涵蓋執行階段合約與實作詳細資料，
供維護者、偵錯工具公開狀況的外掛作者，以及
驗證高風險部署的操作人員參考。

## 執行階段狀態

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| 執行階段             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| 預設狀態             | 已停用                                                                                    |
| 穩定性               | 實驗性 OpenClaw 介面（Codex 程式碼模式是獨立且穩定的 Codex 框架介面） |
| 目標介面             | 通用 OpenClaw 代理執行                                                                 |
| 安全性立場           | 將模型程式碼視為惡意內容                                                                       |
| 面向使用者的承諾     | 啟用程式碼模式絕不會悄悄改回廣泛公開直接工具                  |

## 範圍

程式碼模式負責已準備執行的面向模型協調形狀。它
不負責模型選擇、頻道行為、驗證、工具政策或工具
實作。

範圍內：模型可見的控制／直接工具定義、隱藏工具目錄
建構、JavaScript／TypeScript 客體執行、QuickJS-WASI 工作程序
執行階段、用於搜尋／描述／呼叫的主機回呼、供
已暫停客體程式使用的可繼續狀態、輸出／逾時／記憶體／待處理呼叫／快照限制，
以及巢狀工具呼叫的遙測／軌跡投影。

範圍外：提供者原生遠端程式碼執行、Shell 執行
語意、變更現有工具授權、使用者撰寫的持久性
指令碼、客體程式碼中的套件管理員／檔案／網路／模組存取，以及直接
重複使用 Codex 程式碼模式內部元件。

由提供者擁有的工具（例如遠端 Python 沙箱）是獨立工具。請參閱
[程式碼執行](/zh-TW/tools/code-execution)。

## 詞彙

- **程式碼模式**：OpenClaw 執行階段模式，會隱藏與目錄相容的模型
  工具，並公開 `exec`、`wait`，以及必要的僅限直接使用工具。
- **客體執行階段**：評估模型程式碼的 QuickJS-WASI JavaScript VM。
- **主機橋接器**：從客體程式碼返回 OpenClaw 的狹窄 JSON 相容回呼介面。
- **目錄**：套用一般工具政策、外掛、MCP 及用戶端工具解析後，
  以執行為範圍的有效工具清單。
- **巢狀工具呼叫**：從客體程式碼透過主機橋接器進行的工具呼叫。
- **快照**：已序列化並儲存的 QuickJS-WASI VM 狀態，讓 `wait` 可以繼續
  已暫停的程式碼模式執行。

## 設定

`tools.codeMode.enabled` 是啟用閘門；設定其他欄位本身並不會
啟用此功能。

| 欄位                 | 預設值                        | 限制範圍                                           |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | 布林值；只有 `true` 會啟用程式碼模式          |
| `runtime`             | `"quickjs-wasi"`               | 唯一支援的值                            |
| `mode`                | `"only"`                       | 公開控制／直接工具，將其餘工具編入目錄 |
| `languages`           | `["javascript", "typescript"]` | 兩者的任意子集                           |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | 限制為 `maxSearchLimit`                     |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

如果已啟用程式碼模式，但 QuickJS-WASI 無法載入，OpenClaw 會針對
該次執行採取失敗時關閉；不會悄悄公開一般工具作為備用方式。

## 啟用

程式碼模式會在有效工具政策確定後、最終
模型要求組裝前進行評估：

1. 解析代理程式、模型、供應商、沙箱、頻道、傳送者及執行
   原則。
2. 建立有效的 OpenClaw 工具清單，加入符合資格的外掛、MCP 及
   用戶端工具。
3. 套用允許／拒絕原則。
4. 若 `tools.codeMode.enabled` 為 false，繼續使用一般工具公開方式。
5. 若已啟用且該次執行有作用中的工具，保留必要且僅限直接呼叫的
   工具，並在程式碼模式目錄中登錄所有符合目錄資格的有效工具。
6. 從模型可見清單移除已登錄至目錄的工具；除了保留的僅限直接呼叫工具外，再加入 `exec` 和
   `wait`。

刻意不使用任何工具的執行（原始模型呼叫、`disableTools: true`，
或空白的 `tools.allow` 清單），即使已設定 `tools.codeMode.enabled: true`，也不會啟用
程式碼模式介面。程式碼模式與 OpenClaw 工具搜尋在單次執行中
互斥；若程式碼模式啟用，工具搜尋的壓縮便不會啟用。

程式碼模式目錄的範圍僅限單次執行，且不得洩漏其他
代理程式、工作階段、傳送者或執行的工具。

## 模型可見工具

程式碼模式啟用時，模型會看到 `exec`、`wait`，以及任何必要且
僅限直接呼叫的工具。所有其他已啟用工具都不會出現在模型端
工具清單中，而會登錄至程式碼模式目錄。

使用 `exec` 進行工具協調、資料聯結、迴圈、平行巢狀呼叫
及結構化轉換。只有在 `exec` 傳回可繼續執行的
`waiting` 結果時，才使用 `wait`。

## `exec`

`exec` 會啟動程式碼模式儲存格並傳回一項結果。輸入程式碼由模型
產生，必須視為惡意內容。

輸入：

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

規則：

- `code` 或 `command` 其中之一不得為空。
- `code` 是文件記載的模型端欄位。
- `command` 可作為與 exec 相容的別名，供鉤子原則及
  受信任的重寫使用（一般 OpenClaw shell exec 工具也使用 `command`
  欄位）；兩者同時存在時，其值必須相符。
- `language` 預設為 `"javascript"`；結構描述將其公開為扁平的
  字串列舉（`"javascript" | "typescript"`），而不是 `oneOf`/`anyOf` 聯集，
  因為部分供應商會拒絕這類形狀。
- 若 `language` 為 `"typescript"`，OpenClaw 會先進行轉譯再求值。
- `exec` 會拒絕 `import`、`require`、動態匯入及模組載入器
  模式。
- `exec` 絕不會以遞迴方式公開一般 shell 的 `exec` 實作。
- 外層程式碼模式的 `exec` 鉤子事件會攜帶 `toolKind: "code_mode_exec"` 及
  `toolInputKind: "javascript" | "typescript"`（若已知），讓原則可以
  區分程式碼模式儲存格與共用相同工具名稱、shell 風格的 `exec` 呼叫。

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

當客體以仍需模型可見延續操作的可繼續狀態暫停時，
`exec` 會傳回 `waiting`，例如明確的 `yield_control(...)`，或
未能在執行期限內完成的橋接工具呼叫。結果會包含供 `wait`
使用的 `runId`。橋接工具呼叫（`tools.search`/`describe`/
`call` 及命名空間呼叫，包括 MCP 命名空間呼叫）若能在期限內完成，
便會在同一次 `exec`/`wait` 呼叫中自動清空。因此，等待多個工具的
精簡程式碼區塊可在一次模型
輪次內執行完成，而不必每次 await 都強制進行一次模型工具呼叫。可安全重新啟動的執行絕不會
自動清空；其待處理工作仍會經過可安全重播檢查。

只有當客體 VM 沒有待處理工作，且最終值經過 OpenClaw 的輸出配接器處理後
與 JSON 相容時，`exec` 才會傳回 `completed`。

## `wait`

`wait` 會繼續執行已暫停的程式碼模式 VM。

輸入：

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

輸出與 `exec` 傳回的 `CodeModeResult` 聯集相同。

`wait` 的存在，是因為巢狀 OpenClaw 工具可能執行緩慢、需要互動、
受核准機制限制，或串流傳送部分更新；主機等待外部工作時，
模型不應需要持續開啟一個長時間的 `exec` 呼叫。

QuickJS-WASI 快照／還原是繼續執行機制：

1. `exec` 會執行程式碼求值，直到完成、失敗或暫停。
2. 暫停時，OpenClaw 會建立 QuickJS VM 快照並記錄待處理的主機
   工作。
3. 待處理工作完成時，`wait` 會還原 VM 快照，並
   以穩定名稱重新登錄主機回呼。
4. OpenClaw 會將巢狀工具結果傳入已還原的 VM，並清空
   QuickJS 待處理工作。
5. `wait` 會傳回 `completed`、`failed`，或另一個 `waiting` 結果。

快照是執行階段狀態，不是使用者成品：它們只存在於
處理程序內的對應表中（不會寫入資料庫或磁碟）、有大小限制、會過期，且
範圍僅限建立它們的執行與工作階段。

在以下情況下，`wait` 會失敗（以 `failed` 結果表示）：

- `runId` 未知，或其快照已過期。
- 呼叫端與已暫停的執行不在相同的執行／工作階段範圍內。
- 該 `runId` 已有一個 `wait` 正在進行。
- QuickJS-WASI 還原失敗。
- 繼續執行會超過 `maxOutputBytes` 或 `maxSnapshotBytes`。

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

`ALL_TOOLS` 是執行範圍目錄的精簡中繼資料；預設不包含
完整結構描述。模型可見的 `exec` 說明也包含
一組有界且確定性的 OpenClaw／外掛確切 ID 子集、精簡輸入
提示，以及受信任的已宣告輸出提示。說明仍會延後載入，
因此惡意目錄文字無法引導模型。當該索引省略某項工具時，
請讀取 `ALL_TOOLS`，或在客體程式內呼叫 `tools.search(...)`。

每一行快速索引中的箭頭描述 `tools.callValue(...)` 值。
`-> Array<{ id: string }>` 是已宣告的輸出提示；`-> ?` 表示輸出未知。
未知輸出一律優先保留原始值：原封不動地傳回並觀察該值，然後
在後續的 `exec` 中篩選或對應它，而不要猜測欄位名稱。當已宣告輸出的讀取結果
提供給最終的 `-> ?` 呼叫時亦同：請傳回該
呼叫的原始值，不要將其包裝成要求的答案形狀。

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
  input: string;
  output?: string;
};
```

`input` 是適用於常見情況的有界 TypeScript 風格簽章。若仍需要
確切的完整結構描述，請使用 `tools.describe(...)`。遠端 MCP
及用戶端項目使用 `input: "unknown"`，讓其不受信任的結構描述維持延後載入，
直到 `describe`。只有從受信任的 OpenClaw 核心
或外掛 `outputSchema` 衍生出的完整精簡提示，才會包含
`output`。MCP 與用戶端的輸出結構描述宣告不會提升為
這個受信任的目錄提示。

外掛工具使用 `source: "openclaw"`，並將 `sourceName` 設為所屬的
外掛 ID；沒有獨立的 `"plugin"` 來源值。`source: "mcp"` 僅用於
`sourceName`/`mcp` 中 MCP 項目的中繼資料（且會從
`ALL_TOOLS`/`tools.*` 中濾除，請參閱下文）。

完整結構描述只會在需要時載入：

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
  outputSchema?: unknown;
};
```

目錄輔助工具：

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  callValue(id: string, input?: unknown): Promise<unknown>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

便利工具函式只會針對無歧義的安全名稱安裝：

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.callValue(fileRead.id, { path: "README.md" });

// 如果隱藏目錄中有無歧義的 `web_search` 項目：
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

`tools.callValue(...)` 會直接傳回一般工具的 JSON `details` 值。
`tools.call(...)` 會保留原始 `{ tool, result }` 封套，供需要
內容區塊或其他結果中繼資料的呼叫端使用。

## 已宣告的輸出契約

OpenClaw 工具可以為放入 `AgentToolResult.details` 的結構化值宣告
`outputSchema`。這對程式碼模式與工具搜尋很實用；它
不是供應商原生的工具回應結構描述，也不會改變工具的直接
公開方式。

對於使用 `defineToolPlugin` 建立的工具，請在
`parameters` 旁宣告結構描述：

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const Shipment = Type.Object(
  {
    id: Type.String(),
    paid: Type.Boolean(),
    tons: Type.Number(),
  },
  { additionalProperties: false },
);

export default defineToolPlugin({
  id: "shipping",
  name: "Shipping",
  description: "Shipment tools.",
  tools: (tool) => [
    tool({
      name: "shipping_list",
      description: "List shipments.",
      parameters: Type.Object({}),
      outputSchema: Type.Array(Shipment),
      execute: async () => loadShipments(),
    }),
  ],
});
```

對於 `api.registerTool(...)` 或工廠工具，請將相同的 `outputSchema`
屬性放在傳回的 `AnyAgentTool` 物件上。

目前內建合約包括 `agents_list`、`apply_patch`、
`conversations_list`、`conversations_send`、`conversations_turn`、`edit`、
`openclaw`、`read`、`screen`、
`sessions_history`、`sessions_list`、`sessions_search`、`sessions_send`、
`session_status`、`spawn_task`、`terminal`、`web_fetch` 及 `web_search`。
完全透傳可重複使用其所屬的通訊協定結構描述，而不必
複製僅供模型使用的合約。例如，對話工具會公開
`conversations.list`、`conversations.send` 及 `conversations.turn` 所使用的相同閘道結果結構描述；
`web_fetch` 擁有工具本機結構描述，其提示會公開穩定的中繼資料、文字、
快取狀態及巢狀溢出中繼資料；`web_search` 則將其完全正規化的結果／答案／錯誤／原始資料
聯集宣告為完整的快速索引提示。檔案系統合約會傳回結構化的
讀取文字、影像、截斷及選用的找不到結果；明確的編輯
變更狀態與差異／修補資料；以及套用修補的路徑摘要。當
快速索引已宣告這些欄位時，一個儲存格即可組合探索與傳遞，
不需要另一次檢查回合：

```javascript
const listed = await tools.conversations_list({ query: "建置機器人" });
const target = listed.conversations.find((item) => item.label === "建置機器人");
if (!target) throw new Error("找不到對話");
return await tools.conversations_send({
  conversationRef: target.conversationRef,
  message: "建置完成。",
});
```

巢狀呼叫仍會使用一般工具政策、掛鉤及核准。如果完整
合約準確但對有界的快速索引而言過大，仍可透過
`tools.describe(...)` 取得，而箭頭仍為 `-> ?`。

合約規則很嚴格：

- 描述與 JSON 相容的確切 `details` 值，而非已呈現的 `content`
  區塊或供應商封裝。
- 納入所有不會擲回例外的成功或錯誤變體。若
  工具沒有穩定的結構化結果，請省略 `outputSchema`。
- 使用 `{ additionalProperties: false }` 關閉物件層，以形成完整的
  快速索引提示。開放、過大或其他不完整的結構描述仍可
  透過 `tools.describe(...)` 取得，但無法啟用單回合欄位使用。
- OpenClaw 會在執行工具前編譯結構描述，接著在一般工具掛鉤之後、
  目錄呼叫傳回之前，驗證最終的 `details`。無效的結構描述無法
  執行工具；不相符時會失敗且不列印該值。
- 精簡提示具確定性且有界。當精簡提示不足時，
  `tools.describe(...)` 會公開完整的受信任結構描述。
- 已安裝的外掛程式碼本身就是受信任的本機程式碼。遠端 MCP 與用戶端
  中繼資料仍不受信任，且無法選擇加入這些快速索引提示。

如需外掛編寫詳細資訊，請參閱[工具外掛](/zh-TW/plugins/tool-plugins#output-contracts)。

在程式碼模式下，無法透過 `tools.callValue(...)`、
`tools.call(...)` 或便利函式呼叫 MCP 目錄項目；它們僅透過
產生的 `MCP` 命名空間公開。可透過唯讀的
`API` 虛擬檔案介面取得 TypeScript 風格的宣告檔案，讓代理程式無須將
MCP 結構描述加入提示，即可檢查 MCP 簽章：

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "調查閘道記錄",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` 會傳回從 MCP 工具中繼資料推斷出的精簡宣告：

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

宣告檔案是虛擬的，不會寫入工作區或狀態
目錄。對每個程式碼模式的 `exec` 呼叫，OpenClaw 都會建置該次執行範圍內的工具
目錄、保留可見的 MCP 項目、呈現 `mcp/index.d.ts` 以及每個
可見伺服器各一個 `mcp/<server>.d.ts`，並將該小型唯讀資料表
注入 QuickJS 工作者。客體程式碼只能看到 `API` 物件：
`API.list(prefix?)` 會傳回檔案中繼資料，而 `API.read(path)` 會傳回
所選的宣告內容。未知路徑及 `.`/`..` 區段會遭到
拒絕。

如此可避免將大型 MCP 結構描述放入模型提示：代理程式會從
`exec` 工具描述得知虛擬 API 的存在，只讀取所需的
宣告檔案，然後以一個物件引數呼叫 `MCP.<server>.<tool>()`。
`MCP.<server>.$api()` 仍可作為程式內單一工具結構描述回應的
行內後援方式使用。

客體執行階段永遠不會直接看到主機物件。輸入與輸出會以
與 JSON 相容的值跨越橋接器，且具有明確的大小上限。

## 內部命名空間

內部命名空間讓程式碼模式能提供精簡的領域 API，而不必新增更多
模型可見的工具。由載入器擁有的整合會註冊如
`Issues` 或 `Calendar` 的命名空間；客體程式碼接著會在
QuickJS 程式內呼叫該命名空間，而模型仍只會看到精簡的控制／直接介面。

目前命名空間僅供內部使用。沒有公開的外掛 SDK 命名空間 API：
外部外掛命名空間需要由載入器擁有的合約，確保外掛身分、
已安裝資訊清單、驗證狀態及快取的目錄描述元不會與
支援該命名空間的外掛工具產生偏差。核心程式碼模式僅擁有
沙箱、序列化、目錄管控及橋接分派。

客體程式碼可使用直接全域變數或 `namespaces` 對應表：

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 登錄生命週期

命名空間登錄是程序本機的，並以命名空間 ID 為索引鍵：

1. 受信任的載入器會呼叫 `registerCodeModeNamespaceForPlugin(pluginId, registration)`。
2. 程式碼模式會為該次執行建立隱藏的 `ToolSearchRuntime`，並讀取其
   執行範圍目錄。
3. `createCodeModeNamespaceRuntime(ctx, catalog)` 僅保留
   `requiredToolNames` 全部可見且由同一個 `pluginId` 擁有的登錄。
4. 每個可見的命名空間都會為目前執行呼叫 `createScope(ctx)`，
   並接收 `agentId`、`sessionKey`、`sessionId`、
   `runId`、設定及中止狀態等執行環境資訊。
5. 範圍資料會序列化為純描述元，並以直接全域變數及
   `namespaces.<globalName>` 的形式注入 QuickJS。
6. 客體呼叫會透過工作者橋接暫停，在主機上解析命名空間路徑，
   將呼叫對應至已宣告、由外掛擁有的目錄工具，並
   透過 `ToolSearchRuntime.callExactId` 執行該工具。
7. 就緒的命名空間橋接呼叫會在有效的
   `exec`/`wait` 呼叫內自動清空；若逾時時命名空間工作仍在等待中，
   或客體明確讓出執行權，`wait` 會在稍後恢復同一個命名空間執行階段。
8. 外掛復原或解除安裝時會呼叫
   `clearCodeModeNamespacesForPlugin(pluginId)`，避免過時的全域變數在外掛載入失敗後
   繼續存在。

命名空間呼叫就是目錄工具呼叫：它們會使用與
`tools.call(...)` 相同的政策掛鉤、核准、中止處理、遙測、逐字稿投影及
暫停／恢復行為。

### 登錄形式

請從擁有支援工具的整合註冊命名空間。保持範圍精簡，
且只公開會對應至已宣告目錄工具的領域動詞。

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "目前儲存庫的 GitHub 議題輔助工具。",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "使用 Issues.list(params) 和 Issues.update(number, patch)。",
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

`createCodeModeNamespaceTool(toolName, inputMapper)` 會將範圍成員標記為
可呼叫的命名空間函式。選用的 `inputMapper` 會接收客體
引數，並傳回支援目錄工具的輸入物件；若未提供，
則使用第一個客體引數，省略時則使用 `{}`。

原始主機函式會在客體程式碼執行前遭到拒絕：

```typescript
createScope: () => ({
  // 錯誤：這會繞過目錄工具生命週期，因此將遭拒絕。
  list: async () => githubClient.listIssues(),
});
```

### 所有權與可見性

命名空間所有權會繫結至登錄呼叫者的 `pluginId`。
`requiredToolNames` 同時是可見性閘門及所有權檢查：

- 每個必要工具都必須存在於執行目錄中
- 每個必要工具都必須具有 `sourceName === pluginId`
- 若有任何必要工具不存在或由
  另一個外掛擁有，命名空間便會隱藏
- 每個可呼叫路徑只能指向 `requiredToolNames` 中指定的工具

這可防止另一個外掛透過登錄同名工具來公開命名空間，
並讓命名空間與一般代理程式政策保持一致：若該次執行看不到
支援工具，就也看不到命名空間。

例如，GitHub 命名空間應位於 GitHub 擁有的外掛之後，該外掛
擁有 GitHub 驗證、REST/GraphQL 用戶端、速率限制、寫入核准及
測試。核心程式碼模式不應內嵌 GitHub 專用 API、權杖處理
或供應商政策。

### 範圍序列化規則

`createScope(ctx)` 可傳回包含與 JSON 相容的
值、陣列、巢狀物件及 `createCodeModeNamespaceTool(...)` 呼叫
標記的純物件。主機物件永遠不會直接進入 QuickJS。

序列化程式會拒絕：

- 原始函式
- 循環物件圖
- 不安全的路徑區段：`__proto__`、`constructor`、`prototype`、空白索引鍵，
  或包含內部路徑分隔符號的索引鍵
- 不是 JavaScript 識別碼的 `globalName` 值
- `globalName` 與內建程式碼模式全域變數衝突，例如 `tools`、
  `namespaces`、`text`、`json`、`yield_control`、`MCP`、`API`、`ALL_TOOLS` 或
  `__openclaw*`

無法序列化為 JSON 的值會先轉換為 JSON 安全的後援
值，再跨越橋接器。二進位資料、控制代碼、通訊端、用戶端及
類別執行個體應留在一般目錄工具之後。

### 提示

只有當命名空間在該次執行中可見時，其 `description` 及選用的
`prompt` 才會附加至模型可見的 `exec` 結構描述。請使用
它們來教導最精簡且實用的介面：

```typescript
{
  description: "小說製作服務輔助工具。",
  prompt:
    "使用 Fictions.riskAudit()、Fictions.promoteIfReady(id, status) 和 Fictions.unpaidOver(amount)。",
}
```

提示應聚焦於命名空間合約，而非驗證設定、實作歷程或不相關的外掛行為。

### 清理

命名空間是程序本機註冊項目。當擁有它們的外掛遭停用、解除安裝或回復時，請移除這些項目：

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

程式碼模式的清理由外掛負責；當外掛生命週期結束時，應清除該外掛的命名空間註冊項目，而不是保留各命名空間的拆卸控制代碼。測試可以呼叫 `clearCodeModeNamespacesForTest()`，以免註冊項目在測試案例之間洩漏。

### 測試檢查清單

命名空間變更應涵蓋安全邊界與客體行為：

- 只有在後端工具可見時，命名空間提示文字才會出現
- 來自另一個 `sourceName` 的同名工具不會公開該命名空間
- 拒絕原始範圍函式
- 拒絕偽造的命名空間 ID 與偽造的路徑
- 可呼叫路徑不得指向未宣告的工具
- 巢狀物件與共用參照能正確序列化
- 命名空間呼叫會透過目錄工具執行，並傳回可安全轉換為 JSON 的詳細資料
- 客體程式碼可以捕捉失敗
- 暫停的命名空間呼叫會透過 `wait` 恢復
- 外掛回復會清除所屬的命名空間註冊項目

命名空間可補充通用的 `tools.search`/`tools.call` 目錄：任意已啟用的 OpenClaw、外掛與用戶端工具應使用該目錄；MCP 工具應使用 `MCP`；其他命名空間則用於由外掛擁有且有文件記載的領域 API，適合以精簡程式碼取代反覆查詢結構描述，以提高可靠性。

## 輸出 API

- `text(value)` 將人類可讀的輸出附加至 `output` 陣列。
- `json(value)` 在進行 JSON 相容序列化後，附加一個結構化輸出項目。
- 客體程式碼最終傳回的值，會成為 `completed` 結果中的 `value`。

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

規則：輸出順序與客體呼叫順序一致；輸出上限由 `maxOutputBytes` 設定；無法序列化的值會轉換為純文字字串或錯誤；不支援二進位值。圖片與檔案透過一般 OpenClaw 工具傳遞，而非程式碼模式橋接器。

## 工具目錄

隱藏目錄包含套用有效政策篩選後的工具，順序如下：OpenClaw 核心工具、隨附外掛工具、外部外掛工具、MCP 工具，最後是目前執行階段由用戶端提供的工具。

目錄 ID 在單次執行期間保持穩定，且在可行情況下，對等效工具集具有確定性。實際格式：

```text
<source>:<owner>:<tool-name>
```

其中 `<source>` 為 `openclaw`、`mcp` 或 `client`（外掛工具使用 `openclaw`，並以外掛 ID 作為 `<owner>`；核心工具使用 `openclaw:core:*`）。
範例：

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

目錄會省略程式碼模式控制工具（`exec`、`wait`、`tool_search_code`、`tool_search`、`tool_describe`、`tool_call`）與僅限直接呼叫的工具。控制工具不得透過目錄遞迴呼叫；僅限直接呼叫的工具仍對模型可見，因為其結構化結果無法跨越 QuickJS 橋接器。

MCP 項目會保留在執行階段範圍的目錄中，使政策、核准、掛鉤、遙測、逐字稿投影與確切工具 ID 能與一般工具執行共用。面向客體的 `ALL_TOOLS`、`tools.search(...)`、`tools.describe(...)`、`tools.callValue(...)` 與 `tools.call(...)` 檢視會省略 MCP 項目。產生的 `MCP.<server>.<tool>({ ...input })` 命名空間會解析回確切的目錄 ID，並透過相同的執行器路徑分派。

## 工具搜尋互動

在程式碼模式啟用的執行階段中，程式碼模式會取代 OpenClaw 工具搜尋模型介面。

當 `tools.codeMode.enabled` 為 true 且程式碼模式啟用時：

- OpenClaw 不會將 `tool_search_code`、`tool_search`、`tool_describe` 或 `tool_call` 公開為模型可見工具。
- 相同的目錄化概念會移入客體執行環境。
- 客體執行環境會接收精簡的 `ALL_TOOLS` 中繼資料，以及非 MCP 工具的搜尋／描述／呼叫輔助工具。
- MCP 呼叫使用產生的 `MCP` 命名空間及其 `$api()` 標頭，而非 `tools.call(...)`。
- 巢狀呼叫會透過工具搜尋所使用的同一條 OpenClaw 執行器路徑分派。

請參閱[工具搜尋](/zh-TW/tools/tool-search)，以瞭解在啟用的執行階段中由程式碼模式取代的 OpenClaw 精簡目錄橋接器。

## 工具名稱與衝突

模型可見的 `exec` 工具是程式碼模式工具。如果一般 OpenClaw shell `exec` 工具已啟用，該工具會對模型隱藏，並像其他工具一樣加入目錄。

在客體執行環境內：

- 若政策允許，`tools.call("openclaw:core:exec", input)` 可以呼叫 shell exec 工具。
- 只有在 shell exec 目錄項目具有明確且安全的名稱時，才會安裝 `tools.exec(...)`。
- 程式碼模式的 `exec` 工具永遠無法透過 `tools` 遞迴使用。

如果兩個工具正規化為相同的安全便利名稱，OpenClaw 會省略該便利函式，並要求使用 `tools.call(id, input)`。

## 巢狀工具執行

每個巢狀工具呼叫都會跨越主機橋接器並重新進入 OpenClaw，同時保留下列內容：作用中的代理程式 ID、工作階段 ID 與金鑰、傳送者與頻道內容、沙箱政策、核准政策、外掛 `before_tool_call` 掛鉤、中止訊號、可用時的串流更新，以及軌跡／稽核事件。

巢狀呼叫會以真正的工具呼叫形式投影至逐字稿，使支援套件能顯示實際發生的情況；投影內容會識別父層程式碼模式工具呼叫與巢狀工具 ID。

最多允許 `maxPendingToolCalls` 個平行巢狀呼叫。

## 執行與快照生命週期

每次程式碼模式執行都會在程序內對應表中以 `runId` 作為索引鍵追蹤（不會持久保存至磁碟或資料庫）。`exec`/`wait` 會傳回三種結果狀態之一：`completed`、`waiting` 或 `failed`。

- `waiting` 結果會儲存 QuickJS 快照、待處理的橋接要求與範圍中繼資料（代理程式執行 ID、工作階段 ID／金鑰），直到 `wait` 恢復執行或其到期。
- 已到期、工作階段錯誤、執行階段錯誤，以及未知／已在恢復中的 `runId` 值不會產生不同的終止狀態；它們會顯示為 `failed` 結果（`code: "invalid_input"`），並附帶如 `code mode
run is unavailable or expired.` 或 `code mode run belongs to a different
session.` 的訊息。
- 執行的快照一旦確定為 `completed` 或 `failed`，便會立即從對應表中移除；也會在閘道關閉時捨棄（重新啟動後不會保留任何內容：這是暫時性的執行階段狀態）。
- 針對唯讀工作，`exec` 可以設定 `restartSafe: true`。接著 OpenClaw 會在執行前拒絕會產生副作用的目錄呼叫與外掛命名空間，並將暫停的結果標記為可安全重播。如果重新啟動中斷 `wait`，[重新啟動復原](/zh-TW/gateway/restart-recovery)會從逐字稿重建該輪，而不是還原程序本機快照。復原輪本身仍僅限於經稽核的唯讀核心工具，以及明確標記為可安全重播的外掛工具。
- OpenClaw 將每個程序同時暫停的執行數量限制為 64，超過此上限的新暫停要求會以 `too many suspended code mode
runs.` 拒絕。

快照儲存空間受每次執行的 `maxSnapshotBytes`、上述每個程序的暫停執行上限，以及 `snapshotTtlSeconds` 限制。

## QuickJS-WASI 執行環境

OpenClaw 會在所屬套件中將 `quickjs-wasi` 載入為直接相依性；不依賴為不相關相依性安裝的間接副本。

執行環境職責：編譯／載入 QuickJS-WASI WebAssembly 模組；為每次程式碼模式執行或恢復建立一個隔離的 VM；以穩定名稱註冊主機回呼；設定記憶體與中斷限制；評估 JavaScript；清空待處理工作；建立暫停 VM 狀態的快照；為 `wait` 還原快照；在終止狀態後釋放 VM 控制代碼與快照。

執行環境在 Node.js 工作執行緒中執行，位於 OpenClaw 主事件迴圈之外。客體中的無限迴圈不得無限期阻塞閘道程序；工作執行緒的中斷處理常式會獨立於客體程式碼是否配合，強制執行實際經過時間的逾時限制。

## TypeScript

TypeScript 支援僅是原始碼轉換：接受的輸入是一個 TypeScript 程式碼字串；輸出是由 QuickJS-WASI 評估的 JavaScript 字串。不進行型別檢查與模組解析，也沒有 `import`/`require`。診斷會以 `failed` 結果傳回。

TypeScript 編譯器只會針對 TypeScript 儲存格延遲載入；純 JavaScript 儲存格與停用的程式碼模式永遠不會載入它。

## 安全邊界

模型程式碼具有敵意。執行環境採用縱深防禦：

- 在主事件迴圈之外的工作執行緒中執行 QuickJS-WASI
- 將 `quickjs-wasi` 載入為直接相依性，而非透過 Codex 或間接套件載入
- 客體中沒有檔案系統、網路、子程序、模組匯入、環境變數或主機全域物件
- 使用 QuickJS 記憶體與中斷限制，加上父程序的實際經過時間逾時
- 強制執行輸出、快照、記錄與待處理呼叫上限
- 透過範圍受限的 JSON 配接器序列化主機橋接值
- 將主機錯誤轉換為純客體錯誤，絕不傳遞主機領域物件
- 在逾時、中止、工作階段結束或到期時捨棄快照
- 拒絕遞迴存取 `exec`、`wait` 與工具搜尋控制工具
- 防止便利名稱衝突遮蔽目錄輔助工具

沙箱是其中一層安全防護；對於高風險部署，操作者可能仍需進行作業系統層級的強化。

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

`invalid_input` 涵蓋無效的 `exec`/`wait` 引數、已停用的語言、遭拒絕的模組存取、TypeScript 轉換失敗、未知／已到期／範圍錯誤的 `runId` 值，以及過多的暫停執行。`runtime_unavailable` 涵蓋無法啟動或以非零狀態結束的 QuickJS 工作執行緒。

傳回客體的錯誤是純資料；主機 `Error` 執行個體、堆疊物件、原型與主機函式不會進入 QuickJS。

## 遙測

每個結果的 `telemetry` 欄位會回報：隱藏目錄大小與來源細分（`openclaw`/`mcp`/`client` 計數）、該執行目錄的累計搜尋／描述／呼叫次數，以及模型可見的工具名稱（`exec`、`wait` 與保留的僅限直接呼叫工具）。

除非符合現有 OpenClaw 軌跡政策，遙測不得包含密鑰、原始環境值或未遮蔽的工具輸入。

## 偵錯

當程式碼模式的行為與一般工具執行不同時，請使用針對性的模型傳輸記錄：

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

針對承載資料形狀的偵錯，請使用 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`。
這會記錄一份有大小上限且已遮蔽敏感資訊的模型請求 JSON 快照；請僅在
偵錯期間使用，因為提示詞和訊息文字仍可能出現。

針對串流偵錯，請使用 `OPENCLAW_DEBUG_SSE=peek` 記錄前五個
已遮蔽敏感資訊的 SSE 事件。程式碼模式介面啟用後，如果最終供應商
承載資料未恰好包含一個 `exec`、一個 `wait`，以及僅有核准的
僅限直接呼叫工具，程式碼模式也會採取失敗關閉。

## 實作配置

- 設定契約：`tools.codeMode`
- 目錄建構器：將有效工具轉換為精簡項目和 ID 對應表
- 模型介面配接器：以控制／直接呼叫工具取代可見工具
- QuickJS-WASI 執行階段配接器：載入、求值、建立快照、還原、釋放
- 工作程序監督器：逾時、中止、當機隔離
- 橋接配接器：JSON 安全的主機回呼與結果傳遞
- TypeScript 轉換配接器
- 快照儲存區：TTL、大小上限、執行／工作階段範圍
- 巢狀工具呼叫的軌跡投影
- 遙測計數器與診斷

此實作會重用工具搜尋中的目錄與執行器概念，但
不會使用 `node:vm` 子項目作為沙箱。

## 驗證檢查清單

程式碼模式的涵蓋範圍應證明：

- 停用的設定會讓現有工具公開方式維持不變
- 缺少 `enabled: true` 的物件設定會讓程式碼模式維持停用
- 啟用的設定會在該次執行的工具為啟用狀態時，向
  模型公開 `exec`、`wait`，以及僅有必要的僅限直接呼叫工具
- 原始的無工具執行、`disableTools` 和空白允許清單不會觸發
  程式碼模式承載資料強制檢查
- 所有符合目錄資格的有效非 MCP 工具都會出現在 `ALL_TOOLS` 中
- 僅限直接呼叫工具會維持對模型可見，且不會出現在 `ALL_TOOLS` 中
- 遭拒絕的工具不會出現在 `ALL_TOOLS` 中
- `tools.search`、`tools.describe`、`tools.callValue` 和 `tools.call` 可用於 OpenClaw 工具
- `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")` 無須橋接／工具呼叫即可公開 TypeScript 風格的
  MCP 宣告
- MCP 命名空間 `$api()` 仍可作為結構描述的行內備援
- 命名空間呼叫可搭配單一物件輸入用於可見的 MCP 工具，而
  直接 MCP 目錄項目不會出現在 `tools.*` 中
- 工具搜尋控制工具會同時從模型介面和
  隱藏目錄中隱藏
- 巢狀呼叫會保留核准與掛鉤行為
- Shell `exec` 對模型隱藏，但在允許時可透過目錄 ID 呼叫
- 遞迴程式碼模式 `exec` 和 `wait` 無法從客體程式碼呼叫
- TypeScript 輸入會經過轉換與求值，且不會在
  停用或僅限 JavaScript 的路徑載入 TypeScript
- `import`、`require`、檔案系統、網路與環境存取都會失敗
- 無限迴圈會逾時，且無法阻塞閘道
- 記憶體上限失敗會終止客體 VM
- 已完成和暫停的呼叫都會強制執行輸出與快照上限
- `wait` 會恢復暫停的快照並傳回最終值
- 已過期、已中止、工作階段錯誤和未知的 `runId` 值都會失敗
- 逐字稿重播與持久化會保留程式碼模式控制呼叫
- 逐字稿與遙測會清楚顯示巢狀工具呼叫

## E2E 測試計畫

變更執行階段時，請將下列項目作為整合或端對端測試執行：

1. 使用 `tools.codeMode.enabled: false` 啟動閘道。
2. 傳送包含一小組直接呼叫工具的代理程式回合。
3. 斷言模型可見的工具維持不變。
4. 使用 `tools.codeMode.enabled: true` 重新啟動。
5. 傳送包含 OpenClaw、外掛、MCP 和用戶端測試工具的代理程式回合。
6. 斷言模型可見工具清單為 `exec`、`wait`，再加上僅有已設定的
   僅限直接呼叫工具。
7. 在 `exec` 中，讀取 `ALL_TOOLS`，並斷言符合目錄資格的有效測試
   工具存在，而僅限直接呼叫工具不存在。
8. 在 `exec` 中，透過 `tools.search`、
   `tools.describe` 和 `tools.callValue`（或原始 `tools.call`）呼叫 OpenClaw／外掛／用戶端工具。
9. 在 `exec` 中，呼叫 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，並
   斷言宣告檔案描述了可見的 MCP 工具。
10. 在 `exec` 中，透過 `MCP.<server>.<tool>({ ...input })` 呼叫 MCP 工具，並
    斷言直接 MCP 目錄項目不存在於 `ALL_TOOLS` 和
    `tools.*` 中。
11. 斷言遭拒絕的工具不存在，且無法透過猜測的 ID 呼叫。
12. 啟動巢狀工具呼叫，該呼叫會在 `exec` 傳回 `waiting` 後解析。
13. 呼叫 `wait`，並斷言已還原的 VM 收到工具結果。
14. 斷言最終答案包含還原後產生的輸出。
15. 斷言逾時、中止和快照過期會清理執行階段狀態。
16. 匯出軌跡，並斷言巢狀呼叫顯示在父層
    程式碼模式呼叫之下。

僅變更此頁面文件時，仍應執行 `pnpm check:docs`。

## 相關內容

- [群集](/tools/swarm)，用於從程式碼模式指令碼進行扇出式代理程式協調
- [工具搜尋](/zh-TW/tools/tool-search)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [Exec 工具](/zh-TW/tools/exec)
- [程式碼執行](/zh-TW/tools/code-execution)
