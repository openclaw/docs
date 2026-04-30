---
read_when:
    - 處理 WhatsApp/網頁通道行為或收件匣路由
summary: WhatsApp 通道支援、存取控制、傳遞行為與維運
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T02:50:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：可透過 WhatsApp Web (Baileys) 用於生產環境。Gateway 擁有已連結的工作階段。

## 安裝（隨需）

- Onboarding (`openclaw onboard`) 和 `openclaw channels add --channel whatsapp`
  會在你第一次選取 WhatsApp Plugin 時提示安裝。
- 當 Plugin 尚未存在時，`openclaw channels login --channel whatsapp` 也會提供安裝流程。
- 開發通道 + git checkout：預設使用本機 Plugin 路徑。
- Stable/Beta：當目前套件已發布時，使用 npm 套件 `@openclaw/whatsapp`。

手動安裝仍可使用：

```bash
openclaw plugins install @openclaw/whatsapp
```

如果 npm 回報 OpenClaw 擁有的套件已棄用或缺失，請使用目前已封裝的 OpenClaw 建置，或使用本機 checkout，直到 npm 套件發布列車跟上為止。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    預設 DM 政策會對未知傳送者使用配對。
  </Card>
  <Card title="通道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復操作手冊。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的通道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="設定 WhatsApp 存取政策">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="連結 WhatsApp（QR）">

```bash
openclaw channels login --channel whatsapp
```

    針對特定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加既有/自訂 WhatsApp Web 驗證目錄：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="啟動 gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="核准第一個配對要求（若使用配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對要求會在 1 小時後過期。每個通道最多保留 3 個待處理要求。

  </Step>
</Steps>

<Note>
OpenClaw 建議在可行時使用獨立號碼執行 WhatsApp。（通道中繼資料與設定流程已針對該設定最佳化，但也支援個人號碼設定。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    這是最乾淨的操作模式：

    - 為 OpenClaw 使用獨立的 WhatsApp 身分
    - 更清楚的 DM allowlist 與路由邊界
    - 較低的自我聊天混淆機率

    最小政策模式：

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="個人號碼備援">
    Onboarding 支援個人號碼模式，並寫入適合自我聊天的基準設定：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的個人號碼
    - `selfChatMode: true`

    在執行階段，自我聊天保護會依據已連結的自身號碼與 `allowFrom` 判定。

  </Accordion>

  <Accordion title="僅限 WhatsApp Web 的通道範圍">
    在目前的 OpenClaw 通道架構中，訊息平台通道以 WhatsApp Web (`Baileys`) 為基礎。

    內建聊天通道登錄中沒有獨立的 Twilio WhatsApp 訊息通道。

  </Accordion>
</AccordionGroup>

## 執行階段模型

- Gateway 擁有 WhatsApp socket 與重新連線迴圈。
- 重新連線 watchdog 使用 WhatsApp Web 傳輸活動，而不只是傳入應用程式訊息量，因此安靜的已連結裝置工作階段不會只因最近沒人傳訊息就重新啟動。若傳輸 frame 持續抵達但 watchdog 視窗內沒有處理任何應用程式訊息，較長的應用程式靜默上限仍會強制重新連線；對於最近活躍工作階段的暫時性重新連線，該應用程式靜默檢查會在第一個復原視窗使用一般訊息逾時。
- Baileys socket 時序明確位於 `web.whatsapp.*` 下：`keepAliveIntervalMs` 控制 WhatsApp Web 應用程式 ping，`connectTimeoutMs` 控制開啟握手逾時，而 `defaultQueryTimeoutMs` 控制 Baileys 查詢逾時。
- 對外傳送需要目標帳號有作用中的 WhatsApp listener。
- 狀態與廣播聊天會被忽略（`@status`、`@broadcast`）。
- 重新連線 watchdog 追蹤 WhatsApp Web 傳輸活動，而不只是傳入應用程式訊息量：安靜的已連結裝置工作階段會在傳輸 frame 持續時保持連線，但傳輸停滯會在較晚的遠端斷線路徑之前就強制重新連線。
- 直接聊天使用 DM 工作階段規則（`session.dmScope`；預設 `main` 會將 DM 收合至代理程式主工作階段）。
- 群組工作階段是隔離的（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 傳輸會遵循 gateway 主機上的標準 proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小寫變體）。請優先使用主機層級 proxy 設定，而非通道特定的 WhatsApp proxy 設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 WhatsApp ack reaction。

## Plugin hook 與隱私

WhatsApp 傳入訊息可能包含個人訊息內容、電話號碼、群組識別碼、傳送者名稱，以及工作階段關聯欄位。因此，除非你明確選擇加入，否則 WhatsApp 不會將傳入的 `message_received` hook payload 廣播給 Plugin：

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

你可以將選擇加入範圍限定到單一帳號：

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

