---
read_when:
    - ClawHubを初めて使う
    - レジストリから skill または plugin をインストールする
    - ClawHub への公開
summary: 'ClawHub の使用を開始する: Skills や Plugin を検索、インストール、更新、公開します。'
x-i18n:
    generated_at: "2026-07-05T20:17:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHub は OpenClaw の Skills と plugins のレジストリです。

OpenClaw にものをインストールするときは OpenClaw を使用します。サインイン、公開、自分のリスティングの管理、またはレジストリ固有のワークフローを使用するときは、`clawhub` CLI を使用します。

## skill を検索してインストールする

OpenClaw から検索します。

```bash
openclaw skills search "calendar"
```

skill をインストールします。

```bash
openclaw skills install @openclaw/demo
```

インストール済みの skills を更新します。

```bash
openclaw skills update --all
```

OpenClaw は skill の取得元を記録するため、後続の更新でも ClawHub 経由で解決し続けることができます。

## plugin を検索してインストールする

OpenClaw から検索します。

```bash
openclaw plugins search "calendar"
```

ClawHub でホストされている plugin を、明示的な ClawHub ソースでインストールします。

```bash
openclaw plugins install clawhub:<package>
```

インストール済みの plugins を更新します。

```bash
openclaw plugins update --all
```

OpenClaw に npm や別のソースではなく ClawHub 経由でパッケージを解決させたい場合は、`clawhub:` プレフィックスを使用します。

## 公開用にサインインする

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

ヘッドレス環境では、ClawHub Web UI から API トークンを使用できます。

```bash
clawhub login --token clh_...
```

## skill を公開する

skill は、必須の `SKILL.md` ファイルと任意の補助ファイルを含むフォルダーです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

このコマンドは変更のない内容をスキップします。新しい skills は `1.0.0` から始まり、以降の変更では次のパッチバージョンが自動的に公開されます。プレビューするには `--dry-run` を、明示的なバージョンを選択するには `--version` を使用します。

公開する前に、`SKILL.md` のメタデータを確認してください。必須の環境変数、ツール、権限を宣言し、ユーザーがインストール前にその skill に必要なものを理解できるようにします。[skill 形式](/ja-JP/clawhub/skill-format) を参照してください。

複数の skills を含むリポジトリでは、再利用可能な GitHub ワークフローが `skills/` 直下の各 skill フォルダーに対して `skill publish` を呼び出します。

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## plugin を公開する

ローカルフォルダー、GitHub リポジトリ、GitHub ref、または既存のアーカイブから plugin を公開します。

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

公開せずに、解決されたパッケージメタデータ、互換性フィールド、ソース帰属、アップロード計画をプレビューするには、まず `--dry-run` を使用します。

コード plugins には、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む OpenClaw 互換性メタデータを `package.json` に含める必要があります。

## インストール前に確認する

インストール前に、ClawHub Web ページまたは CLI の詳細コマンドを使用して、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を確認します。

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公開リスティングには最新のスキャン状態が表示されます。モデレーションにより保留またはブロックされているリリースは、解決されるまで検索やインストール画面から非表示になる場合があります。
