---
read_when:
    - 明示的な承認を伴う、決定論的な複数ステップのワークフローが必要な場合
    - 以前の手順を再実行せずにワークフローを再開する必要がある
summary: 再開可能な承認ゲートを備えた OpenClaw 向けの型付きワークフローランタイム。
title: ロブスター
x-i18n:
    generated_at: "2026-05-07T13:26:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster は、OpenClaw が複数ステップのツールシーケンスを、明示的な承認チェックポイントを持つ単一の決定的な操作として実行できるようにするワークフローシェルです。

Lobster は、デタッチされたバックグラウンド作業の 1 つ上にあるオーサリングレイヤーです。個別タスクの上でフローをオーケストレーションする場合は、[Task Flow](/ja-JP/automation/taskflow) (`openclaw tasks flow`) を参照してください。タスクアクティビティの台帳については、[`openclaw tasks`](/ja-JP/automation/tasks) を参照してください。

## フック

アシスタントは、自分自身を管理するツールを構築できます。ワークフローを依頼すれば、30 分後には 1 回の呼び出しとして実行される CLI とパイプラインが手に入ります。Lobster は、決定的なパイプライン、明示的な承認、再開可能な状態という欠けていた要素です。

## 理由

現在、複雑なワークフローには何度もツール呼び出しをやり取りする必要があります。各呼び出しはトークンを消費し、LLM はすべてのステップをオーケストレーションしなければなりません。Lobster はそのオーケストレーションを型付きランタイムへ移します。

- **多数ではなく 1 回の呼び出し**: OpenClaw は 1 回の Lobster ツール呼び出しを実行し、構造化された結果を取得します。
- **承認が組み込み済み**: 副作用（メール送信、コメント投稿）は、明示的に承認されるまでワークフローを停止します。
- **再開可能**: 停止したワークフローはトークンを返します。すべてを再実行せずに、承認して再開できます。

## 通常のプログラムではなく DSL を使う理由

Lobster は意図的に小さく作られています。目標は「新しい言語」ではなく、ファーストクラスの承認と再開トークンを備えた、予測可能で AI に扱いやすいパイプライン仕様です。

- **承認/再開が組み込み済み**: 通常のプログラムは人間に確認できますが、そのためのランタイムを自作しない限り、耐久性のあるトークンで_停止して再開_することはできません。
- **決定性 + 監査可能性**: パイプラインはデータなので、ログ化、差分確認、再実行、レビューが容易です。
- **AI 向けに制約された表面**: 小さな文法 + JSON パイプにより「創造的な」コードパスが減り、現実的に検証できます。
- **安全ポリシーが組み込み済み**: タイムアウト、出力上限、サンドボックスチェック、許可リストは各スクリプトではなくランタイムによって強制されます。
- **それでもプログラム可能**: 各ステップは任意の CLI やスクリプトを呼び出せます。JS/TS を使いたい場合は、コードから `.lobster` ファイルを生成できます。

## 仕組み

OpenClaw は、埋め込みランナーを使用して Lobster ワークフローを**インプロセス**で実行します。外部 CLI サブプロセスは起動されません。ワークフローエンジンは gateway プロセス内で実行され、JSON エンベロープを直接返します。
パイプラインが承認のために一時停止した場合、ツールは後で続行できるように `resumeToken` を返します。

## パターン: 小さな CLI + JSON パイプ + 承認

JSON を扱う小さなコマンドを作成し、それらを 1 回の Lobster 呼び出しに連結します。（下のコマンド名は例です。自分のものに置き換えてください。）

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

AI がワークフローを起動し、Lobster がステップを実行します。承認ゲートにより、副作用は明示的かつ監査可能に保たれます。

例: 入力項目をツール呼び出しへマッピングします。

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 専用 LLM ステップ（llm-task）

**構造化された LLM ステップ**が必要なワークフローでは、任意の
`llm-task` Plugin ツールを有効化し、Lobster から呼び出します。これにより、モデルによる分類、要約、下書き作成を許可しつつ、ワークフローを決定的に保てます。

ツールを有効化します。

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

### 重要な制限: 埋め込み Lobster と `openclaw.invoke`

同梱の Lobster Plugin は、gateway 内でワークフローを**インプロセス**実行します。この埋め込みモードでは、`openclaw.invoke` はネストされた OpenClaw CLI ツール呼び出し用の gateway URL/認証コンテキストを自動的には継承しません。

つまり、このパターンは**現在、埋め込みランナーでは信頼できません**。

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

以下の例は、`openclaw.invoke` が正しい gateway/認証コンテキストで既に設定されている環境で、**スタンドアロン Lobster CLI**を実行する場合にのみ使用してください。

スタンドアロン Lobster CLI パイプラインで使用します。

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

現在、埋め込み Lobster Plugin を使用している場合は、次のどちらかを推奨します。

