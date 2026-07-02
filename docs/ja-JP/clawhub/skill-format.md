---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: Skillsフォルダー形式、必須ファイル、許可されるファイルタイプ、制限。
x-i18n:
    generated_at: "2026-07-02T22:21:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill 形式

## ディスク上

Skill はフォルダーです。

必須:

- `SKILL.md`（または `skill.md`; レガシーの `skills.md` も受け入れられます）

任意:

- 任意の補助的な_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開用の ignore パターン、レガシー `.clawdhubignore`）
- `.gitignore`（これも尊重されます）

## GitHub インポート

Web GitHub インポーターは、ローカルの publish/sync より厳格です。サインイン中の GitHub アカウントが所有する、公開済みで fork ではないリポジトリ内の
`SKILL.md` またはレガシー `skills.md` ファイルのみを検出します。private リポジトリ、fork、
アーカイブ済み/無効化済みリポジトリ、またはサードパーティの公開リポジトリはインポートしません。

ローカルインストールメタデータ（CLI が書き込み）:

- `<skill>/.clawhub/origin.json`（レガシー `.clawdhub`）

Workdir インストール状態（CLI が書き込み）:

- `<workdir>/.clawhub/lock.json`（レガシー `.clawdhub`）

## `SKILL.md`

- 任意の YAML frontmatter を含められる Markdown。
- サーバーは publish 時に frontmatter からメタデータを抽出します。
- `description` は UI/検索で Skill の概要として使用されます。

## Frontmatter メタデータ

Skill メタデータは、`SKILL.md` の先頭にある YAML frontmatter で宣言します。これにより、registry（およびセキュリティ分析）に Skill の実行に必要なものを伝えます。

### 基本 frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Runtime メタデータ（`metadata.openclaw`）

Skill の runtime 要件を `metadata.openclaw` の下で宣言します（alias: `metadata.clawdbot`, `metadata.clawdis`）。

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

Skill を実行する前に存在している必要がある環境変数には `requires.env` を使用します。任意変数を含む変数ごとのメタデータが必要な場合は、`required: false` とともに `envVars` を使用します。

### 完全なフィールドリファレンス

| フィールド              | 型       | 説明                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill が期待する必須環境変数。                                                                                           |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                                     |
| `requires.anyBins` | `string[]` | 少なくとも 1 つが存在している必要がある CLI バイナリ。                                                                                                  |
| `requires.config`  | `string[]` | Skill が読み取る config ファイルパス。                                                                                                          |
| `primaryEnv`       | `string`   | Skill のメイン認証情報 env var。                                                                                                  |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を持つ環境変数宣言。任意の env vars には `required: false` を設定します。 |
| `always`           | `boolean`  | `true` の場合、Skill は常に active です（明示的な install は不要）。                                                                              |
| `skillKey`         | `string`   | Skill の invocation key を上書きします。                                                                                                         |
| `emoji`            | `string`   | Skill の表示 emoji。                                                                                                                 |
| `homepage`         | `string`   | Skill の homepage または docs への URL。                                                                                                         |
| `os`               | `string[]` | OS 制限（例: `["macos"]`, `["linux"]`）。                                                                                             |
| `install`          | `array`    | 依存関係の install spec（下記参照）。                                                                                                  |
| `nix`              | `object`   | Nix Plugin spec（README 参照）。                                                                                                                |
| `config`           | `object`   | Clawdbot config spec（README 参照）。                                                                                                           |

### Install spec

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

対応している install kind: `brew`, `node`, `go`, `uv`。

### 任意の環境変数

任意の環境変数は `metadata.openclaw.envVars` の下で宣言し、`required: false` を設定します。任意項目を `requires.env` に追加しないでください。`requires.env` は、それらがないと Skill を実行できないことを意味するためです。

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

### なぜこれが重要か

ClawHub のセキュリティ分析は、Skill が宣言している内容と実際に行う内容が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているのに、frontmatter で `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータの不一致としてフラグを立てます。宣言を正確に保つことで、Skill がレビューに通りやすくなり、ユーザーも何をインストールしているのかを理解しやすくなります。

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

publish では「テキストベース」のファイルのみが受け入れられます。

- 拡張子の allowlist は `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け入れられます。
- `text/` で始まる content type はテキストとして扱われます。加えて、小さな allowlist（JSON/YAML/TOML/JS/TS/Markdown/SVG）があります。

制限（サーバー側）:

- 合計 bundle サイズ: 50MB。
- embedding テキストには `SKILL.md` + 最大約 40 個の非 `.md` ファイルが含まれます（ベストエフォートの上限）。

## Slug

- デフォルトではフォルダー名から派生します。
- Package scope は ClawHub publisher handle と完全に一致している必要があります。Publisher handle には小文字、数字、ハイフン、ドット、アンダースコアを使用できます。小文字または数字で始まり、終わる必要があります。
- Package slug は小文字で npm-safe である必要があります。例: `@example.tools/demo-plugin` または `demo-plugin`。

## Versioning + tag

- publish のたびに新しい version（semver）が作成されます。
- Tag は version への文字列ポインターです。`latest` が一般的に使用されます。

## License

- ClawHub で公開されるすべての Skills は `MIT-0` の下でライセンスされます。
- 誰でも、公開された Skills を商用利用を含めて使用、変更、再配布できます。
- Attribution は不要です。
- `SKILL.md` に競合するライセンス条件を追加しないでください。ClawHub は Skill ごとの license override をサポートしていません。

## 有料 Skills

- ClawHub は有料 Skills、Skill ごとの pricing、paywall、または revenue sharing をサポートしていません。
- `SKILL.md` に pricing メタデータを追加しないでください。これは Skill 形式の一部ではなく、公開済み Skill を有料にするものでもありません。
- Skill が有料のサードパーティサービスと統合する場合は、外部費用と必要なアカウントを Skill 手順および env 宣言（必須変数には `requires.env`、任意変数には `required: false` 付きの `envVars`）で明確に文書化してください。
