---
read_when:
    - 處理 Telegram 功能或網路鉤子
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:10:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

可透過 grammY 在機器人私訊和群組中用於正式環境。長輪詢是預設模式；網路鉤子模式為選用。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復手冊。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="Create the bot token in BotFather">
    開啟 Telegram 並與 **@BotFather** 聊天（確認帳號名稱正好是 `@BotFather`）。

    執行 `/newbot`、依提示操作，並儲存 token。

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
    Telegram **不**使用 `openclaw channels login telegram`；請在設定/環境變數中設定 token，然後啟動閘道。

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
    將機器人加入你的群組，然後取得群組存取需要的兩個 ID：

    - 你的 Telegram 使用者 ID，用於 `allowFrom` / `groupAllowFrom`
    - Telegram 群組聊天 ID，用作 `channels.telegram.groups` 底下的鍵

    首次設定時，請從 `openclaw logs --follow`、轉發 ID 機器人，或 Bot API `getUpdates` 取得群組聊天 ID。允許該群組後，`/whoami@<bot_username>` 可以確認使用者與群組 ID。

    以 `-100` 開頭的負數 Telegram 超級群組 ID 是群組聊天 ID。請將它們放在 `channels.telegram.groups` 底下，而不是 `groupAllowFrom` 底下。

  </Step>
</Steps>

<Note>
Token 解析順序會感知帳號。實務上，設定值優先於環境變數備援，且 `TELEGRAM_BOT_TOKEN` 只適用於預設帳號。
成功啟動後，OpenClaw 會在狀態目錄中快取機器人身分最多 24 小時，讓重新啟動可避免額外的 Telegram `getMe` 呼叫；變更或移除 token 會清除該快取。
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

    管理員機器人會接收所有群組訊息，這對需要常駐的群組行為很有用。

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` 可允許/拒絕加入群組
    - `/setprivacy` 用於群組可見性行為

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

### 群組機器人身分

在 Telegram 群組和論壇主題中，明確提及已設定的機器人帳號名稱（例如 `@my_bot`）會被視為正在呼叫所選的 OpenClaw 代理，即使代理人格名稱不同於 Telegram 使用者名稱也一樣。群組靜默政策仍會套用於無關的群組流量，但機器人帳號名稱本身不會被視為「其他人」。

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（需要 `allowFrom` 中至少有一個傳送者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到機器人使用者名稱的 Telegram 帳號都能指令該機器人。請只將它用於刻意公開、且工具受到嚴格限制的機器人；單一擁有者機器人應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳號層級的 `allowFrom: ["*"]` 項目不會讓該帳號公開，除非合併後的有效帳號允許清單仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有私訊，並會被設定驗證拒絕。
    設定只會要求數字使用者 ID。
    如果你已升級，且設定包含 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram 機器人 token）。
    如果你先前依賴配對儲存的允許清單檔案，`openclaw doctor --fix` 可在允許清單流程中將項目復原到 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，讓存取政策在設定中保持持久（而不是依賴先前的配對核准）。

    常見混淆：私訊配對核准不代表「此傳送者在所有地方都已獲授權」。
    配對會授予私訊存取。如果尚未存在指令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅擁有者可用的指令和執行核准具備明確的操作員帳號。
    群組傳送者授權仍來自明確設定的允許清單。
    如果你想要「我授權一次後，私訊和群組指令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅擁有者可用的指令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（不使用第三方機器人）：

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
    兩個控制項會一起套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定：
         - 搭配 `groupPolicy: "open"`：任何群組都可通過群組 ID 檢查
         - 搭配 `groupPolicy: "allowlist"`（預設）：群組會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為允許清單（明確 ID 或 `"*"`）

    2. **群組中允許哪些傳送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（預設）
       - `disabled`

    `groupAllowFrom` 用於群組傳送者篩選。如果未設定，Telegram 會退回使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    請勿將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 應放在 `channels.telegram.groups` 底下。
    非數字項目會在傳送者授權時被忽略。
    安全邊界（`2026.2.25+`）：群組傳送者驗證**不會**繼承私訊配對儲存核准。
    配對只適用於私訊。對於群組，請設定 `groupAllowFrom` 或每群組/每主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會退回使用設定中的 `allowFrom`，而不是配對儲存。
    單一擁有者機器人的實用模式：將你的使用者 ID 設在 `channels.telegram.allowFrom`，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 底下允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，執行階段會預設為故障關閉的 `groupPolicy="allowlist"`，除非明確設定 `channels.defaults.groupPolicy`。

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

    從群組中使用 `@<bot_username> ping` 測試。當 `requireMention: true` 時，普通群組訊息不會觸發機器人。

    範例：允許特定群組中的任何成員：

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

    範例：只允許特定群組中的特定使用者：

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
      - 當你想限制已允許群組中哪些人可以觸發機器人時，將像 `8734062810` 這類 Telegram 使用者 ID 放在 `groupAllowFrom` 底下。
      - 只有在你希望已允許群組中的任何成員都能與機器人交談時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    群組回覆預設需要提及。

    提及可來自：

    - 原生 `@botusername` 提及，或
    - 下列項目中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    工作階段層級的指令切換：

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

    群組歷史內容預設為 `mention-only`：先前的群組訊息只有在
    它們是對機器人發出的、是對機器人的回覆，
    或是機器人自己的訊息時才會納入。將 `includeGroupHistoryContext: "recent"` 設為
    對受信任群組納入近期聊天室歷史。將
    `includeGroupHistoryContext: "none"` 設為在下一輪不傳送任何先前的 Telegram 群組歷史。

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    取得群組聊天 ID：

    - 將群組訊息轉發給 `@userinfobot` / `@getidsbot`
    - 或從 `openclaw logs --follow` 讀取 `chat.id`
    - 或檢查 Bot API `getUpdates`
    - 允許該群組後，如果已啟用原生指令，請執行 `/whoami@<bot_username>`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由閘道程序擁有。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共用頻道信封，包含回覆中繼資料、媒體預留位置，以及閘道已觀察到的 Telegram 回覆所保留的回覆鏈脈絡。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>` 以保持主題隔離。
