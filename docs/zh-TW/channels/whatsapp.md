---
read_when:
    - 處理 WhatsApp/網頁通道行為或收件匣路由
summary: WhatsApp 頻道支援、存取控制、傳送行為與維運作業
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T22:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffe2fce121dd1230fbcf20d55ec3855beb22c39f80b926eed41bf56183178ab2
    source_path: channels/whatsapp.md
    workflow: 16
---

狀態：透過 WhatsApp Web (Baileys) 已可用於生產環境。Gateway 擁有已連結的工作階段。

## 安裝（按需）

- Onboarding (`openclaw onboard`) 和 `openclaw channels add --channel whatsapp`
  會在你第一次選取 WhatsApp Plugin 時提示安裝。
- 當 Plugin 尚未存在時，`openclaw channels login --channel whatsapp` 也會提供安裝流程。
- 開發頻道 + git checkout：預設使用本機 Plugin 路徑。
- Stable/Beta：使用目前官方發行標籤上的 npm 套件 `@openclaw/whatsapp`。

仍可手動安裝：

```bash
openclaw plugins install @openclaw/whatsapp
```

使用裸套件名稱可跟隨目前的官方發行標籤。只有在你需要可重現安裝時，才釘選精確版本。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    未知傳送者的預設 DM 政策是配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
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

    針對特定帳號：

```bash
openclaw channels login --channel whatsapp --account work
```

    若要在登入前附加現有/自訂的 WhatsApp Web 驗證目錄：

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

  <Step title="核准第一個配對要求（若使用配對模式）">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配對要求會在 1 小時後過期。每個頻道的待處理要求上限為 3 個。

  </Step>
</Steps>

<Note>
OpenClaw 建議盡可能以獨立號碼執行 WhatsApp。（頻道中繼資料和設定流程已針對這種設定最佳化，但也支援個人號碼設定。）
</Note>

## 部署模式

<AccordionGroup>
  <Accordion title="專用號碼（建議）">
    這是最清楚的操作模式：

    - OpenClaw 使用獨立的 WhatsApp 身分
    - 更清楚的 DM allowlist 和路由邊界
    - 較不容易混淆自我聊天

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

    執行階段中，自我聊天保護會根據已連結的自身號碼和 `allowFrom` 判定。

  </Accordion>

  <Accordion title="僅限 WhatsApp Web 的頻道範圍">
    在目前的 OpenClaw 頻道架構中，訊息平台頻道是以 WhatsApp Web (`Baileys`) 為基礎。

    內建聊天頻道登錄中沒有獨立的 Twilio WhatsApp 訊息頻道。

  </Accordion>
</AccordionGroup>

## 執行階段模型

- Gateway 擁有 WhatsApp socket 和重新連線迴圈。
- 重新連線監看器使用 WhatsApp Web 傳輸活動，而不只看傳入應用程式訊息量，因此安靜的已連結裝置工作階段不會只因為最近沒有人傳送訊息就被重新啟動。較長的應用程式靜默上限仍會在傳輸框架持續抵達、但監看器視窗內沒有處理任何應用程式訊息時強制重新連線；對於最近活躍工作階段的暫時重新連線，該應用程式靜默檢查會在第一個復原視窗使用一般訊息逾時。
- Baileys socket 時序在 `web.whatsapp.*` 下明確設定：`keepAliveIntervalMs` 控制 WhatsApp Web 應用程式 ping，`connectTimeoutMs` 控制開啟握手逾時，`defaultQueryTimeoutMs` 控制 Baileys 查詢逾時。
- 傳出傳送需要目標帳號有作用中的 WhatsApp 監聽器。
- 狀態和廣播聊天會被忽略（`@status`、`@broadcast`）。
- 重新連線監看器會跟隨 WhatsApp Web 傳輸活動，而不只看傳入應用程式訊息量：只要傳輸框架持續，安靜的已連結裝置工作階段會保持上線，但傳輸停滯會在較晚的遠端中斷連線路徑之前強制重新連線。
- 直接聊天使用 DM 工作階段規則（`session.dmScope`；預設 `main` 會將 DM 收斂到代理程式主工作階段）。
- 群組工作階段會隔離（`agent:<agentId>:whatsapp:group:<jid>`）。
- WhatsApp 頻道/電子報可以用其原生 `@newsletter` JID 作為明確的傳出目標。傳出電子報傳送會使用頻道工作階段中繼資料（`agent:<agentId>:whatsapp:channel:<jid>`），而不是 DM 工作階段語意。
- WhatsApp Web 傳輸會遵循 Gateway 主機上的標準 Proxy 環境變數（`HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY` / 小寫變體）。優先使用主機層級 Proxy 設定，而不是頻道專屬的 WhatsApp Proxy 設定。
- 啟用 `messages.removeAckAfterReply` 時，OpenClaw 會在可見回覆送達後清除 WhatsApp ack reaction。

