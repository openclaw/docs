---
read_when:
    - 處理 WhatsApp/網頁頻道行為或收件匣路由
summary: WhatsApp 頻道支援、存取控制、傳遞行為與操作
title: WhatsApp
x-i18n:
    generated_at: "2026-07-05T17:39:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：可透過 WhatsApp Web (Baileys) 用於生產環境。閘道擁有已連結的工作階段；沒有獨立的 Twilio WhatsApp 頻道。

## 安裝

`openclaw onboard` 和 `openclaw channels add --channel whatsapp` 會在你第一次選取此外掛時提示安裝；如果外掛缺失，`openclaw channels login --channel whatsapp` 也會提供相同的安裝流程。開發 checkout 使用本機外掛路徑；stable/beta 會先從 ClawHub 安裝 `@openclaw/whatsapp`，再 fallback 到 npm。WhatsApp runtime 會在核心 OpenClaw npm 套件之外發佈，因此其 runtime 依賴項會保留在外部外掛中。手動安裝：

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

只有在 registry fallback 時才使用裸 npm 套件 (`@openclaw/whatsapp`)；只有在需要可重現安裝時才釘選精確版本。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    預設 DM policy 是讓未知寄件者進行配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復 playbook。
  </Card>
  <Card title="閘道設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整頻道 config 模式與範例。
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

    登入僅支援 QR。在遠端或 headless 主機上，開始登入前，請準備可靠方式將即時 QR 傳送到手機；終端機顯示的 QR、螢幕截圖或聊天附件都可能在傳輸途中過期。

    針對特定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加既有/自訂 auth 目錄：

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

  <Step title="核准第一個配對請求（配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對請求會在 1 小時後過期；待處理請求每個帳號最多 3 個。

  </Step>
</Steps>

<Note>
建議使用獨立的 WhatsApp 號碼（設定與 metadata 已針對此情境最佳化），但也完整支援個人號碼/自我聊天設定。
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    - 為 OpenClaw 使用獨立 WhatsApp 身分
    - 更清楚的 DM allowlist 與路由邊界
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

  <Accordion title="個人號碼 fallback">
    Onboarding 支援個人號碼模式，並寫入適合自我聊天的 baseline：`dmPolicy: "allowlist"`、包含你自己號碼的 `allowFrom`、`selfChatMode: true`。Runtime 自我聊天保護會根據已連結的自身號碼加上 `allowFrom` 判斷。
  </Accordion>
</AccordionGroup>

## Runtime 模型

