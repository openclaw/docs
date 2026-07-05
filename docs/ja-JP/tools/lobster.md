---
read_when:
    - 明示的な承認を伴う決定論的な複数ステップのワークフローが必要な場合
    - 以前の手順を再実行せずにワークフローを再開する必要がある
summary: 型付きワークフローランタイム for OpenClaw、再開可能な承認ゲート付き。
title: ロブスター
x-i18n:
    generated_at: "2026-07-05T11:55:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster は、複数ステップのツールパイプラインを、明示的な承認チェックポイントと再開トークンを備えた、1 つの決定的なツール呼び出しとして実行します。これはデタッチされたバックグラウンド作業の 1 つ上のレイヤーに位置します。多数のデタッチされたタスクにまたがるフローをオーケストレーションするには [タスクフロー](/ja-JP/automation/taskflow)（`openclaw tasks flow`）を参照してください。タスクアクティビティ台帳については [バックグラウンドタスク](/ja-JP/automation/tasks) を参照してください。

## 理由

Lobster がない場合、複数ステップのジョブは多くの往復ツール呼び出しを意味し、モデルがすべてのステップをオーケストレーションします。Lobster はそのオーケストレーションを型付きランタイムへ移します。

- **多数の呼び出しではなく 1 回の呼び出し**: 1 回の Lobster ツール呼び出しで、パイプライン全体の構造化された結果を返します。
- **承認を組み込み済み**: 副作用（送信、投稿、削除）は、明示的に承認されるまでワークフローを停止します。
- **再開可能**: 停止したワークフローはトークンを返します。承認して再開しても、以前のステップは再実行されません。

Lobster は汎用スクリプト言語ではなく、小さく制約された DSL です。approve/resume は永続的な組み込みプリミティブです。パイプラインはデータなので、ログ記録、差分確認、再生、レビューが容易です。小さな文法により「創造的な」コードパスが制限されるため、検証を現実的に保てます。タイムアウト、出力上限、サンドボックスチェック、許可リストは各スクリプトではなくランタイムによって強制されます。それでも各ステップは任意の CLI やスクリプトを呼び出せます。より豊かなオーサリング言語が必要なら、他のツールから `.lobster` ファイルを生成してください。

Lobster がない場合、定期的なメールトリアージは次のようになります。

```text
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobster を使うと、同じジョブは承認のために停止して再開する 1 回の呼び出しになります。

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## 仕組み

OpenClaw は、組み込みランナーとして同梱の `@clawdbot/lobster` パッケージを使用し、Lobster ワークフローを **インプロセス** で実行します。外部の `lobster` サブプロセスは起動されません。ツール呼び出しは JSON エンベロープを直接返します。パイプラインが承認のために停止した場合、後で続行できるように、そのエンベロープには再開トークン（または短い承認 ID）が含まれます。

## 有効化

Lobster は **任意** のプラグインツールであり、デフォルトでは有効ではありません。同梱されているため、別途インストール手順は不要です。ツールを許可するだけです。

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

またはエージェントごとに設定します。

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

<Note>
`alsoAllow` は、他のコアツールを制限せずに、アクティブなツールプロファイルの上に `lobster` を追加します。代わりに制限付きの許可リストモードを使いたい場合のみ `tools.allow` を使用してください。
</Note>

サンドボックス化されたツールコンテキストでは、このツールは完全に無効化されます。

開発または外部パイプライン（組み込み Gateway ランナーの外部）でスタンドアロンの Lobster CLI が必要な場合は、[Lobster リポジトリ](https://github.com/openclaw/lobster)からインストールし、`lobster` を `PATH` に置いてください。

## パターン: 小さな CLI + JSON パイプ + 承認

JSON を扱う小さなコマンドを作成し、それらを 1 つの Lobster 呼び出しに連結します。（以下のコマンド名は例です。自分のものに置き換えてください。）

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

パイプラインが承認を要求した場合は、トークンで再開します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

例: 入力項目をツール呼び出しにマッピングします。

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON のみの LLM ステップ（llm-task）

ワークフロー内で **構造化された LLM ステップ** を使うには、任意の `llm-task` プラグインツールを有効化し、Lobster から呼び出します。

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### 重要な制限: 組み込み Lobster と `openclaw.invoke`

同梱の Lobster プラグインは、Gateway 内でワークフローを **インプロセス** で実行します。その組み込みモードでは、ネストされた OpenClaw CLI ツール呼び出しに対して、`openclaw.invoke` は Gateway URL/認証コンテキストを自動的には継承しません。

つまり、このパターンは **現在、組み込みランナーでは信頼性がありません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

以下の例は、正しい Gateway/認証コンテキストで `openclaw.invoke` がすでに設定されている環境で、**スタンドアロン Lobster CLI** を実行する場合にのみ使用してください。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

現在、組み込み Lobster プラグインを使用している場合は、次のいずれかを優先してください。

- Lobster の外部で直接 `llm-task` ツールを呼び出す
- サポート対象の組み込みブリッジが追加されるまで、Lobster パイプライン内では `openclaw.invoke` 以外のステップを使う

詳細と設定オプションについては [LLM タスク](/ja-JP/tools/llm-task) を参照してください。

## ワークフローファイル（.lobster）

Lobster は、`name`、`args`、`steps`、`env`、`condition`、`approval` フィールドを持つ YAML/JSON ワークフローファイルを実行できます。ツール呼び出しでは、`pipeline` をファイルパスに設定します。

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

注記:

- `stdin: $step.stdout` と `stdin: $step.json` は、以前のステップの出力を渡します。
- `condition`（または `when`）は、`$step.approved` に基づいてステップを制御できます。

## ツールパラメーター

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

引数付きでワークフローファイルを実行します。

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| フィールド       | デフォルト  | 注記                                                                                                         |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | 必須        | インラインパイプライン文字列、またはワークフローファイル用の `.lobster`/`.yaml`/`.yml`/`.json` で終わるパス。 |
| `cwd`            | Gateway cwd | 相対作業ディレクトリ。Gateway 作業ディレクトリ内に解決される必要があります（絶対パスは拒否されます）。       |
| `timeoutMs`      | `20000`     | 超過した場合、実行を中止します。                                                                             |
| `maxStdoutBytes` | `512000`    | 取得された stdout または stderr がこのサイズを超えた場合、実行を中止します。                                 |
| `argsJson`       | -           | ワークフローファイル用の引数の JSON 文字列（インラインパイプラインでは無視されます）。                       |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` は、`token`（`requiresApproval` からの完全な再開トークン）または `approvalId`（同じオブジェクト内の短い ID）のどちらかを受け付けます。停止した実行が返したほうを使用してください。`approve` は必須です。

