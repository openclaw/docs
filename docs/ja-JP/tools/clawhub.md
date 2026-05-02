---
read_when:
    - Skills または Plugin の検索、インストール、更新
    - Skills または Plugin をレジストリに公開する
    - clawhub CLI またはその環境オーバーライドの設定
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw の Skills と Plugin、ネイティブなインストールフロー、clawhub CLI の公開レジストリ'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:07:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub は **OpenClaw Skills とプラグイン**の公開レジストリです。

- Skills の検索、インストール、更新、および ClawHub からのプラグインのインストールには、ネイティブの `openclaw` コマンドを使用します。
- レジストリ認証、公開、削除/削除取り消し、同期ワークフローには、別の `clawhub` CLI を使用します。

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
    新しい OpenClaw セッションを開始します。新しい skill が読み込まれます。
  </Step>
  <Step title="公開（任意）">
    レジストリ認証済みワークフロー（公開、同期、管理）では、
    別の `clawhub` CLI をインストールします。

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

    ネイティブの `openclaw` コマンドはアクティブなワークスペースにインストールし、
    ソースメタデータを保持するため、後続の `update` 呼び出しでも ClawHub 上に留まれます。

  </Tab>
  <Tab title="プラグイン">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` は ClawHub プラグインカタログに問い合わせ、インストール可能な
    パッケージ名を出力します。ClawHub 解決を使いたい場合は `clawhub:<package>` を使用します。
    ベアな npm-safe プラグイン spec は、ローンチ移行期間中に npm からインストールされます。

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` も npm 専用で、spec が別の意味にも解釈され得る場合に便利です。

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    プラグインのインストールは、アーカイブインストールを実行する前に、公開されている `pluginApi` と
    `minGatewayVersion` の互換性を検証します。そのため、互換性のないホストでは
    パッケージを部分的にインストールするのではなく、早期に閉じて失敗します。パッケージバージョンが ClawPack アーティファクトを公開している場合、
    OpenClaw はアップロード済みの npm-pack `.tgz` そのものを優先し、ClawHub
    ダイジェストヘッダーとダウンロード済みバイト列を検証し、後続の
    更新のために、アーティファクト種別、npm
    integrity、npm shasum、tarball 名、ClawPack ダイジェストメタデータを記録します。ClawPack メタデータのない古いパッケージバージョンは、引き続き
    従来のパッケージアーカイブ検証パスを使用します。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` は、インストール可能なプラグイン
ファミリーのみを受け付けます。ClawHub パッケージが実際には skill の場合、OpenClaw は停止し、
代わりに `openclaw skills install <slug>` を案内します。

匿名の ClawHub プラグインインストールも、非公開パッケージでは閉じて失敗します。
コミュニティやその他の非公式チャネルは引き続きインストールできますが、OpenClaw は
警告を出し、オペレーターが有効化前にソースと検証を確認できるようにします。
</Note>

## ClawHub とは

- OpenClaw Skills とプラグインの公開レジストリ。
- skill バンドルとメタデータのバージョン付きストア。
- 検索、タグ、利用シグナルのための発見サーフェス。

一般的な skill は、次を含むファイルのバージョン付きバンドルです。

- 主な説明と使用方法を含む `SKILL.md` ファイル。
- skill が使用する任意の設定、スクリプト、または補助ファイル。
- タグ、概要、インストール要件などのメタデータ。

ClawHub は、発見機能を支え、skill
機能を安全に公開するためにメタデータを使用します。レジストリは利用シグナル（スター、ダウンロード）を追跡して
ランキングと可視性を改善します。公開ごとに新しい semver
バージョンが作成され、レジストリはバージョン履歴を保持するため、ユーザーは
変更を監査できます。

## ワークスペースと skill の読み込み

別の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` に
skills をインストールします。OpenClaw ワークスペースが設定されている場合、
`clawhub` は `--workdir`
（または `CLAWHUB_WORKDIR`）で上書きしない限り、そのワークスペースにフォールバックします。OpenClaw は
`<workspace>/skills` からワークスペース skills を読み込み、**次の**セッションでそれらを取り込みます。

すでに `~/.openclaw/skills` またはバンドル済み skills を使用している場合、
ワークスペース skills が優先されます。skills がどのように読み込まれ、
共有され、ゲートされるかの詳細は、[Skills](/ja-JP/tools/skills) を参照してください。

## サービス機能

