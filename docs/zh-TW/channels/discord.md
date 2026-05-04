---
read_when:
    - 開發 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

準備好透過官方 Discord gateway 使用 DM 和伺服器頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord DM 預設為配對模式。
  </Card>
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為與指令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

你需要建立一個含有機器人的新應用程式，將機器人加入你的伺服器，並將它與 OpenClaw 配對。我們建議將機器人加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後按一下 **New Application**。將它命名為類似「OpenClaw」的名稱。

    按一下側邊欄的 **Bot**。將 **Username** 設為你稱呼 OpenClaw agent 的名稱。

  </Step>

  <Step title="啟用特權意圖">
    仍在 **Bot** 頁面上，向下捲動至 **Privileged Gateway Intents**，然後啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱到 ID 比對需要）
    - **Presence Intent**（選用；僅在需要狀態更新時使用）

  </Step>

  <Step title="複製你的機器人權杖">
    在 **Bot** 頁面向上捲回，然後按一下 **Reset Token**。

    <Note>
    儘管名稱如此，這會產生你的第一個權杖，不會真的「重設」任何內容。
    </Note>

    複製權杖並將它儲存在某處。這是你的 **Bot Token**，稍後會需要用到。

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    按一下側邊欄的 **OAuth2**。你將產生一個具有正確權限的邀請 URL，用來將機器人加入你的伺服器。

    向下捲動至 **OAuth2 URL Generator**，然後啟用：

    - `bot`
    - `applications.commands`

    下方會出現 **Bot Permissions** 區段。至少啟用：

    **General Permissions**
      - 檢視頻道
    **Text Permissions**
      - 傳送訊息
      - 讀取訊息歷史
      - 嵌入連結
      - 附加檔案
      - 新增反應（選用）

    這是一般文字頻道的基準設定。如果你計畫在 Discord 討論串中發文，包括會建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選擇你的伺服器，然後按一下 **Continue** 以連線。你現在應該會在 Discord 伺服器中看到你的機器人。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord 應用程式，你需要啟用開發者模式，才能複製內部 ID。

    1. 按一下 **User Settings**（你頭像旁的齒輪圖示）→ **Advanced** → 開啟 **Developer Mode**
    2. 在側邊欄中以滑鼠右鍵按一下你的 **server icon** → **Copy Server ID**
    3. 以滑鼠右鍵按一下你**自己的頭像** → **Copy User ID**

    將你的 **Server ID** 和 **User ID** 與 Bot Token 一起儲存，下一步你會將這三者傳送給 OpenClaw。

  </Step>

  <Step title="允許伺服器成員傳送 DM">
    若要讓配對運作，Discord 需要允許你的機器人傳送 DM 給你。以滑鼠右鍵按一下你的 **server icon** → **Privacy Settings** → 開啟 **Direct Messages**。

    這會允許伺服器成員（包括機器人）傳送 DM 給你。如果你想透過 OpenClaw 使用 Discord DM，請保持此設定啟用。如果你只計畫使用伺服器頻道，可以在配對後停用 DM。

  </Step>

  <Step title="安全地設定你的機器人權杖（不要在聊天中傳送）">
    你的 Discord 機器人權杖是秘密資訊（像密碼一樣）。在傳訊息給你的 agent 之前，先在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已經以背景服務執行，請透過 OpenClaw Mac 應用程式重新啟動，或停止並重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請從已存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後可以解析 env SecretRef。
    如果你的主機因 Discord 啟動應用程式查詢而遭封鎖或受速率限制，請從 Developer Portal 設定 Discord 應用程式/用戶端 ID，讓啟動可以略過該 REST 呼叫。預設帳戶請使用 `channels.discord.applicationId`，當你執行多個 Discord 機器人時，請使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的 agent">
        在任何現有頻道（例如 Telegram）與你的 OpenClaw agent 聊天，並告訴它。如果 Discord 是你的第一個頻道，請改用 CLI / 設定分頁。

        >「我已經在設定中設好 Discord 機器人權杖。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
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

        預設帳戶的 env 後援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於指令碼化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不帶 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec 提供者的 SecretRef 值。請參閱[密鑰管理](/zh-TW/gateway/secrets)。

        對於多個 Discord 機器人，請將每個機器人權杖與應用程式 ID 保存在其帳戶下。頂層的 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都應使用相同應用程式 ID 時，才在那裡設定。

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
    等到 gateway 執行後，在 Discord 中傳 DM 給你的機器人。它會回應一組配對碼。

    <Tabs>
      <Tab title="詢問你的 agent">
        將配對碼透過你現有的頻道傳送給你的 agent：

        >「核准這組 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後到期。

    你現在應該可以透過 DM 在 Discord 中與你的 agent 聊天。

  </Step>
