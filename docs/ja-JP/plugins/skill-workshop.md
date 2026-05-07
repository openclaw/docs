---
read_when:
    - エージェントに、修正内容や再利用可能な手順をワークスペースのSkillsに変換させたい
    - 手続き型スキルメモリを設定しています
    - skill_workshop ツールの挙動をデバッグしています
    - Skills の自動作成を有効にするかどうかを決定しています
summary: レビュー、承認、隔離、ホットな Skills 更新を備えた、再利用可能な手順のワークスペース Skills としての実験的な取り込み
title: スキルワークショップ Plugin
x-i18n:
    generated_at: "2026-05-07T13:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop は**実験的**です。デフォルトでは無効であり、キャプチャの
ヒューリスティックとレビュー担当プロンプトはリリース間で変わる可能性があります。また、自動
書き込みは、先に pending モードの出力を確認したうえで、信頼済みワークスペースでのみ使用してください。

Skill Workshop はワークスペース Skills のための手続き的メモリです。これにより、エージェントは
再利用可能なワークフロー、ユーザーからの修正、苦労して得た修正、繰り返し発生する落とし穴を
次の場所の `SKILL.md` ファイルに変換できます。

```text
<workspace>/skills/<skill-name>/SKILL.md
```

これは長期メモリとは異なります。

- **Memory** は事実、設定、エンティティ、過去のコンテキストを保存します。
- **Skills** は、エージェントが将来のタスクで従うべき再利用可能な手順を保存します。
- **Skill Workshop** は、有用なターンを安全チェックと任意の承認付きで、永続的なワークスペース
  Skill へつなぐ橋渡しです。

Skill Workshop は、エージェントが次のような手順を学習したときに役立ちます。

- 外部由来のアニメーション GIF アセットを検証する方法
- スクリーンショットアセットを置き換え、寸法を検証する方法
- リポジトリ固有の QA シナリオを実行する方法
- 繰り返し発生するプロバイダー障害をデバッグする方法
- 古くなったローカルワークフローのメモを修復する方法

これは次の用途を意図していません。

- 「ユーザーは青が好き」のような事実
- 広範な自伝的メモリ
- 生のトランスクリプトのアーカイブ
- シークレット、認証情報、または隠しプロンプトテキスト
- 繰り返されない一回限りの指示

## デフォルト状態

同梱 Plugin は**実験的**であり、`plugins.entries.skill-workshop` で
明示的に有効化されない限り、**デフォルトでは無効**です。

Plugin マニフェストは `enabledByDefault: true` を設定していません。Plugin 設定スキーマ内の
`enabled: true` のデフォルトは、Plugin エントリがすでに選択されロードされた後にのみ適用されます。

実験的とは、次を意味します。

- Plugin はオプトインテストとドッグフーディングに十分な範囲でサポートされています
- 提案の保存、レビュー担当のしきい値、キャプチャのヒューリスティックは進化する可能性があります
- pending 承認が推奨される開始モードです
- auto apply は信頼済みの個人/ワークスペース設定向けであり、共有環境や敵対的な入力が多い
  環境向けではありません

## 有効化

最小限の安全な設定:

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

この設定では:

- `skill_workshop` ツールが利用可能になります
- 明示的な再利用可能修正が pending 提案としてキューに入ります
- しきい値ベースのレビュー担当パスが Skill 更新を提案できます
- pending 提案が適用されるまで、Skill ファイルは書き込まれません

自動書き込みは信頼済みワークスペースでのみ使用してください。

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

`approvalPolicy: "auto"` は、同じスキャナーと隔離パスを引き続き使用します。
重大な検出結果がある提案は適用しません。

## 設定

| キー                 | デフォルト  | 範囲 / 値                                   | 意味                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin エントリがロードされた後に Plugin を有効化します。            |
| `autoCapture`        | `true`      | boolean                                     | 成功したエージェントターン後のキャプチャ/レビューを有効化します。    |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 提案をキューに入れるか、安全な提案を自動的に書き込みます。           |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 明示的な修正キャプチャ、LLM レビュー担当、その両方、またはどちらも使わないかを選択します。 |
| `reviewInterval`     | `15`        | `1..200`                                    | この数の成功ターン後にレビュー担当を実行します。                     |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | この数の観測済みツール呼び出し後にレビュー担当を実行します。         |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 組み込みレビュー担当実行のタイムアウトです。                         |
| `maxPending`         | `50`        | `1..200`                                    | ワークスペースごとに保持する pending/隔離済み提案の最大数です。      |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 生成される Skill/サポートファイルの最大サイズです。                  |

