---
read_when:
    - Skills または Plugin の検索、インストール、更新
    - Skills または plugins をレジストリに公開する
    - clawhub CLI またはその環境オーバーライドの設定
sidebarTitle: ClawHub
summary: 'ClawHub: OpenClaw Skills と Plugin、ネイティブなインストールフロー、clawhub CLI の公開レジストリ'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T05:20:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub は **OpenClaw の Skills と plugins** の公開レジストリです。

- ネイティブの `openclaw` コマンドを使って Skills の検索、インストール、更新を行い、ClawHub から plugins をインストールします。
- レジストリ認証、公開、削除/削除解除、同期ワークフローには、別個の `clawhub` CLI を使います。

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
  <Step title="公開 (任意)">
    レジストリ認証済みワークフロー (公開、同期、管理) には、別個の `clawhub` CLI をインストールします。

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

    ネイティブの `openclaw` コマンドはアクティブなワークスペースにインストールし、ソースメタデータを保持するため、後続の `update` 呼び出しで ClawHub を使い続けられます。

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` は ClawHub plugin カタログを照会し、すぐにインストールできるパッケージ名を出力します。ClawHub の解決を使いたい場合は `clawhub:<package>` を使います。ローンチ移行期間中、npm で安全な plugin 指定をそのまま使うと npm からインストールされます。

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` も npm 専用で、指定が曖昧になり得る場合に便利です。

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin のインストールでは、アーカイブインストールの実行前に、公開されている `pluginApi` と `minGatewayVersion` の互換性を検証します。そのため、互換性のないホストはパッケージを部分的にインストールするのではなく、早期に fail closed します。パッケージバージョンが ClawPack アーティファクトを公開している場合、OpenClaw はアップロードされた正確な npm-pack `.tgz` を優先し、ClawHub ダイジェストヘッダーとダウンロード済みバイトを検証し、アーティファクト種別、npm integrity、npm shasum、tarball 名、ClawPack ダイジェストメタデータを後続の更新用に記録します。ClawPack メタデータがない古いパッケージバージョンは、引き続き従来のパッケージアーカイブ検証パスを使います。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` はインストール可能な plugin ファミリーのみを受け付けます。ClawHub パッケージが実際には skill である場合、OpenClaw は停止し、代わりに `openclaw skills install <slug>` を案内します。

匿名の ClawHub plugin インストールも、プライベートパッケージでは fail closed します。コミュニティまたはその他の非公式チャネルは引き続きインストールできますが、OpenClaw は、オペレーターが有効化前にソースと検証を確認できるよう警告します。
</Note>

## ClawHub とは

- OpenClaw の Skills と plugins の公開レジストリ。
- skill バンドルとメタデータのバージョン管理されたストア。
- 検索、タグ、利用シグナルのための発見サーフェス。

一般的な skill は、次を含むファイルのバージョン管理されたバンドルです。

- 主な説明と使用方法を含む `SKILL.md` ファイル。
- skill が使用する任意の設定、スクリプト、またはサポートファイル。
- タグ、概要、インストール要件などのメタデータ。

ClawHub はメタデータを使って発見機能を支え、skill の機能を安全に公開します。レジストリは利用シグナル (スター、ダウンロード) を追跡して、ランキングと可視性を向上させます。公開のたびに新しい semver バージョンが作成され、レジストリはバージョン履歴を保持するため、ユーザーは変更を監査できます。

## ワークスペースと skill の読み込み

別個の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` に Skills をインストールします。OpenClaw ワークスペースが設定されている場合、`clawhub` は `--workdir` (または `CLAWHUB_WORKDIR`) で上書きしない限り、そのワークスペースへフォールバックします。OpenClaw は `<workspace>/skills` からワークスペース Skills を読み込み、**次回**のセッションでそれらを反映します。

すでに `~/.openclaw/skills` またはバンドルされた Skills を使用している場合、ワークスペース Skills が優先されます。Skills の読み込み、共有、ゲート制御の詳細については、[Skills](/ja-JP/tools/skills) を参照してください。

## サービス機能

