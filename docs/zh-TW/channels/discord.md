---
read_when:
    - 開發 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-04-30T02:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

準備好透過官方 Discord Gateway 用於私訊和伺服器頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord 私訊預設為配對模式。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為與指令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

你需要建立一個包含 Bot 的新應用程式、將 Bot 加入你的伺服器，並將它配對到 OpenClaw。我們建議將 Bot 加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **建立我自己的 > 給我和我的朋友**）。

<Steps>
  <Step title="建立 Discord 應用程式和 Bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後點選 **New Application**。將它命名為類似「OpenClaw」的名稱。

    在側邊欄點選 **Bot**。將 **Username** 設為你給 OpenClaw 代理程式取的名稱。

  </Step>

  <Step title="啟用特殊權限意圖">
    仍在 **Bot** 頁面上，向下捲動到 **Privileged Gateway Intents** 並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱對 ID 比對需要）
    - **Presence Intent**（選用；只有在需要狀態更新時才需要）

  </Step>

  <Step title="複製你的 Bot token">
    在 **Bot** 頁面往回捲到上方，然後點選 **Reset Token**。

    <Note>
    儘管名稱如此，這會產生你的第一個 token，並不是真的在「重設」任何東西。
    </Note>

    複製 token 並儲存在某處。這是你的 **Bot Token**，稍後會用到。

  </Step>

  <Step title="產生邀請 URL 並將 Bot 加入你的伺服器">
    在側邊欄點選 **OAuth2**。你會產生一個具備正確權限的邀請 URL，用來將 Bot 加入你的伺服器。

    向下捲動到 **OAuth2 URL Generator** 並啟用：

    - `bot`
    - `applications.commands`

    下方會出現 **Bot Permissions** 區段。至少啟用：

    **一般權限**
      - 檢視頻道
    **文字權限**
      - 傳送訊息
      - 讀取訊息歷史
      - 嵌入連結
      - 附加檔案
      - 新增回應（選用）

    這是一般文字頻道的基準設定。如果你打算在 Discord 討論串中發文，包括會建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **在討論串中傳送訊息**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後點選 **繼續** 以連線。現在你應該會在 Discord 伺服器中看到你的 Bot。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord 應用程式，你需要啟用開發者模式，才能複製內部 ID。

    1. 點選 **使用者設定**（你頭像旁的齒輪圖示）→ **進階** → 開啟 **開發者模式**
    2. 在側邊欄右鍵點選你的 **伺服器圖示** → **複製伺服器 ID**
    3. 右鍵點選你 **自己的頭像** → **複製使用者 ID**

    將你的 **Server ID** 和 **User ID** 與 Bot Token 一起儲存，下一步你會把這三者都傳給 OpenClaw。

  </Step>

  <Step title="允許伺服器成員傳送私訊">
    若要讓配對運作，Discord 需要允許你的 Bot 傳送私訊給你。右鍵點選你的 **伺服器圖示** → **隱私設定** → 開啟 **私訊**。

    這會讓伺服器成員（包括 Bot）可以傳送私訊給你。如果你想透過 Discord 私訊使用 OpenClaw，請保持啟用。如果你只打算使用伺服器頻道，可以在配對後停用私訊。

  </Step>

  <Step title="安全地設定你的 Bot token（不要在聊天中傳送）">
    你的 Discord Bot token 是機密資訊（就像密碼）。在傳訊息給代理程式之前，請先在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已經以背景服務執行，請透過 OpenClaw Mac app 或停止並重新啟動 `openclaw gateway run` 行程來重新啟動它。
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後能解析 env SecretRef。
    如果你的主機受到 Discord 啟動應用程式查詢封鎖或速率限制，請從 Developer Portal 設定 Discord 應用程式/client ID，讓啟動可以略過該 REST 呼叫。預設帳戶請使用 `channels.discord.applicationId`；執行多個 Discord Bot 時，請使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的代理程式">
        在任何既有頻道（例如 Telegram）與你的 OpenClaw 代理程式聊天並告訴它。如果 Discord 是你的第一個頻道，請改用 CLI / config 分頁。

        >「我已經在 config 中設定 Discord Bot token。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
      </Tab>
      <Tab title="CLI / config">
        如果你偏好以檔案為基礎的 config，請設定：

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

        預設帳戶的 env 備援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於腳本化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不帶 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec provider 的 SecretRef 值。請參閱[機密管理](/zh-TW/gateway/secrets)。

        若使用多個 Discord Bot，請將每個 Bot token 和 application ID 放在其帳戶之下。頂層的 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都應使用相同 application ID 時，才在該處設定。

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
    等到 Gateway 正在執行，然後在 Discord 中傳私訊給你的 Bot。它會回覆一組配對代碼。

    <Tabs>
      <Tab title="詢問你的代理程式">
        在既有頻道將配對代碼傳給你的代理程式：

        >「核准這個 Discord 配對代碼：`<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對代碼會在 1 小時後過期。

    現在你應該可以透過私訊在 Discord 中與代理程式聊天。

  </Step>
</Steps>

<Note>
Token 解析會感知帳戶。Config token 值優先於 env 備援。`DISCORD_BOT_TOKEN` 只會用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析到相同的 Bot token，OpenClaw 只會為該 token 啟動一個 Gateway 監視器。來自 config 的 token 優先於預設 env 備援；否則第一個已啟用的帳戶會勝出，重複帳戶會回報為已停用。
對於進階外送呼叫（message tool/頻道動作），明確的逐次呼叫 `token` 會用於該呼叫。這適用於傳送與讀取/探測類動作（例如 read/search/fetch/thread/pins/permissions）。帳戶政策/重試設定仍來自作用中執行階段快照中選取的帳戶。
</Note>

## 建議：設定伺服器工作區

私訊開始運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的代理程式工作階段與自己的情境。這建議用於只有你和 Bot 的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入伺服器允許清單">
    這會讓你的代理程式能在伺服器上的任何頻道回應，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「將我的 Discord Server ID `<server_id>` 加入伺服器允許清單」
      </Tab>
      <Tab title="Config">

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

  <Step title="允許不使用 @mention 的回應">
    預設情況下，只有在伺服器頻道中被 @mentioned 時，你的代理程式才會回應。對於私人伺服器，你可能希望它回應每則訊息。

    在伺服器頻道中，一般助理最終回覆預設會保持私密。可見的 Discord 輸出必須明確使用 `message` tool 傳送，因此代理程式可以預設旁觀，只有在判斷頻道回覆有用時才發文。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「允許我的代理程式在這個伺服器上回應，而不必被 @mentioned」
      </Tab>
      <Tab title="Config">
        在你的伺服器 config 中設定 `requireMention: false`：

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

        若要還原群組/頻道聊天室的舊版自動最終回覆，請設定 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃伺服器頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會在私訊工作階段中載入。伺服器頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「當我在 Discord 頻道中提問時，如果你需要 MEMORY.md 的長期情境，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要在每個頻道中使用共享情境，請將穩定的指示放在 `AGENTS.md` 或 `USER.md`（它們會注入每個工作階段）。將長期筆記保留在 `MEMORY.md`，並依需求透過記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的代理程式可以看到頻道名稱，而且每個頻道都有自己的隔離工作階段，所以你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- Gateway 擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會以不受信任的
  脈絡加入模型提示，而不是作為使用者可見的回覆前綴。如果模型把該封套
  複製回來，OpenClaw 會從傳出回覆和
  之後的重播脈絡中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理程式主工作階段（`agent:main:main`）。
- 伺服器頻道會使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組 DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍會攜帶 `CommandTargetSessionKey` 到路由後的對話工作階段。
- 傳送到 Discord 的純文字 Cron/Heartbeat 公告會使用最終
  助理可見答案一次。當代理程式發出多個可傳遞承載時，媒體和結構化元件承載仍會
  以多則訊息傳送。

## 論壇頻道

Discord 論壇和媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用你訊息中的第一個非空白行。
- 使用 `openclaw message thread create` 直接建立討論串。論壇頻道請不要傳入 `--message-id`。

範例：傳送到論壇父層以建立討論串

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

範例：明確建立論壇討論串

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

論壇父層不接受 Discord 元件。如果需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援用於代理程式訊息的 Discord components v2 容器。請搭配含有 `components` 承載的訊息工具使用。互動結果會作為一般傳入訊息路由回代理程式，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或一個選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取和表單在到期前被多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不符合的使用者會收到一則暫時性的拒絕訊息。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含提供者、模型與相容執行階段下拉選單，以及提交步驟。`/models add` 已棄用，現在會傳回棄用訊息，而不是從聊天註冊模型。選擇器回覆是暫時性的，且只有叫用的使用者可以使用。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應與附件參照相符時，使用 `filename` 覆寫上傳名稱

互動視窗表單：

- 加入最多含 5 個欄位的 `components.modal`
- 欄位類型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 會自動加入觸發按鈕

範例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## 存取控制與路由

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` 控制 DM 存取。`channels.discord.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用到 `default` 帳號。
    - 對於單一帳號，`allowFrom` 的優先順序高於舊版 `dm.allowFrom`。
    - 當具名帳號本身的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    仍會讀取舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 以維持相容性。`openclaw doctor --fix` 會在不改變存取權的情況下，盡可能將它們遷移到 `dmPolicy` 和 `allowFrom`。

    傳遞用的 DM 目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效 DM `allowFrom` 中的 ID 會被視為使用者 DM 目標以維持相容性。

  </Tab>

  <Tab title="Guild policy">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準是 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅角色 ID）；若設定其中任一項，傳送者符合 `users` 或 `roles` 時即被允許
    - 直接名稱/標籤比對預設停用；只有在緊急相容模式下才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 較安全；使用名稱/標籤項目時，`openclaw security audit` 會發出警告
    - 如果伺服器設定了 `channels`，未列出的頻道會被拒絕
    - 如果伺服器沒有 `channels` 區塊，該允許清單伺服器中的所有頻道都會被允許

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    如果你只設定 `DISCORD_BOT_TOKEN` 而未建立 `channels.discord` 區塊，執行階段後援會是 `groupPolicy="allowlist"`（並在記錄中發出警告），即使 `channels.defaults.groupPolicy` 是 `open` 也是如此。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設受提及閘門控管。

    提及偵測包含：

    - 明確提及 bot
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 在支援案例中的隱含回覆 bot 行為

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及其他使用者/角色但未提及 bot 的訊息（不含 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選用透過 `dm.groupChannels` 設定允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理程式路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 伺服器成員路由到不同代理程式。以角色為基礎的繫結只接受角色 ID，並且會在對等或父層對等繫結之後、僅限伺服器繫結之前評估。如果繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須符合。

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

- `commands.native` 預設為 `"auto"`，並已為 Discord 啟用。
- 依頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會明確清除先前註冊的 Discord 原生命令。
- 原生命令授權使用與一般訊息處理相同的 Discord 允許清單/政策。
- 未授權的使用者可能仍會在 Discord UI 中看到命令；執行時仍會強制套用 OpenClaw 授權並傳回「未授權」。

請參閱[斜線命令](/zh-TW/tools/slash-commands)了解命令目錄與行為。

預設斜線命令設定：

- `ephemeral: true`

## 功能詳細資料

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord 支援代理程式輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）
    - `first`
    - `all`
    - `batched`

    注意：`off` 會停用隱含回覆討論串。明確的 `[[reply_to_*]]` 標籤仍會被遵循。
    `first` 一律會將隱含原生回覆參照附加到該回合的第一則傳出 Discord 訊息。
    `batched` 只有在傳入回合是多則訊息的防抖批次時，才會附加 Discord 的隱含原生回覆參照。當你主要想在不明確的密集聊天中使用原生回覆，而不是每個單一訊息回合都使用時，這很有用。

    訊息 ID 會在脈絡/歷史中呈現，讓代理程式可以指定特定訊息。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可透過傳送暫時訊息並在文字抵達時編輯它來串流草稿回覆。`channels.discord.streaming` 接受 `off`（預設）| `partial` | `block` | `progress`。在 Discord 上，`progress` 會對應到 `partial`；`streamMode` 是舊版別名，且會自動遷移。

    預設維持 `off`，因為當多個 bot 或 Gateway 共用一個帳號時，Discord 預覽編輯很快就會觸及速率限制。

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` 會在 token 抵達時編輯單一預覽訊息。
    - `block` 會發出草稿大小的區塊（使用 `draftChunk` 調整大小和斷點，並限制在 `textChunkLimit` 內）。
    - 媒體、錯誤和明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。

    預覽串流僅限文字；媒體回覆會回退到一般傳遞。當明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    伺服器歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    DM 歷史控制項：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    執行緒行為：

    - Discord 執行緒會作為頻道工作階段路由，並繼承父頻道設定，除非被覆寫。
    - 執行緒工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅限模型的備援；執行緒本機的 `/model` 選擇仍然優先，且除非啟用對話紀錄繼承，否則不會複製父對話紀錄歷史。
    - `channels.discord.thread.inheritParent`（預設為 `false`）會讓新的自動執行緒選擇從父對話紀錄植入。每個帳號的覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent` 底下。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用備援期間保留。

    頻道主題會作為**不受信任**的脈絡注入。允許清單只限制誰能觸發代理，而不是完整的補充脈絡遮蔽邊界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以將執行緒繫結到工作階段目標，讓該執行緒中的後續訊息持續路由到同一個工作階段（包含子代理工作階段）。

    命令：

    - `/focus <target>` 將目前/新的執行緒繫結到子代理/工作階段目標
    - `/unfocus` 移除目前的執行緒繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新聚焦繫結的非活動自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新聚焦繫結的硬性最長存在時間

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    備註：

    - `session.threadBindings.*` 設定全域預設值。
    - `channels.discord.threadBindings.*` 覆寫 Discord 行為。
    - `spawnSubagentSessions` 必須為 true，才能為 `sessions_spawn({ thread: true })` 自動建立/繫結執行緒。
    - `spawnAcpSessions` 必須為 true，才能為 ACP（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）自動建立/繫結執行緒。
    - 如果帳號停用執行緒繫結，`/focus` 和相關的執行緒繫結操作將不可用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)和[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    若要使用穩定的「永遠開啟」ACP 工作區，請設定頂層具型別的 ACP 繫結，目標為 Discord 對話。

    設定路徑：

    - `bindings[]` 搭配 `type: "acp"` 和 `match.channel: "discord"`

    範例：

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

    備註：

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或執行緒，並讓未來訊息保留在同一個 ACP 工作階段。執行緒訊息會繼承父頻道繫結。
    - 在已繫結的頻道或執行緒中，`/new` 和 `/reset` 會就地重設同一個 ACP 工作階段。暫時執行緒繫結在啟用期間可以覆寫目標解析。
    - 只有當 OpenClaw 需要透過 `--thread auto|here` 建立/繫結子執行緒時，才需要 `spawnAcpSessions`。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)以了解繫結行為詳細資訊。

  </Accordion>

  <Accordion title="Reaction notifications">
    每個伺服器的反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換為系統事件，並附加到已路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認 emoji。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理身分 emoji 備援（`agents.list[].identity.emoji`，否則為 "👀"）

    備註：

    - Discord 接受 unicode emoji 或自訂 emoji 名稱。
    - 使用 `""` 可停用頻道或帳號的反應。

  </Accordion>

  <Accordion title="Config writes">
    頻道發起的設定寫入預設為啟用。

    這會影響 `/config set|unset` 流程（當命令功能啟用時）。

    停用：

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

  <Accordion title="Gateway proxy">
    透過 HTTP(S) Proxy 搭配 `channels.discord.proxy` 路由 Discord Gateway WebSocket 流量和啟動 REST 查詢（應用程式 ID + 允許清單解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    每個帳號覆寫：

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

  <Accordion title="PluralKit support">
    啟用 PluralKit 解析，將代理訊息對應到系統成員身分：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    備註：

    - 允許清單可以使用 `pk:<memberId>`
    - 只有當 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對成員顯示名稱
    - 查詢使用原始訊息 ID，並受時間窗限制
    - 如果查詢失敗，代理訊息會被視為機器人訊息並丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="Presence configuration">
    當你設定狀態或活動欄位，或啟用自動上線狀態時，會套用上線狀態更新。

    僅狀態範例：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活動範例（自訂狀態是預設活動類型）：

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    串流範例：

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活動類型對照：

    - 0: Playing
    - 1: Streaming（需要 `activityUrl`）
    - 2: Listening
    - 3: Watching
    - 4: Custom（使用活動文字作為狀態狀態；emoji 為選填）
    - 5: Competing

    自動上線狀態範例（執行階段健康訊號）：

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    自動上線狀態會將執行階段可用性對應到 Discord 狀態：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。選填文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` placeholder）

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord 支援 DM 中以按鈕為基礎的核准處理，也可以選擇在來源頻道中張貼核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選填；可行時會退回到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可解析一位核准者時，Discord 會自動啟用原生 exec 核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷 exec 核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於敏感的僅限擁有者群組命令，例如 `/diagnostics` 和 `/export-trajectory`，OpenClaw 會私下傳送核准提示和最終結果。當呼叫的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord DM；如果不可用，則退回到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到暫時性拒絕。核准提示包含命令文字，因此只應在受信任頻道中啟用頻道傳送。如果無法從工作階段鍵推導頻道 ID，OpenClaw 會退回到 DM 傳送。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 配接器主要新增核准者 DM 路由和頻道扇出。
    當這些按鈕存在時，它們是主要的核准 UX；OpenClaw
    只有在工具結果表示聊天核准不可用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保持
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但原生卡片無法傳送到任何目標，
    OpenClaw 會使用待處理核准中的確切 `/approve`
    命令傳送同聊天備援通知。

    Gateway 驗證和核准解析遵循共用 Gateway 用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後過期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和動作閘門

