---
read_when:
    - 使用或設定聊天指令
    - 偵錯命令路由或權限
sidebarTitle: Slash commands
summary: 斜線命令：文字與原生、設定和支援的命令
title: 斜線指令
x-i18n:
    generated_at: "2026-05-05T06:19:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

命令由 Gateway 處理。大多數命令必須以**獨立**訊息傳送，且以 `/` 開頭。僅限主機的 bash 聊天命令使用 `! <cmd>`（`/bash <cmd>` 為其別名）。

當對話或討論串綁定到 ACP 工作階段時，一般後續文字會路由到該 ACP harness。Gateway 管理命令仍然保留在本機：`/acp ...` 一律會到達 OpenClaw ACP 命令處理器，而且只要該介面已啟用命令處理，`/status` 加上 `/unfocus` 就會保留在本機。

有兩個相關系統：

<AccordionGroup>
  <Accordion title="命令">
    獨立的 `/...` 訊息。
  </Accordion>
  <Accordion title="指令">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - 指令會在模型看到訊息前從訊息中移除。
    - 在一般聊天訊息中（不是純指令），它們會被視為「行內提示」，且**不會**持久化工作階段設定。
    - 在純指令訊息中（訊息只包含指令），它們會持久化到工作階段並回覆確認。
    - 指令只會套用於**已授權的傳送者**。如果已設定 `commands.allowFrom`，它會是唯一使用的允許清單；否則授權來自通道允許清單/配對加上 `commands.useAccessGroups`。未授權的傳送者會看到指令被視為純文字。

  </Accordion>
  <Accordion title="行內捷徑">
    僅限列入允許清單/已授權的傳送者：`/help`, `/commands`, `/status`, `/whoami` (`/id`)。

    它們會立即執行，在模型看到訊息前被移除，而剩餘文字會繼續走正常流程。

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
  啟用聊天訊息中的 `/...` 解析。在沒有原生命令的介面上（WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams），即使你將此項設定為 `false`，文字命令仍然可用。
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  註冊原生命令。Auto：Discord/Telegram 開啟；Slack 關閉（直到你加入斜線命令）；對不支援原生功能的提供者會忽略。設定 `channels.discord.commands.native`、`channels.telegram.commands.native` 或 `channels.slack.commands.native` 可依提供者覆寫（布林值或 `"auto"`）。在 Discord 上，`false` 會在啟動期間略過斜線命令註冊與清理；先前註冊的命令可能仍會顯示，直到你從 Discord 應用程式移除它們。Slack 命令在 Slack 應用程式中管理，且不會自動移除。
</ParamField>
在 Discord 上，原生命令規格可以包含 `descriptionLocalizations`，OpenClaw 會將其發布為 Discord `description_localizations`，並納入 reconcile 比較。
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  在支援時以原生方式註冊 **Skills** 命令。Auto：Discord/Telegram 開啟；Slack 關閉（Slack 需要為每個 Skills 建立一個斜線命令）。設定 `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills` 或 `channels.slack.commands.nativeSkills` 可依提供者覆寫（布林值或 `"auto"`）。
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  啟用 `! <cmd>` 以執行主機 shell 命令（`/bash <cmd>` 是別名；需要 `tools.elevated` 允許清單）。
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  控制 bash 在切換到背景模式前等待多久（`0` 表示立即進入背景）。
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  啟用 `/config`（讀取/寫入 `openclaw.json`）。
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  啟用 `/mcp`（讀取/寫入 `mcp.servers` 下由 OpenClaw 管理的 MCP 設定）。
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  啟用 `/plugins`（Plugin 探索/狀態以及安裝 + 啟用/停用控制）。
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  啟用 `/debug`（僅限執行階段的覆寫）。
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  啟用 `/restart` 加上 gateway 重新啟動工具動作。
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  設定僅限擁有者命令/工具介面的明確擁有者允許清單。這是可核准危險動作並執行 `/diagnostics`、`/export-trajectory` 和 `/config` 等命令的人類操作員帳號。它與 `commands.allowFrom` 以及 DM 配對存取分開。
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  依通道設定：讓僅限擁有者命令需要**擁有者身分**才能在該介面執行。當為 `true` 時，傳送者必須符合已解析的擁有者候選者（例如 `commands.ownerAllowFrom` 中的項目或提供者原生擁有者中繼資料），或在內部訊息通道上持有內部 `operator.admin` 範圍。通道 `allowFrom` 中的萬用字元項目，或空白/未解析的擁有者候選清單，**不足以**滿足條件 — 僅限擁有者命令會在該通道上預設失敗。若你希望僅限擁有者命令只由 `ownerAllowFrom` 和標準命令允許清單控管，請保持此項關閉。
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  控制擁有者 ID 在系統提示中的顯示方式。
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  可選擇設定在 `commands.ownerDisplay="hash"` 時使用的 HMAC 密鑰。
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  用於命令授權的依提供者允許清單。設定後，它會是命令和指令的唯一授權來源（會忽略通道允許清單/配對與 `commands.useAccessGroups`）。使用 `"*"` 作為全域預設；提供者專屬鍵會覆寫它。
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  當未設定 `commands.allowFrom` 時，對命令強制執行允許清單/政策。
</ParamField>

