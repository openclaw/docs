---
read_when:
    - リモート Gateway セットアップの実行またはトラブルシューティング
summary: Gateway WS、SSH トンネル、tailnet を使用したリモートアクセス
title: リモートアクセス
x-i18n:
    generated_at: "2026-07-03T23:26:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

このリポジトリは、専用ホスト（デスクトップ/サーバー）上で単一の Gateway（マスター）を実行し続け、クライアントをそこへ接続することで、リモート Gateway アクセスをサポートします。

- **オペレーター（あなた / macOS アプリ）向け**: Gateway に到達できる場合は、直接の LAN/Tailnet WebSocket が最も簡単です。SSH トンネルは汎用的なフォールバックです。
- **ノード（iOS/Android と将来のデバイス）向け**: 必要に応じて LAN/tailnet または SSH トンネル経由で、Gateway **WebSocket** に接続します。

## 核心となる考え方

- Gateway WebSocket は通常、設定済みポート（デフォルトは 18789）の **ループバック** にバインドします。
- リモート利用では、Tailscale Serve、信頼済み LAN/Tailnet バインド、または SSH 経由でループバックポートを転送して公開します。

## 一般的な VPN と tailnet 構成

**Gateway ホスト**はエージェントが存在する場所だと考えてください。セッション、認証プロファイル、チャネル、状態を所有します。ノート PC、デスクトップ、ノードはそのホストへ接続します。

### tailnet 内で常時稼働する Gateway

永続ホスト（VPS またはホームサーバー）で Gateway を実行し、**Tailscale** または SSH で到達します。

- **最良の UX:** `gateway.bind: "loopback"` を維持し、Control UI には **Tailscale Serve** を使用します。
- **信頼済み LAN/Tailnet:** Gateway をプライベートインターフェイスにバインドし、`gateway.remote.transport: "direct"` で直接接続します。
- **フォールバック:** ループバックを維持し、アクセスが必要な任意のマシンから SSH トンネルを使用します。
- **例:** [exe.dev](/ja-JP/install/exe-dev)（簡単な VM）または [Hetzner](/ja-JP/install/hetzner)（本番 VPS）。

ノート PC が頻繁にスリープする一方で、エージェントを常時稼働させたい場合に理想的です。

### ホームデスクトップで Gateway を実行する

ノート PC はエージェントを実行**しません**。リモートで接続します。

- macOS アプリのリモートモードを使用します（Settings → General → OpenClaw runs）。
- Gateway が LAN/Tailnet 上で到達可能な場合、アプリは直接接続します。SSH を選択した場合は、SSH トンネルを開いて管理します。

運用手順: [macOS リモートアクセス](/ja-JP/platforms/mac/remote)。

### ノート PC で Gateway を実行する

Gateway をローカルに保ちつつ、安全に公開します。

- 他のマシンからノート PC へ SSH トンネルを張る、または
- Control UI を Tailscale Serve し、Gateway はループバック専用のままにします。

ガイド: [Tailscale](/ja-JP/gateway/tailscale) と [Web 概要](/ja-JP/web)。

## コマンドフロー（どこで何が実行されるか）

1 つの Gateway サービスが状態 + チャネルを所有します。ノードは周辺機器です。

フロー例（Telegram → ノード）:

- Telegram メッセージが **Gateway** に到着します。
- Gateway が **エージェント**を実行し、ノードツールを呼び出すかどうかを判断します。
- Gateway が Gateway WebSocket（`node.*` RPC）経由で **ノード**を呼び出します。
- ノードが結果を返し、Gateway が Telegram へ返信します。

注記:

- **ノードは Gateway サービスを実行しません。** 意図的に分離プロファイルを実行する場合を除き、ホストごとに実行する Gateway は 1 つだけにしてください（[複数 Gateway](/ja-JP/gateway/multiple-gateways) を参照）。
- macOS アプリの「node mode」は、Gateway WebSocket 上のノードクライアントにすぎません。

## SSH トンネル（CLI + ツール）

リモート Gateway WS へのローカルトンネルを作成します。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが有効な状態では:

- `openclaw health` と `openclaw status --deep` は、`ws://127.0.0.1:18789` 経由でリモート Gateway に到達します。
- `openclaw gateway status`、`openclaw gateway health`、`openclaw gateway probe`、`openclaw gateway call` も、必要に応じて `--url` で転送先 URL を対象にできます。

<Note>
`18789` は、設定済みの `gateway.port`（または `--port` か `OPENCLAW_GATEWAY_PORT`）に置き換えてください。
</Note>

<Warning>
`--url` を渡すと、CLI は config や環境の認証情報へフォールバックしません。`--token` または `--password` を明示的に含めてください。明示的な認証情報がない場合はエラーです。
</Warning>

## CLI リモートデフォルト

リモートターゲットを永続化して、CLI コマンドがデフォルトでそれを使用するようにできます。

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
これらのポートが異なる場合は、SSH ホスト上の Gateway ポートを
`gateway.remote.remotePort` に設定します。
ホストキー検証はデフォルトで厳格です。管理対象エイリアスは、
`gateway.remote.sshHostKeyPolicy: "openssh"` で有効な OpenSSH 信頼ポリシーを明示的に使用できます。有効化する前に、一致するユーザーおよびシステムの
SSH 設定を確認してください。

信頼済み LAN または Tailnet ですでに到達可能な Gateway には、direct モードを使用します。

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

