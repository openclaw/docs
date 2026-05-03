---
read_when:
    - 開發 Telegram 功能或 Webhook
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-05-03T21:27:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 528ace9dae29eda22f98cc1436ec16146eb9d83edc73aa6db1ab8283f4f873c0
    source_path: channels/telegram.md
    workflow: 16
---

可用於生產環境，透過 grammY 支援機器人 DM 和群組。預設模式是長輪詢；Webhook 模式是選用的。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設 DM 政策是配對。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="Create the bot token in BotFather">
    開啟 Telegram 並與 **@BotFather** 對話（確認帳號代稱正是 `@BotFather`）。

    執行 `/newbot`，依照提示操作，並儲存 token。

  </Step>

  <Step title="Configure token and DM policy">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    環境變數備援：`TELEGRAM_BOT_TOKEN=...`（僅限預設帳號）。
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/環境變數中設定 token，然後啟動 gateway。

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>

  <Step title="Add the bot to a group">
    將機器人加入你的群組，然後設定 `channels.telegram.groups` 和 `groupPolicy`，以符合你的存取模型。
  </Step>
</Steps>

<Note>
Token 解析順序會感知帳號。實務上，設定值會優先於環境變數備援，而 `TELEGRAM_BOT_TOKEN` 只套用於預設帳號。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram 機器人預設使用**隱私模式**，這會限制它們可接收的群組訊息。

    如果機器人必須看到所有群組訊息，請擇一：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將機器人設為群組管理員。

    切換隱私模式時，請在每個群組中移除並重新加入機器人，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="Group permissions">
    管理員狀態是在 Telegram 群組設定中控制。

    管理員機器人會接收所有群組訊息，這對永遠啟用的群組行為很有用。

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` 用於允許/拒絕加入群組
    - `/setprivacy` 用於群組可見性行為

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（需要 `allowFrom` 中至少有一個傳送者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到機器人使用者名稱的 Telegram 帳號都能指揮機器人。只應將它用於有嚴格工具限制、刻意公開的機器人；單一擁有者機器人應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳號層級的 `allowFrom: ["*"]` 項目不會讓該帳號公開，除非合併後的有效帳號允許清單仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有 DM，並會被設定驗證拒絕。
    設定程序只會要求數字使用者 ID。
    如果你已升級且設定包含 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 來解析它們（盡力處理；需要 Telegram 機器人 token）。
    如果你之前依賴配對儲存的允許清單檔案，`openclaw doctor --fix` 可以在允許清單流程中將項目復原到 `channels.telegram.allowFrom`（例如當 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確數字 `allowFrom` ID，讓存取政策可持久保存在設定中（而不是依賴先前的配對核准）。

    常見混淆：DM 配對核准不代表 `this sender is authorized everywhere`。
    配對授予 DM 存取權。如果尚未有命令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅擁有者命令和 exec 核准具備明確的操作員帳號。
    群組傳送者授權仍來自明確設定的允許清單。
    如果你想要「我授權一次後，DM 和群組命令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅擁有者命令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（無第三方機器人）：

    1. DM 你的機器人。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（較不私密）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="Group policy and allowlists">
    兩項控制會一起套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都可通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為允許清單（明確 ID 或 `"*"`）

    2. **群組中允許哪些傳送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組傳送者篩選。如果未設定，Telegram 會回退到 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    不要將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 應放在 `channels.telegram.groups` 底下。
    非數字項目會在傳送者授權時被忽略。
    安全邊界（`2026.2.25+`）：群組傳送者驗證**不會**繼承 DM 配對儲存核准。
    配對僅限 DM。對於群組，請設定 `groupAllowFrom` 或每群組/每主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會回退到設定中的 `allowFrom`，而不是配對儲存。
    單一擁有者機器人的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，保持 `groupAllowFrom` 未設定，並在 `channels.telegram.groups` 底下允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，執行階段預設會以失敗關閉方式使用 `groupPolicy="allowlist"`，除非已明確設定 `channels.defaults.groupPolicy`。

    範例：允許一個特定群組中的任何成員：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    範例：只允許一個特定群組中的特定使用者：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      常見錯誤：`groupAllowFrom` 不是 Telegram 群組允許清單。

      - 將像 `-1001234567890` 這樣的負數 Telegram 群組或超級群組聊天 ID 放在 `channels.telegram.groups` 底下。
      - 當你想限制允許群組中哪些人可以觸發機器人時，將像 `8734062810` 這樣的 Telegram 使用者 ID 放在 `groupAllowFrom` 底下。
      - 只有在你想讓允許群組中的任何成員都能與機器人對話時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    群組回覆預設需要提及。

    提及可以來自：

    - 原生 `@botusername` 提及，或
    - 下列項目中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    工作階段層級命令切換：

    - `/activation always`
    - `/activation mention`

    這些只會更新工作階段狀態。使用設定以持久保存。

    持久設定範例：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    取得群組聊天 ID：

    - 將群組訊息轉寄到 `@userinfobot` / `@getidsbot`
    - 或從 `openclaw logs --follow` 讀取 `chat.id`
    - 或檢查 Bot API `getUpdates`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由 gateway 程序擁有。
- 路由是確定性的：Telegram 入站會回覆到 Telegram（模型不會選擇頻道）。
- 入站訊息會正規化為共用頻道信封，包含回覆中繼資料和媒體預留位置。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>` 以保持主題隔離。
- DM 訊息可以攜帶 `message_thread_id`；OpenClaw 會保留 thread ID 以供回覆，但預設會讓 DM 維持在扁平工作階段。當你刻意需要 DM 主題工作階段隔離時，請設定 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`，或相符的主題設定。
- 長輪詢使用 grammY runner，並具備每聊天/每執行緒排序。整體 runner sink 並行數使用 `agents.defaults.maxConcurrent`。
- 每個 gateway 程序內都會保護長輪詢，因此一次只有一個有效 poller 可以使用機器人 token。如果你仍看到 `getUpdates` 409 衝突，可能是另一個 OpenClaw gateway、腳本或外部 poller 正在使用同一個 token。
- 長輪詢 watchdog 重新啟動預設會在 120 秒沒有完成的 `getUpdates` 存活訊號後觸發。只有在你的部署於長時間執行工作期間仍看到誤判的輪詢停滯重新啟動時，才增加 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍是 `30000` 到 `600000`；支援每帳號覆寫。
- Telegram Bot API 沒有讀取回條支援（`sendReadReceipts` 不適用）。

## 功能參考

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（預設：`partial`）
    - `progress` 會保留一則可編輯的狀態草稿，並以工具進度更新它，直到最終傳遞
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用同一則已編輯的預覽訊息（預設：預覽串流啟用時為 `true`）
    - 舊版 `channels.telegram.streamMode` 和布林值 `streaming` 值會被偵測；執行 `openclaw doctor --fix` 可將它們遷移到 `channels.telegram.streaming.mode`

    工具進度預覽更新是在工具執行時顯示的短狀態列，例如命令執行、檔案讀取、規劃更新或修補摘要。Telegram 預設保持啟用這些更新，以符合 `v2026.4.22` 及後續版本發布的 OpenClaw 行為。若要保留答案文字的已編輯預覽，但隱藏工具進度列，請設定：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Use `streaming.mode: "off"` 僅在你想要只交付最終內容時使用：Telegram 預覽編輯會停用，一般工具/進度閒聊會被抑制，而不是以獨立狀態訊息傳送。核准提示、媒體承載內容和錯誤仍會透過一般最終交付路由。當你只想保留答案預覽編輯，同時隱藏工具進度狀態行時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 選取引用回覆是例外。當 `replyToMode` 為 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含選取的引用文字時，OpenClaw 會透過 Telegram 原生引用回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法顯示該回合的短狀態行。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引用回覆更重要時，請設定 `replyToMode: "off"`，或設定 `streaming.preview.toolProgress: false` 以確認此取捨。
    </Note>

    對於純文字回覆：

    - 簡短的 DM/群組/主題預覽：OpenClaw 會保留同一則預覽訊息，並在原處執行最終編輯，除非預覽出現後已傳送可見的非預覽訊息
    - 預覽後接著可見的非預覽輸出：OpenClaw 會將完成的回覆作為新的最終訊息傳送，並清理較舊的預覽，因此最終答案會出現在中間輸出之後
    - 超過約一分鐘的預覽：OpenClaw 會將完成的回覆作為新的最終訊息傳送，然後清理預覽，因此 Telegram 的可見時間戳會反映完成時間，而不是預覽建立時間

    對於複雜回覆（例如媒體承載內容），OpenClaw 會退回一般最終交付，然後清理預覽訊息。

    預覽串流與區塊串流彼此分離。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流以避免重複串流。

    僅限 Telegram 的推理串流：

    - `/reasoning stream` 會在產生期間將推理傳送到即時預覽
    - 最終答案傳送時不含推理文字

  </Accordion>

  <Accordion title="格式化與 HTML 後援">
    傳出文字使用 Telegram `parse_mode: "HTML"`。

    - 類似 Markdown 的文字會轉譯為 Telegram 安全的 HTML。
    - 原始模型 HTML 會被逸出，以降低 Telegram 解析失敗。
    - 如果 Telegram 拒絕已解析的 HTML，OpenClaw 會重試為純文字。

    連結預覽預設啟用，可使用 `channels.telegram.linkPreview: false` 停用。

  </Accordion>

  <Accordion title="原生命令與自訂命令">
    Telegram 命令選單註冊會在啟動時透過 `setMyCommands` 處理。

    原生命令預設值：

    - `commands.native: "auto"` 會為 Telegram 啟用原生命令

    新增自訂命令選單項目：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    規則：

    - 名稱會正規化（移除開頭的 `/`、轉為小寫）
    - 有效模式：`a-z`、`0-9`、`_`，長度 `1..32`
    - 自訂命令不能覆寫原生命令
    - 衝突/重複項目會略過並記錄

    注意事項：

    - 自訂命令只是選單項目；它們不會自動實作行為
    - 即使未顯示在 Telegram 選單中，plugin/skill 命令在輸入時仍可運作

    如果停用原生命令，內建命令會被移除。自訂/plugin 命令若已設定，仍可能註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍然溢出；請減少 plugin/skill/自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 命令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 因 `404: Not Found` 失敗時，可能表示 `channels.telegram.apiRoot` 被設定為完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只包含 Bot API 根目錄，且 `openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕已設定的 bot token。請使用目前的 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為 webhook 清理失敗。
    - `setMyCommands failed` 搭配網路/fetch 錯誤，通常表示到 `api.telegram.org` 的傳出 DNS/HTTPS 被封鎖。

    ### 裝置配對命令（`device-pair` plugin）

    安裝 `device-pair` plugin 時：

    1. `/pair` 會產生設定代碼
    2. 在 iOS app 中貼上代碼
    3. `/pair pending` 會列出待處理請求（包含角色/範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - 只有一個待處理請求時使用 `/pair approve`
       - `/pair approve latest` 用於最近的請求

    設定代碼會帶有短效 bootstrap token。內建 bootstrap 交接會讓主要節點 token 維持在 `scopes: []`；任何交接出的 operator token 都會限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。Bootstrap 範圍檢查會加上角色前綴，因此該 operator 允許清單只會滿足 operator 請求；非 operator 角色仍需要其自身角色前綴下的範圍。

    如果裝置以變更後的驗證詳細資料重試（例如角色/範圍/公開金鑰），先前待處理的請求會被取代，且新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

    更多詳細資料：[配對](/zh-TW/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="行內按鈕">
    設定行內鍵盤範圍：

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    每帳號覆寫：

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    範圍：

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（預設）

    舊版 `capabilities: ["inlineButtons"]` 會對應到 `inlineButtons: "all"`。

    訊息動作範例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    回呼點擊會作為文字傳遞給 agent：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="供 agent 和自動化使用的 Telegram 訊息動作">
    Telegram 工具動作包含：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作會公開符合使用習慣的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有獨立的 `channels.telegram.actions.*` 切換。
    執行階段傳送會使用作用中的設定/secret 快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆執行緒標籤">
    Telegram 支援在產生的輸出中使用明確的回覆執行緒標籤：

    - `[[reply_to_current]]` 會回覆觸發訊息
    - `[[reply_to:<id>]]` 會回覆特定的 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    啟用回覆執行緒，且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 會將原生引用文字限制在 1024 個 UTF-16 code unit，因此較長訊息會從開頭引用；如果 Telegram 拒絕引用，則退回純回覆。

    注意：`off` 會停用隱含的回覆執行緒。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與執行緒行為">
    論壇超級群組：

    - 主題 session key 會附加 `:topic:<threadId>`
    - 回覆與輸入中狀態會以主題執行緒為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入中動作仍會包含 `message_thread_id`

    主題繼承：主題項目會繼承群組設定，除非被覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題，不會從群組預設值繼承。

    **每主題 agent 路由**：每個主題都可以透過在主題設定中設定 `agentId` 路由到不同的 agent。這會讓每個主題擁有自己的隔離工作區、記憶和 session。範例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 一般主題 → 主要 agent
                "3": { agentId: "zu" },        // 開發主題 → zu agent
                "5": { agentId: "coder" }      // 程式碼審查 → coder agent
              }
            }
          }
        }
      }
    }
    ```

    接著每個主題都有自己的 session key：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 主題繫結**：論壇主題可以透過最上層具型別的 ACP 繫結來釘選 ACP harness session（`bindings[]` 搭配 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 這樣含主題限定的 id）。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP Agents](/zh-TW/tools/acp-agents)。

    **從聊天產生執行緒繫結 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP session；後續訊息會直接路由到該處。OpenClaw 會在主題中釘選產生確認。需要 `channels.telegram.threadBindings.spawnSessions` 保持啟用（預設：`true`）。

    範本上下文會公開 `MessageThreadId` 和 `IsForum`。具有 `message_thread_id` 的 DM 聊天預設會在扁平 session 上保留 DM 路由與回覆中繼資料；只有在設定 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true` 或相符的主題設定時，才會使用具執行緒感知的 session key。可使用最上層 `channels.telegram.dm.threadReplies` 作為帳號預設值，或對單一 DM 使用 `direct.<chatId>.threadReplies`。

  </Accordion>

  <Accordion title="音訊、影片和貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。

    - 預設：音訊檔案行為
    - 在 agent 回覆中使用標籤 `[[audio_as_voice]]` 以強制作為語音訊息傳送
    - 傳入語音訊息逐字稿會在 agent 上下文中被框定為機器產生、
      不受信任的文字；提及偵測仍會使用原始
      逐字稿，因此受提及閘控的語音訊息會繼續運作。

    訊息動作範例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 影片訊息

    Telegram 會區分影片檔案與影片訊息。

    訊息動作範例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    影片訊息不支援說明文字；提供的訊息文字會另外傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（預留位置 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖上下文字段：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    貼圖快取檔案：

    - `~/.openclaw/telegram/sticker-cache.json`

    貼圖會描述一次（可行時）並快取，以減少重複的視覺呼叫。

    啟用貼圖動作：

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    傳送貼圖動作：

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    搜尋已快取的貼圖：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="回應通知">
    Telegram 回應會以 `message_reaction` 更新傳入（與訊息 payload 分開）。

    啟用後，OpenClaw 會將系統事件排入佇列，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示只處理使用者對機器人所傳訊息的回應（透過已傳訊息快取盡力判斷）。
    - 回應事件仍遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被捨棄。
    - Telegram 不會在回應更新中提供討論串 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組的一般主題工作階段（`:topic:1`），而不是確切的原始主題

    輪詢/Webhook 的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack 回應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認 emoji。

    解析順序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分 emoji 備援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 unicode emoji（例如 "👀"）。
    - 使用 `""` 可停用某個頻道或帳號的回應。

  </Accordion>

  <Accordion title="來自 Telegram 事件與命令的設定寫入">
    預設啟用頻道設定寫入（`configWrites !== false`）。

    Telegram 觸發的寫入包括：

    - 群組遷移事件（`migrate_to_chat_id`），用於更新 `channels.telegram.groups`
    - `/config set` 與 `/config unset`（需要啟用命令）

    停用：

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="長輪詢與 Webhook">
    預設為長輪詢。若要使用 Webhook 模式，請設定 `channels.telegram.webhookUrl` 與 `channels.telegram.webhookSecret`；選用的 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本機監聽器會繫結到 `127.0.0.1:8787`。若要公開入口，可以在本機連接埠前方放置反向代理，或有意設定 `webhookHost: "0.0.0.0"`。

    Webhook 模式會在回傳 `200` 給 Telegram 前，驗證請求防護、Telegram 秘密權杖與 JSON 主體。
    接著 OpenClaw 會透過與長輪詢相同的每聊天/每主題機器人通道非同步處理更新，因此緩慢的代理回合不會佔住 Telegram 的送達 ACK。

  </Accordion>

  <Accordion title="限制、重試與 CLI 目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會在依長度拆分前優先使用段落邊界（空白行）。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入與傳出 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其派送為一則傳入訊息前緩衝多久。如果相簿部分較晚抵達，請增加此值；若要降低相簿回覆延遲，請減少此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，會套用 grammY 預設值）。機器人用戶端會將低於 60 秒傳出文字/輸入中請求防護的設定值限制在該防護以下，讓 grammY 不會在 OpenClaw 的傳輸防護與備援執行前中止可見回覆送達。長輪詢仍使用 45 秒的 `getUpdates` 請求防護，因此閒置輪詢不會無限期被放棄。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；只有在輪詢停滯重新啟動發生誤判時，才在 `30000` 到 `600000` 之間調整。
    - 群組上下文歷史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 回覆/引用/轉發的補充上下文目前會依收到的內容傳遞。
    - Telegram 允許清單主要用來限制誰可以觸發代理，不是完整的補充上下文遮蔽邊界。
    - 私訊歷史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用於 Telegram 傳送輔助程式（CLI/工具/動作）中可復原的傳出 API 錯誤。傳入最終回覆送達也會針對 Telegram 預連線失敗使用有界限的安全傳送重試，但不會重試可能重複可見訊息的模稜兩可送出後網路信封。

    CLI 傳送目標可以是數字聊天 ID 或使用者名稱：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 投票使用 `openclaw message poll`，並支援論壇主題：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 專用投票旗標：

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - 在 `channels.telegram.capabilities.inlineButtons` 允許時，搭配 `buttons` 區塊的 `--presentation` 可用於行內鍵盤
    - 當機器人能在該聊天中釘選時，使用 `--pin` 或 `--delivery '{"pin":true}'` 請求釘選送達
    - 使用 `--force-document` 將傳出圖片與 GIF 作為文件傳送，而不是壓縮相片或動畫媒體上傳

    動作控管：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用 Telegram 投票建立，但保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中的執行核准，也可選擇在原始聊天或主題中張貼提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（至少可解析一位核准者時自動啟用）
    - `channels.telegram.execApprovals.approvers`（備援使用 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（預設）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 與 `defaultTo` 控制誰可以與機器人交談，以及它會在哪裡傳送一般回覆。它們不會讓某人成為執行核准者。當尚未存在命令擁有者時，第一個已核准的私訊配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，而不必在 `execApprovals.approvers` 下重複 ID。

    頻道送達會在聊天中顯示命令文字；只在可信任的群組/主題中啟用 `channel` 或 `both`。當提示落在論壇主題中時，OpenClaw 會為核准提示與後續訊息保留該主題。執行核准預設會在 30 分鐘後過期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過 Plugin 核准解析；其他則會先透過執行核准解析。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到送達或供應商錯誤時，Telegram 可以回覆錯誤文字或抑制該文字。兩個設定鍵控制此行為：