推奨プロファイル:

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## キャプチャパス

Skill Workshop には 3 つのキャプチャパスがあります。

### ツール提案

モデルは、再利用可能な手順を見つけたとき、またはユーザーが Skill の保存/更新を依頼したときに、
`skill_workshop` を直接呼び出すことができます。

これは最も明示的なパスであり、`autoCapture: false` でも機能します。

### ヒューリスティックキャプチャ

`autoCapture` が有効で、`reviewMode` が `heuristic` または `hybrid` の場合、Plugin は
成功したターンから明示的なユーザー修正フレーズをスキャンします。

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ヒューリスティックは、直近で一致したユーザー指示から提案を作成します。一般的なワークフローの
Skill 名を選ぶために、トピックヒントを使用します。

- アニメーション GIF タスク -> `animated-gif-workflow`
- スクリーンショットまたはアセットタスク -> `screenshot-asset-workflow`
- QA またはシナリオタスク -> `qa-scenario-workflow`
- GitHub PR タスク -> `github-pr-workflow`
- フォールバック -> `learned-workflows`

ヒューリスティックキャプチャは意図的に狭く設計されています。明確な修正と反復可能なプロセス
メモのためのものであり、一般的なトランスクリプト要約のためのものではありません。

### LLM レビュー担当

`autoCapture` が有効で、`reviewMode` が `llm` または `hybrid` の場合、Plugin は
しきい値に達した後にコンパクトな組み込みレビュー担当を実行します。

レビュー担当は次を受け取ります。

- 直近 12,000 文字に制限された最近のトランスクリプトテキスト
- 最大 12 個の既存ワークスペース Skills
- 各既存 Skill から最大 2,000 文字
- JSON のみの指示

レビュー担当にはツールがありません。

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

レビュー担当は `{ "action": "none" }` または 1 つの提案を返します。`action` フィールドは `create`、`append`、または `replace` です。関連する Skill がすでに存在する場合は `append`/`replace` を優先し、適合する既存 Skill がない場合にのみ `create` を使用します。

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

`append` は `section` + `body` を追加します。`replace` は指定された Skill 内の `oldText` を `newText` に置き換えます。

## 提案ライフサイクル

生成されたすべての更新は、次を持つ提案になります。

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- 任意の `agentId`
- 任意の `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`、`agent_end`、または `reviewer`
- `status`
- `change`
- 任意の `scanFindings`
- 任意の `quarantineReason`

提案ステータス:

- `pending` - 承認待ち
- `applied` - `<workspace>/skills` に書き込み済み
- `rejected` - オペレーター/モデルにより拒否済み
- `quarantined` - 重大なスキャナー検出結果によりブロック済み

状態は Gateway の状態ディレクトリの下に、ワークスペースごとに保存されます。

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

保留中および隔離済みの提案は、skill 名と変更ペイロードで重複排除されます。ストアは、最新の保留中/隔離済み提案を `maxPending` まで保持します。

## ツールリファレンス

Plugin は 1 つのエージェントツールを登録します。

```text
skill_workshop
```

### `status`

アクティブなワークスペースについて、状態別に提案数を数えます。

```json
{ "action": "status" }
```

結果の形状:

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

保留中の提案を一覧表示します。

```json
{ "action": "list_pending" }
```

別のステータスを一覧表示するには:

```json
{ "action": "list_pending", "status": "applied" }
```

有効な `status` 値:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

隔離済みの提案を一覧表示します。

```json
{ "action": "list_quarantine" }
```

自動キャプチャが何もしていないように見え、ログに `skill-workshop: quarantined <skill>` と表示される場合に使用します。

### `inspect`

id で提案を取得します。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

提案を作成します。`approvalPolicy: "pending"` (デフォルト) では、書き込まずにキューに入れます。

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
  <Accordion title="auto モードで即時書き込みをリクエストする (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

