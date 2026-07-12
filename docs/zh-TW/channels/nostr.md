---
read_when:
    - 你想要讓 OpenClaw 透過 Nostr 接收私訊
    - 你正在設定去中心化通訊
summary: 透過 NIP-04 加密訊息的 Nostr 私訊頻道
title: Nostr
x-i18n:
    generated_at: "2026-07-11T21:09:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr 是一個可下載的頻道外掛（`@openclaw/nostr`），讓 OpenClaw 能透過 Nostr 中繼站接收並回覆使用 NIP-04 加密的私訊。每個閘道限用一個帳號；僅支援私訊。

## 安裝

```bash
openclaw plugins install @openclaw/nostr
```

使用不含版本的套件規格，以跟隨目前的官方發布標籤。只有在需要可重現的安裝時，才固定使用確切版本。

從本機簽出的程式碼安裝（開發工作流程）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安裝或啟用外掛後，請重新啟動閘道。安裝外掛後，新手引導（`openclaw onboard`）和 `openclaw channels add` 會從共用頻道目錄中顯示 Nostr。

### 非互動式設定

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 可將 `NOSTR_PRIVATE_KEY` 保留在環境中，而不是把金鑰儲存在設定裡（僅適用於預設帳號）。

## 快速設定

1. 產生 Nostr 金鑰組（如有需要）：

```bash
# 使用 nak
nak key generate
```

2. 新增至設定：

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
| `privateKey` | 字串     | 必填                                        | `nsec` 或十六進位格式的私密金鑰；允許密鑰參照   |
| `relays`     | 字串陣列 | `['wss://relay.damus.io', 'wss://nos.lol']` | 中繼站 URL（WebSocket）                          |
| `dmPolicy`   | 字串     | `pairing`                                   | 私訊存取政策                                     |
| `allowFrom`  | 字串陣列 | `[]`                                        | 允許的傳送者公開金鑰                             |
| `enabled`    | 布林值   | `true`                                      | 啟用／停用頻道                                   |
| `name`       | 字串     | -                                           | 顯示名稱                                         |
| `profile`    | 物件     | -                                           | NIP-01 個人資料中繼資料                          |

## 個人資料中繼資料

個人資料會以 NIP-01 `kind:0` 事件發布。你可以在控制介面（頻道 -> Nostr -> 個人資料）中管理，也可以直接在設定中指定。

範例：

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "個人助理私訊機器人",
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

- 個人資料 URL 必須使用 `https://`。
- 從中繼站匯入時會合併欄位，並保留本機覆寫值。

## 存取控制

### 私訊政策

- **配對**（預設）：未知傳送者會收到配對碼。
- **允許清單**：只有 `allowFrom` 中的公開金鑰可以傳送私訊。
- **開放**：公開接收入站私訊（需要 `allowFrom: ["*"]`）。
- **停用**：忽略入站私訊。

強制執行注意事項：

- 在套用傳送者政策及進行 NIP-04 解密前，會先驗證入站事件的簽章，因此偽造事件會提早遭到拒絕。
- 傳送配對回覆時，不會解密或處理原始私訊內容。
- 入站私訊設有速率限制（全域及個別傳送者），而過大的承載資料會在解密前遭到捨棄。

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

- **私密金鑰：** `nsec...` 或 64 字元十六進位字串
- **公開金鑰（`allowFrom`）：** `npub...` 或十六進位字串

## 中繼站

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

- 使用 2 至 3 個中繼站以提供備援。
- 避免使用過多中繼站（會增加延遲和重複訊息）。
- 付費中繼站可提高可靠性。
- 本機中繼站適合用於測試（`ws://localhost:7777`）。

## 通訊協定支援

| NIP    | 狀態     | 說明                              |
| ------ | -------- | --------------------------------- |
| NIP-01 | 已支援   | 基本事件格式和個人資料中繼資料    |
| NIP-04 | 已支援   | 加密私訊（`kind:4`）              |
| NIP-17 | 規劃中   | 禮物包裝式私訊                    |
| NIP-44 | 規劃中   | 版本化加密                        |

## 測試

### 本機中繼站

```bash
# 啟動 strfry
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

1. 從閘道記錄或 `openclaw channels status` 記下機器人的公開金鑰（十六進位格式；如有需要，請在用戶端中轉換為 npub）。
2. 開啟 Nostr 用戶端（Amethyst、Damus 等）。
3. 傳送私訊給機器人的公開金鑰。
4. 驗證回覆。

## 疑難排解

### 未收到訊息

- 驗證私密金鑰有效。
- 確認中繼站 URL 可連線，並使用 `wss://`（本機則使用 `ws://`）。
- 確認 `enabled` 不是 `false`。
- 檢查閘道記錄中是否有中繼站連線錯誤。

### 未傳送回覆

- 檢查中繼站是否接受寫入。
- 驗證對外連線能力。
- 留意中繼站速率限制。

### 重複回覆

- 使用多個中繼站時，這是預期行為。
- 訊息會依事件 ID 去除重複項目；只有第一次送達會觸發回覆。

## 安全性

- 絕對不要提交私密金鑰。
- 使用環境變數儲存金鑰。
- 正式環境機器人可考慮使用 `allowlist`。
- 在套用傳送者政策前會先驗證簽章，且在解密前會強制執行傳送者政策，因此偽造事件會提早遭到拒絕，未知傳送者也無法強迫系統執行完整的密碼學運算。

## 限制（最小可行產品）

- 僅支援私訊（不支援群組聊天）。
- 不支援媒體附件。
- 僅支援 NIP-04（已規劃支援 NIP-17 禮物包裝）。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與安全強化