### マネージドタスクフローモード

`run` に `flowControllerId` と `flowGoal` を渡す（または `resume` に `flowId` と `flowExpectedRevision` を渡す）と、呼び出しは裸のエンベロープを返すのではなく、プラグインランタイムのマネージド [タスクフロー](/ja-JP/automation/taskflow) API を経由します。OpenClaw は永続的なフローレコードを作成または再開し、Lobster エンベロープをそれに適用し（承認中は `waiting`、完了時は `succeeded`/`failed`）、`{ ok, envelope, flow, mutation }` を返します。このモードにはバインドされたタスクフローランタイムが必要で、通常のアドホックなエージェント利用ではなく、Gateway 再起動をまたいで永続的なフロー状態を必要とするプラグイン/コントローラーコード向けです。

## 出力エンベロープ

Lobster は、次の 3 つのステータスのいずれかを持つ JSON エンベロープを返します。

- `ok` - 正常に完了
- `needs_approval` - 一時停止中。`requiresApproval` は `resumeToken` と短い `approvalId` を含み、どちらでも実行を再開できます
- `cancelled` - 明示的に拒否またはキャンセル済み

ツールは、`content`（整形済み JSON）と `details`（生オブジェクト）の両方でエンベロープを提示します。

## 承認

`requiresApproval` が存在する場合は、プロンプトを確認して判断します。

- `approve: true` - 再開して副作用を続行
- `approve: false` - キャンセルしてワークフローを完了

`approve --preview-from-stdin --limit N` を使用すると、カスタムの jq/heredoc 接着コードなしで、JSON プレビューを承認リクエストに添付できます。再開状態は Lobster 状態ディレクトリ（デフォルトでは `~/.lobster/state`、`LOBSTER_STATE_DIR` で上書き可能）配下の小さな JSON ファイルとして保存されます。トークン自体は完全なパイプライン状態ではなく、その状態へのポインターのみをエンコードします。

## OpenProse

OpenProse は Lobster と相性がよいです。`/prose` を使用してマルチエージェントの準備をオーケストレーションし、その後 Lobster パイプラインを実行して決定的な承認を行います。Prose プログラムが Lobster を必要とする場合は、`tools.subagents.tools` を通じてサブエージェントに `lobster` ツールを許可します。[OpenProse](/ja-JP/prose) を参照してください。

## 安全性

- **ローカルのインプロセスのみ** - ワークフローは Gateway プロセス内で実行されます。プラグイン自体からのネットワーク呼び出しはありません。
- **シークレットなし** - Lobster は OAuth を管理しません。それを行う OpenClaw ツールを呼び出します。
- **サンドボックス対応** - ツールコンテキストがサンドボックス化されている場合は無効化されます。
- **堅牢化済み** - タイムアウトと出力上限は組み込みランナーによって強制されます。

## トラブルシューティング

| エラー                                                        | 原因 / 修正                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | パイプラインが `timeoutMs` を超過しました。増やすか、パイプラインを分割してください。 |
| `lobster stdout exceeded maxStdoutBytes`（または `stderr`）   | 取得された出力が上限を超えました。`maxStdoutBytes` を増やすか、出力を減らしてください。 |
| `run --args-json must be valid JSON`                          | `argsJson`（ワークフローファイル実行）の解析に失敗しました。JSON 文字列を修正してください。 |
| `lobster runtime failed`（または別の `runtime_error` メッセージ） | 組み込みランタイムがエラーエンベロープを返しました。詳細は Gateway ログを確認してください。 |

## さらに学ぶ

- [プラグイン](/ja-JP/tools/plugin)
- [プラグインツールの作成](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ: コミュニティワークフロー

公開例の 1 つとして、3 つの Markdown vault（個人用、パートナー用、共有用）を管理する「second brain」CLI + Lobster パイプラインがあります。この CLI は、統計、inbox 一覧、古くなった項目のスキャン用に JSON を出力します。Lobster はそれらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` のようなワークフローに連結し、それぞれに承認ゲートを設けます。AI は利用可能な場合に判断（分類）を処理し、利用できない場合は決定的なルールにフォールバックします。

- スレッド: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- リポジトリ: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連

- [自動化](/ja-JP/automation) - すべての自動化メカニズム
- [ツール概要](/ja-JP/tools) - 利用可能なすべての agent ツール
