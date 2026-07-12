---
read_when:
    - チャットからエージェントにスキルの作成または更新を依頼する場合
    - 生成されたスキルの下書きをレビューし、適用、却下、または隔離する必要があります
    - Skill Workshop の承認、自律性、ストレージ、または制限を設定している場合
sidebarTitle: Skill Workshop
summary: Skill Workshop のレビューを通じてワークスペースの Skills を作成・更新する
title: スキルワークショップ
x-i18n:
    generated_at: "2026-07-11T22:45:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop は、ワークスペースのスキルを作成および更新するために OpenClaw が管理する経路です。
エージェントとオペレーターがこの経路を通じて `SKILL.md` を直接書き込むことはありません。
代わりに、**提案**（内容、対象の関連付け、スキャナーの状態、ハッシュ、ロールバックメタデータを含む保留中の下書き）を作成し、適用された場合にのみ実際のスキルになります。

Skill Workshop が書き込むのはワークスペースのスキルだけです。バンドル済み、
Plugin、ClawHub、追加ルート、管理対象、個人エージェント、システムのスキルには一切変更を加えません。

## 仕組み

- **最初に提案:** 生成された内容は `SKILL.md` ではなく
  `PROPOSAL.md` として保存されます。
- **実際の書き込みは適用時のみ:** 作成、更新、修正によって
  アクティブなスキルが変更されることはありません。
- **ワークスペースに限定:** 作成先はワークスペースの `skills/` ルートです。更新できるのは
  書き込み可能なワークスペーススキルだけです。
- **上書き禁止:** 対象のスキルがすでに存在する場合、作成は失敗します。
- **ハッシュに関連付け:** 更新提案は現在の対象ハッシュに関連付けられ、適用前に
  実際のスキルが変更されると `stale` になります。
- **スキャナーによる制御:** 適用では、書き込む前にセキュリティスキャナーを再実行します。
- **復旧可能:** 適用では、実際のファイルに変更を加える前にロールバックメタデータを書き込みます。
- **一貫したインターフェース:** チャット、CLI、Gateway はすべて同じサービスを呼び出します。

## ライフサイクル

```text
作成/更新 -> 保留中
修正      -> 保留中
適用      -> 適用済み
却下      -> 却下済み
隔離      -> 隔離済み
対象変更  -> 期限切れ
```

修正、適用、却下、隔離ができるのは `pending` の提案だけです。

## ライフサイクル管理

Gateway は共有状態データベースでスキルの総利用状況を追跡します。1 日に 1 回、
Skill Workshop によって作成および適用されたスキルを確認します。30 日を超えて
使用されていないスキルは `stale` になり、90 日後には `archived` となって、
新しいエージェントのスキルスナップショットから除外されます。アーカイブされたスキルファイルは
ディスク上で変更されません。手動で作成されたスキルが管理対象になることはありません。ライフサイクル管理の対象になるのは、
Skill Workshop の提案によって作成されたスキルだけです。

固定されたスキルにはライフサイクル遷移が適用されません。期限切れのスキルは使用された後、
次の定期処理が実行されると `active` に戻ります。アーカイブされたスキルは、
明示的に復元した場合にのみ戻ります。

ライフサイクル遷移と復元は新しいセッションに適用されます。実行中のセッションでは、
現在のスキルスナップショットが維持されます。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

すべての管理コマンドで `--json` を使用できます。ステータスでは、決定論的に判定された
重複候補も提案としてのみ報告されます。スキルを統合したり、モデルを呼び出したりすることはありません。

## チャット

必要なスキルをエージェントに依頼すると、エージェントが `skill_workshop` を呼び出し、
提案 ID を返します。

### 最近の作業から学習する

`/learn` を使用すると、現在の会話または指定したソースを、標準に沿った
1 つのスキル提案に変換できます。

```text
/learn
/learn docs/runbook.md と https://example.com/guide; 復旧に重点を置く
```