| 機能                     | 注記                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| 公開ブラウズ             | Skills とその `SKILL.md` 内容は公開で閲覧できます。                 |
| 検索                     | キーワードだけでなく、埋め込みベース (ベクトル検索) です。          |
| バージョニング           | Semver、変更履歴、タグ (`latest` を含む)。                          |
| ダウンロード             | バージョンごとの zip。                                              |
| スターとコメント         | コミュニティのフィードバック。                                      |
| セキュリティスキャン概要 | 詳細ページに、インストールまたはダウンロード前の最新スキャン状態が表示されます。 |
| スキャナー詳細ページ     | VirusTotal、ClawScan、静的解析結果にはディープリンクがあります。    |
| 所有者復旧ダッシュボード | 公開者は `/dashboard` からスキャンで保留された所有コンテンツを確認できます。 |
| 所有者リクエストの再スキャン | 所有者は誤検知からの復旧のため、制限付きの再スキャンをリクエストできます。 |
| モデレーション           | 承認と監査。                                                        |
| CLI 向け API             | 自動化とスクリプトに適しています。                                  |

## セキュリティとモデレーション

ClawHub はデフォルトでオープンです。誰でも Skills をアップロードできますが、公開するには GitHub アカウントが**少なくとも 1 週間前に作成されている**必要があります。これにより、正当なコントリビューターを妨げることなく悪用を遅らせます。

<AccordionGroup>
  <Accordion title="セキュリティスキャン">
    ClawHub は公開された Skills と plugin リリースに対して自動セキュリティチェックを実行します。公開詳細ページには現在の結果が要約され、スキャナー行は VirusTotal、ClawScan、静的解析の専用詳細ページにリンクします。

    スキャンで保留またはブロックされたリリースは、所有者には `/dashboard` で引き続き表示される一方で、公開カタログやインストールサーフェスでは利用できない場合があります。

  </Accordion>
  <Accordion title="報告">
    - サインイン済みのユーザーは誰でも skill を報告できます。
    - 報告理由は必須で、記録されます。
    - 各ユーザーは同時に最大 20 件のアクティブな報告を保持できます。
    - 3 件を超える一意の報告がある Skills は、デフォルトで自動的に非表示になります。

  </Accordion>
  <Accordion title="モデレーション">
    - モデレーターは非表示の Skills を表示し、再表示、削除、またはユーザーの禁止を行えます。
    - 報告機能を悪用すると、アカウント禁止につながる可能性があります。
    - モデレーターになることに関心がありますか? OpenClaw Discord で質問し、モデレーターまたはメンテナーに連絡してください。

  </Accordion>
</AccordionGroup>

## ClawHub CLI

これは、公開/同期などのレジストリ認証済みワークフローにのみ必要です。

### グローバルオプション

