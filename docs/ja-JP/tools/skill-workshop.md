---
read_when:
    - チャットからエージェントに Skills の作成または更新を依頼する場合
    - 生成された Skills のドラフトをレビューし、適用、却下、または隔離する必要があります
    - Skill Workshop の承認、自律性、ストレージ、または制限を設定しています
sidebarTitle: Skill Workshop
summary: Skill Workshop のレビューを通じてワークスペースの Skills を作成・更新する
title: Skill ワークショップ
x-i18n:
    generated_at: "2026-07-12T14:57:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e073e6ef874ad0dc885272cbb62f6e94c18b0c242a1d24a67a3095fee2ce0c9
    source_path: tools/skill-workshop.md
    workflow: 16
---

Skill Workshop は、ワークスペースの Skills を作成および更新するための、OpenClaw の管理された経路です。エージェントとオペレーターは、この経路を通じて `SKILL.md` を直接書き込むことはありません。代わりに、**提案**（コンテンツ、ターゲットの関連付け、スキャナーの状態、ハッシュ、ロールバックメタデータを含む保留中のドラフト）を作成し、適用された場合にのみ有効な Skill になります。

Skill Workshop が書き込むのは、ワークスペースの Skills のみです。バンドル済み、Plugin、ClawHub、追加ルート、管理対象、個人エージェント、システムの Skills には一切変更を加えません。

## 仕組み

- **まず提案：** 生成されたコンテンツは `SKILL.md` ではなく、`PROPOSAL.md` として保存されます。
- **有効な書き込みは適用のみ：** 作成、更新、改訂によって有効な Skills が変更されることはありません。
- **ワークスペーススコープ：** 作成先はワークスペースの `skills/` ルートです。更新できるのは、書き込み可能なワークスペースの Skills のみです。
- **上書き禁止：** ターゲットの Skill がすでに存在する場合、作成は失敗します。
- **ハッシュへの関連付け：** 更新提案は現在のターゲットハッシュに関連付けられ、適用前に有効な Skill が変更されると `stale` になります。
- **スキャナーによる制限：** 適用時には、書き込み前にセキュリティスキャナーが再実行されます。
- **復旧可能：** 適用時には、有効なファイルに変更を加える前にロールバックメタデータが書き込まれます。
- **一貫したインターフェース：** チャット、CLI、Gateway はすべて同じサービスを呼び出します。

## ライフサイクル

```text
作成/更新 -> 保留中
改訂      -> 保留中
適用      -> 適用済み
却下      -> 却下済み
隔離      -> 隔離済み
ターゲット変更 -> stale
```

改訂、適用、却下、隔離が可能なのは、`pending` の提案だけです。

## ライフサイクルのキュレーション

Gateway は、共有状態データベースで Skills の使用状況を集計します。1 日に 1 回、Skill Workshop によって作成および適用された Skills を確認します。30 日を超えて使用されていない Skills は `stale` になり、90 日後には `archived` となって、新しいエージェントの Skill スナップショットから除外されます。アーカイブされた Skill ファイルは、ディスク上では変更されません。手動で作成された Skills はキュレーションの対象になりません。ライフサイクルのキュレーション対象となるのは、Skill Workshop の提案によって作成された Skills のみです。

ピン留めされた Skills はライフサイクル遷移の対象外です。stale の Skill は、使用された後に次回のスイープが実行されると `active` に戻ります。アーカイブされた Skills は、明示的な復元によってのみ戻ります。

ライフサイクル遷移と復元は新しいセッションに適用されます。実行中のセッションでは、現在の Skill スナップショットが維持されます。

```bash
openclaw skills curator status
openclaw skills curator pin <skill>
openclaw skills curator unpin <skill>
openclaw skills curator restore <skill>
```

すべての curator コマンドで `--json` を使用できます。status は、決定論的に検出した重複候補も提案としてのみ報告します。Skills をマージしたり、モデルを呼び出したりすることはありません。

## チャット

必要な Skill をエージェントに依頼すると、エージェントが `skill_workshop` を呼び出し、提案 ID を返します。

### 最近の作業から学習する

