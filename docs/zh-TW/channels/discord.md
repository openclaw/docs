---
read_when:
    - 開發 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

可透過官方 Discord Gateway 用於私訊與 guild 頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord 私訊預設為配對模式。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

你需要建立一個含 bot 的新應用程式、將 bot 加入你的伺服器，並將它配對到 OpenClaw。我們建議將 bot 加到你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與 bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後按一下 **New Application**。命名為類似「OpenClaw」的名稱。

    按一下側邊欄中的 **Bot**。將 **Username** 設為你用來稱呼 OpenClaw agent 的任何名稱。

  </Step>

  <Step title="啟用特權 intents">
    仍在 **Bot** 頁面中，向下捲動到 **Privileged Gateway Intents** 並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色 allowlist 與名稱對 ID 比對需要）
    - **Presence Intent**（選用；只有 presence 更新需要）

  </Step>

  <Step title="複製你的 bot token">
    回到 **Bot** 頁面上方，按一下 **Reset Token**。

    <Note>
    雖然名稱如此，這會產生你的第一個 token，並沒有任何東西被「重設」。
    </Note>

    複製 token 並儲存在某處。這是你的 **Bot Token**，你很快就會需要它。

  </Step>

  <Step title="產生邀請 URL 並將 bot 加入你的伺服器">
    按一下側邊欄中的 **OAuth2**。你將產生一個具備正確權限的邀請 URL，用來將 bot 加入你的伺服器。

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

    這是一般文字頻道的基準設定。如果你計畫在 Discord threads 中發文，包括會建立或繼續 thread 的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後按一下 **Continue** 進行連線。你現在應該會在 Discord 伺服器中看到你的 bot。

  </Step>

  <Step title="啟用 Developer Mode 並收集你的 ID">
    回到 Discord 應用程式，你需要啟用 Developer Mode，才能複製內部 ID。

    1. 按一下 **User Settings**（你頭像旁的齒輪圖示）→ **Advanced** → 開啟 **Developer Mode**
    2. 在側邊欄中的 **server icon** 上按一下右鍵 → **Copy Server ID**
    3. 在你自己的 **avatar** 上按一下右鍵 → **Copy User ID**

    將你的 **Server ID** 與 **User ID** 和 Bot Token 一起儲存；下一步你會把這三者都傳送給 OpenClaw。

  </Step>

  <Step title="允許來自伺服器成員的私訊">
    若要讓配對運作，Discord 需要允許你的 bot 傳私訊給你。在你的 **server icon** 上按一下右鍵 → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括 bots）傳私訊給你。如果你想透過 Discord 私訊使用 OpenClaw，請保持啟用。若你只打算使用 guild 頻道，可以在配對後停用私訊。

  </Step>

  <Step title="安全設定你的 bot token（不要在聊天中傳送）">
    你的 Discord bot token 是祕密（就像密碼）。在傳訊給 agent 前，請先在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已作為背景服務執行，請透過 OpenClaw Mac app，或停止並重新啟動 `openclaw gateway run` 程序來重新啟動它。
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務能在重新啟動後解析 env SecretRef。
    如果你的主機因 Discord 的啟動應用程式查詢而遭封鎖或速率限制，請從 Developer Portal 設定 Discord application/client ID，讓啟動可以略過該 REST 呼叫。預設帳號使用 `channels.discord.applicationId`；如果你執行多個 Discord bots，則使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的 agent">
        在任何既有頻道（例如 Telegram）與你的 OpenClaw agent 聊天並告知它。如果 Discord 是你的第一個頻道，請改用 CLI / 設定分頁。

        >「我已在設定中設好我的 Discord bot token。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
      </Tab>
      <Tab title="CLI / 設定">
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

        預設帳號的 env fallback：