只應對你信任可接收傳入 WhatsApp 訊息內容與識別碼的 Plugin 啟用此功能。

## 存取控制與啟用

<Tabs>
  <Tab title="DM 政策">
    `channels.whatsapp.dmPolicy` 控制直接聊天存取：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 風格號碼（內部會正規化）。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）會優先於該帳號的通道層級預設值。

    執行階段行為詳細資訊：

    - 配對會保存在通道 allow-store 中，並與設定的 `allowFrom` 合併
    - 若未設定 allowlist，預設允許已連結的自身號碼
    - OpenClaw 永遠不會自動配對對外 `fromMe` DM（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策 + allowlist">
    群組存取有兩層：

    1. **群組成員 allowlist** (`channels.whatsapp.groups`)
       - 若省略 `groups`，所有群組都符合資格
       - 若存在 `groups`，它會作為群組 allowlist（允許 `"*"`）

    2. **群組傳送者政策** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`：略過傳送者 allowlist
       - `allowlist`：傳送者必須符合 `groupAllowFrom`（或 `*`）
       - `disabled`：封鎖所有群組傳入

    傳送者 allowlist 備援：

    - 若未設定 `groupAllowFrom`，執行階段會在可用時退回使用 `allowFrom`
    - 傳送者 allowlist 會在 mention/reply 啟用前評估

    注意：如果完全沒有 `channels.whatsapp` 區塊，即使已設定 `channels.defaults.groupPolicy`，執行階段群組政策備援仍會是 `allowlist`（並記錄 warning log）。

  </Tab>

  <Tab title="Mention + /activation">
    群組回覆預設需要 mention。

    Mention 偵測包含：

    - 對機器人身分的明確 WhatsApp mention
    - 已設定的 mention regex pattern（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 已授權群組訊息的傳入語音筆記 transcript
    - 隱含的回覆給機器人偵測（回覆傳送者符合機器人身分）

    安全性注意事項：

    - 引用/回覆只滿足 mention gating；它**不會**授予傳送者授權
    - 使用 `groupPolicy: "allowlist"` 時，即使非 allowlist 傳送者回覆 allowlist 使用者的訊息，仍會被封鎖

    工作階段層級啟用命令：

    - `/activation mention`
    - `/activation always`

    `activation` 會更新工作階段狀態（不是全域設定）。它受 owner gating 控制。

  </Tab>
</Tabs>

## 個人號碼與自我聊天行為

當已連結的自身號碼也出現在 `allowFrom` 中時，WhatsApp 自我聊天防護會啟用：

- 跳過自我聊天回合的讀取回條
- 忽略 mention-JID 自動觸發行為，否則它會 ping 你自己
- 如果未設定 `messages.responsePrefix`，自我聊天回覆預設為 `[{identity.name}]` 或 `[openclaw]`

## 訊息正規化與上下文

<AccordionGroup>
  <Accordion title="傳入 envelope + 回覆上下文">
    傳入 WhatsApp 訊息會包裝在共享的傳入 envelope 中。

    如果存在引用回覆，會以下列形式附加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時也會填入回覆中繼資料欄位（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。

  </Accordion>

  <Accordion title="媒體 placeholder 與位置/聯絡人擷取">
    純媒體傳入訊息會使用下列 placeholder 正規化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    已授權群組語音筆記會在 mention gating 前轉錄，前提是本文只有 `<media:audio>`，因此在語音筆記中說出機器人 mention 可觸發回覆。如果 transcript 仍未 mention 機器人，transcript 會保留在待處理群組歷史中，而不是保留原始 placeholder。

    位置本文使用簡短座標文字。位置標籤/註解與聯絡人/vCard 詳細資料會呈現為 fenced 的不受信任中繼資料，而不是 inline prompt text。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    對於群組，未處理訊息可被緩衝，並在機器人最後被觸發時作為上下文注入。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`
    - 備援：`messages.groupChat.historyLimit`
    - `0` 會停用

    注入標記：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="讀取回條">
    已接受的傳入 WhatsApp 訊息預設會啟用讀取回條。

    全域停用：

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    每帳號覆寫：

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    即使全域啟用，自我聊天回合也會跳過讀取回條。

  </Accordion>
</AccordionGroup>

