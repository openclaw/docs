---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節点
    - 檢視 OpenClaw 安全態勢
summary: 配對概覽：核准誰可以私訊你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-04-30T02:48:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰被允許與機器人交談）
2. **Node 配對**（哪些裝置/Node 被允許加入 Gateway 網路）

安全性脈絡：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當某個頻道設定為 DM 政策 `pairing` 時，未知寄件者會取得一組短代碼，而且在你核准前，其訊息**不會被處理**。

預設 DM 政策記錄於：[安全性](/zh-TW/gateway/security)

只有在有效的 DM 允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證公開開放設定時需要這個萬用字元。若既有狀態包含
`open` 以及具體的 `allowFrom` 項目，執行階段仍只允許
那些寄件者，而配對儲存區核准不會擴大 `open` 存取權。

配對代碼：

- 8 個字元、大寫、不含易混淆字元（`0O1I`）。
- **1 小時後過期**。機器人只會在建立新請求時傳送配對訊息（約每位寄件者每小時一次）。
- 待處理的 DM 配對請求預設上限為**每個頻道 3 個**；額外請求會被忽略，直到其中一個過期或被核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未設定命令擁有者，核准 DM 配對代碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會讓首次設定具備一位明確擁有者，可用於特權命令與 exec
核准提示。在擁有者存在後，後續配對核准只會授予 DM
存取權；它們不會新增更多擁有者。

支援的頻道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 狀態存放位置

存放於 `~/.openclaw/credentials/`：

- 待處理請求：`<channel>-pairing.json`
- 已核准允許清單儲存區：
  - 預設帳號：`<channel>-allowFrom.json`
  - 非預設帳號：`<channel>-<accountId>-allowFrom.json`

帳號範圍行為：

- 非預設帳號只會讀寫其範圍限定的允許清單檔案。
- 預設帳號使用頻道範圍、未限定範圍的允許清單檔案。

請將這些視為敏感資料（它們控管對你的助理的存取權）。

<Note>
配對允許清單儲存區用於 DM 存取。群組授權是分開的。
核准 DM 配對代碼不會自動允許該寄件者執行群組
命令或在群組中控制機器人。第一位擁有者啟動設定是
`commands.ownerAllowFrom` 中的獨立設定狀態，而群組聊天傳遞仍遵循
頻道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依頻道而定的個別群組
或個別主題覆寫）。
</Note>

## 2) Node 裝置配對（iOS/Android/macOS/無頭 Node）

Node 會以具備 `role: node` 的**裝置**身分連線至 Gateway。Gateway
會建立必須核准的裝置配對請求。

### 透過 Telegram 配對（建議用於 iOS）

如果你使用 `device-pair` Plugin，可以完全透過 Telegram 完成首次裝置配對：

1. 在 Telegram 中傳訊息給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則指示訊息，以及另一則獨立的**設定代碼**訊息（在 Telegram 中易於複製/貼上）。
3. 在手機上開啟 OpenClaw iOS app → Settings → Gateway。
4. 貼上設定代碼並連線。
5. 回到 Telegram：`/pair pending`（檢閱請求 ID、角色與範圍），然後核准。

設定代碼是 base64 編碼的 JSON 承載，其中包含：

- `url`：Gateway WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：短效、單一裝置的啟動權杖，用於初始配對交握

該啟動權杖帶有內建的配對啟動設定檔：

- 主要交接的 `node` 權杖維持 `scopes: []`
- 任何交接的 `operator` 權杖都會限制在啟動允許清單內：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 啟動範圍檢查以角色作為前綴，而不是單一扁平範圍池：
  operator 範圍項目只會滿足 operator 請求，且非 operator 角色
  仍必須在其自身角色前綴下請求範圍
- 後續權杖輪換/撤銷仍同時受限於裝置已核准的
  角色合約，以及呼叫者工作階段的 operator 範圍

在設定代碼有效期間，請像密碼一樣看待它。

### 核准 Node 裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果同一裝置以不同驗證詳細資料重試（例如不同的
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會被靜默授予更廣的存取權。如果它重新連線並要求更多範圍或更廣的角色，OpenClaw 會保持既有核准不變，並建立新的待處理升級請求。在核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新請求的存取權。
</Note>

### 選用的受信任 CIDR Node 自動核准

裝置配對預設仍為手動。對於嚴格控管的 Node 網路，
你可以使用明確 CIDR 或精確 IP 選擇加入首次 Node 自動核准：

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

這只適用於沒有請求
範圍的全新 `role: node` 配對請求。Operator、瀏覽器、Control UI 與 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需要手動
核准。

### Node 配對狀態儲存

存放於 `~/.openclaw/devices/`：

- `pending.json`（短效；待處理請求會過期）
- `paired.json`（已配對裝置 + 權杖）

### 注意事項

- 舊版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是
  獨立、由 Gateway 擁有的配對儲存區。WS Node 仍需要裝置配對。
- 配對記錄是已核准角色的持久真實來源。作用中的
  裝置權杖仍受限於該已核准角色集合；位於已核准角色之外的零散權杖項目
  不會建立新的存取權。

## 相關文件

- 安全性模型 + 提示注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - BlueBubbles（iMessage）：[BlueBubbles](/zh-TW/channels/bluebubbles)
  - iMessage（舊版）：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
