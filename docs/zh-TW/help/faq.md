---
read_when:
    - 回答常見的設定、安裝、入門引導或執行階段支援問題
    - 分類處理使用者回報的問題，再進行更深入的除錯
summary: 關於 OpenClaw 設定、組態與使用方式的常見問題
title: 常見問題
x-i18n:
    generated_at: "2026-06-27T19:24:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

快速解答加上針對真實世界設定（本機開發、VPS、多代理、OAuth/API 金鑰、模型容錯移轉）的深入疑難排解。執行階段診斷請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。完整設定參考請參閱[設定](/zh-TW/gateway/configuration)。

## 如果有東西壞了，前 60 秒先做這些

1. **快速狀態（第一個檢查）**

   ```bash
   openclaw status
   ```

   快速本機摘要：作業系統 + 更新、閘道/服務可達性、代理/工作階段、供應商設定 + 執行階段問題（當閘道可達時）。

2. **可貼上的報告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   唯讀診斷，包含記錄尾端（權杖已遮蔽）。

3. **Daemon + 連接埠狀態**

   ```bash
   openclaw gateway status
   ```

   顯示 supervisor 執行階段與 RPC 可達性、探測目標 URL，以及服務可能使用的設定。

4. **深入探測**

   ```bash
   openclaw status --deep
   ```

   執行即時閘道健康探測，支援時也會包含通道探測
   （需要可達的閘道）。請參閱[健康狀態](/zh-TW/gateway/health)。

5. **追蹤最新記錄**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 無法使用，請改用：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   檔案記錄與服務記錄是分開的；請參閱[記錄](/zh-TW/logging)與[疑難排解](/zh-TW/gateway/troubleshooting)。

6. **執行 doctor（修復）**

   ```bash
   openclaw doctor
   ```

   修復/遷移設定/狀態 + 執行健康檢查。請參閱 [Doctor](/zh-TW/gateway/doctor)。

7. **閘道快照**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   向執行中的閘道要求完整快照（僅限 WS）。請參閱[健康狀態](/zh-TW/gateway/health)。

## 快速開始與首次執行設定

首次執行問答 — 安裝、onboard、驗證路由、訂閱、初始失敗 —
位於[首次執行常見問題](/zh-TW/help/faq-first-run)。

## 什麼是 OpenClaw？

