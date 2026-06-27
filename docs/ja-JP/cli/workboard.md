---
read_when:
    - ターミナルから Workboard カードを確認または作成したい
    - CLI から Workboard ワーカー実行をディスパッチしたい
    - Workboard CLI またはスラッシュコマンドの動作をデバッグしている
summary: '`openclaw workboard` カード、ディスパッチ、ワーカー実行の CLI リファレンス'
title: Workboard CLI
x-i18n:
    generated_at: "2026-06-27T11:04:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` は、同梱の
[Workboard Plugin](/ja-JP/plugins/workboard) 向けのターミナルサーフェスです。オペレーターはカードの一覧表示、カードの作成、1件のカードの確認、実行中の Gateway への準備完了作業のサブエージェントワーカー実行へのディスパッチ依頼を行えます。

コマンドを使う前に Plugin を有効にします。

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

このコマンドは、ダッシュボードと Workboard エージェントツールが使うものと同じ Plugin 所有の SQLite データベースを読み書きします。コマンドがカード ID を受け付ける場合、カード ID には完全な ID または曖昧でないプレフィックスを渡せます。

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

列は ID プレフィックス、ステータス、優先度、ボード ID、任意のエージェント ID、タイトルです。

フラグ:

| フラグ               | 目的                                             |
| -------------------- | ------------------------------------------------ |
| `--board <id>`       | 結果を1つのボード名前空間に限定する             |
| `--status <status>`  | 結果を1つの Workboard ステータスに限定する      |
| `--include-archived` | コンパクトなテキスト出力にアーカイブ済みカードを含める |
| `--json`             | カード一覧全体を機械可読 JSON として出力する    |

コンパクトなテキスト出力では、CLI が `/workboard list` コマンドと一致するように、デフォルトでアーカイブ済みカードを非表示にします。表示するには `--include-archived` を渡します。JSON 出力は、既存の自動化のために、アーカイブ済みカードを含むカード一覧全体を保持します。

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

フラグ:

| フラグ                  | 目的                                             |
| ----------------------- | ------------------------------------------------ |
| `--notes <text>`        | 初期カードメモ                                   |
| `--status <status>`     | 初期ステータス。デフォルトは `todo`             |
| `--priority <priority>` | 優先度。デフォルトは `normal`                   |
| `--agent <id>`          | カードをエージェントまたは所有者 ID に割り当てる |
| `--board <id>`          | カードをボード名前空間に保存する                |
| `--labels <items>`      | カンマ区切りのラベル                             |
| `--json`                | 作成されたカードを機械可読 JSON として出力する  |

`create` は Workboard SQLite 状態に直接書き込みます。カードは Control UI の Workboard タブと Workboard ツールにすぐ表示されます。

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

