---
read_when:
    - 正在開發 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

已可透過官方 Discord gateway 用於私訊與伺服器頻道。

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

你需要建立一個含有機器人的新應用程式、將機器人加入你的伺服器，並將它配對到 OpenClaw。我們建議將你的機器人加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後點選 **New Application**。將它命名為類似「OpenClaw」的名稱。

    點選側邊欄中的 **Bot**。將 **Username** 設為你對 OpenClaw agent 的稱呼。

  </Step>

  <Step title="啟用特權 intents">
    仍在 **Bot** 頁面上，向下捲動至 **Privileged Gateway Intents**，並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱對 ID 比對需要）
    - **Presence Intent**（選用；只有 presence 更新需要）

  </Step>

  <Step title="複製你的機器人 token">
    在 **Bot** 頁面向上捲回，並點選 **Reset Token**。

    <Note>
    儘管名稱如此，這會產生你的第一個 token，並沒有任何東西被「重設」。
    </Note>

    複製 token 並儲存在某處。這是你的 **Bot Token**，你很快就會需要它。

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    點選側邊欄中的 **OAuth2**。你會產生一個具有正確權限的邀請 URL，用來將機器人加入你的伺服器。

    向下捲動至 **OAuth2 URL Generator**，並啟用：

    - `bot`
    - `applications.commands`

    下方會出現 **Bot Permissions** 區段。至少啟用：

    **一般權限**
      - 檢視頻道
    **文字權限**
      - 傳送訊息
      - 讀取訊息記錄
      - 嵌入連結
      - 附加檔案
      - 新增反應（選用）

    這是一般文字頻道的基準集合。如果你打算在 Discord 討論串中發文，包括會建立或繼續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後點選 **Continue** 以連線。你現在應該能在 Discord 伺服器中看到你的機器人。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord app，你需要啟用開發者模式，才能複製內部 ID。

    1. 點選 **User Settings**（頭像旁的齒輪圖示）→ **Advanced** → 開啟 **Developer Mode**
    2. 在側邊欄中右鍵點選你的 **server icon** → **Copy Server ID**
    3. 右鍵點選你**自己的頭像** → **Copy User ID**

    將你的 **Server ID** 和 **User ID** 與 Bot Token 一起儲存，你會在下一步將三者都傳送給 OpenClaw。

  </Step>

  <Step title="允許來自伺服器成員的私訊">
    若要讓配對運作，Discord 需要允許你的機器人傳送私訊給你。右鍵點選你的 **server icon** → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括機器人）傳送私訊給你。如果你想搭配 OpenClaw 使用 Discord 私訊，請保持此設定啟用。如果你只打算使用伺服器頻道，可以在配對後停用私訊。

  </Step>

  <Step title="安全設定你的機器人 token（不要在聊天中傳送）">
    你的 Discord 機器人 token 是祕密（像密碼一樣）。請先在執行 OpenClaw 的機器上設定它，再傳訊息給你的 agent。

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

    如果 OpenClaw 已作為背景服務執行，請透過 OpenClaw Mac app 重新啟動，或停止並重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請在存在 `DISCORD_BOT_TOKEN` 的 shell 中執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後能解析 env SecretRef。
    如果你的主機被 Discord 的啟動應用程式查詢封鎖或受到速率限制，請從 Developer Portal 設定 Discord application/client ID，讓啟動流程可以略過該 REST 呼叫。預設帳號請使用 `channels.discord.applicationId`；執行多個 Discord 機器人時，請使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的 agent">
        在任何現有頻道（例如 Telegram）與你的 OpenClaw agent 聊天並告訴它。如果 Discord 是你的第一個頻道，請改用 CLI / 設定分頁。

        >「我已在設定中設定 Discord 機器人 token。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
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

        預設帳號的 env 後援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於腳本化或遠端設定，請用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，接著不帶 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec providers 的 SecretRef 值。請參閱[祕密管理](/zh-TW/gateway/secrets)。

        對於多個 Discord 機器人，請將每個機器人 token 和 application ID 放在各自的帳號下。最上層的 `channels.discord.applicationId` 會由帳號繼承，因此只有在每個帳號都應使用相同 application ID 時，才在那裡設定。

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
    等到 Gateway 執行後，在 Discord 中私訊你的機器人。它會回覆配對碼。

    <Tabs>
      <Tab title="詢問你的 agent">
        將配對碼透過現有頻道傳送給你的 agent：

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

    你現在應該可以透過 Discord 私訊與你的 agent 聊天。

  </Step>
</Steps>

