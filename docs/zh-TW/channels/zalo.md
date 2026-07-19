---
read_when:
    - 開發 Zalo 功能或網路鉤子
summary: Zalo 機器人支援狀態、功能與設定
title: Zalo
x-i18n:
    generated_at: "2026-07-19T14:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f3e0bfe6003d3b2f38411fcc5a4e82266733b042693c7853d0b3c8a3864273c5
    source_path: channels/zalo.md
    workflow: 16
---

狀態：實驗性。已實作私人訊息與群組聊天；下方的[功能](#capabilities)表格反映了在 Zalo Bot Creator / Marketplace 機器人上驗證過的行為。

## 內建外掛

目前的 OpenClaw 版本已內建 Zalo 外掛，因此套件化建置不需要另外安裝。

若使用較舊的建置版本，或自訂安裝中未包含 Zalo，請直接安裝 npm 套件：

- 安裝：`openclaw plugins install @openclaw/zalo`
- 固定版本：`openclaw plugins install @openclaw/zalo@2026.6.11`
- 從本機簽出版本安裝：`openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

1. 在 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 建立機器人權杖（登入、建立機器人並進行設定）。權杖為 `numeric_id:secret`；若為 Marketplace 機器人，可用的執行階段權杖可能會出現在機器人的歡迎訊息中。
2. 設定權杖，可使用環境變數 `ZALO_BOT_TOKEN=...`（僅適用於預設帳號），或在設定檔中設定。
3. 重新啟動閘道。
4. 首次透過私人訊息聯絡時，核准配對碼（預設的私人訊息政策為配對）。

最小設定：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

多帳號：在 `channels.zalo.accounts.<id>` 下新增更多項目，每個項目各自使用自己的 `botToken`/`name`。`channels.zalo.botToken`（扁平結構，不含 `accounts`）是舊版的單帳號簡寫；新設定請優先使用 `accounts.<id>.*`。

## 這是什麼

Zalo 是一款以越南市場為主的通訊應用程式。其 Bot API 可讓閘道執行機器人，用於 1:1 對話和群組聊天，並以確定性方式將訊息路由回 Zalo（模型絕不會選擇頻道）。

本頁涵蓋 **Zalo Bot Creator / Marketplace 機器人**。**Zalo Official Account (OA) 機器人**屬於不同的產品介面，行為可能有所不同；本頁不涵蓋這類機器人。

## 運作方式

- 傳入訊息會正規化為共用頻道信封格式，並包含媒體預留位置。
- 回覆一律傳回同一個 Zalo 聊天；不使用引用回覆（`replyToMode` 固定為關閉）。
- 預設使用長輪詢（`getUpdates`）；可透過 `channels.zalo.webhookUrl` 使用網路鉤子模式。
- 群組中必須使用 @提及才會觸發機器人；此設定無法依頻道配置。

## 限制

| 限制                          | 值                                                                       |
| ----------------------------- | ------------------------------------------------------------------------ |
| 傳出文字分段大小              | 2000 個字元（Zalo API 限制）                                             |
| 媒體大小（傳入／傳出）        | `channels.zalo.mediaMaxMb`，預設為 `5` MB                         |
| 網路鉤子要求主體              | 1 MB，讀取逾時 30 秒                                                     |
| 網路鉤子速率限制              | 每個路徑與用戶端 IP 每 60 秒 120 個要求，之後回傳 HTTP 429               |
| 網路鉤子重播刪除標記          | 30 天，每個帳號最多 20,000 個已完成事件（以訊息 ID 為鍵）                |

## 存取控制

### 私訊

- `channels.zalo.dmPolicy`：`pairing`（預設）| `allowlist` | `open` | `disabled`。
- 配對：未知的傳送者會收到配對碼；在獲得核准前，訊息將被忽略。配對碼會在 1 小時後到期。
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 詳細資訊：[配對](/zh-TW/channels/pairing)
- `channels.zalo.allowFrom` 接受數字格式的 Zalo 使用者 ID（不支援使用者名稱查詢）。`open` 需要 `"*"`。

### 群組

此外掛支援群組聊天（`chatTypes: ["direct", "group"]`），並透過提及和群組政策進行管控：

- `channels.zalo.groupPolicy`：`open` | `allowlist` | `disabled`。
- `channels.zalo.groupAllowFrom` 會限制可在群組中觸發機器人的傳送者 ID；未設定時會回退至 `allowFrom`。
- 預設解析方式：設定 `channels.zalo` 後，未設定的 `groupPolicy` 會解析為 `open`。若完全缺少 `channels.zalo`，執行階段會採取封閉式失敗並設為 `allowlist`。
- 實際使用中回報的注意事項：在某些 Marketplace 機器人設定中，機器人完全無法加入群組。若遇到此情況，請檢查你的機器人在 Zalo Bot Platform 中的設定；這是平台端限制，而非 OpenClaw 政策。

## 長輪詢與網路鉤子

- 預設：長輪詢（不需要公開 URL）。
- 網路鉤子模式：設定 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - 網路鉤子 URL 必須使用 HTTPS。
  - 網路鉤子密鑰必須為 8-256 個字元。
  - Zalo 會使用 `X-Bot-Api-Secret-Token` 標頭傳送事件，並以固定時間比較進行檢查。
  - 閘道 HTTP 會在 `channels.zalo.webhookPath` 處處理網路鉤子要求（預設為網路鉤子 URL 的路徑）。
  - 要求必須使用 `Content-Type: application/json`（或 `+json` 媒體類型）。
  - 只有在原始事件已持久儲存後，才會傳回 HTTP 200；儲存失敗時會傳回 HTTP 500。
  - 根據 Zalo API 文件，每個機器人的 getUpdates 輪詢與網路鉤子互斥。

## 支援的訊息類型

- 文字：完整支援，會分割為每段 2000 個字元。
- 媒體：支援接收與傳送，上限由 `mediaMaxMb` 設定。
- 回應、討論串、投票、原生命令：此外掛不支援。
- 串流：此外掛宣告支援區塊串流，但 Zalo 沒有專用的傳出佇列或文字合併調校選項（不同於其他一些區域性頻道）；若這對你的使用案例很重要，請在你的環境中確認目前的行為。

## 功能

| 功能                     | 狀態                              |
| ------------------------ | --------------------------------- |
| 私訊                     | 支援                              |
| 群組                     | 支援（須提及才會觸發）            |
| 媒體（接收／傳送）       | 支援，上限由 `mediaMaxMb` 設定 |
| 回應                     | 不支援                            |
| 討論串                   | 不支援                            |
| 投票                     | 不支援                            |
| 原生命令                 | 不支援                            |
| 回覆／引用               | 未使用（固定關閉）                |

## 傳送目標（命令列介面／排程）

使用聊天 ID 作為目標：

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## 疑難排解

**機器人沒有回應：**

- 檢查權杖：`openclaw channels status --probe`
- 確認傳送者已獲准（透過配對或 `allowFrom`）
- 檢查閘道記錄：`openclaw logs --follow`

**網路鉤子未收到事件：**

- 確認網路鉤子 URL 使用 HTTPS
- 確認密鑰為 8-256 個字元
- 確認可透過設定的路徑連線至閘道 HTTP 端點
- 確認 getUpdates 輪詢未同時執行（兩者互斥）
- 短時間內大量要求可能會傳回 HTTP 429（每個路徑 + IP 在 60 秒內限 120 個要求）；請退避後重試

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

| 設定                                         | 說明                                              | 預設值                |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | 啟用／停用頻道啟動                                | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | 來自 Zalo Bot Platform 的機器人權杖               | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | 從檔案讀取權杖（拒絕符號連結）                    | -                     |
| `channels.zalo.accounts.<id>.name`           | 顯示名稱                                          | -                     |
| `channels.zalo.accounts.<id>.enabled`        | 啟用／停用此帳號                                  | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | 各帳號的私訊政策                                  | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | 私訊允許清單（使用者 ID）                         | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | 各帳號的群組政策                                  | 請參閱[群組](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | 群組傳送者允許清單；回退至 `allowFrom` | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 接收／傳送媒體上限（MB）                          | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | 啟用網路鉤子模式（需要 HTTPS）                    | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | 網路鉤子密鑰（8-256 個字元）                      | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | 閘道 HTTP 伺服器上的網路鉤子路徑                  | 網路鉤子 URL 路徑     |
| `channels.zalo.accounts.<id>.proxy`          | API 要求的 Proxy URL                              | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | 覆寫傳出回應前綴                                  | -                     |
| `channels.zalo.defaultAccount`               | 設定多個帳號時的預設帳號                          | `default`             |

`channels.zalo.botToken`、`channels.zalo.dmPolicy` 和其他扁平的頂層鍵，是上述欄位的舊版單一帳號簡寫；兩種形式都受支援。

環境變數選項：`ZALO_BOT_TOKEN=...` 僅解析預設帳號的權杖。

## 相關內容

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
