---
read_when:
    - チャットからエージェントにSkillsの作成または更新を依頼する場合
    - 生成されたスキルのドラフトをレビューし、適用、却下、または隔離する必要があります
    - Skill Workshop の承認、自律性、ストレージ、または制限を設定している場合
    - 自己学習に関する提案がどこでレビューされるかを確認する場合
sidebarTitle: Skill Workshop
summary: Skill Workshop のレビューを通じてワークスペースの Skills を作成・更新する
title: Skill ワークショップ
x-i18n:
    generated_at: "2026-07-16T12:20:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c2590f2a1bcad3b22ef8504eac7b3a44611c3fedc0df3832660f8926ce04252
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop は、ワークスペースの Skills を作成および更新するための、OpenClaw が管理する手順です。エージェントとオペレーターは、この手順を通じて `SKILL.md` を直接書き込むことはありません。代わりに、**提案**（コンテンツ、対象の関連付け、スキャナーの状態、ハッシュ、ロールバックメタデータを含む保留中のドラフト）を作成し、それが適用された場合にのみ有効な Skill になります。

Skill Workshop が書き込むのはワークスペースの Skills のみです。バンドル済み、Plugin、ClawHub、追加ルート、管理対象、個人エージェント、またはシステムの Skills には一切変更を加えません。

## 仕組み

- **提案が先:** 生成されたコンテンツは `SKILL.md` ではなく、`PROPOSAL.md` として保存されます。
- **適用のみが有効な書き込み:** 作成、更新、修正によって有効な Skills が変更されることはありません。
- **ワークスペース単位:** 作成対象はワークスペースの `skills/` ルートです。更新できるのは、書き込み可能なワークスペースの Skills のみです。
- **上書きなし:** 対象の Skill がすでに存在する場合、作成は失敗します。
- **ハッシュによる関連付け:** 更新提案は現在の対象ハッシュに関連付けられ、適用前に有効な Skill が変更された場合は `stale` になります。
- **スキャナーによるゲート:** 適用では、書き込み前にセキュリティスキャナーが再実行されます。
- **復元可能:** 適用では、有効なファイルに変更を加える前にロールバックメタデータが書き込まれます。
- **一貫したインターフェース:** チャット、CLI、Gateway はすべて同じサービスを呼び出します。

## ライフサイクル

```text
作成/更新 -> 保留中
修正      -> 保留中
適用      -> 適用済み
却下      -> 却下済み
隔離      -> 隔離済み
対象変更  -> 失効
```

修正、適用、却下、または隔離できるのは、`pending` の提案のみです。

## ライフサイクル管理

Gateway は共有状態データベースで Skills の使用状況を集計します。1 日に 1 回、Skill Workshop によって作成および適用された Skills を確認します。30 日を超えて使用されていない Skills は `stale` になり、90 日後には `archived` となって、新しいエージェントの Skill スナップショットから除外されます。アーカイブされた Skill ファイルはディスク上では変更されません。手動で作成された Skills は管理対象になりません。ライフサイクル管理の対象になるのは、Skill Workshop の提案によって作成された Skills のみです。

ピン留めされた Skills はライフサイクル遷移の対象外です。失効した Skill は、使用された後に次回のスイープが実行されると `active` に戻ります。アーカイブされた Skills は、明示的な復元によってのみ戻ります。

ライフサイクル遷移と復元は新しいセッションに適用されます。実行中のセッションは、現在の Skill スナップショットを維持します。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

すべての管理コマンドは `--json` を受け付けます。ステータスでは、決定論的に特定された重複候補も提案としてのみ報告されます。Skills を統合したり、モデルを呼び出したりすることはありません。

## チャット

必要な Skill をエージェントに依頼すると、エージェントが `skill_workshop` を呼び出し、提案 ID を返します。

### 最近の作業から学習する

`/learn` を使用すると、現在の会話または指定したソースから、標準に準拠した 1 つの Skill 提案を作成できます。

