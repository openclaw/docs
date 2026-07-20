---
read_when:
    - 處理 WhatsApp／網頁頻道行為或收件匣路由時
summary: WhatsApp 頻道支援、存取控制、傳遞行為與操作管理
title: WhatsApp
x-i18n:
    generated_at: "2026-07-20T00:45:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fd28b100e05cf63e0676947144ac188bdba69d852489f65ef312b4f453de1d08
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：已可透過 WhatsApp Web（Baileys）用於正式環境。閘道擁有已連結的工作階段；沒有獨立的 Twilio WhatsApp 頻道。

## 安裝

`openclaw onboard` 和 `openclaw channels add --channel whatsapp` 會在你首次選取此外掛時提示安裝；若外掛不存在，`openclaw channels login --channel whatsapp` 也會提供相同的安裝流程。開發版檢出會使用本機外掛路徑；穩定版／測試版安裝會先從 ClawHub 安裝 `@openclaw/whatsapp`，失敗時再改用 npm。WhatsApp 執行階段並未包含在核心 OpenClaw npm 套件中，因此其執行階段相依套件會保留在外部外掛中。手動安裝：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

僅在套件庫備援時使用不含前綴的 npm 套件（`@openclaw/whatsapp`）；只有需要可重現的安裝時，才鎖定確切版本。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    對未知傳送者的預設私訊政策是配對。
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

  <Step title="連結 WhatsApp（QR Code）">

```bash
openclaw channels login --channel whatsapp
```

    登入僅支援 QR Code。在遠端或無頭主機上，開始登入前，請先準備可靠的方法，將即時 QR Code 傳送到手機；終端機顯示的 QR Code、螢幕擷取畫面或聊天附件可能會在傳送途中過期。

    若要指定特定帳號：

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

  <Step title="核准第一個配對要求（配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對要求會在 1 小時後過期；每個帳號最多可有 3 個待處理要求。

  </Step>
</Steps>

<Note>
建議使用獨立的 WhatsApp 號碼（設定和中繼資料已針對此方式最佳化），但也完整支援個人號碼／傳訊給自己的設定。
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    - OpenClaw 的獨立 WhatsApp 身分
    - 更明確的私訊允許清單與路由界線
    - 降低傳訊給自己時發生混淆的機率

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
    初始設定支援個人號碼模式，並寫入適合傳訊給自己的基準設定：`dmPolicy: "allowlist"`、`allowFrom`（包含你自己的號碼）、`selfChatMode: true`。執行階段的傳訊給自己保護機制會依據已連結的自身號碼與 `allowFrom` 運作。
  </Accordion>
</AccordionGroup>

## 執行階段模型

