---
read_when:
    - ClawHubを初めて使う場合
    - レジストリからスキルまたはPluginをインストールする
    - ClawHub への公開
summary: 'ClawHub の利用を開始する: Skills や plugins を検索、インストール、更新、公開します。'
x-i18n:
    generated_at: "2026-05-11T20:24:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHub は OpenClaw のスキルとプラグインのレジストリです。

OpenClaw に何かをインストールするときは OpenClaw を使用します。サインイン、公開、自分のリスティングの管理、またはレジストリ固有のワークフローを使用するときは `clawhub` CLI を使用します。

## スキルを探してインストールする

OpenClaw から検索します。

```bash
openclaw skills search "calendar"
```

スキルをインストールします。

```bash
openclaw skills install <skill-slug>
```

インストール済みのスキルを更新します。

```bash
openclaw skills update --all
```

OpenClaw はスキルの取得元を記録するため、後続の更新でも ClawHub 経由で解決し続けることができます。

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

ヘッドレス環境では、ClawHub の Web UI から API トークンを使用できます。

```bash
clawhub login --token clh_...
```

## スキルを公開する

スキルは、必須の `SKILL.md` ファイルと任意の補助ファイルを含むフォルダーです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

公開する前に、`SKILL.md` のメタデータを確認します。必要な環境変数、ツール、権限を宣言して、ユーザーがインストール前にスキルに何が必要かを理解できるようにします。[スキル形式](/ja-JP/clawhub/skill-format)を参照してください。

## プラグインを公開する

ローカルフォルダー、GitHub リポジトリ、GitHub ref、または既存のアーカイブからプラグインを公開します。

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

公開せずに、解決されたパッケージメタデータ、互換性フィールド、ソースの帰属、アップロード計画をプレビューするには、まず `--dry-run` を使用します。

コードプラグインは、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む OpenClaw 互換性メタデータを `package.json` に含める必要があります。

## メンテナンスしているスキルを同期する

`sync` はスキルフォルダーをスキャンし、まだ同期されていない新規または変更済みのスキルを公開します。

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

サインインしている場合、`sync` は集計インストール数のために最小限のインストールスナップショットも送信することがあります。報告内容とオプトアウト方法については、[テレメトリ](/ja-JP/clawhub/telemetry)を参照してください。

## インストール前に確認する

インストールする前に、ClawHub の Web ページまたは CLI の詳細コマンドを使用して、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を確認します。

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

公開リスティングには最新のスキャン状態が表示されます。モデレーションによって保留またはブロックされているリリースは、解決されるまで検索およびインストール画面から非表示になる場合があります。
