---
read_when:
    - ClawHubとは何かを説明する
    - SkillsまたはPluginの検索、インストール、更新
    - レジストリへの Skills またはプラグインの公開
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、clawhub CLI に関する公開 ClawHub の概要。
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T14:20:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は、OpenClaw の Skills と Plugin の公開レジストリです。

- OpenClaw ネイティブの `openclaw` コマンドを使用して、Skills の検索、インストール、更新、および ClawHub からの Plugin のインストールを行います。
- レジストリ認証、公開、削除／削除取り消しのワークフローには、独立した `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw で Skills を検索してインストールします。

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw で Plugin を検索してインストールします。

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

| サーフェス     | 保存するもの                                                | 一般的なコマンド                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` と補助ファイルで構成されるバージョン付きテキストバンドル | `openclaw skills install @openclaw/demo`     |
| コード Plugin  | 互換性メタデータを含む OpenClaw Plugin パッケージ           | `openclaw plugins install clawhub:<package>` |
| バンドル Plugin | OpenClaw 配布用にパッケージ化された Plugin バンドル         | `clawhub package publish <source>`           |

ClawHub は、semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター数、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前に Skills または Plugin を確認できます。

## OpenClaw ネイティブのフロー

OpenClaw ネイティブのコマンドは、アクティブな OpenClaw ワークスペースにインストールし、以降の更新コマンドが引き続き ClawHub を使用できるようにソースメタデータを永続化します。

Plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。プレフィックスのない npm 互換の Plugin 指定は、リリース切り替え期間中に npm 経由で解決される場合があります。ソースを明示する必要がある場合、`npm:<package>` は npm のみを使用します。

Plugin のインストールでは、アーカイブのインストールを実行する前に、公開されている `pluginApi` および `minGatewayVersion` の互換性を検証します。パッケージバージョンで ClawPack アーティファクトが公開されている場合、OpenClaw はアップロードされた npm-pack の正確な `.tgz` を優先し、ClawHub のダイジェストヘッダーとダウンロードしたバイト列を検証して、以降の更新用にアーティファクトのメタデータを記録します。

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

CLI には、レジストリを直接使用するワークフロー向けの Skills インストール／更新コマンドもあります。

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` に Skills をインストールし、インストール済みバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダーから Skills を公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: 公開される Skills の URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴のテキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画を作成するには `--dry-run` を使用し、CI に適した出力には `--json` を使用します。

コード Plugin は、`package.json` に必要な OpenClaw 互換性メタデータ（`openclaw.compat.pluginApi` および `openclaw.build.openclawVersion` を含む）を指定する必要があります。コマンドの完全なリファレンスについては [CLI](/ja-JP/clawhub/cli)、Skills のメタデータについては [Skills の形式](/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロード条件を満たす作成後一定期間が経過した GitHub アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態の概要が表示されます。

ClawHub は、公開された Skills と Plugin リリースに対して自動チェックを実行します。スキャン保留中またはブロックされたリリースは、所有者の `/dashboard` では引き続き表示される一方、公開カタログやインストール画面から非表示になる場合があります。

サインインしたユーザーは、Skills とパッケージを報告できます。モデレーターは、報告の確認、コンテンツの非表示または復元、不正利用を行うアカウントの禁止が可能です。ポリシーと執行の詳細については、[セキュリティ](/ja-JP/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウントの安全性](/clawhub/moderation)、および[許容される使用方法](/clawhub/acceptable-usage)を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub がインストール数の集計値を算出できるよう、CLI がベストエフォートでインストールイベントを送信する場合があります。無効にするには次を設定します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境変数によるオーバーライド:

| 変数                          | 効果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL を上書きします。 |
| `CLAWHUB_REGISTRY`            | レジストリ API の URL を上書きします。            |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン／設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。            |

より詳細なリファレンスについては、[テレメトリ](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、および[トラブルシューティング](/ja-JP/clawhub/troubleshooting)を参照してください。
