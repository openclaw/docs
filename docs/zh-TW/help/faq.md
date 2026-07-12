---
read_when:
    - 回答常見的設定、安裝、初始設定或執行階段支援問題
    - 在深入偵錯前分流處理使用者回報的問題
summary: OpenClaw 設定、配置與使用的常見問題
title: 常見問題
x-i18n:
    generated_at: "2026-07-12T14:36:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80b94b9d403d04cde5c734927502393417d5f1bfd50c2505b6b4fdcfcdc9f524
    source_path: help/faq.md
    workflow: 16
---

快速解答，加上針對實際環境設定（本機開發、VPS、多代理程式、OAuth/API 金鑰、模型容錯移轉）的深入疑難排解。若要進行執行階段診斷，請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。如需完整的設定參考，請參閱[設定](/zh-TW/gateway/configuration)。

## 發生問題時的前 60 秒

<Steps>
  <Step title="快速狀態">
    ```bash
    openclaw status
    ```
    快速的本機摘要：作業系統與更新、閘道/服務的可連線性、代理程式/工作階段、供應商設定與執行階段問題（閘道可連線時）。
  </Step>
  <Step title="可貼上分享的報告（可安全分享）">
    ```bash
    openclaw status --all
    ```
    唯讀診斷，包含日誌尾端內容（權杖已遮蔽）。
  </Step>
  <Step title="常駐程式與連接埠狀態">
    ```bash
    openclaw gateway status
    ```
    顯示監督程式的執行狀態與 RPC 可連線性、探測目標 URL，以及服務可能使用的設定。
  </Step>
  <Step title="深入探測">
    ```bash
    openclaw status --deep
    ```
    即時閘道健康狀態探測，並在支援時包含頻道探測（需要可連線的閘道）。請參閱[健康狀態](/zh-TW/gateway/health)。
  </Step>
  <Step title="持續查看最新日誌">
    ```bash
    openclaw logs --follow
    ```
    如果 RPC 無法運作，請改用：
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    檔案日誌與服務日誌彼此分開；請參閱[日誌記錄](/zh-TW/logging)和[疑難排解](/zh-TW/gateway/troubleshooting)。
  </Step>
  <Step title="執行診斷程式（修復）">
    ```bash
    openclaw doctor
    ```
    修復/遷移設定與狀態，然後執行健康狀態檢查。請參閱[診斷程式](/zh-TW/gateway/doctor)。
  </Step>
  <Step title="閘道快照（僅限 WS）">
    ```bash
    openclaw health --json
    openclaw health --verbose   # 發生錯誤時顯示目標 URL 與設定路徑
    ```
    向執行中的閘道要求完整快照。請參閱[健康狀態](/zh-TW/gateway/health)。
  </Step>
</Steps>

## 快速開始與首次執行設定

首次執行的常見問題與解答（安裝、初始設定、驗證路徑、訂閱、初始失敗）位於[首次執行常見問題](/zh-TW/help/faq-first-run)。

## OpenClaw 是什麼？

<AccordionGroup>
  <Accordion title="用一段話說明 OpenClaw 是什麼？">
    OpenClaw 是你在自己裝置上執行的個人 AI 助理。它能在你已使用的訊息平台上回覆（Discord、Google Chat、iMessage、Mattermost、Signal、Slack、Telegram、WebChat、WhatsApp，以及 QQ Bot 等隨附頻道外掛），也能在支援的平台上提供語音功能與即時 Canvas。**閘道**是持續運作的控制平面；助理本身才是產品。
  </Accordion>

  <Accordion title="價值主張">
    OpenClaw 不「只是 Claude 的包裝程式」。它是**本機優先的控制平面**，可在**你自己的硬體**上執行功能強大的助理，並能透過你已使用的聊天應用程式存取，提供具狀態的工作階段、記憶與工具，而不必把你的工作流程交給託管式 SaaS。

    - **你的裝置、你的資料**：在任何你想要的位置（Mac、Linux、VPS）執行閘道，並將工作區與工作階段記錄保留在本機。
    - **真正的頻道，而非網頁沙箱**：Discord/iMessage/Signal/Slack/Telegram/WhatsApp 等，以及支援平台上的行動裝置語音和 Canvas。
    - **不受模型限制**：使用 Anthropic、MiniMax、OpenAI、OpenRouter 等，並支援各代理程式的路由與容錯移轉。
    - **僅限本機的選項**：執行本機模型，讓所有資料都能留在你的裝置上。
    - **多代理程式路由**：依頻道、帳號或任務分隔代理程式，每個代理程式都有自己的工作區與預設值。
    - **開放原始碼且可自由修改**：不受供應商綁定，可自行檢視、擴充與託管。

    文件：[閘道](/zh-TW/gateway)、[頻道](/zh-TW/channels)、[多代理程式](/zh-TW/concepts/multi-agent)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我剛完成設定，首先該做什麼？">
    適合作為起點的專案：建立網站（WordPress、Shopify 或靜態網站）；製作行動應用程式原型（大綱、畫面、API 規劃）；整理檔案與資料夾；連接 Gmail 並自動產生摘要或後續追蹤。

    它可以處理大型任務，但將任務拆成多個階段，並使用子代理程式平行處理，效果最佳。

  </Accordion>

  <Accordion title="OpenClaw 最常見的五種日常用途是什麼？">
    - **個人簡報**：摘要收件匣、行事曆，以及你關注的新聞。
    - **研究與草擬**：快速研究、製作摘要，以及建立電子郵件或文件的初稿。
    - **提醒與後續追蹤**：由排程或心跳偵測驅動的提示與檢查清單。
    - **瀏覽器自動化**：填寫表單、收集資料，以及重複執行網頁任務。
    - **跨裝置協調**：從手機傳送任務，讓閘道在伺服器上執行，再於聊天中接收結果。

  </Accordion>

  <Accordion title="OpenClaw 能協助 SaaS 開發潛在客戶、推廣、廣告與部落格嗎？">
    可以，適用於**研究、資格篩選與草擬**：掃描網站、建立候選清單、摘要潛在客戶資訊，以及撰寫推廣內容或廣告文案草稿。

    進行**推廣或廣告活動**時，請保留人工審核環節。避免傳送垃圾訊息、遵守當地法律與平台政策，並在傳送前審查所有內容。讓 OpenClaw 負責草擬；由你核准。

    文件：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="相較於 Claude Code，OpenClaw 在網頁開發方面有哪些優勢？">
    OpenClaw 是**個人助理**與協調層，而不是 IDE 的替代品。若要在程式碼儲存庫內進行最快速的直接編碼迴圈，請使用 Claude Code 或 Codex。若需要持久記憶、跨裝置存取與工具協調，則使用 OpenClaw。

    - 跨工作階段保留持久記憶與工作區。
    - 多平台存取（Telegram、WhatsApp、終端介面、WebChat）。
    - 工具協調（瀏覽器、檔案、排程、掛鉤）。
    - 持續運作的閘道（在 VPS 上執行，從任何位置互動）。
    - 用於本機瀏覽器/螢幕/攝影機/執行操作的節點。

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)。

  </Accordion>
</AccordionGroup>

## Skills 與自動化

