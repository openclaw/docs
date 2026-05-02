---
read_when:
    - Skills または Plugin の検索、インストール、更新
    - SkillsまたはPluginをレジストリに公開する
    - clawhub CLI またはその環境変数による上書きの設定
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw の Skills と Plugin の公開レジストリ、ネイティブなインストールフロー、および clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T05:07:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub は **OpenClaw の Skills と plugins** の公開レジストリです。

- ネイティブの `openclaw` コマンドを使って Skills を検索、インストール、更新し、ClawHub から plugins をインストールします。
- レジストリ認証、公開、削除/削除解除、同期ワークフローには、別個の `clawhub` CLI を使用します。

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
    新しい OpenClaw セッションを開始します — 新しい Skill が読み込まれます。
  </Step>
  <Step title="公開 (任意)">
    レジストリ認証が必要なワークフロー (公開、同期、管理) では、
    別個の `clawhub` CLI をインストールします:

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

    ネイティブの `openclaw` コマンドは、アクティブなワークスペースにインストールし、
    ソースメタデータを保持するため、後続の `update` 呼び出しは ClawHub 上にとどまれます。

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` は ClawHub の plugin カタログに問い合わせ、インストール可能な
    パッケージ名を出力します。素の npm セーフな plugin 仕様も、npm より前に
    ClawHub に対して試行されます:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    ClawHub ルックアップなしで npm のみの解決を行いたい場合は、
    `npm:<package>` を使用します:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin のインストールでは、アーカイブインストールの実行前に、提示された `pluginApi` と
    `minGatewayVersion` の互換性を検証します。そのため、互換性のないホストは、
    パッケージを部分的にインストールするのではなく早期にフェイルクローズします。
    パッケージバージョンが ClawPack アーティファクトを公開している場合、
    OpenClaw はそのアーティファクトを優先し、ClawHub ダイジェストヘッダーと
    ダウンロード済みバイトを検証し、後続の更新用に ClawPack ダイジェストメタデータを
    記録します。ClawPack メタデータのない古いパッケージバージョンでは、引き続き
    従来のパッケージアーカイブ検証パスが使用されます。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` は、インストール可能な plugin
ファミリーのみを受け付けます。ClawHub パッケージが実際には Skill である場合、
OpenClaw は停止し、代わりに `openclaw skills install <slug>` を案内します。

匿名の ClawHub plugin インストールも、プライベートパッケージではフェイルクローズします。
コミュニティやその他の非公式チャンネルは引き続きインストールできますが、OpenClaw は
オペレーターが有効化前にソースと検証を確認できるよう警告します。
</Note>

## ClawHub とは

- OpenClaw Skills と plugins の公開レジストリ。
- Skill バンドルとメタデータのバージョン管理されたストア。
- 検索、タグ、利用シグナルのための発見サーフェス。

一般的な Skill は、以下を含むファイルのバージョン管理されたバンドルです:

- 主要な説明と使用方法を含む `SKILL.md` ファイル。
- Skill が使用する任意の設定、スクリプト、またはサポートファイル。
- タグ、概要、インストール要件などのメタデータ。

ClawHub はメタデータを使用して発見を支援し、Skill
機能を安全に公開します。レジストリは利用シグナル (スター、ダウンロード) を追跡し、
ランキングと可視性を向上させます。公開するたびに新しい semver
バージョンが作成され、レジストリはバージョン履歴を保持するため、ユーザーは
変更を監査できます。

## ワークスペースと Skill 読み込み

