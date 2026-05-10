---
read_when:
    - Skillsの追加または変更
    - Skills のゲーティング、許可リスト、読み込みルールの変更
    - スキルの優先順位とスナップショットの挙動を理解する
sidebarTitle: Skills
summary: 'Skills: 管理対象とワークスペース、ゲート規則、エージェント許可リスト、設定の結線'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw は、エージェントにツールの使い方を教えるために **[AgentSkills](https://agentskills.io) 互換**のスキルフォルダーを使用します。各スキルは、YAML フロントマターと手順を含む `SKILL.md` を格納したディレクトリです。OpenClaw は同梱スキルと任意のローカル上書きを読み込み、環境、設定、バイナリの存在に基づいて読み込み時にフィルタリングします。

## 場所と優先順位

OpenClaw は次のソースからスキルを読み込みます。**優先順位が高い順**です。

| #   | ソース                | パス                             |
| --- | --------------------- | -------------------------------- |
| 1   | ワークスペーススキル  | `<workspace>/skills`             |
| 2   | プロジェクトエージェントスキル | `<workspace>/.agents/skills`     |
| 3   | 個人エージェントスキル | `~/.agents/skills`               |
| 4   | 管理対象/ローカルスキル | `~/.openclaw/skills`             |
| 5   | 同梱スキル            | インストールに同梱               |
| 6   | 追加スキルフォルダー  | `skills.load.extraDirs` (設定) |

スキル名が競合する場合、最も優先順位の高いソースが優先されます。

Codex CLI のネイティブな `$CODEX_HOME/skills` ディレクトリは、これらの OpenClaw スキルルートには含まれません。Codex ハーネスモードでは、ローカルのアプリサーバー起動はエージェントごとに分離された Codex ホームを使用するため、個人用の Codex CLI スキルは暗黙的には読み込まれません。`openclaw migrate codex --dry-run` を使用してそれらを棚卸しし、`openclaw migrate codex` を使用して、現在の OpenClaw エージェントワークスペースへコピーする前に、対話型のチェックボックスプロンプトでスキルディレクトリを選択します。非対話型の実行では、コピーする正確なスキルごとに `--skill <name>` を繰り返します。

## エージェントごとのスキルと共有スキル

**マルチエージェント**構成では、各エージェントが独自のワークスペースを持ちます。

| スコープ             | パス                                        | 表示対象                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| エージェントごと     | `<workspace>/skills`                        | そのエージェントのみ        |
| プロジェクトエージェント | `<workspace>/.agents/skills`                | そのワークスペースのエージェントのみ |
| 個人エージェント     | `~/.agents/skills`                          | そのマシン上のすべてのエージェント |
| 共有管理対象/ローカル | `~/.openclaw/skills`                        | そのマシン上のすべてのエージェント |
| 共有追加ディレクトリ | `skills.load.extraDirs` (最低優先順位) | そのマシン上のすべてのエージェント |

複数の場所に同じ名前がある場合 → 最も優先順位の高いソースが優先されます。ワークスペースは、プロジェクトエージェントより優先され、個人エージェントより優先され、管理対象/ローカルより優先され、同梱より優先され、追加ディレクトリより優先されます。

## エージェントスキルの許可リスト

スキルの**場所**とスキルの**可視性**は別々の制御です。場所/優先順位は、同名スキルのどのコピーが優先されるかを決定します。エージェントの許可リストは、エージェントが実際に使用できるスキルを決定します。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="許可リストのルール">
    - デフォルトでスキルを制限しない場合は、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - スキルなしにするには、`agents.list[].skills: []` を設定します。
    - 空でない `agents.list[].skills` リストは、そのエージェントの**最終的な**セットです。デフォルトとはマージされません。
    - 有効な許可リストは、プロンプト構築、スキルのスラッシュコマンド検出、サンドボックス同期、スキルスナップショット全体に適用されます。
  </Accordion>
</AccordionGroup>

## Plugin とスキル

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリを列挙することで、独自のスキルを同梱できます (パスは Plugin ルートからの相対パス)。Plugin スキルは、Plugin が有効なときに読み込まれます。これは、ツール説明には長すぎるが、Plugin がインストールされているときには利用可能にすべき、ツール固有の運用ガイドに適した場所です。たとえば、ブラウザー Plugin は、複数ステップのブラウザー制御のために `browser-automation` スキルを同梱しています。

Plugin スキルディレクトリは `skills.load.extraDirs` と同じ低優先順位のパスにマージされるため、同名の同梱、管理対象、エージェント、またはワークスペーススキルがそれらを上書きします。Plugin の設定エントリで `metadata.openclaw.requires.config` を使って、それらをゲートできます。

検出/設定については [Plugins](/ja-JP/tools/plugin) を、これらのスキルが教えるツールサーフェスについては [ツール](/ja-JP/tools) を参照してください。

## スキルワークショップ

任意の実験的な **スキルワークショップ** Plugin は、エージェント作業中に観察された再利用可能な手順から、ワークスペーススキルを作成または更新できます。これはデフォルトで無効になっており、`plugins.entries.skill-workshop` で明示的に有効化する必要があります。

スキルワークショップは `<workspace>/skills` にのみ書き込み、生成されたコンテンツをスキャンし、保留中の承認または自動的な安全書き込みをサポートし、安全でない提案を隔離し、書き込み成功後にスキルスナップショットを更新して、Gateway の再起動なしで新しいスキルを利用できるようにします。

_"次回は GIF の帰属を確認する"_ のような修正や、メディア QA チェックリストのような苦労して得たワークフローに使用します。保留中の承認から始めてください。自動書き込みは、提案をレビューした後、信頼できるワークスペースでのみ使用してください。完全なガイド: [スキルワークショップ Plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub (インストールと同期)

[ClawHub](https://clawhub.ai) は OpenClaw の公開スキルレジストリです。検出/インストール/更新にはネイティブの `openclaw skills` コマンドを使用し、公開/同期ワークフローには別個の `clawhub` CLI を使用します。完全なガイド: [ClawHub](/ja-JP/clawhub)。

| アクション                         | コマンド                               |
| ---------------------------------- | -------------------------------------- |
| スキルをワークスペースにインストール | `openclaw skills install <skill-slug>` |
| インストール済みのすべてのスキルを更新 | `openclaw skills update --all`         |
| 同期 (スキャン + 更新の公開)       | `clawhub sync --all`                   |

ネイティブの `openclaw skills install` は、アクティブなワークスペースの `skills/` ディレクトリにインストールします。別個の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` にインストールします (または、設定された OpenClaw ワークスペースにフォールバックします)。OpenClaw は次のセッションでそれを `<workspace>/skills` として認識します。
設定済みのスキルルートは、`skills/<group>/<skill>/SKILL.md` のような 1 段階のグルーピングにも対応しているため、関連するサードパーティ製スキルを、広範な再帰スキャンなしで共有フォルダー配下に保持できます。

プライベートな非 ClawHub 配信が必要な Gateway クライアントは、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` を使って zip スキルアーカイブをステージングし、その後 `skills.install({ source: "upload", uploadId, slug, force?, sha256? })` でコミット済みアップロードをインストールできます。これは信頼済みクライアント向けの明示的な管理者アップロードパスであり、通常の `openclaw skills install <slug>` や ClawHub インストールフローではありません。デフォルトではオフで、`openclaw.json` で `skills.install.allowUploadedArchives: true` が設定されている場合にのみ機能します。アップロードモードでも、デフォルトのエージェントワークスペースの `skills/<slug>` ディレクトリにインストールされます。アーカイブ内部のフォルダー名は、最終的なインストール先では無視されます。

ClawHub のスキルページは、インストール前に最新のセキュリティスキャン状態を表示し、VirusTotal、ClawScan、静的解析のスキャナー詳細ページも提供します。`openclaw skills install <slug>` は引き続きインストールパスのみです。公開者は ClawHub ダッシュボードまたは `clawhub skill rescan <slug>` を通じて誤検知を回復します。

## セキュリティ

<Warning>
サードパーティ製スキルは**信頼できないコード**として扱ってください。有効化する前に読んでください。信頼できない入力やリスクの高いツールには、サンドボックス化された実行を推奨します。エージェント側の制御については [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

- ワークスペースおよび追加ディレクトリのスキル検出は、解決された realpath が設定済みルート内に留まるスキルルートと `SKILL.md` ファイルのみを受け入れます。
- Gateway のプライベートアーカイブインストールはデフォルトでオフです。明示的に有効化した場合、`SKILL.md` を含むコミット済み zip アップロードが必要で、ClawHub スキルインストールと同じアーカイブ展開、パストラバーサル、シンボリックリンク、強制、ロールバック保護を再利用します。これらは `skills.install.allowUploadedArchives` によってゲートされます。通常の ClawHub インストールでは、この設定は不要です。
- Gateway ベースのスキル依存関係インストール (`skills.install`、オンボーディング、Skills 設定 UI) は、インストーラーメタデータを実行する前に組み込みの危険コードスキャナーを実行します。`critical` の検出は、呼び出し元が危険な上書きを明示的に設定しない限り、デフォルトでブロックされます。不審な検出は引き続き警告のみです。
- `openclaw skills install <slug>` は異なります。これは ClawHub スキルフォルダーをワークスペースにダウンロードし、上記のインストーラーメタデータパスは使用しません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの**ホスト**プロセスにシークレットを注入します (サンドボックスではありません)。プロンプトとログにシークレットを含めないでください。

より広範な脅威モデルとチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

`SKILL.md` には少なくとも次を含める必要があります。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw はレイアウト/意図について AgentSkills 仕様に従います。組み込みエージェントで使用されるパーサーは、フロントマターのキーについて**単一行**のみをサポートします。`metadata` は**単一行の JSON オブジェクト**にしてください。手順内でスキルフォルダーパスを参照するには `{baseDir}` を使用します。

### 任意のフロントマターキー

<ParamField path="homepage" type="string">
  macOS Skills UI で "Website" として表示される URL。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、スキルはユーザーのスラッシュコマンドとして公開されます。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw はスキルの手順をエージェントの通常のプロンプトに含めません。スキルは引き続きインストールされ、`user-invocable` も `true` の場合は、スラッシュコマンドとして明示的に実行できます。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルを迂回し、ツールへ直接ディスパッチします。
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名です。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、生の args 文字列をツールへ転送します (コアでの解析はありません)。ツールは `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` で呼び出されます。
</ParamField>

## ゲート (読み込み時フィルター)

OpenClaw は `metadata` (単一行 JSON) を使用して、読み込み時にスキルをフィルタリングします。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 配下のフィールド:

<ParamField path="always" type="boolean">
  `true` の場合、常にスキルを含めます（他のゲートをスキップします）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI で使用される任意の絵文字。
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI で「ウェブサイト」として表示される任意の URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  任意のプラットフォーム一覧。設定した場合、そのスキルはそれらの OS でのみ対象になります。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  それぞれが `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つが `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.env" type="string[]">
  環境変数が存在するか、設定で指定されている必要があります。
</ParamField>
<ParamField path="requires.config" type="string[]">
  真値でなければならない `openclaw.json` パスの一覧。
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられた環境変数名。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI で使用される任意のインストーラー仕様（brew/node/go/uv/download）。
</ParamField>

`metadata.openclaw` が存在しない場合、そのスキルは常に対象になります（設定で無効化されている場合や、バンドルスキルに対して `skills.allowBundled` によってブロックされている場合を除く）。

<Note>
従来の `metadata.clawdbot` ブロックは、`metadata.openclaw` が存在しない場合には引き続き受け付けられるため、古いインストール済みスキルでも依存関係ゲートとインストーラーのヒントが維持されます。新規および更新されるスキルでは `metadata.openclaw` を使用してください。
</Note>

### サンドボックス化の注意事項

- `requires.bins` はスキル読み込み時に **ホスト** 上でチェックされます。
- エージェントがサンドボックス化されている場合、バイナリは **コンテナ内** にも存在する必要があります。`agents.defaults.sandbox.docker.setupCommand`（またはカスタムイメージ）でインストールしてください。`setupCommand` はコンテナ作成後に 1 回実行されます。パッケージのインストールには、ネットワーク送信、書き込み可能な root FS、サンドボックス内の root ユーザーも必要です。
- 例: `summarize` スキル（`skills/summarize/SKILL.md`）をそこで実行するには、サンドボックスコンテナ内に `summarize` CLI が必要です。

### インストーラー仕様

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="インストーラー選択ルール">
    - 複数のインストーラーが列挙されている場合、Gateway は単一の優先オプションを選択します（利用可能なら brew、それ以外は node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は利用可能なアーティファクトを確認できるように各エントリを一覧表示します。
    - インストーラー仕様には、プラットフォームでオプションをフィルタリングするために `os: ["darwin"|"linux"|"win32"]` を含めることができます。
    - Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います（デフォルト: npm、オプション: npm/pnpm/yarn/bun）。これはスキルのインストールにのみ影響します。Gateway ランタイムは引き続き Node である必要があります。Bun は WhatsApp/Telegram には推奨されません。
    - Gateway によるインストーラー選択は優先度に基づきます。インストール仕様に複数の種類が混在する場合、OpenClaw は `skills.install.preferBrew` が有効で `brew` が存在すれば Homebrew を優先し、次に `uv`、設定された node マネージャー、最後に `go` や `download` などのフォールバックを選びます。
    - すべてのインストール仕様が `download` の場合、OpenClaw は 1 つの優先インストーラーに畳み込まず、すべてのダウンロードオプションを表示します。

  </Accordion>
  <Accordion title="インストーラーごとの詳細">
    - **Go インストール:** `go` がなく `brew` が利用可能な場合、Gateway はまず Homebrew 経由で Go をインストールし、可能であれば `GOBIN` を Homebrew の `bin` に設定します。
    - **ダウンロードインストール:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: アーカイブ検出時は auto）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定の上書き

バンドルスキルと管理対象スキルは、`~/.openclaw/openclaw.json` の `skills.entries` 配下で切り替えたり、環境変数値を指定したりできます。

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` は、スキルがバンドルまたはインストールされていても無効にします。
  バンドルされた `coding-agent` スキルはオプトインです。エージェントに公開する前に
  `skills.entries.coding-agent.enabled: true` を設定し、
  その後、`claude`、`codex`、`opencode`、または `pi` のいずれかがインストール済みで、
  それぞれの CLI で認証済みであることを確認してください。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言するスキル向けの便利な指定。平文または SecretRef をサポートします。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  変数がプロセス内でまだ設定されていない場合にのみ注入されます。
</ParamField>
<ParamField path="config" type="object">
  スキルごとのカスタムフィールド用の任意の入れ物。カスタムキーはここに置く必要があります。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **バンドル** スキル専用の任意の許可リスト。設定した場合、リスト内のバンドルスキルのみが対象になります（管理対象/ワークスペーススキルには影響しません）。
</ParamField>

スキル名にハイフンが含まれる場合は、キーを引用符で囲んでください（JSON5 は引用符付きキーを許可します）。設定キーはデフォルトで **スキル名** と一致します。スキルが `metadata.openclaw.skillKey` を定義している場合は、`skills.entries` 配下でそのキーを使用してください。

<Note>
OpenClaw 内で標準の画像生成/編集を行う場合は、バンドルスキルではなく、
`agents.defaults.imageGenerationModel` とともにコアの `image_generate` ツールを使用してください。
ここでのスキル例は、カスタムまたはサードパーティのワークフロー向けです。
ネイティブな画像分析には、`agents.defaults.imageModel` とともに `image` ツールを使用してください。
`openai/*`、`google/*`、`fal/*`、または別のプロバイダー固有の画像モデルを選ぶ場合は、そのプロバイダーの認証/API キーも追加してください。
</Note>

## 環境の注入

エージェント実行が開始されると、OpenClaw は次を行います。

1. スキルのメタデータを読み取ります。
2. `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` を `process.env` に適用します。
3. **対象** スキルを使ってシステムプロンプトを構築します。
4. 実行終了後に元の環境を復元します。

環境の注入は **エージェント実行にスコープ** されており、グローバルなシェル環境ではありません。

バンドルされた `claude-cli` バックエンドでは、OpenClaw は同じ対象スナップショットを一時的な Claude Code Plugin として実体化し、`--plugin-dir` で渡します。Claude Code はその後、ネイティブなスキルリゾルバーを使用できますが、OpenClaw は引き続き優先順位、エージェントごとの許可リスト、ゲート処理、`skills.entries.*` の環境/API キー注入を管理します。他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は、**セッション開始時** に対象スキルのスナップショットを取得し、
同じセッションの後続ターンではその一覧を再利用します。スキルや設定への変更は、次の新しいセッションで有効になります。

次の 2 つの場合、スキルはセッション中に更新できます。

- スキルウォッチャーが有効になっている。
- 新しい対象リモートノードが現れる。

これは **ホットリロード** と考えてください。更新された一覧は、次のエージェントターンで反映されます。そのセッションで有効なエージェントスキル許可リストが変更された場合、OpenClaw はスナップショットを更新し、表示されるスキルを現在のエージェントと一致させます。

### Skills ウォッチャー

デフォルトでは、OpenClaw はスキルフォルダーを監視し、`SKILL.md` ファイルが変更されるとスキルスナップショットを更新します。`skills.load` 配下で設定します。

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

組み込みのスキルルートにシンボリックリンクが含まれるような、意図的な兄弟リポジトリ構成では `allowSymlinkTargets` を使用してください。たとえば
`~/.agents/skills/manager -> ~/Projects/manager/skills` です。ターゲット一覧は realpath 解決後に照合されるため、狭く保つ必要があります。

### リモート macOS ノード（Linux Gateway）

Gateway が Linux 上で実行されていても、**macOS ノード** が接続され、`system.run` が許可されている場合（Exec 承認セキュリティが `deny` に設定されていない場合）、
OpenClaw は必要なバイナリがそのノード上に存在すれば、macOS 専用スキルを対象として扱うことができます。エージェントは、`host=node` を指定した `exec` ツール経由でこれらのスキルを実行する必要があります。

これは、ノードがコマンド対応状況を報告すること、および `system.which` または `system.run` による bin プローブに依存します。オフラインのノードは **リモート専用スキルを表示可能にしません**。接続済みノードが bin プローブに応答しなくなった場合、OpenClaw はキャッシュされた bin 一致をクリアし、現在実行できないスキルがエージェントに表示されないようにします。

## トークンへの影響

スキルが対象になると、OpenClaw は利用可能なスキルのコンパクトな XML 一覧をシステムプロンプトに注入します（`pi-coding-agent` の `formatSkillsForPrompt` 経由）。コストは決定的です。

- **基本オーバーヘッド**（スキルが 1 つ以上ある場合のみ）: 195 文字。
- **スキルごと:** 97 文字 + XML エスケープ済みの `<name>`、`<description>`、`<location>` 値の長さ。

式（文字数）:

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML エスケープは `& < > " '` をエンティティ（`&amp;`、`&lt;` など）に展開するため、長さが増えます。トークン数はモデルのトークナイザーによって異なります。OpenAI 風の概算では約 4 文字/トークンなので、**97 文字 ≈ 24 トークン** がスキルごとにかかり、これに実際のフィールド長が加わります。

## 管理対象スキルのライフサイクル

OpenClaw は、インストール（npm パッケージまたは OpenClaw.app）に **バンドルスキル** としてベースラインのスキルセットを同梱します。`~/.openclaw/skills` はローカル上書き用に存在します。たとえば、バンドルコピーを変更せずにスキルをピン留めまたはパッチする場合です。ワークスペーススキルはユーザー所有であり、名前の競合時には両方を上書きします。

## さらにスキルを探していますか？

[https://clawhub.ai](https://clawhub.ai) を参照してください。完全な設定スキーマ: [Skills 設定](/ja-JP/tools/skills-config)。

## 関連

- [ClawHub](/ja-JP/clawhub) - 公開スキルレジストリ
- [スキルの作成](/ja-JP/tools/creating-skills) - カスタムスキルの構築
- [Plugin](/ja-JP/tools/plugin) - Plugin システムの概要
- [Skill Workshop plugin](/ja-JP/plugins/skill-workshop) - エージェント作業からスキルを生成
- [Skills 設定](/ja-JP/tools/skills-config) - スキル設定リファレンス
- [スラッシュコマンド](/ja-JP/tools/slash-commands) - 利用可能なすべてのスラッシュコマンド
