---
read_when:
    - 全新安裝、入門設定卡住，或首次執行錯誤
    - 選擇驗證與提供者訂閱
    - 無法存取 docs.openclaw.ai，無法開啟儀表板，安裝卡住
sidebarTitle: First-run FAQ
summary: 常見問題：快速開始與首次執行設定 — 安裝、初始設定、身分驗證、訂閱、初始失敗
title: FAQ：首次執行設定
x-i18n:
    generated_at: "2026-07-05T11:24:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d84968e13ae48ff730e0107363d4d44abc644b9dccf12d05888f1c51ed1ed5
    source_path: help/faq-first-run.md
    workflow: 16
---

  快速入門與首次執行問答。日常操作、模型、驗證、工作階段與疑難排解，請參閱主要的 [FAQ](/zh-TW/help/faq)。

  ## 快速入門與首次執行設定

  <AccordionGroup>
  <Accordion title="我卡住了，最快脫困方式">
    使用可以**看到你的機器**的本機 AI 代理程式。大多數「我卡住了」的情況都是
    **本機設定或環境問題**，遠端協助者無法檢查，因此這比在 Discord 詢問更有效。

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    透過可改造的 (git) 安裝，把完整原始碼 checkout 交給代理程式，讓它可以讀取
    程式碼 + 文件，並針對你執行的精確版本推理：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    請代理程式逐步規劃並監督修復，然後只執行
    必要的命令 - 較小的 diff 較容易稽核。

    尋求協助時（在 Discord 或 GitHub issue 中）分享這些輸出：

    | 命令 | 顯示內容 |
    | --- | --- |
    | `openclaw status` | 閘道/代理程式健康狀態 + 基本設定快照 |
    | `openclaw status --all` | 完整唯讀診斷，可直接貼上 |
    | `openclaw models status` | 提供者驗證 + 模型可用性 |
    | `openclaw doctor` | 驗證並修復常見設定/狀態問題 |
    | `openclaw logs --follow` | 即時日誌尾端 |
    | `openclaw gateway status --deep` | 深度閘道/設定/外掛健康檢查 |
    | `openclaw health --verbose` | 詳細健康報告 |

    發現真正的錯誤或修復？建立 issue 或送出 PR：
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls).

    快速除錯迴圈：[如果某些東西壞了的前 60 秒](/zh-TW/help/faq#first-60-seconds-if-something-is-broken)。
    安裝文件：[安裝](/zh-TW/install)、[安裝程式旗標](/zh-TW/install/installer)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="心跳偵測一直略過。略過原因是什麼意思？">
    | 略過原因 | 意義 |
    | --- | --- |
    | `quiet-hours` | 位於已設定的活動時段視窗之外 |
    | `empty-heartbeat-file` | `HEARTBEAT.md` 存在，但只有空白、註解、標頭、圍欄或空檢查清單骨架 |
    | `no-tasks-due` | 工作模式已啟用，但尚未到任何工作間隔 |
    | `alerts-disabled` | 所有心跳偵測可見性都已關閉（`showOk`、`showAlerts` 和 `useIndicator` 全部停用） |

    在工作模式中，到期時間戳只會在真正的心跳偵測執行完成後前進。
    被略過的執行不會將工作標記為完成。

    文件：[心跳偵測](/zh-TW/gateway/heartbeat)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="安裝與設定 OpenClaw 的建議方式">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    從原始碼安裝（貢獻者/開發）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    還沒有全域安裝？改執行 `pnpm openclaw onboard`。如果 Control UI 資產
    遺失，onboarding 會嘗試自行建置，並在必要時退回使用 `pnpm ui:build`。

  </Accordion>

  <Accordion title="Onboarding 後要如何開啟儀表板？">
    Onboarding 會在設定後立即開啟瀏覽器到乾淨的（非 tokenized）儀表板 URL，
    並在摘要中印出連結。保持該分頁開啟；如果它沒有啟動，
    請在同一台機器上複製/貼上印出的 URL。
  </Accordion>

  <Accordion title="我要如何在 localhost 與遠端驗證儀表板？">
    **Localhost（同一台機器）：**

    - 開啟 `http://127.0.0.1:18789/`。
    - 如果它要求 shared-secret 驗證，請將已設定的 token 或密碼貼到 Control UI 設定中。
    - Token 來源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密碼來源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 還沒有設定 shared secret？執行 `openclaw doctor --generate-gateway-token`（或 `openclaw doctor --fix --generate-gateway-token`）。

    **不在 localhost 上：**

    - **Tailscale Serve**（建議）：維持繫結 loopback，執行 `openclaw gateway --tailscale serve`，開啟 `https://<magicdns>/`。搭配 `gateway.auth.allowTailscale: true`，身分標頭會滿足 Control UI/WebSocket 驗證（不需貼上 shared secret，假設是受信任的閘道主機）；HTTP API 仍需要 shared-secret 驗證，除非你刻意使用 private-ingress `none` 或 trusted-proxy HTTP 驗證。
      來自同一用戶端的並行錯誤驗證 Serve 嘗試，會在 failed-auth 限制器記錄之前被序列化，因此第二次錯誤重試可能已經顯示 `retry later`。
    - **Tailnet 繫結**：執行 `openclaw gateway --bind tailnet --token "<token>"`（或設定密碼驗證），開啟 `http://<tailscale-ip>:18789/`，在儀表板設定中貼上相符的 shared secret。
    - **具身分感知的反向代理**：將閘道放在受信任代理後方，設定 `gateway.auth.mode: "trusted-proxy"`，開啟代理 URL。同主機 loopback 代理需要明確設定 `gateway.auth.trustedProxy.allowLoopback: true`。
    - **SSH 通道**：`ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然後開啟 `http://127.0.0.1:18789/`。shared-secret 驗證仍會透過通道套用；若出現提示，貼上已設定的 token 或密碼。

    請參閱[儀表板](/zh-TW/web/dashboard)與 [Web 介面](/zh-TW/web)了解繫結模式與驗證詳細資訊。

  </Accordion>

  <Accordion title="為什麼聊天核准有兩個 exec 核准設定？">
    它們控制不同層：

    - `approvals.exec` - 將核准提示轉發到聊天目的地。
    - `channels.<channel>.execApprovals` - 讓該頻道成為 exec 核准的原生核准用戶端。

    主機 exec 政策仍是真正的核准關卡；聊天設定只控制
    提示出現的位置，以及人們如何回覆。

    你很少需要兩者都用：

    - 如果聊天已支援命令與回覆，同一聊天中的 `/approve` 會透過共用路徑運作。
    - 當受支援的原生頻道能安全推斷核准者時，如果 `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`，OpenClaw 會自動啟用以 DM 優先的原生核准。
    - 當原生核准卡片/按鈕可用時，該 UI 是主要方式；只有在工具結果表示聊天核准不可用時，才提及手動 `/approve` 命令。
    - 只有在提示也必須送達其他聊天或明確的營運房間時，才使用 `approvals.exec`。
    - 只有在你想把核准提示發回原始房間/主題時，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 外掛核准是分開的：預設為同一聊天中的 `/approve`，可選用 `approvals.plugin` 轉發，而且只有部分原生頻道也會保留這些核准的原生處理。

    簡短版：轉發用於路由，原生用戶端設定用於更豐富的頻道特定 UX。
    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>

  <Accordion title="我需要什麼執行環境？">
    需要節點 **22.19+**（建議節點 24）。`pnpm` 是 repo 套件管理器。
    不建議將 Bun 用於閘道。
  </Accordion>

  <Accordion title="它可以在 Raspberry Pi 上執行嗎？">
    可以，但先檢查 RAM：Pi 5 和 Pi 4 (2 GB+) 是最佳選擇；Pi 3B+ (1 GB) 可用但很慢；不建議使用 Pi Zero 2 W (512 MB)。

    | 型號 | RAM | 適合度 |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | 最佳 |
    | Pi 4 | 4 GB | 良好 |
    | Pi 4 | 2 GB | 可以，請加入 swap |
    | Pi 4 | 1 GB | 吃緊 |
    | Pi 3B+ | 1 GB | 緩慢 |
    | Pi Zero 2 W | 512 MB | 不建議 |

    絕對最低需求：1 GB RAM、1 核心、500 MB 可用磁碟、64-bit OS。由於 Pi 只執行
    閘道（模型會呼叫雲端 API），即使是普通的 Pi 也能負擔。

    小型 Pi/VPS 也可以只託管閘道，同時你在
    筆電/手機上配對**節點**以使用本機螢幕/相機/canvas 或命令執行。請參閱[節點](/zh-TW/nodes)。

    完整設定逐步指南：[Raspberry Pi](/zh-TW/install/raspberry-pi)。

  </Accordion>

  <Accordion title="Raspberry Pi 安裝有任何提示嗎？">
    - 使用 **64-bit** OS；不要使用 32-bit Raspberry Pi OS。
    - 在 2 GB 或更小的板子上加入 swap。
    - 優先使用 **USB SSD** 而不是 SD 卡，以取得更好效能與壽命。
    - 優先使用可改造的 (git) 安裝，這樣你可以查看日誌並快速更新。
    - 先不啟用頻道/Skills，逐一加入。
    - 奇怪的二進位檔失敗（"exec format error"）通常是選用 skill 工具缺少 ARM64 build。

    完整指南：[Raspberry Pi](/zh-TW/install/raspberry-pi)。另請參閱 [Linux](/zh-TW/platforms/linux)。

  </Accordion>

  <Accordion title="它卡在 wake up my friend / onboarding 不會 hatch。現在怎麼辦？">
    該畫面取決於閘道是否可連線且已驗證。終端介面也會在首次 hatch 時自動傳送
    "Wake up, my friend!"。如果你看到該行但**沒有回覆**
    且 token 保持在 0，代表代理程式從未執行。

    1. 重新啟動閘道：

    ```bash
    openclaw gateway restart
    ```

    2. 檢查狀態 + 驗證：

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. 仍然卡住？執行：

    ```bash
    openclaw doctor
    ```

    如果閘道在遠端，請確認通道/Tailscale 連線已啟用，且 UI
    指向正確的閘道。請參閱[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="我可以不重新 onboarding，將設定遷移到新機器嗎？">
    可以。複製**狀態目錄**與**工作區**，然後執行一次 Doctor：

    1. 在新機器上安裝 OpenClaw。
    2. 從舊機器複製 `$OPENCLAW_STATE_DIR`（預設：`~/.openclaw`）。
    3. 複製你的工作區（預設：`~/.openclaw/workspace`）。
    4. 執行 `openclaw doctor` 並重新啟動閘道服務。

    這會保留設定、驗證設定檔、WhatsApp 憑證、工作階段與記憶 - 只要你複製**兩個**位置，
    它就會讓你的 bot 保持完全相同。在遠端模式中，
    gateway 主機擁有 session store 和 workspace。

    **重要：**如果你只將工作區 commit/push 到 GitHub，你備份的是
    **記憶 + bootstrap 檔案**，但不是 session 歷史或驗證。那些位於
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/sessions/`）。

    相關：[遷移](/zh-TW/install/migrating)、[磁碟上的資料位置](/zh-TW/help/faq#where-things-live-on-disk)、
    [代理程式工作區](/zh-TW/concepts/agent-workspace)、[Doctor](/zh-TW/gateway/doctor)、
    [遠端模式](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="我在哪裡可以看到最新版本的新內容？">
    查看 GitHub changelog：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新項目位於最上方。如果最上方區段是 **Unreleased**，下一個有日期的
    區段就是最新已發布版本。項目會歸類在 **Highlights**、**Changes**、
    和 **Fixes**（必要時也會有文件/其他區段）下。

  </Accordion>

  <Accordion title="無法存取 docs.openclaw.ai（SSL 錯誤）">
    某些 Comcast/Xfinity 連線會因 Xfinity
    Advanced Security 錯誤封鎖 `docs.openclaw.ai`。請停用它或將 `docs.openclaw.ai` 加入允許清單，然後重試。協助我們
    解除封鎖：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    仍被封鎖？文件也鏡像在 GitHub：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="stable 與 beta 的差異">
    **Stable** 和 **beta** 是 **npm dist-tags**，不是分開的程式碼線：

    - `latest` = 穩定版
    - `beta` = 用於測試的早期建置（當 beta 缺失或舊於目前穩定版時，會退回 `latest`）

    穩定版通常會先落在 **beta**，接著透過明確的提升步驟，
    將同一個版本移到 `latest`，而不變更版本號。維護者
    也可以直接發布到 `latest`。這就是為什麼 beta 和穩定版在提升後可能指向
    **相同版本**。

    查看變更內容：[CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)。

    如需安裝一行指令，以及 beta 與 dev 的差異，請見下一個摺疊區塊。

  </Accordion>

  <Accordion title="如何安裝 beta 版本，以及 beta 和 dev 有什麼差異？">
    **Beta** 是 npm dist-tag `beta`（提升後可能與 `latest` 相同）。
    **Dev** 是 `main` 的移動中的最新狀態（git）；發布到 npm 時會使用 dist-tag `dev`。

    一行指令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安裝程式（PowerShell）：`iwr -useb https://openclaw.ai/install.ps1 | iex`

    更多細節：[開發通道](/zh-TW/install/development-channels)和[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="如何試用最新內容？">
    兩個選項：

    1. **Dev 通道（現有安裝）：**

    ```bash
    openclaw update --channel dev
    ```

    這會切換到 `main` 的 git checkout、在上游重新基底、建置，並從該 checkout
    安裝命令列介面。

    2. **可修改（git）安裝（全新機器）：**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    偏好手動 clone：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文件：[更新](/zh-TW/cli/update)、[開發通道](/zh-TW/install/development-channels)、[安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="安裝與首次設定通常需要多久？">
    粗略指南：

    - **安裝：** 2-5 分鐘。
    - **QuickStart 首次設定：** 幾分鐘（loopback 閘道、自動 token、預設工作區）。
    - **進階/完整首次設定：** 當提供者登入、通道配對、daemon 安裝、網路下載或 Skills 需要額外設定時會更久。

    精靈會一開始就顯示這段時間預期。你可以略過選用步驟，稍後再用
    `openclaw configure` 返回設定。

    卡住了？請見上方的[我卡住了](#quick-start-and-first-run-setup)。

  </Accordion>

  <Accordion title="安裝程式卡住了？如何取得更多回饋？">
    使用 `--verbose` 重新執行：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` 沒有專用的 verbose 開關；請改用 `Set-PSDebug -Trace 1` /
    `-Trace 0` 包住它。完整旗標參考：[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="Windows 安裝顯示找不到 git，或無法辨識 openclaw">
    兩個常見的 Windows 問題：

    **1) npm error spawn git / 找不到 git**

    - 安裝 **Git for Windows**，並確認 `git` 在 PATH 上。
    - 關閉並重新開啟 PowerShell，然後重新執行安裝程式。

    **2) 安裝後無法辨識 openclaw**

    - 你的 npm 全域 bin 資料夾不在 PATH 上。
    - 檢查它：`npm config get prefix`。
    - 將該目錄加入你的使用者 PATH（不需要 `\bin` 後綴；在大多數系統上是 `%AppData%\npm`）。
    - 關閉並重新開啟 PowerShell。

    偏好桌面應用程式？使用 **Windows Hub**。僅終端機設定：PowerShell
    安裝程式與 WSL2 閘道路徑都受到支援。文件：[Windows](/zh-TW/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 輸出顯示亂碼中文文字 - 我該怎麼辦？">
    通常是原生 Windows shell 的主控台字碼頁不相符。

    症狀：`system.run`/`exec` 輸出將中文呈現為 mojibake；相同命令
    在另一個終端機設定檔中看起來正常。

    PowerShell 中的因應方式：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    然後重新啟動閘道並重試：

    ```powershell
    openclaw gateway restart
    ```

    在最新版 OpenClaw 上仍可重現？追蹤/回報它：[Issue #30640](https://github.com/openclaw/openclaw/issues/30640)。

  </Accordion>

  <Accordion title="文件沒有回答我的問題 - 如何取得更好的答案？">
    使用可修改（git）安裝，讓你在本機擁有完整原始碼與文件，然後
    **從該資料夾**詢問你的 bot（或 Claude/Codex），這樣它就能讀取 repo 並精準回答。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多細節：[安裝](/zh-TW/install)和[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 OpenClaw？">
    - Linux 快速路徑 + 服務安裝：[Linux](/zh-TW/platforms/linux)。
    - 完整逐步說明：[開始使用](/zh-TW/start/getting-started)。
    - 安裝程式 + 更新：[安裝與更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安裝 OpenClaw？">
    任何 Linux VPS 都可以使用。在伺服器上安裝，然後透過 SSH/Tailscale 存取閘道。

    指南：[exe.dev](/zh-TW/install/exe-dev)、[Hetzner](/zh-TW/install/hetzner)、[Fly.io](/zh-TW/install/fly)。
    遠端存取：[遠端閘道](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="cloud/VPS 安裝指南在哪裡？">
    包含常見提供者的託管中心：

    - [VPS 託管](/zh-TW/vps)（所有提供者集中在一處）
    - [Fly.io](/zh-TW/install/fly)
    - [Hetzner](/zh-TW/install/hetzner)
    - [exe.dev](/zh-TW/install/exe-dev)

    在雲端中，**閘道會在伺服器上執行**，你則從筆電/手機
    透過 Control UI（或 Tailscale/SSH）存取它。你的狀態 + 工作區會存放在伺服器上，所以
    請將主機視為事實來源並備份。

    將**節點**（Mac/iOS/Android/headless）配對到該雲端閘道，以便在閘道留在
    雲端時，於你的筆電上進行本機
    螢幕/相機/canvas 或命令執行。

    中心：[平台](/zh-TW/platforms)。遠端存取：[遠端閘道](/zh-TW/gateway/remote)。
    節點：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="我可以要求 OpenClaw 更新自己嗎？">
    可以，但不建議。更新流程可能會重新啟動閘道（中斷
    作用中的工作階段），可能需要乾淨的 git checkout，也可能提示確認。
    由操作者從 shell 執行更新較安全。

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    從代理自動化：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文件：[更新](/zh-TW/cli/update)、[正在更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="首次設定實際上會做什麼？">
    `openclaw onboard` 是建議的設定路徑。在**本機模式**中，它會逐步處理：

    1. **模型/驗證** - 提供者 OAuth、API keys 或手動驗證（包括 LM Studio 等本機選項）；選擇預設模型。
    2. **工作區** - 位置 + bootstrap 檔案。
    3. **閘道** - 連接埠、繫結位址、驗證模式、Tailscale 暴露。
    4. **通道** - 內建與官方外掛聊天通道：iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
    5. **Daemon** - LaunchAgent（macOS）、systemd 使用者單元（Linux/WSL2）或原生 Windows Scheduled Task。
    6. **健康檢查** - 啟動閘道並驗證其正在執行。
    7. **Skills** - 安裝建議的 skills 與選用相依項。

    它會一開始就設定時間預期，並在你設定的模型未知
    或缺少驗證時發出警告。完整拆解：[首次設定（命令列介面）](/zh-TW/start/wizard)。

  </Accordion>

  <Accordion title="我需要 Claude 或 OpenAI 訂閱才能執行這個嗎？">
    不需要。使用 **API keys**（Anthropic/OpenAI/其他）或**僅限本機模型**
    執行 OpenClaw，讓你的資料留在裝置上。訂閱（Claude Pro/Max、ChatGPT/Codex）是
    驗證這些提供者的選用方式。

    對 Anthropic 而言：**API key** 提供標準的隨用隨付計費；**Claude CLI**
    會重用同一主機上現有的 Claude Code 登入。Anthropic 目前將
    Claude CLI 的非互動式 `claude -p` 路徑視為 Agent SDK/程式化使用，
    仍會消耗你訂閱方案的額度限制 - 在依賴訂閱行為前，請查看目前的 Anthropic 計費
    文件。對長期執行的閘道主機與共用
    自動化而言，Anthropic API key 是較可預測的選擇。

    OpenAI Codex OAuth（ChatGPT/Codex 訂閱）完整支援代理模型。
    OpenClaw 也支援託管的訂閱式選項，包括 **Qwen Cloud
    Coding Plan**、**MiniMax Coding Plan** 和 **Z.AI / GLM Coding Plan**。

    文件：[Anthropic](/zh-TW/providers/anthropic)、[OpenAI](/zh-TW/providers/openai)、
    [Qwen Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax)、[Z.AI (GLM)](/zh-TW/providers/zai)、
    [本機模型](/zh-TW/gateway/local-models)、[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="我可以不使用 API key，而使用 Claude Max 訂閱嗎？">
    可以。OpenClaw 支援 Pro/Max/Team/Enterprise 方案的 Claude CLI 重用。Anthropic
    目前將 OpenClaw 使用的 `claude -p` 路徑視為受你方案限制約束的訂閱方案使用，
    而不是額外的免費額度 - 請見
    [Anthropic](/zh-TW/providers/anthropic) 取得目前計費細節，以及連至
    Anthropic 自家支援文章的連結。若要最可預測的伺服器端設定，請改用
    Anthropic API key。
  </Accordion>

  <Accordion title="你們支援 Claude 訂閱驗證（Claude Pro 或 Max）嗎？">
    支援，透過 Claude CLI 重用。Anthropic 對 `claude -p`/Agent SDK 使用的計費處理
    曾隨時間變動；在依賴特定計費
    行為前，請見 [Anthropic](/zh-TW/providers/anthropic) 取得目前狀態與
    Anthropic 支援文章的標註日期連結。

    Anthropic setup-token 驗證也仍是受支援的 token 路徑，但 OpenClaw 偏好
    在可用時重用 Claude CLI 和 `claude -p`。對生產或多使用者
    工作負載而言，Anthropic API key 仍是更安全、可預測的選擇。其他
    訂閱式託管選項：[OpenAI](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax)、[Z.AI (GLM)](/zh-TW/providers/zai)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="為什麼我會看到來自 Anthropic 的 HTTP 429 rate_limit_error？">
    你目前時段的 **Anthropic 配額/速率限制**已耗盡。在 **Claude
    CLI** 上，請等待時段重設或升級你的方案。在 **Anthropic API key** 上，
    請在 Anthropic Console 中檢查使用量/計費，並視需要提高限制。

    如果訊息明確為 `Extra usage is required for long context requests`，
    表示該請求正在嘗試使用 Anthropic 的 1M 上下文視窗（具備 GA 能力的 1M Claude 4.x
    模型，或舊版 `params.context1m: true` 設定），而你目前的憑證不符合長上下文計費資格。

    設定一個**後備模型**，讓 OpenClaw 在提供者受到速率限制時仍能繼續回覆。
    請參閱[模型](/zh-TW/cli/models)、[OAuth](/zh-TW/concepts/oauth)，以及
    [Anthropic 429 長上下文需要額外使用量](/zh-TW/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="是否支援 AWS Bedrock？">
    是。OpenClaw 內建 **Amazon Bedrock (Converse)** 提供者。當 AWS 環境
    標記存在（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、`AWS_BEARER_TOKEN_BEDROCK`）時，
    OpenClaw 會自動啟用隱式 Bedrock 提供者以進行模型探索；否則
    請設定 `plugins.entries.amazon-bedrock.config.discovery.enabled: true` 或新增手動
    提供者項目。請參閱 [Amazon Bedrock](/zh-TW/providers/bedrock) 和[模型提供者](/zh-TW/providers/models)。
    如果你偏好受管理的金鑰流程，在 Bedrock 前方使用 OpenAI 相容代理仍是有效選項。
  </Accordion>

  <Accordion title="Codex 驗證如何運作？">
    OpenClaw 透過 OAuth（ChatGPT 登入）支援 **OpenAI Codex**。預設設定請使用 `openai/gpt-5.5`：
    ChatGPT/Codex 訂閱驗證加上原生 Codex 應用程式伺服器
    執行。舊版 Codex 前綴模型參照是由
    `openclaw doctor --fix` 修復的舊版設定。直接 OpenAI API 金鑰存取仍可用於非代理
    OpenAI API 介面，且透過排序的 `openai` API 金鑰設定檔，也可用於代理模型。
    請參閱[模型提供者](/zh-TW/concepts/model-providers)和[入門設定（命令列介面）](/zh-TW/start/wizard)。
  </Accordion>

  <Accordion title="為什麼 OpenClaw 仍會提到舊版 OpenAI Codex 前綴？">
    `openai` 是目前用於 OpenAI API 金鑰和
    ChatGPT/Codex OAuth 的提供者與驗證設定檔 ID - OpenAI Codex 已整合其中。你仍可能在較舊的設定和遷移警告中看到舊版
    `openai-codex` 前綴：

    - `openai/gpt-5.5` = 使用原生 Codex 執行階段進行代理回合的 ChatGPT/Codex 訂閱驗證。
    - 舊版 `openai-codex/*` 模型參照 = 由 `openclaw doctor --fix` 修復的舊版路由。
    - `openai/gpt-5.5` 加上排序的 `openai` API 金鑰設定檔 = OpenAI 代理模型的 API 金鑰驗證。
    - 舊版 `openai-codex` 驗證設定檔 ID = 由 `openclaw doctor --fix` 遷移的舊版 ID。

    想使用直接 OpenAI Platform 計費？設定 `OPENAI_API_KEY`。想使用 ChatGPT/Codex
    訂閱驗證？執行 `openclaw models auth login --provider openai`。將模型
    參照維持為 `openai/gpt-5.5`；舊版 Codex 前綴參照就是 `openclaw doctor --fix` 會重寫的內容。

  </Accordion>

  <Accordion title="為什麼 Codex OAuth 限制可能與 ChatGPT 網頁版不同？">
    Codex OAuth 使用 OpenAI 管理、依方案而定的配額視窗，可能不同於
    ChatGPT 網站/應用程式體驗，即使是在同一帳戶上也是如此。

    `openclaw models status` 會顯示目前可見的提供者使用量/配額視窗，但
    不會將 ChatGPT 網頁版權益虛構或標準化為直接 API 存取。若要使用
    直接 OpenAI Platform 計費/限制路徑，請搭配 API 金鑰使用 `openai/*`。

  </Accordion>

  <Accordion title="你們支援 OpenAI 訂閱驗證（Codex OAuth）嗎？">
    是，完整支援。OpenAI 明確允許在像 OpenClaw 這類外部
    工具/工作流程中使用訂閱 OAuth。入門設定可以替你執行 OAuth 流程。

    請參閱 [OAuth](/zh-TW/concepts/oauth)、[模型提供者](/zh-TW/concepts/model-providers) 和[入門設定（命令列介面）](/zh-TW/start/wizard)。

  </Accordion>

  <Accordion title="如何設定 Gemini CLI OAuth？">
    Gemini 命令列介面使用**外掛驗證流程**，不是 `openclaw.json` 中的用戶端 ID 或密鑰。

    1. 在本機安裝 Gemini 命令列介面，讓 `gemini` 位於 `PATH`：
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 啟用外掛：`openclaw plugins enable google`
    3. 登入：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登入後的預設模型：`google/gemini-3.1-pro-preview`（執行階段 `google-gemini-cli`）
    5. 登入後請求失敗？請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID` 後重試。

    OAuth 權杖會儲存在閘道主機上的驗證設定檔中。詳細資訊：[Google](/zh-TW/providers/google)、[模型提供者](/zh-TW/concepts/model-providers)。

  </Accordion>

  <Accordion title="本機模型適合閒聊嗎？">
    通常不適合。OpenClaw 需要大型上下文 + 強安全性；小型顯示卡會截斷上下文
    並略過提供者端的安全篩選器。如果你必須使用，請在本機執行你
    能負擔的**最大**模型建置（LM Studio）- 請參閱[本機模型](/zh-TW/gateway/local-models)。較小/量化的
    模型會提高提示注入風險 - 請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="如何將託管模型流量保留在特定區域？">
    選擇區域固定的端點。OpenRouter 提供 MiniMax、Kimi、
    和 GLM 的美國託管選項；選擇美國託管變體以將資料保留在區域內。你仍可同時列出
    Anthropic/OpenAI，並搭配 `models.mode: "merge"`，讓後備在尊重你所選區域提供者的同時
    保持可用。
  </Accordion>

  <Accordion title="我必須買 Mac Mini 才能安裝嗎？">
    不需要。OpenClaw 可在 macOS 或 Linux 上執行（Windows 透過 WSL2）。Mac mini 是常見的
    常時在線主機選擇，但小型 VPS、家用伺服器或 Raspberry Pi 等級的機器也可以。

    你只有在使用 **macOS 專用工具**時才需要 Mac。對於 iMessage，請使用 [iMessage](/zh-TW/channels/imessage)
    搭配任何已登入 Messages 的 Mac 上的 `imsg` - 如果閘道在 Linux 或其他地方執行，
    請將 `channels.imessage.cliPath` 設為在該 Mac 上執行 `imsg` 的 SSH 包裝器。對於其他
    macOS 專用工具，請在 Mac 上執行閘道，或配對一個 macOS 節點。

    文件：[iMessage](/zh-TW/channels/imessage)、[節點](/zh-TW/nodes)、[Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="我需要 Mac mini 才能支援 iMessage 嗎？">
    你需要**某個 macOS 裝置**登入 Messages - 不一定要 Mac mini，任何
    Mac 都可以。使用 [iMessage](/zh-TW/channels/imessage) 搭配 `imsg`；閘道可以在該
    Mac 上執行，也可以在其他地方透過 SSH 包裝器 `cliPath` 執行。

    常見設定：

    - 閘道在 Linux/VPS 上，`channels.imessage.cliPath` 設為在已登入 Messages 的 Mac 上執行 `imsg` 的 SSH 包裝器。
    - 最簡單的單機設定是在一台 Mac 上執行所有項目。

    文件：[iMessage](/zh-TW/channels/imessage)、[節點](/zh-TW/nodes)、[Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果我買 Mac mini 來執行 OpenClaw，可以把它連到我的 MacBook Pro 嗎？">
    可以。**Mac mini 可以執行閘道**，你的 MacBook Pro 會作為**節點**
    （伴隨裝置）連線。節點不執行閘道 - 它們會新增
    螢幕/相機/畫布以及該裝置上的 `system.run` 等能力。

    常見模式：閘道在常時在線的 Mac mini 上；MacBook Pro 執行 macOS 應用程式或
    節點主機並配對到閘道。使用 `openclaw nodes status` / `openclaw nodes list` 檢查。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="我可以使用 Bun 嗎？">
    不建議 - Bun 有執行階段錯誤，尤其是 WhatsApp 和 Telegram。請使用
    **Node** 以取得穩定的閘道。如果你仍想實驗，請在
    沒有 WhatsApp/Telegram 的非生產閘道上進行。
  </Accordion>

  <Accordion title="Telegram：allowFrom 應該填什麼？">
    `channels.telegram.allowFrom` 是**真人寄件者的 Telegram 使用者 ID**（數字），
    不是機器人使用者名稱。設定流程只會要求數字使用者 ID；`openclaw doctor --fix`
    可以嘗試解析舊版 `@username` 項目。

    較安全（無第三方機器人）：私訊你的機器人，執行 `openclaw logs --follow`，讀取 `from.id`。

    官方 Bot API：私訊你的機器人，呼叫 `https://api.telegram.org/bot<bot_token>/getUpdates`，讀取 `message.from.id`。

    第三方（較不私密）：私訊 `@userinfobot` 或 `@getidsbot`。

    請參閱 [Telegram 存取控制](/zh-TW/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多個人可以用同一個 WhatsApp 號碼搭配不同的 OpenClaw 執行個體嗎？">
    可以，透過**多代理路由**。將每個寄件者的 WhatsApp 私訊（`peer: { kind: "direct", id: "+15551234567" }`）綁定到不同的 `agentId`，讓每個人都有自己的工作區和工作階段儲存。回覆仍會來自**同一個 WhatsApp 帳戶**；私訊存取控制（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）是每個帳戶的全域設定。請參閱[多代理路由](/zh-TW/concepts/multi-agent)和 [WhatsApp](/zh-TW/channels/whatsapp)。
  </Accordion>

  <Accordion title='我可以執行一個「快速聊天」代理和一個「Opus 寫程式」代理嗎？'>
    可以。使用多代理路由：為每個代理指定自己的預設模型，然後將傳入
    路由（提供者帳戶或特定對等端）綁定到各代理。設定範例：
    [多代理路由](/zh-TW/concepts/multi-agent)。另請參閱[模型](/zh-TW/concepts/models)和
    [設定](/zh-TW/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可以在 Linux 上使用嗎？">
    可以，透過 Linuxbrew：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    透過 systemd 執行 OpenClaw：請確認服務 PATH 包含
    `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前綴），讓 `brew` 安裝的工具
    能在非登入 shell 中解析。近期建置也會在 Linux
    systemd 服務上前置常見使用者 bin 目錄（例如 `~/.local/bin`、`~/.npm-global/bin`、
    `~/.local/share/pnpm`、`~/.bun/bin`），並在設定時遵循 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、
    `BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安裝與 npm 安裝的差異">
    - **可修改（git）安裝：**完整原始碼 checkout，可編輯，最適合貢獻者。你可以在本機建置並修補程式碼/文件。
    - **npm 安裝：**全域命令列介面安裝，沒有 repo，最適合「只想執行」。更新來自 npm dist-tags。

    文件：[開始使用](/zh-TW/start/getting-started)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="之後可以在 npm 和 git 安裝之間切換嗎？">
    可以，在現有安裝上使用 `openclaw update --channel ...`。這**不會
    刪除你的資料** - 只會變更 OpenClaw 程式碼安裝。狀態（`~/.openclaw`）和
    工作區（`~/.openclaw/workspace`）會保持不變。

    npm 到 git：

    ```bash
    openclaw update --channel dev
    ```

    git 到 npm：

    ```bash
    openclaw update --channel stable
    ```

    加上 `--dry-run` 可先預覽計畫中的模式切換。更新器會執行 Doctor
    後續步驟，重新整理目標通道的外掛來源，並重新啟動閘道，
    除非你傳入 `--no-restart`。

    安裝程式也可以強制任一模式：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    備份提示：[檔案在磁碟上的位置](/zh-TW/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="我應該在筆電還是 VPS 上執行閘道？">
    想要 24/7 可靠性？使用 **VPS**。想要最低摩擦，且你可以接受
    睡眠/重新啟動？就在本機執行。

    **筆電（本機閘道）**

    - **優點：**無伺服器成本，可直接存取本機檔案，有即時瀏覽器視窗。
    - **缺點：**睡眠/網路中斷會使其斷線，作業系統更新/重新開機會中斷它，必須保持喚醒。

    **VPS / 雲端**

    - **優點：** 持續運作、網路穩定、沒有筆電睡眠問題、較容易保持執行。
    - **缺點：** 通常是無頭環境（使用螢幕截圖）、只能遠端存取檔案、更新需要 SSH。

    WhatsApp/Telegram/Slack/Mattermost/Discord 都可以在 VPS 上正常運作；真正的
    取捨在於無頭瀏覽器與可見視窗。請參閱[瀏覽器](/zh-TW/tools/browser)。

    預設建議：如果你之前遇過閘道斷線，請使用 VPS；如果你正在主動使用 Mac，並且想要本機檔案存取或可見瀏覽器 UI
    自動化，本機環境很適合。

  </Accordion>

  <Accordion title="在專用機器上執行 OpenClaw 有多重要？">
    不是必要條件，但為了可靠性和隔離性，建議這麼做。

    - **專用主機（VPS/Mac mini/Raspberry Pi）：** 持續運作、較少睡眠/重新開機中斷、權限更乾淨、較容易保持執行。
    - **共用筆電/桌機：** 適合測試和主動使用，但機器睡眠或更新時可能會暫停。

    兩全其美的做法：將閘道放在專用主機上，並將你的筆電配對為
    **節點**，用於本機螢幕/相機/執行工具。請參閱[節點](/zh-TW/nodes)和[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="最低 VPS 需求和建議作業系統是什麼？">
    - **絕對最低：** 1 vCPU、1 GB RAM、約 500 MB 磁碟。
    - **建議：** 1-2 vCPU、2 GB 以上 RAM，以保留餘裕（日誌、媒體、多個頻道）。節點工具和瀏覽器自動化可能很耗資源。

    作業系統：**Ubuntu LTS**（或任何現代 Debian/Ubuntu）- 測試最完整的 Linux 安裝路徑。

    文件：[Linux](/zh-TW/platforms/linux)、[VPS 託管](/zh-TW/vps)。

  </Accordion>

  <Accordion title="我可以在虛擬機中執行 OpenClaw 嗎？需求是什麼？">
    可以。將虛擬機視為 VPS：它需要持續開機、可連線，並且有足夠 RAM
    供閘道和你啟用的任何頻道使用。

    - **絕對最低：** 1 vCPU、1 GB RAM。
    - **建議：** 2 GB 以上 RAM，供多個頻道、瀏覽器自動化或媒體工具使用。
    - **作業系統：** Ubuntu LTS 或其他現代 Debian/Ubuntu。

    在 Windows 上，使用 **Windows Hub** 進行桌面設定，或使用 WSL2 作為 Linux 風格的閘道虛擬機，
    以取得廣泛的工具相容性。請參閱 [Windows](/zh-TW/platforms/windows)、[VPS 託管](/zh-TW/vps)。
    在虛擬機中執行 macOS：請參閱 [macOS 虛擬機](/zh-TW/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相關

- [常見問題](/zh-TW/help/faq) - 主要常見問題（模型、工作階段、閘道、安全性等）
- [安裝概觀](/zh-TW/install)
- [開始使用](/zh-TW/start/getting-started)
- [疑難排解](/zh-TW/help/troubleshooting)