</Steps>

<Note>
權杖解析具有帳戶感知能力。設定中的權杖值優先於 env 後援。`DISCORD_BOT_TOKEN` 僅用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析為相同的機器人權杖，OpenClaw 只會為該權杖啟動一個 gateway 監控器。來自設定的權杖優先於預設 env 後援；否則第一個已啟用的帳戶勝出，重複帳戶會被回報為已停用。
對於進階的傳出呼叫（message 工具/頻道動作），會使用每次呼叫明確指定的 `token`。這適用於傳送與讀取/探測類動作（例如 read/search/fetch/thread/pins/permissions）。帳戶政策/重試設定仍來自作用中 runtime 快照中選取的帳戶。
</Note>

## 建議：設定伺服器工作區

DM 可用後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都取得自己的 agent 工作階段與自己的內容脈絡。這建議用於只有你和機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入伺服器允許清單">
    這會讓你的 agent 能在你的伺服器上的任何頻道中回應，而不只是 DM。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「將我的 Discord Server ID `<server_id>` 加入伺服器允許清單」
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

  <Step title="允許不需 @mention 也能回應">
    預設情況下，你的 agent 只有在伺服器頻道中被 @mentioned 時才會回應。對於私人伺服器，你可能會希望它回應每則訊息。

    在伺服器頻道中，一般助理的最終回覆預設會保持私密。可見的 Discord 輸出必須使用 `message` 工具明確傳送，因此 agent 預設可以旁觀，並只在判斷頻道回覆有用時才發文。

    這表示選取的模型必須可靠地呼叫工具。如果 Discord 顯示正在輸入，且記錄顯示有 token 使用量，但沒有張貼訊息，請在工作階段記錄中檢查是否有 `didSendViaMessagingTool: false` 的助理文字。這表示模型產生了私密的最終答案，而不是呼叫 `message(action=send)`。請切換至更強的工具呼叫模型，或使用下方設定還原舊版自動最終回覆。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「允許我的 agent 在這個伺服器上回應，不需要被 @mentioned」
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

        若要為群組/頻道房間還原舊版自動最終回覆，請設定 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃伺服器頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會在 DM 工作階段中載入。伺服器頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期脈絡，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要在每個頻道中共享脈絡，請將穩定的指示放入 `AGENTS.md` 或 `USER.md`（它們會注入每個工作階段）。將長期筆記保存在 `MEMORY.md`，並在需要時使用記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的 agent 可以看到頻道名稱，而每個頻道都會取得自己的隔離工作階段，因此你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的項目。

## Runtime 模型

- Gateway 擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord guild/channel 中繼資料會作為不受信任的
  context 加入模型 prompt，而不是作為使用者可見的回覆前綴。如果模型把該封套
  複製回來，OpenClaw 會從對外回覆和
  未來的重播 context 中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天共用代理的主要工作階段（`agent:main:main`）。
- Guild 頻道是隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組 DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生 slash commands 會在隔離的指令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 到路由的對話工作階段。
- 只含文字的 cron/heartbeat 宣告傳送到 Discord 時，會使用最終
  assistant 可見答案一次。當代理發出多個可傳送 payload 時，媒體和結構化元件 payload 仍會
  保持多則訊息。

## 論壇頻道

