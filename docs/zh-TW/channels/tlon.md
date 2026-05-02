---
read_when:
    - 正在開發 Tlon/Urbit 通道功能
summary: Tlon/Urbit 支援狀態、功能與設定
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon 是建構於 Urbit 上的去中心化通訊工具。OpenClaw 會連線到你的 Urbit ship，並可
回應 DM 與群組聊天訊息。群組回覆預設需要 @ 提及，且可透過允許清單進一步限制。

狀態：內建 Plugin。支援 DM、群組提及、討論串回覆、富文字格式，以及
圖片上傳。尚未支援反應與投票。

## 內建 Plugin

Tlon 在目前的 OpenClaw 發行版本中作為內建 Plugin 隨附，因此一般封裝
建置不需要另外安裝。

如果你使用的是較舊的建置，或排除 Tlon 的自訂安裝，請安裝
目前的 npm 套件：

透過 CLI 安裝（npm registry）：

```bash
openclaw plugins install @openclaw/tlon
```

使用裸套件名稱即可跟隨目前的官方發行標籤。只有在需要可重現安裝時，
才釘選精確版本。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

詳細資訊：[Plugins](/zh-TW/tools/plugin)

## 設定

1. 確認 Tlon Plugin 可用。
   - 目前封裝的 OpenClaw 發行版本已內建它。
   - 較舊/自訂安裝可使用上述命令手動加入。
2. 取得你的 ship URL 與登入碼。
3. 設定 `channels.tlon`。
4. 重新啟動 Gateway。
5. DM bot，或在群組頻道中提及它。

最小設定（單一帳號）：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## 私有/LAN ships

OpenClaw 預設會封鎖私有/內部主機名稱與 IP 範圍，以提供 SSRF 保護。
如果你的 ship 在私有網路上執行（localhost、LAN IP 或內部主機名稱），
你必須明確選擇啟用：

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

這適用於下列 URL：

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ 只有在你信任本機網路時才啟用此設定。此設定會停用
對你的 ship URL 發出請求時的 SSRF 保護。

## 群組頻道

預設會啟用自動探索。你也可以手動釘選頻道：

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

停用自動探索：

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## 存取控制

DM 允許清單（空白 = 不允許任何 DM，使用 `ownerShip` 進行核准流程）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

群組授權（預設受限制）：

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

## 擁有者與核准系統

設定擁有者 ship，以便在未授權使用者嘗試互動時接收核准請求：

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

擁有者 ship 會**在所有位置自動獲得授權** — DM 邀請會自動接受，
頻道訊息也一律允許。你不需要將擁有者加入 `dmAllowlist` 或
`defaultAuthorizedShips`。

設定後，擁有者會收到下列 DM 通知：

- 來自不在允許清單中的 ships 的 DM 請求
- 未授權頻道中的提及
- 群組邀請請求

## 自動接受設定

自動接受 DM 邀請（針對 dmAllowlist 中的 ships）：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

自動接受群組邀請：

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 傳送目標（CLI/cron）

搭配 `openclaw message send` 或 cron 傳送使用：

- DM：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群組：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 內建 skill

Tlon Plugin 包含一個內建 skill（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)），
提供 Tlon 操作的 CLI 存取：

- **聯絡人**：取得/更新個人檔案、列出聯絡人
- **頻道**：列出、建立、發布訊息、擷取歷史記錄
- **群組**：列出、建立、管理成員
- **DM**：傳送訊息、對訊息加入反應
- **反應**：對貼文與 DM 新增/移除 emoji 反應
- **設定**：透過 slash commands 管理 Plugin 權限

安裝 Plugin 後，該 skill 會自動可用。

## 功能

| 功能         | 狀態                                  |
| --------------- | --------------------------------------- |
| 直接訊息 | ✅ 支援                            |
| 群組/頻道 | ✅ 支援（預設需要提及） |
| 討論串         | ✅ 支援（在討論串中自動回覆）   |
| 富文字       | ✅ Markdown 會轉換為 Tlon 格式    |
| 圖片          | ✅ 上傳至 Tlon 儲存空間             |
| 反應       | ✅ 透過[內建 skill](#bundled-skill)  |
| 投票           | ❌ 尚未支援                    |
| 原生命令 | ✅ 支援（預設僅限擁有者）    |

## 疑難排解

先執行這組階梯式檢查：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常見失敗：

- **DM 被忽略**：寄件者不在 `dmAllowlist` 中，且未設定用於核准流程的 `ownerShip`。
- **群組訊息被忽略**：頻道未被探索到，或寄件者未獲授權。
- **連線錯誤**：檢查 ship URL 是否可連線；針對本機 ships 啟用 `allowPrivateNetwork`。
- **驗證錯誤**：確認登入碼是目前有效的（代碼會輪替）。

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

提供者選項：

- `channels.tlon.enabled`：啟用/停用頻道啟動。
- `channels.tlon.ship`：bot 的 Urbit ship 名稱（例如 `~sampel-palnet`）。
- `channels.tlon.url`：ship URL（例如 `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`：ship 登入碼。
- `channels.tlon.allowPrivateNetwork`：允許 localhost/LAN URL（SSRF 繞過）。
- `channels.tlon.ownerShip`：核准系統的擁有者 ship（一律授權）。
- `channels.tlon.dmAllowlist`：允許 DM 的 ships（空白 = 無）。
- `channels.tlon.autoAcceptDmInvites`：自動接受允許清單中 ships 的 DM。
- `channels.tlon.autoAcceptGroupInvites`：自動接受所有群組邀請。
- `channels.tlon.autoDiscoverChannels`：自動探索群組頻道（預設：true）。
- `channels.tlon.groupChannels`：手動釘選的頻道 nests。
- `channels.tlon.defaultAuthorizedShips`：對所有頻道授權的 ships。
- `channels.tlon.authorization.channelRules`：每個頻道的驗證規則。
- `channels.tlon.showModelSignature`：在訊息附加模型名稱。

## 備註

- 群組回覆需要提及（例如 `~your-bot-ship`）才會回應。
- 討論串回覆：如果傳入訊息位於討論串中，OpenClaw 會在討論串內回覆。
- 富文字：Markdown 格式（粗體、斜體、程式碼、標題、清單）會轉換為 Tlon 的原生格式。
- 圖片：URL 會上傳至 Tlon 儲存空間，並嵌入為圖片區塊。

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的 session 路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
