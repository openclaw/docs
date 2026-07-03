---
read_when:
    - 處理 Discord 頻道功能
summary: Discord 機器人支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:41:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

可透過官方 Discord 閘道用於私訊與公會頻道。

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

你需要建立一個包含機器人的新應用程式、將機器人加入你的伺服器，並將它配對到 OpenClaw。我們建議將你的機器人加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    前往 [Discord 開發者入口網站](https://discord.com/developers/applications)，然後按一下 **New Application**。將它命名為類似「OpenClaw」的名稱。

    按一下側邊欄的 **Bot**。將 **Username** 設為你對 OpenClaw 代理程式的稱呼。

  </Step>

  <Step title="啟用特權意圖">
    仍在 **Bot** 頁面，向下捲動到 **Privileged Gateway Intents** 並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱轉 ID 比對需要）
    - **Presence Intent**（選用；只有在需要狀態更新時才需要）

  </Step>

  <Step title="複製你的機器人權杖">
    在 **Bot** 頁面捲回上方，然後按一下 **Reset Token**。

    <Note>
    雖然名稱如此，這會產生你的第一個權杖，而不是「重設」任何東西。
    </Note>

    複製權杖並儲存在某處。這是你的 **Bot Token**，稍後會需要用到。

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    按一下側邊欄的 **OAuth2**。你將產生一個具備正確權限的邀請 URL，用來將機器人加入你的伺服器。

    向下捲動到 **OAuth2 URL Generator** 並啟用：

    - `bot`
    - `applications.commands`

    下方會出現 **Bot Permissions** 區段。至少啟用：

    **一般權限**
      - 檢視頻道

    **文字權限**
      - 傳送訊息
      - 讀取訊息歷史
      - 嵌入連結
      - 附加檔案
      - 新增反應（選用）

    這是一般文字頻道的基準設定。如果你計畫在 Discord 討論串中發文，包括會建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後按一下 **Continue** 以連線。現在你應該會在 Discord 伺服器中看到你的機器人。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord 應用程式，你需要啟用開發者模式，才能複製內部 ID。

    1. 按一下 **User Settings**（頭像旁的齒輪圖示）→ 捲動到側邊欄中的 **Developer** → 開啟 **Developer Mode**

        *（注意：在 Discord 行動應用程式中，開發者模式位於 **App Settings** → **Advanced**）*

    2. 右鍵按一下側邊欄中的 **伺服器圖示** → **Copy Server ID**
    3. 右鍵按一下你的 **自己的頭像** → **Copy User ID**

    將你的 **Server ID** 與 **User ID** 與 Bot Token 一起儲存；下一步你會把這三者都傳送給 OpenClaw。

  </Step>

  <Step title="允許來自伺服器成員的私訊">
    若要讓配對運作，Discord 需要允許你的機器人傳私訊給你。右鍵按一下你的 **伺服器圖示** → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括機器人）傳送私訊給你。如果你想使用 OpenClaw 的 Discord 私訊，請保持啟用。如果你只打算使用公會頻道，可以在配對後停用私訊。

  </Step>

  <Step title="安全設定你的機器人權杖（不要在聊天中傳送）">
    你的 Discord 機器人權杖是祕密資訊（像密碼一樣）。在傳訊息給你的代理程式之前，請在執行 OpenClaw 的機器上設定它。

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

    如果 OpenClaw 已經作為背景服務執行，請透過 OpenClaw Mac 應用程式重新啟動，或停止並重新啟動 `openclaw gateway run` 程序。
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將該變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後能解析 env SecretRef。
    如果你的主機遭 Discord 的啟動應用程式查詢封鎖或速率限制，請從開發者入口網站設定 Discord 應用程式／用戶端 ID，讓啟動可以跳過該 REST 呼叫。預設帳戶請使用 `channels.discord.applicationId`；執行多個 Discord 機器人時，請使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的代理程式">
        在任何現有頻道（例如 Telegram）與你的 OpenClaw 代理程式聊天並告訴它。如果 Discord 是你的第一個頻道，請改用命令列介面／設定分頁。

        > 「我已經在設定中設定好我的 Discord 機器人權杖。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
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

        預設帳戶的 env 後援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於指令碼化或遠端設定，請用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不加 `--dry-run` 重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec 提供者的 SecretRef 值。請參閱[祕密資訊管理](/zh-TW/gateway/secrets)。

        對於多個 Discord 機器人，請將每個機器人權杖與應用程式 ID 放在其帳戶底下。頂層 `channels.discord.applicationId` 會由帳戶繼承，因此只有在每個帳戶都應使用相同應用程式 ID 時才在那裡設定。

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

  <Step title="核准第一個私訊配對">
    等到閘道執行後，再在 Discord 中私訊你的機器人。它會回覆一個配對碼。

    <Tabs>
      <Tab title="詢問你的代理程式">
        將配對碼傳送給你現有頻道上的代理程式：

        > 「核准這個 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="命令列介面">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後過期。

    你現在應該可以透過 Discord 私訊與你的代理程式聊天。

  </Step>
</Steps>

<Note>
權杖解析具有帳戶感知能力。設定權杖值優先於 env 後援。`DISCORD_BOT_TOKEN` 只用於預設帳戶。
如果兩個已啟用的 Discord 帳戶解析到相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監視器。來自設定的權杖優先於預設 env 後援；否則第一個已啟用的帳戶會勝出，重複帳戶會被回報為已停用。
對於進階輸出呼叫（訊息工具／頻道動作），明確的逐次呼叫 `token` 會用於該呼叫。這適用於傳送與讀取／探測樣式的動作（例如 read/search/fetch/thread/pins/permissions）。帳戶政策／重試設定仍來自作用中執行階段快照中選取的帳戶。
</Note>

## 建議：設定公會工作區

私訊運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的代理程式工作階段與自己的脈絡。這建議用於只有你和你的機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入公會允許清單">
    這會讓你的代理程式能在伺服器上的任何頻道中回應，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > 「將我的 Discord Server ID `<server_id>` 加入公會允許清單」
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

  <Step title="允許不需 @mention 的回應">
    預設情況下，你的代理程式只會在公會頻道中被 @mentioned 時回應。對私人伺服器而言，你可能會希望它回應每則訊息。

    在公會頻道中，一般回覆預設會自動發布。對於共享且常駐的聊天室，選用 `messages.groupChat.visibleReplies: "message_tool"`，讓代理程式可以潛伏，並只在它判定頻道回覆有用時才發布。這最適合最新一代、工具可靠的模型，例如 GPT 5.5。環境聊天室事件會保持安靜，除非工具傳送。完整潛伏模式設定請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入且記錄顯示權杖使用量，但沒有發布訊息，請檢查該回合是否設定為環境聊天室事件，或是否選用訊息工具可見回覆。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > 「允許我的代理程式在此伺服器上回應，而不必被 @mentioned」
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

        若要要求訊息工具傳送可見的群組／頻道回覆，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃公會頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會在私訊工作階段中載入。公會頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的代理程式">
        > 「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期脈絡，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要每個頻道中的共享脈絡，請將穩定指示放入 `AGENTS.md` 或 `USER.md`（它們會注入每個工作階段）。將長期筆記保存在 `MEMORY.md`，並視需要使用記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的代理程式可以看到頻道名稱，而且每個頻道都有自己的隔離工作階段，所以你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- 閘道擁有 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的
  上下文加入模型提示，而不是作為使用者可見的回覆前綴。如果模型複製該封套
  回來，OpenClaw 會從輸出回覆和
  未來重播上下文中剝除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天共用代理主工作階段（`agent:main:main`）。
- 伺服器頻道會使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組 DM 預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍會攜帶 `CommandTargetSessionKey` 到路由的對話工作階段。
- 傳送到 Discord 的純文字排程/心跳偵測公告會使用最終
  助理可見答案一次。當代理發出多個可傳遞承載時，媒體和結構化元件承載仍會
  維持多訊息。

## 論壇頻道

Discord 論壇和媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

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

論壇父層不接受 Discord 元件。如果需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援代理訊息使用 Discord components v2 容器。使用訊息工具並提供 `components` 承載。互動結果會以一般傳入訊息路由回代理，並遵循既有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取和表單在到期前使用多次。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不相符的使用者會收到暫時性拒絕訊息。

元件回呼預設會在 30 分鐘後到期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設 Discord 帳號的回呼登錄生命週期，或設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 以覆寫多帳號設定中的單一帳號。值的單位是毫秒，必須是正整數，且上限為 `86400000`（24 小時）。較長的 TTL 適合需要按鈕保持可用的審查或核准工作流程，但也會延長舊 Discord 訊息仍可觸發動作的時間窗口。請偏好使用符合工作流程的最短 TTL；若過期回呼會令人意外，請保留預設值。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含提供者、模型和相容執行階段下拉選單，以及提交步驟。`/models add` 已棄用，現在會傳回棄用訊息，而不是從聊天註冊模型。選擇器回覆是暫時性的，且只有呼叫的使用者可以使用。Discord 選取選單限制為 25 個選項，因此當你希望選擇器只針對所選提供者（例如 `openai` 或 `vllm`）顯示動態探索的模型時，請將 `provider/*` 項目加入 `agents.defaults.models`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應與附件參照相符時，使用 `filename` 覆寫上傳名稱

模態表單：

- 加入 `components.modal`，最多可含 5 個欄位
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
    `channels.discord.dmPolicy` 控制 DM 存取。`channels.discord.allowFrom` 是正式 DM 允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用到 `default` 帳號。
    - 對單一帳號，`allowFrom` 的優先順序高於舊版 `dm.allowFrom`。
    - 具名帳號在自己的 `allowFrom` 和舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍會為了相容性讀取。`openclaw doctor --fix` 會在不變更存取權的前提下，盡可能將它們遷移到 `dmPolicy` 和 `allowFrom`。

    傳遞的 DM 目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，純數字 ID 通常會解析為頻道 ID，但為了相容性，帳號有效 DM `allowFrom` 中列出的 ID 會被視為使用者 DM 目標。

  </Tab>

  <Tab title="Access groups">
    Discord DM 和文字命令授權可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。對於成員以各頻道一般 `allowFrom` 語法表示的靜態群組，使用 `type: "message.senders"`；當 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格時，使用 `type: "discord.channelAudience"`。共用存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 會將成員資格建模為：DM 傳送者是已設定伺服器的成員，且在套用角色和頻道覆寫後，目前對已設定頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何可以看到 `#maintainers` 的人私訊機器人，同時對其他所有人關閉 DM。

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

    查詢會採取失敗關閉。如果 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，DM 傳送者會被視為未授權。

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
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）和 `roles`（僅限角色 ID）；如果任一項已設定，當傳送者符合 `users` 或 `roles` 時即允許
    - 直接名稱/標籤比對預設停用；只有在緊急相容模式下才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 較安全；使用名稱/標籤項目時，`openclaw security audit` 會發出警告
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

    如果你只設定 `DISCORD_BOT_TOKEN`，且沒有建立 `channels.discord` 區塊，即使 `channels.defaults.groupPolicy` 是 `open`，執行階段備援也會是 `groupPolicy="allowlist"`（並在記錄中顯示警告）。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設以提及作為門檻。

    提及偵測包含：

    - 明確提及機器人
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，備援為 `messages.groupChat.mentionPatterns`）
    - 在支援案例中的隱含回覆機器人行為

    撰寫輸出 Discord 訊息時，請使用正式提及語法：使用者用 `<@USER_ID>`，頻道用 `<#CHANNEL_ID>`，角色用 `<@&ROLE_ID>`。不要使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及其他使用者/角色但未提及機器人的訊息（不含 @everyone/@here）。

    群組 DM：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可選擇透過 `dm.groupChannels` 設定允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 伺服器成員路由到不同 agent。以角色為基礎的繫結只接受角色 ID，且會在 peer 或 parent-peer 繫結之後、guild-only 繫結之前評估。如果某個繫結也設定其他 match 欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須相符。

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

- `commands.native` 預設為 `"auto"`，並會對 Discord 啟用。
- 各頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前註冊的命令可能仍會在 Discord 中可見，直到你從 Discord app 移除它們。
- 原生命令驗證使用與一般訊息處理相同的 Discord 允許清單/政策。
- 未獲授權的使用者可能仍會在 Discord UI 看到命令；執行時仍會強制套用 OpenClaw 驗證，並回傳「未獲授權」。

請參閱[斜線命令](/zh-TW/tools/slash-commands)了解命令目錄與行為。

預設斜線命令設定：

- `ephemeral: true`

## 功能詳細資訊

<AccordionGroup>
  <Accordion title="回覆標籤與原生回覆">
    Discord 支援 agent 輸出中的回覆標籤：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）
    - `first`
    - `all`
    - `batched`

    注意：`off` 會停用隱含回覆串接。明確的 `[[reply_to_*]]` 標籤仍會受到遵守。
    `first` 一律會將隱含原生回覆參照附加到該回合的第一則送出 Discord 訊息。
    `batched` 只有在傳入事件是多則訊息的去抖動批次時，才會附加 Discord 的隱含原生回覆參照。當你主要想讓原生回覆用於模糊的爆量聊天，而不是每個單則訊息回合時，這很有用。

    訊息 ID 會顯示在脈絡/歷史中，讓 agent 可以指定特定訊息。

  </Accordion>

  <Accordion title="連結預覽">
    Discord 預設會為 URL 產生豐富連結嵌入。OpenClaw 預設會抑制送出 Discord 訊息上的這些產生嵌入，因此 agent 傳送的 URL 會維持為純連結，除非你選擇啟用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 以覆寫單一帳號。Agent 訊息工具傳送也可以為單一訊息傳入 `suppressEmbeds: false`。明確的 Discord `embeds` 酬載不會受到預設連結預覽設定抑制。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送暫時訊息並在文字抵達時編輯該訊息，來串流草稿回覆。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（預設）。`progress` 會保留一個可編輯的狀態草稿，並以工具進度更新它直到最終送出；共用起始標籤是一行滾動文字，所以一旦出現足夠工作內容，它就會像其他內容一樣捲走。`streamMode` 是舊版執行階段別名。執行 `openclaw doctor --fix`，將持久化設定重寫為標準鍵。

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
    - 工具/進度列在可用時會呈現為精簡的 emoji + 標題 + 詳細資訊，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（預設 `false`）選擇在暫時進度草稿中加入助理評論/前言文字。評論會在顯示前清理、維持暫時性，且不會改變最終答案送出方式。
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

    預覽串流僅限文字；媒體回覆會回退到一般送出方式。當明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="歷史、脈絡與討論串行為">
    伺服器歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 會停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會路由為頻道工作階段，並繼承父頻道設定，除非被覆寫。
    - 討論串工作階段會繼承父頻道的工作階段層級 `/model` 選擇作為僅模型回退；討論串本機 `/model` 選擇仍優先，且父逐字記錄歷史不會複製，除非啟用逐字記錄繼承。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動討論串選擇從父逐字記錄播種。各帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用回退期間保留。

    頻道主題會以**不受信任**的脈絡注入。允許清單會管控誰可以觸發 agent，而不是完整的補充脈絡遮蔽邊界。

  </Accordion>

  <Accordion title="子 agent 的討論串綁定工作階段">
    Discord 可以將討論串繫結到工作階段目標，因此該討論串中的後續訊息會持續路由到相同工作階段（包含子 agent 工作階段）。

    命令：

    - `/focus <target>` 將目前/新討論串繫結到子 agent/工作階段目標
    - `/unfocus` 移除目前討論串繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新聚焦繫結的閒置自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新聚焦繫結的硬性最大存留時間

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
    - `spawnSessions` 控制透過 `sessions_spawn({ thread: true })` 與 ACP 討論串產生而自動建立/繫結討論串。預設：`true`。
    - `defaultSpawnContext` 控制討論串綁定產生項目的原生子 agent 脈絡。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某個帳號停用討論串繫結，`/focus` 與相關討論串繫結操作將無法使用。

    請參閱[子 agent](/zh-TW/tools/subagents)、[ACP Agent](/zh-TW/tools/acp-agents) 與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 頻道繫結">
    對於穩定的「always-on」ACP 工作區，請設定頂層型別化 ACP 繫結，目標為 Discord 對話。

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

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或討論串，並讓未來訊息維持在同一個 ACP 工作階段上。討論串訊息會繼承父頻道繫結。
    - 在已繫結的頻道或討論串中，`/new` 與 `/reset` 會就地重設同一個 ACP 工作階段。暫時討論串繫結在作用中時可以覆寫目標解析。
    - `spawnSessions` 會管控透過 `--thread auto|here` 建立/繫結子討論串。

    請參閱 [ACP Agent](/zh-TW/tools/acp-agents) 了解繫結行為詳細資訊。

  </Accordion>

  <Accordion title="反應通知">
    各伺服器反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換為系統事件，並附加到已路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="Ack 反應">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認 emoji。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent 身分 emoji 回退（`agents.list[].identity.emoji`，否則為 "👀"）

    注意：

    - Discord 接受 unicode emoji 或自訂 emoji 名稱。
    - 使用 `""` 可停用頻道或帳號的反應。

  </Accordion>

  <Accordion title="設定寫入">
    頻道啟動的設定寫入預設啟用。

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

  <Accordion title="閘道 proxy">
    透過 HTTP(S) proxy 使用 `channels.discord.proxy` 路由 Discord 閘道 WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）。
    Discord 閘道 WebSocket proxy 是明確設定的；WebSocket 連線不會繼承閘道程序中的環境 proxy 變數。當設定 `channels.discord.proxy` 時，啟動 REST 查詢會使用此 proxy。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    各帳號覆寫：

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

    - allowlists 可以使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID，並受時間範圍限制
    - 如果查詢失敗，代理訊息會被視為機器人訊息並捨棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="外送提及別名">
    當代理需要對已知 Discord 使用者進行確定性的外送提及時，請使用 `mentionAliases`。鍵是不含前置 `@` 的 handle；值是 Discord 使用者 ID。未知 handle、`@everyone`、`@here`，以及 Markdown 程式碼 span 內的提及都會保持不變。

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
    當你設定狀態或活動欄位，或啟用自動狀態顯示時，會套用狀態顯示更新。

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
    - 1：串流中（需要 `activityUrl`）
    - 2：正在聽
    - 3：正在觀看
    - 4：自訂（使用活動文字作為狀態狀態；表情符號為選用）
    - 5：競賽中

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

    自動狀態顯示會將執行階段可用性對應到 Discord 狀態：健康 => online，降級或未知 => idle，耗盡或不可用 => dnd。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中以按鈕處理核准，也可以選擇在來源頻道中張貼核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可以解析出一位核准者時，Discord 會自動啟用原生執行核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷執行核准者。若要明確停用 Discord 作為原生核准用戶端，請設定 `enabled: false`。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的僅限擁有者群組命令，OpenClaw 會私下傳送核准提示和最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord 私訊；如果不可用，則會回退到 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到暫時性拒絕。核准提示包含命令文字，因此只有在受信任頻道中才應啟用頻道投遞。如果無法從工作階段金鑰推導出頻道 ID，OpenClaw 會回退到私訊投遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 轉接器主要新增核准者私訊路由和頻道扇出。
    當這些按鈕存在時，它們是主要核准使用者體驗；只有在工具結果指出
    聊天核准不可用，或手動核准是唯一途徑時，OpenClaw
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用但原生卡片無法投遞到任何目標，
    OpenClaw 會以相同聊天傳送回退通知，並附上待處理核准中的確切 `/approve`
    命令。

    閘道驗證和核准解析遵循共用閘道用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後到期。

    請參閱[執行核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作包含傳訊、頻道管理、審核、狀態顯示與中繼資料動作。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 狀態顯示：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定排程活動封面圖片。

動作閘門位於 `channels.discord.actions.*` 之下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw 會將 Discord components v2 用於執行核准和跨情境標記。Discord 訊息動作也可以接受 `components` 以提供自訂 UI（進階；需要透過 discord 工具建構 component payload），而舊版 `embeds` 仍可使用，但不建議。

- `channels.discord.ui.components.accentColor` 設定 Discord component 容器使用的重點色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 針對每個帳號設定。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord component callback 的註冊保留時間（預設 `1800000`，最大 `86400000`）。使用 `channels.discord.accounts.<id>.agentComponents.ttlMs` 針對每個帳號設定。
- 當 components v2 存在時，`embeds` 會被忽略。
- 預設會抑制純 URL 預覽。當單一外送連結應展開時，請在訊息動作上設定 `suppressEmbeds: false`。

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

Discord 有兩種不同的語音介面：即時**語音頻道**（連續對話）和**語音訊息附件**（波形預覽格式）。閘道支援兩者。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 啟用 Message Content Intent。
2. 使用角色/使用者 allowlists 時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scopes 邀請機器人。
4. 在目標語音頻道授予 Connect、Speak、Send Messages 和 Read Message History。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號預設代理，並遵循與其他 Discord 命令相同的 allowlist 和群組政策規則。

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
- `voice.mode` 控制對話路徑。預設值是 `agent-proxy`：即時語音前端會處理回合時機、中斷和播放，透過 `openclaw_agent_consult` 將實質工作委派給路由到的 OpenClaw 代理，並把結果視為來自該說話者的已輸入 Discord 提示。`stt-tts` 保留較舊的批次 STT 加 TTS 流程。`bidi` 讓即時模型直接對話，同時公開 `openclaw_agent_consult` 給 OpenClaw 大腦使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話會接收語音回合。保持未設定可使用語音頻道自己的工作階段，或設為 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道作為既有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風/喇叭延伸。
- `voice.model` 會覆寫 Discord 語音回應和即時諮詢的 OpenClaw 代理大腦。保持未設定可繼承路由到的代理模型。它與 `voice.realtime.model` 分開。
- `voice.followUsers` 讓機器人可隨選取的使用者加入、移動和離開 Discord 語音。行為規則和範例請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音，這會保留說話者和目標工作階段的一般擁有者/工具授權，但隱藏代理的 `tts` 工具，因為 Discord 語音負責播放。預設情況下，`agent-proxy` 會為擁有者說話者提供完整的擁有者等效工具存取權以供諮詢使用（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在實質回答前先諮詢 OpenClaw 代理（`voice.realtime.consultPolicy: "always"`）。在該預設 `always` 模式中，即時層不會在諮詢答案前自動說出填充話語；它會擷取並轉錄語音，然後說出路由到的 OpenClaw 答案。如果多個強制諮詢答案在 Discord 仍在播放第一個答案時完成，後續的精確語音答案會排入佇列，直到播放閒置，而不是在句子中途取代語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 會設定即時音訊工作階段。若要搭配 Codex 大腦使用 OpenAI Realtime 2，請使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai/gpt-5.5"`。
- 即時語音模式預設會在即時提供者指令中包含小型 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 設定檔檔案，讓快速直接回合保有與路由到的 OpenClaw 代理相同的身分、使用者基礎和角色人格。將 `voice.realtime.bootstrapContextFiles` 設為子集可自訂此行為，或設為 `[]` 可停用。支援的即時啟動檔案僅限這些設定檔檔案；`AGENTS.md` 仍保留在一般代理情境中。注入的設定檔情境不會取代 `openclaw_agent_consult` 來處理工作區工作、目前事實、記憶查詢或工具支援的動作。
- 在 OpenAI `agent-proxy` 即時模式中，設定 `voice.realtime.requireWakeName: true` 可讓 Discord 即時語音保持靜音，直到逐字稿以喚醒名稱開始或結尾。設定的喚醒名稱必須是一或兩個字。如果未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由到的代理 `name` 加上 `OpenClaw`，並在無法使用時改用代理 ID 加上 `OpenClaw`。喚醒名稱閘控會停用即時提供者自動回應，將接受的回合路由到 OpenClaw 代理諮詢路徑，並在最終逐字稿抵達前，從部分轉錄中辨識出開頭喚醒名稱時給出簡短的口語確認。
- OpenAI 即時提供者接受目前的 Realtime 2 事件名稱，以及舊版 Codex 相容的輸出音訊和逐字稿事件別名，因此相容的提供者快照即使有差異，也不會丟失助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷進行中的即時播放。若未設定，會遵循即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前的最低助理播放時間。預設值：`250`。在低回音房間中設為 `0` 可立即中斷，或在回音嚴重的喇叭設定中提高此值。
- 若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇文字轉語音聲音。`cedar` 是目前 OpenAI TTS 模型上一個不錯的男性音色選擇。
- 每個頻道的 Discord `systemPrompt` 覆寫會套用到該語音頻道的語音逐字稿回合。
- 語音逐字稿回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態，以供擁有者閘控命令和頻道動作使用。代理工具可見性會遵循路由工作階段設定的工具政策。
- Discord 語音對純文字設定是選擇加入；設定 `channels.discord.voice.enabled=true`（或保留既有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段，以及 `GuildVoiceStates` 閘道意圖。
- `channels.discord.intents.voiceStates` 可明確覆寫語音狀態意圖訂閱。保持未設定可讓意圖遵循有效的語音啟用狀態。
- 如果 `voice.autoJoin` 對同一個 guild 有多個項目，OpenClaw 會加入該 guild 最後設定的頻道。
- `voice.allowedChannels` 是選用的駐留允許清單。保持未設定可允許 `/vc join` 加入任何已授權的 Discord 語音頻道。設定時，`/vc join`、啟動時自動加入，以及機器人語音狀態移動都會限制在列出的 `{ guildId, channelId }` 項目。將其設為空陣列可拒絕所有 Discord 語音加入。如果 Discord 將機器人移到允許清單之外，OpenClaw 會離開該頻道，並在可用時重新加入設定的自動加入目標。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞至 `@discordjs/voice` 加入選項。
- `@discordjs/voice` 未設定時的預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用隨附的 `libopus-wasm` 編解碼器接收 Discord 語音並播放即時原始 PCM。它隨附固定版本的 libopus WebAssembly 建置，不需要原生 opus 附加元件。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試時，初始等待 `@discordjs/voice` Ready 的時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待其開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因另一位使用者開始說話而停止。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放完成後再說下一回合。即時模式會將說話者開始事件作為插話訊號轉發給即時提供者。
- 在即時模式中，喇叭回音進入開放麥克風可能看起來像插話並中斷播放。對於回音嚴重的 Discord 房間，設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` 可避免 OpenAI 因輸入音訊而自動中斷。如果仍希望 Discord 說話者開始事件中斷進行中的播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音/噪音並忽略，記錄為已略過，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 OpenClaw 在 Discord 回報說話者停止後，等待多久才為 STT 最終確定該音訊片段。預設值：`2000`；如果 Discord 將正常停頓切成零碎的部分逐字稿，請提高此值。
- 當 ElevenLabs 是選取的 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者回應串流開始。不支援串流的提供者會退回使用合成暫存檔路徑。
- OpenClaw 也會監看接收解密失敗，並在短時間內重複失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收日誌重複顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告和日誌。隨附的 `@discordjs/voice` 版本包含來自 discord.js PR #11449 的上游填充修正，該修正已關閉 discord.js issue #11419。
- `The operation was aborted` 接收事件是 OpenClaw 最終確定已擷取說話者片段時的預期行為；它們是詳細診斷，不是警告。
- 詳細 Discord 語音日誌會為每個接受的說話者片段包含有界的一行 STT 逐字稿預覽，因此除錯時可看到使用者端和代理回覆端，而不會傾印無界的逐字稿文字。
- 在 `agent-proxy` 模式中，強制諮詢後援會略過可能不完整的逐字稿片段，例如以 `...` 結尾的文字或像 `and` 這樣的尾隨連接詞，以及明顯不可操作的結尾語，例如「馬上回來」或「再見」。當這避免了過時的佇列答案時，日誌會顯示 `forced agent consult skipped reason=...`。

### 在語音中跟隨使用者

當你希望 Discord 語音機器人跟隨一或多位已知 Discord 使用者，而不是在啟動時加入固定頻道或等待 `/vc join` 時，請使用 `voice.followUsers`。

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
- 設定 `followUsers` 時，`followUsersEnabled` 預設為 `true`。將其設為 `false` 可保留已儲存的清單，但停止自動語音跟隨。
- 當被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。當使用者移動時，OpenClaw 會跟著移動。當目前被跟隨的使用者中斷連線時，OpenClaw 會離開。
- 如果多位被跟隨的使用者位於同一個 guild，且目前被跟隨的使用者離開，OpenClaw 會在離開該 guild 前移動到另一位受追蹤被跟隨使用者的頻道。如果多位被跟隨的使用者同時移動，會以最新觀察到的語音狀態事件為準。
- `allowedChannels` 仍然適用。位於不允許頻道中的被跟隨使用者會被忽略，而由跟隨擁有的工作階段會移動到另一位被跟隨使用者，或直接離開。
- OpenClaw 會在啟動時和有界間隔內協調錯過的語音狀態事件。協調會取樣設定的 guild，並限制每次執行的 REST 查詢數量，因此非常大的 `followUsers` 清單可能需要超過一個間隔才會收斂。
- 如果 Discord 或管理員在 OpenClaw 正在跟隨使用者時移動機器人，OpenClaw 會重建語音工作階段，並在目的地被允許時保留跟隨所有權。如果機器人被移到 `allowedChannels` 之外，OpenClaw 會離開，並在存在設定目標時重新加入。
- DAVE 接收復原可能會在重複解密失敗後離開並重新加入同一個頻道。由跟隨擁有的工作階段會在該復原路徑中保留其跟隨所有權，因此之後被跟隨使用者中斷連線時仍會離開該頻道。

選擇加入模式：

- 對於個人或操作員設定，如果希望機器人在你使用語音時自動待在語音中，請使用 `followUsers`。
- 對於即使沒有受追蹤使用者在語音中也應存在的固定房間機器人，請使用 `autoJoin`。
- 對於一次性加入或自動語音存在可能令人意外的房間，請使用 `/vc join`。

Discord 語音編解碼器：

- 語音接收記錄顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會先使用同一個內建的 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，然後再把封包交給 `@discordjs/voice`。
- 檔案與 provider 串流播放會使用 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，然後使用 `libopus-wasm` 產生傳送到 Discord 的 Opus 封包串流。

STT 加 TTS 管線：

- Discord PCM 擷取會轉換成 WAV 暫存檔。
- `tools.media.audio` 會處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄稿會透過 Discord 入口與路由傳送，同時回應 LLM 會以語音輸出政策執行；該政策會隱藏 agent 的 `tts` 工具並要求回傳文字，因為 Discord 語音負責最終的 TTS 播放。
- 設定 `voice.model` 時，它只會覆寫這次語音頻道回合的回應 LLM。
- `voice.tts` 會合併覆蓋 `messages.tts`；支援串流的 provider 會直接送入播放器，否則會在已加入的頻道中播放產生的音訊檔。

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

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得自己的已路由 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會對該 Discord 語音頻道的工作階段說話。即時模型只是語音前端；實質請求會交給已設定的 OpenClaw agent。如果即時模型在未呼叫 consult 工具的情況下產生最終轉錄稿，OpenClaw 會強制執行 consult 作為後援，因此預設行為仍像是在與 agent 對話。

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

在 `agent-proxy` 模式中，機器人會加入已設定的語音頻道，但 OpenClaw agent 回合會使用目標頻道的一般已路由工作階段與 agent。即時語音工作階段會把回傳結果說回語音頻道。supervisor agent 仍可依照其工具政策使用一般訊息工具，包括在那是正確動作時傳送另一則 Discord 訊息。

當委派的 OpenClaw 執行處於作用中時，新的 Discord 語音轉錄稿會先被視為即時執行控制，而不是啟動另一個 agent 回合。像是「status」、「cancel that」、「use the smaller fix」或「when you're done also check tests」這類片語，會被分類為作用中工作階段的狀態、取消、引導或後續輸入。狀態、取消、已接受的引導與後續結果都會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理該請求。

實用的目標形式：

- `target: "channel:123456789012345678"` 會透過 Discord 文字頻道工作階段路由。
- `target: "123456789012345678"` 會被視為頻道目標。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 會透過該直接訊息工作階段路由。

回音嚴重的 OpenAI Realtime 範例：

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

當模型透過開啟的麥克風聽到自己的 Discord 播放聲，但你仍想用說話打斷它時，請使用這項設定。OpenClaw 會避免 OpenAI 因原始輸入音訊而自動中斷，同時 `bargeIn: true` 讓 Discord 說話者開始事件與已作用中的說話者音訊，在下一個擷取回合抵達 OpenAI 前取消作用中的即時回應。`audioEndMs` 低於 `minBargeInAudioEndMs` 的非常早期插話訊號，會被視為可能是回音或雜訊並忽略，因此模型不會在第一個播放影格就中斷。

預期的語音記錄：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時啟動時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 說話者音訊時：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過期語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止或重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時 consult 時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- agent 回答時：`discord voice: agent turn answer ...`
- 佇列精確語音時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音或雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 閒置播放時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊被截斷的問題，請將即時語音記錄當作時間軸閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。從這個時間點開始，bridge 會計算助理輸出區塊、Discord PCM 位元組、provider 即時位元組，以及合成音訊時長。
2. `realtime speaker turn opened` 標記某個 Discord 說話者變成作用中。如果播放已處於作用中且已啟用 `bargeIn`，後面可能會接著 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標記該說話者回合收到的第一個實際音訊影格。這裡的 `outputActive=true` 或非零 `outputAudioMs` 表示麥克風正在助理播放仍處於作用中時傳送輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放處於作用中時看到即時說話者音訊。這有助於區分真正的中斷，以及沒有可用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求即時 provider 取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 與 `playbackChunks`，因此你可以看到中斷前實際已播放多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放重設點。原因會說明是誰停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 會摘要已擷取的輸入回合。`chunks=0` 或 `hasAudio=false` 表示說話者回合已開啟，但沒有可用音訊抵達即時 bridge。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：即時 provider 在該記錄行之前產生的助理音訊時長。
- `audioMs`：OpenClaw 在播放停止前計算的助理音訊時長。
- `elapsedMs`：開啟與關閉播放串流或說話者回合之間的實際時間。
- `discordBytes`：傳送到 Discord 語音或從 Discord 語音接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送到即時 provider 或從即時 provider 接收的 provider 格式 PCM 位元組。
- `playbackChunks`：為作用中回應轉送到 Discord 的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取的說話者音訊影格與說話者回合關閉之間的間隔。

常見模式：

- 伴隨 `source=active-speaker-audio`、很小的 `outputAudioMs`，且附近是同一使用者的立即截斷，通常表示喇叭回音進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低喇叭音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false` 表示 Discord 回報說話者開始，但沒有音訊抵達 OpenClaw。這可能是暫時性的 Discord 語音事件、噪音閘行為，或用戶端短暫觸發麥克風。
- 沒有鄰近插話或 `provider-clear-audio` 的 `audio playback stopped reason=stream-close`，表示本機 Discord 播放串流意外結束。請檢查前面的 provider 與 Discord 播放器記錄。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊處於作用中時刻意丟棄輸入。如果你想讓語音中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或 provider VAD 回報語音，但 OpenClaw 沒有可中斷的作用中播放。這不應該截斷音訊。

憑證會依元件解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`/`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或 provider 的一般驗證設定則使用即時 provider 驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，且需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要 Gateway 主機上有 `ffmpeg` 與 `ffprobe`，才能檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一個 payload 中同時包含文字與語音訊息）。
- 接受任何音訊格式；OpenClaw 會視需要轉換為 OGG/Opus。

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

  <Accordion title="Guild messages blocked unexpectedly">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的 guild allowlist
    - 如果 guild `channels` 對應存在，則只允許列出的頻道
    - 驗證 `requireMention` 行為與提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    常見原因：

    - `groupPolicy="allowlist"` 但沒有相符的 guild/channel allowlist
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者被 guild/channel `users` allowlist 阻擋

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    典型記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 閘道佇列調整項：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord 閘道監聽器工作，不控制代理回合生命週期

    Discord 不會對已排入佇列的代理回合套用頻道擁有的逾時。訊息監聽器會立即交接，而排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回 Discord 的預設閘道 URL，且記錄會受到速率限制。

    中繼資料逾時調整項：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未設定 config 時的 env fallback：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設：`30000`（30 秒），最大：`120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw 會在啟動期間與執行階段重新連線後，等待 Discord 的閘道 `READY` 事件。使用啟動錯峰的多帳號設定，可能需要比預設更長的啟動 READY 視窗。

    READY 逾時調整項：

    - 啟動單一帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未設定 config 時的啟動 env fallback：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設：`15000`（15 秒），最大：`120000`
    - 執行階段單一帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未設定 config 時的執行階段 env fallback：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設：`30000`（30 秒），最大：`120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` 權限檢查僅適用於數字頻道 ID。

    如果你使用 slug keys，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 原則已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="Bot to bot loops">
    預設會忽略由 bot 撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與 allowlist 規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該 bot 的 bot 訊息。

    OpenClaw 也提供共用的 [bot 迴圈保護](/zh-TW/channels/bot-loop-protection)。每當 `allowBots` 允許由 bot 撰寫的訊息進入 dispatch，Discord 會將入站事件對應到 `(account, channel, bot pair)` 事實，而泛用 pair guard 會在該 pair 超過已設定的事件預算後抑制它。此防護可避免過去必須靠 Discord 速率限制停止的失控雙 bot 迴圈；它不會影響單一 bot 部署，或維持在預算內的一次性 bot 回覆。

    預設設定（設定 `allowBots` 時啟用）：

    - `maxEventsPerWindow: 20` -- bot pair 可在滑動視窗內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動視窗長度
    - `cooldownSeconds: 60` -- 一旦預算觸發，任一方向的每則額外 bot 對 bot 訊息都會被丟棄一分鐘

    先在 `channels.defaults.botLoopProtection` 下設定共用預設值，然後在合法工作流程需要更多餘裕時覆寫 Discord。優先順序為：

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 內建預設值

    Discord 使用泛用的 `maxEventsPerWindow`、`windowSeconds` 與 `cooldownSeconds` keys。

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - 保持 OpenClaw 為最新版本（`openclaw update`），確保 Discord 語音接收復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設）開始，僅在需要時調整
    - 觀察記錄中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，收集記錄並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="High-signal Discord fields">

- 啟動/auth：`enabled`、`token`、`accounts.*`、`allowBots`
- 原則：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 閘道：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制出站 Discord 上傳，預設 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態呈現：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與操作

- 將 bot tokens 視為秘密（在受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最小權限的 Discord 權限。
- 如果命令部署/狀態過時，請重新啟動閘道，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到閘道。
  </Card>
  <Card title="Groups" icon="users" href="/zh-TW/channels/groups">
    群組聊天與 allowlist 行為。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-TW/channels/channel-routing">
    將入站訊息路由到代理。
  </Card>
  <Card title="Security" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將 guild 與頻道對應到代理。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
