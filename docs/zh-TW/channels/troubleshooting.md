---
read_when:
    - 頻道傳輸顯示已連線，但回覆失敗
    - 深入閱讀供應商文件前，你需要先進行特定頻道的檢查
summary: 透過各通道的故障特徵與修正方法，快速進行通道層級疑難排解
title: 頻道疑難排解
x-i18n:
    generated_at: "2026-07-11T21:08:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2699b48ed6ab1f702789d2180daa43aed6ee83023889d0d8821faceb9a943b5
    source_path: channels/troubleshooting.md
    workflow: 16
---

當頻道可連線但行為不正確時，請使用本頁。

## 命令執行順序

請先依序執行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常基準：

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`、`write-capable` 或 `admin-capable`
- 頻道探測顯示傳輸已連線，並在支援的情況下顯示 `works` 或 `audit ok`

## 更新之後

當 Telegram、iMessage、BlueBubbles 時期的設定或其他外掛頻道在更新後消失時，請使用以下步驟。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw status --all` 中尋找 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。這表示頻道已設定，但外掛設定或載入時遇到損壞的相依性樹狀結構，因而未註冊頻道。`openclaw doctor --fix` 會清除過期的外掛執行階段相依性符號連結及過期的驗證遮蔽項目，接著 `openclaw gateway restart` 會重新載入乾淨狀態。

## WhatsApp

### WhatsApp 失敗特徵

| 症狀 | 最快檢查方式 | 修正方式 |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已連線但未回覆私訊 | `openclaw pairing list whatsapp` | 核准傳送者，或切換私訊政策／允許清單。 |
| 群組訊息遭忽略 | 檢查設定中的 `requireMention` 與提及模式 | 提及機器人，或放寬該群組的提及政策。 |
| QR 登入逾時並顯示 408 | 檢查閘道的 `HTTPS_PROXY`／`HTTP_PROXY` 環境變數 | 設定可連線的代理伺服器；僅將 `NO_PROXY` 用於略過代理的情況。 |
| 隨機中斷連線／重複登入 | `openclaw channels status --probe` 與日誌 | 即使目前已連線，近期重新連線仍會被標記；請觀察日誌、重新啟動閘道，若持續反覆斷線再重新連結。 |
| `status=408 Request Time-out` 循環 | 依序執行探測、檢查日誌、doctor，然後檢查閘道狀態 | 先修正主機連線能力／時序；若循環持續，請備份驗證資料並重新連結帳號。 |
| 回覆延遲數秒／數分鐘才抵達 | `openclaw doctor --fix` | 當確認過期的本機終端介面用戶端正在拖慢閘道事件迴圈時，Doctor 會將其停止。 |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀 | 最快檢查方式 | 修正方式 |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 執行 `/start` 但沒有可用的回覆流程 | `openclaw pairing list telegram` | 核准配對或變更私訊政策。 |
| 機器人在線上，但群組保持沉默 | 確認提及要求與機器人隱私模式 | 停用隱私模式以取得群組可見性，或提及機器人。 |
| 傳送失敗並出現網路錯誤 | 檢查日誌中的 Telegram API 呼叫失敗 | 修正通往 `api.telegram.org` 的 DNS／IPv6／代理路由。 |
| 啟動時回報 `getMe returned 401` | 檢查已設定的權杖來源 | 重新複製或產生 BotFather 權杖，並更新 `botToken`、`tokenFile` 或預設帳號的 `TELEGRAM_BOT_TOKEN`。 |
| 輪詢停滯或重新連線緩慢 | 使用 `openclaw logs --follow` 查看輪詢診斷資訊 | 升級；如果重新啟動是誤判，請調整 `pollingStallThresholdMs`。持續停滯仍表示代理／DNS／IPv6 有問題。 |
| 啟動時 `setMyCommands` 遭拒絕 | 檢查日誌中的 `BOT_COMMANDS_TOO_MUCH` | 減少外掛／Skills／自訂 Telegram 命令，或停用原生選單。 |
| 升級後允許清單封鎖了你 | `openclaw security audit` 與設定允許清單 | 執行 `openclaw doctor --fix`，或將 `@username` 替換為數字傳送者 ID。 |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀 | 最快檢查方式 | 修正方式 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 機器人在線上但未回覆伺服器訊息 | `openclaw channels status --probe` | 允許該伺服器／頻道，並確認訊息內容意圖已啟用。 |
| 群組訊息遭忽略 | 檢查日誌中因提及限制而捨棄訊息的記錄 | 提及機器人，或將伺服器／頻道的 `requireMention` 設為 `false`。 |
| 有輸入中／權杖用量，但沒有 Discord 訊息 | 檢查這是否為環境房間事件，或已選擇使用 `message_tool` 但模型遺漏 `message(action=send)` 的房間 | 檢查閘道詳細日誌中遭抑制的最終承載內容中繼資料、確認 `messages.groupChat.unmentionedInbound`、閱讀[環境房間事件](/zh-TW/channels/ambient-room-events)，或針對一般群組要求將 `messages.groupChat.visibleReplies` 維持為 `"automatic"`。 |
| 私訊回覆遺失 | `openclaw pairing list discord` | 核准私訊配對或調整私訊政策。 |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀 | 最快檢查方式 | 修正方式 |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket 模式已連線但沒有回應 | `openclaw channels status --probe` | 確認應用程式權杖、機器人權杖及必要範圍；使用 SecretRef 的設定中，請留意 `botTokenStatus`／`appTokenStatus = configured_unavailable`。 |
| 私訊遭封鎖 | `openclaw pairing list slack` | 核准配對或放寬私訊政策。 |
| 頻道訊息遭忽略 | 檢查 `groupPolicy` 與頻道允許清單 | 允許該頻道，或將政策切換為 `open`。 |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage

