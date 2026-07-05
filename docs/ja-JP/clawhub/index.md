---
read_when:
    - ClawHub とは何かを説明する
    - Skills や Plugin の検索、インストール、更新
    - レジストリへの Skills またはプラグインの公開
    - openclaw と clawhub CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、clawhub CLI に関する公開 ClawHub の概要。
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T20:17:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw Skills と Plugin の公開レジストリです。

- ネイティブの `openclaw` コマンドを使って Skills を検索、インストール、更新し、ClawHub から Plugin をインストールします。
- レジストリ認証、公開、削除/削除取り消しワークフローには、別個の `clawhub` CLI を使います。

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

公開や削除/削除取り消しなど、レジストリ認証付きのワークフローが必要な場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス        | 保存するもの                                               | 典型的なコマンド                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` とサポートファイルを含むバージョン付きテキストバンドル | `openclaw skills install @openclaw/demo`     |
| コードPlugin   | 互換性メタデータを含む OpenClaw Plugin パッケージ         | `openclaw plugins install clawhub:<package>` |
| バンドルPlugin | OpenClaw 配信用にパッケージ化された Plugin バンドル            | `clawhub package publish <source>`           |

ClawHub は、semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前に Skill や Plugin を確認できます。

## ネイティブ OpenClaw フロー

ネイティブ OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、ソースメタデータを永続化するため、後続の更新コマンドでも ClawHub を使い続けられます。

Plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使います。ベアの npm セーフな Plugin 仕様は、ローンチ切り替え中に npm 経由で解決されることがあります。また、ソースを明示する必要がある場合、`npm:<package>` は npm のみを使います。

Plugin のインストールでは、アーカイブのインストールが実行される前に、宣伝されている `pluginApi` と `minGatewayVersion` の互換性が検証されます。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、ClawHub ダイジェストヘッダーとダウンロード済みバイト列を検証し、後続の更新用にアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI は、レジストリ認証付きの作業に使います。

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

CLI には、直接レジストリを使うワークフロー向けの Skill インストール/更新コマンドもあります。

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

よく使う公開オプション:

- `--slug <slug>`: 公開される Skill URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画をビルドするには `--dry-run` を使い、CI 向けの出力には `--json` を使います。

コードPlugin では、`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` を含む、必須の OpenClaw 互換性メタデータを `package.json` に含める必要があります。完全なコマンドリファレンスは [CLI](/ja-JP/clawhub/cli) を、Skill メタデータは [Skill format](/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い GitHub アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態が要約されます。

ClawHub は、公開された Skills と Plugin リリースに対して自動チェックを実行します。スキャンで保留中またはブロックされたリリースは、所有者には `/dashboard` で表示されたまま、公開カタログやインストールサーフェスから消えることがあります。

サインインしたユーザーは Skills とパッケージを報告できます。モデレーターは報告をレビューし、コンテンツを非表示または復元し、不正利用アカウントを禁止できます。ポリシーと執行の詳細は、[Security](/ja-JP/clawhub/security)、[Security Audits](/clawhub/security-audits)、[Moderation and Account Safety](/clawhub/moderation)、[Acceptable usage](/ja-JP/clawhub/acceptable-usage) を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub が集計インストール数を計算できるように、CLI がベストエフォートのインストールイベントを送信する場合があります。これは次で無効化できます。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                      | 効果                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使うサイト URL を上書きします。     |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。                    |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効化します。                        |

より詳しいリファレンス資料は、[Telemetry](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、[Troubleshooting](/ja-JP/clawhub/troubleshooting) を参照してください。
