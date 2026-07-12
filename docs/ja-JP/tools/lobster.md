---
read_when:
    - 明示的な承認を伴う、決定論的な複数ステップのワークフローが必要な場合
    - 前の手順を再実行せずにワークフローを再開する必要がある場合
summary: 再開可能な承認ゲートを備えた OpenClaw 向け型付きワークフローランタイム。
title: ロブスター
x-i18n:
    generated_at: "2026-07-11T22:45:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster は、明示的な承認チェックポイントと再開トークンを備えた複数ステップのツールパイプラインを、決定論的な単一のツール呼び出しとして実行します。これは切り離されたバックグラウンド処理の一段上に位置します。多数の切り離されたタスクにまたがるフローをオーケストレーションするには、[Task Flow](/ja-JP/automation/taskflow)（`openclaw tasks flow`）を参照してください。タスクのアクティビティ台帳については、[バックグラウンドタスク](/ja-JP/automation/tasks)を参照してください。

## 理由

Lobster を使用しない場合、複数ステップのジョブには多数の往復ツール呼び出しが必要となり、モデルが各ステップをオーケストレーションします。Lobster は、そのオーケストレーションを型付きランタイムに移します。

- **多数の呼び出しを1回に集約**：単一の Lobster ツール呼び出しが、パイプライン全体の構造化された結果を返します。
- **承認を内蔵**：副作用（送信、投稿、削除）が発生する前にワークフローを停止し、明示的な承認を待ちます。
- **再開可能**：停止したワークフローはトークンを返します。承認して再開する際に、以前のステップを再実行する必要はありません。

Lobster は汎用スクリプト言語ではなく、小規模で制約された DSL です。承認と再開は永続性のある組み込みプリミティブです。パイプラインはデータであるため、ログ記録、差分確認、再実行、レビューが容易です。小さな文法によって「創造的」なコードパスが制限されるため、現実的な検証が可能です。また、タイムアウト、出力上限、サンドボックスチェック、許可リストは各スクリプトではなくランタイムによって適用されます。それでも各ステップから任意の CLI やスクリプトを呼び出せます。より表現力の高いオーサリング言語が必要な場合は、別のツールから `.lobster` ファイルを生成してください。

Lobster を使用しない場合、定期的なメールのトリアージは次のようになります。

```text
ユーザー：「メールを確認して返信の下書きを作成して」
→ openclaw が gmail.list を呼び出す
→ LLM が要約する
→ ユーザー：「#2 と #5 への返信を下書きして」
→ LLM が下書きする
→ ユーザー：「#2 を送信して」
→ openclaw が gmail.send を呼び出す
（毎日繰り返され、何をトリアージしたかの記憶は残らない）
```

Lobster を使用すると、同じジョブが承認のために停止し、その後再開できる単一の呼び出しになります。

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

OpenClaw は、組み込みランナーとして同梱されている `@clawdbot/lobster` パッケージを使用し、Lobster ワークフローを**プロセス内**で実行します。外部の `lobster` サブプロセスは起動されず、ツール呼び出しから JSON エンベロープが直接返されます。パイプラインが承認のために停止した場合、後で続行できるように、エンベロープには再開トークン（または短い承認 ID）が含まれます。

## 有効化

Lobster は**任意**の Plugin ツールであり、デフォルトでは有効になっていません。同梱されているため、個別のインストール手順は不要です。ツールを許可するだけで使用できます。

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
`alsoAllow` は、他のコアツールを制限せずに、アクティブなツールプロファイルへ `lobster` を追加します。制限的な許可リストモードを使用する場合にのみ、代わりに `tools.allow` を使用してください。
</Note>

サンドボックス化されたツールコンテキストでは、このツールは完全に無効になります。

