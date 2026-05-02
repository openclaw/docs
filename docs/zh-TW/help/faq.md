---
read_when:
    - 回答常見的設定、安裝、入門導覽或執行階段支援問題
    - 在深入除錯前先分類處理使用者回報的問題
summary: 關於 OpenClaw 安裝設定、組態與使用的常見問題
title: 常見問題
x-i18n:
    generated_at: "2026-05-02T20:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f818d009a261e32df22c793ab9018ff20cc38f799428d0cfdd8979f8c6d94e13
    source_path: help/faq.md
    workflow: 16
---

快速解答與更深入的真實環境疑難排解（本機開發、VPS、多代理、OAuth/API 金鑰、模型容錯移轉）。如需執行階段診斷，請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。如需完整設定參考，請參閱[設定](/zh-TW/gateway/configuration)。

## 發生問題時的前 60 秒

1. **快速狀態（第一步檢查）**

   ```bash
   openclaw status
   ```

   快速本機摘要：作業系統 + 更新、gateway/服務可達性、代理/工作階段、供應商設定 + 執行階段問題（Gateway 可達時）。

2. **可貼上的報告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   唯讀診斷，包含記錄尾端（權杖已遮蔽）。

3. **Daemon + 連接埠狀態**

   ```bash
   openclaw gateway status
   ```

   顯示監督器執行階段與 RPC 可達性、探測目標 URL，以及服務可能使用的設定。

4. **深度探測**

   ```bash
   openclaw status --deep
   ```

   執行即時 Gateway 健康狀態探測，支援時也包含頻道探測
   （需要可達的 Gateway）。請參閱[健康狀態](/zh-TW/gateway/health)。

5. **追蹤最新記錄**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 無法使用，請改用：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   檔案記錄與服務記錄是分開的；請參閱[記錄](/zh-TW/logging)和[疑難排解](/zh-TW/gateway/troubleshooting)。

6. **執行診斷工具（修復）**

   ```bash
   openclaw doctor
   ```

   修復/遷移設定/狀態 + 執行健康狀態檢查。請參閱[診斷工具](/zh-TW/gateway/doctor)。

7. **Gateway 快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   向執行中的 Gateway 要求完整快照（僅限 WS）。請參閱[健康狀態](/zh-TW/gateway/health)。

## 快速開始與首次執行設定

首次執行問答 — 安裝、上線設定、驗證路由、訂閱、初始失敗 —
位於[首次執行常見問題](/zh-TW/help/faq-first-run)。

## OpenClaw 是什麼？

