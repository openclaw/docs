---
read_when:
    - ヘッドレスノードホストの実行
    - system.run 用に非 macOS ノードをペアリングする
summary: '`openclaw node`（ヘッドレス Node ホスト）の CLI リファレンス'
title: Node
x-i18n:
    generated_at: "2026-07-05T11:12:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6bb4efe3852bcbb7802acd882d698c44b62579ca8756c8e50473ce1aa97cad1b
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で `system.run` / `system.which` を公開する **ヘッドレスノードホスト**を実行します。

## なぜノードホストを使うのか?

ネットワーク内の**他のマシンでコマンドを実行**したいが、そこに完全な macOS コンパニオンアプリをインストールしたくない場合に、ノードホストを使います。

一般的なユースケース:

- リモートの Linux/Windows マシン (ビルドサーバー、ラボマシン、NAS) でコマンドを実行する。
- Gateway 上では exec を**サンドボックス化**したまま、承認済みの実行を他のホストへ委任する。
- 自動化や CI ノード向けに、軽量なヘッドレス実行ターゲットを提供する。

実行は引き続き、ノードホスト上の **exec 承認**とエージェントごとの許可リストによって保護されるため、コマンドアクセスを限定的かつ明示的に保てます。

## ブラウザプロキシ (ゼロ設定)

ノード上で `browser.enabled` が無効化されていない場合、ノードホストはブラウザプロキシを自動的にアドバタイズします。これにより、追加設定なしでエージェントがそのノード上のブラウザ自動化を使用できます。

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

## 実行 (フォアグラウンド)

```bash
openclaw node run --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト (デフォルト: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket ポート (デフォルト: `18789`)
- `--context-path <path>`: Gateway WebSocket コンテキストパス (例: `/openclaw-gw`)。WebSocket URL に追加されます。
- `--tls`: Gateway 接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書フィンガープリント (sha256)
- `--node-id <id>`: ノード ID を上書きする (ペアリングトークンをクリア)
- `--display-name <name>`: ノード表示名を上書きする

## ノードホストの Gateway 認証

`openclaw node run` と `openclaw node install` は、config/env から Gateway 認証を解決します (ノードコマンドに `--token`/`--password` フラグはありません):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` が最初に確認されます。
- 次にローカル設定のフォールバック: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、ノードホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、未解決の場合、ノード認証の解決は fail closed します (リモートフォールバックで隠されません)。
- `gateway.mode=remote` では、リモート優先順位ルールに従って、リモートクライアントフィールド (`gateway.remote.token` / `gateway.remote.password`) も対象になります。
- ノードホストの認証解決は `OPENCLAW_GATEWAY_*` env vars のみを尊重します。

平文の `ws://` Gateway に接続するノードでは、loopback、プライベート IP リテラル、`.local`、Tailnet `*.ts.net` ホストが受け入れられます。その他の信頼済みプライベート DNS 名については、`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。設定しない場合、ノード起動は fail closed し、`wss://`、SSH トンネル、または Tailscale の使用を求めます。これはプロセス環境でのオプトインであり、`openclaw.json` 設定キーではありません。
`openclaw node install` は、インストールコマンド環境に存在する場合、それを監視対象のノードサービスに永続化します。

## サービス (バックグラウンド)

ヘッドレスノードホストをユーザーサービスとしてインストールします (macOS では launchd、Linux では systemd、Windows では Windows Task Scheduler)。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト (デフォルト: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket ポート (デフォルト: `18789`)
- `--context-path <path>`: Gateway WebSocket コンテキストパス (例: `/openclaw-gw`)。WebSocket URL に追加されます。
- `--tls`: Gateway 接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書フィンガープリント (sha256)
- `--node-id <id>`: ノード ID を上書きする (ペアリングトークンをクリア)
- `--display-name <name>`: ノード表示名を上書きする
- `--runtime <runtime>`: サービスランタイム (`node` または `bun`)
- `--force`: すでにインストール済みの場合に再インストール/上書きする

サービスを管理します:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドのノードホストには `openclaw node run` を使います (サービスなし)。

サービスコマンドは、機械可読出力のために `--json` を受け付けます。

ノードホストは、Gateway の再起動とネットワーク切断をプロセス内で再試行します。Gateway が終端的なトークン/パスワード/ブートストラップ認証の一時停止を報告した場合、ノードホストはクローズ詳細をログに記録し、非ゼロで終了します。これにより、launchd/systemd/Task Scheduler が新しい設定と認証情報で再起動できます。ペアリング必須の一時停止はフォアグラウンドフローに留まり、保留中のリクエストを承認できるようにします。

## ペアリング

最初の接続により、Gateway 上に保留中のデバイスペアリングリクエスト (`role: node`) が作成されます。
次で承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

厳密に管理されたノードネットワークでは、Gateway オペレーターが信頼済み CIDR からの初回ノードペアリングの自動承認を明示的にオプトインできます:

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

これはデフォルトでは無効です (`autoApproveCidrs` は未設定)。Gateway が信頼するクライアント IP からの、要求スコープなしの新規 `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザクライアント、Control UI、WebChat、およびロール、スコープ、メタデータ、公開鍵のアップグレードには、引き続き手動承認が必要です。

ノードが変更された認証詳細 (ロール/スコープ/公開鍵) でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前に `openclaw devices list` を再度実行してください。

ノードホストは、ノード ID、トークン、表示名、Gateway 接続情報を OpenClaw 状態ディレクトリ内の `node.json` に保存します (デフォルトは `~/.openclaw`、設定されている場合は `$OPENCLAW_STATE_DIR`)。

## Exec 承認

`system.run` はローカルの exec 承認によってゲートされます:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`、または変数が未設定の場合は
  `~/.openclaw/exec-approvals.json`
- [Exec 承認](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway から編集)

承認済みの非同期ノード exec では、OpenClaw はプロンプト表示前に正規の `systemRunPlan` を準備します。後で承認された `system.run` 転送はその保存済みプランを再利用するため、承認リクエスト作成後の command/cwd/session フィールド編集は、ノードが実行する内容を変更する代わりに拒否されます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
