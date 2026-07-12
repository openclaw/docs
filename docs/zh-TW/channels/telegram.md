---
read_when:
    - 開發 Telegram 功能或網路鉤子
summary: Telegram Bot 支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-07-12T14:19:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8aa81fb0a1bc2953305591f5b616e5caebfee24c5fab04737c5e2eaa02be4559
    source_path: channels/telegram.md
    workflow: 16
---

透過 grammY，為機器人私訊與群組提供可投入正式環境的支援。預設傳輸方式為長輪詢；網路鉤子模式為選用。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Telegram 的預設私訊政策為配對。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復操作手冊。
  </Card>
  <Card title="閘道設定" icon="settings" href="/zh-TW/gateway/configuration">
    完整的頻道設定模式與範例。
  </Card>
</CardGroup>

## 快速設定

<Steps>
  <Step title="在 BotFather 中建立機器人權杖">
    這兩種流程最後都會取得要貼入 OpenClaw 的權杖，請任選其一：

    - **聊天流程**：開啟 Telegram，與 **@BotFather** 聊天（確認帳號名稱完全是 `@BotFather`），執行 `/newbot`、依照提示操作，並儲存權杖。
    - **網頁流程**：開啟 [BotFather 的網頁應用程式](https://t.me/BotFather?startapp)（它可在所有 Telegram 用戶端中執行，包括 [web.telegram.org](https://web.telegram.org)），在介面中建立機器人，並複製其權杖。

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

    環境變數備援：`TELEGRAM_BOT_TOKEN`（僅限預設帳號；具名帳號必須使用 `botToken` 或 `tokenFile`）。
    Telegram **不會**使用 `openclaw channels login telegram`；請在設定／環境變數中設定權杖，然後啟動閘道。

  </Step>

  <Step title="啟動閘道並核准第一則私訊">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配對碼會在 1 小時後到期。

  </Step>

  <Step title="將機器人加入群組">
    將機器人加入你的群組，然後取得群組存取所需的兩個 ID：

    - 你的 Telegram 使用者 ID，用於 `allowFrom`／`groupAllowFrom`
    - Telegram 群組聊天 ID，作為 `channels.telegram.groups` 下的鍵

    從 `openclaw logs --follow`、轉傳訊息 ID 機器人或 Bot API 的 `getUpdates` 取得群組聊天 ID。允許該群組後，使用 `/whoami@<bot_username>` 確認使用者與群組 ID。

    以 `-100` 開頭的負數超級群組 ID 是群組聊天 ID。它們應放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom`。

  </Step>
</Steps>

<Note>
權杖解析會考量帳號：`tokenFile` 的優先順序高於 `botToken`，後者又高於環境變數；而設定的優先順序一律高於 `TELEGRAM_BOT_TOKEN`（後者僅針對預設帳號進行解析）。成功啟動後，OpenClaw 會快取機器人身分，最長可達 24 小時，讓重新啟動時不必額外呼叫 `getMe`；變更或移除權杖會清除此快取。
</Note>

  ## Telegram 端設定

  <AccordionGroup>
  <Accordion title="隱私模式與群組可見性">
    Telegram Bot 預設使用**隱私模式**，這會限制它們可接收的群組訊息。

    若要查看所有群組訊息，請選擇以下任一方式：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將機器人設為群組管理員。

    切換隱私模式後，請在每個群組中移除再重新加入機器人，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="群組權限">
    管理員狀態由 Telegram 群組設定控制。管理員機器人會收到所有群組訊息，適合需要持續運作的群組行為。
  </Accordion>

  <Accordion title="實用的 BotFather 切換設定">

    - `/setjoingroups` — 允許／拒絕加入群組
    - `/setprivacy` — 群組可見性行為

    如果你偏好使用圖形介面而非聊天命令，也可以在 [BotFather 的網頁應用程式](https://t.me/BotFather?startapp)中使用相同的設定。

  </Accordion>
</AccordionGroup>

## 儀表板迷你應用程式

在與機器人的私訊中執行 `/dashboard`，以在 Telegram 內開啟 OpenClaw 儀表板。

需求：

- 已發布的 HTTPS Mini App URL 使用 `gateway.tailscale.mode: "serve"` 或 `"funnel"`。
- 你的 Telegram 數字使用者 ID 必須位於所選帳號的有效 `allowFrom` 中，或位於 `commands.ownerAllowFrom` 中。
- 請使用私訊。在群組中，`/dashboard` 會回覆 `open this in a DM with the bot`，且不傳送按鈕。
- Docker 安裝：Serve/Funnel 模式要求閘道在 `tailscaled` 旁繫結至迴路位址，而使用已發布連接埠的橋接網路無法滿足此要求。請使用 `network_mode: host` 執行閘道容器，並將主機的 `tailscaled` 通訊端（`/var/run/tailscale`）以及 `tailscale` 命令列介面掛載至容器中。

Mini App 是僅限 Tailscale 的 v1 路徑，不支援 Telegram Web iframe。

## 存取控制與啟用

### 群組機器人身分

在群組和論壇主題中，明確提及已設定的機器人帳號名稱（例如 `@my_bot`）即表示正在呼叫所選的 OpenClaw 代理，即使代理角色名稱與 Telegram 使用者名稱不同。群組靜默政策仍適用於不相關的訊息，但機器人帳號名稱本身絕不會被視為「其他人」。

<Tabs>
  <Tab title="私訊政策">
    `channels.telegram.dmPolicy` 控制私訊存取權：

    - `pairing`（預設）
    - `allowlist`（`allowFrom` 中至少需要一個傳送者 ID）
    - `open`（`allowFrom` 必須包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]`，會讓任何找到或猜到機器人使用者名稱的 Telegram 帳號都能向機器人下達命令。請僅將其用於刻意公開且工具權限受到嚴格限制的機器人；單一擁有者的機器人應搭配數字使用者 ID 使用 `allowlist`。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。也接受 `telegram:` / `tg:` 前綴，並會將其正規化。
    在多帳號設定中，限制嚴格的頂層 `channels.telegram.allowFrom` 是一道安全邊界：除非合併後的有效允許清單仍包含明確的萬用字元，否則帳號層級的 `allowFrom: ["*"]` 不會讓該帳號公開。
    `dmPolicy: "allowlist"` 搭配空白的 `allowFrom` 會封鎖所有私訊，且設定驗證會拒絕此組態。
    設定程序只會要求數字使用者 ID。如果你的設定含有舊版設定程序留下的 `@username` 允許清單項目，請執行 `openclaw doctor --fix`，以將其解析為數字 ID（盡力而為；需要 Telegram 機器人權杖）。
    如果你先前依賴配對儲存區的允許清單檔案，`openclaw doctor --fix` 可針對允許清單流程，將項目復原至 `channels.telegram.allowFrom`（例如 `dmPolicy: "allowlist"` 尚未設定明確 ID 時）。

    對於單一擁有者的機器人，建議使用 `dmPolicy: "allowlist"` 搭配明確的數字 `allowFrom` ID，而不要依賴先前的配對核准。

    常見誤解：核准私訊配對不代表「此傳送者已在所有地方獲得授權」。配對只會授予私訊存取權。如果尚未存在命令擁有者，第一個獲准的配對也會設定 `commands.ownerAllowFrom`，為僅限擁有者的命令與執行核准指定明確的操作員帳號。群組傳送者授權仍來自明確設定的允許清單。
    若要讓同一身分同時獲得私訊與群組命令的授權：請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；對於僅限擁有者的命令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全（不使用第三方機器人）：私訊你的機器人，執行 `openclaw logs --follow`，然後讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方式（隱私性較低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群組政策與允許清單">
    以下兩項控制會同時套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 未設定 `groups`，且 `groupPolicy: "open"`：任何群組都會通過群組 ID 檢查
       - 未設定 `groups`，且 `groupPolicy: "allowlist"`（預設）：在你新增 `groups` 項目（或 `"*"`）之前，所有群組都會遭到封鎖
       - 已設定 `groups`：作為允許清單使用（明確 ID 或 `"*"`）

    2. **群組中允許哪些傳送者**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（預設）/ `disabled`

    `groupAllowFrom` 會篩選群組傳送者；如果未設定，Telegram 會退回使用 `allowFrom`（而非配對儲存區——群組傳送者授權絕不會繼承私訊配對儲存區的核准；自 `2026.2.25` 起，這是一道安全邊界）。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會正規化）；非數字項目會被忽略。請勿在此放入群組或超級群組聊天 ID——負數聊天 ID 應放在 `channels.telegram.groups` 下。
    單一擁有者機器人的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID，讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 下允許目標群組。
    如果設定中完全缺少 `channels.telegram`，除非明確設定 `channels.defaults.groupPolicy`，否則執行階段預設會採用故障時關閉的 `groupPolicy="allowlist"`。

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

    請在群組中使用 `@<bot_username> ping` 進行測試。當 `requireMention: true` 時，一般群組訊息不會觸發機器人。

    允許特定群組中的任何成員：

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

    僅允許特定群組中的指定使用者：

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

      - 負數 Telegram 群組／超級群組聊天 ID（`-1001234567890`）應放在 `channels.telegram.groups` 下。
      - Telegram 使用者 ID（`8734062810`）應放在 `groupAllowFrom` 下，以限制允許群組中哪些人可以觸發機器人。
      - 僅在要讓允許群組中的任何成員都能與機器人交談時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行為">
    群組回覆預設需要提及機器人。提及可以來自：

    - 原生 `@botusername` 提及，或
    - `agents.list[].groupChat.mentionPatterns` 或 `messages.groupChat.mentionPatterns` 中的提及模式

    工作階段層級切換（僅限狀態，不會持久保存）：`/activation always`、`/activation mention`。若要持久保存，請使用設定：

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

    群組歷史記錄內容一律啟用，並受 `historyLimit` 限制。將 `channels.telegram.historyLimit: 0` 設為停用群組歷史記錄視窗。`openclaw doctor --fix` 會移除已淘汰的 `includeGroupHistoryContext` 鍵。

    取得群組聊天 ID：將群組訊息轉傳給 `@userinfobot` / `@getidsbot`、從 `openclaw logs --follow` 讀取 `chat.id`、檢查 Bot API 的 `getUpdates`，或在允許該群組後執行 `/whoami@<bot_username>`。

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 在閘道程序內執行。
- 路由是確定性的：Telegram 傳入的訊息會回覆至 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共用頻道封裝，其中包含回覆中繼資料、媒體預留位置，以及閘道已觀察到之回覆的持久化回覆鏈脈絡。
- 群組工作階段會依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>`。
- 私訊訊息可以攜帶 `message_thread_id`；OpenClaw 會保留它以供回覆使用。只有當 Telegram `getMe` 回報該機器人的 `has_topics_enabled: true` 時，私訊主題工作階段才會分開；否則私訊會維持在扁平工作階段中。
- 長輪詢使用 grammY runner，並依聊天／討論串排序。Runner 接收端並行數使用 `agents.defaults.maxConcurrent`。
- 多帳號啟動會限制並行 `getMe` 探測，避免大型機器人群組同時展開所有帳號探測。
- 每個閘道程序都會保護長輪詢，確保同一時間只有一個作用中的輪詢器能使用機器人權杖。持續發生的 `getUpdates` 409 衝突，表示另一個 OpenClaw 閘道、指令碼或外部輪詢器正在使用相同權杖。
- 輪詢看門狗預設會在 120 秒內未完成 `getUpdates` 活性檢查後重新啟動。只有當你的部署在長時間執行工作期間發生誤判的輪詢停滯重啟時，才提高 `channels.telegram.pollingStallThresholdMs`（30000-600000，支援各帳號覆寫）。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果升級後你的設定仍包含這些鍵，請執行 `openclaw doctor --fix`。私訊主題路由現在遵循 Telegram `getMe.has_topics_enabled`（由 BotFather 的討論串模式控制）：啟用主題的機器人在 Telegram 傳送 `message_thread_id` 時會使用討論串範圍的私訊工作階段；其他私訊則維持在扁平工作階段中。
</Note>

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 會在直接聊天、群組和主題中即時串流部分回覆：先傳送預覽訊息，接著重複呼叫 `editMessageText`，最後就地完成。

    - `channels.telegram.streaming` 可設為 `off | partial | block | progress`（預設：`partial`）
    - 簡短的初始答案預覽會經過防抖處理；如果執行仍在進行，則會在有限延遲後具體呈現
    - `progress` 會為工具進度保留一則可編輯的狀態草稿；若答案活動早於工具進度抵達，則顯示穩定的狀態標籤；完成時清除該草稿，並將最終答案作為一般訊息傳送
    - `streaming.preview.toolProgress` 控制工具／進度更新是否重複使用同一則經編輯的預覽訊息（預覽串流啟用時預設為 `true`）
    - `streaming.preview.commandText` 控制這些行內的命令／執行詳細資訊：`raw`（預設）或 `status`（僅顯示工具標籤）
    - `streaming.progress.commentary`（預設：`false`）可選擇在暫時的進度草稿中加入助理評論／前言文字
    - 系統會偵測舊版 `channels.telegram.streamMode`、布林值 `streaming`，以及已淘汰的原生草稿預覽鍵；請執行 `openclaw doctor --fix` 以遷移它們

    工具進度行是在工具執行期間顯示的簡短狀態更新（命令執行、檔案讀取、規劃更新、修補摘要，以及應用程式伺服器模式下的 Codex 前言／評論）。Telegram 預設會保持顯示這些內容（與 `v2026.4.22`+ 的已發布行為一致）。

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

    保持工具進度可見，但隱藏命令／執行文字：

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

    `streaming.mode: "off"` 會停用預覽編輯，並抑制一般工具／進度訊息，而不是將其作為獨立狀態訊息傳送；核准提示、媒體和錯誤仍會透過一般最終傳遞路徑路由。`streaming.preview.toolProgress: false` 則只保留答案預覽編輯。

    <Note>
      已選取引文的回覆是例外。當 `replyToMode` 為 `first`、`all` 或 `batched`，且傳入訊息包含已選取的引文文字時，OpenClaw 會透過 Telegram 的原生引文回覆路徑傳送最終答案，而不是編輯答案預覽，因此 `streaming.preview.toolProgress` 無法在該輪顯示狀態行。沒有已選取引文文字的目前訊息回覆仍會串流。若工具進度的可見性比原生引文回覆更重要，請設定 `replyToMode: "off"`；或者設定 `streaming.preview.toolProgress: false` 以接受此取捨。
    </Note>

    對於純文字回覆：簡短預覽會就地完成最終編輯；拆分為多則訊息的長篇最終內容會重複使用預覽作為第一個區塊，接著只傳送其餘部分；進度模式的最終內容會清除狀態草稿，並使用一般最終傳遞；如果在確認完成前最終編輯失敗，OpenClaw 會退回一般最終傳遞，並清理過時的預覽。對於複雜回覆（媒體承載內容），OpenClaw 一律退回一般最終傳遞並清理預覽。

    預覽串流和區塊串流互斥——明確啟用區塊串流時，OpenClaw 會略過預覽串流以避免重複串流。

    推理：`/reasoning stream` 會在生成期間將推理串流至即時預覽，接著在最終傳遞後刪除推理預覽（使用 `/reasoning on` 可讓它保持可見）。最終答案傳送時不包含推理文字。

  </Accordion>

  <Accordion title="豐富訊息格式">
    傳出文字預設使用標準 Telegram HTML 訊息，可在目前的用戶端中閱讀：粗體、斜體、連結、程式碼、隱藏文字、引文——而非 Bot API 10.1 的僅限豐富內容區塊（原生表格、詳細資料、豐富媒體、公式）。

    選擇啟用 Bot API 10.1 豐富訊息：

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    啟用時：系統會告知代理程式此機器人／帳號可使用豐富訊息；Markdown 文字會透過 OpenClaw 的 Markdown IR 轉譯為 Telegram 豐富 HTML；明確的豐富 HTML 承載內容會保留 Bot API 10.1 支援的標籤（標題、表格、詳細資料、豐富媒體、公式）；媒體說明文字仍使用 Telegram HTML 說明文字（豐富訊息不會取代說明文字，且說明文字上限為 1024 個字元）。

    如此可避免模型文字使用 Telegram 的豐富 Markdown 符號，因此 `$400-600K` 之類的金額不會被解析為數學式。過長的豐富文字會依 Telegram 的限制自動拆分。超過 20 欄限制的表格會退回程式碼區塊。

    預設：關閉，以維持用戶端相容性——部分目前的 Desktop、Web、Android 及第三方用戶端會將已接受的豐富訊息顯示為不支援。除非所有與機器人搭配使用的用戶端都能呈現這些訊息，否則請維持關閉。`/status` 會顯示目前工作階段的豐富訊息為開啟或關閉。

    連結預覽預設為開啟。`channels.telegram.linkPreview: false` 會停用豐富文字的自動實體偵測。

  </Accordion>

  <Accordion title="原生命令與自訂命令">
    Telegram 的命令選單會在啟動時透過 `setMyCommands` 註冊。`commands.native: "auto"` 會為 Telegram 啟用原生命令。

    新增自訂命令選單項目：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git 備份" },
        { command: "generate", description: "建立圖片" },
      ],
    },
  },
}
```

    規則：名稱會正規化（移除開頭的 `/`、轉為小寫）；有效模式為 `a-z`、`0-9`、`_`，長度 1-32；自訂命令不能覆寫原生命令；衝突／重複項目會被略過並記錄。

    自訂命令僅是選單項目——不會自動實作行為。即使未顯示於 Telegram 選單中，輸入外掛／skill 命令時仍可運作。如果停用原生命令，內建命令會被移除；若已設定，自訂／外掛命令仍可註冊。

    常見設定失敗：

    - 經過裁減重試後，`setMyCommands failed` 並出現 `BOT_COMMANDS_TOO_MUCH`，表示選單仍然溢出；請減少外掛／skill／自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接使用 Bot API curl 命令可正常運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失敗並顯示 `404: Not Found` 時，通常表示 `channels.telegram.apiRoot` 被設為完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須只設為 Bot API 根路徑；`openclaw doctor --fix` 會移除意外附加的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕了已設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`（預設帳號）；OpenClaw 會在輪詢前停止，因此不會將此問題回報為網路鉤子清理失敗。
    - `setMyCommands failed` 並出現網路／擷取錯誤，通常表示通往 `api.telegram.org` 的傳出 DNS／HTTPS 遭到封鎖。

    ### 裝置配對命令（`device-pair` 外掛）

    安裝後：

    1. `/pair` 會產生設定代碼
    2. 將代碼貼到 iOS 應用程式中
    3. `/pair pending` 會列出待處理的要求（包括角色／範圍）
    4. 核准：`/pair approve <requestId>`、`/pair approve`（唯一的待處理要求）或 `/pair approve latest`

    如果裝置使用已變更的驗證詳細資訊（角色、範圍、公開金鑰）重試，先前的待處理要求會由具有新 `requestId` 的要求取代；核准前請重新執行 `/pair pending`。

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

    各帳號覆寫：

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

    範圍：`off`、`dm`、`group`、`all`、`allowlist`（預設）。舊版 `capabilities: ["inlineButtons"]` 會對應至 `"all"`。

    訊息動作範例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "選擇一個選項：",
  buttons: [
    [
      { text: "是", callback_data: "yes" },
      { text: "否", callback_data: "no" },
    ],
    [{ text: "取消", callback_data: "cancel" }],
  ],
}
```

    Mini App 按鈕範例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "開啟應用程式：",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "啟動", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app` 按鈕只能在使用者與機器人之間的私人聊天中運作。

    未由已註冊的外掛互動處理常式認領的回呼點擊，會以文字傳遞給代理程式：`callback_data: <value>`。

  </Accordion>

  <Accordion title="供代理程式與自動化使用的 Telegram 訊息動作">
    動作：

    - `sendMessage`（`to`、`content`、選用的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、選用的 `presentation` 行內按鈕；僅編輯按鈕時會更新回覆標記）
    - `createForumTopic`（`chatId`、`name`、選用的 `iconColor`、`iconCustomEmojiId`）

    易用別名：`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    控制開關：`channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（預設：停用）。`edit`、`createForumTopic` 和 `editForumTopic` 預設啟用，沒有專用開關。
    執行階段傳送會使用啟動／重新載入時的有效設定／密鑰快照，因此動作路徑不會在每次傳送時重新解析 `SecretRef` 值。

    移除反應的語意：[/tools/reactions](/zh-TW/tools/reactions)。

  </Accordion>

  <Accordion title="回覆討論串標籤">
    生成輸出中的明確回覆討論串標籤：

    - `[[reply_to_current]]` — 回覆觸發訊息
    - `[[reply_to:<id>]]` — 回覆特定訊息 ID

    `channels.telegram.replyToMode`：`off`（預設）、`first`、`all`。

    啟用回覆討論串且可取得原始文字／說明文字時，OpenClaw 會自動加入原生引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 程式碼單位；較長的訊息會從開頭開始引用，若 Telegram 拒絕該引用，則退回為一般回覆。

    `off` 僅停用隱含的回覆討論串；明確的 `[[reply_to_*]]` 標籤仍會生效。

  </Accordion>

  <Accordion title="論壇主題與討論串行為">
    論壇超級群組：主題工作階段金鑰會附加 `:topic:<threadId>`；回覆與輸入中狀態會以主題討論串為目標；主題設定路徑為 `channels.telegram.groups.<chatId>.topics.<threadId>`。

    一般主題（`threadId=1`）是特殊情況：傳送訊息時會省略 `message_thread_id`（Telegram 會以 "thread not found" 拒絕 `sendMessage(...thread_id=1)`），但輸入中動作仍會包含 `message_thread_id`（實測顯示，這是顯示輸入中指示器的必要條件）。

    除非覆寫，主題項目會繼承群組設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。`agentId` 僅適用於主題，不會繼承群組預設值。`topics."*"` 會設定該群組中每個主題的預設值；確切的主題 ID 仍優先於 `"*"`。

    **個別主題的代理路由**：每個主題都可以透過主題設定中的 `agentId` 路由至不同的代理，使其擁有自己的工作區、記憶與工作階段：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 一般主題 -> main 代理
                "3": { agentId: "zu" },        // 開發主題 -> zu 代理
                "5": { agentId: "coder" }      // 程式碼審查 -> coder 代理
              }
            }
          }
        }
      }
    }
    ```

    接著，每個主題都會有自己的工作階段金鑰，例如 `agent:zu:telegram:group:-1001234567890:topic:3`。

    **持續性 ACP 主題繫結**：論壇主題可以透過頂層型別化繫結（`bindings[]`，包含 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及如 `-1001234567890:topic:42` 的主題限定 ID）固定 ACP 控制框架工作階段。目前範圍限定於群組／超級群組中的論壇主題。請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

    **從聊天產生討論串繫結的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結至新的 ACP 工作階段；後續訊息會直接路由至該處，且 OpenClaw 會在主題中置頂產生確認訊息。需要 `channels.telegram.threadBindings.spawnSessions`（預設：`true`）。

    範本情境會公開 `MessageThreadId` 和 `IsForum`。具有 `message_thread_id` 的私訊聊天會保留回覆中繼資料，但只有當 Telegram `getMe` 回報 `has_topics_enabled: true` 時，才會使用具討論串感知能力的工作階段金鑰。
    已移除淘汰的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆寫；BotFather 的討論串模式是唯一事實來源。執行 `openclaw doctor --fix` 以移除過時的設定鍵。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音訊息與音訊檔案。預設：音訊檔案行為；在代理回覆中加上 `[[audio_as_voice]]` 標籤，可強制以語音訊息傳送。傳入語音訊息的逐字稿會在代理情境中標示為機器生成且不受信任的文字，但提及偵測仍會使用原始逐字稿，因此受提及控制的語音訊息仍可正常運作。

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

    Telegram 會區分影片檔案與視訊訊息。視訊訊息不支援說明文字；提供的訊息文字會分開傳送。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### 位置與地點

    使用現有的 `send` 動作，並提供一個獨立的 `location` 物件。座標會傳送原生地圖標記；同時加入 `name` 和 `address` 會傳送原生地點卡片。位置傳送不能與訊息文字或媒體合併。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "艾菲爾鐵塔",
    address: "巴黎戰神廣場",
  },
}
```

    ### 貼圖

    傳入：會下載並處理靜態 WEBP（預留位置 `<media:sticker>`）；略過動畫 TGS 和影片 WEBM。

    貼圖情境欄位：`Sticker.emoji`、`Sticker.setName`、`Sticker.fileId`、`Sticker.fileUniqueId`、`Sticker.cachedDescription`。描述會快取於 OpenClaw SQLite 外掛狀態中，以減少重複的視覺模型呼叫。

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

  <Accordion title="表情回應通知">
    Telegram 的表情回應會以 `message_reaction` 更新的形式送達，與訊息承載內容分開。啟用後，OpenClaw 會將類似 `Telegram reaction added: 👍 by Alice (@alice) on msg 42` 的系統事件加入佇列。

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    `own` 表示僅接收使用者對機器人所傳訊息的表情回應（透過已傳送訊息快取盡力判斷）。表情回應事件仍會遵循 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未獲授權的傳送者會被捨棄。

    Telegram 不會在表情回應更新中提供討論串 ID：非論壇群組會路由至群組聊天工作階段；論壇群組會路由至一般主題工作階段（`:topic:1`），而非實際的來源主題。

    輪詢／網路鉤子的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="確認表情回應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`messages.ackReactionScope` 決定傳送的*時機*。

    **表情符號解析順序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理程式身分 emoji 備援（`agents.list[].identity.emoji`，否則為 "👀"）

    Telegram 預期使用 Unicode emoji（例如 "👀"）；使用 `""` 可停用某個頻道或帳號的回應反應。

    **範圍（`messages.ackReactionScope`，預設為 `"group-mentions"`；目前無法針對 Telegram 帳號或 Telegram 頻道覆寫）：**

    `all`（私訊 + 群組，包括環境聊天室事件）、`direct`（僅限私訊）、`group-all`（每則群組訊息，但不含環境聊天室事件，也不含私訊）、`group-mentions`（群組中提及機器人時；**不含私訊** — 預設值）、`off` / `none`（停用）。

    <Note>
    預設範圍（`group-mentions`）不會在私訊或環境聊天室事件中觸發回應反應。私訊請使用 `direct` 或 `all`；只有 `all` 會確認環境聊天室事件。此值會在 Telegram 提供者啟動時讀取，因此必須重新啟動閘道，變更才會生效。
    </Note>

  </Accordion>

  <Accordion title="由 Telegram 事件與命令寫入設定">
    頻道設定寫入功能預設為啟用（`configWrites !== false`）。由 Telegram 觸發的寫入包括群組遷移事件（`migrate_to_chat_id`，更新 `channels.telegram.groups`），以及 `/config set` / `/config unset`（需要啟用命令）。

    停用方式：

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
    預設使用長輪詢。若要使用網路鉤子模式，請設定 `channels.telegram.webhookUrl` 與 `channels.telegram.webhookSecret`；可選設定包括 `webhookPath`（預設為 `/telegram-webhook`）、`webhookHost`（預設為 `127.0.0.1`）、`webhookPort`（預設為 `8787`）、`webhookCertPath`（用於直接 IP 或無網域設定的自簽憑證 PEM）。

    在長輪詢模式中，OpenClaw 只會在更新成功分派後，才持久保存其重新啟動進度標記；若處理常式失敗，該更新在同一程序中仍可重試，而不會被標記為已完成。

    本機監聽器預設繫結至 `127.0.0.1:8787`。若要接受公開連入流量，請在本機連接埠前方放置反向代理，或刻意設定 `webhookHost: "0.0.0.0"`。

    網路鉤子模式會驗證請求防護、Telegram 秘密權杖與 JSON 主體，接著將更新提交至持久性輸入佇列，再傳回空的 `200`。成功持久接收時會包含 `x-openclaw-delivery-accepted: durable`；健康狀態、路由、驗證身分、資料驗證及儲存錯誤回應則不會包含此標頭。反向代理與主機控制器可要求此標頭，以區分 OpenClaw 已接收與一般的空 `200`，而不必根據回應時間推斷是否已接受。

    接著，OpenClaw 會透過與長輪詢相同的每聊天／每主題機器人通道，以非同步方式處理更新，因此耗時較長的代理程式回合不會阻塞 Telegram 的傳遞確認。

  </Accordion>

  <Accordion title="限制、重試與命令列介面目標">
    - `channels.telegram.textChunkLimit` 預設為 4000；`streaming.chunkMode="newline"` 會優先依段落邊界（空白行）切分，再依長度切分。
    - `channels.telegram.mediaMaxMb`（預設 100）限制傳入與傳出媒體的大小。
    - `channels.telegram.mediaGroupFlushMs`（預設 500，範圍 10-60000）控制相簿／媒體群組在 OpenClaw 將其作為單一傳入訊息分派前的緩衝時間。如果相簿項目較晚抵達，請提高此值；若要縮短相簿回覆延遲，請降低此值。
    - `channels.telegram.timeoutSeconds` 會覆寫 API 用戶端逾時（若未設定，則套用 grammY 預設值）。機器人用戶端會將低於 60 秒傳出文字／輸入中請求防護時間的設定值限制在該值以上，避免 grammY 在 OpenClaw 的傳輸防護與備援機制得以執行前，就中止使用者可見的回覆傳遞。長輪詢仍會對 `getUpdates` 使用 45 秒的請求防護，避免閒置輪詢遭無限期擱置。
    - `channels.telegram.pollingStallThresholdMs` 預設為 120000；僅在輪詢停滯重新啟動為誤判時，才於 30000 至 600000 之間調整。
    - 群組上下文歷史記錄使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設 50）；設為 `0` 可停用。
    - 當閘道已觀察到父訊息時，回覆／引用／轉寄的補充上下文會正規化為一個選定的對話上下文視窗；已觀察訊息的快取儲存在 OpenClaw SQLite 外掛狀態中，而 `openclaw doctor --fix` 會匯入舊版側邊檔案。Telegram 每次更新只包含一層淺層的 `reply_to_message`，因此早於快取的訊息鏈僅限於該承載內容。
    - Telegram 允許清單主要限制誰能觸發代理程式，而不是完整的補充上下文遮蔽邊界。
    - 私訊歷史記錄：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` 適用於 Telegram 傳送輔助函式（命令列介面／工具／動作）所遇到的可復原傳出 API 錯誤。傳入訊息的最終回覆傳遞會對連線前失敗使用有界的安全傳送重試，但不會重試可能導致使用者可見訊息重複的模糊傳送後網路封套。

    命令列介面與訊息工具的傳送目標可接受數字聊天 ID、使用者名稱或論壇主題目標：

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

    僅限 Telegram 的投票旗標：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（或 `:topic:` 目標）。`--poll-option` 可重複 2-12 次（Telegram 的選項上限）。

    Telegram 傳送也支援搭配 `buttons` 區塊使用 `--presentation` 來建立行內鍵盤（當 `channels.telegram.capabilities.inlineButtons` 允許時）、使用 `--pin` 或 `--delivery '{"pin":true}'` 在機器人可於該聊天中釘選時要求釘選傳遞，以及使用 `--force-document` 將傳出圖片、GIF 與影片以文件傳送，而非使用壓縮圖片／動畫／影片上傳。

    動作管控：`channels.telegram.actions.sendMessage=false` 會停用包括投票在內的所有傳出訊息；`channels.telegram.actions.poll=false` 會停用建立投票，但仍允許一般傳送。

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中進行執行核准，也可選擇在原始聊天或主題中發布提示。核准者必須是數字 Telegram 使用者 ID。

    - `channels.telegram.execApprovals.enabled`（當至少可解析一位核准者時，`"auto"` 會啟用）
    - `channels.telegram.execApprovals.approvers`（備援使用 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（預設）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 與 `defaultTo` 控制誰可以與機器人交談，以及機器人將一般回覆傳送到何處——它們不會讓某人成為執行核准者。若尚無命令擁有者，第一個獲核准的私訊配對會初始化 `commands.ownerAllowFrom`，因此單一擁有者設定無須在 `execApprovals.approvers` 下重複 ID 即可運作。

    頻道傳遞會在聊天中顯示命令文字；僅在受信任的群組／主題中啟用 `channel` 或 `both`。提示出現在論壇主題中時，OpenClaw 會為核准提示與後續訊息保留該主題。執行核准預設會在 30 分鐘後到期。

    行內核准按鈕也要求 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過外掛核准解析；其他 ID 會先透過執行核准解析。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理程式遇到傳遞或提供者錯誤時，錯誤原則會控制錯誤訊息是否送達 Telegram 聊天：

