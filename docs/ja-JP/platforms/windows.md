---
read_when:
    - Windows に OpenClaw をインストールする
    - Windows Hub、ネイティブ Windows、WSL2 の選択
    - Windows コンパニオンアプリまたは Windows ノードモードのセットアップ
summary: 'Windows サポート: Windows Hub、ネイティブ CLI と Gateway、WSL2 Gateway セットアップ、node モード、トラブルシューティング'
title: Windows
x-i18n:
    generated_at: "2026-07-05T11:30:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1823abb4964082d1048cb80861fe1b6672e6709f29c875f98e503265b261e740
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw にはネイティブの **Windows Hub** コンパニオンアプリと Windows CLI サポートが付属します。
セットアップ、トレイステータス、チャット、Command
Center 診断、Windows ノード機能を備えたデスクトップアプリには Windows Hub を使用します。CLI/Gateway を直接使う場合は PowerShell
インストーラーを使用します。最も
Linux 互換性の高い Gateway ランタイムには WSL2 を使用します。

## 推奨: Windows Hub

Windows Hub は Windows 10 20H2+ と
Windows 11 向けのネイティブ WinUI コンパニオンアプリです。管理者権限なしでインストールでき、OpenClaw リリースでは署名済みの
x64 および ARM64 インストーラーとして提供されます。

