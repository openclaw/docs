---
read_when:
- You want agents to turn corrections or reusable procedures into workspace skills
- 手続き型 skill memory を設定しています
- "`skill_workshop` ツールの動作をデバッグしています"
- 自動 skill 作成を有効にするかどうかを判断しています
summary: 再利用可能な手順をワークスペース Skills として取り込み、レビュー、承認、隔離、ホットスキル更新を行う実験的機能
title: Skill workshop Plugin
x-i18n:
  generated_at: '2026-04-24T05:13:16Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: e6063843bf15e639d7f5943db1bab52fbffce6ec30af350221d8b3cd711e227b
  source_path: plugins/skill-workshop.md
  workflow: 15
---

Skill Workshop は **実験的機能** です。デフォルトで無効であり、その取り込み
ヒューリスティクスと reviewer prompt はリリースごとに変わる可能性があります。自動書き込みは、
まず pending-mode の出力を確認したうえで、信頼できる workspace でのみ使ってください。

Skill Workshop は、workspace Skills のための手続き型 memory です。これにより、エージェントは
再利用可能な workflow、ユーザー修正、苦労して得た修正、繰り返し起こる落とし穴を、
次の場所の `SKILL.md` file に変換できます。

```text
<workspace>/skills/<skill-name>/SKILL.md
```

これは長期 memory とは異なります。

- **Memory** は、事実、好み、entity、過去のコンテキストを保存する。
- **Skills** は、エージェントが今後のタスクで従うべき再利用可能な手順を保存する。
- **Skill Workshop** は、有用なターンを永続的な workspace
  skill に変える橋渡しであり、安全確認と任意の承認を備える。

Skill Workshop は、エージェントが次のような手順を学習したときに有用です。

- 外部ソースの animated GIF asset をどう検証するか
- screenshot asset をどう置き換え、寸法を確認するか
- repo 固有の QA シナリオをどう実行するか
- 繰り返し発生する provider 障害をどうデバッグするか
- 古くなったローカル workflow note をどう修復するか

これは次の用途を意図していません。

- 「ユーザーは青が好き」のような事実
- 広範な自伝的 memory
- 生のトランスクリプト保存
- シークレット、認証情報、または隠し prompt text
- 繰り返されない一度きりの指示

## デフォルト状態

バンドル済み Plugin は **実験的** であり、`plugins.entries.skill-workshop` で
明示的に有効化されない限り **デフォルトで無効** です。

Plugin manifest は `enabledByDefault: true` を設定していません。Plugin config schema 内の
`enabled: true` デフォルトは、その Plugin エントリーがすでに選択・ロードされた後にのみ適用されます。

実験的であることの意味:

- この Plugin はオプトインのテストと dogfooding には十分サポートされている
- proposal ストレージ、reviewer しきい値、capture ヒューリスティクスは進化し得る
- 推奨される開始モードは pending approval
- auto apply は、共有環境や hostile な入力が多い環境ではなく、信頼できる個人/workspace 構成向け

## 有効化

最小限で安全な config:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

この config では:

- `skill_workshop` ツールが利用可能になる
- 明示的な再利用可能修正が pending proposal としてキューされる
- しきい値ベースの reviewer pass が skill 更新を提案できる
- pending proposal が適用されるまで skill file は書き込まれない

