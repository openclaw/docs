---
read_when:
    - 實作不需 macOS UI 的節點配對核准
    - 新增用於核准遠端節點的命令列介面流程
    - 擴充閘道協定以支援節點管理
summary: 閘道擁有的節點配對（選項 B），適用於 iOS 與其他遠端節點
title: 閘道擁有的配對
x-i18n:
    generated_at: "2026-07-05T11:19:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e27f57410e3222004aca7464fd24bad0f1835c9f0cbcfc69a68845faaf338ba
    source_path: gateway/pairing.md
    workflow: 16
---

在 Gateway 擁有的配對中，**Gateway** 是哪些節點可加入的事實來源。UI（macOS app、未來的用戶端）只是核准或拒絕待處理請求的前端。

**重要：** WS 節點在 `connect` 期間使用**裝置配對**（角色 `node`）。`node.pair.*` 是另一個獨立的舊版配對儲存區，且**不會**管控 WS 交握。只有明確呼叫 `node.pair.*` 的用戶端才會使用此流程。

## 概念

- **待處理請求**：節點要求加入；需要核准。
- **已配對節點**：已核准並核發驗證權杖的節點。
- **傳輸**：Gateway WS 端點會轉送請求，但不決定成員資格。舊版 TCP 橋接支援已移除。

## 配對如何運作

1. 節點連線到 Gateway WS 並請求配對。
2. Gateway 儲存一個**待處理請求**並發出 `node.pair.requested`。
3. 你核准或拒絕該請求（命令列介面或 UI）。
4. 核准後，Gateway 會核發一個**新權杖**（重新配對時權杖會輪替）。
5. 節點使用該權杖重新連線，現在即為已配對。

待處理請求會在 **5 分鐘**後自動到期。

## 命令列介面工作流程（適合無頭環境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 會顯示已配對/已連線的節點及其能力。

## API 介面（閘道協定）

事件：

- `node.pair.requested` - 建立新的待處理請求時發出。
- `node.pair.resolved` - 請求被核准、拒絕或到期時發出。

方法：

- `node.pair.request` - 建立或重用待處理請求。
- `node.pair.list` - 列出待處理和已配對的節點（`operator.pairing`）。
- `node.pair.approve` - 核准待處理請求（核發權杖）。
- `node.pair.reject` - 拒絕待處理請求。
- `node.pair.remove` - 移除已配對節點。對於由裝置支撐的配對，這會撤銷裝置的 `node` 角色：它會變更 `devices/paired.json`，並使該裝置的節點角色工作階段失效/中斷連線。**混合角色**裝置（例如同時持有 `operator` 的裝置）會保留其列，且只會失去 `node` 角色；僅節點的裝置列會被刪除。它也會清除任何相符的舊版 Gateway 擁有節點配對項目。授權：`operator.pairing` 可移除非操作員節點列；裝置權杖呼叫者在混合角色裝置上撤銷其**自身** `node` 角色時，還需要 `operator.admin`。
- `node.pair.verify` - 驗證 `{ nodeId, token }`。

注意事項：

- `node.pair.request` 對每個節點都是冪等的：重複呼叫會傳回相同的待處理請求。
- 對同一待處理節點的重複請求會重新整理儲存的節點中繼資料，以及最新列入允許清單的已宣告命令快照，以供操作員查看。
- 核准**一律**會產生新的權杖；`node.pair.request` 絕不會傳回權杖。
- 操作員範圍等級和核准時檢查彙整於[操作員範圍](/zh-TW/gateway/operator-scopes)。
- 請求可包含 `silent: true`，作為自動核准流程的提示。
- `node.pair.approve` 會使用待處理請求的已宣告命令來強制執行額外的核准範圍：
  - 無命令請求：`operator.pairing`
  - 非 exec 命令請求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 請求：
    `operator.pairing` + `operator.admin`

<Warning>
節點配對是信任與身分流程，加上權杖核發。它**不會**按節點釘選即時節點命令介面。

- 即時節點命令來自節點在連線時宣告的內容，並由閘道的全域節點命令政策（`gateway.nodes.allowCommands` 和 `denyCommands`）篩選。
- 每節點的 `system.run` 允許與詢問政策位於節點上的 `exec.approvals.node.*`，不在配對記錄中。

</Warning>

## 節點命令管控（2026.3.31+）