最新の安定版インストーラーは
[OpenClaw リリースページ](https://github.com/openclaw/openclaw/releases)からダウンロードするか、
`releases/latest/download` から直接取得できます。

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)
- [チェックサム](https://github.com/openclaw/openclaw/releases/latest/download/OpenClawCompanion-SHA256SUMS.txt)

上記のリンクが 404 になる場合は、[リリースページ](https://github.com/openclaw/openclaw/releases)にアクセスし、
最新リリースの `OpenClawCompanion-Setup-*` アセットを探してください。

インストール後、スタートメニューまたはシステム
トレイから **OpenClaw Companion** を起動します。インストーラーは Gateway Setup、Chat、Settings、
Check for Updates、アンインストール用のショートカットも追加します。

### Windows Hub に含まれるもの

- システムトレイステータスとログイン時の起動。
- ローカルのアプリ所有 WSL Gateway の初回セットアップ。
- ローカル、リモート、SSH トンネル経由 Gateway の接続設定。
- ネイティブチャットウィンドウとブラウザー Control UI へのアクセス。
- セッション、使用状況、チャネル、ノード、ペアリング、
  修復コマンド向けの Command Center 診断。
- エージェント制御のキャンバス、画面、カメラ、
  通知、デバイスステータス、会話、制御された `system.run` のための Windows ノードモード。
- Claude Desktop、Claude Code、
  Cursor などの MCP クライアント向けのローカル MCP サーバーモード。

### 初回起動

初回起動時、使用可能な保存済み
Gateway がない場合、Windows Hub はセットアップを開きます。最短の方法は **Set up locally** で、
アプリ所有の `OpenClawGateway` WSL ディストリビューションをプロビジョニングし、その中に Gateway をインストールして、
アプリをペアリングします。これは既存の Ubuntu ディストリビューションをエクスポートしたり変更したりしません。

すでに
Gateway がある場合は、**Advanced setup** を選択するか、Connections タブを開きます。接続できる対象は次のとおりです。

- この PC 上のローカル Gateway
- この PC 上の WSL Gateway
- URL とトークンまたはセットアップコードによるリモート Gateway
- SSH トンネル経由で到達する Gateway

セットアップが完了すると、トレイアイコンが緑色になります。トレイから **Command Center** を開き、
接続、ペアリング、ノードステータス、チャネルの正常性を確認します。

## Windows ノードモード

Windows Hub は OpenClaw ノードとして登録できるため、エージェントは Gateway 経由で宣言済みの
Windows ネイティブ機能を使用できます。ノードコマンドは実行前に、
ノードによって宣言され、Gateway ポリシーで許可されている必要があります。完全な許可/拒否モデルについては
[Nodes](/ja-JP/nodes#command-policy) を参照してください。

一般的なコマンド:

| ファミリー | コマンド                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Screen | `screen.snapshot`; `screen.record` には明示的なオプトインが必要です                          |
| Camera | `camera.list`; `camera.snap`, `camera.clip` には明示的なオプトインが必要です                  |
| System | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Device | `location.get`, `device.info`, `device.status`                                       |
| Talk   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

ノードモードには Gateway ペアリングが必要です。アプリにペアリング要求が表示された場合は、
Gateway ホストから承認します。

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway は、ノードが宣言し、サーバーポリシーが
許可するコマンドのみを転送します。`screen.record`、`camera.snap`、
`camera.clip` などのプライバシーに関わるコマンドには、明示的な `gateway.nodes.allowCommands` オプトインが必要です。

## ローカル MCP モード

Windows Hub は、同じ Windows ネイティブ機能レジストリを local loopback 上のローカル
MCP サーバーとして公開できるため、ローカル MCP クライアントは実行中の OpenClaw Gateway なしで
Windows 機能を操作できます。

Windows Hub Settings の developer/advanced セクションで有効にします。サーバーが有効になると、
アプリにループバックエンドポイントとベアラートークンが表示されます。

モード一覧:

| Node モード | MCP サーバー | 動作                           |
| --------- | ---------- | ---------------------------------- |
| off       | off        | オペレーター専用デスクトップアプリ          |
| on        | off        | Gateway 接続 Windows ノード     |
| off       | on         | ローカル MCP サーバーのみ              |
| on        | on         | Gateway ノードとローカル MCP サーバー |

## ネイティブ Windows CLI と Gateway

ターミナル中心で使用する場合は、PowerShell から OpenClaw をインストールします。

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

確認:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

管理された起動では、利用可能な場合は Windows Scheduled Tasks を使用します。このタスクは
OpenClaw 状態ディレクトリ内の読み取り可能な `gateway.cmd` スクリプトを保持しますが、
生成された `gateway.vbs` WScript ラッパーを通じて起動するため、バックグラウンド Gateway は
表示されるコンソールウィンドウを開きません。タスクの作成が拒否された場合、OpenClaw は
ユーザーごとのスタートアップフォルダーのログイン項目にフォールバックします。

Gateway サービスをインストールします。

```powershell
openclaw gateway install
openclaw gateway status --json
```

管理された Gateway サービスなしで CLI のみを使用する場合:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 は、Windows 上で最も Linux 互換性の高い Gateway ランタイムであり続けています。Windows
Hub はアプリ所有の WSL Gateway をセットアップできます。または、自分のディストリビューション内に手動でインストールできます。

手動セットアップ:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

WSL 内で systemd を有効にします。

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

PowerShell から WSL を再起動します。

```powershell
wsl --shutdown
```

次に、Linux クイックスタートを使用して WSL 内に OpenClaw をインストールします。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows ログイン前の Gateway 自動起動

ヘッドレス WSL セットアップでは、誰も
Windows にログインしていない場合でも、完全なブートチェーンが実行されるようにしてください。

WSL 内:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

管理者として PowerShell で実行:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu` を、次のコマンドで確認できるディストリビューション名に置き換えます。

```powershell
wsl --list --verbose
```

<Note>
古い手順からの 2 つの変更点:

- **`/bin/true` ではなく `dbus-launch true`**: WSL >= 2.6.1.0 では、
  回帰 ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) により、
  linger が有効でも、最後のクライアント終了後 15-20 秒でディストリビューションがアイドル終了します。
  `dbus-launch true` は回避策として child-of-init プロセスを生存させます
  (コミュニティでの議論、[microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245))。
- **`/ru SYSTEM` ではなく `/ru "$env:USERNAME"`**: ユーザーごとの WSL ディストリビューション (デフォルトのセットアップ)
  は SYSTEM アカウントから見えないため、タスクは実行されたように見えても
  ディストリビューションは起動しません。自分のアカウントで実行すると
  これを回避できます。タスク作成時に Windows がパスワードを求めます。

</Note>

再起動後、WSL から確認します。

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## WSL サービスを LAN に公開する

WSL には独自の仮想ネットワークがあります。別のマシンから WSL 内のサービスに到達する必要がある場合は、
Windows のポートを現在の WSL IP に転送します。WSL IP は
再起動後に変わる可能性があるため、必要に応じて転送ルールを更新してください。

管理者として PowerShell で実行する例:

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

注:

- 別のマシンからの SSH は Windows ホスト IP を対象にします。例: `ssh user@windows-host -p 2222`。
- リモートノードは `127.0.0.1` ではなく、到達可能な Gateway URL を指す必要があります。
- LAN アクセスには `listenaddress=0.0.0.0`、ローカル専用アクセスには `127.0.0.1` を使用します。

## トラブルシューティング

### トレイアイコンが表示されない

タスクマネージャーで `OpenClaw.Tray.WinUI.exe` を確認します。実行中の場合は、
非表示のトレイアイコン領域を開いてピン留めします。実行されていない場合は、スタートメニューから **OpenClaw Companion** を起動します。

### ローカルセットアップが失敗する

Windows Hub からセットアップログを開くか、次を調べます。

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

一般的な原因: WSL の無効化、仮想化のブロック、古いアプリ所有 WSL
状態、または Gateway パッケージのインストール中のネットワーク障害。

### アプリがペアリングが必要だと表示する

Gateway からオペレーターまたはノード要求を承認します。

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

デバイスにすでにトークンがあった場合は、承認後に Connections タブから再接続します。

### Web チャットがリモート Gateway に到達できない

リモート Web チャットには HTTPS または localhost が必要です。自己署名証明書の場合は、
Windows で証明書を信頼するか、localhost URL への SSH トンネルを使用します。

### `screen.snapshot`、カメラ、または音声コマンドが失敗する

カメラ、マイク、画面キャプチャ、通知に対する Windows の権限を確認します。
パッケージ版インストールでは保護された機能が宣言されていますが、
Windows はコマンドが初めてそれらを使用するときに確認を求める場合があります。

### Git または GitHub 接続が失敗する

一部のネットワークでは GitHub への HTTPS がブロックまたはスロットリングされます。`git clone` または
`gh auth login` が失敗する場合は、別のネットワーク、VPN、または HTTP/HTTPS プロキシを試してください。

現在のセッションでトークンベースの `gh` 認証を行う場合:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

トークンをコミットしたり、issue や pull request に貼り付けたりしないでください。

## 関連

- [インストール概要](/ja-JP/install)
- [Node.js セットアップ](/ja-JP/install/node)
- [Nodes](/ja-JP/nodes)
- [Control UI](/ja-JP/web/control-ui)
- [Gateway 設定](/ja-JP/gateway/configuration)
