---
read_when:
    - 設定 DM 存取控制
    - 配對新的 iOS/Android 節點
    - 審查 OpenClaw 安全態勢
summary: 配對總覽：核准誰可以私訊你，以及哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-07-04T17:47:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **私訊配對**（誰可以與 bot 對話）
2. **節點配對**（哪些裝置/節點可以加入閘道網路）

安全性脈絡：[安全性](/zh-TW/gateway/security)

## 1) 私訊配對（傳入聊天存取）

當頻道設定為私訊政策 `pairing` 時，未知寄件者會取得一組短代碼，且其訊息在你核准前**不會被處理**。

預設私訊政策記錄於：[安全性](/zh-TW/gateway/security)

只有在有效的私訊允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證會要求公開開放設定具備該萬用字元。如果既有
狀態包含 `open` 並搭配具體的 `allowFrom` 項目，執行階段仍只允許
那些寄件者，而配對儲存區的核准不會擴大 `open` 存取。

配對代碼：

- 8 個字元、大寫、沒有易混淆字元（`0O1I`）。
- **1 小時後到期**。bot 只會在建立新請求時傳送配對訊息（每位寄件者大約每小時一次）。
- 待處理的私訊配對請求預設每個頻道上限為 **3 個**；額外請求會被忽略，直到其中一個到期或獲得核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未設定任何命令擁有者，核准私訊配對代碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會讓首次設定取得一個明確的擁有者，用於特權命令與 exec
核准提示。擁有者存在後，後續的配對核准只會授予私訊
存取權；不會新增更多擁有者。

支援的頻道：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的寄件者群組

當相同的受信任寄件者集合應套用到多個訊息頻道，或同時套用到
私訊與群組允許清單時，請使用頂層 `accessGroups`。

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

存取群組的詳細文件在這裡：[存取群組](/zh-TW/channels/access-groups)

### 狀態儲存位置

儲存在 `~/.openclaw/credentials/` 底下：

- 待處理請求：`<channel>-pairing.json`
- 已核准的允許清單儲存區：
  - 預設帳號：`<channel>-allowFrom.json`
  - 非預設帳號：`<channel>-<accountId>-allowFrom.json`

帳號範圍行為：

- 非預設帳號只會讀取/寫入其範圍限定的允許清單檔案。
- 預設帳號使用頻道範圍、未另設範圍的允許清單檔案。

請將這些視為敏感資料（它們會控管對你助理的存取）。

<Note>
配對允許清單儲存區用於私訊存取。群組授權是分開的。
核准私訊配對代碼不會自動允許該寄件者執行群組
命令或在群組中控制 bot。第一位擁有者啟動設定是
`commands.ownerAllowFrom` 中獨立的設定狀態，而群組聊天傳遞仍會遵循
該頻道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依頻道而定的每群組
或每主題覆寫）。
</Note>

## 2) 節點裝置配對（iOS/Android/macOS/無頭節點）

節點會以 `role: node` 的**裝置**身分連線到閘道。閘道
會建立一個必須核准的裝置配對請求。

### 從控制介面配對（建議）

使用已連線且具備 `operator.admin` 存取權的控制介面工作階段：

1. 開啟控制介面並選取 **節點**。
2. 在 **裝置** 中，按一下 **配對行動裝置**。
3. 在手機上開啟 OpenClaw app → **設定** → **閘道**。
4. 掃描 QR code 或貼上設定代碼，然後連線。

官方 OpenClaw iOS 與 Android app 會在其
設定代碼中繼資料相符時自動獲准。如果 **裝置** 顯示待處理請求（例如
非官方用戶端或中繼資料不相符），請在核准前檢查其角色與
範圍。

當目前的控制介面工作階段沒有
管理員存取權時，按鈕會停用。在這種情況下，請從閘道主機使用下方的命令列介面核准流程。

### 透過 Telegram 配對

如果你使用 `device-pair` 外掛，可以完全從 Telegram 進行首次裝置配對：

1. 在 Telegram 中傳訊息給你的 bot：`/pair`
2. bot 會回覆兩則訊息：一則指示訊息，以及一則獨立的**設定代碼**訊息（方便在 Telegram 中複製/貼上）。
3. 在手機上開啟 OpenClaw iOS app → 設定 → 閘道。
4. 掃描 QR code 或貼上設定代碼並連線。
5. 官方行動 app 會自動連線。如果 `/pair pending` 顯示
   請求，請在核准前檢查其角色與範圍。

設定代碼是一段 base64 編碼的 JSON payload，內容包含：

- `url`：閘道 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：短效、單一裝置的啟動權杖，用於初始配對握手

該啟動權杖帶有內建的配對啟動設定檔：

- 內建設定檔只允許全新的 QR/設定代碼基準：
  `node` 加上有界限的 `operator` 交接
- 交接後的 `node` 權杖維持 `scopes: []`
- 交接後的 `operator` 權杖限制為 `operator.approvals`、
  `operator.read`、`operator.talk.secrets` 與 `operator.write`
- `operator.admin` 不會由 QR/設定代碼啟動授予；它需要
  另一個已核准的 operator 配對或權杖流程
- 後續權杖輪替/撤銷仍會同時受限於該裝置已核准的
  角色合約與呼叫者工作階段的 operator 範圍

設定代碼有效期間，請像密碼一樣對待它。

若要進行 Tailscale、公開或其他遠端行動裝置配對，請使用 Tailscale Serve/Funnel
或另一個 `wss://` 閘道 URL。明文 `ws://` 設定代碼只接受
loopback、私有 LAN 位址、`.local` Bonjour 主機，以及 Android
模擬器主機。Tailnet CGNAT 位址、`.ts.net` 名稱與公開主機仍會在
發出 QR/設定代碼前保持關閉並失敗。

### 核准節點裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准因為執行核准的已配對裝置工作階段
是以僅配對範圍開啟而遭拒時，命令列介面會以
`operator.admin` 重試相同請求。這可讓具備管理員能力的既有已配對裝置復原新的
控制介面/瀏覽器配對，而不必手動編輯 `devices/paired.json`。
閘道仍會驗證重試的連線；無法以
`operator.admin` 驗證的權杖仍會被封鎖。

如果相同裝置以不同驗證詳細資料重試（例如不同的
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會默默取得更廣的存取權。如果它重新連線時要求更多範圍或更廣的角色，OpenClaw 會維持既有核准不變，並建立新的待處理升級請求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新請求的存取權。
</Note>

### 可選的受信任 CIDR 節點自動核准

裝置配對預設仍是手動。對於嚴格控管的節點網路，
你可以明確使用 CIDR 或精確 IP，選擇啟用首次節點自動核准：

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
範圍的全新 `role: node` 配對請求。Operator、瀏覽器、控制介面與 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需要手動
核准。

### 節點配對狀態儲存

儲存在 `~/.openclaw/devices/` 底下：

- `pending.json`（短效；待處理請求會到期）
- `paired.json`（已配對裝置 + 權杖）

### 注意事項

- 舊版 `node.pair.*` API（命令列介面：`openclaw nodes pending|approve|reject|remove|rename`）是
  另一個由閘道擁有的配對儲存區。WS 節點仍需要裝置配對。
- 配對記錄是已核准角色的持久真實來源。作用中
  裝置權杖仍受限於該已核准角色集合；已核准角色外的零散權杖項目
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
