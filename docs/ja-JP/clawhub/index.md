---
read_when:
    - ClawHubとは何かを説明する
    - Skills または plugins の検索、インストール、更新
    - Skills または plugins をレジストリに公開する
    - openclaw と clawhub CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、clawhub CLI 向けの公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T05:08:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は、OpenClaw のスキルと Plugin の公開レジストリです。

- ネイティブの `openclaw` コマンドを使って、スキルの検索、インストール、更新、および ClawHub からの Plugin インストールを行います。
- レジストリ認証、公開、削除/削除取り消しワークフローには、別個の `clawhub` CLI を使います。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw でスキルを検索してインストールします。

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

公開や削除/削除取り消しなど、レジストリ認証済みワークフローが必要な場合は
ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| Surface        | 保存するもの                                                   | 典型的なコマンド                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` と補助ファイルを含む、バージョン付きテキストバンドル | `openclaw skills install @openclaw/demo`     |
| Code plugins   | 互換性メタデータを含む OpenClaw Plugin パッケージ              | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | OpenClaw 配信用にパッケージ化された Plugin バンドル            | `clawhub package publish <source>`           |

ClawHub は、semver バージョン、`latest` などのタグ、変更履歴、ファイル、
ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、
ユーザーはインストール前にスキルや Plugin を確認できます。

## ネイティブ OpenClaw フロー

ネイティブ OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、
ソースメタデータを永続化するため、後続の更新コマンドは ClawHub 上に留まれます。

Plugin インストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使います。
npm で安全に扱える裸の Plugin 指定は、ローンチ時の切り替え期間中に npm 経由で解決されることがあり、
ソースを明示する必要がある場合は `npm:<package>` が npm 専用のままになります。

Plugin インストールは、アーカイブインストールを実行する前に、広告された `pluginApi` と `minGatewayVersion` の
互換性を検証します。パッケージバージョンが ClawPack アーティファクトを公開している場合、
OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、ClawHub ダイジェストヘッダーとダウンロード済みバイト列を検証し、
後続の更新用にアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI は、レジストリ認証済みの作業に使います。

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

CLI には、直接レジストリを使うワークフロー向けのスキルインストール/更新コマンドもあります。

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` にスキルをインストールし、
インストール済みバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダーからスキルを公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: 公開されるスキルの URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub
URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画を構築するには `--dry-run` を使い、CI 向けの出力には `--json`
を使います。

コード Plugin は、`package.json` に必須の OpenClaw 互換性メタデータを含める必要があります。
これには `openclaw.compat.pluginApi` と
`openclaw.build.openclawVersion` が含まれます。完全なコマンドリファレンスは [CLI](/ja-JP/clawhub/cli) を、
スキルメタデータは [Skill形式](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い GitHub
アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態が要約されます。

ClawHub は、公開されたスキルと Plugin リリースに対して自動チェックを実行します。スキャンで保留されたリリースや
ブロックされたリリースは、所有者には `/dashboard` で表示されたまま、
公開カタログとインストール画面から消えることがあります。

サインイン済みユーザーは、スキルとパッケージを報告できます。モデレーターは報告を確認し、
コンテンツの非表示や復元、不正利用アカウントの禁止を行えます。ポリシーと執行の詳細については、
[セキュリティ](/ja-JP/clawhub/security)、
[セキュリティ監査](/ja-JP/clawhub/security-audits)、
[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)、および
[許容される利用](/ja-JP/clawhub/acceptable-usage) を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub が集計インストール数を計算できるように、
CLI がベストエフォートのインストールイベントを送信する場合があります。これを無効にするには、次を使います。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                          | 効果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザーログインに使うサイト URL を上書きします。 |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。                |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。             |

より詳しいリファレンス資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、および
[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
