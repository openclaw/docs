---
read_when:
    - チャットからエージェントにスキルを作成または更新させたい
    - 生成されたスキル草案をレビュー、適用、却下、または隔離する必要があります
    - Skill Workshop の承認、自律性、ストレージ、または制限を設定しています
sidebarTitle: Skill Workshop
summary: Skill Workshop レビューを通じてワークスペース Skills を作成および更新する
title: Skill ワークショップ
x-i18n:
    generated_at: "2026-07-05T11:52:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f5c2c11d4a170c98cc91cfb522a4de26e1fe76eba57da3df8072708584ce179
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop は、ワークスペースのスキルを作成および更新するための OpenClaw の管理された経路です。エージェントとオペレーターは、この経路で `SKILL.md` を直接書き込むことはありません。代わりに、適用されたときにのみ有効なスキルになる **提案**（内容、対象バインディング、スキャナー状態、ハッシュ、ロールバックメタデータを持つ保留中のドラフト）を作成します。

Skill Workshop が書き込むのはワークスペーススキルのみです。バンドル済み、plugin、ClawHub、追加ルート、管理対象、個人エージェント、またはシステムスキルには一切触れません。

## 仕組み

- **提案が先:** 生成された内容は `SKILL.md` ではなく `PROPOSAL.md` として保存されます。
- **適用だけが有効な書き込み:** 作成、更新、改訂はアクティブなスキルを変更しません。
- **ワークスペーススコープ:** 作成はワークスペースの `skills/` ルートを対象にします。更新は書き込み可能なワークスペーススキルにのみ許可されます。
- **上書きなし:** 対象スキルがすでに存在する場合、作成は失敗します。
- **ハッシュで束縛:** 更新提案は現在の対象ハッシュに束縛され、適用前に有効なスキルが変更されると `stale` になります。
- **スキャナーゲート:** 適用では、書き込み前にセキュリティスキャナーを再実行します。
- **復旧可能:** 適用では、有効なファイルに触れる前にロールバックメタデータを書き込みます。
- **一貫したサーフェス:** チャット、CLI、Gateway はすべて同じサービスを呼び出します。

## ライフサイクル

```text
create/update -> pending
revise        -> pending
apply         -> applied
reject        -> rejected
quarantine    -> quarantined
target change -> stale
```

`pending` の提案だけが、改訂、適用、却下、または隔離できます。

## チャット

必要なスキルをエージェントに依頼します。エージェントは `skill_workshop` を呼び出し、提案 ID を返します。

作成:

```text
Make a skill called morning-catchup that runs my Monday inbox routine.
```

既存のワークスペーススキルを更新:

```text
Update trip-planning to also check seat maps before booking.
```

保留中の提案を反復:

```text
Show me the morning-catchup proposal.
Revise it to also flag anything marked urgent.
Apply the morning-catchup proposal.
```

エージェントが開始する `apply`、`reject`、`quarantine` は、デフォルトで承認プロンプトを表示します。信頼済み環境でこれを省略するには、`skills.workshop.approvalPolicy` を `"auto"` に設定します。

## CLI

```bash
# Create
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# Update an existing workspace skill
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# List and inspect
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# Revise before approval
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# Close out
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

すべてのサブコマンドは `--agent <id>`（対象ワークスペース。デフォルトは cwd から推定され、その後デフォルトエージェント）と `--json`（構造化出力）を受け取ります。`propose-create`、`propose-update`、`revise` は、`--proposal` と併せて提案コンテキストを記録するために `--goal <text>` と `--evidence <text>` も受け取ります。

## 提案内容

保留中の間、提案は提案専用のフロントマターを持つ `PROPOSAL.md` として保存されます。

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

適用時に、Skill Workshop はアクティブな `SKILL.md` を書き込み、提案専用フィールドである `status`、提案 `version`、提案 `date` を削除します。

## サポートファイル

提案されたスキルが `PROPOSAL.md` の横にファイルを必要とする場合は、`--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

