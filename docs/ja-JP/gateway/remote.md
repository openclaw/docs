---
read_when:
    - リモート Gateway セットアップの実行またはトラブルシューティング
summary: Gateway WS、SSH トンネル、tailnet を使用したリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-07-05T11:24:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClawはホスト上で1つのGateway（マスター）を実行し、すべてのクライアントをそこへ接続します。Gatewayはセッション、認証プロファイル、チャンネル、状態を所有し、それ以外はすべてクライアントです。

- **オペレーター**（あなた、またはmacOSアプリ）: Gatewayに到達できる場合は、直接LAN/Tailnet WebSocketが最も簡単です。SSHトンネルは汎用フォールバックです。
- **Node**（iOS/Androidおよびその他のデバイス）: Gateway **WebSocket**（LAN/tailnetまたはSSHトンネル）に接続します。

## 中核となる考え方

Gateway WebSocketはデフォルトで**ループバック**にバインドし、ポートは`18789`（`gateway.port`）です。リモート利用では、Tailscale Serve / 信頼済みLAN-Tailnetバインド経由で公開するか、SSHでループバックポートを転送します。

## トポロジーの選択肢

| セットアップ                      | Gatewayを実行する場所                                                                                     | 最適な用途                                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| tailnet内の常時稼働Gateway        | 永続ホスト（VPSまたはホームサーバー）、TailscaleまたはSSH経由で到達                                       | スリープしがちなノートPCでも、エージェントを常時稼働させたい場合。[exe.dev](/ja-JP/install/exe-dev)（簡単なVM）または[Hetzner](/ja-JP/install/hetzner)（本番VPS）を参照してください。 |
| 自宅デスクトップ                  | デスクトップ。ノートPCはmacOSアプリのリモートモード（設定 → 接続 → OpenClawの実行先）でリモート接続します | 電源が入ったままのハードウェア上でエージェントを維持する場合。手順書: [macOSリモートアクセス](/ja-JP/platforms/mac/remote)。                         |
| ノートPC                          | ノートPC。SSHトンネルまたはTailscale Serveで安全に公開します（`gateway.bind: "loopback"`を維持）           | 単一マシンのセットアップ。[Tailscale](/ja-JP/gateway/tailscale)と[Web](/ja-JP/web)を参照してください。                                                       |

常時稼働とノートPCのセットアップでは、`gateway.bind: "loopback"`を維持し、Control UIには**Tailscale Serve**を使用するか、`gateway.remote.transport: "direct"`で信頼済みLAN/Tailnetバインドを使うことを推奨します。SSHトンネルは、どのマシンからでも動作するフォールバックです。

## コマンドフロー（何がどこで実行されるか）

1つのGatewayが状態とチャンネルを所有し、Nodeは周辺機器です。例（TelegramメッセージがNodeツールへルーティングされる場合）:

1. Telegramメッセージが**Gateway**に到着します。
2. Gatewayが**エージェント**を実行し、Nodeツールを呼び出すかどうかを判断します。
3. GatewayがGateway WebSocket（`node.invoke` RPC）経由で**Node**を呼び出します。
4. Nodeが結果を返し、GatewayがTelegramへ返信します。

NodeはGatewayサービスを実行しません。意図的に分離プロファイルを実行する場合を除き、ホストごとに実行するGatewayは1つだけにしてください（[複数Gateway](/ja-JP/gateway/multiple-gateways)を参照）。macOSアプリの「Nodeモード」は、Gateway WebSocket経由のNodeクライアントにすぎません。

## SSHトンネル（CLI + ツール）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

トンネルが有効な状態では、`openclaw health`と`openclaw status --deep`は`ws://127.0.0.1:18789`経由でリモートGatewayに到達します。`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call`も、`--url`を使って転送先URLを対象にできます。

<Note>
`18789`は、設定済みの`gateway.port`（または`--port` / `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
</Note>

<Warning>
`--url`は設定や環境の認証情報へフォールバックしません。`--token`または`--password`を明示的に渡してください。指定しない場合、クライアントは認証情報を送信せず、対象Gatewayが認証を要求していると接続は失敗します。
</Warning>

## CLIリモートデフォルト

リモートターゲットを永続化し、CLIコマンドがデフォルトでそれを使うようにします。

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

Gatewayがループバック専用の場合は、URLを`ws://127.0.0.1:18789`のままにし、先にSSHトンネルを開きます。macOSアプリのSSHトンネルトランスポートでは、検出されたGatewayホスト名を`gateway.remote.sshTarget`（`user@host`または`user@host:port`）に設定します。`gateway.remote.url`はローカルトンネルURLのままです。リモートポートがローカルポートと異なる場合は、`gateway.remote.remotePort`を設定します。

ホストキー検証はデフォルトで厳格です（`gateway.remote.sshHostKeyPolicy: "strict"`）。代わりに有効なOpenSSH設定へ委任するには、`"openssh"`に設定します。有効化する前に、ユーザーおよびシステムのSSH設定を確認してください。

信頼済みLANまたはTailnet上ですでに到達可能なGatewayには、直接モードを使用します。

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## 認証情報の優先順位

Gatewayの認証情報解決は、call/probe/statusパスとDiscord実行承認監視にまたがる共通契約に従います。Node-hostも同じ契約を使用しますが、ローカルモードの例外が1つあります（`gateway.remote.*`を無視します）。

