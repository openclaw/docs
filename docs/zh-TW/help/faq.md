---
read_when:
    - 回答常見的設定、安裝、入門導覽或執行階段支援問題
    - 在深入除錯前先分流使用者回報的問題
summary: OpenClaw 設定、組態與使用的常見問題
title: 常見問題
x-i18n:
    generated_at: "2026-07-05T11:25:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2ad033bbe300af0c0f769fc2729ee17f0fbab9facdb3c640be23f9e9a5bd01ab
    source_path: help/faq.md
    workflow: 16
---

真實環境設定（本機開發、VPS、多代理、OAuth/API 金鑰、模型故障轉移）的快速解答與深入疑難排解。執行階段診斷請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。完整設定參考請參閱[設定](/zh-TW/gateway/configuration)。

## 前 60 秒：如果有東西壞了

<Steps>
  <Step title="快速狀態">
    ```bash
    openclaw status
    ```
    快速本機摘要：OS + 更新、閘道/服務可達性、代理/工作階段、供應商設定 + 執行階段問題（當閘道可達時）。
  </Step>
  <Step title="可貼上的報告（可安全分享）">
    ```bash
    openclaw status --all
    ```
    唯讀診斷，包含日誌尾端（權杖已遮蔽）。
  </Step>
  <Step title="Daemon + 連接埠狀態">
    ```bash
    openclaw gateway status
    ```
    顯示監督器執行階段與 RPC 可達性、探測目標 URL，以及服務可能使用的設定。
  </Step>
  <Step title="深度探測">
    ```bash
    openclaw status --deep
    ```
    即時閘道健康狀態探測，支援時包含頻道探測（需要可達的閘道）。請參閱[健康狀態](/zh-TW/gateway/health)。
  </Step>
  <Step title="追蹤最新日誌">
    ```bash
    openclaw logs --follow
    ```
    如果 RPC 已中斷，請退回使用：
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    檔案日誌與服務日誌是分開的；請參閱[記錄](/zh-TW/logging)與[疑難排解](/zh-TW/gateway/troubleshooting)。
  </Step>
  <Step title="執行 doctor（修復）">
    ```bash
    openclaw doctor
    ```
    修復/遷移設定與狀態，然後執行健康檢查。請參閱[Doctor](/zh-TW/gateway/doctor)。
  </Step>
  <Step title="閘道快照（僅 WS）">
    ```bash
    openclaw health --json
    openclaw health --verbose   # shows the target URL + config path on errors
    ```
    向正在執行的閘道要求完整快照。請參閱[健康狀態](/zh-TW/gateway/health)。
  </Step>
</Steps>

## 快速開始與首次執行設定

首次執行問答 - 安裝、onboard、驗證路徑、訂閱、初始失敗 - 位於[首次執行 FAQ](/zh-TW/help/faq-first-run)。

## OpenClaw 是什麼？

<AccordionGroup>
  <Accordion title="用一段話說明 OpenClaw 是什麼？">
    OpenClaw 是在你自己的裝置上執行的個人 AI 助理。它會在你已經使用的訊息介面回覆（Discord、Google Chat、iMessage、Mattermost、Signal、Slack、Telegram、WebChat、WhatsApp，以及 QQ Bot 等隨附頻道外掛），也能在支援的平台上提供語音與即時 Canvas。**閘道**是常駐的控制平面；助理才是產品。
  </Accordion>

  <Accordion title="價值主張">
    OpenClaw 不只是「Claude 包裝器」。它是一個**本機優先的控制平面**，可在**你自己的硬體**上執行有能力的助理，並可從你已經使用的聊天應用程式連線，具備有狀態工作階段、記憶與工具，而不必把工作流程交給託管 SaaS。

    - **你的裝置、你的資料**：在任何你想要的位置執行閘道（Mac、Linux、VPS），並將工作區與工作階段歷史保留在本機。
    - **真正的頻道，而不是網頁沙盒**：Discord/iMessage/Signal/Slack/Telegram/WhatsApp/等等，加上支援平台上的行動語音與 Canvas。
    - **不綁定模型**：使用 Anthropic、MiniMax、OpenAI、OpenRouter 等，並支援每個代理的路由與故障轉移。
    - **僅本機選項**：執行本機模型，讓所有資料都能留在你的裝置上。
    - **多代理路由**：依頻道、帳號或任務分開代理，每個代理都有自己的工作區與預設值。
    - **開源且可改造**：可檢查、擴充並自行託管，沒有供應商鎖定。

    文件：[閘道](/zh-TW/gateway)、[頻道](/zh-TW/channels)、[多代理](/zh-TW/concepts/multi-agent)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我剛設定好 - 我應該先做什麼？">
    好的第一個專案：建置網站（WordPress、Shopify 或靜態網站）；製作行動應用程式原型（大綱、畫面、API 計畫）；整理檔案與資料夾；連接 Gmail 並自動化摘要或後續追蹤。

    它可以處理大型任務，但最好拆成多個階段，並使用子代理進行平行工作。

  </Accordion>

  <Accordion title="OpenClaw 最常見的五個日常用途是什麼？">
    - **個人簡報**：摘要你關心的收件匣、行事曆與新聞。
    - **研究與草擬**：快速研究、摘要，以及電子郵件或文件初稿。
    - **提醒與後續追蹤**：由排程或心跳偵測驅動的提醒與檢查清單。
    - **瀏覽器自動化**：填寫表單、收集資料、重複執行網頁任務。
    - **跨裝置協作**：從手機送出任務，讓閘道在伺服器上執行，再把結果傳回聊天。

  </Accordion>

  <Accordion title="OpenClaw 能協助 SaaS 的潛在客戶開發、外展、廣告與部落格嗎？">
    可以，用於**研究、資格評估與草擬**：掃描網站、建立候選名單、摘要潛在客戶、撰寫外展或廣告文案草稿。

    對於**外展或廣告投放**，請保留人工審核。避免垃圾訊息、遵守當地法律與平台政策，並在傳送前審閱所有內容。讓 OpenClaw 草擬；由你核准。

    文件：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="與 Claude Code 相比，OpenClaw 對網頁開發的優勢是什麼？">
    OpenClaw 是**個人助理**與協調層，不是 IDE 的替代品。若要在 repo 內進行最快的直接編碼循環，請使用 Claude Code 或 Codex。使用 OpenClaw 來取得持久記憶、跨裝置存取與工具編排。

    - 跨工作階段的持久記憶與工作區。
    - 多平台存取（Telegram、WhatsApp、終端介面、WebChat）。
    - 工具編排（瀏覽器、檔案、排程、hooks）。
    - 常駐閘道（在 VPS 上執行，從任何地方互動）。
    - 用於本機瀏覽器/螢幕/相機/exec 的節點。

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)。

  </Accordion>
</AccordionGroup>

## Skills 與自動化

