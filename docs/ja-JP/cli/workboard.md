---
read_when:
    - ターミナルから Workboard カードを確認または作成したい
    - Workboard ワーカー実行を CLI からディスパッチしたい
    - Workboard CLIまたはスラッシュコマンドの動作をデバッグしている
summary: '`openclaw workboard` カード、ディスパッチ、ワーカー実行の CLI リファレンス'
title: ワークボード CLI
x-i18n:
    generated_at: "2026-07-05T11:15:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` は、同梱の [Workboard Plugin](/ja-JP/plugins/workboard) 用のターミナルサーフェスです。オペレーターはカードの一覧表示、カード作成、1 件のカードの確認、実行中の Gateway による準備済み作業のサブエージェントワーカー実行へのディスパッチを行えます。

コマンドを使う前に Plugin を有効化します。

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## 使い方

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

このコマンドは、ダッシュボードと Workboard エージェントツールが使用する、同じ Plugin所有の SQLite データベースを読み書きします。カード ID は UUID です。カード ID を受け付けるコマンドでは、曖昧でない ID プレフィックスも使用できます（コンパクトなテキスト出力には先頭 8 文字が表示されます）。

有効な `status` 値: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`。有効な `priority` 値: `low`, `normal`, `high`, `urgent`。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

テキスト出力はコンパクトです。

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

列は、ID プレフィックス、ステータス、優先度、ボード ID、任意のエージェント ID、タイトルです。

| フラグ               | 目的                                                    |
| -------------------- | ------------------------------------------------------- |
| `--board <id>`       | 結果を 1 つのボード名前空間に制限する                  |
| `--status <status>`  | 結果を 1 つの Workboard ステータスに制限する           |
| `--include-archived` | コンパクトなテキスト出力にアーカイブ済みカードを含める |
| `--json`             | カード一覧全体を機械処理用 JSON として出力する         |

コンパクトなテキスト出力では、CLI が `/workboard list` と一致するように、デフォルトでアーカイブ済みカードを非表示にします。表示するには `--include-archived` を渡します。JSON 出力では、既存の自動化向けに、アーカイブ済みカードを含むカード一覧全体が常に保持されます。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| フラグ                  | 目的                                                 |
| ----------------------- | ---------------------------------------------------- |
| `--notes <text>`        | 初期カードメモ                                      |
| `--status <status>`     | 初期ステータス。デフォルトは `todo`                 |
| `--priority <priority>` | 優先度。デフォルトは `normal`                       |
| `--agent <id>`          | カードをエージェントまたは所有者 ID に割り当てる    |
| `--board <id>`          | カードをボード名前空間に保存する                    |
| `--labels <items>`      | カンマ区切りのラベル                                |
| `--json`                | 作成したカードを機械処理用 JSON として出力する      |

`create` は Workboard の SQLite 状態に直接書き込みます。カードは Control UI の Workboard タブと Workboard ツールですぐに表示されます。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

テキスト出力では、コンパクトなカード行とメモが表示されます。JSON 出力では、実行メタデータ、試行、コメント、リンク、証跡、アーティファクト、ワーカーログ、プロトコル状態、診断、自動化メタデータを含む完全なカードレコードが返されます。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` はまず、実行中の Gateway RPC メソッド `workboard.cards.dispatch` を呼び出します。これはダッシュボードのディスパッチ操作と同じサブエージェントランタイムを使用するため、準備済みカードは、リンクされたセッションキーを持つタスク追跡付きワーカー実行になります。エージェントが割り当てられたカードは、エージェントスコープのサブエージェントセッションキーを使用します。未割り当てカードは、Gateway で構成されたデフォルトエージェントが保持されるように、スコープなしのサブエージェントキーを保持します。

ディスパッチループ:

1. 依存関係が準備済みの子を `ready` に昇格します。
2. 期限切れのクレームまたはタイムアウトしたワーカー実行をブロックします。
3. 準備済みカードにディスパッチメタデータを記録します。
4. 未クレームの準備済みカードを少量のバッチで選択します。
5. 選択した各カードをディスパッチャーまたは割り当てられたエージェント向けにクレームします。
6. 境界付けられたカードコンテキストとカードクレームトークンを使って、サブエージェントワーカー実行を開始します。
7. ワーカー実行 ID、セッションキー、Gateway タスク台帳が報告する場合はタスク連携、実行ステータス、ワーカーログをカードに保存します。

