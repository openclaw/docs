---
read_when:
    - 明示的な承認を伴う決定論的な複数ステップのワークフローが必要な場合
    - 以前の手順を再実行せずにワークフローを再開する必要があります
summary: 再開可能な承認ゲートを備えた OpenClaw 用の型付きワークフローランタイム。
title: ロブスター
x-i18n:
    generated_at: "2026-05-06T05:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster は、OpenClaw が複数ステップのツールシーケンスを、明示的な承認チェックポイント付きの単一の決定的な操作として実行できるようにするワークフローシェルです。

Lobster は、切り離されたバックグラウンド作業の 1 つ上にあるオーサリング層です。個別タスクの上位でフローをオーケストレーションするには、[タスクフロー](/ja-JP/automation/taskflow) (`openclaw tasks flow`) を参照してください。タスクアクティビティ台帳については、[`openclaw tasks`](/ja-JP/automation/tasks) を参照してください。

## フック

アシスタントは、自身を管理するツールを構築できます。ワークフローを依頼すると、30 分後には CLI と、1 回の呼び出しとして実行されるパイプラインが手に入ります。Lobster は欠けていたピースです。決定的なパイプライン、明示的な承認、再開可能な状態を提供します。

## 理由

現在、複雑なワークフローには何度も往復するツール呼び出しが必要です。各呼び出しはトークンを消費し、LLM はすべてのステップをオーケストレーションしなければなりません。Lobster はそのオーケストレーションを型付きランタイムに移します。

- **多数の呼び出しではなく 1 回の呼び出し**: OpenClaw は 1 回の Lobster ツール呼び出しを実行し、構造化された結果を取得します。
- **承認を組み込み**: 副作用（メール送信、コメント投稿）は、明示的に承認されるまでワークフローを停止します。
- **再開可能**: 停止したワークフローはトークンを返します。すべてを再実行せずに、承認して再開できます。

## 通常のプログラムではなく DSL を使う理由

Lobster は意図的に小さく作られています。目標は「新しい言語」ではなく、ファーストクラスの承認と再開トークンを備えた、予測可能で AI に扱いやすいパイプライン仕様です。

- **承認/再開を組み込み**: 通常のプログラムは人間に確認できますが、耐久性のあるトークンで _一時停止して再開_ するには、そのランタイムを自分で作る必要があります。
- **決定性 + 監査可能性**: パイプラインはデータなので、ログ記録、差分確認、再生、レビューが簡単です。
- **AI 向けの制約された表面**: 小さな文法 + JSON パイピングにより「創造的な」コードパスを減らし、現実的な検証を可能にします。
- **安全ポリシーを組み込み**: タイムアウト、出力上限、サンドボックスチェック、許可リストは各スクリプトではなくランタイムによって適用されます。
- **それでもプログラム可能**: 各ステップは任意の CLI やスクリプトを呼び出せます。JS/TS を使いたい場合は、コードから `.lobster` ファイルを生成します。

## 仕組み

OpenClaw は埋め込みランナーを使って Lobster ワークフローを **プロセス内** で実行します。外部 CLI サブプロセスは起動されません。ワークフローエンジンは Gateway プロセス内で実行され、JSON エンベロープを直接返します。
パイプラインが承認待ちで一時停止した場合、ツールは後で続行できるように `resumeToken` を返します。

## パターン: 小さな CLI + JSON パイプ + 承認

JSON を扱う小さなコマンドを作成し、それらを 1 回の Lobster 呼び出しに連結します。（以下のコマンド名は例です。自分のものに置き換えてください。）

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

AI がワークフローをトリガーし、Lobster がステップを実行します。承認ゲートにより、副作用は明示的かつ監査可能に保たれます。

例: 入力項目をツール呼び出しにマッピングする:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON のみの LLM ステップ (llm-task)

**構造化された LLM ステップ** が必要なワークフローでは、任意の
`llm-task` plugin ツールを有効にして、Lobster から呼び出します。これにより、モデルで分類/要約/下書きを行いつつ、ワークフローを決定的に保てます。

ツールを有効にする:

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

パイプラインで使う:

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

詳細と設定オプションについては [LLM タスク](/ja-JP/tools/llm-task) を参照してください。

## ワークフローファイル (.lobster)

Lobster は、`name`、`args`、`steps`、`env`、`condition`、`approval` フィールドを持つ YAML/JSON ワークフローファイルを実行できます。OpenClaw ツール呼び出しでは、`pipeline` をファイルパスに設定します。

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

注:

- `stdin: $step.stdout` と `stdin: $step.json` は、前のステップの出力を渡します。
- `condition`（または `when`）は `$step.approved` に基づいてステップを制御できます。

## Lobster をインストールする

バンドルされた Lobster ワークフローはプロセス内で実行されるため、別個の `lobster` バイナリは不要です。埋め込みランナーは Lobster plugin に同梱されています。

