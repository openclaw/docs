---
read_when:
    - ClawHub とは何かを説明する
    - Skills や plugins の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、clawhub CLI のための公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-06-28T00:11:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw Skills と Plugin の公開レジストリです。

- Skills の検索、インストール、更新、および ClawHub からの Plugin のインストールには、ネイティブの `openclaw` コマンドを使用します。
- レジストリ認証、公開、削除/削除取り消しワークフローには、別の `clawhub` CLI を使用します。

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

公開や削除/削除取り消しなど、レジストリ認証が必要なワークフローを使う場合は、
ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス        | 保存する内容                                               | 典型的なコマンド                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` とサポートファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install @openclaw/demo`     |
| コードPlugin   | 互換性メタデータを含む OpenClaw Plugin パッケージ         | `openclaw plugins install clawhub:<package>` |
| バンドルPlugin | OpenClaw 配信用にパッケージ化された Plugin バンドル            | `clawhub package publish <source>`           |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、
ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ
状態が表示されるため、ユーザーはインストール前に Skills や Plugin を確認できます。

## ネイティブ OpenClaw フロー

ネイティブ OpenClaw コマンドはアクティブな OpenClaw ワークスペースにインストールし、
ソースメタデータを永続化するため、後続の更新コマンドも ClawHub 上にとどまれます。

Plugin のインストールを ClawHub 経由で解決する必要がある場合は `clawhub:<package>` を使用します。
ベアの npm セーフな Plugin 仕様は、ローンチ切り替え期間中に npm 経由で解決される場合があり、
ソースを明示する必要がある場合、`npm:<package>` は npm 専用のままです。

Plugin のインストールでは、アーカイブのインストールを実行する前に、公開されている `pluginApi` と `minGatewayVersion`
の互換性を検証します。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、
ClawHub ダイジェストヘッダーとダウンロードされたバイトを検証し、後続の更新のためにアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI は、レジストリ認証が必要な作業のためのものです。

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

CLI には、直接レジストリを使うワークフロー向けの Skills インストール/更新コマンドもあります。

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` に Skills をインストールし、
インストール済みバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダーから Skills を公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: 公開される Skills の URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub
URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開プランをビルドするには `--dry-run` を使用し、CI に適した出力には `--json`
を使用します。

コードPlugin には、`package.json` に必須の OpenClaw 互換性メタデータを含める必要があります。
これには `openclaw.compat.pluginApi` と
`openclaw.build.openclawVersion` が含まれます。完全なコマンド
リファレンスについては [CLI](/ja-JP/clawhub/cli) を、Skills メタデータについては [Skills 形式](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い GitHub
アカウントが必要です。公開詳細ページでは、インストールまたはダウンロード前に
最新のスキャン状態を要約します。

ClawHub は公開された Skills と Plugin リリースに対して自動チェックを実行します。スキャンで保留中またはブロックされた
リリースは、所有者には `/dashboard` で表示されたまま、
公開カタログとインストールサーフェスから消える場合があります。

サインイン済みユーザーは Skills とパッケージを報告できます。モデレーターは報告をレビューし、
コンテンツの非表示や復元、不正利用アカウントの禁止を行えます。ポリシーと執行の詳細については、
[セキュリティ](/ja-JP/clawhub/security)、
[セキュリティ監査](/ja-JP/clawhub/security-audits)、
[モデレーションとアカウント安全性](/ja-JP/clawhub/moderation)、および
[許容される使用](/ja-JP/clawhub/acceptable-usage) を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub が集計インストール数を算出できるように、CLI はベストエフォートの
インストールイベントを送信する場合があります。これを無効にするには、次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                      | 効果                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL をオーバーライドします。     |
| `CLAWHUB_REGISTRY`            | レジストリ API URL をオーバーライドします。                    |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所をオーバーライドします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリをオーバーライドします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。                        |

より詳しい参考資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、および
[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
