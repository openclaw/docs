---
read_when:
    - 開發 Discord 頻道功能
summary: Discord bot 支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

可透過官方 Discord 閘道使用私訊與公會頻道。

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

你需要建立一個含有機器人的新應用程式、將機器人加入你的伺服器，並將它與 OpenClaw 配對。我們建議將你的機器人加入你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="建立 Discord 應用程式與機器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然後點擊 **New Application**。將它命名為類似「OpenClaw」的名稱。

    點擊側邊欄中的 **Bot**。將 **Username** 設為你對 OpenClaw agent 的稱呼。

  </Step>

  <Step title="啟用特權意圖">
    仍在 **Bot** 頁面上，向下捲動到 **Privileged Gateway Intents** 並啟用：

    - **Message Content Intent**（必要）
    - **Server Members Intent**（建議；角色允許清單與名稱對 ID 比對需要）
    - **Presence Intent**（選用；僅在需要狀態更新時才需要）

  </Step>

  <Step title="複製你的機器人權杖">
    回到 **Bot** 頁面上方，然後點擊 **Reset Token**。

    <Note>
    雖然名稱如此，這會產生你的第一個權杖，並沒有任何內容被「重設」。
    </Note>

    複製權杖並儲存在某處。這是你的 **Bot Token**，稍後會需要用到。

  </Step>

  <Step title="產生邀請 URL 並將機器人加入你的伺服器">
    點擊側邊欄中的 **OAuth2**。你將產生一個具有正確權限的邀請 URL，用來將機器人加入你的伺服器。

    向下捲動到 **OAuth2 URL Generator** 並啟用：

    - `bot`
    - `applications.commands`

    下方會出現 **Bot Permissions** 區段。至少啟用：

    **一般權限**
      - 檢視頻道
    **文字權限**
      - 傳送訊息
      - 讀取訊息歷史記錄
      - 嵌入連結
      - 附加檔案
      - 新增反應（選用）

    這是一般文字頻道的基準設定。如果你計畫在 Discord 討論串中發文，包括建立或延續討論串的論壇或媒體頻道工作流程，也請啟用 **Send Messages in Threads**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後點擊 **Continue** 以連線。你現在應該會在 Discord 伺服器中看到你的機器人。

  </Step>

  <Step title="啟用開發者模式並收集你的 ID">
    回到 Discord 應用程式，你需要啟用開發者模式，這樣才能複製內部 ID。

    1. 點擊 **User Settings**（頭像旁的齒輪圖示）→ 捲動到側邊欄中的 **Developer** → 開啟 **Developer Mode**

        *（注意：在 Discord 行動應用程式中，開發者模式位於 **App Settings** → **Advanced**）*

    2. 在側邊欄中的 **伺服器圖示** 上按右鍵 → **Copy Server ID**
    3. 在你 **自己的頭像** 上按右鍵 → **Copy User ID**

    將你的 **Server ID** 與 **User ID** 連同 Bot Token 一起儲存；下一步你會把這三項傳送給 OpenClaw。

  </Step>

  <Step title="允許來自伺服器成員的私訊">
    若要讓配對運作，Discord 需要允許你的機器人傳私訊給你。在你的 **伺服器圖示** 上按右鍵 → **Privacy Settings** → 開啟 **Direct Messages**。

    這會讓伺服器成員（包括機器人）傳送私訊給你。如果你想搭配 OpenClaw 使用 Discord 私訊，請保持此設定啟用。如果你只計畫使用公會頻道，可以在配對後停用私訊。

  </Step>

  <Step title="安全設定你的機器人權杖（不要在聊天中傳送）">
    你的 Discord 機器人權杖是機密（就像密碼）。在傳訊息給你的 agent 之前，請先在執行 OpenClaw 的機器上設定它。

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
    對於受管理服務安裝，請從已有 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務在重新啟動後可以解析 env SecretRef。
    如果你的主機受到 Discord 啟動時應用程式查詢的阻擋或速率限制，請從 Developer Portal 設定 Discord 應用程式/用戶端 ID，讓啟動流程可以略過該 REST 呼叫。預設帳號請使用 `channels.discord.applicationId`；執行多個 Discord 機器人時，請使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="設定 OpenClaw 並配對">

    <Tabs>
      <Tab title="詢問你的 agent">
        在任何現有頻道（例如 Telegram）與你的 OpenClaw agent 聊天並告訴它。如果 Discord 是你的第一個頻道，請改用命令列介面 / 設定分頁。

        >「我已經在設定中設好我的 Discord 機器人權杖。請使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 設定。」
      </Tab>
      <Tab title="命令列介面 / 設定">
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

        對於腳本化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後移除 `--dry-run` 後重新執行。支援純文字 `token` 值。`channels.discord.token` 也支援跨 env/file/exec provider 的 SecretRef 值。請參閱[機密管理](/zh-TW/gateway/secrets)。

        對於多個 Discord 機器人，請將每個機器人權杖與應用程式 ID 放在各自的帳號底下。頂層 `channels.discord.applicationId` 會由帳號繼承，因此只有在每個帳號都應使用相同應用程式 ID 時，才在該處設定。

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
    等到閘道執行後，在 Discord 中私訊你的機器人。它會回覆一組配對碼。

    <Tabs>
      <Tab title="詢問你的 agent">
        在你現有的頻道上將配對碼傳送給你的 agent：

        >「核准這組 Discord 配對碼：`<CODE>`」
      </Tab>
      <Tab title="命令列介面">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配對碼會在 1 小時後過期。

    你現在應該可以透過私訊在 Discord 中與你的 agent 聊天。

  </Step>
