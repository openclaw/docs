---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: Skillフォルダーの形式、必須ファイル、許可されるファイルタイプ、制限。
x-i18n:
    generated_at: "2026-06-28T07:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# スキル形式

## ディスク上

スキルはフォルダーです。

必須:

- `SKILL.md`（または `skill.md`。レガシーの `skills.md` も受け付けます）

任意:

- 任意の補助的な_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の無視パターン、レガシーの `.clawdhubignore`）
- `.gitignore`（これも尊重されます）

## GitHubインポート

Web版のGitHubインポーターは、ローカルの公開/同期よりも厳格です。サインイン中のGitHubアカウントが所有する、公開かつフォークでないリポジトリ内の
`SKILL.md` またはレガシーの `skills.md` ファイルのみを検出します。プライベートリポジトリ、フォーク、
アーカイブ済み/無効化済みリポジトリ、またはサードパーティの公開リポジトリはインポートしません。

ローカルインストールメタデータ（CLIが書き込み）:

- `<skill>/.clawhub/origin.json`（レガシー `.clawdhub`）

作業ディレクトリのインストール状態（CLIが書き込み）:

- `<workdir>/.clawhub/lock.json`（レガシー `.clawdhub`）

## `SKILL.md`

- 任意のYAMLフロントマターを含むMarkdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description` はUI/検索でスキルの概要として使用されます。

## フロントマターメタデータ

スキルメタデータは `SKILL.md` の先頭にあるYAMLフロントマターで宣言します。これにより、レジストリ（およびセキュリティ分析）に、そのスキルの実行に必要なものを伝えます。

### 基本フロントマター

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

スキルのランタイム要件を `metadata.openclaw` の下で宣言します（エイリアス: `metadata.clawdbot`, `metadata.clawdis`）。

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

スキルの実行前に存在している必要がある環境変数には `requires.env` を使用します。任意変数を `required: false` で指定する場合など、変数ごとのメタデータが必要なときは `envVars` を使用します。

### 全フィールドリファレンス

| フィールド         | 型         | 説明                                                                                                                                             |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | スキルが必要とする必須の環境変数。                                                                                                               |
| `requires.bins`    | `string[]` | すべてインストールされている必要があるCLIバイナリ。                                                                                              |
| `requires.anyBins` | `string[]` | 少なくとも1つが存在している必要があるCLIバイナリ。                                                                                               |
| `requires.config`  | `string[]` | スキルが読み取る設定ファイルパス。                                                                                                               |
| `primaryEnv`       | `string`   | スキルのメイン認証情報環境変数。                                                                                                                 |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を含む環境変数宣言。任意の環境変数には `required: false` を設定します。                         |
| `always`           | `boolean`  | `true` の場合、スキルは常にアクティブです（明示的なインストールは不要）。                                                                        |
| `skillKey`         | `string`   | スキルの呼び出しキーを上書きします。                                                                                                             |
| `emoji`            | `string`   | スキルの表示絵文字。                                                                                                                             |
| `homepage`         | `string`   | スキルのホームページまたはドキュメントのURL。                                                                                                    |
| `os`               | `string[]` | OS制限（例: `["macos"]`, `["linux"]`）。                                                                                                         |
| `install`          | `array`    | 依存関係のインストール仕様（下記参照）。                                                                                                         |
| `nix`              | `object`   | Nixプラグイン仕様（READMEを参照）。                                                                                                              |
| `config`           | `object`   | Clawdbot設定仕様（READMEを参照）。                                                                                                               |

### インストール仕様

スキルで依存関係のインストールが必要な場合は、`install` 配列で宣言します。

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

サポートされるインストール種別: `brew`, `node`, `go`, `uv`。

### 任意の環境変数

任意の環境変数は `metadata.openclaw.envVars` の下で宣言し、`required: false` を設定します。任意の項目を `requires.env` に追加しないでください。`requires.env` は、それらがないとスキルを実行できないことを意味するためです。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### これが重要な理由

ClawHubのセキュリティ分析は、スキルが宣言している内容と実際の動作が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているのに、フロントマターで `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータの不一致としてフラグを立てます。宣言を正確に保つことで、スキルがレビューに通りやすくなり、ユーザーも何をインストールするのか理解しやすくなります。

### 例: 完全なフロントマター

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 許可されるファイル

公開で受け付けられるのは「テキストベース」ファイルのみです。

- 拡張子の許可リストは `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShellの `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け付けられます。
- `text/` で始まるコンテンツタイプはテキストとして扱われます。加えて、小さな許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）があります。

制限（サーバー側）:

- バンドル合計サイズ: 50MB。
- 埋め込みテキストには `SKILL.md` + 最大約40個の非 `.md` ファイルが含まれます（ベストエフォートの上限）。

## スラッグ

- デフォルトではフォルダー名から派生します。
- パッケージスコープはClawHubの公開者ハンドルと完全に一致している必要があります。公開者ハンドルには小文字、数字、ハイフン、ドット、アンダースコアを使用でき、小文字または数字で始まり、終わる必要があります。
- パッケージスラッグは小文字でnpmセーフである必要があります。例: `@example.tools/demo-plugin` または `demo-plugin`。

## バージョン管理 + タグ

- 公開するたびに新しいバージョン（semver）が作成されます。
- タグはバージョンへの文字列ポインターです。一般的には `latest` が使用されます。

## ライセンス

- ClawHubで公開されるすべてのスキルは `MIT-0` の下でライセンスされます。
- 公開されたスキルは、商用利用を含め、誰でも使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条項を追加しないでください。ClawHubはスキル単位のライセンス上書きをサポートしていません。

## 有料スキル

- ClawHubは有料スキル、スキル単位の価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。それはスキル形式の一部ではなく、公開済みスキルを有料にすることもありません。
- スキルが有料のサードパーティサービスと連携する場合は、外部コストと必要なアカウントをスキル手順および環境変数宣言（必須変数には `requires.env`、任意変数には `required: false` を指定した `envVars`）で明確に文書化してください。