<ParamField path="--workdir <dir>" type="string">
  作業ディレクトリ。デフォルト: 現在のディレクトリ。OpenClaw ワークスペースへフォールバックします。
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

    - `--token <token>` - API トークンを貼り付けます。
    - `--label <label>` - ブラウザログイン用トークンに保存されるラベル (デフォルト: `CLI token`)。
    - `--no-browser` - ブラウザを開きません (`--token` が必要)。

  </Accordion>
  <Accordion title="検索">
    ```bash
    clawhub search "query"
    ```

    Skills を検索します。plugin/package の発見には `clawhub package explore` を使います。

    - `--limit <n>` - 最大結果数。

  </Accordion>
  <Accordion title="Plugins のブラウズ / 検査">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` と `package inspect` は、plugin/package の発見とメタデータ検査のための ClawHub CLI サーフェスです。ネイティブの OpenClaw インストールでは、引き続き `openclaw plugins install clawhub:<package>` を使います。

    オプション:

    - `--family skill|code-plugin|bundle-plugin` - パッケージファミリーでフィルターします。
    - `--official` - 公式パッケージのみを表示します。
    - `--executes-code` - コードを実行するパッケージのみを表示します。
    - `--version <version>` / `--tag <tag>` - 特定のパッケージバージョンを検査します。
    - `--versions`, `--files`, `--file <path>` - パッケージ履歴とファイルを検査します。
    - `--json` - 機械可読な出力。

  </Accordion>
  <Accordion title="インストール / 更新 / 一覧">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    オプション:

    - `--version <version>` - 特定のバージョンをインストールまたは更新します (`update` では単一 slug のみ)。
    - `--force` - フォルダーがすでに存在する場合、またはローカルファイルが公開済みバージョンのどれとも一致しない場合に上書きします。
    - `clawhub list` は `.clawhub/lock.json` を読み取ります。

  </Accordion>
  <Accordion title="Skills の公開">
    ```bash
    clawhub skill publish <path>
    ```

    オプション:

    - `--slug <slug>` - skill slug。
    - `--name <name>` - 表示名。
    - `--version <version>` - semver バージョン。
    - `--changelog <text>` - 変更履歴テキスト (空でも可)。
    - `--tags <tags>` - カンマ区切りのタグ (デフォルト: `latest`)。

  </Accordion>
  <Accordion title="Plugins の公開">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` には、ローカルフォルダー、`owner/repo`、`owner/repo@ref`、または GitHub URL を指定できます。

    オプション:

    - `--dry-run` - 何もアップロードせず、正確な公開計画を作成します。
    - `--json` - CI 向けに機械可読な出力を出力します。
    - `--source-repo`, `--source-commit`, `--source-ref` - 自動検出だけでは不十分な場合の任意の上書き。

  </Accordion>
  <Accordion title="再スキャンのリクエスト">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    再スキャンコマンドには、ログイン済みの所有者トークンが必要で、最新の公開済み skill バージョンまたは plugin リリースを対象にします。非対話実行では `--yes` を渡します。

    JSON レスポンスには、対象の種別、名前、バージョン、再スキャン状態、およびそのバージョンまたはリリースの残り/最大リクエスト数が含まれます。

  </Accordion>
  <Accordion title="削除 / 削除解除 (所有者または管理者)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同期 (ローカルをスキャン + 新規または更新分を公開)">
    ```bash
    clawhub sync
    ```

    オプション:

    - `--root <dir...>` - 追加のスキャンルート。
    - `--all` - プロンプトなしですべてをアップロードします。
    - `--dry-run` - アップロードされる内容を表示します。
    - `--bump <type>` - 更新用の `patch|minor|major` (デフォルト: `patch`)。
    - `--changelog <text>` - 非対話更新用の変更履歴。
    - `--tags <tags>` - カンマ区切りのタグ (デフォルト: `latest`)。
    - `--concurrency <n>` - レジストリチェック (デフォルト: `4`)。

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
  <Tab title="多数の Skills を同期">
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

コード Plugin は、必須の OpenClaw メタデータを
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
`runtimeExtensions` がその出力を指すようにしてください。Git checkout インストールでは、ビルド済みファイルが存在しない場合でも TypeScript ソースにフォールバックできますが、ビルド済みランタイムエントリにすると、起動、doctor、Plugin 読み込みパスでのランタイム TypeScript コンパイルを避けられます。

## バージョニング、lockfile、テレメトリ

<AccordionGroup>
  <Accordion title="バージョニングとタグ">
    - 各公開は新しい **semver** `SkillVersion` を作成します。
    - タグ（`latest` など）はバージョンを指します。タグを移動するとロールバックできます。
    - 変更履歴はバージョンごとに添付され、更新の同期や公開時には空でもかまいません。

  </Accordion>
  <Accordion title="ローカル変更とレジストリバージョン">
    更新では、コンテンツハッシュを使用してローカルの skill 内容をレジストリバージョンと比較します。ローカルファイルが公開済みバージョンのいずれにも一致しない場合、CLI は上書き前に確認します（または非対話実行では `--force` が必要です）。
  </Accordion>
  <Accordion title="同期スキャンとフォールバックルート">
    `clawhub sync` は最初に現在の作業ディレクトリをスキャンします。Skills が見つからない場合は、既知のレガシー場所（たとえば `~/openclaw/skills` や `~/.openclaw/skills`）にフォールバックします。これは、追加のフラグなしで古い skill インストールを見つけるように設計されています。
  </Accordion>
  <Accordion title="ストレージと lockfile">
    - インストール済み Skills は、作業ディレクトリ配下の `.clawhub/lock.json` に記録されます。
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
| `CLAWHUB_WORKDIR`             | 既定の作業ディレクトリを上書きします。          |
| `CLAWHUB_DISABLE_TELEMETRY=1` | `sync` のテレメトリを無効化します。             |

## 関連

- [コミュニティ Plugin](/ja-JP/plugins/community)
- [Plugins](/ja-JP/tools/plugin)
- [Skills](/ja-JP/tools/skills)