- 閘道擁有 WhatsApp socket 與重新連線 loop。
- Watchdog 會分別追蹤兩個信號：原始 WhatsApp Web transport 活動，以及 application-message 活動。安靜但已連線的工作階段，不會只因為最近沒有收到訊息就重新啟動；只有在 transport frames 在固定內部時間窗（不可由使用者設定）停止抵達，或 application messages 靜默超過正常訊息 timeout 的 4 倍時，才會強制重新連線。對於最近仍活躍的工作階段，重新連線後的第一個時間窗會使用較短的正常訊息 timeout，而不是 4 倍時間窗。OpenClaw 可以自動回覆 Baileys 在該重新連線早期送達的 offline messages，範圍受 inbound message-ID dedupe lifetime 限制；初始啟動會保留較短的 stale-history guard。
- Baileys socket timing 明確位於 `web.whatsapp.*`：`keepAliveIntervalMs`（application ping 間隔）、`connectTimeoutMs`（opening handshake timeout）、`defaultQueryTimeoutMs`（Baileys query 等待，加上 OpenClaw 的 outbound send/presence 與 inbound read-receipt timeout）。
- Outbound sends 需要目標帳號有作用中的 WhatsApp listener；否則會快速失敗。
- Group sends 會為 `@+<digits>` 和 `@<digits>` tokens（文字與媒體 captions 中）附加原生 mention metadata，前提是 token 符合目前 participant metadata，包括 LID-backed groups。
- Status 與 broadcast chats (`@status`, `@broadcast`) 會被忽略。
- Direct chats 使用 DM session 規則（`session.dmScope`；預設 `main` 會將 DM 收斂到 agent main session）。Group sessions 會依 JID 隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以透過其原生 `@newsletter` JID 作為明確 outbound targets，使用 channel session metadata（`agent:<agentId>:whatsapp:channel:<jid>`），而不是 DM semantics。
- WhatsApp Web transport 會遵循閘道主機上的標準 proxy environment variables（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY`、小寫 variants）。優先使用 host-level proxy config，而不是 per-channel settings。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 ack reaction。

## 使用 MeowCaller 撥打目前請求者（實驗性）

此外掛可以在 WhatsApp 來源的 agent turns 中公開 `whatsapp_call`。它使用 [MeowCaller](https://github.com/purpshell/meowcaller) 對目前已授權請求者撥打 WhatsApp voice call，並在對方接聽後播放 OpenClaw TTS 訊息。此工具沒有 destination-number 參數，因此 prompt 無法重新導向通話。預設停用。

<Warning>
MeowCaller 是實驗性功能，沒有 tagged release，並且使用獨立配對的 whatsmeow linked-device session，無法重用此外掛的 Baileys credentials。配對會在同一個 WhatsApp 帳號新增另一個 linked device；請使用 OpenClaw 使用的身分掃描。個人號碼/自我聊天模式無法撥打自己；請使用專用 OpenClaw 號碼撥打你的個人號碼。
</Warning>

<Steps>
  <Step title="啟用實驗性通話">

    將 `actions.calls: true` 加到 WhatsApp channel config，並重新啟動閘道：

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

    Adapter 預期閘道主機的 `PATH` 上有 `meowcaller` 可執行檔。在 [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) 合併前，請建置已審查分支：

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    確保 `$HOME/.local/bin` 位於閘道服務的 `PATH` 中。此 revision 有明確的 `pair` 與 send-only `notify` commands；`notify` 不會開啟 microphone、speaker、video device 或 diagnostic capture。請勿替換成 upstream example 命令列介面的 `play` command。

  </Step>

  <Step title="配對 MeowCaller linked device">

    請 WhatsApp agent 檢查通話設定（`whatsapp_call` status action 會回報 account-specific state directory 與 pairing command）。針對預設帳號：

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    互動式執行此命令，從 **WhatsApp > 已連結裝置** 掃描 QR，並等待 `MeowCaller linked device ready`。請將 `wa-voip.db` 保密，這是 MeowCaller session。非預設帳號會從 status action 取得自己的 store path；在 Windows 上，請執行其 PowerShell command。

  </Step>

  <Step title="設定 TTS 並從 WhatsApp 撥打">

    設定支援電話語音的 [TTS provider](/zh-TW/tools/tts)，重新啟動閘道，然後傳送請求，例如 `Call me and say the build finished.`。工具會從可信 inbound context 解析寄件者，合成暫時的私有 WAV 檔案，在有界通話時間窗內執行 MeowCaller，並在之後刪除音訊檔案。OpenClaw 會明確傳入該帳號的 store，等待接聽/播放/掛斷後的零 exit status，並將 timeout 或非零 exit 視為失敗的工具呼叫。

  </Step>
</Steps>

限制：僅支援一對一 outbound audio calls、沒有任意 destination numbers、不與 chat connection 共用 auth、個人號碼/自我聊天模式不可自我通話、合成音訊上限 60 秒、除了 MeowCaller 的接聽/播放/掛斷完成狀態外，沒有 handset-side audibility receipt，且 OpenClaw 會在有界的 115-175 秒時間窗後停止 companion process（涵蓋 MeowCaller 的 connection、answer、playback 與 shutdown phases）。

## 核准 prompts

WhatsApp 可以將 exec 和外掛核准 prompts 顯示為 `👍`/`👎` reactions，由 top-level approval forwarding config 控制：

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

`approvals.exec` 和 `approvals.plugin` 彼此獨立；將 WhatsApp 啟用為頻道只會連結 transport，不會傳送任何內容，除非相符的 approval family 已啟用並路由到該處。Session mode 只會針對源自 WhatsApp 的核准傳送原生 emoji approvals。Target mode 會對明確 targets 使用共用 forwarding pipeline，不會建立獨立的 approver-DM fanout。

WhatsApp approval reactions 需要 `allowFrom`（或 `"*"`）中有明確 approvers。`defaultTo` 設定一般預設訊息 targets，而不是 approver list。手動 `/approve` commands 在 approval resolution 前仍會通過正常的 WhatsApp sender-authorization path。

## 外掛 hooks 與隱私

Inbound WhatsApp messages 可能攜帶個人內容、電話號碼、group identifiers、sender names 與 session correlation fields。除非你 opt in，否則 WhatsApp 不會向外掛廣播 inbound `message_received` hook payloads：

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

請將 opt-in 範圍限制在 `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived` 下的單一帳號。只有在你信任外掛可處理 inbound WhatsApp content 與 identifiers 時才啟用此功能。

## 存取控制與啟用

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy`：

    | 值 | 行為 |
    | --- | --- |
    | `pairing`（預設） | 未知寄件者請求配對；owner 核准 |
    | `allowlist` | 只允許 `allowFrom` 寄件者 |
    | `open` | 需要 `allowFrom` 包含 `"*"` |
    | `disabled` | 阻擋所有 DM |

    `allowFrom` 接受 E.164-style numbers（內部會 normalize）。它只是 DM sender access-control list，不會限制明確 outbound sends 到 group JIDs 或 `@newsletter` channel JIDs。

    Multi-account override：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `.allowFrom`）會優先於該帳號的 channel-level defaults。

    Runtime notes:

    - 配對會保存在頻道 allow-store 中，並與設定的 `allowFrom` 合併
    - 排程自動化和心跳偵測收件者後援會使用明確的傳遞目標或設定的 `allowFrom`；DM 配對核准不會隱含成為排程/心跳偵測收件者
    - 若未設定允許清單，預設允許已連結的本人號碼
    - OpenClaw 永遠不會自動配對外送的 `fromMe` DM（你從已連結裝置傳給自己的訊息）

  </Tab>

  <Tab title="群組政策與允許清單">
    群組存取有兩層：

    1. **群組成員允許清單** (`channels.whatsapp.groups`)：若省略 `groups`，所有群組都符合資格；若存在，則作為群組允許清單（`"*"` 允許全部）。
    2. **群組寄件者政策** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)：`open` 會略過寄件者允許清單，`allowlist` 需要符合 `groupAllowFrom`（或 `*`），`disabled` 會封鎖所有群組入站訊息。

    若未設定 `groupAllowFrom`，且 `allowFrom` 有項目時，寄件者檢查會退回使用 `allowFrom`。寄件者允許清單會在提及/回覆啟用之前評估。

    若完全沒有 `channels.whatsapp` 區塊，即使 `channels.defaults.groupPolicy` 設為其他值，執行階段也會退回到 `groupPolicy: "allowlist"`（並記錄警告）。

    <Note>
    群組成員資格解析有單一帳號安全網：如果只設定一個 WhatsApp 帳號，且其 `accounts.<id>.groups` 是明確的空物件 (`{}`)，會將其視為「未設定」，並退回使用根層級的 `channels.whatsapp.groups` 對應表，而不是靜默封鎖每個群組。設定 2 個以上帳號時，明確的空帳號對應表會保持為空且不會退回，這讓某個帳號可以刻意停用所有群組而不影響同層帳號。
    </Note>

  </Tab>

  <Tab title="提及與 /activation">
    群組回覆預設需要提及。提及偵測包含：

    - 明確提及機器人身分的 WhatsApp 提及
    - 設定的提及正規表示式模式 (`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`)
    - 已授權群組訊息的入站語音備忘錄轉錄
    - 隱含的回覆機器人偵測（回覆寄件者符合機器人身分）

    安全性：引用/回覆只滿足提及門檻，不會授予寄件者授權。使用 `groupPolicy: "allowlist"` 時，未在允許清單中的寄件者即使回覆允許清單使用者的訊息，仍會被封鎖。

    工作階段層級啟用命令：`/activation mention` 或 `/activation always`。這會更新工作階段狀態（不是全域設定），且受擁有者門檻限制。

  </Tab>