`/learn` を使用すると、現在の会話または指定したソースから、標準に従った Skill 提案を作成できます。

```text
/learn
/learn docs/runbook.md と https://example.com/guide。復旧を重視
```

リクエストを指定しない場合、`/learn` は現在の会話から再利用可能なワークフローを抽出するようエージェントに依頼します。リクエストを指定した場合、エージェントは重点、スコープ、命名要件に従いながら、パス、URL、貼り付けられたメモ、会話への参照をソースとして扱います。既存のツールでソースを収集してから、`action: "create"` を指定して `skill_workshop` を呼び出します。

生成された提案は `pending` のままです。`/learn` が提案を適用することはありません。通常の承認フローまたは `openclaw skills workshop` を使用して、提案を確認して適用してください。

作成：

```text
月曜日の受信トレイルーチンを実行する morning-catchup という Skill を作成してください。
```

既存のワークスペース Skill を更新：

```text
予約前に座席表も確認するよう trip-planning を更新してください。
```

保留中の提案を反復修正：

```text
morning-catchup の提案を表示してください。
urgent とマークされた項目にもフラグを付けるよう改訂してください。
morning-catchup の提案を適用してください。
```

エージェントによって開始された `apply`、`reject`、`quarantine` では、デフォルトで承認プロンプトが表示されます。信頼できる環境でこれを省略するには、`skills.workshop.approvalPolicy` を `"auto"` に設定します。

プロンプトには提案 ID とターゲット Skill が示され、提案の説明、サポートファイル数、本文サイズが表示されます。承認リクエストには、エージェントツールのウォッチドッグが作動する前に完了するよう時間制限があります。プロンプトの有効期限までに決定されなかった場合、ライフサイクル操作は実行されません。提案は保留中のままで、変更されません。後で Skill Workshop UI から決定するか、`openclaw skills workshop apply|reject|quarantine <proposal-id>` を実行してください。エージェントは、期限切れになったライフサイクル操作をループで再試行しないでください。

## CLI

```bash
# 作成
openclaw skills workshop propose-create \
  --name morning-catchup \
  --description "毎日の受信トレイ確認：トリアージ、アーカイブ、重要項目の提示、下書き、計画" \
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
openclaw skills workshop reject <proposal-id> --reason "重複"
openclaw skills workshop quarantine <proposal-id> --reason "セキュリティレビューが必要"
```

すべてのサブコマンドで `--agent <id>`（ターゲットワークスペース。デフォルトでは cwd から推測し、次にデフォルトエージェントを使用）および `--json`（構造化出力）を使用できます。`propose-create`、`propose-update`、`revise` では、`--goal <text>` と `--evidence <text>` も使用でき、`--proposal` とともに提案のコンテキストを記録できます。

## 提案のコンテンツ

保留中の提案は、提案専用のフロントマターを含む `PROPOSAL.md` として保存されます。

```markdown
---
name: "morning-catchup"
description: "毎日の受信トレイ確認：トリアージ、アーカイブ、重要項目の提示、下書き、計画"
status: proposal
version: "v1"
date: "2026-05-30T00:00:00.000Z"
---
```

適用時に、Skill Workshop は有効な `SKILL.md` を書き込み、提案専用フィールドである `status`、提案の `version`、提案の `date` を削除します。

## サポートファイル

提案する Skill で `PROPOSAL.md` と同じ場所にファイルが必要な場合は、`--proposal-dir` を使用します。

```bash
openclaw skills workshop propose-create \
  --name weekly-update \
  --description "金曜日のまとめ：統計、ハイライト、来週の最重要 3 項目" \
  --proposal-dir ./weekly-update-proposal
```

ディレクトリには `PROPOSAL.md` が含まれている必要があります。サポートファイルは、`assets/`、`examples/`、`references/`、`scripts/`、`templates/` のいずれかに配置する必要があります。Skill Workshop はこれらをスキャンし、ハッシュを計算して提案とともに保存し、適用時にのみ有効な `SKILL.md` と同じ場所へ書き込みます。