</Steps>

<Note>
權杖解析具備帳號感知能力。設定中的權杖值會優先於 env 後援。`DISCORD_BOT_TOKEN` 只用於預設帳號。
如果兩個已啟用的 Discord 帳號解析到相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監視器。設定來源的權杖會優先於預設 env 後援；否則第一個已啟用帳號會勝出，重複帳號會被回報為已停用。
對於進階的對外呼叫（訊息工具/頻道動作），明確的逐呼叫 `token` 會用於該呼叫。這適用於傳送與讀取/探查類動作（例如 read/search/fetch/thread/pins/permissions）。帳號政策/重試設定仍來自作用中執行階段快照中選取的帳號。
</Note>

## 建議：設定公會工作區

私訊運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都有自己的 agent 工作階段與自己的脈絡。這建議用於只有你和你的機器人的私人伺服器。

<Steps>
  <Step title="將你的伺服器加入公會允許清單">
    這會讓你的 agent 能在你伺服器上的任何頻道中回應，而不只是私訊。

    <Tabs>
      <Tab title="詢問你的 agent">
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

  <Step title="允許不需 @mention 即可回應">
    預設情況下，你的 agent 只有在公會頻道中被 @mentioned 時才會回應。對私人伺服器來說，你可能希望它回應每則訊息。

    在公會頻道中，一般回覆預設會自動發佈。對於共享且永遠開啟的聊天室，請選擇啟用 `messages.groupChat.visibleReplies: "message_tool"`，讓 agent 可以潛伏，並只在它判定頻道回覆有用時才發文。這最適合搭配最新一代且工具可靠的模型，例如 GPT 5.5。環境房間事件會保持安靜，除非工具傳送訊息。完整潛伏模式設定請參閱[環境房間事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入，且記錄顯示權杖用量，但沒有發佈訊息，請檢查該回合是否設定為環境房間事件，或是否已選擇使用訊息工具的可見回覆。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「允許我的 agent 在這個伺服器上不需要被 @mentioned 也能回應」
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

        若要要求可見群組/頻道回覆必須透過訊息工具傳送，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="規劃公會頻道中的記憶">
    預設情況下，長期記憶（MEMORY.md）只會載入私訊工作階段。公會頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="詢問你的 agent">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期脈絡，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="手動">
        如果你需要每個頻道都有共享脈絡，請將穩定指示放在 `AGENTS.md` 或 `USER.md`（它們會注入每個工作階段）。將長期筆記保留在 `MEMORY.md`，並視需要用記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在在你的 Discord 伺服器上建立一些頻道並開始聊天。你的 agent 可以看到頻道名稱，而且每個頻道都有自己隔離的工作階段，因此你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- 閘道擁有 Discord 連線。
- 回覆路由是決定性的：Discord 傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會以不受信任的
  情境加入模型提示，而不是作為使用者可見的回覆前綴。若模型將該封套複製
  回來，OpenClaw 會從傳出回覆以及
  未來的重播情境中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理程式主要工作階段（`agent:main:main`）。
- 伺服器頻道是隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組私訊預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍會攜帶 `CommandTargetSessionKey` 到已路由的對話工作階段。
- 傳送到 Discord 的純文字排程/心跳偵測公告會使用最終
  助理可見答案一次。當代理程式發出多個可傳遞承載時，媒體與結構化元件承載仍會
  保持多訊息。

## 論壇頻道

Discord 論壇與媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用你訊息中的第一個非空白行。
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

論壇父層不接受 Discord 元件。若需要元件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式元件

OpenClaw 支援用於代理程式訊息的 Discord components v2 容器。請使用帶有 `components` 承載的訊息工具。互動結果會作為一般傳入訊息路由回代理程式，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，元件為一次性使用。設定 `components.reusable=true` 可允許按鈕、選取與表單在到期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不符合的使用者會收到一則暫時性的拒絕訊息。

元件回呼預設會在 30 分鐘後到期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設 Discord 帳戶的回呼登錄生命週期，或設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 以在多帳戶設定中覆寫某個帳戶。值為毫秒，必須是正整數，且上限為 `86400000`（24 小時）。較長的 TTL 適合需要讓按鈕保持可用的審查或核准工作流程，但也會延長舊 Discord 訊息仍可觸發動作的時間窗口。請優先使用符合工作流程的最短 TTL；若過期回呼會造成意外，請保留預設值。

`/model` 和 `/models` 斜線命令會開啟互動式模型選擇器，其中包含提供者、模型與相容執行階段下拉選單，以及提交步驟。`/models add` 已棄用，現在會傳回棄用訊息，而不是從聊天註冊模型。選擇器回覆是暫時性的，且只有發起的使用者可以使用。Discord 選取選單限制為 25 個選項，因此當你希望選擇器只針對所選提供者（例如 `openai` 或 `vllm`）顯示動態探索到的模型時，請將 `provider/*` 項目加入 `agents.defaults.models`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應與附件參照相符時，使用 `filename` 覆寫上傳名稱

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
    `channels.discord.dmPolicy` 控制私訊存取。`channels.discord.allowFrom` 是標準私訊允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果私訊政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中提示配對）。

    多帳戶優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用到 `default` 帳戶。
    - 對單一帳戶而言，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 具名帳戶在自己的 `allowFrom` 與舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳戶不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍會為了相容性而讀取。`openclaw doctor --fix` 會在不變更存取權的前提下，將它們遷移到 `dmPolicy` 和 `allowFrom`。

    傳遞用的私訊目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值啟用時，裸數字 ID 通常會解析為頻道 ID，但列在帳戶有效私訊 `allowFrom` 中的 ID 會為了相容性而被視為使用者私訊目標。

  </Tab>

  <Tab title="Access groups">
    Discord 私訊與文字命令授權可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱在各訊息頻道之間共用。靜態群組請使用 `type: "message.senders"`，其成員會以各頻道一般的 `allowFrom` 語法表示；當 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格時，請使用 `type: "discord.channelAudience"`。共用存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 將成員資格建模為：私訊傳送者是所設定伺服器的成員，且在套用角色與頻道覆寫後，目前對所設定頻道具有有效的 `ViewChannel` 權限。

    範例：允許任何可以看到 `#maintainers` 的人私訊機器人，同時對其他所有人關閉私訊。

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

    查詢會失敗即關閉。若 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，該私訊傳送者會被視為未授權。

    使用頻道受眾存取群組時，請在 Discord Developer Portal 為機器人啟用 **Server Members Intent**。私訊不包含伺服器成員狀態，因此 OpenClaw 會在授權時透過 Discord REST 解析成員。

  </Tab>

  <Tab title="Guild policy">
    伺服器處理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    當 `channels.discord` 存在時，安全基準為 `allowlist`。

    `allowlist` 行為：

    - 伺服器必須符合 `channels.discord.guilds`（建議使用 `id`，也接受 slug）
    - 選用的傳送者允許清單：`users`（建議使用穩定 ID）與 `roles`（僅限角色 ID）；若任一者已設定，傳送者符合 `users` 或 `roles` 時即允許
    - 直接名稱/標籤比對預設停用；只有在緊急相容模式下才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支援名稱/標籤，但 ID 較安全；使用名稱/標籤項目時，`openclaw security audit` 會發出警告
    - 若伺服器設定了 `channels`，未列出的頻道會被拒絕
    - 若伺服器沒有 `channels` 區塊，該允許清單伺服器中的所有頻道都會被允許

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

    如果你只設定 `DISCORD_BOT_TOKEN` 而未建立 `channels.discord` 區塊，即使 `channels.defaults.groupPolicy` 是 `open`，執行階段後援也會是 `groupPolicy="allowlist"`（並在日誌中警告）。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設會受提及門檻限制。

    提及偵測包含：

    - 明確提及機器人
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 支援情況下的隱含回覆機器人行為

    撰寫傳出的 Discord 訊息時，請使用標準提及語法：使用者用 `<@USER_ID>`，頻道用 `<#CHANNEL_ID>`，角色用 `<@&ROLE_ID>`。不要使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及另一位使用者/角色但未提及機器人的訊息（不包含 @everyone/@here）。

    群組私訊：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可透過 `dm.groupChannels` 選用允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 以角色為基礎的代理程式路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 公會成員路由到不同代理。以角色為基礎的繫結只接受角色 ID，並且會在對等或父對等繫結之後、公會限定繫結之前評估。如果某個繫結也設定其他比對欄位（例如 `peer` + `guildId` + `roles`），所有已設定欄位都必須相符。

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

- `commands.native` 預設為 `"auto"`，並已為 Discord 啟用。
- 逐頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前已註冊的命令可能仍會在 Discord 中可見，直到你從 Discord 應用程式移除它們。
- 原生命令授權使用與一般訊息處理相同的 Discord 允許清單/政策。
- 對未獲授權的使用者，命令仍可能在 Discord UI 中可見；執行時仍會強制套用 OpenClaw 授權，並傳回「未授權」。

請參閱[斜線命令](/zh-TW/tools/slash-commands)以了解命令目錄與行為。

預設斜線命令設定：

- `ephemeral: true`

## 功能詳細資訊

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord 支援代理輸出中的回覆標記：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（預設）
    - `first`
    - `all`
    - `batched`

    注意：`off` 會停用隱含的回覆串接。明確的 `[[reply_to_*]]` 標記仍會被遵循。
    `first` 一律會將隱含的原生回覆參照附加到該輪第一則外送 Discord 訊息。
    `batched` 只有在傳入事件是多則訊息的防抖批次時，才會附加 Discord 的隱含原生回覆參照。當你主要希望在模糊的高頻聊天中使用原生回覆，而不是每個單訊息回合都使用時，這很有用。

    訊息 ID 會在脈絡/歷史中呈現，因此代理可以鎖定特定訊息。

  </Accordion>

  <Accordion title="Link previews">
    Discord 預設會為 URL 產生豐富連結嵌入。OpenClaw 預設會抑制外送 Discord 訊息上這些產生的嵌入，因此代理傳送的 URL 會維持為純連結，除非你選擇啟用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 可覆寫單一帳號。代理訊息工具傳送也可以為單則訊息傳入 `suppressEmbeds: false`。明確的 Discord `embeds` 承載不會受到預設連結預覽設定抑制。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯該訊息來串流草稿回覆。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（預設）。`progress` 會保留一則可編輯的狀態草稿，並以工具進度更新它直到最終送達；共用起始標籤是一行滾動文字，因此在出現足夠工作內容後會像其餘內容一樣捲離。`streamMode` 是舊版執行階段別名。執行 `openclaw doctor --fix` 可將持久化設定重寫為標準鍵。

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

    - `partial` 會在權杖抵達時編輯單一預覽訊息。
    - `block` 會發出草稿大小的區塊（使用 `draftChunk` 調整大小與中斷點，並鉗制到 `textChunkLimit`）。
    - 媒體、錯誤與明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - 工具/進度列會在可用時呈現為精簡的表情符號 + 標題 + 詳細資訊，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（預設 `false`）選擇在暫時進度草稿中加入助理註解/前言文字。註解會在顯示前清理、保持暫時性，且不會變更最終答案送達。
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

    預覽串流僅限文字；媒體回覆會退回一般送達。當明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    公會歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    討論串行為：

    - Discord 討論串會作為頻道工作階段路由，並繼承父頻道設定，除非被覆寫。
    - 討論串工作階段會繼承父頻道的工作階段層級 `/model` 選擇，作為僅模型的後援；討論串本機 `/model` 選擇仍優先，且除非啟用逐字稿繼承，否則不會複製父逐字稿歷史。
    - `channels.discord.thread.inheritParent`（預設 `false`）會讓新的自動討論串選擇從父逐字稿播種。逐帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - 訊息工具反應可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會作為**不受信任**的脈絡注入。允許清單會限制誰可以觸發代理，而不是完整的補充脈絡遮蔽邊界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以將討論串繫結到工作階段目標，讓該討論串中的後續訊息持續路由到相同工作階段（包含子代理工作階段）。

    命令：

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

    - `session.threadBindings.*` 設定全域預設值。
    - `channels.discord.threadBindings.*` 覆寫 Discord 行為。
    - `spawnSessions` 控制為 `sessions_spawn({ thread: true })` 與 ACP 討論串產生自動建立/繫結討論串。預設：`true`。
    - `defaultSpawnContext` 控制討論串繫結產生的原生子代理脈絡。預設：`"fork"`。
    - 已淘汰的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某帳號停用討論串繫結，`/focus` 與相關討論串繫結操作將不可用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    對於穩定的「永遠開啟」ACP 工作區，請設定頂層具型別的 ACP 繫結，以 Discord 對話為目標。

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

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或討論串，並讓未來訊息維持在相同 ACP 工作階段。討論串訊息會繼承父頻道繫結。
    - 在已繫結的頻道或討論串中，`/new` 與 `/reset` 會就地重設相同 ACP 工作階段。暫時討論串繫結可在作用中時覆寫目標解析。
    - `spawnSessions` 透過 `--thread auto|here` 閘控子討論串建立/繫結。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents) 以了解繫結行為詳細資訊。

  </Accordion>

  <Accordion title="Reaction notifications">
    逐公會反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉換為系統事件，並附加到已路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="Ack reactions">
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

  <Accordion title="Config writes">
    預設啟用由頻道發起的設定寫入。

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
    透過 `channels.discord.proxy` 使用 HTTP(S) 代理，路由 Discord 閘道 WebSocket 流量與啟動 REST 查詢（應用程式 ID + 允許清單解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    逐帳號覆寫：

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

    備註：

    - 允許清單可以使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID，且受時間窗口限制
    - 如果查詢失敗，代理訊息會被視為機器人訊息，並在未設定 `allowBots=true` 時遭到丟棄

  </Accordion>

  <Accordion title="外送提及別名">
    當代理需要對已知 Discord 使用者進行確定性的外送提及時，請使用 `mentionAliases`。鍵是不含前導 `@` 的代稱；值是 Discord 使用者 ID。未知代稱、`@everyone`、`@here`，以及 Markdown 程式碼跨度中的提及會保持不變。

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

    - 0: 正在玩
    - 1: 串流中（需要 `activityUrl`）
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

    自動狀態顯示會將執行階段可用性對應到 Discord 狀態：healthy => online、degraded 或 unknown => idle、exhausted 或 unavailable => dnd。選用文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中以按鈕處理核准，也可以選擇在原始頻道中發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（選用；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少可解析出一位核准者時，Discord 會自動啟用原生 exec 核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom` 或直接訊息 `defaultTo` 推斷 exec 核准者。設定 `enabled: false` 可明確停用 Discord 作為原生核准用戶端。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的僅擁有者群組命令，OpenClaw 會私下傳送核准提示與最終結果。當發起命令的擁有者有 Discord 擁有者路由時，會先嘗試 Discord 私訊；如果無法使用，則退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 是 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到暫時性的拒絕訊息。核准提示包含命令文字，因此只應在可信任的頻道中啟用頻道傳送。如果無法從工作階段鍵推導出頻道 ID，OpenClaw 會退回使用私訊傳送。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 配接器主要加入核准者私訊路由與頻道扇出。
    當這些按鈕存在時，它們是主要的核准使用者體驗；OpenClaw
    只有在工具結果表示聊天核准不可用，或手動核准是唯一途徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但原生卡片無法傳送到任何目標，
    OpenClaw 會在同一聊天中傳送備援通知，其中包含待處理核准的確切 `/approve`
    命令。

    閘道驗證與核准解析遵循共用閘道用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後到期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作包含傳訊、頻道管理、審核、狀態顯示與中繼資料動作。

核心範例：

- 傳訊：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回應：`react`、`reactions`、`emojiList`
- 審核：`timeout`、`kick`、`ban`
- 狀態顯示：`setPresence`

`event-create` 動作接受選用的 `image` 參數（URL 或本機檔案路徑），用來設定排程活動封面圖片。

動作閘門位於 `channels.discord.actions.*` 底下。

預設閘門行為：

| 動作群組                                                                                                                                                             | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 已啟用   |
| roles                                                                                                                                                                    | 已停用   |
| moderation                                                                                                                                                               | 已停用   |
| presence                                                                                                                                                                 | 已停用   |

## 元件 v2 使用者介面

OpenClaw 使用 Discord 元件 v2 來處理 exec 核准與跨內容標記。Discord 訊息動作也可以接受 `components` 以提供自訂使用者介面（進階；需要透過 discord 工具建構元件承載資料），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord 元件容器使用的重點色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 依帳號設定。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord 元件回呼維持註冊的時間長度（預設 `1800000`，最大 `86400000`）。使用 `channels.discord.accounts.<id>.agentComponents.ttlMs` 依帳號設定。
- 當元件 v2 存在時，`embeds` 會被忽略。
- 純 URL 預覽預設會被抑制。當單一外送連結應展開時，請在訊息動作上設定 `suppressEmbeds: false`。

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

使用 `/vc join|leave|status` 控制工作階段。該命令會使用帳號預設代理，並遵循與其他 Discord 命令相同的允許清單與群組政策規則。

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

備註：

- `voice.tts` 只會針對 `stt-tts` 語音播放覆寫 `messages.tts`。即時模式使用 `voice.realtime.speakerVoice`。
- `voice.mode` 控制對話路徑。預設值為 `agent-proxy`：即時語音前端會處理回合時序、中斷與播放，透過 `openclaw_agent_consult` 將實質工作委派給路由到的 OpenClaw 代理，並將結果視為該說話者輸入的 Discord 文字提示。`stt-tts` 保留較舊的批次 STT 加 TTS 流程。`bidi` 讓即時模型直接對話，同時公開 `openclaw_agent_consult` 供 OpenClaw 大腦使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話會接收語音回合。保留未設定時會使用語音頻道自己的工作階段，或設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道作為現有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風/喇叭延伸。
- `voice.model` 會覆寫 Discord 語音回應與即時諮詢所用的 OpenClaw 代理大腦。保留未設定時會繼承路由到的代理模型。它與 `voice.realtime.model` 是分開的。
- `voice.followUsers` 讓機器人能與選定使用者一起加入、移動及離開 Discord 語音。行為規則與範例請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音，這會保留說話者與目標工作階段的一般擁有者/工具授權，但會隱藏代理的 `tts` 工具，因為 Discord 語音負責播放。預設情況下，`agent-proxy` 會為擁有者說話者提供等同擁有者的完整工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在實質回答前先諮詢 OpenClaw 代理（`voice.realtime.consultPolicy: "always"`）。在預設的 `always` 模式中，即時層不會在諮詢答案前自動說出填充語；它會擷取並轉錄語音，然後說出路由後的 OpenClaw 回答。如果多個強制諮詢答案在 Discord 仍在播放第一個答案時完成，後續的精確語音答案會排入佇列，直到播放閒置，而不是在句子中途替換語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 會設定即時音訊工作階段。若要搭配 Codex 大腦使用 OpenAI Realtime 2，請使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai/gpt-5.5"`。
- 即時語音模式預設會在即時提供者指令中包含小型 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 設定檔檔案，讓快速直接回合維持與路由到的 OpenClaw 代理相同的身分、使用者脈絡與人格。將 `voice.realtime.bootstrapContextFiles` 設為子集合可自訂此行為，或設為 `[]` 以停用。支援的即時啟動檔案僅限這些設定檔檔案；`AGENTS.md` 仍留在一般代理脈絡中。注入的設定檔脈絡不會取代 `openclaw_agent_consult` 來處理工作區工作、目前事實、記憶查找或工具支援的動作。
- 在 OpenAI `agent-proxy` 即時模式中，設定 `voice.realtime.requireWakeName: true`，可讓 Discord 即時語音保持靜默，直到轉錄以喚醒名稱開頭或結尾。設定的喚醒名稱必須是一個或兩個詞。如果未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由到的代理 `name` 加上 `OpenClaw`，並在無法使用時退回到代理 ID 加上 `OpenClaw`。喚醒名稱閘控會停用即時提供者自動回應，將接受的回合透過 OpenClaw 代理諮詢路徑路由，並在最終轉錄到達前，從部分轉錄辨識到前置喚醒名稱時給出簡短的語音確認。
- OpenAI 即時提供者接受目前的 Realtime 2 事件名稱，以及相容舊版 Codex 的輸出音訊與轉錄事件別名，因此相容的提供者快照即使漂移，也不會丟失助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷進行中的即時播放。若未設定，則遵循即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前，助理播放的最短持續時間。預設值：`250`。在低回聲房間中設為 `0` 可立即中斷，或在回聲較重的喇叭設定中提高此值。
- 若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇文字轉語音聲音。`cedar` 是目前 OpenAI TTS 模型上一個良好的偏男性聲音選擇。
- 每個 Discord 頻道的 `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄回合。
- 語音轉錄回合會根據 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態，用於需要擁有者權限的命令與頻道動作。代理工具可見性則遵循路由工作階段設定的工具政策。
- 對於純文字設定，Discord 語音為選擇加入；設定 `channels.discord.voice.enabled=true`（或保留現有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段，以及 `GuildVoiceStates` 閘道意圖。
- `channels.discord.intents.voiceStates` 可明確覆寫語音狀態意圖訂閱。保留未設定時，意圖會跟隨有效的語音啟用狀態。
- 如果 `voice.autoJoin` 對同一個公會有多個項目，OpenClaw 會加入該公會最後設定的頻道。
- `voice.allowedChannels` 是選用的駐留允許清單。保留未設定時，允許 `/vc join` 加入任何已授權的 Discord 語音頻道。設定時，`/vc join`、啟動時自動加入，以及機器人語音狀態移動都會限制在列出的 `{ guildId, channelId }` 項目中。將其設為空陣列可拒絕所有 Discord 語音加入。如果 Discord 將機器人移到允許清單之外，OpenClaw 會離開該頻道，並在有可用項目時重新加入設定的自動加入目標。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞給 `@discordjs/voice` 加入選項。
- 如果未設定，`@discordjs/voice` 預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用內建的 `libopus-wasm` 編解碼器接收 Discord 語音並播放即時原始 PCM。它隨附固定版本的 libopus WebAssembly 建置，且不需要原生 opus 附加元件。
- `voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試時，初始等待 `@discordjs/voice` Ready 的時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待其開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因另一位使用者開始說話而停止。為避免回授循環，OpenClaw 會在 TTS 播放期間忽略新的語音擷取；請在播放結束後再說話以進入下一回合。即時模式會將說話者開始事件作為插話訊號轉送給即時提供者。
- 在即時模式中，喇叭回聲進入開放麥克風可能看起來像插話並中斷播放。對於回聲較重的 Discord 房間，設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，可避免 OpenAI 因輸入音訊而自動中斷。如果仍希望 Discord 說話者開始事件中斷進行中的播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回聲/雜訊並忽略，記錄為已略過，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 Discord 回報說話者停止後，OpenClaw 在為 STT 完成該音訊片段前等待的時間。預設值：`2000`；如果 Discord 將正常停頓切成零碎的部分轉錄，請提高此值。
- 當 ElevenLabs 是選定的 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者回應串流開始。不支援串流的提供者會退回到合成暫存檔路徑。
- OpenClaw 也會監看接收解密失敗，並在短時間內重複失敗後，透過離開/重新加入語音頻道自動復原。
- 如果更新後接收日誌重複顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告與日誌。內建的 `@discordjs/voice` 系列包含來自 discord.js PR #11449 的上游填補修正，該修正關閉了 discord.js issue #11419。
- 當 OpenClaw 完成擷取的說話者片段時，預期會出現 `The operation was aborted` 接收事件；它們是詳細診斷資訊，不是警告。
- 詳細 Discord 語音日誌會為每個接受的說話者片段包含一行有界的 STT 轉錄預覽，因此除錯時能同時看到使用者端與代理回覆端，而不會傾印無界的轉錄文字。
- 在 `agent-proxy` 模式中，強制諮詢後援會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字，或尾端連接詞如 `and`，以及明顯不可操作的結尾語如「be right back」或「bye」。當這防止過時的佇列答案時，日誌會顯示 `forced agent consult skipped reason=...`。

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

