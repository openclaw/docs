---
read_when:
    - Skillsの公開
    - 公開失敗のデバッグ
summary: Skill フォルダー形式、必須ファイル、許可されるファイル種別、制限。
x-i18n:
    generated_at: "2026-07-06T21:47:17Z"
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

- `SKILL.md`（または `skill.md`; レガシーの `skills.md` も受け入れられます）

任意:

- 任意の補助用_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の無視パターン、レガシーの `.clawdhubignore`）
- `.gitignore`（これも尊重されます）

## GitHub インポート

Web GitHub インポーターは、ローカルの公開/同期よりも厳格です。サインイン中の GitHub アカウントが所有する公開かつフォークでないリポジトリ内の
`SKILL.md` またはレガシーの `skills.md` ファイルのみを検出します。非公開リポジトリ、フォーク、
アーカイブ済み/無効化済みリポジトリ、または第三者の公開リポジトリはインポートしません。

ローカルインストールメタデータ（CLI によって書き込まれます）:

- `<skill>/.clawhub/origin.json`（レガシーの `.clawdhub`）

作業ディレクトリのインストール状態（CLI によって書き込まれます）:

- `<workdir>/.clawhub/lock.json`（レガシーの `.clawdhub`）

## `SKILL.md`

- 任意の YAML frontmatter を含む Markdown。
- サーバーは公開時に frontmatter からメタデータを抽出します。
- `description` は UI/検索でスキルの概要として使用されます。

## Frontmatter メタデータ

スキルメタデータは、`SKILL.md` の先頭にある YAML frontmatter で宣言します。これにより、レジストリ（およびセキュリティ分析）に、スキルの実行に必要なものを伝えます。

### 基本 frontmatter

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

スキルを実行する前に存在している必要がある環境変数には `requires.env` を使用します。任意変数を含め、変数ごとのメタデータが必要な場合は `envVars` を使用し、任意変数には `required: false` を指定します。

### 全フィールドリファレンス

| フィールド         | 型         | 説明                                                                                                                                           |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | スキルが期待する必須環境変数。                                                                                                                 |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                          |
| `requires.anyBins` | `string[]` | 少なくとも 1 つ存在している必要がある CLI バイナリ。                                                                                            |
| `requires.config`  | `string[]` | スキルが読み取る設定ファイルパス。                                                                                                             |
| `primaryEnv`       | `string`   | スキルの主要な認証情報環境変数。                                                                                                               |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を含む環境変数宣言。任意の環境変数には `required: false` を設定します。                         |
| `always`           | `boolean`  | `true` の場合、スキルは常にアクティブです（明示的なインストールは不要）。                                                                       |
| `skillKey`         | `string`   | スキルの呼び出しキーを上書きします。                                                                                                           |
| `emoji`            | `string`   | スキルに表示する絵文字。                                                                                                                       |
| `homepage`         | `string`   | スキルのホームページまたはドキュメントへの URL。                                                                                               |
| `os`               | `string[]` | OS 制限（例: `["macos"]`, `["linux"]`）。                                                                                                      |
| `install`          | `array`    | 依存関係のインストール仕様（下記参照）。                                                                                                       |
| `nix`              | `object`   | Nix Plugin 仕様（README 参照）。                                                                                                               |
| `config`           | `object`   | Clawdbot 設定仕様（README 参照）。                                                                                                             |

### インストール仕様

スキルにインストールが必要な依存関係がある場合は、`install` 配列で宣言します。

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

任意の環境変数は `metadata.openclaw.envVars` の下で宣言し、`required: false` を設定します。任意のエントリを `requires.env` に追加しないでください。`requires.env` は、それらがないとスキルを実行できないことを意味するためです。

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

ClawHub のセキュリティ分析は、スキルが宣言している内容と実際の動作が一致しているかをチェックします。コードが `TODOIST_API_KEY` を参照しているのに、frontmatter で `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータ不一致としてフラグを立てます。宣言を正確に保つことで、スキルがレビューに通りやすくなり、ユーザーが何をインストールしているのか理解しやすくなります。

### 例: 完全な frontmatter

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

公開で受け入れられるのは「テキストベース」のファイルのみです。

- 拡張子の許可リストは `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け入れられます。
- `text/` で始まるコンテンツタイプはテキストとして扱われます。さらに小さな許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）もあります。

制限（サーバー側）:

- バンドルの合計サイズ: 50MB。
- 埋め込みテキストには `SKILL.md` と最大約 40 個の非 `.md` ファイルが含まれます（可能な範囲での上限）。

## スラッグ

- デフォルトではフォルダー名から派生します。
- パッケージスコープは ClawHub の公開者ハンドルと完全に一致している必要があります。公開者ハンドルには小文字、数字、ハイフン、ドット、アンダースコアを使用できます。また、小文字または数字で始まり、小文字または数字で終わる必要があります。
- パッケージスラッグは小文字で、npm で安全に使える必要があります。例: `@example.tools/demo-plugin` または `demo-plugin`。

## バージョン管理 + タグ

- 公開するたびに新しいバージョン（セマンティックバージョニング）が作成されます。
- タグはバージョンへの文字列ポインターです。`latest` が一般的に使用されます。

## ライセンス

- ClawHub で公開されるすべてのスキルは `MIT-0` の下でライセンスされます。
- 誰でも公開済みスキルを使用、変更、再配布できます。商用利用も含まれます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条件を追加しないでください。ClawHub はスキルごとのライセンス上書きをサポートしていません。

## 有料スキル

- ClawHub は、有料スキル、スキルごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。それはスキル形式の一部ではなく、公開済みスキルを有料にはしません。
- スキルが有料の第三者サービスと連携する場合は、外部費用と必要なアカウントを、スキル手順および環境変数宣言（必須変数には `requires.env`、任意変数には `required: false` を設定した `envVars`）に明確に記載してください。
