---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節點
    - 審查 OpenClaw 安全態勢
summary: 配對概覽：核准誰可以傳私訊給你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-07-05T11:03:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edb1f7766c1512ed2dd0977bf8e3cce55b0e6ac34ace05921e62792c4c453afd
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰可以與機器人對話）
2. **節點配對**（哪些裝置/節點可以加入閘道網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當頻道設定為 DM 政策 `pairing` 時，未知寄件者會取得一個短代碼，而他們的訊息在你核准前**不會被處理**。

預設 DM 政策記錄於：[安全性](/zh-TW/gateway/security)

只有當有效的 DM allowlist 包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證會要求公開開放設定使用該萬用字元。如果現有
狀態包含 `open` 與具體的 `allowFrom` 項目，執行階段仍只會允許
那些寄件者，而配對儲存區核准不會擴大 `open` 存取權。

配對代碼：

- 8 個字元、大寫、沒有易混淆字元（`0O1I`）。
- **1 小時後過期**。機器人只會在建立新請求時傳送配對訊息（大約每位寄件者每小時一次）。
- 待處理的 DM 配對請求上限為**每個頻道帳號 3 個**；額外請求會被忽略，直到其中一個過期或獲得核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

在 approve 命令加上 `--notify`，即可在同一頻道通知請求者。多帳號頻道使用 `--account <id>`。

如果尚未設定命令擁有者，核准 DM 配對代碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會讓首次設定取得一個明確的擁有者，用於特權命令與 exec
核准提示。擁有者存在後，後續配對核准只會授予 DM
存取權；它們不會新增更多擁有者。

支援的頻道（任何已安裝且宣告配對的頻道外掛；外部外掛例如 `openclaw-weixin` 可新增更多）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的寄件者群組

當同一組受信任寄件者應套用到多個訊息頻道，或同時套用到 DM
與群組 allowlist 時，請使用頂層 `accessGroups`。

靜態群組使用 `type: "message.senders"`，並透過頻道 allowlist 中的
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
- 已核准 allowlist 儲存區：`<channel>-<accountId>-allowFrom.json`（預設帳號的核准使用 `<channel>-default-allowFrom.json`）

帳號範圍行為：

- 非預設帳號只會讀寫其範圍內的 allowlist 檔案。
- 預設帳號也會繼續遵循舊版安裝中的傳統未限定範圍 `<channel>-allowFrom.json`
  檔案；讀取時會合併兩個檔案的項目。

請將這些視為敏感資料（它們會控管對你助理的存取）。

<Note>
配對 allowlist 儲存區用於 DM 存取。群組授權是分開的。
核准 DM 配對代碼不會自動允許該寄件者執行群組
命令或在群組中控制機器人。第一個擁有者啟動設定是
`commands.ownerAllowFrom` 中的獨立設定狀態，而群組聊天傳遞仍會遵循
頻道的群組 allowlist（例如 `groupAllowFrom`、`groups`，或依頻道而定的每群組
或每主題覆寫）。
</Note>

## 2) 節點裝置配對（iOS/Android/macOS/無頭節點）

節點會以 `role: node` 的**裝置**身分連線到閘道。閘道
會建立必須核准的裝置配對請求。

### 從控制介面配對（建議）

使用已有 `operator.admin` 存取權且已連線的控制介面工作階段：

1. 開啟控制介面並選取**節點**。
2. 在**裝置**中，按一下**配對行動裝置**。
3. 在手機上開啟 OpenClaw app → **設定** → **閘道**。
4. 掃描 QR code 或貼上設定代碼，然後連線。

官方 OpenClaw iOS 與 Android app 會在其
設定代碼 metadata 相符時自動核准。如果**裝置**顯示待處理請求（例如
非官方用戶端或 metadata 不相符），請在核准前檢閱其角色與
scopes。

當目前控制介面工作階段沒有管理員存取權時，按鈕會停用。
這種情況請在閘道主機上使用下方的命令列介面核准流程。

