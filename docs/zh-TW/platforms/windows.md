---
read_when:
    - 在 Windows 上安裝 OpenClaw
    - 在 Windows Hub、原生 Windows 和 WSL2 之間選擇
    - 設定 Windows 輔助應用程式或 Windows 節點模式
summary: Windows 支援：Windows Hub、原生命令列介面與閘道、WSL2 閘道設定、節點模式與疑難排解
title: Windows
x-i18n:
    generated_at: "2026-07-05T11:27:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1823abb4964082d1048cb80861fe1b6672e6709f29c875f98e503265b261e740
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw 隨附原生 **Windows Hub** 輔助應用程式，以及 Windows 命令列介面支援。
桌面應用程式請使用 Windows Hub，它提供設定、系統匣狀態、聊天、命令中心診斷，以及 Windows 節點功能。若要直接使用命令列介面/閘道，請使用 PowerShell
安裝程式。若要取得最相容於 Linux 的閘道執行環境，請使用 WSL2。

## 建議：Windows Hub

Windows Hub 是適用於 Windows 10 20H2+ 和
Windows 11 的原生 WinUI 輔助應用程式。它不需要系統管理員權限即可安裝，並在 OpenClaw 發行版本中提供已簽署的
x64 和 ARM64 安裝程式。

從
[OpenClaw 發行版本頁面](https://github.com/openclaw/openclaw/releases)下載最新穩定版安裝程式，或
直接透過 `releases/latest/download` 下載：

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)
- [校驗和](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-SHA256SUMS.txt)

