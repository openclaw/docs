---
read_when:
    - ヘッドレス Node ホストの実行
    - system.run 用に非 macOS ノードをペアリングする
summary: '`openclaw node`（ヘッドレスノードホスト）の CLI リファレンス'
title: Node
x-i18n:
    generated_at: "2026-06-27T10:58:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で `system.run` / `system.which` を公開する **ヘッドレスノードホスト**を実行します。

## ノードホストを使う理由

ネットワーク内の**他のマシンでコマンドを実行**したいが、そこに完全な macOS コンパニオンアプリをインストールしたくない場合は、ノードホストを使います。

一般的なユースケース:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- exec を Gateway 上で**サンドボックス化**したまま、承認済みの実行を他のホストに委任する。
- 自動化または CI ノード向けに、軽量なヘッドレス実行ターゲットを提供する。

実行は引き続き **exec 承認**と、ノードホスト上のエージェントごとの許可リストで保護されるため、コマンドアクセスをスコープ付きで明示的に保てます。

## ブラウザプロキシ（ゼロ設定）

ノードホストでは、ノード上で `browser.enabled` が無効化されていない場合、ブラウザプロキシが自動的に広告されます。これにより、エージェントは追加設定なしでそのノード上のブラウザ自動化を使えます。

デフォルトでは、プロキシはノードの通常のブラウザプロファイルサーフェスを公開します。`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限的になります。許可リストにないプロファイル指定は拒否され、永続プロファイルの作成/削除ルートはプロキシ経由でブロックされます。

必要に応じてノード上で無効化します:

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
- `--tls`: Gateway 接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 想定される TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: ノード ID を上書きする（ペアリングトークンをクリア）
- `--display-name <name>`: ノード表示名を上書きする

## ノードホストの Gateway 認証

`openclaw node run` と `openclaw node install` は、config/env から Gateway 認証を解決します（ノードコマンドには `--token`/`--password` フラグはありません）:

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` が最初に確認されます。
- 次にローカル設定のフォールバック: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、ノードホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、解決されていない場合、ノード認証の解決はフェイルクローズします（リモートフォールバックによるマスキングはありません）。
- `gateway.mode=remote` では、リモートクライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）もリモート優先順位ルールに従って対象になります。
- ノードホストの認証解決は `OPENCLAW_GATEWAY_*` env vars のみを尊重します。

平文の `ws://` Gateway に接続するノードでは、loopback、プライベート IP リテラル、`.local`、Tailnet `*.ts.net` ホストが許可されます。その他の信頼済みプライベート DNS 名については、`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。これがない場合、ノード起動はフェイルクローズし、`wss://`、SSH トンネル、または Tailscale の使用を求めます。これはプロセス環境のオプトインであり、`openclaw.json` の設定キーではありません。
`openclaw node install` は、インストールコマンド環境に存在する場合、それを監視対象のノードサービスに永続化します。

## サービス（バックグラウンド）

ヘッドレスノードホストをユーザーサービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--tls`: Gateway 接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 想定される TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: ノード ID を上書きする（ペアリングトークンをクリア）
- `--display-name <name>`: ノード表示名を上書きする
- `--runtime <runtime>`: サービスランタイム（`node` または `bun`）
- `--force`: すでにインストール済みの場合に再インストール/上書きする

サービスを管理します:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドのノードホストには `openclaw node run` を使います（サービスなし）。

サービスコマンドは、機械可読出力用に `--json` を受け付けます。

ノードホストは、Gateway の再起動とネットワーク切断をプロセス内で再試行します。Gateway が終端的なトークン/パスワード/bootstrap 認証一時停止を報告した場合、ノードホストはクローズ詳細をログに記録し、非ゼロで終了します。これにより、launchd/systemd が新しい設定と認証情報で再起動できます。ペアリング必須の一時停止はフォアグラウンドフローに残るため、保留中のリクエストを承認できます。

## ペアリング

最初の接続により、Gateway 上に保留中のデバイスペアリングリクエスト（`role: node`）が作成されます。
次で承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

厳密に管理されたノードネットワークでは、Gateway オペレーターが、信頼済み CIDR からの初回ノードペアリングの自動承認に明示的にオプトインできます:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

これはデフォルトで無効です。これは、要求スコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザクライアント、Control UI、WebChat、およびロール、スコープ、メタデータ、公開鍵のアップグレードには、引き続き手動承認が必要です。

ノードが変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前に `openclaw devices list` を再度実行してください。

ノードホストは、ノード ID、トークン、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。

## Exec 承認

`system.run` はローカル exec 承認によってゲートされます:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`、または
  変数が未設定の場合は `~/.openclaw/exec-approvals.json`
- [Exec 承認](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期ノード exec では、OpenClaw はプロンプト前に正規の `systemRunPlan` を準備します。後続の承認済み `system.run` 転送は、その保存済みプランを再利用します。そのため、承認リクエスト作成後に command/cwd/session フィールドを編集すると、ノードが実行する内容を変更するのではなく拒否されます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
