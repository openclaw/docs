---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節點
    - 檢視 OpenClaw 的安全態勢
summary: 配對概覽：核准哪些人可以傳送私訊給你，以及哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-07-14T13:28:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

“配對”是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **私訊配對**（允許誰與機器人交談）
2. **節點配對**（允許哪些裝置／節點加入閘道網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) 私訊配對（傳入聊天存取）

當頻道設定了私訊政策 `pairing` 時，未知傳送者會收到一組短代碼，而在你核准前，其訊息**不會被處理**。

預設私訊政策記載於：[安全性](/zh-TW/gateway/security)

只有在生效的私訊允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
公開開放的設定必須包含該萬用字元，才能完成設定與驗證。如果現有
狀態包含具有具體 `allowFrom` 項目的 `open`，執行階段仍然只允許
這些傳送者，而配對儲存區的核准不會擴大 `open` 存取權。

配對代碼：

- 8 個字元、全大寫，且不含容易混淆的字元（`0O1I`）。
- **1 小時後到期**。機器人只會在建立新要求時傳送配對訊息（每位傳送者約每小時一次）。
- 待處理的私訊配對要求上限為**每個頻道帳號 3 個**；在其中一個到期或獲得核准前，額外要求會被忽略。

### 核准傳送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

在核准命令中加入 `--notify`，即可透過同一頻道通知要求者。多帳號頻道接受 `--account <id>`。

如果尚未設定命令擁有者，核准私訊配對代碼時也會將
`commands.ownerAllowFrom` 初始化為已核准的傳送者，例如 `telegram:123456789`。
如此可讓初次設定明確指定一位擁有者，負責特權命令和 exec
核准提示。擁有者存在後，後續的配對核准只會授予私訊
存取權；不會新增更多擁有者。

支援的頻道（任何宣告配對功能的已安裝頻道外掛；`openclaw-weixin` 等外部外掛可加入更多頻道）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的傳送者群組

若同一組受信任傳送者應套用至
多個訊息頻道，或同時套用至私訊和群組允許清單，請使用頂層 `accessGroups`。

靜態群組使用 `type: "message.senders"`，並在頻道允許清單中透過
`accessGroup:<name>` 引用：

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

存取群組的詳細說明請參閱：[存取群組](/zh-TW/channels/access-groups)

### 狀態儲存位置

儲存在 `~/.openclaw/state/openclaw.sqlite` 的共用 SQLite 狀態資料庫中：

- `channel_pairing_requests` 中的待處理要求
- `channel_pairing_allow_entries` 中的已核准傳送者

帳號範圍行為：

- 每個要求和已核准傳送者都以頻道和帳號為索引鍵
- 執行階段只會讀取標準 SQLite 資料列；不會合併舊版檔案

較舊的閘道會將 `<channel>-pairing.json` 和
`<channel>-<accountId>-allowFrom.json` 寫入 `~/.openclaw/credentials/`。
啟動移轉和 `openclaw doctor --fix` 會將這些檔案匯入 SQLite，並在
成功匯入後移除各來源檔案。這些資料列會控管你的助理存取權，
因此請將 SQLite 資料庫視為敏感資料。

<Note>
配對允許清單儲存區用於私訊存取。群組授權另行處理。
核准私訊配對代碼不會自動允許該傳送者在群組中執行
命令或控制機器人。第一位擁有者的初始化是 `commands.ownerAllowFrom` 中的獨立設定
狀態，而群組聊天傳遞仍遵循頻道的群組允許清單
（例如 `groupAllowFrom`、`groups`，或依頻道而定的個別群組
或主題覆寫）。
</Note>

## 2) 節點裝置配對（iOS／Android／macOS／無頭節點）

節點會以具有 `role: node` 的**裝置**身分連線至閘道。閘道
會建立必須核准的裝置配對要求。

### 從控制介面配對（建議）

使用已有 `operator.admin` 存取權且已連線的控制介面工作階段：

1. 開啟控制介面，前往 **Settings → Devices**。
2. 在 **Devices** 頁面上，按一下 **Pair mobile device**。
3. 保留 **Full access (recommended)**，或選取 **Limited access** 以排除
   閘道管理控制功能。
4. 按一下 **Create setup code**。
5. 在手機上開啟 OpenClaw 應用程式 → **Settings** → **Gateway**。
6. 掃描 QR 圖碼或貼上設定代碼，然後連線。

官方 OpenClaw iOS 和 Android 應用程式的
設定代碼中繼資料相符時，會自動獲得核准。如果 **Pending approval** 顯示要求（例如
非官方用戶端或中繼資料不符），請先檢查其角色和
範圍，再予以核准。

目前的控制介面工作階段沒有
管理員存取權時，該按鈕會停用。在此情況下，請從閘道主機使用下方的命令列介面核准流程。

### 透過 Telegram 配對

如果使用 `device-pair` 外掛，可以完全透過 Telegram 完成初次裝置配對：

1. 在 Telegram 中傳訊給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則操作說明訊息，以及另一則獨立的**設定代碼**訊息（方便在 Telegram 中複製／貼上）。
3. 在手機上開啟 OpenClaw iOS 應用程式 → Settings → Gateway。
4. 掃描 QR 圖碼（`/pair qr`），或貼上設定代碼並連線。
5. 官方行動應用程式會自動連線。如果 `/pair pending` 顯示
   要求，請先檢查其角色和範圍，再予以核准。

