---
read_when:
    - Skills または plugins の検索、インストール、更新
    - Skills または plugins をレジストリに公開する
    - clawhub CLI またはその環境オーバーライドの設定
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw の Skills と plugins の公開レジストリ、ネイティブなインストールフロー、および clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:41:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub は **OpenClaw の Skills と plugins** の公開レジストリです。

- Skills の検索、インストール、更新、および ClawHub からの plugins のインストールには、ネイティブの `openclaw` コマンドを使用します。
- レジストリ認証、公開、削除 / 復元、および sync ワークフローには、別の `clawhub` CLI を使用します。

サイト: [clawhub.ai](https://clawhub.ai)

## クイックスタート

<Steps>
  <Step title="検索">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="インストール">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="使用">
    新しい OpenClaw セッションを開始すると、新しい skill が反映されます。
  </Step>
  <Step title="公開（任意）">
    レジストリ認証が必要なワークフロー（公開、sync、管理）では、別の `clawhub` CLI をインストールしてください。

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## ネイティブ OpenClaw フロー

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    ネイティブの `openclaw` コマンドは、アクティブな workspace にインストールし、ソースメタデータを保持するため、後続の `update` 呼び出しでも ClawHub を使い続けられます。

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    npm-safe な素の plugin spec も、npm より先に ClawHub に対して試行されます。

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Plugin のインストールでは、archive install 実行前に、公開されている `pluginApi` と `minGatewayVersion` の互換性を検証するため、互換性のないホストでは package を中途半端にインストールするのではなく、早い段階で fail closed します。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` は、インストール可能な plugin ファミリーのみを受け付けます。ClawHub package が実際には skill の場合、OpenClaw は停止し、代わりに `openclaw skills install <slug>` を使うよう案内します。

匿名の ClawHub plugin インストールも、private packages に対しては fail closed します。community やその他の非公式チャネルからは引き続きインストールできますが、有効化前にソースと検証内容を運用者が確認できるよう、OpenClaw は警告を表示します。
</Note>

## ClawHub とは

- OpenClaw の Skills と plugins の公開レジストリ。
- skill バンドルとメタデータのバージョン管理されたストア。
- 検索、タグ、使用シグナルのための discovery surface。

典型的な skill は、次を含むバージョン管理されたファイルバンドルです。

- 主要な説明と使い方を含む `SKILL.md` ファイル。
- skill が使用する任意の config、scripts、または補助ファイル。
- tags、summary、install 要件などの metadata。

ClawHub は metadata を使って discovery を強化し、skill capabilities を安全に公開します。レジストリは、ランキングと可視性を改善するために使用シグナル（stars、downloads）を追跡します。公開のたびに新しい semver version が作成され、レジストリは version history を保持するため、ユーザーは変更を監査できます。

## Workspace と skill の読み込み

別の `clawhub` CLI は、現在の作業ディレクトリ配下の `./skills` にも skills をインストールします。OpenClaw workspace が設定されている場合、`clawhub` は `--workdir`（または `CLAWHUB_WORKDIR`）で上書きしない限り、その workspace にフォールバックします。OpenClaw は `<workspace>/skills` から workspace skills を読み込み、**次の** セッションで反映します。

すでに `~/.openclaw/skills` またはバンドル済み skills を使用している場合、workspace skills が優先されます。skills の読み込み、共有、制御方法の詳細については、[Skills](/ja-JP/tools/skills) を参照してください。

## サービス機能

| Feature            | Notes                                                      |
| ------------------ | ---------------------------------------------------------- |
| 公開ブラウズ       | Skills とその `SKILL.md` コンテンツは公開閲覧可能です。    |
| 検索               | キーワードだけではなく、embedding ベース（vector search）です。 |
| バージョン管理     | Semver、changelogs、tags（`latest` を含む）。              |
| ダウンロード       | version ごとの Zip。                                       |
| Stars と comments  | コミュニティからのフィードバック。                         |
| モデレーション     | 承認と監査。                                               |
| CLI 向け API       | 自動化とスクリプトに適しています。                         |

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でも skills をアップロードできますが、公開するには GitHub アカウントが **少なくとも 1 週間以上前に作成** されている必要があります。これにより、正当なコントリビューターを妨げることなく、悪用を抑制します。

<AccordionGroup>
  <Accordion title="報告">
    - サインイン済みの任意のユーザーが skill を報告できます。
    - 報告理由は必須で、記録されます。
    - 各ユーザーは同時に最大 20 件まで有効な報告を持てます。
    - 3 件を超える一意の報告がある skills は、デフォルトで自動的に非表示になります。

  </Accordion>
  <Accordion title="モデレーション">
    - モデレーターは、非表示の skills を表示したり、再表示、削除、またはユーザーの ban を行えます。
    - 報告機能の悪用は、アカウント ban の対象になる場合があります。
    - モデレーターになることに興味がありますか？ OpenClaw Discord で尋ね、モデレーターまたは maintainer に連絡してください。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

これは、publish/sync などのレジストリ認証が必要なワークフローでのみ必要です。

### グローバルオプション

<ParamField path="--workdir <dir>" type="string">
  作業ディレクトリ。デフォルト: 現在の dir。OpenClaw workspace にフォールバックします。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  workdir からの相対パスで指定する Skills ディレクトリ。
</ParamField>
<ParamField path="--site <url>" type="string">
  サイトのベース URL（ブラウザログイン）。
</ParamField>
<ParamField path="--registry <url>" type="string">
  レジストリ API のベース URL。
</ParamField>
<ParamField path="--no-input" type="boolean">
  プロンプトを無効化します（非対話モード）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI version を表示します。
</ParamField>

### コマンド

<AccordionGroup>
  <Accordion title="認証（login / logout / whoami）">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    ログインオプション:

    - `--token <token>` — API トークンを貼り付けます。
    - `--label <label>` — browser login tokens 用に保存するラベル（デフォルト: `CLI token`）。
    - `--no-browser` — ブラウザを開きません（`--token` が必要）。

  </Accordion>
  <Accordion title="検索">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — 最大結果数。

  </Accordion>
  <Accordion title="インストール / 更新 / 一覧">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    オプション:

    - `--version <version>` — 特定 version にインストールまたは更新します（`update` では単一 slug のみ）。
    - `--force` — フォルダがすでに存在する場合、またはローカルファイルが公開済み version のいずれにも一致しない場合に上書きします。
    - `clawhub list` は `.clawhub/lock.json` を読み取ります。

  </Accordion>
  <Accordion title="Skills を公開">
    ```bash
    clawhub skill publish <path>
    ```

    オプション:

    - `--slug <slug>` — skill slug。
    - `--name <name>` — 表示名。
    - `--version <version>` — semver version。
    - `--changelog <text>` — changelog テキスト（空でも可）。
    - `--tags <tags>` — カンマ区切りの tags（デフォルト: `latest`）。

  </Accordion>
  <Accordion title="Plugins を公開">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` には、ローカルフォルダ、`owner/repo`、`owner/repo@ref`、または GitHub URL を指定できます。

    オプション:

    - `--dry-run` — 何もアップロードせずに、正確な公開プランをビルドします。
    - `--json` — CI 用に machine-readable output を出力します。
    - `--source-repo`, `--source-commit`, `--source-ref` — 自動検出だけでは不十分な場合の任意の上書き。

  </Accordion>
  <Accordion title="削除 / 復元（owner または admin）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync（ローカルをスキャンして新規または更新分を公開）">
    ```bash
    clawhub sync
    ```

    オプション:

    - `--root <dir...>` — 追加のスキャンルート。
    - `--all` — 確認なしですべてをアップロードします。
    - `--dry-run` — 何がアップロードされるかを表示します。
    - `--bump <type>` — 更新時の `patch|minor|major`（デフォルト: `patch`）。
    - `--changelog <text>` — 非対話更新用の changelog。
    - `--tags <tags>` — カンマ区切りの tags（デフォルト: `latest`）。
    - `--concurrency <n>` — レジストリチェック数（デフォルト: `4`）。

  </Accordion>
</AccordionGroup>

## 一般的なワークフロー

<Tabs>
  <Tab title="検索">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="インストール">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="すべて更新">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="単一の skill を公開">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="多数の skills を sync">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="GitHub から plugin を公開">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin package metadata

コード plugins には、`package.json` に必要な OpenClaw metadata を含める必要があります。

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

公開される packages は、ビルド済みの **JavaScript** を含み、`runtimeExtensions` をその出力に向けるべきです。Git checkout installs では、ビルド済みファイルが存在しない場合に TypeScript ソースへフォールバックできますが、ビルド済み runtime entries は startup、doctor、および plugin 読み込みパスでの実行時 TypeScript コンパイルを回避できます。

## バージョン管理、lockfile、telemetry

<AccordionGroup>
  <Accordion title="バージョン管理と tags">
    - 各公開は新しい **semver** `SkillVersion` を作成します。
    - tags（`latest` など）は version を指します。tags を移動することでロールバックできます。
    - changelogs は version ごとに紐付けられ、sync や更新公開時には空でも構いません。

  </Accordion>
  <Accordion title="ローカル変更とレジストリ version の比較">
    更新では、ローカルの skill 内容を content hash を使ってレジストリ version と比較します。ローカルファイルが公開済み version のいずれにも一致しない場合、CLI は上書き前に確認します（非対話実行では `--force` が必要です）。
  </Accordion>
  <Accordion title="Sync スキャンとフォールバックルート">
    `clawhub sync` は最初に現在の workdir をスキャンします。skills が見つからない場合は、既知のレガシー場所（たとえば `~/openclaw/skills` や `~/.openclaw/skills`）にフォールバックします。これは、追加フラグなしで古い skill インストールを見つけるための設計です。
  </Accordion>
  <Accordion title="保存場所と lockfile">
    - インストールされた skills は、workdir 配下の `.clawhub/lock.json` に記録されます。
    - 認証トークンは ClawHub CLI の config ファイルに保存されます（`CLAWHUB_CONFIG_PATH` で上書き可能）。

  </Accordion>
  <Accordion title="Telemetry（インストール数）">
    ログインした状態で `clawhub sync` を実行すると、CLI はインストール数を計算するための最小限のスナップショットを送信します。これは完全に無効化できます。

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

| Variable                      | 効果                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | サイト URL を上書きします。                     |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。             |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン / config を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの workdir を上書きします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` 時の telemetry を無効化します。          |

## 関連

- [Community plugins](/ja-JP/plugins/community)
- [Plugins](/ja-JP/tools/plugin)
- [Skills](/ja-JP/tools/skills)
