---
read_when:
    - 明示的な承認を伴う決定論的な複数ステップのワークフローが必要な場合
    - 以前の手順を再実行せずにワークフローを再開する必要がある
summary: 再開可能な承認ゲートを備えた OpenClaw 用の型付きワークフローランタイム。
title: ロブスター
x-i18n:
    generated_at: "2026-04-30T05:38:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster は、OpenClaw が複数ステップのツールシーケンスを、明示的な承認チェックポイント付きの単一の決定的な操作として実行できるようにするワークフローシェルです。

Lobster は、切り離されたバックグラウンド作業の 1 つ上にあるオーサリングレイヤーです。個別タスクの上位にあるフローオーケストレーションについては、[タスクフロー](/ja-JP/automation/taskflow)（`openclaw tasks flow`）を参照してください。タスクアクティビティの台帳については、[`openclaw tasks`](/ja-JP/automation/tasks)を参照してください。

## フック

アシスタントは、それ自体を管理するツールを構築できます。ワークフローを依頼すると、30 分後には 1 回の呼び出しで動作する CLI とパイプラインが手に入ります。Lobster は欠けていた要素です。決定的なパイプライン、明示的な承認、再開可能な状態を提供します。

## 理由

現在、複雑なワークフローには何度ものツール呼び出しのやり取りが必要です。各呼び出しはトークンを消費し、LLM はすべてのステップをオーケストレーションしなければなりません。Lobster はそのオーケストレーションを型付きランタイムへ移します。

- **多数ではなく 1 回の呼び出し**: OpenClaw は 1 回の Lobster ツール呼び出しを実行し、構造化された結果を取得します。
- **承認が組み込み済み**: 副作用（メール送信、コメント投稿）は、明示的に承認されるまでワークフローを停止します。
- **再開可能**: 停止したワークフローはトークンを返します。承認して再開すれば、すべてを再実行する必要はありません。

## なぜ通常のプログラムではなく DSL なのか？

Lobster は意図的に小さく作られています。目標は「新しい言語」ではなく、第一級の承認と再開トークンを備えた、予測可能で AI に扱いやすいパイプライン仕様です。

- **承認/再開が組み込み済み**: 通常のプログラムでも人間に確認を求めることはできますが、そのランタイムを自分で作らない限り、永続的なトークンで_一時停止して再開_することはできません。
- **決定性 + 監査可能性**: パイプラインはデータなので、ログ記録、差分確認、再実行、レビューが容易です。
- **AI 向けに制約された表面**: 小さな文法 + JSON パイピングにより、「創造的」なコード経路を減らし、検証を現実的にします。
- **安全ポリシーが組み込み済み**: タイムアウト、出力上限、サンドボックスチェック、許可リストは各スクリプトではなくランタイムによって強制されます。
- **それでもプログラム可能**: 各ステップは任意の CLI やスクリプトを呼び出せます。JS/TS を使いたい場合は、コードから `.lobster` ファイルを生成します。

## 仕組み

OpenClaw は埋め込みランナーを使って、Lobster ワークフローを**インプロセス**で実行します。外部 CLI サブプロセスは起動されません。ワークフローエンジンは gateway プロセス内で実行され、JSON エンベロープを直接返します。
パイプラインが承認待ちで一時停止すると、ツールは後で続行できるように `resumeToken` を返します。

## パターン: 小さな CLI + JSON パイプ + 承認

JSON を扱う小さなコマンドを作り、それらを 1 回の Lobster 呼び出しに連結します。（以下のコマンド名は例です。自分のものに置き換えてください。）

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

例: 入力項目をツール呼び出しにマッピングします。

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON のみの LLM ステップ（llm-task）

**構造化された LLM ステップ**が必要なワークフローでは、任意の
`llm-task` plugin ツールを有効にし、Lobster から呼び出します。これにより、モデルで分類/要約/下書きを行いながらも、ワークフローを決定的に保てます。

ツールを有効にします。

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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

パイプラインで使用します。

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

詳細と設定オプションについては、[LLM タスク](/ja-JP/tools/llm-task)を参照してください。

## ワークフローファイル（.lobster）

Lobster は、`name`、`args`、`steps`、`env`、`condition`、`approval` フィールドを持つ YAML/JSON ワークフローファイルを実行できます。OpenClaw ツール呼び出しでは、`pipeline` にファイルパスを設定します。

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
- `condition`（または `when`）は、`$step.approved` に基づいてステップをゲートできます。

## Lobster をインストールする

同梱の Lobster ワークフローはインプロセスで実行されます。別個の `lobster` バイナリは必要ありません。埋め込みランナーは Lobster plugin に同梱されています。