## 傳遞、分段與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式偏好段落邊界（空白行），然後退回到長度安全的分段

  </Accordion>

  <Accordion title="外送媒體行為">
    - 支援圖片、影片、音訊（PTT 語音訊息）和文件 payload
    - 音訊媒體會透過 Baileys `audio` payload 並帶有 `ptt: true` 傳送，因此 WhatsApp 用戶端會將其呈現為按住說話語音訊息
    - 回覆 payload 會保留 `audioAsVoice`；即使 provider 傳回 MP3 或 WebM，WhatsApp 的 TTS 語音訊息輸出仍會走這條 PTT 路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送，以相容語音訊息
    - 非 Ogg 音訊，包括 Microsoft Edge TTS 的 MP3/WebM 輸出，會先用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus，再透過 PTT 傳遞
    - `/tts latest` 會將最新的助理回覆作為一則語音訊息傳送，並防止同一則回覆重複傳送；`/tts chat on|off|default` 控制目前 WhatsApp 聊天的自動 TTS
    - 透過影片傳送時使用 `gifPlayback: true` 支援動態 GIF 播放
    - 傳送多媒體回覆 payload 時，caption 會套用到第一個媒體項目；但 PTT 語音訊息會先傳送音訊，再另外傳送可見文字，因為 WhatsApp 用戶端無法一致呈現語音訊息 caption
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與 fallback 行為">
    - 傳入媒體儲存上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 傳出媒體傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每個帳號的覆寫使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小/品質掃描）以符合限制
    - 媒體傳送失敗時，第一項 fallback 會傳送文字警告，而不是默默丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

WhatsApp 支援原生回覆引用，傳出回覆會明顯引用傳入訊息。使用 `channels.whatsapp.replyToMode` 控制。

| 值          | 行為                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；作為一般訊息傳送                                            |
| `"first"`   | 只引用第一個傳出回覆片段                                              |
| `"all"`     | 引用每個傳出回覆片段                                                  |
| `"batched"` | 引用佇列中的批次回覆，但立即回覆不引用                                |

