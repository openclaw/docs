---
read_when:
    - 實作不需 macOS UI 的節點配對核准
    - 新增用於核准遠端節點的命令列介面流程
    - 以節點管理擴充閘道協定
summary: 閘道擁有的節點配對（選項 B），適用於 iOS 和其他遠端節點
title: 閘道擁有的配對
x-i18n:
    generated_at: "2026-07-06T21:49:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5793d2b0c440e2a0b455055493996f03c43fe087a55371c6e36b7752265d208
    source_path: gateway/pairing.md
    workflow: 16
---

在閘道擁有的配對中，**閘道** 是判定哪些節點可加入的真實來源。UI（macOS app、未來的用戶端）只是核准或拒絕待處理請求的前端。

**重要：** WS 節點在 `connect` 期間使用 **device pairing**（角色 `node`）。`node.pair.*` 是另一個舊版配對儲存區，且**不會**管控 WS 握手。只有明確呼叫 `node.pair.*` 的用戶端會使用此流程。

## 概念

- **待處理請求**：節點要求加入；需要核准。
- **已配對節點**：已核准且已核發驗證權杖的節點。
- **傳輸**：閘道 WS 端點會轉送請求，但不決定成員資格。舊版 TCP bridge 支援已移除。

## 配對如何運作

1. 節點連線到閘道 WS 並請求配對。
2. 閘道儲存一個**待處理請求**，並發出 `node.pair.requested`。
3. 你核准或拒絕該請求（命令列介面或 UI）。
4. 核准時，閘道會核發一個**新權杖**（重新配對時會輪替權杖）。
5. 節點使用該權杖重新連線，現在即為已配對。

待處理請求會在**節點最後一次重試後 5 分鐘**自動過期；主動重新連線的節點會讓同一個待處理請求保持有效，而不是每次嘗試都產生新的請求（和核准提示）。

## 命令列介面工作流程（適合 headless）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 會顯示已配對/已連線的節點及其功能。

## API 表面（閘道協定）

事件：

- `node.pair.requested` - 建立新的待處理請求時發出。
- `node.pair.resolved` - 請求被核准、拒絕或過期時發出。

方法：

- `node.pair.request` - 建立或重用待處理請求。
- `node.pair.list` - 列出待處理和已配對的節點（`operator.pairing`）。
- `node.pair.approve` - 核准待處理請求（核發權杖）。
- `node.pair.reject` - 拒絕待處理請求。
- `node.pair.remove` - 移除已配對節點。對於由裝置支撐的配對，這會撤銷該裝置的 `node` 角色：它會變更 `devices/paired.json`，並使該裝置的節點角色工作階段失效/中斷連線。**混合角色**裝置（例如同時持有 `operator` 的裝置）會保留其資料列，且只失去 `node` 角色；僅節點的裝置資料列會被刪除。它也會清除任何相符的舊版閘道擁有節點配對項目。Authz：`operator.pairing` 可移除非操作員節點資料列；使用裝置權杖的呼叫者若要撤銷混合角色裝置上的**自身** `node` 角色，還需要 `operator.admin`。
- `node.pair.verify` - 驗證 `{ nodeId, token }`。

注意：

- `node.pair.request` 對每個節點都是冪等的：重複呼叫會回傳同一個待處理請求。
- 對同一個待處理節點的重複請求會重新整理儲存的節點中繼資料，以及供操作員檢視的最新已列入允許清單宣告命令快照。
- 核准**一律**產生全新的權杖；`node.pair.request` 永遠不會回傳權杖。
- 操作員範圍層級與核准時檢查摘要於[操作員範圍](/zh-TW/gateway/operator-scopes)。
- 請求可以包含 `silent: true`，作為自動核准流程的提示。
- `node.pair.approve` 使用待處理請求的已宣告命令來強制套用額外核准範圍：
  - 無命令請求：`operator.pairing`
  - 非 exec 命令請求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 請求：
    `operator.pairing` + `operator.admin`

<Warning>
節點配對是信任與身分流程，加上權杖核發。它**不會**針對每個節點釘選即時節點命令表面。

- 即時節點命令來自節點在連線時宣告的內容，並由閘道的全域節點命令政策（`gateway.nodes.allowCommands` 和 `denyCommands`）篩選。
- 每節點的 `system.run` 允許與詢問政策位於節點上的 `exec.approvals.node.*`，不在配對記錄中。

</Warning>

## 節點命令控管（2026.3.31+）

