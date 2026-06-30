---
read_when:
    - 處理 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-06-30T13:45:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

Ready 可透過官方 Discord 閘道用於私訊與公會頻道。

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

你需要建立一個含有機器人的新應用程式、將機器人加入你的伺服器，並將它配對到 OpenClaw。我們建議將你的機器人加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications) 並點擊 **New Application**。將它命名為類似「OpenClaw」的名稱。

    點擊側邊欄的 **Bot**。將 **Username** 設為你稱呼 OpenClaw 代理程式的名稱。

  </Step>

  <Step title="啟用特權意圖">
    仍在 **Bot** 頁面上，向下捲動到 **Privileged Gateway Intents** 並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱對 ID 比對需要）
    - **Presence Intent**（選用；只有狀態更新需要）

  </Step>

  <Step title="複製你的機器人權杖">
    在 **Bot** 頁面上捲回上方，然後點擊 **Reset Token**。

    <Note>
    儘管名稱如此，這會產生你的第一個權杖，並不是真的在「重設」任何東西。
    </Note>

    複製權杖並儲存在某處。這是你的 **Bot Token**，稍後會用到。

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    點擊側邊欄的 **OAuth2**。你將產生一個具有正確權限的邀請 URL，以便將機器人加入你的伺服器。

    向下捲動到 **OAuth2 URL Generator** 並啟用：

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
      - 新增回應（選用）

    這是一般文字頻道的基準集合。如果你打算在 Discord 討論串中發文，包括會建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後點擊 **Continue** 來連線。你現在應該會在 Discord 伺服器中看到你的機器人。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord 應用程式，你需要啟用開發者模式，才能複製內部 ID。

    1. 點擊 **User Settings**（你頭像旁的齒輪圖示）→ 在側邊欄捲動到 **Developer** → 開啟 **Developer Mode**

        *(注意：在 Discord 行動應用程式中，開發者模式位於 **App Settings** → **Advanced**)*

    2. 在側邊欄中右鍵點擊你的 **server icon** → **Copy Server ID**
    3. 右鍵點擊你 **own avatar** → **Copy User ID**

    將你的 **Server ID** 和 **User ID** 與 Bot Token 一起儲存，下一步你會把這三者都傳送給 OpenClaw。

  </Step>

  <Step title="允許來自伺服器成員的私訊">
    若要讓配對運作，Discord 必須允許你的機器人傳私訊給你。右鍵點擊你的 **server icon** → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括機器人）傳送私訊給你。如果你想搭配 OpenClaw 使用 Discord 私訊，請保持啟用。如果你只打算使用公會頻道，可以在配對後停用私訊。

  </Step>

  <Step title="安全設定你的機器人權杖（不要在聊天中傳送）">
    你的 Discord 機器人權杖是祕密（像密碼一樣）。在傳訊息給你的代理程式之前，請先在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已經作為背景服務執行，請透過 OpenClaw Mac 應用程式重新啟動它，或停止並重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務可在重新啟動後解析 env SecretRef。
    如果你的主機因 Discord 的啟動應用程式查詢而被封鎖或受到速率限制，請從 Developer Portal 設定 Discord 應用程式／用戶端 ID，讓啟動可略過該 REST 呼叫。預設帳戶使用 `channels.discord.applicationId`；如果你執行多個 Discord 機器人，則使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的代理程式">
        在任何現有頻道（例如 Telegram）與你的 OpenClaw 代理程式聊天並告訴它。如果 Discord 是你的第一個頻道，請改用命令列介面／設定分頁。

        >「我已經在設定中設定 Discord 機器人權杖。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
      </Tab>
      <Tab title="命令列介面／設定">
        如果你偏好檔案式設定，請設定：

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

        預設帳戶的環境變數後援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於腳本化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不帶 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec 提供者的 SecretRef 值。請參閱[祕密管理](/zh-TW/gateway/secrets)。

        對於多個 Discord 機器人，請將每個機器人權杖與應用程式 ID 放在其帳戶底下。最上層的 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都應使用相同應用程式 ID 時，才在那裡設定它。

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
    等到閘道開始執行後，在 Discord 中私訊你的機器人。它會回覆一組配對碼。

    <Tabs>
      <Tab title="詢問你的代理程式">
        將配對碼傳送給你現有頻道上的代理程式：

        >「核准這個 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="命令列介面">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後過期。

    你現在應該可以透過私訊在 Discord 中與你的代理程式聊天。

  </Step>
</Steps>

<Note>
權杖解析會感知帳戶。設定中的權杖值優先於環境變數後援。`DISCORD_BOT_TOKEN` 只用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析為相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監視器。設定來源的權杖優先於預設 env 後援；否則第一個已啟用的帳戶勝出，重複帳戶會被回報為已停用。
對於進階輸出呼叫（訊息工具／頻道動作），明確的逐呼叫 `token` 會用於該呼叫。這適用於傳送與讀取／探測類動作（例如 read/search/fetch/thread/pins/permissions）。帳戶政策／重試設定仍來自作用中執行階段快照中的所選帳戶。
</Note>

