---
read_when:
    - 為 OpenClaw 設定 Zalo Personal
    - 偵錯 Zalo Personal 登入或訊息流程
summary: 透過原生 zca-js（QR 登入）支援 Zalo 個人帳號、功能與設定
title: Zalo 個人版
x-i18n:
    generated_at: "2026-05-10T19:23:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

狀態：實驗性。此整合會在 OpenClaw 內透過原生 `zca-js` 自動化**個人 Zalo 帳號**。

<Warning>
這是非官方整合，可能導致帳號遭停權或封鎖。使用風險自負。
</Warning>

## 內建 Plugin

Zalo Personal 在目前的 OpenClaw 版本中以內建 Plugin 提供，因此一般
封裝建置不需要另外安裝。

如果你使用較舊的建置，或自訂安裝排除了 Zalo Personal，
請直接安裝 npm 套件：

- 透過 CLI 安裝：`openclaw plugins install @openclaw/zalouser`
- 固定版本：`openclaw plugins install @openclaw/zalouser@2026.5.2`
- 或從原始碼 checkout 安裝：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細資訊：[Plugins](/zh-TW/tools/plugin)

不需要外部 `zca`/`openzca` CLI 二進位檔。

## 快速設定（初學者）

1. 確認 Zalo Personal Plugin 可用。
   - 目前封裝的 OpenClaw 版本已經內建它。
   - 較舊/自訂安裝可以使用上方命令手動加入。
2. 登入（QR，在 Gateway 機器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 行動應用程式掃描 QR 碼。
3. 啟用 channel：

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

4. 重新啟動 Gateway（或完成設定）。
5. DM 存取預設為配對；在首次聯絡時核准配對碼。

## 這是什麼

- 完全透過 `zca-js` 在處理程序內執行。
- 使用原生事件監聽器接收傳入訊息。
- 直接透過 JS API 傳送回覆（文字/媒體/連結）。
- 專為無法使用 Zalo Bot API 的「個人帳號」使用情境設計。

## 命名

Channel id 是 `zalouser`，明確表示這會自動化**個人 Zalo 使用者帳號**（非官方）。我們保留 `zalo` 給未來可能的官方 Zalo API 整合。

## 尋找 ID（目錄）

使用目錄 CLI 探索對象/群組及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 傳出文字會切分為約 2000 個字元（Zalo 用戶端限制）。
- 預設會封鎖串流。

## 存取控制（DM）

`channels.zalouser.dmPolicy` 支援：`pairing | allowlist | open | disabled`（預設：`pairing`）。

`channels.zalouser.allowFrom` 應使用穩定的 Zalo 使用者 ID。它也可以參照靜態寄件者存取群組（`accessGroup:<name>`）。在互動式設定期間，輸入的名稱可以使用 Plugin 的處理程序內聯絡人查找解析為 ID。

如果原始名稱仍留在設定中，啟動時只會在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時解析它。若沒有該明確選擇，執行階段寄件者檢查僅使用 ID，並會忽略原始名稱進行授權。

透過以下方式核准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群組存取（選用）

- 預設：`channels.zalouser.groupPolicy = "open"`（允許群組）。未設定時，可使用 `channels.defaults.groupPolicy` 覆寫預設值。
- 使用以下方式限制為允許清單：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（key 應為穩定群組 ID；只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，名稱才會在啟動時解析為 ID）
  - `channels.zalouser.groupAllowFrom`（控制允許群組中哪些寄件者可以觸發 bot；靜態寄件者存取群組可用 `accessGroup:<name>` 參照）
- 封鎖所有群組：`channels.zalouser.groupPolicy = "disabled"`。
- 設定精靈可以提示輸入群組允許清單。
- 啟動時，OpenClaw 只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，才會將允許清單中的群組/使用者名稱解析為 ID 並記錄對應關係。
- 群組允許清單比對預設僅使用 ID。除非啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否則未解析名稱會在授權時被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一種應急相容模式，會重新啟用可變的啟動名稱解析與執行階段群組名稱比對。
- 如果未設定 `groupAllowFrom`，執行階段會退回使用 `allowFrom` 進行群組寄件者檢查。
- 寄件者檢查會套用於一般群組訊息與控制命令（例如 `/new`）。

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
- 這同時適用於允許清單群組與開放群組模式。
- 引用 bot 訊息會視為群組啟用的隱含提及。
- 已授權的控制命令（例如 `/new`）可以略過提及門檻。
- 當群組訊息因需要提及而被略過時，OpenClaw 會將它儲存為待處理群組歷史，並在下一則處理的群組訊息中包含它。
- 群組歷史限制預設為 `messages.groupChat.historyLimit`（fallback `50`）。你可以使用 `channels.zalouser.historyLimit` 覆寫每個帳號的設定。

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

帳號會對應到 OpenClaw state 中的 `zalouser` profile。範例：

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

## 輸入中、反應與送達確認

- OpenClaw 會在分派回覆前傳送輸入中事件（盡力而為）。
- Message reaction action `react` 支援 channel actions 中的 `zalouser`。
  - 使用 `remove: true` 從訊息移除特定 reaction emoji。
  - 反應語意：[Reactions](/zh-TW/tools/reactions)
- 對於包含事件 metadata 的傳入訊息，OpenClaw 會傳送 delivered + seen acknowledgements（盡力而為）。

## 疑難排解

**登入沒有保存：**

- `openclaw channels status --probe`
- 重新登入：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允許清單/群組名稱未解析：**

- 在 `allowFrom`/`groupAllowFrom` 中使用數字 ID，並在 `groups` 中使用穩定群組 ID。如果你有意需要精確朋友/群組名稱，請啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**從舊的 CLI 型設定升級：**

- 移除任何舊的外部 `zca` 處理程序假設。
- 此 channel 現在完全在 OpenClaw 中執行，不需要外部 CLI 二進位檔。

## 相關

- [Channels Overview](/zh-TW/channels) — 所有支援的 channel
- [Pairing](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [Groups](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [Channel Routing](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [Security](/zh-TW/gateway/security) — 存取模型與強化
