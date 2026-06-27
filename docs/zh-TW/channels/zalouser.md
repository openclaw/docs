---
read_when:
    - 為 OpenClaw 設定 Zalo Personal
    - 偵錯 Zalo Personal 登入或訊息流程
summary: 透過原生 zca-js（QR 登入）支援 Zalo Personal 帳號、功能與設定
title: Zalo Personal
x-i18n:
    generated_at: "2026-06-27T19:00:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

狀態：實驗性。此整合在 OpenClaw 內透過原生 `zca-js` 自動化**個人 Zalo 帳號**。

<Warning>
這是非官方整合，可能導致帳號停權或封鎖。使用風險由你自行承擔。
</Warning>

## 內建外掛

Zalo Personal 在目前的 OpenClaw 版本中以內建外掛形式提供，因此一般
封裝建置不需要另外安裝。

如果你使用的是較舊的建置，或排除了 Zalo Personal 的自訂安裝，
請直接安裝 npm 套件：

- 透過命令列介面安裝：`openclaw plugins install @openclaw/zalouser`
- 固定版本：`openclaw plugins install @openclaw/zalouser@2026.5.2`
- 或從原始碼 checkout 安裝：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細資訊：[外掛](/zh-TW/tools/plugin)

不需要外部 `zca`/`openzca` 命令列介面二進位檔。

## 快速設定（初學者）

1. 確認 Zalo Personal 外掛可用。
   - 目前封裝的 OpenClaw 版本已內建此功能。
   - 較舊或自訂安裝可使用上述指令手動加入。
2. 登入（QR，在閘道機器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 行動 App 掃描 QR code。
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

## 這是什麼

- 完全透過 `zca-js` 在程序內執行。
- 使用原生事件監聽器接收傳入訊息。
- 直接透過 JS API 傳送回覆（文字/媒體/連結）。
- 專為無法使用 Zalo Bot API 的「個人帳號」使用情境設計。

## 命名

頻道 id 是 `zalouser`，以明確表示這會自動化**個人 Zalo 使用者帳號**（非官方）。我們保留 `zalo` 給未來可能的官方 Zalo API 整合使用。

## 尋找 ID（目錄）

使用目錄命令列介面探索對象/群組及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 外送文字會切分成約 2000 個字元的區塊（Zalo 用戶端限制）。
- 預設會封鎖串流。

## 存取控制（私訊）

`channels.zalouser.dmPolicy` 支援：`pairing | allowlist | open | disabled`（預設：`pairing`）。

`channels.zalouser.allowFrom` 應使用穩定的 Zalo 使用者 ID。它也可以參照靜態傳送者存取群組（`accessGroup:<name>`）。在互動式設定期間，輸入的名稱可使用外掛的程序內聯絡人查詢解析為 ID。

如果原始名稱仍留在設定中，啟動時只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時才會解析。若未選擇啟用，執行階段傳送者檢查僅使用 ID，並且會忽略原始名稱的授權。

透過以下方式核准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群組存取（選用）

- 預設：`channels.zalouser.groupPolicy = "open"`（允許群組）。未設定時，可使用 `channels.defaults.groupPolicy` 覆寫預設值。
- 使用以下設定限制為允許清單：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（key 應為穩定的群組 ID；只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，名稱才會在啟動時解析為 ID）
  - `channels.zalouser.groupAllowFrom`（控制允許群組中的哪些傳送者可以觸發 bot；可使用 `accessGroup:<name>` 參照靜態傳送者存取群組）
- 封鎖所有群組：`channels.zalouser.groupPolicy = "disabled"`。
- 設定精靈可以提示輸入群組允許清單。
- 啟動時，OpenClaw 只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，才會將允許清單中的群組/使用者名稱解析為 ID 並記錄對應關係。
- 群組允許清單比對預設僅使用 ID。除非啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否則未解析的名稱會在驗證時被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是緊急相容模式，會重新啟用可變動的啟動名稱解析與執行階段群組名稱比對。
- 如果未設定 `groupAllowFrom`，執行階段會退回使用 `allowFrom` 進行群組傳送者檢查。
- 傳送者檢查會套用於一般群組訊息和控制指令（例如 `/new`）。

範例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### 群組提及門檻

- `channels.zalouser.groups.<group>.requireMention` 控制群組回覆是否需要提及。
- 解析順序：精確群組 id/名稱 -> 正規化群組 slug -> `*` -> 預設（`true`）。
- 這同時套用於允許清單群組與開放群組模式。
- 引用 bot 訊息會算作群組啟用的隱含提及。
- 已授權的控制指令（例如 `/new`）可以略過提及門檻。
- 當群組訊息因需要提及而被略過時，OpenClaw 會將其儲存為待處理群組歷史，並在下一則處理的群組訊息中包含它。
- 群組歷史限制預設為 `messages.groupChat.historyLimit`（後備值 `50`）。你可以使用 `channels.zalouser.historyLimit` 針對每個帳號覆寫。

範例：

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## 多帳號

帳號會對應到 OpenClaw 狀態中的 `zalouser` 設定檔。範例：

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

Zalo Personal 外掛也可以從環境變數讀取設定檔選擇：

- `ZALOUSER_PROFILE`：當頻道或帳號設定中未設定 `profile` 時使用的設定檔名稱。
- `ZCA_PROFILE`：舊版後備設定檔名稱，僅在未設定 `ZALOUSER_PROFILE` 時使用。

設定檔名稱會選取 OpenClaw 狀態中儲存的 Zalo 登入憑證。解析順序為：

1. 設定中的明確 `profile`。
2. `ZALOUSER_PROFILE`。
3. `ZCA_PROFILE`。
4. 非預設帳號使用帳號 id，或預設帳號使用 `default`。

對於多帳號設定，建議在設定中為每個帳號設定 `profile`，避免
單一環境變數讓多個帳號共用同一個登入
工作階段。

## 輸入中、反應與送達確認

- OpenClaw 會在派送回覆前傳送輸入中事件（盡力而為）。
- 頻道動作中，`zalouser` 支援訊息反應動作 `react`。
  - 使用 `remove: true` 從訊息移除特定反應 emoji。
  - 反應語意：[反應](/zh-TW/tools/reactions)
- 對於包含事件中繼資料的傳入訊息，OpenClaw 會傳送已送達 + 已讀確認（盡力而為）。

## 疑難排解

**登入無法保存：**

- `openclaw channels status --probe`
- 重新登入：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允許清單/群組名稱未解析：**

- 在 `allowFrom`/`groupAllowFrom` 中使用數字 ID，並在 `groups` 中使用穩定群組 ID。如果你有意需要精確的好友/群組名稱，請啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**從舊的命令列介面式設定升級：**

- 移除任何舊的外部 `zca` 程序假設。
- 此頻道現在完全在 OpenClaw 中執行，不需要外部命令列介面二進位檔。

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
