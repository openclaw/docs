---
read_when:
    - ClawHubを初めて使用する場合
    - レジストリからスキルまたはプラグインをインストールする
    - ClawHub への公開
summary: 'ClawHub の使用を開始する: Skills または plugins を検索、インストール、更新、公開します。'
x-i18n:
    generated_at: "2026-05-12T12:49:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# クイックスタート

ClawHub は OpenClaw のスキルとプラグインのレジストリです。

OpenClaw にものをインストールするときは OpenClaw を使用します。サインイン、公開、自分の掲載情報の管理、またはレジストリ固有のワークフローを使用するときは `clawhub` CLI を使用します。

## スキルを見つけてインストールする

OpenClaw から検索します:

```bash
openclaw skills search "calendar"
```

スキルをインストールします:

```bash
openclaw skills install <skill-slug>
```

インストール済みのスキルを更新します:

```bash
openclaw skills update --all
```

OpenClaw はスキルの入手元を記録するため、以後の更新でも ClawHub を通じて解決し続けることができます。

## プラグインを見つけてインストールする

OpenClaw から検索します:

```bash
openclaw plugins search "calendar"
```

ClawHub でホストされているプラグインを、明示的な ClawHub ソース付きでインストールします:

```bash
openclaw plugins install clawhub:<package>
```

インストール済みのプラグインを更新します:

```bash
openclaw plugins update --all
```

npm や別のソースではなく ClawHub 経由でパッケージを解決させたい場合は、`clawhub:` プレフィックスを使用します。

## 公開のためにサインインする

ClawHub CLI をインストールします:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

GitHub でサインインします:

```bash
clawhub login
clawhub whoami
```

ヘッドレス環境では、ClawHub Web UI の API トークンを使用できます:

```bash
clawhub login --token clh_...
```

## スキルを公開する

スキルは、必須の `SKILL.md` ファイルと任意の補助ファイルを含むフォルダです。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

公開する前に、`SKILL.md` のメタデータを確認してください。必要な環境変数、ツール、権限を宣言して、ユーザーがインストール前にそのスキルに何が必要かを理解できるようにします。[スキル形式](/ja-JP/clawhub/skill-format)を参照してください。

## プラグインを公開する

ローカルフォルダ、GitHub リポジトリ、GitHub ref、または既存のアーカイブからプラグインを公開します:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

公開せずに、解決されたパッケージメタデータ、互換性フィールド、ソース帰属、アップロード計画をプレビューするには、最初に `--dry-run` を使用します。

コードプラグインは、`package.json` に OpenClaw 互換性メタデータを含める必要があります。これには `openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` が含まれます。

## メンテナンスしているスキルを同期する

`sync` はスキルフォルダをスキャンし、まだ同期されていない新規または変更済みのスキルを公開します。

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

サインインしている場合、`sync` は集計インストール数のために最小限のインストールスナップショットも送信することがあります。報告される内容とオプトアウト方法については、[テレメトリ](/ja-JP/clawhub/telemetry)を参照してください。

## インストール前に確認する

インストールする前に、ClawHub の Web ページまたは CLI の詳細コマンドを使用して、メタデータ、ソースリンク、バージョン、変更履歴、スキャン状態を確認します:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

公開掲載情報には最新のスキャン状態が表示されます。モデレーションによって保留またはブロックされているリリースは、解決されるまで検索およびインストール画面から非表示になる場合があります。
