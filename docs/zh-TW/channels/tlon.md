---
read_when:
    - 開發 Tlon/Urbit 頻道功能
summary: Tlon/Urbit 支援狀態、功能與設定
title: Tlon
x-i18n:
    generated_at: "2026-07-11T21:09:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是建構於 Urbit 上的去中心化通訊軟體。OpenClaw 會連線至你的 Urbit 船艦，並回覆私訊和群組聊天訊息。群組回覆預設需要 @ 提及，並在此基礎上套用授權規則和擁有者核准流程。

狀態：內建外掛。支援私訊、群組提及、討論串、富文字、圖片上傳／下載，以及擁有者核准系統。不支援表情回應和投票。

## 內建外掛

目前的 OpenClaw 版本已內建 Tlon；封裝版本不需要另外安裝。

若使用較舊的版本或未包含此項目的自訂安裝，請從 npm 安裝：

```bash
openclaw plugins install @openclaw/tlon
```

使用不含版本的套件名稱，以追蹤目前的發行標籤。只有在需要可重現安裝時，才固定版本（`@openclaw/tlon@x.y.z`）。

從本機簽出版本安裝：

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
      ownerShip: "~your-main-ship", // recommended: your ship, always authorized
    },
  },
}
```

直接編輯設定後，請重新啟動閘道。接著私訊機器人，或在群組頻道中 @ 提及它。

## 私有網路／區域網路船艦

為防範 SSRF，OpenClaw 預設會封鎖私有／內部主機名稱和 IP 範圍。如果你的船艦在私有網路上執行（localhost、區域網路 IP、內部主機名稱），請明確選擇啟用：

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

適用於 `http://localhost:8080`、`http://192.168.x.x:8080` 和 `http://my-ship.local:8080` 等目標。僅針對你信任的船艦 URL 啟用此選項；這會停用該帳號 HTTP 請求的 SSRF 防護。

<Note>
`channels.tlon.allowPrivateNetwork`（扁平鍵）已淘汰。`openclaw doctor --fix` 會自動將其移至 `channels.tlon.network.dangerouslyAllowPrivateNetwork`。
</Note>

## 群組頻道

手動釘選頻道，或開啟自動探索：

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

設定中未指定時，`autoDiscoverChannels` 預設為 `false`；設定精靈會將提示預設設為「是」，並明確寫入 `true`。開啟後，OpenClaw 會在啟動時查詢已加入的群組、在接受群組邀請時監看新頻道，並每 2 分鐘重新檢查一次。

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

每個頻道的群組授權預設為 `restricted`。使用 `defaultAuthorizedShips` 設定基準，並依頻道巢狀路徑覆寫：

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

機器人一旦在討論串中回覆，之後便會持續回覆該討論串中的訊息，不再需要另一次提及。

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

擁有者船艦在所有位置都具備授權：一律自動接受私訊邀請、一律自動接受群組邀請，且頻道訊息一律通過授權。擁有者不需要列在 `dmAllowlist`、`defaultAuthorizedShips` 或 `groupInviteAllowlist` 中。

設定 `ownerShip` 後，未經授權的要求不會只是遭到捨棄，而是會排入待核准佇列，並私訊擁有者：

- 來自未列入 `dmAllowlist` 之船艦的私訊要求
- 在傳送者未通過授權的頻道中提及機器人
- 來自未列入 `groupInviteAllowlist` 之船艦的群組邀請（關閉自動接受時，或雖已開啟但邀請者不在允許清單中）

擁有者可透過私訊回覆來處理要求：

| 擁有者回覆                   | 效果                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `approve` / `deny` / `block` | 處理最近一筆待核准要求                                 |
| `approve <id>` / `deny <id>` | 依識別碼處理特定核准要求                               |
| `block`                      | 同時在原生系統中封鎖該船艦，使其無法重新連線           |
| `unblock ~ship`              | 解除原生封鎖                                           |
| `blocked`                    | 列出目前封鎖的船艦                                     |
| `pending`                    | 列出待處理的核准要求                                   |

若未設定 `ownerShip`，未經授權的私訊和頻道提及只會遭到捨棄並寫入記錄；不會出現核准提示。

## 自動接受設定

自動接受已列入 `dmAllowlist` 之船艦的私訊邀請（無論此旗標為何，擁有者一律會被自動接受）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

從允許清單自動接受群組邀請（採用封閉式失敗：若 `autoAcceptGroupInvites: true` 且 `groupInviteAllowlist` 為空，則不會接受任何非擁有者的邀請）：

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

