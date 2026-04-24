---
read_when:
    - 明示的な承認を備えた決定論的な multi-step workflow が必要な場合
    - 以前のステップを再実行せずに workflow を再開する必要がある場合
summary: 再開可能な承認ゲートを備えた OpenClaw 向け型付き workflow runtime。
title: Lobster
x-i18n:
    generated_at: "2026-04-24T05:25:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster は workflow shell で、OpenClaw が multi-step のツールシーケンスを、明示的な承認チェックポイント付きの単一の決定論的操作として実行できるようにします。

Lobster は、detached background work の 1 つ上の authoring layer です。個別タスクより上のフローオーケストレーションについては、[Task Flow](/ja-JP/automation/taskflow)（`openclaw tasks flow`）を参照してください。タスクアクティビティ ledger については [`openclaw tasks`](/ja-JP/automation/tasks) を参照してください。

## Hook

あなたのアシスタントは、自分自身を管理するツールを構築できます。workflow を頼めば、30 分後には 1 回の呼び出しで動く CLI とパイプラインが手に入ります。Lobster はその欠けていたピースです: 決定論的なパイプライン、明示的な承認、そして再開可能な state。

## なぜ必要か

現在、複雑な workflow には多くの往復ツール呼び出しが必要です。各呼び出しは token を消費し、LLM はすべてのステップをオーケストレーションしなければなりません。Lobster はそのオーケストレーションを型付き runtime に移します:

- **多くの呼び出しの代わりに 1 回**: OpenClaw は 1 回の Lobster ツール呼び出しを実行し、構造化結果を受け取ります。
- **承認を内蔵**: 副作用（メール送信、コメント投稿など）は、明示的に承認されるまで workflow を停止します。
- **再開可能**: 停止した workflow は token を返します。すべてを再実行せずに、承認して再開できます。

## なぜ通常のプログラムではなく DSL なのか

Lobster は意図的に小さく作られています。目標は「新しい言語」ではなく、AI に扱いやすい予測可能なパイプライン仕様であり、承認と resume token を第一級で扱うことです。

- **approve / resume が組み込み**: 通常のプログラムでも人間に確認はできますが、自分でその runtime を発明しない限り、永続的 token で _停止して再開する_ ことはできません。
- **決定性 + 監査容易性**: パイプラインはデータなので、ログ、diff、replay、review が容易です。
- **AI 向けの制約された surface**: 小さな grammar + JSON pipe により「創造的な」コードパスを減らし、現実的な検証が可能になります。
- **安全性ポリシーを内蔵**: timeout、出力上限、sandbox check、allowlist は各スクリプトではなく runtime が強制します。
- **それでもプログラム可能**: 各ステップは任意の CLI や script を呼び出せます。JS / TS を使いたいなら、コードから `.lobster` ファイルを生成してください。

## 仕組み

OpenClaw は Lobster workflow を、埋め込み runner を使って **in-process** で実行します。外部 CLI subprocess は起動されません。workflow engine は gateway process 内で実行され、JSON envelope を直接返します。
パイプラインが承認待ちで停止した場合、ツールは後で続行できるよう `resumeToken` を返します。

## パターン: 小さな CLI + JSON pipe + 承認

JSON を話す小さなコマンドを作り、それらを単一の Lobster 呼び出しに連結します。（以下のコマンド名は例です。自分のものに置き換えてください。）

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

パイプラインが承認を要求した場合は、token で再開します:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI が workflow を起動し、Lobster がステップを実行します。承認ゲートによって、副作用は明示的かつ監査可能に保たれます。

例: 入力項目をツール呼び出しへマップする:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## JSON 専用 LLM ステップ（llm-task）

workflow で **構造化された LLM ステップ** が必要な場合は、省略可能な
`llm-task` Plugin ツールを有効にし、Lobster から呼び出してください。これにより workflow の
決定性を保ちながら、モデルによる分類 / 要約 / 下書きが可能になります。

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
        "tools": { "allow": ["llm-task"] }
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

詳細と設定オプションは [LLM Task](/ja-JP/tools/llm-task) を参照してください。

## workflow ファイル（.lobster）

Lobster は `name`、`args`、`steps`、`env`、`condition`、`approval` フィールドを持つ YAML / JSON workflow ファイルを実行できます。OpenClaw のツール呼び出しでは、`pipeline` にファイルパスを設定します。

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

- `stdin: $step.stdout` と `stdin: $step.json` は、前のステップの出力を渡します。
- `condition`（または `when`）で `$step.approved` に基づいてステップを制御できます。

## Lobster をインストールする

バンドル済み Lobster workflow は in-process で実行されるため、別個の `lobster` バイナリは不要です。埋め込み runner は Lobster Plugin に同梱されています。

