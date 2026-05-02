---
read_when:
    - 使用或設定聊天指令
    - 偵錯指令路由或權限
sidebarTitle: Slash commands
summary: 斜線指令：文字與原生、設定和支援的指令
title: 斜線指令
x-i18n:
    generated_at: "2026-05-02T03:01:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a00619cc0eff25b81b475eab5b0b3d808bf067e6e004a491a90ec3982149b7
    source_path: tools/slash-commands.md
    workflow: 16
---

命令由 Gateway 處理。大多數命令必須作為以 `/` 開頭的**獨立**訊息傳送。僅限主機的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 作為別名）。

當對話或討論串繫結到 ACP 工作階段時，一般後續文字會路由到該 ACP harness。Gateway 管理命令仍會留在本機：`/acp ...` 一律會到達 OpenClaw ACP 命令處理器，而只要該介面已啟用命令處理，`/status` 加上 `/unfocus` 也會留在本機。

有兩個相關系統：

<AccordionGroup>
  <Accordion title="命令">
    獨立的 `/...` 訊息。
  </Accordion>
  <Accordion title="指令">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - 指令會在模型看到訊息前從訊息中移除。
    - 在一般聊天訊息中（非僅含指令），它們會被視為「行內提示」，且**不會**持續保存工作階段設定。
    - 在僅含指令的訊息中（訊息只包含指令），它們會持續保存到工作階段，並回覆確認。
    - 指令只會套用於**已授權的傳送者**。如果已設定 `commands.allowFrom`，它會是唯一使用的允許清單；否則授權會來自頻道允許清單/配對加上 `commands.useAccessGroups`。未授權的傳送者會看到指令被視為純文字。

  </Accordion>
  <Accordion title="行內捷徑">
    僅限允許清單內/已授權的傳送者：`/help`, `/commands`, `/status`, `/whoami` (`/id`)。

    它們會立即執行，在模型看到訊息前被移除，剩餘文字則繼續通過一般流程。

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
  啟用在聊天訊息中解析 `/...`。在沒有原生命令的介面（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams）上，即使將此項設為 `false`，文字命令仍可運作。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  註冊原生命令。自動：Discord/Telegram 開啟；Slack 關閉（直到你加入斜線命令）；對沒有原生支援的提供者會忽略。設定 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可依提供者覆寫（bool 或 `"auto"`）。`false` 會在啟動時清除 Discord/Telegram 上先前註冊的命令。Slack 命令在 Slack app 中管理，且不會自動移除。
