---
read_when:
    - 利用可能ですぐ実行できる Skills を確認したい場合
    - ClawHub を検索する、または ClawHub、Git、ローカルディレクトリから Skills をインストールしたい
    - ClawHubでClawHubスキルを検証したい
    - Skills の不足しているバイナリ/env/config をデバッグしたい
summary: '`openclaw skills` の CLI リファレンス（search/install/update/verify/list/info/check/workshop）'
title: Skills
x-i18n:
    generated_at: "2026-06-27T11:03:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ローカルの Skills を検査し、ClawHub を検索し、ClawHub/Git/ローカル
ディレクトリから Skills をインストールし、ClawHub Skills を検証し、ClawHub で追跡されているインストールを更新します。

関連:

- Skills システム: [Skills](/ja-JP/tools/skills)
- Skill Workshop: [Skill Workshop](/ja-JP/tools/skill-workshop)
- Skills 設定: [Skills config](/ja-JP/tools/skills-config)
- ClawHub インストール: [ClawHub](/ja-JP/clawhub/cli)

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

`search`、`update`、`verify` は ClawHub を直接使用します。`install @owner/<slug>` は
ClawHub skill をインストールし、`install git:owner/repo[@ref]` は Git skill をクローンし、
`install ./path` はローカル skill ディレクトリをコピーします。デフォルトでは、`install`、`update`、
`verify` はアクティブなワークスペースの `skills/` ディレクトリを対象にします。`--global` を指定すると、
共有の管理対象 Skills ディレクトリを対象にします。`list`/`info`/`check` は引き続き、
現在のワークスペースと設定から見えるローカル Skills を検査します。
ワークスペースに基づくコマンドは、まず `--agent <id>` から対象ワークスペースを解決し、次に
現在の作業ディレクトリが設定済みのエージェントワークスペース内にある場合はそこから解決し、
最後にデフォルトのエージェントを使用します。

Git およびローカルディレクトリのインストールでは、ソースルートに `SKILL.md` があることを想定します。
インストール slug は、有効な場合は `SKILL.md` の frontmatter `name` から取得され、次に
ソースディレクトリ名またはリポジトリ名から取得されます。上書きするには `--as <slug>` を使用します。`--version`
は ClawHub 専用です。Skill のインストールでは npm パッケージ仕様や zip/archive
パスはサポートされず、`openclaw skills update` は ClawHub で追跡されているインストールのみを更新します。

オンボーディングまたは Skills 設定からトリガーされる Gateway ベースの skill 依存関係インストールは、
代わりに別の `skills.install` リクエストパスを使用します。

メモ:

- `search [query...]` は任意のクエリを受け付けます。省略するとデフォルトの
  ClawHub 検索フィードを閲覧します。
- `search --limit <n>` は返される結果数を制限します。
- `install git:owner/repo[@ref]` は Git skill をインストールします。ブランチ ref には
  `git:owner/repo@feature/foo` のようにスラッシュを含めることができます。
- `install ./path/to/skill` は、ルートに `SKILL.md` を含むローカルディレクトリをインストールします。
- `install --as <slug>` は、Git およびローカルディレクトリのインストールで推測された slug を上書きします。
- `install --version <version>` は ClawHub skill ref にのみ適用されます。
- `install --force` は、同じ slug の既存ワークスペース skill フォルダを上書きします。
- コミュニティ ClawHub skill のインストールと更新は、ダウンロード前に信頼性をチェックします。
  バージョン指定されたコミュニティアーカイブリリースは、厳密なリリース信頼メタデータを使用します。
  リゾルバーベースの GitHub Skills は、固定コミットを返す前にスキャンおよび強制インストールポリシーを適用する
  ClawHub のインストールリゾルバに依存します。悪意のある、またはブロックされたコミュニティリリースは拒否されます。リスクのあるコミュニティリリースでは、
  非対話型コマンドがそのレビュー後も続行すべき場合、レビューと `--acknowledge-clawhub-risk` が必要です。公式 ClawHub skill パブリッシャーとバンドルされた
  OpenClaw skill ソースは、このリリース信頼プロンプトをバイパスします。
- `--global` は共有の管理対象 Skills ディレクトリを対象にし、`--agent <id>` と組み合わせることはできません。
- `--agent <id>` は設定済みのエージェントワークスペース 1 つを対象にし、現在の
  作業ディレクトリによる推測を上書きします。
- `update @owner/<slug>` は単一の追跡対象 skill を更新します。ワークスペースではなく
  共有の管理対象 Skills ディレクトリを対象にするには `--global` を追加します。
- `update --all` は、選択されたワークスペース内の追跡対象 ClawHub インストールを更新します。または
  `--global` と組み合わせた場合は、共有の管理対象 Skills ディレクトリ内を更新します。
- `verify @owner/<slug>` はデフォルトで ClawHub の `clawhub.skill.verify.v1` JSON
  エンベロープを出力します。JSON がすでにデフォルトであるため、`--json` フラグはありません。
  skill がすでにインストール済みまたは一意に解決できる場合、互換性のために裸の slug も引き続き受け付けますが、
  owner-qualified ref はパブリッシャーの曖昧さを避けます。
- ClawHub がサーバーで解決されたソース由来情報を返す場合、検証 JSON には
  コミット固定の `openclaw.verifiedSourceUrl` も含まれます。利用できない、または
  自己申告のソース URL は raw provenance エンベロープ内にのみ残り、昇格されません。
- `verify` はインストール済みの ClawHub Skills に `.clawhub/origin.json` を使用するため、
  インストールされたバージョンを、その取得元レジストリに対して検証します。`--version`
  と `--tag` はバージョンセレクタを上書きしますが、origin メタデータが存在する場合はそのインストール済みレジストリを維持します。
- `verify --card` は JSON ではなく、生成された Skill Card Markdown を出力します。
  ClawHub が `ok: false` または `decision: "fail"` を返すと、コマンドは非ゼロで終了します。
  署名なしのシグネチャは、ClawHub ポリシーが変更されない限り情報扱いです。
- インストール済みの ClawHub バンドルには、生成された `skill-card.md` を含めることができます。OpenClaw は
  検証を ClawHub サーバーの判定として扱い、生成されたカードがバンドルの
  フィンガープリントを変更するという理由だけでは、インストール済み skill を拒否しません。
- `check --agent <id>` は選択されたエージェントのワークスペースをチェックし、ready な Skills のうち、
  そのエージェントのプロンプトまたはコマンドサーフェスから実際に見えるものを報告します。
- サブコマンドが指定されていない場合、`list` がデフォルトアクションです。
- `list`、`info`、`check` はレンダリングされた出力を stdout に書き込みます。
  `--json` の場合、機械可読ペイロードはパイプやスクリプト用に stdout に残ります。

## Skill Workshop

`openclaw skills workshop` は、選択されたワークスペース内の保留中の skill 提案を管理します。
提案は適用されるまでアクティブな Skills ではありません。提案ストレージ、
サポートファイル保護、Gateway メソッド、承認ポリシーについては、
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

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Skills](/ja-JP/tools/skills)