Discord 論壇和媒體頻道只接受 thread posts。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用你訊息中的第一個非空白行。
- 使用 `openclaw message thread create` 直接建立討論串。不要為論壇頻道傳入 `--message-id`。

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

論壇父層不接受 Discord 元件。如果你需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援代理訊息的 Discord components v2 containers。請搭配 `components` payload 使用訊息工具。互動結果會像一般傳入訊息一樣路由回代理，並遵循既有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`, `user`, `role`, `mentionable`, `channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取選單和表單在過期前多次使用。

若要限制誰可以點選按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不相符的使用者會收到 ephemeral 拒絕訊息。

`/model` 和 `/models` slash commands 會開啟互動式模型選擇器，包含供應商、模型和相容 runtime 下拉選單，以及提交步驟。`/models add` 已棄用，現在會傳回棄用訊息，而不會從聊天註冊模型。選擇器回覆是 ephemeral，且只有叫用的使用者可以使用。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應符合附件參照時，使用 `filename` 覆寫上傳名稱

Modal 表單：

- 加入 `components.modal`，最多 5 個欄位
- 欄位類型：`text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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
  <Tab title="DM 政策">
    `channels.discord.dmPolicy` 控制 DM 存取。`channels.discord.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式下提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用到 `default` 帳號。
    - 對於單一帳號，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 具名帳號在自身的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍會讀取以保持相容性。`openclaw doctor --fix` 會在可不變更存取權限的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    傳送用的 DM 目標格式：

    - `user:<id>`
    - `<@id>` mention

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效 DM `allowFrom` 中的 ID 會為了相容性被視為使用者 DM 目標。

  </Tab>

  <Tab title="DM 存取群組">
    Discord DM 可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。對於成員以各頻道一般 `allowFrom` 語法表示的靜態群組，請使用 `type: "message.senders"`；若 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格，請使用 `type: "discord.channelAudience"`。共用的存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 將成員資格建模為：DM 傳送者是所設定 guild 的成員，且在套用角色與頻道覆寫後，目前對所設定頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何能看到 `#maintainers` 的人 DM 機器人，同時讓其他所有人的 DM 保持關閉。

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

    查詢會失敗時關閉。如果 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同的 guild，DM 傳送者會被視為未授權。

    使用頻道受眾存取群組時，請在 Discord Developer Portal 為機器人啟用 **Server Members Intent**。DM 不包含 guild 成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="Guild 政策">
    Guild 處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準為 `allowlist`。

    `allowlist` 行為：

    - guild 必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅角色 ID）；若已設定任一項，傳送者在符合 `users` 或 `roles` 時會被允許
    - 預設停用直接名稱/標籤比對；僅在破窗相容模式下啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 較安全；使用名稱/標籤項目時，`openclaw security audit` 會警告
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

    如果你只設定 `DISCORD_BOT_TOKEN`，而沒有建立 `channels.discord` 區塊，runtime fallback 會是 `groupPolicy="allowlist"`（日誌中會有警告），即使 `channels.defaults.groupPolicy` 是 `open` 也一樣。

  </Tab>

  <Tab title="Mentions 和群組 DM">
    Guild 訊息預設會透過 mention 閘控。

    Mention 偵測包含：

    - 明確的機器人 mention
    - 設定的 mention patterns（`agents.list[].groupChat.mentionPatterns`，fallback 為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆機器人行為

    撰寫對外 Discord 訊息時，請使用標準 mention 語法：使用者用 `<@USER_ID>`，頻道用 `<#CHANNEL_ID>`，角色用 `<@&ROLE_ID>`。不要使用舊版 `<@!USER_ID>` 暱稱 mention 形式。

    `requireMention` 依 guild/channel 設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及其他使用者/角色但未提及機器人的訊息（排除 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選擇透過 `dm.groupChannels` 加入允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord guild 成員路由到不同代理。以角色為基礎的綁定只接受角色 ID，並會在 peer 或 parent-peer 綁定之後、guild-only 綁定之前評估。如果綁定也設定其他 match 欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須相符。

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

