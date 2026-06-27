---
read_when:
    - 處理 Telegram 功能或網路鉤子
summary: Telegram bot 支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-06-27T18:58:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

透過 grammY 支援可用於生產環境的機器人私訊與群組。預設模式是長輪詢；網路鉤子模式為選用。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復作戰手冊。
  </Card>
  <Card title="閘道設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="在 BotFather 建立機器人權杖">
    開啟 Telegram 並與 **@BotFather** 對話（確認帳號代稱完全是 `@BotFather`）。

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

    環境變數後援：`TELEGRAM_BOT_TOKEN=...`（僅限預設帳號）。
    Telegram **不**使用 `openclaw channels login telegram`；請在設定檔/環境變數中設定權杖，然後啟動閘道。

  </Step>

  <Step title="啟動閘道並核准第一則私訊">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>

  <Step title="將機器人加入群組">
    將機器人加入你的群組，然後取得群組存取所需的兩個 ID：

    - 你的 Telegram 使用者 ID，用於 `allowFrom` / `groupAllowFrom`
    - Telegram 群組聊天 ID，用作 `channels.telegram.groups` 底下的鍵

    第一次設定時，請從 `openclaw logs --follow`、轉發 ID 機器人，或 Bot API `getUpdates` 取得群組聊天 ID。群組獲准後，`/whoami@<bot_username>` 可確認使用者與群組 ID。

    以 `-100` 開頭的負數 Telegram 超級群組 ID 是群組聊天 ID。請將它們放在 `channels.telegram.groups` 底下，而不是 `groupAllowFrom` 底下。

  </Step>
</Steps>

<Note>
權杖解析順序會感知帳號。實務上，設定值優先於環境變數後援，而 `TELEGRAM_BOT_TOKEN` 只適用於預設帳號。
成功啟動後，OpenClaw 會在狀態目錄中快取機器人身分最多 24 小時，讓重新啟動可避免額外的 Telegram `getMe` 呼叫；變更或移除權杖會清除此快取。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="隱私模式與群組可見性">
    Telegram 機器人預設使用 **隱私模式**，這會限制它們可接收的群組訊息。

    如果機器人必須看到所有群組訊息，請擇一：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將機器人設為群組管理員。

    切換隱私模式時，請在每個群組中移除並重新加入機器人，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="群組權限">
    管理員狀態是在 Telegram 群組設定中控制。

    管理員機器人會接收所有群組訊息，這對常駐群組行為很有用。

  </Accordion>

  <Accordion title="有用的 BotFather 切換項">

    - `/setjoingroups` 用於允許/拒絕加入群組
    - `/setprivacy` 用於群組可見性行為

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

### 群組機器人身分

在 Telegram 群組與論壇主題中，明確提及已設定的機器人帳號代稱（例如 `@my_bot`）會被視為正在呼叫所選的 OpenClaw agent，即使 agent persona 名稱與 Telegram 使用者名稱不同。群組靜默政策仍適用於不相關的群組流量，但機器人帳號代稱本身不會被視為「其他人」。