<Note>
Token 解析會識別帳號。設定中的 token 值優先於 env 後援。`DISCORD_BOT_TOKEN` 只會用於預設帳號。
如果兩個已啟用的 Discord 帳號解析為相同的機器人 token，OpenClaw 只會為該 token 啟動一個 Gateway 監控器。設定來源的 token 優先於預設 env 後援；否則第一個已啟用帳號優先，重複帳號會回報為已停用。
對於進階對外呼叫（訊息工具/頻道動作），明確的逐次呼叫 `token` 會用於該呼叫。這適用於傳送與讀取/探測風格動作（例如 read/search/fetch/thread/pins/permissions）。帳號政策/重試設定仍來自作用中執行階段快照中選取的帳號。
</Note>

## 建議：設定伺服器工作區

私訊能運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的 agent 工作階段與自己的情境。這建議用於只有你和機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入伺服器允許清單">
    這會讓你的 agent 在伺服器上的任何頻道回應，而不只是私訊。

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

    在伺服器頻道中，一般 assistant 最終回覆預設仍是私人的。可見的 Discord 輸出必須使用 `message` 工具明確傳送，因此 agent 預設可以旁聽，只有在判斷頻道回覆有用時才發文。

    這表示所選模型必須可靠地呼叫工具。如果 Discord 顯示正在輸入且記錄顯示 token 使用量，但沒有張貼訊息，請檢查工作階段記錄中是否有 `didSendViaMessagingTool: false` 的 assistant 文字。這表示模型產生了私人最終答案，而不是呼叫 `message(action=send)`。請切換到工具呼叫能力更強的模型，或使用下方設定還原舊版自動最終回覆。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「允許我的 agent 在這個伺服器上不必被 @mentioned 也能回應」
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
    預設情況下，長期記憶（MEMORY.md）只會在私訊工作階段載入。伺服器頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「當我在 Discord 頻道提問時，如果你需要來自 MEMORY.md 的長期情境，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要在每個頻道中共用情境，請將穩定指示放在 `AGENTS.md` 或 `USER.md`（它們會注入每個工作階段）。將長期筆記保存在 `MEMORY.md`，並按需使用記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的 agent 可以看到頻道名稱，而且每個頻道都有自己的隔離工作階段，所以你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的內容。

## 執行階段模型

- Gateway 負責 Discord 連線。
- 回覆路由是確定性的：Discord 的傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的
  context 加入模型提示，而不是使用者可見的回覆前綴。如果模型把該封套
  複製回來，OpenClaw 會從傳出回覆和
  未來的重播 context 中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理的主工作階段（`agent:main:main`）。
- 伺服器頻道會使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組 DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 到已路由的對話工作階段。
- 傳送到 Discord 的純文字 Cron/Heartbeat 公告只會使用一次最終的
  助理可見答案。當代理發出多個可傳遞 payload 時，媒體和結構化元件 payload 仍會
  以多訊息形式傳送。

## 論壇頻道

Discord 論壇和媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 將訊息傳送到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用訊息的第一個非空白行。
- 使用 `openclaw message thread create` 直接建立討論串。論壇頻道不要傳入 `--message-id`。

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

