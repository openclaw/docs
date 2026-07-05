---
read_when:
    - 處理 Zalo 功能或網路鉤子
summary: Zalo Bot 支援狀態、功能與設定
title: Zalo
x-i18n:
    generated_at: "2026-07-05T11:05:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

狀態：實驗性。私訊和群組聊天都已實作；下方的 [功能](#capabilities) 表格反映 Zalo Bot Creator / Marketplace 機器人上已驗證的行為。

## 捆綁外掛

Zalo 以捆綁外掛形式隨目前的 OpenClaw 發行版本提供，因此打包建置不需要另外安裝。

在較舊的建置，或排除 Zalo 的自訂安裝中，請直接安裝 npm 套件：

- 安裝：`openclaw plugins install @openclaw/zalo`
- 釘選版本：`openclaw plugins install @openclaw/zalo@2026.6.11`
- 從本機 checkout：`openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細資料：[外掛](/zh-TW/tools/plugin)

## 快速設定

1. 在 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 建立機器人權杖（登入、建立機器人、設定選項）。權杖格式為 `numeric_id:secret`；對 Marketplace 機器人而言，可用的執行階段權杖可能會出現在機器人的歡迎訊息中。
2. 設定權杖，可設為環境變數 `ZALO_BOT_TOKEN=...`（僅限預設帳號）或寫入設定。
3. 重新啟動閘道。
4. 第一次私訊聯絡時核准配對碼（預設私訊政策為配對）。

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

多帳號：在 `channels.zalo.accounts.<id>` 下加入更多項目，每個項目都有自己的 `botToken`/`name`。`channels.zalo.botToken`（扁平、無 `accounts`）是舊版單帳號簡寫；新設定請優先使用 `accounts.<id>.*`。

## 這是什麼

Zalo 是聚焦越南的訊息應用程式。其 Bot API 可讓閘道為 1:1 對話和群組聊天執行機器人，並以確定性的方式路由回 Zalo（模型永遠不會選擇頻道）。

本頁涵蓋 **Zalo Bot Creator / Marketplace 機器人**。**Zalo Official Account (OA) 機器人**是不同的產品介面，行為可能不同；本頁不涵蓋它們。

## 運作方式

- 傳入訊息會正規化為含媒體預留位置的共用頻道信封。
- 回覆一律路由回同一個 Zalo 聊天；不使用引用回覆（`replyToMode` 固定關閉）。
- 預設使用長輪詢（`getUpdates`）；可透過 `channels.zalo.webhookUrl` 使用網路鉤子模式。
- 群組需要 @提及才會觸發機器人；這無法依頻道設定。

## 限制

| 限制                           | 值                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------- |
| 傳出文字區塊大小               | 2000 個字元（Zalo API 限制）                                                  |
| 媒體大小（傳入/傳出）          | `channels.zalo.mediaMaxMb`，預設 `5` MB                                       |
| 網路鉤子請求本文               | 1 MB，30 秒讀取逾時                                                           |
| 網路鉤子速率限制               | 每個 path+client IP 於 60 秒內 120 個請求，之後回傳 HTTP 429                  |
| 網路鉤子重複事件視窗           | 5 分鐘（以 path + account + event name + chat + sender + message id 作為鍵）  |

## 存取控制

### 私訊

- `channels.zalo.dmPolicy`：`pairing`（預設）| `allowlist` | `open` | `disabled`。
- 配對：未知傳送者會收到配對碼；訊息會被忽略，直到核准為止。代碼會在 1 小時後過期。
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 詳細資料：[配對](/zh-TW/channels/pairing)
- `channels.zalo.allowFrom` 接受數字 Zalo 使用者 ID（不查詢使用者名稱）。`open` 需要 `"*"`。

### 群組

外掛支援群組聊天（`chatTypes: ["direct", "group"]`），並由提及加上群組政策控管：

- `channels.zalo.groupPolicy`：`open` | `allowlist` | `disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些傳送者 ID 可在群組中觸發機器人；未設定時會退回使用 `allowFrom`。
- 預設解析：設定了 `channels.zalo` 時，未設定的 `groupPolicy` 會解析為 `open`。完全缺少 `channels.zalo` 時，執行階段會故障關閉為 `allowlist`。
- 已回報的真實世界注意事項：在某些 Marketplace 機器人設定中，機器人完全無法加入群組。如果遇到這種情況，請使用你的機器人 Zalo Bot Platform 設定進行驗證；這是平台端限制，不是 OpenClaw 政策。

## 長輪詢與網路鉤子

- 預設：長輪詢（不需要公開 URL）。
- 網路鉤子模式：設定 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - 網路鉤子 URL 必須使用 HTTPS。
  - 網路鉤子密鑰必須為 8-256 個字元。
  - Zalo 會以 `X-Bot-Api-Secret-Token` 標頭傳送事件，並以常數時間比較檢查。
  - 閘道 HTTP 會在 `channels.zalo.webhookPath` 處理網路鉤子請求（預設為網路鉤子 URL 的路徑）。
  - 請求必須使用 `Content-Type: application/json`（或 `+json` 媒體類型）。
  - 依 Zalo API 文件，getUpdates 輪詢和網路鉤子在每個 Zalo API 中互斥。

## 支援的訊息類型

- 文字：完整支援，分段為 2000 個字元。
- 媒體：傳入/傳出，受 `mediaMaxMb` 限制。
- 反應、討論串、投票、原生指令：外掛不支援。
- 串流：外掛宣告區塊串流能力，但 Zalo 沒有專用的傳出佇列/合併文字調校旋鈕（不同於某些其他區域頻道）；如果這對你的使用案例很重要，請在你的環境中驗證目前行為。

## 功能

| 功能                     | 狀態                              |
| ------------------------ | --------------------------------- |
| 私訊                     | 支援                              |
| 群組                     | 支援（由提及控管）                |
| 媒體（傳入/傳出）       | 支援，受 `mediaMaxMb` 限制        |
| 反應                     | 不支援                            |
| 討論串                   | 不支援                            |
| 投票                     | 不支援                            |
| 原生指令                 | 不支援                            |
| 回覆至 / 引用            | 未使用（固定關閉）                |

## 傳遞目標（命令列介面/排程）

使用聊天 ID 作為目標：

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## 疑難排解

**機器人沒有回應：**

- 檢查權杖：`openclaw channels status --probe`
- 驗證傳送者已核准（配對或 `allowFrom`）
- 檢查閘道記錄：`openclaw logs --follow`

**網路鉤子未接收事件：**

- 確認網路鉤子 URL 使用 HTTPS
- 確認密鑰為 8-256 個字元
- 確認閘道 HTTP 端點可在設定的路徑上連線
- 確認 getUpdates 輪詢沒有同時執行（兩者互斥）
- 請求暴增可能會回傳 HTTP 429（每個 path+IP 於 60 秒內 120 個請求）；請退避後重試

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

| 設定                                         | 說明                                              | 預設                  |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | 啟用/停用頻道啟動                                | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | 來自 Zalo Bot Platform 的機器人權杖               | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | 從檔案讀取權杖（拒絕符號連結）                   | -                     |
| `channels.zalo.accounts.<id>.name`           | 顯示名稱                                          | -                     |
| `channels.zalo.accounts.<id>.enabled`        | 啟用/停用此帳號                                  | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | 每帳號私訊政策                                    | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | 私訊允許清單（使用者 ID）                         | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | 每帳號群組政策                                    | 請見[群組](#groups)   |
| `channels.zalo.accounts.<id>.groupAllowFrom` | 群組傳送者允許清單；退回使用 `allowFrom`          | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 傳入/傳出媒體上限（MB）                           | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | 啟用網路鉤子模式（需要 HTTPS）                    | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | 網路鉤子密鑰（8-256 個字元）                      | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | 閘道 HTTP 伺服器上的網路鉤子路徑                  | 網路鉤子 URL 路徑     |
| `channels.zalo.accounts.<id>.proxy`          | API 請求的 Proxy URL                              | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | 傳出回應前綴覆寫                                  | -                     |
| `channels.zalo.defaultAccount`               | 設定多個帳號時的預設帳號                          | `default`             |

`channels.zalo.botToken`、`channels.zalo.dmPolicy` 和其他扁平頂層鍵是上述欄位的舊版單帳號簡寫；兩種形式都支援。

環境變數選項：`ZALO_BOT_TOKEN=...` 僅解析預設帳號的權杖。

## 相關

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私訊驗證和配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為和提及控管
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型和強化
