---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節點
    - 檢視 OpenClaw 安全態勢
summary: 配對概覽：核准誰可以私訊你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-06-27T18:57:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰可以與機器人交談）
2. **節點配對**（哪些裝置/節點可以加入閘道網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當頻道設定為 DM 政策 `pairing` 時，未知傳送者會收到一組短代碼，且在你核准前，他們的訊息**不會被處理**。

預設 DM 政策記錄於：[安全性](/zh-TW/gateway/security)

只有在有效的 DM 允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證會要求公開開放設定使用該萬用字元。如果現有
狀態包含 `open` 搭配具體的 `allowFrom` 項目，執行階段仍只允許
那些傳送者，且配對儲存區的核准不會擴大 `open` 存取權。

配對代碼：

- 8 個字元、大寫、沒有易混淆字元（`0O1I`）。
- **1 小時後過期**。機器人只會在建立新請求時傳送配對訊息（大約每位傳送者每小時一次）。
- 待處理的 DM 配對請求預設上限為**每個頻道 3 個**；額外請求會被忽略，直到其中一個過期或被核准。

### 核准傳送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未設定命令擁有者，核准 DM 配對代碼也會將
`commands.ownerAllowFrom` 初始化為已核准的傳送者，例如 `telegram:123456789`。
這會讓首次設定取得一個明確的擁有者，用於特權命令與 exec
核准提示。擁有者存在後，後續配對核准只會授予 DM
存取權；它們不會新增更多擁有者。

支援的頻道：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的傳送者群組

當同一組受信任傳送者應套用到多個訊息頻道，或同時套用到 DM 與群組允許清單時，請使用頂層 `accessGroups`。

靜態群組使用 `type: "message.senders"`，並在頻道允許清單中以
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

儲存在 `~/.openclaw/credentials/` 下：

- 待處理請求：`<channel>-pairing.json`
- 已核准允許清單儲存區：
  - 預設帳號：`<channel>-allowFrom.json`
  - 非預設帳號：`<channel>-<accountId>-allowFrom.json`

帳號範圍行為：

- 非預設帳號只會讀寫其範圍內的允許清單檔案。
- 預設帳號使用頻道範圍的未限定允許清單檔案。

請將這些視為敏感資料（它們會管控對你助理的存取）。

<Note>
配對允許清單儲存區用於 DM 存取。群組授權是分開的。
核准 DM 配對代碼不會自動允許該傳送者在群組中執行
命令或控制機器人。第一位擁有者初始化是 `commands.ownerAllowFrom` 中的獨立設定
狀態，而群組聊天傳送仍遵循該頻道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依頻道而定的個別群組
或個別主題覆寫）。
</Note>

## 2) 節點裝置配對（iOS/Android/macOS/無介面節點）

節點會以 `role: node` 的**裝置**身分連線到閘道。閘道
會建立必須核准的裝置配對請求。

### 透過 Telegram 配對（建議用於 iOS）

如果你使用 `device-pair` 外掛，可以完全從 Telegram 完成首次裝置配對：

1. 在 Telegram 中傳訊給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則操作說明訊息，以及一則獨立的**設定代碼**訊息（方便在 Telegram 中複製/貼上）。
3. 在手機上開啟 OpenClaw iOS app → Settings → Gateway。
4. 掃描 QR code 或貼上設定代碼並連線。
5. 回到 Telegram：`/pair pending`（檢視請求 ID、角色與範圍），然後核准。

設定代碼是 base64 編碼的 JSON 承載，其中包含：

- `url`：閘道 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用於初始配對交握的短效單一裝置初始化權杖

該初始化權杖帶有內建的配對初始化設定檔：

- 內建設定檔只允許全新的 QR/設定代碼基準：
  `node` 加上受限的 `operator` 交接
- 交接後的 `node` 權杖維持 `scopes: []`
- 交接後的 `operator` 權杖僅限於 `operator.approvals`、
  `operator.read` 與 `operator.write`
- QR/設定代碼初始化不會授予 `operator.admin` 與 `operator.pairing`；
  它們需要獨立核准的操作員配對或權杖流程
- 後續權杖輪替/撤銷仍同時受限於裝置已核准的
  角色合約，以及呼叫者工作階段的操作員範圍

在設定代碼有效期間，請將它視為密碼。

對於 Tailscale、公開或其他遠端行動裝置配對，請使用 Tailscale Serve/Funnel
或其他 `wss://` 閘道 URL。明文 `ws://` 設定代碼只接受
local loopback、私人 LAN 位址、`.local` Bonjour 主機，以及 Android
模擬器主機。Tailnet CGNAT 位址、`.ts.net` 名稱與公開主機仍會
在發行 QR/設定代碼前封閉失敗。

### 核准節點裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准被拒絕，原因是進行核准的已配對裝置工作階段
是以僅限配對的範圍開啟時，命令列介面會使用
`operator.admin` 重試同一個請求。這讓現有具備管理員能力的已配對裝置可以恢復新的
Control UI/瀏覽器配對，而不必手動編輯 `devices/paired.json`。
閘道仍會驗證重試的連線；無法以 `operator.admin`
驗證的權杖仍會被封鎖。

如果同一裝置以不同驗證細節重試（例如不同的
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會在未告知的情況下取得更廣泛的存取權。如果它重新連線並要求更多範圍或更廣泛的角色，OpenClaw 會保留現有核准不變，並建立新的待處理升級請求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新請求的存取權。
</Note>

### 選用的受信任 CIDR 節點自動核准

裝置配對預設仍需手動處理。對於嚴格控管的節點網路，
你可以選擇使用明確 CIDR 或精確 IP，對首次節點進行自動核准：

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
範圍的全新 `role: node` 配對請求。操作員、瀏覽器、Control UI 與 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需要手動
核准。

### 節點配對狀態儲存

儲存在 `~/.openclaw/devices/` 下：

- `pending.json`（短效；待處理請求會過期）
- `paired.json`（已配對裝置 + 權杖）

### 注意事項

- 舊版 `node.pair.*` API（命令列介面：`openclaw nodes pending|approve|reject|remove|rename`）是
  獨立的閘道所屬配對儲存區。WS 節點仍需要裝置配對。
- 配對記錄是已核准角色的持久事實來源。作用中
  裝置權杖仍受限於該已核准角色集合；已核准角色之外的零散權杖項目
  不會建立新的存取權。

## 相關文件

- 安全性模型 + 提示注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
