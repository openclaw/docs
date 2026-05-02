---
read_when:
    - 開發 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-05-02T20:41:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42223982a8bfd288d29a1f402b37141557718a407537011956b878b91b894e62
    source_path: channels/discord.md
    workflow: 16
---

可透過官方 Discord gateway 用於私訊和伺服器頻道。

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

你需要建立一個含有 bot 的新應用程式、將 bot 加入你的伺服器，並將它與 OpenClaw 配對。我們建議將你的 bot 加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與 bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後按一下 **New Application**。將它命名為類似「OpenClaw」的名稱。

    按一下側邊欄上的 **Bot**。將 **Username** 設定為你用來稱呼 OpenClaw agent 的名稱。

  </Step>

  <Step title="啟用特權意圖">
    仍在 **Bot** 頁面上，向下捲動到 **Privileged Gateway Intents** 並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱對 ID 比對需要）
    - **Presence Intent**（選用；只有狀態更新需要）

  </Step>

  <Step title="複製你的 bot token">
    在 **Bot** 頁面向上捲回並按一下 **Reset Token**。

    <Note>
    雖然名稱如此，這會產生你的第一個 token，並沒有任何東西被「reset」。
    </Note>

    複製 token 並儲存在某處。這是你的 **Bot Token**，稍後會需要用到。

  </Step>

  <Step title="產生邀請 URL 並將 bot 加入你的伺服器">
    按一下側邊欄上的 **OAuth2**。你會產生一個具有正確權限的邀請 URL，用來將 bot 加入你的伺服器。

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

    這是一般文字頻道的基準設定。如果你打算在 Discord 討論串中發文，包括會建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後按一下 **Continue** 以連線。你現在應該可以在 Discord 伺服器中看到你的 bot。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord app，你需要啟用開發者模式，才能複製內部 ID。

    1. 按一下 **User Settings**（頭像旁的齒輪圖示）→ **Advanced** → 開啟 **Developer Mode**
    2. 在側邊欄中以右鍵按一下你的 **server icon** → **Copy Server ID**
    3. 以右鍵按一下你 **own avatar** → **Copy User ID**

    將你的 **Server ID** 與 **User ID** 和 Bot Token 一起儲存；下一步你會將三者都傳送給 OpenClaw。

  </Step>

  <Step title="允許來自伺服器成員的私訊">
    若要讓配對運作，Discord 需要允許你的 bot 傳送私訊給你。以右鍵按一下你的 **server icon** → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括 bot）可以傳送私訊給你。如果你想使用 Discord 私訊搭配 OpenClaw，請保持此設定啟用。如果你只打算使用伺服器頻道，可以在配對後停用私訊。

  </Step>

  <Step title="安全設定你的 bot token（不要在聊天中傳送）">
    你的 Discord bot token 是機密（像密碼一樣）。在傳訊給你的 agent 之前，先在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已經以背景服務執行，請透過 OpenClaw Mac app 重新啟動它，或停止再重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後可以解析 env SecretRef。
    如果你的主機因 Discord 的啟動應用程式查詢而遭封鎖或受到速率限制，請從 Developer Portal 設定 Discord application/client ID，讓啟動流程可以跳過該 REST 呼叫。預設帳戶請使用 `channels.discord.applicationId`；如果你執行多個 Discord bot，請使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的 agent">
        在任何既有頻道（例如 Telegram）與你的 OpenClaw agent 聊天並告訴它。如果 Discord 是你的第一個頻道，請改用 CLI / config 分頁。

        > 「我已經在設定中設好 Discord bot token。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
      </Tab>
      <Tab title="CLI / config">
        如果你偏好以檔案為基礎的設定，請設定：

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

        對於腳本化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不帶 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec provider 的 SecretRef 值。請參閱[密鑰管理](/zh-TW/gateway/secrets)。

        對於多個 Discord bot，請將每個 bot token 和應用程式 ID 放在其帳戶底下。頂層 `channels.discord.applicationId` 會由帳戶繼承，因此只有當每個帳戶都應使用相同的應用程式 ID 時，才在該處設定。

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

  <Step title="核准首次私訊配對">
    等到 gateway 執行後，接著在 Discord 中私訊你的 bot。它會回覆一組配對碼。

    <Tabs>
      <Tab title="詢問你的 agent">
        將配對碼透過你既有的頻道傳送給你的 agent：

        > 「核准這個 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後過期。

    你現在應該可以在 Discord 中透過私訊與你的 agent 聊天。

  </Step>
