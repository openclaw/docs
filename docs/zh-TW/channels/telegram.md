---
read_when:
    - 開發 Telegram 功能或 Webhook
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-05-06T09:03:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08475cd9dd3cf641f482db94a0581e4e382a60be4bd6f3bf3d50b980b0235090
    source_path: channels/telegram.md
    workflow: 16
---

可投入生產使用，透過 grammY 支援機器人私訊和群組。長輪詢是預設模式；Webhook 模式為選用。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復作業手冊。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-TW/gateway/configuration">
    完整頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="Create the bot token in BotFather">
    開啟 Telegram 並與 **@BotFather** 聊天（確認帳號名稱正好是 `@BotFather`）。

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
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/env 中設定 token，然後啟動 Gateway。

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
    將機器人加入你的群組，然後設定 `channels.telegram.groups` 和 `groupPolicy` 以符合你的存取模型。
  </Step>
</Steps>

<Note>
Token 解析順序會感知帳號。實務上，設定值優先於環境變數備援，而 `TELEGRAM_BOT_TOKEN` 只套用到預設帳號。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram 機器人預設使用 **Privacy Mode**，這會限制它們可接收的群組訊息。

    如果機器人必須看到所有群組訊息，請擇一：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將機器人設為群組管理員。

    切換隱私模式時，請在每個群組中移除並重新加入機器人，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="Group permissions">
    管理員狀態是在 Telegram 群組設定中控制。

    管理員機器人會接收所有群組訊息，這對常駐群組行為很有用。

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
    - `allowlist`（需要 `allowFrom` 中至少有一個寄件者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到機器人使用者名稱的 Telegram 帳號都能對機器人下指令。僅限刻意公開、且工具受到嚴格限制的機器人使用；單一擁有者機器人應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳號層級的 `allowFrom: ["*"]` 項目不會讓該帳號公開，除非合併後的有效帳號 allowlist 仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有私訊，且會被設定驗證拒絕。
    設定流程只會要求數字使用者 ID。
    如果你已升級且設定包含 `@username` allowlist 項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram 機器人 token）。
    如果你先前仰賴配對儲存區 allowlist 檔案，`openclaw doctor --fix` 可在 allowlist 流程中將項目復原到 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，讓存取政策穩定保存在設定中（而不是依賴先前的配對核准）。

    常見混淆：私訊配對核准不代表「此寄件者在所有地方都已授權」。
    配對授予私訊存取權。如果尚未存在指令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅擁有者指令與 exec 核准具有明確的操作者帳號。
    群組寄件者授權仍來自明確的設定 allowlist。
    如果你想要「我授權一次，私訊和群組指令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅擁有者指令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（無第三方機器人）：

    1. 私訊你的機器人。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隱私性較低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="Group policy and allowlists">
    兩項控制會一起套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都能通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為 allowlist（明確 ID 或 `"*"`）

    2. **允許群組中的哪些寄件者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組寄件者篩選。若未設定，Telegram 會退回使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    請勿將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 應放在 `channels.telegram.groups` 下。
    非數字項目會被寄件者授權忽略。
    安全邊界（`2026.2.25+`）：群組寄件者驗證**不**繼承私訊配對儲存區核准。
    配對僅限私訊。對於群組，請設定 `groupAllowFrom` 或每群組/每主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會退回使用設定中的 `allowFrom`，而不是配對儲存區。
    單一擁有者機器人的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 下允許目標群組。
    執行期注意事項：如果完全缺少 `channels.telegram`，執行期預設會故障關閉為 `groupPolicy="allowlist"`，除非明確設定 `channels.defaults.groupPolicy`。

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
      常見錯誤：`groupAllowFrom` 不是 Telegram 群組 allowlist。

      - 將負數 Telegram 群組或超級群組聊天 ID（例如 `-1001234567890`）放在 `channels.telegram.groups` 下。
      - 當你想限制允許群組內哪些人可以觸發機器人時，將 Telegram 使用者 ID（例如 `8734062810`）放在 `groupAllowFrom` 下。
      - 只有在你希望允許群組中的任何成員都能與機器人對話時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    群組回覆預設需要提及。

    提及可以來自：

    - 原生 `@botusername` 提及，或
    - 下列項目中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    工作階段層級指令切換：

    - `/activation always`
    - `/activation mention`

    這些只會更新工作階段狀態。若要持久化，請使用設定。

    持久化設定範例：

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

