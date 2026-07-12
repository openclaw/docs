---
read_when:
    - Skills の公開
    - 公開エラーのデバッグ
summary: Skill フォルダーの形式、必須ファイル、許可されるファイル形式、制限。
x-i18n:
    generated_at: "2026-07-12T21:29:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill の形式

## ディスク上

Skill はフォルダーです。

必須:

- `SKILL.md`（または `skill.md`。レガシーの `skills.md` も使用できます）

任意:

- 補助的な任意の_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の除外パターン。レガシーは `.clawdhubignore`）
- `.gitignore`（こちらも適用されます）

## GitHub インポート

Web の GitHub インポーターは、ローカルでの公開や同期よりも厳格です。サインイン中の GitHub アカウントが所有する、公開かつフォークではないリポジトリ内の `SKILL.md` またはレガシーの `skills.md` ファイルのみを検出します。プライベートリポジトリ、フォーク、アーカイブ済みまたは無効化されたリポジトリ、第三者の公開リポジトリはインポートしません。

ローカルインストールのメタデータ（CLI が書き込み）:

- `<skill>/.clawhub/origin.json`（レガシーは `.clawdhub`）

作業ディレクトリのインストール状態（CLI が書き込み）:

- `<workdir>/.clawhub/lock.json`（レガシーは `.clawdhub`）

## `SKILL.md`

- 任意の YAML フロントマターを含む Markdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description` は UI や検索で Skill の概要として使用されます。

移植可能な Agent Skills では、`name` を親ディレクトリ名と一致させ、1～64 文字の小文字、数字、またはハイフンを使用してください。ClawHub ではルーティング可能なスラッグとカタログ表示名が分離されているため、ほかのクライアントで使用されている既存の名前も公開でき、暗黙に書き換えられることはありません。カタログの一覧では、保存されている名前を変更せずに、長い名前が視覚的に短縮される場合があります。

## フロントマターのメタデータ

Skill のメタデータは、`SKILL.md` の先頭にある YAML フロントマターで宣言します。これにより、Skill の実行に必要なものがレジストリ（およびセキュリティ分析）に伝わります。

### 基本的なフロントマター

```yaml
---
name: my-skill
description: この Skill の機能についての短い概要。
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

Skill のランタイム要件を `metadata.openclaw`（別名: `metadata.clawdbot`、`metadata.clawdis`）配下で宣言します。

```yaml
---
name: my-skill
description: Todoist API を介してタスクを管理します。
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

Skill を実行する前に存在している必要がある環境変数には `requires.env` を使用します。`required: false` を指定する任意の変数など、変数ごとのメタデータが必要な場合は `envVars` を使用します。

### 全フィールドのリファレンス

| フィールド         | 型         | 説明                                                                                                                                                                 |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill が必要とする必須の環境変数。                                                                                                                                    |
| `requires.bins`    | `string[]` | すべてインストールされている必要がある CLI バイナリ。                                                                                                                 |
| `requires.anyBins` | `string[]` | 少なくとも 1 つが存在する必要がある CLI バイナリ。                                                                                                                    |
| `requires.config`  | `string[]` | Skill が読み取る設定ファイルのパス。                                                                                                                                  |
| `primaryEnv`       | `string`   | Skill の主要な認証情報用環境変数。                                                                                                                                    |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を含む環境変数の宣言。任意の環境変数には `required: false` を設定します。                                               |
| `always`           | `boolean`  | `true` の場合、Skill は常に有効になります（明示的なインストールは不要です）。                                                                                         |
| `skillKey`         | `string`   | Skill の呼び出しキーを上書きします。                                                                                                                                  |
| `emoji`            | `string`   | Skill の表示用絵文字。                                                                                                                                                 |
| `homepage`         | `string`   | Skill のホームページまたはドキュメントの URL。                                                                                                                        |
| `os`               | `string[]` | OS の制限（例: `["macos"]`、`["linux"]`）。                                                                                                                           |
| `install`          | `array`    | 依存関係のインストール仕様（後述）。                                                                                                                                  |
| `nix`              | `object`   | Nix Plugin の仕様（README を参照）。                                                                                                                                   |
| `config`           | `object`   | Clawdbot の設定仕様（README を参照）。                                                                                                                                 |

### インストール仕様

Skill で依存関係のインストールが必要な場合は、`install` 配列で宣言します。

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

任意の環境変数は `metadata.openclaw.envVars` 配下で宣言し、`required: false` を設定します。`requires.env` は環境変数がなければ Skill を実行できないことを意味するため、任意の項目を `requires.env` に追加しないでください。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: 認証済みリクエストに使用する Todoist API トークン。
      - name: TODOIST_PROJECT_ID
        required: false
        description: ユーザーが指定しない場合に使用する任意のデフォルトプロジェクト ID。
```

### これが重要な理由

ClawHub のセキュリティ分析では、Skill が宣言している内容と実際の動作が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているにもかかわらず、フロントマターの `requires.env`、`primaryEnv`、または `envVars` で宣言されていない場合、分析ではメタデータの不一致として報告されます。宣言を正確に保つことで、Skill がレビューに合格しやすくなり、ユーザーもインストールする内容を理解しやすくなります。

### 例: 完全なフロントマター

```yaml
---
name: todoist-cli
description: コマンドラインから Todoist のタスク、プロジェクト、ラベルを管理します。
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
        description: Todoist API トークン。
      - name: TODOIST_PROJECT_ID
        required: false
        description: 任意のデフォルトプロジェクト ID。
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 許可されるファイル

公開で受け付けられるのは「テキストベース」のファイルのみです。

- 拡張子の許可リストは `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け付けられます。
- `text/` で始まるコンテンツタイプはテキストとして扱われます。また、小規模な許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）もあります。

制限（サーバー側）:

- バンドルの合計サイズ: 50MB。
- 埋め込みテキストには `SKILL.md` と最大約 40 個の `.md` 以外のファイルが含まれます（ベストエフォートの上限）。

## スラッグ

- デフォルトではフォルダー名から生成されます。
- パッケージスコープは ClawHub の公開者ハンドルと完全に一致する必要があります。公開者ハンドルには、小文字、数字、ハイフン、ドット、アンダースコアを使用でき、先頭と末尾は小文字または数字でなければなりません。
- パッケージスラッグは小文字かつ npm で安全に使用できる形式でなければなりません。例: `@example.tools/demo-plugin` または `demo-plugin`。

## バージョニングとタグ

- 公開するたびに新しいバージョン（semver）が作成されます。
- タグはバージョンを指す文字列ポインターです。一般的には `latest` が使用されます。

## ライセンス

- ClawHub で公開されるすべての Skill には `MIT-0` ライセンスが適用されます。
- 誰でも、商用利用を含め、公開された Skill を使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条項を追加しないでください。ClawHub は Skill ごとのライセンス上書きをサポートしていません。

## 有料 Skill

- ClawHub は有料 Skill、Skill ごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。これは Skill の形式に含まれず、追加しても公開された Skill が有料になることはありません。
- Skill が有料の第三者サービスと統合する場合は、外部費用と必要なアカウントについて、Skill の手順および環境変数の宣言で明確に説明してください（必須変数には `requires.env`、任意の変数には `required: false` を指定した `envVars` を使用します）。
