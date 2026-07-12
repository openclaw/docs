---
read_when:
    - 處理 WhatsApp／網頁頻道行為或收件匣路由分派
summary: WhatsApp 頻道支援、存取控制、傳遞行為與營運管理
title: WhatsApp
x-i18n:
    generated_at: "2026-07-11T21:08:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：已可透過 WhatsApp Web（Baileys）用於正式環境。閘道管理已連結的工作階段；沒有獨立的 Twilio WhatsApp 頻道。

## 安裝

首次選取 WhatsApp 時，`openclaw onboard` 和 `openclaw channels add --channel whatsapp` 會提示安裝外掛；如果缺少外掛，`openclaw channels login --channel whatsapp` 也會提供相同的安裝流程。開發版簽出使用本機外掛路徑；穩定版／測試版會先從 ClawHub 安裝 `@openclaw/whatsapp`，失敗時再改用 npm。WhatsApp 執行階段不包含在核心 OpenClaw npm 套件中，因此其執行階段相依套件會隨外部外掛一起提供。手動安裝：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

僅將未加前綴的 npm 套件（`@openclaw/whatsapp`）用於套件庫備援；只有在需要可重現安裝時，才固定確切版本。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    未知傳送者的預設私訊政策為配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
  <Card title="閘道設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
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

  <Step title="連結 WhatsApp（QR 碼）">

```bash
openclaw channels login --channel whatsapp
```

    登入僅支援 QR 碼。在遠端或無頭主機上，開始登入前，請確保有可靠的方式能將即時 QR 碼傳送到手機；終端機呈現的 QR 碼、螢幕截圖或聊天附件可能會在傳送途中失效。

    若要指定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加現有／自訂驗證目錄：

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

    配對要求會在 1 小時後失效；每個帳號最多可有 3 個待處理要求。

  </Step>
</Steps>

<Note>
建議使用獨立的 WhatsApp 號碼（設定與中繼資料已針對此方式最佳化），但也完整支援個人號碼／自我聊天設定。
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    - 為 OpenClaw 使用獨立的 WhatsApp 身分
    - 更清楚的私訊允許清單與路由邊界
    - 降低自我聊天混淆的機率

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
    初始設定支援個人號碼模式，並寫入適合自我聊天的基準設定：`dmPolicy: "allowlist"`、`allowFrom` 包含您自己的號碼，以及 `selfChatMode: true`。執行階段的自我聊天保護會依據已連結的自身號碼與 `allowFrom` 運作。
  </Accordion>
</AccordionGroup>

## 執行階段模型

