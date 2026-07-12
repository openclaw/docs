---
read_when:
    - 你想要將 OpenClaw 連接至 QQ
    - 你需要設定 QQ Bot 憑證
    - 你需要 QQ Bot 群組或私人聊天支援
summary: QQ Bot 設定、配置與使用方式
title: QQ Bot
x-i18n:
    generated_at: "2026-07-11T21:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket 閘道）連線至 OpenClaw。
主要聊天類型為 C2C 私訊與群組 `@` 提及，並支援豐富的媒體內容（圖片、語音、影片、檔案）。公會頻道訊息僅支援文字與遠端 URL 圖片；公會頻道不支援語音、影片、檔案上傳，以及本機/Base64 圖片。所有聊天類型皆不支援表情回應與討論串。

狀態：官方可下載外掛。

## 安裝

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ 開放平台](https://q.qq.com/)，使用手機 QQ 掃描 QR Code 以註冊／登入。
2. 點擊 **Create Bot** 建立新的 QQ Bot。
3. 在機器人的設定頁面找到 **AppID** 與 **AppSecret**，並將其複製。

<Note>
AppSecret 不會以純文字儲存。若未儲存便離開頁面，則必須重新產生新的 AppSecret。
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

精靈也提供 QR Code 綁定，作為手動輸入 AppID/AppSecret 的替代方式：使用已連結至目標 QQ Bot 的手機應用程式掃描 QR Code，即可完成綁定。OpenClaw 會將傳回的憑證持久儲存於該帳號的設定範圍內。

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

- `openclaw channels add --channel qqbot --token-file ...` 僅設定 AppSecret；必須已在設定或 `QQBOT_APP_ID` 中設定 `appId`。
- `clientSecret` 接受純文字字串、檔案路徑（`clientSecretFile`）或結構化 SecretRef 物件。
- `clientSecret` 不接受舊版 `secretref:...`／`secretref-env:...` 標記字串；請改用結構化 SecretRef 物件。

### 存取原則

- `allowFrom`／`groupAllowFrom` 會限制哪些人可在 C2C／群組情境中與機器人聊天。`dmPolicy`／`groupPolicy`（`open` | `allowlist` | `disabled`）控制強制執行模式。當 `allowFrom` 有具體的非萬用字元項目時，`dmPolicy` 預設為 `allowlist`，否則為 `open`。當 `groupAllowFrom` 或 `allowFrom` 任一者有具體項目時，`groupPolicy` 預設為 `allowlist`，否則為 `open`。
- 無論 `dmPolicy`／`groupPolicy` 為何，「驗證：允許清單」斜線命令都要求 `allowFrom` 中有明確的非萬用字元項目（群組呼叫則為 `groupAllowFrom`）——請參閱[斜線命令](#slash-commands)。

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

每個帳號都有獨立的 WebSocket 連線、API 用戶端與權杖快取，並以 `appId` 作為索引鍵。記錄行會標示其所屬帳號 ID，因此在單一閘道下執行多個機器人時，診斷資訊仍可彼此區分。

透過命令列介面新增第二個機器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

群組支援使用 QQ 群組 OpenID，而非顯示名稱。將機器人加入群組後，提及它，或設定該群組無須提及即可執行。

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

`groups["*"]` 為所有群組設定預設值；具體的 `groups.GROUP_OPENID` 項目會針對單一群組覆寫這些預設值。群組設定：

| 欄位                  | 預設值           | 說明                                                                                         |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | 要求先 `@` 提及機器人，機器人才會回覆。                                                      |
| `commandLevel`        | `all`            | 可在群組中執行哪些內建斜線命令（見下文）。                                                   |
| `ignoreOtherMentions` | `false`          | 捨棄提及其他人但未提及機器人的訊息。                                                         |
| `historyLimit`        | `50`             | 保留最近未提及機器人的訊息，作為下次提及回合的上下文。`0` 會停用歷史記錄。                   |
| `tools`               | —                | 允許／拒絕整個群組使用的工具。                                                               |
| `toolsBySender`       | —                | 依傳送者覆寫工具設定；請參閱[群組](/zh-TW/channels/groups#groupchannel-tool-restrictions-optional)。 |
| `name`                | openid 前綴      | 用於記錄與群組上下文的易讀標籤。                                                             |
| `prompt`              | 內建預設值       | 附加至代理程式上下文的個別群組行為提示。                                                     |

`commandLevel` 接受以下值：

| 層級     | 行為                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 現有內建命令維持可用。部分命令不會顯示於選單中，但獲授權的使用者仍可在群組中執行。                                                         |
| `safety` | `/help`、`/btw`、`/stop` 會繼續顯示於群組中；敏感命令（`/config`、`/tools`、`/bash` 等）必須在私訊中執行。                                  |
| `strict` | 僅允許嚴格運作所需的群組工作階段控制。`/stop` 仍可使用，因此獲授權的傳送者可以中斷進行中的執行作業。                                        |

舊版 QQ Bot `toolPolicy` 項目已停用。執行 `openclaw doctor --fix` 將其遷移至 `tools`。

啟用模式為 `mention` 與 `always`。`requireMention: true` 對應至 `mention`；`requireMention: false` 對應至 `always`。若存在工作階段層級的啟用模式覆寫，則其優先於設定。

輸入佇列依對等端分開管理。群組對等端的佇列上限較大（50；直接對等端為 20），佇列已滿時會優先逐出機器人撰寫的訊息，再逐出人類撰寫的訊息，並將連續送達的一般群組訊息合併為一個附有來源標示的回合。斜線命令會逐一執行，且不受任何合併批次影響。

### 語音（STT／TTS）

STT 與 TTS 支援具備優先順序備援的雙層設定：

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

在任一項目上設定 `enabled: false` 即可停用。帳號層級的 TTS 覆寫使用與 `messages.tts` 相同的結構，並會深度合併至頻道／全域 TTS 設定之上。

STT 請求預設於 60 秒後逾時。外掛專用 STT 使用所選 `models.providers.<id>.timeoutSeconds` 覆寫值。框架音訊 STT 依序使用 `tools.media.audio.models[0].timeoutSeconds`、`tools.media.audio.timeoutSeconds`，最後使用所選供應商的覆寫值。

傳入的 QQ 語音附件會以音訊媒體中繼資料形式提供給代理程式，同時避免將原始語音檔案放入通用 `MediaPaths`。當已設定 TTS 時，純文字回覆中的 `[[audio_as_voice]]` 會合成 TTS，並傳送原生 QQ 語音訊息。

也可使用 `channels.qqbot.audioFormatPolicy` 調整傳出音訊的上傳／轉碼行為：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                       | 說明            |
| -------------------------- | --------------- |
| `qqbot:c2c:OPENID`         | 私訊（C2C）     |
| `qqbot:group:GROUP_OPENID` | 群組聊天        |
| `qqbot:channel:CHANNEL_ID` | 公會頻道        |

<Note>
每個機器人都有各自的一組使用者 OpenID。機器人 A 收到的 OpenID **無法**用於透過機器人 B 傳送訊息。
</Note>

## 斜線命令

在進入 AI 佇列前攔截的內建命令：

| 命令                 | 驗證       | 範圍       | 說明                                                                            |
| -------------------- | ---------- | ---------- | ------------------------------------------------------------------------------- |
| `/bot-ping`          | —          | 任意       | 延遲測試                                                                        |
| `/bot-help`          | —          | 任意       | 列出所有命令                                                                    |
| `/bot-me`            | —          | 僅限私訊   | 顯示傳送者的 QQ 使用者 ID（openid），以便設定 `allowFrom`／`groupAllowFrom`      |
| `/bot-version`       | —          | 僅限私訊   | 顯示 OpenClaw 框架版本與外掛版本                                                |
| `/bot-upgrade`       | —          | 僅限私訊   | 顯示 QQ Bot 升級指南連結                                                        |
| `/bot-approve`       | 允許清單   | 僅限私訊   | 管理命令執行核准設定（開啟／關閉／一律／重設／狀態）                            |
| `/bot-logs`          | 允許清單   | 僅限私訊   | 將最近的閘道記錄匯出為檔案                                                      |
| `/bot-clear-storage` | 允許清單   | 僅限私訊   | 刪除 QQ Bot 媒體目錄下的快取下載內容                                            |
| `/bot-streaming`     | 允許清單   | 僅限私訊   | 切換 C2C 串流回覆                                                               |
| `/bot-group-allways` | 允許清單   | 僅限私訊   | 切換預設群組啟用模式（需要提及或一律啟用）                                      |

在任何命令後附加 `?` 即可取得用法說明（例如 `/bot-upgrade ?`）。

「驗證：允許清單」命令還要求傳送者的 openid 必須位於明確的非萬用字元 `allowFrom` 清單中（群組中發出的命令以 `groupAllowFrom` 優先，若無則回退至 `allowFrom`）。萬用字元 `allowFrom: ["*"]` 允許聊天，但不允許使用這些命令。在私訊以外執行其中任一命令，或未獲授權時，系統會傳回提示，而不會直接捨棄訊息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 僅限私人聊天使用，但不需要允許清單——任何 C2C 傳送者都能執行它們。

當 QQ Bot 執行核准使用預設的同一聊天備援機制時，點擊原生核准按鈕也會遵循相同的明確非萬用字元命令允許清單。若要只授予核准權限而不提供更廣泛的命令存取權，請設定 `channels.qqbot.execApprovals.approvers`。原生執行核准預設為啟用。

## 媒體與儲存空間

- 輸入、輸出及閘道橋接媒體共用 `~/.openclaw/media/qqbot` 下的單一承載資料根目錄（設定 `OPENCLAW_HOME` 時會遵循該設定），因此上傳、下載與轉碼快取都會保留在同一個受保護的目錄下。
- 傳送至 C2C 與群組目標的豐富媒體會統一經由 `sendMedia` 路徑。大小為 5&nbsp;MiB 以上的本機檔案與記憶體內緩衝區會使用 QQ 的分塊上傳端點；較小的承載資料及遠端 URL/Base64 來源則使用單次上傳 API。
- 如果熱升級在閘道完成寫入 `openclaw.json` 前中斷閘道，外掛會在下次啟動時，從內部快照還原該帳號最後已知的 `appId` / `clientSecret`（絕不覆寫刻意進行的設定變更），因此不需要重新掃描 QR Code。

## 疑難排解

- **閘道未啟動／沒有輸入訊息：**請確認 `appId` 與 `clientSecret` 正確，且機器人已在 QQ Open Platform 上啟用。缺少認證資訊時會顯示「QQ Bot 未設定（缺少 appId 或 clientSecret）」。
- **使用 `--token-file` 設定後仍顯示未設定：**`--token-file` 只會設定 AppSecret。仍必須在設定或 `QQBOT_APP_ID` 中設定 `appId`。
- **突發的群組回覆發生衝突：**當對等端的佇列已滿時，輸入佇列會先淘汰由機器人撰寫的訊息，而不是人類訊息；並將突發的一般（非命令）群組訊息合併成一次標示來源的互動，因此大量機器人聊天內容不應導致人類訊息無法獲得處理。
- **主動訊息未送達：**如果使用者近期沒有互動，QQ 可能會封鎖由機器人主動發起的訊息。
- **語音未轉錄：**請確認已設定 STT，且提供者可連線。

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