```bash
DISCORD_BOT_TOKEN=...
```

        對於指令碼化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不帶 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec providers 的 SecretRef 值。請參閱[祕密管理](/zh-TW/gateway/secrets)。

        對於多個 Discord bots，請將每個 bot token 和 application ID 放在其帳號底下。最上層的 `channels.discord.applicationId` 會由帳號繼承，因此只有在每個帳號都應使用相同 application ID 時，才在那裡設定。

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
    等到 Gateway 執行後，在 Discord 中傳私訊給你的 bot。它會回覆一組配對碼。

    <Tabs>
      <Tab title="詢問你的 agent">
        將配對碼傳送到既有頻道上的 agent：

        >「核准這組 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後過期。

    你現在應該可以透過 Discord 私訊與 agent 聊天。

  </Step>
</Steps>

<Note>
Token 解析會感知帳號。設定中的 token 值優先於 env fallback。`DISCORD_BOT_TOKEN` 只會用於預設帳號。
如果兩個已啟用的 Discord 帳號解析到相同 bot token，OpenClaw 只會為該 token 啟動一個 Gateway monitor。來自設定的 token 優先於預設 env fallback；否則第一個啟用的帳號會勝出，重複的帳號會被回報為已停用。
對於進階 outbound 呼叫（message tool/channel actions），明確的 per-call `token` 會用於該呼叫。這適用於 send 與 read/probe-style actions（例如 read/search/fetch/thread/pins/permissions）。帳號 policy/retry settings 仍來自作用中 runtime snapshot 中選取的帳號。
</Note>

## 建議：設定 guild 工作區

私訊能運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的 agent session 與自己的 context。這建議用於只有你和 bot 的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入 guild allowlist">
    這會讓 agent 能在你伺服器上的任何頻道回應，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「將我的 Discord Server ID `<server_id>` 加入 guild allowlist」
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

  <Step title="允許不需 @mention 即可回應">
    預設情況下，你的 agent 只有在 guild 頻道中被 @mentioned 時才會回應。對於私人伺服器，你可能會希望它回應每則訊息。

    在 guild 頻道中，一般 assistant 最終回覆預設保持私密。可見的 Discord output 必須使用 `message` tool 明確傳送，因此 agent 預設可以潛伏，只有在它判斷頻道回覆有用時才發文。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「允許我的 agent 在這個伺服器上不需要被 @mentioned 就能回應」
      </Tab>
      <Tab title="設定">
        在你的 guild config 中設定 `requireMention: false`：

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

        若要恢復群組/頻道聊天室的舊版自動最終回覆，請設定 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃 guild 頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會載入私訊 sessions。Guild 頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期 context，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要每個頻道都有共享 context，請將穩定指示放在 `AGENTS.md` 或 `USER.md`（它們會被注入每個 session）。將長期筆記保留在 `MEMORY.md` 中，並使用 memory tools 按需存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的 agent 可以看到頻道名稱，而且每個頻道都會取得自己的隔離 session，所以你可以設定 `#coding`、`#home`、`#research`，或任何適合你工作流程的名稱。

## 執行階段模型

- Gateway 擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord guild/channel 中繼資料會作為不受信任的脈絡加入模型提示，
  而不是作為使用者可見的回覆前綴。如果模型把該封套複製
  回來，OpenClaw 會從傳出回覆與
  後續重播脈絡中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理的主工作階段（`agent:main:main`）。
- Guild 頻道會使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組 DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生 slash commands 會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍會攜帶 `CommandTargetSessionKey` 到已路由的對話工作階段。
- 對 Discord 的純文字 cron/heartbeat 宣告遞送會使用最終
  助理可見答案一次。媒體與結構化元件酬載在代理發出多個
  可遞送酬載時，仍維持多訊息形式。

## 論壇頻道

Discord 論壇與媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 將訊息傳送到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用訊息中的第一個非空白行。
- 使用 `openclaw message thread create` 直接建立討論串。不要對論壇頻道傳入 `--message-id`。

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

