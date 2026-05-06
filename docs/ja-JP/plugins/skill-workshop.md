---
read_when:
    - エージェントに、修正や再利用可能な手順をワークスペースのSkillsに変換させたい
    - 手続き型スキルメモリを設定しています
    - skill_workshop ツールの動作をデバッグしています
    - 自動スキル作成を有効にするかどうかを判断しています
summary: レビュー、承認、隔離、Skill のホット更新を備えた、再利用可能な手順のワークスペース Skills としての実験的キャプチャ
title: スキルワークショップ Plugin
x-i18n:
    generated_at: "2026-05-06T05:15:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop は**実験的**です。デフォルトでは無効であり、キャプチャの
ヒューリスティックとレビュー担当プロンプトはリリース間で変更される可能性があります。また、自動
書き込みは、まず pending モードの出力を確認した後、信頼できるワークスペースでのみ使用してください。

Skill Workshop はワークスペース Skills の手続き的記憶です。これにより、エージェントは
再利用可能なワークフロー、ユーザーによる修正、苦労して得た修正、繰り返し発生する落とし穴を
次の場所にある `SKILL.md` ファイルへ変換できます。

```text
<workspace>/skills/<skill-name>/SKILL.md
```

これは長期記憶とは異なります。

- **Memory** は事実、設定、エンティティ、過去のコンテキストを保存します。
- **Skills** は、今後のタスクでエージェントが従うべき再利用可能な手順を保存します。
- **Skill Workshop** は、有用なターンから、安全性チェックと任意の承認を伴う永続的なワークスペース
  skill への橋渡しです。

Skill Workshop は、エージェントが次のような手順を学習した場合に有用です。

- 外部由来のアニメーション GIF アセットを検証する方法
- スクリーンショットアセットを置き換えて寸法を検証する方法
- リポジトリ固有の QA シナリオを実行する方法
- 繰り返し発生するプロバイダー障害をデバッグする方法
- 古くなったローカルワークフローノートを修復する方法

次の用途は意図していません。

- 「ユーザーは青が好き」のような事実
- 広範な自伝的記憶
- 生のトランスクリプトのアーカイブ
- シークレット、認証情報、または隠れたプロンプトテキスト
- 繰り返されない一回限りの指示

## デフォルト状態

バンドルされた Plugin は**実験的**であり、`plugins.entries.skill-workshop` で
明示的に有効化されない限り、**デフォルトでは無効**です。

Plugin マニフェストは `enabledByDefault: true` を設定していません。Plugin 設定スキーマ内の
`enabled: true` デフォルトは、Plugin エントリがすでに選択されロードされた後にのみ適用されます。

実験的とは、次を意味します。

- Plugin はオプトインテストとドッグフーディングに十分な範囲でサポートされます
- 提案の保存、レビュー担当のしきい値、キャプチャのヒューリスティックは進化する可能性があります
- 保留承認が推奨される開始モードです
- auto apply は信頼できる個人/ワークスペース設定向けであり、共有環境や敵対的な
  入力が多い環境向けではありません

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

この設定では、次のようになります。

- `skill_workshop` ツールが利用可能になります
- 明示的な再利用可能な修正が保留中の提案としてキューに入ります
- しきい値ベースのレビュー担当パスが skill 更新を提案できます
- 保留中の提案が適用されるまで、skill ファイルは書き込まれません

自動書き込みは信頼できるワークスペースでのみ使用してください。

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

`approvalPolicy: "auto"` でも同じスキャナーと隔離パスを使用します。重大な検出結果がある提案は
適用されません。

## 設定