OpenClaw 支援用於代理訊息的 Discord components v2 容器。使用 message 工具並帶上 `components` payload。互動結果會像一般傳入訊息一樣路由回代理，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取和表單在過期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不符合的使用者會收到短暫顯示的拒絕訊息。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含供應商、模型和相容執行階段下拉選單，以及提交步驟。`/models add` 已被取代，現在會傳回棄用訊息，而不是從聊天註冊模型。選擇器回覆是短暫顯示的，且只有呼叫的使用者可以使用。

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
  <Tab title="DM 政策">
    `channels.discord.dmPolicy` 控制 DM 存取。`channels.discord.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中被提示進行配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用於 `default` 帳號。
    - 對單一帳號而言，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 當具名帳號自己的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍會讀取以維持相容性。`openclaw doctor --fix` 會在不變更存取權的情況下，盡可能將它們遷移到 `dmPolicy` 和 `allowFrom`。

    用於傳遞的 DM 目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效 DM `allowFrom` 中的 ID 會為了相容性被視為使用者 DM 目標。

  </Tab>

  <Tab title="DM 存取群組">
    Discord DM 可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。靜態群組請使用 `type: "message.senders"`，其成員以各頻道一般的 `allowFrom` 語法表示；當 Discord 頻道目前的 `ViewChannel` audience 應動態定義成員資格時，請使用 `type: "discord.channelAudience"`。共用存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 會將成員資格建模為：DM 傳送者是已設定伺服器的成員，且在套用身分組和頻道覆寫後，目前對已設定頻道具有效的 `ViewChannel` 權限。

    範例：允許任何可以看見 `#maintainers` 的人傳送 DM 給 bot，同時對其他所有人關閉 DM。

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

    查詢會以關閉方式失敗。如果 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，DM 傳送者會被視為未授權。

    使用頻道 audience 存取群組時，請在 Discord Developer Portal 為 bot 啟用 **Server Members Intent**。DM 不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="伺服器政策">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準是 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅限身分組 ID）；如果其中任一項已設定，傳送者符合 `users` 或 `roles` 時即允許
    - 預設停用直接名稱/標籤比對；只有作為緊急相容模式時，才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 更安全；使用名稱/標籤項目時，`openclaw security audit` 會警告
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

    如果你只設定 `DISCORD_BOT_TOKEN` 且未建立 `channels.discord` 區塊，執行階段 fallback 會是 `groupPolicy="allowlist"`（並在日誌中警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="提及與群組 DM">
    伺服器訊息預設以提及作為閘門。

    提及偵測包括：

    - 明確提及 bot
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，fallback 為 `messages.groupChat.mentionPatterns`）
    - 在支援情況下的隱含回覆 bot 行為

    撰寫傳出的 Discord 訊息時，請使用標準提及語法：使用 `<@USER_ID>` 提及使用者、`<#CHANNEL_ID>` 提及頻道，以及 `<@&ROLE_ID>` 提及身分組。不要使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性捨棄提及其他使用者/身分組但未提及 bot 的訊息（不包括 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選的允許清單透過 `dm.groupChannels`（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 基於身分組的代理路由

使用 `bindings[].match.roles` 依身分組 ID 將 Discord 伺服器成員路由到不同代理。基於身分組的繫結只接受身分組 ID，並在 peer 或 parent-peer 繫結之後、僅伺服器繫結之前評估。如果繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須符合。

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

- `commands.native` 預設為 `"auto"`，且已為 Discord 啟用。
- 每頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前已註冊的命令可能仍會在 Discord 中可見，直到你從 Discord app 中移除它們。
- 原生命令驗證會使用與一般訊息處理相同的 Discord allowlist/政策。
- 對未經授權的使用者而言，命令可能仍會顯示在 Discord UI 中；執行時仍會強制套用 OpenClaw 驗證並回傳「未授權」。

請參閱[斜線命令](/zh-TW/tools/slash-commands)以了解命令目錄與行為。

