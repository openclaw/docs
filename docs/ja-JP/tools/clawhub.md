---
read_when:
    - 新しいユーザー向けのClawHub紹介
    - SkillsやPluginのインストール、検索、公開
    - ClawHub CLIフラグとsync動作の説明
summary: 'ClawHubガイド: 公開registry、ネイティブOpenClawインストールフロー、ClawHub CLIワークフロー'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T05:23:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHubは、**OpenClaw SkillsとPlugin** の公開registryです。

- ClawHubからSkillsの検索/インストール/更新やPluginのインストールには、ネイティブの `openclaw` commandを使ってください。
- registry auth、公開、削除、undelete、sync workflowが必要な場合は、別の `clawhub` CLIを使ってください。

サイト: [clawhub.ai](https://clawhub.ai)

## ネイティブOpenClawフロー

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

bareなnpm-safe plugin specも、npmより前にClawHubに対して試行されます:

```bash
openclaw plugins install openclaw-codex-app-server
```

ネイティブ `openclaw` commandは、アクティブworkspaceにインストールし、後続の `update` 呼び出しでClawHubに留まれるようsource
metadataを永続化します。

Pluginインストールは、archive install実行前に広告された `pluginApi` と `minGatewayVersion`
compatibilityを検証するため、非互換hostではpackageを部分的にインストールするのではなく、早い段階でfail closedします。

`openclaw plugins install clawhub:...` は、インストール可能なplugin familyのみを受け付けます。
ClawHub packageが実際にはskillだった場合、OpenClawは停止し、代わりに
`openclaw skills install <slug>` を案内します。

## ClawHubとは何か

- OpenClaw SkillsとPluginの公開registry。
- Skill bundleとmetadataのversion付きストア。
- 検索、tag、usage signalのためのdiscoveryサーフェス。

## 仕組み

1. ユーザーがskill bundle（file + metadata）を公開する。
2. ClawHubがbundleを保存し、metadataを解析してversionを割り当てる。
3. registryがそのskillを検索とdiscovery向けにindex化する。
4. ユーザーがOpenClawでSkillsを閲覧、ダウンロード、インストールする。

## できること

- 新しいSkillsや既存Skillsの新versionを公開する。
- 名前、tag、検索でSkillsを見つける。
- Skill bundleをダウンロードしてfileを確認する。
- 迷惑または危険なskillを報告する。
- moderatorなら、非表示化、再表示、削除、banができる。

## 対象ユーザー（初心者向け）

OpenClaw agentに新しい能力を追加したいなら、ClawHubはSkillsを見つけてインストールする最も簡単な方法です。backendの仕組みを知る必要はありません。できること:

- 平易な言葉でSkillsを検索する。
- workspaceにskillをインストールする。
- 後で1つのcommandでSkillsを更新する。
- 自分のSkillsを公開してバックアップする。

## クイックスタート（非技術者向け）

1. 必要なものを検索する:
   - `openclaw skills search "calendar"`
2. skillをインストールする:
   - `openclaw skills install <skill-slug>`
3. 新しいOpenClaw sessionを開始して、新しいskillを取り込ませる。
4. registry authを使った公開や管理もしたい場合は、別の
   `clawhub` CLIもインストールしてください。

## ClawHub CLIをインストールする

これは、公開やsyncのようなregistry認証付きworkflowにだけ必要です:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## OpenClaw内での位置付け

ネイティブ `openclaw skills install` は、アクティブworkspaceの `skills/`
directoryにインストールします。`openclaw plugins install clawhub:...` は、通常のmanaged
plugin installに加え、更新用のClawHub source metadataも記録します。

匿名のClawHub plugin installも、private packageに対してはfail closedします。
communityやその他のofficialでないchannelからのインストールは引き続き可能ですが、OpenClawは
sourceとverificationを有効化前にoperatorが確認できるよう警告します。

別の `clawhub` CLIも、現在のworking directory配下の `./skills` にSkillsをインストールします。OpenClaw workspaceが設定されている場合、`clawhub`
は `--workdir`（または
`CLAWHUB_WORKDIR`）でoverrideしない限り、そのworkspaceへフォールバックします。OpenClawはworkspace Skillsを `<workspace>/skills`
から読み込み、**次の** sessionで取り込みます。すでに
`~/.openclaw/skills` や同梱Skillsを使っている場合、workspace Skillsが優先されます。

Skillsがどのように読み込まれ、共有され、gatedされるかの詳細は、
[Skills](/ja-JP/tools/skills) を参照してください。

## Skill system概要

skillは、OpenClawに特定のtaskの実行方法を教える、version付きのfile bundleです。公開のたびに新しいversionが作られ、registryはversion履歴を保持するため、ユーザーは変更を監査できます。

典型的なskillには次が含まれます:

- 主な説明と使い方を含む `SKILL.md` file。
- skillで使う任意のconfig、script、補助file。
- tag、summary、install requirementなどのmetadata。

ClawHubはmetadataを使ってdiscoveryを支え、skill capabilityを安全に公開します。
registryはまた、rankingと可視性を改善するためにusage signal（starやdownloadなど）も追跡します。

## サービスが提供するもの（機能）

- Skillsとその `SKILL.md` 内容の**公開閲覧**。
- 単なるkeywordではなく、embedding（vector search）による**検索**。
- semver、changelog、tag（`latest` を含む）付きの**version管理**。
- versionごとのzipとしての**ダウンロード**。
- community feedbackのための**starとcomment**。
- 承認と監査のための**moderation** hook。
- 自動化とscript向けの**CLIフレンドリーなAPI**。

## セキュリティとmoderation

ClawHubはデフォルトでオープンです。誰でもskillをアップロードできますが、公開には少なくとも1週間以上前に作成されたGitHub accountが必要です。これにより、正当な貢献者を妨げずにabuseを抑えやすくします。

報告とmoderation:

- サインイン済みユーザーなら誰でもskillを報告できる。
- 報告理由は必須で、記録される。
- 各ユーザーは同時に最大20件のactive reportを持てる。
- 3件を超える一意のreportがあるskillは、デフォルトで自動的に非表示になる。
- moderatorは非表示skillを見たり、再表示、削除、ユーザーbanを行える。
- 報告機能の悪用はaccount banにつながる場合がある。

moderatorになりたいですか？ OpenClaw Discordで質問し、
moderatorまたはmaintainerに連絡してください。

## CLI commandとパラメーター

グローバルoption（すべてのcommandに適用）:

- `--workdir <dir>`: working directory（デフォルト: 現在のdir。OpenClaw workspaceにフォールバック）。
- `--dir <dir>`: Skills directory。workdirからの相対path（デフォルト: `skills`）。
- `--site <url>`: site base URL（browser login）。
- `--registry <url>`: registry API base URL。
- `--no-input`: promptを無効化する（非対話）。
- `-V, --cli-version`: CLI versionを表示する。

Auth:

- `clawhub login`（browser flow）または `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Options:

- `--token <token>`: API tokenを貼り付ける。
- `--label <label>`: browser login tokenに保存するlabel（デフォルト: `CLI token`）。
- `--no-browser`: browserを開かない（`--token` が必要）。

検索:

- `clawhub search "query"`
- `--limit <n>`: 最大結果数。

インストール:

- `clawhub install <slug>`
- `--version <version>`: 特定versionをインストールする。
- `--force`: folderがすでに存在する場合に上書きする。

更新:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: 特定versionへ更新する（単一slugのみ）。
- `--force`: ローカルfileがどの公開versionとも一致しない場合に上書きする。

一覧:

- `clawhub list`（`.clawhub/lock.json` を読む）

Skillを公開する:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill slug。
- `--name <name>`: 表示名。
- `--version <version>`: semver version。
- `--changelog <text>`: changelog text（空でも可）。
- `--tags <tags>`: カンマ区切りtag（デフォルト: `latest`）。

Pluginを公開する:

- `clawhub package publish <source>`
- `<source>` には、ローカルfolder、`owner/repo`、`owner/repo@ref`、またはGitHub URLを使える。
- `--dry-run`: 何もアップロードせず、正確な公開計画をbuildする。
- `--json`: CI向けにmachine-readable outputを出す。
- `--source-repo`, `--source-commit`, `--source-ref`: 自動検出だけでは不十分な場合の任意override。

削除/undelete（owner/adminのみ）:

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync（ローカルSkillsをscanして新規/更新分を公開）:

- `clawhub sync`
- `--root <dir...>`: 追加のscan root。
- `--all`: promptなしですべてアップロードする。
- `--dry-run`: 何がアップロードされるかを表示する。
- `--bump <type>`: 更新時の `patch|minor|major`（デフォルト: `patch`）。
- `--changelog <text>`: 非対話更新用のchangelog。
- `--tags <tags>`: カンマ区切りtag（デフォルト: `latest`）。
- `--concurrency <n>`: registry check数（デフォルト: 4）。

## agent向けの一般的なworkflow

### Skillsを検索する

```bash
clawhub search "postgres backups"
```

### 新しいSkillsをダウンロードする

```bash
clawhub install my-skill-pack
```

### インストール済みSkillsを更新する

```bash
clawhub update --all
```

### Skillsをバックアップする（公開またはsync）

単一のskill folderの場合:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

多くのSkillsを一度にscanしてバックアップするには:

```bash
clawhub sync --all
```

### GitHubからPluginを公開する

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

code Pluginには、`package.json` に必要なOpenClaw metadataが含まれている必要があります:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

公開されるpackageは、build済みJavaScriptを含み、`runtimeExtensions`
をその出力に向けるべきです。Git checkout installは、build済みfileが存在しない場合にTypeScript sourceへフォールバックすることはできますが、build済みruntime entryがあるとstartup、doctor、plugin loading pathでのruntime TypeScript
compilationを避けられます。

## 高度な詳細（技術）

### バージョン管理とtag

- 各公開で新しい **semver** `SkillVersion` が作られる。
- `latest` のようなtagは特定versionを指し、tagを動かすことでロールバックできる。
- changelogはversionごとに付属し、syncや更新公開時には空でもよい。

### ローカル変更とregistry version

更新では、content hashを使ってローカルskill内容とregistry versionを比較します。ローカルfileがどの公開versionとも一致しない場合、CLIは上書き前に確認を求めます（非対話実行では `--force` が必要）。

### Sync scanとfallback root

`clawhub sync` は、まず現在のworkdirをscanします。skillが見つからない場合、既知のlegacy location（たとえば `~/openclaw/skills` や `~/.openclaw/skills`）へフォールバックします。これは、追加flagなしで古いskill installを見つけるための設計です。

### 保存場所とlockfile

- インストール済みSkillsは、workdir配下の `.clawhub/lock.json` に記録されます。
- auth tokenはClawHub CLI config fileに保存されます（`CLAWHUB_CONFIG_PATH` でoverride可能）。

### Telemetry（install count）

ログイン中に `clawhub sync` を実行すると、CLIはinstall count算出のため最小限のsnapshotを送信します。これを完全に無効化するには:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## 環境変数

- `CLAWHUB_SITE`: site URLをoverrideする。
- `CLAWHUB_REGISTRY`: registry API URLをoverrideする。
- `CLAWHUB_CONFIG_PATH`: CLIがtoken/configを保存する場所をoverrideする。
- `CLAWHUB_WORKDIR`: デフォルトworkdirをoverrideする。
- `CLAWHUB_DISABLE_TELEMETRY=1`: `sync` 時のtelemetryを無効化する。

## 関連

- [Plugin](/ja-JP/tools/plugin)
- [Skills](/ja-JP/tools/skills)
- [Community plugins](/ja-JP/plugins/community)
