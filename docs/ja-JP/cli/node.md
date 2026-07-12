---
read_when:
    - ヘッドレス Node ホストの実行
    - system.run 用の macOS 以外の Node のペアリング
summary: '`openclaw node`（ヘッドレス Node ホスト）の CLI リファレンス'
title: Node
x-i18n:
    generated_at: "2026-07-12T21:29:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c350655e902f36ecf578c98edf0583ee6621dea6b916cc8da08c35673fef8e49
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で `system.run` / `system.which` を公開する**ヘッドレス Node ホスト**を実行します。

macOS では、メニューバーアプリがすでにこの Node ホストランタイムを独自の Node 接続に組み込み、Mac ネイティブ機能を追加しています。アプリを使用せず、意図的にヘッドレス Node を稼働させたい場合にのみ、Mac で `openclaw node run` を使用してください。両方を実行すると、同じマシンに対して 2 つの Node ID が作成されます。

## Node ホストを使用する理由

完全な macOS コンパニオンアプリをインストールせずに、ネットワーク内の**ほかのマシンでコマンドを実行**する必要がある場合は、Node ホストを使用します。

一般的なユースケース:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- Gateway 上では exec を**サンドボックス化**したまま、承認された実行をほかのホストに委任する。
- 自動化または CI Node 向けに、軽量なヘッドレス実行ターゲットを提供する。

実行は引き続き Node ホスト上の**exec 承認**とエージェントごとの許可リストによって保護されるため、コマンドアクセスの範囲を限定し、明示的に管理できます。

`openclaw node run` は、接続後に Plugin または MCP を基盤とするツールを公開できます。Gateway はデフォルトでペアリング済み Node からの記述子を信頼しますが、各記述子のコマンドが Node の承認済みコマンド範囲内にあることを要求します。エージェントには、受け入れられた各記述子が通常の Plugin ツールとして表示されますが、実行は引き続き `node.invoke` を経由します。そのため、Node が切断されると、そのツールは新しいエージェント実行から削除されます。Gateway のオペレーターは、`gateway.nodes.pluginTools.enabled: false` で公開を無効にできます。

