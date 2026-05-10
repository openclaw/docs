---
read_when:
    - 開發 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

可透過官方 Discord Gateway 用於 DM 與公會頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord DM 預設使用配對模式。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

你需要建立一個含有 bot 的新應用程式、將 bot 加入你的伺服器，並將它配對到 OpenClaw。我們建議將你的 bot 加入你自己的私人伺服器。如果你還沒有私人伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與 bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後點擊 **New Application**。將它命名為類似「OpenClaw」的名稱。

    點擊側邊欄上的 **Bot**。將 **Username** 設為你稱呼 OpenClaw agent 的名稱。

  </Step>

  <Step title="啟用特權 intents">
    仍在 **Bot** 頁面中，向下捲動到 **Privileged Gateway Intents** 並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱對 ID 比對需要）
    - **Presence Intent**（選用；只有 presence 更新需要）

  </Step>

  <Step title="複製你的 bot token">
    在 **Bot** 頁面向上捲回並點擊 **Reset Token**。

    <Note>
    儘管名稱如此，這會產生你的第一個 token，並沒有任何東西被「重設」。
    </Note>

    複製 token 並將它儲存在某處。這是你的 **Bot Token**，你很快會需要它。

  </Step>

  <Step title="產生邀請 URL 並將 bot 加入你的伺服器">
    點擊側邊欄上的 **OAuth2**。你將產生一個邀請 URL，其中包含將 bot 加入伺服器所需的正確權限。

    向下捲動到 **OAuth2 URL Generator** 並啟用：

    - `bot`
    - `applications.commands`

    下方會出現 **Bot Permissions** 區段。至少啟用：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（選用）

    這是一般文字頻道的基準集合。如果你打算在 Discord threads 中發文，包括會建立或繼續 thread 的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到你的瀏覽器中，選取你的伺服器，然後點擊 **Continue** 以連接。你現在應該會在 Discord 伺服器中看到你的 bot。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord 應用程式，你需要啟用開發者模式，這樣才能複製內部 ID。

    1. 點擊 **User Settings**（你頭像旁的齒輪圖示）→ **Advanced** → 開啟 **Developer Mode**
    2. 在側邊欄中右鍵點擊你的 **server icon** → **Copy Server ID**
    3. 右鍵點擊你的 **own avatar** → **Copy User ID**

    將你的 **Server ID** 和 **User ID** 與 Bot Token 一起儲存；下一步你會將這三者都傳送給 OpenClaw。

  </Step>

  <Step title="允許來自伺服器成員的 DM">
    若要讓配對運作，Discord 需要允許你的 bot 傳送 DM 給你。右鍵點擊你的 **server icon** → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括 bot）傳送 DM 給你。如果你想透過 OpenClaw 使用 Discord DM，請保持啟用。如果你只打算使用公會頻道，可以在配對後停用 DM。

  </Step>

  <Step title="安全地設定你的 bot token（不要在聊天中傳送）">
    你的 Discord bot token 是秘密資訊（像密碼一樣）。在傳送訊息給你的 agent 之前，請先在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已經作為背景服務執行，請透過 OpenClaw Mac app 重新啟動，或停止並重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後能解析 env SecretRef。
    如果你的主機被 Discord 的啟動應用程式查詢封鎖或受到速率限制，請從 Developer Portal 設定 Discord 應用程式/用戶端 ID，讓啟動程序可以略過該 REST 呼叫。預設帳戶使用 `channels.discord.applicationId`；當你執行多個 Discord bot 時，使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的 agent">
        在任何既有頻道（例如 Telegram）與你的 OpenClaw agent 聊天並告訴它。如果 Discord 是你的第一個頻道，請改用 CLI / 設定分頁。

        >「我已經在 config 中設定 Discord bot token。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
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

        預設帳戶的 env fallback：

