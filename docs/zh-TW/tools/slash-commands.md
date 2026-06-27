---
read_when:
    - 使用或設定聊天指令
    - 偵錯命令路由或權限
    - 了解 skill 命令如何註冊
sidebarTitle: Slash commands
summary: 所有可用的斜線命令、指令與行內捷徑 — 設定、路由與各介面的行為。
title: 斜線命令
x-i18n:
    generated_at: "2026-06-27T20:09:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

閘道會處理以 `/` 開頭、作為獨立訊息傳送的命令。
僅限主機的 bash 命令使用 `! <cmd>`（`/bash <cmd>` 作為別名）。

當對話綁定到 ACP 工作階段時，一般文字會路由到 ACP
harness。閘道管理命令仍保持本機處理：`/acp ...` 一律會到達
OpenClaw 命令處理器，而只要該介面的命令處理已啟用，`/status` 與 `/unfocus` 也會保持本機處理。

## 三種命令類型

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    由閘道處理的獨立 `/...` 訊息。必須作為訊息中的
    唯一內容傳送。
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — 會在模型看到訊息前從訊息中移除。
    單獨傳送時會保留工作階段設定；與其他文字一起傳送時則作為行內提示。
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 會立即執行，並且在模型看到剩餘文字前被移除。僅限授權傳送者。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - 指令會在模型看到訊息前從訊息中移除。
    - 在**僅指令**訊息中（訊息只有指令），它們會保留到工作階段並回覆確認。
    - 在含有其他文字的**一般聊天**訊息中，它們會作為行內提示，且
      **不會**保留工作階段設定。
    - 指令僅適用於**授權傳送者**。如果設定了 `commands.allowFrom`，
      它就是唯一使用的允許清單；否則授權來自通道允許清單／配對加上
      `commands.useAccessGroups`。未授權傳送者的指令會被視為純文字。
  </Accordion>
</AccordionGroup>

## 設定

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  啟用在聊天訊息中解析 `/...`。在沒有原生命令的介面
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams）上，即使設定為 `false`，
  文字命令仍可運作。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  註冊原生命令。自動：Discord/Telegram 啟用；Slack 停用；
  對沒有原生支援的提供者會忽略。可用
  `channels.<provider>.commands.native` 依通道覆寫。在 Discord 上，`false` 會略過斜線命令
  註冊；先前已註冊的命令可能仍會保持可見，直到被移除。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支援時以原生方式註冊 skill 命令。自動：Discord/Telegram 啟用；
  Slack 停用。可用
  `channels.<provider>.commands.nativeSkills` 覆寫。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  啟用 `! <cmd>` 以執行主機 shell 命令（`/bash <cmd>` 別名）。需要
  `tools.elevated` 允許清單。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash 在切換到背景模式前等待的時間（`0` 會立即進入背景）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  啟用 `/config`（讀取／寫入 `openclaw.json`）。僅限擁有者。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  啟用 `/mcp`（讀取／寫入 `mcp.servers` 下由 OpenClaw 管理的 MCP 設定）。僅限擁有者。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  啟用 `/plugins`（外掛探索／狀態，以及安裝 + 啟用／停用）。寫入僅限擁有者。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  啟用 `/debug`（僅限執行階段的設定覆寫）。僅限擁有者。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  啟用 `/restart` 與閘道重新啟動工具動作。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  擁有者專用命令介面的明確擁有者允許清單。與
  `commands.allowFrom` 和 DM 配對存取分開。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  依通道設定：擁有者專用命令需要擁有者身分。當為 `true` 時，
  傳送者必須符合 `commands.ownerAllowFrom` 或持有內部 `operator.admin`
  scope。萬用字元 `allowFrom` 項目**不足以**通過。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制擁有者 ID 在系統提示中顯示的方式。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  當 `commands.ownerDisplay: "hash"` 時使用的 HMAC 密鑰。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  依提供者設定的命令授權允許清單。設定後，它就是命令與指令的
  **唯一**授權來源。使用 `"*"` 作為
  全域預設；提供者特定鍵會覆寫它。
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  當未設定 `commands.allowFrom` 時，強制對命令套用允許清單／政策。
</ParamField>