テキスト出力はコンパクトなカード行とメモを出力します。JSON 出力は、実行メタデータ、試行、コメント、リンク、証跡、アーティファクト、ワーカーログ、プロトコル状態、診断、自動化メタデータを含む完全なカードレコードを返します。

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` はまず、実行中の Gateway RPC メソッド `workboard.cards.dispatch` を呼び出します。この経路はダッシュボードのディスパッチアクションと同じサブエージェントランタイムを使うため、`ready` のカードはリンクされたセッションキーを持つタスク追跡対象のワーカー実行になります。エージェントが割り当てられているカードは、エージェントスコープのサブエージェントセッションキーを使います。未割り当てのカードは、Gateway に設定されたデフォルトエージェントが保持されるように、スコープなしのサブエージェントキーを維持します。

ディスパッチループ:

1. 依存関係の準備が整った子カードを `ready` に昇格する。
2. 期限切れの claim またはタイムアウトしたワーカー実行をブロックする。
3. `ready` カードにディスパッチメタデータを記録する。
4. claim されていない `ready` カードの小さなバッチを選択する。
5. 選択された各カードをディスパッチャーまたは割り当て済みエージェントに claim する。
6. 境界付けられたカードコンテキストとカード claim トークンでサブエージェントワーカー実行を開始する。
7. Gateway タスク台帳が報告した場合は、ワーカー実行 ID、セッションキー、タスク連携、実行ステータス、ワーカーログをカードに保存する。

選択は意図的に保守的です。1回のディスパッチはデフォルトで最大3つのワーカーを開始し、アーカイブ済みまたはすでに claim 済みのカードをスキップし、1回の処理で所有者またはエージェントごとに1枚のカードだけを開始します。アクティブに実行中またはレビュー中の作業にすでに所有されているカードは、後続のディスパッチに残されます。

カードが claim された後にワーカーの開始に失敗した場合、Workboard はそのカードをブロックし、claim をクリアし、カード実行とワーカーログのメタデータに失敗を記録します。これにより、開始失敗がカードをキューへ黙って戻すのではなく、可視化されます。

明示的な Gateway ターゲットが指定されておらず、ローカル Gateway が利用できないか、Workboard ディスパッチメソッドをまだ公開していない場合、CLI はローカル Workboard 状態に対するデータのみのディスパッチにフォールバックします。データのみのディスパッチでも、依存関係の昇格、古い claim のクリーンアップ、タイムアウトした実行のブロックは実行できますが、ワーカーは開始しません。認証、権限、検証の失敗、および明示的な `--url` または `--token` ターゲットでの失敗は直接報告されます。

テキスト出力はワーカー開始を報告します。

```text
dispatch complete: started=2 failures=0
```

フォールバック出力は明示的です。

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 出力にはディスパッチ結果が含まれます。Gateway によるディスパッチには `started` と `startFailures` が含まれることがあります。データのみのフォールバックには `gatewayUnavailable: true` が含まれます。claim トークンはカード JSON 出力から伏せられます。

ダッシュボードでは、同じディスパッチ結果が短い要約として表示されるため、オペレーターはカード詳細を開かずに、開始、昇格、ブロック、再 claim、失敗したカード数を確認できます。

## スラッシュコマンドとの同等性

コマンド対応チャネルでは、対応するスラッシュコマンドを使用できます。

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

スラッシュコマンドのディスパッチも Gateway サブエージェントランタイムを使うため、ダッシュボードおよび CLI の Gateway 経路と同じ claim、ワーカー開始、失敗時の動作に従います。

`/workboard list` と `/workboard show` は、認可されたコマンド送信者向けの読み取りコマンドです。`/workboard create` と `/workboard dispatch` はボード状態を変更するため、チャットサーフェスでは所有者ステータスが必要であり、または `operator.write` か `operator.admin` を持つ Gateway クライアントが必要です。

## 権限

CLI ディスパッチ経路は、`operator.read` と `operator.write` スコープで Gateway RPC を呼び出します。読み取り専用の Gateway トークンは読み取りメソッドを通じて Workboard データを確認できますが、カードの作成やワーカーのディスパッチはできません。

ローカルの `list`、`create`、`show` コマンドは、現在のプロファイルが使うローカル OpenClaw 状態ディレクトリに対して動作します。別の状態ルートが必要な場合は、トップレベルの `openclaw` コマンドで `--dev` または `--profile <name>` を使います。

## トラブルシューティング

### カードが表示されない

同じプロファイルと状態ルートで Plugin が有効になっていることを確認します。

```bash
openclaw plugins inspect workboard --runtime --json
```

ダッシュボードにはカードが表示されるのに CLI には表示されない場合は、両方のコマンドが同じ `--dev` または `--profile` 設定を使っていることを確認します。

### ディスパッチがデータのみと表示する

Gateway を開始または再起動します。

```bash
openclaw gateway restart
openclaw gateway status --deep
```

その後、`openclaw workboard dispatch` を再試行します。データのみのフォールバックはローカル状態のクリーンアップには有用ですが、ワーカー実行には稼働中の Gateway が必要です。

### ディスパッチで何も開始されない

アクティブな claim がない `ready` カードが少なくとも1つあるか確認します。

```bash
openclaw workboard list --status ready
```

同じ所有者にすでに実行中またはレビュー中の作業がある場合も、カードがスキップされることがあります。完了済みの作業を `done` に移動する、Workboard ツールで古い claim を解放する、またはアクティブなワーカーの終了後にディスパッチを再実行します。

## 関連

- [Workboard Plugin](/ja-JP/plugins/workboard)
- [CLI リファレンス](/ja-JP/cli)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [Control UI](/ja-JP/web/control-ui)
