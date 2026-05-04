---
read_when:
    - 通道傳輸顯示已連線，但回覆失敗
    - 在深入閱讀提供者文件之前，你需要先進行通道特定檢查。
summary: 快速通道層級疑難排解，包含各通道的失敗特徵與修復方式
title: 通道疑難排解
x-i18n:
    generated_at: "2026-05-04T02:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a3a0737156ae83897c44d18505e0355a5d8e5700106b984496d94874c270deb2
    source_path: channels/troubleshooting.md
    workflow: 16
---

在通道已連線但行為不正確時使用此頁面。

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
- 通道探測顯示傳輸已連線，且在支援時顯示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 失敗特徵

| 症狀                            | 最快檢查                                            | 修正                                                                                                                               |
| ------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 已連線但沒有私訊回覆            | `openclaw pairing list whatsapp`                    | 核准寄件者，或切換私訊政策/允許清單。                                                                                             |
| 群組訊息被忽略                  | 檢查設定中的 `requireMention` + 提及模式            | 提及機器人，或放寬該群組的提及政策。                                                                                               |
| QR 登入逾時並出現 408           | 檢查 gateway `HTTPS_PROXY` / `HTTP_PROXY` 環境變數  | 設定可連線的 proxy；僅將 `NO_PROXY` 用於略過。                                                                                     |
| 隨機斷線/重新登入迴圈           | `openclaw channels status --probe` + 日誌           | 即使目前已連線，近期重新連線也會被標示；觀察日誌，重新啟動 Gateway，若持續不穩定再重新連結。                                      |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀                                 | 最快檢查                                      | 修正                                                                                                                          |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/start` 但沒有可用的回覆流程        | `openclaw pairing list telegram`              | 核准配對或變更私訊政策。                                                                                                      |
| 機器人在線上但群組保持靜默           | 驗證提及要求與機器人隱私模式                  | 停用隱私模式以允許群組可見性，或提及機器人。                                                                                  |
| 傳送失敗並出現網路錯誤               | 檢查日誌中的 Telegram API 呼叫失敗            | 修正到 `api.telegram.org` 的 DNS/IPv6/proxy 路由。                                                                            |
| 啟動回報 `getMe returned 401`         | 檢查設定的 token 來源                         | 重新複製或重新產生 BotFather token，並更新 `botToken`、`tokenFile` 或預設帳戶的 `TELEGRAM_BOT_TOKEN`。                        |
| 輪詢停滯或重新連線緩慢               | 使用 `openclaw logs --follow` 查看輪詢診斷    | 升級；如果重新啟動是誤判，調整 `pollingStallThresholdMs`。持續停滯仍然指向 proxy/DNS/IPv6 問題。                              |
| 啟動時 `setMyCommands` 被拒絕         | 檢查日誌中的 `BOT_COMMANDS_TOO_MUCH`           | 減少 Plugin/skill/自訂 Telegram 命令，或停用原生選單。                                                                         |
| 升級後允許清單封鎖你                 | `openclaw security audit` 和設定允許清單      | 執行 `openclaw doctor --fix`，或將 `@username` 替換為數字寄件者 ID。                                                           |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀                                      | 最快檢查                                                               | 修正                                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 機器人在線上但沒有 guild 回覆             | `openclaw channels status --probe`                                     | 允許 guild/channel，並驗證訊息內容 intent。                                                                                                                             |
| 群組訊息被忽略                            | 檢查日誌中的提及閘控丟棄紀錄                                          | 提及機器人，或設定 guild/channel `requireMention: false`。                                                                                                              |
| 有輸入中/token 使用量但沒有 Discord 訊息   | 工作階段日誌顯示助手文字且 `didSendViaMessagingTool: false`           | 模型私下回答，而不是呼叫訊息工具。使用可靠呼叫工具的模型，或設定 `messages.groupChat.visibleReplies: "automatic"` 以自動張貼。                                         |
| 私訊回覆遺失                              | `openclaw pairing list discord`                                        | 核准私訊配對或調整私訊政策。                                                                                                                                            |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀                                 | 最快檢查                                  | 修正                                                                                                                                                  |
| ------------------------------------ | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已連線但沒有回應         | `openclaw channels status --probe`        | 驗證 app token + bot token 與必要 scopes；在 SecretRef 支援的設定中留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。                |
| 私訊被封鎖                           | `openclaw pairing list slack`             | 核准配對或放寬私訊政策。                                                                                                                              |
| 頻道訊息被忽略                       | 檢查 `groupPolicy` 和頻道允許清單         | 允許該頻道，或將政策切換為 `open`。                                                                                                                   |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 失敗特徵

| 症狀                             | 最快檢查                                                                | 修正                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| 沒有傳入事件                     | 驗證 Webhook/server 可連線性與 app 權限                                 | 修正 Webhook URL 或 BlueBubbles server 狀態。          |
| 在 macOS 上可傳送但無法接收      | 檢查 macOS 對 Messages 自動化的隱私權限                                 | 重新授予 TCC 權限並重新啟動通道程序。                  |
| 私訊寄件者被封鎖                 | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 核准配對或更新允許清單。                               |

完整疑難排解：

- [iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)
- [BlueBubbles 疑難排解](/zh-TW/channels/bluebubbles#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀                            | 最快檢查                                   | 修正                                                      |
| ------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| Daemon 可連線但機器人無回應     | `openclaw channels status --probe`         | 驗證 `signal-cli` daemon URL/account 與接收模式。         |
| 私訊被封鎖                      | `openclaw pairing list signal`             | 核准寄件者或調整私訊政策。                                |
| 群組回覆未觸發                  | 檢查群組允許清單和提及模式                 | 新增寄件者/群組或放寬閘控。                               |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀                            | 最快檢查                                    | 修正                                                             |
| ------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| 機器人回覆「gone to Mars」      | 驗證設定中的 `appId` 和 `clientSecret`      | 設定憑證或重新啟動 Gateway。                                     |
| 沒有傳入訊息                    | `openclaw channels status --probe`          | 在 QQ Open Platform 驗證憑證。                                   |
| 語音未轉錄                      | 檢查 STT provider 設定                      | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。                |
| 主動訊息未抵達                  | 檢查 QQ platform 互動要求                   | 若近期沒有互動，QQ 可能會封鎖機器人發起的訊息。                  |

完整疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀                                | 最快檢查                               | 修正                                                                       |
| ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| 已登入但忽略 room 訊息              | `openclaw channels status --probe`     | 檢查 `groupPolicy`、room 允許清單和提及閘控。                              |
| 私訊未處理                          | `openclaw pairing list matrix`         | 核准寄件者或調整私訊政策。                                                 |
| 加密 room 失敗                      | `openclaw matrix verify status`        | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。            |
| 備份還原擱置中/損壞                 | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用 recovery key 重新執行。 |
| Cross-signing/bootstrap 看起來不正確 | `openclaw matrix verify bootstrap`     | 一次修復 secret storage、cross-signing 和備份狀態。                        |

完整設定與組態：[Matrix](/zh-TW/channels/matrix)

## 相關

- [配對](/zh-TW/channels/pairing)
- [通道路由](/zh-TW/channels/channel-routing)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