| 鍵                                  | 值                         | 預設值          | 說明                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`、`once`、`silent` | `always`        | `always` 會將每則錯誤訊息傳送至聊天。`once` 會在每個冷卻時間範圍內，將每則不重複的錯誤訊息傳送一次（抑制重複的相同錯誤）。`silent` 絕不將錯誤訊息傳送至聊天。 |
| `channels.telegram.errorCooldownMs` | 數字（ms）                 | `14400000`（4h） | `once` 原則的冷卻時間範圍。傳送錯誤後，相同訊息會受到抑制，直到此間隔經過為止。可防止服務中斷期間大量傳送錯誤訊息。                                           |

支援個別帳號、個別群組與個別主題的覆寫（繼承方式與其他 Telegram 設定鍵相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 抑制此群組中的錯誤
        },
      },
    },
  },
}
```

## 疑難排解

<AccordionGroup>
  <Accordion title="機器人不回應未提及它的群組訊息">

    - 若 `requireMention=false`，Telegram 隱私模式必須允許完整可見性：BotFather `/setprivacy` -> Disable，然後從群組移除機器人再重新加入。
    - 當設定預期接收未提及機器人的群組訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 會檢查明確的數字群組 ID；萬用字元 `"*"` 無法探測成員資格。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 存在 `channels.telegram.groups` 時，必須列出該群組（或包含 `"*"`）。
    - 確認機器人是群組成員。
    - 查看 `openclaw logs --follow` 以瞭解略過原因。

  </Accordion>

  <Accordion title="命令只能部分運作或完全無法運作">

    - 授權你的傳送者身分（配對及／或數字 `allowFrom`）；即使群組原則為 `open`，命令授權仍然適用。
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單的項目過多；請減少外掛／技能／自訂命令，或停用原生選單。
    - `deleteMyCommands`／`setMyCommands` 啟動呼叫與 `sendChatAction` 輸入中呼叫皆為有界操作，並會在請求逾時時透過 Telegram 的傳輸備援機制重試一次。持續發生網路／擷取錯誤通常表示無法透過 DNS／HTTPS 連線至 `api.telegram.org`。

  </Accordion>

  <Accordion title="啟動時回報未授權權杖">

    - `getMe returned 401` 表示已設定的機器人權杖發生 Telegram 驗證失敗。請在 BotFather 中重新複製或產生權杖，然後更新 `channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`（預設帳號）。
    - 啟動期間出現 `deleteWebhook 401 Unauthorized` 也表示驗證失敗；將其視為「不存在網路鉤子」只會把同一個錯誤權杖問題延後到後續 API 呼叫才發生。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - 若 `AbortSignal` 類型不相符，Node 22+ 搭配自訂 fetch／Proxy 可能會觸發立即中止行為。
    - 部分主機會優先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 對外連線會造成間歇性 API 失敗。
    - 日誌中的 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!` 會視為可復原的網路錯誤並重試。
    - 在輪詢啟動期間，OpenClaw 會為 grammY 重複使用啟動時成功的 `getMe` 探測結果，因此執行器在第一次 `getUpdates` 前不必再次呼叫 `getMe`。
    - 若在輪詢啟動期間，`deleteWebhook` 因暫時性網路錯誤而失敗，OpenClaw 會繼續進入長輪詢，而不會再進行一次輪詢前控制平面呼叫。若網路鉤子仍處於啟用狀態，之後會呈現為 `getUpdates` 衝突；OpenClaw 會重建傳輸並重試清理網路鉤子。
    - 若 Telegram Socket 以固定的短週期重建，請檢查 `channels.telegram.timeoutSeconds` 是否過低——機器人用戶端會將低於傳出與 `getUpdates` 請求防護時間的設定值限制在該值以上，但舊版可能在此值低於這些防護時間時中止每次輪詢或回覆。
    - 日誌中的 `Polling stall detected` 表示 OpenClaw 在預設 120 秒內未完成長輪詢活性活動後，會重新啟動輪詢並重建傳輸。
    - 當執行中的輪詢帳號在啟動寬限期後仍未完成 `getUpdates`、執行中的網路鉤子帳號在啟動寬限期後仍未完成 `setWebhook`，或最後成功的輪詢傳輸活動已過期時，`openclaw channels status --probe` 與 `openclaw doctor` 會發出警告。
    - 僅當長時間執行的 `getUpdates` 呼叫狀態正常，但你的主機仍回報輪詢停滯重新啟動的誤判時，才提高 `channels.telegram.pollingStallThresholdMs`。持續停滯通常表示 Proxy、DNS、IPv6 或連線至 `api.telegram.org` 的 TLS 對外連線有問題。
    - Telegram 的 Bot API 傳輸會遵循程序的 Proxy 環境變數：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY`／`no_proxy` 仍可略過 `api.telegram.org`。
    - 若服務環境已設定 `OPENCLAW_PROXY_URL`，且不存在標準 Proxy 環境變數，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接對外連線／TLS 不穩定的 VPS 主機上，請透過 Proxy 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設為 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序依序採用 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再採用程序預設值（例如 `NODE_OPTIONS=--dns-result-order=ipv4first`）；若皆不適用，則在 Node 22+ 上備援為 `ipv4first`。
    - 在 WSL2 上，或僅使用 IPv4 的行為較佳時，請強制指定位址族選擇：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 預設已允許 Telegram 媒體下載使用 RFC 2544 基準測試範圍的回應（`198.18.0.0/15`）。如果受信任的假 IP 或透明代理在媒體下載期間將 `api.telegram.org` 改寫為其他私人／內部／特殊用途位址，請選擇啟用僅限 Telegram 的略過機制：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 每個帳號也可透過 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 選擇啟用相同設定。
    - 如果你的代理將 Telegram 媒體主機解析為 `198.18.x.x`，請先讓危險旗標保持關閉——預設已允許該範圍。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram 媒體的 SSRF 防護。僅限在受信任、由操作者控制的代理環境（Clash、Mihomo、Surge 假 IP 路由）中使用，且該環境會合成 RFC 2544 基準測試範圍以外的私人或特殊用途回應。透過一般公用網際網路存取 Telegram 時，請保持關閉。
    </Warning>

    - 暫時性環境變數覆寫：`OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
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

<Accordion title="重要的 Telegram 欄位">

- 啟動／驗證：`enabled`、`botToken`、`tokenFile`（必須是一般檔案；符號連結會被拒絕）、`accounts.*`
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 主題預設值：`groups.<chatId>.topics."*"` 套用於未匹配的論壇主題；確切的主題 ID 會覆寫此設定
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
- 命令／選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 討論串／回覆：`replyToMode`、`threadBindings`
- 串流：`streaming`（模式為 `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 格式／傳送：`textChunkLimit`、`streaming.chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- 媒體／網路：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅限 Bot API 根目錄；請勿包含 `/bot<TOKEN>`）、`trustedLocalFileRoots`（自行託管 Bot API 的絕對 `file_path` 根目錄）
- 網路鉤子：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- 動作／功能：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- 回應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 寫入／歷史記錄：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個以上的帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`），以明確指定預設路由。否則，OpenClaw 會退回使用第一個正規化後的帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom`／`groupAllowFrom`，但不會繼承 `accounts.default.*` 的值。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者與閘道配對。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組與主題允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化措施。
  </Card>
  <Card title="多代理程式路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將群組與主題對應至代理程式。
  </Card>
  <Card title="疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷。
  </Card>
</CardGroup>