宣言型 MCP ツールの場合は、Node マシン上の `openclaw.json` にある `nodeHost.mcp.servers` の下へ通常の MCP サーバー形式を追加し、Node ホストを再起動します。Node は承認ゲート付きの `mcp.tools.call.v1` コマンドファミリーを宣言し、接続後に一覧化されたツールを公開します。後からサーバー一覧を変更しても、再ペアリングは不要です。[Node でホストされる MCP サーバー](/ja-JP/nodes#node-hosted-mcp-servers)を参照してください。

## ブラウザプロキシ（設定不要）

Node ホストでは、Node 上で `browser.enabled` が無効になっていない場合、ブラウザプロキシが自動的にアドバタイズされます。これにより、追加設定なしでエージェントがその Node 上のブラウザ自動化を使用できます。

デフォルトでは、プロキシは Node の通常のブラウザプロファイル範囲を公開します。`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限モードになります。許可リストにないプロファイルの指定は拒否され、永続プロファイルの作成/削除ルートはプロキシ経由ではブロックされます。

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
- `--node-id <id>`: `node.json` に保存されている従来のクライアントインスタンス ID を上書きする（ペアリングはリセットされません）
- `--display-name <name>`: Node の表示名を上書きする

## Node ホストの Gateway 認証

`openclaw node run` と `openclaw node install` は、設定/環境から Gateway 認証を解決します（Node コマンドには `--token`/`--password` フラグはありません）:

- 最初に `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` が確認されます。
- 次にローカル設定へフォールバックします: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef を介して明示的に設定されているものの解決できない場合、Node 認証の解決はフェイルクローズします（リモートフォールバックによって隠蔽されません）。
- `gateway.mode=remote` では、リモートクライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）もリモートの優先順位ルールに従って使用できます。
- Node ホストの認証解決で使用される環境変数は `OPENCLAW_GATEWAY_*` のみです。

平文の `ws://` Gateway に接続する Node では、loopback、プライベート IP リテラル、`.local`、および Tailnet の `*.ts.net` ホストが許可されます。その他の信頼済みプライベート DNS 名については、`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。設定しない場合、Node の起動はフェイルクローズし、`wss://`、SSH トンネル、または Tailscale の使用を求めます。これはプロセス環境によるオプトインであり、`openclaw.json` の設定キーではありません。
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
- `--node-id <id>`: `node.json` に保存されている従来のクライアントインスタンス ID を上書きする（ペアリングはリセットされません）
- `--display-name <name>`: Node の表示名を上書きする
- `--runtime <runtime>`: サービスランタイム（`node` または `bun`）
- `--force`: すでにインストールされている場合に再インストール/上書きする

サービスを管理します:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドの Node ホストには `openclaw node run` を使用します（サービスは使用しません）。

サービスコマンドは、機械可読な出力用に `--json` を受け付けます。

Node ホストは、Gateway の再起動とネットワーク切断に対してプロセス内で再試行します。Gateway がトークン/パスワード/ブートストラップ認証に関する終了扱いの一時停止を報告した場合、Node ホストは切断の詳細をログに記録し、ゼロ以外のコードで終了します。これにより、launchd/systemd/Task Scheduler が新しい設定と認証情報を使用して再起動できます。ペアリングが必要な一時停止はフォアグラウンドフローに留まり、保留中のリクエストを承認できるようにします。

## ペアリング

最初の接続では、Gateway 上に保留中のデバイスペアリングリクエスト（`role: node`）が作成されます。

Gateway ホストから Node ホストへ非対話的に SSH 接続できる場合（同じユーザー、信頼済みホストキー）、保留中のリクエストは自動的に承認されます。Gateway は SSH 経由で Node ホスト上の `openclaw node identity --json` を実行し、デバイスキーが完全に一致した場合に承認します。これはデフォルトで有効です。要件と無効化方法（`gateway.nodes.pairing.sshVerify: false`）については、[SSH 検証済みデバイスの自動承認](/ja-JP/gateway/pairing#ssh-verified-device-auto-approval-default)を参照してください。

それ以外の場合は、次の方法で手動承認します:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway が照合するローカル Node ID を確認します:

```bash
openclaw node identity --json
```

これは `identity/device.json` のデバイス ID と公開鍵を出力し、ID ファイルを作成または変更することはありません。

厳密に管理された Node ネットワークでは、Gateway のオペレーターが信頼済み CIDR からの初回 Node ペアリングを自動承認するよう明示的にオプトインできます:

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

これはデフォルトで無効です（`autoApproveCidrs` は未設定）。Gateway が信頼するクライアント IP から、要求スコープなしで行われる新規の `role: node` ペアリングにのみ適用されます。オペレーター/ブラウザクライアント、Control UI、WebChat、およびロール、スコープ、メタデータ、公開鍵のアップグレードには、引き続き手動承認が必要です。

Node が変更された認証詳細（ロール/スコープ/公開鍵）でペアリングを再試行すると、以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。承認前に `openclaw devices list` をもう一度実行してください。

### ID とペアリング状態

ヘッドレス Node では、従来のクライアントインスタンス ID と、Gateway がペアリングおよびルーティングに使用する署名済みデバイス ID が分離されています。これらのファイルは OpenClaw の状態ディレクトリ（デフォルトは `~/.openclaw`、設定されている場合は `$OPENCLAW_STATE_DIR`）にあります:

| ファイル                    | 目的                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node.json`                 | 従来の `nodeId` キーに格納されるクライアントインスタンス ID、表示名、および Gateway 接続メタデータ。クライアントはこの値を `instanceId` として送信します。     |
| `identity/device.json`      | 署名済み Ed25519 鍵ペアと、そこから導出されたデバイス ID。署名付き接続では、このデバイス ID がルーティング対象の Node ID およびペアリング ID になります。       |
| `identity/device-auth.json` | 暗号学的デバイス ID とロールをキーとする、ペアリング済みデバイストークン。                                                                                   |

`--node-id` が変更するのは、`node.json` 内のクライアントインスタンス ID のみです。暗号学的デバイス ID は変更されず、ペアリング認証も消去されません。同様に、`node.json` だけを削除してもペアリングはリセットされません。Node を取り消して再ペアリングするには:

1. Gateway 上で `openclaw nodes remove --node <id|name|ip>` を実行します。
2. Node 上で、`openclaw node restart` を使用してインストール済みサービスを再起動するか、フォアグラウンドの `openclaw node run` コマンドを停止して再実行します。これによりデバイスペアリングフローが開始されます。`openclaw devices list` にリクエストが表示されず、Node が `AUTH_DEVICE_TOKEN_MISMATCH` を報告する場合は、もう一度再起動または再実行してください。拒否された試行によって、取り消し済みとなったローカルトークンが消去され、次の試行でペアリングを要求できるようになります。
3. Gateway 上で `openclaw devices list` を実行し、続いて `openclaw devices approve <deviceRequestId>` を実行します。
4. Node を再度再起動または再実行します。ペアリングのために一時停止したクライアントは、承認後に自動的には再開しません。この再接続によって、別個のコマンド範囲リクエストが作成されます。
5. Gateway 上で `openclaw nodes pending` を実行し、続いて `openclaw nodes approve <nodeRequestId>` を実行します。

2 つのリクエスト ID は別物です。適用可能な信頼済み CIDR ポリシーは、初回のデバイスペアリング手順を自動承認できますが、コマンド範囲の承認は引き続き別個のチェックとして行われます。

以前の OpenClaw リリースでは、`node.json` に従来の `token` フィールドが残ることがありました。現在の OpenClaw はそのフィールドを使用せず、Node ホストが次回ファイルを保存するときに削除します。`identity/` 内の両方のファイルは非公開にしてください。これらにはデバイス鍵ペアと認証トークンが含まれています。

## Exec 承認

`system.run` はローカルの exec 承認によって制限されます:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`、または変数が未設定の場合は
  `~/.openclaw/exec-approvals.json`
- [Exec 承認](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期 Node exec では、OpenClaw はプロンプトを表示する前に正規の `systemRunPlan` を準備します。後続の承認済み `system.run` 転送では、保存されたそのプランが再利用されます。そのため、承認リクエストの作成後にコマンド/cwd/セッションフィールドを編集すると、Node が実行する内容が変更されるのではなく、その編集が拒否されます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Node](/ja-JP/nodes)
