---
read_when:
    - リモート Gateway セットアップの実行またはトラブルシューティング
summary: SSHトンネル（Gateway WS）とテールネットを使用したリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-05-06T05:06:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

このリポジトリは、専用ホスト（デスクトップ/サーバー）で単一の Gateway（マスター）を実行し、クライアントをそこへ接続することで、「SSH 経由のリモート」をサポートします。

- **オペレーター（あなた / macOS アプリ）向け**: SSH トンネリングが汎用フォールバックです。
- **ノード（iOS/Android および将来のデバイス）向け**: 必要に応じて（LAN/tailnet または SSH トンネルで）Gateway **WebSocket** に接続します。

## 中心となる考え方

- Gateway WebSocket は、設定済みポート（デフォルトは 18789）の **loopback** にバインドします。
- リモート利用では、その loopback ポートを SSH 経由で転送します（または tailnet/VPN を使ってトンネルを減らします）。

## 一般的な VPN と tailnet 構成

**Gateway ホスト**はエージェントが存在する場所だと考えてください。セッション、認証プロファイル、チャネル、状態を所有します。あなたのラップトップ、デスクトップ、ノードはそのホストに接続します。

### tailnet 内の常時稼働 Gateway

永続ホスト（VPS またはホームサーバー）で Gateway を実行し、**Tailscale** または SSH で到達します。

- **最適な UX:** `gateway.bind: "loopback"` を維持し、Control UI には **Tailscale Serve** を使用します。
- **フォールバック:** loopback を維持し、アクセスが必要な任意のマシンから SSH トンネルを使います。
- **例:** [exe.dev](/ja-JP/install/exe-dev)（簡単な VM）または [Hetzner](/ja-JP/install/hetzner)（本番 VPS）。

ラップトップが頻繁にスリープするが、エージェントは常時稼働させたい場合に理想的です。

### ホームデスクトップが Gateway を実行する

ラップトップはエージェントを実行**しません**。リモートで接続します。

- macOS アプリの **Remote over SSH** モードを使用します（Settings → General → OpenClaw runs）。
- アプリがトンネルを開いて管理するため、WebChat とヘルスチェックがそのまま機能します。

ランブック: [macOS リモートアクセス](/ja-JP/platforms/mac/remote)。

### ラップトップが Gateway を実行する

Gateway をローカルに保ちつつ、安全に公開します。

- 他のマシンからラップトップへ SSH トンネルを張る、または
- Control UI を Tailscale Serve し、Gateway は loopback 専用のままにします。

ガイド: [Tailscale](/ja-JP/gateway/tailscale) と [Web 概要](/ja-JP/web)。

## コマンドフロー（どこで何が実行されるか）

1 つの gateway サービスが状態とチャネルを所有します。ノードは周辺機器です。

フロー例（Telegram → ノード）:

- Telegram メッセージが **Gateway** に到着します。
- Gateway が**エージェント**を実行し、ノードツールを呼び出すかどうかを判断します。
- Gateway が Gateway WebSocket 経由で**ノード**を呼び出します（`node.*` RPC）。
- ノードが結果を返し、Gateway が Telegram へ返信します。

注記:

- **ノードは gateway サービスを実行しません。** 意図的に分離プロファイルを実行する場合を除き、ホストごとに 1 つの gateway のみを実行してください（[複数の gateway](/ja-JP/gateway/multiple-gateways) を参照）。
- macOS アプリの「ノードモード」は、Gateway WebSocket 経由の単なるノードクライアントです。

## SSH トンネル（CLI + ツール）

リモート Gateway WS へのローカルトンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが起動している状態では:

- `openclaw health` と `openclaw status --deep` は、`ws://127.0.0.1:18789` 経由でリモート gateway に到達します。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も、必要に応じて `--url` で転送先 URL を対象にできます。

<Note>
`18789` は、設定済みの `gateway.port`（または `--port` や `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
</Note>

<Warning>
`--url` を渡すと、CLI は設定や環境の認証情報へフォールバックしません。`--token` または `--password` を明示的に含めてください。明示的な認証情報がない場合はエラーです。
</Warning>

## CLI リモートデフォルト

CLI コマンドがデフォルトで使用するリモートターゲットを永続化できます。

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

gateway が loopback 専用の場合は、URL を `ws://127.0.0.1:18789` のままにし、先に SSH トンネルを開いてください。
macOS アプリの SSH トンネル transport では、検出された gateway ホスト名は
`gateway.remote.sshTarget` に属します。`gateway.remote.url` はローカルトンネル URL のままです。

## 認証情報の優先順位

Gateway 認証情報の解決は、call/probe/status パスと Discord exec-approval 監視にわたって、1 つの共有コントラクトに従います。Node-host は、1 つのローカルモード例外（意図的に `gateway.remote.*` を無視します）を除き、同じ基本コントラクトを使用します。

