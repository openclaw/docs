---
read_when:
    - 正在開發 Discord 通道功能
summary: Discord bot 支援狀態、功能與設定
title: Discord
x-i18n:
    generated_at: "2026-06-27T18:54:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

可透過官方 Discord 閘道用於私訊和公會頻道。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-TW/channels/pairing">
    Discord 私訊預設為配對模式。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生命令行為與命令目錄。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-TW/channels/troubleshooting">
    跨頻道診斷與修復流程。
  </Card>
</CardGroup>

## 快速設定

你需要建立一個含有機器人的新應用程式、將機器人新增到你的伺服器，並將它配對到 OpenClaw。我們建議將你的機器人新增到你自己的私人伺服器。如果你還沒有伺服器，請[先建立一個](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（選擇 **建立我自己的 > 給我和我的朋友**）。

<Steps>
  <Step title="Create a Discord application and bot">
    前往 [Discord 開發者入口網站](https://discord.com/developers/applications)，然後點擊 **新增應用程式**。將它命名為類似「OpenClaw」的名稱。

    點擊側邊欄的 **機器人**。將 **使用者名稱** 設為你要稱呼 OpenClaw 代理程式的名稱。

  </Step>

  <Step title="Enable privileged intents">
    仍在 **機器人** 頁面，向下捲動到 **特殊權限閘道意圖** 並啟用：

    - **訊息內容意圖**（必要）
    - **伺服器成員意圖**（建議；角色允許清單和名稱對 ID 比對需要）
    - **狀態意圖**（選用；只有在需要狀態更新時才需要）

  </Step>

  <Step title="Copy your bot token">
    在 **機器人** 頁面向上捲回，然後點擊 **重設權杖**。

    <Note>
    儘管名稱如此，這會產生你的第一個權杖，並沒有任何東西被「重設」。
    </Note>

    複製權杖並儲存在某處。這是你的 **機器人權杖**，稍後會需要用到。

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    點擊側邊欄的 **OAuth2**。你將產生一個具備正確權限的邀請 URL，用來將機器人新增到你的伺服器。

    向下捲動到 **OAuth2 URL 產生器** 並啟用：

    - `bot`
    - `applications.commands`

    下方會出現 **機器人權限** 區段。至少啟用：

    **一般權限**
      - 檢視頻道
    **文字權限**
      - 傳送訊息
      - 讀取訊息歷史記錄
      - 嵌入連結
      - 附加檔案
      - 新增反應（選用）

    這是一般文字頻道的基準集合。如果你打算在 Discord 討論串中發文，包括會建立或繼續討論串的論壇或媒體頻道工作流程，也請啟用 **在討論串中傳送訊息**。
    複製底部產生的 URL，貼到瀏覽器中，選取你的伺服器，然後點擊 **繼續** 以連線。現在你應該會在 Discord 伺服器中看到你的機器人。

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    回到 Discord 應用程式，你需要啟用開發者模式，才能複製內部 ID。

    1. 點擊 **使用者設定**（頭像旁的齒輪圖示）→ **進階** → 開啟 **開發者模式**
    2. 在側邊欄中右鍵點擊你的 **伺服器圖示** → **複製伺服器 ID**
    3. 右鍵點擊你 **自己的頭像** → **複製使用者 ID**

    將你的 **伺服器 ID** 和 **使用者 ID** 與機器人權杖一起保存，下一步你會將這三者都傳送給 OpenClaw。

  </Step>

  <Step title="Allow DMs from server members">
    若要讓配對運作，Discord 需要允許你的機器人向你傳送私訊。右鍵點擊你的 **伺服器圖示** → **隱私設定** → 開啟 **直接訊息**。

    這可讓伺服器成員（包括機器人）向你傳送私訊。如果你想搭配 OpenClaw 使用 Discord 私訊，請保持啟用。如果你只打算使用公會頻道，可以在配對後停用私訊。

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    你的 Discord 機器人權杖是秘密資訊（類似密碼）。在傳訊給你的代理程式之前，先在執行 OpenClaw 的機器上設定它。

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
    對於受管理的服務安裝，請從存在 `DISCORD_BOT_TOKEN` 的 shell 執行 `openclaw gateway install`，或將變數儲存在 `~/.openclaw/.env`，讓服務能在重新啟動後解析 env SecretRef。
    如果你的主機被 Discord 的啟動應用程式查詢封鎖或速率限制，請從開發者入口網站設定 Discord 應用程式/用戶端 ID，讓啟動可略過該 REST 呼叫。預設帳號使用 `channels.discord.applicationId`；如果你執行多個 Discord 機器人，則使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        在任何現有頻道（例如 Telegram）與你的 OpenClaw 代理程式聊天並告知它。如果 Discord 是你的第一個頻道，請改用命令列介面 / 設定分頁。

        >「我已經在設定中設定 Discord 機器人權杖。請使用使用者 ID `<user_id>` 和伺服器 ID `<server_id>` 完成 Discord 設定。」
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

        預設帳號的 env 備援：

```bash
DISCORD_BOT_TOKEN=...
```

        對於腳本化或遠端設定，請使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 寫入相同的 JSON5 區塊，然後不加 `--dry-run` 重新執行。支援明文 `token` 值。`channels.discord.token` 也支援跨 env/file/exec 提供者的 SecretRef 值。請參閱[秘密資訊管理](/zh-TW/gateway/secrets)。

        對於多個 Discord 機器人，請將每個機器人權杖和應用程式 ID 放在各自的帳號下。頂層 `channels.discord.applicationId` 會被帳號繼承，因此只有在每個帳號都應使用相同應用程式 ID 時，才在該處設定。

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

  <Step title="Approve first DM pairing">
    等到閘道正在執行後，在 Discord 中私訊你的機器人。它會回覆一組配對碼。

    <Tabs>
      <Tab title="Ask your agent">
        將配對碼透過你現有的頻道傳送給你的代理程式：

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

    你現在應該可以透過私訊在 Discord 中與你的代理程式聊天。

  </Step>
</Steps>

<Note>
權杖解析會感知帳號。設定中的權杖值優先於 env 備援。`DISCORD_BOT_TOKEN` 只用於預設帳號。
如果兩個已啟用的 Discord 帳號解析為相同的機器人權杖，OpenClaw 只會為該權杖啟動一個閘道監控器。來自設定的權杖優先於預設 env 備援；否則第一個已啟用的帳號會優先，重複帳號會被報告為已停用。
對於進階的對外呼叫（訊息工具/頻道動作），明確的逐呼叫 `token` 會用於該呼叫。這適用於傳送和讀取/探測類動作（例如 read/search/fetch/thread/pins/permissions）。帳號策略/重試設定仍來自作用中執行階段快照中選取的帳號。
</Note>

## 建議：設定公會工作區

私訊可正常運作後，你可以將 Discord 伺服器設定為完整工作區，讓每個頻道都取得自己的代理程式工作階段與自己的脈絡。這建議用於只有你和你的機器人的私人伺服器。

<Steps>
  <Step title="Add your server to the guild allowlist">
    這會讓你的代理程式能在伺服器上的任何頻道回應，而不只是私訊。

    <Tabs>
      <Tab title="Ask your agent">
        >「將我的 Discord 伺服器 ID `<server_id>` 新增到公會允許清單」
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

  <Step title="Allow responses without @mention">
    預設情況下，你的代理程式只有在公會頻道中被 @提及時才會回應。對私人伺服器而言，你可能希望它回應每則訊息。

    在公會頻道中，一般回覆預設會自動發布。對於共用的常駐聊天室，選擇啟用 `messages.groupChat.visibleReplies: "message_tool"`，讓代理程式可以潛伏，並只在它判定頻道回覆有用時才發文。這最適合搭配最新世代、工具可靠的模型，例如 GPT 5.5。環境房間事件會保持安靜，除非工具傳送訊息。完整潛伏模式設定請參閱[環境房間事件](/zh-TW/channels/ambient-room-events)。

    如果 Discord 顯示正在輸入，且記錄顯示權杖使用量，但沒有發出訊息，請檢查該輪是否設定為環境房間事件，或是否選擇啟用了 message-tool 可見回覆。

    <Tabs>
      <Tab title="Ask your agent">
        >「允許我的代理程式在此伺服器上回應，而不需要被 @提及」
      </Tab>
      <Tab title="Config">
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

        若要要求可見群組/頻道回覆透過 message-tool 傳送，請設定 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    預設情況下，長期記憶（MEMORY.md）只會載入於私訊工作階段。公會頻道不會自動載入 MEMORY.md。

    <Tabs>
      <Tab title="Ask your agent">
        >「當我在 Discord 頻道中提問時，如果你需要來自 MEMORY.md 的長期脈絡，請使用 memory_search 或 memory_get。」
      </Tab>
      <Tab title="Manual">
        如果你需要在每個頻道中使用共用脈絡，請將穩定的指示放在 `AGENTS.md` 或 `USER.md`（它們會被注入到每個工作階段）。將長期筆記保留在 `MEMORY.md`，並視需要透過記憶工具存取。
      </Tab>
    </Tabs>

  </Step>
</Steps>

現在，在你的 Discord 伺服器上建立一些頻道並開始聊天。你的代理程式可以看到頻道名稱，而且每個頻道都會取得自己的隔離工作階段，因此你可以設定 `#coding`、`#home`、`#research`，或任何符合你工作流程的頻道。

## 執行階段模型

- 閘道負責 Discord 連線。
- 回覆路由是確定性的：Discord 傳入回覆會回到 Discord。
- Discord 伺服器/頻道中繼資料會作為不受信任的
  情境加入模型提示，而不是作為使用者可見的回覆前綴。如果模型把該封套
  複製回來，OpenClaw 會從外送回覆與
  未來重播情境中移除複製的中繼資料。
- 預設情況下（`session.dmScope=main`），直接聊天會共用代理主工作階段（`agent:main:main`）。
- 伺服器頻道會使用隔離的工作階段鍵（`agent:<agentId>:discord:channel:<channelId>`）。
- 群組私訊預設會被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜線命令會在隔離的命令工作階段中執行（`agent:<agentId>:discord:slash:<userId>`），同時仍攜帶 `CommandTargetSessionKey` 到已路由的對話工作階段。
- 傳送到 Discord 的純文字排程/心跳偵測公告會使用最終的
  助理可見回答一次。當代理送出多個可傳遞酬載時，媒體與結構化組件酬載仍會
  保持多訊息形式。

## 論壇頻道

Discord 論壇與媒體頻道只接受討論串貼文。OpenClaw 支援兩種建立方式：

- 傳送訊息到論壇父層（`channel:<forumId>`）以自動建立討論串。討論串標題會使用訊息的第一個非空白行。
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

論壇父層不接受 Discord 組件。如果你需要組件，請傳送到討論串本身（`channel:<threadId>`）。

## 互動式組件

OpenClaw 支援代理訊息使用 Discord components v2 容器。使用訊息工具搭配 `components` 酬載。互動結果會作為一般傳入訊息路由回代理，並遵循現有的 Discord `replyToMode` 設定。

支援的區塊：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 動作列最多允許 5 個按鈕或單一選取選單
- 選取類型：`string`、`user`、`role`、`mentionable`、`channel`

預設情況下，組件只能使用一次。設定 `components.reusable=true` 可允許按鈕、選取項目與表單在過期前多次使用。

若要限制誰可以點擊按鈕，請在該按鈕上設定 `allowedUsers`（Discord 使用者 ID、標籤或 `*`）。設定後，不相符的使用者會收到一則短暫的拒絕訊息。

組件回呼預設會在 30 分鐘後過期。設定 `channels.discord.agentComponents.ttlMs` 可變更預設 Discord 帳號的回呼登錄生命週期，或設定 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 可在多帳號設定中覆寫單一帳號。此值以毫秒為單位，必須是正整數，並上限為 `86400000`（24 小時）。較長的 TTL 適用於需要按鈕維持可用的審查或核准工作流程，但也會延長舊 Discord 訊息仍可觸發動作的時間窗口。請優先使用符合工作流程的最短 TTL，並在過期回呼可能令人意外時保留預設值。

`/model` 與 `/models` 斜線命令會開啟互動式模型選擇器，包含提供者、模型與相容執行階段下拉選單，以及提交步驟。`/models add` 已淘汰，現在會傳回淘汰訊息，而不是從聊天註冊模型。選擇器回覆是短暫的，且只有呼叫它的使用者可以使用。Discord 選取選單限制為 25 個選項，因此當你想讓選擇器只顯示針對所選提供者（例如 `openai` 或 `vllm`）動態探索到的模型時，請將 `provider/*` 項目加入 `agents.defaults.models`。

檔案附件：

- `file` 區塊必須指向附件參照（`attachment://<filename>`）
- 透過 `media`/`path`/`filePath` 提供附件（單一檔案）；多個檔案請使用 `media-gallery`
- 當上傳名稱應符合附件參照時，使用 `filename` 覆寫上傳名稱

互動視窗表單：

- 加入 `components.modal`，最多可有 5 個欄位
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
    `channels.discord.dmPolicy` 控制私訊存取。`channels.discord.allowFrom` 是標準的私訊允許清單。

    - `pairing`（預設）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果私訊政策不是開放，未知使用者會被封鎖（或在 `pairing` 模式中提示配對）。

    多帳號優先順序：

    - `channels.discord.accounts.default.allowFrom` 只套用到 `default` 帳號。
    - 對於單一帳號，`allowFrom` 優先於舊版 `dm.allowFrom`。
    - 當具名帳號本身的 `allowFrom` 與舊版 `dm.allowFrom` 未設定時，會繼承 `channels.discord.allowFrom`。
    - 具名帳號不會繼承 `channels.discord.accounts.default.allowFrom`。

    舊版 `channels.discord.dm.policy` 與 `channels.discord.dm.allowFrom` 仍會為相容性而讀取。`openclaw doctor --fix` 會在不變更存取權的情況下，盡可能將它們遷移到 `dmPolicy` 與 `allowFrom`。

    傳遞用的私訊目標格式：

    - `user:<id>`
    - `<@id>` 提及

    當頻道預設值作用中時，裸數字 ID 通常會解析為頻道 ID，但列在帳號有效私訊 `allowFrom` 中的 ID 會為相容性而被視為使用者私訊目標。

  </Tab>

  <Tab title="Access groups">
    Discord 私訊與文字命令授權可以在 `channels.discord.allowFrom` 中使用動態 `accessGroup:<name>` 項目。

    存取群組名稱會在訊息頻道之間共用。若靜態群組的成員以每個頻道的一般 `allowFrom` 語法表示，請使用 `type: "message.senders"`；若 Discord 頻道目前的 `ViewChannel` 受眾應動態定義成員資格，請使用 `type: "discord.channelAudience"`。共用的存取群組行為記錄於此：[存取群組](/zh-TW/channels/access-groups)。

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

    Discord 文字頻道沒有獨立的成員清單。`type: "discord.channelAudience"` 會將成員資格模型化為：私訊寄件者是已設定伺服器的成員，且在套用角色與頻道覆寫後，目前對已設定頻道具有有效的 `ViewChannel` 權限。

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

    查詢會失敗即關閉。如果 Discord 傳回 `Missing Access`、成員查詢失敗，或頻道屬於不同伺服器，私訊寄件者會被視為未授權。

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
    - 選用的寄件者允許清單：`users`（建議使用穩定 ID）與 `roles`（僅限角色 ID）；如果任一項已設定，寄件者符合 `users` 或 `roles` 時即允許
    - 預設停用直接名稱/標籤比對；只有作為緊急相容模式時，才啟用 `channels.discord.dangerouslyAllowNameMatching: true`
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

    如果你只設定 `DISCORD_BOT_TOKEN` 且未建立 `channels.discord` 區塊，執行階段後援會是 `groupPolicy="allowlist"`（記錄中會有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    伺服器訊息預設需要提及才會通過。

    提及偵測包含：

    - 明確提及機器人
    - 已設定的提及模式（`agents.list[].groupChat.mentionPatterns`，後援為 `messages.groupChat.mentionPatterns`）
    - 支援情境中的隱含回覆機器人行為

    撰寫外送 Discord 訊息時，請使用標準提及語法：使用者用 `<@USER_ID>`、頻道用 `<#CHANNEL_ID>`，角色用 `<@&ROLE_ID>`。不要使用舊版 `<@!USER_ID>` 暱稱提及形式。

    `requireMention` 依伺服器/頻道設定（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可選擇性丟棄提及其他使用者/角色但未提及機器人的訊息（不包含 @everyone/@here）。

    群組私訊：

    - 預設：忽略（`dm.groupEnabled=false`）
    - 可透過 `dm.groupChannels` 選用允許清單（頻道 ID 或 slug）

  </Tab>
</Tabs>

### 基於角色的代理路由

使用 `bindings[].match.roles` 依角色 ID 將 Discord 伺服器成員路由到不同代理。以角色為基礎的繫結只接受角色 ID，並且會在 peer 或 parent-peer 繫結之後、guild-only 繫結之前評估。如果某個繫結也設定其他 match 欄位（例如 `peer` + `guildId` + `roles`），所有已設定的欄位都必須相符。

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

- `commands.native` 預設為 `"auto"`，並且會為 Discord 啟用。
- 各頻道覆寫：`channels.discord.commands.native`。
- `commands.native=false` 會在啟動期間略過 Discord 斜線命令註冊與清理。先前註冊的命令可能會繼續在 Discord 中可見，直到你從 Discord 應用程式中移除它們。
- 原生命令驗證使用與一般訊息處理相同的 Discord allowlists/政策。
- 對未授權的使用者而言，命令仍可能在 Discord UI 中可見；執行時仍會強制套用 OpenClaw 驗證並回傳「未授權」。

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

    注意：`off` 會停用隱含的回覆串接。明確的 `[[reply_to_*]]` 標籤仍會被遵守。
    `first` 一律會將隱含的原生回覆參照附加到該回合的第一則傳出 Discord 訊息。
    `batched` 只有在傳入事件是多則訊息的防抖批次時，
    才會附加 Discord 的隱含原生回覆參照。當你希望原生回覆主要用於
    模糊的爆量聊天，而不是每個單則訊息回合時，這很有用。

    訊息 ID 會顯示在 context/history 中，讓代理可以指定特定訊息。

  </Accordion>

  <Accordion title="連結預覽">
    Discord 預設會為 URL 產生豐富連結嵌入。OpenClaw 預設會抑制傳出 Discord 訊息上的這些生成嵌入，因此代理傳送的 URL 會維持為純連結，除非你選擇啟用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    設定 `channels.discord.accounts.<id>.suppressEmbeds` 可覆寫單一帳號。代理 message-tool 傳送也可以為單一訊息傳入 `suppressEmbeds: false`。明確的 Discord `embeds` payload 不會受到預設連結預覽設定抑制。

  </Accordion>

  <Accordion title="即時串流預覽">
    OpenClaw 可以透過傳送暫時訊息，並在文字抵達時編輯該訊息來串流草稿回覆。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（預設）。`progress` 會保留一個可編輯的狀態草稿，並以工具進度更新，直到最終送出；共用的起始標籤是一行滾動文字，因此一旦有足夠工作出現，它就會像其他內容一樣捲走。`streamMode` 是舊版執行階段別名。執行 `openclaw doctor --fix` 以將已保存的設定重寫為標準鍵。

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
    - `block` 會發出草稿大小的區塊（使用 `draftChunk` 調整大小與中斷點，並限制在 `textChunkLimit` 內）。
    - 媒體、錯誤與明確回覆的最終訊息會取消待處理的預覽編輯。
    - `streaming.preview.toolProgress`（預設 `true`）控制工具/進度更新是否重用預覽訊息。
    - 工具/進度列在可用時會呈現為精簡的表情符號 + 標題 + 詳細資料，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（預設 `false`）可選擇在暫時進度草稿中加入助理 commentary/preamble 文字。Commentary 會在顯示前清理、保持暫時性，且不會改變最終答案傳遞。
    - `streaming.progress.maxLineChars` 控制每行進度預覽預算。散文會在單字邊界縮短；命令與路徑詳細資料會保留有用的後綴。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制精簡進度列中的 command/exec 詳細資料：`raw`（預設）或 `status`（僅工具標籤）。

    隱藏原始 command/exec 文字，同時保留精簡進度列：

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

    預覽串流僅支援文字；媒體回覆會退回一般傳遞。當明確啟用 `block` 串流時，OpenClaw 會略過預覽串流以避免雙重串流。

  </Accordion>

  <Accordion title="歷史、脈絡與執行緒行為">
    伺服器歷史脈絡：

    - `channels.discord.historyLimit` 預設 `20`
    - 後援：`messages.groupChat.historyLimit`
    - `0` 停用

    DM 歷史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    執行緒行為：

    - Discord 執行緒會作為頻道工作階段路由，並繼承父頻道設定，除非已覆寫。
    - 執行緒工作階段會繼承父頻道工作階段層級的 `/model` 選擇，作為僅模型後援；執行緒本機的 `/model` 選擇仍具優先權，且不會複製父逐字稿歷史，除非啟用逐字稿繼承。
    - `channels.discord.thread.inheritParent`（預設 `false`）讓新的自動執行緒選擇從父逐字稿植入。各帳號覆寫位於 `channels.discord.accounts.<id>.thread.inheritParent`。
    - Message-tool reactions 可以解析 `user:<id>` DM 目標。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 會在回覆階段啟用後援期間保留。

    頻道主題會作為**不受信任**脈絡注入。Allowlists 會控管誰可以觸發代理，但不是完整的補充脈絡遮蔽邊界。

  </Accordion>

  <Accordion title="子代理的執行緒繫結工作階段">
    Discord 可以將執行緒繫結到工作階段目標，讓該執行緒中的後續訊息持續路由到相同工作階段（包含子代理工作階段）。

    命令：

    - `/focus <target>` 將目前/新執行緒繫結到子代理/工作階段目標
    - `/unfocus` 移除目前執行緒繫結
    - `/agents` 顯示作用中的執行與繫結狀態
    - `/session idle <duration|off>` 檢查/更新 focused 繫結的不活動自動取消聚焦
    - `/session max-age <duration|off>` 檢查/更新 focused 繫結的硬性最長存續時間

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
    - `spawnSessions` 控制為 `sessions_spawn({ thread: true })` 與 ACP 執行緒產生自動建立/繫結執行緒。預設：`true`。
    - `defaultSpawnContext` 控制執行緒繫結產生的原生子代理脈絡。預設：`"fork"`。
    - 已棄用的 `spawnSubagentSessions`/`spawnAcpSessions` 鍵會由 `openclaw doctor --fix` 遷移。
    - 如果某個帳號停用執行緒繫結，`/focus` 與相關執行緒繫結操作將無法使用。

    請參閱[子代理](/zh-TW/tools/subagents)、[ACP 代理](/zh-TW/tools/acp-agents)與[設定參考](/zh-TW/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持續性 ACP 頻道繫結">
    針對穩定的「always-on」ACP 工作區，設定目標為 Discord 對話的頂層 typed ACP 繫結。

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

    - `/acp spawn codex --bind here` 會就地繫結目前頻道或執行緒，並讓未來訊息保持在相同 ACP 工作階段。執行緒訊息會繼承父頻道繫結。
    - 在已繫結的頻道或執行緒中，`/new` 與 `/reset` 會就地重設相同 ACP 工作階段。暫時執行緒繫結可在作用中時覆寫目標解析。
    - `spawnSessions` 會透過 `--thread auto|here` 控管子執行緒建立/繫結。

    請參閱 [ACP 代理](/zh-TW/tools/acp-agents)了解繫結行為詳細資料。

  </Accordion>

  <Accordion title="反應通知">
    各伺服器反應通知模式：

    - `off`
    - `own`（預設）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反應事件會轉為系統事件，並附加到已路由的 Discord 工作階段。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 會在 OpenClaw 處理傳入訊息時傳送確認表情符號。

    解析順序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 代理身分表情符號後援（`agents.list[].identity.emoji`，否則為 "👀"）

    注意：

    - Discord 接受 unicode 表情符號或自訂表情符號名稱。
    - 使用 `""` 可停用某個頻道或帳號的反應。

  </Accordion>

  <Accordion title="設定寫入">
    預設會啟用由頻道發起的設定寫入。

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

  <Accordion title="閘道代理">
    使用 `channels.discord.proxy` 透過 HTTP(S) proxy 路由 Discord 閘道 WebSocket 流量與啟動 REST 查詢（application ID + allowlist 解析）。

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

    備註：

    - 允許清單可以使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 時，才會依名稱/slug 比對成員顯示名稱
    - 查詢會使用原始訊息 ID，並受時間範圍限制
    - 如果查詢失敗，代理訊息會被視為機器人訊息並遭丟棄，除非 `allowBots=true`

  </Accordion>

  <Accordion title="傳出提及別名">
    當代理需要對已知 Discord 使用者使用確定性的傳出提及時，請使用 `mentionAliases`。鍵是不含前導 `@` 的 handle；值是 Discord 使用者 ID。未知 handle、`@everyone`、`@here`，以及 Markdown 程式碼 span 內的提及都會保持不變。

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
    當你設定狀態或活動欄位，或啟用自動上線狀態時，系統會套用上線狀態更新。

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

    活動類型對照表：

    - 0：正在玩
    - 1：正在串流（需要 `activityUrl`）
    - 2：正在聆聽
    - 3：正在觀看
    - 4：自訂（使用活動文字作為狀態；emoji 可選）
    - 5：正在競賽

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

    自動上線狀態會將執行階段可用性對應到 Discord 狀態：healthy => online、degraded 或 unknown => idle、exhausted 或 unavailable => dnd。可選的文字覆寫：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支援 `{reason}` 預留位置）

  </Accordion>

  <Accordion title="Discord 中的核准">
    Discord 支援在私訊中以按鈕處理核准，也可以選擇在來源頻道發布核准提示。

    設定路徑：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可選；可行時會退回使用 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，預設：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    當 `enabled` 未設定或為 `"auto"`，且至少能解析出一位核准者時，Discord 會自動啟用原生 exec 核准；核准者可來自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不會從頻道 `allowFrom`、舊版 `dm.allowFrom`，或直接訊息 `defaultTo` 推斷 exec 核准者。若要明確停用 Discord 作為原生核准用戶端，請設定 `enabled: false`。

    對於 `/diagnostics` 和 `/export-trajectory` 等敏感的僅擁有者群組命令，OpenClaw 會私下傳送核准提示與最終結果。當發起命令的擁有者有 Discord 擁有者路由時，它會先嘗試 Discord 私訊；如果不可用，則退回使用 `commands.ownerAllowFrom` 中第一個可用的擁有者路由，例如 Telegram。

    當 `target` 為 `channel` 或 `both` 時，核准提示會在頻道中可見。只有已解析的核准者可以使用按鈕；其他使用者會收到短暫顯示的拒絕訊息。核准提示包含命令文字，因此只有在可信任頻道中才應啟用頻道傳遞。如果無法從工作階段金鑰推導出頻道 ID，OpenClaw 會退回使用私訊傳遞。

    Discord 也會呈現其他聊天頻道使用的共用核准按鈕。原生 Discord 轉接器主要新增核准者私訊路由與頻道扇出。
    當這些按鈕存在時，它們是主要的核准使用者體驗；OpenClaw
    只有在工具結果表示聊天核准不可用，或手動核准是唯一路徑時，
    才應包含手動 `/approve` 命令。
    如果 Discord 原生核准執行階段未啟用，OpenClaw 會保留
    本機確定性的 `/approve <id> <decision>` 提示可見。如果
    執行階段已啟用，但原生卡片無法傳遞到任何目標，
    OpenClaw 會在同一聊天中傳送備援通知，內容包含待核准項目的確切 `/approve`
    命令。

    閘道驗證與核准解析遵循共用閘道用戶端合約（`plugin:` ID 透過 `plugin.approval.resolve` 解析；其他 ID 透過 `exec.approval.resolve` 解析）。核准預設會在 30 分鐘後過期。

    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具與動作閘門

Discord 訊息動作包含訊息傳送、頻道管理、管理、上線狀態和中繼資料動作。

核心範例：

- 訊息傳送：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反應：`react`、`reactions`、`emojiList`
- 管理：`timeout`、`kick`、`ban`
- 上線狀態：`setPresence`

`event-create` 動作接受可選的 `image` 參數（URL 或本機檔案路徑），用於設定排程事件封面圖片。

動作閘門位於 `channels.discord.actions.*` 下。

預設閘門行為：

| 動作群組                                                                                                                                                                 | 預設     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已啟用   |
| roles                                                                                                                                                                    | 已停用   |
| moderation                                                                                                                                                               | 已停用   |
| presence                                                                                                                                                                 | 已停用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 來處理 exec 核准與跨情境標記。Discord 訊息動作也可以接受 `components` 來提供自訂 UI（進階；需要透過 discord 工具建構 component payload），而舊版 `embeds` 仍可使用，但不建議使用。

- `channels.discord.ui.components.accentColor` 設定 Discord component 容器使用的強調色（十六進位）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 針對每個帳號設定。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord component callback 保持註冊的時間長度（預設 `1800000`，最大 `86400000`）。使用 `channels.discord.accounts.<id>.agentComponents.ttlMs` 針對每個帳號設定。
- 當 components v2 存在時，會忽略 `embeds`。
- 預設會抑制純 URL 預覽。當單一傳出連結應展開時，請在訊息動作上設定 `suppressEmbeds: false`。

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

Discord 有兩個不同的語音介面：即時 **語音頻道**（連續對話）和 **語音訊息附件**（波形預覽格式）。閘道同時支援兩者。

### 語音頻道

設定檢查清單：

1. 在 Discord Developer Portal 啟用 Message Content Intent。
2. 使用角色/使用者允許清單時，啟用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scope 邀請機器人。
4. 在目標語音頻道授予 Connect、Speak、Send Messages 和 Read Message History 權限。
5. 啟用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 設定 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制工作階段。此命令使用帳號預設代理，並遵循與其他 Discord 命令相同的允許清單和群組政策規則。

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
- `voice.mode` 控制對話路徑。預設值是 `agent-proxy`：即時語音前端會處理回合時序、中斷與播放，透過 `openclaw_agent_consult` 將實質工作委派給路由到的 OpenClaw 代理，並把結果視為該說話者輸入的 Discord 文字提示。`stt-tts` 保留較舊的批次 STT 加 TTS 流程。`bidi` 讓即時模型直接對話，同時公開 `openclaw_agent_consult` 供 OpenClaw 大腦使用。
- `voice.agentSession` 控制哪個 OpenClaw 對話會接收語音回合。保持未設定即可使用語音頻道自己的工作階段，或設定 `{ mode: "target", target: "channel:<text-channel-id>" }`，讓語音頻道作為既有 Discord 文字頻道工作階段（例如 `#maintainers`）的麥克風／喇叭延伸。
- `voice.model` 會覆寫 Discord 語音回應與即時諮詢使用的 OpenClaw 代理大腦。保持未設定即可繼承路由到的代理模型。它與 `voice.realtime.model` 是分開的。
- `voice.followUsers` 讓機器人可跟隨選定使用者加入、移動及離開 Discord 語音。行為規則與範例請參閱[在語音中跟隨使用者](#follow-users-in-voice)。
- `agent-proxy` 會透過 `discord-voice` 路由語音，這會保留說話者與目標工作階段的一般擁有者／工具授權，但會隱藏代理的 `tts` 工具，因為 Discord 語音負責播放。預設情況下，`agent-proxy` 會讓擁有者說話者的諮詢具備完整的擁有者等效工具存取權（`voice.realtime.toolPolicy: "owner"`），並強烈偏好在實質回答前先諮詢 OpenClaw 代理（`voice.realtime.consultPolicy: "always"`）。在該預設的 `always` 模式中，即時層不會在諮詢答案前自動說出填充內容；它會擷取並轉錄語音，然後說出路由到的 OpenClaw 答案。如果 Discord 仍在播放第一個答案時有多個強制諮詢答案完成，後續的精確語音答案會排入佇列，直到播放閒置，而不是在句子中途替換語音。
- 在 `stt-tts` 模式中，STT 使用 `tools.media.audio`；`voice.model` 不會影響轉錄。
- 在即時模式中，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 會設定即時音訊工作階段。若要搭配 Codex 大腦使用 OpenAI Realtime 2，請使用 `voice.realtime.model: "gpt-realtime-2"` 與 `voice.model: "openai/gpt-5.5"`。
- 即時語音模式預設會在即時提供者指令中包含小型 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 個人檔案，因此快速直接回合會保有與路由到的 OpenClaw 代理相同的身分、使用者基礎與人格。將 `voice.realtime.bootstrapContextFiles` 設為子集可自訂此行為，或設為 `[]` 以停用。支援的即時啟動檔案僅限這些個人檔案；`AGENTS.md` 仍保留在一般代理情境中。注入的個人檔案情境不會取代 `openclaw_agent_consult` 來處理工作區工作、目前事實、記憶查詢或工具支援的動作。
- 在 OpenAI `agent-proxy` 即時模式中，設定 `voice.realtime.requireWakeName: true` 可讓 Discord 即時語音保持靜默，直到轉錄以喚醒名稱開始或結束。設定的喚醒名稱必須是一個或兩個詞。如果未設定 `voice.realtime.wakeNames`，OpenClaw 會使用路由到的代理 `name` 加上 `OpenClaw`，並在無法使用時改用代理 ID 加上 `OpenClaw`。喚醒名稱門控會停用即時提供者自動回應、透過 OpenClaw 代理諮詢路徑路由已接受的回合，並在最終轉錄抵達前，從部分轉錄辨識出開頭喚醒名稱時給出簡短的語音確認。
- OpenAI 即時提供者接受目前的 Realtime 2 事件名稱，以及與舊版 Codex 相容的輸出音訊與轉錄事件別名，因此相容的提供者快照即使漂移，也不會丟失助理音訊。
- `voice.realtime.bargeIn` 控制 Discord 說話者開始事件是否會中斷作用中的即時播放。若未設定，它會跟隨即時提供者的輸入音訊中斷設定。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 即時插話截斷音訊前的最短助理播放時間。預設值：`250`。在低回音房間中設為 `0` 可立即中斷，或針對回音較重的喇叭設定提高此值。
- 若要在 Discord 播放中使用 OpenAI 語音，請設定 `voice.tts.provider: "openai"`，並在 `voice.tts.providers.openai.speakerVoice` 下選擇文字轉語音聲音。在目前的 OpenAI TTS 模型上，`cedar` 是不錯的偏男性聲音選擇。
- 每個 Discord 頻道的 `systemPrompt` 覆寫會套用到該語音頻道的語音轉錄回合。
- 語音轉錄回合會從 Discord `allowFrom`（或 `dm.allowFrom`）推導擁有者狀態，用於需要擁有者門控的命令與頻道動作。代理工具可見性會依照路由工作階段設定的工具政策。
- 對於純文字設定，Discord 語音是選用功能；設定 `channels.discord.voice.enabled=true`（或保留既有的 `channels.discord.voice` 區塊）即可啟用 `/vc` 命令、語音執行階段與 `GuildVoiceStates` 閘道意圖。
- `channels.discord.intents.voiceStates` 可明確覆寫語音狀態意圖訂閱。保持未設定即可讓意圖跟隨有效的語音啟用狀態。
- 如果 `voice.autoJoin` 對同一個伺服器有多個項目，OpenClaw 會加入該伺服器最後設定的頻道。
- `voice.allowedChannels` 是選用的駐留允許清單。保持未設定即可允許 `/vc join` 加入任何已授權的 Discord 語音頻道。設定後，`/vc join`、啟動時自動加入及機器人語音狀態移動都會限制在列出的 `{ guildId, channelId }` 項目。將其設為空陣列會拒絕所有 Discord 語音加入。如果 Discord 將機器人移到允許清單之外，OpenClaw 會離開該頻道，並在有可用的已設定自動加入目標時重新加入。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 會傳遞給 `@discordjs/voice` 加入選項。
- 若未設定，`@discordjs/voice` 預設值為 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用內建的 `libopus-wasm` 編解碼器來接收 Discord 語音並播放即時原始 PCM。它隨附釘選版本的 libopus WebAssembly 建置，不需要原生 opus 附加元件。
- `voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間。預設值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在銷毀已中斷連線的語音工作階段前，等待其開始重新連線的時間。預設值：`15000`。
- 在 `stt-tts` 模式中，語音播放不會只因另一位使用者開始說話就停止。為避免回授迴圈，OpenClaw 會在 TTS 播放時忽略新的語音擷取；請在播放完成後再說下一個回合。即時模式會將說話者開始事件作為插話訊號轉送給即時提供者。
- 在即時模式中，喇叭回音進入開啟的麥克風可能看起來像插話並中斷播放。對於回音較重的 Discord 房間，設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` 可避免 OpenAI 因輸入音訊而自動中斷。如果你仍希望 Discord 說話者開始事件中斷作用中播放，請加入 `voice.realtime.bargeIn: true`。OpenAI 即時橋接會將短於 `voice.realtime.minBargeInAudioEndMs` 的播放截斷視為可能的回音／雜訊並忽略，記錄為已跳過，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 OpenClaw 在 Discord 回報說話者停止後，等待多久才將該音訊片段定稿供 STT 使用。預設值：`2000`；如果 Discord 將正常停頓切成斷續的部分轉錄，請提高此值。
- 當 ElevenLabs 是選定的 TTS 提供者時，Discord 語音播放會使用串流 TTS，並從提供者回應串流開始。沒有串流支援的提供者會退回到合成暫存檔路徑。
- OpenClaw 也會監看接收解密失敗，並在短時間窗口內重複失敗後，透過離開／重新加入語音頻道自動復原。
- 如果更新後接收日誌反覆顯示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，請收集相依性報告與日誌。內建的 `@discordjs/voice` 版本線包含來自 discord.js PR #11449 的上游填補修正，該修正關閉了 discord.js issue #11419。
- `The operation was aborted` 接收事件在 OpenClaw 定稿已擷取的說話者片段時是預期行為；它們是詳細診斷，不是警告。
- 詳細 Discord 語音日誌會為每個已接受的說話者片段包含一行有界的 STT 轉錄預覽，因此除錯時可看到使用者端與代理回覆端，而不會傾印無界的轉錄文字。
- 在 `agent-proxy` 模式中，強制諮詢備援會略過可能不完整的轉錄片段，例如以 `...` 結尾的文字，或像 `and` 這樣的尾端連接詞，以及明顯不可執行的結尾語，例如「馬上回來」或「再見」。當這防止陳舊的排隊答案時，日誌會顯示 `forced agent consult skipped reason=...`。

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
- 設定 `followUsers` 時，`followUsersEnabled` 預設為 `true`。將其設為 `false` 可保留已儲存清單，但停止自動語音跟隨。
- 當被跟隨的使用者加入允許的語音頻道時，OpenClaw 會加入該頻道。當使用者移動時，OpenClaw 會跟著移動。當作用中的被跟隨使用者中斷連線時，OpenClaw 會離開。
- 如果同一個伺服器中有多個被跟隨使用者，而作用中的被跟隨使用者離開，OpenClaw 會先移到另一個已追蹤被跟隨使用者的頻道，再離開該伺服器。如果多個被跟隨使用者同時移動，會以最新觀察到的語音狀態事件為準。
- `allowedChannels` 仍會套用。被跟隨使用者若在不允許的頻道中會被忽略，而跟隨擁有的工作階段會移到另一位被跟隨使用者，或離開。
- OpenClaw 會在啟動時及有界間隔內協調遺漏的語音狀態事件。協調會取樣已設定的伺服器，並限制每次執行的 REST 查詢數，因此非常大的 `followUsers` 清單可能需要超過一個間隔才會收斂。
- 如果 Discord 或管理員在機器人跟隨使用者時移動機器人，OpenClaw 會重建語音工作階段，並在目的地允許時保留跟隨擁有權。如果機器人被移到 `allowedChannels` 之外，OpenClaw 會離開，並在存在已設定目標時重新加入。
- DAVE 接收復原可能會在重複解密失敗後離開並重新加入同一個頻道。跟隨擁有的工作階段會透過該復原路徑保留跟隨擁有權，因此之後被跟隨使用者中斷連線時仍會離開頻道。

選擇加入模式：

- 對於個人或操作者設定，如果機器人應該在你使用語音時自動進入語音，請使用 `followUsers`。
- 對於即使沒有已追蹤使用者在語音中也應該存在的固定房間機器人，請使用 `autoJoin`。
- 對於一次性加入，或自動語音存在會令人意外的房間，請使用 `/vc join`。

Discord 語音編解碼器：

- 語音接收記錄會顯示 `discord voice: opus decoder: libopus-wasm`。
- 即時播放會先使用同一個內建的 `libopus-wasm` 套件，將原始 48 kHz 立體聲 PCM 編碼為 Opus，再把封包交給 `@discordjs/voice`。
- 檔案與提供者串流播放會使用 ffmpeg 轉碼為原始 48 kHz 立體聲 PCM，接著使用 `libopus-wasm` 產生傳送到 Discord 的 Opus 封包串流。

STT 加 TTS 管線：

- Discord PCM 擷取會轉換成 WAV 暫存檔。
- `tools.media.audio` 會處理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 轉錄文字會透過 Discord 入口與路由傳送，而回應 LLM 會以語音輸出政策執行，該政策會隱藏代理程式的 `tts` 工具並要求傳回文字，因為 Discord 語音負責最終的 TTS 播放。
- 設定 `voice.model` 時，只會覆寫此語音頻道回合的回應 LLM。
- `voice.tts` 會覆蓋合併到 `messages.tts`；支援串流的提供者會直接餵給播放器，否則會在已加入的頻道中播放產生的音訊檔。

預設代理程式代理語音頻道工作階段範例：

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

沒有 `voice.agentSession` 區塊時，每個語音頻道都會取得自己的已路由 OpenClaw 工作階段。例如，`/vc join channel:234567890123456789` 會與該 Discord 語音頻道的工作階段交談。即時模型只是語音前端；實質請求會交給已設定的 OpenClaw 代理程式。如果即時模型在未呼叫諮詢工具的情況下產生最終轉錄文字，OpenClaw 會強制執行諮詢作為備援，因此預設行為仍會像是在與代理程式交談。

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

在 `agent-proxy` 模式中，機器人會加入已設定的語音頻道，但 OpenClaw 代理程式回合會使用目標頻道的一般已路由工作階段與代理程式。即時語音工作階段會把傳回的結果說回語音頻道。監督代理程式仍可依照其工具政策使用一般訊息工具，包括在那是正確動作時傳送另一則 Discord 訊息。

委派的 OpenClaw 執行作用中時，新的 Discord 語音轉錄文字會在啟動另一個代理程式回合前，被視為即時執行控制。像是「status」、「cancel that」、「use the smaller fix」或「when you're done also check tests」等片語，會被分類為作用中工作階段的狀態、取消、導向或後續輸入。狀態、取消、已接受導向與後續結果會說回語音頻道，讓呼叫者知道 OpenClaw 是否已處理該請求。

實用目標形式：

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

當模型透過開放麥克風聽到自己的 Discord 播放，但你仍想透過說話打斷它時，請使用此設定。OpenClaw 會阻止 OpenAI 在原始輸入音訊上自動中斷，而 `bargeIn: true` 會讓 Discord 說話者開始事件與已作用中的說話者音訊，在下一個擷取回合抵達 OpenAI 前取消作用中的即時回應。`audioEndMs` 低於 `minBargeInAudioEndMs` 的非常早期插話訊號會被視為可能的回音/雜訊並忽略，因此模型不會在第一個播放影格就被切斷。

預期語音記錄：

- 加入時：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 即時啟動時：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 說話者音訊時：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 略過過時語音時：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 即時回應完成時：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重設時：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 即時諮詢時：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 代理程式回答時：`discord voice: agent turn answer ...`
- 佇列精確語音時：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，接著是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 偵測到插話時：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，接著是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 即時中斷時：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，接著可能是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回音/雜訊時：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 停用插話時：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 閒置播放時：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要偵錯音訊被切斷的問題，請將即時語音記錄當作時間軸閱讀：

1. `realtime audio playback started` 表示 Discord 已開始播放助理音訊。橋接器會從這一點開始計算助理輸出區塊、Discord PCM 位元組、提供者即時位元組，以及合成音訊持續時間。
2. `realtime speaker turn opened` 標記 Discord 說話者開始作用。如果播放已經作用中且 `bargeIn` 已啟用，後續可能會出現 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 標記該說話者回合收到第一個實際音訊影格。這裡的 `outputActive=true` 或非零 `outputAudioMs` 表示麥克風在助理播放仍作用中時正在傳送輸入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助理播放作用中時看到即時說話者音訊。這有助於區分真正的中斷，以及沒有實用音訊的 Discord 說話者開始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求即時提供者取消或截斷作用中的回應。它包含 `outputAudioMs`、`outputActive` 與 `playbackChunks`，因此你可以看出中斷前實際播放了多少助理音訊。
6. `realtime audio playback stopped reason=...` 是本機 Discord 播放重設點。原因會說明誰停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 摘要擷取到的輸入回合。`chunks=0` 或 `hasAudio=false` 表示說話者回合已開啟，但沒有可用音訊抵達即時橋接器。`interruptedPlayback=true` 表示該輸入回合與助理輸出重疊，並觸發插話邏輯。

實用欄位：

- `outputAudioMs`：即時提供者在該記錄行之前產生的助理音訊持續時間。
- `audioMs`：OpenClaw 在播放停止前計算到的助理音訊持續時間。
- `elapsedMs`：開啟與關閉播放串流或說話者回合之間的實際經過時間。
- `discordBytes`：傳送到 Discord 語音或從 Discord 語音接收的 48 kHz 立體聲 PCM 位元組。
- `realtimeBytes`：傳送到即時提供者或從即時提供者接收的提供者格式 PCM 位元組。
- `playbackChunks`：為作用中回應轉送到 Discord 的助理音訊區塊。
- `sinceLastAudioMs`：最後擷取的說話者音訊影格與說話者回合關閉之間的間隔。

常見模式：

- 伴隨 `source=active-speaker-audio`、很小的 `outputAudioMs`，且同一使用者在附近的立即切斷，通常表示揚聲器回音進入麥克風。提高 `voice.realtime.minBargeInAudioEndMs`、降低揚聲器音量、使用耳機，或設定 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 後接 `speaker turn closed ... hasAudio=false` 表示 Discord 回報說話者開始，但沒有音訊抵達 OpenClaw。這可能是暫時性的 Discord 語音事件、雜訊閘行為，或用戶端短暫觸發麥克風。
- 沒有鄰近插話或 `provider-clear-audio` 的 `audio playback stopped reason=stream-close`，表示本機 Discord 播放串流意外結束。請檢查前面的提供者與 Discord 播放器記錄。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助理音訊作用中時刻意丟棄輸入。如果你希望語音中斷播放，請啟用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供者 VAD 回報語音，但 OpenClaw 沒有可中斷的作用中播放。這不應切斷音訊。

憑證會依元件解析：`voice.model` 使用 LLM 路由驗證、`tools.media.audio` 使用 STT 驗證、`messages.tts`/`voice.tts` 使用 TTS 驗證，而 `voice.realtime.providers` 或提供者的一般驗證設定則使用即時提供者驗證。

### 語音訊息

Discord 語音訊息會顯示波形預覽，並需要 OGG/Opus 音訊。OpenClaw 會自動產生波形，但需要在閘道主機上安裝 `ffmpeg` 與 `ffprobe` 以進行檢查與轉換。

- 提供**本機檔案路徑**（URL 會被拒絕）。
- 省略文字內容（Discord 會拒絕同一個 payload 中同時包含文字與語音訊息）。
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
    - 如果存在伺服器 `channels` 對應表，則只允許列出的頻道
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
    - 傳送者被伺服器/頻道 `users` 允許清單封鎖

  </Accordion>

  <Accordion title="長時間執行的 Discord 回合或重複回覆">

    典型日誌：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord 閘道佇列調整項：

    - 單帳號：`channels.discord.eventQueue.listenerTimeout`
    - 多帳號：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 這只控制 Discord 閘道 listener 工作，不控制代理回合生命週期

    Discord 不會對排入佇列的代理回合套用頻道擁有的逾時。訊息 listener 會立即交接，排入佇列的 Discord 執行會保留每個工作階段的順序，直到工作階段/工具/執行階段生命週期完成或中止工作。

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
    OpenClaw 會在連線前擷取 Discord `/gateway/bot` metadata。暫時性失敗會退回 Discord 預設閘道 URL，並在日誌中受到速率限制。

    Metadata 逾時調整項：

    - 單帳號：`channels.discord.gatewayInfoTimeoutMs`
    - 多帳號：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 設定未設置時的 env 後援：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="閘道 READY 逾時重新啟動">
    OpenClaw 會在啟動期間與執行階段重新連線後，等待 Discord 閘道 `READY` 事件。採用啟動錯開的多帳號設定，可能需要比預設值更長的啟動 READY 時間窗。

    READY 逾時調整項：

    - 啟動單帳號：`channels.discord.gatewayReadyTimeoutMs`
    - 啟動多帳號：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 設定未設置時的啟動 env 後援：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 啟動預設值：`15000`（15 秒），最大值：`120000`
    - 執行階段單帳號：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 執行階段多帳號：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 設定未設置時的執行階段 env 後援：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 執行階段預設值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="權限稽核不一致">
    `channels status --probe` 權限檢查只適用於數字頻道 ID。

    如果你使用 slug 鍵，執行階段比對仍可運作，但 probe 無法完整驗證權限。

  </Accordion>

  <Accordion title="DM 與配對問題">

    - DM 已停用：`channels.discord.dm.enabled=false`
    - DM 政策已停用：`channels.discord.dmPolicy="disabled"`（舊版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配對核准

  </Accordion>

  <Accordion title="機器人對機器人的迴圈">
    預設會忽略由機器人撰寫的訊息。

    如果你設定 `channels.discord.allowBots=true`，請使用嚴格的提及與允許清單規則來避免迴圈行為。
    建議使用 `channels.discord.allowBots="mentions"`，只接受提及該機器人的機器人訊息。

    OpenClaw 也隨附共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。每當 `allowBots` 允許由機器人撰寫的訊息進入派送時，Discord 會將入站事件對應到 `(account, channel, bot pair)` 事實，且通用配對防護會在該配對超過設定的事件預算後抑制它。此防護可避免過去必須靠 Discord 速率限制停止的失控雙機器人迴圈；它不會影響單機器人部署，或維持在預算內的一次性機器人回覆。

    預設設定（設定 `allowBots` 時啟用）：

    - `maxEventsPerWindow: 20` -- 機器人配對可在滑動時間窗內交換 20 則訊息
    - `windowSeconds: 60` -- 滑動時間窗長度
    - `cooldownSeconds: 60` -- 一旦超過預算，接下來一分鐘內任一方向的每則額外機器人對機器人訊息都會被丟棄

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

  <Accordion title="語音 STT 因 DecryptionFailed(...) 而丟棄">

    - 保持 OpenClaw 為最新版本（`openclaw update`），以便具備 Discord 語音接收復原邏輯
    - 確認 `channels.discord.voice.daveEncryption=true`（預設）
    - 從 `channels.discord.voice.decryptionFailureTolerance=24`（上游預設值）開始，只在需要時調整
    - 觀察日誌中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自動重新加入後仍持續失敗，請收集日誌，並與 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收歷史記錄比對

  </Accordion>
</AccordionGroup>

## 設定參考

主要參考：[設定參考 - Discord](/zh-TW/gateway/config-channels#discord)。

<Accordion title="高訊號 Discord 欄位">

- 啟動/驗證：`enabled`、`token`、`accounts.*`、`allowBots`
- 政策：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 指令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件佇列：`eventQueue.listenerTimeout`（listener 預算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 閘道：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回覆/歷史記錄：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 傳遞：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 串流：`streaming`（舊版別名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒體/重試：`mediaMaxMb`（限制 Discord 對外上傳，預設 `100MB`）、`retry`
- 動作：`actions.*`
- 狀態顯示：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、頂層 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全性與操作

- 將機器人 token 視為秘密（在受監督的環境中建議使用 `DISCORD_BOT_TOKEN`）。
- 授予最低權限的 Discord 權限。
- 如果指令部署/狀態過期，請重新啟動閘道，並使用 `openclaw channels status --probe` 重新檢查。

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
  <Card title="斜線指令" icon="terminal" href="/zh-TW/tools/slash-commands">
    原生指令行為。
  </Card>
</CardGroup>