預設斜線命令設定：

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

    注意：`off` 會停用隱含的回覆串接。明確的 `[[reply_to_*]]` 標籤仍會被遵循。
    `first` 一律會將隱含的原生回覆參照附加到該回合第一則傳出的 Discord 訊息。
    `batched` 只會在傳入回合是由多則訊息組成的防抖批次時，附加 Discord 的隱含原生回覆參照。當你主要想針對模糊、密集突發的聊天使用原生回覆，而不是每個單則訊息回合都使用時，這會很有用。

    訊息 ID 會在內容/歷史中公開，讓代理可以鎖定特定訊息。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯該訊息，來串流草稿回覆。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（預設）。`progress` 會保留一則可編輯的狀態草稿，並以工具進度更新它，直到最終送達；`streamMode` 是舊版執行階段別名。執行 `openclaw doctor --fix` 可將已保存的設定重寫為標準鍵。

    將 `channels.discord.streaming.mode` 設為 `off` 可停用 Discord 預覽編輯。如果已明確啟用 Discord 區塊串流，OpenClaw 會略過預覽串流以避免重複串流。

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
    - `block` 會發出草稿大小的區塊（使用 `draftChunk` 調整大小與斷點，並限制在 `textChunkLimit` 內）。
    - 媒體、錯誤與明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制精簡進度列中的命令/執行細節：`raw`（預設）或 `status`（僅工具標籤）。

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

    預覽串流僅支援文字；媒體回覆會回退到一般送達。當已明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免重複串流。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Guild 歷史內容：

    - `channels.discord.historyLimit` 預設 `20`
    - fallback：`messages.groupChat.historyLimit`
    - `0` 會停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    對話串行為：

    - Discord 對話串會作為頻道工作階段路由，並繼承父頻道設定，除非被覆寫。
    - 對話串工作階段會繼承父頻道工作階段層級的 `/model` 選擇，作為僅模型的 fallback；對話串本機的 `/model` 選擇仍優先，而且除非啟用 transcript 繼承，否則不會複製父 transcript 歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）讓新的自動對話串選擇從父 transcript 種子化。每帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用 fallback 期間保留。

    頻道主題會作為**不可信**內容注入。allowlist 會管控誰能觸發代理，而不是完整的補充內容遮蔽邊界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以將對話串綁定到工作階段目標，讓該對話串中的後續訊息持續路由到同一個工作階段（包含子代理工作階段）。

    命令：

    - `/focus <target>` 將目前/新的對話串綁定到子代理/工作階段目標
    - `/unfocus` 移除目前的對話串綁定
    - `/agents` 顯示作用中的執行與綁定狀態
    - `/session idle <duration|off>` 檢查/更新焦點綁定的不活動自動取消焦點
    - `/session max-age <duration|off>` 檢查/更新焦點綁定的硬性最長存續時間

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
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 與 ACP 對話串產生時的自動建立/綁定對話串。預設：`true`。
    - `defaultSpawnContext` 控制對話串綁定產生的原生子代理內容。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某帳號停用了對話串綁定，`/focus` 與相關的對話串綁定操作將無法使用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    若要使用穩定的「永遠開啟」ACP 工作區，請設定指向 Discord 對話的頂層型別化 ACP 綁定。

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

    - `/acp spawn codex --bind here` 會就地綁定目前頻道或對話串，並讓後續訊息維持在同一個 ACP 工作階段。對話串訊息會繼承父頻道綁定。
    - 在已綁定的頻道或對話串中，`/new` 與 `/reset` 會就地重設同一個 ACP 工作階段。暫時對話串綁定可在作用中時覆寫目標解析。
    - `spawnSessions` 會管控透過 `--thread auto|here` 建立/綁定子對話串。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)以了解綁定行為詳細資料。

  </Accordion>

  <Accordion title="Reaction notifications">
    每個 guild 的反應通知模式：

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
    - 代理身分 emoji fallback（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Discord 接受 unicode emoji 或自訂 emoji 名稱。
    - 使用 `""` 可停用某頻道或帳號的反應。

  </Accordion>

  <Accordion title="Config writes">
    頻道發起的設定寫入預設為啟用。

    這會影響 `/config set|unset` 流程（當命令功能已啟用時）。

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
    透過 `channels.discord.proxy`，將 Discord gateway WebSocket 流量與啟動 REST 查找（application ID + allowlist 解析）路由至 HTTP(S) proxy。

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
    啟用 PluralKit 解析，將 proxied 訊息對應到系統成員身分：

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

    - allowlist 可以使用 `pk:<memberId>`
    - 成員顯示名稱只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對
    - 查找會使用原始訊息 ID，並受時間窗口限制
    - 如果查找失敗，proxied 訊息會被視為機器人訊息並丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    當代理需要對已知 Discord 使用者使用確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含前導 `@` 的 handle；值是 Discord 使用者 ID。未知 handle、`@everyone`、`@here` 以及 Markdown code span 內的提及會保持不變。

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
    當你設定狀態或活動欄位，或啟用自動 presence 時，會套用 presence 更新。

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

    - 0：Playing
    - 1：Streaming（需要 `activityUrl`）
    - 2：Listening
    - 3：Watching
    - 4：Custom（使用活動文字作為狀態 state；emoji 為選用）
    - 5：Competing

    自動 presence 範例（執行階段健康訊號）：

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
    - `autoPresence.exhaustedText`（支援 `{reason}` 佔位符）

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord 支援在 DM 中使用按鈕式核准處理，也可以選擇在原始頻道中發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可解析一位核准者時，Discord 會自動啟用原生 exec 核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷 exec 核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於敏感的僅限擁有者群組命令，例如 `/diagnostics` 和 `/export-trajectory`，OpenClaw 會私下傳送核准提示和最終結果。若呼叫的擁有者有 Discord 擁有者路由，它會先嘗試 Discord DM；若不可用，則會退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到短暫的拒絕訊息。核准提示包含命令文字，因此只應在受信任頻道啟用頻道投遞。若無法從工作階段金鑰推導頻道 ID，OpenClaw 會退回使用 DM 投遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 轉接器主要新增核准者 DM 路由和頻道扇出。
    這些按鈕存在時，它們就是主要的核准 UX；OpenClaw
    只有在工具結果指出聊天核准不可用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但無法將原生卡片投遞到任何目標，
    OpenClaw 會在同一個聊天中傳送備援通知，內含待處理核准的確切 `/approve`
    命令。

    Gateway 驗證與核准解析遵循共用 Gateway 用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設在 30 分鐘後到期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作包含訊息、頻道管理、審核、狀態和中繼資料動作。

核心範例：

- 訊息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），以設定已排程事件的封面圖片。