```bash
DISCORD_BOT_TOKEN=...
```

        對於指令碼化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後移除 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec provider 的 SecretRef 值。請參閱[秘密管理](/zh-TW/gateway/secrets)。

        對於多個 Discord bot，請將每個 bot token 與應用程式 ID 保留在其帳戶下。頂層 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都應使用相同應用程式 ID 時，才在那裡設定它。

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

  <Step title="核准第一次 DM 配對">
    等到 gateway 執行後，在 Discord 中傳送 DM 給你的 bot。它會回覆一組配對碼。

    <Tabs>
      <Tab title="詢問你的 agent">
        在你的既有頻道中將配對碼傳送給你的 agent：

        >「核准這個 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後過期。

    你現在應該能透過 DM 在 Discord 中與你的 agent 聊天。

  </Step>
</Steps>

<Note>
Token 解析會感知帳戶。Config token 值優先於 env fallback。`DISCORD_BOT_TOKEN` 只會用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析為相同的 bot token，OpenClaw 只會為該 token 啟動一個 gateway monitor。來自 config 的 token 會優先於預設 env fallback；否則第一個已啟用的帳戶會勝出，且重複帳戶會被回報為已停用。
對於進階傳出呼叫（message tool/channel actions），明確的每次呼叫 `token` 會用於該呼叫。這適用於傳送與 read/probe 風格的動作（例如 read/search/fetch/thread/pins/permissions）。帳戶 policy/retry 設定仍來自目前作用中 runtime snapshot 中選取的帳戶。
</Note>

## 建議：設定公會工作區

DM 可用後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的 agent session 與自己的 context。這建議用於只有你和你的 bot 的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入公會允許清單">
    這會讓你的 agent 能在伺服器上的任何頻道回應，而不只是 DM。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「將我的 Discord Server ID `<server_id>` 加入公會允許清單」
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

  <Step title="允許不需 @mention 的回應">
    預設情況下，只有在公會頻道中被 @mentioned 時，你的 agent 才會回應。對私人伺服器而言，你可能希望它回應每則訊息。

    在公會頻道中，一般 assistant 最終回覆預設保持私密。可見的 Discord 輸出必須使用 `message` tool 明確傳送，因此 agent 預設可以潛伏，並只在判斷頻道回覆有用時發文。

    這表示選取的模型必須可靠地呼叫 tools。如果 Discord 顯示正在輸入，且記錄顯示 token 使用量但沒有張貼訊息，請檢查 session log 中是否有帶有 `didSendViaMessagingTool: false` 的 assistant 文字。這表示模型產生了私密最終答案，而不是呼叫 `message(action=send)`。請切換到更強的 tool-calling 模型，或使用下方 config 還原舊版自動最終回覆。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「允許我的 agent 在這個伺服器上回應，而不必被 @mentioned」
      </Tab>
      <Tab title="Config">
        在你的公會 config 中設定 `requireMention: false`：

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

        若要還原 group/channel rooms 的舊版自動最終回覆，請設定 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃公會頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會在 DM sessions 中載入。公會頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期 context，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果每個頻道都需要共用 context，請將穩定指示放在 `AGENTS.md` 或 `USER.md`（它們會被注入每個 session）。將長期筆記保存在 `MEMORY.md`，並視需要使用 memory tools 存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的 agent 可以看到頻道名稱，而且每個頻道都會取得自己的隔離 session，因此你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## Runtime 模型

- Gateway 擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的
  情境加入模型提示，而不是作為使用者可見的回覆前綴。如果模型將該包裝
  複製回來，OpenClaw 會從傳出回覆和
  未來的重播情境中移除已複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理主要工作階段（`agent:main:main`）。
- 伺服器頻道會使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組 DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 到已路由的對話工作階段。
- 傳送到 Discord 的純文字 Cron/Heartbeat 公告會使用最終
  助理可見答案一次。當代理發出多個可交付酬載時，媒體和結構化元件酬載仍會
  保持多訊息形式。

## 論壇頻道

Discord 論壇和媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父頻道（`channel:<forumId>`）以自動建立討論串。討論串標題會使用訊息的第一個非空白行。
- 使用 `openclaw message thread create` 直接建立討論串。論壇頻道請勿傳入 `--message-id`。

範例：傳送到論壇父頻道以建立討論串

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

範例：明確建立論壇討論串

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