Discord 訊息動作包含傳訊、頻道管理、審核、上線狀態和中繼資料動作。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 上線狀態：`setPresence`

`event-create` 動作接受選填的 `image` 參數（URL 或本機檔案路徑），用來設定排程事件封面圖片。

動作閘門位於 `channels.discord.actions.*` 底下。

預設閘門行為：

| 動作群組                                                                                                                                                             | 預設  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 啟用  |
| roles                                                                                                                                                                    | 停用 |
| moderation                                                                                                                                                               | 停用 |
| presence                                                                                                                                                                 | 停用 |

## 元件 v2 UI

OpenClaw 使用 Discord 元件 v2 來處理執行核准和跨情境標記。Discord 訊息動作也可以接受 `components` 以提供自訂 UI（進階；需要透過 discord 工具建構元件承載資料），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord 元件容器使用的強調色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 針對每個帳號設定。
- 當元件 v2 存在時，會忽略 `embeds`。

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

Discord 有兩種不同的語音介面：即時 **語音頻道**（連續對話）和 **語音訊息附件**（波形預覽格式）。Gateway 兩者都支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用訊息內容意圖。
2. 使用角色/使用者允許清單時，啟用伺服器成員意圖。
3. 使用 `bot` 和 `applications.commands` 範圍邀請機器人。
4. 在目標語音頻道授予連線、說話、傳送訊息和讀取訊息歷史權限。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。該命令會使用帳號預設代理，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

