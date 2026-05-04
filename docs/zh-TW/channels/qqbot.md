---
read_when:
    - 你想將 OpenClaw 連接到 QQ
    - 你需要設定 QQ Bot 憑證
    - 你想要 QQ Bot 群組或私人聊天支援
summary: QQ 機器人設定、組態與使用方式
title: QQ 機器人
x-i18n:
    generated_at: "2026-05-04T02:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket gateway）連接到 OpenClaw。此 Plugin 支援 C2C 私人聊天、群組 @訊息，以及具備豐富媒體（圖片、語音、影片、檔案）的 guild 頻道訊息。

狀態：可下載 Plugin。支援直接訊息、群組聊天、guild 頻道和媒體。不支援 reactions 與 threads。

## 安裝

設定前先安裝 QQ Bot：

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ Open Platform](https://q.qq.com/)，並用手機 QQ 掃描 QR code 以註冊 / 登入。
2. 點選 **Create Bot** 建立新的 QQ bot。
3. 在 bot 的設定頁面找到 **AppID** 與 **AppSecret**，並複製它們。

> AppSecret 不會以明文儲存——如果你在未儲存的情況下離開頁面，
> 就必須重新產生一個新的 AppSecret。

4. 新增頻道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重新啟動 Gateway。

互動式設定路徑：

```bash
openclaw channels add
openclaw configure --section channels
```

## 設定組態

最小組態：

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

檔案支援的 AppSecret：

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

環境 SecretRef AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

注意事項：

- 環境後援僅適用於預設 QQ Bot 帳號。
- `openclaw channels add --channel qqbot --token-file ...` 只提供 AppSecret；AppID 必須已在組態或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 也接受 SecretRef 輸入，不只接受明文字串。
- 舊版 `secretref:/...` 標記字串不是有效的 `clientSecret` 值；請使用如上例的結構化 SecretRef 物件。

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

每個帳號都會啟動自己的 WebSocket 連線，並維護獨立的 token 快取（依 `appId` 隔離）。

透過 CLI 新增第二個 bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

QQ Bot 群組聊天支援使用 QQ 群組 OpenID，而不是顯示名稱。將 bot 加入群組，然後提及它，或將群組設定為不需要提及即可執行。

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

`groups["*"]` 會為每個群組設定預設值，而具體的 `groups.GROUP_OPENID` 項目會覆寫單一群組的那些預設值。群組設定包含：

- `requireMention`：要求先 @mention，bot 才會回覆。預設值：`true`。
- `ignoreOtherMentions`：捨棄提及其他人但未提及 bot 的訊息。
- `historyLimit`：保留最近未提及 bot 的群組訊息，作為下一個被提及回合的上下文。設為 `0` 可停用。
- `toolPolicy`：群組範圍工具使用 `full`、`restricted` 或 `none`。
- `name`：用於記錄檔和群組上下文的友善標籤。
- `prompt`：附加到 agent 上下文的每群組行為提示。

啟用模式為 `mention` 與 `always`。`requireMention: true` 對應到 `mention`；`requireMention: false` 對應到 `always`。若存在工作階段層級的啟用覆寫，則優先於組態。

傳入佇列以每個 peer 為單位。群組 peer 會取得較大的佇列上限，在佇列已滿時讓人類訊息優先於 bot 撰寫的聊天內容，並將一般群組訊息的突發量合併成一個具歸屬的回合。Slash commands 仍會逐一執行。

### 語音（STT / TTS）

STT 與 TTS 支援具備優先順序後援的兩層組態：

| 設定 | Plugin 專屬                                            | Framework 後援               |
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
        "qq-main": {
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

在任一項目上設定 `enabled: false` 可停用。
帳號層級 TTS 覆寫使用與 `messages.tts` 相同的形狀，並深度合併到頻道 / 全域 TTS 組態之上。

傳入的 QQ 語音附件會作為音訊媒體 metadata 暴露給 agents，同時避免原始語音檔進入通用 `MediaPaths`。當已設定 TTS 時，`[[audio_as_voice]]` 純文字回覆會合成 TTS，並傳送原生 QQ 語音訊息。

也可以用 `channels.qqbot.audioFormatPolicy` 調整傳出音訊上傳 / 轉碼行為：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                     | 說明        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C） |
| `qqbot:group:GROUP_OPENID` | 群組聊天         |
| `qqbot:channel:CHANNEL_ID` | Guild 頻道      |

> 每個 bot 都有自己的使用者 OpenID 集合。Bot A 收到的 OpenID **不能**
> 用來透過 Bot B 傳送訊息。

## Slash commands

進入 AI 佇列前攔截的內建命令：

| 命令        | 說明                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延遲測試                                                                                             |
| `/bot-version` | 顯示 OpenClaw framework 版本                                                                      |
| `/bot-help`    | 列出所有命令                                                                                        |
| `/bot-me`      | 顯示傳送者的 QQ 使用者 ID（openid），用於 `allowFrom`/`groupAllowFrom` 設定                             |
| `/bot-upgrade` | 顯示 QQBot 升級指南連結                                                                        |
| `/bot-logs`    | 將最近的 gateway 記錄匯出為檔案                                                                     |
| `/bot-approve` | 透過原生流程核准待處理的 QQ Bot 動作（例如確認 C2C 或群組上傳）。 |

在任何命令後附加 `?` 可查看使用說明（例如 `/bot-upgrade ?`）。

管理員命令（`/bot-me`、`/bot-upgrade`、`/bot-logs`、`/bot-clear-storage`、`/bot-streaming`、`/bot-approve`）僅限直接訊息使用，且要求傳送者的 openid 位於明確、非萬用字元的 `allowFrom` 清單中。萬用字元 `allowFrom: ["*"]` 允許聊天，但不授予管理員命令存取權。群組訊息會先比對 `groupAllowFrom`，再後援到 `allowFrom`。在群組中執行管理員命令會傳回提示，而不是無聲捨棄。

## 引擎架構

QQ Bot 以 Plugin 內自成一體的引擎形式提供：

- 每個帳號都擁有依 `appId` 鍵控的隔離資源堆疊（WebSocket 連線、API client、token 快取、媒體儲存根目錄）。帳號絕不共用傳入 / 傳出狀態。
- 多帳號 logger 會用擁有該記錄列的帳號標記記錄列，讓你在單一 gateway 下執行多個 bot 時仍可分開診斷。
- 傳入、傳出與 gateway bridge 路徑會共用 `~/.openclaw/media` 下的單一媒體 payload 根目錄，因此上傳、下載與轉碼快取會落在一個受保護的目錄下，而不是每個子系統各自一棵目錄樹。
- 豐富媒體傳遞會針對 C2C 與群組目標經由單一 `sendMedia` 路徑。大於大型檔案閾值的本機檔案與 buffers 會使用 QQ 的分塊上傳端點，較小 payload 則使用一次性媒體 API。
- 認證可作為標準 OpenClaw 認證 snapshot 的一部分備份與還原；引擎會在還原時重新附加每個帳號的資源堆疊，而不需要重新進行 QR-code 配對。

## QR-code onboarding

作為手動貼上 `AppID:AppSecret` 的替代方式，引擎支援 QR-code onboarding 流程，用於將 QQ Bot 連結到 OpenClaw：

1. 執行 QQ Bot 設定路徑（例如 `openclaw channels add --channel qqbot`），並在提示時選擇 QR-code 流程。
2. 使用綁定目標 QQ Bot 的手機 app 掃描產生的 QR code。
3. 在手機上核准配對。OpenClaw 會將傳回的認證保存在正確帳號範圍下的 `credentials/` 中。

由 bot 本身產生的核准提示（例如 QQ Bot API 暴露的「允許此動作？」流程）會顯示為原生 OpenClaw 提示，你可以用 `/bot-approve` 接受，而不是透過原始 QQ client 回覆。

## 疑難排解

- **Bot 回覆「gone to Mars」：** 認證尚未設定或 Gateway 尚未啟動。
- **沒有傳入訊息：** 確認 `appId` 與 `clientSecret` 正確，且 bot 已在 QQ Open Platform 上啟用。
- **重複自我回覆：** OpenClaw 會將 QQ 傳出 ref indexes 記錄為 bot-authored，並忽略目前 `msgIdx` 與同一 bot 帳號相符的傳入事件。這會防止平台 echo loops，同時仍允許使用者引用或回覆先前的 bot 訊息。
- **使用 `--token-file` 設定後仍顯示未設定：** `--token-file` 只會設定 AppSecret。你仍需要在組態或 `QQBOT_APP_ID` 中設定 `appId`。
- **主動訊息未送達：** 如果使用者最近沒有互動，QQ 可能會攔截 bot 主動發起的訊息。
- **語音未轉錄：** 確認已設定 STT，且 provider 可連線。

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
