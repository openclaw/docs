---
read_when:
    - チャットからエージェントにSkillを作成または更新させたい場合
    - 生成されたスキルドラフトをレビュー、適用、却下、または隔離する必要があります
    - Skill Workshop の承認、自律性、ストレージ、または制限を構成している
sidebarTitle: Skill Workshop
summary: Skill Workshop レビューを通じてワークスペース Skills を作成および更新する
title: スキルワークショップ
x-i18n:
    generated_at: "2026-07-06T10:54:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6effd3b4fdaff4d8c087343cf67012d52663a0a8b0536677ac1de8aefc1dcc39
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop は、ワークスペースのスキルを作成および更新するための、OpenClaw の管理された経路です。エージェントとオペレーターはこの経路で `SKILL.md` を直接書き込むことはありません。代わりに、適用されたときにのみライブスキルになる **提案**（内容、ターゲットバインディング、スキャナー状態、ハッシュ、ロールバックメタデータを持つ保留中の下書き）を作成します。

Skill Workshop が書き込むのはワークスペーススキルだけです。バンドル済み、Plugin、ClawHub、追加ルート、管理対象、個人エージェント、システムスキルには一切触れません。

## 仕組み

- **提案が先:** 生成された内容は `SKILL.md` ではなく `PROPOSAL.md` として保存されます。
- **適用だけがライブ書き込み:** 作成、更新、改訂はアクティブなスキルを変更しません。
- **ワークスペーススコープ:** 作成はワークスペースの `skills/` ルートをターゲットにします。更新は書き込み可能なワークスペーススキルに対してのみ許可されます。
- **上書きなし:** ターゲットスキルがすでに存在する場合、作成は失敗します。
- **ハッシュ束縛:** 更新提案は現在のターゲットハッシュに束縛され、適用前にライブスキルが変更されると `stale` になります。
- **スキャナーゲート:** 適用は書き込み前にセキュリティスキャナーを再実行します。
- **復旧可能:** 適用はライブファイルに触れる前にロールバックメタデータを書き込みます。
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

`pending` の提案だけが、改訂、適用、却下、隔離できます。

## チャット

必要なスキルをエージェントに依頼すると、エージェントは `skill_workshop` を呼び出して提案 id を返します。

### 最近の作業から学習

`/learn` を使うと、現在の会話または指定したソースを、標準に沿ったスキル提案に変換できます。

```text
/learn
/learn docs/runbook.md and https://example.com/guide; focus on recovery
```

リクエストなしの場合、`/learn` は現在の会話から再利用可能なワークフローを抽出するようエージェントに依頼します。リクエストがある場合、エージェントはフォーカス、スコープ、命名要件を尊重しつつ、パス、URL、貼り付けられたメモ、会話参照をソースとして扱います。既存のツールでソースを収集し、その後 `action: "create"` で `skill_workshop` を呼び出します。

生成された提案は `pending` のままです。`/learn` がそれを適用することはありません。通常の承認フロー、または `openclaw skills workshop` でレビューして適用します。

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

プロンプトには提案 id とターゲットスキルが示され、提案の説明、サポートファイル数、本文サイズが表示されます。承認リクエストは、エージェントツールの watchdog より前に完了するよう制限されます。プロンプトの期限切れまでに判断が届かない場合、ライフサイクルアクションは実行されません。提案は保留中のまま変更されません。後で Skill Workshop UI で判断するか、`openclaw skills workshop apply|reject|quarantine <proposal-id>` を実行してください。エージェントは期限切れのライフサイクルアクションをループで再試行すべきではありません。

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

すべてのサブコマンドは `--agent <id>`（ターゲットワークスペース。デフォルトは cwd から推定され、その後デフォルトエージェント）と `--json`（構造化出力）を受け取ります。`propose-create`、`propose-update`、`revise` はさらに、`--proposal` とあわせて提案コンテキストを記録するための `--goal <text>` と `--evidence <text>` も受け取ります。

## 提案内容

