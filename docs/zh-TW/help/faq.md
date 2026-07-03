---
read_when:
    - 回答常見的設定、安裝、入門導引或執行階段支援問題
    - 在深入偵錯前分流使用者回報的問題
summary: 關於 OpenClaw 設定、組態與使用方式的常見問題
title: 常見問題
x-i18n:
    generated_at: "2026-07-03T13:16:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d55385d187c20dfce05022b76fcaa054c19fc22e46da66d4a24e2538dd95708
    source_path: help/faq.md
    workflow: 16
---

提供快速解答，以及針對真實環境設定（本機開發、VPS、多代理、OAuth/API 金鑰、模型容錯移轉）的深入疑難排解。執行階段診斷請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。完整設定參考請參閱[設定](/zh-TW/gateway/configuration)。

## 發生故障時的前 60 秒

1. **快速狀態（第一項檢查）**

   ```bash
   openclaw status
   ```

   快速本機摘要：作業系統 + 更新、閘道/服務可達性、代理/工作階段、供應商設定 + 執行階段問題（當閘道可達時）。

2. **可貼上的報告（可安全分享）**

   ```bash
   openclaw status --all
   ```

   唯讀診斷，包含日誌尾端（權杖已遮蔽）。

3. **精靈 + 連接埠狀態**

   ```bash
   openclaw gateway status
   ```

   顯示監督器執行階段與 RPC 可達性、探測目標 URL，以及服務可能使用的設定。

4. **深入探測**

   ```bash
   openclaw status --deep
   ```

   執行即時閘道健康狀態探測，支援時也包含通道探測
   （需要可連線的閘道）。請參閱[健康狀態](/zh-TW/gateway/health)。

5. **追蹤最新日誌**

   ```bash
   openclaw logs --follow
   ```

   如果 RPC 已中斷，請改用：

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   檔案日誌與服務日誌是分開的；請參閱[記錄](/zh-TW/logging)和[疑難排解](/zh-TW/gateway/troubleshooting)。

