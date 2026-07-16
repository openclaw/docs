---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: Skill フォルダーの形式、必須ファイル、許可されるファイル形式、制限。
x-i18n:
    generated_at: "2026-07-16T11:31:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill の形式

## ディスク上

Skill はフォルダーです。

必須:

- `SKILL.md`（または `skill.md`。従来の `skills.md` も使用可能）

任意:

- 補助用の任意の_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の除外パターン。従来の `.clawdhubignore`）
- `.gitignore`（こちらも適用されます）

## GitHub からのインポート

Web の GitHub インポーターは、ローカルでの公開や同期よりも制約が厳しくなっています。サインイン中の GitHub アカウントが所有する公開済みの非フォークリポジトリにある
`SKILL.md` または従来の `skills.md` ファイルのみを検出します。非公開リポジトリ、フォーク、
アーカイブ済みまたは無効化されたリポジトリ、第三者の公開リポジトリはインポートしません。

ローカルインストールのメタデータ（CLI が書き込み）:

- `<skill>/.clawhub/origin.json`（従来の `.clawdhub`）

作業ディレクトリのインストール状態（CLI が書き込み）:

- `<workdir>/.clawhub/lock.json`（従来の `.clawdhub`）

## `SKILL.md`

- 任意の YAML フロントマターを含む Markdown。
- 公開時に、サーバーがフロントマターからメタデータを抽出します。
- `description` は、UI や検索で Skill の概要として使用されます。

移植可能な Agent Skills では、`name` を親ディレクトリ名と一致させ、
1～64 文字の小文字、数字、またはハイフンを使用する必要があります。ClawHub ではルーティング可能なスラッグと
カタログ表示名が分離されているため、ほかのクライアントで使われている既存の名前も
書き換えられることなく公開できます。カタログの一覧では、保存されている名前を変更せずに、
長い名前を視覚的に短縮して表示する場合があります。

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

Skill のランタイム要件を `metadata.openclaw`（エイリアス: `metadata.clawdbot`、`metadata.clawdis`）で宣言します。

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

Skill を実行する前に存在していなければならない環境変数には `requires.env` を使用します。`required: false` による任意の変数など、変数ごとのメタデータが必要な場合は `envVars` を使用します。

### 全フィールドのリファレンス

| フィールド              | 型       | 説明                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skill が必要とする必須の環境変数。                                                                                           |
| `requires.bins`    | `string[]` | すべてインストールされていなければならない CLI バイナリ。                                                                                                     |
| `requires.anyBins` | `string[]` | 少なくとも 1 つが存在していなければならない CLI バイナリ。                                                                                                  |
| `requires.config`  | `string[]` | Skill が読み取る設定ファイルのパス。                                                                                                          |
| `primaryEnv`       | `string`   | Skill の主要な認証情報用環境変数。                                                                                                  |
| `envVars`          | `array`    | `name`、任意の `required`、任意の `description` を含む環境変数の宣言。任意の環境変数には `required: false` を設定します。 |
| `always`           | `boolean`  | `true` の場合、Skill は常に有効です（明示的なインストールは不要）。                                                                              |
| `skillKey`         | `string`   | Skill の呼び出しキーを上書きします。                                                                                                         |
| `emoji`            | `string`   | Skill の表示用絵文字。                                                                                                                 |
| `homepage`         | `string`   | Skill のホームページまたはドキュメントの URL。                                                                                                         |
| `os`               | `string[]` | OS の制限（例: `["macos"]`、`["linux"]`）。                                                                                             |
| `install`          | `array`    | 依存関係のインストール仕様（後述）。                                                                                                  |
| `nix`              | `object`   | Nix Plugin の仕様（README を参照）。                                                                                                                |
| `config`           | `object`   | Clawdbot の設定仕様（README を参照）。                                                                                                           |

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

サポートされているインストール種別: `brew`、`node`、`go`、`uv`。

### 任意の環境変数

任意の環境変数は `metadata.openclaw.envVars` で宣言し、`required: false` を設定します。`requires.env` は、それらがなければ Skill を実行できないことを意味するため、任意の項目を `requires.env` に追加しないでください。

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
        description: ユーザーが指定しない場合に使用する、任意のデフォルトプロジェクト ID。
```

### これが重要な理由

ClawHub のセキュリティ分析では、Skill が宣言している内容と実際の動作が一致しているかを確認します。コードが `TODOIST_API_KEY` を参照しているにもかかわらず、フロントマターの `requires.env`、`primaryEnv`、または `envVars` で宣言されていない場合、分析によってメタデータの不一致として報告されます。宣言を正確に保つことで、Skill がレビューに合格しやすくなり、ユーザーもインストールする内容を理解しやすくなります。

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

公開では「テキストベース」のファイルのみが受け入れられます。

- 拡張子の許可リストは `packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShell の `.ps1`、`.psm1`、`.psd1` ファイルはテキストとして受け入れられます。
- Content-Type が `text/` で始まるものはテキストとして扱われます。さらに、小規模な許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）もあります。

制限（サーバー側）:

- バンドルの合計サイズ: 50MB。
- 埋め込みテキストには、`SKILL.md` と、`.md` 以外のファイルを最大約 40 個含めます（ベストエフォートの上限）。

## スラッグ

- デフォルトではフォルダー名から生成されます。
- パッケージスコープは、ClawHub の公開者ハンドルと完全に一致する必要があります。公開者ハンドルには小文字、数字、ハイフン、ピリオド、アンダースコアを使用でき、先頭と末尾は小文字または数字でなければなりません。
- パッケージスラッグは小文字で npm に適合する必要があります。例: `@example.tools/demo-plugin` または `demo-plugin`。

## バージョニングとタグ

- 公開するたびに新しいバージョン（semver）が作成されます。
- タグはバージョンを指す文字列ポインターです。一般的には `latest` が使用されます。

## ライセンス

- ClawHub で公開されるすべての Skills には、`MIT-0` が適用されます。
- 公開された Skills は、商用目的を含め、誰でも使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md` に競合するライセンス条項を追加しないでください。ClawHub は Skill ごとのライセンス上書きをサポートしていません。

## 有料 Skills

- ClawHub は、有料 Skills、Skill ごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md` に価格メタデータを追加しないでください。これは Skill 形式の一部ではなく、追加しても公開済みの Skill が有料になることはありません。
- Skill が有料の第三者サービスと連携する場合は、Skill の手順と環境変数の宣言で、外部費用と必要なアカウントを明確に記載してください（必須変数には `requires.env`、任意の変数には `envVars` と `required: false`）。
