---
read_when:
    - 處理 WhatsApp/網頁渠道行為或收件匣路由
summary: WhatsApp 頻道支援、存取控制、傳遞行為與操作
title: WhatsApp
x-i18n:
    generated_at: "2026-07-05T11:04:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d006b750f387fac1ec0605d112fb2f753d0fc14354aa671cba300eac1fd5b3b
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：透過 WhatsApp Web（Baileys）已達生產就緒。閘道擁有已連結的工作階段；沒有獨立的 Twilio WhatsApp 頻道。

## 安裝

`openclaw onboard` 和 `openclaw channels add --channel whatsapp` 會在你第一次選取它時提示安裝外掛；如果缺少外掛，`openclaw channels login --channel whatsapp` 也會提供相同的安裝流程。開發用 checkout 會使用本機外掛路徑；穩定版/測試版會先從 ClawHub 安裝 `@openclaw/whatsapp`，再退回 npm。WhatsApp 執行階段在核心 OpenClaw npm 套件之外提供，因此它的執行階段相依性會保留在外部外掛中。手動安裝：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

只在登錄檔退回時使用裸 npm 套件（`@openclaw/whatsapp`）；只有在需要可重現安裝時才釘選確切版本。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    未知傳送者的預設私訊政策是配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復手冊。
  </Card>
  <Card title="閘道設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="設定存取政策">

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

    登入僅支援 QR。在遠端或無頭主機上，請在開始登入前準備可靠路徑，將即時 QR 傳送到手機；終端機呈現的 QR、螢幕截圖或聊天附件可能會在傳輸途中過期。

    針對特定帳戶：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加既有/自訂驗證目錄：

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

  <Step title="核准第一個配對要求（配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對要求會在 1 小時後過期；每個帳戶的待處理要求上限為 3 個。

  </Step>
</Steps>

<Note>
建議使用獨立的 WhatsApp 號碼（設定與中繼資料已針對此情境最佳化），但也完整支援個人號碼/自我聊天設定。
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    - OpenClaw 的獨立 WhatsApp 身分
    - 更清楚的私訊允許清單與路由邊界
    - 較低的自我聊天混淆機率

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

  <Accordion title="個人號碼退回">
    Onboarding 支援個人號碼模式，並寫入適合自我聊天的基準設定：`dmPolicy: "allowlist"`、`allowFrom` 包含你自己的號碼、`selfChatMode: true`。執行階段的自我聊天保護會根據已連結的自我號碼加上 `allowFrom` 判斷。
  </Accordion>
</AccordionGroup>

## 執行階段模型

