---
read_when:
    - リモート Gateway 構成の実行またはトラブルシューティング
summary: Gateway WS、SSHトンネル、tailnetを使用したリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-07-11T22:16:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw はホスト上で1つの Gateway（マスター）を実行し、すべてのクライアントをそこに接続します。Gateway はセッション、認証プロファイル、チャンネル、状態を管理し、それ以外はすべてクライアントです。

- **オペレーター**（ユーザーまたは macOS アプリ）：Gateway に到達できる場合は、LAN/Tailnet の WebSocket 直接接続が最も簡単です。SSH トンネリングは汎用的なフォールバックです。
- **Node**（iOS/Android およびその他のデバイス）：Gateway の **WebSocket**（LAN/Tailnet または SSH トンネル）に接続します。

## 基本概念

Gateway WebSocket はデフォルトでポート `18789`（`gateway.port`）の**ループバック**にバインドされます。リモートで使用するには、Tailscale Serve または信頼できる LAN/Tailnet バインドを通じて公開するか、SSH 経由でループバックポートを転送します。

## トポロジーの選択肢

| 構成                              | Gateway の実行場所                                                                                         | 最適な用途                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailnet 内の常時稼働 Gateway     | Tailscale または SSH で到達する常設ホスト（VPS またはホームサーバー）                                      | 頻繁にスリープするものの、エージェントを常時稼働させる必要があるノート PC。[exe.dev](/ja-JP/install/exe-dev)（簡単な VM）または [Hetzner](/ja-JP/install/hetzner)（本番用 VPS）を参照してください。 |
| 自宅のデスクトップ                | デスクトップ。ノート PC は macOS アプリのリモートモード（Settings → Connection → OpenClaw runs）で接続    | 電源を入れたままにするハードウェア上でエージェントを維持する場合。手順書：[macOS リモートアクセス](/ja-JP/platforms/mac/remote)。                                               |
| ノート PC                         | SSH トンネルまたは Tailscale Serve で安全に公開するノート PC（`gateway.bind: "loopback"` を維持）         | 単一マシン構成。[Tailscale](/ja-JP/gateway/tailscale) および [Web](/ja-JP/web) を参照してください。                                                                                     |

常時稼働構成とノート PC 構成では、`gateway.bind: "loopback"` を維持し、Control UI には **Tailscale Serve** を使用するか、`gateway.remote.transport: "direct"` を設定した信頼できる LAN/Tailnet バインドを使用することを推奨します。SSH トンネルは、どのマシンからでも利用できるフォールバックです。

## コマンドの流れ（どこで何が実行されるか）

1つの Gateway が状態とチャンネルを管理し、Node は周辺機器として機能します。例（Telegram メッセージを Node ツールにルーティングする場合）：

1. Telegram メッセージが **Gateway** に到着します。
2. Gateway が**エージェント**を実行し、Node ツールを呼び出すかどうかを判断します。
3. Gateway が Gateway WebSocket（`node.invoke` RPC）を介して **Node** を呼び出します。
4. Node が結果を返し、Gateway が Telegram に返信します。

Node は Gateway サービスを実行しません。分離されたプロファイルを意図的に実行する場合を除き、ホストごとに実行する Gateway は1つだけにしてください（[複数の Gateway](/ja-JP/gateway/multiple-gateways) を参照）。macOS アプリの「Node モード」は、Gateway WebSocket 経由で動作する単なる Node クライアントです。

## SSH トンネル（CLI + ツール）

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

トンネルが確立されている間、`openclaw health` と `openclaw status --deep` は `ws://127.0.0.1:18789` を介してリモート Gateway に到達します。`openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も、`--url` を使用して転送先 URL を指定できます。

<Note>
`18789` を、設定済みの `gateway.port`（または `--port` / `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
</Note>

<Warning>
`--url` は、設定または環境変数の認証情報へフォールバックすることはありません。`--token` または `--password` を明示的に渡してください。指定しない場合、クライアントは認証情報を送信せず、接続先の Gateway が認証を要求すると接続に失敗します。
</Warning>

## CLI のリモートデフォルト

CLI コマンドがデフォルトで使用するリモート接続先を永続化します。

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

Gateway がループバック限定の場合は、URL を `ws://127.0.0.1:18789` のままにして、先に SSH トンネルを開きます。macOS アプリの SSH トンネル転送方式では、検出された Gateway のホスト名を `gateway.remote.sshTarget`（`user@host` または `user@host:port`）に指定し、`gateway.remote.url` はローカルトンネルの URL のままにします。リモートポートがローカルポートと異なる場合は、`gateway.remote.remotePort` を設定します。

ホストキーの検証はデフォルトで厳格です（`gateway.remote.sshHostKeyPolicy: "strict"`）。代わりに実際に適用される OpenSSH 設定へ委任するには、`"openssh"` に設定します。有効にする前に、ユーザーおよびシステムの SSH 設定を確認してください。

信頼できる LAN または Tailnet 上ですでに到達可能な Gateway には、直接モードを使用します。

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

Gateway の認証情報解決は、呼び出し、プローブ、ステータスの各経路と Discord の実行承認監視で、1つの共通契約に従います。Node ホストも同じ契約を使用しますが、ローカルモードには1つ例外があります（`gateway.remote.*` を無視します）。

- 明示的な認証情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示的な認証を受け付ける呼び出し経路で常に優先されます。
- URL オーバーライドの安全性：
  - CLI の `--url` は、暗黙的な設定または環境変数の認証情報を再利用しません。
  - 環境変数 `OPENCLAW_GATEWAY_URL` では、環境変数の認証情報（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）のみを使用できます。