依頼内容を指定せずに `/learn` を使用すると、現在の会話から再利用可能なワークフローを
抽出するようエージェントに依頼します。依頼内容を指定すると、エージェントは重点、範囲、
命名要件に従いながら、パス、URL、貼り付けられたメモ、会話への参照をソースとして扱います。
既存のツールでソースを収集した後、`action: "create"` を指定して
`skill_workshop` を呼び出します。

生成された提案は `pending` のままです。`/learn` が提案を適用することはありません。
通常の承認フローまたは `openclaw skills workshop` を使用して確認し、適用してください。

作成:

```text
月曜日の受信トレイルーチンを実行する morning-catchup というスキルを作成してください。
```

既存のワークスペーススキルを更新:

```text
予約前に座席表も確認するよう trip-planning を更新してください。
```

保留中の提案を調整:

```text
morning-catchup の提案を表示してください。
緊急とマークされた項目にもフラグを付けるよう修正してください。
morning-catchup の提案を適用してください。
```

エージェントが開始する `apply`、`reject`、`quarantine` では、デフォルトで承認プロンプトが
表示されます。信頼できる環境でこれを省略するには、
`skills.workshop.approvalPolicy` を `"auto"` に設定します。

プロンプトには提案 ID と対象スキルが示され、提案の説明、
サポートファイル数、本文サイズが表示されます。承認要求は、エージェントツールの監視タイムアウト前に
完了するよう時間制限が設けられています。プロンプトの期限切れまでに判断されなかった場合、
ライフサイクル操作は実行されません。提案は保留中かつ未変更のままです。
後で Skill Workshop の UI から判断するか、
`openclaw skills workshop apply|reject|quarantine <proposal-id>` を実行してください。エージェントは
期限切れになったライフサイクル操作をループで再試行しないでください。

## CLI

```bash
# 作成
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "受信トレイを毎日確認: 選別、アーカイブ、重要項目の抽出、下書き、計画" \
  --proposal ./PROPOSAL.md

# 既存のワークスペーススキルを更新
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

すべてのサブコマンドで `--agent <id>`（対象ワークスペース。デフォルトは
現在の作業ディレクトリから推定されたエージェント、次いでデフォルトのエージェント）と、`--json`（構造化出力）を
使用できます。`propose-create`、`propose-update`、`revise` では、
`--proposal` とともに提案のコンテキストを記録するための `--goal <text>` と
`--evidence <text>` も使用できます。

## 提案の内容

保留中、提案は提案専用のフロントマターを含む `PROPOSAL.md` として保存されます。

```markdown
---
name: "morning-catchup"
description: "受信トレイを毎日確認: 選別、アーカイブ、重要項目の抽出、下書き、計画"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

適用時に Skill Workshop はアクティブな `SKILL.md` を書き込み、
提案専用のフィールドである `status`、提案の `version`、提案の `date` を削除します。

## サポートファイル

提案するスキルで `PROPOSAL.md` と同じ場所にファイルが必要な場合は、
`--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "金曜日の振り返り: 統計、ハイライト、来週の上位 3 項目" \
  --proposal-dir ./weekly-update-proposal
```

ディレクトリには `PROPOSAL.md` が必要です。サポートファイルは
`assets/`、`examples/`、`references/`、`scripts/`、`templates/` のいずれかに配置する必要があります。Skill
Workshop はこれらをスキャン、ハッシュ化して提案とともに保存し、適用時にのみ
実際の `SKILL.md` と同じ場所へ書き込みます。

拒否されるサポートファイルのパス: 絶対パス、非表示のパスセグメント、パストラバーサル、
重複するパス、実行可能ファイル、UTF-8 以外のテキスト、ヌルバイト、
標準のサポートフォルダー外のパス。

## エージェントツール

モデルは必須の `action` を 1 つ指定して `skill_workshop` を使用します。
`create | update | revise | list | inspect | apply | reject | quarantine`。
その他のパラメーターはアクションに応じて使用します。