動作閘門位於 `channels.discord.actions.*` 底下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 已啟用   |
| roles                                                                                                                                                                    | 已停用   |
| moderation                                                                                                                                                               | 已停用   |
| presence                                                                                                                                                                 | 已停用   |

## Components v2 UI

OpenClaw 對 exec 核准與跨情境標記使用 Discord components v2。Discord 訊息動作也可以接受 `components` 以提供自訂 UI（進階；需要透過 discord 工具建構元件酬載），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord 元件容器使用的強調色（hex）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 依帳號設定。
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

Discord 有兩種不同的語音介面：即時**語音頻道**（連續對話）和**語音訊息附件**（波形預覽格式）。Gateway 兩者都支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 範圍邀請機器人。
4. 在目標語音頻道授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號預設 agent，並遵循與其他 Discord 命令相同的允許清單和群組原則規則。

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

- `voice.tts` 只會針對語音播放覆寫 `messages.tts`。
- `voice.model` 只會覆寫 Discord 語音頻道回應所使用的 LLM。留空可繼承已路由的 agent 模型。
- STT 使用 `tools.media.audio`；`voice.model` 不影響轉錄。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄回合。
- 語音轉錄回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態；非擁有者發言者無法存取僅限擁有者的工具（例如 `gateway` 和 `cron`）。
- Discord 語音對純文字設定是選用功能；設定 `channels.discord.voice.enabled=true`（或保留既有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段和 `GuildVoiceStates` gateway intent。
- `channels.discord.intents.voiceStates` 可以明確覆寫語音狀態 intent 訂閱。留空時，intent 會跟隨有效的語音啟用狀態。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞至 `@discordjs/voice` 加入選項。
- 若未設定，`@discordjs/voice` 預設為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待其開始重新連線的時間。預設值：`15000`。
- OpenClaw 也會監看接收解密失敗，並在短時間內重複失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收日誌反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集依賴項報告與日誌。隨附的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游 padding 修正，該修正已關閉 discord.js issue #11419。

語音頻道管線：

- Discord PCM 擷取會轉換為 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄會透過 Discord 入口與路由傳送，而回應 LLM 會以語音輸出原則執行；該原則會隱藏 agent `tts` 工具並要求返回文字，因為 Discord 語音擁有最終 TTS 播放。
- 設定 `voice.model` 時，只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會合併到 `messages.tts` 之上；產生的音訊會在已加入的頻道中播放。

憑證會依元件解析：`voice.model` 的 LLM 路由驗證、`tools.media.audio` 的 STT 驗證，以及 `messages.tts`/`voice.tts` 的 TTS 驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要 gateway 主機上的 `ffmpeg` 和 `ffprobe` 來檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一個酬載中的文字 + 語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

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
    - 驗證 `channels.discord.guilds` 底下的 guild 允許清單
    - 如果 guild `channels` 對應存在，只有列出的頻道會被允許
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

    - `groupPolicy="allowlist"` 沒有相符的 guild/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目底下）
    - 傳送者被 guild/頻道 `users` 允許清單阻擋

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    典型日誌：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway 佇列調整項：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只會控制 Discord gateway listener 工作，不會控制 agent 回合生命週期

    Discord 不會將頻道擁有的逾時套用到已排入佇列的 agent 回合。訊息 listener 會立即交接，而已排入佇列的 Discord 執行會保留每個工作階段的排序，直到工作階段/工具/執行階段生命週期完成或中止該工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回使用 Discord 的預設 Gateway URL，並在日誌中受到速率限制。

    中繼資料逾時旋鈕：

    - 單帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定組態時的環境變數後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway READY 逾時重新啟動">
    OpenClaw 會在啟動期間及執行階段重新連線後，等待 Discord 的 Gateway `READY` 事件。使用啟動錯開的多帳號設定，可能需要比預設值更長的啟動 READY 等待時間。

    READY 逾時旋鈕：

    - 啟動單帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定組態時的啟動環境變數後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定組態時的執行階段環境變數後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但探測無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 和配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人迴圈">
    預設會忽略由機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及和允許清單規則，避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該機器人的機器人訊息。

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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 而丟失">

    - 保持 OpenClaw 為最新版本（`openclaw update`），以確保包含 Discord 語音接收復原邏輯
    - 確認 `channels.discord.voice.daveEncryption=true`（預設）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，僅在需要時調整
    - 觀察日誌中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，請收集日誌，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史進行比較

  </Accordion>
</AccordionGroup>

## 組態參考

主要參考：[組態參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高價值 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- Gateway：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制對外 Discord 上傳，預設 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態顯示：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與操作

- 將機器人權杖視為祕密（在受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最小權限的 Discord 權限。
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
