---
read_when:
    - ClawHub を初めて使用する場合
    - レジストリから Skill または Plugin をインストールする
    - ClawHub への公開
summary: ClawHub を使い始める：Skills や Plugin を検索、インストール、更新、公開します。
x-i18n:
    generated_at: "2026-07-11T22:00:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHub は OpenClaw の Skills と Plugin のレジストリです。

OpenClaw に項目をインストールする場合は OpenClaw を使用します。サインイン、公開、自分の掲載情報の管理、またはレジストリ固有のワークフローを使用する場合は、`clawhub` CLI を使用します。

## Skill を検索してインストールする

OpenClaw から検索します。

```bash
openclaw skills search "calendar"
```

Skill をインストールします。

```bash
openclaw skills install @openclaw/demo
```

インストール済みの Skills を更新します。

```bash
openclaw skills update --all
```

OpenClaw は Skill の取得元を記録するため、以降の更新でも引き続き ClawHub を通じて解決できます。

## Plugin を検索してインストールする

OpenClaw から検索します。

```bash
openclaw plugins search "calendar"
```

ClawHub のソースを明示して、ClawHub でホストされている Plugin をインストールします。

```bash
openclaw plugins install clawhub:<package>
```

インストール済みの Plugin を更新します。

```bash
openclaw plugins update --all
```

OpenClaw で npm や別のソースではなく ClawHub を通じてパッケージを解決する場合は、`clawhub:` プレフィックスを使用します。

## 公開のためにサインインする

ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# または
pnpm add -g clawhub
```

GitHub でサインインします。

```bash
clawhub login
clawhub whoami
```

ヘッドレス環境では、ClawHub Web UI の API トークンを使用できます。

```bash
clawhub login --token clh_...
```

## Skill を公開する

Skill は、必須の `SKILL.md` ファイルと任意の補助ファイルを含むフォルダーです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

このコマンドは、変更されていない内容をスキップします。新しい Skills は `1.0.0` から始まり、以降の変更では次のパッチバージョンが自動的に公開されます。プレビューするには `--dry-run` を、バージョンを明示的に指定するには `--version` を使用します。

公開する前に、`SKILL.md` のメタデータを確認してください。ユーザーがインストール前に Skill の要件を理解できるよう、必要な環境変数、ツール、権限を宣言します。[Skill の形式](/ja-JP/clawhub/skill-format)を参照してください。

複数の Skills を含むリポジトリでは、再利用可能な GitHub ワークフローが `skills/` 直下の各 Skill フォルダーに対して `skill publish` を呼び出します。

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Plugin を公開する

ローカルフォルダー、GitHub リポジトリ、GitHub ref、または既存のアーカイブから Plugin を公開します。

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

公開せずに、解決されたパッケージのメタデータ、互換性フィールド、ソースの帰属情報、アップロード計画をプレビューするには、まず `--dry-run` を使用します。

コード Plugin の `package.json` には、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む OpenClaw 互換性メタデータが必要です。

## インストール前に確認する

インストール前に、ClawHub の Web ページまたは CLI の詳細表示コマンドを使用して、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を確認します。

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公開リストには最新のスキャン状態が表示されます。モデレーションによって保留またはブロックされたリリースは、解決されるまで検索画面やインストール画面に表示されない場合があります。
