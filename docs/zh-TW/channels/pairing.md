---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節點
    - 審查 OpenClaw 的安全態勢
summary: 配對概覽：核准誰可以傳送私人訊息給你，以及哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-07-22T13:19:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc874d660509f59bc26795c8b3ce13f5d238cd61154c717637f5d545b995fb08
    source_path: channels/pairing.md
    workflow: 16
---

“配對”是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **私訊配對**（允許誰與機器人交談）
2. **節點配對**（允許哪些裝置／節點加入閘道網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) 私訊配對（傳入聊天存取）

當頻道設定為私訊政策 `pairing` 時，未知傳送者會收到一組短代碼，而且在你核准前，其訊息**不會被處理**。

預設私訊政策記載於：[安全性](/zh-TW/gateway/security)

僅當有效的私訊允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
公開開放的設定必須使用此萬用字元，才能完成設定與驗證。如果現有
狀態中的 `open` 包含具體的 `allowFrom` 項目，執行階段仍只允許
這些傳送者，而配對儲存區的核准不會擴大 `open` 存取權。

配對碼：

- 8 個字元、大寫，不含容易混淆的字元（`0O1I`）。
- **1 小時後到期**。機器人只會在建立新要求時傳送配對訊息（每位傳送者大約每小時一次）。
- 待處理的私訊配對要求上限為**每個頻道帳號 3 個**；在其中一個到期或獲得核准之前，其他要求會被忽略。

### 從控制介面核准

開啟 **Settings → Channels → DM access requests**。佇列會彙整所有已設定頻道帳號中，私訊政策為 `pairing` 的待處理
要求。
依頻道或帳號篩選，檢查傳送者 ID 與中繼資料，然後選擇
**Approve**。

核准只會授予私訊存取權，不會授予群組存取權。在支援的情況下，
核准對話框也會提供下列明確選項：

- **核准後通知要求者**
- **同時將此傳送者設為第一位命令擁有者**，僅在尚無命令
  擁有者且控制介面工作階段具有 `operator.admin` 時顯示

選擇 **Dismiss** 可移除待處理要求而不核准。略過並非
永久封鎖；傳送者之後仍可再次要求存取權。

### 從命令列介面核准

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

加入 `--notify`，即可透過相同頻道通知要求者。多帳號頻道
需使用 `--account <id>`。

不同於控制介面的明確核取方塊，當尚未設定命令擁有者時，命令列介面會自動啟動
`commands.ownerAllowFrom`，使用如 `telegram:123456789` 的項目。這會為
首次設定提供明確的擁有者，以處理特權命令與執行核准提示。擁有者建立後，後續
配對核准只會授予私訊存取權，不會再新增擁有者。

<Note>
WhatsApp 的登入 QR 碼會將 WhatsApp 帳號連結至 OpenClaw。私訊存取要求
則核准向該帳號傳送訊息的人。這是兩個不同的流程。
</Note>

支援的頻道（任何宣告配對功能的已安裝頻道外掛；`openclaw-weixin` 等外部外掛可新增更多頻道）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的傳送者群組

若要將同一組受信任的傳送者套用至
多個訊息頻道，或同時套用至私訊與群組允許清單，請使用頂層 `accessGroups`。

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

存取群組的詳細說明請參閱：[存取群組](/zh-TW/channels/access-groups)

### 狀態儲存位置

儲存在 `~/.openclaw/state/openclaw.sqlite` 的共用 SQLite 狀態資料庫中：

- `channel_pairing_requests` 中的待處理要求
- `channel_pairing_allow_entries` 中已核准的傳送者

帳號範圍行為：

- 每個要求與已核准傳送者都以頻道和帳號為索引鍵
- 執行階段只讀取標準 SQLite 資料列；不會合併舊版檔案

較舊的閘道會將 `<channel>-pairing.json` 和
`<channel>-<accountId>-allowFrom.json` 寫入 `~/.openclaw/credentials/` 下。
啟動移轉和 `openclaw doctor --fix` 會將這些檔案匯入 SQLite，並在成功匯入後
移除各來源檔案。由於這些資料列會控管助理的存取權，
請將 SQLite 資料庫視為敏感資料。

<Note>
配對允許清單儲存區用於私訊存取。群組授權是另一套機制。
核准私訊配對碼不會自動允許該傳送者執行群組
命令或在群組中控制機器人。首位擁有者啟動是
`commands.ownerAllowFrom` 中的獨立設定狀態，而群組聊天傳送仍遵循
頻道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依頻道而定的個別群組
或個別主題覆寫）。
</Note>

## 2) 節點裝置配對（iOS／Android／macOS／無頭節點）

節點會以具有 `role: node` 的**裝置**身分連線至閘道。閘道
會建立必須經過核准的裝置配對要求。

### 從控制介面配對（建議）

使用已連線且具有 `operator.admin` 存取權的控制介面工作階段：

1. 開啟控制介面並前往 **Settings → Devices**。
2. 在 **Devices** 頁面上，按一下 **Pair mobile device**。
3. 保留 **Full access (recommended)**，或選取 **Limited access** 以排除
   閘道管理控制功能。
4. 按一下 **Create setup code**。
5. 在手機上開啟 OpenClaw 應用程式 → **Settings** → **Gateway**。
6. 掃描 QR 碼或貼上設定碼，然後連線。

當官方 OpenClaw iOS 與 Android 應用程式的
設定碼中繼資料相符時，系統會自動核准。如果 **Pending approval** 顯示要求（例如
非官方用戶端或中繼資料不符），請先檢查其角色和
範圍，再予以核准。

如果目前的控制介面工作階段沒有
管理員存取權，按鈕會停用。在此情況下，請從閘道主機使用下方的命令列介面核准流程。

