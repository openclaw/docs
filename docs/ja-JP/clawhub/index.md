---
read_when:
    - ClawHub とは何かを説明する
    - Skills または Plugin の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - openclaw と clawhub CLI フローの選び方
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、および clawhub CLI についての公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T23:29:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw の Skills と Plugin の公開レジストリです。

- ネイティブの `openclaw` コマンドを使用して、Skills の検索、インストール、更新、および ClawHub からの Plugin のインストールを行います。
- レジストリ認証、公開、削除/削除取り消し、同期ワークフローには、別の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw で Skills を検索してインストールします。

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw で Plugin を検索してインストールします。

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

公開、同期、削除/削除取り消しなど、レジストリ認証が必要なワークフローを使う場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| 対象領域       | 保存内容                                                       | 一般的なコマンド                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` と補助ファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install <slug>`             |
| コード Plugin  | 互換性メタデータを含む OpenClaw Plugin パッケージ              | `openclaw plugins install clawhub:<package>` |
| バンドル Plugin | OpenClaw 配信用にパッケージ化された Plugin バンドル             | `clawhub package publish <source>`           |
| ソウル         | onlycrabs.ai に表示される `SOUL.md` バンドル                   | Web と API の公開フロー                      |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前に Skills や Plugin を確認できます。

## ネイティブ OpenClaw フロー

ネイティブ OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、ソースメタデータを保持するため、後続の更新コマンドでも ClawHub を使い続けられます。

Plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。npm で安全な裸の Plugin 仕様は、ローンチ切り替え中に npm 経由で解決される場合があります。また、ソースを明示する必要がある場合は、`npm:<package>` は npm 専用のままです。

Plugin のインストールでは、アーカイブのインストール実行前に、提示された `pluginApi` と `minGatewayVersion` の互換性を検証します。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、ClawHub のダイジェストヘッダーとダウンロード済みバイト列を検証し、後続の更新のためにアーティファクトメタデータを記録します。

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
clawhub sync --all
```

CLI には、直接レジストリを扱うワークフロー向けの Skills インストール/更新コマンドもあります。

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`: Skills のスラッグ。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。既定は `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画をビルドするには `--dry-run` を使用し、CI に適した出力には `--json` を使用します。

コード Plugin は、`package.json` に必須の OpenClaw 互換性メタデータを含める必要があります。これには `openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` が含まれます。完全なコマンドリファレンスについては [CLI](/ja-JP/clawhub/cli) を、Skills メタデータについては [Skills 形式](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub は既定でオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ十分に古い GitHub アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態の概要が表示されます。

ClawHub は、公開された Skills と Plugin リリースに対して自動チェックを実行します。スキャン保留中またはブロックされたリリースは、所有者には `/dashboard` で表示されたまま、公開カタログやインストール画面から消える場合があります。

サインインしたユーザーは Skills とパッケージを報告できます。モデレーターは報告をレビューし、コンテンツの非表示や復元、悪用アカウントの禁止を行えます。ポリシーと適用の詳細については、[利用許容ポリシー](/ja-JP/clawhub/acceptable-usage) と [セキュリティ + モデレーション](/ja-JP/clawhub/security) を参照してください。

## テレメトリと環境

ログイン中に `clawhub sync` を実行すると、ClawHub がインストール数を計算できるように、CLI は最小限のスナップショットを送信します。これを無効にするには、次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                          | 効果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL を上書きします。 |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。               |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | 既定の作業ディレクトリを上書きします。             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効にします。                |

さらに詳しい参照資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