## 原生指令與指令授權

- `commands.native` 預設為 `"auto"`，且對 Discord 啟用。
- 個別頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間跳過 Discord 斜線指令註冊與清理。先前已註冊的指令可能仍會在 Discord 中可見，直到你從 Discord 應用程式中移除它們。
- 原生指令驗證使用與一般訊息處理相同的 Discord 允許清單/政策。
- 未授權的使用者可能仍會在 Discord UI 中看到指令；執行時仍會強制套用 OpenClaw 驗證並回傳「未授權」。

請參閱[斜線指令](/zh-TW/tools/slash-commands)以了解指令目錄與行為。

預設斜線指令設定：

- `ephemeral: true`

## 功能詳細資料

<AccordionGroup>
  <Accordion title="回覆標籤與原生回覆">
    Discord 支援代理程式輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）
    - `first`
    - `all`
    - `batched`

    注意：`off` 會停用隱含的回覆討論串。明確的 `[[reply_to_*]]` 標籤仍會被遵循。
    `first` 一律會把隱含的原生回覆參照附加到該回合的第一則傳出 Discord 訊息。
    `batched` 只有在傳入回合是多則訊息的去抖批次時，才會附加 Discord 的隱含原生回覆參照。這在你主要想針對語境可能不明的突發聊天使用原生回覆，而不是每個單則訊息回合都使用時很有用。

    訊息 ID 會顯示在上下文/歷史記錄中，讓代理程式可以鎖定特定訊息。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯該訊息來串流草稿回覆。`channels.discord.streaming` 可使用 `off`（預設）| `partial` | `block` | `progress`。`progress` 會保留一則可編輯的狀態草稿，並用工具進度更新它，直到最終送達；`streamMode` 是舊版別名，會自動遷移。

    預設維持 `off`，因為當多個機器人或 Gateway 共用帳號時，Discord 預覽編輯很快就會碰到速率限制。

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

    - `partial` 會在詞元抵達時編輯單一預覽訊息。
    - `block` 會發出草稿大小的區塊（使用 `draftChunk` 調整大小與斷點，並限制在 `textChunkLimit` 內）。
    - 媒體、錯誤與明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制精簡進度行中的指令/執行細節：`raw`（預設）或 `status`（僅工具標籤）。

    隱藏原始指令/執行文字，同時保留精簡進度行：

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

    預覽串流僅限文字；媒體回覆會退回一般送達方式。當明確啟用 `block` 串流時，OpenClaw 會跳過預覽串流以避免重複串流。

  </Accordion>

  <Accordion title="歷史記錄、上下文與討論串行為">
    伺服器歷史記錄上下文：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    DM 歷史記錄控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會以頻道工作階段路由，並繼承父頻道設定，除非被覆寫。
    - 討論串工作階段會繼承父頻道工作階段層級的 `/model` 選擇，作為僅模型的後援；討論串本機的 `/model` 選擇仍優先，且除非啟用逐字稿繼承，否則不會複製父逐字稿歷史記錄。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動討論串選擇從父逐字稿植入。個別帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會作為**不可信任**上下文注入。允許清單會管控誰能觸發代理程式，但不是完整的補充上下文遮蔽邊界。

  </Accordion>

  <Accordion title="子代理程式的討論串繫結工作階段">
    Discord 可以將討論串繫結到工作階段目標，讓該討論串中的後續訊息持續路由到相同工作階段（包含子代理程式工作階段）。

    指令：

    - `/focus <target>` 將目前/新討論串繫結到子代理程式/工作階段目標
    - `/unfocus` 移除目前討論串繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新已聚焦繫結的非活動自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新已聚焦繫結的硬性最長存留時間

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
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 與 ACP 討論串產生時是否自動建立/繫結討論串。預設：`true`。
    - `defaultSpawnContext` 控制討論串繫結產生時的原生子代理程式上下文。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某個帳號停用討論串繫結，`/focus` 與相關討論串繫結操作將不可用。

    請參閱[子代理程式](/zh-TW/tools/subagents)、[ACP 代理程式](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 頻道繫結">
    若要使用穩定的「永遠開啟」ACP 工作區，請設定頂層具型別 ACP 繫結來鎖定 Discord 對話。

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

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或討論串，並讓後續訊息維持在相同 ACP 工作階段。討論串訊息會繼承父頻道繫結。
    - 在已繫結的頻道或討論串中，`/new` 與 `/reset` 會就地重設相同 ACP 工作階段。暫時性討論串繫結在作用中時可覆寫目標解析。
    - `spawnSessions` 會管控透過 `--thread auto|here` 建立/繫結子討論串。

    請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)以了解繫結行為詳細資料。

  </Accordion>

  <Accordion title="反應通知">
    個別伺服器反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換成系統事件，並附加到路由到的 Discord 工作階段。

  </Accordion>

  <Accordion title="確認反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理程式身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意：

    - Discord 接受 Unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某個頻道或帳號的反應。

  </Accordion>

  <Accordion title="設定寫入">
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

  <Accordion title="Gateway 代理伺服器">
    透過 HTTP(S) 代理伺服器使用 `channels.discord.proxy` 路由 Discord Gateway WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    個別帳號覆寫：

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
    啟用 PluralKit 解析，以將代理轉送訊息對應到系統成員身分：

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

    - 允許清單可以使用 `pk:<memberId>`
    - 成員顯示名稱只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對
    - 查詢會使用原始訊息 ID，並受時間視窗限制
    - 若查詢失敗，代理轉送訊息會被視為機器人訊息並被丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理程式需要對已知 Discord 使用者進行確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含開頭 `@` 的控制代碼；值是 Discord 使用者 ID。未知控制代碼、`@everyone`、`@here`，以及 Markdown 程式碼跨度內的提及都會保持不變。

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

    - 0：正在玩
    - 1：正在直播（需要 `activityUrl`）
    - 2：正在聆聽
    - 3：正在觀看
    - 4：自訂（使用活動文字作為狀態；表情符號為選用）
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

    自動狀態會將執行階段可用性對應到 Discord 狀態：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在 DM 中透過按鈕處理核准，也可選擇在原始頻道中發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且可從 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出至少一位核准者時，Discord 會自動啟用原生執行核准。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷執行核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於敏感的僅擁有者群組命令，例如 `/diagnostics` 和 `/export-trajectory`，OpenClaw 會私下傳送核准提示與最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord DM；如果無法使用，則回退到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到暫時性拒絕。核准提示包含命令文字，因此只有在受信任的頻道中才應啟用頻道傳遞。如果無法從工作階段金鑰推導出頻道 ID，OpenClaw 會回退到 DM 傳遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 配接器主要新增核准者 DM 路由與頻道扇出。
    當這些按鈕存在時，它們是主要核准 UX；OpenClaw
    只有在工具結果表示聊天核准無法使用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但原生卡片無法傳遞到任何目標，
    OpenClaw 會在同一聊天中傳送備援通知，內含待處理核准中的確切 `/approve`
    命令。

    Gateway 驗證與核准解析遵循共用 Gateway 用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後到期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作包括傳訊、頻道管理、審核、狀態與中繼資料動作。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用於設定排定事件封面圖片。

