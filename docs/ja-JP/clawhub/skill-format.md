---
read_when:
    - Skills の公開
    - 公開/同期の失敗のデバッグ
summary: Skill フォルダーの形式、必須ファイル、許可されるファイル種別、制限。
x-i18n:
    generated_at: "2026-05-13T04:18:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 形式

## ディスク上

Skill はフォルダーです。

必須:

- `SKILL.md`（または `skill.md`）

任意:

- 任意の補助的な_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開/同期用の無視パターン、レガシー `.clawdhubignore`）
- `.gitignore`（同様に尊重されます）

ローカルインストールメタデータ（CLI によって書き込まれます）:

- `<skill>/.clawhub/origin.json`（レガシー `.clawdhub`）

作業ディレクトリのインストール状態（CLI によって書き込まれます）:

- `<workdir>/.clawhub/lock.json`（レガシー `.clawdhub`）

## `SKILL.md`

- 任意の YAML frontmatter を含む Markdown。
- サーバーは公開時に frontmatter からメタデータを抽出します。
- `description` は UI/検索で Skill の概要として使用されます。

## Frontmatter メタデータ

Skill メタデータは `SKILL.md` の先頭にある YAML frontmatter で宣言します。これにより、レジストリ（およびセキュリティ分析）に、Skill の実行に必要なものを伝えます。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

`metadata.openclaw`（エイリアス: `metadata.clawdbot`、`metadata.clawdis`）の下に Skill のランタイム要件を宣言します。

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

Skill を実行する前に存在している必要がある環境変数には `requires.env` を使用します。任意変数に `required: false` を付ける場合など、変数ごとのメタデータが必要な場合は `envVars` を使用します。

### 全フィールドリファレンス

| フィールド         | 型         | 説明                                                                                                                                       |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Skill が期待する必須環境変数。                                                                                                             |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                      |
| `requires.anyBins` | `string[]` | 少なくとも 1 つ存在している必要がある CLI バイナリ。                                                                                       |
| `requires.config`  | `string[]` | Skill が読み取る設定ファイルパス。                                                                                                         |
| `primaryEnv`       | `string`   | Skill のメイン認証情報 env var。                                                                                                           |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を含む環境変数宣言。任意の env var には `required: false` を設定します。                  |
| `always`           | `boolean`  | `true` の場合、Skill は常にアクティブです（明示的なインストールは不要）。                                                                  |
| `skillKey`         | `string`   | Skill の呼び出しキーを上書きします。                                                                                                       |
| `emoji`            | `string`   | Skill 用の表示絵文字。                                                                                                                     |
| `homepage`         | `string`   | Skill のホームページまたはドキュメントの URL。                                                                                             |
| `os`               | `string[]` | OS 制限（例: `["macos"]`、`["linux"]`）。                                                                                                   |
| `install`          | `array`    | 依存関係のインストール仕様（下記参照）。                                                                                                   |
| `nix`              | `object`   | Nix Plugin 仕様（README を参照）。                                                                                                         |
| `config`           | `object`   | Clawdbot 設定仕様（README を参照）。                                                                                                       |

### インストール仕様

Skill が依存関係のインストールを必要とする場合は、`install` 配列で宣言します。

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

サポートされるインストール種別: `brew`、`node`、`go`、`uv`。

### 任意の環境変数

任意の環境変数は `metadata.openclaw.envVars` の下で宣言し、`required: false` を設定します。任意の項目を `requires.env` に追加しないでください。`requires.env` は、それらがないと Skill を実行できないことを意味するためです。

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

ClawHub のセキュリティ分析は、Skill が宣言している内容と実際に行う内容が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているのに、frontmatter で `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータの不一致としてフラグを立てます。宣言を正確に保つことで、Skill がレビューを通過しやすくなり、ユーザーが何をインストールしているのか理解しやすくなります。

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

公開で受け付けられるのは「テキストベース」ファイルのみです。

- 拡張子の許可リストは `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け付けられます。
- `text/` で始まる Content type はテキストとして扱われます。加えて、小さな許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）があります。

制限（サーバー側）:

- 合計バンドルサイズ: 50MB。
- 埋め込みテキストには `SKILL.md` + 最大約 40 個の非 `.md` ファイルが含まれます（ベストエフォートの上限）。

## Slug

- デフォルトではフォルダー名から派生します。
- 小文字かつ URL セーフである必要があります: `^[a-z0-9][a-z0-9-]*$`。

## バージョニング + タグ

- 各公開で新しいバージョン（semver）が作成されます。
- タグはバージョンへの文字列ポインターです。`latest` が一般的に使用されます。

## ライセンス

- ClawHub で公開されるすべての Skills は `MIT-0` の下でライセンスされます。
- 誰でも、公開された Skills を商用利用を含めて使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条件を追加しないでください。ClawHub は Skill ごとのライセンス上書きをサポートしていません。

## 有料 Skills

- ClawHub は有料 Skills、Skill ごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。これは Skill 形式の一部ではなく、公開された Skill を有料にするものでもありません。
- Skill が有料のサードパーティサービスと連携する場合は、Skill の手順と env 宣言（必須変数には `requires.env`、任意変数には `required: false` を指定した `envVars`）で、外部コストと必要なアカウントを明確に記載してください。
