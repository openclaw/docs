---
read_when:
    - 明示的な承認を伴う決定論的な複数ステップのワークフローが必要な場合
    - 前のステップを再実行せずにワークフローを再開する必要がある
summary: OpenClaw 向けの、再開可能な承認ゲートを備えた型付きワークフローランタイム。
title: ロブスター
x-i18n:
    generated_at: "2026-05-04T05:02:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster は、OpenClaw が明示的な承認チェックポイントを持つ単一の決定論的な操作として、複数ステップのツールシーケンスを実行できるようにするワークフローシェルです。

Lobster は、切り離されたバックグラウンド作業の一段上にあるオーサリング層です。個別タスクの上位でフローをオーケストレーションするには、[タスクフロー](/ja-JP/automation/taskflow)（`openclaw tasks flow`）を参照してください。タスク活動台帳については、[`openclaw tasks`](/ja-JP/automation/tasks) を参照してください。

## フック

アシスタントは、自分自身を管理するツールを構築できます。ワークフローを依頼すると、30 分後には 1 回の呼び出しで実行される CLI とパイプラインが手に入ります。Lobster はその不足していた要素です。決定論的なパイプライン、明示的な承認、再開可能な状態を提供します。

## なぜ必要か

現在、複雑なワークフローには何度もツール呼び出しを往復する必要があります。各呼び出しはトークンを消費し、LLM がすべてのステップをオーケストレーションする必要があります。Lobster はそのオーケストレーションを型付きランタイムへ移します。

- **多数ではなく 1 回の呼び出し**: OpenClaw は 1 回の Lobster ツール呼び出しを実行し、構造化された結果を取得します。
- **承認を組み込み**: 副作用（メール送信、コメント投稿）は、明示的に承認されるまでワークフローを停止します。
- **再開可能**: 停止したワークフローはトークンを返します。承認して再開すれば、すべてを再実行する必要はありません。

## 通常のプログラムではなく DSL を使う理由

Lobster は意図的に小さく設計されています。目標は「新しい言語」ではなく、ファーストクラスの承認と再開トークンを備えた、予測可能で AI に扱いやすいパイプライン仕様です。

- **承認/再開が組み込み**: 通常のプログラムでも人間に確認を求めることはできますが、永続的なトークンで_一時停止して再開_するには、そのランタイムを自分で作る必要があります。
- **決定性 + 監査可能性**: パイプラインはデータなので、ログ記録、差分確認、再生、レビューが容易です。
- **AI 向けの制約された表面**: 小さな文法 + JSON パイピングにより、「創造的な」コードパスを減らし、検証を現実的にします。
- **安全ポリシーを内蔵**: タイムアウト、出力上限、サンドボックスチェック、許可リストは、各スクリプトではなくランタイムによって強制されます。
- **それでもプログラム可能**: 各ステップは任意の CLI やスクリプトを呼び出せます。JS/TS を使いたい場合は、コードから `.lobster` ファイルを生成してください。

## 仕組み

OpenClaw は埋め込みランナーを使って Lobster ワークフローを**インプロセス**で実行します。外部 CLI サブプロセスは起動されません。ワークフローエンジンは Gateway プロセス内で実行され、JSON エンベロープを直接返します。
パイプラインが承認のために一時停止した場合、ツールは後で続行できるように `resumeToken` を返します。

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

**構造化された LLM ステップ**が必要なワークフローでは、任意の `llm-task` Plugin ツールを有効にし、Lobster から呼び出します。これにより、モデルで分類/要約/下書き作成を行いながらも、ワークフローを決定論的に保てます。

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
        "tools": { "alsoAllow": ["llm-task"] }
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

詳細と設定オプションについては、[LLM Task](/ja-JP/tools/llm-task) を参照してください。

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

メモ:

- `stdin: $step.stdout` と `stdin: $step.json` は、以前のステップの出力を渡します。
- `condition`（または `when`）は、`$step.approved` に基づいてステップをゲートできます。

## Lobster をインストールする

バンドルされた Lobster ワークフローはインプロセスで実行されるため、別個の `lobster` バイナリは不要です。埋め込みランナーは Lobster Plugin に同梱されています。