開発や外部パイプラインのためにスタンドアロンの Lobster CLI が必要な場合は、[Lobster リポジトリ](https://github.com/openclaw/lobster) からインストールし、`lobster` が `PATH` 上にあることを確認してください。

## ツールを有効にする

Lobster は **任意** の plugin ツールです（デフォルトでは有効ではありません）。

推奨（追加的で安全）:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

またはエージェントごとに設定:

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

制限的な許可リストモードで実行する意図がない限り、`tools.allow: ["lobster"]` は避けてください。

<Note>
任意 plugins では許可リストはオプトインです。`alsoAllow` は通常のコアツールセットを維持したまま、指定された任意 plugin ツールだけを有効にします。コアツールを制限するには、必要なコアツールまたはグループを指定して `tools.allow` を使用します。
</Note>

## 例: メールのトリアージ

Lobster なしの場合:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobster ありの場合:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

JSON エンベロープを返します（省略表示）:

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

ユーザーが承認 → 再開:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

1 つのワークフロー。決定的。安全。

## ツールパラメータ

### `run`

ツールモードでパイプラインを実行します。

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

引数付きでワークフローファイルを実行する:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

承認後に停止中のワークフローを続行します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 任意入力

- `cwd`: パイプラインの相対作業ディレクトリ（Gateway の作業ディレクトリ内に留まる必要があります）。
- `timeoutMs`: この時間を超えた場合にワークフローを中止します（デフォルト: 20000）。
- `maxStdoutBytes`: 出力がこのサイズを超えた場合にワークフローを中止します（デフォルト: 512000）。
- `argsJson`: `lobster run --args-json` に渡される JSON 文字列（ワークフローファイルのみ）。

## 出力エンベロープ

Lobster は 3 つのステータスのいずれかを含む JSON エンベロープを返します。

- `ok` → 正常に完了
- `needs_approval` → 一時停止中。再開には `requiresApproval.resumeToken` が必要です
- `cancelled` → 明示的に拒否またはキャンセル済み

ツールはエンベロープを `content`（整形された JSON）と `details`（生オブジェクト）の両方で提示します。

## 承認

`requiresApproval` が存在する場合は、プロンプトを確認して判断します。

- `approve: true` → 再開して副作用を続行
- `approve: false` → キャンセルしてワークフローを終了

カスタムの jq/heredoc 接着コードなしで承認リクエストに JSON プレビューを添付するには、`approve --preview-from-stdin --limit N` を使用します。再開トークンは現在コンパクトです。Lobster はワークフローの再開状態を状態ディレクトリ配下に保存し、小さなトークンキーを返します。

## OpenProse

OpenProse は Lobster と相性が良いです。`/prose` を使ってマルチエージェントの準備をオーケストレーションし、その後 Lobster パイプラインを実行して決定的な承認を行います。Prose プログラムが Lobster を必要とする場合は、`tools.subagents.tools` 経由でサブエージェントに `lobster` ツールを許可します。[OpenProse](/ja-JP/prose) を参照してください。

## 安全性

- **ローカルのプロセス内のみ** - ワークフローは Gateway プロセス内で実行されます。plugin 自体からネットワーク呼び出しは行われません。
- **シークレットなし** - Lobster は OAuth を管理しません。それを行う OpenClaw ツールを呼び出します。
- **サンドボックス対応** - ツールコンテキストがサンドボックス化されている場合は無効になります。
- **強化済み** - タイムアウトと出力上限は埋め込みランナーによって適用されます。

## トラブルシューティング

- **`lobster timed out`** → `timeoutMs` を増やすか、長いパイプラインを分割してください。
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` を上げるか、出力サイズを減らしてください。
- **`lobster returned invalid JSON`** → パイプラインがツールモードで実行され、JSON だけを出力することを確認してください。
- **`lobster failed`** → 埋め込みランナーのエラー詳細について Gateway ログを確認してください。

## 詳細

- [Plugins](/ja-JP/tools/plugin)
- [Plugin ツールの作成](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ: コミュニティワークフロー

公開例の 1 つとして、3 つの Markdown ボールト（個人、パートナー、共有）を管理する「第二の脳」CLI + Lobster パイプラインがあります。この CLI は統計、受信箱リスト、古い項目のスキャンについて JSON を出力します。Lobster はそれらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` のようなワークフローに連結し、それぞれに承認ゲートを設けます。AI は利用可能な場合に判断（分類）を扱い、利用できない場合は決定的なルールにフォールバックします。

- スレッド: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- リポジトリ: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連

- [自動化とタスク](/ja-JP/automation) - Lobster ワークフローのスケジュール設定
- [自動化の概要](/ja-JP/automation) - すべての自動化メカニズム
- [ツールの概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