## 執行期行為

- Telegram 由 Gateway 程序擁有。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共享頻道信封，包含回覆中繼資料與媒體預留位置。
- 群組工作階段會依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>` 以保持主題隔離。
- 私訊訊息可攜帶 `message_thread_id`；OpenClaw 會保留該 thread ID 以供回覆，但預設會讓私訊維持在扁平工作階段。當你刻意想要私訊主題工作階段隔離時，請設定 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`，或符合的主題設定。
- 長輪詢使用 grammY runner，並具備每聊天/每執行緒排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 長輪詢在每個 Gateway 程序內受到保護，因此一次只有一個作用中的 poller 可以使用機器人 token。如果你仍看到 `getUpdates` 409 衝突，可能是另一個 OpenClaw Gateway、指令碼或外部 poller 正在使用相同 token。
- 長輪詢 watchdog 重新啟動預設會在 120 秒內沒有完成的 `getUpdates` 存活證明後觸發。只有在你的部署於長時間執行工作期間仍看到誤判輪詢停滯重新啟動時，才提高 `channels.telegram.pollingStallThresholdMs`。該值以毫秒為單位，允許範圍為 `30000` 到 `600000`；支援每帳號覆寫。
- Telegram Bot API 不支援讀取回條（`sendReadReceipts` 不適用）。