- 明示的な認証情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示的認証を受け付ける call パスでは常に優先されます。
- URL オーバーライドの安全性:
  - CLI URL オーバーライド（`--url`）は、暗黙の config/env 認証情報を再利用しません。
  - Env URL オーバーライド（`OPENCLAW_GATEWAY_URL`）は、env 認証情報のみを使用できます（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（リモートフォールバックは、ローカル認証トークン入力が未設定の場合にのみ適用されます）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（リモートフォールバックは、ローカル認証パスワード入力が未設定の場合にのみ適用されます）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host ローカルモード例外: `gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモート probe/status のトークンチェックはデフォルトで厳格です。リモートモードを対象にする場合、`gateway.remote.token` のみを使用します（ローカルトークンへのフォールバックはありません）。
- Gateway env オーバーライドは `OPENCLAW_GATEWAY_*` のみを使用します。

## SSH 経由の Chat UI

WebChat は個別の HTTP ポートを使用しなくなりました。SwiftUI チャット UI は Gateway WebSocket に直接接続します。

- SSH 経由で `18789` を転送し（上記参照）、クライアントを `ws://127.0.0.1:18789` に接続します。
- macOS では、トンネルを自動管理するアプリの「Remote over SSH」モードを推奨します。

## macOS アプリの Remote over SSH

macOS メニューバーアプリは、同じ構成をエンドツーエンドで駆動できます（リモートステータスチェック、WebChat、Voice Wake 転送）。

ランブック: [macOS リモートアクセス](/ja-JP/platforms/mac/remote)。

## セキュリティルール（remote/VPN）

短く言うと、バインドが必要だと確信できない限り、**Gateway は loopback 専用に保ってください**。

- **Loopback + SSH/Tailscale Serve** が最も安全なデフォルトです（公開露出なし）。
- 平文の `ws://` はデフォルトで loopback 専用です。信頼済みプライベートネットワークでは、
  緊急回避としてクライアントプロセスで `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。
  同等の `openclaw.json` 設定はありません。これは WebSocket 接続を行うクライアントの
  プロセス環境でなければなりません。
- **非 loopback バインド**（`lan`/`tailnet`/`custom`、または loopback が利用できない場合の `auto`）では、gateway 認証を使用する必要があります: token、password、または `gateway.auth.mode: "trusted-proxy"` を持つ identity-aware リバースプロキシ。
- `gateway.remote.token` / `.password` はクライアント認証情報ソースです。それ自体ではサーバー認証を構成しません。
- ローカル call パスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、未解決の場合、解決は fail closed します（リモートフォールバックによる隠蔽はありません）。
- `gateway.remote.tlsFingerprint` は、`wss://` 使用時にリモート TLS 証明書をピン留めします。
- **Tailscale Serve** は、`gateway.auth.allowTailscale: true` の場合、identity
  ヘッダー経由で Control UI/WebSocket トラフィックを認証できます。HTTP API エンドポイントは
  その Tailscale ヘッダー認証を使用せず、gateway の通常の HTTP
  認証モードに従います。このトークンなしフローは、gateway ホストが信頼済みであることを前提とします。
  すべての場所で共有シークレット認証を使いたい場合は、`false` に設定してください。
- **Trusted-proxy** 認証は、デフォルトで非 loopback の identity-aware proxy 構成を想定します。
  同一ホスト上の loopback リバースプロキシには、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- ブラウザー制御はオペレーターアクセスと同様に扱います: tailnet 専用 + 意図的なノードペアリング。

詳細: [セキュリティ](/ja-JP/gateway/security)。

### macOS: LaunchAgent による永続 SSH トンネル

リモート gateway に接続する macOS クライアントでは、SSH `LocalForward` config エントリと LaunchAgent を使って、再起動やクラッシュをまたいでトンネルを維持するのが最も簡単な永続構成です。

#### ステップ 1: SSH config を追加する

`~/.ssh/config` を編集します。

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` を自分の値に置き換えます。

#### ステップ 2: SSH キーをコピーする（1 回のみ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ 3: gateway トークンを構成する

再起動後も保持されるように、トークンを config に保存します。

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### ステップ 4: LaunchAgent を作成する

これを `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` として保存します。

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

#### ステップ 5: LaunchAgent を読み込む

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

トンネルはログイン時に自動起動し、クラッシュ時に再起動し、転送ポートを稼働状態に保ちます。

<Note>
古い構成から残った `com.openclaw.ssh-tunnel` LaunchAgent がある場合は、unload して削除してください。
</Note>

#### トラブルシューティング

トンネルが実行中か確認します。

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

トンネルを再起動します。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

トンネルを停止します。

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Config エントリ                     | 役割                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート 18789 をリモートポート 18789 に転送します     |
| `ssh -N`                             | リモートコマンドを実行しない SSH（ポート転送のみ）           |
| `KeepAlive`                          | クラッシュした場合にトンネルを自動的に再起動します           |
| `RunAtLoad`                          | ログイン時に LaunchAgent が読み込まれたときトンネルを開始します |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [認証](/ja-JP/gateway/authentication)
- [リモート gateway 構成](/ja-JP/gateway/remote-gateway-readme)
