---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節點
    - 檢視 OpenClaw 的安全態勢
summary: 配對概覽：核准誰可以私訊你，以及哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-07-12T14:20:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32fcb7c9031afc1e18c9288c201b80aeee7ce8b44eb345492101949ec7c91358
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（允許誰與機器人交談）
2. **節點配對**（允許哪些裝置／節點加入閘道網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當頻道設定為 DM 政策 `pairing` 時，未知傳送者會收到一組短代碼，而其訊息在你核准之前**不會被處理**。

預設 DM 政策記載於：[安全性](/zh-TW/gateway/security)

只有在有效的 DM 允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證要求公開開放設定必須使用該萬用字元。如果現有
狀態包含 `open` 及具體的 `allowFrom` 項目，執行階段仍只允許
這些傳送者，而配對儲存區的核准不會擴大 `open` 存取範圍。

配對代碼：

- 8 個字元、全大寫，且不含容易混淆的字元（`0O1I`）。
- **1 小時後到期**。只有在建立新請求時，機器人才會傳送配對訊息（每位傳送者約每小時一次）。
- 待處理的 DM 配對請求上限為**每個頻道帳號 3 個**；在其中一個到期或獲得核准前，其他請求會被忽略。

### 核准傳送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

在核准命令中加入 `--notify`，即可透過同一頻道通知請求者。多帳號頻道需使用 `--account <id>`。

如果尚未設定命令擁有者，核准 DM 配對代碼時也會將
`commands.ownerAllowFrom` 初始化為獲准的傳送者，例如 `telegram:123456789`。
這會讓首次設定具備一位明確的擁有者，以使用具特殊權限的命令和執行
核准提示。擁有者建立後，後續的配對核准只會授予 DM
存取權；不會新增更多擁有者。

支援的頻道（任何宣告配對功能的已安裝頻道外掛；`openclaw-weixin` 等外部外掛可新增更多頻道）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的傳送者群組

當同一組受信任的傳送者應套用至
多個訊息頻道，或同時套用至 DM 與群組允許清單時，請使用頂層 `accessGroups`。

靜態群組使用 `type: "message.senders"`，並透過頻道允許清單中的
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

存取群組的詳細說明請見：[存取群組](/zh-TW/channels/access-groups)

### 狀態儲存位置

儲存於 `~/.openclaw/credentials/`：

- 待處理請求：`<channel>-pairing.json`
- 已核准的允許清單儲存區：`<channel>-<accountId>-allowFrom.json`（預設
  帳號的核准項目使用 `<channel>-default-allowFrom.json`）

帳號範圍行為：

- 非預設帳號只會讀寫其範圍專屬的允許清單檔案。
- 預設帳號也會繼續採用舊版安裝中的無範圍舊格式 `<channel>-allowFrom.json`
  檔案；讀取時會合併兩個檔案的項目。

請將這些檔案視為敏感資料（它們會管控對你助理的存取權）。

<Note>
配對允許清單儲存區用於 DM 存取。群組授權另行處理。
核准 DM 配對代碼不會自動允許該傳送者執行群組
命令，或在群組中控制機器人。首位擁有者的初始化是
`commands.ownerAllowFrom` 中另一項獨立的設定狀態，而群組聊天傳送仍會遵循
頻道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依頻道而定的
各群組或各主題覆寫設定）。
</Note>

## 2) 節點裝置配對（iOS／Android／macOS／無頭節點）

節點會以具有 `role: node` 的**裝置**身分連線至閘道。閘道
會建立必須獲得核准的裝置配對請求。

### 從 Control UI 配對（建議）

使用已連線且具有 `operator.admin` 存取權的 Control UI 工作階段：

1. 開啟 Control UI，然後選取 **Nodes**。
2. 在 **Devices** 頁面上，按一下 **Pair mobile device**。
3. 在手機上開啟 OpenClaw 應用程式 → **Settings** → **Gateway**。
4. 掃描 QR Code 或貼上設定代碼，然後連線。

當官方 OpenClaw iOS 與 Android 應用程式的
設定代碼中繼資料相符時，會自動獲得核准。如果 **Pending approval** 顯示請求（例如
非官方用戶端或中繼資料不相符），請先檢查其角色與
範圍，再予以核准。

當目前的 Control UI 工作階段沒有
管理員存取權時，此按鈕會停用。在這種情況下，請從閘道主機使用
下方的命令列介面核准流程。

### 透過 Telegram 配對

如果你使用 `device-pair` 外掛，可以完全透過 Telegram 進行首次裝置配對：

