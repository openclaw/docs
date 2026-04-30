---
read_when:
    - リモート Gateway セットアップの実行またはトラブルシューティング
summary: SSH トンネル（Gateway WS）とテールネットを使用したリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-04-30T05:15:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

このリポジトリは、専用ホスト（デスクトップ/サーバー）上で単一の Gateway（マスター）を実行し、クライアントをそこへ接続することで「SSH 経由のリモート」をサポートします。

- **オペレーター（あなた / macOS アプリ）向け**: SSH トンネルが汎用フォールバックです。
- **ノード（iOS/Android と将来のデバイス）向け**: 必要に応じて LAN/tailnet または SSH トンネル経由で Gateway **WebSocket** に接続します。

## 核心となる考え方

- Gateway WebSocket は、設定したポート（デフォルトは 18789）の **ループバック** にバインドします。
- リモート利用では、そのループバックポートを SSH で転送します（または tailnet/VPN を使ってトンネルを減らします）。

## 一般的な VPN と tailnet 構成

**Gateway ホスト**はエージェントが存在する場所だと考えてください。セッション、認証プロファイル、チャンネル、状態を所有します。あなたのラップトップ、デスクトップ、ノードはそのホストに接続します。

### tailnet 内で常時稼働する Gateway

永続ホスト（VPS または自宅サーバー）で Gateway を実行し、**Tailscale** または SSH 経由で到達します。

- **最適な UX:** `gateway.bind: "loopback"` のままにし、Control UI には **Tailscale Serve** を使用します。
- **フォールバック:** ループバックのままにし、アクセスが必要な任意のマシンから SSH トンネルを使います。
- **例:** [exe.dev](/ja-JP/install/exe-dev)（簡単な VM）または [Hetzner](/ja-JP/install/hetzner)（本番 VPS）。

ラップトップが頻繁にスリープする一方で、エージェントを常時稼働させたい場合に最適です。

### 自宅デスクトップで Gateway を実行する

ラップトップはエージェントを実行**しません**。リモートで接続します。

- macOS アプリの **SSH 経由のリモート**モードを使用します（設定 → 一般 → OpenClaw の実行場所）。
- アプリがトンネルを開いて管理するため、WebChat とヘルスチェックはそのまま動作します。

ランブック: [macOS リモートアクセス](/ja-JP/platforms/mac/remote)。

### ラップトップで Gateway を実行する

Gateway をローカルに保ちつつ、安全に公開します。

- 他のマシンからラップトップへ SSH トンネルを張る、または
- Control UI を Tailscale Serve し、Gateway はループバック専用のままにします。

ガイド: [Tailscale](/ja-JP/gateway/tailscale) と [Web 概要](/ja-JP/web)。

## コマンドフロー（どこで何が実行されるか）

1 つの Gateway サービスが状態 + チャンネルを所有します。ノードは周辺機器です。

フロー例（Telegram → ノード）:

- Telegram メッセージが **Gateway** に到着します。
- Gateway が **エージェント**を実行し、ノードツールを呼び出すかどうかを決定します。
- Gateway は Gateway WebSocket 経由で **ノード**を呼び出します（`node.*` RPC）。
- ノードが結果を返し、Gateway は Telegram へ返信します。

注記:

- **ノードは Gateway サービスを実行しません。** 意図的に分離プロファイルを実行する場合を除き、ホストごとに実行する Gateway は 1 つだけにしてください（[複数の Gateway](/ja-JP/gateway/multiple-gateways) を参照）。
- macOS アプリの「ノードモード」は、Gateway WebSocket 経由の単なるノードクライアントです。

## SSH トンネル（CLI + ツール）

リモート Gateway WS へのローカルトンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが有効な状態では:

- `openclaw health` と `openclaw status --deep` は、`ws://127.0.0.1:18789` 経由でリモート Gateway に到達します。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も、必要に応じて `--url` で転送先 URL を対象にできます。

<Note>
`18789` は、設定済みの `gateway.port`（または `--port` もしくは `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
</Note>

<Warning>
`--url` を渡す場合、CLI は設定や環境の認証情報へフォールバックしません。`--token` または `--password` を明示的に含めてください。明示的な認証情報がない場合はエラーです。
</Warning>

## CLI のリモートデフォルト

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

Gateway がループバック専用の場合は、URL を `ws://127.0.0.1:18789` のままにし、先に SSH トンネルを開きます。
macOS アプリの SSH トンネルトランスポートでは、検出された Gateway ホスト名は
`gateway.remote.sshTarget` に属します。`gateway.remote.url` はローカルトンネル URL のままです。

## 認証情報の優先順位

Gateway の認証情報解決は、call/probe/status パスと Discord 実行承認監視にわたって 1 つの共有コントラクトに従います。Node-host は、1 つのローカルモード例外（意図的に `gateway.remote.*` を無視する）を除いて、同じ基本コントラクトを使用します。

