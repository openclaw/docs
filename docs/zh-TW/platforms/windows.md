---
read_when:
    - 在 Windows 上安裝 OpenClaw
    - 在 Windows Hub、原生 Windows 與 WSL2 之間做選擇
    - 設定 Windows 伴隨應用程式或 Windows 節點模式
summary: Windows 支援：Windows Hub、原生命令列介面與閘道、WSL2 閘道設定、節點模式及疑難排解
title: Windows
x-i18n:
    generated_at: "2026-07-12T14:36:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw 隨附原生 **Windows Hub** 夥伴應用程式，並支援 Windows 命令列介面。
若要使用具備設定、系統匣狀態、聊天、Command Center 診斷及 Windows 節點功能的桌面應用程式，請使用 Windows Hub。若要直接使用命令列介面／閘道，請使用 PowerShell
安裝程式。若要獲得與 Linux 相容性最高的閘道執行環境，請使用 WSL2。

## 建議：Windows Hub

Windows Hub 是適用於 Windows 10 20H2+ 與
Windows 11 的原生 WinUI 夥伴應用程式。它不需系統管理員權限即可安裝，並透過其專屬發布頁面提供已簽署的 x64
與 ARM64 安裝程式。

Windows Hub 的發布獨立於 OpenClaw 命令列介面與閘道。請從
[Windows Hub 發布頁面](https://github.com/openclaw/openclaw-windows-node/releases/latest)
下載最新的穩定版 Hub 安裝程式，或直接透過 `releases/latest/download` 下載：

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

如果上述連結傳回 404，請前往 [Windows Hub 發布頁面](https://github.com/openclaw/openclaw-windows-node/releases)
並開啟最新的 Windows Hub 穩定版本。一般的 OpenClaw 穩定版本
也會鏡像一個已鎖定版本且經發布驗證的 Windows Hub 組建；該鏡像可能會落後於
較新的獨立 Hub 版本。

安裝後，請從開始功能表或系統匣啟動 **OpenClaw Companion**。
安裝程式也會新增 Gateway Setup、Chat、Settings、
Check for Updates 及解除安裝的捷徑。

### Windows Hub 包含的功能

- 系統匣狀態與登入時啟動。
- 首次執行時設定由應用程式擁有的本機 WSL 閘道。
- 本機、遠端及透過 SSH 通道連線之閘道的連線設定。
- 原生聊天視窗，以及存取瀏覽器版控制介面。
- Command Center 可針對工作階段、用量、頻道、節點、配對
  及修復命令提供診斷。
- Windows 節點模式，可供代理程式控制畫布、螢幕、相機、
  通知、裝置狀態、對話及受控的 `system.run`。
- 適用於 Claude Desktop、Claude Code
  及 Cursor 等 MCP 用戶端的本機 MCP 伺服器模式。

### 首次啟動

首次啟動時，如果沒有可用的已儲存
閘道，Windows Hub 會開啟設定。最快的方式是 **Set up locally**，它會佈建由
應用程式擁有的 `OpenClawGateway` WSL 發行版、在其中安裝閘道，並
配對應用程式。這不會匯出或修改你現有的 Ubuntu 發行版。

如果你已有
閘道，請選擇 **Advanced setup** 或開啟 Connections 分頁。你可以連線至：

- 此電腦上的本機閘道
- 此電腦上的 WSL 閘道
- 透過 URL 與權杖或設定代碼連線的遠端閘道
- 透過 SSH 通道連線的閘道

設定完成後，系統匣圖示會變成綠色。請從
系統匣開啟 **Command Center**，確認連線、配對、節點狀態及頻道運作狀況。

## Windows 節點模式

Windows Hub 可註冊為 OpenClaw 節點，讓代理程式能透過閘道使用已宣告的
Windows 原生功能。節點命令必須由節點宣告，並經閘道原則允許後才能執行；完整的允許／拒絕模型請參閱
[節點](/zh-TW/nodes#command-policy)。

常用命令：

| 系列 | 命令                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| 畫布 | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| 螢幕 | `screen.snapshot`；`screen.record` 需要明確選擇啟用                                  |
| 相機 | `camera.list`；`camera.snap`, `camera.clip` 需要明確選擇啟用                         |
| 系統 | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| 裝置 | `location.get`, `device.info`, `device.status`                                       |
| 對話   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

節點模式需要與閘道配對。如果應用程式顯示配對要求，
請從閘道主機核准：

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

閘道只會轉送節點已宣告且伺服器原則
允許的命令。`screen.record`、`camera.snap`
及 `camera.clip` 等涉及隱私的命令，需要透過 `gateway.nodes.allowCommands` 明確選擇啟用。

## 本機 MCP 模式

Windows Hub 可在回送介面上，將相同的 Windows 原生功能登錄表公開為本機
MCP 伺服器，讓本機 MCP 用戶端無須執行 OpenClaw 閘道，也能驅動 Windows 功能。

請在 Windows Hub 的 Settings 中，於開發人員／進階區段下啟用此功能。
伺服器啟用後，應用程式會顯示回送端點與持有人權杖。

模式矩陣：

| 節點模式 | MCP 伺服器 | 行為                               |
| --------- | ---------- | ---------------------------------- |
| 關閉       | 關閉        | 僅限操作者使用的桌面應用程式          |
| 開啟        | 關閉        | 已連線閘道的 Windows 節點     |
| 關閉       | 開啟         | 僅限本機 MCP 伺服器              |
| 開啟        | 開啟         | 閘道節點加上本機 MCP 伺服器 |

## 原生 Windows 命令列介面與閘道

若偏好使用終端機，請從 PowerShell 安裝 OpenClaw：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

驗證：

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

在可用時，受管理的啟動方式會使用 Windows 排定的工作。該工作會將
可讀的 `gateway.cmd` 指令碼保留在 OpenClaw 狀態目錄中，但會透過產生的
`gateway.vbs` WScript 包裝程式來啟動，因此背景閘道
不會開啟可見的主控台視窗。如果建立工作遭拒，OpenClaw
會改用每位使用者的啟動資料夾登入項目。

安裝閘道服務：

```powershell
openclaw gateway install
openclaw gateway status --json
```

若僅使用命令列介面而不使用受管理的閘道服務：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 閘道

在 Windows 上，WSL2 仍是與 Linux 相容性最高的閘道執行環境。Windows
Hub 可以為你設定由應用程式擁有的 WSL 閘道，你也可以在自己的發行版中手動安裝。

手動設定：

```powershell
wsl --install
# 或明確選擇發行版：
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

接著依照 Linux 快速入門，在 WSL 內安裝 OpenClaw：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## 在 Windows 登入前自動啟動閘道

對於無頭 WSL 設定，請確保即使無人
登入 Windows，也會執行完整的開機鏈。

在 WSL 內：

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

在 PowerShell 中以系統管理員身分執行：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

請將 `Ubuntu` 替換成以下命令顯示的發行版名稱：

```powershell
wsl --list --verbose
```

<Note>
與舊版操作方式相比，有兩項變更：

- **使用 `dbus-launch true`，而非 `/bin/true`**：在 WSL >= 2.6.1.0 上有一個
  迴歸問題（[microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)），
  即使已啟用 linger，也會在最後一個用戶端結束後的 15-20 秒內
  因閒置而終止發行版。`dbus-launch true` 會讓 init 的子處理程序保持執行，
  作為因應措施（社群討論：[microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)）。
- **使用 `/ru "$env:USERNAME"`，而非 `/ru SYSTEM`**：每位使用者的 WSL 發行版（
  預設設定）對 SYSTEM 帳戶不可見，因此該工作看似
  已執行，但發行版從未啟動。使用你自己的帳戶執行可避免
  此問題；建立工作時，Windows 會提示你輸入密碼。

</Note>

重新開機後，從 WSL 驗證：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 透過區域網路公開 WSL 服務

WSL 擁有自己的虛擬網路。如果其他機器必須連線至
WSL 內的服務，請將 Windows 連接埠轉送至目前的 WSL IP。WSL IP 可能會在重新啟動後變更，因此請視需要更新轉送規則。

在 PowerShell 中以系統管理員身分執行的範例：

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

- 從其他機器進行 SSH 連線時，目標為 Windows 主機 IP，例如 `ssh user@windows-host -p 2222`。
- 遠端節點必須指向可連線的閘道 URL，而非 `127.0.0.1`。
- 若要允許區域網路存取，請使用 `listenaddress=0.0.0.0`；若僅允許本機存取，請使用 `127.0.0.1`。

## 疑難排解

### 系統匣圖示未出現

請在工作管理員中檢查 `OpenClaw.Tray.WinUI.exe`。如果它正在執行，請開啟
隱藏的系統匣圖示區域並將其固定。如果沒有執行，請從
開始功能表啟動 **OpenClaw Companion**。

### 本機設定失敗

請從 Windows Hub 開啟設定記錄，或檢查：

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

常見原因：WSL 已停用、虛擬化遭封鎖、由應用程式擁有的 WSL
狀態過時，或安裝閘道套件時發生網路錯誤。

### 應用程式表示需要配對

請從閘道核准操作者或節點要求：

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

如果裝置已有權杖，請在核准後從 Connections 分頁重新連線。

### 網頁聊天無法連線至遠端閘道

遠端網頁聊天需要 HTTPS 或 localhost。若使用自我簽署的憑證，請在 Windows 中信任
該憑證，或使用連至 localhost URL 的 SSH 通道。

### `screen.snapshot`、相機或音訊命令失敗

請確認 Windows 的相機、麥克風、螢幕擷取及
通知權限。封裝式安裝會宣告受保護的功能，但
Windows 仍可能在命令首次使用這些功能時顯示提示。

### Git 或 GitHub 連線失敗

某些網路會封鎖或限速連至 GitHub 的 HTTPS。如果 `git clone` 或
`gh auth login` 失敗，請嘗試其他網路、VPN 或 HTTP/HTTPS Proxy。

若要在目前工作階段中使用權杖進行 `gh` 驗證：

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

絕不可提交權杖，或將其貼到議題或提取要求中。

## 相關內容

- [安裝概觀](/zh-TW/install)
- [Node.js 設定](/zh-TW/install/node)
- [節點](/zh-TW/nodes)
- [控制介面](/zh-TW/web/control-ui)
- [閘道設定](/zh-TW/gateway/configuration)