論壇父頻道不接受 Discord 元件。如果需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援代理訊息使用 Discord components v2 容器。請使用帶有 `components` 酬載的訊息工具。互動結果會以一般傳入訊息的形式路由回代理，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或一個選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取項目和表單在過期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不符合的使用者會收到一則暫時性拒絕訊息。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，提供供應商、模型和相容執行階段下拉選單，以及提交步驟。`/models add` 已棄用，現在會傳回棄用訊息，而不是從聊天註冊模型。選擇器回覆是暫時性的，且只有呼叫的使用者可以使用。Discord 選取選單限制為 25 個選項，因此當你希望選擇器僅顯示特定供應商（例如 `openai-codex` 或 `vllm`）動態探索到的模型時，請將 `provider/*` 項目加入 `agents.defaults.models`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應符合附件參照時，使用 `filename` 覆寫上傳名稱

Modal 表單：

- 加入最多 5 個欄位的 `components.modal`
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
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中被提示進行配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 僅套用至 `default` 帳號。
    - 對於單一帳號，`allowFrom` 的優先順序高於舊版 `dm.allowFrom`。
    - 具名帳號在自己的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍會為了相容性而讀取。`openclaw doctor --fix` 會在不改變存取權的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    傳送用的 DM 目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但帳號有效 DM `allowFrom` 中列出的 ID 會為了相容性而視為使用者 DM 目標。

  </Tab>

  <Tab title="Access groups">
    Discord DM 和文字命令授權可以使用 `channels.discord.allowFrom` 中的動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。若靜態群組的成員以各頻道一般的 `allowFrom` 語法表示，請使用 `type: "message.senders"`；若 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格，請使用 `type: "discord.channelAudience"`。共用存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 將成員資格建模為：DM 傳送者是已設定伺服器的成員，且在套用角色和頻道覆寫後，目前對已設定頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何看得到 `#maintainers` 的人私訊機器人，同時對其他所有人保持 DM 關閉。

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

    你可以混合動態和靜態項目：

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

    查詢會在失敗時關閉存取。如果 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，DM 傳送者會被視為未授權。

    使用頻道受眾存取群組時，請在 Discord Developer Portal 為機器人啟用 **Server Members Intent**。DM 不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="Guild policy">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準是 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 可選的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅角色 ID）；如果設定任一者，傳送者符合 `users` 或 `roles` 時即允許
    - 直接名稱/標籤比對預設停用；只有在緊急相容模式下才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 更安全；使用名稱/標籤項目時，`openclaw security audit` 會發出警告
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

    如果你只設定 `DISCORD_BOT_TOKEN` 而未建立 `channels.discord` 區塊，執行階段後援會是 `groupPolicy="allowlist"`（記錄中會有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設需要提及。

    提及偵測包括：

    - 明確的機器人提及
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆機器人行為

    撰寫傳出的 Discord 訊息時，請使用標準提及語法：使用 `<@USER_ID>` 提及使用者，使用 `<#CHANNEL_ID>` 提及頻道，使用 `<@&ROLE_ID>` 提及角色。請勿使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 會依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇丟棄提及另一位使用者/角色但未提及機器人的訊息（排除 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選擇透過 `dm.groupChannels` 設定允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 伺服器成員路由到不同代理。以角色為基礎的繫結只接受角色 ID，並會在對等或父對等繫結之後、僅伺服器繫結之前評估。如果繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須符合。

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

## 原生命令與命令驗證

- `commands.native` 預設為 `"auto"`，且已針對 Discord 啟用。
- 每個頻道的覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前註冊的命令可能仍會在 Discord 中可見，直到你從 Discord 應用程式移除它們。
- 原生命令驗證使用與一般訊息處理相同的 Discord 允許清單/政策。
- 對未獲授權的使用者，命令可能仍會在 Discord UI 中可見；執行時仍會強制套用 OpenClaw 驗證，並傳回「未授權」。

請參閱[斜線命令](/zh-TW/tools/slash-commands)，了解命令目錄與行為。

預設斜線命令設定：

- `ephemeral: true`