```text
/learn
/learn docs/runbook.md と https://example.com/guide。復旧に重点を置く
```

リクエストがない場合、`/learn` は現在の会話から再利用可能なワークフローを抽出するようエージェントに依頼します。リクエストがある場合、エージェントは重点、範囲、命名の要件を順守しながら、パス、URL、貼り付けられたメモ、会話への参照をソースとして扱います。既存のツールでソースを収集してから、`action: "create"` を指定して `skill_workshop` を呼び出します。

作成された提案は `pending` のままです。`/learn` が提案を適用することはありません。通常の承認フローまたは `openclaw skills workshop` を使用して、確認して適用してください。

作成:

```text
月曜日の受信トレイ処理を実行する morning-catchup という Skill を作成してください。
```

既存のワークスペースの Skill を更新:

```text
予約前に座席表も確認するように trip-planning を更新してください。
```

保留中の提案を反復修正:

```text
morning-catchup の提案を表示してください。
緊急とマークされた項目にもフラグを付けるように修正してください。
morning-catchup の提案を適用してください。
```

エージェントが開始する `apply`、`reject`、`quarantine` は、デフォルトでは追加の承認プロンプトなしで実行されます。これらのアクションの前にオペレーターの承認を必須にするには、`skills.workshop.approvalPolicy` を `"pending"` に設定します。

承認が必要な場合、プロンプトには提案 ID と対象の Skill が示され、提案の説明、サポートファイル数、本文サイズが表示されます。承認リクエストは、エージェントツールのウォッチドッグが作動する前に完了するよう時間制限が設定されます。プロンプトの期限が切れるまでに判断が行われなかった場合、ライフサイクルアクションは実行されません。提案は保留中かつ変更されないままです。後で Skill Workshop UI で判断するか、`openclaw skills workshop apply|reject|quarantine <proposal-id>` を実行してください。エージェントは、期限切れになったライフサイクルアクションをループで再試行すべきではありません。

## CLI

```bash
# 作成
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "毎日の受信トレイ処理: トリアージ、アーカイブ、重要項目の抽出、下書き、計画" \
  --proposal ./PROPOSAL.md

# 既存のワークスペースの Skill を更新
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 一覧表示と確認
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 承認前に修正
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 完了処理
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "重複"
openclaw skills workshop quarantine <proposal-id> --reason "セキュリティレビューが必要"
```

すべてのサブコマンドは `--agent <id>`（対象ワークスペース。デフォルトでは cwd から推測され、次にデフォルトエージェントが使用されます）と `--json`（構造化出力）を受け付けます。`propose-create`、`propose-update`、`revise` は、`--proposal` とともに提案のコンテキストを記録するため、`--goal <text>` と `--evidence <text>` も受け付けます。

## 提案の内容

保留中の提案は、提案専用の frontmatter を含む `PROPOSAL.md` として保存されます。

```markdown
---
name: "morning-catchup"
description: "毎日の受信トレイ処理: トリアージ、アーカイブ、重要項目の抽出、下書き、計画"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

適用時に、Skill Workshop は有効な `SKILL.md` を書き込み、提案専用フィールドである `status`、提案の `version`、提案の `date` を削除します。

## サポートファイル

提案する Skill が `PROPOSAL.md` の隣にファイルを必要とする場合は、`--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "金曜日のまとめ: 統計、ハイライト、翌週の最重要 3 項目" \
  --proposal-dir ./weekly-update-proposal
```

ディレクトリには `PROPOSAL.md` が含まれている必要があります。サポートファイルは、`assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の配下に配置する必要があります。Skill Workshop はそれらをスキャンし、ハッシュ化して提案とともに保存した後、適用時にのみ有効な `SKILL.md` の隣へ書き込みます。

拒否されるサポートファイルのパスには、絶対パス、隠しパスセグメント、パストラバーサル、重複するパス、実行可能ファイル、UTF-8 以外のテキスト、ヌルバイト、標準サポートフォルダー外のパスが含まれます。