- ローカルモードのデフォルト：
  - トークン：`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（ローカルトークンが未設定の場合のみリモートへフォールバック）
  - パスワード：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（ローカルパスワードが未設定の場合のみリモートへフォールバック）
- リモートモードのデフォルト：
  - トークン：`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - パスワード：`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node ホストのローカルモードの例外：`gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモートのプローブおよびステータスにおけるトークン確認は、デフォルトで厳格です。リモートモードを対象とする場合は `gateway.remote.token` のみを使用し、ローカルトークンへはフォールバックしません。
- Gateway の環境変数オーバーライドには、`OPENCLAW_GATEWAY_*` のみを使用します。

## チャット UI のリモートアクセス

WebChat には独立した HTTP ポートはありません。SwiftUI のチャット UI は Gateway WebSocket に直接接続します。

- SSH 経由で `18789` を転送し（前述を参照）、クライアントを `ws://127.0.0.1:18789` に接続します。
- LAN/Tailnet の直接モードでは、設定済みのプライベートな `ws://` URL または安全な `wss://` URL にクライアントを接続します。
- macOS では、アプリのリモートモードが選択された転送方式を自動的に管理します。

## macOS アプリのリモートモード

macOS メニューバーアプリは、リモートステータス確認、WebChat、音声ウェイク転送を含む同じ構成を、最初から最後まで管理します。手順書：[macOS リモートアクセス](/ja-JP/platforms/mac/remote)。

## セキュリティ規則（リモート/VPN）

バインドが必要だと確信している場合を除き、Gateway は**ループバック限定**に維持してください。

- **ループバック + SSH/Tailscale Serve** が最も安全なデフォルトです（公開されません）。
- 平文の `ws://` は、ループバック、プライベート/LAN（RFC 1918）、リンクローカル、CGNAT、`.local`、`.ts.net` の各ホストで使用できます。公開されたリモートホストでは `wss://` を使用する必要があります。
- **非ループバックバインド**（`lan`/`tailnet`/`custom`、またはループバックを利用できない場合の `auto`）では、トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` を設定したアイデンティティ認識型リバースプロキシによる Gateway 認証を使用する必要があります。
- `gateway.remote.token` / `.password` はクライアントの認証情報ソースです。それ自体ではサーバー認証を設定しません。
- ローカルの呼び出し経路で `gateway.remote.*` をフォールバックとして使用できるのは、`gateway.auth.*` が未設定の場合のみです。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef によって明示的に設定されているものの解決できない場合、解決は安全側に失敗します（リモートへのフォールバックによって問題を隠しません）。
- `gateway.remote.tlsFingerprint` は、macOS の直接モードを含む `wss://` のリモート TLS 証明書を固定します。保存済みのフィンガープリントがない場合、macOS は通常のシステム信頼検証に合格した後、初回使用時にのみ固定します。自己署名証明書またはプライベート CA を使用する Gateway には、明示的なフィンガープリントまたは Remote over SSH が必要です。
- `gateway.auth.allowTailscale: true` の場合、**Tailscale Serve** はアイデンティティヘッダーを介して Control UI/WebSocket トラフィックを認証できます。HTTP API エンドポイントはそのヘッダー認証を使用せず、代わりに Gateway の通常の HTTP 認証モードに従います。このトークン不要のフローでは、Gateway ホストが信頼されていることを前提とします。すべての場所で共有シークレット認証を使用するには、`false` に設定してください。
- **信頼済みプロキシ**認証では、デフォルトで非ループバックのアイデンティティ認識型プロキシを想定します。同一ホスト上のループバックリバースプロキシを使用するには、`gateway.auth.trustedProxy.allowLoopback = true` を明示的に設定する必要があります。
- ブラウザーからの制御はオペレーターアクセスと同等に扱ってください。Tailnet 限定にし、Node のペアリングは意図的に行ってください。

詳細：[セキュリティ](/ja-JP/gateway/security)。

### macOS：LaunchAgent による永続的な SSH トンネル

macOS クライアントで最も簡単な永続構成は、SSH の `LocalForward` 設定項目と、再起動やクラッシュ後もトンネルを維持する LaunchAgent を使用する方法です。

#### 手順1：SSH 設定を追加する

`~/.ssh/config` を編集します。

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` を実際の値に置き換えてください。

#### 手順2：SSH キーをコピーする（初回のみ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 手順3：Gateway トークンを設定する

```bash
openclaw config set gateway.remote.token "<your-token>"
```

リモート Gateway がパスワード認証を使用する場合は、代わりに `gateway.remote.password` を使用します。`OPENCLAW_GATEWAY_TOKEN` はシェルレベルのオーバーライドとして引き続き有効ですが、永続的なリモートクライアント構成には `gateway.remote.token` / `gateway.remote.password` を使用します。

#### 手順4：LaunchAgent を作成する

`~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` として保存します。

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

#### 手順5：LaunchAgent を読み込む

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

トンネルはログイン時に自動的に開始し、クラッシュ時には再起動され、転送ポートを利用可能な状態に維持します。

<Note>
以前の構成で使用していた `com.openclaw.ssh-tunnel` LaunchAgent が残っている場合は、読み込みを解除して削除してください。
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

| 設定項目                             | 動作内容                                                        |
| ------------------------------------ | --------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート 18789 をリモートポート 18789 に転送します        |
| `ssh -N`                             | リモートコマンドを実行せずに SSH を使用します（ポート転送のみ） |
| `KeepAlive`                          | トンネルがクラッシュした場合に自動的に再起動します              |
| `RunAtLoad`                          | ログイン時に LaunchAgent が読み込まれるとトンネルを開始します   |

## 関連項目

- [Tailscale](/ja-JP/gateway/tailscale)
- [認証](/ja-JP/gateway/authentication)
- [リモート Gateway の設定](/ja-JP/gateway/remote-gateway-readme)