## 功能詳細資訊

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord 支援代理輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）
    - `first`
    - `all`
    - `batched`

    注意：`off` 會停用隱含回覆串接。明確的 `[[reply_to_*]]` 標籤仍會被遵循。
    `first` 一律將隱含的原生回覆參照附加到該回合的第一則外送 Discord 訊息。
    `batched` 只有在傳入回合是多則訊息的防抖批次時，才會附加 Discord 的隱含原生回覆參照。這在你希望原生回覆主要用於含糊的爆量聊天，而不是每個單一訊息回合時很有用。

    訊息 ID 會浮現在內容/歷史記錄中，讓代理可以鎖定特定訊息。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯它來串流草稿回覆。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（預設）。`progress` 會保留一則可編輯的狀態草稿，並用工具進度更新它直到最終交付；共用的起始標籤是一行滾動文字，因此一旦出現足夠工作內容，它就會像其餘內容一樣捲動離開。`streamMode` 是舊版執行階段別名。執行 `openclaw doctor --fix`，將持久化組態改寫為標準鍵。

    將 `channels.discord.streaming.mode` 設為 `off` 可停用 Discord 預覽編輯。如果明確啟用 Discord 區塊串流，OpenClaw 會略過預覽串流以避免雙重串流。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` 會在權杖抵達時編輯單一預覽訊息。
    - `block` 會發出草稿大小的區塊（使用 `draftChunk` 調整大小與中斷點，並限制在 `textChunkLimit` 內）。
    - 媒體、錯誤，以及明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - 工具/進度列會在可用時呈現為精簡的表情符號 + 標題 + 詳細資訊，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制精簡進度列中的命令/執行詳細資訊：`raw`（預設）或 `status`（僅工具標籤）。

    隱藏原始命令/執行文字，同時保留精簡進度列：

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

    預覽串流僅支援文字；媒體回覆會回退為一般交付。明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    伺服器歷史內容：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    執行緒行為：

    - Discord 執行緒會作為頻道工作階段路由，並繼承父頻道組態，除非被覆寫。
    - 執行緒工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅模型的後援；執行緒本機的 `/model` 選擇仍優先，而且除非啟用轉錄繼承，否則不會複製父轉錄歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動執行緒選擇從父轉錄播種。每個帳戶的覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會以**不受信任**的內容注入。允許清單會限制誰可以觸發代理，而不是完整的補充內容遮蔽邊界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以將執行緒繫結到工作階段目標，讓該執行緒中的後續訊息持續路由到相同工作階段（包含子代理工作階段）。

    命令：

    - `/focus <target>` 將目前/新的執行緒繫結到子代理/工作階段目標
    - `/unfocus` 移除目前的執行緒繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新聚焦繫結的不活動自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新聚焦繫結的硬性最大存留期

    組態：

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

    - `session.threadBindings.*` 設定全域預設值。
    - `channels.discord.threadBindings.*` 覆寫 Discord 行為。
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 與 ACP 執行緒產生的自動建立/繫結執行緒。預設：`true`。
    - `defaultSpawnContext` 控制執行緒繫結產生的原生子代理內容。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果帳戶停用執行緒繫結，`/focus` 與相關執行緒繫結操作將不可用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[組態參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    對於穩定的「永遠開啟」ACP 工作區，請設定頂層具型別 ACP 繫結，目標為 Discord 對話。

    組態路徑：

    - `bindings[]` 搭配 `type: "acp"` 與 `match.channel: "discord"`

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

    注意事項：

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或執行緒，並讓未來訊息保留在相同 ACP 工作階段。執行緒訊息會繼承父頻道繫結。
    - 在已繫結的頻道或執行緒中，`/new` 與 `/reset` 會就地重設相同 ACP 工作階段。暫時執行緒繫結可在作用中時覆寫目標解析。
    - `spawnSessions` 會控管透過 `--thread auto|here` 建立/繫結子執行緒。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)，了解繫結行為詳細資訊。

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
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Discord 接受 Unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用頻道或帳戶的反應。

  </Accordion>

  <Accordion title="Config writes">
    頻道發起的組態寫入預設啟用。

    這會影響 `/config set|unset` 流程（啟用命令功能時）。

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
    使用 `channels.discord.proxy`，透過 HTTP(S) Proxy 路由 Discord Gateway WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    每個帳戶覆寫：

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

    注意事項：

    - 允許清單可以使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，成員顯示名稱才會依名稱/slug 比對
    - 查詢使用原始訊息 ID，且受時間視窗限制
    - 如果查詢失敗，代理訊息會被視為 Bot 訊息並被丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    當代理需要對已知 Discord 使用者進行確定性的外送提及時，請使用 `mentionAliases`。鍵是不含前導 `@` 的控制代碼；值是 Discord 使用者 ID。未知控制代碼、`@everyone`、`@here`，以及 Markdown 程式碼跨距內的提及會保持不變。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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

    活動類型對應：

    - 0：正在玩
    - 1：正在串流（需要 `activityUrl`）
    - 2：正在聆聽
    - 3：正在觀看
    - 4：自訂（使用活動文字作為狀態內容；emoji 為選用）
    - 5：正在競賽

    自動上線狀態範例（執行階段健康狀態訊號）：

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

    自動上線狀態會將執行階段可用性對應到 Discord 狀態：healthy => online、degraded 或 unknown => idle、exhausted 或 unavailable => dnd。可選的文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在 DM 中以按鈕處理核准，也可選擇在發起的頻道中張貼核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可以解析出一位核准者時，Discord 會自動啟用原生 exec 核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷 exec 核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的僅限擁有者群組命令，OpenClaw 會私下傳送核准提示與最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord DM；若無法使用，則會回退到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到臨時拒絕訊息。核准提示包含命令文字，因此只應在受信任的頻道中啟用頻道傳遞。若無法從工作階段金鑰推導出頻道 ID，OpenClaw 會回退到 DM 傳遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 轉接器主要新增核准者 DM 路由和頻道扇出。
    當這些按鈕存在時，它們就是主要的核准 UX；OpenClaw
    只有在工具結果表示聊天核准不可用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    若 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。若
    執行階段已啟用，但無法將原生卡片傳遞到任何目標，
    OpenClaw 會在同一聊天中傳送回退通知，並包含待處理核准中的確切 `/approve`
    命令。

    Gateway 驗證與核准解析遵循共用 Gateway 用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後過期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作包含傳訊、頻道管理、審核、上線狀態和中繼資料動作。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 上線狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定排定事件的封面圖片。

動作閘門位於 `channels.discord.actions.*` 之下。

預設閘門行為：

| 動作群組                                                                                                                                                             | 預設值  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已啟用  |
| roles                                                                                                                                                                    | 已停用 |
| moderation                                                                                                                                                               | 已停用 |
| presence                                                                                                                                                                 | 已停用 |

## 元件 v2 UI

OpenClaw 使用 Discord 元件 v2 進行 exec 核准和跨情境標記。Discord 訊息動作也可以接受 `components` 以建立自訂 UI（進階；需要透過 discord 工具建構元件酬載），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord 元件容器使用的強調色（hex）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 依帳戶設定。
- 當元件 v2 存在時，`embeds` 會被忽略。

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

Discord 有兩種不同的語音介面：即時 **語音頻道**（連續對話）和 **語音訊息附件**（波形預覽格式）。Gateway 兩者皆支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scope 邀請 bot。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳戶預設代理，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

若要在加入前檢查 bot 的有效權限，請執行：

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
        model: "openai-codex/gpt-5.5",
        autoJoin: [
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

注意事項：

- `voice.tts` 只會針對 `stt-tts` 語音播放覆寫 `messages.tts`。即時模式使用 `voice.realtime.voice`。
- `voice.mode` 控制對話路徑。預設為 `agent-proxy`：即時語音前端會處理輪次時機、中斷與播放，透過 `openclaw_agent_consult` 將實質工作委派給路由後的 OpenClaw agent，並將結果視為該說話者輸入的 Discord 文字提示。`stt-tts` 保留較舊的批次 STT 加 TTS 流程。`bidi` 讓即時模型直接對話，同時公開 `openclaw_agent_consult` 給 OpenClaw brain 使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話接收語音輪次。若要使用語音頻道自己的工作階段，請保持未設定；或設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道成為現有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風/喇叭延伸。
- `voice.model` 會覆寫 Discord 語音回應與即時 consult 所用的 OpenClaw agent brain。保持未設定即可繼承路由後的 agent 模型。它與 `voice.realtime.model` 分開。
- `agent-proxy` 透過 `discord-voice` 路由語音，這會保留說話者與目標工作階段的一般擁有者/工具授權，但會隱藏 agent 的 `tts` 工具，因為 Discord 語音負責播放。預設情況下，`agent-proxy` 會讓擁有者說話者的 consult 取得完整的擁有者等效工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在提供實質答案前先 consult OpenClaw agent（`voice.realtime.consultPolicy: "always"`）。在這個預設的 `always` 模式中，即時層不會在 consult 答案前自動朗讀填充內容；它會擷取並轉錄語音，然後朗讀路由後的 OpenClaw 答案。如果多個強制 consult 答案在 Discord 仍播放第一個答案時完成，後續的精確語音答案會排入佇列，等到播放閒置後才播放，而不是在句子中途取代語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 與 `voice.realtime.voice` 會設定即時音訊工作階段。若要使用 OpenAI Realtime 2 加上 Codex brain，請使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai-codex/gpt-5.5"`。
- OpenAI 即時提供者接受目前的 Realtime 2 事件名稱，以及與舊版 Codex 相容的輸出音訊與轉錄事件別名，因此相容的提供者快照即使產生差異，也不會丟失助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷正在進行的即時播放。若未設定，它會跟隨即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前，助理播放的最短持續時間。預設值：`250`。在低回音房間中設定為 `0` 可立即中斷，或在回音較重的喇叭設定中提高此值。
- 若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.openai.voice` 或 `voice.tts.providers.openai.voice` 下選擇文字轉語音聲音。在目前的 OpenAI TTS 模型上，`cedar` 是不錯的男性聲線選擇。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄輪次。
- 語音轉錄輪次會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態；非擁有者說話者無法存取僅限擁有者的工具（例如 `gateway` 和 `cron`）。
- Discord 語音對純文字設定採選用制；設定 `channels.discord.voice.enabled=true`（或保留現有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段，以及 `GuildVoiceStates` Gateway intent。
- `channels.discord.intents.voiceStates` 可以明確覆寫語音狀態 intent 訂閱。保持未設定即可讓 intent 跟隨有效的語音啟用狀態。
- 如果 `voice.autoJoin` 對同一個 guild 有多個項目，OpenClaw 會加入該 guild 最後設定的頻道。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞給 `@discordjs/voice` 加入選項。
- 如果未設定，`@discordjs/voice` 的預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 預設對 Discord 語音接收使用純 JS `opusscript` 解碼器。選用的原生 `@discordjs/opus` 套件會被 repo pnpm 安裝政策忽略，因此一般安裝、Docker lane 與無關測試不會編譯原生 addon。專用語音效能主機可在安裝原生 addon 後，以 `OPENCLAW_DISCORD_OPUS_DECODER=native` 選用。
- `voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試時，初始 `@discordjs/voice` Ready 等待時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待它開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因另一位使用者開始說話而停止。為避免回饋迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放完成後再說話以進入下一輪。即時模式會將說話者開始事件作為插話訊號轉送給即時提供者。
- 在即時模式中，喇叭聲音回灌到開啟的麥克風，可能看起來像插話並中斷播放。對於回音較重的 Discord 房間，設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，可避免 OpenAI 在輸入音訊上自動中斷。如果你仍希望 Discord 說話者開始事件中斷正在進行的播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音/雜訊並忽略，記錄為已略過，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 Discord 回報說話者停止後，OpenClaw 在完成該 STT 音訊片段前等待多久。預設值：`2500`；如果 Discord 將正常停頓切成不連貫的部分轉錄，請提高此值。
- 當 ElevenLabs 是選取的 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者回應串流開始播放。不支援串流的提供者會退回到合成暫存檔路徑。
- OpenClaw 也會監看接收解密失敗，並在短時間內反覆失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收日誌反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告和日誌。內建的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游 padding 修正，該修正已關閉 discord.js issue #11419。
- OpenClaw 完成擷取的說話者片段時，預期會出現 `The operation was aborted` 接收事件；它們是詳細診斷資訊，不是警告。
- 詳細 Discord 語音日誌會為每個接受的說話者片段包含一行有界的 STT 轉錄預覽，因此除錯時可同時看到使用者端與 agent 回覆端，而不會傾印無界的轉錄文字。
- 在 `agent-proxy` 模式中，強制 consult 備援會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字，或像 `and` 這類尾端連接詞，以及明顯不可操作的結束語，例如「馬上回來」或「再見」。當這防止過時的佇列答案時，日誌會顯示 `forced agent consult skipped reason=...`。