| パラメーター             | 使用するアクション                                     | 注記                                                                 |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                     | `create`、`inspect`、`revise`                         | `create` では必須。それ以外では名前から保留中の提案を解決します     |
| `description`              | `create`、`update`、`revise`                          | 最大 160 バイト                                                      |
| `skill_name`               | `update`                                             | 既存のスキル名またはキー                                             |
| `proposal_content`         | `create`、`update`、`revise`                          | `PROPOSAL.md` として保存。上限は `skills.workshop.maxSkillBytes`     |
| `support_files`            | `create`、`update`、`revise`                          | `{ path, content }` の配列                                           |
| `goal`、`evidence`         | `create`、`update`、`revise`                          | 自由記述のコンテキスト                                               |
| `proposal_id`              | `inspect`、`revise`、`apply`、`reject`、`quarantine`  | 対象の提案                                                           |
| `reason`                   | `apply`、`reject`、`quarantine`                       | 任意                                                                 |
| `query`、`status`、`limit` | `list`                                               | フィルタリングとページ分割。`limit` は最大 50、デフォルトは 20      |

エージェントは生成されたスキルを扱う際に `skill_workshop` を使用する必要があります。
`write`、`edit`、`exec`、シェルコマンド、ファイルシステムの直接操作を通じて
提案ファイルを作成または変更してはなりません。

<Note>
`skill_workshop` は組み込みのエージェントツールであり、
`tools.profile: "coding"` に含まれています。より厳格なポリシーによって非表示になる場合は、
有効な `tools.allow` リストに `skill_workshop` を追加するか、明示的な
`tools.allow` がないプロファイルを使用するスコープでは
`tools.alsoAllow: ["skill_workshop"]` を使用してください。サンドボックス化された実行では、
ホスト側の Skill Workshop ツールは構築されません。そのため、提案のレビュー操作は通常のホスト側
エージェントセッションまたは CLI から実行してください。
</Note>

## 提案されるスキル

OpenClaw は、対話ターンの終了時に、失敗したターンを含め、「次回」や「覚えておいて」などの
継続的な指示と、事後的な修正を検出します。次のターンで、エージェントは最後に検出した
ワークフローを `skill_workshop` を通じて保存することを提案し、提案を作成するかどうかは
ユーザーが決定します。この組み込みの提案機能だけでは、スキルの作成や変更は行われません。代わりに
保留中の提案を直接作成するには、`skills.workshop.autonomous.enabled` を有効にします。

## 承認と自律動作

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

| 設定                       | デフォルト  | 効果                                                                                                                                                                 |
| -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `autonomous.enabled`       | `false`     | 次のターンで最後に検出したワークフローの保存を提案する代わりに、保留中の提案を直接作成します。                                                                         |
| `allowSymlinkTargetWrites` | `false`     | 実際の参照先が `skills.load.allowSymlinkTargets` に登録されているワークスペーススキルのシンボリックリンクを通じた書き込みを、適用時に許可します。                       |
| `approvalPolicy`           | `"pending"` | `"pending"` では、エージェントが開始した `apply`、`reject`、`quarantine` の前に承認プロンプトが必要です。`"auto"` ではプロンプトを省略します（エージェントによるアクションの呼び出しは引き続き必要です）。 |
| `maxPending`               | `50`        | ワークスペースごとの保留中および隔離済みの提案数を制限します（1～200）。                                                                                               |
| `maxSkillBytes`            | `40000`     | 提案本文のサイズをバイト単位で制限します（1024～200000）。                                                                                                            |

自律キャプチャは、将来に適用するルール（たとえば「今後は」）と、事後的な修正
（たとえば「それは私が依頼した内容ではない」）を認識します。新しい指示をトピック別に、
1 ターンあたり最大 3 件の提案にまとめ、語彙が一致する場合は既存の書き込み可能な
ワークスペーススキルに振り分けます。また、同じスキルを対象とする別の修正が行われた場合は、
自身が作成した保留中の提案を修正します。

