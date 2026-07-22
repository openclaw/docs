---
read_when:
    - 處理 WhatsApp／網頁頻道行為或收件匣路由作業
summary: WhatsApp 頻道支援、存取控制、傳遞行為與操作維運
title: WhatsApp
x-i18n:
    generated_at: "2026-07-22T13:19:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3894650b530e191c13d4e8b0b2bfd95dde984649719b890aad5c1aa78ac3a3a1
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：已可透過 WhatsApp Web (Baileys) 用於正式環境。閘道擁有已連結的工作階段；沒有獨立的 Twilio WhatsApp 頻道。

## 安裝

`openclaw onboard` 和 `openclaw channels add --channel whatsapp` 會在你第一次選取此外掛時提示安裝；如果缺少此外掛，`openclaw channels login --channel whatsapp` 也會提供相同的安裝流程。開發版簽出使用本機外掛路徑；穩定版／測試版安裝會先從 ClawHub 安裝 `@openclaw/whatsapp`，若失敗則改用 npm。WhatsApp 執行階段在核心 OpenClaw npm 套件之外提供，因此其執行階段相依套件會保留在外部外掛中。手動安裝：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

僅將不含前綴的 npm 套件 (`@openclaw/whatsapp`) 用於登錄檔備援；只有在需要可重現的安裝時，才固定確切版本。

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

  <Step title="連結 WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    登入僅支援 QR。在遠端或無頭主機上，開始登入前，請先確保有可靠的方法能將即時 QR 傳送到手機；終端機轉譯的 QR、螢幕截圖或聊天附件可能會在傳送途中過期。

    若要指定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加現有／自訂的驗證目錄：

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

  <Step title="核准第一個私訊存取要求（配對模式）">

    開啟 **Settings → Channels → DM access requests**，找到 WhatsApp 帳號，
    並核准傳送者。若你偏好使用命令列介面：

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    私訊存取要求會在 1 小時後過期；每個帳號最多可有 3 個待處理
    要求。此核准與用來連結帳號本身的 WhatsApp 登入 QR
    不同。

  </Step>
</Steps>

<Note>
建議使用獨立的 WhatsApp 號碼（設定與中繼資料已針對此方式最佳化），但也完整支援個人號碼／與自己聊天的設定。
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    - 為 OpenClaw 使用獨立的 WhatsApp 身分
    - 更清楚的私訊允許清單與路由界線
    - 降低與自己聊天造成混淆的機率

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
    新手引導支援個人號碼模式，並寫入適合與自己聊天的基準設定：`dmPolicy: "allowlist"`、包含你自己號碼的 `allowFrom`、`selfChatMode: true`。執行階段的與自己聊天保護機制會依據已連結的自身號碼及 `allowFrom` 運作。
  </Accordion>
</AccordionGroup>

## 執行階段模型