</ParamField>
在 Discord 上，原生命令規格可以包含 `descriptionLocalizations`，OpenClaw 會將其發布為 Discord `description_localizations`，並納入協調比較。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支援時以原生方式註冊 **Skills** 命令。自動：Discord/Telegram 開啟；Slack 關閉（Slack 需要為每個 skill 建立斜線命令）。設定 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可依提供者覆寫（bool 或 `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  啟用 `! <cmd>` 來執行主機 shell 命令（`/bash <cmd>` 是別名；需要 `tools.elevated` 允許清單）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  控制 bash 在切換到背景模式前等待多久（`0` 表示立即背景執行）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  啟用 `/config`（讀取/寫入 `openclaw.json`）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  啟用 `/mcp`（讀取/寫入 `mcp.servers` 底下由 OpenClaw 管理的 MCP 設定）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  啟用 `/plugins`（Plugin 探索/狀態，以及安裝 + 啟用/停用控制）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  啟用 `/debug`（僅限執行階段的覆寫）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  啟用 `/restart` 加上 gateway 重新啟動工具動作。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  設定僅限擁有者的命令/工具介面所使用的明確擁有者允許清單。這是可核准危險動作並執行 `/diagnostics`、`/export-trajectory` 和 `/config` 等命令的人類操作員帳號。它與 `commands.allowFrom` 以及 DM 配對存取權限分開。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  依頻道設定：讓僅限擁有者的命令在該介面上執行時需要**擁有者身分**。當為 `true` 時，傳送者必須符合已解析的擁有者候選項（例如 `commands.ownerAllowFrom` 中的項目或提供者原生擁有者中繼資料），或在內部訊息頻道上持有內部 `operator.admin` 範圍。頻道 `allowFrom` 中的萬用字元項目，或空的/未解析的擁有者候選清單，**不足以**滿足條件 — 僅限擁有者的命令會在該頻道上預設拒絕。若你希望僅限擁有者的命令只由 `ownerAllowFrom` 和標準命令允許清單把關，請保持關閉。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制擁有者 ID 在系統提示中顯示的方式。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  可選擇設定在 `commands.ownerDisplay="hash"` 時使用的 HMAC secret。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  用於命令授權的依提供者允許清單。設定後，它會是命令與指令唯一的授權來源（會忽略頻道允許清單/配對與 `commands.useAccessGroups`）。使用 `"*"` 作為全域預設；提供者特定鍵會覆寫它。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  當未設定 `commands.allowFrom` 時，對命令強制執行允許清單/政策。
</ParamField>

## 命令清單

目前的真實來源：

- 核心內建項目來自 `src/auto-reply/commands-registry.shared.ts`
- 產生的 dock 命令來自 `src/auto-reply/commands-registry.data.ts`
- Plugin 命令來自 Plugin `registerCommand()` 呼叫
- 你的 gateway 上的實際可用性仍取決於設定旗標、頻道介面，以及已安裝/已啟用的 Plugins

### 核心內建命令

<AccordionGroup>
  <Accordion title="工作階段與執行">
    - `/new [model]` 會啟動新的工作階段；`/reset` 是重設別名。
    - `/reset soft [message]` 會保留目前逐字稿，丟棄重複使用的 CLI 後端工作階段 ID，並就地重新執行啟動/系統提示載入。
    - `/compact [instructions]` 會壓縮工作階段內容。請參閱 [Compaction](/zh-TW/concepts/compaction)。
    - `/stop` 會中止目前執行。
    - `/session idle <duration|off>` 和 `/session max-age <duration|off>` 會管理討論串繫結到期時間。
    - `/export-session [path]` 會將目前工作階段匯出為 HTML。別名：`/export`。
    - `/export-trajectory [path]` 會要求 exec 核准，然後為目前工作階段匯出 JSONL [軌跡套件](/zh-TW/tools/trajectory)。當你需要某個 OpenClaw 工作階段的提示、工具與逐字稿時間軸時使用它。在群組聊天中，核准提示與匯出結果會私下傳送給擁有者。別名：`/trajectory`。

  </Accordion>
  <Accordion title="模型與執行控制">
    - `/think <level>` 會設定思考層級。選項來自作用中模型的提供者設定檔；常見層級為 `off`、`minimal`、`low`、`medium` 和 `high`，自訂層級如 `xhigh`、`adaptive`、`max`，或二元 `on` 則僅在支援處可用。別名：`/thinking`、`/t`。
    - `/verbose on|off|full` 會切換詳細輸出。別名：`/v`。
    - `/trace on|off` 會切換目前工作階段的 Plugin 追蹤輸出。
    - `/fast [status|on|off]` 會顯示或設定快速模式。
    - `/reasoning [on|off|stream]` 會切換推理可見性。別名：`/reason`。
    - `/elevated [on|off|ask|full]` 會切換提升模式。別名：`/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 會顯示或設定 exec 預設值。
    - `/model [name|#|status]` 會顯示或設定模型。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` 會列出已設定/授權可用的提供者，或某個提供者的模型；加入 `all` 可瀏覽該提供者的完整目錄。
    - `/queue <mode>` 會管理佇列行為（`steer`、舊版 `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`），以及 `debounce:0.5s cap:25 drop:summarize` 等選項；`/queue default` 或 `/queue reset` 會清除工作階段覆寫。請參閱 [命令佇列](/zh-TW/concepts/queue) 和 [引導佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
  <Accordion title="探索與狀態">
    - `/help` 會顯示簡短說明摘要。
    - `/commands` 會顯示產生的命令目錄。
    - `/tools [compact|verbose]` 會顯示目前 agent 現在可使用的項目。
    - `/status` 會顯示執行/執行階段狀態，包括可用時的 `Execution`/`Runtime` 標籤與提供者用量/配額。
    - `/diagnostics [note]` 是僅限擁有者的支援報告流程，用於 Gateway 錯誤和 Codex harness 執行。每次在執行 `openclaw gateway diagnostics export --json` 前都會要求明確的 exec 核准；請勿用 allow-all 規則核准診斷。核准後，它會傳送可貼上的報告，包含本機套件路徑、manifest 摘要、隱私注意事項和相關工作階段 ID。在群組聊天中，核准提示與報告會私下傳送給擁有者。當作用中工作階段使用 OpenAI Codex harness 時，同一次核准也會將相關 Codex feedback 傳送到 OpenAI 伺服器，完成後的回覆會列出 OpenClaw 工作階段 ID、Codex 討論串 ID，以及 `codex resume <thread-id>` 命令。請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。
    - `/crestodian <request>` 會從擁有者 DM 執行 Crestodian 設定與修復輔助工具。
    - `/tasks` 會列出目前工作階段的作用中/近期背景工作。
    - `/context [list|detail|json]` 會說明內容如何組裝。
    - `/whoami` 會顯示你的傳送者 ID。別名：`/id`。
    - `/usage off|tokens|full|cost` 會控制每則回應的用量頁尾，或列印本機成本摘要。

  </Accordion>
  <Accordion title="Skills、允許清單、核准">
    - `/skill <name> [input]` 會依名稱執行 skill。
    - `/allowlist [list|add|remove] ...` 會管理允許清單項目。僅限文字。
    - `/approve <id> <decision>` 會解決 exec 核准提示。
    - `/btw <question>` 會提出旁支問題，而不變更未來工作階段內容。請參閱 [BTW](/zh-TW/tools/btw)。

  </Accordion>
  <Accordion title="Subagents 與 ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` 會管理目前工作階段的 sub-agent 執行。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 會管理 ACP 工作階段與執行階段選項。
    - `/focus <target>` 會將目前 Discord 討論串或 Telegram 主題/對話繫結到工作階段目標。
    - `/unfocus` 會移除目前繫結。
    - `/agents` 會列出目前工作階段中繫結到討論串的 agents。
    - `/kill <id|#|all>` 會中止一個或所有執行中的 sub-agents。
    - `/steer <id|#> <message>` 會將引導傳送給執行中的 sub-agent。別名：`/tell`。

  </Accordion>
  <Accordion title="僅擁有者可寫入與管理">
    - `/config show|get|set|unset` 讀取或寫入 `openclaw.json`。僅限擁有者。需要 `commands.config: true`。
    - `/mcp show|get|set|unset` 讀取或寫入 `mcp.servers` 底下由 OpenClaw 管理的 MCP 伺服器設定。僅限擁有者。需要 `commands.mcp: true`。
    - `/plugins list|inspect|show|get|install|enable|disable` 檢查或變更 Plugin 狀態。`/plugin` 是別名。寫入僅限擁有者。需要 `commands.plugins: true`。
    - `/debug show|set|unset|reset` 管理僅限執行階段的設定覆寫。僅限擁有者。需要 `commands.debug: true`。
    - `/restart` 會在啟用時重新啟動 OpenClaw。預設：已啟用；設定 `commands.restart: false` 可停用它。
    - `/send on|off|inherit` 設定傳送政策。僅限擁有者。

  </Accordion>
  <Accordion title="語音、TTS、頻道控制">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` 控制 TTS。請參閱 [TTS](/zh-TW/tools/tts)。
    - `/activation mention|always` 設定群組啟用模式。
    - `/bash <command>` 執行主機 shell 命令。僅限文字。別名：`! <command>`。需要 `commands.bash: true` 加上 `tools.elevated` 允許清單。
    - `!poll [sessionId]` 檢查背景 bash 工作。
    - `!stop [sessionId]` 停止背景 bash 工作。

  </Accordion>
</AccordionGroup>

### 產生的 dock 命令

Dock 命令會將目前工作階段的回覆路由切換到另一個已連結的
頻道。請參閱 [Channel docking](/zh-TW/concepts/channel-docking) 了解設定、
範例與疑難排解。

Dock 命令是由支援原生命令的頻道 Plugin 產生。目前內建集合：

- `/dock-discord`（別名：`/dock_discord`）
- `/dock-mattermost`（別名：`/dock_mattermost`）
- `/dock-slack`（別名：`/dock_slack`）
- `/dock-telegram`（別名：`/dock_telegram`）

從直接聊天使用 dock 命令，可將目前工作階段的回覆路由切換到另一個已連結的頻道。代理會保留相同的工作階段內容，但該工作階段後續的回覆會傳送到所選的頻道對象。

Dock 命令需要 `session.identityLinks`。來源傳送者和目標對象必須在同一個身分群組中，例如 `["telegram:123", "discord:456"]`。如果 ID 為 `123` 的 Telegram 使用者傳送 `/dock_discord`，OpenClaw 會在作用中的工作階段上儲存 `lastChannel: "discord"` 和 `lastTo: "456"`。如果傳送者未連結到 Discord 對象，該命令會回覆設定提示，而不是落入一般聊天流程。

Docking 只會變更作用中工作階段的路由。它不會建立頻道帳號、授予存取權、繞過頻道允許清單，或將逐字稿歷史移到另一個工作階段。使用 `/dock-telegram`、`/dock-slack`、`/dock-mattermost` 或另一個產生的 dock 命令，可再次切換路由。

### 內建 Plugin 命令

內建 Plugin 可以新增更多斜線命令。此 repo 目前的內建命令：

- `/dreaming [on|off|status|help]` 切換記憶 Dreaming。請參閱 [Dreaming](/zh-TW/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理裝置配對/設定流程。請參閱 [Pairing](/zh-TW/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 暫時啟用高風險手機節點命令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 語音設定。在 Discord 上，原生命令名稱是 `/talkvoice`。
- `/card ...` 傳送 LINE 豐富卡片預設。請參閱 [LINE](/zh-TW/channels/line)。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` 檢查並控制內建 Codex app-server harness。請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。
- 僅限 QQBot 的命令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動態 Skills 命令