- Lobster の外側で直接 `llm-task` ツールを呼び出す、または
- サポートされた埋め込みブリッジが追加されるまで、Lobster パイプライン内で `openclaw.invoke` ではないステップを使用する。

詳細と設定オプションについては、[LLM タスク](/ja-JP/tools/llm-task) を参照してください。

## ワークフローファイル（.lobster）

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
- `condition`（または `when`）は、`$step.approved` に基づいてステップをゲートできます。

## Lobster のインストール

同梱の Lobster ワークフローはインプロセスで実行されるため、別個の `lobster` バイナリは不要です。埋め込みランナーは Lobster Plugin に同梱されています。

開発や外部パイプラインのためにスタンドアロン Lobster CLI が必要な場合は、[Lobster リポジトリ](https://github.com/openclaw/lobster) からインストールし、`lobster` が `PATH` 上にあることを確認してください。

## ツールを有効化する

Lobster は**任意**の Plugin ツールです（デフォルトでは有効化されません）。

推奨（追加的で安全）:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

またはエージェントごとに指定します。

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
許可リストは任意 Plugin ではオプトインです。`alsoAllow` は、通常のコアツールセットを保持したまま、指定された任意 Plugin ツールだけを有効化します。コアツールを制限するには、必要なコアツールまたはグループとともに `tools.allow` を使用してください。
</Note>

## 例: メールトリアージ

Lobster なし:

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

Lobster あり:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

JSON エンベロープを返します（省略あり）。

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

承認後に停止したワークフローを続行します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 任意入力

- `cwd`: パイプラインの相対作業ディレクトリ（gateway の作業ディレクトリ内に留まる必要があります）。
- `timeoutMs`: この時間を超えた場合にワークフローを中止します（デフォルト: 20000）。
- `maxStdoutBytes`: 出力がこのサイズを超えた場合にワークフローを中止します（デフォルト: 512000）。
- `argsJson`: `lobster run --args-json` に渡される JSON 文字列（ワークフローファイルのみ）。

## 出力エンベロープ

Lobster は、3 つのステータスのいずれかを持つ JSON エンベロープを返します。

- `ok` → 正常に完了
- `needs_approval` → 一時停止中。再開には `requiresApproval.resumeToken` が必要
- `cancelled` → 明示的に拒否またはキャンセル済み

ツールは `content`（整形済み JSON）と `details`（生オブジェクト）の両方でエンベロープを表面化します。

## 承認

`requiresApproval` が存在する場合は、プロンプトを確認して判断します。

- `approve: true` → 再開し、副作用を続行
- `approve: false` → キャンセルし、ワークフローを終了

カスタムの jq/heredoc 接着コードなしで承認リクエストに JSON プレビューを添付するには、`approve --preview-from-stdin --limit N` を使用します。再開トークンは現在コンパクトです。Lobster はワークフロー再開状態を自身の state dir 配下に保存し、小さなトークンキーを返します。

## OpenProse

OpenProse は Lobster と相性がよく、`/prose` を使って複数エージェントの準備をオーケストレーションし、その後 Lobster パイプラインを実行して決定的な承認を行えます。Prose プログラムが Lobster を必要とする場合は、`tools.subagents.tools` を通じてサブエージェントに `lobster` ツールを許可してください。[OpenProse](/ja-JP/prose) を参照してください。

## 安全性

- **ローカルのインプロセスのみ** - ワークフローは gateway プロセス内で実行されます。Plugin 自体からのネットワーク呼び出しはありません。
- **シークレットなし** - Lobster は OAuth を管理しません。OAuth を扱う OpenClaw ツールを呼び出します。
- **サンドボックス認識** - ツールコンテキストがサンドボックス化されている場合は無効化されます。
- **強化済み** - タイムアウトと出力上限は埋め込みランナーによって強制されます。

## トラブルシューティング

- **`lobster timed out`** → `timeoutMs` を増やすか、長いパイプラインを分割してください。
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` を引き上げるか、出力サイズを減らしてください。
- **`lobster returned invalid JSON`** → パイプラインがツールモードで実行され、JSON のみを出力していることを確認してください。
- **`lobster failed`** → 埋め込みランナーのエラー詳細について gateway ログを確認してください。

## 詳細

- [Plugins](/ja-JP/tools/plugin)
- [Plugin ツールの作成](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ: コミュニティワークフロー

公開例の 1 つとして、「second brain」CLI + Lobster パイプラインがあり、3 つの Markdown vault（個人、パートナー、共有）を管理します。この CLI は統計、inbox リスト、古い項目のスキャン用に JSON を出力します。Lobster はそれらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` のようなワークフローへ連結し、それぞれに承認ゲートを持たせます。AI は利用可能な場合に判断（分類）を処理し、利用できない場合は決定的なルールにフォールバックします。

- スレッド: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- リポジトリ: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連

- [Automation & Tasks](/ja-JP/automation) - Lobster ワークフローのスケジューリング
- [Automation 概要](/ja-JP/automation) - すべての自動化メカニズム
- [Tools 概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