- 閘道擁有 WhatsApp 通訊端與重新連線迴圈。
- 監看程式會分別追蹤兩個訊號：原始 WhatsApp Web 傳輸活動，以及應用程式訊息活動。安靜但仍保持連線的工作階段不會只因近期沒有訊息抵達就重新啟動；只有在固定的內部時間範圍內（使用者不可設定）停止收到傳輸框架，或應用程式訊息保持無動靜的時間超過一般訊息逾時的 4 倍時，才會強制重新連線。對近期曾有活動的工作階段，重新連線後的第一個時間範圍會使用較短的一般訊息逾時，而非 4 倍時間範圍。OpenClaw 可自動回覆 Baileys 在該次重新連線初期傳送的離線訊息，範圍受輸入訊息 ID 去重存續時間限制；首次啟動仍會保留較短的過時歷史記錄防護。
- 輸出傳送要求目標帳號必須有作用中的 WhatsApp 監聽器；否則會立即失敗。
- 當權杖符合目前的參與者中繼資料時，群組傳送會為 `@+<digits>` 和 `@<digits>` 權杖（位於文字及媒體說明文字中）附加原生提及中繼資料，包括以 LID 為基礎的群組。
- 系統會忽略狀態和廣播聊天 (`@status`、`@broadcast`)。
- 直接聊天使用私訊工作階段規則（`session.dmScope`；預設的 `main` 會將私訊合併至代理程式主要工作階段）。群組工作階段會依各 JID 隔離 (`agent:<agentId>:whatsapp:group:<jid>`)。
- WhatsApp Channels/Newsletters 可透過其原生 `@newsletter` JID 成為明確的輸出目標，並使用頻道工作階段中繼資料 (`agent:<agentId>:whatsapp:channel:<jid>`)，而非私訊語意。
- WhatsApp Web 傳輸會遵循閘道主機上的標準 Proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` 及其小寫變體）。請優先使用主機層級的 Proxy 設定，而非各頻道設定。

## 使用 MeowCaller 致電目前的要求者（實驗性）

此外掛可在源自 WhatsApp 的代理程式回合中公開 `whatsapp_call`。它使用 [MeowCaller](https://github.com/purpshell/meowcaller) 向目前已授權的要求者撥打 WhatsApp 語音通話，並在對方接聽後播放 OpenClaw TTS 訊息。此工具沒有目的地號碼參數，因此提示無法重新導向通話。預設停用。

<Warning>
MeowCaller 為實驗性功能，沒有已加標籤的版本，且使用另外配對的 whatsmeow 已連結裝置工作階段，因此無法重複使用此外掛的 Baileys 認證資訊。配對會在同一個 WhatsApp 帳號中新增另一部已連結裝置；請使用 OpenClaw 所用的身分掃描。個人號碼／與自己聊天模式無法致電自身；請使用專用的 OpenClaw 號碼致電你的個人號碼。
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

    若未設定或為 `false`，OpenClaw 不會公開 `whatsapp_call` 工具。

  </Step>

  <Step title="安裝已審查的 MeowCaller 命令列介面">

    轉接器預期閘道主機的 `PATH` 上有 `meowcaller` 可執行檔。在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合併前，請建置已審查的分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    請確保 `$HOME/.local/bin` 位於閘道服務的 `PATH` 上。此修訂版提供明確的 `pair` 及僅限傳送的 `notify` 命令；`notify` 不會開啟麥克風、喇叭、視訊裝置或診斷擷取。請勿改用上游範例命令列介面的 `play` 命令。

  </Step>

  <Step title="配對 MeowCaller 已連結裝置">

    要求 WhatsApp 代理程式檢查通話設定（`whatsapp_call` 狀態動作會回報帳號專屬狀態目錄與配對命令）。若為預設帳號：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    以互動方式執行此操作，從 **WhatsApp > Linked devices** 掃描 QR，並等待 `MeowCaller linked device ready`。請將 `wa-voip.db` 保密，這是 MeowCaller 工作階段。非預設帳號會從狀態動作取得各自的儲存路徑；在 Windows 上，請執行其 PowerShell 命令。

  </Step>

  <Step title="設定 TTS 並從 WhatsApp 撥打電話">

    設定支援電話語音的 [TTS 提供者](/zh-TW/tools/tts)，重新啟動閘道，然後傳送類似 `Call me and say the build finished.` 的要求。此工具會從受信任的輸入內容中解析傳送者、合成暫存的私人 WAV 檔案、在有時間限制的通話時間範圍內執行 MeowCaller，並在之後刪除音訊檔案。OpenClaw 會明確傳入該帳號的儲存區、等待接聽／播放／掛斷後傳回零結束狀態，並將逾時或非零結束狀態視為工具呼叫失敗。

  </Step>
</Steps>

限制：僅限一對一輸出音訊通話、不可使用任意目的地號碼、不與聊天連線共用驗證資訊、個人號碼／與自己聊天模式不可撥打給自己、合成音訊上限為 60 秒、除了 MeowCaller 完成接聽／播放／掛斷之外，沒有手機端可聽性回條，且 OpenClaw 會在有上限的 115-175 秒時間範圍後停止伴隨程序（涵蓋 MeowCaller 的連線、接聽、播放及關閉階段）。

## 核准提示

WhatsApp 可將執行與外掛核准提示轉譯為 `👍`/`👎` 回應，並由頂層核准轉送設定控制：

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

`approvals.exec` 與 `approvals.plugin` 彼此獨立；啟用 WhatsApp 作為頻道只會連結傳輸，不會傳送任何內容，除非已啟用相符的核准類別並將其路由至該處。工作階段模式只會針對源自 WhatsApp 的核准提供原生表情符號核准。目標模式會對明確目標使用共用轉送流水線，不會另外建立核准者私訊扇出。

WhatsApp 核准回應要求在 `allowFrom`（或 `"*"`）中明確指定核准者。`defaultTo` 設定的是一般預設訊息目標，而非核准者清單。手動 `/approve` 命令在解析核准前，仍會經過一般 WhatsApp 傳送者授權路徑。

## 問題回應

若 `ask_user` 提示包含一個非機密的單選問題和一至四個選項，WhatsApp 會在選項標籤旁顯示 `1️⃣` 至 `4️⃣`。請以相符數字回應已傳送的提示來作答。OpenClaw 會透過閘道將數字對應到標準選項；過時或重複的點按會被忽略。多問題、多選及自由文字提示仍僅能以文字回覆。一般 WhatsApp 私訊／群組准入規則會授權做出回應的傳送者。

## 外掛掛鉤與隱私權

輸入 WhatsApp 訊息可能包含個人內容、電話號碼、群組識別碼、傳送者名稱及工作階段關聯欄位。除非你選擇加入，否則 WhatsApp 不會將輸入 `message_received` 掛鉤承載內容廣播給外掛：

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

請在 `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 下將選擇加入的範圍限制為一個帳號。只有在你信任外掛可存取輸入 WhatsApp 內容與識別碼時，才啟用此功能。