- 閘道擁有 WhatsApp socket 和重新連線迴圈。
- 監看程式會獨立追蹤兩個訊號：原始 WhatsApp Web 傳輸活動與應用程式訊息活動。安靜但仍連線的工作階段不會只因最近沒有訊息抵達而重新啟動；只有在傳輸 frame 在固定內部時間窗內停止抵達（不可由使用者設定），或應用程式訊息靜默超過一般訊息逾時的 4 倍時，才會強制重新連線。對於最近活躍工作階段剛重新連線後，第一個時間窗會使用較短的一般訊息逾時，而不是 4 倍時間窗。
- Baileys socket 計時在 `web.whatsapp.*` 下明確設定：`keepAliveIntervalMs`（應用程式 ping 間隔）、`connectTimeoutMs`（開啟握手逾時）、`defaultQueryTimeoutMs`（Baileys 查詢等待時間，加上 OpenClaw 的對外傳送/顯示狀態與對內已讀回條逾時）。
- 對外傳送需要目標帳戶有作用中的 WhatsApp 監聽器；否則傳送會快速失敗。
- 群組傳送會在 `@+<digits>` 和 `@<digits>` token（文字與媒體字幕中）符合目前參與者中繼資料時，附加原生提及中繼資料，包括以 LID 為基礎的群組。
- 狀態與廣播聊天（`@status`、`@broadcast`）會被忽略。
- 直接聊天使用私訊工作階段規則（`session.dmScope`；預設 `main` 會將私訊合併到代理的主要工作階段）。群組工作階段依 JID 隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可透過其原生 `@newsletter` JID 成為明確的對外目標，使用頻道工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而不是私訊語意。
- WhatsApp Web 傳輸會遵循閘道主機上的標準 proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY`、小寫變體）。優先使用主機層級 proxy 設定，而不是個別頻道設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 ack 反應。

## 使用 MeowCaller 呼叫目前請求者（實驗性）

外掛可以在源自 WhatsApp 的代理輪次中公開 `whatsapp_call`。它使用 [MeowCaller](https://github.com/purpshell/meowcaller) 對目前已授權請求者撥打 WhatsApp 語音通話，並在對方接聽後播放 OpenClaw TTS 訊息。此工具沒有目的地號碼參數，因此提示無法重新導向通話。預設停用。

<Warning>
MeowCaller 屬於實驗性、沒有標記 release，並使用另外配對的 whatsmeow 已連結裝置工作階段，不能重用外掛的 Baileys 憑證。配對會為同一個 WhatsApp 帳戶新增另一個已連結裝置；請使用 OpenClaw 使用的身分掃描。個人號碼/自我聊天模式無法呼叫自己；請使用專用 OpenClaw 號碼呼叫你的個人號碼。
</Warning>

<Steps>
  <Step title="啟用實驗性通話">

    將 `actions.calls: true` 新增至 WhatsApp 頻道設定，並重新啟動閘道：

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

    缺少或為 `false` 時，OpenClaw 不會公開 `whatsapp_call` 工具。

  </Step>

  <Step title="安裝已審查的 MeowCaller 命令列介面">

    介面卡預期閘道主機的 `PATH` 上有 `meowcaller` 可執行檔。在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合併之前，請建置已審查的分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    確保 `$HOME/.local/bin` 位於閘道服務的 `PATH`。此修訂版具有明確的 `pair` 與僅傳送的 `notify` 命令；`notify` 不會開啟麥克風、喇叭、視訊裝置或診斷擷取。不要替換成上游範例命令列介面的 `play` 命令。

  </Step>

  <Step title="配對 MeowCaller 已連結裝置">

    要求 WhatsApp 代理檢查通話設定（`whatsapp_call` 狀態動作會回報帳戶專屬狀態目錄與配對命令）。對於預設帳戶：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    以互動方式執行此命令，從 **WhatsApp > 已連結裝置** 掃描 QR，並等待 `MeowCaller linked device ready`。請將 `wa-voip.db` 保持私密，這是 MeowCaller 工作階段。非預設帳戶會從狀態動作取得自己的儲存路徑；在 Windows 上，請執行其 PowerShell 命令。

  </Step>

  <Step title="設定 TTS 並從 WhatsApp 撥打">

    設定支援電話功能的 [TTS 提供者](/zh-TW/tools/tts)，重新啟動閘道，然後傳送例如 `Call me and say the build finished.` 的要求。工具會從受信任的對內內容解析傳送者、合成暫時的私有 WAV 檔案、在有界通話時間窗內執行 MeowCaller，並在之後刪除音訊檔案。OpenClaw 會明確傳入帳戶的儲存位置、等待接聽/播放/掛斷後的零結束狀態，並將逾時或非零結束視為工具呼叫失敗。

  </Step>
</Steps>

限制：僅支援一對一對外音訊通話、沒有任意目的地號碼、無法與聊天連線共用驗證、個人號碼/自我聊天模式無法自我通話、合成音訊上限為 60 秒、除了 MeowCaller 的接聽/播放/掛斷完成之外，沒有手機端可聽見性的回條，且 OpenClaw 會在有界的 115-175 秒時間窗後停止伴隨程序（涵蓋 MeowCaller 的連線、接聽、播放與關閉階段）。

## 核准提示

WhatsApp 可以將 exec 與外掛核准提示呈現為 `👍`/`👎` 反應，由最上層核准轉送設定控制：

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

`approvals.exec` 和 `approvals.plugin` 彼此獨立；啟用 WhatsApp 作為頻道只會連結傳輸，除非相符的核准系列已啟用並路由到該處，否則不會傳送任何內容。工作階段模式只會對源自 WhatsApp 的核准傳送原生 emoji 核准。目標模式會針對明確目標使用共用轉送管線，且不會建立獨立的核准者私訊 fanout。

WhatsApp 核准反應需要在 `allowFrom`（或 `"*"`）中明確列出核准者。`defaultTo` 設定的是一般預設訊息目標，不是核准者清單。手動 `/approve` 命令在核准解析前仍會通過一般 WhatsApp 傳送者授權路徑。

## 外掛 hooks 與隱私

對內 WhatsApp 訊息可能帶有個人內容、電話號碼、群組識別碼、傳送者名稱與工作階段關聯欄位。除非你選擇加入，否則 WhatsApp 不會向外掛廣播對內 `message_received` hook payload：

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

將選擇加入範圍限定到 `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 下的一個帳戶。只對你信任可處理對內 WhatsApp 內容與識別碼的外掛啟用此功能。