- 私訊訊息可以帶有 `message_thread_id`；OpenClaw 會保留它以便回覆。只有當 Telegram `getMe` 回報該機器人的 `has_topics_enabled: true` 時，私訊主題工作階段才會分割；否則私訊會保留在扁平工作階段。
- 長輪詢使用 grammY runner，並採用每聊天／每執行緒排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 多帳號啟動會限制並行的 Telegram `getMe` 探測，避免大型機器人叢集一次扇出每個帳號探測。
- 長輪詢會在每個閘道程序內受到保護，因此同一時間只有一個有效的 poller 可以使用某個機器人 token。如果你仍看到 `getUpdates` 409 衝突，可能是另一個 OpenClaw 閘道、指令碼或外部 poller 正在使用相同 token。
- 預設情況下，長輪詢 watchdog 會在 120 秒內沒有完成的 `getUpdates` 存活性時觸發重新啟動。只有在你的部署仍於長時間執行工作期間看到誤判的輪詢停滯重新啟動時，才提高 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍為 `30000` 到 `600000`；也支援個別帳號覆寫。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果你的設定仍有這些鍵，升級後請執行 `openclaw doctor --fix`。私訊主題路由現在會遵循 Telegram `getMe.has_topics_enabled` 所提供的機器人能力，該能力由 BotFather threaded mode 控制：啟用主題的機器人會在 Telegram 傳送 `message_thread_id` 時使用執行緒範圍的私訊工作階段；其他私訊則保留在扁平工作階段。
</Note>

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組／主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（預設：`partial`）
    - 簡短的初始答案預覽會經過防抖處理，然後如果執行仍在進行中，會在有界延遲後具現化
    - `progress` 會保留一則可編輯的狀態草稿供工具進度使用，在工具進度之前出現答案活動時顯示穩定狀態標籤，在完成時清除它，並將最終答案作為一般訊息傳送
    - `streaming.preview.toolProgress` 控制工具／進度更新是否重用同一則已編輯的預覽訊息（預設：預覽串流啟用時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度行中的命令／執行細節：`raw`（預設，保留已發布行為）或 `status`（僅工具標籤）
    - `streaming.progress.commentary`（預設：`false`）選擇加入暫時進度草稿中的助理 commentary／preamble 文字
    - 舊版 `channels.telegram.streamMode`、布林值 `streaming` 值，以及已淘汰的原生草稿預覽鍵會被偵測；執行 `openclaw doctor --fix` 將它們遷移到目前的串流設定

    工具進度預覽更新是在工具執行時顯示的簡短狀態行，例如命令執行、檔案讀取、規劃更新、修補摘要，或 Codex app-server 模式中的 Codex preamble／commentary 文字。Telegram 預設保持啟用這些項目，以符合 `v2026.4.22` 及之後已發布的 OpenClaw 行為。

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

    若要保持工具進度可見，但隱藏命令／執行文字，請設定：

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

    當你希望顯示工具進度，但不把最終答案編輯到同一則訊息中時，請使用 `progress` 模式。將命令文字政策放在 `streaming.progress` 下：

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

    只有在你想要僅傳送最終內容時，才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，而且通用工具／進度閒聊會被抑制，而不是作為獨立狀態訊息傳送。核准提示、媒體酬載和錯誤仍會透過一般最終傳送路由。當你只想保留答案預覽編輯並隱藏工具進度狀態行時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 選取引文回覆是例外。當 `replyToMode` 為 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含選取的引文文字時，OpenClaw 會透過 Telegram 的原生引文回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法顯示該回合的簡短狀態行。沒有選取引文文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引文回覆更重要時，請設定 `replyToMode: "off"`，或設定 `streaming.preview.toolProgress: false` 以承認這項取捨。
    </Note>

    對於純文字回覆：

    - 簡短的私訊／群組／主題預覽：OpenClaw 會保留同一則預覽訊息，並就地執行最終編輯
    - 分割成多則 Telegram 訊息的長文字最終內容，會在可能時重用現有預覽作為第一個最終區塊，然後只傳送剩餘區塊
    - 進度模式的最終內容會清除狀態草稿，並使用一般最終傳送，而不是將草稿編輯成答案
    - 如果最終編輯在完成文字確認前失敗，OpenClaw 會使用一般最終傳送並清理過時的預覽

    對於複雜回覆（例如媒體酬載），OpenClaw 會退回到一般最終傳送，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免重複串流。

    推理串流行為：

    - `/reasoning stream` 使用受支援頻道的推理預覽路徑；在 Telegram 上，它會在生成時將推理串流到即時預覽中
    - 推理預覽會在最終傳送後刪除；當推理應保持可見時，請使用 `/reasoning on`
    - 最終答案會在不含推理文字的情況下傳送

  </Accordion>

  <Accordion title="豐富訊息格式">
    外送文字預設使用標準 Telegram HTML 訊息，讓回覆在目前 Telegram 用戶端中保持可讀。此相容模式支援一般粗體、斜體、連結、程式碼、劇透和引文，但不支援 Bot API 10.1 的 rich-only 區塊，例如原生表格、詳細資料、富媒體和公式。

    設定 `channels.telegram.richMessages: true` 以選擇加入 Bot API 10.1 豐富訊息：

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

    - agent 會被告知此機器人／帳號可使用 Telegram 豐富訊息。
    - Markdown 文字會透過 OpenClaw 的 Markdown IR 轉譯，並作為 Telegram rich HTML 傳送。
    - 明確的 rich HTML 酬載會保留受支援的 Bot API 10.1 標籤，例如標題、表格、詳細資料、富媒體和公式。
    - 媒體說明文字仍使用 Telegram HTML captions，因為豐富訊息不會取代說明文字。

    這會讓模型文字遠離 Telegram Rich Markdown 符號，因此像 `$400-600K` 這樣的貨幣不會被解析為數學。長篇豐富文字會自動依 Telegram 的豐富文字和豐富區塊限制分割。超過 Telegram 欄位限制的表格會作為程式碼區塊傳送。

    預設：關閉以維持用戶端相容性。豐富訊息需要相容的 Telegram 用戶端；部分目前的 Desktop、Web、Android 和第三方用戶端會將已接受的豐富訊息顯示為不支援。除非與該機器人搭配使用的每個用戶端都能轉譯它們，否則請保持此選項停用。`/status` 會顯示目前 Telegram 工作階段的豐富訊息是開啟或關閉。

    連結預覽預設啟用。`channels.telegram.linkPreview: false` 會略過豐富文字的自動實體偵測。

  </Accordion>

  <Accordion title="原生命令與自訂命令">
    Telegram 命令選單註冊會在啟動時以 `setMyCommands` 處理。

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

    - 名稱會被正規化（移除開頭的 `/`、轉為小寫）
    - 有效模式：`a-z`、`0-9`、`_`，長度 `1..32`
    - 自訂命令不能覆寫原生命令
    - 衝突／重複項目會被略過並記錄

    注意事項：

    - 自訂命令只是選單項目；它們不會自動實作行為
    - plugin／skill 命令即使未顯示在 Telegram 選單中，輸入時仍可能運作

    如果原生命令停用，內建命令會被移除。自訂／plugin 命令若已設定，仍可註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍溢出；請減少 plugin／skill／自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 命令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 因 `404: Not Found` 失敗時，可能表示 `channels.telegram.apiRoot` 被設定成完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只包含 Bot API 根目錄，且 `openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕了已設定的機器人 token。請使用目前的 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為網路鉤子清理失敗。
    - `setMyCommands failed` 搭配網路／fetch 錯誤，通常表示通往 `api.telegram.org` 的外送 DNS／HTTPS 被封鎖。

    ### 裝置配對命令（`device-pair` plugin）

    安裝 `device-pair` plugin 時：

    1. `/pair` 產生設定代碼
    2. 將代碼貼到 iOS app
    3. `/pair pending` 列出待處理請求（包含角色／範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - `/pair approve` 用於只有一個待處理請求時
       - `/pair approve latest` 用於最近一個

    設定代碼帶有短效 bootstrap token。內建設定代碼 bootstrap 僅限節點：第一次連線會建立待處理節點請求，核准後 Gateway 會回傳具有 `scopes: []` 的持久節點 token。它不會回傳移交後的 operator token；operator 存取需要另外核准的 operator 配對或 token 流程。

    如果裝置以變更後的驗證詳細資料重試（例如角色／範圍／公開金鑰），先前的待處理請求會被取代，而新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

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

    每個帳號的覆寫設定：

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

    小型應用程式按鈕範例：

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

    Telegram `web_app` 按鈕僅適用於使用者與
    機器人之間的私人聊天。

    未由已註冊外掛互動式處理常式宣告處理的回呼點擊，
    會以文字傳遞給代理：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="供代理與自動化使用的 Telegram 訊息動作">
    Telegram 工具動作包括：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、選用 `presentation` 行內按鈕；僅按鈕編輯會更新回覆標記）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作會公開符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘門控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有獨立的 `channels.telegram.actions.*` 切換設定。
    執行階段傳送會使用作用中的設定/祕密快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時的 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆串接標籤">
    Telegram 支援在產生的輸出中使用明確的回覆串接標籤：

    - `[[reply_to_current]]` 回覆觸發訊息
    - `[[reply_to:<id>]]` 回覆特定 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    啟用回覆串接且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 程式碼單位，因此較長的訊息會從開頭引用；若 Telegram 拒絕該引用，則退回為純回覆。

    注意：`off` 會停用隱含的回覆串接。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與討論串行為">
    論壇超級群組：

    - 主題工作階段鍵會附加 `:topic:<threadId>`
    - 回覆與輸入狀態會指向主題討論串
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入狀態動作仍會包含 `message_thread_id`

    主題繼承：除非覆寫，否則主題項目會繼承群組設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅適用於主題，且不會從群組預設值繼承。
    `topics."*"` 會設定該群組中每個主題的預設值；精確主題 ID 仍優先於 `"*"`。

    **每個主題的代理路由**：每個主題都可以透過在主題設定中設定 `agentId` 路由到不同代理。這會讓每個主題都有自己的隔離工作區、記憶與工作階段。範例：

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

    **持久 ACP 主題繫結**：論壇主題可以透過頂層型別化 ACP 繫結釘選 ACP harness 工作階段（`bindings[]` 搭配 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 這樣含主題限定的 id）。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

    **從聊天產生受討論串繫結的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由至該處。OpenClaw 會在主題中釘選產生確認。需要保持啟用 `channels.telegram.threadBindings.spawnSessions`（預設：`true`）。

    範本內容會公開 `MessageThreadId` 和 `IsForum`。具有 `message_thread_id` 的私訊聊天會保留回覆中繼資料；只有當 Telegram `getMe` 回報該機器人的 `has_topics_enabled: true` 時，才會使用具討論串感知能力的工作階段鍵。
    先前的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆寫已刻意退役；請使用 BotFather threaded mode 作為單一真實來源，並執行 `openclaw doctor --fix` 來移除過時的設定鍵。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。

    - 預設：音訊檔案行為
    - 在代理回覆中加入標籤 `[[audio_as_voice]]` 可強制以語音訊息傳送
    - 傳入語音訊息轉錄會在代理內容中被框定為機器產生、
      不受信任的文字；提及偵測仍會使用原始
      轉錄，因此受提及閘門控制的語音訊息會繼續運作。

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

    Telegram 會區分影片檔案與影片記事。

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

    影片記事不支援說明文字；提供的訊息文字會另行傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（預留位置 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖情境欄位：

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

  <Accordion title="Reaction notifications">
    Telegram 反應會以 `message_reaction` 更新抵達（與訊息承載資料分開）。

    啟用後，OpenClaw 會將這類系統事件加入佇列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示只包含使用者對機器人所傳送訊息的反應（透過已傳送訊息快取盡力判定）。
    - 反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被捨棄。
    - Telegram 不會在反應更新中提供討論串 ID。
      - 非論壇群組會路由到群組聊天室工作階段
      - 論壇群組會路由到群組一般主題工作階段（`:topic:1`），而不是確切的原始主題

    輪詢/網路鉤子的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`ackReactionScope` 決定該表情符號實際傳送的*時機*。

    **表情符號（`ackReaction`）解析順序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用某個頻道或帳號的反應。

    **範圍（`messages.ackReactionScope`）：**

    Telegram 提供者會從 `messages.ackReactionScope` 讀取範圍（預設 `"group-mentions"`）。目前沒有 Telegram 帳號層級或 Telegram 頻道層級的覆寫。

    值：`"all"`（私訊 + 群組）、`"direct"`（僅私訊）、`"group-all"`（每則群組訊息，不含私訊）、`"group-mentions"`（機器人被提及時的群組；**不含私訊** — 這是預設值）、`"off"` / `"none"`（已停用）。

    <Note>
    預設範圍（`"group-mentions"`）不會在直接訊息中觸發確認反應。若要在傳入的 Telegram 私訊上取得確認反應，請將 `messages.ackReactionScope` 設為 `"direct"` 或 `"all"`。此值會在 Telegram 提供者啟動時讀取，因此需要重新啟動閘道，變更才會生效。
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    頻道設定寫入預設為啟用（`configWrites !== false`）。

    由 Telegram 觸發的寫入包含：

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

  <Accordion title="Long polling vs webhook">
    預設為長輪詢。若要使用網路鉤子模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；選用的 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在長輪詢模式中，OpenClaw 只會在更新成功分派後，持久化其重新啟動水位標記。如果處理常式失敗，該更新在同一個程序中仍可重試，且不會被寫為已完成以供重新啟動去重。

    本機監聽器會繫結到 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前放置反向代理，或有意地設定 `webhookHost: "0.0.0.0"`。

    網路鉤子模式會在回傳 `200` 給 Telegram 前，驗證請求防護、Telegram 秘密權杖，以及 JSON 本文。
    接著 OpenClaw 會透過長輪詢使用的相同每聊天室/每主題機器人通道，以非同步方式處理更新，因此緩慢的代理回合不會占住 Telegram 的遞送 ACK。

  </Accordion>

  <Accordion title="限制、重試與命令列介面目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會先偏好段落邊界（空白行），再依長度分割。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入與傳出的 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其作為一則傳入訊息派送前的緩衝時間。如果相簿部分較晚抵達，請增加此值；若要降低相簿回覆延遲，請減少此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則套用 grammY 預設值）。Bot 用戶端會將低於 60 秒傳出文字/輸入狀態請求保護的設定值限制住，避免 grammY 在 OpenClaw 的傳輸保護與備援可執行前中止可見回覆傳遞。長輪詢仍使用 45 秒的 `getUpdates` 請求保護，讓閒置輪詢不會被無限期放棄。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；只有在誤判輪詢停滯重啟時，才調整到 `30000` 到 `600000` 之間。
    - 群組脈絡歷史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 當閘道已觀察到父訊息時，回覆/引用/轉傳補充脈絡會正規化到一個選定的對話脈絡視窗中；已觀察訊息快取位於 OpenClaw SQLite 外掛狀態中，且 `openclaw doctor --fix` 會匯入舊版 sidecar。Telegram 在更新中只包含一層淺層 `reply_to_message`，因此早於快取的鏈結會受限於 Telegram 目前的更新 payload。
    - Telegram allowlist 主要控管誰可以觸發代理，而不是完整的補充脈絡遮罩邊界。
    - 私訊歷史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用於 Telegram 傳送輔助程式（命令列介面/工具/動作）的可復原傳出 API 錯誤。傳入最終回覆傳遞也會對 Telegram 連線前失敗使用有界安全傳送重試，但不會重試可能造成可見訊息重複的模糊傳送後網路封包。

    命令列介面與訊息工具傳送目標可以是數字聊天室 ID、使用者名稱，或論壇主題目標：

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

    - `--presentation` 搭配 `buttons` 區塊，可在 `channels.telegram.capabilities.inlineButtons` 允許時使用內嵌鍵盤
    - `--pin` 或 `--delivery '{"pin":true}'`，在 Bot 可於該聊天室釘選時要求釘選傳遞
    - `--force-document` 會將傳出圖片、GIF 和影片作為文件傳送，而不是壓縮相片、動畫媒體或影片上傳

    動作控管：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用 Telegram 投票建立，同時保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中的執行核准，也可選擇在原始聊天室或主題中發布提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（至少一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（退回使用來自 `commands.ownerAllowFrom` 的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（預設）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以與 Bot 對話，以及它將一般回覆傳送到哪裡。它們不會讓某人成為執行核准者。當尚未存在命令擁有者時，第一次核准的私訊配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，而不需要在 `execApprovals.approvers` 下重複 ID。

    頻道傳遞會在聊天室中顯示命令文字；僅在受信任的群組/主題中啟用 `channel` 或 `both`。當提示出現在論壇主題中時，OpenClaw 會保留該主題給核准提示與後續回覆。執行核准預設會在 30 分鐘後過期。

    內嵌核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標表面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過外掛核准解析；其他則會先透過執行核准解析。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到傳遞或提供者錯誤時，錯誤政策會控制是否將錯誤訊息傳送到 Telegram 聊天室：

| 鍵                                  | 值                         | 預設            | 說明                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — 將每個錯誤訊息傳送到聊天室。`once` — 每個唯一錯誤訊息在每個冷卻視窗只傳送一次（抑制重複的相同錯誤）。`silent` — 永不將錯誤訊息傳送到聊天室。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` 政策的冷卻視窗。錯誤送出後，相同錯誤訊息會被抑制，直到此間隔經過。防止中斷期間的錯誤洗版。                                      |