提案の説明は `maxSkillBytes` に関係なく、常に 160 バイトに制限されます。

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
| `skills.curator.status`            | `operator.read`  |
| `skills.curator.pin`               | `operator.admin` |
| `skills.curator.unpin`             | `operator.admin` |
| `skills.curator.restore`           | `operator.admin` |

`requestRevision` は Gateway 専用です（CLI やエージェントツールに相当する機能はありません）。これは、エージェントに新しい内容をそのまま送信させるのではなく修正を依頼する UI 向けに、`PROPOSAL.md` を直接置き換える代わりに、自由記述の修正指示を所有エージェントのチャットセッションへ転送します。

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
- `proposals.json`: 高速な一覧インデックス。提案フォルダーから再構築できます。
- `PROPOSAL.md`: 保留中の Skill 提案。
- `rollback.json`: 適用によって実ファイルが変更される前に書き込まれる復旧用メタデータ。

## 制限

| 制限                            | 値                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 説明                            | 160 バイト                                                           |
| 提案本文                        | `skills.workshop.maxSkillBytes`（デフォルト 40,000、上限 1 MiB）     |
| 補助ファイル                    | 提案ごとに 64 個                                                     |
| 補助ファイルのサイズ            | 1 個あたり 256 KiB、合計 2 MiB                                      |
| 保留中および隔離済みの提案      | ワークスペースごとに `skills.workshop.maxPending`（デフォルト 50）   |

## トラブルシューティング

| 問題                                           | 解決方法                                                                                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` を 160 バイト以下に短縮します。                                                                                                                                                            |
| `Skill proposal content is too large`          | 提案本文を短縮するか、`skills.workshop.maxSkillBytes` を増やします。                                                                                                                                      |
| `Target skill changed after proposal creation` | 現在の対象に合わせて提案を修正するか、新しい提案を作成します。                                                                                                                                            |
| `Proposal scan failed`                         | スキャナーの検出結果を確認し、提案を修正または隔離します。                                                                                                                                                |
| `untrusted symlink target`                     | 意図的に共有している Skill ルートに限り、`skills.load.allowSymlinkTargets` を設定し、`skills.workshop.allowSymlinkTargetWrites` を有効にします。                                                           |
| `Support file paths must be under one of...`   | 補助ファイルを `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の配下へ移動します。                                                                                                |
| 提案が一覧に表示されない                       | 選択した `--agent` ワークスペースと `OPENCLAW_STATE_DIR` を確認します。                                                                                                                                   |
| エージェントが `skill_workshop` を呼び出せない | 有効なツールポリシーと実行モードを確認します。`coding` にはこのツールが含まれます。制限的な `tools.allow` ポリシーでは明示的に追加する必要があり、サンドボックス実行では通常のホスト側エージェントセッションまたは CLI を使用する必要があります。 |

### ツールポリシーの診断

自律キャプチャが有効な場合、`openclaw doctor` はデフォルトエージェントに対して `core/doctor/skill-workshop-tool-policy` チェックを実行します。ポリシーによって `skill_workshop` が非表示になっている場合、警告には除外している最初の設定レイヤーと、必要な `allow` または `alsoAllow` の正確な変更内容が示されます。古い運用手順では、引き続き `openclaw plugins inspect skill-workshop` を使用している場合があります。このコマンドは現在、Skill Workshop が組み込みであることを説明し、該当する場合は同じポリシーのヒントを出力します。

## 関連項目

- 読み込み順序、優先順位、可視性については [Skills](/ja-JP/tools/skills)
- 手動で記述する `SKILL.md` の基本については [Skill の作成](/ja-JP/tools/creating-skills)
- `skills.workshop` の完全なスキーマについては [Skills の設定](/ja-JP/tools/skills-config)
- `openclaw skills` コマンドについては [Skills CLI](/ja-JP/cli/skills)