| 鍵                                  | 值                | 預設值  | 說明                                                                                         |
| ----------------------------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 會向聊天傳送友善的錯誤訊息。`silent` 會完全抑制錯誤回覆。                           |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 對同一聊天的錯誤回覆之間的最短時間。可避免中斷期間出現錯誤訊息洗版。                       |

支援每帳號、每群組與每主題覆寫（繼承方式與其他 Telegram 設定鍵相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## 疑難排解

<AccordionGroup>
  <Accordion title="機器人不回應未提及的群組訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather：`/setprivacy` -> Disable
      - 然後移除機器人並重新加入群組
    - 當設定預期未提及的群組訊息時，`openclaw channels status` 會警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法探測成員資格。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列入清單（或包含 `"*"`）
    - 驗證機器人在群組中的成員資格
    - 檢視記錄：使用 `openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授權你的傳送者身分（配對和/或數字 `allowFrom`）
    - 即使群組政策為 `open`，仍會套用命令授權
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生命令選單項目過多；請減少 Plugin/Skill/自訂命令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入中呼叫都有界限，且會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續的網路/fetch 錯誤通常表示到 `api.telegram.org` 的 DNS/HTTPS 可達性問題

  </Accordion>

  <Accordion title="啟動回報未授權權杖">

    - `getMe returned 401` 是已設定 bot token 的 Telegram 驗證失敗。
    - 在 BotFather 中重新複製或重新產生 bot token，然後為預設帳戶更新 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將它視為「不存在 Webhook」只會把同一個錯誤 token 失敗延後到後續 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - Node 22+ 搭配自訂 fetch/proxy 時，如果 AbortSignal 型別不相符，可能會觸發立即中止行為。
    - 有些主機會先將 `api.telegram.org` 解析為 IPv6；故障的 IPv6 對外連線可能造成間歇性的 Telegram API 失敗。
    - 如果記錄包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些錯誤作為可復原的網路錯誤重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此執行器在第一次 `getUpdates` 前不需要第二次 `getMe`。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤失敗，OpenClaw 會繼續進入長輪詢，而不是再發出另一個輪詢前的控制平面呼叫。仍然啟用中的 Webhook 會以 `getUpdates` 衝突呈現；OpenClaw 接著會重建 Telegram 傳輸並重試 Webhook 清理。
    - 如果 Telegram socket 以短固定週期回收，請檢查是否有過低的 `channels.telegram.timeoutSeconds`；bot client 會將低於對外和 `getUpdates` 請求防護值的設定值箝制住，但較舊版本在該值低於這些防護時，可能每次輪詢或回覆都會中止。
    - 如果記錄包含 `Polling stall detected`，OpenClaw 預設會在 120 秒內沒有完成的長輪詢存活訊號後，重新啟動輪詢並重建 Telegram 傳輸。
    - `openclaw channels status --probe` 和 `openclaw doctor` 會在執行中的輪詢帳戶未於啟動寬限期後完成 `getUpdates`、執行中的 Webhook 帳戶未於啟動寬限期後完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過期時提出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫正常，但你的主機仍回報誤判的輪詢停滯重啟時，才增加 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 對外連線問題。
    - Telegram 也會遵循 Bot API 傳輸的程序 proxy 環境變數，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可略過 `api.telegram.org`。
    - 如果服務環境透過 `OPENCLAW_PROXY_URL` 設定 OpenClaw 管理的 proxy，且沒有標準 proxy 環境變數，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接對外連線/TLS 不穩定的 VPS 主機上，透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`，接著是 `channels.telegram.network.dnsResultOrder`，再來是程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不適用，Node 22+ 會退回到 `ipv4first`。
    - 如果你的主機是 WSL2，或明確以僅 IPv4 行為運作得更好，請強制 family 選擇：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark 範圍答案（`198.18.0.0/15`）預設已允許用於 Telegram 媒體下載。如果可信任的假 IP 或透明 proxy 在媒體下載期間將 `api.telegram.org` 重寫為其他私人/內部/特殊用途位址，你可以選擇加入僅限 Telegram 的繞過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 每個帳戶也可在
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      使用相同的選擇加入。
    - 如果你的 proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先讓危險旗標保持關閉。Telegram 媒體預設已允許 RFC 2544 benchmark 範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 防護。只有在可信任且由操作員控制的 proxy 環境中才使用，例如 Clash、Mihomo 或 Surge 假 IP 路由，且它們會合成 RFC 2544 benchmark
      範圍以外的私人或特殊用途答案。正常公開網際網路 Telegram 存取應保持關閉。
    </Warning>

    - 環境覆寫（暫時）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 驗證 DNS 答案：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多協助：[Channel 疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="高訊號 Telegram 欄位">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- exec 核准：`execApprovals`、`accounts.*.execApprovals`
- 命令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒/回覆：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/傳遞：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅限 Bot API 根目錄；不要包含 `/bot<TOKEN>`）
- Webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 反應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入/歷史記錄：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳戶優先順序：設定兩個以上帳戶 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`），讓預設路由明確。否則 OpenClaw 會退回到第一個正規化帳戶 ID，且 `openclaw doctor` 會提出警告。具名帳戶會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到 Gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組和主題 allowlist 行為。
  </Card>
  <Card title="Channel 路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到 agent。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型和強化。
  </Card>
  <Card title="多 agent 路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組和主題對應到 agent。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨 channel 診斷。
  </Card>
</CardGroup>
