---
read_when:
    - 開發 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

已準備好透過官方 Discord gateway 用於 DM 和伺服器頻道。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Discord DM 預設會進入配對模式。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為與指令目錄。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

你需要建立一個帶有機器人的新應用程式、將機器人加入你的伺服器，並將它與 OpenClaw 配對。建議將你的機器人加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="Create a Discord application and bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後按一下 **New Application**。將它命名為類似「OpenClaw」的名稱。

    按一下側邊欄中的 **Bot**。將 **Username** 設為你對 OpenClaw agent 的稱呼。

  </Step>

  <Step title="Enable privileged intents">
    仍在 **Bot** 頁面上，向下捲動到 **Privileged Gateway Intents**，並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱對 ID 比對需要）
    - **Presence Intent**（選用；只有狀態更新需要）

  </Step>

  <Step title="Copy your bot token">
    在 **Bot** 頁面向上捲回，然後按一下 **Reset Token**。

    <Note>
    雖然名稱如此，這會產生你的第一個 token，並不是真的在「重設」任何東西。
    </Note>

    複製 token 並儲存在某處。這是你的 **Bot Token**，稍後會需要用到。

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    按一下側邊欄中的 **OAuth2**。你將產生一個具備正確權限的邀請 URL，用來將機器人加入你的伺服器。

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

    這是一般文字頻道的基準權限組合。如果你打算在 Discord 討論串中發文，包括會建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後按一下 **Continue** 以連線。你現在應該會在 Discord 伺服器中看到你的機器人。

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    回到 Discord 應用程式，你需要啟用 Developer Mode，才能複製內部 ID。

    1. 按一下 **User Settings**（你頭像旁的齒輪圖示）→ **Advanced** → 開啟 **Developer Mode**
    2. 在側邊欄中的 **server icon** 上按右鍵 → **Copy Server ID**
    3. 在你的 **own avatar** 上按右鍵 → **Copy User ID**

    將你的 **Server ID** 和 **User ID** 與 Bot Token 一起保存，下一步你會將這三者傳送給 OpenClaw。

  </Step>

  <Step title="Allow DMs from server members">
    若要讓配對運作，Discord 需要允許你的機器人傳送 DM 給你。在你的 **server icon** 上按右鍵 → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括機器人）能傳送 DM 給你。如果你想透過 Discord DM 使用 OpenClaw，請保持啟用。如果你只打算使用伺服器頻道，可以在配對後停用 DM。

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    你的 Discord 機器人 token 是機密（類似密碼）。在傳訊給你的 agent 之前，請先在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已經以背景服務執行，請透過 OpenClaw Mac app 重新啟動，或停止並重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後可以解析 env SecretRef。
    如果你的主機遭 Discord 的啟動應用程式查詢封鎖或限速，請從 Developer Portal 設定 Discord application/client ID，讓啟動流程可以略過該 REST 呼叫。預設帳戶請使用 `channels.discord.applicationId`；若你執行多個 Discord 機器人，請使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        在任何現有頻道（例如 Telegram）與你的 OpenClaw agent 聊天並告訴它。如果 Discord 是你的第一個頻道，請改用 CLI / config 分頁。

        >「我已經在 config 中設定 Discord 機器人 token。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
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

        預設帳戶的 env 後援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於腳本化或遠端設定，使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不帶 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec provider 的 SecretRef 值。請參閱[Secrets Management](/zh-TW/gateway/secrets)。

        若有多個 Discord 機器人，請將每個機器人 token 和應用程式 ID 放在其帳戶底下。頂層 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都應使用相同應用程式 ID 時，才在那裡設定。

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

  <Step title="Approve first DM pairing">
    等到 gateway 執行後，在 Discord 中私訊你的機器人。它會回覆一組配對碼。

    <Tabs>
      <Tab title="Ask your agent">
        在你現有的頻道中將配對碼傳送給你的 agent：

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
Token 解析會感知帳戶。Config token 值優先於 env 後援。`DISCORD_BOT_TOKEN` 只會用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析到相同的機器人 token，OpenClaw 只會為該 token 啟動一個 gateway 監視器。來自 config 的 token 優先於預設 env 後援；否則第一個已啟用帳戶勝出，重複的帳戶會被回報為已停用。
對於進階的對外呼叫（message tool/channel actions），明確的逐次呼叫 `token` 會用於該呼叫。這適用於 send 與 read/probe 類動作（例如 read/search/fetch/thread/pins/permissions）。帳戶 policy/retry 設定仍然來自作用中執行階段快照中選取的帳戶。
</Note>