OpenClaw 支援代理訊息使用 Discord components v2 容器。請使用 message tool 搭配 `components` 酬載。互動結果會作為一般傳入訊息路由回代理，並遵循既有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕，或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件為一次性使用。設定 `components.reusable=true` 可允許按鈕、選取項與表單在過期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤，或 `*`）。設定後，不符合的使用者會收到暫時性拒絕訊息。

`/model` 和 `/models` slash commands 會開啟互動式模型選擇器，其中包含供應商、模型與相容執行階段下拉選單，以及提交步驟。`/models add` 已被棄用，現在會回傳棄用訊息，而不是從聊天註冊模型。選擇器回覆是暫時性的，且只有呼叫的使用者可以使用。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應與附件參照相符時，請使用 `filename` 覆寫上傳名稱

Modal 表單：

- 新增 `components.modal`，最多 5 個欄位
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
  <Tab title="DM 政策">
    `channels.discord.dmPolicy` 控制 DM 存取。`channels.discord.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中被提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用到 `default` 帳號。
    - 對於單一帳號，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 具名帳號在自身的 `allowFrom` 與舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 與 `channels.discord.dm.allowFrom` 仍會為了相容性而讀取。`openclaw doctor --fix` 會在不變更存取的情況下，將它們遷移到 `dmPolicy` 與 `allowFrom`。

    遞送用的 DM 目標格式：

    - `user:<id>`
    - `<@id>` mention

    當有作用中的頻道預設值時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效 DM `allowFrom` 中的 ID 會為了相容性而被視為使用者 DM 目標。

  </Tab>

  <Tab title="DM 存取群組">
    Discord DM 可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。靜態群組請使用 `type: "message.senders"`，其成員以各頻道一般的 `allowFrom` 語法表示；當 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格時，請使用 `type: "discord.channelAudience"`。共享存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 會將成員資格建模為：DM 傳送者是已設定 guild 的成員，且在套用角色與頻道覆寫後，目前對已設定頻道具備有效的 `ViewChannel` 權限。

    範例：允許任何可以看見 `#maintainers` 的人 DM 機器人，同時對其他所有人關閉 DM。

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

    查詢會以封閉方式失敗。如果 Discord 回傳 `Missing Access`、成員查詢失敗，或頻道屬於不同的 guild，DM 傳送者會被視為未授權。

    使用頻道受眾存取群組時，請在 Discord Developer Portal 為機器人啟用 **Server Members Intent**。DM 不包含 guild 成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析該成員。

  </Tab>

  <Tab title="Guild 政策">
    Guild 處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準為 `allowlist`。

    `allowlist` 行為：

    - guild 必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用傳送者允許清單：`users`（建議使用穩定 ID）與 `roles`（僅角色 ID）；如果設定任一者，傳送者符合 `users` 或 `roles` 時即允許
    - 直接名稱/標籤比對預設為停用；只有在破窗相容模式下才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 較安全；使用名稱/標籤項目時，`openclaw security audit` 會發出警告
    - 如果 guild 設定了 `channels`，未列出的頻道會被拒絕
    - 如果 guild 沒有 `channels` 區塊，該允許清單 guild 中的所有頻道都會被允許

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

    如果你只設定 `DISCORD_BOT_TOKEN`，而沒有建立 `channels.discord` 區塊，執行階段 fallback 會是 `groupPolicy="allowlist"`（日誌中會有警告），即使 `channels.defaults.groupPolicy` 是 `open` 也是如此。

  </Tab>

  <Tab title="Mention 與群組 DM">
    Guild 訊息預設需要 mention。

    Mention 偵測包含：

    - 明確提及機器人
    - 已設定的 mention 模式（`agents.list[].groupChat.mentionPatterns`，fallback 為 `messages.groupChat.mentionPatterns`）
    - 受支援情況中的隱含回覆機器人行為

    撰寫傳出的 Discord 訊息時，請使用標準 mention 語法：使用者用 `<@USER_ID>`，頻道用 `<#CHANNEL_ID>`，角色用 `<@&ROLE_ID>`。不要使用舊版 `<@!USER_ID>` 暱稱 mention 形式。

    `requireMention` 會依 guild/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及其他使用者/角色但未提及機器人的訊息（不含 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選擇透過 `dm.groupChannels` 設定允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord guild 成員路由到不同代理。以角色為基礎的繫結只接受角色 ID，並會在 peer 或 parent-peer 繫結之後、guild-only 繫結之前評估。如果繫結也設定其他 match 欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須符合。

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

