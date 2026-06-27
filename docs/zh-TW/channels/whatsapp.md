---
read_when:
    - 處理 WhatsApp/web 頻道行為或收件匣路由
summary: WhatsApp 頻道支援、存取控制、傳送行為與維運
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T18:59:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：透過 WhatsApp Web（Baileys）已可投入生產使用。閘道擁有已連結的工作階段。

## 安裝（按需）

- 初始設定（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  會在你首次選取 WhatsApp 外掛時提示安裝。
- 當外掛尚未存在時，`openclaw channels login --channel whatsapp` 也會提供安裝流程。
- 開發通道 + git checkout：預設使用本機外掛路徑。
- Stable/Beta：會先從 ClawHub 安裝官方 `@openclaw/whatsapp` 外掛，
  並以 npm 作為備援。
- WhatsApp runtime 會在核心 OpenClaw npm 套件之外發佈，因此
  WhatsApp 專屬 runtime 依賴會留在外部外掛中。

仍可手動安裝：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

只有在你需要 registry 備援時，才使用裸 npm 套件（`@openclaw/whatsapp`）。
只有在你需要可重現安裝時，才釘選精確版本。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    未知寄件者的預設 DM 政策是配對。
  </Card>
  <Card title="通道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復操作手冊。
  </Card>
  <Card title="閘道設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整通道設定模式與範例。
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

    目前登入以 QR 為基礎。在遠端或無頭環境中，開始登入前，請確保你有可靠路徑，
    能將即時 QR code 傳送到要掃描它的手機。

    針對特定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加既有/自訂 WhatsApp Web auth 目錄：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="啟動閘道">

```bash
openclaw gateway
```

  </Step>

  <Step title="核准第一個配對請求（若使用配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對請求會在 1 小時後過期。每個通道最多可有 3 個待處理請求。

  </Step>
</Steps>

<Note>
OpenClaw 建議盡可能在獨立號碼上執行 WhatsApp。（通道中繼資料和設定流程已針對該設定最佳化，但也支援個人號碼設定。）
</Note>

<Warning>
目前 WhatsApp 設定流程僅支援 QR。終端機顯示的 QR、螢幕截圖、
PDF 或聊天附件，在從遠端機器轉送時可能會過期或變得無法讀取。
對於遠端/無頭主機，建議使用直接的 QR 圖片交付路徑，而不是手動擷取終端機畫面。
</Warning>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    這是最乾淨的營運模式：

    - OpenClaw 使用獨立的 WhatsApp 身分
    - 更清楚的 DM 允許清單與路由邊界
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
    初始設定支援個人號碼模式，並寫入適合自我聊天的基準設定：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的個人號碼
    - `selfChatMode: true`

    在 runtime 中，自我聊天保護會以已連結的自身號碼和 `allowFrom` 為依據。

  </Accordion>

  <Accordion title="僅限 WhatsApp Web 的通道範圍">
    在目前的 OpenClaw 通道架構中，訊息平台通道以 WhatsApp Web（`Baileys`）為基礎。

    內建聊天通道 registry 中沒有獨立的 Twilio WhatsApp 訊息通道。

  </Accordion>
</AccordionGroup>

## Runtime 模型

