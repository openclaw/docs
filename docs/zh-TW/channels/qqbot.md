---
read_when:
    - 您想要將 OpenClaw 連接到 QQ
    - 你需要設定 QQ Bot 憑證
    - 你想要 QQ Bot 群組或私聊支援
summary: QQ Bot 設定、組態與使用方式
title: QQ 機器人
x-i18n:
    generated_at: "2026-04-30T02:49:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket gateway）連接到 OpenClaw。此 Plugin 支援 C2C 私聊、群組 @訊息，以及頻道訊息，並支援豐富媒體（圖片、語音、影片、檔案）。

狀態：內建 Plugin。支援私訊、群組聊天、頻道和媒體。不支援反應和討論串。

## 內建 Plugin

目前的 OpenClaw 版本內建 QQ Bot，因此一般封裝建置不需要額外執行 `openclaw plugins install` 步驟。

## 設定

1. 前往 [QQ Open Platform](https://q.qq.com/)，並用手機 QQ 掃描 QR code 以註冊 / 登入。
2. 點擊 **Create Bot** 建立新的 QQ bot。
3. 在 bot 的設定頁面找到 **AppID** 和 **AppSecret**，並複製它們。

> AppSecret 不會以明文儲存，如果你未儲存就離開頁面，
> 就必須重新產生新的 AppSecret。

4. 加入 channel：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重新啟動 Gateway。

互動式設定路徑：

```bash
openclaw channels add
openclaw configure --section channels
```

## 設定

最小設定：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

預設帳號環境變數：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

以檔案提供的 AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

注意事項：

- 環境變數 fallback 只適用於預設 QQ Bot 帳號。
- `openclaw channels add --channel qqbot --token-file ...` 只提供
  AppSecret；AppID 必須已在 config 或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 也接受 SecretRef 輸入，而不只是明文字串。

### 多帳號設定

在單一 OpenClaw 實例下執行多個 QQ bot：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

每個帳號會啟動自己的 WebSocket 連線，並維護獨立的 token 快取（以 `appId` 隔離）。

透過 CLI 加入第二個 bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

QQ Bot 群組聊天支援使用 QQ 群組 OpenID，而不是顯示名稱。將 bot 加入群組，然後提及它，或設定群組讓它不需提及即可執行。

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` 會設定每個群組的預設值，而具體的
`groups.GROUP_OPENID` 項目會覆寫單一群組的這些預設值。群組設定包含：

- `requireMention`：bot 回覆前需要 @mention。預設值：`true`。
- `ignoreOtherMentions`：丟棄提及其他人但未提及 bot 的訊息。
- `historyLimit`：保留最近未提及 bot 的群組訊息，作為下一次被提及回合的情境。設為 `0` 可停用。
- `toolPolicy`：群組範圍工具的 `full`、`restricted` 或 `none`。
- `name`：用於日誌和群組情境的友善標籤。
- `prompt`：附加到 agent 情境的個別群組行為提示。

啟用模式為 `mention` 和 `always`。`requireMention: true` 對應到
`mention`；`requireMention: false` 對應到 `always`。若存在工作階段層級的啟用覆寫，則其優先於 config。

入站佇列以 peer 為單位。群組 peer 具有較大的佇列上限，佇列已滿時會讓人類訊息排在 bot 撰寫的聊天內容之前，並將一般群組訊息的突發串流合併成一個具署名的回合。斜線命令仍會逐一執行。

### 語音（STT / TTS）

STT 和 TTS 支援具有優先 fallback 的雙層設定：

| 設定 | Plugin 專屬                                          | Framework fallback            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

在任一項上設定 `enabled: false` 可停用。
帳號層級的 TTS 覆寫使用與 `messages.tts` 相同的形狀，並會深度合併到 channel/global TTS config 之上。

入站 QQ 語音附件會以音訊媒體中繼資料的形式公開給 agent，同時讓原始語音檔案不進入通用的 `MediaPaths`。當 TTS 已設定時，`[[audio_as_voice]]` 純文字回覆會合成 TTS 並傳送原生 QQ 語音訊息。

出站音訊上傳 / 轉碼行為也可使用
`channels.qqbot.audioFormatPolicy` 調整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                     | 說明        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私聊（C2C） |
| `qqbot:group:GROUP_OPENID` | 群組聊天         |
| `qqbot:channel:CHANNEL_ID` | 頻道      |

> 每個 bot 都有自己的使用者 OpenID 集合。Bot A 收到的 OpenID **不能**
> 用來透過 Bot B 傳送訊息。

## 斜線命令

在 AI 佇列前攔截的內建命令：

| 命令        | 說明                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延遲測試                                                                                             |
| `/bot-version` | 顯示 OpenClaw framework 版本                                                                      |
| `/bot-help`    | 列出所有命令                                                                                        |
| `/bot-upgrade` | 顯示 QQBot 升級指南連結                                                                        |
| `/bot-logs`    | 將最近的 gateway 日誌匯出為檔案                                                                     |
| `/bot-approve` | 透過原生流程核准待處理的 QQ Bot 動作（例如確認 C2C 或群組上傳）。 |

在任何命令後加上 `?` 可查看用法說明（例如 `/bot-upgrade ?`）。

## 引擎架構

QQ Bot 以 Plugin 內自包含引擎的形式提供：

- 每個帳號都擁有以 `appId` 作為索引鍵的隔離資源堆疊（WebSocket 連線、API client、token 快取、媒體儲存根目錄）。帳號絕不共享入站 / 出站狀態。
- 多帳號 logger 會以擁有帳號標記日誌行，因此在同一個 gateway 下執行多個 bot 時，診斷資訊仍可分開檢視。
- 入站、出站和 gateway bridge 路徑共用 `~/.openclaw/media` 下的單一媒體 payload 根目錄，因此上傳、下載和轉碼快取會落在同一個受保護目錄下，而不是分散在各子系統樹狀結構中。
- 豐富媒體傳送會透過單一 `sendMedia` 路徑送往 C2C 和群組目標。超過大檔案閾值的本機檔案和緩衝區會使用 QQ 的分塊上傳 endpoint，而較小的 payload 則使用一次性媒體 API。
- 認證可作為標準 OpenClaw 認證快照的一部分備份和還原；引擎會在還原時重新附加每個帳號的資源堆疊，不需要新的 QR-code 配對。

## QR-code onboarding

除了手動貼上 `AppID:AppSecret`，引擎也支援用於將 QQ Bot 連結到 OpenClaw 的 QR-code onboarding 流程：

1. 執行 QQ Bot 設定路徑（例如 `openclaw channels add --channel qqbot`），並在提示時選擇 QR-code 流程。
2. 使用綁定目標 QQ Bot 的手機 app 掃描產生的 QR code。
3. 在手機上核准配對。OpenClaw 會將回傳的認證保存到正確帳號範圍下的 `credentials/`。

由 bot 本身產生的核准提示（例如 QQ Bot API 公開的「允許此動作？」流程）會呈現為原生 OpenClaw 提示，你可以用 `/bot-approve` 接受，而不必透過原始 QQ client 回覆。

## 疑難排解

- **Bot 回覆「gone to Mars」：** 認證未設定或 Gateway 未啟動。
- **沒有入站訊息：** 驗證 `appId` 和 `clientSecret` 是否正確，且
  bot 已在 QQ Open Platform 上啟用。
- **重複自我回覆：** OpenClaw 會將 QQ 出站 ref index 記錄為
  bot 撰寫，並忽略目前 `msgIdx` 符合同一 bot 帳號的入站事件。這會防止平台回音迴圈，同時仍允許使用者引用或回覆先前的 bot 訊息。
- **使用 `--token-file` 設定後仍顯示未設定：** `--token-file` 只會設定
  AppSecret。你仍需要在 config 或 `QQBOT_APP_ID` 中設定 `appId`。
- **主動訊息未送達：** 如果使用者近期未互動，QQ 可能會攔截 bot 主動發起的訊息。
- **語音未轉錄：** 確認 STT 已設定，且 provider 可連線。

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [Channel 疑難排解](/zh-TW/channels/troubleshooting)
