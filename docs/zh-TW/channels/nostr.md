---
read_when:
    - 你想讓 OpenClaw 透過 Nostr 接收私訊
    - 你正在設定去中心化訊息傳遞
summary: 透過 NIP-04 加密訊息的 Nostr DM 頻道
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
    postprocess_version: locale-links-v1
---

**狀態：** 選用的隨附 Plugin（預設停用，直到完成設定）。

Nostr 是用於社群網路的去中心化協定。此通道讓 OpenClaw 能夠透過 NIP-04 接收並回覆加密的直接訊息（DM）。

## 隨附 Plugin

目前的 OpenClaw 版本會將 Nostr 作為隨附 Plugin 出貨，因此一般封裝
建置不需要另行安裝。

### 舊版／自訂安裝

- Onboarding（`openclaw onboard`）和 `openclaw channels add` 仍會從共用通道目錄中顯示
  Nostr。
- 如果你的建置排除了隨附的 Nostr，請直接安裝 npm 套件。

```bash
openclaw plugins install @openclaw/nostr
```

使用裸套件以跟隨目前的官方發行標籤。只有在需要可重現安裝時，才釘選精確
版本。

使用本機 checkout（開發工作流程）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安裝或啟用 Plugin 後，請重新啟動 Gateway。

### 非互動式設定

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 將 `NOSTR_PRIVATE_KEY` 保留在環境中，而不是把金鑰儲存在設定內。

## 快速設定

1. 產生 Nostr 金鑰對（如有需要）：

```bash
# Using nak
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

4. 重新啟動 Gateway。

## 設定參考

| 鍵           | 類型     | 預設值                                      | 說明                              |
| ------------ | -------- | ------------------------------------------- | --------------------------------- |
| `privateKey` | string   | required                                    | `nsec` 或十六進位格式的私鑰      |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL（WebSocket）            |
| `dmPolicy`   | string   | `pairing`                                   | DM 存取政策                       |
| `allowFrom`  | string[] | `[]`                                        | 允許的傳送者公鑰                  |
| `enabled`    | boolean  | `true`                                      | 啟用／停用通道                    |
| `name`       | string   | -                                           | 顯示名稱                          |
| `profile`    | object   | -                                           | NIP-01 個人檔案中繼資料           |

## 個人檔案中繼資料

個人檔案資料會作為 NIP-01 `kind:0` 事件發布。你可以從 Control UI（Channels -> Nostr -> Profile）管理，或直接在設定中指定。

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
- **allowlist**：只有 `allowFrom` 中的公鑰可以傳送 DM。
- **open**：公開傳入 DM（需要 `allowFrom: ["*"]`）。
- **disabled**：忽略傳入 DM。

執行注意事項：

- 傳入事件簽章會在寄件者政策和 NIP-04 解密之前驗證，因此偽造事件會及早遭到拒絕。
- 配對回覆會在不處理原始私訊內文的情況下送出。
- 傳入私訊會受到速率限制，過大的酬載會在解密前被丟棄。

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
- **公開金鑰 (`allowFrom`)：** `npub...` 或十六進位

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

- 使用 2-3 個中繼站以提供冗餘。
- 避免使用過多中繼站（延遲、重複）。
- 付費中繼站可以提升可靠性。
- 本機中繼站適合用於測試 (`ws://localhost:7777`)。

## 協定支援

| NIP    | 狀態      | 說明                                  |
| ------ | --------- | ------------------------------------- |
| NIP-01 | 已支援    | 基本事件格式 + 個人檔案中繼資料      |
| NIP-04 | 已支援    | 加密私訊 (`kind:4`)                   |
| NIP-17 | 已規劃    | 禮物包裝私訊                          |
| NIP-44 | 已規劃    | 版本化加密                            |

## 測試

### 本機中繼站

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

1. 從日誌記下機器人的公開金鑰 (npub)。
2. 開啟 Nostr 用戶端（Damus、Amethyst 等）。
3. 向機器人的公開金鑰傳送私訊。
4. 驗證回應。

## 疑難排解

### 未收到訊息

- 驗證私密金鑰有效。
- 確認中繼站 URL 可連線並使用 `wss://`（本機則使用 `ws://`）。
- 確認 `enabled` 不是 `false`。
- 檢查 Gateway 日誌中的中繼站連線錯誤。

### 未傳送回應

- 檢查中繼站是否接受寫入。
- 驗證對外連線能力。
- 留意中繼站速率限制。

### 重複回應

- 使用多個中繼站時屬於預期行為。
- 訊息會依事件 ID 去重；只有第一次遞送會觸發回應。

## 安全性

- 絕不要提交私密金鑰。
- 使用環境變數存放金鑰。
- 生產環境機器人可考慮使用 `allowlist`。
- 簽章會在寄件者政策之前驗證，而寄件者政策會在解密之前執行，因此偽造事件會及早遭到拒絕，未知寄件者也無法強制執行完整加密作業。

## 限制 (MVP)

- 僅支援直接訊息（不支援群組聊天）。
- 不支援媒體附件。
- 僅支援 NIP-04（已規劃 NIP-17 禮物包裝）。

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
