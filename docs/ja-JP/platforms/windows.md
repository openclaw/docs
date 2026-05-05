---
read_when:
    - Windows への OpenClaw のインストール
    - ネイティブ Windows と WSL2 のどちらを選ぶか
    - Windows コンパニオンアプリの状態を確認しています
summary: 'Windows サポート: ネイティブ環境と WSL2 でのインストール方法、デーモン、現在の注意点'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw は **ネイティブ Windows** と **WSL2** の両方をサポートしています。WSL2 はより安定した方法であり、完全な体験には推奨されます。CLI、Gateway、ツール群が Linux 内で実行され、完全な互換性があります。ネイティブ Windows は、以下に記載するいくつかの注意点はありますが、コア CLI と Gateway の利用に対応しています。

ネイティブ Windows コンパニオンアプリは計画中です。

## WSL2（推奨）

- [はじめに](/ja-JP/start/getting-started)（WSL 内で使用）
- [インストールと更新](/ja-JP/install/updating)
- 公式 WSL2 ガイド（Microsoft）: [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## ネイティブ Windows の状態

ネイティブ Windows の CLI フローは改善中ですが、まだ WSL2 が推奨される方法です。

現在、ネイティブ Windows でうまく動作するもの:

- `install.ps1` による Web サイトインストーラー
- `openclaw --version`、`openclaw doctor`、`openclaw plugins list --json` などのローカル CLI 利用
- 次のような組み込みローカルエージェント/プロバイダーのスモーク:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

現在の注意点:

- `openclaw onboard --non-interactive` は、`--skip-health` を渡さない限り、到達可能なローカル Gateway をまだ期待します
- `openclaw onboard --non-interactive --install-daemon` と `openclaw gateway install` は、まず Windows スケジュールされたタスクを試します
- スケジュールされたタスクの作成が拒否された場合、OpenClaw はユーザーごとのスタートアップフォルダーのログイン項目にフォールバックし、すぐに Gateway を起動します
- `schtasks` 自体が詰まる、または応答しなくなった場合、OpenClaw はその経路をすばやく中止し、永久にハングする代わりにフォールバックします
- スケジュールされたタスクは、より優れたスーパーバイザー状態を提供するため、利用できる場合は引き続き推奨されます

Gateway サービスのインストールなしでネイティブ CLI だけが必要な場合は、次のいずれかを使用します:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

ネイティブ Windows で管理されたスタートアップが必要な場合:

```powershell
openclaw gateway install
openclaw gateway status --json
```

スケジュールされたタスクの作成がブロックされた場合でも、フォールバックサービスモードは現在のユーザーのスタートアップフォルダーを通じてログイン後に自動起動します。

## Gateway

- [Gateway 運用手順](/ja-JP/gateway)
- [設定](/ja-JP/gateway/configuration)

## Gateway サービスのインストール（CLI）

WSL2 内:

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

プロンプトが表示されたら **Gateway service** を選択します。

修復/移行:

```
openclaw doctor
```

## Windows ログイン前の Gateway 自動起動

ヘッドレスセットアップでは、誰も Windows にログインしていなくても完全なブートチェーンが実行されるようにします。

### 1) ログインなしでユーザーサービスを実行し続ける

WSL 内:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw Gateway ユーザーサービスをインストールする

WSL 内:

```bash
openclaw gateway install
```

### 3) Windows 起動時に WSL を自動的に開始する

管理者として PowerShell で:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` を次から取得したディストリビューション名に置き換えます:

```powershell
wsl --list --verbose
```

### 起動チェーンを確認する

再起動後（Windows サインイン前）、WSL から確認します:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 高度: LAN 経由で WSL サービスを公開する（portproxy）

WSL には独自の仮想ネットワークがあります。別のマシンが **WSL 内** で実行されているサービス（SSH、ローカル TTS サーバー、または Gateway）に到達する必要がある場合は、Windows ポートを現在の WSL IP に転送する必要があります。WSL IP は再起動後に変わるため、転送ルールの更新が必要になる場合があります。

例（PowerShell を **管理者として** 実行）:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows ファイアウォールでポートを許可します（一回限り）:

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL の再起動後に portproxy を更新します:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注記:

- 別のマシンからの SSH は **Windows ホスト IP** を対象にします（例: `ssh user@windows-host -p 2222`）。
- リモートノードは **到達可能な** Gateway URL（`127.0.0.1` ではない）を指す必要があります。確認には `openclaw status --all` を使用します。
- LAN アクセスには `listenaddress=0.0.0.0` を使用します。`127.0.0.1` はローカルのみに制限します。
- これを自動化したい場合は、ログイン時に更新ステップを実行するスケジュールされたタスクを登録します。

## ステップごとの WSL2 インストール

### 1) WSL2 + Ubuntu をインストールする

PowerShell を開きます（管理者）:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows から求められた場合は再起動します。

### 2) systemd を有効にする（Gateway インストールに必要）

WSL ターミナルで:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

次に PowerShell から:

```powershell
wsl --shutdown
```

Ubuntu を再度開き、確認します:

```bash
systemctl --user status
```

### 3) OpenClaw をインストールする（WSL 内）

WSL 内で通常の初回セットアップを行う場合は、Linux のはじめにフローに従います:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

初回オンボーディングではなくソースから開発している場合は、[セットアップ](/ja-JP/start/setup) のソース開発ループを使用します:

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

完全なガイド: [はじめに](/ja-JP/start/getting-started)

## Windows コンパニオンアプリ

Windows コンパニオンアプリはまだありません。実現に協力したい場合は、コントリビューションを歓迎します。

## Git と GitHub の接続性（コントリビューター）

一部のネットワークでは、GitHub への HTTPS がブロックまたはスロットリングされます。`git clone` がタイムアウトや接続リセットで失敗する場合は、別のネットワーク、VPN、または組織が提供する HTTP/HTTPS プロキシを試してください。

`gh auth login` がブラウザーデバイスフロー中に失敗する場合（たとえば `github.com:443` への到達タイムアウト）、代わりに個人アクセストークンで認証します:

1. 少なくとも `repo` スコープ（クラシック PAT）または同等のきめ細かなアクセスを持つトークンを作成します。
2. 現在のセッションの PowerShell で:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. `gh auth status` が `read:org` の欠落を警告する場合は、そのスコープを含むトークンを発行し、変数を再割り当てします:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` は、`gh auth login` で認証し、更新可能な保存済み認証情報がある場合にのみ適用されます（`GH_TOKEN` を使用している場合は適用されません）。

トークンをコミットしたり、Issue やプルリクエストに貼り付けたりしないでください。

## 関連

- [インストール概要](/ja-JP/install)
- [プラットフォーム](/ja-JP/platforms)