自動書き込みは信頼済み workspace でのみ使用してください。

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` でも同じ scanner と quarantine 経路を使います。
critical な finding がある proposal は適用しません。

## 設定

| Key | Default | Range / values | Meaning |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin エントリーがロードされた後に Plugin を有効化します。 |
| `autoCapture`        | `true`      | boolean                                     | 成功したエージェントターン後の capture/review を有効化します。 |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | proposal をキューするか、安全な proposal を自動書き込みします。 |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 明示的修正 capture、LLM reviewer、両方、またはどちらも使わないかを選びます。 |
| `reviewInterval`     | `15`        | `1..200`                                    | この回数の成功ターンごとに reviewer を実行します。 |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 観測されたツール呼び出しがこの回数に達したら reviewer を実行します。 |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 埋め込み reviewer 実行のタイムアウト。 |
| `maxPending`         | `50`        | `1..200`                                    | workspace ごとに保持する pending/quarantined proposal の最大数。 |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 生成される skill/support file の最大サイズ。 |

推奨プロファイル:

```json5
// 保守的: 明示的なツール使用のみ、自動 capture なし。
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: 自動で capture するが、承認が必要。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: 安全な proposal を即時書き込む。
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: reviewer LLM 呼び出しなし、明示的修正フレーズのみ。
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## capture 経路

Skill Workshop には 3 つの capture 経路があります。

### ツール提案

再利用可能な手順を見つけたときや、ユーザーが skill の保存/更新を求めたときに、
モデルは `skill_workshop` を直接呼び出せます。

これは最も明示的な経路であり、`autoCapture: false` でも動作します。

### ヒューリスティック capture

`autoCapture` が有効で、`reviewMode` が `heuristic` または `hybrid` の場合、
Plugin は成功ターンをスキャンして、明示的なユーザー修正フレーズを探します。

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

このヒューリスティックは、最後に一致したユーザー指示から proposal を作成します。一般的な workflow では、
トピックヒントを使って skill 名を選びます。

- animated GIF タスク -> `animated-gif-workflow`
- screenshot または asset タスク -> `screenshot-asset-workflow`
- QA または scenario タスク -> `qa-scenario-workflow`
- GitHub PR タスク -> `github-pr-workflow`
- fallback -> `learned-workflows`

ヒューリスティック capture は意図的に狭くしています。これは一般的なトランスクリプト要約ではなく、
明確な修正と再利用可能なプロセスノートのためのものです。

### LLM reviewer

`autoCapture` が有効で、`reviewMode` が `llm` または `hybrid` の場合、Plugin
はしきい値到達後にコンパクトな埋め込み reviewer を実行します。

reviewer が受け取るもの:

- 最近のトランスクリプト text（最後の 12,000 文字までに制限）
- 最大 12 個の既存 workspace Skills
- 各既存 skill から最大 2,000 文字
- JSON-only 指示

reviewer にはツールがありません。

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

reviewer は `{ "action": "none" }` または 1 件の proposal を返します。`action` フィールドは `create`, `append`, `replace` のいずれかです。関連する既存 skill がある場合は `append`/`replace` を優先し、適合する既存 skill がない場合にのみ `create` を使ってください。

`create` の例:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` は `section` + `body` を追加します。`replace` は、指定された skill 内で `oldText` を `newText` に置き換えます。

## proposal ライフサイクル

生成された各更新は、次を持つ proposal になります。

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 任意の `agentId`
- 任意の `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`, `agent_end`, または `reviewer`
- `status`
- `change`
- 任意の `scanFindings`
- 任意の `quarantineReason`

proposal の status:

- `pending` - 承認待ち
- `applied` - `<workspace>/skills` に書き込み済み
- `rejected` - operator/model によって拒否済み
- `quarantined` - critical scanner finding によりブロック済み

状態は Gateway state ディレクトリ配下に、workspace ごとに保存されます。

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

pending と quarantined の proposal は、skill 名と change
payload によって重複排除されます。ストアは、最新の pending/quarantined proposal を
`maxPending` まで保持します。

## ツールリファレンス

この Plugin は 1 つのエージェントツールを登録します。

```text
skill_workshop
```

### `status`

アクティブ workspace の proposal 数を状態ごとに数えます。

```json
{ "action": "status" }
```

結果の形式:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

pending proposal を一覧表示します。

```json
{ "action": "list_pending" }
```

別の status を一覧表示するには:

```json
{ "action": "list_pending", "status": "applied" }
```

有効な `status` 値:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

quarantined proposal を一覧表示します。

```json
{ "action": "list_quarantine" }
```

自動 capture が何もしていないように見え、ログに
`skill-workshop: quarantined <skill>` が出ている場合は、これを使ってください。

### `inspect`

id で proposal を取得します。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

proposal を作成します。`approvalPolicy: "pending"`（デフォルト）では、これは書き込みではなくキューされます。

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="安全な書き込みを強制する（apply: true）">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="auto policy 下で pending を強制する（apply: false）">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="名前付き section に追記する">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="完全一致テキストを置き換える">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

pending proposal を適用します。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` は quarantined proposal を拒否します。

