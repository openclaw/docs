---
read_when:
    - ClawHub とは何かを説明する
    - Skills または plugins の検索、インストール、更新
    - Skills や Plugin をレジストリに公開する
    - openclaw と clawhub CLI フローの選択
sidebarTitle: ClawHub
summary: 公開 ClawHub の概要。発見、インストール、公開、セキュリティ、clawhub CLI について説明します。
title: ClawHub
x-i18n:
    generated_at: "2026-07-05T04:57:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw のスキルとPluginの公開レジストリです。

- ネイティブの `openclaw` コマンドを使用して、スキルの検索、インストール、更新、およびClawHubからのPluginのインストールを行います。
- レジストリ認証、公開、削除/削除取り消しのワークフローには、別の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClawでスキルを検索してインストールします。

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClawでPluginを検索してインストールします。

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

公開や削除/削除取り消しなど、レジストリ認証が必要なワークフローを使用する場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス | 保存内容 | 一般的なコマンド |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills | `SKILL.md` とサポートファイルを含むバージョン付きテキストバンドル | `openclaw skills install @openclaw/demo` |
| コードPlugin | 互換性メタデータを含むOpenClaw Pluginパッケージ | `openclaw plugins install clawhub:<package>` |
| バンドルPlugin | OpenClaw配布用のパッケージ化されたPluginバンドル | `clawhub package publish <source>` |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前にスキルやPluginを確認できます。

## ネイティブ OpenClaw フロー

ネイティブのOpenClawコマンドは、アクティブなOpenClawワークスペースにインストールし、ソースメタデータを永続化するため、後続の更新コマンドもClawHub上にとどまれます。

PluginのインストールをClawHub経由で解決する必要がある場合は、`clawhub:<package>` を使用します。npmで安全なPlugin仕様は、ローンチ切り替え中にnpm経由で解決される場合があり、ソースを明示する必要がある場合は `npm:<package>` がnpm専用のままになります。

Pluginのインストールでは、アーカイブのインストールが実行される前に、公開されている `pluginApi` と `minGatewayVersion` の互換性が検証されます。パッケージバージョンがClawPackアーティファクトを公開している場合、OpenClawはアップロードされた正確な npm-pack `.tgz` を優先し、ClawHubのダイジェストヘッダーとダウンロードされたバイト列を検証し、後続の更新のためにアーティファクトメタデータを記録します。

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
```

CLIには、直接レジストリを使うワークフロー向けのスキルインストール/更新コマンドもあります。

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` にスキルをインストールし、インストール済みバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダーからスキルを公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: 公開されるスキルURL名。
- `--name <name>`: 表示名。
- `--version <version>`: semverバージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、またはGitHub URLからPluginを公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開プランをビルドするには `--dry-run` を使用し、CI向けの出力には `--json` を使用します。

コードPluginには、`package.json` に必須のOpenClaw互換性メタデータを含める必要があります。これには `openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` が含まれます。完全なコマンドリファレンスについては [CLI](/ja-JP/clawhub/cli)、スキルメタデータについては [スキル形式](/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHubはデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古いGitHubアカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態が要約されます。

ClawHub は公開されたスキルとPluginリリースに対して自動チェックを実行します。スキャンで保留またはブロックされたリリースは、所有者には `/dashboard` で表示されたまま、公開カタログやインストール画面から消える場合があります。

サインイン済みユーザーはスキルとパッケージを報告できます。モデレーターは報告をレビューし、コンテンツを非表示または復元し、不正使用アカウントを禁止できます。ポリシーと執行の詳細については、[セキュリティ](/clawhub/security)、[セキュリティ監査](/ja-JP/clawhub/security-audits)、[モデレーションとアカウント安全性](/clawhub/moderation)、および[利用許諾](/clawhub/acceptable-usage)を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub が集計インストール数を計算できるように、CLIがベストエフォートのインストールイベントを送信する場合があります。これを無効にするには、次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数 | 効果 |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE` | ブラウザログインに使用するサイトURLを上書きします。 |
| `CLAWHUB_REGISTRY` | レジストリAPI URLを上書きします。 |
| `CLAWHUB_CONFIG_PATH` | CLIがトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR` | デフォルトの作業ディレクトリを上書きします。 |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。 |

より詳しいリファレンス資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、[トラブルシューティング](/clawhub/troubleshooting)を参照してください。
