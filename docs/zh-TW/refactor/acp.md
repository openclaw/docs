---
read_when:
    - 重構 ACP 工作階段生命週期或 ACPX 程序清理
    - 偵錯 ACPX 孤兒處理程序、PID 重複使用或多閘道清理安全性
    - 變更已產生的 ACP 或子代理程式工作階段的 sessions_list 可見性
    - 為背景工作、ACP 工作階段或處理程序租約設計擁有權中繼資料
sidebarTitle: ACP lifecycle refactor
summary: 明確界定 ACP 工作階段與 ACPX 程序擁有權的遷移計畫
title: ACP 生命週期重構
x-i18n:
    generated_at: "2026-07-11T21:45:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

ACP 生命週期目前可以運作，但其中太多資訊是在事後推斷而來。
程序清理會根據 PID、命令字串、包裝器路徑及即時程序表重建擁有權。工作階段可見性則根據工作階段金鑰字串，加上次要的 `sessions.list({ spawnedBy })` 查詢來重建擁有權。
這讓局部修正成為可能，但也很容易遺漏邊界情況：
PID 重複使用、帶引號的命令、配接器的孫程序、多閘道狀態根目錄、
`cancel` 與 `close` 的差異，以及 `tree` 與 `all` 的可見性，都成了各自重新判定相同擁有權規則的地方。

此重構會讓擁有權成為一級概念。目標不是新增 ACP 產品介面，
而是為現有 ACP 與 ACPX 行為建立更安全的內部契約。

## 目標

- 除非目前的即時證據與 OpenClaw 擁有的租約相符，否則清理絕不向程序傳送訊號。
- `cancel`、`close` 與啟動時的殘留程序回收具有不同的生命週期意圖。
- `sessions_list`、`sessions_history`、`sessions_send` 與狀態檢查使用相同的請求者擁有工作階段模型。
- 多閘道安裝環境無法回收彼此的 ACPX 包裝器。
- 舊 ACPX 工作階段記錄在移轉期間仍可運作。
- 執行階段仍由外掛擁有；核心不會知悉 ACPX 套件細節。

## 非目標

- 取代 ACPX 或變更公開的 `/acp` 命令介面。
- 將供應商特定的 ACP 配接器行為移入核心。
- 要求使用者在升級前手動清理狀態。
- 讓 `cancel` 關閉可重複使用的 ACP 工作階段。

## 目標模型

### 閘道執行個體身分

每個閘道程序都應具有穩定的執行階段執行個體 ID：

```ts
type GatewayInstanceId = string;
```

它可在閘道啟動時產生，並於該安裝環境的生命週期內持久儲存在狀態中。
它不是安全性機密；它是擁有權判別資訊，用來避免將某個閘道的 ACP 程序誤認為另一個閘道的程序。

### ACP 工作階段擁有權

每個產生的 ACP 工作階段都應具有正規化的擁有權中繼資料：

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

閘道應在已知這些欄位時，於工作階段資料列中傳回它們。
可見性篩選應是對資料列中繼資料進行的純粹檢查：

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

這會移除可見性檢查中隱藏的次要 `sessions.list({ spawnedBy })` 呼叫。
跨代理程式產生的 ACP 子工作階段之所以由請求者擁有，是因為資料列如此記載，而不是因為第二次查詢恰好找到了它。

### ACPX 程序租約

每次啟動產生的包裝器時，都應建立一筆租約記錄：

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

包裝器程序應透過環境接收租約 ID 與閘道執行個體 ID：

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

當平台允許時，驗證應優先使用不會因命令引號而混淆的即時程序中繼資料：

- 根 PID 仍然存在
- 即時包裝器路徑位於 `wrapperRoot` 之下
- 可取得時，程序群組與租約相符
- 可讀取時，環境包含預期的租約 ID
- 命令雜湊或可執行檔路徑與租約相符

若無法驗證即時程序，清理就會採取封閉式失敗。

## 生命週期控制器

引入單一 ACPX 生命週期控制器，負責程序租約與清理政策：

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

`cancelTurn` 僅請求取消目前回合。它不得回收可重複使用的包裝器或配接器程序。

`closeSession` 可以進行回收，但必須先載入工作階段記錄、載入租約，並驗證即時程序樹仍屬於該租約。

`reapStartupOrphans` 從狀態中的開啟租約開始。它可以使用程序表尋找子孫程序，但不應先掃描任意看似 ACP 的命令，再判定它們可能屬於本執行個體。

## 包裝器契約

產生的包裝器應保持精簡。它們應：

- 在支援的平台上，於程序群組中啟動配接器
- 將一般終止訊號轉送至程序群組
- 偵測父程序死亡
- 父程序死亡時，傳送 SIGTERM，然後讓包裝器維持執行，直到 SIGKILL 備援機制執行
- 可取得時，將根 PID 與程序群組 ID 回報給生命週期控制器