動作閘門位於 `channels.discord.actions.*` 底下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw 使用 Discord components v2 來處理執行核准與跨內容標記。Discord 訊息動作也可以接受 `components` 作為自訂 UI（進階；需要透過 discord 工具建構 component 承載資料），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord component 容器使用的強調色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 針對每個帳號設定。
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

Discord 有兩種不同的語音介面：即時**語音頻道**（連續對話）與**語音訊息附件**（波形預覽格式）。Gateway 支援兩者。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 以 `bot` 和 `applications.commands` 範圍邀請機器人。
4. 在目標語音頻道授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號預設代理，並遵循與其他 Discord 命令相同的允許清單與群組政策規則。

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

備註：

- `voice.tts` 只會為語音播放覆寫 `messages.tts`。
- `voice.model` 只會覆寫 Discord 語音頻道回應使用的 LLM。保持未設定即可繼承路由後的代理模型。
- STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄輪次。
- 語音轉錄輪次會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態；非擁有者說話者無法存取僅擁有者工具（例如 `gateway` 和 `cron`）。
- Discord 語音對僅文字設定是選擇加入；設定 `channels.discord.voice.enabled=true`（或保留現有 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段，以及 `GuildVoiceStates` Gateway 意圖。
- `channels.discord.intents.voiceStates` 可以明確覆寫語音狀態意圖訂閱。保持未設定，讓該意圖跟隨有效的語音啟用狀態。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞到 `@discordjs/voice` 加入選項。
- 若未設定，`@discordjs/voice` 預設為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間。預設：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在中斷連線的語音工作階段開始重新連線前等待多久，之後才銷毀它。預設：`15000`。
- OpenClaw 也會監看接收解密失敗，並在短時間內重複失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收日誌反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集依賴報告與日誌。內建的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游填補修正，該修正關閉了 discord.js issue #11419。