- 閘道管理 WhatsApp 通訊端與重新連線迴圈。
- 監控程式會分別追蹤兩項訊號：原始 WhatsApp Web 傳輸活動與應用程式訊息活動。連線中但沒有活動的工作階段，不會只因近期未收到訊息就重新啟動；只有當傳輸框架在固定的內部時間範圍內停止抵達（使用者無法設定），或應用程式訊息保持靜默的時間超過一般訊息逾時的 4 倍時，才會強制重新連線。最近曾有活動的工作階段在重新連線後，第一個時間範圍會使用較短的一般訊息逾時，而不是 4 倍的時間範圍。Baileys 在該次重新連線初期傳送的離線訊息，OpenClaw 可以自動回覆，但會受到傳入訊息 ID 去重期限的限制；首次啟動仍會保留較短的過時歷史記錄防護。
- Baileys 通訊端的計時明確設定於 `web.whatsapp.*`：`keepAliveIntervalMs`（應用程式 ping 間隔）、`connectTimeoutMs`（建立連線交握逾時）、`defaultQueryTimeoutMs`（Baileys 查詢等待時間，以及 OpenClaw 的傳出傳送／上線狀態與傳入讀取回條逾時）。
- 傳出訊息要求目標帳號必須有作用中的 WhatsApp 監聽器；否則會立即失敗。
- 傳送群組訊息時，如果文字和媒體說明中的 `@+<digits>` 與 `@<digits>` 權杖符合目前的參與者中繼資料，便會附加原生提及中繼資料；這也包含由 LID 支援的群組。
- 會忽略狀態與廣播聊天（`@status`、`@broadcast`）。
- 直接聊天使用私訊工作階段規則（`session.dmScope`；預設值 `main` 會將私訊合併至代理程式的主要工作階段）。群組工作階段會依 JID 分隔（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp 頻道／電子報可透過其原生 `@newsletter` JID 明確指定為傳出目標，並使用頻道工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而不是私訊語意。
- WhatsApp Web 傳輸會遵循閘道主機上的標準 Proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` 及其小寫變體）。請優先使用主機層級的 Proxy 設定，而不是各頻道設定。
- 啟用 `messages.removeAckAfterReply` 後，OpenClaw 會在送達可見回覆後清除確認反應。

## 使用 MeowCaller 致電目前的要求者（實驗性）

此外掛可在源自 WhatsApp 的代理程式回合中公開 `whatsapp_call`。它使用 [MeowCaller](https://github.com/purpshell/meowcaller) 向目前已授權的要求者撥打 WhatsApp 語音通話，並在對方接聽後播放 OpenClaw TTS 訊息。此工具沒有目的地號碼參數，因此提示無法將通話重新導向。預設為停用。

<Warning>
MeowCaller 屬於實驗性功能，沒有加上標籤的發行版本，並使用另外配對的 whatsmeow 已連結裝置工作階段，無法重複使用此外掛的 Baileys 認證資料。配對會在同一個 WhatsApp 帳號中新增另一部已連結裝置；請使用 OpenClaw 所用的身分進行掃描。個人號碼／自我聊天模式無法致電自己；請使用專用的 OpenClaw 號碼致電您的個人號碼。
</Warning>

<Steps>
  <Step title="啟用實驗性通話">

    將 `actions.calls: true` 新增至 WhatsApp 頻道設定，然後重新啟動閘道：

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

    若未設定或設為 `false`，OpenClaw 不會公開 `whatsapp_call` 工具。

  </Step>

  <Step title="安裝已審查的 MeowCaller 命令列介面">

    轉接器預期閘道主機的 `PATH` 中存在 `meowcaller` 可執行檔。在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合併前，請建置已審查的分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    請確保閘道服務的 `PATH` 包含 `$HOME/.local/bin`。此修訂版提供明確的 `pair` 和僅傳送的 `notify` 命令；`notify` 不會開啟麥克風、喇叭、視訊裝置或診斷擷取。請勿改用上游範例命令列介面的 `play` 命令。

  </Step>

  <Step title="配對 MeowCaller 已連結裝置">

    要求 WhatsApp 代理程式檢查通話設定（`whatsapp_call` 狀態動作會回報該帳號專屬的狀態目錄與配對命令）。預設帳號的操作如下：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    以互動方式執行此命令，從 **WhatsApp > Linked devices** 掃描 QR 碼，並等待 `MeowCaller linked device ready`。請將 `wa-voip.db` 保密，這是 MeowCaller 工作階段。非預設帳號會從狀態動作取得各自的儲存路徑；在 Windows 上，請執行其 PowerShell 命令。

  </Step>

  <Step title="設定 TTS 並從 WhatsApp 撥打電話">

    設定支援電話通話的 [TTS 提供者](/zh-TW/tools/tts)，重新啟動閘道，然後傳送類似 `Call me and say the build finished.` 的要求。此工具會從受信任的傳入內容解析傳送者、合成暫時的私人 WAV 檔案、在有時間上限的通話期間執行 MeowCaller，並於之後刪除音訊檔案。OpenClaw 會明確傳入帳號的儲存區，等待接聽／播放／掛斷後回傳零結束狀態，並將逾時或非零結束狀態視為工具呼叫失敗。

  </Step>
</Steps>

限制：僅支援一對一傳出音訊通話、不支援任意目的地號碼、不與聊天連線共用驗證、個人號碼／自我聊天模式不支援自我通話、合成音訊上限為 60 秒、除了 MeowCaller 完成接聽／播放／掛斷外，不提供手機端是否可聽見的回條，且 OpenClaw 會在有限的 115 至 175 秒時間範圍後停止伴隨程序（涵蓋 MeowCaller 的連線、接聽、播放與關閉階段）。

## 核准提示

WhatsApp 可將執行與外掛核准提示呈現為 `👍`／`👎` 反應，由頂層核准轉送設定控制：

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

`approvals.exec` 與 `approvals.plugin` 彼此獨立；啟用 WhatsApp 頻道只會連結傳輸，除非啟用對應的核准類別並將其路由至該處，否則不會傳送任何內容。工作階段模式只會為源自 WhatsApp 的核准傳送原生表情符號核准。目標模式使用共用轉送管線來處理明確目標，不會建立獨立的核准者私訊扇出。

WhatsApp 核准反應要求在 `allowFrom` 中明確列出核准者（或使用 `"*"`）。`defaultTo` 設定一般的預設訊息目標，而非核准者清單。手動 `/approve` 命令在解析核准前，仍會經過一般的 WhatsApp 傳送者授權路徑。

## 外掛掛鉤與隱私權

傳入的 WhatsApp 訊息可能包含個人內容、電話號碼、群組識別碼、傳送者名稱與工作階段關聯欄位。除非您選擇加入，否則 WhatsApp 不會將傳入的 `message_received` 掛鉤承載資料廣播給外掛：

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

可在 `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 下將選擇加入範圍限制為單一帳號。只有在您信任外掛可存取傳入 WhatsApp 內容與識別碼時，才啟用此功能。

