---
read_when:
    - 處理 Telegram 功能或網路鉤子
summary: Telegram bot 支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-07-03T13:14:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

可透過 grammY 用於生產環境的 Bot 私訊與群組。Long polling 是預設模式；webhook 模式為選用。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復作業手冊。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-TW/gateway/configuration">
    完整的通道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="Create the bot token in BotFather">
    開啟 Telegram 並與 **@BotFather** 對話（確認帳號名稱完全是 `@BotFather`）。

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

    環境變數備援：`TELEGRAM_BOT_TOKEN=...`（僅限預設帳號）。
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/環境變數中設定權杖，然後啟動閘道。

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
    將 Bot 加入你的群組，然後取得群組存取所需的兩個 ID：

    - 你的 Telegram 使用者 ID，用於 `allowFrom` / `groupAllowFrom`
    - Telegram 群組聊天 ID，用作 `channels.telegram.groups` 下的鍵

    首次設定時，可從 `openclaw logs --follow`、轉寄 ID Bot，或 Bot API `getUpdates` 取得群組聊天 ID。群組獲准後，`/whoami@<bot_username>` 可確認使用者與群組 ID。

    以 `-100` 開頭的負數 Telegram 超級群組 ID 是群組聊天 ID。請將它們放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom` 下。

  </Step>
</Steps>

<Note>
權杖解析順序會感知帳號。實務上，設定值優先於環境變數備援，且 `TELEGRAM_BOT_TOKEN` 只會套用到預設帳號。
成功啟動後，OpenClaw 會在狀態目錄中快取 Bot 身分最多 24 小時，讓重新啟動可避免額外的 Telegram `getMe` 呼叫；變更或移除權杖會清除此快取。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram Bot 預設使用 **Privacy Mode**，這會限制它們可接收的群組訊息。

    如果 Bot 必須看到所有群組訊息，請採用下列任一方式：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將 Bot 設為群組管理員。

    切換隱私模式時，請在每個群組中移除並重新加入 Bot，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="Group permissions">
    管理員狀態由 Telegram 群組設定控制。

    管理員 Bot 會接收所有群組訊息，這對需要常駐群組行為很有用。

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` 用於允許/拒絕加入群組
    - `/setprivacy` 用於群組可見度行為

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

### 群組 Bot 身分

在 Telegram 群組與論壇主題中，明確提及已設定的 Bot 帳號名稱（例如 `@my_bot`）會被視為正在呼叫所選 OpenClaw agent，即使 agent persona 名稱不同於 Telegram 使用者名稱。群組靜默政策仍會套用於無關的群組流量，但 Bot 帳號名稱本身不會被視為「其他人」。

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（需要 `allowFrom` 中至少有一個傳送者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到 Bot 使用者名稱的 Telegram 帳號都能命令 Bot。僅應用於有意公開、且工具受到嚴格限制的 Bot；單一擁有者 Bot 應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，具限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳號層級的 `allowFrom: ["*"]` 項目不會使該帳號公開，除非合併後的有效帳號 allowlist 仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有私訊，並會被設定驗證拒絕。
    設定流程只會要求數字使用者 ID。
    如果你已升級且設定中包含 `@username` allowlist 項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram Bot 權杖）。
    如果你先前依賴配對儲存區的 allowlist 檔案，`openclaw doctor --fix` 可以在 allowlist 流程中將項目復原到 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 尚無明確 ID 時）。

    對於單一擁有者 Bot，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，讓存取政策在設定中保持持久（而不是依賴先前的配對核准）。

    常見混淆：私訊配對核准不代表「此傳送者在所有地方都已授權」。
    配對授予私訊存取權。如果尚未存在命令擁有者，第一次核准的配對也會設定 `commands.ownerAllowFrom`，讓僅限擁有者的命令與執行核准擁有明確的操作者帳號。
    群組傳送者授權仍來自明確的設定 allowlist。
    如果你想要「我授權一次後，私訊與群組命令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅限擁有者的命令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（無第三方 Bot）：

    1. 私訊你的 Bot。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（較不私密）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="Group policy and allowlists">
    兩項控制會共同套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都可通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為 allowlist（明確 ID 或 `"*"`）

    2. **群組中允許哪些傳送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組傳送者篩選。若未設定，Telegram 會退回使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    請勿將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 應放在 `channels.telegram.groups` 下。
    非數字項目會在傳送者授權中被忽略。
    安全邊界（`2026.2.25+`）：群組傳送者驗證**不會**繼承私訊配對儲存區核准。
    配對維持僅限私訊。對於群組，請設定 `groupAllowFrom` 或每群組/每主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會退回使用設定中的 `allowFrom`，而不是配對儲存區。
    單一擁有者 Bot 的實務模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 下允許目標群組。
    執行階段注意事項：如果 `channels.telegram` 完全缺少，除非明確設定 `channels.defaults.groupPolicy`，執行階段會預設為 fail-closed `groupPolicy="allowlist"`。

    僅限擁有者的群組設定：

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

    從群組使用 `@<bot_username> ping` 測試。在 `requireMention: true` 時，普通群組訊息不會觸發 Bot。

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

    範例：只允許某個特定群組內的特定使用者：

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
      - 當你想限制已允許群組內哪些人可以觸發 Bot 時，請將像 `8734062810` 這類 Telegram 使用者 ID 放在 `groupAllowFrom` 下。
      - 只有在你希望已允許群組中的任何成員都能與 Bot 對話時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    群組回覆預設需要提及。

    提及可來自：

    - 原生 `@botusername` 提及，或
    - 下列位置中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    工作階段層級命令切換：

    - `/activation always`
    - `/activation mention`

    這些只會更新工作階段狀態。請使用設定以持久保存。

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

    群組歷史內容對群組一律開啟，且受
    `historyLimit` 限制。設定 `channels.telegram.historyLimit: 0` 可停用
    Telegram 群組歷史視窗。已退役的 `includeGroupHistoryContext`
    鍵會由 `openclaw doctor --fix` 移除。

    取得群組聊天 ID：

    - 將群組訊息轉寄給 `@userinfobot` / `@getidsbot`
    - 或從 `openclaw logs --follow` 讀取 `chat.id`
    - 或檢查 Bot API `getUpdates`
    - 群組獲准後，如果已啟用原生命令，請執行 `/whoami@<bot_username>`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由閘道程序擁有。