使用者可呼叫的 Skills 也會公開為斜線命令：

- `/skill <name> [input]` 一律可作為通用進入點使用。
- Skills 也可能在 skill/Plugin 註冊時，以 `/prose` 這類直接命令出現。
- 原生 Skills 命令註冊由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。
- 命令規格可以為支援在地化描述的原生介面提供 `descriptionLocalizations`，包括 Discord。

<AccordionGroup>
  <Accordion title="引數與解析器注意事項">
    - 命令接受命令與引數之間可選的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
    - `/new <model>` 接受模型別名、`provider/model` 或提供者名稱（模糊比對）；如果沒有相符項目，文字會被視為訊息本文。
    - 如需完整的提供者用量明細，請使用 `openclaw status --usage`。
    - `/allowlist add|remove` 需要 `commands.config=true`，並遵循頻道 `configWrites`。
    - 在多帳號頻道中，指定設定目標的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也會遵循目標帳號的 `configWrites`。
    - `/usage` 控制每則回覆的用量頁尾；`/usage cost` 會從 OpenClaw 工作階段記錄輸出本機成本摘要。
    - `/restart` 預設啟用；設定 `commands.restart: false` 可停用它。
    - `/plugins install <spec>` 接受與 `openclaw plugins install` 相同的 Plugin 規格：本機路徑/封存檔、npm 套件、`git:<repo>` 或 `clawhub:<pkg>`。
    - `/plugins enable|disable` 會更新 Plugin 設定，且可能提示重新啟動。

  </Accordion>
  <Accordion title="頻道特定行為">
    - 僅限 Discord 的原生命令：`/vc join|leave|status` 控制語音頻道（不能作為文字使用）。`join` 需要 guild 和已選取的語音/舞台頻道。需要 `channels.discord.voice` 和原生命令。
    - Discord thread-binding 命令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）需要啟用有效的討論串綁定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
    - ACP 命令參考與執行階段行為：[ACP agents](/zh-TW/tools/acp-agents)。

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning 安全性">
    - `/verbose` 用於除錯和取得額外可見性；一般使用時請保持**關閉**。
    - `/trace` 比 `/verbose` 範圍更窄：它只會顯示 Plugin 擁有的 trace/debug 行，並保持一般詳細工具雜訊關閉。
    - `/fast on|off` 會保留工作階段覆寫。使用 Sessions UI 的 `inherit` 選項可清除它，並回復到設定預設值。
    - `/fast` 是提供者特定的：OpenAI/OpenAI Codex 會在原生 Responses endpoints 上將其對應到 `service_tier=priority`，而直接的公開 Anthropic 請求，包括傳送到 `api.anthropic.com` 的 OAuth 驗證流量，會將其對應到 `service_tier=auto` 或 `standard_only`。請參閱 [OpenAI](/zh-TW/providers/openai) 和 [Anthropic](/zh-TW/providers/anthropic)。
    - 工具失敗摘要仍會在相關時顯示，但詳細失敗文字只會在 `/verbose` 為 `on` 或 `full` 時包含。
    - `/reasoning`、`/verbose` 和 `/trace` 在群組設定中有風險：它們可能揭露你不打算公開的內部 reasoning、工具輸出或 Plugin 診斷。建議保持關閉，尤其是在群組聊天中。

  </Accordion>
  <Accordion title="模型切換">
    - `/model` 會立即保留新的工作階段模型。
    - 如果代理閒置，下一次執行會立即使用它。
    - 如果執行已經作用中，OpenClaw 會將即時切換標記為待處理，並只在乾淨的重試點重新啟動到新模型。
    - 如果工具活動或回覆輸出已經開始，待處理的切換可能會保持佇列狀態，直到之後的重試機會或下一個使用者回合。
    - 在本機 TUI 中，`/crestodian [request]` 會從一般代理 TUI 返回 Crestodian。這與訊息頻道救援模式分開，且不會授予遠端設定權限。

  </Accordion>
  <Accordion title="快速路徑與行內捷徑">
    - **快速路徑：** 來自允許清單傳送者的純命令訊息會立即處理（繞過佇列與模型）。
    - **群組提及門控：** 來自允許清單傳送者的純命令訊息會繞過提及需求。
    - **行內捷徑（僅限允許清單傳送者）：** 某些命令嵌入一般訊息時也會運作，並在模型看到剩餘文字前被移除。
      - 範例：`hey /status` 會觸發狀態回覆，剩餘文字則繼續經過一般流程。
    - 目前：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
    - 未授權的純命令訊息會被靜默忽略，行內 `/...` token 會被視為純文字。

  </Accordion>
  <Accordion title="Skills 命令與原生引數">
    - **Skills 命令：** `user-invocable` Skills 會公開為斜線命令。名稱會淨化為 `a-z0-9_`（最多 32 個字元）；衝突會取得數字後綴（例如 `_2`）。
      - `/skill <name> [input]` 依名稱執行 Skills（當原生命令限制阻止逐一 Skills 命令時很有用）。
      - 預設情況下，Skills 命令會作為一般請求轉送給模型。
      - Skills 可選擇宣告 `command-dispatch: tool`，將命令直接路由到工具（確定性、無模型）。
      - 範例：`/prose`（OpenProse Plugin）— 請參閱 [OpenProse](/zh-TW/prose)。
    - **原生命令引數：** Discord 對動態選項使用自動完成（省略必要引數時使用按鈕選單）。Telegram 和 Slack 會在命令支援選項且你省略引數時顯示按鈕選單。動態選項會依目標工作階段模型解析，因此模型特定選項（例如 `/think` 層級）會遵循該工作階段的 `/model` 覆寫。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` 回答的是執行階段問題，而不是設定問題：**此代理現在在這段對話中可以使用什麼**。

- 預設 `/tools` 精簡且針對快速瀏覽最佳化。
- `/tools verbose` 加入簡短描述。
- 支援引數的原生命令介面會公開相同的模式切換：`compact|verbose`。
- 結果以工作階段為範圍，因此變更代理、頻道、討論串、傳送者授權或模型，都可能改變輸出。
- `/tools` 包含執行階段實際可觸及的工具，包括核心工具、已連接的 Plugin 工具，以及頻道擁有的工具。

如需編輯設定檔和覆寫，請使用 Control UI Tools 面板或設定/目錄介面，而不是把 `/tools` 視為靜態目錄。

## 用量介面（什麼會顯示在哪裡）

- **提供者用量/配額**（範例："Claude 80% left"）會在啟用用量追蹤時，針對目前模型提供者顯示於 `/status`。OpenClaw 會將提供者視窗正規化為 `% left`；對於 MiniMax，僅剩餘百分比欄位會在顯示前反轉，而 `model_remains` 回應會優先使用聊天模型項目加上帶有模型標籤的方案標籤。
- **Token/快取行** 在 `/status` 中可於即時工作階段快照稀疏時，退回使用最新的逐字稿用量項目。既有的非零即時值仍會優先，逐字稿後援也可以復原作用中執行階段模型標籤，以及在已儲存總數遺失或較小時，復原較大的 prompt 導向總數。
- **Execution 與 runtime：** `/status` 會回報有效 sandbox 路徑的 `Execution`，以及實際執行工作階段的人員/後端的 `Runtime`：`OpenClaw Pi Default`、`OpenAI Codex`、CLI 後端或 ACP 後端。
- **每則回覆的 token/成本** 由 `/usage off|tokens|full` 控制（附加到一般回覆）。
- `/model status` 是關於**模型/驗證/端點**，不是用量。

## 模型選擇（`/model`）

`/model` 實作為指令。

範例：

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

注意事項：

- `/model` 和 `/model list` 會顯示精簡的編號選擇器（模型系列 + 可用提供者）。
- 在 Discord 上，`/model` 和 `/models` 會開啟互動式選擇器，包含提供者和模型下拉選單，以及提交步驟。
- `/model <#>` 會從該選擇器中選取（並在可能時偏好目前的提供者）。
- `/model status` 會顯示詳細檢視，包含已設定的提供者端點（`baseUrl`）和 API 模式（`api`）（若可用）。

