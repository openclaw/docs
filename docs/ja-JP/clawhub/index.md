---
read_when:
    - ClawHub とは何かを説明する
    - SkillsまたはPluginの検索、インストール、更新
    - SkillsまたはPluginをレジストリに公開する
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、clawhub CLI に関する ClawHub の公開概要。
title: ClawHub
x-i18n:
    generated_at: "2026-05-11T20:24:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw の Skills と plugins の公開レジストリです。

- ClawHub から Skills を検索、インストール、更新し、plugins をインストールするには、ネイティブの `openclaw` コマンドを使用します。
- レジストリ認証、公開、削除/削除取り消し、再スキャン、同期ワークフローには、別の `clawhub` CLI を使用します。

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

公開、同期、削除/削除取り消し、またはオーナーが要求した再スキャンなど、
レジストリ認証済みワークフローが必要な場合は ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| Surface        | 保存するもの                                                 | 典型的なコマンド                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` と補助ファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install <slug>`             |
| Code plugins   | 互換性メタデータを含む OpenClaw plugin パッケージ             | `openclaw plugins install clawhub:<package>` |
| Bundle plugins | OpenClaw 配信用にパッケージ化された plugin バンドル          | `clawhub package publish <source>`           |
| Souls          | onlycrabs.ai に表示される `SOUL.md` バンドル                 | Web と API の公開フロー                      |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、
ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、
ユーザーは Skills や plugin をインストールする前に確認できます。

## ネイティブ OpenClaw フロー

ネイティブの OpenClaw コマンドはアクティブな OpenClaw ワークスペースにインストールし、
ソースメタデータを永続化するため、後続の更新コマンドでも ClawHub 上に留まれます。

plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。
npm で安全な素の plugin 仕様は、ローンチ切り替え中に npm 経由で解決される場合があり、
ソースを明示する必要がある場合、`npm:<package>` は npm のみに留まります。

plugin のインストールでは、アーカイブインストールを実行する前に、公開されている `pluginApi` と `minGatewayVersion` の
互換性を検証します。パッケージバージョンが ClawPack アーティファクトを公開している場合、
OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、
ClawHub ダイジェストヘッダーとダウンロードされたバイトを検証し、
後続の更新用にアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI はレジストリ認証済みの作業用です。

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

CLI には、直接のレジストリワークフロー向けの Skills インストール/更新コマンドもあります。

```bash
clawhub install <slug>
clawhub update <slug>
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

- `--slug <slug>`: Skills のスラッグ。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub
URL から plugins を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画を作成するには `--dry-run` を使用し、CI に適した出力には `--json`
を使用します。

Code plugins は、`package.json` に必要な OpenClaw 互換性メタデータを含める必要があります。
これには `openclaw.compat.pluginApi` と
`openclaw.build.openclawVersion` が含まれます。完全なコマンドリファレンスについては [CLI](/ja-JP/clawhub/cli) を、
Skills メタデータについては [Skills 形式](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い
GitHub アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に最新のスキャン状態が要約されます。

ClawHub は公開された Skills と plugin リリースに対して自動チェックを実行します。スキャンで保留中またはブロックされた
リリースは、公開カタログやインストール画面から消える場合がありますが、
`/dashboard` ではオーナーに引き続き表示されます。

オーナーは誤検知からの復旧のため、限定的な再スキャンを要求できます。プラットフォームの
モデレーターと管理者は、サポート報告を処理する際に任意の Skills またはパッケージの再スキャンを要求できます。

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

サインイン済みユーザーは Skills とパッケージを報告できます。モデレーターは報告を確認し、
コンテンツを非表示または復元し、異議申し立てを解決し、悪用アカウントを禁止できます。ポリシーと適用の詳細については、
[許容される利用](/ja-JP/clawhub/acceptable-usage) と
[セキュリティ + モデレーション](/ja-JP/clawhub/security) を参照してください。

## テレメトリと環境

ログイン中に `clawhub sync` を実行すると、ClawHub がインストール数を計算できるように、
CLI は最小限のスナップショットを送信します。これを無効にするには、次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                          | 効果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザログインに使用するサイト URL を上書きします。 |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。               |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` 時のテレメトリを無効にします。             |

より詳しい参考資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、および
[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