- 明示的な認証情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示的認証を受け付ける call パスで常に優先されます。
- URL オーバーライドの安全性:
  - CLI URL オーバーライド（`--url`）は、暗黙の設定/環境認証情報を再利用しません。
  - 環境 URL オーバーライド（`OPENCLAW_GATEWAY_URL`）は、環境認証情報（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）のみを使用できます。
- ローカルモードのデフォルト:
  - トークン: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（リモートフォールバックは、ローカル認証トークン入力が未設定の場合にのみ適用されます）
  - パスワード: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（リモートフォールバックは、ローカル認証パスワード入力が未設定の場合にのみ適用されます）
- リモートモードのデフォルト:
  - トークン: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - パスワード: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host のローカルモード例外: `gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモート probe/status のトークンチェックはデフォルトで厳格です。リモートモードを対象にする場合は `gateway.remote.token` のみを使用します（ローカルトークンへのフォールバックなし）。
- Gateway の環境オーバーライドは `OPENCLAW_GATEWAY_*` のみを使用します。

## SSH 経由の Chat UI

WebChat は個別の HTTP ポートを使用しなくなりました。SwiftUI チャット UI は Gateway WebSocket に直接接続します。

- SSH で `18789` を転送し（上記参照）、クライアントを `ws://127.0.0.1:18789` に接続します。
- macOS では、トンネルを自動管理するアプリの「SSH 経由のリモート」モードを推奨します。

## macOS アプリの SSH 経由のリモート

macOS メニューバーアプリは、同じ構成をエンドツーエンドで駆動できます（リモートステータスチェック、WebChat、Voice Wake 転送）。

ランブック: [macOS リモートアクセス](/ja-JP/platforms/mac/remote)。

## セキュリティルール（リモート/VPN）

短く言うと: 必要なバインドがあると確信できる場合を除き、**Gateway はループバック専用のままにしてください**。

- **ループバック + SSH/Tailscale Serve** が最も安全なデフォルトです（公開露出なし）。
- 平文の `ws://` はデフォルトでループバック専用です。信頼済みのプライベートネットワークでは、
  緊急回避として、クライアントプロセスで `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。
  同等の `openclaw.json` 設定はありません。これは WebSocket 接続を行うクライアントのプロセス
  環境である必要があります。
- **非ループバックバインド**（`lan`/`tailnet`/`custom`、またはループバックが利用できない場合の `auto`）では、Gateway 認証を使用する必要があります。トークン、パスワード、または `gateway.auth.mode: "trusted-proxy"` の ID 対応リバースプロキシを使用します。
- `gateway.remote.token` / `.password` はクライアント認証情報のソースです。それ自体でサーバー認証を設定するものでは**ありません**。
- ローカル call パスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決できない場合、解決は閉じた状態で失敗します（リモートフォールバックで隠蔽されません）。
- `gateway.remote.tlsFingerprint` は、`wss://` 使用時にリモート TLS 証明書をピン留めします。
- **Tailscale Serve** は、`gateway.auth.allowTailscale: true` の場合、ID
  ヘッダーで Control UI/WebSocket トラフィックを認証できます。HTTP API エンドポイントは
  その Tailscale ヘッダー認証を使用せず、代わりに Gateway の通常の HTTP
  認証モードに従います。このトークンなしフローは、Gateway ホストが信頼されていることを前提にします。
  すべての場所で共有シークレット認証を使いたい場合は、これを `false` に設定してください。
- **Trusted-proxy** 認証は、デフォルトで非ループバックの ID 対応プロキシ構成を想定します。
  同一ホストのループバックリバースプロキシでは、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- ブラウザー制御はオペレーターアクセスと同様に扱ってください。tailnet 専用 + 意図的なノードペアリングを使用します。

詳細: [セキュリティ](/ja-JP/gateway/security)。

### macOS: LaunchAgent による永続 SSH トンネル

リモート Gateway に接続する macOS クライアントでは、SSH `LocalForward` 設定エントリと LaunchAgent を使って、再起動やクラッシュをまたいでトンネルを維持するのが最も簡単な永続構成です。

#### ステップ 1: SSH 設定を追加する

`~/.ssh/config` を編集します。

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` は実際の値に置き換えてください。

#### ステップ 2: SSH キーをコピーする（1 回限り）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ 3: Gateway トークンを設定する

再起動後も維持されるように、トークンを設定に保存します。

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
古い構成から残った `com.openclaw.ssh-tunnel` LaunchAgent がある場合は、アンロードして削除してください。
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

| 設定エントリ                         | 動作内容                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | ローカルポート 18789 をリモートポート 18789 に転送します     |
| `ssh -N`                             | リモートコマンドを実行せずに SSH します（ポート転送のみ）    |
| `KeepAlive`                          | トンネルがクラッシュした場合に自動的に再起動します           |
| `RunAtLoad`                          | ログイン時に LaunchAgent が読み込まれるとトンネルを起動します |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [認証](/ja-JP/gateway/authentication)
- [リモート Gateway セットアップ](/ja-JP/gateway/remote-gateway-readme)