<Tabs>
  <Tab title="私訊政策">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（要求 `allowFrom` 中至少有一個寄件者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到機器人使用者名稱的 Telegram 帳號都能向機器人下命令。僅應用於刻意公開且工具受到嚴格限制的機器人；單一擁有者機器人應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 會被視為安全邊界：帳號層級的 `allowFrom: ["*"]` 項目不會讓該帳號公開，除非合併後的有效帳號允許清單仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有私訊，並會被設定驗證拒絕。
    設定流程只會要求數字使用者 ID。
    如果你已升級且設定檔包含 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 來解析它們（盡力而為；需要 Telegram 機器人權杖）。
    如果你先前依賴配對儲存的允許清單檔案，`openclaw doctor --fix` 可在允許清單流程中將項目復原到 `channels.telegram.allowFrom`（例如當 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，將存取政策持久保存在設定檔中（而不是依賴先前的配對核准）。

    常見混淆：私訊配對核准不代表「此寄件者在所有地方都已授權」。
    配對會授予私訊存取權。如果尚未存在命令擁有者，第一個獲核准的配對也會設定 `commands.ownerAllowFrom`，讓僅限擁有者的命令與執行核准有明確的操作員帳號。
    群組寄件者授權仍來自明確的設定允許清單。
    如果你想要「我授權一次後，私訊與群組命令都能運作」，請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅限擁有者的命令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（不使用第三方機器人）：

    1. 私訊你的機器人。
    2. 執行 `openclaw logs --follow`。
    3. 讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隱私較低）：`@userinfobot` 或 `@getidsbot`。

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

    `groupAllowFrom` 用於群組寄件者篩選。如果未設定，Telegram 會後援使用 `allowFrom`。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）。
    請勿將 Telegram 群組或超級群組聊天 ID 放入 `groupAllowFrom`。負數聊天 ID 應放在 `channels.telegram.groups` 底下。
    非數字項目會被寄件者授權忽略。
    安全邊界（`2026.2.25+`）：群組寄件者驗證**不會**繼承私訊配對儲存的核准。
    配對僅限私訊。對於群組，請設定 `groupAllowFrom` 或每群組/每主題的 `allowFrom`。
    如果未設定 `groupAllowFrom`，Telegram 會後援使用設定檔中的 `allowFrom`，而不是配對儲存。
    單一擁有者機器人的實用模式：將你的使用者 ID 設在 `channels.telegram.allowFrom`，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 底下允許目標群組。
    執行階段注意事項：如果完全缺少 `channels.telegram`，除非明確設定 `channels.defaults.groupPolicy`，否則執行階段預設為失敗關閉的 `groupPolicy="allowlist"`。

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

    從群組中使用 `@<bot_username> ping` 測試。當 `requireMention: true` 時，純群組訊息不會觸發機器人。

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
      - 當你想限制允許群組內哪些人可以觸發機器人時，將像 `8734062810` 這類 Telegram 使用者 ID 放在 `groupAllowFrom` 底下。
      - 只有在你希望允許群組的任何成員都能與機器人交談時，才使用 `groupAllowFrom: ["*"]`。

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

    這些只會更新工作階段狀態。請使用設定檔來持久保存。

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

    群組歷史脈絡預設為 `mention-only`：只有在先前的群組訊息
    是發給機器人、是對機器人的回覆，
    或是機器人自己的訊息時，才會納入。將 `includeGroupHistoryContext: "recent"` 設為
    可包含受信任群組的近期聊天室歷史。將
    `includeGroupHistoryContext: "none"` 設為在下一輪不傳送任何先前的 Telegram 群組歷史
    。

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
    - 群組獲准後，如果已啟用原生命令，請執行 `/whoami@<bot_username>`

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 由閘道處理程序擁有。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共用頻道信封，包含回覆中繼資料、媒體預留位置，以及閘道已觀察到的 Telegram 回覆所需的持久化回覆鏈結上下文。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>`，以保持主題隔離。
- 私訊訊息可以攜帶 `message_thread_id`；OpenClaw 會保留它以供回覆使用。只有當 Telegram `getMe` 回報該機器人具有 `has_topics_enabled: true` 時，私訊主題工作階段才會拆分；否則私訊會留在扁平工作階段中。
- 長輪詢使用 grammY runner，並採用依聊天/依執行緒排序。整體 runner sink 並行數使用 `agents.defaults.maxConcurrent`。
- 多帳號啟動會限制並行的 Telegram `getMe` 探測，因此大型機器人叢集不會一次對所有帳號展開探測。
- 長輪詢會在每個閘道處理程序內受到保護，因此同一時間只有一個作用中的 poller 可以使用機器人 token。如果你仍看到 `getUpdates` 409 衝突，可能是另一個 OpenClaw 閘道、指令碼或外部 poller 正在使用相同 token。
- 長輪詢看門狗預設會在 120 秒沒有完成的 `getUpdates` 存活性後觸發重新啟動。只有當你的部署在長時間執行工作期間仍看到誤判的輪詢停滯重新啟動時，才提高 `channels.telegram.pollingStallThresholdMs`。該值以毫秒為單位，允許範圍為 `30000` 到 `600000`；也支援依帳號覆寫。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果你的設定仍有這些鍵，升級後請執行 `openclaw doctor --fix`。私訊主題路由現在會遵循來自 Telegram `getMe.has_topics_enabled` 的機器人能力，這由 BotFather 執行緒模式控制：啟用主題的機器人在 Telegram 傳送 `message_thread_id` 時使用執行緒範圍的私訊工作階段；其他私訊則留在扁平工作階段中。
</Note>

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 可以即時串流部分回覆：

    - 直接聊天：預覽訊息 + `editMessageText`
    - 群組/主題：預覽訊息 + `editMessageText`

    需求：

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（預設：`partial`）
    - 短的初始答案預覽會先防抖，若執行仍在作用中，會在有界延遲後實體化
    - `progress` 會為工具進度保留一則可編輯狀態草稿，當答案活動早於工具進度抵達時顯示穩定狀態標籤，完成時清除它，並將最終答案作為一般訊息傳送
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重用同一則已編輯的預覽訊息（預設：預覽串流作用中時為 `true`）
    - `streaming.preview.commandText` 控制這些工具進度行內的 command/exec 細節：`raw`（預設，保留已發布行為）或 `status`（僅工具標籤）
    - `streaming.progress.commentary`（預設：`false`）選擇在臨時進度草稿中加入助理旁白/前言文字
    - 舊版 `channels.telegram.streamMode`、布林 `streaming` 值，以及已退役的原生草稿預覽鍵會被偵測；執行 `openclaw doctor --fix` 將它們遷移到目前的串流設定

    工具進度預覽更新是在工具執行時顯示的短狀態行，例如指令執行、檔案讀取、規劃更新、修補摘要，或 Codex app-server 模式中的 Codex 前言/旁白文字。Telegram 預設保持啟用這些項目，以符合 `v2026.4.22` 及後續版本中已發布的 OpenClaw 行為。

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

    若要保持工具進度可見，但隱藏 command/exec 文字，請設定：

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

    當你想要可見工具進度，但不要將最終答案編輯進同一則訊息時，使用 `progress` 模式。將指令文字政策放在 `streaming.progress` 底下：

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

    只有在你想要僅傳送最終結果時才使用 `streaming.mode: "off"`：Telegram 預覽編輯會停用，通用工具/進度閒聊會被抑制，而不是作為獨立狀態訊息傳送。核准提示、媒體 payload 和錯誤仍會透過正常最終傳送路由。當你只想保留答案預覽編輯，同時隱藏工具進度狀態行時，請使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 選取引文回覆是例外。當 `replyToMode` 是 `"first"`、`"all"` 或 `"batched"`，且傳入訊息包含選取的引文文字時，OpenClaw 會透過 Telegram 的原生引文回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法顯示該輪次的短狀態行。沒有選取引文文字的目前訊息回覆仍會保留預覽串流。當工具進度可見性比原生引文回覆更重要時，設定 `replyToMode: "off"`；或設定 `streaming.preview.toolProgress: false` 以承認這項取捨。
    </Note>

    對於純文字回覆：

    - 短的私訊/群組/主題預覽：OpenClaw 會保留同一則預覽訊息，並就地執行最終編輯
    - 拆分成多則 Telegram 訊息的長文字最終結果，會在可能時重用現有預覽作為第一個最終區塊，然後只傳送剩餘區塊
    - 進度模式最終結果會清除狀態草稿，並使用正常最終傳送，而不是將草稿編輯成答案
    - 如果在完成文字確認前最終編輯失敗，OpenClaw 會使用正常最終傳送並清理過期預覽

    對於複雜回覆（例如媒體 payload），OpenClaw 會退回正常最終傳送，然後清理預覽訊息。

    預覽串流與區塊串流是分開的。當 Telegram 明確啟用區塊串流時，OpenClaw 會跳過預覽串流以避免雙重串流。

    推理串流行為：

    - `/reasoning stream` 使用受支援頻道的推理預覽路徑；在 Telegram 上，它會在生成時將推理串流到即時預覽
    - 推理預覽會在最終傳送後刪除；當推理應保持可見時，使用 `/reasoning on`
    - 最終答案傳送時不包含推理文字

  </Accordion>

  <Accordion title="豐富訊息格式">
    傳出文字預設使用標準 Telegram HTML 訊息，因此回覆在目前的 Telegram 用戶端中仍保持可讀。此相容模式支援一般粗體、斜體、連結、程式碼、劇透和引用，但不支援 Bot API 10.1 的僅限豐富格式區塊，例如原生表格、詳細資訊、豐富媒體和公式。

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

    - 會告知代理此機器人/帳號可使用 Telegram 豐富訊息。
    - Markdown 文字會透過 OpenClaw 的 Markdown IR 轉譯，並作為 Telegram 豐富 HTML 傳送。
    - 明確的豐富 HTML payload 會保留支援的 Bot API 10.1 標籤，例如標題、表格、詳細資訊、豐富媒體和公式。
    - 媒體說明文字仍使用 Telegram HTML 說明文字，因為豐富訊息不會取代說明文字。

    這會讓模型文字遠離 Telegram Rich Markdown 符號，因此像 `$400-600K` 這樣的貨幣不會被解析為數學。長的豐富文字會自動依 Telegram 的豐富文字和豐富區塊限制拆分。超過 Telegram 欄位限制的表格會作為程式碼區塊傳送。

    預設：關閉，以維持用戶端相容性。豐富訊息需要相容的 Telegram 用戶端；某些目前的 Desktop、Web、Android 和第三方用戶端會將已接受的豐富訊息顯示為不支援。除非與該機器人搭配使用的每個用戶端都能轉譯它們，否則請保持此選項停用。`/status` 會顯示目前 Telegram 工作階段的豐富訊息是開啟還是關閉。

    連結預覽預設啟用。`channels.telegram.linkPreview: false` 會略過豐富文字的自動實體偵測。

  </Accordion>

  <Accordion title="原生指令和自訂指令">
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

    - 名稱會正規化（移除開頭的 `/`，轉為小寫）
    - 有效模式：`a-z`、`0-9`、`_`，長度 `1..32`
    - 自訂指令不能覆寫原生指令
    - 衝突/重複項目會被略過並記錄

    注意事項：

    - 自訂指令只是選單項目；它們不會自動實作行為
    - 外掛/Skills 指令即使未顯示在 Telegram 選單中，輸入時仍可運作

    如果原生指令已停用，內建項目會被移除。若已設定，自訂/外掛指令仍可註冊。

    常見設定失敗：

    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 選單在修剪後仍溢出；請減少外掛/Skills/自訂指令，或停用 `channels.telegram.commands.native`。
    - `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並顯示 `404: Not Found`，但直接 Bot API curl 指令可運作，可能表示 `channels.telegram.apiRoot` 被設定為完整 `/bot<TOKEN>` 端點。`apiRoot` 必須只是 Bot API 根目錄，而 `openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕了設定的機器人 token。請用目前的 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 會在輪詢前停止，因此這不會被回報為網路鉤子清理失敗。
    - `setMyCommands failed` 搭配網路/fetch 錯誤，通常表示到 `api.telegram.org` 的傳出 DNS/HTTPS 被封鎖。

    ### 裝置配對指令（`device-pair` 外掛）

    安裝 `device-pair` 外掛時：

    1. `/pair` 產生設定碼
    2. 將程式碼貼到 iOS app
    3. `/pair pending` 列出待處理請求（包含角色/範圍）
    4. 核准請求：
       - `/pair approve <requestId>` 用於明確核准
       - 當只有一個待處理請求時使用 `/pair approve`
       - `/pair approve latest` 用於最新請求

    設定碼會攜帶短期 bootstrap token。內建設定碼 bootstrap 僅限節點：第一次連線會建立待處理節點請求，核准後，閘道會回傳具有 `scopes: []` 的持久節點 token。它不會回傳交接的 operator token；operator 存取需要另一次已核准的 operator 配對或 token 流程。

    如果裝置使用變更後的驗證細節重試（例如角色/範圍/公開金鑰），先前的待處理請求會被取代，且新請求會使用不同的 `requestId`。核准前請重新執行 `/pair pending`。

    更多詳細資訊：[配對](/zh-TW/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    每個帳號的覆寫：

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

    舊版 `capabilities: ["inlineButtons"]` 會映射到 `inlineButtons: "all"`。

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

    Telegram `web_app` 按鈕僅能在使用者與機器人之間的私人聊天中運作。

    回呼點擊會以文字傳遞給代理程式：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="代理程式與自動化的 Telegram 訊息動作">
    Telegram 工具動作包含：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、選用 `presentation` 內嵌按鈕；僅按鈕的編輯會更新回覆標記）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    頻道訊息動作會公開符合人體工學的別名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    門控控制項：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（預設：停用）

    注意：`edit` 和 `topic-create` 目前預設啟用，且沒有獨立的 `channels.telegram.actions.*` 切換。
    執行階段傳送會使用作用中的設定/密鑰快照（啟動/重新載入），因此動作路徑不會在每次傳送時臨時重新解析 SecretRef。

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

    啟用回覆串接且原始 Telegram 文字或標題可用時，OpenClaw 會自動包含原生 Telegram 引用摘錄。Telegram 會將原生引用文字限制在 1024 個 UTF-16 code unit，因此較長的訊息會從開頭引用；如果 Telegram 拒絕該引用，則會退回為純回覆。

    注意：`off` 會停用隱含回覆串接。明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與討論串行為">
    論壇超級群組：

    - 主題工作階段金鑰會附加 `:topic:<threadId>`
    - 回覆與輸入中狀態會以該主題討論串為目標
    - 主題設定路徑：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般主題（`threadId=1`）特殊情況：

    - 訊息傳送會省略 `message_thread_id`（Telegram 會拒絕 `sendMessage(...thread_id=1)`）
    - 輸入中動作仍會包含 `message_thread_id`

    主題繼承：主題項目會繼承群組設定，除非被覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 僅屬於主題，不會從群組預設值繼承。
    `topics."*"` 會設定該群組中每個主題的預設值；精確的主題 ID 仍會優先於 `"*"`。

    **逐主題代理程式路由**：每個主題都可以透過在主題設定中設定 `agentId` 路由到不同的代理程式。這會讓每個主題都有自己的隔離工作區、記憶體與工作階段。範例：

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

    **持久 ACP 主題繫結**：論壇主題可以透過頂層型別化 ACP 繫結來釘選 ACP harness 工作階段（`bindings[]` 搭配 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 這樣含主題資格的 ID）。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

    **從聊天產生繫結至討論串的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結至新的 ACP 工作階段；後續回覆會直接路由至該處。OpenClaw 會在主題中釘選產生確認。需要 `channels.telegram.threadBindings.spawnSessions` 保持啟用（預設：`true`）。

    範本內容會公開 `MessageThreadId` 和 `IsForum`。含有 `message_thread_id` 的 DM 聊天會保留回覆中繼資料；只有當 Telegram `getMe` 回報該機器人為 `has_topics_enabled: true` 時，它們才會使用具討論串感知的工作階段金鑰。
    先前的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆寫已刻意退役；請使用 BotFather 討論串模式作為單一真相來源，並執行 `openclaw doctor --fix` 來移除過時的設定鍵。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。

    - 預設：音訊檔案行為
    - 在代理程式回覆中加入標籤 `[[audio_as_voice]]` 以強制以語音訊息傳送
    - 傳入語音訊息轉錄會在代理程式內容中被框定為機器產生、
      不受信任的文字；提及偵測仍會使用原始
      轉錄，因此受提及門控的語音訊息會繼續運作。

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

    Telegram 會區分影片檔案與影片註記。

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

    影片註記不支援說明文字；提供的訊息文字會另行傳送。

    ### 貼圖

    傳入貼圖處理：

    - 靜態 WEBP：下載並處理（佔位符 `<media:sticker>`）
    - 動畫 TGS：略過
    - 影片 WEBM：略過

    貼圖上下文欄位：

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

  <Accordion title="Reaction notifications">
    Telegram 反應會以 `message_reaction` 更新抵達（與訊息酬載分開）。

    啟用時，OpenClaw 會將系統事件加入佇列，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    設定：

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    注意事項：

    - `own` 表示只包含使用者對機器人傳送訊息的反應（透過已傳送訊息快取盡力判斷）。
    - 反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被捨棄。
    - Telegram 不會在反應更新中提供討論串 ID。
      - 非論壇群組會路由到群組聊天工作階段
      - 論壇群組會路由到群組一般主題工作階段（`:topic:1`），而不是確切的原始主題

    輪詢/網路鉤子的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`ackReactionScope` 決定該表情符號實際傳送的*時機*。

    **表情符號（`ackReaction`）解析順序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent 身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Telegram 預期使用 unicode 表情符號（例如 "👀"）。
    - 使用 `""` 可停用某個頻道或帳號的反應。

    **範圍（`messages.ackReactionScope`）：**

    Telegram provider 會從 `messages.ackReactionScope` 讀取範圍（預設 `"group-mentions"`）。目前沒有 Telegram 帳號或 Telegram 頻道層級的覆寫。

    值：`"all"`（DM + 群組）、`"direct"`（僅 DM）、`"group-all"`（每則群組訊息，不含 DM）、`"group-mentions"`（群組中提及機器人時；**不含 DM** — 這是預設值）、`"off"` / `"none"`（已停用）。

    <Note>
    預設範圍（`"group-mentions"`）不會在直接訊息中觸發確認反應。若要在傳入 Telegram DM 上取得確認反應，請將 `messages.ackReactionScope` 設為 `"direct"` 或 `"all"`。該值會在 Telegram provider 啟動時讀取，因此需要重新啟動閘道，變更才會生效。
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    預設會啟用頻道設定寫入（`configWrites !== false`）。

    Telegram 觸發的寫入包含：

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

  <Accordion title="Long polling vs webhook">
    預設是長輪詢。若使用網路鉤子模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可選設定包含 `webhookPath`、`webhookHost`、`webhookPort`（預設為 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在長輪詢模式中，OpenClaw 只會在更新成功分派後，才保存其重新啟動浮水印。如果處理常式失敗，該更新在同一個行程中仍可重試，且不會被寫入為已完成以供重新啟動去重。

    本機監聽器會繫結到 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前放置反向代理，或有意地設定 `webhookHost: "0.0.0.0"`。

    網路鉤子模式會先驗證請求防護、Telegram secret token 和 JSON 主體，然後才向 Telegram 回傳 `200`。
    接著 OpenClaw 會透過長輪詢使用的相同每聊天/每主題機器人通道非同步處理更新，因此較慢的 agent 回合不會佔住 Telegram 的傳遞 ACK。

  </Accordion>

  <Accordion title="限制、重試與命令列介面目標">
    - `channels.telegram.textChunkLimit` 預設為 4000。
    - `channels.telegram.chunkMode="newline"` 會在依長度分割前優先使用段落邊界（空白行）。
    - `channels.telegram.mediaMaxMb`（預設 100）會限制傳入與傳出的 Telegram 媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500）控制 Telegram 相簿/媒體群組在 OpenClaw 將它們作為一則傳入訊息分派前，要緩衝多久。如果相簿部分抵達較晚，請增加此值；若要降低相簿回覆延遲，請減少此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 Telegram API 用戶端逾時（若未設定，則使用 grammY 預設值）。機器人用戶端會將設定值限制在 60 秒傳出文字/輸入中請求防護以下，避免 grammY 在 OpenClaw 的傳輸防護與備援可執行前中止可見回覆傳遞。長輪詢仍使用 45 秒的 `getUpdates` 請求防護，避免閒置輪詢無限期被放棄。
    - `channels.telegram.pollingStallThresholdMs` 預設為 `120000`；僅在發生誤判的輪詢停滯重啟時，才調整到 `30000` 到 `600000` 之間。
    - 群組脈絡歷史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 當閘道已觀察到父訊息時，回覆/引用/轉發的補充脈絡會正規化到一個選定的對話脈絡視窗中；已觀察訊息快取位於 OpenClaw SQLite 外掛狀態，且 `openclaw doctor --fix` 會匯入舊版 sidecar。Telegram 在更新中只包含一層淺層 `reply_to_message`，因此早於快取的鏈結會受限於 Telegram 目前的更新酬載。
    - Telegram 允許清單主要管控誰可以觸發代理，而不是完整的補充脈絡遮蔽邊界。
    - 私訊歷史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 設定適用於 Telegram 傳送輔助工具（命令列介面/工具/動作）中可復原的傳出 API 錯誤。傳入最終回覆傳遞也會針對 Telegram 預連線失敗使用有界限的安全傳送重試，但不會重試可能造成可見訊息重複的模糊送出後網路封套。

    命令列介面與訊息工具傳送目標可以是數字聊天 ID、使用者名稱，或論壇主題目標：

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

    僅 Telegram 適用的投票旗標：

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用於論壇主題（或使用 `:topic:` 目標）

    Telegram 傳送也支援：

    - `--presentation` 搭配 `buttons` 區塊，以便在 `channels.telegram.capabilities.inlineButtons` 允許時使用行內鍵盤
    - `--pin` 或 `--delivery '{"pin":true}'`，在機器人可在該聊天中釘選時請求釘選傳遞
    - `--force-document` 將傳出圖片、GIF 和影片作為文件傳送，而不是壓縮相片、動畫媒體或影片上傳

    動作控管：

    - `channels.telegram.actions.sendMessage=false` 會停用傳出 Telegram 訊息，包括投票
    - `channels.telegram.actions.poll=false` 會停用 Telegram 投票建立，同時保留一般傳送啟用

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中進行執行核准，也可選擇在來源聊天或主題中張貼提示。核准者必須是數字 Telegram 使用者 ID。

    設定路徑：

    - `channels.telegram.execApprovals.enabled`（至少一位核准者可解析時自動啟用）
    - `channels.telegram.execApprovals.approvers`（退回使用來自 `commands.ownerAllowFrom` 的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（預設）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以與機器人交談，以及機器人在哪裡傳送一般回覆。它們不會讓某人成為執行核准者。第一個核准的私訊配對會在尚未有命令擁有者時啟動 `commands.ownerAllowFrom`，因此單一擁有者設定仍可運作，而不需要在 `execApprovals.approvers` 下重複 ID。

    頻道傳遞會在聊天中顯示命令文字；僅在可信任的群組/主題中啟用 `channel` 或 `both`。當提示出現在論壇主題中時，OpenClaw 會保留該主題，用於核准提示與後續訊息。執行核准預設會在 30 分鐘後到期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過外掛核准解析；其他則會先透過執行核准解析。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理遇到傳遞或提供者錯誤時，Telegram 可以回覆錯誤文字，也可以抑制它。兩個設定鍵控制此行為：

| 鍵                                  | 值                | 預設    | 說明                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 會向聊天傳送友善的錯誤訊息。`silent` 會完全抑制錯誤回覆。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 對同一聊天的錯誤回覆之間的最短時間。防止中斷期間出現錯誤垃圾訊息。        |

支援每個帳號、每個群組與每個主題的覆寫（繼承方式與其他 Telegram 設定鍵相同）。

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
      - BotFather: `/setprivacy` -> Disable
      - 然後將機器人移出群組再重新加入
    - 當設定預期未提及的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 可以檢查明確的數字群組 ID；萬用字元 `"*"` 無法進行成員資格探測。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列入清單（或包含 `"*"`）
    - 確認機器人在群組中的成員資格
    - 檢查日誌：使用 `openclaw logs --follow` 查看略過原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授權你的寄件者身分（配對和/或數字 `allowFrom`）
    - 即使群組政策為 `open`，命令授權仍然適用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單項目過多；請減少外掛/skill/自訂命令，或停用原生選單
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入中呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸備援重試一次。持續的網路/擷取錯誤通常表示到 `api.telegram.org` 的 DNS/HTTPS 可達性問題

  </Accordion>

  <Accordion title="啟動回報未授權的權杖">

    - `getMe returned 401` 是設定機器人權杖的 Telegram 驗證失敗。
    - 在 BotFather 中重新複製或重新產生機器人權杖，然後更新預設帳號的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；將它視為「不存在網路鉤子」只會把同一個錯誤權杖失敗延後到後續 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - 節點 22+ 加上自訂 fetch/proxy 時，如果 AbortSignal 型別不相符，可能會觸發立即中止行為。
    - 某些主機會先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 對外連線可能造成間歇性 Telegram API 失敗。
    - 如果日誌包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 現在會將這些作為可復原的網路錯誤重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用成功的啟動 `getMe` 探測，因此 runner 不需要在第一次 `getUpdates` 前再執行第二次 `getMe`。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤而失敗，OpenClaw 會繼續進入長輪詢，而不是再進行另一個預輪詢控制平面呼叫。仍作用中的網路鉤子會顯示為 `getUpdates` 衝突；OpenClaw 接著會重建 Telegram 傳輸並重試網路鉤子清理。
    - 如果 Telegram socket 以很短的固定週期回收，請檢查是否有過低的 `channels.telegram.timeoutSeconds`；機器人用戶端會將設定值限制在傳出與 `getUpdates` 請求防護以下，但較舊版本在此值設定低於這些防護時，可能每次輪詢或回覆都會中止。
    - 如果日誌包含 `Polling stall detected`，OpenClaw 預設會在 120 秒沒有完成的長輪詢存活訊號後重啟輪詢並重建 Telegram 傳輸。
    - 當執行中的輪詢帳號在啟動寬限後未完成 `getUpdates`、執行中的網路鉤子帳號在啟動寬限後未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過期時，`openclaw channels status --probe` 和 `openclaw doctor` 會發出警告。
    - 僅當長時間執行的 `getUpdates` 呼叫正常，但你的主機仍回報誤判的輪詢停滯重啟時，才增加 `channels.telegram.pollingStallThresholdMs`。持續停滯通常表示主機與 `api.telegram.org` 之間有 proxy、DNS、IPv6 或 TLS 對外連線問題。
    - Telegram 也會遵循 Bot API 傳輸的程序 proxy 環境變數，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY` / `no_proxy` 仍可略過 `api.telegram.org`。
    - 如果 OpenClaw 受管 proxy 在服務環境中透過 `OPENCLAW_PROXY_URL` 設定，且沒有標準 proxy 環境變數，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接對外連線/TLS 不穩定的 VPS 主機上，請透過 `channels.telegram.proxy` 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - 節點 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再遵循程序預設值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；若都不適用，節點 22+ 會退回使用 `ipv4first`。
    - 如果你的主機是 WSL2，或明確使用僅 IPv4 行為效果更好，請強制 family 選擇：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準測試範圍回應 (`198.18.0.0/15`) 已預設允許用於 Telegram 媒體下載。如果受信任的 fake-IP 或
      transparent proxy 在媒體下載期間將 `api.telegram.org` 重寫為其他
      private/internal/special-use 位址，你可以選擇啟用
      僅限 Telegram 的繞過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同樣的選擇性啟用也可按帳號設定於
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的 proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先保持
      dangerous 旗標關閉。Telegram 媒體已預設允許 RFC 2544
      基準測試範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram
      媒體的 SSRF 保護。僅在受信任、由操作員控制的 proxy
      環境中使用，例如 Clash、Mihomo 或 Surge fake-IP routing，且它們會
      產生 RFC 2544 基準測試範圍之外的 private 或 special-use 回應時才使用。
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

更多說明：[頻道疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必須指向一般檔案；符號連結會被拒絕）
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 主題預設值：`groups.<chatId>.topics."*"` 會套用到未符合的論壇主題；精確主題 ID 會覆寫它
- exec 核准：`execApprovals`、`accounts.*.execApprovals`
- 命令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒/回覆：`replyToMode`
- 串流：`streaming`（預覽）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/傳遞：`textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅 Bot API 根目錄；不要包含 `/bot<TOKEN>`）
- 網路鉤子：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 回應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`
- 寫入/歷史記錄：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個或更多帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明確指定預設路由。否則 OpenClaw 會退回使用第一個正規化帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
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
    將傳入訊息路由到代理。
  </Card>
  <Card title="Security" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組與主題對應到代理。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷。
  </Card>
</CardGroup>
