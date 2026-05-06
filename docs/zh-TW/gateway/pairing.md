---
read_when:
    - 在不透過 macOS 使用者介面的情況下實作 Node 配對核准
    - 新增核准遠端節點的 CLI 流程
    - 透過 Node 管理擴充 Gateway 協定
summary: 適用於 iOS 與其他遠端 Node 的 Gateway 擁有 Node 配對（選項 B）
title: 由 Gateway 擁有的配對
x-i18n:
    generated_at: "2026-05-06T09:10:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

在由 Gateway 擁有的配對中，**Gateway** 是判定哪些節點
允許加入的可信來源。UI（macOS app、未來的用戶端）只是前端，
用來核准或拒絕待處理請求。

**重要：** WS 節點在 `connect` 期間使用**裝置配對**（角色 `node`）。
`node.pair.*` 是獨立的配對儲存區，且**不會**管控 WS 交握。
只有明確呼叫 `node.pair.*` 的用戶端會使用此流程。

## 概念

- **待處理請求**：節點要求加入；需要核准。
- **已配對節點**：已核准並核發驗證權杖的節點。
- **傳輸**：Gateway WS 端點會轉送請求，但不決定
  成員資格。（舊版 TCP 橋接支援已移除。）

## 配對運作方式

1. 節點連線到 Gateway WS 並要求配對。
2. Gateway 儲存一個**待處理請求**並發出 `node.pair.requested`。
3. 你核准或拒絕該請求（CLI 或 UI）。
4. 核准時，Gateway 會核發一個**新權杖**（重新配對時會輪替權杖）。
5. 節點使用權杖重新連線，現在就是「已配對」。

待處理請求會在 **5 分鐘**後自動過期。

## CLI 工作流程（適合無頭環境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 會顯示已配對/已連線的節點及其能力。

## API 介面（gateway protocol）

事件：

- `node.pair.requested` - 建立新的待處理請求時發出。
- `node.pair.resolved` - 請求被核准/拒絕/過期時發出。

方法：

- `node.pair.request` - 建立或重用待處理請求。
- `node.pair.list` - 列出待處理 + 已配對節點（`operator.pairing`）。
- `node.pair.approve` - 核准待處理請求（核發權杖）。
- `node.pair.reject` - 拒絕待處理請求。
- `node.pair.remove` - 移除過時的已配對節點項目。
- `node.pair.verify` - 驗證 `{ nodeId, token }`。

注意事項：

- `node.pair.request` 對每個節點都是冪等的：重複呼叫會回傳相同的
  待處理請求。
- 同一個待處理節點的重複請求也會重新整理已儲存的節點
  中繼資料，以及最新的已列入允許清單宣告命令快照，供操作員查看。
- 核准**一律**會產生全新的權杖；`node.pair.request`
  絕不會回傳權杖。
- 操作員作用域層級與核准時檢查彙整於
  [操作員作用域](/zh-TW/gateway/operator-scopes)。
- 請求可以包含 `silent: true`，作為自動核准流程的提示。
- `node.pair.approve` 會使用待處理請求的宣告命令來強制套用
  額外核准作用域：
  - 無命令請求：`operator.pairing`
  - 非 exec 命令請求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 請求：
    `operator.pairing` + `operator.admin`

<Warning>
Node 配對是信任與身分流程，並包含權杖核發。它**不會**針對每個節點固定即時節點命令介面。

- 即時節點命令來自節點在連線後所宣告的內容，並會先套用 gateway 的全域節點命令政策（`gateway.nodes.allowCommands` 和 `denyCommands`）。
- 每個節點的 `system.run` 允許與詢問政策位於節點上的 `exec.approvals.node.*`，不在配對記錄中。

</Warning>

## Node 命令管控（2026.3.31+）

<Warning>
**破壞性變更：** 自 `2026.3.31` 起，節點命令會停用，直到節點配對被核准。僅有裝置配對已不足以公開宣告的節點命令。
</Warning>

當節點第一次連線時，會自動要求配對。在配對請求核准之前，來自該節點的所有待處理節點命令都會被篩除且不會執行。透過配對核准建立信任後，節點宣告的命令會依照一般命令政策變為可用。

這表示：

