---
read_when:
    - 回答常見的設定、安裝、入門導覽或執行階段支援問題
    - 在深入除錯前分流處理使用者回報的問題
summary: 關於 OpenClaw 安裝、設定與使用方式的常見問題
title: 常見問題
x-i18n:
    generated_at: "2026-05-03T21:35:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

快速解答，以及針對實際設定的深入疑難排解（本機開發、VPS、多代理、OAuth/API 金鑰、模型容錯移轉）。如需執行階段診斷，請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。如需完整設定參考，請參閱[設定](/zh-TW/gateway/configuration)。

## 如果發生故障，前 60 秒先做這些

1. **快速狀態（第一步檢查）**

   ```bash
   openclaw status
   ```

   快速本機摘要：OS + 更新、gateway/service 可連線性、代理/工作階段、供應商設定 + 執行階段問題（Gateway 可連線時）。

2. **可貼上的報告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   唯讀診斷，包含日誌尾端（權杖已遮蔽）。

3. **Daemon + 連接埠狀態**

   ```bash
   openclaw gateway status
   ```

   顯示監督程式執行階段與 RPC 可連線性、探測目標 URL，以及服務可能使用的設定。

4. **深度探測**

   ```bash
   openclaw status --deep
   ```

   執行即時 Gateway 健康探測，支援時也包含通道探測
   （需要可連線的 Gateway）。請參閱[健康狀態](/zh-TW/gateway/health)。

5. **追蹤最新日誌**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 無法使用，請改用：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   檔案日誌與服務日誌是分開的；請參閱[日誌記錄](/zh-TW/logging)與[疑難排解](/zh-TW/gateway/troubleshooting)。

6. **執行 doctor（修復）**

   ```bash
   openclaw doctor
   ```

   修復/遷移設定與狀態，並執行健康檢查。請參閱[Doctor](/zh-TW/gateway/doctor)。

7. **Gateway 快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   要求執行中的 Gateway 提供完整快照（僅限 WS）。請參閱[健康狀態](/zh-TW/gateway/health)。

## 快速開始與首次執行設定

首次執行問答，包括安裝、onboard、驗證路由、訂閱、初始失敗，
都在[首次執行 FAQ](/zh-TW/help/faq-first-run)。

## OpenClaw 是什麼？

