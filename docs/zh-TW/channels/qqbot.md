---
read_when:
    - 你想要將 OpenClaw 連接至 QQ
    - 你需要設定 QQ Bot 認證資訊
    - 你想要 QQ Bot 群組或私人聊天支援
summary: QQ Bot 設定、組態與使用方式
title: QQ Bot
x-i18n:
    generated_at: "2026-07-22T10:25:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b185a2b1182471bbec3688b40fb72b671bdf3a2e8351aa6e2f7918f4f5936825
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket 閘道）連線至 OpenClaw。
C2C 私人聊天和群組 `@` 提及是主要的聊天類型，並支援豐富的
媒體（圖片、語音、影片、檔案）。頻道訊息僅支援
文字和遠端 URL 圖片；頻道中無法使用語音、影片、檔案上傳和本機/Base64
圖片。所有位置皆不支援表情回應和討論串。

狀態：官方可下載外掛。

## 安裝

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ 開放平台](https://q.qq.com/)，並使用手機 QQ 掃描 QR Code
   以註冊／登入。
2. 按一下 **Create Bot** 以建立新的 QQ Bot。
3. 在 Bot 的設定頁面找到 **AppID** 和 **AppSecret**，並複製它們。

<Note>
AppSecret 不會以純文字儲存。若未儲存便離開頁面，則必須重新產生新的 AppSecret。
</Note>

4. 新增頻道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重新啟動閘道。

## 輸入持久性

對於 QQ 閘道的回合事件，OpenClaw 會先持久化原始事件，再推進已儲存的閘道續傳序號。待處理或可重試的回合可在閘道重新啟動後保留、依對話維持序列化，並在使用中的完成記錄或保留的完成記錄存在時，使用提供者事件 ID 抑制重複的佇列項目。

若持久化接納失敗，OpenClaw 會終止目前的閘道 Socket，而不推進序號。重新連線／續傳路徑隨後可再次要求尚未提交的事件。從佇列到代理程式的邊界仍採至少一次傳遞，因此在交接期間當機可能會重播一個回合。

互動式設定：

```bash
openclaw channels add
```

精靈也提供 QR Code 綁定，作為手動輸入 AppID/AppSecret 的替代方案：
使用與目標 QQ Bot 綁定的手機應用程式掃描 QR Code，即可完成
綁定。OpenClaw 會將傳回的認證資訊持久化於該帳號的設定
範圍下。

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

- `openclaw channels add --channel qqbot --token-file ...` 僅設定 AppSecret；
  `appId` 必須已在設定或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 接受純文字字串、檔案路徑（`clientSecretFile`）
  或結構化 SecretRef 物件。
- 舊版 `secretref:...`／`secretref-env:...` 標記字串不適用於
  `clientSecret`，會遭到拒絕；請改用結構化 SecretRef 物件。

### 串流

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // 區塊串流："partial"（預設）或 "off"
        nativeTransport: true, // 對私人訊息使用 QQ 官方 C2C stream_messages API
      },
    },
  },
}
```

- `streaming.mode: "off"` 會停用該帳號的區塊串流。
- `streaming.nativeTransport: true` 透過 QQ 官方
  `stream_messages` API 串流傳送 C2C（私人訊息）回覆；群組／頻道目標不受影響。
- 舊版 `streaming: true|false` 純量值和 `streaming.c2cStreamApi` 鍵
  會透過 `openclaw doctor --fix` 遷移至此結構。
- `/bot-streaming on|off` 可從私人訊息切換相同設定。

### 存取政策

- `allowFrom`／`groupAllowFrom` 控制誰能在 C2C／
  群組情境中與 Bot 聊天。`dmPolicy`／`groupPolicy`（`open` | `allowlist` | `disabled`）
  控制強制執行模式。當 `allowFrom` 包含具體的（非萬用字元）項目時，
  `dmPolicy` 預設為 `allowlist`，否則為 `open`。
  當 `groupAllowFrom` 或 `allowFrom` 任一包含具體項目時，
  `groupPolicy` 預設為 `allowlist`，否則為 `open`。
- 無論 `dmPolicy`／`groupPolicy` 為何，“Auth: allowlist”斜線指令都要求
  `allowFrom`（群組呼叫則為 `groupAllowFrom`）中存在明確的非萬用字元項目
  — 請參閱[斜線指令](#slash-commands)。

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

每個帳號都有各自隔離的 WebSocket 連線、API 用戶端和權杖
快取，並以 `appId` 為鍵。記錄行會標記所屬帳號 ID，因此在一個閘道下
執行多個 Bot 時，診斷資訊仍可彼此區分。

透過命令列介面新增第二個 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

群組支援使用 QQ 群組 OpenID，而非顯示名稱。將 Bot 新增至
群組後，提及它，或將群組設定為不需提及即可執行。

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

`groups["*"]` 為每個群組設定預設值；具體的 `groups.GROUP_OPENID`
項目會覆寫單一群組的這些預設值。群組設定：

| 欄位                 | 預設值          | 說明                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Bot 回覆前必須有 `@` 提及。                                                     |
| `commandLevel`        | `all`            | 可在群組中執行哪些內建斜線指令（請參閱下方）。                                    |
| `ignoreOtherMentions` | `false`          | 捨棄提及其他人但未提及 Bot 的訊息。                                           |
| `historyLimit`        | `50`             | 保留最近未提及 Bot 的訊息，作為下一個提及回合的情境。`0` 會停用歷史記錄。     |
| `tools`               | —                | 允許／拒絕整個群組使用工具。                                                              |
| `toolsBySender`       | —                | 各傳送者的工具覆寫；請參閱[群組](/zh-TW/channels/groups#groupchannel-tool-restrictions-optional)。 |
| `name`                | OpenID 前綴    | 用於記錄和群組情境的易讀標籤。                                                     |
| `prompt`              | 內建預設值 | 附加至代理程式情境的各群組行為提示詞。                                           |

`commandLevel` 接受：

| 層級    | 行為                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 現有的內建指令維持可用。部分指令仍會從選單中隱藏，但已授權的使用者仍可在群組中執行它們。                  |
| `safety` | `/help`、`/btw`、`/stop` 在群組中保持可見；敏感指令（`/config`、`/tools`、`/bash` 等）必須在私人聊天中執行。      |
| `strict` | 僅允許嚴格操作所需的群組工作階段控制。`/stop` 仍可使用，讓已授權的傳送者中斷進行中的執行。 |

舊版 QQBot `toolPolicy` 項目已淘汰。執行 `openclaw doctor --fix` 以將它們遷移至 `tools`。

啟用模式為 `mention` 和 `always`。`requireMention: true` 對應至
`mention`；`requireMention: false` 對應至 `always`。工作階段層級的啟用
覆寫若存在，會優先於設定。

輸入佇列依對等端劃分。群組對等端的佇列上限較大（50，相較於直接對等端的 20），
佇列已滿時會先移除 Bot 撰寫的訊息，再移除真人訊息，
並將連續傳入的一般群組訊息合併成一個標示來源的回合。斜線
指令會逐一執行，不受任何合併批次影響。

### 語音（STT／TTS）

STT 和 TTS 支援具有優先順序後援機制的兩層設定：

| 設定 | 外掛專用                                          | 框架後援                               |
| ------- | -------------------------------------------------------- | ------------------------------------------------ |
| STT     | `channels.qqbot.stt`                                     | 第一個支援音訊的 `tools.media.models[]` 項目 |
| TTS     | `channels.qqbot.tts`、`channels.qqbot.accounts.<id>.tts` | `tts`                                            |

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

在任一項目上設定 `enabled: false` 即可停用。帳號層級的 TTS 覆寫使用與
`tts` 相同的結構，並深度合併於頻道／全域 TTS 設定之上。

STT 要求預設會在 60 秒後逾時。外掛專用 STT 使用所選的
`models.providers.<id>.timeoutSeconds` 覆寫。框架音訊 STT
先使用所選支援音訊的 `tools.media.models[]` 項目之 `timeoutSeconds`，再使用所選提供者覆寫。

輸入的 QQ 語音附件會以音訊媒體中繼資料形式提供給代理程式，
同時將原始語音檔案排除在通用 `MediaPaths` 之外。純文字回覆中的
`[[audio_as_voice]]` 會合成 TTS，並在已設定 TTS 時傳送原生 QQ 語音訊息。

也可使用 `channels.qqbot.audioFormatPolicy` 調整
輸出音訊的上傳／轉碼行為：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                     | 說明        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C） |
| `qqbot:group:GROUP_OPENID` | 群組聊天         |
| `qqbot:channel:CHANNEL_ID` | 頻道      |

<Note>
每個 Bot 都有各自的一組使用者 OpenID。由 Bot A 收到的 OpenID **不能**用於透過 Bot B 傳送訊息。
</Note>

## 斜線指令

在進入 AI 佇列前攔截的內建指令：

| 命令              | 授權      | 範圍        | 說明                                                                    |
| -------------------- | --------- | ------------ | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | 任何範圍          | 延遲測試                                                                   |
| `/bot-help`          | —         | 任何範圍          | 列出所有命令                                                              |
| `/bot-me`            | —         | 僅限私人聊天 | 顯示傳送者的 QQ 使用者 ID（openid），以設定 `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | 僅限私人聊天 | 顯示 OpenClaw 框架版本和外掛版本                         |
| `/bot-upgrade`       | —         | 僅限私人聊天 | 顯示 QQ Bot 升級指南連結                                              |
| `/bot-approve`       | 允許清單 | 僅限私人聊天 | 管理命令執行核准設定（開啟 / 關閉 / 永遠 / 重設 / 狀態）  |
| `/bot-logs`          | 允許清單 | 僅限私人聊天 | 將最近的閘道日誌匯出為檔案                                           |
| `/bot-clear-storage` | 允許清單 | 僅限私人聊天 | 刪除 QQ Bot 媒體目錄下的快取下載項目                        |
| `/bot-streaming`     | 允許清單 | 僅限私人聊天 | 切換 C2C 串流回覆                                                   |
| `/bot-group-allways` | 允許清單 | 僅限私人聊天 | 切換預設群組啟用模式（需要提及與永遠啟用）      |

