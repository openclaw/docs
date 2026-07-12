---
read_when:
    - 偵錯 Control UI 裝置頁面的即時狀態
    - 調查重複或過時的執行個體資料列
    - 變更閘道 WebSocket 連線或系統事件信標
summary: OpenClaw 在線狀態項目的產生、合併與顯示方式
title: 目前狀態
x-i18n:
    generated_at: "2026-07-12T14:25:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c0ef74eeaaa5ee00e43dfcfb25d7e3652fd6e7d0fac2d236fe3b9af7d193d1c
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw 的「在線狀態」是一種輕量、盡力而為的檢視方式，用於查看：

- **閘道**本身，以及
- **已連線至閘道且使用者可見的用戶端**（Mac App、WebChat、節點等）

在線狀態會在控制介面的**裝置**頁面，以及 macOS App 的**執行個體**分頁中顯示即時連線中繼資料。

本頁介紹閘道的用戶端清單。若要偵測你最近使用的 Mac，並將節點警示路由至該處，請參閱[使用中電腦的在線狀態](/nodes/presence)。

## 在線狀態欄位（顯示的內容）

在線狀態項目是結構化物件，包含以下欄位：

- `instanceId`（選填，但強烈建議提供）：穩定的用戶端識別資訊（通常為 `connect.client.instanceId`）
- `host`：易於辨識的主機名稱
- `ip`：盡力取得的 IP 位址
- `version`：用戶端版本字串
- `deviceFamily` / `modelIdentifier`：硬體提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：若已知，表示自上次使用者輸入後經過的秒數
- `reason`：由用戶端提供的自由格式字串；閘道本身只會發出 `self`、`connect` 和 `disconnect`
- `deviceId`、`roles`、`scopes`：來自連線交握的裝置身分及角色／範圍提示
- `ts`：上次更新的時間戳記（自 Epoch 起算的毫秒數）

## 產生來源（在線狀態來自何處）

在線狀態項目由多個來源產生，並會進行**合併**。

### 1) 閘道自身項目

閘道啟動時一律會建立一個「自身」項目，讓介面即使在尚無任何用戶端連線前，也能顯示閘道主機。

### 2) WebSocket 連線

每個 WS 用戶端一開始都會傳送 `connect` 請求。交握成功後，閘道會為該連線新增或更新在線狀態項目。

#### 為何暫時性的控制平面連線不會顯示

命令列介面命令、後端 RPC 用戶端和探測通常只會短暫連線。為避免在完整的在線狀態 TTL 期間保留這些頻繁變動，處於 `cli`、`backend` 或 `probe` 模式的用戶端**不會**轉換為在線狀態項目。測試模式用戶端仍會受到追蹤，因為測試套件會將其作為真實用戶端的替代項目。

### 3) `system-event` 訊號

用戶端可透過 `system-event` 方法定期傳送內容更豐富的訊號。Mac App 會以此回報主機名稱、IP 和 `lastInputSeconds`。

### 4) 節點連線（角色：節點）

當節點透過閘道 WebSocket，以 `role: node` 連線時，閘道會為該節點新增或更新在線狀態項目（流程與其他 WS 用戶端相同）。

## 合併與去重複規則（為何 `instanceId` 很重要）

在線狀態項目會儲存在單一記憶體內對應表中，鍵值不區分大小寫，並依序採用第一個可用值：已配對的裝置 ID、`connect.client.instanceId`，最後才以各連線的 ID 作為備用值。

暫時性的控制平面用戶端完全不會受到追蹤（如上所述），因此其連線 ID 絕不會成為鍵值。對於其他所有用戶端，採用連線 ID 作為備用值，代表未提供穩定 `instanceId` 的用戶端重新連線時，會顯示為**重複**列。

## TTL 與大小上限

在線狀態刻意設計為暫時性資料：

- **TTL：**超過 5 分鐘的項目會遭到移除
- **項目上限：**200（優先移除最舊的項目）

如此可讓清單保持最新，並避免記憶體無限制增長。

## 遠端／通道注意事項（回送 IP）

當用戶端透過 SSH 通道／本機連接埠轉送進行連線時，閘道可能會將遠端位址視為 `127.0.0.1`。為避免將該通道位址記錄為用戶端的 IP，連線處理程序會對偵測為本機（回送）的用戶端完全省略 `ip`，而不會將回送位址寫入項目。

## 使用端

### 控制介面的裝置頁面

**裝置**頁面會將 `system-presence` 與持久化的配對和節點記錄結合。它會將閘道自身的訊號固定在第一個位置，並透過相符的裝置或執行個體 ID，取得即時平台、版本、型號和輸入時間新近程度的中繼資料。

### macOS 執行個體分頁

macOS App 會呈現 `system-presence` 的輸出，並根據上次更新至今的時間套用小型狀態指示器（使用中／閒置／過期）。

## 偵錯提示

- 若要查看原始清單，請對閘道呼叫 `system-presence`。
- 如果看到重複項目：
  - 確認用戶端在交握時傳送穩定的 `client.instanceId`
  - 確認定期訊號使用相同的 `instanceId`
  - 檢查衍生自連線的項目是否缺少 `instanceId`（此時出現重複項目是預期行為）

## 相關內容

<CardGroup cols={2}>
  <Card title="使用中電腦的在線狀態" href="/nodes/presence" icon="computer-mouse">
    實體 Mac 輸入如何選取使用中節點，並路由連線警示。
  </Card>
  <Card title="輸入狀態指示器" href="/zh-TW/concepts/typing-indicators" icon="ellipsis">
    何時傳送輸入狀態指示器，以及如何調整。
  </Card>
  <Card title="串流與分塊" href="/zh-TW/concepts/streaming" icon="bars-staggered">
    輸出串流、分塊及各頻道的格式設定。
  </Card>
  <Card title="閘道架構" href="/zh-TW/concepts/architecture" icon="diagram-project">
    閘道元件，以及驅動在線狀態更新的 WebSocket 通訊協定。
  </Card>
  <Card title="閘道通訊協定" href="/zh-TW/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的線路通訊協定。
  </Card>
</CardGroup>
