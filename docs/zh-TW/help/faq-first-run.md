---
read_when:
    - 新安裝、入門流程卡住或首次執行錯誤
    - 選擇驗證與提供者訂閱
    - 無法存取 docs.openclaw.ai，無法開啟儀表板，安裝卡住
sidebarTitle: First-run FAQ
summary: 常見問題：快速入門與首次執行設定 — 安裝、入門設定、驗證、訂閱、初始失敗
title: 常見問題：首次執行設定
x-i18n:
    generated_at: "2026-05-12T00:58:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  快速開始與首次執行問答。日常操作、模型、驗證、工作階段
  和疑難排解，請參閱主要的 [FAQ](/zh-TW/help/faq)。

  ## 快速開始與首次執行設定

  <AccordionGroup>
  <Accordion title="我卡住了，最快脫困方式">
    使用可以**看見你的機器**的本機 AI agent。這比在 Discord
    詢問有效得多，因為多數「我卡住了」的情況都是**本機設定或環境問題**，
    遠端協助者無法檢查。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    這些工具可以讀取 repo、執行命令、檢查日誌，並協助修正機器層級
    設定（PATH、服務、權限、驗證檔案）。請透過
    可修改的（git）安裝方式，把**完整 source checkout** 提供給它們：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    這會**從 git checkout** 安裝 OpenClaw，因此 agent 可以讀取程式碼 + 文件，
    並針對你正在執行的確切版本推理。你之後隨時可以重新執行不帶
    `--install-method git` 的安裝程式，切回穩定版。

    提示：請 agent **規劃並監督**修正（逐步），然後只執行
    必要命令。這能讓變更更小，也更容易稽核。

    如果你發現真正的 bug 或修正，請建立 GitHub issue 或送出 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    先從這些命令開始（求助時請分享輸出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它們的作用：

    - `openclaw status`: Gateway/agent 健康狀態 + 基本設定的快速快照。
    - `openclaw models status`: 檢查 provider 驗證 + 模型可用性。
    - `openclaw doctor`: 驗證並修復常見的設定/狀態問題。

    其他實用的 CLI 檢查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速除錯流程：[如果有東西壞了，前 60 秒該做什麼](/zh-TW/help/faq#first-60-seconds-if-something-is-broken)。
    安裝文件：[安裝](/zh-TW/install)、[安裝程式旗標](/zh-TW/install/installer)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="Heartbeat 一直跳過。跳過原因代表什麼？">
    常見的 Heartbeat 跳過原因：

    - `quiet-hours`: 位於已設定的作用時段之外
    - `empty-heartbeat-file`: `HEARTBEAT.md` 存在，但只包含空白/僅標頭的骨架內容
    - `no-tasks-due`: `HEARTBEAT.md` 任務模式已啟用，但尚未有任何任務間隔到期
    - `alerts-disabled`: 所有 Heartbeat 可見性都已停用（`showOk`、`showAlerts` 和 `useIndicator` 全部關閉）

    在任務模式中，到期時間戳只會在真正的 Heartbeat 執行
    完成後才會前進。被跳過的執行不會將任務標記為已完成。

    文件：[Heartbeat](/zh-TW/gateway/heartbeat)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="建議的 OpenClaw 安裝與設定方式">
    repo 建議從原始碼執行並使用 onboarding：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    精靈也可以自動建置 UI 資產。onboarding 之後，你通常會在連接埠 **18789** 上執行 Gateway。

    從原始碼（貢獻者/dev）：

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

  <Accordion title="onboarding 之後要如何開啟儀表板？">
    精靈會在 onboarding 後立即用乾淨的（非 tokenized）儀表板 URL 開啟瀏覽器，並且也會在摘要中列印連結。請保持該分頁開啟；如果沒有啟動，請在同一台機器上複製/貼上列印出的 URL。
  </Accordion>

  <Accordion title="localhost 與遠端的儀表板要如何驗證？">
    **Localhost（同一台機器）：**

    - 開啟 `http://127.0.0.1:18789/`。
    - 如果它要求 shared-secret 驗證，請將已設定的 token 或 password 貼到 Control UI 設定中。
    - Token 來源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - Password 來源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未設定 shared secret，請用 `openclaw doctor --generate-gateway-token` 產生 token。

    **不在 localhost 上：**

    - **Tailscale Serve**（建議）：保持 bind loopback，執行 `openclaw gateway --tailscale serve`，開啟 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 是 `true`，identity headers 會滿足 Control UI/WebSocket 驗證（無需貼上 shared secret，假設 gateway host 可信）；HTTP API 仍需要 shared-secret 驗證，除非你刻意使用 private-ingress `none` 或 trusted-proxy HTTP auth。
      來自同一 client 的錯誤並行 Serve 驗證嘗試，會在 failed-auth limiter 記錄前被序列化，因此第二次錯誤重試可能已經顯示 `retry later`。
    - **Tailnet bind**：執行 `openclaw gateway --bind tailnet --token "<token>"`（或設定 password auth），開啟 `http://<tailscale-ip>:18789/`，然後在儀表板設定中貼上相符的 shared secret。
    - **具身分感知的 reverse proxy**：將 Gateway 保持在受信任的 proxy 後方，設定 `gateway.auth.mode: "trusted-proxy"`，然後開啟 proxy URL。同主機 loopback proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
    - **SSH tunnel**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。shared-secret 驗證仍會套用於 tunnel；若出現提示，請貼上已設定的 token 或 password。

    請參閱 [儀表板](/zh-TW/web/dashboard) 和 [Web surfaces](/zh-TW/web) 了解 bind 模式與驗證詳細資訊。

  </Accordion>

  <Accordion title="為什麼 chat approvals 有兩個 exec approval 設定？">
    它們控制不同層：

    - `approvals.exec`: 將 approval prompts 轉送到 chat destinations
    - `channels.<channel>.execApprovals`: 讓該 channel 作為 exec approvals 的 native approval client

    host exec policy 仍是真正的 approval gate。Chat 設定只控制 approval
    prompts 顯示在哪裡，以及人們如何回覆。

    多數設定中你**不**需要兩者：

    - 如果 chat 已支援命令與回覆，same-chat `/approve` 會透過共用路徑運作。
    - 如果受支援的 native channel 可以安全推斷 approvers，當 `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"` 時，OpenClaw 現在會自動啟用 DM-first native approvals。
    - 當 native approval cards/buttons 可用時，該 native UI 是主要路徑；agent 只有在工具結果表示 chat approvals 不可用，或手動 approval 是唯一路徑時，才應包含手動 `/approve` 命令。
    - 只有在 prompts 也必須轉送到其他 chats 或明確的 ops rooms 時，才使用 `approvals.exec`。
    - 只有在你明確想把 approval prompts 發回原始 room/topic 時，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - Plugin approvals 又是分開的：它們預設使用 same-chat `/approve`、可選的 `approvals.plugin` 轉送，且只有部分 native channels 會在其上保留 plugin-approval-native 處理。

    簡短版：forwarding 用於路由，native client config 用於更豐富的 channel-specific UX。
    請參閱 [Exec Approvals](/zh-TW/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什麼 runtime？">
    需要 Node **>= 22**。建議使用 `pnpm`。Gateway **不建議**使用 Bun。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上執行嗎？">
    可以。Gateway 很輕量，文件列出的個人使用需求為 **512MB-1GB RAM**、**1 core**，
    以及約 **500MB** 磁碟空間，並註明 **Raspberry Pi 4 可以執行它**。

    如果你想要更多餘裕（日誌、媒體、其他服務），**建議 2GB**，但這
    不是硬性最低需求。

    提示：小型 Pi/VPS 可以託管 Gateway，而你可以在筆電/手機上配對 **nodes**，
    供本機螢幕/相機/canvas 或命令執行使用。請參閱 [Nodes](/zh-TW/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安裝有什麼提示？">
    簡短版：可以運作，但預期會有粗糙邊角。

    - 使用 **64-bit** OS，並保持 Node >= 22。
    - 優先使用**可修改的（git）安裝**，這樣你可以查看日誌並快速更新。
    - 先不要啟用 channels/skills，然後逐一加入。
    - 如果遇到奇怪的二進位問題，通常是 **ARM compatibility** 問題。

    文件：[Linux](/zh-TW/platforms/linux)、[安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="卡在 wake up my friend / onboarding 不會 hatch。現在怎麼辦？">
    該畫面依賴 Gateway 可連線且已驗證。TUI 也會在首次 hatch 時自動傳送
    "Wake up, my friend!"。如果你看到那行但**沒有回覆**，
    且 tokens 維持 0，表示 agent 從未執行。

    1. 重新啟動 Gateway：

    ```bash
    openclaw gateway restart
    ```

    2. 檢查狀態 + 驗證：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 如果仍然卡住，執行：

    ```bash
    openclaw doctor
    ```

    如果 Gateway 是遠端的，請確認 tunnel/Tailscale 連線已啟動，且 UI
    指向正確的 Gateway。請參閱 [遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="我可以把設定遷移到新機器（Mac mini）而不用重新 onboarding 嗎？">
    可以。複製**狀態目錄**和**工作區**，然後執行一次 Doctor。只要你複製**兩個**
    位置，這會讓你的 bot 保持「完全相同」（memory、工作階段歷史、驗證和 channel
    狀態）：

    1. 在新機器上安裝 OpenClaw。
    2. 從舊機器複製 `$OPENCLAW_STATE_DIR`（預設：`~/.openclaw`）。
    3. 複製你的工作區（預設：`~/.openclaw/workspace`）。
    4. 執行 `openclaw doctor` 並重新啟動 Gateway 服務。

    這會保留設定、auth profiles、WhatsApp creds、sessions 和 memory。如果你處於
    遠端模式，請記得 gateway host 擁有 session store 和 workspace。

    **重要：**如果你只把工作區 commit/push 到 GitHub，就是備份了
    **memory + bootstrap files**，但**沒有**備份 session history 或 auth。它們位於
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相關：[遷移](/zh-TW/install/migrating)、[磁碟上的位置](/zh-TW/help/faq#where-things-live-on-disk)、
    [Agent 工作區](/zh-TW/concepts/agent-workspace)、[Doctor](/zh-TW/gateway/doctor)、
    [遠端模式](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="要在哪裡查看最新版的新功能？">
    查看 GitHub changelog：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新項目位於頂部。如果頂端區段標示為 **Unreleased**，下一個有日期的
    區段就是最新已發佈版本。項目會依 **Highlights**、**Changes** 和
    **Fixes** 分組（需要時也會有 docs/其他區段）。

  </Accordion>

  <Accordion title="無法存取 docs.openclaw.ai（SSL 錯誤）">
    部分 Comcast/Xfinity 連線會被 Xfinity Advanced Security 錯誤封鎖
    `docs.openclaw.ai`。請停用它或將 `docs.openclaw.ai` 加入 allowlist，然後重試。
    請在此回報，協助我們解除封鎖：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍無法連上該網站，文件在 GitHub 上有鏡像：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 和 beta 有什麼差異">
    **Stable** 和 **beta** 是 **npm dist-tags**，不是不同的程式碼線：

    - `latest` = 穩定版
    - `beta` = 早期測試建置

    通常，穩定版會先發佈到 **beta**，然後透過明確的
    推廣步驟將同一個版本移到 `latest`。維護者也可以在需要時
    直接發佈到 `latest`。這就是為什麼 beta 和 stable 在推廣後
    可以指向**同一個版本**。

    查看變更內容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    如需安裝單行指令，以及 beta 和 dev 的差異，請參閱下方的手風琴區塊。

  </Accordion>

  <Accordion title="我要如何安裝 beta 版本，beta 和 dev 有什麼差異？">
    **Beta** 是 npm dist-tag `beta`（推廣後可能與 `latest` 相同）。
    **Dev** 是 `main`（git）的移動前端；發佈時會使用 npm dist-tag `dev`。

    單行指令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安裝程式（PowerShell）：
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    更多詳細資訊：[開發通道](/zh-TW/install/development-channels)和[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="我要如何試用最新位元？">
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

    這會給你一個可編輯的本機 repo，之後可透過 git 更新。

    如果你偏好手動乾淨複製，請使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文件：[更新](/zh-TW/cli/update)、[開發通道](/zh-TW/install/development-channels)、
    [安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="安裝和入門設定通常需要多久？">
    粗略指南：

    - **安裝：** 2-5 分鐘
    - **入門設定：** 5-15 分鐘，取決於你設定的通道/模型數量

    如果卡住，請使用[安裝程式卡住](#quick-start-and-first-run-setup)
    以及[我卡住了](#quick-start-and-first-run-setup)中的快速偵錯迴圈。

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

    可修改（git）安裝：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）對應作法：

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

    - 安裝 **Git for Windows**，並確認 `git` 位於你的 PATH。
    - 關閉並重新開啟 PowerShell，然後重新執行安裝程式。

    **2) 安裝後無法辨識 openclaw**

    - 你的 npm 全域 bin 資料夾不在 PATH 上。
    - 檢查路徑：

      ```powershell
      npm config get prefix
      ```

    - 將該目錄加入你的使用者 PATH（Windows 不需要 `\bin` 後綴；在大多數系統上是 `%AppData%\npm`）。
    - 更新 PATH 後，關閉並重新開啟 PowerShell。

    如果你想要最順暢的 Windows 設定，請使用 **WSL2**，而不是原生 Windows。
    文件：[Windows](/zh-TW/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 輸出顯示亂碼中文文字 - 我該怎麼辦？">
    這通常是原生 Windows shell 上的主控台字碼頁不相符。

    症狀：

    - `system.run`/`exec` 輸出將中文呈現為亂碼
    - 同一個命令在另一個終端機設定檔中看起來正常

    PowerShell 中的快速因應方式：

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

    如果你在最新版 OpenClaw 上仍能重現，請在此追蹤/回報：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文件沒有回答我的問題 - 我要如何取得更好的答案？">
    使用**可修改（git）安裝**，讓你在本機擁有完整原始碼和文件，然後
    從該資料夾向你的機器人（或 Claude/Codex）提問，讓它能讀取 repo 並精準回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多詳細資訊：[安裝](/zh-TW/install)和[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="我要如何在 Linux 上安裝 OpenClaw？">
    簡短回答：依照 Linux 指南操作，然後執行入門設定。

    - Linux 快速路徑 + 服務安裝：[Linux](/zh-TW/platforms/linux)。
    - 完整逐步指南：[開始使用](/zh-TW/start/getting-started)。
    - 安裝程式 + 更新：[安裝與更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="我要如何在 VPS 上安裝 OpenClaw？">
    任何 Linux VPS 都可以。安裝在伺服器上，然後使用 SSH/Tailscale 連到 Gateway。

    指南：[exe.dev](/zh-TW/install/exe-dev)、[Hetzner](/zh-TW/install/hetzner)、[Fly.io](/zh-TW/install/fly)。
    遠端存取：[Gateway 遠端](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS 安裝指南在哪裡？">
    我們維護了一個**託管中心**，涵蓋常見供應商。選一個並依照指南操作：

    - [VPS 託管](/zh-TW/vps)（所有供應商集中在一處）
    - [Fly.io](/zh-TW/install/fly)
    - [Hetzner](/zh-TW/install/hetzner)
    - [exe.dev](/zh-TW/install/exe-dev)

    它在雲端的運作方式：**Gateway 在伺服器上執行**，你透過 Control UI（或 Tailscale/SSH）
    從筆電/手機存取它。你的狀態 + 工作區
    會存在伺服器上，因此請將主機視為真實來源並備份。

    你可以將**節點**（Mac/iOS/Android/headless）配對到該雲端 Gateway，以存取
    本機螢幕/相機/canvas，或在筆電上執行命令，同時讓
    Gateway 保持在雲端。

    中心：[平台](/zh-TW/platforms)。遠端存取：[Gateway 遠端](/zh-TW/gateway/remote)。
    節點：[節點](/zh-TW/nodes)、[節點 CLI](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="我可以要求 OpenClaw 更新自己嗎？">
    簡短回答：**可以，但不建議**。更新流程可能重新啟動
    Gateway（這會中斷使用中的工作階段）、可能需要乾淨的 git checkout，且
    可能提示確認。較安全的做法：由操作者從 shell 執行更新。

    使用 CLI：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必須從代理自動化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文件：[更新](/zh-TW/cli/update)、[更新中](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="入門設定實際上會做什麼？">
    `openclaw onboard` 是建議的設定路徑。在**本機模式**中，它會引導你完成：

    - **模型/auth 設定**（供應商 OAuth、API keys、Anthropic setup-token，以及 LM Studio 等本機模型選項）
    - **工作區**位置 + 啟動檔案
    - **Gateway 設定**（bind/port/auth/tailscale）
    - **通道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等內建通道 plugins）
    - **Daemon 安裝**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 使用者單元）
    - **健康檢查**和 **skills** 選擇

    如果你設定的模型未知或缺少 auth，它也會警告。

  </Accordion>

  <Accordion title="我需要 Claude 或 OpenAI 訂閱才能執行這個嗎？">
    不需要。你可以使用 **API keys**（Anthropic/OpenAI/其他）執行 OpenClaw，或使用
    **純本機模型**讓你的資料留在裝置上。訂閱（Claude
    Pro/Max 或 OpenAI Codex）是驗證這些供應商的選用方式。

    對 OpenClaw 中的 Anthropic 而言，實務上的區分是：

    - **Anthropic API key**：一般 Anthropic API 計費
    - **OpenClaw 中的 Claude CLI / Claude 訂閱 auth**：Anthropic 員工
      告訴我們此用法再次被允許，且除非 Anthropic 發佈新政策，OpenClaw 會將 `claude -p`
      用法視為此整合的核准用法

    對長期執行的 gateway 主機而言，Anthropic API keys 仍是更
    可預測的設定。OpenAI Codex OAuth 明確支援 OpenClaw 這類外部
    工具。

    OpenClaw 也支援其他託管訂閱式選項，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文件：[Anthropic](/zh-TW/providers/anthropic)、[OpenAI](/zh-TW/providers/openai)、
    [Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax)、[GLM Models](/zh-TW/providers/glm)、
    [本機模型](/zh-TW/gateway/local-models)、[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="我可以不使用 API key，而使用 Claude Max 訂閱嗎？">
    可以。

    Anthropic 員工告訴我們，OpenClaw 風格的 Claude CLI 用法再次被允許，因此
    除非 Anthropic 發佈新政策，OpenClaw 會將 Claude 訂閱 auth 和 `claude -p` 用法視為
    此整合的核准用法。如果你想要最可預測的伺服器端設定，請改用 Anthropic API key。

  </Accordion>

  <Accordion title="你們支援 Claude 訂閱 auth（Claude Pro 或 Max）嗎？">
    支援。

    Anthropic 員工告訴我們此用法再次被允許，因此除非 Anthropic 發佈新政策，
    OpenClaw 會將 Claude CLI 重用和 `claude -p` 用法視為此整合的核准用法。

    Anthropic setup-token 仍可作為受支援的 OpenClaw token 路徑，但 OpenClaw 現在在可用時偏好 Claude CLI 重用和 `claude -p`。
    對生產或多使用者工作負載而言，Anthropic API key auth 仍是
    更安全、更可預測的選擇。如果你想在 OpenClaw 中使用其他訂閱式託管
    選項，請參閱 [OpenAI](/zh-TW/providers/openai)、[Qwen / Model
    Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax) 和 [GLM
    Models](/zh-TW/providers/glm)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="為什麼我會看到來自 Anthropic 的 HTTP 429 rate_limit_error？">
    這表示你目前視窗的 **Anthropic 配額/速率限制**已用盡。如果你
    使用 **Claude CLI**，請等待視窗重設或升級你的方案。如果你
    使用 **Anthropic API key**，請到 Anthropic Console
    檢查用量/帳單，並視需要提高限制。

    如果訊息明確是：
    `Extra usage is required for long context requests`，表示請求正在嘗試使用
    Anthropic 的 1M context beta (`context1m: true`)。這只有在你的
    憑證符合長上下文計費資格時才可用（API key 計費，或
    啟用 Extra Usage 的 OpenClaw Claude-login 路徑）。

    提示：設定一個**後援模型**，讓 OpenClaw 在供應商受到速率限制時仍可繼續回覆。
    請參閱[模型](/zh-TW/cli/models)、[OAuth](/zh-TW/concepts/oauth)，以及
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-TW/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="是否支援 AWS Bedrock？">
    是。OpenClaw 內建 **Amazon Bedrock (Converse)** 供應商。若 AWS env 標記存在，OpenClaw 可以自動探索串流/文字 Bedrock 目錄，並將其合併為隱含的 `amazon-bedrock` 供應商；否則你可以明確啟用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或新增手動供應商項目。請參閱 [Amazon Bedrock](/zh-TW/providers/bedrock) 和[模型供應商](/zh-TW/providers/models)。如果你偏好受管理的金鑰流程，在 Bedrock 前方放置 OpenAI 相容 Proxy 仍是有效選項。
  </Accordion>

  <Accordion title="Codex 驗證如何運作？">
    OpenClaw 透過 OAuth（ChatGPT 登入）支援 **OpenAI Code (Codex)**。常見設定請使用
    `openai/gpt-5.5`：ChatGPT/Codex 訂閱驗證，加上
    原生 Codex app-server 執行。`openai-codex/gpt-*` 模型參照屬於
    由 `openclaw doctor --fix` 修復的舊版設定。直接 OpenAI API 金鑰
    存取仍可用於非 agent 的 OpenAI API 介面，以及透過排序後的
    `openai-codex` API 金鑰 profile 使用於 agent
    模型。
    請參閱[模型供應商](/zh-TW/concepts/model-providers)和[入門設定（CLI）](/zh-TW/start/wizard)。
  </Accordion>

  <Accordion title="為什麼 OpenClaw 仍會提到 openai-codex？">
    `openai-codex` 是 ChatGPT/Codex OAuth 的供應商與 auth-profile id。
    較舊的設定也將它用作模型前綴：

    - `openai/gpt-5.5` = ChatGPT/Codex 訂閱驗證，agent 回合使用原生 Codex runtime
    - `openai-codex/gpt-5.5` = 由 `openclaw doctor --fix` 修復的舊版模型路由
    - `openai/gpt-5.5` 加上排序後的 `openai-codex` API 金鑰 profile = OpenAI agent 模型的 API 金鑰驗證
    - `openai-codex:...` = auth profile id，不是模型參照

    如果你想使用直接 OpenAI Platform 帳單/限制路徑，請設定
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 訂閱驗證，請使用
    `openclaw models auth login --provider openai-codex` 登入。模型參照保持為
    `openai/gpt-5.5`；`openai-codex/*` 模型參照是
    `openclaw doctor --fix` 會改寫的舊版設定。

  </Accordion>

  <Accordion title="為什麼 Codex OAuth 限制可能不同於 ChatGPT 網頁版？">
    Codex OAuth 使用由 OpenAI 管理、依方案而定的配額視窗。實務上，
    即使兩者綁定同一個帳號，這些限制也可能不同於 ChatGPT 網站/應用程式體驗。

    OpenClaw 可以在 `openclaw models status` 中顯示目前可見的供應商用量/配額視窗，
    但它不會捏造或標準化 ChatGPT 網頁版
    權益成為直接 API 存取。如果你想使用直接 OpenAI Platform
    帳單/限制路徑，請搭配 API 金鑰使用 `openai/*`。

  </Accordion>

  <Accordion title="你們支援 OpenAI 訂閱驗證（Codex OAuth）嗎？">
    是。OpenClaw 完整支援 **OpenAI Code (Codex) 訂閱 OAuth**。
    OpenAI 明確允許在 OpenClaw 這類外部工具/工作流程中使用訂閱 OAuth。
    入門設定可以替你執行 OAuth 流程。

    請參閱 [OAuth](/zh-TW/concepts/oauth)、[模型供應商](/zh-TW/concepts/model-providers)和[入門設定（CLI）](/zh-TW/start/wizard)。

  </Accordion>

  <Accordion title="如何設定 Gemini CLI OAuth？">
    Gemini CLI 使用的是 **Plugin 驗證流程**，不是 `openclaw.json` 中的用戶端 id 或 secret。

    步驟：

    1. 在本機安裝 Gemini CLI，讓 `gemini` 位於 `PATH`
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 啟用 Plugin：`openclaw plugins enable google`
    3. 登入：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登入後的預設模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果請求失敗，請在 gateway host 上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    這會將 OAuth token 儲存在 gateway host 的 auth profile 中。詳細資訊：[模型供應商](/zh-TW/concepts/model-providers)。

  </Accordion>

  <Accordion title="本機模型適合日常聊天嗎？">
    通常不適合。OpenClaw 需要大型 context + 強安全性；小型顯示卡會截斷並洩漏。如果你必須使用，請在本機（LM Studio）執行你能跑的**最大**模型 build，並參閱 [/gateway/local-models](/zh-TW/gateway/local-models)。較小/量化模型會增加 prompt-injection 風險 - 請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="如何將託管模型流量保留在特定區域？">
    選擇綁定區域的 endpoint。OpenRouter 提供 MiniMax、Kimi 和 GLM 的美國託管選項；選擇美國託管變體即可讓資料留在區域內。你仍可透過使用 `models.mode: "merge"` 同時列出 Anthropic/OpenAI，讓 fallback 保持可用，同時遵守你選取的區域化供應商。
  </Accordion>

  <Accordion title="我必須買 Mac Mini 才能安裝嗎？">
    不需要。OpenClaw 可在 macOS 或 Linux（Windows 透過 WSL2）上執行。Mac mini 是選用的 - 有些人
    會買一台作為 always-on host，但小型 VPS、家用伺服器或 Raspberry Pi 等級的機器也可以。

    你只在**僅限 macOS 的工具**上需要 Mac。對於 iMessage，請在任何已登入 Messages 的 Mac 上搭配 `imsg` 使用 [iMessage](/zh-TW/channels/imessage)。如果 Gateway 在 Linux 或其他地方執行，請將 `channels.imessage.cliPath` 設為會在該 Mac 上執行 `imsg` 的 SSH wrapper。如果你想使用其他僅限 macOS 的工具，請在 Mac 上執行 Gateway，或配對 macOS node。

    文件：[iMessage](/zh-TW/channels/imessage)、[Nodes](/zh-TW/nodes)、[Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我需要 Mac mini 才能支援 iMessage 嗎？">
    你需要**某台 macOS 裝置**已登入 Messages。它**不**一定要是 Mac mini -
    任何 Mac 都可以。**搭配 `imsg` 使用 [iMessage](/zh-TW/channels/imessage)**；Gateway 可以在該 Mac 上執行，也可以在其他地方執行並使用 SSH wrapper `cliPath`。

    常見設定：

    - 在 Linux/VPS 上執行 Gateway，並將 `channels.imessage.cliPath` 設為會在已登入 Messages 的 Mac 上執行 `imsg` 的 SSH wrapper。
    - 如果你想要最簡單的單機設定，則在 Mac 上執行所有內容。

    文件：[iMessage](/zh-TW/channels/imessage)、[Nodes](/zh-TW/nodes)、
    [Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我買 Mac mini 來執行 OpenClaw，可以把它連接到我的 MacBook Pro 嗎？">
    可以。**Mac mini 可以執行 Gateway**，你的 MacBook Pro 可以作為
    **node**（伴隨裝置）連線。Node 不會執行 Gateway - 它們會提供該裝置上的
    額外能力，例如螢幕/相機/canvas 和 `system.run`。

    常見模式：

    - Gateway 在 Mac mini 上（always-on）。
    - MacBook Pro 執行 macOS app 或 node host，並配對到 Gateway。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文件：[Nodes](/zh-TW/nodes)、[Nodes CLI](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 嗎？">
    不建議使用 Bun。我們看過 runtime bug，尤其是 WhatsApp 和 Telegram。
    請使用 **Node** 以獲得穩定的 Gateway。

    如果你仍想試用 Bun，請在非正式環境 Gateway 上進行，
    且不要使用 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 裡要填什麼？">
    `channels.telegram.allowFrom` 是**人類傳送者的 Telegram 使用者 ID**（數字）。它不是 bot 使用者名稱。

    設定流程只會要求數字使用者 ID。如果你的設定中已有舊版 `@username` 項目，`openclaw doctor --fix` 可以嘗試解析它們。

    較安全（不使用第三方 bot）：

    - DM 你的 bot，然後執行 `openclaw logs --follow` 並讀取 `from.id`。

    官方 Bot API：

    - DM 你的 bot，然後呼叫 `https://api.telegram.org/bot<bot_token>/getUpdates` 並讀取 `message.from.id`。

    第三方（隱私性較低）：

    - DM `@userinfobot` 或 `@getidsbot`。

    請參閱 [/channels/telegram](/zh-TW/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多個人可以用同一個 WhatsApp 號碼搭配不同 OpenClaw instance 嗎？">
    可以，透過**多 agent 路由**。將每個傳送者的 WhatsApp **DM**（peer `kind: "direct"`，傳送者 E.164 如 `+15551234567`）綁定到不同的 `agentId`，讓每個人都有自己的 workspace 和 session store。回覆仍會來自**同一個 WhatsApp 帳號**，而 DM 存取控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）是每個 WhatsApp 帳號的全域設定。請參閱[多 Agent 路由](/zh-TW/concepts/multi-agent)和 [WhatsApp](/zh-TW/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以執行一個「快速聊天」agent 和一個「Opus 寫程式」agent 嗎？'>
    可以。使用多 agent 路由：為每個 agent 指定自己的預設模型，然後將 inbound routes（供應商帳號或特定 peer）綁定到各個 agent。範例設定位於[多 Agent 路由](/zh-TW/concepts/multi-agent)。另請參閱[模型](/zh-TW/concepts/models)和[設定](/zh-TW/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可以在 Linux 上使用嗎？">
    可以。Homebrew 支援 Linux（Linuxbrew）。快速設定：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你透過 systemd 執行 OpenClaw，請確保 service PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew prefix），讓 `brew` 安裝的工具可在非登入 shell 中解析。
    近期 build 也會在 Linux systemd service 上前置常見使用者 bin 目錄（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），並在設定時遵守 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安裝與 npm 安裝之間的差異">
    - **可修改（git）安裝：**完整原始碼 checkout，可編輯，最適合貢獻者。
      你會在本機執行 build，並可修補程式碼/文件。
    - **npm 安裝：**全域 CLI 安裝，沒有 repo，最適合「只想直接執行」。
      更新來自 npm dist-tag。

    文件：[開始使用](/zh-TW/start/getting-started)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="之後可以在 npm 和 git 安裝之間切換嗎？">
    可以。當 OpenClaw 已安裝時，使用 `openclaw update --channel ...`。
    這**不會刪除你的資料** - 它只會變更 OpenClaw 程式碼安裝。
    你的狀態（`~/.openclaw`）和 workspace（`~/.openclaw/workspace`）會保持不變。

    從 npm 到 git：

    ```bash
    openclaw update --channel dev
    ```

    從 git 到 npm：

    ```bash
    openclaw update --channel stable
    ```

    加上 `--dry-run` 可先預覽計畫中的模式切換。更新程式會執行
    Doctor 後續處理、重新整理目標 channel 的 plugin source，並在你未傳入 `--no-restart` 時
    重新啟動 Gateway。

    安裝程式也可以強制使用任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    備份提示：請參閱[備份策略](/zh-TW/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我應該在筆電還是 VPS 上執行 Gateway？">
    簡短回答：**如果你想要 24/7 可靠性，請使用 VPS**。如果你想要
    最低摩擦，且可以接受睡眠/重新啟動，就在本機執行。

    **筆電（本機 Gateway）**

    - **優點：**沒有伺服器成本、可直接存取本機檔案、即時瀏覽器視窗。
    - **缺點：**睡眠/網路中斷 = 斷線、作業系統更新/重開機會中斷、必須保持喚醒。

    **VPS / 雲端**

    - **優點：** 永遠在線、網路穩定、不會有筆電睡眠問題、較容易持續運作。
    - **缺點：** 通常以無頭模式執行（使用螢幕截圖）、只能遠端存取檔案，更新時必須使用 SSH。

    **OpenClaw 專屬備註：** WhatsApp/Telegram/Slack/Mattermost/Discord 都能在 VPS 上正常運作。唯一真正的取捨是**無頭瀏覽器**與可見視窗之間的差異。請參閱 [瀏覽器](/zh-TW/tools/browser)。

    **建議預設：** 如果你之前遇過 Gateway 中斷連線，建議使用 VPS。當你正在主動使用 Mac，並且想要本機檔案存取或透過可見瀏覽器進行 UI 自動化時，本機執行很適合。

  </Accordion>

  <Accordion title="在專用機器上執行 OpenClaw 有多重要？">
    不是必要，但**建議這麼做以提升可靠性與隔離性**。

    - **專用主機（VPS/Mac mini/Pi）：** 永遠在線、較少睡眠/重新啟動中斷、權限更乾淨、較容易持續運作。
    - **共用筆電/桌機：** 用於測試和主動使用完全沒問題，但機器睡眠或更新時會暫停。

    如果你想兼顧兩者，請將 Gateway 保持在專用主機上，並將你的筆電配對為用於本機螢幕/相機/執行工具的 **Node**。請參閱 [Nodes](/zh-TW/nodes)。
    如需安全性指引，請閱讀 [安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 需求和建議作業系統是什麼？">
    OpenClaw 很輕量。對於基本 Gateway 加上一個聊天頻道：

    - **絕對最低需求：** 1 vCPU、1GB RAM、約 500MB 磁碟空間。
    - **建議：** 1-2 vCPU、2GB RAM 或更多，以保留餘裕（日誌、媒體、多個頻道）。Node 工具和瀏覽器自動化可能會消耗較多資源。

    作業系統：使用 **Ubuntu LTS**（或任何現代 Debian/Ubuntu）。Linux 安裝路徑在此環境中測試最完整。

    文件：[Linux](/zh-TW/platforms/linux)、[VPS 託管](/zh-TW/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中執行 OpenClaw 嗎？需求是什麼？">
    可以。請把 VM 視為 VPS：它需要保持開機、可連線，並且有足夠
    RAM 可供 Gateway 和你啟用的任何頻道使用。

    基準指引：

    - **絕對最低需求：** 1 vCPU、1GB RAM。
    - **建議：** 如果你執行多個頻道、瀏覽器自動化或媒體工具，請使用 2GB RAM 或更多。
    - **作業系統：** Ubuntu LTS 或其他現代 Debian/Ubuntu。

    如果你使用 Windows，**WSL2 是最簡單的 VM 風格設定**，並且具備最佳工具
    相容性。請參閱 [Windows](/zh-TW/platforms/windows)、[VPS 託管](/zh-TW/vps)。
    如果你在 VM 中執行 macOS，請參閱 [macOS VM](/zh-TW/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相關內容

- [FAQ](/zh-TW/help/faq) — 主要 FAQ（模型、工作階段、Gateway、安全性等）
- [安裝總覽](/zh-TW/install)
- [開始使用](/zh-TW/start/getting-started)
- [疑難排解](/zh-TW/help/troubleshooting)