## エージェントツール

モデルは、1 つの必須 `action` である `create | update | revise | list | inspect | apply | reject | quarantine` とともに `skill_workshop` を使用します。
その他のパラメーターはアクションに応じて適用されます。

| パラメーター                 | 使用するアクション                                     | 備考                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` では必須。それ以外では名前から保留中の提案を解決します |
| `description`              | `create`、`update`、`revise`                         | 最大 160 バイト                                                      |
| `skill_name`               | `update`                                             | 既存の Skill 名またはキー                                            |
| `proposal_content`         | `create`、`update`、`revise`                         | `PROPOSAL.md` として保存。上限は `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` の配列                                           |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由記述のコンテキスト                                               |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 対象の提案                                                           |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 任意                                                                 |
| `query`、`status`、`limit` | `list`                                               | フィルタリング/ページ分割。`limit` は最大 50、デフォルト 20 |

エージェントは、生成された Skill の作業に `skill_workshop` を使用する必要があります。`write`、`edit`、`exec`、シェルコマンド、または直接のファイルシステム操作を通じて提案ファイルを作成または変更してはなりません。

<Note>
`skill_workshop` は組み込みのエージェントツールであり、`tools.profile: "coding"` に含まれています。より厳格なポリシーによって非表示になっている場合は、アクティブな `tools.allow` リストに `skill_workshop` を追加するか、明示的な `tools.allow` のないプロファイルをスコープが使用している場合は `tools.alsoAllow: ["skill_workshop"]` を使用してください。サンドボックス化された実行ではホスト側の Skill Workshop ツールが構築されないため、提案の確認アクションは通常のホスト側エージェントセッションまたは CLI から実行してください。
</Note>

## 提案される Skills

OpenClaw は、インタラクティブなターンの終了時に、失敗したターンを含め、「次回」や「覚えておいて」などの永続的な指示や、対応を求める修正を検出します。次のターンで、エージェントは直近に検出されたワークフローを `skill_workshop` を通じて保存することを提案し、提案を作成するかどうかはユーザーが決定します。この組み込みの提案機能だけで Skill が作成または変更されることはありません。代わりに保留中の提案を直接作成するには、`skills.workshop.autonomous.enabled` を有効にします。Control UI では、Workshop タブのページヘッダーにある **自己学習** トグル、および空の提案ボードにある有効化ボタンから同じ設定を利用できます。

### 過去のセッションをスキャンする

Control UI では、自律的な自己学習を有効にせずに、過去の作業を確認できます。
**Plugins → Workshop** を開き、**Skill のアイデアを探す** を選択します。スキャンは対象となる最新のセッションから開始され、実質的な作業が含まれる一定範囲を確認します。
Cron、Heartbeat、フック、サブエージェント、ACP、Plugin 所有、内部レビューの各セッション、およびモデルのターン数が 6 未満の会話はスキップされます。

レビュアーは、選択したエージェントに設定されたモデルを使用し、シークレットが削除され、サイズが制限されたトランスクリプト一式を受け取ります。経験レビューと同じ保守的な基準、すなわち具体的な復旧パターン、または将来のモデル呼び出しやツール呼び出しを少なくとも 2 回削減できる安定した手順を適用します。日常的な作業や一度限りの事実からは、提案を生成すべきではありません。

1 回のスキャンで作成または修正できる保留中の提案は最大 3 件です。有効な Skill の適用、却下、隔離、編集はできません。Workshop には、たとえば **20 セッションを確認済み · 6 月 18 日〜今日 · 2 件のアイデアを検出** のように、累積カバレッジが表示されます。保持されている最古セッションのカーソルから続行するには、**以前の作業をスキャン** を選択します。利用可能な履歴をすべて処理すると、アクションは **新しい作業をスキャン** に変わります。

履歴レビューは、`skills.workshop.autonomous.enabled` が `false` の場合でも手動です。クリックするたびにモデル実行が開始されるため、プロバイダーの料金とデータ取り扱い条件が適用されます。カーソルとカバレッジ数は共有 OpenClaw 状態データベースに保存されますが、トランスクリプトの内容はスキャン状態にコピーされません。

自律キャプチャを有効にすると、OpenClaw は、十分な作業が正常に完了した後、かつエージェントシステム全体がアイドル状態になった後にも、保守的なレビューを実行できます。この分離されたレビューが作成または改訂できる保留中の提案は、最大1件です。`approvalPolicy` が `"auto"` の場合でも、使用中のスキルを更新したり、提案を適用、却下、隔離したりすることはできません。

有効化、適格性、プライバシーとコストの詳細、提案のしきい値、トラブルシューティングについては、[自己学習](/tools/self-learning)を参照してください。

## 承認と自律性

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: false,
      },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
  },
}
```

