---
read_when:
    - 為 OpenClaw 設定 Zalo Personal
    - 偵錯 Zalo Personal 登入或訊息流程
summary: 透過原生 zca-js（QR 登入）支援 Zalo Personal 帳號、功能與設定
title: Zalo Personal
x-i18n:
    generated_at: "2026-07-05T11:08:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

狀態：實驗性。此整合透過原生 `zca-js` 在程序內自動化**個人 Zalo 帳號**，不使用外部命令列介面二進位檔。

<Warning>
這是非官方整合，可能導致帳號停權或封鎖。請自行承擔使用風險。
</Warning>

## 安裝

Zalo Personal 是官方外部外掛，未綑綁在核心中。使用前請先安裝：

```bash
openclaw plugins install @openclaw/zalouser
```

- 釘選版本：`openclaw plugins install @openclaw/zalouser@<version>`
- 從原始碼 checkout 安裝：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

1. 安裝外掛（如上）。
2. 登入（QR，在閘道機器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 行動應用程式掃描 QR code。
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
5. 私訊存取預設為配對；首次聯絡時核准配對碼。

## 這是什麼

- 透過 `zca-js` 函式庫完全在程序內執行（沒有外部 `zca`/`openzca` 二進位檔）。
- 使用原生事件監聽器（`message`、`error`）接收傳入訊息。
- 直接透過 JS API 傳送回覆（文字/媒體/連結）。
- 專為無法使用 Zalo Bot API 的「個人帳號」使用情境設計。

## 命名

頻道 ID 是 `zalouser`，以明確表示這會自動化**個人 Zalo 使用者帳號**（非官方）。`zalo` 保留給未來可能的官方 Zalo API 整合。

## 尋找 ID（目錄）

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 傳出文字會切分為 2000 個字元（Zalo 用戶端限制）。
- 不支援串流。

## 存取控制（私訊）

`channels.zalouser.dmPolicy`：`pairing | allowlist | open | disabled`（預設：`pairing`）。

`channels.zalouser.allowFrom` 應使用穩定的 Zalo 使用者 ID。它也可以參照靜態寄件者存取群組（`accessGroup:<name>`）。在互動式設定期間，輸入的名稱可使用外掛的程序內聯絡人查詢解析為 ID。

如果原始名稱仍留在設定中，啟動時只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時才會解析。若未選擇啟用，執行階段寄件者檢查僅使用 ID，且會忽略原始名稱授權。

透過以下方式核准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群組存取（選用）

- 預設：`channels.zalouser.groupPolicy = "allowlist"`（群組需要明確的允許清單項目）。
- 開放所有群組：`channels.zalouser.groupPolicy = "open"`。
- 封鎖所有群組：`channels.zalouser.groupPolicy = "disabled"`。
- 使用 `groupPolicy = "allowlist"` 時：
  - `channels.zalouser.groups` 鍵應為穩定的群組 ID；只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，名稱才會在啟動時解析為 ID。
  - `channels.zalouser.groupAllowFrom` 控制允許群組中哪些寄件者可以觸發機器人；可用 `accessGroup:<name>` 參照靜態寄件者存取群組。
- 設定精靈可以提示輸入群組允許清單。
- 群組允許清單比對預設僅使用 ID。除非啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否則未解析的名稱會在驗證時被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是緊急相容模式，會重新啟用可變的啟動名稱解析與執行階段群組名稱比對。
- 對一般群組訊息而言，`groupAllowFrom` **不會**回退到 `allowFrom`：在允許清單群組中將其留空，會開放該群組給任何寄件者。已授權的控制命令（例如 `/new`）是例外；當 `groupAllowFrom` 為空時，命令寄件者檢查會回退到 `allowFrom`。

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
`channels.zalouser.groups.<id>.allow` 是舊版欄位名稱；目前設定使用 `enabled`。`openclaw doctor --fix` 會自動將 `allow` 遷移到 `enabled`。
</Note>

### 群組提及控管

- `channels.zalouser.groups.<group>.requireMention` 控制群組回覆是否需要提及。
- 解析順序：群組 ID -> `group:<id>` 別名 -> 群組名稱/slug（名稱型候選項只在 `dangerouslyAllowNameMatching: true` 時套用）-> `*` -> 預設（`true`）。
- 同時適用於允許清單群組與開放群組模式。
- 引用機器人訊息會算作群組啟用的隱含提及。
- 已授權的控制命令（例如 `/new`）可以略過提及控管。
- 當群組訊息因需要提及而被略過時，OpenClaw 會將其儲存為待處理群組歷史，並在下一則已處理的群組訊息中納入。
- 群組歷史限制：`channels.zalouser.historyLimit`，接著是 `messages.groupChat.historyLimit`，再接著回退為 `50`。

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

帳號會對應到 OpenClaw 狀態中的 `zalouser` profile。範例：

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

Profile 選擇也可以來自環境變數：

| 變數               | 用途                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | 當頻道或帳號設定中未設定 `profile` 時要使用的 profile 名稱。               |
| `ZCA_PROFILE`      | 舊版回退，只有在未設定 `ZALOUSER_PROFILE` 時使用。                         |

Profile 名稱會選取 OpenClaw 狀態中已儲存的 Zalo 登入憑證。解析順序：

1. 設定中的明確 `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. 非預設帳號的帳號 ID，或預設帳號的 `default`。

對於多帳號設定，建議在設定中為每個帳號設定 `profile`，讓單一環境變數不會使多個帳號共用同一個登入工作階段。

## 輸入狀態、反應與送達確認

- OpenClaw 會在發送回覆前傳送輸入狀態事件（盡力而為）。
- 頻道動作中支援 `zalouser` 的訊息反應動作 `react`。
  - 使用 `remove: true` 可從訊息移除特定反應 emoji。
  - 反應語意：[反應](/zh-TW/tools/reactions)
- 對於包含事件中繼資料的傳入訊息，OpenClaw 會傳送已送達 + 已讀確認（盡力而為）。

## 疑難排解

**登入沒有保留：**

- `openclaw channels status --probe`
- 重新登入：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允許清單/群組名稱未解析：**

- 在 `allowFrom`/`groupAllowFrom` 中使用數字 ID，並在 `groups` 中使用穩定群組 ID。如果你有意需要精確的好友/群組名稱，請啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**從舊版外部 `zca`/命令列介面型設定升級：**

- 移除任何外部 `zca` 程序假設；頻道現在完全透過 `zca-js` 在程序內執行，不使用外部命令列介面二進位檔。

## 相關

- [頻道概觀](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及控管
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化
