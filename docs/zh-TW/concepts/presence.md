---
read_when:
    - 在控制介面的裝置頁面上偵錯即時狀態
    - 調查重複或過時的執行個體資料列
    - 變更閘道 WebSocket 連線或系統事件信標
summary: OpenClaw 的上線狀態項目如何產生、合併與顯示
title: 線上狀態
x-i18n:
    generated_at: "2026-07-14T13:38:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw 的「上線狀態」是以下項目的輕量、盡力而為檢視：

- **閘道**本身，以及
- **連線至閘道且使用者可見的用戶端**（Mac 應用程式、WebChat、節點等）

上線狀態會在控制介面的 **Devices** 頁面
（位於 **Settings → Devices**）以及 macOS 應用程式的 **Instances** 分頁中顯示即時連線中繼資料。

本頁說明閘道用戶端清單。若要偵測你最近使用的 Mac，並將節點警示路由至該處，請參閱
[使用中電腦的上線狀態](/zh-TW/nodes/presence)。

## 上線狀態欄位（顯示的內容）

上線狀態項目是結構化物件，包含以下欄位：

- `instanceId`（選填，但強烈建議提供）：穩定的用戶端身分識別（通常為 `connect.client.instanceId`）
- `host`：易於辨識的主機名稱
- `ip`：盡力判定的 IP 位址
- `version`：用戶端版本字串
- `deviceFamily` / `modelIdentifier`：硬體提示資訊
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：若可得知，表示自上次使用者輸入以來的秒數
- `reason`：由用戶端提供的自由格式字串；閘道本身只會發出 `self`、`connect` 和 `disconnect`
- `deviceId`、`roles`、`scopes`：來自連線交握的裝置身分，以及角色／範圍提示
- `ts`：上次更新時間戳記（自 epoch 起算的毫秒數）

## 產生來源（上線狀態來自何處）

上線狀態項目由多個來源產生，並會進行**合併**。

### 1) 閘道自身項目

閘道啟動時一律會建立一筆「自身」項目，讓介面即使在任何用戶端連線前，也能顯示閘道主機。

### 2) WebSocket 連線

每個 WS 用戶端都會先送出 `connect` 要求。交握成功後，閘道會為該連線新增或更新一筆上線狀態項目。

#### 為何暫時性的控制平面連線不會顯示

命令列介面命令、後端 RPC 用戶端和探測器通常只會短暫連線。為避免在完整的上線狀態 TTL 期間保留這類頻繁變動，處於 `cli`、`backend`
或 `probe` 模式的用戶端**不會**轉換為上線狀態項目。測試模式用戶端仍會持續追蹤，因為測試套件會使用它們代替真實用戶端。

### 3) `system-event` 信標

用戶端可透過 `system-event` 方法定期傳送包含更多資訊的信標。Mac 應用程式會使用此方式回報主機名稱、IP 和 `lastInputSeconds`。

### 4) 節點連線（角色：節點）

當節點透過閘道 WebSocket 使用 `role: node` 連線時，閘道會為該節點新增或更新一筆上線狀態項目（流程與其他 WS 用戶端相同）。

## 合併與去重規則（`instanceId` 為何重要）

上線狀態項目儲存在單一記憶體內映射中，鍵值不區分大小寫，並依序採用第一個可用的值：已配對的裝置 ID、`connect.client.instanceId`，
最後才使用每個連線的 ID。

暫時性的控制平面用戶端會完全排除在追蹤範圍之外（見上文），因此其連線 ID 絕不會成為鍵值。對其他所有用戶端而言，連線 ID 的備援機制表示，若用戶端重新連線時未提供穩定的
`instanceId`，就會顯示為**重複**資料列。

## TTL 與大小上限

上線狀態刻意設計為暫時性資料：

- **TTL：**超過 5 分鐘的項目會遭到清除
- **項目上限：**200（優先移除最舊的項目）

這能讓清單保持最新，並避免記憶體無限制成長。

## 遠端／通道注意事項（迴路 IP）

當用戶端透過 SSH 通道／本機連接埠轉送進行連線時，閘道可能會將遠端位址識別為 `127.0.0.1`。為避免將該通道位址記錄為用戶端的 IP，連線處理程序針對偵測為本機（迴路）的用戶端，會完全省略 `ip`，而不會將迴路位址寫入項目。

## 使用端

### 控制介面的 Devices 頁面

**Devices** 頁面會將 `system-presence` 與永久保存的配對及節點記錄結合。它會將閘道自身信標固定在最前方，並使用相符的裝置或執行個體 ID，取得即時平台、版本、型號及輸入時間近況等中繼資料。

### macOS 的 Instances 分頁

macOS 應用程式會呈現 `system-presence` 的輸出，並根據上次更新距今的時間顯示簡短狀態指示器（Active/Idle/Stale）。

## 偵錯提示

- 若要查看原始清單，請對閘道呼叫 `system-presence`。
- 如果看到重複項目：
  - 確認用戶端在交握時傳送穩定的 `client.instanceId`
  - 確認定期信標使用相同的 `instanceId`
  - 檢查從連線衍生的項目是否缺少 `instanceId`（此時預期會出現重複項目）

## 相關內容

<CardGroup cols={2}>
  <Card title="使用中電腦的上線狀態" href="/zh-TW/nodes/presence" icon="computer-mouse">
    實體 Mac 輸入如何選取使用中的節點，並路由連線警示。
  </Card>
  <Card title="輸入中指示器" href="/zh-TW/concepts/typing-indicators" icon="ellipsis">
    何時傳送輸入中指示器，以及如何調整其行為。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    對外串流、分塊及各頻道的格式設定。
  </Card>
  <Card title="閘道架構" href="/zh-TW/concepts/architecture" icon="diagram-project">
    閘道元件，以及驅動上線狀態更新的 WebSocket 通訊協定。
  </Card>
  <Card title="閘道通訊協定" href="/zh-TW/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的線路通訊協定。
  </Card>
</CardGroup>
