---
read_when:
    - Windows に OpenClaw をインストールする
    - Windows Hub、ネイティブ Windows、WSL2 の選択
    - Windows コンパニオンアプリまたは Windows ノードモードのセットアップ
summary: 'Windows サポート: Windows Hub、ネイティブ CLI と Gateway、WSL2 Gateway セットアップ、ノードモード、トラブルシューティング'
title: Windows
x-i18n:
    generated_at: "2026-06-27T12:05:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw は、ネイティブの **Windows Hub** コンパニオンアプリと Windows CLI サポートを同梱しています。
セットアップ、トレイステータス、チャット、Command Center 診断、Windows ノード機能を備えたデスクトップアプリが必要な場合は Windows Hub を使用します。CLI/Gateway を直接使いたい場合は PowerShell
インストーラーを使用します。最も Linux 互換性の高い Gateway ランタイムが必要な場合は WSL2 を使用します。

## 推奨: Windows Hub

Windows Hub は、Windows 10 20H2+ と Windows 11 向けのネイティブ WinUI コンパニオンアプリです。管理者権限なしでインストールでき、OpenClaw リリースで署名済みの
x64 および ARM64 インストーラーとして公開されています。

最新の安定版インストーラーを [OpenClaw リリースページ](https://github.com/openclaw/openclaw/releases) からダウンロードします。

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [チェックサム](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

上記のダウンロードリンクが 404 を返す場合は、[リリースページ](https://github.com/openclaw/openclaw/releases) にアクセスし、最新リリースの `OpenClawCompanion-Setup-*` アセットを探してください。

インストール後、スタートメニューまたはシステムトレイから **OpenClaw Companion** を起動します。インストーラーは、Gateway セットアップ、チャット、設定、
更新確認、アンインストール用のショートカットも追加します。

### Windows Hub に含まれるもの

- システムトレイステータスとログイン時起動
- ローカルのアプリ所有 WSL Gateway 向け初回セットアップ
- ローカル、リモート、SSH トンネル経由 Gateway の接続設定
- ネイティブチャットウィンドウとブラウザー Control UI へのアクセス
- セッション、使用状況、チャンネル、ノード、ペアリング、修復コマンド向けの Command Center 診断
- エージェント制御のキャンバス、画面、カメラ、通知、デバイスステータス、テキスト読み上げ、音声認識、制御された `system.run` のための Windows ノードモード
- Claude Desktop、Claude Code、Cursor などの MCP クライアント向けローカル MCP サーバーモード

### 初回起動

初回起動時、使用可能な保存済み Gateway がない場合、Windows Hub はセットアップを開きます。
最速の方法は **ローカルにセットアップ** で、アプリ所有の
`OpenClawGateway` WSL ディストリビューションをプロビジョニングし、その内部に Gateway をインストールして、アプリをペアリングします。
これは既存の Ubuntu ディストリビューションをエクスポートしたり変更したりしません。

すでに Gateway がある場合は、**高度なセットアップ** を選択するか、接続タブを開きます。
次に接続できます。

- この PC 上のローカル Gateway
- この PC 上の WSL Gateway
- URL とトークンまたはセットアップコードによるリモート Gateway
- SSH トンネル経由で到達する Gateway

セットアップが完了すると、トレイアイコンが緑になります。トレイから **Command Center** を開き、接続、ペアリング、ノードステータス、チャンネルの健全性を確認します。

## Windows ノードモード

Windows Hub は、ファーストクラスの OpenClaw ノードとして登録できます。その後、エージェントは Gateway を通じて宣言済みの Windows ネイティブ機能を使用できます。

一般的なコマンドには次が含まれます。

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot`、および明示的なオプトイン時の `screen.record`
- `camera.list`、および明示的なオプトイン時の `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

ノードモードには Gateway ペアリングが必要です。アプリにペアリング要求が表示された場合は、
Gateway ホストから承認します。

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway は、ノードが宣言しサーバーポリシーで許可されたコマンドのみを転送します。`screen.record`、`camera.snap`、`camera.clip` などのプライバシーに関わるコマンドには、明示的な `gateway.nodes.allowCommands` オプトインが必要です。

## ローカル MCP モード

Windows Hub は、同じ Windows ネイティブ機能レジストリを、ループバック上のローカル
MCP サーバーとして公開できます。これは、実行中の OpenClaw Gateway なしでローカル MCP クライアントから Windows 機能を操作したい場合に便利です。

Windows Hub 設定の開発者/高度なセクションで有効にします。サーバーを有効にすると、アプリにループバックエンドポイントとベアラートークンが表示されます。

モード一覧:

| ノードモード | MCP サーバー | 動作                           |
| --------- | ---------- | ---------------------------------- |
| オフ       | オフ        | オペレーター専用デスクトップアプリ          |
| オン        | オフ        | Gateway 接続済み Windows ノード     |
| オフ       | オン         | ローカル MCP サーバーのみ              |
| オン        | オン         | Gateway ノードとローカル MCP サーバー |

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

ネイティブ Windows CLI と Gateway のフローはサポートされており、改善が続いています。
管理対象の起動は、利用可能な場合 Windows Scheduled Tasks を使用します。タスクは OpenClaw 状態ディレクトリ内に読み取り可能な `gateway.cmd` スクリプトを保持しますが、生成された `gateway.vbs` WScript ラッパーを通じて起動するため、バックグラウンド Gateway は可視のコンソールウィンドウを開きません。タスク作成が拒否された場合、OpenClaw はユーザーごとの Startup フォルダーのログイン項目にフォールバックします。

Gateway サービスをインストールするには:

```powershell
openclaw gateway install
openclaw gateway status --json
```

管理対象 Gateway サービスなしで CLI のみを使用したい場合:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 は、Windows 上で最も Linux 互換性の高い Gateway ランタイムであり続けています。Windows Hub でアプリ所有の WSL Gateway をセットアップすることも、自分のディストリビューション内に手動でインストールすることもできます。

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

その後、Linux クイックスタートを使用して WSL 内に OpenClaw をインストールします。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Windows ログイン前の Gateway 自動起動

ヘッドレス WSL セットアップでは、Windows に誰もログインしていない場合でも完全なブートチェーンが実行されるようにします。

WSL 内:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

管理者として PowerShell で:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

`Ubuntu` を、次のコマンドで確認した自分のディストリビューション名に置き換えます。

```powershell
wsl --list --verbose
```

> **注:** 古い手順からの変更点は 2 つあります。
>
> - **`/bin/true` ではなく `dbus-launch true`** — WSL ≥ 2.6.1.0 では、回帰 ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) により、linger が有効でも最後のクライアントが終了してから 15〜20 秒後にディストリビューションがアイドル終了します。`dbus-launch true` は、回避策として child-of-init プロセスを生存させます ([コミュニティでの議論, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245))。
> - **`/ru SYSTEM` ではなく `/ru "$env:USERNAME"`** — ユーザーごとの WSL ディストリビューション（既定のセットアップ）は SYSTEM アカウントから見えません。タスクは実行されたように見えますが、ディストリビューションは起動されません。自分のアカウントとして実行するとこれを回避できます。タスク作成時に Windows がパスワードを求めます。

再起動後、WSL から確認します。

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## LAN 経由で WSL サービスを公開する

WSL には独自の仮想ネットワークがあります。別のマシンから WSL 内のサービスに到達する必要がある場合は、Windows ポートを現在の WSL IP に転送します。WSL IP は再起動後に変わることがあるため、必要に応じて転送ルールを更新してください。

管理者として PowerShell での例:

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

- 別のマシンからの SSH は、たとえば
  `ssh user@windows-host -p 2222` のように Windows ホスト IP を対象にします。
- リモートノードは `127.0.0.1` ではなく、到達可能な Gateway URL を指す必要があります。
- LAN アクセスには `listenaddress=0.0.0.0` を使用します。ローカル専用アクセスには `127.0.0.1` を使用します。

## トラブルシューティング

### トレイアイコンが表示されない

タスクマネージャーで `OpenClaw.Tray.WinUI.exe` を確認します。実行中の場合は、隠れているトレイアイコン領域を開いてピン留めします。実行されていない場合は、スタートメニューから **OpenClaw
Companion** を起動します。

### ローカルセットアップが失敗する

Windows Hub からセットアップログを開くか、次を確認します。

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

一般的な原因は、WSL が無効、仮想化がブロックされている、アプリ所有 WSL 状態が古い、または Gateway パッケージのインストール中のネットワーク障害です。

### アプリがペアリングが必要だと表示する

Gateway からオペレーターまたはノード要求を承認します。

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

デバイスにすでにトークンがある場合は、承認後に接続タブから再接続します。

### Web チャットがリモート Gateway に到達できない

リモート Web チャットには HTTPS または localhost が必要です。自己署名証明書の場合は、
Windows で証明書を信頼するか、localhost URL への SSH トンネルを使用します。

### `screen.snapshot`、カメラ、または音声コマンドが失敗する

カメラ、マイク、画面キャプチャ、通知の Windows 権限を確認します。パッケージ版インストールでは保護された機能を宣言しますが、Windows はコマンドが初めてそれらを使用するときに依然として確認を求める場合があります。

### Git または GitHub 接続が失敗する

一部のネットワークでは、GitHub への HTTPS がブロックまたはスロットリングされます。`git clone` または `gh auth
login` が失敗する場合は、別のネットワーク、VPN、または HTTP/HTTPS プロキシを試してください。

現在のセッションでトークンベースの `gh` 認証を使う場合:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

トークンをコミットしたり、issue や pull request に貼り付けたりしないでください。

## 関連

- [インストール概要](/ja-JP/install)
- [Node.js セットアップ](/ja-JP/install/node)
- [ノード](/ja-JP/nodes)
- [Control UI](/ja-JP/web/control-ui)
- [Gateway 設定](/ja-JP/gateway/configuration)