## 功能參考

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 為 `off | partial | block | progress`（預設：`partial`）
    - `progress` 會為工具進度保留一則可編輯的狀態草稿，在完成時清除它，並以一般訊息傳送最終答案
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用同一則已編輯預覽訊息（預設：預覽串流啟用時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度行內的指令/exec 詳細資訊：`raw`（預設，保留已發布行為）或 `status`（僅工具標籤）
    - 舊版 `channels.telegram.streamMode` 和布林 `streaming` 值會被偵測；請執行 `openclaw doctor --fix` 將它們遷移到 `channels.telegram.streaming.mode`

    工具進度預覽更新是工具執行時顯示的短狀態行，例如指令執行、檔案讀取、規劃更新或修補摘要。Telegram 預設會保持啟用，以符合 `v2026.4.22` 及後續版本已發布的 OpenClaw 行為。若要保留答案文字的已編輯預覽，但隱藏工具進度行，請設定：

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

    若要保持工具進度可見，但隱藏指令/exec 文字，請設定：

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

    當你想顯示可見的工具進度，而不是把最終答案編輯進同一則訊息時，請使用 `progress` 模式。將命令文字政策放在 `streaming.progress` 底下：

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

    只有在你想要僅交付最終結果時，才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，一般工具/進度閒聊會被抑制，而不是作為獨立狀態訊息傳送。核准提示、媒體承載內容和錯誤仍會透過一般最終交付路徑送出。當你只想保留答案預覽編輯，同時隱藏工具進度狀態列時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 選取引文回覆是例外。當 `replyToMode` 為 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含選取的引文文字時，OpenClaw 會透過 Telegram 原生引文回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法在該回合顯示短狀態列。沒有選取引文文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引文回覆更重要時，請設定 `replyToMode: "off"`，或設定 `streaming.preview.toolProgress: false` 以確認這項取捨。
    </Note>

    對於純文字回覆：

    - 短 DM/群組/主題預覽：OpenClaw 會保留同一則預覽訊息，並就地執行最終編輯
    - 會拆成多則 Telegram 訊息的長文字最終結果，會在可行時重用既有預覽作為第一個最終區塊，然後只傳送剩餘區塊
    - 進度模式的最終結果會清除狀態草稿，並使用一般最終交付，而不是把草稿編輯成答案
    - 如果最終編輯在已完成文字確認前失敗，OpenClaw 會使用一般最終交付並清理過期的預覽

    對於複雜回覆（例如媒體承載內容），OpenClaw 會退回一般最終交付，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流以避免重複串流。

    僅限 Telegram 的推理串流：

    - `/reasoning stream` 會在生成期間將推理傳送到即時預覽
    - 推理預覽會在最終交付後刪除；當推理應保持可見時，請使用 `/reasoning on`
    - 最終答案會在不包含推理文字的情況下傳送

  </Accordion>

  <Accordion title="格式與 HTML 備援">
    傳出文字使用 Telegram `parse_mode: "HTML"`。

    - 類 Markdown 文字會轉譯為 Telegram 安全的 HTML。
    - 原始模型 HTML 會被逸出，以減少 Telegram 剖析失敗。
    - 如果 Telegram 拒絕已剖析的 HTML，OpenClaw 會以純文字重試。

    連結預覽預設啟用，並可透過 `channels.telegram.linkPreview: false` 停用。

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
    - 衝突/重複項目會被略過並記錄

    注意事項：

    - 自訂命令只是選單項目；它們不會自動實作行為
    - 即使未顯示在 Telegram 選單中，plugin/skill 命令在輸入時仍可運作

    如果停用原生命令，內建命令會被移除。自訂/plugin 命令若已設定，仍可註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在裁剪後仍然溢出；請減少 plugin/skill/自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 命令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並出現 `404: Not Found`，可能表示 `channels.telegram.apiRoot` 被設定為完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只包含 Bot API 根路徑，而 `openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕已設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會回報為 Webhook 清理失敗。
    - `setMyCommands failed` 搭配網路/fetch 錯誤通常表示對 `api.telegram.org` 的傳出 DNS/HTTPS 被封鎖。

    ### 裝置配對命令（`device-pair` plugin）

    安裝 `device-pair` plugin 時：

    1. `/pair` 會產生設定碼
    2. 在 iOS app 中貼上代碼
    3. `/pair pending` 會列出待處理請求（包括角色/範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - `/pair approve` 用於只有一個待處理請求的情況
       - `/pair approve latest` 用於最近一筆

    設定碼帶有短效 bootstrap 權杖。內建 bootstrap 交接會將主要節點權杖保持在 `scopes: []`；任何交接的操作員權杖都會限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。Bootstrap 範圍檢查會加上角色前綴，因此該操作員允許清單只會滿足操作員請求；非操作員角色仍需要其自身角色前綴下的範圍。

    如果裝置以變更後的驗證詳細資料重試（例如角色/範圍/公開金鑰），先前的待處理請求會被取代，且新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

    更多詳細資訊：[配對](/zh-TW/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="內嵌按鈕">
    設定內嵌鍵盤範圍：

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

    每帳戶覆寫：

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

    回呼點擊會以文字形式傳給 agent：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Agent 與自動化的 Telegram 訊息動作">
    Telegram 工具動作包括：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作公開易用別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘控控制項：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有個別的 `channels.telegram.actions.*` 切換。
    執行階段傳送會使用作用中的設定/秘密快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆執行緒標籤">
    Telegram 支援在生成輸出中使用明確的回覆執行緒標籤：

    - `[[reply_to_current]]` 回覆觸發訊息
    - `[[reply_to:<id>]]` 回覆特定 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    當回覆執行緒已啟用，且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引文摘錄。Telegram 將原生引文文字限制為 1024 個 UTF-16 程式碼單元，因此較長訊息會從開頭引用，並在 Telegram 拒絕引文時退回純回覆。

    注意：`off` 會停用隱含回覆執行緒。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與執行緒行為">
    論壇超級群組：

    - 主題工作階段鍵會附加 `:topic:<threadId>`
    - 回覆與輸入中狀態會以主題執行緒為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入中動作仍會包含 `message_thread_id`

    主題繼承：主題項目會繼承群組設定，除非被覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題使用，且不會繼承群組預設值。

    **每主題 agent 路由**：每個主題都可以透過在主題設定中設定 `agentId`，路由到不同 agent。這讓每個主題都有自己隔離的工作區、記憶體和工作階段。範例：

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

    每個主題接著都有自己的工作階段鍵：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 主題繫結**：論壇主題可透過頂層型別化 ACP 繫結，釘選 ACP harness 工作階段（`bindings[]` 搭配 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及類似 `-1001234567890:topic:42` 的主題限定 ID）。目前範圍限定為群組/超級群組中的論壇主題。請參閱 [ACP Agents](/zh-TW/tools/acp-agents)。

    **從聊天產生執行緒繫結 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由到該處。OpenClaw 會在主題中釘選產生確認。需要保持啟用 `channels.telegram.threadBindings.spawnSessions`（預設：`true`）。

    範本內容脈絡會公開 `MessageThreadId` 和 `IsForum`。帶有 `message_thread_id` 的私訊聊天預設會在扁平工作階段保留私訊路由與回覆中繼資料；只有在設定 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true` 或相符的主題設定時，才會使用感知討論串的工作階段鍵。使用頂層 `channels.telegram.dm.threadReplies` 作為帳號預設值，或使用 `direct.<chatId>.threadReplies` 設定單一私訊。

  </Accordion>

  <Accordion title="音訊、影片和貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。

    - 預設：音訊檔案行為
    - 在代理回覆中加上標籤 `[[audio_as_voice]]`，強制以語音訊息傳送
    - 傳入語音訊息的轉錄會在代理內容脈絡中標記為機器產生、
      不受信任的文字；提及偵測仍使用原始轉錄，
      因此需要提及才觸發的語音訊息仍可運作。

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

    Telegram 會區分影片檔案與圓形影片訊息。

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

    圓形影片訊息不支援說明文字；提供的訊息文字會另外傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（佔位符 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖內容脈絡欄位：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    貼圖快取檔案：

    - `~/.openclaw/telegram/sticker-cache.json`

    貼圖會描述一次（可行時）並快取，以減少重複的視覺模型呼叫。

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

    啟用後，OpenClaw 會將這類系統事件排入佇列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`: `off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（預設：`minimal`）

    備註：

    - `own` 表示僅限使用者對機器人傳送訊息的反應（盡力透過已傳送訊息快取判斷）。
    - 反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被丟棄。
    - Telegram 不會在反應更新中提供討論串 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組的一般主題工作階段（`:topic:1`），而不是確切的原始主題

    輪詢/Webhook 的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="確認反應">
    在 OpenClaw 處理傳入訊息時，`ackReaction` 會傳送確認表情符號。

    解析順序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號備援（`agents.list[].identity.emoji`，否則 "👀"）

    備註：

    - Telegram 預期使用 Unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用某個頻道或帳號的反應。

  </Accordion>

  <Accordion title="Telegram 事件與命令的設定寫入">
    頻道設定寫入預設啟用（`configWrites !== false`）。

    由 Telegram 觸發的寫入包括：

    - 群組遷移事件（`migrate_to_chat_id`），用來更新 `channels.telegram.groups`
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
    預設為長輪詢。若要使用 Webhook 模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可選用 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在長輪詢模式中，OpenClaw 只會在更新成功分派後保存其重新啟動水位標記。如果處理常式失敗，該更新在同一個程序中仍可重試，且不會被寫入為已完成以供重新啟動去重使用。

    本機監聽器會繫結到 `127.0.0.1:8787`。若要使用公開入口流量，請在本機連接埠前放置反向代理，或有意設定 `webhookHost: "0.0.0.0"`。

    Webhook 模式會先驗證請求防護、Telegram 秘密權杖和 JSON 本文，才向 Telegram 傳回 `200`。
    接著 OpenClaw 會透過長輪詢使用的相同每聊天/每主題機器人通道非同步處理更新，因此緩慢的代理回合不會卡住 Telegram 的傳遞確認。

  </Accordion>

  <Accordion title="限制、重試和 CLI 目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會在依長度拆分前優先使用段落邊界（空白行）。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入與傳出 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其分派為單一傳入訊息前要緩衝多久。如果相簿部分較晚抵達，請提高此值；若要降低相簿回覆延遲，請降低此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則套用 grammY 預設值）。機器人用戶端會將設定值限制在 60 秒傳出文字/正在輸入請求防護以下，讓 grammY 不會在 OpenClaw 的傳輸防護與備援可執行前就中止可見回覆傳遞。長輪詢仍會使用 45 秒的 `getUpdates` 請求防護，讓閒置輪詢不會無限期擱置。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；僅在輪詢停滯重新啟動出現誤判時，才在 `30000` 和 `600000` 之間調整。
    - 群組內容脈絡歷史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 回覆/引用/轉傳的補充內容脈絡目前會依收到的原樣傳遞。
    - Telegram 允許清單主要用來控管誰可以觸發代理，而不是完整的補充內容脈絡遮蔽邊界。
    - 私訊歷史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用到 Telegram 傳送輔助工具（CLI/工具/動作）的可復原傳出 API 錯誤。傳入最終回覆傳遞也會針對 Telegram 連線前失敗使用有界限的安全傳送重試，但不會重試傳送後狀態不明、可能造成可見訊息重複的網路封裝。

    CLI 和訊息工具的傳送目標可以是數字聊天 ID、使用者名稱或論壇主題目標：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram 投票使用 `openclaw message poll`，並支援論壇主題：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    僅限 Telegram 的投票旗標：

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - 當 `channels.telegram.capabilities.inlineButtons` 允許時，使用帶有 `buttons` 區塊的 `--presentation` 來提供內嵌鍵盤
    - 當機器人能在該聊天置頂時，使用 `--pin` 或 `--delivery '{"pin":true}'` 要求置頂傳遞
    - 使用 `--force-document` 將傳出圖片與 GIF 以文件傳送，而不是壓縮相片或動畫媒體上傳

    動作門控：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出的 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用 Telegram 投票建立，同時保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中進行執行核准，並可選擇在原始聊天或主題中張貼提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（當至少一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（回退使用 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（預設）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以和機器人對話，以及它將一般回覆傳送到哪裡。它們不會讓某人成為執行核准者。當尚未有命令擁有者時，第一次核准的私訊配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，而不需要在 `execApprovals.approvers` 下重複 ID。

    頻道傳遞會在聊天中顯示命令文字；僅在受信任的群組/主題中啟用 `channel` 或 `both`。當提示送達論壇主題時，OpenClaw 會保留該主題供核准提示和後續訊息使用。執行核准預設會在 30 分鐘後過期。

    內嵌核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過 Plugin 核准解析；其他 ID 會先透過執行核准解析。

    請參閱 [執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到傳遞或提供者錯誤時，Telegram 可以回覆錯誤文字，或將其抑制。兩個設定鍵會控制此行為：

| 鍵                                  | 值                | 預設值  | 說明                                                                                             |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 會將友善的錯誤訊息傳送到聊天。`silent` 會完全抑制錯誤回覆。                              |
| `channels.telegram.errorCooldownMs` | 數字（毫秒）      | `60000` | 對同一聊天傳送錯誤回覆的最短間隔。防止中斷期間發生錯誤洗版。                                     |

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
  <Accordion title="機器人沒有回應群組中未提及的訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather：`/setprivacy` -> Disable
      - 然後將機器人從群組移除並重新加入
    - 當設定預期接收未提及的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法進行成員資格探測。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列在其中（或包含 `"*"`）
    - 確認機器人是群組成員
    - 檢閱日誌：使用 `openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="指令部分可用或完全不可用">

    - 授權你的傳送者身分（配對及／或數字 `allowFrom`）
    - 即使群組政策是 `open`，指令授權仍然適用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單項目太多；請減少 Plugin／Skills／自訂指令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入狀態呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續性的網路／fetch 錯誤通常表示到 `api.telegram.org` 的 DNS/HTTPS 可達性有問題

  </Accordion>

  <Accordion title="啟動回報未授權的權杖">

    - `getMe returned 401` 是已設定機器人權杖的 Telegram 驗證失敗。
    - 在 BotFather 中重新複製或重新產生機器人權杖，然後更新預設帳號的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將它視為「不存在 webhook」只會把同一個錯誤權杖失敗延後到之後的 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - Node 22+ 搭配自訂 fetch／proxy 時，如果 AbortSignal 類型不相符，可能會觸發立即中止行為。
    - 有些主機會先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 輸出可能造成間歇性的 Telegram API 失敗。
    - 如果日誌包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些視為可復原的網路錯誤並重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此執行器在第一次 `getUpdates` 前不需要第二次 `getMe`。
    - 如果在輪詢啟動期間 `deleteWebhook` 因暫時性網路錯誤而失敗，OpenClaw 會繼續進入長輪詢，而不是再進行另一個輪詢前控制平面呼叫。仍在作用中的 webhook 會以 `getUpdates` 衝突呈現；接著 OpenClaw 會重建 Telegram 傳輸並重試 webhook 清理。
    - 如果 Telegram socket 以短而固定的週期回收，請檢查 `channels.telegram.timeoutSeconds` 是否過低；機器人用戶端會將低於輸出與 `getUpdates` 請求保護值的設定值夾限，但舊版在此值低於那些保護值時，可能會在每次輪詢或回覆時中止。
    - 如果日誌包含 `Polling stall detected`，OpenClaw 預設會在 120 秒內沒有完成的長輪詢存活訊號後重新啟動輪詢，並重建 Telegram 傳輸。
    - 當執行中的輪詢帳號在啟動寬限後尚未完成 `getUpdates`、執行中的 webhook 帳號在啟動寬限後尚未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過舊時，`openclaw channels status --probe` 和 `openclaw doctor` 會發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫健康，但你的主機仍回報誤判的輪詢停滯重啟時，才增加 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 輸出問題。
    - Telegram 也會遵循 Bot API 傳輸的程序 proxy 環境變數，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可繞過 `api.telegram.org`。
    - 如果 OpenClaw 受管 proxy 在服務環境中透過 `OPENCLAW_PROXY_URL` 設定，且不存在標準 proxy 環境變數，Telegram 也會使用該 URL 進行 Bot API 傳輸。
    - 在直接輸出／TLS 不穩定的 VPS 主機上，透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再到程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不適用，Node 22+ 會退回 `ipv4first`。
    - 如果你的主機是 WSL2，或明確在僅 IPv4 行為下運作較佳，請強制選擇位址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準測試範圍回應（`198.18.0.0/15`）預設已允許
      用於 Telegram 媒體下載。如果受信任的假 IP 或
      透明 proxy 在媒體下載期間將 `api.telegram.org` 重寫為其他
      私人／內部／特殊用途位址，你可以選擇啟用僅限 Telegram 的繞過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 相同的選擇啟用也可在每個帳號的
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 使用。
    - 如果你的 proxy 將 Telegram 媒體主機解析到 `198.18.x.x`，請先保持
      危險旗標關閉。Telegram 媒體預設已允許 RFC 2544
      基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 防護。僅在受信任、由操作員控制的 proxy
      環境中使用，例如 Clash、Mihomo 或 Surge 假 IP 路由，且它們
      合成 RFC 2544 基準測試範圍之外的私人或特殊用途回應時。
      一般公開網際網路 Telegram 存取請保持關閉。
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

更多協助：[頻道疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="高訊號 Telegram 欄位">

- 啟動／驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
- 指令／選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒／回覆：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式／傳送：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒體／網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅限 Bot API 根目錄；請勿包含 `/bot<TOKEN>`）
- Webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作／能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 回應表情：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入／歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個或更多帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明確指定預設路由。否則 OpenClaw 會退回第一個正規化的帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到 Gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組與主題允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組與主題對應至代理。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷。
  </Card>
</CardGroup>
