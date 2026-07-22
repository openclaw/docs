---
read_when:
    - 開發 Discord 頻道功能
summary: Discord Bot 設定、設定鍵、元件、語音與疑難排解
title: Discord
x-i18n:
    generated_at: "2026-07-22T10:24:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 52a2926217f3a8dfb9398551ddacb0bc6aae6de0a164b215c55256eda9b6245e
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw 透過官方 Discord 閘道，以機器人身分連線至 Discord。支援私訊與伺服器頻道。

<CardGroup cols={3}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    Discord 私訊預設使用配對模式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="頻道疑難排解" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

建立含有機器人的 Discord 應用程式、將機器人新增至你的伺服器，並與 OpenClaw 配對。若可行，請使用私人伺服器；如有需要，請先[建立伺服器](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    在 [Discord Developer Portal](https://discord.com/developers/applications) 中，按一下 **New Application** 並為其命名（例如 “OpenClaw”）。

    開啟側邊欄中的 **Bot**，並將 **Username** 設為你的代理程式名稱。

  </Step>

  <Step title="啟用特殊權限意圖">
    仍在 **Bot** 頁面的 **Privileged Gateway Intents** 下啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單、名稱對 ID 比對，以及頻道受眾存取群組需要此項目）
    - **Presence Intent**（選用；僅用於上線狀態更新）

  </Step>

  <Step title="複製你的機器人權杖">
    在 **Bot** 頁面按一下 **Reset Token**，然後複製權杖。

    <Note>
    儘管名稱如此，這會產生你的第一個權杖，並沒有任何項目被“重設”。
    </Note>

  </Step>

  <Step title="產生邀請 URL 並將機器人新增至伺服器">
    開啟側邊欄中的 **OAuth2**。在 **OAuth2 URL Generator** 中啟用下列範圍：

    - `bot`
    - `applications.commands`

    在隨即出現的 **Bot Permissions** 區段中，至少啟用：

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（選用）

    這是一般文字頻道所需的基本權限。如果機器人會在討論串中發文（包括會建立或延續討論串的論壇或媒體頻道工作流程），也請啟用 **Send Messages in Threads**。

    複製產生的 URL，在瀏覽器中開啟、選取你的伺服器，然後按一下 **Continue**。機器人現在應會出現在你的伺服器中。

  </Step>

  <Step title="啟用開發者模式並取得你的 ID">
    在 Discord 應用程式中啟用開發者模式，以便複製 ID：

    1. **User Settings**（齒輪圖示）→ **Developer** → 開啟 **Developer Mode**
       *（行動裝置：**App Settings** → **Advanced**）*
    2. 在你的**伺服器圖示**上按一下滑鼠右鍵 → **Copy Server ID**
    3. 在你**自己的頭像**上按一下滑鼠右鍵 → **Copy User ID**

    將伺服器 ID、使用者 ID 與機器人權杖保存在一起；下一步會需要這三者。

  </Step>

  <Step title="允許伺服器成員傳送私訊">
    若要讓配對正常運作，Discord 必須允許機器人傳送私訊給你。在你的**伺服器圖示**上按一下滑鼠右鍵 → **Privacy Settings** → 開啟 **Direct Messages**。

    如果你使用 Discord 私訊與 OpenClaw 互動，請保持啟用。如果你只使用伺服器頻道，可以在配對後停用。

  </Step>

  <Step title="安全地設定機器人權杖（請勿在聊天中傳送）">
    機器人權杖是機密資訊。在向代理程式傳送訊息之前，請先在執行 OpenClaw 的機器上設定：

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

    如果 OpenClaw 已作為背景服務執行，請透過 OpenClaw Mac 應用程式重新啟動，或停止後再重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請在已設定 `DISCORD_BOT_TOKEN` 的 Shell 中執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務能在重新啟動後解析環境變數 SecretRef。
    如果你的主機在啟動時查詢 Discord 應用程式遭封鎖或速率限制，請從 Developer Portal 設定應用程式／用戶端 ID，讓啟動程序略過該 REST 呼叫：預設帳戶使用 `channels.discord.applicationId`，各機器人則使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的代理程式">
        在現有頻道（例如 Telegram）中與你的 OpenClaw 代理程式交談並告知它。如果 Discord 是你的第一個頻道，請改用命令列介面／設定分頁。

        > “我已在設定中設定 Discord 機器人權杖。請使用使用者 ID `<user_id>` 和伺服器 ID `<server_id>` 完成 Discord 設定。”
      </Tab>
      <Tab title="命令列介面／設定">
        檔案型設定：

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

        預設帳戶的環境變數備援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於指令碼或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後移除 `--dry-run` 再次執行。純文字 `token` 字串也可使用，而且 `channels.discord.token` 支援跨 env/file/exec 提供者的 SecretRef 值。請參閱[機密資訊管理](/zh-TW/gateway/secrets)。

        若要使用多個 Discord 機器人，請將每個機器人的權杖與應用程式 ID 保存在其帳戶下。頂層 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都使用相同應用程式 ID 時，才應在頂層設定。

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
    閘道開始執行後，在 Discord 中私訊你的機器人。它會回覆配對碼。

    <Tabs>
      <Tab title="詢問你的代理程式">
        在現有頻道中將配對碼傳送給你的代理程式：

        > “核准此 Discord 配對碼：`<CODE>`”
      </Tab>
      <Tab title="命令列介面">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後失效。核准後，即可透過 Discord 私訊與代理程式交談。

  </Step>
</Steps>

<Note>
權杖解析會區分帳戶。設定中的權杖值優先於環境變數備援，而 `DISCORD_BOT_TOKEN` 僅用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析到相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監控器：設定來源的權杖優先於環境變數備援；否則第一個已啟用的帳戶優先，而重複帳戶會被回報為已停用，原因是 `duplicate bot token`。
對於進階輸出呼叫（訊息工具／頻道動作），每次呼叫明確指定的 `token` 會用於該次呼叫。這適用於傳送及讀取／探測類動作（讀取／搜尋／擷取／討論串／釘選／權限）。帳戶原則／重試設定仍來自作用中執行階段快照內所選取的帳戶。
</Note>

## 建議：設定伺服器工作區

私訊正常運作後，你可以將伺服器轉變為完整工作區，讓每個頻道都有各自的代理程式工作階段與內容脈絡。建議用於只有你和機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器新增至伺服器允許清單">
    這可讓代理程式回應伺服器中的任何頻道，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > “將我的 Discord 伺服器 ID `<server_id>` 新增至伺服器允許清單”
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

  <Step title="允許不使用 @提及的回應">
    代理程式預設只會在伺服器頻道中被 @提及時回應。在私人伺服器中，你可能會希望它回應每則訊息。

    在伺服器頻道中，一般回覆預設會自動發佈。對於持續啟用的共用聊天室，請選擇啟用 `messages.groupChat.visibleReplies: "message_tool"`，讓代理程式可以旁觀，並僅在判斷頻道回覆有用時才發佈。此功能最適合 GPT-5.6 Sol 等最新一代、工具可靠的模型。除非工具傳送內容，環境聊天室事件會保持靜默。完整的旁觀模式設定請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入，記錄也顯示權杖用量，卻沒有發佈訊息，請檢查該次處理是否設定為環境聊天室事件，或是否選擇使用訊息工具產生可見回覆。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > “允許我的代理程式在此伺服器上回應，而不必被 @提及”
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

        若要讓可見的群組／頻道回覆必須透過訊息工具傳送，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃伺服器頻道中的記憶">
    長期記憶（MEMORY.md）只會在私訊工作階段中自動載入；伺服器頻道不會載入。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > “當我在 Discord 頻道中提問時，如果需要 MEMORY.md 中的長期內容脈絡，請使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手動">
        若要在每個頻道中共用內容脈絡，請將固定指示放入 `AGENTS.md` 或 `USER.md`（會注入每個工作階段）。將長期筆記保存在 `MEMORY.md`，並視需要使用記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在即可建立頻道並開始聊天。代理程式會看見頻道名稱，而每個頻道都是獨立的工作階段——可依照你的工作流程設定 `#coding`、`#home`、`#research` 或任何合適的頻道。

## 執行階段模型

- 閘道負責 Discord 連線。
- 回覆路由是確定性的：Discord 的傳入訊息會回覆至 Discord。
- Discord 伺服器／頻道中繼資料會以不受信任的內容脈絡加入模型提示，而不是使用者可見的回覆前綴。如果模型將該封裝複製回來，OpenClaw 會從輸出回覆與未來的重播內容脈絡中移除複製的中繼資料。
- 依預設（`session.dmScope=main`），直接聊天會共用代理程式的主要工作階段（`agent:main:main`）。
- 伺服器頻道使用隔離的工作階段索引鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組私訊預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍會將 `CommandTargetSessionKey` 傳遞至路由後的對話工作階段。
- 純文字排程／心跳偵測公告傳送至 Discord 時，會合併為最終對助理可見的答案，且只傳送一次。當代理程式產生多個可傳送的承載內容時，媒體與結構化元件承載內容仍會以多則訊息傳送。

## 論壇頻道

Discord 論壇與媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息至論壇父頻道（`channel:<forumId>`），即可自動建立討論串。討論串標題會使用訊息中第一個非空白行（截斷至 Discord 的 100 字元討論串名稱上限）。
- 使用 `openclaw message thread create` 直接建立討論串。請勿對論壇頻道傳入 `--message-id`。

傳送至論壇父頻道以建立討論串：

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "主題標題\n貼文內容"
```

明確建立論壇討論串：

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "主題標題" --message "貼文內容"
```

論壇父頻道不接受 Discord 元件。如果需要元件，請傳送至討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援在代理程式訊息中使用 Discord components v2 容器。使用訊息工具並提供 `components` 承載內容。互動結果會以一般傳入訊息的形式路由回代理程式，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多可包含 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

元件預設只能使用一次。設定 `components.reusable=true`，即可允許按鈕、選取選單和表單在到期前使用多次。

若要限制誰可以按下按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。不相符的使用者會收到僅自己可見的拒絕訊息。

元件回呼預設於 30 分鐘後到期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設帳號的回呼登錄存續時間，或按帳號設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。此值以毫秒為單位，必須是正整數，上限為 `86400000`（24 小時）。較長的 TTL 適合需要讓按鈕持續可用的審查／核准工作流程，但也會延長舊 Discord 訊息仍可觸發動作的期間。請優先採用能滿足需求的最短 TTL；若過時的回呼可能造成意外，請保留預設值。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含供應商、模型及相容執行階段下拉式選單，並附有提交步驟。`/models add` 已棄用，會傳回棄用訊息，而不會從聊天中註冊模型。選擇器回覆僅自己可見，且只有叫用該命令的使用者可以操作。Discord 選取選單最多只能有 25 個選項，因此若希望選擇器只顯示特定供應商（例如 `openai` 或 `vllm`）動態探索到的模型，請將 `provider/*` 項目新增至 `agents.defaults.modelPolicy.allow`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 若上傳名稱應與附件參照相符，請使用 `filename` 覆寫上傳名稱

互動視窗表單：

- 新增 `components.modal`，最多可包含 5 個欄位
- 欄位類型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 會自動新增觸發按鈕

範例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "選用的備用文字",
  components: {
    reusable: true,
    text: "選擇路徑",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "核准",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "拒絕", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "選擇一個選項",
          options: [
            { label: "選項 A", value: "a" },
            { label: "選項 B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "詳細資料",
      triggerLabel: "開啟表單",
      fields: [
        { type: "text", label: "申請者" },
        {
          type: "select",
          label: "優先順序",
          options: [
            { label: "低", value: "low" },
            { label: "高", value: "high" },
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
    `channels.discord.dmPolicy` 控制私訊存取。`channels.discord.allowFrom` 是標準私訊允許清單。

    - `pairing`（預設）
    - `allowlist`（至少需要一位 `allowFrom` 傳送者）
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    若私訊政策不是開放模式，未知使用者會遭到封鎖（或在 `pairing` 模式下收到配對提示）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 僅套用至 `default` 帳號。
    - 對單一帳號而言，`allowFrom` 的優先順序高於舊版 `dm.allowFrom`。
    - 具名帳號在自身的 `allowFrom` 和舊版 `dm.allowFrom` 均未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    為了相容性，系統仍會讀取舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom`。若可在不變更存取權的情況下進行，`openclaw doctor --fix` 會將它們遷移至 `dmPolicy` 和 `allowFrom`。

    用於傳遞的私訊目標格式：

    - `user:<id>`
    - `<@id>` 提及

    啟用頻道預設值時，純數字 ID 通常會解析為頻道 ID；但為了相容性，列於帳號有效私訊 `allowFrom` 中的 ID 會視為使用者私訊目標。

  </Tab>

  <Tab title="存取群組">
    Discord 私訊和文字命令授權可以使用 `channels.discord.allowFrom` 中的動態 `accessGroup:<name>` 項目。

    存取群組名稱會在各訊息頻道之間共用。若靜態群組的成員是以各頻道的一般 `allowFrom` 語法表示，請使用 `type: "message.senders"`；若應由 Discord 頻道目前的 `ViewChannel` 對象動態定義成員資格，請使用 `type: "discord.channelAudience"`。共用存取群組行為：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 對成員資格的定義如下：私訊傳送者是已設定伺服器的成員，且套用角色與頻道覆寫後，目前對已設定的頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何能查看 `#maintainers` 的人私訊機器人，同時對其他所有人關閉私訊。

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

    你可以混用動態與靜態項目：

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

    查詢會採取失敗即拒絕的方式。若 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同的伺服器，該私訊傳送者會被視為未獲授權。

    使用頻道對象存取群組時，請在 Discord Developer Portal 啟用 **Server Members Intent**。私訊不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析該成員。

  </Tab>

  <Tab title="伺服器政策">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    存在 `channels.discord` 時，安全基準為 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（偏好使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅限角色 ID）；若設定其中任一項，傳送者只要符合 `users` 或 `roles` 即可獲准
    - 預設停用直接名稱／標籤比對；僅在緊急相容模式下啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱／標籤，但使用 ID 較安全；使用名稱／標籤項目時，`openclaw security audit` 會發出警告
    - 若伺服器已設定 `channels`，則不在清單中的頻道會遭到拒絕
    - 若伺服器沒有 `channels` 區塊，則該允許清單伺服器中的所有頻道都會獲准

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

    `openclaw doctor --fix` 會將舊版的各頻道 `allow` 鍵遷移至 `enabled`。

    若你只設定 `DISCORD_BOT_TOKEN`，而未建立 `channels.discord` 區塊，執行階段備用值會是 `groupPolicy="allowlist"`（日誌中會顯示警告），即使 `channels.defaults.groupPolicy` 為 `open` 亦然。

  </Tab>

  <Tab title="提及與群組私訊">
    伺服器訊息預設需要提及才會處理。

    提及偵測包括：

    - 明確提及機器人
    - 已設定的提及模式（`agents.entries.*.groupChat.mentionPatterns`，備用為 `messages.groupChat.mentionPatterns`）
    - 在支援的情況下，隱含的回覆機器人行為

    撰寫外送 Discord 訊息時，請使用標準提及語法：使用 `<@USER_ID>` 提及使用者、`<#CHANNEL_ID>` 提及頻道，以及 `<@&ROLE_ID>` 提及角色。請勿使用舊版 `<@!USER_ID>` 暱稱提及格式。

    `requireMention` 會按伺服器／頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇丟棄提及其他使用者／角色但未提及機器人的訊息（不包括 @everyone/@here）。

    群組私訊：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可透過 `dm.groupChannels` 設定選用允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理程式路由

使用 `bindings[].match.roles`，依角色 ID 將 Discord 伺服器成員路由至不同的代理程式。以角色為基礎的繫結僅接受角色 ID，並在對等方或父對等方繫結之後、僅限伺服器的繫結之前進行評估。若繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），則所有已設定的欄位都必須相符。

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

- `commands.native` 預設為 `"auto"`，且已為 Discord 啟用。
- 各頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令的註冊與清理。先前註冊的命令可能仍會顯示在 Discord 中，直到你從 Discord 應用程式移除它們。
- 原生命令授權使用與一般訊息處理相同的 Discord 允許清單／政策。
- 未獲授權的使用者仍可能在 Discord UI 中看到命令；執行時會強制套用 OpenClaw 授權，並回覆 "not authorized"。
- 預設斜線命令設定：`ephemeral: true`（`channels.discord.slashCommand.ephemeral`）。

命令目錄與行為請參閱[斜線命令](/zh-TW/tools/slash-commands)。

## 功能詳細資訊

<AccordionGroup>
  <Accordion title="回覆標籤與原生回覆">
    Discord 支援代理程式輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）：不使用隱含的回覆串接；仍會遵循明確的 `[[reply_to_*]]` 標籤
    - `first`：將隱含的原生回覆參照附加至本輪第一則傳出的 Discord 訊息
    - `all`：將其附加至每一則傳出訊息
    - `batched`：僅在傳入事件是由多則訊息組成的防彈跳批次時附加；如果你主要想在語意不明的密集對話中使用原生回覆，而非每個單一訊息輪次都使用，此選項很實用

    訊息 ID 會呈現在上下文／歷程記錄中，讓代理程式可指定特定訊息。

  </Accordion>

  <Accordion title="連結預覽">
    Discord 預設會為 URL 產生豐富連結嵌入。OpenClaw 預設會抑制傳出 Discord 訊息中產生的這些嵌入，因此除非你選擇啟用，否則代理程式傳送的 URL 會維持為純連結：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 可覆寫單一帳號。代理程式透過訊息工具傳送時，也可針對單一訊息傳入 `suppressEmbeds: false`。明確的 Discord `embeds` 承載資料不會受到預設連結預覽設定的抑制。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可透過傳送暫時訊息，並在文字到達時編輯該訊息，來串流回覆草稿。`channels.discord.streaming.mode` 接受 `off` | `partial` | `block` | `progress`（未設定 `streaming`／舊版 `streamMode` 鍵時的預設值）。`streamMode` 是舊版別名；執行 `openclaw doctor --fix` 可將持久化設定改寫為標準的巢狀 `streaming` 結構。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: false,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` 會停用 Discord 預覽編輯。
    - `partial` 會在權杖到達時編輯單一預覽訊息。
    - `block` 會發出草稿大小的區塊；使用 `streaming.preview.chunk`（`minChars`、`maxChars`、`breakPreference`）調整大小與中斷點，並限制於 `textChunkLimit`。明確啟用區塊串流時，OpenClaw 會略過預覽串流，以避免重複串流。
    - `progress` 會保留一則可編輯的狀態草稿，直到最終傳遞。預設會顯示代理程式最新前導說明或敘述的一行內容，不含產生的標籤、間隔或工具列。
    - 媒體、錯誤及明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress` 在 `partial`／`block` 模式下預設為 `true`。Discord 進度模式預設不顯示工具列；設定 `streaming.progress.toolProgress: true` 可選擇啟用。
    - 設定 `streaming.progress.toolProgress: true` 可新增精簡工具／進度列，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。為了相容性，現有的 `progress.label` 或 `progress.labels` 設定會保留先前的工具列預設值；設定 `toolProgress: false` 可使用自訂標籤而不顯示工具列。
    - `streaming.progress.commentary`（預設為 `false`）可選擇在暫時的進度草稿中顯示原始助理評論。預設的前導說明／敘述狀態行不受此選項影響。評論會在顯示前經過清理、僅暫時存在，且不會變更最終答案的傳遞。
    - `streaming.progress.maxLineChars` 控制每行進度預覽的字元額度。一般文字會在單字邊界縮短；命令與路徑詳細資訊則保留實用的後綴。
    - `streaming.preview.commandText`／`streaming.progress.commandText` 控制精簡進度行中的命令／執行詳細資訊：`raw`（預設）或 `status`（僅工具標籤）。

    隱藏原始命令／執行文字，同時保留精簡進度行：

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

    預覽串流僅支援文字；媒體回覆會改用一般傳遞方式。

  </Accordion>

  <Accordion title="歷程記錄、上下文與討論串行為">
    伺服器歷程記錄上下文：

    - `channels.discord.historyLimit` 預設為 `20`
    - 備援：`messages.groupChat.historyLimit`
    - `0` 會停用

    私訊歷程記錄控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會路由為頻道工作階段，且除非覆寫，否則會繼承上層頻道設定。
    - 討論串工作階段會繼承上層頻道的工作階段層級 `/model` 選擇，作為僅限模型的備援；討論串本機的 `/model` 選擇具有優先權，且除非已啟用逐字稿繼承，否則不會複製上層逐字稿歷程記錄。
    - `channels.discord.thread.inheritParent`（預設為 `false`）可讓新的自動討論串選擇使用上層逐字稿作為初始內容。各帳號覆寫：`channels.discord.accounts.<id>.thread.inheritParent`。
    - 訊息工具的回應可以解析 `user:<id>` 私訊目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用備援期間保留。

    頻道主題會以**不受信任**的上下文注入。允許清單限制誰能觸發代理程式，但並非完整的補充上下文遮蔽界線。

  </Accordion>

  <Accordion title="子代理程式的討論串綁定工作階段">
    Discord 可將討論串綁定至工作階段目標，讓該討論串中的後續訊息持續路由至同一工作階段（包括子代理程式工作階段）。

    命令：

    - `/focus <target>` 將目前／新討論串綁定至子代理程式／工作階段目標
    - `/unfocus` 移除目前的討論串綁定
    - `/agents` 顯示作用中的執行與綁定狀態
    - `/session idle <duration|off>` 檢視／更新聚焦綁定因閒置而自動取消聚焦的設定
    - `/session max-age <duration|off>` 檢視／更新聚焦綁定的絕對最長存續時間

    設定：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
      spawnSessions: true,
      defaultSpawnContext: "fork",
    },
  },
}
```

    注意事項：

    - `session.threadBindings.*` 是 Discord 與 Telegram 的標準政策。
    - `spawnSessions` 控制是否為 `sessions_spawn({ thread: true })` 與 ACP 討論串衍生自動建立／綁定討論串。預設值：`true`。
    - `defaultSpawnContext` 控制討論串綁定衍生的原生子代理程式上下文。預設值：`"fork"`。
    - 已淘汰的 `spawnSubagentSessions`／`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果停用討論串綁定，`/focus` 與相關操作將無法使用。

    請參閱[子代理程式](/zh-TW/tools/subagents)、[ACP 代理程式](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="來源訊息上的子代理程式進度">
    設定 `channels.discord.subagentProgress: true`，可在啟動上層執行的 Discord 訊息上顯示背景子項活動。

```json5
{
  channels: {
    discord: {
      subagentProgress: true,
    },
  },
}
```

    子項執行處於作用中時，OpenClaw 會讓 Discord 的輸入狀態維持最多一小時，並隨並行數量變化替換一個計數回應（從 `1️⃣` 到 `🔟`）；`🔟` 也代表 10 個以上。最後一個子項結束後，會移除計數回應。失敗、逾時或遭終止的子項會留下 `🔴` 回應。

    此功能須選擇啟用，並使用固定的內部計時與表情符號預設值。機器人需要 **Add Reactions** 權限才能提供回應意見回饋。帳號層級的 `channels.discord.accounts.<id>.subagentProgress` 會覆寫頂層值。

  </Accordion>

  <Accordion title="持久 ACP 頻道綁定">
    若要建立穩定且「永遠啟用」的 ACP 工作區，請設定以 Discord 對話為目標的頂層具型別 ACP 綁定。

    設定路徑：`bindings[]`，搭配 `type: "acp"` 與 `match.channel: "discord"`。

```json5
{
  agents: {
    entries: {
      codex: {
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
    },
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

    - `/acp spawn codex --bind here` 會就地綁定目前頻道或討論串，並讓後續訊息維持在同一個 ACP 工作階段。討論串訊息會繼承上層頻道綁定。
    - 在已綁定的頻道或討論串中，`/new` 與 `/reset` 會就地重設同一個 ACP 工作階段。暫時討論串綁定可在作用期間覆寫目標解析。
    - `spawnSessions` 會透過 `--thread auto|here` 限制子討論串的建立／綁定。

    綁定行為的詳細資訊請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

  </Accordion>

  <Accordion title="回應通知">
    各伺服器的回應通知模式（`guilds.<id>.reactionNotifications`）：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    回應事件會轉換為系統事件，並附加至路由後的 Discord 工作階段。

  </Accordion>

  <Accordion title="上線狀態事件">
    選擇讓伺服器在真人成員從離線轉為上線時，觸發已路由的代理程式喚醒：

    ```json5
    {
      channels: {
        discord: {
          intents: { presence: true },
          guilds: {
            "111111111111111111": {
              presenceEvents: {
                channelId: "222222222222222222",
                users: ["333333333333333333"], // 選用；進一步縮小頻道檢視者範圍
                reconnectSuppressSeconds: 300, // 選用；新工作階段的靜默時段（0 表示停用）
                burstLimit: 8, // 選用；每個突發時段的事件數上限
                burstWindowSeconds: 60, // 選用；滑動式突發偵測時段
              },
            },
          },
        },
      },
    }
    ```

    `presenceEvents` 需要為路由目標代理程式啟用心跳偵測，並在 Discord Developer Portal 中應用程式的 Bot 頁面啟用具特殊權限的 **Presence Intent**。OpenClaw 會從每個完整的 `GUILD_CREATE` 快照植入目前上線的成員、路由觀察到的離線轉上線狀態變化，並將之後首次收到、屬於未見過成員的上線訊號視為新近可用。該成員可能是在快照後上線或加入，因此事件不會斷言其先前的確切狀態。只有能檢視 `channelId` 的真人才符合資格：頻道和公開討論串需要對該頻道或其父項具有 **View Channel** 權限，而私人討論串還需要成員資格或 **Manage Threads** 權限。`users` 可進一步縮小該受眾範圍。OpenClaw 會忽略機器人及未變更的上線狀態，並在閘道重新啟動後繼續保留每位使用者 8 小時的冷卻時間。當 Discord 建立新的閘道工作階段並傳送 `READY` 時，OpenClaw 會在重建伺服器上線狀態期間，暫停由上線狀態衍生的事件 `reconnectSuppressSeconds`（預設為 300，`0` 表示停用），因此再次觀察到的成員不會逐一喚醒代理程式。此外，它還會限制每個伺服器成功排入佇列的事件速率，在每個 `burstWindowSeconds` 滑動時段（預設為 60）內最多 `burstLimit` 個事件（預設為 8），並且每個伺服器的每次抑制期間只記錄一次。恢復的工作階段不會被視為新的工作階段。Discord 會限制成員超過 75,000 人之伺服器的快照；在這類伺服器中，OpenClaw 必須先收到明確的離線更新，才能傳送問候。系統事件會攜帶不可變的使用者、伺服器和頻道 ID，而不會嵌入可變的顯示名稱。代理程式會決定是否問候以及如何問候。

  </Accordion>

  <Accordion title="確認回應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理程式身分表情符號備援（`agents.entries.*.identity.emoji`，否則使用 "👀"）

    注意事項：

    - Discord 接受 Unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某個頻道或帳號的回應。

    **範圍（`messages.ackReactionScope`）：**

    值：`"all"`（私訊 + 群組，包括環境聊天室事件）、`"direct"`（僅限私訊）、`"group-all"`（除環境聊天室事件外的每則群組訊息，不含私訊）、`"group-mentions"`（機器人在群組中被提及時；**不含私訊**，預設值）、`"off"` / `"none"`（停用）。

    <Note>
    預設範圍（`"group-mentions"`）不會在直接訊息或環境聊天室事件中觸發確認回應。若要對傳入的 Discord 私訊和安靜聊天室事件加入確認回應，請將 `messages.ackReactionScope` 設為 `"all"`。
    </Note>

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

  <Accordion title="閘道代理伺服器">
    使用 `channels.discord.proxy`，透過 HTTP(S) 代理伺服器路由 Discord 閘道 WebSocket 流量和啟動時的 REST 查詢（應用程式 ID + 允許清單解析）。
    Discord 閘道 WebSocket 代理必須明確設定；WebSocket 連線不會繼承閘道處理程序中的環境代理變數。設定 `channels.discord.proxy` 時，啟動 REST 查詢會使用此代理伺服器。

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
    啟用 PluralKit 解析，將代理訊息對應至系統成員身分：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 選用；私人系統需要此項
      },
    },
  },
}
```

    注意事項：

    - 允許清單可使用 `pk:<memberId>`
    - 僅在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱／slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID 呼叫 PluralKit API
    - 若查詢失敗，代理訊息會被視為機器人訊息並遭捨棄，除非 `allowBots` 允許其通過

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理程式需要對已知 Discord 使用者進行確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含開頭 `@` 的帳號代稱；值是 Discord 使用者 ID。未知帳號代稱、`@everyone`、`@here`，以及 Markdown 程式碼範圍內的提及都會保持不變。

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
    設定狀態或活動欄位，或啟用自動上線狀態時，系統會套用上線狀態更新。

    僅設定狀態：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活動（設定 `activity` 時，自訂狀態是預設的活動類型）：

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

    活動類型對照：

    - 0：Playing
    - 1：Streaming（需要 `activityUrl`；而 `activityUrl` 又需要 `activityType: 1`）
    - 2：Listening
    - 3：Watching
    - 4：Custom（使用活動文字作為狀態內容；表情符號為選用）
    - 5：Competing

    自動上線狀態（執行階段健康狀態訊號）：

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

    自動上線狀態會將執行階段可用性對應至 Discord 狀態：健康 => online、降級或未知 => idle、已耗盡或無法使用 => dnd。預設值：`intervalMs` 為 30000、`minUpdateIntervalMs` 為 15000（必須小於或等於 `intervalMs`）。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中以按鈕處理核准，也可選擇在原始頻道中發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會回退至 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設值：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少能解析一位核准者時，Discord 會自動啟用原生執行核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷執行核准者。若要明確停用 Discord 作為原生核准用戶端，請設定 `enabled: false`。

    對於 `/diagnostics` 和 `/export-trajectory` 等僅限擁有者執行的敏感群組命令，OpenClaw 會私下傳送核准提示和最終結果。當發出命令的擁有者具有 Discord 擁有者路由時，它會先嘗試使用 Discord 私訊；否則會回退至 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會顯示在頻道中。只有已解析的核准者可以使用按鈕；其他使用者會收到僅自己可見的拒絕訊息。核准提示包含命令文字，因此只應在受信任的頻道中啟用頻道傳送。若無法從工作階段金鑰推導頻道 ID，OpenClaw 會回退至私訊傳送。

    Discord 會呈現其他聊天頻道共用的核准按鈕；原生 Discord 介面卡主要加入核准者私訊路由和頻道分送功能。當這些按鈕存在時，它們是主要的核准使用者體驗；只有工具結果指出聊天核准無法使用，或手動核准是唯一途徑時，OpenClaw 才應包含手動 `/approve` 命令。如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留本機確定性的 `/approve <id> <decision>` 提示。如果執行階段已啟用，但原生卡片無法傳送至任何目標，OpenClaw 會在同一聊天中傳送備援通知，其中包含待處理核准的確切 `/approve` 命令。

    閘道驗證和核准解析遵循共用的閘道用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 則透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後到期。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和動作閘門

Discord 訊息動作涵蓋訊息傳送、頻道管理、內容管理、上線狀態和中繼資料。

核心範例：

- 訊息傳送：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回應：`react`、`reactions`、`emojiList`
- 內容管理：`timeout`、`kick`、`ban`
- 上線狀態：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），以設定排程活動的封面圖片。

動作閘門位於 `channels.discord.actions.*` 之下。

預設閘門行為：

| 動作群組                                                                                                                                                             | 預設值  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 啟用  |
| roles                                                                                                                                                                    | 停用 |
| moderation                                                                                                                                                               | 停用 |
| presence                                                                                                                                                                 | 停用 |

## Components v2 使用者介面

OpenClaw 使用 Discord components v2 處理執行核准及跨情境標記。Discord 訊息動作也可接受 `components` 以建立自訂使用者介面（進階功能；需透過 discord 工具建構元件承載資料），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord 元件容器使用的強調色（十六進位）。各帳號設定：`channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` 控制已傳送的 Discord 元件回呼維持註冊的時間（預設 `1800000`，最長 `86400000`）。各帳號設定：`channels.discord.accounts.<id>.agentComponents.ttlMs`。
- 使用 components v2 時，會忽略 `embeds`。
- 預設會抑制純 URL 預覽。若訊息動作中的單一外連連結應展開，請設定 `suppressEmbeds: false`。

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

Discord 有兩種不同的語音介面：即時**語音頻道**（持續對話）及**語音訊息附件**（波形預覽格式）。閘道兩者皆支援。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 中啟用 Message Content Intent。
2. 使用角色／使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 及 `applications.commands` 範圍邀請機器人。
4. 在目標語音頻道中授予 Connect、Speak、Send Messages 及 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號的預設代理程式，並遵循與其他 Discord 命令相同的允許清單及群組政策規則。

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

注意事項：

- 對僅含文字的設定而言，Discord 語音功能為選用；設定 `channels.discord.voice.enabled=true`（或保留現有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段，以及 `GuildVoiceStates` 閘道意圖。`channels.discord.intents.voiceStates` 可明確覆寫意圖訂閱；若不設定，則會依循實際的語音啟用狀態。
- `voice.mode` 控制對話路徑。預設為 `agent-proxy`：即時語音前端會處理輪次時機、中斷與播放，透過 `openclaw_agent_consult` 將實質工作委派給路由的 OpenClaw 代理程式，並將結果視為該說話者輸入的 Discord 提示詞。`stt-tts` 會保留較舊的批次 STT 加 TTS 流程。`bidi` 允許即時模型直接對話，同時公開 `openclaw_agent_consult` 供 OpenClaw 大腦使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話接收語音輪次。若不設定，則使用語音頻道本身的工作階段；或設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道作為現有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風／喇叭延伸。
- `voice.model` 會覆寫用於 Discord 語音回應與即時諮詢的 OpenClaw 代理程式大腦。若不設定，則繼承路由代理程式的模型。此設定與 `voice.realtime.model` 分開。
- `voice.followUsers` 允許機器人跟隨選定的使用者加入、移動及離開 Discord 語音。請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音；這會保留說話者與目標工作階段的一般擁有者／工具授權，但會隱藏代理程式的 `tts` 工具，因為播放由 Discord 語音負責。依預設，`agent-proxy` 會為擁有者說話者提供與擁有者同等的完整工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在提供實質回答前先諮詢 OpenClaw 代理程式（`voice.realtime.consultPolicy: "always"`）。在此預設的 `always` 模式中，即時層不會在諮詢答案之前自動朗讀填充內容；它會擷取並轉錄語音，接著朗讀路由的 OpenClaw 答案。如果 Discord 仍在播放第一個答案時，有多個強制諮詢答案完成，後續的精確語音答案會排入佇列，等待播放閒置，而不會在句子中途取代語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 用於設定即時音訊工作階段。若要搭配 OpenAI Realtime 2.1 與 Codex 大腦，請使用 `voice.realtime.model: "gpt-realtime-2.1"` 和 `voice.model: "openai/gpt-5.6-sol"`。
- 依預設，即時語音模式會在即時提供者指示中納入小型的 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 設定檔，讓快速直接輪次維持與路由 OpenClaw 代理程式相同的身分、使用者背景依據及角色設定。設定 `voice.realtime.bootstrapContextFiles` 為其中一部分即可自訂，或設定 `[]` 將其停用。僅支援這些設定檔；`AGENTS.md` 仍會保留在一般代理程式內容中。注入的設定檔內容不會取代 `openclaw_agent_consult` 在工作區作業、目前事實、記憶查詢或工具支援動作中的用途。
- 在 OpenAI `agent-proxy` 即時模式中，喚醒名稱閘控預設會依房間情況調整：只有一位真人時可自然交談而無須使用喚醒名稱；有兩位以上真人時，則必須以喚醒名稱開始或結束一個輪次。其他機器人不計入人數。設定 `voice.realtime.requireWakeName: true` 可一律要求喚醒名稱，設定 `false` 則一律不要求。設定的喚醒名稱必須為一或兩個單字。若未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由代理程式的 `name` 加上 `OpenClaw`，並以代理程式 ID 加上 `OpenClaw` 作為備援。作用中的喚醒名稱閘控會停用即時提供者的自動回應，將接受的輪次透過 OpenClaw 代理程式諮詢路徑路由，並在最終轉錄送達前，從部分轉錄辨識出開頭的喚醒名稱時提供簡短的語音確認。此原則會隨即時加入與離開而調整，無須重新連線語音。
- OpenAI 即時提供者接受目前的 Realtime 2 事件名稱，以及與舊版 Codex 相容的輸出音訊和轉錄事件別名，因此相容提供者的快照即使發生偏移，也不會遺漏助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否中斷進行中的即時播放。若未設定，則依循即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話中斷截斷音訊前，助理播放所需的最短持續時間。預設值：`250`。在低回音房間中設定 `0` 可立即中斷；若為回音嚴重的喇叭配置，則提高此值。
- `voice.tts` 僅針對 `stt-tts` 語音播放覆寫 `tts`；即時模式則改用 `voice.realtime.speakerVoice`。若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇文字轉語音的語音。`cedar` 是目前 OpenAI TTS 模型中聽起來陽剛且效果良好的選擇。
- 每個頻道的 Discord `systemPrompt` 覆寫也會套用至該語音頻道的語音轉錄輪次。
- 當 OpenClaw 加入語音頻道時，路由代理程式工作階段會收到含有目前參與者名單的無聲系統事件。之後參與者的加入與離開會更新該工作階段，而不會觸發未經要求的語音回覆；Discord 顯示名稱會被視為不受信任的標籤。已授權的語音輪次也會收到最新的名單快照。
- 語音轉錄輪次與 `/vc` 命令會使用 `commands.ownerAllowFrom` 中的 Discord 項目判定擁有者狀態。未設定 Discord 命令擁有者時，所選 Discord 帳號的 `allowFrom`（或舊版 `dm.allowFrom`）仍可授權語音存取，但不會授予擁有者狀態。代理程式工具可見性會依循路由工作階段所設定的工具原則。
- 若 `voice.autoJoin` 對同一個伺服器含有多個項目，OpenClaw 會加入該伺服器最後設定的頻道。
- `voice.allowedChannels` 是選用的常駐允許清單。若不設定，則允許 `/vc join` 進入任何已授權的 Discord 語音頻道。設定後，`/vc join`、啟動時自動加入，以及機器人的語音狀態移動，都會限制於所列的 `{ guildId, channelId }` 項目。將其設為空陣列可拒絕所有 Discord 語音加入。如果 Discord 將機器人移至允許清單以外，OpenClaw 會離開該頻道，並在有可用目標時重新加入設定的自動加入目標。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會直接傳遞至 `@discordjs/voice` 加入選項；上游預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用內附的 `libopus-wasm` 轉碼器接收 Discord 語音及播放即時原始 PCM。它隨附固定版本的 libopus WebAssembly 組建，不需要原生 opus 附加元件。
- `voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試時，初始等待 `@discordjs/voice` Ready 的時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 等候已中斷連線的語音工作階段開始重新連線，之後才將其銷毀的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會僅因其他使用者開始說話而停止。為避免回授迴路，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放結束後說話以開始下一個輪次。即時模式會將說話者開始事件作為插話中斷訊號轉送給即時提供者。
- 在即時模式中，喇叭回音進入開啟的麥克風後，可能看似插話中斷並中斷播放。若 Discord 房間回音嚴重，請設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，避免 OpenAI 因輸入音訊而自動中斷。若仍希望 Discord 說話者開始事件中斷進行中的播放，請新增 `voice.realtime.bargeIn: true`。OpenAI 即時橋接器會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音／雜訊而忽略，並將其記錄為已略過，而不會清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 Discord 回報說話者已停止後，OpenClaw 在完成該音訊片段並送交 STT 前的等待時間。預設值：`2000`；如果 Discord 將一般停頓切割成零碎的部分轉錄，請提高此值。
- 選擇 ElevenLabs 作為 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者的回應串流開始播放。不支援串流的提供者會退回合成暫存檔路徑。
- OpenClaw 會監控接收解密失敗，並在短時間內重複失敗後，透過離開並重新加入語音頻道自動復原。
- 如果更新後，接收記錄重複顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告和記錄。內附的 `@discordjs/voice` 版本線包含 discord.js PR #11449 的上游填補修正，該修正已結束 discord.js issue #11419。
- OpenClaw 完成擷取的說話者片段時，預期會出現 `The operation was aborted` 接收事件；這些是詳細診斷資訊，而非警告。
- 詳細的 Discord 語音記錄會為每個接受的說話者片段納入有長度限制的單行 STT 轉錄預覽，因此偵錯時可同時看到使用者端與代理程式回覆端，而不會傾印無長度限制的轉錄文字。
- 在 `agent-proxy` 模式中，強制諮詢備援會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字、結尾為 "and" 等連接詞的文字，以及 "be right back" 或 "bye" 等明顯無須採取動作的結束語。當此機制避免過時的排隊答案時，記錄會顯示 `forced agent consult skipped reason=...`。

### 在語音中跟隨使用者

若希望 Discord 語音機器人跟隨一或多位已知的 Discord 使用者，而不是在啟動時加入固定頻道或等待 `/vc join`，請使用 `voice.followUsers`。

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

- `followUsers` 接受原始 Discord 使用者 ID 與 `discord:<id>` 值。OpenClaw 會先正規化這兩種形式，再比對語音狀態事件。
- 設定 `followUsers` 時，`followUsersEnabled` 預設為 `true`。將其設為 `false` 可保留已儲存的清單，但停止自動跟隨語音。
- `followUsers` 僅控制語音駐留。它不會授予發言者存取權或擁有者權限；請分別設定 `commands.ownerAllowFrom`，以及伺服器或頻道的使用者與角色。
- 當被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。使用者移動時，OpenClaw 會隨之移動。正在跟隨的使用者中斷連線時，OpenClaw 會離開。
- 如果同一伺服器中有多位被跟隨的使用者，且正在跟隨的使用者離開，OpenClaw 會先移至另一位受追蹤之被跟隨使用者所在的頻道，再離開伺服器。如果多位被跟隨的使用者同時移動，則以最近觀察到的語音狀態事件為準。
- `allowedChannels` 仍然適用。系統會忽略位於不允許頻道中的被跟隨使用者，而由跟隨功能擁有的工作階段會移至另一位被跟隨使用者，或直接離開。
- OpenClaw 會在啟動時及依有限間隔協調遺漏的語音狀態事件。協調程序會抽樣已設定的伺服器，並限制每次執行的 REST 查詢次數，因此非常大的 `followUsers` 清單可能需要超過一個間隔才能收斂。
- 如果 Discord 或管理員在機器人跟隨使用者期間移動機器人，OpenClaw 會重建語音工作階段；目的地獲允許時，會保留跟隨擁有權。如果機器人被移至 `allowedChannels` 之外，OpenClaw 會離開，並在已設定目標存在時重新加入該目標。
- DAVE 接收復原可能會在重複解密失敗後離開並重新加入同一頻道。由跟隨功能擁有的工作階段在此復原路徑中會保留其跟隨擁有權，因此稍後被跟隨使用者中斷連線時，仍會離開頻道。

選擇加入模式：

- 若是個人或操作員設定，且機器人應在你使用語音時自動加入語音，請使用 `followUsers`。
- 若是即使沒有受追蹤使用者使用語音也應保持在線的固定房間機器人，請使用 `autoJoin`。
- 若是單次加入，或自動出現在語音中可能令人意外的房間，請使用 `/vc join`。

Discord 語音轉碼器：

- 語音接收記錄會顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會使用同一個隨附的 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，再將封包交給 `@discordjs/voice`。
- 檔案與供應商串流播放會使用 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，接著使用 `libopus-wasm` 產生傳送至 Discord 的 Opus 封包串流。

STT 加 TTS 流水線：

- Discord PCM 擷取內容會轉換為暫存 WAV 檔案。
- `tools.media.audio` 負責處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄文字會透過 Discord 輸入與路由傳送，同時回應 LLM 會依照語音輸出政策執行；該政策會隱藏代理程式的 `tts` 工具並要求傳回文字，因為最終的 TTS 播放由 Discord 語音負責。
- 設定 `voice.model` 時，它只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會合併並覆寫 `tts`；支援串流的供應商會直接將內容提供給播放器，否則會在已加入的頻道中播放產生的音訊檔案。

預設代理程式 Proxy 語音頻道工作階段範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得各自經路由的 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段對話。即時模型只是語音前端；實質要求會交給已設定的 OpenClaw 代理程式。如果即時模型在未呼叫諮詢工具的情況下產生最終轉錄文字，OpenClaw 會強制執行諮詢作為備援，讓預設行為仍如同與代理程式對話。

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
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

將語音作為現有 Discord 頻道工作階段的延伸：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式中，機器人會加入已設定的語音頻道，但 OpenClaw 代理程式回合會使用目標頻道一般經路由的工作階段與代理程式。即時語音工作階段會將傳回的結果說回語音頻道。監督代理程式仍可依其工具政策使用一般訊息工具，包括在適當時傳送另一則 Discord 訊息。

委派的 OpenClaw 執行處於作用中時，新的 Discord 語音轉錄文字會先視為即時執行控制，再決定是否開始另一個代理程式回合。系統會將 “status”、 “cancel that”、 “use the smaller fix” 或 “when you're done also check tests” 等語句分類為作用中工作階段的狀態、取消、引導或後續輸入。狀態、取消、已接受的引導及後續結果都會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理要求。

實用的目標形式：

- `target: "channel:123456789012345678"` 會透過 Discord 文字頻道工作階段路由。
- `target: "123456789012345678"` 會視為頻道目標。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 會透過該私人訊息工作階段路由。

回音嚴重時的 OpenAI Realtime 範例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

當模型透過開啟的麥克風聽到自身的 Discord 播放內容，但你仍希望能用說話打斷它時，請使用此設定。OpenClaw 會阻止 OpenAI 因原始輸入音訊而自動中斷，同時 `bargeIn: true` 讓 Discord 發言者開始事件與已在作用中的發言者音訊，能在下一個擷取回合送達 OpenAI 前取消作用中的即時回應。若非常早期的插話訊號之 `audioEndMs` 低於 `minBargeInAudioEndMs`，系統會將其視為可能的回音／雜訊並忽略，避免模型在第一個播放影格就停止。

預期的語音記錄：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時處理開始時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 發言者音訊出現時：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` 和 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過時語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止／重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時諮詢時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 代理程式回答時：`discord voice: agent turn answer ...`
- 確切語音排入佇列時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時處理中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音／雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 播放閒置時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊遭截斷的問題，請將即時語音記錄視為時間軸來閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。從此時起，橋接器會開始計算助理輸出區塊、Discord PCM 位元組、供應商即時位元組及合成音訊持續時間。
2. `realtime speaker turn opened` 標示 Discord 發言者開始活動。如果播放已在作用中且已啟用 `bargeIn`，後面可能會接著出現 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標示該發言者回合收到的第一個實際音訊影格。此處出現 `outputActive=true` 或非零的 `outputAudioMs`，表示助理播放仍在作用中時，麥克風正在傳送輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放處於作用中時偵測到即時發言者音訊。這有助於區分真正的中斷與沒有實用音訊的 Discord 發言者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 已要求即時供應商取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，讓你查看中斷前實際已播放多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放的重設點。原因會指出停止播放的來源：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 會摘要擷取到的輸入回合。`chunks=0` 或 `hasAudio=false` 表示發言者回合已開始，但沒有可用音訊送達即時橋接器。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：即時供應商在該記錄行之前產生的助理音訊持續時間。
- `audioMs`：OpenClaw 在播放停止前計算的助理音訊持續時間。
- `elapsedMs`：開啟與關閉播放串流或發言者回合之間的實際經過時間。
- `discordBytes`：傳送至 Discord 語音或從中接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送至即時供應商或從中接收的供應商格式 PCM 位元組。
- `playbackChunks`：針對作用中回應轉送至 Discord 的助理音訊區塊。
- `sinceLastAudioMs`：最後一個擷取到的發言者音訊影格與發言者回合關閉之間的間隔。

常見模式：

- 若立即中斷，且 `source=active-speaker-audio`、較小的 `outputAudioMs`，以及同一位使用者通常就在附近，通常表示喇叭回音進入了麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低喇叭音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false`，表示 Discord 回報喇叭開始播放，但沒有音訊傳到 OpenClaw。這可能是暫時性的 Discord 語音事件、雜訊閘門行為，或用戶端短暫啟用麥克風。
- 若出現 `audio playback stopped reason=stream-close`，但附近沒有插話或 `provider-clear-audio`，表示本機 Discord 播放串流意外結束。請檢查前面的供應商與 Discord 播放器記錄。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊播放期間刻意捨棄輸入。若要讓語音中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或供應商的 VAD 回報了語音，但 OpenClaw 沒有可中斷的作用中播放。這不應中斷音訊。

認證資訊會依元件分別解析：`voice.model` 的 LLM 路由驗證、`tools.media.audio` 的 STT 驗證、`tts`/`voice.tts` 的 TTS 驗證，以及 `voice.realtime.providers` 或供應商一般驗證設定的即時供應商驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，且需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要閘道主機上的 `ffmpeg` 和 `ffprobe` 來檢查及轉換。

- 提供**本機檔案路徑**（不接受 URL）。
- 省略文字內容（Discord 不接受在同一個承載資料中同時包含文字與語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換成 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 疑難排解

<AccordionGroup>
  <Accordion title="使用了不允許的 intents，或機器人看不到伺服器訊息">

    - 啟用 Message Content Intent
    - 依賴使用者／成員解析時，啟用 Server Members Intent
    - 變更 intents 後重新啟動閘道

  </Accordion>

  <Accordion title="伺服器訊息意外遭到封鎖">

    - 確認 `groupPolicy`
    - 確認 `channels.discord.guilds` 下的伺服器允許清單
    - 如果存在伺服器 `channels` 對應表，則只允許列出的頻道
    - 確認 `requireMention` 行為與提及模式

    實用的檢查方式：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="不要求提及但仍遭封鎖">
    常見原因：

    - `groupPolicy="allowlist"` 沒有相符的伺服器／頻道允許清單
    - `requireMention` 設定在錯誤的位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者遭伺服器／頻道的 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="Discord 回合長時間執行或出現重複回覆">

    常見記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 不會對佇列中的代理程式回合套用頻道所擁有的逾時。訊息監聽器會立即交接，而排入佇列的 Discord 執行會維持各工作階段的順序，直到工作階段／工具／執行階段生命週期完成或中止工作。

  </Accordion>

  <Accordion title="閘道中繼資料查詢逾時警告">
    OpenClaw 會在連線前擷取 Discord 的 `/gateway/bot` 中繼資料。暫時性失敗會改用 Discord 的預設閘道 URL，且記錄訊息會受到速率限制。

    中繼資料逾時預設為 30 秒。`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS` 可針對特殊的主機環境覆寫此值。

  </Accordion>

  <Accordion title="閘道 READY 逾時重新啟動">
    OpenClaw 會在啟動期間及執行階段重新連線後，等待 Discord 閘道的 `READY` 事件。採用交錯啟動的多帳號設定，可能需要比預設值更長的啟動 READY 等待時間。

    啟動會等待 15 秒，執行階段重新連線則等待 30 秒。`OPENCLAW_DISCORD_READY_TIMEOUT_MS` 和 `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS` 仍可用於特殊的主機環境。

  </Accordion>

  <Accordion title="權限稽核不一致">
    `channels status --probe` 權限檢查僅適用於數字頻道 ID。

    若使用代稱鍵，執行階段比對仍可運作，但探測無法完整確認權限。

  </Accordion>

  <Accordion title="私訊與配對問題">

    - 私訊已停用：`channels.discord.dm.enabled=false`
    - 私訊政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人的迴圈">
    預設會忽略機器人傳送的訊息。

    若設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，僅接受提及該機器人的機器人訊息。

    OpenClaw 也隨附共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。只要 `allowBots` 允許機器人傳送的訊息進入分派流程，Discord 就會將傳入事件對應為 `(account, channel, bot pair)` 事實，而通用配對防護會在該配對超過設定的事件預算後將其抑制。此防護可防止失控的雙機器人迴圈；過去這類迴圈必須依靠 Discord 速率限制才能停止。它不會影響單一機器人部署，也不會影響未超過預算的一次性機器人回覆。

    預設設定（設定 `allowBots` 時生效）：

    - `maxEventsPerWindow: 20` -- 機器人配對可在滑動時間窗內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動時間窗長度
    - `cooldownSeconds: 60` -- 一旦觸發預算限制，任一方向後續的所有機器人對機器人訊息都會遭捨棄一分鐘

    請先在 `channels.defaults.botLoopProtection` 下設定一次共用預設值，然後在合法工作流程需要更多餘裕時覆寫 Discord 設定。優先順序如下：

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
      // 選用的 Discord 全域覆寫。帳號區塊會覆寫個別
      // 欄位，並從此處繼承省略的欄位。
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha 只會在其他機器人提及它時監聽。
          allowBots: "mentions",
        },
        bravo: {
          // Bravo 會監聽所有由機器人傳送的 Discord 訊息。
          allowBots: true,
          mentionAliases: {
            // 讓 Bravo 使用設定的使用者 ID 寫入對 Alpha 的 Discord 提及。
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // 每分鐘最多允許五則訊息，之後抑制該配對。
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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 而中斷">

    - 讓 OpenClaw 保持最新（`openclaw update`），以確保包含 Discord 語音接收復原邏輯
    - 確認 `channels.discord.voice.daveEncryption=true`（預設值）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，僅在需要時調整
    - 監看記錄中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 若自動重新加入後仍持續失敗，請收集記錄，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷程進行比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考資料：[設定參考資料 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="重要的 Discord 欄位">

- 啟動／驗證：`enabled`、`token`、`applicationId`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dmPolicy`、`allowFrom`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`（全域）、`configWrites`、`slashCommand.ephemeral`
- 閘道：`proxy`
- 回覆／歷程：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`（預設為 `2000`）、`maxLinesPerMessage`（預設為 `17`）
- 串流：`streaming.mode`、`streaming.chunkMode`、`streaming.preview.*`、`streaming.progress.*`、`streaming.block.*`（舊版扁平的 `streamMode`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`、`chunkMode` 鍵會由 `openclaw doctor --fix` 移轉至 `streaming.*`）
- 媒體：`mediaMaxMb`（限制傳出的 Discord 上傳，預設為 `100`）
- 動作：`actions.*`
- 上線狀態：`activity`、`status`、`activityType`、`activityUrl`、`autoPresence.*`
- 使用者介面：`ui.components.accentColor`
- 功能：`threadBindings`、頂層的 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`activities`、`heartbeat`、`responsePrefix`

</Accordion>

### Discord Activities

設定 `channels.discord.activities`，讓代理程式可以發布在 Discord 內開啟的獨立 HTML 小工具。此區塊須選擇啟用；若不存在，OpenClaw 不會註冊任何 Activity 路由、工具或互動處理常式。如需 Developer Portal、通道、安全性及疑難排解設定，請參閱 [Discord Activities](/zh-TW/channels/discord-activities)。

- `activities.clientSecret`：Discord 應用程式的 OAuth2 用戶端密鑰；若未設定則改用 `DISCORD_CLIENT_SECRET`
- `activities.applicationId`：選用的 Activity 應用程式 ID；預設使用閘道啟動時取得的機器人應用程式 ID

## 安全與操作

- 將機器人權杖視為機密資訊（在受監督的環境中，建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 若命令部署／狀態已過時，請重新啟動閘道，並使用 `openclaw channels status --probe` 重新檢查。

## 相關內容

<CardGroup cols={2}>
  <Card title="Discord Activities" icon="window" href="/zh-TW/channels/discord-activities">
    在 Discord 內啟動互動式 HTML 小工具。
  </Card>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者與閘道配對。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化措施。
  </Card>
  <Card title="多代理程式路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將伺服器與頻道對應至代理程式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
