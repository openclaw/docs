---
read_when:
    - ClawHub とは何かを説明する
    - Skills または Plugin の検索、インストール、更新
    - レジストリへの Skills または Plugin の公開
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 発見、インストール、公開、セキュリティ、および clawhub CLI のための公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-07-01T05:27:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は、OpenClaw の Skills とplugins向けの公開レジストリです。

- ClawHub から Skills を検索、インストール、更新し、plugins をインストールするには、ネイティブの `openclaw` コマンドを使用します。
- レジストリ認証、公開、削除/削除取り消しワークフローには、別の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw で Skills を検索してインストールします。

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

OpenClaw で plugins を検索してインストールします。

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

公開や削除/削除取り消しなど、レジストリ認証済みワークフローが必要な場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス     | 保存するもの                                                     | 一般的なコマンド                             |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Skills         | `SKILL.md` とサポートファイルを含む、バージョン付きテキストバンドル | `openclaw skills install @openclaw/demo`     |
| コードplugins  | 互換性メタデータを含む OpenClaw plugin パッケージ                | `openclaw plugins install clawhub:<package>` |
| バンドルplugins | OpenClaw 配布用にパッケージ化されたpluginバンドル                | `clawhub package publish <source>`           |

ClawHub は、semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前に Skill やpluginを確認できます。

## ネイティブ OpenClaw フロー

ネイティブの OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、ソースメタデータを永続化するため、後続の更新コマンドは ClawHub 上にとどまれます。

plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。裸の npm セーフな plugin 仕様は、ローンチ切り替え中に npm 経由で解決される場合があり、ソースを明示する必要がある場合は `npm:<package>` が npm 専用のままになります。

plugin のインストールでは、アーカイブインストールを実行する前に、公開されている `pluginApi` と `minGatewayVersion` の互換性を検証します。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、ClawHub ダイジェストヘッダーとダウンロード済みバイトを検証し、後続の更新のためにアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI は、レジストリ認証済みの作業用です。

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

CLI には、直接レジストリワークフロー向けの Skill インストール/更新コマンドもあります。

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

一般的な公開オプション:

- `--slug <slug>`: 公開される Skill URL 名。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL から plugins を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画をビルドするには `--dry-run` を使用し、CI に適した出力には `--json` を使用します。

コードplugins は、`package.json` に必要な OpenClaw 互換性メタデータを含める必要があります。これには `openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` が含まれます。完全なコマンドリファレンスは [CLI](/ja-JP/clawhub/cli) を、Skill メタデータは [Skill 形式](/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ十分に古い GitHub アカウントが必要です。公開詳細ページには、インストールまたはダウンロードの前に最新のスキャン状態が要約されます。

ClawHub は、公開された Skills とpluginリリースに対して自動チェックを実行します。スキャンで保留またはブロックされたリリースは、所有者には `/dashboard` で表示されたまま、公開カタログやインストールサーフェスから消える場合があります。

サインインしたユーザーは、Skills とパッケージを報告できます。モデレーターは報告をレビューし、コンテンツを非表示または復元し、不正使用アカウントを禁止できます。ポリシーと執行の詳細については、[セキュリティ](/ja-JP/clawhub/security)、[セキュリティ監査](/clawhub/security-audits)、[モデレーションとアカウント安全性](/clawhub/moderation)、および [許容される使用](/clawhub/acceptable-usage) を参照してください。

## テレメトリと環境

ログイン中に `clawhub install` を実行すると、ClawHub が集計インストール数を計算できるように、CLI がベストエフォートのインストールイベントを送信する場合があります。これを無効にするには:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境オーバーライド:

| 変数                          | 効果                                              |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | ブラウザーログインに使用するサイト URL を上書きします。 |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。               |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定状態を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | インストールテレメトリを無効にします。            |

より詳しいリファレンス資料については、[テレメトリ](/clawhub/telemetry)、[HTTP API](/clawhub/http-api)、および [トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
