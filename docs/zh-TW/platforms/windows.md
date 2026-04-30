---
read_when:
    - 在 Windows 上安裝 OpenClaw
    - 在原生 Windows 與 WSL2 之間做選擇
    - 正在尋找 Windows 配套應用程式狀態
summary: Windows 支援：原生與 WSL2 安裝路徑、守護程式，以及目前的注意事項
title: Windows
x-i18n:
    generated_at: "2026-04-30T03:22:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw 同時支援 **原生 Windows** 與 **WSL2**。WSL2 是更
穩定的路徑，建議用於完整體驗：CLI、Gateway 和
工具都在 Linux 內執行，具備完整相容性。原生 Windows 可用於
核心 CLI 與 Gateway 使用，但有下列注意事項。

原生 Windows 配套應用程式已在規劃中。

## WSL2（建議）

- [入門](/zh-TW/start/getting-started)（在 WSL 內使用）
- [安裝與更新](/zh-TW/install/updating)
- 官方 WSL2 指南（Microsoft）：[https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## 原生 Windows 狀態

原生 Windows CLI 流程正在改善，但 WSL2 仍是建議路徑。

目前在原生 Windows 上運作良好的項目：

- 透過 `install.ps1` 使用網站安裝程式
- 本機 CLI 使用，例如 `openclaw --version`、`openclaw doctor` 和 `openclaw plugins list --json`
- 內嵌本機 agent/provider 煙霧測試，例如：

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

目前注意事項：

- `openclaw onboard --non-interactive` 仍預期可連線到本機 gateway，除非你傳入 `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` 和 `openclaw gateway install` 會先嘗試使用 Windows 排程工作
- 如果建立排程工作遭拒，OpenClaw 會退回使用每位使用者的啟動資料夾登入項目，並立即啟動 gateway
- 如果 `schtasks` 本身卡住或停止回應，OpenClaw 現在會快速中止該路徑並改用退回方案，而不是永遠停住
- 排程工作在可用時仍是偏好的方式，因為它們能提供更好的監督程式狀態

如果你只想使用原生 CLI，而不安裝 gateway 服務，請使用下列其中一種：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

如果你確實想在原生 Windows 上使用受管理的啟動：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果建立排程工作遭封鎖，退回服務模式仍會在登入後透過目前使用者的啟動資料夾自動啟動。

## Gateway

- [Gateway 執行手冊](/zh-TW/gateway)
- [設定](/zh-TW/gateway/configuration)

## Gateway 服務安裝（CLI）

在 WSL2 內：

```
openclaw onboard --install-daemon
```

或：

```
openclaw gateway install
```

或：

```
openclaw configure
```

提示時選取 **Gateway 服務**。

修復/遷移：

```
openclaw doctor
```

## 在 Windows 登入前自動啟動 Gateway

對於無頭設定，請確保即使沒有人登入
Windows，完整開機鏈也會執行。

### 1) 不登入也保持使用者服務執行

在 WSL 內：

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) 安裝 OpenClaw gateway 使用者服務

在 WSL 內：

```bash
openclaw gateway install
```

### 3) 在 Windows 開機時自動啟動 WSL

以系統管理員身分在 PowerShell 中執行：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

將 `Ubuntu` 替換為下列命令顯示的發行版名稱：

```powershell
wsl --list --verbose
```

### 驗證啟動鏈

重新開機後（Windows 登入前），從 WSL 檢查：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 進階：透過 LAN 公開 WSL 服務（portproxy）

WSL 有自己的虛擬網路。如果另一台機器需要連到
**在 WSL 內**執行的服務（SSH、本機 TTS 伺服器或 Gateway），你必須
將 Windows 連接埠轉送到目前的 WSL IP。WSL IP 會在重新啟動後變更，
因此你可能需要重新整理轉送規則。

範例（PowerShell **以系統管理員身分**）：

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

允許該連接埠通過 Windows 防火牆（一次性）：

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL 重新啟動後重新整理 portproxy：

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注意事項：

- 從另一台機器使用 SSH 時，目標是 **Windows 主機 IP**（範例：`ssh user@windows-host -p 2222`）。
- 遠端節點必須指向**可連線**的 Gateway URL（不是 `127.0.0.1`）；使用
  `openclaw status --all` 確認。
- 使用 `listenaddress=0.0.0.0` 進行 LAN 存取；`127.0.0.1` 會讓它只保留在本機。
- 如果你想讓這個流程自動化，請註冊排程工作，在登入時執行重新整理
  步驟。

## WSL2 逐步安裝

### 1) 安裝 WSL2 + Ubuntu

開啟 PowerShell（管理員）：

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

如果 Windows 要求，請重新開機。

### 2) 啟用 systemd（gateway 安裝所需）

在你的 WSL 終端機中：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然後從 PowerShell 執行：

```powershell
wsl --shutdown
```

重新開啟 Ubuntu，然後驗證：

```bash
systemctl --user status
```

### 3) 安裝 OpenClaw（在 WSL 內）

若是在 WSL 內進行一般首次設定，請遵循 Linux 入門流程：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

如果你是從原始碼開發，而不是進行首次 onboarding，請使用
[設定](/zh-TW/start/setup) 中的原始碼開發迴圈：

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

完整指南：[入門](/zh-TW/start/getting-started)

## Windows 配套應用程式

我們目前還沒有 Windows 配套應用程式。如果你想
協助促成這件事，歡迎貢獻。

## 相關

- [安裝概覽](/zh-TW/install)
- [平台](/zh-TW/platforms)
