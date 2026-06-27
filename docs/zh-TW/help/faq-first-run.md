---
read_when:
    - 新安裝、上線設定卡住，或首次執行錯誤
    - 選擇驗證與提供者訂閱
    - 無法存取 docs.openclaw.ai、無法開啟儀表板、安裝卡住
sidebarTitle: First-run FAQ
summary: 常見問題：快速開始與首次執行設定 — 安裝、上手、驗證、訂閱、初始失敗
title: FAQ：首次執行設定
x-i18n:
    generated_at: "2026-06-27T19:23:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  Quick-start 與首次執行問答。日常操作、模型、驗證、工作階段與疑難排解，請參閱主要 [FAQ](/zh-TW/help/faq)。

  ## 快速開始與首次執行設定

  <AccordionGroup>
  <Accordion title="我卡住了，最快脫困方式">
    使用能夠**看見你的機器**的本機 AI agent。這比在 Discord 提問有效得多，因為大多數「我卡住了」的情況都是**本機設定或環境問題**，遠端協助者無法檢查。

    - **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

    這些工具可以讀取 repo、執行命令、檢查日誌，並協助修正你的機器層級
    設定（PATH、服務、權限、驗證檔案）。透過
    hackable (git) 安裝，提供它們**完整原始碼 checkout**：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    這會**從 git checkout** 安裝 OpenClaw，因此 agent 可以讀取程式碼與文件，並
    針對你正在執行的確切版本進行推理。你之後隨時可以重新執行安裝程式且不加上 `--install-method git`，切回穩定版。

    提示：請 agent **規劃並監督**修正（逐步進行），然後只執行
    必要命令。這能讓變更保持小而且更容易稽核。

    如果你發現真正的 bug 或修正，請提交 GitHub issue 或送出 PR：
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    從這些命令開始（求助時請分享輸出）：

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    它們的作用：

    - `openclaw status`：快速檢視閘道/agent 健康狀態與基本設定。
    - `openclaw models status`：檢查提供者驗證與模型可用性。
    - `openclaw doctor`：驗證並修復常見設定/狀態問題。

    其他有用的命令列介面檢查：`openclaw status --all`、`openclaw logs --follow`、
    `openclaw gateway status`、`openclaw health --verbose`。

    快速除錯循環：[如果有東西壞掉的前 60 秒](/zh-TW/help/faq#first-60-seconds-if-something-is-broken)。
    安裝文件：[安裝](/zh-TW/install)、[安裝程式旗標](/zh-TW/install/installer)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="心跳偵測一直略過。略過原因是什麼意思？">
    常見心跳偵測略過原因：

    - `quiet-hours`：位於已設定的啟用時段之外
    - `empty-heartbeat-file`：`HEARTBEAT.md` 存在，但只包含空白、註解、標題、fence 或空檢查清單 scaffolding
    - `no-tasks-due`：`HEARTBEAT.md` 任務模式已啟用，但尚未有任何任務間隔到期
    - `alerts-disabled`：所有心跳偵測可見性都已停用（`showOk`、`showAlerts` 和 `useIndicator` 全部關閉）

    在任務模式中，到期時間戳只會在真正的心跳偵測執行
    完成後才前進。被略過的執行不會將任務標記為完成。

    文件：[心跳偵測](/zh-TW/gateway/heartbeat)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="安裝與設定 OpenClaw 的建議方式">
    repo 建議從原始碼執行並使用 onboarding：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    精靈也可以自動建置 UI 資產。onboarding 後，你通常會在連接埠 **18789** 上執行閘道。

    從原始碼（contributors/dev）：

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

  <Accordion title="onboarding 後如何開啟 dashboard？">
    精靈會在 onboarding 後立即用乾淨（非 tokenized）的 dashboard URL 開啟瀏覽器，也會在摘要中列印連結。保持該分頁開啟；如果沒有啟動，請在同一台機器上複製/貼上列印出的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 與遠端驗證 dashboard？">
    **Localhost（同一台機器）：**

    - 開啟 `http://127.0.0.1:18789/`。
    - 如果它要求 shared-secret 驗證，請將已設定的 token 或密碼貼到 Control UI 設定。
    - Token 來源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密碼來源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 如果尚未設定 shared secret，請用 `openclaw doctor --generate-gateway-token` 產生 token。

    **不在 localhost 上：**

    - **Tailscale Serve**（建議）：維持 bind loopback，執行 `openclaw gateway --tailscale serve`，開啟 `https://<magicdns>/`。如果 `gateway.auth.allowTailscale` 是 `true`，identity headers 會滿足 Control UI/WebSocket 驗證（不需貼上 shared secret，假設 trusted gateway host）；HTTP API 仍需要 shared-secret 驗證，除非你刻意使用 private-ingress `none` 或 trusted-proxy HTTP auth。
      來自同一 client 的不良並行 Serve auth 嘗試會在 failed-auth limiter 記錄之前被序列化，因此第二次不良重試可能已經顯示 `retry later`。
    - **Tailnet bind**：執行 `openclaw gateway --bind tailnet --token "<token>"`（或設定 password auth），開啟 `http://<tailscale-ip>:18789/`，然後在 dashboard 設定中貼上相符的 shared secret。
    - **Identity-aware 反向代理**：將閘道放在 trusted proxy 後方，設定 `gateway.auth.mode: "trusted-proxy"`，然後開啟 proxy URL。同主機 loopback proxies 需要明確設定 `gateway.auth.trustedProxy.allowLoopback = true`。
    - **SSH tunnel**：`ssh -N -L 18789:127.0.0.1:18789 user@host`，然後開啟 `http://127.0.0.1:18789/`。shared-secret 驗證仍會套用於 tunnel；如果出現提示，請貼上已設定的 token 或密碼。

    請參閱 [Dashboard](/zh-TW/web/dashboard) 與 [Web surfaces](/zh-TW/web)，了解 bind 模式與驗證詳細資訊。

  </Accordion>

  <Accordion title="為什麼聊天 approvals 有兩個 exec approval 設定？">
    它們控制不同層：

    - `approvals.exec`：將 approval prompts 轉送到聊天目的地
    - `channels.<channel>.execApprovals`：讓該 channel 作為 exec approvals 的 native approval client

    主機 exec policy 仍然是真正的 approval gate。聊天設定只控制 approval
    prompts 出現的位置，以及人們如何回覆。

    在大多數設定中，你**不**需要兩者都用：

    - 如果聊天已支援 commands 和 replies，同聊天 `/approve` 會透過共用路徑運作。
    - 如果受支援的 native channel 可以安全推斷 approvers，OpenClaw 現在會在 `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"` 時，自動啟用 DM-first native approvals。
    - 當 native approval cards/buttons 可用時，該 native UI 是主要路徑；只有在 tool result 表示 chat approvals 不可用或 manual approval 是唯一路徑時，agent 才應包含手動 `/approve` command。
    - 只有在 prompts 也必須轉送到其他 chats 或明確的 ops rooms 時，才使用 `approvals.exec`。
    - 只有在你明確希望 approval prompts 被貼回原始 room/topic 時，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 外掛 approvals 又是分開的：它們預設使用同聊天 `/approve`、可選的 `approvals.plugin` forwarding，且只有部分 native channels 會在其上保留 plugin-approval-native handling。

    簡短版：forwarding 用於 routing，native client config 用於更豐富的 channel-specific UX。
    請參閱 [Exec Approvals](/zh-TW/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什麼 runtime？">
    需要 Node **>= 22**。建議使用 `pnpm`。閘道**不建議**使用 Bun。
  </Accordion>

  <Accordion title="它能在 Raspberry Pi 上執行嗎？">
    可以。閘道很輕量；文件列出 **512MB-1GB RAM**、**1 core** 和約 **500MB**
    磁碟就足以供個人使用，並註明 **Raspberry Pi 4 可以執行它**。

    如果你想要更多餘裕（日誌、媒體、其他服務），**建議 2GB**，但這不是
    硬性最低需求。

    提示：小型 Raspberry Pi/VPS 可以託管閘道，而你可以在筆電/手機上配對**節點**，用於
    本機螢幕/相機/canvas 或命令執行。請參閱 [節點](/zh-TW/nodes)。

  </Accordion>

  <Accordion title="Raspberry Pi 安裝有什麼提示？">
    簡短版：可以運作，但要預期有些粗糙之處。

    - 使用 **64-bit** OS，並保持 Node >= 22。
    - 偏好使用 **hackable (git) install**，這樣你可以查看日誌並快速更新。
    - 先不要啟用 channels/skills，然後逐一新增。
    - 如果遇到奇怪的 binary 問題，通常是 **ARM compatibility** 問題。

    文件：[Linux](/zh-TW/platforms/linux)、[安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding will not hatch。現在怎麼辦？">
    該畫面仰賴閘道可連線且已驗證。終端介面也會在第一次 hatch 時自動傳送
    "Wake up, my friend!"。如果你看到該行但**沒有回覆**
    且 tokens 維持 0，表示 agent 從未執行。

    1. 重新啟動閘道：

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

    如果閘道位於遠端，請確認 tunnel/Tailscale 連線已啟動，且 UI
    指向正確的閘道。請參閱 [遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="我可以將設定遷移到新機器（Mac mini），而不用重做 onboarding 嗎？">
    可以。複製**狀態目錄**和**工作區**，然後執行一次 Doctor。只要你複製**兩個**位置，
    這會讓你的 bot 保持「完全相同」（記憶、工作階段歷史、驗證與 channel
    狀態）：

    1. 在新機器上安裝 OpenClaw。
    2. 從舊機器複製 `$OPENCLAW_STATE_DIR`（預設：`~/.openclaw`）。
    3. 複製你的工作區（預設：`~/.openclaw/workspace`）。
    4. 執行 `openclaw doctor` 並重新啟動閘道服務。

    這會保留設定、驗證 profiles、WhatsApp creds、sessions 與記憶。如果你處於
    remote mode，請記得 gateway host 擁有 session store 和 workspace。

    **重要：**如果你只將 workspace commit/push 到 GitHub，你備份的是
    **memory + bootstrap files**，但**不是** session history 或 auth。它們位於
    `~/.openclaw/` 之下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相關：[遷移](/zh-TW/install/migrating)、[磁碟上的位置](/zh-TW/help/faq#where-things-live-on-disk)、
    [Agent workspace](/zh-TW/concepts/agent-workspace)、[Doctor](/zh-TW/gateway/doctor)、
    [Remote mode](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="在哪裡查看最新版的新內容？">
    查看 GitHub changelog：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新項目在最上方。如果頂部章節標記為 **Unreleased**，下一個有日期的
    章節就是最新已發佈版本。項目會依 **Highlights**、**Changes** 與
    **Fixes** 分組（必要時還會有 docs/other 章節）。

  </Accordion>

  <Accordion title="無法存取 docs.openclaw.ai（SSL 錯誤）">
    部分 Comcast/Xfinity 連線會因 Xfinity
    Advanced Security 而錯誤封鎖 `docs.openclaw.ai`。請停用它或將 `docs.openclaw.ai` 加入允許清單，然後重試。
    請在此回報，協助我們解除封鎖：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    如果你仍然無法連上網站，文件已鏡像到 GitHub：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="穩定版與 beta 的差異">
    **穩定版**和 **beta** 是 **npm dist-tags**，不是不同的程式碼線：

    - `latest` = 穩定版
    - `beta` = 供測試使用的早期建置

    通常，穩定版發行會先落在 **beta**，然後透過明確的
    提升步驟將同一個版本移到 `latest`。維護者也可以在需要時
    直接發布到 `latest`。這就是為什麼 beta 和穩定版在提升後
    可能指向**同一個版本**。

    查看變更內容：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    關於安裝單行命令以及 beta 和 dev 的差異，請參閱下方的摺疊區塊。

  </Accordion>

  <Accordion title="我要如何安裝 beta 版本？beta 和 dev 有什麼差異？">
    **Beta** 是 npm dist-tag `beta`（提升後可能與 `latest` 相同）。
    **Dev** 是 `main` 的移動中最新狀態（git）；發布時會使用 npm dist-tag `dev`。

    單行命令（macOS/Linux）：

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

    2. **可修改安裝（從安裝程式網站）：**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    這會提供一個可編輯的本機 repo，之後可透過 git 更新。

    如果你偏好手動進行乾淨 clone，請使用：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文件：[更新](/zh-TW/cli/update)、[開發通道](/zh-TW/install/development-channels)、
    [安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="安裝和初始設定通常需要多久？">
    粗略指南：

    - **安裝：** 2-5 分鐘
    - **初始設定：** 5-15 分鐘，取決於你設定的通道/模型數量

    如果卡住，請使用 [安裝程式卡住](#quick-start-and-first-run-setup)
    以及 [我卡住了](#quick-start-and-first-run-setup) 中的快速除錯迴圈。

  </Accordion>

  <Accordion title="安裝程式卡住？我要如何取得更多回饋？">
    使用**詳細輸出**重新執行安裝程式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    beta 安裝搭配詳細輸出：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    若要可修改（git）安裝：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Windows（PowerShell）等效方式：

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

    **1) npm 錯誤 spawn git / 找不到 git**

    - 安裝 **Git for Windows**，並確認 `git` 在你的 PATH 上。
    - 關閉並重新開啟 PowerShell，然後重新執行安裝程式。

    **2) 安裝後無法辨識 openclaw**

    - 你的 npm 全域 bin 資料夾不在 PATH 上。
    - 檢查路徑：

      ```powershell
      npm config get prefix
      ```

    - 將該目錄加入你的使用者 PATH（Windows 上不需要 `\bin` 後綴；大多數系統上是 `%AppData%\npm`）。
    - 更新 PATH 後關閉並重新開啟 PowerShell。

    若要設定桌面環境，請使用原生 **Windows Hub** 應用程式。若只要終端機設定，
    PowerShell 安裝程式和 WSL2 閘道路徑都受支援。
    文件：[Windows](/zh-TW/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 輸出顯示中文亂碼，我該怎麼辦？">
    這通常是原生 Windows shell 上的主控台字碼頁不相符。

    症狀：

    - `system.run`/`exec` 輸出將中文呈現為亂碼
    - 同一個命令在另一個終端機設定檔中看起來正常

    PowerShell 中的快速替代方案：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    然後重新啟動閘道並重試你的命令：

    ```powershell
    openclaw gateway restart
    ```

    如果你在最新 OpenClaw 上仍能重現此問題，請在這裡追蹤/回報：

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="文件沒有回答我的問題，我要如何取得更好的答案？">
    使用**可修改（git）安裝**，讓你在本機擁有完整原始碼和文件，然後從
    _該資料夾_ 詢問你的 Bot（或 Claude/Codex），讓它可以讀取 repo 並精準回答。

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多細節：[安裝](/zh-TW/install) 和 [安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="我要如何在 Linux 上安裝 OpenClaw？">
    簡短回答：遵循 Linux 指南，然後執行初始設定。

    - Linux 快速路徑 + 服務安裝：[Linux](/zh-TW/platforms/linux)。
    - 完整逐步說明：[開始使用](/zh-TW/start/getting-started)。
    - 安裝程式 + 更新：[安裝與更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="我要如何在 VPS 上安裝 OpenClaw？">
    任何 Linux VPS 都可以。安裝到伺服器上，然後使用 SSH/Tailscale 連到閘道。

    指南：[exe.dev](/zh-TW/install/exe-dev)、[Hetzner](/zh-TW/install/hetzner)、[Fly.io](/zh-TW/install/fly)。
    遠端存取：[閘道遠端](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="雲端/VPS 安裝指南在哪裡？">
    我們維護一個**託管中心**，涵蓋常見提供者。選擇一個並按照指南操作：

    - [VPS 託管](/zh-TW/vps)（所有提供者集中在一處）
    - [Fly.io](/zh-TW/install/fly)
    - [Hetzner](/zh-TW/install/hetzner)
    - [exe.dev](/zh-TW/install/exe-dev)

    在雲端中的運作方式：**閘道在伺服器上執行**，你可以從
    筆電/手機透過 Control UI（或 Tailscale/SSH）存取。你的狀態 + 工作區
    位於伺服器上，因此請將主機視為真實來源並進行備份。

    你可以將**節點**（Mac/iOS/Android/headless）配對到該雲端閘道，以存取
    本機螢幕/相機/canvas，或在筆電上執行命令，同時讓
    閘道保留在雲端。

    中心：[平台](/zh-TW/platforms)。遠端存取：[閘道遠端](/zh-TW/gateway/remote)。
    節點：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="我可以要求 OpenClaw 自行更新嗎？">
    簡短回答：**可以，但不建議**。更新流程可能重新啟動
    閘道（這會中斷作用中的工作階段）、可能需要乾淨的 git checkout，並且
    可能要求確認。較安全的做法：由操作員從 shell 執行更新。

    使用命令列介面：

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    如果你必須從代理程式自動化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文件：[更新](/zh-TW/cli/update)、[更新中](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="初始設定實際上會做什麼？">
    `openclaw onboard` 是建議的設定路徑。在**本機模式**中，它會引導你完成：

    - **模型/驗證設定**（提供者 OAuth、API keys、Anthropic setup-token，以及 LM Studio 等本機模型選項）
    - **工作區**位置 + 啟動檔案
    - **閘道設定**（bind/port/auth/tailscale）
    - **通道**（WhatsApp、Telegram、Discord、Mattermost、Signal、iMessage，以及 QQ Bot 等內建通道外掛）
    - **常駐程式安裝**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 使用者單元）
    - **健康檢查**和 **skills** 選擇

    它也會在你設定的模型未知或缺少驗證時提出警告。

  </Accordion>

  <Accordion title="我需要 Claude 或 OpenAI 訂閱才能執行這個嗎？">
    不需要。你可以使用 **API keys**（Anthropic/OpenAI/其他）或
    **僅本機模型**執行 OpenClaw，讓你的資料留在裝置上。訂閱（Claude
    Pro/Max 或 OpenAI Codex）是驗證這些提供者的選用方式。

    對 OpenClaw 中的 Anthropic 而言，實務上的區分是：

    - **Anthropic API key**：一般 Anthropic API 計費
    - **Claude CLI / OpenClaw 中的 Claude 訂閱驗證**：Anthropic 員工
      告訴我們這種用法再次獲允許，且 OpenClaw 將 `claude -p`
      使用視為此整合受批准的用法，除非 Anthropic 發布新
      政策

    對長期執行的閘道主機而言，Anthropic API keys 仍是更
    可預測的設定。OpenAI Codex OAuth 明確支援像 OpenClaw
    這樣的外部工具。

    OpenClaw 也支援其他託管訂閱式選項，包括
    **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和
    **Z.AI / GLM Coding Plan**。

    文件：[Anthropic](/zh-TW/providers/anthropic)、[OpenAI](/zh-TW/providers/openai)、
    [Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax)、[Z.AI (GLM)](/zh-TW/providers/zai)、
    [本機模型](/zh-TW/gateway/local-models)、[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="我可以在沒有 API key 的情況下使用 Claude Max 訂閱嗎？">
    可以。

    Anthropic 員工告訴我們，OpenClaw 風格的 Claude CLI 用法再次獲允許，因此
    OpenClaw 將 Claude 訂閱驗證和 `claude -p` 用法視為此整合
    受批准的用法，除非 Anthropic 發布新政策。如果你想要
    最可預測的伺服器端設定，請改用 Anthropic API key。

  </Accordion>

  <Accordion title="你們支援 Claude 訂閱驗證（Claude Pro 或 Max）嗎？">
    支援。

    Anthropic 員工告訴我們這種用法再次獲允許，因此 OpenClaw 將
    Claude CLI 重用和 `claude -p` 用法視為此整合受批准的用法，
    除非 Anthropic 發布新政策。

    Anthropic setup-token 仍可作為受支援的 OpenClaw token 路徑，但 OpenClaw 現在會在可用時優先使用 Claude CLI 重用和 `claude -p`。
    對於正式環境或多使用者工作負載，Anthropic API key 驗證仍是
    更安全、更可預測的選擇。如果你想在 OpenClaw 中使用其他訂閱式託管
    選項，請參閱 [OpenAI](/zh-TW/providers/openai)、[Qwen / Model
    Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax) 和 [GLM
    Models](/zh-TW/providers/zai)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="為什麼我會看到來自 Anthropic 的 HTTP 429 rate_limit_error？">
    這表示你的 **Anthropic 配額/速率限制**在目前視窗中已用盡。如果你
    使用 **Claude CLI**，請等待視窗重設或升級你的方案。如果你
    使用 **Anthropic API key**，請在 Anthropic Console
    檢查使用量/帳單，並視需要提高限制。

    如果訊息明確是：
    `Extra usage is required for long context requests`，表示該請求正嘗試使用
    Anthropic 的 1M 上下文視窗（支援 GA 的 1M Claude 4.x 模型或舊版
    `context1m: true` 設定）。這只有在你的憑證符合長上下文計費資格時才可使用
    （API 金鑰計費，或透過已啟用額外用量的 OpenClaw Claude 登入路徑）。

    提示：設定**備援模型**，讓 OpenClaw 在提供者受到速率限制時仍可繼續回覆。
    請參閱[模型](/zh-TW/cli/models)、[OAuth](/zh-TW/concepts/oauth)，以及
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/zh-TW/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支援 AWS Bedrock 嗎？">
    是。OpenClaw 內建 **Amazon Bedrock (Converse)** 提供者。當 AWS 環境標記存在時，OpenClaw 可以自動探索串流/文字 Bedrock 目錄，並將其合併為隱含的 `amazon-bedrock` 提供者；否則你也可以明確啟用 `plugins.entries.amazon-bedrock.config.discovery.enabled`，或新增手動提供者項目。請參閱 [Amazon Bedrock](/zh-TW/providers/bedrock) 與[模型提供者](/zh-TW/providers/models)。如果你偏好受管理的金鑰流程，在 Bedrock 前方使用 OpenAI 相容代理仍是有效選項。
  </Accordion>

  <Accordion title="Codex 驗證如何運作？">
    OpenClaw 透過 OAuth（ChatGPT 登入）支援 **OpenAI Code (Codex)**。一般設定請使用
    `openai/gpt-5.5`：ChatGPT/Codex 訂閱驗證加上
    原生 Codex app-server 執行。舊版 Codex GPT 參照屬於
    會由 `openclaw doctor --fix` 修復的舊版設定。直接 OpenAI API 金鑰
    存取仍可用於非代理的 OpenAI API 介面，以及透過有序 `openai` API 金鑰設定檔使用的代理
    模型。
    請參閱[模型提供者](/zh-TW/concepts/model-providers)與[導覽設定（命令列介面）](/zh-TW/start/wizard)。
  </Accordion>

  <Accordion title="為什麼 OpenClaw 仍會提到舊版 OpenAI Codex 前綴？">
    `openai` 同時是 OpenAI API 金鑰與
    ChatGPT/Codex OAuth 的提供者與驗證設定檔 ID。你可能仍會在舊版設定與
    遷移警告中看到舊版 OpenAI Codex 前綴。
    較舊的設定也曾將它用作模型前綴：

    - `openai/gpt-5.5` = 使用原生 Codex 執行階段處理代理回合的 ChatGPT/Codex 訂閱驗證
    - 舊版 Codex GPT-5.5 參照 = 由 `openclaw doctor --fix` 修復的舊版模型路由
    - `openai/gpt-5.5` 加上有序 `openai` API 金鑰設定檔 = OpenAI 代理模型的 API 金鑰驗證
    - 舊版 Codex 驗證設定檔 ID = 由 `openclaw doctor --fix` 遷移的舊版驗證設定檔 ID

    如果你想使用直接 OpenAI Platform 計費/限制路徑，請設定
    `OPENAI_API_KEY`。如果你想使用 ChatGPT/Codex 訂閱驗證，請使用
    `openclaw models auth login --provider openai` 登入。模型參照保持為
    `openai/gpt-5.5`；舊版 Codex 模型參照屬於舊版設定，會由
    `openclaw doctor --fix` 重新寫入。

  </Accordion>

  <Accordion title="為什麼 Codex OAuth 限制會與 ChatGPT 網頁版不同？">
    Codex OAuth 使用由 OpenAI 管理、依方案而定的配額視窗。實務上，
    即使兩者連結到同一個帳戶，這些限制仍可能與 ChatGPT 網站/應用程式體驗不同。

    OpenClaw 可以在 `openclaw models status` 中顯示目前可見的提供者用量/配額視窗，
    但它不會虛構或正規化 ChatGPT 網頁版權益成直接 API 存取。
    如果你想使用直接 OpenAI Platform 計費/限制路徑，請搭配 API 金鑰使用 `openai/*`。

  </Accordion>

  <Accordion title="支援 OpenAI 訂閱驗證（Codex OAuth）嗎？">
    是。OpenClaw 完整支援 **OpenAI Code (Codex) 訂閱 OAuth**。
    OpenAI 明確允許在 OpenClaw 這類外部工具/工作流程中使用訂閱 OAuth。
    導覽設定可以替你執行 OAuth 流程。

    請參閱 [OAuth](/zh-TW/concepts/oauth)、[模型提供者](/zh-TW/concepts/model-providers)，以及[導覽設定（命令列介面）](/zh-TW/start/wizard)。

  </Accordion>

  <Accordion title="如何設定 Gemini CLI OAuth？">
    Gemini CLI 使用的是**外掛驗證流程**，不是 `openclaw.json` 中的用戶端 ID 或密鑰。

    步驟：

    1. 在本機安裝 Gemini CLI，讓 `gemini` 位於 `PATH`
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 啟用外掛：`openclaw plugins enable google`
    3. 登入：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登入後的預設模型：`google-gemini-cli/gemini-3-flash-preview`
    5. 如果請求失敗，請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`

    這會將 OAuth 權杖儲存在閘道主機上的驗證設定檔中。詳細資訊：[模型提供者](/zh-TW/concepts/model-providers)。

  </Accordion>

  <Accordion title="本機模型適合日常聊天嗎？">
    通常不適合。OpenClaw 需要大型上下文與強安全性；小型顯示卡會截斷並洩漏。如果你一定要使用，請在本機（LM Studio）執行你能運行的**最大**模型建置，並參閱 [/gateway/local-models](/zh-TW/gateway/local-models)。較小/量化模型會增加提示注入風險 - 請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="如何將託管模型流量限制在特定區域？">
    選擇區域固定的端點。OpenRouter 提供 MiniMax、Kimi 和 GLM 的美國託管選項；選擇美國託管變體即可讓資料留在區域內。你仍可使用 `models.mode: "merge"` 同時列出 Anthropic/OpenAI，讓備援在遵守你所選區域提供者的同時保持可用。
  </Accordion>

  <Accordion title="我必須購買 Mac Mini 才能安裝嗎？">
    不需要。OpenClaw 可在 macOS 或 Linux 上執行（Windows 透過 WSL2）。Mac mini 是選用的 - 有些人
    會買一台作為常時開啟主機，但小型 VPS、家用伺服器或 Raspberry Pi 等級的機器也可以。

    只有在使用 **macOS 專用工具**時才需要 Mac。對於 iMessage，請在任何已登入訊息的 Mac 上搭配 `imsg` 使用 [iMessage](/zh-TW/channels/imessage)。如果閘道在 Linux 或其他地方執行，請將 `channels.imessage.cliPath` 設為會在該 Mac 上執行 `imsg` 的 SSH 包裝器。如果你想使用其他 macOS 專用工具，請在 Mac 上執行閘道，或配對一個 macOS 節點。

    文件：[iMessage](/zh-TW/channels/imessage)、[節點](/zh-TW/nodes)、[Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="iMessage 支援需要 Mac mini 嗎？">
    你需要**某台 macOS 裝置**登入訊息。它**不**一定要是 Mac mini -
    任何 Mac 都可以。**搭配 `imsg` 使用 [iMessage](/zh-TW/channels/imessage)**；閘道可以在該 Mac 上執行，也可以在其他地方透過 SSH 包裝器 `cliPath` 執行。

    常見設定：

    - 在 Linux/VPS 上執行閘道，並將 `channels.imessage.cliPath` 設為會在已登入訊息的 Mac 上執行 `imsg` 的 SSH 包裝器。
    - 如果你想要最簡單的單機設定，所有內容都在 Mac 上執行。

    文件：[iMessage](/zh-TW/channels/imessage)、[節點](/zh-TW/nodes)、
    [Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我買 Mac mini 來執行 OpenClaw，可以把它連到我的 MacBook Pro 嗎？">
    可以。**Mac mini 可以執行閘道**，你的 MacBook Pro 可以作為
    **節點**（輔助裝置）連線。節點不會執行閘道 - 它們會提供額外
    能力，例如該裝置上的螢幕/相機/畫布與 `system.run`。

    常見模式：

    - 閘道在 Mac mini 上（常時開啟）。
    - MacBook Pro 執行 macOS 應用程式或節點主機，並與閘道配對。
    - 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 嗎？">
    **不建議**使用 Bun。我們看過執行階段錯誤，尤其是在 WhatsApp 和 Telegram 上。
    請使用**節點**以取得穩定的閘道。

    如果你仍想試驗 Bun，請在非生產閘道上進行，
    且不要搭配 WhatsApp/Telegram。

  </Accordion>

  <Accordion title="Telegram：allowFrom 應該填什麼？">
    `channels.telegram.allowFrom` 是**人類寄件者的 Telegram 使用者 ID**（數字）。它不是機器人使用者名稱。

    設定只會要求數字使用者 ID。如果你的設定中已有舊版 `@username` 項目，`openclaw doctor --fix` 可以嘗試解析它們。

    較安全（無第三方機器人）：

    - 傳私訊給你的機器人，然後執行 `openclaw logs --follow` 並讀取 `from.id`。

    官方 Bot API：

    - 傳私訊給你的機器人，然後呼叫 `https://api.telegram.org/bot<bot_token>/getUpdates` 並讀取 `message.from.id`。

    第三方（較不私密）：

    - 傳私訊給 `@userinfobot` 或 `@getidsbot`。

    請參閱 [/channels/telegram](/zh-TW/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多個人可以用同一個 WhatsApp 號碼搭配不同 OpenClaw 執行個體嗎？">
    可以，透過**多代理路由**。將每位寄件者的 WhatsApp **私訊**（對等 `kind: "direct"`，寄件者 E.164 例如 `+15551234567`）綁定到不同的 `agentId`，讓每個人都有自己的工作區與工作階段儲存。回覆仍會來自**同一個 WhatsApp 帳戶**，而私訊存取控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）是每個 WhatsApp 帳戶全域套用。請參閱[多代理路由](/zh-TW/concepts/multi-agent)與 [WhatsApp](/zh-TW/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以執行一個「快速聊天」代理和一個「用於寫程式的 Opus」代理嗎？'>
    可以。使用多代理路由：為每個代理指定自己的預設模型，然後將傳入路由（提供者帳戶或特定對等）綁定到各代理。範例設定位於[多代理路由](/zh-TW/concepts/multi-agent)。另請參閱[模型](/zh-TW/concepts/models)與[設定](/zh-TW/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可以在 Linux 上運作嗎？">
    可以。Homebrew 支援 Linux（Linuxbrew）。快速設定：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    如果你透過 systemd 執行 OpenClaw，請確保服務 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前綴），讓 `brew` 安裝的工具可在非登入 shell 中解析。
    近期建置也會在 Linux systemd 服務上前置常見使用者 bin 目錄（例如 `~/.local/bin`、`~/.npm-global/bin`、`~/.local/share/pnpm`、`~/.bun/bin`），並在設定時遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、`BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 與 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安裝與 npm 安裝有何差異">
    - **可修改（git）安裝：**完整原始碼 checkout、可編輯，最適合貢獻者。
      你會在本機執行建置，並可修補程式碼/文件。
    - **npm 安裝：**全域命令列介面安裝，沒有 repo，最適合「只想執行它」。
      更新來自 npm dist-tags。

    文件：[開始使用](/zh-TW/start/getting-started)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="之後可以在 npm 和 git 安裝之間切換嗎？">
    可以。當 OpenClaw 已安裝時，使用 `openclaw update --channel ...`。
    這**不會刪除你的資料** - 它只會變更 OpenClaw 程式碼安裝。
    你的狀態（`~/.openclaw`）與工作區（`~/.openclaw/workspace`）會保持不變。

    從 npm 切換到 git：

    ```bash
    openclaw update --channel dev
    ```

    從 git 切換到 npm：

    ```bash
    openclaw update --channel stable
    ```

    先加入 `--dry-run` 可預覽預計的模式切換。更新程式會執行
    Doctor 後續作業、重新整理目標通道的外掛來源，並
    重新啟動閘道，除非你傳入 `--no-restart`。

    安裝程式也可以強制使用任一模式：

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    備份提示：請參閱[備份策略](/zh-TW/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我應該在筆電還是 VPS 上執行閘道？">
    簡短回答：**如果你需要 24/7 的可靠性，請使用 VPS**。如果你想要
    最低摩擦，並且可以接受睡眠/重新啟動，就在本機執行。

    **筆電（本機閘道）**

    - **優點：** 無伺服器成本、可直接存取本機檔案、即時瀏覽器視窗。
    - **缺點：** 睡眠/網路中斷 = 斷線，作業系統更新/重新開機會中斷，必須保持喚醒。

    **VPS / 雲端**

    - **優點：** 持續運作、網路穩定、沒有筆電睡眠問題、較容易保持執行。
    - **缺點：** 通常以無頭模式執行（使用螢幕截圖）、只能遠端存取檔案，你必須透過 SSH 更新。

    **OpenClaw 特定注意事項：** WhatsApp/Telegram/Slack/Mattermost/Discord 都可以在 VPS 上正常運作。唯一真正的取捨是**無頭瀏覽器**與可見視窗。請參閱[瀏覽器](/zh-TW/tools/browser)。

    **建議預設：** 如果你之前遇過閘道斷線，請使用 VPS。當你正主動使用 Mac，並且需要本機檔案存取或搭配可見瀏覽器進行 UI 自動化時，本機很適合。

  </Accordion>

  <Accordion title="在專用機器上執行 OpenClaw 有多重要？">
    不是必要，但**建議用於可靠性與隔離**。

    - **專用主機（VPS/Mac mini/Raspberry Pi）：** 持續運作、較少睡眠/重新開機中斷、權限更乾淨、較容易保持執行。
    - **共用筆電/桌機：** 完全適合測試與主動使用，但機器睡眠或更新時會暫停。

    如果你想兼得兩者優點，請將閘道放在專用主機上，並將筆電配對為用於本機螢幕/相機/exec 工具的**節點**。請參閱[節點](/zh-TW/nodes)。
    如需安全指引，請閱讀[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 需求與建議作業系統是什麼？">
    OpenClaw 很輕量。對於基本的閘道 + 一個聊天頻道：

    - **絕對最低：** 1 vCPU、1GB RAM、約 500MB 磁碟。
    - **建議：** 1-2 vCPU、2GB RAM 或更多以保留餘裕（日誌、媒體、多個頻道）。節點工具與瀏覽器自動化可能會耗費較多資源。

    作業系統：使用 **Ubuntu LTS**（或任何現代 Debian/Ubuntu）。Linux 安裝路徑在那裡測試最充分。

    文件：[Linux](/zh-TW/platforms/linux)、[VPS 託管](/zh-TW/vps)。

  </Accordion>

  <Accordion title="我可以在 VM 中執行 OpenClaw 嗎？需求是什麼？">
    可以。將 VM 視為 VPS：它需要持續開機、可連線，並具備足夠的
    RAM 供閘道和你啟用的任何頻道使用。

    基準指引：

    - **絕對最低：** 1 vCPU、1GB RAM。
    - **建議：** 如果你執行多個頻道、瀏覽器自動化或媒體工具，請使用 2GB RAM 或更多。
    - **作業系統：** Ubuntu LTS 或其他現代 Debian/Ubuntu。

    如果你使用 Windows，請使用 **Windows Hub** 進行桌面設定；或在
    你特別需要具備廣泛工具相容性的 Linux 風格閘道 VM 時使用 WSL2。請參閱 [Windows](/zh-TW/platforms/windows)、[VPS 託管](/zh-TW/vps)。
    如果你在 VM 中執行 macOS，請參閱 [macOS VM](/zh-TW/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相關

- [常見問題](/zh-TW/help/faq) — 主要常見問題（模型、工作階段、閘道、安全性等）
- [安裝概觀](/zh-TW/install)
- [開始使用](/zh-TW/start/getting-started)
- [疑難排解](/zh-TW/help/troubleshooting)