</Tabs>

## 已設定的 ACP 繫結

WhatsApp 支援透過頂層 `bindings[]` 使用持久 ACP 繫結：

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

直接聊天會比對 E.164 號碼；群組會比對 WhatsApp 群組 JID。群組允許清單、寄件者政策，以及提及/啟用門檻會在 OpenClaw 確保已繫結 ACP 工作階段存在之前執行。符合的繫結擁有該路由，廣播群組不會將該輪次分送到一般 WhatsApp 工作階段。

## 個人號碼與自我聊天行為

當已連結的本人號碼也存在於 `allowFrom` 時，自我聊天防護會啟用：略過自我聊天輪次的已讀回條、忽略可能 ping 到你自己的提及 JID 自動觸發行為，並在未設定 `messages.responsePrefix` 時，預設以 `[{identity.name}]`（或 `[openclaw]`）作為回覆前綴。

## 訊息正規化與情境

<AccordionGroup>
  <Accordion title="入站信封與回覆情境">
    傳入訊息會包裝在共享入站信封中。引用回覆會以下列形式附加情境：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時會填入回覆中繼資料（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、寄件者 JID/E.164）。如果引用目標是可下載媒體，OpenClaw 會透過一般入站媒體儲存區保存，並公開 `MediaPath`/`MediaType`，讓代理可以直接檢查，而不是只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒體佔位符與位置/聯絡人擷取">
    純媒體訊息會正規化為佔位符：`<media:image>`、`<media:video>`、`<media:audio>`、`<media:document>`、`<media:sticker>`。

    授權群組語音備忘錄在本文只有 `<media:audio>` 時，會在提及門檻之前先轉錄，因此在語音備忘錄中說出機器人提及即可觸發回覆。如果轉錄仍未提及機器人，則會保留在待處理群組歷史中，而不是原始佔位符。

    位置本文會呈現為簡短座標文字。位置標籤/註解和聯絡人/vCard 詳細資料會呈現為 fenced 不受信任的中繼資料，而不是內嵌提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    未處理的群組訊息會緩衝，並在機器人最終被觸發時注入為情境。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`，後援為 `messages.groupChat.historyLimit`
    - `0` 會停用

    注入標記：`[Chat messages since your last reply - for context]` 和 `[Current message - respond to this]`。

  </Accordion>

  <Accordion title="已讀回條">
    對接受的入站訊息預設啟用。全域停用：

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    每個帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`。即使全域啟用，自我聊天輪次也會略過已讀回條。

  </Accordion>
