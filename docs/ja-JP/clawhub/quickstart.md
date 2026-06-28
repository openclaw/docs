---
read_when:
    - ClawHub を初めて使う
    - レジストリからスキルまたはプラグインをインストールする
    - ClawHub への公開
summary: 'ClawHub の使用を開始する: Skills または plugins を検索、インストール、更新、公開します。'
x-i18n:
    generated_at: "2026-06-28T00:11:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHubはOpenClawのSkillsとPluginのレジストリです。

OpenClawに何かをインストールする場合はOpenClawを使用します。サインイン、公開、自分のリスティングの管理、またはレジストリ固有のワークフローを使用する場合は、`clawhub` CLIを使用します。

## Skillを見つけてインストールする

OpenClawから検索します。

```bash
openclaw skills search "calendar"
```

Skillをインストールします。

```bash
openclaw skills install @openclaw/demo
```

インストール済みのSkillsを更新します。

```bash
openclaw skills update --all
```

OpenClawはSkillの入手元を記録するため、以後の更新でもClawHub経由で解決し続けられます。

## Pluginを見つけてインストールする

OpenClawから検索します。

```bash
openclaw plugins search "calendar"
```

明示的なClawHubソースを指定して、ClawHubでホストされるPluginをインストールします。

```bash
openclaw plugins install clawhub:<package>
```

インストール済みのPluginを更新します。

```bash
openclaw plugins update --all
```

OpenClawにnpmや別のソースではなくClawHub経由でパッケージを解決させたい場合は、`clawhub:`プレフィックスを使用します。

## 公開のためにサインインする

ClawHub CLIをインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHubでサインインします。

```bash
clawhub login
clawhub whoami
```

ヘッドレス環境では、ClawHub web UIのAPIトークンを使用できます。

```bash
clawhub login --token clh_...
```

## Skillを公開する

Skillは、必須の`SKILL.md`ファイルと任意の補助ファイルを含むフォルダです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

このコマンドは変更のないコンテンツをスキップします。新しいSkillsは`1.0.0`から始まり、以後の変更では次のパッチバージョンが自動的に公開されます。プレビューするには`--dry-run`を使用し、明示的なバージョンを選ぶには`--version`を使用します。

公開前に、`SKILL.md`内のメタデータを確認してください。必要な環境変数、ツール、権限を宣言し、ユーザーがインストール前にSkillに必要なものを理解できるようにします。[Skill形式](/ja-JP/clawhub/skill-format)を参照してください。

複数のSkillsを含むリポジトリでは、再利用可能なGitHubワークフローが`skills/`直下の各Skillフォルダに対して`skill publish`を呼び出します。

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Pluginを公開する

ローカルフォルダ、GitHubリポジトリ、GitHub ref、または既存のアーカイブからPluginを公開します。

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

公開せずに解決済みパッケージメタデータ、互換性フィールド、ソース帰属、アップロード計画をプレビューするには、まず`--dry-run`を使用します。

コードPluginには、`package.json`内にOpenClaw互換性メタデータを含める必要があります。これには`openclaw.compat.pluginApi`と`openclaw.build.openclawVersion`が含まれます。

## インストール前に調べる

インストール前に、ClawHubのWebページまたはCLIの詳細コマンドを使用して、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を調べます。

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公開リスティングには最新のスキャン状態が表示されます。モデレーションにより保留またはブロックされているリリースは、解決されるまで検索およびインストール画面に表示されない場合があります。
