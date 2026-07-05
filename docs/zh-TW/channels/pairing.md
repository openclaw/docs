---
read_when:
    - 設定私訊存取控制
    - 配對新的 iOS/Android 節點
    - 審查 OpenClaw 安全態勢
summary: 配對概覽：核准誰可以傳私訊給你 + 哪些節點可以加入
title: 配對
x-i18n:
    generated_at: "2026-07-05T17:39:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a3f76771d40606bf90ecaadef3f5b58f8cdbae9b2132ca5086c444371b61b87
    source_path: channels/pairing.md
    workflow: 16
---

「配對」是 OpenClaw 明確的存取核准步驟。
它用於兩個地方：

1. **DM 配對**（誰可以與機器人交談）
2. **節點配對**（哪些裝置/節點可以加入閘道網路）

安全性背景：[安全性](/zh-TW/gateway/security)

## 1) DM 配對（傳入聊天存取）

當通道設定為 DM 政策 `pairing` 時，未知寄件者會取得一組短代碼，而他們的訊息在你核准之前**不會被處理**。

預設 DM 政策記錄於：[安全性](/zh-TW/gateway/security)

只有在有效的 DM 允許清單包含 `"*"` 時，`dmPolicy: "open"` 才是公開的。
設定與驗證會要求公開開放設定使用該萬用字元。如果現有
狀態包含 `open` 且有具體的 `allowFrom` 項目，執行階段仍只會准許
那些寄件者，而配對儲存核准不會擴大 `open` 存取。

配對代碼：

- 8 個字元、大寫、沒有易混淆字元（`0O1I`）。
- **1 小時後過期**。機器人只會在建立新請求時傳送配對訊息（每位寄件者約每小時一次）。
- 待處理的 DM 配對請求上限為**每個通道帳號 3 個**；額外請求會被忽略，直到其中一個過期或獲得核准。

### 核准寄件者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

在核准命令加上 `--notify`，即可在同一通道通知請求者。多帳號通道使用 `--account <id>`。

如果尚未設定命令擁有者，核准 DM 配對代碼也會將
`commands.ownerAllowFrom` 啟動設定為已核准的寄件者，例如 `telegram:123456789`。
這會讓首次設定有一個明確的擁有者，用於特權命令與 exec
核准提示。擁有者存在後，後續配對核准只會授予 DM
存取；不會新增更多擁有者。

支援的通道（任何已安裝且宣告配對的通道外掛；外部外掛例如 `openclaw-weixin` 可以加入更多）：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`sms`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可重複使用的寄件者群組

當同一組受信任寄件者應套用到多個訊息通道，或同時套用到 DM 與群組允許清單時，請使用頂層 `accessGroups`。

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

存取群組的詳細文件在這裡：[存取群組](/zh-TW/channels/access-groups)

### 狀態所在位置

儲存在 `~/.openclaw/credentials/` 下：

- 待處理請求：`<channel>-pairing.json`
- 已核准允許清單儲存：`<channel>-<accountId>-allowFrom.json`（預設帳號的核准使用 `<channel>-default-allowFrom.json`）

帳號範圍行為：

- 非預設帳號只會讀寫其範圍限定的允許清單檔案。
- 預設帳號也會繼續遵循舊版安裝留下的傳統未限定範圍 `<channel>-allowFrom.json`
  檔案；讀取時會合併兩個檔案的項目。

請將這些視為敏感資料（它們會控管對你的助理的存取）。

<Note>
配對允許清單儲存用於 DM 存取。群組授權是分開的。
核准 DM 配對代碼不會自動允許該寄件者執行群組
命令或在群組中控制機器人。第一位擁有者啟動是 `commands.ownerAllowFrom` 中的獨立設定
狀態，而群組聊天傳送仍遵循
通道的群組允許清單（例如 `groupAllowFrom`、`groups`，或依通道而定的每群組
或每主題覆寫）。
</Note>

## 2) 節點裝置配對（iOS/Android/macOS/無頭節點）

節點會以 **裝置** 身分連線到閘道，並帶有 `role: node`。閘道
會建立必須核准的裝置配對請求。

### 從控制 UI 配對（建議）

使用已連線且具備 `operator.admin` 存取權的控制 UI 工作階段：

1. 開啟控制 UI 並選取**節點**。
2. 在**裝置**中，按一下**配對行動裝置**。
3. 在手機上開啟 OpenClaw app → **設定** → **閘道**。
4. 掃描 QR code 或貼上設定代碼，然後連線。

官方 OpenClaw iOS 與 Android app 在其
設定代碼中繼資料相符時會自動核准。如果**裝置**顯示待處理請求（例
如非官方用戶端或中繼資料不相符），請在核准前檢查其角色與
範圍。

當目前的控制 UI 工作階段沒有管理員存取權時，按鈕會停用。
在這種情況下，請從閘道主機使用下方的命令列介面核准流程。

### 透過 Telegram 配對

如果你使用 `device-pair` 外掛，就可以完全從 Telegram 進行首次裝置配對：