來源 checkout 的原生 opus 設定：

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

當你想使用上游 macOS arm64 預建原生 addon 時，Gateway 請使用 Node 22。如果你使用其他 Node 執行階段，選用安裝器可能需要本機 `node-gyp` 原始碼建置工具鏈。

安裝原生 addon 後，使用下列命令啟動 Gateway：

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

詳細語音日誌應顯示 `discord voice: opus decoder: @discordjs/opus`。若沒有 env 選用，或原生 addon 缺失或無法在主機上載入，OpenClaw 會記錄 `discord voice: opus decoder: opusscript`，並透過純 JS 備援繼續接收語音。

STT 加 TTS pipeline：

- Discord PCM 擷取會轉換為 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄會透過 Discord ingress 與路由傳送，而回應 LLM 會以語音輸出政策執行，該政策隱藏 agent 的 `tts` 工具並要求回傳文字，因為 Discord 語音負責最終的 TTS 播放。
- 設定 `voice.model` 時，它只會覆寫此語音頻道輪次的回應 LLM。
- `voice.tts` 會合併覆寫 `messages.tts`；支援串流的提供者會直接餵給播放器，否則會播放產生的音訊檔到已加入的頻道。

預設 agent-proxy 語音頻道工作階段範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得自己的路由後 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段對話。即時模型只是語音前端；實質請求會交給設定的 OpenClaw agent。如果即時模型在未呼叫 consult 工具的情況下產生最終轉錄，OpenClaw 會強制 consult 作為備援，因此預設行為仍像是在與 agent 對話。

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

