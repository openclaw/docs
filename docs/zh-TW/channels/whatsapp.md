---
read_when:
    - 處理 WhatsApp/網頁通道行為或收件匣路由
summary: WhatsApp 頻道支援、存取控制、傳遞行為與維運
title: WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:15:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52a81fc323568e06d11606931e34465fe5a823a0699d8e0638195b8667c3ebee
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：透過 WhatsApp Web（Baileys）已可用於生產環境。Gateway 擁有已連結的工作階段。

## 安裝（按需）

- Onboarding（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  會在你第一次選取 WhatsApp Plugin 時提示安裝。
- 當 Plugin 尚未存在時，`openclaw channels login --channel whatsapp` 也會提供安裝流程。
- Dev channel + git checkout：預設使用本機 Plugin 路徑。
- Stable/Beta：在目前官方
  release tag 上使用 npm 套件 `@openclaw/whatsapp`。

仍可手動安裝：

```bash
openclaw plugins install @openclaw/whatsapp
```

使用裸套件可跟隨目前的官方 release tag。只有在需要可重現安裝時，才釘選精確版本。

在 Windows 上，WhatsApp Plugin 在 npm install 期間需要 `PATH` 上有 Git，因為其 Baileys/libsignal 依賴項之一是從 git URL 擷取。安裝 Git for Windows，然後重新啟動 shell 並重新執行安裝：

```powershell
winget install --id Git.Git -e
```

只要 Portable Git 的 `bin` 目錄位於 `PATH` 上，也可以使用。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    預設 DM 政策是對未知寄件者進行配對。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復手冊。
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

    針對特定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加既有/自訂的 WhatsApp Web 驗證目錄：

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

    配對請求會在 1 小時後過期。每個通道最多保留 3 個待處理請求。

  </Step>
</Steps>

<Note>
OpenClaw 建議在可行時使用獨立號碼執行 WhatsApp。（通道中繼資料和設定流程已針對該設定最佳化，但也支援個人號碼設定。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    這是最簡潔的作業模式：

    - OpenClaw 的獨立 WhatsApp 身分
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

  <Accordion title="Personal-number fallback">
    Onboarding 支援個人號碼模式，並寫入適合自我聊天的基準設定：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的個人號碼
    - `selfChatMode: true`

    在執行階段，自我聊天保護會根據已連結的自身號碼和 `allowFrom` 判斷。

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    在目前的 OpenClaw 通道架構中，訊息平台通道以 WhatsApp Web（`Baileys`）為基礎。

    內建聊天通道登錄中沒有獨立的 Twilio WhatsApp 訊息通道。

  </Accordion>
</AccordionGroup>

## 執行階段模型

- Gateway 擁有 WhatsApp socket 和重新連線迴圈。
- 重新連線 watchdog 使用 WhatsApp Web 傳輸活動，而不只使用傳入應用程式訊息量，因此安靜的已連結裝置工作階段不會只因為最近沒有人傳送訊息而重新啟動。如果傳輸 frame 持續抵達但 watchdog 視窗內未處理任何應用程式訊息，較長的應用程式靜默上限仍會強制重新連線；對最近活躍工作階段的暫時重新連線之後，該應用程式靜默檢查會在第一個復原視窗使用正常訊息逾時。
- Baileys socket 時序在 `web.whatsapp.*` 下明確設定：`keepAliveIntervalMs` 控制 WhatsApp Web 應用程式 ping，`connectTimeoutMs` 控制開啟交握逾時，而 `defaultQueryTimeoutMs` 控制 Baileys 查詢逾時。
- 傳出傳送需要目標帳號有作用中的 WhatsApp 監聽器。
- 群組傳送會針對文字與媒體標題中的 `@+<digits>` 和 `@<digits>` 權杖附加原生提及中繼資料，前提是該權杖符合目前 WhatsApp 參與者中繼資料，包括以 LID 支援的群組。
- 狀態和廣播聊天會被忽略（`@status`、`@broadcast`）。
- 重新連線 watchdog 會遵循 WhatsApp Web 傳輸活動，而不只看傳入應用程式訊息量：只要傳輸 frame 持續，安靜的已連結裝置工作階段就會保持連線，但傳輸停滯會在較晚的遠端中斷連線路徑之前很早就強制重新連線。
- 直接聊天使用 DM 工作階段規則（`session.dmScope`；預設 `main` 會將 DM 收斂到代理程式主工作階段）。
- 群組工作階段會隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可以使用其原生 `@newsletter` JID 作為明確傳出目標。傳出 newsletter 傳送使用通道工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而非 DM 工作階段語意。
- WhatsApp Web 傳輸遵循 Gateway 主機上的標準 Proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小寫變體）。優先使用主機層級 Proxy 設定，而非通道特定的 WhatsApp Proxy 設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 WhatsApp ack 反應。

