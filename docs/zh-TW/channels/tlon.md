---
read_when:
    - 開發 Tlon/Urbit 頻道功能
summary: Tlon/Urbit 支援狀態、功能與設定
title: Tlon
x-i18n:
    generated_at: "2026-07-19T13:36:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d742628d6cf9aaf82d79a8d96b1685229905e9452c9fc4d3a494d2dee8d69943
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是建構於 Urbit 上的去中心化通訊工具。OpenClaw 會連線至你的 Urbit ship，並
回覆私訊與群組聊天訊息。群組回覆預設需要 @ 提及，並在其上套用
授權規則與擁有者核准流程。

狀態：內建外掛。支援私訊、群組提及、討論串、富文字、圖片上傳／下載，以及
擁有者核准系統。不支援表情回應與投票。

## 內建外掛

目前的 OpenClaw 版本已內建 Tlon；封裝組建不需要另外安裝。

若是未包含此項目的舊版組建或自訂安裝，請從 npm 安裝：

```bash
openclaw plugins install @openclaw/tlon
```

使用不含版本的套件名稱，即可追蹤目前的發行標籤。只有需要可重現安裝時，才固定版本（`@openclaw/tlon@x.y.z`）。

從本機簽出安裝：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 設定

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

或直接編輯設定：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 建議：你的 ship，永遠具有授權
    },
  },
}
```

直接編輯設定後，請重新啟動閘道。接著私訊機器人，或在群組頻道中 @ 提及它。

## 傳入訊息持久性

OpenClaw 會先持久儲存已接受的 Tlon 私訊與群組聊天事件，再分派給代理程式。待處理或可重試的回合可在閘道重新啟動後繼續存在，且每個群組頻道或直接對話對象的工作仍會依序執行。只要佇列記錄或保留的完成記錄仍存在，穩定的 Urbit 訊息 ID 也會抑制重新傳送的事件。

從佇列到代理程式的邊界採至少一次傳遞：交接期間發生當機可能會重新執行一個回合。因此，在可行的情況下，會產生外部副作用的代理程式動作應保持冪等性。

## 私人／區域網路 ship

OpenClaw 預設會封鎖私人／內部主機名稱與 IP 範圍，以防範 SSRF。如果你的
ship 在私人網路上執行（localhost、區域網路 IP、內部主機名稱），請明確選擇啟用：

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

適用於 `http://localhost:8080`、`http://192.168.x.x:8080` 和
`http://my-ship.local:8080` 等目標。請只對你信任的 ship URL 啟用此選項；它會停用
該帳號 HTTP 請求的 SSRF 防護。

<Note>
`channels.tlon.allowPrivateNetwork`（扁平鍵）已淘汰。`openclaw doctor --fix` 會自動將它移至
`channels.tlon.network.dangerouslyAllowPrivateNetwork`。
</Note>

## 群組頻道

手動固定頻道，或開啟自動探索：

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

若設定中未指定，`autoDiscoverChannels` 預設為 `false`；設定精靈的
提示預設為「是」，並明確寫入 `true`。開啟後，OpenClaw 會在啟動時 scry 已加入的群組、
在接受群組邀請時監看新頻道，並每 2 分鐘重新檢查一次。

## 存取控制

私訊允許清單（空白 = 除非傳送者是 `ownerShip`，否則不允許任何私訊）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

群組授權預設為每個頻道使用 `restricted`。設定 `defaultAuthorizedShips` 作為
基準，並依頻道 nest 覆寫：

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

機器人一旦在討論串內回覆，就會持續回覆該討論串後續的訊息，
不需要再次提及。

設定 `channels.tlon.implicitMentions.threadParticipation: false`，可要求這些後續訊息必須再次明確提及。
帳號層級的覆寫使用 `channels.tlon.accounts.<id>.implicitMentions`。Tlon
目前不會產生 `replyToBot` 或 `quotedBot` 事實，因此這些旗標在此不會生效。

## 擁有者與核准系統

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

擁有者 ship 在所有位置都具有授權：私訊邀請一律自動接受、群組邀請一律
自動接受，且頻道訊息一律通過授權。擁有者不需要位於
`dmAllowlist`、`defaultAuthorizedShips` 或 `groupInviteAllowlist` 中。

設定 `ownerShip` 後，未授權的請求不會直接遭到捨棄，而是會加入待處理
核准佇列，並私訊擁有者：

- 來自不在 `dmAllowlist` 上之 ship 的私訊請求
- 傳送者未通過授權之頻道中的提及
- 來自不在 `groupInviteAllowlist` 上之 ship 的群組邀請（當自動接受關閉，或已開啟但
  邀請者不在允許清單時）

擁有者可透過私訊回覆來處理請求：

| 擁有者回覆                   | 效果                                                 |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | 處理最近一筆待核准項目                               |
| `approve <id>` / `deny <id>` | 依 ID 處理特定核准項目                               |
| `block`                      | 同時在原生系統封鎖該 ship，使其無法重新連線          |
| `unblock ~ship`              | 解除原生封鎖                                         |
| `blocked`                    | 列出目前遭封鎖的 ship                                |
| `pending`                    | 列出待處理的核准請求                                 |

若未設定 `ownerShip`，未授權的私訊和頻道提及只會遭到捨棄並記錄；
不會顯示核准提示。

## 自動接受設定

自動接受已在 `dmAllowlist` 上之 ship 的私訊邀請（無論此旗標如何設定，
擁有者一律會被自動接受）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

