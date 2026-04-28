---
read_when:
- Windows に OpenClaw をインストールする
- ネイティブ Windows と WSL2 のどちらを選ぶか
- Looking for Windows companion app status
summary: 'Windows サポート: ネイティブおよび WSL2 のインストール経路、デーモン、現在の注意点'
title: Windows
x-i18n:
  generated_at: '2026-04-24T05:09:26Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
  source_path: platforms/windows.md
  workflow: 15
---

OpenClaw は **ネイティブ Windows** と **WSL2** の両方をサポートしています。WSL2 の方が
より安定した経路であり、完全な体験には推奨されます。CLI、Gateway、各種
ツールは Linux 内でフル互換で動作します。ネイティブ Windows でも core CLI と Gateway は利用できますが、以下の注意点があります。

ネイティブ Windows 向けコンパニオンアプリは計画中です。

## WSL2（推奨）

- [はじめに](/ja-JP/start/getting-started)（WSL 内で使用）
- [インストールとアップデート](/ja-JP/install/updating)
- 公式 WSL2 ガイド（Microsoft）: [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## ネイティブ Windows の状況

ネイティブ Windows の CLI フローは改善中ですが、引き続き WSL2 が推奨経路です。

現在、ネイティブ Windows でうまく動作するもの:

- `install.ps1` 経由の website installer
- `openclaw --version`, `openclaw doctor`, `openclaw plugins list --json` のようなローカル CLI 利用
- 次のような埋め込み local-agent/provider スモーク:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

現在の注意点:

- `openclaw onboard --non-interactive` は、`--skip-health` を渡さない限り、到達可能なローカル Gateway を引き続き前提とします
- `openclaw onboard --non-interactive --install-daemon` と `openclaw gateway install` は、まず Windows Scheduled Tasks を試みます
- Scheduled Task の作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダー login item にフォールバックし、即座に Gateway を起動します
- `schtasks` 自体がハングまたは応答停止した場合、OpenClaw は現在、その経路をすばやく abort してフォールバックし、永久にハングしないようになっています
- Scheduled Tasks は、より良い supervisor status を提供するため、利用可能なら引き続き優先されます

Gateway サービスインストールなしでネイティブ CLI のみを使いたい場合は、次のいずれかを使用します。

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

ネイティブ Windows で管理された自動起動が欲しい場合:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Scheduled Task 作成がブロックされている場合でも、フォールバックのサービスモードは現在のユーザーの Startup フォルダー経由でログイン後に自動起動します。

## Gateway

- [Gateway runbook](/ja-JP/gateway)
- [Configuration](/ja-JP/gateway/configuration)

## Gateway サービスインストール（CLI）

WSL2 内では:

```
openclaw onboard --install-daemon
```

または:

```
openclaw gateway install
```

または:

```
openclaw configure
```

プロンプトが出たら **Gateway service** を選択します。

修復/移行:

```
openclaw doctor
```

## Windows ログイン前の Gateway 自動起動

ヘッドレス構成では、誰も
Windows にログインしていなくても完全なブートチェーンが動作するようにしてください。

### 1) ログインなしでユーザーサービスを動かし続ける

WSL 内で:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw Gateway ユーザーサービスをインストールする

WSL 内で:

```bash
openclaw gateway install
```

### 3) Windows 起動時に WSL を自動起動する

PowerShell を Administrator として実行:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` は次で確認できる distro 名に置き換えてください:

```powershell
wsl --list --verbose
```

### 起動チェーンを確認する

再起動後（Windows サインイン前）、WSL から確認します:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 高度: WSL サービスを LAN に公開する（portproxy）

WSL は独自の仮想ネットワークを持ちます。別のマシンが
**WSL 内**で動作するサービス（SSH、ローカル TTS server、または Gateway）に到達する必要がある場合は、
Windows ポートを現在の WSL IP に転送する必要があります。WSL IP は再起動後に変わるため、
転送ルールを更新する必要がある場合があります。

例（PowerShell を **Administrator として** 実行）:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows Firewall でそのポートを許可します（1 回だけ）:

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL 再起動後に portproxy を更新する:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注:

- 別マシンからの SSH は **Windows ホスト IP** を対象にします（例: `ssh user@windows-host -p 2222`）。
- リモート node は **到達可能な** Gateway URL を指す必要があります（`127.0.0.1` ではない）。確認には
  `openclaw status --all` を使用してください。
- LAN アクセスには `listenaddress=0.0.0.0` を使用し、`127.0.0.1` ならローカル限定になります。
- これを自動化したい場合は、ログイン時に refresh
  ステップを実行する Scheduled Task を登録してください。

## WSL2 インストール手順

### 1) WSL2 + Ubuntu をインストールする

PowerShell を開きます（Admin）:

```powershell
wsl --install
# または distro を明示的に選ぶ:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows に求められたら再起動してください。

### 2) systemd を有効にする（Gateway install に必要）

WSL ターミナルで:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

その後 PowerShell から:

```powershell
wsl --shutdown
```

Ubuntu を再度開き、確認します:

```bash
systemctl --user status
```

### 3) OpenClaw をインストールする（WSL 内）

WSL 内で通常の初回セットアップを行う場合は、Linux の Getting Started フローに従ってください:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

初回オンボーディングではなくソースから開発する場合は、
[Setup](/ja-JP/start/setup) の source dev loop を使ってください:

```bash
pnpm install
# 初回実行時のみ（またはローカル OpenClaw config/workspace をリセットした後）
pnpm openclaw setup
pnpm gateway:watch
```

完全なガイド: [はじめに](/ja-JP/start/getting-started)

## Windows コンパニオンアプリ

Windows コンパニオンアプリはまだありません。実現に向けた
contributions は歓迎します。

## 関連

- [インストール概要](/ja-JP/install)
- [Platforms](/ja-JP/platforms)