## Plugin hook 與隱私

WhatsApp 傳入訊息可能包含個人訊息內容、電話號碼、群組識別碼、傳送者名稱和工作階段關聯欄位。因此，除非你明確選擇加入，WhatsApp 不會將傳入的 `message_received` hook payload 廣播給 Plugin：

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

你可以將選擇加入範圍限制為單一帳號：

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
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 風格號碼（內部會正規化）。

    `allowFrom` 是 DM 傳送者存取控制清單。它不會限制明確傳送到 WhatsApp 群組 JID 或 `@newsletter` 頻道 JID 的傳出訊息。

    多帳號覆寫：`channels.whatsapp.accounts.<id>.dmPolicy`（以及 `allowFrom`）優先於該帳號的頻道層級預設值。

    執行階段行為細節：

    - 配對會保存在頻道 allow-store 中，並與設定的 `allowFrom` 合併
    - 排程自動化和 Heartbeat 收件者備援會使用明確的傳送目標或已設定的 `allowFrom`；DM 配對核准不會隱含成為 Cron 或 Heartbeat 收件者
    - 如果未設定 allowlist，預設允許已連結的自身號碼
    - OpenClaw 絕不會自動配對傳出的 `fromMe` DM（你從已連結裝置傳送給自己的訊息）

  </Tab>

  <Tab title="群組政策 + allowlist">
    群組存取有兩層：

    1. **群組成員 allowlist**（`channels.whatsapp.groups`）
       - 如果省略 `groups`，所有群組都符合資格
       - 如果存在 `groups`，它會作為群組 allowlist（允許 `"*"`）

    2. **群組傳送者政策**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：略過傳送者 allowlist
       - `allowlist`：傳送者必須符合 `groupAllowFrom`（或 `*`）
       - `disabled`：封鎖所有群組傳入訊息

    傳送者 allowlist 備援：

    - 如果未設定 `groupAllowFrom`，執行階段會在可用時退回使用 `allowFrom`
    - 會先評估傳送者 allowlist，再評估提及/回覆啟用

    注意：如果完全不存在 `channels.whatsapp` 區塊，即使已設定 `channels.defaults.groupPolicy`，執行階段群組政策備援仍會是 `allowlist`（並記錄警告）。

  </Tab>

  <Tab title="提及 + /activation">
    群組回覆預設需要提及。

    提及偵測包含：

    - 明確提及機器人身分的 WhatsApp mentions
    - 已設定的提及 regex 模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 授權群組訊息的傳入語音筆記轉錄
    - 隱含的回覆機器人偵測（回覆傳送者符合機器人身分）

    安全性注意事項：

    - 引用/回覆只會滿足提及閘控；它**不會**授予傳送者授權
    - 使用 `groupPolicy: "allowlist"` 時，即使非 allowlist 傳送者回覆 allowlist 使用者的訊息，仍會被封鎖

    工作階段層級啟用命令：

    - `/activation mention`
    - `/activation always`

    `activation` 會更新工作階段狀態（不是全域設定）。它受擁有者閘控。

  </Tab>
</Tabs>

## 個人號碼與自我聊天行為

當已連結的自身號碼也存在於 `allowFrom` 中時，WhatsApp 自我聊天防護會啟用：

- 略過自我聊天回合的已讀回條
- 忽略原本會 ping 自己的 mention-JID 自動觸發行為
- 如果未設定 `messages.responsePrefix`，自我聊天回覆預設為 `[{identity.name}]` 或 `[openclaw]`

## 訊息正規化與上下文