## 存取控制與啟用

<Tabs>
  <Tab title="私訊政策">
    `channels.whatsapp.dmPolicy`：

    | 值 | 行為 |
    | --- | --- |
    | `pairing`（預設） | 未知傳送者要求配對；擁有者核准 |
    | `allowlist` | 僅允許 `allowFrom` 傳送者 |
    | `open` | 要求 `allowFrom` 包含 `"*"` |
    | `disabled` | 封鎖所有私訊 |

    `allowFrom` 接受 E.164 格式的號碼（內部會正規化）。它僅是私訊傳送者的存取控制清單，不會限制明確傳送至群組 JID 或 `@newsletter` 頻道 JID 的外寄訊息。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `.allowFrom`）的優先順序高於該帳號的頻道層級預設值。

    執行階段注意事項：

    - 配對會保存在頻道允許儲存區中，並與已設定的 `allowFrom` 合併
    - 排程自動化與心跳偵測收件者備援會使用明確的遞送目標或已設定的 `allowFrom`；私訊配對核准不會隱含成為排程／心跳偵測收件者
    - 若未設定允許清單，預設允許已連結的自身號碼
    - OpenClaw 絕不會自動配對外寄的 `fromMe` 私訊（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策與允許清單">
    群組存取分為兩層：

    1. **群組成員資格允許清單**（`channels.whatsapp.groups`）：若省略 `groups`，所有群組都符合資格；若有設定，它會作為群組允許清單（`"*"` 允許所有群組）。
    2. **群組傳送者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）：`open` 會略過傳送者允許清單，`allowlist` 要求符合 `groupAllowFrom`（或 `*`），`disabled` 會封鎖所有群組傳入訊息。

    若未設定 `groupAllowFrom`，當 `allowFrom` 含有項目時，傳送者檢查會改用它。傳送者允許清單的評估會在提及／回覆啟用之前進行。

    如果完全不存在 `channels.whatsapp` 區塊，執行階段會改用 `groupPolicy: "allowlist"`（並寫入警告日誌），即使 `channels.defaults.groupPolicy` 已設為其他值亦然。

    <Note>
    群組成員資格解析具有單一帳號安全機制：如果只設定了一個 WhatsApp 帳號，且其 `accounts.<id>.groups` 是明確的空物件（`{}`），系統會將其視為「未設定」，並改用根層級的 `channels.whatsapp.groups` 對應表，而不是無聲地封鎖所有群組。若設定了 2 個以上的帳號，明確的空帳號對應表會維持為空且不會改用根層級設定，讓某個帳號能刻意停用所有群組，而不影響同層的其他帳號。
    </Note>

  </Tab>

  <Tab title="提及與 /activation">
    群組回覆預設需要提及。提及偵測包括：

    - 明確提及機器人身分的 WhatsApp 提及
    - 已設定的提及正規表示式模式（`agents.entries.*.groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 已授權群組訊息的傳入語音留言逐字稿
    - 隱含的回覆機器人偵測（回覆對象的傳送者符合機器人身分）

    安全性：引用／回覆只會滿足提及限制，**不會**授予傳送者授權。使用 `groupPolicy: "allowlist"` 時，不在允許清單中的傳送者即使回覆允許清單中使用者的訊息，仍會遭到封鎖。

    工作階段層級的啟用命令：`/activation mention` 或 `/activation always`。這會更新工作階段狀態（而非全域設定），且僅限擁有者使用。

  </Tab>
</Tabs>

## 已設定的 ACP 繫結

WhatsApp 支援透過頂層 `bindings[]` 建立持久性 ACP 繫結：

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

直接聊天會比對 E.164 號碼；群組會比對 WhatsApp 群組 JID。在 OpenClaw 確保繫結的 ACP 工作階段存在之前，會先執行群組允許清單、傳送者政策及提及／啟用限制。符合的繫結會擁有該路由，廣播群組不會將該輪次分派至一般 WhatsApp 工作階段。

## 個人號碼與自我聊天行為

當已連結的自身號碼也存在於 `allowFrom` 時，會啟用自我聊天防護措施：略過自我聊天輪次的已讀回條、忽略會提及你自己的提及 JID 自動觸發行為，並在頻道／帳號未設定 `responsePrefix` 時，預設將回覆傳送至 `[{identity.name}]`（或 `[openclaw]`）。

## 訊息正規化與上下文

<AccordionGroup>
  <Accordion title="傳入封套與回覆上下文">
    傳入訊息會包裝在共用的傳入封套中。引用回覆會附加以下格式的上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時會填入回覆中繼資料（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。如果引用的目標是可下載的媒體，OpenClaw 會透過一般傳入媒體儲存區加以儲存，並公開 `MediaPath`/`MediaType`，讓代理程式可以直接檢查，而非只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒體預留位置與位置／聯絡人擷取">
    僅包含媒體的訊息會正規化為預留位置：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    當內文僅為 `<media:audio>` 時，已授權的群組語音留言會在提及限制之前轉錄，因此在語音留言中說出機器人的提及名稱即可觸發回覆。如果逐字稿仍未提及機器人，它會保留在待處理的群組歷史記錄中，而非保留原始預留位置。

    位置內文會呈現為精簡的座標文字。位置標籤／註解及聯絡人／vCard 詳細資料會呈現為以程式碼圍欄包覆的不受信任中繼資料，而非行內提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史記錄注入">
    未處理的群組訊息會暫存，並在機器人最終被觸發時注入為上下文。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`，備援為 `messages.groupChat.historyLimit`
    - `0` 會停用此功能

    注入標記：`[Chat messages since your last reply - for context]` 和 `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="已讀回條">
    已接受的傳入訊息預設會啟用。若要全域停用：

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    各帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`。即使全域啟用，自我聊天輪次仍會略過已讀回條。

  </Accordion>
