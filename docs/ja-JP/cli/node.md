---
read_when:
    - ヘッドレス Node ホストの実行
    - system.run 用に macOS 以外の Node をペアリングする
summary: '`openclaw node`（ヘッドレス Node ホスト）の CLI リファレンス'
title: Node
x-i18n:
    generated_at: "2026-07-16T11:31:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket に接続し、このマシン上で
`system.run` / `system.which` を公開する**ヘッドレス Node ホスト**を実行します。

macOS では、メニューバーアプリがこの Node ホストランタイムを自身の
Node 接続にすでに組み込んでおり、Mac ネイティブ機能も追加しています。Mac で
`openclaw node run` を使用するのは、アプリを使わずにヘッドレス Node を意図的に実行する場合だけにしてください。
両方を実行すると、同じマシンに対して 2 つの Node ID が作成されます。

## Node ホストを使用する理由

ネットワーク内の別のマシンに完全な macOS コンパニオンアプリをインストールせず、
エージェントにそのマシン上で**コマンドを実行させる**場合は、Node ホストを使用します。

一般的なユースケース:

- リモートの Linux/Windows マシン（ビルドサーバー、ラボマシン、NAS）でコマンドを実行する。
- Gateway 上の exec は**サンドボックス化**したまま、承認済みの実行を別のホストに委任する。
- 自動化または CI Node 向けに、軽量なヘッドレス実行ターゲットを提供する。

実行は引き続き Node ホスト上の**実行承認**とエージェントごとの許可リストによって保護されるため、
コマンドアクセスの範囲を限定し、明示的に管理できます。

`openclaw node run` は、接続後に Plugin または MCP バックエンドのツールを公開できます。
Gateway はデフォルトでペアリング済み Node からの記述子を信頼しますが、
各記述子のコマンドは Node の承認済みコマンドサーフェス内に留まる必要があります。
エージェントには、受け入れられた各記述子が通常の Plugin ツールとして表示されますが、実行は引き続き
`node.invoke` を経由するため、Node を切断すると新しい
エージェント実行からそのツールが削除されます。Gateway オペレーターは
`gateway.nodes.pluginTools.enabled: false` で公開を無効にできます。

