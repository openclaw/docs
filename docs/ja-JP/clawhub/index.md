---
read_when:
    - ClawHub とは何かを説明する
    - Skills または plugins の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 発見、インストール、公開、セキュリティ、および clawhub CLI のための公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T23:25:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHubはOpenClaw SkillsおよびPluginの公開レジストリです。

- ネイティブの`openclaw`コマンドを使って、Skillsの検索、インストール、更新、およびClawHubからのPluginのインストールを行います。
- レジストリ認証、公開、削除/削除解除ワークフローには、別個の`clawhub` CLIを使います。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClawでSkillsを検索してインストールします。

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

公開や削除/削除解除など、レジストリ認証が必要なワークフローを使う場合は、ClawHub CLIをインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHubがホストするもの

| サーフェス     | 保存するもの                                                 | 一般的なコマンド                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md`とサポートファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install @openclaw/demo`     |
| コードPlugin   | 互換性メタデータを含むOpenClaw Pluginパッケージ             | `openclaw plugins install clawhub:<package>` |
| バンドルPlugin | OpenClaw配布用のパッケージ化されたPluginバンドル            | `clawhub package publish <source>`           |

ClawHubは、semverバージョン、`latest`などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャン要約を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前にSkillやPluginを確認できます。

## ネイティブOpenClawフロー

ネイティブOpenClawコマンドは、アクティブなOpenClawワークスペースにインストールし、ソースメタデータを永続化するため、後続の更新コマンドはClawHub上にとどまれます。

PluginのインストールをClawHub経由で解決する必要がある場合は、`clawhub:<package>`を使います。素のnpm安全なPlugin仕様は、ローンチ移行中にnpm経由で解決される場合があり、ソースを明示する必要がある場合は`npm:<package>`がnpm専用のままになります。

Pluginのインストールでは、アーカイブのインストールが実行される前に、公開されている`pluginApi`と`minGatewayVersion`の互換性が検証されます。パッケージバージョンがClawPackアーティファクトを公開している場合、OpenClawはアップロードされた正確なnpm-pack `.tgz`を優先し、ClawHubダイジェストヘッダーとダウンロード済みバイトを検証し、後続の更新用にアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLIは、レジストリ認証が必要な作業向けです。

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

CLIには、直接レジストリを扱うワークフロー向けのSkillインストール/更新コマンドもあります。

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の`./skills`にSkillsをインストールし、インストール済みバージョンを`.clawhub/lock.json`に記録します。

## 公開

`SKILL.md`を含むローカルフォルダーからSkillsを公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: 公開されるSkillのURL名。
- `--name <name>`: 表示名。
- `--version <version>`: semverバージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは`latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、またはGitHub URLからPluginを公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画をビルドするには`--dry-run`を使い、CI向けの出力には`--json`を使います。

コードPluginでは、`package.json`に必要なOpenClaw互換性メタデータを含める必要があります。これには`openclaw.compat.pluginApi`と`openclaw.build.openclawVersion`が含まれます。完全なコマンドリファレンスについては[CLI](/ja-JP/clawhub/cli)を、Skillメタデータについては[Skill形式](/clawhub/skill-format)を参照してください。

## セキュリティとモデレーション

ClawHubはデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけの期間が経過したGitHubアカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態が要約されます。

ClawHubは、公開されたSkillsとPluginリリースに対して自動チェックを実行します。スキャン保留中またはブロックされたリリースは、所有者には`/dashboard`で表示されたまま、公開カタログやインストールサーフェスから消える場合があります。

サインイン済みユーザーはSkillsとパッケージを報告できます。モデレーターは報告を確認し、コンテンツの非表示または復元を行い、不正利用アカウントを禁止できます。ポリシーと執行の詳細については、[セキュリティ](/ja-JP/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウント安全性](/clawhub/moderation)、および[許容される利用](/ja-JP/clawhub/acceptable-usage)を参照してください。

## テレメトリと環境

ログイン中に`clawhub install`を実行すると、ClawHubが集計インストール数を計算できるように、CLIがベストエフォートのインストールイベントを送信する場合があります。これを無効にするには、次を使います。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                          | 効果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使うサイトURLを上書きします。   |
| `CLAWHUB_REGISTRY`            | レジストリAPI URLを上書きします。                 |
| `CLAWHUB_CONFIG_PATH`         | CLIがトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。            |

より詳しいリファレンス資料については、[テレメトリ](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、および[トラブルシューティング](/ja-JP/clawhub/troubleshooting)を参照してください。