- `followUsers` 接受原始 Discord 使用者 ID 和 `discord:<id>` 值。OpenClaw 會在比對語音狀態事件前正規化這兩種形式。
- 設定 `followUsers` 時，`followUsersEnabled` 預設為 `true`。將其設為 `false` 可保留已儲存清單，但停止自動語音跟隨。
- 當被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。當使用者移動時，OpenClaw 會跟著移動。當作用中的被跟隨使用者中斷連線時，OpenClaw 會離開。
- 如果多位被跟隨使用者在同一個公會中，且作用中的被跟隨使用者離開，OpenClaw 會先移動到另一位受追蹤的被跟隨使用者所在的頻道，再離開公會。如果多位被跟隨使用者同時移動，會以最新觀察到的語音狀態事件為準。
- `allowedChannels` 仍然適用。位於不允許頻道中的被跟隨使用者會被忽略，而跟隨所擁有的工作階段會移動到另一位被跟隨使用者，或離開。
- OpenClaw 會在啟動時及以有界間隔協調漏接的語音狀態事件。協調會抽樣設定的公會並限制每次執行的 REST 查找數，因此非常大的 `followUsers` 清單可能需要超過一個間隔才會收斂。
- 如果 Discord 或管理員在機器人跟隨使用者時移動機器人，OpenClaw 會重建語音工作階段，並在目的地被允許時保留跟隨擁有權。如果機器人被移到 `allowedChannels` 之外，OpenClaw 會離開，並在存在設定目標時重新加入。
- DAVE 接收復原可能會在重複解密失敗後離開並重新加入同一個頻道。跟隨所擁有的工作階段會在該復原路徑中保持其跟隨擁有權，因此後續被跟隨使用者中斷連線時仍會離開頻道。