- 路由是確定性的：Telegram 入站訊息會回覆到 Telegram（模型不會選擇頻道）。
- 入站訊息會正規化為共用頻道信封，包含回覆中繼資料、媒體預留位置，以及閘道已觀察到之 Telegram 回覆的持久化回覆鏈脈絡。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>`，以保持主題隔離。
- 私訊訊息可以攜帶 `message_thread_id`；OpenClaw 會保留它用於回覆。只有當 Telegram `getMe` 回報該機器人的 `has_topics_enabled: true` 時，私訊主題工作階段才會拆分；否則私訊會維持在扁平工作階段。
- 長輪詢使用 grammY runner，並採用每聊天/每執行緒排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 多帳號啟動會限制並行的 Telegram `getMe` 探測，因此大型機器人叢集不會一次展開每個帳號探測。
- 長輪詢會在每個閘道程序內受到保護，因此同一時間只有一個作用中 poller 可以使用某個機器人權杖。如果你仍然看到 `getUpdates` 409 衝突，很可能有另一個 OpenClaw 閘道、指令碼或外部 poller 正在使用相同權杖。
- 長輪詢 watchdog 預設會在 120 秒內沒有完成的 `getUpdates` 存活性訊號時觸發重新啟動。只有當你的部署在長時間執行工作期間仍然看到錯誤的輪詢停滯重新啟動時，才提高 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍為 `30000` 到 `600000`；支援每帳號覆寫。
- Telegram Bot API 不支援讀取回條（`sendReadReceipts` 不適用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已被移除。升級後如果你的設定仍有這些鍵，請執行 `openclaw doctor --fix`。私訊主題路由現在會遵循 Telegram `getMe.has_topics_enabled` 提供的機器人能力，這由 BotFather 執行緒模式控制：啟用主題的機器人會在 Telegram 傳送 `message_thread_id` 時使用執行緒範圍的私訊工作階段；其他私訊則維持在扁平工作階段。
</Note>

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 為 `off | partial | block | progress`（預設值：`partial`）
    - 簡短的初始答案預覽會先防抖，然後如果執行仍在作用中，會在有界延遲後具體化
    - `progress` 會保留一則可編輯的工具進度狀態草稿，在答案活動早於工具進度抵達時顯示穩定狀態標籤，在完成時清除，並以一般訊息傳送最終答案
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用同一則經編輯的預覽訊息（預設值：當預覽串流作用中時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度行中的命令/執行細節：`raw`（預設值，保留已發布行為）或 `status`（僅工具標籤）
    - `streaming.progress.commentary`（預設值：`false`）選擇在暫時進度草稿中加入助理評論/前言文字
    - 舊版 `channels.telegram.streamMode`、布林 `streaming` 值，以及已退役的原生草稿預覽鍵會被偵測；執行 `openclaw doctor --fix` 將它們遷移到目前的串流設定

    工具進度預覽更新是在工具執行期間顯示的簡短狀態行，例如命令執行、檔案讀取、規劃更新、修補摘要，或 Codex app-server 模式中的 Codex 前言/評論文字。Telegram 預設保持啟用，以符合 `v2026.4.22` 及之後版本已發布的 OpenClaw 行為。

    若要保留答案文字的已編輯預覽，但隱藏工具進度行，請設定：

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

    當你想要可見的工具進度，但不想將最終答案編輯進同一則訊息時，使用 `progress` 模式。將命令文字政策放在 `streaming.progress` 底下：

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

    只有當你想要僅傳送最終內容時，才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，且一般工具/進度閒聊會被抑制，而不是以獨立狀態訊息傳送。核准提示、媒體酬載和錯誤仍會透過一般最終傳送路徑路由。當你只想保留答案預覽編輯，同時隱藏工具進度狀態行時，使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 選取引用回覆是例外。當 `replyToMode` 為 `"first"`、`"all"` 或 `"batched"`，且入站訊息包含選取的引用文字時，OpenClaw 會透過 Telegram 的原生引用回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法為該回合顯示簡短狀態行。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引用回覆更重要時，設定 `replyToMode: "off"`；或設定 `streaming.preview.toolProgress: false` 以承認此取捨。
    </Note>

    對於純文字回覆：

    - 簡短的私訊/群組/主題預覽：OpenClaw 會保留同一則預覽訊息，並就地執行最終編輯
    - 會拆分為多則 Telegram 訊息的長文字最終內容，在可行時會重用現有預覽作為第一個最終區塊，然後只傳送剩餘區塊
    - 進度模式最終內容會清除狀態草稿，並使用一般最終傳送，而不是把草稿編輯成答案
    - 如果在完成文字確認之前最終編輯失敗，OpenClaw 會使用一般最終傳送，並清理過期的預覽

    對於複雜回覆（例如媒體酬載），OpenClaw 會退回一般最終傳送，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流以避免雙重串流。

    推理串流行為：

    - `/reasoning stream` 使用受支援頻道的推理預覽路徑；在 Telegram 上，它會在產生期間將推理串流到即時預覽中
    - 推理預覽會在最終傳送後刪除；當推理應保持可見時，使用 `/reasoning on`
    - 最終答案會在不含推理文字的情況下傳送

  </Accordion>

  <Accordion title="豐富訊息格式">
    外送文字預設使用標準 Telegram HTML 訊息，因此回覆在目前 Telegram 用戶端上都能保持易讀。此相容模式支援一般粗體、斜體、連結、程式碼、劇透和引用，但不支援 Bot API 10.1 僅限豐富格式的區塊，例如原生表格、詳細資料、豐富媒體和公式。

    設定 `channels.telegram.richMessages: true` 以選擇使用 Bot API 10.1 豐富訊息：

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    啟用時：

    - 代理程式會被告知此機器人/帳號可使用 Telegram 豐富訊息。
    - Markdown 文字會透過 OpenClaw 的 Markdown IR 轉譯，並以 Telegram 豐富 HTML 傳送。
    - 明確的豐富 HTML 酬載會保留受支援的 Bot API 10.1 標籤，例如標題、表格、詳細資料、豐富媒體和公式。
    - 媒體標題仍使用 Telegram HTML 標題，因為豐富訊息不會取代標題。

    這會讓模型文字遠離 Telegram Rich Markdown 符號，因此像 `$400-600K` 這樣的貨幣不會被解析為數學。長篇豐富文字會依 Telegram 的豐富文字和豐富區塊限制自動拆分。超過 Telegram 欄數限制的表格會以程式碼區塊傳送。

    預設值：關閉，以維持用戶端相容性。豐富訊息需要相容的 Telegram 用戶端；部分目前的 Desktop、Web、Android 和第三方用戶端會將已接受的豐富訊息顯示為不支援。除非與機器人搭配使用的每個用戶端都能轉譯它們，否則請保持此選項停用。`/status` 會顯示目前 Telegram 工作階段的豐富訊息是開啟或關閉。

    連結預覽預設啟用。`channels.telegram.linkPreview: false` 會略過豐富文字的自動實體偵測。

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

    - 名稱會正規化（移除前導 `/`、轉為小寫）
    - 有效模式：`a-z`、`0-9`、`_`，長度 `1..32`
    - 自訂命令不能覆寫原生命令
    - 衝突/重複項目會被略過並記錄

    注意事項：

    - 自訂命令只是選單項目；它們不會自動實作行為
    - 外掛/Skills 命令即使未顯示在 Telegram 選單中，輸入時仍可運作

    如果原生命令已停用，內建項目會被移除。自訂/外掛命令若已設定，仍可能註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍然溢出；請減少外掛/Skills/自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 命令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並顯示 `404: Not Found` 時，可能表示 `channels.telegram.apiRoot` 被設為完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只包含 Bot API 根路徑，而 `openclaw doctor --fix` 會移除意外的尾端 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕已設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為網路鉤子清理失敗。
    - `setMyCommands failed` 搭配網路/擷取錯誤，通常表示到 `api.telegram.org` 的外送 DNS/HTTPS 被阻擋。

    ### 裝置配對命令（`device-pair` 外掛）

    安裝 `device-pair` 外掛時：

    1. `/pair` 產生設定碼
    2. 在 iOS app 中貼上程式碼
    3. `/pair pending` 列出待處理請求（包含角色/範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - 當只有一個待處理請求時使用 `/pair approve`
       - `/pair approve latest` 用於最近的請求

    設定碼會攜帶短效 bootstrap 權杖。內建設定碼 bootstrap 會回傳一個持久節點權杖，帶有 `scopes: []`，外加一個有界的 operator handoff 權杖，用於受信任的行動裝置上線。該 operator 權杖可以讀取設定期間的原生設定，但不授予配對變更範圍或 `operator.admin`。

    如果裝置使用已變更的驗證詳細資料重試（例如角色/範圍/公開金鑰），先前的待處理請求會被取代，且新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

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

    Mini App 按鈕範例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram `web_app` 按鈕只適用於使用者與
    bot 之間的私人聊天。

    未被已註冊外掛互動式處理常式認領的回呼點擊，會以文字傳給代理程式：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="供代理程式與自動化使用的 Telegram 訊息動作">
    Telegram 工具動作包含：

    - `sendMessage`（`to`、`content`、選用的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、選用的 `presentation` 內嵌按鈕；僅按鈕的編輯會更新回覆標記）
    - `createForumTopic`（`chatId`、`name`、選用的 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作會公開符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘控控制項：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有獨立的 `channels.telegram.actions.*` 切換。
    執行階段傳送會使用作用中的設定/密鑰快照（啟動/重新載入），因此動作路徑不會針對每次傳送執行臨時的 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆串接標籤">
    Telegram 支援在產生的輸出中使用明確的回覆串接標籤：

    - `[[reply_to_current]]` 會回覆觸發訊息
    - `[[reply_to:<id>]]` 會回覆特定 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    啟用回覆串接且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 程式碼單位，因此較長的訊息會從開頭開始引用；若 Telegram 拒絕引用，則會退回一般回覆。

    注意：`off` 會停用隱含回覆串接。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與討論串行為">
    論壇超級群組：

    - 主題工作階段鍵會附加 `:topic:<threadId>`
    - 回覆與輸入中狀態會以該主題討論串為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入中動作仍會包含 `message_thread_id`

    主題繼承：主題項目會繼承群組設定，除非已覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題使用，不會從群組預設值繼承。
    `topics."*"` 會為該群組中的每個主題設定預設值；精確的主題 ID 仍優先於 `"*"`。

    **依主題代理程式路由**：每個主題都可以透過在主題設定中設定 `agentId`，路由到不同的代理程式。這會讓每個主題都有自己的隔離工作區、記憶與工作階段。範例：

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

    **持久 ACP 主題繫結**：論壇主題可以透過頂層具型別的 ACP 繫結釘選 ACP 控制套件工作階段（`bindings[]`，含 `type: "acp"` 與 `match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 這樣限定主題的 id）。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

    **從聊天產生綁定討論串的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由到那裡。OpenClaw 會在主題內釘選產生確認。需要讓 `channels.telegram.threadBindings.spawnSessions` 保持啟用（預設：`true`）。

    範本內容會公開 `MessageThreadId` 和 `IsForum`。含 `message_thread_id` 的 DM 聊天會保留回覆中繼資料；只有當 Telegram `getMe` 回報 bot 的 `has_topics_enabled: true` 時，它們才會使用具討論串感知的工作階段鍵。
    先前的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆寫已刻意淘汰；請使用 BotFather 討論串模式作為唯一事實來源，並執行 `openclaw doctor --fix` 以移除過時的設定鍵。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。

    - 預設：音訊檔案行為
    - 在代理程式回覆中使用標籤 `[[audio_as_voice]]` 以強制傳送語音訊息
    - 傳入的語音訊息逐字稿會在代理程式內容中框定為機器產生、
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

    Telegram 會區分影片檔與影片筆記。

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

    影片筆記不支援說明文字；提供的訊息文字會另外傳送。

    ### 貼圖

    入站貼圖處理：

    - 靜態 WEBP：下載並處理（佔位符 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖內容欄位：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    貼圖描述會快取在 OpenClaw SQLite 外掛狀態中，以減少重複的視覺呼叫。

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
    Telegram 反應會以 `message_reaction` 更新抵達（與訊息承載資料分開）。

    啟用後，OpenClaw 會將如下系統事件加入佇列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`: `off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示只處理使用者對機器人所傳訊息的反應（透過已傳訊息快取盡力判斷）。
    - 反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被丟棄。
    - Telegram 不會在反應更新中提供討論串 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組一般主題工作階段（`:topic:1`），而不是確切的來源主題

    輪詢/網路鉤子的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理入站訊息時傳送確認表情符號。`ackReactionScope` 決定該表情符號實際傳送的*時機*。

    **表情符號（`ackReaction`）解析順序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用某個頻道或帳號的反應。

    **範圍（`messages.ackReactionScope`）：**

    Telegram 提供者會從 `messages.ackReactionScope` 讀取範圍（預設為 `"group-mentions"`）。目前沒有 Telegram 帳號層級或 Telegram 頻道層級的覆寫。

    值：`"all"`（私訊 + 群組）、`"direct"`（僅私訊）、`"group-all"`（每則群組訊息，不含私訊）、`"group-mentions"`（群組中提及機器人時；**不含私訊** — 這是預設值）、`"off"` / `"none"`（已停用）。

    <Note>
    預設範圍（`"group-mentions"`）不會在直接訊息中觸發確認反應。若要在入站 Telegram 私訊上取得確認反應，請將 `messages.ackReactionScope` 設為 `"direct"` 或 `"all"`。此值會在 Telegram 提供者啟動時讀取，因此需要重新啟動閘道，變更才會生效。
    </Note>

  </Accordion>

  <Accordion title="來自 Telegram 事件和命令的設定寫入">
    頻道設定寫入預設啟用（`configWrites !== false`）。

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

  <Accordion title="長輪詢與網路鉤子">
    預設為長輪詢。若要使用網路鉤子模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可選的 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在長輪詢模式中，OpenClaw 只有在更新成功派送後，才會持久化其重新啟動浮水印。如果處理常式失敗，該更新在同一程序中仍可重試，且不會被寫入為已完成以供重新啟動去重。

    本機監聽器會繫結到 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前方放置反向代理，或刻意設定 `webhookHost: "0.0.0.0"`。

    網路鉤子模式會先驗證請求防護、Telegram 秘密權杖和 JSON 主體，然後才向 Telegram 回傳 `200`。
    接著 OpenClaw 會透過與長輪詢相同的每聊天/每主題機器人通道非同步處理更新，因此緩慢的代理回合不會卡住 Telegram 的遞送 ACK。

  </Accordion>

  <Accordion title="限制、重試與命令列介面目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會優先使用段落邊界（空白行），再依長度分割。
    - `channels.telegram.mediaMaxMb`（預設 100）限制傳入與傳出 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其作為一則傳入訊息派送前要緩衝多久。如果相簿部分較晚抵達，請增加此值；若要降低相簿回覆延遲，請減少此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則套用 grammY 預設值）。Bot 用戶端會將設定值限制在低於 60 秒的傳出文字/輸入中請求保護值，讓 grammY 不會在 OpenClaw 的傳輸保護與備援可執行前中止可見回覆傳遞。長輪詢仍使用 45 秒的 `getUpdates` 請求保護值，因此閒置輪詢不會無限期被放棄。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；只有在輪詢停滯重啟出現誤判時，才調整到 `30000` 到 `600000` 之間。
    - 群組脈絡歷史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 當閘道已觀察到父訊息時，回覆/引用/轉寄補充脈絡會正規化為一個選定的對話脈絡視窗；已觀察訊息快取位於 OpenClaw SQLite 外掛狀態中，而 `openclaw doctor --fix` 會匯入舊版 sidecar。Telegram 在更新中只包含一層淺層 `reply_to_message`，因此早於快取的鏈結受限於 Telegram 目前的更新承載。
    - Telegram 允許清單主要限制誰可以觸發代理，而不是完整的補充脈絡遮蔽邊界。
    - 私訊歷史控制項：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用到 Telegram 傳送輔助工具（命令列介面/工具/動作），用於可復原的傳出 API 錯誤。傳入最終回覆傳遞也會針對 Telegram 預連線失敗使用有界限的安全傳送重試，但不會重試可能造成可見訊息重複的模糊傳送後網路封套。

    命令列介面與訊息工具傳送目標可以是數字聊天 ID、使用者名稱，或論壇主題目標：

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

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - 當 `channels.telegram.capabilities.inlineButtons` 允許時，`--presentation` 搭配 `buttons` 區塊可用於行內鍵盤
    - 當機器人可在該聊天中釘選時，使用 `--pin` 或 `--delivery '{"pin":true}'` 請求釘選傳遞
    - `--force-document` 會將傳出圖片、GIF 與影片以文件傳送，而不是壓縮相片、動畫媒體或影片上傳

    動作閘控：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用 Telegram 投票建立，同時保留一般傳送啟用狀態

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中的執行核准，也可以選擇在來源聊天或主題中發布提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（當至少有一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（退回使用 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（預設）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 與 `defaultTo` 控制誰可以與機器人對話，以及它會把一般回覆傳送到哪裡。它們不會讓某人成為執行核准者。當尚未存在命令擁有者時，第一個已核准的私訊配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，而不必在 `execApprovals.approvers` 下重複 ID。

    頻道傳遞會在聊天中顯示命令文字；只有在受信任的群組/主題中才啟用 `channel` 或 `both`。當提示送達論壇主題時，OpenClaw 會保留該主題用於核准提示與後續訊息。執行核准預設會在 30 分鐘後到期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過外掛核准解析；其他會先透過執行核准解析。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到傳遞或提供者錯誤時，錯誤政策會控制是否將錯誤訊息傳送到 Telegram 聊天：

