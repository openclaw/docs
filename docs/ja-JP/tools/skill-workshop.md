---
read_when:
    - チャットからエージェントにスキルの作成または更新を依頼する場合
    - 生成されたスキルの下書きをレビューし、適用、却下、または隔離する必要があります
    - Skill Workshop の承認、自律性、ストレージ、または制限を設定する場合
    - 自己学習の提案がどこでレビューされるかを確認したい場合
sidebarTitle: Skill Workshop
summary: Skill Workshop のレビューを通じてワークスペース Skills を作成・更新する
title: スキルワークショップ
x-i18n:
    generated_at: "2026-07-14T14:07:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7f9a223104b6335a15c853bffda4a159668db24c397656d2aadbd403eceeaa72
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop は、ワークスペースの Skills を作成および更新するための、OpenClaw が管理する手順です。エージェントとオペレーターが、この手順を通じて `SKILL.md` に直接書き込むことはありません。代わりに、コンテンツ、対象の関連付け、スキャナーの状態、ハッシュ、ロールバックメタデータを含む保留中のドラフトである **提案** を作成し、適用された場合にのみ稼働中の Skill になります。

Skill Workshop が書き込むのは、ワークスペースの Skills のみです。バンドル済み、Plugin、ClawHub、追加ルート、管理対象、個人エージェント、システムの Skills には一切触れません。

## 仕組み

- **提案が先:** 生成されたコンテンツは `SKILL.md` ではなく、`PROPOSAL.md` として保存されます。
- **稼働中の内容を書き込めるのは適用のみ:** 作成、更新、改訂によってアクティブな Skills が変更されることはありません。
- **ワークスペース単位:** 作成先はワークスペースの `skills/` ルートです。更新できるのは、書き込み可能なワークスペースの Skills のみです。
- **上書き禁止:** 対象の Skill がすでに存在する場合、作成は失敗します。
- **ハッシュによる関連付け:** 更新提案は現在の対象ハッシュに関連付けられ、適用前に稼働中の Skill が変更されると `stale` になります。
- **スキャナーによる制限:** 適用時には、書き込み前にセキュリティスキャナーが再実行されます。
- **復旧可能:** 適用では、稼働中のファイルに触れる前にロールバックメタデータが書き込まれます。
- **一貫したインターフェース:** チャット、CLI、Gateway はすべて同じサービスを呼び出します。

## ライフサイクル

```text
作成/更新 -> 保留中
改訂      -> 保留中
適用      -> 適用済み
却下      -> 却下済み
隔離      -> 隔離済み
対象変更  -> 期限切れ
```

改訂、適用、却下、隔離が可能なのは、`pending` の提案のみです。

## ライフサイクルの整理

Gateway は、共有状態データベースで Skills の使用状況を集計します。1 日に 1 回、Skill Workshop によって作成および適用された Skills を確認します。30 日を超えて使用されていない Skills は `stale` になり、90 日後には `archived` となって、新しいエージェントの Skill スナップショットから除外されます。アーカイブされた Skill ファイルは、ディスク上では変更されません。手動で作成された Skills は整理の対象になりません。ライフサイクルの整理対象となるのは、Skill Workshop の提案から作成された Skills のみです。

固定された Skills はライフサイクルの移行対象になりません。期限切れの Skill は、使用された後、次回のスイープが実行されると `active` に戻ります。アーカイブされた Skills は、明示的な復元によってのみ戻ります。

ライフサイクルの移行と復元は新しいセッションに適用されます。実行中のセッションは、現在の Skill スナップショットを維持します。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

すべての curator コマンドは `--json` を受け付けます。status は、決定論的に検出された重複候補も提案としてのみ報告します。Skills を統合したり、モデルを呼び出したりすることはありません。

## チャット

必要な Skill をエージェントに依頼すると、エージェントが `skill_workshop` を呼び出し、提案 ID を返します。

### 最近の作業から学習する

`/learn` を使用すると、現在の会話または指定したソースから、標準に沿った 1 つの Skill 提案を作成できます。

```text
/learn
/learn docs/runbook.md と https://example.com/guide。復旧に重点を置く
```

リクエストを指定しない場合、`/learn` は、現在の会話から再利用可能なワークフローを抽出するようエージェントに依頼します。リクエストを指定した場合、エージェントは重点、スコープ、命名要件を守りながら、パス、URL、貼り付けられたメモ、会話への参照をソースとして扱います。既存のツールを使用してソースを収集し、`action: "create"` を指定して `skill_workshop` を呼び出します。

生成された提案は `pending` のままです。`/learn` が適用することはありません。通常の承認フローまたは `openclaw skills workshop` を使用して、確認して適用してください。

作成:

```text
月曜日の受信トレイルーチンを実行する morning-catchup という Skill を作成する。
```

