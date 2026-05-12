---
read_when:
    - ClawHub とは何かを説明する
    - Skills または Plugin の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - openclaw と clawhub の CLI フローの選び方
sidebarTitle: ClawHub
summary: 検出、インストール、公開、セキュリティ、clawhub CLI に関する公開 ClawHub の概要。
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T12:49:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHubは、OpenClawのSkillsとPluginの公開registryです。

- OpenClawネイティブの`openclaw`コマンドを使用して、Skillsの検索、インストール、更新、およびClawHubからのPluginのインストールを行います。
- registry認証、公開、削除/削除取り消し、同期ワークフローには、別個の`clawhub` CLIを使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

OpenClawでSkillsを検索してインストールします。

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

OpenClawでPluginを検索してインストールします。

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

公開、同期、削除/削除取り消しなど、registry認証が必要なワークフローを使う場合は、ClawHub CLIをインストールします。

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## ClawHubがホストするもの

| サーフェス        | 保存するもの                                               | 典型的なコマンド                              |
| -------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Skills         | `SKILL.md`と補助ファイルを含むバージョン付きテキストbundle | `openclaw skills install <slug>`             |
| コードPlugin   | 互換性metadataを含むOpenClaw Plugin packages         | `openclaw plugins install clawhub:<package>` |
| bundle Plugin | OpenClaw配信用のパッケージ化されたPlugin bundles            | `clawhub package publish <source>`           |
| Souls          | onlycrabs.aiに表示される`SOUL.md` bundle                      | WebとAPIの公開フロー                    |

ClawHubは、semverバージョン、`latest`などのタグ、changelog、ファイル、ダウンロード数、スター、security scanの要約を追跡します。公開ページには現在のregistry状態が表示されるため、ユーザーはインストール前にSkillやPluginを確認できます。

## OpenClawネイティブのフロー

OpenClawネイティブのコマンドは、activeなOpenClaw workspaceへインストールし、source metadataを永続化するため、後続の更新コマンドもClawHub上に留まれます。

PluginのインストールをClawHub経由で解決する必要がある場合は、`clawhub:<package>`を使用します。裸のnpm-safe Plugin specは、launch cutover中にnpm経由で解決される場合があり、sourceを明示する必要がある場合は`npm:<package>`がnpm専用のままになります。

Pluginのインストールでは、archive installが実行される前に、公開されている`pluginApi`と`minGatewayVersion`の互換性を検証します。package versionがClawPack artifactを公開している場合、OpenClawはアップロードされた正確なnpm-pack `.tgz`を優先し、ClawHub digest headerとダウンロードされたbytesを検証し、後続の更新用にartifact metadataを記録します。

## ClawHub CLI

ClawHub CLIは、registry認証が必要な作業に使用します。

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

CLIには、直接registry workflow向けのSkill install/updateコマンドもあります。

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

これらのコマンドは、現在のworking directory配下の`./skills`にSkillsをインストールし、インストール済みバージョンを`.clawhub/lock.json`に記録します。

## 公開

`SKILL.md`を含むlocal folderからSkillsを公開します。

```bash
clawhub skill publish <path>
```

一般的な公開オプション:

- `--slug <slug>`: Skill slug。
- `--name <name>`: 表示名。
- `--version <version>`: semverバージョン。
- `--changelog <text>`: changelog text。
- `--tags <tags>`: comma-separated tags。既定値は`latest`。

local folder、`owner/repo`、`owner/repo@ref`、またはGitHub URLからPluginを公開します。

```bash
clawhub package publish <source>
```

アップロードせずに正確な公開計画を作成するには`--dry-run`を使用し、CI向けの出力には`--json`を使用します。

コードPluginには、`package.json`内に必要なOpenClaw互換性metadataを含める必要があります。これには`openclaw.compat.pluginApi`と`openclaw.build.openclawVersion`が含まれます。完全なコマンドリファレンスは[CLI](/ja-JP/clawhub/cli)を、Skill metadataは[Skill format](/ja-JP/clawhub/skill-format)を参照してください。

## Securityとmoderation

ClawHubは既定でopenです。誰でもアップロードできますが、公開にはupload gateを通過できるだけ古いGitHubアカウントが必要です。公開詳細ページでは、インストールまたはダウンロードの前にlatest scan stateが要約されます。

ClawHubは、公開されたSkillsとPluginリリースに対して自動チェックを実行します。scan-heldまたはblocked releaseは、ownerには`/dashboard`で引き続き表示される一方で、公開catalogやinstall surfaceから消える場合があります。

サインインしたユーザーは、Skillsとpackagesを報告できます。moderatorはreportを確認し、contentを非表示または復元し、不正利用アカウントをbanできます。policyとenforcementの詳細については、[Acceptable usage](/ja-JP/clawhub/acceptable-usage)と[Security + moderation](/ja-JP/clawhub/security)を参照してください。

## Telemetryと環境

ログイン中に`clawhub sync`を実行すると、ClawHubがinstall countを計算できるよう、CLIは最小限のsnapshotを送信します。これを無効にするには、次を使用します。

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

便利な環境override:

| 変数                      | 効果                                            |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | browser loginに使用するsite URLをoverrideします。     |
| `CLAWHUB_REGISTRY`            | registry API URLをoverrideします。                    |
| `CLAWHUB_CONFIG_PATH`         | CLIがtoken/config stateを保存する場所をoverrideします。 |
| `CLAWHUB_WORKDIR`             | default working directoryをoverrideします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync`でtelemetryを無効化します。                      |

さらに詳しいreference materialについては、[Telemetry](/ja-JP/clawhub/telemetry)、[HTTP API](/ja-JP/clawhub/http-api)、[Troubleshooting](/ja-JP/clawhub/troubleshooting)を参照してください。