| 鍵                                  | 值                         | 預設值          | 說明                                                                                                                                                                                                       |
| ----------------------------------- | -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — 將每則錯誤訊息傳送到聊天。`once` — 每個冷卻視窗只傳送每則唯一錯誤訊息一次（抑制重複的相同錯誤）。`silent` — 絕不將錯誤訊息傳送到聊天。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` 政策的冷卻視窗。錯誤送出後，在此間隔過去前會抑制相同錯誤訊息。可防止中斷期間的錯誤洗版。                                                |

支援每個帳號、每個群組與每個主題的覆寫（繼承方式與其他 Telegram 設定鍵相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
  <Accordion title="機器人未回應非提及的群組訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather: `/setprivacy` -> Disable
      - 然後將機器人從群組移除並重新加入
    - 當設定預期未提及的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法進行成員資格探測。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列在其中（或包含 `"*"`）
    - 確認機器人在群組中的成員資格
    - 檢查記錄：`openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="命令只能部分運作或完全無法運作">

    - 授權你的傳送者身分（配對和/或數字 `allowFrom`）
    - 即使群組政策為 `open`，命令授權仍會套用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生命令選單項目過多；請減少外掛/skill/自訂命令，或停用原生命令選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入中呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續性的網路/fetch 錯誤通常表示連到 `api.telegram.org` 的 DNS/HTTPS 可達性問題

  </Accordion>

  <Accordion title="啟動回報未授權的 token">

    - `getMe returned 401` 是設定的機器人 token 發生 Telegram 驗證失敗。
    - 在 BotFather 中重新複製或重新產生機器人 token，然後更新預設帳號的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將它視為「不存在網路鉤子」只會把相同的錯誤 token 失敗延後到後續 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - 節點 22+ 搭配自訂 fetch/proxy 時，如果 AbortSignal 型別不相符，可能觸發立即中止行為。
    - 某些主機會先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 對外連線可能造成間歇性 Telegram API 失敗。
    - 如果記錄包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些作為可復原的網路錯誤重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此執行器在第一次 `getUpdates` 前不需要第二次 `getMe`。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤而失敗，OpenClaw 會繼續進入長輪詢，而不是進行另一個輪詢前控制平面呼叫。仍然啟用的網路鉤子會顯示為 `getUpdates` 衝突；OpenClaw 接著會重建 Telegram 傳輸並重試網路鉤子清理。
    - 如果 Telegram socket 以短且固定的週期回收，請檢查是否有過低的 `channels.telegram.timeoutSeconds`；機器人用戶端會將設定值限制在低於傳出與 `getUpdates` 請求保護值，但較舊版本在此值設為低於那些保護值時，可能會中止每次輪詢或回覆。
    - 如果記錄包含 `Polling stall detected`，OpenClaw 預設會在 120 秒內沒有完成長輪詢活性後，重啟輪詢並重建 Telegram 傳輸。
    - 當執行中的輪詢帳號在啟動寬限期後尚未完成 `getUpdates`、執行中的網路鉤子帳號在啟動寬限期後尚未完成 `setWebhook`，或上次成功的輪詢傳輸活動已過期時，`openclaw channels status --probe` 與 `openclaw doctor` 會發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫健康，但你的主機仍回報錯誤的輪詢停滯重啟時，才增加 `channels.telegram.pollingStallThresholdMs`。持續性停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 對外連線問題。
    - Telegram 也會遵循 Bot API 傳輸的程序 proxy 環境變數，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可略過 `api.telegram.org`。
    - 如果在服務環境中透過 `OPENCLAW_PROXY_URL` 設定 OpenClaw 管理的 proxy，且不存在標準 proxy 環境變數，Telegram 也會使用該 URL 進行 Bot API 傳輸。
    - 在直接對外連線/TLS 不穩定的 VPS 主機上，請透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - 節點 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再來是程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；若都不適用，節點 22+ 會退回 `ipv4first`。
    - 如果你的主機是 WSL2，或明確在僅 IPv4 行為下運作較佳，請強制指定位址族選擇：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準測試範圍的回應（`198.18.0.0/15`）預設已允許
      用於 Telegram 媒體下載。如果受信任的 fake-IP 或
      透明代理在媒體下載期間，將 `api.telegram.org` 改寫為其他
      私有／內部／特殊用途位址，你可以選擇啟用
      Telegram 專用略過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 相同的選擇性設定也可針對每個帳號使用：
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理將 Telegram 媒體主機解析為 `198.18.x.x`，請先保持
      危險旗標關閉。Telegram 媒體預設已允許 RFC 2544
      基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 保護。只應在受信任、由操作員控制的代理
      環境中使用，例如 Clash、Mihomo 或 Surge fake-IP 路由，且它們會
      合成 RFC 2544 基準測試範圍外的私有或特殊用途回應。
      一般公用網際網路的 Telegram 存取請保持關閉。
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

<Accordion title="High-signal Telegram fields">

- 啟動／驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 主題預設值：`groups.<chatId>.topics."*"` 會套用到未符合的論壇主題；精確主題 ID 會覆寫它
- exec 核准：`execApprovals`、`accounts.*.execApprovals`
- 命令／選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒／回覆：`replyToMode`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式／傳遞：`textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- 媒體／網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根路徑：`apiRoot`（僅限 Bot API 根路徑；不要包含 `/bot<TOKEN>`）
- 網路鉤子：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作／能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 回應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入／歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：當設定了兩個或更多帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明確指定預設路由。否則 OpenClaw 會退回第一個正規化帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到閘道。
  </Card>
  <Card title="Groups" icon="users" href="/zh-TW/channels/groups">
    群組與主題允許清單行為。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理程式。
  </Card>
  <Card title="Security" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組與主題對應到代理程式。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷。
  </Card>
</CardGroup>