## 存取控制與啟用

<Tabs>
  <Tab title="私訊政策">
    `channels.whatsapp.dmPolicy`：

    | 值 | 行為 |
    | --- | --- |
    | `pairing`（預設） | 未知傳送者要求配對；擁有者核准 |
    | `allowlist` | 只允許 `allowFrom` 傳送者進入 |
    | `open` | 需要 `allowFrom` 包含 `"*"` |
    | `disabled` | 封鎖所有私訊 |

    `allowFrom` 接受 E.164 風格號碼（內部會正規化）。它只是一份私訊傳送者存取控制清單，不會限制對群組 JID 或 `@newsletter` 頻道 JID 的明確對外傳送。

    多帳戶覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `.allowFrom`）會優先於該帳戶的頻道層級預設值。

    執行階段注意事項：

    - 配對會保存在頻道允許儲存中，並與已設定的 `allowFrom` 合併
    - 已排程的自動化與心跳偵測收件者退回會使用明確傳遞目標或已設定的 `allowFrom`；私訊配對核准不是隱含的排程/心跳偵測收件者
    - 若未設定允許清單，預設允許已連結的自我號碼
    - OpenClaw 永遠不會自動配對對外 `fromMe` 私訊（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策與允許清單">
    群組存取有兩層：

    1. **群組成員資格允許清單** (`channels.whatsapp.groups`)：如果省略 `groups`，所有群組都符合資格；如果存在，它會作為群組允許清單（`"*"` 允許全部）。
    2. **群組傳送者政策** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)：`open` 會略過傳送者允許清單，`allowlist` 需要符合 `groupAllowFrom`（或 `*`），`disabled` 會封鎖所有群組傳入訊息。

    如果未設定 `groupAllowFrom`，當 `allowFrom` 有項目時，傳送者檢查會回退到 `allowFrom`。傳送者允許清單會在提及/回覆啟用之前評估。

    如果完全沒有 `channels.whatsapp` 區塊，執行階段會回退到 `groupPolicy: "allowlist"`（並記錄警告日誌），即使 `channels.defaults.groupPolicy` 設為其他值也是如此。

    <Note>
    群組成員資格解析有單一帳號安全網：如果只設定了一個 WhatsApp 帳號，且其 `accounts.<id>.groups` 是明確的空物件 (`{}`)，系統會將它視為「未設定」，並回退到根層級的 `channels.whatsapp.groups` 對應，而不是靜默封鎖每個群組。設定 2 個以上帳號時，明確的空帳號對應會保持為空且不會回退，這讓一個帳號可以刻意停用所有群組，而不影響同層帳號。
    </Note>

  </Tab>

  <Tab title="提及與 /activation">
    群組回覆預設需要提及。提及偵測包含：

    - 明確提及機器人身分的 WhatsApp 提及
    - 已設定的提及 regex 模式 (`agents.list[].groupChat.mentionPatterns`，回退為 `messages.groupChat.mentionPatterns`)
    - 授權群組訊息的傳入語音備忘錄逐字稿
    - 隱含的回覆機器人偵測（回覆傳送者符合機器人身分）

    安全性：引用/回覆只滿足提及門檻，不會授予傳送者授權。使用 `groupPolicy: "allowlist"` 時，未在允許清單中的傳送者即使回覆允許清單使用者的訊息，仍會被封鎖。

    工作階段層級啟用命令：`/activation mention` 或 `/activation always`。這會更新工作階段狀態（不是全域設定），且受擁有者門檻限制。

  </Tab>
</Tabs>

## 已設定的 ACP 綁定

WhatsApp 支援透過頂層 `bindings[]` 進行持久 ACP 綁定：

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

直接聊天會比對 E.164 號碼；群組會比對 WhatsApp 群組 JID。群組允許清單、傳送者政策，以及提及/啟用門檻會在 OpenClaw 確保綁定的 ACP 工作階段存在之前執行。符合的綁定會擁有該路由；廣播群組不會將該回合分散到一般 WhatsApp 工作階段。

## 個人號碼與自我聊天行為

當連結的自我號碼也存在於 `allowFrom` 中時，自我聊天保護會啟用：略過自我聊天回合的讀取回條、忽略會 ping 自己的提及 JID 自動觸發行為，並在未設定 `messages.responsePrefix` 時，預設以 `[{identity.name}]`（或 `[openclaw]`）作為回覆前綴。