包裝器不應決定工作階段政策。它們只負責對自身配接器群組執行區域程序樹清理。

## 工作階段可見性契約

可見性應使用正規化的資料列擁有權：

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

- `self`：僅請求者工作階段。
- `tree`：請求者工作階段，加上由請求者擁有或從請求者產生的資料列。
- `all`：所有相同代理程式的資料列、a2a 允許的跨代理程式資料列，以及由請求者擁有且跨代理程式產生的資料列，即使一般 a2a 已停用亦同。
- `agent`：僅限相同代理程式，除非明確的擁有者關係表示該資料列屬於請求者。

這會使 `tree` 與 `all` 保持單調性：`all` 不得隱藏 `tree` 會顯示的已擁有子工作階段。

## 移轉計畫

### 第一階段：加入身分與租約

- 將 `gatewayInstanceId` 加入閘道狀態。
- 在 ACPX 狀態目錄下新增 ACPX 租約儲存區。
- 在產生的包裝器啟動前寫入租約。
- 在新的 ACPX 工作階段記錄中儲存 `leaseId`。
- 為舊記錄保留現有的 PID 與命令欄位。

### 第二階段：租約優先的清理

- 將關閉清理改為優先載入 `leaseId`。
- 傳送訊號前，先依據租約驗證即時程序的擁有權。
- 僅針對舊版記錄保留目前的根 PID 與包裝器根目錄備援機制。
- 完成驗證後的清理，將租約標記為 `closed`。
- 當程序在清理前已消失時，將租約標記為 `lost`。

### 第三階段：租約優先的啟動回收

- 啟動時的回收會掃描開啟的租約。
- 對每筆租約驗證根程序並收集子孫程序。
- 以子程序優先順序回收已驗證的程序樹。
- 使用有上限的保留期間，讓舊的 `closed` 與 `lost` 租約到期。
- 命令標記掃描僅作為暫時的舊版備援機制，並盡可能以包裝器根目錄與閘道執行個體加以防護。

### 第四階段：工作階段擁有權資料列

- 將擁有權中繼資料加入閘道工作階段資料列。
- 讓 ACPX、子代理程式、背景工作及工作階段儲存區的寫入端填入 `ownerSessionKey` 或 `spawnedBy`。
- 將工作階段可見性檢查轉換為使用資料列中繼資料。
- 移除可見性判定期間的次要 `sessions.list({ spawnedBy })` 查詢。

### 第五階段：移除舊版啟發式判定

經過一個版本週期後：

- 非舊版 ACPX 清理不再依賴儲存的根命令字串
- 移除命令標記的啟動掃描
- 移除可見性備援清單查詢
- 對缺少或無法驗證的租約，保留防禦性的封閉式失敗行為

## 測試

新增兩個表格驅動測試套件。

程序生命週期模擬器：

- PID 被不相關程序重複使用
- PID 被另一個閘道的包裝器根程序重複使用
- 儲存的包裝器命令帶有殼層引號，但即時 `ps` 命令沒有
- 配接器子程序結束，但孫程序仍留在程序群組中
- 父程序死亡後的 SIGTERM 備援最終執行 SIGKILL
- 無法取得程序清單
- 程序缺失的過期租約
- 包含包裝器、配接器子程序與孫程序的啟動殘留程序

工作階段可見性矩陣：

- `self`、`tree`、`agent`、`all`
- a2a 啟用與停用
- 相同代理程式的資料列
- 跨代理程式的資料列
- 由請求者擁有且跨代理程式產生的 ACP 資料列
- 受沙箱限制的請求者被限制為 `tree`
- 清單、歷史記錄、傳送與狀態動作

重要的不變條件：只要設定的可見性包含請求者工作階段樹，由請求者擁有且產生的子工作階段就必須可見，而且 `all` 的能力不得低於 `tree`。

## 相容性注意事項

舊工作階段記錄可能沒有 `leaseId`。它們應使用舊版的封閉式失敗清理路徑：

- 要求即時根程序存在
- 預期使用產生的包裝器時，要求包裝器根目錄擁有權
- 對非包裝器根程序要求命令一致
- 絕不僅根據過期的已儲存 PID 中繼資料傳送訊號

若無法驗證舊版記錄，請勿處理。啟動租約清理與下一個版本週期最終應淘汰此備援機制。

## 成功標準

- 關閉舊有或過期的 ACPX 工作階段時，不會終止另一個閘道的程序。
- 父程序死亡後，不會留下難以終止的配接器孫程序持續執行。
- `cancel` 會中止目前回合，而不關閉可重複使用的工作階段。
- 在 `tree` 與 `all` 下，`sessions_list` 都能顯示由請求者擁有的跨代理程式 ACP 子工作階段。
- 啟動清理由租約驅動，而非廣泛掃描命令字串。
- 聚焦的程序與可見性矩陣測試涵蓋先前需要逐一審查修正的每個邊界情況。
