---
read_when:
    - 您想要將 OpenClaw 連接到 QQ
    - 你需要設定 QQ Bot 憑證
    - 你需要 QQ Bot 群組或私人聊天支援
summary: QQ Bot 的設定、組態與使用方式
title: QQ 機器人
x-i18n:
    generated_at: "2026-05-03T21:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 471c24110bf0ab8896d22f5bb5932ac4e03ff5169560c99ba6b9d1ca4025d9a8
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket gateway）連接到 OpenClaw。此 Plugin 支援 C2C 私人聊天、群組 @訊息，以及含豐富媒體（圖片、語音、影片、檔案）的 guild 頻道訊息。

狀態：可下載的 Plugin。支援直接訊息、群組聊天、guild 頻道和媒體。不支援反應和討論串。

## 安裝

設定前先安裝 QQ Bot：

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ Open Platform](https://q.qq.com/)，並用手機 QQ 掃描 QR code 以註冊 / 登入。
2. 點擊 **Create Bot** 以建立新的 QQ bot。
3. 在 bot 的設定頁面找到 **AppID** 和 **AppSecret** 並複製。

> AppSecret 不會以明文儲存 — 如果你未儲存就離開頁面，
> 就必須重新產生新的 AppSecret。

4. 新增 channel：

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

- 環境變數後援只套用於預設 QQ Bot 帳號。
- `openclaw channels add --channel qqbot --token-file ...` 只提供
  AppSecret；AppID 必須已在設定中或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 也接受 SecretRef 輸入，不只接受明文字串。
- 舊版 `secretref:/...` 標記字串不是有效的 `clientSecret` 值；
  請使用如上例所示的結構化 SecretRef 物件。

### 多帳號設定

在單一 OpenClaw 執行個體下執行多個 QQ bot：

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

每個帳號都會啟動自己的 WebSocket 連線，並維護獨立的權杖快取（依 `appId` 隔離）。

透過 CLI 新增第二個 bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

QQ Bot 群組聊天支援使用 QQ 群組 OpenID，而不是顯示名稱。將 bot 新增到群組，然後提及它，或將群組設定為不需要提及即可執行。

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

`groups["*"]` 會為每個群組設定預設值，而具體的
`groups.GROUP_OPENID` 項目會覆寫單一群組的那些預設值。群組
設定包含：

- `requireMention`：要求 bot 回覆前必須先有 @提及。預設值：`true`。
- `ignoreOtherMentions`：捨棄提及其他人但未提及 bot 的訊息。
- `historyLimit`：保留最近的非提及群組訊息，作為下一次被提及回合的情境。設為 `0` 可停用。
- `toolPolicy`：群組範圍工具使用 `full`、`restricted` 或 `none`。
- `name`：用於日誌和群組情境的友善標籤。
- `prompt`：附加到代理情境的每群組行為提示。

啟用模式為 `mention` 和 `always`。`requireMention: true` 對應到
`mention`；`requireMention: false` 對應到 `always`。如果存在工作階段層級的啟用覆寫，則其優先於設定。

傳入佇列依對等方區分。群組對等方會取得較大的佇列上限，在佇列滿時會讓人類訊息排在 bot 撰寫的閒聊之前，並將一般群組訊息的突發量合併為一個具歸屬的回合。斜線指令仍會逐一執行。

### 語音（STT / TTS）

STT 和 TTS 支援具優先權後援的兩層設定：

| 設定 | Plugin 專用                                             | 框架後援                      |
| ---- | ------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                    | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
帳號層級 TTS 覆寫使用與 `messages.tts` 相同的形狀，並會在 channel/全域 TTS 設定之上進行深度合併。

傳入的 QQ 語音附件會以音訊媒體中繼資料形式公開給代理，同時讓原始語音檔案不進入通用 `MediaPaths`。當 TTS 已設定時，`[[audio_as_voice]]` 純文字回覆會合成 TTS 並傳送原生 QQ 語音訊息。

傳出音訊上傳/轉碼行為也可透過
`channels.qqbot.audioFormatPolicy` 調整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                       | 說明              |
| -------------------------- | ----------------- |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C）  |
| `qqbot:group:GROUP_OPENID` | 群組聊天          |
| `qqbot:channel:CHANNEL_ID` | Guild channel     |

> 每個 bot 都有自己的使用者 OpenID 集合。Bot A 收到的 OpenID **不能**
> 用來透過 Bot B 傳送訊息。

## 斜線指令

在 AI 佇列之前攔截的內建指令：

| 指令           | 說明                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延遲測試                                                                                                 |
| `/bot-version` | 顯示 OpenClaw 框架版本                                                                                   |
| `/bot-help`    | 列出所有指令                                                                                             |
| `/bot-me`      | 顯示傳送者的 QQ 使用者 ID（openid），用於 `allowFrom`/`groupAllowFrom` 設定                              |
| `/bot-upgrade` | 顯示 QQBot 升級指南連結                                                                                  |
| `/bot-logs`    | 將近期 gateway 日誌匯出為檔案                                                                            |
| `/bot-approve` | 透過原生流程核准待處理的 QQ Bot 動作（例如確認 C2C 或群組上傳）。                                       |

在任何指令後附加 `?` 可取得使用說明（例如 `/bot-upgrade ?`）。

管理員指令（`/bot-me`、`/bot-upgrade`、`/bot-logs`、`/bot-clear-storage`、`/bot-streaming`、`/bot-approve`）僅限直接訊息使用，且要求傳送者的 openid 位於明確的非萬用字元 `allowFrom` 清單中。萬用字元 `allowFrom: ["*"]` 允許聊天，但不授予管理員指令存取權。群組訊息會先比對 `groupAllowFrom`，再後援到 `allowFrom`。在群組中執行管理員指令會傳回提示，而不是靜默捨棄。

## 引擎架構

QQ Bot 以 Plugin 內自含引擎的形式提供：

- 每個帳號都擁有依 `appId` 作為鍵的隔離資源堆疊（WebSocket 連線、API 用戶端、權杖快取、媒體儲存根目錄）。帳號之間絕不共用傳入/傳出狀態。
- 多帳號日誌器會用所屬帳號標記日誌行，因此當你在一個 gateway 下執行多個 bot 時，診斷資訊仍可分開檢視。
- 傳入、傳出和 gateway bridge 路徑共用 `~/.openclaw/media` 下的單一媒體承載根目錄，因此上傳、下載和轉碼快取會落在一個受保護的目錄下，而不是個別子系統的樹狀目錄。
- 豐富媒體傳遞會針對 C2C 和群組目標通過單一 `sendMedia` 路徑。本機檔案和超過大型檔案閾值的緩衝區會使用 QQ 的分塊上傳端點，較小的承載則使用一次性媒體 API。
- 認證可作為標準 OpenClaw 認證快照的一部分備份與還原；還原時，引擎會重新附加每個帳號的資源堆疊，而不需要新的 QR code 配對。

## QR-code 上線設定

除了手動貼上 `AppID:AppSecret`，引擎也支援 QR-code 上線設定流程，用於將 QQ Bot 連結到 OpenClaw：

1. 執行 QQ Bot 設定路徑（例如 `openclaw channels add --channel qqbot`），並在提示時選擇 QR-code 流程。
2. 使用綁定目標 QQ Bot 的手機應用程式掃描產生的 QR code。
3. 在手機上核准配對。OpenClaw 會將傳回的認證持久化到正確帳號範圍下的 `credentials/`。

由 bot 自身產生的核准提示（例如 QQ Bot API 暴露的「允許此動作？」流程）會呈現為原生 OpenClaw 提示，你可以使用 `/bot-approve` 接受，而不是透過原始 QQ 用戶端回覆。

## 疑難排解

- **Bot 回覆「gone to Mars」：** 認證未設定或 Gateway 未啟動。
- **沒有傳入訊息：** 確認 `appId` 和 `clientSecret` 正確，
  且 bot 已在 QQ Open Platform 上啟用。
- **重複自我回覆：** OpenClaw 會將 QQ 傳出參考索引記錄為
  bot 撰寫，並忽略其目前 `msgIdx` 符合同一 bot 帳號的傳入事件。
  這會防止平台回音迴圈，同時仍允許使用者引用或回覆先前的 bot 訊息。
- **使用 `--token-file` 設定仍顯示未設定：** `--token-file` 只設定
  AppSecret。你仍需要在設定中或 `QQBOT_APP_ID` 中提供 `appId`。
- **主動訊息未送達：** 如果使用者最近沒有互動，QQ 可能會攔截 bot 主動發起的訊息。
- **語音未被轉錄：** 確認已設定 STT 且 provider 可連線。

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [Channel 疑難排解](/zh-TW/channels/troubleshooting)