`approvalPolicy: "pending"` では、`apply: true` でも提案はキューに入ります。レビューしてから、承認後に `apply` アクションを使用します。

  </Accordion>

  <Accordion title="auto ポリシー下で保留を強制する (apply: false)">

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

  <Accordion title="名前付きセクションに追記する">

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

  <Accordion title="完全一致するテキストを置換する">

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

保留中の提案を適用します。

`approvalPolicy: "pending"` では、このアクションはワークスペース skill に書き込む前にオペレーターの承認を求めます。

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` は隔離済みの提案を拒否します。

```text
quarantined proposal cannot be applied
```

### `reject`

提案を却下済みにマークします。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

既存または提案中の skill ディレクトリ内にサポートファイルを書き込みます。

許可されるトップレベルのサポートディレクトリ:

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

サポートファイルはワークスペーススコープで、パスが検査され、
`maxSkillBytes` によってバイト制限され、スキャンされ、アトミックに書き込まれます。

## スキルの書き込み

Skill Workshop は次の配下にのみ書き込みます。

```text
<workspace>/skills/<normalized-skill-name>/
```

スキル名は正規化されます。

- 小文字化される
- 非 `[a-z0-9_-]` の連続は `-` になる
- 先頭および末尾の英数字以外は削除される
- 最大長は 80 文字
- 最終的な名前は `[a-z0-9][a-z0-9_-]{1,79}` に一致する必要がある

`create` の場合:

- スキルが存在しない場合、Skill Workshop は新しい `SKILL.md` を書き込む
- すでに存在する場合、Skill Workshop は本文を `## Workflow` に追記する

`append` の場合:

- スキルが存在する場合、Skill Workshop は要求されたセクションに追記する
- 存在しない場合、Skill Workshop は最小限のスキルを作成してから追記する

`replace` の場合:

- スキルはすでに存在している必要がある
- `oldText` が完全に存在している必要がある
- 最初の完全一致のみが置換される

すべての書き込みはアトミックで、メモリ内のスキルスナップショットを即座に更新するため、
新規または更新されたスキルは Gateway の再起動なしで表示可能になります。

## 安全モデル

Skill Workshop には、生成された `SKILL.md` コンテンツとサポートファイルに対する安全スキャナーがあります。

重大な検出結果は提案を隔離します。

| ルール ID                               | ブロックする内容...                                                   |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | 以前または上位の指示を無視するようエージェントに指示するもの          |
| `prompt-injection-system`              | システムプロンプト、開発者メッセージ、または隠れた指示に言及するもの  |
| `prompt-injection-tool`                | ツール権限や承認の回避を促すもの                                      |
| `shell-pipe-to-shell`                  | `curl`/`wget` を `sh`、`bash`、または `zsh` にパイプするもの           |
| `secret-exfiltration`                  | env/プロセス env データをネットワーク経由で送信しているように見えるもの |

警告の検出結果は保持されますが、それだけではブロックしません。

| ルール ID            | 警告対象...                    |
| -------------------- | ------------------------------ |
| `destructive-delete` | 広範な `rm -rf` 形式のコマンド |
| `unsafe-permissions` | `chmod 777` 形式の権限使用     |

隔離された提案:

- `scanFindings` を保持する
- `quarantineReason` を保持する
- `list_quarantine` に表示される
- `apply` では適用できない

隔離された提案から回復するには、安全でないコンテンツを削除した新しい安全な提案を作成します。
ストア JSON を手作業で編集しないでください。

## プロンプトガイダンス

有効な場合、Skill Workshop は、永続的な手順記憶に `skill_workshop` を使用するようエージェントに伝える短いプロンプトセクションを注入します。

ガイダンスでは次を強調します。

- 事実や好みではなく手順
- ユーザーによる修正
- 自明でない成功した手順
- 繰り返し発生する落とし穴
- 追記/置換による古い、薄い、誤ったスキルの修復
- 長いツールループや難しい修正の後に再利用可能な手順を保存すること
- 短い命令形のスキルテキスト
- transcript の丸ごと保存をしないこと

書き込みモードのテキストは `approvalPolicy` によって変わります。

