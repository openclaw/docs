---
read_when:
    - 處理 WhatsApp/網頁通道行為或收件匣路由
summary: WhatsApp 頻道支援、存取控制、傳遞行為與維運
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T02:45:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c25380f6a08e771b1a3f5e39f2284cffbffe76a3b05f1a885efe0a5f6a7d022c
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: 已可投入生產使用，透過 WhatsApp Web（Baileys）。Gateway 擁有已連結的工作階段。

## 安裝（按需）

- Onboarding（`openclaw onboard`）和 `openclaw channels add --channel whatsapp`
  會在你第一次選取 WhatsApp Plugin 時提示安裝。
- `openclaw channels login --channel whatsapp` 也會在
  Plugin 尚未存在時提供安裝流程。
- Dev channel + git checkout：預設使用本機 Plugin 路徑。
- Stable/Beta：在目前套件已發布時，使用 npm 套件 `@openclaw/whatsapp`。

手動安裝仍然可用：

```bash
openclaw plugins install @openclaw/whatsapp
```

如果 npm 回報 OpenClaw 擁有的套件已棄用或遺失，請使用
目前已封裝的 OpenClaw 組建，或在 npm 套件發布列車
跟上之前使用本機 checkout。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    預設 DM 政策會要求未知傳送者配對。
  </Card>
  <Card title="Channel 疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨 Channel 診斷與修復手冊。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的 Channel 設定模式與範例。
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

    對特定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    在登入前附加既有/自訂 WhatsApp Web 驗證目錄：

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="啟動 Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="核准第一個配對要求（如果使用配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對要求會在 1 小時後到期。待處理要求每個 Channel 最多 3 個。

  </Step>
</Steps>

<Note>
OpenClaw 建議在可行時使用獨立號碼執行 WhatsApp。（Channel 中繼資料與設定流程已針對此設定最佳化，但也支援個人號碼設定。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    這是最乾淨的操作模式：

    - OpenClaw 的獨立 WhatsApp 身分
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

    在執行階段，自我聊天保護會根據已連結的自我號碼和 `allowFrom` 生效。

  </Accordion>

  <Accordion title="僅限 WhatsApp Web 的 Channel 範圍">
    訊息平台 Channel 在目前 OpenClaw Channel 架構中是以 WhatsApp Web 為基礎（`Baileys`）。

    內建聊天 Channel 登錄檔中沒有獨立的 Twilio WhatsApp 訊息 Channel。

  </Accordion>
</AccordionGroup>

## 執行階段模型

- Gateway 擁有 WhatsApp socket 與重新連線迴圈。
- 重新連線 watchdog 使用 WhatsApp Web 傳輸活動，而不只看入站應用程式訊息量，因此安靜的已連結裝置工作階段，不會只因為最近沒有人傳送訊息就重新啟動。較長的應用程式靜默上限仍會在傳輸 frame 持續抵達但 watchdog 視窗期間沒有處理任何應用程式訊息時強制重新連線；對於最近活躍工作階段的暫時重新連線，該應用程式靜默檢查會在第一個復原視窗使用一般訊息逾時。
- Baileys socket 時序在 `web.whatsapp.*` 下明確設定：`keepAliveIntervalMs` 控制 WhatsApp Web 應用程式 ping，`connectTimeoutMs` 控制開啟 handshake 逾時，`defaultQueryTimeoutMs` 控制 Baileys 查詢逾時。
- 傳出傳送需要目標帳號有作用中的 WhatsApp listener。
- 狀態與廣播聊天會被忽略（`@status`、`@broadcast`）。
- 重新連線 watchdog 會跟隨 WhatsApp Web 傳輸活動，而不只看入站應用程式訊息量：只要傳輸 frame 持續，安靜的已連結裝置工作階段會保持啟動，但傳輸停滯會在較晚的遠端中斷連線路徑之前強制重新連線。
- 直接聊天使用 DM 工作階段規則（`session.dmScope`；預設 `main` 會將 DM 收斂到 agent main 工作階段）。
- 群組工作階段是隔離的（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Web 傳輸會遵守 Gateway 主機上的標準 Proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小寫變體）。優先使用主機層級 Proxy 設定，而不是 Channel 專用 WhatsApp Proxy 設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 WhatsApp ack reaction。

## Plugin hook 與隱私

WhatsApp 入站訊息可能包含個人訊息內容、電話號碼、
群組識別碼、傳送者名稱，以及工作階段關聯欄位。因此，
除非你明確選擇加入，WhatsApp 不會向 Plugin 廣播入站
`message_received` hook payload：

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

你可以將選擇加入限制在單一帳號：

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

只有在你信任 Plugin 可接收入站 WhatsApp 訊息
內容與識別碼時，才啟用此選項。