即時 bidi 範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

語音作為現有 Discord 頻道工作階段延伸的範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式中，bot 會加入設定的語音頻道，但 OpenClaw agent 輪次會使用目標頻道的一般路由工作階段與 agent。即時語音工作階段會將回傳結果朗讀回語音頻道。Supervisor agent 仍可依其工具政策使用一般訊息工具，包括在那是正確動作時傳送另一則 Discord 訊息。

實用的目標形式：

- `target: "channel:123456789012345678"` 透過 Discord 文字頻道工作階段路由。
- `target: "123456789012345678"` 會被視為頻道目標。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 會透過該直接訊息工作階段路由。

回音較重的 OpenAI Realtime 範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

當模型會透過開啟的麥克風聽到自己的 Discord 播放音訊，但你仍希望透過說話打斷它時，請使用此設定。OpenClaw 會阻止 OpenAI 根據原始輸入音訊自動中斷，而 `bargeIn: true` 會讓 Discord 說話者開始事件和已啟用的說話者音訊，在下一個擷取的回合抵達 OpenAI 之前取消作用中的即時回應。若非常早期的插話訊號其 `audioEndMs` 低於 `minBargeInAudioEndMs`，會被視為可能的回音或雜訊並忽略，避免模型在第一個播放影格時就被截斷。