開発用または外部パイプライン用に standalone Lobster CLI が必要な場合は、[Lobster repo](https://github.com/openclaw/lobster) からインストールし、`lobster` が `PATH` 上にあることを確認してください。

## ツールを有効にする

Lobster は **省略可能な** Plugin ツールです（デフォルトでは有効ではありません）。

推奨（加算的で安全）:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

または agent ごと:

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

制限的な allowlist mode で動かす意図がない限り、`tools.allow: ["lobster"]` の使用は避けてください。

注記: allowlist は省略可能 Plugin に対して opt-in です。allowlist に
`lobster` のような Plugin ツールしか含まれていない場合、
OpenClaw は core ツールを有効のままにします。core
ツールを制限したい場合は、許可したい core ツールまたは group も allowlist に含めてください。

## 例: Email triage

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

返される JSON envelope（省略）:

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

1 つの workflow。決定論的。安全。

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

args 付きで workflow ファイルを実行する:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

承認後に停止した workflow を続行します。

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### 省略可能な入力

- `cwd`: パイプライン用の相対 working directory（gateway working directory 内に収まる必要があります）。
- `timeoutMs`: この時間を超えたら workflow を中止します（デフォルト: 20000）。
- `maxStdoutBytes`: 出力がこのサイズを超えたら workflow を中止します（デフォルト: 512000）。
- `argsJson`: `lobster run --args-json` に渡す JSON 文字列（workflow ファイルのみ）。

## 出力 envelope

Lobster は、次の 3 つの status のいずれかを持つ JSON envelope を返します:

- `ok` → 正常終了
- `needs_approval` → 一時停止中。再開には `requiresApproval.resumeToken` が必要
- `cancelled` → 明示的に拒否またはキャンセルされた

このツールは、envelope を `content`（整形 JSON）と `details`（生オブジェクト）の両方に出します。

## 承認

`requiresApproval` が存在する場合は、prompt を確認して次を判断してください:

- `approve: true` → 再開して副作用を続行する
- `approve: false` → workflow をキャンセルして終了する

`approve --preview-from-stdin --limit N` を使うと、カスタムな jq / heredoc の糊付けなしで JSON preview を承認リクエストに添付できます。resume token は現在コンパクトです。Lobster は workflow の再開 state を state dir 配下に保存し、小さな token key を返します。

## OpenProse

OpenProse は Lobster と相性が良く、`/prose` で multi-agent 準備をオーケストレーションし、その後 Lobster パイプラインを実行して決定論的な承認を行えます。Prose program が Lobster を必要とする場合は、`tools.subagents.tools` を通して sub-agent に `lobster` ツールを許可してください。詳細は [OpenProse](/ja-JP/prose) を参照してください。

## 安全性

- **ローカル in-process のみ** — workflow は gateway process 内で実行され、Plugin 自体からネットワーク呼び出しは行いません。
- **シークレットなし** — Lobster は OAuth を管理しません。代わりに、それを管理する OpenClaw ツールを呼び出します。
- **sandbox 対応** — ツールコンテキストが sandbox 化されている場合は無効化されます。
- **強化済み** — timeout と出力上限は埋め込み runner が強制します。

## トラブルシューティング

- **`lobster timed out`** → `timeoutMs` を増やすか、長いパイプラインを分割してください。
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` を増やすか、出力サイズを減らしてください。
- **`lobster returned invalid JSON`** → パイプラインがツールモードで実行され、JSON だけを出力することを確認してください。
- **`lobster failed`** → 埋め込み runner のエラー詳細を gateway ログで確認してください。

## さらに学ぶ

- [Plugins](/ja-JP/tools/plugin)
- [Plugin tool authoring](/ja-JP/plugins/building-plugins#registering-agent-tools)

## ケーススタディ: コミュニティ workflow

公開例の 1 つとして、「second brain」CLI + Lobster パイプラインで 3 つの Markdown vault（個人、パートナー、共有）を管理するものがあります。この CLI は stats、inbox 一覧、stale scan 向けに JSON を出力し、Lobster はそれらのコマンドを `weekly-review`、`inbox-triage`、`memory-consolidation`、`shared-task-sync` のような workflow に連結します。各 workflow には承認ゲートがあります。AI は利用可能な場合に判断（分類）を担当し、利用できない場合は決定論的ルールに fallback します。

- Thread: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## 関連

- [Automation & Tasks](/ja-JP/automation) — Lobster workflow のスケジューリング
- [Automation Overview](/ja-JP/automation) — すべての自動化メカニズム
- [Tools Overview](/ja-JP/tools) — 利用可能なすべての agent ツール