## 建議：設定公會工作區

私訊可運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的代理程式工作階段與自己的情境。這建議用於只有你和機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入公會允許清單">
    這會讓你的代理程式可在你伺服器上的任何頻道回應，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「將我的 Discord Server ID `<server_id>` 加入公會允許清單」
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

  <Step title="允許不使用 @mention 也能回應">
    預設情況下，你的代理程式只有在公會頻道中被 @提及時才會回應。對私人伺服器而言，你可能會希望它回應每則訊息。

    在公會頻道中，一般回覆預設會自動張貼。對於共享的常駐聊天室，請選擇加入 `messages.groupChat.visibleReplies: "message_tool"`，讓代理程式可以潛伏，並只在判斷頻道回覆有用時才張貼。這最適合搭配最新一代、工具可靠的模型，例如 GPT 5.5。環境聊天室事件會保持安靜，除非工具送出。完整潛伏模式設定請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入，且記錄顯示權杖用量但沒有張貼訊息，請檢查該回合是否設定為環境聊天室事件，或是否選擇使用訊息工具可見回覆。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「允許我的代理程式在這個伺服器上不必被 @提及也能回應」
      </Tab>
      <Tab title="設定">
        在你的公會設定中設定 `requireMention: false`：

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

        若要要求可見群組／頻道回覆透過訊息工具傳送，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃公會頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會載入私訊工作階段。公會頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的代理程式">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期情境，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要每個頻道中的共享情境，請將穩定指示放入 `AGENTS.md` 或 `USER.md`（它們會注入每個工作階段）。將長期筆記保留在 `MEMORY.md`，並依需求使用記憶工具存取它們。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的代理程式可以看到頻道名稱，而且每個頻道都有自己的隔離工作階段，因此你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- 閘道擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的
  脈絡加入模型提示，而不是作為使用者可見的回覆前綴。如果模型將該封套
  複製回來，OpenClaw 會從對外回覆與
  後續重播脈絡中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理程式主工作階段（`agent:main:main`）。
- 伺服器頻道使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組 DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 到已路由的對話工作階段。
- 傳送到 Discord 的純文字排程/心跳偵測公告會使用最終
  助理可見答案一次。媒體與結構化元件承載資料在代理程式發出多個可傳遞承載資料時，
  仍會維持多訊息。

## 論壇頻道

Discord 論壇與媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 將訊息傳送到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用你訊息中的第一個非空白行。
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

論壇父層不接受 Discord 元件。如果你需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援用於代理程式訊息的 Discord components v2 容器。使用訊息工具並提供 `components` 承載資料。互動結果會作為一般傳入訊息路由回代理程式，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或一個選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取項與表單在過期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不相符的使用者會收到臨時拒絕訊息。

元件回呼預設會在 30 分鐘後過期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設 Discord 帳號的該回呼登錄生命週期，或設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 以覆寫多帳號設定中的某個帳號。該值以毫秒為單位，必須是正整數，且上限為 `86400000`（24 小時）。較長的 TTL 對需要讓按鈕保持可用的審查或核准工作流程很有用，但也會延長舊 Discord 訊息仍可觸發動作的時間窗口。請偏好使用符合工作流程的最短 TTL，並在過期回呼可能令人意外時保留預設值。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，包含提供者、模型、相容執行階段下拉選單以及提交步驟。`/models add` 已棄用，現在會回傳棄用訊息，而不是從聊天註冊模型。選擇器回覆是臨時的，且只有叫用的使用者可以使用。Discord 選取選單限制為 25 個選項，因此當你希望選擇器只針對所選提供者（例如 `openai` 或 `vllm`）顯示動態探索到的模型時，請將 `provider/*` 項目加入 `agents.defaults.models`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應符合附件參照時，使用 `filename` 覆寫上傳名稱

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
    `channels.discord.dmPolicy` 控制 DM 存取。`channels.discord.allowFrom` 是標準 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是 open，未知使用者會被封鎖（或在 `pairing` 模式中提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用於 `default` 帳號。
    - 對於單一帳號，`allowFrom` 的優先順序高於舊版 `dm.allowFrom`。
    - 具名帳號在自身的 `allowFrom` 與舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍會為相容性而讀取。`openclaw doctor --fix` 會在不變更存取權的情況下，盡可能將它們遷移到 `dmPolicy` 和 `allowFrom`。

    傳遞用的 DM 目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效 DM `allowFrom` 中的 ID 會為了相容性被視為使用者 DM 目標。

  </Tab>

  <Tab title="Access groups">
    Discord DM 與文字命令授權可以使用 `channels.discord.allowFrom` 中的動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。對於成員以各頻道一般 `allowFrom` 語法表示的靜態群組，請使用 `type: "message.senders"`；當 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格時，請使用 `type: "discord.channelAudience"`。共用存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    範例：允許任何可以看到 `#maintainers` 的人向 Bot 傳送 DM，同時對其他所有人保持 DM 關閉。

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

    查詢會失敗即關閉。如果 Discord 回傳 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，DM 傳送者會被視為未授權。

    使用頻道受眾存取群組時，請在 Discord Developer Portal 為 Bot 啟用 **Server Members Intent**。DM 不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="Guild policy">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準是 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）與 `roles`（僅限角色 ID）；如果任一項已設定，傳送者符合 `users` 或 `roles` 時即被允許
    - 直接名稱/標籤比對預設停用；只有在作為緊急相容模式時才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
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

    如果你只設定 `DISCORD_BOT_TOKEN` 且沒有建立 `channels.discord` 區塊，執行階段備援會是 `groupPolicy="allowlist"`（並在記錄中警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設需要提及才會通過。

    提及偵測包含：

    - 明確提及 Bot
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆 Bot 行為

    撰寫對外 Discord 訊息時，請使用標準提及語法：使用 `<@USER_ID>` 代表使用者、`<#CHANNEL_ID>` 代表頻道，以及 `<@&ROLE_ID>` 代表角色。不要使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 會依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性捨棄提及其他使用者/角色但未提及 Bot 的訊息（不含 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選擇透過 `dm.groupChannels`（頻道 ID 或 slug）設定允許清單

  </Tab>