### iMessage 失敗特徵

| 症狀 | 最快檢查方式 | 修正方式 |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| 在非 macOS 系統上缺少 `imsg` 或執行失敗 | `openclaw channels status --probe --channel imessage` | 在執行「訊息」的 Mac 上執行 OpenClaw，或為 `cliPath` 使用 SSH 包裝程式。 |
| 在 macOS 上可以傳送但無法接收 | 檢查 macOS 中「訊息」自動化的隱私權權限 | 重新授予 TCC 權限並重新啟動頻道程序。 |
| 私訊傳送者遭封鎖 | `openclaw pairing list imessage` | 核准配對或更新允許清單。 |

完整疑難排解：[iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀 | 最快檢查方式 | 修正方式 |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| 常駐程式可連線但機器人沒有回應 | `openclaw channels status --probe` | 確認 `signal-cli` 常駐程式的 URL／帳號與接收模式。 |
| 私訊遭封鎖 | `openclaw pairing list signal` | 核准傳送者或調整私訊政策。 |
| 群組回覆未觸發 | 檢查群組允許清單與提及模式 | 新增傳送者／群組，或放寬限制。 |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀 | 最快檢查方式 | 修正方式 |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| 機器人回覆「去了火星」 | 確認設定中的 `appId` 與 `clientSecret` | 設定憑證或重新啟動閘道。 |
| 沒有傳入訊息 | `openclaw channels status --probe` | 在 QQ 開放平台上確認憑證。 |
| 語音未轉錄 | 檢查語音轉文字提供者設定 | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。 |
| 主動訊息未送達 | 檢查 QQ 平台的互動要求 | 若近期沒有互動，QQ 可能會封鎖由機器人主動發起的訊息。 |

完整疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀 | 最快速的檢查方式 | 修正方式 |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登入但忽略聊天室訊息 | `openclaw channels status --probe` | 檢查 `groupPolicy`、聊天室允許清單及提及閘控。 |
| 私訊未獲處理 | `openclaw pairing list matrix` | 核准傳送者或調整私訊政策。 |
| 加密聊天室失敗 | `openclaw matrix verify status` | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。 |
| 備份還原擱置中或失敗 | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用復原金鑰重新執行。 |
| 交叉簽署／啟動程序看似異常 | `openclaw matrix verify bootstrap` | 一次修復祕密儲存空間、交叉簽署及備份狀態。 |

完整設定與組態：[Matrix](/zh-TW/channels/matrix)

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [頻道路由](/zh-TW/channels/channel-routing)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
