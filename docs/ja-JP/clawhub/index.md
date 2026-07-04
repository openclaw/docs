---
read_when:
    - ClawHub とは何かを説明する
    - SkillsやPluginの検索、インストール、更新
    - レジストリへの Skills または plugins の公開
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 発見、インストール、公開、セキュリティ、clawhub CLI のための公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-07-04T20:23:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は、OpenClaw のスキルとプラグインの公開レジストリです。

- ネイティブの `openclaw` コマンドを使用して、スキルの検索、インストール、更新を行い、ClawHub からプラグインをインストールします。
- レジストリ認証、公開、削除/削除取り消しワークフローには、別個の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw でスキルを検索してインストールします。

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

公開や削除/削除取り消しなど、レジストリ認証が必要なワークフローを使う場合は、
ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス        | 保存するもの                                               | 典型的なコマンド                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` とサポートファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install @openclaw/demo`     |
| コードプラグイン   | 互換性メタデータを含む OpenClaw プラグインパッケージ         | `openclaw plugins install clawhub:<package>` |
| バンドルプラグイン | OpenClaw 配布用にパッケージ化されたプラグインバンドル            | `clawhub package publish <source>`           |

ClawHub は、semver バージョン、`latest` などのタグ、変更履歴、ファイル、
ダウンロード数、スター数、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ
状態が表示されるため、ユーザーはインストール前にスキルやプラグインを確認できます。

## ネイティブ OpenClaw フロー

ネイティブ OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、
ソースメタデータを保持するため、後続の更新コマンドも ClawHub 上に留まれます。

プラグインのインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。
裸の npm-safe プラグイン仕様は、ローンチ時の切り替え期間中に npm 経由で解決される場合があり、
ソースを明示する必要がある場合、`npm:<package>` は npm 専用のままです。

プラグインのインストールでは、アーカイブのインストールが実行される前に、公開されている `pluginApi` と `minGatewayVersion`
の互換性を検証します。パッケージバージョンが
ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、
ClawHub ダイジェストヘッダーとダウンロード済みバイトを検証し、後続の更新用にアーティファクトメタデータを記録します。

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

CLI には、直接レジストリを使うワークフロー向けのスキルのインストール/更新コマンドもあります。

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

- `--slug <slug>`: 公開されるスキル URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub
URL からプラグインを公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開プランをビルドするには `--dry-run` を使用し、CI 向けの出力には `--json`
を使用します。

コードプラグインには、`package.json` に必須の OpenClaw 互換性メタデータを含める必要があります。
これには、`openclaw.compat.pluginApi` と
`openclaw.build.openclawVersion` が含まれます。完全なコマンド
リファレンスは [CLI](/ja-JP/clawhub/cli) を、スキルメタデータは [スキル形式](/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い GitHub
アカウントが必要です。公開の詳細ページには、インストールまたはダウンロード前に
最新のスキャン状態が要約されます。

ClawHub は、公開されたスキルとプラグインリリースに対して自動チェックを実行します。スキャンで保留中または
ブロックされたリリースは、所有者には `/dashboard` で引き続き表示される一方で、
公開カタログやインストールサーフェスからは表示されなくなる場合があります。

サインインしたユーザーは、スキルとパッケージを報告できます。モデレーターは報告をレビューし、
コンテンツの非表示や復元、不正利用アカウントの禁止を行えます。ポリシーと適用の詳細については、
[セキュリティ](/ja-JP/clawhub/security)、
[セキュリティ監査](/clawhub/security-audits)、
[モデレーションとアカウント安全性](/clawhub/moderation)、および
[利用許容ポリシー](/ja-JP/clawhub/acceptable-usage) を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub が集計インストール数を計算できるように、CLI がベストエフォートの
インストールイベントを送信する場合があります。これを無効にするには、次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                      | 効果                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL を上書きします。     |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。                    |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。                        |

より詳しいリファレンス資料については、[テレメトリ](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、および
[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
