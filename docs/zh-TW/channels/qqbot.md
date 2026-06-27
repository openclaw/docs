---
read_when:
    - 你想將 OpenClaw 連接到 QQ
    - 你需要 QQ Bot 憑證設定
    - 你想要 QQ Bot 群組或私人聊天支援
summary: QQ Bot 設定、組態與使用方式
title: QQ Bot
x-i18n:
    generated_at: "2026-06-27T18:57:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket 閘道）連接到 OpenClaw。此
外掛支援 C2C 私人聊天、群組 @訊息，以及含有豐富媒體（圖片、語音、影片、檔案）的公會頻道訊息。

狀態：可下載的外掛。支援私訊、群組聊天、公會頻道與
媒體。不支援反應與討論串。

## 安裝

設定前先安裝 QQ Bot：

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ 開放平台](https://q.qq.com/)，並用你的
   手機 QQ 掃描 QR 碼以註冊 / 登入。
2. 點擊 **建立 Bot** 以建立新的 QQ Bot。
3. 在 Bot 的設定頁找到 **AppID** 和 **AppSecret**，並複製它們。

> AppSecret 不會以明文儲存 — 如果你未儲存就離開頁面，
> 就必須重新產生一組新的。

4. 新增頻道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重新啟動閘道。

互動式設定路徑：

```bash
openclaw channels add
openclaw configure --section channels
```

## 設定檔

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

以檔案支援的 AppSecret：

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

Env SecretRef AppSecret：

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

- 環境變數後備僅套用於預設 QQ Bot 帳號。
- `openclaw channels add --channel qqbot --token-file ...` 只提供
  AppSecret；AppID 必須已在設定檔或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 也接受 SecretRef 輸入，而不只是明文字串。
- 舊版 `secretref:/...` 標記字串不是有效的 `clientSecret` 值；
  請使用如上例所示的結構化 SecretRef 物件。

### 多帳號設定

在單一 OpenClaw 執行個體下執行多個 QQ Bot：

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

每個帳號都會啟動自己的 WebSocket 連線，並維護獨立的
權杖快取（依 `appId` 隔離）。

透過命令列介面新增第二個 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

QQ Bot 群組聊天支援使用 QQ 群組 OpenID，而不是顯示名稱。將 Bot
加入群組，然後提及它，或將群組設定為不需提及即可執行。

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
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

- `requireMention`：要求 Bot 回覆前必須先有 @提及。預設值：`true`。
- `commandLevel`：控制哪些內建斜線命令可以在群組中執行。
  預設值：`all`，在省略此設定時會保留既有的 QQBot 群組行為。
- `ignoreOtherMentions`：捨棄提及其他人但未提及 Bot 的訊息。
- `historyLimit`：保留最近未提及的群組訊息，作為下一個被提及回合的情境。設為 `0` 可停用。
- `tools`：允許/拒絕整個群組的工具。
- `toolsBySender`：依傳送者覆寫群組工具；請參閱[群組](/zh-TW/channels/groups#groupchannel-tool-restrictions-optional)。
- `name`：用於記錄和群組情境的易讀標籤。
- `prompt`：附加到代理情境的各群組行為提示。

`commandLevel` 接受：

- `all`：讓可辨識的內建命令像以前一樣可用。某些命令可能
  仍會從選單中隱藏，但授權使用者仍可在群組中執行它們。
- `safety`：允許常見協作命令，例如 `/help`、`/btw` 和
  `/stop`；要求使用者在私人聊天中執行敏感命令，例如 `/config`、`/tools` 和
  `/bash`。
- `strict`：只允許嚴格群組
  操作所需的群組工作階段控制項。`/stop` 仍維持緊急狀態，因此授權傳送者可以中斷
  進行中的執行。

舊版 QQBot `toolPolicy` 項目已停用。執行 `openclaw doctor --fix` 可將它們遷移到 `tools`。

啟用模式為 `mention` 和 `always`。`requireMention: true` 對應到
`mention`；`requireMention: false` 對應到 `always`。若存在工作階段層級的啟用
覆寫，會優先於設定檔。

傳入佇列按對等端區分。群組對等端具有較大的佇列上限，在佇列已滿時會讓真人
訊息優先於 Bot 作者的閒聊，並將一般
群組訊息的突發合併為一個具歸屬的回合。斜線命令仍會逐一執行。

### 語音（STT / TTS）

STT 和 TTS 支援具優先順序後備的兩層設定：

| 設定 | 外掛專屬                                                 | 框架後備                      |
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

在任一項上設定 `enabled: false` 可停用。
帳號層級 TTS 覆寫使用與 `messages.tts` 相同的形狀，並深度合併
到頻道/全域 TTS 設定之上。

傳入的 QQ 語音附件會以音訊媒體中繼資料的形式公開給代理，同時
讓原始語音檔案不進入通用 `MediaPaths`。當已設定 TTS 時，`[[audio_as_voice]]` 純
文字回覆會合成 TTS，並傳送原生 QQ 語音訊息。

傳出音訊上傳/轉碼行為也可透過
`channels.qqbot.audioFormatPolicy` 調整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                       | 說明             |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C） |
| `qqbot:group:GROUP_OPENID` | 群組聊天         |
| `qqbot:channel:CHANNEL_ID` | 公會頻道         |

> 每個 Bot 都有自己的一組使用者 OpenID。Bot A 收到的 OpenID **不能**
> 用於透過 Bot B 傳送訊息。

## 斜線命令

在 AI 佇列前攔截的內建命令：

| 命令           | 說明                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | 延遲測試                                                                                                 |
| `/bot-version` | 顯示 OpenClaw 框架版本                                                                                   |
| `/bot-help`    | 列出所有命令                                                                                             |
| `/bot-me`      | 顯示傳送者的 QQ 使用者 ID（openid），用於 `allowFrom`/`groupAllowFrom` 設定                              |
| `/bot-upgrade` | 顯示 QQBot 升級指南連結                                                                                  |
| `/bot-logs`    | 將最近的閘道記錄匯出為檔案                                                                               |
| `/bot-approve` | 透過原生流程核准待處理的 QQ Bot 動作（例如確認 C2C 或群組上傳）。                                      |

將 `?` 附加到任何命令可取得用法說明（例如 `/bot-upgrade ?`）。

管理員命令（`/bot-me`、`/bot-upgrade`、`/bot-logs`、`/bot-clear-storage`、`/bot-streaming`、`/bot-approve`）僅限私訊，且要求傳送者的 openid 位於明確的非萬用字元 `allowFrom` 清單中。萬用字元 `allowFrom: ["*"]` 允許聊天，但不授予管理員命令存取權。群組訊息會先比對 `groupAllowFrom`，再後備到 `allowFrom`。在群組中執行管理員命令會回傳提示，而不是靜默捨棄。

當 QQ Bot exec 核准使用預設同聊天後備時，原生核准
按鈕點擊會遵循相同的明確非萬用字元命令允許清單。若要授予
僅核准的存取權而不提供更廣泛的命令存取權，請設定
`channels.qqbot.execApprovals.approvers`。

## 引擎架構

QQ Bot 在外掛內以自含式引擎形式提供：

- 每個帳號都擁有依 `appId` 作為鍵的隔離資源堆疊（WebSocket 連線、API 用戶端、權杖快取、媒體儲存根目錄）。帳號之間永遠不共用傳入/傳出狀態。
- 多帳號記錄器會以擁有帳號標記記錄行，因此當你在一個閘道下執行多個 Bot 時，診斷資訊仍能分開。
- 傳入、傳出和閘道橋接路徑會共用 `~/.openclaw/media` 下的單一媒體酬載根目錄，因此上傳、下載和轉碼快取會落在一個受防護的目錄下，而不是每個子系統各自一棵目錄樹。
- 豐富媒體傳遞會透過單一 `sendMedia` 路徑處理 C2C 和群組目標。超過大型檔案閾值的本機檔案和緩衝區會使用 QQ 的分塊上傳端點，而較小的酬載會使用一次性媒體 API。
- 認證資料可以作為標準 OpenClaw 認證快照的一部分進行備份與還原；引擎會在還原時重新附加每個帳號的資源堆疊，而不需要新的 QR 碼配對。

## QR 碼上線

除了手動貼上 `AppID:AppSecret`，引擎也支援 QR 碼上線流程，用於將 QQ Bot 連結到 OpenClaw：

1. 執行 QQ Bot 設定路徑（例如 `openclaw channels add --channel qqbot`），並在提示時選擇 QR 碼流程。
2. 使用綁定目標 QQ Bot 的手機應用程式掃描產生的 QR 碼。
3. 在手機上核准配對。OpenClaw 會將回傳的認證資料保存到正確帳號範圍下的 `credentials/`。

由 Bot 自身產生的核准提示（例如 QQ Bot API 所公開的「允許此動作？」流程）會以原生 OpenClaw 提示呈現，你可以用 `/bot-approve` 接受，而不是透過原始 QQ 用戶端回覆。

## 疑難排解

- **Bot 回覆「去了火星」：** 認證資料尚未設定，或閘道尚未啟動。
- **沒有傳入訊息：** 確認 `appId` 和 `clientSecret` 正確，且
  機器人已在 QQ 開放平台啟用。
- **重複自我回覆：** OpenClaw 會將 QQ 對外送出的參照索引記錄為
  機器人所發，並忽略目前 `msgIdx` 與同一個機器人帳號相符的傳入事件。
  這可防止平台回音迴圈，同時仍允許使用者引用或回覆先前的機器人訊息。
- **使用 `--token-file` 設定後仍顯示未設定：** `--token-file` 只會設定
  AppSecret。你仍需要在設定中提供 `appId`，或設定 `QQBOT_APP_ID`。
- **主動訊息未送達：** 如果使用者近期沒有互動，QQ 可能會攔截機器人發起的訊息。
- **語音未轉錄：** 確保 STT 已設定，且提供者可連線。

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