## 建議：設定伺服器工作區

DM 正常運作後，你可以將 Discord 伺服器設定為完整工作區，其中每個頻道都有自己的 agent session 與獨立 context。這建議用於只有你和機器人的私人伺服器。

<Steps>
  <Step title="Add your server to the guild allowlist">
    這會讓你的 agent 能在伺服器上的任何頻道回應，而不只是 DM。

    <Tabs>
      <Tab title="Ask your agent">
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

  <Step title="Allow responses without @mention">
    預設情況下，你的 agent 只有在伺服器頻道中被 @提及時才會回應。對於私人伺服器，你可能會希望它回應每則訊息。

    在伺服器頻道中，一般 assistant 最終回覆預設保持私密。可見的 Discord 輸出必須透過 `message` tool 明確傳送，因此 agent 預設可以旁觀，並只在判斷頻道回覆有用時才發文。

    這代表所選模型必須可靠地呼叫工具。如果 Discord 顯示正在輸入，且記錄顯示 token 用量，但沒有發出訊息，請檢查 session log 中是否有 `didSendViaMessagingTool: false` 的 assistant 文字。這表示模型產生的是私密的最終答案，而不是呼叫 `message(action=send)`。請切換到更強的工具呼叫模型，或使用下方 config 還原舊版自動最終回覆。

    <Tabs>
      <Tab title="Ask your agent">
        >「允許我的 agent 在這個伺服器上回應，而不需要被 @提及」
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

        若要為群組/頻道 room 還原舊版自動最終回覆，請設定 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    預設情況下，長期記憶（MEMORY.md）只會在 DM session 中載入。伺服器頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="Ask your agent">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期 context，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="Manual">
        如果你需要在每個頻道中共用 context，請將穩定的指示放在 `AGENTS.md` 或 `USER.md`（它們會注入每個 session）。將長期筆記保存在 `MEMORY.md`，並在需要時使用 memory tools 存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的 agent 可以看到頻道名稱，而且每個頻道都有自己的隔離 session，因此你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- Gateway 擁有 Discord 連線。
- 回覆路由是確定性的：Discord 入站回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的
  情境加入模型提示，而不是作為使用者可見的回覆前綴。如果模型將該封套
  複製回來，OpenClaw 會從出站回覆和
  未來的重播情境中移除被複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理的主要工作階段（`agent:main:main`）。
- 伺服器頻道使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組私訊預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 到已路由的對話工作階段。
- 純文字 cron/heartbeat 對 Discord 的公告傳送，只會使用一次最終的
  助理可見答案。當代理發出多個可傳送承載時，媒體和結構化元件承載仍會
  保持為多則訊息。

## 論壇頻道

Discord 論壇和媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用你訊息中的第一個非空白行。
- 使用 `openclaw message thread create` 直接建立討論串。請勿對論壇頻道傳入 `--message-id`。

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

OpenClaw 支援用於代理訊息的 Discord 元件 v2 容器。請使用訊息工具並帶上 `components` 承載。互動結果會作為一般入站訊息路由回代理，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件為一次性使用。設定 `components.reusable=true` 可允許按鈕、選取項目和表單在到期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不符合的使用者會收到一則僅自己可見的拒絕訊息。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含提供者、模型和相容執行階段下拉選單，以及提交步驟。`/models add` 已棄用，現在會回傳棄用訊息，而不是從聊天中註冊模型。選擇器回覆僅自己可見，且只有呼叫的使用者可以使用它。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱需要符合附件參照時，使用 `filename` 覆寫上傳名稱

模態表單：

