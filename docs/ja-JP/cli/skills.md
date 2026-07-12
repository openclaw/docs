---
read_when:
    - 利用可能で実行準備ができている Skills を確認したい場合
    - ClawHub を検索する、または ClawHub、Git、ローカルディレクトリから Skills をインストールしたい場合
    - ClawHub で ClawHub の Skill を検証する場合
    - Skillsで不足しているバイナリ／環境変数／設定をデバッグしたい場合
summary: '`openclaw skills` の CLI リファレンス（検索/インストール/更新/検証/一覧表示/情報表示/チェック/ワークショップ）'
title: Skills
x-i18n:
    generated_at: "2026-07-11T22:09:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ローカルの Skills を検査し、ClawHub を検索し、ClawHub/Git/ローカルディレクトリから Skills をインストールし、ClawHub の Skills を検証し、ClawHub で追跡されているインストールを更新します。

関連項目:

- Skills システム: [Skills](/ja-JP/tools/skills)
- Skill ワークショップ: [Skill ワークショップ](/ja-JP/tools/skill-workshop)
- Skills 設定: [Skills 設定](/ja-JP/tools/skills-config)
- ClawHub のインストール: [ClawHub](/ja-JP/clawhub/cli)

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

`search`、`update`、`verify` は ClawHub を直接使用します。`install @owner/<slug>` は ClawHub の Skill をインストールし、`install git:owner/repo[@ref]` は Git の Skill をクローンし、`install ./path` はローカルの Skill ディレクトリをコピーします。デフォルトでは、`install`、`update`、`verify` の対象はアクティブなワークスペースの `skills/` ディレクトリです。`--global` を指定すると、共有の管理対象 Skills ディレクトリが対象になります。`list`/`info`/`check` は引き続き、現在のワークスペースと設定から参照できるローカルの Skills を検査します。ワークスペースを使用するコマンドは、まず `--agent <id>`、次に現在の作業ディレクトリが設定済みのエージェントワークスペース内にある場合はそのワークスペース、最後にデフォルトのエージェントの順で対象ワークスペースを解決します。

Git およびローカルディレクトリからのインストールでは、ソースのルートに `SKILL.md` が必要です。インストール時のスラッグには、有効な場合は `SKILL.md` のフロントマターにある `name` が使用され、次にソースディレクトリ名またはリポジトリ名が使用されます。上書きするには `--as <slug>` を使用します。`--version` は ClawHub 専用です。Skill のインストールでは、npm パッケージ指定や zip/アーカイブのパスはサポートされません。また、`openclaw skills update` が更新するのは、ClawHub で追跡されているインストールだけです。

オンボーディングまたは Skills 設定からトリガーされる、Gateway を利用した Skill の依存関係のインストールでは、代わりに別の `skills.install` リクエストパスを使用します。

注記:

