---
read_when:
    - 開發 Discord 頻道功能
summary: Discord 機器人設定、設定鍵、元件、語音與疑難排解
title: Discord
x-i18n:
    generated_at: "2026-07-12T14:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw 透過官方 Discord 閘道以機器人身分連線至 Discord。支援私訊與伺服器頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord 私訊預設使用配對模式。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為與指令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

建立含有機器人的 Discord 應用程式，將機器人加入你的伺服器，並與 OpenClaw 配對。可以的話，請使用私人伺服器；如有需要，請先[建立伺服器](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    在 [Discord Developer Portal](https://discord.com/developers/applications) 中，按一下 **New Application** 並為其命名（例如 “OpenClaw”）。

    開啟側邊欄中的 **Bot**，並將 **Username** 設為你的代理程式名稱。

  </Step>

  <Step title="啟用特殊權限意圖">
    仍在 **Bot** 頁面中，於 **Privileged Gateway Intents** 下啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單、名稱對應 ID，以及頻道受眾存取群組需要此項）
    - **Presence Intent**（選用；僅用於上線狀態更新）

  </Step>

  <Step title="複製你的機器人權杖">
    在 **Bot** 頁面中，按一下 **Reset Token** 並複製權杖。

    <Note>
    儘管名稱如此，這會產生你的第一個權杖，並沒有任何項目遭到“重設”。
    </Note>

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    開啟側邊欄中的 **OAuth2**。在 **OAuth2 URL Generator** 中啟用下列範圍：

    - `bot`
    - `applications.commands`

    在隨即出現的 **Bot Permissions** 區段中，至少啟用：

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（選用）

    這是一般文字頻道的基本設定。如果機器人會在討論串中發文，包括建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。

    複製產生的 URL，在瀏覽器中開啟、選取你的伺服器，然後按一下 **Continue**。機器人現在應會出現在你的伺服器中。

  </Step>

  <Step title="啟用開發者模式並取得你的 ID">
    在 Discord 應用程式中啟用開發者模式，以便複製 ID：

    1. **User Settings**（齒輪圖示）→ **Developer** → 開啟 **Developer Mode**
       *（行動裝置上：**App Settings** → **Advanced**）*
    2. 在你的**伺服器圖示**上按一下滑鼠右鍵 → **Copy Server ID**
    3. 在你**自己的頭像**上按一下滑鼠右鍵 → **Copy User ID**

    請將伺服器 ID、使用者 ID 與機器人權杖一起保存；下一步需要這三項資訊。

  </Step>

  <Step title="允許接收伺服器成員的私訊">
    若要進行配對，Discord 必須允許機器人傳送私訊給你。在你的**伺服器圖示**上按一下滑鼠右鍵 → **Privacy Settings** → 開啟 **Direct Messages**。

    如果你會透過 Discord 私訊使用 OpenClaw，請保持啟用。如果你只使用伺服器頻道，配對後即可停用。

  </Step>

  <Step title="安全地設定機器人權杖（請勿在聊天中傳送）">
    機器人權杖是機密資訊。在傳訊息給代理程式之前，請先在執行 OpenClaw 的機器上設定：

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    如果 OpenClaw 已作為背景服務執行，請透過 OpenClaw Mac 應用程式重新啟動，或停止並重新啟動 `openclaw gateway run` 處理程序。
    對於受管理的服務安裝，請從已設定 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env` 中，讓服務在重新啟動後能解析環境變數 SecretRef。
    如果你的主機在啟動時查詢 Discord 應用程式受到封鎖或速率限制，請設定 Developer Portal 中的應用程式／用戶端 ID，讓啟動程序略過該 REST 呼叫：預設帳號使用 `channels.discord.applicationId`，每個機器人則使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的代理程式">
        在現有頻道（例如 Telegram）與你的 OpenClaw 代理程式聊天，並將資訊告訴它。如果 Discord 是你的第一個頻道，請改用命令列介面／設定分頁。

        > “我已在設定中設定 Discord 機器人權杖。請使用使用者 ID `<user_id>` 和伺服器 ID `<server_id>` 完成 Discord 設定。”
      </Tab>
      <Tab title="命令列介面／設定">
        檔案式設定：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        預設帳號的環境變數備援：

```bash
DISCORD_BOT_TOKEN=...
```

        若要使用指令碼或遠端設定，請透過 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後移除 `--dry-run` 再次執行。也可使用純文字 `token` 字串，而 `channels.discord.token` 亦支援 env/file/exec 提供者的 SecretRef 值。請參閱[機密資訊管理](/zh-TW/gateway/secrets)。

        若有多個 Discord 機器人，請將各機器人的權杖與應用程式 ID 保存在其帳號下。頂層的 `channels.discord.applicationId` 會由各帳號繼承，因此只有在所有帳號使用相同應用程式 ID 時，才應在該處設定。

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="核准第一次私訊配對">
    閘道開始執行後，在 Discord 中私訊你的機器人。它會回覆配對碼。

    <Tabs>
      <Tab title="詢問你的代理程式">
        在現有頻道中將配對碼傳送給你的代理程式：

        > “核准此 Discord 配對碼：`<CODE>`”
      </Tab>
      <Tab title="命令列介面">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後到期。核准後，即可透過 Discord 私訊與你的代理程式聊天。

  </Step>
</Steps>

<Note>
權杖解析會區分帳號。設定中的權杖值優先於環境變數備援，而 `DISCORD_BOT_TOKEN` 僅用於預設帳號。
如果兩個已啟用的 Discord 帳號解析為相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監視器：來自設定的權杖優先於環境變數備援；否則由第一個已啟用的帳號優先，重複帳號則會回報為已停用，原因是 `duplicate bot token`。
對於進階對外呼叫（訊息工具／頻道動作），每次呼叫明確指定的 `token` 會用於該次呼叫。這適用於傳送及讀取／探查類動作（讀取／搜尋／擷取／討論串／釘選／權限）。帳號原則／重試設定仍取自作用中執行階段快照內所選的帳號。
</Note>

## 建議：設定伺服器工作區

私訊可正常運作後，你可以將伺服器轉換為完整工作區，讓每個頻道都有自己的代理程式工作階段與獨立情境。建議用於只有你和機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入伺服器允許清單">
    如此一來，你的代理程式便能在伺服器上的任何頻道中回應，而不僅限於私訊。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > “將我的 Discord 伺服器 ID `<server_id>` 加入伺服器允許清單”
      </Tab>
      <Tab title="設定">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="允許不使用 @提及即可回應">
    根據預設，代理程式只會在伺服器頻道中被 @提及時回應。在私人伺服器上，你可能會希望它回應每則訊息。

    在伺服器頻道中，一般回覆預設會自動發布。對於共用且持續啟用的聊天室，可選擇設定 `messages.groupChat.visibleReplies: "message_tool"`，讓代理程式能靜默觀察，並只在判斷頻道回覆有用時才發布。這最適合 GPT-5.6 Sol 等最新一代、能可靠使用工具的模型。除非工具傳送內容，否則環境聊天室事件會保持靜默。完整的靜默觀察模式設定請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入，且記錄顯示使用了權杖，但沒有發布訊息，請檢查該輪次是否設定為環境聊天室事件，或是否已選擇使用訊息工具的可見回覆。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > “允許我的代理程式在此伺服器上回應，而不必被 @提及”
      </Tab>
      <Tab title="設定">
        在你的伺服器設定中設定 `requireMention: false`：

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        若要要求可見的群組／頻道回覆透過訊息工具傳送，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃伺服器頻道中的記憶使用方式">
    長期記憶（MEMORY.md）只會在私訊工作階段中自動載入；伺服器頻道不會載入。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > “當我在 Discord 頻道中提問時，如果需要 MEMORY.md 的長期情境，請使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手動">
        若要在每個頻道中使用共用情境，請將穩定的指示放入 `AGENTS.md` 或 `USER.md`（會注入每個工作階段）。將長期筆記保存在 `MEMORY.md` 中，並視需要使用記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在建立頻道並開始聊天。代理程式會看到頻道名稱，而且每個頻道都是隔離的工作階段；你可以設定 `#coding`、`#home`、`#research`，或任何適合你工作流程的頻道。

## 執行階段模型

- 閘道負責管理 Discord 連線。
- 回覆路由是確定性的：來自 Discord 的訊息會回覆至 Discord。
- Discord 伺服器／頻道中繼資料會以不受信任的情境加入模型提示，而不會作為使用者可見的回覆前綴。如果模型將該封裝複製回覆，OpenClaw 會從對外回覆與後續重播情境中移除複製的中繼資料。
- 根據預設（`session.dmScope=main`），直接聊天會共用代理程式的主要工作階段（`agent:main:main`）。
- 伺服器頻道使用隔離的工作階段索引鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組私訊預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線指令會在隔離的指令工作階段（`agent:<agentId>:discord:slash:<userId>`）中執行，同時仍會將 `CommandTargetSessionKey` 傳遞至路由後的對話工作階段。
- 傳送至 Discord 的純文字排程／心跳偵測公告會合併為代理程式最終可見的回答，且只傳送一次。當代理程式產生多個可傳送承載內容時，媒體與結構化元件承載內容仍會以多則訊息傳送。

## 論壇頻道

Discord 論壇與媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父頻道（`channel:<forumId>`）即可自動建立討論串。討論串標題為訊息中第一個非空白行（截斷至 Discord 的 100 字元討論串名稱上限）。
- 使用 `openclaw message thread create` 可直接建立討論串。論壇頻道請勿傳入 `--message-id`。

傳送到論壇父頻道以建立討論串：

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "主題標題\n貼文內文"
```

明確建立論壇討論串：

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "主題標題" --message "貼文內文"
```

論壇父頻道不接受 Discord 元件。如果需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援在代理程式訊息中使用 Discord components v2 容器。使用訊息工具並提供 `components` 承載資料。互動結果會如一般傳入訊息般路由回代理程式，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多可包含 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

元件預設只能使用一次。設定 `components.reusable=true`，即可讓按鈕、選取項目及表單在到期前重複使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。不相符的使用者會收到暫時性拒絕訊息。

元件回呼預設於 30 分鐘後到期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設帳號的回呼登錄存續時間，或針對各帳號設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。此值以毫秒為單位，必須是正整數，且上限為 `86400000`（24 小時）。較長的 TTL 適合需要讓按鈕持續可用的審查／核准工作流程，但也會延長舊 Discord 訊息仍能觸發動作的時間範圍。請優先使用符合需求的最短 TTL；若過時回呼會造成意外行為，請保留預設值。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含供應商、模型及相容執行環境的下拉式選單，以及提交步驟。`/models add` 已淘汰，會回傳淘汰訊息，而不會從聊天中註冊模型。選擇器回覆為暫時性訊息，且僅限發起命令的使用者操作。Discord 選取選單最多只能有 25 個選項，因此若希望選擇器僅針對 `openai` 或 `vllm` 等指定供應商顯示動態探索到的模型，請將 `provider/*` 項目新增至 `agents.defaults.models`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`／`path`／`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應與附件參照相符時，使用 `filename` 覆寫上傳名稱

互動視窗表單：

- 新增 `components.modal`，最多可包含 5 個欄位
- 欄位類型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 會自動新增觸發按鈕

範例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "選用的備援文字",
  components: {
    reusable: true,
    text: "選擇路徑",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "核准",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "拒絕", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "選擇一個選項",
          options: [
            { label: "選項 A", value: "a" },
            { label: "選項 B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "詳細資料",
      triggerLabel: "開啟表單",
      fields: [
        { type: "text", label: "申請者" },
        {
          type: "select",
          label: "優先順序",
          options: [
            { label: "低", value: "low" },
            { label: "高", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## 存取控制與路由

<Tabs>
  <Tab title="私訊政策">
    `channels.discord.dmPolicy` 控制私訊存取。`channels.discord.allowFrom` 是標準的私訊允許清單。

    - `pairing`（預設）
    - `allowlist`（至少需要一個 `allowFrom` 傳送者）
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    若私訊政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式下收到配對提示）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 僅套用於 `default` 帳號。
    - 對於單一帳號，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 具名帳號若未設定自己的 `allowFrom` 和舊版 `dm.allowFrom`，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    為了相容性，系統仍會讀取舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom`。若可在不變更存取權限的情況下進行遷移，`openclaw doctor --fix` 會將它們遷移至 `dmPolicy` 和 `allowFrom`。

    傳遞時的私訊目標格式：

    - `user:<id>`
    - `<@id>` 提及

    啟用頻道預設值時，純數字 ID 通常會解析為頻道 ID；但為了相容性，帳號有效私訊 `allowFrom` 中列出的 ID 會視為使用者私訊目標。

  </Tab>

  <Tab title="存取群組">
    Discord 私訊和文字命令授權可以使用 `channels.discord.allowFrom` 中的動態 `accessGroup:<name>` 項目。

    存取群組名稱會在各訊息頻道間共用。若靜態群組的成員以各頻道的一般 `allowFrom` 語法表示，請使用 `type: "message.senders"`；若要由 Discord 頻道目前的 `ViewChannel` 對象動態定義成員資格，請使用 `type: "discord.channelAudience"`。共用存取群組行為：[存取群組](/zh-TW/channels/access-groups)。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 將成員資格模型化為：套用角色與頻道覆寫後，私訊傳送者是已設定伺服器的成員，且目前對已設定頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何能看到 `#maintainers` 的人私訊機器人，同時對其他所有人關閉私訊。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    你可以混用動態與靜態項目：

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    查詢採取失敗即拒絕的方式。如果 Discord 回傳 `Missing Access`、成員查詢失敗，或頻道屬於不同的伺服器，該私訊傳送者會被視為未授權。

    使用頻道對象存取群組時，請在 Discord Developer Portal 啟用 **Server Members Intent**。私訊不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析該成員。

  </Tab>

  <Tab title="伺服器政策">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準為 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（優先使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅限角色 ID）；若任一項已設定，傳送者符合 `users` 或 `roles` 即獲允許
    - 預設停用直接名稱／標籤比對；僅應將 `channels.discord.dangerouslyAllowNameMatching: true` 作為緊急相容模式啟用
    - `users` 支援名稱／標籤，但 ID 較安全；使用名稱／標籤項目時，`openclaw security audit` 會發出警告
    - 若伺服器已設定 `channels`，未列出的頻道會遭拒絕
    - 若伺服器沒有 `channels` 區塊，該允許清單伺服器中的所有頻道都會獲允許

    範例：

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `openclaw doctor --fix` 會將舊版的各頻道 `allow` 鍵遷移為 `enabled`。

    若你只設定 `DISCORD_BOT_TOKEN`，且未建立 `channels.discord` 區塊，即使 `channels.defaults.groupPolicy` 為 `open`，執行環境的備援值仍是 `groupPolicy="allowlist"`（並會在記錄中發出警告）。

  </Tab>

  <Tab title="提及與群組私訊">
    伺服器訊息預設需要提及才會處理。

    提及偵測包括：

    - 明確提及機器人
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 在支援情況下，隱含的回覆機器人行為

    撰寫對外傳送的 Discord 訊息時，請使用標準提及語法：使用者為 `<@USER_ID>`、頻道為 `<#CHANNEL_ID>`、角色為 `<@&ROLE_ID>`。請勿使用舊版 `<@!USER_ID>` 暱稱提及格式。

    `requireMention` 依伺服器／頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性捨棄提及其他使用者／角色但未提及機器人的訊息（不包括 @everyone/@here）。

    群組私訊：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可透過 `dm.groupChannels` 設定選用允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 依角色路由代理程式

使用 `bindings[].match.roles`，依角色 ID 將 Discord 伺服器成員路由到不同的代理程式。依角色的繫結僅接受角色 ID，並在同儕或父層同儕繫結之後、僅限伺服器的繫結之前評估。若繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），則所有已設定欄位都必須相符。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## 原生命令與命令授權

  - `commands.native` 預設為 `"auto"`，並為 Discord 啟用。
  - 各頻道覆寫設定：`channels.discord.commands.native`。
  - `commands.native=false` 會在啟動期間略過 Discord 斜線命令的註冊與清理。先前註冊的命令可能仍會顯示在 Discord 中，直到你從 Discord 應用程式中移除它們。
  - 原生命令的授權使用與一般訊息處理相同的 Discord 允許清單／原則。
  - 未授權使用者可能仍會在 Discord 使用者介面中看到命令；執行時會強制套用 OpenClaw 授權，並回覆「未授權」。
  - 預設斜線命令設定：`ephemeral: true`（`channels.discord.slashCommand.ephemeral`）。

  如需命令目錄與行為的相關資訊，請參閱[斜線命令](/zh-TW/tools/slash-commands)。

  ## 功能詳細資訊

  <AccordionGroup>
  <Accordion title="回覆標籤與原生回覆">
    Discord 支援代理程式輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）：不使用隱含的回覆串接；仍會遵循明確的 `[[reply_to_*]]` 標籤
    - `first`：將隱含的原生回覆參照附加至該回合第一則傳出的 Discord 訊息
    - `all`：將其附加至每則傳出的訊息
    - `batched`：僅當傳入事件是由多則訊息經防彈跳處理形成的批次時，才將其附加至傳出訊息——當你主要想在語意不明的突發密集對話中使用原生回覆，而不是在每個僅含單則訊息的回合中使用時，這會很實用

    訊息 ID 會顯示在上下文／歷史記錄中，讓代理程式能指定特定訊息。

  </Accordion>

  <Accordion title="連結預覽">
    Discord 預設會為 URL 產生豐富連結嵌入內容。OpenClaw 預設會在傳出的 Discord 訊息中抑制這些自動產生的嵌入內容，因此代理程式傳送的 URL 會維持為純連結，除非你選擇啟用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 可覆寫單一帳號的設定。代理程式透過訊息工具傳送時，也可以為單一訊息傳入 `suppressEmbeds: false`。明確提供的 Discord `embeds` 承載資料不受預設連結預覽設定抑制。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可先傳送暫時訊息，再隨著文字到達持續編輯，以串流方式顯示回覆草稿。`channels.discord.streaming.mode` 可設為 `off` | `partial` | `block` | `progress`（未設定 `streaming`／舊版 `streamMode` 鍵時的預設值）。`streamMode` 是舊版別名；請執行 `openclaw doctor --fix`，將已儲存的設定改寫為標準的巢狀 `streaming` 結構。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` 會停用 Discord 預覽編輯。
    - `partial` 會隨權杖抵達而編輯單一預覽訊息。
    - `block` 會產生草稿大小的區塊；可使用 `streaming.preview.chunk`（`minChars`、`maxChars`、`breakPreference`）調整大小與斷點，並限制於 `textChunkLimit`。明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免重複串流。
    - `progress` 會保留一則可編輯的狀態草稿，並以工具進度持續更新，直到最終傳送；共用的起始標籤是一行滾動文字，因此在出現足夠多的工作內容後，會像其餘內容一樣捲離畫面。
    - 媒體、錯誤及明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設為 `true`）控制工具／進度更新是否重複使用預覽訊息。
    - 工具／進度列會在可用時，以精簡的表情符號 + 標題 + 詳細資訊呈現，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（預設為 `false`）可選擇在暫時的進度草稿中加入助理的評論／前言文字。評論會在顯示前清理、維持暫時性，且不會變更最終答案的傳送方式。
    - `streaming.progress.maxLineChars` 控制每行進度預覽的字數預算。一般文字會在單字邊界縮短；命令與路徑詳細資訊則會保留有用的後綴。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制精簡進度行中的命令／執行詳細資訊：`raw`（預設）或 `status`（僅工具標籤）。

    隱藏原始命令／執行文字，同時保留精簡的進度行：

    ```json
    {
      "channels": {
        "discord": {
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

    預覽串流僅支援文字；媒體回覆會改用一般傳送方式。

  </Accordion>

  <Accordion title="歷史記錄、上下文與討論串行為">
    伺服器歷史記錄上下文：

    - `channels.discord.historyLimit` 預設為 `20`
    - 備援設定：`messages.groupChat.historyLimit`
    - `0` 表示停用

    私訊歷史記錄控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會路由為頻道工作階段，除非有覆寫設定，否則會繼承父頻道設定。
    - 討論串工作階段會繼承父頻道工作階段層級的 `/model` 選擇，僅作為模型備援；討論串本身的 `/model` 選擇具有較高優先順序，而且除非啟用逐字記錄繼承，否則不會複製父頻道的逐字記錄歷史。
    - `channels.discord.thread.inheritParent`（預設為 `false`）可讓新的自動討論串以父頻道逐字記錄作為初始內容。每個帳號的覆寫設定：`channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具的回應可解析 `user:<id>` 私訊目標。
    - 在回覆階段啟用備援期間，會保留 `guilds.<guild>.channels.<channel>.requireMention: false`。

    頻道主題會以**不受信任的**上下文注入。允許清單僅限制誰能觸發代理程式，並非完整的補充上下文遮蔽邊界。

  </Accordion>

  <Accordion title="子代理程式的討論串綁定工作階段">
    Discord 可將討論串綁定至工作階段目標，使該討論串中的後續訊息持續路由至相同工作階段（包括子代理程式工作階段）。

    命令：

    - `/focus <target>` 將目前／新討論串綁定至子代理程式／工作階段目標
    - `/unfocus` 移除目前的討論串綁定
    - `/agents` 顯示作用中的執行項目與綁定狀態
    - `/session idle <duration|off>` 檢視／更新焦點綁定因閒置而自動取消焦點的設定
    - `/session max-age <duration|off>` 檢視／更新焦點綁定的硬性最長存續時間

    設定：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    注意事項：

    - `session.threadBindings.*` 設定全域預設值；`channels.discord.threadBindings.*` 會覆寫 Discord 行為。
    - `spawnSessions` 控制是否為 `sessions_spawn({ thread: true })` 和 ACP 討論串衍生作業自動建立／綁定討論串。預設值：`true`。
    - `defaultSpawnContext` 控制綁定討論串的衍生作業所使用的原生子代理程式上下文。預設值：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`／`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某個帳號停用討論串綁定，則無法使用 `/focus` 和相關的討論串綁定操作。

    請參閱[子代理程式](/zh-TW/tools/subagents)、[ACP 代理程式](/zh-TW/tools/acp-agents)和[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久性 ACP 頻道綁定">
    若要建立穩定且「持續運作」的 ACP 工作區，請設定以 Discord 對話為目標的頂層具型別 ACP 綁定。

    設定路徑：`bindings[]`，並使用 `type: "acp"` 和 `match.channel: "discord"`。

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    注意事項：

    - `/acp spawn codex --bind here` 會直接綁定目前的頻道或討論串，並讓後續訊息維持在同一個 ACP 工作階段。討論串訊息會繼承上層頻道的綁定。
    - 在已綁定的頻道或討論串中，`/new` 和 `/reset` 會直接重設同一個 ACP 工作階段。啟用期間，暫時性討論串綁定可覆寫目標解析。
    - `spawnSessions` 會透過 `--thread auto|here` 控制是否允許建立／綁定子討論串。

    如需綁定行為的詳細資訊，請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

  </Accordion>

  <Accordion title="回應通知">
    每個伺服器的回應通知模式（`guilds.<id>.reactionNotifications`）：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    回應事件會轉換成系統事件，並附加至路由後的 Discord 工作階段。

  </Accordion>

  <Accordion title="確認回應">
    OpenClaw 處理傳入訊息時，`ackReaction` 會傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理程式身分表情符號備援（`agents.list[].identity.emoji`，否則使用「👀」）

    注意事項：

    - Discord 接受 Unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某個頻道或帳號的回應。

    **範圍（`messages.ackReactionScope`）：**

    值：`"all"`（私訊 + 群組，包括環境聊天室事件）、`"direct"`（僅限私訊）、`"group-all"`（除環境聊天室事件外的所有群組訊息，不含私訊）、`"group-mentions"`（機器人在群組中被提及時；**不含私訊**，預設值）、`"off"`／`"none"`（停用）。

    <Note>
    預設範圍（`"group-mentions"`）不會在直接訊息或環境聊天室事件中觸發確認回應。若要在傳入的 Discord 私訊和無互動的聊天室事件中取得確認回應，請將 `messages.ackReactionScope` 設為 `"all"`。
    </Note>

  </Accordion>

  <Accordion title="寫入設定">
    預設允許由頻道發起設定寫入。這會影響 `/config set|unset` 流程（啟用命令功能時）。

    停用方式：

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="閘道代理伺服器">
    使用 `channels.discord.proxy`，透過 HTTP(S) 代理伺服器路由 Discord 閘道 WebSocket 流量和啟動時的 REST 查詢（應用程式 ID + 允許清單解析）。
    Discord 閘道 WebSocket 的代理設定是明確指定的；WebSocket 連線不會繼承閘道程序的環境代理伺服器環境變數。設定 `channels.discord.proxy` 後，啟動時的 REST 查詢會使用此代理伺服器。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    個別帳號的覆寫設定：

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit 支援">
    啟用 PluralKit 解析，將代理訊息對應至系統成員身分：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 選填；私人系統需要
      },
    },
  },
}
```

    注意事項：

    - 允許清單可使用 `pk:<memberId>`
    - 只有當 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱／slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID 呼叫 PluralKit API
    - 如果查詢失敗，代理訊息會被視為機器人訊息並遭捨棄，除非 `allowBots` 允許其通過

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理程式需要確定地提及已知 Discord 使用者時，請使用 `mentionAliases`。鍵是不含開頭 `@` 的代稱；值則是 Discord 使用者 ID。未知代稱、`@everyone`、`@here`，以及 Markdown 程式碼範圍內的提及都會維持不變。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="上線狀態設定">
    當你設定狀態或活動欄位，或啟用自動上線狀態時，系統會套用上線狀態更新。

    僅設定狀態：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活動（設定 `activity` 時，自訂狀態是預設的活動類型）：

```json5
{
  channels: {
    discord: {
      activity: "專注時間",
      activityType: 4,
    },
  },
}
```

    直播：

```json5
{
  channels: {
    discord: {
      activity: "即時編寫程式碼",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活動類型對照：

    - 0：遊玩中
    - 1：直播中（需要 `activityUrl`；而 `activityUrl` 又需要 `activityType: 1`）
    - 2：聆聽中
    - 3：觀看中
    - 4：自訂（使用活動文字作為狀態內容；表情符號為選填）
    - 5：競賽中

    自動上線狀態（執行階段健康狀態訊號）：

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "權杖已耗盡",
      },
    },
  },
}
```

    自動上線狀態會將執行階段可用性對應至 Discord 狀態：健康 => 上線、降級或未知 => 閒置、已耗盡或無法使用 => 請勿打擾。預設值：`intervalMs` 30000、`minUpdateIntervalMs` 15000（必須小於或等於 `intervalMs`）。選用的文字覆寫項目：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中使用按鈕處理核准，也可選擇在原始頻道中發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選填；可能時會回退至 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且可以從 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出至少一位核准者時，Discord 會自動啟用原生執行核准。Discord 不會從頻道的 `allowFrom`、舊版 `dm.allowFrom` 或私訊的 `defaultTo` 推斷執行核准者。設定 `enabled: false` 可明確停用 Discord 的原生核准用戶端。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感且僅限擁有者使用的群組命令，OpenClaw 會私下傳送核准提示和最終結果。當發出命令的擁有者有 Discord 擁有者路由時，系統會先嘗試傳送 Discord 私訊；否則會回退至 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會顯示於頻道中。只有已解析的核准者可以使用按鈕；其他使用者會收到只有自己可見的拒絕訊息。核准提示包含命令文字，因此只有在受信任的頻道中才應啟用頻道傳送。如果無法從工作階段金鑰推導出頻道 ID，OpenClaw 會回退至私訊傳送。

    Discord 會呈現其他聊天頻道共用的核准按鈕；原生 Discord 配接器主要新增核准者私訊路由和頻道扇出功能。當這些按鈕存在時，它們是主要的核准使用者體驗；只有當工具結果指出聊天核准無法使用，或手動核准是唯一途徑時，OpenClaw 才應包含手動 `/approve` 命令。如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留本機確定性的 `/approve <id> <decision>` 提示。如果執行階段已啟用，但無法將原生卡片傳送至任何目標，OpenClaw 會在相同聊天中傳送回退通知，其中包含待處理核准的精確 `/approve` 命令。

    閘道驗證和核准解析遵循共用的閘道用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 則透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後到期。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作涵蓋訊息傳遞、頻道管理、內容管理、上線狀態和中繼資料。

核心範例：

- 訊息傳遞：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回應：`react`、`reactions`、`emojiList`
- 內容管理：`timeout`、`kick`、`ban`
- 上線狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定排定活動的封面圖片。

動作閘門位於 `channels.discord.actions.*` 下。

預設閘門行為：

| 動作群組                                                                                                                                                             | 預設值  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 啟用  |
| roles                                                                                                                                                                    | 停用 |
| moderation                                                                                                                                                               | 停用 |
| presence                                                                                                                                                                 | 停用 |

## 元件 v2 使用者介面

OpenClaw 使用 Discord 元件 v2 處理執行核准和跨情境標記。Discord 訊息動作也可接受 `components`，以建立自訂使用者介面（進階功能；需要透過 discord 工具建構元件承載資料）；舊版 `embeds` 仍可使用，但不建議採用。

- `channels.discord.ui.components.accentColor` 設定 Discord 元件容器使用的強調色（十六進位）。個別帳號：`channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord 元件回呼維持註冊的時間（預設 `1800000`，上限 `86400000`）。個別帳號：`channels.discord.accounts.<id>.agentComponents.ttlMs`。
- 當存在元件 v2 時，會忽略 `embeds`。
- 預設會抑制純 URL 預覽。當單一傳出連結應展開時，請在訊息動作上設定 `suppressEmbeds: false`。

範例：

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 語音

Discord 有兩種不同的語音介面：即時**語音頻道**（持續對話）和**語音訊息附件**（波形預覽格式）。閘道兩者皆支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色／使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 範圍邀請機器人。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History 權限。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號的預設代理程式，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

若要在加入前檢查機器人的有效權限：

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

自動加入範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

注意事項：

- 對於純文字設定，Discord 語音功能為選用；設定 `channels.discord.voice.enabled=true`（或保留現有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段，以及 `GuildVoiceStates` 閘道意圖。`channels.discord.intents.voiceStates` 可明確覆寫意圖訂閱；若不設定，則會依照實際的語音啟用狀態。
- `voice.mode` 控制對話路徑。預設值為 `agent-proxy`：即時語音前端負責回合時機、中斷和播放，透過 `openclaw_agent_consult` 將實質工作委派給路由指定的 OpenClaw 代理，並將結果視為該說話者輸入的 Discord 提示。`stt-tts` 保留較舊的批次 STT 加 TTS 流程。`bidi` 可讓即時模型直接對話，同時公開 `openclaw_agent_consult` 以使用 OpenClaw 大腦。
- `voice.agentSession` 控制哪個 OpenClaw 對話接收語音回合。若不設定，會使用語音頻道自己的工作階段；也可設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道成為現有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風／揚聲器延伸。
- `voice.model` 會覆寫 Discord 語音回應與即時諮詢所使用的 OpenClaw 代理大腦。若不設定，則繼承路由指定的代理模型。此設定與 `voice.realtime.model` 分開。
- `voice.followUsers` 可讓機器人跟隨所選使用者加入、移動及離開 Discord 語音。請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音，保留說話者與目標工作階段的一般擁有者／工具授權，但會隱藏代理的 `tts` 工具，因為播放由 Discord 語音負責。依預設，`agent-proxy` 會為擁有者說話者提供等同擁有者的完整諮詢工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈優先在提供實質回答前諮詢 OpenClaw 代理（`voice.realtime.consultPolicy: "always"`）。在預設的 `always` 模式中，即時層不會在諮詢答案前自動說出填充語；它會擷取並轉錄語音，然後說出路由指定的 OpenClaw 答案。如果 Discord 仍在播放第一個答案時，有多個強制諮詢答案完成，後續需要逐字說出的答案會排入佇列，直到播放閒置，而不會在句子中途取代語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 用於設定即時音訊工作階段。若要搭配 OpenAI Realtime 2.1 與 Codex 大腦，請使用 `voice.realtime.model: "gpt-realtime-2.1"` 和 `voice.model: "openai/gpt-5.6-sol"`。
- 即時語音模式預設會在即時提供者指示中納入小型的 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 設定檔，讓快速直接回合維持與路由指定的 OpenClaw 代理相同的身分、使用者脈絡基礎和角色特質。將 `voice.realtime.bootstrapContextFiles` 設為其中一部分即可自訂，或設為 `[]` 以停用。僅支援這些設定檔；`AGENTS.md` 仍保留在一般代理情境中。注入的設定檔情境無法取代 `openclaw_agent_consult` 來處理工作區工作、目前事實、記憶查詢或工具支援的動作。
- 在 OpenAI `agent-proxy` 即時模式中，設定 `voice.realtime.requireWakeName: true`，可讓 Discord 即時語音保持靜音，直到轉錄內容以喚醒名稱開頭或結尾。設定的喚醒名稱必須為一或兩個單字。如果未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由指定代理的 `name` 加上 `OpenClaw`，若不可用則改用代理 ID 加上 `OpenClaw`。喚醒名稱閘控會停用即時提供者的自動回應，將已接受的回合透過 OpenClaw 代理諮詢路徑進行路由，並在最終轉錄抵達前，從部分轉錄中辨識出開頭的喚醒名稱時，提供簡短的語音確認。
- OpenAI 即時提供者接受目前的 Realtime 2 事件名稱，以及與舊版 Codex 相容的輸出音訊和轉錄事件別名，因此相容的提供者快照即使發生偏移，也不會遺失助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷進行中的即時播放。若未設定，則依循即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前，助理必須播放的最短持續時間。預設值：`250`。在低回音房間中可設為 `0` 以立即中斷，或在回音嚴重的揚聲器環境中提高此值。
- `voice.tts` 僅覆寫 `stt-tts` 語音播放的 `messages.tts`；即時模式則使用 `voice.realtime.speakerVoice`。若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇文字轉語音的聲音。在目前的 OpenAI TTS 模型中，`cedar` 是不錯的陽剛聲線選擇。
- 各 Discord 頻道的 `systemPrompt` 覆寫會套用至該語音頻道的語音轉錄回合。
- 對於受擁有者限制的命令與頻道動作，語音轉錄回合會根據 Discord `allowFrom`（或 `dm.allowFrom`）判定擁有者狀態。代理工具的可見性依循路由工作階段所設定的工具政策。
- 如果 `voice.autoJoin` 對同一個伺服器有多個項目，OpenClaw 會加入該伺服器最後設定的頻道。
- `voice.allowedChannels` 是選用的常駐允許清單。若不設定，`/vc join` 可加入任何已授權的 Discord 語音頻道。設定後，`/vc join`、啟動時自動加入，以及機器人的語音狀態移動，都會限制在列出的 `{ guildId, channelId }` 項目內。將其設為空陣列可拒絕加入所有 Discord 語音頻道。如果 Discord 將機器人移到允許清單之外，OpenClaw 會離開該頻道，並在有可用目標時重新加入設定的自動加入目標。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會直接傳遞給 `@discordjs/voice` 的加入選項；上游預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用內附的 `libopus-wasm` 編解碼器來接收 Discord 語音並播放即時原始 PCM。它隨附固定版本的 libopus WebAssembly 組建，不需要原生 opus 附加元件。
- `voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試一開始等待 `@discordjs/voice` Ready 的時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待其開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因另一名使用者開始說話而停止。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放完成後說話，以開始下一個回合。即時模式會將說話者開始事件轉送為即時提供者的插話訊號。
- 在即時模式中，揚聲器聲音進入開啟的麥克風時，可能被視為插話並中斷播放。對於回音嚴重的 Discord 房間，請設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，避免 OpenAI 因輸入音訊而自動中斷。如果你仍希望 Discord 說話者開始事件中斷進行中的播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接器會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音／雜訊而忽略，並將其記錄為已略過，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 Discord 回報說話者停止後，OpenClaw 等待多久才會完成該音訊片段並送交 STT。預設值：`2000`；如果 Discord 將正常停頓切割成零碎的部分轉錄，請提高此值。
- 選用 ElevenLabs 作為 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者的回應串流開始播放。不支援串流的提供者會退回使用合成的暫存檔案路徑。
- OpenClaw 會監控接收解密失敗，並在短時間內重複失敗後，透過離開並重新加入語音頻道來自動復原。
- 如果更新後，接收日誌反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告與日誌。內附的 `@discordjs/voice` 版本包含 discord.js PR #11449 的上游填補修正，該 PR 已解決 discord.js issue #11419。
- OpenClaw 完成擷取的說話者片段時，出現 `The operation was aborted` 接收事件是預期行為；這些是詳細診斷資訊，而非警告。
- 詳細的 Discord 語音日誌會為每個已接受的說話者片段納入有長度上限的單行 STT 轉錄預覽，因此除錯時可以同時查看使用者端與代理回覆端，而不會傾印無長度限制的轉錄文字。
- 在 `agent-proxy` 模式中，強制諮詢的備援機制會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字、尾端連接詞（如 “and”），以及明顯無需採取動作的結語（如 “be right back” 或 “bye”）。當此機制阻止過時的已排程答案時，日誌會顯示 `forced agent consult skipped reason=...`。

### 在語音中跟隨使用者

如果你希望 Discord 語音機器人跟隨一或多名已知的 Discord 使用者，而不是在啟動時加入固定頻道或等待 `/vc join`，請使用 `voice.followUsers`。

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

行為：

- `followUsers` 接受原始 Discord 使用者 ID 和 `discord:<id>` 值。OpenClaw 會在比對語音狀態事件前，將這兩種格式正規化。
- 設定 `followUsers` 時，`followUsersEnabled` 預設為 `true`。將其設為 `false` 可保留已儲存的清單，但停止自動跟隨語音。
- 被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。使用者移動時，OpenClaw 會跟著移動。作用中的被跟隨使用者中斷連線時，OpenClaw 會離開。
- 如果同一個伺服器中有多名被跟隨的使用者，而作用中的被跟隨使用者離開，OpenClaw 會在離開伺服器前，移至另一名已追蹤的被跟隨使用者所在頻道。如果多名被跟隨使用者同時移動，則以最近觀察到的語音狀態事件為準。
- `allowedChannels` 仍然適用。位於不允許頻道中的被跟隨使用者會被忽略，而由跟隨功能擁有的工作階段則會移至另一名被跟隨使用者所在頻道，或直接離開。
- OpenClaw 會在啟動時及有上限的時間間隔內，協調遺漏的語音狀態事件。協調程序會抽樣已設定的伺服器，並限制每次執行的 REST 查詢次數，因此非常大的 `followUsers` 清單可能需要超過一個間隔才能收斂。
- 如果 Discord 或管理員在機器人跟隨使用者時移動機器人，OpenClaw 會重建語音工作階段，並在目的地獲允許時保留跟隨所有權。如果機器人被移到 `allowedChannels` 之外，OpenClaw 會離開，並在有設定目標時重新加入該目標。
- DAVE 接收復原可能會在重複解密失敗後離開並重新加入同一個頻道。由跟隨功能擁有的工作階段會在該復原路徑中保留其跟隨所有權，因此被跟隨使用者之後中斷連線時，仍會離開頻道。

選擇加入模式：

- 對於個人或操作人員設定，如果機器人應在你使用語音時自動進入語音頻道，請使用 `followUsers`。
- 對於即使沒有任何已追蹤使用者使用語音，也應保持在線的固定房間機器人，請使用 `autoJoin`。
- 對於單次加入，或自動出現在語音頻道會令人意外的房間，請使用 `/vc join`。

Discord 語音編解碼器：

- 語音接收日誌會顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會使用同一個內附的 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，再將封包交給 `@discordjs/voice`。
- 檔案與提供者串流播放會使用 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，然後使用 `libopus-wasm` 產生傳送至 Discord 的 Opus 封包串流。

STT 加 TTS 管線：

- Discord PCM 擷取內容會轉換成 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 逐字稿會透過 Discord 輸入與路由傳送，同時回應 LLM 會依語音輸出政策執行；此政策會隱藏代理程式的 `tts` 工具並要求傳回文字，因為最終 TTS 播放由 Discord 語音負責。
- 設定 `voice.model` 時，它只會覆寫此語音頻道輪次的回應 LLM。
- `voice.tts` 會合併並覆寫 `messages.tts`；支援串流的供應商會直接將音訊送入播放器，否則會在已加入的頻道中播放產生的音訊檔案。

預設代理程式代理語音頻道工作階段範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

若沒有 `voice.agentSession` 區塊，每個語音頻道都會有各自路由的 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段互動。即時模型只是語音前端；實質要求會交給已設定的 OpenClaw 代理程式。如果即時模型未呼叫諮詢工具便產生最終逐字稿，OpenClaw 會強制執行諮詢作為備援，讓預設行為仍如同與代理程式交談。

舊版 STT 加 TTS 範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

即時雙向範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

將語音作為現有 Discord 頻道工作階段的延伸：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式下，機器人會加入已設定的語音頻道，但 OpenClaw 代理程式輪次會使用目標頻道的一般路由工作階段與代理程式。即時語音工作階段會將傳回的結果說回語音頻道。監督代理程式仍可依其工具政策使用一般訊息工具，包括在適當時另行傳送 Discord 訊息。

委派的 OpenClaw 執行處於活動狀態時，新的 Discord 語音逐字稿會先視為即時執行控制，再考慮啟動另一個代理程式輪次。「狀態」、「取消那個」、「使用較小的修正」或「完成後也檢查測試」等語句，會分類為活動工作階段的狀態、取消、引導或後續輸入。狀態、取消、已接受的引導及後續結果都會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理要求。

實用的目標格式：

- `target: "channel:123456789012345678"` 會透過 Discord 文字頻道工作階段路由。
- `target: "123456789012345678"` 會視為頻道目標。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 會透過該私訊工作階段路由。

回音嚴重時的 OpenAI Realtime 範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

當模型透過開啟的麥克風聽到自己的 Discord 播放內容，但你仍希望能以說話打斷它時，請使用此設定。OpenClaw 會阻止 OpenAI 因原始輸入音訊而自動中斷，同時 `bargeIn: true` 讓 Discord 說話者開始事件與已處於活動狀態的說話者音訊，在下一個擷取輪次送達 OpenAI 前取消活動中的即時回應。`audioEndMs` 低於 `minBargeInAudioEndMs` 的極早插話訊號會視為可能的回音／雜訊並予以忽略，避免模型在第一個播放影格就中斷。

預期的語音日誌：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時模式啟動時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 收到說話者音訊時：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過時語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止／重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時諮詢時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 代理程式回答時：`discord voice: agent turn answer ...`
- 精確語音排入佇列時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音／雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 播放閒置時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊遭截斷的問題，請將即時語音日誌當作時間軸閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。從此時起，橋接器會開始計算助理輸出區塊、Discord PCM 位元組、供應商即時音訊位元組，以及合成音訊時長。
2. `realtime speaker turn opened` 表示某位 Discord 說話者開始活動。如果播放已處於活動狀態且已啟用 `bargeIn`，之後可能出現 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 表示收到該說話者輪次的第一個實際音訊影格。此處的 `outputActive=true` 或非零 `outputAudioMs` 表示助理播放仍處於活動狀態時，麥克風正在傳送輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放處於活動狀態時偵測到即時說話者音訊。這有助於區分真正的中斷，以及沒有實用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 已要求即時供應商取消或截斷活動中的回應。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，讓你查看中斷前實際已播放多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放的重設點。原因會指出由何者停止播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 會摘要擷取到的輸入輪次。`chunks=0` 或 `hasAudio=false` 表示說話者輪次已開啟，但沒有可用音訊抵達即時橋接器。`interruptedPlayback=true` 表示該輸入輪次與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：此日誌行之前，即時供應商產生的助理音訊時長。
- `audioMs`：播放停止前，OpenClaw 計算的助理音訊時長。
- `elapsedMs`：開啟與關閉播放串流或說話者輪次之間的實際經過時間。
- `discordBytes`：傳送至 Discord 語音或從中接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送至即時供應商或從中接收的供應商格式 PCM 位元組。
- `playbackChunks`：針對活動中回應轉送至 Discord 的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取到的說話者音訊影格與說話者輪次關閉之間的間隔。

常見模式：

- `source=active-speaker-audio`、較小的 `outputAudioMs`，且同一位使用者在附近時發生立即截斷，通常表示揚聲器回音進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低揚聲器音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false`，表示 Discord 回報說話者開始，但沒有音訊抵達 OpenClaw。這可能是暫時性的 Discord 語音事件、雜訊閘門行為，或用戶端短暫啟用麥克風。
- 若 `audio playback stopped reason=stream-close` 附近沒有插話或 `provider-clear-audio`，表示本機 Discord 播放串流意外結束。請檢查前面的供應商與 Discord 播放器日誌。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊處於活動狀態時刻意捨棄輸入。若要讓語音中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或供應商 VAD 回報語音，但 OpenClaw 沒有可供中斷的活動播放。這不應截斷音訊。

認證資訊會依元件分別解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`／`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或供應商的一般驗證設定則用於即時供應商驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並要求使用 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要閘道主機上的 `ffmpeg` 和 `ffprobe` 來檢查及轉換。

- 提供**本機檔案路徑**（不接受 URL）。
- 省略文字內容（Discord 不接受在同一個承載資料中同時包含文字與語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="使用了不允許的意圖，或機器人看不到任何伺服器訊息">

    - 啟用 Message Content Intent
    - 當你需要解析使用者／成員時，啟用 Server Members Intent
    - 變更 intents 後重新啟動閘道

  </Accordion>

  <Accordion title="伺服器訊息意外遭到封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的伺服器允許清單
    - 如果伺服器有 `channels` 對應表，則只允許其中列出的頻道
    - 驗證 `requireMention` 行為與提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 為 false，但仍遭封鎖">
    常見原因：

    - `groupPolicy="allowlist"`，但沒有相符的伺服器／頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者遭伺服器／頻道的 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    常見日誌：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 閘道佇列調整項目：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 此設定只控制 Discord 閘道監聽器工作，不控制代理程式回合的生命週期

    Discord 不會對已排入佇列的代理程式回合套用頻道自行管理的逾時。訊息監聽器會立即移交工作，而排入佇列的 Discord 執行會維持各工作階段的順序，直到工作階段／工具／執行階段生命週期完成或中止工作。

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="閘道中繼資料查詢逾時警告">
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會改用 Discord 的預設閘道 URL，且日誌輸出會受到速率限制。

    中繼資料逾時調整項目：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定組態時的環境變數備援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="閘道 READY 逾時重新啟動">
    OpenClaw 會在啟動期間及執行階段重新連線後，等待 Discord 閘道的 `READY` 事件。採用交錯啟動的多帳號設定，可能需要比預設值更長的啟動 READY 等待時間。

    READY 逾時調整項目：

    - 啟動時單一帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動時多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定組態時的啟動環境變數備援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單一帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定組態時的執行階段環境變數備援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不一致">
    `channels status --probe` 權限檢查僅適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但探測無法完整驗證權限。

  </Accordion>

  <Accordion title="私訊與配對問題">

    - 已停用私訊：`channels.discord.dm.enabled=false`
    - 已停用私訊政策：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人迴圈">
    預設會忽略由機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，僅接受提及該機器人的機器人訊息。

    OpenClaw 也隨附共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。每當 `allowBots` 允許由機器人撰寫的訊息進入分派流程時，Discord 會將傳入事件對應至 `(account, channel, bot pair)` 資訊，而通用配對防護機制會在該配對超過已設定的事件預算後抑制它。此防護機制可避免失控的雙機器人迴圈；過去只能依靠 Discord 速率限制來停止這類迴圈。它不會影響單一機器人部署，也不會影響未超過預算的一次性機器人回覆。

    預設設定（設定 `allowBots` 時生效）：

    - `maxEventsPerWindow: 20` -- 機器人配對可在滑動時間範圍內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動時間範圍長度
    - `cooldownSeconds: 60` -- 一旦觸發預算限制，任一方向後續的每一則機器人對機器人訊息都會遭捨棄一分鐘

    請在 `channels.defaults.botLoopProtection` 下統一設定共用預設值，只有在合法工作流程需要更大餘裕時，才覆寫 Discord 設定。優先順序如下：

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 內建預設值

    Discord 使用通用的 `maxEventsPerWindow`、`windowSeconds` 與 `cooldownSeconds` 鍵。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // 選用的 Discord 全域覆寫。帳號區塊會覆寫個別
      // 欄位，並從此處繼承省略的欄位。
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha 只在其他機器人提及它時才接收其訊息。
          allowBots: "mentions",
        },
        bravo: {
          // Bravo 會接收所有由機器人撰寫的 Discord 訊息。
          allowBots: true,
          mentionAliases: {
            // 讓 Bravo 使用已設定的使用者 ID 寫出 Alpha 的 Discord 提及。
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // 每分鐘允許最多五則訊息，之後才抑制該配對。
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="語音 STT 因 DecryptionFailed(...) 而中斷">

    - 讓 OpenClaw 保持最新版本（`openclaw update`），以確保包含 Discord 語音接收復原邏輯
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，並僅在需要時調整
    - 監看以下日誌：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，請收集日誌，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷程進行比較

  </Accordion>
</AccordionGroup>

## 組態參考

主要參考資料：[組態參考資料 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動／驗證：`enabled`、`token`、`applicationId`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dmPolicy`、`allowFrom`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`（全域）、`configWrites`、`slashCommand.ephemeral`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算，預設值 `120000`）、`eventQueue.maxQueueSize`（預設值 `10000`）、`eventQueue.maxConcurrency`（預設值 `50`）
- 閘道：`proxy`、`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆／歷程：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳送：`textChunkLimit`（預設值 `2000`）、`maxLinesPerMessage`（預設值 `17`）
- 串流：`streaming.mode`、`streaming.chunkMode`、`streaming.preview.*`、`streaming.progress.*`、`streaming.block.*`（舊版扁平的 `streamMode`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`、`chunkMode` 鍵會由 `openclaw doctor --fix` 遷移至 `streaming.*`）
- 媒體／重試：`mediaMaxMb`（限制 Discord 傳出上傳，預設值 `100`）、`retry`
- 動作：`actions.*`
- 狀態：`activity`、`status`、`activityType`、`activityUrl`、`autoPresence.*`
- 使用者介面：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與操作

- 將機器人權杖視為機密資訊（在受監督環境中，建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 如果命令部署／狀態已過期，請重新啟動閘道，並使用 `openclaw channels status --probe` 再次檢查。

## 相關內容

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者與閘道配對。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化措施。
  </Card>
  <Card title="多代理程式路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將伺服器與頻道對應至代理程式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