自動加入範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

注意事項：

- `voice.tts` 只會針對語音播放覆寫 `messages.tts`。
- `voice.model` 只會覆寫用於 Discord 語音頻道回應的 LLM。未設定時會繼承已路由代理的模型。
- STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 語音逐字稿回合會從 Discord `allowFrom`（或 `dm.allowFrom`）衍生擁有者狀態；非擁有者說話者無法存取僅限擁有者的工具（例如 `gateway` 和 `cron`）。
- 語音預設啟用；設定 `channels.discord.voice.enabled=false` 可停用語音執行階段和 `GuildVoiceStates` Gateway 意圖。
- `channels.discord.intents.voiceStates` 可以明確覆寫語音狀態意圖訂閱。未設定時，該意圖會跟隨 `voice.enabled`。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞至 `@discordjs/voice` 加入選項。
- 若未設定，`@discordjs/voice` 的預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 也會監看接收解密失敗，並在短時間內反覆失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收日誌反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告和日誌。隨附的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游填充修正，該修正關閉了 discord.js issue #11419。

語音頻道管線：

- Discord PCM 擷取會轉換為 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 逐字稿會透過一般 Discord 入口和路由傳送。
- 設定 `voice.model` 時，只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會合併覆蓋 `messages.tts`；產生的音訊會在已加入的頻道播放。

