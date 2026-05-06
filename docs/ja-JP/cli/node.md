---
read_when:
    - ヘッドレス Node ホストの実行
    - system.run 用に macOS 以外のノードをペアリングする
summary: '`openclaw node` の CLI リファレンス（ヘッドレス Node ホスト）'
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で `system.run` / `system.which` を公開する **ヘッドレス Node ホスト**を実行します。

## なぜ Node ホストを使うのか？

ネットワーク内の別のマシンで、完全な macOS コンパニオンアプリをインストールせずに、エージェントに **コマンドを実行させたい**場合は Node ホストを使います。

一般的なユースケース:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボ用マシン、NAS）でコマンドを実行する。
- Gateway 上では exec を **サンドボックス化**したまま、承認済みの実行を他のホストへ委任する。
- 自動化や CI ノード向けに、軽量でヘッドレスな実行ターゲットを提供する。

実行は引き続き、Node ホスト上の **exec 承認**とエージェントごとの許可リストによって保護されるため、コマンドアクセスを限定的かつ明示的に保てます。

## ブラウザプロキシ（ゼロ設定）

Node ホストでは、ノード上で `browser.enabled` が無効化されていない場合、ブラウザプロキシが自動的に通知されます。これにより、追加設定なしでエージェントがそのノード上のブラウザ自動化を利用できます。

デフォルトでは、プロキシはノードの通常のブラウザプロファイル面を公開します。`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限的になります。許可リストにないプロファイル指定は拒否され、永続プロファイルの作成/削除ルートはプロキシ経由ではブロックされます。

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
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: ノード ID を上書きする（ペアリングトークンをクリア）
- `--display-name <name>`: ノードの表示名を上書きする

## Node ホストの Gateway 認証

`openclaw node run` と `openclaw node install` は config/env から Gateway 認証を解決します（Node コマンドに `--token`/`--password` フラグはありません）:

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` が最初に確認されます。
- 次にローカル設定へフォールバックします: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef 経由で明示的に設定され、未解決の場合、Node 認証の解決は fail closed します（リモートフォールバックで隠蔽されません）。
- `gateway.mode=remote` では、リモート優先順位ルールに従って、リモートクライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）も対象になります。
- Node ホストの認証解決では `OPENCLAW_GATEWAY_*` 環境変数のみが考慮されます。

信頼されたプライベートネットワーク上の非ループバック `ws://` Gateway に Node を接続する場合は、`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。これがない場合、Node の起動は fail closed し、`wss://`、SSH トンネル、または Tailscale の使用を求めます。
これはプロセス環境での明示的なオプトインであり、`openclaw.json` の設定キーではありません。
`openclaw node install` は、インストールコマンドの環境に存在する場合、それを監視対象の Node サービスに永続化します。

## サービス（バックグラウンド）

ヘッドレス Node ホストをユーザーサービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--tls`: Gateway 接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: ノード ID を上書きする（ペアリングトークンをクリア）
- `--display-name <name>`: ノードの表示名を上書きする
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

フォアグラウンドの Node ホストには `openclaw node run` を使用します（サービスなし）。

サービスコマンドは、機械可読出力用に `--json` を受け付けます。

Node ホストは Gateway の再起動とネットワーク切断をプロセス内で再試行します。Gateway が終端的なトークン/パスワード/ブートストラップ認証の一時停止を報告した場合、Node ホストはクローズ詳細をログに記録し、launchd/systemd が新しい設定と認証情報で再起動できるように非ゼロで終了します。ペアリング必須の一時停止は、保留中のリクエストを承認できるようにフォアグラウンドフローに残ります。

## ペアリング

最初の接続では、Gateway 上に保留中のデバイスペアリングリクエスト（`role: node`）が作成されます。
次の方法で承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

厳密に管理された Node ネットワークでは、Gateway オペレーターは信頼された CIDR からの初回 Node ペアリングの自動承認へ明示的にオプトインできます:

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

これはデフォルトで無効です。要求されたスコープがない新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザクライアント、Control UI、WebChat、およびロール、スコープ、メタデータ、公開鍵のアップグレードには、引き続き手動承認が必要です。

Node が変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認する前に、もう一度 `openclaw devices list` を実行してください。

Node ホストは、ノード ID、トークン、表示名、Gateway 接続情報を `~/.openclaw/node.json` に保存します。

## Exec 承認

`system.run` はローカルの exec 承認によって制御されます:

- `~/.openclaw/exec-approvals.json`
- [Exec 承認](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期 Node exec では、OpenClaw はプロンプト表示前に正規の `systemRunPlan` を準備します。後で承認済みの `system.run` 転送は保存済みのプランを再利用するため、承認リクエスト作成後に command/cwd/session フィールドを編集しても、Node が実行する内容を変更する代わりに拒否されます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [ノード](/ja-JP/nodes)
