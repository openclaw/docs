---
read_when:
    - 處理 WhatsApp/網頁通道行為或收件匣路由
summary: WhatsApp 頻道支援、存取控制、傳遞行為與營運
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:26:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：可用於生產環境，透過 WhatsApp Web (Baileys)。閘道擁有已連結的工作階段。

## 安裝（按需）

- 入門設定（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  會在你第一次選取 WhatsApp 外掛時提示安裝。
- 當外掛尚未存在時，`openclaw channels login --channel whatsapp` 也會提供安裝流程。
- 開發通道 + git checkout：預設使用本機外掛路徑。
- Stable/Beta：會先從 ClawHub 安裝官方 `@openclaw/whatsapp` 外掛，
  並以 npm 作為備援。
- WhatsApp 執行階段會在核心 OpenClaw npm 套件之外散布，因此
  WhatsApp 專用的執行階段相依性會留在外部外掛中。

仍可使用手動安裝：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

只有在需要登錄檔備援時，才使用裸 npm 套件（`@openclaw/whatsapp`）。
只有在需要可重現安裝時，才釘選精確版本。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    未知傳送者的預設 DM 政策是配對。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復操作手冊。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-TW/gateway/configuration">
    完整通道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="Configure WhatsApp access policy">

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

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    目前登入是以 QR 為基礎。在遠端或無頭環境中，開始登入前，請確認你
    有可靠路徑可將即時 QR 碼傳送到將掃描它的手機。

    針對特定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加現有/自訂 WhatsApp Web 驗證目錄：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對請求會在 1 小時後過期。每個通道的待處理請求上限為 3 個。

  </Step>
</Steps>

<Note>
OpenClaw 建議在可行情況下，使用獨立號碼執行 WhatsApp。（通道中繼資料與設定流程已針對此設定最佳化，但也支援個人號碼設定。）
</Note>

<Warning>
目前的 WhatsApp 設定流程僅支援 QR。終端機呈現的 QR、截圖、
PDF 或聊天附件，在從遠端機器轉送時可能會過期或變得無法讀取。
對於遠端/無頭主機，請優先使用直接的 QR 圖片交付路徑，而不是手動擷取終端機畫面。
</Warning>

## 使用 MeowCaller 呼叫目前請求者（實驗性）