在任何命令後附加 `?` 即可取得使用說明（例如 `/bot-upgrade ?`）。

「授權：允許清單」命令還要求傳送者的 openid 必須列於明確且不含萬用字元的 `allowFrom` 清單中（對於從群組發出的命令，`groupAllowFrom` 優先，否則回退至 `allowFrom`）。萬用字元
`allowFrom: ["*"]` 允許聊天，但不允許使用這些命令。在私人聊天以外執行其中一個命令，或未經授權時，系統會傳回提示，而不是
無聲地捨棄訊息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 僅限私人聊天，但不需要
允許清單——任何 C2C 傳送者都可執行。

當 QQ Bot 執行核准使用預設的同一聊天回退機制時，原生核准
按鈕點擊會遵循同一份明確且不含萬用字元的命令允許清單。若要
授予僅限核准的存取權，而不授予更廣泛的命令存取權，請設定
`channels.qqbot.execApprovals.approvers`。原生執行核准預設為
啟用。

## 媒體與儲存空間

- 傳入、傳出和閘道橋接媒體共用
  `~/.openclaw/media/qqbot` 下的一個承載資料根目錄（若設定 `OPENCLAW_HOME`，則遵循其值），讓上傳、
  下載和轉碼快取都位於同一個受保護的目錄下。