| フラグ/動作                     | 説明                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | クエリは任意です。省略すると、ClawHub のデフォルト検索フィードを閲覧します。                                                                                                                                                                                                                |
| `search --limit <n>`             | 返される結果数を制限します。                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | Git の Skill をインストールします。ブランチ参照には、`git:owner/repo@feature/foo` のようにスラッシュを含めることができます。                                                                                                                                                                                      |
| `install ./path/to/skill`        | ルートに `SKILL.md` があるローカルディレクトリをインストールします。                                                                                                                                                                                                                        |
| `install --as <slug>`            | Git およびローカルディレクトリからのインストールで推測されたスラッグを上書きします。                                                                                                                                                                                                                 |
| `install --version <version>`    | ClawHub の Skill 参照にのみ適用されます。                                                                                                                                                                                                                                               |
| `install --force`                | 同じスラッグの既存のワークスペース Skill フォルダーを上書きします。                                                                                                                                                                                                                  |
| `install/update --force-install` | ClawHub のスキャンが完了する前に、保留中の GitHub ベースの ClawHub Skill をインストールします。                                                                                                                                                                                                   |
| `--global`                       | 共有の管理対象 Skills ディレクトリを対象にします。`--agent <id>` と同時には使用できません。                                                                                                                                                                                                  |
| `--agent <id>`                   | 設定済みのエージェントワークスペースを1つ対象にします。現在の作業ディレクトリによる推測より優先されます。                                                                                                                                                                                            |
| `update @owner/<slug>`           | 追跡対象の Skill を1つ更新します。ワークスペースではなく共有の管理対象 Skills ディレクトリを対象にするには、`--global` を追加します。                                                                                                                                                            |
| `update --all`                   | 選択したワークスペース内で追跡されている ClawHub のインストールを更新します。`--global` を指定した場合は、共有の管理対象 Skills ディレクトリ内のインストールを更新します。                                                                                                                                                               |
| `verify @owner/<slug>`           | デフォルトで ClawHub の `clawhub.skill.verify.v1` JSON エンベロープを出力します。JSON がすでにデフォルトであるため、`--json` フラグはありません。Skill がインストール済みか一意に特定できる場合は、互換性のため所有者なしのスラッグも受け付けます。所有者付きの参照を使用すると、公開者の曖昧さを回避できます。 |
| `verify` の来歴                  | ClawHub がサーバーで解決したソースの来歴を返す場合、検証用 JSON にはコミットに固定された `openclaw.verifiedSourceUrl` も含まれます。利用できない、または自己申告されたソース URL は未加工の来歴エンベロープにのみ残り、昇格されません。                                           |
| `verify` のバージョン選択        | `verify` はインストール済みの ClawHub Skills に `.clawhub/origin.json` を使用するため、インストール元のレジストリに対してインストール済みバージョンを検証します。`--version` と `--tag` はバージョン選択を上書きしますが、オリジンメタデータが存在する場合は、インストール済みのレジストリを維持します。                    |
| `verify --card`                  | JSON の代わりに生成された Skill カードの Markdown を出力します。ClawHub が `ok: false` または `decision: "fail"` を返した場合は、ゼロ以外の終了コードで終了します。ClawHub のポリシーが変更されない限り、署名なしのシグネチャは情報提供のみです。                                                                             |
| Skill カードのフィンガープリント | インストール済みの ClawHub バンドルには、生成された `skill-card.md` が含まれる場合があります。OpenClaw は検証を ClawHub サーバーの判断として扱い、生成されたカードによってバンドルのフィンガープリントが変わったという理由だけでは、インストール済みの Skill を拒否しません。                                              |
| `check --agent <id>`             | 選択したエージェントのワークスペースを確認し、準備済みの Skills のうち、そのエージェントのプロンプトまたはコマンド面で実際に参照できるものを報告します。                                                                                                                                              |
| `list`                           | サブコマンドを指定しない場合のデフォルトのアクションです。                                                                                                                                                                                                                                    |
| `list`/`info`/`check` の出力     | レンダリングされた出力は stdout に送られます。`--json` を指定すると、パイプやスクリプト用の機械可読ペイロードは stdout に維持されます。                                                                                                                                                                |

コミュニティの ClawHub Skills をインストールまたは更新する際は、ダウンロード前に信頼性を確認します。バージョン付きのコミュニティアーカイブリリースでは、該当リリースの正確な信頼メタデータを使用します。リゾルバーを利用する GitHub Skills では、固定されたコミットを返す前にスキャンと強制インストールのポリシーを適用するため、ClawHub のインストールリゾルバーを使用します。スキャンが完了する前に保留中の GitHub ベースの Skill をインストールするには、`--force-install` を使用します。悪意がある、またはブロックされたコミュニティリリースは拒否されます。リスクのあるコミュニティリリースではレビューが必要です。非対話型コマンドでそのレビュー後も続行するには、`--acknowledge-clawhub-risk` が必要です。ClawHub の公式 Skill 公開者と OpenClaw に同梱される Skill ソースでは、このリリース信頼性のプロンプトを省略します。

## Skill ワークショップ

`openclaw skills workshop` は、選択したワークスペース内の保留中の Skill 提案を管理します。提案は適用されるまでアクティブな Skills にはなりません。提案の保存、サポートファイルの安全策、Gateway メソッド、承認ポリシーについては、[Skill ワークショップ](/ja-JP/tools/skill-workshop)を参照してください。

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

`propose-create`、`propose-update`、`revise` では、`--proposal`/`--proposal-dir` の内容とともに提案の動機と裏付けとなるメモを記録するため、`--goal <text>` と `--evidence <text>` も指定できます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Skills](/ja-JP/tools/skills)
