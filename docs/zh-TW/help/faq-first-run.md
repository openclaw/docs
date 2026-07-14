---
read_when:
    - 全新安裝、初始設定卡住或首次執行錯誤
    - 選擇驗證方式與供應商訂閱方案
    - 無法存取 docs.openclaw.ai、無法開啟儀表板、安裝卡住
sidebarTitle: First-run FAQ
summary: 常見問題：快速開始與首次執行設定 — 安裝、上手引導、驗證、訂閱、初始失敗狀況
title: 常見問題：首次執行設定
x-i18n:
    generated_at: "2026-07-14T13:49:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

快速入門與首次執行問答。如需日常操作、模型、驗證、工作階段
與疑難排解資訊，請參閱主要的[常見問題](/zh-TW/help/faq)。

## 快速入門與首次執行設定

<AccordionGroup>
  <Accordion title="卡住時，最快的排除方法">
    使用能夠**查看你的機器**的本機 AI 代理程式。大多數「我卡住了」的情況
    都是遠端協助者無法檢查的**本機設定或環境問題**，因此這比
    在 Discord 詢問更有效。

    - **Claude Code**：[https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**：[https://openai.com/codex/](https://openai.com/codex/)

    透過可修改的（git）安裝方式，將完整的原始碼簽出提供給代理程式，讓它能讀取
    程式碼與文件，並針對你實際執行的版本進行推理：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    要求代理程式逐步規劃並監督修正流程，然後只執行
    必要的命令——較小的差異更容易稽核。

    尋求協助時（在 Discord 或 GitHub 議題中），請提供以下輸出：

    | 命令 | 顯示內容 |
    | --- | --- |
    | `openclaw status` | 閘道／代理程式健康狀態與基本設定快照 |
    | `openclaw status --all` | 完整的唯讀診斷，可直接貼上 |
    | `openclaw models status` | 提供者驗證與模型可用性 |
    | `openclaw doctor` | 驗證並修復常見的設定／狀態問題 |
    | `openclaw logs --follow` | 即時日誌追蹤 |
    | `openclaw gateway status --deep` | 深度閘道／設定／外掛健康檢查 |
    | `openclaw health --verbose` | 詳細健康報告 |

    發現實際的錯誤或修正方式？請建立議題或提交 PR：
    [議題](https://github.com/openclaw/openclaw/issues) /
    [提取要求](https://github.com/openclaw/openclaw/pulls)。

    快速除錯流程：[發生故障時的前 60 秒](/zh-TW/help/faq#first-60-seconds-if-something-is-broken)。
    安裝文件：[安裝](/zh-TW/install)、[安裝程式旗標](/zh-TW/install/installer)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="心跳偵測一直略過。略過原因代表什麼？">
    | 略過原因 | 含義 |
    | --- | --- |
    | `quiet-hours` | 不在設定的活動時段範圍內 |
    | `empty-heartbeat-file` | `HEARTBEAT.md` 存在，但僅包含空白、註解、標題、圍欄或空白核取清單的骨架內容 |
    | `no-tasks-due` | 任務模式已啟用，但尚未到任何任務的執行間隔 |
    | `alerts-disabled` | 所有心跳偵測可見性皆已關閉（`showOk`、`showAlerts` 和 `useIndicator` 均已停用） |

    在任務模式中，只有實際的心跳偵測執行完成後，應執行時間戳記才會前移。
    略過的執行不會將任務標示為已完成。

    文件：[心跳偵測](/zh-TW/gateway/heartbeat)、[自動化](/zh-TW/automation)。

  </Accordion>

  <Accordion title="安裝與設定 OpenClaw 的建議方式">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    從原始碼安裝（貢獻者／開發人員）：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    尚未全域安裝？請改為執行 `pnpm openclaw onboard`。如果缺少 Control UI 資產，
    新手引導會嘗試自行建置，若失敗則改用 `pnpm ui:build`。

  </Accordion>

  <Accordion title="完成新手引導後，如何開啟儀表板？">
    設定完成後，新手引導會立即在瀏覽器中開啟乾淨的（不含權杖）儀表板 URL，
    並在摘要中列印連結。請保持該分頁開啟；如果瀏覽器未啟動，
    請在同一台機器上複製並貼上所列印的 URL。
  </Accordion>

  <Accordion title="如何在 localhost 與遠端環境驗證儀表板？">
    **Localhost（同一台機器）：**

    - 開啟 `http://127.0.0.1:18789/`。
    - 如果系統要求共用密鑰驗證，請將設定的權杖或密碼貼到 Control UI 設定中。
    - 權杖來源：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
    - 密碼來源：`gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
    - 尚未設定共用密鑰？請執行 `openclaw doctor --generate-gateway-token`（或 `openclaw doctor --fix --generate-gateway-token`）。

    **不在 localhost 上：**

    - **Tailscale Serve**（建議）：維持繫結於回送介面，執行 `openclaw gateway --tailscale serve`，然後開啟 `https://<magicdns>/`。使用 `gateway.auth.allowTailscale: true` 時，身分標頭可滿足 Control UI／WebSocket 驗證需求（不必貼上共用密鑰，前提是閘道主機可信任）；HTTP API 仍需要共用密鑰驗證，除非你刻意使用私人輸入的 `none` 或可信任 Proxy HTTP 驗證。
      來自同一用戶端的並行錯誤驗證 Serve 嘗試，會在失敗驗證限制器記錄前依序處理，因此第二次錯誤重試可能已經顯示 `retry later`。
    - **Tailnet 繫結**：執行 `openclaw gateway --bind tailnet --token "<token>"`（或設定密碼驗證），開啟 `http://<tailscale-ip>:18789/`，然後在儀表板設定中貼上相符的共用密鑰。
    - **身分感知反向 Proxy**：將閘道置於可信任 Proxy 後方，設定 `gateway.auth.mode: "trusted-proxy"`，然後開啟 Proxy URL。同主機的回送 Proxy 需要明確設定 `gateway.auth.trustedProxy.allowLoopback: true`。
    - **SSH 通道**：執行 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`，然後開啟 `http://127.0.0.1:18789/`。透過通道時仍需共用密鑰驗證；若出現提示，請貼上設定的權杖或密碼。

    如需繫結模式與驗證的詳細資訊，請參閱[儀表板](/zh-TW/web/dashboard)和 [Web 介面](/zh-TW/web)。

  </Accordion>

  <Accordion title="為什麼聊天核准有兩種 exec 核准設定？">
    它們控制不同的層級：

    - `approvals.exec`——將核准提示轉送至聊天目的地。
    - `channels.<channel>.execApprovals`——讓該頻道成為 exec 核准的原生核准用戶端。

    主機的 exec 原則仍是真正的核准關卡；聊天設定只控制
    提示顯示的位置，以及人員如何回覆。

    通常不需要同時使用兩者：

    - 如果聊天已支援命令與回覆，同一聊天中的 `/approve` 會透過共用路徑運作。
    - 當受支援的原生頻道能安全推斷核准者時，如果 `channels.<channel>.execApprovals.enabled` 未設定或為 `"auto"`，OpenClaw 會自動啟用以私訊優先的原生核准。
    - 當原生核准卡片／按鈕可用時，該 UI 為主要方式；只有在工具結果指出聊天核准不可用時，才提及手動 `/approve` 命令。
    - 只有在提示也必須送達其他聊天或明確的維運聊天室時，才使用 `approvals.exec`。
    - 只有在希望將核准提示發回原始聊天室／主題時，才使用 `channels.<channel>.execApprovals.target: "channel"` 或 `"both"`。
    - 外掛核准是獨立的：預設在同一聊天中使用 `/approve`，可選擇透過 `approvals.plugin` 轉送，而且只有部分原生頻道也會保留原生處理方式。

    簡而言之：轉送用於路由，原生用戶端設定則用於提供功能更豐富的頻道專屬使用者體驗。
    請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

  </Accordion>

  <Accordion title="需要什麼執行環境？">
    需要 Node **22.22.3+**、**24.15+** 或 **25.9+**（建議使用 Node 24）。`pnpm` 是此儲存庫的套件管理器。
    Bun 可以安裝相依套件並執行套件指令碼，但無法執行 OpenClaw 命令列介面或閘道，因為它缺少 `node:sqlite`。
  </Accordion>

  <Accordion title="可以在 Raspberry Pi 上執行嗎？">
    可以，但請先檢查 RAM：Pi 5 和 Pi 4（2 GB+）最為合適；Pi 3B+（1 GB）可以運作但速度較慢；不建議使用 Pi Zero 2 W（512 MB）。

    | 型號 | RAM | 適用程度 |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | 最佳 |
    | Pi 4 | 4 GB | 良好 |
    | Pi 4 | 2 GB | 尚可，請加入交換空間 |
    | Pi 4 | 1 GB | 吃緊 |
    | Pi 3B+ | 1 GB | 緩慢 |
    | Pi Zero 2 W | 512 MB | 不建議 |

    絕對最低需求：1 GB RAM、1 個核心、500 MB 可用磁碟空間、64 位元作業系統。由於 Pi 只執行
    閘道（模型會呼叫雲端 API），即使規格普通的 Pi 也能處理此負載。

    小型 Pi／VPS 也可以只託管閘道，而你可在
    筆記型電腦／手機上配對**節點**，用於本機螢幕／相機／畫布或命令執行。請參閱[節點](/zh-TW/nodes)。

    完整設定逐步指南：[Raspberry Pi](/zh-TW/install/raspberry-pi)。

  </Accordion>

  <Accordion title="安裝在 Raspberry Pi 時有什麼建議？">
    - 使用 **64 位元**作業系統；請勿使用 32 位元 Raspberry Pi OS。
    - 在 2 GB 或更小容量的開發板上加入交換空間。
    - 為了效能與使用壽命，優先使用 **USB SSD**，不要使用 SD 卡。
    - 優先使用可修改的（git）安裝方式，以便查看日誌並快速更新。
    - 一開始不要啟用頻道／Skills，之後再逐一加入。
    - 異常的二進位檔失敗（「exec format error」）通常是因為某個選用 Skills 工具缺少 ARM64 版本。

    完整指南：[Raspberry Pi](/zh-TW/install/raspberry-pi)。另請參閱 [Linux](/zh-TW/platforms/linux)。

  </Accordion>

  <Accordion title="卡在「醒來吧，我的朋友」／新手引導無法孵化。該怎麼辦？">
    該畫面取決於閘道是否可連線且已通過驗證。設定模型提供者後，終端介面也會在首次孵化時
    自動傳送「醒來吧，我的朋友！」。如果
    你略過模型／驗證設定，新手引導會顯示「缺少模型驗證」提示，並在不傳送任何內容的情況下開啟
    終端介面——請使用 `openclaw configure --section model` 加入提供者。
    如果你看到喚醒訊息但**沒有回覆**，而且權杖數量維持為 0，表示代理程式從未執行。

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

    3. 仍然卡住？請執行：

    ```bash
    openclaw doctor
    ```

    如果閘道位於遠端，請確認通道／Tailscale 連線已啟動，且 UI
    指向正確的閘道。請參閱[遠端存取](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="可以將設定移轉到新機器，而不必重新執行新手引導嗎？">
    可以。複製**狀態目錄**與**工作區**，然後執行一次 Doctor：

    1. 在新機器上安裝 OpenClaw。
    2. 從舊機器複製 `$OPENCLAW_STATE_DIR`（預設：`~/.openclaw`）。
    3. 複製你的工作區（預設：`~/.openclaw/workspace`）。
    4. 執行 `openclaw doctor`，然後重新啟動閘道服務。

    這會保留設定、驗證設定檔、WhatsApp 認證資訊、工作階段與記憶——只要同時複製
    **兩個**位置，就能讓你的機器人維持完全相同的狀態。在遠端模式中，
    閘道主機擁有工作階段儲存區與工作區。

    **重要：**如果你只將工作區提交／推送至 GitHub，備份的只有
    **記憶與啟動程序檔案**，不包含工作階段歷程或驗證資料。這些資料位於
    `~/.openclaw/` 下（例如 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`）。

    相關內容：[移轉](/zh-TW/install/migrating)、[磁碟上的資料儲存位置](/zh-TW/help/faq#where-things-live-on-disk)、
    [代理程式工作區](/zh-TW/concepts/agent-workspace)、[Doctor](/zh-TW/gateway/doctor)、
    [遠端模式](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="要在哪裡查看最新版本的新內容？">
    查看 GitHub 變更日誌：
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    最新項目位於最上方。如果頂端區段是**尚未發布**，則下一個附有日期的
    區段就是最新發布的版本。項目會分為**重點**、**變更**
    與**修正**（並視需要加入文件／其他區段）。

  </Accordion>

  <Accordion title="無法存取 docs.openclaw.ai（SSL 錯誤）">
    部分 Comcast/Xfinity 連線會被 Xfinity
    Advanced Security 錯誤封鎖 `docs.openclaw.ai`。請停用此功能或將 `docs.openclaw.ai` 加入允許清單，然後重試。請協助我們
    解除封鎖：[https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

    仍遭封鎖？文件也同步提供於 GitHub：
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="穩定版與測試版的差異">
    **穩定版**和**測試版**是 **npm dist-tags**，並非不同的程式碼分支：

    - `latest` = 穩定版
    - `beta` = 供測試使用的早期建置版本（當測試版不存在或比目前的穩定版本更舊時，會回退至 `latest`）

    穩定版本通常會先發布至**測試版**，接著透過明確的升級步驟，
    將同一版本移至 `latest`，而不變更版本號碼。維護者
    也可以直接發布至 `latest`。因此，升級後測試版與穩定版可能指向
    **同一版本**。

    查看變更內容：[CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)。

    如需安裝單行指令，以及測試版與開發版之間的差異，請參閱下一個摺疊區塊。

  </Accordion>

  <Accordion title="如何安裝測試版？測試版與開發版有何差異？">
    **測試版**是 npm dist-tag `beta`（升級後可能與 `latest` 相同）。
    **開發版**是持續變動的 `main`（git）最新版本；發布至 npm 時使用 dist-tag `dev`。

    單行指令（macOS/Linux）：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows 安裝程式（PowerShell）：`iwr -useb https://openclaw.ai/install.ps1 | iex`

    詳細資訊：[開發頻道](/zh-TW/install/development-channels)與[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="如何試用最新版本？">
    有兩種選擇：

    1. **開發頻道（現有安裝）：**

    ```bash
    openclaw update --channel dev
    ```

    這會切換至 `main` 的 git 簽出版本、以遠端上游為基準進行 rebase、執行建置，並從該簽出版本
    安裝命令列介面。

    2. **可修改的（git）安裝（全新電腦）：**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    建議手動複製儲存庫：

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    文件：[更新](/zh-TW/cli/update)、[開發頻道](/zh-TW/install/development-channels)、[安裝](/zh-TW/install)。

  </Accordion>

  <Accordion title="安裝與初始設定通常需要多久？">
    大致時間：

    - **安裝：**2-5 分鐘。
    - **快速入門初始設定：**數分鐘（回送閘道、自動權杖、預設工作區）。
    - **進階／完整初始設定：**若供應商登入、頻道配對、常駐程式安裝、網路下載或 Skills 需要額外設定，所需時間會更長。

    精靈一開始就會顯示此時間表。你可以略過選用步驟，稍後再使用
    `openclaw configure` 返回設定。

    卡住了嗎？請參閱上方的[我卡住了](#quick-start-and-first-run-setup)。

  </Accordion>

  <Accordion title="安裝程式卡住了？如何取得更多資訊？">
    使用 `--verbose` 重新執行：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` 沒有專用的詳細輸出開關；請改用 `Set-PSDebug -Trace 1` /
    `-Trace 0` 包裝執行。完整旗標參考：[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="Windows 安裝顯示找不到 git 或無法辨識 openclaw">
    Windows 常見的兩個問題：

    **1) npm 錯誤 spawn git／找不到 git**

    - 安裝 **Git for Windows**，並確認 `git` 位於 PATH 中。
    - 關閉並重新開啟 PowerShell，然後重新執行安裝程式。

    **2) 安裝後無法辨識 openclaw**

    - 你的 npm 全域二進位檔資料夾不在 PATH 中。
    - 檢查方式：`npm config get prefix`。
    - 將該目錄加入你的使用者 PATH（不需要 `\bin` 後綴；在大多數系統上，該目錄是 `%AppData%\npm`）。
    - 關閉並重新開啟 PowerShell。

    偏好桌面應用程式？請使用 **Windows Hub**。若只使用終端機設定：PowerShell
    安裝程式與 WSL2 閘道路徑皆受支援。文件：[Windows](/zh-TW/platforms/windows)。

  </Accordion>

  <Accordion title="Windows exec 輸出顯示亂碼的中文文字，該怎麼辦？">
    這通常是原生 Windows shell 的主控台字碼頁不相符所致。

    症狀：`system.run`/`exec` 輸出中的中文顯示為亂碼；同一個命令在另一個終端機設定檔中
    則顯示正常。

    PowerShell 中的因應方式：

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    接著重新啟動閘道並重試：

    ```powershell
    openclaw gateway restart
    ```

    在最新版 OpenClaw 上仍會重現此問題嗎？請追蹤／回報：[議題 #30640](https://github.com/openclaw/openclaw/issues/30640)。

  </Accordion>

  <Accordion title="文件沒有回答我的問題，如何取得更好的答案？">
    使用可修改的（git）安裝方式，讓本機具有完整的原始碼和文件，接著**從該資料夾**
    詢問你的機器人（或 Claude/Codex），使其能讀取儲存庫並精確回答。

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    更多詳細資訊：[安裝](/zh-TW/install)和[安裝程式旗標](/zh-TW/install/installer)。

  </Accordion>

  <Accordion title="如何在 Linux 上安裝 OpenClaw？">
    - Linux 快速流程與服務安裝：[Linux](/zh-TW/platforms/linux)。
    - 完整操作說明：[開始使用](/zh-TW/start/getting-started)。
    - 安裝程式與更新：[安裝與更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="如何在 VPS 上安裝 OpenClaw？">
    任何 Linux VPS 都可以使用。在伺服器上安裝，然後透過 SSH/Tailscale 連線至閘道。

    指南：[exe.dev](/zh-TW/install/exe-dev)、[Hetzner](/zh-TW/install/hetzner)、[Fly.io](/zh-TW/install/fly)。
    遠端存取：[遠端閘道](/zh-TW/gateway/remote)。

  </Accordion>

  <Accordion title="雲端／VPS 安裝指南在哪裡？">
    常見供應商的代管中心：

    - [VPS 代管](/zh-TW/vps)（所有供應商集中一處）
    - [Fly.io](/zh-TW/install/fly)
    - [Hetzner](/zh-TW/install/hetzner)
    - [exe.dev](/zh-TW/install/exe-dev)

    在雲端環境中，**閘道會在伺服器上執行**，而你可從筆記型電腦／手機
    透過控制介面（或 Tailscale/SSH）存取。你的狀態與工作區位於伺服器上，因此
    請將主機視為唯一真實資料來源並加以備份。

    將**節點**（Mac/iOS/Android/無頭環境）與該雲端閘道配對，即可在閘道持續位於
    雲端的同時，使用筆記型電腦本機的螢幕／相機／畫布或執行命令。

    中心：[平台](/zh-TW/platforms)。遠端存取：[遠端閘道](/zh-TW/gateway/remote)。
    節點：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="我可以要求 OpenClaw 自行更新嗎？">
    可以，但不建議。更新流程可能會重新啟動閘道（中斷
    使用中的工作階段）、可能需要乾淨的 git 簽出，並且可能提示確認。
    由操作人員在 shell 中執行更新較為安全。

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    透過代理程式自動執行：

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    文件：[更新命令](/zh-TW/cli/update)、[更新方式](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="新手引導實際上會做什麼？">
    `openclaw onboard` 是建議的設定流程。在**本機模式**中，它會逐步引導你完成：

    1. **模型／驗證**－供應商 OAuth、API 金鑰或手動驗證（包括 LM Studio 等本機選項）；選擇預設模型。
    2. **工作區**－位置與啟動檔案。
    3. **閘道**－連接埠、繫結位址、驗證模式、Tailscale 對外公開。
    4. **頻道**－內建與官方外掛聊天頻道：iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp 等。
    5. **常駐程式**－LaunchAgent（macOS）、systemd 使用者單元（Linux/WSL2）或原生 Windows Scheduled Task。
    6. **健康狀態檢查**－啟動閘道並確認其正在執行。
    7. **Skills**－安裝建議的 Skills 和選用相依套件。

    它會先說明預估所需時間，並在你設定的模型未知
    或缺少驗證時發出警告。完整說明：[新手引導（命令列介面）](/zh-TW/start/wizard)。

  </Accordion>

  <Accordion title="執行此軟體需要 Claude 或 OpenAI 訂閱嗎？">
    不需要。你可以使用 **API 金鑰**（Anthropic/OpenAI/其他供應商）或**僅限本機的模型**
    執行 OpenClaw，讓資料留在你的裝置上。訂閱（Claude Pro/Max、ChatGPT/Codex）只是
    向這些供應商驗證身分的選用方式。

    對 Anthropic 而言：**API 金鑰**採用標準的隨用隨付計費；**Claude CLI**
    會重複使用同一主機上現有的 Claude Code 登入。目前 Anthropic 將
    Claude CLI 的非互動式 `claude -p` 路徑視為 Agent SDK／程式化使用方式，
    仍會計入你的訂閱方案限制；依賴訂閱行為前，請查閱目前的 Anthropic 計費
    文件。對於長期運作的閘道主機和共用自動化，Anthropic API 金鑰是較可預期的選擇。

    完整支援使用 OpenAI Codex OAuth（ChatGPT/Codex 訂閱）執行代理程式模型。
    OpenClaw 也支援採訂閱形式的代管選項，包括 **Qwen Cloud
    Coding Plan**、**MiniMax Coding Plan** 和 **Z.AI / GLM Coding Plan**。

    文件：[Anthropic](/zh-TW/providers/anthropic)、[OpenAI](/zh-TW/providers/openai)、
    [Qwen Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax)、[Z.AI（GLM）](/zh-TW/providers/zai)、
    [本機模型](/zh-TW/gateway/local-models)、[模型](/zh-TW/concepts/models)。

  </Accordion>

  <Accordion title="可以在沒有 API 金鑰的情況下使用 Claude Max 訂閱嗎？">
    可以。OpenClaw 支援重複使用 Claude CLI，適用於 Pro/Max/Team/Enterprise 方案。目前 Anthropic
    將 OpenClaw 使用的 `claude -p` 路徑視為受你方案限制的訂閱方案用量，
    而不是個別的免費額度；請參閱 [Anthropic](/zh-TW/providers/anthropic)，瞭解目前的計費詳細資訊及
    Anthropic 自有支援文章的連結。若要獲得最可預期的伺服器端設定，請改用
    Anthropic API 金鑰。
  </Accordion>

  <Accordion title="是否支援 Claude 訂閱驗證（Claude Pro 或 Max）？">
    支援，可透過重複使用 Claude CLI。Anthropic 對 `claude -p`/Agent SDK 用量的計費方式
    曾隨時間變更；依賴特定計費行為前，請參閱 [Anthropic](/zh-TW/providers/anthropic)，瞭解目前狀態及
    Anthropic 支援文章中附有日期的連結。

    Anthropic setup-token 認證仍是支援的權杖路徑，但在可用時，OpenClaw 偏好
    重複使用 Claude 命令列介面和 `claude -p`。對於正式環境或多使用者
    工作負載，Anthropic API 金鑰仍是更安全、更可預測的選擇。其他
    訂閱型託管選項：[OpenAI](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、
    [MiniMax](/zh-TW/providers/minimax)、[Z.AI (GLM)](/zh-TW/providers/zai)。

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="為什麼我會看到 Anthropic 傳回 HTTP 429 rate_limit_error？">
    你目前時段的 **Anthropic 配額／速率限制** 已用盡。在 **Claude
    命令列介面**上，請等待時段重設或升級方案。若使用 **Anthropic API 金鑰**，
    請在 Anthropic Console 中檢查用量／帳務，並視需要提高限制。

    如果訊息明確為 `Extra usage is required for long context requests`，
    表示要求正嘗試使用 Anthropic 的 1M 上下文視窗（支援正式可用的 1M Claude 4.x
    模型，或舊版 `params.context1m: true` 設定），而你目前的認證資訊
    不符合長上下文計費資格。

    設定**備援模型**，讓供應商受到速率限制時 OpenClaw 仍能持續回覆。
    請參閱[模型](/zh-TW/cli/models)、[OAuth](/zh-TW/concepts/oauth)和
    [Anthropic 長上下文需要額外用量時的 429 錯誤](/zh-TW/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

  </Accordion>

  <Accordion title="支援 AWS Bedrock 嗎？">
    支援。OpenClaw 隨附 **Amazon Bedrock (Converse)** 供應商。當存在 AWS 環境
    標記（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE`、`AWS_BEARER_TOKEN_BEDROCK`）時，
    OpenClaw 會自動啟用隱含的 Bedrock 供應商以探索模型；否則，
    請設定 `plugins.entries.amazon-bedrock.config.discovery.enabled: true` 或新增手動
    供應商項目。請參閱 [Amazon Bedrock](/zh-TW/providers/bedrock)和[模型供應商](/zh-TW/providers/models)。
    如果你偏好受管理的金鑰流程，在 Bedrock 前方使用 OpenAI 相容的 Proxy 仍是有效選項。
  </Accordion>

  <Accordion title="Codex 認證如何運作？">
    OpenClaw 透過 OAuth（ChatGPT 登入）支援 **OpenAI Codex**。全新的
    設定若沒有主要模型，會使用確切的 `openai/gpt-5.6-sol` 進行
    ChatGPT/Codex 訂閱認證，並採用原生 Codex app-server 執行。
    重新認證會保留現有的明確模型，包括
    `openai/gpt-5.5`。如果 Codex 工作區未提供 GPT-5.6，請明確選取
    `openai/gpt-5.5`；OpenClaw 不會在未告知的情況下降級。舊版
    Codex 前綴模型參照屬於舊版設定，會由 `openclaw doctor
    --fix` 修復。對於非代理程式的 OpenAI
    API 介面，仍可直接使用 OpenAI API 金鑰；透過已排序的 `openai` API 金鑰設定檔，
    代理程式模型也能使用。請參閱[模型供應商](/zh-TW/concepts/model-providers)和
    [初始設定（命令列介面）](/zh-TW/start/wizard)。
  </Accordion>

  <Accordion title="為什麼 OpenClaw 仍會提到舊版 OpenAI Codex 前綴？">
    `openai` 是 OpenAI API 金鑰和 ChatGPT/Codex OAuth 目前共用的供應商與
    認證設定檔 ID，OpenAI Codex 已整合至其中。你仍可能在舊版設定和遷移警告中
    看到舊版 `openai-codex` 前綴：

    - `openai/gpt-5.6-sol` = 使用原生 Codex 執行階段處理代理程式回合的全新 ChatGPT/Codex 訂閱設定。
    - `openai/gpt-5.5` = 適用於現有設定或無法存取 GPT-5.6 之帳號的明確支援選項。
    - 舊版 `openai-codex/*` 模型參照 = 由 `openclaw doctor --fix` 修復的舊版路由。
    - `openai/gpt-5.5` 加上已排序的 `openai` API 金鑰設定檔 = OpenAI 代理程式模型的 API 金鑰認證。
    - 舊版 `openai-codex` 認證設定檔 ID = 由 `openclaw doctor --fix` 遷移的舊版 ID。

    想直接使用 OpenAI Platform 計費？請設定 `OPENAI_API_KEY`。想使用 ChatGPT/Codex
    訂閱認證？請執行 `openclaw models auth login --provider openai`。請將
    模型參照保留在標準 `openai/*` 供應商下。全新的訂閱
    設定會使用確切的 `openai/gpt-5.6-sol`；doctor 會修復使用舊版 Codex 前綴的
    參照，但不會升級明確選取的 `openai/gpt-5.5`。

  </Accordion>

  <Accordion title="為什麼 Codex OAuth 限制可能與 ChatGPT 網頁版不同？">
    Codex OAuth 使用由 OpenAI 管理、依方案而定的配額時段；即使是同一帳號，
    也可能與 ChatGPT 網站／應用程式的使用體驗不同。

    `openclaw models status` 會顯示目前可見的供應商用量／配額時段，但
    不會憑空建立權益，也不會將 ChatGPT 網頁版權益正規化為直接 API 存取權。若要使用
    OpenAI Platform 的直接計費／限制路徑，請搭配 API 金鑰使用 `openai/*`。

  </Accordion>

  <Accordion title="支援 OpenAI 訂閱認證（Codex OAuth）嗎？">
    支援，而且是完整支援。OpenAI 明確允許在 OpenClaw 等外部
    工具／工作流程中使用訂閱 OAuth。初始設定可代你執行 OAuth 流程。

    請參閱 [OAuth](/zh-TW/concepts/oauth)、[模型供應商](/zh-TW/concepts/model-providers)和[初始設定（命令列介面）](/zh-TW/start/wizard)。

  </Accordion>

  <Accordion title="如何設定 Gemini 命令列介面 OAuth？">
    Gemini 命令列介面使用**外掛認證流程**，而不是 `openclaw.json` 中的用戶端 ID 或密鑰。

    1. 在本機安裝 Gemini 命令列介面，讓 `gemini` 位於 `PATH`：
       - Homebrew：`brew install gemini-cli`
       - npm：`npm install -g @google/gemini-cli`
    2. 啟用外掛：`openclaw plugins enable google`
    3. 登入：`openclaw models auth login --provider google-gemini-cli --set-default`
    4. 登入後的預設模型：`google/gemini-3.1-pro-preview`（執行階段 `google-gemini-cli`）
    5. 登入後要求失敗？請在閘道主機上設定 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`，然後重試。

    OAuth 權杖會儲存在閘道主機上的認證設定檔中。詳細資訊：[Google](/zh-TW/providers/google)、[模型供應商](/zh-TW/concepts/model-providers)。

  </Accordion>

  <Accordion title="本機模型適合日常聊天嗎？">
    通常不適合。OpenClaw 需要大型上下文和強健的安全能力；小型顯示卡會截斷上下文，
    並略過供應商端的安全篩選器。如果你一定要使用，請在本機執行可用的**最大型**模型版本
    （LM Studio），請參閱[本機模型](/zh-TW/gateway/local-models)。較小型／量化的
    模型會提高提示詞注入風險，請參閱[安全性](/zh-TW/gateway/security)。
  </Accordion>

  <Accordion title="如何將託管模型流量保留在特定區域？">
    選擇鎖定區域的端點。OpenRouter 為 MiniMax、Kimi
    和 GLM 提供美國託管選項；請選擇美國託管版本，將資料保留在該區域內。你仍可使用
    `models.mode: "merge"` 同時列出 Anthropic/OpenAI，讓備援選項保持
    可用，同時遵守你選取的區域供應商。
  </Accordion>

  <Accordion title="必須購買 Mac Mini 才能安裝嗎？">
    不必。OpenClaw 可在 macOS 或 Linux 上執行（Windows 則透過 WSL2）。Mac mini 是熱門的
    常時開機主機選擇，但小型 VPS、家用伺服器或 Raspberry Pi 等級的裝置也可以。

    只有使用 **macOS 專用工具**時才需要 Mac。若要使用 iMessage，請在任何已登入 Messages 的 Mac 上，
    搭配 `imsg` 使用 [iMessage](/zh-TW/channels/imessage)；如果閘道在 Linux 或其他位置執行，
    請將 `channels.imessage.cliPath` 設為透過 SSH 在該 Mac 上執行 `imsg` 的包裝程式。對於其他
    macOS 專用工具，請在 Mac 上執行閘道，或配對 macOS 節點。

    文件：[iMessage](/zh-TW/channels/imessage)、[節點](/zh-TW/nodes)、[Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="支援 iMessage 需要 Mac mini 嗎？">
    你需要**某台 macOS 裝置**登入 Messages，但不一定是 Mac mini，任何
    Mac 都可以。請搭配 `imsg` 使用 [iMessage](/zh-TW/channels/imessage)；閘道可在該
    Mac 上執行，也可以透過 SSH 包裝程式 `cliPath` 在其他位置執行。

    常見設定：

    - 閘道位於 Linux/VPS，將 `channels.imessage.cliPath` 設為透過 SSH 在已登入 Messages 的 Mac 上執行 `imsg` 的包裝程式。
    - 所有元件都位於同一台 Mac，這是最簡單的單機設定。

    文件：[iMessage](/zh-TW/channels/imessage)、[節點](/zh-TW/nodes)、[Mac 遠端模式](/zh-TW/platforms/mac/remote)。

  </Accordion>

  <Accordion title="如果購買 Mac mini 執行 OpenClaw，可以將它連接到 MacBook Pro 嗎？">
    可以。**Mac mini 可以執行閘道**，而你的 MacBook Pro 則作為**節點**
    （搭配裝置）連線。節點不會執行閘道，而是新增
    螢幕／相機／畫布及該裝置上的 `system.run` 等功能。

    常見模式：閘道在常時開機的 Mac mini 上執行；MacBook Pro 執行 macOS 應用程式或
    節點主機，並與閘道配對。使用 `openclaw nodes status`／`openclaw nodes list` 檢查。

    文件：[節點](/zh-TW/nodes)、[節點命令列介面](/zh-TW/cli/nodes)。

  </Accordion>

  <Accordion title="可以使用 Bun 嗎？">
    你可以使用 Bun 安裝相依套件或執行套件指令碼。OpenClaw 命令列介面和
    閘道需要 **Node**，因為標準狀態儲存區使用 `node:sqlite`；Bun
    不提供該 API。
  </Accordion>

  <Accordion title="Telegram：allowFrom 應填入什麼？">
    `channels.telegram.allowFrom` 是**人類傳送者的 Telegram 使用者 ID**（數字），
    不是機器人使用者名稱。設定只會要求數字使用者 ID；`openclaw doctor --fix`
    可嘗試解析舊版 `@username` 項目。

    較安全（不使用第三方機器人）：私訊你的機器人，執行 `openclaw logs --follow`，讀取 `from.id`。

    官方 Bot API：私訊你的機器人，呼叫 `https://api.telegram.org/bot<bot_token>/getUpdates`，讀取 `message.from.id`。

    第三方（隱私性較低）：私訊 `@userinfobot` 或 `@getidsbot`。

    請參閱 [Telegram 存取控制](/zh-TW/channels/telegram#access-control-and-activation)。

  </Accordion>

  <Accordion title="多人可以使用同一個 WhatsApp 號碼搭配不同的 OpenClaw 執行個體嗎？">
    可以，請使用**多代理程式路由**。將每位傳送者的 WhatsApp 私訊（`peer: { kind: "direct", id: "+15551234567" }`）繫結至不同的 `agentId`，讓每個人都有自己的工作區和工作階段儲存區。回覆仍會來自**同一個 WhatsApp 帳號**；私訊存取控制（`channels.whatsapp.dmPolicy`／`channels.whatsapp.allowFrom`）對每個帳號皆為全域設定。請參閱[多代理程式路由](/zh-TW/concepts/multi-agent)和 [WhatsApp](/zh-TW/channels/whatsapp)。
  </Accordion>

  <Accordion title='可以同時執行「快速聊天」代理程式和「使用 Opus 寫程式」代理程式嗎？'>
    可以。使用多代理程式路由：為每個代理程式設定各自的預設模型，然後將傳入
    路由（供應商帳號或特定對象）繫結至各代理程式。設定範例：
    [多代理程式路由](/zh-TW/concepts/multi-agent)。另請參閱[模型](/zh-TW/concepts/models)和
    [設定](/zh-TW/gateway/configuration)。
  </Accordion>

  <Accordion title="Homebrew 可在 Linux 上運作嗎？">
    可以，請使用 Linuxbrew：

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    透過 systemd 執行 OpenClaw：請確保服務的 PATH 包含
    `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前綴），讓透過 `brew` 安裝的工具
    能在非登入 Shell 中解析。近期版本也會在 Linux
    systemd 服務中前置加入常見的使用者 bin 目錄（例如 `~/.local/bin`、`~/.npm-global/bin`、
    `~/.local/share/pnpm`、`~/.bun/bin`），並在設定時採用 `PNPM_HOME`、`NPM_CONFIG_PREFIX`、
    `BUN_INSTALL`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`NVM_DIR` 和 `FNM_DIR`。

  </Accordion>

  <Accordion title="可修改的 git 安裝與 npm 安裝有何不同">
    - **可修改（git）安裝：**完整的原始碼簽出，可供編輯，最適合貢獻者。你可在本機建置並修改程式碼／文件。
    - **npm 安裝：**全域命令列介面安裝，不含儲存庫，最適合“直接執行”。更新來自 npm dist-tags。

    文件：[開始使用](/zh-TW/start/getting-started)、[更新](/zh-TW/install/updating)。

  </Accordion>

  <Accordion title="之後可以在 npm 與 git 安裝之間切換嗎？">
    可以，請在現有安裝上使用 `openclaw update --channel ...`。這**不會
    刪除你的資料**——只有 OpenClaw 程式碼的安裝方式會變更。狀態（`~/.openclaw`）與
    工作區（`~/.openclaw/workspace`）都不受影響。

    從 npm 切換至 git：

    ```bash
    openclaw update --channel dev
    ```

    從 git 切換至 npm：

    ```bash
    openclaw update --channel stable
    ```

    加上 `--dry-run`，可先預覽規劃中的模式切換。更新程式會執行 Doctor
    後續作業、重新整理目標通道的外掛來源，並重新啟動閘道，
    除非你傳入 `--no-restart`。

    安裝程式也可以強制使用任一模式：

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    備份提示：[各項資料在磁碟上的位置](/zh-TW/help/faq#where-things-live-on-disk)。

  </Accordion>

  <Accordion title="應該在筆電還是 VPS 上執行閘道？">
    想要全天候可靠運作？請使用 **VPS**。想要最省事，而且可以接受
    睡眠與重新啟動造成的中斷？請在本機執行。

    **筆電（本機閘道）**

    - **優點：**無伺服器成本、可直接存取本機檔案、能看到即時瀏覽器視窗。
    - **缺點：**睡眠或網路中斷會導致連線中斷、作業系統更新或重新啟動會造成干擾，而且必須保持喚醒狀態。

    **VPS／雲端**

    - **優點：**持續運作、網路穩定、沒有筆電睡眠問題，也更容易維持運作。
    - **缺點：**通常沒有圖形介面（請使用螢幕截圖）、只能遠端存取檔案，且更新時需要 SSH。

    WhatsApp／Telegram／Slack／Mattermost／Discord 都能在 VPS 上正常運作——真正的
    取捨在於無圖形介面的瀏覽器與可見視窗之間。請參閱[瀏覽器](/zh-TW/tools/browser)。

    預設建議：如果你先前遇過閘道連線中斷，請使用 VPS；如果你正在使用 Mac，
    並希望存取本機檔案或進行可見瀏覽器介面自動化，本機執行會很合適。

  </Accordion>

  <Accordion title="在專用機器上執行 OpenClaw 有多重要？">
    這不是必要條件，但基於可靠性與隔離性，建議使用專用機器。

    - **專用主機（VPS／Mac mini／Raspberry Pi）：**持續運作、較少因睡眠或重新啟動而中斷、權限更單純，也更容易維持運作。
    - **共用筆電／桌上型電腦：**適合測試與主動使用，但機器進入睡眠或更新時可能會暫停運作。

    兼得兩者優點的方式：讓閘道在專用主機上運作，並將你的筆電配對為
    **節點**，以使用本機螢幕、相機與執行工具。請參閱[節點](/zh-TW/nodes)與[安全性](/zh-TW/gateway/security)。

  </Accordion>

  <Accordion title="VPS 的最低需求與建議作業系統是什麼？">
    - **絕對最低需求：**1 個 vCPU、1 GB RAM、約 500 MB 磁碟空間。
    - **建議：**1–2 個 vCPU、2 GB 以上 RAM，以保留餘裕供記錄、媒體與多個通道使用。節點工具與瀏覽器自動化可能會耗用大量資源。

    作業系統：**Ubuntu LTS**（或任何現代版本的 Debian／Ubuntu）——這是經過最充分測試的 Linux 安裝方式。

    文件：[Linux](/zh-TW/platforms/linux)、[VPS 託管](/zh-TW/vps)。

  </Accordion>

  <Accordion title="可以在 VM 中執行 OpenClaw 嗎？需求是什麼？">
    可以。將 VM 視同 VPS：它必須持續開機、可供連線，並有足夠的 RAM
    供閘道及你啟用的所有通道使用。

    - **絕對最低需求：**1 個 vCPU、1 GB RAM。
    - **建議：**若要使用多個通道、瀏覽器自動化或媒體工具，建議配備 2 GB 以上 RAM。
    - **作業系統：**Ubuntu LTS 或其他現代版本的 Debian／Ubuntu。

    在 Windows 上，請使用 **Windows Hub** 進行桌面設定，或使用 WSL2 建立 Linux 風格的閘道 VM，
    以取得廣泛的工具相容性。請參閱 [Windows](/zh-TW/platforms/windows)、[VPS 託管](/zh-TW/vps)。
    若要在 VM 中執行 macOS，請參閱 [macOS VM](/zh-TW/install/macos-vm)。

  </Accordion>
</AccordionGroup>

## 相關內容

- [常見問題](/zh-TW/help/faq)——主要的常見問題集（模型、工作階段、閘道、安全性等）
- [安裝概覽](/zh-TW/install)
- [開始使用](/zh-TW/start/getting-started)
- [疑難排解](/zh-TW/help/troubleshooting)