- `commands.native` 預設為 `"auto"`，並對 Discord 啟用。
- 每個頻道的覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線指令註冊與清理。先前註冊的指令可能仍會在 Discord 中可見，直到你從 Discord 應用程式移除它們。
- 原生指令驗證使用與一般訊息處理相同的 Discord 允許清單/政策。
- 指令可能仍會在 Discord UI 中對未授權使用者可見；執行時仍會強制套用 OpenClaw 驗證，並回傳「未授權」。

請參閱[斜線指令](/zh-TW/tools/slash-commands)了解指令目錄與行為。

預設斜線指令設定：

- `ephemeral: true`

## 功能詳細資訊

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

    注意：`off` 會停用隱含的回覆討論串化。明確的 `[[reply_to_*]]` 標籤仍會被遵循。
    `first` 一律會將隱含的原生回覆參照附加到該回合第一則送出的 Discord 訊息。
    `batched` 只有在傳入回合是多則訊息的去抖批次時，才會附加 Discord 的隱含原生回覆參照。這在你主要想針對模糊的爆量聊天使用原生回覆，而不是每個單一訊息回合都使用時很有用。

    訊息 ID 會顯示在脈絡/歷史中，讓代理可以指定特定訊息。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送臨時訊息，並在文字抵達時編輯它，來串流草稿回覆。`channels.discord.streaming` 可使用 `off`（預設）| `partial` | `block` | `progress`。`progress` 會保留一則可編輯的狀態草稿，並以工具進度更新它，直到最終送達；`streamMode` 是舊版別名，會自動遷移。

    預設維持 `off`，因為當多個機器人或 Gateway 共用同一帳號時，Discord 預覽編輯很快就會觸及速率限制。

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

    預覽串流僅支援文字；媒體回覆會退回一般送達。當明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="歷史、脈絡與討論串行為">
    伺服器歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會作為頻道工作階段路由，並繼承父頻道設定，除非被覆寫。
    - 討論串工作階段會繼承父頻道工作階段層級的 `/model` 選擇，作為僅模型的後援；討論串本地的 `/model` 選擇仍優先，且除非啟用對話記錄繼承，否則不會複製父對話記錄歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動討論串從父對話記錄植入。每個帳號的覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會作為**不受信任**的脈絡注入。允許清單會控管誰可以觸發代理，而不是完整的補充脈絡遮蔽邊界。

  </Accordion>

  <Accordion title="子代理的討論串繫結工作階段">
    Discord 可以將討論串繫結到工作階段目標，讓該討論串中的後續訊息持續路由到同一個工作階段（包含子代理工作階段）。

    指令：

    - `/focus <target>` 將目前/新的討論串繫結到子代理/工作階段目標
    - `/unfocus` 移除目前討論串繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢視/更新已聚焦繫結的閒置自動取消聚焦
    - `/session max-age <duration|off>` 檢視/更新已聚焦繫結的硬性最大存續時間

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

    注意：

    - `session.threadBindings.*` 會設定全域預設值。
    - `channels.discord.threadBindings.*` 會覆寫 Discord 行為。
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 和 ACP 討論串衍生的自動建立/繫結討論串。預設：`true`。
    - `defaultSpawnContext` 控制討論串繫結衍生的原生子代理脈絡。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某個帳號停用了討論串繫結，`/focus` 與相關討論串繫結操作將不可用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 頻道繫結">
    若要使用穩定「永遠在線」的 ACP 工作區，請設定目標為 Discord 對話的頂層具型別 ACP 繫結。

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

    注意：

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或討論串，並讓未來訊息保持在同一個 ACP 工作階段。討論串訊息會繼承父頻道繫結。
    - 在已繫結的頻道或討論串中，`/new` 和 `/reset` 會就地重設同一個 ACP 工作階段。臨時討論串繫結可在作用中時覆寫目標解析。
    - `spawnSessions` 會透過 `--thread auto|here` 控管子討論串建立/繫結。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents) 了解繫結行為詳細資訊。

  </Accordion>

  <Accordion title="反應通知">
    每個伺服器的反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換為系統事件，並附加到已路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認 emoji。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理身分 emoji 後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意：

    - Discord 接受 Unicode emoji 或自訂 emoji 名稱。
    - 使用 `""` 可停用頻道或帳號的反應。

  </Accordion>

  <Accordion title="設定寫入">
    預設會啟用由頻道發起的設定寫入。

    這會影響 `/config set|unset` 流程（啟用指令功能時）。

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
    透過 HTTP(S) 代理，以 `channels.discord.proxy` 路由 Discord Gateway WebSocket 流量與啟動時 REST 查詢（應用程式 ID + 允許清單解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    每個帳號的覆寫：

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
    啟用 PluralKit 解析，以將代理訊息對應到系統成員身分：

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

    注意：

    - 允許清單可使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/代稱比對成員顯示名稱
    - 查詢會使用原始訊息 ID，並受時間視窗限制
    - 如果查詢失敗，代理訊息會被視為機器人訊息並丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="輸出提及別名">
    當代理需要對已知 Discord 使用者產生確定性的輸出提及時，請使用 `mentionAliases`。鍵是不含前置 `@` 的帳號代稱；值是 Discord 使用者 ID。未知帳號代稱、`@everyone`、`@here`，以及 Markdown 程式碼範圍內的提及會保持不變。

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
    - 4：自訂（使用活動文字作為狀態狀態；emoji 為選用）
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

    自動上線狀態會將執行階段可用性對應到 Discord 狀態：健康 => 線上、降級或未知 => 閒置、耗盡或不可用 => dnd。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援 DM 中以按鈕為基礎的核准處理，也可選擇在原始頻道張貼核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設值：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可解析出一位核准者時，Discord 會自動啟用原生 exec 核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或私訊 `defaultTo` 推斷 exec 核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的僅擁有者群組命令，OpenClaw 會私下傳送核准提示和最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord 私訊；如果無法使用，則退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會顯示在頻道中。只有已解析的核准者可以使用按鈕；其他使用者會收到暫時性的拒絕訊息。核准提示包含命令文字，因此請只在受信任的頻道中啟用頻道傳遞。如果無法從工作階段金鑰推導出頻道 ID，OpenClaw 會退回使用私訊傳遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 配接器主要新增核准者私訊路由和頻道扇出。
    當這些按鈕存在時，它們是主要的核准 UX；OpenClaw
    只有在工具結果指出聊天核准不可用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但原生卡片無法傳遞至任何目標，
    OpenClaw 會在同一聊天中傳送備援通知，內含待處理核准中的精確 `/approve`
    命令。

    Gateway 驗證與核准解析遵循共用的 Gateway 用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後過期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和動作閘門

