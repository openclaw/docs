---
read_when:
    - 重構 ACP 工作階段生命週期或 ACPX 程序清理
    - 偵錯 ACPX 孤兒行程、PID 重複使用或多 Gateway 清理安全性
    - 變更產生的 ACP 或子代理工作階段的 sessions_list 可見性
    - 設計背景工作、ACP 工作階段或處理程序租約的擁有權中繼資料
sidebarTitle: ACP lifecycle refactor
summary: 明確化 ACP 工作階段與 ACPX 處理程序所有權的遷移計畫
title: ACP 生命週期重構
x-i18n:
    generated_at: "2026-05-07T13:25:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ACP 生命週期目前可以運作，但有太多部分是在事後推斷出來的。
程序清理會從 PID、命令字串、包裝程式
路徑，以及即時程序表重建所有權。工作階段可見性則會從工作階段金鑰字串加上次要的 `sessions.list({ spawnedBy })` 查詢
重建所有權。
這讓窄範圍修正成為可能，但也讓邊界情況很容易被漏掉：
PID 重複使用、帶引號的命令、配接器孫程序、多 Gateway 狀態根目錄、
`cancel` 對 `close`，以及 `tree` 對 `all` 可見性，都變成各自
重新發現同一套所有權規則的地方。

這次重構會讓所有權成為一級概念。目標不是新的 ACP 產品
介面；而是為既有 ACP 與 ACPX 行為建立更安全的內部契約。

## 目標

- 除非目前的即時證據符合 OpenClaw 擁有的租約，否則清理絕不會向程序發送訊號。
- `cancel`、`close` 和啟動時回收具有不同的生命週期意圖。
- `sessions_list`、`sessions_history`、`sessions_send` 和狀態檢查使用
  相同的請求者擁有工作階段模型。
- 多 Gateway 安裝不能回收彼此的 ACPX 包裝程式。
- 舊的 ACPX 工作階段記錄在遷移期間仍可繼續運作。
- 執行階段仍由 Plugin 擁有；核心不會了解 ACPX 套件細節。

## 非目標

- 取代 ACPX 或變更公開的 `/acp` 命令介面。
- 將廠商特定的 ACP 配接器行為移入核心。
- 要求使用者升級前手動清理狀態。
- 讓 `cancel` 關閉可重用的 ACP 工作階段。

## 目標模型

### Gateway 執行個體身分

每個 Gateway 程序都應有穩定的執行階段執行個體 ID：

```ts
type GatewayInstanceId = string;
```

它可以在 Gateway 啟動時產生，並在該安裝的生命週期內持久保存在狀態中。
它不是安全機密；而是用來避免將某個 Gateway 的 ACP 程序
與另一個 Gateway 程序混淆的所有權區分器。

### ACP 工作階段所有權

每個衍生的 ACP 工作階段都應具有標準化的所有權中繼資料：

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway 應在已知這些欄位的工作階段列上回傳它們。
可見性篩選應是對列中繼資料的純檢查：

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

這會從可見性檢查中移除隱藏的次要 `sessions.list({ spawnedBy })` 呼叫。
衍生的跨代理 ACP 子工作階段是請求者擁有的，因為列本身如此表示，
而不是因為第二個查詢剛好找到它。

### ACPX 程序租約

每次產生的包裝程式啟動都應建立一筆租約記錄：

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

包裝程式程序應在其環境中收到租約 ID 和 Gateway 執行個體 ID：

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

平台允許時，驗證應優先使用不會因命令引號而混淆的即時程序中繼資料：

- 根 PID 仍然存在
- 即時包裝程式路徑位於 `wrapperRoot` 底下
- 可用時，程序群組與租約相符
- 可讀取時，環境包含預期的租約 ID
- 命令雜湊或可執行檔路徑與租約相符

如果無法驗證即時程序，清理會以關閉失敗的方式處理。

## 生命週期控制器

