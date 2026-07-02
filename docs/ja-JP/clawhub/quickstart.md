---
read_when:
    - ClawHub を初めて使う
    - レジストリからスキルまたはプラグインをインストールする
    - ClawHub への公開
summary: 'ClawHub の利用を開始する: Skills または Plugin を検索、インストール、更新、公開します。'
x-i18n:
    generated_at: "2026-07-02T17:33:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHub は OpenClaw のスキルと Plugin のレジストリです。

OpenClaw に何かをインストールするときは OpenClaw を使用します。サインイン、公開、自分の掲載情報の管理、またはレジストリ固有のワークフローを使用するときは `clawhub` CLI を使用します。

## スキルを見つけてインストールする

OpenClaw から検索します。

```bash
openclaw skills search "calendar"
```

スキルをインストールします。

```bash
openclaw skills install @openclaw/demo
```

インストール済みのスキルを更新します。

```bash
openclaw skills update --all
```

OpenClaw はスキルの入手元を記録するため、後続の更新でも ClawHub を通じて解決し続けることができます。

## Plugin を見つけてインストールする

OpenClaw から検索します。

```bash
openclaw plugins search "calendar"
```

明示的な ClawHub ソースを指定して、ClawHub ホストの Plugin をインストールします。

```bash
openclaw plugins install clawhub:<package>
```

インストール済みの Plugin を更新します。

```bash
openclaw plugins update --all
```

OpenClaw に npm や別のソースではなく ClawHub を通じてパッケージを解決させたい場合は、`clawhub:` プレフィックスを使用します。

## 公開のためにサインインする

ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHub でサインインします。

```bash
clawhub login
clawhub whoami
```

ヘッドレス環境では、ClawHub Web UI から取得した API トークンを使用できます。

```bash
clawhub login --token clh_...
```

## スキルを公開する

スキルは、必須の `SKILL.md` ファイルと任意のサポートファイルを含むフォルダーです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

このコマンドは変更のないコンテンツをスキップします。新しいスキルは `1.0.0` から始まり、その後の変更では次のパッチバージョンが自動的に公開されます。プレビューするには `--dry-run` を、明示的なバージョンを選ぶには `--version` を使用します。

公開する前に、`SKILL.md` のメタデータを確認してください。必要な環境変数、ツール、権限を宣言し、ユーザーがインストール前にスキルに必要なものを理解できるようにします。[スキル形式](/ja-JP/clawhub/skill-format)を参照してください。

複数のスキルを含むリポジトリでは、再利用可能な GitHub ワークフローが `skills/` 直下の各スキルフォルダーに対して `skill publish` を呼び出します。

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

公開せずに解決済みパッケージメタデータ、互換性フィールド、ソースの帰属情報、アップロード計画をプレビューするには、まず `--dry-run` を使用します。

コード Plugin には、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む OpenClaw 互換性メタデータを `package.json` に含める必要があります。

## インストール前に確認する

インストール前に、ClawHub Web ページまたは CLI の詳細コマンドを使用して、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を確認します。

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公開掲載には最新のスキャン状態が表示されます。モデレーションによって保留またはブロックされているリリースは、解決されるまで検索やインストール画面から非表示になる場合があります。