<AccordionGroup>
  <Accordion title="傳入封套 + 回覆上下文">
    傳入 WhatsApp 訊息會包裝在共用傳入封套中。

    如果存在引用回覆，上下文會以下列形式附加：

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    可用時也會填入回覆中繼資料欄位（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、傳送者 JID/E.164）。
    當引用回覆目標是可下載媒體時，OpenClaw 會透過一般傳入媒體儲存區儲存，並將其公開為 `MediaPath`/`MediaType`，讓代理程式可以檢查被參照的圖片，而不是只看到 `<media:image>`。

  </Accordion>

  <Accordion title="媒體預留位置與位置/聯絡人擷取">
    僅含媒體的傳入訊息會正規化為如下預留位置：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    授權群組語音筆記會在提及閘控之前轉錄；當本文只有 `<media:audio>` 時，在語音筆記中說出機器人提及即可觸發回覆。如果轉錄仍未提及機器人，轉錄會保留在待處理群組歷史中，而不是原始預留位置。

    位置本文使用簡短座標文字。位置標籤/留言和聯絡人/vCard 詳細資料會呈現為 fenced 不受信任中繼資料，而不是行內提示文字。

  </Accordion>

  <Accordion title="待處理群組歷史注入">
    對於群組，未處理的訊息可以被緩衝，並在機器人最後被觸發時作為上下文注入。

    - 預設限制：`50`
    - 設定：`channels.whatsapp.historyLimit`
    - 備援：`messages.groupChat.historyLimit`
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

    即使已全域啟用，與自己的聊天回合也會略過讀取回條。

  </Accordion>
</AccordionGroup>

## 傳送、分段與媒體

