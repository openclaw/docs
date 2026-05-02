---
read_when:
    - 處理 WhatsApp/網頁頻道行為或收件匣路由
summary: WhatsApp 通道支援、存取控制、傳遞行為與操作
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:42:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：透過 WhatsApp Web (Baileys) 已可用於正式環境。Gateway 擁有已連結的工作階段。

## 安裝（按需）

- Onboarding (`openclaw onboard`) 與 `openclaw channels add --channel whatsapp`
  會在你第一次選取 WhatsApp Plugin 時提示安裝。
- 當 Plugin 尚未存在時，`openclaw channels login --channel whatsapp` 也會提供安裝流程。
- Dev channel + git checkout：預設使用本機 Plugin 路徑。
- Stable/Beta：當目前套件已發布時，使用 npm 套件 `@openclaw/whatsapp`。

手動安裝仍可使用：

```bash
openclaw plugins install @openclaw/whatsapp
```

如果 npm 回報 OpenClaw 擁有的套件已棄用或不存在，請使用目前封裝的 OpenClaw 建置，或使用本機 checkout，直到 npm 套件列車跟上。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    未知傳送者的預設 DM 政策為配對。
  </Card>
  <Card title="Channel 疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨 Channel 診斷與修復手冊。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整 Channel 設定模式與範例。
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

  <Step title="連結 WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

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

  <Step title="啟動 Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="核准第一個配對請求（若使用配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對請求會在 1 小時後過期。每個 Channel 的待處理請求上限為 3 個。

  </Step>
</Steps>

<Note>
OpenClaw 建議在可行情況下使用獨立號碼執行 WhatsApp。（Channel 中繼資料與設定流程已針對該設定最佳化，但也支援個人號碼設定。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    這是最乾淨的作業模式：

    - 為 OpenClaw 使用獨立的 WhatsApp 身分
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
    Onboarding 支援個人號碼模式，並寫入適合自我聊天的基準設定：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的個人號碼
    - `selfChatMode: true`

    在執行階段，自我聊天保護會以已連結的自身號碼與 `allowFrom` 為依據。

  </Accordion>

  <Accordion title="僅限 WhatsApp Web 的 Channel 範圍">
    目前 OpenClaw Channel 架構中的訊息平台 Channel 是以 WhatsApp Web (`Baileys`) 為基礎。

    內建聊天 Channel 登錄中沒有獨立的 Twilio WhatsApp 訊息 Channel。

  </Accordion>
</AccordionGroup>

## 執行階段模型

- Gateway 擁有 WhatsApp socket 與重新連線迴圈。
- 重新連線 watchdog 使用 WhatsApp Web 傳輸活動，而不只依賴傳入的應用程式訊息量，因此安靜的已連結裝置工作階段不會只因為最近沒有人傳送訊息就被重新啟動。若傳輸框架持續抵達但在 watchdog 視窗內未處理任何應用程式訊息，較長的應用程式靜默上限仍會強制重新連線；對最近曾活躍的工作階段進行暫時性重新連線後，該應用程式靜默檢查會在第一個復原視窗使用一般訊息逾時。
- Baileys socket 計時在 `web.whatsapp.*` 下明確設定：`keepAliveIntervalMs` 控制 WhatsApp Web 應用程式 ping，`connectTimeoutMs` 控制開啟握手逾時，而 `defaultQueryTimeoutMs` 控制 Baileys 查詢逾時。
- 對外傳送需要目標帳號有啟用中的 WhatsApp listener。
- 狀態與廣播聊天會被忽略（`@status`、`@broadcast`）。
- 重新連線 watchdog 會跟隨 WhatsApp Web 傳輸活動，而不只依賴傳入的應用程式訊息量：只要傳輸框架持續，安靜的已連結裝置工作階段就會保持在線，但傳輸停滯會遠早於較晚的遠端中斷路徑而強制重新連線。
- 直接聊天使用 DM 工作階段規則（`session.dmScope`；預設 `main` 會將 DM 收斂到 agent main 工作階段）。
- 群組工作階段會隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp Channels/Newsletters 可使用其原生 `@newsletter` JID 作為明確的對外目標。對外 newsletter 傳送使用 Channel 工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而不是 DM 工作階段語意。
- WhatsApp Web 傳輸會遵守 Gateway 主機上的標準 proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小寫變體）。優先使用主機層級 proxy 設定，而不是 Channel 專用 WhatsApp proxy 設定。
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

