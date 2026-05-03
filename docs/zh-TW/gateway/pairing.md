---
read_when:
    - 實作不使用 macOS 使用者介面的 Node 配對核准
    - 新增用於核准遠端節點的 CLI 流程
    - 以 Node 管理擴充 Gateway 協定
summary: Gateway 所擁有的 Node 配對（選項 B），適用於 iOS 與其他遠端 Node
title: Gateway 擁有的配對
x-i18n:
    generated_at: "2026-05-03T02:44:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

在 Gateway 擁有的配對中，**Gateway** 是判斷哪些節點
可加入的真實來源。UI（macOS app、未來的客戶端）只是
核准或拒絕待處理請求的前端。

**重要：** WS 節點在 `connect` 期間使用**裝置配對**（角色 `node`）。
`node.pair.*` 是獨立的配對儲存區，**不會**控管 WS 交握。
只有明確呼叫 `node.pair.*` 的客戶端會使用此流程。

## 概念

- **待處理請求**：節點要求加入；需要核准。
- **已配對節點**：已核准且已核發驗證權杖的節點。
- **傳輸**：Gateway WS 端點會轉送請求，但不決定
  成員資格。（舊版 TCP 橋接支援已移除。）

## 配對如何運作

1. 節點連線到 Gateway WS 並要求配對。
2. Gateway 儲存一個**待處理請求**並發出 `node.pair.requested`。
3. 你核准或拒絕該請求（CLI 或 UI）。
4. 核准後，Gateway 會核發**新權杖**（重新配對時會輪替權杖）。
5. 節點使用該權杖重新連線，現在即為「已配對」。

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

`nodes status` 會顯示已配對/已連線的節點及其能力。

## API 介面（Gateway 協定）

事件：

- `node.pair.requested` — 建立新的待處理請求時發出。
- `node.pair.resolved` — 請求被核准/拒絕/過期時發出。

方法：

- `node.pair.request` — 建立或重用待處理請求。
- `node.pair.list` — 列出待處理 + 已配對節點（`operator.pairing`）。
- `node.pair.approve` — 核准待處理請求（核發權杖）。
- `node.pair.reject` — 拒絕待處理請求。
- `node.pair.remove` — 移除過時的已配對節點項目。
- `node.pair.verify` — 驗證 `{ nodeId, token }`。

備註：

- `node.pair.request` 對每個節點都是冪等的：重複呼叫會傳回相同的
  待處理請求。
- 同一個待處理節點的重複請求，也會重新整理已儲存的節點
  中繼資料，以及最新的已列入允許清單宣告命令快照，以供操作者檢視。
- 核准**一律**會產生新的權杖；`node.pair.request` 永遠不會傳回權杖。
- 操作者範圍層級與核准時檢查彙整於
  [操作者範圍](/zh-TW/gateway/operator-scopes)。
- 請求可以包含 `silent: true`，作為自動核准流程的提示。
- `node.pair.approve` 會使用待處理請求宣告的命令，以強制要求
  額外核准範圍：
  - 無命令請求：`operator.pairing`
  - 非 exec 命令請求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 請求：
    `operator.pairing` + `operator.admin`

<Warning>
節點配對是信任與身分流程，加上權杖核發。它**不會**為每個節點固定即時節點命令介面。

- 即時節點命令來自節點在連線時宣告的內容，並會先套用 Gateway 的全域節點命令政策（`gateway.nodes.allowCommands` 與 `denyCommands`）。
- 每節點的 `system.run` 允許與詢問政策位於節點的 `exec.approvals.node.*`，不在配對記錄中。

</Warning>

## Node 命令控管（2026.3.31+）

<Warning>
**破壞性變更：** 自 `2026.3.31` 起，節點命令會停用，直到節點配對獲准為止。僅有裝置配對已不足以公開宣告的節點命令。
</Warning>

節點第一次連線時，會自動要求配對。在配對請求獲准之前，來自該節點的所有待處理節點命令都會被篩除，且不會執行。透過配對核准建立信任後，節點宣告的命令會依一般命令政策提供使用。

這表示：