導入一個 ACPX 生命週期控制器，負責程序租約與清理
政策：

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` 只會請求取消回合。它不得回收可重用的包裝程式
或配接器程序。

`closeSession` 可以回收，但只能在載入工作階段記錄、
載入租約，並驗證即時程序樹仍屬於該
租約之後執行。

`reapStartupOrphans` 從狀態中的開放租約開始。它可以使用程序
表尋找後代，但不應先掃描任意看似 ACP 的
命令，再判定它們大概是我們的。

## 包裝程式契約

產生的包裝程式應保持精簡。它們應該：

- 在支援的平台上，以程序群組啟動配接器
- 將正常終止訊號轉送到程序群組
- 偵測父程序死亡
- 父程序死亡時，送出 SIGTERM，然後讓包裝程式保持存活，直到 SIGKILL
  後備機制執行
- 可用時，將根 PID 和程序群組 ID 回報給生命週期控制器

包裝程式不應決定工作階段政策。它們只會為自己的配接器群組
強制執行本機程序樹清理。

## 工作階段可見性契約

可見性應使用標準化的列所有權：

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

規則：

- `self`：只有請求者工作階段。
- `tree`：請求者工作階段，加上由請求者擁有或衍生自請求者的列。
- `all`：所有同代理列、a2a 允許的跨代理列，以及請求者擁有的
  衍生跨代理列，即使一般 a2a 已停用也一樣。
- `agent`：僅同一代理，除非明確的擁有者關係表示該列
  屬於請求者。

這讓 `tree` 和 `all` 具備單調性：`all` 不得隱藏
`tree` 會顯示的已擁有子項。

## 遷移計畫

### 第 1 階段：加入身分與租約

- 將 `gatewayInstanceId` 加入 Gateway 狀態。
- 在 ACPX 狀態目錄下加入 ACPX 租約儲存區。
- 產生的包裝程式衍生前先寫入租約。
- 在新的 ACPX 工作階段記錄上儲存 `leaseId`。
- 為舊記錄保留既有 PID 與命令欄位。

### 第 2 階段：租約優先清理

- 將關閉清理改為先載入 `leaseId`。
- 發送訊號前，根據租約驗證即時程序所有權。
- 只針對舊版記錄保留目前的根 PID 與包裝程式根目錄後備機制。
- 驗證清理後，將租約標記為 `closed`。
- 當程序在清理前已消失時，將租約標記為 `lost`。

### 第 3 階段：租約優先啟動回收

- 啟動時回收會掃描開放租約。
- 對每個租約，驗證根程序並收集後代。
- 以子項優先方式回收已驗證的樹。
- 以有界保留視窗讓舊的 `closed` 和 `lost` 租約過期。
- 只將命令標記掃描保留為暫時的舊版後備機制，並盡可能由
  包裝程式根目錄和 Gateway 執行個體保護。

### 第 4 階段：工作階段所有權列

- 將所有權中繼資料加入 Gateway 工作階段列。
- 教導 ACPX、子代理、背景任務和工作階段儲存區寫入器填入
  `ownerSessionKey` 或 `spawnedBy`。
- 將工作階段可見性檢查轉換為使用列中繼資料。
- 移除可見性檢查期間的次要 `sessions.list({ spawnedBy })` 查詢。

### 第 5 階段：移除舊版啟發式

經過一個發布視窗後：

- 停止依賴儲存的根命令字串來進行非舊版 ACPX 清理
- 移除命令標記啟動掃描
- 移除可見性後備列表查詢
- 對缺失或無法驗證的租約保留防禦性的關閉失敗行為

## 測試

新增兩組表格驅動測試套件。

程序生命週期模擬器：

- PID 被不相關程序重複使用
- PID 被另一個 Gateway 的包裝程式根目錄重複使用
- 儲存的包裝程式命令經過 shell 引號處理，但即時 `ps` 命令沒有
- 配接器子程序結束，孫程序仍留在程序群組中
- 父程序死亡 SIGTERM 後備機制到達 SIGKILL
- 程序列表無法使用
- 程序缺失的過期租約
- 啟動孤兒包含包裝程式、配接器子程序和孫程序

工作階段可見性矩陣：

- `self`、`tree`、`agent`、`all`
- a2a 啟用與停用
- 同代理列
- 跨代理列
- 請求者擁有的衍生跨代理 ACP 列
- 沙盒化請求者限制為 `tree`
- 列表、歷史、傳送和狀態動作

重要不變式：請求者擁有的衍生子項，會在設定的可見性包含請求者工作階段樹的任何地方可見，而且 `all` 的能力不得低於 `tree`。

## 相容性備註

舊工作階段記錄可能沒有 `leaseId`。它們應使用舊版
關閉失敗清理路徑：

- 要求存在即時根程序
- 預期有產生的包裝程式時，要求包裝程式根目錄所有權
- 對非包裝程式根程序要求命令一致
- 絕不只根據過期的已儲存 PID 中繼資料發送訊號

如果無法驗證舊版記錄，請不要動它。啟動租約清理和
下一個發布視窗最終應會淘汰後備機制。

## 成功標準

- 關閉舊的或過期的 ACPX 工作階段時，不能殺死另一個 Gateway 的程序。
- 父程序死亡不會留下頑固的配接器孫程序繼續執行。
- `cancel` 會中止目前作用中的回合，而不會關閉可重用工作階段。
- `sessions_list` 可以在 `tree` 和 `all` 下顯示請求者擁有的跨代理 ACP 子項。
- 啟動清理由租約驅動，而不是廣泛的命令字串掃描。
- 聚焦的程序與可見性矩陣測試涵蓋先前需要一次性審查修正的每個邊界情況。
