---
read_when:
    - 處理 Telegram 功能或網路鉤子
summary: Telegram Bot 支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-07-06T10:46:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81802f9077e9339bae1c4b3296db2b1b76d4085593544305be37e43669173c0a
    source_path: channels/telegram.md
    workflow: 16
---

已可用於透過 grammY 在 bot 私訊和群組中投入生產使用。預設傳輸方式是長輪詢；網路鉤子模式為選用。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策是配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷和修復手冊。
  </Card>
  <Card title="閘道設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="在 BotFather 中建立 bot token">
    兩種流程最後都會取得一個可貼到 OpenClaw 的權杖，請擇一使用：

    - **聊天流程**：開啟 Telegram，與 **@BotFather** 聊天（確認帳號完全是 `@BotFather`），執行 `/newbot`，依提示操作，並儲存權杖。
    - **網頁流程**：開啟 [BotFather 的 Web App](https://t.me/BotFather?startapp)，它可在所有 Telegram 用戶端中執行，包括 [web.telegram.org](https://web.telegram.org)，在介面中建立 bot，並複製其權杖。

  </Step>

  <Step title="設定權杖和私訊政策">

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

    環境變數後援：`TELEGRAM_BOT_TOKEN`（僅適用於預設帳號；具名帳號必須使用 `botToken` 或 `tokenFile`）。
    Telegram **不**使用 `openclaw channels login telegram`；請在設定或環境變數中設定權杖，然後啟動閘道。

  </Step>

  <Step title="啟動閘道並核准第一則私訊">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對碼會在 1 小時後過期。

  </Step>

  <Step title="將 bot 加入群組">
    將 bot 加入你的群組，然後取得群組存取所需的兩個 ID：

    - 你的 Telegram 使用者 ID，用於 `allowFrom` / `groupAllowFrom`
    - Telegram 群組聊天 ID，作為 `channels.telegram.groups` 下的鍵

    可從 `openclaw logs --follow`、轉寄 ID bot，或 Bot API `getUpdates` 取得群組聊天 ID。允許該群組後，`/whoami@<bot_username>` 會確認使用者與群組 ID。

    以 `-100` 開頭的負數超級群組 ID 是群組聊天 ID。它們應放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom`。

  </Step>
</Steps>

<Note>
權杖解析會感知帳號：`tokenFile` 優先於 `botToken`，`botToken` 優先於環境變數，而且設定永遠優先於 `TELEGRAM_BOT_TOKEN`（後者僅會解析預設帳號）。成功啟動後，OpenClaw 會快取 bot 身分最多 24 小時，讓重新啟動時略過額外的 `getMe` 呼叫；變更或移除權杖會清除該快取。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="隱私模式與群組可見性">
    Telegram bots 預設使用**隱私模式**，這會限制它們可接收哪些群組訊息。

    若要查看所有群組訊息，可擇一：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將 bot 設為群組管理員。

    切換隱私模式後，請在每個群組中移除並重新加入 bot，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="群組權限">
    管理員狀態由 Telegram 群組設定控制。管理員 bot 會接收所有群組訊息，適合需要永遠開啟的群組行為。
  </Accordion>

  <Accordion title="實用的 BotFather 切換項目">

    - `/setjoingroups` — 允許/拒絕加入群組
    - `/setprivacy` — 群組可見性行為

    如果你偏好介面而非聊天命令，同樣的設定也可在 [BotFather 的 Web App](https://t.me/BotFather?startapp) 中使用。

  </Accordion>
</AccordionGroup>

## 存取控制與啟用

### 群組 bot 身分

在群組和論壇主題中，明確提及已設定的 bot 帳號（例如 `@my_bot`）會指定所選的 OpenClaw agent，即使 agent persona 名稱不同於 Telegram 使用者名稱也一樣。群組靜默政策仍會套用於不相關流量，但 bot 帳號本身絕不會是「其他人」。

<Tabs>
  <Tab title="私訊政策">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（需要 `allowFrom` 中至少有一個傳送者 ID）
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 會讓任何找到或猜到 bot 使用者名稱的 Telegram 帳號都能指揮 bot。只應將它用於有嚴格工具限制、且刻意公開的 bot；單一擁有者 bot 應使用 `allowlist` 搭配數字使用者 ID。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。`telegram:` / `tg:` 前綴會被接受並正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 是安全邊界：帳號層級的 `allowFrom: ["*"]` 不會讓該帳號公開，除非合併後的有效允許清單仍包含明確萬用字元。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 會封鎖所有私訊，並會被設定驗證拒絕。
    設定只會要求數字使用者 ID。如果你的設定中有來自舊版設定流程的 `@username` 允許清單項目，請執行 `openclaw doctor --fix` 將它們解析為數字 ID（盡力而為；需要 Telegram bot token）。
    如果你之前依賴配對儲存區允許清單檔案，`openclaw doctor --fix` 可將項目復原到 `channels.telegram.allowFrom`，供允許清單流程使用（例如 `dmPolicy: "allowlist"` 尚未有明確 ID 時）。

    對於單一擁有者 bot，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，而不是依賴先前的配對核准。

    常見混淆：私訊配對核准不代表「此傳送者在所有地方都已授權」。配對只授予私訊存取權。如果尚未存在命令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，為僅限擁有者的命令和執行核准提供明確的操作員帳號。群組傳送者授權仍來自明確設定的允許清單。
    若要用同一個身分同時授權私訊和群組命令：將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`，並針對僅限擁有者的命令確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（無第三方 bot）：向你的 bot 傳送私訊，執行 `openclaw logs --follow`，讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方（隱私性較低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群組政策與允許清單">
    兩項控制會一起套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定，`groupPolicy: "open"`：任何群組都會通過群組 ID 檢查
       - 沒有 `groups` 設定，`groupPolicy: "allowlist"`（預設）：所有群組都會被封鎖，直到你新增 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為允許清單（明確 ID 或 `"*"`）

    2. **群組中允許哪些傳送者**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（預設）/ `disabled`

    `groupAllowFrom` 會篩選群組傳送者；如果未設定，Telegram 會後援到 `allowFrom`（不是配對儲存區，群組傳送者授權絕不繼承私訊配對儲存區核准，這是自 `2026.2.25` 起的安全邊界）。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會被正規化）；非數字項目會被忽略。不要把群組或超級群組聊天 ID 放在這裡，負數聊天 ID 屬於 `channels.telegram.groups`。
    單一擁有者 bot 的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 下允許目標群組。
    如果設定中完全缺少 `channels.telegram`，除非明確設定 `channels.defaults.groupPolicy`，否則執行階段預設為故障關閉的 `groupPolicy="allowlist"`。

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

    在群組中用 `@<bot_username> ping` 測試。當 `requireMention: true` 時，純群組訊息不會觸發 bot。

    允許某個特定群組中的任何成員：

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

    只允許某個特定群組中的特定使用者：

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
      常見錯誤：`groupAllowFrom` 不是群組允許清單。

      - 負數 Telegram 群組/超級群組聊天 ID（`-1001234567890`）應放在 `channels.telegram.groups` 下。
      - Telegram 使用者 ID（`8734062810`）應放在 `groupAllowFrom` 下，用來限制已允許群組中哪些人可以觸發 bot。
      - 只有在要讓已允許群組中的任何成員都能與 bot 對話時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行為">
    群組回覆預設需要提及。提及可以來自：

    - 原生 `@botusername` 提及，或
    - `agents.list[].groupChat.mentionPatterns` 或 `messages.groupChat.mentionPatterns` 中的提及模式

    工作階段層級切換（僅狀態，不持久化）：`/activation always`、`/activation mention`。若要持久化，請使用設定：

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

    群組歷史內容脈絡一律開啟，並受 `historyLimit` 限制。設定 `channels.telegram.historyLimit: 0` 可停用群組歷史視窗。`openclaw doctor --fix` 會移除已退役的 `includeGroupHistoryContext` 鍵。

    取得群組聊天 ID：將群組訊息轉寄給 `@userinfobot` / `@getidsbot`、從 `openclaw logs --follow` 讀取 `chat.id`、檢查 Bot API `getUpdates`，或（群組獲允許後）執行 `/whoami@<bot_username>`。

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 在閘道程序內執行。
- 路由是確定性的：Telegram 傳入訊息會回覆到 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共享頻道信封，包含回覆中繼資料、媒體佔位符，以及閘道已觀察到的回覆所用的持久化回覆鏈脈絡。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>`。
- 私訊訊息可攜帶 `message_thread_id`；OpenClaw 會保留它供回覆使用。只有當 Telegram `getMe` 回報 bot 的 `has_topics_enabled: true` 時，私訊主題工作階段才會分割；否則私訊會維持在扁平工作階段。
- 長輪詢使用 grammY runner，並採用每聊天/每執行緒排序。Runner sink 並行數使用 `agents.defaults.maxConcurrent`。
- 多帳號啟動會限制並行 `getMe` 探測，避免大型 bot 叢集一次展開所有帳號探測。
- 每個閘道程序都會保護長輪詢，確保一次只有一個作用中 poller 可使用同一個 bot token。持續的 `getUpdates` 409 衝突表示另一個 OpenClaw 閘道、指令碼或外部 poller 正在使用相同權杖。
- 輪詢 watchdog 預設會在 120 秒沒有完成的 `getUpdates` 存活訊號後重新啟動。只有在你的部署於長時間執行工作期間看到誤判的輪詢停滯重新啟動時，才提高 `channels.telegram.pollingStallThresholdMs`（30000-600000，支援每帳號覆寫）。
- Telegram Bot API 不支援讀取回條（`sendReadReceipts` 不適用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果你的設定在升級後仍有這些鍵，請執行 `openclaw doctor --fix`。DM 主題路由現在遵循 Telegram `getMe.has_topics_enabled`（由 BotFather threaded mode 控制）：啟用主題的機器人在 Telegram 傳送 `message_thread_id` 時會使用以討論串為範圍的 DM 工作階段；其他 DM 會留在扁平工作階段。
</Note>

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 會在直接聊天、群組和主題中即時串流部分回覆：先傳送預覽訊息，接著反覆執行 `editMessageText`，最後就地完成。

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（預設值：`partial`）
    - 簡短的初始答案預覽會經過防抖處理，若執行仍在進行中，會在有界延遲後具體顯示
    - `progress` 會保留一則可編輯的工具進度狀態草稿，當答案活動早於工具進度抵達時顯示穩定狀態標籤，在完成時清除它，並將最終答案作為一般訊息傳送
    - `streaming.preview.toolProgress` 控制工具/進度更新是否重複使用同一則已編輯的預覽訊息（預設值：預覽串流啟用時為 `true`）
    - `streaming.preview.commandText` 控制這些行中的命令/執行細節：`raw`（預設）或 `status`（僅工具標籤）
    - `streaming.progress.commentary`（預設值：`false`）選擇在暫時進度草稿中包含助理的說明/前言文字
    - 舊版 `channels.telegram.streamMode`、布林 `streaming` 值，以及已淘汰的原生草稿預覽鍵都會被偵測到；執行 `openclaw doctor --fix` 以遷移它們

    工具進度行是在工具執行時顯示的簡短狀態更新（命令執行、檔案讀取、規劃更新、修補摘要、app-server 模式中的 Codex 前言/說明）。Telegram 預設保持這些內容開啟（符合 `v2026.4.22`+ 的已發布行為）。

    保留答案預覽編輯，但隱藏工具進度行：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    保持工具進度可見，但隱藏命令/執行文字：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    `progress` 模式會顯示工具進度，但不會將最終答案編輯進該訊息。請將命令文字政策放在 `streaming.progress` 下：

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

    `streaming.mode: "off"` 會停用預覽編輯，並抑制一般工具/進度雜訊，而不是將其作為獨立狀態訊息傳送；核准提示、媒體和錯誤仍會透過一般最終傳遞路徑路由。`streaming.preview.toolProgress: false` 只保留答案預覽編輯。

    <Note>
      已選取的引用回覆是例外。當 `replyToMode` 為 `first`、`all` 或 `batched`，且傳入訊息有已選取的引用文字時，OpenClaw 會透過 Telegram 的原生引用回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法在該輪顯示狀態行。沒有已選取引用文字的目前訊息回覆仍會串流。當工具進度可見性比原生引用回覆更重要時，請設定 `replyToMode: "off"`；或設定 `streaming.preview.toolProgress: false` 以接受此取捨。
    </Note>

    對於純文字回覆：簡短預覽會就地進行最終編輯；拆分為多則訊息的長最終答案會將預覽重複用作第一個片段，然後只傳送其餘部分；進度模式最終答案會清除狀態草稿，並使用一般最終傳遞；如果在確認完成前最終編輯失敗，OpenClaw 會退回一般最終傳遞並清理過期預覽。對於複雜回覆（媒體承載），OpenClaw 一律退回一般最終傳遞並清理預覽。

    預覽串流和區塊串流互斥：當明確啟用區塊串流時，OpenClaw 會略過預覽串流以避免雙重串流。

    推理：`/reasoning stream` 會在生成期間將推理串流到即時預覽中，然後在最終傳遞後刪除推理預覽（使用 `/reasoning on` 可保持可見）。最終答案傳送時不包含推理文字。

  </Accordion>

  <Accordion title="豐富訊息格式">
    外寄文字預設使用標準 Telegram HTML 訊息，可在目前用戶端中閱讀：粗體、斜體、連結、程式碼、劇透、引用，而不是 Bot API 10.1 的僅限豐富格式區塊（原生表格、詳細資訊、豐富媒體、公式）。

    選擇使用 Bot API 10.1 豐富訊息：

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    啟用後：代理會被告知此機器人/帳戶可使用豐富訊息；Markdown 文字會透過 OpenClaw 的 Markdown IR 轉譯為 Telegram 豐富 HTML；明確的豐富 HTML 承載會保留支援的 Bot API 10.1 標籤（標題、表格、詳細資訊、豐富媒體、公式）；媒體標題仍使用 Telegram HTML 標題（豐富訊息不會取代標題，且標題上限為 1024 個字元）。

    這會讓模型文字避開 Telegram 的豐富 Markdown 符號，因此像 `$400-600K` 這樣的貨幣不會被解析為數學。長篇豐富文字會依 Telegram 限制自動拆分。超過 20 欄限制的表格會退回程式碼區塊。

    預設：關閉，為了用戶端相容性。有些目前的 Desktop、Web、Android 和第三方用戶端會將已接受的豐富訊息顯示為不支援。除非與機器人搭配使用的每個用戶端都能轉譯它們，否則請保持關閉。`/status` 會顯示目前工作階段是否開啟或關閉豐富訊息。

    連結預覽預設開啟。`channels.telegram.linkPreview: false` 會停用豐富文字的自動實體偵測。

  </Accordion>

  <Accordion title="原生命令和自訂命令">
    Telegram 的命令選單會在啟動時使用 `setMyCommands` 註冊。`commands.native: "auto"` 會啟用 Telegram 的原生命令。

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

    規則：名稱會正規化（移除前置 `/`、轉為小寫）；有效模式為 `a-z`、`0-9`、`_`，長度 1-32；自訂命令不能覆寫原生命令；衝突/重複項目會被略過並記錄。

    自訂命令只是選單項目，不會自動實作行為。外掛/skill 命令即使未顯示在 Telegram 選單中，輸入時仍可運作。如果停用原生命令，內建項目會被移除；已設定的自訂/外掛命令仍可能註冊。

    常見設定失敗：

    - `setMyCommands failed` 在修剪重試後伴隨 `BOT_COMMANDS_TOO_MUCH`，表示選單仍然溢出；請減少外掛/skill/自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接 Bot API curl 命令可運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 伴隨 `404: Not Found` 失敗，通常表示 `channels.telegram.apiRoot` 被設定為完整 `/bot<TOKEN>` 端點。`apiRoot` 必須只是 Bot API 根；`openclaw doctor --fix` 會移除意外的尾端 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕已設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`（預設帳戶）；OpenClaw 會在輪詢前停止，因此這不會被回報為網路鉤子清理失敗。
    - `setMyCommands failed` 伴隨網路/fetch 錯誤，通常表示到 `api.telegram.org` 的外寄 DNS/HTTPS 被封鎖。

    ### 裝置配對命令（`device-pair` 外掛）

    安裝後：

    1. `/pair` 產生設定碼
    2. 將程式碼貼到 iOS app
    3. `/pair pending` 列出待處理請求（包括角色/範圍）
    4. 核准：`/pair approve <requestId>`、`/pair approve`（唯一待處理請求）或 `/pair approve latest`

    如果裝置以變更後的驗證詳細資訊（角色、範圍、公鑰）重試，先前的待處理請求會被新的 `requestId` 取代；請在核准前重新執行 `/pair pending`。

    更多詳細資訊：[配對](/zh-TW/channels/pairing#pair-via-telegram)。

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

    逐帳戶覆寫：

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

    範圍：`off`、`dm`、`group`、`all`、`allowlist`（預設）。舊版 `capabilities: ["inlineButtons"]` 會對應到 `"all"`。

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

    `web_app` 按鈕只適用於使用者與機器人之間的私人聊天。

    未由已註冊外掛互動處理常式認領的回呼點擊，會作為文字傳遞給代理：`callback_data: <value>`。

  </Accordion>

  <Accordion title="代理和自動化的 Telegram 訊息動作">
    動作：

    - `sendMessage`（`to`、`content`、選用 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、選用 `presentation` 行內按鈕；僅按鈕編輯會更新回覆標記）
    - `createForumTopic`（`chatId`、`name`、選用 `iconColor`、`iconCustomEmojiId`）

    易用別名：`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    閘控：`channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（預設：停用）。`edit`、`createForumTopic` 和 `editForumTopic` 預設啟用，沒有專用切換。
    執行階段傳送會使用啟動/重新載入時的作用中設定/秘密快照，因此動作路徑不會在每次傳送時重新解析 `SecretRef` 值。

    反應移除語意：[/tools/reactions](/zh-TW/tools/reactions)。

  </Accordion>

  <Accordion title="回覆討論串標籤">
    產生輸出中的明確回覆討論串標籤：

    - `[[reply_to_current]]` — 回覆觸發訊息
    - `[[reply_to:<id>]]` — 回覆特定訊息 ID

    `channels.telegram.replyToMode`：`off`（預設）、`first`、`all`。

    當啟用回覆討論串且原始文字/標題可用時，OpenClaw 會自動新增原生引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 code unit；較長訊息會從開頭引用，若 Telegram 拒絕該引用，則退回純文字回覆。

    `off` 只會停用隱含回覆討論串；明確的 `[[reply_to_*]]` 標籤仍會被遵循。

  </Accordion>

  <Accordion title="論壇主題與討論串行為">
    論壇超級群組：主題工作階段鍵會附加 `:topic:<threadId>`；回覆和輸入狀態會指定到主題討論串；主題設定路徑是 `channels.telegram.groups.<chatId>.topics.<threadId>`。

    一般主題 (`threadId=1`) 是特殊情況：傳送訊息時會省略 `message_thread_id`（Telegram 會以「找不到討論串」拒絕 `sendMessage(...thread_id=1)`），但輸入狀態動作仍會包含 `message_thread_id`（經驗上這是顯示輸入指示器所需）。

    主題項目會繼承群組設定，除非被覆寫（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。`agentId` 僅適用於主題，不會從群組預設值繼承。`topics."*"` 會為該群組中的每個主題設定預設值；精確的主題 ID 仍優先於 `"*"`。

    **依主題的代理路由**：每個主題都可以透過主題設定中的 `agentId` 路由到不同代理，讓它擁有自己的工作區、記憶與工作階段：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic -> main agent
                "3": { agentId: "zu" },        // Dev topic -> zu agent
                "5": { agentId: "coder" }      // Code review -> coder agent
              }
            }
          }
        }
      }
    }
    ```

    接著每個主題都有自己的工作階段鍵，例如 `agent:zu:telegram:group:-1001234567890:topic:3`。

    **持久 ACP 主題繫結**：論壇主題可以透過頂層具型別繫結（`bindings[]`，包含 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 這樣限定主題的 ID）釘選 ACP harness 工作階段。目前範圍限於群組/超級群組中的論壇主題。請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

    **從聊天產生繫結討論串的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結到新的 ACP 工作階段；後續訊息會直接路由到該處，而 OpenClaw 會在主題內釘選產生確認。需要 `channels.telegram.threadBindings.spawnSessions`（預設：`true`）。

    範本內容會公開 `MessageThreadId` 和 `IsForum`。具有 `message_thread_id` 的私訊聊天會保留回覆中繼資料，但只有在 Telegram `getMe` 回報 `has_topics_enabled: true` 時，才會使用感知討論串的工作階段鍵。
    已淘汰的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆寫已移除；BotFather 討論串模式是唯一真實來源。執行 `openclaw doctor --fix` 以移除過時的設定鍵。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。預設：音訊檔案行為；在代理回覆中標記 `[[audio_as_voice]]` 可強制以語音訊息傳送。傳入語音訊息轉錄會在代理內容中被框定為機器產生、不受信任的文字，但提及偵測仍會使用原始轉錄，因此以提及為門檻的語音訊息會持續運作。

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

    Telegram 會區分影片檔案與影片訊息。影片訊息不支援說明文字；提供的訊息文字會另外傳送。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### 貼圖

    傳入：靜態 WEBP 會被下載並處理（預留位置 `<media:sticker>`）；動畫 TGS 和影片 WEBM 會被略過。

    貼圖內容欄位：`Sticker.emoji`、`Sticker.setName`、`Sticker.fileId`、`Sticker.fileUniqueId`、`Sticker.cachedDescription`。描述會快取在 OpenClaw SQLite 外掛狀態中，以減少重複的視覺呼叫。

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

    傳送：

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
    Telegram 反應會以 `message_reaction` 更新抵達，與訊息承載資料分開。啟用時，OpenClaw 會將像 `Telegram reaction added: 👍 by Alice (@alice) on msg 42` 這樣的系統事件加入佇列。

    - `channels.telegram.reactionNotifications`: `off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（預設：`minimal`）

    `own` 表示僅限使用者對機器人傳送訊息的反應（透過已傳送訊息快取盡力判定）。反應事件仍會遵守 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被丟棄。

    Telegram 不會在反應更新中提供討論串 ID：非論壇群組會路由到群組聊天工作階段；論壇群組會路由到一般主題工作階段（`:topic:1`），而不是精確的來源主題。

    用於輪詢/網路鉤子的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`messages.ackReactionScope` 決定它會在*何時*傳送。

    **表情符號解析順序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    Telegram 預期使用 unicode 表情符號（例如 "👀"）；使用 `""` 可停用某個頻道或帳號的反應。

    **範圍（`messages.ackReactionScope`，預設 `"group-mentions"`；目前沒有 Telegram 帳號或 Telegram 頻道覆寫）：**

    `all`（私訊 + 群組，包含環境房間事件）、`direct`（僅私訊）、`group-all`（除環境房間事件外的每則群組訊息，不含私訊）、`group-mentions`（群組中提及機器人時；**不含私訊** — 預設）、`off` / `none`（停用）。

    <Note>
    預設範圍（`group-mentions`）不會在私訊或環境房間事件中觸發確認反應。私訊請使用 `direct` 或 `all`；只有 `all` 會確認環境房間事件。此值會在 Telegram 提供者啟動時讀取，因此需要重新啟動閘道，變更才會生效。
    </Note>

  </Accordion>

  <Accordion title="來自 Telegram 事件與命令的設定寫入">
    頻道設定寫入預設啟用（`configWrites !== false`）。由 Telegram 觸發的寫入包含群組遷移事件（`migrate_to_chat_id`，更新 `channels.telegram.groups`）以及 `/config set` / `/config unset`（需要啟用命令）。

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
    預設為長輪詢。若要使用網路鉤子模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；選用的 `webhookPath`（預設 `/telegram-webhook`）、`webhookHost`（預設 `127.0.0.1`）、`webhookPort`（預設 `8787`）、`webhookCertPath`（用於直接 IP 或無網域設定的自簽憑證 PEM）。

    在長輪詢模式中，OpenClaw 只會在更新成功派送後持久化其重新啟動水位標記；失敗的處理常式會讓該更新在同一行程中可重試，而不是標記為已完成。

    本機監聽器預設繫結至 `127.0.0.1:8787`。若要公開入口，請在本機連接埠前放置反向代理，或有意地設定 `webhookHost: "0.0.0.0"`。

    網路鉤子模式會驗證請求防護、Telegram 秘密權杖與 JSON 內容，然後才回傳 `200`。接著 OpenClaw 會透過長輪詢使用的同一組每聊天/每主題機器人通道非同步處理更新，因此緩慢的代理回合不會占住 Telegram 的傳遞 ACK。

  </Accordion>

  <Accordion title="限制、重試與命令列介面目標">
    - `channels.telegram.textChunkLimit` 預設 4000；`chunkMode="newline"` 會在按長度切分前優先使用段落邊界（空白行）。
    - `channels.telegram.mediaMaxMb`（預設 100）限制傳入與傳出媒體大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500，範圍 10-60000）控制相簿/媒體群組在 OpenClaw 將其派送為一則傳入訊息前要緩衝多久。如果相簿部分較晚抵達，請增加它；若要降低相簿回覆延遲，請減少它。
    - `channels.telegram.timeoutSeconds` 會覆寫 API 用戶端逾時（若未設定，套用 grammY 預設值）。機器人用戶端會將設定值限制在 60 秒傳出文字/輸入狀態請求防護以下，避免 grammY 在 OpenClaw 的傳輸防護與後援可執行前中止可見回覆傳遞。長輪詢仍會使用 45 秒 `getUpdates` 請求防護，因此閒置輪詢不會被無限期放棄。
    - `channels.telegram.pollingStallThresholdMs` 預設為 120000；僅針對誤判的輪詢停滯重新啟動，在 30000 到 600000 之間調整。
    - 群組內容歷史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；`0` 會停用。
    - 當閘道已觀察到父訊息時，回覆/引用/轉寄補充內容會正規化為一個選定的對話內容視窗；已觀察訊息快取位於 OpenClaw SQLite 外掛狀態中，而 `openclaw doctor --fix` 會匯入舊版 sidecar。Telegram 每次更新只包含一層淺層 `reply_to_message`，因此早於快取的鏈結會受限於該承載資料。
    - Telegram 允許清單主要管制誰可以觸發代理，而不是完整的補充內容遮蔽邊界。
    - 私訊歷史：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` 適用於可復原傳出 API 錯誤的 Telegram 傳送輔助工具（命令列介面/工具/動作）。傳入最終回覆傳遞會針對連線前失敗使用有界限的安全傳送重試，但不會重試可能導致可見訊息重複的模糊傳送後網路封套。

    命令列介面與訊息工具傳送目標可接受數值聊天 ID、使用者名稱或論壇主題目標：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    投票使用 `openclaw message poll`，並支援論壇主題：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    僅限 Telegram 的投票旗標：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（或 `:topic:` 目標）。`--poll-option` 重複 2-12 次（Telegram 的選項上限）。

    Telegram 傳送也支援搭配 `buttons` 區塊的 `--presentation` 以使用行內鍵盤（當 `channels.telegram.capabilities.inlineButtons` 允許時）、`--pin` 或 `--delivery '{"pin":true}'` 以在機器人可於該聊天釘選時請求釘選傳遞，以及 `--force-document` 以將傳出圖片、GIF 和影片作為文件傳送，而不是壓縮/動畫/影片上傳。

    動作管制：`channels.telegram.actions.sendMessage=false` 會停用所有傳出訊息，包含投票；`channels.telegram.actions.poll=false` 會停用投票建立，同時保持一般傳送啟用。

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中進行執行核准，也可選擇在來源聊天或主題中張貼提示。核准者必須是數值 Telegram 使用者 ID。

    - `channels.telegram.execApprovals.enabled`（`"auto"` 會在至少能解析出一位核准者時啟用）
    - `channels.telegram.execApprovals.approvers`（退回使用來自 `commands.ownerAllowFrom` 的數值擁有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（預設）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以和機器人對話，以及它把一般回覆傳送到哪裡；它們不會讓某人成為 exec 核准者。當還沒有命令擁有者時，第一次核准的 DM 配對會啟動 `commands.ownerAllowFrom`，因此單一擁有者設定不需要在 `execApprovals.approvers` 下重複填入 ID。

    頻道傳遞會在聊天中顯示命令文字；只在受信任的群組/主題中啟用 `channel` 或 `both`。當提示落在論壇主題中時，OpenClaw 會為核准提示和後續訊息保留該主題。Exec 核准預設會在 30 分鐘後過期。

    內嵌核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過外掛核准解析；其他 ID 會先透過 exec 核准解析。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理程式遇到傳遞或供應商錯誤時，錯誤政策會控制錯誤訊息是否送達 Telegram 聊天：

| 鍵                                  | 值                         | 預設            | 說明                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` 會將每則錯誤訊息傳送到聊天。`once` 會在每個冷卻視窗中只傳送一次每則不重複的錯誤訊息（抑制重複的相同錯誤）。`silent` 永遠不會將錯誤訊息傳送到聊天。 |
| `channels.telegram.errorCooldownMs` | 數字（毫秒）               | `14400000`（4 小時） | `once` 政策的冷卻視窗。錯誤傳送後，相同訊息會被抑制，直到此間隔經過。可避免中斷期間出現錯誤洗版。                                           |