選擇加入模式：

- 對於個人或操作員設定，若機器人應在你位於語音中時自動進入語音，請使用 `followUsers`。
- 對於即使沒有受追蹤使用者在語音中也應存在的固定房間機器人，請使用 `autoJoin`。
- 對於一次性加入或自動語音存在會令人意外的房間，請使用 `/vc join`。

Discord 語音編解碼器：

- 語音接收日誌會顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會先用同一個隨附的 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，再把封包交給 `@discordjs/voice`。
- 檔案與提供者串流播放會透過 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，然後使用 `libopus-wasm` 產生傳送到 Discord 的 Opus 封包串流。

STT 加 TTS 管線：

- Discord PCM 擷取會轉換成 WAV 暫存檔。
- `tools.media.audio` 會處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 逐字稿會透過 Discord 入口與路由送出，而回應 LLM 會以語音輸出政策執行；該政策會隱藏代理的 `tts` 工具並要求回傳文字，因為 Discord 語音負責最後的 TTS 播放。
- 設定 `voice.model` 時，只會覆寫這次語音頻道回合的回應 LLM。
- `voice.tts` 會覆蓋合併到 `messages.tts`；支援串流的提供者會直接餵給播放器，否則會在已加入的頻道中播放產生的音訊檔。

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

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得自己的路由 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段對話。即時模型只是語音前端；實質請求會交給已設定的 OpenClaw 代理。如果即時模型產生最終逐字稿但沒有呼叫諮詢工具，OpenClaw 會強制諮詢作為備援，因此預設行為仍像是在與代理對話。

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

