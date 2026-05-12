---
read_when:
    - ClawHub とは何かを説明する
    - Skills または Plugin の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - openclaw と clawhub の CLI フローの選択
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、および clawhub CLI に関する ClawHub の公開概要。
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T00:57:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub は OpenClaw の skills と plugins の公開レジストリです。

- ネイティブの `openclaw` コマンドを使用して、ClawHub から skills の検索、インストール、更新と、plugins のインストールを行います。
- レジストリ認証、公開、削除/削除取り消し、同期ワークフローには、別の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClaw で skills を検索してインストールします。

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

公開、同期、削除/削除取り消しなど、レジストリ認証付きのワークフローを使用したい場合は、ClawHub CLI をインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHub がホストするもの

| Surface        | 保存するもの                                                 | 一般的なコマンド                             |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md` と補助ファイルを含む、バージョン管理されたテキストバンドル | `openclaw skills install <slug>`             |
| コード plugins | 互換性メタデータを含む OpenClaw plugin パッケージ            | `openclaw plugins install clawhub:<package>` |
| バンドル plugins | OpenClaw 配布用にパッケージ化された plugin バンドル          | `clawhub package publish <source>`           |
| Souls          | onlycrabs.ai に表示される `SOUL.md` バンドル                 | Web と API の公開フロー                      |

ClawHub は semver バージョン、`latest` などのタグ、変更履歴、ファイル、ダウンロード数、スター、セキュリティスキャン概要を追跡します。公開ページには現在のレジストリ状態が表示されるため、ユーザーはインストール前に skill や plugin を確認できます。

## ネイティブ OpenClaw フロー

ネイティブの OpenClaw コマンドは、アクティブな OpenClaw ワークスペースにインストールし、ソースメタデータを永続化するため、後続の更新コマンドも ClawHub 上に留まれます。

plugin のインストールを ClawHub 経由で解決する必要がある場合は、`clawhub:<package>` を使用します。ベアの npm-safe plugin spec は、ローンチ移行期間中に npm 経由で解決される場合があります。また、ソースを明示する必要がある場合、`npm:<package>` は npm のみに留まります。

Plugin のインストールでは、アーカイブのインストールが実行される前に、公開されている `pluginApi` と `minGatewayVersion` の互換性を検証します。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた npm-pack `.tgz` そのものを優先し、ClawHub ダイジェストヘッダーとダウンロードしたバイト列を検証して、後続の更新用にアーティファクトメタデータを記録します。

## ClawHub CLI

ClawHub CLI は、レジストリ認証付きの作業に使用します。

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

この CLI には、直接レジストリワークフロー向けの skill インストール/更新コマンドもあります。

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

これらのコマンドは、現在の作業ディレクトリ配下の `./skills` に skills をインストールし、インストール済みバージョンを `.clawhub/lock.json` に記録します。

## 公開

`SKILL.md` を含むローカルフォルダから skills を公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: skill の slug。
- `--name <name>`: 表示名。
- `--version <version>`: semver バージョン。
- `--changelog <text>`: 変更履歴テキスト。
- `--tags <tags>`: カンマ区切りのタグ。デフォルトは `latest`。

ローカルフォルダ、`owner/repo`、`owner/repo@ref`、または GitHub URL から plugins を公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画を作成するには `--dry-run` を使用し、CI 向けの出力には `--json` を使用します。

コード plugins には、`package.json` に必要な OpenClaw 互換性メタデータを含める必要があります。これには `openclaw.compat.pluginApi` と `openclaw.build.openclawVersion` が含まれます。完全なコマンドリファレンスは [CLI](/ja-JP/clawhub/cli) を、skill メタデータは [Skill 形式](/ja-JP/clawhub/skill-format) を参照してください。

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でもアップロードできますが、公開にはアップロードゲートを通過できるだけ古い GitHub アカウントが必要です。公開詳細ページでは、インストールまたはダウンロードの前に最新のスキャン状態を要約します。

ClawHub は、公開された skills と plugin リリースに対して自動チェックを実行します。スキャン保留またはブロックされたリリースは、所有者には `/dashboard` で引き続き表示される一方で、公開カタログやインストール画面からは消える場合があります。

サインイン済みユーザーは、skills とパッケージを報告できます。モデレーターは報告を確認し、コンテンツの非表示や復元、不正利用アカウントの禁止を行えます。ポリシーと執行の詳細については、[許容される使用](/ja-JP/clawhub/acceptable-usage) と [セキュリティ + モデレーション](/ja-JP/clawhub/security) を参照してください。

## テレメトリと環境

ログイン中に `clawhub sync` を実行すると、ClawHub がインストール数を計算できるように、CLI は最小限のスナップショットを送信します。これを無効にするには、次を使用します。

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
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効にします。               |

より詳しいリファレンス資料については、[テレメトリ](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、[トラブルシューティング](/ja-JP/clawhub/troubleshooting) を参照してください。
