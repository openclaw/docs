---
read_when:
    - 開發 Telegram 功能或 Webhook
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

可用於透過 grammY 在 bot 私訊與群組中進行正式環境部署。長輪詢是預設模式；Webhook 模式為選用。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="通道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復手冊。
  </Card>
  <Card title="Gateway 配置" icon="settings" href="/zh-TW/gateway/configuration">
    完整通道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="在 BotFather 建立 bot token">
    開啟 Telegram 並與 **@BotFather** 聊天（確認帳號完全是 `@BotFather`）。

    執行 `/newbot`、依照提示操作，並儲存 token。

  </Step>

  <Step title="設定 token 與私訊政策">

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
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/env 中設定 token，然後啟動 gateway。

  </Step>

  <Step title="啟動 gateway 並核准第一個私訊">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>

  <Step title="將 bot 加入群組">
    將 bot 加入你的群組，然後設定 `channels.telegram.groups` 與 `groupPolicy` 以符合你的存取模型。
  </Step>
</Steps>

<Note>
Token 解析順序會感知帳號。實務上，設定值優先於環境變數備援，而 `TELEGRAM_BOT_TOKEN` 只套用於預設帳號。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="隱私模式與群組可見性">
    Telegram bot 預設使用 **Privacy Mode**，這會限制它們可接收的群組訊息。

    如果 bot 必須看到所有群組訊息，請擇一：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將 bot 設為群組管理員。

    切換隱私模式時，請在每個群組中移除並重新加入 bot，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="群組權限">
    管理員狀態由 Telegram 群組設定控制。

    管理員 bot 會接收所有群組訊息，這對常駐群組行為很有用。

  </Accordion>

  <Accordion title="實用的 BotFather 切換項">

    - `/setjoingroups` 用於允許/拒絕加入群組
    - `/setprivacy` 用於群組可見性行為

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

<Tabs>
  <Tab title="私訊政策">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（需要 `allowFrom` 中至少有一個寄件者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到 bot 使用者名稱的 Telegram 帳號都能指揮該 bot。請只將它用於刻意公開、且工具受到嚴格限制的 bot；單一擁有者 bot 應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳號層級的 `allowFrom: ["*"]` 項目不會讓該帳號公開，除非合併後的有效帳號允許清單仍包含明確的萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有私訊，並會被設定驗證拒絕。
    設定流程只會要求數字使用者 ID。
    如果你已升級且設定包含 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram bot token）。
    如果你先前依賴配對儲存的允許清單檔案，`openclaw doctor --fix` 可在允許清單流程中將項目復原到 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者 bot，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，讓存取政策在設定中持久保存（而不是依賴先前的配對核准）。

    常見混淆：私訊配對核准並不代表「此寄件者在任何地方都已獲授權」。
    配對授予私訊存取權。如果尚未存在命令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅限擁有者的命令與 exec 核准擁有明確的操作者帳號。
    群組寄件者授權仍來自明確設定的允許清單。
    如果你想要「我授權一次後，私訊與群組命令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；若是僅限擁有者的命令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（無第三方 bot）：

    1. 私訊你的 bot。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隱私性較低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群組政策與允許清單">
    兩個控制項會一起套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都可通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為允許清單（明確 ID 或 `"*"`）

    2. **群組中允許哪些寄件者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組寄件者篩選。若未設定，Telegram 會退回使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    不要將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 屬於 `channels.telegram.groups`。
    非數字項目會在寄件者授權中被忽略。
    安全邊界（`2026.2.25+`）：群組寄件者驗證**不會**繼承私訊配對儲存的核准。
    配對維持僅限私訊。對於群組，請設定 `groupAllowFrom` 或每個群組/每個主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會退回使用設定中的 `allowFrom`，而不是配對儲存。
    單一擁有者 bot 的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 下允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，除非明確設定 `channels.defaults.groupPolicy`，執行階段預設會採用 fail-closed 的 `groupPolicy="allowlist"`。

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

      - 將像 `-1001234567890` 這類負數 Telegram 群組或超級群組聊天 ID 放在 `channels.telegram.groups` 下。
      - 當你想限制允許群組中哪些人可以觸發 bot 時，將像 `8734062810` 這類 Telegram 使用者 ID 放在 `groupAllowFrom` 下。
      - 只有在你希望允許群組中的任何成員都能與 bot 交談時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行為">
    群組回覆預設需要提及。

    提及可來自：

    - 原生 `@botusername` 提及，或
    - 下列項目中的提及模式：
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

