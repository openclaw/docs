---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android Node
    - 檢視 OpenClaw 的安全態勢
summary: 配對概覽：核准誰可以私訊你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-05-04T02:21:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰可以與機器人交談）
2. **Node 配對**（哪些裝置/Node 可以加入 Gateway 網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當通道設定為 DM 政策 `pairing` 時，未知寄件者會取得一組短代碼，且在你核准之前，他們的訊息**不會被處理**。

預設 DM 政策記載於：[安全性](/zh-TW/gateway/security)

只有在有效的 DM 允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證會要求公開開放設定具備這個萬用字元。如果現有
狀態包含 `open` 並搭配具體的 `allowFrom` 項目，執行階段仍只會允許
那些寄件者，且配對儲存區的核准不會擴大 `open` 存取權。

配對代碼：

- 8 個字元、大寫、不含容易混淆的字元（`0O1I`）。
- **1 小時後過期**。機器人只會在建立新請求時傳送配對訊息（大約每位寄件者每小時一次）。
- 待處理的 DM 配對請求預設每個通道上限為 **3 個**；額外請求會被忽略，直到其中一個過期或被核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未設定命令擁有者，核准 DM 配對代碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會讓初次設定擁有一個明確的擁有者，用於特權命令與 exec
核准提示。擁有者存在後，後續配對核准只會授予 DM
存取權；不會新增更多擁有者。

支援的通道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的寄件者群組

當同一組受信任寄件者應套用到多個訊息通道，或同時套用到 DM 與群組允許清單時，請使用最上層的 `accessGroups`。

靜態群組使用 `type: "message.senders"`，並從通道允許清單以
`accessGroup:<name>` 參照：

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

存取群組的詳細文件在此：[存取群組](/zh-TW/channels/access-groups)

### 狀態儲存位置

儲存在 `~/.openclaw/credentials/` 底下：

- 待處理請求：`<channel>-pairing.json`
- 已核准允許清單儲存區：
  - 預設帳號：`<channel>-allowFrom.json`
  - 非預設帳號：`<channel>-<accountId>-allowFrom.json`

帳號範圍行為：

- 非預設帳號只會讀寫其範圍限定的允許清單檔案。
- 預設帳號使用通道範圍、未範圍限定的允許清單檔案。

請將這些視為敏感資料（它們會控管你的助理存取權）。

<Note>
配對允許清單儲存區用於 DM 存取。群組授權是分開的。
核准 DM 配對代碼不會自動允許該寄件者執行群組
命令或在群組中控制機器人。第一位擁有者啟動是位於
`commands.ownerAllowFrom` 的獨立設定狀態，而群組聊天傳遞仍遵循
通道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依通道而定的每群組
或每主題覆寫）。
</Note>

## 2) Node 裝置配對（iOS/Android/macOS/無頭 Node）

Node 以具備 `role: node` 的**裝置**身分連線到 Gateway。Gateway
會建立必須核准的裝置配對請求。

### 透過 Telegram 配對（建議用於 iOS）

如果你使用 `device-pair` Plugin，可以完全透過 Telegram 進行初次裝置配對：

1. 在 Telegram 中傳訊息給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則指示訊息，以及另一則獨立的**設定代碼**訊息（便於在 Telegram 中複製/貼上）。
3. 在手機上開啟 OpenClaw iOS 應用程式 → 設定 → Gateway。
4. 貼上設定代碼並連線。
5. 回到 Telegram：`/pair pending`（檢閱請求 ID、角色與範圍），然後核准。

設定代碼是 base64 編碼的 JSON 承載，其中包含：

- `url`：Gateway WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用於初始配對握手的短效單一裝置啟動權杖

該啟動權杖帶有內建配對啟動設定檔：

- 主要交接的 `node` 權杖維持 `scopes: []`
- 任何交接的 `operator` 權杖都會限制在啟動允許清單內：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 啟動範圍檢查會以角色作為前綴，而不是單一扁平範圍池：
  operator 範圍項目只會滿足 operator 請求，非 operator 角色
  仍必須在自己的角色前綴底下請求範圍
- 後續權杖輪替/撤銷仍同時受裝置已核准的
  角色合約與呼叫端工作階段的 operator 範圍限制

在設定代碼有效期間，請將它視為密碼。

### 核准 Node 裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准因核准用配對裝置工作階段
只以配對專用範圍開啟而遭拒時，CLI 會使用
`operator.admin` 重試同一個請求。這讓現有具備管理能力的配對裝置可以復原新的
Control UI/瀏覽器配對，而無需手動編輯 `devices/paired.json`。
Gateway 仍會驗證重試的連線；無法以
`operator.admin` 驗證的權杖仍會被阻擋。

如果同一台裝置以不同驗證詳細資訊重試（例如不同的
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會在無聲情況下取得更廣泛的存取權。如果它重新連線並要求更多範圍或更廣泛的角色，OpenClaw 會保留現有核准不變，並建立新的待處理升級請求。在核准之前，請使用 `openclaw devices list` 比較目前已核准的存取權與新請求的存取權。
</Note>

### 選用的受信任 CIDR Node 自動核准

裝置配對預設仍為手動。對於嚴格控管的 Node 網路，
你可以透過明確 CIDR 或精確 IP 選擇加入初次 Node 自動核准：

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

這只會套用於不請求任何範圍的全新 `role: node` 配對請求。
Operator、瀏覽器、Control UI 與 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需要手動
核准。

### Node 配對狀態儲存

儲存在 `~/.openclaw/devices/` 底下：

- `pending.json`（短效；待處理請求會過期）
- `paired.json`（已配對裝置 + 權杖）

### 注意事項

- 舊版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是
  獨立的 Gateway 擁有配對儲存區。WS Node 仍需要裝置配對。
- 配對記錄是已核准角色的持久真實來源。作用中
  裝置權杖仍受該已核准角色集合限制；已核准角色之外的零散權杖項目
  不會建立新的存取權。

## 相關文件

- 安全性模型 + 提示注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 通道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - BlueBubbles（iMessage）：[BlueBubbles](/zh-TW/channels/bluebubbles)
  - iMessage（舊版）：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