| 機能                  | 注記                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| 公開ブラウズ          | Skills とその `SKILL.md` コンテンツは公開表示できます。          |
| 検索                   | キーワードだけでなく、埋め込みベース（ベクトル検索）です。               |
| バージョニング               | Semver、変更履歴、タグ（`latest` を含む）。                  |
| ダウンロード                | バージョンごとの Zip。                                                    |
| スターとコメント       | コミュニティからのフィードバック。                                                 |
| セキュリティスキャン概要  | 詳細ページには、インストールまたはダウンロード前の最新スキャン状態が表示されます。 |
| スキャナー詳細ページ     | VirusTotal、ClawScan、静的解析の結果には deep link があります。  |
| オーナー復旧ダッシュボード | 公開者は `/dashboard` からスキャン保留中の所有コンテンツを確認できます。       |
| オーナー要求の再スキャン  | オーナーは false positive の復旧のため、限定的な再スキャンを要求できます。     |
| モデレーション               | 承認と監査。                                               |
| CLI 向け API         | 自動化とスクリプトに適しています。                              |

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でも skills をアップロードできますが、公開するには GitHub
アカウントが**少なくとも 1 週間前に作成されている**必要があります。これにより、
正当なコントリビューターを妨げずに悪用を遅らせます。

<AccordionGroup>
  <Accordion title="セキュリティスキャン">
    ClawHub は、公開された skills とプラグイン
    リリースに対して自動セキュリティチェックを実行します。公開詳細ページは現在の結果を要約し、スキャナー
    行は VirusTotal、ClawScan、静的
    解析の専用詳細ページにリンクします。

    スキャン保留中またはブロックされたリリースは、公開カタログや
    インストールサーフェスでは利用できない場合がありますが、オーナーには `/dashboard` で引き続き表示されます。

  </Accordion>
  <Accordion title="報告">
    - サインイン済みの任意のユーザーが skill を報告できます。
    - 報告理由は必須で、記録されます。
    - 各ユーザーは同時に最大 20 件のアクティブな報告を持てます。
    - 3 人を超えるユニークな報告がある skills は、デフォルトで自動的に非表示になります。

  </Accordion>
  <Accordion title="モデレーション">
    - モデレーターは非表示の skills を表示し、再表示し、削除し、またはユーザーを ban できます。
    - 報告機能の悪用はアカウント ban につながる場合があります。
    - モデレーターになることに興味がありますか？OpenClaw Discord で質問し、モデレーターまたはメンテナーに連絡してください。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

これは、公開/同期などのレジストリ認証済みワークフローでのみ必要です。

### グローバルオプション

