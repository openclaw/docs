---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: スキルフォルダーの形式、必須ファイル、許可されるファイルタイプ、制限。
x-i18n:
    generated_at: "2026-06-28T00:12:01Z"
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

- `SKILL.md`（または `skill.md`; レガシーの `skills.md` も受け付けます）

任意:

- 任意の補助的な _テキストベース_ ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開用の無視パターン、レガシーは `.clawdhubignore`）
- `.gitignore`（これも尊重されます）

## GitHub インポート

Web の GitHub インポーターは、ローカルの公開/同期よりも厳密です。サインイン中の GitHub アカウントが所有する、公開かつフォークではないリポジトリ内の
`SKILL.md` またはレガシーの `skills.md` ファイルだけを検出します。プライベートリポジトリ、フォーク、
アーカイブ済み/無効化済みリポジトリ、または第三者の公開リポジトリはインポートしません。

ローカルインストールメタデータ（CLI が書き込み）:

- `<skill>/.clawhub/origin.json`（レガシーは `.clawdhub`）

作業ディレクトリのインストール状態（CLI が書き込み）:

- `<workdir>/.clawhub/lock.json`（レガシーは `.clawdhub`）

## `SKILL.md`

- 任意の YAML フロントマター付き Markdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description` は UI/検索でスキル概要として使われます。

## フロントマターメタデータ

スキルのメタデータは、`SKILL.md` の先頭にある YAML フロントマターで宣言します。これにより、レジストリ（およびセキュリティ分析）に、そのスキルの実行に必要なものを伝えます。

### 基本フロントマター

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

スキルのランタイム要件は `metadata.openclaw` の下で宣言します（エイリアス: `metadata.clawdbot`, `metadata.clawdis`）。

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

スキル実行前に存在している必要がある環境変数には `requires.env` を使います。任意の変数を `required: false` で指定する場合など、変数ごとのメタデータが必要なときは `envVars` を使います。

### 全フィールドリファレンス

| フィールド              | 型       | 説明                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | スキルが期待する必須環境変数。                                                                                           |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                                     |
| `requires.anyBins` | `string[]` | 少なくとも 1 つが存在している必要がある CLI バイナリ。                                                                                                  |
| `requires.config`  | `string[]` | スキルが読み取る設定ファイルパス。                                                                                                          |
| `primaryEnv`       | `string`   | スキルのメイン認証情報環境変数。                                                                                                  |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を含む環境変数宣言。任意の環境変数には `required: false` を設定します。 |
| `always`           | `boolean`  | `true` の場合、スキルは常にアクティブです（明示的なインストールは不要）。                                                                              |
| `skillKey`         | `string`   | スキルの呼び出しキーを上書きします。                                                                                                         |
| `emoji`            | `string`   | スキルの表示絵文字。                                                                                                                 |
| `homepage`         | `string`   | スキルのホームページまたはドキュメントの URL。                                                                                                         |
| `os`               | `string[]` | OS 制限（例: `["macos"]`, `["linux"]`）。                                                                                             |
| `install`          | `array`    | 依存関係のインストール仕様（下記参照）。                                                                                                  |
| `nix`              | `object`   | Nix Plugin 仕様（README を参照）。                                                                                                                |
| `config`           | `object`   | Clawdbot 設定仕様（README を参照）。                                                                                                           |

### インストール仕様

スキルに依存関係のインストールが必要な場合は、`install` 配列で宣言します。

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

対応するインストール種別: `brew`, `node`, `go`, `uv`。

### 任意の環境変数

任意の環境変数は `metadata.openclaw.envVars` の下で宣言し、`required: false` を設定します。`requires.env` はそれらがないとスキルを実行できないことを意味するため、任意の項目を `requires.env` に追加しないでください。

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

### なぜこれが重要なのか

ClawHub のセキュリティ分析は、スキルが宣言している内容と実際に行う内容が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているのに、フロントマターで `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータの不一致としてフラグを立てます。宣言を正確に保つことで、スキルがレビューに通りやすくなり、ユーザーも何をインストールしているのか理解しやすくなります。

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

公開で受け付けられるのは「テキストベース」のファイルだけです。

- 拡張子の許可リストは `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け付けられます。
- `text/` で始まるコンテンツタイプはテキストとして扱われます。加えて、小さな許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）があります。

制限（サーバー側）:

- 合計バンドルサイズ: 50MB。
- 埋め込みテキストには `SKILL.md` と最大約 40 個の非 `.md` ファイルが含まれます（ベストエフォートの上限）。

## スラッグ

- デフォルトではフォルダー名から派生します。
- パッケージスコープは ClawHub の公開者ハンドルと完全に一致している必要があります。公開者ハンドルには小文字、数字、ハイフン、ドット、アンダースコアを使用できます。小文字または数字で開始し、終了する必要があります。
- パッケージスラッグは小文字で npm-safe である必要があります。例: `@example.tools/demo-plugin` または `demo-plugin`。

## バージョニング + タグ

- 公開するたびに新しいバージョン（semver）が作成されます。
- タグはバージョンへの文字列ポインターです。一般的には `latest` が使われます。

## ライセンス

- ClawHub で公開されるすべてのスキルは `MIT-0` の下でライセンスされます。
- 公開されたスキルは、商用利用を含め、誰でも使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条項を追加しないでください。ClawHub はスキルごとのライセンス上書きをサポートしていません。

## 有料スキル

- ClawHub は有料スキル、スキルごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。これはスキル形式の一部ではなく、公開されたスキルを有料にはしません。
- スキルが有料の第三者サービスと連携する場合は、外部コストと必要なアカウントをスキル手順および環境変数宣言（必須変数は `requires.env`、任意変数は `required: false` 付きの `envVars`）で明確に記載してください。
