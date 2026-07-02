---
read_when:
    - ClawHubを初めて使う
    - レジストリから Skill または Plugin をインストールする
    - ClawHub への公開
summary: 'ClawHub の利用を開始: Skills や Plugin を検索、インストール、更新、公開します。'
x-i18n:
    generated_at: "2026-07-02T07:57:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHub は OpenClaw のスキルとプラグインのレジストリです。

OpenClaw に何かをインストールするときは OpenClaw を使います。サインイン、公開、自分のリスティングの管理、またはレジストリ固有のワークフローを使うときは `clawhub` CLI を使います。

## スキルを探してインストールする

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

OpenClaw はスキルの入手元を記録するため、後続の更新でも ClawHub 経由で解決し続けることができます。

## プラグインを探してインストールする

OpenClaw から検索します。

```bash
openclaw plugins search "calendar"
```

明示的な ClawHub ソースで、ClawHub がホストするプラグインをインストールします。

```bash
openclaw plugins install clawhub:<package>
```

インストール済みのプラグインを更新します。

```bash
openclaw plugins update --all
```

OpenClaw に npm や別のソースではなく ClawHub 経由でパッケージを解決させたい場合は、`clawhub:` プレフィックスを使います。

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

ヘッドレス環境では、ClawHub web UI の API トークンを使用できます。

```bash
clawhub login --token clh_...
```

## スキルを公開する

スキルは、必須の `SKILL.md` ファイルと任意の補助ファイルを含むフォルダーです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

このコマンドは変更のない内容をスキップします。新しいスキルは `1.0.0` から始まり、以降の変更では次のパッチバージョンが自動的に公開されます。プレビューするには `--dry-run` を、明示的なバージョンを選ぶには `--version` を使います。

公開する前に、`SKILL.md` のメタデータを確認してください。ユーザーがインストール前にスキルに必要なものを理解できるように、必要な環境変数、ツール、権限を宣言します。[スキル形式](/ja-JP/clawhub/skill-format) を参照してください。

複数のスキルを含むリポジトリでは、再利用可能な GitHub ワークフローが `skills/` 直下の各スキルフォルダーに対して `skill publish` を呼び出します。

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## プラグインを公開する

ローカルフォルダー、GitHub リポジトリ、GitHub ref、または既存のアーカイブからプラグインを公開します。

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

公開せずに解決済みパッケージメタデータ、互換性フィールド、ソース帰属、アップロード計画をプレビューするには、先に `--dry-run` を使います。

コードプラグインは、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む OpenClaw 互換性メタデータを `package.json` に含める必要があります。

## インストール前に検査する

インストール前に、ClawHub web ページまたは CLI の詳細コマンドを使って、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を検査します。

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公開リスティングには最新のスキャン状態が表示されます。モデレーションにより保留またはブロックされているリリースは、解決されるまで検索およびインストール画面から非表示になる場合があります。