## 命令清單

命令來自三個來源：

- **核心內建：** `src/auto-reply/commands-registry.shared.ts`
- **產生的 dock 命令：** `src/auto-reply/commands-registry.data.ts`
- **外掛命令：** 外掛 `registerCommand()` 呼叫

可用性取決於設定旗標、通道介面，以及已安裝／啟用的
外掛。

### 核心命令

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | 命令 | 說明 |
    | --- | --- |
    | `/new [model]` | 封存目前工作階段並開始新的工作階段 |
    | `/reset [soft [message]]` | 就地重設目前工作階段。`soft` 會保留逐字稿、捨棄重用的命令列介面後端工作階段 ID，並重新執行啟動 |
    | `/name <title>` | 命名或重新命名目前工作階段。省略標題即可查看目前名稱與建議 |
    | `/compact [instructions]` | 壓縮工作階段內容。請參閱[壓縮](/zh-TW/concepts/compaction) |
    | `/stop` | 中止目前執行 |
    | `/session idle <duration\|off>` | 管理執行緒綁定的閒置到期 |
    | `/session max-age <duration\|off>` | 管理執行緒綁定的最大存活時間到期 |
    | `/export-session [path]` | 將目前工作階段匯出為 HTML。別名：`/export` |
    | `/export-trajectory [path]` | 匯出目前工作階段的 JSONL trajectory bundle。別名：`/trajectory` |

    <Note>
      Control UI 會攔截輸入的 `/new`，以建立並切換到新的
      dashboard 工作階段，除非已設定 `session.dmScope: "main"`，
      且目前父項是 agent 的 main session — 在該情況下，`/new`
      會就地重設 main session。輸入的 `/reset` 仍會執行閘道的
      就地重設。當你想清除固定的
      工作階段模型選擇時，請使用 `/model default`。
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | 命令 | 說明 |
    | --- | --- |
    | `/think <level\|default>` | 設定思考層級或清除工作階段覆寫。別名：`/thinking`、`/t` |
    | `/verbose on\|off\|full` | 切換詳細輸出。別名：`/v` |
    | `/trace on\|off` | 切換目前工作階段的外掛 trace 輸出 |
    | `/fast [status\|auto\|on\|off\|default]` | 顯示、設定或清除快速模式 |
    | `/reasoning [on\|off\|stream]` | 切換 reasoning 可見性。別名：`/reason` |
    | `/elevated [on\|off\|ask\|full]` | 切換 elevated 模式。別名：`/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | 顯示或設定 exec 預設值 |
    | `/model [name\|#\|status]` | 顯示或設定模型 |
    | `/models [provider] [page] [limit=<n>\|all]` | 列出已設定／可用授權的提供者或模型 |
    | `/queue <mode>` | 管理作用中執行的佇列行為。請參閱[佇列](/zh-TW/concepts/queue)與[佇列引導](/zh-TW/concepts/queue-steering) |
    | `/steer <message>` | 將指引注入作用中執行。別名：`/tell`。請參閱 [Steer](/zh-TW/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` 用於偵錯 — 一般使用時請保持**關閉**。
        - `/trace` 只會顯示外掛擁有的 trace/debug 行；一般詳細雜訊會保持關閉。
        - `/fast auto|on|off` 會保留工作階段覆寫；使用 Sessions UI 的 `inherit` 選項來清除它。
        - `/fast` 依提供者而異：OpenAI/Codex 會將它對應到 `service_tier=priority`；直接 Anthropic 請求會將它對應到 `service_tier=auto` 或 `standard_only`。
        - `/reasoning`、`/verbose` 和 `/trace` 在群組設定中有風險 — 它們可能會揭露內部 reasoning 或外掛診斷資訊。請在群組聊天中保持關閉。

      </Accordion>
      <Accordion title="Model switching details">
        - `/model` 會立即將新模型保留到工作階段。
        - 如果 agent 閒置，下一次執行會立刻使用它。
        - 如果有執行正在作用中，切換會標記為待處理，並在下一個乾淨的重試點套用。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | 命令 | 說明 |
    | --- | --- |
    | `/help` | 顯示簡短說明摘要 |
    | `/commands` | 顯示產生的命令目錄 |
    | `/tools [compact\|verbose]` | 顯示目前 agent 現在可使用的項目 |
    | `/status` | 顯示執行／執行階段狀態、閘道與系統上線時間、外掛健康狀態，以及提供者用量／配額 |
    | `/status plugins` | 顯示詳細外掛健康狀態：載入錯誤、隔離、通道失敗、相依性問題、相容性通知 |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | 管理目前工作階段的持久[目標](/zh-TW/tools/goal) |
    | `/diagnostics [note]` | 僅限擁有者的支援報告流程。每次都會要求 exec 核准 |
    | `/crestodian <request>` | 從擁有者 DM 執行 Crestodian 設定與修復輔助工具 |
    | `/tasks` | 列出目前工作階段的作用中／最近背景工作 |
    | `/context [list\|detail\|map\|json]` | 說明內容如何組裝 |
    | `/whoami` | 顯示你的傳送者 ID。別名：`/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 控制每則回應的用量頁尾（`reset`/`inherit`/`clear`/`default` 會清除工作階段覆寫，以重新繼承已設定的預設值），或列印本機成本摘要 |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | 命令 | 說明 |
    | --- | --- |
    | `/skill <name> [input]` | 依名稱執行 skill |
    | `/allowlist [list\|add\|remove] ...` | 管理允許清單項目。僅限文字 |
    | `/approve <id> <decision>` | 解決 exec 或外掛核准提示 |
    | `/btw <question>` | 在不變更工作階段內容的情況下提出旁支問題。別名：`/side`。請參閱 [BTW](/zh-TW/tools/btw) |
  </Accordion>

  <Accordion title="子代理與 ACP">
    | 命令 | 說明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 檢查目前工作階段的子代理執行 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | 管理 ACP 工作階段與執行階段選項 |
    | `/focus <target>` | 將目前 Discord 討論串或 Telegram 主題繫結到工作階段目標 |
    | `/unfocus` | 移除目前的討論串繫結 |
    | `/agents` | 列出目前工作階段中繫結到討論串的代理 |
  </Accordion>

  <Accordion title="僅限擁有者寫入與管理">
    | 命令 | 需求 | 說明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | 讀取或寫入 `openclaw.json`。僅限擁有者 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | 讀取或寫入由 OpenClaw 管理的 MCP 伺服器設定。僅限擁有者 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | 檢查或變更外掛狀態。寫入僅限擁有者。別名：`/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | 僅限執行階段的設定覆寫。僅限擁有者 |
    | `/restart` | `commands.restart: true`（預設） | 重新啟動 OpenClaw |
    | `/send on\|off\|inherit` | 擁有者 | 設定傳送政策 |
  </Accordion>

  <Accordion title="語音、TTS、頻道控制">
    | 命令 | 說明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | 控制 TTS。請參閱 [TTS](/zh-TW/tools/tts) |
    | `/activation mention\|always` | 設定群組啟用模式 |
    | `/bash <command>` | 執行主機 shell 命令。別名：`! <command>`。需要 `commands.bash: true` |
    | `!poll [sessionId]` | 檢查背景 bash 工作 |
    | `!stop [sessionId]` | 停止背景 bash 工作 |
  </Accordion>
</AccordionGroup>

### Dock 命令

Dock 命令會將作用中工作階段的回覆路由切換到另一個已連結頻道。
設定與疑難排解請參閱[頻道停靠](/zh-TW/concepts/channel-docking)。

由支援原生命令的頻道外掛產生：

- `/dock-discord`（別名：`/dock_discord`）
- `/dock-mattermost`（別名：`/dock_mattermost`）
- `/dock-slack`（別名：`/dock_slack`）
- `/dock-telegram`（別名：`/dock_telegram`）

Dock 命令需要 `session.identityLinks`。來源傳送者與目標對等方
必須位於同一個身分群組中。

### 內建外掛命令

| 命令                                                                                      | 說明                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | 切換記憶夢境整理。請參閱[夢境整理](/zh-TW/concepts/dreaming)                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | 管理裝置配對。請參閱[配對](/zh-TW/channels/pairing)                           |
| `/phone status\|arm ...\|disarm`                                                             | 暫時啟用高風險電話節點命令                                     |
| `/voice status\|list\|set <voiceId>`                                                         | 管理 Talk 語音設定。Discord 原生名稱：`/talkvoice`                       |
| `/card ...`                                                                                  | 傳送 LINE 富卡片預設。請參閱 [LINE](/zh-TW/channels/line)                           |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | 控制 Codex app-server 控制架構。請參閱 [Codex 控制架構](/zh-TW/plugins/codex-harness) |

僅限 QQ Bot：`/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### Skill 命令

使用者可叫用的 Skills 會公開為斜線命令：

- `/skill <name> [input]` 一律可作為通用進入點使用。
- Skills 可以註冊為直接命令（例如 OpenProse 的 `/prose`）。
- 原生 Skill 命令註冊由 `commands.nativeSkills` 和
  `channels.<provider>.commands.nativeSkills` 控制。
- 名稱會清理為 `a-z0-9_`（最多 32 個字元）；衝突時會加上數字尾碼。

<AccordionGroup>
  <Accordion title="Skill 命令分派">
    依預設，Skill 命令會像一般請求一樣路由到模型。

    Skills 可以宣告 `command-dispatch: tool`，直接路由到工具
    （具決定性，無模型參與）。範例：`/prose`（OpenProse 外掛）
    — 請參閱 [OpenProse](/zh-TW/prose)。

  </Accordion>
  <Accordion title="原生命令引數">
    Discord 會在需要時，針對動態選項與遺漏必要
    引數的按鈕選單使用自動完成。Telegram 和 Slack 會針對含有
    選項的命令顯示按鈕選單。動態選項會根據目標工作階段模型解析，因此像 `/think` 層級這類特定模型選項會遵循工作階段的 `/model` 覆寫。
  </Accordion>
</AccordionGroup>

## `/tools` — 代理現在可使用的項目

`/tools` 回答的是執行階段問題：**這個代理現在在這段
對話中可以使用什麼** — 不是靜態設定目錄。

```text
/tools         # compact view
/tools verbose # with short descriptions
```

結果以工作階段為範圍。變更代理、頻道、討論串、傳送者
授權或模型，都可能改變輸出。若要編輯設定檔與覆寫，
請使用 Control UI 工具面板或設定介面。

## `/model` — 模型選擇

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

在 Discord 上，`/model` 和 `/models` 會開啟具有供應商與
模型下拉選單的互動式選擇器。選擇器會遵循 `agents.defaults.models`，包括
`provider/*` 項目。

## `/config` — 磁碟上的設定寫入

<Note>
  僅限擁有者。預設停用 — 使用 `commands.config: true` 啟用。
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

設定會在寫入前驗證。無效變更會遭到拒絕。`/config`
更新會在重新啟動後保留。

## `/mcp` — MCP 伺服器設定

<Note>
  僅限擁有者。預設停用 — 使用 `commands.mcp: true` 啟用。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` 會將設定儲存在 OpenClaw 設定中，而不是嵌入式代理專案設定。

## `/debug` — 僅限執行階段的覆寫

<Note>
  僅限擁有者。預設停用 — 使用 `commands.debug: true` 啟用。
  覆寫會立即套用到新的設定讀取，但**不會**寫入磁碟。
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — 外掛管理

<Note>
  寫入僅限擁有者。預設停用 — 使用 `commands.plugins: true` 啟用。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable` 會更新外掛設定，並熱重新載入閘道
外掛執行階段，以供新的代理回合使用。`/plugins install` 會自動重新啟動受管理的
閘道，因為外掛來源模組已變更。

## `/trace` — 外掛追蹤輸出

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace` 會顯示以工作階段為範圍的外掛追蹤/偵錯行，而不需完整詳細
模式。它不會取代 `/debug`（執行階段覆寫）或 `/verbose`（一般
工具輸出）。

## `/btw` — 旁支問題

`/btw` 是關於目前工作階段情境的快速旁支問題。別名：`/side`。

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

不同於一般訊息：

- 使用目前工作階段作為背景情境。
- 在 Codex 控制架構工作階段中，會作為暫時性 Codex 旁支討論串執行。
- **不會**變更未來的工作階段情境。
- 不會寫入逐字稿歷史。

完整行為請參閱 [BTW 旁支問題](/zh-TW/tools/btw)。

## 介面注意事項

<AccordionGroup>
  <Accordion title="各介面的工作階段範圍">
    - **文字命令：**在一般聊天工作階段中執行（私訊共用 `main`，群組有自己的工作階段）。
    - **Discord 原生命令：**`agent:<agentId>:discord:slash:<userId>`
    - **Slack 原生命令：**`agent:<agentId>:slack:slash:<userId>`（前綴可透過 `channels.slack.slashCommand.sessionPrefix` 設定）
    - **Telegram 原生命令：**`telegram:slash:<userId>`（透過 `CommandTargetSessionKey` 指向聊天工作階段）
    - **`/stop`** 以作用中聊天工作階段為目標，以中止目前執行。

  </Accordion>
  <Accordion title="Slack 細節">
    `channels.slack.slashCommand` 支援單一 `/openclaw` 風格命令。
    使用 `commands.native: true` 時，請為每個內建
    命令建立一個 Slack 斜線命令。請註冊 `/agentstatus`（不是 `/status`），因為 Slack 保留
    `/status`。文字 `/status` 在 Slack 訊息中仍可使用。
  </Accordion>
  <Accordion title="快速路徑與行內捷徑">
    - 來自允許清單傳送者的純命令訊息會立即處理（略過佇列 + 模型）。
    - 行內捷徑（`/help`、`/commands`、`/status`、`/whoami`）也可以嵌入一般訊息中使用，並會在模型看到剩餘文字前被移除。
    - 未授權的純命令訊息會被靜默忽略；行內 `/...` 權杖會被視為純文字。

  </Accordion>
  <Accordion title="引數注意事項">
    - 命令可在命令與引數之間接受選用的 `:`（`/think: high`、`/send: on`）。
    - `/new <model>` 接受模型別名、`provider/model` 或供應商名稱（模糊比對）；若沒有符合項目，文字會被視為訊息本文。
    - `/allowlist add|remove` 需要 `commands.config: true`，並遵循頻道 `configWrites`。

  </Accordion>
</AccordionGroup>

## 供應商用量與狀態

- **供應商用量/配額**（例如「Claude 剩餘 80%」）會在啟用用量追蹤時，針對目前模型供應商顯示於 `/status`。
- **Token/快取行** 在 `/status` 中可以於即時工作階段快照稀疏時，退回使用最新的逐字稿用量項目。
- **執行與執行階段：**`/status` 會以 `Execution` 回報有效沙盒路徑，並以 `Runtime` 回報誰正在執行工作階段：`OpenClaw Default`、`OpenAI Codex`、命令列介面後端或 ACP 後端。
- **每次回應的 token/成本：**由 `/usage off|tokens|full` 控制。
- `/model status` 是關於模型/驗證/端點，而不是用量。

## 相關

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="puzzle-piece">
    Skill 斜線命令如何註冊與門控。
  </Card>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    建立會註冊自己斜線命令的 Skill。
  </Card>
  <Card title="BTW" href="/zh-TW/tools/btw" icon="comments">
    不變更工作階段情境的旁支問題。
  </Card>
  <Card title="Steer" href="/zh-TW/tools/steer" icon="compass">
    使用 `/steer` 在代理執行中途引導它。
  </Card>
</CardGroup>