| キー                 | デフォルト  | 範囲 / 値                                  | 意味                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin エントリがロードされた後に Plugin を有効化します。            |
| `autoCapture`        | `true`      | boolean                                     | 成功したエージェントターンでターン後のキャプチャ/レビューを有効化します。 |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | 提案をキューに入れるか、安全な提案を自動的に書き込みます。           |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | 明示的な修正キャプチャ、LLM レビュー担当、その両方、またはどちらも使わないかを選択します。 |
| `reviewInterval`     | `15`        | `1..200`                                    | 成功したターンがこの数に達した後、レビュー担当を実行します。         |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | 観測されたツール呼び出しがこの数に達した後、レビュー担当を実行します。 |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | 埋め込みレビュー担当の実行タイムアウトです。                         |
| `maxPending`         | `50`        | `1..200`                                    | ワークスペースごとに保持する保留中/隔離済み提案の最大数です。        |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | 生成される skill/サポートファイルの最大サイズです。                  |

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

モデルは、再利用可能な手順を見つけた場合、またはユーザーが skill の保存/更新を求めた場合に、
`skill_workshop` を直接呼び出せます。

これは最も明示的なパスであり、`autoCapture: false` でも機能します。

### ヒューリスティックキャプチャ

`autoCapture` が有効で、`reviewMode` が `heuristic` または `hybrid` の場合、
Plugin は成功したターンをスキャンし、明示的なユーザー修正フレーズを探します。

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

ヒューリスティックは、最新の一致したユーザー指示から提案を作成します。一般的なワークフローの
skill 名を選ぶためにトピックヒントを使用します。

- アニメーション GIF タスク -> `animated-gif-workflow`
- スクリーンショットまたはアセットタスク -> `screenshot-asset-workflow`
- QA またはシナリオタスク -> `qa-scenario-workflow`
- GitHub PR タスク -> `github-pr-workflow`
- フォールバック -> `learned-workflows`

ヒューリスティックキャプチャは意図的に狭く設計されています。これは明確な修正と
反復可能なプロセスメモのためのものであり、一般的なトランスクリプト要約のためのものではありません。

### LLM レビュー担当

`autoCapture` が有効で、`reviewMode` が `llm` または `hybrid` の場合、Plugin は
しきい値に達した後、コンパクトな埋め込みレビュー担当を実行します。

レビュー担当は次を受け取ります。

- 直近 12,000 文字に制限された最近のトランスクリプトテキスト
- 最大 12 個の既存ワークスペース skills
- 各既存 skill から最大 2,000 文字
- JSON のみの指示

レビュー担当にツールはありません。

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

レビュー担当は `{ "action": "none" }` または 1 つの提案を返します。`action` フィールドは `create`、`append`、または `replace` です。関連する skill がすでに存在する場合は `append`/`replace` を優先し、適合する既存 skill がない場合にのみ `create` を使用します。

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

`append` は `section` + `body` を追加します。`replace` は指定された skill 内の `oldText` を `newText` に置き換えます。

## 提案のライフサイクル

生成されたすべての更新は、次を含む提案になります。

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
- `rejected` - オペレーター/モデルにより却下済み
- `quarantined` - 重大なスキャナー検出によりブロック済み

状態は Gateway 状態ディレクトリのワークスペースごとに保存されます。

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

保留中および隔離中の提案は、Skill 名と変更ペイロードで重複排除されます。ストアは最新の保留中/隔離中の提案を `maxPending` まで保持します。

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

保留中の提案を一覧表示します。

```json
{ "action": "list_pending" }
```

別の状態を一覧表示するには:

```json
{ "action": "list_pending", "status": "applied" }
```

有効な `status` 値:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

隔離中の提案を一覧表示します。

```json
{ "action": "list_quarantine" }
```

自動キャプチャが何もしていないように見え、ログに `skill-workshop: quarantined <skill>` と出る場合に使用します。

### `inspect`

ID で提案を取得します。

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