Discord 訊息動作包括傳訊、頻道管理、審核、狀態和中繼資料動作。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定排程活動封面圖片。

動作閘門位於 `channels.discord.actions.*` 之下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設值 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 啟用   |
| roles                                                                                                                                                                    | 停用   |
| moderation                                                                                                                                                               | 停用   |
| presence                                                                                                                                                                 | 停用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 進行 exec 核准和跨情境標記。Discord 訊息動作也可以接受 `components` 以支援自訂 UI（進階；需要透過 discord 工具建構 component 承載資料），而舊版 `embeds` 仍可使用但不建議。

- `channels.discord.ui.components.accentColor` 會設定 Discord component 容器使用的強調色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 為每個帳號設定。
- 當 components v2 存在時，會忽略 `embeds`。

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

Discord 有兩種不同的語音介面：即時**語音頻道**（連續對話）和**語音訊息附件**（波形預覽格式）。Gateway 兩者都支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 範圍邀請 bot。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號預設 agent，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

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
- `voice.model` 只會覆寫 Discord 語音頻道回應所使用的 LLM。保留未設定即可繼承已路由 agent 的模型。
- STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄回合。
- 語音轉錄回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態；非擁有者說話者無法存取僅擁有者工具（例如 `gateway` 和 `cron`）。
- 對於純文字設定，Discord 語音是選擇加入；設定 `channels.discord.voice.enabled=true`（或保留現有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段和 `GuildVoiceStates` gateway intent。
- `channels.discord.intents.voiceStates` 可以明確覆寫語音狀態 intent 訂閱。保留未設定即可讓 intent 跟隨有效的語音啟用狀態。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞給 `@discordjs/voice` 加入選項。
- 如果未設定，`@discordjs/voice` 預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷的語音工作階段前，等待其開始重新連線的時間長度。預設值：`15000`。
- OpenClaw 也會監看接收解密失敗，並在短時間窗口內重複失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收記錄反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集依賴報告和記錄。內建的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游 padding 修正，該修正已關閉 discord.js issue #11419。

