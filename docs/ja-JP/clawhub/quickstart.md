---
read_when:
    - 初めてClawHubを使う場合
    - レジストリから skill または plugin をインストールする
    - ClawHub への公開
summary: 'ClawHub の利用を開始: Skills やプラグインを見つけ、インストールし、更新し、公開します。'
x-i18n:
    generated_at: "2026-07-02T13:58:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHub は OpenClaw のスキルとプラグインのレジストリです。

OpenClaw にものをインストールするときは OpenClaw を使用します。サインイン、公開、自分の一覧の管理、またはレジストリ固有のワークフローを使用するときは `clawhub` CLI を使用します。

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

OpenClaw はスキルの取得元を記録するため、以後の更新でも ClawHub 経由で解決し続けられます。

## プラグインを探してインストールする

OpenClaw から検索します。

```bash
openclaw plugins search "calendar"
```

明示的な ClawHub ソースを指定して、ClawHub でホストされているプラグインをインストールします。

```bash
openclaw plugins install clawhub:<package>
```

インストール済みのプラグインを更新します。

```bash
openclaw plugins update --all
```

OpenClaw に npm や別のソースではなく ClawHub 経由でパッケージを解決させたい場合は、`clawhub:` プレフィックスを使用します。

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

ヘッドレス環境では、ClawHub Web UI の API トークンを使用できます。

```bash
clawhub login --token clh_...
```

## スキルを公開する

スキルは、必須の `SKILL.md` ファイルと任意の補助ファイルを含むフォルダです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

このコマンドは変更のない内容をスキップします。新しいスキルは `1.0.0` から始まり、以後の変更では次のパッチバージョンが自動的に公開されます。プレビューするには `--dry-run` を、明示的なバージョンを選ぶには `--version` を使用します。

公開する前に、`SKILL.md` のメタデータを確認してください。必要な環境変数、ツール、権限を宣言し、ユーザーがインストール前にそのスキルに何が必要かを理解できるようにします。[スキル形式](/ja-JP/clawhub/skill-format) を参照してください。

複数のスキルを含むリポジトリでは、再利用可能な GitHub ワークフローが `skills/` 直下の各スキルフォルダに対して `skill publish` を呼び出します。

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## プラグインを公開する

ローカルフォルダ、GitHub リポジトリ、GitHub ref、または既存のアーカイブからプラグインを公開します。

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

公開せずに、解決されたパッケージメタデータ、互換性フィールド、ソース帰属情報、アップロード計画をプレビューするには、まず `--dry-run` を使用します。

コードプラグインは、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む OpenClaw 互換性メタデータを `package.json` に含める必要があります。

## インストール前に確認する

インストール前に、ClawHub Web ページまたは CLI の詳細コマンドを使用して、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を確認します。

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公開一覧には最新のスキャン状態が表示されます。モデレーションによって保留またはブロックされているリリースは、解決されるまで検索およびインストール画面に表示されない場合があります。