Gateway の認証情報解決は、call/probe/status パスと Discord exec-approval 監視全体で、1 つの共有契約に従います。Node-host は、1 つのローカルモード例外（意図的に `gateway.remote.*` を無視する）を除き、同じ基本契約を使用します。

- 明示的な認証情報（`--token`、`--password`、またはツールの `gatewayToken`）は、明示的な認証を受け付ける call パスでは常に優先されます。
- URL オーバーライドの安全性:
  - CLI URL オーバーライド（`--url`）は、暗黙の config/env 認証情報を再利用しません。
  - Env URL オーバーライド（`OPENCLAW_GATEWAY_URL`）は、env 認証情報（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`）のみを使用できます。
- ローカルモードのデフォルト:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`（リモートフォールバックは、ローカル認証 token 入力が未設定の場合にのみ適用）
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`（リモートフォールバックは、ローカル認証 password 入力が未設定の場合にのみ適用）
- リモートモードのデフォルト:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host のローカルモード例外: `gateway.remote.token` / `gateway.remote.password` は無視されます。
- リモート probe/status の token チェックはデフォルトで厳格です。リモートモードを対象にする場合、`gateway.remote.token` のみを使用します（ローカル token フォールバックなし）。
- Gateway env オーバーライドは `OPENCLAW_GATEWAY_*` のみを使用します。

## Chat UI のリモートアクセス

WebChat は別個の HTTP ポートを使用しなくなりました。SwiftUI チャット UI は Gateway WebSocket に直接接続します。

- SSH 経由で `18789` を転送し（上記参照）、クライアントを `ws://127.0.0.1:18789` に接続します。
- LAN/Tailnet direct モードでは、設定済みのプライベート `ws://` または安全な `wss://` URL にクライアントを接続します。
- macOS では、選択されたトランスポートを自動的に管理するアプリのリモートモードを優先してください。

## macOS アプリのリモートモード

macOS メニューバーアプリは、同じセットアップをエンドツーエンドで駆動できます（リモート状態チェック、WebChat、Voice Wake 転送）。

運用手順: [macOS リモートアクセス](/ja-JP/platforms/mac/remote)。

## セキュリティルール（リモート/VPN）

短く言うと、バインドが必要だと確信できる場合を除き、**Gateway はループバック専用に保ってください**。

- **ループバック + SSH/Tailscale Serve** が最も安全なデフォルトです（公開露出なし）。
- 平文の `ws://` は、ループバック、LAN、link-local、`.local`、`.ts.net`、Tailscale CGNAT ホストで受け付けられます。公開リモートホストでは `wss://` を使用する必要があります。
- **非ループバックバインド**（`lan`/`tailnet`/`custom`、またはループバックが利用できない場合の `auto`）では、token、password、または `gateway.auth.mode: "trusted-proxy"` を備えた identity-aware リバースプロキシによる Gateway 認証を使用する必要があります。
- `gateway.remote.token` / `.password` はクライアント認証情報ソースです。それ自体ではサーバー認証を設定しません。
- ローカル call パスは、`gateway.auth.*` が未設定の場合にのみ `gateway.remote.*` をフォールバックとして使用できます。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決されない場合、解決は fail closed します（リモートフォールバックで隠蔽しません）。
- `gateway.remote.tlsFingerprint` は、macOS direct モードを含め、`wss://` 使用時にリモート TLS 証明書をピン留めします。設定済みまたは以前に保存済みの pin がない場合、macOS は通常のシステム信頼を通過した後にのみ初回使用証明書をピン留めします。macOS がまだ信頼していない自己署名またはプライベート CA の Gateway には、明示的な fingerprint または SSH 経由の Remote が必要です。
- **Tailscale Serve** は、`gateway.auth.allowTailscale: true` の場合、identity
  headers 経由で Control UI/WebSocket トラフィックを認証できます。HTTP API エンドポイントはその Tailscale header auth を使用せず、代わりに Gateway の通常の HTTP
  auth モードに従います。この tokenless フローは、Gateway ホストが信頼済みであることを前提にします。すべての場所で shared-secret auth を使いたい場合は、
  `false` に設定してください。
- **Trusted-proxy** auth は、デフォルトでは非ループバックの identity-aware proxy 構成を想定します。
  同一ホストのループバックリバースプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- ブラウザー制御はオペレーターアクセスと同様に扱ってください。tailnet 専用 + 明示的なノードペアリングにします。

詳細解説: [セキュリティ](/ja-JP/gateway/security)。

### macOS: LaunchAgent による永続 SSH トンネル

リモート Gateway に接続する macOS クライアントでは、SSH `LocalForward` config エントリと LaunchAgent を使用して、再起動やクラッシュをまたいでトンネルを維持するのが最も簡単な永続セットアップです。

#### ステップ 1: SSH config を追加する

`~/.ssh/config` を編集します。

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` と `<REMOTE_USER>` を自分の値に置き換えてください。

#### ステップ 2: SSH キーをコピーする（一度だけ）

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### ステップ 3: Gateway token を設定する

再起動後も保持されるよう、token を config に保存します。

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
古いセットアップの `com.openclaw.ssh-tunnel` LaunchAgent が残っている場合は、アンロードして削除してください。
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
| `KeepAlive`                          | トンネルがクラッシュした場合に自動的に再起動します           |
| `RunAtLoad`                          | ログイン時に LaunchAgent が読み込まれるとトンネルを開始します |

## 関連

- [Tailscale](/ja-JP/gateway/tailscale)
- [認証](/ja-JP/gateway/authentication)
- [リモート Gateway セットアップ](/ja-JP/gateway/remote-gateway-readme)