</AccordionGroup>

## 遞送、分段與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`；`newline` 會優先採用段落邊界（空白行），再改用符合長度限制的分段方式

  </Accordion>

  <Accordion title="外寄媒體行為">
    - 支援圖片、影片、音訊（PTT 語音留言）及文件承載內容
    - 音訊會以 Baileys `audio` 承載內容搭配 `ptt: true` 傳送，並呈現為按住說話語音留言；回覆承載內容會保留 `audioAsVoice`，使 TTS 語音留言輸出無論供應商來源格式為何，都會維持使用此路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送；其他任何格式（包括 Microsoft Edge TTS 的 MP3/WebM 輸出）都會在 PTT 遞送前，使用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus
    - `/tts latest` 會將最新的助理回覆傳送為一則語音留言，並禁止重複傳送相同回覆；`/tts chat on|off|default` 控制目前聊天的自動 TTS
    - 在影片傳送上使用 `gifPlayback: true` 可啟用動態 GIF 播放
    - `forceDocument`/`asDocument` 會透過 Baileys 文件承載內容傳送外寄圖片、GIF 與影片，以避免 WhatsApp 的媒體壓縮，並保留解析後的檔案名稱與 MIME 類型
    - 多媒體回覆的說明文字會套用至第一個媒體項目，但 PTT 語音留言除外：音訊會先傳送且不附說明文字，接著再將說明文字作為獨立文字訊息傳送（WhatsApp 用戶端無法一致地呈現語音留言說明文字）
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與備援行為">
    - 傳入儲存上限與外寄傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 各帳號覆寫：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小／品質掃描）以符合限制，除非 `forceDocument`/`asDocument` 要求以文件方式遞送
    - 媒體傳送失敗時，第一個項目的備援機制會傳送文字警告，而非無聲地捨棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

