---
read_when:
    - ClawHub とは何かを説明する
    - Skills や Plugin の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - openclaw と clawhub の CLI フローの選び方
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、および clawhub CLI について説明する公開 ClawHub 概要。
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:25:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw の Skills と Plugin の公開レジストリです。

- ネイティブの `openclaw` コマンドを使用して、ClawHub から Skills を検索、インストール、更新し、Plugin をインストールします。
- レジストリ認証、公開、削除/削除解除、再スキャン、同期ワークフローには、別の `clawhub` CLI を使用します。

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

公開、同期、削除/削除解除、所有者が要求した再スキャンなどの
レジストリ認証済みワークフローが必要な場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| サーフェス        | 保存するもの                                               | 一般的なコマンド                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` と補助ファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install <slug>`             |
| コード Plugin   | 互換性メタデータを含む OpenClaw Plugin パッケージ         | `openclaw plugins install clawhub:<package>` |
| バンドル Plugin | OpenClaw 配布用のパッケージ化された Plugin バンドル            | `clawhub package publish <source>`           |
| Souls          | onlycrabs.ai に表示される `SOUL.md` バンドル                      | Web と API の公開フロー                    |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、
ダウンロード数、スター、セキュリティスキャンの概要を追跡します。公開ページには現在のレジストリ
状態が表示されるため、ユーザーはインストール前に Skill や Plugin を確認できます。

## ネイティブ OpenClaw フロー

ネイティブの OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、
ソースメタデータを保持するため、後続の更新コマンドも ClawHub 上にとどまれます。

Plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。
素の npm-safe な Plugin 指定は、ローンチの切り替え期間中に npm 経由で解決されることがあり、
ソースを明示する必要がある場合、`npm:<package>` は npm 専用のままです。

Plugin のインストールでは、アーカイブのインストールが実行される前に、公開されている `pluginApi` と `minGatewayVersion`
の互換性が検証されます。パッケージバージョンが ClawPack アーティファクトを公開している場合、
OpenClaw はアップロードされた厳密な npm-pack `.tgz` を優先し、ClawHub ダイジェストヘッダーと
ダウンロード済みバイト列を検証し、後続の更新のためにアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI はレジストリ認証済み作業向けです。

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

CLI には、直接レジストリワークフロー向けの Skill インストール/更新コマンドもあります。

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

- `--slug <slug>`: Skill のスラッグ。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub
URL から Plugin を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに厳密な公開計画をビルドするには `--dry-run` を使用し、CI 向けの出力には `--json`
を使用します。

コード Plugin には、`package.json` に必要な OpenClaw 互換性メタデータを含める必要があります。
これには `openclaw.compat.pluginApi` と
`openclaw.build.openclawVersion` が含まれます。完全なコマンド
リファレンスは [CLI](/ja-JP/clawhub/cli) を、Skill メタデータは [Skill 形式](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけの期間が経過した GitHub
アカウントが必要です。公開詳細ページには、インストールまたはダウンロード前に
最新のスキャン状態が要約されます。

ClawHub は公開された Skills と Plugin リリースに対して自動チェックを実行します。スキャン保留中
またはブロックされたリリースは、所有者には `/dashboard` で引き続き表示される一方で、
公開カタログやインストール画面から消えることがあります。

所有者は、誤検知からの復旧のために限定的な再スキャンを要求できます。プラットフォームの
モデレーターと管理者は、サポート報告を処理する際に、任意の Skill またはパッケージの再スキャンを要求できます。

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

サインイン済みユーザーは、Skills とパッケージを報告できます。モデレーターは報告をレビューし、
コンテンツの非表示または復元、異議申し立ての解決、不正利用アカウントの禁止を行えます。ポリシーと執行の詳細については、
[許容される利用](/ja-JP/clawhub/acceptable-usage) と
[セキュリティ + モデレーション](/ja-JP/clawhub/security) を参照してください。

## テレメトリと環境

ログイン中に `clawhub sync` を実行すると、ClawHub がインストール数を計算できるように、CLI は最小限のスナップショットを送信します。
これは次で無効にできます。

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
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効にします。                      |

より詳しい参考資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、および
[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
