---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: Skill フォルダーの形式、必須ファイル、許可されるファイル形式、制限。
x-i18n:
    generated_at: "2026-07-14T13:34:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill形式

## ディスク上

Skillはフォルダーです。

必須:

- `SKILL.md`（または`skill.md`。レガシーの`skills.md`も使用可能）

任意:

- 補助的な_テキストベース_のファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の無視パターン。レガシーは`.clawdhubignore`）
- `.gitignore`（これも適用されます）

## GitHubからのインポート

Web版GitHubインポーターは、ローカルでの公開や同期より厳格です。サインイン中のGitHubアカウントが所有する、公開かつフォークではないリポジトリ内の
`SKILL.md`またはレガシーの`skills.md`ファイルのみを検出します。非公開リポジトリ、フォーク、
アーカイブ済みまたは無効化されたリポジトリ、第三者が所有する公開リポジトリはインポートしません。

ローカルインストールのメタデータ（CLIによって書き込まれます）:

- `<skill>/.clawhub/origin.json`（レガシーは`.clawdhub`）

作業ディレクトリのインストール状態（CLIによって書き込まれます）:

- `<workdir>/.clawhub/lock.json`（レガシーは`.clawdhub`）

## `SKILL.md`

- 任意のYAMLフロントマターを含むMarkdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description`は、UIおよび検索でSkillの概要として使用されます。

移植可能なAgent Skillsでは、`name`を親ディレクトリ名と一致させ、
1～64文字の小文字、数字、またはハイフンを使用する必要があります。ClawHubではルーティング可能なスラッグと
カタログ表示名が分離されているため、他のクライアントで使用されている既存の名前も
公開でき、暗黙に書き換えられることはありません。カタログの一覧では、保存された名前を変更せずに
長い名前が視覚的に短縮される場合があります。

## フロントマターのメタデータ

Skillのメタデータは、`SKILL.md`の先頭にあるYAMLフロントマターで宣言します。これにより、Skillの実行に必要なものがレジストリ（およびセキュリティ分析）に伝わります。

### 基本的なフロントマター

```yaml
---
name: my-skill
description: このSkillの機能についての短い概要。
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

Skillのランタイム要件を`metadata.openclaw`の下で宣言します（エイリアス: `metadata.clawdbot`、`metadata.clawdis`）。

```yaml
---
name: my-skill
description: Todoist APIを介してタスクを管理します。
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

Skillを実行する前に存在している必要がある環境変数には`requires.env`を使用します。`required: false`による任意の変数など、変数ごとのメタデータが必要な場合は`envVars`を使用します。

### 全フィールドのリファレンス

| フィールド              | 型       | 説明                                                                                                                                  |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Skillが必要とする必須の環境変数。                                                                                           |
| `requires.bins`    | `string[]` | すべてインストールされている必要があるCLIバイナリ。                                                                                                     |
| `requires.anyBins` | `string[]` | 少なくとも1つが存在する必要があるCLIバイナリ。                                                                                                  |
| `requires.config`  | `string[]` | Skillが読み取る設定ファイルのパス。                                                                                                          |
| `primaryEnv`       | `string`   | Skillの主要な認証情報用環境変数。                                                                                                  |
| `envVars`          | `array`    | `name`、任意の`required`、任意の`description`を含む環境変数の宣言。任意の環境変数には`required: false`を設定します。 |
| `always`           | `boolean`  | `true`の場合、Skillは常に有効です（明示的なインストールは不要）。                                                                              |
| `skillKey`         | `string`   | Skillの呼び出しキーを上書きします。                                                                                                         |
| `emoji`            | `string`   | Skillの表示用絵文字。                                                                                                                 |
| `homepage`         | `string`   | SkillのホームページまたはドキュメントのURL。                                                                                                         |
| `os`               | `string[]` | OSの制限（例: `["macos"]`、`["linux"]`）。                                                                                             |
| `install`          | `array`    | 依存関係のインストール仕様（後述）。                                                                                                  |
| `nix`              | `object`   | Nix Pluginの仕様（READMEを参照）。                                                                                                                |
| `config`           | `object`   | Clawdbotの設定仕様（READMEを参照）。                                                                                                           |

### インストール仕様

Skillに依存関係のインストールが必要な場合は、`install`配列で宣言します。

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

任意の環境変数は`metadata.openclaw.envVars`の下で宣言し、`required: false`を設定します。`requires.env`は、それらがなければSkillを実行できないことを意味するため、任意の項目を`requires.env`に追加しないでください。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: 認証済みリクエストに使用するTodoist APIトークン。
      - name: TODOIST_PROJECT_ID
        required: false
        description: ユーザーが指定しない場合に使用する任意のデフォルトプロジェクトID。
```

### これが重要な理由

ClawHubのセキュリティ分析では、Skillの宣言内容が実際の動作と一致しているかを確認します。コードが`TODOIST_API_KEY`を参照しているにもかかわらず、フロントマターの`requires.env`、`primaryEnv`、または`envVars`で宣言されていない場合、分析によってメタデータの不一致として報告されます。宣言を正確に保つことで、Skillがレビューを通過しやすくなり、ユーザーもインストール内容を理解しやすくなります。

### 例: 完全なフロントマター

```yaml
---
name: todoist-cli
description: コマンドラインからTodoistのタスク、プロジェクト、ラベルを管理します。
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
        description: Todoist APIトークン。
      - name: TODOIST_PROJECT_ID
        required: false
        description: 任意のデフォルトプロジェクトID。
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## 許可されるファイル

公開では「テキストベース」のファイルのみが受け付けられます。

- 拡張子の許可リストは`packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShellの`.ps1`、`.psm1`、`.psd1`ファイルはテキストとして受け付けられます。
- `text/`で始まるコンテンツタイプはテキストとして扱われます。さらに、小規模な許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）があります。

制限（サーバー側）:

- バンドルの合計サイズ: 50MB。
- 埋め込みテキストには、`SKILL.md`と最大約40個の非`.md`ファイルが含まれます（ベストエフォートの上限）。

## スラッグ

- デフォルトではフォルダー名から生成されます。
- パッケージスコープは、ClawHubの公開者ハンドルと完全に一致する必要があります。公開者ハンドルには小文字、数字、ハイフン、ドット、アンダースコアを使用でき、先頭と末尾は小文字または数字である必要があります。
- パッケージスラッグは小文字かつnpmで安全に使用できる形式である必要があります。例: `@example.tools/demo-plugin`または`demo-plugin`。

## バージョニングとタグ

- 公開するたびに新しいバージョン（semver）が作成されます。
- タグはバージョンを指す文字列ポインターです。一般的には`latest`が使用されます。

## ライセンス

- ClawHubで公開されるすべてのSkillsには、`MIT-0`が適用されます。
- 公開されたSkillsは、商用利用を含め、誰でも使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md`に競合するライセンス条項を追加しないでください。ClawHubはSkillごとのライセンス上書きをサポートしていません。

## 有料Skills

- ClawHubは、有料Skills、Skillごとの価格設定、ペイウォール、収益分配をサポートしていません。
- `SKILL.md`に価格設定のメタデータを追加しないでください。これはSkill形式の一部ではなく、追加しても公開されたSkillが有料になることはありません。
- Skillが有料の第三者サービスと連携する場合は、Skillの手順と環境変数の宣言で、外部費用と必要なアカウントを明確に記載してください（必須変数には`requires.env`、任意変数には`required: false`を指定した`envVars`を使用）。