## 存取控制與啟用

<Tabs>
  <Tab title="私訊政策">
    `channels.whatsapp.dmPolicy`：

    | 值 | 行為 |
    | --- | --- |
    | `pairing`（預設） | 未知傳送者要求配對；擁有者核准 |
    | `allowlist` | 僅允許 `allowFrom` 中的傳送者 |
    | `open` | 要求 `allowFrom` 包含 `"*"` |
    | `disabled` | 封鎖所有私訊 |

    `allowFrom` 接受 E.164 樣式的號碼（內部會正規化）。它只是一份私訊傳送者的存取控制清單，不會限制明確傳送至群組 JID 或 `@newsletter` 頻道 JID 的傳出訊息。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（及 `.allowFrom`）對該帳號的優先順序高於頻道層級的預設值。

    執行階段注意事項：

    - 配對會持續保存在頻道允許儲存區中，並與已設定的 `allowFrom` 合併
    - 排程自動化與心跳偵測的收件者備援會使用明確的傳送目標或已設定的 `allowFrom`；私訊配對核准不會隱含成為排程／心跳偵測的收件者
    - 若未設定允許清單，預設允許已連結的本人號碼
    - OpenClaw 絕不會自動配對由 `fromMe` 傳出的私訊（即你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策與允許清單">
    群組存取分為兩層：

    1. **群組成員資格允許清單**（`channels.whatsapp.groups`）：若省略 `groups`，所有群組皆符合資格；若存在，則作為群組允許清單（`"*"` 允許所有群組）。
    2. **群組傳送者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）：`open` 會略過傳送者允許清單，`allowlist` 要求符合 `groupAllowFrom`（或 `*`），`disabled` 會封鎖所有群組傳入訊息。

    若未設定 `groupAllowFrom`，且 `allowFrom` 包含項目，傳送者檢查會改用 `allowFrom`。傳送者允許清單會在提及／回覆啟用條件之前評估。

    若完全不存在 `channels.whatsapp` 區塊，即使 `channels.defaults.groupPolicy` 設為其他值，執行階段仍會退回使用 `groupPolicy: "allowlist"`（並記錄警告）。

    <Note>
    群組成員資格解析具有單一帳號安全機制：若只設定一個 WhatsApp 帳號，且其 `accounts.<id>.groups` 是明確的空物件（`{}`），系統會將其視為「未設定」，並改用根層級的 `channels.whatsapp.groups` 對應表，而不會默默封鎖所有群組。若設定 2 個以上的帳號，明確的空帳號對應表會維持空白且不會退回使用根層級設定；如此即可讓某個帳號刻意停用所有群組，而不影響其他同層帳號。
    </Note>

  </Tab>

  <Tab title="提及與 /activation">
    群組回覆預設需要提及。提及偵測包括：

    - 明確提及機器人身分的 WhatsApp 提及
    - 已設定的提及正規表示式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 已授權群組訊息的傳入語音留言逐字稿
    - 隱含的回覆機器人偵測（回覆傳送者符合機器人身分）

    安全性：引用／回覆只會滿足提及門檻，**不會**授予傳送者授權。使用 `groupPolicy: "allowlist"` 時，不在允許清單中的傳送者即使回覆允許清單中使用者的訊息，仍會遭到封鎖。

    工作階段層級的啟用命令：`/activation mention` 或 `/activation always`。這會更新工作階段狀態（而非全域設定），且僅限擁有者操作。

  </Tab>