<AccordionGroup>
  <Accordion title="文字分段">
    - 預設分段限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式會優先使用段落邊界（空白行），再退回到長度安全的分段

  </Accordion>

  <Accordion title="傳出媒體行為">
    - 支援圖片、影片、音訊（PTT 語音訊息）與文件承載資料
    - 音訊媒體會透過 Baileys `audio` 承載資料並搭配 `ptt: true` 傳送，因此 WhatsApp 用戶端會將其呈現為按住說話的語音訊息
    - 回覆承載資料會保留 `audioAsVoice`；即使提供者回傳 MP3 或 WebM，WhatsApp 的 TTS 語音訊息輸出仍會走此 PTT 路徑
    - 原生 Ogg/Opus 音訊會以 `audio/ogg; codecs=opus` 傳送，以維持語音訊息相容性
    - 非 Ogg 音訊，包括 Microsoft Edge TTS 的 MP3/WebM 輸出，會先使用 `ffmpeg` 轉碼為 48 kHz 單聲道 Ogg/Opus，再進行 PTT 傳送
    - `/tts latest` 會將最新的助理回覆作為一則語音訊息傳送，並避免對同一則回覆重複傳送；`/tts chat on|off|default` 會控制目前 WhatsApp 聊天的自動 TTS
    - 傳送影片時，可透過 `gifPlayback: true` 支援動畫 GIF 播放
    - 傳送多媒體回覆承載資料時，字幕會套用到第一個媒體項目，但 PTT 語音訊息會先傳送音訊並另行傳送可見文字，因為 WhatsApp 用戶端不會一致地呈現語音訊息字幕
    - 媒體來源可以是 HTTP(S)、`file://` 或本機路徑

  </Accordion>

  <Accordion title="媒體大小限制與備援行為">
    - 傳入媒體儲存上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 傳出媒體傳送上限：`channels.whatsapp.mediaMaxMb`（預設 `50`）
    - 每個帳號覆寫使用 `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - 圖片會自動最佳化（調整大小／品質掃描）以符合限制
    - 媒體傳送失敗時，第一個項目的備援會傳送文字警告，而不是無聲地丟棄回應

  </Accordion>
</AccordionGroup>

## 回覆引用

WhatsApp 支援原生回覆引用，傳出回覆會明確引用傳入訊息。使用 `channels.whatsapp.replyToMode` 控制。

| 值          | 行為                                                                  |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | 永不引用；以純訊息傳送                                                |
| `"first"`   | 只引用第一個傳出回覆分段                                              |
| `"all"`     | 引用每個傳出回覆分段                                                  |
| `"batched"` | 引用佇列中的批次回覆，同時讓立即回覆不引用                            |

預設為 `"off"`。每個帳號覆寫使用 `channels.whatsapp.accounts.<id>.replyToMode`。

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

`channels.whatsapp.reactionLevel` 控制代理在 WhatsApp 上使用表情符號反應的廣泛程度：

| 層級          | Ack 反應 | 代理主動發起的反應 | 說明                                             |
| ------------- | -------- | ------------------ | ------------------------------------------------ |
| `"off"`       | 否       | 否                 | 完全沒有反應                                     |
| `"ack"`       | 是       | 否                 | 僅 Ack 反應（回覆前回條）                        |
| `"minimal"`   | 是       | 是（保守）         | Ack + 採用保守指引的代理反應                     |
| `"extensive"` | 是       | 是（鼓勵）         | Ack + 採用鼓勵指引的代理反應                     |

預設：`"minimal"`。

每個帳號覆寫使用 `channels.whatsapp.accounts.<id>.reactionLevel`。

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

WhatsApp 支援透過 `channels.whatsapp.ackReaction` 在收到傳入訊息時立即送出 Ack 反應。
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

行為注意事項：

- 在接受傳入訊息後立即傳送（回覆前）
- 失敗會被記錄，但不會阻擋一般回覆傳送
- 群組模式 `mentions` 會在由提及觸發的回合上反應；群組啟用 `always` 會作為此檢查的繞過
- WhatsApp 使用 `channels.whatsapp.ackReaction`（此處不使用舊版 `messages.ackReaction`）

## 多帳號與憑證

<AccordionGroup>
  <Accordion title="帳號選取與預設值">
    - 帳號 ID 來自 `channels.whatsapp.accounts`
    - 預設帳號選取：若存在則使用 `default`，否則使用第一個已設定的帳號 ID（排序後）
    - 帳號 ID 會在內部正規化以供查找

  </Accordion>

  <Accordion title="憑證路徑與舊版相容性">
    - 目前驗證路徑：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 備份檔案：`creds.json.bak`
    - 仍會辨識／遷移 `~/.openclaw/credentials/` 中的舊版預設驗證，以支援預設帳號流程

  </Accordion>

  <Accordion title="登出行為">
    `openclaw channels logout --channel whatsapp [--account <id>]` 會清除該帳號的 WhatsApp 驗證狀態。

    當 Gateway 可連線時，登出會先停止所選帳號的即時 WhatsApp 監聽器，讓已連結工作階段不會持續接收訊息直到下次重新啟動。`openclaw channels remove --channel whatsapp` 也會先停止即時監聽器，再停用或刪除帳號設定。

    在舊版驗證目錄中，`oauth.json` 會被保留，而 Baileys 驗證檔案會被移除。

  </Accordion>
</AccordionGroup>

## 工具、動作與設定寫入

- 代理工具支援包含 WhatsApp 反應動作（`react`）。
- 動作閘門：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 預設會啟用由通道發起的設定寫入（可透過 `channels.whatsapp.configWrites=false` 停用）。

## 疑難排解

<AccordionGroup>
  <Accordion title="尚未連結（需要 QR）">
    症狀：通道狀態回報尚未連結。

    修正：

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="已連結但已中斷連線／重新連線迴圈">
    症狀：已連結帳號反覆中斷連線或嘗試重新連線。

    安靜的帳號可以在一般訊息逾時後仍保持連線；當 WhatsApp Web 傳輸活動停止、socket 關閉，或應用程式層級活動在較長安全視窗外仍保持沉默時，watchdog 會重新啟動。

    如果日誌顯示重複的 `status=408 Request Time-out Connection was lost`，請調整 `web.whatsapp` 下的 Baileys socket 時序。先將 `keepAliveIntervalMs` 縮短到低於網路的閒置逾時，並在速度慢或不穩定的連線上增加 `connectTimeoutMs`：

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

    如果 `~/.openclaw/logs/whatsapp-health.log` 顯示 `Gateway inactive`，但 `openclaw gateway status` 和 `openclaw channels status --probe` 顯示 Gateway 與 WhatsApp 都正常，請執行 `openclaw doctor`。在 Linux 上，doctor 會警告仍呼叫 `~/.openclaw/bin/ensure-whatsapp.sh` 的舊版 crontab 項目；請使用 `crontab -e` 移除這些過時項目，因為 cron 可能缺少 systemd 使用者匯流排環境，導致該舊腳本誤報 Gateway 健康狀態。

    如有需要，請使用 `channels login` 重新連結。

  </Accordion>

  <Accordion title="在代理後方 QR 登入逾時">
    症狀：`openclaw channels login --channel whatsapp` 在顯示可用 QR code 前失敗，並出現 `status=408 Request Time-out` 或 TLS socket 中斷連線。

    WhatsApp Web 登入會使用 Gateway 主機的標準代理環境（`HTTPS_PROXY`、`HTTP_PROXY`、小寫變體，以及 `NO_PROXY`）。請確認 Gateway 程序繼承代理環境，且 `NO_PROXY` 不符合 `mmg.whatsapp.net`。

  </Accordion>

  <Accordion title="傳送時沒有作用中的監聽器">
    當目標帳號沒有作用中的 Gateway 監聽器時，傳出傳送會快速失敗。

    請確認 Gateway 正在執行，且帳號已連結。

  </Accordion>

  <Accordion title="回覆出現在逐字稿中，但未出現在 WhatsApp 中">
    逐字稿列會記錄代理產生的內容。WhatsApp 傳送會另外檢查：只有在 Baileys 對至少一次可見文字或媒體傳送回傳傳出訊息 ID 後，OpenClaw 才會將自動回覆視為已傳送。

    Ack 反應是獨立的回覆前回條。成功的反應不代表後續文字或媒體回覆已被 WhatsApp 接受。

    請檢查 Gateway 日誌是否有 `auto-reply delivery failed` 或 `auto-reply was not accepted by WhatsApp provider`。

  </Accordion>

  <Accordion title="群組訊息非預期地被忽略">
    請依此順序檢查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 允許清單項目
    - 提及閘控（`requireMention` + 提及模式）
    - `openclaw.json`（JSON5）中的重複鍵：後面的項目會覆寫前面的項目，因此每個範圍只保留一個 `groupPolicy`

  </Accordion>

  <Accordion title="Bun 執行階段警告">
    WhatsApp Gateway 執行階段應使用 Node。Bun 會被標示為不相容，無法穩定執行 WhatsApp/Telegram Gateway。
  </Accordion>
</AccordionGroup>

## 系統提示

WhatsApp 支援透過 `groups` 和 `direct` 對應表，為群組與直接聊天提供 Telegram 風格的系統提示。

群組訊息的解析階層：

會先決定有效的 `groups` 對應表：如果帳號定義自己的 `groups`，它會完全取代根層 `groups` 對應表（不做深度合併）。接著提示查找會在產生的單一對應表上執行：

1. **群組專屬系統提示**（`groups["<groupId>"].systemPrompt`）：當特定群組項目存在於對應表中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用系統提示。
2. **群組萬用字元系統提示**（`groups["*"].systemPrompt`）：當特定群組項目完全不存在於對應表中，或項目存在但未定義 `systemPrompt` 鍵時使用。

直接訊息的解析階層：

會先決定有效的 `direct` 對應表：如果帳號定義自己的 `direct`，它會完全取代根層 `direct` 對應表（不做深度合併）。接著提示查找會在產生的單一對應表上執行：

1. **直接聊天專屬系統提示**（`direct["<peerId>"].systemPrompt`）：當特定對等項目存在於對應表中，**且**其 `systemPrompt` 鍵已定義時使用。如果 `systemPrompt` 是空字串（`""`），萬用字元會被抑制，且不會套用系統提示。
2. **直接聊天萬用字元系統提示**（`direct["*"].systemPrompt`）：當特定對等項目完全不存在於對應表中，或項目存在但未定義 `systemPrompt` 鍵時使用。

<Note>
`dms` 仍是輕量的每個 DM 歷史記錄覆寫儲存區（`dms.<id>.historyLimit`）。提示覆寫位於 `direct` 下。
</Note>

**與 Telegram 多帳戶行為的差異：** 在 Telegram 中，多帳戶設定會刻意對所有帳戶抑制根層 `groups`，即使是未定義自身 `groups` 的帳戶也一樣，以防止 bot 接收其不屬於的群組訊息。WhatsApp 不套用這項防護：根層 `groups` 和根層 `direct` 一律會由未定義帳戶層級覆寫的帳戶繼承，不論設定了多少個帳戶。在多帳戶 WhatsApp 設定中，如果你想要每個帳戶各自使用群組或直接訊息提示，請在每個帳戶下明確定義完整對應表，而不是依賴根層預設值。

重要行為：

- `channels.whatsapp.groups` 同時是每個群組的設定對應表，也是聊天層級的群組允許清單。在根層或帳戶作用域中，`groups["*"]` 代表該作用域「允許所有群組」。
- 只有在你已經希望該作用域允許所有群組時，才加入萬用字元群組 `systemPrompt`。如果你仍然只想讓一組固定的群組 ID 符合資格，請不要使用 `groups["*"]` 作為提示預設值。請改為在每個明確允許的群組項目上重複該提示。
- 群組准入和傳送者授權是彼此分離的檢查。`groups["*"]` 會擴大可進入群組處理的群組集合，但它本身不會授權這些群組中的每個傳送者。傳送者存取仍然由 `channels.whatsapp.groupPolicy` 和 `channels.whatsapp.groupAllowFrom` 分別控制。
- `channels.whatsapp.direct` 對 DM 沒有相同的副作用。`direct["*"]` 只會在 DM 已經透過 `dmPolicy` 加上 `allowFrom` 或配對儲存規則被允許之後，提供預設的直接聊天設定。

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

高重要性的 WhatsApp 欄位：

- 存取：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 傳遞：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`、`reactionLevel`
- 多帳戶：`accounts.<id>.enabled`、`accounts.<id>.authDir`、帳戶層級覆寫
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