支援每帳號、每群組與每主題覆寫（繼承方式與其他 Telegram 設定鍵相同）。

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
  <Accordion title="Bot 未回應非提及的群組訊息">

    - 如果 `requireMention=false`，Telegram privacy mode 必須允許完整可見性。
      - BotFather: `/setprivacy` -> Disable
      - 接著移除 Bot 並重新加入群組
    - 當設定預期非提及群組訊息時，`openclaw channels status` 會警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法探測成員資格。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須被列出（或包含 `"*"`）
    - 驗證 Bot 在群組中的成員資格
    - 檢閱日誌：使用 `openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="命令部分運作或完全無法運作">

    - 授權你的傳送者身分（配對和/或數字 `allowFrom`）
    - 即使群組政策是 `open`，命令授權仍會套用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單有太多項目；請減少外掛/skill/自訂命令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入狀態呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續的網路/fetch 錯誤通常表示連到 `api.telegram.org` 的 DNS/HTTPS 可達性問題

  </Accordion>

  <Accordion title="啟動回報未授權 token">

    - `getMe returned 401` 是設定的 Bot token 發生 Telegram 驗證失敗。
    - 在 BotFather 中重新複製或重新產生 Bot token，然後更新預設帳號的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將它視為「沒有網路鉤子存在」只會把相同的錯誤 token 失敗延後到之後的 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - 節點 22+ 搭配自訂 fetch/proxy 時，如果 AbortSignal 類型不相符，可能觸發立即中止行為。
    - 某些主機會先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 對外連線可能導致間歇性 Telegram API 失敗。
    - 如果日誌包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些作為可復原的網路錯誤重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此 runner 不需要在第一次 `getUpdates` 前再做第二次 `getMe`。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤失敗，OpenClaw 會繼續進入長輪詢，而不是再進行另一個輪詢前控制平面呼叫。仍然啟用的網路鉤子會顯示為 `getUpdates` 衝突；OpenClaw 接著會重建 Telegram 傳輸並重試網路鉤子清理。
    - 如果 Telegram socket 以短而固定的週期回收，請檢查是否有偏低的 `channels.telegram.timeoutSeconds`；Bot 用戶端會將低於傳出與 `getUpdates` 請求保護的設定值限制住，但較舊版本在此值設為低於那些保護時，可能會中止每次輪詢或回覆。
    - 如果日誌包含 `Polling stall detected`，OpenClaw 預設會在 120 秒沒有完成長輪詢存活性後重啟輪詢並重建 Telegram 傳輸。
    - `openclaw channels status --probe` 和 `openclaw doctor` 會在執行中的輪詢帳號於啟動寬限後尚未完成 `getUpdates`、執行中的網路鉤子帳號於啟動寬限後尚未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過期時發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫健康，但你的主機仍回報誤判輪詢停滯重啟時，才增加 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 對外連線問題。
    - Telegram 也會遵循 Bot API 傳輸的程序 proxy env，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可繞過 `api.telegram.org`。
    - 如果服務環境透過 `OPENCLAW_PROXY_URL` 設定 OpenClaw 受管理 proxy，且沒有標準 proxy env 存在，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接對外連線/TLS 不穩定的 VPS 主機上，請透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - 節點 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再到程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；若都不適用，節點 22+ 會退回 `ipv4first`。
    - 如果你的主機是 WSL2，或明確使用僅 IPv4 行為會更穩定，請強制家族選擇：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準測試範圍回應（`198.18.0.0/15`）已預設允許
      用於 Telegram 媒體下載。如果受信任的假 IP 或
      透明代理在媒體下載期間將 `api.telegram.org` 重寫為其他
      私有/內部/特殊用途位址，你可以選擇啟用
      僅限 Telegram 的旁路：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 相同的選擇啟用也可在每個帳號使用：
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理將 Telegram 媒體主機解析為 `198.18.x.x`，請先保持
      危險旗標關閉。Telegram 媒體已預設允許 RFC 2544
      基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 防護。只應在受信任、由操作者控制的代理
      環境使用，例如 Clash、Mihomo 或 Surge 假 IP 路由，且它們會
      合成 RFC 2544 基準測試範圍以外的私有或特殊用途回應。
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

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 主題預設值：`groups.<chatId>.topics."*"` 會套用到未匹配的論壇主題；精確主題 ID 會覆寫它
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
- 指令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒/回覆：`replyToMode`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/傳遞：`textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅 Bot API 根目錄；不要包含 `/bot<TOKEN>`）
- 網路鉤子：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 回應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入/歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個以上帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）讓預設路由明確。否則 OpenClaw 會退回第一個正規化帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到閘道。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組與主題允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組和主題對應到代理。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷。
  </Card>
</CardGroup>