次のサポートファイルパスは拒否されます：絶対パス、隠しパスセグメント、パストラバーサル、重複するパス、実行可能ファイル、UTF-8 以外のテキスト、null バイト、標準サポートフォルダー外のパス。

## エージェントツール

モデルは、必須の `action` を 1 つ指定して `skill_workshop` を使用します。
`create | update | revise | list | inspect | apply | reject | quarantine`
その他のパラメーターは、アクションに応じて適用されます。

| パラメーター               | 使用するアクション                                     | 注記                                                                      |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| `name`                     | `create`, `inspect`, `revise`                        | `create` では必須。それ以外では名前から保留中の提案を解決します           |
| `description`              | `create`, `update`, `revise`                         | 最大 160 バイト                                                           |
| `skill_name`               | `update`                                             | 既存の Skill 名またはキー                                                  |
| `proposal_content`         | `create`, `update`, `revise`                         | `PROPOSAL.md` として保存。上限は `skills.workshop.maxSkillBytes`           |
| `support_files`            | `create`, `update`, `revise`                         | `{ path, content }` の配列                                                 |
| `goal`, `evidence`         | `create`, `update`, `revise`                         | 自由記述のコンテキスト                                                     |
| `proposal_id`              | `inspect`, `revise`, `apply`, `reject`, `quarantine` | ターゲットの提案                                                           |
| `reason`                   | `apply`, `reject`, `quarantine`                      | 任意                                                                      |
| `query`, `status`, `limit` | `list`                                               | フィルタリング/ページ分割。`limit` の最大値は 50、デフォルトは 20          |

エージェントは、生成した Skill に関する作業に `skill_workshop` を使用する必要があります。`write`、`edit`、`exec`、シェルコマンド、または直接のファイルシステム操作を通じて提案ファイルを作成または変更してはなりません。

<Note>
`skill_workshop` は組み込みのエージェントツールであり、`tools.profile: "coding"` に含まれています。より厳格なポリシーによって非表示になっている場合は、アクティブな `tools.allow` リストに `skill_workshop` を追加します。または、明示的な `tools.allow` を含まないプロファイルをスコープで使用している場合は、`tools.alsoAllow: ["skill_workshop"]` を使用します。サンドボックス化された実行では、ホスト側の Skill Workshop ツールは構築されません。そのため、提案のレビュー操作は通常のホスト側エージェントセッションまたは CLI から実行してください。
</Note>

## 提案される Skills

OpenClaw は、対話ターンの終了時に、失敗したターンも含め、「次回」「覚えておいて」などの永続的な指示や、対応を求める訂正を検出します。次のターンで、エージェントは最後に検出したワークフローを `skill_workshop` を通じて保存することを提案し、提案を作成するかどうかはユーザーが決定します。この組み込みの提案機能だけでは、Skill の作成や変更は行われません。代わりに保留中の提案を直接作成するには、`skills.workshop.autonomous.enabled` を有効にします。

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

| 設定                       | デフォルト  | 効果                                                                                                                                                                     |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `autonomous.enabled`       | `false`     | 次のターンで最後に検出したワークフローの保存を提案する代わりに、保留中の提案を直接作成します。                                                                             |
| `allowSymlinkTargetWrites` | `false`     | 実体のターゲットが `skills.load.allowSymlinkTargets` に記載されている、ワークスペース Skill のシンボリックリンクを通じた書き込みを許可します。                            |
| `approvalPolicy`           | `"pending"` | `"pending"` では、エージェントによって開始された `apply`、`reject`、`quarantine` の前に承認プロンプトが必要です。`"auto"` ではプロンプトを省略します（アクションの呼び出しは引き続きエージェントが行う必要があります）。 |
| `maxPending`               | `50`        | ワークスペースごとの保留中および隔離済みの提案数を制限します（1～200）。                                                                                                  |
| `maxSkillBytes`            | `40000`     | 提案本文のサイズをバイト単位で制限します（1024～200000）。                                                                                                               |