## 命令清單

目前的單一事實來源：

- 核心內建命令來自 `src/auto-reply/commands-registry.shared.ts`
- 產生的 dock 命令來自 `src/auto-reply/commands-registry.data.ts`
- Plugin 命令來自 Plugin `registerCommand()` 呼叫
- 你的 gateway 上的實際可用性仍取決於設定旗標、通道介面，以及已安裝/啟用的 Plugin

### 核心內建命令

<AccordionGroup>
  <Accordion title="工作階段與執行">
    - `/new [model]` 啟動新的工作階段；`/reset` 是重設別名。
    - Control UI 會攔截輸入的 `/new`，以建立並切換到新的儀表板工作階段；輸入的 `/reset` 仍會執行 Gateway 的就地重設。
    - `/reset soft [message]` 保留目前逐字稿、丟棄重用的 CLI 後端工作階段 ID，並就地重新執行啟動/系統提示載入。
    - `/compact [instructions]` 會壓縮工作階段內容。請參閱 [Compaction](/zh-TW/concepts/compaction)。
    - `/stop` 中止目前執行。
    - `/session idle <duration|off>` 和 `/session max-age <duration|off>` 管理討論串綁定到期。
    - `/export-session [path]` 將目前工作階段匯出為 HTML。別名：`/export`。
    - `/export-trajectory [path]` 要求 exec 核准，然後為目前工作階段匯出 JSONL [軌跡套件](/zh-TW/tools/trajectory)。當你需要某個 OpenClaw 工作階段的提示、工具和逐字稿時間軸時使用它。在群組聊天中，核准提示與匯出結果會私下傳送給擁有者。別名：`/trajectory`。

  </Accordion>
  <Accordion title="模型與執行控制">
    - `/think <level>` 設定思考等級。選項來自作用中模型的提供者設定檔；常見等級為 `off`、`minimal`、`low`、`medium` 和 `high`，而 `xhigh`、`adaptive`、`max` 或二元 `on` 等自訂等級只在支援處可用。別名：`/thinking`、`/t`。
    - `/verbose on|off|full` 切換詳細輸出。別名：`/v`。
    - `/trace on|off` 切換目前工作階段的 Plugin trace 輸出。
    - `/fast [status|on|off]` 顯示或設定快速模式。
    - `/reasoning [on|off|stream]` 切換推理可見性。別名：`/reason`。
    - `/elevated [on|off|ask|full]` 切換提升模式。別名：`/elev`。
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` 顯示或設定 exec 預設值。
    - `/model [name|#|status]` 顯示或設定模型。
    - `/models [provider] [page] [limit=<n>|size=<n>|all]` 列出已設定/可用驗證的提供者，或某提供者的模型；加入 `all` 可瀏覽該提供者的完整目錄。
    - `/queue <mode>` 管理佇列行為（`steer`、舊版 `queue`、`followup`、`collect`、`steer-backlog`、`interrupt`），以及 `debounce:0.5s cap:25 drop:summarize` 等選項；`/queue default` 或 `/queue reset` 會清除工作階段覆寫。請參閱 [命令佇列](/zh-TW/concepts/queue) 和 [Steering 佇列](/zh-TW/concepts/queue-steering)。
    - `/steer <message>` 將引導注入目前工作階段的作用中執行，獨立於 `/queue` 模式。當工作階段閒置時，它不會啟動新的執行。別名：`/tell`。請參閱 [Steer](/zh-TW/tools/steer)。

  </Accordion>
  <Accordion title="探索與狀態">
    - `/help` 顯示簡短說明摘要。
    - `/commands` 顯示產生的命令目錄。
    - `/tools [compact|verbose]` 顯示目前代理此刻可使用的項目。
    - `/status` 顯示執行/執行階段狀態、Gateway 與系統執行時間，以及可用時的提供者用量/配額。
    - `/diagnostics [note]` 是僅限擁有者的 Gateway 錯誤與 Codex harness 執行支援報告流程。它每次執行 `openclaw gateway diagnostics export --json` 前都會要求明確 exec 核准；請勿用 allow-all 規則核准診斷。核准後，它會傳送可貼上的報告，包含本機套件路徑、manifest 摘要、隱私注意事項和相關工作階段 ID。在群組聊天中，核准提示與報告會私下傳送給擁有者。當作用中工作階段使用 OpenAI Codex harness 時，同一項核准也會將相關 Codex 回饋傳送到 OpenAI 伺服器，且完成的回覆會列出 OpenClaw 工作階段 ID、Codex 討論串 ID，以及 `codex resume <thread-id>` 命令。請參閱 [診斷匯出](/zh-TW/gateway/diagnostics)。
    - `/crestodian <request>` 從擁有者 DM 執行 Crestodian 設定與修復輔助工具。
    - `/tasks` 列出目前工作階段的作用中/近期背景工作。
    - `/context [list|detail|json]` 說明 context 如何組裝。
    - `/whoami` 顯示你的傳送者 ID。別名：`/id`。
    - `/usage off|tokens|full|cost` 控制每次回應的用量頁尾，或列印本機成本摘要。

  </Accordion>
  <Accordion title="Skills、允許清單、核准">
    - `/skill <name> [input]` 依名稱執行 Skills。
    - `/allowlist [list|add|remove] ...` 管理允許清單項目。僅限文字。
    - `/approve <id> <decision>` 解決 exec 核准提示。
    - `/btw <question>` 詢問旁支問題，而不變更未來工作階段內容。別名：`/side`。請參閱 [BTW](/zh-TW/tools/btw)。

  </Accordion>
  <Accordion title="子代理與 ACP">
    - `/subagents list|kill|log|info|send|steer|spawn` 管理目前工作階段的子代理執行。
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` 管理 ACP 工作階段與執行階段選項。
    - `/focus <target>` 將目前的 Discord 討論串或 Telegram 主題/對話綁定到工作階段目標。
    - `/unfocus` 移除目前的綁定。
    - `/agents` 列出目前工作階段中綁定討論串的代理。
    - `/kill <id|#|all>` 中止一個或所有執行中的子代理。
    - `/subagents steer <id|#> <message>` 將引導訊息傳送給執行中的子代理。請參閱 [引導](/zh-TW/tools/steer)。

  </Accordion>
  <Accordion title="僅限擁有者寫入與管理">
    - `/config show|get|set|unset` 讀取或寫入 `openclaw.json`。僅限擁有者。需要 `commands.config: true`。
    - `/mcp show|get|set|unset` 讀取或寫入 `mcp.servers` 底下由 OpenClaw 管理的 MCP 伺服器設定。僅限擁有者。需要 `commands.mcp: true`。
    - `/plugins list|inspect|show|get|install|enable|disable` 檢查或變更 plugin 狀態。`/plugin` 是別名。寫入僅限擁有者。需要 `commands.plugins: true`。
    - `/debug show|set|unset|reset` 管理僅限執行階段的設定覆寫。僅限擁有者。需要 `commands.debug: true`。
    - `/restart` 在啟用時重新啟動 OpenClaw。預設：已啟用；設定 `commands.restart: false` 可停用。
    - `/send on|off|inherit` 設定傳送政策。僅限擁有者。

  </Accordion>
  <Accordion title="語音、TTS、頻道控制">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` 控制 TTS。請參閱 [TTS](/zh-TW/tools/tts)。
    - `/activation mention|always` 設定群組啟用模式。
    - `/bash <command>` 執行主機 shell 指令。僅限文字。別名：`! <command>`。需要 `commands.bash: true` 加上 `tools.elevated` 允許清單。
    - `!poll [sessionId]` 檢查背景 bash 工作。
    - `!stop [sessionId]` 停止背景 bash 工作。

  </Accordion>
</AccordionGroup>

### 產生的停駐指令

停駐指令會將目前工作階段的回覆路由切換到另一個已連結的
頻道。如需設定、範例和疑難排解，請參閱 [頻道停駐](/zh-TW/concepts/channel-docking)。

停駐指令是從支援原生指令的頻道 plugin 產生。目前的內建集合：

- `/dock-discord`（別名：`/dock_discord`）
- `/dock-mattermost`（別名：`/dock_mattermost`）
- `/dock-slack`（別名：`/dock_slack`）
- `/dock-telegram`（別名：`/dock_telegram`）

從直接聊天使用停駐指令，可將目前工作階段的回覆路由切換到另一個已連結的頻道。代理會保留相同的工作階段內容，但該工作階段之後的回覆會傳遞到所選的頻道對等端。

停駐指令需要 `session.identityLinks`。來源傳送者與目標對等端必須位於同一個身分群組，例如 `["telegram:123", "discord:456"]`。如果 id 為 `123` 的 Telegram 使用者傳送 `/dock_discord`，OpenClaw 會在作用中的工作階段上儲存 `lastChannel: "discord"` 和 `lastTo: "456"`。如果傳送者未連結到 Discord 對等端，該指令會回覆設定提示，而不是落入一般聊天。

停駐只會變更作用中工作階段的路由。它不會建立頻道帳號、授予存取權、略過頻道允許清單，或將文字記錄歷史移到另一個工作階段。使用 `/dock-telegram`、`/dock-slack`、`/dock-mattermost` 或其他產生的停駐指令可再次切換路由。

### 內建 plugin 指令

內建 plugin 可以新增更多斜線指令。目前此儲存庫中的內建指令：

- `/dreaming [on|off|status|help]` 切換記憶 Dreaming。請參閱 [Dreaming](/zh-TW/concepts/dreaming)。
- `/pair [qr|status|pending|approve|cleanup|notify]` 管理裝置配對/設定流程。請參閱 [配對](/zh-TW/channels/pairing)。
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` 暫時啟用高風險電話節點指令。
- `/voice status|list [limit]|set <voiceId|name>` 管理 Talk 語音設定。在 Discord 上，原生指令名稱是 `/talkvoice`。
- `/card ...` 傳送 LINE 豐富卡片預設。請參閱 [LINE](/zh-TW/channels/line)。
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` 檢查並控制內建的 Codex app-server harness。請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。
- 僅限 QQBot 的指令：
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 動態 Skill 指令

使用者可呼叫的 Skills 也會公開為斜線指令：

- `/skill <name> [input]` 一律可作為通用進入點使用。
- 當 skill/plugin 註冊時，Skills 也可能顯示為像 `/prose` 這樣的直接指令。
- 原生 Skill 指令註冊由 `commands.nativeSkills` 和 `channels.<provider>.commands.nativeSkills` 控制。
- 指令規格可為支援在地化描述的原生介面提供 `descriptionLocalizations`，包括 Discord。

<AccordionGroup>
  <Accordion title="引數與解析器注意事項">
    - 指令接受在指令與引數之間使用選用的 `:`（例如 `/think: high`、`/send: on`、`/help:`）。
    - `/new <model>` 接受模型別名、`provider/model` 或提供者名稱（模糊比對）；如果沒有符合項目，文字會被視為訊息本文。
    - 如需完整的提供者用量細分，請使用 `openclaw status --usage`。
    - `/allowlist add|remove` 需要 `commands.config=true`，並遵循頻道 `configWrites`。
    - 在多帳號頻道中，針對設定的 `/allowlist --account <id>` 和 `/config set channels.<provider>.accounts.<id>...` 也會遵循目標帳號的 `configWrites`。
    - `/usage` 控制每次回應的用量頁尾；`/usage cost` 會從 OpenClaw 工作階段日誌列印本機成本摘要。
    - `/restart` 預設為啟用；設定 `commands.restart: false` 可停用。
    - `/plugins install <spec>` 接受與 `openclaw plugins install` 相同的 plugin 規格：本機路徑/封存、npm 套件、`git:<repo>` 或 `clawhub:<pkg>`，接著因為 plugin 原始碼模組已變更而要求重新啟動 Gateway。
    - `/plugins enable|disable` 更新 plugin 設定，並為新的代理回合觸發 Gateway plugin 重新載入。

  </Accordion>
  <Accordion title="頻道特定行為">
    - 僅限 Discord 的原生指令：`/vc join|leave|status` 控制語音頻道（不能以文字使用）。`join` 需要 guild 與所選的語音/stage 頻道。需要 `channels.discord.voice` 和原生指令。
    - Discord 討論串綁定指令（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）需要啟用有效的討論串綁定（`session.threadBindings.enabled` 和/或 `channels.discord.threadBindings.enabled`）。
    - ACP 指令參考與執行階段行為：[ACP 代理](/zh-TW/tools/acp-agents)。

  </Accordion>
  <Accordion title="詳細 / 追蹤 / 快速 / 推理安全">
    - `/verbose` 用於偵錯與額外可見性；一般使用時請保持**關閉**。
    - `/trace` 比 `/verbose` 更窄：它只會揭露 plugin 擁有的追蹤/偵錯行，並保持一般詳細工具雜訊關閉。
    - `/fast on|off` 會保留工作階段覆寫。使用 Sessions UI 的 `inherit` 選項可清除它，並退回設定預設值。
    - `/fast` 依提供者而定：OpenAI/OpenAI Codex 會在原生 Responses 端點上將其對應到 `service_tier=priority`，而直接的公開 Anthropic 請求，包括傳送到 `api.anthropic.com` 的 OAuth 驗證流量，會將其對應到 `service_tier=auto` 或 `standard_only`。請參閱 [OpenAI](/zh-TW/providers/openai) 和 [Anthropic](/zh-TW/providers/anthropic)。
    - 相關時仍會顯示工具失敗摘要，但詳細失敗文字只會在 `/verbose` 為 `on` 或 `full` 時包含。
    - `/reasoning`、`/verbose` 和 `/trace` 在群組情境中有風險：它們可能揭露你不打算公開的內部推理、工具輸出或 plugin 診斷。建議保持關閉，尤其是在群組聊天中。

  </Accordion>
  <Accordion title="模型切換">
    - `/model` 會立即保留新的工作階段模型。
    - 如果代理閒置，下一次執行會立即使用它。
    - 如果已有執行正在進行，OpenClaw 會將即時切換標記為待處理，並只會在乾淨的重試點重新啟動到新模型。
    - 如果工具活動或回覆輸出已經開始，待處理的切換可能會保持佇列狀態，直到稍後的重試機會或下一個使用者回合。
    - 在本機 TUI 中，`/crestodian [request]` 會從一般代理 TUI 返回 Crestodian。這與訊息頻道救援模式分開，且不會授予遠端設定權限。

  </Accordion>
  <Accordion title="快速路徑與行內捷徑">
    - **快速路徑：** 來自允許清單傳送者的純指令訊息會立即處理（略過佇列 + 模型）。
    - **群組提及門檻：** 來自允許清單傳送者的純指令訊息會略過提及需求。
    - **行內捷徑（僅限允許清單傳送者）：** 某些指令嵌入一般訊息時也能運作，並且會在模型看到剩餘文字前被移除。
      - 範例：`hey /status` 會觸發狀態回覆，而剩餘文字會繼續走一般流程。
    - 目前：`/help`、`/commands`、`/status`、`/whoami`（`/id`）。
    - 未授權的純指令訊息會被靜默忽略，而行內 `/...` 權杖會被視為純文字。

  </Accordion>
  <Accordion title="Skill 指令與原生引數">
    - **Skill 指令：** `user-invocable` Skills 會公開為斜線指令。名稱會清理為 `a-z0-9_`（最多 32 個字元）；衝突會取得數字後綴（例如 `_2`）。
      - `/skill <name> [input]` 依名稱執行 Skill（當原生指令限制阻止每個 Skill 各自有指令時很有用）。
      - 預設情況下，Skill 指令會作為一般要求轉發給模型。
      - Skills 可選擇宣告 `command-dispatch: tool`，將指令直接路由到工具（確定性，無模型）。
      - 範例：`/prose`（OpenProse plugin）— 請參閱 [OpenProse](/zh-TW/prose)。
    - **原生指令引數：** Discord 會對動態選項使用自動完成（並且在你省略必要引數時使用按鈕選單）。Telegram 和 Slack 會在指令支援選項且你省略引數時顯示按鈕選單。動態選項會依目標工作階段模型解析，因此模型特定選項（例如 `/think` 層級）會遵循該工作階段的 `/model` 覆寫。

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools` 回答的是執行階段問題，而不是設定問題：**這個代理現在在這段對話中可以使用什麼**。

- 預設的 `/tools` 精簡，並針對快速瀏覽最佳化。
- `/tools verbose` 會加入簡短描述。
- 支援引數的原生指令介面會公開相同的模式切換：`compact|verbose`。
- 結果以工作階段為範圍，因此變更代理、頻道、討論串、傳送者授權或模型都可能改變輸出。
- `/tools` 包含執行階段實際可達的工具，包括核心工具、已連線的 plugin 工具，以及頻道擁有的工具。

若要編輯設定檔與覆寫，請使用 Control UI Tools 面板或設定/目錄介面，而不是把 `/tools` 視為靜態目錄。

## 使用介面（哪些內容顯示在哪裡）

- **提供者用量/配額**（範例：「Claude 剩餘 80%」）會在啟用用量追蹤時，出現在目前模型提供者的 `/status` 中。OpenClaw 會將提供者視窗正規化為「剩餘 %」；對 MiniMax 而言，只表示剩餘量的百分比欄位會先反轉再顯示，而 `model_remains` 回應會優先採用聊天模型項目，加上附帶模型標籤的方案標籤。
- **權杖/快取行** 在 `/status` 中可於即時工作階段快照過於稀疏時，退回使用最新的逐字稿用量項目。既有非零的即時值仍會優先，而逐字稿退回也可在儲存總量缺失或較小時，復原作用中的執行階段模型標籤，以及較大的提示詞導向總量。
- **執行與執行階段：** `/status` 會以 `Execution` 回報有效沙盒路徑，並以 `Runtime` 回報實際執行工作階段的是誰：`OpenClaw Pi Default`、`OpenAI Codex`、CLI 後端，或 ACP 後端。
- **每次回應的權杖/成本** 由 `/usage off|tokens|full` 控制（附加到一般回覆）。
- `/model status` 關於的是**模型/驗證/端點**，不是用量。

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

- `/model` 和 `/model list` 會顯示精簡的編號選擇器（模型家族 + 可用提供者）。
- 在 Discord 上，`/model` 和 `/models` 會開啟互動式選擇器，包含提供者與模型下拉選單，以及送出步驟。
- `/model <#>` 會從該選擇器中選取（並在可能時偏好目前提供者）。
- `/model status` 會顯示詳細檢視，包含已設定的提供者端點（`baseUrl`）和可用時的 API 模式（`api`）。

## 偵錯覆寫

`/debug` 可讓你設定**僅限執行階段**的設定覆寫（記憶體，而非磁碟）。僅限擁有者。預設停用；使用 `commands.debug: true` 啟用。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
覆寫會立即套用到新的設定讀取，但**不會**寫入 `openclaw.json`。使用 `/debug reset` 清除所有覆寫並返回磁碟上的設定。
</Note>

## Plugin 追蹤輸出

`/trace` 可讓你切換**工作階段範圍的 Plugin 追蹤/偵錯行**，而不需要啟用完整詳細模式。

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
- Plugin 追蹤行可出現在 `/status` 中，也可在一般助理回覆後作為後續診斷訊息出現。
- `/trace` 不會取代 `/debug`；`/debug` 仍負責管理僅限執行階段的設定覆寫。
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

`/mcp` 會在 `mcp.servers` 下寫入由 OpenClaw 管理的 MCP 伺服器定義。僅限擁有者。預設停用；使用 `commands.mcp: true` 啟用。

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

`/plugins` 可讓操作者檢查已探索到的 Plugin，並在設定中切換啟用狀態。唯讀流程可使用 `/plugin` 作為別名。預設停用；使用 `commands.plugins: true` 啟用。

範例：

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list` 和 `/plugins show` 會依目前工作區加上磁碟上的設定，進行實際 Plugin 探索。
- `/plugins install` 會從 ClawHub、npm、git、本機目錄和封存檔安裝。
- `/plugins enable|disable` 只會更新 Plugin 設定；它不會安裝或解除安裝 Plugin。
- 啟用與停用變更會為新的代理回合熱重載 Gateway Plugin 執行階段介面；安裝會要求重新啟動 Gateway，因為 Plugin 原始模組已變更。

</Note>

## 介面備註

<AccordionGroup>
  <Accordion title="各介面的工作階段">
    - **文字命令** 會在一般聊天工作階段中執行（私訊共用 `main`，群組有自己的工作階段）。
    - **原生命令** 使用隔離工作階段：
      - Discord：`agent:<agentId>:discord:slash:<userId>`
      - Slack：`agent:<agentId>:slack:slash:<userId>`（前綴可透過 `channels.slack.slashCommand.sessionPrefix` 設定）
      - Telegram：`telegram:slash:<userId>`（透過 `CommandTargetSessionKey` 指向聊天工作階段）
    - **`/stop`** 會指向作用中的聊天工作階段，以便中止目前執行。

  </Accordion>
  <Accordion title="Slack 細節">
    `channels.slack.slashCommand` 仍支援單一 `/openclaw` 風格命令。如果你啟用 `commands.native`，必須為每個內建命令建立一個 Slack 斜線命令（名稱與 `/help` 相同）。Slack 的命令引數選單會以暫時性 Block Kit 按鈕傳送。

    Slack 原生例外：註冊 `/agentstatus`（不是 `/status`），因為 Slack 保留 `/status`。文字 `/status` 在 Slack 訊息中仍可使用。

  </Accordion>
</AccordionGroup>

## BTW 附帶問題

`/btw` 是關於目前工作階段的快速**附帶問題**。`/side` 是別名。

不同於一般聊天：

- 它使用目前工作階段作為背景脈絡，
- 它會作為獨立的**無工具**一次性呼叫執行，
- 它不會改變未來工作階段脈絡，
- 它不會寫入逐字稿歷史，
- 它會作為即時附帶結果傳送，而不是一般助理訊息。

這讓 `/btw` 在你想於主要任務持續進行時取得暫時性釐清時很有用。

範例：

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

完整行為與用戶端使用者體驗細節請參閱 [BTW 附帶問題](/zh-TW/tools/btw)。

## 相關

- [建立 skills](/zh-TW/tools/creating-skills)
- [Skills](/zh-TW/tools/skills)
- [Skills 設定](/zh-TW/tools/skills-config)