<AccordionGroup>
  <Accordion title="如何自訂 Skills，而不讓 repo 變髒？">
    使用受管理的覆寫，而不是編輯 repo 複本。將變更放在 `~/.openclaw/skills/<name>/SKILL.md`（或透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增資料夾）。優先順序：`<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> 隨附 -> `skills.load.extraDirs`，因此受管理的覆寫會勝過隨附 Skills，且不會碰到 git。若要全域安裝但限制只有部分代理可見，請將共用複本放在 `~/.openclaw/skills`，並使用 `agents.defaults.skills` / `agents.list[].skills` 控制可見性。只有值得上游收錄的編輯，才應該針對 repo 複本送出 PR。
  </Accordion>

  <Accordion title="我可以從自訂資料夾載入 Skills 嗎？">
    可以：在 `~/.openclaw/openclaw.json` 中透過 `skills.load.extraDirs` 新增目錄（在上述順序中優先順序最低）。`clawhub` 預設安裝到 `./skills`，OpenClaw 會在下一個工作階段將其視為 `<workspace>/skills`。若要限制只讓特定代理可見，請搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何針對不同任務使用不同模型或設定？">
    支援的模式：

    - **排程工作**：隔離工作可以為每個工作設定 `model` 覆寫。
    - **代理**：將任務路由到不同代理，並使用不同的預設模型、思考層級與串流參數。
    - **隨選切換**：`/model` 可隨時切換目前工作階段模型。

    範例 - 相同模型，不同的每代理設定：

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    將共用的每模型預設值放在 `agents.defaults.models["provider/model"].params`，然後把代理特定覆寫放在扁平的 `agents.list[].params`。不要在巢狀的 `agents.list[].models["provider/model"].params` 下重複相同模型；該路徑是用於每代理模型目錄與執行階段覆寫。

    請參閱[排程工作](/zh-TW/automation/cron-jobs)、[多代理路由](/zh-TW/concepts/multi-agent)、[設定](/zh-TW/gateway/config-agents)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="Bot 在執行繁重工作時凍結。我要如何卸載該工作？">
    對長時間或平行任務使用**子代理**：它們會在自己的工作階段中執行、回傳摘要，並讓你的主要聊天保持回應。要求 Bot「spawn a sub-agent for this task」，或使用 `/subagents`。使用 `/status` 查看閘道目前是否忙碌。

    長任務與子代理都會消耗權杖；如果成本重要，請透過 `agents.defaults.subagents.model` 為子代理設定較便宜的模型。

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上的執行緒綁定子代理工作階段如何運作？">
    將 Discord 執行緒綁定到子代理或工作階段目標，讓該處的後續訊息維持在綁定的工作階段上。

    - 使用 `sessions_spawn` 搭配 `thread: true` 生成（可選用 `mode: "session"` 以支援持久後續追蹤）。
    - 或使用 `/focus <target>` 手動綁定。
    - `/agents` 檢查綁定狀態。
    - `/session idle <duration|off>` 與 `/session max-age <duration|off>` 控制自動取消聚焦。
    - `/unfocus` 會解除執行緒附加。

    設定：`session.threadBindings.enabled`（全域開關）、`session.threadBindings.idleHours`（預設 `24`，`0` 停用）、`session.threadBindings.maxAgeHours`（預設 `0` = 無硬性上限），以及每頻道覆寫 `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`。`channels.discord.threadBindings.spawnSessions` 會限制生成時的自動綁定（預設 `true`）。

    文件：[子代理](/zh-TW/tools/subagents)、[Discord](/zh-TW/channels/discord)、[設定參考](/zh-TW/gateway/configuration-reference)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="子代理完成了，但完成更新傳到錯誤位置或完全沒有發布。我該檢查什麼？">
    檢查已解析的請求者路由：

    - 完成模式的子代理遞送會優先使用已綁定的執行緒或對話路由（如果存在）。
    - 如果完成來源只帶有頻道，OpenClaw 會退回使用請求者工作階段儲存的路由（`lastChannel` / `lastTo` / `lastAccountId`），讓直接遞送仍可成功。
    - 沒有綁定路由，也沒有可用的已儲存路由：直接遞送可能失敗，結果會退回到佇列工作階段遞送，而不是立即發布。
    - 無效或過時的目標也可能強制退回佇列，或導致最終遞送失敗。
    - 如果子代理最後可見的助理回覆正好是 `NO_REPLY` / `no_reply` 或 `ANNOUNCE_SKIP`，OpenClaw 會刻意抑制公告，而不是發布較早的過時進度。

    偵錯：`openclaw tasks show <lookup>`，其中 `<lookup>` 是任務 id、run id 或工作階段 key。

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)、[工作階段工具](/zh-TW/concepts/session-tool)。

  </Accordion>

  <Accordion title="排程或提醒沒有觸發。我該檢查什麼？">
    排程在閘道程序內執行；如果閘道沒有持續執行，就不會觸發。

    - 確認排程已啟用（`cron.enabled`），且未設定 `OPENCLAW_SKIP_CRON`。
    - 確認閘道全天候執行（沒有睡眠/重新啟動）。
    - 驗證工作時區（`--tz` 與主機時區）。

    偵錯：
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="Cron 已觸發，但沒有任何內容傳送到頻道。為什麼？">
    檢查傳遞模式：

    - `--no-deliver` / `delivery.mode: "none"`：不會預期有 runner 後援傳送。
    - 缺少或無效的公告目標（`channel` / `to`）：runner 已略過外送傳遞。
    - 頻道驗證失敗（`unauthorized`、`Forbidden`）：runner 嘗試傳遞，但憑證阻擋了它。
    - 靜默的隔離結果（僅 `NO_REPLY` / `no_reply`）會被視為刻意不可傳遞，因此佇列中的後援傳遞也會被抑制。

    對於隔離的排程作業，只要有可用的聊天路由，代理仍可使用 `message` 工具直接傳送。`--announce` 只控制代理尚未自行傳送之最終文字的 runner 後援傳遞。

    偵錯：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    文件：[排程作業](/zh-TW/automation/cron-jobs)、[背景工作](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="為什麼隔離的排程執行會切換模型或重試一次？">
    這是即時模型切換路徑，不是重複排程。隔離排程會保留執行階段模型交接，並在作用中的執行拋出 `LiveSessionModelSwitchError` 時重試，重試前會保留切換後的提供者/模型（以及任何切換後的驗證設定檔覆寫）。

    模型選擇優先順序：先是 Gmail hook 模型覆寫（`hooks.gmail.model`），接著是每個作業的 `model`，再來是任何已儲存的排程工作階段模型覆寫，最後是一般代理/預設模型選擇。

    重試迴圈限制為初次嘗試加上 2 次切換重試；之後排程會中止，而不是無限迴圈。

    偵錯：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[排程作業](/zh-TW/automation/cron-jobs)、[排程命令列介面](/zh-TW/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 Skills？">
    使用原生 `openclaw skills` 命令，或將 Skills 放進你的工作區；macOS Skills UI 在 Linux 上不可用。可在 [https://clawhub.ai](https://clawhub.ai) 瀏覽 Skills。

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    原生 `openclaw skills install` 預設會寫入作用中工作區的 `skills/` 目錄。加入 `--global` 可安裝到所有本機代理共用的受管理 Skills 目錄。只有在要發布或同步自己的 Skills 時，才需要安裝獨立的 `clawhub` 命令列介面。使用 `agents.defaults.skills` 或 `agents.list[].skills` 來限制哪些代理可看到共用 Skills。

  </Accordion>

  <Accordion title="OpenClaw 可以依排程或持續在背景執行工作嗎？">
    可以，透過閘道排程器：

    - **排程作業**，用於已排程或週期性工作（重新啟動後仍會保留）。
    - **心跳偵測**，用於主要工作階段的週期性檢查。
    - **隔離作業**，用於發布摘要或傳遞到聊天的自主代理。

    文件：[排程作業](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)、[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="可以從 Linux 執行僅限 Apple macOS 的 Skills 嗎？">
    不能直接執行。macOS Skills 會受 `metadata.openclaw.os` 加上必要二進位檔限制，且只有在**閘道主機**符合資格時才會載入。在 Linux 上，僅限 `darwin` 的 Skills（`apple-notes`、`apple-reminders`、`things-mac`）除非覆寫限制，否則不會載入。

    三種受支援模式：

    **選項 A - 在 Mac 上執行閘道（最簡單）**。在有 macOS 二進位檔的位置執行閘道，然後從 Linux 以[遠端模式](#gateway-ports-already-running-and-remote-mode)或透過 Tailscale 連線。因為閘道主機是 macOS，Skills 會正常載入。

    **選項 B - 使用 macOS 節點（無需 SSH）**。在 Linux 上執行閘道，配對一個 macOS 節點（選單列應用程式），並在 Mac 上將**節點執行命令**設為「Always Ask」或「Always Allow」。當節點上存在必要二進位檔時，OpenClaw 會將僅限 macOS 的 Skills 視為符合資格；代理會透過 `nodes` 工具執行它們。使用「Always Ask」時，在提示中核准「Always Allow」會將該命令加入允許清單。

    **選項 C - 透過 SSH 代理 macOS 二進位檔（進階）**。將閘道保留在 Linux 上，但讓必要的命令列介面二進位檔解析為會在 Mac 上執行的 SSH wrapper，然後覆寫 Skill 以允許 Linux，讓它保持符合資格。

    1. 為二進位檔建立 SSH wrapper（範例：Apple Notes 的 `memo`）：
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. 將 wrapper 放到 Linux 主機的 `PATH` 上（例如 `~/bin/memo`）。
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
    目前沒有內建。選項：

    - **自訂 Skill / 外掛**：最適合可靠的 API 存取（兩者都有 API）。
    - **瀏覽器自動化**：不需程式碼即可運作，但速度較慢且較脆弱。

    針對代理商式的每客戶情境：每位客戶保留一個 Notion 頁面（情境 + 偏好設定 + 作用中的工作），並要求代理在工作階段開始時擷取該頁面。

    若需要原生整合，請開啟功能請求，或針對這些 API 建置 Skill。

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    原生安裝會落在作用中工作區的 `skills/` 目錄；使用 `--global` 可供所有本機代理使用，或設定 `agents.defaults.skills` / `agents.list[].skills` 以限制可見性。有些 Skills 需要透過 Homebrew 安裝的二進位檔；在 Linux 上這表示 Linuxbrew。

    請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)、[ClawHub](/zh-TW/clawhub)。

  </Accordion>

  <Accordion title="如何在 OpenClaw 中使用我現有已登入的 Chrome？">
    使用內建的 `user` 瀏覽器設定檔，它會透過 Chrome DevTools MCP 連接：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    若要使用自訂名稱，請建立明確的 MCP 設定檔：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    這可以使用本機主機瀏覽器或已連線的瀏覽器節點。如果閘道在其他地方執行，請在瀏覽器機器上執行節點主機，或改用遠端 CDP。

    `existing-session` / `user` 設定檔相較於受管理的 `openclaw` 設定檔，目前限制如下：

    - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照 ref，而不是 CSS 選擇器。
    - 上傳 hook 需要 `ref` 或 `inputRef`，一次一個檔案，不支援 CSS `element`。
    - `responsebody`、PDF 匯出、下載攔截和批次動作仍需要受管理的瀏覽器路徑。

    請參閱[瀏覽器](/zh-TW/tools/browser#existing-session-via-chrome-devtools-mcp)以取得完整比較。

  </Accordion>
</AccordionGroup>

## 沙箱與記憶

<AccordionGroup>
  <Accordion title="有專門的沙箱文件嗎？">
    有：[沙箱](/zh-TW/gateway/sandboxing)。若是 Docker 專用設定（在 Docker 中執行完整閘道或沙箱映像檔），請參閱 [Docker](/zh-TW/install/docker)。
  </Accordion>

  <Accordion title="Docker 感覺受限，如何啟用完整功能？">
    預設映像檔以安全優先，並以 `node` 使用者執行，因此不包含系統套件、Homebrew 和隨附瀏覽器。若要更完整的設定：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，讓快取保留下來。
    - 使用 `OPENCLAW_IMAGE_APT_PACKAGES` 將系統相依項目烘焙進映像檔。
    - 透過隨附的命令列介面安裝 Playwright 瀏覽器：`node /app/node_modules/playwright-core/cli.js install chromium`。
    - 設定 `PLAYWRIGHT_BROWSERS_PATH` 並持久化該路徑。

    文件：[Docker](/zh-TW/install/docker)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="可以用同一個代理讓 DM 保持個人，但讓群組公開/沙箱化嗎？">
    可以，如果私人流量是 **DM**，公開流量是**群組**。設定 `agents.defaults.sandbox.mode: "non-main"`，讓群組/頻道工作階段（非主要鍵）在已設定的沙箱後端執行，而主要 DM 工作階段保留在主機上。啟用沙箱後，Docker 是預設後端。透過 `tools.sandbox.tools` 限制沙箱化工作階段可用的工具。

    設定教學：[群組：個人 DM + 公開群組](/zh-TW/channels/groups#pattern-personal-dms-public-groups-single-agent)。重要參考：[閘道設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="如何將主機資料夾繫結到沙箱中？">
    將 `agents.defaults.sandbox.docker.binds` 設為 `["host:container:mode"]`（例如 `"/home/user/src:/src:ro"`）。全域與每代理繫結會合併；當 `scope: "shared"` 時，會忽略每代理繫結。任何敏感內容請使用 `:ro`；繫結會繞過沙箱檔案系統隔離牆。

    OpenClaw 會同時針對正規化路徑，以及透過最深層既有祖先解析出的標準路徑驗證繫結來源，因此即使最終路徑片段尚不存在，符號連結父層逸出也會失敗並關閉。

    請參閱[沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts)與[沙箱 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="記憶如何運作？">
    OpenClaw 記憶是代理工作區中的 Markdown 檔案：每日筆記位於 `memory/YYYY-MM-DD.md`，精選長期筆記位於 `MEMORY.md`（僅限主要/私人工作階段）。

    OpenClaw 也會在壓縮摘要對話之前，執行靜默的**壓縮前記憶清理**，提醒模型先寫入持久筆記。它只會在工作區可寫入時執行（唯讀沙箱會略過）；可用 `agents.defaults.compaction.memoryFlush.enabled: false` 停用。請參閱[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="記憶一直忘記事情。如何讓它記住？">
    請要求機器人**將事實寫入記憶**：長期筆記放在 `MEMORY.md`，短期情境放在 `memory/YYYY-MM-DD.md`。提醒模型儲存記憶通常就能解決。如果它仍持續忘記，請確認閘道在每次執行時都使用相同工作區。

    文件：[記憶](/zh-TW/concepts/memory)、[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="記憶會永遠保留嗎？有哪些限制？">
    記憶檔案存在磁碟上，會持續保留直到刪除；限制來自你的儲存空間，而不是模型。**工作階段情境**仍受模型情境視窗限制，因此長對話可能會壓縮或截斷，這也是記憶搜尋存在的原因：只將相關部分拉回情境中。

    文件：[記憶](/zh-TW/concepts/memory)、[情境](/zh-TW/concepts/context)。

  </Accordion>

  <Accordion title="語意記憶搜尋需要 OpenAI API 金鑰嗎？">
    只有在使用 **OpenAI embeddings** 時需要，而這是預設提供者。Codex OAuth 涵蓋聊天/補全，但**不**授予 embeddings 存取權，因此使用 Codex 登入（OAuth 或 Codex 命令列介面登入）不會啟用語意記憶搜尋。OpenAI embeddings 仍需要真正的 API 金鑰（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    若要保持本機使用，請設定 `agents.defaults.memorySearch.provider: "local"`（GGUF/llama.cpp）。其他支援的提供者：Bedrock、DeepInfra、Gemini（`GEMINI_API_KEY` 或 `memorySearch.remote.apiKey`）、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI 相容，以及 Voyage。設定詳情請參閱[記憶](/zh-TW/concepts/memory)與[記憶搜尋](/zh-TW/concepts/memory-search)。

  </Accordion>
</AccordionGroup>

## 內容在磁碟上的位置

<AccordionGroup>
  <Accordion title="所有與 OpenClaw 搭配使用的資料都會儲存在本機嗎？">
    不會：**OpenClaw 自身狀態是本機的**，但**外部服務仍然會看到你傳送給它們的內容**。

    - **預設為本機**：工作階段、記憶檔案、設定與工作區位於閘道主機上（`~/.openclaw` 加上你的工作區目錄）。
    - **必要時為遠端**：傳送給模型提供者（Anthropic/OpenAI/等）的訊息會送到其 API，而聊天平台（Slack/Telegram/WhatsApp/等）會將訊息資料儲存在它們的伺服器上。
    - **你可以控制足跡**：本機模型會將提示保留在你的機器上，但頻道流量仍會經過該頻道的伺服器。

    相關：[代理工作區](/zh-TW/concepts/agent-workspace)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 會將資料儲存在哪裡？">
    所有內容都位於 `$OPENCLAW_STATE_DIR` 底下（預設：`~/.openclaw`）：

    | 路徑                                                             | 用途                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | 主要設定（JSON5）                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | 舊版 OAuth 匯入（首次使用時複製到驗證設定檔）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | 驗證設定檔（OAuth、API 金鑰、可選的 `keyRef`/`tokenRef`）        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef 提供者的可選檔案支援祕密酬載   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | 舊版相容性檔案（靜態 `api_key` 項目已清除）        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | 提供者狀態（例如 `whatsapp/<accountId>/creds.json`）      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | 每個代理的狀態（agentDir + 工作階段）                                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | 對話歷史與狀態（每個代理）                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`       | 工作階段中繼資料（每個代理）                                        |

    舊版單一代理路徑 `~/.openclaw/agent/*` 會由 `openclaw doctor` 遷移。

    你的**工作區**（AGENTS.md、記憶檔案、Skills 等）是分開的，透過 `agents.defaults.workspace` 設定（預設：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 應該放在哪裡？">
    這些檔案位於**代理工作區**，而不是 `~/.openclaw`。

    - **工作區（每個代理）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`、可選的 `HEARTBEAT.md`。小寫根目錄 `memory.md` 僅作為舊版修復輸入；當兩者都存在時，`openclaw doctor --fix` 可將它合併到 `MEMORY.md`。
    - **狀態目錄（`~/.openclaw`）**：設定、頻道/提供者狀態、驗證設定檔、工作階段、日誌、共享 Skills（`~/.openclaw/skills`）。

    預設工作區是 `~/.openclaw/workspace`，可設定：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果機器人重新啟動後「忘記」內容，請確認閘道每次啟動時都使用相同工作區（遠端模式使用的是**閘道主機的**工作區，而不是你的本機筆電）。

    提示：若是持久行為或偏好，請要求機器人**將它寫入 AGENTS.md 或 MEMORY.md**，而不是依賴聊天歷史。

    請參閱[代理工作區](/zh-TW/concepts/agent-workspace)與[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我可以讓 SOUL.md 更大嗎？">
    可以。`SOUL.md` 是注入代理上下文的工作區啟動檔之一。預設的單檔注入限制是 `20000` 個字元；跨檔案的總啟動預算是 `60000` 個字元。

    變更共享預設值：

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    或在 `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` 底下覆寫單一代理。

    使用 `/context` 檢查原始大小與注入大小，以及是否發生截斷。讓 `SOUL.md` 專注於語氣、立場與個性；將操作規則放在 `AGENTS.md`，並將持久事實放在記憶中。

    請參閱[上下文](/zh-TW/concepts/context)與[代理設定](/zh-TW/gateway/config-agents)。

  </Accordion>

  <Accordion title="建議的備份策略">
    將你的**代理工作區**放在**私有** git repo，並備份到某個私有位置（例如 GitHub private）。這會捕捉記憶加上 AGENTS/SOUL/USER 檔案，讓你之後能還原助理的「心智」。

    請**不要**提交 `~/.openclaw` 底下的任何內容（憑證、工作階段、權杖、加密祕密酬載）。若要完整還原，請分別備份工作區與狀態目錄。

    文件：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="我要如何完全解除安裝 OpenClaw？">
    請參閱[解除安裝](/zh-TW/install/uninstall)。
  </Accordion>

  <Accordion title="代理可以在工作區之外運作嗎？">
    可以。工作區是**預設 cwd** 與記憶錨點，不是硬性沙箱。相對路徑會在工作區內解析；除非啟用沙箱，否則絕對路徑可以存取其他主機位置。若要隔離，請使用 [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing) 或每個代理的沙箱設定。若要將某個 repo 設為預設工作目錄，請將該代理的 `workspace` 指向 repo 根目錄 - OpenClaw repo 本身只是原始碼，因此除非你刻意要讓代理在其中工作，否則請將工作區分開。

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
    工作階段狀態由**閘道主機**擁有。在遠端模式中，你關心的工作階段儲存區位於遠端機器上，而不是你的本機筆電。請參閱[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>
</AccordionGroup>

## 設定基礎

<AccordionGroup>
  <Accordion title="設定是什麼格式？在哪裡？">
    OpenClaw 會從 `$OPENCLAW_CONFIG_PATH` 讀取可選的 **JSON5** 設定（預設：`~/.openclaw/openclaw.json`）。如果檔案遺失，它會使用相對安全的預設值，包括預設工作區 `~/.openclaw/workspace`。
  </Accordion>

  <Accordion title='我設定了 gateway.bind: "lan"（或 "tailnet"），現在沒有任何東西在監聽 / UI 顯示未授權'>
    非 loopback 綁定**需要有效的閘道驗證路徑**：共享祕密驗證（權杖或密碼），或位於正確設定、具備身分感知的反向代理後方的 `gateway.auth.mode: "trusted-proxy"`。

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

    - `gateway.remote.token` / `.password` 本身**不會**啟用本機閘道驗證；只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才可使用 `gateway.remote.*` 作為後備。
    - 對於密碼驗證，請設定 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `.password` 透過 SecretRef 明確設定且無法解析，解析會封閉失敗（不會以遠端後備遮蔽）。
    - 共享祕密 Control UI 設定會透過 `connect.params.auth.token` 或 `connect.params.auth.password`（儲存在 app/UI 設定中）驗證。帶有身分的模式，例如 Tailscale Serve 或 `trusted-proxy`，則改用請求標頭 - 避免將共享祕密放入 URL。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 時，同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並在 `gateway.trustedProxies` 中加入 loopback 項目。

  </Accordion>

  <Accordion title="為什麼現在 localhost 也需要權杖？">
    OpenClaw 預設會強制執行閘道驗證，包括 loopback。如果未設定明確的驗證路徑，啟動時會解析為權杖模式，並為該次啟動產生僅限執行階段使用的權杖，因此本機 WS 用戶端必須驗證。這會阻止其他本機程序呼叫閘道。

    當用戶端需要跨重新啟動穩定使用的祕密時，請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。你也可以選擇密碼模式，或對具備身分感知的反向代理使用 `trusted-proxy`。若要開放 loopback，請明確設定 `gateway.auth.mode: "none"`。`openclaw doctor --generate-gateway-token` 可隨時產生權杖。

  </Accordion>

  <Accordion title="變更設定後一定要重新啟動嗎？">
    閘道會監看設定並支援熱重新載入：`gateway.reload.mode: "hybrid"`（預設）會熱套用安全變更，並針對關鍵變更重新啟動。也支援 `hot`、`restart` 與 `off`。大多數 `tools.*`、`agents.*` 政策、`session.*` 與 `messages.*` 變更會立即套用，完全不需要重新載入動作；`gateway.*` 綁定/連接埠變更需要重新啟動。
  </Accordion>

  <Accordion title="我要如何停用有趣的命令列介面標語？">
    設定 `cli.banner.taglineMode`：

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
    - `default`：一律使用 `All your chats, one OpenClaw.`。
    - `random`：輪替有趣/季節性標語（預設行為）。
    - 若完全不要橫幅，請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="我要如何啟用網頁搜尋（以及網頁擷取）？">
    `web_fetch` 不需要 API 金鑰即可運作。`web_search` 取決於你選擇的提供者：

    | 提供者 | 不需金鑰 | 環境變數 |
    | --- | --- | --- |
    | Brave | 否 | `BRAVE_API_KEY` |
    | DuckDuckGo | 是（非官方、基於 HTML） | - |
    | Exa | 否 | `EXA_API_KEY` |
    | Firecrawl | 否 | `FIRECRAWL_API_KEY` |
    | Gemini | 否 | `GEMINI_API_KEY` |
    | Grok | 否（xAI OAuth 或金鑰） | `XAI_API_KEY` |
    | Kimi | 否 | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |
    | MiniMax Search | 否 | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY` |
    | Ollama Web Search | 是（需要 `ollama signin`） | - |
    | Perplexity | 否 | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY` |
    | SearXNG | 是（自行託管） | `SEARXNG_BASE_URL` |
    | Tavily | 否 | `TAVILY_API_KEY` |

    Grok 也可以重用模型驗證中的 xAI OAuth（`openclaw onboard --auth-choice xai-oauth`）。

    **建議**：使用 `openclaw configure --section web` 並選擇提供者。

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

    供應商特定的網頁搜尋設定位於 `plugins.entries.<plugin>.config.webSearch.*` 底下。舊版 `tools.web.search.*` 供應商路徑仍會為了相容性而載入，但不應在新設定中使用。Firecrawl 網頁擷取後援設定位於 `plugins.entries.firecrawl.config.webFetch.*` 底下。

    - 允許清單：加入 `web_search`/`web_fetch`/`x_search`，或使用 `group:web` 代表全部三者。
    - `web_fetch` 預設已啟用。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 會從可用憑證中自動偵測第一個就緒的擷取後援供應商；官方 Firecrawl 外掛會提供該後援。
    - 常駐程式會從 `~/.openclaw/.env`（或服務環境）讀取環境變數。

    文件：[網頁工具](/zh-TW/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清掉了我的設定。我要如何復原並避免這種情況？">
    `config.apply` 會取代**整個設定**；部分物件會移除其他所有內容。

    目前的 OpenClaw 會防護大多數意外覆寫：

    - OpenClaw 擁有的設定寫入會在寫入前驗證完整的變更後設定。
    - 無效或具破壞性的 OpenClaw 擁有寫入會被拒絕，並儲存為 `openclaw.json.rejected.*`。
    - 直接編輯導致啟動或熱重新載入失敗時，閘道會故障關閉或略過重新載入；它不會重寫 `openclaw.json`。
    - `openclaw doctor --fix` 負責修復，可以還原最後已知良好版本，並將被拒絕的檔案儲存為 `openclaw.json.clobbered.*`。

    復原：

    - 檢查 `openclaw logs --follow` 是否出現 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 檢查有效設定旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 執行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 只用 `openclaw config set` 或 `config.patch` 複製預期的鍵回去。
    - 沒有最後已知良好版本或被拒絕的承載資料：從備份還原，或重新執行 `openclaw doctor` 並重新設定通道/模型。
    - 非預期遺失：附上你最後已知的設定或備份來提交錯誤。local coding agent 通常可以從日誌或歷史記錄重建可運作的設定。

    避免方式：小型變更使用 `openclaw config set`，互動式編輯使用 `openclaw configure`，檢查不熟悉的路徑時使用 `config.schema.lookup`（會傳回淺層結構描述節點和直接子項摘要），部分 RPC 編輯使用 `config.patch` - 將 `config.apply` 保留給完整設定取代。面向代理的 `gateway` 執行階段工具即使透過舊版 `tools.bash.*` 別名，也會拒絕重寫 `tools.exec.ask` / `tools.exec.security`。

    文件：[設定](/zh-TW/cli/config)、[設定工具](/zh-TW/cli/configure)、[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="我要如何跨裝置執行中央閘道和專用工作器？">
    常見模式：**一個閘道**（例如 Raspberry Pi）加上**節點**和**代理**。

    - **閘道（中央）**：擁有通道（Signal/WhatsApp）、路由、工作階段。
    - **節點（裝置）**：Mac/iOS/Android 作為周邊連線，並公開本機工具（`system.run`、`canvas`、`camera`）。
    - **代理（工作器）**：為特殊角色提供獨立的大腦/工作區（例如營運與個人資料）。
    - **子代理**：從主要代理產生背景工作以進行平行處理。
    - **終端介面**：連線到閘道並切換代理/工作階段。

    文件：[節點](/zh-TW/nodes)、[遠端存取](/zh-TW/gateway/remote)、[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[終端介面](/zh-TW/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 瀏覽器可以無頭執行嗎？">
    可以：

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

    預設為 `false`（有頭）。無頭模式在某些網站上更可能觸發反機器人檢查（X/Twitter 經常封鎖無頭工作階段）。它使用相同的 Chromium 引擎，適用於大多數自動化；主要差異是沒有可見的瀏覽器視窗（使用螢幕截圖查看視覺內容）。請參閱[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="我要如何使用 Brave 進行瀏覽器控制？">
    將 `browser.executablePath` 設為你的 Brave 二進位檔（或任何 Chromium 架構的瀏覽器），然後重新啟動閘道。請參閱[瀏覽器](/zh-TW/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 遠端閘道與節點

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、閘道和節點之間傳遞？">
    Telegram 訊息由**閘道**處理，閘道會執行代理，只有在需要節點工具時才會透過**閘道 WebSocket** 呼叫節點：

    Telegram -> 閘道 -> 代理 -> `node.*` -> 節點 -> 閘道 -> Telegram

    節點看不到傳入的供應商流量；它們只會接收節點 RPC 呼叫。

  </Accordion>

  <Accordion title="如果閘道託管在遠端，我的代理要如何存取我的電腦？">
    將你的電腦配對為**節點**。閘道在其他地方執行，但可以透過閘道 WebSocket 在你的本機機器上呼叫 `node.*` 工具（螢幕、相機、系統）。

    1. 在永遠開機的主機（VPS/家用伺服器）上執行閘道。
    2. 將閘道主機和你的電腦放在同一個 tailnet 上。
    3. 確認閘道 WS 可連線（tailnet 繫結或 SSH 通道）。
    4. 在本機開啟 macOS App，並以**透過 SSH 遠端**模式（或直接 tailnet）連線，讓它註冊為節點。
    5. 核准節點：
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要獨立的 TCP 橋接；節點會透過閘道 WebSocket 連線。

    安全提醒：配對 macOS 節點會允許在該機器上執行 `system.run`。只配對你信任的裝置；請查閱[安全性](/zh-TW/gateway/security)。

    文件：[節點](/zh-TW/nodes)、[閘道通訊協定](/zh-TW/gateway/protocol)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已連線，但我沒有收到回覆。現在該怎麼辦？">
    檢查基本項目：

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    接著驗證驗證和路由：如果你使用 Tailscale Serve，確認 `gateway.auth.allowTailscale` 設定正確；如果你透過 SSH 通道連線，確認通道已啟動並指向正確的連接埠；確認你的 DM/群組允許清單包含你的帳號。

    文件：[Tailscale](/zh-TW/gateway/tailscale)、[遠端存取](/zh-TW/gateway/remote)、[通道](/zh-TW/channels)。

  </Accordion>

  <Accordion title="兩個 OpenClaw 實例可以互相通訊嗎（本機 + VPS）？">
    可以，不過目前沒有內建的機器人對機器人橋接。

    **最簡單**：使用兩個機器人都能存取的一般聊天通道（Slack/Telegram/WhatsApp）。讓 Bot A 傳訊息給 Bot B，然後讓 Bot B 照常回覆。

    **命令列介面橋接（通用）**：執行一個指令碼，用 `openclaw agent --message ... --deliver` 呼叫另一個閘道，目標設定為另一個機器人正在監聽的聊天。如果其中一個機器人在遠端 VPS 上，請透過 SSH/Tailscale 將你的命令列介面指向該遠端閘道（請參閱[遠端存取](/zh-TW/gateway/remote)）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    加上防護措施，避免兩個機器人無限循環（僅提及、通道允許清單，或「不要回覆機器人訊息」規則）。

    文件：[遠端存取](/zh-TW/gateway/remote)、[代理命令列介面](/zh-TW/cli/agent)、[代理傳送](/zh-TW/tools/agent-send)。

  </Accordion>

  <Accordion title="多個代理需要獨立的 VPS 嗎？">
    不需要。一個閘道可託管多個代理，每個代理都有自己的工作區、模型預設值和路由 - 這是標準設定，而且比每個代理一台 VPS 便宜且簡單得多。只有在需要強隔離（安全邊界）或非常不同且不想共用的設定時，才使用獨立 VPS。
  </Accordion>

  <Accordion title="使用個人筆電上的節點，而不是從 VPS 使用 SSH，有什麼好處嗎？">
    有：節點是從遠端閘道連到你的筆電的一級方式，能解鎖超越 Shell 存取的能力。閘道在 macOS/Linux（Windows 透過 WSL2）上執行且很輕量（小型 VPS 或 Raspberry Pi 等級的機器即可；4 GB RAM 很充裕），因此常見設定是永遠開機的主機加上作為節點的筆電。

    - **不需要傳入 SSH** - 節點透過裝置配對向外連線到閘道 WebSocket。
    - **更安全的執行控制** - `system.run` 受到該筆電上的節點允許清單/核准管控。
    - **更多裝置工具** - 除了 `system.run`，節點還會公開 `canvas`、`camera` 和 `screen`。
    - **本機瀏覽器自動化** - 將閘道保留在 VPS 上，但透過節點主機在本機執行 Chrome，或透過 Chrome MCP 附加到本機 Chrome。

    SSH 適合臨時 Shell 存取；節點更適合持續的代理工作流程與裝置自動化。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="節點會執行閘道服務嗎？">
    不會。除非你有意執行隔離的設定檔（請參閱[多重閘道](/zh-TW/gateway/multiple-gateways)），否則每台主機只應執行**一個閘道**。節點是連線到閘道的周邊（iOS/Android 節點，或 macOS 選單列 App 中的「節點模式」）。如需無頭節點主機和命令列介面控制，請參閱[節點主機命令列介面](/zh-TW/cli/node)。

    `gateway`、`discovery` 和託管外掛介面變更需要完整重新啟動。

  </Accordion>

  <Accordion title="有套用設定的 API / RPC 方式嗎？">
    有：

    - `config.schema.lookup`：在寫入前檢查一個設定子樹，包含其淺層結構描述節點、符合的 UI 提示和直接子項摘要。
    - `config.get`：擷取目前快照和雜湊。
    - `config.patch`：安全的部分更新（大多數 RPC 編輯的首選）；可行時會熱重新載入，需要時會重新啟動。
    - `config.apply`：驗證並取代完整設定；可行時會熱重新載入，需要時會重新啟動。
    - 面向代理的 `gateway` 執行階段工具仍會拒絕重寫 `tools.exec.ask` / `tools.exec.security`；舊版 `tools.bash.*` 別名會正規化到相同的受保護路徑。

  </Accordion>

  <Accordion title="首次安裝的最小合理設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    設定你的工作區，並限制誰可以觸發機器人。

  </Accordion>

  <Accordion title="我要如何在 VPS 上設定 Tailscale，並從我的 Mac 連線？">
    1. **在 VPS 上安裝 + 登入**：
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **在你的 Mac 上安裝 + 登入**，使用相同 tailnet。
    3. **啟用 MagicDNS**，在 Tailscale 管理主控台中讓 VPS 擁有穩定名稱。
    4. **使用 tailnet 主機名稱**：SSH `ssh user@your-vps.tailnet-xxxx.ts.net`；閘道 WS `ws://your-vps.tailnet-xxxx.ts.net:18789`。

    若要在不使用 SSH 的情況下使用控制 UI，請在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    這會讓閘道繫結到 local loopback，並透過 Tailscale 公開 HTTPS。請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何將 Mac 節點連到遠端閘道（Tailscale Serve）？">
    Serve 會公開 **閘道控制 UI + WS**；節點會透過相同的閘道 WS 端點連線。

    1. 確認 VPS 和 Mac 位於同一個 tailnet。
    2. 在遠端模式中使用 macOS 應用程式（SSH 目標可以是 tailnet 主機名稱）- 它會建立閘道連接埠通道，並以節點身分連線。
    3. 核准節點：
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文件：[閘道協定](/zh-TW/gateway/protocol)、[探索](/zh-TW/gateway/discovery)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我應該安裝在第二台筆電上，還是只要新增節點？">
    如果第二台筆電只需要**本機工具**（螢幕/相機/exec），請將它新增為**節點** - 一個閘道，不重複設定。目前本機節點工具僅支援 macOS。只有在需要**強隔離**或兩個完全分離的 Bot 時，才安裝第二個閘道。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境變數與 .env 載入