開発や外部パイプライン用にスタンドアロンの Lobster CLI が必要な場合は、[Lobster リポジトリ](https://github.com/openclaw/lobster) からインストールし、`lobster` が `PATH` 上にあることを確認してください。

## ツールを有効にする

Lobster は**任意**の Plugin ツールです（デフォルトでは有効になっていません）。

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
許可リストは任意 Plugin ではオプトインです。`alsoAllow` は通常のコアツールセットを維持しながら、指定された任意 Plugin ツールのみを有効にします。コアツールを制限するには、必要なコアツールまたはグループとともに `tools.allow` を使用してください。
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

1 つのワークフロー。決定論的。安全。

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

- `cwd`: パイプラインの相対作業ディレクトリ（Gateway 作業ディレクトリ内に留まる必要があります）。
- `timeoutMs`: この時間を超えた場合にワークフローを中止します（デフォルト: 20000）。
- `maxStdoutBytes`: 出力がこのサイズを超えた場合にワークフローを中止します（デフォルト: 512000）。
- `argsJson`: `lobster run --args-json` に渡される JSON 文字列（ワークフローファイルのみ）。

## 出力エンベロープ

Lobster は、3 つのステータスのいずれかを持つ JSON エンベロープを返します。

- `ok` → 正常に完了
- `needs_approval` → 一時停止。再開には `requiresApproval.resumeToken` が必要
- `cancelled` → 明示的に拒否またはキャンセル済み

ツールはエンベロープを `content`（整形された JSON）と `details`（生オブジェクト）の両方で公開します。

## 承認

`requiresApproval` が存在する場合は、プロンプトを確認して判断します。

- `approve: true` → 再開して副作用を続行
- `approve: false` → キャンセルしてワークフローを終了

カスタムの jq/heredoc 接着コードなしで承認リクエストに JSON プレビューを添付するには、`approve --preview-from-stdin --limit N` を使用してください。再開トークンは現在コンパクトです。Lobster はワークフロー再開状態を自身の状態ディレクトリに保存し、小さなトークンキーを返します。

## OpenProse

OpenProse は Lobster と相性がよいです。`/prose` を使ってマルチエージェントの準備をオーケストレーションし、その後、決定論的な承認のために Lobster パイプラインを実行します。Prose プログラムが Lobster を必要とする場合は、`tools.subagents.tools` を通じてサブエージェントに `lobster` ツールを許可してください。[OpenProse](/ja-JP/prose) を参照してください。

## 安全性

- **ローカルのインプロセスのみ** — ワークフローは Gateway プロセス内で実行されます。Plugin 自体からネットワーク呼び出しは行いません。
- **シークレットなし** — Lobster は OAuth を管理しません。それを行う OpenClaw ツールを呼び出します。
- **サンドボックス対応** — ツールコンテキストがサンドボックス化されている場合は無効になります。
- **堅牢化済み** — タイムアウトと出力上限は埋め込みランナーによって強制されます。

## トラブルシューティング

- **`lobster timed out`** → `timeoutMs` を増やすか、長いパイプラインを分割してください。
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` を増やすか、出力サイズを減らしてください。
- **`lobster returned invalid JSON`** → パイプラインがツールモードで実行され、JSON だけを出力することを確認してください。
- **`lobster failed`** → 埋め込みランナーのエラー詳細について Gateway ログを確認してください。

## 詳細情報

- [Plugins](/ja-JP/tools/plugin)
- [Plugin ツールの作成](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ: コミュニティワークフロー

公開例の 1 つとして、3 つの Markdown ボールト（個人、パートナー、共有）を管理する「セカンドブレイン」CLI + Lobster パイプラインがあります。この CLI は、統計、受信箱一覧、古い項目のスキャンについて JSON を出力します。Lobster はそれらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` のようなワークフローに連結し、それぞれに承認ゲートを設けます。AI は利用可能な場合に判断（分類）を処理し、利用できない場合は決定論的ルールにフォールバックします。

- スレッド: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- リポジトリ: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連

- [自動化とタスク](/ja-JP/automation) — Lobster ワークフローのスケジューリング
- [自動化の概要](/ja-JP/automation) — すべての自動化メカニズム
- [ツールの概要](/ja-JP/tools) — 利用可能なすべてのエージェントツール
