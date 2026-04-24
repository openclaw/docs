---
read_when:
    - ヘッドレス Node ホストを実行する դեպքում
    - '`system.run` 用に非 macOS の Node をペアリングする場合'
summary: '`openclaw node` の CLI リファレンス（ヘッドレス Node ホスト）'
title: Node
x-i18n:
    generated_at: "2026-04-24T04:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 002412b2ca7d0ed301cc29480ba7323ddb68dc6656bd6b739afab8179fa71664
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で
`system.run` / `system.which` を公開する**ヘッドレス Node ホスト**を実行します。

## なぜ Node ホストを使うのか？

Node ホストは、ネットワーク内の**他のマシンでコマンドを実行**したいが、
そこに完全な macOS コンパニオンアプリをインストールしたくない場合に使います。

よくある用途:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- exec は Gateway 上で**サンドボックス化**したまま、承認済みの実行を他のホストに委譲する。
- 自動化や CI Node 用の軽量なヘッドレス実行ターゲットを提供する。

実行は引き続き、Node ホスト上の**exec 承認**とエージェントごとの許可リストによって保護されるため、
コマンドアクセスをスコープ化し、明示的に保つことができます。

## ブラウザープロキシ（ゼロ設定）

`browser.enabled` が Node 上で無効化されていない場合、Node ホストは自動的にブラウザープロキシを公開します。これにより、エージェントは追加設定なしでその Node 上のブラウザー自動化を使えます。

デフォルトでは、このプロキシは Node の通常のブラウザープロファイルサーフェスを公開します。`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限的になります。
許可リストにないプロファイルのターゲティングは拒否され、永続プロファイルの
作成/削除ルートはプロキシ経由でブロックされます。

必要であれば Node 側で無効化してください。

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 実行（フォアグラウンド）

```bash
openclaw node run --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--tls`: Gateway 接続に TLS を使用
- `--tls-fingerprint <sha256>`: 期待する TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: Node ID を上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Node の表示名を上書き

## Node ホスト用の Gateway 認証

`openclaw node run` と `openclaw node install` は、Gateway 認証を config/env から解決します（Node コマンドには `--token`/`--password` フラグはありません）。

- 最初に `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` を確認します。
- 次にローカル設定へのフォールバック: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef で明示的に設定されていて未解決の場合、Node 認証解決は fail-closed で失敗します（リモートフォールバックで隠されません）。
- `gateway.mode=remote` では、リモートクライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）も、リモート優先順位ルールに従って対象になります。
- Node ホスト認証解決は `OPENCLAW_GATEWAY_*` 環境変数のみを考慮します。

## サービス（バックグラウンド）

ヘッドレス Node ホストをユーザーサービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--tls`: Gateway 接続に TLS を使用
- `--tls-fingerprint <sha256>`: 期待する TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: Node ID を上書き（ペアリングトークンをクリア）
- `--display-name <name>`: Node の表示名を上書き
- `--runtime <runtime>`: サービスランタイム（`node` または `bun`）
- `--force`: すでにインストール済みの場合に再インストール/上書き

サービス管理:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドの Node ホスト（サービスなし）には `openclaw node run` を使用してください。

サービスコマンドは、機械可読な出力のために `--json` を受け付けます。

## ペアリング

最初の接続では、Gateway 上に保留中のデバイスペアリングリクエスト（`role: node`）が作成されます。
次で承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Node が変更された認証詳細（role/scopes/public key）でペアリングを再試行した場合、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前にもう一度 `openclaw devices list` を実行してください。

Node ホストは、その Node ID、トークン、表示名、Gateway 接続情報を
`~/.openclaw/node.json` に保存します。

## exec 承認

`system.run` はローカルの exec 承認によって制御されます。

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期 Node exec では、OpenClaw はプロンプト前に正規の `systemRunPlan`
を準備します。後で承認された `system.run` 転送は、その保存済み
プランを再利用するため、承認リクエスト作成後に command/cwd/session フィールドを編集しても、
Node が実行する内容を変更するのではなく拒否されます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