你可以將選擇加入範圍限定到一個帳號：

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

只有在你信任 Plugin 可接收傳入 WhatsApp 訊息內容與識別碼時，才啟用此設定。

## 存取控制與啟用

<Tabs>
  <Tab title="DM 政策">
    `channels.whatsapp.dmPolicy` 控制直接聊天存取：

    - `pairing`（預設）
    - `allowlist`
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 風格的號碼（內部會正規化）。

    `allowFrom` 是 DM 傳送者存取控制清單。它不會限制對 WhatsApp 群組 JID 或 `@newsletter` Channel JID 的明確對外傳送。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）會優先於該帳號的 Channel 層級預設值。

    執行階段行為詳細資料：

    - 配對會保存在 Channel allow-store 中，並與設定的 `allowFrom` 合併
    - 排程自動化與 Heartbeat 收件者備援會使用明確的遞送目標或設定的 `allowFrom`；DM 配對核准不會隱含成為 Cron 或 Heartbeat 收件者
    - 如果未設定允許清單，預設允許已連結的自身號碼
    - OpenClaw 絕不會自動配對對外 `fromMe` DM（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策 + 允許清單">
    群組存取有兩層：

    1. **群組成員允許清單** (`channels.whatsapp.groups`)
       - 如果省略 `groups`，所有群組都符合資格
       - 如果存在 `groups`，它會作為群組允許清單（允許 `"*"`）

    2. **群組傳送者政策** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`：略過傳送者允許清單
       - `allowlist`：傳送者必須符合 `groupAllowFrom`（或 `*`）
       - `disabled`：封鎖所有群組傳入

    傳送者允許清單備援：

    - 如果未設定 `groupAllowFrom`，執行階段會在可用時退回使用 `allowFrom`
    - 傳送者允許清單會在提及/回覆啟用之前評估

    注意：如果完全不存在 `channels.whatsapp` 區塊，執行階段群組政策備援為 `allowlist`（並記錄警告），即使已設定 `channels.defaults.groupPolicy` 也是如此。

  </Tab>

  <Tab title="提及 + /activation">
    群組回覆預設需要提及。

    提及偵測包含：

    - 明確提及 bot 身分的 WhatsApp mention
    - 設定的 mention regex pattern（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 授權群組訊息的傳入語音備忘錄轉錄
    - 隱含的回覆 bot 偵測（回覆傳送者符合 bot 身分）

    安全性注意事項：

    - quote/reply 只會滿足提及 gate；它**不會**授予傳送者授權
    - 使用 `groupPolicy: "allowlist"` 時，即使非允許清單中的傳送者回覆允許清單使用者的訊息，仍會被封鎖

    工作階段層級啟用命令：

    - `/activation mention`
    - `/activation always`

    `activation` 會更新工作階段狀態（不是全域設定）。它受擁有者 gate 限制。

  </Tab>
</Tabs>

## 個人號碼與自我聊天行為

當已連結的自身號碼也存在於 `allowFrom` 中時，WhatsApp 自我聊天保護會啟用：

- 跳過自我聊天輪次的已讀回條
- 忽略原本會 ping 你自己的 mention-JID 自動觸發行為
- 如果未設定 `messages.responsePrefix`，自我聊天回覆預設為 `[{identity.name}]` 或 `[openclaw]`

## 訊息正規化與情境

<AccordionGroup>
  <Accordion title="傳入信封 + 回覆情境">
    傳入 WhatsApp 訊息會包裝在共享的傳入信封中。

    如果存在引用回覆，情境會以下列形式附加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時也會填入回覆中繼資料欄位（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。
    當引用回覆目標是可下載媒體時，OpenClaw 會透過一般傳入媒體儲存區保存它，並將其公開為 `MediaPath`/`MediaType`，讓 agent 能檢查被參照的圖片，而不是只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒體 placeholder 與位置/聯絡人擷取">
    僅含媒體的傳入訊息會正規化為下列 placeholder：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    當 body 只有 `<media:audio>` 時，授權群組語音備忘錄會在提及 gate 前先轉錄，因此在語音備忘錄中說出 bot 提及即可觸發回覆。如果轉錄仍未提及 bot，轉錄會保留在待處理群組歷史中，而不是原始 placeholder。

    位置 body 使用簡短座標文字。位置標籤/註解與聯絡人/vCard 詳細資料會呈現為 fenced 不受信任中繼資料，而非 inline prompt text。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    對於群組，未處理的訊息可以被緩衝，並在 bot 最終被觸發時作為情境注入。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`
    - 備援：`messages.groupChat.historyLimit`
    - `0` 停用

    注入標記：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="已讀回條">
    接受的傳入 WhatsApp 訊息預設啟用已讀回條。

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

    即使全域啟用，與自己的聊天回合也會略過已讀回執。

  </Accordion>
