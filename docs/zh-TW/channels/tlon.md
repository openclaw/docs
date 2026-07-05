---
read_when:
    - 開發 Tlon/Urbit 頻道功能
summary: Tlon/Urbit 支援狀態、功能與設定
title: Tlon
x-i18n:
    generated_at: "2026-07-05T11:04:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是建構於 Urbit 上的去中心化通訊工具。OpenClaw 會連線到你的 Urbit 船艦，並回應 DM 與群組聊天訊息。群組回覆預設需要 @ 提及，並在其上疊加授權規則與擁有者核准流程。

狀態：內建外掛。支援 DM、群組提及、討論串、富文字、圖片上傳/下載，以及擁有者核准系統。不支援反應與投票。

## 內建外掛

Tlon 已內建於目前的 OpenClaw 發行版本；封裝建置不需要另外安裝。

在較舊的建置或排除它的自訂安裝中，請從 npm 安裝：

```bash
openclaw plugins install @openclaw/tlon
```

使用裸套件名稱可追蹤目前的發行標籤。只有在需要可重現安裝時，才釘選版本（`@openclaw/tlon@x.y.z`）。

從本機 checkout 安裝：

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

直接編輯設定後請重新啟動閘道。接著 DM 機器人，或在群組頻道中 @ 提及它。

## 私有/LAN 船艦

OpenClaw 預設會封鎖私有/內部主機名稱與 IP 範圍，以提供 SSRF 防護。如果你的船艦執行在私有網路上（localhost、LAN IP、內部主機名稱），請明確選擇啟用：

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

適用於像 `http://localhost:8080`、`http://192.168.x.x:8080` 和 `http://my-ship.local:8080` 這類目標。只應為你信任的船艦 URL 啟用此選項；它會停用該帳號 HTTP 請求的 SSRF 防護。

<Note>
`channels.tlon.allowPrivateNetwork`（扁平鍵）已淘汰。`openclaw doctor --fix` 會自動將它移至 `channels.tlon.network.dangerouslyAllowPrivateNetwork`。
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

`autoDiscoverChannels` 在設定中未設定時預設為 `false`；設定精靈會將提示預設為是，並明確寫入 `true`。開啟後，OpenClaw 會在啟動時 scry 已加入的群組、在接受群組邀請時監看新頻道，並每 2 分鐘重新檢查一次。

## 存取控制

DM 允許清單（空白 = 除非傳送者是 `ownerShip`，否則不允許任何 DM）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

群組授權預設每個頻道為 `restricted`。設定 `defaultAuthorizedShips` 作為基準，並依頻道 nest 覆寫：

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

機器人一旦在討論串內回覆，就會持續回應該討論串中的後續訊息，而不需要再次提及。

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

擁有者船艦在任何地方都已授權：DM 邀請一律自動接受、群組邀請一律自動接受，且頻道訊息一律通過授權。擁有者不需要列在 `dmAllowlist`、`defaultAuthorizedShips` 或 `groupInviteAllowlist` 中。

設定 `ownerShip` 後，未授權請求不會只是被丟棄，而是會佇列為待核准項目並 DM 擁有者：

- 來自不在 `dmAllowlist` 中船艦的 DM 請求
- 傳送者在頻道中未通過授權時的提及
- 來自不在 `groupInviteAllowlist` 中船艦的群組邀請（自動接受關閉時，或已開啟但邀請者不在允許清單中時）

擁有者可在 DM 中回覆以處理請求：

| 擁有者回覆                  | 效果                                               |
| ---------------------------- | ---------------------------------------------------- |
| `approve` / `deny` / `block` | 處理最近的待核准項目             |
| `approve <id>` / `deny <id>` | 依 id 處理特定核准項目                    |
| `block`                      | 也會原生封鎖該船艦，使其無法重新連線 |
| `unblock ~ship`              | 解除原生封鎖                              |
| `blocked`                    | 列出目前已封鎖的船艦                        |
| `pending`                    | 列出待核准請求                      |

未設定 `ownerShip` 時，未授權的 DM 與頻道提及只會被丟棄並記錄；不會出現核准提示。

## 自動接受設定

自動接受來自已在 `dmAllowlist` 中船艦的 DM 邀請（無論此旗標如何，擁有者一律會自動接受）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

自動接受來自允許清單的群組邀請（封閉失敗：若 `autoAcceptGroupInvites: true` 且 `groupInviteAllowlist` 為空，則不會接受任何非擁有者邀請）：

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