預設為 `"off"`。每個帳號的覆寫使用 `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## 反應層級

`channels.whatsapp.reactionLevel` 控制 agent 在 WhatsApp 上使用 emoji reactions 的範圍：

| 層級          | Ack reactions | Agent 發起的 reactions | 說明                                             |
| ------------- | ------------- | ---------------------- | ------------------------------------------------ |
| `"off"`       | 否            | 否                     | 完全不使用 reactions                            |
| `"ack"`       | 是            | 否                     | 僅 Ack reactions（回覆前收件確認）              |
| `"minimal"`   | 是            | 是（保守）             | Ack + agent reactions，採用保守指引             |
| `"extensive"` | 是            | 是（鼓勵）             | Ack + agent reactions，採用鼓勵指引             |

預設：`"minimal"`。

每個帳號的覆寫使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 確認 reactions

WhatsApp 支援透過 `channels.whatsapp.ackReaction` 在收到傳入訊息時立即送出 ack reactions。
Ack reactions 受 `reactionLevel` 控制；當 `reactionLevel` 為 `"off"` 時會被抑制。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

行為備註：

- 在傳入訊息被接受後立即傳送（回覆前）
- 失敗會記錄，但不會阻擋正常回覆傳遞
- 群組模式 `mentions` 會在提及觸發的回合中反應；群組啟用 `always` 會作為此檢查的旁路
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此處不使用舊版 `messages.ackReaction`）

## 多帳號與憑證

<AccordionGroup>
  <Accordion title="帳號選擇與預設值">
    - 帳號 id 來自 `channels.whatsapp.accounts`
    - 預設帳號選擇：若存在則使用 `default`，否則使用第一個已設定的帳號 id（排序後）
    - 帳號 id 會在內部正規化以供查找

  </Accordion>

  <Accordion title="憑證路徑與舊版相容性">
    - 目前的驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 備份檔案：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的舊版預設驗證仍會被辨識/遷移，用於預設帳號流程

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。

    在舊版驗證目錄中，會保留 `oauth.json`，並移除 Baileys 驗證檔案。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- Agent 工具支援包含 WhatsApp reaction 動作（`react`）。
- 動作閘門：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 頻道發起的設定寫入預設為啟用（可透過 `channels.whatsapp.configWrites=false` 停用）。

## 疑難排解

<AccordionGroup>
  <Accordion title="未連結（需要 QR）">
    症狀：頻道狀態回報未連結。

    修正：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已連結但已斷線 / 重新連線迴圈">
    症狀：已連結的帳號反覆斷線或嘗試重新連線。

    安靜的帳號可以在一般訊息逾時後仍保持連線；當 WhatsApp Web 傳輸活動停止、socket 關閉，或應用程式層級活動靜默超過較長安全視窗時，watchdog 會重新啟動。

    如果記錄顯示重複的 `status=408 Request Time-out Connection was lost`，請調整 `web.whatsapp` 下的 Baileys socket 時序。先將 `keepAliveIntervalMs` 縮短到低於網路的閒置逾時，並在慢速或高遺失率連線上增加 `connectTimeoutMs`：

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    修正：

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    如有需要，請用 `channels login` 重新連結。

  </Accordion>

  <Accordion title="在 proxy 後方 QR 登入逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用的 QR code 前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 斷線。

    WhatsApp Web 登入使用 Gateway 主機的標準 proxy 環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體和 `NO_PROXY`）。確認 Gateway 程序繼承 proxy env，且 `NO_PROXY` 不匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的 listener">
    當目標帳號沒有作用中的 Gateway listener 時，傳出傳送會快速失敗。

    確認 Gateway 正在執行，且帳號已連結。

  </Accordion>

  <Accordion title="回覆出現在 transcript 中，但沒有出現在 WhatsApp">
    Transcript 列會記錄 agent 產生的內容。WhatsApp 傳遞會另行檢查：OpenClaw 只有在 Baileys 對至少一個可見文字或媒體傳送傳回傳出訊息 id 後，才會將自動回覆視為已傳送。

    Ack reactions 是獨立的回覆前收件確認。成功的 reaction 不代表後續文字或媒體回覆已被 WhatsApp 接受。

    檢查 Gateway 記錄中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外被忽略">
    請依下列順序檢查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist entries
    - 提及閘門（`requireMention` + 提及 patterns）
    - `openclaw.json`（JSON5）中的重複鍵：後面的項目會覆寫前面的項目，因此每個 scope 只保留一個 `groupPolicy`

  </Accordion>

  <Accordion title="Bun runtime 警告">
    WhatsApp Gateway runtime 應使用 Node。Bun 被標記為不相容於穩定的 WhatsApp/Telegram Gateway 操作。
  </Accordion>
</AccordionGroup>

## 系統 prompts

WhatsApp 透過 `groups` 和 `direct` maps 支援 Telegram 風格的群組與直接聊天系統 prompts。

群組訊息的解析階層：

有效的 `groups` map 會先被決定：如果帳號定義自己的 `groups`，它會完全取代根層級的 `groups` map（沒有 deep merge）。Prompt 查找接著會在產生的單一 map 上執行：

1. **群組專屬系統 prompt**（`groups["<groupId>"].systemPrompt`）：當特定群組項目存在於 map 中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），wildcard 會被抑制，且不套用任何系統 prompt。
2. **群組 wildcard 系統 prompt**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於 map 中，或項目存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析階層：

有效的 `direct` map 會先被決定：如果帳號定義自己的 `direct`，它會完全取代根層級的 `direct` map（沒有 deep merge）。Prompt 查找接著會在產生的單一 map 上執行：

1. **直接對象專屬系統 prompt**（`direct["<peerId>"].systemPrompt`）：當特定對象項目存在於 map 中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），wildcard 會被抑制，且不套用任何系統 prompt。
2. **直接對象 wildcard 系統 prompt**（`direct["*"].systemPrompt`）：當特定對象項目完全不存在於 map 中，或項目存在但未定義 `systemPrompt` 鍵時使用。

<Note>
`dms` 仍是每個 DM 輕量歷史覆寫 bucket（`dms.<id>.historyLimit`）。Prompt 覆寫位於 `direct` 下。
</Note>

**與 Telegram 多帳號行為的差異：** 在 Telegram 中，多帳號設定會刻意對所有帳號抑制根層級 `groups`，即使帳號沒有定義自己的 `groups` 也一樣，以防 bot 接收不屬於它的群組訊息。WhatsApp 不會套用此防護：根層級 `groups` 和根層級 `direct` 一律會由未定義帳號層級覆寫的帳號繼承，無論設定了多少帳號。在多帳號 WhatsApp 設定中，如果你想要每個帳號各自的群組或直接 prompts，請在每個帳號下明確定義完整 map，而不是依賴根層級預設值。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定映射，也是聊天層級的群組允許清單。在根層級或帳號作用域中，`groups["*"]` 都表示該作用域「允許所有群組」。
- 只有在你已經希望該作用域允許所有群組時，才加入通配群組 `systemPrompt`。如果你仍然只希望固定的一組群組 ID 符合資格，請不要使用 `groups["*"]` 作為提示預設值。請改為在每個明確列入允許清單的群組項目上重複該提示。
- 群組准入與寄件者授權是分開的檢查。`groups["*"]` 會擴大可進入群組處理的群組集合，但它本身不會授權這些群組中的每個寄件者。寄件者存取仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 分別控制。
- `channels.whatsapp.direct` 對 DM 沒有相同的副作用。`direct["*"]` 只會在 DM 已由 `dmPolicy` 加上 `allowFrom` 或配對儲存規則准入後，提供預設的直接聊天設定。

範例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## 設定參考指標

主要參考：

- [設定參考 - WhatsApp](/zh-TW/gateway/config-channels#whatsapp)

高訊號 WhatsApp 欄位：

- 存取：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 傳遞：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多帳號：`accounts.<id>.enabled`、`accounts.<id>.authDir`、帳號層級覆寫
- 操作：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 工作階段行為：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [Channel 路由](/zh-TW/channels/channel-routing)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