</Tabs>

## 已設定的 ACP 繫結

WhatsApp 支援透過頂層 `bindings[]` 設定持久性的 ACP 繫結：

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

直接聊天會比對 E.164 號碼；群組會比對 WhatsApp 群組 JID。群組允許清單、傳送者政策及提及／啟用門檻會在 OpenClaw 確保繫結的 ACP 工作階段存在之前執行。相符的繫結會掌管該路由；廣播群組不會將該次互動分派到一般 WhatsApp 工作階段。

## 個人號碼與自我聊天行為

當已連結的本人號碼也存在於 `allowFrom` 中時，會啟用自我聊天保護措施：略過自我聊天互動的已讀回條、忽略會通知自己的提及 JID 自動觸發行為，並在未設定 `messages.responsePrefix` 時，預設為回覆加上 `[{identity.name}]`（或 `[openclaw]`）。

## 訊息正規化與上下文

<AccordionGroup>
  <Accordion title="傳入封套與回覆上下文">
    傳入訊息會包裝於共用的傳入封套中。引用回覆會以下列格式附加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    若可取得，系統會填入回覆中繼資料（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID／E.164）。若引用目標是可下載的媒體，OpenClaw 會透過一般傳入媒體儲存區保存該媒體，並公開 `MediaPath`／`MediaType`，讓代理程式可直接檢查，而不只是看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒體預留位置與位置／聯絡人擷取">
    僅含媒體的訊息會正規化為預留位置：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    當訊息本文僅為 `<media:audio>` 時，已授權的群組語音留言會在提及門檻判定前轉錄，因此在語音留言中說出對機器人的提及即可觸發回覆。若逐字稿仍未提及機器人，該逐字稿會保留在待處理群組歷史中，而不是保留原始預留位置。

    位置資訊本文會呈現為精簡的座標文字。位置標籤／註解及聯絡人／vCard 詳細資料會呈現為以程式碼圍欄包住的不受信任中繼資料，而非行內提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    未處理的群組訊息會先緩衝，並在機器人最終被觸發時注入為上下文。

    - 預設上限：`50`
    - 設定：`channels.whatsapp.historyLimit`，備援為 `messages.groupChat.historyLimit`
    - `0` 表示停用

    注入標記：`[Chat messages since your last reply - for context]` 與 `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="已讀回條">
    預設會對已接受的傳入訊息啟用。若要全域停用：

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    個別帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`。即使已全域啟用，自我聊天互動仍會略過已讀回條。

  </Accordion>
</AccordionGroup>