</AccordionGroup>

## 傳送、分塊與媒體

<AccordionGroup>
  <Accordion title="文字分塊">
    - 預設分塊限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式會優先使用段落邊界（空白行），再退回長度安全的分塊方式

  </Accordion>

  <Accordion title="對外媒體行為">
    - 支援圖片、影片、音訊（PTT 語音備註）與文件 payload
    - 音訊媒體會透過 Baileys `audio` payload 並搭配 `ptt: true` 傳送，因此 WhatsApp 用戶端會將其呈現為按住說話的語音備註
    - 回覆 payload 會保留 `audioAsVoice`；即使提供者回傳 MP3 或 WebM，WhatsApp 的 TTS 語音備註輸出仍會留在這條 PTT 路徑上
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送，以相容語音備註
    - 非 Ogg 音訊，包括 Microsoft Edge TTS MP3/WebM 輸出，會在 PTT 傳送前用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus
    - `/tts latest` 會將最新的助理回覆作為一則語音備註傳送，並抑制同一則回覆的重複傳送；`/tts chat on|off|default` 會控制目前 WhatsApp 聊天的自動 TTS
    - 透過影片傳送時設定 `gifPlayback: true`，即可支援動畫 GIF 播放
    - 傳送多媒體回覆 payload 時，標題會套用到第一個媒體項目；但 PTT 語音備註會先傳送音訊，再分開傳送可見文字，因為 WhatsApp 用戶端不會穩定呈現語音備註標題
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與備援行為">
    - 傳入媒體儲存上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 對外媒體傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每個帳號的覆寫使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小／品質掃描）以符合限制
    - 媒體傳送失敗時，第一項目備援會傳送文字警告，而不是靜默丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

WhatsApp 支援原生回覆引用，對外回覆會明顯引用傳入訊息。使用 `channels.whatsapp.replyToMode` 控制。

| 值          | 行為                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；以純訊息傳送                                                |
| `"first"`   | 只引用第一個對外回覆分塊                                              |
| `"all"`     | 引用每個對外回覆分塊                                                  |
| `"batched"` | 引用已排入佇列的批次回覆，但讓即時回覆不引用                          |

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

`channels.whatsapp.reactionLevel` 控制 agent 在 WhatsApp 上使用 emoji 反應的範圍：