1. 在 Telegram 中傳訊息給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則指示訊息，以及另一則獨立的**設定代碼**訊息（方便在 Telegram 中複製／貼上）。
3. 在手機上開啟 OpenClaw iOS 應用程式 → Settings → Gateway。
4. 掃描 QR Code（`/pair qr`）或貼上設定代碼並連線。
5. 官方行動應用程式會自動連線。如果 `/pair pending` 顯示
   請求，請先檢查其角色與範圍，再予以核准。

設定代碼是 Base64 編碼的 JSON 承載資料，其中包含：

- `url`：閘道 WebSocket URL（`ws://...` 或 `wss://...`）
- `urls`：若可用，行動應用程式可依序嘗試的 LAN／Tailnet 路由
- `bootstrapToken`：初始配對交握所用的一次性啟動權杖；閘道會在 10 分鐘後使其到期

配對完成後執行 `/pair cleanup`，使未使用的設定代碼失效。

該啟動權杖帶有內建的配對啟動設定檔：

- 內建設定檔只允許新的 QR Code／設定代碼基準：
  `node` 加上受限的 `operator` 移交
- 移交的 `node` 權杖會維持 `scopes: []`
- 移交的 `operator` 權杖僅限於 `operator.approvals`、
  `operator.read`、`operator.talk.secrets` 和 `operator.write`
- QR Code／設定代碼啟動不會授予 `operator.admin`；它需要
  另行核准的操作員配對或權杖流程
- 後續權杖輪替／撤銷仍同時受裝置已核准的
  角色合約與呼叫端工作階段的操作員範圍限制

設定代碼有效期間，請像密碼一樣保護它。

針對 Tailscale、公開或其他遠端行動裝置配對，請使用 Tailscale Serve／Funnel
或其他 `wss://` 閘道 URL。純文字 `ws://` 設定代碼僅接受
回送位址、私人 LAN 位址、`.local` Bonjour 主機與 Android
模擬器主機。Tailnet CGNAT 位址、`.ts.net` 名稱與公開主機仍會
在發出 QR Code／設定代碼前採取封閉式失敗。

對於 `gateway.bind=lan` 設定 URL，OpenClaw 會偵測將作用中閘道
回送連接埠作為 Proxy 的持續性 Tailscale Serve HTTPS 根位址，並將其與
LAN 路由一併公告。設定命令只會為 `lan`
加入此備援；`custom` 與 `tailnet` 會保留其明確公告的路由。
iOS 應用程式會依序探測公告的路由，並儲存第一個可連線的
端點。

### 核准節點裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果明確核准遭拒，原因是執行核准的已配對裝置工作階段
是以僅限配對的範圍開啟，命令列介面會使用
`operator.admin` 重試同一請求。這可讓現有具管理員能力的已配對裝置復原新的
Control UI／瀏覽器配對，而不必手動編輯配對儲存區。
閘道仍會驗證重試的連線；無法使用
`operator.admin` 驗證身分的權杖仍會遭到封鎖。

如果同一裝置以不同的驗證詳細資料重試（例如不同的
角色／範圍／公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會在未告知的情況下取得更廣泛的存取權。如果重新連線時要求更多範圍或更廣泛的角色，OpenClaw 會保持現有核准不變，並建立新的待處理升級請求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新要求的存取權。
</Note>

### 選用的受信任 CIDR 節點自動核准

裝置配對預設仍需手動進行。對於受到嚴格控制的節點網路，
你可以使用明確的 CIDR 或確切 IP，選擇啟用首次節點自動核准：

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

這只適用於未要求任何
範圍的新 `role: node` 配對請求。操作員、瀏覽器、Control UI 與 WebChat 用戶端仍需手動
核准。角色、範圍、中繼資料與公開金鑰變更仍需手動
核准。

### 節點配對狀態儲存

儲存於 `~/.openclaw/state/openclaw.sqlite` 的共用 SQLite 狀態資料庫：

- 待處理的裝置配對請求（短期存在；5 分鐘後到期）
- 已配對裝置與權杖

舊版閘道將此狀態保存在 `~/.openclaw/devices/*.json`；這些檔案會在
閘道啟動時匯入 SQLite，並以 `.migrated` 後綴封存。

### 注意事項

- `node.pair.*` API（命令列介面：`openclaw nodes pending|approve|reject|remove|rename`）管理
  儲存在同一已配對裝置記錄中的節點能力核准。WS 節點
  仍需裝置配對；請參閱[節點配對](/zh-TW/gateway/pairing)。
- 配對記錄是已核准角色的持久真實來源。作用中的
  裝置權杖仍受限於該組已核准角色；已核准角色以外的
  零散權杖項目不會建立新的存取權。

## 相關文件

- 安全性模型與提示詞注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
