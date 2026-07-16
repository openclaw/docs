---
read_when:
    - ClawHubとは何かを説明する
    - Skills または Plugin の検索、インストール、更新
    - レジストリへの Skills または Plugin の公開
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、および clawhub CLI に関する ClawHub の公開概要。
title: ClawHub
x-i18n:
    generated_at: "2026-07-16T11:27:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw の Skills とプラグイン向けの公開レジストリです。

- ネイティブの `openclaw` コマンドを使用して、Skills の検索、インストール、更新、および ClawHub からのプラグインのインストールを行います。
- レジストリの認証、公開、削除／削除取り消しのワークフローには、別途 `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw で Skills を検索してインストールします。

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw でプラグインを検索してインストールします。

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

公開や削除／削除取り消しなど、レジストリ認証が必要なワークフローを使用する場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# または
pnpm add -g clawhub
```

## ClawHub がホストするもの

| 対象           | 保存するもの                                                   | 代表的なコマンド                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` と関連ファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install @openclaw/demo`     |
| コードプラグイン | 互換性メタデータを含む OpenClaw プラグインパッケージ          | `openclaw plugins install clawhub:<package>` |
| バンドルプラグイン | OpenClaw で配布するためにパッケージ化されたプラグインバンドル | `clawhub package publish <source>`           |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター数、セキュリティスキャンの概要を追跡します。公開ページにはレジストリの現在の状態が表示されるため、ユーザーはインストール前に Skills やプラグインを確認できます。

## OpenClaw ネイティブのフロー

OpenClaw のネイティブコマンドは、アクティブな OpenClaw ワークスペースにインストールし、ソースメタデータを永続化します。これにより、後続の更新コマンドでも ClawHub を引き続き使用できます。

プラグインのインストールを ClawHub 経由で解決する場合は、`clawhub:<package>` を使用します。npm で安全に使用できる修飾なしのプラグイン指定は、ローンチ移行期間中に npm 経由で解決される場合があります。ソースを明示する必要がある場合、`npm:<package>` は npm のみを使用します。

プラグインのインストールでは、アーカイブのインストールを実行する前に、提示された `pluginApi` と `minGatewayVersion` の互換性を検証します。パッケージバージョンで ClawPack アーティファクトが公開されている場合、OpenClaw はアップロードされた npm-pack の `.tgz` を完全一致で優先し、ClawHub のダイジェストヘッダーとダウンロードしたバイト列を検証し、後続の更新用にアーティファクトのメタデータを記録します。

## ClawHub CLI

ClawHub CLI は、レジストリ認証が必要な作業に使用します。

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

CLI には、レジストリを直接使用するワークフロー向けに、Skills のインストール／更新コマンドもあります。

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` に Skills をインストールし、インストール済みのバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダーから Skills を公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: 公開された Skills の URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴のテキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL からプラグインを公開します。

```bash
clawhub package publish <source>
```

アップロードせずに公開計画を正確に作成するには `--dry-run` を、CI に適した出力には `--json` を使用します。

コードプラグインは、`package.json` に必須の OpenClaw 互換性メタデータ（`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む）を含める必要があります。コマンドの完全なリファレンスについては [CLI](/ja-JP/clawhub/cli)、Skills のメタデータについては [Skills の形式](/clawhub/skill-format)を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開には、アップロード要件を満たす期間が経過した GitHub アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態の概要が表示されます。

ClawHub は、公開された Skills とプラグインリリースに対して自動チェックを実行します。スキャンによって保留またはブロックされたリリースは、`/dashboard` で所有者には引き続き表示されますが、公開カタログやインストール画面には表示されなくなる場合があります。

サインイン済みのユーザーは、Skills とパッケージを報告できます。モデレーターは報告を確認し、コンテンツの非表示や復元、悪質なアカウントの禁止を行えます。ポリシーと措置の詳細については、[セキュリティ](/ja-JP/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウントの安全性](/clawhub/moderation)、[許容される使用方法](/clawhub/acceptable-usage)を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub がインストール数の合計を算出できるよう、CLI がベストエフォートでインストールイベントを送信する場合があります。無効にするには、次を設定します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                          | 効果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL を上書きします。 |
| `CLAWHUB_REGISTRY`            | レジストリ API の URL を上書きします。            |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン／設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。            |

詳細なリファレンスについては、[テレメトリ](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、[トラブルシューティング](/ja-JP/clawhub/troubleshooting)を参照してください。
