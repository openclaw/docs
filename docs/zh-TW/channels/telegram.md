---
read_when:
    - 開發 Telegram 功能或網路鉤子
summary: Telegram 機器人支援狀態、功能與設定
title: Telegram
x-i18n:
    generated_at: "2026-07-22T10:26:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f34067478f4a5a71ed8f18503234b4cfcf573ac740aa887b65d13d0e1f09ba54
    source_path: channels/telegram.md
    workflow: 16
---

可透過 grammY 用於正式環境中的機器人私訊與群組。預設傳輸方式為長輪詢；網路鉤子模式為選用。

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
    兩種流程最後都會取得要貼到 OpenClaw 的權杖，請選擇其中一種：

    - **聊天流程**：開啟 Telegram，與 **@BotFather** 聊天（確認帳號名稱完全是 `@BotFather`），執行 `/newbot`、依照提示操作，並儲存權杖。
    - **網頁流程**：開啟 [BotFather 的網頁應用程式](https://t.me/BotFather?startapp)；它可在所有 Telegram 用戶端中執行，包括 [web.telegram.org](https://web.telegram.org)；在介面中建立機器人，然後複製其權杖。

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
    Telegram **不**使用 `openclaw channels login telegram`；請在設定或環境變數中設定權杖，然後啟動閘道。

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

    - 你的 Telegram 使用者 ID，用於 `allowFrom` / `groupAllowFrom`
    - Telegram 群組聊天 ID，作為 `channels.telegram.groups` 下的鍵

    可從 `openclaw logs --follow`、轉寄訊息以取得 ID 的機器人，或 Bot API `getUpdates` 取得群組聊天 ID。允許該群組後，`/whoami@<bot_username>` 可確認使用者與群組 ID。

    以 `-100` 開頭的負數超級群組 ID 是群組聊天 ID。它們應放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom`。

  </Step>
</Steps>

<Note>
權杖解析會考量帳號：`tokenFile` 優先於 `botToken`，後者又優先於環境變數；設定一律優先於 `TELEGRAM_BOT_TOKEN`（後者僅會針對預設帳號解析）。成功啟動後，OpenClaw 最多會快取機器人身分 24 小時，讓重新啟動時略過額外的 `getMe` 呼叫；變更或移除權杖會清除該快取。
</Note>

## Telegram 端設定

<AccordionGroup>
  <Accordion title="隱私模式與群組可見性">
    Telegram 機器人預設使用 **Privacy Mode**，這會限制它們可接收的群組訊息。

    若要查看所有群組訊息，請選擇下列任一方式：

    - 透過 `/setprivacy` 停用隱私模式，或
    - 將機器人設為群組管理員。

    切換隱私模式後，請在每個群組中移除再重新加入機器人，讓 Telegram 套用變更。

  </Accordion>

  <Accordion title="群組權限">
    管理員狀態由 Telegram 群組設定控制。管理員機器人會收到所有群組訊息，適合需要持續在群組中運作的行為。
  </Accordion>

  <Accordion title="實用的 BotFather 切換設定">

    - `/setjoingroups` — 允許或拒絕加入群組
    - `/setprivacy` — 群組可見性行為

    若偏好使用介面而非聊天命令，也可以在 [BotFather 的網頁應用程式](https://t.me/BotFather?startapp)中使用相同設定。

  </Accordion>
</AccordionGroup>

## 儀表板迷你應用程式

在與機器人的私訊中執行 `/dashboard`，即可在 Telegram 內開啟 OpenClaw 儀表板。

需求：

- 已發布的 HTTPS 迷你應用程式 URL 需使用 `gateway.tailscale.mode: "serve"` 或 `"funnel"`。
- 你的數字 Telegram 使用者 ID 必須位於所選帳號的有效 `allowFrom` 或 `commands.ownerAllowFrom` 中。
- 請使用私訊。在群組中，`/dashboard` 會回覆 `open this in a DM with the bot`，且不傳送按鈕。
- Docker 安裝：Serve/Funnel 模式要求閘道在 `tailscaled` 旁繫結至迴路介面，而使用已發布連接埠的橋接網路無法滿足此要求。請使用 `network_mode: host` 執行閘道容器，並將主機的 `tailscaled` 通訊端（`/var/run/tailscale`）以及 `tailscale` 命令列介面掛載至容器中。

迷你應用程式是僅限 Tailscale 的 v1 路徑，且不支援 Telegram Web iframe。

## 存取控制與啟用

### 群組機器人身分

在群組與論壇主題中，明確提及已設定的機器人帳號名稱（例如 `@my_bot`）即會呼叫所選的 OpenClaw 代理，即使代理角色名稱與 Telegram 使用者名稱不同也一樣。群組靜默政策仍會套用至不相關的訊息，但機器人帳號名稱本身絕不會被視為「其他人」。

<Tabs>
  <Tab title="私訊政策">
    `channels.telegram.dmPolicy` 控制直接訊息存取：

    - `pairing`（預設）
    - `allowlist`（要求 `allowFrom` 中至少有一個傳送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    搭配 `allowFrom: ["*"]` 的 `dmPolicy: "open"`，可讓任何找到或猜到機器人使用者名稱的 Telegram 帳號向機器人下達命令。僅應將它用於工具受到嚴格限制且刻意公開的機器人；單一擁有者的機器人應搭配數字使用者 ID 使用 `allowlist`。

    `channels.telegram.allowFrom` 接受數字 Telegram 使用者 ID。接受 `telegram:` / `tg:` 前綴，並會將其正規化。
    在多帳號設定中，限制性的頂層 `channels.telegram.allowFrom` 是安全邊界：除非合併後的有效允許清單仍包含明確的萬用字元，否則帳號層級的 `allowFrom: ["*"]` 不會讓該帳號變成公開帳號。
    `dmPolicy: "allowlist"` 搭配空白的 `allowFrom` 會封鎖所有私訊，並遭設定驗證拒絕。
    設定流程只會要求數字使用者 ID。如果你的設定含有舊版設定中的 `@username` 允許清單項目，請執行 `openclaw doctor --fix`，將它們解析為數字 ID（盡力而為；需要 Telegram 機器人權杖）。
    如果你先前依賴配對儲存區的允許清單檔案，`openclaw doctor --fix` 可以將項目復原至 `channels.telegram.allowFrom`，供允許清單流程使用（例如 `dmPolicy: "allowlist"` 尚未包含明確 ID 時）。

    對於單一擁有者的機器人，建議搭配明確的數字 `allowFrom` ID 使用 `dmPolicy: "allowlist"`，而不要依賴先前的配對核准。

    常見誤解：核准私訊配對並不代表「此傳送者在所有位置都已獲得授權」。配對只授予私訊存取權。如果尚無命令擁有者，第一個核准的配對也會設定 `commands.ownerAllowFrom`，讓僅限擁有者的命令與執行核准具有明確的操作者帳號。群組傳送者授權仍來自明確的設定允許清單。
    若要讓同一個身分同時獲得私訊與群組命令授權：請將你的數字 Telegram 使用者 ID 放入 `channels.telegram.allowFrom`；若要使用僅限擁有者的命令，請確認 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 尋找你的 Telegram 使用者 ID

    較安全的方式（不使用第三方機器人）：私訊你的機器人、執行 `openclaw logs --follow`，然後讀取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方式（隱私性較低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群組政策與允許清單">
    以下兩項控制會共同套用：

    1. **允許哪些群組**（`channels.telegram.groups`）
       - 沒有 `groups` 設定，`groupPolicy: "open"`：任何群組都會通過群組 ID 檢查
       - 沒有 `groups` 設定，`groupPolicy: "allowlist"`（預設）：所有群組都會遭封鎖，直到加入 `groups` 項目（或 `"*"`）
       - 已設定 `groups`：作為允許清單（明確 ID 或 `"*"`）

    2. **允許群組中的哪些傳送者**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（預設）/ `disabled`

    `groupAllowFrom` 會篩選群組傳送者；如果未設定，Telegram 會退回使用 `allowFrom`（不是配對儲存區；群組傳送者授權絕不會繼承私訊配對儲存區核准，這是自 `2026.2.25` 起的安全邊界）。
    `groupAllowFrom` 項目應為數字 Telegram 使用者 ID（`telegram:` / `tg:` 前綴會正規化）；非數字項目會遭忽略。請勿將群組或超級群組聊天 ID 放在這裡；負數聊天 ID 應放在 `channels.telegram.groups` 下。
    單一擁有者機器人的實用模式：在 `channels.telegram.allowFrom` 中設定你的使用者 ID、讓 `groupAllowFrom` 保持未設定，並在 `channels.telegram.groups` 下允許目標群組。
    如果設定中完全缺少 `channels.telegram`，除非明確設定 `channels.defaults.groupPolicy`，否則執行階段預設為失敗時關閉的 `groupPolicy="allowlist"`。

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

    在群組中使用 `@<bot_username> ping` 進行測試。當 `requireMention: true` 時，一般群組訊息不會觸發機器人。

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

      - 負數 Telegram 群組／超級群組聊天 ID（`-1001234567890`）應放在 `channels.telegram.groups` 下。
      - Telegram 使用者 ID（`8734062810`）應放在 `groupAllowFrom` 下，以限制允許群組中的哪些人可以觸發機器人。
      - 僅在要讓允許群組中的任何成員都能與機器人對話時，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行為">
    群組回覆預設要求提及。提及可以來自：

    - 原生 `@botusername` 提及，或
    - `agents.entries.*.groupChat.mentionPatterns` 或 `messages.groupChat.mentionPatterns` 中的提及模式

    工作階段層級切換（僅變更狀態，不會持久保存）：`/activation always`、`/activation mention`。若要持久保存，請使用設定：

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

    取得群組聊天 ID：將群組訊息轉寄給 `@userinfobot` / `@getidsbot`、從 `openclaw logs --follow` 讀取 `chat.id`、檢查 Bot API `getUpdates`，或在允許群組後執行 `/whoami@<bot_username>`。

  </Tab>
</Tabs>

## 執行階段行為

- Telegram 在閘道程序內執行。
- 路由是確定性的：Telegram 傳入的訊息會回覆至 Telegram（模型不會選擇頻道）。
- 傳入訊息會正規化為共用頻道封套，其中包含回覆中繼資料、媒體預留位置，以及閘道已觀察到之回覆的持久化回覆鏈內容。
- 群組工作階段依群組 ID 隔離。論壇主題會附加 `:topic:<threadId>`。
- 私訊訊息可帶有 `message_thread_id`；OpenClaw 會保留它以供回覆使用。只有當 Telegram `getMe` 為機器人回報 `has_topics_enabled: true` 時，私訊主題工作階段才會分割；否則私訊會維持使用扁平工作階段。
- 長輪詢使用 grammY runner，並依聊天／討論串排序。Runner 接收端並行度使用 `agents.defaults.maxConcurrent`。
- 多帳號啟動會限制同時執行的 `getMe` 探測數量，使大型機器人群組不會一次對所有帳號展開探測。
- 每個閘道程序都會保護長輪詢，確保同一時間只有一個作用中的輪詢器能使用機器人權杖。持續發生的 `getUpdates` 409 衝突，表示另一個 OpenClaw 閘道、指令碼或外部輪詢器正在使用相同權杖。
- 若 120 秒內沒有完成 `getUpdates` 活性檢查，輪詢監控程式會重新啟動。
- Telegram Bot API 不支援已讀回條（`sendReadReceipts` 不適用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。升級後，如果你的設定仍包含這些鍵，請執行 `openclaw doctor --fix`。私訊主題路由現在遵循 Telegram `getMe.has_topics_enabled`（由 BotFather 的討論串模式控制）：啟用主題的機器人在 Telegram 傳送 `message_thread_id` 時會使用討論串範圍的私訊工作階段；其他私訊則維持使用扁平工作階段。
</Note>

## 功能參考

<AccordionGroup>
  <Accordion title="即時串流預覽（訊息編輯）">
    OpenClaw 會在私聊、群組和主題中即時串流部分回覆：先傳送預覽訊息，接著重複執行 `editMessageText`，最後在原處完成訊息。

    - `channels.telegram.streaming` 為 `off | partial | block | progress`（預設：`partial`）
    - 簡短的初始回答預覽會進行防彈跳處理；若執行仍在進行中，會在有限延遲後實際建立
    - `progress` 會保留一份可編輯的工具進度狀態草稿；若回答活動早於工具進度出現，則顯示穩定的狀態標籤；完成時清除該草稿，並以一般訊息傳送最終回答
    - `streaming.preview.toolProgress` 控制工具／進度更新是否重複使用同一則經編輯的預覽訊息（預設：預覽串流啟用時為 `true`）
    - `streaming.preview.commandText` 控制這些行中的命令／執行詳細資料：`raw`（預設）或 `status`（僅顯示工具標籤）
    - `streaming.progress.commentary`（預設：`false`）可選擇在暫時的進度草稿中加入助理評論／前言文字
    - 系統會偵測舊版 `channels.telegram.streamMode`、布林值 `streaming`，以及已停用的原生草稿預覽鍵；請執行 `openclaw doctor --fix` 以遷移它們

    工具進度行是在工具執行期間顯示的簡短狀態更新（命令執行、檔案讀取、規劃更新、修補摘要，以及應用程式伺服器模式下的 Codex 前言／評論）。Telegram 預設會保留這些內容（與 `v2026.4.22`+ 起的已發布行為一致）。

    保留回答預覽編輯，但隱藏工具進度行：

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

    保持顯示工具進度，但隱藏命令／執行文字：

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

    `progress` 模式會顯示工具進度，但不會將最終回答編輯進該訊息。請將命令文字原則放在 `streaming.progress` 下：

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

    `streaming.mode: "off"` 會停用預覽編輯，並抑制一般工具／進度訊息，而不是將其作為獨立狀態訊息傳送；核准提示、媒體和錯誤仍會透過一般最終傳遞路徑處理。`streaming.preview.toolProgress: false` 僅保留回答預覽編輯。

    <Note>
      選取引文的回覆是例外。當 `replyToMode` 為 `first`、`all` 或 `batched`，且傳入訊息包含選取的引文文字時，OpenClaw 會透過 Telegram 的原生引文回覆路徑傳送最終回答，而不是編輯回答預覽，因此該次處理中的 `streaming.preview.toolProgress` 無法顯示狀態行。沒有選取引文文字的目前訊息回覆仍會串流。若工具進度的可見性比原生引文回覆更重要，請設定 `replyToMode: "off"`；或設定 `streaming.preview.toolProgress: false` 以接受此取捨。
    </Note>

    對於純文字回覆：簡短預覽會在原處進行最終編輯；分割成多則訊息的長篇最終回答會將預覽重複用作第一個區塊，然後只傳送剩餘部分；進度模式的最終回答會清除狀態草稿並使用一般最終傳遞；若在確認完成前最終編輯失敗，OpenClaw 會改用一般最終傳遞並清理過時的預覽。對於複雜回覆（媒體承載內容），OpenClaw 一律改用一般最終傳遞並清理預覽。

    預覽串流與區塊串流互斥——明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免重複串流。

    推理：`/reasoning stream` 會在生成期間將推理串流至即時預覽，然後在最終傳遞後刪除推理預覽（使用 `/reasoning on` 可使其保持可見）。傳送的最終回答不包含推理文字。

  </Accordion>

  <Accordion title="豐富訊息格式">
    傳出文字預設使用標準 Telegram HTML 訊息，目前各用戶端皆可閱讀：粗體、斜體、連結、程式碼、劇透、引文——不使用僅限 Bot API 10.2 的豐富區塊（原生表格、詳細資料、豐富媒體、公式）。

    選擇啟用 Bot API 10.2 豐富訊息：

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    啟用後：系統會告知代理程式此機器人／帳號可使用豐富訊息（並提供支援的 Markdown + HTML 島式撰寫合約）；Markdown 文字會透過 OpenClaw 的 Markdown IR 轉譯為具型別的 Bot API 10.2 豐富區塊（標題、表格、詳細資料、檢查清單、豐富媒體、公式、地圖、拼貼）；媒體說明仍使用 Telegram HTML 說明（豐富訊息不會取代說明，且說明上限為 1024 個字元）。

    這可避免模型文字被 Telegram 的豐富 Markdown 符號解析，因此 `$400-600K` 之類的貨幣不會被解析為數學式。較長的豐富文字會依 Telegram 的限制自動分割。超過 20 欄限制的表格會改用程式碼區塊。

    預設：關閉，以確保用戶端相容性——目前部分 Desktop、Web、Android 和第三方用戶端會將已接受的豐富訊息顯示為不受支援。除非所有使用該機器人的用戶端皆可呈現豐富訊息，否則請保持關閉。`/status` 會顯示目前工作階段的豐富訊息是開啟還是關閉。

    連結預覽預設為開啟。`channels.telegram.linkPreview: false` 會停用豐富文字的自動實體偵測。

  </Accordion>

  <Accordion title="原生命令與自訂命令">
    Telegram 的命令選單會在啟動時使用 `setMyCommands` 註冊。`commands.native: "auto"` 會啟用 Telegram 的原生命令。

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

    規則：名稱會正規化（移除開頭的 `/`、轉為小寫）；有效模式為 `a-z`、`0-9`、`_`，長度為 1-32；自訂命令無法覆寫原生命令；衝突／重複項目會略過並記錄。

    自訂命令只是選單項目——不會自動實作行為。即使外掛／技能命令未顯示在 Telegram 選單中，手動輸入時仍可運作。若停用原生命令，內建命令會被移除；如有設定，自訂／外掛命令仍可註冊。

    常見設定失敗：

    - 修剪後重試仍出現 `setMyCommands failed` 和 `BOT_COMMANDS_TOO_MUCH`，表示選單仍然超出限制；請減少外掛／技能／自訂命令，或停用 `channels.telegram.commands.native`。
    - 當直接使用 Bot API curl 命令可正常運作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 因 `404: Not Found` 而失敗，通常表示 `channels.telegram.apiRoot` 被設為完整的 `/bot<TOKEN>` 端點。`apiRoot` 必須僅為 Bot API 根路徑；`openclaw doctor --fix` 會移除意外加上的尾端 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒絕了設定的機器人權杖。請使用目前的 BotFather 權杖更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`（預設帳號）；OpenClaw 會在輪詢前停止，因此不會將此問題回報為網路鉤子清理失敗。
    - `setMyCommands failed` 伴隨網路／擷取錯誤，通常表示對 `api.telegram.org` 的傳出 DNS／HTTPS 連線遭到封鎖。

    ### 裝置配對命令（`device-pair` 外掛）

    安裝後：

    1. `/pair` 會產生設定碼
    2. 將代碼貼到 iOS 應用程式中
    3. `/pair pending` 會列出待處理的請求（包括角色／範圍）
    4. 核准：`/pair approve <requestId>`、`/pair approve`（僅有一個待處理請求時），或 `/pair approve latest`

    如果裝置使用變更過的驗證詳細資料（角色、範圍、公鑰）重試，先前待處理的請求會由新的 `requestId` 取代；核准前請重新執行 `/pair pending`。

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

    各帳號覆寫設定：

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

    `web_app` 按鈕僅適用於使用者與機器人之間的私聊。

    未由已註冊外掛的互動處理常式宣告處理的回呼點擊，會以文字形式傳給代理程式：`callback_data: <value>`。

  </Accordion>

  <Accordion title="供代理程式與自動化使用的 Telegram 訊息動作">
    動作：

    - `sendMessage`（`to`、`content`、選用的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、選用的 `presentation` 行內按鈕；僅編輯按鈕會更新回覆標記）
    - `createForumTopic`（`chatId`、`name`、選用的 `iconColor`、`iconCustomEmojiId`）

    易用的別名：`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    啟用條件：`channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（預設：停用）。`edit`、`createForumTopic` 和 `editForumTopic` 預設啟用，沒有專用開關。
    執行階段傳送會使用啟動／重新載入時的有效設定／密鑰快照，因此動作路徑不會在每次傳送時重新解析 `SecretRef` 值。

    移除反應的語意：[/tools/reactions](/zh-TW/tools/reactions)。

  </Accordion>

  <Accordion title="回覆討論串標籤">
    產生輸出中的明確回覆討論串標籤：

    - `[[reply_to_current]]` — 回覆觸發訊息
    - `[[reply_to:<id>]]` — 回覆特定訊息 ID

    `channels.telegram.replyToMode`：`off`（預設）、`first`、`all`。

    啟用回覆討論串且原始文字／說明文字可用時，OpenClaw 會自動加入原生引用摘錄。Telegram 將原生引用文字限制為 1024 個 UTF-16 程式碼單位；較長的訊息會從開頭開始引用，若 Telegram 拒絕該引用，則退回一般回覆。

    `off` 只會停用隱含的回覆討論串；明確的 `[[reply_to_*]]` 標籤仍會生效。

  </Accordion>

  <Accordion title="論壇主題與討論串行為">
    論壇超級群組：主題工作階段鍵會附加 `:topic:<threadId>`；回覆和輸入狀態以主題討論串為目標；主題設定路徑為 `channels.telegram.groups.<chatId>.topics.<threadId>`。

    一般主題（`threadId=1`）是特殊情況：傳送訊息時省略 `message_thread_id`（Telegram 會以「找不到討論串」拒絕 `sendMessage(...thread_id=1)`），但輸入動作仍會包含 `message_thread_id`（實測顯示，這是讓輸入指示器出現的必要條件）。

    除非覆寫，否則主題項目會繼承群組設定（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。`agentId` 僅適用於主題，不會繼承群組預設值。`topics."*"` 會為該群組中的每個主題設定預設值；確切的主題 ID 仍優先於 `"*"`。

    **個別主題代理路由**：每個主題都可以透過主題設定中的 `agentId` 路由至不同的代理，使其擁有自己的工作區、記憶和工作階段：

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

    接著每個主題都有自己的工作階段鍵，例如 `agent:zu:telegram:group:-1001234567890:topic:3`。

    **持久 ACP 主題繫結**：論壇主題可以透過頂層型別化繫結固定 ACP 控制框架工作階段（`bindings[]` 搭配 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及如 `-1001234567890:topic:42` 的主題限定 ID）。目前範圍限於群組／超級群組中的論壇主題。請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

    **從聊天產生與討論串繫結的 ACP**：`/acp spawn <agent> --thread here|auto` 會將目前主題繫結至新的 ACP 工作階段；後續訊息會直接路由至該工作階段，且 OpenClaw 會在主題中釘選產生確認訊息。由 `session.threadBindings.spawnSessions` 控制（預設：`true`）。

    範本內容會公開 `MessageThreadId` 和 `IsForum`。含有 `message_thread_id` 的私訊聊天會保留回覆中繼資料，但只有在 Telegram `getMe` 回報 `has_topics_enabled: true` 時，才會使用可感知討論串的工作階段鍵。
    已淘汰的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆寫已移除；BotFather 的討論串模式是唯一真實來源。執行 `openclaw doctor --fix` 以移除過時的設定鍵。

  </Accordion>

  <Accordion title="音訊、影片與貼圖">
    ### 音訊訊息

    Telegram 會區分語音留言與音訊檔案。預設：音訊檔案行為；在代理回覆中加入 `[[audio_as_voice]]` 標籤可強制以語音留言傳送。傳入的語音留言轉錄內容在代理內容中會標示為由機器產生且不受信任的文字，但提及偵測仍會使用原始轉錄內容，因此受提及條件限制的語音訊息仍可正常運作。

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

    Telegram 會區分影片檔案與視訊留言。視訊留言不支援說明文字；提供的訊息文字會分開傳送。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### 地點與場所

    使用現有的 `send` 動作，並搭配一個獨立的 `location` 物件。座標會傳送原生圖釘；同時加入 `name` 和 `address` 會傳送原生場所卡片。傳送地點時無法與訊息文字或媒體合併。

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

    傳入：會下載並處理靜態 WEBP（預留位置 `<media:sticker>`）；會略過動畫 TGS 和影片 WEBM。

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

    搜尋快取的貼圖：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "揮手的貓",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="反應通知">
    Telegram 反應會以 `message_reaction` 更新的形式送達，與訊息承載資料分開。啟用後，OpenClaw 會將 `Telegram reaction added: 👍 by Alice (@alice) on msg 42` 之類的系統事件加入佇列。

    - `channels.telegram.reactionNotifications`：`off | own | all`（預設：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（預設：`minimal`）

    `own` 表示僅限使用者對機器人所傳訊息的反應（透過已傳送訊息快取盡力而為）。反應事件仍會遵循 Telegram 存取控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授權的傳送者會被捨棄。

    Telegram 不會在反應更新中提供討論串 ID：非論壇群組會路由至群組聊天工作階段；論壇群組會路由至一般主題工作階段（`:topic:1`），而非確切的原始主題。

    用於輪詢／網路鉤子的 `allowed_updates` 會自動包含 `message_reaction`。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。`messages.ackReactionScope` 決定傳送的*時機*。

    **表情符號解析順序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號備援（`agents.entries.*.identity.emoji`，否則為 "👀"）

    Telegram 預期使用 Unicode 表情符號（例如 "👀"）；使用 `""` 可停用某個頻道或帳號的反應。

    **範圍（`messages.ackReactionScope`，預設為 `"group-mentions"`；目前沒有 Telegram 帳號或 Telegram 頻道層級的覆寫）：**

    `all`（私訊 + 群組，包括環境聊天室事件）、`direct`（僅私訊）、`group-all`（除環境聊天室事件以外的每則群組訊息，不含私訊）、`group-mentions`（在群組中提及機器人時；**不含私訊** — 預設）、`off` / `none`（停用）。

    <Note>
    預設範圍（`group-mentions`）不會在私訊或環境聊天室事件中觸發確認反應。私訊請使用 `direct` 或 `all`；只有 `all` 會確認環境聊天室事件。此值會在 Telegram 提供者啟動時讀取，因此必須重新啟動閘道，變更才會生效。
    </Note>

  </Accordion>

  <Accordion title="來自 Telegram 事件與命令的設定寫入">
    頻道設定寫入預設為啟用（`configWrites !== false`）。由 Telegram 觸發的寫入包括群組遷移事件（`migrate_to_chat_id`，更新 `channels.telegram.groups`）以及 `/config set` / `/config unset`（需要啟用命令）。

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
    預設使用長輪詢。若要使用網路鉤子模式，請設定 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；選用的 `webhookPath`（預設 `/telegram-webhook`）、`webhookHost`（預設 `127.0.0.1`）、`webhookPort`（預設 `8787`）、`webhookCertPath`（用於直接 IP 或無網域設定的自我簽署憑證 PEM）。

    在長輪詢模式中，OpenClaw 只會在成功分派更新後保存其重新啟動水位標記；處理常式失敗時，該更新仍可在同一處理程序中重試，而不會標記為已完成。

    本機監聽器預設繫結至 `127.0.0.1:8787`。若要接受公開流量，請在本機連接埠前方放置反向代理伺服器，或有意地設定 `webhookHost: "0.0.0.0"`。

    網路鉤子模式會驗證要求防護、Telegram 密鑰權杖和 JSON 主體，接著先將更新提交至其耐久輸入佇列，再傳回空白的 `200`。成功的耐久接管會包含 `x-openclaw-delivery-accepted: durable`；健康狀態、路由、驗證、確認和儲存錯誤回應則省略此標頭。反向代理伺服器和主機控制器可要求此標頭，以區分 OpenClaw 接管與一般的空白 `200`，而不必從回應時間推斷是否接受。

    耐久寫入完成後，OpenClaw 會透過核心頻道輸入排放機制認領並處理更新（依聊天／主題劃分通道、在回合接管時完成、接管前停滯逾時）。緩慢的代理回合不會占用 Telegram 的傳遞 ACK。

  </Accordion>

  <Accordion title="限制與命令列介面目標">
    - `channels.telegram.textChunkLimit` 預設為 4000；`streaming.chunkMode="newline"` 會優先依段落邊界（空白行）分割，再依長度分割。
    - `channels.telegram.mediaMaxMb`（預設為 100）限制輸入與輸出媒體的大小。
    - 群組情境歷史記錄使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（預設為 50）；`0` 會停用此功能。
    - 當閘道已觀察到父訊息時，回覆／引用／轉寄的補充情境會正規化為一個選定的對話情境視窗；已觀察訊息的快取位於 OpenClaw SQLite 外掛狀態中，而 `openclaw doctor --fix` 會匯入舊版側載檔案。Telegram 每次更新只包含一個淺層 `reply_to_message`，因此早於快取的訊息鏈僅限於該承載內容。
    - Telegram 允許清單主要用於限制誰可以觸發代理程式，而不是完整的補充情境遮蔽邊界。
    - 私訊歷史記錄：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。

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

    僅限 Telegram 的投票旗標：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（或 `:topic:` 目標）。`--poll-option` 會重複 2-12 次（Telegram 的選項上限）。

    Telegram 傳送也支援搭配 `buttons` 區塊使用 `--presentation` 來建立行內鍵盤（當 `channels.telegram.capabilities.inlineButtons` 允許時）、使用 `--pin` 或 `--delivery '{"pin":true}'` 在機器人可於該聊天中釘選訊息時要求釘選傳送，以及使用 `--force-document` 將輸出圖片、GIF 和影片以文件形式傳送，而不是採用壓縮／動畫／影片上傳。

    動作控管：`channels.telegram.actions.sendMessage=false` 會停用所有輸出訊息，包括投票；`channels.telegram.actions.poll=false` 會停用建立投票，但仍允許一般傳送。

  </Accordion>

  <Accordion title="Telegram 中的執行核准">
    Telegram 支援在核准者私訊中進行執行核准，也可選擇在原始聊天或主題中發布提示。核准者必須是數字 Telegram 使用者 ID。

    - `channels.telegram.execApprovals.enabled`（當至少可解析一位核准者時，`"auto"` 會啟用）
    - `channels.telegram.execApprovals.approvers`（會回退至 `commands.ownerAllowFrom` 中的數字擁有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（預設）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制誰可以與機器人交談，以及機器人將一般回覆傳送至何處——它們不會讓某人成為執行核准者。若尚無命令擁有者，第一個已核准的私訊配對會初始化 `commands.ownerAllowFrom`，因此單一擁有者設定無須在 `execApprovals.approvers` 下重複 ID 即可運作。

    頻道傳送會在聊天中顯示命令文字；僅在受信任的群組／主題中啟用 `channel` 或 `both`。當提示出現在論壇主題中時，OpenClaw 會為核准提示與後續訊息保留該主題。執行核准預設於 30 分鐘後到期。

    行內核准按鈕也需要 `channels.telegram.capabilities.inlineButtons` 允許目標介面（`dm`、`group` 或 `all`）。以 `plugin:` 為前綴的核准 ID 會透過外掛核准解析；其他 ID 則會先透過執行核准解析。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 錯誤回覆控制

當代理程式遇到傳送或供應商錯誤時，錯誤政策會控制錯誤訊息是否傳送至 Telegram 聊天：

| 鍵                              | 值                         | 預設值   | 說明                                                                                                                                                                       |
| ------------------------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy` | `always`、`once`、`silent` | `always` | `always` 會將每則錯誤訊息傳送至聊天。`once` 會在內建冷卻時間範圍內，將每則不重複的錯誤訊息傳送一次。`silent` 絕不會將錯誤訊息傳送至聊天。 |

支援每個帳號、每個群組和每個主題的覆寫設定（繼承方式與其他 Telegram 設定鍵相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 隱藏此群組中的錯誤
        },
      },
    },
  },
}
```

## 疑難排解

<AccordionGroup>
  <Accordion title="機器人不回應群組中未提及它的訊息">

    - 若為 `requireMention=false`，Telegram 隱私模式必須允許完整可見性：BotFather `/setprivacy` -> Disable，然後將機器人從群組移除並重新加入。
    - 當設定預期接收群組中未提及機器人的訊息時，`openclaw channels status` 會發出警告。
    - `openclaw channels status --probe` 會檢查明確的數字群組 ID；萬用字元 `"*"` 無法探測成員資格。
    - 快速工作階段測試：`/activation always`。

  </Accordion>

  <Accordion title="機器人完全看不到群組訊息">

    - 當 `channels.telegram.groups` 存在時，群組必須列於其中（或包含 `"*"`）。
    - 確認機器人是群組成員。
    - 檢閱 `openclaw logs --follow` 以瞭解略過原因。

  </Accordion>

  <Accordion title="命令僅部分運作或完全無法運作">

    - 授權你的傳送者身分（配對及／或數字 `allowFrom`）；即使群組政策為 `open`，命令授權仍然適用。
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生選單的項目過多；請減少外掛／skill／自訂命令，或停用原生選單。
    - `deleteMyCommands`／`setMyCommands` 啟動呼叫和 `sendChatAction` 輸入狀態呼叫都有界限，並且在請求逾時時會透過 Telegram 的傳輸回退機制重試一次。持續發生的網路／擷取錯誤通常表示無法透過 DNS/HTTPS 連線至 `api.telegram.org`。

  </Accordion>

  <Accordion title="啟動時回報未授權權杖">

    - `getMe returned 401` 是已設定機器人權杖的 Telegram 驗證失敗。請在 BotFather 中重新複製或產生權杖，然後更新 `channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`（預設帳號）。
    - 啟動期間發生 `deleteWebhook 401 Unauthorized` 也屬於驗證失敗；若將其視為「不存在網路鉤子」，只會將相同的錯誤權杖失敗延後至後續 API 呼叫。

  </Accordion>

  <Accordion title="輪詢或網路不穩定">

    - 若 `AbortSignal` 類型不相符，Node 22+ 搭配自訂 fetch／Proxy 可能會觸發立即中止行為。
    - 有些主機會優先將 `api.telegram.org` 解析為 IPv6；損壞的 IPv6 輸出連線會造成間歇性 API 失敗。
    - 含有 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!` 的記錄會視為可復原的網路錯誤並重試。
    - 在輪詢啟動期間，OpenClaw 會將成功的啟動 `getMe` 探測結果重複用於 grammY，因此執行器在第一次 `getUpdates` 前不需要第二次 `getMe`。
    - 若 `deleteWebhook` 在輪詢啟動期間因暫時性網路錯誤而失敗，OpenClaw 會繼續進入長輪詢，而不是再次進行輪詢前的控制平面呼叫。仍在作用中的網路鉤子隨後會顯示為 `getUpdates` 衝突；OpenClaw 會重建傳輸並重試清理網路鉤子。
    - 記錄中的 `Polling stall detected` 表示在預設 120 秒內未完成長輪詢活性檢查後，OpenClaw 會重新啟動輪詢並重建傳輸。
    - 當執行中的輪詢帳號在啟動寬限期後尚未完成 `getUpdates`、執行中的網路鉤子帳號在啟動寬限期後尚未完成 `setWebhook`，或上次成功的輪詢傳輸活動已過期時，`openclaw channels status --probe` 和 `openclaw doctor` 會發出警告。
    - Telegram 的 Bot API 傳輸會遵循程序 Proxy 環境變數：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小寫變體。`NO_PROXY`／`no_proxy` 仍可略過 `api.telegram.org`。
    - 若服務環境已設定 `OPENCLAW_PROXY_URL`，且不存在標準 Proxy 環境變數，Telegram 也會將該 URL 用於 Bot API 傳輸。
    - 在直接輸出連線／TLS 不穩定的 VPS 主機上，請透過 Proxy 路由 Telegram API 呼叫：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 預設使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 結果順序會依序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再使用程序預設值（例如 `NODE_OPTIONS=--dns-result-order=ipv4first`）；若皆不適用，在 Node 22+ 上會回退至 `ipv4first`。
    - 在 WSL2 上，或僅使用 IPv4 的行為效果較佳時，請強制選取位址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Telegram 媒體下載預設已允許 RFC 2544 基準測試範圍的回應（`198.18.0.0/15`）。若受信任的假 IP 或透明 Proxy 在媒體下載期間，將 `api.telegram.org` 改寫為其他私有／內部／特殊用途位址，請選擇啟用僅限 Telegram 的略過機制：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 每個帳號也可透過 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 啟用相同設定。
    - 若你的 Proxy 將 Telegram 媒體主機解析為 `198.18.x.x`，請先維持危險旗標關閉——該範圍預設已允許。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 會削弱 Telegram 媒體的 SSRF 防護。僅可用於受信任且由操作人員控制的 Proxy 環境（Clash、Mihomo、Surge 假 IP 路由），這些環境會合成 RFC 2544 基準測試範圍以外的私有或特殊用途回應。一般公用網際網路的 Telegram 存取應維持關閉。
    </Warning>

    - 暫時性環境覆寫：`OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - 驗證 DNS 回應：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多協助：[頻道疑難排解](/zh-TW/channels/troubleshooting)。

## 設定參考

主要參考資料：[設定參考 - Telegram](/zh-TW/gateway/config-channels#telegram)。

<Accordion title="重要的 Telegram 欄位">

- 啟動/驗證：`enabled`、`botToken`、`tokenFile`（必須是一般檔案；符號連結會被拒絕）、`accounts.*`
- 存取控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、頂層 `bindings[]`（`type: "acp"`）
- 主題預設值：`groups.<chatId>.topics."*"` 適用於未比對的論壇主題；確切的主題 ID 會覆寫此設定
- 執行核准：`execApprovals`、`accounts.*.execApprovals`
- 命令/選單：`commands.native`、`commands.nativeSkills`、`customCommands`
- 討論串/回覆：`replyToMode`、`threadBindings`
- 串流：`streaming`（模式 `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 格式/傳送：`textChunkLimit`、`streaming.chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- 媒體/網路：`mediaMaxMb`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自訂 API 根目錄：`apiRoot`（僅限 Bot API 根目錄；請勿包含 `/bot<TOKEN>`）、`trustedLocalFileRoots`（自行託管的 Bot API 絕對 `file_path` 根目錄）
- 網路鉤子：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- 動作/功能：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- 表情回應：`reactionNotifications`、`reactionLevel`
- 錯誤：`errorPolicy`、`silentErrorReplies`
- 寫入/歷史記錄：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多帳號優先順序：設定兩個以上的帳號 ID 時，請設定 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`），以明確指定預設路由。否則，OpenClaw 會回退至第一個正規化的帳號 ID，且 `openclaw doctor` 會發出警告。具名帳號會繼承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不會繼承 `accounts.default.*` 的值。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Telegram 使用者與閘道配對。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組與主題允許清單的行為。
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
