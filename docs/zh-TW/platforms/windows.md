---
read_when:
    - 在 Windows 上安裝 OpenClaw
    - 在 Windows Hub、原生 Windows 與 WSL2 之間選擇
    - 設定 Windows 伴隨應用程式或 Windows 節點模式
summary: Windows 支援：Windows Hub、原生命令列介面與閘道、WSL2 閘道設定、節點模式與疑難排解
title: Windows
x-i18n:
    generated_at: "2026-06-27T19:33:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw 隨附原生 **Windows Hub** 輔助應用程式，以及 Windows 命令列介面支援。
想要具備設定、系統匣狀態、聊天、命令中心診斷，以及 Windows 節點能力的桌面應用程式時，請使用 Windows Hub。想直接使用命令列介面/閘道時，請使用 PowerShell
安裝程式。想要最相容於 Linux 的閘道執行階段時，請使用 WSL2。

## 建議：Windows Hub

Windows Hub 是適用於 Windows 10 20H2+ 與 Windows 11 的原生 WinUI 輔助應用程式。它不需要系統管理員權限即可安裝，並在 OpenClaw 發行版本中提供已簽署的
x64 與 ARM64 安裝程式。

從 [OpenClaw 發行版本頁面](https://github.com/openclaw/openclaw/releases)下載最新穩定版安裝程式：

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [總和檢查碼](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

如果上方下載連結回傳 404，請前往[發行版本頁面](https://github.com/openclaw/openclaw/releases)，並在最新發行版本中尋找 `OpenClawCompanion-Setup-*` 資產。

安裝後，從開始功能表或系統匣啟動 **OpenClaw Companion**。安裝程式也會新增閘道設定、聊天、設定、
檢查更新，以及解除安裝的捷徑。

### Windows Hub 包含的內容

- 系統匣狀態與登入時啟動
- 本機應用程式擁有的 WSL 閘道首次執行設定
- 本機、遠端與 SSH 通道閘道的連線設定
- 原生聊天視窗，以及瀏覽器控制介面存取
- 針對工作階段、用量、通道、節點、配對與
  修復命令的命令中心診斷
- Windows 節點模式，可供代理控制畫布、螢幕、攝影機、通知、
  裝置狀態、文字轉語音、語音轉文字，以及受控的 `system.run`
- 適用於 Claude Desktop、Claude Code 與
  Cursor 等 MCP 用戶端的本機 MCP 伺服器模式

### 首次啟動

首次啟動時，如果沒有可用的已儲存閘道，Windows Hub 會開啟設定。
最快的路徑是 **在本機設定**，這會佈建由應用程式擁有的
`OpenClawGateway` WSL 發行版、在其中安裝閘道，並配對應用程式。
這不會匯出或修改你現有的 Ubuntu 發行版。

如果你已有閘道，請選擇 **進階設定** 或開啟連線分頁。你可以連線到：

- 這台電腦上的本機閘道
- 這台電腦上的 WSL 閘道
- 透過 URL 與權杖或設定碼連線的遠端閘道
- 透過 SSH 通道存取的閘道

設定完成後，系統匣圖示會變成綠色。從系統匣開啟 **命令中心**，以確認連線、配對、節點狀態與通道健康狀態。

## Windows 節點模式

Windows Hub 可以註冊為一等 OpenClaw 節點。代理之後就能透過閘道使用
已宣告的 Windows 原生能力。

常見命令包括：

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot`，以及在明確選擇加入後使用 `screen.record`
- `camera.list`，以及在明確選擇加入後使用 `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

節點模式需要閘道配對。如果應用程式顯示配對要求，請從閘道主機核准：

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

閘道只會轉送節點宣告且伺服器政策允許的命令。
隱私敏感命令，例如 `screen.record`, `camera.snap` 與
`camera.clip`，需要明確在 `gateway.nodes.allowCommands` 選擇加入。

## 本機 MCP 模式

Windows Hub 可以將相同的 Windows 原生能力登錄檔作為迴送上的本機
MCP 伺服器公開。當你想讓本機 MCP 用戶端在沒有執行 OpenClaw 閘道的情況下驅動
Windows 能力時，這很實用。

在 Windows Hub 設定的開發者/進階區段中啟用它。伺服器啟用後，應用程式會顯示迴送端點與持有人權杖。

模式矩陣：

| 節點模式 | MCP 伺服器 | 行為                               |
| -------- | ---------- | ---------------------------------- |
| 關閉     | 關閉       | 僅供操作員使用的桌面應用程式       |
| 開啟     | 關閉       | 已連線到閘道的 Windows 節點        |
| 關閉     | 開啟       | 僅本機 MCP 伺服器                  |
| 開啟     | 開啟       | 閘道節點加本機 MCP 伺服器          |

## 原生 Windows 命令列介面與閘道

若要以終端機優先的方式使用，請從 PowerShell 安裝 OpenClaw：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

驗證：

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

原生 Windows 命令列介面與閘道流程受到支援，並會持續改善。
受管理啟動會在可用時使用 Windows 排定工作。該工作會在 OpenClaw 狀態目錄中保留可讀的
`gateway.cmd` 指令碼，但會透過產生的 `gateway.vbs` WScript 包裝器啟動它，讓背景閘道不會開啟
可見的主控台視窗。如果工作建立遭拒，OpenClaw 會退回使用
每位使用者的 Startup 資料夾登入項目。

若要安裝閘道服務：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果你只想使用命令列介面，而不需要受管理的閘道服務：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 閘道

WSL2 仍然是 Windows 上最相容於 Linux 的閘道執行階段。Windows Hub
可以為你設定由應用程式擁有的 WSL 閘道，或者你也可以在自己的發行版內手動安裝。

手動設定：

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

在 WSL 內啟用 systemd：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

從 PowerShell 重新啟動 WSL：

```powershell
wsl --shutdown
```

接著使用 Linux 快速入門在 WSL 內安裝 OpenClaw：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows 登入前自動啟動閘道

對於無頭 WSL 設定，請確保即使沒有人登入 Windows，完整啟動鏈也會執行。

在 WSL 內：

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

以系統管理員身分在 PowerShell 中執行：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

將 `Ubuntu` 替換為此命令中的發行版名稱：

```powershell
wsl --list --verbose
```

> **注意：** 與舊版做法相比有兩項變更：
>
> - **使用 `dbus-launch true` 而不是 `/bin/true`** — 在 WSL ≥ 2.6.1.0 中，一項迴歸問題（[microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)）會導致發行版在最後一個用戶端結束後 15–20 秒閒置終止，即使已啟用 linger 也是如此。`dbus-launch true` 會讓 init 的子程序保持存活，作為因應措施（[社群討論，microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)）。
> - **使用 `/ru "$env:USERNAME"` 而不是 `/ru SYSTEM`** — 每位使用者的 WSL 發行版（預設設定）對 SYSTEM 帳戶不可見；工作看起來會執行，但發行版從未啟動。以你自己的帳戶執行可避免此問題。建立工作時，Windows 會提示輸入你的密碼。

重新開機後，從 WSL 驗證：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 透過 LAN 公開 WSL 服務

WSL 有自己的虛擬網路。如果另一台機器必須連到 WSL 內的服務，
請將 Windows 連接埠轉送到目前的 WSL IP。WSL IP 可能會在重新啟動後變更，
因此請在需要時重新整理轉送規則。

以系統管理員身分在 PowerShell 中執行的範例：

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

注意事項：

- 從另一台機器進行 SSH 時，目標是 Windows 主機 IP，例如
  `ssh user@windows-host -p 2222`。
- 遠端節點必須指向可連線的閘道 URL，而不是 `127.0.0.1`。
- LAN 存取請使用 `listenaddress=0.0.0.0`。僅限本機存取請使用 `127.0.0.1`。

## 疑難排解

### 系統匣圖示未出現

在工作管理員中檢查 `OpenClaw.Tray.WinUI.exe`。如果它正在執行，請開啟
隱藏的系統匣圖示區域並釘選它。如果它未執行，請從開始功能表啟動 **OpenClaw
Companion**。

### 本機設定失敗

從 Windows Hub 開啟設定記錄，或檢查：

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

常見原因包括 WSL 已停用、虛擬化被封鎖、應用程式擁有的 WSL
狀態過舊，或安裝閘道套件時發生網路故障。

### 應用程式指出需要配對

從閘道核准操作員或節點要求：

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

如果裝置已有權杖，請在核准後從連線分頁重新連線。

### 網頁聊天無法連到遠端閘道

遠端網頁聊天需要 HTTPS 或 localhost。對於自我簽署憑證，請在 Windows 中信任
該憑證，或使用 SSH 通道連到 localhost URL。

### `screen.snapshot`、攝影機或音訊命令失敗

確認 Windows 對攝影機、麥克風、螢幕擷取與
通知的權限。封裝安裝會宣告受保護的能力，但 Windows
仍可能在命令首次使用它們時提示。

### Git 或 GitHub 連線失敗

有些網路會封鎖或限速連到 GitHub 的 HTTPS。如果 `git clone` 或 `gh auth
login` 失敗，請嘗試其他網路、VPN，或 HTTP/HTTPS Proxy。

若要在目前工作階段使用權杖式 `gh` 驗證：

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

絕不要提交權杖，或將它們貼到議題或拉取要求中。

## 相關

- [安裝概觀](/zh-TW/install)
- [Node.js 設定](/zh-TW/install/node)
- [節點](/zh-TW/nodes)
- [控制介面](/zh-TW/web/control-ui)
- [閘道組態](/zh-TW/gateway/configuration)