- 新增 `components.modal`，最多可包含 5 個欄位
- 欄位類型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 會自動新增觸發按鈕

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
    `channels.discord.dmPolicy` 控制私訊存取。`channels.discord.allowFrom` 是正式的私訊允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果私訊政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中被提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用於 `default` 帳號。
    - 對單一帳號而言，`allowFrom` 的優先順序高於舊版 `dm.allowFrom`。
    - 具名帳號在自身的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    為了相容性，仍會讀取舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom`。`openclaw doctor --fix` 會在不變更存取權的前提下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    用於傳送的私訊目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當啟用頻道預設值時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效私訊 `allowFrom` 中的 ID 會為了相容性被視為使用者私訊目標。

  </Tab>

  <Tab title="DM access groups">
    Discord 私訊可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在各訊息頻道之間共用。對於成員以各頻道一般 `allowFrom` 語法表示的靜態群組，請使用 `type: "message.senders"`；當 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格時，請使用 `type: "discord.channelAudience"`。共用存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 會將成員資格建模為：私訊寄件者是已設定伺服器的成員，且在套用角色和頻道覆寫後，目前對已設定頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何可以看見 `#maintainers` 的人向機器人傳送私訊，同時對其他所有人關閉私訊。

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

    查詢會以失敗即關閉的方式處理。如果 Discord 回傳 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，該私訊寄件者會被視為未授權。

    使用頻道受眾存取群組時，請在 Discord Developer Portal 為機器人啟用 **Server Members Intent**。私訊不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析該成員。

  </Tab>

  <Tab title="Guild policy">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準為 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用的寄件者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅角色 ID）；如果設定其中任一項，寄件者符合 `users` 或 `roles` 時即允許
    - 直接名稱/標籤比對預設為停用；只有在緊急相容模式下才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 較安全；使用名稱/標籤項目時，`openclaw security audit` 會發出警告
    - 如果伺服器已設定 `channels`，未列出的頻道會被拒絕
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

    如果你只設定 `DISCORD_BOT_TOKEN` 而未建立 `channels.discord` 區塊，執行階段後援值會是 `groupPolicy="allowlist"`（並在日誌中警告），即使 `channels.defaults.groupPolicy` 是 `open` 也一樣。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設需要提及才會觸發。

    提及偵測包含：

    - 明確提及機器人
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆機器人行為

    撰寫出站 Discord 訊息時，請使用正式提及語法：使用 `<@USER_ID>` 表示使用者、`<#CHANNEL_ID>` 表示頻道，並使用 `<@&ROLE_ID>` 表示角色。請勿使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及其他使用者/角色但未提及機器人的訊息（不包含 @everyone/@here）。

    群組私訊：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可透過 `dm.groupChannels` 使用選用允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 伺服器成員路由到不同代理。以角色為基礎的繫結只接受角色 ID，並會在對等或父層對等繫結之後、僅伺服器繫結之前評估。如果繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須相符。

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

## 原生命令和命令驗證

- `commands.native` 預設為 `"auto"`，並已為 Discord 啟用。
- 每頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線指令註冊與清理。先前註冊的指令可能仍會在 Discord 中可見，直到你從 Discord app 移除它們。
- 原生指令驗證使用與一般訊息處理相同的 Discord 允許清單/政策。
- 對於未授權的使用者，指令可能仍會顯示在 Discord UI 中；執行時仍會強制套用 OpenClaw 驗證，並傳回「未授權」。

請參閱[斜線指令](/zh-TW/tools/slash-commands)了解指令目錄與行為。

預設斜線指令設定：

- `ephemeral: true`

