---
read_when:
    - ヘッドレス Node ホストの実行
    - system.run 用に macOS 以外の Node をペアリングする
summary: '`openclaw node`（ヘッドレス Node ホスト）の CLI リファレンス'
title: Node
x-i18n:
    generated_at: "2026-07-11T22:03:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で `system.run` / `system.which` を公開する**ヘッドレス Node ホスト**を実行します。

## Node ホストを使用する理由

完全な macOS コンパニオンアプリをインストールせずに、エージェントからネットワーク内の**別のマシンでコマンドを実行**したい場合に Node ホストを使用します。

一般的なユースケース:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- Gateway 上では exec を**サンドボックス化**したまま、承認済みの実行を別のホストに委任する。
- 自動化や CI Node 向けに、軽量なヘッドレス実行ターゲットを提供する。

実行は引き続き Node ホスト上の**実行承認**とエージェントごとの許可リストによって保護されるため、コマンドアクセスの範囲を限定し、明示的に管理できます。

`openclaw node run` は接続後に、Plugin または MCP ベースのツールを公開できます。Gateway はデフォルトでペアリング済み Node からの記述子を信頼しますが、各記述子のコマンドは Node の承認済みコマンド範囲内に留まる必要があります。エージェントには、承認された各記述子が通常の Plugin ツールとして表示されますが、実行は引き続き `node.invoke` を経由するため、Node を切断すると、そのツールは新しいエージェント実行から削除されます。Gateway オペレーターは `gateway.nodes.pluginTools.enabled: false` で公開を無効にできます。