## 偵錯覆寫

`/debug` 可讓你設定**僅限執行階段**的設定覆寫（記憶體中，不寫入磁碟）。僅限擁有者。預設停用；使用 `commands.debug: true` 啟用。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
覆寫會立即套用到新的設定讀取，但**不會**寫入 `openclaw.json`。使用 `/debug reset` 清除所有覆寫並回到磁碟上的設定。
</Note>

## Plugin 追蹤輸出

`/trace` 可讓你切換**工作階段範圍的 Plugin 追蹤/偵錯行**，而不必啟用完整詳細模式。

範例：

```text
/trace
/trace on
/trace off
```

注意事項：

- 不帶引數的 `/trace` 會顯示目前工作階段的追蹤狀態。
- `/trace on` 會為目前工作階段啟用 Plugin 追蹤行。
- `/trace off` 會再次停用它們。
- Plugin 追蹤行可能會出現在 `/status` 中，也可能在一般助理回覆之後作為後續診斷訊息出現。
- `/trace` 不會取代 `/debug`；`/debug` 仍用於管理僅限執行階段的設定覆寫。
- `/trace` 不會取代 `/verbose`；一般詳細工具/狀態輸出仍屬於 `/verbose`。

## 設定更新

`/config` 會寫入你的磁碟設定（`openclaw.json`）。僅限擁有者。預設停用；使用 `commands.config: true` 啟用。