- 閘道擁有 WhatsApp 通訊端與重新連線迴圈。
- 監看程式會分別追蹤兩個訊號：原始 WhatsApp Web 傳輸活動與應用程式訊息活動。安靜但仍保持連線的工作階段，不會僅因近期沒有訊息抵達而重新啟動；只有在傳輸框架於固定的內部時間範圍內停止抵達（使用者無法設定），或應用程式訊息保持靜默超過正常訊息逾時的 4 倍時，才會強制重新連線。最近仍有活動的工作階段重新連線後，第一個時間範圍會使用較短的正常訊息逾時，而非 4 倍時間範圍。Baileys 在此次重新連線初期送達的離線訊息，OpenClaw 可以自動回覆，其範圍受傳入訊息 ID 去重生命週期限制；初次啟動則仍會套用較短的過時歷史記錄防護。
- 傳出訊息必須要求目標帳號具有作用中的 WhatsApp 監聽器；否則會立即傳送失敗。
- 當權杖符合目前的參與者中繼資料時，群組傳送會為 `@+<digits>` 和 `@<digits>` 權杖（位於文字與媒體說明文字中）附加原生提及中繼資料，包括以 LID 為基礎的群組。
- 狀態與廣播聊天（`@status`、`@broadcast`）會被忽略。
- 直接聊天使用私訊工作階段規則（`session.dmScope`；預設的 `main` 會將私訊合併至代理程式主要工作階段）。群組工作階段會依各個 JID 隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp 頻道／電子報可透過其原生 `@newsletter` JID，明確指定為傳出目標，並使用頻道工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而非私訊語意。
- WhatsApp Web 傳輸會遵循閘道主機上的標準 Proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY`，以及小寫變體）。請優先使用主機層級的 Proxy 設定，而非各頻道設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在送達可見回覆後清除確認反應。

## 使用 MeowCaller 呼叫目前的要求者（實驗性）

此外掛可在源自 WhatsApp 的代理程式回合中公開 `whatsapp_call`。它會使用 [MeowCaller](https://github.com/purpshell/meowcaller) 對目前已授權的要求者發起 WhatsApp 語音通話，並在對方接聽後播放 OpenClaw TTS 訊息。此工具沒有目的地號碼參數，因此提示無法將通話重新導向。預設為停用。

<Warning>
MeowCaller 屬於實驗性功能，沒有已標記的發行版本，且使用另外配對的 whatsmeow 已連結裝置工作階段，無法重複使用此外掛的 Baileys 認證資訊。配對會在同一個 WhatsApp 帳號中新增另一個已連結裝置；請使用 OpenClaw 採用的身分進行掃描。個人號碼／傳訊給自己模式無法撥打給自己；請使用專用的 OpenClaw 號碼撥打你的個人號碼。
</Warning>

<Steps>
  <Step title="啟用實驗性通話">

    將 `actions.calls: true` 加入 WhatsApp 頻道設定，並重新啟動閘道：

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

  <Step title="安裝經審查的 MeowCaller 命令列介面">

    轉接器預期閘道主機的 `PATH` 中存在可執行的 `meowcaller`。在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合併前，請建置經審查的分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    請確保閘道服務的 `PATH` 中包含 `$HOME/.local/bin`。此修訂版具有明確的 `pair` 和僅傳送的 `notify` 命令；`notify` 不會開啟麥克風、喇叭、視訊裝置或診斷擷取功能。請勿改用上游範例命令列介面的 `play` 命令。

  </Step>

  <Step title="配對 MeowCaller 已連結裝置">

    要求 WhatsApp 代理程式檢查通話設定（`whatsapp_call` 狀態動作會回報帳號專屬的狀態目錄與配對命令）。預設帳號的操作如下：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    以互動方式執行此命令，從 **WhatsApp > Linked devices** 掃描 QR Code，並等待 `MeowCaller linked device ready`。請將 `wa-voip.db` 保密，這是 MeowCaller 工作階段。非預設帳號會從狀態動作取得各自的儲存路徑；在 Windows 上，請執行其 PowerShell 命令。

  </Step>

  <Step title="設定 TTS 並從 WhatsApp 撥打電話">

    設定支援電話功能的 [TTS 提供者](/zh-TW/tools/tts)，重新啟動閘道，然後傳送像 `Call me and say the build finished.` 這樣的要求。此工具會從受信任的傳入內容解析傳送者、合成暫時的私人 WAV 檔案、在受限的通話時間範圍內執行 MeowCaller，並在之後刪除音訊檔案。OpenClaw 會明確傳遞該帳號的儲存區，在接聽／播放／掛斷後等待結束狀態為零，並將逾時或非零結束狀態視為工具呼叫失敗。

  </Step>
</Steps>

限制：僅支援一對一傳出音訊通話、不支援任意目的地號碼、不與聊天連線共用驗證、個人號碼／傳訊給自己模式無法撥打給自己、合成音訊上限為 60 秒、除了 MeowCaller 完成接聽／播放／掛斷之外，沒有手機端可聽度回條，且 OpenClaw 會在受限的 115-175 秒時間範圍後停止伴隨處理程序（涵蓋 MeowCaller 的連線、接聽、播放與關閉階段）。

## 核准提示

WhatsApp 可將執行與外掛核准提示呈現為 `👍`/`👎` 反應，由頂層核准轉送設定控制：

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

`approvals.exec` 與 `approvals.plugin` 彼此獨立；啟用 WhatsApp 頻道只會連結傳輸，除非相符的核准類別已啟用並路由至該處，否則不會傳送任何內容。工作階段模式僅會針對源自 WhatsApp 的核准傳遞原生表情符號核准。目標模式會對明確指定的目標使用共用轉送流水線，不會建立獨立的核准者私訊扇出。

WhatsApp 核准反應需要在 `allowFrom`（或 `"*"`）中明確指定核准者。`defaultTo` 設定的是一般預設訊息目標，而非核准者清單。手動 `/approve` 命令仍會先通過一般 WhatsApp 傳送者授權路徑，再解析核准。

## 問題反應

對於具有一個非機密單選問題及一至四個選項的 `ask_user` 提示，WhatsApp 會在選項標籤旁顯示 `1️⃣` 至 `4️⃣`。以相符的數字對已送達的提示做出反應即可回答。OpenClaw 會透過閘道將數字對應至標準選項；過時或重複的點按會被忽略。多問題、多選與自由文字提示仍只能透過文字回覆。一般 WhatsApp 私訊／群組准入規則會授權做出反應的傳送者。

## 外掛掛鉤與隱私權

傳入的 WhatsApp 訊息可能包含個人內容、電話號碼、群組識別碼、傳送者名稱與工作階段關聯欄位。除非你選擇加入，否則 WhatsApp 不會將傳入的 `message_received` 掛鉤承載資料廣播給外掛：

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

請在 `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 下將選擇加入的範圍限制為單一帳號。只有在你信任外掛可存取傳入 WhatsApp 內容與識別碼時，才啟用此功能。

