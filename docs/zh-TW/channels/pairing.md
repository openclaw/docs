---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節點
    - 檢視 OpenClaw 的安全態勢
summary: 配對總覽：核准誰可以私訊你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-05-04T09:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰可以和機器人對話）
2. **Node 配對**（哪些裝置/Node 可以加入 Gateway 網路）

安全性脈絡：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當某個通道設定了 DM 政策 `pairing`，未知寄件者會收到一組短代碼，而且其訊息在你核准之前**不會被處理**。

預設 DM 政策記載於：[安全性](/zh-TW/gateway/security)

`dmPolicy: "open"` 只有在有效 DM 允許清單包含 `"*"` 時才是公開的。
公開開放設定的設定與驗證需要該萬用字元。如果既有狀態包含 `open`
且有具體的 `allowFrom` 項目，執行階段仍只允許那些寄件者，
而配對儲存核准不會擴大 `open` 存取權。

配對代碼：

- 8 個字元、大寫、沒有易混淆字元（`0O1I`）。
- **1 小時後過期**。機器人只會在建立新請求時傳送配對訊息（大約每位寄件者每小時一次）。
- 待處理的 DM 配對請求預設每個通道上限為 **3 個**；額外請求會被忽略，直到有一個過期或被核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未設定命令擁有者，核准 DM 配對代碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會讓首次設定明確擁有可執行特權命令與執行核准提示的擁有者。
擁有者存在之後，後續配對核准只會授予 DM 存取權；
不會新增更多擁有者。

支援的通道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的寄件者群組

當同一組受信任寄件者應套用到多個訊息通道，或同時套用到 DM 與群組允許清單時，
請使用頂層的 `accessGroups`。

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

存取群組的詳細說明在這裡：[存取群組](/zh-TW/channels/access-groups)

### 狀態儲存位置

儲存在 `~/.openclaw/credentials/` 之下：

- 待處理請求：`<channel>-pairing.json`
- 已核准允許清單儲存：
  - 預設帳號：`<channel>-allowFrom.json`
  - 非預設帳號：`<channel>-<accountId>-allowFrom.json`

帳號範圍行為：

- 非預設帳號只讀寫其範圍限定的允許清單檔案。
- 預設帳號使用通道範圍、未限定範圍的允許清單檔案。

請將這些視為敏感資料（它們會管控對你助理的存取）。

<Note>
配對允許清單儲存用於 DM 存取。群組授權是分開的。
核准 DM 配對代碼不會自動允許該寄件者執行群組命令，
或在群組中控制機器人。首次擁有者啟動設定是
`commands.ownerAllowFrom` 中獨立的設定狀態，而群組聊天遞送仍遵循
通道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依通道而定的每群組
或每主題覆寫）。
</Note>

## 2) Node 裝置配對（iOS/Android/macOS/無頭 Node）

Node 會以 `role: node` 的**裝置**身分連線到 Gateway。Gateway
會建立必須核准的裝置配對請求。

### 透過 Telegram 配對（建議用於 iOS）

如果你使用 `device-pair` Plugin，可以完全從 Telegram 完成首次裝置配對：

1. 在 Telegram 中傳訊息給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則指示訊息，以及一則獨立的**設定代碼**訊息（在 Telegram 中易於複製/貼上）。
3. 在手機上開啟 OpenClaw iOS app → Settings → Gateway。
4. 掃描 QR code 或貼上設定代碼並連線。
5. 回到 Telegram：`/pair pending`（檢視請求 ID、角色與範圍），然後核准。

設定代碼是 base64 編碼的 JSON 承載內容，包含：

- `url`：Gateway WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用於初始配對交握的短效單裝置啟動 token

該啟動 token 帶有內建的配對啟動設定檔：

- 主要交接的 `node` token 保持 `scopes: []`
- 任何交接的 `operator` token 都限制於啟動允許清單：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 啟動範圍檢查以角色為前綴，而不是單一扁平範圍池：
  operator 範圍項目只滿足 operator 請求，而非 operator 角色
  仍必須在自己的角色前綴下請求範圍
- 後續 token 輪替/撤銷仍受裝置已核准的
  角色合約與呼叫者工作階段的 operator 範圍共同限制

設定代碼有效時，請像密碼一樣對待它。

對於 Tailscale、公開或其他非 local loopback 的行動裝置配對，請使用 Tailscale
Serve/Funnel 或其他 `wss://` Gateway URL。直接非 local loopback 的 `ws://` 設定
URL 會在發出 QR/設定代碼之前被拒絕。明文 `ws://` 設定代碼
僅限於 loopback URL；私人網路 `ws://` 用戶端仍需要遠端
Gateway 指南中所述的明確
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 破窗設定。

### 核准 Node 裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准被拒絕，原因是執行核准的已配對裝置工作階段
以僅配對範圍開啟時，CLI 會使用 `operator.admin` 重試同一個請求。
這讓既有具備管理能力的已配對裝置，可以在不手動編輯
`devices/paired.json` 的情況下復原新的 Control UI/瀏覽器配對。Gateway
仍會驗證重試的連線；無法以 `operator.admin` 驗證的 token
仍會被封鎖。

如果同一裝置使用不同驗證詳細資料重試（例如不同
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會悄悄取得更廣的存取權。如果它重新連線並要求更多範圍或更廣角色，OpenClaw 會保持既有核准不變，並建立新的待處理升級請求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新請求的存取權。
</Note>

### 選用的受信任 CIDR Node 自動核准

裝置配對預設仍為手動。對於嚴格控管的 Node 網路，
你可以選擇以明確 CIDR 或精確 IP 啟用首次 Node 自動核准：

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

這只適用於全新的 `role: node` 配對請求，且不得要求任何
範圍。Operator、瀏覽器、Control UI 與 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需要手動
核准。

### Node 配對狀態儲存

儲存在 `~/.openclaw/devices/` 之下：

- `pending.json`（短效；待處理請求會過期）
- `paired.json`（已配對裝置 + token）

### 備註

- 舊版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是
  獨立的 Gateway 擁有配對儲存。WS Node 仍需要裝置配對。
- 配對記錄是已核准角色的持久真實來源。作用中的
  裝置 token 仍受限於該已核准角色集合；位於已核准角色之外的零散 token 項目
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
