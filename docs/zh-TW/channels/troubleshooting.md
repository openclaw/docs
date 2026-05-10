---
read_when:
    - 通道傳輸顯示已連線，但回覆失敗
    - 在深入提供者文件之前，需要先進行通道特定檢查
summary: 快速的通道層級疑難排解，包含各通道的失敗特徵與修正方式
title: 頻道疑難排解
x-i18n:
    generated_at: "2026-05-10T19:24:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a314cd772e15c038008b78603f811caaa40a3be31e7268c8fb1eefbb000b32
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

| 症狀                                | 最快檢查                                            | 修正                                                                                                                             |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已連線但沒有 DM 回覆                | `openclaw pairing list whatsapp`                    | 核准寄件者，或切換 DM 政策/允許清單。                                                                                           |
| 群組訊息被忽略                      | 檢查設定中的 `requireMention` + 提及模式            | 提及機器人，或放寬該群組的提及政策。                                                                                             |
| QR 登入因 408 逾時                  | 檢查 gateway `HTTPS_PROXY` / `HTTP_PROXY` env       | 設定可連線的 proxy；僅將 `NO_PROXY` 用於略過項目。                                                                                |
| 隨機斷線/重新登入循環               | `openclaw channels status --probe` + logs           | 即使目前已連線，最近的重新連線仍會被標記；監看 logs、重新啟動 gateway，若持續不穩再重新連結。                                  |
| 回覆延遲數秒/數分鐘才抵達           | `openclaw doctor --fix`                             | Doctor 會停止已驗證為過時、且正在降低 Gateway 事件迴圈效能的本機 TUI 用戶端。                                                   |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀                                 | 最快檢查                                         | 修正                                                                                                                        |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `/start` 但沒有可用的回覆流程        | `openclaw pairing list telegram`                 | 核准配對，或變更 DM 政策。                                                                                                  |
| 機器人在線但群組保持沉默             | 驗證提及要求與機器人隱私模式                     | 停用隱私模式以取得群組可見性，或提及機器人。                                                                                |
| 發送失敗並出現網路錯誤               | 檢查 logs 中的 Telegram API 呼叫失敗             | 修正到 `api.telegram.org` 的 DNS/IPv6/proxy 路由。                                                                           |
| 啟動回報 `getMe returned 401`        | 檢查已設定的 token 來源                          | 重新複製或重新產生 BotFather token，並更新 `botToken`、`tokenFile` 或預設帳號的 `TELEGRAM_BOT_TOKEN`。                       |
| Polling 停滯或重新連線緩慢           | 使用 `openclaw logs --follow` 查看 polling 診斷  | 升級；若重新啟動是假陽性，請調整 `pollingStallThresholdMs`。持續停滯仍指向 proxy/DNS/IPv6 問題。                            |
| `setMyCommands` 在啟動時被拒絕       | 檢查 logs 中的 `BOT_COMMANDS_TOO_MUCH`            | 減少 Plugin/skill/自訂 Telegram 命令，或停用原生選單。                                                                       |
| 升級後允許清單封鎖你                 | `openclaw security audit` 和設定允許清單          | 執行 `openclaw doctor --fix`，或將 `@username` 替換為數字寄件者 ID。                                                         |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀                                      | 最快檢查                                                               | 修正                                                                                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 機器人在線但沒有伺服器回覆                | `openclaw channels status --probe`                                     | 允許伺服器/頻道，並驗證訊息內容 intent。                                                                                                                               |
| 群組訊息被忽略                            | 檢查 logs 中的提及閘控丟棄紀錄                                         | 提及機器人，或設定伺服器/頻道 `requireMention: false`。                                                                                                                |
| 有 typing/token 使用量但沒有 Discord 訊息 | 工作階段 log 顯示助理文字且 `didSendViaMessagingTool: false`           | 模型私下回答，而不是呼叫訊息工具。使用工具呼叫可靠的模型，或設定 `messages.groupChat.visibleReplies: "automatic"` 以自動發佈。                                         |
| 缺少 DM 回覆                              | `openclaw pairing list discord`                                        | 核准 DM 配對，或調整 DM 政策。                                                                                                                                         |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀                                  | 最快檢查                                  | 修正                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket 模式已連線但沒有回應           | `openclaw channels status --probe`        | 驗證 app token + bot token 與必要 scopes；在 SecretRef 支援的設定中留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。                 |
| DM 被封鎖                             | `openclaw pairing list slack`             | 核准配對，或放寬 DM 政策。                                                                                                                           |
| 頻道訊息被忽略                        | 檢查 `groupPolicy` 和頻道允許清單         | 允許該頻道，或將政策切換為 `open`。                                                                                                                  |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage

### iMessage 失敗特徵

| 症狀                                  | 最快檢查                                                | 修正                                                                   |
| ------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `imsg` 缺失或在非 macOS 上失敗        | `openclaw channels status --probe --channel imessage`   | 在 Messages Mac 上執行 OpenClaw，或為 `cliPath` 使用 SSH wrapper。      |
| 在 macOS 上可發送但無法接收           | 檢查 Messages automation 的 macOS 隱私權限              | 重新授予 TCC 權限，並重新啟動通道處理程序。                            |
| DM 寄件者被封鎖                       | `openclaw pairing list imessage`                        | 核准配對，或更新允許清單。                                             |

完整疑難排解：

- [iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀                         | 最快檢查                                  | 修正                                                      |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| Daemon 可連線但機器人沉默    | `openclaw channels status --probe`        | 驗證 `signal-cli` daemon URL/account 和接收模式。          |
| DM 被封鎖                    | `openclaw pairing list signal`            | 核准寄件者，或調整 DM 政策。                              |
| 群組回覆未觸發               | 檢查群組允許清單與提及模式                | 新增寄件者/群組，或放寬閘控。                             |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀                               | 最快檢查                                  | 修正                                                             |
| ---------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| 機器人回覆「gone to Mars」          | 驗證設定中的 `appId` 和 `clientSecret`    | 設定認證資料，或重新啟動 gateway。                               |
| 沒有傳入訊息                       | `openclaw channels status --probe`        | 在 QQ Open Platform 驗證認證資料。                               |
| 語音未轉錄                         | 檢查 STT provider 設定                    | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。                |
| 主動訊息未抵達                     | 檢查 QQ 平台互動要求                      | 若近期沒有互動，QQ 可能會封鎖機器人發起的訊息。                  |

完整疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀                                  | 最快檢查                               | 修正                                                                       |
| ------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| 已登入但忽略房間訊息                  | `openclaw channels status --probe`     | 檢查 `groupPolicy`、房間允許清單和提及閘控。                               |
| DM 未處理                             | `openclaw pairing list matrix`         | 核准寄件者，或調整 DM 政策。                                               |
| 加密房間失敗                          | `openclaw matrix verify status`        | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。             |
| Backup 還原擱置或損壞                 | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用 recovery key 重新執行。 |
| Cross-signing/bootstrap 看起來不正確  | `openclaw matrix verify bootstrap`     | 一次修復 secret storage、cross-signing 和 backup 狀態。                     |

完整設定與組態：[Matrix](/zh-TW/channels/matrix)

## 相關

- [配對](/zh-TW/channels/pairing)
- [通道路由](/zh-TW/channels/channel-routing)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
