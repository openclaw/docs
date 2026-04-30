---
read_when:
    - 實作無需 macOS UI 的 Node 配對核准
    - 新增用於核准遠端節點的 CLI 流程
    - 以 Node 管理擴充 Gateway 協定
summary: Gateway 擁有的 Node 配對（選項 B），適用於 iOS 與其他遠端 Node
title: Gateway 擁有的配對
x-i18n:
    generated_at: "2026-04-30T03:08:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

在 Gateway 擁有的配對中，**Gateway** 是哪些 Node
允許加入的事實來源。UI（macOS app、未來的用戶端）只是用來
核准或拒絕待處理請求的前端。

**重要：** WS Node 在 `connect` 期間使用 **裝置配對**（角色 `node`）。
`node.pair.*` 是獨立的配對儲存區，且**不會**管控 WS 交握。
只有明確呼叫 `node.pair.*` 的用戶端才會使用此流程。

## 概念

- **待處理請求**：Node 要求加入；需要核准。
- **已配對 Node**：已核准且已核發驗證權杖的 Node。
- **傳輸**：Gateway WS 端點會轉送請求，但不決定
  成員資格。（舊版 TCP bridge 支援已移除。）

## 配對如何運作

1. Node 連線到 Gateway WS 並要求配對。
2. Gateway 儲存一個**待處理請求**並發出 `node.pair.requested`。
3. 你核准或拒絕該請求（CLI 或 UI）。
4. 核准後，Gateway 會核發一個**新權杖**（重新配對時會輪替權杖）。
5. Node 使用該權杖重新連線，現在即為「已配對」。

待處理請求會在 **5 分鐘**後自動過期。

## CLI 工作流程（適合無介面環境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 會顯示已配對/已連線的 Node 及其能力。

## API 介面（gateway protocol）

事件：

- `node.pair.requested` — 建立新的待處理請求時發出。
- `node.pair.resolved` — 請求被核准/拒絕/過期時發出。

方法：

- `node.pair.request` — 建立或重用待處理請求。
- `node.pair.list` — 列出待處理 + 已配對的 Node（`operator.pairing`）。
- `node.pair.approve` — 核准待處理請求（核發權杖）。
- `node.pair.reject` — 拒絕待處理請求。
- `node.pair.remove` — 移除過時的已配對 Node 項目。
- `node.pair.verify` — 驗證 `{ nodeId, token }`。

注意事項：

- `node.pair.request` 對每個 Node 是冪等的：重複呼叫會回傳相同的
  待處理請求。
- 對同一個待處理 Node 的重複請求，也會重新整理已儲存的 Node
  中繼資料，以及最新的允許清單已宣告命令快照，供操作員檢視。
- 核准**一律**會產生新的權杖；`node.pair.request` 絕不會回傳權杖。
- 請求可以包含 `silent: true`，作為自動核准流程的提示。
- `node.pair.approve` 會使用待處理請求宣告的命令來強制執行
  額外核准範圍：
  - 無命令請求：`operator.pairing`
  - 非 exec 命令請求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 請求：
    `operator.pairing` + `operator.admin`

<Warning>
Node 配對是信任與身分流程，加上權杖核發。它**不會**針對每個 Node 固定即時 Node 命令介面。

- 即時 Node 命令來自 Node 在連線後所宣告的內容，且會先套用 gateway 的全域 Node 命令政策（`gateway.nodes.allowCommands` 與 `denyCommands`）。
- 個別 Node 的 `system.run` 允許與詢問政策位於 Node 上的 `exec.approvals.node.*`，不在配對記錄中。

</Warning>

## Node 命令管控（2026.3.31+）

<Warning>
**重大變更：** 從 `2026.3.31` 開始，在 Node 配對獲准之前，Node 命令會停用。僅有裝置配對已不足以公開已宣告的 Node 命令。
</Warning>

當 Node 第一次連線時，會自動要求配對。在配對請求獲准之前，來自該 Node 的所有待處理 Node 命令都會被篩除，且不會執行。透過配對核准建立信任後，Node 宣告的命令會依照一般命令政策變為可用。

這表示：

- 先前僅依賴裝置配對來公開命令的 Node，現在必須完成 Node 配對。
- 配對核准前排入佇列的命令會被丟棄，而不是延後執行。