## 訊息正規化與內容脈絡

<AccordionGroup>
  <Accordion title="傳入封套與回覆內容脈絡">
    傳入訊息會包裝在共用傳入封套中。引用回覆會以下列形式附加內容脈絡：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時會填入回覆中繼資料（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。如果引用目標是可下載媒體，OpenClaw 會透過一般傳入媒體儲存區儲存它，並公開 `MediaPath`/`MediaType`，讓代理程式能直接檢查它，而不是只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒體預留位置與位置/聯絡人擷取">
    純媒體訊息會正規化為預留位置：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    授權群組語音備忘錄在本文只有 `<media:audio>` 時，會先於提及門檻之前轉錄，因此在語音備忘錄中說出機器人提及可以觸發回覆。如果逐字稿仍未提及機器人，它會保留在待處理群組歷史中，而不是原始預留位置。

    位置本文會呈現為簡短座標文字。位置標籤/註解和聯絡人/vCard 詳細資料會呈現為 fenced 不受信任中繼資料，而不是行內提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    未處理的群組訊息會緩衝，並在機器人最終被觸發時作為內容脈絡注入。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`，回退為 `messages.groupChat.historyLimit`
    - `0` 會停用

    注入標記：`[Chat messages since your last reply - for context]` 和 `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="讀取回條">
    對已接受的傳入訊息預設啟用。全域停用：

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    每帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`。即使全域啟用，自我聊天回合也會略過讀取回條。

  </Accordion>
</AccordionGroup>

## 傳遞、分塊與媒體

<AccordionGroup>
  <Accordion title="文字分塊">
    - 預設分塊限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`；`newline` 會偏好段落邊界（空白行），然後回退到長度安全的分塊

  </Accordion>

  <Accordion title="傳出媒體行為">
    - 支援圖片、影片、音訊（PTT 語音備忘錄）和文件承載
    - 音訊會以 Baileys `audio` 承載並帶有 `ptt: true` 傳送，呈現為按住說話語音備忘錄；`audioAsVoice` 會保留在回覆承載上，因此無論提供者的來源格式為何，TTS 語音備忘錄輸出都會保持在此路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送；其他任何格式（包含 Microsoft Edge TTS MP3/WebM 輸出）會先以 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus，再進行 PTT 傳遞
    - `/tts latest` 會將最新的助理回覆作為一則語音備忘錄傳送，並抑制同一則回覆的重複傳送；`/tts chat on|off|default` 會控制目前聊天的自動 TTS
    - 影片傳送上的 `gifPlayback: true` 會啟用動畫 GIF 播放
    - `forceDocument`/`asDocument` 會透過 Baileys 文件承載路由傳出的圖片、GIF 和影片，以避免 WhatsApp 的媒體壓縮，並保留解析後的檔名與 MIME 類型
    - 標題會套用到多媒體回覆中的第一個媒體項目，但 PTT 語音備忘錄除外：音訊會先傳送且沒有標題，接著標題會作為單獨的文字訊息傳送（WhatsApp 用戶端不會一致地呈現語音備忘錄標題）
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與回退行為">
    - 傳入儲存上限與傳出傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每帳號覆寫：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小/品質掃描）以符合限制，除非 `forceDocument`/`asDocument` 要求文件傳遞
    - 媒體傳送失敗時，第一項目回退會傳送文字警告，而不是靜默丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

`channels.whatsapp.replyToMode` 控制原生回覆引用（傳出回覆會明顯引用傳入訊息）：

| 值                | 行為                                                           |
| ----------------- | -------------------------------------------------------------- |
| `"off"`（預設）   | 永不引用；作為純訊息傳送                                       |
| `"first"`         | 只引用第一個傳出回覆分塊                                       |
| `"all"`           | 引用每個傳出回覆分塊                                           |
| `"batched"`       | 引用佇列中的批次回覆；立即回覆不引用                           |

每帳號覆寫：`channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## 反應層級

`channels.whatsapp.reactionLevel` 控制代理程式使用表情符號反應的廣泛程度：

| 層級                  | 確認反應 | 代理程式發起的反應   |
| --------------------- | -------- | -------------------- |
| `"off"`               | 否       | 否                   |
| `"ack"`               | 是       | 否                   |
| `"minimal"`（預設）   | 是       | 是，保守指引         |
| `"extensive"`         | 是       | 是，鼓勵性指引       |

每帳號覆寫：`channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 確認反應