</Steps>

<Note>
Token 解析會感知帳戶。設定中的 token 值優先於 env 後援。`DISCORD_BOT_TOKEN` 只用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析為相同的 bot token，OpenClaw 只會為該 token 啟動一個 gateway 監視器。來自設定的 token 優先於預設 env 後援；否則第一個啟用的帳戶會勝出，而重複帳戶會被回報為已停用。
對於進階 outbound 呼叫（message tool/頻道動作），明確的每次呼叫 `token` 會用於該呼叫。這適用於傳送與讀取/探測類動作（例如 read/search/fetch/thread/pins/permissions）。帳戶政策/重試設定仍來自作用中 runtime snapshot 中選取的帳戶。
</Note>

## 建議：設定伺服器工作區

私訊可以運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的 agent 工作階段與自己的脈絡。這建議用於只有你和 bot 的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入伺服器允許清單">
    這會讓你的 agent 能在伺服器上的任何頻道回應，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的 agent">
        > 「將我的 Discord Server ID `<server_id>` 加入伺服器允許清單」
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
    預設情況下，只有在伺服器頻道中被 @mentioned 時，你的 agent 才會回應。對私人伺服器而言，你可能希望它回應每則訊息。

    在伺服器頻道中，一般 assistant 最終回覆預設保持私密。可見的 Discord 輸出必須透過 `message` tool 明確傳送，因此 agent 預設可以潛伏，只有在它判斷頻道回覆有用時才發文。

    <Tabs>
      <Tab title="詢問你的 agent">
        > 「允許我的 agent 在這個伺服器上回應，而不必被 @mentioned」
      </Tab>
      <Tab title="Config">
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

        若要還原群組/頻道聊天室的舊版自動最終回覆，請設定 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃伺服器頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會在私訊工作階段中載入。伺服器頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的 agent">
        > 「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期脈絡，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要在每個頻道中使用共享脈絡，請將穩定指示放在 `AGENTS.md` 或 `USER.md`（它們會注入每個工作階段）。將長期筆記保留在 `MEMORY.md`，並依需求使用 memory tool 存取它們。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的 agent 可以看到頻道名稱，而且每個頻道都會取得自己的隔離工作階段，因此你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- Gateway 擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的
  情境加入模型提示，而不是使用者可見的回覆前綴。如果模型將該封套
  複製回來，OpenClaw 會從傳出回覆和
  未來重播情境中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理程式主要工作階段（`agent:main:main`）。
- 伺服器頻道是隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組私訊預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍會攜帶 `CommandTargetSessionKey` 到路由後的對話工作階段。
- 傳送至 Discord 的純文字 cron/heartbeat 公告會使用最終的
  助理可見答案一次。當代理程式發出多個可投遞承載時，媒體和結構化元件承載仍會是
  多則訊息。

## 論壇頻道

Discord 論壇和媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 將訊息傳送到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用訊息中第一個非空白行。
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

OpenClaw 支援用於代理程式訊息的 Discord components v2 容器。請使用帶有 `components` 承載的 message 工具。互動結果會作為一般傳入訊息路由回代理程式，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或一個選單
- 選單類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件為一次性使用。設定 `components.reusable=true` 可允許按鈕、選單和表單在到期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不符合的使用者會收到暫時性拒絕訊息。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含提供者、模型和相容執行階段下拉選單，以及提交步驟。`/models add` 已棄用，現在會回傳棄用訊息，而不是從聊天註冊模型。選擇器回覆是暫時性的，且只有呼叫的使用者可以使用。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應與附件參照相符時，使用 `filename` 覆寫上傳名稱

