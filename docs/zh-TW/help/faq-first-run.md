---
read_when:
    - 全新安裝、入門設定卡住，或首次執行錯誤
    - 選擇身分驗證與提供者訂閱
    - 無法存取 docs.openclaw.ai、無法開啟儀表板、安裝卡住
sidebarTitle: First-run FAQ
summary: 常見問題：快速入門與首次執行設定 — 安裝、上手導引、驗證、訂閱、初始失敗
title: 常見問題：首次執行設定
x-i18n:
    generated_at: "2026-05-02T02:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  快速開始與首次執行問答。如需日常操作、模型、驗證、工作階段和疑難排解，請參閱主要 [常見問題](/zh-TW/help/faq)。

  ## 快速開始與首次執行設定

  <AccordionGroup>
  <Accordion title="我卡住了，最快脫困方式">
    使用能夠**查看你的機器**的本機 AI agent。這比在 Discord 詢問有效得多，因為大多數「我卡住了」的情況都是**本機設定或環境問題**，遠端協助者無法檢查。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    這些工具可以讀取 repo、執行命令、檢查日誌，並協助修正你的機器層級設定（PATH、服務、權限、驗證檔案）。透過可修改（git）安裝方式，將**完整原始碼 checkout** 提供給它們：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    這會**從 git checkout** 安裝 OpenClaw，因此 agent 可以讀取程式碼與文件，並根據你正在執行的確切版本進行推理。之後你隨時可以不加 `--install-method git` 重新執行安裝程式，切回穩定版。

    提示：請 agent **規劃並監督**修正流程（逐步進行），然後只執行必要命令。這能讓變更保持小而且更容易稽核。

    如果你發現真正的 bug 或修正，請提交 GitHub issue 或發送 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    從這些命令開始（尋求協助時請分享輸出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它們的作用：

    - `openclaw status`：Gateway/agent 健康狀態與基本設定的快速快照。
    - `openclaw models status`：檢查提供者驗證與模型可用性。
    - `openclaw doctor`：驗證並修正常見設定/狀態問題。

    其他有用的 CLI 檢查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速除錯循環：[如果有東西壞掉，前 60 秒該做什麼](#first-60-seconds-if-something-is-broken)。
    安裝文件：[安裝](/zh-TW/install)、[安裝程式旗標](/zh-TW/install/installer)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直略過。略過原因代表什麼？">
    常見 Heartbeat 略過原因：

    - `quiet-hours`：位於已設定的作用時段視窗之外
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白/只有標頭的骨架
    - `no-tasks-due`：`HEARTBEAT.md` 任務模式已啟用，但尚未有任何任務間隔到期
    - `alerts-disabled`：所有 Heartbeat 可見性都已停用（`showOk`、`showAlerts` 和 `useIndicator` 全部關閉）

    在任務模式中，到期時間戳只會在真正的 Heartbeat 執行完成後才往前推進。被略過的執行不會將任務標記為已完成。

    文件：[Heartbeat](/zh-TW/gateway/heartbeat)、[自動化與任務](/zh-TW/automation)。

  </Accordion>

  <Accordion title="建議的 OpenClaw 安裝與設定方式">
    repo 建議從原始碼執行並使用 onboarding：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    精靈也可以自動建置 UI 資產。onboarding 後，你通常會在連接埠 **18789** 上執行 Gateway。

    從原始碼（貢獻者/開發）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    如果你還沒有全域安裝，請透過 `pnpm openclaw onboard` 執行。

  </Accordion>

  <Accordion title="onboarding 後要如何開啟儀表板？">
    精靈會在 onboarding 後立即用乾淨（非 token 化）的儀表板 URL 開啟你的瀏覽器，並且也會在摘要中印出連結。保留該分頁開啟；如果沒有啟動，請在同一台機器上複製/貼上印出的 URL。
  </Accordion>

  <Accordion title="localhost 與遠端的儀表板該如何驗證？">
    **Localhost（同一台機器）：**

    - 開啟 `http://127.0.0.1:18789/`。
    - 如果它要求 shared-secret 驗證，請將已設定的 token 或密碼貼到 Control UI 設定中。
    - Token 來源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密碼來源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未設定 shared secret，請用 `openclaw doctor --generate-gateway-token` 產生 token。

    **不在 localhost 上：**

    - **Tailscale Serve**（建議）：保持繫結到 loopback，執行 `openclaw gateway --tailscale serve`，開啟 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 是 `true`，身分標頭會滿足 Control UI/WebSocket 驗證（不需貼上 shared secret，假設 Gateway 主機可信）；HTTP API 仍需要 shared-secret 驗證，除非你刻意使用 private-ingress `none` 或 trusted-proxy HTTP 驗證。
      來自同一用戶端的錯誤並行 Serve 驗證嘗試，會在 failed-auth 限制器記錄之前被序列化，因此第二次錯誤重試可能已經顯示 `retry later`。
    - **Tailnet 繫結**：執行 `openclaw gateway --bind tailnet --token "<token>"`（或設定密碼驗證），開啟 `http://<tailscale-ip>:18789/`，然後在儀表板設定中貼上相符的 shared secret。
    - **具身分感知的反向代理**：將 Gateway 保持在可信代理後方，設定 `gateway.auth.mode: "trusted-proxy"`，然後開啟代理 URL。同主機 loopback 代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
    - **SSH tunnel**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。shared-secret 驗證仍會套用於 tunnel；若出現提示，請貼上已設定的 token 或密碼。

    請參閱[儀表板](/zh-TW/web/dashboard)與 [Web 介面](/zh-TW/web)，了解繫結模式與驗證細節。

  </Accordion>

  <Accordion title="為什麼聊天核准有兩個 exec approval 設定？">
    它們控制不同層：

    - `approvals.exec`：將核准提示轉送到聊天目的地
    - `channels.<channel>.execApprovals`：讓該頻道充當 exec approvals 的原生核准用戶端

    主機 exec 政策仍然是真正的核准閘門。聊天設定只控制核准提示出現的位置，以及人們如何回覆它們。

    在大多數設定中，你**不**需要兩者：

    - 如果聊天已支援命令與回覆，同一聊天中的 `/approve` 會透過共用路徑運作。
    - 如果支援的原生頻道可以安全推斷核准者，當 `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"` 時，OpenClaw 現在會自動啟用以 DM 優先的原生核准。
    - 當原生核准卡片/按鈕可用時，該原生 UI 是主要路徑；agent 只有在工具結果表示聊天核准不可用，或手動核准是唯一路徑時，才應包含手動 `/approve` 命令。
    - 只有在提示也必須轉送到其他聊天或明確的 ops 房間時，才使用 `approvals.exec`。
    - 只有在你明確想把核准提示發回原始房間/主題時，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - Plugin 核准又是另一套：預設使用同一聊天的 `/approve`、可選的 `approvals.plugin` 轉送，而且只有部分原生頻道會在此之上保留 plugin-approval-native 處理。

    簡短版：轉送用於路由，原生用戶端設定用於更豐富的頻道特定 UX。
    請參閱 [Exec Approvals](/zh-TW/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什麼 runtime？">
    需要 Node **>= 22**。建議使用 `pnpm`。Gateway **不建議**使用 Bun。
  </Accordion>

  <Accordion title="它可以在 Raspberry Pi 上執行嗎？">
    可以。Gateway 很輕量，文件列出 **512MB-1GB RAM**、**1 core**，以及約 **500MB** 磁碟就足以供個人使用，並指出 **Raspberry Pi 4 可以執行它**。

    如果你想要額外餘裕（日誌、媒體、其他服務），**建議 2GB**，但這不是硬性最低需求。

    提示：小型 Pi/VPS 可以託管 Gateway，你也可以在筆電/手機上配對 **nodes**，用於本機螢幕/相機/canvas 或命令執行。請參閱 [Nodes](/zh-TW/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安裝有什麼提示嗎？">
    簡短版：可以運作，但請預期會有一些粗糙之處。

    - 使用 **64-bit** 作業系統，並保持 Node >= 22。
    - 偏好**可修改（git）安裝**，這樣你可以查看日誌並快速更新。
    - 一開始不要啟用 channels/skills，之後再逐一加入。
    - 如果遇到奇怪的 binary 問題，通常是 **ARM 相容性**問題。

    文件：[Linux](/zh-TW/platforms/linux)、[安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="卡在 wake up my friend / onboarding 不會 hatch。現在怎麼辦？">
    該畫面取決於 Gateway 是否可連線並已驗證。TUI 也會在第一次 hatch 時自動送出
    "Wake up, my friend!"。如果你看到那行但**沒有回覆**，且 token 維持在 0，表示 agent 從未執行。

    1. 重新啟動 Gateway：

    ```bash
    openclaw gateway restart
    ```

    2. 檢查狀態與驗證：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然卡住，執行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 是遠端的，請確認 tunnel/Tailscale 連線已啟動，且 UI 指向正確的 Gateway。請參閱[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="我可以將設定遷移到新機器（Mac mini），而不用重做 onboarding 嗎？">
    可以。複製**狀態目錄**和**工作區**，然後執行一次 Doctor。只要你複製**兩個**位置，這會讓你的 bot 保持「完全相同」（記憶、工作階段歷史、驗證與頻道狀態）：

    1. 在新機器上安裝 OpenClaw。
    2. 從舊機器複製 `$OPENCLAW_STATE_DIR`（預設：`~/.openclaw`）。
    3. 複製你的工作區（預設：`~/.openclaw/workspace`）。
    4. 執行 `openclaw doctor` 並重新啟動 Gateway 服務。

    這會保留設定、驗證設定檔、WhatsApp 憑證、工作階段與記憶。如果你在遠端模式中，請記得 Gateway 主機擁有工作階段儲存與工作區。

    **重要：**如果你只將工作區 commit/push 到 GitHub，你備份的是**記憶 + bootstrap 檔案**，但**不是**工作階段歷史或驗證。那些位於 `~/.openclaw/` 底下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相關：[遷移](/zh-TW/install/migrating)、[磁碟上的項目位置](#where-things-live-on-disk)、
    [Agent 工作區](/zh-TW/concepts/agent-workspace)、[Doctor](/zh-TW/gateway/doctor)、
    [遠端模式](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="哪裡可以查看最新版本的新內容？">
    查看 GitHub changelog：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新項目在最上方。如果最上方區段標示為 **Unreleased**，下一個有日期的區段就是最新已發布版本。項目會依 **重點**、**變更**和**修正**分組（需要時也會加上文件/其他區段）。

  </Accordion>

  <Accordion title="無法存取 docs.openclaw.ai（SSL 錯誤）">
    某些 Comcast/Xfinity 連線會因 Xfinity Advanced Security 而錯誤封鎖 `docs.openclaw.ai`。請停用它或將 `docs.openclaw.ai` 加入允許清單，然後重試。
    請在這裡回報，協助我們解除封鎖：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍無法連上網站，文件也鏡像在 GitHub：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 和 beta 之間的差異">
    **Stable** 和 **beta** 是 **npm dist-tags**，不是不同的程式碼線：

    - `latest` = stable
    - `beta` = 早期測試建置

    通常 stable 版本會先發布到 **beta**，然後透過明確的
    晉升步驟將同一個版本移到 `latest`。維護者也可以在需要時
    直接發布到 `latest`。這就是為什麼晉升後 beta 和 stable 可能會
    指向**同一個版本**。

    查看變更內容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    如需安裝單行指令，以及 beta 與 dev 的差異，請參閱下方的摺疊區塊。

  </Accordion>

  <Accordion title="我要如何安裝 beta 版本，以及 beta 和 dev 有什麼差異？">
    **Beta** 是 npm dist-tag `beta`（晉升後可能與 `latest` 相同）。
    **Dev** 是 `main` 的移動中最新狀態（git）；發布時會使用 npm dist-tag `dev`。

    單行指令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安裝程式（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多細節：[開發通道](/zh-TW/install/development-channels) 和 [安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="我要如何試用最新內容？">
    兩個選項：

    1. **Dev 通道（git checkout）：**

    ```bash
    openclaw update --channel dev
    ```

    這會切換到 `main` 分支，並從原始碼更新。

    2. **可修改安裝（來自安裝程式網站）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    這會提供一個你可以編輯的本機 repo，之後可透過 git 更新。

    如果你偏好手動建立乾淨的 clone，請使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文件：[更新](/zh-TW/cli/update)、[開發通道](/zh-TW/install/development-channels)、
    [安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="安裝與 onboarding 通常需要多久？">
    粗略指南：

    - **安裝：** 2-5 分鐘
    - **Onboarding：** 5-15 分鐘，取決於你設定多少通道/模型

    如果卡住，請使用 [安裝程式卡住](#quick-start-and-first-run-setup)
    以及 [我卡住了](#quick-start-and-first-run-setup) 中的快速除錯循環。

  </Accordion>

  <Accordion title="安裝程式卡住？我要如何取得更多回饋？">
    使用**詳細輸出**重新執行安裝程式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    使用詳細輸出的 beta 安裝：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    若要可修改（git）安裝：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）等效做法：

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    更多選項：[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="Windows 安裝顯示找不到 git 或無法辨識 openclaw">
    兩個常見的 Windows 問題：

    **1) npm error spawn git / 找不到 git**

    - 安裝 **Git for Windows**，並確保 `git` 位於你的 PATH。
    - 關閉並重新開啟 PowerShell，然後重新執行安裝程式。

    **2) 安裝後無法辨識 openclaw**

    - 你的 npm 全域 bin 資料夾不在 PATH 中。
    - 檢查路徑：

      ```powershell
      npm config get prefix
      ```

    - 將該目錄新增到你的使用者 PATH（Windows 不需要 `\bin` 後綴；在大多數系統上是 `%AppData%\npm`）。
    - 更新 PATH 後關閉並重新開啟 PowerShell。

    如果你想要最順暢的 Windows 設定，請使用 **WSL2**，而不是原生 Windows。
    文件：[Windows](/zh-TW/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 輸出顯示亂碼中文文字，我該怎麼辦？">
    這通常是原生 Windows shell 上的主控台字碼頁不相符。

    症狀：

    - `system.run`/`exec` 輸出將中文顯示為亂碼
    - 同一個命令在另一個終端機設定檔中看起來正常

    PowerShell 中的快速變通方法：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    然後重新啟動 Gateway 並重試你的命令：

    ```powershell
    openclaw gateway restart
    ```

    如果你仍可在最新版 OpenClaw 上重現此問題，請在以下位置追蹤/回報：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文件沒有回答我的問題，我要如何取得更好的答案？">
    使用**可修改（git）安裝**，這樣你就會在本機擁有完整原始碼與文件，然後
    從該資料夾詢問你的 bot（或 Claude/Codex），讓它能讀取 repo 並精準回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多細節：[安裝](/zh-TW/install) 和 [安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="我要如何在 Linux 上安裝 OpenClaw？">
    簡短回答：依照 Linux 指南操作，然後執行 onboarding。

    - Linux 快速路徑 + 服務安裝：[Linux](/zh-TW/platforms/linux)。
    - 完整逐步說明：[開始使用](/zh-TW/start/getting-started)。
    - 安裝程式 + 更新：[安裝與更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="我要如何在 VPS 上安裝 OpenClaw？">
    任何 Linux VPS 都可以。在伺服器上安裝，然後使用 SSH/Tailscale 連到 Gateway。

    指南：[exe.dev](/zh-TW/install/exe-dev)、[Hetzner](/zh-TW/install/hetzner)、[Fly.io](/zh-TW/install/fly)。
    遠端存取：[Gateway 遠端](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS 安裝指南在哪裡？">
    我們維護一個**託管中心**，涵蓋常見提供者。選擇一個並依照指南操作：

    - [VPS 託管](/zh-TW/vps)（所有提供者集中於一處）
    - [Fly.io](/zh-TW/install/fly)
    - [Hetzner](/zh-TW/install/hetzner)
    - [exe.dev](/zh-TW/install/exe-dev)

    在雲端的運作方式：**Gateway 在伺服器上執行**，你則透過 Control UI
    （或 Tailscale/SSH）從筆電/手機存取。你的狀態 + workspace
    位於伺服器上，因此請將主機視為真實來源並備份。

    你可以將 **Node**（Mac/iOS/Android/headless）配對到該 cloud Gateway，以存取
    本機螢幕/相機/canvas，或在筆電上執行命令，同時讓
    Gateway 保持在雲端。

    中心：[平台](/zh-TW/platforms)。遠端存取：[Gateway 遠端](/zh-TW/gateway/remote)。
    Node：[Node](/zh-TW/nodes)、[Node CLI](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="我可以請 OpenClaw 自行更新嗎？">
    簡短回答：**可以，但不建議**。更新流程可能會重新啟動
    Gateway（這會中斷作用中的工作階段），可能需要乾淨的 git checkout，並且
    可能提示確認。較安全的做法：由操作員從 shell 執行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必須從 agent 自動化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文件：[更新](/zh-TW/cli/update)、[更新 OpenClaw](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="onboarding 實際上會做什麼？">
    `openclaw onboard` 是建議的設定路徑。在**本機模式**中，它會引導你完成：

    - **模型/驗證設定**（提供者 OAuth、API keys、Anthropic setup-token，以及 LM Studio 等本機模型選項）
    - **Workspace** 位置 + bootstrap 檔案
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **通道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等隨附通道 Plugin）
    - **Daemon 安裝**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 使用者單元）
    - **健康檢查**和 **Skills** 選擇

    如果你設定的模型未知或缺少驗證，它也會警告。

  </Accordion>

  <Accordion title="我需要 Claude 或 OpenAI 訂閱才能執行這個嗎？">
    不需要。你可以使用 **API keys**（Anthropic/OpenAI/其他）或
    **僅本機模型**來執行 OpenClaw，讓你的資料留在裝置上。訂閱（Claude
    Pro/Max 或 OpenAI Codex）是驗證這些提供者的選用方式。

    對於 OpenClaw 中的 Anthropic，實務上的區分是：

    - **Anthropic API key**：一般 Anthropic API 計費
    - **OpenClaw 中的 Claude CLI / Claude 訂閱驗證**：Anthropic 員工
      告訴我們此用法已再次允許，OpenClaw 會將 `claude -p`
      用法視為此整合的受允許用法，除非 Anthropic 發布新的
      政策

    對於長期執行的 gateway 主機，Anthropic API keys 仍是較
    可預測的設定。OpenAI Codex OAuth 明確支援 OpenClaw 這類外部
    工具。

    OpenClaw 也支援其他託管式訂閱選項，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文件：[Anthropic](/zh-TW/providers/anthropic)、[OpenAI](/zh-TW/providers/openai)、
    [Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax)、[GLM Models](/zh-TW/providers/glm)、
    [本機模型](/zh-TW/gateway/local-models)、[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="我可以不使用 API key 而使用 Claude Max 訂閱嗎？">
    可以。

    Anthropic 員工告訴我們 OpenClaw 風格的 Claude CLI 用法已再次允許，因此
    OpenClaw 會將 Claude 訂閱驗證和 `claude -p` 用法視為
    此整合的受允許用法，除非 Anthropic 發布新的政策。如果你想要
    最可預測的伺服器端設定，請改用 Anthropic API key。

  </Accordion>

  <Accordion title="你們支援 Claude 訂閱驗證（Claude Pro 或 Max）嗎？">
    支援。

    Anthropic 員工告訴我們此用法已再次允許，因此 OpenClaw 會將
    Claude CLI 重用和 `claude -p` 用法視為此整合的受允許用法，
    除非 Anthropic 發布新的政策。

    Anthropic setup-token 仍可作為受支援的 OpenClaw token 路徑，但 OpenClaw 現在偏好在可用時重用 Claude CLI 和 `claude -p`。
    對於 production 或多使用者工作負載，Anthropic API key 驗證仍是
    更安全且更可預測的選擇。如果你想在 OpenClaw 中使用其他訂閱式託管
    選項，請參閱 [OpenAI](/zh-TW/providers/openai)、[Qwen / Model
    Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax) 和 [GLM
    Models](/zh-TW/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="為什麼我看到來自 Anthropic 的 HTTP 429 rate_limit_error？">
    這表示你目前時段的 **Anthropic 配額/速率限制**已用盡。如果你
    使用 **Claude CLI**，請等待時段重設或升級你的方案。如果你
    使用 **Anthropic API key**，請在 Anthropic Console
    檢查使用量/帳單，並視需要提高限制。

    如果訊息明確為：
    `Extra usage is required for long context requests`，表示請求正嘗試使用
    Anthropic 的 1M context beta（`context1m: true`）。這只會在你的
    credential 符合長 context 計費資格時可用（API key 計費，或
    啟用 Extra Usage 的 OpenClaw Claude-login 路徑）。

    提示：設定一個**備援模型**，讓 OpenClaw 在供應商受到速率限制時仍能持續回覆。
    請參閱 [模型](/zh-TW/cli/models)、[OAuth](/zh-TW/concepts/oauth)，以及
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-TW/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="是否支援 AWS Bedrock？">
    是。OpenClaw 內建 **Amazon Bedrock (Converse)** 供應商。當 AWS 環境標記存在時，OpenClaw 可以自動探索 Bedrock 的串流/文字目錄，並將其合併為隱含的 `amazon-bedrock` 供應商；否則你可以明確啟用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或加入手動供應商項目。請參閱 [Amazon Bedrock](/zh-TW/providers/bedrock) 和 [模型供應商](/zh-TW/providers/models)。如果你偏好託管金鑰流程，在 Bedrock 前方使用 OpenAI 相容代理仍然是有效選項。
  </Accordion>

  <Accordion title="Codex 驗證如何運作？">
    OpenClaw 支援透過 OAuth（ChatGPT 登入）使用 **OpenAI Code (Codex)**。常見設定請使用
    `openai/gpt-5.5` 搭配 `agentRuntime.id: "codex"`：
    ChatGPT/Codex 訂閱驗證，加上原生 Codex 應用程式伺服器執行。只有在你想透過預設
    PI 執行器使用 Codex OAuth 時，才使用 `openai-codex/gpt-5.5`。若要
    直接使用 OpenAI API 金鑰存取，請使用不含 Codex 執行階段覆寫的 `openai/gpt-5.5`。
    請參閱 [模型供應商](/zh-TW/concepts/model-providers) 和 [入門設定（CLI）](/zh-TW/start/wizard)。
  </Accordion>

  <Accordion title="為什麼 OpenClaw 仍提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的供應商與驗證設定檔 ID。
    它也是 Codex OAuth 的明確 PI 模型前綴：

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = 使用原生 Codex 執行階段的 ChatGPT/Codex 訂閱驗證
    - `openai-codex/gpt-5.5` = PI 中的 Codex OAuth 路徑
    - `openai/gpt-5.5` 不含 Codex 執行階段覆寫 = PI 中的直接 OpenAI API 金鑰路徑
    - `openai-codex:...` = 驗證設定檔 ID，不是模型參照

    如果你想使用直接 OpenAI Platform 帳務/限制路徑，請設定
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 訂閱驗證，請用
    `openclaw models auth login --provider openai-codex` 登入。若要使用原生 Codex
    執行階段，請保留模型參照為 `openai/gpt-5.5`，並設定
    `agentRuntime.id: "codex"`。只有在 PI
    執行時才使用 `openai-codex/*` 模型參照。

  </Accordion>

  <Accordion title="為什麼 Codex OAuth 限制可能和 ChatGPT 網頁版不同？">
    Codex OAuth 使用 OpenAI 管理、依方案而定的配額時段。實務上，
    這些限制可能和 ChatGPT 網站/應用程式體驗不同，即使
    兩者綁定同一個帳號。

    OpenClaw 可以在
    `openclaw models status` 中顯示目前可見的供應商使用量/配額時段，但它不會憑空建立或將 ChatGPT 網頁版
    權益正規化為直接 API 存取。如果你想使用直接 OpenAI Platform
    帳務/限制路徑，請搭配 API 金鑰使用 `openai/*`。

  </Accordion>

  <Accordion title="你們支援 OpenAI 訂閱驗證（Codex OAuth）嗎？">
    是。OpenClaw 完整支援 **OpenAI Code (Codex) 訂閱 OAuth**。
    OpenAI 明確允許在 OpenClaw 這類外部工具/工作流程中使用訂閱 OAuth。
    入門設定可以替你執行 OAuth 流程。

    請參閱 [OAuth](/zh-TW/concepts/oauth)、[模型供應商](/zh-TW/concepts/model-providers)，以及 [入門設定（CLI）](/zh-TW/start/wizard)。

  </Accordion>

  <Accordion title="如何設定 Gemini CLI OAuth？">
    Gemini CLI 使用 **Plugin 驗證流程**，不是 `openclaw.json` 中的用戶端 ID 或密鑰。

    步驟：

    1. 在本機安裝 Gemini CLI，讓 `gemini` 位於 `PATH`
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 啟用 Plugin：`openclaw plugins enable google`
    3. 登入：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登入後的預設模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果請求失敗，請在 Gateway 主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    這會將 OAuth 權杖儲存在 Gateway 主機上的驗證設定檔中。詳細資訊：[模型供應商](/zh-TW/concepts/model-providers)。

  </Accordion>

  <Accordion title="本機模型適合一般聊天嗎？">
    通常不適合。OpenClaw 需要大型脈絡 + 強安全性；小型顯卡會截斷並洩漏。如果你非用不可，請在本機（LM Studio）執行你能使用的**最大**模型建置，並參閱 [/gateway/local-models](/zh-TW/gateway/local-models)。較小/量化模型會增加提示注入風險 - 請參閱 [安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="如何將託管模型流量維持在特定區域？">
    選擇鎖定區域的端點。OpenRouter 為 MiniMax、Kimi 和 GLM 提供美國託管選項；選擇美國託管變體即可讓資料留在區域內。你仍可使用 `models.mode: "merge"` 同時列出 Anthropic/OpenAI，讓備援在可用時仍尊重你選取的區域供應商。
  </Accordion>

  <Accordion title="我一定要買 Mac Mini 才能安裝這個嗎？">
    不需要。OpenClaw 可在 macOS 或 Linux 上執行（Windows 透過 WSL2）。Mac mini 是選配 - 有些人
    會買一台作為永遠開機的主機，但小型 VPS、家用伺服器，或 Raspberry Pi 等級的機器也可以。

    你只有在使用 **macOS 專屬工具**時才需要 Mac。對於 iMessage，請使用 [BlueBubbles](/zh-TW/channels/bluebubbles)（建議）- BlueBubbles 伺服器可在任何 Mac 上執行，而 Gateway 可在 Linux 或其他地方執行。如果你想使用其他 macOS 專屬工具，請在 Mac 上執行 Gateway，或配對 macOS 節點。

    文件：[BlueBubbles](/zh-TW/channels/bluebubbles)、[節點](/zh-TW/nodes)、[Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我需要 Mac mini 才能支援 iMessage 嗎？">
    你需要**某台 macOS 裝置**登入 Messages。不一定要是 Mac mini -
    任何 Mac 都可以。**使用 [BlueBubbles](/zh-TW/channels/bluebubbles)**（建議）來支援 iMessage - BlueBubbles 伺服器在 macOS 上執行，而 Gateway 可在 Linux 或其他地方執行。

    常見設定：

    - 在 Linux/VPS 上執行 Gateway，並在任何已登入 Messages 的 Mac 上執行 BlueBubbles 伺服器。
    - 如果你想要最簡單的單機設定，全部都在 Mac 上執行。

    文件：[BlueBubbles](/zh-TW/channels/bluebubbles)、[節點](/zh-TW/nodes)、
    [Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我買 Mac mini 來執行 OpenClaw，可以把它連到我的 MacBook Pro 嗎？">
    可以。**Mac mini 可以執行 Gateway**，而你的 MacBook Pro 可以作為
    **節點**（輔助裝置）連線。節點不執行 Gateway - 它們提供額外
    能力，例如該裝置上的螢幕/相機/畫布和 `system.run`。

    常見模式：

    - Gateway 在 Mac mini 上執行（永遠開機）。
    - MacBook Pro 執行 macOS 應用程式或節點主機，並配對到 Gateway。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看。

    文件：[節點](/zh-TW/nodes)、[節點 CLI](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="我可以使用 Bun 嗎？">
    不建議使用 Bun。我們看到執行階段錯誤，尤其是 WhatsApp 和 Telegram。
    請使用 **Node** 來獲得穩定的 Gateway。

    如果你仍想嘗試 Bun，請在非正式環境的 Gateway 上進行，
    且不要使用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 裡要填什麼？">
    `channels.telegram.allowFrom` 是**真人寄件者的 Telegram 使用者 ID**（數字）。它不是機器人使用者名稱。

    設定流程只會詢問數字使用者 ID。如果你的設定中已有舊版 `@username` 項目，`openclaw doctor --fix` 可以嘗試解析它們。

    較安全（無第三方機器人）：

    - 私訊你的機器人，然後執行 `openclaw logs --follow` 並讀取 `from.id`。

    官方 Bot API：

    - 私訊你的機器人，然後呼叫 `https://api.telegram.org/bot<bot_token>/getUpdates` 並讀取 `message.from.id`。

    第三方（較不私密）：

    - 私訊 `@userinfobot` 或 `@getidsbot`。

    請參閱 [/channels/telegram](/zh-TW/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多個人可以用同一個 WhatsApp 號碼搭配不同 OpenClaw 執行個體嗎？">
    可以，透過**多代理路由**。將每個寄件者的 WhatsApp **私訊**（對等 `kind: "direct"`，寄件者 E.164 例如 `+15551234567`）綁定到不同的 `agentId`，讓每個人都有自己的工作區和工作階段儲存。回覆仍來自**同一個 WhatsApp 帳號**，而私訊存取控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）是每個 WhatsApp 帳號全域共用。請參閱 [多代理路由](/zh-TW/concepts/multi-agent) 和 [WhatsApp](/zh-TW/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以執行一個「快速聊天」代理和一個「用於程式撰寫的 Opus」代理嗎？'>
    可以。使用多代理路由：為每個代理指定自己的預設模型，然後將傳入路由（供應商帳號或特定對等）綁定到各代理。範例設定位於 [多代理路由](/zh-TW/concepts/multi-agent)。另請參閱 [模型](/zh-TW/concepts/models) 和 [設定](/zh-TW/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可以在 Linux 上運作嗎？">
    可以。Homebrew 支援 Linux（Linuxbrew）。快速設定：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你透過 systemd 執行 OpenClaw，請確保服務 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前綴），讓 `brew` 安裝的工具能在非登入 shell 中解析。
    近期建置也會在 Linux systemd 服務上前置常見使用者 bin 目錄（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），並在設定時遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安裝與 npm 安裝之間的差異">
    - **可修改（git）安裝：**完整原始碼 checkout，可編輯，最適合貢獻者。
      你會在本機執行建置，也可以修補程式碼/文件。
    - **npm 安裝：**全域 CLI 安裝，沒有 repo，最適合「只想執行」。
      更新來自 npm dist-tags。

    文件：[開始使用](/zh-TW/start/getting-started)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="之後可以在 npm 和 git 安裝之間切換嗎？">
    可以。當 OpenClaw 已安裝時，使用 `openclaw update --channel ...`。
    這**不會刪除你的資料** - 它只會變更 OpenClaw 程式碼安裝。
    你的狀態（`~/.openclaw`）和工作區（`~/.openclaw/workspace`）都會保持不變。

    從 npm 到 git：

    ```bash
    openclaw update --channel dev
    ```

    從 git 到 npm：

    ```bash
    openclaw update --channel stable
    ```

    加上 `--dry-run` 可先預覽規劃的模式切換。更新器會執行
    Doctor 後續步驟，重新整理目標通道的 Plugin 來源，並
    重新啟動 Gateway，除非你傳入 `--no-restart`。

    安裝程式也可以強制使用任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    備份提示：請參閱 [備份策略](#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我應該在筆電還是 VPS 上執行 Gateway？">
    簡短回答：**如果你想要 24/7 可靠性，請使用 VPS**。如果你想要
    最低阻力，且可以接受睡眠/重新啟動，就在本機執行。

    **筆電（本機 Gateway）**

    - **優點：**無伺服器成本、可直接存取本機檔案、即時瀏覽器視窗。
    - **缺點：**睡眠/網路中斷 = 連線中斷，OS 更新/重新開機會打斷，必須保持喚醒。

    **VPS / 雲端**

    - **優點：** 常時在線、網路穩定、不會有筆電睡眠問題，較容易保持運行。
    - **缺點：** 通常以無頭模式執行（使用螢幕截圖）、只能遠端存取檔案，更新時必須使用 SSH。

    **OpenClaw 特定說明：** WhatsApp/Telegram/Slack/Mattermost/Discord 都可以在 VPS 上正常運作。唯一真正的取捨是 **無頭瀏覽器** 與可見視窗。請參閱 [瀏覽器](/zh-TW/tools/browser)。

    **建議預設值：** 如果你之前遇過 Gateway 中斷連線，請使用 VPS。當你正在主動使用 Mac，並且想要本機檔案存取或搭配可見瀏覽器的 UI 自動化時，本機非常適合。

  </Accordion>

  <Accordion title="在專用機器上執行 OpenClaw 有多重要？">
    不是必需，但**建議這麼做以提高可靠性與隔離性**。

    - **專用主機（VPS/Mac mini/Pi）：** 常時在線、較少睡眠/重新開機中斷、權限更乾淨、較容易保持運行。
    - **共用筆電/桌機：** 用於測試與主動使用完全沒問題，但機器睡眠或更新時可能會暫停。

    如果你想兼顧兩者，請將 Gateway 放在專用主機上，並將筆電配對為一個 **Node**，用於本機螢幕/相機/exec 工具。請參閱 [Nodes](/zh-TW/nodes)。
    如需安全性指引，請閱讀 [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 需求與建議作業系統是什麼？">
    OpenClaw 很輕量。對於基本 Gateway + 一個聊天頻道：

    - **絕對最低需求：** 1 vCPU、1GB RAM、約 500MB 磁碟。
    - **建議：** 1-2 vCPU、2GB RAM 或更多，以保留餘裕（記錄、媒體、多個頻道）。Node 工具與瀏覽器自動化可能會消耗較多資源。

    作業系統：使用 **Ubuntu LTS**（或任何現代 Debian/Ubuntu）。Linux 安裝路徑在該環境下測試最完整。

    文件：[Linux](/zh-TW/platforms/linux)、[VPS 託管](/zh-TW/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中執行 OpenClaw 嗎？需求是什麼？">
    可以。將 VM 視同 VPS：它需要保持常時開機、可連線，並具備足夠
    RAM 供 Gateway 與你啟用的任何頻道使用。

    基準指引：

    - **絕對最低需求：** 1 vCPU、1GB RAM。
    - **建議：** 如果你執行多個頻道、瀏覽器自動化或媒體工具，請使用 2GB RAM 或更多。
    - **作業系統：** Ubuntu LTS 或其他現代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最簡單的 VM 形式設定**，且具有最佳工具
    相容性。請參閱 [Windows](/zh-TW/platforms/windows)、[VPS 託管](/zh-TW/vps)。
    如果你在 VM 中執行 macOS，請參閱 [macOS VM](/zh-TW/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相關

- [FAQ](/zh-TW/help/faq) — 主要 FAQ（模型、工作階段、Gateway、安全性等）
- [安裝概觀](/zh-TW/install)
- [開始使用](/zh-TW/start/getting-started)
- [疑難排解](/zh-TW/help/troubleshooting)
