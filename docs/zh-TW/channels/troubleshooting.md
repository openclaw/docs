---
read_when:
    - 通道傳輸顯示已連線，但回覆失敗
    - 在深入閱讀提供者文件前，你需要進行通道特定檢查
summary: 快速通道層級疑難排解，包含各通道的故障特徵與修正方式
title: 頻道疑難排解
x-i18n:
    generated_at: "2026-05-05T08:25:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360184c41ce6929c696688af597c5104a8a28b54620c354f7ee400a2e5490519
    source_path: channels/troubleshooting.md
    workflow: 16
---

當頻道已連線但行為不正確時，請使用此頁面。

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
- `Capability: read-only`, `write-capable`, 或 `admin-capable`
- 頻道探測顯示傳輸已連線，且在支援的情況下顯示 `works` 或 `audit ok`

## WhatsApp

### WhatsApp 失敗特徵

| 症狀                                | 最快檢查                                            | 修正                                                                                                                               |
| ----------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 已連線但沒有私訊回覆                | `openclaw pairing list whatsapp`                    | 核准傳送者，或切換私訊政策/允許清單。                                                                                             |
| 群組訊息被忽略                      | 檢查設定中的 `requireMention` + 提及模式            | 提及機器人，或放寬該群組的提及政策。                                                                                               |
| QR 登入逾時並出現 408               | 檢查 gateway 的 `HTTPS_PROXY` / `HTTP_PROXY` 環境變數 | 設定可連線的代理；僅將 `NO_PROXY` 用於略過代理。                                                                                   |
| 隨機斷線/重新登入迴圈               | `openclaw channels status --probe` + 記錄           | 即使目前已連線，最近的重新連線也會被標記；觀察記錄、重新啟動 Gateway，若持續不穩再重新連結。                                      |
| 回覆延遲數秒/數分鐘才抵達           | `openclaw doctor --fix`                             | 當已驗證的陳舊本機 TUI 用戶端正在降低 Gateway 事件迴圈效能時，Doctor 會停止它們。                                                |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀                                 | 最快檢查                                         | 修正                                                                                                                         |
| ------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `/start` 後沒有可用的回覆流程        | `openclaw pairing list telegram`                 | 核准配對或變更私訊政策。                                                                                                     |
| 機器人在線上但群組保持沉默           | 驗證提及要求與機器人隱私模式                     | 停用隱私模式以取得群組可見性，或提及機器人。                                                                                 |
| 傳送失敗並出現網路錯誤               | 檢查記錄中的 Telegram API 呼叫失敗               | 修正通往 `api.telegram.org` 的 DNS/IPv6/代理路由。                                                                            |
| 啟動時回報 `getMe returned 401`      | 檢查設定的 token 來源                            | 重新複製或重新產生 BotFather token，並更新 `botToken`、`tokenFile` 或預設帳號的 `TELEGRAM_BOT_TOKEN`。                       |
| 輪詢停滯或重新連線緩慢               | 使用 `openclaw logs --follow` 查看輪詢診斷       | 升級；如果重新啟動是誤判，請調整 `pollingStallThresholdMs`。持續停滯仍然指向代理/DNS/IPv6 問題。                              |
| 啟動時 `setMyCommands` 被拒絕        | 檢查記錄中的 `BOT_COMMANDS_TOO_MUCH`             | 減少 Plugin/skill/自訂 Telegram 命令，或停用原生選單。                                                                        |
| 升級後允許清單封鎖你                 | `openclaw security audit` 和設定允許清單         | 執行 `openclaw doctor --fix`，或將 `@username` 替換為數字傳送者 ID。                                                          |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀                                      | 最快檢查                                                              | 修正                                                                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 機器人在線上但沒有伺服器回覆              | `openclaw channels status --probe`                                    | 允許伺服器/頻道，並驗證訊息內容意圖。                                                                                                                                    |
| 群組訊息被忽略                            | 檢查記錄中因提及門檻而丟棄的項目                                     | 提及機器人，或設定伺服器/頻道 `requireMention: false`。                                                                                                                  |
| 有輸入狀態/token 使用量但沒有 Discord 訊息 | 工作階段記錄顯示 assistant 文字並帶有 `didSendViaMessagingTool: false` | 模型私下回答，而不是呼叫訊息工具。使用可靠呼叫工具的模型，或設定 `messages.groupChat.visibleReplies: "automatic"` 以自動張貼。                                           |
| 缺少私訊回覆                              | `openclaw pairing list discord`                                       | 核准私訊配對或調整私訊政策。                                                                                                                                             |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀                                  | 最快檢查                                  | 修正                                                                                                                                                 |
| ------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已連線但沒有回應          | `openclaw channels status --probe`        | 驗證 app token + bot token 及必要 scope；在 SecretRef 支援的設定中留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。                  |
| 私訊被封鎖                            | `openclaw pairing list slack`             | 核准配對或放寬私訊政策。                                                                                                                             |
| 頻道訊息被忽略                        | 檢查 `groupPolicy` 和頻道允許清單         | 允許該頻道，或將政策切換為 `open`。                                                                                                                  |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage 和 BlueBubbles