| 設定                    | デフォルト  | 効果                                                                                                                                                              |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`  | 明示的な修正、およびアイドル遅延後に、再利用可能な復旧方法または有意なラウンドトリップ削減を伴う十分な完了済み作業から、保留中の提案を作成します。   |
| `allowSymlinkTargetWrites` | `false`  | 実際のターゲットが `skills.load.allowSymlinkTargets` に列挙されているワークスペーススキルのシンボリックリンクを通じて、適用時の書き込みを許可します。                                                 |
| `approvalPolicy`           | `"auto"` | `"auto"` は、エージェントが開始した `apply`、`reject`、または `quarantine` に対する追加プロンプトを省略します（エージェントは引き続きアクションを呼び出す必要があります）。`"pending"` では承認が必要です。 |
| `maxPending`               | `50`     | ワークスペースごとの保留中および隔離済み提案を制限します（1～200）。                                                                                                       |
| `maxSkillBytes`            | `40000`  | 提案本文のサイズをバイト単位で制限します（1024～200000）。                                                                                                                     |

自律キャプチャは、将来に向けたルール（例：「今後は」）と、事後的な修正（例：「それは依頼した内容ではありません」）を認識します。新しい指示をトピック別にグループ化し、1ターンあたり最大3件の提案にまとめます。また、語彙が一致する場合は既存の書き込み可能なワークスペーススキルに振り分け、同じスキルを対象とする別の修正があれば、自身の保留中の提案を改訂します。

明示的な修正を伴わない正常に完了した十分な作業については、選択されたモデルの分離された実行が、完了した軌跡が保守的な提案基準を満たすかどうかを判断します。フォアグラウンドモデルは、応答前に学習するよう促されません。バックグラウンドレビュアーは、フォアグラウンド実行を提案の来歴として保持し、一般的なエージェントツールにはアクセスできず、ライフサイクルに関する決定も行えません。レビューは、フォアグラウンドランタイムが、正確に解決されたモデルと、`skill_workshop` が実際に利用可能だったことの両方を報告した場合にのみ開始されます。そのため、制限的または不明なツールポリシーではフェイルクローズとなり、提案は作成されません。

自律レビューの完全な動作と安全性モデルについては、[自己学習](/tools/self-learning)を参照してください。

提案の説明は、`maxSkillBytes` に関係なく、常に160バイトに制限されます。

## Gateway メソッド

| メソッド                             | スコープ            |
| ---------------------------------- | ---------------- |
| `skills.proposals.list`            | `operator.read`  |
| `skills.proposals.inspect`         | `operator.read`  |
| `skills.proposals.historyStatus`   | `operator.read`  |
| `skills.proposals.historyScan`     | `operator.admin` |
| `skills.proposals.create`          | `operator.admin` |
| `skills.proposals.update`          | `operator.admin` |
| `skills.proposals.revise`          | `operator.admin` |
| `skills.proposals.requestRevision` | `operator.admin` |
| `skills.proposals.apply`           | `operator.admin` |
| `skills.proposals.reject`          | `operator.admin` |
| `skills.proposals.quarantine`      | `operator.admin` |
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` は Gateway 専用です（CLI やエージェントツールに相当するものはありません）。エージェントに文字どおりの新しい内容を送信させるのではなく、改訂させる UI 向けに、`PROPOSAL.md` を直接置き換えず、自由形式の改訂指示を所有エージェントのチャットセッションへ転送します。

