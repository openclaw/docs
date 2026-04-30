---
read_when:
    - 偵錯「執行個體」分頁
    - 調查重複或過期的執行個體資料列
    - 變更 Gateway WS 連線或 system-event 信標
summary: OpenClaw 線上狀態項目如何產生、合併與顯示
title: 在線狀態
x-i18n:
    generated_at: "2026-04-30T03:01:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw「存在狀態」是一種輕量、盡力而為的檢視，用於查看：

- **Gateway** 本身，以及
- **連線到 Gateway 的用戶端**（mac app、WebChat、CLI 等）

存在狀態主要用於呈現 macOS app 的 **Instances** 分頁，並提供操作人員快速可見性。

## 存在狀態欄位（顯示內容）

存在狀態項目是結構化物件，包含以下欄位：

- `instanceId`（選填但強烈建議）：穩定的用戶端身分（通常是 `connect.client.instanceId`）
- `host`：易讀的主機名稱
- `ip`：盡力取得的 IP 位址
- `version`：用戶端版本字串
- `deviceFamily` / `modelIdentifier`：硬體提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node`、...
- `lastInputSeconds`：「距離上次使用者輸入的秒數」（如果已知）
- `reason`：`self`、`connect`、`node-connected`、`periodic`、...
- `ts`：上次更新時間戳記（自 epoch 起算的毫秒數）

## 產生者（存在狀態的來源）

存在狀態項目由多個來源產生並**合併**。

### 1) Gateway 自身項目

Gateway 一律會在啟動時植入一個「self」項目，讓 UI 即使在任何用戶端連線之前，也能顯示 gateway 主機。

### 2) WebSocket 連線

每個 WS 用戶端都會以 `connect` 請求開始。握手成功後，Gateway 會為該連線 upsert 一個存在狀態項目。

#### 為什麼一次性的 CLI 指令不會顯示

CLI 經常為短暫的一次性指令連線。為避免 Instances 清單被大量項目洗版，`client.mode === "cli"` **不會**轉換成存在狀態項目。

### 3) `system-event` 信標

用戶端可以透過 `system-event` 方法傳送更豐富的週期性信標。mac app 會使用此方式回報主機名稱、IP 和 `lastInputSeconds`。

### 4) Node 連線（role: node）

當 node 透過 Gateway WebSocket 以 `role: node` 連線時，Gateway 會為該 node upsert 一個存在狀態項目（流程與其他 WS 用戶端相同）。

## 合併與去重規則（為什麼 `instanceId` 很重要）

存在狀態項目會儲存在單一記憶體內 map 中：

- 項目會以**存在狀態鍵**作為索引。
- 最佳鍵是穩定的 `instanceId`（來自 `connect.client.instanceId`），可在重新啟動後延續。
- 鍵不區分大小寫。

如果用戶端重新連線時沒有穩定的 `instanceId`，可能會顯示為**重複**列。

## TTL 與有界大小

存在狀態刻意設計為暫時性：

- **TTL：** 超過 5 分鐘的項目會被修剪
- **項目上限：** 200（最舊的項目優先丟棄）

這能讓清單保持最新，並避免記憶體無限制成長。

## 遠端/隧道注意事項（loopback IP）

當用戶端透過 SSH tunnel / 本機連接埠轉送連線時，Gateway 可能會看到遠端位址為 `127.0.0.1`。為避免覆寫用戶端回報的良好 IP，會忽略 loopback 遠端位址。

## 消費者

### macOS Instances 分頁

macOS app 會呈現 `system-presence` 的輸出，並根據上次更新的時間套用小型狀態指示器（Active/Idle/Stale）。

## 偵錯提示

- 若要查看原始清單，請對 Gateway 呼叫 `system-presence`。
- 如果看到重複項目：
  - 確認用戶端在握手中傳送穩定的 `client.instanceId`
  - 確認週期性信標使用相同的 `instanceId`
  - 檢查連線衍生的項目是否缺少 `instanceId`（這種情況預期會出現重複）

## 相關

- [輸入指示器](/zh-TW/concepts/typing-indicators)
- [串流與分塊](/zh-TW/concepts/streaming)
