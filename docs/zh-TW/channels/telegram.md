---
read_when:
    - 開發 Telegram 功能或 Webhook
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-05-02T20:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

透過 grammY，已可用於生產環境中的機器人 DM 和群組。預設模式是長輪詢；Webhook 模式是選用的。

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
    開啟 Telegram 並與 **@BotFather** 聊天（確認帳號名稱完全是 `@BotFather`）。

    執行 `/newbot`，依照提示操作，並儲存權杖。

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

    環境變數後援：`TELEGRAM_BOT_TOKEN=...`（僅限預設帳戶）。
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/環境變數中設定權杖，然後啟動 Gateway。

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對代碼會在 1 小時後過期。

  </Step>

  <Step title="Add the bot to a group">
    將機器人加入你的群組，然後設定 `channels.telegram.groups` 和 `groupPolicy`，以符合你的存取模型。
  </Step>
</Steps>

<Note>
權杖解析順序會感知帳戶。實務上，設定值優先於環境變數後援，而 `TELEGRAM_BOT_TOKEN` 只適用於預設帳戶。
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
    管理員狀態由 Telegram 群組設定控制。

    管理員機器人會收到所有群組訊息，這對於永遠啟用的群組行為很有用。

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

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到機器人使用者名稱的 Telegram 帳戶都能指揮機器人。只應將它用於刻意公開、且工具受到嚴格限制的機器人；單一擁有者機器人應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳戶設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳戶層級的 `allowFrom: ["*"]` 項目不會讓該帳戶公開，除非合併後的有效帳戶允許清單仍包含明確的萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有 DM，並會被設定驗證拒絕。
    設定只會要求數字使用者 ID。
    如果你已升級且設定中包含 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram 機器人權杖）。
    如果你先前依賴配對儲存的允許清單檔案，`openclaw doctor --fix` 可以在允許清單流程中將項目復原到 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，讓存取政策能持久保存在設定中（而不是依賴先前的配對核准）。

    常見混淆：DM 配對核准不代表「此傳送者已在所有地方獲得授權」。
    配對會授予 DM 存取權。如果尚未存在命令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅擁有者可用的命令和 exec 核准具有明確的操作員帳戶。
    群組傳送者授權仍來自明確設定的允許清單。
    如果你希望「我授權一次後，DM 和群組命令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅擁有者可用的命令，請確保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（無需第三方機器人）：

    1. 私訊你的機器人。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隱私性較低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群組政策與允許清單">
    兩項控制會一起套用：

    1. **允許哪些群組** (`channels.telegram.groups`)
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都可以通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為允許清單（明確 ID 或 `"*"`）

    2. **群組中允許哪些傳送者** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組傳送者篩選。如果未設定，Telegram 會回退使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    不要把 Telegram 群組或超級群組聊天 ID 放在 `groupAllowFrom`。負數聊天 ID 屬於 `channels.telegram.groups`。
    非數字項目會在傳送者授權時被忽略。
    安全邊界（`2026.2.25+`）：群組傳送者驗證**不會**繼承私訊配對儲存的核准。
    配對僅限私訊。對於群組，請設定 `groupAllowFrom` 或每個群組／每個主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會回退使用設定中的 `allowFrom`，而不是配對儲存。
    單一擁有者機器人的實用模式：在 `channels.telegram.allowFrom` 設定你的使用者 ID，保持 `groupAllowFrom` 未設定，並在 `channels.telegram.groups` 允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，除非明確設定 `channels.defaults.groupPolicy`，否則執行階段預設會以失敗關閉模式使用 `groupPolicy="allowlist"`。

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

    範例：只允許一個特定群組內的特定使用者：

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

      - 將像 `-1001234567890` 這樣的負數 Telegram 群組或超級群組聊天 ID 放在 `channels.telegram.groups`。
      - 當你想限制已允許群組內哪些人可以觸發機器人時，將像 `8734062810` 這樣的 Telegram 使用者 ID 放在 `groupAllowFrom`。
      - 只有在你想讓已允許群組中的任何成員都能與機器人對話時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行為">
    群組回覆預設需要提及。

    提及可以來自：

    - 原生 `@botusername` 提及，或
    - 以下項目中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    工作階段層級命令切換：

    - `/activation always`
    - `/activation mention`

    這些只會更新工作階段狀態。請使用設定來持久保存。

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

    - 將群組訊息轉寄給 `@userinfobot` / `@getidsbot`
    - 或從 `openclaw logs --follow` 讀取 `chat.id`
    - 或檢查 Bot API `getUpdates`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由 Gateway 程序擁有。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共用頻道信封，並包含回覆中繼資料與媒體預留位置。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>`，以保持主題隔離。
- 私訊訊息可以攜帶 `message_thread_id`；OpenClaw 會保留執行緒 ID 供回覆使用，但預設會讓私訊維持在扁平工作階段。當你有意要使用私訊主題工作階段隔離時，請設定 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`，或相符的主題設定。
- 長輪詢使用 grammY runner，並具備每個聊天／每個執行緒的排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 長輪詢會在每個 Gateway 程序內受到保護，因此同一時間只有一個作用中的輪詢器可以使用機器人權杖。如果你仍然看到 `getUpdates` 409 衝突，可能是另一個 OpenClaw Gateway、指令碼或外部輪詢器正在使用相同權杖。
- 預設情況下，長輪詢監看器重啟會在 120 秒內沒有完成的 `getUpdates` 存活訊號後觸發。只有在你的部署於長時間工作期間仍出現誤判的輪詢停滯重啟時，才增加 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍為 `30000` 到 `600000`；支援每個帳號覆寫。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組／主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 為 `off | partial | block | progress`（預設：`partial`）
    - 在 Telegram 上，`progress` 對應到 `partial`（相容跨頻道命名）
    - `streaming.preview.toolProgress` 控制工具／進度更新是否重複使用同一則已編輯的預覽訊息（預設：預覽串流啟用時為 `true`）
    - 會偵測舊版 `channels.telegram.streamMode` 和布林 `streaming` 值；執行 `openclaw doctor --fix` 將它們遷移到 `channels.telegram.streaming.mode`

    工具進度預覽更新是在工具執行時顯示的短「Working...」行，例如命令執行、檔案讀取、規劃更新或修補摘要。Telegram 預設會保持啟用，以符合 `v2026.4.22` 及更新版本發布的 OpenClaw 行為。若要保留答案文字的已編輯預覽，但隱藏工具進度行，請設定：

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

    僅在你想要只傳送最終內容時才使用 `streaming.mode: "off"`：Telegram 預覽編輯會被停用，通用工具/進度閒聊會被抑制，而不是以獨立的「Working...」訊息傳送。核准提示、媒體承載內容和錯誤仍會透過一般最終傳送路徑傳送。當你只想保留答案預覽編輯，同時隱藏工具進度狀態列時，請使用 `streaming.preview.toolProgress: false`。

    對於純文字回覆：

    - 短 DM/群組/主題預覽：OpenClaw 會保留同一則預覽訊息，並在原處執行最終編輯
    - 超過約一分鐘的預覽：OpenClaw 會將完成的回覆作為新的最終訊息傳送，然後清理預覽，讓 Telegram 可見的時間戳反映完成時間，而不是預覽建立時間

    對於複雜回覆（例如媒體承載內容），OpenClaw 會退回一般最終傳送，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免重複串流。

    僅限 Telegram 的推理串流：

    - `/reasoning stream` 會在產生期間將推理傳送到即時預覽
    - 最終答案傳送時不會包含推理文字

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    傳出文字使用 Telegram `parse_mode: "HTML"`。

    - 類 Markdown 文字會轉譯為 Telegram 安全的 HTML。
    - 原始模型 HTML 會被逸出，以減少 Telegram 剖析失敗。
    - 如果 Telegram 拒絕已剖析的 HTML，OpenClaw 會以純文字重試。

    連結預覽預設啟用，可用 `channels.telegram.linkPreview: false` 停用。

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Telegram 指令選單註冊會在啟動時以 `setMyCommands` 處理。

    原生指令預設值：

    - `commands.native: "auto"` 會為 Telegram 啟用原生指令

    新增自訂指令選單項目：

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

    - 名稱會被正規化（移除開頭的 `/`、轉為小寫）
    - 有效模式：`a-z`、`0-9`、`_`，長度 `1..32`
    - 自訂指令不能覆寫原生指令
    - 衝突/重複項目會被略過並記錄

    注意事項：

    - 自訂指令只是選單項目；不會自動實作行為
    - Plugin/skill 指令即使未顯示在 Telegram 選單中，輸入時仍可能運作

    如果停用原生指令，內建項目會被移除。若已設定，自訂/Plugin 指令仍可能註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍然超出上限；請減少 Plugin/skill/自訂指令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 指令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並顯示 `404: Not Found`，可能表示 `channels.telegram.apiRoot` 被設為完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只包含 Bot API 根路徑，而 `openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕已設定的 bot token。請使用目前的 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為 Webhook 清理失敗。
    - `setMyCommands failed` 搭配網路/fetch 錯誤通常表示到 `api.telegram.org` 的輸出 DNS/HTTPS 被阻擋。

    ### 裝置配對指令（`device-pair` Plugin）

    安裝 `device-pair` Plugin 時：

    1. `/pair` 會產生設定碼
    2. 將程式碼貼到 iOS app
    3. `/pair pending` 會列出待處理請求（包含角色/範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - 只有一個待處理請求時使用 `/pair approve`
       - `/pair approve latest` 用於最新請求

    設定碼會攜帶短效 bootstrap token。內建 bootstrap 交接會讓主要節點 token 保持在 `scopes: []`；任何已交接的操作者 token 都會限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。Bootstrap 範圍檢查會加上角色前綴，因此該操作者 allowlist 只滿足操作者請求；非操作者角色仍需要其自身角色前綴下的範圍。

    如果裝置以變更後的驗證詳細資料重試（例如角色/範圍/公開金鑰），先前的待處理請求會被取代，且新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

    更多詳細資訊：[配對](/zh-TW/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="Inline buttons">
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

    回呼點擊會作為文字傳給 agent：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Telegram 工具動作包含：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作會公開符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有獨立的 `channels.telegram.actions.*` 開關。
    執行階段傳送會使用作用中的設定/機密快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram 支援在產生的輸出中使用明確回覆執行緒標籤：

    - `[[reply_to_current]]` 會回覆觸發訊息
    - `[[reply_to:<id>]]` 會回覆特定 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    啟用回覆執行緒，且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 會將原生引用文字限制在 1024 個 UTF-16 code units，因此較長訊息會從開頭引用，若 Telegram 拒絕引用則退回純回覆。

    注意：`off` 會停用隱含回覆執行緒。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    論壇超級群組：

    - 主題工作階段鍵會附加 `:topic:<threadId>`
    - 回覆和正在輸入會以主題執行緒為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 傳送訊息時會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 正在輸入動作仍會包含 `message_thread_id`

    主題繼承：主題項目會繼承群組設定，除非被覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題，不會從群組預設值繼承。

    **每主題 agent 路由**：每個主題都可以透過在主題設定中設定 `agentId` 路由到不同的 agent。這讓每個主題都有自己的隔離工作區、記憶和工作階段。範例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    接著每個主題都有自己的工作階段鍵：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 主題繫結**：論壇主題可以透過頂層型別化 ACP 繫結固定 ACP harness 工作階段（`bindings[]` 搭配 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 這類主題限定 ID）。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP Agents](/zh-TW/tools/acp-agents)。

    **從聊天產生綁定執行緒的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由到那裡。OpenClaw 會將產生確認固定在主題中。需要 `channels.telegram.threadBindings.spawnSessions` 保持啟用（預設：`true`）。

    範本內容會公開 `MessageThreadId` 和 `IsForum`。帶有 `message_thread_id` 的 DM 聊天預設會在扁平工作階段上保留 DM 路由和回覆中繼資料；只有在設定 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`，或有相符主題設定時，才會使用具執行緒感知的工作階段鍵。對帳號預設值使用頂層 `channels.telegram.dm.threadReplies`，或對單一 DM 使用 `direct.<chatId>.threadReplies`。

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### 音訊訊息

    Telegram 會區分語音留言與音訊檔案。

    - 預設：音訊檔案行為
    - 在 agent 回覆中加入標籤 `[[audio_as_voice]]` 以強制以語音留言傳送
    - 傳入語音留言轉錄會在 agent 內容中被框定為機器產生、
      不受信任的文字；提及偵測仍使用原始
      轉錄，因此受提及閘控的語音訊息會持續運作。

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

    Telegram 會區分影片檔案與影片留言。

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

    影片留言不支援標題；提供的訊息文字會另外傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（預留位置 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖內容欄位：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    貼圖快取檔案：

    - `~/.openclaw/telegram/sticker-cache.json`

    貼圖會被描述一次（如果可能），並快取以減少重複視覺呼叫。

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

    搜尋快取的貼圖：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="反應通知">
    Telegram 反應會以 `message_reaction` 更新形式送達（與訊息承載內容分開）。

    啟用後，OpenClaw 會將系統事件加入佇列，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示只有使用者對 Bot 傳送訊息的反應（透過已傳送訊息快取盡力判斷）。
    - 反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被丟棄。
    - Telegram 不會在反應更新中提供對話串 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組的一般主題工作階段（`:topic:1`），而不是精確的原始主題

    輪詢/Webhook 的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack 反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - Agent 身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 Unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用某個通道或帳號的反應。

  </Accordion>

  <Accordion title="來自 Telegram 事件與命令的設定寫入">
    通道設定寫入預設啟用（`configWrites !== false`）。

    Telegram 觸發的寫入包括：

    - 群組遷移事件（`migrate_to_chat_id`），用來更新 `channels.telegram.groups`
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
    預設為長輪詢。若要使用 Webhook 模式，請設定 `channels.telegram.webhookUrl` 與 `channels.telegram.webhookSecret`；可選用 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本機監聽器會繫結到 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前放置反向代理，或有意設定 `webhookHost: "0.0.0.0"`。

    Webhook 模式會先驗證請求防護、Telegram 秘密權杖與 JSON 主體，再向 Telegram 回傳 `200`。
    接著 OpenClaw 會透過與長輪詢相同的每聊天/每主題 Bot 通道非同步處理更新，因此較慢的 Agent 回合不會卡住 Telegram 的傳遞 ACK。

  </Accordion>

  <Accordion title="限制、重試與 CLI 目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會在長度切分前優先使用段落邊界（空白行）。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入與傳出的 Telegram 媒體大小。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則套用 grammY 預設值）。Bot 用戶端會將設定值限制在低於 60 秒的傳出文字/輸入中請求防護，以免 grammY 在 OpenClaw 的傳輸防護與後援可執行前就中止可見回覆傳遞。長輪詢仍會使用 45 秒的 `getUpdates` 請求防護，讓閒置輪詢不會無限期被放棄。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；只有在輪詢停滯重新啟動出現誤判時，才在 `30000` 到 `600000` 之間調整。
    - 群組脈絡歷史記錄會使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 回覆/引用/轉寄的補充脈絡目前會依收到內容傳遞。
    - Telegram 允許清單主要控制誰能觸發 Agent，而不是完整的補充脈絡遮蔽邊界。
    - DM 歷史記錄控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用到 Telegram 傳送輔助工具（CLI/tools/actions），用於可復原的傳出 API 錯誤。傳入最終回覆傳遞也會針對 Telegram 預先連線失敗使用有界限的安全傳送重試，但不會重試可能導致可見訊息重複的模糊傳送後網路封包。

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

    僅適用於 Telegram 的投票旗標：

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - `--presentation` 搭配 `buttons` 區塊，用於 `channels.telegram.capabilities.inlineButtons` 允許時的行內鍵盤
    - `--pin` 或 `--delivery '{"pin":true}'`，在 Bot 可於該聊天釘選時請求釘選傳遞
    - `--force-document`，將傳出圖片與 GIF 作為文件傳送，而不是壓縮相片或動畫媒體上傳

    動作管制：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出的 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用 Telegram 投票建立，同時保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的 Exec 核准">
    Telegram 支援在核准者 DM 中進行 Exec 核准，也可選擇在原始聊天或主題中發布提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（至少有一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（後援為 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（預設）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 與 `defaultTo` 會控制誰可以與 Bot 對話，以及它在哪裡傳送一般回覆。它們不會讓某人成為 Exec 核准者。當尚未存在命令擁有者時，第一個已核准的 DM 配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，不需要在 `execApprovals.approvers` 下重複 ID。

    通道傳遞會在聊天中顯示命令文字；只有在受信任的群組/主題中才啟用 `channel` 或 `both`。當提示落在論壇主題中時，OpenClaw 會保留該主題供核准提示與後續訊息使用。Exec 核准預設會在 30 分鐘後過期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過 Plugin 核准解析；其他 ID 會先透過 Exec 核准解析。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當 Agent 遇到傳遞或提供者錯誤時，Telegram 可以回覆錯誤文字，也可以抑制它。兩個設定鍵會控制此行為：