既存のワークスペース Skill を更新:

```text
予約前に座席表も確認するよう trip-planning を更新する。
```

保留中の提案を反復修正:

```text
morning-catchup の提案を表示する。
緊急とマークされたものにもフラグを付けるよう改訂する。
morning-catchup の提案を適用する。
```

エージェントが開始する `apply`、`reject`、`quarantine` では、デフォルトで承認プロンプトが表示されます。信頼できる環境でこれを省略するには、`skills.workshop.approvalPolicy` を `"auto"` に設定します。

プロンプトには提案 ID と対象の Skill が示され、提案の説明、サポートファイル数、本文サイズが表示されます。承認リクエストは、エージェントツールのウォッチドッグが作動する前に完了するよう時間制限が設けられます。プロンプトの有効期限までに判断が行われなかった場合、ライフサイクル操作は実行されません。提案は保留中かつ変更されていない状態を維持します。後で Skill Workshop UI から判断するか、`openclaw skills workshop apply|reject|quarantine <proposal-id>` を実行してください。エージェントは、期限切れになったライフサイクル操作をループで再試行しないでください。

## CLI

```bash
# 作成
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "Daily inbox catch-up: triage, archive, surface, draft, plan" \
  --proposal ./PROPOSAL.md

# 既存のワークスペース Skill を更新
openclaw skills workshop propose-update trip-planning --proposal ./PROPOSAL.md

# 一覧表示と確認
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>

# 承認前に改訂
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md

# 完了処理
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

すべてのサブコマンドは、`--agent <id>`（対象ワークスペース。デフォルトでは cwd から推論し、その後デフォルトエージェントを使用）と `--json`（構造化出力）を受け付けます。`propose-create`、`propose-update`、`revise` は、`--proposal` とともに提案のコンテキストを記録するため、`--goal <text>` と `--evidence <text>` も受け付けます。

## 提案の内容

保留中の提案は、提案専用の frontmatter を持つ `PROPOSAL.md` として保存されます。

```markdown
---
name: "morning-catchup"
description: "Daily inbox catch-up: triage, archive, surface, draft, plan"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

適用時に、Skill Workshop はアクティブな `SKILL.md` を書き込み、提案専用のフィールドである `status`、提案の `version`、提案の `date` を削除します。

## サポートファイル

提案する Skill で `PROPOSAL.md` と同じ場所にファイルが必要な場合は、`--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "Friday wrap-up: stats, highlights, next week's top three" \
  --proposal-dir ./weekly-update-proposal
```

ディレクトリには `PROPOSAL.md` が含まれている必要があります。サポートファイルは、`assets/`、`examples/`、`references/`、`scripts/`、`templates/` のいずれかの配下に置く必要があります。Skill Workshop はこれらをスキャンしてハッシュを計算し、提案とともに保存します。その後、適用時にのみ、稼働中の `SKILL.md` と同じ場所へ書き込みます。

拒否されるサポートファイルのパス: 絶対パス、非表示のパスセグメント、パストラバーサル、重複するパス、実行可能ファイル、UTF-8 以外のテキスト、ヌルバイト、標準のサポートフォルダー外のパス。

## エージェントツール

モデルは、必須の `action` である `create | update | revise | list | inspect | apply | reject | quarantine` を 1 つ指定して、`skill_workshop` を使用します。
その他のパラメーターは、アクションに応じて適用されます。