保留中の間、提案は提案専用 frontmatter を持つ `PROPOSAL.md` として保存されます。

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

提案されたスキルに `PROPOSAL.md` の横のファイルが必要な場合は、`--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

ディレクトリには `PROPOSAL.md` が含まれている必要があります。サポートファイルは `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の下に置く必要があります。Skill Workshop はそれらをスキャン、ハッシュ化し、提案とともに保存します。その後、適用時にのみライブの `SKILL.md` の横に書き込みます。

却下されるサポートファイルパス: 絶対パス、隠しパスセグメント、パストラバーサル、重複するパス、実行可能ファイル、非 UTF-8 テキスト、null バイト、標準サポートフォルダー外のパス。

## エージェントツール

モデルは、必須の `action` を 1 つ指定して `skill_workshop` を使用します。
`create | update | revise | list | inspect | apply | reject | quarantine`。
その他のパラメーターはアクションに応じて適用されます。

| パラメーター               | 使用するアクション                                   | 注記                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | `create` では必須。それ以外では名前で保留中の提案を解決します |
| `description`              | `create`, `update`, `revise`                         | 最大 160 バイト |
| `skill_name`               | `update`                                             | 既存のスキル名またはキー |
| `proposal_content`         | `create`, `update`, `revise`                         | `PROPOSAL.md` として保存されます。`skills.workshop.maxSkillBytes` で上限設定 |
| `support_files`            | `create`, `update`, `revise`                         | `{ path, content }` の配列 |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | 自由テキストのコンテキスト |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | ターゲット提案 |
| `reason`                   | `apply`, `reject`, `quarantine`                      | 任意 |
| `query`, `status`, `limit` | `list`                                               | フィルター/ページネーション。`limit` は最大 50、デフォルト 20 |

エージェントは生成されたスキル作業に `skill_workshop` を使用する必要があります。`write`、`edit`、`exec`、シェルコマンド、または直接のファイルシステム操作で提案ファイルを作成または変更してはなりません。

<Note>
`skill_workshop` は組み込みのエージェントツールであり、`tools.profile: "coding"` に含まれています。より厳格なポリシーで隠されている場合は、アクティブな `tools.allow` リストに `skill_workshop` を追加するか、明示的な `tools.allow` のないプロファイルをスコープが使用している場合は `tools.alsoAllow: ["skill_workshop"]` を使用してください。サンドボックス実行ではホスト側の Skill Workshop ツールは構築されないため、提案レビューアクションは通常のホスト側エージェントセッションまたは CLI から実行してください。
</Note>

## 提案されるスキル

OpenClaw は、インタラクティブなターンが終了したとき、失敗したターンも含めて、「next time」、「remember to」、および反応的な修正などの永続的な指示を検出します。次のターンで、エージェントは直近に検出されたワークフローを `skill_workshop` 経由で保存することを提案します。ユーザーが提案を作成するかどうかを決定します。この組み込み提案は、それ自体ではスキルを作成または変更しません。代わりに保留中の提案を直接作成するには、`skills.workshop.autonomous.enabled` を有効にします。

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

| 設定                       | デフォルト  | 効果                                                                                                                                                                  |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 次のターンで直近に検出されたワークフローを提案する代わりに、保留中の提案を直接作成します。                                                             |
| `allowSymlinkTargetWrites` | `false`     | 実ターゲットが `skills.load.allowSymlinkTargets` に一覧されているワークスペーススキルのシンボリックリンク越しに、適用が書き込めるようにします。                                                    |
| `approvalPolicy`           | `"pending"` | `"pending"` は、エージェントが開始する `apply`、`reject`、`quarantine` の前に承認プロンプトを要求します。`"auto"` はプロンプトを省略します（エージェントは引き続きアクションを呼び出す必要があります）。 |
| `maxPending`               | `50`        | ワークスペースごとの保留中および隔離済み提案数を制限します（1-200）。                                                                                                          |
| `maxSkillBytes`            | `40000`     | 提案本文サイズをバイト単位で制限します（1024-200000）。                                                                                                                        |