<Warning>
**重大變更：** 自 `2026.3.31` 起，節點命令會停用，直到節點配對獲得核准。僅完成裝置配對已不再足以公開已宣告的節點命令。
</Warning>

當節點第一次連線時，會自動請求配對。在該請求獲得核准前，來自該節點的所有待處理節點命令都會被篩選且不會執行。配對獲得核准後，節點宣告的命令會變得可用，但仍受一般命令政策約束。

這表示：

- 先前僅依賴裝置配對來公開命令的節點，現在也必須完成節點配對。
- 配對核准前排入佇列的命令會被捨棄，而不是延後執行。

## 節點事件信任邊界（2026.3.31+）

<Warning>
**重大變更：** 節點發起的執行現在會停留在縮減後的受信任表面。
</Warning>

節點發起的摘要與相關工作階段事件會限制在預期的受信任表面。先前依賴較廣泛主機或工作階段工具存取的通知驅動或節點觸發流程，可能需要調整。此強化可防止節點事件提升為超出節點信任邊界允許範圍的主機層級工具存取。

持久節點在線狀態更新遵循相同的身分邊界：`node.presence.alive` 事件只接受來自已驗證節點裝置工作階段的事件，且只有當裝置/節點身分已配對時才會更新配對中繼資料。自行宣告的 `client.id` 值不足以寫入最後出現狀態。

## 自動核准（macOS app）

macOS app 可以在下列情況嘗試**靜默核准**：

- 請求標記為 `silent`，且
- app 可以使用同一位使用者驗證到閘道主機的 SSH 連線。

如果靜默核准失敗，會退回一般的核准/拒絕提示。

## 受信任 CIDR 裝置自動核准

`role: node` 的 WS 裝置配對預設仍為手動。對於閘道已信任網路路徑的私有節點網路，操作員可以使用明確的 CIDR 或精確 IP 選擇加入：

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
- 不存在全面 LAN 或私有網路自動核准模式。
- 只有全新的 `role: node` 裝置配對請求，且未請求任何範圍時，才符合資格。
- 操作員、瀏覽器、Control UI 和 WebChat 用戶端仍為手動。
- 角色、範圍、中繼資料和公開金鑰升級仍為手動。
- 同主機 loopback 受信任代理標頭路徑不符合資格，因為該路徑可由本機呼叫者偽造。

## 中繼資料升級自動核准

當已配對裝置重新連線，且只有非敏感中繼資料變更（例如顯示名稱或用戶端平台提示）時，OpenClaw 會將其視為 `metadata-upgrade`。靜默自動核准的範圍很窄：它只適用於受信任的非瀏覽器本機重新連線，且已證明持有本機或共享憑證，包括 OS 版本中繼資料變更後的同主機原生 app 重新連線。瀏覽器/Control UI 用戶端與遠端用戶端仍使用明確重新核准流程。範圍升級（read 到 write/admin）與公開金鑰變更**不**符合中繼資料升級自動核准資格；它們仍維持明確重新核准請求。

## QR 配對輔助工具

`/pair qr` 會將配對承載呈現為結構化媒體，讓行動與瀏覽器用戶端可直接掃描。

刪除裝置也會清除該裝置 id 的任何過時待處理配對請求，因此 `nodes pending` 在撤銷後不會顯示孤立資料列。

## 本地性與轉送標頭

只有在原始 socket 與任何上游代理證據都一致時，閘道配對才會將連線視為 loopback。如果請求抵達 loopback，但攜帶 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 標頭證據，該轉送標頭證據會使 loopback 本地性聲明失效，且配對路徑會要求明確核准，而不是靜默地將請求視為同主機連線。操作員驗證的對應規則請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

## 儲存（本機、私有）

配對狀態儲存在閘道狀態目錄下（預設為 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆寫 `OPENCLAW_STATE_DIR`，`nodes/` 資料夾會隨之移動。

安全注意事項：

- 權杖是秘密；請將 `paired.json` 視為敏感資料。
- 輪替權杖需要重新核准（或刪除節點項目）。

## 傳輸行為

- 傳輸是**無狀態**的；它不儲存成員資格。
- 如果閘道離線或配對已停用，節點無法配對。
- 在遠端模式中，配對會針對遠端閘道的儲存區進行。

## 相關

- [通道配對](/zh-TW/channels/pairing)
- [節點命令列介面](/zh-TW/cli/nodes)
- [裝置命令列介面](/zh-TW/cli/devices)