<AccordionGroup>
  <Accordion title="OpenClaw 是什麼？用一段話說明">
    OpenClaw 是一個在你自己的裝置上執行的個人 AI 助理。它會在你已經使用的訊息介面上回覆（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等內建頻道 Plugin），也能在支援的平台上提供語音 + 即時 Canvas。**Gateway** 是常駐控制平面；助理本身才是產品。
  </Accordion>

  <Accordion title="價值主張">
    OpenClaw 不只是「Claude 包裝器」。它是一個**本機優先的控制平面**，讓你能在**自己的硬體**上執行
    能力完整的助理，並能從你已經使用的聊天應用程式存取，具備
    有狀態工作階段、記憶與工具，而不必把工作流程的控制權交給託管式
    SaaS。

    重點：

    - **你的裝置，你的資料：**在任何你想要的地方執行 Gateway（Mac、Linux、VPS），並讓
      工作區 + 工作階段歷史記錄保留在本機。
    - **真正的頻道，而不是網頁沙盒：**WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等，
      加上支援平台上的行動語音與 Canvas。
    - **模型無關：**使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，並支援每個代理的路由
      與容錯移轉。
    - **僅本機選項：**執行本機模型，因此如果你願意，**所有資料都可以留在你的裝置上**。
    - **多代理路由：**依頻道、帳號或任務分開代理，每個代理都有自己的
      工作區與預設值。
    - **開源且可改造：**檢視、擴充與自行託管，不受供應商鎖定。

    文件：[Gateway](/zh-TW/gateway)、[頻道](/zh-TW/channels)、[多代理](/zh-TW/concepts/multi-agent)、
    [記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我剛設定完成，第一步該做什麼？">
    適合先做的專案：

    - 建立網站（WordPress、Shopify，或簡單的靜態網站）。
    - 製作行動 App 原型（大綱、畫面、API 計畫）。
    - 整理檔案與資料夾（清理、命名、標記）。
    - 連接 Gmail 並自動化摘要或後續追蹤。

    它可以處理大型任務，但把任務拆成多個階段，並
    使用子代理進行平行工作時效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常見的五個日常使用情境是什麼？">
    日常成效通常像這樣：

    - **個人簡報：**整理你在意的收件匣、行事曆與新聞摘要。
    - **研究與撰稿：**快速研究、摘要，以及電子郵件或文件的初稿。
    - **提醒與後續追蹤：**由 cron 或 heartbeat 驅動的提醒與檢查清單。
    - **瀏覽器自動化：**填寫表單、收集資料，以及重複執行網頁任務。
    - **跨裝置協調：**從手機送出任務，讓 Gateway 在伺服器上執行，並在聊天中拿回結果。

  </Accordion>

  <Accordion title="OpenClaw 能協助 SaaS 的潛在客戶開發、推廣、廣告和部落格嗎？">
    可以，用於**研究、資格篩選與撰稿**。它可以掃描網站、建立候選清單、
    摘要潛在客戶，並撰寫推廣或廣告文案草稿。

    對於**推廣或廣告投放**，請讓人工保留在流程中。避免垃圾訊息，遵守當地法律與
    平台政策，並在送出前審閱所有內容。最安全的模式是讓
    OpenClaw 草擬，然後由你核准。

    文件：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="相較於 Claude Code，用於網頁開發有哪些優勢？">
    OpenClaw 是**個人助理**與協調層，不是 IDE 替代品。若要在 repo 內獲得最快的直接寫程式循環，請使用
    Claude Code 或 Codex。當你需要
    持久記憶、跨裝置存取與工具編排時，請使用 OpenClaw。

    優勢：

    - 跨工作階段的**持久記憶 + 工作區**
    - **多平台存取**（WhatsApp、Telegram、TUI、WebChat）
    - **工具編排**（瀏覽器、檔案、排程、hook）
    - **常駐 Gateway**（在 VPS 上執行，從任何地方互動）
    - **Node** 用於本機瀏覽器/螢幕/攝影機/exec

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 與自動化

<AccordionGroup>
  <Accordion title="如何自訂 Skills 而不讓 repo 變髒？">
    使用受管理的覆寫，而不是編輯 repo 複本。把變更放在 `~/.openclaw/skills/<name>/SKILL.md`（或透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增資料夾）。優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 內建 → `skills.load.extraDirs`，因此受管理的覆寫仍會優先於內建 Skills，且不會碰到 git。若你需要全域安裝該 Skill，但只讓部分代理可見，請將共享複本保留在 `~/.openclaw/skills`，並用 `agents.defaults.skills` 與 `agents.list[].skills` 控制可見性。只有值得上游合併的編輯才應該放在 repo 中並以 PR 發出。
  </Accordion>

  <Accordion title="我可以從自訂資料夾載入 Skills 嗎？">
    可以。透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增額外目錄（最低優先順序）。預設優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 內建 → `skills.load.extraDirs`。`clawhub` 預設會安裝到 `./skills`，OpenClaw 會在下一個工作階段將其視為 `<workspace>/skills`。如果該 Skill 只應對特定代理可見，請搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何針對不同任務使用不同模型？">
    目前支援的模式是：

    - **Cron 工作：**隔離工作可以為每個工作設定 `model` 覆寫。
    - **子代理：**將任務路由到具有不同預設模型的獨立代理。
    - **隨選切換：**隨時使用 `/model` 切換目前工作階段模型。

    請參閱 [Cron 工作](/zh-TW/automation/cron-jobs)、[多代理路由](/zh-TW/concepts/multi-agent)與[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="Bot 在做繁重工作時凍結。我要如何卸載工作？">
    對長時間或平行任務使用**子代理**。子代理會在自己的工作階段中執行、
    回傳摘要，並讓你的主聊天保持回應。

    請要求你的 bot「為這個任務產生一個子代理」，或使用 `/subagents`。
    在聊天中使用 `/status` 查看 Gateway 目前正在做什麼（以及是否忙碌）。

    權杖提示：長任務和子代理都會消耗權杖。如果在意成本，請透過
    `agents.defaults.subagents.model` 為子代理設定較便宜的模型。

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上繫結執行緒的子代理工作階段如何運作？">
    使用執行緒繫結。你可以將 Discord 執行緒繫結到子代理或工作階段目標，讓該執行緒中的後續訊息停留在該繫結工作階段。

    基本流程：

    - 使用 `sessions_spawn` 並設定 `thread: true` 產生（並可選用 `mode: "session"` 以保留持久後續追蹤）。
    - 或使用 `/focus <target>` 手動繫結。
    - 使用 `/agents` 檢查繫結狀態。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自動取消聚焦。
    - 使用 `/unfocus` 分離該執行緒。

    必要設定：

    - 全域預設值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆寫：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 產生時自動繫結：`channels.discord.threadBindings.spawnSessions` 預設為 `true`；將其設為 `false` 可停用繫結執行緒的工作階段產生。

    文件：[子代理](/zh-TW/tools/subagents)、[Discord](/zh-TW/channels/discord)、[設定參考](/zh-TW/gateway/configuration-reference)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="子代理已完成，但完成更新傳到錯誤位置或從未發布。我該檢查什麼？">
    請先檢查解析後的請求者路由：

    - 完成模式子代理交付會優先使用任何現有的繫結執行緒或對話路由。
    - 如果完成來源只帶有頻道，OpenClaw 會退回使用請求者工作階段儲存的路由（`lastChannel` / `lastTo` / `lastAccountId`），因此直接交付仍可成功。
    - 如果既沒有繫結路由，也沒有可用的已儲存路由，直接交付可能失敗，結果會退回為佇列工作階段交付，而不是立即發布到聊天。
    - 無效或過期的目標仍可能強制退回佇列，或導致最終交付失敗。
    - 如果子工作階段最後可見的助理回覆是精確的靜默權杖 `NO_REPLY` / `no_reply`，或剛好是 `ANNOUNCE_SKIP`，OpenClaw 會刻意抑制公告，而不是發布較早的過期進度。
    - 如果子工作階段在只有工具呼叫後逾時，公告可以將其折疊成簡短的部分進度摘要，而不是重播原始工具輸出。

    偵錯：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)、[工作階段工具](/zh-TW/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒未觸發。我該檢查什麼？">
    Cron 在 Gateway 程序內執行。如果 Gateway 沒有持續執行，
    已排程工作就不會執行。

    檢查清單：

    - 確認 cron 已啟用（`cron.enabled`），且未設定 `OPENCLAW_SKIP_CRON`。
    - 檢查 Gateway 是否全天候執行（沒有睡眠/重新啟動）。
    - 驗證該工作的時區設定（`--tz` 與主機時區）。

    偵錯：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[Cron 工作](/zh-TW/automation/cron-jobs)、[自動化與任務](/zh-TW/automation)。

  </Accordion>

  <Accordion title="Cron 已觸發，但沒有任何內容傳送到頻道。為什麼？">
    先檢查傳送模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不會預期 runner fallback 傳送。
    - 缺少或無效的公告目標 (`channel` / `to`) 表示 runner 已略過對外傳送。
    - 頻道驗證失敗 (`unauthorized`, `Forbidden`) 表示 runner 曾嘗試傳送，但憑證阻擋了它。
    - 靜默的隔離結果（只有 `NO_REPLY` / `no_reply`）會被視為刻意不可傳送，因此 runner 也會抑制佇列中的 fallback 傳送。

    對於隔離的 cron 作業，當有可用的聊天路由時，agent 仍可使用 `message`
    工具直接傳送。`--announce` 只控制 runner
    fallback 路徑，用於 agent 尚未自行傳送的最終文字。

    偵錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[Cron jobs](/zh-TW/automation/cron-jobs)、[Background Tasks](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="為什麼隔離的 cron 執行會切換模型或重試一次？">
    這通常是即時模型切換路徑，而不是重複排程。

    隔離的 cron 可以在作用中的執行拋出 `LiveSessionModelSwitchError` 時，保留執行階段模型交接並重試。重試會保留已切換的
    provider/model；如果該切換帶有新的驗證設定檔覆寫，cron
    也會在重試前保存它。

    相關選擇規則：

    - 適用時，Gmail hook 模型覆寫會優先。
    - 接著是每個作業的 `model`。
    - 接著是任何已儲存的 cron-session 模型覆寫。
    - 接著是一般 agent/default 模型選擇。

    重試迴圈有界限。初次嘗試加上 2 次切換重試後，
    cron 會中止，而不是永久循環。

    偵錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[Cron jobs](/zh-TW/automation/cron-jobs)、[cron CLI](/zh-TW/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 Skills？">
    使用原生 `openclaw skills` 指令，或將 skills 放入你的工作區。macOS Skills UI 在 Linux 上不可用。
    在 [https://clawhub.ai](https://clawhub.ai) 瀏覽 skills。

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
    目錄。只有在你想發布或同步自己的 skills 時，才需要安裝獨立的 `clawhub` CLI。若要讓 agents 共享安裝，請將 skill 放在
    `~/.openclaw/skills` 下，並在你想縮小哪些 agents 可看到它時使用
    `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 能否排程執行任務，或在背景持續執行任務？">
    可以。使用 Gateway 排程器：

    - **Cron jobs** 用於排程或重複任務（會跨重新啟動持續存在）。
    - **Heartbeat** 用於「主工作階段」定期檢查。
    - **隔離作業** 用於會張貼摘要或傳送到聊天的自主 agents。

    文件：[Cron jobs](/zh-TW/automation/cron-jobs)、[Automation & Tasks](/zh-TW/automation)、
    [Heartbeat](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以從 Linux 執行 Apple macOS 專用 skills 嗎？">
    不能直接執行。macOS skills 會受到 `metadata.openclaw.os` 加上必要二進位檔的限制，而且 skills 只有在 **Gateway host** 上符合資格時，才會出現在系統提示中。在 Linux 上，除非你覆寫該限制，否則 `darwin` 專用 skills（例如 `apple-notes`、`apple-reminders`、`things-mac`）不會載入。

    你有三種受支援的模式：

    **選項 A - 在 Mac 上執行 Gateway（最簡單）。**
    在 macOS 二進位檔所在的位置執行 Gateway，然後從 Linux 以[遠端模式](#gateway-ports-already-running-and-remote-mode)或透過 Tailscale 連線。因為 Gateway host 是 macOS，skills 會正常載入。

    **選項 B - 使用 macOS node（不需要 SSH）。**
    在 Linux 上執行 Gateway，配對 macOS node（選單列 app），並在 Mac 上將 **Node Run Commands** 設為「Always Ask」或「Always Allow」。當 node 上存在必要二進位檔時，OpenClaw 可以將 macOS 專用 skills 視為符合資格。agent 會透過 `nodes` 工具執行這些 skills。如果你選擇「Always Ask」，在提示中核准「Always Allow」會將該指令加入允許清單。

    **選項 C - 透過 SSH 代理 macOS 二進位檔（進階）。**
    將 Gateway 保留在 Linux 上，但讓必要的 CLI 二進位檔解析到會在 Mac 上執行的 SSH wrapper。接著覆寫 skill 以允許 Linux，讓它保持符合資格。

    1. 為二進位檔建立 SSH wrapper（範例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 在 Linux host 上將 wrapper 放到 `PATH`（例如 `~/bin/memo`）。
    3. 覆寫 skill metadata（工作區或 `~/.openclaw/skills`）以允許 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 啟動新的工作階段，讓 skills 快照重新整理。

  </Accordion>

  <Accordion title="你們有 Notion 或 HeyGen 整合嗎？">
    目前沒有內建。

    選項：

    - **自訂 skill / plugin：** 最適合可靠的 API 存取（Notion/HeyGen 都有 API）。
    - **瀏覽器自動化：** 不需要程式碼即可運作，但較慢且更脆弱。

    如果你想按客戶保留上下文（代理商工作流程），一個簡單模式是：

    - 每位客戶一個 Notion 頁面（上下文 + 偏好設定 + 進行中的工作）。
    - 要求 agent 在工作階段開始時擷取該頁面。

    如果你想要原生整合，請開啟功能請求，或建立一個
    以這些 API 為目標的 skill。

    安裝 skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安裝會落在作用中工作區的 `skills/` 目錄。若要讓 agents 共享 skills，請將它們放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只有部分 agents 應看到共享安裝，請設定 `agents.defaults.skills` 或 `agents.list[].skills`。某些 skills 預期透過 Homebrew 安裝二進位檔；在 Linux 上，這表示 Linuxbrew（請參閱上方的 Homebrew Linux FAQ 條目）。請參閱 [Skills](/zh-TW/tools/skills)、[Skills config](/zh-TW/tools/skills-config) 和 [ClawHub](/zh-TW/tools/clawhub)。

  </Accordion>

  <Accordion title="如何搭配 OpenClaw 使用我既有已登入的 Chrome？">
    使用內建的 `user` 瀏覽器設定檔，它會透過 Chrome DevTools MCP 附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想使用自訂名稱，請建立明確的 MCP 設定檔：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    這條路徑可以使用 local host 瀏覽器或已連線的瀏覽器 node。如果 Gateway 在其他地方執行，請在瀏覽器機器上執行 node host，或改用遠端 CDP。

    `existing-session` / `user` 目前的限制：

    - actions 是 ref 驅動，而不是 CSS selector 驅動
    - 上傳需要 `ref` / `inputRef`，且目前一次支援一個檔案
    - `responsebody`、PDF 匯出、下載攔截和批次 actions 仍需要受管理的瀏覽器或原始 CDP 設定檔

  </Accordion>
</AccordionGroup>

## 沙箱和記憶體

<AccordionGroup>
  <Accordion title="有專門的沙箱文件嗎？">
    有。請參閱 [Sandboxing](/zh-TW/gateway/sandboxing)。關於 Docker 專用設定（Docker 中的完整 gateway 或沙箱映像檔），請參閱 [Docker](/zh-TW/install/docker)。
  </Accordion>

  <Accordion title="Docker 感覺受限 - 如何啟用完整功能？">
    預設映像檔以安全性為優先，並以 `node` 使用者執行，因此不
    包含系統套件、Homebrew 或 bundled browsers。若要更完整的設定：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，讓快取保留下來。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 將系統相依項目烘焙進映像檔。
    - 透過 bundled CLI 安裝 Playwright 瀏覽器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 設定 `PLAYWRIGHT_BROWSERS_PATH`，並確保該路徑已持久化。

    文件：[Docker](/zh-TW/install/docker)、[Browser](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="我可以讓 DM 保持個人用途，但用一個 agent 讓群組公開/沙箱化嗎？">
    可以，只要你的私人流量是 **DMs**，公開流量是 **群組**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，讓群組/頻道工作階段（非 main keys）在設定的沙箱後端中執行，而主 DM 工作階段留在 host 上。如果你未選擇後端，Docker 是預設後端。接著透過 `tools.sandbox.tools` 限制沙箱化工作階段中可用的工具。

    設定逐步說明 + 範例設定：[Groups: personal DMs + public groups](/zh-TW/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定參考：[Gateway configuration](/zh-TW/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何將 host 資料夾綁定到沙箱？">
    將 `agents.defaults.sandbox.docker.binds` 設為 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全域和每個 agent 的 binds 會合併；當 `scope: "shared"` 時，會忽略每個 agent 的 binds。對任何敏感內容使用 `:ro`，並記住 binds 會繞過沙箱檔案系統牆。

    OpenClaw 會同時根據正規化路徑，以及透過最深層既有祖先解析出的 canonical path，驗證 bind 來源。這表示即使最後一段路徑尚不存在，符號連結父層逸出仍會封閉失敗，而且允許根目錄檢查仍會在符號連結解析後套用。

    請參閱 [Sandboxing](/zh-TW/gateway/sandboxing#custom-bind-mounts) 和 [Sandbox vs Tool Policy vs Elevated](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) 取得範例和安全注意事項。

  </Accordion>

  <Accordion title="記憶體如何運作？">
    OpenClaw 記憶體只是 agent 工作區中的 Markdown 檔案：

    - `memory/YYYY-MM-DD.md` 中的每日筆記
    - `MEMORY.md` 中經整理的長期筆記（僅限 main/private sessions）

    OpenClaw 也會執行 **靜默的 pre-compaction 記憶體 flush**，提醒模型
    在 auto-compaction 前寫入持久筆記。這只會在工作區
    可寫入時執行（唯讀沙箱會略過）。請參閱 [Memory](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="記憶體一直忘記事情。如何讓它記住？">
    要求 bot **將事實寫入 memory**。長期筆記屬於 `MEMORY.md`，
    短期上下文放在 `memory/YYYY-MM-DD.md`。

    這仍是我們正在改進的領域。提醒模型儲存記憶會有幫助；
    它會知道該怎麼做。如果它一直忘記，請確認 Gateway 在每次執行時都使用相同的
    工作區。

    文件：[Memory](/zh-TW/concepts/memory)、[Agent workspace](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="記憶體會永久保留嗎？限制是什麼？">
    記憶體檔案位於磁碟上，會一直保留直到你刪除它們。限制是你的
    儲存空間，而不是模型。**session context** 仍受模型
    上下文視窗限制，因此長對話可能會 compact 或 truncate。這就是
    memory search 存在的原因：它只會將相關部分拉回上下文。

    文件：[Memory](/zh-TW/concepts/memory)、[Context](/zh-TW/concepts/context)。

  </Accordion>

  <Accordion title="語意記憶搜尋需要 OpenAI API 金鑰嗎？">
    只有在你使用 **OpenAI embeddings** 時才需要。Codex OAuth 涵蓋聊天/補全，且
    **不會**授予 embeddings 存取權，因此**使用 Codex 登入（OAuth 或
    Codex CLI 登入）**對語意記憶搜尋沒有幫助。OpenAI embeddings
    仍然需要真正的 API 金鑰（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你沒有明確設定提供者，OpenClaw 會在能解析 API 金鑰時自動選取提供者
    （驗證設定檔、`models.providers.*.apiKey` 或環境變數）。
    如果能解析 OpenAI 金鑰，它會優先使用 OpenAI；否則如果能解析 Gemini 金鑰，
    則使用 Gemini，接著是 Voyage，然後是 Mistral。如果沒有可用的遠端金鑰，記憶
    搜尋會保持停用，直到你完成設定。如果你已設定且存在本機模型路徑，
    OpenClaw
    會優先使用 `local`。當你明確設定
    `memorySearch.provider = "ollama"` 時，支援 Ollama。

    如果你偏好維持本機運作，請設定 `memorySearch.provider = "local"`（並可選擇性設定
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，請設定
    `memorySearch.provider = "gemini"` 並提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我們支援 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embedding
    模型 - 設定細節請參閱 [記憶](/zh-TW/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 內容在磁碟上的位置

<AccordionGroup>
  <Accordion title="所有與 OpenClaw 搭配使用的資料都會儲存在本機嗎？">
    不會 - **OpenClaw 的狀態是本機的**，但**外部服務仍然會看到你傳送給它們的內容**。

    - **預設為本機：** 工作階段、記憶檔案、設定與工作區都位於 Gateway 主機上
      （`~/.openclaw` + 你的工作區目錄）。
    - **必要時為遠端：** 你傳送給模型提供者（Anthropic/OpenAI/等）的訊息會送往
      它們的 API，而聊天平台（WhatsApp/Telegram/Slack/等）會將訊息資料儲存在它們的
      伺服器上。
    - **你控制足跡：** 使用本機模型會讓提示留在你的機器上，但頻道
      流量仍會經過該頻道的伺服器。

    相關：[代理程式工作區](/zh-TW/concepts/agent-workspace)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 將資料儲存在哪裡？">
    所有內容都位於 `$OPENCLAW_STATE_DIR` 底下（預設：`~/.openclaw`）：

    | 路徑                                                            | 用途                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主要設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 舊版 OAuth 匯入（首次使用時複製到驗證設定檔）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 驗證設定檔（OAuth、API 金鑰，以及選用的 `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供者的選用檔案支援秘密承載內容 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 舊版相容性檔案（靜態 `api_key` 項目已清除）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供者狀態（例如 `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每個代理程式的狀態（agentDir + 工作階段）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 對話記錄與狀態（每個代理程式）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 工作階段中繼資料（每個代理程式）                                       |

    舊版單一代理程式路徑：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）。

    你的**工作區**（AGENTS.md、記憶檔案、skills 等）是分開的，並透過 `agents.defaults.workspace` 設定（預設：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 應該放在哪裡？">
    這些檔案位於**代理程式工作區**，不是 `~/.openclaw`。

    - **工作區（每個代理程式）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、選用的 `HEARTBEAT.md`。
      小寫根目錄 `memory.md` 只是舊版修復輸入；當兩個檔案都存在時，`openclaw doctor --fix`
      可以將它合併到 `MEMORY.md`。
    - **狀態目錄（`~/.openclaw`）**：設定、頻道/提供者狀態、驗證設定檔、工作階段、記錄，
      以及共用 skills（`~/.openclaw/skills`）。

    預設工作區是 `~/.openclaw/workspace`，可透過以下方式設定：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果機器人在重新啟動後「忘記」了，請確認每次啟動時 Gateway 都使用相同的
    工作區（並記住：遠端模式使用的是 **gateway 主機的**
    工作區，而不是你的本機筆電）。

    提示：如果你想要持久的行為或偏好，請要求機器人**將它寫入
    AGENTS.md 或 MEMORY.md**，而不是依賴聊天記錄。

    請參閱 [代理程式工作區](/zh-TW/concepts/agent-workspace) 和 [記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="建議的備份策略">
    將你的**代理程式工作區**放在**私人** git 儲存庫中，並備份到某個
    私人位置（例如 GitHub private）。這會保存記憶 + AGENTS/SOUL/USER
    檔案，讓你稍後能還原助理的「心智」。

    **不要**提交 `~/.openclaw` 底下的任何內容（憑證、工作階段、權杖或加密秘密承載內容）。
    如果你需要完整還原，請分別備份工作區與狀態目錄
    （請參閱上方的遷移問題）。

    文件：[代理程式工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全解除安裝 OpenClaw？">
    請參閱專門指南：[解除安裝](/zh-TW/install/uninstall)。
  </Accordion>

  <Accordion title="代理程式可以在工作區外運作嗎？">
    可以。工作區是**預設 cwd** 和記憶錨點，不是硬性沙箱。
    相對路徑會在工作區內解析，但除非啟用沙箱，否則絕對路徑可以存取其他
    主機位置。如果你需要隔離，請使用
    [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing) 或每個代理程式的沙箱設定。如果你
    想讓某個 repo 成為預設工作目錄，請將該代理程式的
    `workspace` 指向 repo 根目錄。OpenClaw repo 只是原始碼；除非你刻意希望代理程式在其中工作，
    否則請將
    工作區分開。

    範例（以 repo 作為預設 cwd）：

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

  <Accordion title="遠端模式：工作階段儲存區在哪裡？">
    工作階段狀態由 **gateway 主機**擁有。如果你處於遠端模式，你關心的工作階段儲存區位於遠端機器上，而不是你的本機筆電。請參閱 [工作階段管理](/zh-TW/concepts/session)。
  </Accordion>
</AccordionGroup>

## 設定基礎

<AccordionGroup>
  <Accordion title="設定是什麼格式？它在哪裡？">
    OpenClaw 會從 `$OPENCLAW_CONFIG_PATH` 讀取選用的 **JSON5** 設定（預設：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果檔案不存在，它會使用相對安全的預設值（包含 `~/.openclaw/workspace` 的預設工作區）。

  </Accordion>

  <Accordion title='我設定了 gateway.bind: "lan"（或 "tailnet"），現在沒有任何項目在監聽 / UI 顯示未授權'>
    非 loopback 繫結**需要有效的 gateway 驗證路徑**。實務上這表示：

    - 共用秘密驗證：權杖或密碼
    - `gateway.auth.mode: "trusted-proxy"` 位於正確設定的身分感知反向代理後方

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

    注意：

    - `gateway.remote.token` / `.password` **不會**自行啟用本機 gateway 驗證。
    - 只有在 `gateway.auth.*` 未設定時，本機呼叫路徑才能使用 `gateway.remote.*` 作為備援。
    - 對於密碼驗證，請改為設定 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定且無法解析，解析會安全失敗（不會以遠端備援遮蔽）。
    - 共用秘密 Control UI 設定會透過 `connect.params.auth.token` 或 `connect.params.auth.password`（儲存在應用程式/UI 設定中）進行驗證。具有身分的模式，例如 Tailscale Serve 或 `trusted-proxy`，則使用請求標頭。避免將共用秘密放在 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 時，同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並在 `gateway.trustedProxies` 中加入 loopback 項目。

  </Accordion>

  <Accordion title="為什麼現在 localhost 也需要權杖？">
    OpenClaw 預設會強制執行 gateway 驗證，包括 loopback。在一般預設路徑中，這表示權杖驗證：如果沒有設定明確的驗證路徑，gateway 啟動會解析為權杖模式並自動產生權杖，將其儲存到 `gateway.auth.token`，因此**本機 WS 用戶端必須驗證**。這會阻止其他本機程序呼叫 Gateway。

    如果你偏好不同的驗證路徑，可以明確選擇密碼模式（或針對身分感知反向代理使用 `trusted-proxy`）。如果你**真的**想開放 loopback，請在設定中明確設定 `gateway.auth.mode: "none"`。Doctor 可隨時為你產生權杖：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="變更設定後必須重新啟動嗎？">
    Gateway 會監看設定並支援熱重新載入：

    - `gateway.reload.mode: "hybrid"`（預設）：熱套用安全變更，關鍵變更則重新啟動
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

    - `off`：隱藏標語文字，但保留橫幅標題/版本行。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：輪替的有趣/季節性標語（預設行為）。
    - 如果你完全不想要橫幅，請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何啟用網頁搜尋（以及網頁擷取）？">
    `web_fetch` 不需要 API 金鑰即可運作。`web_search` 取決於你選取的
    提供者：

    - 由 API 支援的提供者，例如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily，需要它們一般的 API 金鑰設定。
    - Ollama Web Search 不需要金鑰，但它會使用你設定的 Ollama 主機，且需要 `ollama signin`。
    - DuckDuckGo 不需要金鑰，但它是非官方的 HTML 型整合。
    - SearXNG 不需要金鑰/可自行託管；設定 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **建議：** 執行 `openclaw configure --section web` 並選擇提供者。
    環境替代方案：

    - Brave：`BRAVE_API_KEY`
    - Exa：`EXA_API_KEY`
    - Firecrawl：`FIRECRAWL_API_KEY`
    - Gemini：`GEMINI_API_KEY`
    - Grok：`XAI_API_KEY`
    - Kimi：`KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
    - MiniMax Search：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`
    - Perplexity：`PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
    - SearXNG：`SEARXNG_BASE_URL`
    - Tavily：`TAVILY_API_KEY`

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

    供應商特定的網頁搜尋設定現在位於 `plugins.entries.<plugin>.config.webSearch.*` 下。
    舊版 `tools.web.search.*` 供應商路徑仍會暫時載入以維持相容性，但不應用於新的設定。
    Firecrawl 網頁擷取備援設定位於 `plugins.entries.firecrawl.config.webFetch.*` 下。

    注意事項：

    - 如果使用允許清單，請加入 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 預設啟用（除非明確停用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 會從可用憑證中自動偵測第一個就緒的擷取備援供應商。目前內建供應商是 Firecrawl。
    - Daemon 會從 `~/.openclaw/.env`（或服務環境）讀取環境變數。

    文件：[Web 工具](/zh-TW/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清除了我的設定。我該如何復原並避免這種情況？">
    `config.apply` 會取代**整個設定**。如果你傳送部分物件，其他所有內容
    都會被移除。

    目前的 OpenClaw 會防護許多意外覆寫：

    - OpenClaw 擁有的設定寫入會在寫入前驗證完整的變更後設定。
    - 無效或具破壞性的 OpenClaw 擁有寫入會被拒絕，並儲存為 `openclaw.json.rejected.*`。
    - 如果直接編輯導致啟動或熱重新載入失敗，Gateway 會還原上一個已知良好的設定，並將被拒絕的檔案儲存為 `openclaw.json.clobbered.*`。
    - 復原後，主要 agent 會收到開機警告，因此不會盲目再次寫入錯誤設定。

    復原：

    - 查看 `openclaw logs --follow` 中是否有 `Config auto-restored from last-known-good`、`Config write rejected:` 或 `config reload restored last-known-good config`。
    - 檢查有效設定旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 如果有效的已還原設定可正常運作，請保留它，然後只用 `openclaw config set` 或 `config.patch` 將預期的鍵複製回去。
    - 執行 `openclaw config validate` 和 `openclaw doctor`。
    - 如果你沒有上一個已知良好設定或被拒絕的內容，請從備份還原，或重新執行 `openclaw doctor` 並重新設定頻道/模型。
    - 如果這並非預期行為，請回報 bug，並附上你最後已知的設定或任何備份。
    - 本機 coding agent 通常可以從記錄或歷史中重建可運作的設定。

    避免方式：

    - 小幅變更請使用 `openclaw config set`。
    - 互動式編輯請使用 `openclaw configure`。
    - 當你不確定確切路徑或欄位形狀時，請先使用 `config.schema.lookup`；它會回傳淺層 schema 節點，以及可供深入查看的直接子項摘要。
    - 部分 RPC 編輯請使用 `config.patch`；`config.apply` 只保留給完整設定取代。
    - 如果你在 agent 執行中使用僅限擁有者的 `gateway` 工具，它仍會拒絕寫入 `tools.exec.ask` / `tools.exec.security`（包含會正規化到相同受保護執行路徑的舊版 `tools.bash.*` 別名）。

    文件：[設定](/zh-TW/cli/config)、[設定精靈](/zh-TW/cli/configure)、[Gateway 疑難排解](/zh-TW/gateway/troubleshooting#gateway-restored-last-known-good-config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="如何跨裝置執行中央 Gateway 與專門化工作器？">
    常見模式是**一個 Gateway**（例如 Raspberry Pi）加上**節點**和 **agent**：

    - **Gateway（中央）：**擁有頻道（Signal/WhatsApp）、路由和工作階段。
    - **節點（裝置）：**Mac/iOS/Android 會作為周邊裝置連線，並公開本機工具（`system.run`、`canvas`、`camera`）。
    - **Agent（工作器）：**用於特殊角色的獨立大腦/工作區（例如「Hetzner 維運」、「個人資料」）。
    - **Sub-agent：**當你需要平行處理時，從主要 agent 產生背景工作。
    - **TUI：**連線到 Gateway，並切換 agent/工作階段。

    文件：[節點](/zh-TW/nodes)、[遠端存取](/zh-TW/gateway/remote)、[多 Agent 路由](/zh-TW/concepts/multi-agent)、[Sub-agent](/zh-TW/tools/subagents)、[TUI](/zh-TW/web/tui)。

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

    預設值為 `false`（有介面）。在某些網站上，Headless 較可能觸發反機器人檢查。請參閱[瀏覽器](/zh-TW/tools/browser)。

    Headless 使用**相同的 Chromium 引擎**，並適用於大多數自動化（表單、點擊、擷取、登入）。主要差異如下：

    - 沒有可見的瀏覽器視窗（如果需要視覺內容，請使用螢幕截圖）。
    - 某些網站在 headless 模式中對自動化更嚴格（CAPTCHA、反機器人）。
      例如，X/Twitter 經常封鎖 headless 工作階段。

  </Accordion>

  <Accordion title="如何使用 Brave 進行瀏覽器控制？">
    將 `browser.executablePath` 設為你的 Brave 二進位檔（或任何基於 Chromium 的瀏覽器），然後重新啟動 Gateway。
    請參閱[瀏覽器](/zh-TW/tools/browser#use-brave-or-another-chromium-based-browser)中的完整設定範例。
  </Accordion>
</AccordionGroup>

## 遠端 Gateway 與節點

<AccordionGroup>
  <Accordion title="指令如何在 Telegram、gateway 和節點之間傳遞？">
    Telegram 訊息由 **gateway** 處理。gateway 會執行 agent，並且
    只有在需要節點工具時，才會透過 **Gateway WebSocket** 呼叫節點：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    節點看不到傳入的供應商流量；它們只會接收節點 RPC 呼叫。

  </Accordion>

  <Accordion title="如果 Gateway 託管在遠端，我的 agent 如何存取我的電腦？">
    簡短答案：**將你的電腦配對為節點**。Gateway 在其他地方執行，但可以
    透過 Gateway WebSocket 在你的本機機器上呼叫 `node.*` 工具（螢幕、相機、系統）。

    典型設定：

    1. 在常開主機（VPS/家用伺服器）上執行 Gateway。
    2. 將 Gateway 主機和你的電腦放在同一個 tailnet。
    3. 確保 Gateway WS 可連線（tailnet 綁定或 SSH tunnel）。
    4. 在本機開啟 macOS app，並以 **Remote over SSH** 模式（或直接 tailnet）連線，
       讓它可以註冊為節點。
    5. 在 Gateway 上核准節點：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要另外的 TCP 橋接；節點會透過 Gateway WebSocket 連線。

    安全提醒：配對 macOS 節點會允許在該機器上執行 `system.run`。只
    配對你信任的裝置，並檢閱[安全性](/zh-TW/gateway/security)。

    文件：[節點](/zh-TW/nodes)、[Gateway 通訊協定](/zh-TW/gateway/protocol)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已連線，但我沒有收到回覆。現在該怎麼辦？">
    檢查基本項目：

    - Gateway 正在執行：`openclaw gateway status`
    - Gateway 健康狀態：`openclaw status`
    - 頻道健康狀態：`openclaw channels status`

    接著驗證驗證與路由：

    - 如果你使用 Tailscale Serve，請確認 `gateway.auth.allowTailscale` 設定正確。
    - 如果你透過 SSH tunnel 連線，請確認本機通道已啟動，且指向正確的連接埠。
    - 確認你的允許清單（DM 或群組）包含你的帳號。

    文件：[Tailscale](/zh-TW/gateway/tailscale)、[遠端存取](/zh-TW/gateway/remote)、[頻道](/zh-TW/channels)。

  </Accordion>

  <Accordion title="兩個 OpenClaw 執行個體可以互相通訊嗎（本機 + VPS）？">
    可以。沒有內建的「bot 對 bot」橋接，但你可以用幾種
    可靠方式串接：

    **最簡單：**使用兩個 bot 都能存取的一般聊天頻道（Telegram/Slack/WhatsApp）。
    讓 Bot A 傳送訊息給 Bot B，然後讓 Bot B 照常回覆。

    **CLI 橋接（通用）：**執行腳本，使用 `openclaw agent --message ... --deliver`
    呼叫另一個 Gateway，目標是一個另一個 bot 會監聽的聊天。如果其中一個 bot 位於遠端 VPS，請將你的 CLI
    透過 SSH/Tailscale 指向該遠端 Gateway（請參閱[遠端存取](/zh-TW/gateway/remote)）。

    範例模式（從可連到目標 Gateway 的機器執行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加入防護規則，避免兩個 bot 無限循環（僅提及、頻道
    允許清單，或「不要回覆 bot 訊息」規則）。

    文件：[遠端存取](/zh-TW/gateway/remote)、[Agent CLI](/zh-TW/cli/agent)、[Agent 傳送](/zh-TW/tools/agent-send)。

  </Accordion>

  <Accordion title="多個 agent 需要獨立的 VPS 嗎？">
    不需要。一個 Gateway 可以託管多個 agent，每個都有自己的工作區、模型預設值
    和路由。這是一般設定，而且比每個 agent 執行一台 VPS
    便宜且簡單得多。

    只有在你需要硬隔離（安全邊界）或非常
    不同且不想共用的設定時，才使用獨立 VPS。否則，保留一個 Gateway，
    並使用多個 agent 或 sub-agent。

  </Accordion>

  <Accordion title="相較於從 VPS 使用 SSH，在我的個人筆電上使用節點有好處嗎？">
    有，節點是從遠端 Gateway 存取你筆電的一級方式，而且它們
    解鎖的不只是 shell 存取。Gateway 可在 macOS/Linux（Windows 透過 WSL2）上執行，且
    很輕量（小型 VPS 或 Raspberry Pi 等級的機器即可；4 GB RAM 很充足），因此常見
    設定是常開主機加上你的筆電作為節點。

    - **不需要傳入 SSH。**節點會向外連線到 Gateway WebSocket，並使用裝置配對。
    - **更安全的執行控制。**`system.run` 受該筆電上的節點允許清單/核准控管。
    - **更多裝置工具。**除了 `system.run`，節點還會公開 `canvas`、`camera` 和 `screen`。
    - **本機瀏覽器自動化。**將 Gateway 保留在 VPS 上，但透過筆電上的節點主機在本機執行 Chrome，或透過 Chrome MCP 連接到主機上的本機 Chrome。

    SSH 適合臨時 shell 存取，但對於持續性的 agent 工作流程和
    裝置自動化，節點更簡單。

    文件：[節點](/zh-TW/nodes)、[節點 CLI](/zh-TW/cli/nodes)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="節點會執行 gateway 服務嗎？">
    不會。除非你刻意執行隔離的設定檔（請參閱[多個 gateway](/zh-TW/gateway/multiple-gateways)），否則每台主機只應執行**一個 gateway**。節點是連線到 gateway 的周邊裝置（iOS/Android 節點，或 macOS 選單列 app 中的「節點模式」）。如需 headless 節點
    主機和 CLI 控制，請參閱[節點主機 CLI](/zh-TW/cli/node)。

    `gateway`、`discovery` 和 `canvasHost` 變更需要完整重新啟動。

  </Accordion>

  <Accordion title="是否有 API / RPC 方式可以套用設定？">
    有。

    - `config.schema.lookup`：寫入前檢查一個設定子樹，包含其淺層 schema 節點、相符的 UI 提示和直接子項摘要
    - `config.get`：擷取目前快照 + hash
    - `config.patch`：安全的部分更新（大多數 RPC 編輯的首選）；可能時會熱重新載入，必要時會重新啟動
    - `config.apply`：驗證 + 取代完整設定；可能時會熱重新載入，必要時會重新啟動
    - 僅限擁有者的 `gateway` runtime 工具仍會拒絕重寫 `tools.exec.ask` / `tools.exec.security`；舊版 `tools.bash.*` 別名會正規化到相同的受保護執行路徑

  </Accordion>

  <Accordion title="首次安裝的最低合理設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    這會設定你的工作區，並限制誰可以觸發 bot。

  </Accordion>

  <Accordion title="我要如何在 VPS 上設定 Tailscale，並從我的 Mac 連線？">
    最少步驟：

    1. **在 VPS 上安裝並登入**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安裝並登入**
       - 使用 Tailscale app，並登入同一個 tailnet。
    3. **啟用 MagicDNS（建議）**
       - 在 Tailscale 管理主控台啟用 MagicDNS，讓 VPS 擁有穩定名稱。
    4. **使用 tailnet 主機名稱**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情況下存取 Control UI，請在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    這會讓 gateway 綁定到 loopback，並透過 Tailscale 暴露 HTTPS。請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

  </Accordion>

  <Accordion title="我要如何將 Mac node 連到遠端 Gateway（Tailscale Serve）？">
    Serve 會暴露 **Gateway Control UI + WS**。Node 會透過同一個 Gateway WS 端點連線。

    建議設定：

    1. **確認 VPS 與 Mac 位於同一個 tailnet**。
    2. **以 Remote 模式使用 macOS app**（SSH 目標可以是 tailnet 主機名稱）。
       App 會建立 Gateway 連接埠通道，並以 node 身分連線。
    3. **在 gateway 上核准 node**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文件：[Gateway 協定](/zh-TW/gateway/protocol)、[探索](/zh-TW/gateway/discovery)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我應該安裝在第二台筆電上，還是只要新增 node？">
    如果你只需要第二台筆電上的 **本機工具**（螢幕/相機/執行），請將它新增為
    **node**。這會保留單一 Gateway，並避免重複設定。本機 node 工具
    目前僅支援 macOS，但我們計畫將它們擴展到其他作業系統。

    只有在你需要 **強隔離** 或兩個完全分離的 bot 時，才安裝第二個 Gateway。

    文件：[Nodes](/zh-TW/nodes)、[Nodes CLI](/zh-TW/cli/nodes)、[多個 gateways](/zh-TW/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境變數與 .env 載入

<AccordionGroup>
  <Accordion title="OpenClaw 如何載入環境變數？">
    OpenClaw 會讀取父程序（shell、launchd/systemd、CI 等）的環境變數，並額外載入：

    - 目前工作目錄中的 `.env`
    - 來自 `~/.openclaw/.env` 的全域後備 `.env`（也就是 `$OPENCLAW_STATE_DIR/.env`）

    兩個 `.env` 檔案都不會覆寫既有環境變數。

    你也可以在設定中定義內嵌環境變數（只有在程序環境中缺少時才套用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完整優先順序與來源請參閱 [/environment](/zh-TW/help/environment)。

  </Accordion>

  <Accordion title="我透過服務啟動 Gateway，但我的環境變數消失了。現在怎麼辦？">
    兩個常見修正方式：

    1. 將缺少的金鑰放入 `~/.openclaw/.env`，這樣即使服務沒有繼承你的 shell env 也能被讀取。
    2. 啟用 shell 匯入（選用的便利功能）：

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

  <Accordion title='我設定了 COPILOT_GITHUB_TOKEN，但 models status 顯示「Shell env: off.」。為什麼？'>
    `openclaw models status` 會報告是否已啟用 **shell env 匯入**。「Shell env: off」
    **不**代表你的環境變數缺失 - 它只表示 OpenClaw 不會自動載入
    你的登入 shell。

    如果 Gateway 以服務（launchd/systemd）執行，它不會繼承你的 shell
    環境。請用以下其中一種方式修正：

    1. 將 token 放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或啟用 shell 匯入（`env.shellEnv.enabled: true`）。
    3. 或將它加入你的設定 `env` 區塊（只有在缺少時才套用）。

    然後重新啟動 gateway 並再次檢查：

    ```bash
    openclaw models status
    ```

    Copilot tokens 會從 `COPILOT_GITHUB_TOKEN` 讀取（也會讀取 `GH_TOKEN` / `GITHUB_TOKEN`）。
    請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers) 和 [/environment](/zh-TW/help/environment)。

  </Accordion>
</AccordionGroup>

## 工作階段與多個聊天

<AccordionGroup>
  <Accordion title="我要如何開始全新的對話？">
    傳送 `/new` 或 `/reset` 作為獨立訊息。請參閱 [工作階段管理](/zh-TW/concepts/session)。
  </Accordion>

  <Accordion title="如果我從不傳送 /new，工作階段會自動重設嗎？">
    工作階段可以在 `session.idleMinutes` 之後過期，但這項功能**預設停用**（預設為 **0**）。
    將它設定為正值即可啟用閒置過期。啟用後，閒置期間之後的**下一則**
    訊息會為該聊天鍵開始新的工作階段 ID。
    這不會刪除 transcript - 它只會開始新的工作階段。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有辦法建立一個 OpenClaw 實例團隊（一個 CEO 和多個代理）嗎？">
    可以，透過 **多代理路由** 和 **sub-agents**。你可以建立一個協調
    代理，以及幾個擁有各自工作區與模型的工作代理。

    也就是說，這最好被視為一個**有趣的實驗**。它很耗 token，而且通常
    不如使用一個 bot 搭配不同工作階段來得有效率。我們設想的典型模式是
    一個你對話的 bot，並用不同工作階段處理平行工作。該
    bot 也可以在需要時產生 sub-agents。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[Sub-agents](/zh-TW/tools/subagents)、[Agents CLI](/zh-TW/cli/agents)。

  </Accordion>

  <Accordion title="為什麼 context 會在任務中途被截斷？我要如何避免？">
    工作階段 context 受模型視窗限制。長聊天、大型工具輸出或大量
    檔案可能觸發 Compaction 或截斷。

    有幫助的做法：

    - 請 bot 摘要目前狀態並寫入檔案。
    - 在長任務前使用 `/compact`，並在切換主題時使用 `/new`。
    - 將重要 context 保留在工作區中，並請 bot 重新讀取。
    - 對長時間或平行工作使用 sub-agents，讓主聊天保持較小。
    - 如果這種情況經常發生，請選擇 context 視窗更大的模型。

  </Accordion>

  <Accordion title="我要如何完全重設 OpenClaw，但保留安裝？">
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

    注意：

    - 如果 Onboarding 偵測到既有設定，也會提供 **Reset**。請參閱 [Onboarding (CLI)](/zh-TW/start/wizard)。
    - 如果你使用 profiles（`--profile` / `OPENCLAW_PROFILE`），請重設每個 state dir（預設為 `~/.openclaw-<profile>`）。
    - 開發重設：`openclaw gateway --dev --reset`（僅限開發；會清除開發設定 + 認證 + 工作階段 + 工作區）。

  </Accordion>

  <Accordion title='我收到「context too large」錯誤 - 我要如何重設或 compact？'>
    使用以下其中一種：

    - **Compact**（保留對話，但摘要較舊回合）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 來引導摘要。

    - **Reset**（為同一個聊天鍵建立新的工作階段 ID）：

      ```
      /new
      /reset
      ```

    如果持續發生：

    - 啟用或調整 **工作階段剪枝**（`agents.defaults.contextPruning`）以修剪舊工具輸出。
    - 使用 context 視窗更大的模型。

    文件：[Compaction](/zh-TW/concepts/compaction)、[工作階段剪枝](/zh-TW/concepts/session-pruning)、[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title='為什麼我看到「LLM request rejected: messages.content.tool_use.input field required」？'>
    這是 provider 驗證錯誤：模型產生了缺少必要 `input` 的 `tool_use` 區塊。
    這通常表示工作階段歷史已過期或損毀（常見於長 thread
    或工具/schema 變更之後）。

    修正：使用 `/new` 開始新工作階段（獨立訊息）。

  </Accordion>

  <Accordion title="為什麼我每 30 分鐘會收到 heartbeat 訊息？">
    Heartbeat 預設每 **30m** 執行一次（使用 OAuth auth 時為 **1h**）。可調整或停用：

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
    標題，例如 `# Heading`），OpenClaw 會略過 heartbeat 執行以節省 API 呼叫。
    如果檔案不存在，heartbeat 仍會執行，並由模型決定要做什麼。

    每個代理的覆寫使用 `agents.list[].heartbeat`。文件：[Heartbeat](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把「bot account」加入 WhatsApp 群組嗎？'>
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

  <Accordion title="我要如何取得 WhatsApp 群組的 JID？">
    選項 1（最快）：tail logs 並在群組中傳送測試訊息：

    ```bash
    openclaw logs --follow --json
    ```

    尋找以 `@g.us` 結尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    選項 2（如果已設定/加入 allowlist）：從設定列出群組：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[目錄](/zh-TW/cli/directory)、[Logs](/zh-TW/cli/logs)。

  </Accordion>

  <Accordion title="為什麼 OpenClaw 不在群組中回覆？">
    兩個常見原因：

    - Mention gating 已開啟（預設）。你必須 @mention bot（或符合 `mentionPatterns`）。
    - 你設定了 `channels.whatsapp.groups` 但沒有 `"*"`，而該群組未加入 allowlist。

    請參閱 [群組](/zh-TW/channels/groups) 和 [群組訊息](/zh-TW/channels/group-messages)。

  </Accordion>

  <Accordion title="群組/threads 會與 DM 共用 context 嗎？">
    Direct chats 預設會收斂到主要工作階段。群組/頻道有自己的工作階段鍵，而 Telegram topics / Discord threads 是獨立工作階段。請參閱 [群組](/zh-TW/channels/groups) 和 [群組訊息](/zh-TW/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以建立多少個工作區和代理？">
    沒有硬性限制。數十個（甚至數百個）都可以，但請注意：

    - **磁碟成長：** 工作階段 + transcripts 位於 `~/.openclaw/agents/<agentId>/sessions/` 底下。
    - **Token 成本：** 更多代理表示更多並行模型使用量。
    - **維運負擔：** 每個代理的 auth profiles、工作區與頻道路由。

    提示：

    - 每個代理保留一個**作用中**工作區（`agents.defaults.workspace`）。
    - 如果磁碟成長，請剪枝舊工作階段（刪除 JSONL 或 store entries）。
    - 使用 `openclaw doctor` 找出零散工作區與 profile 不相符情況。

  </Accordion>

  <Accordion title="我可以同時執行多個 bot 或聊天（Slack）嗎？應該如何設定？">
    可以。使用 **Multi-Agent Routing** 來執行多個隔離的 agent，並依
    channel/account/peer 路由傳入訊息。Slack 支援作為 channel，且可以繫結到特定 agent。

    瀏覽器存取功能強大，但不是「人類能做什麼就都能做什麼」：反 bot、CAPTCHA 和 MFA
    仍可能阻擋自動化。若要取得最可靠的瀏覽器控制，請在主機上使用本機 Chrome MCP，
    或在實際執行瀏覽器的機器上使用 CDP。

    最佳實務設定：

    - 永遠開啟的 Gateway 主機（VPS/Mac mini）。
    - 每個角色一個 agent（繫結）。
    - Slack channel 繫結到那些 agent。
    - 需要時透過 Chrome MCP 或 node 使用本機瀏覽器。

    文件：[Multi-Agent Routing](/zh-TW/concepts/multi-agent)、[Slack](/zh-TW/channels/slack)、
    [瀏覽器](/zh-TW/tools/browser)、[Node](/zh-TW/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、容錯移轉與 auth profile

模型問答：預設值、選擇、別名、切換、容錯移轉、auth profile：
位於 [模型 FAQ](/zh-TW/help/faq-models)。

## Gateway：連接埠、「已在執行」與遠端模式

<AccordionGroup>
  <Accordion title="Gateway 使用哪個連接埠？">
    `gateway.port` 控制 WebSocket + HTTP（Control UI、hook 等）的單一多工連接埠。

    優先順序：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示「Runtime: running」，但「Connectivity probe: failed」？'>
    因為「running」是 **supervisor** 的視角（launchd/systemd/schtasks）。連線探測是 CLI 實際連線到 gateway WebSocket。

    使用 `openclaw gateway status` 並信任這些行：

    - `Probe target:`（探測實際使用的 URL）
    - `Listening:`（連接埠上實際繫結的項目）
    - `Last gateway error:`（程序還活著但連接埠沒有監聽時的常見根本原因）

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示「Config (cli)」和「Config (service)」不同？'>
    你正在編輯一個設定檔，但服務正在使用另一個設定檔執行（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不一致）。

    修正：

    ```bash
    openclaw gateway install --force
    ```

    請從你希望服務使用的同一個 `--profile` / 環境執行該命令。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」是什麼意思？'>
    OpenClaw 會在啟動時立即繫結 WebSocket listener（預設 `ws://127.0.0.1:18789`）來強制執行 runtime lock。如果繫結因 `EADDRINUSE` 失敗，它會擲出 `GatewayLockError`，表示另一個 instance 已在監聽。

    修正：停止另一個 instance、釋放連接埠，或使用 `openclaw gateway --port <port>` 執行。

  </Accordion>

  <Accordion title="如何以遠端模式執行 OpenClaw（client 連線到其他地方的 Gateway）？">
    設定 `gateway.mode: "remote"` 並指向遠端 WebSocket URL，可選擇搭配共享祕密遠端認證：

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
    - `gateway.remote.token` / `.password` 只是 client 端遠端認證；它們本身不會啟用本機 gateway auth。

  </Accordion>

  <Accordion title='Control UI 顯示「unauthorized」（或持續重新連線）。現在怎麼辦？'>
    你的 gateway auth 路徑與 UI 的 auth 方法不相符。

    事實（來自程式碼）：

    - Control UI 會把 token 保存在目前瀏覽器分頁 session 與所選 gateway URL 的 `sessionStorage` 中，因此同分頁重新整理仍可運作，而不會恢復長期 localStorage token 持久性。
    - 在 `AUTH_TOKEN_MISMATCH` 時，trusted client 可在 gateway 回傳重試提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）時，使用快取的 device token 嘗試一次有界重試。
    - 該快取 token 重試現在會重用與 device token 一起儲存的快取已核准 scope。明確 `deviceToken` / 明確 `scopes` 呼叫者仍會保留其要求的 scope 集合，而不是繼承快取 scope。
    - 在該重試路徑之外，連線 auth 優先順序是明確 shared token/password 優先，接著是明確 `deviceToken`，再來是已儲存的 device token，最後是 bootstrap token。
    - Bootstrap token scope 檢查帶有角色前綴。內建 bootstrap operator allowlist 只滿足 operator request；node 或其他非 operator 角色仍需要其自身角色前綴下的 scope。

    修正：

    - 最快：`openclaw dashboard`（列印 + 複製 dashboard URL、嘗試開啟；若為 headless 則顯示 SSH 提示）。
    - 如果你還沒有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是遠端，先建立 tunnel：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。
    - Shared-secret 模式：設定 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然後在 Control UI 設定中貼上相符的 secret。
    - Tailscale Serve 模式：確認已啟用 `gateway.auth.allowTailscale`，且你開啟的是 Serve URL，而不是會繞過 Tailscale identity header 的原始 loopback/tailnet URL。
    - Trusted-proxy 模式：確認你是透過已設定的 identity-aware proxy 進入，而不是原始 gateway URL。同主機 loopback proxy 也需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重試後仍不相符，請輪替/重新核准配對的 device token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果該 rotate 呼叫表示被拒絕，請檢查兩件事：
      - paired-device session 只能輪替自己的 **own** device，除非它們也有 `operator.admin`
      - 明確 `--scope` 值不能超過呼叫者目前的 operator scope
    - 還是卡住？執行 `openclaw status --all` 並依照 [疑難排解](/zh-TW/gateway/troubleshooting)。auth 詳細資訊請見 [Dashboard](/zh-TW/web/dashboard)。

  </Accordion>

  <Accordion title="我設定了 gateway.bind tailnet，但它無法繫結且沒有任何東西在監聽">
    `tailnet` bind 會從你的網路介面選取一個 Tailscale IP（100.64.0.0/10）。如果機器不在 Tailscale 上（或介面已關閉），就沒有可繫結的項目。

    修正：

    - 在該主機上啟動 Tailscale（讓它有 100.x 位址），或
    - 切換為 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是明確指定。`auto` 偏好 loopback；當你想要只繫結 tailnet 時，請使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主機上執行多個 Gateway 嗎？">
    通常不需要：一個 Gateway 可以執行多個 messaging channel 和 agent。只有在需要備援（例如：rescue bot）或強隔離時才使用多個 Gateway。

    可以，但你必須隔離：

    - `OPENCLAW_CONFIG_PATH`（每個 instance 的設定）
    - `OPENCLAW_STATE_DIR`（每個 instance 的狀態）
    - `agents.defaults.workspace`（workspace 隔離）
    - `gateway.port`（唯一連接埠）

    快速設定（建議）：

    - 每個 instance 使用 `openclaw --profile <name> ...`（自動建立 `~/.openclaw-<name>`）。
    - 在每個 profile 設定中設定唯一的 `gateway.port`（或為手動執行傳入 `--port`）。
    - 安裝每個 profile 的服務：`openclaw --profile <name> gateway install`。

    Profile 也會為服務名稱加上後綴（`ai.openclaw.<profile>`；legacy `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多個 gateway](/zh-TW/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ code 1008 是什麼意思？'>
    Gateway 是 **WebSocket server**，且它預期第一個訊息一定是
    `connect` frame。如果收到其他任何內容，它會以 **code 1008**（policy violation）
    關閉連線。

    常見原因：

    - 你在瀏覽器中開啟了 **HTTP** URL（`http://...`），而不是使用 WS client。
    - 你使用了錯誤的連接埠或路徑。
    - Proxy 或 tunnel 移除了 auth header，或送出了非 Gateway request。

    快速修正：

    1. 使用 WS URL：`ws://<host>:18789`（若為 HTTPS 則使用 `wss://...`）。
    2. 不要在一般瀏覽器分頁中開啟 WS 連接埠。
    3. 如果已開啟 auth，請在 `connect` frame 中包含 token/password。

    如果你使用 CLI 或 TUI，URL 應該長這樣：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Protocol 詳細資訊：[Gateway protocol](/zh-TW/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 記錄與除錯

<AccordionGroup>
  <Accordion title="Log 在哪裡？">
    檔案 log（結構化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以透過 `logging.file` 設定穩定路徑。檔案 log level 由 `logging.level` 控制。Console 詳細程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快 tail log：

    ```bash
    openclaw logs --follow
    ```

    Service/supervisor log（當 gateway 透過 launchd/systemd 執行時）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（預設：`~/.openclaw/logs/...`；profile 使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多資訊請見 [疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何啟動/停止/重新啟動 Gateway 服務？">
    使用 gateway helper：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行 gateway，`openclaw gateway --force` 可以取回連接埠。請見 [Gateway](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上關閉了終端機：如何重新啟動 OpenClaw？">
    有 **兩種 Windows 安裝模式**：

    **1) WSL2（建議）：** Gateway 在 Linux 內執行。

    開啟 PowerShell，進入 WSL，然後重新啟動：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你從未安裝服務，請以前景模式啟動：

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

  <Accordion title="Gateway 已啟動，但回覆從未送達。我該檢查什麼？">
    從快速健康檢查開始：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常見原因：

    - 模型 auth 未載入到 **gateway host**（檢查 `models status`）。
    - Channel pairing/allowlist 阻擋回覆（檢查 channel 設定 + log）。
    - WebChat/Dashboard 在沒有正確 token 的情況下開啟。

    如果你是遠端，請確認 tunnel/Tailscale 連線已啟動，且
    Gateway WebSocket 可連線。

    文件：[Channel](/zh-TW/channels)、[疑難排解](/zh-TW/gateway/troubleshooting)、[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」：現在怎麼辦？'>
    這通常表示 UI 失去了 WebSocket 連線。請檢查：

    1. Gateway 是否正在執行？`openclaw gateway status`
    2. Gateway 是否健康？`openclaw status`
    3. UI 是否有正確的權杖？`openclaw dashboard`
    4. 如果是遠端，通道/Tailscale 連線是否已啟用？

    接著追蹤日誌：

    ```bash
    openclaw logs --follow
    ```

    文件：[儀表板](/zh-TW/web/dashboard)、[遠端存取](/zh-TW/gateway/remote)、[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失敗。我該檢查什麼？">
    從日誌與頻道狀態開始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    接著比對錯誤：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 選單有太多項目。OpenClaw 已經裁剪到 Telegram 限制並以較少命令重試，但仍需要移除一些選單項目。減少 Plugin/Skill/自訂命令，或在你不需要選單時停用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或類似的網路錯誤：如果你在 VPS 上或位於 Proxy 後方，請確認允許對外 HTTPS，且 DNS 可解析 `api.telegram.org`。

    如果 Gateway 是遠端的，請確認你正在查看 Gateway 主機上的日誌。

    文件：[Telegram](/zh-TW/channels/telegram)、[頻道疑難排解](/zh-TW/channels/troubleshooting)。

  </Accordion>

  <Accordion title="TUI 沒有顯示輸出。我該檢查什麼？">
    先確認 Gateway 可連線，且代理可以執行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在 TUI 中，使用 `/status` 查看目前狀態。如果你預期在聊天
    頻道中收到回覆，請確認已啟用傳送（`/deliver on`）。

    文件：[TUI](/zh-TW/web/tui)、[Slash 命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止再啟動 Gateway？">
    如果你已安裝服務：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    這會停止/啟動**受監督服務**（macOS 上的 launchd，Linux 上的 systemd）。
    當 Gateway 以背景常駐程式執行時使用這個方式。

    如果你是在前景執行，請用 Ctrl-C 停止，然後執行：

    ```bash
    openclaw gateway run
    ```

    文件：[Gateway 服務操作手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="簡單說明：openclaw gateway restart 與 openclaw gateway">
    - `openclaw gateway restart`：重新啟動**背景服務**（launchd/systemd）。
    - `openclaw gateway`：在此終端機工作階段中以前景方式執行 Gateway。

    如果你已安裝服務，請使用 Gateway 命令。當你想要一次性的前景執行時，
    使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出錯時最快取得更多細節的方法">
    使用 `--verbose` 啟動 Gateway 以取得更多主控台細節。接著檢查日誌檔中的頻道驗證、模型路由與 RPC 錯誤。
  </Accordion>
</AccordionGroup>

## 媒體與附件

<AccordionGroup>
  <Accordion title="我的 Skill 產生了圖片/PDF，但沒有送出任何內容">
    代理的傳出附件必須包含一行 `MEDIA:<path-or-url>`（獨立成行）。請參閱 [OpenClaw 助理設定](/zh-TW/start/openclaw)與[代理傳送](/zh-TW/tools/agent-send)。

    CLI 傳送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    也請檢查：

    - 目標頻道支援傳出媒體，且未被允許清單封鎖。
    - 檔案位於提供者的大小限制內（圖片會調整到最大 2048px）。
    - `tools.fs.workspaceOnly=true` 會讓本機路徑傳送限制在 workspace、temp/media-store，以及通過 sandbox 驗證的檔案。
    - `tools.fs.workspaceOnly=false` 允許 `MEDIA:` 傳送代理已可讀取的主機本機檔案，但僅限媒體與安全文件類型（圖片、音訊、影片、PDF 與 Office 文件）。純文字與疑似祕密的檔案仍會被封鎖。

    請參閱[圖片](/zh-TW/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全性與存取控制

<AccordionGroup>
  <Accordion title="將 OpenClaw 暴露給傳入私訊安全嗎？">
    將傳入私訊視為不受信任的輸入。預設值設計用來降低風險：

    - 在支援私訊的頻道上，預設行為是**配對**：
      - 未知傳送者會收到配對碼；Bot 不會處理他們的訊息。
      - 核准方式：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待處理請求上限為**每個頻道 3 個**；如果沒有收到代碼，請檢查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公開開放私訊需要明確選擇加入（`dmPolicy: "open"` 與允許清單 `"*"`）。

    執行 `openclaw doctor` 以顯示有風險的私訊政策。

  </Accordion>

  <Accordion title="提示注入只對公開 Bot 才需要擔心嗎？">
    不是。提示注入關乎**不受信任的內容**，不只是誰可以私訊 Bot。
    如果你的助理會讀取外部內容（網頁搜尋/擷取、瀏覽器頁面、電子郵件、
    文件、附件、貼上的日誌），該內容可能包含試圖
    劫持模型的指示。即使**你是唯一傳送者**，這仍可能發生。

    最大的風險是在啟用工具時：模型可能被誘騙代表你
    外洩上下文或呼叫工具。透過以下方式降低影響範圍：

    - 使用唯讀或停用工具的「reader」代理來摘要不受信任的內容
    - 對已啟用工具的代理關閉 `web_search` / `web_fetch` / `browser`
    - 將解碼後的檔案/文件文字也視為不受信任：OpenResponses
      `input_file` 與媒體附件擷取都會將擷取文字包在
      明確的外部內容邊界標記中，而不是傳遞原始檔案文字
    - 使用 sandbox 與嚴格的工具允許清單

    詳情：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我的 Bot 應該有自己的電子郵件、GitHub 帳號或電話號碼嗎？">
    對大多數設定來說，是的。使用獨立帳號與電話號碼隔離 Bot，
    可在出問題時降低影響範圍。這也讓你更容易輪換
    憑證或撤銷存取權，而不影響個人帳號。

    從小範圍開始。只授予你實際需要的工具與帳號存取權，之後
    如有需要再擴充。

    文件：[安全性](/zh-TW/gateway/security)、[配對](/zh-TW/channels/pairing)。

  </Accordion>

  <Accordion title="我可以讓它自主處理我的簡訊嗎？這樣安全嗎？">
    我們**不**建議對你的個人訊息開啟完整自主權。最安全的模式是：

    - 將私訊維持在**配對模式**或嚴格的允許清單中。
    - 如果你希望它代表你傳訊息，請使用**獨立號碼或帳號**。
    - 讓它草擬，然後在傳送前**核准**。

    如果你想實驗，請在專用帳號上進行並保持隔離。請參閱
    [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我可以用較便宜的模型處理個人助理任務嗎？">
    可以，**前提是**代理僅用於聊天且輸入是受信任的。較小層級的模型
    較容易受到指令劫持，因此請避免將它們用於已啟用工具的代理
    或讀取不受信任內容時。如果你必須使用較小模型，請鎖定
    工具並在 sandbox 中執行。請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中執行了 /start，但沒有收到配對碼">
    配對碼**只會**在未知傳送者傳訊給 Bot 且
    `dmPolicy: "pairing"` 已啟用時送出。單獨的 `/start` 不會產生代碼。

    檢查待處理請求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即存取，請將你的傳送者 id 加入允許清單，或為該帳號設定 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它會傳訊息給我的聯絡人嗎？配對如何運作？">
    不會。預設 WhatsApp 私訊政策是**配對**。未知傳送者只會取得配對碼，且其訊息**不會被處理**。OpenClaw 只會回覆它收到的聊天，或回覆你明確觸發的傳送。

    使用以下方式核准配對：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待處理請求：

    ```bash
    openclaw pairing list whatsapp
    ```

    精靈電話號碼提示：它用來設定你的**允許清單/擁有者**，讓你自己的私訊被允許。它不會用於自動傳送。如果你在個人 WhatsApp 號碼上執行，請使用該號碼並啟用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任務，以及「它停不下來」

<AccordionGroup>
  <Accordion title="如何阻止內部系統訊息顯示在聊天中？">
    大多數內部或工具訊息只會在該工作階段啟用 **verbose**、**trace** 或 **reasoning** 時
    出現。

    在你看到它的聊天中修正：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，請檢查 Control UI 中的工作階段設定，並將 verbose
    設為**繼承**。也請確認你沒有使用在設定中將 `verboseDefault` 設為
    `on` 的 Bot 設定檔。

    文件：[思考與 verbose](/zh-TW/tools/thinking)、[安全性](/zh-TW/gateway/security#reasoning-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在執行的任務？">
    將以下任一項**作為獨立訊息**傳送（不要加斜線）：

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

    這些是中止觸發詞（不是 Slash 命令）。

    對於背景程序（來自 exec 工具），你可以要求代理執行：

    ```
    process action:kill sessionId:XXX
    ```

    Slash 命令概覽：請參閱 [Slash 命令](/zh-TW/tools/slash-commands)。

    大多數命令必須以**獨立**訊息傳送，並以 `/` 開頭，但少數捷徑（例如 `/status`）也可供允許清單中的傳送者在行內使用。

  </Accordion>

  <Accordion title='如何從 Telegram 傳送 Discord 訊息？（"Cross-context messaging denied"）'>
    OpenClaw 預設會封鎖**跨提供者**訊息。如果工具呼叫綁定到
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

    編輯設定後重新啟動 Gateway。

  </Accordion>

  <Accordion title='為什麼感覺 Bot 會「忽略」連續快速訊息？'>
    佇列模式控制新訊息如何與正在進行的執行互動。使用 `/queue` 變更模式：

    - `steer` - 將所有待處理的導引排入目前執行中的下一個模型邊界
    - `queue` - 傳統一次一個的導引
    - `followup` - 一次執行一則訊息
    - `collect` - 批次處理訊息並回覆一次
    - `steer-backlog` - 立即導引，接著處理積壓項目
    - `interrupt` - 中止目前執行並重新開始

    預設模式是 `steer`。你可以為 followup 模式加入 `debounce:0.5s cap:25 drop:summarize` 等選項。請參閱[命令佇列](/zh-TW/concepts/queue)與[導引佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='Anthropic 搭配 API 金鑰時的預設模型是什麼？'>
    在 OpenClaw 中，認證資料與模型選擇是分開的。設定 `ANTHROPIC_API_KEY`（或在 auth profiles 中儲存 Anthropic API 金鑰）會啟用身分驗證，但實際的預設模型會是你在 `agents.defaults.model.primary` 中設定的模型（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，表示 Gateway 在執行中的代理程式預期的 `auth-profiles.json` 中找不到 Anthropic 認證資料。
  </Accordion>
</AccordionGroup>

---

還卡住嗎？請在 [Discord](https://discord.com/invite/clawd) 詢問，或開啟 [GitHub 討論](https://github.com/openclaw/openclaw/discussions)。

## 相關

- [首次執行 FAQ](/zh-TW/help/faq-first-run) — 安裝、初始設定、身分驗證、訂閱、早期失敗
- [模型 FAQ](/zh-TW/help/faq-models) — 模型選擇、容錯移轉、auth profiles
- [疑難排解](/zh-TW/help/troubleshooting) — 以症狀為優先的分流診斷
