---
read_when:
    - 利用可能で実行準備ができている Skills を確認したい
    - ClawHub を検索するか、ClawHub、Git、またはローカルディレクトリから Skills をインストールしたい場合
    - ClawHubでClawHubスキルを検証したい場合
    - Skills のバイナリ/env/config 不足をデバッグしたい
summary: '`openclaw skills` の CLI リファレンス（検索/インストール/更新/検証/一覧/情報/チェック/ワークショップ）'
title: Skills
x-i18n:
    generated_at: "2026-07-05T11:13:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ローカルのSkillsを調査し、ClawHubを検索し、ClawHub/Git/ローカル
ディレクトリからSkillsをインストールし、ClawHubのSkillsを検証し、ClawHubで追跡されているインストールを更新します。

関連:

- Skillsシステム: [Skills](/ja-JP/tools/skills)
- Skill Workshop: [Skill Workshop](/ja-JP/tools/skill-workshop)
- Skills設定: [Skills設定](/ja-JP/tools/skills-config)
- ClawHubインストール: [ClawHub](/ja-JP/clawhub/cli)

## コマンド

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`、`update`、`verify` はClawHubを直接使用します。`install @owner/<slug>` はClawHubのSkillsをインストールし、`install git:owner/repo[@ref]` はGitのSkillsをクローンし、
`install ./path` はローカルのSkillsディレクトリをコピーします。既定では、`install`、
`update`、`verify` はアクティブなワークスペースの `skills/` ディレクトリを対象にします。
`--global` を指定すると、共有の管理対象Skillsディレクトリを対象にします。`list`/`info`/`check`
は引き続き、現在のワークスペースと設定から見えるローカルSkillsを調査します。
ワークスペースに基づくコマンドは、まず `--agent <id>` から対象ワークスペースを解決し、
次に現在の作業ディレクトリが設定済みのエージェントワークスペース内にある場合はそこから解決し、
最後に既定のエージェントを使用します。

Gitおよびローカルディレクトリからのインストールでは、ソースルートに `SKILL.md` が必要です。
インストールのスラッグは、有効な場合は `SKILL.md` のフロントマター `name` から取得され、
次にソースディレクトリ名またはリポジトリ名から取得されます。上書きするには `--as <slug>` を使用します。
`--version` はClawHub専用です。Skillsのインストールはnpmパッケージ仕様やzip/アーカイブパスをサポートせず、
`openclaw skills update` はClawHubで追跡されているインストールのみを更新します。

オンボーディングまたはSkills設定からトリガーされる、Gatewayに基づくSkills依存関係インストールは、
代わりに別の `skills.install` リクエストパスを使用します。

注記:

| フラグ/動作                    | 説明                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | 任意のクエリです。省略すると、既定のClawHub検索フィードを閲覧します。                                                                                                                                                                                                                |
| `search --limit <n>`             | 返される結果数を制限します。                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | GitのSkillsをインストールします。ブランチrefには、`git:owner/repo@feature/foo` のようにスラッシュを含められます。                                                                                                                                                                                      |
| `install ./path/to/skill`        | ルートに `SKILL.md` を含むローカルディレクトリをインストールします。                                                                                                                                                                                                                        |
| `install --as <slug>`            | Gitおよびローカルディレクトリからのインストールで推定されたスラッグを上書きします。                                                                                                                                                                                                                 |
| `install --version <version>`    | ClawHubのSkills refにのみ適用されます。                                                                                                                                                                                                                                               |
| `install --force`                | 同じスラッグの既存ワークスペースSkillsフォルダーを上書きします。                                                                                                                                                                                                                  |
| `install/update --force-install` | ClawHubのスキャンが完了する前に、保留中のGitHubベースのClawHub Skillsをインストールします。                                                                                                                                                                                                   |
| `--global`                       | 共有の管理対象Skillsディレクトリを対象にします。`--agent <id>` とは併用できません。                                                                                                                                                                                                  |
| `--agent <id>`                   | 設定済みの1つのエージェントワークスペースを対象にします。現在の作業ディレクトリによる推定を上書きします。                                                                                                                                                                                            |
| `update @owner/<slug>`           | 追跡対象のSkillsを1つ更新します。ワークスペースではなく共有の管理対象Skillsディレクトリを対象にするには、`--global` を追加します。                                                                                                                                                            |
| `update --all`                   | 選択したワークスペース内、または `--global` を指定した場合は共有の管理対象Skillsディレクトリ内で、追跡対象のClawHubインストールを更新します。                                                                                                                                                               |
| `verify @owner/<slug>`           | 既定ではClawHubの `clawhub.skill.verify.v1` JSONエンベロープを出力します。JSONがすでに既定のため、`--json` フラグはありません。Skillsがすでにインストール済み、または曖昧でない場合は互換性のため裸のスラッグも受け付けます。所有者修飾付きrefは公開者の曖昧さを避けます。 |
| `verify` 来歴              | ClawHubがサーバー解決済みのソース来歴を返す場合、検証JSONにはコミット固定の `openclaw.verifiedSourceUrl` も含まれます。利用できないソースURLや自己申告のソースURLは、生の来歴エンベロープ内にのみ残り、昇格されません。                                           |
| `verify` バージョンセレクター        | `verify` はインストール済みのClawHub Skillsに `.clawhub/origin.json` を使用するため、インストール元のレジストリに対してインストール済みバージョンを検証します。`--version` と `--tag` はバージョンセレクターを上書きしますが、originメタデータが存在する場合はそのインストール済みレジストリを維持します。                    |
| `verify --card`                  | JSONの代わりに生成されたSkill Card Markdownを出力します。ClawHubが `ok: false` または `decision: "fail"` を返した場合、非ゼロで終了します。署名がないことは、ClawHubポリシーが変更されない限り情報扱いです。                                                                             |
| Skill Cardフィンガープリント           | インストール済みのClawHubバンドルには、生成された `skill-card.md` を含められます。OpenClawは検証をClawHubサーバーの判断として扱い、その生成カードによってバンドルフィンガープリントが変わるという理由だけでは、インストール済みSkillsを拒否しません。                                              |
| `check --agent <id>`             | 選択したエージェントのワークスペースをチェックし、準備完了のSkillsのうち、そのエージェントのプロンプトまたはコマンドサーフェスから実際に見えるものを報告します。                                                                                                                                              |
| `list`                           | サブコマンドが指定されない場合の既定アクションです。                                                                                                                                                                                                                                    |
| `list`/`info`/`check` 出力     | レンダリング済みの出力はstdoutに送られます。`--json` を指定すると、パイプやスクリプト向けの機械可読ペイロードはstdoutに残ります。                                                                                                                                                                |

コミュニティClawHub Skillsのインストールと更新は、ダウンロード前に信頼性を確認します。
バージョン付きのコミュニティアーカイブリリースは、完全一致リリースの信頼メタデータを使用します。
リゾルバーに基づくGitHub Skillsは、固定コミットを返す前にスキャンと強制インストールポリシーを適用するため、
ClawHubのインストールリゾルバーに依存します。そのスキャンが完了する前に、保留中のGitHubベースのSkillsを
インストールするには `--force-install` を使用します。悪意のある、またはブロックされたコミュニティリリースは拒否されます。リスクのある
コミュニティリリースではレビューが必要で、非対話コマンドをそのレビュー後も続行する場合は
`--acknowledge-clawhub-risk` が必要です。公式ClawHub
Skills公開者とバンドル済みOpenClaw Skillsソースは、このリリース信頼プロンプトをバイパスします。

## Skill Workshop

`openclaw skills workshop` は、選択したワークスペース内の保留中Skills提案を管理します。
提案は適用されるまでアクティブなSkillsではありません。提案の
ストレージ、サポートファイルの保護、Gatewayメソッド、承認ポリシーについては、
[Skill Workshop](/ja-JP/tools/skill-workshop) を参照してください。

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`propose-create`、`propose-update`、`revise` は、提案の動機と裏付けとなるメモを `--proposal`/`--proposal-dir` の内容とともに記録するために、`--goal <text>` と `--evidence <text>` も受け付けます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Skills](/ja-JP/tools/skills)