提案を作成します。`approvalPolicy: "pending"` (デフォルト) では、書き込まずにキューに追加します。

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
  <Accordion title="安全な書き込みを強制する (apply: true)">

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

  <Accordion title="自動ポリシー下で保留を強制する (apply: false)">

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

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` は隔離中の提案を拒否します。

```text
quarantined proposal cannot be applied
```

### `reject`

提案を却下済みとしてマークします。

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

既存または提案中の Skill ディレクトリ内に補助ファイルを書き込みます。

許可されているトップレベルの補助ディレクトリ:

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

サポートファイルはワークスペース単位でスコープされ、パスがチェックされ、`maxSkillBytes` によりバイト制限され、スキャンされ、アトミックに書き込まれます。

## Skill の書き込み

Skill Workshop は次の場所の下にのみ書き込みます。

```text
<workspace>/skills/<normalized-skill-name>/
```

Skill 名は正規化されます。

- 小文字化されます
- `[a-z0-9_-]` 以外の連続部分は `-` になります
- 先頭と末尾の英数字以外は削除されます
- 最大長は 80 文字です
- 最終的な名前は `[a-z0-9][a-z0-9_-]{1,79}` に一致する必要があります

`create` の場合:

- Skill が存在しない場合、Skill Workshop は新しい `SKILL.md` を書き込みます
- すでに存在する場合、Skill Workshop は本文を `## Workflow` に追記します

`append` の場合:

- Skill が存在する場合、Skill Workshop は要求されたセクションに追記します
- 存在しない場合、Skill Workshop は最小限の Skill を作成してから追記します

`replace` の場合:

- Skill はすでに存在している必要があります
- `oldText` が完全一致で存在している必要があります
- 最初に完全一致した箇所だけが置換されます

すべての書き込みはアトミックで、メモリ内の Skills スナップショットを即座に更新するため、新規または更新された Skill は Gateway の再起動なしで表示されるようになります。

## 安全性モデル

Skill Workshop には、生成された `SKILL.md` コンテンツとサポートファイルに対する安全性スキャナーがあります。

重大な検出結果は提案を隔離します。

| ルール ID                               | ブロックするコンテンツ...                                             |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | エージェントに以前または上位の指示を無視するよう伝えるもの            |
| `prompt-injection-system`              | システムプロンプト、開発者メッセージ、または隠された指示に言及するもの |
| `prompt-injection-tool`                | ツールの権限や承認の回避を促すもの                                    |
| `shell-pipe-to-shell`                  | `curl`/`wget` を `sh`、`bash`、または `zsh` にパイプするもの           |
| `secret-exfiltration`                  | env/プロセス env データをネットワーク経由で送信しているように見えるもの |

警告の検出結果は保持されますが、それ自体ではブロックしません。

| ルール ID            | 警告対象...                    |
| -------------------- | ------------------------------ |
| `destructive-delete` | 広範な `rm -rf` 形式のコマンド |
| `unsafe-permissions` | `chmod 777` 形式の権限使用     |

隔離された提案:

- `scanFindings` を保持します
- `quarantineReason` を保持します
- `list_quarantine` に表示されます
- `apply` では適用できません

隔離された提案から回復するには、安全でないコンテンツを削除した新しい安全な提案を作成してください。ストア JSON を手作業で編集しないでください。

## プロンプトガイダンス

有効な場合、Skill Workshop は、永続的な手順記憶に `skill_workshop` を使うようエージェントに伝える短いプロンプトセクションを挿入します。

ガイダンスで強調される点:

- 事実や好みではなく手順
- ユーザーからの修正
- 自明ではない成功した手順
- 繰り返される落とし穴
- 古くなった、不十分な、または誤った Skill の append/replace による修復
- 長いツールループや難しい修正の後に再利用可能な手順を保存すること
- 短い命令形の Skill テキスト
- トランスクリプトのダンプ禁止

書き込みモードのテキストは `approvalPolicy` に応じて変わります。

- pending モード: 提案をキューに入れ、明示的な承認後にのみ適用します
- auto モード: 明らかに再利用可能な安全なワークスペース Skill 更新を適用します