`channels.whatsapp.ackReaction` 會在收到傳入訊息時立即傳送反應，受 `reactionLevel` 門檻限制（`"off"` 時抑制）：

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

注意：會在傳入訊息被接受後立即傳送（回覆前）；如果存在 `ackReaction` 但沒有 `emoji`，WhatsApp 會使用路由代理程式的身分 emoji，並回退為 "👀"（省略 `ackReaction` 或設定 `emoji: ""` 則不確認）；失敗會記錄日誌，但不會阻止回覆傳遞；群組模式 `mentions` 只會在提及觸發的回合反應，而群組啟用 `always` 會略過該檢查；WhatsApp 只使用 `channels.whatsapp.ackReaction`（舊版 `messages.ackReaction` 不適用於此處）。

## 生命週期狀態反應

設定 `messages.statusReactions.enabled: true`，讓 WhatsApp 在回合期間替換確認反應，而不是留下靜態收條 emoji，並在已佇列、思考中、工具活動、壓縮、完成和錯誤等狀態之間循環：

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

注意：`channels.whatsapp.ackReaction` 仍會控制直接訊息與群組的資格；已佇列狀態會使用與純確認反應相同的有效 emoji；WhatsApp 每則訊息只有一個機器人反應欄位，因此生命週期更新會就地替換目前反應；`messages.removeAckAfterReply: true` 會在設定的完成/錯誤保留時間後清除最終狀態反應；工具 emoji 類別包含 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多帳號與憑證

<AccordionGroup>
  <Accordion title="帳號選擇與預設值">
    帳號 ID 來自 `channels.whatsapp.accounts`。預設帳號選擇是 `default`（如果存在），否則是第一個已設定的帳號 ID（依字母排序）。帳號 ID 會在內部正規化以供查找。
  </Accordion>

  <Accordion title="憑證路徑與舊版相容性">
    - 目前驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（備份：`creds.json.bak`）
    - `~/.openclaw/credentials/` 中的舊版預設驗證仍會在預設帳號流程中被辨識/遷移

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。當閘道可連線時，登出會先停止該帳號的即時監聽器，因此連結的工作階段會在下次重新啟動前停止接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳號設定前停止即時監聽器。

    在舊版驗證目錄中，`oauth.json` 會保留，而 Baileys 驗證檔案會被移除。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理工具支援包含 WhatsApp 反應動作 (`react`)。
- 動作閘門：`channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（現有動作預設為 `true`）、`channels.whatsapp.actions.calls`（預設為 `false`，請參閱上方 MeowCaller）。
- 預設啟用由通道發起的設定寫入；可透過 `channels.whatsapp.configWrites: false` 停用。

## 疑難排解

<AccordionGroup>
  <Accordion title="未連結（需要 QR）">
    症狀：通道狀態回報未連結。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="已連結但已中斷連線／重新連線迴圈">
    症狀：已連結的帳號反覆中斷連線或嘗試重新連線。

    安靜帳號可以在一般訊息逾時後仍保持連線；看門狗只會在 WhatsApp Web 傳輸活動停止、socket 關閉，或應用程式層級活動沉默超過較長的安全時窗時重新啟動（請參閱上方執行階段模型）。

    如果記錄顯示重複的 `status=408 Request Time-out Connection was lost`，請在 `web.whatsapp` 下調整 Baileys socket 時序。先將 `keepAliveIntervalMs` 縮短到低於網路的閒置逾時，並在緩慢或易遺失封包的連線上增加 `connectTimeoutMs`：

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

    如果主機連線能力和時序修正後迴圈仍持續，請備份帳號驗證目錄並重新連結：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 都顯示健康，請執行 `openclaw doctor`。在 Linux 上，doctor 會警告呼叫已退役 `~/.openclaw/bin/ensure-whatsapp.sh` 指令碼的舊版 crontab 項目；請用 `crontab -e` 移除那些項目，因為 cron 可能缺少 systemd 使用者匯流排環境，導致該舊指令碼誤報閘道健康狀態。

  </Accordion>

  <Accordion title="QR 登入在代理後方逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用 QR 前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 中斷連線。

    WhatsApp Web 登入使用閘道主機的標準代理環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體、`NO_PROXY`）。請確認閘道程序繼承代理環境，且 `NO_PROXY` 不符合 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中監聽器">
    當目標帳號沒有作用中的閘道監聽器時，對外傳送會快速失敗。請確認閘道正在執行且帳號已連結。
  </Accordion>

  <Accordion title="回覆出現在逐字稿中，但不在 WhatsApp 中">
    逐字稿資料列會記錄代理產生的內容；WhatsApp 傳遞會另外檢查。OpenClaw 只有在 Baileys 為至少一個可見文字或媒體傳送回傳對外訊息 ID 後，才會將自動回覆視為已傳送。

    確認反應是獨立的回覆前收據；成功的反應不代表後續文字／媒體回覆已被接受。請檢查閘道記錄中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外被忽略">
    請依此順序檢查：`groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 允許清單項目、提及閘門（`requireMention` + 提及模式），以及 `openclaw.json` 中的重複鍵（JSON5 後面的項目會覆寫前面的項目，請在每個範圍只保留單一 `groupPolicy`）。

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍可觀察來自其他群組的訊息，但 OpenClaw 會在工作階段路由前丟棄它們。請將群組 JID 加到 `channels.whatsapp.groups`，或加入 `groups["*"]` 以允許所有群組，同時透過 `groupPolicy`/`groupAllowFrom` 保持寄件者授權控制。

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    WhatsApp 閘道執行階段應使用節點。Bun 被標記為不相容於穩定的 WhatsApp/Telegram 閘道操作。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 支援透過 `groups` 和 `direct` 對應表，為群組和直接聊天使用 Telegram 風格的系統提示。

