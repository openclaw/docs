---
read_when:
    - 回答常見的設定、安裝、入門導覽或執行階段支援問題
    - 在進一步除錯前，先分診使用者回報的問題
summary: OpenClaw 設定、組態與使用方式的常見問題
title: 常見問題
x-i18n:
    generated_at: "2026-05-07T13:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b208e28def6b9a1165130bc02f9e2646c3b16d203dfc8c0d59dc664f388c2ef8
    source_path: help/faq.md
    workflow: 16
---

快速解答，加上針對實際設定（本機開發、VPS、多代理、OAuth/API 金鑰、模型容錯移轉）的深入疑難排解。關於執行階段診斷，請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。完整設定參考請參閱[設定](/zh-TW/gateway/configuration)。

## 如果有東西壞了，前 60 秒先做這些

1. **快速狀態（第一個檢查）**

   ```bash
   openclaw status
   ```

   快速本機摘要：OS + 更新、gateway/service 可達性、agents/sessions、provider config + runtime issues（當 gateway 可達時）。

2. **可貼上的報告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   唯讀診斷，包含 log tail（tokens 已遮蔽）。

3. **Daemon + 連接埠狀態**

   ```bash
   openclaw gateway status
   ```

   顯示 supervisor runtime 與 RPC 可達性、probe target URL，以及 service 可能使用的 config。

4. **深度探測**

   ```bash
   openclaw status --deep
   ```

   執行即時 Gateway health probe，包含支援時的 channel probes
   （需要可達的 Gateway）。請參閱 [Health](/zh-TW/gateway/health)。

5. **追蹤最新 log**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 停止，請改用：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   檔案 log 與 service log 是分開的；請參閱 [Logging](/zh-TW/logging) 和[疑難排解](/zh-TW/gateway/troubleshooting)。

6. **執行 doctor（修復）**

   ```bash
   openclaw doctor
   ```

   修復/遷移 config/state + 執行健康檢查。請參閱 [Doctor](/zh-TW/gateway/doctor)。

7. **Gateway 快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   向執行中的 Gateway 要求完整快照（僅 WS）。請參閱 [Health](/zh-TW/gateway/health)。

## 快速開始與首次執行設定

首次執行 Q&A — 安裝、onboard、auth routes、subscriptions、初始失敗 —
位於[首次執行 FAQ](/zh-TW/help/faq-first-run)。

## OpenClaw 是什麼？