## コストと実行時の挙動

ヒューリスティックキャプチャはモデルを呼び出しません。

LLM レビューは、アクティブまたはデフォルトのエージェントモデルで埋め込み実行を使用します。これはしきい値ベースのため、デフォルトでは毎ターン実行されません。

レビューアー:

- 利用可能な場合、同じ設定済みプロバイダー/モデルコンテキストを使用します
- 実行時のエージェント既定値にフォールバックします
- `reviewTimeoutMs` を持ちます
- 軽量なブートストラップコンテキストを使用します
- ツールを持ちません
- 直接は何も書き込みません
- 通常のスキャナーと承認/隔離パスを通る提案のみを出力できます

レビューアーが失敗した、タイムアウトした、または無効な JSON を返した場合、Plugin は警告/デバッグメッセージをログに記録し、そのレビューパスをスキップします。

## 運用パターン

ユーザーが次のように言う場合は Skill Workshop を使います。

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

良い Skill テキスト:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

悪い Skill テキスト:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

悪い例を保存すべきでない理由:

- トランスクリプトの形になっている
- 命令形ではない
- ノイズの多い一回限りの詳細が含まれている
- 次のエージェントに何をすべきかを伝えていない

## デバッグ

Plugin が読み込まれているか確認します。

```bash
openclaw plugins list --enabled
```

エージェント/ツールコンテキストから提案数を確認します。

```json
{ "action": "status" }
```

保留中の提案を調べます。

```json
{ "action": "list_pending" }
```

隔離された提案を調べます。

```json
{ "action": "list_quarantine" }
```

よくある症状:

| 症状                                  | 考えられる原因                                                                        | 確認                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ツールを利用できない                  | Plugin エントリが有効化されていない                                                   | `plugins.entries.skill-workshop.enabled` と `openclaw plugins list` |
| 自動提案が表示されない                | `autoCapture: false`、`reviewMode: "off"`、またはしきい値を満たしていない             | 設定、提案ステータス、Gateway ログ                                   |
| ヒューリスティックがキャプチャしない  | ユーザーの文言が修正パターンに一致しなかった                                          | 明示的に `skill_workshop.suggest` を使うか、LLM レビューアーを有効化 |
| レビューアーが提案を作成しなかった    | レビューアーが `none`、無効な JSON を返した、またはタイムアウトした                   | Gateway ログ、`reviewTimeoutMs`、しきい値                            |
| 提案が適用されない                    | `approvalPolicy: "pending"`                                                           | `list_pending`、その後 `apply`                                       |
| 提案が pending から消えた             | 重複提案の再利用、最大 pending 数による整理、または適用/拒否/隔離済み                 | `status`、ステータスフィルター付きの `list_pending`、`list_quarantine` |
| Skill ファイルはあるがモデルが見逃す  | Skill スナップショットが更新されていない、または Skill ゲーティングが除外している     | `openclaw skills` ステータスとワークスペース Skill の適格性          |

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

決定的なカバレッジを実行します。

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

レビューアーカバレッジを実行します。

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

レビューアーシナリオは、`reviewMode: "llm"` を有効化し、埋め込みレビューアーパスを実行するため、意図的に分離されています。

## 自動適用を有効にすべきでない場合

次の場合は `approvalPolicy: "auto"` を避けてください。

- ワークスペースに機密性の高い手順が含まれている
- エージェントが信頼できない入力に取り組んでいる
- Skills が広範なチームで共有されている
- プロンプトやスキャナールールをまだ調整している
- モデルが敵対的な Web/メールコンテンツを頻繁に扱う

まず pending モードを使います。そのワークスペースでエージェントが提案する Skills の種類を確認してから、auto モードに切り替えてください。

## 関連ドキュメント

- [Skills](/ja-JP/tools/skills)
- [Plugins](/ja-JP/tools/plugin)
- [テスト](/ja-JP/reference/test)