## 存取控制與啟用

<Tabs>
  <Tab title="私訊政策">
    `channels.whatsapp.dmPolicy`：

    | 值 | 行為 |
    | --- | --- |
    | `pairing`（預設） | 未知傳送者要求配對；由擁有者核准 |
    | `allowlist` | 僅准許 `allowFrom` 傳送者 |
    | `open` | 要求 `allowFrom` 包含 `"*"` |
    | `disabled` | 封鎖所有私訊 |

    `allowFrom` 接受 E.164 格式的號碼（內部會正規化）。它僅是私訊傳送者的存取控制清單，不會限制明確傳送至群組 JID 或 `@newsletter` 頻道 JID 的外寄訊息。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `.allowFrom`）的優先順序高於該帳號的頻道層級預設值。

    執行階段注意事項：

    - 配對會保留在頻道允許儲存區中，並與已設定的 `allowFrom` 合併
    - 排程自動化與心跳偵測收件者備援會使用明確的傳遞目標或已設定的 `allowFrom`；私訊配對核准不會隱含成為排程／心跳偵測收件者
    - 若未設定允許清單，預設允許已連結的自身號碼
    - OpenClaw 絕不會自動配對外寄的 `fromMe` 私訊（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策與允許清單">
    群組存取分為兩層：

    1. **群組成員資格允許清單**（`channels.whatsapp.groups`）：若省略 `groups`，所有群組都符合資格；若存在，則作為群組允許清單（`"*"` 允許全部）。
    2. **群組傳送者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）：`open` 會略過傳送者允許清單，`allowlist` 要求符合 `groupAllowFrom`（或 `*`），`disabled` 會封鎖所有群組傳入訊息。

    若未設定 `groupAllowFrom`，且 `allowFrom` 具有項目，傳送者檢查會退回使用它。傳送者允許清單會在提及／回覆啟用之前評估。

    若完全不存在 `channels.whatsapp` 區塊，執行階段會退回至 `groupPolicy: "allowlist"`（並寫入警告記錄），即使 `channels.defaults.groupPolicy` 設為其他值也一樣。

    <Note>
    群組成員資格解析具有單一帳號安全機制：若只設定一個 WhatsApp 帳號，且其 `accounts.<id>.groups` 是明確的空物件（`{}`），系統會將其視為「未設定」，並退回使用根層級的 `channels.whatsapp.groups` 對應表，而不會無聲地封鎖所有群組。設定 2 個以上的帳號時，明確的空帳號對應表會維持空白且不會退回使用根層級設定，讓某個帳號能刻意停用所有群組，而不影響其他同層帳號。
    </Note>

  </Tab>

  <Tab title="提及與 /activation">
    群組回覆預設需要提及。提及偵測包括：

    - 明確提及機器人身分的 WhatsApp 提及
    - 已設定的提及規則運算式模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 已授權群組訊息中的傳入語音留言轉錄文字
    - 隱含的回覆機器人偵測（回覆傳送者符合機器人身分）

    安全性：引用／回覆只會滿足提及門檻，**不會**授予傳送者授權。使用 `groupPolicy: "allowlist"` 時，不在允許清單中的傳送者仍會遭到封鎖，即使是回覆允許清單中使用者的訊息也一樣。

    工作階段層級啟用命令：`/activation mention` 或 `/activation always`。這會更新工作階段狀態（而非全域設定），且僅限擁有者使用。

  </Tab>
