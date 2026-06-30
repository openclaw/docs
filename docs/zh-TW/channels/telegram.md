---
read_when:
    - 處理 Telegram 功能或網路鉤子
summary: Telegram Bot 支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-06-30T13:45:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e143096bbcdf949ef11566ffe2a5360eea261cd5bf99f0cf90d31c8e9d4637d6
    source_path: channels/telegram.md
    workflow: 16
---

Production-ready for bot DMs and groups via grammY. Long polling is the default mode; webhook mode is optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷與修復手冊。
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-TW/gateway/configuration">
    完整通道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="Create the bot token in BotFather">
    開啟 Telegram 並與 **@BotFather** 聊天（確認帳號代稱完全是 `@BotFather`）。

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
    將機器人加入你的群組，然後取得群組存取需要的兩個 ID：

    - 你的 Telegram 使用者 ID，用於 `allowFrom` / `groupAllowFrom`
    - Telegram 群組聊天 ID，用作 `channels.telegram.groups` 底下的鍵

    第一次設定時，請從 `openclaw logs --follow`、轉寄 ID 機器人，或 Bot API `getUpdates` 取得群組聊天 ID。群組允許後，`/whoami@<bot_username>` 可以確認使用者與群組 ID。

    以 `-100` 開頭的負數 Telegram 超級群組 ID 是群組聊天 ID。請將它們放在 `channels.telegram.groups` 底下，而不是 `groupAllowFrom` 底下。

  </Step>
</Steps>