群組訊息的解析方式：會先決定有效的 `groups` 對應表；如果帳號本身定義了任何 `groups` 鍵，它會完整取代根層級的 `groups` 對應表（不進行深度合併）。提示查找接著會在該單一結果對應表上執行：

1. **群組專用提示** (`groups["<groupId>"].systemPrompt`)：當群組項目存在**且**其 `systemPrompt` 鍵已定義時使用。空字串 (`""`) 會抑制萬用字元，且不套用任何提示。
2. **群組萬用字元提示** (`groups["*"].systemPrompt`)：當特定群組項目不存在，或存在但沒有 `systemPrompt` 鍵時使用。

直接訊息的解析方式會對 `direct` 對應表和 `direct["*"]` 採用相同模式。

<Note>
`dms` 仍是輕量的每個私訊歷史覆寫儲存區 (`dms.<id>.historyLimit`)。提示覆寫位於 `direct` 下。
</Note>

<Note>
此提示解析的帳號取代根層級行為，是單純的淺層覆寫：任何帳號 `groups`/`direct` 鍵，包括明確的空物件，都會取代根層級對應表。這不同於上方描述的群組成員資格允許清單檢查；後者針對意外空的 `groups: {}` 具有單一帳號安全網。
</Note>

**與 Telegram 的差異：** Telegram 會在多帳號設定中為每個帳號抑制根層級 `groups`（即使帳號沒有自己的 `groups`），以阻止 Bot 接收它不屬於的群組訊息。WhatsApp 不套用該防護；沒有自身覆寫的任何帳號都會繼承根層級 `groups`/`direct`，無論帳號數量。在多帳號 WhatsApp 設定中，如果你想要每帳號提示，請在每個帳號下明確定義完整對應表。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組設定對應表與聊天層級群組允許清單。在根層級或帳號範圍，`groups["*"]` 表示該範圍「允許所有群組」。
- 只有當你已經想讓該範圍允許所有群組時，才加入萬用字元 `systemPrompt`。若只要讓固定一組群組 ID 符合資格，請在每個明確允許清單項目上重複提示，而不要使用 `groups["*"]`。
- 群組准入和寄件者授權是不同的檢查。`groups["*"]` 會擴大哪些群組能進入群組處理；它不會授權那些群組中的每個寄件者，這仍由 `groupPolicy`/`groupAllowFrom` 控制。
- `channels.whatsapp.direct` 對私訊沒有等效副作用：`direct["*"]` 只會在私訊已透過 `dmPolicy` 加上 `allowFrom` 或配對儲存規則被准入後，提供預設設定。

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

主要參考：[設定參考 - WhatsApp](/zh-TW/gateway/config-channels#whatsapp)

| 區域             | 欄位                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 存取             | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| 傳遞             | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| 多帳號           | `accounts.<id>.enabled`, `accounts.<id>.authDir`，以及其他每帳號覆寫                                          |
| 操作             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| 工作階段行為     | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| 提示             | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [通道路由](/zh-TW/channels/channel-routing)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