- 先前僅依賴裝置配對來公開命令的節點，現在必須完成節點配對。
- 配對核准前排入佇列的命令會被捨棄，而不是延後執行。

## 節點事件信任邊界（2026.3.31+）

<Warning>
**破壞性變更：** 節點發起的執行現在會保留在縮減後的受信任介面上。
</Warning>

節點發起的摘要與相關工作階段事件會限制在預期的受信任介面。先前依賴更廣泛主機或工作階段工具存取的通知驅動或節點觸發流程，可能需要調整。這項強化可確保節點事件無法提升為超出節點信任邊界允許範圍的主機層級工具存取。

持久節點存在狀態更新遵循相同的身分邊界。`node.presence.alive` 事件
只接受來自已驗證節點裝置工作階段的事件，且只有在裝置/節點身分已配對時
才會更新配對中繼資料。自行宣告的 `client.id` 值不足以寫入
最後出現狀態。

## 自動核准（macOS app）

macOS app 可選擇在下列情況嘗試**靜默核准**：

- 請求標記為 `silent`，且
- app 可以使用同一個使用者驗證到 Gateway 主機的 SSH 連線。

如果靜默核准失敗，會退回一般的「核准/拒絕」提示。

## 受信任 CIDR 裝置自動核准

`role: node` 的 WS 裝置配對預設仍為手動。對於 Gateway 已信任其網路路徑的私人
節點網路，操作者可以透過明確 CIDR 或精確 IP 選擇啟用：

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
- 不存在一概適用的 LAN 或私人網路自動核准模式。
- 只有未要求範圍的新 `role: node` 裝置配對符合資格。
- 操作者、瀏覽器、Control UI 與 WebChat 客戶端仍維持手動。
- 角色、範圍、中繼資料與公開金鑰升級仍維持手動。
- 同主機 loopback 受信任代理標頭路徑不符合資格，因為該
  路徑可能被本機呼叫者偽造。

## 中繼資料升級自動核准

當已配對裝置重新連線且只有非敏感中繼資料
變更（例如顯示名稱或客戶端平台提示）時，OpenClaw 會將
其視為 `metadata-upgrade`。靜默自動核准範圍很窄：它只適用於
已證明持有本機或共享憑證的受信任非瀏覽器本機重新連線，
包括 OS 版本中繼資料變更後的同主機原生 app 重新連線。瀏覽器/Control UI 客戶端與遠端客戶端仍
使用明確重新核准流程。範圍升級（讀取到寫入/admin）與
公開金鑰變更**不**符合中繼資料升級自動核准資格 —
它們仍會保留為明確重新核准請求。

## QR 配對輔助工具

`/pair qr` 會將配對承載資料呈現為結構化媒體，讓行動與
瀏覽器客戶端可直接掃描。

刪除裝置也會清除該裝置 ID 的任何過時待處理配對請求，
因此 `nodes pending` 在撤銷後不會顯示孤立列。

## 區域性與轉送標頭

Gateway 配對只有在原始 socket 與任何上游代理證據都一致時，
才會將連線視為 loopback。如果請求抵達 loopback，但
帶有指向非本機來源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 標頭，
該轉送標頭證據會使 loopback 區域性宣稱失效。配對路徑接著會要求明確核准，
而不是靜默地將請求視為同主機連線。請參閱
[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)，了解操作者驗證的等效規則。

## 儲存（本機、私有）

配對狀態儲存在 Gateway 狀態目錄下（預設 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆寫 `OPENCLAW_STATE_DIR`，`nodes/` 資料夾會一併移動。

安全備註：

- 權杖是祕密；請將 `paired.json` 視為敏感資料。
- 輪替權杖需要重新核准（或刪除節點項目）。

## 傳輸行為

- 傳輸是**無狀態**的；它不會儲存成員資格。
- 如果 Gateway 離線或配對停用，節點無法配對。
- 如果 Gateway 處於遠端模式，配對仍會針對遠端 Gateway 的儲存區進行。

## 相關

- [頻道配對](/zh-TW/channels/pairing)
- [節點](/zh-TW/nodes)
- [裝置 CLI](/zh-TW/cli/devices)