<Note>
權杖解析順序會感知帳號。實務上，設定值優先於環境變數備援，而 `TELEGRAM_BOT_TOKEN` 只適用於預設帳號。
成功啟動後，OpenClaw 會在狀態目錄快取機器人身分最多 24 小時，讓重新啟動可避免額外的 Telegram `getMe` 呼叫；變更或移除權杖會清除該快取。
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

    管理員機器人會收到所有群組訊息，這對永遠開啟的群組行為很有用。

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` 用於允許/拒絕加入群組
    - `/setprivacy` 用於群組可見性行為

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

### 群組機器人身分

在 Telegram 群組與論壇主題中，明確提及已設定的機器人帳號代稱（例如 `@my_bot`）會被視為正在呼叫選定的 OpenClaw 代理，即使代理人格名稱不同於 Telegram 使用者名稱。群組靜音政策仍適用於無關的群組流量，但機器人帳號代稱本身不會被視為「其他人」。

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` 控制私訊存取：

    - `pairing`（預設）
    - `allowlist`（需要 `allowFrom` 中至少有一個傳送者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到機器人使用者名稱的 Telegram 帳號都能指令機器人。請只將它用於有意公開、且工具受到嚴格限制的機器人；單一擁有者機器人應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳號層級的 `allowFrom: ["*"]` 項目不會讓該帳號公開，除非合併後的有效帳號允許清單仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有私訊，並遭設定驗證拒絕。
    設定只會要求數字使用者 ID。
    如果你已升級且設定包含 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram 機器人權杖）。
    如果你先前仰賴配對儲存的允許清單檔案，`openclaw doctor --fix` 可在允許清單流程中將項目復原到 `channels.telegram.allowFrom`（例如當 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確數字 `allowFrom` ID，讓存取政策在設定中持久保存（而不是依賴先前的配對核准）。

    常見混淆：私訊配對核准不代表「這個傳送者在所有地方都已授權」。
    配對授予私訊存取。如果尚無指令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅限擁有者的指令與執行核准有明確的操作員帳號。
    群組傳送者授權仍來自明確設定的允許清單。
    如果你想要「我授權一次後，私訊和群組指令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅限擁有者的指令，請確保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

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

    `groupAllowFrom` 用於群組傳送者篩選。如果未設定，Telegram 會回退使用 `allowFrom`。
    `groupAllowFrom` 項目應是數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    不要將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 應放在 `channels.telegram.groups` 底下。
    非數字項目會在傳送者授權中被忽略。
    安全邊界（`2026.2.25+`）：群組傳送者驗證**不**繼承私訊配對儲存核准。
    配對保持僅限私訊。對於群組，請設定 `groupAllowFrom` 或每群組/每主題的 `allowFrom`。
    如果 `groupAllowFrom` 未設定，Telegram 會回退使用設定中的 `allowFrom`，而不是配對儲存。
    單一擁有者機器人的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，保持 `groupAllowFrom` 未設定，並在 `channels.telegram.groups` 底下允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，執行階段預設會 fail-closed 到 `groupPolicy="allowlist"`，除非明確設定 `channels.defaults.groupPolicy`。

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

    從群組中使用 `@<bot_username> ping` 測試。當 `requireMention: true` 時，普通群組訊息不會觸發機器人。

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

    範例：僅允許某個特定群組中的特定使用者：

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
      - 只有當你希望已允許群組中的任何成員都能與機器人對話時，才使用 `groupAllowFrom: ["*"]`。

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

    群組歷史脈絡預設為 `mention-only`：只有先前群組訊息曾呼叫機器人、是對機器人的回覆，或是機器人自己的訊息時，才會被包含。對於受信任群組，將 `includeGroupHistoryContext: "recent"` 設為包含近期房間歷史。將 `includeGroupHistoryContext: "none"` 設為在下一輪不傳送先前 Telegram 群組歷史。

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

    - 將群組訊息轉寄給 `@userinfobot` / `@getidsbot`
    - 或從 `openclaw logs --follow` 讀取 `chat.id`
    - 或檢查 Bot API `getUpdates`
    - 群組允許後，如果原生指令已啟用，請執行 `/whoami@<bot_username>`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由閘道程序擁有。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會標準化為共用頻道信封，包含回覆中繼資料、媒體佔位符，以及閘道已觀察到之 Telegram 回覆的持久化回覆鏈脈絡。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>` 以保持主題隔離。
- 私訊訊息可以帶有 `message_thread_id`；OpenClaw 會保留它以用於回覆。只有當 Telegram `getMe` 回報該 Bot 的 `has_topics_enabled: true` 時，私訊主題工作階段才會拆分；否則私訊會留在扁平工作階段。
- 長輪詢使用 grammY runner，並採用每聊天/每討論串排序。整體 runner sink 並行度使用 `agents.defaults.maxConcurrent`。
- 多帳號啟動會限制並行 Telegram `getMe` 探測數量，避免大型 Bot 叢集一次展開所有帳號探測。
- 長輪詢會在每個閘道程序內受到保護，因此同一時間只有一個作用中的 poller 可以使用 Bot token。如果你仍看到 `getUpdates` 409 衝突，很可能有另一個 OpenClaw 閘道、指令碼或外部 poller 正在使用相同 token。
- 預設情況下，長輪詢 watchdog 會在 120 秒內沒有完成的 `getUpdates` 存活訊號後觸發重新啟動。只有在你的部署於長時間執行工作期間仍看到誤判的 polling-stall 重新啟動時，才增加 `channels.telegram.pollingStallThresholdMs`。此值以毫秒為單位，允許範圍為 `30000` 到 `600000`；支援每帳號覆寫。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果升級後你的設定仍有這些鍵，請執行 `openclaw doctor --fix`。私訊主題路由現在會遵循 Telegram `getMe.has_topics_enabled` 提供的 Bot 能力，這是由 BotFather 的討論串模式控制：啟用主題的 Bot 會在 Telegram 傳送 `message_thread_id` 時使用討論串範圍的私訊工作階段；其他私訊會留在扁平工作階段。
</Note>

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（預設：`partial`）
    - 簡短的初始答案預覽會先經過防抖，若執行仍在作用中，則會在有界延遲後具體化
    - `progress` 會為工具進度保留一則可編輯狀態草稿，在答案活動早於工具進度到達時顯示穩定狀態標籤，完成時清除它，並以一般訊息傳送最終答案
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用同一則已編輯預覽訊息（預設：當預覽串流作用中時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度行內的命令/exec 詳細資訊：`raw`（預設，保留已發布行為）或 `status`（僅工具標籤）
    - `streaming.progress.commentary`（預設：`false`）選擇在暫時進度草稿中包含助理 commentary/preamble 文字
    - 舊版 `channels.telegram.streamMode`、布林 `streaming` 值，以及已淘汰的原生草稿預覽鍵會被偵測；請執行 `openclaw doctor --fix` 將它們遷移到目前串流設定

    工具進度預覽更新是在工具執行時顯示的簡短狀態行，例如命令執行、檔案讀取、規劃更新、修補摘要，或 Codex app-server 模式中的 Codex preamble/commentary 文字。Telegram 預設會保持啟用這些更新，以符合 `v2026.4.22` 及後續版本已發布的 OpenClaw 行為。

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

    若要保留工具進度可見，但隱藏命令/exec 文字，請設定：

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

    當你想要可見的工具進度，但不想把最終答案編輯進同一則訊息時，請使用 `progress` 模式。將命令文字政策放在 `streaming.progress` 下：

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

    只有在你想要僅傳送最終結果時才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，且一般工具/進度雜訊會被抑制，而不是以獨立狀態訊息傳送。核准提示、媒體酬載和錯誤仍會透過一般最終傳遞路由。當你只想保留答案預覽編輯，同時隱藏工具進度狀態行時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 選取引用回覆是例外。當 `replyToMode` 為 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含選取引用文字時，OpenClaw 會透過 Telegram 的原生引用回覆路徑傳送最終答案，而不是編輯答案預覽，因此該回合的 `streaming.preview.toolProgress` 無法顯示簡短狀態行。沒有選取引用文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引用回覆更重要時，請設定 `replyToMode: "off"`；或設定 `streaming.preview.toolProgress: false` 以承認此取捨。
    </Note>

    對於純文字回覆：

    - 簡短私訊/群組/主題預覽：OpenClaw 會保留同一則預覽訊息，並就地執行最終編輯
    - 會拆分為多則 Telegram 訊息的長文字最終結果，會在可能時重用既有預覽作為第一個最終區塊，然後只傳送剩餘區塊
    - 進度模式最終結果會清除狀態草稿，並使用一般最終傳遞，而不是把草稿編輯成答案
    - 如果最終編輯在已完成文字確認之前失敗，OpenClaw 會使用一般最終傳遞，並清理過時的預覽

    對於複雜回覆（例如媒體酬載），OpenClaw 會退回一般最終傳遞，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會跳過預覽串流以避免雙重串流。

    推理串流行為：

    - `/reasoning stream` 使用受支援頻道的推理預覽路徑；在 Telegram 上，它會在產生期間將推理串流到即時預覽中
    - 推理預覽會在最終傳遞後刪除；當推理應保持可見時，請使用 `/reasoning on`
    - 最終答案會在不含推理文字的情況下傳送

  </Accordion>

  <Accordion title="豐富訊息格式">
    預設情況下，輸出文字會使用標準 Telegram HTML 訊息，因此回覆在目前 Telegram 用戶端中都能保持可讀。此相容模式支援一般粗體、斜體、連結、程式碼、劇透和引用，但不支援 Bot API 10.1 的 rich-only 區塊，例如原生表格、詳細資訊、豐富媒體和公式。

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

    啟用後：

    - 系統會告知代理此 Bot/帳號可使用 Telegram 豐富訊息。
    - Markdown 文字會透過 OpenClaw 的 Markdown IR 轉譯，並以 Telegram 豐富 HTML 傳送。
    - 明確的豐富 HTML 酬載會保留支援的 Bot API 10.1 標籤，例如標題、表格、詳細資訊、豐富媒體和公式。
    - 媒體標題仍使用 Telegram HTML 標題，因為豐富訊息不會取代標題。

    這會讓模型文字避開 Telegram Rich Markdown 符記，因此像 `$400-600K` 這樣的貨幣不會被解析為數學。長篇豐富文字會依照 Telegram 的豐富文字與豐富區塊限制自動拆分。超過 Telegram 欄數限制的表格會以程式碼區塊傳送。

    預設：為了用戶端相容性而關閉。豐富訊息需要相容的 Telegram 用戶端；部分目前的 Desktop、Web、Android 和第三方用戶端會把已接受的豐富訊息顯示為不支援。除非與該 Bot 搭配使用的每個用戶端都能轉譯它們，否則請保持停用此選項。`/status` 會顯示目前 Telegram 工作階段是否開啟豐富訊息。

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

    - 名稱會標準化（移除開頭 `/`、轉為小寫）
    - 有效模式：`a-z`、`0-9`、`_`，長度 `1..32`
    - 自訂命令不能覆寫原生命令
    - 衝突/重複項目會被略過並記錄

    注意事項：

    - 自訂命令只是選單項目；它們不會自動實作行為
    - 即使未顯示在 Telegram 選單中，外掛/skill 命令在輸入時仍可運作

    如果停用原生命令，內建命令會被移除。自訂/外掛命令若已設定，仍可註冊。

    常見設定失敗：

    - `setMyCommands failed` 並出現 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍溢出；請減少外掛/skill/自訂命令，或停用 `channels.telegram.commands.native`。
    - `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並出現 `404: Not Found`，但直接 Bot API curl 命令可運作，可能表示 `channels.telegram.apiRoot` 被設定為完整 `/bot<TOKEN>` 端點。`apiRoot` 必須只是 Bot API 根路徑，且 `openclaw doctor --fix` 會移除意外的尾端 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕了設定的 Bot token。請使用目前的 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在 polling 前停止，因此這不會被回報為 webhook cleanup 失敗。
    - `setMyCommands failed` 並出現網路/fetch 錯誤通常表示連到 `api.telegram.org` 的對外 DNS/HTTPS 被封鎖。

    ### 裝置配對命令（`device-pair` 外掛）

    安裝 `device-pair` 外掛時：

    1. `/pair` 產生設定碼
    2. 在 iOS app 中貼上代碼
    3. `/pair pending` 列出待處理請求（包含角色/範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - `/pair approve` 用於只有一個待處理請求時
       - `/pair approve latest` 用於最新請求

    設定碼會攜帶短期 bootstrap token。內建設定碼 bootstrap 僅限節點：第一次連線會建立待處理節點請求，核准後，閘道會回傳具有 `scopes: []` 的持久節點 token。它不會回傳已交接的 operator token；operator 存取需要獨立核准的 operator 配對或 token 流程。

    如果裝置以變更後的驗證詳細資訊（例如角色/範圍/公開金鑰）重試，先前的待處理請求會被取代，新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

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

    依帳號覆寫：

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

    舊版 `capabilities: ["inlineButtons"]` 對應至 `inlineButtons: "all"`。

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
    Bot 之間的私人聊天。

    回呼點擊會以文字傳遞給代理：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="代理與自動化的 Telegram 訊息動作">
    Telegram 工具動作包括：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、選用 `presentation` 行內按鈕；僅按鈕的編輯會更新回覆標記）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作會公開符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    閘控控制項：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設為啟用，且沒有獨立的 `channels.telegram.actions.*` 切換。
    執行階段傳送會使用作用中的設定/密鑰快照（啟動/重新載入），因此動作路徑不會在每次傳送時執行臨時 SecretRef 重新解析。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)

  </Accordion>

  <Accordion title="回覆執行緒標籤">
    Telegram 支援在產生的輸出中使用明確的回覆執行緒標籤：

    - `[[reply_to_current]]` 會回覆觸發訊息
    - `[[reply_to:<id>]]` 會回覆特定 Telegram 訊息 ID

    `channels.telegram.replyToMode` 控制處理方式：

    - `off`（預設）
    - `first`
    - `all`

    啟用回覆執行緒，且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 程式碼單元，因此較長訊息會從開頭引用；若 Telegram 拒絕該引用，則退回為純回覆。

    注意：`off` 會停用隱含回覆執行緒。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與執行緒行為">
    論壇超級群組：

    - 主題工作階段鍵會附加 `:topic:<threadId>`
    - 回覆和輸入中狀態會以主題執行緒為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入中動作仍會包含 `message_thread_id`

    主題繼承：除非覆寫，否則主題項目會繼承群組設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅限主題使用，且不會從群組預設值繼承。
    `topics."*"` 會為該群組中的每個主題設定預設值；精確主題 ID 仍優先於 `"*"`。

    **依主題代理路由**：每個主題都可透過在主題設定中設定 `agentId`，路由到不同代理。這會讓每個主題擁有自己的隔離工作區、記憶和工作階段。範例：

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

    **持久 ACP 主題繫結**：論壇主題可透過最上層的具型別 ACP 繫結（`bindings[]`，含 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及如 `-1001234567890:topic:42` 的主題限定 ID）釘選 ACP harness 工作階段。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

    **從聊天產生執行緒繫結 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由至該處。OpenClaw 會在主題中釘選產生確認。需要 `channels.telegram.threadBindings.spawnSessions` 保持啟用（預設：`true`）。

    範本內容會公開 `MessageThreadId` 和 `IsForum`。帶有 `message_thread_id` 的 DM 聊天會保留回覆中繼資料；只有當 Telegram `getMe` 回報 Bot 的 `has_topics_enabled: true` 時，才會使用執行緒感知工作階段鍵。
    先前的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆寫已刻意退役；請使用 BotFather 執行緒模式作為唯一真實來源，並執行 `openclaw doctor --fix` 移除過時的設定鍵。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。

    - 預設：音訊檔案行為
    - 在代理回覆中使用標籤 `[[audio_as_voice]]` 以強制傳送語音訊息
    - 傳入的語音訊息轉錄會在代理內容中框定為機器產生的
      不受信任文字；提及偵測仍會使用原始
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

    ### 視訊訊息

    Telegram 會區分視訊檔案與視訊備註。

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

    視訊備註不支援字幕；提供的訊息文字會另外傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（預留位置 `<media:sticker>`）
    - 動態 TGS：略過
    - 視訊 WEBM：略過

    貼圖脈絡欄位：

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

  <Accordion title="反應通知">
    Telegram 反應會以 `message_reaction` 更新形式抵達（與訊息承載資料分開）。

    啟用後，OpenClaw 會將如下系統事件加入佇列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`: `off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（預設：`minimal`）

    注意：

    - `own` 表示僅限使用者對機器人傳送訊息的反應（透過已傳送訊息快取盡力判斷）。
    - 反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被捨棄。
    - Telegram 不會在反應更新中提供討論串 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組的一般主題工作階段（`:topic:1`），而不是確切的來源主題

    輪詢/網路鉤子的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認 emoji。`ackReactionScope` 決定該 emoji 實際傳送的*時機*。

    **Emoji（`ackReaction`）解析順序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理程式身分 emoji 後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意：

    - Telegram 預期使用 unicode emoji（例如 "👀"）。
    - 使用 `""` 可停用某個頻道或帳號的反應。

    **範圍（`messages.ackReactionScope`）：**

    Telegram 提供者會從 `messages.ackReactionScope` 讀取範圍（預設 `"group-mentions"`）。目前沒有 Telegram 帳號層級或 Telegram 頻道層級的覆寫。

    值：`"all"`（私訊 + 群組）、`"direct"`（僅私訊）、`"group-all"`（每則群組訊息，不含私訊）、`"group-mentions"`（機器人被提及時的群組；**不含私訊** — 這是預設值）、`"off"` / `"none"`（已停用）。

    <Note>
    預設範圍（`"group-mentions"`）不會在直接訊息中觸發確認反應。若要在傳入的 Telegram 私訊中取得確認反應，請將 `messages.ackReactionScope` 設為 `"direct"` 或 `"all"`。此值會在 Telegram 提供者啟動時讀取，因此需要重新啟動閘道才能讓變更生效。
    </Note>

  </Accordion>

  <Accordion title="來自 Telegram 事件和命令的設定寫入">
    頻道設定寫入預設為啟用（`configWrites !== false`）。

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

  <Accordion title="長輪詢與網路鉤子">
    預設為長輪詢。若要使用網路鉤子模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；選用的 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在長輪詢模式中，OpenClaw 只有在更新成功分派後，才會持久化其重新啟動浮水印。如果處理常式失敗，該更新在同一程序中仍可重試，且不會寫入為已完成以供重新啟動去重。

    本機監聽器會繫結至 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前方放置反向代理，或有意地設定 `webhookHost: "0.0.0.0"`。

    網路鉤子模式會先驗證請求防護、Telegram secret token 和 JSON 主體，然後才向 Telegram 回傳 `200`。
    接著 OpenClaw 會透過長輪詢所使用的相同每聊天/每主題機器人通道非同步處理更新，因此緩慢的代理程式回合不會佔住 Telegram 的交付 ACK。

  </Accordion>

  <Accordion title="限制、重試與命令列介面目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會在依長度切分前，優先使用段落邊界（空白行）。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入與傳出 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將其作為一則傳入訊息分派前的緩衝時間。如果相簿片段較晚抵達，請提高此值；若要降低相簿回覆延遲，請降低此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則套用 grammY 預設值）。Bot 用戶端會將低於 60 秒傳出文字/輸入中請求防護的設定值鉗制住，讓 grammY 不會在 OpenClaw 的傳輸防護與備援可執行前中止可見回覆傳遞。長輪詢仍使用 45 秒的 `getUpdates` 請求防護，因此閒置輪詢不會被無限期擱置。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；僅在輪詢停滯重啟出現誤判時，才調整到 `30000` 到 `600000` 之間。
    - 群組脈絡歷史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 當閘道已觀察到父訊息時，回覆/引用/轉寄的補充脈絡會正規化為一個選定的對話脈絡視窗；已觀察訊息快取位於 OpenClaw SQLite 外掛狀態中，且 `openclaw doctor --fix` 會匯入舊式 sidecar。Telegram 在更新中只包含一層淺層 `reply_to_message`，因此早於快取的鏈結會受限於 Telegram 目前的更新承載。
    - Telegram 允許清單主要控管誰可以觸發代理，不是完整的補充脈絡遮蔽邊界。
    - DM 歷史控制項：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定會套用到 Telegram 傳送輔助工具（命令列介面/工具/動作），用於可復原的傳出 API 錯誤。傳入最終回覆傳遞也會針對 Telegram 預連線失敗使用有界限的安全傳送重試，但不會重試可能重複可見訊息的模糊傳送後網路信封。

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

    - `--presentation` 搭配 `buttons` 區塊，用於在 `channels.telegram.capabilities.inlineButtons` 允許時建立行內鍵盤
    - `--pin` 或 `--delivery '{"pin":true}'`，在 Bot 可於該聊天中釘選時請求釘選傳遞
    - `--force-document` 將傳出圖片、GIF 與影片作為文件傳送，而不是壓縮相片、動畫媒體或影片上傳

    動作控管：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用 Telegram 投票建立，同時保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者 DM 中進行執行核准，也可以選擇在來源聊天或主題中張貼提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（至少有一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（退回使用 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（預設）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 與 `defaultTo` 控制誰可以與 Bot 交談，以及它會將一般回覆傳送到哪裡。它們不會讓某人成為執行核准者。當尚無命令擁有者時，第一個已核准的 DM 配對會引導建立 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，不必在 `execApprovals.approvers` 下重複 ID。

    頻道傳遞會在聊天中顯示命令文字；只有在受信任的群組/主題中才啟用 `channel` 或 `both`。當提示落在論壇主題中時，OpenClaw 會保留該主題供核准提示與後續使用。執行核准預設會在 30 分鐘後到期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過外掛核准解析；其他 ID 會先透過執行核准解析。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制項