從允許清單自動接受群組邀請（採失敗時關閉：若設為 `autoAcceptGroupInvites: true` 且
`groupInviteAllowlist` 為空，則不接受任何非擁有者的邀請）：

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## 透過 Urbit 設定儲存區熱重新載入

上述大部分設定（`dmAllowlist`、`groupInviteAllowlist`、`groupChannels`、
`defaultAuthorizedShips`、`autoDiscoverChannels`、`autoAcceptDmInvites`、
`autoAcceptGroupInvites`、`ownerShip`、`showModelSignature`）會在首次執行時鏡像至 ship 的
`%settings` 代理程式（desk `moltbot`、bucket `tlon`），之後會從該處即時讀取，
因此透過 Landscape 用戶端或內建 Skills 的設定命令所做的變更，不需要
重新啟動閘道即可套用。`channelRules` 和待處理的核准項目也會以 JSON 持久儲存在該處。檔案
設定仍是從未寫入設定儲存區之值的事實來源。

## 傳遞目標（命令列介面／排程）

搭配 `openclaw message send` 或排程傳遞使用：

- 私訊：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群組：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 內建 Skills

此外掛內建 [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)，這是一個用於
直接執行 Urbit 操作的命令列介面；安裝此外掛後即可自動使用：

- **活動**：提及、回覆、未讀項目
- **頻道**：列出、建立、重新命名
- **聯絡人**：列出／取得／更新個人資料
- **群組**：建立、加入、邀請／請求流程、角色
- **掛鉤**：管理頻道掛鉤
- **訊息**：歷程記錄、搜尋
- **私訊**：傳送、回應、接受／拒絕
- **貼文**：回應、刪除
- **筆記本**：發佈至日記頻道
- **設定**：透過上述設定儲存區熱重新載入外掛設定

## 功能

| 功能            | 狀態                                          |
| --------------- | --------------------------------------------- |
| 私訊            | 支援                                          |
| 群組／頻道      | 支援（預設須提及）                            |
| 討論串          | 支援（一旦加入就會持續回覆）                  |
| 富文字          | Markdown 會轉換為 Tlon 的原生格式             |
| 圖片            | 下載傳入圖片，上傳傳出圖片                    |
| 表情回應        | 僅可透過[內建 Skills](#bundled-skill)使用     |
| 投票            | 不支援                                        |
| 原生命令        | 預設僅限擁有者                                |

## 疑難排解

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常見失敗：

- **私訊遭忽略**：傳送者不在 `dmAllowlist` 中，且未設定用於核准流程的 `ownerShip`。
- **群組訊息遭忽略**：頻道未被探索／固定，或傳送者未通過授權，且沒有
  `ownerShip` 可將核准項目加入佇列。
- **連線錯誤**：檢查 ship URL 是否可連線；本機 ship 請設定
  `network.dangerouslyAllowPrivateNetwork`。
- **驗證錯誤**：登入代碼會輪替，請從你的 ship 複製目前的代碼。

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

| 鍵                                                     | 含義                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | 啟用／停用頻道啟動。                                           |
| `channels.tlon.ship`                                   | 機器人的 Urbit ship 名稱（例如 `~sampel-palnet`）。           |
| `channels.tlon.url`                                    | Ship URL（例如 `https://sampel-palnet.tlon.network`）。                           |
| `channels.tlon.code`                                   | Ship 登入代碼。                                                 |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | 允許 localhost／區域網路 ship URL（選擇啟用 SSRF）。            |
| `channels.tlon.ownerShip`                              | 擁有者 ship：永遠具有授權，並接收核准請求。                     |
| `channels.tlon.dmAllowlist`                            | 允許私訊的 ship（空白 = 除擁有者外皆不允許）。                  |
| `channels.tlon.autoAcceptDmInvites`                    | 自動接受來自 `dmAllowlist` 中 ship 的私訊。                |
| `channels.tlon.autoAcceptGroupInvites`                 | 自動接受來自 `groupInviteAllowlist` 的群組邀請。                    |
| `channels.tlon.groupInviteAllowlist`                   | 群組邀請會被自動接受的 ship。                                   |
| `channels.tlon.autoDiscoverChannels`                   | 自動探索已加入的群組頻道（預設：`false`）。          |
| `channels.tlon.implicitMentions.threadParticipation`   | 允許已參與討論串的後續訊息略過提及限制。                         |
| `channels.tlon.groupChannels`                          | 手動固定的頻道 nest。                                           |
| `channels.tlon.defaultAuthorizedShips`                 | 所有頻道都授權的 ship（沒有相符規則時使用）。                    |
| `channels.tlon.authorization.channelRules`             | 每個頻道 nest 的授權模式與允許清單。                             |
| `channels.tlon.showModelSignature`                     | 將 `_[Generated by <model>]_` 附加至回覆。                              |
| `channels.tlon.responsePrefix`                         | 加在傳出回覆前的靜態前綴。                                      |
| `channels.tlon.accounts.<id>`                          | 其他具名帳號（多 ship 設定）。                                  |

## 備註

- 群組回覆需要 @ 提及（例如 `~your-bot-ship`），除非機器人已加入該討論串。
- 討論串回覆會發送至該討論串；機器人也會取得討論串最近 10 則訊息，並將其附加於
  代理程式的內容前。
- 富文字（粗體、斜體、程式碼、標題、清單）會轉換為 Tlon 的原生格式。
- 傳送要求提供頻道摘要的傳入訊息（例如「摘要此
  頻道」）時，會觸發內建的歷史摘要功能，而非一般回覆流程。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