宣言的な MCP ツールの場合は、Node マシン上の `openclaw.json` で通常の MCP サーバー構成を `nodeHost.mcp.servers` 配下に追加し、Node ホストを再起動します。Node は承認によって制御される `mcp.tools.call.v1` コマンドファミリーを宣言し、接続後に一覧のツールを公開します。後からサーバー一覧を変更しても、再ペアリングは不要です。[Node ホスト型 MCP サーバー](/ja-JP/nodes#node-hosted-mcp-servers)を参照してください。

## ブラウザプロキシ（設定不要）

Node 上で `browser.enabled` が無効化されていない場合、Node ホストはブラウザプロキシを自動的に公開します。これにより、追加設定なしでエージェントがその Node 上のブラウザ自動化を使用できます。

デフォルトでは、プロキシは Node の通常のブラウザプロファイル範囲を公開します。`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限モードになり、許可リストにないプロファイルの指定は拒否され、永続プロファイルの作成・削除ルートはプロキシ経由でブロックされます。

必要に応じて Node 上で無効にします:

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
- `--context-path <path>`: Gateway WebSocket コンテキストパス（例: `/openclaw-gw`）。WebSocket URL に追加されます。
- `--tls`: Gateway 接続に TLS を使用する
- `--no-tls`: ローカルの Gateway 設定で TLS が有効な場合でも、平文の Gateway 接続を強制する
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: `node.json` に保存された従来のクライアントインスタンス ID を上書きする（ペアリングはリセットされません）
- `--display-name <name>`: Node の表示名を上書きする

## Node ホストの Gateway 認証

`openclaw node run` と `openclaw node install` は、設定または環境変数から Gateway 認証を解決します（Node コマンドには `--token` / `--password` フラグはありません）:

- 最初に `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` を確認します。
- 次にローカル設定へフォールバックします: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef で明示的に設定されていて未解決の場合、Node の認証解決はフェイルクローズします（リモートへのフォールバックで隠蔽しません）。
- `gateway.mode=remote` では、リモートの優先順位規則に従い、リモートクライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）も使用できます。
- Node ホストの認証解決で使用される環境変数は `OPENCLAW_GATEWAY_*` のみです。

平文の `ws://` Gateway に接続する Node では、ループバック、プライベート IP リテラル、`.local`、および Tailnet の `*.ts.net` ホストが許可されます。その他の信頼済みプライベート DNS 名を使用する場合は、`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。設定しない場合、Node の起動はフェイルクローズし、`wss://`、SSH トンネル、または Tailscale の使用を求めます。これはプロセス環境による明示的なオプトインであり、`openclaw.json` の設定キーではありません。
`openclaw node install` は、インストールコマンドの環境にこの値が存在する場合、監視対象の Node サービスに永続化します。

## サービス（バックグラウンド）

ヘッドレス Node ホストをユーザーサービスとしてインストールします（macOS では launchd、Linux では systemd、Windows では Windows Task Scheduler）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--context-path <path>`: Gateway WebSocket コンテキストパス（例: `/openclaw-gw`）。WebSocket URL に追加されます。
- `--tls`: Gateway 接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: `node.json` に保存された従来のクライアントインスタンス ID を上書きする（ペアリングはリセットされません）
- `--display-name <name>`: Node の表示名を上書きする
- `--runtime <runtime>`: サービスランタイム（`node` または `bun`）
- `--force`: すでにインストール済みの場合に再インストールまたは上書きする

サービスを管理するには:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドの Node ホストには `openclaw node run` を使用します（サービスは使用しません）。

サービスコマンドは、機械可読な出力のために `--json` を受け付けます。

Node ホストは、Gateway の再起動やネットワーク切断に対してプロセス内で再試行します。Gateway が、トークン、パスワード、またはブートストラップ認証による終端的な一時停止を報告した場合、Node ホストは切断の詳細をログに記録し、0 以外で終了します。これにより、launchd、systemd、または Task Scheduler が最新の設定と認証情報で再起動できます。ペアリングが必要な一時停止はフォアグラウンドフローに留まり、保留中のリクエストを承認できます。

## ペアリング

最初の接続時に、Gateway 上で保留中のデバイスペアリングリクエスト（`role: node`）が作成されます。

Gateway ホストから Node ホストへ非対話的に SSH 接続できる場合（同一ユーザー、信頼済みホストキー）、保留中のリクエストは自動承認されます。Gateway は SSH 経由で Node ホスト上の `openclaw node identity --json` を実行し、デバイスキーが完全に一致した場合に承認します。これはデフォルトで有効です。要件と無効化方法（`gateway.nodes.pairing.sshVerify: false`）については、[SSH 検証済みデバイスの自動承認](/ja-JP/gateway/pairing#ssh-verified-device-auto-approval-default)を参照してください。

それ以外の場合は、次のコマンドで手動承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway が照合するローカル Node ID を確認するには:

```bash
openclaw node identity --json
```

`identity/device.json` のデバイス ID と公開鍵を出力し、ID ファイルを作成または変更することはありません。

厳密に管理された Node ネットワークでは、Gateway オペレーターは信頼済み CIDR からの初回 Node ペアリングの自動承認を明示的に有効化できます:

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

これはデフォルトでは無効です（`autoApproveCidrs` は未設定）。Gateway が信頼するクライアント IP からの、スコープ要求を伴わない新規の `role: node` ペアリングにのみ適用されます。オペレーターまたはブラウザのクライアント、Control UI、WebChat、およびロール、スコープ、メタデータ、公開鍵のアップグレードには、引き続き手動承認が必要です。

Node が変更された認証詳細（ロール、スコープ、公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前にもう一度 `openclaw devices list` を実行してください。

### ID とペアリング状態

ヘッドレス Node では、従来のクライアントインスタンス ID と、Gateway がペアリングとルーティングに使用する署名済みデバイス ID を分離しています。これらのファイルは OpenClaw の状態ディレクトリ（デフォルトでは `~/.openclaw`、`$OPENCLAW_STATE_DIR` が設定されている場合はその値）に保存されます:

| ファイル                    | 用途                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | 従来の `nodeId` キー配下のクライアントインスタンス ID、表示名、および Gateway 接続メタデータ。クライアントはこの値を `instanceId` として送信します。 |
| `identity/device.json`      | 署名済み Ed25519 キーペアと、それから導出されたデバイス ID。署名済み接続では、このデバイス ID がルーティングされる Node ID およびペアリング ID になります。 |
| `identity/device-auth.json` | 暗号学的デバイス ID とロールをキーとする、ペアリング済みデバイストークン。                                                                          |

`--node-id` は `node.json` 内のクライアントインスタンス ID のみを変更します。暗号学的デバイス ID の変更や、ペアリング認証の消去は行いません。同様に、`node.json` だけを削除してもペアリングはリセットされません。Node を取り消して再ペアリングするには:

1. Gateway 上で `openclaw nodes remove --node <id|name|ip>` を実行します。
2. Node 上で、`openclaw node restart` を使用してインストール済みサービスを再起動するか、フォアグラウンドの `openclaw node run` コマンドを停止して再実行します。これにより、デバイスペアリングフローが開始されます。`openclaw devices list` にリクエストが表示されず、Node が `AUTH_DEVICE_TOKEN_MISMATCH` を報告する場合は、もう一度再起動または再実行してください。拒否された試行によって、取り消し済みとなったローカルトークンが消去され、次の試行でペアリングを要求できるようになります。
3. Gateway 上で `openclaw devices list` を実行し、続けて `openclaw devices approve <deviceRequestId>` を実行します。
4. Node をもう一度再起動または再実行します。ペアリング待ちで一時停止したクライアントは、承認後に自動再開しません。この再接続により、別個のコマンド範囲リクエストが作成されます。
5. Gateway 上で `openclaw nodes pending` を実行し、続けて `openclaw nodes approve <nodeRequestId>` を実行します。

2 つのリクエスト ID は異なります。適用可能な信頼済み CIDR ポリシーにより、初回のデバイスペアリング手順を自動承認できますが、コマンド範囲の承認は別個の確認として残ります。

古い OpenClaw リリースでは、従来の `token` フィールドが `node.json` に残ることがありました。現在の OpenClaw はこのフィールドを使用せず、次に Node ホストがファイルを保存する際に削除します。`identity/` 配下の両方のファイルにはデバイスキーペアと認証トークンが含まれるため、非公開に保ってください。

## 実行承認

`system.run` はローカルの実行承認によって制御されます:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`、または変数が未設定の場合は
  `~/.openclaw/exec-approvals.json`
- [実行承認](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期 Node 実行では、OpenClaw は確認を表示する前に正規化された `systemRunPlan` を準備します。後続の承認済み `system.run` 転送では、保存済みの計画を再利用します。そのため、承認リクエスト作成後にコマンド、cwd、セッションのフィールドを編集すると、Node が実行する内容を変更する代わりに拒否されます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Node](/ja-JP/nodes)
