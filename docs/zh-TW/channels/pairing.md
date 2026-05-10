---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android Node
    - 檢視 OpenClaw 的安全態勢
summary: 配對概覽：核准誰可以私訊你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-05-10T19:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 的明確存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰被允許與 bot 對話）
2. **Node 配對**（哪些裝置/Node 被允許加入 Gateway 網路）

安全情境：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當頻道設定了 DM 政策 `pairing` 時，未知寄件者會取得一組短代碼，且其訊息在你核准前**不會被處理**。

預設 DM 政策記錄於：[安全性](/zh-TW/gateway/security)

只有在有效 DM 允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證要求公開開放設定必須使用該萬用字元。如果現有
狀態包含 `open` 與具體的 `allowFrom` 項目，執行時仍只允許
那些寄件者，且配對儲存區核准不會擴大 `open` 存取範圍。

配對碼：

- 8 個字元、大寫，沒有容易混淆的字元（`0O1I`）。
- **1 小時後過期**。bot 只會在建立新請求時傳送配對訊息（約每位寄件者每小時一次）。
- 預設每個頻道的待處理 DM 配對請求上限為 **3**；額外請求會被忽略，直到其中一個過期或被核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未設定命令擁有者，核准 DM 配對碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會為首次設定提供一個明確的擁有者，用於特權命令與執行
核准提示。擁有者存在後，後續配對核准只會授予 DM
存取；它們不會新增更多擁有者。

支援的頻道：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的寄件者群組

當同一組受信任寄件者應套用到多個訊息頻道，或同時套用到
DM 與群組允許清單時，請使用頂層 `accessGroups`。

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

### 狀態儲存位置

儲存在 `~/.openclaw/credentials/` 下：

- 待處理請求：`<channel>-pairing.json`
- 已核准允許清單儲存區：
  - 預設帳戶：`<channel>-allowFrom.json`
  - 非預設帳戶：`<channel>-<accountId>-allowFrom.json`

帳戶範圍行為：

- 非預設帳戶只讀寫其範圍限定的允許清單檔案。
- 預設帳戶使用頻道範圍、未限定範圍的允許清單檔案。

請將這些視為敏感資料（它們控管對你助理的存取）。

<Note>
配對允許清單儲存區用於 DM 存取。群組授權是分開的。
核准 DM 配對碼不會自動允許該寄件者執行群組
命令或在群組中控制 bot。首次擁有者啟動是
`commands.ownerAllowFrom` 中的另一個設定狀態，而群組聊天傳遞仍遵循
頻道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依頻道而定的每群組
或每主題覆寫）。
</Note>

## 2) Node 裝置配對（iOS/Android/macOS/headless Node）

Node 會以 `role: node` 的**裝置**身分連線到 Gateway。Gateway
會建立必須核准的裝置配對請求。

### 透過 Telegram 配對（建議用於 iOS）

如果你使用 `device-pair` Plugin，可以完全從 Telegram 進行首次裝置配對：

1. 在 Telegram 中，傳訊息給你的 bot：`/pair`
2. bot 會回覆兩則訊息：一則指示訊息，以及一則獨立的**設定碼**訊息（在 Telegram 中易於複製/貼上）。
3. 在你的手機上，開啟 OpenClaw iOS app → Settings → Gateway。
4. 掃描 QR code 或貼上設定碼並連線。
5. 回到 Telegram：`/pair pending`（檢閱請求 ID、角色與範圍），然後核准。

設定碼是 base64 編碼的 JSON payload，內容包含：

- `url`：Gateway WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用於初始配對握手的短效單一裝置啟動 token

該啟動 token 攜帶內建的配對啟動 profile：

- 主要交接的 `node` token 保持 `scopes: []`
- 任何交接的 `operator` token 仍受限於啟動允許清單：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 啟動範圍檢查以角色為前綴，而不是單一扁平範圍池：
  operator 範圍項目只滿足 operator 請求，且非 operator 角色
  仍必須在自己的角色前綴下請求範圍
- 後續 token 輪替/撤銷仍同時受限於裝置已核准的
  角色合約與呼叫者 session 的 operator 範圍

設定碼有效期間，請將其視為密碼。

對於 Tailscale、公開或其他遠端行動裝置配對，請使用 Tailscale Serve/Funnel
或另一個 `wss://` Gateway URL。明文 `ws://` 設定碼只接受
loopback、私人 LAN 位址、`.local` Bonjour 主機，以及 Android
emulator host。Tailnet CGNAT 位址、`.ts.net` 名稱與公開主機仍會
在 QR/setup-code 發行前以失敗關閉方式拒絕。

### 核准 Node 裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准遭拒，原因是執行核准的已配對裝置 session
以僅限配對範圍開啟時，CLI 會以
`operator.admin` 重試相同請求。這讓現有具 admin 能力的已配對裝置可以復原新的
Control UI/瀏覽器配對，而不必手動編輯 `devices/paired.json`。Gateway
仍會驗證重試的連線；無法以
`operator.admin` 驗證的 token 仍會被封鎖。

如果同一裝置以不同 auth 詳細資料重試（例如不同
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對裝置不會無聲取得更廣泛的存取。如果它重新連線並要求更多範圍或更廣泛的角色，OpenClaw 會讓現有核准維持原樣，並建立新的待處理升級請求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取與新請求的存取。
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

這只套用於沒有請求
範圍的新 `role: node` 配對請求。Operator、瀏覽器、Control UI 與 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需要手動
核准。

### Node 配對狀態儲存

儲存在 `~/.openclaw/devices/` 下：

- `pending.json`（短效；待處理請求會過期）
- `paired.json`（已配對裝置 + token）

### 注意事項

- 舊版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是
  另一個由 gateway 擁有的配對儲存區。WS Node 仍需要裝置配對。
- 配對記錄是已核准角色的持久真實來源。有效
  裝置 token 仍受限於該已核准角色集合；已核准角色之外的零散 token 項目
  不會建立新的存取。

## 相關文件

- 安全模型 + prompt injection：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