`channels.whatsapp.replyToMode` 控制原生回覆引用（外寄回覆會明顯引用傳入訊息）：

| 值             | 行為                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"`（預設） | 絕不引用；以純訊息傳送                           |
| `"first"`         | 僅引用第一個外寄回覆分段                      |
| `"all"`           | 引用每個外寄回覆分段                               |
| `"batched"`       | 引用已排入佇列的批次回覆；即時回覆不引用 |

各帳號覆寫：`channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## 回應層級

`channels.whatsapp.reactionLevel` 控制代理程式使用表情符號回應的廣泛程度：

| 層級                 | 確認回應 | 代理程式主動發起的回應  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | 否            | 否                         |
| `"ack"`               | 是           | 否                         |
| `"minimal"`（預設） | 是           | 是，採保守指引 |
| `"extensive"`         | 是           | 是，採鼓勵指引   |

各帳號覆寫：`channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 確認回應

`channels.whatsapp.ackReaction` 會在收到傳入訊息時立即傳送回應，並受 `reactionLevel` 限制（當 `"off"` 時會停用）：

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

注意事項：在傳入訊息被接受後立即傳送（回覆前）；如果有 `ackReaction` 但沒有 `emoji`，WhatsApp 會使用路由所指代理程式的身分表情符號，並以 "👀" 作為備援（若不需要確認回應，請省略 `ackReaction` 或設定 `emoji: ""`）；失敗會記錄在日誌中，但不會阻止回覆遞送；群組模式 `mentions` 僅會在由提及觸發的輪次中回應，而群組啟用 `always` 會略過該檢查；WhatsApp 僅使用 `channels.whatsapp.ackReaction`（舊版 `messages.ackReaction` 不適用於此處）。

## 生命週期狀態回應

設定 `messages.statusReactions.enabled: true`，讓 WhatsApp 在輪次期間取代確認回應，而非保留靜態的收件表情符號，依序切換已排入佇列、思考中、工具活動、壓縮、完成及錯誤等狀態：

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
    },
  },
}
```

注意事項：`channels.whatsapp.ackReaction` 仍會控制直接訊息與群組的適用資格；已排入佇列狀態會使用與一般確認回應相同的有效表情符號；WhatsApp 對每則訊息只有一個機器人回應位置，因此生命週期更新會就地取代目前的回應，並在最終完成／錯誤狀態後還原確認回應。

## 多帳號與認證資訊

<AccordionGroup>
  <Accordion title="帳號選擇與預設值">
    帳號 ID 來自 `channels.whatsapp.accounts`。若存在 `default`，則選為預設帳號；否則選擇第一個已設定的帳號 ID（依字母排序）。系統會在內部將帳號 ID 正規化以供查詢。
  </Accordion>

  <Accordion title="認證資訊路徑與舊版相容性">
    - 目前的驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（備份：`creds.json.bak`）
    - `~/.openclaw/credentials/` 中舊版的預設驗證仍會在預設帳號流程中被辨識並遷移

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。當閘道可連線時，登出會先停止該帳號的即時接聽器，因此連結的工作階段會在下次重新啟動前停止接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳號設定前停止即時接聽器。

    在舊版驗證目錄中，系統會保留 `oauth.json`，同時移除 Baileys 驗證檔案。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理程式工具支援包含 WhatsApp 回應動作（`react`）。
- 動作閘門：`channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（現有動作預設為 `true`）、`channels.whatsapp.actions.calls`（預設為 `false`，請參閱上方的 MeowCaller）。
- 預設允許由頻道發起設定寫入；可透過 `channels.whatsapp.configWrites: false` 停用。

