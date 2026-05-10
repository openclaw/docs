---
read_when:
    - 處理 Telegram 功能或 Webhook
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

可用於 bot 私訊和群組的正式環境，基於 grammY。預設模式是長輪詢；webhook 模式是選用的。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復作業手冊。
  </Card>
  <Card title="Gateway 設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="在 BotFather 建立 bot 權杖">
    開啟 Telegram 並與 **@BotFather** 對話（確認帳號正好是 `@BotFather`）。

    執行 `/newbot`，依提示操作，並儲存權杖。

  </Step>

  <Step title="設定權杖與私訊政策">

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

    環境變數備援：`TELEGRAM_BOT_TOKEN=...`（僅預設帳號）。
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/環境變數中設定權杖，然後啟動 gateway。

  </Step>

  <Step title="啟動 gateway 並核准第一則私訊">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>

  <Step title="將 bot 加入群組">
    將 bot 加入你的群組，然後設定 `channels.telegram.groups` 與 `groupPolicy`，使其符合你的存取模型。
  </Step>
</Steps>

<Note>
權杖解析順序會感知帳號。實務上，設定值優先於環境變數備援，而 `TELEGRAM_BOT_TOKEN` 只套用到預設帳號。
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

    管理員 bot 會接收所有群組訊息，這對於常駐群組行為很有用。

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

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到 bot 使用者名稱的 Telegram 帳號都能指揮 bot。只應在刻意公開、且工具受到嚴格限制的 bot 上使用；單一擁有者 bot 應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴可接受並會正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：除非合併後的有效帳號 allowlist 仍包含明確萬用字元，否則帳號層級的 `allowFrom: ["*"]` 項目不會讓該帳號公開。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會阻擋所有私訊，並會被設定驗證拒絕。
    設定流程只會要求數字使用者 ID。
    如果你已升級且設定包含 `@username` allowlist 項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram bot 權杖）。
    如果你先前依賴配對儲存區 allowlist 檔案，`openclaw doctor --fix` 可以在 allowlist 流程中將項目復原到 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者 bot，建議使用 `dmPolicy: "allowlist"` 搭配明確數字 `allowFrom` ID，讓存取政策在設定中保持持久（而不是依賴先前的配對核准）。

    常見混淆：私訊配對核准不代表「此寄件者在所有地方都已獲授權」。
    配對會授予私訊存取權。如果尚無命令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅擁有者可用的命令與 exec 核准有明確的操作者帳號。
    群組寄件者授權仍來自明確設定的 allowlist。
    如果你想要「我授權一次後，私訊與群組命令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅擁有者可用的命令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全方式（不使用第三方 bot）：

    1. 私訊你的 bot。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（較不私密）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群組政策與 allowlist">
    兩項控制會一起套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都可通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被阻擋，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為 allowlist（明確 ID 或 `"*"`）

    2. **群組中允許哪些寄件者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組寄件者篩選。如果未設定，Telegram 會退回使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會正規化）。
    不要將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 應放在 `channels.telegram.groups` 下。
    非數字項目會在寄件者授權中被忽略。
    安全邊界（`2026.2.25+`）：群組寄件者驗證**不會**繼承私訊配對儲存區核准。
    配對僅限私訊。對於群組，請設定 `groupAllowFrom` 或每個群組/每個主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會退回使用設定中的 `allowFrom`，而不是配對儲存區。
    單一擁有者 bot 的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 下允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，除非明確設定了 `channels.defaults.groupPolicy`，否則執行階段會預設為 fail-closed `groupPolicy="allowlist"`。

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
      常見錯誤：`groupAllowFrom` 不是 Telegram 群組 allowlist。

      - 將像 `-1001234567890` 這類負數 Telegram 群組或超級群組聊天 ID 放在 `channels.telegram.groups` 下。
      - 當你想限制允許群組中哪些人可以觸發 bot 時，請將像 `8734062810` 這類 Telegram 使用者 ID 放在 `groupAllowFrom` 下。
      - 只有在你希望允許群組的任何成員都能與 bot 對話時，才使用 `groupAllowFrom: ["*"]`。

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

    - 將群組訊息轉寄到 `@userinfobot` / `@getidsbot`
    - 或從 `openclaw logs --follow` 讀取 `chat.id`
    - 或檢查 Bot API `getUpdates`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由 gateway 程序擁有。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共用頻道信封，包含回覆中繼資料、媒體預留位置，以及 gateway 已觀察到的 Telegram 回覆所保存的回覆鏈脈絡。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>` 以保持主題隔離。
- 私訊訊息可攜帶 `message_thread_id`；OpenClaw 會保留執行緒 ID 供回覆使用，但預設會讓私訊維持在扁平工作階段。當你刻意想要私訊主題工作階段隔離時，請設定 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`，或相符的主題設定。
- 長輪詢使用 grammY runner，並採用每個聊天/每個執行緒排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 長輪詢會在每個 gateway 程序內受到保護，因此一次只能有一個作用中 poller 使用 bot 權杖。如果你仍看到 `getUpdates` 409 衝突，可能是另一個 OpenClaw gateway、腳本或外部 poller 正在使用相同權杖。
- 長輪詢看門狗預設會在 120 秒內沒有完成的 `getUpdates` 存活狀態後觸發重新啟動。只有在部署仍於長時間工作期間看到誤判的輪詢停滯重新啟動時，才增加 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍為 `30000` 到 `600000`；支援每帳號覆寫。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 為 `off | partial | block | progress`（預設：`partial`）
    - `progress` 會為工具進度保留一則可編輯的狀態草稿，在完成時清除，並以一般訊息傳送最終答案
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用相同的已編輯預覽訊息（預設：預覽串流啟用時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度行中的命令/exec 詳細資訊：`raw`（預設，保留已發布行為）或 `status`（僅工具標籤）
    - 會偵測舊版 `channels.telegram.streamMode` 與布林 `streaming` 值；執行 `openclaw doctor --fix` 以將它們遷移至 `channels.telegram.streaming.mode`

    工具進度預覽更新是在工具執行時顯示的短狀態行，例如命令執行、檔案讀取、規劃更新或修補摘要。Telegram 預設保持啟用這些項目，以符合 `v2026.4.22` 及更新版本中已發布的 OpenClaw 行為。若要保留答案文字的已編輯預覽，但隱藏工具進度行，請設定：

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

    若要保留工具進度可見，但隱藏指令/執行文字，請設定：

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

    當你想要顯示工具進度，但不想把最終回答編輯進同一則訊息時，請使用 `progress` 模式。將指令文字政策放在 `streaming.progress` 底下：

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

    只有在你想要僅傳送最終內容時，才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，而一般工具/進度閒聊會被抑制，不會作為獨立狀態訊息傳送。核准提示、媒體酬載與錯誤仍會透過一般最終傳送路徑處理。當你只想保留回答預覽編輯，同時隱藏工具進度狀態列時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 選取引用回覆是例外。當 `replyToMode` 為 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含選取的引用文字時，OpenClaw 會透過 Telegram 原生引用回覆路徑傳送最終回答，而不是編輯回答預覽，因此 `streaming.preview.toolProgress` 無法在該回合顯示簡短狀態列。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引用回覆更重要時，請設定 `replyToMode: "off"`；或設定 `streaming.preview.toolProgress: false` 以明確接受此取捨。
    </Note>

    對於純文字回覆：

    - 短 DM/群組/主題預覽：OpenClaw 會保留同一則預覽訊息，並就地執行最終編輯
    - 會拆成多則 Telegram 訊息的長文字最終內容，會在可行時重用現有預覽作為第一個最終片段，然後只傳送剩餘片段
    - 進度模式的最終內容會清除狀態草稿，並使用一般最終傳送，而不是把草稿編輯成回答
    - 如果最終編輯在完成文字確認前失敗，OpenClaw 會使用一般最終傳送，並清理過期的預覽

    對於複雜回覆（例如媒體酬載），OpenClaw 會退回使用一般最終傳送，然後清理預覽訊息。

    預覽串流獨立於區塊串流。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流以避免雙重串流。

    僅限 Telegram 的推理串流：

    - `/reasoning stream` 會在生成期間將推理傳送到即時預覽
    - 推理預覽會在最終傳送後刪除；當推理應保持可見時，請使用 `/reasoning on`
    - 最終回答傳送時不會包含推理文字

  </Accordion>

  <Accordion title="格式化與 HTML 後援">
    傳出文字使用 Telegram `parse_mode: "HTML"`。

    - 類似 Markdown 的文字會轉譯為 Telegram 安全的 HTML。
    - 原始模型 HTML 會被逸出，以減少 Telegram 解析失敗。
    - 如果 Telegram 拒絕已解析的 HTML，OpenClaw 會以純文字重試。

    連結預覽預設啟用，可用 `channels.telegram.linkPreview: false` 停用。

  </Accordion>

  <Accordion title="原生指令與自訂指令">
    Telegram 指令選單註冊會在啟動時透過 `setMyCommands` 處理。

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

    注意：

    - 自訂指令只是選單項目；它們不會自動實作行為
    - 即使未顯示在 Telegram 選單中，Plugin/Skills 指令在輸入時仍可運作

    如果原生指令停用，內建項目會被移除。若已設定，自訂/Plugin 指令仍可能註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍然超出限制；請減少 Plugin/Skills/自訂指令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 指令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 以 `404: Not Found` 失敗時，可能表示 `channels.telegram.apiRoot` 被設定成完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只包含 Bot API 根目錄，而 `openclaw doctor --fix` 會移除意外結尾的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕已設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為 Webhook 清理失敗。
    - `setMyCommands failed` 搭配網路/擷取錯誤通常表示到 `api.telegram.org` 的傳出 DNS/HTTPS 被封鎖。

    ### 裝置配對指令（`device-pair` Plugin）

    安裝 `device-pair` Plugin 時：

    1. `/pair` 會產生設定程式碼
    2. 在 iOS 應用程式貼上程式碼
    3. `/pair pending` 會列出待處理請求（包含角色/範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - `/pair approve` 用於只有一個待處理請求時
       - `/pair approve latest` 用於最新請求

    設定程式碼攜帶短效的啟動權杖。內建啟動交接會將主要節點權杖維持在 `scopes: []`；任何交接出的操作者權杖都會限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 與 `operator.write`。啟動範圍檢查有角色前綴，因此該操作者允許清單只滿足操作者請求；非操作者角色仍需要其自身角色前綴底下的範圍。

    如果裝置以變更後的驗證詳細資料重試（例如角色/範圍/公開金鑰），先前的待處理請求會被取代，且新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

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

    回呼點擊會以文字傳遞給代理程式：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="代理程式與自動化的 Telegram 訊息動作">
    Telegram 工具動作包含：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作公開符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘門控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有個別的 `channels.telegram.actions.*` 開關。
    執行階段傳送會使用作用中的設定/秘密快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時的 SecretRef 重新解析。

    反應移除語義：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆對話串標籤">
    Telegram 支援在生成輸出中使用明確的回覆對話串標籤：

    - `[[reply_to_current]]` 會回覆觸發訊息
    - `[[reply_to:<id>]]` 會回覆特定的 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    啟用回覆對話串且原始 Telegram 文字或說明文字可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 程式碼單元，因此較長訊息會從開頭引用，若 Telegram 拒絕引用，則退回純回覆。

    注意：`off` 會停用隱含的回覆對話串。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與對話串行為">
    論壇超級群組：

    - 主題工作階段金鑰會附加 `:topic:<threadId>`
    - 回覆與輸入中狀態會以主題對話串為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入中動作仍會包含 `message_thread_id`

    主題繼承：主題項目會繼承群組設定，除非被覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題，不會從群組預設值繼承。

    **每主題代理程式路由**：每個主題都可以透過在主題設定中設定 `agentId` 路由到不同的代理程式。這讓每個主題都有自己的隔離工作區、記憶與工作階段。範例：

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

    接著每個主題都有自己的工作階段金鑰：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 主題繫結**：論壇主題可透過最上層具型別的 ACP 繫結（`bindings[]` 搭配 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及類似 `-1001234567890:topic:42` 的主題限定 ID）釘選 ACP 工具組工作階段。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

    **從聊天產生對話串綁定的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由到該處。OpenClaw 會將產生確認釘選在主題內。需要 `channels.telegram.threadBindings.spawnSessions` 保持啟用（預設：`true`）。

    範本情境會公開 `MessageThreadId` 和 `IsForum`。含有 `message_thread_id` 的 DM 聊天預設會在扁平工作階段中保留 DM 路由與回覆中繼資料；只有在設定 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true` 或相符主題設定時，才會使用具備討論串感知的工作階段鍵。使用頂層 `channels.telegram.dm.threadReplies` 作為帳號預設值，或使用 `direct.<chatId>.threadReplies` 設定單一 DM。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音備忘和音訊檔案。

    - 預設：音訊檔案行為
    - 在代理回覆中標記 `[[audio_as_voice]]` 可強制傳送語音備忘
    - 傳入語音備忘的逐字稿會在代理情境中被框定為機器產生、
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

    Telegram 會區分影片檔案和影片備忘。

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

    影片備忘不支援字幕；提供的訊息文字會另外傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（佔位符 `<media:sticker>`）
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

    搜尋快取貼圖：

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
    Telegram 反應會以 `message_reaction` 更新抵達（與訊息負載分開）。

    啟用後，OpenClaw 會將系統事件排入佇列，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示只處理使用者對 bot 傳送訊息的反應（透過已傳送訊息快取盡力而為）。
    - 反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被丟棄。
    - Telegram 不會在反應更新中提供討論串 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組的一般主題工作階段（`:topic:1`），而不是精確的來源主題

    輪詢/Webhook 的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack 反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後備值（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 Unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用頻道或帳號的反應。

  </Accordion>

  <Accordion title="來自 Telegram 事件與命令的設定寫入">
    預設會啟用頻道設定寫入（`configWrites !== false`）。

    Telegram 觸發的寫入包含：

    - 群組遷移事件（`migrate_to_chat_id`）以更新 `channels.telegram.groups`
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

    在長輪詢模式中，OpenClaw 只有在更新成功分派後才會保存其重啟水位標記。如果處理常式失敗，該更新會在同一程序中保持可重試，並且不會被寫為已完成以供重啟去重。

    本機監聽器會繫結到 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前方放置反向 Proxy，或有意設定 `webhookHost: "0.0.0.0"`。

    Webhook 模式會先驗證請求防護、Telegram 秘密權杖和 JSON 主體，再向 Telegram 回傳 `200`。
    接著 OpenClaw 會透過長輪詢使用的相同每聊天/每主題 bot 通道非同步處理更新，因此較慢的代理回合不會佔住 Telegram 的傳遞 ACK。

  </Accordion>

  <Accordion title="限制、重試與 CLI 目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會先偏好段落邊界（空白行），再依長度分割。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入與傳出的 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其作為單一傳入訊息分派前緩衝多久。如果相簿部分抵達較晚，請增加此值；若要降低相簿回覆延遲，請減少此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，套用 grammY 預設值）。Bot 用戶端會將低於 60 秒傳出文字/輸入請求防護的設定值限縮，使 grammY 不會在 OpenClaw 的傳輸防護與後備機制執行前中止可見回覆傳遞。長輪詢仍會使用 45 秒 `getUpdates` 請求防護，因此閒置輪詢不會無限期遭到放棄。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；僅針對誤判的輪詢停滯重啟，在 `30000` 到 `600000` 之間調整。
    - 群組情境歷史會使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 表示停用。
    - 當 Gateway 已觀察到父訊息時，回覆/引用/轉寄的補充情境會正規化到一個選定的對話情境視窗；已觀察訊息快取會保存在工作階段儲存旁邊。Telegram 在更新中只包含一層淺層 `reply_to_message`，因此早於快取的鏈會受限於 Telegram 目前的更新負載。
    - Telegram 允許清單主要控管誰可以觸發代理，而不是完整的補充情境遮蔽邊界。
    - DM 歷史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用到 Telegram 傳送輔助工具（CLI/工具/動作），用於可復原的傳出 API 錯誤。傳入最終回覆傳遞也會針對 Telegram 預連線失敗使用有界限的安全傳送重試，但不會重試可能重複可見訊息的模糊傳送後網路封套。

    CLI 和訊息工具傳送目標可以是數字聊天 ID、使用者名稱，或論壇主題目標：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - 當 `channels.telegram.capabilities.inlineButtons` 允許時，使用含有 `buttons` 區塊的 `--presentation` 建立行內鍵盤
    - `--pin` 或 `--delivery '{"pin":true}'` 可在 bot 能於該聊天釘選時請求釘選傳遞
    - `--force-document` 可將傳出的圖片和 GIF 作為文件傳送，而不是壓縮照片或動畫媒體上傳

    動作閘控：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出 Telegram 訊息，包括輪詢
    - `channels.telegram.actions.poll=false` 會停用 Telegram 輪詢建立，同時保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的 exec 核准">
    Telegram 支援在核准者 DM 中進行 exec 核准，並可選擇在來源聊天或主題中張貼提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（至少有一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（後備使用 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（預設）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以與 bot 對話，以及它將一般回覆傳送到哪裡。它們不會讓某人成為 exec 核准者。當尚未存在命令擁有者時，第一個已核准的 DM 配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，而不必在 `execApprovals.approvers` 下重複 ID。

    頻道傳遞會在聊天中顯示命令文字；僅在受信任的群組/主題中啟用 `channel` 或 `both`。當提示送達論壇主題時，OpenClaw 會保留該主題供核准提示與後續訊息使用。Exec 核准預設會在 30 分鐘後到期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標表面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過 plugin 核准解析；其他則會先透過 exec 核准解析。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到傳遞或提供者錯誤時，Telegram 可以回覆錯誤文字，或將其抑制。兩個設定鍵控制此行為：

| 鍵                                  | 值                | 預設    | 說明                                                                                            |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 會向聊天傳送友善的錯誤訊息。`silent` 會完全抑制錯誤回覆。                               |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 對同一聊天的錯誤回覆之間的最短時間。可防止中斷期間產生錯誤垃圾訊息。                            |

支援依帳號、依群組和依主題覆寫（繼承方式與其他 Telegram 設定鍵相同）。

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
  <Accordion title="Bot 不會回應非提及的群組訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather：`/setprivacy` -> Disable
      - 然後將 Bot 從群組移除再重新加入
    - 當設定預期接收未提及的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法探測成員資格。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列在其中（或包含 `"*"`）
    - 驗證 Bot 在群組中的成員資格
    - 檢閱日誌：`openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="命令只能部分運作或完全無法運作">

    - 授權你的傳送者身分（配對及/或數字 `allowFrom`）
    - 即使群組政策為 `open`，命令授權仍然適用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生命令選單項目過多；減少 Plugin/skill/自訂命令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入狀態呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續性的網路/擷取錯誤通常表示對 `api.telegram.org` 的 DNS/HTTPS 可達性有問題

  </Accordion>

  <Accordion title="啟動回報未授權的 Token">

    - `getMe returned 401` 是已設定 Bot Token 的 Telegram 驗證失敗。
    - 在 BotFather 重新複製或重新產生 Bot Token，然後針對預設帳號更新 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將其視為「沒有 Webhook 存在」只會把相同的錯誤 Token 失敗延後到之後的 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - Node 22+ 加上自訂 fetch/proxy 時，如果 AbortSignal 型別不相符，可能會觸發立即中止行為。
    - 某些主機會先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 輸出可能造成間歇性的 Telegram API 失敗。
    - 如果日誌包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些視為可復原的網路錯誤並重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此執行器在第一次 `getUpdates` 前不需要第二次 `getMe`。
    - 如果在輪詢啟動期間 `deleteWebhook` 因暫時性網路錯誤而失敗，OpenClaw 會繼續進入長輪詢，而不是進行另一個輪詢前的控制平面呼叫。仍處於啟用狀態的 Webhook 會以 `getUpdates` 衝突呈現；OpenClaw 隨後會重建 Telegram 傳輸並重試 Webhook 清理。
    - 如果 Telegram Socket 以短而固定的節奏回收，請檢查是否有過低的 `channels.telegram.timeoutSeconds`；Bot 用戶端會將設定值限制在輸出與 `getUpdates` 請求防護值以下，但較舊版本在此值低於那些防護值時，可能會在每次輪詢或回覆時中止。
    - 如果日誌包含 `Polling stall detected`，OpenClaw 預設會在 120 秒內沒有完成長輪詢存活訊號後，重新啟動輪詢並重建 Telegram 傳輸。
    - 當執行中的輪詢帳號在啟動寬限期後尚未完成 `getUpdates`、執行中的 Webhook 帳號在啟動寬限期後尚未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過舊時，`openclaw channels status --probe` 和 `openclaw doctor` 會發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫是健康的，但你的主機仍回報誤判的輪詢停滯重新啟動時，才增加 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 輸出問題。
    - Telegram 也會遵循 Bot API 傳輸的處理程序 proxy env，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可繞過 `api.telegram.org`。
    - 如果 OpenClaw 受管理 proxy 是透過服務環境的 `OPENCLAW_PROXY_URL` 設定，且不存在標準 proxy env，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接輸出/TLS 不穩定的 VPS 主機上，透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再到處理程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不適用，Node 22+ 會退回 `ipv4first`。
    - 如果你的主機是 WSL2，或明確以僅 IPv4 行為運作得更好，請強制選擇位址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準測試範圍答案（`198.18.0.0/15`）預設已允許
      用於 Telegram 媒體下載。如果受信任的 fake-IP 或
      透明 proxy 在媒體下載期間將 `api.telegram.org` 改寫為其他
      private/internal/special-use 位址，你可以選擇啟用
      僅限 Telegram 的繞過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一個選擇性啟用也可在每個帳號層級使用，位於
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的 proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先保持
      危險旗標關閉。Telegram 媒體預設已允許 RFC 2544
      基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 防護。只有在受信任、由操作員控制的 proxy
      環境中使用，例如 Clash、Mihomo 或 Surge fake-IP 路由，且它們會
      合成 RFC 2544 基準測試範圍以外的 private 或 special-use 答案時才使用。
      對一般公共網際網路 Telegram 存取請保持關閉。
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

更多說明：[頻道疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="高訊號 Telegram 欄位">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
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
- 寫入/歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個或更多帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`），讓預設路由明確。否則 OpenClaw 會退回第一個正規化的帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
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
    將傳入訊息路由到代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理程式路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組與主題對應到代理程式。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷。
  </Card>
</CardGroup>