<AccordionGroup>
  <Accordion title="OpenClaw 簡短來說是什麼？">
    OpenClaw 是一個在你自己的裝置上執行的個人 AI 助理。它會在你已經使用的訊息介面上回覆（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等內建通道 Plugin），也可以在支援的平台上提供語音 + 即時 Canvas。**Gateway** 是永遠在線的控制平面；助理本身才是產品。
  </Accordion>

  <Accordion title="價值主張">
    OpenClaw 不只是「Claude 包裝器」。它是一個**本機優先控制平面**，讓你可以在**自己的硬體**上執行
    有能力的助理，並從你已經使用的聊天應用程式存取，
    具備有狀態工作階段、記憶與工具，而不必把工作流程控制權交給託管式
    SaaS。

    重點：

    - **你的裝置，你的資料：** 在你想要的地方執行 Gateway（Mac、Linux、VPS），並將
      工作區 + 工作階段歷史保留在本機。
    - **真實通道，而不是網頁沙盒：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等等，
      加上支援平台上的行動語音與 Canvas。
    - **模型無關：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，並支援每個代理的路由
      與容錯移轉。
    - **僅本機選項：** 執行本機模型，讓**所有資料都可以留在你的裝置上**。
    - **多代理路由：** 依通道、帳號或任務分開代理，每個代理都有自己的
      工作區與預設值。
    - **開放原始碼且可修改：** 檢視、擴充與自行託管，不受供應商綁定。

    文件：[Gateway](/zh-TW/gateway)、[通道](/zh-TW/channels)、[多代理](/zh-TW/concepts/multi-agent)、
    [記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我剛設定好，第一步該做什麼？">
    適合開始的專案：

    - 建立網站（WordPress、Shopify，或簡單的靜態網站）。
    - 製作行動應用程式原型（大綱、畫面、API 計畫）。
    - 整理檔案與資料夾（清理、命名、標記）。
    - 連接 Gmail 並自動化摘要或後續追蹤。

    它可以處理大型任務，但當你將任務拆成階段，並
    使用子代理平行處理時，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常見的五個日常用途是什麼？">
    日常有效成果通常像這樣：

    - **個人簡報：** 摘要你關心的收件匣、行事曆與新聞。
    - **研究與起草：** 快速研究、摘要，以及電子郵件或文件的初稿。
    - **提醒與後續追蹤：** 由 Cron 或 Heartbeat 驅動的提示與清單。
    - **瀏覽器自動化：** 填寫表單、收集資料，以及重複網頁任務。
    - **跨裝置協調：** 從手機送出任務，讓 Gateway 在伺服器上執行，並在聊天中取回結果。

  </Accordion>

  <Accordion title="OpenClaw 能協助 SaaS 的潛在客戶開發、外展、廣告與部落格嗎？">
    可以，用於**研究、篩選與起草**。它可以掃描網站、建立候選清單、
    摘要潛在客戶，並撰寫外展或廣告文案草稿。

    對於**外展或廣告投放**，請保留人工審核。避免垃圾訊息，遵守當地法律與
    平台政策，並在送出前審查所有內容。最安全的模式是讓
    OpenClaw 起草，再由你批准。

    文件：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="相較於 Claude Code，用於網頁開發有哪些優勢？">
    OpenClaw 是**個人助理**與協調層，不是 IDE 替代品。若要在 repo 內獲得最快的直接寫程式迴圈，請使用
    Claude Code 或 Codex。當你需要持久記憶、跨裝置存取與工具編排時，請使用 OpenClaw。

    優勢：

    - 跨工作階段的**持久記憶 + 工作區**
    - **多平台存取**（WhatsApp、Telegram、TUI、WebChat）
    - **工具編排**（瀏覽器、檔案、排程、hook）
    - **永遠在線的 Gateway**（在 VPS 上執行，從任何地方互動）
    - 用於本機瀏覽器/螢幕/相機/exec 的 **Nodes**

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 與自動化

<AccordionGroup>
  <Accordion title="如何自訂 Skills 而不讓 repo 變髒？">
    使用受管理的覆寫，而不是編輯 repo 副本。將你的變更放在 `~/.openclaw/skills/<name>/SKILL.md`（或透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 加入資料夾）。優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 內建 → `skills.load.extraDirs`，因此受管理的覆寫仍會優先於內建 Skills，而不必碰 git。如果你需要全域安裝該 Skills，但只讓部分代理看見，請將共用副本保留在 `~/.openclaw/skills`，並用 `agents.defaults.skills` 與 `agents.list[].skills` 控制可見性。只有值得 upstream 的編輯才應放在 repo 中並以 PR 送出。
  </Accordion>

  <Accordion title="我可以從自訂資料夾載入 Skills 嗎？">
    可以。透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 加入額外目錄（最低優先順序）。預設優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 內建 → `skills.load.extraDirs`。`clawhub` 預設會安裝到 `./skills`，OpenClaw 會在下一個工作階段將其視為 `<workspace>/skills`。如果該 Skills 只應對特定代理可見，請搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何針對不同任務使用不同模型？">
    目前支援的模式如下：

    - **Cron 作業**：隔離作業可以為每個作業設定 `model` 覆寫。
    - **子代理**：將任務路由到具有不同預設模型的獨立代理。
    - **隨需切換**：隨時使用 `/model` 切換目前工作階段模型。

    請參閱 [Cron 作業](/zh-TW/automation/cron-jobs)、[多代理路由](/zh-TW/concepts/multi-agent)與[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="bot 在處理繁重工作時凍結。我要如何卸載這些工作？">
    對長時間或平行任務使用**子代理**。子代理會在自己的工作階段中執行，
    回傳摘要，並讓你的主要聊天保持回應。

    要求你的 bot「spawn a sub-agent for this task」，或使用 `/subagents`。
    在聊天中使用 `/status` 查看 Gateway 目前正在做什麼（以及是否忙碌）。

    權杖提示：長任務與子代理都會消耗權杖。如果在意成本，請透過
    `agents.defaults.subagents.model` 為子代理設定較便宜的模型。

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上的執行緒綁定子代理工作階段如何運作？">
    使用執行緒綁定。你可以將 Discord 執行緒綁定到子代理或工作階段目標，讓該執行緒中的後續訊息維持在該綁定工作階段上。

    基本流程：

    - 使用 `sessions_spawn` 並設定 `thread: true` 來產生（可選擇設定 `mode: "session"` 以便持久後續追蹤）。
    - 或使用 `/focus <target>` 手動綁定。
    - 使用 `/agents` 檢查綁定狀態。
    - 使用 `/session idle <duration|off>` 與 `/session max-age <duration|off>` 控制自動取消聚焦。
    - 使用 `/unfocus` 分離該執行緒。

    必要設定：

    - 全域預設值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆寫：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 產生時自動綁定：`channels.discord.threadBindings.spawnSessions` 預設為 `true`；將其設為 `false` 可停用執行緒綁定工作階段產生。

    文件：[子代理](/zh-TW/tools/subagents)、[Discord](/zh-TW/channels/discord)、[設定參考](/zh-TW/gateway/configuration-reference)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="子代理完成了，但完成更新送到錯誤位置或從未發布。我該檢查什麼？">
    先檢查已解析的請求者路由：

    - 完成模式的子代理遞送會優先使用任何已綁定的執行緒或對話路由。
    - 如果完成來源只帶有通道，OpenClaw 會退回使用請求者工作階段已儲存的路由（`lastChannel` / `lastTo` / `lastAccountId`），讓直接遞送仍可成功。
    - 如果既沒有綁定路由，也沒有可用的已儲存路由，直接遞送可能失敗，結果會改為退回排隊工作階段遞送，而不是立即發布到聊天。
    - 無效或過期的目標仍可能強制佇列退回或導致最終遞送失敗。
    - 如果子項最後一則可見助理回覆是完全相同的靜默權杖 `NO_REPLY` / `no_reply`，或完全等於 `ANNOUNCE_SKIP`，OpenClaw 會刻意抑制公告，而不是發布過期的較早進度。
    - 如果子項在只有工具呼叫後逾時，公告可以將其折疊成簡短的部分進度摘要，而不是重播原始工具輸出。

    偵錯：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)、[工作階段工具](/zh-TW/concepts/session-tool)。

  </Accordion>

  <Accordion title="Cron 或提醒沒有觸發。我該檢查什麼？">
    Cron 在 Gateway 程序內執行。如果 Gateway 沒有持續執行，
    排定的作業就不會執行。

    檢查清單：

    - 確認 cron 已啟用（`cron.enabled`），且未設定 `OPENCLAW_SKIP_CRON`。
    - 檢查 Gateway 是否 24/7 執行（沒有睡眠/重新啟動）。
    - 驗證作業的時區設定（`--tz` 與主機時區）。

    偵錯：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[Cron 作業](/zh-TW/automation/cron-jobs)、[自動化與任務](/zh-TW/automation)。

  </Accordion>

  <Accordion title="Cron 已觸發，但沒有傳送任何內容到頻道。為什麼？">
    請先檢查傳遞模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示不會預期 runner fallback 傳送。
    - 缺少或無效的公告目標（`channel` / `to`）表示 runner 已略過對外傳遞。
    - 頻道驗證失敗（`unauthorized`、`Forbidden`）表示 runner 嘗試傳遞，但憑證阻擋了它。
    - 靜默的隔離結果（只有 `NO_REPLY` / `no_reply`）會被視為刻意不可傳遞，因此 runner 也會抑制佇列中的 fallback 傳遞。

    對於隔離的 Cron 工作，當可用聊天路由存在時，代理仍可使用 `message`
    工具直接傳送。`--announce` 只控制代理尚未自行傳送的最終文字所使用的 runner
    fallback 路徑。

    偵錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[Cron 工作](/zh-TW/automation/cron-jobs)、[背景工作](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="為什麼隔離的 Cron 執行會切換模型或重試一次？">
    這通常是即時模型切換路徑，而不是重複排程。

    隔離的 Cron 可在作用中執行拋出 `LiveSessionModelSwitchError` 時，保留執行階段模型交接並重試。
    重試會保留已切換的 provider/model，而且如果切換帶有新的驗證設定檔覆寫，Cron
    也會在重試前保留該覆寫。

    相關選取規則：

    - Gmail hook 模型覆寫在適用時優先。
    - 接著是每個工作的 `model`。
    - 接著是任何已儲存的 Cron 工作階段模型覆寫。
    - 接著是一般代理/預設模型選取。

    重試迴圈有界限。在初始嘗試加上 2 次切換重試後，
    Cron 會中止，而不是永遠迴圈。

    偵錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[Cron 工作](/zh-TW/automation/cron-jobs)、[Cron CLI](/zh-TW/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 Skills？">
    使用原生 `openclaw skills` 命令，或將 Skills 放入你的工作區。macOS Skills UI 在 Linux 上不可用。
    請在 [https://clawhub.ai](https://clawhub.ai) 瀏覽 Skills。

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
    目錄。只有在你想發布或同步自己的 Skills 時，才需要安裝獨立的 `clawhub` CLI。
    若要在代理之間共用安裝，請將 Skill 放在
    `~/.openclaw/skills` 底下，並在想限制哪些代理可看到它時使用
    `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以依排程或持續在背景執行工作嗎？">
    可以。請使用 Gateway 排程器：

    - **Cron 工作** 用於排程或週期性工作（重啟後仍會保留）。
    - **Heartbeat** 用於「主要工作階段」的週期性檢查。
    - **隔離工作** 用於會發布摘要或傳遞到聊天的自主代理。

    文件：[Cron 工作](/zh-TW/automation/cron-jobs)、[自動化與工作](/zh-TW/automation)、
    [Heartbeat](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以從 Linux 執行僅限 Apple macOS 的 Skills 嗎？">
    不能直接執行。macOS Skills 會受到 `metadata.openclaw.os` 加上必要二進位檔的限制，而且 Skills 只有在 **Gateway 主機** 上符合資格時，才會出現在系統提示中。在 Linux 上，除非你覆寫限制，否則僅限 `darwin` 的 Skills（例如 `apple-notes`、`apple-reminders`、`things-mac`）不會載入。

    你有三種支援的模式：

    **選項 A - 在 Mac 上執行 Gateway（最簡單）。**
    在 macOS 二進位檔所在的位置執行 Gateway，然後從 Linux 以[遠端模式](#gateway-ports-already-running-and-remote-mode)或透過 Tailscale 連線。由於 Gateway 主機是 macOS，Skills 會正常載入。

    **選項 B - 使用 macOS Node（不使用 SSH）。**
    在 Linux 上執行 Gateway，配對一個 macOS Node（選單列 app），並在 Mac 上將 **Node Run Commands** 設為「一律詢問」或「一律允許」。當 Node 上存在必要二進位檔時，OpenClaw 可將僅限 macOS 的 Skills 視為符合資格。代理會透過 `nodes` 工具執行那些 Skills。如果你選擇「一律詢問」，在提示中核准「一律允許」會將該命令加入允許清單。

    **選項 C - 透過 SSH 代理 macOS 二進位檔（進階）。**
    讓 Gateway 保持在 Linux 上，但讓必要的 CLI 二進位檔解析到會在 Mac 上執行的 SSH wrapper。然後覆寫 Skill 以允許 Linux，讓它保持符合資格。

    1. 為二進位檔建立 SSH wrapper（範例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 將 wrapper 放在 Linux 主機上的 `PATH` 中（例如 `~/bin/memo`）。
    3. 覆寫 Skill metadata（工作區或 `~/.openclaw/skills`）以允許 Linux：

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
    - **瀏覽器自動化：** 不需要程式碼也能運作，但較慢且較脆弱。

    如果你想為每個客戶保留情境（代理商工作流程），一個簡單模式是：

    - 每個客戶一個 Notion 頁面（情境 + 偏好設定 + 進行中的工作）。
    - 要求代理在工作階段開始時擷取該頁面。

    如果你想要原生整合，請開啟功能請求，或建置一個針對那些 API 的 Skill。

    安裝 Skills：

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生安裝會落在作用中工作區的 `skills/` 目錄。若要在代理之間共用 Skills，請將它們放在 `~/.openclaw/skills/<name>/SKILL.md`。如果只有部分代理應看到共用安裝，請設定 `agents.defaults.skills` 或 `agents.list[].skills`。有些 Skills 預期透過 Homebrew 安裝二進位檔；在 Linux 上，這表示 Linuxbrew（請參閱上方的 Homebrew Linux FAQ 項目）。請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config) 和 [ClawHub](/zh-TW/tools/clawhub)。

  </Accordion>

  <Accordion title="如何搭配 OpenClaw 使用我現有已登入的 Chrome？">
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

    這條路徑可以使用本機主機瀏覽器或已連線的瀏覽器 Node。如果 Gateway 在其他地方執行，請在瀏覽器機器上執行 Node 主機，或改用遠端 CDP。

    `existing-session` / `user` 目前的限制：

    - 動作是 ref 驅動，而不是 CSS-selector 驅動
    - 上傳需要 `ref` / `inputRef`，且目前一次支援一個檔案
    - `responsebody`、PDF 匯出、下載攔截和批次動作仍需要受管理的瀏覽器或原始 CDP 設定檔

  </Accordion>
</AccordionGroup>

## 沙箱與記憶體

<AccordionGroup>
  <Accordion title="有專門的沙箱文件嗎？">
    有。請參閱[沙箱](/zh-TW/gateway/sandboxing)。若需 Docker 專用設定（Docker 中的完整 Gateway 或沙箱映像），請參閱 [Docker](/zh-TW/install/docker)。
  </Accordion>

  <Accordion title="Docker 感覺受限 - 如何啟用完整功能？">
    預設映像以安全優先，並以 `node` 使用者執行，因此不包含
    系統套件、Homebrew 或隨附的瀏覽器。若要更完整的設定：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，讓快取保留下來。
    - 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 將系統相依套件烘焙進映像。
    - 透過隨附的 CLI 安裝 Playwright 瀏覽器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 設定 `PLAYWRIGHT_BROWSERS_PATH`，並確保該路徑會被持久化。

    文件：[Docker](/zh-TW/install/docker)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="我可以讓 DM 保持個人使用，但用同一個代理讓群組公開/沙箱化嗎？">
    可以 - 如果你的私人流量是 **DM**，而公開流量是 **群組**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，讓群組/頻道工作階段（非主要 key）在設定的沙箱後端中執行，而主要 DM 工作階段保持在主機上。如果你未選擇後端，Docker 是預設後端。接著透過 `tools.sandbox.tools` 限制沙箱化工作階段中可用的工具。

    設定逐步說明 + 範例設定：[群組：個人 DM + 公開群組](/zh-TW/channels/groups#pattern-personal-dms-public-groups-single-agent)

    重要設定參考：[Gateway 設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何將主機資料夾繫結到沙箱？">
    將 `agents.defaults.sandbox.docker.binds` 設為 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全域與每個代理的 binds 會合併；當 `scope: "shared"` 時，會忽略每個代理的 binds。對任何敏感內容使用 `:ro`，並記住 binds 會繞過沙箱檔案系統邊界。

    OpenClaw 會同時根據標準化路徑，以及透過最深層既有祖先解析出的正規路徑，驗證 bind 來源。這表示即使最後一段路徑尚不存在，透過符號連結父層逃逸仍會關閉失敗；而且在符號連結解析後，允許根目錄檢查仍會套用。

    請參閱[沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts)和[沙箱 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)，了解範例與安全注意事項。

  </Accordion>

  <Accordion title="記憶體如何運作？">
    OpenClaw 記憶體只是代理工作區中的 Markdown 檔案：

    - `memory/YYYY-MM-DD.md` 中的每日筆記
    - `MEMORY.md` 中經整理的長期筆記（僅限主要/私人工作階段）

    OpenClaw 也會執行 **靜默的預先 Compaction 記憶體 flush**，提醒模型在自動 Compaction 前寫入持久筆記。這只會在工作區可寫入時執行（唯讀沙箱會略過）。請參閱[記憶體](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="記憶體一直忘記事情。如何讓它記住？">
    要求 bot **將事實寫入記憶體**。長期筆記應放在 `MEMORY.md`，
    短期情境則放入 `memory/YYYY-MM-DD.md`。

    這仍是我們正在改善的領域。提醒模型儲存記憶會有幫助；
    它會知道該怎麼做。如果它持續忘記，請確認 Gateway 在每次執行時都使用相同的
    工作區。

    文件：[記憶體](/zh-TW/concepts/memory)、[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="記憶體會永遠保留嗎？限制是什麼？">
    記憶體檔案存放在磁碟上，會持續存在直到你刪除它們。限制是你的
    儲存空間，而不是模型。**工作階段情境** 仍受模型
    情境視窗限制，因此長對話可能會 compact 或截斷。這就是為什麼
    記憶體搜尋存在 - 它只會將相關部分拉回情境中。

    文件：[記憶體](/zh-TW/concepts/memory)、[情境](/zh-TW/concepts/context)。

  </Accordion>

  <Accordion title="語意記憶搜尋需要 OpenAI API 金鑰嗎？">
    只有在使用 **OpenAI embeddings** 時才需要。Codex OAuth 涵蓋 chat/completions，
    且**不**授予 embeddings 存取權，因此**使用 Codex 登入（OAuth 或
    Codex CLI 登入）**對語意記憶搜尋沒有幫助。OpenAI embeddings
    仍需要真正的 API 金鑰（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你沒有明確設定提供者，OpenClaw 會在能解析出 API 金鑰時自動選擇提供者
    （驗證設定檔、`models.providers.*.apiKey` 或環境變數）。
    如果能解析出 OpenAI 金鑰，會優先使用 OpenAI；否則若能解析出 Gemini 金鑰，
    則使用 Gemini，接著是 Voyage，再來是 Mistral。如果沒有可用的遠端金鑰，
    記憶搜尋會保持停用，直到你完成設定。如果你已設定且存在本機模型路徑，
    OpenClaw
    會優先使用 `local`。明確設定
    `memorySearch.provider = "ollama"` 時支援 Ollama。

    如果你偏好維持在本機，請設定 `memorySearch.provider = "local"`（並可選擇性設定
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，請設定
    `memorySearch.provider = "gemini"` 並提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我們支援 **OpenAI、Gemini、Voyage、Mistral、Ollama 或 local** embedding
    模型 - 設定細節請參閱[記憶](/zh-TW/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 內容在磁碟上的位置

<AccordionGroup>
  <Accordion title="OpenClaw 使用的所有資料都會儲存在本機嗎？">
    不會 - **OpenClaw 的狀態是本機的**，但**外部服務仍會看到你傳送給它們的內容**。

    - **預設在本機：**工作階段、記憶檔案、設定和工作區都位於 Gateway 主機
      （`~/.openclaw` + 你的工作區目錄）。
    - **必要時在遠端：**你傳送給模型提供者（Anthropic/OpenAI/等）的訊息會送到
      它們的 API，而聊天平台（WhatsApp/Telegram/Slack/等）會將訊息資料儲存在它們的
      伺服器上。
    - **你掌控足跡：**使用本機模型會讓提示保留在你的機器上，但通道
      流量仍會經過該通道的伺服器。

    相關：[代理工作區](/zh-TW/concepts/agent-workspace)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 將資料儲存在哪裡？">
    所有內容都位於 `$OPENCLAW_STATE_DIR` 底下（預設：`~/.openclaw`）：

    | 路徑                                                            | 用途                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主要設定（JSON5）                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 舊版 OAuth 匯入（首次使用時複製到驗證設定檔）       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 驗證設定檔（OAuth、API 金鑰，以及選用的 `keyRef`/`tokenRef`）  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供者的選用檔案式祕密承載資料 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 舊版相容性檔案（靜態 `api_key` 項目已清除）      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供者狀態（例如 `whatsapp/<accountId>/creds.json`）            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每個代理的狀態（agentDir + 工作階段）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 對話歷史與狀態（每個代理）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 工作階段中繼資料（每個代理）                                       |

    舊版單代理路徑：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）。

    你的**工作區**（AGENTS.md、記憶檔案、skills 等）是分開的，並透過 `agents.defaults.workspace` 設定（預設：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 應該放在哪裡？">
    這些檔案位於**代理工作區**，而不是 `~/.openclaw`。

    - **工作區（每個代理）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、選用的 `HEARTBEAT.md`。
      小寫根目錄 `memory.md` 只是舊版修復輸入；當兩個檔案都存在時，`openclaw doctor --fix`
      可以將它合併到 `MEMORY.md`。
    - **狀態目錄（`~/.openclaw`）**：設定、通道/提供者狀態、驗證設定檔、工作階段、記錄，
      以及共用 skills（`~/.openclaw/skills`）。

    預設工作區是 `~/.openclaw/workspace`，可透過以下方式設定：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果機器人在重新啟動後「忘記」內容，請確認 Gateway 在每次啟動時都使用相同的
    工作區（並記住：遠端模式使用的是 **gateway 主機的**
    工作區，而不是你的本機筆電）。

    提示：如果你想保留持久的行為或偏好，請要求機器人**將它寫入
    AGENTS.md 或 MEMORY.md**，而不是依賴聊天歷史。

    請參閱[代理工作區](/zh-TW/concepts/agent-workspace)和[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="建議的備份策略">
    將你的**代理工作區**放在**私人** git 儲存庫中，並備份到私人位置
    （例如 GitHub private）。這會保留記憶 + AGENTS/SOUL/USER
    檔案，並讓你之後還原助理的「心智」。

    **不要**提交 `~/.openclaw` 底下的任何內容（憑證、工作階段、token 或加密祕密承載資料）。
    如果你需要完整還原，請分別備份工作區和狀態目錄
    （請參閱上方的遷移問題）。

    文件：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完全解除安裝 OpenClaw？">
    請參閱專門指南：[解除安裝](/zh-TW/install/uninstall)。
  </Accordion>

  <Accordion title="代理可以在工作區之外工作嗎？">
    可以。工作區是**預設 cwd** 和記憶錨點，不是硬性沙盒。
    相對路徑會在工作區內解析，但除非啟用沙盒，否則絕對路徑可以存取其他
    主機位置。如果你需要隔離，請使用
    [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing) 或每個代理的沙盒設定。如果你
    想讓某個儲存庫成為預設工作目錄，請將該代理的
    `workspace` 指向儲存庫根目錄。OpenClaw 儲存庫只是原始碼；除非你刻意想讓代理在其中工作，
    否則請將
    工作區分開。

    範例（將儲存庫作為預設 cwd）：

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
    工作階段狀態由 **gateway 主機**擁有。如果你處於遠端模式，你在意的工作階段儲存區位於遠端機器上，而不是你的本機筆電。請參閱[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>
</AccordionGroup>

## 設定基礎

<AccordionGroup>
  <Accordion title="設定格式是什麼？在哪裡？">
    OpenClaw 會從 `$OPENCLAW_CONFIG_PATH` 讀取選用的 **JSON5** 設定（預設：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果檔案不存在，會使用相對安全的預設值（包括預設工作區 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我設定了 gateway.bind: "lan"（或 "tailnet"），現在沒有任何服務監聽 / UI 顯示未授權'>
    非 loopback 綁定**需要有效的 gateway 驗證路徑**。實務上這表示：

    - shared-secret 驗證：token 或密碼
    - `gateway.auth.mode: "trusted-proxy"` 位於正確設定的具身分感知反向代理後方

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

    注意事項：

    - `gateway.remote.token` / `.password` 本身**不會**啟用本機 gateway 驗證。
    - 只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才能使用 `gateway.remote.*` 作為備援。
    - 若使用密碼驗證，請改為設定 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 已透過 SecretRef 明確設定但無法解析，解析會安全失敗關閉（沒有遠端備援遮蔽）。
    - Shared-secret Control UI 設定會透過 `connect.params.auth.token` 或 `connect.params.auth.password`（儲存在應用程式/UI 設定中）驗證。帶有身分的模式，例如 Tailscale Serve 或 `trusted-proxy`，則使用請求標頭。避免將共用祕密放在 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 時，同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，且 `gateway.trustedProxies` 中需要有 loopback 項目。

  </Accordion>

  <Accordion title="為什麼現在 localhost 也需要 token？">
    OpenClaw 預設強制執行 gateway 驗證，包括 loopback。在一般預設路徑中，這表示 token 驗證：如果沒有明確設定驗證路徑，gateway 啟動會解析為 token 模式並自動產生一個，將它儲存到 `gateway.auth.token`，因此**本機 WS 用戶端必須驗證**。這會阻止其他本機程序呼叫 Gateway。

    如果你偏好不同的驗證路徑，可以明確選擇密碼模式（或針對具身分感知的反向代理使用 `trusted-proxy`）。如果你**真的**想開放 loopback，請在設定中明確設定 `gateway.auth.mode: "none"`。Doctor 可以隨時為你產生 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="變更設定後需要重新啟動嗎？">
    Gateway 會監看設定並支援熱重新載入：

    - `gateway.reload.mode: "hybrid"`（預設）：熱套用安全變更，對關鍵變更重新啟動
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
    - `random`：輪換有趣/季節性標語（預設行為）。
    - 如果你完全不想顯示橫幅，請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何啟用網頁搜尋（和網頁擷取）？">
    `web_fetch` 不需要 API 金鑰即可運作。`web_search` 取決於你選擇的
    提供者：

    - API 支援的提供者，例如 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Perplexity 和 Tavily，需要依其一般方式設定 API 金鑰。
    - Ollama Web Search 不需要金鑰，但會使用你設定的 Ollama 主機，且需要 `ollama signin`。
    - DuckDuckGo 不需要金鑰，但它是非官方的 HTML 型整合。
    - SearXNG 不需要金鑰/可自託管；請設定 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **建議：**執行 `openclaw configure --section web` 並選擇提供者。
    環境替代項：

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

    供應商專屬的網頁搜尋設定現在位於 `plugins.entries.<plugin>.config.webSearch.*` 底下。
    舊版 `tools.web.search.*` 供應商路徑仍會暫時載入以維持相容性，但不應用於新的設定。
    Firecrawl 網頁擷取後備設定位於 `plugins.entries.firecrawl.config.webFetch.*` 底下。

    注意事項：

    - 如果你使用允許清單，請加入 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 預設已啟用（除非明確停用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 會從可用憑證自動偵測第一個就緒的擷取後備供應商。目前內建供應商是 Firecrawl。
    - Daemon 會從 `~/.openclaw/.env`（或服務環境）讀取環境變數。

    文件：[網頁工具](/zh-TW/tools/web)。

  </Accordion>

  <Accordion title="`config.apply` 清除了我的設定。我要如何復原並避免這種情況？">
    `config.apply` 會取代**整個設定**。如果你送出部分物件，其他所有內容都會被移除。

    目前的 OpenClaw 可防護許多意外覆寫：

    - OpenClaw 擁有的設定寫入會在寫入前驗證變更後的完整設定。
    - 無效或具破壞性的 OpenClaw 擁有寫入會被拒絕，並另存為 `openclaw.json.rejected.*`。
    - 如果直接編輯導致啟動或熱重新載入失敗，Gateway 會安全關閉或略過重新載入；它不會重寫 `openclaw.json`。
    - `openclaw doctor --fix` 負責修復，並可還原最後已知良好版本，同時將被拒絕的檔案另存為 `openclaw.json.clobbered.*`。

    復原：

    - 檢查 `openclaw logs --follow` 中是否有 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 檢查作用中設定旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 執行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 只用 `openclaw config set` 或 `config.patch` 複製預期的鍵回去。
    - 如果你沒有最後已知良好版本或被拒絕的承載資料，請從備份還原，或重新執行 `openclaw doctor` 並重新設定頻道/模型。
    - 如果這出乎預期，請提交錯誤報告，並附上你最後已知的設定或任何備份。
    - 本機編碼代理通常可以從記錄或歷史重新建構可運作的設定。

    避免方式：

    - 小幅變更請使用 `openclaw config set`。
    - 互動式編輯請使用 `openclaw configure`。
    - 當你不確定確切路徑或欄位形狀時，請先使用 `config.schema.lookup`；它會傳回淺層結構描述節點，加上可向下查看的直接子項摘要。
    - 部分 RPC 編輯請使用 `config.patch`；`config.apply` 只保留給完整設定取代。
    - 如果你是在代理執行中使用僅限擁有者的 `gateway` 工具，它仍會拒絕寫入 `tools.exec.ask` / `tools.exec.security`（包括會正規化為相同受保護執行路徑的舊版 `tools.bash.*` 別名）。

    文件：[設定](/zh-TW/cli/config)、[設定精靈](/zh-TW/cli/configure)、[Gateway 疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="我要如何執行一個中央 Gateway，並讓專門的工作節點跨裝置運作？">
    常見模式是**一個 Gateway**（例如 Raspberry Pi）加上**節點**與**代理**：

    - **Gateway（中央）：** 擁有頻道（Signal/WhatsApp）、路由與工作階段。
    - **節點（裝置）：** Macs/iOS/Android 會以周邊裝置連線，並公開本機工具（`system.run`、`canvas`、`camera`）。
    - **代理（工作者）：** 為特殊角色使用分離的大腦/工作區（例如「Hetzner 維運」、「個人資料」）。
    - **子代理：** 當你需要平行處理時，從主代理產生背景工作。
    - **TUI：** 連線到 Gateway，並切換代理/工作階段。

    文件：[節點](/zh-TW/nodes)、[遠端存取](/zh-TW/gateway/remote)、[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[TUI](/zh-TW/web/tui)。

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

    預設值是 `false`（有介面）。Headless 在某些網站上較可能觸發反機器人檢查。請參閱[瀏覽器](/zh-TW/tools/browser)。

    Headless 使用**相同的 Chromium 引擎**，並適用於大多數自動化（表單、點擊、擷取、登入）。主要差異如下：

    - 沒有可見的瀏覽器視窗（如果你需要視覺畫面，請使用截圖）。
    - 有些網站對 headless 模式中的自動化更嚴格（CAPTCHA、反機器人）。
      例如，X/Twitter 經常封鎖 headless 工作階段。

  </Accordion>

  <Accordion title="我要如何使用 Brave 進行瀏覽器控制？">
    將 `browser.executablePath` 設為你的 Brave 二進位檔（或任何 Chromium 架構瀏覽器），然後重新啟動 Gateway。
    請參閱[瀏覽器](/zh-TW/tools/browser#use-brave-or-another-chromium-based-browser)中的完整設定範例。
  </Accordion>
</AccordionGroup>

## 遠端 Gateway 與節點

<AccordionGroup>
  <Accordion title="指令如何在 Telegram、gateway 與節點之間傳遞？">
    Telegram 訊息由 **gateway** 處理。gateway 會執行代理，只有在需要節點工具時才透過 **Gateway WebSocket** 呼叫節點：

    Telegram → Gateway → 代理 → `node.*` → 節點 → Gateway → Telegram

    節點看不到傳入的供應商流量；它們只會接收節點 RPC 呼叫。

  </Accordion>

  <Accordion title="如果 Gateway 託管在遠端，我的代理要如何存取我的電腦？">
    簡短答案：**將你的電腦配對為節點**。Gateway 在其他地方執行，但它可以透過 Gateway WebSocket 在你的本機電腦上呼叫 `node.*` 工具（螢幕、相機、系統）。

    典型設定：

    1. 在常時開機的主機（VPS/家用伺服器）上執行 Gateway。
    2. 將 Gateway 主機和你的電腦放在同一個 tailnet 上。
    3. 確認 Gateway WS 可連線（tailnet 綁定或 SSH 通道）。
    4. 在本機開啟 macOS app，並以**透過 SSH 遠端**模式（或直接 tailnet）連線，
       讓它可以註冊為節點。
    5. 在 Gateway 上核准節點：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要另外的 TCP 橋接；節點會透過 Gateway WebSocket 連線。

    安全提醒：配對 macOS 節點會允許在該機器上執行 `system.run`。只配對你信任的裝置，並檢閱[安全性](/zh-TW/gateway/security)。

    文件：[節點](/zh-TW/nodes)、[Gateway 協定](/zh-TW/gateway/protocol)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已連線，但我沒有收到回覆。現在怎麼辦？">
    檢查基本項目：

    - Gateway 正在執行：`openclaw gateway status`
    - Gateway 健康狀態：`openclaw status`
    - 頻道健康狀態：`openclaw channels status`

    接著驗證驗證與路由：

    - 如果你使用 Tailscale Serve，請確認 `gateway.auth.allowTailscale` 已正確設定。
    - 如果你透過 SSH 通道連線，請確認本機通道已啟動，並指向正確的連接埠。
    - 確認你的允許清單（私訊或群組）包含你的帳號。

    文件：[Tailscale](/zh-TW/gateway/tailscale)、[遠端存取](/zh-TW/gateway/remote)、[頻道](/zh-TW/channels)。

  </Accordion>

  <Accordion title="兩個 OpenClaw 執行個體可以彼此通訊嗎（本機 + VPS）？">
    可以。沒有內建的「機器人對機器人」橋接，但你可以用幾種可靠方式串接：

    **最簡單：** 使用兩個機器人都能存取的一般聊天頻道（Telegram/Slack/WhatsApp）。
    讓機器人 A 傳送訊息給機器人 B，然後讓機器人 B 照常回覆。

    **CLI 橋接（通用）：** 執行一個指令碼，使用 `openclaw agent --message ... --deliver` 呼叫另一個 Gateway，
    目標是一個另一個機器人會監聽的聊天。如果其中一個機器人在遠端 VPS 上，請透過 SSH/Tailscale 將你的 CLI 指向該遠端 Gateway
    （請參閱[遠端存取](/zh-TW/gateway/remote)）。

    範例模式（從可連到目標 Gateway 的機器執行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加入防護措施，避免兩個機器人無止境循環（僅提及、頻道允許清單，或「不要回覆機器人訊息」規則）。

    文件：[遠端存取](/zh-TW/gateway/remote)、[代理 CLI](/zh-TW/cli/agent)、[代理傳送](/zh-TW/tools/agent-send)。

  </Accordion>

  <Accordion title="多個代理需要分開的 VPS 嗎？">
    不需要。一個 Gateway 可以託管多個代理，每個代理都有自己的工作區、模型預設值與路由。這是正常設定，而且比每個代理執行一台 VPS 便宜且簡單得多。

    只有在你需要強隔離（安全邊界）或非常不同且不想共用的設定時，才使用分開的 VPS。否則，保留一個 Gateway，並使用多個代理或子代理。

  </Accordion>

  <Accordion title="相較於從 VPS 使用 SSH，在我的個人筆電上使用節點有好處嗎？">
    有，節點是從遠端 Gateway 存取你筆電的一級方式，而且能解鎖的不只是 shell 存取。Gateway 可在 macOS/Linux（Windows 透過 WSL2）上執行，且相當輕量（一台小型 VPS 或 Raspberry Pi 等級機器即可；4 GB RAM 很充足），因此常見設定是常時開機的主機加上作為節點的筆電。

    - **不需要傳入 SSH。** 節點會向外連到 Gateway WebSocket，並使用裝置配對。
    - **更安全的執行控制。** `system.run` 會受到該筆電上的節點允許清單/核准控管。
    - **更多裝置工具。** 除了 `system.run`，節點還會公開 `canvas`、`camera` 和 `screen`。
    - **本機瀏覽器自動化。** 讓 Gateway 留在 VPS 上，但透過筆電上的節點主機在本機執行 Chrome，或透過 Chrome MCP 連接到主機上的本機 Chrome。

    SSH 適合臨時 shell 存取，但節點對持續的代理工作流程與裝置自動化更簡單。

    文件：[節點](/zh-TW/nodes)、[節點 CLI](/zh-TW/cli/nodes)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="節點會執行 gateway 服務嗎？">
    不會。除非你有意執行隔離設定檔（請參閱[多個 gateway](/zh-TW/gateway/multiple-gateways)），否則每台主機只應執行**一個 gateway**。節點是連到 gateway 的周邊裝置（iOS/Android 節點，或選單列 app 中的 macOS「節點模式」）。對於 headless 節點
    主機與 CLI 控制，請參閱[節點主機 CLI](/zh-TW/cli/node)。

    `gateway`、`discovery` 和 `canvasHost` 變更需要完整重新啟動。

  </Accordion>

  <Accordion title="是否有 API / RPC 方式套用設定？">
    有。

    - `config.schema.lookup`：在寫入前檢查一個設定子樹，包含其淺層結構描述節點、相符的 UI 提示，以及直接子項摘要
    - `config.get`：擷取目前快照 + 雜湊
    - `config.patch`：安全的部分更新（建議用於大多數 RPC 編輯）；可行時會熱重新載入，必要時會重新啟動
    - `config.apply`：驗證 + 取代完整設定；可行時會熱重新載入，必要時會重新啟動
    - 僅限擁有者的 `gateway` 執行階段工具仍會拒絕重寫 `tools.exec.ask` / `tools.exec.security`；舊版 `tools.bash.*` 別名會正規化為相同受保護的執行路徑

  </Accordion>

  <Accordion title="首次安裝的最小合理設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    這會設定你的工作區，並限制誰可以觸發 bot。

  </Accordion>

  <Accordion title="如何在 VPS 上設定 Tailscale，並從我的 Mac 連線？">
    最小步驟：

    1. **在 VPS 上安裝並登入**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安裝並登入**
       - 使用 Tailscale App，並登入同一個 tailnet。
    3. **啟用 MagicDNS（建議）**
       - 在 Tailscale 管理主控台中啟用 MagicDNS，讓 VPS 擁有穩定名稱。
    4. **使用 tailnet 主機名稱**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情況下使用 Control UI，請在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    這會讓 gateway 綁定到 loopback，並透過 Tailscale 公開 HTTPS。請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何將 Mac node 連到遠端 Gateway（Tailscale Serve）？">
    Serve 會公開 **Gateway Control UI + WS**。Nodes 會透過同一個 Gateway WS 端點連線。

    建議設定：

    1. **確認 VPS + Mac 位於同一個 tailnet**。
    2. **以 Remote 模式使用 macOS App**（SSH 目標可以是 tailnet 主機名稱）。
       App 會建立 Gateway 連接埠通道，並以 node 身分連線。
    3. **在 gateway 上核准 node**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文件：[Gateway protocol](/zh-TW/gateway/protocol)、[探索](/zh-TW/gateway/discovery)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我應該安裝在第二台筆電上，還是只要新增 node？">
    如果你只需要第二台筆電上的 **local 工具**（螢幕/相機/exec），請將它新增為
    **node**。這會維持單一 Gateway，並避免重複設定。Local node 工具目前僅支援
    macOS，但我們計畫將它們擴展到其他作業系統。

    只有在你需要 **強隔離** 或兩個完全獨立的 bot 時，才安裝第二個 Gateway。

    文件：[Nodes](/zh-TW/nodes)、[Nodes CLI](/zh-TW/cli/nodes)、[多個 gateway](/zh-TW/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境變數與 .env 載入

<AccordionGroup>
  <Accordion title="OpenClaw 如何載入環境變數？">
    OpenClaw 會從父程序（shell、launchd/systemd、CI 等）讀取環境變數，並額外載入：

    - 目前工作目錄中的 `.env`
    - 來自 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`）的全域備援 `.env`

    兩個 `.env` 檔案都不會覆寫既有環境變數。

    你也可以在設定中定義行內環境變數（只有在 process env 缺少時才會套用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完整優先順序和來源請參閱 [/environment](/zh-TW/help/environment)。

  </Accordion>

  <Accordion title="我透過服務啟動 Gateway，但我的環境變數消失了。現在怎麼辦？">
    兩個常見修正：

    1. 將缺少的金鑰放在 `~/.openclaw/.env`，這樣即使服務沒有繼承你的 shell env，也能被讀取。
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

  <Accordion title='我設定了 COPILOT_GITHUB_TOKEN，但 models status 顯示「Shell env: off.」。為什麼？'>
    `openclaw models status` 會報告是否已啟用 **shell env 匯入**。「Shell env: off」
    **不**代表你的環境變數缺失，只代表 OpenClaw 不會自動載入
    你的登入 shell。

    如果 Gateway 以服務（launchd/systemd）執行，它不會繼承你的 shell
    環境。請用下列其中一種方式修正：

    1. 將 token 放在 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或啟用 shell 匯入（`env.shellEnv.enabled: true`）。
    3. 或將它加入設定的 `env` 區塊（只有在缺少時才套用）。

    接著重新啟動 gateway 並重新檢查：

    ```bash
    openclaw models status
    ```

    Copilot tokens 會從 `COPILOT_GITHUB_TOKEN` 讀取（也支援 `GH_TOKEN` / `GITHUB_TOKEN`）。
    請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers) 和 [/environment](/zh-TW/help/environment)。

  </Accordion>
</AccordionGroup>

## 工作階段與多個聊天

<AccordionGroup>
  <Accordion title="如何開始全新的對話？">
    傳送 `/new` 或 `/reset` 作為獨立訊息。請參閱 [工作階段管理](/zh-TW/concepts/session)。
  </Accordion>

  <Accordion title="如果我從未傳送 /new，工作階段會自動重設嗎？">
    工作階段可以在 `session.idleMinutes` 之後過期，但這項功能**預設停用**（預設為 **0**）。
    將它設為正值即可啟用閒置過期。啟用後，閒置期間結束後的**下一則**
    訊息會為該聊天鍵開始新的 session id。
    這不會刪除 transcripts，只是開始新的工作階段。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有辦法建立一組 OpenClaw instances 團隊（一個 CEO 和多個 agents）嗎？">
    可以，透過 **multi-agent routing** 和 **sub-agents**。你可以建立一個協調器
    agent，以及數個擁有各自工作區和模型的 worker agents。

    不過，這最好被視為一個**有趣的實驗**。它會大量消耗 token，而且通常
    比使用一個 bot 搭配不同工作階段更沒效率。我們設想的典型模型是你與一個
    bot 對話，並使用不同工作階段進行平行工作。該 bot 也能在需要時產生 sub-agents。

    文件：[Multi-agent routing](/zh-TW/concepts/multi-agent)、[Sub-agents](/zh-TW/tools/subagents)、[Agents CLI](/zh-TW/cli/agents)。

  </Accordion>

  <Accordion title="為什麼 context 會在任務中途被截斷？如何避免？">
    Session context 受限於模型視窗。長對話、大型工具輸出，或大量
    檔案都可能觸發 compaction 或截斷。

    有幫助的做法：

    - 要求 bot 摘要目前狀態並寫入檔案。
    - 在長任務前使用 `/compact`，切換主題時使用 `/new`。
    - 將重要 context 保留在工作區，並要求 bot 讀回。
    - 對長時間或平行工作使用 sub-agents，讓主聊天保持較小。
    - 如果這種情況經常發生，請選擇 context window 較大的模型。

  </Accordion>

  <Accordion title="如何完整重設 OpenClaw，但保留安裝？">
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

    - 如果 Onboarding 偵測到既有設定，也會提供 **Reset**。請參閱 [Onboarding（CLI）](/zh-TW/start/wizard)。
    - 如果你使用 profiles（`--profile` / `OPENCLAW_PROFILE`），請重設每個 state dir（預設為 `~/.openclaw-<profile>`）。
    - Dev reset：`openclaw gateway --dev --reset`（僅限 dev；會清除 dev config + credentials + sessions + workspace）。

  </Accordion>

  <Accordion title='我收到「context too large」錯誤，該如何 reset 或 compact？'>
    使用下列其中一項：

    - **Compact**（保留對話，但摘要較舊的回合）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 引導摘要。

    - **Reset**（針對同一個聊天鍵建立新的 session ID）：

      ```
      /new
      /reset
      ```

    如果持續發生：

    - 啟用或調整 **session pruning**（`agents.defaults.contextPruning`）以修剪舊工具輸出。
    - 使用 context window 較大的模型。

    文件：[Compaction](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title='為什麼我會看到「LLM request rejected: messages.content.tool_use.input field required」？'>
    這是 provider 驗證錯誤：模型送出了缺少必要
    `input` 的 `tool_use` 區塊。這通常代表 session history 已過時或毀損（常見於長 threads
    或工具/schema 變更之後）。

    修正：使用 `/new`（獨立訊息）開始新的工作階段。

  </Accordion>

  <Accordion title="為什麼我每 30 分鐘會收到 heartbeat 訊息？">
    Heartbeats 預設每 **30m** 執行一次（使用 OAuth auth 時為 **1h**）。調整或停用它們：

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

    如果 `HEARTBEAT.md` 存在但實際上為空（只有空白行和 markdown
    標題，例如 `# Heading`），OpenClaw 會跳過 heartbeat 執行以節省 API 呼叫。
    如果檔案不存在，heartbeat 仍會執行，並由模型決定要做什麼。

    每個 agent 的覆寫使用 `agents.list[].heartbeat`。文件：[Heartbeat](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要將「bot account」加入 WhatsApp 群組嗎？'>
    不需要。OpenClaw 會在**你自己的帳號**上執行，所以如果你在群組中，OpenClaw 就能看見它。
    預設情況下，群組回覆會被封鎖，直到你允許寄件者（`groupPolicy: "allowlist"`）。

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
    選項 1（最快）：追蹤 logs，並在群組中傳送測試訊息：

    ```bash
    openclaw logs --follow --json
    ```

    尋找以 `@g.us` 結尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    選項 2（如果已設定/已 allowlist）：從設定列出群組：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[Directory](/zh-TW/cli/directory)、[Logs](/zh-TW/cli/logs)。

  </Accordion>

  <Accordion title="為什麼 OpenClaw 不在群組中回覆？">
    兩個常見原因：

    - Mention gating 已開啟（預設）。你必須 @mention bot（或符合 `mentionPatterns`）。
    - 你設定了 `channels.whatsapp.groups`，但沒有設定 `"*"`，且該群組不在 allowlist 中。

    請參閱 [群組](/zh-TW/channels/groups) 和 [群組訊息](/zh-TW/channels/group-messages)。

  </Accordion>

  <Accordion title="群組/threads 會與 DMs 共用 context 嗎？">
    Direct chats 預設會摺疊到主要工作階段。Groups/channels 有自己的 session keys，而 Telegram topics / Discord threads 是獨立的工作階段。請參閱 [群組](/zh-TW/channels/groups) 和 [群組訊息](/zh-TW/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以建立多少個工作區和 agents？">
    沒有硬性限制。數十個（甚至數百個）都可以，但請注意：

    - **磁碟成長：** sessions + transcripts 位於 `~/.openclaw/agents/<agentId>/sessions/` 底下。
    - **Token 成本：** 更多 agents 代表更多並行模型使用量。
    - **維運負擔：** 每個 agent 的 auth profiles、workspaces 和 channel routing。

    提示：

    - 每個 agent 保留一個**有效**工作區（`agents.defaults.workspace`）。
    - 如果磁碟成長，請修剪舊 sessions（刪除 JSONL 或 store entries）。
    - 使用 `openclaw doctor` 找出多餘工作區和 profile 不相符。

  </Accordion>

  <Accordion title="我可以同時執行多個機器人或聊天（Slack）嗎？該如何設定？">
    可以。使用**多代理路由**來執行多個隔離的代理，並依
    頻道/帳戶/對等端路由傳入訊息。Slack 支援作為頻道，且可繫結到特定代理。

    瀏覽器存取很強大，但不是「人類能做什麼就能做什麼」- 反機器人、CAPTCHA 和 MFA
    仍可能阻擋自動化。若要最可靠地控制瀏覽器，請在主機上使用本機 Chrome MCP，
    或在實際執行瀏覽器的機器上使用 CDP。

    最佳實務設定：

    - 永遠在線的 Gateway 主機（VPS/Mac mini）。
    - 每個角色一個代理（繫結）。
    - Slack 頻道繫結到那些代理。
    - 需要時透過 Chrome MCP 或 Node 使用本機瀏覽器。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[Slack](/zh-TW/channels/slack)、
    [瀏覽器](/zh-TW/tools/browser)、[Nodes](/zh-TW/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、容錯移轉與驗證設定檔

模型問答 - 預設值、選擇、別名、切換、容錯移轉、驗證設定檔 -
位於[模型常見問題](/zh-TW/help/faq-models)。

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
    因為「running」是**監督程式**的視角（launchd/systemd/schtasks）。連線探測則是 CLI 實際連線到 Gateway WebSocket。

    使用 `openclaw gateway status`，並信任這些行：

    - `Probe target:`（探測實際使用的 URL）
    - `Listening:`（連接埠上實際繫結的內容）
    - `Last gateway error:`（程序還活著但連接埠沒有監聽時的常見根本原因）

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示的「Config (cli)」和「Config (service)」不同？'>
    你正在編輯一個設定檔，但服務正在使用另一個設定檔執行（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不相符）。

    修正：

    ```bash
    openclaw gateway install --force
    ```

    請從你想讓服務使用的同一個 `--profile` / 環境執行該命令。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」是什麼意思？'>
    OpenClaw 會在啟動時立即繫結 WebSocket 監聽器（預設 `ws://127.0.0.1:18789`）以強制執行執行階段鎖定。如果繫結因 `EADDRINUSE` 失敗，它會拋出 `GatewayLockError`，表示另一個執行個體已在監聽。

    修正：停止另一個執行個體、釋放連接埠，或使用 `openclaw gateway --port <port>` 執行。

  </Accordion>

  <Accordion title="如何以遠端模式執行 OpenClaw（用戶端連線到其他地方的 Gateway）？">
    設定 `gateway.mode: "remote"`，並指向遠端 WebSocket URL，可選擇搭配共享祕密遠端憑證：

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
    - macOS 應用程式會監看設定檔，並在這些值變更時即時切換模式。
    - `gateway.remote.token` / `.password` 只是用戶端的遠端憑證；它們本身不會啟用本機 Gateway 驗證。

  </Accordion>

  <Accordion title='Control UI 顯示「unauthorized」（或持續重新連線）。現在該怎麼辦？'>
    你的 Gateway 驗證路徑與 UI 的驗證方法不相符。

    事實（來自程式碼）：

    - Control UI 會針對目前瀏覽器分頁工作階段和所選 Gateway URL，將權杖保存在 `sessionStorage`，因此同一分頁重新整理可繼續運作，而不會恢復長期存在的 localStorage 權杖持久化。
    - 發生 `AUTH_TOKEN_MISMATCH` 時，當 Gateway 傳回重試提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`），受信任用戶端可以使用快取的裝置權杖嘗試一次有界限的重試。
    - 該快取權杖重試現在會重用與裝置權杖一起儲存的快取已核准範圍。明確的 `deviceToken` / 明確的 `scopes` 呼叫者仍會保留其要求的範圍集合，而不是繼承快取範圍。
    - 在該重試路徑之外，連線驗證優先順序是先明確共享權杖/密碼，接著是明確 `deviceToken`，再來是已儲存的裝置權杖，最後是啟動權杖。
    - 啟動權杖範圍檢查具有角色前綴。內建啟動操作員允許清單只滿足操作員要求；Node 或其他非操作員角色仍需要其自身角色前綴下的範圍。

    修正：

    - 最快：`openclaw dashboard`（列印並複製儀表板 URL、嘗試開啟；若是無頭環境則顯示 SSH 提示）。
    - 如果你還沒有權杖：`openclaw doctor --generate-gateway-token`。
    - 如果是遠端，先建立通道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。
    - 共享祕密模式：設定 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然後在 Control UI 設定中貼上相符的祕密。
    - Tailscale Serve 模式：確認已啟用 `gateway.auth.allowTailscale`，且你開啟的是 Serve URL，而不是會略過 Tailscale 身分標頭的原始 loopback/tailnet URL。
    - 受信任代理模式：確認你是透過已設定的身分感知代理進入，而不是原始 Gateway URL。同一主機的 loopback 代理也需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重試後仍不相符，請輪換/重新核准已配對的裝置權杖：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果該輪換呼叫顯示被拒絕，請檢查兩件事：
      - 已配對裝置工作階段只能輪換**自己的**裝置，除非它們也有 `operator.admin`
      - 明確的 `--scope` 值不能超過呼叫者目前的操作員範圍
    - 還是卡住？執行 `openclaw status --all` 並依照[疑難排解](/zh-TW/gateway/troubleshooting)。驗證詳細資料請參閱[儀表板](/zh-TW/web/dashboard)。

  </Accordion>

  <Accordion title="我設定了 gateway.bind tailnet，但它無法繫結，也沒有任何東西在監聽">
    `tailnet` 繫結會從你的網路介面選擇一個 Tailscale IP（100.64.0.0/10）。如果機器不在 Tailscale 上（或介面已關閉），就沒有可繫結的項目。

    修正：

    - 在該主機上啟動 Tailscale（讓它有 100.x 位址），或
    - 切換到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是明確設定。`auto` 偏好 loopback；當你想要僅限 tailnet 的繫結時，請使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主機上執行多個 Gateway 嗎？">
    通常不需要 - 一個 Gateway 可以執行多個訊息頻道和代理。只有在你需要備援（例如：救援機器人）或強隔離時，才使用多個 Gateway。

    可以，但你必須隔離：

    - `OPENCLAW_CONFIG_PATH`（每個執行個體的設定）
    - `OPENCLAW_STATE_DIR`（每個執行個體的狀態）
    - `agents.defaults.workspace`（工作區隔離）
    - `gateway.port`（唯一連接埠）

    快速設定（建議）：

    - 每個執行個體使用 `openclaw --profile <name> ...`（自動建立 `~/.openclaw-<name>`）。
    - 在每個設定檔設定中設定唯一的 `gateway.port`（或手動執行時傳入 `--port`）。
    - 安裝每個設定檔的服務：`openclaw --profile <name> gateway install`。

    設定檔也會為服務名稱加上尾碼（`ai.openclaw.<profile>`；舊版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多個 Gateway](/zh-TW/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ 代碼 1008 是什麼意思？'>
    Gateway 是一個 **WebSocket 伺服器**，它預期第一個訊息就是
    `connect` 訊框。如果它收到其他任何內容，就會以 **代碼 1008**（原則違規）關閉連線。

    常見原因：

    - 你在瀏覽器中開啟了 **HTTP** URL（`http://...`），而不是 WS 用戶端。
    - 你使用了錯誤的連接埠或路徑。
    - 代理或通道移除了驗證標頭，或傳送了非 Gateway 要求。

    快速修正：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，則使用 `wss://...`）。
    2. 不要在一般瀏覽器分頁中開啟 WS 連接埠。
    3. 如果已啟用驗證，請在 `connect` 訊框中包含權杖/密碼。

    如果你使用 CLI 或 TUI，URL 應如下所示：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    協定詳細資料：[Gateway 協定](/zh-TW/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 記錄與偵錯

<AccordionGroup>
  <Accordion title="記錄在哪裡？">
    檔案記錄（結構化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以透過 `logging.file` 設定穩定路徑。檔案記錄層級由 `logging.level` 控制。主控台詳細程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快的記錄追蹤：

    ```bash
    openclaw logs --follow
    ```

    服務/監督程式記錄（當 Gateway 透過 launchd/systemd 執行時）：

    - macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（預設：`~/.openclaw/logs/...`；設定檔使用 `~/.openclaw-<profile>/logs/...`）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多資訊請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何啟動/停止/重新啟動 Gateway 服務？">
    使用 Gateway 輔助工具：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行 Gateway，`openclaw gateway --force` 可以取回連接埠。請參閱 [Gateway](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上關閉了終端機 - 如何重新啟動 OpenClaw？">
    有**兩種 Windows 安裝模式**：

    **1) WSL2（建議）：** Gateway 在 Linux 內執行。

    開啟 PowerShell，進入 WSL，然後重新啟動：

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你從未安裝服務，請在前景啟動：

    ```bash
    openclaw gateway run
    ```

    **2) 原生 Windows（不建議）：** Gateway 直接在 Windows 中執行。

    開啟 PowerShell 並執行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行（沒有服務），請使用：

    ```powershell
    openclaw gateway run
    ```

    文件：[Windows (WSL2)](/zh-TW/platforms/windows)、[Gateway 服務操作手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="Gateway 已啟動，但回覆從未抵達。我應該檢查什麼？">
    先快速掃描健康狀態：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常見原因：

    - 模型驗證未載入到 **Gateway 主機**上（檢查 `models status`）。
    - 頻道配對/允許清單阻擋回覆（檢查頻道設定與記錄）。
    - WebChat/儀表板已開啟，但沒有正確權杖。

    如果你是遠端，請確認通道/Tailscale 連線已啟動，且
    Gateway WebSocket 可連線。

    文件：[頻道](/zh-TW/channels)、[疑難排解](/zh-TW/gateway/troubleshooting)、[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」- 現在該怎麼辦？'>
    這通常表示 UI 失去了 WebSocket 連線。請檢查：

    1. Gateway 是否正在執行？`openclaw gateway status`
    2. Gateway 是否健康？`openclaw status`
    3. UI 是否有正確的權杖？`openclaw dashboard`
    4. 如果是遠端，通道/Tailscale 連線是否已啟用？

    接著追蹤日誌：

    ```bash
    openclaw logs --follow
    ```

    文件：[Dashboard](/zh-TW/web/dashboard)、[遠端存取](/zh-TW/gateway/remote)、[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失敗。我該檢查什麼？">
    從日誌和頻道狀態開始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    接著比對錯誤：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 選單有太多項目。OpenClaw 已經會裁切到 Telegram 限制並用較少的指令重試，但仍需要移除部分選單項目。減少 plugin/skill/自訂指令，或如果不需要選單，停用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`，或類似的網路錯誤：如果你在 VPS 上或位於代理後方，請確認允許對外 HTTPS，且 DNS 可解析 `api.telegram.org`。

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

    文件：[TUI](/zh-TW/web/tui)、[斜線指令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止然後啟動 Gateway？">
    如果你已安裝服務：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    這會停止/啟動**受監督的服務**（macOS 上的 launchd，Linux 上的 systemd）。
    當 Gateway 作為背景常駐程式執行時，請使用這個方式。

    如果你是在前景執行，請用 Ctrl-C 停止，然後：

    ```bash
    openclaw gateway run
    ```

    文件：[Gateway 服務操作手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="簡單說明：openclaw gateway restart 與 openclaw gateway">
    - `openclaw gateway restart`：重新啟動**背景服務**（launchd/systemd）。
    - `openclaw gateway`：在這個終端機工作階段中以前景方式執行 gateway。

    如果你已安裝服務，請使用 gateway 指令。當你想要一次性的前景執行時，
    使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="出錯時取得更多詳細資訊的最快方式">
    使用 `--verbose` 啟動 Gateway，以取得更多主控台詳細資訊。接著檢查日誌檔中的頻道驗證、模型路由和 RPC 錯誤。
  </Accordion>
</AccordionGroup>

## 媒體與附件

<AccordionGroup>
  <Accordion title="我的 skill 產生了圖片/PDF，但沒有送出任何內容">
    代理的對外附件必須包含一行 `MEDIA:<path-or-url>`（獨立成行）。請參閱 [OpenClaw 助理設定](/zh-TW/start/openclaw)和[代理傳送](/zh-TW/tools/agent-send)。

    CLI 傳送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    也請檢查：

    - 目標頻道支援對外媒體，且未被允許清單封鎖。
    - 檔案位於提供者的大小限制內（圖片會調整為最大 2048px）。
    - `tools.fs.workspaceOnly=true` 會將本機路徑傳送限制在工作區、暫存/媒體儲存區，以及通過沙盒驗證的檔案。
    - `tools.fs.workspaceOnly=false` 允許 `MEDIA:` 傳送代理已可讀取的主機本機檔案，但僅限媒體與安全文件類型（圖片、音訊、影片、PDF 和 Office 文件）。純文字和類似機密的檔案仍會被封鎖。

    請參閱[圖片](/zh-TW/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全性與存取控制

<AccordionGroup>
  <Accordion title="將 OpenClaw 暴露給傳入私訊安全嗎？">
    將傳入私訊視為不受信任的輸入。預設值設計為降低風險：

    - 支援私訊的頻道預設行為是**配對**：
      - 未知寄件者會收到配對碼；機器人不會處理他們的訊息。
      - 使用以下指令核准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待處理請求上限為**每個頻道 3 個**；如果沒有收到代碼，請檢查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公開開放私訊需要明確選擇加入（`dmPolicy: "open"` 和允許清單 `"*"`）。

    執行 `openclaw doctor` 以顯示有風險的私訊政策。

  </Accordion>

  <Accordion title="提示注入只需要擔心公開機器人嗎？">
    不是。提示注入關乎**不受信任的內容**，不只是誰可以私訊機器人。
    如果你的助理讀取外部內容（網頁搜尋/擷取、瀏覽器頁面、電子郵件、
    文件、附件、貼上的日誌），該內容可能包含試圖
    劫持模型的指示。即使**你是唯一寄件者**，這也可能發生。

    工具啟用時風險最大：模型可能被誘導
    外洩上下文或代表你呼叫工具。請透過以下方式降低影響範圍：

    - 使用唯讀或停用工具的「reader」代理來摘要不受信任的內容
    - 對啟用工具的代理關閉 `web_search` / `web_fetch` / `browser`
    - 也將解碼後的檔案/文件文字視為不受信任：OpenResponses
      `input_file` 和媒體附件擷取都會將擷取的文字包在
      明確的外部內容邊界標記中，而不是傳遞原始檔案文字
    - 使用沙盒和嚴格的工具允許清單

    詳細資訊：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我的機器人應該有自己的電子郵件、GitHub 帳號或電話號碼嗎？">
    對大多數設定而言，是的。使用獨立帳號和電話號碼隔離機器人，
    可在出問題時降低影響範圍。這也讓輪替
    憑證或撤銷存取更容易，而不會影響你的個人帳號。

    從小範圍開始。只授予你實際需要的工具和帳號存取權，
    之後如有需要再擴充。

    文件：[安全性](/zh-TW/gateway/security)、[配對](/zh-TW/channels/pairing)。

  </Accordion>

  <Accordion title="我可以讓它自主處理我的文字訊息嗎？這安全嗎？">
    我們**不**建議對你的個人訊息啟用完全自主。最安全的模式是：

    - 將私訊保持在**配對模式**或嚴格允許清單中。
    - 如果你希望它代表你傳送訊息，請使用**獨立號碼或帳號**。
    - 讓它先擬稿，然後**在傳送前核准**。

    如果你想實驗，請在專用帳號上進行並保持隔離。請參閱
    [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我可以用較便宜的模型處理個人助理任務嗎？">
    可以，**前提是**代理僅用於聊天且輸入受信任。較小的層級
    更容易受到指令劫持影響，因此應避免將它們用於啟用工具的代理，
    或在讀取不受信任內容時使用。如果必須使用較小模型，請鎖定
    工具並在沙盒內執行。請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中執行了 /start，但沒有收到配對碼">
    只有當未知寄件者傳訊息給機器人，且
    已啟用 `dmPolicy: "pairing"` 時，才會傳送配對碼。`/start` 本身不會產生代碼。

    檢查待處理請求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即存取，請將你的寄件者 id 加入允許清單，或為該帳號設定 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它會傳訊息給我的聯絡人嗎？配對如何運作？">
    不會。預設 WhatsApp 私訊政策是**配對**。未知寄件者只會收到配對碼，且他們的訊息**不會被處理**。OpenClaw 只會回覆它收到的聊天，或回覆你明確觸發的傳送。

    使用以下指令核准配對：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待處理請求：

    ```bash
    openclaw pairing list whatsapp
    ```

    精靈的電話號碼提示：它用於設定你的**允許清單/擁有者**，讓你自己的私訊被允許。它不會用於自動傳送。如果你在個人 WhatsApp 號碼上執行，請使用該號碼並啟用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天指令、中止任務，以及「它停不下來」

<AccordionGroup>
  <Accordion title="如何停止在聊天中顯示內部系統訊息？">
    大多數內部或工具訊息只會在該工作階段啟用 **verbose**、**trace** 或 **reasoning** 時出現。

    在你看到它的聊天中修正：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，請檢查 Control UI 中的工作階段設定，並將 verbose
    設為**繼承**。也請確認你沒有使用在設定中將 `verboseDefault` 設為
    `on` 的機器人設定檔。

    文件：[思考與 verbose](/zh-TW/tools/thinking)、[安全性](/zh-TW/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在執行的任務？">
    將以下任一內容**作為獨立訊息**傳送（不加斜線）：

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

    大多數指令必須作為以 `/` 開頭的**獨立**訊息傳送，但少數捷徑（例如 `/status`）也可供允許清單內的寄件者在行內使用。

  </Accordion>

  <Accordion title='如何從 Telegram 傳送 Discord 訊息？（「跨上下文訊息遭拒」）'>
    OpenClaw 預設會封鎖**跨提供者**訊息。如果工具呼叫綁定
    到 Telegram，除非你明確允許，否則它不會傳送到 Discord。

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

  <Accordion title='為什麼感覺機器人「忽略」快速連續訊息？'>
    佇列模式會控制新訊息如何與進行中的執行互動。使用 `/queue` 變更模式：

    - `steer` - 將所有待處理的引導排入目前執行的下一個模型邊界
    - `queue` - 傳統的一次一個引導
    - `followup` - 逐一執行訊息
    - `collect` - 批次處理訊息並回覆一次
    - `steer-backlog` - 立即引導，然後處理積壓項目
    - `interrupt` - 中止目前執行並重新開始

    預設模式是 `steer`。你可以為 followup 模式新增像 `debounce:0.5s cap:25 drop:summarize` 這類選項。請參閱[指令佇列](/zh-TW/concepts/queue)和[引導佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='Anthropic 搭配 API 金鑰時的預設模型是什麼？'>
    在 OpenClaw 中，憑證與模型選擇是分開的。設定 `ANTHROPIC_API_KEY`（或在 auth profiles 中儲存 Anthropic API 金鑰）會啟用驗證，但實際的預設模型是你在 `agents.defaults.model.primary` 中設定的項目（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，表示 Gateway 找不到執行中 agent 預期的 `auth-profiles.json` 內的 Anthropic 憑證。
  </Accordion>
</AccordionGroup>

---

仍然卡住嗎？請到 [Discord](https://discord.com/invite/clawd) 詢問，或開啟 [GitHub 討論](https://github.com/openclaw/openclaw/discussions)。

## 相關

- [首次執行常見問題](/zh-TW/help/faq-first-run) — 安裝、onboard、驗證、訂閱、初期失敗
- [模型常見問題](/zh-TW/help/faq-models) — 模型選擇、容錯移轉、auth profiles
- [疑難排解](/zh-TW/help/troubleshooting) — 以症狀優先的分流診斷
