---
read_when:
    - 開發 Telegram 功能或 Webhook
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

可透過 grammY 用於正式環境中的機器人 DM 與群組。長輪詢是預設模式；Webhook 模式為選用。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設 DM 政策是配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復手冊。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="在 BotFather 建立機器人權杖">
    開啟 Telegram 並與 **@BotFather** 對話（確認帳號名稱正好是 `@BotFather`）。

    執行 `/newbot`，依照提示操作，並儲存權杖。

  </Step>

  <Step title="設定權杖與 DM 政策">

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

    環境變數備援：`TELEGRAM_BOT_TOKEN=...`（僅限預設帳戶）。
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/環境變數中設定權杖，然後啟動 gateway。

  </Step>

  <Step title="啟動 gateway 並核准第一個 DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>

  <Step title="將機器人加入群組">
    將機器人加入你的群組，然後取得群組存取需要的兩個 ID：

    - 你的 Telegram 使用者 ID，用於 `allowFrom` / `groupAllowFrom`
    - Telegram 群組聊天 ID，作為 `channels.telegram.groups` 底下的鍵

    第一次設定時，請從 `openclaw logs --follow`、轉發 ID 機器人，或 Bot API `getUpdates` 取得群組聊天 ID。允許群組後，`/whoami@<bot_username>` 可以確認使用者與群組 ID。

    以 `-100` 開頭的負數 Telegram 超級群組 ID 是群組聊天 ID。請將它們放在 `channels.telegram.groups` 底下，不要放在 `groupAllowFrom` 底下。

  </Step>
</Steps>

<Note>
權杖解析順序會感知帳戶。實務上，設定值優先於環境變數備援，而 `TELEGRAM_BOT_TOKEN` 只適用於預設帳戶。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="隱私模式與群組可見性">
    Telegram 機器人預設使用**隱私模式**，這會限制它們接收的群組訊息。

    如果機器人必須看見所有群組訊息，請擇一：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將機器人設為群組管理員。

    切換隱私模式時，請在每個群組中移除並重新加入機器人，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="群組權限">
    管理員狀態是在 Telegram 群組設定中控制。

    管理員機器人會接收所有群組訊息，這對常駐群組行為很有用。

  </Accordion>

  <Accordion title="實用的 BotFather 切換項目">

    - `/setjoingroups` 用於允許/拒絕加入群組
    - `/setprivacy` 用於群組可見性行為

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

<Tabs>
  <Tab title="DM 政策">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（需要 `allowFrom` 中至少有一個寄件者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到機器人使用者名稱的 Telegram 帳戶都能指令機器人。只應將它用於刻意公開、且工具受到嚴格限制的機器人；單一擁有者機器人應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳戶設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳戶層級的 `allowFrom: ["*"]` 項目不會讓該帳戶公開，除非合併後的有效帳戶允許清單仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有 DM，且會被設定驗證拒絕。
    設定流程只會要求數字使用者 ID。
    如果你已升級，且設定包含 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram 機器人權杖）。
    如果你先前依賴配對儲存允許清單檔案，`openclaw doctor --fix` 可以在允許清單流程中將項目復原到 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 還沒有明確 ID 時）。

    對於單一擁有者機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，讓存取政策持久保存在設定中（而不是依賴先前的配對核准）。

    常見混淆：DM 配對核准不代表「此寄件者在所有地方都已授權」。
    配對授予 DM 存取權。如果尚未存在指令擁有者，第一個已核准的配對也會設定 `commands.ownerAllowFrom`，讓僅擁有者指令與 exec 核准擁有明確的操作員帳戶。
    群組寄件者授權仍來自明確設定的允許清單。
    如果你想要「我授權一次後，DM 與群組指令都能使用」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅擁有者指令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（不使用第三方機器人）：

    1. DM 你的機器人。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（較不私密）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群組政策與允許清單">
    兩項控制會一起套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都能通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為允許清單（明確 ID 或 `"*"`）

    2. **群組中允許哪些寄件者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組寄件者篩選。如果未設定，Telegram 會退回使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    不要將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 屬於 `channels.telegram.groups` 底下。
    非數字項目會在寄件者授權時被忽略。
    安全邊界（`2026.2.25+`）：群組寄件者驗證**不會**繼承 DM 配對儲存核准。
    配對維持僅限 DM。對於群組，請設定 `groupAllowFrom` 或各群組/各主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會退回使用設定中的 `allowFrom`，而不是配對儲存。
    單一擁有者機器人的實務模式：在 `channels.telegram.allowFrom` 設定你的使用者 ID，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 底下允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，執行階段會預設為失敗關閉的 `groupPolicy="allowlist"`，除非明確設定 `channels.defaults.groupPolicy`。

    僅擁有者群組設定：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    從群組使用 `@<bot_username> ping` 測試。在 `requireMention: true` 時，一般群組訊息不會觸發機器人。

    範例：允許某個特定群組中的任何成員：

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

    範例：只允許某個特定群組中的特定使用者：

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

      - 將像 `-1001234567890` 這類負數 Telegram 群組或超級群組聊天 ID 放在 `channels.telegram.groups` 底下。
      - 當你想限制允許群組內哪些人可以觸發機器人時，請將像 `8734062810` 這類 Telegram 使用者 ID 放在 `groupAllowFrom` 底下。
      - 只有在你希望允許群組中的任何成員都能與機器人對話時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行為">
    群組回覆預設需要提及。

    提及可以來自：

    - 原生 `@botusername` 提及，或
    - 下列項目中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    工作階段層級指令切換：

    - `/activation always`
    - `/activation mention`

    這些只會更新工作階段狀態。若要持久保存，請使用設定。

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

    - 將群組訊息轉發給 `@userinfobot` / `@getidsbot`
    - 或從 `openclaw logs --follow` 讀取 `chat.id`
    - 或檢查 Bot API `getUpdates`
    - 在允許群組後，如果已啟用原生指令，請執行 `/whoami@<bot_username>`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由 gateway 程序擁有。