### 透過 Telegram 配對

如果你使用 `device-pair` 外掛，可以完全從 Telegram 進行首次裝置配對：

1. 在 Telegram 中，傳訊息給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則說明訊息，以及一則獨立的**設定代碼**訊息（方便在 Telegram 中複製/貼上）。
3. 在手機上開啟 OpenClaw iOS app → Settings → Gateway。
4. 掃描 QR code（`/pair qr`）或貼上設定代碼並連線。
5. 官方行動 app 會自動連線。如果 `/pair pending` 顯示
   請求，請在核准前檢閱其角色與 scopes。

設定代碼是一個 base64 編碼的 JSON payload，包含：

- `url`：閘道 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用於初始配對 handshake 的一次性 bootstrap token（10 分鐘後過期；payload 中包含 `expiresAtMs`）

配對完成後，執行 `/pair cleanup` 讓未使用的設定代碼失效。

該 bootstrap token 帶有內建配對 bootstrap profile：

- 內建設定 profile 只允許全新的 QR/設定代碼基準：
  `node` 加上受限的 `operator` handoff
- handoff 後的 `node` token 會維持 `scopes: []`
- handoff 後的 `operator` token 僅限於 `operator.approvals`、
  `operator.read`、`operator.talk.secrets` 與 `operator.write`
- QR/設定代碼 bootstrap 不會授予 `operator.admin`；它需要
  另一個已核准的 operator 配對或 token 流程
- 後續 token 輪替/撤銷仍受裝置已核准
  角色合約與呼叫者工作階段 operator scopes 共同限制

設定代碼有效期間，請像對待密碼一樣保護它。

對於 Tailscale、公開或其他遠端行動配對，請使用 Tailscale Serve/Funnel
或另一個 `wss://` 閘道 URL。明文 `ws://` 設定代碼只接受
loopback、私人 LAN 位址、`.local` Bonjour 主機，以及 Android
模擬器主機。Tailnet CGNAT 位址、`.ts.net` 名稱與公開主機仍會
在 QR/設定代碼簽發前 fail closed。

### 核准節點裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准因核准用的已配對裝置工作階段
以 pairing-only scope 開啟而被拒絕時，命令列介面會使用
`operator.admin` 重試同一請求。這讓現有具管理員能力的已配對裝置可復原新的
控制介面/瀏覽器配對，而不需手動編輯 `devices/paired.json`。閘道
仍會驗證重試的連線；無法使用
`operator.admin` 驗證的 token 仍會被封鎖。

如果同一裝置以不同 auth 詳細資料重試（例如不同的
角色/scopes/public key），前一個待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對裝置不會在無通知下取得更廣的存取權。如果它重新連線並要求更多 scopes 或更廣的角色，OpenClaw 會保持現有核准不變，並建立一個新的待處理升級請求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新請求的存取權。
</Note>

### 選用的受信任 CIDR 節點自動核准

裝置配對預設仍為手動。對於嚴格控管的節點網路，
你可以選擇使用明確 CIDR 或精確 IP，啟用首次節點自動核准：

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

這只適用於沒有要求
scopes 的全新 `role: node` 配對請求。Operator、瀏覽器、控制介面與 WebChat 用戶端仍需要手動
核准。角色、scope、metadata 與 public-key 變更仍需要手動
核准。

### 節點配對狀態儲存

儲存在 `~/.openclaw/devices/` 下：

- `pending.json`（短期；待處理請求 5 分鐘後過期）
- `paired.json`（已配對裝置 + tokens）

### 備註

- 傳統 `node.pair.*` API（命令列介面：`openclaw nodes pending|approve|reject|remove|rename`）是
  獨立的閘道所擁有配對儲存區。WS 節點仍需要裝置配對。
- 配對記錄是已核准角色的持久真實來源。作用中的
  裝置 token 仍受限於該已核准角色集合；已核准角色外的零散 token 項目
  不會建立新的存取權。

## 相關文件

- 安全性模型 + prompt injection：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