選択は保守的です。1 回のディスパッチではデフォルトで最大 3 つのワーカーを開始し、アーカイブ済みまたはすでにクレーム済みのカードをスキップし、1 回のパスで所有者またはエージェントごとに 1 件のカードのみを開始します。アクティブな実行中またはレビュー中の作業がすでに所有しているカードは、後続のディスパッチに残されます。

カードがクレームされた後にワーカー開始が失敗した場合、Workboard はそのカードをブロックし、クレームをクリアし、失敗をカード実行およびワーカーログメタデータに記録します。これにより、開始失敗をカードをキューへ黙って戻すのではなく、見える状態に保ちます。

明示的な Gateway ターゲットが指定されておらず、ローカル Gateway が利用できない、またはまだ Workboard ディスパッチメソッドを公開していない場合、CLI はローカル Workboard 状態に対するデータのみのディスパッチにフォールバックします。データのみのディスパッチでも、依存関係の昇格、古いクレームのクリーンアップ、タイムアウトした実行のブロックは可能ですが、ワーカーは開始しません。認証、権限、検証の失敗、および明示的な `--url` または `--token` ターゲットに対する失敗は、フォールバックを起動せずに直接報告されます。

テキスト出力ではワーカー開始が報告されます。

```text
dispatch complete: started=2 failures=0
```

フォールバック出力は明示的です。

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 出力にはディスパッチ結果が含まれます。Gateway によるディスパッチには `started` と `startFailures` が含まれる場合があります。データのみのフォールバックには `gatewayUnavailable: true` が含まれます。クレームトークンはカード JSON 出力から秘匿されます。

ダッシュボードでは、同じディスパッチ結果が短い概要として表示されるため、オペレーターはカード詳細を開かなくても、開始、昇格、ブロック、再クレーム、失敗したカード数を確認できます。

## スラッシュコマンドの同等性

コマンド対応チャネルでは、対応するスラッシュコマンドを使用できます。

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

スラッシュコマンドのディスパッチも Gateway のサブエージェントランタイムを使用するため、ダッシュボードおよび CLI の Gateway パスと同じクレーム、ワーカー開始、失敗の動作に従います。

`/workboard list` と `/workboard show` は、許可されたコマンド送信者向けの読み取りコマンドです。`/workboard create` と `/workboard dispatch` はボード状態を変更するため、チャットサーフェス上では所有者ステータス、または `operator.write` か `operator.admin` を持つ Gateway クライアントが必要です。

## 権限

CLI ディスパッチパスは、`operator.read` と `operator.write` スコープで Gateway RPC を呼び出します。読み取り専用の Gateway トークンは読み取りメソッドを通じて Workboard データを確認できますが、カードを作成したりワーカーをディスパッチしたりすることはできません。

ローカルの `list`、`create`、`show` コマンドは、現在のプロファイルが使用するローカル OpenClaw 状態ディレクトリを操作します。別の状態ルートが必要な場合は、トップレベルの `openclaw` コマンドで `--dev` または `--profile <name>` を使用します。

## トラブルシューティング

### カードが表示されない

同じプロファイルと状態ルートで Plugin が有効になっていることを確認します。

```bash
openclaw plugins inspect workboard --runtime --json
```

ダッシュボードにはカードが表示されるのに CLI には表示されない場合は、両方のコマンドが同じ `--dev` または `--profile` 設定を使用しているか確認します。

### ディスパッチがデータのみと表示される

Gateway を開始または再起動します。

```bash
openclaw gateway restart
openclaw gateway status --deep
```

その後、`openclaw workboard dispatch` を再試行します。データのみのフォールバックはローカル状態のクリーンアップに有用ですが、ワーカー実行には稼働中の Gateway が必要です。

### ディスパッチで何も開始されない

アクティブなクレームのない `ready` カードが少なくとも 1 件あることを確認します。

```bash
openclaw workboard list --status ready
```

同じ所有者に実行中またはレビュー中の作業がすでにある場合も、カードはスキップされることがあります。完了した作業を `done` に移動する、Workboard ツールで古いクレームを解放する、またはアクティブなワーカーが終了した後にディスパッチを再実行します。

## 関連

- [Workboard Plugin](/ja-JP/plugins/workboard)
- [CLI リファレンス](/ja-JP/cli)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [Control UI](/ja-JP/web/control-ui)
