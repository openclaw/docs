---
read_when:
    - ClawHub とは何かを説明する
    - Skills または Plugin の検索、インストール、更新
    - レジストリへのSkillsまたはpluginsの公開
    - openclaw と clawhub CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、clawhub CLI のための公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T17:12:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw の Skills と Plugin の公開レジストリです。

- ネイティブの `openclaw` コマンドを使用して、Skills の検索、インストール、更新、および ClawHub からの Plugin のインストールを行います。
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

公開や削除/削除取り消しなど、レジストリ認証が必要なワークフローを使う場合は
ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス     | 保存するもの                                                     | 代表的なコマンド                             |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md` と補助ファイルを含むバージョン付きテキストバンドル   | `openclaw skills install @openclaw/demo`     |
| コード Plugin  | 互換性メタデータを含む OpenClaw Plugin パッケージ               | `openclaw plugins install clawhub:<package>` |
| バンドル Plugin | OpenClaw 配信用にパッケージ化された Plugin バンドル             | `clawhub package publish <source>`           |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、
ダウンロード数、スター、セキュリティスキャン概要を追跡します。公開ページには現在のレジストリ
状態が表示されるため、ユーザーはインストール前に Skill や Plugin を確認できます。

## ネイティブ OpenClaw フロー

ネイティブ OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、
ソースメタデータを永続化するため、後続の更新コマンドも ClawHub 上にとどまれます。

Plugin のインストールを ClawHub 経由で解決する必要がある場合は `clawhub:<package>` を使用します。
ベアの npm セーフな Plugin 仕様は、ローンチ移行時に npm 経由で解決される場合があり、
ソースを明示する必要がある場合は `npm:<package>` が npm 専用のままになります。

Plugin のインストールでは、アーカイブのインストール実行前に、公開されている `pluginApi` と
`minGatewayVersion` の互換性が検証されます。パッケージバージョンが
ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、
ClawHub ダイジェストヘッダーとダウンロードされたバイト列を検証し、
後続の更新用にアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI はレジストリ認証が必要な作業用です。

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

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` に Skills をインストールし、
インストール済みバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダーから Skills を公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: 公開される Skill の URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub
URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画をビルドするには `--dry-run` を使用し、CI 向けの出力には `--json`
を使用します。

コード Plugin には、`package.json` に必要な OpenClaw 互換性メタデータを含める必要があります。
これには `openclaw.compat.pluginApi` と
`openclaw.build.openclawVersion` が含まれます。完全なコマンド
リファレンスについては [CLI](/ja-JP/clawhub/cli) を、Skill メタデータについては [Skill 形式](/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い GitHub
アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に
最新のスキャン状態が要約されます。

ClawHub は、公開された Skills と Plugin リリースに対して自動チェックを実行します。スキャン保留中
またはブロックされたリリースは、所有者には `/dashboard` で表示されたまま、
公開カタログやインストールサーフェスから消える場合があります。

サインインしたユーザーは Skills とパッケージを報告できます。モデレーターは報告を確認し、
コンテンツを非表示または復元し、不正利用アカウントを禁止できます。ポリシーと執行の詳細については、
[セキュリティ](/ja-JP/clawhub/security)、
[セキュリティ監査](/clawhub/security-audits)、
[モデレーションとアカウント安全性](/clawhub/moderation)、および
[利用許容範囲](/ja-JP/clawhub/acceptable-usage) を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub が集計インストール数を計算できるように、
CLI がベストエフォートのインストールイベントを送信する場合があります。これは次で無効にできます。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                          | 効果                                                |
| ----------------------------- | --------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL を上書きします。 |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。                 |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。         |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。              |

より詳しい参考資料については、[テレメトリ](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、および
[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