- 閘道擁有 WhatsApp socket 和重新連線迴圈。
- 重新連線 watchdog 使用 WhatsApp Web 傳輸活動，而不只使用傳入應用程式訊息量，因此安靜的已連結裝置工作階段不會只因為最近沒有人傳送訊息而重新啟動。若傳輸 frame 持續抵達，但在 watchdog 視窗內沒有處理任何應用程式訊息，較長的應用程式靜默上限仍會強制重新連線；針對最近活躍工作階段的暫時重新連線後，該應用程式靜默檢查會在第一個復原視窗使用一般訊息逾時。
- Baileys socket 時序在 `web.whatsapp.*` 下明確設定：`keepAliveIntervalMs` 控制 WhatsApp Web 應用程式 ping，`connectTimeoutMs` 控制開啟握手逾時，而 `defaultQueryTimeoutMs` 控制 Baileys 查詢等待，以及 OpenClaw 本機傳出傳送/在線狀態和傳入讀取回執操作邊界。
- 傳出傳送需要目標帳號有啟用中的 WhatsApp listener。
- 當文字和媒體標題中的 `@+<digits>` 與 `@<digits>` token 符合目前 WhatsApp 參與者中繼資料時，群組傳送會附加原生提及中繼資料，包括以 LID 支援的群組。
- 狀態與廣播聊天會被忽略（`@status`、`@broadcast`）。
- 重新連線 watchdog 會依循 WhatsApp Web 傳輸活動，而不只看傳入應用程式訊息量：只要傳輸 frame 持續，安靜的已連結裝置工作階段會保持在線，但傳輸停滯會在較晚的遠端中斷連線路徑之前強制重新連線。
- 直接聊天使用 DM 工作階段規則（`session.dmScope`；預設 `main` 會將 DM 合併到代理的主要工作階段）。
- 群組工作階段會隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可透過其原生 `@newsletter` JID 成為明確的傳出目標。傳出 newsletter 傳送會使用通道工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而不是 DM 工作階段語意。
- WhatsApp Web 傳輸會遵循閘道主機上的標準 proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小寫變體）。建議使用主機層級 proxy 設定，而不是通道專屬 WhatsApp proxy 設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 WhatsApp ack reaction。

## 核准提示

