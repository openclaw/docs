---
read_when:
    - リモートgateway構成を実行またはトラブルシューティングする
summary: SSHトンネル（Gateway WS）とtailnetを使ったリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-04-24T04:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3753f29d6b3cc3f1a2f749cc0fdfdd60dfde8822f0ec6db0e18e5412de0980da
    source_path: gateway/remote.md
    workflow: 15
---

# リモートアクセス（SSH、トンネル、tailnet）

このリポジトリは、専用ホスト（デスクトップ/サーバー）上で単一のGateway（マスター）を実行し、クライアントをそこへ接続することで、「SSH経由のリモート」をサポートします。

- **operator（あなた / macOSアプリ）** には、SSHトンネリングが汎用のフォールバックです。
- **Nodes（iOS/Androidおよび将来のデバイス）** には、必要に応じて（LAN/tailnetまたはSSHトンネル経由で）Gateway **WebSocket** に接続します。

## 中核となる考え方

- Gateway WebSocketは、設定されたポートの**loopback**にbindします（デフォルトは18789）。
- リモート利用では、そのloopbackポートをSSH経由でforwardします（またはtailnet/VPNを使ってトンネルを減らします）。

## 一般的なVPN/tailnet構成（エージェントが存在する場所）

**Gateway host** を「エージェントが存在する場所」と考えてください。そこがsessions、auth profiles、channels、stateを所有します。
あなたのラップトップ/デスクトップ（およびNodes）は、そのホストへ接続します。

### 1) tailnet内の常時稼働Gateway（VPSまたはホームサーバー）

永続的なホスト上でGatewayを実行し、**Tailscale** またはSSH経由でアクセスします。

- **最良のUX:** `gateway.bind: "loopback"` を維持し、Control UIには **Tailscale Serve** を使います。
- **フォールバック:** loopbackを維持し、アクセスが必要な任意のマシンからSSHトンネルを張ります。
- **例:** [exe.dev](/ja-JP/install/exe-dev)（簡単なVM）または [Hetzner](/ja-JP/install/hetzner)（本番向けVPS）。

これは、ラップトップがしばしばスリープするが、エージェントは常時稼働させたい場合に理想的です。

### 2) ホームデスクトップでGatewayを実行し、ラップトップはリモート操作だけ行う

ラップトップはエージェントを実行しません。リモート接続します。

- macOSアプリの **Remote over SSH** モードを使います（Settings → General → 「OpenClaw runs」）。
- アプリがトンネルを開いて管理するため、WebChatとヘルスチェックがそのまま動作します。

手順書: [macOSリモートアクセス](/ja-JP/platforms/mac/remote)。

### 3) ラップトップでGatewayを実行し、他のマシンからリモートアクセスする

Gatewayはローカルのまま、安全に公開します。

- 他のマシンからラップトップへSSHトンネルを張る、または
- Control UIをTailscale Serveし、Gatewayはloopback専用のままにする

ガイド: [Tailscale](/ja-JP/gateway/tailscale) と [Web概要](/ja-JP/web)。

## コマンドフロー（何がどこで動くか）

1つのgatewayサービスがstate + channelsを所有します。Nodesは周辺機器です。

フロー例（Telegram → node）:

- Telegramメッセージが**Gateway**に届く。
- Gatewayが**agent**を実行し、node toolを呼ぶかどうかを決定する。
- GatewayがGateway WebSocket（`node.*` RPC）経由で**node**を呼ぶ。
- Nodeが結果を返し、GatewayがTelegramへ返信する。

注記:

- **Nodesはgatewayサービスを実行しません。** 分離されたprofileを意図的に使う場合を除き、ホストごとに1つのgatewayだけを実行するべきです（[複数Gateway](/ja-JP/gateway/multiple-gateways) を参照）。
- macOSアプリの「node mode」は、Gateway WebSocket上のnodeクライアントにすぎません。

## SSHトンネル（CLI + ツール）

リモートGateway WSへのローカルトンネルを作成します:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが上がっている状態では:

- `openclaw health` と `openclaw status --deep` は `ws://127.0.0.1:18789` 経由でリモートgatewayに到達します。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も、必要に応じて `--url` でforwardされたURLを対象にできます。

注記: `18789` は、設定された `gateway.port`（または `--port` / `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
注記: `--url` を渡した場合、CLIは設定または環境変数の認証情報にフォールバックしません。
`--token` または `--password` を明示的に含めてください。明示的な認証情報がない場合はエラーです。

## CLIのリモートデフォルト

リモートターゲットを永続化すると、CLIコマンドがデフォルトでそれを使います:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

gatewayがloopback専用の場合、URLは `ws://127.0.0.1:18789` のままにして、先にSSHトンネルを開いてください。

## 認証情報の優先順位

Gateway認証情報の解決は、call/probe/status経路とDiscord exec-approval monitoring全体で共有される1つの契約に従います。Node-hostも同じ基本契約を使いますが、ローカルモードに1つだけ例外があります（意図的に `gateway.remote.*` を無視します）。