```text
quarantined proposal cannot be applied
```

### `reject`

proposal を rejected としてマークします。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

既存または提案中の skill ディレクトリ内に supporting file を書き込みます。

許可されるトップレベル support ディレクトリ:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

例:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

supporting file は workspace スコープで、パス検証され、
`maxSkillBytes` によるバイト制限があり、スキャンされ、atomic に書き込まれます。

## skill 書き込み

Skill Workshop は次の場所にのみ書き込みます。

```text
<workspace>/skills/<normalized-skill-name>/
```

skill 名は正規化されます。

- 小文字化される
- `[a-z0-9_-]` 以外の連続は `-` になる
- 先頭/末尾の非英数字は削除される
- 最大長は 80 文字
- 最終名は `[a-z0-9][a-z0-9_-]{1,79}` に一致しなければならない

`create` の場合:

- skill が存在しなければ、新しい `SKILL.md` を書き込む
- すでに存在する場合は、body を `## Workflow` に追記する

`append` の場合:

- skill が存在すれば、要求された section に追記する
- 存在しなければ、最小限の skill を作成してから追記する

`replace` の場合:

- skill はすでに存在していなければならない
- `oldText` は完全一致で存在していなければならない
- 最初の完全一致のみが置き換えられる

すべての書き込みは atomic で、インメモリ skills snapshot を即座に更新するため、
新しいまたは更新された skill は Gateway 再起動なしで可視になる場合があります。

## 安全モデル

Skill Workshop には、生成された `SKILL.md` 内容と support
file に対する安全 scanner があります。

critical finding は proposal を quarantine します。

| Rule id | 次のような内容をブロックする... |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | prior/higher instructions を無視するようエージェントに指示する |
| `prompt-injection-system`              | system prompt、developer message、または hidden instruction に言及する |
| `prompt-injection-tool`                | tool permission/approval の回避を促す |
| `shell-pipe-to-shell`                  | `curl`/`wget` を `sh`, `bash`, `zsh` に pipe したものを含む |
| `secret-exfiltration`                  | env/process env データをネットワーク越しに送信しているように見える |

warn finding は保持されますが、それ単独ではブロックしません。

| Rule id | 次に対して警告する... |
| -------------------- | -------------------------------- |
| `destructive-delete` | 広範な `rm -rf` 形式コマンド |
| `unsafe-permissions` | `chmod 777` 形式の権限使用 |

quarantined proposal:

- `scanFindings` を保持する
- `quarantineReason` を保持する
- `list_quarantine` に表示される
- `apply` 経由では適用できない

quarantined proposal から回復するには、
危険な内容を除去した新しい安全な proposal を作成してください。
ストア JSON を手で編集しないでください。

## prompt ガイダンス

有効な場合、Skill Workshop は短い prompt section を注入し、永続的な手続き型 memory のために
`skill_workshop` を使うようエージェントに伝えます。

このガイダンスが強調するもの:

- 事実/好みではなく手順
- ユーザー修正
- 明白ではない成功手順
- 繰り返し起こる落とし穴
- append/replace による古い/薄い/誤った skill の修復
- 長いツールループや難しい修正の後に再利用可能手順を保存すること
- 短い命令形の skill text
- トランスクリプト dump をしないこと

書き込みモードの文言は `approvalPolicy` に応じて変わります。