將語音作為現有 Discord 頻道工作階段的延伸：

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

在 `agent-proxy` 模式中，機器人會加入已設定的語音頻道，但 OpenClaw 代理回合會使用目標頻道的一般路由工作階段與代理。即時語音工作階段會把回傳結果說回語音頻道。監督代理仍可依照其工具政策使用一般訊息工具，包括在合適時傳送一則獨立的 Discord 訊息。

委派的 OpenClaw 執行仍在進行時，新的 Discord 語音逐字稿會先被視為即時執行控制，再開始另一個代理回合。像是「status」、「cancel that」、「use the smaller fix」或「when you're done also check tests」這類片語會被分類為作用中工作階段的狀態、取消、引導或後續輸入。狀態、取消、已接受的引導與後續結果都會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理該請求。

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

當模型透過開放麥克風聽到自己的 Discord 播放聲，但你仍想用說話打斷它時，請使用這個設定。OpenClaw 會阻止 OpenAI 因原始輸入音訊而自動中斷，而 `bargeIn: true` 會讓 Discord 說話者開始事件與已作用中的說話者音訊，在下一個擷取回合送達 OpenAI 前取消作用中的即時回應。`audioEndMs` 低於 `minBargeInAudioEndMs` 的非常早期插話訊號會被視為可能的回音或雜訊並忽略，因此模型不會在第一個播放影格就被切斷。