預期的語音記錄：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時啟動時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 說話者音訊時：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 跳過過期語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止或重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時諮詢時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Agent 回答時：`discord voice: agent turn answer ...`
- 精確語音排入佇列時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音或雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 播放閒置時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊被截斷，請將即時語音記錄視為時間軸閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。橋接器會從這一點開始計算助理輸出區塊、Discord PCM 位元組、提供者即時位元組，以及合成音訊時長。
2. `realtime speaker turn opened` 標示某位 Discord 說話者變為作用中。如果播放已經作用中且 `bargeIn` 已啟用，後面可能會出現 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標示該說話者回合收到第一個實際音訊影格。此處的 `outputActive=true` 或非零 `outputAudioMs` 表示麥克風在助理播放仍作用中時傳送輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放作用中時看到了即時說話者音訊。這有助於區分真正的中斷，與沒有可用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求即時提供者取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，因此你可以看到中斷前實際已播放多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放重設點。原因會指出是誰停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 會摘要擷取到的輸入回合。`chunks=0` 或 `hasAudio=false` 表示說話者回合已開啟，但沒有可用音訊抵達即時橋接器。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：在該記錄行之前，由即時提供者產生的助理音訊時長。
- `audioMs`：在播放停止前，OpenClaw 計算到的助理音訊時長。
- `elapsedMs`：開啟和關閉播放串流或說話者回合之間的實際經過時間。
- `discordBytes`：傳送至 Discord 語音或從其接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送至即時提供者或從其接收的提供者格式 PCM 位元組。
- `playbackChunks`：針對作用中回應轉送至 Discord 的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取到的說話者音訊影格與說話者回合關閉之間的間隔。