當代理遇到傳遞或提供者錯誤時，錯誤原則會控制是否將錯誤訊息傳送到 Telegram 聊天：

| 鍵                                  | 值                         | 預設            | 說明                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — 將每則錯誤訊息傳送到聊天。`once` — 每個冷卻視窗內，每則唯一錯誤訊息只傳送一次（抑制重複的相同錯誤）。`silent` — 絕不將錯誤訊息傳送到聊天。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` 原則的冷卻視窗。錯誤傳送後，相同錯誤訊息會在此間隔經過前被抑制。防止中斷期間出現錯誤洗版。                                      |

支援每帳戶、每群組與每主題覆寫（繼承方式與其他 Telegram 設定鍵相同）。

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
  <Accordion title="Bot 不回應非提及的群組訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性。
      - BotFather：`/setprivacy` -> Disable
      - 然後將 Bot 從群組移除並重新加入
    - 當設定預期未提及的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法探測成員資格。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列在其中（或包含 `"*"`）
    - 驗證 Bot 在群組中的成員資格
    - 檢閱記錄：使用 `openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="命令部分可用或完全無法使用">

    - 授權你的傳送者身分（配對和/或數字 `allowFrom`）
    - 即使群組原則為 `open`，命令授權仍然適用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單有太多項目；減少外掛/skill/自訂命令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入中呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續性網路/擷取錯誤通常表示到 `api.telegram.org` 的 DNS/HTTPS 可達性問題

  </Accordion>

  <Accordion title="啟動回報未授權權杖">

    - `getMe returned 401` 是 Telegram 對已設定 Bot 權杖的驗證失敗。
    - 在 BotFather 中重新複製或重新產生 Bot 權杖，然後更新預設帳戶的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將其視為「不存在網路鉤子」只會把同一個錯誤權杖失敗延後到之後的 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - Node 22+ 搭配自訂 fetch/proxy 時，如果 AbortSignal 型別不符，可能觸發立即中止行為。
    - 某些主機會優先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 輸出可能導致間歇性 Telegram API 失敗。
    - 如果記錄包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些作為可復原的網路錯誤重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此執行器在第一次 `getUpdates` 前不需要第二次 `getMe`。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤而失敗，OpenClaw 會繼續進入長輪詢，而不是再發出另一個輪詢前控制平面呼叫。仍然啟用的網路鉤子會顯示為 `getUpdates` 衝突；OpenClaw 接著會重建 Telegram 傳輸並重試網路鉤子清理。
    - 如果 Telegram 通訊端以短固定週期回收，請檢查 `channels.telegram.timeoutSeconds` 是否過低；Bot 用戶端會將低於傳出與 `getUpdates` 請求防護的設定值鉗制住，但較舊版本在此值低於那些防護時，可能會中止每次輪詢或回覆。
    - 如果記錄包含 `Polling stall detected`，OpenClaw 預設會在 120 秒內沒有完成長輪詢存活性後，重新啟動輪詢並重建 Telegram 傳輸。
    - `openclaw channels status --probe` 與 `openclaw doctor` 會在執行中的輪詢帳戶於啟動寬限期後尚未完成 `getUpdates`、執行中的網路鉤子帳戶於啟動寬限期後尚未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過舊時發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫健康，但你的主機仍回報誤判的輪詢停滯重啟時，才提高 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向主機與 `api.telegram.org` 之間的 proxy、DNS、IPv6 或 TLS 輸出問題。
    - Telegram 也會遵循程序 proxy 環境以進行 Bot API 傳輸，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可繞過 `api.telegram.org`。
    - 如果 OpenClaw 受管理 proxy 透過 `OPENCLAW_PROXY_URL` 為服務環境設定，且沒有標準 proxy 環境存在，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接輸出/TLS 不穩定的 VPS 主機上，請透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - 節點 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再到程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；若都不適用，節點 22+ 會退回使用 `ipv4first`。
    - 如果你的主機是 WSL2，或明確在僅 IPv4 行為下運作較佳，請強制指定 family 選擇：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準測試範圍回應（`198.18.0.0/15`）預設已允許
      用於 Telegram 媒體下載。如果受信任的假 IP 或
      透明 Proxy 在媒體下載期間將 `api.telegram.org` 重寫為其他
      私有/內部/特殊用途位址，你可以選擇啟用僅限 Telegram 的旁路：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同樣的選擇性啟用可在每個帳號層級使用，位置是
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的 Proxy 會將 Telegram 媒體主機解析為 `198.18.x.x`，請先維持
      危險旗標關閉。Telegram 媒體預設已允許 RFC 2544
      基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體 SSRF 保護。只有在受信任且由操作員控制的 Proxy
      環境中使用，例如 Clash、Mihomo 或 Surge 假 IP 路由，且它們會
      合成 RFC 2544 基準測試範圍以外的私有或特殊用途回應。
      一般公開網際網路的 Telegram 存取請保持關閉。
    </Warning>

    - 環境覆寫（臨時）：
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

更多說明：[頻道疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="高訊號 Telegram 欄位">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 主題預設值：`groups.<chatId>.topics."*"` 會套用至未符合的論壇主題；精確主題 ID 會覆寫它
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
- 指令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 串接/回覆：`replyToMode`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/傳送：`textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅限 Bot API 根目錄；不要包含 `/bot<TOKEN>`）
- 網路鉤子：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 回應表情：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入/歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個以上帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`），讓預設路由明確。否則 OpenClaw 會退回使用第一個正規化帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者與閘道配對。
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
    將群組與主題對應到代理。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷。
  </Card>
</CardGroup>