設定代碼是採用 base64 編碼的 JSON 承載資料，其中包含：

- `url`：閘道 WebSocket URL（`ws://...` 或 `wss://...`）
- `urls`：可用時，行動應用程式可依序嘗試的 LAN／Tailnet 路由
- `bootstrapToken`：用於初始配對交握的單次使用啟動權杖；閘道會在 10 分鐘後使其到期

配對完成後，執行 `/pair cleanup` 以使未使用的設定代碼失效。

該啟動權杖帶有內建的配對啟動設定檔：

- 安全的 `wss://` 設定（或同一主機的迴路）預設為 `node`，並加上完整的
  原生行動版 `operator` 存取權
- 移交的 `node` 權杖會維持 `scopes: []`
- 預設移交的 `operator` 權杖包含 `operator.admin`、
  `operator.approvals`、`operator.read`、`operator.talk.secrets` 和
  `operator.write`
- 控制介面的 **Limited access** 和 `openclaw qr --limited` 會省略
  `operator.admin`，同時保留其他操作員範圍
- 純文字 LAN `ws://` 設定會自動使用相同的受限設定檔；
  請設定 `wss://` 或 Tailscale Serve，並產生新的代碼以取得完整存取權
- 後續權杖輪替／撤銷仍同時受限於裝置已核准的
  角色合約和呼叫端工作階段的操作員範圍

設定代碼有效期間，請將其視同密碼。

iOS 和 Android 的 **Settings → Gateway** 頁面會顯示 **Full** 或 **Limited**
存取權。若要升級受限的手機，請先設定安全的 `wss://` 或
Tailscale Serve 路由，接著產生新的完整存取設定代碼，在該設定頁面中掃描或貼上，
然後重新連線。

若要透過 Tailscale、公開網路或其他遠端方式配對行動裝置，請使用 Tailscale Serve／Funnel
或其他 `wss://` 閘道 URL。純文字 `ws://` 設定代碼僅接受
迴路、私人 LAN 位址、`.local` Bonjour 主機，以及 Android
模擬器主機。非迴路的純文字路由會獲得受限存取權。Tailnet
CGNAT 位址、`.ts.net` 名稱和公開主機仍會在
核發 QR 圖碼／設定代碼前採取封閉式失敗。

對於 `gateway.bind=lan` 設定 URL，OpenClaw 會偵測代理目前閘道迴路連接埠的
持續性 Tailscale Serve HTTPS 根 URL，並與 LAN 路由一起公告。設定命令只會
為 `lan` 加入此備援；`custom` 和 `tailnet` 會保留其明確公告的路由。
iOS 應用程式會依序探測公告的路由，並儲存第一個可連線的
端點。

### 核准節點裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果因執行核准的已配對裝置工作階段僅以配對範圍開啟，
導致明確核准遭拒，命令列介面會使用
`operator.admin` 重試同一要求。如此可讓現有具管理員能力的已配對裝置復原新的
控制介面／瀏覽器配對，而不必手動編輯配對儲存區。閘道
仍會驗證重試的連線；無法使用 `operator.admin` 完成驗證的
權杖仍會遭到封鎖。

如果同一裝置使用不同的驗證詳細資料重試（例如不同的
角色／範圍／公開金鑰），先前的待處理要求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會在未告知的情況下取得更廣泛的存取權。如果它重新連線並要求更多範圍或更廣泛的角色，OpenClaw 會原樣保留現有核准，並建立新的待處理升級要求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新要求的存取權。
</Note>

### 選用的受信任 CIDR 節點自動核准

裝置配對預設仍須手動進行。對於嚴格管控的節點網路，
可以使用明確的 CIDR 或確切 IP，選擇啟用初次節點自動核准：

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

這只適用於未要求
範圍的全新 `role: node` 配對要求。操作員、瀏覽器、控制介面和 WebChat 用戶端仍須手動
核准。角色、範圍、中繼資料和公開金鑰變更仍須手動
核准。

### 節點配對狀態儲存

儲存在 `~/.openclaw/state/openclaw.sqlite` 的共用 SQLite 狀態資料庫中：

- 待處理的裝置配對要求（存續時間很短；5 分鐘後到期）
- 已配對裝置和權杖

較舊的閘道會將此狀態保存在 `~/.openclaw/devices/*.json`；這些檔案會在
閘道啟動時匯入 SQLite，並以 `.migrated` 後綴封存。

### 注意事項

- `node.pair.*` API（命令列介面：`openclaw nodes pending|approve|reject|remove|rename`）會管理
  儲存在相同已配對裝置記錄上的節點能力核准。WS 節點
  仍須進行裝置配對；請參閱[節點配對](/zh-TW/gateway/pairing)。
- 配對記錄是已核准角色的持久事實來源。有效的
  裝置權杖仍受限於該已核准的角色集合；核准角色以外的
  零散權杖項目不會建立新的存取權。

## 相關文件

- 安全模型與提示注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