ディレクトリには `PROPOSAL.md` が含まれている必要があります。サポートファイルは `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の下に置く必要があります。Skill Workshop はそれらをスキャン、ハッシュ化し、提案とともに保存します。その後、適用時にのみ有効な `SKILL.md` の横に書き込みます。

却下されるサポートファイルパス: 絶対パス、隠しパスセグメント、パストラバーサル、重複するパス、実行可能ファイル、非 UTF-8 テキスト、ヌルバイト、標準サポートフォルダー外のパス。

## エージェントツール

モデルは、必須の `action` を 1 つ指定して `skill_workshop` を使用します:
`create | update | revise | list | inspect | apply | reject | quarantine`。
その他のパラメーターはアクションに応じて適用されます。

| パラメーター               | 使用元                                               | メモ                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | `create` では必須。それ以外では名前で保留中の提案を解決します |
| `description`              | `create`, `update`, `revise`                         | 最大 160 バイト                                                      |
| `skill_name`               | `update`                                             | 既存のスキル名またはキー                                             |
| `proposal_content`         | `create`, `update`, `revise`                         | `PROPOSAL.md` として保存されます。`skills.workshop.maxSkillBytes` により上限設定 |
| `support_files`            | `create`, `update`, `revise`                         | `{ path, content }` の配列                                           |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | 自由記述のコンテキスト                                               |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | 対象提案                                                             |
| `reason`                   | `apply`, `reject`, `quarantine`                      | 任意                                                                 |
| `query`, `status`, `limit` | `list`                                               | フィルター/ページネーション。`limit` は最大 50、デフォルト 20        |

エージェントは、生成されたスキル作業に `skill_workshop` を使用する必要があります。`write`、`edit`、`exec`、シェルコマンド、または直接のファイルシステム操作を通じて提案ファイルを作成または変更してはいけません。

<Note>
`skill_workshop` は組み込みのエージェントツールであり、`tools.profile: "coding"` に含まれています。より厳格なポリシーで非表示になる場合は、アクティブな `tools.allow` リストに `skill_workshop` を追加するか、明示的な `tools.allow` のないプロファイルをスコープが使用している場合は `tools.alsoAllow: ["skill_workshop"]` を使用します。サンドボックス実行ではホスト側の Skill Workshop ツールは構築されないため、提案レビューアクションは通常のホスト側エージェントセッションまたは CLI から実行してください。
</Note>

## 承認と自律性

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| 設定                       | デフォルト  | 効果                                                                                                                                                                   |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 成功したターンの後に、永続的な会話シグナルから OpenClaw が保留中の提案を作成できるようにします。                                                                      |
| `allowSymlinkTargetWrites` | `false`     | 実際の対象が `skills.load.allowSymlinkTargets` に listed されているワークスペーススキルのシンボリックリンク越しに、適用が書き込めるようにします。                    |
| `approvalPolicy`           | `"pending"` | `"pending"` は、エージェント開始の `apply`、`reject`、`quarantine` の前に承認プロンプトを要求します。`"auto"` はプロンプトを省略します（エージェントはそれでもアクションを呼び出す必要があります）。 |
| `maxPending`               | `50`        | ワークスペースごとの保留中および隔離済み提案数に上限を設定します（1-200）。                                                                                           |
| `maxSkillBytes`            | `40000`     | 提案本文サイズをバイト単位で上限設定します（1024-200000）。                                                                                                           |

提案の説明は、`maxSkillBytes` とは独立して、常に 160 バイトに制限されます。

## Gateway メソッド

| メソッド                           | スコープ         |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |

`requestRevision` は Gateway 専用です（CLI やエージェントツールの同等機能はありません）。これは、`PROPOSAL.md` を直接置き換える代わりに、自由記述の改訂指示を所有エージェントのチャットセッションに転送します。これは、リテラルな新規内容を送信するのではなく、エージェントに改訂を依頼する UI 向けです。

## ストレージ

```text
<OPENCLAW_STATE_DIR>/skill-workshop/
  proposals.json
  proposals/<proposal-id>/
    proposal.json
    PROPOSAL.md
    rollback.json
    assets/
    examples/
    references/
    scripts/
    templates/
```

デフォルトの状態ディレクトリ: `~/.openclaw`。

- `proposal.json`: 正規の提案レコード。
- `proposals.json`: 提案フォルダーから再構築可能な高速一覧インデックス。
- `PROPOSAL.md`: 保留中のスキル提案。
- `rollback.json`: 適用が有効なファイルを変更する前に書き込まれる復旧メタデータ。

## 制限

| 制限                            | 値                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 説明                            | 160 バイト                                                           |
| 提案本文                        | `skills.workshop.maxSkillBytes`（デフォルト 40,000、ハード上限 1 MiB） |
| サポートファイル                | 提案ごとに 64                                                        |
| サポートファイルサイズ          | 各 256 KiB、合計 2 MiB                                               |
| 保留中 + 隔離済み提案           | ワークスペースごとに `skills.workshop.maxPending`（デフォルト 50）    |

## トラブルシューティング

| 問題                                           | 解決方法                                                                                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` を 160 バイト以下に短縮します。                                                                                                                                                            |
| `Skill proposal content is too large`          | 提案本文を短縮するか、`skills.workshop.maxSkillBytes` を引き上げます。                                                                                                                                   |
| `Target skill changed after proposal creation` | 現在の対象に合わせて提案を修正するか、新しい提案を作成します。                                                                                                                                          |
| `Proposal scan failed`                         | スキャナーの検出結果を確認してから、提案を修正するか隔離します。                                                                                                                                        |
| `untrusted symlink target`                     | 意図した共有スキルルートに対してのみ、`skills.load.allowSymlinkTargets` を設定し、`skills.workshop.allowSymlinkTargetWrites` を有効にします。                                                           |
| `Support file paths must be under one of...`   | サポートファイルを `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の下に移動します。                                                                                             |
| 提案が一覧に表示されない                      | 選択した `--agent` ワークスペースと `OPENCLAW_STATE_DIR` を確認します。                                                                                                                                  |
| エージェントが `skill_workshop` を呼び出せない | アクティブなツールポリシーと実行モードを確認します。`coding` にはこのツールが含まれます。制限的な `tools.allow` ポリシーでは明示的に一覧に含める必要があり、サンドボックス化された実行では通常のホスト側エージェントセッションまたは CLI を使用する必要があります。 |

## 関連

- 読み込み順序、優先順位、可視性については [Skills](/ja-JP/tools/skills)
- 手書きの `SKILL.md` の基本については [Skills の作成](/ja-JP/tools/creating-skills)
- 完全な `skills.workshop` スキーマについては [Skills 設定](/ja-JP/tools/skills-config)
- `openclaw skills` コマンドについては [Skills CLI](/ja-JP/cli/skills)