</AccordionGroup>

## 傳遞、分塊與媒體

<AccordionGroup>
  <Accordion title="文字分塊">
    - 預設分塊限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`；`newline` 會優先使用段落邊界（空行），然後退回使用長度安全的分塊

  </Accordion>

  <Accordion title="外送媒體行為">
    - 支援圖片、影片、音訊（PTT 語音備忘錄）和文件 payload
    - 音訊會以 Baileys `audio` payload 傳送，並帶有 `ptt: true`，呈現為按住說話語音備忘錄；回覆 payload 會保留 `audioAsVoice`，因此無論提供者的來源格式為何，TTS 語音備忘錄輸出都會留在此路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送；其他任何格式（包括 Microsoft Edge TTS MP3/WebM 輸出）都會在 PTT 傳遞前以 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus
    - `/tts latest` 會將最新助理回覆作為一則語音備忘錄傳送，並抑制同一回覆的重複傳送；`/tts chat on|off|default` 控制目前聊天的自動 TTS
    - 影片傳送上的 `gifPlayback: true` 會啟用動畫 GIF 播放
    - `forceDocument`/`asDocument` 會透過 Baileys 文件 payload 路由外送圖片、GIF 和影片，以避免 WhatsApp 的媒體壓縮，並保留解析出的檔案名稱和 MIME 類型
    - 標題會套用到多媒體回覆中的第一個媒體項目，但 PTT 語音備忘錄除外：音訊會先傳送且沒有標題，接著標題會作為獨立文字訊息傳送（WhatsApp 用戶端不會一致呈現語音備忘錄標題）
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與後援行為">
    - 入站保存上限與外送傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每個帳號覆寫：`channels.whatsapp.accounts.<id>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小/品質掃描）以符合限制，除非 `forceDocument`/`asDocument` 要求文件傳遞
    - 媒體傳送失敗時，第一項目後援會傳送文字警告，而不是靜默丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

`channels.whatsapp.replyToMode` 控制原生回覆引用（外送回覆會明顯引用入站訊息）：

| 值                | 行為                                                           |
| ----------------- | -------------------------------------------------------------- |
| `"off"`（預設）   | 永不引用；作為純訊息傳送                                       |
| `"first"`         | 只引用第一個外送回覆分塊                                       |
| `"all"`           | 引用每個外送回覆分塊                                           |
| `"batched"`       | 引用已佇列的批次回覆；讓即時回覆不引用                         |

每個帳號覆寫：`channels.whatsapp.accounts.<id>.replyToMode`。

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## 回應層級

`channels.whatsapp.reactionLevel` 控制代理使用 emoji 回應的廣泛程度：

| 層級                  | Ack 回應 | 代理發起的回應       |
| --------------------- | -------- | -------------------- |
| `"off"`               | 否       | 否                   |
| `"ack"`               | 是       | 否                   |
| `"minimal"`（預設）   | 是       | 是，保守指引         |
| `"extensive"`         | 是       | 是，鼓勵指引         |

每個帳號覆寫：`channels.whatsapp.accounts.<id>.reactionLevel`。

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## 確認回應

