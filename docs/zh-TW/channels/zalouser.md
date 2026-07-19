---
read_when:
    - 為 OpenClaw 設定 Zalo Personal
    - 偵錯 Zalo Personal 登入或訊息流程
summary: 透過原生 zca-js（QR Code 登入）支援 Zalo Personal 帳號、功能與設定
title: Zalo Personal
x-i18n:
    generated_at: "2026-07-19T13:37:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09cecad1a9a5b34b932c5e68e2b3164b360fb6af1dcd2fd5b5979d1b2a1bd62b
    source_path: channels/zalouser.md
    workflow: 16
---

狀態：實驗性。此整合透過原生 `zca-js` 在程序內自動操作**個人 Zalo 帳號**，無須外部命令列介面執行檔。

<Warning>
這是非官方整合，可能導致帳號遭停權或封鎖。請自行承擔使用風險。
</Warning>

## 安裝

Zalo Personal 是官方外部外掛，未隨核心內建。使用前請先安裝：

```bash
openclaw plugins install @openclaw/zalouser
```

- 鎖定版本：`openclaw plugins install @openclaw/zalouser@<version>`
- 從原始碼簽出版本安裝：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

1. 安裝外掛（如上所述）。
2. 登入（透過 QR Code，於閘道主機上操作）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 行動應用程式掃描 QR Code。
3. 啟用頻道：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. 重新啟動閘道（或完成設定）。
5. 私訊存取預設使用配對；首次聯絡時核准配對碼。

## 功能說明

- 完全透過 `zca-js` 程式庫在程序內執行（不需外部 `zca`/`openzca` 執行檔）。
- 使用原生事件監聽器（`message`、`error`）接收傳入訊息。
- 直接透過 JS API 傳送回覆（文字／媒體／連結）。
- 專為無法使用 Zalo Bot API 的「個人帳號」使用情境而設計。

## 命名

頻道 ID 為 `zalouser`，用以明確表示此功能會自動操作**個人 Zalo 使用者帳號**（非官方）。`zalo` 保留供未來可能推出的官方 Zalo API 整合使用。

## 尋找 ID（目錄）

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 傳出文字會切分為每段 2000 個字元（Zalo 用戶端限制）。
- 不支援串流。
- 已完成處理的傳入訊息 ID 會保留 30 天，每個帳號最多保留最近 1000 筆項目。

## 傳入訊息持久性

OpenClaw 會在處理每個原始 `zca-js` 訊息回呼前，先將其儲存。閘道重新啟動後，待處理訊息會從帳號佇列恢復，且每個私聊或群組的處理仍會依序進行。

`zca-js` 通訊端監聽器不會提供傳遞確認，也不會在重新連線後自動重播舊訊息。因此，持久佇列只能防範回呼抵達 OpenClaw 後的本機當機時段；無法復原通訊端從未傳遞的訊息。重播墓碑主要用於防範收到具有相同 Zalo 訊息 ID 的重複回呼。

## 存取控制（私訊）

`channels.zalouser.dmPolicy`：`pairing | allowlist | open | disabled`（預設：`pairing`）。

`channels.zalouser.allowFrom` 應使用穩定的 Zalo 使用者 ID。也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。在互動式設定期間，輸入的名稱可透過外掛的程序內聯絡人查詢解析為 ID。

如果設定中仍有原始名稱，啟動時只會在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 的情況下解析名稱。若未選擇啟用，執行階段的傳送者檢查只會使用 ID，且授權時會忽略原始名稱。

核准方式：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群組存取（選用）

- 預設：`channels.zalouser.groupPolicy = "allowlist"`（群組需要明確的允許清單項目）。
- 開放所有群組：`channels.zalouser.groupPolicy = "open"`。
- 封鎖所有群組：`channels.zalouser.groupPolicy = "disabled"`。
- 使用 `groupPolicy = "allowlist"` 時：
  - `channels.zalouser.groups` 的鍵應為穩定的群組 ID；只有啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，才會在啟動時將名稱解析為 ID。
  - `channels.zalouser.groupAllowFrom` 控制允許群組中的哪些傳送者可以觸發機器人；可使用 `accessGroup:<name>` 參照靜態傳送者存取群組。
- 設定精靈可以提示輸入群組允許清單。
- 群組允許清單預設只比對 ID。除非啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否則授權時會忽略無法解析的名稱。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是緊急相容模式，會重新啟用可變動的啟動名稱解析與執行階段群組名稱比對。
- 對一般群組訊息而言，`groupAllowFrom` **不會**退回使用 `allowFrom`：若允許清單中的群組將其留空，該群組便會對所有傳送者開放。已授權的控制命令（例如 `/new`）例外；當 `groupAllowFrom` 為空時，命令傳送者檢查會退回使用 `allowFrom`。

範例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` 是舊版欄位名稱；目前的設定使用 `enabled`。`openclaw doctor --fix` 會自動將 `allow` 遷移至 `enabled`。
</Note>

### 群組提及閘控

- `channels.zalouser.groups.<group>.requireMention` 控制群組回覆是否需要提及。
- 解析順序：群組 ID -> `group:<id>` 別名 -> 群組名稱／slug（以名稱為基礎的候選項目僅在 `dangerouslyAllowNameMatching: true` 時適用）-> `*` -> 預設值（`true`）。
- 同時適用於允許清單群組與開放群組模式。
- 引用機器人訊息會視為隱含提及，並啟用群組處理。
- 已授權的控制命令（例如 `/new`）可以略過提及閘控。
- 當群組訊息因需要提及而遭略過時，OpenClaw 會將其儲存為待處理群組歷程，並在下一則已處理的群組訊息中納入該訊息。
- 群組歷程限制：`channels.zalouser.historyLimit`，其次為 `messages.groupChat.historyLimit`，再退回使用 `50`。

範例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## 多帳號

帳號會對應至 OpenClaw 狀態中的 `zalouser` 設定檔。範例：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## 環境變數

也可以透過環境變數選取設定檔：

| 變數                | 用途                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | 當頻道或帳號設定中未設定 `profile` 時所使用的設定檔名稱。 |
| `ZCA_PROFILE`      | 舊版備援，僅在未設定 `ZALOUSER_PROFILE` 時使用。             |

設定檔名稱會選取儲存在 OpenClaw 狀態中的 Zalo 登入認證資訊。解析順序：

1. 設定中明確指定的 `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. 非預設帳號使用帳號 ID，預設帳號則使用 `default`。

若採用多帳號設定，建議在設定中為每個帳號設定 `profile`，避免一個環境變數導致多個帳號共用相同的登入工作階段。

## 輸入狀態、回應與傳遞確認

- OpenClaw 會在傳送回覆前送出輸入狀態事件（盡力而為）。
- 頻道動作中的 `zalouser` 支援訊息回應動作 `react`。
  - 使用 `remove: true` 從訊息移除特定回應表情符號。
  - 回應語意：[回應](/zh-TW/tools/reactions)
- 對於包含事件中繼資料的傳入訊息，OpenClaw 會傳送已傳遞與已查看確認（盡力而為）。

## 疑難排解

**登入狀態未保留：**

- `openclaw channels status --probe`
- 重新登入：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**無法解析允許清單／群組名稱：**

- 在 `allowFrom`/`groupAllowFrom` 中使用數字 ID，並在 `groups` 中使用穩定的群組 ID。若確實需要使用完全相符的好友／群組名稱，請啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**從舊版外部 `zca`/命令列介面設定升級：**

- 移除所有對外部 `zca` 程序的假設；頻道目前完全透過 `zca-js` 在程序內執行，不需外部命令列介面執行檔。

## 相關內容

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與安全強化