- 先前只依賴裝置配對來公開命令的節點，現在必須完成節點配對。
- 配對核准前排入佇列的命令會被捨棄，而不是延後執行。

## Node 事件信任邊界（2026.3.31+）

<Warning>
**破壞性變更：** 節點發起的執行現在會停留在縮減後的受信任介面上。
</Warning>

節點發起的摘要與相關工作階段事件會限制在預期的受信任介面內。先前依賴較廣泛主機或工作階段工具存取權的通知驅動或節點觸發流程，可能需要調整。這項強化可確保節點事件無法升級為超出節點信任邊界所允許範圍的主機層級工具存取權。

持久化的節點存在狀態更新遵循相同的身分邊界。`node.presence.alive` 事件
只接受來自已驗證節點裝置工作階段的事件，且只有在
裝置/節點身分已配對時才會更新配對中繼資料。自行宣告的 `client.id` 值不足以寫入
最後出現狀態。

## 自動核准（macOS app）

macOS app 可以在下列情況下選擇性嘗試**靜默核准**：

- 請求標示為 `silent`，且
- app 能使用相同使用者驗證到 gateway 主機的 SSH 連線。

如果靜默核准失敗，會退回一般的「核准/拒絕」提示。

## 受信任 CIDR 裝置自動核准

`role: node` 的 WS 裝置配對預設仍為手動。對於 Gateway 已信任網路路徑的私人
節點網路，操作員可以使用明確的 CIDR 或精確 IP 選擇加入：

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
- 不存在全面性的 LAN 或私人網路自動核准模式。
- 只有沒有要求作用域的新 `role: node` 裝置配對符合資格。
- 操作員、瀏覽器、Control UI 和 WebChat 用戶端仍維持手動。
- 角色、作用域、中繼資料與公開金鑰升級仍維持手動。
- 同主機 loopback 受信任代理標頭路徑不符合資格，因為該
  路徑可能被本機呼叫者偽造。

## 中繼資料升級自動核准

當已配對裝置重新連線，且只有非敏感中繼資料
變更（例如顯示名稱或用戶端平台提示）時，OpenClaw 會將其視為
`metadata-upgrade`。靜默自動核准的範圍很窄：它只適用於
已證明擁有本機或共享憑證的受信任非瀏覽器本機重新連線，
包括 OS 版本中繼資料變更後的同主機原生 app 重新連線。瀏覽器/Control UI 用戶端與遠端用戶端仍
使用明確的重新核准流程。作用域升級（讀取到寫入/admin）與
公開金鑰變更**不**符合中繼資料升級自動核准資格 -
它們仍會保留為明確的重新核准請求。

## QR 配對輔助工具

`/pair qr` 會將配對承載資料轉譯為結構化媒體，讓行動與
瀏覽器用戶端可以直接掃描。

刪除裝置也會清除該裝置 id 的任何過時待處理配對請求，
因此 `nodes pending` 不會在撤銷後顯示孤立列。

## 本地性與轉送標頭

只有在原始 socket 與任何上游代理證據都一致時，Gateway 配對才會將連線視為 loopback。如果請求從 loopback 進入，但
帶有指向非本機來源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 標頭，
該轉送標頭證據會使
loopback 本地性宣告失效。接著配對路徑會要求明確核准，
而不是靜默地將該請求視為同主機連線。請參閱
[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)，了解操作員驗證上的等效規則。

## 儲存（本機、私有）

配對狀態會儲存在 Gateway 狀態目錄下（預設 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆寫 `OPENCLAW_STATE_DIR`，`nodes/` 資料夾也會隨之移動。

安全注意事項：

- 權杖是機密；請將 `paired.json` 視為敏感資料。
- 輪替權杖需要重新核准（或刪除節點項目）。

## 傳輸行為

- 傳輸是**無狀態**的；它不儲存成員資格。
- 如果 Gateway 離線或停用配對，節點無法配對。
- 如果 Gateway 處於遠端模式，配對仍會針對遠端 Gateway 的儲存區進行。

## 相關

- [頻道配對](/zh-TW/channels/pairing)
- [節點](/zh-TW/nodes)
- [裝置 CLI](/zh-TW/cli/devices)