`channels.whatsapp.ackReaction` 會在收到入站時立即傳送回應，並受 `reactionLevel` 門檻限制（`"off"` 時抑制）：

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

注意：會在入站被接受後立即傳送（回覆前）；若 `ackReaction` 存在但沒有 `emoji`，WhatsApp 會使用被路由代理的身分 emoji，並退回到 "👀"（省略 `ackReaction` 或設定 `emoji: ""` 表示不確認）；失敗會記錄但不會阻擋回覆傳遞；群組模式 `mentions` 只在提及觸發的輪次回應，而群組啟用 `always` 會略過該檢查；WhatsApp 只使用 `channels.whatsapp.ackReaction`（舊版 `messages.ackReaction` 不適用於此）。

## 生命週期狀態回應

設定 `messages.statusReactions.enabled: true`，讓 WhatsApp 在輪次期間取代確認回應，而不是保留靜態收件 emoji，並在已佇列、思考中、工具活動、壓縮、完成和錯誤等狀態之間循環：

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

注意：`channels.whatsapp.ackReaction` 仍控制直接訊息和群組的適用資格；已佇列狀態使用與純確認回應相同的有效 emoji；WhatsApp 每則訊息有一個機器人回應槽，因此生命週期更新會就地取代目前回應；`messages.removeAckAfterReply: true` 會在設定的完成/錯誤保留時間後清除最終狀態回應；工具 emoji 類別包括 `tool`、`coding`、`web`、`deploy`、`build` 和 `concierge`。

## 多帳號與認證