- Telegram 由 gateway 程序擁有。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇通道）。
- 傳入訊息會正規化為共用通道信封，並包含回覆中繼資料與媒體 placeholder。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>` 以保持主題隔離。
- 私訊訊息可攜帶 `message_thread_id`；OpenClaw 會保留 thread ID 供回覆使用，但預設會讓私訊維持在扁平工作階段。當你刻意想要私訊主題工作階段隔離時，請設定 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`，或相符的主題設定。
- 長輪詢使用 grammY runner，並採用每個聊天/每個 thread 的排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 長輪詢會在每個 gateway 程序內受到保護，因此同一時間只有一個作用中的 poller 可以使用 bot token。如果你仍看到 `getUpdates` 409 衝突，可能有另一個 OpenClaw gateway、script 或外部 poller 正在使用同一個 token。
- 長輪詢 watchdog restart 預設會在 120 秒內沒有完成的 `getUpdates` liveness 時觸發。只有在你的部署於長時間執行工作期間仍看到誤判的 polling-stall restart 時，才提高 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍是 `30000` 到 `600000`；支援每個帳號覆寫。
- Telegram Bot API 不支援讀取回條（`sendReadReceipts` 不適用）。

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（預設：`partial`）
    - `progress` 會保留一個可編輯的狀態草稿，並以工具進度更新它直到最終交付
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用同一則已編輯的預覽訊息（預設：預覽串流作用中時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度列中的命令/exec 詳細資訊：`raw`（預設，保留已發布行為）或 `status`（僅工具標籤）
    - 舊版 `channels.telegram.streamMode` 與布林值 `streaming` 會被偵測；請執行 `openclaw doctor --fix` 將它們遷移到 `channels.telegram.streaming.mode`

    工具進度預覽更新是在工具執行時顯示的短狀態列，例如命令執行、檔案讀取、規劃更新或 patch 摘要。Telegram 預設會啟用這些更新，以符合 `v2026.4.22` 及後續版本的 OpenClaw 已發布行為。若要保留答案文字的已編輯預覽，但隱藏工具進度列，請設定：

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

    若要保留工具進度可見但隱藏命令/exec 文字，請設定：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    對於進度草稿模式，請將相同的命令文字政策放在 `streaming.progress` 下：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    只有在你想要僅傳遞最終結果時，才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，且一般工具/進度閒聊會被抑制，而不是作為獨立狀態訊息傳送。核准提示、媒體承載內容和錯誤仍會透過一般最終傳遞路徑送出。當你只想保留答案預覽編輯，同時隱藏工具進度狀態列時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 已選取引用回覆是例外。當 `replyToMode` 是 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含已選取的引用文字時，OpenClaw 會透過 Telegram 原生引用回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法在該回合顯示簡短狀態列。沒有已選取引用文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引用回覆更重要時，請設定 `replyToMode: "off"`，或設定 `streaming.preview.toolProgress: false` 以承認此取捨。
    </Note>

    對於純文字回覆：

    - 簡短的私訊/群組/主題預覽：OpenClaw 會保留同一則預覽訊息並就地執行最終編輯，除非預覽出現後已傳送可見的非預覽訊息
    - 預覽後接著可見的非預覽輸出：OpenClaw 會將完成的回覆作為新的最終訊息傳送，並清理較舊的預覽，因此最終答案會出現在中間輸出之後
    - 超過約一分鐘的預覽：OpenClaw 會將完成的回覆作為新的最終訊息傳送，然後清理預覽，因此 Telegram 可見的時間戳會反映完成時間，而不是預覽建立時間

    對於複雜回覆（例如媒體承載內容），OpenClaw 會退回一般最終傳遞，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免雙重串流。

    僅限 Telegram 的推理串流：

    - `/reasoning stream` 會在產生期間將推理傳送到即時預覽
    - 推理預覽會在最終傳遞後刪除；當推理應保持可見時，請使用 `/reasoning on`
    - 最終答案會在不含推理文字的情況下傳送

  </Accordion>

  <Accordion title="格式化與 HTML 後備">
    傳出文字使用 Telegram `parse_mode: "HTML"`。

    - 類似 Markdown 的文字會轉譯為 Telegram 安全的 HTML。
    - 原始模型 HTML 會被逸出，以減少 Telegram 剖析失敗。
    - 如果 Telegram 拒絕剖析後的 HTML，OpenClaw 會以純文字重試。

    連結預覽預設啟用，可使用 `channels.telegram.linkPreview: false` 停用。

  </Accordion>

  <Accordion title="原生命令與自訂命令">
    Telegram 命令選單註冊會在啟動時使用 `setMyCommands` 處理。

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
    - 衝突/重複項目會被略過並記錄

    注意事項：

    - 自訂命令只是選單項目；它們不會自動實作行為
    - 即使未顯示在 Telegram 選單中，Plugin/技能命令在輸入時仍可運作

    如果停用原生命令，內建項目會被移除。自訂/Plugin 命令若已設定，仍可註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍然溢出；請減少 Plugin/技能/自訂命令，或停用 `channels.telegram.commands.native`。
    - `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並顯示 `404: Not Found`，但直接 Bot API curl 命令可運作，可能表示 `channels.telegram.apiRoot` 被設定為完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只是 Bot API 根路徑，而 `openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕已設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為 Webhook 清理失敗。
    - `setMyCommands failed` 搭配網路/fetch 錯誤，通常表示連往 `api.telegram.org` 的傳出 DNS/HTTPS 被封鎖。

    ### 裝置配對命令（`device-pair` Plugin）

    安裝 `device-pair` Plugin 後：

    1. `/pair` 會產生設定碼
    2. 將程式碼貼到 iOS app
    3. `/pair pending` 會列出待處理要求（包括角色/範圍）
    4. 核准要求：
       - `/pair approve <requestId>` 用於明確核准
       - 只有一個待處理要求時使用 `/pair approve`
       - `/pair approve latest` 用於最新項目

    設定碼會攜帶短效啟動權杖。內建啟動交接會將主要節點權杖維持在 `scopes: []`；任何已交接的操作者權杖仍限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。啟動範圍檢查會加上角色前綴，因此該操作者允許清單只滿足操作者要求；非操作者角色仍需要其自身角色前綴下的範圍。

    如果裝置以變更後的驗證詳細資料重試（例如角色/範圍/公開金鑰），先前的待處理要求會被取代，且新要求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

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

    個別帳戶覆寫：

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

    回呼點擊會以文字傳遞給代理：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="代理與自動化的 Telegram 訊息動作">
    Telegram 工具動作包括：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作提供符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    門控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有個別的 `channels.telegram.actions.*` 切換。
    執行階段傳送會使用作用中的設定/密鑰快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆執行緒標籤">
    Telegram 支援在產生的輸出中使用明確回覆執行緒標籤：

    - `[[reply_to_current]]` 會回覆觸發訊息
    - `[[reply_to:<id>]]` 會回覆特定 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    當回覆執行緒已啟用，且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 會將原生引用文字限制為 1024 個 UTF-16 code units，因此較長訊息會從開頭引用，且如果 Telegram 拒絕引用，會退回純回覆。

    注意：`off` 會停用隱含回覆執行緒。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與執行緒行為">
    論壇超級群組：

    - 主題工作階段鍵會附加 `:topic:<threadId>`
    - 回覆和輸入動作會以主題執行緒為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入動作仍會包含 `message_thread_id`

    主題繼承：主題項目會繼承群組設定，除非被覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題，且不會從群組預設值繼承。

    **個別主題代理路由**：每個主題都可透過在主題設定中設定 `agentId` 路由到不同代理。這讓每個主題都有自己的隔離工作區、記憶體和工作階段。範例：

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

    **持久 ACP 主題繫結**：論壇主題可以透過頂層具型別 ACP 繫結（`bindings[]` 搭配 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 的主題限定 ID）釘選 ACP harness 工作階段。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

    **從聊天產生執行緒繫結 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續回覆會直接路由至該處。OpenClaw 會在主題內釘選產生確認。需要 `channels.telegram.threadBindings.spawnSessions` 保持啟用（預設：`true`）。

    範本脈絡會公開 `MessageThreadId` 和 `IsForum`。含有 `message_thread_id` 的 DM 聊天預設會在扁平工作階段上保留 DM 路由和回覆中繼資料；只有在設定了 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`，或符合的主題設定時，才會使用具備執行緒感知的工作階段鍵。使用頂層 `channels.telegram.dm.threadReplies` 作為帳號預設值，或使用 `direct.<chatId>.threadReplies` 針對單一 DM 設定。

  </Accordion>

  <Accordion title="音訊、影片和貼圖">
    ### 音訊訊息

    Telegram 會區分語音記事和音訊檔案。

    - 預設：音訊檔案行為
    - 在代理回覆中加入標籤 `[[audio_as_voice]]` 可強制以語音記事傳送
    - 傳入的語音記事轉錄會在代理脈絡中被框定為機器產生、
      不可信任的文字；提及偵測仍會使用原始
      轉錄，因此受提及閘控的語音訊息會繼續運作。

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

    Telegram 會區分影片檔案和影片記事。

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

    影片記事不支援說明文字；提供的訊息文字會另外傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（預留位置 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖脈絡欄位：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    貼圖快取檔案：

    - `~/.openclaw/telegram/sticker-cache.json`

    貼圖會在可行時描述一次，並快取以減少重複的視覺呼叫。

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

    搜尋已快取貼圖：

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
    Telegram 反應會以 `message_reaction` 更新抵達（與訊息酬載分開）。

    啟用時，OpenClaw 會將系統事件加入佇列，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`: `off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示僅限使用者對 bot 傳送訊息的反應（透過已傳送訊息快取盡力判定）。
    - 反應事件仍遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被丟棄。
    - Telegram 不會在反應更新中提供執行緒 ID。
      - 非論壇群組會路由至群組聊天工作階段
      - 論壇群組會路由至群組一般主題工作階段（`:topic:1`），而不是確切的來源主題

    輪詢/Webhook 的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack 反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用頻道或帳號的反應。

  </Accordion>

  <Accordion title="來自 Telegram 事件和命令的設定寫入">
    頻道設定寫入預設啟用（`configWrites !== false`）。

    Telegram 觸發的寫入包括：

    - 群組遷移事件（`migrate_to_chat_id`），用於更新 `channels.telegram.groups`
    - `/config set` 和 `/config unset`（需要啟用命令）

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
    預設為長輪詢。若要使用 Webhook 模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；選用 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本機監聽器會繫結至 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前方放置反向 Proxy，或有意地設定 `webhookHost: "0.0.0.0"`。

    Webhook 模式會先驗證請求防護、Telegram 秘密權杖和 JSON 主體，然後才向 Telegram 回傳 `200`。
    OpenClaw 接著會透過與長輪詢相同的每聊天/每主題 bot 通道非同步處理更新，因此較慢的代理回合不會佔住 Telegram 的傳遞 ACK。

  </Accordion>

  <Accordion title="限制、重試和 CLI 目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會在依長度分割前優先使用段落邊界（空白行）。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入和傳出的 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其作為單一傳入訊息分派前的緩衝時間。若相簿部分延遲抵達，請增加此值；若要降低相簿回覆延遲，請減少此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則套用 grammY 預設值）。Bot 用戶端會將低於 60 秒傳出文字/輸入請求防護的設定值限制住，讓 grammY 不會在 OpenClaw 的傳輸防護和後援執行前中止可見回覆傳遞。長輪詢仍使用 45 秒的 `getUpdates` 請求防護，因此閒置輪詢不會無限期擱置。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；僅在發生誤判的輪詢停滯重新啟動時，才調整於 `30000` 到 `600000` 之間。
    - 群組脈絡歷史會使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 回覆/引用/轉寄的補充脈絡目前會依收到的內容傳遞。
    - Telegram 允許清單主要控管誰能觸發代理，而不是完整的補充脈絡遮蔽邊界。
    - DM 歷史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用至 Telegram 傳送輔助工具（CLI/tools/actions），用於可復原的傳出 API 錯誤。傳入最終回覆傳遞也會針對 Telegram 預連線失敗使用有限的安全傳送重試，但不會重試可能導致可見訊息重複的模糊傳送後網路封包。

    CLI 傳送目標可以是數字聊天 ID 或使用者名稱：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 輪詢使用 `openclaw message poll`，並支援論壇主題：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    僅限 Telegram 的輪詢旗標：

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - 當 `channels.telegram.capabilities.inlineButtons` 允許時，使用含有 `buttons` 區塊的 `--presentation` 來建立行內鍵盤
    - 使用 `--pin` 或 `--delivery '{"pin":true}'`，在 bot 可於該聊天釘選時要求釘選傳遞
    - 使用 `--force-document`，將傳出圖片和 GIF 作為文件傳送，而不是壓縮相片或動畫媒體上傳

    動作閘控：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出 Telegram 訊息，包括輪詢
    - `channels.telegram.actions.poll=false` 會停用 Telegram 輪詢建立，同時保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的 exec 核准">
    Telegram 支援在核准者 DM 中進行 exec 核准，並可選擇在來源聊天或主題中張貼提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（當至少一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（後援為來自 `commands.ownerAllowFrom` 的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（預設）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以與 bot 對話，以及它會在哪裡傳送一般回覆。它們不會讓某人成為 exec 核准者。當尚未存在命令擁有者時，第一次核准的 DM 配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，而不需要在 `execApprovals.approvers` 底下重複 ID。

    頻道傳遞會在聊天中顯示命令文字；僅在受信任的群組/主題中啟用 `channel` 或 `both`。當提示落在論壇主題中時，OpenClaw 會保留該主題供核准提示和後續訊息使用。Exec 核准預設會在 30 分鐘後過期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過 Plugin 核准解析；其他 ID 會先透過 exec 核准解析。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到傳遞或 Provider 錯誤時，Telegram 可以回覆錯誤文字或加以抑制。兩個設定鍵會控制此行為：

| 鍵                                  | 值                | 預設    | 說明                                                                                            |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 會向聊天傳送友善的錯誤訊息。`silent` 會完全抑制錯誤回覆。                              |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 對同一聊天傳送錯誤回覆之間的最短時間。防止中斷期間出現錯誤垃圾訊息。                           |

支援每帳號、每群組和每主題覆寫（繼承方式與其他 Telegram 設定鍵相同）。

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
  <Accordion title="Bot 未回應非提及的群組訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather：`/setprivacy` -> Disable
      - 然後將 bot 從群組移除並重新加入
    - 當設定預期未提及的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法進行成員資格探測。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列出（或包含 `"*"`）
    - 驗證機器人在群組中的成員身分
    - 檢閱記錄：`openclaw logs --follow` 以查看略過原因

  </Accordion>

  <Accordion title="指令部分可用或完全無法使用">

    - 授權你的傳送者身分（配對和/或數字 `allowFrom`）
    - 即使群組政策為 `open`，指令授權仍然適用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單有太多項目；請減少 plugin/skill/自訂指令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫和 `sendChatAction` 輸入狀態呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續的網路/fetch 錯誤通常表示到 `api.telegram.org` 的 DNS/HTTPS 可達性問題

  </Accordion>

  <Accordion title="啟動回報未授權的 token">

    - `getMe returned 401` 是 Telegram 對已設定機器人 token 的驗證失敗。
    - 在 BotFather 重新複製或重新產生機器人 token，然後更新預設帳號的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；若把它視為「沒有 webhook 存在」，只會把相同的錯誤 token 失敗延後到後續 API 呼叫。

  </Accordion>

  <Accordion title="Polling 或網路不穩定">

    - Node 22+ 加上自訂 fetch/proxy 時，如果 AbortSignal 類型不相符，可能觸發立即中止行為。
    - 某些主機會先將 `api.telegram.org` 解析為 IPv6；故障的 IPv6 輸出可能導致間歇性 Telegram API 失敗。
    - 如果記錄包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些視為可復原的網路錯誤並重試。
    - 在 polling 啟動期間，OpenClaw 會將成功的啟動 `getMe` 探測重用於 grammY，因此 runner 不需要在第一次 `getUpdates` 之前再做第二次 `getMe`。
    - 如果 `deleteWebhook` 在 polling 啟動期間因暫時性網路錯誤失敗，OpenClaw 會繼續進入長 polling，而不是再發出一次 pre-poll 控制平面呼叫。仍處於作用中的 webhook 會呈現為 `getUpdates` 衝突；OpenClaw 接著會重建 Telegram 傳輸並重試 webhook 清理。
    - 如果 Telegram socket 以很短的固定週期回收，請檢查是否有偏低的 `channels.telegram.timeoutSeconds`；機器人用戶端會將設定值箝制在輸出與 `getUpdates` 請求保護值以上，但較舊版本在此值低於那些保護值時，可能會在每次 poll 或回覆時中止。
    - 如果記錄包含 `Polling stall detected`，OpenClaw 預設會在 120 秒沒有完成長 poll 存活性後重新啟動 polling 並重建 Telegram 傳輸。
    - `openclaw channels status --probe` 和 `openclaw doctor` 會在執行中的 polling 帳號於啟動寬限期後尚未完成 `getUpdates`、執行中的 webhook 帳號於啟動寬限期後尚未完成 `setWebhook`，或最後一次成功的 polling 傳輸活動已過期時提出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫是健康的，但你的主機仍回報誤判的 polling 停滯重啟時，才提高 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 輸出問題。
    - Telegram 也會遵循行程 proxy env 進行 Bot API 傳輸，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可繞過 `api.telegram.org`。
    - 如果 OpenClaw 受管理 proxy 在服務環境中透過 `OPENCLAW_PROXY_URL` 設定，且沒有標準 proxy env，Telegram 也會使用該 URL 進行 Bot API 傳輸。
    - 在直接輸出/TLS 不穩定的 VPS 主機上，請透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再到行程預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不適用，Node 22+ 會退回 `ipv4first`。
    - 如果你的主機是 WSL2，或明確在僅 IPv4 行為下運作較佳，請強制 family selection：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Telegram 媒體下載預設已允許 RFC 2544 基準測試範圍的回應（`198.18.0.0/15`）。如果受信任的 fake-IP 或透明 proxy 在媒體下載期間將 `api.telegram.org` 改寫為其他私人/內部/特殊用途位址，你可以選擇啟用僅限 Telegram 的繞過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 相同的選擇啟用也可針對每個帳號設定於
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的 proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先關閉
      dangerous 旗標。Telegram 媒體預設已允許 RFC 2544
      基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 保護。僅在受信任、由操作員控制的 proxy
      環境中使用，例如 Clash、Mihomo 或 Surge fake-IP 路由，且它們
      合成 RFC 2544 基準測試範圍以外的私人或特殊用途回應時。
      一般公網 Telegram 存取請保持關閉。
    </Warning>

    - 環境覆寫（暫時）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 驗證 DNS 回應：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多說明：[Channel 疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="高訊號 Telegram 欄位">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- exec 核准：`execApprovals`、`accounts.*.execApprovals`
- 指令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒/回覆：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/傳送：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅 Bot API 根目錄；請勿包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 回應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入/歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個或更多帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`），使預設路由明確。否則 OpenClaw 會退回第一個正規化帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到 Gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組和主題允許清單行為。
  </Card>
  <Card title="Channel 路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組和主題對應至代理。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨 Channel 診斷。
  </Card>
</CardGroup>