常見模式：

- 若立即截斷並伴隨 `source=active-speaker-audio`、很小的 `outputAudioMs`，且同一位使用者在附近，通常表示喇叭回音進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低喇叭音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false` 表示 Discord 回報說話者開始，但沒有音訊抵達 OpenClaw。這可能是暫時性的 Discord 語音事件、雜訊閘行為，或用戶端短暫觸發麥克風。
- `audio playback stopped reason=stream-close` 且附近沒有插話或 `provider-clear-audio`，表示本機 Discord 播放串流意外結束。請檢查前面的提供者和 Discord 播放器記錄。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊作用中時刻意丟棄輸入。如果你希望語音中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供者 VAD 回報有語音，但 OpenClaw 沒有可中斷的作用中播放。這不應截斷音訊。

憑證會依元件解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`/`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或提供者的一般驗證設定使用即時提供者驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要 Gateway 主機上的 `ffmpeg` 和 `ffprobe` 來檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕在同一個承載中同時包含文字和語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="使用了不允許的意圖，或 Bot 看不到伺服器訊息">

    - 啟用 Message Content Intent
    - 當你依賴使用者/成員解析時，啟用 Server Members Intent
    - 變更意圖後重新啟動 Gateway

  </Accordion>

  <Accordion title="伺服器訊息意外遭封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的伺服器允許清單
    - 如果伺服器 `channels` 對應存在，則只允許列出的頻道
    - 驗證 `requireMention` 行為與提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 為 false 但仍被封鎖">
    常見原因：

    - `groupPolicy="allowlist"`，但沒有相符的伺服器/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者遭伺服器/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 佇列調整項：

    - 單帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord Gateway 監聽器工作，不控制 Agent 回合存續時間

    Discord 不會將頻道擁有的逾時套用到已排入佇列的 Agent 回合。訊息監聽器會立即交接，而排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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

  <Accordion title="Gateway 中繼資料查詢逾時警告">
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回使用 Discord 的預設 Gateway URL，且記錄會進行速率限制。

    中繼資料逾時調整項：

    - 單帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定未指定時的 env 後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway READY 逾時重新啟動">
    OpenClaw 會在啟動期間及執行階段重新連線後，等待 Discord 的 Gateway `READY` 事件。具備啟動錯開機制的多帳號設定，可能需要比預設值更長的啟動 READY 時間窗口。

    READY 逾時調整項：

    - 啟動單帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定未指定時的啟動 env 後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定未指定時的執行階段 env 後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 和配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="Bot 對 Bot 迴圈">
    預設會忽略 Bot 作者的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該機器人的機器人訊息。

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis 只會在其他機器人提及她時監聽它們。
          allowBots: "mentions",
        },
        molty: {
          // Molty 會監聽所有由機器人發出的 Discord 訊息。
          allowBots: true,
          mentionAliases: {
            // 讓 Molty 能寫入 "@Mantis" 並傳送真正的 Discord 提及。
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Voice STT 因 DecryptionFailed(...) 而中斷">

    - 保持 OpenClaw 為最新版本（`openclaw update`），確保 Discord 語音接收復原邏輯可用
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，只有在需要時才調整
    - 查看日誌中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後失敗仍持續，請收集日誌，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史記錄比對

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 指令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- gateway：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史記錄：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳送：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制傳出的 Discord 上傳，預設為 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態呈現：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全性與操作

- 將機器人權杖視為秘密（受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 如果指令部署/狀態過期，請重新啟動 gateway，並使用 `openclaw channels status --probe` 重新檢查。

## 相關內容

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到 gateway。
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
    將 guild 與頻道對應到代理。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為。
  </Card>
</CardGroup>