WhatsApp 外掛可以在源自 WhatsApp 的代理回合中公開 `whatsapp_call`。此工具
使用 [MeowCaller](https://github.com/purpshell/meowcaller) 向目前已授權的請求者撥出 WhatsApp 語音通話，
並在對方接聽後播放 OpenClaw TTS 訊息。此工具
不接受目的地號碼，因此提示無法將通話重新導向第三方。
此實驗性能力預設停用。

<Warning>
MeowCaller 屬於實驗性，沒有標記版本，並使用另外配對的 whatsmeow
已連結裝置工作階段。它無法重用 WhatsApp 外掛的 Baileys 認證。配對會將
另一個已連結裝置新增到同一個 WhatsApp 帳號。請使用 OpenClaw 所用的 WhatsApp 身分掃描。
個人號碼/自我聊天模式無法呼叫自己；請使用專用 OpenClaw 號碼
來呼叫你的個人號碼。
</Warning>

<Steps>
  <Step title="Enable experimental calls">

    將 `actions.calls: true` 新增到 `openclaw.json` 中的 WhatsApp 通道：

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    將此合併到你現有的 WhatsApp 設定，然後重新啟動閘道。當此
    設定不存在或為 `false` 時，OpenClaw 不會向代理公開 `whatsapp_call` 工具。

  </Step>

  <Step title="Install the reviewed MeowCaller CLI">

    介面卡預期閘道主機的 `PATH` 上有名為 `meowcaller` 的可執行檔。
    在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合併前，請建置
    commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f` 的已審查分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    請確認 `$HOME/.local/bin` 也位於閘道服務的 `PATH` 上。此修訂版提供
    明確的 `pair` 和僅傳送的 `notify` 命令。`notify` 不會開啟麥克風、喇叭、
    視訊裝置、傳入音訊接收器或診斷擷取。請勿替換成範例
    命令列介面的 `play` 命令。

  </Step>

  <Step title="Pair the MeowCaller linked device">

    請 WhatsApp 代理檢查通話設定。`whatsapp_call` 狀態動作會回報
    帳號專屬狀態目錄與配對命令。對於預設帳號：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    在互動式終端機中執行此命令。從 **WhatsApp > Linked devices**
    掃描其 QR，並等待 `MeowCaller linked device ready`。命令隨後會結束。請將 `wa-voip.db`
    保密；它是 MeowCaller 已連結裝置工作階段。當你使用非預設帳號時，`whatsapp_call` 狀態動作
    會回傳帳號專屬命令與 shell。在
    Windows 上，請執行其 PowerShell 命令；MeowCaller 會建立儲存目錄。

  </Step>

  <Step title="Configure TTS and call from WhatsApp">

    設定具備電話能力的 [TTS 提供者](/zh-TW/tools/tts)，重新啟動閘道，然後傳送
    WhatsApp 請求，例如 `Call me and say the build finished.`。此工具會從受信任的
    傳入內容解析傳送者，合成暫時的私有 WAV 檔，在有界限的通話時間窗內執行 MeowCaller，
    並在之後刪除音訊檔。OpenClaw 會明確傳入帳號的
    儲存區，在接聽、播放與掛斷後等待零退出狀態，並將
    逾時或非零退出視為工具呼叫失敗。

  </Step>
</Steps>

目前限制：

- 僅支援一對一外撥音訊通話
- 不支援任意目的地號碼
- 不與聊天連線共用驗證
- 個人號碼/自我聊天模式不支援自我通話
- 合成音訊限制為 60 秒
- 除了 MeowCaller 的接聽/播放/掛斷完成外，沒有手機端可聽見性的回執
- OpenClaw 會在有界限的 115–175 秒時間窗後停止伴隨程序，包括
  MeowCaller 的連線、接聽、播放與關閉階段

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    這是最乾淨的操作模式：

    - OpenClaw 使用獨立 WhatsApp 身分
    - 更清楚的 DM 允許清單與路由邊界
    - 降低自我聊天混淆的機率

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

  <Accordion title="Personal-number fallback">
    入門設定支援個人號碼模式，並寫入適合自我聊天的基準：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的個人號碼
    - `selfChatMode: true`

    在執行階段，自我聊天保護會依據已連結的自身號碼和 `allowFrom`。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    在目前 OpenClaw 通道架構中，訊息平台通道以 WhatsApp Web 為基礎（`Baileys`）。

    內建聊天通道登錄檔中沒有獨立的 Twilio WhatsApp 訊息通道。

  </Accordion>
</AccordionGroup>

## 執行階段模型

- 閘道擁有 WhatsApp socket 與重新連線迴圈。
- 重新連線 watchdog 使用 WhatsApp Web 傳輸活動，而不只是傳入應用程式訊息量，因此安靜的已連結裝置工作階段不會只因最近沒有人傳送訊息就重新啟動。較長的應用程式靜默上限仍會在傳輸框架持續到達、但 watchdog 時間窗內沒有處理任何應用程式訊息時強制重新連線；對於最近活躍工作階段的暫時重新連線，該應用程式靜默檢查會在第一個復原時間窗使用一般訊息逾時。
- Baileys socket 時間設定明確位於 `web.whatsapp.*` 下：`keepAliveIntervalMs` 控制 WhatsApp Web 應用程式 ping，`connectTimeoutMs` 控制開啟握手逾時，而 `defaultQueryTimeoutMs` 控制 Baileys 查詢等待，加上 OpenClaw 本機外撥傳送/在線狀態與傳入讀取回執操作界限。
- 外撥傳送需要目標帳號有作用中的 WhatsApp 監聽器。
- 當文字和媒體說明中的 `@+<digits>` 與 `@<digits>` token 符合目前 WhatsApp 參與者中繼資料時，群組傳送會附加原生提及中繼資料，包括以 LID 支援的群組。
- 狀態與廣播聊天會被忽略（`@status`、`@broadcast`）。
- 重新連線 watchdog 會依循 WhatsApp Web 傳輸活動，而不只是傳入應用程式訊息量：只要傳輸框架持續，安靜的已連結裝置工作階段就會維持連線，但傳輸停滯會在較晚的遠端斷線路徑之前強制重新連線。
- 直接聊天使用 DM 工作階段規則（`session.dmScope`；預設 `main` 會將 DM 收斂到代理主工作階段）。
- 群組工作階段會隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以是使用其原生 `@newsletter` JID 的明確外撥目標。外撥 newsletter 傳送使用通道工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而非 DM 工作階段語意。
- WhatsApp Web 傳輸會遵循閘道主機上的標準 Proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小寫變體）。請優先使用主機層級 Proxy 設定，而不是通道專屬 WhatsApp Proxy 設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 WhatsApp ack 反應。

## 核准提示

WhatsApp 可以使用 `👍` / `👎` 反應呈現 exec 與外掛核准提示。傳遞
由頂層核准轉送設定控制：

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
工作階段模式只會為源自 WhatsApp 的核准傳遞原生 emoji 核准。
目標模式會使用共用轉送管線處理明確 WhatsApp 目標，
且不會建立個別的核准者 DM fanout。

WhatsApp 核准反應需要來自 `allowFrom` 或 `"*"` 的明確 WhatsApp 核准者。
`defaultTo` 控制一般預設訊息目標；它不是核准者。手動
`/approve` 命令在核准解析前，仍會通過一般 WhatsApp 傳送者授權路徑。

## 外掛 hook 與隱私

WhatsApp 傳入訊息可能包含個人訊息內容、電話號碼、
群組識別碼、寄件者名稱和工作階段關聯欄位。因此，
除非你明確選擇啟用，否則 WhatsApp 不會將傳入的 `message_received` 鉤子酬載廣播給外掛：

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

你可以將啟用範圍限定到一個帳號：

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

只有在你信任外掛能接收傳入 WhatsApp 訊息內容和識別碼時，才啟用此功能。

## 存取控制與啟用

<Tabs>
  <Tab title="私訊政策">
    `channels.whatsapp.dmPolicy` 控制直接聊天存取：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 風格的號碼（內部會正規化）。

    `allowFrom` 是私訊寄件者存取控制清單。它不會限制明確傳出到 WhatsApp 群組 JID 或 `@newsletter` 頻道 JID 的訊息。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（和 `allowFrom`）會優先於該帳號的頻道層級預設值。

    執行階段行為詳細資訊：

    - 配對會保存在頻道 allow-store 中，並與設定的 `allowFrom` 合併
    - 排程自動化和心跳偵測收件者後援會使用明確的傳遞目標或設定的 `allowFrom`；私訊配對核准不會隱含成為排程或心跳偵測收件者
    - 如果未設定 allowlist，預設允許已連結的自身號碼
    - OpenClaw 絕不會自動配對傳出的 `fromMe` 私訊（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策 + allowlist">
    群組存取有兩層：

    1. **群組成員資格 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群組都符合資格
       - 如果存在 `groups`，它會作為群組 allowlist（允許 `"*"`）

    2. **群組寄件者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：略過寄件者 allowlist
       - `allowlist`：寄件者必須符合 `groupAllowFrom`（或 `*`）
       - `disabled`：封鎖所有群組傳入訊息

    寄件者 allowlist 後援：

    - 如果未設定 `groupAllowFrom`，執行階段會在可用時回退到 `allowFrom`
    - 寄件者 allowlist 會在提及/回覆啟用之前評估

    注意：如果完全沒有 `channels.whatsapp` 區塊，即使已設定 `channels.defaults.groupPolicy`，執行階段群組政策後援仍是 `allowlist`（並帶有警告記錄）。

  </Tab>

  <Tab title="提及 + /activation">
    群組回覆預設需要提及。

    提及偵測包含：

    - 明確提及機器人身分的 WhatsApp 提及
    - 設定的提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 授權群組訊息的傳入語音記事轉錄
    - 隱含的回覆機器人偵測（回覆寄件者符合機器人身分）

    安全性注意事項：

    - 引用/回覆只會滿足提及門檻；它**不會**授予寄件者授權
    - 使用 `groupPolicy: "allowlist"` 時，未列入 allowlist 的寄件者即使回覆已列入 allowlist 使用者的訊息，仍會被封鎖

    工作階段層級啟用命令：

    - `/activation mention`
    - `/activation always`

    `activation` 會更新工作階段狀態（不是全域設定）。它受擁有者門檻控制。

  </Tab>
</Tabs>

## 已設定的 ACP 繫結

WhatsApp 支援使用頂層 `bindings[]` 項目的持久 ACP 繫結：

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

- 直接聊天會比對 E.164 號碼，例如 `+15555550123`。
- 群組會比對 WhatsApp 群組 JID，例如 `120363424282127706@g.us`。
- 群組 allowlist、寄件者政策，以及提及或啟用門檻，會在 OpenClaw 確保已設定的 ACP 工作階段存在之前執行。
- 符合的已設定 ACP 繫結會擁有該路由。WhatsApp 廣播群組不會將該輪對話展開傳送到一般 WhatsApp 工作階段。

## 個人號碼與自我聊天行為

當已連結的自身號碼也存在於 `allowFrom` 中時，WhatsApp 自我聊天防護會啟用：

- 略過自我聊天輪次的讀取回條
- 忽略原本會 ping 你自己的 mention-JID 自動觸發行為
- 如果未設定 `messages.responsePrefix`，自我聊天回覆預設為 `[{identity.name}]` 或 `[openclaw]`

## 訊息正規化與脈絡

<AccordionGroup>
  <Accordion title="傳入信封 + 回覆脈絡">
    傳入的 WhatsApp 訊息會包裝在共用傳入信封中。

    如果存在引用回覆，脈絡會以下列形式附加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時也會填入回覆中繼資料欄位（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、寄件者 JID/E.164）。
    當引用回覆目標是可下載媒體時，OpenClaw 會透過
    一般傳入媒體儲存區儲存它，並以 `MediaPath`/`MediaType` 公開，
    讓代理可以檢查被參照的圖片，而不只是看到
    `<media:image>`。

  </Accordion>

  <Accordion title="媒體預留位置與位置/聯絡人擷取">
    僅含媒體的傳入訊息會以如下預留位置正規化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    授權群組語音記事會在提及門檻之前轉錄；當
    內文只有 `<media:audio>` 時，在語音記事中說出機器人提及即可
    觸發回覆。如果轉錄仍未提及機器人，
    轉錄會保留在待處理群組歷史中，而不是原始預留位置。

    位置內文使用簡潔的座標文字。位置標籤/註解和聯絡人/vCard 詳細資訊會呈現為圍欄式不受信任中繼資料，而不是行內提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    對於群組，未處理的訊息可以先緩衝，並在機器人最終被觸發時作為脈絡注入。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    注入標記：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="讀取回條">
    預設會為接受的傳入 WhatsApp 訊息啟用讀取回條。

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

    自我聊天輪次即使在全域啟用時也會略過讀取回條。

  </Accordion>
</AccordionGroup>

## 傳遞、分段與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式偏好段落邊界（空白行），然後回退到長度安全的分段

  </Accordion>

  <Accordion title="傳出媒體行為">
    - 支援圖片、影片、音訊（PTT 語音記事）和文件酬載
    - 音訊媒體會透過 Baileys `audio` 酬載並以 `ptt: true` 傳送，因此 WhatsApp 用戶端會將其呈現為按住說話語音記事
    - 回覆酬載會保留 `audioAsVoice`；即使供應商回傳 MP3 或 WebM，WhatsApp 的 TTS 語音記事輸出仍會留在此 PTT 路徑上
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送，以維持語音記事相容性
    - 非 Ogg 音訊，包括 Microsoft Edge TTS MP3/WebM 輸出，會在 PTT 傳遞前使用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus
    - `/tts latest` 會將最新助理回覆作為一則語音記事傳送，並抑制同一回覆的重複傳送；`/tts chat on|off|default` 控制目前 WhatsApp 聊天的自動 TTS
    - 透過影片傳送上的 `gifPlayback: true` 支援動畫 GIF 播放
    - `forceDocument` / `asDocument` 會透過 Baileys 文件酬載傳送傳出圖片、GIF 和影片，以避免 WhatsApp 媒體壓縮，同時保留解析出的檔名和 MIME 類型
    - 傳送多媒體回覆酬載時，標題會套用到第一個媒體項目；但 PTT 語音記事會先傳送音訊，並另外傳送可見文字，因為 WhatsApp 用戶端不會一致呈現語音記事標題
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與後援行為">
    - 傳入媒體儲存上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 傳出媒體傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每帳號覆寫使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小/品質掃描）以符合限制，除非 `forceDocument` / `asDocument` 要求文件傳遞
    - 媒體傳送失敗時，第一項目後援會傳送文字警告，而不是靜默丟棄回覆

  </Accordion>
</AccordionGroup>

## 回覆引用

WhatsApp 支援原生回覆引用，傳出回覆會可見地引用傳入訊息。使用 `channels.whatsapp.replyToMode` 控制它。

| 值          | 行為                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；作為純訊息傳送                                              |
| `"first"`   | 只引用第一個傳出回覆分段                                              |
| `"all"`     | 引用每個傳出回覆分段                                                  |
| `"batched"` | 引用已排入佇列的批次回覆，同時讓即時回覆不引用                        |

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

## 反應層級

`channels.whatsapp.reactionLevel` 控制代理在 WhatsApp 上使用表情符號反應的廣度：

| 層級          | 確認反應 | 代理主動反應 | 說明                                             |
| ------------- | -------- | ------------ | ------------------------------------------------ |
| `"off"`       | 否       | 否           | 完全沒有反應                                     |
| `"ack"`       | 是       | 否           | 僅確認反應（回覆前收件確認）                     |
| `"minimal"`   | 是       | 是（保守）   | 確認 + 代理反應，並採用保守指引                  |
| `"extensive"` | 是       | 是（鼓勵）   | 確認 + 代理反應，並採用鼓勵指引                  |

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

WhatsApp 支援透過 `channels.whatsapp.ackReaction` 在傳入收件時立即傳送確認反應。
確認反應受 `reactionLevel` 控制 — 當 `reactionLevel` 為 `"off"` 時會被抑制。

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

- 在接受傳入訊息後立即傳送（回覆前）
- 如果 `ackReaction` 存在但沒有 `emoji`，WhatsApp 會使用路由到的代理身分表情符號，並在沒有時退回使用 "👀"；省略 `ackReaction` 或設定 `emoji: ""` 可不傳送確認反應
- 失敗會被記錄，但不會阻擋正常回覆傳遞
- 群組模式 `mentions` 會在由提及觸發的回合中反應；群組啟用 `always` 會作為此檢查的旁路
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此處不使用舊版 `messages.ackReaction`）

## 生命週期狀態反應

設定 `messages.statusReactions.enabled: true`，讓 WhatsApp 在回合期間替換確認反應，而不是留下靜態收據表情符號。啟用後，OpenClaw 會針對已佇列、思考中、工具活動、壓縮、完成和錯誤等生命週期狀態，使用同一個傳入訊息反應槽。

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

- `channels.whatsapp.ackReaction` 仍會控制狀態反應是否適用於私訊和群組。
- 已佇列狀態反應會使用與一般確認反應相同的有效確認表情符號。
- WhatsApp 每則訊息只有一個機器人反應槽，因此生命週期更新會就地取代目前反應。
- `messages.removeAckAfterReply: true` 會在設定的完成/錯誤保留時間後清除最終狀態反應。
- 工具表情符號類別包含 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多帳號與憑證

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - 帳號 ID 來自 `channels.whatsapp.accounts`
    - 預設帳號選擇：如果存在則使用 `default`，否則使用第一個已設定帳號 ID（排序後）
    - 帳號 ID 會在內部正規化以供查找

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - 目前驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 備份檔案：`creds.json.bak`
    - 仍會辨識/遷移 `~/.openclaw/credentials/` 中的舊版預設驗證，以支援預設帳號流程

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。

    當閘道可連線時，登出會先停止所選帳號的即時 WhatsApp 監聽器，避免已連結工作階段在下次重新啟動前持續接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳號設定前停止即時監聽器。

    在舊版驗證目錄中，`oauth.json` 會被保留，而 Baileys 驗證檔案會被移除。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理工具支援包含 WhatsApp 反應動作 (`react`)。
- 動作閘門：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 預設啟用由頻道發起的設定寫入（可透過 `channels.whatsapp.configWrites=false` 停用）。

## 疑難排解

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    症狀：頻道狀態回報尚未連結。

    修正：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    症狀：已連結帳號重複中斷連線或嘗試重新連線。

    安靜帳號可在一般訊息逾時後仍保持連線；當 WhatsApp Web 傳輸活動停止、通訊端關閉，或
    應用程式層級活動在較長安全時間窗後仍保持靜默時，監視器會重新啟動。

    如果日誌顯示重複的 `status=408 Request Time-out Connection was lost`，請調整
    `web.whatsapp` 下的 Baileys 通訊端時序。先將
    `keepAliveIntervalMs` 縮短到低於你的網路閒置逾時，並在緩慢或不穩定的連線上增加
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
    帳號驗證目錄並重新連結該帳號：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但
    `openclaw gateway status` 和 `openclaw channels status --probe` 顯示
    閘道與 WhatsApp 狀態正常，請執行 `openclaw doctor`。在 Linux 上，doctor
    會警告仍呼叫 `~/.openclaw/bin/ensure-whatsapp.sh` 的舊版 crontab 項目；請使用
    `crontab -e` 移除這些過期項目，因為 cron 可能缺少 systemd 使用者匯流排環境，並
    使該舊指令碼誤報閘道健康狀態。

    如有需要，請使用 `channels login` 重新連結。

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用 QR 碼前失敗，並出現 `status=408 Request Time-out` 或 TLS 通訊端中斷連線。

    WhatsApp Web 登入會使用閘道主機的標準代理環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體和 `NO_PROXY`）。確認閘道程序會繼承代理環境，且 `NO_PROXY` 不會符合 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="No active listener when sending">
    當目標帳號沒有作用中的閘道監聽器時，對外傳送會快速失敗。

    請確認閘道正在執行且帳號已連結。

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    轉錄列會記錄代理產生的內容。WhatsApp 傳遞會另行檢查：OpenClaw 只有在 Baileys 針對至少一個可見文字或媒體傳送回傳對外訊息 ID 後，才會將自動回覆視為已傳送。

    確認反應是獨立的回覆前收據。成功的反應不代表後續文字或媒體回覆已被 WhatsApp 接受。

    請檢查閘道日誌中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    依此順序檢查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允許清單項目
    - 提及閘門（`requireMention` + 提及模式）
    - `openclaw.json` (JSON5) 中的重複鍵：後面的項目會覆寫前面的項目，因此每個範圍只保留單一 `groupPolicy`

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍可觀察來自其他群組的訊息，但 OpenClaw 會在工作階段路由前丟棄它們。將群組 JID 新增到 `channels.whatsapp.groups`，或新增 `groups["*"]` 以允許所有群組，同時仍透過 `groupPolicy` 和 `groupAllowFrom` 保持寄件者授權。

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp 閘道執行階段應使用節點。Bun 會被標記為不相容於穩定的 WhatsApp/Telegram 閘道操作。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 透過 `groups` 和 `direct` 對應支援適用於群組與直接聊天的 Telegram 風格系統提示。

群組訊息的解析階層：

有效的 `groups` 對應會先被決定：如果帳號定義自己的 `groups`，它會完整取代根層 `groups` 對應（不進行深層合併）。接著提示查找會在產生的單一對應上執行：

1. **群組特定系統提示** (`groups["<groupId>"].systemPrompt`)：當特定群組項目存在於對應中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串 (`""`)，萬用字元會被抑制，且不會套用任何系統提示。
2. **群組萬用字元系統提示** (`groups["*"].systemPrompt`)：當特定群組項目完全不存在於對應中，或存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析階層：

有效的 `direct` 對應會先被決定：如果帳號定義自己的 `direct`，它會完整取代根層 `direct` 對應（不進行深層合併）。接著提示查找會在產生的單一對應上執行：

1. **直接聊天特定系統提示** (`direct["<peerId>"].systemPrompt`)：當特定對等方項目存在於對應中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串 (`""`)，萬用字元會被抑制，且不會套用任何系統提示。
2. **直接聊天萬用字元系統提示** (`direct["*"].systemPrompt`)：當特定對等方項目完全不存在於對應中，或存在但未定義 `systemPrompt` 鍵時使用。

<Note>
`dms` 仍是輕量的每個私訊歷史覆寫儲存區 (`dms.<id>.historyLimit`)。提示覆寫位於 `direct` 下。
</Note>

**與 Telegram 多帳號行為的差異：** 在 Telegram 中，根層 `groups` 會刻意對多帳號設定中的所有帳號停用，包括未定義自己 `groups` 的帳號，以防止機器人接收其不屬於之群組的群組訊息。WhatsApp 不套用此防護：根層 `groups` 和根層 `direct` 一律會由未定義帳號層級覆寫的帳號繼承，無論設定了多少帳號。在多帳號 WhatsApp 設定中，如果你想要每個帳號各自的群組或直接聊天提示，請在每個帳號下明確定義完整對應，而不是依賴根層預設值。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定對應，也是聊天層級的群組允許清單。在根層或帳號範圍中，`groups["*"]` 表示該範圍「允許所有群組」。
- 只有在你已經希望該範圍允許所有群組時，才新增萬用字元群組 `systemPrompt`。如果你仍希望只有一組固定的群組 ID 符合資格，請不要使用 `groups["*"]` 作為提示預設值。請改為在每個明確允許清單中的群組項目上重複該提示。
- 群組准入與寄件者授權是分開的檢查。`groups["*"]` 會擴大可進入群組處理的群組集合，但它本身不會授權這些群組中的每個寄件者。寄件者存取仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 分別控制。
- `channels.whatsapp.direct` 對私訊沒有相同副作用。`direct["*"]` 只會在私訊已由 `dmPolicy` 加上 `allowFrom` 或配對儲存規則准入後，提供預設的直接聊天設定。

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

## 設定參考指引

主要參考：

- [設定參考 - WhatsApp](/zh-TW/gateway/config-channels#whatsapp)

高訊號 WhatsApp 欄位：

- 存取：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 傳遞：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多帳號：`accounts.<id>.enabled`、`accounts.<id>.authDir`、帳號層級覆寫
- 操作：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 工作階段行為：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示詞：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [頻道路由](/zh-TW/channels/channel-routing)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