## 疑難排解

<AccordionGroup>
  <Accordion title="尚未連結（需要 QR 碼）">
    症狀：頻道狀態回報尚未連結。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="已連結但中斷連線／陷入重新連線迴圈">
    症狀：已連結的帳號反覆中斷連線或嘗試重新連線。

    不活躍的帳號即使超過一般訊息逾時時間，仍可保持連線；只有在 WhatsApp Web 傳輸活動停止、通訊端關閉，或應用程式層級的活動靜默超過較長的安全時限時，監控程式才會重新啟動（請參閱上方的執行階段模型）。

    修正方式：

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    若修正主機連線能力與時間設定後仍持續發生迴圈，請備份帳號驗證目錄並重新連結：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    若 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 與 `openclaw channels status --probe` 均顯示正常，請執行 `openclaw doctor`。在 Linux 上，doctor 會針對呼叫已淘汰 `~/.openclaw/bin/ensure-whatsapp.sh` 指令碼的舊版 crontab 項目發出警告；請使用 `crontab -e` 移除這些項目——排程可能缺少 systemd 使用者匯流排環境，導致該舊指令碼錯誤回報閘道健康狀態。

  </Accordion>

  <Accordion title="透過 Proxy 時 QR 碼登入逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用的 QR 碼前，因 `status=408 Request Time-out` 或 TLS 通訊端中斷連線而失敗。

    WhatsApp Web 登入會使用閘道主機的標準 Proxy 環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體及 `NO_PROXY`）。請確認閘道程序繼承了 Proxy 環境，且 `NO_PROXY` 不符合 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的接聽器">
    若目標帳號沒有作用中的閘道接聽器，傳出訊息會快速失敗。請確認閘道正在執行，且帳號已連結。
  </Accordion>

  <Accordion title="回覆出現在逐字記錄中，但未出現在 WhatsApp">
    逐字記錄資料列會記錄代理程式產生的內容；WhatsApp 的傳遞狀態則會另行檢查。只有當 Baileys 針對至少一則可見文字或媒體傳送傳回傳出訊息 ID 後，OpenClaw 才會將自動回覆視為已傳送。

    確認回應是獨立的回覆前收件確認——成功的回應不代表後續的文字／媒體回覆已被接受。請檢查閘道日誌中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外遭忽略">
    請依序檢查：`groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 允許清單項目、提及閘門（`requireMention` + 提及模式），以及 `openclaw.json` 中的重複鍵（JSON5 後面的項目會覆寫前面的項目——每個範圍僅保留一個 `groupPolicy`）。

    若存在 `channels.whatsapp.groups`，WhatsApp 仍可觀察來自其他群組的訊息，但 OpenClaw 會在工作階段路由前捨棄這些訊息。請將群組 JID 加入 `channels.whatsapp.groups`，或加入 `groups["*"]` 以允許所有群組，同時繼續透過 `groupPolicy`/`groupAllowFrom` 控制傳送者授權。

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    OpenClaw 閘道需要 Node。Bun 未提供標準狀態儲存區使用的 `node:sqlite` API，而 doctor 會將舊版 Bun 服務遷移至 Node。
  </Accordion>
</AccordionGroup>

## 系統提示詞

WhatsApp 透過 `groups` 與 `direct` 對應表，支援用於群組與直接聊天的 Telegram 式系統提示詞。

群組訊息的解析方式：首先決定有效的 `groups` 對應表——只要帳號定義了自己的 `groups` 鍵，就會完全取代根層級的 `groups` 對應表（不進行深層合併）。接著，提示詞查詢會在這個唯一的結果對應表中進行：

1. **群組專屬提示詞**（`groups["<groupId>"].systemPrompt`）：當群組項目存在，**且**其 `systemPrompt` 鍵已定義時使用。空字串（`""`）會抑制萬用字元，且不套用任何提示詞。
2. **群組萬用字元提示詞**（`groups["*"].systemPrompt`）：當特定群組項目不存在，或項目存在但沒有 `systemPrompt` 鍵時使用。

直接訊息會針對 `direct` 對應表與 `direct["*"]`，依循相同的模式進行解析。

<Note>
`dms` 仍是輕量的各 DM 歷程覆寫容器（`dms.<id>.historyLimit`）。提示詞覆寫位於 `direct` 下。
</Note>

<Note>
提示詞解析中的此帳號取代根層級行為，是單純的淺層覆寫：任何帳號的 `groups`/`direct` 鍵（包括明確的空物件）都會取代根層級對應表。這與上方所述的群組成員資格允許清單檢查不同；後者會針對意外為空的 `groups: {}` 提供單一帳號安全防護。
</Note>

**與 Telegram 的差異：**在多帳號設定中，Telegram 會對每個帳號抑制根層級的 `groups`（即使帳號沒有自己的 `groups`），避免機器人接收到不屬於其所在群組的群組訊息。WhatsApp 不會套用此防護——任何沒有自身覆寫的帳號都會繼承根層級的 `groups`/`direct`，無論帳號數量為何。在多帳號 WhatsApp 設定中，若要使用各帳號專屬的提示詞，請在每個帳號下明確定義完整的對應表。

重要行為：

- `channels.whatsapp.groups` 同時是各群組的設定對應表與聊天層級的群組允許清單。在根層級或帳號範圍中，`groups["*"]` 都表示該範圍“允許所有群組”。
- 只有當你已希望該範圍允許所有群組時，才加入萬用字元 `systemPrompt`。若要僅允許固定的一組群組 ID，請在每個明確列入允許清單的項目中重複提示詞，而不要使用 `groups["*"]`。
- 群組准入與傳送者授權是分開的檢查。`groups["*"]` 會擴大可進入群組處理流程的群組範圍；它不會授權這些群組中的所有傳送者——這仍由 `groupPolicy`/`groupAllowFrom` 控制。
- `channels.whatsapp.direct` 對 DM 沒有相同的副作用：`direct["*"]` 只會在 DM 已透過 `dmPolicy` 加上 `allowFrom` 或配對儲存區規則獲准後，提供預設設定。

範例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 僅在根層級範圍應允許所有群組時使用。
        // 套用至所有未定義自身 groups 對應表的帳號。
        "*": { systemPrompt: "所有群組的預設提示詞。" },
      },
      direct: {
        // 套用至所有未定義自身 direct 對應表的帳號。
        "*": { systemPrompt: "所有直接聊天的預設提示詞。" },
      },
      accounts: {
        work: {
          groups: {
            // 此帳號定義了自己的 groups，因此根層級 groups 會被完全
            // 取代。若要保留萬用字元，也請在此明確定義 "*"。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "專注於專案管理。",
            },
            // 僅在此帳號應允許所有群組時使用。
            "*": { systemPrompt: "工作群組的預設提示詞。" },
          },
          direct: {
            // 此帳號定義了自己的 direct 對應表，因此根層級 direct 項目會被
            // 完全取代。若要保留萬用字元，也請在此明確定義 "*"。
            "+15551234567": { systemPrompt: "特定工作直接聊天的提示詞。" },
            "*": { systemPrompt: "工作直接聊天的預設提示詞。" },
          },
        },
      },
    },
  },
}
```

## 設定參考指引

主要參考資料：[設定參考資料 - WhatsApp](/zh-TW/gateway/config-channels#whatsapp)

| 區域             | 欄位                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 存取權           | `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`                                             |
| 傳遞             | `textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`      |
| 多帳號           | `accounts.<id>.enabled`、`accounts.<id>.authDir`，以及其他各帳號覆寫                              |
| 操作             | `configWrites`、`debounceMs`、`enabled`                                                                        |
| 工作階段行為     | `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`                                   |
| 提示詞           | `groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt` |

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [頻道路由](/zh-TW/channels/channel-routing)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