開発用または外部パイプライン用（組み込み Gateway ランナー外）のスタンドアロン Lobster CLI が必要な場合は、[Lobster リポジトリ](https://github.com/openclaw/lobster)からインストールし、`lobster` を `PATH` に追加してください。

## パターン：小さな CLI + JSON パイプ + 承認

JSON を扱う小さなコマンドを作成し、それらを単一の Lobster 呼び出しに連結します。
（以下はコマンド名の例です。独自のものに置き換えてください。）

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

パイプラインが承認を要求した場合は、トークンを使用して再開します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

例：入力項目をツール呼び出しにマッピングします。

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON のみの LLM ステップ（llm-task）

ワークフロー内で**構造化された LLM ステップ**を使用するには、任意の `llm-task` Plugin ツールを有効化し、Lobster から呼び出します。

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

### 重要な制限：組み込み Lobster と `openclaw.invoke` の違い

同梱されている Lobster Plugin は、Gateway 内でワークフローを**プロセス内**実行します。この組み込みモードでは、ネストされた OpenClaw CLI ツール呼び出しに対して、`openclaw.invoke` が Gateway URL や認証コンテキストを自動的に継承することは**ありません**。

そのため、次のパターンは、現在の組み込みランナーでは**信頼できません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

以下の例は、`openclaw.invoke` に正しい Gateway と認証のコンテキストがすでに設定された環境で、**スタンドアロン Lobster CLI** を実行する場合にのみ使用してください。

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

現在、組み込み Lobster Plugin を使用している場合は、次のいずれかを推奨します。

- Lobster 外で `llm-task` ツールを直接呼び出す
- サポート対象の組み込みブリッジが追加されるまで、Lobster パイプライン内では `openclaw.invoke` 以外のステップを使用する

詳細と設定オプションについては、[LLM タスク](/ja-JP/tools/llm-task)を参照してください。

## ワークフローファイル（.lobster）

Lobster は、`name`、`args`、`steps`、`env`、`condition`、`approval` フィールドを含む YAML/JSON ワークフローファイルを実行できます。ツール呼び出しの `pipeline` にファイルパスを設定します。

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

注記：

- `stdin: $step.stdout` と `stdin: $step.json` は、前のステップの出力を渡します。
- `condition`（または `when`）を使用すると、`$step.approved` に基づいてステップの実行を制御できます。

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

引数を指定してワークフローファイルを実行します。

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| フィールド       | デフォルト  | 注記                                                                                                                         |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | 必須        | インラインパイプライン文字列、またはワークフローファイルを示す `.lobster`/`.yaml`/`.yml`/`.json` で終わるパス。              |
| `cwd`            | Gateway の cwd | 相対作業ディレクトリ。Gateway の作業ディレクトリ内に解決される必要があります（絶対パスは拒否されます）。                    |
| `timeoutMs`      | `20000`     | この時間を超えた場合、実行を中止します。                                                                                     |
| `maxStdoutBytes` | `512000`    | 取得した標準出力または標準エラー出力がこのサイズを超えた場合、実行を中止します。                                             |
| `argsJson`       | -           | ワークフローファイル用の引数を表す JSON 文字列（インラインパイプラインでは無視されます）。                                   |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` は、`token`（`requiresApproval` に含まれる完全な再開トークン）または `approvalId`（同じオブジェクトに含まれる短い ID）のいずれかを受け付けます。停止した実行が返した方を使用してください。`approve` は必須です。

### 管理対象 Task Flow モード

`run` に `flowControllerId` と `flowGoal` を渡す（または `resume` に `flowId` と `flowExpectedRevision` を渡す）と、単純なエンベロープを返す代わりに、Plugin ランタイムの管理対象 [Task Flow](/ja-JP/automation/taskflow) API を通じて呼び出しが処理されます。OpenClaw は永続的なフローレコードを作成または再開し、Lobster エンベロープを適用し（承認待ちの場合は `waiting`、完了時は `succeeded`/`failed`）、`{ ok, envelope, flow, mutation }` を返します。このモードにはバインドされた Task Flow ランタイムが必要です。通常のアドホックなエージェント利用ではなく、Gateway の再起動後も永続的なフロー状態を必要とする Plugin またはコントローラーコード向けです。

## 出力エンベロープ

Lobster は、次の3つのステータスのいずれかを持つ JSON エンベロープを返します。

- `ok` - 正常に完了
- `needs_approval` - 一時停止中。`requiresApproval` に `resumeToken` と短い `approvalId` が含まれ、どちらでも実行を再開可能
- `cancelled` - 明示的に拒否またはキャンセル済み

ツールは、エンベロープを `content`（整形済み JSON）と `details`（未加工オブジェクト）の両方で公開します。

## 承認

`requiresApproval` が存在する場合は、プロンプトを確認して判断します。

- `approve: true` - 再開し、副作用を伴う処理を続行
- `approve: false` - キャンセルしてワークフローを終了

`approve --preview-from-stdin --limit N` を使用すると、独自の jq/heredoc 処理を作成せずに、承認リクエストへ JSON プレビューを添付できます。再開状態は、Lobster の状態ディレクトリ（デフォルトでは `~/.lobster/state`、`LOBSTER_STATE_DIR` で上書き可能）に小さな JSON ファイルとして保存されます。トークン自体には、パイプラインの完全な状態ではなく、その状態へのポインターのみがエンコードされます。

## OpenProse

OpenProse は Lobster と組み合わせて効果的に使用できます。`/prose` を使用して複数エージェントによる準備をオーケストレーションし、その後 Lobster パイプラインを実行して決定論的な承認を行います。Prose プログラムで Lobster が必要な場合は、`tools.subagents.tools` を使用してサブエージェントに `lobster` ツールを許可してください。[OpenProse](/ja-JP/prose)を参照してください。

## 安全性

- **ローカルのプロセス内のみ** - ワークフローは Gateway プロセス内で実行されます。Plugin 自体からネットワーク呼び出しは行いません。
- **シークレットなし** - Lobster は OAuth を管理せず、それを行う OpenClaw ツールを呼び出します。
- **サンドボックス対応** - ツールコンテキストがサンドボックス化されている場合は無効になります。
- **堅牢化** - 組み込みランナーによってタイムアウトと出力上限が適用されます。

## トラブルシューティング

| エラー                                                        | 原因／修正方法                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | パイプラインが `timeoutMs` を超過しました。値を増やすか、パイプラインを分割してください。              |
| `lobster stdout exceeded maxStdoutBytes`（または `stderr`）   | 取得した出力が上限を超えました。`maxStdoutBytes` を増やすか、出力を減らしてください。                   |
| `run --args-json must be valid JSON`                          | `argsJson`（ワークフローファイルの実行）の解析に失敗しました。JSON 文字列を修正してください。          |
| `lobster runtime failed`（または別の `runtime_error` メッセージ） | 組み込みランタイムがエラーエンベロープを返しました。詳細については Gateway のログを確認してください。 |

## 詳細情報

- [Plugins](/ja-JP/tools/plugin)
- [Plugin ツールの作成](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ：コミュニティのワークフロー

公開されている例の一つは、3つの Markdown 保管庫（個人用、パートナー用、共有用）を管理する「第二の脳」CLI と Lobster パイプラインです。CLI は統計、受信トレイ一覧、古くなった項目のスキャン結果を JSON で出力します。Lobster はこれらのコマンドを連結し、`weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` などのワークフローを構成します。各ワークフローには承認ゲートがあります。AI が利用可能な場合は判断（分類）を行い、利用できない場合は決定論的なルールにフォールバックします。

- スレッド：[https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- リポジトリ：[https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連項目

- [自動化](/ja-JP/automation) - すべての自動化メカニズム
- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