- 向 C2C 和群組目標傳送多媒體內容時，統一透過一條 `sendMedia`
  路徑。大小為 5&nbsp;MiB 以上的本機檔案和記憶體內緩衝區會使用 QQ 的
  分塊上傳端點；較小的承載資料以及遠端 URL/Base64 來源則使用
  單次上傳 API。
- 如果熱升級在閘道完成寫入
  `openclaw.json` 前將其中斷，外掛會在下次啟動時，從內部快照還原該帳號最後已知的 `appId` / `clientSecret`
  （絕不覆寫刻意進行的設定變更），因此不需要
  重新掃描 QR code。

## 疑難排解

- **閘道未啟動 / 沒有傳入訊息：**請確認 `appId` 和
  `clientSecret` 正確，且已在 QQ Open Platform 上啟用機器人。
  缺少認證資訊時會顯示「QQ Bot 未設定（缺少 appId 或
  clientSecret）」。
- **使用 `--token-file` 設定後仍顯示未設定：**`--token-file` 只會
  設定 AppSecret。仍必須在設定或 `QQBOT_APP_ID` 中設定 `appId`。
- **突發的群組回覆發生衝突：**當對等端的佇列已滿時，傳入佇列會先於真人訊息淘汰機器人撰寫的
  訊息，並將突發的一般（非命令）群組訊息合併成一個標明來源的回合，因此
  大量機器人聊天訊息不應造成真人訊息無法獲得處理。
- **主動訊息未送達：**如果使用者最近沒有互動，QQ 可能會封鎖機器人主動發起的訊息。
- **語音未轉錄：**請確定已設定 STT，且可連線至供應商。

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