<AccordionGroup>
  <Accordion title="OpenClaw 如何載入環境變數？">
    OpenClaw 會從父程序（shell、launchd/systemd、CI 等）讀取環境變數，並額外載入：

    - 目前工作目錄中的 `.env`。
    - 來自 `~/.openclaw/.env` 的全域備援 `.env`（`$OPENCLAW_STATE_DIR/.env`）。

    兩個 `.env` 檔案都不會覆寫既有的環境變數。提供者憑證金鑰對工作區 `.env` 是例外：像 `GEMINI_API_KEY`、`XAI_API_KEY` 或 `MISTRAL_API_KEY`（以及其他內建提供者驗證環境變數）這類金鑰會從工作區 `.env` 忽略，應放在程序環境、`~/.openclaw/.env` 或設定 `env` 中。

    設定中的內嵌環境變數只會在程序環境缺少時套用：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    如需完整優先順序與來源，請參閱 [/environment](/zh-TW/help/environment)。

  </Accordion>

  <Accordion title="我透過服務啟動閘道後，環境變數消失了。現在該怎麼辦？">
    有兩種修正方式：

    1. 將缺少的金鑰放入 `~/.openclaw/.env`，這樣即使服務沒有繼承你的 shell 環境也會載入。
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
       這會執行你的登入 shell，並且只匯入缺少的預期金鑰（永不覆寫）。對應的環境變數：`OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我設定了 COPILOT_GITHUB_TOKEN，但 models status 顯示「Shell env：關閉。」為什麼？'>
    `openclaw models status` 會回報是否已啟用 **shell 環境匯入**。「Shell env：關閉」**不**代表你的環境變數遺失 - 它只表示 OpenClaw 不會自動載入你的登入 shell。

    如果閘道以服務（launchd/systemd）執行，它不會繼承你的 shell 環境。修正方式是將權杖放入 `~/.openclaw/.env`、啟用 `env.shellEnv.enabled: true`，或將它加入設定 `env`（只會在缺少時套用），然後重新啟動閘道並再次檢查：

    ```bash
    openclaw models status
    ```

    Copilot 權杖會依此順序解析：`OPENCLAW_GITHUB_TOKEN`，接著 `COPILOT_GITHUB_TOKEN`，接著 `GH_TOKEN`，再接著 `GITHUB_TOKEN`。

    請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers) 和 [/environment](/zh-TW/help/environment)。

  </Accordion>
</AccordionGroup>

## 工作階段與多個聊天

<AccordionGroup>
  <Accordion title="如何開始新的對話？">
    以獨立訊息傳送 `/new` 或 `/reset`。請參閱[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>

  <Accordion title="如果我從不傳送 /new，工作階段會自動重設嗎？">
    會。預設重設政策是**每日**：工作階段會在閘道主機上設定的本機小時（`session.reset.atHour`，預設 `4`，0-23）輪替，依據目前工作階段的開始時間計算。也可以改用以閒置為基礎的重設，設定 `mode: "idle"` 和 `session.reset.idleMinutes`，這會在一段不活動時間後讓工作階段到期（依據最後一次真實互動，而不是心跳偵測/排程/exec 系統事件）。

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` 支援 `direct`（舊版別名 `dm`）、`group` 和 `thread`。當未設定 `session.reset`/`resetByType` 區塊時，舊版頂層 `session.idleMinutes` 仍可作為閒置模式預設值的相容別名使用。具有提供者擁有的作用中命令列介面工作階段的工作階段，不會被隱含的每日預設切斷。完整生命週期請參閱[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title="有沒有辦法組成一組 OpenClaw 執行個體團隊（一個 CEO 和許多代理）？">
    可以，透過**多代理路由**和**子代理**：一個協調代理，加上多個各自擁有工作區與模型的工作代理。

    這最好視為有趣的實驗 - 它很耗權杖，而且通常不如一個 Bot 搭配不同工作階段有效率。典型模型是你與一個 Bot 對話，使用不同工作階段進行平行工作，並在需要時產生子代理。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[代理命令列介面](/zh-TW/cli/agents)。

  </Accordion>

  <Accordion title="為什麼內容在任務中途被截斷？如何避免？">
    工作階段內容受限於模型視窗。長聊天、大型工具輸出或大量檔案都可能觸發壓縮或截斷。

    - 要求 Bot 摘要目前狀態並寫入檔案。
    - 在長任務前使用 `/compact`，切換主題時使用 `/new`。
    - 將重要內容保留在工作區，並要求 Bot 重新讀取。
    - 對長時間或平行工作使用子代理，讓主聊天保持較小。
    - 如果這經常發生，請選擇具有較大內容視窗的模型。

  </Accordion>

  <Accordion title="如何完全重設 OpenClaw 但保留安裝？">
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

    如果偵測到既有設定，入門設定也會提供**重設**；請參閱[入門設定（命令列介面）](/zh-TW/start/wizard)。如果你使用設定檔（`--profile` / `OPENCLAW_PROFILE`），請重設每個狀態目錄（預設 `~/.openclaw-<profile>`）。僅限開發的重設：`openclaw gateway --dev --reset` 會清除開發設定、憑證、工作階段和工作區。

  </Accordion>

  <Accordion title='我收到「內容太大」錯誤 - 如何重設或壓縮？'>
    - **壓縮**（保留對話，摘要較舊回合）：使用 `/compact` 或 `/compact <instructions>` 指引摘要。
    - **重設**（同一聊天鍵的新工作階段 ID）：`/new` 或 `/reset`。

    如果持續發生，請調整**工作階段修剪**（`agents.defaults.contextPruning`）以裁剪舊工具輸出，或使用具有較大內容視窗的模型。

    文件：[壓縮](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title='為什麼我看到「LLM 請求遭拒：messages.content.tool_use.input 欄位為必填」？'>
    提供者驗證錯誤：模型輸出了缺少必要 `input` 的 `tool_use` 區塊。通常表示工作階段歷史已過時或損毀（常發生在長討論串或工具/結構描述變更之後）。

    修正：使用 `/new` 開始新的工作階段（獨立訊息）。

  </Accordion>

  <Accordion title="為什麼我每 30 分鐘都會收到心跳偵測訊息？">
    心跳偵測預設每 **30m** 執行一次；若解析出的驗證模式是 Anthropic OAuth/權杖驗證（包含重用 Claude 命令列介面）且未設定 `heartbeat.every`，則為每 **1h** 執行一次。調整或停用：

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

    如果 `HEARTBEAT.md` 存在但實際上為空（只有空白行、Markdown/HTML 註解、ATX 標題、圍欄標記或空白清單項目存根），OpenClaw 會略過心跳偵測執行以節省 API 呼叫。如果檔案不存在，心跳偵測仍會執行，並由模型決定要做什麼。

    每個代理的覆寫使用 `agents.list[].heartbeat`。文件：[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要將「Bot 帳號」加入 WhatsApp 群組嗎？'>
    不需要。OpenClaw 會在**你自己的帳號**上執行 - 只要你在群組中，OpenClaw 就能看到它。預設情況下，群組回覆會被封鎖，直到你允許傳送者（`groupPolicy: "allowlist"`）。

    若要將群組回覆限制為只有你：

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
    最快方式：追蹤日誌並在群組中傳送測試訊息。

    ```bash
    openclaw logs --follow --json
    ```

    尋找以 `@g.us` 結尾的 `chatId`（或 `from`），例如 `1234567890-1234567890@g.us`。

    如果已設定/已允許列入清單，請從設定列出群組：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[目錄](/zh-TW/cli/directory)、[日誌](/zh-TW/cli/logs)。

  </Accordion>

  <Accordion title="為什麼 OpenClaw 不在群組中回覆？">
    兩個常見原因：提及閘門預設開啟（你必須 @提及 Bot，或符合 `mentionPatterns`），或者你設定了 `channels.whatsapp.groups` 但沒有 `"*"`，且該群組未列入允許清單。

    請參閱[群組](/zh-TW/channels/groups)和[群組訊息](/zh-TW/channels/group-messages)。

  </Accordion>

  <Accordion title="群組/討論串會與 DM 共用內容嗎？">
    直接聊天預設會合併到主工作階段。群組/頻道有自己的工作階段鍵，Telegram 主題 / Discord 討論串則是分開的工作階段。請參閱[群組](/zh-TW/channels/groups)和[群組訊息](/zh-TW/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以建立多少個工作區和代理？">
    沒有硬性限制 - 數十個甚至數百個都可以，但請注意：

    - **磁碟成長**：工作階段和逐字稿位於 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **權杖成本**：更多代理表示更多並行模型使用。
    - **營運負擔**：每個代理的驗證設定檔、工作區和頻道路由。

    每個代理保留一個**作用中**工作區（`agents.defaults.workspace`），如果磁碟成長就修剪舊工作階段，並使用 `openclaw doctor` 找出零散工作區和設定檔不符。

  </Accordion>

  <Accordion title="我可以同時執行多個 Bot 或聊天（Slack）嗎？應該如何設定？">
    可以，透過**多代理路由**：執行多個隔離代理，並依頻道/帳號/對等方路由傳入訊息。Slack 支援作為頻道，也可以繫結到特定代理。

    瀏覽器存取很強大，但不是「能做人類能做的任何事」- 反 Bot、CAPTCHA 和 MFA 仍可能阻擋自動化。若要取得最可靠的控制，請在主機上使用本機 Chrome MCP，或在實際執行瀏覽器的機器上使用 CDP。

    最佳實務設定：常駐閘道主機（VPS/Mac mini）、每個角色一個代理（繫結）、將 Slack 頻道繫結到這些代理，並在需要時透過 Chrome MCP 或節點使用本機瀏覽器。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[Slack](/zh-TW/channels/slack)、[瀏覽器](/zh-TW/tools/browser)、[節點](/zh-TW/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、容錯移轉與驗證設定檔

模型問答 - 預設值、選擇、別名、切換、容錯移轉、驗證設定檔 - 位於[模型常見問題](/zh-TW/help/faq-models)。

## 閘道：連接埠、「已在執行」與遠端模式

<AccordionGroup>
  <Accordion title="閘道使用哪個連接埠？">
    `gateway.port` 控制 WebSocket + HTTP（控制介面、鉤子等）的單一多工連接埠。優先順序：

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示「Runtime: running」但顯示「Connectivity probe: failed」？'>
    「Running」是**監督程式**的視角（launchd/systemd/schtasks）；連線探測則是命令列介面實際連到閘道 WebSocket。請信任 `openclaw gateway status` 中的這些行：`Probe target:`（探測使用的 URL）、`Listening:`（連接埠上實際綁定的內容）、`Last gateway error:`（程序仍存活但連接埠未監聽時的常見根本原因）。
  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示的「Config (cli)」和「Config (service)」不同？'>
    你正在編輯一個設定檔，但服務執行的是另一個設定檔（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不相符）。

    修正方式：從你希望服務使用的同一個 `--profile` / 環境執行：

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='「another gateway instance is already listening」是什麼意思？'>
    OpenClaw 會在啟動時立即綁定 WebSocket 監聽器（預設 `ws://127.0.0.1:18789`）來強制執行執行階段鎖定。如果綁定因 `EADDRINUSE` 失敗，就會拋出 `GatewayLockError`（「another gateway instance is already listening」）。

    修正方式：停止另一個執行個體、釋放連接埠，或使用 `openclaw gateway --port <port>` 執行。

  </Accordion>

  <Accordion title="如何以遠端模式執行 OpenClaw（用戶端連到其他位置的閘道）？">
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

    - `openclaw gateway` 只會在 `gateway.mode` 為 `local` 時啟動（或你傳入覆寫旗標）。
    - macOS app 會監看設定檔，並在這些值變更時即時切換模式。
    - `gateway.remote.token` / `.password` 只是用戶端遠端憑證；它們本身不會啟用本機閘道驗證。

  </Accordion>

  <Accordion title='控制介面顯示「unauthorized」（或持續重新連線）。現在該怎麼辦？'>
    你的閘道驗證路徑和介面的驗證方式不相符。

    事實（來自程式碼）：

    - 控制介面會將權杖保存在 `sessionStorage`，範圍限於目前瀏覽器分頁和所選的閘道 URL，因此同一分頁重新整理仍可繼續運作，而不需要長期保存 localStorage 權杖。
    - 發生 `AUTH_TOKEN_MISMATCH` 時，受信任的用戶端若閘道回傳重試提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`），可以嘗試一次有界限的快取裝置權杖重試。
    - 該快取權杖重試會重用與裝置權杖一起儲存的快取核准範圍；明確 `deviceToken` / 明確 `scopes` 呼叫端會保留其要求的範圍集合，而不是繼承快取範圍。
    - 在該重試路徑之外，連線驗證優先順序是明確共享權杖/密碼優先，接著是明確 `deviceToken`，再來是已儲存的裝置權杖，最後是啟動權杖。
    - 內建設定碼啟動會回傳具有 `scopes: []` 的節點裝置權杖，外加用於受信任行動裝置入門設定的有界限操作員交接權杖。操作員交接可以讀取設定期間的原生設定，但不會授予配對變更範圍或 `operator.admin`。

    修正方式：

    - 最快：`openclaw dashboard`（列印並複製儀表板 URL、嘗試開啟；若為無頭環境則顯示 SSH 提示）。
    - 還沒有權杖：`openclaw doctor --generate-gateway-token`。
    - 遠端：先用 `ssh -N -L 18789:127.0.0.1:18789 user@host` 建立通道，然後開啟 `http://127.0.0.1:18789/`。
    - 共享密鑰模式：設定 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然後在控制介面設定中貼上相符的密鑰。
    - Tailscale Serve 模式：確認 `gateway.auth.allowTailscale` 已啟用，而且你開啟的是 Serve URL，而不是會繞過 Tailscale 身分標頭的原始 loopback/tailnet URL。
    - 受信任代理模式：確認你是透過已設定的身分感知代理進入。同主機 loopback 代理也需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 一次重試後仍不相符：輪替/重新核准已配對的裝置權杖：
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - 輪替遭拒：已配對裝置工作階段只能輪替其**自己的**裝置，除非它們也有 `operator.admin`，且明確 `--scope` 值不能超過呼叫端目前的操作員範圍。
    - 仍卡住：`openclaw status --all` 加上[疑難排解](/zh-TW/gateway/troubleshooting)。驗證詳細資訊請見[儀表板](/zh-TW/web/dashboard)。

  </Accordion>

  <Accordion title="我設定了 gateway.bind tailnet，但它無法綁定且沒有任何項目監聽">
    `tailnet` 綁定會從你的網路介面選擇 Tailscale IP（100.64.0.0/10）。如果機器不在 Tailscale 上（或介面已關閉），就沒有可綁定的項目。

    修正方式：在該主機上啟動 Tailscale，或切換為 `gateway.bind: "loopback"` / `"lan"`。

    `tailnet` 是明確設定；`auto` 偏好 loopback。若只要綁定 tailnet，請使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主機上執行多個閘道嗎？">
    通常不行 - 一個閘道可以執行多個訊息通道和代理。只有在需要備援（例如救援機器人）或硬隔離時才使用多個閘道，並為每個閘道以自己的 `OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`agents.defaults.workspace` 和唯一的 `gateway.port` 進行隔離。

    建議：每個執行個體使用 `openclaw --profile <name> ...`（自動建立 `~/.openclaw-<name>`），在每個設定檔設定中使用唯一的 `gateway.port`（或手動執行時用 `--port`），並以 `openclaw --profile <name> gateway install` 建立每個設定檔的服務。

    設定檔也會為服務名稱加上後綴：launchd `ai.openclaw.<profile>`、systemd `openclaw-gateway-<profile>.service`、Windows `OpenClaw Gateway (<profile>)`。未限定的 `openclaw-gateway` systemd 單元只存在於預設設定檔；舊版重新命名前的 systemd 單元名稱 `clawdbot-gateway` 會自動遷移。

    完整指南：[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ 代碼 1008 是什麼意思？'>
    閘道是 **WebSocket 伺服器**，並預期第一則訊息是 `connect` 框架。其他任何內容都會以**代碼 1008**（政策違規）關閉連線。

    常見原因：你在瀏覽器中開啟了 **HTTP** URL，而不是使用 WS 用戶端；使用了錯誤的連接埠/路徑；或代理/通道移除了驗證標頭或傳送了非閘道請求。

    修正方式：使用 WS URL（`ws://<host>:18789`，或透過 HTTPS 使用 `wss://...`），不要在一般瀏覽器分頁中開啟 WS 連接埠，並在啟用驗證時於 `connect` 框架中包含權杖/密碼。命令列介面/終端介面範例：

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    協定詳細資訊：[閘道協定](/zh-TW/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 記錄與偵錯

<AccordionGroup>
  <Accordion title="記錄在哪裡？">
    檔案記錄（結構化）：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。透過 `logging.file` 設定穩定路徑；透過 `logging.level` 設定檔案記錄層級；透過 `--verbose` 和 `logging.consoleLevel` 設定主控台詳細程度。

    最快追蹤方式：

    ```bash
    openclaw logs --follow
    ```

    服務/監督程式記錄（閘道透過 launchd/systemd 執行時）：

    - macOS launchd stdout：`~/Library/Logs/openclaw/gateway.log`（設定檔使用 `gateway-<profile>.log`；stderr 會被抑制）。
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`。
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`。

    更多資訊請見[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何啟動/停止/重新啟動閘道服務？">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行閘道，`openclaw gateway --force` 可以收回連接埠。請見[閘道](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上關閉了終端機 - 要如何重新啟動 OpenClaw？">
    三種 Windows 安裝模式：

    **1) Windows Hub 本機設定**：原生 app 會管理本機 app 擁有的 WSL 閘道。從開始功能表或系統匣開啟 **OpenClaw Companion**，然後使用**閘道設定**或「連線」分頁。

    **2) 手動 WSL2 閘道**：閘道在 Linux 內執行。
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    如果你從未安裝服務，請以前景模式啟動：`openclaw gateway run`。

    **3) 原生 Windows 命令列介面/閘道**：直接在 Windows 中執行。
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    如果你手動執行（沒有服務）：`openclaw gateway run`。

    文件：[Windows](/zh-TW/platforms/windows)、[閘道服務執行手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="閘道已啟動，但回覆從未送達。我該檢查什麼？">
    快速健康檢查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常見原因：模型驗證未載入到**閘道主機**上（檢查 `models status`）、通道配對/允許清單阻擋回覆（檢查通道設定和記錄），或 WebChat/儀表板未使用正確權杖開啟。若為遠端，請確認通道/Tailscale 連線已啟動，且閘道 WebSocket 可連線。

    文件：[通道](/zh-TW/channels)、[疑難排解](/zh-TW/gateway/troubleshooting)、[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」- 現在該怎麼辦？'>
    通常表示介面失去了 WebSocket 連線。檢查：閘道是否正在執行（`openclaw gateway status`）？是否健康（`openclaw status`）？介面是否有正確的權杖（`openclaw dashboard`）？若為遠端，通道/Tailscale 連結是否已啟動？

    接著追蹤記錄：

    ```bash
    openclaw logs --follow
    ```

    文件：[儀表板](/zh-TW/web/dashboard)、[遠端存取](/zh-TW/gateway/remote)、[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失敗。我該檢查什麼？">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然後對應錯誤：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 選單項目太多。OpenClaw 已經會裁剪到 Telegram 限制並以較少指令重試，但有些選單項目仍可能被捨棄。請減少外掛/skill/自訂指令，或在不需要選單時停用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或類似網路錯誤：在 VPS 上或代理後方時，請確認允許對外 HTTPS，且 DNS 可解析 `api.telegram.org`。

    如果閘道是遠端，請檢查閘道主機上的記錄。

    文件：[Telegram](/zh-TW/channels/telegram)、[通道疑難排解](/zh-TW/channels/troubleshooting)。

  </Accordion>

  <Accordion title="終端介面沒有顯示任何輸出。我該檢查什麼？">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在終端介面中，使用 `/status` 查看目前狀態。如果你預期在聊天頻道收到回覆，請確認已啟用傳送（`/deliver on`）。

    文件：[終端介面](/zh-TW/web/tui)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止再啟動閘道？">
    如果你已安裝服務（macOS 上的 launchd、Linux 上的 systemd）：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    在前景中，以 Ctrl-C 停止，然後執行 `openclaw gateway run`。

    文件：[閘道服務執行手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 與 openclaw gateway">
    `openclaw gateway restart` 會重新啟動**背景服務**（launchd/systemd）。`openclaw gateway` 會在此終端機工作階段中以前景方式執行閘道。若你已安裝服務，請使用閘道子命令；若只是一次性執行，請使用不帶子命令的前景執行。
  </Accordion>

  <Accordion title="發生失敗時取得更多詳細資訊的最快方式">
    使用 `--verbose` 啟動閘道以取得更多主控台詳細資訊，然後檢查日誌檔，查看頻道驗證、模型路由與 RPC 錯誤。
  </Accordion>
</AccordionGroup>

## 媒體與附件

<AccordionGroup>
  <Accordion title="我的 skill 產生了圖片/PDF，但沒有送出任何內容">
    代理程式的外送附件必須使用結構化媒體欄位，例如 `media`、`mediaUrl`、`path` 或 `filePath`。請參閱 [OpenClaw assistant 設定](/zh-TW/start/openclaw)與[代理程式傳送](/zh-TW/tools/agent-send)。

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    也請檢查：目標頻道支援外送媒體，且未被允許清單封鎖；檔案在供應商的大小限制內（圖片會調整至最大邊長 2048px）；`tools.fs.workspaceOnly=true` 會將本機路徑傳送限制在工作區、暫存/媒體儲存區，以及經沙箱驗證的檔案；`tools.fs.workspaceOnly=false`（預設）允許結構化本機媒體傳送使用代理程式已可讀取的主機本機檔案，適用於媒體加上安全文件類型（圖片、音訊、影片、PDF、Office 文件，以及經驗證的文字文件，例如 Markdown/MD、TXT、JSON、YAML/YML）。這不是秘密掃描器 - 當擴充功能與內容驗證相符時，代理程式可讀取的 `secret.txt` 或 `config.json` 可以被附加。請將敏感檔案放在代理程式可讀取路徑之外，或保留 `tools.fs.workspaceOnly=true` 以使用更嚴格的本機路徑傳送。

    請參閱[圖片](/zh-TW/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全性與存取控制

<AccordionGroup>
  <Accordion title="將 OpenClaw 暴露給傳入私訊安全嗎？">
    將傳入私訊視為不受信任的輸入。預設值會降低風險：

    - 支援私訊頻道上的預設行為是**配對**：未知寄件者會收到配對碼，且其訊息不會被處理。使用 `openclaw pairing approve --channel <channel> [--account <id>] <code>` 核准。待處理請求上限為**每個頻道 3 個**；如果代碼未送達，請檢查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公開開放私訊需要明確選擇加入（`dmPolicy: "open"` 與允許清單 `"*"`）。

    執行 `openclaw doctor` 以顯示高風險的私訊政策。

  </Accordion>

  <Accordion title="提示注入只對公開 Bot 是問題嗎？">
    不是。提示注入與**不受信任的內容**有關，而不只是誰能私訊 Bot。如果你的 assistant 讀取外部內容（網頁搜尋/擷取、瀏覽器頁面、電子郵件、文件、附件、貼上的日誌），該內容可能帶有嘗試劫持模型的指令，即使你是唯一的寄件者也是如此。

    最大的風險是在啟用工具時：模型可能被誘導外洩上下文，或代表你呼叫工具。降低影響範圍：

    - 使用唯讀或停用工具的「讀取器」代理程式來摘要不受信任的內容
    - 對啟用工具的代理程式關閉 `web_search` / `web_fetch` / `browser`
    - 也將解碼後的檔案/文件文字視為不受信任：OpenResponses `input_file` 與媒體附件擷取都會將擷取出的文字包在明確的外部內容邊界標記中，而不是傳遞原始檔案文字
    - 使用沙箱並採用嚴格的工具允許清單

    詳情：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw 因為使用 TypeScript/節點 而不是 Rust/WASM，所以較不安全嗎？">
    語言與執行階段很重要，但不是個人代理程式的主要風險。實際風險是閘道暴露、誰能傳訊給 Bot、提示注入、工具範圍、憑證處理、瀏覽器存取、exec 存取，以及第三方 skill/外掛信任。

    Rust 與 WASM 可為某些程式碼類別提供更強的隔離，但無法解決提示注入、不良允許清單、公開閘道暴露、過寬的工具，或已登入敏感帳號的瀏覽器設定檔。請將這些視為主要控制：保持閘道私有或經驗證、對私訊/群組使用配對與允許清單、對不受信任輸入拒絕或沙箱化高風險工具、只安裝可信任的外掛與 skills，並在設定變更後執行 `openclaw security audit --deep`。

    詳情：[安全性](/zh-TW/gateway/security)、[沙箱化](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="我看到關於暴露 OpenClaw 執行個體的報告。我該檢查什麼？">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    較安全的基準：閘道綁定到 `loopback`，或只透過經驗證的私有存取暴露（tailnet、SSH 通道、權杖/密碼驗證，或正確設定的可信任代理）；私訊採用 `pairing` 或 `allowlist` 模式；除非每位成員都可信任，否則群組需加入允許清單並以提及作為閘門；對會讀取不受信任內容的代理程式，拒絕或嚴格限定高風險工具（`exec`、`browser`、`gateway`、`cron`）；在工具執行需要較小影響範圍時啟用沙箱化。

    首先要修正的發現是未驗證的公開綁定、開放私訊/群組且帶有工具，以及暴露的瀏覽器控制。詳情：[openclaw security audit](/zh-TW/gateway/security#openclaw-security-audit)。

  </Accordion>

  <Accordion title="ClawHub skills 與第三方外掛可以安全安裝嗎？">
    將第三方 skills 與外掛視為你選擇信任的程式碼。ClawHub skill 頁面會在安裝前顯示掃描狀態，但掃描不是完整的安全邊界。OpenClaw 在外掛/skill 安裝或更新期間，不會執行內建的本機危險程式碼阻擋；請使用操作者擁有的 `security.installPolicy` 進行本機允許/封鎖決策。

    較安全的模式：偏好可信任作者與釘選版本，啟用前先閱讀 skill/外掛，將外掛/skill 允許清單維持在狹窄範圍，在具最少工具的沙箱中執行不受信任輸入工作流程，並避免給第三方程式碼廣泛的檔案系統、exec、瀏覽器或秘密存取權。

    詳情：[Skills](/zh-TW/tools/skills)、[外掛](/zh-TW/tools/plugin)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我的 Bot 應該有自己的電子郵件、GitHub 帳號或電話號碼嗎？">
    對大多數設定而言，是的。以獨立帳號與電話號碼隔離 Bot，可在發生問題時降低影響範圍，並讓你更容易輪替憑證或撤銷存取，而不影響個人帳號。

    從小範圍開始：只授予你實際需要的工具與帳號存取權，之後如有需要再擴展。

    文件：[安全性](/zh-TW/gateway/security)、[配對](/zh-TW/channels/pairing)。

  </Accordion>

  <Accordion title="我可以讓它自主處理我的簡訊嗎？這樣安全嗎？">
    我們**不**建議讓它完全自主處理你的個人訊息。最安全的模式：將私訊保持在**配對模式**或嚴格允許清單中；若它應代表你傳訊，請使用**獨立號碼或帳號**；並讓它先草擬，再由你**核准後才傳送**。

    若要實驗，請在專用且隔離的帳號上進行。請參閱[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我可以用較便宜的模型來處理個人 assistant 任務嗎？">
    可以，**前提是**代理程式只用於聊天且輸入可信任。較小等級的模型更容易受指令劫持影響，因此請避免用於啟用工具的代理程式，或讀取不受信任內容時使用。若你必須使用較小的模型，請鎖定工具並在沙箱內執行。請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 執行了 /start，但沒有收到配對碼">
    只有當未知寄件者傳訊給 Bot，且已啟用 `dmPolicy: "pairing"` 時，才會傳送配對碼；`/start` 本身不會產生代碼。

    檢查待處理請求：

    ```bash
    openclaw pairing list telegram
    ```

    若要立即存取，請將你的寄件者 ID 加入允許清單，或為該帳號設定 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它會傳訊給我的聯絡人嗎？配對如何運作？">
    不會。預設 WhatsApp 私訊政策是**配對**。未知寄件者只會取得配對碼；其訊息**不會被處理**。OpenClaw 只會回覆它收到的聊天，或回覆你明確觸發的傳送。

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    精靈的電話號碼提示會設定你的**允許清單/擁有者**，讓你自己的私訊被允許；它不會用於自動傳送。在你的個人 WhatsApp 號碼上，使用該號碼並啟用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任務，以及「它不會停止」

<AccordionGroup>
  <Accordion title="如何停止內部系統訊息顯示在聊天中？">
    大多數內部/工具訊息只會在該工作階段啟用**詳細**、**追蹤**或**推理**時出現。

    在你看到它的聊天中修正：

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    仍然吵雜：檢查 Control UI 中的工作階段設定，並將詳細設定為**繼承**；確認你沒有使用在設定中有 `verboseDefault: "on"` 的 Bot 設定檔。

    文件：[思考與詳細輸出](/zh-TW/tools/thinking)、[安全性](/zh-TW/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在執行的任務？">
    將以下任一內容**作為獨立訊息**（不含斜線）傳送以觸發中止：`stop`、`stop action`、`stop current action`、`stop run`、`stop current run`、`stop agent`、`stop the agent`、`stop openclaw`、`openclaw stop`、`stop don't do anything`、`stop do not do anything`、`stop doing anything`、`do not do that`、`please stop`、`stop please`、`abort`、`esc`、`wait`、`exit`、`interrupt`、`halt`。常見非英文觸發詞（法文、德文、西班牙文、中文、日文、印地文、阿拉伯文、俄文）也可使用。

    對於由 exec 工具啟動的背景程序，請要求代理程式執行：

    ```text
    process action:kill sessionId:XXX
    ```

    大多數斜線命令必須以 `/` 開頭作為**獨立**訊息傳送，但少數快捷方式（例如 `/status`）也可供允許清單寄件者在行內使用。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title='如何從 Telegram 傳送 Discord 訊息？（「跨上下文傳訊遭拒」）'>
    OpenClaw 預設會封鎖**跨供應商**傳訊。如果工具呼叫綁定到 Telegram，它不會傳送到 Discord，除非你明確允許，而且這會立即生效，不需要重新啟動閘道：

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

  </Accordion>

  <Accordion title='為什麼感覺機器人會「忽略」密集連發的訊息？'>
    預設情況下，執行中的提示會被導向作用中的執行。使用 `/queue` 選擇作用中執行行為：

    - `steer`（預設）- 在下一個模型邊界引導作用中的執行。
    - `followup` - 將訊息排入佇列，並在目前執行結束後逐一執行。
    - `collect` - 將相容的訊息排入佇列，並在目前執行結束後回覆一次。
    - `interrupt` - 中止目前執行並重新開始。

    將選項加入排入佇列的模式，例如 `debounce:0.5s cap:25 drop:summarize`。請參閱[命令佇列](/zh-TW/concepts/queue)和[引導佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='使用 API 金鑰時，Anthropic 的預設模型是什麼？'>
    憑證與模型選擇是分開的。設定 `ANTHROPIC_API_KEY`（或在 auth profiles 中儲存 Anthropic API 金鑰）會啟用驗證，但實際的預設模型取決於你在 `agents.defaults.model.primary` 中設定的內容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` 表示閘道在執行中代理程式預期的 `auth-profiles.json` 中找不到 Anthropic 憑證。
  </Accordion>
</AccordionGroup>

---

還是卡住了嗎？請到 [Discord](https://discord.com/invite/clawd) 詢問，或開啟 [GitHub 討論](https://github.com/openclaw/openclaw/discussions)。

## 相關

- [首次執行常見問題](/zh-TW/help/faq-first-run) - 安裝、初始設定、驗證、訂閱、早期失敗
- [模型常見問題](/zh-TW/help/faq-models) - 模型選擇、容錯移轉、auth profiles
- [疑難排解](/zh-TW/help/troubleshooting) - 以症狀為先的分流
