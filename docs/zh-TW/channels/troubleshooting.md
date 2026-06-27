---
read_when:
    - 頻道傳輸顯示已連線，但回覆失敗
    - 你需要先進行通道特定檢查，再深入提供者文件
summary: 依通道區分的快速疑難排解，包含各通道的失敗特徵與修復方法
title: 頻道疑難排解
x-i18n:
    generated_at: "2026-06-27T18:59:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56b64030ec56553b4c2e156195806029f91bc8cc449588a242b0f45f8bbddb6e
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
- 通道探測會顯示傳輸已連線，且在支援的情況下顯示 `works` 或 `audit ok`

## 更新後

當 Telegram、iMessage、BlueBubbles 時期的設定，或其他外掛通道在更新後消失時，請使用此流程。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw status --all` 中尋找 `plugin load failed: dependency tree corrupted; run openclaw doctor
--fix`。這表示通道已設定，但外掛設定/載入路徑遇到損壞的相依樹，因此未註冊通道。`openclaw doctor --fix` 會移除過時的外掛相依暫存目錄與過時的驗證影子，接著 `openclaw gateway restart` 會重新載入乾淨狀態。

## WhatsApp

### WhatsApp 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已連線但沒有 DM 回覆 | `openclaw pairing list whatsapp` | 核准傳送者，或切換 DM 政策/允許清單。 |
| 群組訊息被忽略 | 檢查設定中的 `requireMention` 與提及模式 | 提及機器人，或放寬該群組的提及政策。 |
| QR 登入因 408 逾時 | 檢查閘道 `HTTPS_PROXY` / `HTTP_PROXY` 環境變數 | 設定可連線的代理；只將 `NO_PROXY` 用於略過。 |
| 隨機斷線/重新登入循環 | `openclaw channels status --probe` + 記錄 | 即使目前已連線，近期重新連線也會被標記；觀察記錄、重新啟動閘道，若抖動持續則重新連結。 |
| `status=408 Request Time-out` 循環 | 探測、記錄、doctor，接著查看閘道狀態 | 先修正主機連線/時序；若循環持續，備份驗證資料並重新連結帳號。 |
| 回覆延遲數秒/數分鐘才到達 | `openclaw doctor --fix` | doctor 會停止已驗證為過時且正在拖慢閘道事件迴圈的本機終端介面用戶端。 |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` 但沒有可用的回覆流程 | `openclaw pairing list telegram` | 核准配對或變更 DM 政策。 |
| 機器人在線上但群組保持沉默 | 驗證提及需求與機器人隱私模式 | 停用隱私模式以取得群組可見性，或提及機器人。 |
| 傳送失敗並出現網路錯誤 | 檢查記錄中的 Telegram API 呼叫失敗 | 修正通往 `api.telegram.org` 的 DNS/IPv6/代理路由。 |
| 啟動回報 `getMe returned 401` | 檢查已設定的權杖來源 | 重新複製或重新產生 BotFather 權杖，並更新 `botToken`、`tokenFile` 或預設帳號的 `TELEGRAM_BOT_TOKEN`。 |
| 輪詢停滯或重新連線緩慢 | 使用 `openclaw logs --follow` 查看輪詢診斷 | 升級；如果重新啟動是假陽性，請調整 `pollingStallThresholdMs`。持續停滯仍指向代理/DNS/IPv6 問題。 |
| 啟動時 `setMyCommands` 被拒絕 | 檢查記錄中的 `BOT_COMMANDS_TOO_MUCH` | 減少外掛/技能/自訂 Telegram 命令，或停用原生選單。 |
| 升級後允許清單封鎖你 | `openclaw security audit` 與設定允許清單 | 執行 `openclaw doctor --fix`，或將 `@username` 替換為數字傳送者 ID。 |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 機器人在線上但沒有伺服器回覆 | `openclaw channels status --probe` | 允許伺服器/頻道並驗證訊息內容意圖。 |
| 群組訊息被忽略 | 檢查記錄中的提及閘控丟棄 | 提及機器人，或設定伺服器/頻道 `requireMention: false`。 |
| 有輸入/權杖使用量但沒有 Discord 訊息 | 檢查這是環境房間事件，還是模型漏掉 `message(action=send)` 的已選擇加入 `message_tool` 房間 | 檢查閘道詳細記錄中被抑制的最終酬載中繼資料、驗證 `messages.groupChat.unmentionedInbound`、閱讀[環境房間事件](/zh-TW/channels/ambient-room-events)，或針對一般群組請求保留 `messages.groupChat.visibleReplies: "automatic"`。 |
| DM 回覆遺失 | `openclaw pairing list discord` | 核准 DM 配對或調整 DM 政策。 |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket 模式已連線但沒有回應 | `openclaw channels status --probe` | 驗證應用程式權杖 + 機器人權杖與必要範圍；在 SecretRef 支援的設定中留意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。 |
| DM 被封鎖 | `openclaw pairing list slack` | 核准配對或放寬 DM 政策。 |
| 頻道訊息被忽略 | 檢查 `groupPolicy` 與頻道允許清單 | 允許該頻道，或將政策切換為 `open`。 |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage

### iMessage 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` 遺失或在非 macOS 上失敗 | `openclaw channels status --probe --channel imessage` | 在 Messages Mac 上執行 OpenClaw，或為 `cliPath` 使用 SSH 包裝器。 |
| 在 macOS 上可傳送但無法接收 | 檢查 Messages 自動化的 macOS 隱私權權限 | 重新授予 TCC 權限並重新啟動通道程序。 |
| DM 傳送者被封鎖 | `openclaw pairing list imessage` | 核准配對或更新允許清單。 |

完整疑難排解：

- [iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 常駐程式可連線但機器人沉默 | `openclaw channels status --probe` | 驗證 `signal-cli` 常駐程式 URL/帳號與接收模式。 |
| DM 被封鎖 | `openclaw pairing list signal` | 核准傳送者或調整 DM 政策。 |
| 群組回覆未觸發 | 檢查群組允許清單與提及模式 | 新增傳送者/群組或放寬閘控。 |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 機器人回覆「gone to Mars」 | 驗證設定中的 `appId` 與 `clientSecret` | 設定憑證或重新啟動閘道。 |
| 沒有傳入訊息 | `openclaw channels status --probe` | 在 QQ Open Platform 上驗證憑證。 |
| 語音未轉錄 | 檢查 STT 供應者設定 | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主動訊息未到達 | 檢查 QQ 平台互動需求 | QQ 可能會封鎖沒有近期互動的機器人主動訊息。 |

Full 疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀 | 最快速檢查 | 修正方式 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登入但忽略聊天室訊息 | `openclaw channels status --probe` | 檢查 `groupPolicy`、聊天室允許清單，以及提及閘控。 |
| 私訊未處理 | `openclaw pairing list matrix` | 核准傳送者或調整私訊政策。 |
| 加密聊天室失敗 | `openclaw matrix verify status` | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。 |
| 備份還原待處理/損壞 | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用復原金鑰重新執行。 |
| 交叉簽署/啟動程序看起來不正確 | `openclaw matrix verify bootstrap` | 一次修復秘密儲存、交叉簽署與備份狀態。 |

完整設定與組態：[Matrix](/zh-TW/channels/matrix)

## 相關

- [配對](/zh-TW/channels/pairing)
- [頻道路由](/zh-TW/channels/channel-routing)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
