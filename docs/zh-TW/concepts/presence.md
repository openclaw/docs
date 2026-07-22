---
read_when:
    - 在控制介面的裝置頁面偵錯即時狀態
    - 調查重複或過時的執行個體資料列
    - 變更閘道 WebSocket 連線或系統事件信標
summary: OpenClaw 上線狀態項目的產生、合併與顯示方式
title: 在線狀態
x-i18n:
    generated_at: "2026-07-21T22:38:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ac5800eebddb82e69a7d0c06733e6a19addbc57be7776e7361411866af0c60f5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw 的「在線狀態」是以下項目的輕量級、盡力而為檢視：

- **閘道**本身，以及
- **連線至閘道、使用者可見的用戶端**（Mac App、WebChat、節點等）

在線狀態會在控制介面的 **Devices** 頁面
（位於 **Settings → Devices**）和 macOS App 的 **Instances** 分頁中顯示即時連線中繼資料。

本頁說明閘道的用戶端清單。若要偵測你最近使用的 Mac，
並將節點警示路由至該處，請參閱
[使用中的電腦在線狀態](/zh-TW/nodes/presence)。

## 在線狀態欄位（顯示的內容）

在線狀態項目是結構化物件，包含如下欄位：

- `instanceId`（選填但強烈建議）：穩定的用戶端身分（通常為 `connect.client.instanceId`）
- `host`：易於辨識的主機名稱
- `ip`：盡力判定的 IP 位址
- `version`：用戶端版本字串
- `deviceFamily` / `modelIdentifier`：硬體提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`node`、`probe`、`test`
- `lastInputSeconds`：自上次使用者輸入以來的秒數（若已知）
- `reason`：用戶端提供的自由格式字串；閘道本身只會發出 `self`、`connect` 和 `disconnect`
- `deviceId`、`roles`、`scopes`：來自連線交握的裝置身分及角色／範圍提示
- `ts`：上次更新時間戳記（自紀元起算的毫秒數）

## 產生來源（在線狀態來自何處）

在線狀態項目由多個來源產生並加以**合併**。

### 1) 閘道自身項目

閘道一律會在啟動時植入一筆「自身」項目，讓使用者介面即使在任何用戶端連線前，
也能顯示閘道主機。

### 2) WebSocket 連線

每個 WS 用戶端都以 `connect` 請求開始。交握成功後，
閘道會新增或更新該連線的在線狀態項目。

#### 為何暫時性的控制平面連線不會顯示

命令列介面命令、後端 RPC 用戶端和探測器通常只會短暫連線。為避免
在整段在線狀態 TTL 期間保留這些頻繁變動，處於 `cli`、`backend`
或 `probe` 模式的用戶端**不會**轉換成在線狀態項目。測試模式用戶端
仍會受到追蹤，因為測試套件會使用它們代替真實用戶端。

### 3) `system-event` 信標

用戶端可透過 `system-event` 方法傳送內容更豐富的週期性信標。Mac
App 使用此方法回報主機名稱、IP、版本和存活狀態中繼資料。實體
輸入活動不屬於此通用信標的一部分；此資料由[使用中的電腦在線狀態](/zh-TW/nodes/presence)中所述、
用於特定用途的原生節點事件負責。Mac 會以 `system-presence-clear-last-input` 標記這些信標；目前的閘道
會使用這個向下相容標記，移除舊版 App 所保留的任何輸入時間近況。
信標也會攜帶固定的 30 天值，讓忽略此標記的舊版閘道覆寫精確的時間近況，
而不是繼續保留該資料。不會為此相容性值取樣任何新的活動。

### 4) 節點連線（角色：節點）

當節點透過閘道 WebSocket 以 `role: node` 連線時，閘道
會新增或更新該節點的在線狀態項目（流程與其他 WS 用戶端相同）。

## 合併與去重規則（`instanceId` 為何重要）

在線狀態項目儲存在單一記憶體內映射中，其索引鍵不區分大小寫，
並依序採用第一個可用值：已配對的裝置 ID、`connect.client.instanceId`，
最後才以每個連線的 ID 作為備用。

暫時性的控制平面用戶端完全不納入追蹤（如上所述），
因此其連線 ID 永遠不會成為索引鍵。對於其他所有用戶端，
使用連線 ID 作為備用表示：沒有穩定 `instanceId` 的用戶端重新連線時，
會顯示為一列**重複**項目。

## TTL 與大小上限

在線狀態依設計是暫時性的：

- **TTL：**超過 5 分鐘的項目會遭到清除
- **項目上限：**200（最舊的優先移除）

這可讓清單保持最新，並避免記憶體無限制成長。

## 遠端／通道注意事項（回送 IP）

當用戶端透過 SSH 通道／本機連接埠轉送進行連線時，閘道
可能會將遠端位址視為 `127.0.0.1`。為避免將該通道
位址記錄為用戶端的 IP，連線處理程序對偵測為本機（回送）的用戶端
會完全省略 `ip`，而不會將回送位址寫入項目。

## 使用端

### 控制介面的 Devices 頁面

**Devices** 頁面會將 `system-presence` 與持久保存的配對和節點
記錄聯結。它會將閘道自身信標固定在最前方，並使用相符的裝置或
執行個體 ID，取得即時平台、版本、型號和輸入時間近況中繼資料。

### macOS Instances 分頁

macOS App 會呈現 `system-presence` 的輸出，並根據上次更新距今的時間，
套用小型狀態指示器（Active/Idle/Stale）。

## 偵錯提示

- 若要查看原始清單，請對閘道呼叫 `system-presence`。
- 如果看到重複項目：
  - 確認用戶端在交握中傳送穩定的 `client.instanceId`
  - 確認週期性信標使用相同的 `instanceId`
  - 檢查衍生自連線的項目是否缺少 `instanceId`（此時出現重複項目屬於預期行為）

## 相關內容

<CardGroup cols={2}>
  <Card title="使用中的電腦在線狀態" href="/zh-TW/nodes/presence" icon="computer-mouse">
    實體 Mac 輸入如何選取使用中的節點並路由連線警示。
  </Card>
  <Card title="輸入中指示器" href="/zh-TW/concepts/typing-indicators" icon="ellipsis">
    何時傳送輸入中指示器，以及如何調整其設定。
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