- 路由是決定性的：Telegram 傳入會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共用頻道信封，並包含回覆中繼資料、媒體預留位置，以及 gateway 已觀察到之 Telegram 回覆的持久化回覆鏈脈絡。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>`，以保持主題隔離。
- DM 訊息可以帶有 `message_thread_id`；OpenClaw 會為回覆保留執行緒 ID，但預設會讓 DM 維持在扁平工作階段。當你刻意需要 DM 主題工作階段隔離時，請設定 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`，或相符的主題設定。
- 長輪詢使用 grammY runner，並採用每聊天/每執行緒排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 長輪詢會在每個 gateway 程序內受到保護，因此一次只能有一個作用中輪詢器使用一個機器人權杖。如果你仍看到 `getUpdates` 409 衝突，可能有另一個 OpenClaw gateway、指令碼或外部輪詢器正在使用相同權杖。
- 長輪詢看門狗重新啟動預設會在 120 秒內沒有完成的 `getUpdates` 存活性後觸發。只有當你的部署在長時間工作期間仍出現誤判的輪詢停滯重新啟動時，才增加 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍為 `30000` 到 `600000`；支援個別帳戶覆寫。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 為 `off | partial | block | progress`（預設：`partial`）
    - `progress` 會為工具進度保留一則可編輯的狀態草稿，在完成時清除，並將最終答案作為一般訊息傳送
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用同一則已編輯的預覽訊息（預設：預覽串流啟用時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度列中的命令/執行詳細資訊：`raw`（預設，保留已發布行為）或 `status`（僅工具標籤）
    - 會偵測舊版 `channels.telegram.streamMode` 與布林值 `streaming`；執行 `openclaw doctor --fix` 將其遷移至 `channels.telegram.streaming.mode`

    工具進度預覽更新是在工具執行時顯示的簡短狀態列，例如命令執行、檔案讀取、規劃更新或修補摘要。Telegram 預設會保持啟用，以符合 `v2026.4.22` 及之後版本已發布的 OpenClaw 行為。若要保留答案文字的已編輯預覽，但隱藏工具進度列，請設定：

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

    若要保持工具進度可見，但隱藏命令/執行文字，請設定：

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

    當你想要顯示可見的工具進度，但不將最終答案編輯進同一則訊息時，請使用 `progress` 模式。將命令文字政策放在 `streaming.progress` 下：

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

    只有在你想要僅傳送最終內容時，才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，而通用工具/進度閒聊會被抑制，不會作為獨立狀態訊息傳送。核准提示、媒體承載與錯誤仍會透過一般最終傳送路徑路由。當你只想保留答案預覽編輯並隱藏工具進度狀態列時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 已選取引用回覆是例外。當 `replyToMode` 為 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含已選取引用文字時，OpenClaw 會透過 Telegram 的原生引用回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法在該回合顯示簡短狀態列。沒有已選取引用文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引用回覆更重要時，請設定 `replyToMode: "off"`，或設定 `streaming.preview.toolProgress: false` 以確認此取捨。
    </Note>

    對於純文字回覆：

    - 簡短 DM/群組/主題預覽：OpenClaw 保留同一則預覽訊息，並就地執行最終編輯
    - 會拆分成多則 Telegram 訊息的長文字最終內容，會在可行時將現有預覽重用為第一個最終片段，然後只傳送剩餘片段
    - 進度模式最終內容會清除狀態草稿，並使用一般最終傳送，而不是將草稿編輯成答案
    - 如果在完成文字確認前最終編輯失敗，OpenClaw 會使用一般最終傳送，並清理過時的預覽

    對於複雜回覆（例如媒體承載），OpenClaw 會退回一般最終傳送，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免雙重串流。

    僅限 Telegram 的推理串流：

    - `/reasoning stream` 會在生成時將推理傳送至即時預覽
    - 最終傳送後會刪除推理預覽；當推理應保持可見時，請使用 `/reasoning on`
    - 最終答案會在不包含推理文字的情況下傳送

  </Accordion>

  <Accordion title="格式化與 HTML 後援">
    對外文字使用 Telegram `parse_mode: "HTML"`。

    - 類 Markdown 文字會轉譯為 Telegram 安全的 HTML。
    - 原始模型 HTML 會被逸出，以降低 Telegram 解析失敗。
    - 如果 Telegram 拒絕已解析的 HTML，OpenClaw 會以純文字重試。

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

    - 自訂命令僅為選單項目；它們不會自動實作行為
    - 即使未顯示在 Telegram 選單中，Plugin/skill 命令在輸入時仍可運作

    如果原生命令已停用，內建項目會被移除。若已設定，自訂/Plugin 命令仍可註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍然溢出；請減少 Plugin/skill/自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 命令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並顯示 `404: Not Found`，可能表示 `channels.telegram.apiRoot` 被設定為完整 `/bot<TOKEN>` 端點。`apiRoot` 必須只是 Bot API 根目錄，而 `openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕了已設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為 Webhook 清理失敗。
    - `setMyCommands failed` 搭配網路/擷取錯誤，通常表示連往 `api.telegram.org` 的對外 DNS/HTTPS 被封鎖。

    ### 裝置配對命令（`device-pair` plugin）

    安裝 `device-pair` plugin 時：

    1. `/pair` 產生設定碼
    2. 在 iOS app 中貼上程式碼
    3. `/pair pending` 列出待處理要求（包含角色/範圍）
    4. 核准要求：
       - `/pair approve <requestId>` 用於明確核准
       - 當只有一個待處理要求時，使用 `/pair approve`
       - `/pair approve latest` 用於最新要求

    設定碼攜帶短效啟動權杖。內建啟動交接會將主要節點權杖保持在 `scopes: []`；任何已交接的操作者權杖仍會限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 與 `operator.write`。啟動範圍檢查以角色作為前綴，因此該操作者允許清單只會滿足操作者要求；非操作者角色仍需要其自身角色前綴下的範圍。

    如果裝置以變更後的驗證詳細資訊重試（例如角色/範圍/公開金鑰），先前的待處理要求會被取代，而新要求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

    更多詳細資訊：[配對](/zh-TW/channels/pairing#pair-via-telegram-recommended-for-ios)。

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

    個別帳號覆寫：

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

    舊版 `capabilities: ["inlineButtons"]` 會對應至 `inlineButtons: "all"`。

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

  <Accordion title="用於 agent 與自動化的 Telegram 訊息動作">
    Telegram 工具動作包含：

    - `sendMessage`（`to`、`content`、選用的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、選用的 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作會公開符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 與 `topic-create` 目前預設啟用，且沒有獨立的 `channels.telegram.actions.*` 切換。
    執行階段傳送會使用作用中的設定/secret 快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆執行緒標籤">
    Telegram 支援在生成輸出中使用明確回覆執行緒標籤：

    - `[[reply_to_current]]` 回覆觸發訊息
    - `[[reply_to:<id>]]` 回覆特定 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    當回覆執行緒已啟用，且原始 Telegram 文字或說明文字可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 code units，因此較長的訊息會從開頭引用，如果 Telegram 拒絕引用，則退回純回覆。

    注意：`off` 會停用隱含回覆執行緒。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

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

    主題繼承：主題項目會繼承群組設定，除非已覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題，不會從群組預設值繼承。

    **個別主題 agent 路由**：每個主題都可透過在主題設定中設定 `agentId`，路由至不同的 agent。這讓每個主題都有自己的隔離工作區、記憶體與 session。範例：

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

    **持久 ACP 主題繫結**：論壇主題可以透過頂層具型別 ACP 繫結，釘選 ACP harness 工作階段（`bindings[]` 搭配 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及類似 `-1001234567890:topic:42` 的含主題 ID）。目前範圍限定於群組/超級群組中的論壇主題。請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

    **從聊天產生與執行緒繫結的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由到該處。OpenClaw 會在主題內釘選 spawn 確認訊息。需要保持啟用 `channels.telegram.threadBindings.spawnSessions`（預設：`true`）。

    範本情境會公開 `MessageThreadId` 和 `IsForum`。帶有 `message_thread_id` 的私訊聊天，預設仍會在扁平工作階段上保留私訊路由和回覆中繼資料；只有在設定 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true`，或相符的主題設定時，才會使用具執行緒感知的工作階段鍵。使用頂層 `channels.telegram.dm.threadReplies` 設定帳號預設值，或使用 `direct.<chatId>.threadReplies` 設定單一私訊。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。

    - 預設：音訊檔案行為
    - 在代理程式回覆中加上 `[[audio_as_voice]]` 標籤，可強制以語音訊息傳送
    - 入站語音訊息轉錄會在代理程式情境中包裝為機器生成、不受信任的文字；提及偵測仍會使用原始轉錄，因此以提及作為閘門的語音訊息會繼續運作。

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

    圓形影片訊息不支援說明文字；提供的訊息文字會分開傳送。

    ### 貼圖

    入站貼圖處理：

    - 靜態 WEBP：下載並處理（預留位置 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖情境欄位：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    貼圖快取檔案：

    - `~/.openclaw/telegram/sticker-cache.json`

    貼圖會在可行時描述一次並快取，以減少重複的視覺模型呼叫。

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
    Telegram 反應會以 `message_reaction` 更新傳入（與訊息承載資料分開）。

    啟用時，OpenClaw 會將如下的系統事件排入佇列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示只處理使用者對機器人傳送訊息的反應（盡力透過已傳送訊息快取判斷）。
    - 反應事件仍遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權傳送者會被丟棄。
    - Telegram 不會在反應更新中提供執行緒 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組一般主題工作階段（`:topic:1`），而不是實際來源主題

    輪詢/Webhook 的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理入站訊息時傳送確認用表情符號。

    解析順序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理程式身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 Unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用某個通道或帳號的反應。

  </Accordion>

  <Accordion title="來自 Telegram 事件與命令的設定寫入">
    通道設定寫入預設啟用（`configWrites !== false`）。

    由 Telegram 觸發的寫入包括：

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
    預設為長輪詢。若使用 Webhook 模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可選的 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在長輪詢模式中，OpenClaw 只有在更新成功分派後才會持久保存其重新啟動水位標記。如果 handler 失敗，該更新在同一行程中仍可重試，且不會被寫入為已完成來用於重新啟動去重。

    本機監聽器會繫結至 `127.0.0.1:8787`。若要公開入口流量，請在本機連接埠前放置反向代理，或刻意設定 `webhookHost: "0.0.0.0"`。

    Webhook 模式會先驗證請求防護、Telegram 秘密權杖與 JSON 主體，再向 Telegram 回傳 `200`。
    接著 OpenClaw 會透過與長輪詢相同的每聊天/每主題機器人處理佇列，非同步處理更新，因此較慢的代理程式回合不會阻塞 Telegram 的傳遞 ACK。

  </Accordion>

  <Accordion title="限制、重試與 CLI 目標">
    - `channels.telegram.textChunkLimit` 預設值為 4000。
    - `channels.telegram.chunkMode="newline"` 偏好在段落邊界（空白行）切分，再按長度切分。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制入站與出站 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其分派為一則入站訊息前緩衝多久。如果相簿部分抵達較晚，請增加此值；如果要降低相簿回覆延遲，請減少此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則套用 grammY 預設值）。機器人用戶端會將設定值限制在 60 秒出站文字/typing 請求防護以下，讓 grammY 不會在 OpenClaw 的傳輸防護和後援執行前，中止可見回覆傳遞。長輪詢仍使用 45 秒的 `getUpdates` 請求防護，讓閒置輪詢不會無限期掛起。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；只有在發生輪詢停滯重啟誤判時，才在 `30000` 到 `600000` 之間調整。
    - 群組情境歷史會使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 當 Gateway 已觀察到上層訊息時，回覆/引用/轉寄的補充情境會正規化到一個選定的對話情境視窗；已觀察訊息快取會持久保存在工作階段儲存旁。Telegram 在更新中只包含一層淺層 `reply_to_message`，因此早於快取的鏈結會受限於 Telegram 目前的更新承載資料。
    - Telegram 允許清單主要用於控管誰可以觸發代理程式，而不是完整的補充情境遮蔽邊界。
    - 私訊歷史控制項：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用到 Telegram 傳送輔助程式（CLI/工具/動作），用於可復原的出站 API 錯誤。入站最終回覆傳遞也會針對 Telegram 連線前失敗使用有界限的安全傳送重試，但不會重試可能造成可見訊息重複、狀態不明的傳送後網路結果。

    CLI 與 message-tool 傳送目標可以是數字聊天 ID、使用者名稱，或論壇主題目標：

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

    Telegram 專用投票旗標：

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - `--presentation` 搭配 `buttons` 區塊，可在 `channels.telegram.capabilities.inlineButtons` 允許時使用行內鍵盤
    - `--pin` 或 `--delivery '{"pin":true}'`，用於在機器人可在該聊天中釘選時要求釘選傳遞
    - `--force-document`，以文件傳送出站圖片、GIF 和影片，而非壓縮照片、動畫媒體或影片上傳

    動作閘控：

    - `channels.telegram.actions.sendMessage=false` 會停用出站 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用建立 Telegram 投票，但保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中進行執行核准，也可選擇在來源聊天或主題中張貼提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（至少有一位可解析的核准者時自動啟用）
    - `channels.telegram.execApprovals.approvers`（後援使用 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（預設）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以和機器人對話，以及機器人在哪裡傳送一般回覆。它們不會讓某人成為執行核准者。當尚未存在命令擁有者時，第一個已核准的私訊配對會引導建立 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，無需在 `execApprovals.approvers` 下重複 ID。

    通道傳遞會在聊天中顯示命令文字；只有在受信任的群組/主題中才啟用 `channel` 或 `both`。當提示落在論壇主題中時，OpenClaw 會為核准提示和後續訊息保留該主題。執行核准預設 30 分鐘後過期。

    行內核准按鈕還需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過 Plugin 核准解析；其他則會先透過執行核准解析。

    請參閱 [執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到遞送或提供者錯誤時，Telegram 可以回覆錯誤文字，也可以抑制該錯誤。兩個設定鍵會控制此行為：

| 鍵                                  | 值                | 預設值  | 說明                                                                                            |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 會向聊天傳送友善的錯誤訊息。`silent` 會完全抑制錯誤回覆。                              |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 對同一聊天傳送錯誤回覆的最短間隔。防止中斷期間出現錯誤垃圾訊息。                               |

支援個別帳戶、個別群組和個別主題的覆寫（與其他 Telegram 設定鍵使用相同繼承方式）。

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
  <Accordion title="機器人不回應群組中未提及它的訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather：`/setprivacy` -> Disable
      - 然後移除機器人並重新加入群組
    - 當設定預期接收未提及機器人的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法探測成員資格。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列在其中（或包含 `"*"`）
    - 驗證機器人在群組中的成員資格
    - 檢閱記錄：使用 `openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="命令只能部分運作或完全無法運作">

    - 授權你的傳送者身分（配對及/或數字 `allowFrom`）
    - 即使群組政策為 `open`，命令授權仍然適用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生命令選單有太多項目；請減少 Plugin/skill/自訂命令，或停用原生選單
    - 啟動時的 `deleteMyCommands` / `setMyCommands` 呼叫以及 `sendChatAction` 輸入狀態呼叫都有界限，且會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續的網路/擷取錯誤通常表示到 `api.telegram.org` 的 DNS/HTTPS 可達性有問題

  </Accordion>

  <Accordion title="啟動時回報未授權的權杖">

    - `getMe returned 401` 是已設定機器人權杖的 Telegram 驗證失敗。
    - 在 BotFather 中重新複製或重新產生機器人權杖，然後更新預設帳戶的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；把它當成「不存在 Webhook」只會把相同的錯誤權杖失敗延後到稍後的 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - Node 22+ 加上自訂 fetch/proxy 時，如果 AbortSignal 型別不相符，可能觸發立即中止行為。
    - 有些主機會先將 `api.telegram.org` 解析為 IPv6；故障的 IPv6 輸出可能導致 Telegram API 間歇性失敗。
    - 如果記錄包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些視為可復原的網路錯誤並重試。
    - 輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此執行器在第一次 `getUpdates` 前不需要第二次 `getMe`。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤失敗，OpenClaw 會繼續進入長輪詢，而不是再發出另一個輪詢前控制平面呼叫。仍在作用中的 Webhook 會顯示為 `getUpdates` 衝突；OpenClaw 接著會重建 Telegram 傳輸並重試 Webhook 清理。
    - 如果 Telegram socket 以短且固定的節奏回收，請檢查 `channels.telegram.timeoutSeconds` 是否過低；機器人用戶端會將低於輸出和 `getUpdates` 請求保護值的設定值限縮，但舊版可能在此值低於這些保護值時，每次輪詢或回覆都中止。
    - 如果記錄包含 `Polling stall detected`，OpenClaw 預設會在 120 秒內沒有完成長輪詢存活訊號後重新啟動輪詢並重建 Telegram 傳輸。
    - 當執行中的輪詢帳戶在啟動寬限期後尚未完成 `getUpdates`、執行中的 Webhook 帳戶在啟動寬限期後尚未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過期時，`openclaw channels status --probe` 和 `openclaw doctor` 會發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫健康，但你的主機仍回報誤判的輪詢停滯重啟時，才提高 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 輸出問題。
    - Telegram 也會針對 Bot API 傳輸遵循程序 proxy 環境變數，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可略過 `api.telegram.org`。
    - 如果 OpenClaw 受管理的 proxy 是透過服務環境的 `OPENCLAW_PROXY_URL` 設定，且沒有標準 proxy 環境變數，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接輸出/TLS 不穩定的 VPS 主機上，請透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會先遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`，再遵循 `channels.telegram.network.dnsResultOrder`，再遵循程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不適用，Node 22+ 會回退到 `ipv4first`。
    - 如果你的主機是 WSL2，或明確在僅 IPv4 行為下運作較佳，請強制選擇位址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準測試範圍回答（`198.18.0.0/15`）預設已允許
      用於 Telegram 媒體下載。如果受信任的 fake-IP 或
      透明 proxy 在媒體下載期間將 `api.telegram.org` 重寫為其他
      私有/內部/特殊用途位址，你可以選擇啟用
      僅限 Telegram 的略過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 相同的選擇啟用也可在每個帳戶使用：
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的 proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先保持
      危險旗標關閉。Telegram 媒體已預設允許 RFC 2544
      基準範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 保護。僅在受信任、由操作員控制的 proxy
      環境中使用，例如 Clash、Mihomo 或 Surge fake-IP 路由，且它們
      合成 RFC 2544 基準範圍之外的私有或特殊用途回答時。
      一般公開網際網路 Telegram 存取請保持關閉。
    </Warning>

    - 環境覆寫（暫時）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 驗證 DNS 回答：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多協助：[通道疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="高訊號 Telegram 欄位">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
- 命令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 討論串/回覆：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/遞送：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根路徑：`apiRoot`（僅 Bot API 根路徑；不要包含 `/bot<TOKEN>`）
- Webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 反應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入/歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳戶優先順序：設定兩個以上帳戶 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明確指定預設路由。否則 OpenClaw 會回退到第一個正規化帳戶 ID，且 `openclaw doctor` 會發出警告。具名帳戶會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到 Gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組與主題允許清單行為。
  </Card>
  <Card title="通道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組和主題對應到代理。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷。
  </Card>
</CardGroup>