</Tabs>

## 已設定的 ACP 繫結

WhatsApp 透過頂層 `bindings[]` 支援持久化 ACP 繫結：

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

直接聊天會比對 E.164 號碼；群組則比對 WhatsApp 群組 JID。在 OpenClaw 確保已繫結的 ACP 工作階段存在之前，會先執行群組允許清單、傳送者政策，以及提及／啟用門檻。符合的繫結會擁有該路由，廣播群組不會將該輪訊息分派至一般 WhatsApp 工作階段。

## 個人號碼與自己的聊天行為

當已連結的自身號碼也存在於 `allowFrom` 時，會啟用自己的聊天安全措施：略過自己的聊天輪次的已讀回條、忽略會提及你自己的 JID 自動觸發行為，並在未設定 `messages.responsePrefix` 時，預設將回覆傳送至 `[{identity.name}]`（或 `[openclaw]`）。

## 訊息正規化與上下文

<AccordionGroup>
  <Accordion title="傳入封套與回覆上下文">
    傳入訊息會包裝在共用傳入封套中。引用回覆會以下列形式附加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時，會填入回覆中繼資料（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。若引用的目標是可下載的媒體，OpenClaw 會透過一般傳入媒體儲存區加以儲存，並公開 `MediaPath`/`MediaType`，讓代理程式能直接檢查，而不只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒體預留位置與位置／聯絡人擷取">
    僅含媒體的訊息會正規化為預留位置：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    當內文只有 `<media:audio>` 時，已授權的群組語音留言會在提及門檻之前轉錄，因此在語音留言中說出機器人提及即可觸發回覆。若轉錄文字仍未提及機器人，它會保留在待處理群組歷史記錄中，而不是原始預留位置。

    位置內文會呈現為簡短的座標文字。位置標籤／註解及聯絡人／vCard 詳細資料會呈現為圍欄式不受信任中繼資料，而非行內提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史記錄注入">
    尚未處理的群組訊息會先緩衝，並在機器人最終被觸發時以內容形式注入。

    - 預設上限：`50`
    - 設定：`channels.whatsapp.historyLimit`，備援為 `messages.groupChat.historyLimit`
    - `0` 會停用此功能

    注入標記：`[Chat messages since your last reply - for context]` 和 `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="已讀回條">
    預設會對已接受的傳入訊息啟用。全域停用：

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    各帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`。即使全域啟用，自己的聊天輪次仍會略過已讀回條。

  </Accordion>
</AccordionGroup>