## Plugin hook 與隱私

WhatsApp 傳入訊息可能包含個人訊息內容、電話號碼、
群組識別碼、寄件者名稱，以及工作階段關聯欄位。因此，
除非你明確選擇加入，WhatsApp 不會將傳入的 `message_received` hook payload 廣播給 Plugin：

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

你可以將選擇加入範圍限定為一個帳號：

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

只有在你信任 Plugin 可接收傳入 WhatsApp 訊息內容與識別碼時，才啟用此選項。

## 存取控制與啟用

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` 控制直接聊天存取：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 風格的號碼（內部會正規化）。

    `allowFrom` 是 DM 寄件者存取控制清單。它不會限制明確傳出傳送到 WhatsApp 群組 JID 或 `@newsletter` 通道 JID。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）優先於該帳號的通道層級預設值。

    執行階段行為詳細資料：

    - 配對會持久化到通道允許儲存區，並與設定的 `allowFrom` 合併
    - 排程自動化與 Heartbeat 收件者後援會使用明確傳遞目標或設定的 `allowFrom`；DM 配對核准不會隱含為 Cron 或 Heartbeat 收件者
    - 如果未設定允許清單，預設允許已連結的自身號碼
    - OpenClaw 永遠不會自動配對傳出的 `fromMe` DM（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="Group policy + allowlists">
    群組存取有兩層：

    1. **群組成員允許清單**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群組都有資格
       - 如果存在 `groups`，它會作為群組允許清單（允許 `"*"`）

    2. **群組寄件者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：略過寄件者允許清單
       - `allowlist`：寄件者必須符合 `groupAllowFrom`（或 `*`）
       - `disabled`：封鎖所有群組傳入

    寄件者允許清單後援：

    - 如果未設定 `groupAllowFrom`，執行階段會在可用時後援到 `allowFrom`
    - 寄件者允許清單會在提及/回覆啟用之前評估

    注意：如果完全沒有 `channels.whatsapp` 區塊，執行階段群組政策後援為 `allowlist`（並記錄警告），即使已設定 `channels.defaults.groupPolicy`。

  </Tab>

  <Tab title="Mentions + /activation">
    群組回覆預設需要提及。

    提及偵測包含：

    - 明確提及 bot 身分的 WhatsApp 提及
    - 已設定的提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 已授權群組訊息的傳入語音訊息逐字稿
    - 隱含的回覆給 bot 偵測（回覆寄件者符合 bot 身分）

    安全性注意事項：

    - 引用/回覆只會滿足提及門檻；它**不會**授予寄件者授權
    - 使用 `groupPolicy: "allowlist"` 時，未在允許清單中的寄件者仍會被封鎖，即使他們回覆允許清單使用者的訊息

    工作階段層級啟用命令：

    - `/activation mention`
    - `/activation always`

    `activation` 會更新工作階段狀態（不是全域設定）。它受擁有者門檻保護。

  </Tab>
</Tabs>

## 個人號碼與自我聊天行為

當已連結的自身號碼也存在於 `allowFrom` 時，WhatsApp 自我聊天防護會啟用：

- 略過自我聊天回合的讀取回條
- 忽略原本會 ping 你自己的提及 JID 自動觸發行為
- 如果未設定 `messages.responsePrefix`，自我聊天回覆預設為 `[{identity.name}]` 或 `[openclaw]`

## 訊息正規化與情境

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    傳入 WhatsApp 訊息會包裝在共用的傳入 envelope 中。

    如果存在引用回覆，情境會以此形式附加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時，也會填入回覆中繼資料欄位（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、寄件者 JID/E.164）。
    當引用回覆目標是可下載媒體時，OpenClaw 會透過
    正常的傳入媒體儲存區儲存它，並將其公開為 `MediaPath`/`MediaType`，讓
    代理程式可以檢查所參照的圖片，而不是只看到
    `<media:image>`。

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    僅媒體的傳入訊息會使用如下預留位置正規化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    對已授權群組語音訊息，當
    內文只有 `<media:audio>` 時，會在提及門檻判斷前先轉錄，因此在語音訊息中說出 bot 提及即可
    觸發回覆。如果逐字稿仍未提及 bot，
    則逐字稿會保留在待處理群組歷史中，而非原始預留位置。

    位置內文使用簡潔的座標文字。位置標籤/註解與聯絡人/vCard 詳細資料會呈現為 fenced 不受信任中繼資料，而不是內嵌 prompt 文字。

  </Accordion>

  <Accordion title="Pending group history injection">
    對於群組，未處理的訊息可以被緩衝，並在 bot 最終被觸發時作為情境注入。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    注入標記：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
    WhatsApp 接受的傳入訊息預設會啟用已讀回條。

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

    個別帳號覆寫：

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

    即使已全域啟用，自我聊天回合也會略過已讀回條。

  </Accordion>
</AccordionGroup>

## 傳送、分段與媒體

<AccordionGroup>
  <Accordion title="Text chunking">
    - 預設分段限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式會優先採用段落邊界（空白行），再後援為長度安全的分段

  </Accordion>

  <Accordion title="Outbound media behavior">
    - 支援圖片、影片、音訊（PTT 語音備註）和文件 payload
    - 音訊媒體會透過 Baileys `audio` payload 並搭配 `ptt: true` 傳送，因此 WhatsApp 用戶端會將其呈現為按住說話語音備註
    - 回覆 payload 會保留 `audioAsVoice`；即使提供者回傳 MP3 或 WebM，WhatsApp 的 TTS 語音備註輸出仍會留在此 PTT 路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送，以相容語音備註
    - 非 Ogg 音訊，包括 Microsoft Edge TTS MP3/WebM 輸出，會在 PTT 傳送前使用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus
    - `/tts latest` 會將最新的助理回覆作為一則語音備註傳送，並抑制同一則回覆的重複傳送；`/tts chat on|off|default` 控制目前 WhatsApp 聊天的自動 TTS
    - 影片傳送時可透過 `gifPlayback: true` 支援動畫 GIF 播放
    - 傳送多媒體回覆 payload 時，字幕會套用到第一個媒體項目；但 PTT 語音備註會先傳送音訊，再另行傳送可見文字，因為 WhatsApp 用戶端不會一致地呈現語音備註字幕
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - 傳入媒體儲存上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 傳出媒體傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 個別帳號覆寫使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小/品質掃描）以符合限制
    - 媒體傳送失敗時，第一項後援會傳送文字警告，而不是靜默丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

WhatsApp 支援原生回覆引用，也就是傳出回覆會可見地引用傳入訊息。使用 `channels.whatsapp.replyToMode` 控制。

| 值          | 行為                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；作為純訊息傳送                                              |
| `"first"`   | 只引用第一個傳出回覆分段                                              |
| `"all"`     | 引用每個傳出回覆分段                                                  |
| `"batched"` | 引用已排入佇列的批次回覆，同時讓即時回覆不引用                        |

預設為 `"off"`。個別帳號覆寫使用 `channels.whatsapp.accounts.<id>.replyToMode`。

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

`channels.whatsapp.reactionLevel` 控制 agent 在 WhatsApp 上使用 emoji 反應的廣泛程度：

| 等級          | 確認反應 | Agent 主動反應 | 說明                                             |
| ------------- | -------- | -------------- | ------------------------------------------------ |
| `"off"`       | 否       | 否             | 完全不使用反應                                   |
| `"ack"`       | 是       | 否             | 僅確認反應（回覆前收條）                         |
| `"minimal"`   | 是       | 是（保守）     | 確認 + agent 反應，使用保守指引                  |
| `"extensive"` | 是       | 是（鼓勵）     | 確認 + agent 反應，使用鼓勵指引                  |

預設：`"minimal"`。

個別帳號覆寫使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

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

WhatsApp 支援透過 `channels.whatsapp.ackReaction` 在收到傳入訊息時立即傳送確認反應。
確認反應受 `reactionLevel` 閘控，當 `reactionLevel` 為 `"off"` 時會被抑制。

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

行為注意事項：

- 在傳入訊息被接受後立即傳送（回覆前）
- 失敗會被記錄，但不會封鎖正常回覆傳送
- 群組模式 `mentions` 會在提及觸發的回合中反應；群組啟用 `always` 會作為此檢查的略過方式
- WhatsApp 使用 `channels.whatsapp.ackReaction`（舊版 `messages.ackReaction` 不在此處使用）

## 多帳號與認證

<AccordionGroup>
  <Accordion title="Account selection and defaults">
    - 帳號 ID 來自 `channels.whatsapp.accounts`
    - 預設帳號選擇：若存在則為 `default`，否則為第一個已設定的帳號 ID（排序後）
    - 帳號 ID 會在內部正規化以供查找

  </Accordion>

  <Accordion title="Credential paths and legacy compatibility">
    - 目前 auth 路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 備份檔案：`creds.json.bak`
    - 仍會辨識/遷移 `~/.openclaw/credentials/` 中的舊版預設 auth，以支援預設帳號流程

  </Accordion>

  <Accordion title="Logout behavior">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp auth 狀態。

    當 Gateway 可連線時，登出會先停止所選帳號的即時 WhatsApp listener，讓已連結的工作階段不會在下一次重新啟動前持續接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳號設定前停止即時 listener。

    在舊版 auth 目錄中，`oauth.json` 會保留，而 Baileys auth 檔案會被移除。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- Agent 工具支援包含 WhatsApp 反應動作（`react`）。
- 動作閘門：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 預設啟用由通道發起的設定寫入（透過 `channels.whatsapp.configWrites=false` 停用）。

## 疑難排解

<AccordionGroup>
  <Accordion title="Not linked (QR required)">
    症狀：通道狀態回報未連結。

    修正：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Linked but disconnected / reconnect loop">
    症狀：已連結帳號重複斷線或嘗試重新連線。

    安靜的帳號可以在一般訊息逾時後仍保持連線；當 WhatsApp Web 傳輸活動停止、socket 關閉，或應用層活動在較長的安全時間窗後仍保持靜默時，watchdog 會重新啟動。

    如果日誌顯示重複的 `status=408 Request Time-out Connection was lost`，請在 `web.whatsapp` 下調整 Baileys socket 時序。先將 `keepAliveIntervalMs` 縮短到低於網路的閒置逾時，並在慢速或高遺失率連線上增加 `connectTimeoutMs`：

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

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 顯示 gateway 與 WhatsApp 健康，請執行 `openclaw doctor`。在 Linux 上，doctor 會警告仍叫用 `~/.openclaw/bin/ensure-whatsapp.sh` 的舊版 crontab 項目；請用 `crontab -e` 移除那些過時項目，因為 cron 可能缺少 systemd 使用者匯流排環境，導致該舊指令碼誤報 gateway 健康狀態。

    如有需要，請使用 `channels login` 重新連結。

  </Accordion>

  <Accordion title="QR login times out behind a proxy">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用的 QR code 前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 斷線。

    WhatsApp Web 登入會使用 gateway 主機的標準 proxy 環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體，以及 `NO_PROXY`）。確認 gateway 程序繼承了 proxy env，且 `NO_PROXY` 未匹配 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="No active listener when sending">
    當目標帳號不存在作用中的 gateway listener 時，傳出傳送會快速失敗。

    請確認 gateway 正在執行且帳號已連結。

  </Accordion>

  <Accordion title="Reply appears in transcript but not in WhatsApp">
    Transcript 列會記錄 agent 產生的內容。WhatsApp 傳送會另外檢查：OpenClaw 只有在 Baileys 針對至少一個可見文字或媒體傳送回傳傳出訊息 ID 後，才會將自動回覆視為已傳送。

    確認反應是獨立的回覆前收條。成功的反應不代表後續文字或媒體回覆已被 WhatsApp 接受。

    檢查 gateway 日誌中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="Group messages unexpectedly ignored">
    依此順序檢查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允許清單項目
    - 提及閘控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重複鍵：較後面的項目會覆寫較早的項目，因此每個範圍只保留一個 `groupPolicy`

  </Accordion>

  <Accordion title="Bun runtime warning">
    WhatsApp gateway runtime 應使用 Node。Bun 被標示為不相容於穩定的 WhatsApp/Telegram gateway 運作。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 透過 `groups` 和 `direct` 對應表支援 Telegram 風格的群組與直接聊天系統提示。

群組訊息的解析階層：

有效的 `groups` 對應表會先被決定：如果帳號定義自己的 `groups`，它會完整取代根層 `groups` 對應表（不進行深層合併）。接著提示查找會在產生的單一對應表上執行：

1. **群組專屬系統提示**（`groups["<groupId>"].systemPrompt`）：當對應表中存在特定群組項目，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用任何系統提示。
2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當對應表中完全不存在特定群組項目，或該項目存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析階層：

有效的 `direct` 對應表會先被決定：如果帳號定義自己的 `direct`，它會完整取代根層 `direct` 對應表（不進行深層合併）。接著提示查找會在產生的單一對應表上執行：

1. **Direct 專屬系統提示** (`direct["<peerId>"].systemPrompt`)：當地圖中存在特定對等項目，**且**其 `systemPrompt` 鍵已定義時使用。若 `systemPrompt` 是空字串 (`""`)，則會抑制萬用字元，且不套用任何系統提示。
2. **Direct 萬用字元系統提示** (`direct["*"].systemPrompt`)：當地圖中完全沒有特定對等項目，或該項目存在但未定義 `systemPrompt` 鍵時使用。

<Note>
`dms` 仍是輕量的每個 DM 歷史覆寫儲存區 (`dms.<id>.historyLimit`)。提示覆寫位於 `direct` 之下。
</Note>

**與 Telegram 多帳號行為的差異：** 在 Telegram 中，多帳號設定會刻意對所有帳號抑制根層級 `groups`，即使某些帳號未定義自己的 `groups` 也一樣，以防止 bot 接收其不屬於的群組訊息。WhatsApp 不套用這項保護：根層級 `groups` 與根層級 `direct` 一律會由未定義帳號層級覆寫的帳號繼承，無論設定了多少帳號。在多帳號 WhatsApp 設定中，若你想要每個帳號各自的群組或 Direct 提示，請在每個帳號下明確定義完整地圖，而不是依賴根層級預設值。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定地圖，也是聊天層級的群組允許清單。在根層級或帳號範圍中，`groups["*"]` 代表「該範圍允許所有群組進入」。
- 只有在你已經希望該範圍允許所有群組進入時，才加入萬用字元群組 `systemPrompt`。如果你仍只希望固定一組群組 ID 符合資格，請不要使用 `groups["*"]` 作為提示預設值。請改為在每個明確列入允許清單的群組項目上重複該提示。
- 群組進入與傳送者授權是分開的檢查。`groups["*"]` 會擴大可進入群組處理流程的群組集合，但它本身不會授權這些群組中的每個傳送者。傳送者存取仍由 `channels.whatsapp.groupPolicy` 與 `channels.whatsapp.groupAllowFrom` 分別控制。
- `channels.whatsapp.direct` 對 DM 沒有相同的副作用。`direct["*"]` 只會在 DM 已由 `dmPolicy` 加上 `allowFrom` 或配對儲存規則允許之後，提供預設的 Direct 聊天設定。

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