<AccordionGroup>
  <Accordion title="帳號選擇與預設值">
    帳號 ID 來自 `channels.whatsapp.accounts`。預設帳號選擇是 `default`（若存在），否則是第一個設定的帳號 ID（按字母排序）。帳號 ID 會在內部正規化以供查詢。
  </Accordion>

  <Accordion title="憑證路徑與舊版相容性">
    - 目前的驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`（備份：`creds.json.bak`）
    - 仍會辨識／遷移 `~/.openclaw/credentials/` 中的舊版預設驗證，用於預設帳戶流程

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳戶的 WhatsApp 驗證狀態。當閘道可連線時，登出會先停止該帳戶的即時監聽器，因此已連結的工作階段會在下次重新啟動前停止接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳戶設定前停止即時監聽器。

    在舊版驗證目錄中，會保留 `oauth.json`，並移除 Baileys 驗證檔案。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理程式工具支援包含 WhatsApp reaction 動作 (`react`)。
- 動作閘門：`channels.whatsapp.actions.reactions`、`channels.whatsapp.actions.polls`（現有動作預設為 `true`）、`channels.whatsapp.actions.calls`（預設為 `false`，請參閱上方 MeowCaller）。
- 頻道發起的設定寫入預設為啟用；可透過 `channels.whatsapp.configWrites: false` 停用。

## 疑難排解

<AccordionGroup>
  <Accordion title="未連結（需要 QR）">
    症狀：頻道狀態回報未連結。

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="已連結但中斷連線／重新連線循環">
    症狀：已連結的帳戶反覆中斷連線或嘗試重新連線。

    安靜的帳戶可在一般訊息逾時後仍保持連線；只有在 WhatsApp Web 傳輸活動停止、socket 關閉，或應用程式層級活動沉默超過較長的安全視窗時，監看程式才會重新啟動（請參閱上方執行階段模型）。

    如果日誌顯示反覆出現 `status=408 Request Time-out Connection was lost`，請在 `web.whatsapp` 下調整 Baileys socket 時序。先將 `keepAliveIntervalMs` 縮短到低於你網路的閒置逾時，並在慢速或不穩定連線上增加 `connectTimeoutMs`：

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

    修復：

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    如果主機連線能力與時序修復後循環仍持續，請備份帳戶驗證目錄並重新連結：

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 都顯示健康，請執行 `openclaw doctor`。在 Linux 上，doctor 會警告舊版 crontab 項目呼叫已退役的 `~/.openclaw/bin/ensure-whatsapp.sh` 指令碼；請用 `crontab -e` 移除這些項目，因為 cron 可能缺少 systemd 使用者匯流排環境，導致該舊指令碼誤報閘道健康狀態。

  </Accordion>

  <Accordion title="QR 登入在代理後方逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用 QR 前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 中斷連線。

    WhatsApp Web 登入使用閘道主機的標準代理環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體、`NO_PROXY`）。確認閘道程序繼承代理環境變數，且 `NO_PROXY` 不會比對 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的監聽器">
    當目標帳戶沒有作用中的閘道監聽器時，對外傳送會快速失敗。確認閘道正在執行，且帳戶已連結。
  </Accordion>

  <Accordion title="回覆出現在逐字稿中，但未出現在 WhatsApp">
    逐字稿列會記錄代理程式產生的內容；WhatsApp 傳遞會另行檢查。只有在 Baileys 針對至少一則可見文字或媒體傳送回傳對外訊息 id 後，OpenClaw 才會將自動回覆視為已傳送。

    Ack reactions 是獨立的回覆前收據；成功的 reaction 不代表稍後的文字／媒體回覆已被接受。請檢查閘道日誌中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外遭忽略">
    請依序檢查：`groupPolicy`、`groupAllowFrom`/`allowFrom`、`groups` 允許清單項目、提及閘門（`requireMention` + 提及模式），以及 `openclaw.json` 中的重複鍵（JSON5 後面的項目會覆寫前面的項目，請在每個範圍只保留一個 `groupPolicy`）。

    如果存在 `channels.whatsapp.groups`，WhatsApp 仍可觀察來自其他群組的訊息，但 OpenClaw 會在工作階段路由前捨棄它們。請將群組 JID 加入 `channels.whatsapp.groups`，或加入 `groups["*"]` 以允許所有群組，同時仍透過 `groupPolicy`/`groupAllowFrom` 保持寄件者授權控管。

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    WhatsApp 閘道執行階段應使用節點。Bun 會被標記為不相容於穩定的 WhatsApp/Telegram 閘道操作。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 支援透過 `groups` 和 `direct` 對應表，為群組與直接聊天使用 Telegram 風格的系統提示。

群組訊息的解析方式：會先決定有效的 `groups` 對應表；如果帳戶本身定義了任何 `groups` 鍵，它會完整取代根層 `groups` 對應表（沒有深度合併）。接著會在該單一結果對應表上執行提示查找：

1. **群組專屬提示**（`groups["<groupId>"].systemPrompt`）：當群組項目存在**且**其 `systemPrompt` 鍵已定義時使用。空字串（`""`）會抑制萬用字元，且不套用任何提示。
2. **群組萬用提示**（`groups["*"].systemPrompt`）：當特定群組項目不存在，或存在但沒有 `systemPrompt` 鍵時使用。

直接訊息的解析方式會對 `direct` 對應表和 `direct["*"]` 使用相同模式。

<Note>
`dms` 仍是輕量的每個 DM 歷史覆寫儲存桶（`dms.<id>.historyLimit`）。提示覆寫位於 `direct` 之下。
</Note>

<Note>
這種用帳戶取代根層的提示解析行為，是單純的淺層覆寫：任何帳戶 `groups`/`direct` 鍵，包括明確的空物件，都會取代根層對應表。它不同於上方描述的群組成員資格允許清單檢查；後者對意外空白的 `groups: {}` 有單一帳戶安全網。
</Note>

**與 Telegram 的差異：**Telegram 會在多帳戶設定中，對每個帳戶抑制根層 `groups`（即使帳戶本身沒有 `groups`），以避免機器人接收不屬於它的群組訊息。WhatsApp 不會套用該防護；任何沒有自身覆寫的帳戶都會繼承根層 `groups`/`direct`，無論帳戶數量多少。在多帳戶 WhatsApp 設定中，如果你想要每個帳戶各自的提示，請在每個帳戶下明確定義完整對應表。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定對應表，以及聊天層級的群組允許清單。在根層或帳戶範圍，`groups["*"]` 表示該範圍「允許所有群組」。
- 只有在你已經想讓該範圍允許所有群組時，才加入萬用 `systemPrompt`。若要只讓固定的一組群組 ID 符合資格，請在每個明確允許清單項目上重複提示，而不是使用 `groups["*"]`。
- 群組准入與寄件者授權是不同檢查。`groups["*"]` 會擴大哪些群組能進入群組處理；它不會授權這些群組中的每個寄件者，寄件者授權仍由 `groupPolicy`/`groupAllowFrom` 控制。
- `channels.whatsapp.direct` 對 DM 沒有同等副作用：`direct["*"]` 只會在 DM 已由 `dmPolicy` 加上 `allowFrom` 或配對儲存規則准入後，提供預設設定。

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
| 多帳戶           | `accounts.<id>.enabled`, `accounts.<id>.authDir`, and other per-account overrides                              |
| 操作             | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| 工作階段行為     | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| 提示             | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [頻道路由](/zh-TW/channels/channel-routing)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