語音頻道管線：

- Discord PCM 擷取會轉換為 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄會透過 Discord ingress 和路由傳送，而回應 LLM 會以語音輸出政策執行，該政策會隱藏 agent `tts` 工具並要求回傳文字，因為 Discord 語音擁有最終 TTS 播放。
- 設定 `voice.model` 時，它只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會合併覆蓋 `messages.tts`；產生的音訊會在已加入的頻道中播放。

憑證會按元件解析：`voice.model` 的 LLM 路由驗證、`tools.media.audio` 的 STT 驗證，以及 `messages.tts`/`voice.tts` 的 TTS 驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要 gateway 主機上有 `ffmpeg` 和 `ffprobe` 來檢查和轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕文字 + 語音訊息在同一承載資料中）。
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

  <Accordion title="Guild 訊息意外遭封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的 guild 允許清單
    - 如果 guild `channels` 對應存在，則只允許列出的頻道
    - 驗證 `requireMention` 行為和提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false 但仍遭封鎖">
    常見原因：

    - `groupPolicy="allowlist"` 沒有相符的 guild/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者被 guild/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway 佇列旋鈕：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord gateway 監聽器工作，不控制 agent 回合生命週期

    Discord 不會對已排隊的 agent 回合套用頻道擁有的逾時。訊息監聽器會立即移交，而已排隊的 Discord 執行會保留每個工作階段的排序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回使用 Discord 的預設 gateway URL，並在記錄中受到速率限制。

    中繼資料逾時旋鈕：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定未指定時的 env 備援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway READY 逾時重新啟動">
    OpenClaw 會在啟動期間以及執行階段重新連線後等待 Discord 的 gateway `READY` 事件。採用啟動錯峰的多帳號設定，可能需要比預設值更長的啟動 READY 視窗。

    READY 逾時設定：

    - 啟動單帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定未設時的啟動環境備援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定未設時的執行階段環境備援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查僅適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 與配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="Bot 對 bot 迴圈">
    預設會忽略 bot 撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及 bot 的 bot 訊息。

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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 遺漏">

    - 讓 OpenClaw 保持最新（`openclaw update`），以確保 Discord 語音接收復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，僅在需要時調整
    - 監看記錄中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後失敗仍持續，請收集記錄，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史進行比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 指令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（listener 預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- Gateway：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制傳出的 Discord 上傳，預設 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態顯示：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全性與操作

- 將 bot token 視為密鑰（在受監管環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 如果指令部署/狀態已過期，請重新啟動 gateway，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到 gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理程式路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將 guild 與頻道對應到代理程式。
  </Card>
  <Card title="Slash 指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為。
  </Card>
</CardGroup>