<AccordionGroup>
  <Accordion title="用一段話說明 OpenClaw 是什麼？">
    OpenClaw 是你在自己裝置上執行的個人 AI 助理。它會在你已經使用的訊息介面上回覆（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等內建通道外掛），也能在支援的平台上提供語音 + 即時 Canvas。**閘道**是常駐的控制平面；助理本身才是產品。
  </Accordion>

  <Accordion title="價值主張">
    OpenClaw 不只是「Claude 包裝器」。它是一個**本機優先的控制平面**，讓你能在**自己的硬體**上執行
    有能力的助理，可從你已經使用的聊天應用程式連線，並具備
    有狀態的工作階段、記憶與工具 - 而不必把工作流程的控制權交給託管
    SaaS。

    重點：

    - **你的裝置，你的資料：** 在你想要的地方執行閘道（Mac、Linux、VPS），並將
      工作區 + 工作階段歷史保留在本機。
    - **真實通道，不是網頁沙盒：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等，
      加上支援平台上的行動語音與 Canvas。
    - **模型無關：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，並支援每個代理的路由
      與容錯移轉。
    - **僅限本機選項：** 如果你想要，可以執行本機模型，讓**所有資料都留在你的裝置上**。
    - **多代理路由：** 依通道、帳戶或任務分離代理，每個代理都有自己的
      工作區與預設值。
    - **開源且可自訂：** 可檢視、擴充與自行託管，不受供應商鎖定。

    文件：[閘道](/zh-TW/gateway)、[通道](/zh-TW/channels)、[多代理](/zh-TW/concepts/multi-agent)、
    [記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我剛設定好 - 應該先做什麼？">
    適合先做的專案：

    - 建立網站（WordPress、Shopify，或簡單的靜態網站）。
    - 製作行動應用程式原型（大綱、畫面、API 計畫）。
    - 整理檔案與資料夾（清理、命名、標記）。
    - 連接 Gmail 並自動化摘要或後續追蹤。

    它可以處理大型任務，但當你把任務拆成階段並
    使用子代理平行工作時，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常見的五個日常用途是什麼？">
    日常效益通常像這樣：

    - **個人簡報：** 彙整你關心的收件匣、行事曆與新聞摘要。
    - **研究與草擬：** 快速研究、摘要，以及電子郵件或文件初稿。
    - **提醒與後續追蹤：** 由排程或心跳偵測驅動的提醒與檢查清單。
    - **瀏覽器自動化：** 填寫表單、收集資料，以及重複網頁任務。
    - **跨裝置協調：** 從手機送出任務，讓閘道在伺服器上執行，並在聊天中拿回結果。

  </Accordion>

  <Accordion title="OpenClaw 能協助 SaaS 的潛在客戶開發、外聯、廣告與部落格嗎？">
    可以，用於**研究、資格判定與草擬**。它可以掃描網站、建立候選清單、
    摘要潛在客戶，並撰寫外聯或廣告文案草稿。

    對於**外聯或廣告投放**，請保留人工審核。避免垃圾訊息、遵守當地法律與
    平台政策，並在送出任何內容前先審閱。最安全的模式是讓
    OpenClaw 草擬，由你核准。

    文件：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="與 Claude Code 相比，OpenClaw 對網頁開發有哪些優勢？">
    OpenClaw 是**個人助理**與協調層，而不是 IDE 替代品。若要在 repo 內最快速地直接編碼，請使用
    Claude Code 或 Codex。當你需要
    持久記憶、跨裝置存取與工具協作時，請使用 OpenClaw。

    優勢：

    - 跨工作階段的**持久記憶 + 工作區**
    - **多平台存取**（WhatsApp、Telegram、終端介面、WebChat）
    - **工具協作**（瀏覽器、檔案、排程、hooks）
    - **常駐閘道**（在 VPS 上執行，從任何地方互動）
    - 用於本機瀏覽器/螢幕/相機/exec 的**節點**

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 與自動化

<AccordionGroup>
  <Accordion title="如何自訂 Skills 而不讓 repo 變髒？">
    使用受管理的覆寫，而不是編輯 repo 副本。將變更放在 `~/.openclaw/skills/<name>/SKILL.md`（或透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增資料夾）。優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`，因此受管理的覆寫仍會優先於內建 Skills，而且不必碰 git。如果你需要全域安裝該 skill，但只讓部分代理看見，請將共用副本放在 `~/.openclaw/skills`，並使用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可見性。只有值得 upstream 的編輯才應放在 repo 中並以 PR 送出。
  </Accordion>

  <Accordion title="我可以從自訂資料夾載入 Skills 嗎？">
    可以。透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增額外目錄（最低優先順序）。預設優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`。`clawhub` 預設安裝到 `./skills`，OpenClaw 會在下一個工作階段將其視為 `<workspace>/skills`。如果該 skill 只應對特定代理可見，請搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何針對不同任務使用不同模型或設定？">
    目前支援的模式是：

    - **排程作業**：隔離作業可以為每個作業設定 `model` 覆寫。
    - **代理**：將任務路由到不同代理，並使用不同的預設模型、思考層級與串流參數。
    - **隨選切換**：隨時使用 `/model` 切換目前工作階段模型。

    例如，對同一個模型使用不同的每代理設定：

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

    將共用的每模型預設值放在 `agents.defaults.models["provider/model"].params`，再將代理專屬覆寫放在扁平的 `agents.list[].params`。不要為同一個模型定義個別巢狀的 `agents.list[].models["provider/model"].params` 項目；`agents.list[].models` 是用於每代理模型目錄與執行階段覆寫。

    請參閱[排程作業](/zh-TW/automation/cron-jobs)、[多代理路由](/zh-TW/concepts/multi-agent)、[設定](/zh-TW/gateway/config-agents)與[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="Bot 在做繁重工作時會卡住。我要如何卸載工作？">
    使用**子代理**處理長時間或平行任務。子代理會在自己的工作階段中執行，
    回傳摘要，並讓你的主聊天保持回應。

    請要求你的 bot「為此任務產生一個子代理」，或使用 `/subagents`。
    在聊天中使用 `/status` 查看閘道目前正在做什麼（以及是否忙碌）。

    權杖提示：長任務與子代理都會消耗權杖。如果你在意成本，請透過 `agents.defaults.subagents.model`
    為子代理設定較便宜的模型。

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上繫結執行緒的子代理工作階段如何運作？">
    使用執行緒繫結。你可以將 Discord 執行緒繫結到子代理或工作階段目標，讓該執行緒中的後續訊息保留在該繫結工作階段上。

    基本流程：

    - 使用 `sessions_spawn` 並設定 `thread: true` 產生（也可選擇設定 `mode: "session"` 以持續後續追蹤）。
    - 或使用 `/focus <target>` 手動繫結。
    - 使用 `/agents` 檢查繫結狀態。
    - 使用 `/session idle <duration|off>` 與 `/session max-age <duration|off>` 控制自動取消聚焦。
    - 使用 `/unfocus` 分離執行緒。

    必要設定：

    - 全域預設值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆寫：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 產生時自動繫結：`channels.discord.threadBindings.spawnSessions` 預設為 `true`；將其設為 `false` 可停用繫結執行緒的工作階段產生。

    文件：[子代理](/zh-TW/tools/subagents)、[Discord](/zh-TW/channels/discord)、[設定參考](/zh-TW/gateway/configuration-reference)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="子代理已完成，但完成更新送到錯誤位置或從未發布。我該檢查什麼？">
    請先檢查解析後的請求者路由：

    - 完成模式的子代理傳遞會優先使用任何存在的繫結執行緒或對話路由。
    - 如果完成來源只帶有通道，OpenClaw 會退回到請求者工作階段儲存的路由（`lastChannel` / `lastTo` / `lastAccountId`），因此直接傳遞仍可能成功。
    - 如果既沒有繫結路由，也沒有可用的儲存路由，直接傳遞可能失敗，結果會改為退回佇列工作階段傳遞，而不是立即發布到聊天。
    - 無效或過期的目標仍可能強制佇列退回或造成最終傳遞失敗。
    - 如果子代理最後一則可見助理回覆是精確的靜默權杖 `NO_REPLY` / `no_reply`，或精確為 `ANNOUNCE_SKIP`，OpenClaw 會刻意抑制公告，而不是發布過期的早期進度。
    - Tool/toolResult 輸出不會提升為子代理結果文字；結果是子代理最新的可見助理回覆。

    偵錯：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)、[工作階段工具](/zh-TW/concepts/session-tool)。

  </Accordion>

  <Accordion title="排程或提醒未觸發。我該檢查什麼？">
    排程在閘道程序內執行。如果閘道未持續執行，
    排定的工作將不會執行。

    檢查清單：

    - 確認排程已啟用（`cron.enabled`），且未設定 `OPENCLAW_SKIP_CRON`。
    - 檢查閘道是否 24/7 執行（沒有睡眠/重新啟動）。
    - 驗證工作的時區設定（`--tz` 與主機時區）。

    偵錯：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="排程已觸發，但沒有任何內容傳送到頻道。為什麼？">
    請先檢查傳送模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示預期不會有執行器後援傳送。
    - 缺少或無效的公告目標（`channel` / `to`）表示執行器已略過對外傳送。
    - 頻道驗證失敗（`unauthorized`、`Forbidden`）表示執行器嘗試傳送，但認證阻擋了它。
    - 靜默隔離結果（僅 `NO_REPLY` / `no_reply`）會被視為刻意不可傳送，因此執行器也會抑制佇列中的後援傳送。

    對於隔離的排程工作，只要有聊天路由可用，代理仍可使用 `message`
    工具直接傳送。`--announce` 只控制代理尚未自行傳送的最終文字所使用的執行器
    後援路徑。

    偵錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="為什麼隔離的排程執行會切換模型或重試一次？">
    這通常是即時模型切換路徑，而不是重複排程。

    隔離排程可以在作用中的
    執行拋出 `LiveSessionModelSwitchError` 時，保存執行階段模型交接並重試。重試會保留已切換的
    提供者/模型；如果切換帶有新的驗證設定檔覆寫，排程也會在重試前保存該覆寫。

    相關選擇規則：

    - 適用時，Gmail 掛鉤模型覆寫會優先勝出。
    - 接著是每個工作的 `model`。
    - 接著是任何已儲存的排程工作階段模型覆寫。
    - 接著是一般代理/預設模型選擇。

    重試迴圈有界限。在初始嘗試加上 2 次切換重試後，
    排程會中止，而不是永遠迴圈。

    偵錯：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[排程命令列介面](/zh-TW/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 Skills？">
    使用原生 `openclaw skills` 命令，或將 Skills 放入你的工作區。macOS Skills UI 在 Linux 上無法使用。
    可在 [https://clawhub.ai](https://clawhub.ai) 瀏覽 Skills。

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

    原生 `openclaw skills install` 預設會寫入作用中工作區的 `skills/`
    目錄。加入 `--global` 可安裝到共用的受管理
    Skills 目錄，供所有本機代理使用。只有當你想發布或同步自己的 Skills 時，才需要安裝獨立的 `clawhub` 命令列介面。
    如果你想縮小哪些代理可以看到共用 Skills，請使用
    `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以按排程或持續在背景執行任務嗎？">
    可以。使用閘道排程器：

    - **排程工作** 用於排定或週期性任務（會在重新啟動後保留）。
    - **心跳偵測** 用於「主要工作階段」定期檢查。
    - **隔離工作** 用於發布摘要或傳送到聊天的自主代理。

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)、
    [心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以從 Linux 執行僅限 Apple macOS 的 Skills 嗎？">
    不能直接執行。macOS Skills 會受到 `metadata.openclaw.os` 加上必要二進位檔控管，且 Skills 只有在 **閘道主機** 上符合資格時才會出現在系統提示中。在 Linux 上，僅限 `darwin` 的 Skills（例如 `apple-notes`、`apple-reminders`、`things-mac`）不會載入，除非你覆寫該控管。

    你有三種受支援的模式：

    **選項 A - 在 Mac 上執行閘道（最簡單）。**
    在存在 macOS 二進位檔的地方執行閘道，然後從 Linux 以[遠端模式](#gateway-ports-already-running-and-remote-mode)或透過 Tailscale 連線。Skills 會正常載入，因為閘道主機是 macOS。

    **選項 B - 使用 macOS 節點（無 SSH）。**
    在 Linux 上執行閘道，配對一個 macOS 節點（選單列 App），並在 Mac 上將 **Node Run Commands** 設為「一律詢問」或「一律允許」。當節點上存在必要二進位檔時，OpenClaw 可以將僅限 macOS 的 Skills 視為符合資格。代理會透過 `nodes` 工具執行這些 Skills。如果你選擇「一律詢問」，在提示中核准「一律允許」會將該命令加入允許清單。

    **選項 C - 透過 SSH 代理 macOS 二進位檔（進階）。**
    將閘道保留在 Linux 上，但讓必要的命令列介面二進位檔解析為在 Mac 上執行的 SSH 包裝器。然後覆寫 Skill 以允許 Linux，讓它保持符合資格。

    1. 為二進位檔建立 SSH 包裝器（範例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 將包裝器放到 Linux 主機上的 `PATH`（例如 `~/bin/memo`）。
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

    - **自訂 Skill / 外掛：** 最適合可靠的 API 存取（Notion/HeyGen 都有 API）。
    - **瀏覽器自動化：** 無需程式碼即可運作，但較慢且較脆弱。

    如果你想按客戶保留情境（代理商工作流程），一個簡單模式是：

    - 每位客戶一個 Notion 頁面（情境 + 偏好設定 + 進行中的工作）。
    - 要求代理在工作階段開始時擷取該頁面。

    如果你想要原生整合，請開啟功能請求，或建置一個
    以這些 API 為目標的 Skill。

    安裝 Skills：

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    原生安裝會落在作用中工作區的 `skills/` 目錄。若要讓所有本機代理共用 Skills，請使用 `openclaw skills install @owner/<skill-slug> --global`（或手動放在 `~/.openclaw/skills/<name>/SKILL.md`）。如果只有部分代理應該看到共用安裝，請設定 `agents.defaults.skills` 或 `agents.list[].skills`。部分 Skills 預期會透過 Homebrew 安裝二進位檔；在 Linux 上，這表示 Linuxbrew（請參閱上方的 Homebrew Linux FAQ 項目）。請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config) 和 [ClawHub](/zh-TW/clawhub)。

  </Accordion>

  <Accordion title="如何搭配 OpenClaw 使用我現有已登入的 Chrome？">
    使用內建的 `user` 瀏覽器設定檔，它會透過 Chrome DevTools MCP 附加：

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    如果你想要自訂名稱，請建立明確的 MCP 設定檔：

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    此路徑可以使用本機主機瀏覽器或已連線的瀏覽器節點。如果閘道在其他地方執行，請在瀏覽器機器上執行節點主機，或改用遠端 CDP。

    `existing-session` / `user` 的目前限制：

    - 動作以 ref 驅動，而不是以 CSS selector 驅動
    - 上傳需要 `ref` / `inputRef`，且目前一次支援一個檔案
    - `responsebody`、PDF 匯出、下載攔截和批次動作仍需要受管理瀏覽器或原始 CDP 設定檔

  </Accordion>
</AccordionGroup>

## 沙盒與記憶體

<AccordionGroup>
  <Accordion title="有專門的沙盒文件嗎？">
    有。請參閱[沙盒](/zh-TW/gateway/sandboxing)。Docker 專用設定（在 Docker 中執行完整閘道或沙盒映像檔）請參閱 [Docker](/zh-TW/install/docker)。
  </Accordion>

  <Accordion title="Docker 感覺受限 - 如何啟用完整功能？">
    預設映像檔以安全性為優先，並以 `node` 使用者執行，因此不
    包含系統套件、Homebrew 或內建瀏覽器。若要取得更完整的設定：

    - 使用 `OPENCLAW_HOME_VOLUME` 保存 `/home/node`，讓快取保留下來。
    - 使用 `OPENCLAW_IMAGE_APT_PACKAGES` 將系統相依套件烘焙進映像檔。
    - 透過內建命令列介面安裝 Playwright 瀏覽器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 設定 `PLAYWRIGHT_BROWSERS_PATH`，並確保該路徑會被持久化。

    文件：[Docker](/zh-TW/install/docker)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="我可以讓 DM 保持私人，但讓群組透過同一個代理公開/沙盒化嗎？">
    可以，只要你的私人流量是 **DM**，而公開流量是 **群組**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，讓群組/頻道工作階段（非主要金鑰）在已設定的沙盒後端中執行，而主要 DM 工作階段則留在主機上。如果你沒有選擇後端，Docker 是預設後端。然後透過 `tools.sandbox.tools` 限制沙盒化工作階段中可用的工具。

    設定逐步說明 + 範例設定：[群組：私人 DM + 公開群組](/zh-TW/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定參考：[閘道設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="如何將主機資料夾繫結到沙盒中？">
    將 `agents.defaults.sandbox.docker.binds` 設為 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全域與每個代理的繫結會合併；當 `scope: "shared"` 時，會忽略每個代理的繫結。對任何敏感內容使用 `:ro`，並記住繫結會繞過沙盒檔案系統邊界。

    OpenClaw 會同時根據正規化路徑，以及透過最深既有祖先解析出的標準路徑，驗證繫結來源。這表示即使最後一個路徑片段尚不存在，符號連結父層逃逸仍會失敗關閉，且允許根目錄檢查仍會在符號連結解析後套用。

    請參閱[沙盒](/zh-TW/gateway/sandboxing#custom-bind-mounts)和[沙盒 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)取得範例和安全注意事項。

  </Accordion>

  <Accordion title="記憶體如何運作？">
    OpenClaw 記憶體只是代理工作區中的 Markdown 檔案：

    - `memory/YYYY-MM-DD.md` 中的每日筆記
    - `MEMORY.md` 中精選的長期筆記（僅限主要/私人工作階段）

    OpenClaw 也會執行**靜默預壓縮記憶體清除**，提醒模型
    在自動壓縮前寫入持久筆記。這只會在工作區
    可寫入時執行（唯讀沙盒會略過）。請參閱[記憶體](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="記憶一直忘記事情。我要怎麼讓它記住？">
    請 bot **將這項事實寫入記憶**。長期筆記應放在 `MEMORY.md`，
    短期脈絡則放進 `memory/YYYY-MM-DD.md`。

    這仍是我們正在改進的領域。提醒模型儲存記憶會有幫助；
    它會知道該怎麼做。如果它還是一直忘記，請確認閘道每次執行時都使用同一個
    工作區。

    文件：[記憶](/zh-TW/concepts/memory)、[Agent 工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="記憶會永久保留嗎？有哪些限制？">
    記憶檔案存放在磁碟上，會保留到你刪除為止。限制來自你的
    儲存空間，而不是模型。**工作階段脈絡**仍受模型脈絡視窗限制，
    因此長對話可能會被壓縮或截斷。這就是為什麼
    記憶搜尋存在 - 它只會把相關部分拉回脈絡中。

    文件：[記憶](/zh-TW/concepts/memory)、[脈絡](/zh-TW/concepts/context)。

  </Accordion>

  <Accordion title="語意記憶搜尋需要 OpenAI API 金鑰嗎？">
    只有在你使用 **OpenAI embeddings** 時才需要。Codex OAuth 涵蓋聊天/補全，
    但**不會**授予 embeddings 存取權，因此**使用 Codex 登入（OAuth 或
    Codex 命令列介面登入）**對語意記憶搜尋沒有幫助。OpenAI embeddings
    仍需要真正的 API 金鑰（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你沒有明確設定提供者，OpenClaw 會使用 OpenAI embeddings。仍寫著
    `memorySearch.provider = "auto"` 的舊版設定也會解析為 OpenAI。
    如果沒有可用的 OpenAI API 金鑰，語意記憶搜尋會維持不可用，
    直到你設定金鑰或明確選擇其他提供者。

    如果你偏好留在本機，請設定 `memorySearch.provider = "local"`（並可選擇性設定
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，請設定
    `memorySearch.provider = "gemini"` 並提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我們支援 **OpenAI、OpenAI 相容、Gemini、
    Voyage、Mistral、Bedrock、Ollama、LM Studio、GitHub Copilot、DeepInfra 或本機**
    embedding 模型 - 設定詳細資訊請見[記憶](/zh-TW/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 內容在磁碟上的位置

<AccordionGroup>
  <Accordion title="所有與 OpenClaw 搭配使用的資料都會儲存在本機嗎？">
    不會 - **OpenClaw 的狀態是本機的**，但**外部服務仍會看到你傳送給它們的內容**。

    - **預設為本機：** 工作階段、記憶檔案、設定與工作區位於閘道主機上
      （`~/.openclaw` + 你的工作區目錄）。
    - **必要時為遠端：** 你傳送給模型提供者（Anthropic/OpenAI/等）的訊息會送到
      它們的 API，而聊天平台（WhatsApp/Telegram/Slack/等）會將訊息資料儲存在它們的
      伺服器上。
    - **你控制足跡：** 使用本機模型會讓提示留在你的機器上，但頻道
      流量仍會經過該頻道的伺服器。

    相關：[Agent 工作區](/zh-TW/concepts/agent-workspace)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 會將資料儲存在哪裡？">
    所有內容都位於 `$OPENCLAW_STATE_DIR` 底下（預設：`~/.openclaw`）：

    | 路徑                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主要設定（JSON5）                                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 舊版 OAuth 匯入（首次使用時複製到驗證設定檔）                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 驗證設定檔（OAuth、API 金鑰，以及選用的 `keyRef`/`tokenRef`）      |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供者的選用檔案式祕密 payload                    |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 舊版相容性檔案（靜態 `api_key` 項目已清除）                        |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供者狀態（例如 `whatsapp/<accountId>/creds.json`）               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每個 agent 的狀態（agentDir + 工作階段）                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 對話歷史與狀態（每個 agent）                                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 工作階段中繼資料（每個 agent）                                     |

    舊版單一 agent 路徑：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）。

    你的**工作區**（AGENTS.md、記憶檔案、skills 等）是分開的，並透過 `agents.defaults.workspace` 設定（預設：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 應該放在哪裡？">
    這些檔案位於 **agent 工作區**，不是 `~/.openclaw`。

    - **工作區（每個 agent）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、選用的 `HEARTBEAT.md`。
      小寫根目錄 `memory.md` 只作為舊版修復輸入；當兩個檔案都存在時，`openclaw doctor --fix`
      可以將它合併進 `MEMORY.md`。
    - **狀態目錄（`~/.openclaw`）**：設定、頻道/提供者狀態、驗證設定檔、工作階段、記錄，
      以及共用 skills（`~/.openclaw/skills`）。

    預設工作區是 `~/.openclaw/workspace`，可透過以下方式設定：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果 bot 在重新啟動後「忘記」了，請確認閘道每次啟動時都使用同一個
    工作區（並記得：遠端模式使用的是**閘道主機的**
    工作區，不是你本機筆電的工作區）。

    提示：如果你想要持久保存某個行為或偏好，請要求 bot **將它寫入
    AGENTS.md 或 MEMORY.md**，而不是依賴聊天歷史。

    請見 [Agent 工作區](/zh-TW/concepts/agent-workspace)與[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我可以把 SOUL.md 變大嗎？">
    可以。`SOUL.md` 是注入到
    agent 脈絡中的工作區啟動檔案之一。預設的單一檔案注入限制是 `20000` 個字元，
    而跨檔案的總啟動預算是 `60000` 個字元。

    在你的 OpenClaw 設定中變更共用預設值：

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

    或覆寫單一 agent：

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    使用 `/context` 檢查原始大小與注入大小，以及是否發生截斷。
    讓 `SOUL.md` 專注在語氣、立場與人格；將操作規則
    放在 `AGENTS.md`，持久事實則放在記憶中。

    請見[脈絡](/zh-TW/concepts/context)與 [Agent 設定](/zh-TW/gateway/config-agents)。

  </Accordion>

  <Accordion title="建議的備份策略">
    將你的 **agent 工作區**放在**私有** git repo 中，並備份到某個
    私有位置（例如 GitHub private）。這會保存記憶 + AGENTS/SOUL/USER
    檔案，並讓你稍後還原助理的「心智」。

    **不要**提交 `~/.openclaw` 底下的任何內容（憑證、工作階段、token 或加密祕密 payload）。
    如果你需要完整還原，請分別備份工作區與狀態目錄
    （請見上方的遷移問題）。

    文件：[Agent 工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="我要如何完全解除安裝 OpenClaw？">
    請見專門指南：[解除安裝](/zh-TW/install/uninstall)。
  </Accordion>

  <Accordion title="Agent 可以在工作區之外運作嗎？">
    可以。工作區是**預設 cwd** 與記憶錨點，不是強制沙盒。
    相對路徑會在工作區內解析，但除非啟用沙盒化，否則絕對路徑可以存取其他
    主機位置。如果你需要隔離，請使用
    [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing) 或每個 agent 的沙盒設定。如果你
    想讓某個 repo 成為預設工作目錄，請將該 agent 的
    `workspace` 指向 repo 根目錄。OpenClaw repo 只是原始碼；除非你有意讓 agent 在其中工作，
    否則請讓工作區保持分離。

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

  <Accordion title="遠端模式：工作階段儲存區在哪裡？">
    工作階段狀態由**閘道主機**擁有。如果你處於遠端模式，你關心的工作階段儲存區位於遠端機器上，而不是你的本機筆電。請見[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>
</AccordionGroup>

## 設定基礎

<AccordionGroup>
  <Accordion title="設定格式是什麼？在哪裡？">
    OpenClaw 會從 `$OPENCLAW_CONFIG_PATH` 讀取選用的 **JSON5** 設定（預設：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果檔案不存在，它會使用相對安全的預設值（包含預設工作區 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我設定了 gateway.bind: "lan"（或 "tailnet"），但現在沒有任何東西監聽 / UI 顯示未授權'>
    非 loopback 繫結**需要有效的閘道驗證路徑**。實務上這表示：

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

    注意：

    - `gateway.remote.token` / `.password` 本身**不會**啟用本機閘道驗證。
    - 只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才可以使用 `gateway.remote.*` 作為 fallback。
    - 對於密碼驗證，請改為設定 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果透過 SecretRef 明確設定 `gateway.auth.token` / `gateway.auth.password` 但無法解析，解析會以 fail closed 方式失敗（沒有遠端 fallback 遮蔽）。
    - Shared-secret Control UI 設定會透過 `connect.params.auth.token` 或 `connect.params.auth.password`（儲存在 app/UI 設定中）進行驗證。帶有身分的模式（例如 Tailscale Serve 或 `trusted-proxy`）則使用請求標頭。避免將 shared secret 放在 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 時，同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並在 `gateway.trustedProxies` 中加入 loopback 項目。

  </Accordion>

  <Accordion title="為什麼我現在在 localhost 也需要 token？">
    OpenClaw 預設會強制執行閘道驗證，包含 loopback。在一般預設路徑中，這表示 token 驗證：如果未設定明確的驗證路徑，閘道啟動會解析為 token 模式，並為該次啟動產生僅限執行階段使用的 token，因此**本機 WS 用戶端必須驗證**。當用戶端需要跨重新啟動維持穩定 secret 時，請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。這會阻止其他本機程序呼叫閘道。

    如果你偏好不同的驗證路徑，可以明確選擇密碼模式（或針對具身分感知能力的反向 Proxy，選擇 `trusted-proxy`）。如果你**真的**想要開放 loopback，請在設定中明確設定 `gateway.auth.mode: "none"`。Doctor 隨時可以替你產生 token：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="變更設定後是否必須重新啟動？">
    閘道會監看設定並支援熱重新載入：

    - `gateway.reload.mode: "hybrid"`（預設）：熱套用安全的變更，針對關鍵變更重新啟動
    - 也支援 `hot`、`restart`、`off`

  </Accordion>

  <Accordion title="如何停用有趣的命令列介面標語？">
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
    - `random`：輪播有趣/季節性的標語（預設行為）。
    - 如果完全不想顯示橫幅，請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何啟用網頁搜尋（以及網頁擷取）？">
    `web_fetch` 不需要 API 金鑰即可運作。`web_search` 取決於你選取的
    provider：

    - 由 API 支援的 provider，例如 Brave、Exa、Firecrawl、Gemini、Kimi、MiniMax Search、Perplexity 和 Tavily，需要其一般 API 金鑰設定。
    - Grok 可以重用模型驗證中的 xAI OAuth，或退回使用 `XAI_API_KEY` / 外掛網頁搜尋設定。
    - Ollama Web Search 不需要金鑰，但它會使用你設定的 Ollama 主機，且需要 `ollama signin`。
    - DuckDuckGo 不需要金鑰，但它是非官方的 HTML 型整合。
    - SearXNG 不需要金鑰/可自行託管；設定 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **建議：**執行 `openclaw configure --section web` 並選擇 provider。
    環境變數替代方案：

    - Brave：`BRAVE_API_KEY`
    - Exa：`EXA_API_KEY`
    - Firecrawl：`FIRECRAWL_API_KEY`
    - Gemini：`GEMINI_API_KEY`
    - Grok：xAI OAuth、`XAI_API_KEY`
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

    Provider 專屬的網頁搜尋設定現在位於 `plugins.entries.<plugin>.config.webSearch.*` 底下。
    舊版 `tools.web.search.*` provider 路徑仍會暫時載入以維持相容性，但不應用於新設定。
    Firecrawl 網頁擷取後援設定位於 `plugins.entries.firecrawl.config.webFetch.*` 底下。

    注意事項：

    - 如果你使用允許清單，請加入 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 預設為啟用（除非明確停用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 會從可用憑證中自動偵測第一個就緒的擷取後援 provider。官方 Firecrawl 外掛提供該後援。
    - Daemon 會從 `~/.openclaw/.env`（或服務環境）讀取環境變數。

    文件：[網頁工具](/zh-TW/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清空了我的設定。如何復原並避免這種情況？">
    `config.apply` 會取代**整份設定**。如果你傳送部分物件，其他所有內容
    都會被移除。

    目前的 OpenClaw 會防護許多意外覆寫：

    - OpenClaw 擁有的設定寫入會在寫入前驗證完整的變更後設定。
    - 無效或具破壞性的 OpenClaw 擁有寫入會被拒絕，並儲存為 `openclaw.json.rejected.*`。
    - 如果直接編輯導致啟動或熱重新載入失敗，閘道會失敗關閉或略過重新載入；它不會重寫 `openclaw.json`。
    - `openclaw doctor --fix` 負責修復，並可還原最後已知良好設定，同時將被拒絕的檔案儲存為 `openclaw.json.clobbered.*`。

    復原：

    - 檢查 `openclaw logs --follow` 是否有 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 檢查有效設定旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 執行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 只用 `openclaw config set` 或 `config.patch` 複製預期的鍵回去。
    - 如果沒有最後已知良好設定或被拒絕的 payload，請從備份還原，或重新執行 `openclaw doctor` 並重新設定 channels/models。
    - 如果這不是預期行為，請回報 bug，並附上你最後已知的設定或任何備份。
    - 本機 coding agent 通常可以從 logs 或歷史紀錄重建可運作的設定。

    避免方式：

    - 小幅變更請使用 `openclaw config set`。
    - 互動式編輯請使用 `openclaw configure`。
    - 如果不確定確切路徑或欄位形狀，請先使用 `config.schema.lookup`；它會回傳淺層 schema 節點，以及直接子項摘要供向下鑽研。
    - 部分 RPC 編輯請使用 `config.patch`；`config.apply` 只保留給完整設定取代。
    - 如果你是在 agent 執行中使用面向 agent 的 `gateway` 工具，它仍會拒絕寫入 `tools.exec.ask` / `tools.exec.security`（包括會正規化到相同受保護 exec 路徑的舊版 `tools.bash.*` alias）。

    文件：[設定](/zh-TW/cli/config)、[設定精靈](/zh-TW/cli/configure)、[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="如何跨裝置執行具有專門 worker 的中央閘道？">
    常見模式是**一個閘道**（例如 Raspberry Pi）加上**節點**與 **agent**：

    - **閘道（中央）：**擁有 channels（Signal/WhatsApp）、routing 和 sessions。
    - **節點（裝置）：**Mac/iOS/Android 會以周邊裝置連線，並公開本機工具（`system.run`、`canvas`、`camera`）。
    - **Agent（worker）：**供特殊角色使用的獨立大腦/工作區（例如「Hetzner ops」、「Personal data」）。
    - **Sub-agent：**當你需要平行處理時，從主要 agent 產生背景工作。
    - **終端介面：**連線到閘道並切換 agents/sessions。

    文件：[節點](/zh-TW/nodes)、[遠端存取](/zh-TW/gateway/remote)、[多 Agent 路由](/zh-TW/concepts/multi-agent)、[Sub-agents](/zh-TW/tools/subagents)、[終端介面](/zh-TW/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 瀏覽器可以 headless 執行嗎？">
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

    預設為 `false`（headful）。Headless 在某些網站上較可能觸發反 bot 檢查。請參閱[瀏覽器](/zh-TW/tools/browser)。

    Headless 使用**相同的 Chromium 引擎**，並適用於大多數自動化（表單、點擊、抓取、登入）。主要差異：

    - 沒有可見的瀏覽器視窗（如果需要視覺畫面，請使用 screenshots）。
    - 有些網站在 headless 模式下對自動化更嚴格（CAPTCHA、反 bot）。
      例如，X/Twitter 經常封鎖 headless sessions。

  </Accordion>

  <Accordion title="如何使用 Brave 進行瀏覽器控制？">
    將 `browser.executablePath` 設為你的 Brave binary（或任何基於 Chromium 的瀏覽器），並重新啟動閘道。
    完整設定範例請參閱[瀏覽器](/zh-TW/tools/browser#use-brave-or-another-chromium-based-browser)。
  </Accordion>
</AccordionGroup>

## 遠端閘道與節點

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、閘道與節點之間傳遞？">
    Telegram 訊息由**閘道**處理。閘道會執行 agent，並且
    只有在需要節點工具時，才會透過 **Gateway WebSocket** 呼叫節點：

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    節點看不到傳入的 provider 流量；它們只會接收節點 RPC 呼叫。

  </Accordion>

  <Accordion title="如果閘道託管在遠端，我的 agent 要如何存取我的電腦？">
    簡短回答：**將你的電腦配對為節點**。閘道在其他地方執行，但它可以
    透過 Gateway WebSocket 呼叫你本機上的 `node.*` 工具（螢幕、相機、系統）。

    典型設定：

    1. 在永遠開機的主機（VPS/家用伺服器）上執行閘道。
    2. 將閘道主機與你的電腦放在同一個 tailnet。
    3. 確認 Gateway WS 可連線（tailnet bind 或 SSH tunnel）。
    4. 在本機開啟 macOS app，並以 **Remote over SSH** 模式（或直接 tailnet）
       連線，讓它能註冊為節點。
    5. 在閘道上核准該節點：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要另外的 TCP bridge；節點會透過 Gateway WebSocket 連線。

    安全提醒：配對 macOS 節點會允許在該機器上執行 `system.run`。只
    配對你信任的裝置，並檢閱[安全性](/zh-TW/gateway/security)。

    文件：[節點](/zh-TW/nodes)、[閘道通訊協定](/zh-TW/gateway/protocol)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已連線，但我沒有收到回覆。現在該怎麼辦？">
    檢查基本項目：

    - 閘道正在執行：`openclaw gateway status`
    - 閘道健康狀態：`openclaw status`
    - Channel 健康狀態：`openclaw channels status`

    接著驗證 auth 與 routing：

    - 如果你使用 Tailscale Serve，請確認 `gateway.auth.allowTailscale` 設定正確。
    - 如果你透過 SSH tunnel 連線，請確認本機 tunnel 已啟動並指向正確連接埠。
    - 確認你的允許清單（DM 或群組）包含你的帳號。

    文件：[Tailscale](/zh-TW/gateway/tailscale)、[遠端存取](/zh-TW/gateway/remote)、[Channels](/zh-TW/channels)。

  </Accordion>

  <Accordion title="兩個 OpenClaw 執行個體可以彼此通訊嗎（本機 + VPS）？">
    可以。沒有內建的「bot-to-bot」bridge，但你可以用幾種
    可靠方式串接：

    **最簡單：**使用兩個 bot 都能存取的一般聊天 channel（Telegram/Slack/WhatsApp）。
    讓 Bot A 傳送訊息給 Bot B，然後讓 Bot B 照常回覆。

    **命令列介面 bridge（通用）：**執行一個 script，用
    `openclaw agent --message ... --deliver` 呼叫另一個閘道，目標設為另一個 bot
    監聽的聊天。如果其中一個 bot 位於遠端 VPS，請透過 SSH/Tailscale
    將你的命令列介面指向該遠端閘道（請參閱[遠端存取](/zh-TW/gateway/remote)）。

    範例模式（從能連到目標閘道的機器執行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加入 guardrail，避免兩個 bot 無限循環（僅提及時回覆、channel
    允許清單，或「不要回覆 bot 訊息」規則）。

    文件：[遠端存取](/zh-TW/gateway/remote)、[Agent 命令列介面](/zh-TW/cli/agent)、[Agent 傳送](/zh-TW/tools/agent-send)。

  </Accordion>

  <Accordion title="多個 agent 需要各自獨立的 VPS 嗎？">
    不需要。一個閘道可以託管多個 agent，每個 agent 都有自己的工作區、model defaults
    和 routing。這是一般設定，而且比每個 agent 執行一台 VPS 便宜且簡單得多。

    只有在你需要強隔離（安全邊界）或非常
    不同且不想共享的設定時，才使用獨立 VPS。否則，維持一個閘道並
    使用多個 agents 或 sub-agents。

  </Accordion>

  <Accordion title="使用個人筆電上的節點，而不是從 VPS SSH 連線，有好處嗎？">
    有，節點是從遠端閘道連到你筆電的一等方式，而且
    不只解鎖 shell 存取。閘道可在 macOS/Linux 上執行（Windows 透過 WSL2），而且
    很輕量（小型 VPS 或 Raspberry Pi 等級的機器就可以；4 GB RAM 很足夠），所以常見
    設定是一台永遠在線的主機，加上你的筆電作為節點。

    - **不需要入站 SSH。** 節點會向外連到閘道 WebSocket，並使用裝置配對。
    - **更安全的執行控制。** `system.run` 會由該筆電上的節點允許清單/核准把關。
    - **更多裝置工具。** 除了 `system.run`，節點還會公開 `canvas`、`camera` 和 `screen`。
    - **本機瀏覽器自動化。** 將閘道保留在 VPS 上，但透過筆電上的節點主機在本機執行 Chrome，或透過 Chrome MCP 連接到主機上的本機 Chrome。

    SSH 適合臨時 shell 存取，但節點對於持續的代理工作流程和
    裝置自動化更簡單。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="節點會執行閘道服務嗎？">
    不會。除非你刻意執行隔離設定檔，否則每台主機只應執行 **一個閘道**（請見[多個閘道](/zh-TW/gateway/multiple-gateways)）。節點是連線到閘道的周邊裝置
    （iOS/Android 節點，或選單列應用程式中的 macOS「節點模式」）。如需無頭節點
    主機和命令列介面控制，請見[節點主機命令列介面](/zh-TW/cli/node)。

    `gateway`、`discovery` 和託管外掛介面的變更需要完整重新啟動。

  </Accordion>

  <Accordion title="有 API / RPC 方式可以套用設定嗎？">
    有。

    - `config.schema.lookup`：在寫入前檢查一個設定子樹，包含其淺層結構節點、相符的 UI 提示，以及直接子項摘要
    - `config.get`：擷取目前快照 + 雜湊
    - `config.patch`：安全的部分更新（大多數 RPC 編輯的首選）；可行時熱重新載入，必要時重新啟動
    - `config.apply`：驗證 + 取代完整設定；可行時熱重新載入，必要時重新啟動
    - 面向代理的 `gateway` 執行階段工具仍會拒絕重寫 `tools.exec.ask` / `tools.exec.security`；舊版 `tools.bash.*` 別名會正規化到相同的受保護 exec 路徑

  </Accordion>

  <Accordion title="首次安裝的最小合理設定">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    這會設定你的工作區，並限制誰可以觸發 Bot。

  </Accordion>

  <Accordion title="如何在 VPS 上設定 Tailscale，並從我的 Mac 連線？">
    最小步驟：

    1. **在 VPS 上安裝 + 登入**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安裝 + 登入**
       - 使用 Tailscale 應用程式，並登入同一個 tailnet。
    3. **啟用 MagicDNS（建議）**
       - 在 Tailscale 管理主控台中啟用 MagicDNS，讓 VPS 擁有穩定名稱。
    4. **使用 tailnet 主機名稱**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - 閘道 WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想要不透過 SSH 使用控制 UI，請在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    這會讓閘道繫結到 local loopback，並透過 Tailscale 公開 HTTPS。請見 [Tailscale](/zh-TW/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何將 Mac 節點連到遠端閘道（Tailscale Serve）？">
    Serve 會公開 **閘道控制 UI + WS**。節點會透過相同的閘道 WS 端點連線。

    建議設定：

    1. **確認 VPS + Mac 位於同一個 tailnet**。
    2. **在遠端模式使用 macOS 應用程式**（SSH 目標可以是 tailnet 主機名稱）。
       應用程式會建立閘道連接埠通道，並以節點身分連線。
    3. **在閘道上核准節點**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文件：[閘道協定](/zh-TW/gateway/protocol)、[探索](/zh-TW/gateway/discovery)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我應該在第二台筆電上安裝，還是只新增節點？">
    如果你只需要第二台筆電上的**本機工具**（screen/camera/exec），請將它新增為
    **節點**。這會保留單一閘道，並避免重複設定。本機節點工具
    目前僅支援 macOS，但我們計畫將它們擴展到其他作業系統。

    只有在你需要**強隔離**或兩個完全獨立的 Bot 時，才安裝第二個閘道。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境變數和 .env 載入

<AccordionGroup>
  <Accordion title="OpenClaw 如何載入環境變數？">
    OpenClaw 會從父程序（shell、launchd/systemd、CI 等）讀取環境變數，並額外載入：

    - 目前工作目錄中的 `.env`
    - 來自 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`）的全域備援 `.env`

    兩個 `.env` 檔案都不會覆寫既有環境變數。
    提供者憑證變數是工作區 `.env` 的例外：像是
    `GEMINI_API_KEY`、`XAI_API_KEY` 或 `MISTRAL_API_KEY` 這類鍵會從工作區
    `.env` 中被忽略，應放在程序環境、`~/.openclaw/.env` 或設定 `env` 中。

    你也可以在設定中定義內嵌環境變數（僅在程序環境缺少時套用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    完整優先順序和來源請見 [/environment](/zh-TW/help/environment)。

  </Accordion>

  <Accordion title="我透過服務啟動閘道，但我的環境變數不見了。現在怎麼辦？">
    兩個常見修正：

    1. 將缺少的鍵放入 `~/.openclaw/.env`，這樣即使服務沒有繼承你的 shell 環境，也會被擷取。
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

    這會執行你的登入 shell，並只匯入缺少的預期鍵（絕不覆寫）。對應的環境變數：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我設定了 COPILOT_GITHUB_TOKEN，但模型狀態顯示「Shell env: off.」為什麼？'>
    `openclaw models status` 回報的是 **shell 環境匯入** 是否啟用。「Shell env: off」
    **不**代表你的環境變數遺失，只代表 OpenClaw 不會自動載入
    你的登入 shell。

    如果閘道以服務（launchd/systemd）形式執行，它不會繼承你的 shell
    環境。請用以下任一方式修正：

    1. 將權杖放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或啟用 shell 匯入（`env.shellEnv.enabled: true`）。
    3. 或將它新增到你的設定 `env` 區塊（僅在缺少時套用）。

    然後重新啟動閘道並重新檢查：

    ```bash
    openclaw models status
    ```

    Copilot 權杖會從 `COPILOT_GITHUB_TOKEN` 讀取（也包含 `GH_TOKEN` / `GITHUB_TOKEN`）。
    請見 [/concepts/model-providers](/zh-TW/concepts/model-providers) 和 [/environment](/zh-TW/help/environment)。

  </Accordion>
</AccordionGroup>

## 工作階段和多個聊天

<AccordionGroup>
  <Accordion title="如何開始全新對話？">
    將 `/new` 或 `/reset` 作為獨立訊息傳送。請見[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>

  <Accordion title="如果我從不傳送 /new，工作階段會自動重設嗎？">
    工作階段可在 `session.idleMinutes` 後過期，但這**預設為停用**（預設 **0**）。
    將它設為正值即可啟用閒置過期。啟用後，閒置期間結束後的**下一則**
    訊息會為該聊天鍵啟動新的工作階段 ID。
    這不會刪除逐字稿，只是開始新的工作階段。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有沒有辦法組成一個 OpenClaw 執行個體團隊（一個 CEO 和許多代理）？">
    有，可透過**多代理路由**和**子代理**。你可以建立一個協調
    代理，以及數個各自擁有工作區和模型的工作代理。

    話雖如此，這最好視為一個**有趣的實驗**。它會耗費大量權杖，而且通常
    比不上使用一個 Bot 搭配不同工作階段來得有效率。我們設想的典型模式是
    一個你對話的 Bot，並為平行工作使用不同工作階段。該
    Bot 也可以在需要時產生子代理。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[代理命令列介面](/zh-TW/cli/agents)。

  </Accordion>

  <Accordion title="為什麼內容在任務中途被截斷？如何避免？">
    工作階段內容受模型視窗限制。長聊天、大型工具輸出或許多
    檔案可能觸發壓縮或截斷。

    有幫助的做法：

    - 請 Bot 摘要目前狀態並寫入檔案。
    - 在長任務前使用 `/compact`，切換主題時使用 `/new`。
    - 將重要內容保留在工作區，並請 Bot 讀回。
    - 將子代理用於長時間或平行工作，讓主要聊天保持較小。
    - 如果這經常發生，請選擇具備更大內容視窗的模型。

  </Accordion>

  <Accordion title="如何完全重設 OpenClaw 但保留安裝？">
    使用重設命令：

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

    - 如果偵測到既有設定，入門設定也會提供**重設**。請見[入門設定（命令列介面）](/zh-TW/start/wizard)。
    - 如果你使用設定檔（`--profile` / `OPENCLAW_PROFILE`），請重設每個狀態目錄（預設為 `~/.openclaw-<profile>`）。
    - 開發重設：`openclaw gateway --dev --reset`（僅限開發；會清除開發設定 + 憑證 + 工作階段 + 工作區）。

  </Accordion>

  <Accordion title='我收到「context too large」錯誤，該如何重設或壓縮？'>
    使用下列其中一項：

    - **壓縮**（保留對話，但摘要較早的回合）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 來引導摘要。

    - **重設**（為相同聊天鍵建立新的工作階段 ID）：

      ```
      /new
      /reset
      ```

    如果持續發生：

    - 啟用或調整**工作階段修剪**（`agents.defaults.contextPruning`）以修剪舊工具輸出。
    - 使用具備更大內容視窗的模型。

    文件：[壓縮](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title='為什麼我看到「LLM request rejected: messages.content.tool_use.input field required」？'>
    這是提供者驗證錯誤：模型發出缺少必要
    `input` 的 `tool_use` 區塊。這通常代表工作階段歷史已過時或損毀（常見於長討論串
    或工具/結構變更之後）。

    修正：使用 `/new` 開始新的工作階段（獨立訊息）。

  </Accordion>

  <Accordion title="為什麼我每 30 分鐘都會收到心跳偵測訊息？">
    心跳偵測預設每 **30m** 執行一次（使用 OAuth 驗證時為 **1h**）。調整或停用它們：

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

    如果 `HEARTBEAT.md` 存在但實際上是空的（只有空白行、
    Markdown/HTML 註解、像 `# Heading` 這樣的 Markdown 標題、圍欄標記，
    或空白的檢查清單 stub），OpenClaw 會略過心跳偵測執行，以節省 API 呼叫。
    如果檔案缺失，心跳偵測仍會執行，並由模型決定要做什麼。

    每個代理的覆寫使用 `agents.list[].heartbeat`。文件：[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要將「bot account」加入 WhatsApp 群組嗎？'>
    不需要。OpenClaw 會在**你自己的帳號**上執行，所以如果你在群組裡，OpenClaw 就能看見它。
    預設情況下，群組回覆會被封鎖，直到你允許傳送者（`groupPolicy: "allowlist"`）。

    如果你希望只有**你**能觸發群組回覆：

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
    選項 1（最快）：追蹤日誌，並在群組中傳送一則測試訊息：

    ```bash
    openclaw logs --follow --json
    ```

    尋找以 `@g.us` 結尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    選項 2（如果已設定/允許清單）：從設定列出群組：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[目錄](/zh-TW/cli/directory)、[日誌](/zh-TW/cli/logs)。

  </Accordion>

  <Accordion title="為什麼 OpenClaw 不在群組中回覆？">
    兩個常見原因：

    - 提及閘門已開啟（預設）。你必須 @提及 bot（或符合 `mentionPatterns`）。
    - 你設定了 `channels.whatsapp.groups` 但沒有 `"*"`，而且該群組不在允許清單中。

    請參閱[群組](/zh-TW/channels/groups)和[群組訊息](/zh-TW/channels/group-messages)。

  </Accordion>

  <Accordion title="群組/執行緒會和私訊共用上下文嗎？">
    直接聊天預設會收斂到主要工作階段。群組/頻道有自己的工作階段鍵，Telegram 主題 / Discord 執行緒則是獨立的工作階段。請參閱[群組](/zh-TW/channels/groups)和[群組訊息](/zh-TW/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以建立多少個工作區和代理？">
    沒有硬性限制。數十個（甚至數百個）都可以，但請注意：

    - **磁碟成長：**工作階段 + 逐字稿位於 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：**更多代理表示更多並行模型使用量。
    - **維運負擔：**每個代理各自的驗證設定檔、工作區和頻道路由。

    提示：

    - 每個代理保留一個**啟用中**工作區（`agents.defaults.workspace`）。
    - 如果磁碟成長，修剪舊工作階段（刪除 JSONL 或儲存項目）。
    - 使用 `openclaw doctor` 找出零散工作區和設定檔不相符。

  </Accordion>

  <Accordion title="我可以同時執行多個 bot 或聊天（Slack）嗎？應該如何設定？">
    可以。使用**多代理路由**來執行多個隔離代理，並依
    頻道/帳號/對等端路由傳入訊息。Slack 支援作為頻道，且可綁定到特定代理。

    瀏覽器存取功能強大，但並不是「人類能做什麼就能做什麼」——反機器人、CAPTCHA 和 MFA
    仍可能阻擋自動化。若要取得最可靠的瀏覽器控制，請在主機上使用本機 Chrome MCP，
    或在實際執行瀏覽器的機器上使用 CDP。

    最佳實務設定：

    - 常駐閘道主機（VPS/Mac mini）。
    - 每個角色一個代理（繫結）。
    - Slack 頻道綁定到這些代理。
    - 需要時透過 Chrome MCP 或節點使用本機瀏覽器。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[Slack](/zh-TW/channels/slack)、
    [瀏覽器](/zh-TW/tools/browser)、[節點](/zh-TW/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、故障轉移和驗證設定檔

模型問答 — 預設值、選擇、別名、切換、故障轉移、驗證設定檔 —
位於[模型常見問題](/zh-TW/help/faq-models)。

## 閘道：連接埠、「已在執行」和遠端模式

<AccordionGroup>
  <Accordion title="閘道使用哪個連接埠？">
    `gateway.port` 控制 WebSocket + HTTP（Control UI、hooks 等）的單一多工連接埠。

    優先順序：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示「Runtime: running」但「Connectivity probe: failed」？'>
    因為「running」是**監督程式**的視角（launchd/systemd/schtasks）。連線能力探測則是命令列介面實際連線到閘道 WebSocket。

    使用 `openclaw gateway status`，並信任這些行：

    - `Probe target:`（探測實際使用的 URL）
    - `Listening:`（實際綁定在連接埠上的項目）
    - `Last gateway error:`（程序仍存活但連接埠沒有監聽時的常見根本原因）

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示「Config (cli)」和「Config (service)」不同？'>
    你正在編輯一個設定檔，但服務正在執行另一個設定檔（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不相符）。

    修正：

    ```bash
    openclaw gateway install --force
    ```

    請從你希望服務使用的相同 `--profile` / 環境執行。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」是什麼意思？'>
    OpenClaw 會在啟動時立即繫結 WebSocket 監聽器（預設 `ws://127.0.0.1:18789`），以強制執行執行階段鎖定。如果繫結因 `EADDRINUSE` 失敗，會丟出 `GatewayLockError`，表示另一個執行個體已經在監聽。

    修正：停止另一個執行個體、釋放連接埠，或使用 `openclaw gateway --port <port>` 執行。

  </Accordion>

  <Accordion title="如何以遠端模式執行 OpenClaw（用戶端連線到其他位置的閘道）？">
    設定 `gateway.mode: "remote"`，並指向遠端 WebSocket URL，也可以選擇搭配 shared-secret 遠端認證：

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
    - `gateway.remote.token` / `.password` 只是用戶端的遠端認證；它們本身不會啟用本機閘道驗證。

  </Accordion>

  <Accordion title='Control UI 顯示「unauthorized」（或持續重新連線）。現在該怎麼辦？'>
    你的閘道驗證路徑與 UI 的驗證方法不相符。

    事實（來自程式碼）：

    - Control UI 會針對目前瀏覽器分頁工作階段與選取的閘道 URL，將權杖保存在 `sessionStorage`，因此同一分頁重新整理仍可繼續運作，而不會恢復長期 localStorage 權杖持久化。
    - 發生 `AUTH_TOKEN_MISMATCH` 時，若閘道回傳重試提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`），受信任用戶端可以使用快取的裝置權杖嘗試一次有界重試。
    - 該快取權杖重試現在會重用與裝置權杖一起儲存的快取已核准範圍。明確的 `deviceToken` / 明確的 `scopes` 呼叫者仍會保留其要求的範圍集，而不是繼承快取範圍。
    - 在該重試路徑之外，連線驗證優先順序是先使用明確的 shared token/password，接著是明確的 `deviceToken`，再來是已儲存的裝置權杖，最後是 bootstrap token。
    - 內建 setup-code bootstrap 僅限節點。核准後，它會回傳具有 `scopes: []` 的節點裝置權杖，而且不會回傳交接的 operator 權杖。

    修正：

    - 最快方式：`openclaw dashboard`（列印並複製儀表板 URL、嘗試開啟；若為無頭環境則顯示 SSH 提示）。
    - 如果你還沒有權杖：`openclaw doctor --generate-gateway-token`。
    - 如果是遠端，先建立通道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。
    - Shared-secret 模式：設定 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然後在 Control UI 設定中貼上相符的密鑰。
    - Tailscale Serve 模式：確認已啟用 `gateway.auth.allowTailscale`，而且你開啟的是 Serve URL，不是會繞過 Tailscale 身分標頭的原始 loopback/tailnet URL。
    - 受信任 proxy 模式：確認你是經由已設定的身分感知 proxy 進入，而不是使用原始閘道 URL。同主機 loopback proxy 也需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重試後仍不相符，請輪替/重新核准配對的裝置權杖：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果該輪替呼叫表示遭到拒絕，請檢查兩件事：
      - paired-device 工作階段只能輪替它們**自己的**裝置，除非它們也擁有 `operator.admin`
      - 明確的 `--scope` 值不能超過呼叫者目前的 operator 範圍
    - 仍然卡住？執行 `openclaw status --all`，並依照[疑難排解](/zh-TW/gateway/troubleshooting)操作。驗證詳細資訊請參閱[儀表板](/zh-TW/web/dashboard)。

  </Accordion>

  <Accordion title="我設定 gateway.bind tailnet，但它無法繫結且沒有任何東西在監聽">
    `tailnet` 繫結會從你的網路介面選取一個 Tailscale IP（100.64.0.0/10）。如果機器不在 Tailscale 上（或介面已關閉），就沒有可繫結的項目。

    修正：

    - 在該主機上啟動 Tailscale（讓它有 100.x 位址），或
    - 切換為 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是明確指定。`auto` 偏好 loopback；當你想要僅限 tailnet 的繫結時，請使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主機上執行多個閘道嗎？">
    通常不行 - 一個閘道可以執行多個訊息通道與代理程式。只有在需要備援（例如：rescue bot）或強隔離時，才使用多個閘道。

    可以，但你必須隔離：

    - `OPENCLAW_CONFIG_PATH`（每個執行個體的設定）
    - `OPENCLAW_STATE_DIR`（每個執行個體的狀態）
    - `agents.defaults.workspace`（工作區隔離）
    - `gateway.port`（唯一連接埠）

    快速設定（建議）：

    - 每個執行個體使用 `openclaw --profile <name> ...`（自動建立 `~/.openclaw-<name>`）。
    - 在每個 profile 設定中設定唯一的 `gateway.port`（或在手動執行時傳入 `--port`）。
    - 安裝每個 profile 的服務：`openclaw --profile <name> gateway install`。

    Profile 也會為服務名稱加上後綴（`ai.openclaw.<profile>`；舊版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ code 1008 是什麼意思？'>
    閘道是 **WebSocket 伺服器**，並預期第一則訊息必須是
    `connect` frame。如果收到其他任何內容，它會以 **code 1008**
    （policy violation）關閉連線。

    常見原因：

    - 你在瀏覽器中開啟了 **HTTP** URL（`http://...`），而不是使用 WS 用戶端。
    - 你使用了錯誤的連接埠或路徑。
    - proxy 或通道剝除了驗證標頭，或傳送了非閘道請求。

    快速修正：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，則使用 `wss://...`）。
    2. 不要在一般瀏覽器分頁中開啟 WS 連接埠。
    3. 如果已啟用驗證，請在 `connect` frame 中包含權杖/密碼。

    如果你使用命令列介面或終端介面，URL 應如下所示：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    通訊協定詳細資訊：[閘道通訊協定](/zh-TW/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 記錄與偵錯

<AccordionGroup>
  <Accordion title="記錄在哪裡？">
    檔案記錄（結構化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以透過 `logging.file` 設定穩定路徑。檔案日誌層級由 `logging.level` 控制。主控台詳細程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快查看日誌尾端：

    ```bash
    openclaw logs --follow
    ```

    服務/監督器日誌（當閘道透過 launchd/systemd 執行時）：

    - macOS launchd stdout：`~/Library/Logs/openclaw/gateway.log`（設定檔使用 `gateway-<profile>.log`；stderr 會被抑制）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    如需更多資訊，請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何啟動/停止/重新啟動 Gateway 服務？">
    使用閘道輔助指令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行閘道，`openclaw gateway --force` 可以取回連接埠。請參閱 [Gateway](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上關閉了終端機 - 要如何重新啟動 OpenClaw？">
    有**三種 Windows 安裝模式**：

    **1) Windows Hub 本機設定：** 原生應用程式會管理本機應用程式擁有的 WSL Gateway。

    從開始功能表或系統匣開啟 **OpenClaw Companion**，然後使用
    **Gateway Setup** 或 Connections 分頁。

    **2) 手動 WSL2 Gateway：** Gateway 在 Linux 內執行。

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

    **3) 原生 Windows 命令列介面/Gateway：** Gateway 直接在 Windows 中執行。

    開啟 PowerShell 並執行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行它（沒有服務），請使用：

    ```powershell
    openclaw gateway run
    ```

    文件：[Windows](/zh-TW/platforms/windows)、[Gateway 服務操作手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="Gateway 已啟動但回覆一直沒有送達。我該檢查什麼？">
    先快速掃描健康狀態：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常見原因：

    - 模型驗證未在 **gateway host** 載入（檢查 `models status`）。
    - 頻道配對/允許清單封鎖回覆（檢查頻道設定 + 日誌）。
    - WebChat/儀表板開啟時沒有正確 token。

    如果你是遠端連線，請確認通道/Tailscale 連線已啟用，且
    Gateway WebSocket 可以連線。

    文件：[頻道](/zh-TW/channels)、[疑難排解](/zh-TW/gateway/troubleshooting)、[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 現在該怎麼辦？'>
    這通常表示 UI 失去 WebSocket 連線。請檢查：

    1. Gateway 是否正在執行？`openclaw gateway status`
    2. Gateway 是否健康？`openclaw status`
    3. UI 是否有正確 token？`openclaw dashboard`
    4. 如果是遠端，通道/Tailscale 連結是否已啟用？

    接著追蹤日誌：

    ```bash
    openclaw logs --follow
    ```

    文件：[儀表板](/zh-TW/web/dashboard)、[遠端存取](/zh-TW/gateway/remote)、[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="Telegram setMyCommands 失敗。我該檢查什麼？">
    從日誌和頻道狀態開始：

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    然後對照錯誤：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 選單項目太多。OpenClaw 已經會裁切到 Telegram 限制並以較少指令重試，但仍需要移除部分選單項目。減少外掛/skill/自訂指令，或在不需要選單時停用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`，或類似網路錯誤：如果你在 VPS 上或位於 proxy 後方，請確認允許對外 HTTPS，且 `api.telegram.org` 的 DNS 可用。

    如果 Gateway 是遠端，請確定你正在查看 Gateway host 上的日誌。

    文件：[Telegram](/zh-TW/channels/telegram)、[頻道疑難排解](/zh-TW/channels/troubleshooting)。

  </Accordion>

  <Accordion title="終端介面沒有顯示輸出。我該檢查什麼？">
    先確認 Gateway 可以連線，且代理可以執行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在終端介面中，使用 `/status` 查看目前狀態。如果你預期在聊天
    頻道收到回覆，請確認已啟用傳遞（`/deliver on`）。

    文件：[終端介面](/zh-TW/web/tui)、[斜線指令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完整停止再啟動 Gateway？">
    如果你已安裝服務：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    這會停止/啟動**受監督的服務**（macOS 上的 launchd，Linux 上的 systemd）。
    當 Gateway 以守護程式在背景執行時使用這個方式。

    如果你是在前景執行，請用 Ctrl-C 停止，然後：

    ```bash
    openclaw gateway run
    ```

    文件：[Gateway 服務操作手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="ELI5：openclaw gateway restart 與 openclaw gateway">
    - `openclaw gateway restart`：重新啟動**背景服務**（launchd/systemd）。
    - `openclaw gateway`：針對目前終端機工作階段，在**前景**執行閘道。

    如果你已安裝服務，請使用閘道指令。當你想進行一次性的前景執行時，
    使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="發生失敗時，取得更多詳細資訊的最快方式">
    使用 `--verbose` 啟動 Gateway，以取得更多主控台詳細資訊。接著檢查日誌檔案中的頻道驗證、模型路由和 RPC 錯誤。
  </Accordion>
</AccordionGroup>

## 媒體和附件

<AccordionGroup>
  <Accordion title="我的 skill 產生了圖片/PDF，但沒有送出任何內容">
    代理的對外附件必須使用結構化媒體欄位，例如 `media`、`mediaUrl`、`path` 或 `filePath`。請參閱 [OpenClaw 助手設定](/zh-TW/start/openclaw)和[代理傳送](/zh-TW/tools/agent-send)。

    命令列介面傳送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    也請檢查：

    - 目標頻道支援對外媒體，且未被允許清單封鎖。
    - 檔案在 provider 的大小限制內（圖片會調整為最大 2048px）。
    - `tools.fs.workspaceOnly=true` 會將本機路徑傳送限制在工作區、temp/media-store，以及經 sandbox 驗證的檔案。
    - `tools.fs.workspaceOnly=false` 允許結構化本機媒體傳送使用代理已經可讀取的 host-local 檔案，但僅限媒體加上安全文件類型（圖片、音訊、影片、PDF、Office 文件，以及經驗證的文字文件，例如 Markdown/MD、TXT、JSON、YAML 和 YML）。這不是秘密掃描器：當 extension 和內容驗證相符時，代理可讀取的 `secret.txt` 或 `config.json` 可以被附加。請將敏感檔案放在代理可讀取路徑之外，或保留 `tools.fs.workspaceOnly=true` 以進行更嚴格的本機路徑傳送。

    請參閱[圖片](/zh-TW/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全性和存取控制

<AccordionGroup>
  <Accordion title="將 OpenClaw 暴露給傳入 DM 安全嗎？">
    將傳入 DM 視為不受信任的輸入。預設值設計用來降低風險：

    - 支援 DM 的頻道預設行為是**配對**：
      - 未知傳送者會收到配對碼；Bot 不會處理他們的訊息。
      - 使用以下指令核准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待處理請求限制為**每個頻道 3 個**；如果配對碼沒有送達，請檢查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公開開放 DM 需要明確選擇加入（`dmPolicy: "open"` 和允許清單 `"*"`）。

    執行 `openclaw doctor` 以顯示有風險的 DM 政策。

  </Accordion>

  <Accordion title="提示注入只對公開 Bot 是問題嗎？">
    不是。提示注入關乎**不受信任的內容**，不只是誰可以 DM Bot。
    如果你的助手讀取外部內容（網頁搜尋/擷取、瀏覽器頁面、電子郵件、
    文件、附件、貼上的日誌），該內容可能包含試圖
    劫持模型的指令。即使**你是唯一傳送者**，也可能發生這種情況。

    最大風險是在工具啟用時：模型可能被誘導
    外洩上下文，或代表你呼叫工具。透過以下方式降低影響範圍：

    - 使用唯讀或已停用工具的「reader」代理來摘要不受信任內容
    - 對已啟用工具的代理關閉 `web_search` / `web_fetch` / `browser`
    - 也將解碼後的檔案/文件文字視為不受信任：OpenResponses
      `input_file` 和媒體附件擷取都會將擷取文字包在
      明確的外部內容邊界標記中，而不是傳遞原始檔案文字
    - 使用 sandbox 和嚴格的工具允許清單

    詳細資訊：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw 因為使用 TypeScript/Node 而不是 Rust/WASM，是否比較不安全？">
    語言和執行階段很重要，但它們不是個人
    代理的主要風險。OpenClaw 的實際風險是閘道暴露、誰可以傳訊給
    Bot、提示注入、工具範圍、憑證處理、瀏覽器存取、exec
    存取，以及第三方 skill 或外掛信任。

    Rust 和 WASM 可以為某些類型的程式碼提供更強隔離，但
    它們無法解決提示注入、不良允許清單、公開閘道暴露、
    過寬工具，或已經登入敏感
    帳戶的瀏覽器設定檔。請將這些視為主要控制項：

    - 保持 Gateway 私有或已驗證
    - 對 DM 和群組使用配對和允許清單
    - 對不受信任輸入拒絕或 sandbox 高風險工具
    - 只安裝受信任的外掛和 skill
    - 設定變更後執行 `openclaw security audit --deep`

    詳細資訊：[安全性](/zh-TW/gateway/security)、[Sandboxing](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="我看到關於 OpenClaw 執行個體暴露的報告。我該檢查什麼？">
    先檢查你的實際部署：

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    較安全的基準如下：

    - Gateway 綁定到 `loopback`，或僅透過已驗證的私有
      存取暴露，例如 tailnet、SSH 通道、token/password auth，或正確
      設定的受信任 proxy
    - DM 使用 `pairing` 或 `allowlist` 模式
    - 群組已加入允許清單，且除非每位成員都受信任，否則需要 mention-gated
    - 高風險工具（`exec`、`browser`、`gateway`、`cron`）對讀取不受信任內容的代理
      被拒絕或嚴格限定範圍
    - 在工具執行需要較小影響範圍時啟用 sandboxing

    沒有驗證的公開綁定、開放 DM/群組並啟用工具，以及暴露的瀏覽器
    控制，是優先修正的發現。詳細資訊：
    [安全稽核檢查清單](/zh-TW/gateway/security#security-audit-checklist)。

  </Accordion>

  <Accordion title="ClawHub skills 和第三方外掛安裝起來安全嗎？">
    將第三方 skills 和外掛視為你選擇信任的程式碼。
    ClawHub skill 頁面會在安裝前顯示掃描狀態，但掃描並不是
    完整的安全邊界。OpenClaw 在外掛或 skill 安裝/更新流程中，不會執行內建本機
    危險程式碼封鎖；請使用
    operator-owned `security.installPolicy` 進行本機允許/封鎖決策。

    較安全的模式：

    - 優先選擇受信任作者和 pinned 版本
    - 啟用前先閱讀 skill 或外掛
    - 保持外掛和 skill 允許清單狹窄
    - 在具備最少工具的 sandbox 中執行不受信任輸入工作流程
    - 避免授予第三方程式碼廣泛的檔案系統、exec、瀏覽器或秘密存取權

    詳細資訊：[Skills](/zh-TW/tools/skills)、[外掛](/zh-TW/tools/plugin)、
    [安全性](/zh-TW/gateway/security).

  </Accordion>

  <Accordion title="我的機器人應該有自己的電子郵件、GitHub 帳戶或電話號碼嗎？">
    對大多數設定來說，是的。用獨立帳戶和電話號碼隔離機器人，
    可以在出問題時降低影響範圍。這也讓你更容易輪替
    憑證或撤銷存取權，而不影響你的個人帳戶。

    從小處開始。只授予你實際需要的工具和帳戶存取權，之後若有需要再擴充。

    文件：[安全性](/zh-TW/gateway/security)、[配對](/zh-TW/channels/pairing)。

  </Accordion>

  <Accordion title="我可以讓它自主處理我的簡訊嗎？這樣安全嗎？">
    我們**不**建議讓它完全自主處理你的個人訊息。最安全的模式是：

    - 將私訊保留在**配對模式**或嚴格的允許清單中。
    - 如果你想讓它代表你發送訊息，請使用**獨立號碼或帳戶**。
    - 讓它先起草，然後在**傳送前核准**。

    如果你想實驗，請在專用帳戶上進行並保持隔離。請參閱
    [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我可以用較便宜的模型來處理個人助理任務嗎？">
    可以，**前提是**代理只用於聊天且輸入是可信的。較小的層級
    更容易受到指令劫持，因此請避免將它們用於啟用工具的代理，
    或用於讀取不受信任的內容。如果你必須使用較小的模型，請鎖定
    工具並在沙箱中執行。請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 執行了 /start，但沒有收到配對碼">
    配對碼**只有**在未知寄件者傳訊給機器人且
    `dmPolicy: "pairing"` 已啟用時才會送出。`/start` 本身不會產生代碼。

    檢查待處理請求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即取得存取權，請將你的寄件者 id 加入允許清單，或為該帳戶設定 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它會傳訊息給我的聯絡人嗎？配對如何運作？">
    不會。預設的 WhatsApp 私訊政策是**配對**。未知寄件者只會收到配對碼，且其訊息**不會被處理**。OpenClaw 只會回覆它收到的聊天，或你明確觸發的傳送。

    使用以下指令核准配對：

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    列出待處理請求：

    ```bash
    openclaw pairing list whatsapp
    ```

    精靈電話號碼提示：它用於設定你的**允許清單/擁有者**，讓你自己的私訊被允許。它不會用於自動傳送。如果你在個人 WhatsApp 號碼上執行，請使用該號碼並啟用 `channels.whatsapp.selfChatMode`。

  </Accordion>
</AccordionGroup>

## 聊天命令、中止任務，以及「它不會停止」

<AccordionGroup>
  <Accordion title="如何阻止內部系統訊息顯示在聊天中？">
    大多數內部或工具訊息只會在該工作階段啟用**詳細**、**追蹤**或**推理**時出現。

    在你看到它的聊天中修正：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，請在控制介面中檢查工作階段設定，並將詳細設定為
    **繼承**。也請確認你沒有使用在設定中將 `verboseDefault` 設為
    `on` 的機器人設定檔。

    文件：[思考與詳細輸出](/zh-TW/tools/thinking)、[安全性](/zh-TW/gateway/security/index#reasoning-and-verbose-output-in-groups)。

  </Accordion>

  <Accordion title="如何停止/取消正在執行的任務？">
    將下列任一內容**作為獨立訊息**傳送（不要加斜線）：

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

    這些是中止觸發詞（不是斜線命令）。

    對於背景程序（來自 exec 工具），你可以要求代理執行：

    ```
    process action:kill sessionId:XXX
    ```

    斜線命令概覽：請參閱[斜線命令](/zh-TW/tools/slash-commands)。

    大多數命令必須作為以 `/` 開頭的**獨立**訊息傳送，但少數捷徑（例如 `/status`）也可供允許清單中的寄件者在行內使用。

  </Accordion>

  <Accordion title='如何從 Telegram 傳送 Discord 訊息？（「跨情境訊息遭拒」）'>
    OpenClaw 預設會阻擋**跨提供者**訊息。如果工具呼叫綁定到
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

    編輯設定後重新啟動閘道。

  </Accordion>

  <Accordion title='為什麼感覺機器人會「忽略」快速連續的訊息？'>
    預設情況下，執行中的提示會被導向目前的執行。使用 `/queue` 選擇目前執行的行為：

    - `steer` - 在下一個模型邊界引導目前執行
    - `followup` - 將訊息排入佇列，並在目前執行結束後逐一執行
    - `collect` - 將相容訊息排入佇列，並在目前執行結束後一次回覆
    - `interrupt` - 中止目前執行並重新開始

    預設模式是 `steer`。你可以為佇列模式加入像 `debounce:0.5s cap:25 drop:summarize` 這樣的選項。請參閱[命令佇列](/zh-TW/concepts/queue)和[引導佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='使用 API 金鑰時，Anthropic 的預設模型是什麼？'>
    在 OpenClaw 中，憑證和模型選擇是分開的。設定 `ANTHROPIC_API_KEY`（或在驗證設定檔中儲存 Anthropic API 金鑰）會啟用驗證，但實際的預設模型是你在 `agents.defaults.model.primary` 中設定的內容（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，表示閘道無法在正在執行的代理預期的 `auth-profiles.json` 中找到 Anthropic 憑證。
  </Accordion>
</AccordionGroup>

---

仍然卡住嗎？請到 [Discord](https://discord.com/invite/clawd) 詢問，或開啟 [GitHub 討論](https://github.com/openclaw/openclaw/discussions)。

## 相關

- [首次執行常見問題](/zh-TW/help/faq-first-run) — 安裝、onboard、驗證、訂閱、早期失敗
- [模型常見問題](/zh-TW/help/faq-models) — 模型選擇、故障轉移、驗證設定檔
- [疑難排解](/zh-TW/help/troubleshooting) — 以症狀優先的分診