憑證會依元件解析：`voice.model` 的 LLM 路由驗證、`tools.media.audio` 的 STT 驗證，以及 `messages.tts`/`voice.tts` 的 TTS 驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要 Gateway 主機上的 `ffmpeg` 和 `ffprobe` 來檢查和轉換。

- 提供 **本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕在同一承載資料中同時包含文字和語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - 啟用訊息內容意圖
    - 當你依賴使用者/成員解析時，啟用伺服器成員意圖
    - 變更意圖後重新啟動 Gateway

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的伺服器允許清單
    - 如果伺服器 `channels` 對應存在，則只允許列出的頻道
    - 驗證 `requireMention` 行為和提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    常見原因：

    - `groupPolicy="allowlist"` 但沒有相符的伺服器/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者遭伺服器/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    典型日誌：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 佇列調整項：

    - 單帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord Gateway 監聽器工作，不控制代理回合生命週期

    Discord 不會對已排入佇列的代理回合套用頻道擁有的逾時。訊息監聽器會立即交接，而已排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回 Discord 的預設 Gateway URL，並在日誌中限速記錄。

    中繼資料逾時調整項：

    - 單帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定 config 時的 env 後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但探測無法完整驗證權限。

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="Bot to bot loops">
    預設會忽略機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及和允許清單規則來避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該機器人的機器人訊息。

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - 保持 OpenClaw 為最新版本（`openclaw update`），以確保 Discord 語音接收復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，且只在需要時調整
    - 監看日誌中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，請收集日誌，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="High-signal Discord fields">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- Gateway 中繼資料：`gatewayInfoTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制對外 Discord 上傳，預設 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與操作

- 將機器人 Token 視為秘密（受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最小權限的 Discord 權限。
- 如果命令部署/狀態過期，請重新啟動 Gateway，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到 Gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將伺服器和頻道對應到代理。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