| パラメーター                  | 使用するアクション                                              | 注記                                                                |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                        | `create` では必須。それ以外では名前によって保留中の提案を解決 |
| `description`              | `create`、`update`、`revise`                         | 最大 160 バイト                                                        |
| `skill_name`               | `update`                                             | 既存の Skill 名またはキー                                           |
| `proposal_content`         | `create`、`update`、`revise`                         | `PROPOSAL.md` として保存。上限は `skills.workshop.maxSkillBytes`   |
| `support_files`            | `create`、`update`、`revise`                         | `{ path, content }` の配列                                         |
| `goal`、`evidence`         | `create`、`update`、`revise`                         | 自由記述のコンテキスト                                                    |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine` | 対象の提案                                                      |
| `reason`                   | `apply`、`reject`、`quarantine`                      | 任意                                                             |
| `query`、`status`、`limit` | `list`                                               | フィルタリング/ページ分割。`limit` は最大 50、デフォルト 20                          |

エージェントは、生成された Skill の作業に `skill_workshop` を使用する必要があります。`write`、`edit`、`exec`、シェルコマンド、またはファイルシステムの直接操作によって、提案ファイルを作成または変更してはなりません。

<Note>
`skill_workshop` は組み込みのエージェントツールであり、`tools.profile: "coding"` に含まれています。より厳格なポリシーによって非表示になっている場合は、アクティブな `tools.allow` リストに `skill_workshop` を追加するか、明示的な `tools.allow` を持たないプロファイルをスコープが使用している場合は `tools.alsoAllow: ["skill_workshop"]` を使用してください。サンドボックス化された実行では、ホスト側の Skill Workshop ツールは構築されません。そのため、提案の確認操作は、通常のホスト側エージェントセッションまたは CLI から実行してください。
</Note>

## 提案される Skills

OpenClaw は、対話的なターンが終了したときに、失敗したターンも含め、「次回」「覚えておいて」などの継続的な指示や、修正を求める反応を検出します。次のターンで、エージェントは直近に検出されたワークフローを `skill_workshop` を通じて保存することを提案します。提案を作成するかどうかはユーザーが決定します。この組み込みの提案機能自体が Skill を作成または変更することはありません。代わりに保留中の提案を直接作成するには、`skills.workshop.autonomous.enabled` を有効にします。Control UI では、Workshop タブのページヘッダーにある **自己学習** トグルと、空の提案ボードにある有効化ボタンから同じ設定を利用できます。

### 過去のセッションをスキャンする

Control UI では、自律的な自己学習を有効にせずに過去の作業を確認できます。
**Plugins → Workshop** を開き、**Skill のアイデアを探す** を選択します。スキャンは対象となる最新のセッションから開始し、十分な作業内容を含む一定範囲を確認します。
Cron、Heartbeat、フック、サブエージェント、ACP、Plugin 所有、内部レビューの各セッションに加え、モデルのターンが 6 回未満の会話はスキップされます。

レビュアーは、選択したエージェントに設定されたモデルを使用し、シークレットが編集され、サイズが制限された文字起こしの集合を受け取ります。具体的な復旧パターン、または将来のモデル呼び出しやツール呼び出しを少なくとも 2 回削減できる安定した手順であること、という経験レビューと同じ慎重な基準を適用します。日常的な作業や一度限りの事実からは、提案を生成しないでください。

1 回のスキャンで作成または改訂できる保留中の提案は最大 3 件です。適用、却下、隔離、稼働中の Skill の編集はできません。Workshop には、たとえば **20 件のセッションを確認済み · 6月18日～今日 · 2 件のアイデアを検出** のように、累積範囲が表示されます。保存されている最古セッションのカーソルから続行するには、**以前の作業をスキャン** を選択します。利用可能な履歴をすべて確認すると、アクションは **新しい作業をスキャン** に変わります。

履歴レビューは、
`skills.workshop.autonomous.enabled` が `false` の場合でも手動です。クリックするたびにモデル実行が開始されるため、
プロバイダーの料金体系とデータ取り扱い条件が適用されます。カーソルとカバレッジ数は
共有 OpenClaw 状態データベースに保存されます。トランスクリプトの内容は
スキャン状態にコピーされません。

自律キャプチャを有効にすると、OpenClaw は、正常に完了した実質的な作業の後、かつ
エージェントシステム全体がアイドル状態になった後に、保守的なレビューを実行することもできます。この分離されたレビューでは、
保留中の提案を最大 1 件作成または改訂できます。`approvalPolicy` が `"auto"` の場合でも、
稼働中のスキルを更新したり、提案を適用、却下、隔離したりすることはできません。

有効化、適格性、プライバシーとコストの詳細、提案のしきい値、トラブルシューティングについては、
[自己学習](/tools/self-learning)を参照してください。

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

| 設定                    | デフォルト     | 効果                                                                                                                                                                 |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 明示的な修正、およびアイドル遅延後に、再利用可能な復旧手順または有意義な往復処理の削減を含む、完了済みの実質的な作業から保留中の提案を作成します。      |
| `allowSymlinkTargetWrites` | `false`     | 実体のターゲットが `skills.load.allowSymlinkTargets` に記載されているワークスペーススキルのシンボリックリンクを介して、適用処理による書き込みを許可します。                                                    |
| `approvalPolicy`           | `"pending"` | `"pending"` では、エージェントが開始する `apply`、`reject`、または `quarantine` の前に承認プロンプトが必要です。`"auto"` ではプロンプトを省略します（エージェントによるアクションの呼び出しは引き続き必要です）。 |
| `maxPending`               | `50`        | ワークスペースごとの保留中および隔離済み提案の上限を設定します（1～200）。                                                                                                          |
| `maxSkillBytes`            | `40000`     | 提案本文のバイト単位の上限を設定します（1024～200000）。                                                                                                                        |

自律キャプチャは、将来に向けたルール（例：「今後は」）と、
修正への反応（例：「それは依頼した内容ではありません」）を認識します。新しい指示をトピック別にグループ化し、1 回のターンにつき
最大 3 件の提案を作成します。また、語彙の一致を既存の書き込み可能なワークスペーススキルへ振り分け、
別の修正が同じスキルを対象とする場合は、自身の保留中の提案を改訂します。

明示的な修正がなく正常に完了した実質的な作業については、選択された
モデルの分離された実行が、完了した軌跡が保守的な提案基準を満たすかどうかを判断します。
フォアグラウンドモデルは、応答前に学習するよう促されません。バックグラウンドレビュー担当は、
提案の出所としてフォアグラウンド実行を保持し、一般的なエージェントツールにはアクセスできず、ライフサイクルに関する
決定も行えません。レビューは、フォアグラウンドランタイムが、正確に解決されたモデルと、
`skill_workshop` が実際に使用可能だったことの両方を報告した場合にのみ開始されます。そのため、制限的または不明なツールポリシーでは
安全側に失敗し、提案は作成されません。

自律レビューの完全な動作と安全モデルについては、[自己学習](/tools/self-learning)を参照してください。

提案の説明は、`maxSkillBytes` にかかわらず、常に 160 バイトに制限されます。

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

`requestRevision` は Gateway 専用です（CLI またはエージェントツールに相当するものはありません）。
エージェントに新しい内容をそのまま送信させるのではなく改訂させる UI 向けに、
`PROPOSAL.md` を直接置き換える代わりに、自由形式の改訂指示を所有エージェントのチャットセッションへ
転送します。

`historyStatus` と `historyScan` は Control UI のサポートメソッドです。`historyScan` は
`direction: "older" | "newer"` を受け付けます。結果は常に保留中の
提案として残されます。

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
- `proposals.json`：高速な一覧インデックス。提案フォルダーから再構築可能です。
- `PROPOSAL.md`：保留中のスキル提案。
- `rollback.json`：適用処理が稼働中のファイルを変更する前に書き込まれる復旧メタデータ。

## 制限

| 制限                           | 値                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| 説明                     | 160 バイト                                                            |
| 提案本文                   | `skills.workshop.maxSkillBytes`（デフォルト 40,000、絶対上限 1 MiB） |
| サポートファイル                   | 提案ごとに 64                                                      |
| サポートファイルサイズ               | 各 256 KiB、合計 2 MiB                                            |
| 保留中 + 隔離済みの提案 | ワークスペースごとに `skills.workshop.maxPending`（デフォルト 50）              |

## トラブルシューティング

| 問題                                        | 解決方法                                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` を 160 バイト以下に短縮します。                                                                                                                                                                 |
| `Skill proposal content is too large`          | 提案本文を短縮するか、`skills.workshop.maxSkillBytes` を引き上げます。                                                                                                                                         |
| `Target skill changed after proposal creation` | 現在のターゲットに合わせて提案を改訂するか、新しい提案を作成します。                                                                                                                                   |
| `Proposal scan failed`                         | スキャナーの検出結果を確認し、提案を改訂または隔離します。                                                                                                                                           |
| `untrusted symlink target`                     | `skills.load.allowSymlinkTargets` を設定し、意図的に共有するスキルルートに対してのみ `skills.workshop.allowSymlinkTargetWrites` を有効にします。                                                                  |
| `Support file paths must be under one of...`   | サポートファイルを `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の配下へ移動します。                                                                                                                |
| 提案が一覧に表示されない                 | 選択した `--agent` ワークスペースと `OPENCLAW_STATE_DIR` を確認します。                                                                                                                                            |
| エージェントが `skill_workshop` を呼び出せない             | 有効なツールポリシーと実行モードを確認します。`coding` にはこのツールが含まれます。制限的な `tools.allow` ポリシーでは明示的に指定する必要があり、サンドボックス化された実行では通常のホスト側エージェントセッションまたは CLI を使用する必要があります。 |

### ツールポリシーの診断

自律キャプチャが有効な場合、`openclaw doctor` はデフォルトエージェントに対して
`core/doctor/skill-workshop-tool-policy` チェックを実行します。ポリシーによって
`skill_workshop` が非表示になっている場合、警告には最初に除外している設定レイヤーと、
必要な `allow` または `alsoAllow` の変更内容が正確に示されます。古いランブックでは引き続き
`openclaw plugins inspect skill-workshop` を使用している場合があります。このコマンドは現在、
Skill Workshop が組み込みであることを説明し、該当する場合は同じポリシーのヒントを表示します。

## 関連項目

- [Skills](/ja-JP/tools/skills)：読み込み順序、優先順位、可視性
- [自己学習](/tools/self-learning)：実行後の保守的なスキル提案
- [スキルの作成](/ja-JP/tools/creating-skills)：手書きの `SKILL.md`
  の基本
- [Skills の設定](/ja-JP/tools/skills-config)：`skills.workshop` スキーマ全体
- [Skills CLI](/ja-JP/cli/skills)：`openclaw skills` コマンド