- pending mode: 提案をキューし、明示的な承認後にのみ適用する
- auto mode: 明確に再利用可能な場合に安全な workspace-skill 更新を適用する

## コストとランタイム挙動

ヒューリスティック capture はモデルを呼び出しません。

LLM review は、アクティブ/デフォルト agent model 上で埋め込み実行を使います。
しきい値ベースであるため、デフォルトでは毎ターン実行されません。

reviewer は:

- 利用可能な場合、同じ設定済み provider/model context を使用する
- runtime agent デフォルトにフォールバックする
- `reviewTimeoutMs` を持つ
- 軽量な bootstrap context を使用する
- ツールを持たない
- 直接は何も書き込まない
- 通常の scanner と
  approval/quarantine 経路を通る proposal しか出力できない

reviewer が失敗、タイムアウト、または不正な JSON を返した場合、Plugin は
警告/debug メッセージをログに出し、その review pass をスキップします。

## 運用パターン

ユーザーが次のように言うときに Skill Workshop を使ってください。

- “next time, do X”
- “from now on, prefer Y”
- “make sure to verify Z”
- “save this as a workflow”
- “this took a while; remember the process”
- “update the local skill for this”

良い skill text:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

悪い skill text:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

悪い例を保存すべきでない理由:

- transcript 形になっている
- 命令形ではない
- ノイズとなる一度きりの詳細を含んでいる
- 次のエージェントに何をすべきかを伝えていない

## デバッグ

Plugin がロードされているか確認する:

```bash
openclaw plugins list --enabled
```

agent/tool context から proposal 数を確認する:

```json
{ "action": "status" }
```

pending proposal を確認する:

```json
{ "action": "list_pending" }
```

quarantined proposal を確認する:

```json
{ "action": "list_quarantine" }
```

よくある症状:

| Symptom | Likely cause | Check |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tool が利用できない | Plugin エントリーが有効でない | `plugins.entries.skill-workshop.enabled` と `openclaw plugins list` |
| 自動 proposal が現れない | `autoCapture: false`, `reviewMode: "off"`, またはしきい値未達 | config, proposal status, Gateway logs |
| ヒューリスティックが capture しなかった | ユーザー文言が修正パターンに一致しなかった | 明示的な `skill_workshop.suggest` を使うか LLM reviewer を有効化 |
| reviewer が proposal を作成しなかった | reviewer が `none`、不正 JSON、またはタイムアウトを返した | Gateway logs, `reviewTimeoutMs`, しきい値 |
| proposal が適用されない | `approvalPolicy: "pending"` | `list_pending`, その後 `apply` |
| proposal が pending から消えた | 重複 proposal の再利用、max pending による削除、または applied/rejected/quarantined 済み | `status`, status filter 付き `list_pending`, `list_quarantine` |
| skill file は存在するが model が見逃す | skill snapshot 未更新、または skill gating がそれを除外している | `openclaw skills` status と workspace skill eligibility |

関連ログ:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA シナリオ

repo ベース QA シナリオ:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

決定論的カバレッジを実行する:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

reviewer カバレッジを実行する:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

reviewer シナリオは意図的に分離されています。これは
`reviewMode: "llm"` を有効にし、埋め込み reviewer pass を検証するためです。

## auto apply を有効にしないほうがよい場合

次の場合は `approvalPolicy: "auto"` を避けてください。

- workspace に機密性の高い手順が含まれる
- エージェントが信頼できない入力を処理している
- skills が広いチームで共有されている
- まだ prompt や scanner rule を調整中である
- モデルが hostile な web/email content を頻繁に扱う

まずは pending mode を使ってください。その workspace でエージェントが提案する
skills の種類を確認してから、auto mode に切り替えてください。

## 関連ドキュメント

- [Skills](/ja-JP/tools/skills)
- [Plugins](/ja-JP/tools/plugin)
- [Testing](/ja-JP/reference/test)
