---
read_when:
    - 偵錯「執行個體」分頁
    - 調查重複或過時的執行個體資料列
    - 變更 Gateway WS 連線或 system-event 信標
summary: OpenClaw 狀態項目的產生、合併與顯示方式
title: 線上狀態
x-i18n:
    generated_at: "2026-05-06T02:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 的「存在狀態」是以下項目的輕量、盡力而為檢視：

- **Gateway** 本身，以及
- **連線到 Gateway 的用戶端**（Mac 應用程式、WebChat、CLI 等）

存在狀態主要用於呈現 macOS 應用程式的 **Instances** 分頁，並提供操作員快速可見性。

## 存在狀態欄位（顯示的內容）

存在狀態項目是結構化物件，包含如下欄位：

- `instanceId`（選填但強烈建議）：穩定的用戶端身分（通常是 `connect.client.instanceId`）
- `host`：方便人類閱讀的主機名稱
- `ip`：盡力取得的 IP 位址
- `version`：用戶端版本字串
- `deviceFamily` / `modelIdentifier`：硬體提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node`、...
- `lastInputSeconds`：「自上次使用者輸入後經過的秒數」（若已知）
- `reason`：`self`、`connect`、`node-connected`、`periodic`、...
- `ts`：最後更新時間戳記（自 epoch 起算的毫秒數）

## 產生者（存在狀態的來源）

存在狀態項目由多個來源產生並**合併**。

### 1) Gateway 自身項目

Gateway 一律會在啟動時植入一個「自身」項目，因此即使還沒有任何用戶端連線，UI 也會顯示 Gateway 主機。

### 2) WebSocket 連線

每個 WS 用戶端都會以 `connect` 請求開始。握手成功後，Gateway 會為該連線 upsert 一個存在狀態項目。

#### 為什麼一次性的 CLI 指令不會顯示

CLI 通常只會為短暫的一次性指令連線。為了避免讓 Instances 清單充滿雜訊，`client.mode === "cli"` **不會**轉換成存在狀態項目。

### 3) `system-event` 信標

用戶端可以透過 `system-event` 方法傳送更豐富的週期性信標。Mac 應用程式會使用這個方式回報主機名稱、IP 和 `lastInputSeconds`。

### 4) Node 連線（role: node）

當某個 Node 透過 Gateway WebSocket 並帶著 `role: node` 連線時，Gateway 會為該 Node upsert 一個存在狀態項目（流程與其他 WS 用戶端相同）。

## 合併與去重規則（為什麼 `instanceId` 很重要）

存在狀態項目會儲存在單一記憶體內映射中：

- 項目會以**存在狀態鍵**作為索引。
- 最佳鍵是穩定的 `instanceId`（來自 `connect.client.instanceId`），可在重新啟動後延續。
- 鍵不區分大小寫。

如果用戶端在沒有穩定 `instanceId` 的情況下重新連線，它可能會顯示成**重複**列。

## TTL 與有界大小

存在狀態刻意設計為暫時性：

- **TTL：** 早於 5 分鐘的項目會被修剪
- **最大項目數：** 200（最舊的優先捨棄）

這能讓清單保持新鮮，並避免記憶體無界成長。

## 遠端/通道注意事項（loopback IP）

當用戶端透過 SSH 通道 / 本機連接埠轉送連線時，Gateway 看到的遠端位址可能是 `127.0.0.1`。為了避免覆寫用戶端回報的良好 IP，會忽略 loopback 遠端位址。

## 消費者

### macOS Instances 分頁

macOS 應用程式會呈現 `system-presence` 的輸出，並根據最後更新的時間套用一個小型狀態指示器（Active/Idle/Stale）。

## 偵錯提示

- 若要查看原始清單，請對 Gateway 呼叫 `system-presence`。
- 如果你看到重複項目：
  - 確認用戶端在握手中傳送穩定的 `client.instanceId`
  - 確認週期性信標使用相同的 `instanceId`
  - 檢查連線衍生的項目是否缺少 `instanceId`（此時預期會有重複項目）

## 相關內容

<CardGroup cols={2}>
  <Card title="輸入指示器" href="/zh-TW/concepts/typing-indicators" icon="ellipsis">
    何時傳送輸入指示器，以及如何調整它們。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    對外串流、分塊，以及每個通道的格式設定。
  </Card>
  <Card title="Gateway 架構" href="/zh-TW/concepts/architecture" icon="diagram-project">
    Gateway 元件，以及驅動存在狀態更新的 WebSocket 協定。
  </Card>
  <Card title="Gateway 協定" href="/zh-TW/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的線路協定。
  </Card>
</CardGroup>