預期語音日誌：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時啟動時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 說話者音訊時：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過時語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止或重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時諮詢時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 代理回答時：`discord voice: agent turn answer ...`
- 佇列精確語音時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音或雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 閒置播放時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊被切斷，請把即時語音日誌當成時間軸閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。橋接器會從此時開始計算助理輸出區塊、Discord PCM 位元組、提供者即時位元組與合成音訊時長。
2. `realtime speaker turn opened` 標記 Discord 說話者變成作用中。如果播放已在進行且已啟用 `bargeIn`，後面可能會接著出現 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標記該說話者回合收到的第一個實際音訊影格。這裡的 `outputActive=true` 或非零 `outputAudioMs` 表示麥克風在助理播放仍作用中時送出輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放仍作用中時看到了即時說話者音訊。這有助於區分真正的打斷，與沒有實用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求即時提供者取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，讓你能看到中斷前實際已播放多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放重設點。原因會指出是誰停止播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 會摘要擷取到的輸入回合。`chunks=0` 或 `hasAudio=false` 表示說話者回合已開啟，但沒有可用音訊到達即時橋接器。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：即時提供者在該日誌列之前產生的助理音訊時長。
- `audioMs`：OpenClaw 在播放停止前計算的助理音訊時長。
- `elapsedMs`：開啟與關閉播放串流或說話者回合之間的實際經過時間。
- `discordBytes`：傳送到 Discord 語音或從中接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送到即時提供者或從中接收的提供者格式 PCM 位元組。
- `playbackChunks`：針對作用中回應轉送到 Discord 的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取的說話者音訊影格與說話者回合關閉之間的間隔。