## 傳遞、分段與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段上限：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`；`newline` 會優先使用段落邊界（空白行），再退回使用長度安全的分段方式

  </Accordion>

  <Accordion title="外寄媒體行為">
    - 支援圖片、影片、音訊（PTT 語音留言）和文件承載資料
    - 音訊會以 Baileys `audio` 承載資料搭配 `ptt: true` 傳送，呈現為按住說話的語音留言；回覆承載資料會保留 `audioAsVoice`，因此無論提供者的來源格式為何，TTS 語音留言輸出都會維持使用此路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送；其他任何格式（包括 Microsoft Edge TTS 的 MP3/WebM 輸出）都會先使用 `ffmpeg` 轉碼成 48 kHz 單聲道 Ogg/Opus，再進行 PTT 傳遞
    - `/tts latest` 會將最新的助理回覆以單則語音留言傳送，並抑制相同回覆的重複傳送；`/tts chat on|off|default` 控制目前聊天的自動 TTS
    - 在影片傳送中使用 `gifPlayback: true` 可啟用動態 GIF 播放
    - `forceDocument`/`asDocument` 會透過 Baileys 文件承載資料路由外寄圖片、GIF 和影片，以避開 WhatsApp 的媒體壓縮，並保留解析後的檔名及 MIME 類型
    - 多媒體回覆的說明文字會套用至第一個媒體項目，但 PTT 語音留言除外：音訊會先不帶說明文字傳送，接著將說明文字以獨立文字訊息傳送（WhatsApp 用戶端無法一致地呈現語音留言說明文字）
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與備援行為">
    - 傳入儲存上限與外寄傳送上限：`channels.whatsapp.mediaMaxMb`（預設為 `50`）
    - 各帳號覆寫：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 除非 `forceDocument`/`asDocument` 要求以文件傳遞，否則圖片會自動最佳化（調整大小／品質掃描）以符合限制
    - 媒體傳送失敗時，第一個項目的備援會傳送文字警告，而不會無聲地捨棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

`channels.whatsapp.replyToMode` 控制原生回覆引用（外寄回覆會明顯引用傳入訊息）：

| 值             | 行為                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"`（預設） | 絕不引用；以純訊息傳送                           |
| `"first"`         | 僅引用第一個外寄回覆分段                      |
| `"all"`           | 引用每個外寄回覆分段                               |
| `"batched"`       | 引用已排入佇列的批次回覆；即時回覆不加引用 |

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

`channels.whatsapp.ackReaction` 會在收到傳入訊息時立即傳送回應，並受 `reactionLevel` 限制（當 `"off"` 時抑制）：

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

注意事項：傳入訊息獲接受後會立即傳送（回覆前）；若存在 `ackReaction` 但沒有 `emoji`，WhatsApp 會使用路由代理程式的身分表情符號，並以「👀」作為備援（若不需要確認，請省略 `ackReaction` 或設定 `emoji: ""`）；失敗會記錄，但不會阻擋回覆傳遞；群組模式 `mentions` 僅會在由提及觸發的輪次中做出回應，而群組啟用 `always` 會略過此檢查；WhatsApp 僅使用 `channels.whatsapp.ackReaction`（舊版 `messages.ackReaction` 不適用於此處）。

## 生命週期狀態回應

設定 `messages.statusReactions.enabled: true`，即可讓 WhatsApp 在一個輪次期間取代確認回應，而非保留靜態的收件表情符號，並依序切換已排入佇列、思考中、工具活動、壓縮、完成和錯誤等狀態：

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

備註：`channels.whatsapp.ackReaction` 仍控制直接訊息與群組的適用資格；佇列狀態使用與一般確認回應相同的有效表情符號；WhatsApp 每則訊息只有一個機器人回應位置，因此生命週期更新會就地取代目前的回應；`messages.removeAckAfterReply: true` 會在設定的完成／錯誤保留時間後清除最終狀態回應；工具表情符號類別包括 `tool`、`coding`、`web`、`deploy`、`build` 及 `concierge`。

## 多帳號與認證資訊

<AccordionGroup>
  <Accordion title="帳號選擇與預設值">
    帳號 ID 來自 `channels.whatsapp.accounts`。若有 `default`，即選為預設帳號；否則使用第一個已設定的帳號 ID（依字母順序排序）。帳號 ID 會在內部正規化以供查詢。
  </Accordion>

  <Accordion title="認證資訊路徑與舊版相容性">
    - 目前的驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（備份：`creds.json.bak`）
    - `~/.openclaw/credentials/` 中的舊版預設驗證仍會在預設帳號流程中被辨識／遷移

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。當可連線至閘道時，登出會先停止該帳號的即時接聽器，使已連結的工作階段在下次重新啟動前停止接收訊息。`openclaw channels remove --channel whatsapp` 也會先停止即時接聽器，再停用或刪除帳號設定。

    在舊版驗證目錄中，移除 Baileys 驗證檔案時會保留 `oauth.json`。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理程式工具支援包括 WhatsApp 回應動作（`react`）。