開発や外部パイプラインのためにスタンドアロンの Lobster CLI が必要な場合は、[Lobster repo](https://github.com/openclaw/lobster) からインストールし、`lobster` が `PATH` 上にあることを確認してください。

## ツールを有効にする

Lobster は**任意**の plugin ツールです（デフォルトでは有効ではありません）。

推奨（追加的で安全）:

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

制限的な許可リストモードで実行する意図がない限り、`tools.allow: ["lobster"]` の使用は避けてください。

<Note>
許可リストは任意の plugins ではオプトインです。許可リストに plugin ツール（`lobster` など）のみを指定した場合、OpenClaw はコアツールを有効のままにします。コアツールを制限するには、許可リストに必要なコアツールまたはグループも含めてください。
</Note>

## 例: メールトリアージ

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

JSON エンベロープを返します（省略表示）。

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

## ツールパラメーター

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

引数付きでワークフローファイルを実行します。

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

承認後、停止したワークフローを続行します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 任意入力

- `cwd`: パイプラインの相対作業ディレクトリ（gateway の作業ディレクトリ内に収まる必要があります）。
- `timeoutMs`: この時間を超えた場合にワークフローを中止します（デフォルト: 20000）。
- `maxStdoutBytes`: 出力がこのサイズを超えた場合にワークフローを中止します（デフォルト: 512000）。
- `argsJson`: `lobster run --args-json` に渡される JSON 文字列（ワークフローファイルのみ）。

## 出力エンベロープ

Lobster は、3 つのステータスのいずれかを持つ JSON エンベロープを返します。

- `ok` → 正常に終了
- `needs_approval` → 一時停止。再開には `requiresApproval.resumeToken` が必要
- `cancelled` → 明示的に拒否またはキャンセル

ツールは、`content`（整形済み JSON）と `details`（生オブジェクト）の両方でエンベロープを表示します。

## 承認

`requiresApproval` が存在する場合は、プロンプトを確認して判断します。

- `approve: true` → 再開して副作用を続行
- `approve: false` → キャンセルしてワークフローを完了

カスタムの jq/heredoc 接着コードなしで、承認リクエストに JSON プレビューを添付するには、`approve --preview-from-stdin --limit N` を使用します。再開トークンは現在コンパクトです。Lobster はワークフローの再開状態を自身の状態ディレクトリに保存し、小さなトークンキーを返します。

## OpenProse

OpenProse は Lobster と相性がよいです。`/prose` を使ってマルチエージェントの準備をオーケストレーションし、その後 Lobster パイプラインを実行して決定的な承認を行います。Prose プログラムで Lobster が必要な場合は、`tools.subagents.tools` を通じてサブエージェントに `lobster` ツールを許可します。[OpenProse](/ja-JP/prose)を参照してください。

## 安全性

- **ローカルのインプロセスのみ** — ワークフローは gateway プロセス内で実行されます。plugin 自体からネットワーク呼び出しは行いません。
- **シークレットなし** — Lobster は OAuth を管理しません。それを行う OpenClaw ツールを呼び出します。
- **サンドボックス対応** — ツールコンテキストがサンドボックス化されている場合は無効になります。
- **強化済み** — タイムアウトと出力上限は埋め込みランナーによって強制されます。

## トラブルシューティング

- **`lobster timed out`** → `timeoutMs` を増やすか、長いパイプラインを分割してください。
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` を増やすか、出力サイズを減らしてください。
- **`lobster returned invalid JSON`** → パイプラインがツールモードで実行され、JSON のみを出力していることを確認してください。
- **`lobster failed`** → 埋め込みランナーのエラー詳細について gateway ログを確認してください。

## 詳細

- [Plugins](/ja-JP/tools/plugin)
- [Plugin ツールのオーサリング](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ: コミュニティワークフロー

公開例の 1 つとして、「セカンドブレイン」CLI + Lobster パイプラインがあり、3 つの Markdown vault（個人、パートナー、共有）を管理します。この CLI は、統計、inbox 一覧、古い項目のスキャンについて JSON を出力します。Lobster はそれらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` などのワークフローに連結し、それぞれに承認ゲートを持たせます。AI は利用可能な場合に判断（分類）を担当し、利用できない場合は決定的なルールにフォールバックします。

- スレッド: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連

- [自動化とタスク](/ja-JP/automation) — Lobster ワークフローのスケジューリング
- [自動化の概要](/ja-JP/automation) — すべての自動化メカニズム
- [ツールの概要](/ja-JP/tools) — 利用可能なすべてのエージェントツール
