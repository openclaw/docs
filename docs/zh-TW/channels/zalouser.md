---
read_when:
    - 為 OpenClaw 設定 Zalo Personal
    - 偵錯 Zalo Personal 登入或訊息流程
summary: 透過原生 zca-js（QR 登入）支援 Zalo 個人帳號、功能與設定
title: Zalo 個人版
x-i18n:
    generated_at: "2026-05-04T18:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

狀態：實驗性。此整合透過 OpenClaw 內部的原生 `zca-js` 自動化一個**個人 Zalo 帳號**。

<Warning>
這是非官方整合，可能導致帳號遭停權或封鎖。請自行承擔使用風險。
</Warning>

## 捆綁的 Plugin

Zalo Personal 以捆綁 Plugin 的形式隨目前的 OpenClaw 版本提供，因此一般封裝建置不需要另外安裝。

如果你使用的是較舊的建置，或自訂安裝排除了 Zalo Personal，請直接安裝 npm 套件：

- 透過 CLI 安裝：`openclaw plugins install @openclaw/zalouser`
- 指定版本：`openclaw plugins install @openclaw/zalouser@2026.5.2`
- 或從原始碼 checkout 安裝：`openclaw plugins install ./path/to/local/zalouser-plugin`
- 詳細資料：[Plugins](/zh-TW/tools/plugin)

不需要外部 `zca`/`openzca` CLI 二進位檔。

## 快速設定（初學者）

1. 確認 Zalo Personal Plugin 可用。
   - 目前封裝的 OpenClaw 發行版本已經內建它。
   - 較舊或自訂安裝可使用上述命令手動加入。
2. 登入（QR，在 Gateway 機器上）：
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

4. 重新啟動 Gateway（或完成設定）。
5. DM 存取預設為配對；首次聯絡時核准配對碼。

## 它是什麼

- 完全透過 `zca-js` 在程序內執行。
- 使用原生事件監聽器接收傳入訊息。
- 透過 JS API 直接傳送回覆（文字/媒體/連結）。
- 設計給 Zalo Bot API 無法使用時的「個人帳號」使用情境。

## 命名

頻道 id 是 `zalouser`，用來明確表示這會自動化一個**個人 Zalo 使用者帳號**（非官方）。我們保留 `zalo` 給未來可能的官方 Zalo API 整合。

## 尋找 ID（目錄）

使用目錄 CLI 探索對等對象/群組及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制

- 傳出文字會分段為約 2000 個字元（Zalo 用戶端限制）。
- 預設會封鎖串流。

## 存取控制（DM）

`channels.zalouser.dmPolicy` 支援：`pairing | allowlist | open | disabled`（預設：`pairing`）。

`channels.zalouser.allowFrom` 應使用穩定的 Zalo 使用者 ID。在互動式設定期間，輸入的名稱可以使用 Plugin 的程序內聯絡人查找解析為 ID。

如果原始名稱仍留在設定中，啟動時只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時才會解析它。若沒有該選擇加入，執行階段的傳送者檢查只使用 ID，原始名稱會被忽略，不會用於授權。

透過以下命令核准：

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群組存取（選用）

- 預設：`channels.zalouser.groupPolicy = "open"`（允許群組）。未設定時，使用 `channels.defaults.groupPolicy` 覆寫預設值。
- 使用以下設定限制為 allowlist：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（鍵應為穩定的群組 ID；只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，啟動時才會將名稱解析為 ID）
  - `channels.zalouser.groupAllowFrom`（控制允許群組中的哪些傳送者可以觸發 bot）
- 封鎖所有群組：`channels.zalouser.groupPolicy = "disabled"`。
- 設定精靈可以提示輸入群組 allowlist。
- 啟動時，OpenClaw 只有在啟用 `channels.zalouser.dangerouslyAllowNameMatching: true` 時，才會將 allowlist 中的群組/使用者名稱解析為 ID 並記錄對應關係。
- 群組 allowlist 比對預設只使用 ID。未解析的名稱會被忽略，不會用於授權，除非啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`。
- `channels.zalouser.dangerouslyAllowNameMatching: true` 是緊急相容模式，會重新啟用可變的啟動名稱解析與執行階段群組名稱比對。
- 如果未設定 `groupAllowFrom`，執行階段會回退使用 `allowFrom` 進行群組傳送者檢查。
- 傳送者檢查同時適用於一般群組訊息和控制命令（例如 `/new`）。

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
- 解析順序：精確群組 id/name -> 正規化群組 slug -> `*` -> 預設值（`true`）。
- 這同時適用於 allowlist 群組和開放群組模式。
- 引用 bot 訊息會算作群組啟用的隱含提及。
- 已授權的控制命令（例如 `/new`）可以略過提及閘控。
- 當群組訊息因需要提及而被略過時，OpenClaw 會將其儲存為待處理的群組歷史，並在下一則已處理的群組訊息中包含它。
- 群組歷史限制預設為 `messages.groupChat.historyLimit`（後備值 `50`）。你可以使用 `channels.zalouser.historyLimit` 為每個帳號覆寫。

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

## 輸入中、回應和送達確認

- OpenClaw 會在分派回覆前傳送輸入中事件（盡力而為）。
- 頻道動作中，`zalouser` 支援訊息回應動作 `react`。
  - 使用 `remove: true` 從訊息中移除特定回應 emoji。
  - 回應語意：[Reactions](/zh-TW/tools/reactions)
- 對於包含事件中繼資料的傳入訊息，OpenClaw 會傳送已送達 + 已讀確認（盡力而為）。

## 疑難排解

**登入無法保留：**

- `openclaw channels status --probe`
- 重新登入：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/群組名稱未解析：**

- 在 `allowFrom`/`groupAllowFrom` 中使用數字 ID，並在 `groups` 中使用穩定的群組 ID。如果你刻意需要精確好友/群組名稱，請啟用 `channels.zalouser.dangerouslyAllowNameMatching: true`。

**從舊的 CLI 型設定升級：**

- 移除任何舊的外部 `zca` 程序假設。
- 此頻道現在完全在 OpenClaw 中執行，不需要外部 CLI 二進位檔。

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [Pairing](/zh-TW/channels/pairing) — DM 驗證和配對流程
- [Groups](/zh-TW/channels/groups) — 群組聊天行為和提及閘控
- [Channel Routing](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [Security](/zh-TW/gateway/security) — 存取模型和強化