- 動作閘門：`channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（現有動作預設為 `true`）、`channels.whatsapp.actions.calls`（預設為 `false`，請參閱上方的 MeowCaller）。
- 預設啟用由頻道發起的設定寫入；可透過 `channels.whatsapp.configWrites: false` 停用。

## 疑難排解

<AccordionGroup>
  <Accordion title="尚未連結（需要 QR Code）">
    症狀：頻道狀態回報尚未連結。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="已連結但中斷連線／重新連線迴圈">
    症狀：已連結的帳號反覆中斷連線或嘗試重新連線。

    即使超過一般訊息逾時時間，不活躍的帳號仍可保持連線；只有在 WhatsApp Web 傳輸活動停止、通訊端關閉，或應用程式層級的活動靜默時間超過較長的安全時間範圍時，監看程式才會重新啟動（請參閱上方的執行階段模型）。

    修正方式：

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    如果主機連線與計時問題修正後迴圈仍持續，請備份帳號驗證目錄並重新連結：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 與 `openclaw channels status --probe` 均顯示正常，請執行 `openclaw doctor`。在 Linux 上，doctor 會針對呼叫已淘汰 `~/.openclaw/bin/ensure-whatsapp.sh` 指令碼的舊版 crontab 項目發出警告；請使用 `crontab -e` 移除這些項目——排程可能缺少 systemd 使用者匯流排環境，導致該舊指令碼錯誤回報閘道健康狀態。

  </Accordion>

  <Accordion title="透過 Proxy 登入時 QR Code 逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用的 QR Code 前，因 `status=408 Request Time-out` 或 TLS 通訊端中斷連線而失敗。

    WhatsApp Web 登入會使用閘道主機的標準 Proxy 環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體、`NO_PROXY`）。請確認閘道程序繼承 Proxy 環境，且 `NO_PROXY` 不符合 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的接聽器">
    如果目標帳號沒有作用中的閘道接聽器，對外傳送會立即失敗。請確認閘道正在執行且帳號已連結。
  </Accordion>

  <Accordion title="回覆出現在逐字稿中，但未出現在 WhatsApp">
    逐字稿資料列會記錄代理程式產生的內容；WhatsApp 傳遞則會另外檢查。只有在 Baileys 為至少一次可見的文字或媒體傳送傳回對外訊息 ID 後，OpenClaw 才會將自動回覆視為已傳送。

    確認回應是回覆前的獨立收件確認——回應成功不代表後續的文字／媒體回覆已被接受。請檢查閘道記錄中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外遭到忽略">
    請依下列順序檢查：`groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 允許清單項目、提及閘門（`requireMention` + 提及模式），以及 `openclaw.json` 中的重複索引鍵（JSON5 中較後面的項目會覆寫較前面的項目——每個範圍僅保留一個 `groupPolicy`）。

    如果有 `channels.whatsapp.groups`，WhatsApp 仍可觀察其他群組的訊息，但 OpenClaw 會在工作階段路由前捨棄這些訊息。請將群組 JID 加入 `channels.whatsapp.groups`，或加入 `groups["*"]` 以允許所有群組，同時仍透過 `groupPolicy`/`groupAllowFrom` 控制傳送者授權。

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    OpenClaw 閘道需要 Node。Bun 不提供標準狀態儲存區所使用的 `node:sqlite` API，而 doctor 會將舊版 Bun 服務遷移至 Node。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 透過 `groups` 與 `direct` 對應表，支援適用於群組和直接聊天的 Telegram 風格系統提示。

群組訊息的解析方式：首先決定有效的 `groups` 對應表——只要帳號有定義自己的 `groups` 索引鍵，就會完全取代根層級的 `groups` 對應表（不進行深層合併）。接著，提示查詢會在該單一結果對應表上執行：

