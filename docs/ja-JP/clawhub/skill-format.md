---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: Skill フォルダー形式、必須ファイル、許可されるファイルタイプ、制限。
x-i18n:
    generated_at: "2026-07-02T13:58:01Z"
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

- `SKILL.md`（または `skill.md`。従来の `skills.md` も使用可）

任意:

- 補助用の任意の_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の無視パターン。従来の `.clawdhubignore`）
- `.gitignore`（これも尊重されます）

## GitHub インポート

Web の GitHub インポーターは、ローカルの公開/同期よりも厳格です。サインイン中の GitHub アカウントが所有する、公開済みでフォークではないリポジトリ内の `SKILL.md` または従来の `skills.md` ファイルのみを検出します。プライベートリポジトリ、フォーク、アーカイブ済み/無効化済みリポジトリ、または第三者の公開リポジトリはインポートしません。

ローカルインストールメタデータ（CLI が書き込み）:

- `<skill>/.clawhub/origin.json`（従来の `.clawdhub`）

作業ディレクトリのインストール状態（CLI が書き込み）:

- `<workdir>/.clawhub/lock.json`（従来の `.clawdhub`）

## `SKILL.md`

- 任意の YAML フロントマターを含められる Markdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description` は UI/検索でスキルの概要として使用されます。

## フロントマターメタデータ

スキルメタデータは `SKILL.md` の先頭にある YAML フロントマターで宣言します。これにより、レジストリ（およびセキュリティ分析）に、スキルの実行に必要なものを伝えます。

### 基本フロントマター

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

スキルのランタイム要件を `metadata.openclaw`（別名: `metadata.clawdbot`、`metadata.clawdis`）の下に宣言します。

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

スキルの実行前に存在している必要がある環境変数には `requires.env` を使用します。任意の変数を `required: false` で含めるなど、変数ごとのメタデータが必要な場合は `envVars` を使用します。

### 全フィールドリファレンス

| フィールド         | 型         | 説明                                                                                                                                               |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | スキルが期待する必須環境変数。                                                                                                                     |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                              |
| `requires.anyBins` | `string[]` | 少なくとも 1 つ存在する必要がある CLI バイナリ。                                                                                                   |
| `requires.config`  | `string[]` | スキルが読み取る設定ファイルパス。                                                                                                                  |
| `primaryEnv`       | `string`   | スキルのメイン認証情報の環境変数。                                                                                                                  |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を持つ環境変数宣言。任意の環境変数には `required: false` を設定します。                           |
| `always`           | `boolean`  | `true` の場合、スキルは常にアクティブです（明示的なインストールは不要）。                                                                          |
| `skillKey`         | `string`   | スキルの呼び出しキーを上書きします。                                                                                                                |
| `emoji`            | `string`   | スキルの表示用絵文字。                                                                                                                              |
| `homepage`         | `string`   | スキルのホームページまたはドキュメントの URL。                                                                                                     |
| `os`               | `string[]` | OS 制限（例: `["macos"]`、`["linux"]`）。                                                                                                          |
| `install`          | `array`    | 依存関係のインストール仕様（下記参照）。                                                                                                            |
| `nix`              | `object`   | Nix Plugin 仕様（README 参照）。                                                                                                                    |
| `config`           | `object`   | Clawdbot 設定仕様（README 参照）。                                                                                                                  |

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

サポートされるインストール種別: `brew`、`node`、`go`、`uv`。

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

### これが重要な理由

ClawHub のセキュリティ分析は、スキルが宣言している内容と実際の動作が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているのに、フロントマターで `requires.env`、`primaryEnv`、または `envVars` の下に宣言していない場合、分析はメタデータの不一致としてフラグを立てます。宣言を正確に保つことで、スキルがレビューを通過しやすくなり、ユーザーは何をインストールしているのかを理解しやすくなります。

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
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け付けられます。
- `text/` で始まるコンテンツタイプはテキストとして扱われます。加えて、小さな許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）があります。

制限（サーバー側）:

- バンドル合計サイズ: 50MB。
- 埋め込みテキストには `SKILL.md` + 最大約 40 個の非 `.md` ファイルが含まれます（ベストエフォートの上限）。

## スラッグ

- デフォルトではフォルダー名から導出されます。
- パッケージスコープは ClawHub パブリッシャーハンドルと正確に一致している必要があります。パブリッシャーハンドルには小文字、数字、ハイフン、ドット、アンダースコアを使用できます。先頭と末尾は小文字または数字でなければなりません。
- パッケージスラッグは小文字で npm セーフである必要があります。例: `@example.tools/demo-plugin` または `demo-plugin`。

## バージョニング + タグ

- 公開ごとに新しいバージョン（semver）が作成されます。
- タグはバージョンへの文字列ポインターです。一般的には `latest` が使用されます。

## ライセンス

- ClawHub で公開されるすべてのスキルは `MIT-0` の下でライセンスされます。
- 誰でも、公開されたスキルを商用利用を含めて使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条件を追加しないでください。ClawHub はスキルごとのライセンス上書きをサポートしていません。

## 有料スキル

- ClawHub は有料スキル、スキルごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。これはスキル形式の一部ではなく、公開されたスキルが有料になることもありません。
- スキルが有料の第三者サービスと連携する場合は、外部費用と必要なアカウントをスキルの手順および環境変数宣言（必須変数には `requires.env`、任意変数には `required: false` を指定した `envVars`）に明確に記載してください。