如果上方連結回傳 404，請前往 [發行版本頁面](https://github.com/openclaw/openclaw/releases)
並在最新發行版本中尋找 `OpenClawCompanion-Setup-*` 資產。

安裝後，從開始功能表或系統匣啟動 **OpenClaw Companion**。安裝程式也會新增閘道設定、聊天、設定、
檢查更新，以及解除安裝的捷徑。

### Windows Hub 包含的內容

- 系統匣狀態和登入時啟動。
- 本機應用程式擁有的 WSL 閘道首次執行設定。
- 本機、遠端和 SSH 通道閘道的連線設定。
- 原生聊天視窗，以及瀏覽器控制介面的存取入口。
- 命令中心診斷，用於工作階段、用量、頻道、節點、配對，
  以及修復命令。
- Windows 節點模式，支援由代理控制的畫布、螢幕、相機、
  通知、裝置狀態、語音，以及受控的 `system.run`。
- 適用於 Claude Desktop、Claude Code、
  Cursor 等 MCP 用戶端的本機 MCP 伺服器模式。

### 首次啟動

首次啟動時，如果沒有可用的已儲存閘道，Windows Hub 會開啟設定。最快的路徑是 **本機設定**，它會佈建一個
應用程式擁有的 `OpenClawGateway` WSL 發行版，在其中安裝閘道，並
配對應用程式。這不會匯出或修改你既有的 Ubuntu 發行版。

如果你已經有閘道，請選擇 **進階設定** 或開啟連線分頁。你可以連線到：

- 這台電腦上的本機閘道
- 這台電腦上的 WSL 閘道
- 透過 URL 和權杖或設定碼連線的遠端閘道
- 透過 SSH 通道抵達的閘道

設定完成後，系統匣圖示會變成綠色。從系統匣開啟 **命令中心**，確認連線、配對、節點狀態和頻道健康狀態。

## Windows 節點模式

Windows Hub 可以註冊為 OpenClaw 節點，讓代理透過閘道使用已宣告的
Windows 原生功能。節點命令必須由節點宣告，並且在執行前由閘道政策允許；完整的允許/拒絕模型請參閱
[節點](/zh-TW/nodes#command-policy)。

常用命令：

| 系列 | 命令                                                                                 |
| ---- | ------------------------------------------------------------------------------------ |
| 畫布 | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| 螢幕 | `screen.snapshot`; `screen.record` 需要明確選擇加入                                  |
| 相機 | `camera.list`; `camera.snap`, `camera.clip` 需要明確選擇加入                         |
| 系統 | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| 裝置 | `location.get`, `device.info`, `device.status`                                       |
| 語音 | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

節點模式需要閘道配對。如果應用程式顯示配對請求，請從閘道主機核准它：

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

閘道只會轉送節點宣告且伺服器政策允許的命令。隱私敏感命令，例如 `screen.record`、`camera.snap`
和 `camera.clip`，需要明確設定 `gateway.nodes.allowCommands` 選擇加入。

## 本機 MCP 模式

Windows Hub 可以在 local loopback 上將同一組 Windows 原生功能登錄檔公開為本機
MCP 伺服器，讓本機 MCP 用戶端可以在沒有執行 OpenClaw 閘道的情況下驅動 Windows 功能。

在 Windows Hub 設定的開發者/進階區段中啟用它。伺服器啟用後，應用程式會顯示 loopback 端點和 bearer 權杖。

模式矩陣：

| 節點模式 | MCP 伺服器 | 行為                         |
| -------- | ---------- | ---------------------------- |
| 關閉     | 關閉       | 僅供操作者使用的桌面應用程式 |
| 開啟     | 關閉       | 連線到閘道的 Windows 節點    |
| 關閉     | 開啟       | 僅本機 MCP 伺服器            |
| 開啟     | 開啟       | 閘道節點加本機 MCP 伺服器    |

## 原生 Windows 命令列介面與閘道

若偏好終端機優先使用方式，請從 PowerShell 安裝 OpenClaw：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

驗證：

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

受管理啟動會在可用時使用 Windows 工作排程器。此工作會將可讀的 `gateway.cmd` 指令碼保留在 OpenClaw 狀態目錄中，但透過產生的 `gateway.vbs` WScript 包裝器啟動它，因此背景閘道不會開啟可見的主控台視窗。如果工作建立遭拒，OpenClaw
會退回使用每位使用者的啟動資料夾登入項目。

安裝閘道服務：

```powershell
openclaw gateway install
openclaw gateway status --json
```

若只使用命令列介面且不使用受管理的閘道服務：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 閘道

WSL2 仍然是 Windows 上最相容於 Linux 的閘道執行環境。Windows
Hub 可以為你設定應用程式擁有的 WSL 閘道，或你也可以在自己的發行版中手動安裝。

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

然後使用 Linux 快速入門在 WSL 內安裝 OpenClaw：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows 登入前自動啟動閘道

對於無頭 WSL 設定，請確認即使沒有人登入 Windows，完整啟動鏈也會執行。

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

將 `Ubuntu` 替換為此命令列出的發行版名稱：

```powershell
wsl --list --verbose
```

<Note>
相較於舊做法有兩項變更：

- **使用 `dbus-launch true` 而不是 `/bin/true`**：在 WSL >= 2.6.1.0 上有一個
  迴歸問題（[microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)），
  即使啟用了 linger，也會在最後一個用戶端結束後 15-20 秒閒置終止發行版。`dbus-launch true` 會保留一個 init 子程序存活
  作為因應方式（社群討論，[microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)）。
- **使用 `/ru "$env:USERNAME"` 而不是 `/ru SYSTEM`**：每位使用者的 WSL 發行版（
  預設設定）對 SYSTEM 帳號不可見，因此工作看似已執行，
  但發行版從未啟動。以你自己的帳號執行可避免
  這個問題；Windows 會在建立工作時提示輸入密碼。

</Note>

重新開機後，從 WSL 驗證：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 透過 LAN 公開 WSL 服務

WSL 有自己的虛擬網路。如果另一台機器必須連到
WSL 內的服務，請將 Windows 連接埠轉送到目前的 WSL IP。WSL IP 可能在重新啟動後
變更，因此需要時請重新整理轉送規則。

以系統管理員身分在 PowerShell 中執行範例：

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

- 從另一台機器 SSH 時，目標是 Windows 主機 IP，例如 `ssh user@windows-host -p 2222`。
- 遠端節點必須指向可連線的閘道 URL，而不是 `127.0.0.1`。
- LAN 存取使用 `listenaddress=0.0.0.0`，僅限本機存取使用 `127.0.0.1`。

## 疑難排解

### 系統匣圖示未出現

在工作管理員中檢查 `OpenClaw.Tray.WinUI.exe`。如果它正在執行，請開啟
隱藏的系統匣圖示區域並釘選它。如果沒有執行，請從
開始功能表啟動 **OpenClaw Companion**。

### 本機設定失敗

從 Windows Hub 開啟設定記錄，或檢查：

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

常見原因：WSL 已停用、虛擬化遭封鎖、應用程式擁有的 WSL
狀態過期，或安裝閘道套件時發生網路失敗。

### 應用程式顯示需要配對

從閘道核准操作者或節點請求：

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

如果裝置已經有權杖，請在核准後從連線分頁重新連線。

### 網頁聊天無法連到遠端閘道

遠端網頁聊天需要 HTTPS 或 localhost。若使用自我簽署憑證，請在 Windows 中信任
該憑證，或使用 SSH 通道連到 localhost URL。

### `screen.snapshot`、相機或音訊命令失敗

確認 Windows 的相機、麥克風、螢幕擷取和
通知權限。封裝安裝會宣告受保護功能，但
Windows 仍可能在命令首次使用它們時提示。

### Git 或 GitHub 連線失敗

某些網路會封鎖或限制到 GitHub 的 HTTPS。如果 `git clone` 或
`gh auth login` 失敗，請嘗試其他網路、VPN，或 HTTP/HTTPS 代理。

在目前工作階段中使用權杖型 `gh` 驗證：

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

絕不要提交權杖，也不要將它們貼到議題或拉取請求中。

## 相關

- [安裝概觀](/zh-TW/install)
- [Node.js 設定](/zh-TW/install/node)
- [節點](/zh-TW/nodes)
- [控制介面](/zh-TW/web/control-ui)
- [閘道設定](/zh-TW/gateway/configuration)
