---
read_when:
    - 正在開發 Discord 頻道功能
summary: Discord Bot 設定、設定鍵、組件、語音與疑難排解
title: Discord
x-i18n:
    generated_at: "2026-07-05T11:01:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7fcde8d8dfc79f0e5e4336d62a7bbb7ea2c9cde94e3671d53630b1daee4f75e
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw 會透過官方 Discord 閘道以機器人身分連線至 Discord。支援私訊與伺服器頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord 私訊預設為配對模式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

建立一個含機器人的 Discord 應用程式，將機器人加入你的伺服器，並與 OpenClaw 配對。若可以，請使用私人伺服器；需要時可先[建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    在 [Discord Developer Portal](https://discord.com/developers/applications) 中，點擊 **New Application** 並命名（例如「OpenClaw」）。

    在側邊欄開啟 **Bot**，並將 **Username** 設為你的代理名稱。

  </Step>

  <Step title="啟用特權意圖">
    仍在 **Bot** 頁面上，於 **Privileged Gateway Intents** 下啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單、名稱對 ID 比對，以及頻道受眾存取群組需要）
    - **Presence Intent**（選用；僅用於狀態更新）

  </Step>

  <Step title="複製你的機器人權杖">
    在 **Bot** 頁面上，點擊 **Reset Token** 並複製權杖。

    <Note>
    儘管名稱如此，這會產生你的第一個權杖，並沒有真的「重設」任何東西。
    </Note>

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    在側邊欄開啟 **OAuth2**。在 **OAuth2 URL Generator** 中啟用範圍：

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

    這是一般文字頻道的基準。如果機器人會在討論串中發文，包括會建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。

    複製產生的 URL，在瀏覽器中開啟，選取你的伺服器，然後點擊 **Continue**。機器人現在應該會出現在你的伺服器中。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    在 Discord 應用程式中，啟用開發者模式，讓你可以複製 ID：

    1. **User Settings**（齒輪圖示）→ **Developer** → 開啟 **Developer Mode**
       *（行動版：**App Settings** → **Advanced**）*
    2. 右鍵點擊你的 **server icon** → **Copy Server ID**
    3. 右鍵點擊你的 **own avatar** → **Copy User ID**

    將 Server ID 和 User ID 與你的機器人權杖放在一起；接下來三者都需要。

  </Step>

  <Step title="允許來自伺服器成員的私訊">
    若要讓配對運作，Discord 必須允許機器人向你傳送私訊。右鍵點擊你的 **server icon** → **Privacy Settings** → 開啟 **Direct Messages**。

    如果你搭配 OpenClaw 使用 Discord 私訊，請保持開啟。如果你只使用伺服器頻道，配對後可以停用。

  </Step>

  <Step title="安全地設定你的機器人權杖（不要在聊天中傳送）">
    機器人權杖是機密。請在執行 OpenClaw 的機器上設定後，再傳訊給你的代理：

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
    對於受管理的服務安裝，請從已設定 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將該變數儲存在 `~/.openclaw/.env` 中，讓服務在重新啟動後可解析 env SecretRef。
    如果你的主機被 Discord 的啟動應用程式查詢封鎖或限速，請從 Developer Portal 設定應用程式/用戶端 ID，讓啟動時可略過該 REST 呼叫：預設帳戶使用 `channels.discord.applicationId`，或每個機器人使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的代理">
        在現有頻道（例如 Telegram）上與你的 OpenClaw 代理聊天並告知它。如果 Discord 是你的第一個頻道，請改用命令列介面 / 設定分頁。

        >「我已經在設定中設好 Discord 機器人權杖。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
      </Tab>
      <Tab title="命令列介面 / 設定">
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

        預設帳戶的 env 備援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於腳本化或遠端設定，請用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不加 `--dry-run` 重新執行。純文字 `token` 字串也可使用，且 `channels.discord.token` 支援跨 env/file/exec 提供者的 SecretRef 值。請參閱[機密管理](/zh-TW/gateway/secrets)。

        若有多個 Discord 機器人，請將每個機器人權杖與應用程式 ID 放在其帳戶底下。頂層 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都使用相同應用程式 ID 時才在那裡設定。

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
    閘道執行後，請在 Discord 中私訊你的機器人。它會回覆一組配對代碼。

    <Tabs>
      <Tab title="詢問你的代理">
        將配對代碼傳送給你現有頻道上的代理：

        >「核准這組 Discord 配對代碼：`<CODE>`」
      </Tab>
      <Tab title="命令列介面">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對代碼會在 1 小時後到期。核准後，即可在 Discord 私訊中與你的代理聊天。

  </Step>
</Steps>

<Note>
權杖解析會感知帳戶。設定中的權杖值優先於 env 備援，且 `DISCORD_BOT_TOKEN` 只用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析到相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監視器：來自設定的權杖優先於 env 備援；否則第一個已啟用的帳戶會勝出，重複帳戶會被回報為已停用，原因為 `duplicate bot token`。
對於進階傳出呼叫（訊息工具/頻道動作），明確的每次呼叫 `token` 會用於該呼叫。這適用於傳送與讀取/探測類動作（read/search/fetch/thread/pins/permissions）。帳戶政策/重試設定仍來自作用中執行階段快照中的所選帳戶。
</Note>

## 建議：設定伺服器工作區

私訊可用後，你可以把伺服器變成完整工作區，讓每個頻道都有自己的代理工作階段與各自的脈絡。建議用於只有你和機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入伺服器允許清單">
    這會讓你的代理可在你伺服器上的任何頻道回應，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的代理">
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

  <Step title="允許不用 @提及也能回應">
    預設情況下，代理只有在伺服器頻道中被 @提及時才會回應。在私人伺服器上，你大概會希望它回應每則訊息。

    在伺服器頻道中，一般回覆預設會自動發出。對於共用的常駐房間，選用 `messages.groupChat.visibleReplies: "message_tool"`，讓代理可以潛伏，並只在它判斷頻道回覆有用時發文。這最適合搭配最新世代、工具可靠的模型，例如 GPT 5.5。環境房間事件會保持安靜，除非工具傳送。完整潛伏模式設定請參閱[環境房間事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入，且日誌顯示權杖使用量，但沒有張貼訊息，請檢查該輪是否設定為環境房間事件，或是否選用了訊息工具可見回覆。

    <Tabs>
      <Tab title="詢問你的代理">
        >「允許我的代理在這台伺服器上不用被 @提及也能回應」
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

        若要要求可見群組/頻道回覆透過訊息工具傳送，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃伺服器頻道中的記憶">
    長期記憶（MEMORY.md）只會在私訊工作階段中自動載入；伺服器頻道不會載入。

    <Tabs>
      <Tab title="詢問你的代理">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期脈絡，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        若要在每個頻道中使用共用脈絡，請將穩定指示放在 `AGENTS.md` 或 `USER.md`（會注入每個工作階段）。將長期筆記保存在 `MEMORY.md`，並視需要透過記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在建立頻道並開始聊天。代理會看到頻道名稱，而每個頻道都是隔離的工作階段：可設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- 閘道擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入內容會回覆到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的脈絡加入模型提示，而不是作為使用者可見的回覆前綴。如果模型把該封套複製回來，OpenClaw 會從傳出回覆與未來重播脈絡中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理主工作階段（`agent:main:main`）。
- 伺服器頻道是隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組私訊預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 至路由後的對話工作階段。
- 純文字排程/心跳偵測宣布傳送至 Discord 時，會合併為最後一個助理可見答案並傳送一次。當代理產生多個可交付的承載時，媒體與結構化元件承載仍會維持多訊息。

## 論壇頻道

Discord 論壇與媒體頻道只接受討論串貼文。OpenClaw 支援兩種方式建立它們：

- 傳送訊息到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用訊息中第一行非空白內容（截斷至 Discord 的 100 字元討論串名稱限制）。
- 使用 `openclaw message thread create` 直接建立討論串。論壇頻道不要傳入 `--message-id`。

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

OpenClaw 支援用於代理訊息的 Discord components v2 容器。請搭配含有 `components` 酬載的訊息工具使用。互動結果會照常作為一般傳入訊息路由回代理，並遵循既有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取項目與表單在到期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。不符合的使用者會收到暫時性的拒絕訊息。

元件回呼預設會在 30 分鐘後到期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設帳號的回呼登錄生命週期，或針對每個帳號設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。此值以毫秒為單位，必須是正整數，且上限為 `86400000`（24 小時）。較長的 TTL 適合需要讓按鈕維持可用狀態的審查/核准工作流程，但也會延長舊 Discord 訊息仍可觸發動作的時間範圍。請優先使用符合需求的最短 TTL，並在過期回呼可能令人意外時保留預設值。

`/model` 與 `/models` 斜線命令會開啟互動式模型選擇器，其中包含提供者、模型與相容執行階段下拉選單，以及提交步驟。`/models add` 已被棄用，並會回傳棄用訊息，而不是從聊天註冊模型。選擇器回覆是暫時性的，且只有呼叫的使用者可使用。Discord 選取選單限制為 25 個選項，因此當你希望選擇器只針對所選提供者（例如 `openai` 或 `vllm`）顯示動態探索到的模型時，請將 `provider/*` 項目加入 `agents.defaults.models`。

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
    - `allowlist`（需要至少一個 `allowFrom` 傳送者）
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中被提示進行配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用至 `default` 帳號。
    - 對於單一帳號，`allowFrom` 的優先順序高於舊版 `dm.allowFrom`。
    - 具名帳號在自身的 `allowFrom` 與舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    為了相容性，仍會讀取舊版 `channels.discord.dm.policy` 與 `channels.discord.dm.allowFrom`。`openclaw doctor --fix` 會在不變更存取權的情況下，將其遷移至 `dmPolicy` 與 `allowFrom`。

    用於傳遞的 DM 目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效 DM `allowFrom` 中的 ID 會為了相容性被視為使用者 DM 目標。

  </Tab>

  <Tab title="Access groups">
    Discord DM 與文字命令授權可以使用 `channels.discord.allowFrom` 中的動態 `accessGroup:<name>` 項目。

    存取群組名稱會跨訊息頻道共用。若要建立靜態群組，其成員以各頻道一般的 `allowFrom` 語法表示，請使用 `type: "message.senders"`；若 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格，請使用 `type: "discord.channelAudience"`。共用存取群組行為：[存取群組](/zh-TW/channels/access-groups)。

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

    範例：允許任何可看見 `#maintainers` 的人向機器人傳送 DM，同時對其他所有人關閉 DM。

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

    查詢會以失敗即關閉的方式處理。如果 Discord 回傳 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，DM 傳送者會被視為未授權。

    使用頻道受眾存取群組時，請啟用 Discord Developer Portal **Server Members Intent**。DM 不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="Guild policy">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準是 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 可選的傳送者允許清單：`users`（建議使用穩定 ID）與 `roles`（僅限角色 ID）；如果任一者已設定，傳送者符合 `users` 或 `roles` 時即允許
    - 預設停用直接名稱/標籤比對；僅在破窗相容模式下啟用 `channels.discord.dangerouslyAllowNameMatching: true`
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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    舊版每頻道 `allow` 鍵會由 `openclaw doctor --fix` 遷移為 `enabled`。

    如果你只設定 `DISCORD_BOT_TOKEN` 而未建立 `channels.discord` 區塊，執行階段備援會是 `groupPolicy="allowlist"`（並在日誌中發出警告），即使 `channels.defaults.groupPolicy` 是 `open` 也一樣。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設由提及閘控。

    提及偵測包含：

    - 明確提及機器人
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆機器人行為

    撰寫傳出的 Discord 訊息時，請使用標準提及語法：使用者為 `<@USER_ID>`，頻道為 `<#CHANNEL_ID>`，角色為 `<@&ROLE_ID>`。不要使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 可依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及其他使用者/角色但未提及機器人的訊息（不包括 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選擇透過 `dm.groupChannels` 設定允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 角色式代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 伺服器成員路由到不同代理。角色式繫結只接受角色 ID，並會在對等或父對等繫結之後、僅伺服器繫結之前評估。如果繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須符合。

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
- 個別頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前已註冊的命令可能仍會在 Discord 中可見，直到你從 Discord 應用程式移除它們。
- 原生命令驗證使用與一般訊息處理相同的 Discord 允許清單/政策。
- 未授權使用者仍可能在 Discord UI 中看到命令；執行時會強制套用 OpenClaw 驗證，並回覆「未授權」。
- 預設斜線命令設定：`ephemeral: true` (`channels.discord.slashCommand.ephemeral`)。

請參閱[斜線命令](/zh-TW/tools/slash-commands)以了解命令目錄與行為。

## 功能詳細資訊

<AccordionGroup>
  <Accordion title="回覆標籤與原生回覆">
    Discord 支援代理輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）：不進行隱含回覆串接；明確的 `[[reply_to_*]]` 標籤仍會生效
    - `first`：將隱含的原生回覆參照附加到該輪第一則送出的 Discord 訊息
    - `all`：將它附加到每則送出的訊息
    - `batched`：只有當傳入事件是多則訊息的防抖批次時才附加它 — 當你主要想在模糊的突發聊天中使用原生回覆，而不是每個單則訊息回合都使用時很有用

    訊息 ID 會在脈絡/歷史中呈現，讓代理可以鎖定特定訊息。

  </Accordion>

  <Accordion title="連結預覽">
    Discord 預設會為 URL 產生豐富連結嵌入。OpenClaw 預設會抑制送出 Discord 訊息上的這些產生嵌入，因此代理傳送的 URL 會保持為純連結，除非你選擇啟用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 以覆寫單一帳號。代理訊息工具傳送也可以為單則訊息傳入 `suppressEmbeds: false`。明確的 Discord `embeds` 承載不會被預設連結預覽設定抑制。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯它來串流草稿回覆。`channels.discord.streaming.mode` 接受 `off` | `partial` | `block` | `progress`（未設定 `streaming`/舊版 `streamMode` 鍵時的預設值）。`streamMode` 是舊版別名；執行 `openclaw doctor --fix` 將持久化設定重寫為標準的巢狀 `streaming` 形狀。

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
    - `partial` 會在權杖抵達時編輯單一預覽訊息。
    - `block` 會送出草稿大小的區塊；使用 `streaming.preview.chunk`（`minChars`、`maxChars`、`breakPreference`）調整大小與斷點，並限制在 `textChunkLimit` 內。明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免雙重串流。
    - `progress` 保留一則可編輯的狀態草稿，並以工具進度更新它直到最終送達；共用起始標籤是一行滾動內容，因此一旦出現足夠工作，它就會像其他內容一樣捲離。
    - 媒體、錯誤與明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - 工具/進度列會在可用時呈現為精簡的表情符號 + 標題 + 詳細資訊，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（預設 `false`）選擇在暫時進度草稿中加入助理評論/前言文字。評論會在顯示前清理、保持暫時性，且不會改變最終答案送達。
    - `streaming.progress.maxLineChars` 控制每行進度預覽預算。散文會在單字邊界縮短；命令與路徑詳細資訊會保留有用的尾端。
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

    預覽串流僅限文字；媒體回覆會退回一般送達。

  </Accordion>

  <Accordion title="歷史、脈絡與討論串行為">
    伺服器歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 會停用

    私訊歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會路由為頻道工作階段，並繼承父頻道設定，除非已覆寫。
    - 討論串工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅限模型的後援；討論串本機的 `/model` 選擇優先，且除非已啟用逐字稿繼承，否則不會複製父逐字稿歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動討論串選擇從父逐字稿植入。個別帳號覆寫：`channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具反應可以解析 `user:<id>` 私訊目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會以**不受信任**脈絡注入。允許清單會限制誰能觸發代理，而不是完整的補充脈絡遮蔽邊界。

  </Accordion>

  <Accordion title="子代理的討論串綁定工作階段">
    Discord 可以將討論串綁定到工作階段目標，讓該討論串中的後續訊息持續路由到同一個工作階段（包含子代理工作階段）。

    命令：

    - `/focus <target>` 將目前/新討論串綁定到子代理/工作階段目標
    - `/unfocus` 移除目前討論串綁定
    - `/agents` 顯示作用中執行與綁定狀態
    - `/session idle <duration|off>` 檢查/更新已聚焦綁定的非作用中自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新已聚焦綁定的硬性最長存續時間

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
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 與 ACP 討論串產生時自動建立／綁定討論串。預設值：`true`。
    - `defaultSpawnContext` 控制綁定討論串之產生作業的原生子代理上下文。預設值：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果帳號停用討論串綁定，`/focus` 與相關的討論串綁定操作將無法使用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 頻道綁定">
    對於穩定的「永遠開啟」ACP 工作區，請設定頂層具型別的 ACP 綁定，以 Discord 對話為目標。

    設定路徑：`bindings[]`，搭配 `type: "acp"` 與 `match.channel: "discord"`。

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

    - `/acp spawn codex --bind here` 會就地綁定目前的頻道或討論串，並讓未來訊息維持在同一個 ACP 工作階段。討論串訊息會繼承父頻道綁定。
    - 在已綁定的頻道或討論串中，`/new` 與 `/reset` 會就地重設同一個 ACP 工作階段。暫時性討論串綁定在作用中時可以覆寫目標解析。
    - `spawnSessions` 會透過 `--thread auto|here` 控制子討論串的建立／綁定。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)以了解綁定行為詳細資訊。

  </Accordion>

  <Accordion title="反應通知">
    每個伺服器的反應通知模式 (`guilds.<id>.reactionNotifications`)：

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
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意事項：

    - Discord 接受 Unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某個頻道或帳號的反應。

  </Accordion>

  <Accordion title="設定寫入">
    預設會啟用由頻道發起的設定寫入。這會影響 `/config set|unset` 流程（啟用命令功能時）。

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
    透過 HTTP(S) 代理與 `channels.discord.proxy` 路由 Discord 閘道 WebSocket 流量與啟動時的 REST 查詢（應用程式 ID + 允許清單解析）。
    Discord 閘道 WebSocket 代理是明確設定的；WebSocket 連線不會繼承閘道程序中的環境代理變數。設定 `channels.discord.proxy` 時，啟動時的 REST 查詢會使用此代理。

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

    注意事項：

    - 允許清單可以使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱／slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID 查詢 PluralKit API
    - 如果查詢失敗，代理訊息會被視為機器人訊息並遭到丟棄，除非 `allowBots` 允許其通過

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理程式需要針對已知 Discord 使用者進行確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含前導 `@` 的代稱；值是 Discord 使用者 ID。未知代稱、`@everyone`、`@here`，以及 Markdown 程式碼跨度中的提及會保持不變。

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
      activity: "Focus time",
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
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活動類型對照表：

    - 0：遊玩中
    - 1：串流中（需要 `activityUrl`；`activityUrl` 也需要 `activityType: 1`）
    - 2：聆聽中
    - 3：觀看中
    - 4：自訂（使用活動文字作為狀態內容；表情符號為選用）
    - 5：競賽中

    自動上線狀態（執行階段健康訊號）：

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

    自動上線狀態會將執行階段可用性對應到 Discord 狀態：健康 => online，降級或未知 => idle，耗盡或不可用 => dnd。預設值：`intervalMs` 30000、`minUpdateIntervalMs` 15000（必須小於或等於 `intervalMs`）。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中以按鈕處理核准，也可選擇在原始頻道發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少能從 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出一位核准者時，Discord 會自動啟用原生 exec 核准。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷 exec 核准者。若要明確停用 Discord 作為原生核准用戶端，請設定 `enabled: false`。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的僅擁有者群組命令，OpenClaw 會私下傳送核准提示與最終結果。當發起命令的擁有者有 Discord 擁有者路由時，會先嘗試 Discord 私訊；否則會退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會顯示在頻道中。只有已解析的核准者可以使用按鈕；其他使用者會收到臨時拒絕。核准提示包含命令文字，因此只有在受信任頻道中才應啟用頻道傳送。如果無法從工作階段鍵推導出頻道 ID，OpenClaw 會退回使用私訊傳送。

    Discord 會呈現其他聊天頻道使用的共用核准按鈕；原生 Discord 配接器主要加入核准者私訊路由與頻道扇出。當這些按鈕存在時，它們是主要核准使用者體驗；只有在工具結果指出聊天核准不可用，或手動核准是唯一路徑時，OpenClaw 才應包含手動 `/approve` 命令。如果 Discord 原生核准執行階段未啟用，OpenClaw 會保持顯示本機確定性的 `/approve <id> <decision>` 提示。如果執行階段已啟用，但原生卡片無法傳送到任何目標，OpenClaw 會在同一聊天中傳送備援通知，內含來自待處理核准的確切 `/approve` 命令。

    閘道驗證與核准解析遵循共用閘道用戶端合約（`plugin:` ID 會透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後過期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作涵蓋訊息、頻道管理、審核、上線狀態與中繼資料。

核心範例：

- 訊息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 上線狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定排程活動封面圖片。

動作閘門位於 `channels.discord.actions.*` 下。

預設閘門行為：

| 動作群組                                                                                                                                                             | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 回應、訊息、討論串、釘選、投票、搜尋、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 已啟用   |
| 角色                                                                                                                                                                    | 已停用   |
| 審核                                                                                                                                                               | 已停用   |
| 上線狀態                                                                                                                                                                 | 已停用   |

## Components v2 使用者介面

OpenClaw 使用 Discord components v2 進行 exec 核准與跨情境標記。Discord 訊息動作也可接受 `components` 以建立自訂使用者介面（進階；需要透過 discord 工具建構 component 酬載），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord component 容器使用的強調色（十六進位）。每個帳號：`channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord component 回呼維持註冊的時間長度（預設 `1800000`，最大 `86400000`）。每個帳號：`channels.discord.accounts.<id>.agentComponents.ttlMs`。
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

Discord 有兩種不同的語音介面：即時 **語音頻道**（連續對話）與 **語音訊息附件**（波形預覽格式）。閘道兩者皆支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 範圍邀請機器人。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號預設代理程式，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

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

注意事項：

- Discord 語音對純文字設定是選用功能；設定 `channels.discord.voice.enabled=true`（或保留既有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 指令、語音執行階段，以及 `GuildVoiceStates` 閘道 intent。`channels.discord.intents.voiceStates` 可以明確覆寫 intent 訂閱；若不設定，則會跟隨實際的語音啟用狀態。
- `voice.mode` 控制對話路徑。預設值是 `agent-proxy`：即時語音前端會處理回合時序、中斷與播放，透過 `openclaw_agent_consult` 將實質工作委派給路由後的 OpenClaw agent，並把結果視為該說話者輸入的 Discord 文字提示。`stt-tts` 會保留較舊的批次 STT 加 TTS 流程。`bidi` 讓即時模型直接對話，同時暴露 `openclaw_agent_consult` 給 OpenClaw 大腦使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話會接收語音回合。若不設定，會使用語音頻道自己的工作階段；或設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道作為既有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風／喇叭延伸。
- `voice.model` 會覆寫 Discord 語音回應與即時諮詢所使用的 OpenClaw agent 大腦。若不設定，則會繼承路由後的 agent 模型。它與 `voice.realtime.model` 是分開的。
- `voice.followUsers` 讓機器人可跟隨選定使用者加入、移動及離開 Discord 語音。請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音，這會保留說話者與目標工作階段的一般擁有者／工具授權，但會隱藏 agent 的 `tts` 工具，因為 Discord 語音負責播放。預設情況下，`agent-proxy` 會為擁有者說話者提供等同擁有者的完整工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在做出實質回答前先諮詢 OpenClaw agent（`voice.realtime.consultPolicy: "always"`）。在這個預設的 `always` 模式中，即時層不會在諮詢答案前自動朗讀填充內容；它會擷取並轉錄語音，然後朗讀路由後的 OpenClaw 答案。如果多個強制諮詢答案在 Discord 仍在播放第一個答案時完成，後續的精確語音答案會排入佇列，等到播放閒置後才播放，而不是在句子中途取代語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 會設定即時音訊工作階段。若要搭配 Codex 大腦使用 OpenAI Realtime 2，請使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai/gpt-5.5"`。
- 即時語音模式預設會在即時 provider 指令中包含小型 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 個人檔案，讓快速直接回合維持與路由後 OpenClaw agent 相同的身分、使用者脈絡和人格。設定 `voice.realtime.bootstrapContextFiles` 為子集合即可自訂，或設定為 `[]` 以停用。僅支援這些個人檔案；`AGENTS.md` 仍保留在一般 agent 脈絡中。注入的個人檔案脈絡不會取代 `openclaw_agent_consult` 在工作區作業、目前事實、記憶查詢或工具支援動作中的用途。
- 在 OpenAI `agent-proxy` 即時模式中，設定 `voice.realtime.requireWakeName: true` 可讓 Discord 即時語音在轉錄文字以喚醒名稱開始或結束前保持靜默。設定的喚醒名稱必須是一或兩個單字。如果未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由後 agent 的 `name` 加上 `OpenClaw`，並在無法使用時改用 agent id 加上 `OpenClaw`。喚醒名稱閘控會停用即時 provider 自動回應，將接受的回合透過 OpenClaw agent 諮詢路徑路由，並在最終轉錄到達前，若從部分轉錄中辨識出開頭喚醒名稱，會給出短暫的語音確認。
- OpenAI 即時 provider 接受目前 Realtime 2 事件名稱，以及與舊版 Codex 相容的輸出音訊與轉錄事件別名，因此相容的 provider 快照即使漂移，也不會遺失 assistant 音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷進行中的即時播放。如果未設定，它會跟隨即時 provider 的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前，assistant 播放的最短持續時間。預設值：`250`。在低回音房間可設定為 `0` 以立即中斷，或在回音較重的喇叭配置中提高此值。
- `voice.tts` 只會覆寫 `stt-tts` 語音播放的 `messages.tts`；即時模式改用 `voice.realtime.speakerVoice`。若要在 Discord 播放時使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇文字轉語音聲音。在目前 OpenAI TTS 模型上，`cedar` 是聽起來較陽剛的良好選擇。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用至該語音頻道的語音轉錄回合。
- 語音轉錄回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態，用於擁有者閘控指令與頻道動作。Agent 工具可見性會跟隨路由工作階段設定的工具政策。
- 如果 `voice.autoJoin` 對同一個 guild 有多個項目，OpenClaw 會加入該 guild 最後設定的頻道。
- `voice.allowedChannels` 是選用的駐留允許清單。若不設定，會允許 `/vc join` 加入任何已授權的 Discord 語音頻道。設定後，`/vc join`、啟動自動加入，以及機器人語音狀態移動都會限制在列出的 `{ guildId, channelId }` 項目中。將它設定為空陣列可拒絕所有 Discord 語音加入。如果 Discord 將機器人移到允許清單之外，OpenClaw 會離開該頻道，並在有可用目標時重新加入設定的自動加入目標。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞給 `@discordjs/voice` 加入選項；上游預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用隨附的 `libopus-wasm` codec 進行 Discord 語音接收與即時原始 PCM 播放。它隨附固定版本的 libopus WebAssembly 建置，不需要原生 opus addon。
- `voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試時，初始等待 `@discordjs/voice` Ready 的時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待它開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因為另一位使用者開始說話就停止。為避免回饋迴圈，OpenClaw 會在 TTS 播放時忽略新的語音擷取；請在播放完成後再說出下一個回合。即時模式會將說話者開始事件作為插話訊號轉送給即時 provider。
- 在即時模式中，喇叭回音進入開啟的麥克風時，可能看起來像插話並中斷播放。對於回音較重的 Discord 房間，設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，可避免 OpenAI 在輸入音訊上自動中斷。若仍希望 Discord 說話者開始事件中斷進行中的播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音／雜訊而忽略，並記錄為已略過，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 OpenClaw 在 Discord 回報說話者停止後，等待多久才將該音訊片段定稿給 STT。預設值：`2000`；如果 Discord 將正常停頓切成破碎的部分轉錄，請提高此值。
- 當 ElevenLabs 是選定的 TTS provider 時，Discord 語音播放會使用串流 TTS，並從 provider 回應串流開始。沒有串流支援的 provider 會回退到合成暫存檔路徑。
- OpenClaw 會監看接收解密失敗，並在短時間內反覆失敗後，透過離開／重新加入語音頻道自動復原。
- 如果更新後接收記錄反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告與記錄。隨附的 `@discordjs/voice` 版本包含來自 discord.js PR #11449 的上游 padding 修正，該修正已關閉 discord.js issue #11419。
- `The operation was aborted` 接收事件是 OpenClaw 定稿已擷取說話者片段時的預期情況；它們是詳細診斷，不是警告。
- 詳細 Discord 語音記錄會為每個接受的說話者片段包含一行有界的 STT 轉錄預覽，因此偵錯時能看到使用者端與 agent 回覆端，而不會傾印無界轉錄文字。
- 在 `agent-proxy` 模式中，強制諮詢回退會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字，或像 "and" 這類尾隨連接詞，以及像 "be right back" 或 "bye" 這類明顯不可操作的結尾。當這防止過期的佇列答案時，記錄會顯示 `forced agent consult skipped reason=...`。

### 在語音中跟隨使用者

當你希望 Discord 語音機器人跟隨一個或多個已知 Discord 使用者，而不是在啟動時加入固定頻道或等待 `/vc join` 時，請使用 `voice.followUsers`。

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

- `followUsers` 接受原始 Discord 使用者 ID 和 `discord:<id>` 值。OpenClaw 會在比對語音狀態事件前正規化這兩種形式。
- 當設定 `followUsers` 時，`followUsersEnabled` 預設為 `true`。將它設定為 `false` 可保留已儲存清單，但停止自動語音跟隨。
- 當被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。當使用者移動時，OpenClaw 會跟著移動。當作用中的被跟隨使用者中斷連線時，OpenClaw 會離開。
- 如果同一個 guild 中有多個被跟隨使用者，且作用中的被跟隨使用者離開，OpenClaw 會先移動到另一個被追蹤的被跟隨使用者頻道，再離開該 guild。如果多個被跟隨使用者同時移動，則以最新觀察到的語音狀態事件為準。
- `allowedChannels` 仍然適用。位於不允許頻道中的被跟隨使用者會被忽略，而由跟隨擁有的工作階段會移動到另一個被跟隨使用者，或離開。
- OpenClaw 會在啟動時以及以有界間隔調和遺漏的語音狀態事件。調和會取樣設定的 guild，並限制每次執行的 REST 查詢數量，因此非常大的 `followUsers` 清單可能需要超過一個間隔才能收斂。
- 如果 Discord 或管理員在機器人跟隨使用者時移動它，OpenClaw 會重建語音工作階段，並在目的地允許時保留跟隨擁有權。如果機器人被移到 `allowedChannels` 之外，OpenClaw 會離開，並在存在設定目標時重新加入。
- DAVE 接收復原可能會在反覆解密失敗後離開並重新加入同一個頻道。由跟隨擁有的工作階段會在該復原路徑中保留其跟隨擁有權，因此之後被跟隨使用者中斷連線時，仍會離開該頻道。

選擇加入模式：

- 對於個人或操作者設定，希望機器人在你進入語音時自動加入語音，請使用 `followUsers`。
- 對於即使沒有被追蹤使用者在語音中也應存在的固定房間機器人，請使用 `autoJoin`。
- 對於一次性加入，或自動語音存在會令人意外的房間，請使用 `/vc join`。

Discord 語音 codec：

- 語音接收記錄會顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會先使用相同隨附的 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，再將封包交給 `@discordjs/voice`。
- 檔案與 provider 串流播放會使用 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，然後使用 `libopus-wasm` 產生傳送到 Discord 的 Opus 封包串流。

STT 加 TTS 管線：

- Discord PCM 擷取會轉換成 WAV 暫存檔。
- `tools.media.audio` 會處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄會透過 Discord 入口與路由送出，而回應 LLM 會以語音輸出政策執行，該政策會隱藏代理的 `tts` 工具並要求傳回文字，因為 Discord 語音負責最終的 TTS 播放。
- 設定 `voice.model` 時，只會覆寫這次語音頻道回合的回應 LLM。
- `voice.tts` 會合併覆蓋 `messages.tts`；支援串流的提供者會直接供給播放器，否則會在已加入的頻道中播放產生的音訊檔。

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

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得自己的路由 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段對話。即時模型只是語音前端；實質請求會交給已設定的 OpenClaw 代理。如果即時模型在未呼叫 consult 工具的情況下產生最終轉錄，OpenClaw 會強制以 consult 作為後援，因此預設行為仍然像是在與代理對話。

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

語音作為現有 Discord 頻道工作階段的延伸：

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

在 `agent-proxy` 模式中，機器人會加入已設定的語音頻道，但 OpenClaw 代理回合會使用目標頻道的一般路由工作階段與代理。即時語音工作階段會把傳回的結果說回語音頻道。監督代理仍可依其工具政策使用一般訊息工具，包括在那是正確動作時傳送另一則 Discord 訊息。

委派的 OpenClaw 執行處於作用中時，新的 Discord 語音轉錄會在啟動另一個代理回合前，被視為即時執行控制。像是「status」、「cancel that」、「use the smaller fix」或「when you're done also check tests」等片語，會被分類為作用中工作階段的狀態、取消、導引或後續輸入。狀態、取消、已接受導引與後續結果會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理該請求。

實用的目標形式：

- `target: "channel:123456789012345678"` 會透過 Discord 文字頻道工作階段路由。
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

當模型透過開放麥克風聽到自己的 Discord 播放，但你仍想透過說話中斷它時，請使用這個設定。OpenClaw 會阻止 OpenAI 因原始輸入音訊而自動中斷，同時 `bargeIn: true` 允許 Discord 說話者開始事件與已作用中的說話者音訊，在下一個擷取回合到達 OpenAI 之前取消作用中的即時回應。`audioEndMs` 低於 `minBargeInAudioEndMs` 的過早插話訊號會被視為可能的回音/雜訊並忽略，因此模型不會在第一個播放影格就被截斷。

預期的語音日誌：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時開始時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 說話者音訊：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過期語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時 consult 時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 代理回答時：`discord voice: agent turn answer ...`
- 佇列中的精確語音：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，後接 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，後接 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，後接 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音/雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 閒置播放時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊截斷，請將即時語音日誌當成時間軸閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。橋接器會從這個點開始計算助理輸出區塊、Discord PCM 位元組、提供者即時位元組，以及合成音訊時長。
2. `realtime speaker turn opened` 標記 Discord 說話者變為作用中。如果播放已經作用中且已啟用 `bargeIn`，其後可能會出現 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標記該說話者回合收到的第一個實際音訊影格。這裡的 `outputActive=true` 或非零 `outputAudioMs` 表示麥克風在助理播放仍作用中時傳送輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放作用中時看到即時說話者音訊。這有助於區分真正的中斷與沒有有用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求即時提供者取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，因此你可以看出中斷前實際已播放多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放重設點。reason 會說明是誰停止播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 會摘要擷取的輸入回合。`chunks=0` 或 `hasAudio=false` 表示說話者回合已開啟，但沒有可用音訊到達即時橋接器。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：即時提供者在該日誌行之前產生的助理音訊時長。
- `audioMs`：OpenClaw 在播放停止前計算的助理音訊時長。
- `elapsedMs`：開啟與關閉播放串流或說話者回合之間的實際經過時間。
- `discordBytes`：傳送至 Discord 語音或從 Discord 語音接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送至即時提供者或從即時提供者接收的提供者格式 PCM 位元組。
- `playbackChunks`：針對作用中回應轉送至 Discord 的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取的說話者音訊影格與說話者回合關閉之間的間隔。

常見模式：

- 立即截斷並伴隨 `source=active-speaker-audio`、較小的 `outputAudioMs`，且同一使用者在附近，通常表示喇叭回音進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低喇叭音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false` 表示 Discord 回報說話者開始，但沒有音訊到達 OpenClaw。這可能是暫時性的 Discord 語音事件、噪音閘行為，或用戶端短暫觸發麥克風。
- `audio playback stopped reason=stream-close` 附近沒有插話或 `provider-clear-audio`，表示本機 Discord 播放串流意外結束。檢查前面的提供者與 Discord 播放器日誌。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊作用中時刻意丟棄輸入。如果你希望語音中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供者 VAD 回報語音，但 OpenClaw 沒有作用中的播放可中斷。這不應該截斷音訊。

認證會依元件解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`/`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或提供者的一般驗證設定使用即時提供者驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並且需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要閘道主機上的 `ffmpeg` 和 `ffprobe` 來檢查並轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一個承載中的文字 + 語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換成 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="使用了不允許的 intents，或機器人看不到伺服器訊息">

    - 啟用 Message Content Intent
    - 當你依賴使用者/成員解析時，啟用 Server Members Intent
    - 變更 intents 後重新啟動閘道

  </Accordion>

  <Accordion title="Guild 訊息被意外封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的 guild 允許清單
    - 如果存在 guild `channels` 對應表，則只允許列出的頻道
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

    - `groupPolicy="allowlist"` 但沒有相符的 guild/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者被 guild/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型日誌：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 閘道佇列調整項：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord 閘道 listener 工作，不控制代理回合生命週期

    Discord 不會對已排入佇列的代理回合套用頻道擁有的逾時。訊息 listener 會立即交接，已排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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

  <Accordion title="閘道 metadata 查詢逾時警告">
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` metadata。暫時性失敗會退回 Discord 的預設閘道 URL，並在日誌中受到速率限制。

    Metadata 逾時調整項：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定 config 時的 env fallback：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="閘道 READY 逾時重新啟動">
    OpenClaw 會在啟動期間與執行階段重新連線後，等待 Discord 的閘道 `READY` 事件。具有啟動錯開安排的多帳號設定，可能需要比預設值更長的啟動 READY 時間窗。

    READY 逾時調整項：

    - 啟動單一帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定 config 時的啟動 env fallback：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單一帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定 config 時的執行階段 env fallback：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 與配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 原則已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人迴圈">
    預設會忽略機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則來避免迴圈行為。
    偏好使用 `channels.discord.allowBots="mentions"`，只接受提及該機器人的機器人訊息。

    OpenClaw 也隨附共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。只要 `allowBots` 允許機器人撰寫的訊息抵達分派流程，Discord 就會將傳入事件對應到 `(account, channel, bot pair)` 事實，而通用配對防護會在該配對超過設定的事件預算後抑制它。此防護可防止失控的雙機器人迴圈；這類迴圈過去必須由 Discord 速率限制停止。它不會影響單一機器人部署，也不會影響維持在預算內的一次性機器人回覆。

    預設設定（在設定 `allowBots` 時啟用）：

    - `maxEventsPerWindow: 20` -- 機器人配對可在滑動時間窗內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動時間窗長度
    - `cooldownSeconds: 60` -- 一旦觸發預算，任一方向的每則額外機器人對機器人訊息都會被丟棄一分鐘

    先在 `channels.defaults.botLoopProtection` 下設定一次共用預設值，然後在合法工作流程需要更多餘裕時覆寫 Discord。優先順序為：

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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 而丟棄">

    - 保持 OpenClaw 為最新版本（`openclaw update`），確保 Discord 語音接收復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，只有在需要時才調整
    - 觀察日誌是否出現：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後失敗仍持續，請收集日誌，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史記錄比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`applicationId`、`accounts.*`、`allowBots`
- 原則：`groupPolicy`、`dmPolicy`、`allowFrom`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`（全域）、`configWrites`、`slashCommand.ephemeral`
- 事件佇列：`eventQueue.listenerTimeout`（listener 預算，預設 `120000`）、`eventQueue.maxQueueSize`（預設 `10000`）、`eventQueue.maxConcurrency`（預設 `50`）
- 閘道：`proxy`、`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史記錄：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`（預設 `2000`）、`maxLinesPerMessage`（預設 `17`）
- 串流：`streaming.mode`、`streaming.chunkMode`、`streaming.preview.*`、`streaming.progress.*`、`streaming.block.*`（舊版扁平 `streamMode`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`、`chunkMode` 鍵會由 `openclaw doctor --fix` 遷移到 `streaming.*`）
- 媒體/重試：`mediaMaxMb`（限制傳出的 Discord 上傳，預設 `100`）、`retry`
- 動作：`actions.*`
- Presence：`activity`、`status`、`activityType`、`activityUrl`、`autoPresence.*`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與維運

- 將機器人 token 視為秘密（在受監督環境中偏好 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 如果命令部署/狀態過期，請重新啟動閘道，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到閘道。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理。
  </Card>
  <Card title="安全" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將 guild 與頻道對應到代理。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
