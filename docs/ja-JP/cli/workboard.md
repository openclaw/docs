---
read_when:
    - ターミナルから Workboard カードを確認または作成したい場合
    - CLI から Workboard ワーカーの実行をディスパッチする場合
    - Workboard CLI またはスラッシュコマンドの動作をデバッグしている場合
summary: '`openclaw workboard` カード、ディスパッチ、ワーカー実行の CLI リファレンス'
title: Workboard CLI
x-i18n:
    generated_at: "2026-07-11T22:05:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` は、同梱の [Workboard Plugin](/ja-JP/plugins/workboard) 用ターミナルインターフェースです。オペレーターはカードの一覧表示、カードの作成、個別カードの確認、および実行中の Gateway に対して、準備完了の作業をサブエージェントのワーカー実行へディスパッチするよう要求できます。

コマンドを使用する前に Plugin を有効にします。

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## 使用方法

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

このコマンドは、ダッシュボードおよび Workboard エージェントツールが使用する、同じ Plugin 所有の SQLite データベースを読み書きします。カード ID は UUID です。カード ID を受け付けるコマンドでは、一意に特定できる ID プレフィックスも使用できます（簡潔なテキスト出力には先頭 8 文字が表示されます）。

有効な `status` 値：`triage`、`backlog`、`todo`、`scheduled`、`ready`、`running`、`review`、`blocked`、`done`。有効な `priority` 値：`low`、`normal`、`high`、`urgent`。

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

テキスト出力は簡潔です。

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

各列は、ID プレフィックス、ステータス、優先度、ボード ID、任意のエージェント ID、タイトルです。

| フラグ               | 用途                                             |
| -------------------- | ------------------------------------------------ |
| `--board <id>`       | 結果を 1 つのボード名前空間に限定する            |
| `--status <status>`  | 結果を 1 つの Workboard ステータスに限定する      |
| `--include-archived` | 簡潔なテキスト出力にアーカイブ済みカードを含める |
| `--json`             | カードの完全な一覧を機械処理用 JSON として出力する |

CLI の動作を `/workboard list` と一致させるため、簡潔なテキスト出力ではデフォルトでアーカイブ済みカードが非表示になります。表示するには `--include-archived` を指定します。既存の自動化との互換性を保つため、JSON 出力にはアーカイブ済みカードを含む完全なカード一覧が常に保持されます。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| フラグ                  | 用途                                         |
| ----------------------- | -------------------------------------------- |
| `--notes <text>`        | カードの初期メモ                             |
| `--status <status>`     | 初期ステータス。デフォルトは `todo`          |
| `--priority <priority>` | 優先度。デフォルトは `normal`                |
| `--agent <id>`          | カードをエージェントまたは所有者 ID に割り当てる |
| `--board <id>`          | カードをボード名前空間に保存する             |
| `--labels <items>`      | カンマ区切りのラベル                         |
| `--json`                | 作成したカードを機械処理用 JSON として出力する |

`create` は Workboard の SQLite 状態に直接書き込みます。カードは、Control UI の Workboard タブおよび Workboard ツールに即座に表示されます。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