WhatsApp 可以使用 `👍` / `👎` reaction 呈現 exec 和外掛核准提示。傳送由頂層核准轉送設定控制：

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` 和 `approvals.plugin` 彼此獨立。啟用 WhatsApp 作為通道只會連結
傳輸；除非相符的核准家族已啟用並路由到 WhatsApp，否則不會傳送核准提示。
工作階段模式只會為源自 WhatsApp 的核准傳送原生 emoji 核准。目標模式會針對明確的 WhatsApp
目標使用共用轉送管線，且不會建立獨立的核准者 DM 扇出。

WhatsApp 核准 reaction 需要來自 `allowFrom` 或 `"*"` 的明確 WhatsApp 核准者。
`defaultTo` 控制一般預設訊息目標；它不是核准者。手動
`/approve` 命令在核准解析之前，仍會通過一般 WhatsApp 寄件者授權路徑。

## 外掛 hook 與隱私

WhatsApp 傳入訊息可能包含個人訊息內容、電話號碼、
群組識別碼、寄件者名稱和工作階段關聯欄位。因此，
WhatsApp 不會向外掛廣播傳入的 `message_received` hook payload，
除非你明確選擇加入：

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

你可以將選擇加入範圍限制到單一帳號：

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

只有在你信任外掛可接收傳入 WhatsApp 訊息內容和識別碼時，才啟用此設定。

## 存取控制與啟用

<Tabs>
  <Tab title="DM 政策">
    `channels.whatsapp.dmPolicy` 控制直接聊天存取：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 風格的號碼（內部會標準化）。

    `allowFrom` 是 DM 寄件者存取控制清單。它不會限制傳送到 WhatsApp 群組 JID 或 `@newsletter` 通道 JID 的明確傳出傳送。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）會優先於該帳號的通道層級預設值。

    Runtime 行為細節：

    - 配對會持久化在通道 allow-store 中，並與設定的 `allowFrom` 合併
    - 排程自動化和心跳偵測收件者備援會使用明確傳送目標或設定的 `allowFrom`；DM 配對核准不是隱含的排程或心跳偵測收件者
    - 若未設定允許清單，預設允許已連結的自身號碼
    - OpenClaw 絕不會自動配對傳出的 `fromMe` DM（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策 + 允許清單">
    群組存取有兩層：

    1. **群組成員允許清單**（`channels.whatsapp.groups`）
       - 若省略 `groups`，所有群組皆符合資格
       - 若存在 `groups`，它會作為群組允許清單（允許 `"*"`）

    2. **群組寄件者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：略過寄件者允許清單
       - `allowlist`：寄件者必須符合 `groupAllowFrom`（或 `*`）
       - `disabled`：封鎖所有群組傳入

    寄件者允許清單備援：

    - 若未設定 `groupAllowFrom`，runtime 會在可用時回退到 `allowFrom`
    - 寄件者允許清單會在提及/回覆啟用之前評估

    注意：若完全不存在 `channels.whatsapp` 區塊，runtime 群組政策備援會是 `allowlist`（並記錄警告），即使已設定 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    群組回覆預設需要提及。

    提及偵測包含：

    - 對 bot 身分的明確 WhatsApp 提及
    - 設定的提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 已授權群組訊息的傳入語音筆記轉錄
    - 隱含的回覆 bot 偵測（回覆寄件者符合 bot 身分）

    安全注意事項：

    - 引用/回覆只會滿足提及閘控；它**不會**授予寄件者授權
    - 使用 `groupPolicy: "allowlist"` 時，即使非允許清單寄件者回覆允許清單使用者的訊息，仍會被封鎖

    工作階段層級啟用命令：

    - `/activation mention`
    - `/activation always`

    `activation` 會更新工作階段狀態（不是全域設定）。它受擁有者閘控。

  </Tab>
</Tabs>

## 已設定的 ACP 綁定

WhatsApp 支援使用頂層 `bindings[]` entries 的持久 ACP 綁定：

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- 直接聊天會符合 E.164 號碼，例如 `+15555550123`。
- 群組會符合 WhatsApp 群組 JID，例如 `120363424282127706@g.us`。
- 群組允許清單、傳送者政策，以及提及或啟用門檻，會在 OpenClaw 確保已設定的 ACP 工作階段存在之前執行。
- 符合的已設定 ACP 綁定擁有該路由。WhatsApp 廣播群組不會將該回合分送到一般 WhatsApp 工作階段。

## 個人號碼與自我聊天行為

當連結的自身號碼也存在於 `allowFrom` 時，WhatsApp 自我聊天保護會啟用：

- 略過自我聊天回合的已讀回條
- 忽略原本會 ping 你自己的提及 JID 自動觸發行為
- 如果未設定 `messages.responsePrefix`，自我聊天回覆預設為 `[{identity.name}]` 或 `[openclaw]`

## 訊息正規化與上下文

<AccordionGroup>
  <Accordion title="傳入封套 + 回覆上下文">
    傳入的 WhatsApp 訊息會包裝在共用的傳入封套中。

    如果存在引用回覆，會以下列形式附加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時也會填入回覆中繼資料欄位（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。
    當引用回覆目標是可下載的媒體時，OpenClaw 會透過
    一般傳入媒體儲存區儲存它，並以 `MediaPath`/`MediaType` 暴露，讓
    代理可以檢視被參照的圖片，而不只是看到
    `<media:image>`。

  </Accordion>

  <Accordion title="媒體預留位置與位置/聯絡人擷取">
    僅含媒體的傳入訊息會正規化為下列預留位置：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    授權群組語音訊息在內容只有 `<media:audio>` 時，會在提及門檻前先轉錄，
    因此在語音訊息中說出機器人提及詞可以
    觸發回覆。如果轉錄仍未提及機器人，
    轉錄會保留在待處理群組歷史中，而不是保留原始預留位置。

    位置內容使用簡短座標文字。位置標籤/留言與聯絡人/vCard 詳細資料會呈現為以圍欄標記的不受信任中繼資料，而不是行內提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    對於群組，未處理的訊息可以先緩衝，並在機器人最終被觸發時注入為上下文。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`
    - 後備：`messages.groupChat.historyLimit`
    - `0` 會停用

    注入標記：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已讀回條">
    已接受的傳入 WhatsApp 訊息預設會啟用已讀回條。

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

    即使全域啟用，自我聊天回合也會略過已讀回條。

  </Accordion>
