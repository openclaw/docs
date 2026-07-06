---
read_when:
    - 正在處理 Discord 頻道功能
summary: Discord Bot 設定、設定鍵、元件、語音與疑難排解
title: Discord
x-i18n:
    generated_at: "2026-07-06T10:46:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd5ae9630eb7629548f79294488161747e21161a3fc73df2962a4edc3ad660c
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw 透過官方 Discord 閘道以機器人身分連接 Discord。支援 DM 和伺服器頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord DM 預設為配對模式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

建立一個含機器人的 Discord 應用程式，將機器人加入你的伺服器，並與 OpenClaw 配對。如果可以，請使用私人伺服器；如有需要，請先[建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    在 [Discord Developer Portal](https://discord.com/developers/applications) 中，按一下 **New Application** 並為它命名（例如「OpenClaw」）。

    在側邊欄開啟 **Bot**，並將 **Username** 設為你的代理程式名稱。

  </Step>

  <Step title="啟用特權 intent">
    仍在 **Bot** 頁面中，於 **Privileged Gateway Intents** 下啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單、名稱對 ID 比對，以及頻道受眾存取群組需要）
    - **Presence Intent**（選用；僅用於狀態更新）

  </Step>

  <Step title="複製你的機器人權杖">
    在 **Bot** 頁面中，按一下 **Reset Token** 並複製權杖。

    <Note>
    雖然名稱如此，這會產生你的第一個權杖 — 並沒有任何東西被「重設」。
    </Note>

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    在側邊欄開啟 **OAuth2**。在 **OAuth2 URL Generator** 中啟用這些 scope：

    - `bot`
    - `applications.commands`

    在出現的 **Bot Permissions** 區段中，至少啟用：

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（選用）

    這是一般文字頻道的基準。如果機器人會在討論串中發文，包括建立或接續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。

    複製產生的 URL，在瀏覽器中開啟，選取你的伺服器，然後按一下 **Continue**。機器人現在應該會出現在你的伺服器中。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    在 Discord 應用程式中，啟用開發者模式，以便複製 ID：

    1. **User Settings**（齒輪圖示）→ **Developer** → 開啟 **Developer Mode**
       *（行動版：**App Settings** → **Advanced**）*
    2. 以右鍵按一下你的 **server icon** → **Copy Server ID**
    3. 以右鍵按一下你的**個人頭像** → **Copy User ID**

    將 Server ID 和 User ID 與你的機器人權杖放在一起；下一步需要這三項。

  </Step>

  <Step title="允許來自伺服器成員的 DM">
    若要讓配對運作，Discord 必須允許機器人傳送 DM 給你。以右鍵按一下你的 **server icon** → **Privacy Settings** → 開啟 **Direct Messages**。

    如果你會搭配 OpenClaw 使用 Discord DM，請保持開啟。如果你只使用伺服器頻道，可以在配對後停用。

  </Step>

  <Step title="安全設定你的機器人權杖（不要在聊天中傳送）">
    機器人權杖是秘密。請先在執行 OpenClaw 的機器上設定它，再傳訊息給你的代理程式：

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

    如果 OpenClaw 已作為背景服務執行，請透過 OpenClaw Mac 應用程式重新啟動，或停止並重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請從已設定 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後可解析 env SecretRef。
    如果你的主機遭 Discord 的啟動應用程式查詢封鎖或速率限制，請從 Developer Portal 設定 application/client ID，讓啟動流程可略過該 REST 呼叫：預設帳戶使用 `channels.discord.applicationId`，或每個機器人使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的代理程式">
        在既有頻道（例如 Telegram）與你的 OpenClaw 代理程式聊天並告訴它。如果 Discord 是你的第一個頻道，請改用命令列介面 / config 分頁。

        >「我已經在 config 中設定 Discord bot token。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
      </Tab>
      <Tab title="命令列介面 / config">
        以檔案為基礎的 config：

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

        對於腳本化或遠端設定，使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不帶 `--dry-run` 重新執行。純文字 `token` 字串也可使用，且 `channels.discord.token` 支援跨 env/file/exec providers 的 SecretRef 值。請參閱[秘密管理](/zh-TW/gateway/secrets)。

        若有多個 Discord 機器人，請將每個機器人權杖與 application ID 放在各自帳戶下。最上層的 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都使用相同 application ID 時才在那裡設定。

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
    閘道開始執行後，在 Discord 中 DM 你的機器人。它會回覆配對碼。

    <Tabs>
      <Tab title="詢問你的代理程式">
        在你的既有頻道將配對碼傳送給代理程式：

        >「核准這個 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="命令列介面">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後過期。核准後，即可在 Discord DM 中與你的代理程式聊天。

  </Step>
</Steps>

<Note>
權杖解析會感知帳戶。Config token 值優先於 env fallback，而 `DISCORD_BOT_TOKEN` 只會用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析為相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監控：來自 config 的權杖優先於 env fallback；否則第一個已啟用帳戶勝出，重複帳戶會回報為已停用，原因為 `duplicate bot token`。
對於進階 outbound 呼叫（message tool/channel actions），明確的每次呼叫 `token` 會用於該呼叫。這適用於傳送與 read/probe 風格的動作（read/search/fetch/thread/pins/permissions）。帳戶 policy/retry 設定仍來自作用中 runtime snapshot 裡選取的帳戶。
</Note>

## 建議：設定伺服器工作區

DM 可運作後，你可以將伺服器變成完整工作區，讓每個頻道都有自己的代理程式工作階段與自己的脈絡。建議用於只有你和你的機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入伺服器允許清單">
    這會讓你的代理程式可在你伺服器上的任何頻道回應，而不只是 DM。

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

  <Step title="允許不需 @mention 的回應">
    預設情況下，代理程式只會在伺服器頻道中被 @mentioned 時回應。在私人伺服器上，你可能希望它回應每則訊息。

    在伺服器頻道中，一般回覆預設會自動發出。對於共享的常駐聊天室，選擇使用 `messages.groupChat.visibleReplies: "message_tool"`，讓代理程式可潛伏，並只在判斷頻道回覆有用時才發文。這最適合最新世代、工具可靠的模型，例如 GPT 5.5。周遭聊天室事件會保持安靜，除非工具送出。完整潛伏模式 config 請參閱[周遭聊天室事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入，且 logs 顯示 token 用量但沒有發出訊息，請檢查該 turn 是否設定為周遭聊天室事件，或是否選擇使用 message-tool visible replies。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「允許我的代理程式在這個伺服器上回應，不必被 @mentioned」
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

        若要要求可見的群組/頻道回覆使用 message-tool sends，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃伺服器頻道中的記憶">
    長期記憶（MEMORY.md）只會在 DM 工作階段中自動載入；伺服器頻道不會載入它。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期脈絡，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        若每個頻道都需要共享脈絡，請將穩定指示放在 `AGENTS.md` 或 `USER.md`（會注入每個工作階段）。將長期筆記保留在 `MEMORY.md`，並按需使用記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在建立頻道並開始聊天。代理程式會看見頻道名稱，且每個頻道都是隔離的工作階段 — 設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## Runtime 模型

- 閘道擁有 Discord 連線。
- 回覆路由是確定性的：Discord inbound 會回覆到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任脈絡加入模型 prompt，而不是作為使用者可見的回覆前綴。如果模型把該 envelope 複製回來，OpenClaw 會從 outbound 回覆和未來 replay 脈絡中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理程式主要工作階段（`agent:main:main`）。
- 伺服器頻道是隔離的工作階段 key（`agent:<agentId>:discord:channel:<channelId>`）。
- Group DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 到路由後的對話工作階段。
- 傳送到 Discord 的純文字 cron/heartbeat 公告會收斂為最終的 assistant-visible answer，並只傳送一次。當代理程式發出多個可傳遞 payload 時，媒體與結構化元件 payload 仍會是多訊息。

## 論壇頻道

Discord 論壇和媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用訊息的第一個非空白行（截斷至 Discord 的 100 字元討論串名稱限制）。
- 使用 `openclaw message thread create` 直接建立討論串。請勿對論壇頻道傳入 `--message-id`。

傳送到論壇父層以建立討論串：

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

明確建立論壇討論串：

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

論壇父層不接受 Discord 元件。如果你需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援供代理訊息使用的 Discord components v2 容器。使用訊息工具並搭配 `components` 承載資料。互動結果會像一般傳入訊息一樣路由回代理，並遵循既有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取項和表單在到期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。不符合的使用者會收到僅自己可見的拒絕訊息。

元件回呼預設會在 30 分鐘後到期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設帳號的回呼登錄生命週期，或依帳號設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。此值以毫秒為單位，必須是正整數，且上限為 `86400000`（24 小時）。較長的 TTL 適合需要讓按鈕保持可用的審查/核准工作流程，但也會延長舊 Discord 訊息仍可觸發動作的時間範圍。請偏好使用符合需求的最短 TTL，並在過期回呼會令人意外時保留預設值。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含供應商、模型和相容執行階段下拉選單，並有提交步驟。`/models add` 已棄用，會傳回棄用訊息，而不是從聊天註冊模型。選擇器回覆是僅自己可見的，且只能由呼叫它的使用者使用。Discord 選取選單限制為 25 個選項，因此當你希望選擇器只針對所選供應商（例如 `openai` 或 `vllm`）顯示動態探索到的模型時，請將 `provider/*` 項目加入 `agents.defaults.models`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應與附件參照相符時，使用 `filename` 覆寫上傳名稱

模態表單：

- 加入 `components.modal`，最多可包含 5 個欄位
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
  <Tab title="私訊政策">
    `channels.discord.dmPolicy` 控制 DM 存取。`channels.discord.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`（至少需要一個 `allowFrom` 傳送者）
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中被提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用至 `default` 帳號。
    - 對單一帳號而言，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 當具名帳號本身的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    為了相容性，仍會讀取舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom`。`openclaw doctor --fix` 會在不變更存取權的情況下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    傳遞用的 DM 目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效 DM `allowFrom` 中的 ID，為了相容性會被視為使用者 DM 目標。

  </Tab>

  <Tab title="存取群組">
    Discord DM 和文字命令授權可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。對成員以各頻道一般 `allowFrom` 語法表示的靜態群組使用 `type: "message.senders"`，或在 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格時使用 `type: "discord.channelAudience"`。共用存取群組行為：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 會將成員資格建模為：DM 傳送者是已設定伺服器的成員，且在套用角色與頻道覆寫後，目前對已設定頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何可以看見 `#maintainers` 的人 DM Bot，同時對其他所有人關閉 DM。

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

    查詢會以失敗即關閉的方式處理。如果 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，DM 傳送者會被視為未授權。

    使用頻道受眾存取群組時，請啟用 Discord Developer Portal **Server Members Intent**。DM 不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="伺服器政策">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準是 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（偏好使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅限角色 ID）；如果任一項已設定，傳送者符合 `users` 或 `roles` 時即允許
    - 預設停用直接名稱/標籤比對；只有在緊急相容模式下才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    舊版每頻道 `allow` 鍵會由 `openclaw doctor --fix` 遷移到 `enabled`。

    如果你只設定 `DISCORD_BOT_TOKEN` 而未建立 `channels.discord` 區塊，執行階段備援會是 `groupPolicy="allowlist"`（並在日誌中發出警告），即使 `channels.defaults.groupPolicy` 是 `open` 也是如此。

  </Tab>

  <Tab title="提及與群組 DM">
    伺服器訊息預設會受提及閘控。

    提及偵測包含：

    - 明確提及 Bot
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆 Bot 行為

    撰寫對外 Discord 訊息時，請使用標準提及語法：使用者為 `<@USER_ID>`，頻道為 `<#CHANNEL_ID>`，角色為 `<@&ROLE_ID>`。請勿使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及另一位使用者/角色但未提及 Bot 的訊息（不含 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選允許清單透過 `dm.groupChannels`（頻道 ID 或 slug）設定

  </Tab>
</Tabs>

### 以角色為基礎的代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 伺服器成員路由到不同代理。以角色為基礎的繫結只接受角色 ID，且會在對等或父對等繫結之後、僅伺服器繫結之前評估。如果繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須符合。

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

- `commands.native` 預設為 `"auto"`，並對 Discord 啟用。
- 依頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前註冊的命令可能仍會在 Discord 中可見，直到你從 Discord 應用程式移除它們。
- 原生命令驗證使用與一般訊息處理相同的 Discord 允許清單/政策。
- 未授權使用者仍可能在 Discord UI 中看到命令；執行時會強制套用 OpenClaw 驗證並回覆「未授權」。
- 預設斜線命令設定：`ephemeral: true`（`channels.discord.slashCommand.ephemeral`）。

請參閱[斜線命令](/zh-TW/tools/slash-commands)了解命令目錄與行為。

## 功能詳細資料

<AccordionGroup>
  <Accordion title="回覆標籤與原生回覆">
    Discord 支援代理程式輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）：沒有隱含的回覆串接；明確的 `[[reply_to_*]]` 標籤仍會被遵守
    - `first`：將隱含的原生回覆參照附加到該回合的第一則外送 Discord 訊息
    - `all`：附加到每一則外送訊息
    - `batched`：只有在傳入事件是多則訊息的防抖批次時才附加；適合你主要想在模糊、突發的聊天中使用原生回覆，而不是每個單一訊息回合都使用

    訊息 ID 會在脈絡/歷史中公開，因此代理程式可以鎖定特定訊息。

  </Accordion>

  <Accordion title="連結預覽">
    Discord 預設會為 URL 產生豐富連結嵌入。OpenClaw 預設會抑制外送 Discord 訊息上這些產生的嵌入，因此代理程式傳送的 URL 會維持純連結，除非你選擇啟用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 以覆寫單一帳戶。代理程式訊息工具傳送也可以針對單一訊息傳入 `suppressEmbeds: false`。明確的 Discord `embeds` 酬載不會被預設連結預覽設定抑制。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送暫時訊息並在文字抵達時編輯它，來串流草稿回覆。`channels.discord.streaming.mode` 接受 `off` | `partial` | `block` | `progress`（未設定 `streaming`/舊版 `streamMode` 鍵時的預設值）。`streamMode` 是舊版別名；執行 `openclaw doctor --fix` 以將持久化設定重寫為標準巢狀 `streaming` 形狀。

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

    - `off` 停用 Discord 預覽編輯。
    - `partial` 會在 token 抵達時編輯單一預覽訊息。
    - `block` 會送出草稿大小的區塊；使用 `streaming.preview.chunk`（`minChars`、`maxChars`、`breakPreference`）調整大小與斷點，並限制在 `textChunkLimit` 內。明確啟用區塊串流時，OpenClaw 會略過預覽串流以避免雙重串流。
    - `progress` 會保留一則可編輯的狀態草稿，並以工具進度更新它，直到最終傳送；共用起始標籤是一行滾動文字，因此一旦出現足夠工作內容，它就會像其餘內容一樣捲離。
    - 媒體、錯誤和明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - 工具/進度列會在可用時以精簡的表情符號 + 標題 + 詳細資料呈現，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（預設 `false`）選擇在暫時進度草稿中納入助理評論/前言文字。評論會在顯示前清理，保持暫時性，且不會改變最終答案傳送。
    - `streaming.progress.maxLineChars` 控制每行進度預覽預算。散文會在字詞邊界縮短；命令與路徑詳細資料會保留有用的後綴。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制精簡進度列中的命令/執行詳細資料：`raw`（預設）或 `status`（僅工具標籤）。

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

    預覽串流僅支援文字；媒體回覆會退回一般傳送。

  </Accordion>

  <Accordion title="歷史、脈絡與討論串行為">
    伺服器歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 備援：`messages.groupChat.historyLimit`
    - `0` 停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會以頻道工作階段路由，並繼承父頻道設定，除非已覆寫。
    - 討論串工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅模型的備援；討論串本地 `/model` 選擇優先，且除非啟用逐字稿繼承，否則不會複製父逐字稿歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動討論串選擇從父逐字稿植入。依帳戶覆寫：`channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用備援期間保留。

    頻道主題會以**不受信任**脈絡注入。允許清單會控管誰能觸發代理程式，而不是完整的補充脈絡修訂邊界。

  </Accordion>

  <Accordion title="子代理程式的討論串綁定工作階段">
    Discord 可以將討論串綁定到工作階段目標，讓該討論串中的後續訊息持續路由到相同工作階段（包含子代理程式工作階段）。

    命令：

    - `/focus <target>` 將目前/新討論串綁定到子代理程式/工作階段目標
    - `/unfocus` 移除目前討論串綁定
    - `/agents` 顯示作用中執行與綁定狀態
    - `/session idle <duration|off>` 檢查/更新聚焦綁定的不活動自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新聚焦綁定的硬性最大期限

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

    附註：

    - `session.threadBindings.*` 設定全域預設值；`channels.discord.threadBindings.*` 覆寫 Discord 行為。
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 和 ACP 討論串生成的自動建立/綁定討論串。預設：`true`。
    - `defaultSpawnContext` 控制討論串綁定生成的原生子代理程式脈絡。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某個帳戶停用討論串綁定，`/focus` 和相關討論串綁定操作將不可用。

    請參閱[子代理程式](/zh-TW/tools/subagents)、[ACP 代理程式](/zh-TW/tools/acp-agents)和[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 頻道綁定">
    對於穩定的「always-on」ACP 工作區，請設定頂層型別化 ACP 綁定，目標為 Discord 對話。

    設定路徑：`bindings[]`，搭配 `type: "acp"` 和 `match.channel: "discord"`。

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

    附註：

    - `/acp spawn codex --bind here` 會就地綁定目前頻道或討論串，並讓未來訊息維持在相同 ACP 工作階段。討論串訊息會繼承父頻道綁定。
    - 在已綁定的頻道或討論串中，`/new` 和 `/reset` 會就地重設相同 ACP 工作階段。暫時討論串綁定可以在作用中時覆寫目標解析。
    - `spawnSessions` 透過 `--thread auto|here` 控管子討論串建立/綁定。

    請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)了解綁定行為詳細資料。

  </Accordion>

  <Accordion title="反應通知">
    每個伺服器的反應通知模式（`guilds.<id>.reactionNotifications`）：

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
    - 代理程式身分表情符號備援（`agents.list[].identity.emoji`，否則為 "👀"）

    附註：

    - Discord 接受 unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 停用頻道或帳戶的反應。

    **範圍（`messages.ackReactionScope`）：**

    值：`"all"`（DM + 群組，包含周遭聊天室事件）、`"direct"`（僅 DM）、`"group-all"`（除了周遭聊天室事件之外的每則群組訊息，無 DM）、`"group-mentions"`（機器人被提及時的群組；**無 DM**，預設）、`"off"` / `"none"`（停用）。

    <Note>
    預設範圍（`"group-mentions"`）不會在直接訊息或周遭聊天室事件中觸發確認反應。若要在傳入 Discord DM 和安靜聊天室事件上取得確認反應，請將 `messages.ackReactionScope` 設為 `"all"`。
    </Note>

  </Accordion>

  <Accordion title="設定寫入">
    預設啟用由頻道啟動的設定寫入。這會影響 `/config set|unset` 流程（啟用命令功能時）。

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

  <Accordion title="閘道代理">
    透過 `channels.discord.proxy` 使用 HTTP(S) 代理路由 Discord 閘道 WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）。
    Discord 閘道 WebSocket 代理是明確的；WebSocket 連線不會繼承閘道程序的環境代理變數。設定 `channels.discord.proxy` 時，啟動 REST 查詢會使用此代理。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    依帳戶覆寫：

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
        token: "pk_live_...", // 選填；私人系統需要
      },
    },
  },
}
```

    備註：

    - 允許清單可使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID 查詢 PluralKit API
    - 如果查詢失敗，代理訊息會被視為機器人訊息並丟棄，除非 `allowBots` 允許它們通過

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理需要對已知 Discord 使用者進行確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含前置 `@` 的 handle；值是 Discord 使用者 ID。未知 handle、`@everyone`、`@here`，以及 Markdown 程式碼範圍內的提及會保持不變。

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

  <Accordion title="狀態設定">
    當你設定狀態或活動欄位，或啟用自動狀態時，會套用狀態更新。

    僅狀態：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活動（設定 `activity` 時，自訂狀態是預設活動類型）：

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

    串流：

```json5
{
  channels: {
    discord: {
      activity: "即時寫程式",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活動類型對照表：

    - 0: 遊玩中
    - 1: 串流中（需要 `activityUrl`；`activityUrl` 也需要 `activityType: 1`）
    - 2: 聆聽中
    - 3: 觀看中
    - 4: 自訂（使用活動文字作為狀態狀態；表情符號為選填）
    - 5: 競賽中

    自動狀態（執行階段健康訊號）：

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

    自動狀態會將執行階段可用性對應到 Discord 狀態：健康 => 線上，降級或未知 => 閒置，已耗盡或不可用 => 請勿打擾。預設值：`intervalMs` 30000，`minUpdateIntervalMs` 15000（必須小於或等於 `intervalMs`）。選填文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` placeholder）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中使用按鈕式核准處理，也可選擇在原始頻道中張貼核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選填；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少能解析出一位核准者時，Discord 會自動啟用原生 exec 核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷 exec 核准者。若要明確停用 Discord 作為原生核准用戶端，請設定 `enabled: false`。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的僅限擁有者群組命令，OpenClaw 會私下傳送核准提示和最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord 私訊；否則會退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到暫時性的拒絕訊息。核准提示會包含命令文字，因此只應在受信任的頻道中啟用頻道傳遞。如果無法從工作階段鍵推導出頻道 ID，OpenClaw 會退回使用私訊傳遞。

    Discord 會呈現其他聊天頻道使用的共用核准按鈕；原生 Discord 配接器主要新增核准者私訊路由和頻道扇出。當這些按鈕存在時，它們是主要核准使用者體驗；OpenClaw 只有在工具結果表示聊天核准不可用，或手動核准是唯一路徑時，才應包含手動 `/approve` 命令。如果 Discord 原生核准執行階段未啟用，OpenClaw 會保持本機確定性的 `/approve <id> <decision>` 提示可見。如果執行階段已啟用，但原生卡片無法傳遞到任何目標，OpenClaw 會在同一聊天中傳送備援通知，並包含待處理核准中的確切 `/approve` 命令。

    閘道驗證和核准解析遵循共用的閘道用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後過期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和動作閘門

Discord 訊息動作涵蓋傳訊、頻道管理、審核、狀態和中繼資料。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 狀態：`setPresence`

`event-create` 動作接受選填的 `image` 參數（URL 或本機檔案路徑），用於設定排程活動封面圖片。

動作閘門位於 `channels.discord.actions.*` 下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已啟用   |
| roles                                                                                                                                                                    | 已停用   |
| moderation                                                                                                                                                               | 已停用   |
| presence                                                                                                                                                                 | 已停用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 進行 exec 核准和跨情境標記。Discord 訊息動作也可以接受 `components` 來建立自訂 UI（進階；需要透過 discord 工具建構 component payload），而舊版 `embeds` 仍可使用，但不建議。

- `channels.discord.ui.components.accentColor` 設定 Discord component 容器使用的強調色（十六進位）。各帳號：`channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` 控制已傳送的 Discord component callback 保持註冊的時間長度（預設 `1800000`，最大 `86400000`）。各帳號：`channels.discord.accounts.<id>.agentComponents.ttlMs`。
- 當 components v2 存在時，會忽略 `embeds`。
- 純 URL 預覽預設會被抑制。當單一傳出連結應展開時，請在訊息動作上設定 `suppressEmbeds: false`。

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

Discord 有兩種不同的語音介面：即時**語音頻道**（連續對話）和**語音訊息附件**（波形預覽格式）。閘道同時支援兩者。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scope 邀請機器人。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號預設代理，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

加入前若要檢查機器人的有效權限：

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
        model: "openai/gpt-5.5",
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
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

備註：

- Discord 語音對純文字設定是選用功能；設定 `channels.discord.voice.enabled=true`（或保留既有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 指令、語音執行階段，以及 `GuildVoiceStates` 閘道意圖。`channels.discord.intents.voiceStates` 可以明確覆寫意圖訂閱；若不設定，則會跟隨實際的語音啟用狀態。
- `voice.mode` 控制對話路徑。預設值是 `agent-proxy`：即時語音前端會處理回合時序、中斷與播放，透過 `openclaw_agent_consult` 將實質工作委派給路由到的 OpenClaw 代理程式，並將結果視為該說話者輸入的 Discord 文字提示。`stt-tts` 保留較舊的批次 STT 加 TTS 流程。`bidi` 讓即時模型直接對話，同時公開 `openclaw_agent_consult` 給 OpenClaw 大腦使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話會接收語音回合。若不設定，會使用語音頻道自己的工作階段；也可以設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道成為既有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風／喇叭延伸。
- `voice.model` 會覆寫 Discord 語音回應與即時諮詢所使用的 OpenClaw 代理大腦。若不設定，會繼承路由到的代理模型。它與 `voice.realtime.model` 是分開的。
- `voice.followUsers` 讓機器人可與選定使用者一起加入、移動及離開 Discord 語音。請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音，這會保留說話者與目標工作階段的正常擁有者／工具授權，但會隱藏代理程式的 `tts` 工具，因為 Discord 語音負責播放。預設情況下，`agent-proxy` 會對擁有者說話者提供完整的擁有者等效工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在給出實質回答前先諮詢 OpenClaw 代理程式（`voice.realtime.consultPolicy: "always"`）。在該預設的 `always` 模式下，即時層不會在諮詢答案前自動說出填充語；它會擷取並轉錄語音，然後說出路由後的 OpenClaw 答案。如果 Discord 仍在播放第一個答案時有多個強制諮詢答案完成，後續的精確語音答案會排入佇列，直到播放閒置後再播放，而不是在句子中途替換語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 與 `voice.realtime.speakerVoice` 會設定即時音訊工作階段。若要搭配 Codex 大腦使用 OpenAI Realtime 2，請使用 `voice.realtime.model: "gpt-realtime-2"` 與 `voice.model: "openai/gpt-5.5"`。
- 即時語音模式預設會在即時提供者指令中包含小型 `IDENTITY.md`、`USER.md` 與 `SOUL.md` 設定檔，讓快速直接回合保有與路由到的 OpenClaw 代理程式相同的身分、使用者根據與角色設定。將 `voice.realtime.bootstrapContextFiles` 設為子集合可自訂此行為，或設為 `[]` 可停用。僅支援這些設定檔；`AGENTS.md` 仍會留在一般代理程式上下文中。注入的設定檔上下文不會取代 `openclaw_agent_consult` 在工作區工作、目前事實、記憶查詢或工具支援動作中的用途。
- 在 OpenAI `agent-proxy` 即時模式中，設定 `voice.realtime.requireWakeName: true`，即可讓 Discord 即時語音在轉錄以喚醒名稱開頭或結尾之前保持靜默。設定的喚醒名稱必須是一個或兩個詞。如果未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由到的代理程式 `name` 加上 `OpenClaw`，並在需要時退回代理程式 ID 加上 `OpenClaw`。喚醒名稱閘控會停用即時提供者自動回應，將接受的回合透過 OpenClaw 代理程式諮詢路徑路由，並在最終轉錄抵達前，若從部分轉錄辨識到前置喚醒名稱，就給出簡短的語音確認。
- OpenAI 即時提供者接受目前的 Realtime 2 事件名稱，以及與舊版 Codex 相容的輸出音訊與轉錄事件別名，因此相容的提供者快照即使漂移，也不會遺失助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷使用中的即時播放。若未設定，會跟隨即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前，助理播放的最短持續時間。預設值：`250`。在低回音房間中可設為 `0` 以立即中斷；在回音較重的喇叭環境中可提高此值。
- `voice.tts` 只會針對 `stt-tts` 語音播放覆寫 `messages.tts`；即時模式改用 `voice.realtime.speakerVoice`。若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇文字轉語音聲音。`cedar` 在目前的 OpenAI TTS 模型上是很適合的偏陽性聲音選項。
- 每個 Discord 頻道的 `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄回合。
- 語音轉錄回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態，用於需要擁有者權限的指令與頻道動作。代理程式工具可見性會跟隨路由工作階段設定的工具政策。
- 如果 `voice.autoJoin` 對同一個伺服器有多個項目，OpenClaw 會加入該伺服器最後設定的頻道。
- `voice.allowedChannels` 是選用的駐留允許清單。若不設定，會允許 `/vc join` 加入任何已授權的 Discord 語音頻道。設定後，`/vc join`、啟動時自動加入，以及機器人語音狀態移動，都會限制在列出的 `{ guildId, channelId }` 項目。將其設為空陣列可拒絕所有 Discord 語音加入。如果 Discord 將機器人移到允許清單之外，OpenClaw 會離開該頻道，並在有可用目標時重新加入設定的自動加入目標。
- `voice.daveEncryption` 與 `voice.decryptionFailureTolerance` 會傳遞給 `@discordjs/voice` 加入選項；上游預設值是 `daveEncryption=true` 與 `decryptionFailureTolerance=24`。
- OpenClaw 使用內建的 `libopus-wasm` 編解碼器來接收 Discord 語音與播放即時原始 PCM。它隨附固定版本的 libopus WebAssembly 建置，不需要原生 opus 附加元件。
- `voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試時，初始等待 `@discordjs/voice` Ready 的時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待其開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因為另一位使用者開始說話就停止。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放結束後再說話以進入下一回合。即時模式會將說話者開始事件轉送為傳給即時提供者的插話訊號。
- 在即時模式中，喇叭回音進入開放麥克風可能看起來像插話並中斷播放。對於回音較重的 Discord 房間，請設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，避免 OpenAI 因輸入音訊而自動中斷。若仍希望 Discord 說話者開始事件中斷使用中的播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音／雜訊並略過記錄，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 Discord 回報說話者停止後，OpenClaw 在為 STT 最終化該音訊片段前等待的時間。預設值：`2000`；如果 Discord 將正常停頓切成斷續的部分轉錄，請提高此值。
- 當 ElevenLabs 是選定的 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者回應串流開始。沒有串流支援的提供者會退回合成暫存檔路徑。
- OpenClaw 會監看接收解密失敗，並在短時間內重複失敗後，透過離開並重新加入語音頻道自動復原。
- 如果更新後接收記錄反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告與記錄。內建的 `@discordjs/voice` 版本包含來自 discord.js PR #11449 的上游填補修正，該修正已關閉 discord.js issue #11419。
- OpenClaw 最終化已擷取的說話者片段時，預期會出現 `The operation was aborted` 接收事件；它們是詳細診斷，不是警告。
- 詳細 Discord 語音記錄會針對每個接受的說話者片段包含一行有界的 STT 轉錄預覽，因此偵錯時能同時看到使用者端與代理程式回覆端，而不會傾印無界轉錄文字。
- 在 `agent-proxy` 模式中，強制諮詢備援會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字，或像「and」這類結尾連接詞，以及像「be right back」或「bye」這類明顯無法採取動作的結語。當這避免了陳舊的佇列答案時，記錄會顯示 `forced agent consult skipped reason=...`。

### 在語音中跟隨使用者

當你希望 Discord 語音機器人跟隨一位或多位已知 Discord 使用者，而不是在啟動時加入固定頻道或等待 `/vc join` 時，請使用 `voice.followUsers`。

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

- `followUsers` 接受原始 Discord 使用者 ID 與 `discord:<id>` 值。OpenClaw 會在比對語音狀態事件前正規化這兩種形式。
- 設定 `followUsers` 時，`followUsersEnabled` 預設為 `true`。將其設為 `false` 可保留已儲存清單，但停止自動語音跟隨。
- 當被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。當使用者移動時，OpenClaw 會跟著移動。當目前被跟隨的使用者中斷連線時，OpenClaw 會離開。
- 如果同一個伺服器中有多位被跟隨的使用者，且目前被跟隨的使用者離開，OpenClaw 會先移動到另一位被追蹤跟隨使用者的頻道，再離開該伺服器。如果多位被跟隨的使用者同時移動，最新觀察到的語音狀態事件優先。
- `allowedChannels` 仍會套用。位於不允許頻道中的被跟隨使用者會被忽略，而跟隨擁有的工作階段會移動到另一位被跟隨使用者，或離開。
- OpenClaw 會在啟動時及以有界間隔調和遺漏的語音狀態事件。調和會取樣已設定的伺服器，並限制每次執行的 REST 查詢數，因此非常大的 `followUsers` 清單可能需要超過一個間隔才能收斂。
- 如果 Discord 或管理員在機器人跟隨使用者時移動它，OpenClaw 會重建語音工作階段，並在目的地允許時保留跟隨所有權。如果機器人被移到 `allowedChannels` 之外，OpenClaw 會離開，並在有設定目標時重新加入。
- DAVE 接收復原可能會在重複解密失敗後離開並重新加入同一個頻道。跟隨擁有的工作階段會在該復原路徑中保留跟隨所有權，因此之後被跟隨使用者中斷連線時仍會離開該頻道。

選擇加入模式：

- 對於個人或操作員設定，若機器人應在你進入語音時自動出現在語音中，請使用 `followUsers`。
- 對於即使沒有被追蹤使用者在語音中也應存在的固定房間機器人，請使用 `autoJoin`。
- 對於一次性加入，或自動語音存在會令人意外的房間，請使用 `/vc join`。

Discord 語音編解碼器：

- 語音接收記錄會顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會先使用相同的內建 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，再將封包交給 `@discordjs/voice`。
- 檔案與提供者串流播放會使用 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，然後使用 `libopus-wasm` 產生傳送到 Discord 的 Opus 封包串流。

STT 加 TTS 管線：

- Discord PCM 擷取內容會轉換成 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄文字會透過 Discord 輸入與路由傳送，而回應 LLM 會以語音輸出政策執行，該政策會隱藏代理的 `tts` 工具並要求回傳文字，因為 Discord 語音負責最終的 TTS 播放。
- `voice.model` 設定後，只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會覆蓋合併到 `messages.tts`；支援串流的提供者會直接送入播放器，否則會在已加入的頻道中播放產生的音訊檔案。

預設 agent-proxy 語音頻道工作階段範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得自己的已路由 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段對話。即時模型只是語音前端；實質請求會交給已設定的 OpenClaw 代理。如果即時模型在未呼叫諮詢工具的情況下產生最終轉錄文字，OpenClaw 會強制執行諮詢作為後援，因此預設行為仍會像是在與代理對話。

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
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

將語音作為既有 Discord 頻道工作階段的延伸：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式中，機器人會加入已設定的語音頻道，但 OpenClaw 代理回合會使用目標頻道的一般已路由工作階段與代理。即時語音工作階段會把回傳結果說回語音頻道。監督代理仍可依照其工具政策使用一般訊息工具，包括在這是正確動作時傳送另一則 Discord 訊息。

委派的 OpenClaw 執行作用中時，新的 Discord 語音轉錄文字會在開始另一個代理回合前，被視為即時執行控制。像是「status」、「cancel that」、「use the smaller fix」或「when you're done also check tests」這類片語，會被分類為作用中工作階段的狀態、取消、引導或後續輸入。狀態、取消、已接受的引導與後續結果會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理請求。

實用的目標形式：

- `target: "channel:123456789012345678"` 透過 Discord 文字頻道工作階段路由。
- `target: "123456789012345678"` 會被視為頻道目標。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 透過該直接訊息工作階段路由。

回聲嚴重的 OpenAI Realtime 範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
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

當模型會透過開啟的麥克風聽到自己的 Discord 播放聲，但你仍想透過說話打斷它時，請使用此設定。OpenClaw 會阻止 OpenAI 因原始輸入音訊而自動中斷，同時 `bargeIn: true` 讓 Discord 說話者開始事件與已作用中的說話者音訊，在下一個擷取回合到達 OpenAI 前取消作用中的即時回應。`audioEndMs` 低於 `minBargeInAudioEndMs` 的非常早期插話訊號會被視為可能是回聲/雜訊並忽略，因此模型不會在第一個播放影格就中止。

預期的語音日誌：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時啟動時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 說話者音訊：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` 與 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過時語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時諮詢時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 代理回答時：`discord voice: agent turn answer ...`
- 佇列精確語音時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回聲/雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 插話停用時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 閒置播放時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要除錯音訊中斷，請把即時語音日誌當作時間軸閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。橋接器會從此時開始計算助理輸出區塊、Discord PCM 位元組、提供者即時位元組，以及合成音訊時長。
2. `realtime speaker turn opened` 標記 Discord 說話者變為作用中。如果播放已經作用中且 `bargeIn` 已啟用，後面可能接著 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標記該說話者回合收到第一個實際音訊影格。這裡的 `outputActive=true` 或非零 `outputAudioMs` 表示麥克風在助理播放仍作用中時送出輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放作用中時看到即時說話者音訊。這有助於區分真正的中斷與沒有實用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求即時提供者取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 與 `playbackChunks`，因此你可以看到中斷前實際播放了多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放重設點。原因會說明是誰停止播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 摘要擷取到的輸入回合。`chunks=0` 或 `hasAudio=false` 表示說話者回合已開啟，但沒有可用音訊到達即時橋接器。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：即時提供者在該日誌列之前產生的助理音訊時長。
- `audioMs`：OpenClaw 在播放停止前計算到的助理音訊時長。
- `elapsedMs`：開啟與關閉播放串流或說話者回合之間的實際經過時間。
- `discordBytes`：傳送到或接收自 Discord 語音的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送到或接收自即時提供者的提供者格式 PCM 位元組。
- `playbackChunks`：轉送到 Discord 以供作用中回應使用的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取到的說話者音訊影格與說話者回合關閉之間的間隔。

常見模式：

- 伴隨 `source=active-speaker-audio`、很小的 `outputAudioMs`，且附近是同一位使用者的立即中斷，通常表示喇叭回聲進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低喇叭音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false` 表示 Discord 回報說話者開始，但沒有音訊到達 OpenClaw。這可能是暫時性的 Discord 語音事件、雜訊閘行為，或用戶端短暫觸發麥克風。
- 沒有附近插話或 `provider-clear-audio` 的 `audio playback stopped reason=stream-close`，表示本機 Discord 播放串流非預期結束。請檢查前面的提供者與 Discord 播放器日誌。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊作用中時刻意丟棄輸入。如果你希望語音中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供者 VAD 回報語音，但 OpenClaw 沒有可中斷的作用中播放。這不應該中斷音訊。

憑證會依元件解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`/`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或提供者的一般驗證設定使用即時提供者驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要閘道主機上的 `ffmpeg` 與 `ffprobe` 來檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕在同一個承載中同時包含文字 + 語音訊息）。
- 可接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - 啟用 Message Content Intent
    - 當你依賴使用者/成員解析時，啟用 Server Members Intent
    - 變更 intents 後重新啟動閘道

  </Accordion>

  <Accordion title="Guild 訊息意外遭封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的 guild 允許清單
    - 如果存在 guild `channels` 對應表，則只允許列出的頻道
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

    - `groupPolicy="allowlist"`，但沒有相符的 guild/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 下，或位於頻道項目中）
    - 傳送者被 guild/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 閘道佇列調整項目：

    - 單帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord 閘道監聽器工作，而不是代理回合生命週期

    Discord 不會對已排隊的代理回合套用頻道擁有的逾時。訊息監聽器會立即交接，已排隊的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回使用 Discord 的預設閘道 URL，並在記錄中受速率限制。

    中繼資料逾時調整項目：

    - 單帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定 config 時的 env 後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="閘道 READY 逾時重新啟動">
    OpenClaw 會在啟動期間和執行階段重新連線後等待 Discord 閘道 `READY` 事件。具有啟動錯開設定的多帳號配置，可能需要比預設值更長的啟動 READY 視窗。

    READY 逾時調整項目：

    - 啟動單帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定 config 時的啟動 env 後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定 config 時的執行階段 env 後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不一致">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 和配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM policy 已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人迴圈">
    預設會忽略機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及和允許清單規則，避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及機器人的機器人訊息。

    OpenClaw 也內建共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。每當 `allowBots` 允許機器人撰寫的訊息送達分派時，Discord 會將傳入事件對應到 `(account, channel, bot pair)` 事實，通用配對防護會在該配對超過設定的事件預算後抑制它。此防護可防止過去必須靠 Discord 速率限制停止的失控雙機器人迴圈；它不會影響單一機器人部署，或維持在預算內的一次性機器人回覆。

    預設設定（設定 `allowBots` 時啟用）：

    - `maxEventsPerWindow: 20` -- 機器人配對可在滑動視窗內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動視窗長度
    - `cooldownSeconds: 60` -- 一旦觸發預算，任一方向的每一則額外機器人對機器人訊息都會在一分鐘內遭丟棄

    先在 `channels.defaults.botLoopProtection` 下設定共用預設值一次，然後在合法工作流程需要更多餘裕時覆寫 Discord。優先順序為：

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 內建預設值

    Discord 使用通用的 `maxEventsPerWindow`、`windowSeconds` 和 `cooldownSeconds` 鍵。

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
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha listens to other bots only when they mention it.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Bravo write an Alpha Discord mention with the configured user id.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 而丟失">

    - 保持 OpenClaw 為最新版本（`openclaw update`），讓 Discord 語音接收復原邏輯可用
    - 確認 `channels.discord.voice.daveEncryption=true`（預設）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，只有在需要時才調整
    - 觀察記錄中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後失敗仍持續，收集記錄並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`applicationId`、`accounts.*`、`allowBots`
- policy：`groupPolicy`、`dmPolicy`、`allowFrom`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- command：`commands.native`、`commands.useAccessGroups`（全域）、`configWrites`、`slashCommand.ephemeral`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算，預設 `120000`）、`eventQueue.maxQueueSize`（預設 `10000`）、`eventQueue.maxConcurrency`（預設 `50`）
- 閘道：`proxy`、`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`（預設 `2000`）、`maxLinesPerMessage`（預設 `17`）
- 串流：`streaming.mode`、`streaming.chunkMode`、`streaming.preview.*`、`streaming.progress.*`、`streaming.block.*`（舊版扁平 `streamMode`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`、`chunkMode` 鍵會由 `openclaw doctor --fix` 遷移到 `streaming.*`）
- 媒體/重試：`mediaMaxMb`（限制對外 Discord 上傳，預設 `100`）、`retry`
- actions：`actions.*`
- presence：`activity`、`status`、`activityType`、`activityUrl`、`autoPresence.*`
- UI：`ui.components.accentColor`
- features：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與操作

- 將機器人權杖視為秘密（在受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限 Discord 權限。
- 如果 command 部署/狀態過期，請重新啟動閘道，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到閘道。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天和允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將 guild 和頻道對應到代理。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
