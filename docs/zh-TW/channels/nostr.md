---
read_when:
    - 你想要 OpenClaw 透過 Nostr 接收私訊
    - 你正在設定去中心化訊息傳遞
summary: 透過 NIP-04 加密訊息的 Nostr 私訊通道
title: Nostr
x-i18n:
    generated_at: "2026-07-05T11:05:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr 是可下載的頻道外掛（`@openclaw/nostr`），讓 OpenClaw 能透過 Nostr 中繼接收並回覆 NIP-04 加密的直接訊息。每個閘道一個帳號；僅限 DM。

## 安裝

```bash
openclaw plugins install @openclaw/nostr
```

使用裸套件規格以跟隨目前的官方發行標籤。只有在需要可重現安裝時，才釘選精確版本。

從本機 checkout（開發工作流程）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安裝或啟用外掛後，請重新啟動閘道。安裝外掛後，Onboarding（`openclaw onboard`）和 `openclaw channels add` 會從共用頻道目錄顯示 Nostr。

### 非互動式設定

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 將 `NOSTR_PRIVATE_KEY` 保留在環境中，而不是將金鑰儲存在設定中（僅預設帳號）。

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

4. 重新啟動閘道。

## 設定參考

| 鍵           | 類型     | 預設值                                      | 說明                                             |
| ------------ | -------- | ------------------------------------------- | ------------------------------------------------ |
| `privateKey` | string   | 必填                                        | `nsec` 或十六進位格式的私鑰；允許秘密參照       |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 中繼 URL（WebSocket）                            |
| `dmPolicy`   | string   | `pairing`                                   | DM 存取政策                                     |
| `allowFrom`  | string[] | `[]`                                        | 允許的寄件者 pubkey                             |
| `enabled`    | boolean  | `true`                                      | 啟用/停用頻道                                   |
| `name`       | string   | -                                           | 顯示名稱                                         |
| `profile`    | object   | -                                           | NIP-01 個人檔案中繼資料                         |

## 個人檔案中繼資料

個人檔案資料會以 NIP-01 `kind:0` 事件發布。你可以從控制介面（Channels -> Nostr -> Profile）管理，或直接在設定中設定。

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
- 從中繼匯入時會合併欄位並保留本機覆寫。

## 存取控制

### DM 政策

- **pairing**（預設）：未知寄件者會收到配對碼。
- **allowlist**：只有 `allowFrom` 中的 pubkey 可以傳送 DM。
- **open**：公開傳入 DM（需要 `allowFrom: ["*"]`）。
- **disabled**：忽略傳入 DM。

執行注意事項：

- 傳入事件簽章會在寄件者政策和 NIP-04 解密前驗證，因此偽造事件會提早遭到拒絕。
- 配對回覆會在不解密或處理原始 DM 內文的情況下傳送。
- 傳入 DM 會套用速率限制（全域與每位寄件者），過大的酬載會在解密前被丟棄。

### Allowlist 範例

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

- **私鑰：** `nsec...` 或 64 字元十六進位
- **Pubkey（`allowFrom`）：** `npub...` 或十六進位

## 中繼

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

- 使用 2-3 個中繼以提供備援。
- 避免使用過多中繼（延遲、重複）。
- 付費中繼可以提升可靠性。
- 本機中繼適合測試（`ws://localhost:7777`）。

## 協定支援

| NIP    | 狀態 | 說明                             |
| ------ | ---- | -------------------------------- |
| NIP-01 | 支援 | 基本事件格式 + 個人檔案中繼資料 |
| NIP-04 | 支援 | 加密 DM（`kind:4`）              |
| NIP-17 | 已規劃 | 禮物包裝式 DM                    |
| NIP-44 | 已規劃 | 版本化加密                       |

## 測試

### 本機中繼

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

1. 從閘道記錄或 `openclaw channels status` 記下 bot pubkey（十六進位；如有需要，在你的用戶端轉換為 npub）。
2. 開啟 Nostr 用戶端（Amethyst、Damus 等）。
3. 將 DM 傳送給 bot pubkey。
4. 驗證回應。

## 疑難排解

### 未收到訊息

- 驗證私鑰有效。
- 確保中繼 URL 可連線並使用 `wss://`（或本機使用 `ws://`）。
- 確認 `enabled` 不是 `false`。
- 檢查閘道記錄中的中繼連線錯誤。

### 未傳送回應

- 檢查中繼是否接受寫入。
- 驗證對外連線能力。
- 留意中繼速率限制。

### 重複回應

- 使用多個中繼時屬於預期情況。
- 訊息會依事件 ID 去重；只有第一次傳遞會觸發回應。

## 安全性

- 切勿提交私鑰。
- 對金鑰使用環境變數。
- 生產 bot 建議使用 `allowlist`。
- 簽章會在寄件者政策前驗證，且寄件者政策會在解密前強制執行，因此偽造事件會提早遭到拒絕，未知寄件者也無法強制執行完整加密運算。

## 限制（MVP）

- 僅直接訊息（不支援群組聊天）。
- 不支援媒體附件。
- 僅 NIP-04（已規劃 NIP-17 gift-wrap）。

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