- pending モード: 提案をキューに入れ、明示的な承認後に `apply` を使用する
- auto モード: `apply: false` で代わりにキューに入れる場合を除き、安全なワークスペーススキル更新を適用する

## コストとランタイム動作

ヒューリスティックキャプチャはモデルを呼び出しません。

LLM レビューは、アクティブ/デフォルトエージェントモデルで埋め込み実行を使用します。
しきい値ベースのため、デフォルトではすべてのターンで実行されません。

レビュアーは次を行います。

- 利用可能な場合、同じ構成済みプロバイダー/モデルコンテキストを使用する
- ランタイムエージェントのデフォルトにフォールバックする
- `reviewTimeoutMs` を持つ
- 軽量なブートストラップコンテキストを使用する
- ツールを持たない
- 直接は何も書き込まない
- 通常のスキャナーと承認/隔離パスを通る提案のみを出力できる

レビュアーが失敗する、タイムアウトする、または無効な JSON を返す場合、Plugin は
警告/デバッグメッセージをログに記録し、そのレビューパスをスキップします。

## 運用パターン

ユーザーが次のように言った場合は Skill Workshop を使用します。

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

よいスキルテキスト:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

悪いスキルテキスト:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

悪い版を保存すべきでない理由:

- transcript 形式になっている
- 命令形ではない
- ノイズの多い一回限りの詳細を含む
- 次のエージェントに何をすべきか伝えていない

## デバッグ

Plugin が読み込まれているか確認します。

```bash
openclaw plugins list --enabled
```

エージェント/ツールコンテキストから提案数を確認します。

```json
{ "action": "status" }
```

保留中の提案を確認します。

```json
{ "action": "list_pending" }
```

隔離された提案を確認します。

```json
{ "action": "list_quarantine" }
```

一般的な症状:

| 症状                                  | 可能性の高い原因                                                                    | 確認                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ツールが利用できない                  | Plugin エントリが有効になっていない                                                 | `plugins.entries.skill-workshop.enabled` と `openclaw plugins list` |
| 自動提案が表示されない                | `autoCapture: false`、`reviewMode: "off"`、またはしきい値未達                       | 設定、提案ステータス、Gateway ログ                                   |
| ヒューリスティックがキャプチャしない  | ユーザーの表現が修正パターンに一致しなかった                                        | 明示的な `skill_workshop.suggest` を使用するか、LLM レビュアーを有効にする |
| レビュアーが提案を作成しなかった      | レビュアーが `none`、無効な JSON、またはタイムアウトを返した                        | Gateway ログ、`reviewTimeoutMs`、しきい値                            |
| 提案が適用されない                    | `approvalPolicy: "pending"`                                                         | `list_pending`、その後 `apply`                                       |
| 提案が保留中から消えた                | 重複提案の再利用、最大保留数による枝刈り、または適用/拒否/隔離済み                 | `status`、ステータスフィルター付きの `list_pending`、`list_quarantine` |
| スキルファイルは存在するがモデルが見逃す | スキルスナップショットが更新されていない、またはスキルゲーティングで除外されている | `openclaw skills` ステータスとワークスペーススキルの適格性          |

関連ログ:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## QA シナリオ

リポジトリに基づく QA シナリオ:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

決定論的カバレッジを実行します。

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

レビュアーカバレッジを実行します。

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

レビュアーシナリオは意図的に分離されています。これは
`reviewMode: "llm"` を有効にし、埋め込みレビュアーパスを実行するためです。

## auto apply を有効にしない場合

次の場合は `approvalPolicy: "auto"` を避けてください。

- ワークスペースに機微な手順が含まれている
- エージェントが信頼できない入力に取り組んでいる
- スキルが広範なチームで共有されている
- プロンプトやスキャナールールをまだ調整中である
- モデルが悪意のある Web/メールコンテンツを頻繁に扱う

まず pending モードを使用してください。auto モードに切り替えるのは、そのワークスペースで
エージェントが提案するスキルの種類を確認してからにしてください。

## 関連ドキュメント

- [Skills](/ja-JP/tools/skills)
- [Plugins](/ja-JP/tools/plugin)
- [テスト](/ja-JP/reference/test)
