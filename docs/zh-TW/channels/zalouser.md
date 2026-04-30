---
read_when:
    - 為 OpenClaw 設定 Zalo Personal
    - 偵錯 Zalo Personal 登入或訊息流程
summary: 透過原生 zca-js（QR 登入）提供 Zalo 個人帳號支援、功能與設定
title: Zalo 個人版
x-i18n:
    generated_at: "2026-04-30T02:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

狀態：實驗性。此整合透過 OpenClaw 內的原生 `zca-js` 自動化一個**個人 Zalo 帳號**。

<Warning>
這是非官方整合，可能導致帳號遭停權或封鎖。請自行承擔使用風險。
</Warning>

## 內建 Plugin

Zalo Personal 在目前的 OpenClaw 發行版本中作為內建 Plugin 隨附，因此一般
封裝建置不需要另外安裝。

如果你使用的是較舊的建置，或是不包含 Zalo Personal 的自訂安裝，
請在有發布時安裝目前的 npm 套件：

- 透過 CLI 安裝：`openclaw plugins install @openclaw/zalouser`
- 或從原始碼 checkout 安裝：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細資訊：[Plugins](/zh-TW/tools/plugin)

如果 npm 回報 OpenClaw 擁有的套件已棄用，請使用目前封裝的
OpenClaw 建置，或使用本機 checkout 路徑，直到較新的 npm 套件
發布為止。

不需要外部 `zca`/`openzca` CLI 二進位檔。

## 快速設定（初學者）

1. 確認 Zalo Personal Plugin 可用。
   - 目前封裝的 OpenClaw 發行版本已內建。
   - 較舊/自訂安裝可使用上述命令手動加入。
2. 登入（QR，在 Gateway 機器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 行動應用程式掃描 QR code。
3. 啟用通道：

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
5. DM 存取預設使用配對；首次聯絡時核准配對碼。

## 它是什麼

- 完全透過 `zca-js` 在程序內執行。
- 使用原生事件監聽器接收傳入訊息。
- 直接透過 JS API 傳送回覆（文字/媒體/連結）。
- 專為無法使用 Zalo Bot API 的「個人帳號」使用情境設計。

## 命名

通道 id 是 `zalouser`，以明確表示這會自動化一個**個人 Zalo 使用者帳號**（非官方）。我們保留 `zalo` 給未來可能的官方 Zalo API 整合。

## 尋找 ID（目錄）

使用目錄 CLI 探索對象/群組及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 傳出文字會分段為約 2000 個字元（Zalo 用戶端限制）。
- 預設封鎖串流。

## 存取控制（DM）

`channels.zalouser.dmPolicy` 支援：`pairing | allowlist | open | disabled`（預設：`pairing`）。

`channels.zalouser.allowFrom` 接受使用者 ID 或名稱。設定期間，名稱會使用 Plugin 的程序內聯絡人查找解析為 ID。

透過以下命令核准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群組存取（選用）

- 預設：`channels.zalouser.groupPolicy = "open"`（允許群組）。未設定時，使用 `channels.defaults.groupPolicy` 覆寫預設值。
- 使用以下設定限制為允許清單：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（key 應為穩定的群組 ID；啟動時會在可能情況下將名稱解析為 ID）
  - `channels.zalouser.groupAllowFrom`（控制允許群組中的哪些傳送者可以觸發 bot）
- 封鎖所有群組：`channels.zalouser.groupPolicy = "disabled"`。
- 設定精靈可以提示輸入群組允許清單。
- 啟動時，OpenClaw 會將允許清單中的群組/使用者名稱解析為 ID，並記錄對應關係。
- 群組允許清單比對預設僅使用 ID。除非啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`，否則未解析的名稱會在驗證時被忽略。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是一種緊急相容模式，會重新啟用可變的群組名稱比對。
- 如果未設定 `groupAllowFrom`，執行階段會退回使用 `allowFrom` 進行群組傳送者檢查。
- 傳送者檢查同時套用於一般群組訊息和控制命令（例如 `/new`）。

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

### 群組提及閘控

- `channels.zalouser.groups.<group>.requireMention` 控制群組回覆是否需要提及。
- 解析順序：精確群組 id/名稱 -> 正規化群組 slug -> `*` -> 預設（`true`）。
- 這同時套用於允許清單群組和開放群組模式。
- 引用 bot 訊息會算作群組啟用的隱含提及。
- 已授權的控制命令（例如 `/new`）可以略過提及閘控。
- 當群組訊息因需要提及而被略過時，OpenClaw 會將它儲存為待處理群組歷史，並在下一則已處理的群組訊息中包含它。
- 群組歷史限制預設為 `messages.groupChat.historyLimit`（備援 `50`）。你可以使用 `channels.zalouser.historyLimit` 依帳號覆寫。

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

## 輸入狀態、反應與送達確認

- OpenClaw 會在送出回覆前傳送輸入中事件（盡力而為）。
- 訊息反應動作 `react` 在通道動作中支援 `zalouser`。
  - 使用 `remove: true` 從訊息移除特定反應 emoji。
  - 反應語意：[Reactions](/zh-TW/tools/reactions)
- 對於包含事件中繼資料的傳入訊息，OpenClaw 會傳送已送達 + 已讀確認（盡力而為）。

## 疑難排解

**登入無法保留：**

- `openclaw channels status --probe`
- 重新登入：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**允許清單/群組名稱未解析：**

- 在 `allowFrom`/`groupAllowFrom`/`groups` 中使用數字 ID，或使用精確的朋友/群組名稱。

**從舊的 CLI 架構設定升級：**

- 移除任何舊的外部 `zca` 程序假設。
- 通道現在完全在 OpenClaw 中執行，不需要外部 CLI 二進位檔。

## 相關

- [通道概覽](/zh-TW/channels) — 所有支援的通道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
