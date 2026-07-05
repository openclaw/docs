---
read_when:
    - 你想要將 OpenClaw 連接到 QQ
    - 你需要設定 QQ Bot 憑證
    - 你想要 QQ Bot 群組或私人聊天支援
summary: QQ Bot 設定、配置與使用
title: QQ Bot
x-i18n:
    generated_at: "2026-07-05T11:05:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a63f31014c376573456157d5268b9828ce4c0ae8337e4f6428bb57322dd10916
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot 透過官方 QQ Bot API（WebSocket 閘道）連接到 OpenClaw。
C2C 私人聊天和群組 `@` 提及是主要聊天類型，並支援豐富
媒體（圖片、語音、影片、檔案）。公會頻道訊息僅支援
文字和遠端 URL 圖片；公會頻道不支援語音、影片、檔案上傳，以及本機/Base64
圖片。任何地方都不支援反應和討論串。

狀態：官方可下載外掛。

## 安裝

```bash
openclaw plugins install @openclaw/qqbot
```

## 設定

1. 前往 [QQ Open Platform](https://q.qq.com/)，並用你的
   手機 QQ 掃描 QR 碼以註冊 / 登入。
2. 點選 **Create Bot** 建立新的 QQ Bot。
3. 在 Bot 的設定頁面找到 **AppID** 和 **AppSecret** 並複製它們。

<Note>
AppSecret 不會以明文儲存。如果你離開頁面時沒有儲存，就必須重新產生一組新的。
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

精靈也提供 QR 碼綁定，作為手動輸入 AppID/AppSecret
的替代方式：使用綁定目標 QQ Bot 的手機 App 掃描代碼即可完成
綁定。OpenClaw 會將回傳的憑證持久化到該帳戶的設定
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

預設帳戶環境變數（僅限頂層帳戶）：

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

- `openclaw channels add --channel qqbot --token-file ...` 只設定 AppSecret；
  `appId` 必須已在設定或 `QQBOT_APP_ID` 中設定。
- `clientSecret` 接受明文字串、檔案路徑（`clientSecretFile`），
  或結構化 SecretRef 物件。
- 舊版 `secretref:...` / `secretref-env:...` 標記字串會被
  `clientSecret` 拒絕；請改用結構化 SecretRef 物件。

### 存取政策

- `allowFrom` / `groupAllowFrom` 控制誰可以在 C2C /
  群組情境中與 Bot 聊天。`dmPolicy` / `groupPolicy`（`open` | `allowlist` | `disabled`）
  控制強制執行模式。一旦 `allowFrom` 有具體（非萬用字元）項目，
  `dmPolicy` 預設為 `allowlist`，否則為 `open`。
  一旦 `groupAllowFrom` 或 `allowFrom` 有具體項目，
  `groupPolicy` 預設為 `allowlist`，否則為 `open`。
- 「驗證：允許清單」斜線命令需要在
  `allowFrom`（或群組呼叫的 `groupAllowFrom`）中有明確的非萬用字元項目，無論
  `dmPolicy` / `groupPolicy` 為何 — 請參閱[斜線命令](#slash-commands)。

### 多帳戶設定

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

每個帳戶都有獨立的 WebSocket 連線、API 用戶端和權杖
快取，並以 `appId` 作為鍵。日誌行會標記擁有者帳戶 ID，因此
當你在同一個閘道下執行多個 Bot 時，診斷資訊仍可分開辨識。

透過命令列介面新增第二個 Bot：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 群組聊天

群組支援使用 QQ 群組 OpenID，而不是顯示名稱。將 Bot 加入
群組，然後提及它，或將群組設定為不需要提及即可執行。

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

`groups["*"]` 會設定每個群組的預設值；具體的 `groups.GROUP_OPENID`
項目會覆寫單一群組的這些預設值。群組設定：

| 欄位                  | 預設值           | 說明                                                                                               |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | 要求 Bot 回覆前必須有一次 `@` 提及。                                                               |
| `commandLevel`        | `all`            | 可在群組中執行哪些內建斜線命令（見下方）。                                                         |
| `ignoreOtherMentions` | `false`          | 丟棄提及其他人但未提及 Bot 的訊息。                                                                |
| `historyLimit`        | `50`             | 保留為下一次被提及回合提供情境的近期非提及訊息。`0` 會停用歷史記錄。                                |
| `tools`               | —                | 允許/拒絕整個群組的工具。                                                                          |
| `toolsBySender`       | —                | 依傳送者覆寫工具；請參閱[群組](/zh-TW/channels/groups#groupchannel-tool-restrictions-optional)。         |
| `name`                | openid 前綴      | 用於日誌和群組情境的友善標籤。                                                                     |
| `prompt`              | 內建預設值       | 附加到代理情境的每群組行為提示。                                                                   |

`commandLevel` 接受：

| 層級     | 行為                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | 現有內建命令保持可用。有些命令仍會從選單中隱藏，但已授權使用者仍可在群組中執行它們。                                                        |
| `safety` | `/help`、`/btw`、`/stop` 在群組中保持可見；敏感命令（`/config`、`/tools`、`/bash` 等）必須在私人聊天中執行。                                  |
| `strict` | 只允許嚴格運作所需的群組工作階段控制。`/stop` 仍可使用，因此已授權傳送者可以中斷作用中的執行。                                               |

舊版 QQ Bot `toolPolicy` 項目已淘汰。執行 `openclaw doctor --fix` 將它們遷移到 `tools`。

啟用模式為 `mention` 和 `always`。`requireMention: true` 對應到
`mention`；`requireMention: false` 對應到 `always`。若存在工作階段層級啟用
覆寫，則其優先於設定。

傳入佇列依對等端分開。群組對等端有較大的佇列上限（50，相較於直接
對等端的 20），滿載時會先驅逐 Bot 撰寫的訊息，再驅逐真人訊息，
並將一般群組訊息的突發合併為一個歸屬回合。斜線
命令會逐一執行，獨立於任何合併批次。

### 語音（STT / TTS）

STT 和 TTS 支援具備優先備援的兩層設定：

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

在任一項上設定 `enabled: false` 可停用。帳戶層級 TTS 覆寫使用與
`messages.tts` 相同的形狀，並會在頻道/全域 TTS 設定之上深度合併。

傳入 QQ 語音附件會作為音訊媒體中繼資料暴露給代理，
同時讓原始語音檔案不進入通用 `MediaPaths`。純文字回覆中的 `[[audio_as_voice]]`
會在已設定 TTS 時合成 TTS，並傳送原生 QQ 語音訊息。

傳出音訊上傳/轉碼行為也可透過
`channels.qqbot.audioFormatPolicy` 調整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目標格式

| 格式                       | 說明           |
| -------------------------- | -------------- |
| `qqbot:c2c:OPENID`         | 私人聊天（C2C） |
| `qqbot:group:GROUP_OPENID` | 群組聊天       |
| `qqbot:channel:CHANNEL_ID` | 公會頻道       |

<Note>
每個 Bot 都有自己的一組使用者 OpenID。Bot A 接收到的 OpenID **不能** 用來透過 Bot B 傳送訊息。
</Note>

## 斜線命令

在 AI 佇列前攔截的內建命令：

| 命令                 | 驗證       | 範圍       | 說明                                                                         |
| -------------------- | ---------- | ---------- | ---------------------------------------------------------------------------- |
| `/bot-ping`          | —          | 任意       | 延遲測試                                                                     |
| `/bot-help`          | —          | 任意       | 列出所有命令                                                                 |
| `/bot-me`            | —          | 僅限私人   | 顯示傳送者的 QQ 使用者 ID（openid），供 `allowFrom` / `groupAllowFrom` 設定使用 |
| `/bot-version`       | —          | 僅限私人   | 顯示 OpenClaw 框架版本和外掛版本                                             |
| `/bot-upgrade`       | —          | 僅限私人   | 顯示 QQ Bot 升級指南連結                                                     |
| `/bot-approve`       | 允許清單   | 僅限私人   | 管理命令執行核准設定（開啟 / 關閉 / 永遠 / 重設 / 狀態）                    |
| `/bot-logs`          | 允許清單   | 僅限私人   | 將近期閘道日誌匯出為檔案                                                     |
| `/bot-clear-storage` | 允許清單   | 僅限私人   | 刪除 QQ Bot 媒體目錄下的快取下載                                             |
| `/bot-streaming`     | 允許清單   | 僅限私人   | 切換 C2C 串流回覆                                                            |
| `/bot-group-allways` | 允許清單   | 僅限私人   | 切換預設群組啟用模式（需要提及與永遠開啟）                                   |

在任何命令後附加 `?` 可取得使用說明（例如 `/bot-upgrade ?`）。

「驗證：允許清單」命令另外要求傳送者的 openid 位於明確的非萬用字元
`allowFrom` 清單中（群組發出的命令優先使用 `groupAllowFrom`，
再退回 `allowFrom`）。萬用字元 `allowFrom: ["*"]` 允許聊天，
但不允許這些命令。在私人聊天外執行其中之一，或未經授權時，
會回傳提示，而不是靜默丟棄訊息。

`/bot-me`、`/bot-version` 和 `/bot-upgrade` 僅限私人聊天，但不
需要允許清單 — 任何 C2C 傳送者都可以執行它們。

當 QQ Bot 執行核准使用預設的同聊天備援時，原生核准按鈕點擊會遵循相同的明確非萬用字元命令允許清單。若要授予僅限核准的存取權，而不授予更廣泛的命令存取權，請設定 `channels.qqbot.execApprovals.approvers`。原生執行核准預設為啟用。

## 媒體與儲存

- 傳入、傳出與閘道橋接媒體共用 `~/.openclaw/media/qqbot` 下的一個酬載根目錄（設定 `OPENCLAW_HOME` 時會遵循該設定），因此上傳、下載與轉碼快取都會留在同一個受保護的目錄下。
- C2C 與群組目標的豐富媒體傳遞會經由同一個 `sendMedia` 路徑。本機檔案與 5&nbsp;MiB 以上的記憶體內緩衝區會使用 QQ 的分塊上傳端點；較小的酬載以及遠端 URL/Base64 來源會使用一次性上傳 API。
- 如果熱升級在閘道完成寫入 `openclaw.json` 前中斷，外掛會在下次啟動時從內部快照還原該帳戶最後已知的 `appId` / `clientSecret`（絕不覆寫有意的設定變更），因此不需要重新掃描 QR code。

## 疑難排解

- **閘道未啟動 / 沒有傳入訊息：**請確認 `appId` 與 `clientSecret` 正確，且機器人已在 QQ Open Platform 啟用。缺少憑證時會顯示「QQBot not configured (missing appId or clientSecret)」。
- **使用 `--token-file` 設定後仍顯示未設定：**`--token-file` 只會設定 AppSecret。`appId` 仍必須在設定中或透過 `QQBOT_APP_ID` 設定。
- **突發群組回覆發生衝突：**當某個對等端的佇列填滿時，傳入佇列會先逐出機器人撰寫的訊息，再逐出真人訊息，並將一般（非命令）群組訊息的突發合併成一個可歸屬的回合，因此大量機器人對話不應讓真人訊息無法處理。
- **主動訊息未送達：**如果使用者近期未互動，QQ 可能會封鎖機器人主動發起的訊息。
- **語音未轉錄：**請確認已設定 STT，且提供者可連線。

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道疑難排解](/zh-TW/channels/troubleshooting)