模態表單：

- 加入 `components.modal`，最多 5 個欄位
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
    `channels.discord.dmPolicy` 控制私訊存取。`channels.discord.allowFrom` 是標準私訊允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果私訊政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用至 `default` 帳號。
    - 對單一帳號而言，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 具名帳號在自己的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍會為了相容性而讀取。`openclaw doctor --fix` 會在不變更存取權的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    用於投遞的私訊目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但為了相容性，列在帳號有效私訊 `allowFrom` 中的 ID 會被視為使用者私訊目標。

  </Tab>

  <Tab title="DM access groups">
    Discord 私訊可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。若靜態群組的成員以各頻道的一般 `allowFrom` 語法表示，請使用 `type: "message.senders"`；若 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格，請使用 `type: "discord.channelAudience"`。共用存取群組行為記載於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立成員清單。`type: "discord.channelAudience"` 會將成員資格建模為：私訊傳送者是已設定伺服器的成員，且在套用身分組與頻道覆寫後，目前對已設定頻道具備有效的 `ViewChannel` 權限。

    範例：允許任何能看到 `#maintainers` 的人向機器人傳送私訊，同時對其他所有人保持私訊關閉。

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

    你可以混合動態與靜態項目：

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

    查找會以封閉方式失敗。如果 Discord 回傳 `Missing Access`、成員查找失敗，或頻道屬於不同伺服器，私訊傳送者會被視為未授權。

    使用頻道受眾存取群組時，請在 Discord Developer Portal 為機器人啟用 **Server Members Intent**。私訊不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="Guild policy">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準是 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅限身分組 ID）；如果任一項已設定，傳送者符合 `users` 或 `roles` 時即允許
    - 預設停用直接名稱/標籤比對；僅在緊急相容模式下啟用 `channels.discord.dangerouslyAllowNameMatching: true`
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

    如果你只設定 `DISCORD_BOT_TOKEN` 而未建立 `channels.discord` 區塊，執行階段後援會是 `groupPolicy="allowlist"`（記錄中會有警告），即使 `channels.defaults.groupPolicy` 是 `open` 也一樣。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設受提及控管。

    提及偵測包含：

    - 明確提及機器人
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆機器人行為

    撰寫傳出 Discord 訊息時，請使用標準提及語法：使用者用 `<@USER_ID>`、頻道用 `<#CHANNEL_ID>`、身分組用 `<@&ROLE_ID>`。請勿使用舊版 `<@!USER_ID>` 暱稱提及格式。

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及另一位使用者/身分組但未提及機器人的訊息（排除 @everyone/@here）。

    群組私訊：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選的允許清單透過 `dm.groupChannels`（頻道 ID 或 slug）設定

  </Tab>
</Tabs>

### 以身分組為基礎的代理程式路由

使用 `bindings[].match.roles` 依身分組 ID 將 Discord 伺服器成員路由到不同代理程式。以身分組為基礎的繫結只接受身分組 ID，並會在 peer 或 parent-peer 繫結之後、僅伺服器繫結之前評估。如果繫結也設定了其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須相符。

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
- 每個頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會明確清除先前註冊的 Discord 原生命令。
- 原生命令驗證會使用與一般訊息處理相同的 Discord 允許清單/策略。
- 對未授權的使用者，命令仍可能顯示在 Discord UI 中；執行時仍會強制套用 OpenClaw 驗證，並傳回「未授權」。

請參閱[斜線命令](/zh-TW/tools/slash-commands)以了解命令目錄與行為。

預設斜線命令設定：

- `ephemeral: true`

## 功能詳細資料