| 鍵                                  | 值                | 預設值  | 說明                                                                                           |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 會向聊天傳送友善的錯誤訊息。`silent` 會完全抑制錯誤回覆。                              |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 對同一聊天傳送錯誤回覆的最短間隔時間。可防止服務中斷期間出現錯誤訊息洗版。                     |

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
  <Accordion title="Bot 不回應非提及的群組訊息">

    - 若 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather：`/setprivacy` -> Disable
      - 接著將 Bot 從群組移除並重新加入
    - 當設定預期可接收未提及的群組訊息時，`openclaw channels status` 會警告。
    - `openclaw channels status --probe` 可檢查明確的數字群組 ID；萬用字元 `"*"` 無法進行成員資格探測。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列在其中（或包含 `"*"`）
    - 確認 Bot 是群組成員
    - 檢視日誌：`openclaw logs --follow` 以查看略過原因

  </Accordion>

  <Accordion title="命令只能部分運作或完全無法運作">

    - 授權你的傳送者身分（配對和/或數字 `allowFrom`）
    - 即使群組政策為 `open`，命令授權仍然適用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生命令選單項目過多；請減少 Plugin/Skills/自訂命令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入中呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸後援重試一次。持續性的網路/擷取錯誤通常表示到 `api.telegram.org` 的 DNS/HTTPS 可達性問題

  </Accordion>

  <Accordion title="啟動回報未授權權杖">

    - `getMe returned 401` 是針對已設定 Bot 權杖的 Telegram 驗證失敗。
    - 在 BotFather 中重新複製或重新產生 Bot 權杖，然後更新預設帳號的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將它視為「不存在 Webhook」只會把同一個錯誤權杖失敗延後到之後的 API 呼叫。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤失敗，OpenClaw 會檢查 `getWebhookInfo`；當 Telegram 回報空的 Webhook URL 時，輪詢會繼續，因為清理已經滿足。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - Node 22+ 加上自訂 fetch/proxy 時，若 AbortSignal 型別不相符，可能會觸發立即中止行為。
    - 有些主機會先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 輸出連線可能造成 Telegram API 間歇性失敗。
    - 如果記錄包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些錯誤視為可復原的網路錯誤並重試。
    - 如果 Telegram socket 以很短的固定週期回收，請檢查是否有過低的 `channels.telegram.timeoutSeconds`；bot 用戶端會將低於輸出連線與 `getUpdates` 請求保護值的設定值夾制住，但舊版在此值低於那些保護值時，可能每次輪詢或回覆都會中止。
    - 如果記錄包含 `Polling stall detected`，OpenClaw 預設會在 120 秒內沒有完成長輪詢存活訊號後，重新啟動輪詢並重建 Telegram 傳輸。
    - `openclaw channels status --probe` 和 `openclaw doctor` 會在執行中的輪詢帳號於啟動寬限期後尚未完成 `getUpdates`、執行中的 webhook 帳號於啟動寬限期後尚未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過期時發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫健康，但你的主機仍回報誤判的輪詢停滯重啟時，才提高 `channels.telegram.pollingStallThresholdMs`。持續停滯通常表示主機與 `api.telegram.org` 之間有 proxy、DNS、IPv6 或 TLS 輸出連線問題。
    - Telegram 也會遵循程序的 Bot API 傳輸 proxy 環境變數，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可略過 `api.telegram.org`。
    - 如果服務環境透過 `OPENCLAW_PROXY_URL` 設定 OpenClaw 受管 proxy，且沒有標準 proxy 環境變數，Telegram 也會使用該 URL 進行 Bot API 傳輸。
    - 在直接輸出連線/TLS 不穩定的 VPS 主機上，請透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再遵循程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不適用，Node 22+ 會退回到 `ipv4first`。
    - 如果你的主機是 WSL2，或明確在僅 IPv4 行為下運作較佳，請強制指定 family 選擇：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 預設已允許 Telegram 媒體下載使用 RFC 2544 基準測試範圍答案（`198.18.0.0/15`）。如果受信任的 fake-IP 或透明 proxy 在媒體下載期間將 `api.telegram.org` 重寫到其他私有/內部/特殊用途位址，你可以選擇啟用僅限 Telegram 的略過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一個選擇性啟用也可在每個帳號使用：
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的 proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先保持危險旗標關閉。Telegram 媒體預設已允許 RFC 2544 基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會弱化 Telegram
      媒體 SSRF 保護。只有在受信任且由操作員控制的 proxy
      環境中才使用它，例如 Clash、Mihomo 或 Surge fake-IP 路由，且它們會合成 RFC 2544 基準測試
      範圍以外的私有或特殊用途答案。一般公開網際網路 Telegram 存取請保持關閉。
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

更多協助：[通道疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
- 命令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒/回覆：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/傳遞：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅限 Bot API 根目錄；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 表情回應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入/歷史記錄：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個以上帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明確指定預設路由。否則 OpenClaw 會退回到第一個正規化帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到 Gateway。
  </Card>
  <Card title="Groups" icon="users" href="/zh-TW/channels/groups">
    群組與主題 allowlist 行為。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理。
  </Card>
  <Card title="Security" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組與主題對應到代理。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷。
  </Card>
</CardGroup>