## 傳送、分段與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段上限：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`；`newline` 會優先採用段落邊界（空白行），再退回使用符合長度安全限制的分段方式

  </Accordion>

  <Accordion title="傳出媒體行為">
    - 支援圖片、影片、音訊（PTT 語音留言）及文件承載資料
    - 音訊會以 Baileys `audio` 承載資料搭配 `ptt: true` 傳送，呈現為按住說話語音留言；回覆承載資料會保留 `audioAsVoice`，讓 TTS 語音留言輸出無論供應商來源格式為何，都維持使用此路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送；其他所有格式（包括 Microsoft Edge TTS 的 MP3／WebM 輸出）都會先由 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus，再以 PTT 傳送
    - `/tts latest` 會將最新的助理回覆作為一則語音留言傳送，並抑制同一回覆的重複傳送；`/tts chat on|off|default` 控制目前聊天的自動 TTS
    - 在影片傳送中設定 `gifPlayback: true` 可啟用 GIF 動畫播放
    - `forceDocument`／`asDocument` 會將傳出圖片、GIF 與影片導向 Baileys 文件承載資料，以避免 WhatsApp 的媒體壓縮，並保留解析出的檔名與 MIME 類型
    - 在多媒體回覆中，說明文字會套用至第一個媒體項目，但 PTT 語音留言除外：音訊會先以無說明文字的形式傳送，接著再將說明文字作為獨立文字訊息傳送（WhatsApp 用戶端無法一致地呈現語音留言說明文字）
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與備援行為">
    - 傳入儲存上限與傳出傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 個別帳號覆寫：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 除非 `forceDocument`／`asDocument` 要求以文件方式傳送，否則圖片會自動最佳化（調整大小／品質掃描）以符合限制
    - 媒體傳送失敗時，第一個項目的備援會傳送文字警告，而非默默捨棄回覆

  </Accordion>
</AccordionGroup>

## 回覆引用

`channels.whatsapp.replyToMode` 控制原生回覆引用（傳出回覆會明顯引用傳入訊息）：

| 值                | 行為                                             |
| ----------------- | ------------------------------------------------ |
| `"off"`（預設）   | 永不引用；以一般訊息傳送                         |
| `"first"`         | 僅引用第一個傳出回覆分段                         |
| `"all"`           | 引用每個傳出回覆分段                             |
| `"batched"`       | 引用佇列中的批次回覆；即時回覆則不加引用         |

個別帳號覆寫：`channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## 回應層級

`channels.whatsapp.reactionLevel` 控制代理程式使用表情符號回應的廣泛程度：

| 層級                  | 確認回應 | 代理程式主動發起的回應 |
| --------------------- | -------- | ---------------------- |
| `"off"`               | 否       | 否                     |
| `"ack"`               | 是       | 否                     |
| `"minimal"`（預設）   | 是       | 是，採取保守準則       |
| `"extensive"`         | 是       | 是，採取鼓勵準則       |

個別帳號覆寫：`channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 確認回應

`channels.whatsapp.ackReaction` 會在收到傳入訊息時立即傳送回應，並受 `reactionLevel` 控制（設為 `"off"` 時抑制）：

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

注意事項：傳入訊息獲接受後會立即傳送（回覆前）；若存在 `ackReaction` 但未設定 `emoji`，WhatsApp 會使用路由代理程式的身分表情符號，若無則退回使用「👀」（省略 `ackReaction` 或設定 `emoji: ""` 可停用確認回應）；失敗會記錄於日誌，但不會阻擋回覆傳送；群組模式 `mentions` 僅在由提及觸發的互動中回應，而群組啟用模式 `always` 會略過該檢查；WhatsApp 僅使用 `channels.whatsapp.ackReaction`（舊版 `messages.ackReaction` 不適用於此處）。

## 生命週期狀態回應

設定 `messages.statusReactions.enabled: true`，讓 WhatsApp 在互動期間取代確認回應，而不是保留靜態的收件表情符號；狀態會在排入佇列、思考、工具活動、壓縮、完成與錯誤等階段間切換：

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

注意事項：`channels.whatsapp.ackReaction` 仍控制私訊與群組是否符合資格；排入佇列狀態會使用與一般確認回應相同的有效表情符號；WhatsApp 對每則訊息只提供一個機器人回應位置，因此生命週期更新會原地取代目前的回應；`messages.removeAckAfterReply: true` 會在已設定的完成／錯誤保留時間後清除最終狀態回應；工具表情符號類別包括 `tool`、`coding`、`web`、`deploy`、`build` 與 `concierge`。