上述大多數設定（`dmAllowlist`、`groupInviteAllowlist`、`groupChannels`、`defaultAuthorizedShips`、`autoDiscoverChannels`、`autoAcceptDmInvites`、`autoAcceptGroupInvites`、`ownerShip`、`showModelSignature`）會在首次執行時鏡像到船艦的 `%settings` 代理程式（desk `moltbot`、bucket `tlon`），之後會從該處即時讀取，因此透過 Landscape 用戶端或內建技能的設定命令所做的變更，無需重新啟動閘道即可套用。`channelRules` 與待核准項目也會以 JSON 持久化在該處。檔案設定仍是從未寫入設定儲存區之值的真實來源。

## 傳遞目標（命令列介面/排程）

搭配 `openclaw message send` 或排程傳遞使用：

- DM：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群組：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 內建技能

此外掛內建 [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)，這是一個用於直接 Urbit 操作的命令列介面；安裝外掛後即可自動使用：

- **活動**：提及、回覆、未讀
- **頻道**：列出、建立、重新命名
- **聯絡人**：列出/取得/更新個人資料
- **群組**：建立、加入、邀請/請求流程、角色
- **鉤子**：管理頻道鉤子
- **訊息**：歷史、搜尋
- **DM**：傳送、反應、接受/拒絕
- **貼文**：反應、刪除
- **筆記本**：張貼到日記頻道
- **設定**：透過上述設定儲存區熱重新載入外掛設定

## 功能

| 功能         | 狀態                                        |
| --------------- | --------------------------------------------- |
| 直接訊息 | 支援                                     |
| 群組/頻道 | 支援（預設由提及門控）          |
| 討論串         | 支援（一旦加入就會持續回覆） |
| 富文字       | Markdown 會轉換為 Tlon 的原生格式    |
| 圖片          | 下載傳入圖片、上傳傳出圖片         |
| 反應       | 僅可透過[內建技能](#bundled-skill)使用  |
| 投票           | 不支援                                 |
| 原生命令 | 預設僅限擁有者                         |

## 疑難排解

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常見失敗：

- **DM 被忽略**：傳送者不在 `dmAllowlist` 中，且未設定用於核准流程的 `ownerShip`。
- **群組訊息被忽略**：頻道未被探索/釘選，或傳送者未通過授權且沒有 `ownerShip` 可佇列核准。
- **連線錯誤**：檢查船艦 URL 是否可連線；針對本機船艦設定 `network.dangerouslyAllowPrivateNetwork`。
- **驗證錯誤**：登入碼會輪替，請從你的船艦複製目前的代碼。

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

| 鍵                                                    | 意義                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | 啟用/停用頻道啟動。                                |
| `channels.tlon.ship`                                   | 機器人的 Urbit 船艦名稱（例如 `~sampel-palnet`）。                 |
| `channels.tlon.url`                                    | 船艦 URL（例如 `https://sampel-palnet.tlon.network`）。          |
| `channels.tlon.code`                                   | 船艦登入碼。                                               |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | 允許 localhost/LAN 船艦 URL（SSRF 選擇啟用）。                   |
| `channels.tlon.ownerShip`                              | 擁有者船艦：一律授權，接收核准請求。     |
| `channels.tlon.dmAllowlist`                            | 允許 DM 的船艦（空白 = 除擁有者外無）。              |
| `channels.tlon.autoAcceptDmInvites`                    | 自動接受來自 `dmAllowlist` 中船艦的 DM。                   |
| `channels.tlon.autoAcceptGroupInvites`                 | 自動接受來自 `groupInviteAllowlist` 的群組邀請。         |
| `channels.tlon.groupInviteAllowlist`                   | 群組邀請會被自動接受的船艦。                   |
| `channels.tlon.autoDiscoverChannels`                   | 自動探索已加入的群組頻道（預設：`false`）。        |
| `channels.tlon.groupChannels`                          | 手動釘選的頻道 nest。                                 |
| `channels.tlon.defaultAuthorizedShips`                 | 授權所有頻道的船艦（沒有規則相符時使用）。 |
| `channels.tlon.authorization.channelRules`             | 每個頻道 nest 的驗證模式 + 允許清單。                        |
| `channels.tlon.showModelSignature`                     | 將 `_[Generated by <model>]_` 附加到回覆。                  |
| `channels.tlon.responsePrefix`                         | 加到傳出回覆前方的靜態前綴。                   |
| `channels.tlon.accounts.<id>`                          | 額外的具名帳號（多船艦設定）。                 |

## 備註

- 群組回覆需要 @ 提及（例如 `~your-bot-ship`），除非機器人已加入該討論串。
- 討論串回覆會落在討論串內；機器人也會取得前置給代理程式的最後 10 則討論串內容訊息。
- 富文字（粗體、斜體、程式碼、標題、清單）會轉換為 Tlon 的原生格式。
- 傳送要求頻道摘要的傳入訊息（例如「summarize this channel」）會觸發內建的歷史摘要，而不是一般回覆流程。

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
