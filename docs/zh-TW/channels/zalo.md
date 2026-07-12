---
read_when:
    - 開發 Zalo 功能或網路鉤子
summary: Zalo 機器人支援狀態、功能與設定
title: Zalo
x-i18n:
    generated_at: "2026-07-11T21:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

狀態：實驗性。已實作私人訊息與群組聊天；下方的[功能](#capabilities)表反映在 Zalo Bot Creator／Marketplace 機器人上驗證過的行為。

## 內建外掛

目前的 OpenClaw 版本已內建 Zalo 外掛，因此封裝版本不需要另行安裝。

若使用舊版，或自訂安裝時排除了 Zalo，請直接安裝 npm 套件：

- 安裝：`openclaw plugins install @openclaw/zalo`
- 鎖定版本：`openclaw plugins install @openclaw/zalo@2026.6.11`
- 從本機簽出目錄安裝：`openclaw plugins install ./path/to/local/zalo-plugin`
- 詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

1. 前往 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 建立機器人權杖（登入、建立機器人並設定選項）。權杖格式為 `numeric_id:secret`；若為 Marketplace 機器人，可供執行階段使用的權杖可能會出現在機器人的歡迎訊息中。
2. 設定權杖，可使用環境變數 `ZALO_BOT_TOKEN=...`（僅限預設帳號），或在設定檔中設定。
3. 重新啟動閘道。
4. 第一次透過私人訊息聯絡時核准配對碼（預設私人訊息政策為配對）。

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

多帳號：在 `channels.zalo.accounts.<id>` 下新增更多項目，每個項目各自設定 `botToken`／`name`。`channels.zalo.botToken`（扁平結構，沒有 `accounts`）是舊版單帳號簡寫；新設定檔建議使用 `accounts.<id>.*`。

## 這是什麼

Zalo 是以越南市場為主的即時通訊應用程式。其 Bot API 可讓閘道執行機器人，同時處理一對一對話與群組聊天，並以確定性的方式將回覆路由回 Zalo（模型絕不會選擇頻道）。

本頁說明 **Zalo Bot Creator／Marketplace 機器人**。**Zalo Official Account（OA）機器人**屬於不同的產品介面，行為可能有所不同；本頁不涵蓋此類機器人。

## 運作方式

- 傳入訊息會連同媒體預留位置一起正規化為共用頻道封裝。
- 回覆一律路由回同一個 Zalo 聊天；不使用引用回覆（`replyToMode` 固定為關閉）。
- 預設使用長輪詢（`getUpdates`）；也可透過 `channels.zalo.webhookUrl` 使用網路鉤子模式。
- 群組中必須以 @提及才能觸發機器人；無法針對各頻道設定此行為。

## 限制

| 限制                           | 值                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------- |
| 傳出文字分段大小               | 2000 個字元（Zalo API 限制）                                                      |
| 媒體大小（傳入／傳出）         | `channels.zalo.mediaMaxMb`，預設為 `5` MB                                         |
| 網路鉤子請求本文               | 1 MB，讀取逾時 30 秒                                                              |
| 網路鉤子速率限制               | 每個路徑＋用戶端 IP 每 60 秒 120 個請求，超過後傳回 HTTP 429                      |
| 網路鉤子重複事件判定時間範圍   | 5 分鐘（依路徑＋帳號＋事件名稱＋聊天＋傳送者＋訊息 ID 建立索引鍵）                |

## 存取控制

### 私人訊息

- `channels.zalo.dmPolicy`：`pairing`（預設）｜`allowlist`｜`open`｜`disabled`。
- 配對：未知傳送者會收到配對碼；核准前會忽略其訊息。配對碼會在 1 小時後失效。
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - 詳細資訊：[配對](/zh-TW/channels/pairing)
- `channels.zalo.allowFrom` 接受數字格式的 Zalo 使用者 ID（不支援使用者名稱查詢）。`open` 必須使用 `"*"`。

### 群組

此外掛支援群組聊天（`chatTypes: ["direct", "group"]`），並透過提及與群組政策進行管控：

- `channels.zalo.groupPolicy`：`open`｜`allowlist`｜`disabled`。
- `channels.zalo.groupAllowFrom` 限制哪些傳送者 ID 可在群組中觸發機器人；若未設定，則改用 `allowFrom`。
- 預設解析方式：若已設定 `channels.zalo`，未設定的 `groupPolicy` 會解析為 `open`。若完全沒有 `channels.zalo`，執行階段會採取失敗關閉策略並使用 `allowlist`。
- 實際使用時已知的注意事項：在部分 Marketplace 機器人設定中，可能完全無法將機器人加入群組。若遇到此情況，請檢查該機器人的 Zalo Bot Platform 設定；這是平台端限制，並非 OpenClaw 政策。

## 長輪詢與網路鉤子比較

- 預設：長輪詢（不需要公開網址）。
- 網路鉤子模式：設定 `channels.zalo.webhookUrl` 與 `channels.zalo.webhookSecret`。
  - 網路鉤子網址必須使用 HTTPS。
  - 網路鉤子密鑰必須為 8 至 256 個字元。
  - Zalo 會在事件中附加 `X-Bot-Api-Secret-Token` 標頭，系統會使用固定時間比較進行檢查。
  - 閘道 HTTP 會在 `channels.zalo.webhookPath` 處理網路鉤子請求（預設為網路鉤子網址的路徑）。
  - 請求必須使用 `Content-Type: application/json`（或 `+json` 媒體類型）。
  - 根據 Zalo API 文件，每個帳號的 getUpdates 輪詢與網路鉤子互斥。

## 支援的訊息類型

- 文字：完整支援，並以 2000 個字元為單位分段。
- 媒體：支援傳入與傳出，大小上限由 `mediaMaxMb` 控制。
- 回應、討論串、投票、原生命令：此外掛不支援。
- 串流：此外掛宣告支援區塊串流功能，但 Zalo 沒有專用的傳出佇列／文字合併調整選項（與部分其他地區性頻道不同）；若這對您的使用情境很重要，請在您的環境中驗證目前行為。

## 功能

| 功能                     | 狀態                                  |
| ------------------------ | ------------------------------------- |
| 私人訊息                 | 支援                                  |
| 群組                     | 支援（需提及才能觸發）                |
| 媒體（傳入／傳出）       | 支援，大小上限由 `mediaMaxMb` 控制    |
| 回應                     | 不支援                                |
| 討論串                   | 不支援                                |
| 投票                     | 不支援                                |
| 原生命令                 | 不支援                                |
| 指定回覆／引用           | 不使用（固定關閉）                    |

## 傳送目標（命令列介面／排程）

使用聊天 ID 作為目標：

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## 疑難排解

**機器人沒有回應：**

- 檢查權杖：`openclaw channels status --probe`
- 確認傳送者已獲核准（透過配對或 `allowFrom`）
- 檢查閘道日誌：`openclaw logs --follow`

**網路鉤子未收到事件：**

- 確認網路鉤子網址使用 HTTPS
- 確認密鑰長度為 8 至 256 個字元
- 確認可透過已設定的路徑連線至閘道 HTTP 端點
- 確認 getUpdates 輪詢未同時執行（兩者互斥）
- 大量突發請求可能會傳回 HTTP 429（每個路徑＋IP 每 60 秒 120 個請求）；請降低請求頻率後重試

## 設定參考

完整設定：[設定](/zh-TW/gateway/configuration)

| 設定                                         | 說明                                              | 預設值                |
| -------------------------------------------- | ------------------------------------------------- | --------------------- |
| `channels.zalo.enabled`                      | 啟用／停用頻道啟動                               | `true`                |
| `channels.zalo.accounts.<id>.botToken`       | 來自 Zalo Bot Platform 的機器人權杖               | -                     |
| `channels.zalo.accounts.<id>.tokenFile`      | 從檔案讀取權杖（拒絕符號連結）                    | -                     |
| `channels.zalo.accounts.<id>.name`           | 顯示名稱                                          | -                     |
| `channels.zalo.accounts.<id>.enabled`        | 啟用／停用此帳號                                  | `true`                |
| `channels.zalo.accounts.<id>.dmPolicy`       | 各帳號的私人訊息政策                              | `pairing`             |
| `channels.zalo.accounts.<id>.allowFrom`      | 私人訊息允許清單（使用者 ID）                     | -                     |
| `channels.zalo.accounts.<id>.groupPolicy`    | 各帳號的群組政策                                  | 請參閱[群組](#groups) |
| `channels.zalo.accounts.<id>.groupAllowFrom` | 群組傳送者允許清單；若未設定則改用 `allowFrom`    | -                     |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | 傳入／傳出媒體大小上限（MB）                      | `5`                   |
| `channels.zalo.accounts.<id>.webhookUrl`     | 啟用網路鉤子模式（必須使用 HTTPS）                | -                     |
| `channels.zalo.accounts.<id>.webhookSecret`  | 網路鉤子密鑰（8 至 256 個字元）                   | -                     |
| `channels.zalo.accounts.<id>.webhookPath`    | 閘道 HTTP 伺服器上的網路鉤子路徑                  | 網路鉤子網址路徑      |
| `channels.zalo.accounts.<id>.proxy`          | API 請求使用的代理伺服器網址                      | -                     |
| `channels.zalo.accounts.<id>.responsePrefix` | 覆寫傳出回覆前綴                                  | -                     |
| `channels.zalo.defaultAccount`               | 設定多個帳號時使用的預設帳號                      | `default`             |

`channels.zalo.botToken`、`channels.zalo.dmPolicy` 及其他扁平的頂層索引鍵，是上述欄位的舊版單帳號簡寫；兩種形式皆受支援。

環境變數選項：`ZALO_BOT_TOKEN=...` 僅會解析預設帳號的權杖。

## 相關內容

- [頻道概覽](/zh-TW/channels) - 所有支援的頻道
- [配對](/zh-TW/channels/pairing) - 私人訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) - 群組聊天行為與提及觸發機制
- [頻道路由](/zh-TW/channels/channel-routing) - 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) - 存取模型與強化措施
