---
read_when:
    - 頻道傳輸顯示已連線但回覆失敗
    - 你需要先進行通道特定檢查，再深入閱讀提供者文件
summary: 快速排查通道層級問題，包含各通道的失敗特徵與修正方式
title: 頻道疑難排解
x-i18n:
    generated_at: "2026-07-05T11:04:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
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
- `Capability: read-only`、`write-capable` 或 `admin-capable`
- 頻道探測顯示傳輸已連線，且在支援的情況下顯示 `works` 或 `audit ok`

## 更新後

當 Telegram、iMessage、BlueBubbles 時期的設定，或其他外掛頻道在更新後消失時，請使用此流程。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw status --all` 中尋找 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。這表示頻道已設定，但外掛設定/載入遇到損壞的依賴樹，而不是註冊頻道。`openclaw doctor --fix` 會清除過時的外掛執行階段依賴符號連結和過時的驗證影子，然後 `openclaw gateway restart` 會重新載入乾淨狀態。

## WhatsApp

### WhatsApp 失敗特徵

| 症狀 | 最快檢查 | 修復 |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已連線但沒有 DM 回覆 | `openclaw pairing list whatsapp` | 核准寄件者，或切換 DM 政策/允許清單。 |
| 群組訊息被忽略 | 檢查設定中的 `requireMention` + 提及模式 | 提及機器人，或放寬該群組的提及政策。 |
| QR 登入因 408 逾時 | 檢查閘道 `HTTPS_PROXY` / `HTTP_PROXY` 環境變數 | 設定可連線的代理；僅將 `NO_PROXY` 用於繞過。 |
| 隨機斷線/重新登入循環 | `openclaw channels status --probe` + 日誌 | 即使目前已連線，最近的重新連線也會被標記；查看日誌、重新啟動閘道，若仍持續抖動則重新連結。 |
| `status=408 Request Time-out` 循環 | 探測、日誌、doctor，然後檢查閘道狀態 | 先修復主機連線能力/時序；若循環持續，請備份驗證資料並重新連結帳號。 |
| 回覆延遲數秒/數分鐘才抵達 | `openclaw doctor --fix` | Doctor 會停止經驗證已過時且正在拖慢閘道事件迴圈的本機終端介面用戶端。 |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀 | 最快檢查 | 修復 |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` 但沒有可用的回覆流程 | `openclaw pairing list telegram` | 核准配對或變更 DM 政策。 |
| 機器人在線但群組保持沉默 | 驗證提及需求與機器人隱私模式 | 停用隱私模式以取得群組可見性，或提及機器人。 |
| 傳送因網路錯誤失敗 | 檢查日誌中的 Telegram API 呼叫失敗 | 修復到 `api.telegram.org` 的 DNS/IPv6/代理路由。 |
| 啟動回報 `getMe returned 401` | 檢查已設定的權杖來源 | 重新複製或重新產生 BotFather 權杖，並更新 `botToken`、`tokenFile` 或預設帳號 `TELEGRAM_BOT_TOKEN`。 |
| 輪詢停滯或重新連線緩慢 | `openclaw logs --follow` 查看輪詢診斷 | 升級；若重新啟動是誤報，請調整 `pollingStallThresholdMs`。持續停滯仍指向代理/DNS/IPv6。 |
| 啟動時 `setMyCommands` 被拒絕 | 檢查日誌中的 `BOT_COMMANDS_TOO_MUCH` | 減少外掛/skill/自訂 Telegram 命令，或停用原生選單。 |
| 升級後允許清單封鎖你 | `openclaw security audit` 和設定允許清單 | 執行 `openclaw doctor --fix`，或以數字寄件者 ID 取代 `@username`。 |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀 | 最快檢查 | 修復 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 機器人在線但沒有伺服器回覆 | `openclaw channels status --probe` | 允許伺服器/頻道，並驗證訊息內容意圖。 |
| 群組訊息被忽略 | 檢查日誌是否有提及閘控丟棄 | 提及機器人，或設定伺服器/頻道 `requireMention: false`。 |
| 有輸入中/權杖使用量但沒有 Discord 訊息 | 檢查這是否是環境房間事件，或是模型漏掉 `message(action=send)` 的已選用 `message_tool` 房間 | 檢查閘道詳細日誌中被抑制的最終酬載中繼資料，驗證 `messages.groupChat.unmentionedInbound`，閱讀[環境房間事件](/zh-TW/channels/ambient-room-events)，或針對一般群組請求保留 `messages.groupChat.visibleReplies: "automatic"`。 |
| 缺少 DM 回覆 | `openclaw pairing list discord` | 核准 DM 配對或調整 DM 政策。 |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀 | 最快檢查 | 修復 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket mode 已連線但沒有回應 | `openclaw channels status --probe` | 驗證 app 權杖 + bot 權杖與所需範圍；在 SecretRef 支援的設定上，注意 `botTokenStatus` / `appTokenStatus = configured_unavailable`。 |
| DM 被封鎖 | `openclaw pairing list slack` | 核准配對或放寬 DM 政策。 |
| 頻道訊息被忽略 | 檢查 `groupPolicy` 和頻道允許清單 | 允許該頻道，或將政策切換為 `open`。 |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage

### iMessage 失敗特徵

| 症狀 | 最快檢查 | 修復 |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `imsg` 在非 macOS 上遺失或失敗 | `openclaw channels status --probe --channel imessage` | 在 Messages Mac 上執行 OpenClaw，或為 `cliPath` 使用 SSH 包裝器。 |
| macOS 上可傳送但無法接收 | 檢查 macOS Messages 自動化的隱私權限 | 重新授予 TCC 權限並重新啟動頻道程序。 |
| DM 寄件者被封鎖 | `openclaw pairing list imessage` | 核准配對或更新允許清單。 |

完整疑難排解：[iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀 | 最快檢查 | 修復 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Daemon 可連線但機器人沉默 | `openclaw channels status --probe` | 驗證 `signal-cli` daemon URL/帳號與接收模式。 |
| DM 被封鎖 | `openclaw pairing list signal` | 核准寄件者或調整 DM 政策。 |
| 群組回覆未觸發 | 檢查群組允許清單與提及模式 | 新增寄件者/群組或放寬閘控。 |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀 | 最快檢查 | 修復 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 機器人回覆「gone to Mars」 | 驗證設定中的 `appId` 和 `clientSecret` | 設定認證或重新啟動閘道。 |
| 沒有傳入訊息 | `openclaw channels status --probe` | 在 QQ Open Platform 上驗證認證。 |
| 語音未轉錄 | 檢查 STT 提供者設定 | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主動訊息未抵達 | 檢查 QQ 平台互動需求 | 若近期沒有互動，QQ 可能會封鎖機器人主動發起的訊息。 |

完整疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀 | 最快檢查 | 修正 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登入但忽略房間訊息 | `openclaw channels status --probe` | 檢查 `groupPolicy`、房間允許清單，以及提及閘控。 |
| 私訊未處理 | `openclaw pairing list matrix` | 核准傳送者或調整私訊政策。 |
| 加密房間失敗 | `openclaw matrix verify status` | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。 |
| 備份還原待處理或損壞 | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用復原金鑰重新執行。 |
| 交叉簽署/啟動設定看起來不正確 | `openclaw matrix verify bootstrap` | 一次修復秘密儲存、交叉簽署和備份狀態。 |

完整設定與組態：[Matrix](/zh-TW/channels/matrix)

## 相關

- [配對](/zh-TW/channels/pairing)
- [頻道路由](/zh-TW/channels/channel-routing)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