<AccordionGroup>
  <Accordion title="如何自訂 Skills 而不讓儲存庫出現未提交的變更？">
    使用受管理的覆寫，而非編輯儲存庫中的副本。將變更放入 `~/.openclaw/skills/<name>/SKILL.md`（或透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增資料夾）。優先順序：`<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> 隨附項目 -> `skills.load.extraDirs`，因此受管理的覆寫可優先於隨附的 Skills，而不需修改 git。若要進行全域安裝，但只讓部分代理程式看到，請將共用副本保留在 `~/.openclaw/skills`，並使用 `agents.defaults.skills` / `agents.list[].skills` 控制可見性。只有值得貢獻至上游的編輯，才應針對儲存庫副本提出 PR。
  </Accordion>

  <Accordion title="可以從自訂資料夾載入 Skills 嗎？">
    可以：透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增目錄（在上述順序中優先權最低）。`clawhub` 預設安裝至 `./skills`，OpenClaw 會在下一個工作階段將其視為 `<workspace>/skills`。若要限制為只有特定代理程式可見，請搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何為不同任務使用不同的模型或設定？">
    支援的模式：

    - **排程工作**：隔離的工作可為每項工作設定 `model` 覆寫。
    - **代理程式**：將任務路由至不同的代理程式，並分別設定不同的預設模型、思考層級與串流參數。
    - **隨選切換**：可隨時使用 `/model` 切換目前工作階段的模型。

    範例——相同模型、不同的各代理程式設定：

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

    將共用的各模型預設值放入 `agents.defaults.models["provider/model"].params`，再將代理程式專屬覆寫放入扁平的 `agents.list[].params`。請勿在巢狀的 `agents.list[].models["provider/model"].params` 下重複相同模型；該路徑用於各代理程式的模型目錄與執行階段覆寫。

    請參閱[排程工作](/zh-TW/automation/cron-jobs)、[多代理程式路由](/zh-TW/concepts/multi-agent)、[設定](/zh-TW/gateway/config-agents)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="機器人在處理繁重工作時會凍結。如何卸載這些工作？">
    對長時間或平行任務使用**子代理程式**：它們會在各自的工作階段中執行、傳回摘要，並讓你的主要聊天保持可回應。要求機器人「為此任務產生一個子代理程式」，或使用 `/subagents`。使用 `/status` 查看閘道目前是否忙碌。

    長時間任務與子代理程式都會消耗權杖；如果在意成本，可透過 `agents.defaults.subagents.model` 為子代理程式設定較便宜的模型。

    文件：[子代理程式](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上與討論串綁定的子代理程式工作階段如何運作？">
    將 Discord 討論串綁定至子代理程式或工作階段目標，讓其中的後續訊息持續傳送至該綁定工作階段。

    - 使用 `sessions_spawn` 產生，並設定 `thread: true`（若要持續後續互動，可選擇設定 `mode: "session"`）。
    - 或使用 `/focus <target>` 手動綁定。
    - `/agents` 可檢查綁定狀態。
    - `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自動取消焦點。
    - `/unfocus` 會解除討論串的綁定。

    設定：`session.threadBindings.enabled`（全域開關）、`session.threadBindings.idleHours`（預設為 `24`，`0` 表示停用）、`session.threadBindings.maxAgeHours`（預設為 `0`，表示沒有硬性上限），以及各頻道覆寫 `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`。`channels.discord.threadBindings.spawnSessions` 控制產生時的自動綁定（預設為 `true`）。

    文件：[子代理程式](/zh-TW/tools/subagents)、[Discord](/zh-TW/channels/discord)、[設定參考](/zh-TW/gateway/configuration-reference)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="子代理程式已完成，但完成通知送到錯誤的位置，或根本未發布。我該檢查什麼？">
    檢查解析後的請求者路由：

    - 當存在綁定的討論串或對話路由時，完成模式的子代理程式傳遞會優先使用該路由。
    - 如果完成來源只帶有頻道，OpenClaw 會改用請求者工作階段已儲存的路由（`lastChannel` / `lastTo` / `lastAccountId`），讓直接傳遞仍可成功。
    - 沒有綁定路由，也沒有可用的已儲存路由：直接傳遞可能會失敗，而結果將改為排入工作階段傳遞佇列，而非立即發布。
    - 無效或過時的目標也可能強制改用佇列，或導致最終傳遞失敗。
    - 如果子工作階段最後一則可見的助理回覆恰好是 `NO_REPLY` / `no_reply` 或 `ANNOUNCE_SKIP`，OpenClaw 會刻意抑制公告，而不是發布先前已過時的進度。

    偵錯：`openclaw tasks show <lookup>`，其中 `<lookup>` 是任務 ID、執行 ID 或工作階段金鑰。

    文件：[子代理程式](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)、[工作階段工具](/zh-TW/concepts/session-tool)。

  </Accordion>

  <Accordion title="排程或提醒沒有觸發。我該檢查什麼？">
    排程在閘道程序內執行；如果閘道未持續運作，就不會觸發。

    - 確認排程已啟用（`cron.enabled`），且未設定 `OPENCLAW_SKIP_CRON`。
    - 確認閘道全天候執行（不會進入睡眠或重新啟動）。
    - 驗證工作的時區（`--tz` 與主機時區）。

    偵錯：
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="排程已觸發，但沒有任何內容傳送至頻道。為什麼？">
    請檢查傳送模式：

    - `--no-deliver` / `delivery.mode: "none"`：預期不會由執行器進行備援傳送。
    - 缺少或無效的公告目標（`channel` / `to`）：執行器已略過對外傳送。
    - 頻道驗證失敗（`unauthorized`、`Forbidden`）：執行器已嘗試傳送，但遭認證資訊阻擋。
    - 僅包含靜默隔離結果（`NO_REPLY` / `no_reply`）會被視為刻意不傳送，因此佇列中的備援傳送也會遭到抑制。

    對於隔離的排程工作，只要有可用的聊天路由，代理程式仍可透過 `message` 工具直接傳送。`--announce` 只會控制執行器針對代理程式尚未自行傳送之最終文字的備援傳送。

    偵錯：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="為什麼隔離的排程執行會切換模型或重試一次？">
    這是即時模型切換路徑，而非重複排程。隔離的排程會持久保存執行階段的模型移交，並在目前執行擲出 `LiveSessionModelSwitchError` 時重試；重試前會保留切換後的提供者／模型（以及任何切換後的驗證設定檔覆寫）。

    模型選擇優先順序：首先是 Gmail 鉤子的模型覆寫（`hooks.gmail.model`），接著是每項工作的 `model`，再來是任何已儲存的排程工作階段模型覆寫，最後才是一般代理程式／預設模型選擇。

    重試迴圈的上限為首次嘗試加上 2 次切換重試；之後排程會中止，而非無限循環。

    偵錯：
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[排程命令列介面](/zh-TW/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 Skills？">
    請使用原生 `openclaw skills` 命令，或將 Skills 放入你的工作區；Linux 不提供 macOS 的 Skills 使用者介面。你可以前往 [https://clawhub.ai](https://clawhub.ai) 瀏覽 Skills。

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

    原生 `openclaw skills install` 預設會寫入目前工作區的 `skills/` 目錄。加入 `--global` 可安裝至共用的受管理 Skills 目錄，供所有本機代理程式使用。只有在要發布或同步自己的 Skills 時，才需另外安裝 `clawhub` 命令列介面。使用 `agents.defaults.skills` 或 `agents.list[].skills` 可限制哪些代理程式能看到共用 Skills。

  </Accordion>

  <Accordion title="OpenClaw 能否依排程執行任務，或在背景持續執行？">
    可以，透過閘道排程器：

    - **排程工作**：用於定時或週期性任務（重新啟動後仍會保留）。
    - **心跳偵測**：用於主要工作階段的定期檢查。
    - **隔離工作**：用於自主代理程式發布摘要或傳送至聊天。

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)、[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以從 Linux 執行僅支援 Apple macOS 的 Skills 嗎？">
    無法直接執行。macOS Skills 會受到 `metadata.openclaw.os` 與必要二進位檔的限制，而且只有在**閘道主機**上符合資格時才會載入。在 Linux 上，僅支援 `darwin` 的 Skills（`apple-notes`、`apple-reminders`、`things-mac`）不會載入，除非你覆寫此限制。

    有三種支援的模式：

    **選項 A：在 Mac 上執行閘道（最簡單）**。在具有 macOS 二進位檔的環境中執行閘道，然後從 Linux 透過[遠端模式](#gateway-ports-already-running-and-remote-mode)或 Tailscale 連線。由於閘道主機是 macOS，Skills 會正常載入。

    **選項 B：使用 macOS 節點（不使用 SSH）**。在 Linux 上執行閘道、配對一個 macOS 節點（選單列應用程式），並在 Mac 上將 **Node Run Commands** 設為 "Always Ask" 或 "Always Allow"。當節點上存在必要二進位檔時，OpenClaw 會將僅支援 macOS 的 Skills 視為符合資格；代理程式會透過 `nodes` 工具執行這些 Skills。使用 "Always Ask" 時，在提示中核准 "Always Allow" 會將該命令加入允許清單。

    **選項 C：透過 SSH 代理 macOS 二進位檔（進階）**。讓閘道繼續在 Linux 上執行，但讓必要的命令列介面二進位檔解析至在 Mac 上執行的 SSH 包裝程式，然後覆寫 Skill 以允許 Linux，使其保持符合資格。

    1. 為二進位檔建立 SSH 包裝程式（範例：Apple Notes 的 `memo`）：
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. 將包裝程式放入 Linux 主機的 `PATH`（例如 `~/bin/memo`）。
    3. 覆寫 Skill 中繼資料（工作區或 `~/.openclaw/skills`），以允許 Linux：
       ```markdown
       ---
       name: apple-notes
       description: 透過 macOS 上的 memo 命令列介面管理 Apple Notes。
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. 啟動新的工作階段，讓 Skills 快照重新整理。

  </Accordion>

  <Accordion title="你們有 Notion 或 HeyGen 整合嗎？">
    目前未內建。可用選項：

    - **自訂 Skill／外掛**：最適合可靠的 API 存取（兩者都有 API）。
    - **瀏覽器自動化**：無須撰寫程式碼即可運作，但速度較慢，也較不穩定。

    若要管理代理商形式的個別客戶情境：請為每位客戶保留一個 Notion 頁面（情境＋偏好設定＋進行中的工作），並要求代理程式在工作階段開始時擷取該頁面。

    若需要原生整合，請提出功能請求，或針對這些 API 建立 Skill。

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    原生安裝會放入目前工作區的 `skills/` 目錄；使用 `--global` 可供所有本機代理程式使用，或設定 `agents.defaults.skills`／`agents.list[].skills` 來限制可見範圍。部分 Skills 預期使用透過 Homebrew 安裝的二進位檔；在 Linux 上，這表示 Linuxbrew。

    請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config)、[ClawHub](/tools/clawhub)。

  </Accordion>

  <Accordion title="如何讓 OpenClaw 使用我現有已登入的 Chrome？">
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

    這可以使用本機主機上的瀏覽器或已連線的瀏覽器節點。如果閘道在其他位置執行，請在瀏覽器所在的機器上執行節點主機，或改用遠端 CDP。

    與受管理的 `openclaw` 設定檔相比，`existing-session` / `user` 設定檔目前有以下限制：

    - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 必須使用快照參照，而非 CSS 選取器。
    - 上傳鉤子必須使用 `ref` 或 `inputRef`，且一次只能上傳一個檔案，不支援 CSS `element`。
    - `responsebody`、PDF 匯出、下載攔截和批次動作仍須使用受管理的瀏覽器路徑。

    如需完整比較，請參閱[瀏覽器](/zh-TW/tools/browser#existing-session-via-chrome-devtools-mcp)。

  </Accordion>
</AccordionGroup>

## 沙箱與記憶

<AccordionGroup>
  <Accordion title="是否有專門的沙箱文件？">
    有：[沙箱](/zh-TW/gateway/sandboxing)。如需 Docker 專用設定（在 Docker 中執行完整閘道或使用沙箱映像檔），請參閱 [Docker](/zh-TW/install/docker)。
  </Accordion>

  <Accordion title="Docker 感覺功能有限，如何啟用完整功能？">
    預設映像檔以安全性為優先，並以 `node` 使用者身分執行，因此不包含系統套件、Homebrew 和內建瀏覽器。若要使用更完整的設定：

    - 使用 `OPENCLAW_HOME_VOLUME` 保存 `/home/node`，讓快取可持續保留。
    - 使用 `OPENCLAW_IMAGE_APT_PACKAGES` 將系統相依套件建置至映像檔中。
    - 透過內建的命令列介面安裝 Playwright 瀏覽器：`node /app/node_modules/playwright-core/cli.js install chromium`。
    - 設定 `PLAYWRIGHT_BROWSERS_PATH` 並保存該路徑。

    文件：[Docker](/zh-TW/install/docker)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="我可以使用同一個代理程式，讓私人訊息保持私密，但讓群組公開並在沙箱中執行嗎？">
    可以，前提是私人流量為**私人訊息**，公開流量為**群組**。設定 `agents.defaults.sandbox.mode: "non-main"`，讓群組／頻道工作階段（非主要金鑰）在已設定的沙箱後端中執行，而主要私人訊息工作階段則留在主機上。啟用沙箱後，Docker 是預設後端。透過 `tools.sandbox.tools` 限制沙箱工作階段中可用的工具。

    設定逐步指南：[群組：私人訊息個人使用 + 公開群組](/zh-TW/channels/groups#pattern-personal-dms-public-groups-single-agent)。主要參考資料：[閘道設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)。

  </Accordion>

  <Accordion title="如何將主機資料夾掛載至沙箱？">
    將 `agents.defaults.sandbox.docker.binds` 設為 `["host:container:mode"]`（例如 `"/home/user/src:/src:ro"`）。全域與各代理程式的繫結會合併；當 `scope: "shared"` 時，會忽略各代理程式的繫結。任何敏感內容都應使用 `:ro`；繫結會繞過沙箱檔案系統的隔離界線。

    OpenClaw 會同時根據正規化路徑，以及透過最深層既有祖先解析出的標準路徑來驗證繫結來源，因此即使最終路徑區段尚不存在，透過符號連結父目錄逸出也會採取封閉式失敗。

    請參閱[沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts)和[沙箱、工具原則與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)。

  </Accordion>

  <Accordion title="記憶如何運作？">
    OpenClaw 的記憶是代理程式工作區中的 Markdown 檔案：每日筆記位於 `memory/YYYY-MM-DD.md`，經整理的長期筆記位於 `MEMORY.md`（僅限主要／私人工作階段）。

    OpenClaw 也會在壓縮摘要對話前，靜默執行**壓縮前記憶寫入**，提醒模型先寫入可持續保留的筆記。這只會在工作區可寫入時執行（唯讀沙箱會略過）；可透過 `agents.defaults.compaction.memoryFlush.enabled: false` 停用。請參閱[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="記憶總是忘記事情。如何讓它記住？">
    要求機器人**將該事實寫入記憶**：長期筆記放在 `MEMORY.md`，短期脈絡放在 `memory/YYYY-MM-DD.md`。提醒模型儲存記憶通常就能解決問題。如果它仍持續忘記，請確認閘道每次執行時都使用相同的工作區。

    文件：[記憶](/zh-TW/concepts/memory)、[代理程式工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="記憶會永久保留嗎？有哪些限制？">
    記憶檔案儲存在磁碟上，會持續保留直到刪除為止；限制取決於你的儲存空間，而非模型。**工作階段脈絡**仍受模型脈絡視窗限制，因此長時間對話可能會被壓縮或截斷——這正是記憶搜尋存在的原因，它只會將相關部分重新載入脈絡。

    文件：[記憶](/zh-TW/concepts/memory)、[脈絡](/zh-TW/concepts/context)。

  </Accordion>

  <Accordion title="語意記憶搜尋需要 OpenAI API 金鑰嗎？">
    只有在使用 **OpenAI 嵌入向量**時才需要，而它是預設供應商。Codex OAuth 涵蓋聊天／補全，但**不會**授予嵌入向量存取權，因此使用 Codex 登入（OAuth 或 Codex 命令列介面登入）不會啟用語意記憶搜尋。OpenAI 嵌入向量仍需要真正的 API 金鑰（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    若要維持本機運作，請設定 `agents.defaults.memorySearch.provider: "local"`（GGUF/llama.cpp）。其他支援的供應商：Bedrock、DeepInfra、Gemini（`GEMINI_API_KEY` 或 `memorySearch.remote.apiKey`）、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI 相容供應商，以及 Voyage。設定詳情請參閱[記憶](/zh-TW/concepts/memory)和[記憶搜尋](/zh-TW/concepts/memory-search)。

  </Accordion>
</AccordionGroup>

## 資料在磁碟上的位置

<AccordionGroup>
  <Accordion title="搭配 OpenClaw 使用的所有資料都會儲存在本機嗎？">
    不會：**OpenClaw 自身的狀態位於本機**，但**外部服務仍會看到你傳送給它們的內容**。

    - **預設位於本機**：工作階段、記憶檔案、設定和工作區都位於閘道主機上（`~/.openclaw` 加上你的工作區目錄）。
    - **必須位於遠端**：傳送給模型供應商（Anthropic/OpenAI 等）的訊息會送往其 API，而聊天平台（Slack/Telegram/WhatsApp 等）會將訊息資料儲存在其伺服器上。
    - **你可以控制資料足跡**：本機模型會將提示保留在你的機器上，但頻道流量仍會經過該頻道的伺服器。

    相關內容：[代理程式工作區](/zh-TW/concepts/agent-workspace)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 將資料儲存在哪裡？">
    所有資料都位於 `$OPENCLAW_STATE_DIR` 下（預設：`~/.openclaw`）：

    | 路徑                                                               | 用途                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | 主要設定（JSON5）                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | 舊版 OAuth 匯入資料（首次使用時複製到驗證設定檔）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | 驗證設定檔（OAuth、API 金鑰、選用的 `keyRef`/`tokenRef`）        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef 供應商選用的檔案型祕密資料內容   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | 舊版相容性檔案（已清除靜態 `api_key` 項目）        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | 供應商狀態（例如 `whatsapp/<accountId>/creds.json`）      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | 各代理程式的狀態（agentDir + 舊版／封存的工作階段成品）        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | 各代理程式的 SQLite 狀態，包括工作階段資料列和逐字記錄      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | 舊版工作階段遷移來源和封存／支援成品      |

    舊版單一代理程式路徑 `~/.openclaw/agent/*` 會由 `openclaw doctor` 遷移。

    你的**工作區**（AGENTS.md、記憶檔案、Skills 等）是分開的，透過 `agents.defaults.workspace` 設定（預設：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 應該放在哪裡？">
    這些檔案位於**代理程式工作區**，而不是 `~/.openclaw`。

    - **工作區（各代理程式）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`，以及選用的 `HEARTBEAT.md`。根目錄的小寫 `memory.md` 僅作為舊版修復輸入；當兩者都存在時，`openclaw doctor --fix` 可將其合併到 `MEMORY.md`。
    - **狀態目錄（`~/.openclaw`）**：設定、頻道／供應商狀態、驗證設定檔、工作階段、記錄、共用 Skills（`~/.openclaw/skills`）。

    預設工作區為 `~/.openclaw/workspace`，可進行設定：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果機器人在重新啟動後「忘記」內容，請確認閘道每次啟動時都使用相同的工作區（遠端模式使用的是**閘道主機的**工作區，而不是你本機筆記型電腦的工作區）。

    提示：若要保留持久的行為或偏好，請要求機器人**將其寫入 AGENTS.md 或 MEMORY.md**，而不是依賴聊天記錄。

    請參閱[代理程式工作區](/zh-TW/concepts/agent-workspace)和[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我可以加大 SOUL.md 嗎？">
    可以。`SOUL.md` 是注入代理程式上下文的工作區啟動檔案之一。預設的每檔案注入上限為 `20000` 個字元；所有檔案的啟動內容總預算為 `60000` 個字元。

    變更共用預設值：

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

    或在 `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` 下覆寫單一代理程式。

    使用 `/context` 檢查原始大小與注入大小，以及是否發生截斷。讓 `SOUL.md` 聚焦於語氣、立場和個性；將操作規則放在 `AGENTS.md`，並將持久性事實存入記憶。

    請參閱[上下文](/zh-TW/concepts/context)和[代理程式設定](/zh-TW/gateway/config-agents)。

  </Accordion>

  <Accordion title="建議的備份策略">
    將你的**代理程式工作區**放在**私人** git 儲存庫中，並備份到私人位置（例如 GitHub 私人儲存庫）。這會保留記憶以及 AGENTS/SOUL/USER 檔案，讓你日後可以還原助理的「心智」。

    請**勿**提交 `~/.openclaw` 下的任何內容（認證資訊、工作階段、權杖、加密的祕密資料內容）。若要完整還原，請分別備份工作區和狀態目錄。

    文件：[代理程式工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="如何完整解除安裝 OpenClaw？">
    請參閱[解除安裝](/zh-TW/install/uninstall)。
  </Accordion>

  <Accordion title="代理程式可以在工作區之外運作嗎？">
    可以。工作區是**預設 cwd** 和記憶錨點，而不是嚴格的沙箱。相對路徑會在工作區內解析；除非已啟用沙箱，否則絕對路徑可以存取主機上的其他位置。若要隔離，請使用 [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing) 或各代理程式的沙箱設定。若要讓某個儲存庫成為預設工作目錄，請將該代理程式的 `workspace` 指向儲存庫根目錄——OpenClaw 儲存庫本身只是原始碼，因此除非你刻意希望代理程式在其中工作，否則請將工作區與其分開。

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

  <Accordion title="遠端模式：工作階段存放區在哪裡？">
    工作階段狀態由**閘道主機**擁有。在遠端模式中，你所關心的工作階段存放區位於遠端機器，而不是你本機的筆記型電腦。請參閱[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>
</AccordionGroup>

## 設定基礎

<AccordionGroup>
  <Accordion title="設定採用什麼格式？位於哪裡？">
    OpenClaw 會從 `$OPENCLAW_CONFIG_PATH`（預設：`~/.openclaw/openclaw.json`）讀取選用的 **JSON5** 設定。如果檔案不存在，則使用相對安全的預設值，包括預設工作區 `~/.openclaw/workspace`。
  </Accordion>

  <Accordion title='我設定了 gateway.bind: "lan"（或 "tailnet"），但現在沒有任何服務監聽／UI 顯示未授權'>
    非回送位址繫結**需要有效的閘道驗證路徑**：共用祕密驗證（權杖或密碼），或在正確設定且具身分識別能力的反向 Proxy 後方使用 `gateway.auth.mode: "trusted-proxy"`。

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

    - `gateway.remote.token` / `.password` 本身**不會**啟用本機閘道驗證；只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才能使用 `gateway.remote.*` 作為備援。
    - 若使用密碼驗證，請設定 `gateway.auth.mode: "password"`，並加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果透過 SecretRef 明確設定了 `gateway.auth.token` / `.password`，但無法解析，解析會以封閉方式失敗（不會以遠端備援掩蓋問題）。
    - 使用共用祕密的 Control UI 設定會透過 `connect.params.auth.token` 或 `connect.params.auth.password` 進行驗證（儲存在應用程式／UI 設定中）。Tailscale Serve 或 `trusted-proxy` 等帶有身分資訊的模式則改用要求標頭——請避免將共用祕密放在 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 時，同一主機上的回送反向 Proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並在 `gateway.trustedProxies` 中加入回送位址項目。

  </Accordion>

  <Accordion title="為什麼現在 localhost 也需要權杖？">
    OpenClaw 預設會強制執行閘道驗證，包括回送位址。如果未設定明確的驗證路徑，啟動時會解析為權杖模式，並為該次啟動產生僅供執行階段使用的權杖，因此本機 WS 用戶端必須驗證。這能阻止其他本機程序呼叫閘道。

    當用戶端需要在重新啟動後仍保持穩定的祕密時，請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。你也可以選擇密碼模式，或針對具身分識別能力的反向 Proxy 使用 `trusted-proxy`。若要開放回送位址，請明確設定 `gateway.auth.mode: "none"`。`openclaw doctor --generate-gateway-token` 可隨時產生權杖。

  </Accordion>

  <Accordion title="變更設定後必須重新啟動嗎？">
    閘道會監看設定並支援熱重新載入：`gateway.reload.mode: "hybrid"`（預設）會熱套用安全的變更，並針對關鍵變更重新啟動。此外也支援 `hot`、`restart` 和 `off`。大多數 `tools.*`、`agents.*` 政策、`session.*` 和 `messages.*` 的變更都會立即套用，完全不需要重新載入動作；`gateway.*` 的繫結／連接埠變更則需要重新啟動。
  </Accordion>

  <Accordion title="如何停用有趣的命令列介面標語？">
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

    - `off`：隱藏標語文字，但保留橫幅標題／版本行。
    - `default`：一律使用 `All your chats, one OpenClaw.`。
    - `random`：輪替顯示有趣／季節性的標語（預設行為）。
    - 若要完全不顯示橫幅，請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何啟用網頁搜尋（及網頁擷取）？">
    `web_fetch` 不需要 API 金鑰即可運作。`web_search` 則取決於你選擇的供應商：

    | 供應商 | 無需金鑰 | 環境變數 |
    | --- | --- | --- |
    | Brave | 否 | `BRAVE_API_KEY` |
    | DuckDuckGo | 是（非官方、以 HTML 為基礎） | - |
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

    Grok 也可以重複使用模型驗證中的 xAI OAuth（`openclaw onboard --auth-choice xai-oauth`）。

    **建議**：執行 `openclaw configure --section web` 並選擇供應商。

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
    ```
    ```json5
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
    ```
    ```json5
            enabled: true,
    ```
    ```json5
            provider: "firecrawl", // 選用；省略即可自動偵測
    ```
    ```json5
          },
    ```
    ```json5
        },
      },
    }
    ```
    供應商特定的網頁搜尋設定位於 `plugins.entries.<plugin>.config.webSearch.*`。舊版 `tools.web.search.*` 供應商路徑仍會載入以維持相容性，但不應在新設定中使用。Firecrawl 網頁擷取後援設定位於 `plugins.entries.firecrawl.config.webFetch.*`。

    - 允許清單：加入 `web_search`/`web_fetch`/`x_search`，或加入 `group:web` 以允許全部三者。
    - `web_fetch` 預設為啟用。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 會從可用的認證資訊中，自動偵測第一個已就緒的擷取備援提供者；官方 Firecrawl 外掛會提供此備援。
    - 常駐程式會從 `~/.openclaw/.env`（或服務環境）讀取環境變數。

    文件：[Web 工具](/zh-TW/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清除了我的設定。該如何復原並避免再次發生？">
    `config.apply` 會取代**整份設定**；只提供部分物件會移除其他所有內容。

    目前 OpenClaw 可防止大多數意外覆寫：

    - OpenClaw 管理的設定寫入會在寫入前驗證變更後的完整設定。
    - 無效或具破壞性的 OpenClaw 管理寫入會遭到拒絕，並儲存為 `openclaw.json.rejected.*`。
    - 若直接編輯導致啟動或熱重新載入失敗，閘道會採取失敗關閉，或略過重新載入；不會重寫 `openclaw.json`。
    - `openclaw doctor --fix` 負責修復，可還原上次已知正常的設定，並將遭拒的檔案儲存為 `openclaw.json.clobbered.*`。

    復原：

    - 檢查 `openclaw logs --follow` 中是否出現 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 檢查作用中設定檔旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 執行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 僅使用 `openclaw config set` 或 `config.patch` 複製回預期的鍵。
    - 若沒有最後已知可用的設定或遭拒的承載資料：從備份還原，或重新執行 `openclaw doctor` 並重新設定頻道／模型。
    - 若發生非預期遺失：使用你最後已知的設定或備份回報錯誤。本機程式設計代理通常可以根據日誌或歷史記錄重建可用的設定。

    避免此問題：小幅變更請使用 `openclaw config set`，互動式編輯請使用 `openclaw configure`，檢查不熟悉的路徑請使用 `config.schema.lookup`（會傳回淺層結構描述節點及其直接子項摘要），部分 RPC 編輯請使用 `config.patch`，並將 `config.apply` 保留給完整設定替換。即使透過舊版 `tools.bash.*` 別名，代理所使用的 `gateway` 執行階段工具也會拒絕改寫 `tools.exec.ask`／`tools.exec.security`。

    文件：[設定](/zh-TW/cli/config)、[設定精靈](/zh-TW/cli/configure)、[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="如何使用跨裝置的專門工作者執行中央閘道？">
    常見模式：**一個閘道**（例如 Raspberry Pi）加上**節點**與**代理**。

    - **閘道（中央）**：管理頻道（Signal／WhatsApp）、路由與工作階段。
    - **節點（裝置）**：Mac／iOS／Android 以周邊裝置形式連線，並提供本機工具（`system.run`、`canvas`、`camera`）。
    - **代理（工作者）**：為特殊角色提供獨立的思考核心／工作區（例如維運與個人資料）。
    - **子代理**：從主要代理產生背景工作，以便平行處理。
    - **終端介面**：連線至閘道，並切換代理／工作階段。

    文件：[節點](/zh-TW/nodes)、[遠端存取](/zh-TW/gateway/remote)、[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[終端介面](/zh-TW/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 瀏覽器可以使用無頭模式執行嗎？">
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

    預設值為 `false`（有頭模式）。無頭模式在某些網站上較容易觸發反機器人檢查（X/Twitter 經常封鎖無頭工作階段）。它使用相同的 Chromium 引擎，適用於大多數自動化作業；主要差異是沒有可見的瀏覽器視窗（請使用螢幕截圖查看畫面）。請參閱[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="如何使用 Brave 控制瀏覽器？">
    將 `browser.executablePath` 設為你的 Brave 執行檔（或任何以 Chromium 為基礎的瀏覽器），然後重新啟動閘道。請參閱[瀏覽器](/zh-TW/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 遠端閘道與節點

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、閘道與節點之間傳遞？">
    Telegram 訊息由**閘道**處理；閘道會執行代理程式，只有在需要節點工具時，才會透過**閘道 WebSocket** 呼叫節點：

    Telegram -> 閘道 -> 代理程式 -> `node.*` -> 節點 -> 閘道 -> Telegram

    節點不會看到來自提供者的傳入流量；它們只會接收節點 RPC 呼叫。

  </Accordion>

  <Accordion title="如果閘道託管在遠端，我的代理程式要如何存取我的電腦？">
    將你的電腦配對為**節點**。閘道在其他位置執行，但可透過閘道 WebSocket，在你的本機電腦上呼叫 `node.*` 工具（螢幕、相機、系統）。

    1. 在持續運作的主機（VPS／家用伺服器）上執行閘道。
    2. 將閘道主機和你的電腦加入同一個 tailnet。
    3. 確認閘道 WS 可連線（繫結 tailnet 或使用 SSH 通道）。
    4. 在本機開啟 macOS 應用程式，並以 **Remote over SSH** 模式（或直接透過 tailnet）連線，使其註冊為節點。
    5. 核准節點：
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要另外設定 TCP 橋接；節點會透過閘道 WebSocket 連線。

    安全提醒：配對 macOS 節點後，即可在該電腦上執行 `system.run`。請只配對你信任的裝置；並檢閱[安全性](/zh-TW/gateway/security)。

    文件：[節點](/zh-TW/nodes)、[閘道通訊協定](/zh-TW/gateway/protocol)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已連線，但我收不到回覆。該怎麼辦？">
    請先檢查基本項目：

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    接著確認驗證與路由：若你使用 Tailscale Serve，請確認 `gateway.auth.allowTailscale` 設定正確；若透過 SSH 通道連線，請確認通道已建立並指向正確的連接埠；另請確認你的私訊／群組允許清單包含你的帳號。

    文件：[Tailscale](/zh-TW/gateway/tailscale)、[遠端存取](/zh-TW/gateway/remote)、[頻道](/zh-TW/channels)。

  </Accordion>

  <Accordion title="兩個 OpenClaw 執行個體可以互相通訊嗎（本機 + VPS）？">
    可以，但目前沒有內建的機器人對機器人橋接功能。

    **最簡單的方式**：使用兩個機器人都能存取的一般聊天頻道（Slack／Telegram／WhatsApp）。讓機器人 A 傳訊息給機器人 B，接著讓機器人 B 照常回覆。

    **命令列介面橋接（通用）**：執行指令碼，使用 `openclaw agent --message ... --deliver` 呼叫另一個閘道，並將目標設為另一個機器人正在監聽的聊天。若其中一個機器人位於遠端 VPS，請透過 SSH／Tailscale 將命令列介面指向該遠端閘道（請參閱[遠端存取](/zh-TW/gateway/remote)）：

    ```bash
    openclaw agent --message "來自本機機器人的問候" --deliver --channel telegram --reply-to <chat-id>
    ```

    請加入防護措施，避免兩個機器人無限循環（例如僅在被提及時回覆、使用頻道允許清單，或設定「不要回覆機器人訊息」規則）。

    文件：[遠端存取](/zh-TW/gateway/remote)、[代理程式命令列介面](/zh-TW/cli/agent)、[代理程式傳送](/zh-TW/tools/agent-send)。

  </Accordion>

  <Accordion title="多個代理程式需要使用不同的 VPS 嗎？">
    不需要。一個閘道可託管多個代理程式，每個代理程式都有自己的工作區、模型預設值與路由；這是一般的設定方式，也比每個代理程式使用一台 VPS 便宜且簡單許多。只有在需要嚴格隔離（安全性邊界），或設定差異很大且不想共用時，才使用不同的 VPS。
  </Accordion>

  <Accordion title="在個人筆電上使用節點，而不是從 VPS 透過 SSH 連線，有什麼好處嗎？">
    有：節點是從遠端閘道存取筆電的第一級方式，提供的功能不僅限於 shell 存取。閘道可在 macOS／Linux 上執行（Windows 則透過 WSL2），且相當輕量（小型 VPS 或 Raspberry Pi 等級的裝置即可；4 GB RAM 已相當充足），因此常見的設定是使用一台永遠在線的主機，並將筆電作為節點。

    - **不需要連入的 SSH** — 節點會透過裝置配對，主動連線至閘道 WebSocket。
    - **更安全的執行控制** — `system.run` 會受到該筆電上節點允許清單／核准機制的管控。
    - **更多裝置工具** — 除了 `system.run`，節點也會公開 `canvas`、`camera` 與 `screen`。
    - **本機瀏覽器自動化** — 閘道可保留在 VPS 上，並透過節點主機在本機執行 Chrome；也可以透過 Chrome MCP 連接本機 Chrome。

    SSH 適合臨時的 shell 存取；對於持續運作的代理程式工作流程與裝置自動化，節點較為簡單。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="節點會執行閘道服務嗎？">
    不會。除非你刻意執行彼此隔離的設定檔（請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)），否則每台主機只應執行**一個閘道**。節點是連線至閘道的周邊裝置（iOS／Android 節點，或選單列應用程式中的 macOS「節點模式」）。如需無頭節點主機與命令列介面控制，請參閱[節點主機命令列介面](/zh-TW/cli/node)。

    `gateway`、`discovery` 與託管外掛介面的變更需要完整重新啟動。

  </Accordion>

  <Accordion title="是否能透過 API／RPC 套用設定？">
    可以：

    - `config.schema.lookup`：寫入前，檢查單一設定子樹及其淺層結構描述節點、相符的 UI 提示，以及直接子項摘要。
    - `config.get`：取得目前的快照與雜湊值。
    - `config.patch`：安全地進行部分更新（大多數 RPC 編輯的首選）；可行時會熱重新載入，必要時則重新啟動。
    - `config.apply`：驗證並取代完整設定；可行時會熱重新載入，必要時則重新啟動。
    - 面向代理程式的 `gateway` 執行階段工具仍會拒絕重寫 `tools.exec.ask`／`tools.exec.security`；舊版 `tools.bash.*` 別名會正規化為相同的受保護路徑。

  </Accordion>

  <Accordion title="首次安裝的最小合理設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    設定你的工作區，並限制哪些人可以觸發機器人。

  </Accordion>

  <Accordion title="如何在 VPS 上設定 Tailscale，並從我的 Mac 連線？">
    1. **在 VPS 上安裝並登入**：
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **使用 Tailscale 應用程式在 Mac 上安裝並登入**，並使用相同的 tailnet。
    3. **在 Tailscale 管理控制台中啟用 MagicDNS**，讓 VPS 擁有穩定的名稱。
    4. **使用 tailnet 主機名稱**：SSH `ssh user@your-vps.tailnet-xxxx.ts.net`；閘道 WS `ws://your-vps.tailnet-xxxx.ts.net:18789`。

    若要在不使用 SSH 的情況下存取控制 UI，請在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    這會讓閘道維持繫結至迴送介面，並透過 Tailscale 公開 HTTPS。請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何將 Mac 節點連線至遠端閘道（Tailscale Serve）？">
    Serve 會公開 **閘道控制介面 + WS**；節點會透過相同的閘道 WS 端點連線。

    1. 確認 VPS 和 Mac 位於同一個 tailnet。
    2. 以遠端模式使用 macOS 應用程式（SSH 目標可以是 tailnet 主機名稱）—它會建立通往閘道連接埠的通道，並以節點身分連線。
    3. 核准節點：
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文件：[閘道通訊協定](/zh-TW/gateway/protocol)、[探索](/zh-TW/gateway/discovery)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我應該在第二台筆記型電腦上安裝，還是只需新增節點？">
    如果第二台筆記型電腦只需要使用**本機工具**（螢幕／相機／執行），請將它新增為**節點**—只使用一個閘道，且不會有重複的設定。目前本機節點工具僅支援 macOS。只有在需要**完全隔離**或兩個徹底獨立的機器人時，才安裝第二個閘道。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境變數與 .env 載入

<AccordionGroup>
  <Accordion title="OpenClaw 如何載入環境變數？">
    OpenClaw 會讀取父程序（shell、launchd/systemd、CI 等）的環境變數，並另外載入：

    - 目前工作目錄中的 `.env`。
    - `~/.openclaw/.env`（`$OPENCLAW_STATE_DIR/.env`）中的全域備援 `.env`。

    這兩個 `.env` 檔案都不會覆寫現有的環境變數。對於工作區 `.env`，提供者認證資訊金鑰是例外：工作區 `.env` 中的 `GEMINI_API_KEY`、`XAI_API_KEY` 或 `MISTRAL_API_KEY` 等金鑰（以及其他內建提供者的驗證環境變數）會被忽略，應改放在程序環境、`~/.openclaw/.env` 或設定的 `env` 中。

    設定中的內嵌環境變數只會在程序環境中缺少時套用：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    如需完整的優先順序與來源，請參閱 [/environment](/zh-TW/help/environment)。

  </Accordion>

  <Accordion title="我透過服務啟動閘道後，環境變數不見了。該怎麼辦？">
    有兩種修正方式：

    1. 將缺少的金鑰放入 `~/.openclaw/.env`，如此即使服務未繼承你的 shell 環境，也能載入這些金鑰。
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
       這會執行你的登入 shell，且只匯入缺少的預期金鑰（絕不覆寫）。對應的環境變數：`OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我已設定 COPILOT_GITHUB_TOKEN，但模型狀態顯示 "Shell env: off."。為什麼？'>
    `openclaw models status` 會回報是否已啟用 **shell 環境匯入**。"Shell env: off" 並不表示你的環境變數遺失—它只表示 OpenClaw 不會自動載入你的登入 shell。

    如果閘道以服務（launchd/systemd）執行，就不會繼承你的 shell 環境。你可以將權杖放入 `~/.openclaw/.env`、啟用 `env.shellEnv.enabled: true`，或將它新增至設定的 `env`（只會在缺少時套用），接著重新啟動閘道並再次檢查：

    ```bash
    openclaw models status
    ```

    Copilot 權杖會依此順序解析：`OPENCLAW_GITHUB_TOKEN`，接著是 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，最後是 `GITHUB_TOKEN`。

    請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers) 和 [/environment](/zh-TW/help/environment)。

  </Accordion>
</AccordionGroup>

## 工作階段與多個聊天

<AccordionGroup>
  <Accordion title="如何開始全新的對話？">
    將 `/new` 或 `/reset` 作為獨立訊息傳送。請參閱[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>

  <Accordion title="如果我從未傳送 /new，工作階段會自動重設嗎？">
    會。預設重設政策為**每日**：系統會根據目前工作階段的開始時間，在閘道主機所設定的本機時刻切換工作階段（`session.reset.atHour`，預設為 `4`，範圍為 0-23）。若要改用閒置時間重設，請設定 `mode: "idle"` 和 `session.reset.idleMinutes`；工作階段會在閒置一段時間後到期（依據最後一次實際互動，而非心跳偵測／排程／執行系統事件）。

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

    `resetByType` 支援 `direct`（舊別名為 `dm`）、`group` 和 `thread`。當未設定 `session.reset`／`resetByType` 區塊時，舊版頂層 `session.idleMinutes` 仍可作為閒置模式預設值的相容別名。具有使用中、由提供者擁有之命令列介面工作階段的工作階段，不會被隱含的每日預設值中斷。完整生命週期請參閱[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title="是否能建立一個由多個 OpenClaw 執行個體組成的團隊（一位執行長和多個代理程式）？">
    可以，透過**多代理程式路由**和**子代理程式**：一個協調代理程式，加上數個各自擁有工作區和模型的工作代理程式。

    最適合將此視為一項有趣的實驗—它會消耗大量權杖，而且通常不如使用具有獨立工作階段的單一機器人有效率。典型模式是使用一個與你對話的機器人，針對平行工作使用不同的工作階段，並在需要時產生子代理程式。

    文件：[多代理程式路由](/zh-TW/concepts/multi-agent)、[子代理程式](/zh-TW/tools/subagents)、[代理程式命令列介面](/zh-TW/cli/agents)。

  </Accordion>

  <Accordion title="為什麼執行工作途中，內容被截斷了？如何避免？">
    工作階段內容受到模型內容視窗的限制。長時間的聊天、大量工具輸出或許多檔案，都可能觸發壓縮或截斷。

    - 要求機器人摘要目前狀態，並將摘要寫入檔案。
    - 在長時間工作前使用 `/compact`，切換主題時使用 `/new`。
    - 將重要內容保留在工作區中，並要求機器人重新讀取。
    - 對長時間或平行工作使用子代理程式，讓主要聊天保持精簡。
    - 如果經常發生此情況，請選用內容視窗較大的模型。

  </Accordion>

  <Accordion title="如何在保留安裝的情況下，完全重設 OpenClaw？">
    ```bash
    openclaw reset
    ```

    非互動式完整重設：

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    接著重新執行設定：

    ```bash
    openclaw onboard --install-daemon
    ```

    如果入門設定偵測到現有設定，也會提供**重設**選項；請參閱[入門設定（命令列介面）](/zh-TW/start/wizard)。如果你使用了設定檔（`--profile`／`OPENCLAW_PROFILE`），請重設每個狀態目錄（預設為 `~/.openclaw-<profile>`）。僅限開發用途的重設：`openclaw gateway --dev --reset` 會清除開發設定、認證資訊、工作階段和工作區。

  </Accordion>

  <Accordion title='我遇到 "context too large" 錯誤—該如何重設或壓縮？'>
    - **壓縮**（保留對話，摘要較舊的對話輪次）：使用 `/compact`，或使用 `/compact <instructions>` 指引摘要。
    - **重設**（為相同聊天金鑰建立新的工作階段 ID）：使用 `/new` 或 `/reset`。

    如果持續發生，請調整**工作階段修剪**（`agents.defaults.contextPruning`）以移除舊的工具輸出，或使用內容視窗較大的模型。

    文件：[壓縮](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title='為什麼會看到 "LLM request rejected: messages.content.tool_use.input field required"？'>
    提供者驗證錯誤：模型產生了缺少必要 `input` 的 `tool_use` 區塊。這通常表示工作階段歷程已過時或損毀（常發生於長討論串或工具／結構描述變更之後）。

    修正方式：使用 `/new`（獨立訊息）開始新的工作階段。

  </Accordion>

  <Accordion title="為什麼我每 30 分鐘就會收到心跳偵測訊息？">
    心跳偵測預設每 **30m** 執行一次；若解析出的驗證模式為 Anthropic OAuth／權杖驗證（包括重複使用 Claude 命令列介面），且未設定 `heartbeat.every`，則為每 **1h** 執行一次。調整或停用方式如下：

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 或設為 "0m" 以停用
          },
        },
      },
    }
    ```

    如果 `HEARTBEAT.md` 存在但實際上是空的（僅包含空白行、Markdown／HTML 註解、ATX 標題、圍欄標記或空白清單項目框架），OpenClaw 會略過心跳偵測執行，以節省 API 呼叫。如果檔案不存在，心跳偵測仍會執行，並由模型決定要做什麼。

    個別代理程式覆寫使用 `agents.list[].heartbeat`。文件：[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要將「機器人帳號」新增至 WhatsApp 群組嗎？'>
    不需要。OpenClaw 會使用**你自己的帳號**執行—只要你在群組中，OpenClaw 就能看到該群組。預設情況下，群組回覆會遭到封鎖，直到你允許傳送者（`groupPolicy: "allowlist"`）。

    若要將群組回覆限制為僅你本人：

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
    最快的方法：持續監看記錄，並在群組中傳送測試訊息。

    ```bash
    openclaw logs --follow --json
    ```

    尋找以 `@g.us` 結尾的 `chatId`（或 `from`），例如 `1234567890-1234567890@g.us`。

    如果已完成設定／加入允許清單，請從設定列出群組：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[目錄](/zh-TW/cli/directory)、[記錄](/zh-TW/cli/logs)。

  </Accordion>

  <Accordion title="為什麼 OpenClaw 不會在群組中回覆？">
    有兩個常見原因：預設已啟用提及限制（你必須 @提及機器人，或符合 `mentionPatterns`），或是你設定了 `channels.whatsapp.groups`，但未包含 `"*"`，而該群組也未加入允許清單。

    請參閱[群組](/zh-TW/channels/groups)和[群組訊息](/zh-TW/channels/group-messages)。

  </Accordion>

  <Accordion title="群組／討論串會與私訊共用內容嗎？">
    私人聊天預設會合併至主要工作階段。群組／頻道具有自己的工作階段金鑰，而 Telegram 主題／Discord 討論串則是獨立的工作階段。請參閱[群組](/zh-TW/channels/groups)和[群組訊息](/zh-TW/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以建立多少個工作區和代理程式？">
    沒有硬性限制—數十個甚至數百個都沒問題，但請留意：

    - **磁碟用量增長**：使用中的工作階段和逐字記錄位於各代理程式的 SQLite 資料庫中；舊版／封存成品仍可能累積在 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **權杖成本**：代理程式越多，代表同時使用模型的次數越多。
    - **維運負擔**：各代理程式的驗證設定檔、工作區和頻道路由。

    每個代理程式請保留一個**使用中**的工作區（`agents.defaults.workspace`）；若磁碟用量增加，請使用 `openclaw sessions cleanup` 修剪舊工作階段（請勿手動編輯使用中的 SQLite 狀態），並使用 `openclaw doctor` 找出零散的工作區和設定檔不符問題。

  </Accordion>

  <Accordion title="我可以同時執行多個機器人或聊天（Slack）嗎？該如何設定？">
    可以，透過**多代理程式路由**：執行多個隔離的代理程式，並依頻道／帳號／對等端路由傳入訊息。Slack 支援作為頻道，且可繫結至特定代理程式。

    瀏覽器存取功能強大，但無法「做到人類能做的任何事」—反機器人機制、CAPTCHA 和 MFA 仍可能阻擋自動化。若要獲得最可靠的控制，請在主機上使用本機 Chrome MCP，或在實際執行瀏覽器的機器上使用 CDP。

    最佳實務設定：使用永遠在線的閘道主機（VPS/Mac mini）、每個角色配置一個代理程式（繫結）、將 Slack 頻道繫結至這些代理程式，並在需要時透過 Chrome MCP 或節點使用本機瀏覽器。

    文件：[多代理程式路由](/zh-TW/concepts/multi-agent)、[Slack](/zh-TW/channels/slack)、[瀏覽器](/zh-TW/tools/browser)、[節點](/zh-TW/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、容錯移轉與驗證設定檔

模型問答（預設值、選擇、別名、切換、容錯移轉、驗證設定檔）請參閱[模型常見問題](/zh-TW/help/faq-models)。

## 閘道：連接埠、「已在執行」與遠端模式

<AccordionGroup>
  <Accordion title="閘道使用哪個連接埠？">
    `gateway.port` 控制 WebSocket + HTTP（控制介面、網路鉤子等）共用的單一多工連接埠。優先順序：

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 預設值 18789
    ```

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示「Runtime: running」，但「Connectivity probe: failed」？'>
    「Running」是**監督程式**（launchd/systemd/schtasks）的觀點；連線探測則是命令列介面實際連線至閘道 WebSocket。請以 `openclaw gateway status` 的以下幾行為準：`Probe target:`（探測使用的 URL）、`Listening:`（連接埠實際繫結的項目）、`Last gateway error:`（程序仍存活但連接埠未監聽時的常見根本原因）。
  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示不同的「Config (cli)」和「Config (service)」？'>
    你正在編輯一個設定檔，但服務執行時使用的是另一個設定檔（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不一致）。

    修正方式：在你希望服務使用的同一個 `--profile` / 環境中執行：

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='「another gateway instance is already listening」是什麼意思？'>
    OpenClaw 會在啟動時立即繫結 WebSocket 監聽器（預設為 `ws://127.0.0.1:18789`），以強制執行階段鎖定。若繫結因 `EADDRINUSE` 失敗，就會擲出 `GatewayLockError`（「another gateway instance is already listening」）。

    修正方式：停止其他執行個體、釋放連接埠，或使用 `openclaw gateway --port <port>` 執行。

  </Accordion>

  <Accordion title="如何以遠端模式執行 OpenClaw（用戶端連線至其他位置的閘道）？">
    設定 `gateway.mode: "remote"` 並指向遠端 WebSocket URL，也可選擇設定共用密鑰遠端認證資訊：

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
    - 當這些值變更時，macOS 應用程式會監看設定檔並即時切換模式。
    - `gateway.remote.token` / `.password` 僅為用戶端的遠端認證資訊；它們本身不會啟用本機閘道驗證。

  </Accordion>

  <Accordion title='控制介面顯示「unauthorized」（或持續重新連線）。該怎麼辦？'>
    你的閘道驗證路徑與介面的驗證方式不相符。

    事實（依據程式碼）：

    - 控制介面會將權杖保存在 `sessionStorage` 中，其範圍限定於目前的瀏覽器分頁與所選的閘道 URL，因此重新整理同一分頁後仍可繼續運作，而不必將權杖長期保存在 localStorage。
    - 發生 `AUTH_TOKEN_MISMATCH` 時，若閘道傳回重試提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`），受信任的用戶端可嘗試一次有限度的重試，並使用快取的裝置權杖。
    - 該快取權杖重試會重複使用與裝置權杖一同儲存的已核准範圍；明確指定 `deviceToken` / `scopes` 的呼叫端會保留其要求的範圍集合，而不會繼承快取範圍。
    - 在該重試路徑以外，連線驗證的優先順序為：明確指定的共用權杖/密碼、明確指定的 `deviceToken`、已儲存的裝置權杖，最後是啟動權杖。
    - 內建設定碼啟動會傳回具有 `scopes: []` 的節點裝置權杖，以及供受信任行動裝置初始設定使用的有限操作員交接權杖。操作員交接權杖可讀取設定期間的原生設定，但不會授予配對變更範圍或 `operator.admin`。

    修正方式：

    - 最快：`openclaw dashboard`（顯示並複製儀表板 URL，並嘗試開啟；若無圖形介面，則顯示 SSH 提示）。
    - 尚無權杖：`openclaw doctor --generate-gateway-token`。
    - 遠端：先使用 `ssh -N -L 18789:127.0.0.1:18789 user@host` 建立通道，再開啟 `http://127.0.0.1:18789/`。
    - 共用密鑰模式：設定 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然後在控制介面設定中貼上相符的密鑰。
    - Tailscale Serve 模式：確認已啟用 `gateway.auth.allowTailscale`，而且你開啟的是 Serve URL，不是會略過 Tailscale 身分標頭的原始迴路/tailnet URL。
    - 受信任 Proxy 模式：確認你是透過已設定且可辨識身分的 Proxy 連線。同主機迴路 Proxy 也需要設定 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 重試一次後仍不相符：輪替/重新核准已配對的裝置權杖：
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - 輪替遭拒：已配對裝置的工作階段只能輪替其**自身**裝置，除非它們也具有 `operator.admin`；而明確指定的 `--scope` 值不能超出呼叫端目前的操作員範圍。
    - 仍然無法解決：執行 `openclaw status --all` 並參閱[疑難排解](/zh-TW/gateway/troubleshooting)。驗證詳細資料請參閱[儀表板](/zh-TW/web/dashboard)。

  </Accordion>

  <Accordion title="我將 gateway.bind 設為 tailnet，但它只在迴路介面上監聽">
    `tailnet` 繫結會從你的網路介面中選取 Tailscale IP（100.64.0.0/10）。如果機器未連上 Tailscale（或介面已停用），閘道會退回迴路介面，而不會暴露其他網路介面。

    修正方式：在該主機啟動 Tailscale 並重新啟動閘道，或明確切換至 `gateway.bind: "loopback"` / `"lan"`。

    `tailnet` 是明確選項；`auto` 優先使用迴路介面。使用 `gateway.bind: "tailnet"` 可將非迴路介面的暴露範圍限制在 Tailnet，同時保留必要的同主機 `127.0.0.1` 監聽器。

  </Accordion>

  <Accordion title="可以在同一台主機上執行多個閘道嗎？">
    通常不需要——一個閘道可以執行多個訊息頻道與代理程式。只有在需要備援（例如救援機器人）或嚴格隔離時才使用多個閘道，並使用各自的 `OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`agents.defaults.workspace` 與不重複的 `gateway.port` 隔離每個閘道。

    建議：每個執行個體使用 `openclaw --profile <name> ...`（自動建立 `~/.openclaw-<name>`）、每個設定檔設定不重複的 `gateway.port`（手動執行也可使用 `--port`），並使用 `openclaw --profile <name> gateway install` 建立各設定檔專屬的服務。

    設定檔也會在服務名稱後加上後綴：launchd `ai.openclaw.<profile>`、systemd `openclaw-gateway-<profile>.service`、Windows `OpenClaw Gateway (<profile>)`。未限定設定檔的 `openclaw-gateway` systemd 單元只存在於預設設定檔；重新命名前的舊版 systemd 單元名稱 `clawdbot-gateway` 會自動遷移。

    完整指南：[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ 代碼 1008 是什麼意思？'>
    閘道是 **WebSocket 伺服器**，預期第一則訊息為 `connect` 框架。任何其他訊息都會以**代碼 1008**（違反原則）關閉連線。

    常見原因：你在瀏覽器中開啟了 **HTTP** URL，而非使用 WS 用戶端；使用了錯誤的連接埠/路徑；或 Proxy/通道移除了驗證標頭，或傳送了非閘道要求。

    修正方式：使用 WS URL（`ws://<host>:18789`，或透過 HTTPS 使用 `wss://...`），不要在一般瀏覽器分頁中開啟 WS 連接埠，並在啟用驗證時，於 `connect` 框架中包含權杖/密碼。命令列介面/終端介面範例：

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    通訊協定詳細資料：[閘道通訊協定](/zh-TW/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 記錄與偵錯

<AccordionGroup>
  <Accordion title="記錄位於何處？">
    檔案記錄（結構化）：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。透過 `logging.file` 設定固定路徑；透過 `logging.level` 設定檔案記錄層級；透過 `--verbose` 與 `logging.consoleLevel` 設定主控台詳細程度。

    最快的即時追蹤方式：

    ```bash
    openclaw logs --follow
    ```

    服務/監督程式記錄（閘道透過 launchd/systemd 執行時）：

    - macOS launchd 標準輸出：`~/Library/Logs/openclaw/gateway.log`（設定檔使用 `gateway-<profile>.log`；標準錯誤輸出會被抑制）。
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`。
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`。

    詳情請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何啟動/停止/重新啟動閘道服務？">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行閘道，`openclaw gateway --force` 可以回收連接埠。請參閱[閘道](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上關閉了終端機——如何重新啟動 OpenClaw？">
    Windows 有三種安裝模式：

    **1) Windows Hub 本機設定**：原生應用程式會管理由應用程式擁有的本機 WSL 閘道。從開始功能表或系統匣開啟 **OpenClaw Companion**，然後使用 **Gateway Setup** 或 Connections 分頁。

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
    如果你手動執行（無服務）：`openclaw gateway run`。

    文件：[Windows](/zh-TW/platforms/windows)、[閘道服務操作手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="閘道已啟動，但一直收不到回覆。我應該檢查什麼？">
    快速健康檢查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常見原因：模型驗證未載入至**閘道主機**（檢查 `models status`）、頻道配對/允許清單封鎖回覆（檢查頻道設定與記錄），或 WebChat/儀表板開啟時未使用正確的權杖。若為遠端連線，請確認通道/Tailscale 連線已建立，且閘道 WebSocket 可連線。

    文件：[頻道](/zh-TW/channels)、[疑難排解](/zh-TW/gateway/troubleshooting)、[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title='「Disconnected from gateway: no reason」——該怎麼辦？'>
    通常表示介面失去了 WebSocket 連線。請檢查：閘道是否正在執行（`openclaw gateway status`）？狀態是否正常（`openclaw status`）？介面是否具有正確的權杖（`openclaw dashboard`）？若為遠端連線，通道/Tailscale 連結是否已建立？

    接著即時追蹤記錄：

    ```bash
    openclaw logs --follow
    ```

    文件：[儀表板](/zh-TW/web/dashboard)、[遠端存取](/zh-TW/gateway/remote)、[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失敗。我應該檢查什麼？">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    接著比對錯誤：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 選單的項目過多。OpenClaw 已會修剪至 Telegram 的限制，並使用較少的命令重試，但部分選單項目仍可能被捨棄。請減少外掛／技能／自訂命令，若你不需要選單，也可以停用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或類似的網路錯誤：若是在 VPS 上或位於代理伺服器後方，請確認允許對外 HTTPS 連線，且 `api.telegram.org` 的 DNS 解析正常。

    如果閘道位於遠端，請檢查閘道主機上的日誌。

    文件：[Telegram](/zh-TW/channels/telegram)、[頻道疑難排解](/zh-TW/channels/troubleshooting)。

  </Accordion>

  <Accordion title="終端介面沒有顯示輸出。我該檢查什麼？">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在終端介面中，使用 `/status` 查看目前狀態。如果你預期在聊天頻道中收到回覆，請確認已啟用傳送功能（`/deliver on`）。

    文件：[終端介面](/zh-TW/web/tui)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止閘道後再啟動？">
    如果你已安裝服務（macOS 上的 launchd、Linux 上的 systemd）：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    在前景執行時，請按 Ctrl-C 停止，然後執行 `openclaw gateway run`。

    文件：[閘道服務操作手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="簡單說明：openclaw gateway restart 與 openclaw gateway 的差異">
    `openclaw gateway restart` 會重新啟動**背景服務**（launchd/systemd）。`openclaw gateway` 則會在這個終端機工作階段中，於**前景**執行閘道。如果你已安裝服務，請使用 gateway 子命令；若只需單次執行，請直接以前景模式執行。
  </Accordion>

  <Accordion title="發生失敗時，取得更多詳細資訊的最快方式">
    使用 `--verbose` 啟動閘道，以在主控台取得更多詳細資訊，接著檢查日誌檔案中的頻道驗證、模型路由及 RPC 錯誤。
  </Accordion>
</AccordionGroup>

## 媒體與附件

<AccordionGroup>
  <Accordion title="我的技能產生了圖片／PDF，但沒有傳送任何內容">
    代理程式傳出的附件必須使用結構化媒體欄位，例如 `media`、`mediaUrl`、`path` 或 `filePath`。請參閱 [OpenClaw 助理設定](/zh-TW/start/openclaw)及[代理程式傳送](/zh-TW/tools/agent-send)。

    ```bash
    openclaw message send --target +15555550123 --message "這是你要的內容" --media /path/to/file.png
    ```

    另請檢查：目標頻道支援傳出媒體，且未遭允許清單封鎖；檔案未超過供應商的大小限制（圖片會調整為最長邊不超過 2048px）；`tools.fs.workspaceOnly=true` 會將本機路徑傳送限制於工作區、暫存／媒體儲存區及通過沙箱驗證的檔案；`tools.fs.workspaceOnly=false`（預設值）則允許結構化本機媒體傳送使用代理程式已可讀取的主機本機檔案，包括媒體及安全的文件類型（圖片、音訊、影片、PDF、Office 文件，以及經驗證的文字文件，例如 Markdown/MD、TXT、JSON、YAML/YML）。這不是秘密掃描器——只要副檔名與內容驗證相符，代理程式可讀取的 `secret.txt` 或 `config.json` 就能作為附件傳送。請將敏感檔案放在代理程式可讀取的路徑之外，或維持 `tools.fs.workspaceOnly=true`，以更嚴格地限制本機路徑傳送。

    請參閱[圖片](/zh-TW/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全性與存取控制

<AccordionGroup>
  <Accordion title="讓 OpenClaw 接收傳入的私訊安全嗎？">
    請將傳入的私訊視為不受信任的輸入。預設設定會降低風險：

    - 支援私訊的頻道預設行為是**配對**：未知傳送者會收到配對碼，且其訊息不會被處理。使用 `openclaw pairing approve --channel <channel> [--account <id>] <code>` 核准。待處理的要求上限為**每個頻道 3 個**；如果未收到配對碼，請檢查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公開開放私訊需要明確選擇啟用（`dmPolicy: "open"` 及允許清單 `"*"`）。

    執行 `openclaw doctor` 以找出有風險的私訊政策。

  </Accordion>

  <Accordion title="提示詞注入只需要擔心公開機器人嗎？">
    不是。提示詞注入關乎的是**不受信任的內容**，不只是誰能私訊機器人。如果你的助理會讀取外部內容（網頁搜尋／擷取、瀏覽器頁面、電子郵件、文件、附件、貼上的日誌），這些內容可能包含試圖劫持模型的指示——即使你是唯一的傳送者也一樣。

    啟用工具時風險最大：模型可能遭誘騙而洩漏情境資訊，或代表你呼叫工具。降低影響範圍：

    - 使用唯讀或停用工具的「讀取器」代理程式來摘要不受信任的內容
    - 對啟用工具的代理程式停用 `web_search`／`web_fetch`／`browser`
    - 將解碼後的檔案／文件文字也視為不受信任：OpenResponses `input_file` 與媒體附件擷取都會將擷取出的文字包裹在明確的外部內容邊界標記中，而不是直接傳入原始檔案文字
    - 使用沙箱及嚴格的工具允許清單

    詳細資訊：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw 使用 TypeScript/Node 而非 Rust/WASM，是否因此較不安全？">
    語言與執行階段固然重要，但不是個人代理程式的主要風險。實際風險包括閘道暴露、誰能傳訊息給機器人、提示詞注入、工具範圍、認證資訊處理、瀏覽器存取權、執行存取權，以及對第三方技能／外掛的信任。

    Rust 與 WASM 可為某些程式碼類別提供更強的隔離，但無法解決提示詞注入、不當的允許清單、公開暴露閘道、範圍過廣的工具，或已登入敏感帳號的瀏覽器設定檔。請將下列項目視為主要控制措施：將閘道維持為私人或要求驗證；對私訊／群組使用配對及允許清單；針對不受信任的輸入拒絕高風險工具或將其置於沙箱中；只安裝受信任的外掛與技能；並在變更設定後執行 `openclaw security audit --deep`。

    詳細資訊：[安全性](/zh-TW/gateway/security)、[沙箱化](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="我看到 OpenClaw 執行個體暴露的相關報告。我該檢查什麼？">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    較安全的基準：閘道繫結至 `loopback`，或只透過經驗證的私人存取方式暴露（tailnet、SSH 通道、權杖／密碼驗證，或正確設定的受信任代理伺服器）；私訊採用 `pairing` 或 `allowlist` 模式；除非每位成員都受信任，否則群組應列入允許清單並要求提及才會觸發；針對讀取不受信任內容的代理程式，拒絕使用高風險工具（`exec`、`browser`、`gateway`、`cron`）或嚴格限制其範圍；當工具執行需要較小的影響範圍時，啟用沙箱。

    未經驗證的公開繫結、啟用工具的開放私訊／群組，以及暴露的瀏覽器控制功能，是應優先修正的問題。詳細資訊：[openclaw security audit](/zh-TW/gateway/security#openclaw-security-audit)。

  </Accordion>

  <Accordion title="安裝 ClawHub 技能與第三方外掛安全嗎？">
    請將第三方技能與外掛視為你選擇信任的程式碼。ClawHub 技能頁面會在安裝前顯示掃描狀態，但掃描並非完整的安全邊界。OpenClaw 不會在安裝或更新外掛／技能時執行內建的本機危險程式碼封鎖；請使用由操作人員管理的 `security.installPolicy` 進行本機允許／封鎖判定。

    較安全的做法：優先選擇受信任的作者及固定版本；啟用技能／外掛前先閱讀其內容；嚴格限制外掛／技能允許清單；在僅有最低限度工具的沙箱中執行不受信任輸入的工作流程；並避免授予第三方程式碼廣泛的檔案系統、執行、瀏覽器或秘密存取權。

    詳細資訊：[技能](/zh-TW/tools/skills)、[外掛](/zh-TW/tools/plugin)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我的機器人應該擁有自己的電子郵件、GitHub 帳號或電話號碼嗎？">
    對大多數設定而言，應該如此。使用獨立帳號與電話號碼來隔離機器人，可在發生問題時縮小影響範圍，並讓你更容易輪替認證資訊或撤銷存取權，而不影響個人帳號。

    從小範圍開始：只授予實際需要的工具與帳號存取權，之後如有需要再擴大。

    文件：[安全性](/zh-TW/gateway/security)、[配對](/zh-TW/channels/pairing)。

  </Accordion>

  <Accordion title="我可以讓它自主處理簡訊嗎？這樣安全嗎？">
    我們**不**建議讓它完全自主處理你的個人訊息。最安全的做法是：讓私訊維持在**配對模式**或使用嚴格的允許清單；如果它應代表你傳送訊息，請使用**獨立的號碼或帳號**；並讓它先擬稿，由你**核准後再傳送**。

    若要實驗，請使用專用且隔離的帳號。請參閱[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我可以使用較便宜的模型執行個人助理工作嗎？">
    可以，**前提是**代理程式僅用於聊天，且輸入受信任。較小型的模型等級更容易遭到指示劫持，因此請避免將它們用於啟用工具的代理程式，或用於讀取不受信任內容。若你必須使用較小的模型，請嚴格限制工具並在沙箱內執行。請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中執行了 /start，但沒有取得配對碼">
    只有在未知傳送者向機器人傳送訊息，且已啟用 `dmPolicy: "pairing"` 時，才會傳送配對碼；單獨執行 `/start` 不會產生配對碼。

    檢查待處理要求：

    ```bash
    openclaw pairing list telegram
    ```

    若需立即存取，請將你的傳送者 ID 加入允許清單，或為該帳號設定 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它會傳訊息給我的聯絡人嗎？配對如何運作？">
    不會。WhatsApp 的預設私訊政策是**配對**。未知傳送者只會收到配對碼；其訊息**不會被處理**。OpenClaw 只會回覆收到訊息的聊天室，或回覆由你明確觸發的傳送動作。

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    精靈中的電話號碼提示會設定你的**允許清單／擁有者**，以允許你自己的私訊——該號碼不會用於自動傳送。在你的個人 WhatsApp 號碼上，請使用該號碼並啟用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止工作，以及「它就是不停止」

<AccordionGroup>
  <Accordion title="如何避免內部系統訊息顯示在聊天中？">
    大多數內部／工具訊息只會在該工作階段啟用**詳細模式**、**追蹤**或**推理**時顯示。

    請在看到這些訊息的聊天中進行修正：

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然太吵雜：請檢查 Control UI 中的工作階段設定，並將詳細模式設為**繼承**；確認你使用的機器人設定檔未在設定中包含 `verboseDefault: "on"`。

    文件：[思考與詳細模式](/zh-TW/tools/thinking)、[安全性](/zh-TW/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止／取消執行中的工作？">
    將以下任一內容**作為獨立訊息**傳送（不加斜線），即可觸發中止：`stop`、`stop action`、`stop current action`、`stop run`、`stop current run`、`stop agent`、`stop the agent`、`stop openclaw`、`openclaw stop`、`stop don't do anything`、`stop do not do anything`、`stop doing anything`、`do not do that`、`please stop`、`stop please`、`abort`、`esc`、`exit`、`interrupt`、`halt`。常見的非英語觸發詞（法語、德語、西班牙語、中文、日語、印地語、阿拉伯語、俄語）也能運作。

    若為 exec 工具啟動的背景程序，請要求代理程式執行：

    ```text
    process action:kill sessionId:XXX
    ```

    大多數斜線命令必須以 `/` 開頭並作為**獨立**訊息傳送，但少數捷徑（例如 `/status`）也可由允許清單中的傳送者在訊息內使用。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title='如何從 Telegram 傳送 Discord 訊息？（「禁止跨情境傳訊」）'>
    OpenClaw 預設會封鎖**跨供應商**傳訊。如果工具呼叫綁定至 Telegram，除非你明確允許，否則不會傳送至 Discord；此設定會立即生效，無須重新啟動閘道：

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

  <Accordion title='為什麼感覺機器人會「忽略」快速連續傳送的訊息？'>
    執行期間收到的提示預設會導入目前進行中的執行。使用 `/queue` 選擇進行中執行的處理方式：

    - `steer`（預設）- 在下一個模型邊界引導進行中的執行。
    - `followup` - 將訊息排入佇列，並在目前執行結束後逐一執行。
    - `collect` - 將相容的訊息排入佇列，並在目前執行結束後統一回覆一次。
    - `interrupt` - 中止目前執行並重新開始。

    你可以為佇列模式加入 `debounce:0.5s cap:25 drop:summarize` 等選項。請參閱[命令佇列](/zh-TW/concepts/queue)和[引導佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='使用 API 金鑰時，Anthropic 的預設模型是什麼？'>
    認證資訊與模型選擇是兩回事。設定 `ANTHROPIC_API_KEY`（或將 Anthropic API 金鑰儲存在驗證設定檔中）可啟用身分驗證，但實際的預設模型取決於你在 `agents.defaults.model.primary` 中的設定（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` 表示閘道無法在執行中代理程式預期使用的 `auth-profiles.json` 中找到 Anthropic 認證資訊。
  </Accordion>
</AccordionGroup>

---

仍然無法解決？請到 [Discord](https://discord.com/invite/clawd) 提問，或建立 [GitHub 討論](https://github.com/openclaw/openclaw/discussions)。

## 相關內容

- [首次執行常見問題](/zh-TW/help/faq-first-run) - 安裝、初始設定、身分驗證、訂閱、初期錯誤
- [模型常見問題](/zh-TW/help/faq-models) - 模型選擇、容錯移轉、驗證設定檔
- [疑難排解](/zh-TW/help/troubleshooting) - 以症狀為優先的問題分流