常見模式：

- 立即切斷且伴隨 `source=active-speaker-audio`、較小的 `outputAudioMs`，並且附近是同一位使用者，通常表示喇叭回音進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低喇叭音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後面接著 `speaker turn closed ... hasAudio=false` 表示 Discord 回報說話者開始，但沒有音訊到達 OpenClaw。這可能是暫時性的 Discord 語音事件、雜訊閘行為，或用戶端短暫觸發麥克風。
- `audio playback stopped reason=stream-close` 且附近沒有插話或 `provider-clear-audio`，表示本機 Discord 播放串流意外結束。請檢查前面的提供者與 Discord 播放器日誌。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊作用中時刻意丟棄輸入。如果你想讓語音打斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供者 VAD 回報語音，但 OpenClaw 沒有可中斷的作用中播放。這不應該切斷音訊。

憑證會依元件解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`/`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或提供者的一般驗證設定則用於即時提供者驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並且需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要閘道主機上有 `ffmpeg` 和 `ffprobe` 才能檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一個承載中同時包含文字和語音訊息）。
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

  <Accordion title="伺服器訊息意外遭封鎖">

    - 驗證 `groupPolicy`
    - 驗證 `channels.discord.guilds` 下的伺服器允許清單
    - 如果伺服器的 `channels` 對應存在，則只允許列出的頻道
    - 驗證 `requireMention` 行為與提及模式

    實用檢查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 為 false 但仍遭封鎖">
    常見原因：

    - `groupPolicy="allowlist"` 但沒有相符的伺服器/頻道允許清單
    - `requireMention` 設定在錯誤位置（必須位於 `channels.discord.guilds` 或頻道項目下）
    - 傳送者遭伺服器/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型記錄：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 閘道佇列調整項：

    - 單一帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord 閘道監聽器工作，不控制代理程式回合生命週期

    Discord 不會對已排入佇列的代理程式回合套用頻道擁有的逾時。訊息監聽器會立即交接，而排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` 中繼資料。暫時性失敗會退回到 Discord 預設閘道 URL，並在記錄中受到速率限制。

    中繼資料逾時調整項：

    - 單一帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定未設置時的環境變數後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="閘道 READY 逾時重新啟動">
    OpenClaw 會在啟動期間與執行階段重新連線後等待 Discord 的閘道 `READY` 事件。具有啟動錯開安排的多帳號設定，可能需要比預設值更長的啟動 READY 時窗。

    READY 逾時調整項：

    - 啟動單一帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定未設置時的啟動環境變數後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單一帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定未設置時的執行階段環境變數後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不相符">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 與配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人迴圈">
    預設會忽略由機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則，以避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該機器人的機器人訊息。

    OpenClaw 也隨附共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。每當 `allowBots` 允許由機器人撰寫的訊息抵達分派時，Discord 會將傳入事件對應到 `(account, channel, bot pair)` 事實，而通用配對防護會在該配對超過設定的事件預算後抑制該配對。此防護可防止過去必須由 Discord 速率限制停止的失控雙機器人迴圈；它不會影響單一機器人部署，或保持在預算內的一次性機器人回覆。

    預設設定（設定 `allowBots` 時生效）：

    - `maxEventsPerWindow: 20` -- 機器人配對可在滑動時窗內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動時窗長度
    - `cooldownSeconds: 60` -- 一旦預算觸發，任一方向的每則額外機器人對機器人訊息都會在一分鐘內被丟棄

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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 中斷">

    - 保持 OpenClaw 為最新版本（`openclaw update`），以確保 Discord 語音接收復原邏輯存在
    - 確認 `channels.discord.voice.daveEncryption=true`（預設）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，僅在需要時調整
    - 觀察記錄中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，請收集記錄，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史進行比較

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（監聽器預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 閘道：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 遞送：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制傳出的 Discord 上傳，預設 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態顯示：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全與操作

- 將機器人權杖視為祕密（在受監督環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最小權限的 Discord 權限。
- 如果命令部署/狀態已過期，請重新啟動閘道，並使用 `openclaw channels status --probe` 重新檢查。

## 相關

<CardGroup cols={2}>
  <Card title="配對" icon="link" href="/zh-TW/channels/pairing">
    將 Discord 使用者配對到閘道。
  </Card>
  <Card title="群組" icon="users" href="/zh-TW/channels/groups">
    群組聊天與允許清單行為。
  </Card>
  <Card title="頻道路由" icon="route" href="/zh-TW/channels/channel-routing">
    將傳入訊息路由至代理程式。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-TW/gateway/security">
    威脅模型與強化。
  </Card>
  <Card title="多代理程式路由" icon="sitemap" href="/zh-TW/concepts/multi-agent">
    將伺服器與頻道對應至代理程式。
  </Card>
  <Card title="斜線命令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為。
  </Card>
</CardGroup>
