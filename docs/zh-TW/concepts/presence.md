---
read_when:
    - 除錯執行個體分頁
    - 調查重複或過時的執行個體資料列
    - 變更閘道 WS 連線或系統事件信標
summary: OpenClaw 線上狀態項目的產生、合併與顯示方式
title: 線上狀態
x-i18n:
    generated_at: "2026-07-05T11:16:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b8a2bf688fd94bd7145ca511fec259b9c868ea9bcbe75b12587f747dfaadf4d
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw「presence」是對以下項目的輕量級、盡力而為檢視：

- **閘道**本身，以及
- **連線到閘道的用戶端**（mac 應用程式、WebChat、命令列介面等）

Presence 主要用於呈現 macOS 應用程式的**執行個體**分頁，並提供操作人員快速可見性。

## Presence 欄位（會顯示什麼）

Presence 項目是結構化物件，包含如下欄位：

- `instanceId`（選用但強烈建議）：穩定的用戶端身分（通常是 `connect.client.instanceId`）
- `host`：便於人類閱讀的主機名稱
- `ip`：盡力而為的 IP 位址
- `version`：用戶端版本字串
- `deviceFamily` / `modelIdentifier`：硬體提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：距離上次使用者輸入的秒數，如已知
- `reason`：用戶端提供的自由格式字串；閘道本身只會發出 `self`、`connect` 和 `disconnect`
- `deviceId`、`roles`、`scopes`：來自連線交握的裝置身分與角色/範圍提示
- `ts`：上次更新時間戳記（自 epoch 起算的毫秒數）

## 產生者（presence 從何而來）

Presence 項目由多個來源產生，並會被**合併**。

### 1) 閘道自身項目

閘道啟動時一律會植入一個「self」項目，讓 UI 即使在任何用戶端連線前，也能顯示閘道主機。

### 2) WebSocket 連線

每個 WS 用戶端都會以 `connect` 請求開始。交握成功後，閘道會為該連線 upsert 一個 presence 項目。

#### 為什麼一次性的命令列介面命令不會顯示

命令列介面經常為短暫的一次性命令建立連線。為避免讓執行個體清單充滿雜訊，`client.mode === "cli"` **不會**被轉成 presence 項目。

### 3) `system-event` 信標

用戶端可以透過 `system-event` 方法傳送更豐富的週期性信標。mac 應用程式會使用這點回報主機名稱、IP 和 `lastInputSeconds`。

### 4) 節點連線（角色：節點）

當節點透過閘道 WebSocket 以 `role: node` 連線時，閘道會為該節點 upsert 一個 presence 項目（流程與其他 WS 用戶端相同）。

## 合併 + 去重規則（為什麼 `instanceId` 很重要）

Presence 項目會儲存在單一記憶體內 map 中，鍵值不分大小寫，並依序使用第一個可用值：配對裝置 ID、`connect.client.instanceId`，或最後才使用每個連線的 ID 作為備援。

命令列介面用戶端會完全排除在追蹤之外（見上文），因此其連線 ID 永遠不會成為鍵值。對其他所有用戶端而言，連線 ID 備援表示沒有穩定 `instanceId` 就重新連線的用戶端，會顯示為**重複**列。

## TTL 與有界大小

Presence 刻意設計為暫時性：

- **TTL：** 會修剪超過 5 分鐘的項目
- **最大項目數：** 200（最舊的先丟棄）

這能讓清單保持新鮮，並避免記憶體無限制成長。

## 遠端/通道注意事項（loopback IP）

當用戶端透過 SSH 通道 / 本機連接埠轉送連線時，閘道可能會看到遠端位址是 `127.0.0.1`。為避免把該通道位址記錄為用戶端的 IP，連線處理會對偵測為本機（loopback）的用戶端完全省略 `ip`，而不是把 loopback 位址寫入項目。

## 消費者

### macOS 執行個體分頁

macOS 應用程式會呈現 `system-presence` 的輸出，並根據上次更新的時間套用小型狀態指示器（作用中/閒置/過時）。

## 偵錯提示

- 若要查看原始清單，請對閘道呼叫 `system-presence`。
- 如果你看到重複項目：
  - 確認用戶端在交握中傳送穩定的 `client.instanceId`
  - 確認週期性信標使用相同的 `instanceId`
  - 檢查由連線衍生的項目是否缺少 `instanceId`（重複是預期情況）

## 相關

<CardGroup cols={2}>
  <Card title="Typing indicators" href="/zh-TW/concepts/typing-indicators" icon="ellipsis">
    輸入指示器何時送出，以及如何調整它們。
  </Card>
  <Card title="Streaming and chunking" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流、分塊，以及各通道格式化。
  </Card>
  <Card title="Gateway architecture" href="/zh-TW/concepts/architecture" icon="diagram-project">
    閘道元件，以及驅動 presence 更新的 WebSocket 協定。
  </Card>
  <Card title="Gateway protocol" href="/zh-TW/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的線路協定。
  </Card>
</CardGroup>