- 明示的な認証情報（`--token`、`--password`、またはツールの`gatewayToken`）は、明示的な認証を受け付けるcallパスでは常に優先されます。
- URLオーバーライドの安全性:
  - CLI `--url`は暗黙の設定/環境認証情報を再利用しません。
  - Env `OPENCLAW_GATEWAY_URL`は環境認証情報のみ（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）を使用できます。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（ローカルトークンが未設定の場合のみリモートフォールバック）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（ローカルパスワードが未設定の場合のみリモートフォールバック）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-hostのローカルモード例外: `gateway.remote.token` / `gateway.remote.password`は無視されます。
- リモートprobe/statusのトークンチェックはデフォルトで厳格です。リモートモードを対象にする場合、`gateway.remote.token`のみを使用します（ローカルトークンへのフォールバックはありません）。
- Gatewayの環境オーバーライドは`OPENCLAW_GATEWAY_*`のみを使用します。

## Chat UIのリモートアクセス

WebChatには別個のHTTPポートはありません。SwiftUIチャットUIはGateway WebSocketへ直接接続します。

- SSHで`18789`を転送し（上記参照）、クライアントを`ws://127.0.0.1:18789`へ接続します。
- LAN/Tailnet直接モードでは、クライアントを設定済みのプライベート`ws://`またはセキュアな`wss://` URLへ接続します。
- macOSでは、アプリのリモートモードが選択されたトランスポートを自動的に管理します。

## macOSアプリのリモートモード

macOSメニューバーアプリは、リモート状態チェック、WebChat、Voice Wake転送を含む同じセットアップをエンドツーエンドで実行します。手順書: [macOSリモートアクセス](/ja-JP/platforms/mac/remote)。

## セキュリティルール（リモート/VPN）

バインドが必要だと確信している場合を除き、Gatewayは**ループバック専用**に保ってください。

- **ループバック + SSH/Tailscale Serve**が最も安全なデフォルトです（公開露出なし）。
- 平文の`ws://`は、ループバック、プライベート/LAN（RFC 1918）、リンクローカル、CGNAT、`.local`、`.ts.net`ホストで許可されます。公開リモートホストでは`wss://`を使用する必要があります。
- **非ループバックバインド**（`lan`/`tailnet`/`custom`、またはループバックが利用できない場合の`auto`）では、Gateway認証（トークン、パスワード、または`gateway.auth.mode: "trusted-proxy"`を設定したID対応リバースプロキシ）を使用する必要があります。
- `gateway.remote.token` / `.password`はクライアント認証情報ソースです。それだけではサーバー認証を設定しません。
- ローカルcallパスは、`gateway.auth.*`が未設定の場合のみ`gateway.remote.*`をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password`がSecretRefで明示的に設定されていて解決できない場合、解決はフェイルクローズします（リモートフォールバックで隠蔽しません）。
- `gateway.remote.tlsFingerprint`は、macOS直接モードを含め、`wss://`のリモートTLS証明書をピン留めします。保存済みピンがない場合、macOSは通常のシステム信頼が通った後の初回使用時にのみピン留めします。自己署名またはプライベートCAのGatewayには、明示的なフィンガープリントまたはSSH経由のRemoteが必要です。
- **Tailscale Serve**は、`gateway.auth.allowTailscale: true`の場合、IDヘッダー経由でControl UI/WebSocketトラフィックを認証できます。HTTP APIエンドポイントはそのヘッダー認証を使用せず、代わりにGatewayの通常のHTTP認証モードに従います。このトークンレスフローはGatewayホストが信頼されていることを前提にします。共有シークレット認証を全体で使う場合は`false`に設定してください。
- **Trusted-proxy**認証は、デフォルトで非ループバックのID対応プロキシを想定します。同一ホストのループバックリバースプロキシには、明示的な`gateway.auth.trustedProxy.allowLoopback = true`が必要です。
- ブラウザー制御はオペレーターアクセスと同様に扱ってください。tailnet専用にし、Nodeペアリングは意図的に行います。

詳細: [セキュリティ](/ja-JP/gateway/security)。

### macOS: LaunchAgentによる永続SSHトンネル

macOSクライアントでは、SSH `LocalForward`設定エントリと、再起動やクラッシュ後もトンネルを維持するLaunchAgentを使うのが最も簡単な永続セットアップです。

#### ステップ1: SSH設定を追加する

`~/.ssh/config`を編集します。

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>`と`<REMOTE_USER>`を自分の値に置き換えてください。

#### ステップ2: SSHキーをコピーする（1回のみ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ3: Gatewayトークンを設定する

```bash
openclaw config set gateway.remote.token "<your-token>"
```

リモートGatewayがパスワード認証を使用している場合は、代わりに`gateway.remote.password`を使用します。`OPENCLAW_GATEWAY_TOKEN`はシェルレベルのオーバーライドとして引き続き有効ですが、永続的なリモートクライアント設定は`gateway.remote.token` / `gateway.remote.password`です。

#### ステップ4: LaunchAgentを作成する

`~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`として保存します。

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

トンネルはログイン時に自動的に開始し、クラッシュ時に再起動し、転送ポートを維持します。

<Note>
古いセットアップから残った`com.openclaw.ssh-tunnel` LaunchAgentがある場合は、アンロードして削除してください。
</Note>

#### トラブルシューティング

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 設定エントリ                       | 役割                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート18789をリモートポート18789へ転送します         |
| `ssh -N`                             | リモートコマンドを実行しないSSHです（ポート転送のみ）        |
| `KeepAlive`                          | クラッシュした場合にトンネルを自動的に再起動します           |
| `RunAtLoad`                          | ログイン時にLaunchAgentが読み込まれたとき、トンネルを開始します |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [認証](/ja-JP/gateway/authentication)
- [リモートGatewayセットアップ](/ja-JP/gateway/remote-gateway-readme)