| 層級          | 確認反應 | Agent 主動發起的反應 | 說明                                             |
| ------------- | -------- | -------------------- | ------------------------------------------------ |
| `"off"`       | 否       | 否                   | 完全不使用反應                                   |
| `"ack"`       | 是       | 否                   | 僅確認反應（回覆前回執）                         |
| `"minimal"`   | 是       | 是（保守）           | 確認 + 依保守指引的 agent 反應                   |
| `"extensive"` | 是       | 是（鼓勵）           | 確認 + 依鼓勵指引的 agent 反應                   |

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

## 確認反應

WhatsApp 支援透過 `channels.whatsapp.ackReaction` 在收到傳入訊息時立即傳送確認反應。
確認反應受 `reactionLevel` 控制，當 `reactionLevel` 為 `"off"` 時會被抑制。

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
- 失敗會被記錄，但不會阻擋一般回覆傳送
- 群組模式 `mentions` 會在提及觸發的回合中反應；群組啟用 `always` 會作為略過此檢查的旁路
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此處不使用舊版 `messages.ackReaction`）

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
    - 仍會辨識／遷移 `~/.openclaw/credentials/` 中的舊版預設驗證，以支援預設帳號流程

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。

    當 Gateway 可連線時，登出會先停止所選帳號的即時 WhatsApp 監聽器，讓已連結的工作階段不會在下次重新啟動前持續接收訊息。`openclaw channels remove --channel whatsapp` 也會在停用或刪除帳號設定前，先停止即時監聽器。

    在舊版驗證目錄中，`oauth.json` 會被保留，而 Baileys 驗證檔案會被移除。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- Agent 工具支援包括 WhatsApp 反應動作（`react`）。
- 動作閘門：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 預設啟用由通道發起的設定寫入（可透過 `channels.whatsapp.configWrites=false` 停用）。

## 疑難排解