`historyStatus` と `historyScan` は Control UI のサポートメソッドです。`historyScan` は `direction: "older" | "newer"` を受け入れ、結果を常に保留中の提案として残します。

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

デフォルトの状態ディレクトリ：`~/.openclaw`。

- `proposal.json`：正規の提案レコード。
- `proposals.json`：提案フォルダーから再構築可能な高速一覧インデックス。
- `PROPOSAL.md`：保留中のスキル提案。
- `rollback.json`：適用によって使用中のファイルを変更する前に書き込まれる復旧メタデータ。

## 制限

| 制限                           | 値                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| 説明                     | 160バイト                                                            |
| 提案本文                   | `skills.workshop.maxSkillBytes`（デフォルト40,000、上限1 MiB） |
| サポートファイル                   | 提案ごとに64個                                                      |
| サポートファイルサイズ               | 各256 KiB、合計2 MiB                                            |
| 保留中 + 隔離済みの提案 | ワークスペースごとに `skills.workshop.maxPending`（デフォルト50）              |

## トラブルシューティング

| 問題                                        | 解決策                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` を160バイト以下に短縮します。                                                                                                                                                                 |
| `Skill proposal content is too large`          | 提案本文を短縮するか、`skills.workshop.maxSkillBytes` を増やします。                                                                                                                                         |
| `Target skill changed after proposal creation` | 現在のターゲットに合わせて提案を改訂するか、新しい提案を作成します。                                                                                                                                   |
| `Proposal scan failed`                         | スキャナーの検出結果を確認してから、提案を改訂または隔離します。                                                                                                                                           |
| `untrusted symlink target`                     | `skills.load.allowSymlinkTargets` を設定し、意図的に共有するスキルルートに対してのみ `skills.workshop.allowSymlinkTargetWrites` を有効にします。                                                                  |
| `Support file paths must be under one of...`   | サポートファイルを `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の下へ移動します。                                                                                                                |
| 提案が一覧に表示されない                 | 選択した `--agent` ワークスペースと `OPENCLAW_STATE_DIR` を確認します。                                                                                                                                            |
| エージェントが `skill_workshop` を呼び出せない             | 有効なツールポリシーと実行モードを確認します。`coding` にはこのツールが含まれます。制限的な `tools.allow` ポリシーでは明示的に列挙する必要があり、サンドボックス化された実行では通常のホスト側エージェントセッションまたは CLI を使用する必要があります。 |

### ツールポリシーの診断

自律キャプチャが有効な場合、`openclaw doctor` はデフォルトエージェントに対して `core/doctor/skill-workshop-tool-policy` チェックを実行します。ポリシーによって `skill_workshop` が非表示になっている場合、警告には最初に除外した設定レイヤーと、必要な `allow` または `alsoAllow` の正確な変更内容が示されます。古いランブックでは引き続き `openclaw plugins inspect skill-workshop` が使用されている場合がありますが、このコマンドは現在、Skill Workshop が組み込みであることを説明し、該当する場合は同じポリシーのヒントを表示します。

## 関連項目

- [Skills](/ja-JP/tools/skills)：読み込み順序、優先順位、可視性
- [自己学習](/tools/self-learning)：保守的な実行後のスキル提案
- [スキルの作成](/ja-JP/tools/creating-skills)：手書きの `SKILL.md`
  の基本
- [Skills の設定](/ja-JP/tools/skills-config)：完全な `skills.workshop` スキーマ
- [Skills CLI](/ja-JP/cli/skills)：`openclaw skills` コマンド