## Node 事件信任邊界（2026.3.31+）

<Warning>
**重大變更：** Node 發起的執行現在會停留在縮減後的受信任介面上。
</Warning>

Node 發起的摘要與相關工作階段事件會限制在預期的受信任介面內。先前依賴更廣泛主機或工作階段工具存取的通知驅動或 Node 觸發流程，可能需要調整。此強化可確保 Node 事件無法升級為超出該 Node 信任邊界所允許範圍的主機層級工具存取。

持久的 Node 存在狀態更新也遵循相同的身分邊界。`node.presence.alive` 事件
只會接受來自已驗證 Node 裝置工作階段的事件，且只有在
裝置/Node 身分已配對時才會更新配對中繼資料。自行宣告的 `client.id` 值不足以寫入
最後上線狀態。

## 自動核准（macOS app）

macOS app 可在下列情況下選擇性嘗試**靜默核准**：

- 請求標記為 `silent`，且
- app 可以使用相同使用者驗證到 gateway 主機的 SSH 連線。

如果靜默核准失敗，會退回一般的「核准/拒絕」提示。

## 受信任 CIDR 裝置自動核准

`role: node` 的 WS 裝置配對預設仍為手動。對於 Gateway 已信任網路路徑的私有
Node 網路，操作員可以透過明確的 CIDR 或精確 IP 選擇加入：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

安全邊界：

- 未設定 `gateway.nodes.pairing.autoApproveCidrs` 時停用。
- 不存在涵蓋整個 LAN 或私有網路的自動核准模式。
- 只有未要求範圍的新鮮 `role: node` 裝置配對符合資格。
- 操作員、瀏覽器、Control UI 與 WebChat 用戶端仍維持手動。
- 角色、範圍、中繼資料與公開金鑰升級仍維持手動。
- 同主機 local loopback 受信任 Proxy 標頭路徑不符合資格，因為該
  路徑可由本機呼叫端偽造。

## 中繼資料升級自動核准

當已配對裝置重新連線且只有非敏感中繼資料
變更（例如顯示名稱或用戶端平台提示）時，OpenClaw 會將其視為
`metadata-upgrade`。靜默自動核准範圍很窄：它只適用於已證明擁有本機
或共享憑證的受信任非瀏覽器本機重新連線，包括同主機原生 app 在 OS
版本中繼資料變更後的重新連線。瀏覽器/Control UI 用戶端與遠端用戶端仍然
使用明確的重新核准流程。範圍升級（讀取到寫入/admin）與
公開金鑰變更**不**符合中繼資料升級自動核准資格 —
它們仍會保留為明確的重新核准請求。

## QR 配對輔助工具

`/pair qr` 會將配對酬載呈現為結構化媒體，讓行動與
瀏覽器用戶端可以直接掃描。

刪除裝置也會清理該
裝置 id 的任何過時待處理配對請求，因此 `nodes pending` 在撤銷後不會顯示孤立列。

## 地域性與轉送標頭

Gateway 配對只有在原始 socket
與任何上游 Proxy 證據都一致時，才會將連線視為 loopback。如果請求抵達 loopback，但
攜帶指向非本機來源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 標頭，
該轉送標頭證據會使
loopback 地域性主張失效。配對路徑接著會要求明確核准，
而不是靜默地將請求視為同主機連線。請參閱
[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)，了解
操作員驗證上的等效規則。

## 儲存（本機、私有）

配對狀態會儲存在 Gateway 狀態目錄下（預設 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆寫 `OPENCLAW_STATE_DIR`，`nodes/` 資料夾會隨之移動。

安全注意事項：

- 權杖是秘密；請將 `paired.json` 視為敏感資料。
- 輪替權杖需要重新核准（或刪除 Node 項目）。

## 傳輸行為

- 傳輸是**無狀態**的；它不會儲存成員資格。
- 如果 Gateway 離線或配對已停用，Node 無法配對。
- 如果 Gateway 處於遠端模式，配對仍會針對遠端 Gateway 的儲存區進行。

## 相關

- [Channel 配對](/zh-TW/channels/pairing)
- [Nodes](/zh-TW/nodes)
- [Devices CLI](/zh-TW/cli/devices)