## 存取控制與啟用

<Tabs>
  <Tab title="DM 政策">
    `channels.whatsapp.dmPolicy` 控制直接聊天存取：

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 樣式號碼（內部會正規化）。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（和 `allowFrom`）會優先於該帳號的 Channel 層級預設值。

    執行階段行為細節：

    - 配對會持久化到 Channel allow-store，並與已設定的 `allowFrom` 合併
    - 如果未設定 allowlist，預設允許已連結的自我號碼
    - OpenClaw 絕不會自動配對傳出的 `fromMe` DM（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策 + allowlist">
    群組存取有兩層：

    1. **群組成員資格 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群組都符合資格
       - 如果存在 `groups`，它會作為群組 allowlist（允許 `"*"`）

    2. **群組傳送者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：略過傳送者 allowlist
       - `allowlist`：傳送者必須符合 `groupAllowFrom`（或 `*`）
       - `disabled`：封鎖所有群組入站

    傳送者 allowlist 備援：

    - 如果未設定 `groupAllowFrom`，執行階段會在可用時退回使用 `allowFrom`
    - 傳送者 allowlist 會在提及/回覆啟用之前評估

    注意：如果完全沒有 `channels.whatsapp` 區塊，執行階段群組政策備援為 `allowlist`（並記錄警告 log），即使已設定 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    群組回覆預設需要提及。

    提及偵測包含：

    - 明確提及 bot 身分的 WhatsApp 提及
    - 已設定的提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 已授權群組訊息的入站 voice-note transcript
    - 隱含的回覆 bot 偵測（回覆傳送者符合 bot 身分）

    安全注意事項：

    - quote/reply 只滿足提及 gate；它**不會**授予傳送者授權
    - 使用 `groupPolicy: "allowlist"` 時，非 allowlist 傳送者即使回覆 allowlist 使用者的訊息，仍會被封鎖

    工作階段層級啟用命令：

    - `/activation mention`
    - `/activation always`

    `activation` 會更新工作階段狀態（不是全域設定）。它受擁有者 gate 控制。

  </Tab>
</Tabs>

## 個人號碼與自我聊天行為

當已連結的自我號碼也存在於 `allowFrom` 時，WhatsApp 自我聊天防護會啟用：

- 略過自我聊天回合的讀取回條
- 忽略原本會 ping 你自己的 mention-JID 自動觸發行為
- 如果未設定 `messages.responsePrefix`，自我聊天回覆預設為 `[{identity.name}]` 或 `[openclaw]`

## 訊息正規化與上下文