自律キャプチャは、将来に向けたルール（例: 「from now on」）と反応的な修正（例: 「that’s not what I asked」）を認識します。新しい指示をトピックごとに、1 ターンあたり最大 3 つの提案にグループ化し、語彙が一致するものを既存の書き込み可能なワークスペーススキルへルーティングし、同じスキルを対象とする別の修正がある場合は自身の保留中の提案を改訂します。

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

`requestRevision` は Gateway 専用です（CLI またはエージェントツールの同等機能はありません）。UI がリテラルな新規内容を送信するのではなく、エージェントに改訂を依頼する場合に、`PROPOSAL.md` を直接置き換える代わりに、自由テキストの改訂指示を所有エージェントのチャットセッションへ転送します。

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
- `proposals.json`: 高速な一覧インデックス。提案フォルダーから再構築可能。
- `PROPOSAL.md`: 保留中のスキル提案。
- `rollback.json`: 適用変更がライブファイルに反映される前に書き込まれる復旧メタデータ。

## 制限

| 制限                            | 値                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 説明                            | 160 バイト                                                           |
| 提案本文                        | `skills.workshop.maxSkillBytes` (デフォルト 40,000; ハード上限 1 MiB) |
| サポートファイル                | 提案ごとに 64                                                        |
| サポートファイルサイズ          | 各 256 KiB、合計 2 MiB                                               |
| 保留中 + 隔離済みの提案         | ワークスペースごとに `skills.workshop.maxPending` (デフォルト 50)    |

## トラブルシューティング

| 問題                                           | 解決方法                                                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` を 160 バイト以下に短くします。                                                                                                                                                               |
| `Skill proposal content is too large`          | 提案本文を短くするか、`skills.workshop.maxSkillBytes` を引き上げます。                                                                                                                                      |
| `Target skill changed after proposal creation` | 現在の対象に合わせて提案を改訂するか、新しい提案を作成します。                                                                                                                                              |
| `Proposal scan failed`                         | スキャナーの検出結果を確認してから、提案を改訂するか隔離します。                                                                                                                                            |
| `untrusted symlink target`                     | 意図した共有スキルルートに限り、`skills.load.allowSymlinkTargets` を構成し、`skills.workshop.allowSymlinkTargetWrites` を有効にします。                                                                     |
| `Support file paths must be under one of...`   | サポートファイルを `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の下に移動します。                                                                                                  |
| 提案が一覧に表示されない                       | 選択された `--agent` ワークスペースと `OPENCLAW_STATE_DIR` を確認します。                                                                                                                                    |
| エージェントが `skill_workshop` を呼び出せない | アクティブなツールポリシーと実行モードを確認します。`coding` にはこのツールが含まれます。制限的な `tools.allow` ポリシーでは明示的に列挙する必要があり、サンドボックス化された実行では通常のホスト側エージェントセッションまたは CLI を使用する必要があります。 |

### ツールポリシー診断

自律キャプチャが有効な場合、`openclaw doctor` はデフォルトエージェントに対して
`core/doctor/skill-workshop-tool-policy` チェックを実行します。ポリシーが
`skill_workshop` を非表示にしている場合、警告には最初に除外している設定レイヤーと、
必要な正確な `allow` または `alsoAllow` の変更が示されます。古いランブックではまだ
`openclaw plugins inspect skill-workshop` を使用している場合があります。このコマンドは現在、Skill
Workshop が組み込みであることを説明し、該当する場合は同じポリシーヒントを出力します。

## 関連

- 読み込み順序、優先順位、可視性については [Skills](/ja-JP/tools/skills)
- 手書きの `SKILL.md`
  の基本については [スキルの作成](/ja-JP/tools/creating-skills)
- 完全な `skills.workshop` スキーマについては [Skills 設定](/ja-JP/tools/skills-config)
- `openclaw skills` コマンドについては [Skills CLI](/ja-JP/cli/skills)
