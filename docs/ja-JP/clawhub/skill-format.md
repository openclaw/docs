---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: Skill フォルダー形式、必須ファイル、許可されるファイルタイプ、制限。
x-i18n:
    generated_at: "2026-07-01T07:51:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 形式

## ディスク上

skill はフォルダーです。

必須:

- `SKILL.md`（または `skill.md`; レガシーの `skills.md` も受け入れられます）

任意:

- 任意の補助的な_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の無視パターン、レガシー `.clawdhubignore`）
- `.gitignore`（これも尊重されます）

## GitHub インポート

Web の GitHub インポーターは、ローカルの公開/同期よりも厳格です。サインイン中の GitHub アカウントが所有する、公開済みで fork ではないリポジトリ内の
`SKILL.md` またはレガシー `skills.md` ファイルのみを検出します。private リポジトリ、fork、
アーカイブ済み/無効化済みリポジトリ、またはサードパーティの公開リポジトリはインポートしません。

ローカルインストールメタデータ（CLI によって書き込まれます）:

- `<skill>/.clawhub/origin.json`（レガシー `.clawdhub`）

workdir インストール状態（CLI によって書き込まれます）:

- `<workdir>/.clawhub/lock.json`（レガシー `.clawdhub`）

## `SKILL.md`

- 任意の YAML frontmatter を含む Markdown。
- サーバーは公開時に frontmatter からメタデータを抽出します。
- `description` は UI/検索内の skill 概要として使用されます。

## Frontmatter メタデータ

Skill メタデータは、`SKILL.md` の先頭にある YAML frontmatter で宣言します。これは、その skill の実行に必要なものを registry（およびセキュリティ分析）に伝えます。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

Skill のランタイム要件を `metadata.openclaw` の下に宣言します（エイリアス: `metadata.clawdbot`, `metadata.clawdis`）。

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

Skill の実行前に存在している必要がある環境変数には `requires.env` を使用します。`required: false` を持つ任意変数を含め、変数ごとのメタデータが必要な場合は `envVars` を使用します。

### 全フィールドリファレンス

| フィールド         | 型         | 説明                                                                                                                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `requires.env`     | `string[]` | Skill が想定する必須環境変数。                                                                                                       |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                |
| `requires.anyBins` | `string[]` | 少なくとも 1 つが存在している必要がある CLI バイナリ。                                                                               |
| `requires.config`  | `string[]` | Skill が読み取る config ファイルパス。                                                                                               |
| `primaryEnv`       | `string`   | Skill の主要な credential 環境変数。                                                                                                 |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を持つ環境変数宣言。任意の環境変数には `required: false` を設定します。             |
| `always`           | `boolean`  | `true` の場合、skill は常に active です（明示的なインストールは不要）。                                                              |
| `skillKey`         | `string`   | Skill の呼び出しキーを上書きします。                                                                                                 |
| `emoji`            | `string`   | Skill の表示 emoji。                                                                                                                 |
| `homepage`         | `string`   | Skill のホームページまたは docs への URL。                                                                                           |
| `os`               | `string[]` | OS 制限（例: `["macos"]`, `["linux"]`）。                                                                                            |
| `install`          | `array`    | 依存関係のインストール仕様（下記参照）。                                                                                             |
| `nix`              | `object`   | Nix plugin 仕様（README を参照）。                                                                                                   |
| `config`           | `object`   | Clawdbot config 仕様（README を参照）。                                                                                              |

### インストール仕様

Skill が依存関係のインストールを必要とする場合は、`install` 配列で宣言します:

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

任意の環境変数は `metadata.openclaw.envVars` の下に宣言し、`required: false` を設定します。任意のエントリを `requires.env` に追加しないでください。`requires.env` は、それらなしでは skill が実行できないことを意味するためです。

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

ClawHub のセキュリティ分析は、skill が宣言している内容と実際の動作が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているのに、frontmatter がそれを `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータ不一致としてフラグします。宣言を正確に保つことで、skill がレビューを通過しやすくなり、ユーザーが何をインストールしているのか理解しやすくなります。

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

- 拡張子の allowlist は `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- Script ファイルはアップロード後も引き続きスキャンされます。PowerShell `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け入れられます。
- `text/` で始まる Content type はテキストとして扱われます。加えて、小さな allowlist（JSON/YAML/TOML/JS/TS/Markdown/SVG）があります。

制限（サーバー側）:

- 合計 bundle サイズ: 50MB。
- Embedding text には `SKILL.md` + 最大約 40 個の非 `.md` ファイルが含まれます（best-effort の上限）。

## Slug

- デフォルトではフォルダー名から派生します。
- Package scope は ClawHub publisher handle と正確に一致している必要があります。Publisher handle には小文字、数字、ハイフン、ドット、アンダースコアを使用できます。また、小文字または数字で始まり、終わる必要があります。
- Package slug は小文字で npm-safe である必要があります。例: `@example.tools/demo-plugin` または `demo-plugin`。

## バージョニング + タグ

- 公開ごとに新しい version（semver）が作成されます。
- タグは version への文字列ポインターです。`latest` がよく使用されます。

## ライセンス

- ClawHub で公開されるすべての skill は `MIT-0` の下でライセンスされます。
- 誰でも、商用利用を含め、公開された skill を使用、変更、再配布できます。
- Attribution は不要です。
- `SKILL.md` に競合するライセンス条項を追加しないでください。ClawHub は skill ごとのライセンス上書きをサポートしていません。

## 有料 skill

- ClawHub は有料 skill、skill ごとの pricing、paywall、または収益分配をサポートしていません。
- `SKILL.md` に pricing メタデータを追加しないでください。それは skill 形式の一部ではなく、公開済み skill を有料にすることもありません。
- Skill が有料のサードパーティサービスと連携する場合は、外部コストと必要なアカウントを skill 手順および env 宣言（必須変数には `requires.env`、任意変数には `required: false` を持つ `envVars`）で明確に文書化してください。