</AccordionGroup>

## 傳送、分段與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式偏好段落邊界（空白行），然後退回到長度安全的分段

  </Accordion>

  <Accordion title="傳出媒體行為">
    - 支援圖片、影片、音訊（PTT 語音訊息）與文件承載
    - 音訊媒體會透過 Baileys `audio` 承載並帶有 `ptt: true` 傳送，因此 WhatsApp 用戶端會將其呈現為按住說話語音訊息
    - 回覆承載會保留 `audioAsVoice`；即使提供者回傳 MP3 或 WebM，WhatsApp 的 TTS 語音訊息輸出仍會留在此 PTT 路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送，以維持語音訊息相容性
    - 非 Ogg 音訊，包括 Microsoft Edge TTS MP3/WebM 輸出，會在 PTT 傳送前用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus
    - `/tts latest` 會將最新的助理回覆傳送為一則語音訊息，並抑制同一則回覆的重複傳送；`/tts chat on|off|default` 控制目前 WhatsApp 聊天的自動 TTS
    - 透過影片傳送上的 `gifPlayback: true` 支援動畫 GIF 播放
    - `forceDocument` / `asDocument` 會透過 Baileys 文件承載傳送傳出圖片、GIF 與影片，以避免 WhatsApp 媒體壓縮，同時保留解析後的檔名與 MIME 類型
    - 傳送多媒體回覆承載時，說明文字會套用到第一個媒體項目；但 PTT 語音訊息會先傳送音訊，並另行傳送可見文字，因為 WhatsApp 用戶端不會一致地呈現語音訊息說明文字
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與後備行為">
    - 傳入媒體儲存上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 傳出媒體傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每帳號覆寫使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 除非 `forceDocument` / `asDocument` 要求以文件傳送，否則圖片會自動最佳化（調整尺寸/品質掃描）以符合限制
    - 媒體傳送失敗時，第一項後備會傳送文字警告，而不是靜默丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

WhatsApp 支援原生回覆引用，傳出回覆會以可見方式引用傳入訊息。使用 `channels.whatsapp.replyToMode` 控制。

| 值          | 行為                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；以純訊息傳送                                                |
| `"first"`   | 只引用第一個傳出回覆分段                                              |
| `"all"`     | 引用每個傳出回覆分段                                                  |
| `"batched"` | 引用佇列中的批次回覆，但讓立即回覆不引用                              |

