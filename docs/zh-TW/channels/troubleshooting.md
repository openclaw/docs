---
read_when:
    - 頻道傳輸顯示已連線，但回覆失敗
    - 在深入查閱供應商文件之前，你需要先進行頻道專屬檢查
summary: 透過各頻道的故障特徵與修正方法，快速進行頻道層級疑難排解
title: 頻道疑難排解
x-i18n:
    generated_at: "2026-07-20T00:45:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3891595e4b5aca9de7997a6e908fa1c9246579032bfdfa1656a6992d644c3ecc
    source_path: channels/troubleshooting.md
    workflow: 16
---

當頻道能夠連線但行為異常時，請使用本頁面。

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

## 更新後

當 Telegram、iMessage、BlueBubbles 時期的設定或其他外掛頻道在更新後消失時，請使用以下命令。

```bash
openclaw status --all
openclaw doctor --fix
openclaw gateway restart
openclaw status --all
```

在 `openclaw
status --all` 中尋找 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`。這表示頻道已設定，但外掛設定／載入遇到損毀的相依性樹狀結構，而未能註冊頻道。`openclaw doctor --fix` 會清除過時的外掛執行階段相依性符號連結與過時的驗證陰影，接著 `openclaw gateway restart` 會重新載入乾淨狀態。

## WhatsApp

### WhatsApp 失敗特徵

| 症狀                                | 最快速的檢查                                          | 修正方式                                                                                                                   |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 已連線但沒有私訊回覆                | `openclaw pairing list whatsapp`                                  | 核准傳送者，或切換私訊政策／允許清單。                                                                                     |
| 群組訊息遭忽略                      | 檢查設定中的 `requireMention` 與提及模式           | 提及機器人，或放寬該群組的提及政策。                                                                                       |
| QR 登入逾時並顯示 408               | 檢查閘道的 `HTTPS_PROXY`／`HTTP_PROXY` 環境變數 | 設定可連線的 Proxy；僅在略過檢查時使用 `NO_PROXY`。                                                                |
| 隨機中斷連線／重新登入循環          | `openclaw channels status --probe` 與日誌                           | 即使目前已連線，近期的重新連線仍會被標記；請監看日誌、重新啟動閘道，若持續反覆中斷則重新連結。                               |
| `status=408 Request Time-out` 循環             | 依序進行探測、查看日誌、執行 doctor，再檢查閘道狀態 | 先修正主機連線能力／時間問題；若循環持續發生，請備份驗證資料並重新連結帳號。                                                |
| 回覆延遲數秒／數分鐘才送達          | `openclaw doctor --fix`                                  | 當確認過時的本機終端介面用戶端正在拖慢閘道事件迴圈時，Doctor 會將其停止。                                                    |

完整疑難排解：[WhatsApp 疑難排解](/zh-TW/channels/whatsapp#troubleshooting)

## Telegram

### Telegram 失敗特徵

| 症狀                                      | 最快速的檢查                                      | 修正方式                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `/start`，但沒有可用的回覆流程 | `openclaw pairing list telegram`                               | 核准配對或變更私訊政策。                                                                                                         |
| 機器人在線上，但群組維持靜默              | 確認提及要求與機器人隱私模式                      | 停用隱私模式以允許群組可見性，或提及機器人。                                                                                     |
| 因網路錯誤而傳送失敗                      | 檢查日誌中的 Telegram API 呼叫失敗                | 修正前往 `api.telegram.org` 的 DNS／IPv6／Proxy 路由。                                                                           |
| 啟動時回報 `getMe returned 401`            | 檢查已設定的 Token 來源                           | 重新複製或產生 BotFather Token，並更新 `botToken`、`tokenFile` 或預設帳號的 `TELEGRAM_BOT_TOKEN`。                    |
| 輪詢停滯或重新連線緩慢                    | `openclaw logs --follow` 以取得輪詢診斷資訊             | 升級；持續停滯通常代表 Proxy／DNS／IPv6 問題。                                                                                    |
| 啟動時拒絕 `setMyCommands`            | 檢查日誌中的 `BOT_COMMANDS_TOO_MUCH`                  | 減少外掛／Skill／自訂 Telegram 命令，或停用原生選單。                                                                             |
| 升級後允許清單封鎖了你                    | `openclaw security audit` 與設定允許清單                 | 執行 `openclaw doctor --fix`，或將 `@username` 替換為數字傳送者 ID。                                                           |

完整疑難排解：[Telegram 疑難排解](/zh-TW/channels/telegram#troubleshooting)

## Discord

### Discord 失敗特徵

| 症狀                                       | 最快速的檢查                                                                                                                     | 修正方式                                                                                                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 機器人在線上，但伺服器中沒有回覆           | `openclaw channels status --probe`                                                                                                               | 允許伺服器／頻道，並確認訊息內容 Intent。                                                                                                                                                                                       |
| 群組訊息遭忽略                             | 檢查日誌中因提及閘控而捨棄訊息的記錄                                                                                             | 提及機器人，或設定伺服器／頻道的 `requireMention: false`。                                                                                                                                                                          |
| 有輸入中／Token 使用量，但沒有 Discord 訊息 | 檢查這是否為環境房間事件，或模型漏掉 `message(action=send)` 的已選擇加入 `message_tool` 房間                                    | 檢查閘道詳細日誌中的已抑制最終承載資料中繼資料、確認 `messages.groupChat.unmentionedInbound`、閱讀[環境房間事件](/zh-TW/channels/ambient-room-events)，或針對一般群組要求保留 `messages.groupChat.visibleReplies: "automatic"`。 |
| 缺少私訊回覆                               | `openclaw pairing list discord`                                                                                                               | 核准私訊配對或調整私訊政策。                                                                                                                                                                                                   |

完整疑難排解：[Discord 疑難排解](/zh-TW/channels/discord#troubleshooting)

## Slack

### Slack 失敗特徵

| 症狀                                  | 最快速的檢查                                      | 修正方式                                                                                                                               |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Socket 模式已連線但沒有回應           | `openclaw channels status --probe`                               | 確認 App Token、Bot Token 與必要的 Scope；使用 SecretRef 的設定請留意 `botTokenStatus`／`appTokenStatus = configured_unavailable`。                         |
| 私訊遭封鎖                            | `openclaw pairing list slack`                               | 核准配對或放寬私訊政策。                                                                                                               |
| 頻道訊息遭忽略                        | 檢查 `groupPolicy` 與頻道允許清單           | 允許該頻道，或將政策切換為 `open`。                                                                                         |

完整疑難排解：[Slack 疑難排解](/zh-TW/channels/slack#troubleshooting)

## iMessage

### iMessage 失敗特徵

| 症狀                                          | 最快速的檢查                                                        | 修正方式                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 在非 macOS 上缺少 `imsg` 或執行失敗 | `openclaw channels status --probe --channel imessage`                                                  | 在執行 Messages 的 Mac 上執行 OpenClaw，或對 `cliPath` 使用 SSH 包裝函式。 |
| 可傳送但無法在 macOS 上接收                   | 檢查 macOS 對 Messages 自動化的隱私權限                             | 重新授予 TCC 權限並重新啟動頻道程序。                                      |
| 私訊傳送者遭封鎖                              | `openclaw pairing list imessage`                                                  | 核准配對或更新允許清單。                                                    |

完整疑難排解：[iMessage 疑難排解](/zh-TW/channels/imessage#troubleshooting)

## Signal

### Signal 失敗特徵

| 症狀                            | 最快速的檢查                                      | 修正方式                                                       |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| 可連線至常駐程式，但機器人無回應 | `openclaw channels status --probe`                               | 確認 `signal-cli` 常駐程式 URL／帳號與接收模式。          |
| 私訊遭封鎖                      | `openclaw pairing list signal`                               | 核准傳送者或調整私訊政策。                                     |
| 群組回覆未觸發                  | 檢查群組允許清單與提及模式                        | 新增傳送者／群組，或放寬閘控。                                 |

完整疑難排解：[Signal 疑難排解](/zh-TW/channels/signal#troubleshooting)

## QQ Bot

### QQ Bot 失敗特徵

| 症狀                              | 最快速的檢查                                      | 修正方式                                                     |
| --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| 機器人回覆「飛到火星去了」        | 確認設定中的 `appId` 與 `clientSecret` | 設定認證資訊或重新啟動閘道。                                 |
| 沒有傳入訊息                      | `openclaw channels status --probe`                               | 在 QQ 開放平台確認認證資訊。                                 |
| 語音未轉錄                        | 檢查 STT 供應商設定                               | 設定 `channels.qqbot.stt` 或 `tools.media.audio`。              |
| 主動訊息未送達                    | 檢查 QQ 平台互動要求                              | 若近期沒有互動，QQ 可能會封鎖由機器人主動傳送的訊息。         |

完整疑難排解：[QQ Bot 疑難排解](/zh-TW/channels/qqbot#troubleshooting)

## Matrix

### Matrix 失敗特徵

| 症狀                             | 最快速的檢查方式                          | 修正方式                                                                       |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| 已登入但忽略聊天室訊息 | `openclaw channels status --probe`     | 檢查 `groupPolicy`、聊天室允許清單及提及閘門。                  |
| 私訊未處理                  | `openclaw pairing list matrix`         | 核准傳送者或調整私訊政策。                                       |
| 加密聊天室失敗                | `openclaw matrix verify status`        | 重新驗證裝置，然後檢查 `openclaw matrix verify backup status`。  |
| 備份還原擱置中或已損壞    | `openclaw matrix verify backup status` | 執行 `openclaw matrix verify backup restore`，或使用復原金鑰重新執行。 |
| 交叉簽署／啟動程序看起來不正確 | `openclaw matrix verify bootstrap`     | 一次修復秘密儲存空間、交叉簽署及備份狀態。       |

完整設定與組態：[Matrix](/zh-TW/channels/matrix)

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [頻道路由](/zh-TW/channels/channel-routing)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