### 透過 Telegram 配對

若你使用 `device-pair` 外掛，可以完全透過 Telegram 完成首次裝置配對：

1. 在 Telegram 中向你的機器人傳送訊息：`/pair`
2. 機器人會回覆兩則訊息：一則指示訊息和一則獨立的**設定碼**訊息（方便在 Telegram 中複製／貼上）。
3. 在手機上開啟 OpenClaw iOS 應用程式 → 設定 → 閘道。
4. 掃描 QR 碼（`/pair qr`）或貼上設定碼並連線。
5. 官方行動應用程式會自動連線。如果 `/pair pending` 顯示
   要求，請先檢查其角色和範圍，再予以核准。

設定碼是使用 base64 編碼的 JSON 承載資料，其中包含：

- `url`：閘道 WebSocket URL（`ws://...` 或 `wss://...`）
- `urls`：如可用，行動應用程式可依序嘗試的區域網路／Tailnet 路由
- `bootstrapToken`：用於初始配對交握的一次性啟動權杖；閘道會在 10 分鐘後使其失效

配對完成後執行 `/pair cleanup`，使未使用的設定碼失效。

該啟動權杖帶有內建的配對啟動設定檔：

- 安全的 `wss://` 設定（或同一主機的迴路）預設使用 `node`，並具有完整的
  原生行動裝置 `operator` 存取權
- 轉交的 `node` 權杖會維持 `scopes: []`
- 預設轉交的 `operator` 權杖包含 `operator.admin`、
  `operator.approvals`、`operator.read`、`operator.talk.secrets` 和
  `operator.write`
- 控制介面的 **Limited access** 和 `openclaw qr --limited` 會省略
  `operator.admin`，但保留其他操作者範圍
- 純文字區域網路 `ws://` 設定會自動使用相同的受限設定檔；
  請設定 `wss://` 或 Tailscale Serve，並產生新代碼以取得完整存取權
- 後續權杖輪替／撤銷仍同時受限於裝置已核准的
  角色合約和呼叫者工作階段的操作者範圍

設定碼有效時，請將其視同密碼。

iOS 與 Android 的 **Settings → Gateway** 頁面會顯示 **Full** 或 **Limited**
存取權。若要升級受限的手機，請先設定安全的 `wss://` 或
Tailscale Serve 路由，然後產生新的完整存取設定碼，在該設定頁面掃描或貼上
此代碼並重新連線。

對於 Tailscale、公開或其他遠端行動裝置配對，請使用 Tailscale Serve/Funnel
或其他 `wss://` 閘道 URL。純文字 `ws://` 設定碼僅接受
迴路、私人區域網路位址、`.local` Bonjour 主機和 Android
模擬器主機。非迴路純文字路由只會獲得受限存取權。Tailnet
CGNAT 位址、`.ts.net` 名稱和公用主機仍會在
發出 QR 碼／設定碼之前採取失敗關閉。

對於 `gateway.bind=lan` 設定 URL，OpenClaw 會偵測將現用閘道迴路連接埠
設為代理目標的持續性 Tailscale Serve HTTPS 根目錄，並將其與區域網路路由
一併公告。設定命令只會為 `lan` 新增此後援；
`custom` 和 `tailnet` 會保留其明確公告的路由。iOS
應用程式會依序探測公告的路由，並儲存第一個可連線的
端點。

### 核准節點裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

如果明確核准因執行核准的已配對裝置工作階段是以僅限配對的範圍開啟而遭拒，
命令列介面會使用 `operator.admin` 重試同一要求。這可讓具管理員能力的現有已配對裝置
復原新的控制介面／瀏覽器配對，而無需手動編輯配對儲存區。
閘道仍會驗證重試的連線；無法使用 `operator.admin` 完成驗證的權杖
仍會遭到封鎖。

如果同一裝置使用不同的驗證詳細資料重試（例如不同的
角色／範圍／公開金鑰），先前的待處理要求會被取代，並建立新的
`requestId`。

<Note>
已配對裝置不會在未告知的情況下獲得更廣泛的存取權。如果重新連線時要求更多範圍或更廣泛的角色，OpenClaw 會維持現有核准不變，並建立新的待處理升級要求。在核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新要求的存取權。
</Note>

### 選用的受信任 CIDR 節點自動核准

裝置配對預設仍需手動進行。對於嚴格控管的節點網路，
你可以透過明確的 CIDR 或確切 IP，選擇啟用首次節點自動核准：

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

這僅適用於未要求任何範圍的新 `role: node` 配對要求。
操作者、瀏覽器、控制介面和 WebChat 用戶端仍需手動
核准。角色、範圍、中繼資料和公開金鑰的變更仍需手動
核准。

### 節點配對狀態儲存

儲存在 `~/.openclaw/state/openclaw.sqlite` 的共用 SQLite 狀態資料庫中：

- 待處理的裝置配對要求（短期有效；5 分鐘後到期）
- 已配對裝置與權杖

舊版閘道將此狀態保存在 `~/.openclaw/devices/*.json`；這些檔案會在
閘道啟動時匯入 SQLite，並以 `.migrated` 後綴封存。

### 注意事項

- `node.pair.*` API（命令列介面：`openclaw nodes pending|approve|reject|remove|rename`）管理
  儲存在相同已配對裝置記錄中的節點功能核准。WS 節點
  仍需要裝置配對；請參閱[節點配對](/zh-TW/gateway/pairing)。
- 配對記錄是已核准角色的持久真實資料來源。有效的
  裝置權杖仍受限於該組已核准角色；已核准角色以外的零散權杖項目
  不會建立新的存取權限。

## 相關文件

- 安全模型與提示詞注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 頻道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