<AccordionGroup>
  <Accordion title="入站 envelope + 回覆上下文">
    傳入 WhatsApp 訊息會包裝在共享入站 envelope 中。

    如果存在引用回覆，會以下列形式附加上下文：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時也會填入回覆中繼資料欄位（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。
    當引用回覆目標是可下載媒體時，OpenClaw 會透過
    一般入站媒體存放區儲存它，並以 `MediaPath`/`MediaType` 暴露，
    讓 agent 可以檢查被參照的圖片，而不是只看到
    `<media:image>`。

  </Accordion>

  <Accordion title="媒體 placeholder 與位置/聯絡人擷取">
    僅含媒體的入站訊息會以如下 placeholder 正規化：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    已授權群組 voice note 會在訊息本文只有 `<media:audio>` 時，
    於提及 gate 之前先轉錄，因此在 voice note 中說出 bot 提及
    可以觸發回覆。如果 transcript 仍未提及 bot，
    transcript 會保留在待處理群組歷史中，而不是原始 placeholder。

    位置本文使用簡潔的座標文字。位置標籤/註解與聯絡人/vCard 詳細資料會呈現為 fenced untrusted metadata，而不是內嵌 prompt text。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    對群組而言，未處理的訊息可以先緩衝，並在 bot 最終被觸發時作為上下文注入。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`
    - 備援：`messages.groupChat.historyLimit`
    - `0` 會停用

    注入標記：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="讀取回條">
    已接受的入站 WhatsApp 訊息預設會啟用讀取回條。

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

    即使全域啟用，自我聊天回合也會略過讀取回條。

  </Accordion>
</AccordionGroup>

## 傳送、分塊與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式會優先使用段落邊界（空白行），再退回使用長度安全的分段

  </Accordion>

  <Accordion title="傳出媒體行為">
    - 支援圖片、影片、音訊（PTT 語音備忘）和文件 payload
    - 音訊媒體會透過 Baileys `audio` payload 搭配 `ptt: true` 傳送，因此 WhatsApp 用戶端會將其呈現為按住說話語音備忘
    - 回覆 payload 會保留 `audioAsVoice`；即使提供者回傳 MP3 或 WebM，WhatsApp 的 TTS 語音備忘輸出仍會維持在這條 PTT 路徑上
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送，以維持語音備忘相容性
    - 非 Ogg 音訊，包括 Microsoft Edge TTS MP3/WebM 輸出，會先用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus，再以 PTT 交付
    - `/tts latest` 會將最新的助理回覆作為一則語音備忘傳送，並抑制對同一則回覆的重複傳送；`/tts chat on|off|default` 控制目前 WhatsApp 聊天的自動 TTS
    - 影片傳送時可透過 `gifPlayback: true` 支援動畫 GIF 播放
    - 傳送多媒體回覆 payload 時，標題會套用到第一個媒體項目，但 PTT 語音備忘會先傳送音訊，再另外傳送可見文字，因為 WhatsApp 用戶端不會一致地呈現語音備忘標題
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與備援行為">
    - 傳入媒體儲存上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 傳出媒體傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每個帳戶的覆寫使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小/品質掃描）以符合限制
    - 媒體傳送失敗時，第一項備援會傳送文字警告，而不是靜默丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

WhatsApp 支援原生回覆引用，傳出回覆會明顯引用傳入訊息。使用 `channels.whatsapp.replyToMode` 控制。

| 值          | 行為                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；以純訊息傳送                                                |
| `"first"`   | 只引用第一個傳出回覆分段                                              |
| `"all"`     | 引用每個傳出回覆分段                                                  |
| `"batched"` | 引用佇列中的批次回覆，同時讓即時回覆不引用                            |

預設為 `"off"`。每個帳戶的覆寫使用 `channels.whatsapp.accounts.<id>.replyToMode`。

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

`channels.whatsapp.reactionLevel` 控制 agent 在 WhatsApp 上使用 emoji 反應的範圍：

| 層級          | Ack 反應 | Agent 主動發起的反應 | 說明                                             |
| ------------- | -------- | -------------------- | ------------------------------------------------ |
| `"off"`       | 否       | 否                   | 完全沒有反應                                     |
| `"ack"`       | 是       | 否                   | 僅 Ack 反應（回覆前收據）                        |
| `"minimal"`   | 是       | 是（保守）           | Ack + agent 反應，採用保守指引                   |
| `"extensive"` | 是       | 是（鼓勵）           | Ack + agent 反應，採用鼓勵指引                   |

預設：`"minimal"`。

每個帳戶的覆寫使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

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

WhatsApp 支援透過 `channels.whatsapp.ackReaction` 在收到傳入訊息時立即送出 ack 反應。
Ack 反應受 `reactionLevel` 控制；當 `reactionLevel` 為 `"off"` 時會被抑制。

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
- 失敗會被記錄，但不會阻擋一般回覆交付
- 群組模式 `mentions` 會在由提及觸發的回合中反應；群組啟用 `always` 會作為繞過此檢查的方式
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此處不使用舊版 `messages.ackReaction`）

## 多帳戶與憑證

<AccordionGroup>
  <Accordion title="帳戶選擇與預設值">
    - 帳戶 ID 來自 `channels.whatsapp.accounts`
    - 預設帳戶選擇：若存在則使用 `default`，否則使用第一個已設定帳戶 ID（排序後）
    - 帳戶 ID 會在內部正規化以供查找

  </Accordion>

  <Accordion title="憑證路徑與舊版相容性">
    - 目前驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 備份檔案：`creds.json.bak`
    - 仍會辨識/遷移 `~/.openclaw/credentials/` 中的舊版預設驗證，以支援預設帳戶流程

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳戶的 WhatsApp 驗證狀態。

    當 Gateway 可連線時，登出會先停止所選帳戶的即時 WhatsApp 監聽器，讓連結的工作階段在下次重新啟動前不會繼續接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳戶設定之前停止即時監聽器。

    在舊版驗證目錄中，`oauth.json` 會被保留，而 Baileys 驗證檔案會被移除。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- Agent 工具支援包含 WhatsApp 反應動作（`react`）。
- 動作閘門：
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
    症狀：已連結帳戶反覆中斷連線或嘗試重新連線。

    安靜帳戶可以在一般訊息逾時後仍保持連線；當 WhatsApp Web 傳輸活動停止、socket 關閉，或應用程式層級活動在較長的安全視窗後仍保持靜默時，watchdog 會重新啟動。

    如果記錄顯示反覆出現 `status=408 Request Time-out Connection was lost`，請調整 `web.whatsapp` 下的 Baileys socket 時序。先將 `keepAliveIntervalMs` 縮短到低於網路的閒置逾時，並在緩慢或有封包遺失的連線上提高 `connectTimeoutMs`：

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

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 顯示 Gateway 與 WhatsApp 都健康，請執行 `openclaw doctor`。在 Linux 上，doctor 會警告仍在呼叫 `~/.openclaw/bin/ensure-whatsapp.sh` 的舊版 crontab 項目；請用 `crontab -e` 移除這些過期項目，因為 cron 可能缺少 systemd 使用者匯流排環境，並使舊腳本誤報 Gateway 健康狀態。

    如有需要，請使用 `channels login` 重新連結。

  </Accordion>

  <Accordion title="透過 Proxy 進行 QR 登入逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用 QR code 之前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 中斷連線。

    WhatsApp Web 登入會使用 Gateway 主機的標準 Proxy 環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體，以及 `NO_PROXY`）。請確認 Gateway 程序繼承了 Proxy 環境，且 `NO_PROXY` 不符合 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的監聽器">
    當目標帳戶沒有作用中的 Gateway 監聽器時，傳出傳送會快速失敗。

    請確認 Gateway 正在執行，且帳戶已連結。

  </Accordion>

  <Accordion title="回覆出現在 transcript 中，但未出現在 WhatsApp 中">
    Transcript 列會記錄 agent 產生的內容。WhatsApp 交付會另外檢查：OpenClaw 只有在 Baileys 至少為一個可見文字或媒體傳送回傳傳出訊息 ID 後，才會將自動回覆視為已傳送。

    Ack 反應是獨立的回覆前收據。成功的反應並不能證明後續文字或媒體回覆已被 WhatsApp 接受。

    請檢查 Gateway 記錄中是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外被忽略">
    請依此順序檢查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允許清單項目
    - 提及閘門（`requireMention` + 提及模式）
    - `openclaw.json` 中的重複鍵（JSON5）：較後的項目會覆寫較早的項目，因此每個作用域只保留一個 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    WhatsApp Gateway 執行階段應使用 Node。Bun 會被標記為不相容，無法穩定執行 WhatsApp/Telegram Gateway。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 透過 `groups` 和 `direct` map 支援適用於群組與直接聊天的 Telegram 風格系統提示。

群組訊息的解析階層：

有效的 `groups` map 會先被決定：如果帳戶定義了自己的 `groups`，它會完全取代根層 `groups` map（不進行深層合併）。接著，提示查找會在產生的單一 map 上執行：

1. **群組特定系統提示**（`groups["<groupId>"].systemPrompt`）：當特定群組項目存在於 map 中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用系統提示。
2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於 map 中，或存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析階層：

有效的 `direct` map 會先被決定：如果帳戶定義了自己的 `direct`，它會完全取代根層 `direct` map（不進行深層合併）。接著，提示查找會在產生的單一 map 上執行：

1. **直接聊天特定系統提示**（`direct["<peerId>"].systemPrompt`）：當特定對等項目存在於 map 中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用系統提示。
2. **直接聊天萬用字元系統提示**（`direct["*"].systemPrompt`）：當特定對等項目完全不存在於 map 中，或存在但未定義 `systemPrompt` 鍵時使用。

<Note>
`dms` 仍是輕量的每個 DM 歷史紀錄覆寫儲存區（`dms.<id>.historyLimit`）。提示覆寫位於 `direct` 之下。
</Note>

**與 Telegram 多帳號行為的差異：** 在 Telegram 中，多帳號設定會刻意對所有帳號抑制根層級 `groups`，即使是未定義自身 `groups` 的帳號也一樣，以防止機器人接收不屬於該帳號的群組訊息。WhatsApp 不會套用這項保護：只要帳號沒有定義帳號層級覆寫，無論設定了多少帳號，都一律會繼承根層級 `groups` 和根層級 `direct`。在多帳號 WhatsApp 設定中，如果你想要每個帳號各自使用群組或私訊提示，請在每個帳號下明確定義完整對應表，而不是依賴根層級預設值。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定對應表，也是聊天層級的群組允許清單。在根層級或帳號範圍中，`groups["*"]` 表示該範圍「允許所有群組」。
- 只有在你已經希望該範圍允許所有群組時，才加入萬用字元群組 `systemPrompt`。如果你仍然只想讓固定的一組群組 ID 符合資格，請不要使用 `groups["*"]` 作為提示預設值。請改為在每個明確列入允許清單的群組項目上重複設定該提示。
- 群組准入與傳送者授權是分開的檢查。`groups["*"]` 會擴大可進入群組處理流程的群組集合，但它本身不會授權那些群組中的每個傳送者。傳送者存取仍由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 分開控制。
- `channels.whatsapp.direct` 對 DM 沒有相同的副作用。`direct["*"]` 只會在 DM 已透過 `dmPolicy` 加上 `allowFrom` 或配對儲存規則准入後，提供預設的直接聊天設定。

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
