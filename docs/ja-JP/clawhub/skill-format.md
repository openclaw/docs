---
read_when:
    - Skills の公開
    - 公開失敗のデバッグ
summary: Skill フォルダー形式、必須ファイル、許可されるファイル種類、制限。
x-i18n:
    generated_at: "2026-07-04T17:48:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Skill形式

## ディスク上

Skillはフォルダーです。

必須:

- `SKILL.md`（または`skill.md`; レガシーの`skills.md`も受け付けます）

任意:

- 補助用の任意の_テキストベース_ファイル（「許可されるファイル」を参照）
- `.clawhubignore`（公開時の無視パターン、レガシーの`.clawdhubignore`）
- `.gitignore`（これも尊重されます）

## GitHubインポート

Web版のGitHubインポーターは、ローカルの公開/同期よりも厳格です。サインイン中のGitHubアカウントが所有する、公開かつフォークでないリポジトリ内の
`SKILL.md`またはレガシーの`skills.md`ファイルのみを検出します。プライベートリポジトリ、フォーク、アーカイブ済み/無効化済みリポジトリ、またはサードパーティの公開リポジトリはインポートしません。

ローカルインストールメタデータ（CLIが書き込み）:

- `<skill>/.clawhub/origin.json`（レガシー`.clawdhub`）

作業ディレクトリのインストール状態（CLIが書き込み）:

- `<workdir>/.clawhub/lock.json`（レガシー`.clawdhub`）

## `SKILL.md`

- 任意のYAMLフロントマターを含むMarkdown。
- サーバーは公開時にフロントマターからメタデータを抽出します。
- `description`はUI/検索でSkillの概要として使用されます。

## フロントマターメタデータ

Skillメタデータは、`SKILL.md`の先頭にあるYAMLフロントマターで宣言します。これは、そのSkillを実行するために何が必要かをレジストリ（およびセキュリティ分析）に伝えます。

### 基本フロントマター

```yaml
---
name: my-skill
description: このSkillが行うことの短い概要。
version: 1.0.0
---
```

### ランタイムメタデータ（`metadata.openclaw`）

`metadata.openclaw`（別名: `metadata.clawdbot`、`metadata.clawdis`）の下にSkillのランタイム要件を宣言します。

```yaml
---
name: my-skill
description: Todoist API経由でタスクを管理します。
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

Skillを実行する前に存在している必要がある環境変数には`requires.env`を使用します。任意変数を含む変数ごとのメタデータが必要な場合は、`required: false`を指定した`envVars`を使用します。

### 全フィールドリファレンス

| フィールド | 型 | 説明 |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env` | `string[]` | Skillが想定する必須環境変数。 |
| `requires.bins` | `string[]` | すべてインストールされている必要があるCLIバイナリ。 |
| `requires.anyBins` | `string[]` | 少なくとも1つが存在している必要があるCLIバイナリ。 |
| `requires.config` | `string[]` | Skillが読み取る設定ファイルパス。 |
| `primaryEnv` | `string` | Skillのメイン認証情報となる環境変数。 |
| `envVars` | `array` | `name`、任意の`required`、任意の`description`を持つ環境変数宣言。任意の環境変数には`required: false`を設定します。 |
| `always` | `boolean` | `true`の場合、Skillは常にアクティブです（明示的なインストールは不要）。 |
| `skillKey` | `string` | Skillの呼び出しキーを上書きします。 |
| `emoji` | `string` | Skillの表示絵文字。 |
| `homepage` | `string` | SkillのホームページまたはドキュメントへのURL。 |
| `os` | `string[]` | OS制限（例: `["macos"]`、`["linux"]`）。 |
| `install` | `array` | 依存関係のインストール仕様（下記参照）。 |
| `nix` | `object` | Nix Plugin仕様（READMEを参照）。 |
| `config` | `object` | Clawdbot設定仕様（READMEを参照）。 |

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

対応しているインストール種別: `brew`、`node`、`go`、`uv`。

### 任意の環境変数

任意の環境変数は`metadata.openclaw.envVars`の下で宣言し、`required: false`を設定します。任意のエントリを`requires.env`に追加しないでください。`requires.env`は、それらなしではSkillを実行できないことを意味するためです。

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: 認証済みリクエストに使用されるTodoist APIトークン。
      - name: TODOIST_PROJECT_ID
        required: false
        description: ユーザーが指定しない場合の任意のデフォルトプロジェクトID。
```

### これが重要な理由

ClawHubのセキュリティ分析は、Skillが宣言している内容と実際に行っていることが一致するかをチェックします。コードが`TODOIST_API_KEY`を参照しているのに、フロントマターで`requires.env`、`primaryEnv`、または`envVars`の下に宣言していない場合、分析はメタデータの不一致としてフラグを立てます。宣言を正確に保つことで、Skillがレビューを通過しやすくなり、ユーザーが何をインストールしているのかを理解しやすくなります。

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

公開で受け付けられるのは「テキストベース」のファイルのみです。

- 拡張子の許可リストは`packages/schema/src/textFiles.ts`（`TEXT_FILE_EXTENSIONS`）にあります。
- スクリプトファイルはアップロード後もスキャンされます。PowerShellの`.ps1`、`.psm1`、`.psd1`ファイルはテキストとして受け付けられます。
- `text/`で始まるコンテンツタイプはテキストとして扱われます。さらに、小さな許可リスト（JSON/YAML/TOML/JS/TS/Markdown/SVG）もあります。

制限（サーバー側）:

- バンドル合計サイズ: 50MB。
- 埋め込みテキストには`SKILL.md`と最大約40個の非`.md`ファイルが含まれます（ベストエフォートの上限）。

## スラッグ

- デフォルトではフォルダー名から派生します。
- パッケージスコープはClawHubの公開者ハンドルと正確に一致する必要があります。公開者ハンドルには小文字、数字、ハイフン、ドット、アンダースコアを使用できます。小文字または数字で始まり、小文字または数字で終わる必要があります。
- パッケージスラッグは小文字かつnpm-safeである必要があります。例: `@example.tools/demo-plugin`または`demo-plugin`。

## バージョン管理 + タグ

- 公開ごとに新しいバージョン（semver）が作成されます。
- タグはバージョンへの文字列ポインターです。`latest`がよく使用されます。

## ライセンス

- ClawHubで公開されるすべてのSkillsは`MIT-0`でライセンスされます。
- 公開されたSkillsは、商用利用を含め、誰でも使用、変更、再配布できます。
- 帰属表示は不要です。
- `SKILL.md`に矛盾するライセンス条件を追加しないでください。ClawHubはSkillごとのライセンス上書きをサポートしていません。

## 有料Skills

- ClawHubは、有料Skills、Skillごとの価格設定、ペイウォール、または収益分配をサポートしていません。
- `SKILL.md`に価格メタデータを追加しないでください。これはSkill形式の一部ではなく、公開されたSkillを有料にするものでもありません。
- Skillが有料のサードパーティサービスと連携する場合は、外部コストと必要なアカウントを、Skillの手順と環境変数宣言（必須変数には`requires.env`、任意変数には`required: false`付きの`envVars`）で明確に文書化してください。