自律キャプチャは、将来に向けたルール（例：「今後は」）と、対応を求める訂正（例：「それは私が依頼したものではありません」）を認識します。新しい指示をトピックごとにグループ化し、1 ターンあたり最大 3 件の提案を作成します。また、語彙が一致する場合は既存の書き込み可能なワークスペース Skills に振り分け、同じ Skill を対象とする別の訂正があった場合は、自身の保留中の提案を改訂します。

提案の説明は、`maxSkillBytes` にかかわらず、常に 160 バイトに制限されます。

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

`requestRevision` は Gateway 専用です（CLI またはエージェントツールに相当する機能はありません）。これは、エージェントに新しい内容をそのまま送信させるのではなく修正を依頼する UI 向けに、`PROPOSAL.md` を直接置き換える代わりに、自由記述の修正指示を所有エージェントのチャットセッションへ転送します。

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
- `proposals.json`: 高速な一覧表示用インデックス。提案フォルダーから再構築できます。
- `PROPOSAL.md`: 保留中のスキル提案。
- `rollback.json`: 適用によって実ファイルが変更される前に書き込まれる復旧メタデータ。

## 制限

| 制限                            | 値                                                                   |
| ------------------------------- | -------------------------------------------------------------------- |
| 説明                            | 160 バイト                                                           |
| 提案本文                        | `skills.workshop.maxSkillBytes`（デフォルト 40,000、上限 1 MiB）     |
| サポートファイル                | 提案ごとに 64                                                        |
| サポートファイルのサイズ        | 1 ファイルあたり 256 KiB、合計 2 MiB                                 |
| 保留中 + 隔離済みの提案         | ワークスペースごとに `skills.workshop.maxPending`（デフォルト 50）   |

## トラブルシューティング

| 問題                                           | 解決策                                                                                                                                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Skill proposal description is too large`      | `description` を 160 バイト以下に短縮します。                                                                                                                                                               |
| `Skill proposal content is too large`          | 提案本文を短縮するか、`skills.workshop.maxSkillBytes` を引き上げます。                                                                                                                                       |
| `Target skill changed after proposal creation` | 現在の対象に合わせて提案を修正するか、新しい提案を作成します。                                                                                                                                              |
| `Proposal scan failed`                         | スキャナーの検出結果を確認してから、提案を修正または隔離します。                                                                                                                                            |
| `untrusted symlink target`                     | 意図的に共有するスキルルートの場合に限り、`skills.load.allowSymlinkTargets` を設定し、`skills.workshop.allowSymlinkTargetWrites` を有効にします。                                                             |
| `Support file paths must be under one of...`   | サポートファイルを `assets/`、`examples/`、`references/`、`scripts/`、または `templates/` の配下へ移動します。                                                                                                |
| 提案が一覧に表示されない                       | 選択した `--agent` ワークスペースと `OPENCLAW_STATE_DIR` を確認します。                                                                                                                                      |
| エージェントが `skill_workshop` を呼び出せない | 有効なツールポリシーと実行モードを確認します。`coding` にはこのツールが含まれます。制限的な `tools.allow` ポリシーでは明示的に指定する必要があり、サンドボックス化された実行では通常のホスト側エージェントセッションまたは CLI を使用する必要があります。 |

### ツールポリシーの診断

自律的なキャプチャが有効な場合、`openclaw doctor` はデフォルトエージェントに対して `core/doctor/skill-workshop-tool-policy` チェックを実行します。ポリシーによって `skill_workshop` が非表示になっている場合、警告には除外している最初の設定レイヤーと、必要な `allow` または `alsoAllow` の正確な変更内容が示されます。古いランブックでは引き続き `openclaw plugins inspect skill-workshop` を使用している場合がありますが、このコマンドは現在、Skill Workshop が組み込みであることを説明し、該当する場合は同じポリシーのヒントを表示します。

## 関連項目

- 読み込み順序、優先順位、可視性については [Skills](/ja-JP/tools/skills)
- 手書きの `SKILL.md` の基本については [スキルの作成](/ja-JP/tools/creating-skills)
- `skills.workshop` の完全なスキーマについては [Skills の設定](/ja-JP/tools/skills-config)
- `openclaw skills` コマンドについては [Skills CLI](/ja-JP/cli/skills)