テキスト出力には、簡潔なカード行とメモが表示されます。JSON 出力は、実行メタデータ、試行、コメント、リンク、証明、成果物、ワーカーログ、プロトコル状態、診断、自動化メタデータを含む完全なカードレコードを返します。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` は最初に、実行中の Gateway RPC メソッド `workboard.cards.dispatch` を呼び出します。このメソッドはダッシュボードのディスパッチ操作と同じサブエージェントランタイムを使用するため、準備完了のカードは、セッションキーが関連付けられたタスク追跡対象のワーカー実行になります。エージェントが割り当てられたカードでは、エージェントスコープのサブエージェントセッションキーが使用されます。未割り当てのカードでは、Gateway に設定されたデフォルトエージェントを維持するため、スコープなしのサブエージェントキーが使用されます。

ディスパッチループは次の処理を行います。

1. 依存関係の準備が整った子カードを `ready` に昇格します。
2. 期限切れのクレームまたはタイムアウトしたワーカー実行をブロックします。
3. 準備完了のカードにディスパッチメタデータを記録します。
4. クレームされていない準備完了カードから少数のバッチを選択します。
5. 選択した各カードを、ディスパッチャーまたは割り当てられたエージェント用にクレームします。
6. 制限されたカードコンテキストとカードのクレームトークンを使用して、サブエージェントのワーカー実行を開始します。
7. ワーカー実行 ID、セッションキー、Gateway のタスク台帳から報告された場合はタスクの関連付け、実行ステータス、およびワーカーログをカードに保存します。

選択は保守的に行われます。デフォルトでは、1 回のディスパッチで開始されるワーカーは最大 3 つです。アーカイブ済みまたはクレーム済みのカードはスキップされ、1 回の処理で所有者またはエージェントごとに 1 枚のカードのみが開始されます。すでに実行中またはレビュー中の作業を所有している主体のカードは、後続のディスパッチに残されます。

カードがクレームされた後にワーカーの開始が失敗した場合、Workboard はそのカードをブロックし、クレームを解除して、カードの実行メタデータおよびワーカーログメタデータに失敗を記録します。これにより、開始に失敗したカードを通知なしにキューへ戻すのではなく、失敗を確認できる状態に保ちます。

明示的な Gateway ターゲットが指定されておらず、ローカル Gateway が利用できないか、まだ Workboard のディスパッチメソッドを公開していない場合、CLI はローカルの Workboard 状態に対するデータのみのディスパッチへフォールバックします。データのみのディスパッチでも、依存関係の昇格、古いクレームのクリーンアップ、タイムアウトした実行のブロックは可能ですが、ワーカーは開始されません。認証、権限、検証の失敗、および明示的な `--url` または `--token` ターゲットに対する失敗は、フォールバックを発生させずに直接報告されます。

テキスト出力には、ワーカーの開始結果が表示されます。

```text
dispatch complete: started=2 failures=0
```

フォールバック出力では明示的に示されます。

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 出力にはディスパッチ結果が含まれます。Gateway 経由のディスパッチには `started` と `startFailures` が含まれる場合があります。データのみのフォールバックには `gatewayUnavailable: true` が含まれます。カードの JSON 出力では、クレームトークンが秘匿されます。

ダッシュボードでは、同じディスパッチ結果が短い概要として表示されます。これによりオペレーターは、カードの詳細を開かなくても、開始、昇格、ブロック、再クレーム、または失敗したカードの数を確認できます。

## スラッシュコマンドとの同等性

コマンド対応チャネルでは、対応するスラッシュコマンドを使用できます。

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

スラッシュコマンドのディスパッチも Gateway のサブエージェントランタイムを使用するため、ダッシュボードおよび CLI の Gateway 経路と同じクレーム、ワーカー開始、失敗時の動作に従います。

`/workboard list` と `/workboard show` は、認可されたコマンド送信者向けの読み取りコマンドです。`/workboard create` と `/workboard dispatch` はボードの状態を変更するため、チャットインターフェースでは所有者ステータスが必要です。または、`operator.write` か `operator.admin` を持つ Gateway クライアントが必要です。

## 権限

CLI のディスパッチ経路は、`operator.read` および `operator.write` スコープで Gateway RPC を呼び出します。読み取り専用の Gateway トークンは読み取りメソッドを通じて Workboard データを確認できますが、カードの作成やワーカーのディスパッチはできません。

ローカルの `list`、`create`、`show` コマンドは、現在のプロファイルが使用するローカルの OpenClaw 状態ディレクトリを操作します。別の状態ルートが必要な場合は、最上位の `openclaw` コマンドで `--dev` または `--profile <name>` を使用します。

## トラブルシューティング

### カードが表示されない

同じプロファイルと状態ルートで Plugin が有効になっていることを確認します。

```bash
openclaw plugins inspect workboard --runtime --json
```

ダッシュボードにはカードが表示されるのに CLI には表示されない場合は、両方のコマンドで同じ `--dev` または `--profile` 設定が使用されていることを確認してください。

### データのみと表示される

Gateway を起動または再起動します。

```bash
openclaw gateway restart
openclaw gateway status --deep
```

その後、`openclaw workboard dispatch` を再試行します。データのみのフォールバックはローカル状態のクリーンアップに役立ちますが、ワーカー実行には稼働中の Gateway が必要です。

### ディスパッチで何も開始されない

アクティブなクレームがない `ready` カードが少なくとも 1 枚あることを確認します。

```bash
openclaw workboard list --status ready
```

同じ所有者に実行中またはレビュー中の作業がすでにある場合も、カードがスキップされることがあります。完了した作業を `done` に移動するか、Workboard ツールで古いクレームを解除するか、アクティブなワーカーの完了後にディスパッチを再実行してください。

## 関連項目

- [Workboard Plugin](/ja-JP/plugins/workboard)
- [CLI リファレンス](/ja-JP/cli)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [Control UI](/ja-JP/web/control-ui)
