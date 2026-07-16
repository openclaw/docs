---
read_when:
    - 你想要將 OpenClaw 連接至 QQ
    - 你需要設定 QQ Bot 認證資訊
    - 你想要 QQ Bot 群組或私訊聊天支援
summary: QQ Bot 設定、組態與使用方式
title: QQ Bot
x-i18n:
    generated_at: "2026-07-16T11:26:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket 閘道）連接至 OpenClaw。
C2C 私人聊天與群組 `@` 提及是主要聊天類型，並支援豐富的
媒體（圖片、語音、影片、檔案）。公會頻道訊息僅支援
文字與遠端 URL 圖片；公會頻道不支援語音、影片、檔案上傳及本機/Base64
圖片。所有情境皆不支援表情回應與討論串。

狀態：官方可下載外掛。

## 安裝

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ 開放平台](https://q.qq.com/)，並使用手機
   QQ 掃描 QR Code 以註冊／登入。
2. 按一下 **Create Bot** 以建立新的 QQ Bot。
3. 在 Bot 的設定頁面找到 **AppID** 與 **AppSecret**，然後複製它們。

<Note>
AppSecret 不會以純文字儲存。若未儲存便離開頁面，你必須重新產生一組新的 AppSecret。
</Note>

4. 新增頻道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重新啟動閘道。

互動式設定：

```bash
openclaw channels add
```

精靈也提供 QR Code 綁定，作為手動輸入 AppID/AppSecret
的替代方式：使用與目標 QQ Bot 綁定的手機應用程式掃描代碼，即可完成
綁定。OpenClaw 會將傳回的認證資訊保存於該帳號的設定
範圍內。

## 配置

最小配置：

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

預設帳號環境變數（僅限頂層帳號）：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

檔案型 AppSecret：

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

環境變數 SecretRef AppSecret：

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

- `openclaw channels add --channel qqbot --token-file ...` 僅設定 AppSecret；
  `appId` 必須已在配置或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 接受純文字字串、檔案路徑（`clientSecretFile`）
  或結構化 SecretRef 物件。
- 舊版 `secretref:...`／`secretref-env:...` 標記字串不可用於
  `clientSecret`；請改用結構化 SecretRef 物件。

### 串流

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // 區塊串流："partial"（預設）或 "off"
        nativeTransport: true, // 對私訊使用 QQ 官方的 C2C stream_messages API
      },
    },
  },
}
```

- `streaming.mode: "off"` 會停用該帳號的區塊串流。
- `streaming.nativeTransport: true` 透過 QQ 官方的
  `stream_messages` API 串流 C2C（私訊）回覆；群組／頻道目標不受影響。
- 舊版 `streaming: true|false` 純量值及 `streaming.c2cStreamApi` 鍵
  會透過 `openclaw doctor --fix` 移轉為此結構。
- `/bot-streaming on|off` 可從私訊切換相同配置。

### 存取政策

- `allowFrom`／`groupAllowFrom` 限制誰能在 C2C／
  群組情境中與 Bot 聊天。`dmPolicy`／`groupPolicy`（`open` | `allowlist` | `disabled`）
  控制強制執行模式。當 `allowFrom` 包含具體（非萬用字元）項目時，
  `dmPolicy` 預設為 `allowlist`，否則為 `open`。
  當 `groupAllowFrom` 或 `allowFrom` 任一者包含具體項目時，
  `groupPolicy` 預設為 `allowlist`，否則為 `open`。
- 「認證：允許清單」斜線命令要求 `allowFrom`
  （群組呼叫則為 `groupAllowFrom`）中必須有明確的非萬用字元項目，
  無論 `dmPolicy`／`groupPolicy` 為何皆是如此——請參閱[斜線命令](#slash-commands)。

### 多帳號設定

在單一 OpenClaw 執行個體中執行多個 QQ Bot：

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

每個帳號都有隔離的 WebSocket 連線、API 用戶端與權杖
快取，並以 `appId` 為索引鍵。記錄行會標示所屬帳號 ID，因此
在一個閘道下執行多個 Bot 時，各項診斷資訊仍可彼此區分。

透過命令列介面新增第二個 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

群組支援使用 QQ 群組 OpenID，而非顯示名稱。將 Bot 加入
群組，然後提及它，或將群組配置為不需要提及即可執行。

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

`groups["*"]` 會設定所有群組的預設值；具體的 `groups.GROUP_OPENID`
項目會覆寫單一群組的這些預設值。群組設定：

| 欄位                  | 預設值           | 說明                                                                                               |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Bot 回覆前需要 `@` 提及。                                                           |
| `commandLevel`        | `all`            | 可在群組中執行哪些內建斜線命令（請見下文）。                                                       |
| `ignoreOtherMentions` | `false`          | 丟棄提及其他人但未提及 Bot 的訊息。                                                                |
| `historyLimit`        | `50`             | 保留近期未提及 Bot 的訊息，作為下一次提及 Bot 回合的情境。`0` 會停用歷史記錄。      |
| `tools`               | —                | 允許／拒絕整個群組使用工具。                                                                       |
| `toolsBySender`       | —                | 各傳送者的工具覆寫；請參閱[群組](/zh-TW/channels/groups#groupchannel-tool-restrictions-optional)。       |
| `name`                | OpenID 前綴      | 用於記錄及群組情境的易讀標籤。                                                                     |
| `prompt`              | 內建預設值       | 附加至代理程式情境的各群組行為提示詞。                                                             |

`commandLevel` 接受：

| 層級     | 行為                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 現有內建命令仍可使用。部分命令會從選單隱藏，但獲授權的使用者仍可在群組中執行它們。                                                            |
| `safety` | `/help`、`/btw`、`/stop` 在群組中仍然可見；敏感命令（`/config`、`/tools`、`/bash` 等）必須在私人聊天中執行。 |
| `strict` | 僅允許嚴格操作所需的群組工作階段控制。`/stop` 仍可運作，因此獲授權的傳送者可以中斷進行中的執行。                                    |

舊版 QQ Bot `toolPolicy` 項目已淘汰。請執行 `openclaw doctor --fix`，將它們移轉至 `tools`。

啟用模式為 `mention` 與 `always`。`requireMention: true` 對應至
`mention`；`requireMention: false` 對應至 `always`。若存在工作階段層級的啟用
覆寫，則其優先於配置。

輸入佇列依各對等端分開。群組對等端的佇列上限較大（50，相較於直接
對等端的 20）；佇列已滿時，會優先逐出 Bot 編寫的訊息，再逐出人類訊息，
並將一連串一般群組訊息合併為一個標明傳送者的回合。斜線
命令會逐一執行，不受任何合併批次影響。

### 語音（STT／TTS）

STT 與 TTS 支援具有優先回退機制的兩層配置：

| 設定 | 外掛專用                                                 | 框架回退                      |
| ---- | -------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]`            |
| TTS  | `channels.qqbot.tts`、`channels.qqbot.accounts.<id>.tts`                  | `messages.tts`            |

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