### iMessage 和 BlueBubbles 失敗特徵

| 症狀                             | 最快檢查                                                               | 修正                                                   |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 沒有傳入事件                     | 驗證 webhook/server 可達性與 app 權限                                  | 修正 webhook URL 或 BlueBubbles server 狀態。          |
| 可傳送但在 macOS 上無法接收      | 檢查 macOS 對 Messages 自動化的隱私權限                                | 重新授予 TCC 權限並重新啟動頻道程序。                 |
| 私訊傳送者被封鎖                 | `openclaw pairing list imessage` 或 `openclaw pairing list bluebubbles` | 核准配對或更新允許清單。                              |

完整疑難排解：

- [iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)
- [BlueBubbles 疑難排解](/zh-TW/channels/bluebubbles#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀                         | 最快檢查                                  | 修正                                                      |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| Daemon 可達但機器人沉默      | `openclaw channels status --probe`        | 驗證 `signal-cli` daemon URL/帳號與接收模式。             |
| 私訊被封鎖                   | `openclaw pairing list signal`            | 核准傳送者或調整私訊政策。                                |
| 群組回覆沒有觸發             | 檢查群組允許清單與提及模式                | 新增傳送者/群組或放寬門檻。                               |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀                           | 最快檢查                                  | 修正                                                            |
| ------------------------------ | ----------------------------------------- | --------------------------------------------------------------- |
| 機器人回覆「gone to Mars」     | 驗證設定中的 `appId` 和 `clientSecret`    | 設定認證資訊或重新啟動 Gateway。                               |
| 沒有傳入訊息                   | `openclaw channels status --probe`        | 在 QQ Open Platform 上驗證認證資訊。                            |
| 語音未轉錄                     | 檢查 STT 提供者設定                       | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。               |
| 主動訊息未抵達                 | 檢查 QQ 平台互動要求                      | 若近期沒有互動，QQ 可能會封鎖機器人發起的訊息。                 |

完整疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀                                | 最快檢查                               | 修正                                                                        |
| ----------------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| 已登入但忽略聊天室訊息              | `openclaw channels status --probe`     | 檢查 `groupPolicy`、聊天室允許清單與提及門檻。                              |
| 私訊未處理                          | `openclaw pairing list matrix`         | 核准傳送者或調整私訊政策。                                                  |
| 加密聊天室失敗                      | `openclaw matrix verify status`        | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。              |
| 備份還原待處理/損壞                 | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用復原金鑰重新執行。       |
| 交叉簽署/bootstrap 看起來不正確     | `openclaw matrix verify bootstrap`     | 一次修復秘密儲存、交叉簽署與備份狀態。                                      |

完整設定與組態：[Matrix](/zh-TW/channels/matrix)

## 相關

- [配對](/zh-TW/channels/pairing)
- [頻道路由](/zh-TW/channels/channel-routing)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
