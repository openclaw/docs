---
read_when:
    - 你想讓 OpenClaw 透過 Nostr 接收私訊
    - 你正在設定去中心化訊息傳遞
summary: 透過 NIP-04 加密訊息的 Nostr 私訊通道
title: Nostr
x-i18n:
    generated_at: "2026-04-30T02:48:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**狀態：** 選用隨附 Plugin（設定前預設停用）。

Nostr 是用於社群網路的去中心化通訊協定。此頻道讓 OpenClaw 能透過 NIP-04 接收並回覆加密直接訊息（DM）。

## 隨附 Plugin

目前的 OpenClaw 版本將 Nostr 作為隨附 Plugin 發佈，因此一般封裝建置
不需要另外安裝。

### 較舊/自訂安裝

- Onboarding (`openclaw onboard`) 和 `openclaw channels add` 仍會從共用頻道目錄
  顯示 Nostr。
- 如果你的建置排除了隨附的 Nostr，請在目前的 npm 套件發佈後安裝。

```bash
openclaw plugins install @openclaw/nostr
```

如果 npm 回報 OpenClaw 擁有的套件已棄用，請使用目前封裝的
OpenClaw 建置，或在較新的 npm 套件發佈前使用本機 checkout。

使用本機 checkout（開發工作流程）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安裝或啟用 Plugin 後重新啟動 Gateway。

### 非互動式設定

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 將 `NOSTR_PRIVATE_KEY` 保留在環境中，而不是將金鑰儲存在設定裡。

## 快速設定

1. 產生 Nostr 金鑰組（如有需要）：

```bash
# Using nak
nak key generate
```

2. 加入設定：

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. 匯出金鑰：

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. 重新啟動 Gateway。

## 設定參考

| 鍵           | 類型     | 預設值                                      | 說明                                  |
| ------------ | -------- | ------------------------------------------- | ------------------------------------- |
| `privateKey` | string   | 必填                                        | `nsec` 或十六進位格式的私密金鑰       |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL（WebSocket）                |
| `dmPolicy`   | string   | `pairing`                                   | DM 存取政策                           |
| `allowFrom`  | string[] | `[]`                                        | 允許的傳送者 pubkey                   |
| `enabled`    | boolean  | `true`                                      | 啟用/停用頻道                         |
| `name`       | string   | -                                           | 顯示名稱                              |
| `profile`    | object   | -                                           | NIP-01 個人檔案中繼資料               |

## 個人檔案中繼資料

個人檔案資料會作為 NIP-01 `kind:0` 事件發佈。你可以從 Control UI（Channels -> Nostr -> Profile）管理，或直接在設定中指定。

範例：

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

注意事項：

- 個人檔案 URL 必須使用 `https://`。
- 從 relay 匯入會合併欄位並保留本機覆寫。

## 存取控制

### DM 政策

- **pairing**（預設）：未知傳送者會收到配對碼。
- **allowlist**：只有 `allowFrom` 中的 pubkey 可以傳送 DM。
- **open**：公開傳入 DM（需要 `allowFrom: ["*"]`）。
- **disabled**：忽略傳入 DM。

強制執行注意事項：

- 傳入事件簽章會在傳送者政策和 NIP-04 解密前驗證，因此偽造事件會提早遭到拒絕。
- 配對回覆會在不處理原始 DM 內文的情況下送出。
- 傳入 DM 會受到速率限制，過大的 payload 會在解密前被丟棄。

### 允許清單範例

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## 金鑰格式

接受的格式：

- **私密金鑰：** `nsec...` 或 64 字元十六進位
- **Pubkeys (`allowFrom`)：** `npub...` 或十六進位

## Relays

預設值：`relay.damus.io` 和 `nos.lol`。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

提示：

- 使用 2-3 個 relay 以提供備援。
- 避免使用太多 relay（延遲、重複）。
- 付費 relay 可以提升可靠性。
- 本機 relay 適合測試（`ws://localhost:7777`）。

## 通訊協定支援

| NIP    | 狀態   | 說明                              |
| ------ | ------ | --------------------------------- |
| NIP-01 | 已支援 | 基本事件格式 + 個人檔案中繼資料   |
| NIP-04 | 已支援 | 加密 DM（`kind:4`）               |
| NIP-17 | 已規劃 | 禮物包裝 DM                       |
| NIP-44 | 已規劃 | 版本化加密                        |

## 測試

### 本機 relay

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 手動測試

1. 從記錄中記下 bot pubkey（npub）。
2. 開啟 Nostr 用戶端（Damus、Amethyst 等）。
3. 對 bot pubkey 傳送 DM。
4. 驗證回應。

## 疑難排解

### 未收到訊息

- 驗證私密金鑰有效。
- 確認 relay URL 可連線，且使用 `wss://`（本機則使用 `ws://`）。
- 確認 `enabled` 不是 `false`。
- 檢查 Gateway 記錄中的 relay 連線錯誤。

### 未傳送回應

- 檢查 relay 是否接受寫入。
- 驗證對外連線能力。
- 留意 relay 速率限制。

### 重複回應

- 使用多個 relay 時屬於預期情況。
- 訊息會依事件 ID 去重；只有第一次傳遞會觸發回應。

## 安全性

- 絕不要提交私密金鑰。
- 使用環境變數儲存金鑰。
- 對正式環境 bot，請考慮使用 `allowlist`。
- 簽章會在傳送者政策前驗證，且傳送者政策會在解密前強制執行，因此偽造事件會提早遭到拒絕，未知傳送者也無法強制執行完整的密碼學工作。

## 限制（MVP）

- 僅支援直接訊息（不支援群組聊天）。
- 不支援媒體附件。
- 僅支援 NIP-04（已規劃 NIP-17 gift-wrap）。

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