將任一者的 `enabled: false` 設為停用。帳號層級的 TTS 覆寫使用與
`messages.tts` 相同的結構，並深度合併於頻道／全域 TTS 配置之上。

STT 請求預設於 60 秒後逾時。外掛專用 STT 使用所選的
`models.providers.<id>.timeoutSeconds` 覆寫。框架音訊 STT
依序使用 `tools.media.audio.models[0].timeoutSeconds`、
`tools.media.audio.timeoutSeconds`，最後使用所選的提供者覆寫。

傳入的 QQ 語音附件會以音訊媒體中繼資料的形式提供給代理程式，
同時避免將原始語音檔案放入通用 `MediaPaths`。當已配置
TTS 時，純文字回覆中的 `[[audio_as_voice]]` 會合成 TTS 並傳送原生 QQ 語音訊息。

也可以使用 `channels.qqbot.audioFormatPolicy` 調整
傳出音訊的上傳／轉碼行為：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                       | 說明             |
| -------------------------- | ---------------- |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C）  |
| `qqbot:group:GROUP_OPENID`         | 群組聊天         |
| `qqbot:channel:CHANNEL_ID`         | 公會頻道         |

<Note>
每個 Bot 都有自己的一組使用者 OpenID。由 Bot A 收到的 OpenID **無法**用於透過 Bot B 傳送訊息。
</Note>

## 斜線命令

在進入 AI 佇列前攔截的內建命令：

