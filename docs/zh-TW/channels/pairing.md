---
read_when:
    - 設定 DM 存取控制
    - 配對新的 iOS/Android 節點
    - 檢視 OpenClaw 的安全態勢
summary: 配對概覽：核准誰可以私訊你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-05-07T01:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰可以與 bot 對話）
2. **Node 配對**（哪些裝置/Node 可以加入 Gateway 網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當某個頻道設定了 DM 政策 `pairing` 時，未知寄件者會取得一組短代碼，而他們的訊息在你核准之前**不會被處理**。

預設 DM 政策記錄於：[安全性](/zh-TW/gateway/security)

`dmPolicy: "open"` 只有在有效的 DM 允許清單包含 `"*"` 時才是公開的。
設定與驗證要求公開開放設定必須有此萬用字元。如果既有狀態包含
具體 `allowFrom` 項目的 `open`，執行階段仍只允許這些寄件者，
而配對儲存核准不會擴大 `open` 存取權。

配對代碼：

- 8 個字元、大寫、沒有易混淆字元（`0O1I`）。
- **1 小時後到期**。bot 只有在建立新請求時才會傳送配對訊息（每位寄件者大約每小時一次）。
- 待處理的 DM 配對請求預設每個頻道最多 **3 個**；額外請求會被忽略，直到其中一個到期或獲得核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未設定命令擁有者，核准 DM 配對代碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會讓首次設定具有一位明確的擁有者，可用於特權命令與 exec
核准提示。擁有者存在後，之後的配對核准只會授予 DM
存取權；它們不會新增更多擁有者。

支援的頻道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的寄件者群組

當同一組受信任寄件者集合應套用到多個訊息頻道，或同時套用到 DM
與群組允許清單時，請使用頂層 `accessGroups`。

靜態群組使用 `type: "message.senders"`，並從頻道允許清單以
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

### 狀態存放位置

儲存在 `~/.openclaw/credentials/` 之下：

- 待處理請求：`<channel>-pairing.json`
- 已核准允許清單儲存：
  - 預設帳號：`<channel>-allowFrom.json`
  - 非預設帳號：`<channel>-<accountId>-allowFrom.json`

帳號範圍行為：

- 非預設帳號只會讀取/寫入其範圍化的允許清單檔案。
- 預設帳號使用頻道範圍的非範圍化允許清單檔案。

請將這些視為敏感資訊（它們會控管對你的助理的存取）。

<Note>
配對允許清單儲存是用於 DM 存取。群組授權是分開的。
核准 DM 配對代碼不會自動允許該寄件者執行群組
命令或在群組中控制 bot。首次擁有者啟動是 `commands.ownerAllowFrom`
中的獨立設定狀態，而群組聊天投遞仍會遵循該頻道的群組允許清單
（例如 `groupAllowFrom`、`groups`，或依頻道而定的每群組
或每主題覆寫）。
</Note>

## 2) Node 裝置配對（iOS/Android/macOS/headless Node）

Node 以 `role: node` 的**裝置**身分連線到 Gateway。Gateway
會建立必須核准的裝置配對請求。

### 透過 Telegram 配對（建議用於 iOS）

如果你使用 `device-pair` Plugin，就可以完全透過 Telegram 進行首次裝置配對：

1. 在 Telegram 中傳訊息給你的 bot：`/pair`
2. bot 會回覆兩則訊息：一則指示訊息，以及另一則獨立的**設定代碼**訊息（方便在 Telegram 中複製/貼上）。
3. 在手機上開啟 OpenClaw iOS app → Settings → Gateway。
4. 掃描 QR code 或貼上設定代碼並連線。
5. 回到 Telegram：`/pair pending`（檢視請求 ID、角色與範圍），然後核准。

設定代碼是 base64 編碼的 JSON 承載，其中包含：

- `url`：Gateway WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：短效、單裝置啟動 token，用於初始配對握手

該啟動 token 具有內建的配對啟動設定檔：

- 主要移交的 `node` token 保持 `scopes: []`
- 任何移交的 `operator` token 都仍限制在啟動允許清單內：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 啟動範圍檢查會加上角色前綴，而不是單一扁平範圍池：
  operator 範圍項目只會滿足 operator 請求，非 operator 角色
  仍必須在自己的角色前綴下請求範圍
- 之後的 token 輪替/撤銷仍會同時受限於裝置已核准的
  角色合約與呼叫者工作階段的 operator 範圍

請在設定代碼有效期間將其視同密碼。

對於 Tailscale、公開或其他遠端行動裝置配對，請使用 Tailscale Serve/Funnel
或其他 `wss://` Gateway URL。純文字 `ws://` 設定代碼只接受
local loopback、私人 LAN 位址、`.local` Bonjour 主機，以及 Android
模擬器主機。Tailnet CGNAT 位址、`.ts.net` 名稱與公開主機仍會在 QR/設定代碼核發前
失敗並關閉。

### 核准 Node 裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准因為進行核准的已配對裝置工作階段
是以僅配對範圍開啟而被拒絕時，CLI 會以
`operator.admin` 重試相同請求。這讓既有具 admin 能力的已配對裝置能恢復新的
Control UI/browser 配對，而不需手動編輯 `devices/paired.json`。Gateway
仍會驗證重試的連線；無法以 `operator.admin` 驗證的 token 仍會被封鎖。

如果同一裝置以不同驗證詳細資料重試（例如不同的
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會默默取得更廣的存取權。如果它重新連線並要求更多範圍或更廣的角色，OpenClaw 會保留既有核准不變，並建立新的待處理升級請求。在核准前，請使用 `openclaw devices list` 比較目前已核准存取權與新請求的存取權。
</Note>

### 選用的受信任 CIDR Node 自動核准

裝置配對預設仍為手動。對於嚴格控管的 Node 網路，
你可以選擇加入首次 Node 自動核准，並使用明確 CIDR 或精確 IP：

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

這只適用於沒有請求範圍的新 `role: node` 配對請求。
Operator、browser、Control UI 與 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需要手動
核准。

### Node 配對狀態儲存

儲存在 `~/.openclaw/devices/` 之下：

- `pending.json`（短效；待處理請求會到期）
- `paired.json`（已配對裝置 + token）

### 注意事項

- 舊版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是
  另一個由 Gateway 擁有的配對儲存。WS Node 仍需要裝置配對。
- 配對記錄是已核准角色的持久真實來源。作用中的
  裝置 token 仍受限於該已核准角色集合；已核准角色之外的零散 token 項目
  不會建立新的存取權。

## 相關文件

- 安全模型 + 提示注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - BlueBubbles（舊版 iMessage bridge）：[BlueBubbles](/zh-TW/channels/bluebubbles)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
