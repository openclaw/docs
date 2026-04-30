---
read_when:
    - 通道傳輸顯示已連線，但回覆失敗
    - 深入查閱提供者文件前，需要頻道特定檢查
summary: 快速通道層級疑難排解，包含各通道的失敗特徵與修復方式
title: 通道疑難排解
x-i18n:
    generated_at: "2026-04-30T02:50:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6024f2ae0a058b2296758c237c912a5cd8ea6bbafea33cc201690cc081efcbee
    source_path: channels/troubleshooting.md
    workflow: 16
---

當通道已連線但行為不正確時，請使用此頁面。

## 命令階梯

先依序執行這些命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健康基準：

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable` 或 `admin-capable`
- 通道探測顯示傳輸已連線，且在支援的情況下顯示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 失敗特徵

| 症狀                            | 最快檢查                                            | 修正                                                                                                                            |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 已連線但沒有私人訊息回覆        | `openclaw pairing list whatsapp`                    | 核准寄件者，或切換私人訊息政策/允許清單。                                                                                      |
| 群組訊息被忽略                  | 檢查設定中的 `requireMention` + 提及模式            | 提及機器人，或放寬該群組的提及政策。                                                                                           |
| QR 登入因 408 而逾時            | 檢查 Gateway 的 `HTTPS_PROXY` / `HTTP_PROXY` 環境變數 | 設定可連線的 Proxy；僅將 `NO_PROXY` 用於略過連線。                                                                              |
| 隨機斷線/重新登入迴圈           | `openclaw channels status --probe` + 日誌           | 即使目前已連線，最近重新連線也會被標記；監看日誌、重新啟動 Gateway，若持續不穩再重新連結。                                    |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀                                 | 最快檢查                                         | 修正                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` 但沒有可用的回覆流程        | `openclaw pairing list telegram`                 | 核准配對或變更私人訊息政策。                                                                                               |
| 機器人在線上但群組保持沉默           | 驗證提及要求與機器人隱私模式                     | 停用隱私模式以允許群組可見，或提及機器人。                                                                                 |
| 傳送因網路錯誤而失敗                 | 檢查日誌中的 Telegram API 呼叫失敗               | 修正到 `api.telegram.org` 的 DNS/IPv6/Proxy 路由。                                                                          |
| 啟動回報 `getMe returned 401`        | 檢查設定的 Token 來源                            | 重新複製或重新產生 BotFather Token，並更新 `botToken`、`tokenFile` 或預設帳號的 `TELEGRAM_BOT_TOKEN`。                     |
| 輪詢停滯或重新連線緩慢               | 使用 `openclaw logs --follow` 檢查輪詢診斷       | 升級；若重新啟動是誤判，請調整 `pollingStallThresholdMs`。持續停滯仍表示 Proxy/DNS/IPv6 有問題。                           |
| 啟動時 `setMyCommands` 被拒絕        | 檢查日誌中的 `BOT_COMMANDS_TOO_MUCH`             | 減少 Plugin/skill/自訂 Telegram 命令，或停用原生選單。                                                                      |
| 升級後允許清單封鎖了你               | `openclaw security audit` 和設定允許清單         | 執行 `openclaw doctor --fix`，或將 `@username` 替換為數字寄件者 ID。                                                        |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀                            | 最快檢查                            | 修正                                                       |
| ------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| 機器人在線上但沒有伺服器回覆    | `openclaw channels status --probe`  | 允許伺服器/頻道，並驗證訊息內容 Intent。                  |
| 群組訊息被忽略                  | 檢查日誌中的提及閘控丟棄           | 提及機器人，或設定伺服器/頻道 `requireMention: false`。   |
| 私人訊息回覆遺失                | `openclaw pairing list discord`     | 核准私人訊息配對或調整私人訊息政策。                      |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀                                   | 最快檢查                                  | 修正                                                                                                                                                 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已連線但沒有回應           | `openclaw channels status --probe`        | 驗證 App Token + Bot Token 和必要 Scope；在 SecretRef 支援的設定中留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。               |
| 私人訊息被封鎖                         | `openclaw pairing list slack`             | 核准配對或放寬私人訊息政策。                                                                                                                        |
| 頻道訊息被忽略                         | 檢查 `groupPolicy` 和頻道允許清單         | 允許該頻道，或將政策切換為 `open`。                                                                                                                 |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 失敗特徵

| 症狀                             | 最快檢查                                                                | 修正                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| 沒有傳入事件                     | 驗證 Webhook/伺服器可達性與 App 權限                                    | 修正 Webhook URL 或 BlueBubbles 伺服器狀態。          |
| 在 macOS 上可傳送但無法接收      | 檢查 macOS 對 Messages 自動化的隱私權限                                 | 重新授予 TCC 權限並重新啟動通道程序。                 |
| 私人訊息寄件者被封鎖             | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 核准配對或更新允許清單。                              |

完整疑難排解：

- [iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)
- [BlueBubbles 疑難排解](/zh-TW/channels/bluebubbles#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀                            | 最快檢查                                   | 修正                                                      |
| ------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| Daemon 可達但機器人沉默         | `openclaw channels status --probe`         | 驗證 `signal-cli` Daemon URL/帳號和接收模式。             |
| 私人訊息被封鎖                  | `openclaw pairing list signal`             | 核准寄件者或調整私人訊息政策。                           |
| 群組回覆未觸發                  | 檢查群組允許清單和提及模式                 | 新增寄件者/群組或放寬閘控。                              |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀                            | 最快檢查                                    | 修正                                                            |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 機器人回覆「gone to Mars」      | 驗證設定中的 `appId` 和 `clientSecret`      | 設定憑證或重新啟動 Gateway。                                   |
| 沒有傳入訊息                    | `openclaw channels status --probe`          | 在 QQ Open Platform 上驗證憑證。                               |
| 語音未被轉錄                    | 檢查 STT 提供者設定                         | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。              |
| 主動訊息未送達                  | 檢查 QQ 平台互動要求                        | 若近期沒有互動，QQ 可能會封鎖機器人主動發起的訊息。            |

完整疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀                                | 最快檢查                               | 修正                                                                      |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登入但忽略房間訊息                | `openclaw channels status --probe`     | 檢查 `groupPolicy`、房間允許清單與提及閘控。                             |
| 私人訊息未處理                      | `openclaw pairing list matrix`         | 核准寄件者或調整私人訊息政策。                                           |
| 加密房間失敗                        | `openclaw matrix verify status`        | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。          |
| 備份還原擱置/損壞                   | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用復原金鑰重新執行。   |
| 交叉簽署/啟動流程看起來不正確       | `openclaw matrix verify bootstrap`     | 一次修復祕密儲存、交叉簽署與備份狀態。                                  |

完整設定與配置：[Matrix](/zh-TW/channels/matrix)

## 相關

- [配對](/zh-TW/channels/pairing)
- [通道路由](/zh-TW/channels/channel-routing)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