6. **執行 doctor（修復）**

   ```bash
   openclaw doctor
   ```

   修復/遷移設定/狀態 + 執行健康檢查。請參閱[Doctor](/zh-TW/gateway/doctor)。

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
    OpenClaw 是在你自己的裝置上執行的個人 AI 助理。它會在你已經使用的訊息介面上回覆（WhatsApp、Telegram、Slack、Mattermost、Discord、Google Chat、Signal、iMessage、WebChat，以及 QQ Bot 等內建通道外掛），並且也能在支援的平台上提供語音 + 即時畫布。**閘道**是常駐控制平面；助理才是產品本身。
  </Accordion>

  <Accordion title="價值主張">
    OpenClaw 不是「只是 Claude 包裝器」。它是一個**本機優先控制平面**，讓你在**自己的硬體**上執行
    能力完整的助理，可從你已經使用的聊天應用程式觸及，並具備
    有狀態工作階段、記憶與工具 - 不需要把工作流程控制權交給託管式
    SaaS。

    重點：

    - **你的裝置，你的資料：**在任何你想要的地方執行閘道（Mac、Linux、VPS），並將
      工作區 + 工作階段歷史保留在本機。
    - **真實通道，不是網頁沙盒：**WhatsApp/Telegram/Slack/Discord/Signal/iMessage/等，
      加上支援平台上的行動語音與畫布。
    - **模型無關：**使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，並支援依代理路由
      與容錯移轉。
    - **僅限本機選項：**執行本機模型，因此如果你願意，**所有資料都能留在你的裝置上**。
    - **多代理路由：**依通道、帳號或任務分離代理，每個代理都有自己的
      工作區與預設值。
    - **開放原始碼且可改造：**可檢視、擴充、自行託管，不受供應商鎖定。

    文件：[閘道](/zh-TW/gateway)、[通道](/zh-TW/channels)、[多代理](/zh-TW/concepts/multi-agent)、
    [記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我剛完成設定 - 首先應該做什麼？">
    適合開始的專案：

    - 建立網站（WordPress、Shopify，或簡單的靜態網站）。
    - 建立行動應用程式原型（大綱、畫面、API 計畫）。
    - 整理檔案與資料夾（清理、命名、標記）。
    - 連接 Gmail 並自動化摘要或後續追蹤。

    它可以處理大型任務，但當你將任務拆成階段並
    使用子代理進行平行工作時，效果最好。

  </Accordion>

  <Accordion title="OpenClaw 最常見的五個日常使用案例是什麼？">
    日常收穫通常像是：

    - **個人簡報：**你關心的收件匣、行事曆和新聞摘要。
    - **研究與草擬：**快速研究、摘要，以及電子郵件或文件的初稿。
    - **提醒與後續追蹤：**由排程或心跳偵測驅動的提醒與檢查清單。
    - **瀏覽器自動化：**填寫表單、收集資料，以及重複執行網頁任務。
    - **跨裝置協調：**從手機送出任務，讓閘道在伺服器上執行，並在聊天中取回結果。

  </Accordion>

  <Accordion title="OpenClaw 能協助 SaaS 的潛在客戶開發、外展、廣告和部落格嗎？">
    對於**研究、資格篩選與草擬**可以。它可以掃描網站、建立候選清單、
    摘要潛在客戶，並撰寫外展或廣告文案草稿。

    對於**外展或廣告投放**，請保留人工審核。避免垃圾訊息，遵守當地法律與
    平台政策，並在送出任何內容前先審閱。最安全的模式是讓
    OpenClaw 草擬，再由你核准。

    文件：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="相較於 Claude Code，OpenClaw 在網頁開發上的優勢是什麼？">
    OpenClaw 是**個人助理**與協調層，不是 IDE 的替代品。若要在儲存庫內取得最快的直接編碼迴圈，請使用
    Claude Code 或 Codex。當你需要
    持久記憶、跨裝置存取與工具編排時，使用 OpenClaw。

    優勢：

    - 跨工作階段的**持久記憶 + 工作區**
    - **多平台存取**（WhatsApp、Telegram、終端介面、WebChat）
    - **工具編排**（瀏覽器、檔案、排程、鉤子）
    - **常駐閘道**（在 VPS 上執行，從任何地方互動）
    - 用於本機瀏覽器/螢幕/相機/執行的**節點**

    展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 與自動化

<AccordionGroup>
  <Accordion title="如何在不讓儲存庫保持髒狀態的情況下自訂 skills？">
    使用受管理的覆寫，而不是編輯儲存庫副本。將你的變更放在 `~/.openclaw/skills/<name>/SKILL.md`（或透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增資料夾）。優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 內建 → `skills.load.extraDirs`，因此受管理的覆寫仍會優先於內建 skills，而不需要碰 git。如果你需要全域安裝該 skill，但只讓部分代理看見，請將共享副本保留在 `~/.openclaw/skills`，並使用 `agents.defaults.skills` 和 `agents.list[].skills` 控制可見性。只有值得上游採納的編輯才應放在儲存庫中並以 PR 送出。
  </Accordion>

  <Accordion title="我可以從自訂資料夾載入 skills 嗎？">
    可以。透過 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 新增額外目錄（最低優先順序）。預設優先順序是 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 內建 → `skills.load.extraDirs`。`clawhub` 預設安裝到 `./skills`，OpenClaw 會在下一個工作階段將它視為 `<workspace>/skills`。如果該 skill 只應對特定代理可見，請搭配 `agents.defaults.skills` 或 `agents.list[].skills`。
  </Accordion>

  <Accordion title="如何針對不同任務使用不同模型或設定？">
    目前支援的模式是：

    - **排程工作**：隔離的工作可以為每個工作設定 `model` 覆寫。
    - **代理**：將任務路由到不同代理，並使用不同的預設模型、思考層級與串流參數。
    - **隨選切換**：隨時使用 `/model` 切換目前工作階段模型。

    例如，使用相同模型但搭配不同的個別代理設定：

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

    將共享的個別模型預設值放在 `agents.defaults.models["provider/model"].params`，再將代理專屬覆寫放在平面 `agents.list[].params`。不要為同一模型定義個別的巢狀 `agents.list[].models["provider/model"].params` 項目；`agents.list[].models` 是用於個別代理模型目錄與執行階段覆寫。

    請參閱[排程工作](/zh-TW/automation/cron-jobs)、[多代理路由](/zh-TW/concepts/multi-agent)、[設定](/zh-TW/gateway/config-agents)和[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="Bot 在執行繁重工作時凍結。我要如何卸載那些工作？">
    使用**子代理**處理長時間或平行任務。子代理會在自己的工作階段中執行、
    回傳摘要，並讓你的主要聊天保持可回應。

    要求你的 bot「為此任務產生一個子代理」，或使用 `/subagents`。
    在聊天中使用 `/status` 查看閘道目前正在做什麼（以及是否忙碌）。

    權杖提示：長時間任務與子代理都會消耗權杖。如果擔心成本，請透過 `agents.defaults.subagents.model` 為子代理設定
    較便宜的模型。

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="Discord 上綁定討論串的子代理工作階段如何運作？">
    使用討論串綁定。你可以將 Discord 討論串綁定到子代理或工作階段目標，讓該討論串中的後續訊息保留在該綁定工作階段上。

    基本流程：

    - 使用 `sessions_spawn` 搭配 `thread: true` 產生（並可選擇使用 `mode: "session"` 進行持久後續追蹤）。
    - 或使用 `/focus <target>` 手動綁定。
    - 使用 `/agents` 檢查綁定狀態。
    - 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自動取消聚焦。
    - 使用 `/unfocus` 解除討論串連結。

    必要設定：

    - 全域預設值：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
    - Discord 覆寫：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。
    - 產生時自動綁定：`channels.discord.threadBindings.spawnSessions` 預設為 `true`；將它設為 `false` 可停用綁定討論串的工作階段產生。

    文件：[子代理](/zh-TW/tools/subagents)、[Discord](/zh-TW/channels/discord)、[設定參考](/zh-TW/gateway/configuration-reference)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="子代理已完成，但完成更新傳到錯誤的位置或從未發布。我應該檢查什麼？">
    先檢查已解析的請求者路由：

    - 完成模式子代理傳遞會優先使用任何現有的綁定討論串或對話路由。
    - 如果完成來源只帶有通道，OpenClaw 會退回到請求者工作階段的已儲存路由（`lastChannel` / `lastTo` / `lastAccountId`），因此直接傳遞仍可成功。
    - 如果既沒有綁定路由，也沒有可用的已儲存路由，直接傳遞可能失敗，結果會改為退回到佇列工作階段傳遞，而不是立即發布到聊天。
    - 無效或過時的目標仍可能強制佇列退回或最終傳遞失敗。
    - 如果子工作階段最後一則可見助理回覆是完全相同的靜默權杖 `NO_REPLY` / `no_reply`，或完全等於 `ANNOUNCE_SKIP`，OpenClaw 會刻意抑制公告，而不是發布較早的過時進度。
    - Tool/toolResult 輸出不會提升為子工作階段結果文字；結果是子工作階段最新的可見助理回覆。

    Debug：

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[子代理](/zh-TW/tools/subagents)、[背景任務](/zh-TW/automation/tasks)、[工作階段工具](/zh-TW/concepts/session-tool)。

  </Accordion>

  <Accordion title="排程或提醒沒有觸發。我該檢查什麼？">
    排程在閘道程序內執行。如果閘道沒有持續執行，
    排程工作就不會執行。

    檢查清單：

    - 確認排程已啟用（`cron.enabled`），且未設定 `OPENCLAW_SKIP_CRON`。
    - 檢查閘道是否全天候執行（沒有睡眠/重新啟動）。
    - 驗證工作的時區設定（`--tz` 與主機時區）。

    Debug：

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="排程已觸發，但沒有任何內容送到頻道。為什麼？">
    請先檢查傳遞模式：

    - `--no-deliver` / `delivery.mode: "none"` 表示預期不會有執行器後援傳送。
    - 缺少或無效的公告目標（`channel` / `to`）表示執行器已略過對外傳遞。
    - 頻道驗證失敗（`unauthorized`、`Forbidden`）表示執行器嘗試傳遞，但認證資料阻擋了它。
    - 靜默的隔離結果（僅 `NO_REPLY` / `no_reply`）會被視為刻意不可傳遞，因此執行器也會抑制佇列中的後援傳遞。

    對於隔離的排程工作，只要有可用的聊天路由，代理仍可直接使用 `message`
    工具傳送。`--announce` 只控制代理尚未自行傳送的最終文字所走的執行器
    後援路徑。

    Debug：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[背景任務](/zh-TW/automation/tasks)。

  </Accordion>

  <Accordion title="為什麼隔離的排程執行會切換模型或重試一次？">
    這通常是即時模型切換路徑，而不是重複排程。

    隔離排程可以持久保存執行階段模型交接，並在作用中的
    執行拋出 `LiveSessionModelSwitchError` 時重試。重試會保留已切換的
    提供者/模型；如果切換帶有新的驗證設定檔覆寫，排程也會在重試前將其
    持久保存。

    相關選擇規則：

    - 適用時，Gmail 鉤子模型覆寫優先。
    - 接著是每個工作的 `model`。
    - 接著是任何已儲存的排程工作階段模型覆寫。
    - 接著是一般代理/預設模型選擇。

    重試迴圈有界限。初始嘗試加上 2 次切換重試後，
    排程會中止，而不是永遠迴圈。

    Debug：

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[排程命令列介面](/zh-TW/cli/cron)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 Skills？">
    使用原生 `openclaw skills` 命令，或將 Skills 放入你的工作區。macOS Skills UI 在 Linux 上不可用。
    請在 [https://clawhub.ai](https://clawhub.ai) 瀏覽 Skills。

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
    目錄。加入 `--global` 可安裝到所有本機代理共用的受管理
    Skills 目錄。只有當你想發布或同步自己的 Skills 時，才需要安裝獨立的 `clawhub` 命令列介面。
    如果想縮小哪些代理可以看見共用 Skills，請使用
    `agents.defaults.skills` 或 `agents.list[].skills`。

  </Accordion>

  <Accordion title="OpenClaw 可以依排程或在背景持續執行任務嗎？">
    可以。使用閘道排程器：

    - **排程工作**用於排定或週期性任務（重新啟動後仍會保留）。
    - **心跳偵測**用於「主要工作階段」的定期檢查。
    - **隔離工作**用於會張貼摘要或傳遞到聊天的自主代理。

    文件：[排程工作](/zh-TW/automation/cron-jobs)、[自動化](/zh-TW/automation)、
    [心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title="我可以從 Linux 執行 Apple macOS 專用 Skills 嗎？">
    不能直接執行。macOS Skills 會受 `metadata.openclaw.os` 加上必要二進位檔限制，而且 Skills 只有在 **閘道主機** 上符合資格時，才會出現在系統提示中。在 Linux 上，僅限 `darwin` 的 Skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不會載入，除非你覆寫該限制。

    你有三種受支援的模式：

    **選項 A - 在 Mac 上執行閘道（最簡單）。**
    在 macOS 二進位檔存在的位置執行閘道，然後從 Linux 以[遠端模式](#gateway-ports-already-running-and-remote-mode)或透過 Tailscale 連線。因為閘道主機是 macOS，Skills 會正常載入。

    **選項 B - 使用 macOS 節點（不使用 SSH）。**
    在 Linux 上執行閘道，配對 macOS 節點（選單列應用程式），並在 Mac 上將 **節點執行命令** 設為「一律詢問」或「一律允許」。當節點上存在必要二進位檔時，OpenClaw 可以將 macOS 專用 Skills 視為符合資格。代理會透過 `nodes` 工具執行那些 Skills。如果你選擇「一律詢問」，在提示中核准「一律允許」會將該命令加入允許清單。

    **選項 C - 透過 SSH 代理 macOS 二進位檔（進階）。**
    將閘道保留在 Linux 上，但讓必要的命令列介面二進位檔解析到會在 Mac 上執行的 SSH 包裝器。接著覆寫 Skill 以允許 Linux，使其保持符合資格。

    1. 為二進位檔建立 SSH 包裝器（範例：Apple Notes 的 `memo`）：

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. 將包裝程式放到 Linux 主機的 `PATH` 上（例如 `~/bin/memo`）。
    3. 覆寫技能中繼資料（工作區或 `~/.openclaw/skills`）以允許 Linux：

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. 啟動新的工作階段，讓技能快照重新整理。

  </Accordion>

  <Accordion title="你們有 Notion 或 HeyGen 整合嗎？">
    目前沒有內建。

    選項：

    - **自訂技能 / 外掛：**最適合可靠的 API 存取（Notion/HeyGen 兩者都有 API）。
    - **瀏覽器自動化：**無需程式碼即可運作，但較慢且較脆弱。

    如果你想依客戶保留脈絡（代理商工作流程），一個簡單模式是：

    - 每個客戶一個 Notion 頁面（脈絡 + 偏好設定 + 進行中的工作）。
    - 要求代理程式在工作階段開始時擷取該頁面。

    如果你想要原生整合，請提出功能請求，或建置一個
    以那些 API 為目標的技能。

    安裝技能：

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    原生安裝會放在作用中工作區的 `skills/` 目錄。若要讓所有本機代理程式共用 Skills，請使用 `openclaw skills install @owner/<skill-slug> --global`（或手動放入 `~/.openclaw/skills/<name>/SKILL.md`）。如果只有部分代理程式應該看到共用安裝，請設定 `agents.defaults.skills` 或 `agents.list[].skills`。有些技能預期透過 Homebrew 安裝二進位檔；在 Linux 上這表示 Linuxbrew（請參閱上方的 Homebrew Linux 常見問題項目）。請參閱 [Skills](/zh-TW/tools/skills)、[Skills 設定](/zh-TW/tools/skills-config) 和 [ClawHub](/tools/clawhub)。

  </Accordion>

  <Accordion title="我要如何搭配 OpenClaw 使用現有已登入的 Chrome？">
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

    此路徑可以使用本機主機瀏覽器或已連線的瀏覽器節點。如果閘道在其他地方執行，請在瀏覽器所在機器上執行節點主機，或改用遠端 CDP。

    `existing-session` / `user` 的目前限制：

    - 動作由 ref 驅動，而不是由 CSS 選擇器驅動
    - 上傳需要 `ref` / `inputRef`，且目前一次支援一個檔案
    - `responsebody`、PDF 匯出、下載攔截和批次動作仍需要受管理的瀏覽器或原始 CDP 設定檔

  </Accordion>
</AccordionGroup>

## 沙箱與記憶體

<AccordionGroup>
  <Accordion title="有專門的沙箱文件嗎？">
    有。請參閱 [沙箱](/zh-TW/gateway/sandboxing)。若需 Docker 專屬設定（Docker 中的完整閘道或沙箱映像檔），請參閱 [Docker](/zh-TW/install/docker)。
  </Accordion>

  <Accordion title="Docker 感覺受限 - 我要如何啟用完整功能？">
    預設映像檔以安全性為優先，並以 `node` 使用者執行，因此不
    包含系統套件、Homebrew 或隨附的瀏覽器。若要更完整的設定：

    - 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，讓快取保留下來。
    - 使用 `OPENCLAW_IMAGE_APT_PACKAGES` 將系統相依項目烘焙進映像檔。
    - 透過隨附的命令列介面安裝 Playwright 瀏覽器：
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - 設定 `PLAYWRIGHT_BROWSERS_PATH`，並確保該路徑會被持久化。

    文件：[Docker](/zh-TW/install/docker)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="我可以用同一個代理程式讓私訊保持個人化，但讓群組公開/沙箱化嗎？">
    可以 - 如果你的私有流量是**私訊**，而公開流量是**群組**。

    使用 `agents.defaults.sandbox.mode: "non-main"`，讓群組/頻道工作階段（非主要鍵）在已設定的沙箱後端中執行，而主要私訊工作階段保留在主機上。如果你沒有選擇後端，Docker 是預設後端。接著透過 `tools.sandbox.tools` 限制沙箱化工作階段中可用的工具。

    設定逐步說明 + 範例設定：[群組：個人私訊 + 公開群組](/zh-TW/channels/groups#pattern-personal-dms-public-groups-single-agent)

    主要設定參考：[閘道設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="我要如何將主機資料夾繫結到沙箱中？">
    將 `agents.defaults.sandbox.docker.binds` 設為 `["host:path:mode"]`（例如 `"/home/user/src:/src:ro"`）。全域與個別代理程式的繫結會合併；當 `scope: "shared"` 時，個別代理程式的繫結會被忽略。對任何敏感內容使用 `:ro`，並記住繫結會繞過沙箱檔案系統牆。

    OpenClaw 會同時根據正規化路徑，以及透過最深層既有祖先解析出的標準路徑，來驗證繫結來源。這表示即使最後一個路徑區段尚不存在，符號連結父層逃逸仍會以失敗關閉處理，而允許根目錄檢查在符號連結解析後仍然適用。

    請參閱 [沙箱](/zh-TW/gateway/sandboxing#custom-bind-mounts) 和 [沙箱 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)，了解範例與安全注意事項。

  </Accordion>

  <Accordion title="記憶體如何運作？">
    OpenClaw 記憶體只是代理程式工作區中的 Markdown 檔案：

    - `memory/YYYY-MM-DD.md` 中的每日筆記
    - `MEMORY.md` 中精選的長期筆記（僅限主要/私人工作階段）

    OpenClaw 也會執行**靜默的壓縮前記憶體清空**，提醒模型
    在自動壓縮前寫入持久筆記。這只會在工作區
    可寫入時執行（唯讀沙箱會略過）。請參閱 [記憶體](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="記憶一直忘記事情。我要怎麼讓它記住？">
    請機器人**將事實寫入記憶**。長期筆記屬於 `MEMORY.md`，
    短期脈絡則放在 `memory/YYYY-MM-DD.md`。

    這仍是我們正在改進的領域。提醒模型儲存記憶會有幫助；
    它會知道該怎麼做。如果它仍一直忘記，請確認閘道在每次執行時都使用相同的
    工作區。

    文件：[記憶](/zh-TW/concepts/memory)、[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="記憶會永遠保留嗎？有哪些限制？">
    記憶檔案存在磁碟上，會一直保留直到你刪除它們。限制來自你的
    儲存空間，而不是模型。**工作階段脈絡**仍受模型脈絡視窗限制，
    因此長對話可能會壓縮或截斷。這就是記憶搜尋存在的原因 - 它只會把相關部分拉回脈絡中。

    文件：[記憶](/zh-TW/concepts/memory)、[脈絡](/zh-TW/concepts/context)。

  </Accordion>

  <Accordion title="語意記憶搜尋需要 OpenAI API 金鑰嗎？">
    只有在你使用 **OpenAI embeddings** 時才需要。Codex OAuth 涵蓋聊天/補全，
    並**不會**授予 embeddings 存取權，因此**使用 Codex 登入（OAuth 或
    Codex CLI 登入）**對語意記憶搜尋沒有幫助。OpenAI embeddings
    仍需要真正的 API 金鑰（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

    如果你沒有明確設定提供者，OpenClaw 會使用 OpenAI embeddings。仍寫著
    `memorySearch.provider = "auto"` 的舊版設定也會解析為 OpenAI。
    如果沒有可用的 OpenAI API 金鑰，語意記憶搜尋會保持不可用，
    直到你設定金鑰或明確選擇其他提供者。

    如果你偏好留在本機，請設定 `memorySearch.provider = "local"`（並可選擇性設定
    `memorySearch.fallback = "none"`）。如果你想使用 Gemini embeddings，請設定
    `memorySearch.provider = "gemini"` 並提供 `GEMINI_API_KEY`（或
    `memorySearch.remote.apiKey`）。我們支援 **OpenAI、OpenAI 相容、Gemini、
    Voyage、Mistral、Bedrock、Ollama、LM Studio、GitHub Copilot、DeepInfra，或本機**
    embedding 模型 - 設定細節請參閱[記憶](/zh-TW/concepts/memory)。

  </Accordion>
</AccordionGroup>

## 內容在磁碟上的位置

<AccordionGroup>
  <Accordion title="與 OpenClaw 搭配使用的所有資料都會儲存在本機嗎？">
    不會 - **OpenClaw 的狀態是本機的**，但**外部服務仍會看到你傳送給它們的內容**。

    - **預設為本機：** 工作階段、記憶檔案、設定和工作區都位於閘道主機上
      （`~/.openclaw` + 你的工作區目錄）。
    - **必要時為遠端：** 你傳送給模型提供者（Anthropic/OpenAI/等）的訊息會送到
      它們的 API，而聊天平台（WhatsApp/Telegram/Slack/等）會在其
      伺服器上儲存訊息資料。
    - **你控制足跡：** 使用本機模型會讓提示保留在你的機器上，但頻道
      流量仍會通過該頻道的伺服器。

    相關：[代理工作區](/zh-TW/concepts/agent-workspace)、[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="OpenClaw 會把資料存在哪裡？">
    所有內容都位於 `$OPENCLAW_STATE_DIR` 底下（預設：`~/.openclaw`）：

    | 路徑                                                            | 用途                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 主要設定 (JSON5)                                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 舊版 OAuth 匯入（首次使用時複製到驗證設定檔）                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 驗證設定檔（OAuth、API 金鑰，以及選用的 `keyRef`/`tokenRef`）      |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 提供者的選用檔案支援祕密酬載                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 舊版相容檔案（靜態 `api_key` 項目已清除）                         |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 提供者狀態（例如 `whatsapp/<accountId>/creds.json`）               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 每個代理的狀態（agentDir + 工作階段）                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 對話歷史與狀態（每個代理）                                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 工作階段中繼資料（每個代理）                                       |

    舊版單代理路徑：`~/.openclaw/agent/*`（由 `openclaw doctor` 遷移）。

    你的**工作區**（AGENTS.md、記憶檔案、skills 等）是獨立的，並透過 `agents.defaults.workspace` 設定（預設：`~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md 應該放在哪裡？">
    這些檔案位於**代理工作區**，而不是 `~/.openclaw`。

    - **工作區（每個代理）**：`AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
      `MEMORY.md`、`memory/YYYY-MM-DD.md`、選用的 `HEARTBEAT.md`。
      小寫根層級 `memory.md` 只作為舊版修復輸入；當兩個檔案都存在時，`openclaw doctor --fix`
      可以將它合併到 `MEMORY.md`。
    - **狀態目錄（`~/.openclaw`）**：設定、頻道/提供者狀態、驗證設定檔、工作階段、記錄，
      以及共用 skills（`~/.openclaw/skills`）。

    預設工作區是 `~/.openclaw/workspace`，可透過以下方式設定：

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    如果機器人在重新啟動後「忘記」了，請確認閘道在每次啟動時都使用相同的
    工作區（並記得：遠端模式使用的是**閘道主機的**
    工作區，而不是你本機筆電的工作區）。

    提示：如果你想要持久的行為或偏好，請要求機器人**將它寫入
    AGENTS.md 或 MEMORY.md**，而不是依賴聊天歷史。

    請參閱[代理工作區](/zh-TW/concepts/agent-workspace)和[記憶](/zh-TW/concepts/memory)。

  </Accordion>

  <Accordion title="我可以讓 SOUL.md 更大嗎？">
    可以。`SOUL.md` 是注入代理脈絡的工作區啟動檔案之一。
    預設的每檔案注入限制是 `20000` 個字元，
    而所有檔案合計的總啟動預算是 `60000` 個字元。

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

    或覆寫單一代理：

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
    請讓 `SOUL.md` 專注於語氣、立場和人格；將操作規則
    放在 `AGENTS.md`，並將持久事實放在記憶中。

    請參閱[脈絡](/zh-TW/concepts/context)和[代理設定](/zh-TW/gateway/config-agents)。

  </Accordion>

  <Accordion title="建議的備份策略">
    將你的**代理工作區**放在**私人** git 儲存庫中，並備份到某個
    私人位置（例如 GitHub 私人儲存庫）。這會保存記憶 + AGENTS/SOUL/USER
    檔案，並讓你之後能還原助理的「心智」。

    **不要**提交 `~/.openclaw` 底下的任何內容（認證、工作階段、權杖或加密祕密酬載）。
    如果你需要完整還原，請分別備份工作區和狀態目錄
    （請參閱上方的遷移問題）。

    文件：[代理工作區](/zh-TW/concepts/agent-workspace)。

  </Accordion>

  <Accordion title="我要如何完全解除安裝 OpenClaw？">
    請參閱專門指南：[解除安裝](/zh-TW/install/uninstall)。
  </Accordion>

  <Accordion title="代理可以在工作區之外工作嗎？">
    可以。工作區是**預設 cwd** 和記憶錨點，不是硬性沙盒。
    相對路徑會在工作區內解析，但除非啟用沙盒，絕對路徑可以存取其他
    主機位置。如果你需要隔離，請使用
    [`agents.defaults.sandbox`](/zh-TW/gateway/sandboxing) 或每代理沙盒設定。如果你
    希望某個儲存庫成為預設工作目錄，請將該代理的
    `workspace` 指向儲存庫根目錄。OpenClaw 儲存庫只是原始碼；除非你有意讓代理在其中工作，
    否則請將工作區分開。

    範例（儲存庫作為預設 cwd）：

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
    工作階段狀態由**閘道主機**擁有。如果你處於遠端模式，你關心的工作階段存放區位於遠端機器上，而不是你的本機筆電。請參閱[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>
</AccordionGroup>

## 設定基礎

<AccordionGroup>
  <Accordion title="設定是什麼格式？在哪裡？">
    OpenClaw 會從 `$OPENCLAW_CONFIG_PATH` 讀取選用的 **JSON5** 設定（預設：`~/.openclaw/openclaw.json`）：

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    如果檔案不存在，它會使用偏安全的預設值（包括預設工作區 `~/.openclaw/workspace`）。

  </Accordion>

  <Accordion title='我設定了 gateway.bind: "lan"（或 "tailnet"），現在沒有任何東西在監聽 / UI 顯示未授權'>
    非 loopback 綁定**需要有效的閘道驗證路徑**。實務上這表示：

    - shared-secret 驗證：權杖或密碼
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

    備註：

    - `gateway.remote.token` / `.password` 本身**不會**啟用本機閘道驗證。
    - 只有在未設定 `gateway.auth.*` 時，本機呼叫路徑才可以使用 `gateway.remote.*` 作為後援。
    - 對於密碼驗證，請改為設定 `gateway.auth.mode: "password"` 加上 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果 `gateway.auth.token` / `gateway.auth.password` 透過 SecretRef 明確設定但無法解析，解析會關閉失敗（沒有遠端後援遮蔽）。
    - Shared-secret Control UI 設定會透過 `connect.params.auth.token` 或 `connect.params.auth.password`（儲存在應用程式/UI 設定中）驗證。Tailscale Serve 或 `trusted-proxy` 等帶有身分的模式則使用請求標頭。避免將 shared secrets 放在 URL 中。
    - 使用 `gateway.auth.mode: "trusted-proxy"` 時，同主機 loopback 反向代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並在 `gateway.trustedProxies` 中加入 loopback 項目。

  </Accordion>

  <Accordion title="為什麼我現在在 localhost 上也需要權杖？">
    OpenClaw 預設會強制執行閘道驗證，包括 loopback。在一般預設路徑中，這表示權杖驗證：如果未設定明確的驗證路徑，閘道啟動會解析為權杖模式，並為該次啟動產生僅限執行期間使用的權杖，因此**本機 WS 用戶端必須驗證**。當用戶端需要跨重新啟動保持穩定的祕密時，請明確設定 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。這會阻止其他本機程序呼叫閘道。

    如果你偏好不同的驗證路徑，可以明確選擇密碼模式（或針對具身分感知的反向代理，選擇 `trusted-proxy`）。如果你**真的**想要開放 loopback，請在設定中明確設定 `gateway.auth.mode: "none"`。Doctor 可以隨時為你產生權杖：`openclaw doctor --generate-gateway-token`。

  </Accordion>

  <Accordion title="變更設定後我必須重新啟動嗎？">
    閘道會監看設定，並支援熱重新載入：

    - `gateway.reload.mode: "hybrid"`（預設）：熱套用安全變更，關鍵變更則重新啟動
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

    - `off`：隱藏標語文字，但保留橫幅標題/版本列。
    - `default`：每次都使用 `All your chats, one OpenClaw.`。
    - `random`：輪替有趣/季節性標語（預設行為）。
    - 如果你完全不想顯示橫幅，請設定環境變數 `OPENCLAW_HIDE_BANNER=1`。

  </Accordion>

  <Accordion title="如何啟用網頁搜尋（以及網頁擷取）？">
    `web_fetch` 不需要 API 金鑰即可運作。`web_search` 取決於你選擇的
    提供者：

    - 以 API 為後端的提供者，例如 Brave、Exa、Firecrawl、Gemini、Kimi、MiniMax Search、Perplexity 和 Tavily，需要其一般 API 金鑰設定。
    - Grok 可以重用模型驗證中的 xAI OAuth，或退回使用 `XAI_API_KEY` / 外掛網頁搜尋設定。
    - Ollama Web Search 不需要金鑰，但它會使用你設定的 Ollama 主機，且需要 `ollama signin`。
    - DuckDuckGo 不需要金鑰，但它是非官方、以 HTML 為基礎的整合。
    - SearXNG 不需要金鑰/可自行託管；設定 `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`。

    **建議：** 執行 `openclaw configure --section web` 並選擇提供者。
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

    提供者專屬的網頁搜尋設定現在位於 `plugins.entries.<plugin>.config.webSearch.*` 底下。
    舊版 `tools.web.search.*` 提供者路徑仍會暫時載入以維持相容性，但不應用於新的設定。
    Firecrawl 網頁擷取備援設定位於 `plugins.entries.firecrawl.config.webFetch.*` 底下。

    注意事項：

    - 如果你使用允許清單，請加入 `web_search`/`web_fetch`/`x_search` 或 `group:web`。
    - `web_fetch` 預設啟用（除非明確停用）。
    - 如果省略 `tools.web.fetch.provider`，OpenClaw 會從可用憑證中自動偵測第一個就緒的擷取備援提供者。官方 Firecrawl 外掛提供該備援。
    - 常駐程式會從 `~/.openclaw/.env`（或服務環境）讀取環境變數。

    文件：[網頁工具](/zh-TW/tools/web)。

  </Accordion>

  <Accordion title="config.apply 清除了我的設定。我要如何復原並避免這種情況？">
    `config.apply` 會取代**整個設定**。如果你傳送部分物件，其他所有內容都會被移除。

    目前的 OpenClaw 會防止許多意外覆寫：

    - OpenClaw 擁有的設定寫入會在寫入前驗證完整的變更後設定。
    - 無效或具破壞性的 OpenClaw 擁有寫入會被拒絕，並儲存為 `openclaw.json.rejected.*`。
    - 如果直接編輯導致啟動或熱重新載入失敗，閘道會封閉失敗或跳過重新載入；它不會重寫 `openclaw.json`。
    - `openclaw doctor --fix` 負責修復，並可還原最後已知良好設定，同時將被拒絕的檔案儲存為 `openclaw.json.clobbered.*`。

    復原：

    - 檢查 `openclaw logs --follow` 中是否有 `Invalid config at`、`Config write rejected:` 或 `config reload skipped (invalid config)`。
    - 檢查作用中設定旁最新的 `openclaw.json.clobbered.*` 或 `openclaw.json.rejected.*`。
    - 執行 `openclaw config validate` 和 `openclaw doctor --fix`。
    - 只用 `openclaw config set` 或 `config.patch` 複製預期的鍵回去。
    - 如果你沒有最後已知良好設定或被拒絕的酬載，請從備份還原，或重新執行 `openclaw doctor` 並重新設定頻道/模型。
    - 如果這不是預期行為，請提交錯誤回報，並附上你最後已知的設定或任何備份。
    - 本機編碼代理通常可以從日誌或歷史記錄中重建可運作的設定。

    避免方式：

    - 小幅變更請使用 `openclaw config set`。
    - 互動式編輯請使用 `openclaw configure`。
    - 當你不確定確切路徑或欄位形狀時，先使用 `config.schema.lookup`；它會回傳淺層結構描述節點，以及可向下鑽研的直接子項摘要。
    - 部分 RPC 編輯請使用 `config.patch`；`config.apply` 只保留給完整設定取代。
    - 如果你在代理執行中使用面向代理的 `gateway` 工具，它仍會拒絕寫入 `tools.exec.ask` / `tools.exec.security`（包括會正規化到相同受保護執行路徑的舊版 `tools.bash.*` 別名）。

    文件：[設定](/zh-TW/cli/config)、[設定精靈](/zh-TW/cli/configure)、[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)、[Doctor](/zh-TW/gateway/doctor)。

  </Accordion>

  <Accordion title="如何在多台裝置間執行具專門工作者的中央閘道？">
    常見模式是**一個閘道**（例如 Raspberry Pi）加上**節點**和**代理**：

    - **閘道（中央）：** 擁有頻道（Signal/WhatsApp）、路由和工作階段。
    - **節點（裝置）：** Macs/iOS/Android 會以周邊裝置連線，並公開本機工具（`system.run`、`canvas`、`camera`）。
    - **代理（工作者）：** 用於特殊角色的獨立大腦/工作區（例如「Hetzner 維運」、「個人資料」）。
    - **子代理：** 當你需要平行處理時，從主代理產生背景工作。
    - **終端介面：** 連線到閘道並切換代理/工作階段。

    文件：[節點](/zh-TW/nodes)、[遠端存取](/zh-TW/gateway/remote)、[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[終端介面](/zh-TW/web/tui)。

  </Accordion>

  <Accordion title="OpenClaw 瀏覽器可以無頭執行嗎？">
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

    預設是 `false`（有頭）。無頭模式在某些網站上更可能觸發反機器人檢查。請參閱[瀏覽器](/zh-TW/tools/browser)。

    無頭模式使用**相同的 Chromium 引擎**，並適用於大多數自動化（表單、點擊、爬取、登入）。主要差異如下：

    - 沒有可見的瀏覽器視窗（如果需要視覺內容，請使用螢幕截圖）。
    - 某些網站對無頭模式的自動化更嚴格（CAPTCHA、反機器人）。
      例如，X/Twitter 經常封鎖無頭工作階段。

  </Accordion>

  <Accordion title="如何使用 Brave 進行瀏覽器控制？">
    將 `browser.executablePath` 設為你的 Brave 二進位檔（或任何以 Chromium 為基礎的瀏覽器），然後重新啟動閘道。
    請參閱[瀏覽器](/zh-TW/tools/browser#use-brave-or-another-chromium-based-browser)中的完整設定範例。
  </Accordion>
</AccordionGroup>

## 遠端閘道與節點

<AccordionGroup>
  <Accordion title="命令如何在 Telegram、閘道和節點之間傳播？">
    Telegram 訊息由**閘道**處理。閘道會執行代理，只有在需要節點工具時，
    才會透過**閘道 WebSocket** 呼叫節點：

    Telegram → 閘道 → 代理 → `node.*` → 節點 → 閘道 → Telegram

    節點不會看到傳入的提供者流量；它們只會接收節點 RPC 呼叫。

  </Accordion>

  <Accordion title="如果閘道託管在遠端，我的代理要如何存取我的電腦？">
    簡短回答：**將你的電腦配對為節點**。閘道在其他地方執行，但它可以
    透過閘道 WebSocket 在你的本機機器上呼叫 `node.*` 工具（螢幕、相機、系統）。

    典型設定：

    1. 在永遠開機的主機（VPS/家用伺服器）上執行閘道。
    2. 將閘道主機 + 你的電腦放在同一個 tailnet 上。
    3. 確保閘道 WS 可連線（tailnet 繫結或 SSH 通道）。
    4. 在本機開啟 macOS 應用程式，並以 **Remote over SSH** 模式（或直接 tailnet）
       連線，讓它可以註冊為節點。
    5. 在閘道上核准節點：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    不需要獨立的 TCP 橋接；節點會透過閘道 WebSocket 連線。

    安全提醒：配對 macOS 節點會允許在該機器上執行 `system.run`。只配對你信任的裝置，並查看[安全性](/zh-TW/gateway/security)。

    文件：[節點](/zh-TW/nodes)、[閘道協定](/zh-TW/gateway/protocol)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)、[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="Tailscale 已連線但我沒有收到回覆。現在該怎麼辦？">
    檢查基本項目：

    - 閘道正在執行：`openclaw gateway status`
    - 閘道健康狀態：`openclaw status`
    - 頻道健康狀態：`openclaw channels status`

    接著驗證身分驗證和路由：

    - 如果你使用 Tailscale Serve，請確認 `gateway.auth.allowTailscale` 設定正確。
    - 如果你透過 SSH 通道連線，請確認本機通道已啟動並指向正確的連接埠。
    - 確認你的允許清單（DM 或群組）包含你的帳號。

    文件：[Tailscale](/zh-TW/gateway/tailscale)、[遠端存取](/zh-TW/gateway/remote)、[頻道](/zh-TW/channels)。

  </Accordion>

  <Accordion title="兩個 OpenClaw 執行個體可以互相通訊嗎（本機 + VPS）？">
    可以。沒有內建的「機器人對機器人」橋接，但你可以用幾種
    可靠方式串接：

    **最簡單：** 使用兩個機器人都能存取的一般聊天頻道（Telegram/Slack/WhatsApp）。
    讓機器人 A 傳送訊息給機器人 B，然後讓機器人 B 照常回覆。

    **命令列介面橋接（通用）：** 執行一個腳本，透過
    `openclaw agent --message ... --deliver` 呼叫另一個閘道，目標設為另一個機器人
    監聽的聊天。如果其中一個機器人在遠端 VPS 上，請透過 SSH/Tailscale 將你的命令列介面指向該遠端閘道
    （請參閱[遠端存取](/zh-TW/gateway/remote)）。

    範例模式（從可連到目標閘道的機器執行）：

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    提示：加入防護機制，避免兩個機器人無止境循環（僅提及、頻道允許清單，
    或「不要回覆機器人訊息」規則）。

    文件：[遠端存取](/zh-TW/gateway/remote)、[代理命令列介面](/zh-TW/cli/agent)、[代理傳送](/zh-TW/tools/agent-send)。

  </Accordion>

  <Accordion title="多個代理需要獨立的 VPS 嗎？">
    不需要。一個閘道可以託管多個代理，每個代理都有自己的工作區、模型預設值
    和路由。這是一般設定，而且比每個代理執行一台 VPS 便宜且簡單得多。

    只有在你需要強隔離（安全邊界）或非常
    不同且不想共用的設定時，才使用獨立 VPS。否則，保留一個閘道並
    使用多個代理或子代理。

  </Accordion>

  <Accordion title="使用個人筆電上的節點，而不是從 VPS 透過 SSH 連線，有什麼好處嗎？">
    有，節點是從遠端閘道連到你筆電的一等方式，而且它們
    解鎖的不只是 shell 存取。閘道可在 macOS/Linux 上執行（Windows 透過 WSL2），而且
    很輕量（一台小型 VPS 或 Raspberry Pi 等級的機器就可以；4 GB RAM 很充足），所以常見的
    設定是一台常時在線主機，加上你的筆電作為節點。

    - **不需要入站 SSH。** 節點會向外連到閘道 WebSocket，並使用裝置配對。
    - **更安全的執行控制。** `system.run` 會受到該筆電上的節點允許清單/核准機制控管。
    - **更多裝置工具。** 除了 `system.run`，節點還會公開 `canvas`、`camera` 和 `screen`。
    - **本機瀏覽器自動化。** 將閘道留在 VPS 上，但透過筆電上的節點主機在本機執行 Chrome，或透過 Chrome MCP 連接到主機上的本機 Chrome。

    SSH 很適合臨時 shell 存取，但對持續性的代理工作流程和
    裝置自動化而言，節點更簡單。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[瀏覽器](/zh-TW/tools/browser)。

  </Accordion>

  <Accordion title="節點會執行閘道服務嗎？">
    不會。除非你刻意執行隔離的設定檔，否則每台主機只應執行**一個閘道**（請參閱[多個閘道](/zh-TW/gateway/multiple-gateways)）。節點是連線到
    閘道的周邊（iOS/Android 節點，或選單列應用程式中的 macOS「節點模式」）。如需無頭節點
    主機和命令列介面控制，請參閱[節點主機命令列介面](/zh-TW/cli/node)。

    `gateway`、`discovery` 和託管外掛介面變更都需要完整重新啟動。

  </Accordion>

  <Accordion title="有 API / RPC 方式可以套用設定嗎？">
    有。

    - `config.schema.lookup`：在寫入前檢查一個設定子樹，包含其淺層結構描述節點、相符的 UI 提示，以及直屬子項摘要
    - `config.get`：擷取目前的快照 + 雜湊
    - `config.patch`：安全的部分更新（多數 RPC 編輯的首選）；可行時熱重新載入，必要時重新啟動
    - `config.apply`：驗證 + 取代完整設定；可行時熱重新載入，必要時重新啟動
    - 面向代理的 `gateway` 執行階段工具仍會拒絕重寫 `tools.exec.ask` / `tools.exec.security`；舊版 `tools.bash.*` 別名會正規化為相同受保護的 exec 路徑

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
    最少步驟：

    1. **在 VPS 上安裝 + 登入**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **在你的 Mac 上安裝 + 登入**
       - 使用 Tailscale 應用程式並登入同一個 tailnet。
    3. **啟用 MagicDNS（建議）**
       - 在 Tailscale 管理主控台中啟用 MagicDNS，讓 VPS 擁有穩定名稱。
    4. **使用 tailnet 主機名稱**
       - SSH：`ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS：`ws://your-vps.tailnet-xxxx.ts.net:18789`

    如果你想在不使用 SSH 的情況下使用 Control UI，請在 VPS 上使用 Tailscale Serve：

    ```bash
    openclaw gateway --tailscale serve
    ```

    這會讓閘道繫結到 loopback，並透過 Tailscale 公開 HTTPS。請參閱 [Tailscale](/zh-TW/gateway/tailscale)。

  </Accordion>

  <Accordion title="如何將 Mac 節點連到遠端閘道（Tailscale Serve）？">
    Serve 會公開**閘道 Control UI + WS**。節點會透過相同的 Gateway WS 端點連線。

    建議設定：

    1. **確認 VPS + Mac 位於同一個 tailnet**。
    2. **在遠端模式下使用 macOS 應用程式**（SSH 目標可以是 tailnet 主機名稱）。
       應用程式會建立閘道連接埠通道，並以節點身分連線。
    3. **在閘道上核准節點**：

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    文件：[閘道通訊協定](/zh-TW/gateway/protocol)、[探索](/zh-TW/gateway/discovery)、[macOS 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我應該在第二台筆電上安裝，還是只新增節點？">
    如果你只需要第二台筆電上的**本機工具**（螢幕/相機/exec），請將它新增為
    **節點**。這會保留單一閘道並避免重複設定。本機節點工具
    目前僅支援 macOS，但我們計畫將它們擴充到其他作業系統。

    只有在你需要**硬隔離**或兩個完全獨立的機器人時，才安裝第二個閘道。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)、[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>
</AccordionGroup>

## 環境變數和 .env 載入

<AccordionGroup>
  <Accordion title="OpenClaw 如何載入環境變數？">
    OpenClaw 會從父程序（shell、launchd/systemd、CI 等）讀取環境變數，並額外載入：

    - 目前工作目錄中的 `.env`
    - 來自 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`）的全域後援 `.env`

    這兩個 `.env` 檔都不會覆寫既有的環境變數。
    提供者憑證變數對工作區 `.env` 是例外：像
    `GEMINI_API_KEY`、`XAI_API_KEY` 或 `MISTRAL_API_KEY` 這類鍵會從工作區
    `.env` 被忽略，應放在程序環境、`~/.openclaw/.env`，或設定 `env` 中。

    你也可以在設定中定義內嵌環境變數（只會在程序環境缺少時套用）：

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    如需完整優先順序和來源，請參閱 [/environment](/zh-TW/help/environment)。

  </Accordion>

  <Accordion title="我透過服務啟動閘道，結果環境變數消失了。現在怎麼辦？">
    兩個常見修正：

    1. 將缺少的鍵放入 `~/.openclaw/.env`，這樣即使服務沒有繼承你的 shell 環境，也能被讀取。
    2. 啟用 shell 匯入（選擇啟用的便利功能）：

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

    這會執行你的登入 shell，且只匯入缺少的預期鍵（絕不覆寫）。等效的環境變數：
    `OPENCLAW_LOAD_SHELL_ENV=1`、`OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`。

  </Accordion>

  <Accordion title='我設定了 COPILOT_GITHUB_TOKEN，但 models status 顯示「Shell env: off」。為什麼？'>
    `openclaw models status` 回報的是**shell 環境匯入**是否已啟用。「Shell env: off」
    **不**代表你的環境變數遺失，它只代表 OpenClaw 不會自動載入
    你的登入 shell。

    如果閘道以服務（launchd/systemd）執行，它不會繼承你的 shell
    環境。請用下列其中一種方式修正：

    1. 將權杖放入 `~/.openclaw/.env`：

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 或啟用 shell 匯入（`env.shellEnv.enabled: true`）。
    3. 或將它新增到你的設定 `env` 區塊（只會在缺少時套用）。

    然後重新啟動閘道並再次檢查：

    ```bash
    openclaw models status
    ```

    Copilot 權杖會從 `COPILOT_GITHUB_TOKEN` 讀取（也包括 `GH_TOKEN` / `GITHUB_TOKEN`）。
    請參閱 [/concepts/model-providers](/zh-TW/concepts/model-providers) 和 [/environment](/zh-TW/help/environment)。

  </Accordion>
</AccordionGroup>

## 工作階段和多個聊天

<AccordionGroup>
  <Accordion title="如何開始全新的對話？">
    將 `/new` 或 `/reset` 作為獨立訊息傳送。請參閱[工作階段管理](/zh-TW/concepts/session)。
  </Accordion>

  <Accordion title="如果我從不傳送 /new，工作階段會自動重設嗎？">
    工作階段可在 `session.idleMinutes` 後到期，但這項功能**預設停用**（預設為 **0**）。
    將它設為正值即可啟用閒置到期。啟用後，閒置期間之後的**下一則**
    訊息會為該聊天鍵開始新的工作階段 ID。
    這不會刪除逐字稿，只是開始新的工作階段。

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="有沒有辦法建立一組 OpenClaw 執行個體團隊（一個 CEO 和多個代理）？">
    有，可透過**多代理路由**和**子代理**。你可以建立一個協調者
    代理，以及數個擁有各自工作區和模型的工作者代理。

    不過，這最好視為一個**有趣的實驗**。它很耗權杖，而且通常
    不如使用一個搭配多個工作階段的機器人有效率。我們設想的典型模型是：
    一個你對話的機器人，並用不同工作階段處理平行工作。該
    機器人也可以在需要時產生子代理。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[子代理](/zh-TW/tools/subagents)、[代理命令列介面](/zh-TW/cli/agents)。

  </Accordion>

  <Accordion title="為什麼內容會在任務中途被截斷？如何避免？">
    工作階段內容受限於模型視窗。長聊天、大型工具輸出或大量
    檔案都可能觸發壓縮或截斷。

    有幫助的做法：

    - 要求機器人摘要目前狀態並寫入檔案。
    - 在長任務前使用 `/compact`，切換主題時使用 `/new`。
    - 將重要內容保留在工作區，並要求機器人讀回。
    - 對長時間或平行工作使用子代理，讓主聊天保持較小。
    - 如果這種情況經常發生，請選擇具備更大內容視窗的模型。

  </Accordion>

  <Accordion title="如何完全重設 OpenClaw 但保留安裝？">
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

    - 如果入門流程看到既有設定，也會提供**重設**。請參閱[入門（命令列介面）](/zh-TW/start/wizard)。
    - 如果你使用了設定檔（`--profile` / `OPENCLAW_PROFILE`），請重設每個狀態目錄（預設為 `~/.openclaw-<profile>`）。
    - 開發重設：`openclaw gateway --dev --reset`（僅限開發；會清除開發設定 + 憑證 + 工作階段 + 工作區）。

  </Accordion>

  <Accordion title='我收到「context too large」錯誤，該如何重設或壓縮？'>
    使用下列其中一種：

    - **壓縮**（保留對話，但摘要較舊的回合）：

      ```
      /compact
      ```

      或使用 `/compact <instructions>` 來引導摘要。

    - **重設**（為同一個聊天鍵建立新的工作階段 ID）：

      ```
      /new
      /reset
      ```

    如果持續發生：

    - 啟用或調整**工作階段修剪**（`agents.defaults.contextPruning`），以修剪舊的工具輸出。
    - 使用具有更大內容視窗的模型。

    文件：[壓縮](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)、[工作階段管理](/zh-TW/concepts/session)。

  </Accordion>

  <Accordion title='為什麼我看到「LLM request rejected: messages.content.tool_use.input field required」？'>
    這是提供者驗證錯誤：模型發出了缺少必要
    `input` 的 `tool_use` 區塊。這通常表示工作階段歷史已過時或損毀（常見於長討論串
    或工具/結構描述變更之後）。

    修正方式：用 `/new` 開始新的工作階段（作為獨立訊息）。

  </Accordion>

  <Accordion title="為什麼我每 30 分鐘收到一次心跳偵測訊息？">
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
    Markdown/HTML 註解、像 `# Heading` 這樣的 Markdown 標題、程式碼圍欄標記，
    或空的檢查清單樣板），OpenClaw 會略過心跳偵測執行以節省 API 呼叫。
    如果檔案不存在，心跳偵測仍會執行，並由模型決定要做什麼。

    每個代理程式的覆寫使用 `agents.list[].heartbeat`。文件：[心跳偵測](/zh-TW/gateway/heartbeat)。

  </Accordion>

  <Accordion title='我需要把「bot 帳號」加入 WhatsApp 群組嗎？'>
    不需要。OpenClaw 會在**你自己的帳號**上執行，所以如果你在群組中，OpenClaw 就能看到它。
    預設會封鎖群組回覆，直到你允許傳送者（`groupPolicy: "allowlist"`）。

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
    選項 1（最快）：追蹤日誌並在群組中傳送測試訊息：

    ```bash
    openclaw logs --follow --json
    ```

    尋找以 `@g.us` 結尾的 `chatId`（或 `from`），例如：
    `1234567890-1234567890@g.us`。

    選項 2（如果已設定/加入允許清單）：從設定列出群組：

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[目錄](/zh-TW/cli/directory)、[日誌](/zh-TW/cli/logs)。

  </Accordion>

  <Accordion title="為什麼 OpenClaw 不在群組中回覆？">
    兩個常見原因：

    - 提及閘門已開啟（預設）。你必須 @提及 bot（或符合 `mentionPatterns`）。
    - 你設定了 `channels.whatsapp.groups` 但沒有 `"*"`，且該群組未加入允許清單。

    請參閱[群組](/zh-TW/channels/groups)與[群組訊息](/zh-TW/channels/group-messages)。

  </Accordion>

  <Accordion title="群組/討論串會與 DM 共用脈絡嗎？">
    直接聊天預設會折疊到主要工作階段。群組/頻道有自己的工作階段鍵，而 Telegram 主題 / Discord 討論串是獨立的工作階段。請參閱[群組](/zh-TW/channels/groups)與[群組訊息](/zh-TW/channels/group-messages)。
  </Accordion>

  <Accordion title="我可以建立多少個工作區和代理程式？">
    沒有硬性限制。數十個（甚至數百個）都可以，但請留意：

    - **磁碟成長：** 工作階段 + 逐字稿位於 `~/.openclaw/agents/<agentId>/sessions/` 下。
    - **Token 成本：** 更多代理程式代表更多並行模型使用量。
    - **維運負擔：** 每個代理程式各自的驗證設定檔、工作區和頻道路由。

    提示：

    - 每個代理程式保留一個**作用中**工作區（`agents.defaults.workspace`）。
    - 如果磁碟成長，請修剪舊工作階段（刪除 JSONL 或儲存項目）。
    - 使用 `openclaw doctor` 找出零散的工作區和設定檔不相符。

  </Accordion>

  <Accordion title="我可以同時執行多個 bot 或聊天（Slack）嗎？應該如何設定？">
    可以。使用**多代理路由**來執行多個隔離的代理程式，並依
    頻道/帳號/對等端路由傳入訊息。Slack 支援作為頻道，並可繫結到特定代理程式。

    瀏覽器存取很強大，但並不是「人類能做什麼就都能做」；反自動化、CAPTCHA 和 MFA
    仍可能阻擋自動化。若要最可靠地控制瀏覽器，請在主機上使用本機 Chrome MCP，
    或在實際執行瀏覽器的機器上使用 CDP。

    最佳實務設定：

    - 永遠在線的閘道主機（VPS/Mac mini）。
    - 每個角色一個代理程式（繫結）。
    - Slack 頻道繫結到這些代理程式。
    - 需要時透過 Chrome MCP 或節點使用本機瀏覽器。

    文件：[多代理路由](/zh-TW/concepts/multi-agent)、[Slack](/zh-TW/channels/slack)、
    [瀏覽器](/zh-TW/tools/browser)、[節點](/zh-TW/nodes)。

  </Accordion>
</AccordionGroup>

## 模型、容錯移轉與驗證設定檔

模型問答 — 預設值、選擇、別名、切換、容錯移轉、驗證設定檔 —
位於[模型常見問題](/zh-TW/help/faq-models)。

## 閘道：連接埠、「已在執行中」與遠端模式

<AccordionGroup>
  <Accordion title="閘道使用哪個連接埠？">
    `gateway.port` 控制 WebSocket + HTTP（Control UI、hook 等）的單一多工連接埠。

    優先順序：

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示「Runtime: running」但「Connectivity probe: failed」？'>
    因為「running」是**監督程式**的觀點（launchd/systemd/schtasks）。連線探測則是命令列介面實際連到閘道 WebSocket。

    使用 `openclaw gateway status`，並信任這些行：

    - `Probe target:`（探測實際使用的 URL）
    - `Listening:`（連接埠上實際繫結的內容）
    - `Last gateway error:`（處理程序仍存活但連接埠未監聽時的常見根本原因）

  </Accordion>

  <Accordion title='為什麼 openclaw gateway status 顯示的「Config (cli)」和「Config (service)」不同？'>
    你正在編輯一個設定檔，但服務正在使用另一個設定檔執行（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不相符）。

    修正：

    ```bash
    openclaw gateway install --force
    ```

    請從你希望服務使用的同一個 `--profile` / 環境執行該命令。

  </Accordion>

  <Accordion title='「another gateway instance is already listening」是什麼意思？'>
    OpenClaw 會在啟動時立即繫結 WebSocket 監聽器（預設 `ws://127.0.0.1:18789`）來強制執行執行階段鎖定。如果繫結因 `EADDRINUSE` 失敗，它會擲出 `GatewayLockError`，表示另一個執行個體已在監聽。

    修正：停止另一個執行個體、釋放連接埠，或使用 `openclaw gateway --port <port>` 執行。

  </Accordion>

  <Accordion title="我要如何以遠端模式執行 OpenClaw（用戶端連到其他地方的閘道）？">
    設定 `gateway.mode: "remote"`，並指向遠端 WebSocket URL，可選擇搭配共用密鑰遠端認證：

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

    注意：

    - `openclaw gateway` 只會在 `gateway.mode` 為 `local` 時啟動（或你傳入覆寫旗標）。
    - macOS 應用程式會監看設定檔，並在這些值變更時即時切換模式。
    - `gateway.remote.token` / `.password` 只是用戶端遠端認證；它們本身不會啟用本機閘道驗證。

  </Accordion>

  <Accordion title='Control UI 顯示「unauthorized」（或持續重新連線）。現在該怎麼辦？'>
    你的閘道驗證路徑與 UI 的驗證方法不相符。

    事實（來自程式碼）：

    - Control UI 會針對目前瀏覽器分頁工作階段和所選閘道 URL，將 token 保存在 `sessionStorage` 中，因此同一分頁重新整理仍可繼續運作，而不會恢復長期 localStorage token 持久化。
    - 在 `AUTH_TOKEN_MISMATCH` 時，當閘道傳回重試提示（`canRetryWithDeviceToken=true`、`recommendedNextStep=retry_with_device_token`）時，受信任的用戶端可以嘗試一次有界重試，使用快取的裝置 token。
    - 該快取 token 重試現在會重用與裝置 token 一起儲存的快取已核准範圍。明確的 `deviceToken` / 明確的 `scopes` 呼叫者仍會保留其要求的範圍集，而不是繼承快取範圍。
    - 在該重試路徑之外，連線驗證優先順序是先明確共用 token/password，然後是明確 `deviceToken`，再來是已儲存的裝置 token，最後是 bootstrap token。
    - 內建 setup-code bootstrap 會傳回具有 `scopes: []` 的節點裝置 token，並附帶用於受信任行動裝置上線的有界操作員交接 token。操作員交接可以讀取設定期間的原生設定，但不會授予配對變更範圍或 `operator.admin`。

    修正：

    - 最快：`openclaw dashboard`（列印 + 複製 dashboard URL，嘗試開啟；若為無頭環境則顯示 SSH 提示）。
    - 如果你還沒有 token：`openclaw doctor --generate-gateway-token`。
    - 如果是遠端，先建立通道：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。
    - 共用密鑰模式：設定 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，然後在 Control UI 設定中貼上相符的密鑰。
    - Tailscale Serve 模式：確認已啟用 `gateway.auth.allowTailscale`，而且你開啟的是 Serve URL，不是會繞過 Tailscale 身分標頭的原始 loopback/tailnet URL。
    - 受信任 Proxy 模式：確認你是透過設定的身分感知 Proxy 進入，而不是原始閘道 URL。同主機 local loopback Proxy 也需要 `gateway.auth.trustedProxy.allowLoopback = true`。
    - 如果一次重試後仍不相符，請輪替/重新核准已配對的裝置 token：
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 如果該輪替呼叫顯示遭拒，請檢查兩件事：
      - 已配對裝置工作階段只能輪替其**自己的**裝置，除非它們也具有 `operator.admin`
      - 明確的 `--scope` 值不能超過呼叫者目前的操作員範圍
    - 仍然卡住？執行 `openclaw status --all` 並依照[疑難排解](/zh-TW/gateway/troubleshooting)。驗證詳細資訊請參閱 [Dashboard](/zh-TW/web/dashboard)。

  </Accordion>

  <Accordion title="我設定 gateway.bind tailnet，但它無法繫結且沒有任何東西監聽">
    `tailnet` 繫結會從你的網路介面選取 Tailscale IP（100.64.0.0/10）。如果該機器不在 Tailscale 上（或介面已關閉），就沒有可繫結的位址。

    修正：

    - 在該主機上啟動 Tailscale（讓它有 100.x 位址），或
    - 切換到 `gateway.bind: "loopback"` / `"lan"`。

    注意：`tailnet` 是明確的。`auto` 偏好 loopback；當你想要僅限 tailnet 的繫結時，請使用 `gateway.bind: "tailnet"`。

  </Accordion>

  <Accordion title="我可以在同一台主機上執行多個閘道嗎？">
    通常不需要；一個閘道可以執行多個訊息頻道和代理程式。只有在需要備援（例如：救援 bot）或強隔離時，才使用多個閘道。

    可以，但你必須隔離：

    - `OPENCLAW_CONFIG_PATH`（每個執行個體的設定）
    - `OPENCLAW_STATE_DIR`（每個執行個體的狀態）
    - `agents.defaults.workspace`（工作區隔離）
    - `gateway.port`（唯一連接埠）

    快速設定（建議）：

    - 每個執行個體使用 `openclaw --profile <name> ...`（自動建立 `~/.openclaw-<name>`）。
    - 在每個設定檔設定中設定唯一的 `gateway.port`（或手動執行時傳入 `--port`）。
    - 安裝每個設定檔專用的服務：`openclaw --profile <name> gateway install`。

    設定檔也會為服務名稱加上後綴（`ai.openclaw.<profile>`；舊版 `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
    完整指南：[多個閘道](/zh-TW/gateway/multiple-gateways)。

  </Accordion>

  <Accordion title='「invalid handshake」/ 代碼 1008 是什麼意思？'>
    閘道是一個 **WebSocket 伺服器**，它預期第一個訊息是
    `connect` frame。如果它收到其他任何內容，就會以 **代碼 1008**（原則違規）
    關閉連線。

    常見原因：

    - 你在瀏覽器中開啟了 **HTTP** URL（`http://...`），而不是使用 WS 用戶端。
    - 你使用了錯誤的連接埠或路徑。
    - Proxy 或通道移除了驗證標頭，或傳送了非閘道要求。

    快速修正：

    1. 使用 WS URL：`ws://<host>:18789`（如果是 HTTPS，則使用 `wss://...`）。
    2. 不要在一般瀏覽器分頁中開啟 WS 連接埠。
    3. 如果已啟用驗證，請在 `connect` frame 中包含 token/password。

    如果你使用命令列介面或終端介面，URL 應該像這樣：

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    協定詳細資訊：[閘道協定](/zh-TW/gateway/protocol)。

  </Accordion>
</AccordionGroup>

## 記錄與偵錯

<AccordionGroup>
  <Accordion title="日誌在哪裡？">
    檔案日誌（結構化）：

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    你可以透過 `logging.file` 設定穩定路徑。檔案日誌層級由 `logging.level` 控制。主控台詳細程度由 `--verbose` 和 `logging.consoleLevel` 控制。

    最快的日誌追蹤：

    ```bash
    openclaw logs --follow
    ```

    服務/監督程式日誌（當閘道透過 launchd/systemd 執行時）：

    - macOS launchd stdout：`~/Library/Logs/openclaw/gateway.log`（設定檔使用 `gateway-<profile>.log`；stderr 會被抑制）
    - Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    更多資訊請參閱[疑難排解](/zh-TW/gateway/troubleshooting)。

  </Accordion>

  <Accordion title="如何啟動/停止/重新啟動閘道服務？">
    使用閘道輔助命令：

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行閘道，`openclaw gateway --force` 可以收回連接埠。請參閱[閘道](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="我在 Windows 上關閉了終端機 - 要如何重新啟動 OpenClaw？">
    有**三種 Windows 安裝模式**：

    **1) Windows Hub 本機設定：** 原生應用程式會管理應用程式擁有的本機 WSL 閘道。

    從開始功能表或系統匣開啟 **OpenClaw Companion**，然後使用
    **閘道設定**或連線分頁。

    **2) 手動 WSL2 閘道：** 閘道在 Linux 內執行。

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

    **3) 原生 Windows 命令列介面/閘道：** 閘道直接在 Windows 中執行。

    開啟 PowerShell 並執行：

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    如果你手動執行它（沒有服務），請使用：

    ```powershell
    openclaw gateway run
    ```

    文件：[Windows](/zh-TW/platforms/windows)、[閘道服務執行手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="閘道已啟動，但回覆一直沒有送達。我該檢查什麼？">
    先做一次快速健康檢查：

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    常見原因：

    - 模型驗證未載入到**閘道主機**上（檢查 `models status`）。
    - 頻道配對/允許清單阻擋回覆（檢查頻道設定 + 日誌）。
    - WebChat/儀表板已開啟，但沒有正確的權杖。

    如果你在遠端，請確認通道/Tailscale 連線已啟動，且
    閘道 WebSocket 可連線。

    文件：[頻道](/zh-TW/channels)、[疑難排解](/zh-TW/gateway/troubleshooting)、[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title='"已中斷與閘道的連線：沒有原因" - 現在該怎麼辦？'>
    這通常表示 UI 失去了 WebSocket 連線。請檢查：

    1. 閘道是否正在執行？`openclaw gateway status`
    2. 閘道是否健康？`openclaw status`
    3. UI 是否有正確的權杖？`openclaw dashboard`
    4. 如果在遠端，通道/Tailscale 連結是否已啟動？

    然後追蹤日誌：

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

    然後比對錯誤：

    - `BOT_COMMANDS_TOO_MUCH`：Telegram 選單項目太多。OpenClaw 已經會裁剪到 Telegram 限制，並以較少命令重試，但仍需要移除一些選單項目。減少外掛/skill/自訂命令，或如果你不需要選單，請停用 `channels.telegram.commands.native`。
    - `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!`，或類似網路錯誤：如果你在 VPS 上或位於代理後方，請確認允許對外 HTTPS，且 DNS 可解析 `api.telegram.org`。

    如果閘道在遠端，請確認你查看的是閘道主機上的日誌。

    文件：[Telegram](/zh-TW/channels/telegram)、[頻道疑難排解](/zh-TW/channels/troubleshooting)。

  </Accordion>

  <Accordion title="終端介面沒有顯示輸出。我該檢查什麼？">
    先確認閘道可連線，且代理可以執行：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    在終端介面中，使用 `/status` 查看目前狀態。如果你預期在聊天
    頻道收到回覆，請確認已啟用傳遞（`/deliver on`）。

    文件：[終端介面](/zh-TW/web/tui)、[斜線命令](/zh-TW/tools/slash-commands)。

  </Accordion>

  <Accordion title="如何完全停止再啟動閘道？">
    如果你已安裝服務：

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    這會停止/啟動**受監督的服務**（macOS 上的 launchd、Linux 上的 systemd）。
    當閘道作為 daemon 在背景執行時，請使用這個方式。

    如果你是在前景執行，請用 Ctrl-C 停止，然後：

    ```bash
    openclaw gateway run
    ```

    文件：[閘道服務執行手冊](/zh-TW/gateway)。

  </Accordion>

  <Accordion title="簡單說明：openclaw gateway restart 與 openclaw gateway">
    - `openclaw gateway restart`：重新啟動**背景服務**（launchd/systemd）。
    - `openclaw gateway`：為這個終端機工作階段在**前景**執行閘道。

    如果你已安裝服務，請使用閘道命令。當你想要一次性的前景執行時，
    使用 `openclaw gateway`。

  </Accordion>

  <Accordion title="發生失敗時最快取得更多詳細資訊的方法">
    使用 `--verbose` 啟動閘道，以取得更多主控台詳細資訊。然後檢查日誌檔中的頻道驗證、模型路由和 RPC 錯誤。
  </Accordion>
</AccordionGroup>

## 媒體和附件

<AccordionGroup>
  <Accordion title="我的 skill 產生了圖片/PDF，但沒有送出任何內容">
    代理的輸出附件必須使用結構化媒體欄位，例如 `media`、`mediaUrl`、`path` 或 `filePath`。請參閱 [OpenClaw 助理設定](/zh-TW/start/openclaw)和[代理傳送](/zh-TW/tools/agent-send)。

    命令列介面傳送：

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    也請檢查：

    - 目標頻道支援輸出媒體，且未被允許清單阻擋。
    - 檔案在提供者的大小限制內（圖片會調整為最大 2048px）。
    - `tools.fs.workspaceOnly=true` 會將本機路徑傳送限制在工作區、temp/media-store，以及經沙盒驗證的檔案。
    - `tools.fs.workspaceOnly=false` 允許結構化本機媒體傳送使用代理已經可以讀取的主機本機檔案，但僅限媒體加上安全文件類型（圖片、音訊、影片、PDF、Office 文件，以及經驗證的文字文件，例如 Markdown/MD、TXT、JSON、YAML 和 YML）。這不是秘密掃描器：當擴充功能和內容驗證相符時，代理可讀取的 `secret.txt` 或 `config.json` 可以作為附件。請將敏感檔案放在代理可讀取路徑之外，或保留 `tools.fs.workspaceOnly=true` 以使用更嚴格的本機路徑傳送。

    請參閱[圖片](/zh-TW/nodes/images)。

  </Accordion>
</AccordionGroup>

## 安全性和存取控制

<AccordionGroup>
  <Accordion title="將 OpenClaw 暴露給傳入私訊安全嗎？">
    將傳入私訊視為不受信任的輸入。預設值旨在降低風險：

    - 支援私訊的頻道預設行為是**配對**：
      - 未知傳送者會收到配對代碼；機器人不會處理他們的訊息。
      - 使用以下命令核准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 待處理要求上限為**每個頻道 3 個**；如果沒有收到代碼，請檢查 `openclaw pairing list --channel <channel> [--account <id>]`。
    - 公開開放私訊需要明確選擇加入（`dmPolicy: "open"` 和允許清單 `"*"`）。

    執行 `openclaw doctor` 以顯示有風險的私訊政策。

  </Accordion>

  <Accordion title="提示注入只需要擔心公開機器人嗎？">
    不是。提示注入關乎**不受信任的內容**，不只是誰可以私訊機器人。
    如果你的助理讀取外部內容（網頁搜尋/擷取、瀏覽器頁面、電子郵件、
    文件、附件、貼上的日誌），該內容可能包含試圖
    劫持模型的指示。即使**你是唯一傳送者**，這也可能發生。

    最大的風險出現在啟用工具時：模型可能被誘導
    外洩內容或代表你呼叫工具。透過以下方式降低影響範圍：

    - 使用唯讀或停用工具的「讀取器」代理來摘要不受信任的內容
    - 對啟用工具的代理關閉 `web_search` / `web_fetch` / `browser`
    - 也將已解碼的檔案/文件文字視為不受信任：OpenResponses
      `input_file` 和媒體附件擷取都會將擷取出的文字包在
      明確的外部內容邊界標記中，而不是傳遞原始檔案文字
    - 使用沙盒和嚴格的工具允許清單

    詳細資訊：[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="OpenClaw 使用 TypeScript/節點 而不是 Rust/WASM，是否比較不安全？">
    語言和執行階段很重要，但它們不是個人
    代理的主要風險。OpenClaw 的實際風險是閘道暴露、誰可以向
    機器人傳訊、提示注入、工具範圍、憑證處理、瀏覽器存取、exec
    存取，以及第三方 skill 或外掛信任。

    Rust 和 WASM 可以為某些程式碼類別提供更強的隔離，但
    它們無法解決提示注入、不良允許清單、公開閘道暴露、
    過寬工具，或已登入敏感帳戶的瀏覽器設定檔。
    請將這些視為主要控制項：

    - 保持閘道私有或經過驗證
    - 對私訊和群組使用配對與允許清單
    - 對不受信任的輸入拒絕或沙盒化高風險工具
    - 只安裝受信任的外掛和 skills
    - 設定變更後執行 `openclaw security audit --deep`

    詳細資訊：[安全性](/zh-TW/gateway/security)、[沙盒化](/zh-TW/gateway/sandboxing)。

  </Accordion>

  <Accordion title="我看到關於 OpenClaw 執行個體暴露的報告。我該檢查什麼？">
    先檢查你的實際部署：

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    較安全的基準是：

    - 閘道繫結到 `loopback`，或只透過經驗證的私有
      存取暴露，例如 tailnet、SSH 通道、權杖/密碼驗證，或正確
      設定的受信任代理
    - 私訊處於 `pairing` 或 `allowlist` 模式
    - 群組列入允許清單，且除非每位成員都受信任，否則需提及才觸發
    - 對讀取不受信任內容的代理，拒絕或嚴格
      限定高風險工具（`exec`、`browser`、`gateway`、`cron`）
    - 在工具執行需要較小影響範圍時啟用沙盒化

    沒有驗證的公開繫結、開放私訊/群組並搭配工具，以及暴露的瀏覽器
    控制，是優先要修正的發現。詳細資訊：
    [安全性稽核檢查清單](/zh-TW/gateway/security#security-audit-checklist)。

  </Accordion>

  <Accordion title="ClawHub skills 和第三方外掛安裝起來安全嗎？">
    將第三方 skills 和外掛視為你選擇信任的程式碼。
    ClawHub skill 頁面會在安裝前顯示掃描狀態，但掃描並不是
    完整的安全邊界。OpenClaw 不會在外掛或 skill 安裝/更新流程中
    執行內建本機危險程式碼阻擋；請使用
    操作者擁有的 `security.installPolicy` 進行本機允許/封鎖決策。

    較安全的模式：

    - 優先選擇受信任的作者和釘選版本
    - 啟用 skill 或外掛前先閱讀它
    - 保持外掛和 skill 允許清單狹窄
    - 在工具最少的沙盒中執行不受信任輸入工作流程
    - 避免讓第三方程式碼取得廣泛的檔案系統、exec、瀏覽器或秘密存取

    Details：[Skills](/zh-TW/tools/skills)、[外掛](/zh-TW/tools/plugin)、
    [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我的機器人應該有自己的電子郵件、GitHub 帳號或電話號碼嗎？">
    對大多數設定來說，是的。使用獨立帳號和電話號碼來隔離機器人，
    可在發生問題時降低影響範圍。這也能讓你更容易輪替
    憑證或撤銷存取權，而不影響你的個人帳號。

    從小範圍開始。只授予你實際需要的工具和帳號存取權，之後如有需要再擴充。

    文件：[安全性](/zh-TW/gateway/security)、[配對](/zh-TW/channels/pairing)。

  </Accordion>

  <Accordion title="我可以讓它自主處理我的簡訊嗎？這樣安全嗎？">
    我們**不**建議讓它完全自主處理你的個人訊息。最安全的模式是：

    - 將私訊保留在**配對模式**或嚴格的允許清單中。
    - 如果你希望它代表你傳訊息，請使用**獨立號碼或帳號**。
    - 讓它先起草，然後**在送出前核准**。

    如果你想實驗，請在專用帳號上進行並保持隔離。請參閱
    [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="我可以使用較便宜的模型來處理個人助理任務嗎？">
    可以，**如果**代理程式僅用於聊天且輸入可信。較小階層的模型
    更容易受到指令劫持影響，因此請避免將它們用於啟用工具的代理程式，
    或用於讀取不受信任內容的情境。如果你必須使用較小模型，請鎖定
    工具並在沙盒中執行。請參閱 [安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="我在 Telegram 中執行了 /start，但沒有收到配對碼">
    只有當未知傳送者傳訊息給機器人且
    已啟用 `dmPolicy: "pairing"` 時，才會傳送配對碼。`/start` 本身不會產生代碼。

    檢查待處理請求：

    ```bash
    openclaw pairing list telegram
    ```

    如果你想立即存取，請將你的傳送者 ID 加入允許清單，或為該帳號設定 `dmPolicy: "open"`。

  </Accordion>

  <Accordion title="WhatsApp：它會傳訊息給我的聯絡人嗎？配對如何運作？">
    不會。預設的 WhatsApp 私訊政策是**配對**。未知傳送者只會收到配對碼，而其訊息**不會被處理**。OpenClaw 只會回覆它收到的聊天，或回覆你明確觸發的傳送。

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

## 聊天命令、中止任務，以及「它不會停止」

<AccordionGroup>
  <Accordion title="如何阻止內部系統訊息顯示在聊天中？">
    大多數內部或工具訊息只會在該工作階段啟用**詳細**、**追蹤**或**推理**
    時出現。

    在你看到它的聊天中修正：

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    如果仍然很吵，請檢查 Control UI 中的工作階段設定，並將詳細
    設為**繼承**。也請確認你沒有使用在設定中將 `verboseDefault` 設為
    `on` 的機器人設定檔。

    文件：[思考與詳細輸出](/zh-TW/tools/thinking)、[安全性](/zh-TW/gateway/security/index#reasoning-and-verbose-output-in-groups)。

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

    這些是中止觸發詞（不是斜線命令）。

    對於背景程序（來自 exec 工具），你可以要求代理程式執行：

    ```
    process action:kill sessionId:XXX
    ```

    斜線命令概覽：請參閱 [斜線命令](/zh-TW/tools/slash-commands)。

    大多數命令必須以**獨立**訊息傳送，並以 `/` 開頭，但少數捷徑（例如 `/status`）也可讓允許清單中的傳送者在行內使用。

  </Accordion>

  <Accordion title='如何從 Telegram 傳送 Discord 訊息？（「跨情境訊息遭拒」）'>
    OpenClaw 預設會封鎖**跨提供者**訊息。如果工具呼叫繫結至
    Telegram，除非你明確允許，否則它不會傳送到 Discord。

    為代理程式啟用跨提供者訊息：

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

  <Accordion title='為什麼感覺機器人「忽略」快速連發的訊息？'>
    預設情況下，執行中的提示會被導向作用中的執行。使用 `/queue` 選擇作用中執行的行為：

    - `steer` - 在下一個模型邊界引導作用中的執行
    - `followup` - 將訊息排入佇列，並在目前執行結束後逐一執行
    - `collect` - 將相容訊息排入佇列，並在目前執行結束後一次回覆
    - `interrupt` - 中止目前執行並重新開始

    預設模式是 `steer`。你可以為排入佇列的模式新增像 `debounce:0.5s cap:25 drop:summarize` 這類選項。請參閱 [命令佇列](/zh-TW/concepts/queue) 和 [導向佇列](/zh-TW/concepts/queue-steering)。

  </Accordion>
</AccordionGroup>

## 其他

<AccordionGroup>
  <Accordion title='使用 API 金鑰時 Anthropic 的預設模型是什麼？'>
    在 OpenClaw 中，憑證與模型選擇是分開的。設定 `ANTHROPIC_API_KEY`（或在驗證設定檔中儲存 Anthropic API 金鑰）會啟用驗證，但實際的預設模型是你在 `agents.defaults.model.primary` 中設定的任何模型（例如 `anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，表示閘道找不到正在執行的代理程式在預期的 `auth-profiles.json` 中所需的 Anthropic 憑證。
  </Accordion>
</AccordionGroup>

---

仍然卡住了？請在 [Discord](https://discord.com/invite/clawd) 詢問，或開啟 [GitHub 討論](https://github.com/openclaw/openclaw/discussions)。

## 相關內容

- [首次執行 FAQ](/zh-TW/help/faq-first-run) — 安裝、上線引導、驗證、訂閱、早期失敗
- [模型 FAQ](/zh-TW/help/faq-models) — 模型選擇、容錯移轉、驗證設定檔
- [疑難排解](/zh-TW/help/troubleshooting) — 以症狀為先的分流處理
