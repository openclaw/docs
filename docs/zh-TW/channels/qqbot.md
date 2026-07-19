---
read_when:
    - 你想將 OpenClaw 連線至 QQ
    - 你需要設定 QQ Bot 的認證資訊
    - 你想要 QQ Bot 群組或私人聊天支援
summary: QQ Bot 設定、組態與使用方式
title: QQ Bot
x-i18n:
    generated_at: "2026-07-19T13:35:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0bc41f915707f1367e69eaae86ade03c742fbc8fdf6855d2b6094ce05009a903
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket 閘道）連線至 OpenClaw。
C2C 私人聊天和群組 `@` 提及是主要的聊天類型，並支援豐富的
媒體（圖片、語音、影片、檔案）。Guild 頻道訊息僅支援
文字和遠端 URL 圖片；Guild 頻道不支援語音、影片、檔案上傳和本機/Base64
圖片。所有聊天類型皆不支援回應和討論串。

狀態：官方可下載外掛。

## 安裝

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ Open Platform](https://q.qq.com/)，並使用手機
   QQ 掃描 QR 碼以註冊／登入。
2. 按一下 **Create Bot** 以建立新的 QQ Bot。
3. 在 Bot 的設定頁面找到 **AppID** 和 **AppSecret**，並加以複製。

<Note>
AppSecret 不會以純文字儲存。如果未儲存就離開頁面，你必須重新產生一組新的 AppSecret。
</Note>

4. 新增頻道：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重新啟動閘道。

## 傳入資料的持久性

對於 QQ 閘道的回合事件，OpenClaw 會先保存原始事件，再推進已儲存的閘道續傳序號。待處理或可重試的回合會在閘道重新啟動後繼續保留、依對話個別維持循序處理，並在有效或保留的完成記錄存在期間，使用供應商事件 ID 避免重複的佇列項目。

如果持久性接收失敗，OpenClaw 會終止目前的閘道通訊端，而不推進序號。之後，重新連線／續傳路徑可再次要求尚未提交的事件。從佇列到代理程式的邊界仍採至少一次傳遞，因此在交接期間當機可能會重播回合。

互動式設定：

```bash
openclaw channels add
```

精靈也提供 QR 碼綁定，作為手動輸入 AppID/AppSecret
的替代方式：使用與目標 QQ Bot 綁定的手機應用程式掃描 QR 碼，以完成
綁定。OpenClaw 會將傳回的認證資訊保存於該帳號的設定
範圍下。

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

預設帳號環境變數（僅限最上層帳號）：

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
  `appId` 必須已在設定或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 接受純文字字串、檔案路徑（`clientSecretFile`）
  或結構化 SecretRef 物件。
- 系統會拒絕將舊版 `secretref:...`／`secretref-env:...` 標記字串用於
  `clientSecret`；請改用結構化 SecretRef 物件。

### 串流

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // 區塊串流："partial"（預設）或 "off"
        nativeTransport: true, // 對私訊使用 QQ 官方 C2C stream_messages API
      },
    },
  },
}
```

- `streaming.mode: "off"` 會停用該帳號的區塊串流。
- `streaming.nativeTransport: true` 會透過 QQ 官方
  `stream_messages` API 串流 C2C（私訊）回覆；不影響群組／頻道目標。
- 舊版 `streaming: true|false` 純量值和 `streaming.c2cStreamApi` 鍵
  會透過 `openclaw doctor --fix` 遷移至此結構。
- `/bot-streaming on|off` 可從私訊切換相同設定。

### 存取政策

- `allowFrom`／`groupAllowFrom` 會限制哪些人可在 C2C／
  群組情境中與 Bot 聊天。`dmPolicy`／`groupPolicy`（`open` | `allowlist` | `disabled`）
  控制強制執行模式。當 `allowFrom` 包含具體的（非萬用字元）項目時，
  `dmPolicy` 預設為 `allowlist`，否則為 `open`。
  當 `groupAllowFrom` 或 `allowFrom` 任一者包含具體項目時，
  `groupPolicy` 預設為 `allowlist`，否則為 `open`。
- 無論 `dmPolicy`／`groupPolicy` 為何，“Auth: allowlist” 斜線命令都要求
  `allowFrom` 中明確存在非萬用字元項目（群組叫用則為 `groupAllowFrom`）；
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

每個帳號都擁有獨立的 WebSocket 連線、API 用戶端和權杖
快取，並以 `appId` 為索引鍵。記錄行會標記所屬帳號 ID，因此
在單一閘道下執行多個 Bot 時，診斷資訊仍可彼此區分。

透過命令列介面新增第二個 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

群組支援使用 QQ 群組 OpenID，而非顯示名稱。將 Bot 加入
群組，然後提及它，或設定該群組以在未提及 Bot 時執行。

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

`groups["*"]` 會為每個群組設定預設值；具體的 `groups.GROUP_OPENID`
項目會覆寫其中一個群組的這些預設值。群組設定：

| 欄位                 | 預設值          | 說明                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | 要求先 `@` 提及 Bot，Bot 才會回覆。                                                     |
| `commandLevel`        | `all`            | 哪些內建斜線命令可在群組中執行（見下文）。                                    |
| `ignoreOtherMentions` | `false`          | 捨棄提及其他人但未提及 Bot 的訊息。                                           |
| `historyLimit`        | `50`             | 保留最近未提及 Bot 的訊息，作為下一個提及回合的脈絡。`0` 會停用記錄。     |
| `tools`               | —                | 為整個群組允許／拒絕工具。                                                              |
| `toolsBySender`       | —                | 各傳送者的工具覆寫；請參閱[群組](/zh-TW/channels/groups#groupchannel-tool-restrictions-optional)。 |
| `name`                | OpenID 前綴    | 用於記錄和群組脈絡的易讀標籤。                                                     |
| `prompt`              | 內建預設值 | 附加至代理程式脈絡的各群組行為提示詞。                                           |

`commandLevel` 接受：

| 層級    | 行為                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 現有的內建命令仍可使用。部分命令會從選單隱藏，但經授權的使用者仍可在群組中執行。                  |
| `safety` | `/help`、`/btw`、`/stop` 在群組中仍可見；敏感命令（`/config`、`/tools`、`/bash` 等）必須在私人聊天中執行。      |
| `strict` | 僅允許嚴格操作所需的群組工作階段控制。`/stop` 仍可運作，因此經授權的傳送者可以中斷進行中的執行。 |

舊版 QQ Bot `toolPolicy` 項目已淘汰。執行 `openclaw doctor --fix`，將其遷移至 `tools`。

啟用模式為 `mention` 和 `always`。`requireMention: true` 對應至
`mention`；`requireMention: false` 對應至 `always`。如果存在工作階段層級的啟用
覆寫，其優先於設定。

傳入佇列按對等端區分。群組對等端的佇列上限較大（50，相較於直接對等端的 20），
佇列已滿時會先逐出 Bot 撰寫的訊息，再逐出人類撰寫的訊息，
並將突發的一般群組訊息合併成一個標明傳送者的回合。斜線
命令會逐一執行，不受任何合併批次影響。

### 語音（STT／TTS）

STT 和 TTS 支援具優先順序後援的雙層設定：

| 設定 | 外掛專用                                          | 框架後援            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`、`channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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
`messages.tts` 相同的結構，並深度合併至頻道／全域 TTS 設定之上。

STT 要求預設會在 60 秒後逾時。外掛專用 STT 使用所選的
`models.providers.<id>.timeoutSeconds` 覆寫。框架音訊 STT
依序使用 `tools.media.audio.models[0].timeoutSeconds`、
`tools.media.audio.timeoutSeconds`，再使用所選供應商的覆寫。

傳入的 QQ 語音附件會以音訊媒體中繼資料形式提供給代理程式，
同時避免將原始語音檔案放入一般的 `MediaPaths`。當 TTS 已設定時，
純文字回覆中的 `[[audio_as_voice]]` 會合成 TTS，並傳送原生 QQ 語音訊息。

也可以使用 `channels.qqbot.audioFormatPolicy` 調整
傳出音訊的上傳／轉碼行為：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                     | 說明        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C） |
| `qqbot:group:GROUP_OPENID` | 群組聊天         |
| `qqbot:channel:CHANNEL_ID` | Guild 頻道      |

<Note>
每個 Bot 都有各自的一組使用者 OpenID。Bot A 收到的 OpenID **不能** 用於透過 Bot B 傳送訊息。
</Note>

## 斜線命令

在進入 AI 佇列前攔截的內建命令：

| 命令                 | 授權       | 範圍         | 說明                                                                            |
| -------------------- | ---------- | ------------ | ------------------------------------------------------------------------------- |
| `/bot-ping`   | —          | 任何範圍     | 延遲測試                                                                        |
| `/bot-help`   | —          | 任何範圍     | 列出所有命令                                                                    |
| `/bot-me`   | —          | 僅限私人聊天 | 顯示傳送者的 QQ 使用者 ID（openid），供 `allowFrom` / `groupAllowFrom` 設定使用 |
| `/bot-version`   | —          | 僅限私人聊天 | 顯示 OpenClaw 框架版本和外掛版本                                                |
| `/bot-upgrade`   | —          | 僅限私人聊天 | 顯示 QQ Bot 升級指南連結                                                        |
| `/bot-approve`   | 允許清單   | 僅限私人聊天 | 管理命令執行核准設定（開啟 / 關閉 / 一律 / 重設 / 狀態）                        |
| `/bot-logs`   | 允許清單   | 僅限私人聊天 | 將近期的閘道記錄匯出為檔案                                                      |
| `/bot-clear-storage`   | 允許清單   | 僅限私人聊天 | 刪除 QQ Bot 媒體目錄下的快取下載                                                |
| `/bot-streaming`   | 允許清單   | 僅限私人聊天 | 切換 C2C 串流回覆                                                               |
| `/bot-group-allways`   | 允許清單   | 僅限私人聊天 | 切換預設群組啟用模式（需要提及或一律啟用）                                      |

在任何命令後附加 `?`，即可取得用法說明（例如 `/bot-upgrade ?`）。

“授權：允許清單”命令還要求傳送者的 openid 位於明確且非萬用字元的 `allowFrom` 清單中（群組發出的命令優先採用 `groupAllowFrom`，若無則回退至 `allowFrom`）。萬用字元 `allowFrom: ["*"]` 允許聊天，但不允許使用這些命令。在私人聊天以外執行其中任一命令，或未經授權時，系統會傳回提示，而不會默默捨棄訊息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 僅限私人聊天使用，但不需要允許清單——任何 C2C 傳送者都可以執行。

當 QQ Bot 執行核准使用預設的同聊天回退機制時，點按原生核准按鈕也會遵循相同的明確非萬用字元命令允許清單。若只要授予核准權限，而不授予更廣泛的命令存取權，請設定 `channels.qqbot.execApprovals.approvers`。原生執行核准預設為啟用。

## 媒體與儲存空間

- 輸入、輸出和閘道橋接媒體共用 `~/.openclaw/media/qqbot` 下的單一承載資料根目錄（設定時會採用 `OPENCLAW_HOME`），因此上傳、下載和轉碼快取都會保留在同一個受保護的目錄下。
- C2C 和群組目標的多媒體傳送會統一經過 `sendMedia` 路徑。大小為 5&nbsp;MiB 以上的本機檔案和記憶體內緩衝區會使用 QQ 的分塊上傳端點；較小的承載資料以及遠端 URL／Base64 來源則使用單次上傳 API。
- 如果熱升級在閘道完成寫入 `openclaw.json` 前將其中斷，外掛會在下次啟動時，從內部快照還原該帳號最後已知的 `appId` / `clientSecret`（絕不覆寫刻意進行的設定變更），因此不需要重新掃描 QR Code。

## 疑難排解

- **閘道未啟動／沒有收到訊息：**確認 `appId` 和 `clientSecret` 正確，且機器人已在 QQ 開放平台上啟用。缺少認證資訊時，會顯示 “QQBot not configured (missing appId or clientSecret)”。
- **使用 `--token-file` 設定後仍顯示未設定：**`--token-file` 只會設定 AppSecret。仍必須在設定或 `QQBOT_APP_ID` 中設定 `appId`。
- **突發的群組回覆互相衝突：**當對等方的佇列已滿時，輸入佇列會優先逐出機器人所傳送的訊息，而非人類傳送的訊息，並將突發的一般（非命令）群組訊息合併成一個已標明來源的對話回合，因此大量的機器人聊天不應導致人類訊息無法處理。
- **未收到主動訊息：**如果使用者近期未曾互動，QQ 可能會封鎖機器人主動發起的訊息。
- **語音未轉錄：**請確認已設定 STT，且可連線至提供者。

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