上述大多數設定（`dmAllowlist`、`groupInviteAllowlist`、`groupChannels`、`defaultAuthorizedShips`、`autoDiscoverChannels`、`autoAcceptDmInvites`、`autoAcceptGroupInvites`、`ownerShip`、`showModelSignature`）會在第一次執行時鏡像至船艦的 `%settings` 代理程式（工作區 `moltbot`、儲存桶 `tlon`），之後再從該處即時讀取，因此透過 Landscape 用戶端或內建技能的設定命令所做的變更，無須重新啟動閘道即可生效。`channelRules` 和待核准要求也會以 JSON 格式持久儲存在該處。對於從未寫入設定儲存區的值，檔案設定仍是唯一真實來源。

## 傳送目標（命令列介面／排程）

搭配 `openclaw message send` 或排程傳送使用：

- 私訊：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群組：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 內建技能

此外掛內建 [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)，這是用於直接執行 Urbit 操作的命令列介面；安裝此外掛後即可自動使用：

- **活動**：提及、回覆、未讀項目
- **頻道**：列出、建立、重新命名
- **聯絡人**：列出／取得／更新個人資料
- **群組**：建立、加入、邀請／申請流程、角色
- **掛鉤**：管理頻道掛鉤
- **訊息**：歷史記錄、搜尋
- **私訊**：傳送、回應、接受／拒絕
- **貼文**：回應、刪除
- **筆記本**：發佈至日記頻道
- **設定**：透過上述設定儲存區熱重新載入外掛設定

## 功能

| 功能       | 狀態                                           |
| ---------- | ---------------------------------------------- |
| 私訊       | 支援                                           |
| 群組／頻道 | 支援（預設須經提及才會回應）                   |
| 討論串     | 支援（加入後會持續回覆）                       |
| 富文字     | Markdown 會轉換為 Tlon 的原生格式              |
| 圖片       | 下載傳入圖片，上傳傳出圖片                     |
| 表情回應   | 僅可透過[內建技能](#bundled-skill)使用         |
| 投票       | 不支援                                         |
| 原生命令   | 預設僅限擁有者                                 |

## 疑難排解

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常見故障：

- **私訊遭忽略**：傳送者不在 `dmAllowlist` 中，且未設定可供核准流程使用的 `ownerShip`。
- **群組訊息遭忽略**：頻道尚未被探索／釘選，或傳送者未通過授權，且沒有可將要求排入核准佇列的 `ownerShip`。
- **連線錯誤**：檢查船艦 URL 是否可存取；本機船艦請設定 `network.dangerouslyAllowPrivateNetwork`。
- **驗證錯誤**：登入代碼會輪替，請從你的船艦複製目前的代碼。

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

| 鍵                                                     | 含義                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | 啟用／停用頻道啟動。                                           |
| `channels.tlon.ship`                                   | 機器人的 Urbit 船艦名稱（例如 `~sampel-palnet`）。              |
| `channels.tlon.url`                                    | 船艦 URL（例如 `https://sampel-palnet.tlon.network`）。         |
| `channels.tlon.code`                                   | 船艦登入代碼。                                                  |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | 允許 localhost／區域網路船艦 URL（明確選擇啟用 SSRF 例外）。    |
| `channels.tlon.ownerShip`                              | 擁有者船艦：一律具備授權，並接收核准要求。                       |
| `channels.tlon.dmAllowlist`                            | 允許傳送私訊的船艦（空白 = 除擁有者外皆不允許）。               |
| `channels.tlon.autoAcceptDmInvites`                    | 自動接受 `dmAllowlist` 中船艦的私訊。                           |
| `channels.tlon.autoAcceptGroupInvites`                 | 自動接受來自 `groupInviteAllowlist` 的群組邀請。                |
| `channels.tlon.groupInviteAllowlist`                   | 其群組邀請會被自動接受的船艦。                                  |
| `channels.tlon.autoDiscoverChannels`                   | 自動探索已加入的群組頻道（預設：`false`）。                     |
| `channels.tlon.groupChannels`                          | 手動釘選的頻道巢狀路徑。                                        |
| `channels.tlon.defaultAuthorizedShips`                 | 所有頻道皆授權的船艦（沒有規則相符時使用）。                     |
| `channels.tlon.authorization.channelRules`             | 各頻道巢狀路徑的驗證模式與允許清單。                             |
| `channels.tlon.showModelSignature`                     | 在回覆後附加 `_[Generated by <model>]_`。                       |
| `channels.tlon.responsePrefix`                         | 加在傳出回覆前方的靜態前綴。                                    |
| `channels.tlon.accounts.<id>`                          | 其他具名帳號（多船艦設定）。                                    |

## 注意事項

- 群組回覆需要 @ 提及（例如 `~your-bot-ship`），除非機器人已加入該討論串。
- 討論串回覆會送至討論串內；機器人也會取得討論串最近 10 則訊息，並將其作為情境資訊附加至代理程式輸入前方。
- 富文字（粗體、斜體、程式碼、標題、清單）會轉換為 Tlon 的原生格式。
- 傳送要求頻道摘要的傳入訊息（例如「摘要此頻道」）時，會觸發內建的歷史記錄摘要功能，而非一般回覆流程。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