別個の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` に
Skills をインストールします。OpenClaw ワークスペースが設定されている場合、
`clawhub` は `--workdir` (または `CLAWHUB_WORKDIR`) で上書きしない限り、
そのワークスペースにフォールバックします。OpenClaw は
`<workspace>/skills` からワークスペース Skills を読み込み、**次の**
セッションでそれらを取り込みます。

すでに `~/.openclaw/skills` やバンドル済み Skills を使用している場合、
ワークスペース Skills が優先されます。Skills の読み込み、共有、ゲート方法の詳細は、
[Skills](/ja-JP/tools/skills) を参照してください。

## サービス機能

| 機能                  | 注記                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| 公開ブラウズ          | Skills とその `SKILL.md` 内容は公開表示できます。          |
| 検索                   | キーワードだけでなく、埋め込みベース (ベクトル検索) です。               |
| バージョン管理               | Semver、変更履歴、タグ (`latest` を含む)。                  |
| ダウンロード                | バージョンごとの Zip。                                                    |
| スターとコメント       | コミュニティからのフィードバック。                                                 |
| セキュリティスキャン概要  | 詳細ページには、インストールまたはダウンロード前に最新のスキャン状態が表示されます。 |
| スキャナー詳細ページ     | VirusTotal、ClawScan、静的解析の結果にはディープリンクがあります。  |
| オーナー復旧ダッシュボード | 公開者は `/dashboard` から、スキャンで保留された所有コンテンツを確認できます。       |
| オーナー要求による再スキャン  | オーナーは誤検知からの復旧のため、制限付き再スキャンを要求できます。     |
| モデレーション               | 承認と監査。                                               |
| CLI 向け API         | 自動化とスクリプト作成に適しています。                              |

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです — 誰でも Skills をアップロードできますが、公開するには
GitHub アカウントが**少なくとも 1 週間以上経過している**必要があります。これにより、
正当なコントリビューターを妨げずに不正利用を遅らせます。

<AccordionGroup>
  <Accordion title="セキュリティスキャン">
    ClawHub は、公開された Skills と plugin リリースに対して自動セキュリティチェックを実行します。
    公開詳細ページでは現在の結果が要約され、スキャナー行は VirusTotal、ClawScan、
    静的解析の専用詳細ページにリンクします。

    スキャン保留またはブロックされたリリースは、公開カタログやインストールサーフェスでは
    利用できない場合がありますが、オーナーには `/dashboard` で引き続き表示されます。

  </Accordion>
  <Accordion title="報告">
    - サインイン済みのユーザーは誰でも Skill を報告できます。
    - 報告理由は必須で、記録されます。
    - 各ユーザーは同時に最大 20 件のアクティブな報告を持てます。
    - 3 件を超えるユニークな報告がある Skills は、デフォルトで自動的に非表示になります。

  </Accordion>
  <Accordion title="モデレーション">
    - モデレーターは非表示の Skills を表示したり、再表示したり、削除したり、ユーザーを禁止したりできます。
    - 報告機能の悪用は、アカウント禁止につながる場合があります。
    - モデレーターになることに興味がありますか? OpenClaw Discord で質問し、モデレーターまたはメンテナーに連絡してください。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

これは、公開/同期などのレジストリ認証が必要なワークフローでのみ必要です。

### グローバルオプション

<ParamField path="--workdir <dir>" type="string">
  作業ディレクトリ。デフォルト: 現在のディレクトリ。OpenClaw ワークスペースにフォールバックします。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills ディレクトリ。workdir からの相対パスです。
</ParamField>
<ParamField path="--site <url>" type="string">
  サイトのベース URL (ブラウザログイン)。
</ParamField>
<ParamField path="--registry <url>" type="string">
  レジストリ API のベース URL。
</ParamField>
<ParamField path="--no-input" type="boolean">
  プロンプトを無効化します (非対話)。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI バージョンを出力します。
</ParamField>

### コマンド

<AccordionGroup>
  <Accordion title="認証 (ログイン / ログアウト / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    ログインオプション:

    - `--token <token>` — API トークンを貼り付けます。
    - `--label <label>` — ブラウザログイントークン用に保存されるラベル (デフォルト: `CLI token`)。
    - `--no-browser` — ブラウザを開きません (`--token` が必要)。

  </Accordion>
  <Accordion title="検索">
    ```bash
    clawhub search "query"
    ```

    Skills を検索します。plugin/パッケージの発見には、`clawhub package explore` を使用します。

    - `--limit <n>` — 最大結果数。

  </Accordion>
  <Accordion title="plugins のブラウズ / 調査">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` と `package inspect` は、plugin/パッケージの発見とメタデータ調査のための ClawHub CLI サーフェスです。ネイティブの OpenClaw インストールでは、引き続き `openclaw plugins install clawhub:<package>` を使用します。

    オプション:

    - `--family skill|code-plugin|bundle-plugin` — パッケージファミリーで絞り込みます。
    - `--official` — 公式パッケージのみを表示します。
    - `--executes-code` — コードを実行するパッケージのみを表示します。
    - `--version <version>` / `--tag <tag>` — 特定のパッケージバージョンを調査します。
    - `--versions`, `--files`, `--file <path>` — パッケージ履歴とファイルを調査します。
    - `--json` — 機械可読な出力。

  </Accordion>
  <Accordion title="インストール / 更新 / 一覧">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    オプション:

    - `--version <version>` — 特定のバージョンをインストールまたは更新します (`update` では単一 slug のみ)。
    - `--force` — フォルダーがすでに存在する場合、またはローカルファイルが公開済みバージョンのいずれとも一致しない場合に上書きします。
    - `clawhub list` は `.clawhub/lock.json` を読み取ります。

  </Accordion>
  <Accordion title="Skills の公開">
    ```bash
    clawhub skill publish <path>
    ```

    オプション:

    - `--slug <slug>` — Skill slug。
    - `--name <name>` — 表示名。
    - `--version <version>` — semver バージョン。
    - `--changelog <text>` — 変更履歴テキスト (空にできます)。
    - `--tags <tags>` — カンマ区切りのタグ (デフォルト: `latest`)。

  </Accordion>
  <Accordion title="plugins の公開">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` は、ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または
    GitHub URL にできます。

    オプション:

    - `--dry-run` — 何もアップロードせずに、正確な公開計画を作成します。
    - `--json` — CI 用に機械可読な出力を出します。
    - `--source-repo`, `--source-commit`, `--source-ref` — 自動検出だけでは不十分な場合の任意の上書き。

  </Accordion>
  <Accordion title="再スキャンの要求">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    再スキャンコマンドにはログイン済みのオーナートークンが必要で、最新の
    公開済み Skill バージョンまたは plugin リリースを対象にします。非対話実行では、
    `--yes` を渡します。

    JSON レスポンスには、対象の種類、名前、バージョン、再スキャン状態、そのバージョンまたはリリースでの
    残り/最大リクエスト数が含まれます。

  </Accordion>
  <Accordion title="削除 / 削除解除 (オーナーまたは管理者)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同期 (ローカルをスキャン + 新規または更新を公開)">
    ```bash
    clawhub sync
    ```

    オプション:

    - `--root <dir...>` — 追加のスキャンルート。
    - `--all` — プロンプトなしですべてをアップロードします。
    - `--dry-run` — アップロードされる内容を表示します。
    - `--bump <type>` — 更新時の `patch|minor|major` (デフォルト: `patch`)。
    - `--changelog <text>` — 非対話更新用の変更履歴。
    - `--tags <tags>` — カンマ区切りのタグ (デフォルト: `latest`)。
    - `--concurrency <n>` — レジストリチェック (デフォルト: `4`)。

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

公開済みパッケージは **ビルド済み JavaScript** を同梱し、
`runtimeExtensions` がその出力を指すようにする必要があります。Git checkout インストールでは、ビルド済みファイルが存在しない場合でも TypeScript ソースへフォールバックできますが、ビルド済みランタイムエントリを使うと、起動、doctor、Plugin 読み込みパスでのランタイム TypeScript コンパイルを避けられます。

## バージョニング、ロックファイル、テレメトリ

<AccordionGroup>
  <Accordion title="バージョニングとタグ">
    - 各公開では、新しい **semver** `SkillVersion` が作成されます。
    - `latest` などのタグはバージョンを指します。タグを移動するとロールバックできます。
    - 変更履歴はバージョンごとに添付され、同期や更新の公開時には空にできます。

  </Accordion>
  <Accordion title="ローカル変更とレジストリバージョン">
    更新では、コンテンツハッシュを使ってローカルの skill 内容をレジストリバージョンと比較します。ローカルファイルが公開済みバージョンのいずれにも一致しない場合、CLI は上書き前に確認します（または非対話実行では `--force` が必要です）。
  </Accordion>
  <Accordion title="同期スキャンとフォールバックルート">
    `clawhub sync` はまず現在の作業ディレクトリをスキャンします。skills が見つからない場合は、既知のレガシー場所（たとえば `~/openclaw/skills` や `~/.openclaw/skills`）にフォールバックします。これは、追加のフラグなしで古い skill インストールを見つけるように設計されています。
  </Accordion>
  <Accordion title="ストレージとロックファイル">
    - インストール済み skills は、作業ディレクトリ配下の `.clawhub/lock.json` に記録されます。
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
| `CLAWHUB_SITE`                | サイト URL を上書きします。                    |
| `CLAWHUB_REGISTRY`            | レジストリ API URL を上書きします。            |
| `CLAWHUB_CONFIG_PATH`         | CLI がトークン/設定を保存する場所を上書きします。 |
| `CLAWHUB_WORKDIR`             | デフォルトの作業ディレクトリを上書きします。  |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効化します。            |

## 関連

- [コミュニティ Plugin](/ja-JP/plugins/community)
- [Plugins](/ja-JP/tools/plugin)
- [Skills](/ja-JP/tools/skills)