宣言的な MCP ツールの場合は、Node マシン上の `openclaw.json` にある
`nodeHost.mcp.servers` の下へ通常の MCP サーバー構成を追加し、Node ホストを再起動します。
Node は承認によって制御される `mcp.tools.call.v1` コマンドファミリーを宣言し、
接続後に一覧のツールを公開します。後からサーバー一覧を変更しても、再ペアリングは不要です。
[Node ホスト型 MCP サーバー](/ja-JP/nodes#node-hosted-mcp-servers)を参照してください。

## ブラウザプロキシ（設定不要）

Node 上で `browser.enabled` が無効になっていない場合、Node ホストは
ブラウザプロキシを自動的にアドバタイズします。これにより、追加設定なしで
エージェントがその Node 上のブラウザ自動化を使用できます。

デフォルトでは、プロキシは Node の通常のブラウザプロファイルサーフェスを公開します。
`nodeHost.browserProxy.allowProfiles` を設定すると、プロキシは制限モードになります。
許可リストにないプロファイルの指定は拒否され、永続プロファイルの
作成・削除ルートはプロキシ経由ではブロックされます。

必要に応じて Node 上で無効にします。

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
- `--node-id <id>`: 共有 SQLite 状態に保存されたクライアントインスタンス ID を上書きする（ペアリングはリセットされません）
- `--display-name <name>`: Node の表示名を上書きする

## Node ホストの Gateway 認証

`openclaw node run` と `openclaw node install` は、設定または環境変数から Gateway 認証を解決します（Node コマンドに `--token`/`--password` フラグはありません）。

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` が最初に確認されます。
- 次にローカル設定へフォールバックします: `gateway.auth.token` / `gateway.auth.password`。
- ローカルモードでは、Node ホストは意図的に `gateway.remote.token` / `gateway.remote.password` を継承しません。
- `gateway.auth.token` / `gateway.auth.password` が SecretRef で明示的に設定されているにもかかわらず解決できない場合、Node の認証解決はフェイルクローズします（リモートへのフォールバックで隠蔽されません）。
- `gateway.mode=remote` では、リモートクライアントフィールド（`gateway.remote.token` / `gateway.remote.password`）もリモートの優先順位規則に従って使用できます。
- Node ホストの認証解決では、`OPENCLAW_GATEWAY_*` 環境変数のみが考慮されます。

平文の `ws://` Gateway に接続する Node では、local loopback、プライベート IP
リテラル、`.local`、および Tailnet の `*.ts.net` ホストが許可されます。その他の
信頼済みプライベート DNS 名については、`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。設定しない場合、
Node の起動はフェイルクローズし、`wss://`、SSH トンネル、または
Tailscale の使用を求めます。これはプロセス環境によるオプトインであり、`openclaw.json` の設定キーではありません。
`openclaw node install` は、インストールコマンドの環境にこの値が存在する場合、
監視対象の Node サービスに保存します。

## サービス（バックグラウンド）

ヘッドレス Node ホストをユーザーサービスとしてインストールします（macOS では launchd、Linux では systemd、
Windows では Windows Task Scheduler）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:

- `--host <host>`: Gateway WebSocket ホスト（デフォルト: `127.0.0.1`）
- `--port <port>`: Gateway WebSocket ポート（デフォルト: `18789`）
- `--context-path <path>`: Gateway WebSocket コンテキストパス（例: `/openclaw-gw`）。WebSocket URL に追加されます。
- `--tls`: Gateway 接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書フィンガープリント（sha256）
- `--node-id <id>`: 共有 SQLite 状態に保存されたクライアントインスタンス ID を上書きする（ペアリングはリセットされません）
- `--display-name <name>`: Node の表示名を上書きする
- `--runtime <runtime>`: サービスランタイム（`node`）
- `--force`: すでにインストール済みの場合に再インストールまたは上書きする

サービスを管理します。

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドの Node ホスト（サービスなし）には `openclaw node run` を使用します。

サービスコマンドは、機械可読出力用の `--json` を受け付けます。

Node ホストは、Gateway の再起動やネットワーク切断が発生するとプロセス内で再試行します。
Gateway がトークン、パスワード、またはブートストラップ認証に関する終端的な一時停止を報告した場合、
Node ホストは切断の詳細をログに記録して 0 以外の終了コードで終了し、launchd/systemd/Task Scheduler が
新しい設定と認証情報で再起動できるようにします。ペアリングが必要な一時停止は
フォアグラウンドフローに留まり、保留中のリクエストを承認できるようにします。

## ペアリング

最初の接続時に、Gateway 上に保留中のデバイスペアリングリクエスト（`role: node`）が作成されます。

Gateway ホストから Node ホストへ非対話的に SSH 接続できる場合（同じユーザー、
信頼済みホストキー）、保留中のリクエストは自動的に承認されます。Gateway は
SSH 経由で Node ホスト上の `openclaw node identity --json` を実行し、
デバイスキーが完全に一致した場合に承認します。これはデフォルトで有効です。要件と
無効化方法（`gateway.nodes.pairing.sshVerify: false`）については、
[SSH 検証済みデバイスの自動承認](/ja-JP/gateway/pairing#ssh-verified-device-auto-approval-default)
を参照してください。

それ以外の場合は、次のコマンドで手動承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway が照合するローカル Node ID を確認します。

```bash
openclaw node identity --json
```

このコマンドは `identity/device.json` のデバイス ID と公開鍵を出力し、
ID ファイルの作成や変更は一切行いません。

厳密に管理された Node ネットワークでは、Gateway オペレーターは、
信頼済み CIDR からの初回 Node ペアリングを自動承認するよう明示的にオプトインできます。

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

これはデフォルトで無効です（`autoApproveCidrs` は未設定）。Gateway が信頼する
クライアント IP から送信され、スコープが要求されていない新規の `role: node`
ペアリングにのみ適用されます。オペレーターまたはブラウザクライアント、Control UI、WebChat、およびロール、
スコープ、メタデータ、公開鍵のアップグレードには、引き続き手動承認が必要です。

Node が変更された認証詳細（ロール、スコープ、公開鍵）でペアリングを再試行すると、
以前の保留中リクエストは置き換えられ、新しい `requestId` が作成されます。
承認前に `openclaw devices list` をもう一度実行してください。

### ID とペアリング状態

ヘッドレス Node は、クライアントインスタンス ID と、Gateway がペアリングおよびルーティングに使用する
署名済みデバイス ID を分離します。この状態は OpenClaw の状態ディレクトリ
（デフォルトでは `~/.openclaw`、`$OPENCLAW_STATE_DIR` が設定されている場合はその場所）に保存されます。

| 状態                                        | 用途                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | クライアントインスタンス ID、表示名、Gateway 接続メタデータ。クライアントはこの ID を `instanceId` として送信します。                     |
| `identity/device.json`                       | 署名済み Ed25519 キーペアと、そこから導出されたデバイス ID。署名済み接続では、このデバイス ID がルーティング対象の Node ID およびペアリング ID になります。 |
| `identity/device-auth.json`                  | 暗号学的デバイス ID とロールをキーとする、ペアリング済みデバイストークン。                                                                 |

`--node-id` は、共有 SQLite 状態内のクライアントインスタンス ID のみを変更します。
暗号学的デバイス ID を変更したり、ペアリング認証を消去したりすることはありません。
廃止された `node.json` を `openclaw doctor --fix` で移行しても、同様にペアリングはリセットされません。
Node を取り消して再ペアリングするには、次の手順を実行します。

1. Gateway 上で `openclaw nodes remove --node <id|name|ip>` を実行します。
2. Node 上で、インストール済みサービスを `openclaw node restart` で再起動するか、
   停止してフォアグラウンドの `openclaw node run` コマンドを再実行します。これにより
   デバイスペアリングフローが開始されます。`openclaw devices list` にリクエストが表示されず、
   Node が `AUTH_DEVICE_TOKEN_MISMATCH` を報告する場合は、もう一度
   再起動または再実行してください。拒否された試行によって、取り消し済みのローカルトークンが消去され、
   次の試行でペアリングを要求できるようになります。
3. Gateway 上で `openclaw devices list` を実行し、続けて
   `openclaw devices approve <deviceRequestId>` を実行します。
4. Node をもう一度再起動または再実行します。ペアリングのため一時停止したクライアントは、
   承認後に自動再開しません。この再接続によって、別個の
   コマンドサーフェスリクエストが作成されます。
5. Gateway 上で `openclaw nodes pending` を実行し、続けて
   `openclaw nodes approve <nodeRequestId>` を実行します。

2 つのリクエスト ID は別のものです。適用可能な信頼済み CIDR ポリシーにより、
初回のデバイスペアリング手順を自動承認できますが、コマンドサーフェスの承認は
引き続き別個に確認されます。

古い OpenClaw リリースでは Node ホストの状態が `node.json` に保存され、
使用されなくなった `token` フィールドが残ることがありました。Node ホストを停止し、
`openclaw doctor --fix` を一度実行してください。Doctor は、サポート対象の ID と接続フィールドを SQLite にインポートし、
未使用のトークンフィールドを破棄して行を検証した後、廃止されたファイルを削除します。
このファイルまたは中断された Doctor の処理要求が残っている間、通常の Node コマンドは
修復手順を示してフェイルクローズします。`identity/` 配下の両ファイルは非公開にしてください。
デバイスキーペアと認証トークンが含まれています。

## 実行承認

`system.run` はローカルの実行承認によって制御されます。

- `$OPENCLAW_STATE_DIR/exec-approvals.json`、または
  変数が未設定の場合は `~/.openclaw/exec-approvals.json`
- [実行承認](/ja-JP/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（Gateway から編集）

承認済みの非同期 Node exec では、OpenClaw は確認を求める前に正規化された
`systemRunPlan` を準備します。後から承認された `system.run` の転送では
保存済みのプランが再利用されるため、承認リクエストの作成後にコマンド、cwd、セッションの各フィールドを編集すると、
Node が実行する内容を変更する代わりに拒否されます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Nodes](/ja-JP/nodes)