支援個別帳號、個別群組和個別主題覆寫（與其他 Telegram 設定鍵使用相同繼承方式）。

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
  <Accordion title="機器人不回應非提及的群組訊息">

    - 如果 `requireMention=false`，Telegram 隱私模式必須允許完整可見性：BotFather `/setprivacy` -> Disable，然後將機器人從群組移除並重新加入。
    - 當設定預期未提及的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 會檢查明確的數值群組 ID；萬用字元 `"*"` 無法進行成員資格探測。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列在其中（或包含 `"*"`）。
    - 驗證機器人在群組中的成員資格。
    - 檢閱 `openclaw logs --follow` 中的略過原因。

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授權你的傳送者身分（配對和/或數值 `allowFrom`）；即使群組政策是 `open`，命令授權仍然適用。
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單有太多項目；請減少外掛/skill/自訂命令，或停用原生選單。
    - `deleteMyCommands` / `setMyCommands` 啟動呼叫與 `sendChatAction` 輸入狀態呼叫都有界限，並會在請求逾時時透過 Telegram 的傳輸退回重試一次。持續的網路/擷取錯誤通常表示無法連到 `api.telegram.org` 的 DNS/HTTPS。

  </Accordion>

  <Accordion title="啟動回報未授權權杖">

    - `getMe returned 401` 是設定機器人權杖的 Telegram 驗證失敗。請在 BotFather 重新複製或重新產生權杖，然後更新 `channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`（預設帳號）。
    - 啟動期間的 `deleteWebhook 401 Unauthorized` 也是驗證失敗；把它當成「沒有網路鉤子存在」只會把同一個錯誤權杖失敗延後到稍後的 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - Node 22+ 搭配自訂 fetch/proxy 時，如果 `AbortSignal` 型別不相符，可能觸發立即中止行為。
    - 有些主機會先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 對外連線會造成間歇性 API 失敗。
    - 含有 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!` 的記錄會作為可復原的網路錯誤重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重用啟動時成功的 `getMe` 探測，因此執行器不需要在第一次 `getUpdates` 前再執行第二次 `getMe`。
    - 如果 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤失敗，OpenClaw 會繼續進入長輪詢，而不是再發出另一個輪詢前控制平面呼叫。仍然啟用的網路鉤子接著會以 `getUpdates` 衝突浮現；OpenClaw 會重建傳輸並重試網路鉤子清理。
    - 如果 Telegram socket 以固定短週期回收，請檢查是否有過低的 `channels.telegram.timeoutSeconds`；機器人用戶端會將設定值限制在對外和 `getUpdates` 請求保護值之下，但較舊版本可能在此值低於那些保護值時中止每次輪詢或回覆。
    - 記錄中的 `Polling stall detected` 表示 OpenClaw 在預設 120 秒內沒有完成長輪詢存活訊號後，會重新啟動輪詢並重建傳輸。
    - 當執行中的輪詢帳號在啟動寬限期後尚未完成 `getUpdates`、執行中的網路鉤子帳號在啟動寬限期後尚未完成 `setWebhook`，或最後一次成功的輪詢傳輸活動已過舊時，`openclaw channels status --probe` 和 `openclaw doctor` 會發出警告。
    - 只有在長時間執行的 `getUpdates` 呼叫健康，但你的主機仍回報誤判的輪詢停滯重新啟動時，才提高 `channels.telegram.pollingStallThresholdMs`。持續停滯通常指向 proxy、DNS、IPv6 或到 `api.telegram.org` 的 TLS 對外連線問題。
    - Telegram 的 Bot API 傳輸會遵循程序 proxy 環境變數：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及小寫變體。`NO_PROXY` / `no_proxy` 仍可略過 `api.telegram.org`。
    - 如果服務環境設定了 `OPENCLAW_PROXY_URL`，且不存在標準 proxy 環境變數，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接對外連線/TLS 不穩定的 VPS 主機上，請透過 proxy 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`、程序預設值（例如 `NODE_OPTIONS=--dns-result-order=ipv4first`），若皆不適用，則在 Node 22+ 上退回到 `ipv4first`。
    - 在 WSL2 上，或當僅 IPv4 行為效果更好時，強制選擇 family：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基準範圍回應（`198.18.0.0/15`）預設已允許用於 Telegram 媒體下載。如果受信任的 fake-IP 或透明 proxy 在媒體下載期間將 `api.telegram.org` 重寫為其他私有/內部/特殊用途位址，請選擇加入僅限 Telegram 的略過：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一個選擇加入也可在 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 針對每個帳號使用。
    - 如果你的 proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先保持危險旗標關閉；該範圍預設已允許。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram 媒體 SSRF 保護。只在受信任、由操作員控制的 proxy 環境（Clash、Mihomo、Surge fake-IP 路由）中使用，這些環境會合成 RFC 2544 基準範圍之外的私有或特殊用途回應。一般公開網際網路 Telegram 存取請保持關閉。
    </Warning>

    - 暫時環境覆寫：`OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
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

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`（必須是一般檔案；符號連結會被拒絕）、`accounts.*`
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 主題預設值：`groups.<chatId>.topics."*"` 會套用到未相符的論壇主題；精確主題 ID 會覆寫它
- exec 核准：`execApprovals`、`accounts.*.execApprovals`
- 命令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 執行緒/回覆：`replyToMode`、`threadBindings`
- 串流：`streaming`（模式 `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 格式/傳遞：`textChunkLimit`、`chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅 Bot API 根目錄；不要包含 `/bot<TOKEN>`）、`trustedLocalFileRoots`（自架 Bot API 絕對 `file_path` 根目錄）
- 網路鉤子：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- 動作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- 反應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 寫入/歷史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個以上帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明確指定預設路由。否則 OpenClaw 會退回到第一個正規化帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 值。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者配對到閘道。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組與主題的允許清單行為。
  </Card>
  <Card title="通道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組與主題對應到代理。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨通道診斷。
  </Card>
</CardGroup>