</Tabs>

### 以角色為基礎的代理程式路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord guild 成員路由到不同代理。以角色為基礎的繫結只接受角色 ID，並且會在 peer 或 parent-peer 繫結之後、guild-only 繫結之前評估。如果某個繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須相符。

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

- `commands.native` 預設為 `"auto"`，且已針對 Discord 啟用。
- 每個頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前已註冊的命令可能仍會在 Discord 中顯示，直到你從 Discord app 移除它們。
- 原生命令授權使用與一般訊息處理相同的 Discord 允許清單/政策。
- 對未獲授權的使用者而言，命令可能仍會在 Discord UI 中顯示；執行時仍會強制套用 OpenClaw 授權，並回傳「未授權」。

請參閱[斜線命令](/zh-TW/tools/slash-commands)了解命令目錄與行為。

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

    注意：`off` 會停用隱含的回覆串接。明確的 `[[reply_to_*]]` 標籤仍會被遵循。
    `first` 一律會將隱含的原生回覆參照附加到該回合的第一則外送 Discord 訊息。
    `batched` 只會在入站事件是多則訊息的防抖批次時，附加 Discord 的隱含原生回覆參照。當你希望原生回覆主要用於模糊的爆量聊天，而不是每個單則訊息回合時，這很有用。

    訊息 ID 會顯示在脈絡/歷史中，讓代理可以指定特定訊息。

  </Accordion>

  <Accordion title="連結預覽">
    Discord 預設會為 URL 產生豐富連結嵌入。OpenClaw 預設會在外送 Discord 訊息中抑制這些產生的嵌入，因此代理傳送的 URL 會保持為純連結，除非你選擇啟用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 可覆寫單一帳號。代理 message-tool 傳送也可以針對單則訊息傳入 `suppressEmbeds: false`。明確的 Discord `embeds` 酬載不會被預設連結預覽設定抑制。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯它來串流草稿回覆。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（預設）。`progress` 會保留一則可編輯的狀態草稿，並以工具進度更新它直到最終送出；共用的起始標籤是一行滾動文字，因此一旦出現足夠工作內容，它會像其餘內容一樣捲離。`streamMode` 是舊版執行階段別名。執行 `openclaw doctor --fix` 可將已保存的設定重寫為標準鍵。

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
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
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
    - 工具/進度列在可用時會呈現為精簡的表情符號 + 標題 + 詳細資訊，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（預設 `false`）選擇在暫時進度草稿中加入助理評論/前言文字。評論會在顯示前清理、保持暫時性，且不會改變最終答案送出。
    - `streaming.progress.maxLineChars` 控制每行進度預覽預算。散文會在單字邊界縮短；命令與路徑詳細資訊會保留有用的後綴。
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

    預覽串流僅支援文字；媒體回覆會退回一般送出。當明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="歷史、脈絡與討論串行為">
    Guild 歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會路由為頻道工作階段，並繼承父頻道設定，除非被覆寫。
    - 討論串工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅模型的後援；討論串本機的 `/model` 選擇仍會優先，且除非啟用逐字稿繼承，否則不會複製父逐字稿歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動討論串選擇以父逐字稿作為種子。每帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - Message-tool 反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會作為**不受信任**的脈絡注入。允許清單會管控誰可以觸發代理，而不是完整的補充脈絡遮蔽邊界。

  </Accordion>

  <Accordion title="子代理的討論串繫結工作階段">
    Discord 可以將討論串繫結到工作階段目標，讓該討論串中的後續訊息持續路由到同一個工作階段（包括子代理工作階段）。

    命令：

    - `/focus <target>` 將目前/新討論串繫結到子代理/工作階段目標
    - `/unfocus` 移除目前討論串繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新聚焦繫結的不活動自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新聚焦繫結的硬性最長存續時間

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

    - `session.threadBindings.*` 設定全域預設值。
    - `channels.discord.threadBindings.*` 覆寫 Discord 行為。
    - `spawnSessions` 控制針對 `sessions_spawn({ thread: true })` 與 ACP 討論串 spawn 的自動建立/繫結討論串。預設：`true`。
    - `defaultSpawnContext` 控制討論串繫結 spawn 的原生子代理脈絡。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某帳號停用討論串繫結，`/focus` 與相關的討論串繫結操作將無法使用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 頻道繫結">
    若要使用穩定的「always-on」ACP 工作區，請設定以 Discord 對話為目標的頂層型別化 ACP 繫結。

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

    - `/acp spawn codex --bind here` 會在原處繫結目前頻道或討論串，並讓未來訊息保持在同一個 ACP 工作階段。討論串訊息會繼承父頻道繫結。
    - 在已繫結的頻道或討論串中，`/new` 與 `/reset` 會在原處重設同一個 ACP 工作階段。暫時討論串繫結可在啟用時覆寫目標解析。
    - `spawnSessions` 會管控透過 `--thread auto|here` 建立/繫結子討論串。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)了解繫結行為詳細資料。

  </Accordion>

  <Accordion title="反應通知">
    每個 guild 的反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換為系統事件，並附加到已路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="Ack 反應">
    `ackReaction` 會在 OpenClaw 處理入站訊息時傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為「👀」）

    注意：

    - Discord 接受 unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某頻道或帳號的反應。

  </Accordion>

  <Accordion title="設定寫入">
    頻道啟動的設定寫入預設已啟用。

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

  <Accordion title="閘道代理">
    透過 `channels.discord.proxy`，將 Discord 閘道 WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）路由到 HTTP(S) 代理。

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
    - 查詢會使用原始訊息 ID，並受時間範圍限制
    - 如果查詢失敗，代理訊息會被視為機器人訊息，且除非 `allowBots=true`，否則會被丟棄

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理需要對已知 Discord 使用者進行確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含前導 `@` 的帳號代稱；值是 Discord 使用者 ID。未知的帳號代稱、`@everyone`、`@here`，以及 Markdown 程式碼片段中的提及會保持不變。

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

  <Accordion title="狀態顯示設定">
    當你設定狀態或活動欄位，或啟用自動狀態顯示時，系統會套用狀態顯示更新。

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

    - 0: 正在玩
    - 1: 正在串流（需要 `activityUrl`）
    - 2: 正在聆聽
    - 3: 正在觀看
    - 4: 自訂（使用活動文字作為狀態內容；表情符號為選用）
    - 5: 正在競賽

    自動狀態顯示範例（執行階段健康訊號）：

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

    自動狀態顯示會將執行階段可用性對應到 Discord 狀態：健康 => 線上，降級或未知 => 閒置，耗盡或不可用 => 請勿打擾。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中使用按鈕式核准處理，也可以選擇在原始頻道中發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可解析出一位核准者時，Discord 會自動啟用原生執行核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷執行核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於敏感的僅限擁有者群組命令，例如 `/diagnostics` 和 `/export-trajectory`，OpenClaw 會私下傳送核准提示和最終結果。當發出命令的擁有者有 Discord 擁有者路由時，系統會先嘗試 Discord 私訊；如果無法使用，則會退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會顯示在頻道中。只有已解析的核准者可以使用按鈕；其他使用者會收到臨時拒絕訊息。核准提示會包含命令文字，因此只應在受信任的頻道中啟用頻道投遞。如果無法從工作階段鍵推導出頻道 ID，OpenClaw 會退回使用私訊投遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 配接器主要新增核准者私訊路由和頻道扇出。
    當這些按鈕存在時，它們是主要的核准使用者體驗；OpenClaw
    只有在工具結果表示聊天核准不可用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但原生卡片無法投遞到任何目標，
    OpenClaw 會在同一聊天中傳送備援通知，並附上待核准項目中的確切 `/approve`
    命令。

    閘道驗證和核准解析遵循共用的閘道用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後到期。

    請參閱 [執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和動作閘門

Discord 訊息動作包含傳訊、頻道管理、審核、狀態顯示和中繼資料動作。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 狀態顯示：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用於設定排程事件封面圖片。

動作閘門位於 `channels.discord.actions.*` 底下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已啟用   |
| roles                                                                                                                                                                    | 已停用   |
| moderation                                                                                                                                                               | 已停用   |
| presence                                                                                                                                                                 | 已停用   |

## Components v2 使用者介面

OpenClaw 會使用 Discord components v2 處理執行核准和跨情境標記。Discord 訊息動作也可以接受 `components` 來提供自訂使用者介面（進階；需要透過 discord 工具建構元件承載資料），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 會設定 Discord 元件容器使用的強調色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 針對每個帳號設定。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord 元件回呼保持註冊的時間長度（預設 `1800000`，最大值 `86400000`）。使用 `channels.discord.accounts.<id>.agentComponents.ttlMs` 針對每個帳號設定。
- 當 components v2 存在時，`embeds` 會被忽略。
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

Discord 有兩種不同的語音介面：即時 **語音頻道**（連續對話）和 **語音訊息附件**（波形預覽格式）。閘道同時支援兩者。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 範圍邀請機器人。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 和 Read Message History 權限。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令會使用帳號預設代理，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

若要在加入前檢查機器人的有效權限，請執行：

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

- `voice.tts` 只會覆寫 `stt-tts` 語音播放的 `messages.tts`。即時模式使用 `voice.realtime.speakerVoice`。
- `voice.mode` 控制對話路徑。預設值是 `agent-proxy`：即時語音前端會處理回合時機、中斷和播放，透過 `openclaw_agent_consult` 將實質工作委派給路由的 OpenClaw 代理，並將結果視為該說話者輸入的 Discord 提示。`stt-tts` 保留較舊的批次 STT 加 TTS 流程。`bidi` 讓即時模型直接對話，同時公開 `openclaw_agent_consult` 給 OpenClaw 大腦使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話會接收語音回合。保持未設定時會使用語音頻道自己的工作階段，或設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道作為現有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風/喇叭延伸。
- `voice.model` 會覆寫 Discord 語音回應和即時諮詢所用的 OpenClaw 代理大腦。保持未設定時會繼承路由代理模型。它與 `voice.realtime.model` 分開。
- `voice.followUsers` 讓 Bot 可跟隨選定使用者加入、移動和離開 Discord 語音。行為規則和範例請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音，這會保留說話者和目標工作階段的一般擁有者/工具授權，但隱藏代理的 `tts` 工具，因為 Discord 語音負責播放。預設情況下，`agent-proxy` 會為擁有者說話者提供擁有者等效的完整工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在作出實質回答前先諮詢 OpenClaw 代理（`voice.realtime.consultPolicy: "always"`）。在該預設 `always` 模式下，即時層不會在諮詢答案前自動說出填充內容；它會擷取並轉錄語音，然後說出路由的 OpenClaw 回答。如果 Discord 仍在播放第一個答案時有多個強制諮詢答案完成，後續的精確語音答案會排入佇列，等到播放閒置後才播放，而不是在句子中途取代語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 會設定即時音訊工作階段。若要使用 OpenAI Realtime 2 加 Codex 大腦，請使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai/gpt-5.5"`。
- 即時語音模式預設會在即時提供者指令中包含小型 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 設定檔檔案，讓快速直接回合保有與路由 OpenClaw 代理相同的身分、使用者定位和人格。將 `voice.realtime.bootstrapContextFiles` 設為子集可自訂此行為，或設為 `[]` 以停用。支援的即時啟動檔案僅限這些設定檔檔案；`AGENTS.md` 仍保留在一般代理內容中。注入的設定檔內容不會取代 `openclaw_agent_consult` 來處理工作區工作、目前事實、記憶查詢或工具支援的動作。
- 在 OpenAI `agent-proxy` 即時模式中，設定 `voice.realtime.requireWakeName: true` 可讓 Discord 即時語音保持靜默，直到轉錄以喚醒名稱開頭或結尾。設定的喚醒名稱必須是一或兩個字。若未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由代理的 `name` 加上 `OpenClaw`，並退回使用代理 ID 加上 `OpenClaw`。喚醒名稱閘控會停用即時提供者自動回應，將接受的回合路由至 OpenClaw 代理諮詢路徑，並在最終轉錄到達前，從部分轉錄辨識出開頭喚醒名稱時給出簡短的語音確認。
- OpenAI 即時提供者接受目前 Realtime 2 事件名稱，以及與舊版 Codex 相容的輸出音訊和轉錄事件別名，因此相容的提供者快照可以漂移而不會丟失助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷作用中的即時播放。若未設定，會遵循即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前的最短助理播放持續時間。預設值：`250`。在低回音房間中設為 `0` 以立即中斷，或在回音較重的喇叭設定中提高此值。
- 若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇 Text-to-speech 語音。`cedar` 是目前 OpenAI TTS 模型上一個不錯的男性聲音選擇。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄回合。
- 語音轉錄回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態，用於擁有者閘控的命令和頻道動作。代理工具可見性會遵循路由工作階段設定的工具政策。
- Discord 語音對純文字設定是選用的；設定 `channels.discord.voice.enabled=true`（或保留現有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段和 `GuildVoiceStates` 閘道意圖。
- `channels.discord.intents.voiceStates` 可以明確覆寫語音狀態意圖訂閱。保持未設定時，意圖會依有效的語音啟用狀態而定。
- 如果 `voice.autoJoin` 對同一個伺服器有多個項目，OpenClaw 會加入該伺服器最後設定的頻道。
- `voice.allowedChannels` 是選用的常駐允許清單。保持未設定時，允許 `/vc join` 加入任何已授權的 Discord 語音頻道。設定後，`/vc join`、啟動時自動加入，以及 Bot 語音狀態移動都會限制在列出的 `{ guildId, channelId }` 項目。將它設為空陣列可拒絕所有 Discord 語音加入。如果 Discord 將 Bot 移到允許清單外，OpenClaw 會離開該頻道，並在有可用的已設定自動加入目標時重新加入。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞給 `@discordjs/voice` 加入選項。
- 如果未設定，`@discordjs/voice` 預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用內建的 `libopus-wasm` 編解碼器進行 Discord 語音接收和即時原始 PCM 播放。它隨附釘選的 libopus WebAssembly 建置，不需要原生 opus 附加元件。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待其開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因為另一個使用者開始說話就停止。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放結束後再說話以進行下一個回合。即時模式會將說話者開始事件作為插話訊號轉送給即時提供者。
- 在即時模式中，喇叭回音進入開啟的麥克風可能看起來像插話並中斷播放。對於回音較重的 Discord 房間，設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` 可防止 OpenAI 因輸入音訊而自動中斷。若仍希望 Discord 說話者開始事件中斷作用中播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音/雜訊並忽略，記錄為已略過，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 OpenClaw 在 Discord 回報說話者停止後，等待多久才將該音訊片段定稿供 STT 使用。預設值：`2000`；如果 Discord 將正常停頓切成斷續的部分轉錄，請提高此值。
- 當 ElevenLabs 是選定的 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者回應串流開始。不支援串流的提供者會退回到合成的暫存檔案路徑。
- OpenClaw 也會監看接收解密失敗，並在短時間內重複失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收記錄反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告和記錄。內建的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游填充修正，該修正關閉了 discord.js issue #11419。
- `The operation was aborted` 接收事件在 OpenClaw 定稿擷取的說話者片段時是預期行為；它們是詳細診斷，不是警告。
- 詳細 Discord 語音記錄會為每個接受的說話者片段包含一行有界的 STT 轉錄預覽，因此偵錯時可同時看到使用者端和代理回覆端，而不會傾印無界轉錄文字。
- 在 `agent-proxy` 模式中，強制諮詢備援會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字或像 `and` 這樣的尾端連接詞，以及明顯不可動作的結尾語，例如「馬上回來」或「再見」。當這避免過時的佇列答案時，記錄會顯示 `forced agent consult skipped reason=...`。

### 在語音中跟隨使用者

當你希望 Discord 語音 Bot 跟隨一或多個已知 Discord 使用者，而不是在啟動時加入固定頻道或等待 `/vc join` 時，請使用 `voice.followUsers`。

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

- `followUsers` 接受原始 Discord 使用者 ID 和 `discord:<id>` 值。OpenClaw 會先正規化兩種形式，再比對語音狀態事件。
- `followUsersEnabled` 在設定 `followUsers` 時預設為 `true`。將其設為 `false` 可保留儲存的清單，但停止自動語音跟隨。
- 當被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。當使用者移動時，OpenClaw 會跟著移動。當作用中的被跟隨使用者中斷連線時，OpenClaw 會離開。
- 如果同一個伺服器中有多個被跟隨的使用者，且作用中的被跟隨使用者離開，OpenClaw 會先移至另一個已追蹤的被跟隨使用者頻道，再離開該伺服器。如果多個被跟隨的使用者同時移動，最新觀察到的語音狀態事件會勝出。
- `allowedChannels` 仍然適用。被跟隨使用者若在不允許的頻道中會被忽略，而跟隨擁有的工作階段會移至另一個被跟隨使用者或離開。
- OpenClaw 會在啟動時和有界間隔內協調遺漏的語音狀態事件。協調會抽樣已設定的伺服器，並限制每次執行的 REST 查詢數，因此非常大的 `followUsers` 清單可能需要超過一個間隔才會收斂。
- 如果 Discord 或管理員在 Bot 正在跟隨使用者時移動 Bot，OpenClaw 會重建語音工作階段，並在目的地被允許時保留跟隨所有權。如果 Bot 被移到 `allowedChannels` 外，OpenClaw 會離開，並在存在已設定目標時重新加入。
- DAVE 接收復原可能會在重複解密失敗後離開並重新加入同一頻道。跟隨擁有的工作階段會透過該復原路徑保留其跟隨所有權，因此後續被跟隨使用者中斷連線時仍會離開頻道。

選擇加入模式：

- 使用 `followUsers` 適合個人或操作員設定，讓 Bot 在你使用語音時自動進入語音。
- 使用 `autoJoin` 適合固定房間 Bot，即使沒有追蹤使用者在語音中也應在場。
- 使用 `/vc join` 適合一次性加入，或自動語音存在會讓人意外的房間。

Discord 語音編解碼器：

- 語音接收記錄會顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會先使用同一個隨附的 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，再把封包交給 `@discordjs/voice`。
- 檔案與提供者串流播放會先用 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，接著使用 `libopus-wasm` 產生送往 Discord 的 Opus 封包串流。

STT 加 TTS 管線：

- Discord PCM 擷取會轉換成 WAV 暫存檔。
- `tools.media.audio` 處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄文字會透過 Discord 入口與路由傳送，而回應 LLM 會以語音輸出政策執行，該政策會隱藏代理程式的 `tts` 工具並要求回傳文字，因為 Discord 語音負責最終 TTS 播放。
- 設定 `voice.model` 時，只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會覆蓋合併到 `messages.tts`；支援串流的提供者會直接餵給播放器，否則會播放產生的音訊檔到已加入的頻道。

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

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得自己的已路由 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段對話。即時模型只是語音前端；實質請求會交給已設定的 OpenClaw 代理程式。如果即時模型產生最終轉錄文字但沒有呼叫諮詢工具，OpenClaw 會強制進行諮詢作為後備，因此預設行為仍然像是在與代理程式對話。

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

語音作為既有 Discord 頻道工作階段的延伸：

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

在 `agent-proxy` 模式中，機器人會加入已設定的語音頻道，但 OpenClaw 代理程式回合會使用目標頻道的一般路由工作階段與代理程式。即時語音工作階段會把回傳結果說回語音頻道。監督代理程式仍可依照其工具政策使用一般訊息工具，包括在那是正確動作時傳送另一則 Discord 訊息。

委派的 OpenClaw 執行處於作用中時，新的 Discord 語音轉錄文字會先被視為即時執行控制，再開始另一個代理程式回合。像是「status」、「cancel that」、「use the smaller fix」或「when you're done also check tests」這類片語，會被分類為作用中工作階段的狀態、取消、引導或後續輸入。狀態、取消、已接受的引導與後續結果會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理該請求。

實用目標形式：

- `target: "channel:123456789012345678"` 會透過 Discord 文字頻道工作階段路由。
- `target: "123456789012345678"` 會被視為頻道目標。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 會透過該私訊工作階段路由。

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

當模型透過開放麥克風聽到自己的 Discord 播放，但你仍想透過說話打斷它時，請使用此設定。OpenClaw 會阻止 OpenAI 因原始輸入音訊而自動中斷，而 `bargeIn: true` 讓 Discord 說話者開始事件與已作用中的說話者音訊，在下一個擷取回合抵達 OpenAI 之前取消作用中的即時回應。`audioEndMs` 低於 `minBargeInAudioEndMs` 的非常早期插話訊號會被視為可能是回音/雜訊並忽略，因此模型不會在第一個播放影格就被截斷。

預期的語音記錄：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時開始時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 說話者音訊時：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過期語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時諮詢時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 代理程式回答時：`discord voice: agent turn answer ...`
- 精確語音排入佇列時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音/雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 閒置播放時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊被截斷，請將即時語音記錄視為時間軸來閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。橋接器會從此時開始計算助理輸出區塊、Discord PCM 位元組、提供者即時位元組，以及合成音訊持續時間。
2. `realtime speaker turn opened` 標記 Discord 說話者變為作用中。如果播放已經作用中且 `bargeIn` 已啟用，後面可能會接著 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標記該說話者回合收到第一個實際音訊影格。這裡的 `outputActive=true` 或非零 `outputAudioMs` 表示麥克風在助理播放仍作用中時送出輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放作用中時看到即時說話者音訊。這有助於區分真正的中斷與沒有可用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求即時提供者取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 與 `playbackChunks`，因此你可以看到中斷前實際播放了多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放重設點。原因會說明是誰停止播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 會摘要擷取到的輸入回合。`chunks=0` 或 `hasAudio=false` 表示說話者回合已開啟，但沒有可用音訊抵達即時橋接器。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：記錄行之前由即時提供者產生的助理音訊持續時間。
- `audioMs`：OpenClaw 在播放停止前計算到的助理音訊持續時間。
- `elapsedMs`：開啟與關閉播放串流或說話者回合之間的實際時間。
- `discordBytes`：傳送到 Discord 語音或從 Discord 語音接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送到即時提供者或從即時提供者接收的提供者格式 PCM 位元組。
- `playbackChunks`：轉送到 Discord 供作用中回應使用的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取到的說話者音訊影格與說話者回合關閉之間的間隔。

常見模式：

- 立即截斷且有 `source=active-speaker-audio`、較小的 `outputAudioMs`，以及附近同一位使用者，通常表示喇叭回音進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低喇叭音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false` 表示 Discord 回報說話者開始，但沒有音訊抵達 OpenClaw。這可能是暫時性的 Discord 語音事件、雜訊閘行為，或用戶端短暫觸發麥克風。
- 沒有附近插話或 `provider-clear-audio` 的 `audio playback stopped reason=stream-close`，表示本機 Discord 播放串流意外結束。請檢查前面的提供者與 Discord 播放器記錄。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊作用中時刻意丟棄輸入。如果你希望語音可中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供者 VAD 回報語音，但 OpenClaw 沒有作用中的播放可中斷。這不應截斷音訊。

憑證會依元件解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`/`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或提供者的一般驗證設定使用即時提供者驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要閘道主機上的 `ffmpeg` 與 `ffprobe` 來檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一個 payload 同時包含文字與語音訊息）。
- 可接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

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

  <Accordion title="伺服器訊息意外遭到封鎖">

    - 確認 `groupPolicy`
    - 確認 `channels.discord.guilds` 下的伺服器允許清單
    - 如果伺服器 `channels` 對應存在，則只允許列出的頻道
    - 確認 `requireMention` 行為與提及模式

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
    - `requireMention` 設定在錯誤的位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者被伺服器/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 閘道佇列旋鈕：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord 閘道 listener 工作，不控制代理回合生命週期

    Discord 不會對已排隊的代理回合套用頻道擁有的逾時。訊息 listener 會立即交接，而已排隊的 Discord 執行會保留每個 session 的排序，直到 session/工具/runtime 生命週期完成或中止工作。

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

  <Accordion title="閘道 metadata lookup timeout 警告">
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` metadata。暫時性失敗會退回 Discord 的預設閘道 URL，並在記錄中受到速率限制。

    Metadata timeout 旋鈕：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定 config 時的 env 後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="閘道 READY timeout 重新啟動">
    OpenClaw 會在啟動期間與 runtime 重新連線後，等待 Discord 的閘道 `READY` 事件。具有啟動錯開的多帳號設定，可能需要比預設值更長的啟動 READY 視窗。

    READY timeout 旋鈕：

    - 啟動單一帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定 config 時的啟動 env 後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - runtime 單一帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime 多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定 config 時的 runtime env 後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug key，runtime 比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 與配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM policy 已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人迴圈">
    預設會忽略機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則，以避免迴圈行為。
    偏好使用 `channels.discord.allowBots="mentions"`，只接受提及該機器人的機器人訊息。

    OpenClaw 也隨附共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。每當 `allowBots` 允許機器人撰寫的訊息到達 dispatch，Discord 會將入站事件對應到 `(account, channel, bot pair)` 事實，而通用 pair guard 會在該配對超過設定的事件額度後抑制它。此 guard 可防止失控的雙機器人迴圈；這類迴圈過去必須由 Discord 速率限制停止。它不會影響單一機器人部署，或維持在額度內的一次性機器人回覆。

    預設設定（設定 `allowBots` 時啟用）：

    - `maxEventsPerWindow: 20` -- 機器人配對可在滑動視窗內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動視窗長度
    - `cooldownSeconds: 60` -- 一旦額度觸發，任一方向的每則額外機器人對機器人訊息都會被捨棄一分鐘

    先在 `channels.defaults.botLoopProtection` 下設定一次共用預設值，然後在合法工作流程需要更多餘裕時覆寫 Discord。優先順序為：

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 內建預設值

    Discord 使用通用的 `maxEventsPerWindow`、`windowSeconds` 和 `cooldownSeconds` key。

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
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
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

    - 保持 OpenClaw 為最新版本（`openclaw update`），以確保 Discord 語音接收復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，僅在需要時調整
    - 觀察記錄中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後失敗仍持續，請收集記錄，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- policy：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- command：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（listener 額度）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 閘道：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制輸出 Discord 上傳，預設 `100MB`）、`retry`
- actions：`actions.*`
- presence：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與維運

- 將機器人 token 視為機密（在受監督環境中偏好使用 `DISCORD_BOT_TOKEN`）。
- 授予最小權限的 Discord 權限。
- 如果 command deploy/state 過期，請重新啟動閘道，並以 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到閘道。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將入站訊息路由到代理。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將伺服器與頻道對應到代理。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