| 命令                 | 驗證       | 範圍         | 說明                                                                           |
| -------------------- | ---------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —          | 任何範圍     | 延遲測試                                                                       |
| `/bot-help`          | —          | 任何範圍     | 列出所有命令                                                                   |
| `/bot-me`            | —          | 僅限私人聊天 | 顯示傳送者的 QQ 使用者 ID（openid），以設定 `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —          | 僅限私人聊天 | 顯示 OpenClaw 框架版本和外掛版本                                               |
| `/bot-upgrade`       | —          | 僅限私人聊天 | 顯示 QQ Bot 升級指南連結                                                       |
| `/bot-approve`       | 允許清單   | 僅限私人聊天 | 管理命令執行核准設定（開啟 / 關閉 / 永遠 / 重設 / 狀態）                      |
| `/bot-logs`          | 允許清單   | 僅限私人聊天 | 將最近的閘道日誌匯出為檔案                                                     |
| `/bot-clear-storage` | 允許清單   | 僅限私人聊天 | 刪除 QQ Bot 媒體目錄下的快取下載項目                                           |
| `/bot-streaming`     | 允許清單   | 僅限私人聊天 | 切換 C2C 串流回覆                                                              |
| `/bot-group-allways` | 允許清單   | 僅限私人聊天 | 切換預設群組啟用模式（必須提及或永遠開啟）                                     |

在任何命令後附加 `?`，即可查看使用說明（例如 `/bot-upgrade ?`）。

「驗證：允許清單」命令還要求傳送者的 openid 位於明確且不含萬用字元的
`allowFrom` 清單中（群組發出的命令以 `groupAllowFrom` 為優先，
若未設定則回退至 `allowFrom`）。萬用字元
`allowFrom: ["*"]` 允許聊天，但不允許使用這些命令。在私人聊天之外執行其中一項命令，
或未經授權時，系統會傳回提示，而不會無聲地捨棄訊息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 僅限私人聊天，但不
要求允許清單——任何 C2C 傳送者皆可執行。

QQ Bot 執行核准使用預設的同一聊天回退機制時，原生核准
按鈕點擊會遵循相同的明確且不含萬用字元的命令允許清單。若要
只授予核准權限而不授予更廣泛的命令權限，請設定
`channels.qqbot.execApprovals.approvers`。原生執行核准預設為
啟用。

## 媒體與儲存空間

- 輸入、輸出及閘道橋接媒體共用 `~/.openclaw/media/qqbot` 下的一個承載資料根目錄
  （若有設定則遵循 `OPENCLAW_HOME`），因此上傳、
  下載及轉碼快取都會保留在同一個受保護的目錄下。
- C2C 和群組目標的豐富媒體傳送會經由單一 `sendMedia`
  路徑。大小為 5&nbsp;MiB 以上的本機檔案和記憶體內緩衝區會使用 QQ 的
  分塊上傳端點；較小的承載資料及遠端 URL/Base64 來源則使用
  單次上傳 API。
- 如果熱升級在閘道完成寫入
  `openclaw.json` 前將其中斷，外掛會在下次啟動時，從內部快照還原該帳號最後已知的
  `appId` / `clientSecret`（絕不
  覆寫刻意進行的設定變更），因此不需要重新掃描 QR Code。

## 疑難排解

- **閘道未啟動 / 沒有輸入訊息：**請確認 `appId` 和
  `clientSecret` 正確無誤，且機器人已在 QQ Open Platform 上啟用。
  缺少認證資訊時會顯示「QQBot 未設定（缺少 appId 或
  clientSecret）」。
- **使用 `--token-file` 設定後仍顯示未設定：**`--token-file` 只會
  設定 AppSecret。仍必須在設定或 `QQBOT_APP_ID` 中設定 `appId`。
- **突發的群組回覆發生衝突：**當某個對等端的佇列已滿時，輸入佇列會優先逐出
  機器人撰寫的訊息，而不是人類撰寫的訊息，並將突發的一般（非命令）群組訊息合併成
  一個已標示來源的回合，因此大量機器人對話不應使人類訊息無法獲得處理。
- **主動訊息未送達：**如果使用者最近沒有互動，QQ 可能會封鎖由機器人發起的訊息。
- **語音未轉錄：**請確認已設定 STT，且可連線至提供者。

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