## 多帳號與憑證

<AccordionGroup>
  <Accordion title="帳號選擇與預設值">
    帳號 ID 來自 `channels.whatsapp.accounts`。若存在 `default`，則選為預設帳號；否則使用依字母順序排序後的第一個已設定帳號 ID。帳號 ID 會在內部正規化以供查找。
  </Accordion>

  <Accordion title="憑證路徑與舊版相容性">
    - 目前的驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（備份：`creds.json.bak`）
    - `~/.openclaw/credentials/` 中的舊版預設驗證資料仍會在預設帳號流程中被辨識並遷移

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。當閘道可連線時，登出會先停止該帳號的即時監聽器，因此已連結的工作階段會在下次重新啟動前停止接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳號設定前停止即時監聽器。

    在舊版驗證目錄中，移除 Baileys 驗證檔案時會保留 `oauth.json`。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理工具支援包含 WhatsApp 回應動作（`react`）。
- 動作閘門：`channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（既有動作預設為 `true`）、`channels.whatsapp.actions.calls`（預設為 `false`，請參閱上方的 MeowCaller）。
- 預設啟用由頻道發起的設定寫入；可透過 `channels.whatsapp.configWrites: false` 停用。

## 疑難排解

<AccordionGroup>
  <Accordion title="未連結（需要 QR 碼）">
    症狀：頻道狀態回報尚未連結。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="已連結但中斷連線／重連迴圈">
    症狀：已連結的帳號反覆中斷連線或嘗試重新連線。

    安靜的帳號可在超過一般訊息逾時後仍保持連線；只有當 WhatsApp Web 傳輸活動停止、通訊端關閉，或應用程式層級的活動在較長的安全時間窗內持續靜默時，監控程式才會重新啟動（請參閱上方的執行階段模型）。

    如果記錄顯示重複出現 `status=408 Request Time-out Connection was lost`，請調整 `web.whatsapp` 下的 Baileys 通訊端時序。首先將 `keepAliveIntervalMs` 縮短至低於網路的閒置逾時，並在速度緩慢或封包遺失的連線上提高 `connectTimeoutMs`：

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

    修正方式：

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    如果修正主機連線能力與時序後迴圈仍持續，請備份帳號驗證目錄並重新連結：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 與 `openclaw channels status --probe` 都顯示狀況正常，請執行 `openclaw doctor`。在 Linux 上，doctor 會針對叫用已淘汰之 `~/.openclaw/bin/ensure-whatsapp.sh` 指令碼的舊版 crontab 項目發出警告；請使用 `crontab -e` 移除這些項目——排程可能缺少 systemd 使用者匯流排環境，導致該舊指令碼錯誤回報閘道健康狀態。

  </Accordion>

  <Accordion title="透過 Proxy 時 QR 碼登入逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用的 QR 碼前，因 `status=408 Request Time-out` 或 TLS 通訊端中斷連線而失敗。

    WhatsApp Web 登入會使用閘道主機的標準 Proxy 環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體、`NO_PROXY`）。請確認閘道程序會繼承 Proxy 環境，且 `NO_PROXY` 不會比對到 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的監聽器">
    如果目標帳號不存在作用中的閘道監聽器，外送會立即失敗。請確認閘道正在執行，且帳號已連結。
  </Accordion>

  <Accordion title="回覆出現在對話記錄中，但未出現在 WhatsApp">
    對話記錄列會記錄代理產生的內容；WhatsApp 傳遞則會另外檢查。只有當 Baileys 針對至少一則可見文字或媒體傳送傳回外送訊息 ID 時，OpenClaw 才會將自動回覆視為已傳送。

    確認回應是獨立的回覆前收件確認——成功的回應不代表後續的文字／媒體回覆已被接受。請檢查閘道記錄中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外遭到忽略">
    請依此順序檢查：`groupPolicy`、`groupAllowFrom`／`allowFrom`、`groups` 允許清單項目、提及閘門（`requireMention` + 提及模式），以及 `openclaw.json` 中的重複鍵（JSON5 後面的項目會覆寫前面的項目——每個範圍只保留一個 `groupPolicy`）。

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍可能觀察到其他群組的訊息，但 OpenClaw 會在工作階段路由前捨棄這些訊息。請將群組 JID 加入 `channels.whatsapp.groups`，或加入 `groups["*"]` 以允許所有群組，同時仍由 `groupPolicy`／`groupAllowFrom` 控制傳送者授權。

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    WhatsApp 閘道執行階段應使用 Node。Bun 被標示為不適合用於穩定的 WhatsApp／Telegram 閘道作業。
  </Accordion>
</AccordionGroup>

## 系統提示詞

WhatsApp 可透過 `groups` 與 `direct` 對應表，為群組和直接聊天支援 Telegram 風格的系統提示詞。

群組訊息的解析方式：首先決定有效的 `groups` 對應表——只要帳號有定義自己的 `groups` 鍵，就會完全取代根層級的 `groups` 對應表（不進行深層合併）。接著會在該單一結果對應表中查找提示詞：

1. **群組專用提示詞**（`groups["<groupId>"].systemPrompt`）：當群組項目存在，**且**其 `systemPrompt` 鍵已定義時使用。空字串（`""`）會抑制萬用字元，且不套用任何提示詞。
2. **群組萬用提示詞**（`groups["*"].systemPrompt`）：當特定群組項目不存在，或存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析會針對 `direct` 對應表與 `direct["*"]` 採用相同模式。

<Note>
`dms` 仍是每個私訊的輕量級歷史記錄覆寫容器（`dms.<id>.historyLimit`）。提示詞覆寫位於 `direct` 下。
</Note>

<Note>
提示詞解析中這種「帳號取代根層級」的行為是單純的淺層覆寫：任何帳號層級的 `groups`／`direct` 鍵（包括明確的空物件）都會取代根層級對應表。這與上方說明的群組成員資格允許清單檢查不同；後者針對意外設為空白的 `groups: {}` 提供單一帳號安全防護。
</Note>

**與 Telegram 的差異：**在多帳號設定中，Telegram 會對每個帳號抑制根層級的 `groups`（即使帳號本身未定義 `groups`），以防止機器人接收不屬於其所在群組的訊息。WhatsApp 不會套用這項防護——任何沒有自行覆寫的帳號都會繼承根層級的 `groups`／`direct`，不受帳號數量影響。在多帳號 WhatsApp 設定中，如果需要各帳號專屬的提示詞，請明確在每個帳號下定義完整的對應表。

重要行為：

- `channels.whatsapp.groups` 同時是各群組的設定對應表及聊天層級的群組允許清單。在根層級或帳號範圍中，`groups["*"]` 表示該範圍「允許所有群組」。
- 只有當您本來就希望該範圍允許所有群組時，才加入萬用字元 `systemPrompt`。若只要讓固定的一組群組 ID 符合資格，請在每個明確列入允許清單的項目中重複提示詞，而不要使用 `groups["*"]`。
- 群組准入與傳送者授權是不同的檢查。`groups["*"]` 會擴大可進入群組處理流程的群組範圍；它不會授權這些群組中的所有傳送者——這仍由 `groupPolicy`／`groupAllowFrom` 控制。
- `channels.whatsapp.direct` 對私訊沒有相同的副作用：`direct["*"]` 只會在私訊已由 `dmPolicy` 加上 `allowFrom` 或配對儲存區規則准入後，提供預設設定。

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

主要參考資料：[設定參考資料 - WhatsApp](/zh-TW/gateway/config-channels#whatsapp)

| 領域             | 欄位                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 存取控制         | `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`                                             |
| 傳遞             | `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`                |
| 多帳號           | `accounts.<id>.enabled`、`accounts.<id>.authDir`，以及其他各帳號覆寫                                          |
| 作業             | `configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`       |
| 工作階段行為     | `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`                                   |
| 提示詞           | `groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt` |

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [頻道路由](/zh-TW/channels/channel-routing)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
