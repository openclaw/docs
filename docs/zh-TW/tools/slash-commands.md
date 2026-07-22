---
read_when:
    - 使用或設定聊天指令
    - 偵錯命令路由或權限
    - 瞭解 Skills 命令的註冊方式
sidebarTitle: Slash commands
summary: 所有可用的斜線命令、指令與行內快捷方式——包括設定、路由及各介面行為。
title: 斜線命令
x-i18n:
    generated_at: "2026-07-22T10:54:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ee5ee5e46d632a54ea92dea7ca61046288bf1998d05b08396107bec90e646fff
    source_path: tools/slash-commands.md
    workflow: 16
---

閘道會處理以 `/` 開頭、以獨立訊息傳送的命令。
僅限主機的 bash 命令使用 `! <cmd>`（`/bash <cmd>` 為其別名）。

當對話繫結至 ACP 工作階段時，一般文字會路由至 ACP
執行框架。閘道管理命令仍在本機處理：`/acp ...` 一律會送達
OpenClaw 命令處理常式；只要該介面已啟用命令處理，`/status` 與 `/unfocus` 也會留在本機處理。

## 三種命令類型

<CardGroup cols={3}>
  <Card title="命令" icon="terminal">
    由閘道處理、以獨立訊息傳送的 `/...`。必須是訊息中的
    唯一內容。
  </Card>
  <Card title="指令" icon="sliders">
    `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、
    `/exec`、`/model`、`/queue` — 會在模型看到訊息前從中移除。
    單獨傳送時會保存工作階段設定；與其他文字一同傳送時則作為
    行內提示。
  </Card>
  <Card title="行內捷徑" icon="bolt">
    `/help`、`/commands`、`/status`、`/whoami` — 會立即執行，並在模型看到其餘文字前
    從訊息中移除。僅限已授權的傳送者。
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="指令行為詳情">
    - 指令會在模型看到訊息前從中移除。
    - 在**僅含指令**的訊息中（訊息只包含指令），指令會
      保存至工作階段，並回覆確認訊息。
    - 在包含其他文字的**一般聊天**訊息中，指令會作為行內提示，
      且**不會**保存工作階段設定。
    - 指令僅適用於**已授權的傳送者**。若已設定 `commands.allowFrom`，
      它會是唯一使用的允許清單；否則，授權來源為
      頻道允許清單、配對，以及持續啟用的存取群組強制規則。未獲授權的
      傳送者所傳送的指令會被視為純文字。
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
  啟用聊天訊息中 `/...` 的剖析。在沒有原生命令的介面上
  （WhatsApp、WebChat、Signal、iMessage、Google Chat、Microsoft Teams），即使設為 `false`，
  文字命令仍可運作。
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  註冊原生命令。自動模式：Discord/Telegram 啟用；Slack 停用；
  不支援原生命令的提供者會忽略此設定。可使用
  `channels.<provider>.commands.native` 針對各頻道覆寫。在 Discord 上，`false` 會略過斜線命令
  註冊；先前註冊的命令可能會持續顯示，直到移除為止。
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支援時以原生方式註冊技能命令。自動模式：
  Discord/Telegram 啟用；Slack 停用。可使用
  `channels.<provider>.commands.nativeSkills` 覆寫。
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  啟用 `! <cmd>` 以執行主機 shell 命令（`/bash <cmd>` 為別名）。需要
  `tools.elevated` 允許清單。
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash 切換至背景模式前的等待時間（`0` 會
  立即在背景執行）。
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  啟用 `/config`（讀取／寫入 `openclaw.json`）。僅限擁有者。
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  啟用 `/mcp`（讀取／寫入 `mcp.servers` 下由 OpenClaw 管理的 MCP 設定）。僅限擁有者。
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  啟用 `/plugins`（外掛探索／狀態，以及安裝與啟用／停用）。寫入操作僅限擁有者。
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  啟用 `/debug`（僅限執行階段的設定覆寫）。僅限擁有者。
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  啟用 `/restart` 和外部 `SIGUSR1` 重新啟動要求。
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  擁有者專用命令介面的明確擁有者允許清單。與
  `commands.allowFrom` 和私訊配對存取分開。
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  各頻道設定：擁有者專用命令需要擁有者身分。當 `true` 時，
  傳送者必須符合 `commands.ownerAllowFrom`，或具有內部 `operator.admin`
  範圍。萬用字元 `allowFrom` 項目**並不足夠**。
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制擁有者 ID 在系統提示中如何顯示。
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  當 `commands.ownerDisplay: "hash"` 時使用的 HMAC 密鑰。
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  用於命令授權的各提供者允許清單。設定後，它會成為命令和指令的
  **唯一**授權來源。使用 `"*"` 設定
  全域預設值；提供者專用鍵會將其覆寫。
</ParamField>

## 命令清單

命令來自三個來源：

- **核心內建命令：** `src/auto-reply/commands-registry.shared.ts`
- **產生的 dock 命令：** `src/auto-reply/commands-registry.data.ts`
- **外掛命令：**外掛 `registerCommand()` 呼叫

可用性取決於設定旗標、頻道介面，以及已安裝／啟用的
外掛。

### 核心命令

<AccordionGroup>
  <Accordion title="工作階段與執行">
    | 命令 | 說明 |
    | --- | --- |
    | `/new [model]` | 封存目前的工作階段，並開始新的工作階段 |
    | `/reset [soft [message]]` | 就地重設目前的工作階段。`soft` 會保留逐字稿、捨棄重複使用的命令列介面後端工作階段 ID，並重新執行啟動程序 |
    | `/name <title>` | 命名或重新命名目前的工作階段。省略標題即可查看目前名稱與建議名稱 |
    | `/compact [instructions]` | 壓縮工作階段上下文。請參閱[壓縮](/zh-TW/concepts/compaction) |
    | `/stop` | 中止目前的執行 |
    | `/session idle <duration\|off>` | 管理討論串繫結的閒置到期時間 |
    | `/session max-age <duration\|off>` | 管理討論串繫結的最長存續期 |
    | `/export-session [path]` | 僅限擁有者。將目前的工作階段匯出為工作區內的 HTML。別名：`/export` |
    | `/export-trajectory [path]` | 匯出目前工作階段的 JSONL 軌跡套件。別名：`/trajectory` |

    明確指定的 `/export-session` 路徑會取代工作區內的現有檔案。
    省略路徑即可產生可避免名稱衝突的檔名。

    <Note>
      Control UI 會攔截輸入的 `/new`，以建立並切換至新的
      儀表板工作階段；但若已設定 `session.dmScope: "main"`，
      且目前的父工作階段是代理程式的主要工作階段，則 `/new`
      會就地重設主要工作階段。輸入的 `/reset` 仍會執行閘道的
      就地重設。若要清除已固定的
      工作階段模型選項，請使用 `/model default`。
    </Note>

  </Accordion>

  <Accordion title="模型與執行控制">
    | 命令 | 說明 |
    | --- | --- |
    | `/think <level\|default>` | 設定思考層級或清除工作階段覆寫。別名：`/thinking`、`/t` |
    | `/verbose on\|off\|full` | 切換詳細輸出。別名：`/v` |
    | `/trace on\|off` | 切換目前工作階段的外掛追蹤輸出 |
    | `/fast [status\|auto\|on\|off\|default]` | 顯示、設定或清除快速模式 |
    | `/reasoning [on\|off\|stream]` | 切換推理內容的可見性。別名：`/reason` |
    | `/elevated [on\|off\|ask\|full]` | 切換提升權限模式。別名：`/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | 顯示或設定 exec 預設值 |
    | `/login [codex\|openai\|openai-codex]` | 從私人聊天或 Web UI 工作階段配對 Codex/OpenAI 登入。僅限擁有者／管理員 |
    | `/model [name\|#\|status]` | 顯示或設定模型 |
    | `/models [provider] [page] [limit=<n>\|all]` | 列出已設定／認證可用的提供者或模型 |
    | `/queue <mode>` | 管理作用中執行的佇列行為。請參閱[佇列](/zh-TW/concepts/queue)和[佇列引導](/zh-TW/concepts/queue-steering) |
    | `/steer <message>` | 將引導內容注入作用中的執行。別名：`/tell`。請參閱[引導](/zh-TW/tools/steer) |

    <AccordionGroup>
      <Accordion title="詳細／追蹤／快速／推理安全性">
        - `/verbose` 用於偵錯 — 一般使用時請保持**關閉**。
        - `/trace` 只會顯示外掛所屬的追蹤／偵錯行；一般詳細訊息仍維持關閉。
        - `/fast auto|on|off` 會保存工作階段覆寫；請使用 Sessions UI 的 `inherit` 選項將其清除。
        - `/fast` 依提供者而異：OpenAI/Codex 會將其對應至 `service_tier=priority`；直接 Anthropic 要求則會對應至 `service_tier=auto` 或 `standard_only`。
        - `/reasoning`、`/verbose` 和 `/trace` 在群組環境中具有風險 — 可能會洩露內部推理或外掛診斷資訊。在群組聊天中請將其保持關閉。

      </Accordion>
      <Accordion title="模型切換詳情">
        - `/model` 會立即將新模型保存至工作階段。
        - 如果代理程式處於閒置狀態，下次執行會立即使用該模型。
        - 如果有執行正在進行，切換會標記為待處理，並在下一個適合重新嘗試的時點套用。

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="探索與狀態">
    | 命令 | 說明 |
    | --- | --- |
    | `/help` | 顯示簡短的說明摘要 |
    | `/commands` | 顯示產生的命令目錄 |
    | `/tools [compact\|verbose]` | 顯示目前代理程式現在可使用的項目 |
    | `/status` | 顯示執行／執行階段狀態、閘道與系統運作時間、外掛健康狀態，以及提供者用量／配額 |
    | `/status plugins` | 顯示詳細的外掛健康狀態：載入錯誤、隔離狀態、頻道外掛失敗、相依性問題、相容性通知。需要 `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | 管理目前工作階段的持久[目標](/zh-TW/tools/goal) |
    | `/diagnostics [note]` | 僅限擁有者的支援報告流程。每次都會要求 exec 核准 |
    | `/openclaw <request>` | 從擁有者私訊執行 OpenClaw 設定與修復輔助工具 |
    | `/tasks` | 列出目前工作階段中作用中／近期的背景工作 |
    | `/context [list\|detail\|map\|json]` | 說明上下文的組成方式 |
    | `/whoami` | 顯示你的傳送者 ID。別名：`/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 控制每次回應的用量頁尾（`reset`／`inherit`／`clear`／`default` 會清除工作階段覆寫，以重新繼承已設定的預設值），或輸出本機成本摘要 |
  </Accordion>

  <Accordion title="Skills、允許清單與核准">
    | 命令 | 說明 |
    | --- | --- |
    | `/skill <name> [input]` | 依名稱執行 Skill |
    | `/learn [request]` | 透過 [Skill Workshop](/zh-TW/tools/skill-workshop)，根據目前對話或指定來源草擬一個可供審查的 Skill |
    | `/allowlist [list\|add\|remove] ...` | 管理允許清單項目。僅限文字 |
    | `/approve <id> <decision>` | 處理 exec 或外掛核准提示 |
    | `/btw <question>` | 詢問附帶問題，而不變更工作階段脈絡。別名：`/side`。請參閱 [BTW](/zh-TW/tools/btw) |
  </Accordion>

  <Accordion title="子代理程式與 ACP">
    | 命令 | 說明 |
    | --- | --- |
    | `/subagents list\|log\|info` | 檢查目前工作階段的子代理程式執行紀錄 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | 管理 ACP 工作階段與執行階段選項。執行階段控制需要外部擁有者或內部閘道管理員身分 |
    | `/focus <target>` | 將目前 Discord 討論串或 Telegram 主題繫結至工作階段目標 |
    | `/unfocus` | 移除目前的討論串繫結 |
    | `/agents` | 列出目前工作階段中與討論串繫結的代理程式 |
  </Accordion>

  <Accordion title="僅限擁有者的寫入與管理">
    | 命令 | 需求 | 說明 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | 讀取或寫入 `openclaw.json`。僅限擁有者 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | 讀取或寫入由 OpenClaw 管理的 MCP 伺服器設定。僅限擁有者 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | 檢查或變更外掛狀態。寫入僅限擁有者。別名：`/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | 僅限執行階段的設定覆寫。僅限擁有者 |
    | `/restart` | `commands.restart: true`（預設） | 重新啟動 OpenClaw |
    | `/send on\|off\|inherit` | owner | 設定傳送原則 |
  </Accordion>

  <Accordion title="語音、TTS 與頻道控制">
    | 命令 | 說明 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | 控制 TTS。請參閱 [TTS](/zh-TW/tools/tts) |
    | `/activation mention\|always` | 設定群組啟用模式 |
    | `/bash <command>` | 執行主機 shell 命令。別名：`! <command>`。需要 `commands.bash: true` |
    | `!poll [sessionId]` | 檢查背景 bash 工作 |
    | `!stop [sessionId]` | 停止背景 bash 工作 |
  </Accordion>
</AccordionGroup>

### 停靠命令

停靠命令會將作用中工作階段的回覆路由切換至另一個已連結的頻道。
如需設定與疑難排解資訊，請參閱[頻道停靠](/zh-TW/concepts/channel-docking)。

由支援原生命令的頻道外掛產生：

- `/dock-discord`（別名：`/dock_discord`）
- `/dock-mattermost`（別名：`/dock_mattermost`）
- `/dock-slack`（別名：`/dock_slack`）
- `/dock-telegram`（別名：`/dock_telegram`）

停靠命令需要 `session.identityLinks`。來源傳送者與目標對等端
必須位於相同的身分群組中。

### 隨附外掛命令

| 命令                                                 | 說明                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | 切換記憶夢境整理（擁有者或閘道管理員）。請參閱[夢境整理](/zh-TW/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | 管理裝置配對。請參閱[配對](/zh-TW/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | 暫時啟用高風險節點命令（相機／螢幕／電腦／寫入）。請參閱[電腦操作](/zh-TW/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | 管理 Talk 語音設定。Discord 原生名稱：`/talkvoice`                                                                                                                                    |
| `/card ...`                                             | 傳送 LINE 複合式卡片預設。請參閱 [LINE](/zh-TW/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | 繫結、操控及檢查 Codex 應用程式伺服器測試框架（狀態、討論串、繼續、模型、快速模式、權限、壓縮、審查、MCP、Skills 等）。請參閱 [Codex 測試框架](/zh-TW/plugins/codex-harness) |

僅限 QQ Bot：`/bot-ping`、`/bot-version`、`/bot-help`、`/bot-upgrade`、`/bot-logs`

### Skill 命令

可由使用者叫用的 Skills 會公開為斜線命令：

- `/skill <name> [input]` 一律可作為通用進入點使用。
- Skills 可註冊為直接命令（例如 OpenProse 的 `/prose`）。
- 原生 Skill 命令註冊由 `commands.nativeSkills` 與
  `channels.<provider>.commands.nativeSkills` 控制。
- 名稱會清理成 `a-z0-9_`（最多 32 個字元）；若發生衝突，則加上數字後綴。

<AccordionGroup>
  <Accordion title="Skill 命令分派">
    根據預設，Skill 命令會像一般要求一樣路由至模型。

    Skills 可宣告 `command-dispatch: tool`，以直接路由至工具
    （具確定性，不涉及模型）。範例：`/prose`（OpenProse 外掛）
    — 請參閱 [OpenProse](/zh-TW/prose)。

  </Accordion>
  <Accordion title="原生命令引數">
    若省略必要引數，Discord 會針對動態選項使用自動完成與按鈕選單。
    對於具有選項的命令，Telegram 與 Slack 會顯示按鈕選單。
    動態選項會根據目標工作階段模型解析，因此 `/think` 層級等模型
    專屬選項會遵循工作階段的 `/model` 覆寫。
  </Accordion>
</AccordionGroup>

## `/tools`：代理程式目前可使用的項目

`/tools` 回答的是執行階段問題：**此代理程式目前在這段
對話中可以使用什麼**，而非靜態設定目錄。

```text
/tools         # 精簡檢視
/tools verbose # 包含簡短說明
```

結果以工作階段為範圍。變更代理程式、頻道、討論串、傳送者
授權或模型，都可能改變輸出。如要編輯設定檔與覆寫，
請使用 Control UI 的 Tools 面板或設定介面。

## `/model`：模型選擇

```text
/model             # 顯示模型選擇器
/model list        # 相同功能
/model 3           # 依選擇器中的編號選取
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # 清除工作階段模型選擇
/model status      # 包含端點與 API 模式的詳細檢視
```

在 Discord 上，`/model` 與 `/models` 會開啟具有供應商及
模型下拉式選單的互動式選擇器。選擇器會遵循 `agents.defaults.modelPolicy.allow`，
包括 `provider/*` 項目。若未明確設定允許清單，模型項目與
別名不會限制選擇。

## `/config`：磁碟設定寫入

<Note>
  僅限擁有者。預設停用 — 使用 `commands.config: true` 啟用。
</Note>

```text
/config show
/config show channels.whatsapp.responsePrefix
/config get channels.whatsapp.responsePrefix
/config set channels.whatsapp.responsePrefix="[openclaw]"
/config unset channels.whatsapp.responsePrefix
```

寫入前會驗證設定。無效的變更會遭到拒絕。`/config`
更新會在重新啟動後保留。

## `/mcp`：MCP 伺服器設定

<Note>
  僅限擁有者。預設停用 — 使用 `commands.mcp: true` 啟用。
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp` 會將設定儲存在 OpenClaw 設定中，而非內嵌代理程式的專案設定。
`/mcp show` 會遮蔽包含認證資訊的欄位、可辨識的認證資訊旗標
值，以及已知具有機密格式的引數。從群組執行時，
設定會私下傳送給擁有者；若沒有可用的擁有者私人路由，
命令會採取封閉式失敗，並要求擁有者從直接聊天中重試。

## `/debug`：僅限執行階段的覆寫

<Note>
  僅限擁有者。預設停用 — 使用 `commands.debug: true` 啟用。
  覆寫會立即套用至新的設定讀取，但**不會**寫入磁碟。
</Note>

```text
/debug show
/debug set channels.whatsapp.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset channels.whatsapp.responsePrefix
/debug reset
```

## `/plugins`：外掛管理

<Note>
  寫入僅限擁有者。預設停用 — 使用 `commands.plugins: true` 啟用。
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

`/plugins enable|disable` 會更新外掛設定，並熱重新載入閘道
外掛執行階段，以供新的代理程式回合使用。`/plugins install` 會自動重新啟動受管理的
閘道，因為外掛來源模組已變更。受信任的 ClawHub
與官方目錄安裝不需要額外確認。任意 npm、
git、封存檔、`npm-pack:` 及本機路徑來源會顯示來源警告，且
在你審查來源後，要求於結尾加上 `--force`。此旗標表示確認
來源並允許取代現有安裝；它不會略過
`security.installPolicy` 或安裝程式安全檢查。具有
風險警告的 ClawHub 發行版本仍需要另一個僅限 shell 的
`--acknowledge-clawhub-risk` 旗標。市集、連結及釘選安裝也仍
僅限 shell。

## `/trace`：外掛追蹤輸出

```text
/trace          # 顯示目前追蹤狀態
/trace on
/trace off
```

`/trace` 會顯示工作階段範圍的外掛追蹤／偵錯行，而無須啟用完整詳細
模式。它不會取代 `/debug`（執行階段覆寫）或 `/verbose`（一般
工具輸出）。

## `/btw`：附帶問題

`/btw` 是關於目前工作階段脈絡的快速附帶問題。別名：`/side`。

```text
/btw 我們現在正在做什麼？
/side 主要執行持續進行期間有什麼變更？
```

與一般訊息不同：

- 使用目前工作階段作為背景脈絡。
- 在 Codex 測試框架工作階段中，會作為暫時的 Codex 附帶討論串執行。
- **不會**變更後續工作階段脈絡。
- 不會寫入文字記錄歷程。

如需完整行為，請參閱 [BTW 附帶問題](/zh-TW/tools/btw)。

## 介面注意事項

<AccordionGroup>
  <Accordion title="各介面的工作階段範圍">
    - **文字命令：**在一般聊天工作階段中執行（私訊共用 `main`，群組有各自的工作階段）。
    - **Discord 原生命令：**`agent:<agentId>:discord:slash:<userId>`
    - **Slack 原生命令：**`agent:<agentId>:slack:slash:<userId>`（前綴可透過 `channels.slack.slashCommand.sessionPrefix` 設定）
    - **Telegram 原生命令：**`telegram:slash:<userId>`（透過 `CommandTargetSessionKey` 將聊天工作階段設為目標）
    - **`/login codex`** 僅透過私人聊天或 Web UI 回應路徑傳送裝置配對碼。從 Telegram 群組／主題叫用時，會要求擁有者改為私訊機器人。
    - **`/stop`** 會將作用中的聊天工作階段設為目標，以中止目前執行。

  </Accordion>
  <Accordion title="Slack 特定事項">
    `channels.slack.slashCommand` 支援單一 `/openclaw` 樣式的命令。
    使用 `commands.native: true` 時，請為每個內建命令建立一個 Slack 斜線命令。
    請註冊 `/agentstatus`（而非 `/status`），因為 Slack 保留了
    `/status`。文字 `/status` 在 Slack 訊息中仍然有效。
  </Accordion>
  <Accordion title="快速路徑與行內捷徑">
    - 來自允許清單中傳送者、僅含命令的訊息會立即處理（略過佇列與模型）。
    - 行內捷徑（`/help`、`/commands`、`/status`、`/whoami`）也能嵌入一般訊息中使用，並會在模型看到其餘文字前移除。
    - 未經授權且僅含命令的訊息會被靜默忽略；行內 `/...` 詞元會視為純文字。

  </Accordion>
  <Accordion title="引數注意事項">
    - 命令與引數之間可選擇性加入 `:`（`/think: high`、`/send: on`）。
    - `/new <model>` 接受模型別名、`provider/model` 或供應商名稱（模糊比對）；若沒有相符項目，該文字會視為訊息本文。
    - `/allowlist add|remove` 需要 `commands.config: true`，並遵循頻道的 `configWrites`。

  </Accordion>
</AccordionGroup>

## 供應商用量與狀態

- 啟用用量追蹤時，`/status` 會顯示目前模型供應商的**供應商用量／配額**（例如「Claude 剩餘 80%」）。
- 當即時工作階段快照資訊不足時，`/status` 中的**詞元／快取行**可改用最新的逐字稿用量項目。
- **執行與執行環境：**`/status` 會以 `Execution` 回報實際的沙箱路徑，並以 `Runtime` 回報工作階段的執行者：`OpenClaw Default`、`OpenAI Codex`、命令列介面後端或 ACP 後端。
- **每次回應的詞元／成本：**由 `/usage off|tokens|full` 控制。
- `/model status` 涉及模型／驗證／端點，而非用量。

## 相關內容

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="puzzle-piece">
    Skills 斜線命令的註冊與管控方式。
  </Card>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    建立可註冊自身斜線命令的 Skill。
  </Card>
  <Card title="BTW" href="/zh-TW/tools/btw" icon="comments">
    在不變更工作階段情境的情況下提出附帶問題。
  </Card>
  <Card title="引導" href="/zh-TW/tools/steer" icon="compass">
    使用 `/steer` 在代理程式執行期間引導它。
  </Card>
</CardGroup>
