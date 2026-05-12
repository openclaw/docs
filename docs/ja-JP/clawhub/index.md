---
read_when:
    - ClawHub とは何かを説明する
    - Skills や Plugin の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 発見、インストール、公開、セキュリティ、clawhub CLI に関する公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T04:09:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw の Skills と plugins の公開レジストリです。

- Skills の検索、インストール、更新、および ClawHub からの plugins のインストールには、ネイティブの `openclaw` コマンドを使用します。
- レジストリ認証、公開、削除/削除取り消し、同期ワークフローには、別の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw で Skills を検索してインストールします。

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClaw で plugins を検索してインストールします。

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

| サーフェス        | 保存するもの                                               | 一般的なコマンド                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` とサポートファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install <slug>`             |
| コード plugins   | 互換性メタデータを含む OpenClaw plugin パッケージ         | `openclaw plugins install clawhub:<package>` |
| バンドル plugins | OpenClaw 配信用にパッケージ化された plugin バンドル            | `clawhub package publish <source>`           |
| Souls          | onlycrabs.ai に表示される `SOUL.md` バンドル                      | Web および API 公開フロー                    |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーは Skills や plugin をインストールする前に確認できます。

## ネイティブ OpenClaw フロー

ネイティブの OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、ソースメタデータを永続化するため、後続の更新コマンドでも ClawHub を使い続けることができます。

plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。npm で安全な素の plugin 仕様は、ローンチの移行期間中に npm 経由で解決される場合があります。また、ソースを明示する必要がある場合、`npm:<package>` は npm 専用のままです。

plugin のインストールでは、アーカイブのインストールが実行される前に、公開されている `pluginApi` と `minGatewayVersion` の互換性が検証されます。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた npm-pack `.tgz` そのものを優先し、ClawHub のダイジェストヘッダーとダウンロードされたバイト列を検証し、後続の更新用にアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI はレジストリ認証が必要な作業に使用します。

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

この CLI には、直接レジストリワークフロー向けの Skills のインストール/更新コマンドもあります。

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` に Skills をインストールし、インストール済みバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダから Skills を公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: skill スラッグ。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。既定値は `latest`。

ローカルフォルダ、`owner/repo`、`owner/repo@ref`、または GitHub URL から plugins を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開プランをビルドするには `--dry-run` を使用し、CI に適した出力には `--json` を使用します。

コード plugins では、`package.json` に必須の OpenClaw 互換性メタデータを含める必要があります。これには `openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` が含まれます。完全なコマンドリファレンスについては [CLI](/ja-JP/clawhub/cli) を、Skills メタデータについては [Skill format](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub は既定でオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い GitHub アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態の概要が表示されます。

ClawHub は公開された Skills と plugin リリースに対して自動チェックを実行します。スキャン保留中またはブロックされたリリースは、所有者の `/dashboard` には表示されたまま、公開カタログやインストールサーフェスから消える場合があります。

サインイン済みのユーザーは Skills とパッケージを報告できます。モデレーターは報告をレビューし、コンテンツを非表示または復元し、不正利用アカウントを禁止できます。ポリシーと執行の詳細については、[Acceptable usage](/ja-JP/clawhub/acceptable-usage) と [Security + moderation](/ja-JP/clawhub/security) を参照してください。

## テレメトリと環境

ログイン中に `clawhub sync` を実行すると、ClawHub がインストール数を計算できるように、CLI は最小限のスナップショットを送信します。これを無効にするには次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                      | 効果                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL をオーバーライドします。     |
| `CLAWHUB_REGISTRY`            | レジストリ API URL をオーバーライドします。                    |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所をオーバーライドします。 |
| `CLAWHUB_WORKDIR`             | 既定の作業ディレクトリをオーバーライドします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効にします。                      |

より詳しいリファレンス資料については、[Telemetry](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、[Troubleshooting](/ja-JP/clawhub/troubleshooting) を参照してください。