<AccordionGroup>
  <Accordion title="回覆標籤與原生回覆">
    Discord 支援代理輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）
    - `first`
    - `all`
    - `batched`

    注意：`off` 會停用隱含的回覆執行緒。明確的 `[[reply_to_*]]` 標籤仍會被遵循。
    `first` 一律會將隱含的原生回覆參照附加到該輪第一則送出的 Discord 訊息。
    `batched` 只會在傳入輪次是由多則訊息防抖後形成的批次時，
    附加 Discord 的隱含原生回覆參照。這在你主要想為含糊的爆量聊天使用原生回覆，
    而不是為每個單一訊息輪次都使用時很有用。

    訊息 ID 會顯示在上下文/歷史中，讓代理可以鎖定特定訊息。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯該訊息來串流草稿回覆。`channels.discord.streaming` 可接受 `off`（預設）| `partial` | `block` | `progress`。`progress` 在 Discord 上會對應到 `partial`；`streamMode` 是舊版別名，會自動遷移。

    預設保持 `off`，因為當多個機器人或 Gateway 共用同一個帳號時，Discord 預覽編輯很快就會碰到速率限制。

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

    - `partial` 會在權杖抵達時編輯單一預覽訊息。
    - `block` 會送出草稿大小的區塊（使用 `draftChunk` 調整大小與斷點，並限制在 `textChunkLimit` 內）。
    - 媒體、錯誤與明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。

    預覽串流僅限文字；媒體回覆會退回一般傳遞。當明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="歷史、上下文與執行緒行為">
    公會歷史上下文：

    - `channels.discord.historyLimit` 預設為 `20`
    - 備援：`messages.groupChat.historyLimit`
    - `0` 會停用

    私訊歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    執行緒行為：

    - Discord 執行緒會以頻道工作階段路由，並繼承父頻道設定，除非另有覆寫。
    - 執行緒工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅模型的備援；執行緒本地的 `/model` 選擇仍優先，且除非啟用逐字稿繼承，否則不會複製父逐字稿歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動執行緒選擇從父逐字稿播種。每個帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` 私訊目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用備援期間保留。

    頻道主題會作為**不受信任**的上下文注入。允許清單限制誰可以觸發代理，而不是完整的補充上下文遮蔽邊界。

  </Accordion>

  <Accordion title="子代理的執行緒繫結工作階段">
    Discord 可以將執行緒繫結到工作階段目標，讓該執行緒中的後續訊息持續路由到同一個工作階段（包括子代理工作階段）。

    命令：

    - `/focus <target>` 將目前/新執行緒繫結到子代理/工作階段目標
    - `/unfocus` 移除目前執行緒繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新已聚焦繫結的閒置自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新已聚焦繫結的硬性最長存活時間

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

    - `session.threadBindings.*` 設定全域預設值。
    - `channels.discord.threadBindings.*` 覆寫 Discord 行為。
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 與 ACP 執行緒產生時是否自動建立/繫結執行緒。預設值：`true`。
    - `defaultSpawnContext` 控制執行緒繫結產生的原生子代理上下文。預設值：`"fork"`。
    - 已淘汰的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某個帳號停用執行緒繫結，`/focus` 與相關的執行緒繫結操作將無法使用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持續性 ACP 頻道繫結">
    對於穩定的「永遠開啟」ACP 工作區，請設定頂層型別化 ACP 繫結，目標為 Discord 對話。

    設定路徑：

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

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或執行緒，並讓後續訊息保持在同一個 ACP 工作階段上。執行緒訊息會繼承父頻道繫結。
    - 在已繫結的頻道或執行緒中，`/new` 與 `/reset` 會就地重設同一個 ACP 工作階段。暫時執行緒繫結在作用中時可以覆寫目標解析。
    - `spawnSessions` 會管控透過 `--thread auto|here` 建立/繫結子執行緒。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)以了解繫結行為詳細資料。

  </Accordion>

  <Accordion title="反應通知">
    每個公會的反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換為系統事件，並附加到已路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號備援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Discord 接受 unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某個頻道或帳號的反應。

  </Accordion>

  <Accordion title="設定寫入">
    預設啟用由頻道發起的設定寫入。

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

  <Accordion title="Gateway 代理">
    透過 HTTP(S) 代理，使用 `channels.discord.proxy` 路由 Discord Gateway WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）。

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

  <Accordion title="PluralKit 支援">
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
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對成員顯示名稱
    - 查詢使用原始訊息 ID，並受時間窗口限制
    - 如果查詢失敗，代理訊息會被視為機器人訊息並丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理需要為已知 Discord 使用者提供確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含前導 `@` 的代稱；值是 Discord 使用者 ID。未知代稱、`@everyone`、`@here`，以及 Markdown 程式碼跨度內的提及會保持不變。

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

  <Accordion title="上線狀態設定">
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

    - 0：遊玩
    - 1：串流（需要 `activityUrl`）
    - 2：聆聽
    - 3：觀看
    - 4：自訂（使用活動文字作為狀態狀態；表情符號為選用）
    - 5：競賽

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

    自動上線狀態會將執行階段可用性對應到 Discord 狀態：健康 => 線上，降級或未知 => 閒置，耗盡或無法使用 => 勿擾。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中使用按鈕式核准處理，並可選擇在原始頻道中張貼核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可解析出一位核准者時，Discord 會自動啟用原生執行核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷執行核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於 `/diagnostics` 和 `/export-trajectory` 這類敏感的僅限擁有者群組命令，OpenClaw 會私下傳送核准提示和最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord DM；若不可用，則會退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到一則暫時性拒絕訊息。核准提示會包含命令文字，因此只應在受信任的頻道中啟用頻道傳遞。若無法從工作階段金鑰推導出頻道 ID，OpenClaw 會退回使用 DM 傳遞。

    Discord 也會呈現其他聊天頻道所使用的共用核准按鈕。原生 Discord 配接器主要新增核准者 DM 路由和頻道扇出。
    當這些按鈕存在時，它們就是主要的核准使用者體驗；OpenClaw
    只有在工具結果表示聊天核准不可用，或手動核准是唯一途徑時，才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用但原生卡片無法傳遞到任何目標，
    OpenClaw 會在同一聊天中傳送備援通知，內含待處理核准中的確切 `/approve`
    命令。

    Gateway 驗證與核准解析遵循共用 Gateway 用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後到期。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和動作閘門

Discord 訊息動作包含訊息、頻道管理、管理、狀態和中繼資料動作。

核心範例：

- 訊息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 管理：`timeout`、`kick`、`ban`
- 狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定排程活動封面圖片。

動作閘門位於 `channels.discord.actions.*` 底下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已啟用   |
| roles                                                                                                                                                                    | 已停用   |
| moderation                                                                                                                                                               | 已停用   |
| presence                                                                                                                                                                 | 已停用   |

## Components v2 UI

OpenClaw 對執行核准和跨情境標記使用 Discord components v2。Discord 訊息動作也可以接受 `components` 作為自訂 UI（進階；需要透過 discord 工具建構元件酬載），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 會設定 Discord 元件容器使用的強調色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 為每個帳號設定。
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

Discord 有兩種不同的語音介面：即時**語音頻道**（連續對話）和**語音訊息附件**（波形預覽格式）。gateway 支援兩者。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 範圍邀請 bot。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。該命令使用帳號的預設代理，並遵循與其他 Discord 命令相同的允許清單和群組原則規則。

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

注意事項：

- `voice.tts` 只會覆寫語音播放的 `messages.tts`。
- `voice.model` 只會覆寫 Discord 語音頻道回應使用的 LLM。保持未設定即可繼承路由代理模型。
- STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄回合。
- 語音轉錄回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態；非擁有者說話者無法存取僅限擁有者的工具（例如 `gateway` 和 `cron`）。
- Discord 語音對純文字設定是選用的；設定 `channels.discord.voice.enabled=true`（或保留既有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段和 `GuildVoiceStates` gateway intent。
- `channels.discord.intents.voiceStates` 可以明確覆寫語音狀態 intent 訂閱。保持未設定即可讓 intent 跟隨有效的語音啟用狀態。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞到 `@discordjs/voice` 加入選項。
- 如果未設定，`@discordjs/voice` 預設為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間。預設：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀中斷連線的語音工作階段之前，等待其開始重新連線的時間。預設：`15000`。
- OpenClaw 也會監看接收解密失敗，並在短時間內重複失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收日誌反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告和日誌。隨附的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游填補修正，該修正已關閉 discord.js issue #11419。

語音頻道管線：

- Discord PCM 擷取會轉換為 WAV 暫存檔。
- `tools.media.audio` 會處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄會透過 Discord 入口和路由傳送，而回應 LLM 會以語音輸出原則執行；該原則會隱藏代理 `tts` 工具並要求傳回文字，因為 Discord 語音擁有最終 TTS 播放。
- 設定 `voice.model` 時，只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會合併覆蓋 `messages.tts`；產生的音訊會在已加入的頻道中播放。

憑證會依元件解析：`voice.model` 的 LLM 路由驗證、`tools.media.audio` 的 STT 驗證，以及 `messages.tts`/`voice.tts` 的 TTS 驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要 gateway 主機上有 `ffmpeg` 和 `ffprobe`，才能檢查和轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一酬載中的文字 + 語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="使用了不允許的 intent，或 bot 看不到 guild 訊息">

    - 啟用 Message Content Intent
    - 當你依賴使用者/成員解析時，啟用 Server Members Intent
    - 變更 intent 後重新啟動 gateway

  </Accordion>

  <Accordion title="guild 訊息意外遭封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 底下的 guild 允許清單
    - 如果 guild `channels` 對應存在，則只允許列出的頻道
    - 驗證 `requireMention` 行為和提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 為 false 但仍遭封鎖">
    常見原因：

    - `groupPolicy="allowlist"` 但沒有相符的 guild/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須在 `channels.discord.guilds` 或頻道項目底下）
    - 傳送者遭 guild/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型日誌：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway 佇列調整項：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord gateway listener 工作，而不是代理回合生命週期

    Discord 不會對已排入佇列的代理回合套用頻道擁有的逾時。訊息 listener 會立即交接，而已排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回使用 Discord 的預設 gateway URL，並在日誌中受到速率限制。

    中繼資料逾時調整項：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定組態時的 env 備援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway READY 逾時重啟">
    OpenClaw 會在啟動期間與執行階段重新連線後，等待 Discord 的 gateway `READY` 事件。使用啟動錯峰的多帳號設定可能需要比預設值更長的啟動 READY 視窗。

    READY 逾時設定：

    - 啟動單一帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定 config 時的啟動 env 後備值：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單一帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定 config 時的執行階段 env 後備值：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查只適用於數字 channel ID。

    如果你使用 slug key，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 與配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM policy 已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="Bot 對 bot 迴圈">
    預設會忽略 bot 撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與 allowlist 規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該 bot 的 bot 訊息。

  </Accordion>

  <Accordion title="Voice STT 因 DecryptionFailed(...) 遺失">

    - 保持 OpenClaw 為最新版本（`openclaw update`），以確保 Discord voice receive 復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，只有在需要時才調整
    - 觀察記錄中是否出現：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，請收集記錄，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE receive 歷史進行比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- policy：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- command：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- event queue：`eventQueue.listenerTimeout`（listener 預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- gateway：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- delivery：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- streaming：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- media/retry：`mediaMaxMb`（限制傳出的 Discord 上傳，預設為 `100MB`）、`retry`
- actions：`actions.*`
- presence：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- features：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與維運

- 將 bot token 視為機密（受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 如果 command 部署/狀態過期，請重新啟動 gateway，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到 gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與 allowlist 行為。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至 agent。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多 agent 路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將 guild 與 channel 對應到 agent。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生 command 行為。
  </Card>
</CardGroup>
