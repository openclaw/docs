---
read_when:
    - 你想要將 OpenClaw 連接到 QQ
    - 你需要設定 QQ Bot 認證資訊
    - 你想要 QQ Bot 群組或私人聊天支援
summary: QQ Bot 設定、配置與使用方式
title: QQ Bot
x-i18n:
    generated_at: "2026-07-12T14:18:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket 閘道）連線至 OpenClaw。
C2C 私人聊天與群組 `@` 提及是主要聊天類型，並支援豐富的
媒體內容（圖片、語音、影片、檔案）。頻道訊息僅支援
文字與遠端 URL 圖片；頻道不支援語音、影片、檔案上傳及本機/Base64
圖片。任何情境皆不支援表情回應與討論串。

狀態：官方可下載外掛。

## 安裝

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ 開放平台](https://q.qq.com/)，使用手機 QQ 掃描 QR Code
   以註冊／登入。
2. 按一下 **Create Bot** 以建立新的 QQ Bot。
3. 在 Bot 的設定頁面找到 **AppID** 與 **AppSecret**，並複製它們。

<Note>
AppSecret 不會以純文字儲存。如果未儲存就離開頁面，你必須重新產生一組新的 AppSecret。
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
的替代方式：使用與目標 QQ Bot 綁定的手機應用程式掃描 QR Code，即可完成
綁定。OpenClaw 會將傳回的認證資訊保存於該帳號的設定
範圍內。

## 配置

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

預設帳號環境變數（僅限頂層帳號）：

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

- `openclaw channels add --channel qqbot --token-file ...` 只會設定 AppSecret；
  `appId` 必須已在設定或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 接受純文字字串、檔案路徑（`clientSecretFile`）
  或結構化 SecretRef 物件。
- `clientSecret` 不接受舊版 `secretref:...`／`secretref-env:...`
  標記字串；請改用結構化 SecretRef 物件。

### 存取政策

- `allowFrom`／`groupAllowFrom` 控制誰可以在 C2C／
  群組情境中與 Bot 聊天。`dmPolicy`／`groupPolicy`（`open` | `allowlist` | `disabled`）
  控制強制執行模式。當 `allowFrom` 含有具體項目（非萬用字元）時，
  `dmPolicy` 預設為 `allowlist`，否則為 `open`。
  當 `groupAllowFrom` 或 `allowFrom` 任一者含有具體項目時，
  `groupPolicy` 預設為 `allowlist`，否則為 `open`。
- 無論 `dmPolicy`／`groupPolicy` 為何，“Auth: allowlist”斜線命令都要求
  `allowFrom` 中有明確的非萬用字元項目（群組呼叫則為 `groupAllowFrom`）；
  請參閱[斜線命令](#slash-commands)。

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

每個帳號都有獨立的 WebSocket 連線、API 用戶端與權杖
快取，並以 `appId` 作為索引鍵。記錄行會標記所屬帳號 ID，讓你在一個閘道下
執行多個 Bot 時，仍可分別進行診斷。

透過命令列介面新增第二個 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

群組支援使用 QQ 群組 OpenID，而非顯示名稱。將 Bot 新增至
群組後，提及它，或將群組設定為無須提及即可執行。

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
| `requireMention`      | `true`           | 要求先 `@` 提及 Bot，Bot 才會回覆。                                                                |
| `commandLevel`        | `all`            | 可在群組中執行哪些內建斜線命令（請見下方）。                                                       |
| `ignoreOtherMentions` | `false`          | 捨棄提及其他人但未提及 Bot 的訊息。                                                                |
| `historyLimit`        | `50`             | 保留最近未提及 Bot 的訊息，作為下一個提及回合的情境。`0` 會停用歷史記錄。                          |
| `tools`               | —                | 為整個群組允許／拒絕工具。                                                                         |
| `toolsBySender`       | —                | 依傳送者覆寫工具；請參閱[群組](/zh-TW/channels/groups#groupchannel-tool-restrictions-optional)。         |
| `name`                | openid 前綴      | 用於記錄與群組情境的易讀標籤。                                                                     |
| `prompt`              | 內建預設值       | 附加至代理程式情境的個別群組行為提示詞。                                                           |

`commandLevel` 可接受：

| 層級     | 行為                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 現有的內建命令維持可用。部分命令仍會在選單中隱藏，但已獲授權的使用者仍可在群組中執行。                                                        |
| `safety` | `/help`、`/btw`、`/stop` 在群組中保持可見；敏感命令（`/config`、`/tools`、`/bash` 等）必須在私人聊天中執行。                                    |
| `strict` | 僅允許嚴格運作所需的群組工作階段控制命令。`/stop` 仍可使用，因此已獲授權的傳送者可以中斷進行中的執行。                                         |

舊版 QQ Bot `toolPolicy` 項目已停用。執行 `openclaw doctor --fix` 將其遷移至 `tools`。

啟用模式為 `mention` 與 `always`。`requireMention: true` 對應至
`mention`；`requireMention: false` 對應至 `always`。若存在工作階段層級的啟用
覆寫，則其優先於設定。

輸入佇列以對端為單位。群組對端有較大的佇列上限（50，相較於
直接對端的 20）；佇列已滿時，會先淘汰 Bot 所撰寫的訊息，再淘汰真人訊息，
並將連續出現的一般群組訊息合併為一個已標示來源的回合。斜線
命令會逐一執行，不受任何合併批次影響。

### 語音（STT／TTS）

STT 與 TTS 支援具有優先順序備援的兩層設定：

| 設定 | 外掛專用                                                 | 框架備援                      |
| ---- | -------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
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

將任一者設為 `enabled: false` 即可停用。帳號層級的 TTS 覆寫使用與
`messages.tts` 相同的結構，並深度合併至頻道／全域 TTS 設定之上。

STT 要求預設會在 60 秒後逾時。外掛專用 STT 使用所選
`models.providers.<id>.timeoutSeconds` 覆寫。框架音訊 STT
會依序使用 `tools.media.audio.models[0].timeoutSeconds`、
`tools.media.audio.timeoutSeconds`，再使用所選提供者的覆寫。

傳入的 QQ 語音附件會以音訊媒體中繼資料形式提供給代理程式，
同時避免原始語音檔進入一般 `MediaPaths`。當已設定
TTS 時，在純文字回覆中加入 `[[audio_as_voice]]`
會合成 TTS，並傳送原生 QQ 語音訊息。

也可以使用 `channels.qqbot.audioFormatPolicy`
調整傳出音訊的上傳／轉碼行為：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                       | 說明             |
| -------------------------- | ---------------- |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C）  |
| `qqbot:group:GROUP_OPENID` | 群組聊天         |
| `qqbot:channel:CHANNEL_ID` | 頻道             |

<Note>
每個 Bot 都有自己的一組使用者 OpenID。Bot A 收到的 OpenID **無法**用於透過 Bot B 傳送訊息。
</Note>

## 斜線命令

在進入 AI 佇列前攔截的內建命令：

| 命令                 | 授權      | 範圍       | 說明                                                                                     |
| -------------------- | --------- | ---------- | ---------------------------------------------------------------------------------------- |
| `/bot-ping`          | —         | 任何情境   | 延遲測試                                                                                 |
| `/bot-help`          | —         | 任何情境   | 列出所有命令                                                                             |
| `/bot-me`            | —         | 僅私人聊天 | 顯示傳送者的 QQ 使用者 ID（openid），供設定 `allowFrom`／`groupAllowFrom` 使用            |
| `/bot-version`       | —         | 僅私人聊天 | 顯示 OpenClaw 框架版本與外掛版本                                                         |
| `/bot-upgrade`       | —         | 僅私人聊天 | 顯示 QQ Bot 升級指南連結                                                                 |
| `/bot-approve`       | allowlist | 僅私人聊天 | 管理命令執行核准設定（on／off／always／reset／status）                                    |
| `/bot-logs`          | allowlist | 僅私人聊天 | 將近期閘道記錄匯出為檔案                                                                 |
| `/bot-clear-storage` | allowlist | 僅私人聊天 | 刪除 QQ Bot 媒體目錄下的快取下載項目                                                     |
| `/bot-streaming`     | allowlist | 僅私人聊天 | 切換 C2C 串流回覆                                                                        |
| `/bot-group-allways` | allowlist | 僅私人聊天 | 切換預設群組啟用模式（需要提及或永遠啟用）                                               |

在任何命令後附加 `?` 可查看用法說明（例如 `/bot-upgrade ?`）。

“Auth: allowlist”命令還要求傳送者的 openid 位於明確的非萬用字元
`allowFrom` 清單中（群組發出的命令以 `groupAllowFrom` 優先，
若無則退回使用 `allowFrom`）。萬用字元
`allowFrom: ["*"]` 允許聊天，但不允許這些命令。在私人聊天以外執行其中任一命令，
或在未獲授權的情況下執行，系統會傳回提示，而不會
直接捨棄訊息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 僅限私人聊天使用，但不需要
允許清單——任何 C2C 傳送者都可以執行它們。

當 QQ Bot 執行核准使用預設的同一聊天備援時，點擊原生核准
按鈕會遵循相同的明確非萬用字元命令允許清單。若要
只授予核准權限而不授予更廣泛的命令存取權，請設定
`channels.qqbot.execApprovals.approvers`。原生執行核准預設為
啟用。

## 媒體與儲存空間

- 傳入、傳出與閘道橋接媒體共用
  `~/.openclaw/media/qqbot` 下的單一承載資料根目錄（若已設定，則遵循 `OPENCLAW_HOME`），因此上傳、
  下載與轉碼快取都會保留在同一個受保護的目錄中。
- C2C 與群組目標的多媒體傳送會經由單一 `sendMedia`
  路徑。大小為 5&nbsp;MiB 以上的本機檔案與記憶體內緩衝區會使用 QQ 的
  分塊上傳端點；較小的承載資料以及遠端 URL/Base64 來源則使用
  單次上傳 API。
- 如果熱升級在閘道完成寫入
  `openclaw.json` 前將其中斷，外掛會在下次啟動時，從內部快照還原該帳號最後已知的 `appId` / `clientSecret`
  （絕不覆寫刻意進行的設定變更），因此不需要
  重新掃描 QR Code。

## 疑難排解

- **閘道未啟動／沒有傳入訊息：**請確認 `appId` 和
  `clientSecret` 正確，且機器人已在 QQ Open Platform 上啟用。
  缺少認證資訊時會顯示「QQBot 尚未設定（缺少 appId 或
  clientSecret）」。
- **使用 `--token-file` 設定後仍顯示尚未設定：**`--token-file` 只會
  設定 AppSecret。仍必須在設定或 `QQBOT_APP_ID` 中設定 `appId`。
- **突發的群組回覆發生衝突：**當對等端的佇列已滿時，傳入佇列會優先移除由機器人撰寫的
  訊息，而非人類撰寫的訊息，並將
  突發的一般（非命令）群組訊息合併為一個標示來源的對話回合，因此
  大量機器人對話不應導致人類訊息無法獲得處理。
- **主動訊息未送達：**如果使用者近期未曾互動，QQ 可能會封鎖由機器人主動發起的訊息。
- **語音未轉錄：**請確認已設定 STT，且可連線至提供者。

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
