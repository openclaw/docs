---
read_when:
    - ClawHub とは何かを説明する
    - SkillsやPluginの検索、インストール、更新
    - Skills または Plugin のレジストリへの公開
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 探索、インストール、公開、セキュリティ、clawhub CLI に関する公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T22:19:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は、OpenClaw の Skills と Plugin の公開レジストリです。

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

公開、同期、削除/削除取り消しなど、レジストリ認証が必要なワークフローを使用する場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス        | 格納するもの                                               | 一般的なコマンド                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` とサポートファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install <slug>`             |
| コード Plugin   | 互換性メタデータを含む OpenClaw Plugin パッケージ         | `openclaw plugins install clawhub:<package>` |
| バンドル Plugin | OpenClaw 配信用にパッケージ化された Plugin バンドル            | `clawhub package publish <source>`           |
| Souls          | onlycrabs.ai に表示される `SOUL.md` バンドル                      | Web と API の公開フロー                    |

ClawHub は、semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前に Skills や Plugin を確認できます。

## ネイティブの OpenClaw フロー

ネイティブの OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、ソースメタデータを保持するため、後続の更新コマンドは ClawHub 上に留まれます。

Plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。ベアな npm-safe Plugin 仕様は、ローンチ移行時に npm 経由で解決されることがあり、ソースを明示する必要がある場合は `npm:<package>` が npm 専用のままになります。

Plugin のインストールでは、アーカイブインストールを実行する前に、公開されている `pluginApi` と `minGatewayVersion` の互換性を検証します。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、ClawHub のダイジェストヘッダーとダウンロードされたバイトを検証し、後続の更新用にアーティファクトメタデータを記録します。

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

CLI には、直接レジストリワークフロー向けの Skills インストール/更新コマンドもあります。

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

- `--slug <slug>`: Skill スラッグ。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開プランをビルドするには `--dry-run` を使用し、CI に適した出力には `--json` を使用します。

コード Plugin には、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む、必須の OpenClaw 互換性メタデータを `package.json` に含める必要があります。完全なコマンドリファレンスは [CLI](/ja-JP/clawhub/cli) を、Skill メタデータについては [Skill 形式](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できる程度に古い GitHub アカウントが必要です。公開詳細ページでは、インストールまたはダウンロードの前に最新のスキャン状態を要約します。

ClawHub は、公開された Skills と Plugin リリースに対して自動チェックを実行します。スキャン保留またはブロックされたリリースは、所有者には `/dashboard` で引き続き表示される一方、公開カタログやインストールサーフェスから消えることがあります。

サインイン済みユーザーは、Skills とパッケージを報告できます。モデレーターは報告をレビューし、コンテンツの非表示または復元、不正利用アカウントの禁止を行えます。ポリシーと執行の詳細については、[許容される利用](/ja-JP/clawhub/acceptable-usage) と [セキュリティ + モデレーション](/ja-JP/clawhub/security) を参照してください。

## テレメトリと環境

ログイン中に `clawhub sync` を実行すると、ClawHub がインストール数を計算できるよう、CLI は最小限のスナップショットを送信します。これを無効にするには、次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

有用な環境オーバーライド:

| 変数                      | 効果                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL を上書きします。     |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。                    |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効にします。                      |

さらに詳しい参考資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