## 功能詳細資料

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
    `first` 一律會將隱含的原生回覆參考附加到該回合的第一則外送 Discord 訊息。
    `batched` 只會在
    傳入回合是多則訊息的防抖批次時，附加 Discord 的隱含原生回覆參考。這在你主要想針對模糊的爆量聊天使用原生回覆，而不是每個
    單一訊息回合都使用時很有用。

    訊息 ID 會浮現在內容/歷史記錄中，讓代理可以鎖定特定訊息。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯該訊息來串流草稿回覆。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（預設）。`progress` 會保留一則可編輯的狀態草稿，並以工具進度更新它直到最終送達；`streamMode` 是舊版執行階段別名。執行 `openclaw doctor --fix`，將保存的設定改寫為標準鍵。

    將 `channels.discord.streaming.mode` 設為 `off` 可停用 Discord 預覽編輯。如果已明確啟用 Discord 區塊串流，OpenClaw 會略過預覽串流以避免雙重串流。

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

    - `partial` 會在 token 抵達時編輯單一預覽訊息。
    - `block` 會輸出草稿大小的區塊（使用 `draftChunk` 調整大小與斷點，並限制在 `textChunkLimit` 內）。
    - 媒體、錯誤與明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制精簡進度列中的指令/執行詳細資料：`raw`（預設）或 `status`（僅工具標籤）。

    隱藏原始指令/執行文字，同時保留精簡進度列：

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

    預覽串流僅支援文字；媒體回覆會退回一般送達。當已明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    伺服器歷史內容：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    DM 歷史記錄控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會作為頻道工作階段路由，並繼承父頻道設定，除非被覆寫。
    - 討論串工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅模型的後援；討論串本機的 `/model` 選擇仍有優先權，且除非啟用逐字稿繼承，否則不會複製父逐字稿歷史記錄。
    - `channels.discord.thread.inheritParent`（預設 `false`）讓新的自動討論串選擇從父逐字稿播種。每帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會以**不受信任**內容注入。允許清單會控管誰能觸發代理，而不是完整的補充內容遮蔽邊界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以將討論串繫結到工作階段目標，讓該討論串中的後續訊息持續路由到相同工作階段（包括子代理工作階段）。

    指令：

    - `/focus <target>` 將目前/新討論串繫結到子代理/工作階段目標
    - `/unfocus` 移除目前討論串繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新聚焦繫結的不活動自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新聚焦繫結的硬性最長存留時間

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

    - `session.threadBindings.*` 會設定全域預設值。
    - `channels.discord.threadBindings.*` 會覆寫 Discord 行為。
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 與 ACP 討論串產生的自動建立/繫結討論串。預設：`true`。
    - `defaultSpawnContext` 控制討論串繫結產生的原生子代理內容。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果帳號已停用討論串繫結，`/focus` 與相關討論串繫結操作將無法使用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    若要使用穩定且「永遠開啟」的 ACP 工作區，請設定頂層具型別的 ACP 繫結，以 Discord 對話為目標。

    設定路徑：

    - `bindings[]`，搭配 `type: "acp"` 與 `match.channel: "discord"`

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

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或討論串，並讓未來訊息保留在相同 ACP 工作階段。討論串訊息會繼承父頻道繫結。
    - 在已繫結的頻道或討論串中，`/new` 與 `/reset` 會就地重設相同 ACP 工作階段。暫時討論串繫結可在作用中時覆寫目標解析。
    - `spawnSessions` 會控管透過 `--thread auto|here` 建立/繫結子討論串。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)了解繫結行為詳細資料。

  </Accordion>

  <Accordion title="Reaction notifications">
    每伺服器反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換為系統事件，並附加到路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Discord 接受 unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某個頻道或帳號的反應。

  </Accordion>

  <Accordion title="Config writes">
    由頻道發起的設定寫入預設為啟用。

    這會影響 `/config set|unset` 流程（當指令功能已啟用時）。

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
    透過 HTTP(S) 代理搭配 `channels.discord.proxy` 路由 Discord gateway WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    每帳號覆寫：

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

    - 允許清單可使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID，並受時間範圍限制
    - 如果查詢失敗，代理訊息會被視為 bot 訊息並丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    當代理需要對已知 Discord 使用者進行確定性的外送提及時，請使用 `mentionAliases`。鍵是不含前置 `@` 的控制代碼；值是 Discord 使用者 ID。未知控制代碼、`@everyone`、`@here`，以及 Markdown 程式碼範圍內的提及都會保持不變。

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
    當你設定狀態或活動欄位，或啟用自動顯示狀態時，會套用顯示狀態更新。

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

    - 0：正在玩
    - 1：正在串流（需要 `activityUrl`）
    - 2：正在聆聽
    - 3：正在觀看
    - 4：自訂（使用活動文字作為狀態；表情符號為選用）
    - 5：正在競賽

    自動顯示狀態範例（執行階段健康訊號）：

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

    自動狀態會將執行階段可用性對應到 Discord 狀態：healthy => online、degraded 或 unknown => idle、exhausted 或 unavailable => dnd。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` placeholder）

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord 支援在 DM 中以按鈕處理核准，也可以選擇在來源頻道中發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可從 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出一位核准者時，Discord 會自動啟用原生 exec 核准。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom`，或 direct-message `defaultTo` 推斷 exec 核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的 owner-only 群組命令，OpenClaw 會私下傳送核准提示和最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord DM；若無法使用，則回退到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到短暫的拒絕訊息。核准提示包含命令文字，因此只有在可信任的頻道中才應啟用頻道傳遞。若無法從 session key 推導出頻道 ID，OpenClaw 會回退到 DM 傳遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord adapter 主要新增核准者 DM 路由和頻道 fanout。
    當這些按鈕存在時，它們是主要的核准 UX；OpenClaw
    只有在工具結果表示聊天核准無法使用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機 deterministic `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但原生卡片無法傳遞到任何目標，
    OpenClaw 會在同一聊天中傳送備援通知，內含待處理核准中的確切 `/approve`
    命令。

    Gateway 驗證和核准解析遵循共用 Gateway client contract（`plugin:` ID 會透過 `plugin.approval.resolve` 解析；其他 ID 會透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後過期。

    請參閱 [Exec approvals](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作包含訊息、頻道管理、管理、狀態與中繼資料動作。

核心範例：

- 訊息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- reactions：`react`、`reactions`、`emojiList`
- 管理：`timeout`、`kick`、`ban`
- 狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定預定活動封面圖片。

動作閘門位於 `channels.discord.actions.*` 下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw 會將 Discord components v2 用於 exec 核准和跨情境標記。Discord 訊息動作也可以接受 `components` 以提供自訂 UI（進階；需要透過 discord 工具建構 component payload），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 會設定 Discord component 容器使用的強調色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 逐帳號設定。
- 當 components v2 存在時，`embeds` 會被忽略。

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

Discord 有兩種不同的語音介面：即時 **voice channels**（連續對話）和 **voice message attachments**（波形預覽格式）。gateway 兩者都支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色/使用者 allowlist 時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scope 邀請 bot。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制 session。該命令使用帳號的預設 agent，並遵循與其他 Discord 命令相同的 allowlist 和群組 policy 規則。

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
        model: "openai/gpt-5.4-mini",
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
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

注意：

- `voice.tts` 只會覆寫語音播放的 `messages.tts`。
- `voice.model` 只會覆寫 Discord 語音頻道回應使用的 LLM。保持未設定即可繼承已路由的 agent model。
- STT 使用 `tools.media.audio`；`voice.model` 不影響轉錄。
- 逐頻道 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音 transcript turns。
- 語音 transcript turns 會從 Discord `allowFrom`（或 `dm.allowFrom`）衍生擁有者狀態；非擁有者說話者無法存取 owner-only 工具（例如 `gateway` 和 `cron`）。
- Discord 語音對純文字設定採 opt-in；設定 `channels.discord.voice.enabled=true`（或保留既有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段和 `GuildVoiceStates` gateway intent。
- `channels.discord.intents.voiceStates` 可以明確覆寫 voice-state intent 訂閱。保持未設定時，intent 會依有效的語音啟用狀態而定。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞到 `@discordjs/voice` join options。
- 若未設定，`@discordjs/voice` 預設為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間。預設：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在中斷連線的語音 session 開始重新連線前，等待多久才銷毀它。預設：`15000`。
- 語音播放不會只因為另一位使用者開始說話而停止。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放結束後再說話以進入下一輪。
- `voice.captureSilenceGraceMs` 控制 Discord 回報說話者停止後，OpenClaw 等待多久才會完成該音訊片段並送往 STT。預設：`2500`；若 Discord 將正常停頓切成不連貫的部分 transcript，請提高此值。
- 當 ElevenLabs 是選定的 TTS provider 時，Discord 語音播放會使用 streaming TTS，並從 provider response stream 開始。不支援 streaming 的 provider 會回退到合成的暫存檔路徑。
- OpenClaw 也會監看接收解密失敗，並在短時間內反覆失敗後透過離開/重新加入語音頻道自動復原。
- 如果更新後接收記錄反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集 dependency report 和 logs。隨附的 `@discordjs/voice` line 包含 discord.js PR #11449 的 upstream padding fix，該修正關閉了 discord.js issue #11419。
- `The operation was aborted` receive events 是 OpenClaw 完成擷取說話者片段時的預期事件；它們是詳細診斷，而非警告。

語音頻道 pipeline：

- Discord PCM 擷取會轉換為 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- transcript 會透過 Discord ingress 和 routing 傳送，同時 response LLM 會以 voice-output policy 執行，該 policy 會隱藏 agent `tts` 工具並要求回傳文字，因為 Discord 語音擁有最終 TTS 播放。
- 設定 `voice.model` 時，只會覆寫此語音頻道回合的 response LLM。
- `voice.tts` 會合併到 `messages.tts` 之上；支援 streaming 的 provider 會直接供給 player，否則會在已加入的頻道中播放產生的音訊檔。

憑證會依 component 解析：`voice.model` 的 LLM route auth、`tools.media.audio` 的 STT auth，以及 `messages.tts`/`voice.tts` 的 TTS auth。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但 gateway host 上需要 `ffmpeg` 和 `ffprobe` 來檢查和轉換。

- 提供 **本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一 payload 中同時包含文字 + 語音訊息）。
- 任何音訊格式都可接受；OpenClaw 會視需要轉換為 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - 啟用 Message Content Intent
    - 當你依賴使用者/成員解析時，啟用 Server Members Intent
    - 變更 intents 後重新啟動 gateway

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的 guild allowlist
    - 如果 guild `channels` map 存在，則只允許列出的頻道
    - 驗證 `requireMention` 行為和提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="提及要求為 false 但仍遭封鎖">
    常見原因：

    - `groupPolicy="allowlist"` 沒有相符的 guild/channel 允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目底下）
    - 傳送者遭 guild/channel `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 佇列旋鈕：

    - 單帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord Gateway 監聽器工作，不控制代理回合生命週期

    Discord 不會對已排入佇列的代理回合套用頻道擁有的逾時。訊息監聽器會立即交接，而已排入佇列的 Discord 執行會保留每個工作階段的順序，直到 session/tool/runtime 生命週期完成或中止工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回 Discord 的預設 Gateway URL，並在記錄中受到速率限制。

    中繼資料逾時旋鈕：

    - 單帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定 config 時的 env 後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway READY 逾時重新啟動">
    OpenClaw 會在啟動期間與 runtime 重新連線後等待 Discord 的 Gateway `READY` 事件。具有啟動錯開的多帳號設定，可能需要比預設值更長的啟動 READY 時窗。

    READY 逾時旋鈕：

    - 啟動單帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定 config 時的啟動 env 後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - runtime 單帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime 多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定 config 時的 runtime env 後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，runtime 比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 與配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 正在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="Bot 對 bot 迴圈">
    預設會忽略由 bot 撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該 bot 的 bot 訊息。

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="語音 STT 因 DecryptionFailed(...) 掉線">

    - 保持 OpenClaw 為目前版本（`openclaw update`），以確保存在 Discord 語音接收復原邏輯
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，只在需要時調整
    - 觀察記錄中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後失敗仍持續，請收集記錄，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史進行比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`, `token`, `accounts.*`, `allowBots`
- 政策：`groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 指令：`commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算）, `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway：`gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 傳遞：`textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）, `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制 Discord 對外上傳，預設 `100MB`）, `retry`
- 動作：`actions.*`
- 狀態：`activity`, `status`, `activityType`, `activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`, 頂層 `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全與作業

- 將 bot token 視為秘密（受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授與最低權限的 Discord 權限。
- 如果指令部署/狀態過舊，請重新啟動 Gateway，並用 `openclaw channels status --probe` 重新檢查。

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
  <Card title="安全" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將 guild 與頻道對應到代理。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為。
  </Card>
</CardGroup>