語音頻道管線：

- Discord PCM 擷取會轉換為 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄會透過 Discord 進入與路由傳送，同時回應 LLM 會以語音輸出政策執行，該政策會隱藏代理 `tts` 工具並要求傳回文字，因為 Discord 語音擁有最終 TTS 播放。
- 設定 `voice.model` 時，只會覆寫此語音頻道輪次的回應 LLM。
- `voice.tts` 會合併覆蓋 `messages.tts`；產生的音訊會在已加入的頻道中播放。

憑證會依 component 解析：`voice.model` 的 LLM 路由驗證、`tools.media.audio` 的 STT 驗證，以及 `messages.tts`/`voice.tts` 的 TTS 驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要 Gateway 主機上的 `ffmpeg` 和 `ffprobe` 來檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一承載資料中的文字 + 語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="使用了不允許的意圖或機器人看不到伺服器訊息">

    - 啟用 Message Content Intent
    - 當你依賴使用者/成員解析時，啟用 Server Members Intent
    - 變更意圖後重新啟動 gateway

  </Accordion>

  <Accordion title="伺服器訊息意外遭封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 底下的伺服器允許清單
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

    - `groupPolicy="allowlist"` 但沒有相符的伺服器/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目底下）
    - 傳送者被伺服器/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 輪次或重複回覆">

    典型日誌：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 佇列旋鈕：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord Gateway 監聽器工作，不控制代理輪次生命週期

    Discord 不會將頻道擁有的逾時套用到排入佇列的代理輪次。訊息監聽器會立即交接，排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回使用 Discord 的預設 Gateway URL，並在記錄中進行速率限制。

    中繼資料逾時控制項：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定設定時的環境變數後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway READY 逾時重新啟動">
    OpenClaw 會在啟動期間和執行階段重新連線後等待 Discord 的 Gateway `READY` 事件。具有啟動錯開的多帳號設定，可能需要比預設值更長的啟動 READY 視窗。

    READY 逾時控制項：

    - 啟動單一帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定設定時的啟動環境變數後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單一帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定設定時的執行階段環境變數後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不一致">
    `channels status --probe` 權限檢查僅適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但探測無法完整驗證權限。

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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 而中斷">

    - 保持 OpenClaw 為最新版本（`openclaw update`），確保 Discord 語音接收復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，僅在需要時調整
    - 觀察記錄是否出現：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，請收集記錄，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史進行比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`, `token`, `accounts.*`, `allowBots`
- 政策：`groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- 命令：`commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算）、`eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway：`gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 傳遞：`textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制傳出的 Discord 上傳，預設 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態顯示：`activity`, `status`, `activityType`, `activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`, 頂層 `bindings[]`（`type: "acp"`）、`pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## 安全與維運

- 將 bot token 視為機密（在受監督的環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 如果命令部署/狀態已過期，請重新啟動 Gateway，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到 Gateway。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將伺服器與頻道對應到代理。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