<AccordionGroup>
  <Accordion title="未連結（需要 QR）">
    症狀：通道狀態回報未連結。

    修正：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已連結但中斷連線／重新連線迴圈">
    症狀：已連結帳號反覆中斷連線或嘗試重新連線。

    安靜帳號可以在一般訊息逾時後仍保持連線；當 WhatsApp Web 傳輸活動停止、socket 關閉，或應用程式層級活動沉默超過較長的安全視窗時，watchdog 會重新啟動。

    如果日誌顯示重複的 `status=408 Request Time-out Connection was lost`，請在 `web.whatsapp` 底下調整 Baileys socket 時序。先將 `keepAliveIntervalMs` 縮短到低於你的網路閒置逾時，並在較慢或易遺失封包的連線上提高 `connectTimeoutMs`：

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

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 與 `openclaw channels status --probe` 顯示 gateway 和 WhatsApp 都健康，請執行 `openclaw doctor`。在 Linux 上，doctor 會警告仍呼叫 `~/.openclaw/bin/ensure-whatsapp.sh` 的舊版 crontab 項目；請用 `crontab -e` 移除這些過時項目，因為 cron 可能缺少 systemd user-bus 環境，導致該舊腳本誤報 gateway 健康狀態。

    如有需要，請用 `channels login` 重新連結。

  </Accordion>

  <Accordion title="透過代理時 QR 登入逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用 QR code 前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 中斷連線。

    WhatsApp Web 登入會使用 gateway 主機的標準代理環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體與 `NO_PROXY`）。請確認 gateway 程序有繼承代理 env，且 `NO_PROXY` 不會符合 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的監聽器">
    當目標帳號沒有作用中的 gateway 監聽器時，對外傳送會快速失敗。

    請確認 gateway 正在執行且帳號已連結。

  </Accordion>

  <Accordion title="回覆出現在 transcript 中，但沒有出現在 WhatsApp">
    Transcript 列會記錄 agent 產生的內容。WhatsApp 傳送會另外檢查：只有在 Baileys 為至少一個可見文字或媒體傳送回傳對外訊息 ID 後，OpenClaw 才會將自動回覆視為已傳送。

    確認反應是獨立的回覆前回執。成功的反應不代表之後的文字或媒體回覆已被 WhatsApp 接受。

    請檢查 gateway 日誌中的 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息意外被忽略">
    請依此順序檢查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` allowlist 項目
    - 提及閘門（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重複鍵：後面的項目會覆寫前面的項目，因此每個範圍只保留一個 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    WhatsApp gateway 執行階段應使用 Node。Bun 被標記為不相容於穩定的 WhatsApp/Telegram gateway 操作。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 支援透過 `groups` 與 `direct` map，為群組與直接聊天提供 Telegram 風格的系統提示。

群組訊息的解析階層：

會先決定有效的 `groups` map：如果帳號定義了自己的 `groups`，它會完整取代根層級的 `groups` map（不做深層合併）。接著會在產生的單一 map 上執行提示查找：

1. **群組專屬系統提示**（`groups["<groupId>"].systemPrompt`）：當 map 中存在特定群組項目，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用任何系統提示。
2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於 map 中，或存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析階層：

會先決定有效的 `direct` map：如果帳號定義了自己的 `direct`，它會完整取代根層級的 `direct` map（不做深層合併）。接著會在產生的單一 map 上執行提示查找：

1. **直接聊天專屬系統提示**（`direct["<peerId>"].systemPrompt`）：當 map 中存在特定對等方項目，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用任何系統提示。
2. **直接聊天萬用字元系統提示**（`direct["*"].systemPrompt`）：當特定對等方項目完全不存在於 map 中，或存在但未定義 `systemPrompt` 鍵時使用。

<Note>
`dms` 仍是輕量級的每個 DM 歷史覆寫 bucket（`dms.<id>.historyLimit`）。提示覆寫位於 `direct` 底下。
</Note>

**與 Telegram 多帳號行為的差異：** 在 Telegram 中，多帳號設定會刻意對所有帳號抑制根層級的 `groups`，即使帳號本身沒有定義任何 `groups` 也一樣，以防止機器人接收其不屬於之群組的群組訊息。WhatsApp 不會套用這項防護：根層級的 `groups` 與根層級的 `direct` 一律會由未定義帳號層級覆寫的帳號繼承，不論設定了多少個帳號。在多帳號 WhatsApp 設定中，如果你想要每個帳號各自使用群組或直接聊天提示，請在每個帳號底下明確定義完整對應表，而不是依賴根層級預設值。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定對應表，也是聊天層級的群組允許清單。在根層級或帳號範圍中，`groups["*"]` 表示該範圍「允許所有群組」。
- 只有在你已經希望該範圍允許所有群組時，才加入萬用字元群組 `systemPrompt`。如果你仍然只想讓固定的一組群組 ID 符合資格，請不要使用 `groups["*"]` 作為提示預設值。請改為在每個明確允許清單中的群組項目上重複該提示。
- 群組准入與傳送者授權是分開檢查的。`groups["*"]` 會擴大可進入群組處理流程的群組集合，但它本身不會授權那些群組中的每位傳送者。傳送者存取權仍由 `channels.whatsapp.groupPolicy` 與 `channels.whatsapp.groupAllowFrom` 分別控制。
- `channels.whatsapp.direct` 對私訊沒有相同的副作用。`direct["*"]` 只會在私訊已由 `dmPolicy` 加上 `allowFrom` 或配對儲存規則准入之後，提供預設的直接聊天設定。

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

高價值 WhatsApp 欄位：

- 存取：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 傳遞：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多帳號：`accounts.<id>.enabled`、`accounts.<id>.authDir`、帳號層級覆寫
- 營運：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`、`web.whatsapp.*`
- 工作階段行為：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`
- 提示：`groups.<id>.systemPrompt`、`groups["*"].systemPrompt`、`direct.<id>.systemPrompt`、`direct["*"].systemPrompt`

## 相關

- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [安全性](/zh-TW/gateway/security)
- [Channel routing](/zh-TW/channels/channel-routing)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [疑難排解](/zh-TW/channels/troubleshooting)