1. 在 Telegram 中傳訊息給你的機器人：`/pair`
2. 機器人會回覆兩則訊息：一則指示訊息，以及一則獨立的**設定代碼**訊息（在 Telegram 中容易複製/貼上）。
3. 在手機上開啟 OpenClaw iOS app → 設定 → 閘道。
4. 掃描 QR code（`/pair qr`）或貼上設定代碼並連線。
5. 官方行動 app 會自動連線。如果 `/pair pending` 顯示
   請求，請在核准前檢查其角色與範圍。

設定代碼是一個 base64 編碼的 JSON 承載，其中包含：

- `url`：閘道 WebSocket URL（`ws://...` 或 `wss://...`）
- `urls`：可用時，行動 app 可依序嘗試的 LAN/Tailnet 路由
- `bootstrapToken`：初始配對交握使用的一次性啟動權杖（10 分鐘後過期；承載中包含 `expiresAtMs`）

配對完成後執行 `/pair cleanup`，使未使用的設定代碼失效。

該啟動權杖帶有內建的配對啟動設定檔：

- 內建設定檔只允許新的 QR/設定代碼基準：
  `node` 加上受限的 `operator` 交接
- 交接後的 `node` 權杖維持 `scopes: []`
- 交接後的 `operator` 權杖限制為 `operator.approvals`、
  `operator.read`、`operator.talk.secrets` 和 `operator.write`
- QR/設定代碼啟動不會授予 `operator.admin`；它需要
  獨立核准的操作者配對或權杖流程
- 後續權杖輪替/撤銷仍同時受裝置已核准
  角色合約與呼叫端工作階段操作者範圍限制

設定代碼有效期間，請像密碼一樣保護它。

對於 Tailscale、公開或其他遠端行動配對，請使用 Tailscale Serve/Funnel
或另一個 `wss://` 閘道 URL。明文 `ws://` 設定代碼只接受
local loopback、私人 LAN 位址、`.local` Bonjour 主機，以及 Android
模擬器主機。Tailnet CGNAT 位址、`.ts.net` 名稱和公開主機仍會在
QR/設定代碼核發前失敗關閉。

對於 `gateway.bind=lan` 設定 URL，OpenClaw 會偵測持久的 Tailscale Serve
HTTPS 根端點，這些端點會代理作用中閘道的回送連接埠，並將它們與
LAN 路由一起公告。特定介面的 `custom` 與 `tailnet` 繫結不會
收到該後援，因為回送 Serve 代理無法連到那些
監聽器。iOS app 會依序探測公告的路由，並儲存第一個
可連線端點。

### 核准節點裝置

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

當明確核准因為核准用的已配對裝置工作階段
是以僅配對範圍開啟而遭拒時，命令列介面會以
`operator.admin` 重試同一請求。這讓現有具備管理員能力的已配對裝置可以復原新的
控制 UI/瀏覽器配對，而不必手動編輯 `devices/paired.json`。
閘道仍會驗證重試的連線；無法以 `operator.admin` 驗證的
權杖仍會被封鎖。

如果同一裝置以不同驗證細節重試（例如不同的
角色/範圍/公開金鑰），先前的待處理請求會被取代，並建立新的
`requestId`。

<Note>
已配對的裝置不會悄悄取得更大的存取權。如果它重新連線時要求更多範圍或更大的角色，OpenClaw 會讓現有核准維持原樣，並建立新的待處理升級請求。核准前，請使用 `openclaw devices list` 比較目前已核准的存取權與新請求的存取權。
</Note>

### 選用的受信任 CIDR 節點自動核准

裝置配對預設仍為手動。對於嚴格控管的節點網路，
你可以選擇使用明確 CIDR 或精確 IP 來自動核准首次節點：

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

這只適用於未請求範圍的全新 `role: node` 配對請求。
操作者、瀏覽器、控制 UI 和 WebChat 用戶端仍需要手動
核准。角色、範圍、中繼資料和公開金鑰變更仍需要手動
核准。

### 節點配對狀態儲存

儲存在 `~/.openclaw/devices/` 下：

- `pending.json`（短暫存在；待處理請求 5 分鐘後過期）
- `paired.json`（已配對裝置 + 權杖）

### 備註

- 傳統 `node.pair.*` API（命令列介面：`openclaw nodes pending|approve|reject|remove|rename`）是
  獨立的閘道擁有配對儲存。WS 節點仍需要裝置配對。
- 配對記錄是已核准角色的持久事實來源。作用中
  裝置權杖仍受限於該已核准角色集合；核准角色之外的零散權杖項目
  不會建立新的存取權。

## 相關文件

- 安全性模型 + 提示注入：[安全性](/zh-TW/gateway/security)
- 安全更新（執行 doctor）：[更新](/zh-TW/install/updating)
- 通道設定：
  - Telegram：[Telegram](/zh-TW/channels/telegram)
  - WhatsApp：[WhatsApp](/zh-TW/channels/whatsapp)
  - Signal：[Signal](/zh-TW/channels/signal)
  - iMessage：[iMessage](/zh-TW/channels/imessage)
  - Discord：[Discord](/zh-TW/channels/discord)
  - Slack：[Slack](/zh-TW/channels/slack)