預設為 `"off"`。每帳號覆寫使用 `channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## 反應等級

`channels.whatsapp.reactionLevel` 控制代理在 WhatsApp 上使用表情符號反應的廣泛程度：

| 等級          | 確認反應 | 代理主動反應       | 說明                         |
| ------------- | -------- | ------------------ | ---------------------------- |
| `"off"`       | 否       | 否                 | 完全沒有反應                 |
| `"ack"`       | 是       | 否                 | 僅確認反應（回覆前回條）     |
| `"minimal"`   | 是       | 是（保守）         | 確認 + 具有保守指引的代理反應 |
| `"extensive"` | 是       | 是（鼓勵）         | 確認 + 具有鼓勵指引的代理反應 |

預設：`"minimal"`。

每帳號覆寫使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## 確認反應

WhatsApp 支援透過 `channels.whatsapp.ackReaction` 在傳入接收時立即送出確認反應。
確認反應受 `reactionLevel` 門檻控制：當 `reactionLevel` 為 `"off"` 時會被抑制。

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

- 會在傳入被接受後立即傳送（回覆前）
- 如果存在 `ackReaction` 但沒有 `emoji`，WhatsApp 會使用路由代理的身分表情符號，後備為 "👀"；省略 `ackReaction` 或設定 `emoji: ""` 則不傳送確認反應
- 失敗會被記錄，但不會阻擋正常回覆傳送
- 群組模式 `mentions` 會在提及觸發的回合上反應；群組啟用 `always` 會作為此檢查的旁路
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此處不使用舊版 `messages.ackReaction`）

## 生命週期狀態反應

設定 `messages.statusReactions.enabled: true`，讓 WhatsApp 在回合期間取代確認反應，而不是留下靜態回條表情符號。啟用時，OpenClaw 會對佇列中、思考中、工具活動、壓縮、完成與錯誤等生命週期狀態使用同一個傳入訊息反應欄位。

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

行為備註：

- `channels.whatsapp.ackReaction` 仍控制狀態反應是否適用於直接訊息與群組。
- 佇列中狀態反應使用與純確認反應相同的有效確認表情符號。
- WhatsApp 每則訊息只有一個機器人反應欄位，因此生命週期更新會就地取代目前反應。
- `messages.removeAckAfterReply: true` 會在設定的完成/錯誤保留時間後清除最終狀態反應。
- 工具表情符號類別包括 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多帳號與憑證

<AccordionGroup>
  <Accordion title="帳號選擇與預設值">
    - 帳號 ID 來自 `channels.whatsapp.accounts`
    - 預設帳號選擇：若存在則使用 `default`，否則使用第一個已設定的帳號 ID（排序後）
    - 帳號 ID 會在內部正規化以供查找

  </Accordion>

  <Accordion title="憑證路徑與舊版相容性">
    - 目前驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 備份檔案：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的舊版預設驗證仍會被預設帳號流程辨識/遷移

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。

    當閘道可連線時，登出會先停止所選帳號的即時 WhatsApp 監聽器，讓已連結工作階段不會在下次重新啟動前持續接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳號設定前停止即時監聽器。

    在舊版驗證目錄中，會保留 `oauth.json`，同時移除 Baileys 驗證檔案。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理工具支援包含 WhatsApp 反應動作（`react`）。
- 動作門檻：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 預設會啟用由頻道發起的設定寫入（可透過 `channels.whatsapp.configWrites=false` 停用）。

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

  <Accordion title="已連結但已中斷 / 重新連線迴圈">
    症狀：已連結帳號反覆中斷或嘗試重新連線。

    安靜帳號可以在一般訊息逾時後仍保持連線；當 WhatsApp Web 傳輸活動停止、socket 關閉，或
    應用層級活動靜默超過較長的安全視窗時，watchdog
    會重新啟動。

    如果日誌顯示重複的 `status=408 Request Time-out Connection was lost`，請調整
    `web.whatsapp` 下的 Baileys socket 時序。先將
    `keepAliveIntervalMs` 縮短到低於你網路的閒置逾時，並在較慢或容易丟包的連線上提高
    `connectTimeoutMs`：

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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    如果在修正主機連線能力與時序後迴圈仍持續，請備份
    帳號驗證目錄，並重新連結該帳號：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但
    `openclaw gateway status` 與 `openclaw channels status --probe` 顯示
    閘道與 WhatsApp 狀態正常，請執行 `openclaw doctor`。在 Linux 上，doctor
    會警告仍呼叫
    `~/.openclaw/bin/ensure-whatsapp.sh` 的舊版 crontab 項目；請用
    `crontab -e` 移除這些過時項目，因為 cron 可能缺少 systemd 使用者匯流排環境，
    導致舊腳本誤報閘道健康狀態。

    如有需要，請使用 `channels login` 重新連結。

  </Accordion>

  <Accordion title="QR 登入在代理後方逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用的 QR 碼前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 中斷連線。

    WhatsApp Web 登入會使用閘道主機的標準代理環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體，以及 `NO_PROXY`）。請確認閘道程序繼承代理環境變數，且 `NO_PROXY` 不會匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的監聽器">
    當目標帳號沒有作用中的閘道監聽器時，對外傳送會快速失敗。

    請確認閘道正在執行，且帳號已連結。

  </Accordion>

  <Accordion title="回覆出現在逐字稿中但未出現在 WhatsApp">
    逐字稿列會記錄代理產生的內容。WhatsApp 傳遞會另外檢查：OpenClaw 只會在 Baileys 針對至少一個可見文字或媒體傳送回傳對外訊息 ID 後，才將自動回覆視為已送出。

    確認回應表情是獨立的回覆前收據。成功的回應表情不代表後續文字或媒體回覆已被 WhatsApp 接受。

    請檢查閘道日誌中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息非預期地被忽略">
    請依此順序檢查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允許清單項目
    - 提及閘控（`requireMention` + 提及模式）
    - `openclaw.json` (JSON5) 中的重複鍵：後面的項目會覆蓋前面的項目，因此每個作用域只保留一個 `groupPolicy`

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍可觀察來自其他群組的訊息，但 OpenClaw 會在工作階段路由前捨棄它們。請將群組 JID 加入 `channels.whatsapp.groups`，或加入 `groups["*"]` 以允許所有群組，同時仍透過 `groupPolicy` 與 `groupAllowFrom` 維持傳送者授權。

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    WhatsApp 閘道執行階段應使用節點。Bun 會被標記為不相容於穩定的 WhatsApp/Telegram 閘道操作。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 透過 `groups` 與 `direct` 對應表，支援群組與直接聊天的 Telegram 風格系統提示。

群組訊息的解析階層：

有效的 `groups` 對應表會先決定：如果帳號定義自己的 `groups`，它會完全取代根層級的 `groups` 對應表（不做深層合併）。接著提示查找會在產生的單一對應表上執行：

1. **群組特定系統提示**（`groups["<groupId>"].systemPrompt`）：當特定群組項目存在於對應表中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用系統提示。
2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於對應表中，或項目存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析階層：

有效的 `direct` 對應表會先決定：如果帳號定義自己的 `direct`，它會完全取代根層級的 `direct` 對應表（不做深層合併）。接著提示查找會在產生的單一對應表上執行：

1. **直接聊天特定系統提示**（`direct["<peerId>"].systemPrompt`）：當特定對等方項目存在於對應表中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用系統提示。
2. **直接聊天萬用字元系統提示**（`direct["*"].systemPrompt`）：當特定對等方項目完全不存在於對應表中，或項目存在但未定義 `systemPrompt` 鍵時使用。

<Note>
`dms` 仍是輕量的每個 DM 歷史覆寫儲存桶（`dms.<id>.historyLimit`）。提示覆寫位於 `direct` 下。
</Note>

**與 Telegram 多帳號行為的差異：** 在 Telegram 中，多帳號設定會刻意對所有帳號抑制根層級 `groups`，即使帳號未定義自己的 `groups` 也一樣，以防止 Bot 接收它不屬於之群組的群組訊息。WhatsApp 不會套用此保護：未定義帳號層級覆寫的帳號，一律會繼承根層級 `groups` 與根層級 `direct`，無論設定了多少帳號。在多帳號 WhatsApp 設定中，如果你想要每個帳號各自的群組或直接聊天提示，請在每個帳號下明確定義完整對應表，而不是依賴根層級預設值。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定對應表，也是聊天層級的群組允許清單。在根層級或帳號作用域中，`groups["*"]` 對該作用域表示「允許所有群組」。
- 只有當你已經希望該作用域允許所有群組時，才加入萬用字元群組 `systemPrompt`。如果你仍希望只有固定的一組群組 ID 符合資格，請不要使用 `groups["*"]` 作為提示預設值。請改為在每個明確列入允許清單的群組項目上重複該提示。
- 群組准入與傳送者授權是不同的檢查。`groups["*"]` 會擴大可進入群組處理的群組集合，但它本身不會授權這些群組中的每個傳送者。傳送者存取仍由 `channels.whatsapp.groupPolicy` 與 `channels.whatsapp.groupAllowFrom` 分別控制。
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
- [頻道路由](/zh-TW/channels/channel-routing)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