<Warning>
**破壞性變更：** 從 `2026.3.31` 開始，節點命令會停用，直到節點配對獲得核准。僅有裝置配對已不足以公開已宣告的節點命令。
</Warning>

節點首次連線時，會自動請求配對。在該請求獲得核准之前，來自該節點的所有待處理節點命令都會被篩選且不會執行。配對獲得核准後，節點宣告的命令會變為可用，並受一般命令政策約束。

這表示：

- 先前只依賴裝置配對來公開命令的節點，現在也必須完成節點配對。
- 配對核准前排入佇列的命令會被捨棄，而不是延後執行。

## 節點事件信任邊界（2026.3.31+）

<Warning>
**破壞性變更：** 節點發起的執行現在會停留在縮減後的受信任介面上。
</Warning>

節點發起的摘要和相關工作階段事件會限制在預期的受信任介面內。先前依賴更廣泛主機或工作階段工具存取權的通知驅動或節點觸發流程，可能需要調整。這項強化可防止節點事件提升為超出節點信任邊界允許範圍的主機層級工具存取權。

持久節點存在狀態更新遵循相同身分邊界：`node.presence.alive` 事件只接受來自已驗證節點裝置工作階段的事件，且只有當裝置/節點身分已配對時才會更新配對中繼資料。自行宣告的 `client.id` 值不足以寫入最後出現狀態。

## 自動核准（macOS app）

macOS app 可在下列情況嘗試**靜默核准**：

- 請求標記為 `silent`，且
- app 可以使用相同使用者驗證到 Gateway 主機的 SSH 連線。

如果靜默核准失敗，會退回一般的核准/拒絕提示。

## 受信任 CIDR 裝置自動核准

`role: node` 的 WS 裝置配對預設維持手動。對於 Gateway 已信任網路路徑的私有節點網路，操作員可以使用明確 CIDR 或精確 IP 選擇加入：

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
- 不存在概括性的 LAN 或私有網路自動核准模式。
- 只有沒有請求範圍的新鮮 `role: node` 裝置配對請求符合資格。
- 操作員、瀏覽器、Control UI 和 WebChat 用戶端維持手動。
- 角色、範圍、中繼資料和公開金鑰升級維持手動。
- 同主機迴圈受信任代理標頭路徑不符合資格，因為該路徑可能被本機呼叫者偽造。

## 中繼資料升級自動核准

當已配對裝置重新連線且只有非敏感中繼資料變更（例如顯示名稱或用戶端平台提示）時，OpenClaw 會將其視為 `metadata-upgrade`。靜默自動核准範圍很窄：它只適用於已證明持有本機或共享憑證的受信任非瀏覽器本機重新連線，包括 OS 版本中繼資料變更後的同主機原生 app 重新連線。瀏覽器/Control UI 用戶端和遠端用戶端仍使用明確重新核准流程。範圍升級（read 到 write/admin）和公開金鑰變更**不**符合中繼資料升級自動核准資格；它們維持明確重新核准請求。

## QR 配對輔助工具

`/pair qr` 會將配對承載呈現為結構化媒體，讓行動和瀏覽器用戶端可以直接掃描。

刪除裝置也會清除該裝置 ID 的任何過期待處理配對請求，因此撤銷後 `nodes pending` 不會顯示孤立列。

## 位置性與轉送標頭

Gateway 配對只有在原始 socket 和任何上游代理證據都一致時，才會將連線視為 loopback。如果請求抵達 loopback 但帶有 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 標頭證據，該轉送標頭證據會使 loopback 位置性主張失效，且配對路徑需要明確核准，而不是靜默地將請求視為同主機連線。請參閱[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)，了解操作員驗證的等效規則。

## 儲存（本機、私有）

配對狀態儲存在 Gateway 狀態目錄下（預設為 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆寫 `OPENCLAW_STATE_DIR`，`nodes/` 資料夾也會隨之移動。

安全注意事項：

- 權杖是秘密；請將 `paired.json` 視為敏感資料。
- 輪替權杖需要重新核准（或刪除節點項目）。

## 傳輸行為

- 傳輸是**無狀態**的；它不儲存成員資格。
- 如果 Gateway 離線或配對已停用，節點無法配對。
- 在遠端模式中，配對會針對遠端 Gateway 的儲存區進行。

## 相關

- [頻道配對](/zh-TW/channels/pairing)
- [節點命令列介面](/zh-TW/cli/nodes)
- [裝置命令列介面](/zh-TW/cli/devices)