<ParamField path="--workdir <dir>" type="string">
  作業ディレクトリ。デフォルト: 現在のディレクトリ。OpenClaw ワークスペースにフォールバックします。
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
  プロンプトを無効化します（非対話）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI バージョンを出力します。
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
    - `--label <label>` — ブラウザログイントークン用に保存されるラベル（デフォルト: `CLI token`）。
    - `--no-browser` — ブラウザを開きません（`--token` が必要）。

  </Accordion>
  <Accordion title="検索">
    ```bash
    clawhub search "query"
    ```

    skills を検索します。プラグイン/パッケージの発見には、`clawhub package explore` を使用します。

    - `--limit <n>` — 最大結果数。

  </Accordion>
  <Accordion title="プラグインのブラウズ / 検査">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` と `package inspect` は、プラグイン/パッケージの発見とメタデータ検査のための ClawHub CLI サーフェスです。ネイティブ OpenClaw インストールでは引き続き `openclaw plugins install clawhub:<package>` を使用します。

    オプション:

    - `--family skill|code-plugin|bundle-plugin` — パッケージファミリーでフィルターします。
    - `--official` — 公式パッケージのみを表示します。
    - `--executes-code` — コードを実行するパッケージのみを表示します。
    - `--version <version>` / `--tag <tag>` — 特定のパッケージバージョンを検査します。
    - `--versions`, `--files`, `--file <path>` — パッケージ履歴とファイルを検査します。
    - `--json` — 機械可読の出力。

  </Accordion>
  <Accordion title="インストール / 更新 / 一覧">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    オプション:

    - `--version <version>` — 特定のバージョンをインストールまたは更新します（`update` では単一 slug のみ）。
    - `--force` — フォルダーがすでに存在する場合、またはローカルファイルが公開済みバージョンのいずれとも一致しない場合に上書きします。
    - `clawhub list` は `.clawhub/lock.json` を読み取ります。

  </Accordion>
  <Accordion title="skills の公開">
    ```bash
    clawhub skill publish <path>
    ```

    オプション:

    - `--slug <slug>` — skill slug。
    - `--name <name>` — 表示名。
    - `--version <version>` — semver バージョン。
    - `--changelog <text>` — 変更履歴テキスト（空でも可）。
    - `--tags <tags>` — カンマ区切りのタグ（デフォルト: `latest`）。

  </Accordion>
  <Accordion title="プラグインの公開">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` はローカルフォルダー、`owner/repo`、`owner/repo@ref`、または
    GitHub URL にできます。

    オプション:

    - `--dry-run` — 何もアップロードせず、正確な公開計画を作成します。
    - `--json` — CI 用の機械可読出力を出力します。
    - `--source-repo`, `--source-commit`, `--source-ref` — 自動検出が不十分な場合の任意の上書き。

  </Accordion>
  <Accordion title="再スキャンの要求">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    再スキャンコマンドには、ログイン済みオーナートークンが必要で、最新の
    公開済み skill バージョンまたはプラグインリリースを対象にします。非対話実行では、
    `--yes` を渡します。

    JSON レスポンスには、対象の種類、名前、バージョン、再スキャンステータス、および
    そのバージョンまたはリリースの残り/最大リクエスト数が含まれます。

  </Accordion>
  <Accordion title="削除 / 削除取り消し（オーナーまたは管理者）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同期（ローカルをスキャン + 新規または更新済みを公開）">
    ```bash
    clawhub sync
    ```

    オプション:

    - `--root <dir...>` — 追加のスキャンルート。
    - `--all` — プロンプトなしですべてをアップロードします。
    - `--dry-run` — アップロードされる内容を表示します。
    - `--bump <type>` — 更新用の `patch|minor|major`（デフォルト: `patch`）。
    - `--changelog <text>` — 非対話更新用の変更履歴。
    - `--tags <tags>` — カンマ区切りのタグ（デフォルト: `latest`）。
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
  <Tab title="Plugin を探す">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
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
  <Tab title="多数の skills を同期">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="GitHub から Plugin を公開">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin パッケージメタデータ

コード Plugin には、必要な OpenClaw メタデータを
`package.json` に含める必要があります。

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

公開されるパッケージには **ビルド済み JavaScript** を同梱し、
`runtimeExtensions` がその出力を指すようにする必要があります。Git チェックアウトのインストールでは、ビルド済みファイルが存在しない場合でも TypeScript ソースにフォールバックできますが、ビルド済みランタイムエントリにより、起動、doctor、Plugin 読み込みパスでの実行時 TypeScript コンパイルを避けられます。

## バージョニング、lockfile、テレメトリ

<AccordionGroup>
  <Accordion title="バージョニングとタグ">
    - 公開ごとに新しい **semver** `SkillVersion` が作成されます。
    - タグ（`latest` など）はバージョンを指します。タグを移動するとロールバックできます。
    - 変更履歴はバージョンごとに添付され、更新の同期や公開時には空にできます。

  </Accordion>
  <Accordion title="ローカル変更とレジストリバージョン">
    更新では、コンテンツハッシュを使ってローカルの skill 内容をレジストリバージョンと比較します。ローカルファイルが公開済みバージョンのいずれとも一致しない場合、CLI は上書き前に確認します（または非対話実行では `--force` が必要です）。
  </Accordion>
  <Accordion title="同期スキャンとフォールバックルート">
    `clawhub sync` はまず現在の workdir をスキャンします。skills が見つからない場合は、既知のレガシー場所（たとえば `~/openclaw/skills` や `~/.openclaw/skills`）にフォールバックします。これは、追加フラグなしで古い skill インストールを見つけるためのものです。
  </Accordion>
  <Accordion title="ストレージと lockfile">
    - インストール済み skills は、workdir 配下の `.clawhub/lock.json` に記録されます。
    - 認証トークンは ClawHub CLI 設定ファイルに保存されます（`CLAWHUB_CONFIG_PATH` で上書きできます）。

  </Accordion>
  <Accordion title="テレメトリ（インストール数）">
    ログイン中に `clawhub sync` を実行すると、CLI はインストール数を計算するための最小限のスナップショットを送信します。これは完全に無効化できます。

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 環境変数

| 変数                          | 効果                                            |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | サイト URL を上書きします。                     |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。             |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの workdir を上書きします。           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効にします。             |

## 関連

- [コミュニティ Plugin](/ja-JP/plugins/community)
- [Plugins](/ja-JP/tools/plugin)
- [Skills](/ja-JP/tools/skills)
