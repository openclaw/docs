---
read_when:
    - Skills の公開
    - 公開/同期の失敗をデバッグする
summary: スキルフォルダー形式、必須ファイル、許可されるファイル形式、制限。
x-i18n:
    generated_at: "2026-05-12T12:49:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# スキル形式

## ディスク上

スキルはフォルダーです。

必須:

- `SKILL.md` (または `skill.md`)

任意:

- 任意の補助用の _テキストベース_ ファイル (「許可されるファイル」を参照)
- `.clawhubignore` (公開/同期用の無視パターン、従来の `.clawdhubignore`)
- `.gitignore` (これも尊重されます)

ローカルインストールメタデータ (CLI が書き込み):

- `<skill>/.clawhub/origin.json` (従来の `.clawdhub`)

作業ディレクトリのインストール状態 (CLI が書き込み):

- `<workdir>/.clawhub/lock.json` (従来の `.clawdhub`)

## `SKILL.md`

- 任意の YAML フロントマターを含められる Markdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description` は UI/検索でスキルの概要として使用されます。

## フロントマターメタデータ

スキルメタデータは `SKILL.md` の先頭にある YAML フロントマターで宣言します。これにより、レジストリ (およびセキュリティ分析) はスキルの実行に必要なものを把握できます。

### 基本フロントマター

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### ランタイムメタデータ (`metadata.openclaw`)

スキルのランタイム要件を `metadata.openclaw` の下に宣言します (エイリアス: `metadata.clawdbot`、`metadata.clawdis`)。

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

スキルの実行前に存在している必要がある環境変数には `requires.env` を使用します。任意変数に `required: false` を指定する場合など、変数ごとのメタデータが必要な場合は `envVars` を使用します。

### 全フィールドリファレンス

| フィールド         | 型         | 説明                                                                                                                                         |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | スキルが想定する必須環境変数。                                                                                                               |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                        |
| `requires.anyBins` | `string[]` | 少なくとも 1 つが存在する必要がある CLI バイナリ。                                                                                           |
| `requires.config`  | `string[]` | スキルが読み取る設定ファイルパス。                                                                                                           |
| `primaryEnv`       | `string`   | スキルの主要な認証情報環境変数。                                                                                                             |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を含む環境変数宣言。任意の環境変数には `required: false` を設定します。                      |
| `always`           | `boolean`  | `true` の場合、スキルは常に有効です (明示的なインストールは不要)。                                                                           |
| `skillKey`         | `string`   | スキルの呼び出しキーを上書きします。                                                                                                         |
| `emoji`            | `string`   | スキルに表示する絵文字。                                                                                                                     |
| `homepage`         | `string`   | スキルのホームページまたはドキュメントの URL。                                                                                               |
| `os`               | `string[]` | OS 制限 (例: `["macos"]`、`["linux"]`)。                                                                                                      |
| `install`          | `array`    | 依存関係のインストール仕様 (下記参照)。                                                                                                      |
| `nix`              | `object`   | Nix Plugin 仕様 (README を参照)。                                                                                                            |
| `config`           | `object`   | Clawdbot 設定仕様 (README を参照)。                                                                                                          |

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

サポートされるインストール種別: `brew`、`node`、`go`、`uv`。

### 任意の環境変数

任意の環境変数は `metadata.openclaw.envVars` の下に宣言し、`required: false` を設定します。任意の項目を `requires.env` に追加しないでください。`requires.env` は、それらがないとスキルを実行できないことを意味するためです。

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

ClawHub のセキュリティ分析は、スキルが宣言している内容と実際の動作が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているのに、フロントマターで `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータの不一致としてフラグを立てます。宣言を正確に保つことで、スキルがレビューを通過しやすくなり、ユーザーが何をインストールしているかを理解しやすくなります。

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

公開で受け付けられるのは「テキストベース」のファイルのみです。

- 拡張子の許可リストは `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`) にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け付けられます。
- `text/` で始まるコンテンツタイプはテキストとして扱われます。加えて、小さな許可リスト (JSON/YAML/TOML/JS/TS/Markdown/SVG) があります。

制限 (サーバー側):

- 合計バンドルサイズ: 50MB。
- 埋め込みテキストには `SKILL.md` + 最大約 40 個の非 `.md` ファイルが含まれます (ベストエフォート上限)。

## スラッグ

- デフォルトではフォルダー名から導出されます。
- 小文字で URL セーフである必要があります: `^[a-z0-9][a-z0-9-]*$`。

## バージョニング + タグ

- 各公開で新しいバージョン (semver) が作成されます。
- タグはバージョンへの文字列ポインターです。`latest` がよく使用されます。

## ライセンス

- ClawHub で公開されるすべてのスキルは `MIT-0` の下でライセンスされます。
- 誰でも、商用利用を含め、公開済みスキルを使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条項を追加しないでください。ClawHub はスキルごとのライセンス上書きをサポートしていません。

## 有料スキル

- ClawHub は、有料スキル、スキルごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。これはスキル形式の一部ではなく、公開済みスキルを有料にするものでもありません。
- スキルが有料のサードパーティサービスと統合する場合は、外部コストと必要なアカウントをスキルの手順と環境変数宣言で明確に文書化してください (必須変数には `requires.env`、任意変数には `required: false` を指定した `envVars`)。