- 明示的な認証情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示的認証を受け付けるcall経路では常に最優先です。
- URL上書きの安全性:
  - CLIのURL上書き（`--url`）では、暗黙の設定/環境変数認証情報を再利用しません。
  - 環境変数のURL上書き（`OPENCLAW_GATEWAY_URL`）では、環境変数認証情報のみ（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使えます。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（ローカル認証token入力が未設定の場合のみremoteフォールバックが適用される）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（ローカル認証password入力が未設定の場合のみremoteフォールバックが適用される）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-hostローカルモード例外: `gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモートprobe/statusのtokenチェックは、デフォルトで厳格です: リモートモードを対象にするときは `gateway.remote.token` のみを使います（ローカルtokenフォールバックなし）。
- Gateway環境変数上書きでは `OPENCLAW_GATEWAY_*` のみを使います。

## SSH経由のチャットUI

WebChatは、もはや別個のHTTPポートを使いません。SwiftUIチャットUIはGateway WebSocketに直接接続します。

- SSH経由で `18789` をforwardし（上記参照）、クライアントを `ws://127.0.0.1:18789` に接続します。
- macOSでは、トンネルを自動管理するアプリの「Remote over SSH」モードを推奨します。

## macOSアプリの「Remote over SSH」

macOSメニューバーアプリは、同じ構成をエンドツーエンドで扱えます（リモートステータスチェック、WebChat、Voice Wake forwarding）。

手順書: [macOSリモートアクセス](/ja-JP/platforms/mac/remote)。

## セキュリティルール（remote/VPN）

短く言うと: 必要性が確実でない限り、**Gatewayはloopback専用**のままにしてください。

- **loopback + SSH/Tailscale Serve** が最も安全なデフォルトです（公開露出なし）。
- プレーンテキストの `ws://` は、デフォルトでloopback専用です。信頼できるプライベートネットワークでは、緊急用としてクライアントプロセスに `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。
- **loopback以外へのbind**（`lan` / `tailnet` / `custom`、またはloopbackが利用できないときの `auto`）では、gateway authが必要です: token、password、または `gateway.auth.mode: "trusted-proxy"` を使うidentity-aware reverse proxyです。
- `gateway.remote.token` / `.password` はクライアント認証情報ソースです。それ自体ではサーバー認証を設定しません。
- ローカルcall経路は、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使えます。
- `gateway.auth.token` / `gateway.auth.password` がSecretRef経由で明示的に設定されていて未解決の場合、解決はフェイルクローズドになります（remoteフォールバックによる隠蔽なし）。
- `gateway.remote.tlsFingerprint` は、`wss://` 使用時にリモートTLS証明書をpinします。
- **Tailscale Serve** は、`gateway.auth.allowTailscale: true` の場合、identityヘッダー経由でControl UI/WebSocketトラフィックを認証できます。HTTP APIエンドポイントはこのTailscaleヘッダー認証を使わず、代わりにgatewayの通常HTTP認証モードに従います。このtoken不要フローはgateway hostが信頼できることを前提とします。どこでもshared-secret認証を使いたい場合は、これを `false` に設定してください。
- **trusted-proxy** 認証は、loopback以外のidentity-aware proxy構成専用です。同一ホストのloopback reverse proxyでは `gateway.auth.mode: "trusted-proxy"` を満たしません。
- ブラウザ制御はoperatorアクセスとして扱ってください: tailnet専用 + 意図的なnode pairing。

詳細: [セキュリティ](/ja-JP/gateway/security)。

### macOS: LaunchAgentを使った永続SSHトンネル

リモートgatewayに接続するmacOSクライアントでは、最も簡単な永続構成は、SSHの `LocalForward` 設定エントリと、再起動やクラッシュをまたいでトンネルを維持するLaunchAgentを使う方法です。

#### ステップ1: SSH設定を追加する

`~/.ssh/config` を編集します:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` を自分の値に置き換えてください。

#### ステップ2: SSHキーをコピーする（初回のみ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ3: gateway tokenを設定する

再起動後も保持されるよう、設定にtokenを保存します:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ステップ4: LaunchAgentを作成する

これを `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` として保存します:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### ステップ5: LaunchAgentを読み込む

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

トンネルはログイン時に自動起動し、クラッシュ時に再起動し、forwardされたポートを有効なまま保ちます。

注記: 古い構成の残りとして `com.openclaw.ssh-tunnel` LaunchAgent が残っている場合は、それをunloadして削除してください。

#### トラブルシューティング

トンネルが動作中か確認するには:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

トンネルを再起動するには:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

トンネルを停止するには:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 設定エントリ | 役割 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート18789をリモートポート18789へforwardする |
| `ssh -N` | リモートコマンドを実行せずにSSHを行う（ポートforwardのみ） |
| `KeepAlive` | トンネルがクラッシュしたら自動再起動する |
| `RunAtLoad` | LaunchAgentがログイン時に読み込まれたらトンネルを起動する |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [認証](/ja-JP/gateway/authentication)
- [リモートgatewayセットアップ](/ja-JP/gateway/remote-gateway-readme)