範例：

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
設定會在寫入前驗證；無效變更會被拒絕。`/config` 更新會在重新啟動後保留。
</Note>

## MCP 更新

`/mcp` 會在 `mcp.servers` 下寫入 OpenClaw 管理的 MCP 伺服器定義。僅限擁有者。預設停用；使用 `commands.mcp: true` 啟用。

範例：

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp` 會將設定儲存在 OpenClaw 設定中，而不是 Pi 擁有的專案設定。執行階段配接器會決定哪些傳輸實際可執行。
</Note>

## Plugin 更新

`/plugins` 可讓操作員檢查已探索到的 Plugin，並在設定中切換啟用狀態。唯讀流程可以使用 `/plugin` 作為別名。預設停用；使用 `commands.plugins: true` 啟用。

範例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` 和 `/plugins show` 會依據目前工作區與磁碟上的設定執行真實的 Plugin 探索。
- `/plugins enable|disable` 只會更新 Plugin 設定；不會安裝或解除安裝 Plugin。
- 啟用/停用變更後，請重新啟動 gateway 以套用它們。

</Note>

## 介面注意事項

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - **文字命令**會在一般聊天工作階段中執行（DM 共用 `main`，群組有自己的工作階段）。
    - **原生命令**使用隔離的工作階段：
      - Discord：`agent:<agentId>:discord:slash:<userId>`
      - Slack：`agent:<agentId>:slack:slash:<userId>`（可透過 `channels.slack.slashCommand.sessionPrefix` 設定前綴）
      - Telegram：`telegram:slash:<userId>`（透過 `CommandTargetSessionKey` 指向聊天工作階段）
    - **`/stop`** 會指向使用中的聊天工作階段，因此可以中止目前執行。

  </Accordion>
  <Accordion title="Slack specifics">
    仍支援 `channels.slack.slashCommand` 作為單一 `/openclaw` 風格命令。如果啟用 `commands.native`，你必須為每個內建命令建立一個 Slack 斜線命令（名稱與 `/help` 相同）。Slack 的命令引數選單會以臨時 Block Kit 按鈕形式傳送。

    Slack 原生例外：請註冊 `/agentstatus`（不是 `/status`），因為 Slack 保留 `/status`。文字 `/status` 仍可在 Slack 訊息中使用。

  </Accordion>
</AccordionGroup>

## BTW 附帶問題

`/btw` 是關於目前工作階段的快速**附帶問題**。

不同於一般聊天：

- 它會使用目前工作階段作為背景脈絡，
- 它會作為獨立的**無工具**一次性呼叫執行，
- 它不會變更未來的工作階段脈絡，
- 它不會寫入逐字稿歷史，
- 它會作為即時附帶結果傳送，而不是一般助理訊息。

當你想在主要工作持續進行時取得暫時釐清，`/btw` 就很有用。

範例：

```text
/btw what are we doing right now?
```

請參閱 [BTW 附帶問題](/zh-TW/tools/btw) 以了解完整行為和用戶端 UX 詳細資訊。

## 相關

- [建立 Skills](/zh-TW/tools/creating-skills)
- [Skills](/zh-TW/tools/skills)
- [Skills 設定](/zh-TW/tools/skills-config)