<AccordionGroup>
  <Accordion title="用一段話說明 OpenClaw 是什麼？">
    OpenClaw 是你在自己裝置上執行的個人 AI 助理。它會在你已經使用的訊息介面上回覆（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及像 QQ Bot 這類內建 channel plugins），也能在支援的平台上提供語音 + 即時 Canvas。**Gateway** 是永遠在線的控制平面；助理才是產品本身。
  </Accordion>

  <Accordion title="價值主張">
    OpenClaw 不只是「Claude wrapper」。它是一個**本機優先的控制平面**，讓你在**自己的硬體**上執行
    有能力的助理，並能從你已經使用的聊天 apps 存取，具備
    stateful sessions、memory 和 tools，而不必把工作流程的控制權交給託管式
    SaaS。

    重點：

    - **你的裝置，你的資料：** 在任何你想要的地方執行 Gateway（Mac、Linux、VPS），並將
      workspace + session history 保留在本機。
    - **真實 channels，不是 web sandbox：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等等，
      加上支援平台上的 mobile voice 和 Canvas。
    - **模型無關：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，並支援 per-agent routing
      和 failover。
    - **僅本機選項：** 執行本機模型，讓**所有資料都能留在你的裝置上**。
    - **多代理 routing：** 依 channel、account 或 task 分開 agents，每個都有自己的
      workspace 和預設值。
    - **開源且可改造：** 檢視、擴充並自行託管，沒有 vendor lock-in。

    文件：[Gateway](/zh-TW/gateway)、[Channels](/zh-TW/channels)、[多代理](/zh-TW/concepts/multi-agent)、
    [Memory](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我剛設定好，第一件事該做什麼？">
    適合入門的專案：

    - 建立網站（WordPress、Shopify，或簡單的靜態網站）。
    - 製作 mobile app prototype（outline、screens、API plan）。
    - 整理檔案和資料夾（cleanup、naming、tagging）。
    - 連接 Gmail 並自動化摘要或後續追蹤。

    它可以處理大型任務，但當你把任務拆成階段，並
    使用 sub agents 做平行工作時，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常見的五個日常使用情境是什麼？">
    日常收益通常像這樣：

    - **個人簡報：** 摘要 inbox、calendar 和你關心的 news。
    - **研究與起草：** 快速研究、摘要，以及 emails 或 docs 的初稿。
    - **提醒與後續追蹤：** 由 cron 或 heartbeat 驅動的提示與 checklist。
    - **瀏覽器自動化：** 填寫表單、收集資料，以及重複 web tasks。
    - **跨裝置協調：** 從手機送出 task，讓 Gateway 在 server 上執行，並在 chat 中取得結果。

  </Accordion>

  <Accordion title="OpenClaw 能幫 SaaS 做名單開發、開發信、廣告和部落格嗎？">
    可以，用於**研究、資格判斷和起草**。它可以掃描網站、建立候選清單、
    摘要潛在客戶，並撰寫開發信或廣告文案草稿。

    若要進行**開發信或廣告投放**，請保留人工審核。避免 spam、遵守當地法律與
    平台政策，並在送出任何內容前先審閱。最安全的模式是讓
    OpenClaw 起草，再由你核准。

    文件：[Security](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="相較於 Claude Code，OpenClaw 對 web development 有哪些優勢？">
    OpenClaw 是**個人助理**與協調層，不是 IDE 的替代品。在 repo 內需要最快的直接 coding loop 時，請使用
    Claude Code 或 Codex。當你需要 durable memory、cross-device access 和 tool orchestration 時，請使用 OpenClaw。

    優勢：

    - 跨 sessions 的**持久 memory + workspace**
    - **多平台存取**（WhatsApp、Telegram、TUI、WebChat）
    - **Tool orchestration**（browser、files、scheduling、hooks）
    - **永遠在線的 Gateway**（在 VPS 上執行，從任何地方互動）
    - 用於本機 browser/screen/camera/exec 的 **Nodes**

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 與自動化

<AccordionGroup>
  <Accordion title="如何自訂 skills，又不讓 repo 變髒？">
    使用受管理的 overrides，而不是編輯 repo copy。把你的變更放在 `~/.openclaw/skills/<name>/SKILL.md`（或透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 加入資料夾）。優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`，所以 managed overrides 仍會優先於 bundled skills，且不需碰 git。若你需要全域安裝 skill，但只對部分 agents 可見，請將 shared copy 放在 `~/.openclaw/skills`，並用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可見性。只有值得 upstream 的編輯才應放在 repo 裡並以 PR 發出。
  </Accordion>

  <Accordion title="我可以從自訂資料夾載入 skills 嗎？">
    可以。透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 加入額外目錄（最低優先順序）。預設優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`。`clawhub` 預設安裝到 `./skills`，OpenClaw 會在下一個 session 將其視為 `<workspace>/skills`。如果該 skill 只應對特定 agents 可見，請搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何針對不同任務使用不同模型？">
    目前支援的模式有：

    - **Cron jobs**：isolated jobs 可以針對每個 job 設定 `model` override。
    - **Sub-agents**：將 tasks route 到具有不同 default models 的 separate agents。
    - **隨需切換**：隨時使用 `/model` 切換目前 session model。

    請參閱 [Cron jobs](/zh-TW/automation/cron-jobs)、[多代理 Routing](/zh-TW/concepts/multi-agent) 和 [Slash commands](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="Bot 在處理繁重工作時會卡住。我要如何卸載這些工作？">
    對長時間或平行任務使用 **sub-agents**。Sub-agents 會在自己的 session 中執行，
    回傳摘要，並讓你的主要 chat 保持可回應。

    要求你的 bot「spawn a sub-agent for this task」，或使用 `/subagents`。
    在 chat 中使用 `/status` 查看 Gateway 目前正在做什麼（以及它是否忙碌）。

    Token 提示：long tasks 和 sub-agents 都會消耗 tokens。如果你在意成本，請透過 `agents.defaults.subagents.model` 為 sub-agents 設定
    較便宜的模型。

    文件：[Sub-agents](/zh-TW/tools/subagents)、[背景 Tasks](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上的 thread-bound subagent sessions 如何運作？">
    使用 thread bindings。你可以將 Discord thread 綁定到 subagent 或 session target，讓該 thread 中的 follow-up messages 保持在該 bound session 上。

    基本流程：

    - 使用 `sessions_spawn` 並設定 `thread: true` 來 spawn（可選擇加上 `mode: "session"` 以支援 persistent follow-up）。
    - 或使用 `/focus <target>` 手動 bind。
    - 使用 `/agents` 檢查 binding state。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制 auto-unfocus。
    - 使用 `/unfocus` 解除 thread。

    必要 config：

    - 全域預設值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord overrides：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - Spawn 時自動 bind：`channels.discord.threadBindings.spawnSessions` 預設為 `true`；設定為 `false` 可停用 thread-bound session spawns。

    文件：[Sub-agents](/zh-TW/tools/subagents)、[Discord](/zh-TW/channels/discord)、[Configuration Reference](/zh-TW/gateway/configuration-reference)、[Slash commands](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="Subagent 已完成，但完成更新送到錯誤位置或從未發出。我該檢查什麼？">
    請先檢查 resolved requester route：

    - Completion-mode subagent delivery 會優先使用任何已存在的 bound thread 或 conversation route。
    - 如果 completion origin 只攜帶 channel，OpenClaw 會 fallback 到 requester session 的 stored route（`lastChannel` / `lastTo` / `lastAccountId`），讓 direct delivery 仍可成功。
    - 如果沒有 bound route，也沒有可用的 stored route，direct delivery 可能失敗，結果會 fallback 到 queued session delivery，而不是立即發到 chat。
    - 無效或過期的 targets 仍可能強制 queue fallback 或導致最終 delivery failure。
    - 如果 child 的最後一個可見 assistant reply 是完全相符的 silent token `NO_REPLY` / `no_reply`，或完全等於 `ANNOUNCE_SKIP`，OpenClaw 會刻意 suppress announce，而不是發布較早的 stale progress。
    - 如果 child 在只有 tool calls 後 timeout，announce 可能會將其折疊成短的 partial-progress summary，而不是重播 raw tool output。

    Debug：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[Sub-agents](/zh-TW/tools/subagents)、[背景 Tasks](/zh-TW/automation/tasks)、[Session Tools](/zh-TW/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或 reminders 沒有觸發。我該檢查什麼？">
    Cron 在 Gateway process 內執行。如果 Gateway 沒有持續執行，
    scheduled jobs 就不會執行。

    Checklist：

    - 確認 cron 已啟用（`cron.enabled`），且 `OPENCLAW_SKIP_CRON` 未設定。
    - 檢查 Gateway 是否 24/7 執行（沒有 sleep/restarts）。
    - 驗證 job 的 timezone settings（`--tz` 與 host timezone）。

    Debug：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[Cron jobs](/zh-TW/automation/cron-jobs)、[Automation & Tasks](/zh-TW/automation)。

  </Accordion>

  <Accordion title="Cron 已觸發，但沒有任何內容傳送到頻道。為什麼？">
    請先檢查遞送模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不預期有 runner 備援傳送。
    - 缺少或無效的公告目標（`channel` / `to`）表示 runner 已略過對外遞送。
    - 頻道驗證失敗（`unauthorized`、`Forbidden`）表示 runner 嘗試遞送，但憑證阻擋了它。
    - 靜默的隔離結果（只有 `NO_REPLY` / `no_reply`）會被視為刻意不可遞送，因此 runner 也會抑制佇列中的備援遞送。

    對於隔離 Cron 工作，當聊天路由可用時，代理仍可以使用 `message`
    工具直接傳送。`--announce` 只控制代理尚未自行傳送的最終文字
    的 runner 備援路徑。

    除錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[Cron 工作](/zh-TW/automation/cron-jobs)、[背景工作](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="為什麼隔離 Cron 執行會切換模型或重試一次？">
    這通常是即時模型切換路徑，而不是重複排程。

    隔離 Cron 可以持久化執行階段模型交接，並在作用中
    執行拋出 `LiveSessionModelSwitchError` 時重試。重試會保留已切換的
    provider/model；如果切換帶有新的驗證設定檔覆寫，Cron
    也會在重試前將其持久化。

    相關選擇規則：

    - 適用時，Gmail hook 模型覆寫會優先。
    - 接著是每個工作的 `model`。
    - 接著是任何已儲存的 Cron 工作階段模型覆寫。
    - 接著是一般的代理/預設模型選擇。

    重試迴圈有界限。初始嘗試加上 2 次切換重試後，
    Cron 會中止，而不是無限迴圈。

    除錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[Cron 工作](/zh-TW/automation/cron-jobs)、[Cron CLI](/zh-TW/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 Skills？">
    使用原生 `openclaw skills` 命令，或將 Skills 放入你的工作區。macOS Skills UI 無法在 Linux 上使用。
    在 [https://clawhub.ai](https://clawhub.ai) 瀏覽 Skills。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    原生 `openclaw skills install` 會寫入作用中工作區的 `skills/`
    目錄。只有在你想發布或同步自己的 Skills 時，才需要安裝獨立的
    `clawhub` CLI。若要跨代理共享安裝，請將 Skill 放在
    `~/.openclaw/skills` 下，並在想限制哪些代理可以看到它時使用
    `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以依排程或在背景持續執行工作嗎？">
    可以。使用 Gateway 排程器：

    - **Cron 工作**用於排程或週期性工作（會跨重新啟動持久保留）。
    - **Heartbeat** 用於「主要工作階段」的週期性檢查。
    - **隔離工作**用於會發布摘要或遞送到聊天的自主代理。

    文件：[Cron 工作](/zh-TW/automation/cron-jobs)、[自動化與工作](/zh-TW/automation)、
    [Heartbeat](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以從 Linux 執行僅限 Apple macOS 的 Skills 嗎？">
    不能直接執行。macOS Skills 受 `metadata.openclaw.os` 加上必要二進位檔控管，而且 Skills 只有在 **Gateway 主機**上符合資格時才會出現在系統提示中。在 Linux 上，僅限 `darwin` 的 Skills（例如 `apple-notes`、`apple-reminders`、`things-mac`）除非你覆寫控管，否則不會載入。

    你有三種支援的模式：

    **選項 A - 在 Mac 上執行 Gateway（最簡單）。**
    在 macOS 二進位檔存在的位置執行 Gateway，然後從 Linux 以[遠端模式](#gateway-ports-already-running-and-remote-mode)或透過 Tailscale 連線。因為 Gateway 主機是 macOS，所以 Skills 會正常載入。

    **選項 B - 使用 macOS Node（不使用 SSH）。**
    在 Linux 上執行 Gateway，配對 macOS Node（選單列 app），並在 Mac 上將 **Node Run Commands** 設為「Always Ask」或「Always Allow」。當必要二進位檔存在於 Node 上時，OpenClaw 可以將僅限 macOS 的 Skills 視為符合資格。代理會透過 `nodes` 工具執行這些 Skills。如果你選擇「Always Ask」，在提示中核准「Always Allow」會將該命令加入允許清單。

    **選項 C - 透過 SSH 代理 macOS 二進位檔（進階）。**
    將 Gateway 保留在 Linux 上，但讓必要的 CLI 二進位檔解析為在 Mac 上執行的 SSH 包裝器。接著覆寫 Skill 以允許 Linux，讓它維持符合資格。

    1. 為二進位檔建立 SSH 包裝器（範例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 將包裝器放在 Linux 主機的 `PATH` 上（例如 `~/bin/memo`）。
    3. 覆寫 Skill 中繼資料（工作區或 `~/.openclaw/skills`）以允許 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 啟動新的工作階段，讓 Skills 快照重新整理。

  </Accordion>

  <Accordion title="你們有 Notion 或 HeyGen 整合嗎？">
    目前沒有內建。

    選項：

    - **自訂 Skill / Plugin：** 最適合可靠的 API 存取（Notion/HeyGen 都有 API）。
    - **瀏覽器自動化：** 無需程式碼即可運作，但較慢且較脆弱。

    如果你想依客戶保留情境（代理商工作流程），簡單模式是：

    - 每位客戶一個 Notion 頁面（情境 + 偏好設定 + 作用中工作）。
    - 要求代理在工作階段開始時擷取該頁面。

    如果你想要原生整合，請開啟功能請求，或建置一個
    以那些 API 為目標的 Skill。

    安裝 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安裝會落在作用中工作區的 `skills/` 目錄。若要跨代理共享 Skills，請將它們放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只有部分代理應看到共享安裝，請設定 `agents.defaults.skills` 或 `agents.list[].skills`。某些 Skills 需要透過 Homebrew 安裝的二進位檔；在 Linux 上這表示 Linuxbrew（請見上方 Homebrew Linux FAQ 項目）。請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config) 和 [ClawHub](/zh-TW/tools/clawhub)。

  </Accordion>

  <Accordion title="如何讓 OpenClaw 使用我現有已登入的 Chrome？">
    使用內建的 `user` 瀏覽器設定檔，它會透過 Chrome DevTools MCP 連接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自訂名稱，請建立明確的 MCP 設定檔：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    此路徑可以使用本地主機瀏覽器或已連線的瀏覽器 Node。如果 Gateway 在其他地方執行，請在瀏覽器機器上執行 Node 主機，或改用遠端 CDP。

    `existing-session` / `user` 目前的限制：

    - 動作以 ref 驅動，而不是以 CSS selector 驅動
    - 上傳需要 `ref` / `inputRef`，且目前一次支援一個檔案
    - `responsebody`、PDF 匯出、下載攔截和批次動作仍需要受管理的瀏覽器或原始 CDP 設定檔

  </Accordion>
</AccordionGroup>

## 沙箱與記憶體

<AccordionGroup>
  <Accordion title="有專門的沙箱文件嗎？">
    有。請參閱[沙箱](/zh-TW/gateway/sandboxing)。若要了解 Docker 專屬設定（Docker 中的完整 Gateway 或沙箱映像），請參閱 [Docker](/zh-TW/install/docker)。
  </Accordion>

  <Accordion title="Docker 感覺受限 - 如何啟用完整功能？">
    預設映像以安全為優先，並以 `node` 使用者執行，因此不
    包含系統套件、Homebrew 或內建瀏覽器。若要更完整的設定：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，讓快取保留。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 將系統相依項目烘焙進映像。
    - 透過內建 CLI 安裝 Playwright 瀏覽器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 設定 `PLAYWRIGHT_BROWSERS_PATH`，並確保該路徑會被持久化。

    文件：[Docker](/zh-TW/install/docker)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="我可以用同一個代理讓 DM 保持個人化，但讓群組公開/沙箱化嗎？">
    可以，前提是你的私人流量是 **DM**，公開流量是**群組**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，讓群組/頻道工作階段（非主要 key）在已設定的沙箱後端中執行，而主要 DM 工作階段留在主機上。如果你沒有選擇後端，Docker 是預設後端。接著透過 `tools.sandbox.tools` 限制沙箱工作階段中可用的工具。

    設定逐步說明 + 範例設定：[群組：個人 DM + 公開群組](/zh-TW/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定參考：[Gateway 設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何將主機資料夾繫結到沙箱？">
    將 `agents.defaults.sandbox.docker.binds` 設為 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全域與每個代理的繫結會合併；當 `scope: "shared"` 時，會忽略每個代理的繫結。對任何敏感內容請使用 `:ro`，並記得繫結會繞過沙箱檔案系統牆。

    OpenClaw 會同時根據正規化路徑，以及透過最深層現有祖先解析出的標準路徑驗證繫結來源。這表示即使最後一段路徑尚不存在，符號連結父層跳脫仍會關閉失敗，而且允許根目錄檢查在符號連結解析後仍會套用。

    請參閱[沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts)和[沙箱 vs 工具政策 vs Elevated](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)，取得範例與安全注意事項。

  </Accordion>

  <Accordion title="記憶體如何運作？">
    OpenClaw 記憶體只是代理工作區中的 Markdown 檔案：

    - `memory/YYYY-MM-DD.md` 中的每日筆記
    - `MEMORY.md` 中精心整理的長期筆記（僅限主要/私人工作階段）

    OpenClaw 也會執行**靜默的 Compaction 前記憶體寫出**，提醒模型
    在自動 Compaction 前寫入持久筆記。這只會在工作區
    可寫入時執行（唯讀沙箱會略過）。請參閱[記憶體](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="記憶體一直忘記事情。如何讓它記住？">
    要求機器人**將事實寫入記憶體**。長期筆記應放在 `MEMORY.md`，
    短期情境則放入 `memory/YYYY-MM-DD.md`。

    這仍是我們正在改進的領域。提醒模型儲存記憶會有幫助；
    它會知道該怎麼做。如果它一直忘記，請確認 Gateway 每次執行都使用相同
    工作區。

    文件：[記憶體](/zh-TW/concepts/memory)、[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="記憶體會永久保留嗎？有哪些限制？">
    記憶體檔案位於磁碟上，會持續保留直到你刪除它們。限制是你的
    儲存空間，而不是模型。**工作階段情境**仍受限於模型
    情境視窗，因此長對話可能會 Compaction 或截斷。這就是
    記憶體搜尋存在的原因：它只會把相關部分拉回情境中。

    文件：[記憶體](/zh-TW/concepts/memory)、[情境](/zh-TW/concepts/context)。

  </Accordion>

  <Accordion title="語意記憶搜尋是否需要 OpenAI API 金鑰？">
    只有在你使用 **OpenAI embeddings** 時才需要。Codex OAuth 涵蓋聊天/補全，且
    **不會**授予 embeddings 存取權，因此**使用 Codex 登入（OAuth 或
    Codex CLI 登入）**對語意記憶搜尋沒有幫助。OpenAI embeddings
    仍需要真正的 API 金鑰（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你沒有明確設定提供者，OpenClaw 會在能解析 API 金鑰時自動選擇提供者
    （auth profiles、`models.providers.*.apiKey` 或環境變數）。
    若能解析 OpenAI 金鑰，會優先使用 OpenAI；否則若能解析 Gemini 金鑰，
    則使用 Gemini，接著是 Voyage，再來是 Mistral。如果沒有可用的遠端金鑰，記憶
    搜尋會維持停用，直到你設定完成。如果你已設定且存在本機模型路徑，
    OpenClaw
    會偏好 `local`。明確設定
    `memorySearch.provider = "ollama"` 時支援 Ollama。

    如果你想留在本機，請設定 `memorySearch.provider = "local"`（也可選擇性設定
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，請設定
    `memorySearch.provider = "gemini"` 並提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我們支援 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embedding
    模型 - 設定細節請參閱 [記憶](/zh-TW/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 資料在磁碟上的位置

<AccordionGroup>
  <Accordion title="所有與 OpenClaw 搭配使用的資料都會儲存在本機嗎？">
    不會 - **OpenClaw 的狀態是本機的**，但**外部服務仍會看到你傳送給它們的內容**。

    - **預設在本機：** 工作階段、記憶檔案、設定與工作區都位於 Gateway 主機上
      （`~/.openclaw` + 你的工作區目錄）。
    - **必要時會遠端傳送：** 你傳送給模型提供者（Anthropic/OpenAI/等）的訊息會送到
      它們的 API，而聊天平台（WhatsApp/Telegram/Slack/等）會將訊息資料儲存在它們的
      伺服器上。
    - **你可以控制足跡：** 使用本機模型會讓提示保留在你的機器上，但頻道
      流量仍會經過該頻道的伺服器。

    相關：[代理工作區](/zh-TW/concepts/agent-workspace)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 將資料儲存在何處？">
    所有內容都位於 `$OPENCLAW_STATE_DIR` 之下（預設：`~/.openclaw`）：

    | 路徑                                                            | 用途                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主要設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 舊版 OAuth 匯入（首次使用時複製到 auth profiles）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API 金鑰，以及可選的 `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供者可選的檔案式祕密 payload |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 舊版相容檔案（已清除靜態 `api_key` 項目）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供者狀態（例如 `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每個代理的狀態（agentDir + 工作階段）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 對話歷程與狀態（依代理）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 工作階段中繼資料（依代理）                                       |

    舊版單一代理路徑：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）。

    你的**工作區**（AGENTS.md、記憶檔案、skills 等）是分開的，並透過 `agents.defaults.workspace` 設定（預設：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 應該放在哪裡？">
    這些檔案位於**代理工作區**，不是 `~/.openclaw`。

    - **工作區（依代理）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、可選的 `HEARTBEAT.md`。
      小寫根目錄 `memory.md` 只是舊版修復輸入；當兩個檔案都存在時，`openclaw doctor --fix`
      可以將它合併進 `MEMORY.md`。
    - **狀態目錄（`~/.openclaw`）**：設定、頻道/提供者狀態、auth profiles、工作階段、記錄檔，
      以及共享 Skills（`~/.openclaw/skills`）。

    預設工作區是 `~/.openclaw/workspace`，可透過以下設定：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果 bot 在重新啟動後「忘記」內容，請確認 Gateway 每次啟動都使用相同的
    工作區（並記得：遠端模式使用的是 **gateway 主機的**
    工作區，而不是你的本機筆電）。

    提示：如果你想要持久保留某個行為或偏好，請要求 bot **將它寫入
    AGENTS.md 或 MEMORY.md**，而不是依賴聊天歷程。

    請參閱 [代理工作區](/zh-TW/concepts/agent-workspace) 與 [記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="建議的備份策略">
    將你的**代理工作區**放在**私人** git 儲存庫中，並備份到某個
    私人的地方（例如 GitHub private）。這會保存記憶 + AGENTS/SOUL/USER
    檔案，並讓你日後能還原助理的「心智」。

    請**不要**提交 `~/.openclaw` 底下的任何內容（憑證、工作階段、token 或加密祕密 payload）。
    如果你需要完整還原，請分別備份工作區與狀態目錄
    （請參閱上方的遷移問題）。

    文件：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全解除安裝 OpenClaw？">
    請參閱專門指南：[解除安裝](/zh-TW/install/uninstall)。
  </Accordion>

  <Accordion title="代理可以在工作區外工作嗎？">
    可以。工作區是**預設 cwd** 和記憶錨點，不是硬性 sandbox。
    相對路徑會在工作區內解析，但除非啟用 sandboxing，否則絕對路徑可以存取其他
    主機位置。如果你需要隔離，請使用
    [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing) 或每個代理的 sandbox 設定。如果你
    想讓某個 repo 成為預設工作目錄，請將該代理的
    `workspace` 指向 repo root。OpenClaw repo 只是原始碼；除非你有意讓代理在其中工作，
    否則請將工作區分開。

    範例（repo 作為預設 cwd）：

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="遠端模式：工作階段儲存在哪裡？">
    工作階段狀態由 **gateway 主機**擁有。如果你處於遠端模式，你關心的工作階段儲存區位於遠端機器，而不是你的本機筆電。請參閱 [工作階段管理](/zh-TW/concepts/session)。
  </Accordion>
</AccordionGroup>

## 設定基礎

<AccordionGroup>
  <Accordion title="設定是什麼格式？在哪裡？">
    OpenClaw 會從 `$OPENCLAW_CONFIG_PATH` 讀取可選的 **JSON5** 設定（預設：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果檔案不存在，它會使用相對安全的預設值（包含預設工作區 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我設定了 gateway.bind: "lan"（或 "tailnet"），現在沒有任何服務在監聽 / UI 顯示未授權'>
    非 loopback 綁定**需要有效的 gateway 驗證路徑**。實務上這表示：

    - shared-secret 驗證：token 或密碼
    - 在正確設定的 identity-aware 反向代理後方使用 `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    備註：

    - `gateway.remote.token` / `.password` **不會**自行啟用本機 gateway 驗證。
    - 只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才可以使用 `gateway.remote.*` 作為備援。
    - 若要使用密碼驗證，請改為設定 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，解析會封閉失敗（不會被遠端備援遮蔽）。
    - Shared-secret Control UI 設定會透過 `connect.params.auth.token` 或 `connect.params.auth.password`（儲存在 app/UI 設定中）驗證。Tailscale Serve 或 `trusted-proxy` 等帶有身分的模式則改用請求標頭。避免將 shared secrets 放在 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 時，同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並在 `gateway.trustedProxies` 中加入 loopback 項目。

  </Accordion>

  <Accordion title="為什麼我現在在 localhost 上也需要 token？">
    OpenClaw 預設會強制執行 gateway 驗證，包含 loopback。在一般預設路徑中，這表示使用 token 驗證：如果未設定明確的驗證路徑，gateway 啟動會解析為 token 模式，並為該次啟動產生僅限執行期間使用的 token，因此**本機 WS 用戶端必須驗證**。當用戶端需要跨重新啟動維持穩定祕密時，請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。這會阻止其他本機程序呼叫 Gateway。

    如果你偏好不同的驗證路徑，可以明確選擇密碼模式（或針對 identity-aware 反向代理選擇 `trusted-proxy`）。如果你**真的**想開放 loopback，請在設定中明確設定 `gateway.auth.mode: "none"`。Doctor 可隨時為你產生 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="變更設定後我必須重新啟動嗎？">
    Gateway 會監看設定並支援 hot-reload：

    - `gateway.reload.mode: "hybrid"`（預設）：hot-apply 安全變更，重大變更則重新啟動
    - 也支援 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何停用有趣的 CLI 標語？">
    在設定中設定 `cli.banner.taglineMode`：

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`：隱藏標語文字，但保留橫幅標題/版本列。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：輪替有趣/季節性標語（預設行為）。
    - 如果你完全不想要橫幅，請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何啟用網頁搜尋（以及網頁擷取）？">
    `web_fetch` 不需要 API 金鑰即可運作。`web_search` 則取決於你選擇的
    提供者：

    - 由 API 支援的提供者，例如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily，需要各自的一般 API 金鑰設定。
    - Ollama Web Search 不需要金鑰，但會使用你設定的 Ollama 主機，並需要 `ollama signin`。
    - DuckDuckGo 不需要金鑰，但它是非官方的 HTML 型整合。
    - SearXNG 不需要金鑰/可自行託管；請設定 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **建議：** 執行 `openclaw configure --section web` 並選擇提供者。
    環境替代方案：

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Provider 專屬的網頁搜尋設定現在位於 `plugins.entries.<plugin>.config.webSearch.*` 底下。
    舊版 `tools.web.search.*` Provider 路徑仍會暫時載入以維持相容性，但新設定不應再使用它們。
    Firecrawl 網頁擷取後援設定位於 `plugins.entries.firecrawl.config.webFetch.*` 底下。

    注意事項：

    - 如果使用允許清單，請加入 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 預設會啟用（除非明確停用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 會從可用的憑證中自動偵測第一個就緒的擷取後援 Provider。目前內建的 Provider 是 Firecrawl。
    - Daemon 會從 `~/.openclaw/.env`（或服務環境）讀取環境變數。

    文件：[網頁工具](/zh-TW/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清除了我的設定。我要如何復原並避免這種情況？">
    `config.apply` 會取代**整份設定**。如果你送出部分物件，其他所有內容
    都會被移除。

    目前的 OpenClaw 會防護許多意外覆寫：

    - OpenClaw 擁有的設定寫入會在寫入前驗證變更後的完整設定。
    - 無效或具破壞性的 OpenClaw 擁有寫入會被拒絕，並儲存為 `openclaw.json.rejected.*`。
    - 如果直接編輯導致啟動或熱重新載入失敗，Gateway 會以關閉方式失敗或略過重新載入；它不會重寫 `openclaw.json`。
    - `openclaw doctor --fix` 負責修復，並可在將遭拒檔案儲存為 `openclaw.json.clobbered.*` 的同時還原最後已知良好的設定。

    復原：

    - 檢查 `openclaw logs --follow` 中是否有 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 檢查作用中設定旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 執行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 只用 `openclaw config set` 或 `config.patch` 複製預期的鍵回去。
    - 如果沒有最後已知良好設定或遭拒 payload，請從備份還原，或重新執行 `openclaw doctor` 並重新設定頻道/模型。
    - 如果這是非預期狀況，請提交 bug，並附上你最後已知的設定或任何備份。
    - 本機編碼 Agent 通常可以從記錄或歷史中重建可運作的設定。

    避免方式：

    - 小變更請使用 `openclaw config set`。
    - 互動式編輯請使用 `openclaw configure`。
    - 如果不確定確切路徑或欄位形狀，請先使用 `config.schema.lookup`；它會回傳淺層 schema 節點，以及直接子項摘要供向下探查。
    - 部分 RPC 編輯請使用 `config.patch`；`config.apply` 只保留給完整設定取代。
    - 如果你在 Agent 執行中使用僅限擁有者的 `gateway` 工具，它仍會拒絕寫入 `tools.exec.ask` / `tools.exec.security`（包含會正規化到相同受保護 exec 路徑的舊版 `tools.bash.*` 別名）。

    文件：[設定](/zh-TW/cli/config)、[Configure](/zh-TW/cli/configure)、[Gateway 疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="我要如何跨裝置以專門化 worker 執行中央 Gateway？">
    常見模式是**一個 Gateway**（例如 Raspberry Pi）加上**節點**和 **Agent**：

    - **Gateway（中央）：** 擁有頻道（Signal/WhatsApp）、路由和工作階段。
    - **節點（裝置）：** Mac/iOS/Android 以周邊裝置連線，並公開本機工具（`system.run`、`canvas`、`camera`）。
    - **Agent（worker）：** 針對特殊角色分離的大腦/工作區（例如「Hetzner 維運」、「個人資料」）。
    - **子 Agent：** 當你想要平行處理時，從主 Agent 產生背景工作。
    - **TUI：** 連線到 Gateway 並切換 Agent/工作階段。

    文件：[節點](/zh-TW/nodes)、[遠端存取](/zh-TW/gateway/remote)、[多 Agent 路由](/zh-TW/concepts/multi-agent)、[子 Agent](/zh-TW/tools/subagents)、[TUI](/zh-TW/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 瀏覽器可以以 headless 模式執行嗎？">
    可以。這是一個設定選項：

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    預設值是 `false`（有頭模式）。Headless 較可能在某些網站觸發反 Bot 檢查。請參閱[瀏覽器](/zh-TW/tools/browser)。

    Headless 使用**相同的 Chromium 引擎**，且適用於大多數自動化（表單、點擊、擷取、登入）。主要差異：

    - 沒有可見的瀏覽器視窗（如果需要視覺內容，請使用截圖）。
    - 某些網站對 headless 模式中的自動化更嚴格（CAPTCHA、反 Bot）。
      例如，X/Twitter 經常封鎖 headless 工作階段。

  </Accordion>

  <Accordion title="我要如何使用 Brave 進行瀏覽器控制？">
    將 `browser.executablePath` 設為你的 Brave 二進位檔（或任何 Chromium 架構瀏覽器），然後重新啟動 Gateway。
    請參閱[瀏覽器](/zh-TW/tools/browser#use-brave-or-another-chromium-based-browser)中的完整設定範例。
  </Accordion>
</AccordionGroup>

## 遠端 Gateway 與節點

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、Gateway 和節點之間傳播？">
    Telegram 訊息由 **Gateway** 處理。Gateway 執行 Agent，並且
    只有在需要節點工具時才會透過 **Gateway WebSocket** 呼叫節點：

    Telegram → Gateway → Agent → `node.*` → 節點 → Gateway → Telegram

    節點看不到傳入的 Provider 流量；它們只會接收節點 RPC 呼叫。

  </Accordion>

  <Accordion title="如果 Gateway 託管在遠端，我的 Agent 要如何存取我的電腦？">
    簡短答案：**將你的電腦配對為節點**。Gateway 在其他地方執行，但它可以
    透過 Gateway WebSocket 呼叫你本機電腦上的 `node.*` 工具（螢幕、相機、系統）。

    典型設定：

    1. 在永遠開機的主機（VPS/家用伺服器）上執行 Gateway。
    2. 將 Gateway 主機與你的電腦放在同一個 tailnet 上。
    3. 確保 Gateway WS 可連線（tailnet 綁定或 SSH 通道）。
    4. 在本機開啟 macOS App，並以 **Remote over SSH** 模式（或直接 tailnet）
       連線，使其可註冊為節點。
    5. 在 Gateway 上核准節點：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要額外的 TCP bridge；節點會透過 Gateway WebSocket 連線。

    安全提醒：配對 macOS 節點會允許在該機器上使用 `system.run`。只
    配對你信任的裝置，並檢閱[安全性](/zh-TW/gateway/security)。

    文件：[節點](/zh-TW/nodes)、[Gateway 協定](/zh-TW/gateway/protocol)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已連線，但我沒有收到回覆。現在該怎麼辦？">
    檢查基本項目：

    - Gateway 是否正在執行：`openclaw gateway status`
    - Gateway 健康狀態：`openclaw status`
    - 頻道健康狀態：`openclaw channels status`

    接著驗證 auth 和路由：

    - 如果使用 Tailscale Serve，請確認 `gateway.auth.allowTailscale` 設定正確。
    - 如果透過 SSH 通道連線，請確認本機通道已啟動並指向正確的連接埠。
    - 確認你的允許清單（DM 或群組）包含你的帳號。

    文件：[Tailscale](/zh-TW/gateway/tailscale)、[遠端存取](/zh-TW/gateway/remote)、[頻道](/zh-TW/channels)。

  </Accordion>

  <Accordion title="兩個 OpenClaw 執行個體可以互相通訊嗎（本機 + VPS）？">
    可以。沒有內建的「Bot 對 Bot」bridge，但你可以用幾種
    可靠方式串接起來：

    **最簡單：** 使用兩個 Bot 都可存取的一般聊天頻道（Telegram/Slack/WhatsApp）。
    讓 Bot A 傳送訊息給 Bot B，然後讓 Bot B 照常回覆。

    **CLI bridge（通用）：** 執行一個 script，使用 `openclaw agent --message ... --deliver`
    呼叫另一個 Gateway，目標是另一個 Bot 監聽的聊天。如果其中一個 Bot 在遠端 VPS 上，請透過 SSH/Tailscale 將你的 CLI 指向該遠端 Gateway
    （請參閱[遠端存取](/zh-TW/gateway/remote)）。

    範例模式（從可連到目標 Gateway 的機器執行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加入防護欄，避免兩個 Bot 無止境循環（僅提及、頻道
    允許清單，或「不要回覆 Bot 訊息」規則）。

    文件：[遠端存取](/zh-TW/gateway/remote)、[Agent CLI](/zh-TW/cli/agent)、[Agent 傳送](/zh-TW/tools/agent-send)。

  </Accordion>

  <Accordion title="多個 Agent 需要個別的 VPS 嗎？">
    不需要。一個 Gateway 可以託管多個 Agent，每個都有自己的工作區、模型預設值
    和路由。這是一般設定，且比每個 Agent 執行一台 VPS 便宜且簡單得多。

    只有在需要硬性隔離（安全邊界）或非常不同且不想共用的設定時，才使用個別 VPS。否則，保留一個 Gateway，
    並使用多個 Agent 或子 Agent。

  </Accordion>

  <Accordion title="使用個人筆電上的節點，而不是從 VPS SSH，有什麼好處嗎？">
    有，節點是從遠端 Gateway 連到你筆電的一級方式，而且它們
    不只提供 shell 存取。Gateway 可在 macOS/Linux（Windows 透過 WSL2）上執行，且很輕量（小型 VPS 或 Raspberry Pi 等級的機器即可；4 GB RAM 很充足），因此常見
    設定是永遠開機的主機加上你的筆電作為節點。

    - **不需要傳入 SSH。** 節點會連出到 Gateway WebSocket 並使用裝置配對。
    - **更安全的執行控制。** `system.run` 會由該筆電上的節點允許清單/核准把關。
    - **更多裝置工具。** 節點除了 `system.run` 之外，也會公開 `canvas`、`camera` 和 `screen`。
    - **本機瀏覽器自動化。** 將 Gateway 保留在 VPS 上，但透過筆電上的節點主機在本機執行 Chrome，或透過 Chrome MCP 附加到主機上的本機 Chrome。

    SSH 適合臨時 shell 存取，但節點對持續的 Agent 工作流程和
    裝置自動化更簡單。

    文件：[節點](/zh-TW/nodes)、[節點 CLI](/zh-TW/cli/nodes)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="節點會執行 Gateway 服務嗎？">
    不會。除非你刻意執行隔離的 profile（請參閱[多個 Gateway](/zh-TW/gateway/multiple-gateways)），否則每台主機只應執行**一個 Gateway**。節點是連線
    到 Gateway 的周邊裝置（iOS/Android 節點，或選單列 App 中的 macOS「節點模式」）。如需 headless 節點
    主機和 CLI 控制，請參閱[節點主機 CLI](/zh-TW/cli/node)。

    `gateway`、`discovery` 和託管 Plugin 介面變更需要完整重新啟動。

  </Accordion>

  <Accordion title="是否有 API / RPC 方式可以套用設定？">
    有。

    - `config.schema.lookup`：在寫入前，檢查一個設定子樹，包含其淺層結構描述節點、符合的 UI 提示，以及直接子項摘要
    - `config.get`：擷取目前的快照 + 雜湊
    - `config.patch`：安全的部分更新（多數 RPC 編輯的首選）；可行時熱重新載入，必要時重新啟動
    - `config.apply`：驗證 + 取代完整設定；可行時熱重新載入，必要時重新啟動
    - 僅限擁有者的 `gateway` runtime 工具仍會拒絕重寫 `tools.exec.ask` / `tools.exec.security`；舊版 `tools.bash.*` 別名會正規化到相同受保護的 exec 路徑

  </Accordion>

  <Accordion title="首次安裝的最小合理設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    這會設定你的工作區，並限制誰可以觸發機器人。

  </Accordion>

  <Accordion title="如何在 VPS 上設定 Tailscale，並從我的 Mac 連線？">
    最小步驟：

    1. **在 VPS 上安裝 + 登入**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安裝 + 登入**
       - 使用 Tailscale app，並登入同一個 tailnet。
    3. **啟用 MagicDNS（建議）**
       - 在 Tailscale 管理主控台中啟用 MagicDNS，讓 VPS 擁有穩定名稱。
    4. **使用 tailnet 主機名稱**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情況下存取 Control UI，請在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    這會讓 Gateway 綁定在 loopback，並透過 Tailscale 暴露 HTTPS。請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何將 Mac Node 連到遠端 Gateway（Tailscale Serve）？">
    Serve 會暴露 **Gateway Control UI + WS**。Node 會透過同一個 Gateway WS 端點連線。

    建議設定：

    1. **確認 VPS + Mac 位於同一個 tailnet**。
    2. **在遠端模式使用 macOS app**（SSH 目標可以是 tailnet 主機名稱）。
       app 會建立 Gateway 連接埠的通道，並以 Node 身分連線。
    3. **在 Gateway 上核准 Node**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文件：[Gateway 通訊協定](/zh-TW/gateway/protocol)、[探索](/zh-TW/gateway/discovery)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我應該安裝在第二台筆電，還是只新增一個 Node？">
    如果你只需要第二台筆電上的**本機工具**（螢幕/相機/exec），請將它新增為
    **Node**。這會保留單一 Gateway，並避免重複設定。本機 Node 工具
    目前僅支援 macOS，但我們計畫將它們擴展到其他作業系統。

    只有在你需要**強隔離**或兩個完全分離的機器人時，才安裝第二個 Gateway。

    文件：[Node](/zh-TW/nodes)、[Node CLI](/zh-TW/cli/nodes)、[多個 Gateway](/zh-TW/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境變數與 .env 載入

<AccordionGroup>
  <Accordion title="OpenClaw 如何載入環境變數？">
    OpenClaw 會從父行程（shell、launchd/systemd、CI 等）讀取環境變數，並額外載入：

    - 目前工作目錄中的 `.env`
    - 來自 `~/.openclaw/.env` 的全域備援 `.env`（又稱 `$OPENCLAW_STATE_DIR/.env`）

    兩個 `.env` 檔案都不會覆寫既有的環境變數。

    你也可以在設定中定義行內環境變數（只會在 process env 缺少時套用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完整的優先順序與來源請參閱 [/environment](/zh-TW/help/environment)。

  </Accordion>

  <Accordion title="我透過服務啟動 Gateway，但我的環境變數消失了。現在該怎麼辦？">
    兩個常見修正方式：

    1. 將缺少的金鑰放入 `~/.openclaw/.env`，這樣即使服務沒有繼承你的 shell env，也能讀取它們。
    2. 啟用 shell 匯入（選擇性便利功能）：

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    這會執行你的登入 shell，並只匯入缺少的預期金鑰（絕不覆寫）。對應的環境變數：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我設定了 COPILOT_GITHUB_TOKEN，但模型狀態顯示「Shell env: off.」。為什麼？'>
    `openclaw models status` 會回報是否啟用了 **shell env 匯入**。「Shell env: off」
    **不**代表你的環境變數遺失，只表示 OpenClaw 不會自動載入
    你的登入 shell。

    如果 Gateway 以服務（launchd/systemd）身分執行，它不會繼承你的 shell
    環境。請用以下其中一種方式修正：

    1. 將 token 放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或啟用 shell 匯入（`env.shellEnv.enabled: true`）。
    3. 或將它新增到你的設定 `env` 區塊（只會在缺少時套用）。

    然後重新啟動 Gateway 並再次檢查：

    ```bash
    openclaw models status
    ```

    Copilot token 會從 `COPILOT_GITHUB_TOKEN` 讀取（也包括 `GH_TOKEN` / `GITHUB_TOKEN`）。
    請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers) 和 [/environment](/zh-TW/help/environment)。

  </Accordion>
</AccordionGroup>

## 工作階段與多個聊天

<AccordionGroup>
  <Accordion title="如何開始全新的對話？">
    以獨立訊息傳送 `/new` 或 `/reset`。請參閱 [工作階段管理](/zh-TW/concepts/session)。
  </Accordion>

  <Accordion title="如果我從不傳送 /new，工作階段會自動重設嗎？">
    工作階段可在 `session.idleMinutes` 後過期，但這項功能**預設停用**（預設為 **0**）。
    將它設為正值即可啟用閒置過期。啟用後，閒置期間之後的**下一則**
    訊息會為該聊天鍵開始新的工作階段 ID。
    這不會刪除逐字記錄，只是開始新的工作階段。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有辦法建立一隊 OpenClaw 執行個體（一個 CEO 和許多代理）嗎？">
    可以，透過**多代理路由**和**子代理**。你可以建立一個協調
    代理，以及多個擁有各自工作區和模型的工作代理。

    話雖如此，這最好視為一個**有趣的實驗**。它很耗 token，而且通常
    不如使用一個搭配不同工作階段的機器人有效率。我們設想的典型模型是
    一個你對話的機器人，並以不同工作階段處理並行工作。該機器人也可以在需要時產生子代理。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[代理 CLI](/zh-TW/cli/agents)。

  </Accordion>

  <Accordion title="為什麼內容在任務中途被截斷？我要如何避免？">
    工作階段內容受模型視窗限制。長對話、大量工具輸出或許多
    檔案都可能觸發 Compaction 或截斷。

    有幫助的做法：

    - 要求機器人摘要目前狀態，並將摘要寫入檔案。
    - 在長任務前使用 `/compact`，切換主題時使用 `/new`。
    - 將重要內容保留在工作區，並要求機器人讀回。
    - 將子代理用於長時間或並行工作，讓主聊天保持較小。
    - 如果這種情況經常發生，請選擇具有更大內容視窗的模型。

  </Accordion>

  <Accordion title="如何完全重設 OpenClaw，但保留安裝？">
    使用 reset 命令：

    ```bash
    openclaw reset
    ```

    非互動式完整重設：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    然後重新執行設定：

    ```bash
    openclaw onboard --install-daemon
    ```

    注意事項：

    - 如果入門設定偵測到既有設定，也會提供 **Reset**。請參閱 [入門設定（CLI）](/zh-TW/start/wizard)。
    - 如果你使用 profile（`--profile` / `OPENCLAW_PROFILE`），請重設每個狀態目錄（預設為 `~/.openclaw-<profile>`）。
    - 開發重設：`openclaw gateway --dev --reset`（僅限開發；會清除開發設定 + 憑證 + 工作階段 + 工作區）。

  </Accordion>

  <Accordion title='我遇到「context too large」錯誤，如何重設或 compact？'>
    使用以下其中一種：

    - **Compact**（保留對話，但摘要較舊的回合）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 來引導摘要。

    - **Reset**（為同一個聊天鍵建立新的工作階段 ID）：

      ```
      /new
      /reset
      ```

    如果情況持續發生：

    - 啟用或調整**工作階段修剪**（`agents.defaults.contextPruning`）以修剪舊的工具輸出。
    - 使用具有更大內容視窗的模型。

    文件：[Compaction](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title='為什麼我會看到「LLM request rejected: messages.content.tool_use.input field required」？'>
    這是 provider 驗證錯誤：模型發出了缺少必要
    `input` 的 `tool_use` 區塊。這通常表示工作階段歷史已過時或毀損（常見於長串討論
    或工具/結構描述變更之後）。

    修正方式：使用 `/new`（獨立訊息）開始全新工作階段。

  </Accordion>

  <Accordion title="為什麼我每 30 分鐘都會收到 Heartbeat 訊息？">
    Heartbeat 預設每 **30m** 執行一次（使用 OAuth 驗證時為 **1h**）。調整或停用它們：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但實際上是空的（只有空白行和 markdown
    標題，例如 `# Heading`），OpenClaw 會略過 Heartbeat 執行以節省 API 呼叫。
    如果檔案不存在，Heartbeat 仍會執行，並由模型決定要做什麼。

    每個代理的覆寫使用 `agents.list[].heartbeat`。文件：[Heartbeat](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要將「bot account」新增到 WhatsApp 群組嗎？'>
    不需要。OpenClaw 會在**你自己的帳號**上執行，所以如果你在群組中，OpenClaw 就能看到它。
    預設情況下，群組回覆會被封鎖，直到你允許傳送者（`groupPolicy: "allowlist"`）。

    如果你只想讓**你**能觸發群組回覆：

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="如何取得 WhatsApp 群組的 JID？">
    選項 1（最快）：追蹤記錄並在群組中傳送測試訊息：

    ```bash
    openclaw logs --follow --json
    ```

    尋找結尾為 `@g.us` 的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    選項 2（如果已設定/allowlist）：從設定列出群組：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[目錄](/zh-TW/cli/directory)、[記錄](/zh-TW/cli/logs)。

  </Accordion>

  <Accordion title="為什麼 OpenClaw 不在群組中回覆？">
    兩個常見原因：

    - 提及門檻已開啟（預設）。你必須 @mention 機器人（或符合 `mentionPatterns`）。
    - 你設定了 `channels.whatsapp.groups` 但沒有 `"*"`，且該群組不在 allowlist 中。

    請參閱 [群組](/zh-TW/channels/groups) 和 [群組訊息](/zh-TW/channels/group-messages)。

  </Accordion>

  <Accordion title="群組/討論串會與私訊共用內容嗎？">
    直接聊天預設會摺疊到主工作階段。群組/頻道有自己的工作階段鍵，而 Telegram 主題 / Discord 討論串是獨立工作階段。請參閱 [群組](/zh-TW/channels/groups) 和 [群組訊息](/zh-TW/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以建立多少個工作區和代理？">
    沒有硬性限制。數十個（甚至數百個）都可以，但請注意：

    - **磁碟成長：** 工作階段 + 轉錄記錄位於 `~/.openclaw/agents/<agentId>/sessions/`。
    - **Token 成本：** 更多代理代表更多並行模型用量。
    - **維運負擔：** 每個代理各自的驗證設定檔、工作區與通道路由。

    提示：

    - 每個代理保留一個**作用中**工作區（`agents.defaults.workspace`）。
    - 如果磁碟用量成長，請修剪舊工作階段（刪除 JSONL 或儲存項目）。
    - 使用 `openclaw doctor` 找出零散工作區和設定檔不相符之處。

  </Accordion>

  <Accordion title="我可以同時執行多個 bot 或聊天（Slack）嗎？應該如何設定？">
    可以。使用**多代理路由**來執行多個隔離的代理，並依
    通道/帳號/對等端路由傳入訊息。Slack 支援作為通道，且可綁定至特定代理。

    瀏覽器存取功能很強，但不是「人類能做什麼就能做什麼」；反 bot、CAPTCHA 和 MFA
    仍可能阻擋自動化。若要獲得最可靠的瀏覽器控制，請在主機上使用本機 Chrome MCP，
    或在實際執行瀏覽器的機器上使用 CDP。

    最佳實務設定：

    - 常駐 Gateway 主機（VPS/Mac mini）。
    - 每個角色一個代理（繫結）。
    - Slack 通道綁定到這些代理。
    - 需要時透過 Chrome MCP 或節點使用本機瀏覽器。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[Slack](/zh-TW/channels/slack)、
    [瀏覽器](/zh-TW/tools/browser)、[節點](/zh-TW/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、容錯移轉與驗證設定檔

模型問答 — 預設值、選擇、別名、切換、容錯移轉、驗證設定檔 —
位於[模型常見問題](/zh-TW/help/faq-models)。

## Gateway：連接埠、「已在執行」與遠端模式

<AccordionGroup>
  <Accordion title="Gateway 使用哪個連接埠？">
    `gateway.port` 控制 WebSocket + HTTP（控制 UI、hook 等）的單一多工連接埠。

    優先順序：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示 "Runtime: running"，但 "Connectivity probe: failed"？'>
    因為「running」是**監督器**的觀點（launchd/systemd/schtasks）。連線探測則是 CLI 實際連到 gateway WebSocket。

    使用 `openclaw gateway status`，並信任這些行：

    - `Probe target:`（探測實際使用的 URL）
    - `Listening:`（連接埠上實際綁定的項目）
    - `Last gateway error:`（程序存活但連接埠未監聽時的常見根本原因）

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示的 "Config (cli)" 和 "Config (service)" 不同？'>
    你正在編輯一個設定檔，但服務正在使用另一個設定檔執行（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不相符）。

    修正：

    ```bash
    openclaw gateway install --force
    ```

    請從你希望服務使用的相同 `--profile` / 環境執行該命令。

  </Accordion>

  <Accordion title='"another gateway instance is already listening" 是什麼意思？'>
    OpenClaw 會在啟動時立即綁定 WebSocket 監聽器（預設 `ws://127.0.0.1:18789`）來強制執行執行階段鎖定。如果綁定因 `EADDRINUSE` 失敗，會擲出 `GatewayLockError`，表示已有另一個執行個體正在監聽。

    修正：停止另一個執行個體、釋放連接埠，或使用 `openclaw gateway --port <port>` 執行。

  </Accordion>

  <Accordion title="我要如何以遠端模式執行 OpenClaw（用戶端連到其他地方的 Gateway）？">
    設定 `gateway.mode: "remote"`，並指向遠端 WebSocket URL，可選擇搭配共享密鑰遠端憑證：

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    注意事項：

    - `openclaw gateway` 只會在 `gateway.mode` 為 `local` 時啟動（或你傳入覆寫旗標）。
    - macOS app 會監看設定檔，並在這些值變更時即時切換模式。
    - `gateway.remote.token` / `.password` 只是用戶端的遠端憑證；它們本身不會啟用本機 gateway 驗證。

  </Accordion>

  <Accordion title='控制 UI 顯示 "unauthorized"（或持續重新連線）。現在該怎麼辦？'>
    你的 gateway 驗證路徑與 UI 的驗證方法不相符。

    事實（來自程式碼）：

    - 控制 UI 會將 Token 保存在目前瀏覽器分頁工作階段和所選 gateway URL 的 `sessionStorage` 中，因此同一分頁重新整理仍可繼續運作，而不會恢復長期 localStorage Token 持久性。
    - 在 `AUTH_TOKEN_MISMATCH` 時，受信任的用戶端可在 gateway 傳回重試提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）時，使用快取的裝置 Token 嘗試一次有界重試。
    - 該快取 Token 重試現在會重用與裝置 Token 一起儲存的快取已核准範圍。明確的 `deviceToken` / 明確的 `scopes` 呼叫端仍會保留其要求的範圍集，而不是繼承快取範圍。
    - 在該重試路徑之外，連線驗證優先順序為明確共享 Token/密碼優先，其次是明確 `deviceToken`，再來是已儲存的裝置 Token，最後是 bootstrap Token。
    - Bootstrap Token 範圍檢查會加上角色前綴。內建 bootstrap 操作者允許清單只滿足操作者要求；節點或其他非操作者角色仍需要其自身角色前綴下的範圍。

    修正：

    - 最快：`openclaw dashboard`（列印 + 複製 dashboard URL，嘗試開啟；若為 headless 則顯示 SSH 提示）。
    - 如果你還沒有 Token：`openclaw doctor --generate-gateway-token`。
    - 如果是遠端，先建立 tunnel：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。
    - 共享密鑰模式：設定 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然後在控制 UI 設定中貼上相符的密鑰。
    - Tailscale Serve 模式：確認已啟用 `gateway.auth.allowTailscale`，且你開啟的是 Serve URL，而不是繞過 Tailscale 身分標頭的原始 loopback/tailnet URL。
    - 受信任 Proxy 模式：確認你是透過已設定的身分感知 Proxy 進入，而不是原始 gateway URL。同主機 loopback Proxy 也需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重試後仍不相符，請輪替/重新核准已配對的裝置 Token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果該輪替呼叫顯示被拒絕，請檢查兩件事：
      - 已配對裝置工作階段只能輪替其**自己的**裝置，除非它們也擁有 `operator.admin`
      - 明確的 `--scope` 值不能超過呼叫端目前的操作者範圍
    - 還是卡住？執行 `openclaw status --all` 並依照[疑難排解](/zh-TW/gateway/troubleshooting)。驗證詳細資料請參閱 [Dashboard](/zh-TW/web/dashboard)。

  </Accordion>

  <Accordion title="我設定了 gateway.bind tailnet，但它無法綁定且沒有任何項目監聽">
    `tailnet` 綁定會從你的網路介面選取 Tailscale IP（100.64.0.0/10）。如果機器不在 Tailscale 上（或介面已關閉），就沒有可綁定的項目。

    修正：

    - 在該主機上啟動 Tailscale（讓它有 100.x 位址），或
    - 切換到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是明確指定。`auto` 偏好 loopback；當你想要僅限 tailnet 的綁定時，請使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主機上執行多個 Gateway 嗎？">
    通常不行，一個 Gateway 可以執行多個訊息通道和代理。只有在你需要冗餘（例如：救援 bot）或硬隔離時，才使用多個 Gateway。

    可以，但你必須隔離：

    - `OPENCLAW_CONFIG_PATH`（每個執行個體各自的設定）
    - `OPENCLAW_STATE_DIR`（每個執行個體各自的狀態）
    - `agents.defaults.workspace`（工作區隔離）
    - `gateway.port`（唯一連接埠）

    快速設定（建議）：

    - 每個執行個體使用 `openclaw --profile <name> ...`（自動建立 `~/.openclaw-<name>`）。
    - 在每個設定檔設定中設定唯一的 `gateway.port`（或為手動執行傳入 `--port`）。
    - 安裝每個設定檔各自的服務：`openclaw --profile <name> gateway install`。

    設定檔也會為服務名稱加上後綴（`ai.openclaw.<profile>`；舊版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多個 gateway](/zh-TW/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='"invalid handshake" / 代碼 1008 是什麼意思？'>
    Gateway 是一個 **WebSocket 伺服器**，並預期第一個訊息就是
    `connect` frame。如果它收到其他任何內容，就會以 **代碼 1008**
    （政策違規）關閉連線。

    常見原因：

    - 你在瀏覽器中開啟了 **HTTP** URL（`http://...`），而不是 WS 用戶端。
    - 你使用了錯誤的連接埠或路徑。
    - Proxy 或 tunnel 移除了驗證標頭，或傳送了非 Gateway 要求。

    快速修正：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，則用 `wss://...`）。
    2. 不要在一般瀏覽器分頁中開啟 WS 連接埠。
    3. 如果已開啟驗證，請在 `connect` frame 中包含 Token/密碼。

    如果你使用 CLI 或 TUI，URL 應該如下：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    協定詳細資料：[Gateway protocol](/zh-TW/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 記錄與除錯

<AccordionGroup>
  <Accordion title="記錄在哪裡？">
    檔案記錄（結構化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以透過 `logging.file` 設定穩定路徑。檔案記錄層級由 `logging.level` 控制。主控台詳細程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快的記錄 tail：

    ```bash
    openclaw logs --follow
    ```

    服務/監督器記錄（當 gateway 透過 launchd/systemd 執行時）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（預設：`~/.openclaw/logs/...`；設定檔使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多資訊請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="我要如何啟動/停止/重新啟動 Gateway 服務？">
    使用 gateway 輔助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行 gateway，`openclaw gateway --force` 可以收回連接埠。請參閱 [Gateway](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上關閉了終端機，要如何重新啟動 OpenClaw？">
    有**兩種 Windows 安裝模式**：

    **1) WSL2（建議）：** Gateway 在 Linux 內執行。

    開啟 PowerShell，進入 WSL，然後重新啟動：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你從未安裝服務，請在前景啟動它：

    ```bash
    openclaw gateway run
    ```

    **2) 原生 Windows（不建議）：** Gateway 直接在 Windows 中執行。

    開啟 PowerShell 並執行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行它（沒有服務），請使用：

    ```powershell
    openclaw gateway run
    ```

    文件：[Windows (WSL2)](/zh-TW/platforms/windows)、[Gateway service runbook](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="Gateway 已啟動，但回覆一直沒有送達。我該檢查什麼？">
    先從快速健康狀態掃描開始：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常見原因：

    - 模型驗證未載入到 **Gateway 主機**（檢查 `models status`）。
    - 頻道配對/允許清單阻擋回覆（檢查頻道設定與記錄）。
    - WebChat/Dashboard 開啟時沒有正確的權杖。

    如果你是遠端連線，請確認 tunnel/Tailscale 連線已啟動，且
    Gateway WebSocket 可連線。

    文件：[頻道](/zh-TW/channels)、[疑難排解](/zh-TW/gateway/troubleshooting)、[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 現在該怎麼辦？'>
    這通常表示 UI 失去了 WebSocket 連線。請檢查：

    1. Gateway 是否正在執行？`openclaw gateway status`
    2. Gateway 是否健康？`openclaw status`
    3. UI 是否有正確的權杖？`openclaw dashboard`
    4. 如果是遠端連線，tunnel/Tailscale 連結是否已啟動？

    接著追蹤記錄：

    ```bash
    openclaw logs --follow
    ```

    文件：[Dashboard](/zh-TW/web/dashboard)、[遠端存取](/zh-TW/gateway/remote)、[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失敗。我該檢查什麼？">
    從記錄和頻道狀態開始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    接著比對錯誤：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 選單項目太多。OpenClaw 已經會裁減到 Telegram 限制並以較少指令重試，但仍有一些選單項目需要移除。請減少 Plugin/skill/自訂指令，或在不需要選單時停用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`，或類似網路錯誤：如果你在 VPS 上或位於代理後方，請確認允許對外 HTTPS，且 `api.telegram.org` 的 DNS 可正常運作。

    如果 Gateway 是遠端執行，請確保你查看的是 Gateway 主機上的記錄。

    文件：[Telegram](/zh-TW/channels/telegram)、[頻道疑難排解](/zh-TW/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 沒有顯示輸出。我該檢查什麼？">
    先確認 Gateway 可連線，且代理能夠執行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看目前狀態。如果你預期在聊天
    頻道中收到回覆，請確認已啟用傳送（`/deliver on`）。

    文件：[TUI](/zh-TW/web/tui)、[斜線指令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="我要如何完整停止再啟動 Gateway？">
    如果你已安裝服務：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    這會停止/啟動 **受監督的服務**（macOS 上的 launchd，Linux 上的 systemd）。
    當 Gateway 以 daemon 形式在背景執行時，請使用這個方式。

    如果你是在前景執行，請用 Ctrl-C 停止，接著：

    ```bash
    openclaw gateway run
    ```

    文件：[Gateway 服務執行手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="五歲也能懂：openclaw gateway restart 與 openclaw gateway">
    - `openclaw gateway restart`：重新啟動 **背景服務**（launchd/systemd）。
    - `openclaw gateway`：在這個終端機工作階段中 **以前景方式** 執行 gateway。

    如果你已安裝服務，請使用 gateway 指令。當你想要一次性的前景執行時，
    請使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="發生失敗時最快取得更多詳細資訊的方法">
    使用 `--verbose` 啟動 Gateway，以取得更多主控台細節。接著檢查記錄檔中的頻道驗證、模型路由和 RPC 錯誤。
  </Accordion>
</AccordionGroup>

## 媒體與附件

<AccordionGroup>
  <Accordion title="我的 skill 產生了圖片/PDF，但沒有送出任何內容">
    代理送出的外傳附件必須包含一行 `MEDIA:<path-or-url>`（獨立成行）。請參閱 [OpenClaw 助理設定](/zh-TW/start/openclaw)和[代理傳送](/zh-TW/tools/agent-send)。

    CLI 傳送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    也請檢查：

    - 目標頻道支援外傳媒體，且未被允許清單阻擋。
    - 檔案在提供者的大小限制內（圖片會調整為最大 2048px）。
    - `tools.fs.workspaceOnly=true` 會將本機路徑傳送限制在工作區、暫存/媒體儲存，以及通過沙箱驗證的檔案。
    - `tools.fs.workspaceOnly=false` 允許 `MEDIA:` 傳送代理已可讀取的主機本機檔案，但僅限媒體與安全文件類型（圖片、音訊、影片、PDF 和 Office 文件）。純文字和疑似機密的檔案仍會被封鎖。

    請參閱[圖片](/zh-TW/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全性與存取控制

<AccordionGroup>
  <Accordion title="將 OpenClaw 暴露給傳入 DM 安全嗎？">
    請將傳入 DM 視為不受信任的輸入。預設值設計用來降低風險：

    - 支援 DM 的頻道預設行為是 **配對**：
      - 未知傳送者會收到配對碼；bot 不會處理他們的訊息。
      - 使用以下指令核准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待處理要求上限為 **每個頻道 3 個**；如果未收到代碼，請檢查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公開開放 DM 需要明確選擇加入（`dmPolicy: "open"` 和允許清單 `"*"`）。

    執行 `openclaw doctor` 以顯示有風險的 DM 政策。

  </Accordion>

  <Accordion title="提示注入只是公開 bot 才需要擔心的問題嗎？">
    不是。提示注入關乎 **不受信任的內容**，不只是誰可以私訊 bot。
    如果你的助理讀取外部內容（網路搜尋/擷取、瀏覽器頁面、電子郵件、
    文件、附件、貼上的記錄），該內容可能包含試圖
    劫持模型的指令。即使 **你是唯一的傳送者**，這也可能發生。

    最大的風險是在啟用工具時：模型可能被誘導去
    外洩內容，或代表你呼叫工具。請透過以下方式降低影響範圍：

    - 使用唯讀或停用工具的「reader」代理來摘要不受信任的內容
    - 對啟用工具的代理關閉 `web_search` / `web_fetch` / `browser`
    - 也將解碼後的檔案/文件文字視為不受信任：OpenResponses
      `input_file` 和媒體附件擷取都會將擷取出的文字包在
      明確的外部內容邊界標記中，而不是傳遞原始檔案文字
    - 使用沙箱和嚴格的工具允許清單

    詳細資訊：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我的 bot 應該有自己的電子郵件、GitHub 帳號或電話號碼嗎？">
    對大多數設定而言，是的。用獨立帳號和電話號碼隔離 bot，
    可以在出問題時降低影響範圍。這也讓輪替
    憑證或撤銷存取更容易，且不會影響你的個人帳號。

    從小範圍開始。只授予你實際需要的工具和帳號存取權，
    之後如有需要再擴充。

    文件：[安全性](/zh-TW/gateway/security)、[配對](/zh-TW/channels/pairing)。

  </Accordion>

  <Accordion title="我可以讓它自主處理我的簡訊嗎？這樣安全嗎？">
    我們 **不** 建議讓它完全自主處理你的個人訊息。最安全的模式是：

    - 將 DM 保持在 **配對模式** 或嚴格的允許清單中。
    - 如果你希望它代表你傳訊息，請使用 **獨立號碼或帳號**。
    - 讓它起草，然後 **傳送前核准**。

    如果你想實驗，請在專用帳號上進行並保持隔離。請參閱
    [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我可以將較便宜的模型用於個人助理工作嗎？">
    可以，**前提是** 代理僅用於聊天，且輸入是可信任的。較小等級的模型
    更容易受到指令劫持影響，因此避免將它們用於啟用工具的代理，
    或讀取不受信任內容時。如果你必須使用較小模型，請鎖定
    工具並在沙箱內執行。請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中執行了 /start，但沒有收到配對碼">
    配對碼 **只會** 在未知傳送者傳訊息給 bot 且
    啟用 `dmPolicy: "pairing"` 時送出。`/start` 本身不會產生代碼。

    檢查待處理要求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即存取，請將你的傳送者 ID 加入允許清單，或為該帳號設定 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它會傳訊息給我的聯絡人嗎？配對如何運作？">
    不會。WhatsApp 預設 DM 政策是 **配對**。未知傳送者只會取得配對碼，他們的訊息 **不會被處理**。OpenClaw 只會回覆它收到的聊天，或你明確觸發的傳送。

    使用以下指令核准配對：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待處理要求：

    ```bash
    openclaw pairing list whatsapp
    ```

    精靈電話號碼提示：它用於設定你的 **允許清單/擁有者**，讓你自己的 DM 被允許。它不會用於自動傳送。如果你在個人 WhatsApp 號碼上執行，請使用該號碼並啟用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天指令、中止工作，以及「它停不下來」

<AccordionGroup>
  <Accordion title="我要如何停止內部系統訊息顯示在聊天中？">
    大多數內部或工具訊息只會在該工作階段啟用 **verbose**、**trace** 或 **reasoning** 時出現。

    在你看到它的聊天中修正：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，請檢查 Control UI 中的工作階段設定，並將 verbose
    設為 **inherit**。也請確認你沒有使用在設定中將 `verboseDefault`
    設為 `on` 的 bot 設定檔。

    文件：[思考與詳細輸出](/zh-TW/tools/thinking)、[安全性](/zh-TW/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="我要如何停止/取消正在執行的工作？">
    將以下任一內容 **作為獨立訊息** 傳送（沒有斜線）：

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    這些是中止觸發詞（不是斜線指令）。

    對於背景程序（來自 exec 工具），你可以要求代理執行：

    ```
    process action:kill sessionId:XXX
    ```

    斜線指令概覽：請參閱[斜線指令](/zh-TW/tools/slash-commands)。

    大多數指令必須作為以 `/` 開頭的 **獨立** 訊息傳送，但少數捷徑（例如 `/status`）也可對允許清單中的傳送者內嵌使用。

  </Accordion>

  <Accordion title='我要如何從 Telegram 傳送 Discord 訊息？（"Cross-context messaging denied"）'>
    OpenClaw 預設會封鎖 **跨提供者** 訊息。如果工具呼叫繫結到
    Telegram，除非你明確允許，否則它不會傳送到 Discord。

    為代理啟用跨提供者訊息：

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    編輯設定後重新啟動 gateway。

  </Accordion>

  <Accordion title='為什麼感覺 bot 會「忽略」快速連發的訊息？'>
    佇列模式控制新訊息如何與執行中的 run 互動。使用 `/queue` 變更模式：

    - `steer` - 將所有待處理的 steering 排入目前 run 中的下一個模型邊界
    - `queue` - 舊版一次一個 steering
    - `followup` - 一次執行一則訊息
    - `collect` - 批次處理訊息並回覆一次
    - `steer-backlog` - 現在 steer，然後處理 backlog
    - `interrupt` - 中止目前 run 並重新開始

    預設模式是 `steer`。你可以為後續模式加入像 `debounce:0.5s cap:25 drop:summarize` 這類選項。請參閱[命令佇列](/zh-TW/concepts/queue)和[引導佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='Anthropic 使用 API 金鑰時的預設模型是什麼？'>
    在 OpenClaw 中，憑證和模型選擇是分開的。設定 `ANTHROPIC_API_KEY`（或在驗證設定檔中儲存 Anthropic API 金鑰）會啟用驗證，但實際的預設模型取決於你在 `agents.defaults.model.primary` 中設定的內容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，表示 Gateway 在執行中代理程式預期的 `auth-profiles.json` 中找不到 Anthropic 憑證。
  </Accordion>
</AccordionGroup>

---

還是卡住了？請到 [Discord](https://discord.com/invite/clawd) 詢問，或開啟 [GitHub 討論](https://github.com/openclaw/openclaw/discussions)。

## 相關

- [首次執行常見問題](/zh-TW/help/faq-first-run) — 安裝、初始設定、驗證、訂閱、早期失敗
- [模型常見問題](/zh-TW/help/faq-models) — 模型選擇、容錯移轉、驗證設定檔
- [疑難排解](/zh-TW/help/troubleshooting) — 依症狀優先的分流處理