1. **群組專屬提示**（`groups["<groupId>"].systemPrompt`）：當群組項目存在，**且**其 `systemPrompt` 索引鍵已有定義時使用。空字串（`""`）會抑制萬用字元，且不套用任何提示。
2. **群組萬用字元提示**（`groups["*"].systemPrompt`）：當特定群組項目不存在，或存在但沒有 `systemPrompt` 索引鍵時使用。

直接訊息的解析方式遵循相同模式，套用於 `direct` 對應表與 `direct["*"]`。

<Note>
`dms` 仍是輕量的每個直接訊息歷程覆寫區（`dms.<id>.historyLimit`）。提示覆寫位於 `direct` 下。
</Note>

<Note>
提示解析的這項「帳號取代根層級」行為是單純的淺層覆寫：帳號中的任何 `groups`/`direct` 索引鍵（包括明確的空物件）都會取代根層級對應表。這與上述群組成員資格允許清單檢查不同；後者針對意外為空的 `groups: {}`，具有單一帳號安全機制。
</Note>

**與 Telegram 的差異：**在多帳號設定中，Telegram 會對每個帳號抑制根層級的 `groups`（即使帳號本身沒有 `groups`），以防止機器人接收到自己不屬於之群組的訊息。WhatsApp 不會套用這項防護——任何沒有自身覆寫的帳號都會繼承根層級的 `groups`/`direct`，無論帳號數量為何。在多帳號 WhatsApp 設定中，如果要使用各帳號專屬的提示，請在每個帳號下明確定義完整對應表。

重要行為：

- `channels.whatsapp.groups` 同時是各群組設定對應表與聊天層級的群組允許清單。在根層級或帳號範圍中，`groups["*"]` 都表示該範圍「允許所有群組」。
- 只有在原本就要讓該範圍允許所有群組時，才加入萬用字元 `systemPrompt`。若只要固定的一組群組 ID 符合資格，請在每個明確列入允許清單的項目中重複提示，而不要使用 `groups["*"]`。
- 群組准入與傳送者授權是兩項不同的檢查。`groups["*"]` 會擴大可進入群組處理程序的群組範圍；它不會授權這些群組中的每位傳送者——這仍由 `groupPolicy`/`groupAllowFrom` 控制。
- `channels.whatsapp.direct` 對直接訊息沒有同等的副作用：`direct["*"]` 只會在直接訊息已透過 `dmPolicy` 加上 `allowFrom` 或配對儲存區規則獲准後，提供預設設定。

範例：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // 僅在根層級應允許所有群組時使用。
        // 套用至所有未定義自身 groups 對應表的帳號。
        "*": { systemPrompt: "所有群組的預設提示。" },
      },
      direct: {
        // 套用至所有未定義自身 direct 對應表的帳號。
        "*": { systemPrompt: "所有直接聊天的預設提示。" },
      },
      accounts: {
        work: {
          groups: {
            // 此帳號定義了自己的 groups，因此根層級 groups 會被完全
            // 取代。若要保留萬用字元，也必須在此明確定義 "*"。
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "著重於專案管理。",
            },
            // 僅在此帳號應允許所有群組時使用。
            "*": { systemPrompt: "工作群組的預設提示。" },
          },
          direct: {
            // 此帳號定義了自己的 direct 對應表，因此根層級 direct 項目會被
            // 完全取代。若要保留萬用字元，也必須在此明確定義 "*"。
            "+15551234567": { systemPrompt: "特定工作直接聊天的提示。" },
            "*": { systemPrompt: "工作直接聊天的預設提示。" },
          },
        },
      },
    },
  },
}
```

## 設定參考指引

主要參考資料：[設定參考資料 - WhatsApp](/zh-TW/gateway/config-channels#whatsapp)

| 領域             | 欄位                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| 存取             | `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`                                             |
| 傳遞             | `textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`      |
| 多帳號           | `accounts.<id>.enabled`、`accounts.<id>.authDir` 及其他各帳號覆寫                              |
| 操作             | `configWrites`、`debounceMs`、`web.enabled`                                                                    |
| 工作階段行為     | `session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`                                   |
| 提示             | `groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt` |

## 相關內容

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [頻道路由](/zh-TW/channels/channel-routing)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
