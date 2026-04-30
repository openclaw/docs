---
read_when:
    - Skillsの追加または変更
    - スキルのゲーティング、許可リスト、読み込みルールの変更
    - スキルの優先順位とスナップショット動作を理解する
sidebarTitle: Skills
summary: 'Skills: 管理対象とワークスペース、ゲートルール、エージェント許可リスト、設定の接続'
title: Skills
x-i18n:
    generated_at: "2026-04-30T05:39:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f744f5e961f872cae02aa0ed77e0bbba35e4715f5762ac45ce190b74b2fd8c5e
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw は、エージェントにツールの使い方を教えるために **[AgentSkills](https://agentskills.io) 互換**のスキル
フォルダーを使用します。各スキルは、YAML frontmatter と手順を含む `SKILL.md` を
持つディレクトリです。OpenClaw は同梱スキルに加え、任意のローカル上書きを読み込み、
環境、設定、バイナリの存在に基づいて読み込み時にフィルターします。

## 場所と優先順位

OpenClaw は次のソースからスキルを読み込みます。**優先順位が高い順**です。

| #   | ソース                | パス                             |
| --- | --------------------- | -------------------------------- |
| 1   | ワークスペーススキル      | `<workspace>/skills`             |
| 2   | プロジェクトエージェントスキル  | `<workspace>/.agents/skills`     |
| 3   | 個人エージェントスキル | `~/.agents/skills`               |
| 4   | 管理/local スキル  | `~/.openclaw/skills`             |
| 5   | 同梱スキル        | インストールに同梱         |
| 6   | 追加スキルフォルダー   | `skills.load.extraDirs` (設定) |

スキル名が競合する場合、最も優先順位の高いソースが勝ちます。

## エージェント別スキルと共有スキル

**マルチエージェント**構成では、各エージェントに独自のワークスペースがあります。

| スコープ                | パス                                        | 表示対象                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| エージェント別            | `<workspace>/skills`                        | そのエージェントのみ             |
| プロジェクトエージェント        | `<workspace>/.agents/skills`                | そのワークスペースのエージェントのみ |
| 個人エージェント       | `~/.agents/skills`                          | そのマシン上のすべてのエージェント  |
| 共有管理/local | `~/.openclaw/skills`                        | そのマシン上のすべてのエージェント  |
| 共有追加ディレクトリ    | `skills.load.extraDirs` (最低優先順位) | そのマシン上のすべてのエージェント  |

複数の場所に同じ名前がある場合 → 最も優先順位の高いソースが勝ちます。ワークスペースは
プロジェクトエージェントに勝ち、プロジェクトエージェントは個人エージェントに勝ち、個人エージェントは管理/local に勝ち、管理/local は同梱に勝ち、
同梱は追加ディレクトリに勝ちます。

## エージェントスキルの許可リスト

スキルの**場所**とスキルの**可視性**は別々の制御です。
場所/優先順位は、同じ名前のスキルのどのコピーが勝つかを決めます。エージェントの
許可リストは、エージェントが実際に使えるスキルを決めます。

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
    - デフォルトでスキルを無制限にするには、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - スキルなしにするには、`agents.list[].skills: []` を設定します。
    - 空ではない `agents.list[].skills` リストは、そのエージェントの**最終的な**セットです。デフォルトとはマージされません。
    - 有効な許可リストは、プロンプト構築、スキルのスラッシュコマンド検出、サンドボックス同期、スキルスナップショット全体に適用されます。

  </Accordion>
</AccordionGroup>

## Plugin とスキル

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリを列挙することで
独自のスキルを同梱できます (パスは Plugin ルートからの相対パス)。Plugin スキルは、
その Plugin が有効なときに読み込まれます。これは、ツール説明に入れるには長すぎるが、
Plugin がインストールされているときは常に利用可能にすべき、ツール固有の
運用ガイドに適した場所です。たとえば、ブラウザー
Plugin は、複数ステップのブラウザー制御向けに `browser-automation` スキルを同梱しています。

Plugin スキルディレクトリは、`skills.load.extraDirs` と同じ低優先順位のパスに
マージされるため、同じ名前の同梱、管理、エージェント、または
ワークスペースのスキルがそれらを上書きします。Plugin の設定エントリで
`metadata.openclaw.requires.config` を使ってゲートできます。

検出/設定については [Plugin](/ja-JP/tools/plugin) を、これらのスキルが教える
ツールサーフェスについては [ツール](/ja-JP/tools) を参照してください。

## Skill Workshop

任意の実験的な **Skill Workshop** Plugin は、エージェント作業中に観察された再利用可能な手順から
ワークスペーススキルを作成または更新できます。
デフォルトでは無効で、`plugins.entries.skill-workshop` を通じて明示的に有効にする必要があります。

Skill Workshop は `<workspace>/skills` にのみ書き込み、生成された
コンテンツをスキャンし、保留中の承認または自動の安全な書き込みをサポートし、安全でない
提案を隔離し、書き込み成功後にスキルスナップショットを更新するため、
Gateway の再起動なしで新しいスキルを利用できるようになります。

_"次回は GIF の帰属を確認する"_ のような修正や、
メディア QA チェックリストのように苦労して得たワークフローに使用します。保留中の
承認から始め、提案を確認した後、信頼できるワークスペースでのみ自動書き込みを使用してください。完全なガイド: [Skill Workshop Plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub (インストールと同期)

[ClawHub](https://clawhub.ai) は OpenClaw の公開スキルレジストリです。
検出/インストール/更新にはネイティブの `openclaw skills` コマンドを使うか、
公開/同期ワークフローには別の `clawhub` CLI を使います。完全なガイド:
[ClawHub](/ja-JP/tools/clawhub)。

| 操作                             | コマンド                                |
| ---------------------------------- | -------------------------------------- |
| スキルをワークスペースにインストール | `openclaw skills install <skill-slug>` |
| インストール済みスキルをすべて更新        | `openclaw skills update --all`         |
| 同期 (スキャン + 更新の公開)      | `clawhub sync --all`                   |

ネイティブの `openclaw skills install` は、アクティブなワークスペースの
`skills/` ディレクトリにインストールします。別の `clawhub` CLI も、
現在の作業ディレクトリ配下の `./skills` にインストールします (または、
設定済みの OpenClaw ワークスペースにフォールバックします)。OpenClaw は次のセッションで
それを `<workspace>/skills` として検出します。

ClawHub のスキルページは、インストール前に最新のセキュリティスキャン状態を表示し、
VirusTotal、ClawScan、静的解析のスキャナー詳細ページも提供します。
`openclaw skills install <slug>` はインストール経路でしかありません。公開者は
ClawHub ダッシュボードまたは `clawhub skill rescan <slug>` を通じて
誤検知から復旧します。

## セキュリティ

<Warning>
サードパーティのスキルは**信頼できないコード**として扱ってください。有効にする前に読んでください。
信頼できない入力やリスクの高いツールでは、サンドボックス化された実行を推奨します。
エージェント側の制御については [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

- ワークスペースおよび追加ディレクトリのスキル検出では、解決後の realpath が設定済みルート内にとどまるスキルルートと `SKILL.md` ファイルだけを受け入れます。
- Gateway に支えられたスキル依存関係のインストール (`skills.install`、オンボーディング、Skills 設定 UI) は、インストーラーメタデータを実行する前に組み込みの危険コードスキャナーを実行します。呼び出し元が危険な上書きを明示的に設定しない限り、`critical` の検出はデフォルトでブロックされます。疑わしい検出は引き続き警告のみです。
- `openclaw skills install <slug>` は別物です。ClawHub のスキルフォルダーをワークスペースにダウンロードし、上記のインストーラーメタデータ経路は使用しません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの**ホスト**プロセスにシークレットを注入します (サンドボックスではありません)。シークレットをプロンプトやログに含めないでください。

より広い脅威モデルとチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

`SKILL.md` には少なくとも次を含める必要があります。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw はレイアウト/意図について AgentSkills 仕様に従います。組み込みエージェントで使われるパーサーは
**単一行**の frontmatter キーのみをサポートします。
`metadata` は**単一行の JSON オブジェクト**にしてください。手順内でスキルフォルダーのパスを参照するには
`{baseDir}` を使用します。

### 任意の frontmatter キー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Web サイト」として表示される URL です。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、スキルはユーザー用スラッシュコマンドとして公開されます。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、スキルはモデルプロンプトから除外されます (ユーザー呼び出しでは引き続き利用可能)。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルを迂回し、ツールへ直接ディスパッチします。
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されているときに呼び出すツール名です。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、生の args 文字列をツールへ転送します (コアによる解析なし)。ツールは `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` で呼び出されます。
</ParamField>

## ゲーティング (読み込み時フィルター)

OpenClaw は `metadata` (単一行 JSON) を使って読み込み時にスキルをフィルターします。

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
  `true` の場合、常にスキルを含めます (他のゲートをスキップ)。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI で使用される任意の絵文字です。
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI で「Web サイト」として表示される任意の URL です。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  任意のプラットフォーム一覧です。設定されている場合、その OS 上でのみスキルが対象になります。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  それぞれが `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つが `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.env" type="string[]">
  環境変数が存在するか、設定で提供されている必要があります。
</ParamField>
<ParamField path="requires.config" type="string[]">
  truthy である必要がある `openclaw.json` パスの一覧です。
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられた環境変数名です。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI で使用される任意のインストーラー仕様です (brew/node/go/uv/download)。
</ParamField>

`metadata.openclaw` が存在しない場合、スキルは常に対象になります (設定で
無効化されている場合、または同梱スキルに対して `skills.allowBundled` によってブロックされている場合を除く)。

<Note>
レガシーの `metadata.clawdbot` ブロックは、`metadata.openclaw` が存在しない場合も引き続き受け入れられるため、
古いインストール済みスキルは依存関係ゲートとインストーラーヒントを維持できます。新規および更新されたスキルでは
`metadata.openclaw` を使用してください。
</Note>

### サンドボックス化に関するメモ

- `requires.bins` はスキル読み込み時に**ホスト**上でチェックされます。
- エージェントがサンドボックス化されている場合、バイナリは**コンテナ内**にも存在する必要があります。`agents.defaults.sandbox.docker.setupCommand` (またはカスタムイメージ) でインストールしてください。`setupCommand` はコンテナ作成後に一度実行されます。パッケージインストールには、ネットワーク egress、書き込み可能なルート FS、サンドボックス内の root ユーザーも必要です。
- 例: `summarize` スキル (`skills/summarize/SKILL.md`) をサンドボックスコンテナ内で実行するには、その中に `summarize` CLI が必要です。

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
    - 複数のインストーラーが listed されている場合、Gateway は単一の優先オプションを選びます（利用可能なら brew、それ以外は node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は利用可能なアーティファクトを確認できるように各エントリを listed します。
    - インストーラー仕様には `os: ["darwin"|"linux"|"win32"]` を含めて、プラットフォームごとにオプションをフィルターできます。
    - Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います（デフォルト: npm、オプション: npm/pnpm/yarn/bun）。これは skill インストールにのみ影響します。Gateway ランタイムは引き続き Node であるべきです。Bun は WhatsApp/Telegram には推奨されません。
    - Gateway-backed インストーラー選択は優先設定に基づきます。インストール仕様に複数の種類が混在する場合、`skills.install.preferBrew` が有効で `brew` が存在すれば OpenClaw は Homebrew を優先し、次に `uv`、次に設定済みの node マネージャー、次に `go` や `download` などの他のフォールバックを優先します。
    - すべてのインストール仕様が `download` の場合、OpenClaw は 1 つの優先インストーラーにまとめず、すべてのダウンロードオプションを表示します。

  </Accordion>
  <Accordion title="インストーラーごとの詳細">
    - **Go インストール:** `go` がなく `brew` が利用可能な場合、Gateway はまず Homebrew 経由で Go をインストールし、可能な場合は `GOBIN` を Homebrew の `bin` に設定します。
    - **ダウンロードインストール:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: アーカイブ検出時は自動）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定の上書き

バンドル済みおよび管理対象の skills は、`~/.openclaw/openclaw.json` の
`skills.entries` で切り替えたり、env 値を指定したりできます。

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
  `false` は、バンドル済みまたはインストール済みであっても skill を無効にします。
  バンドル済みの `coding-agent` skill はオプトインです。エージェントに公開する前に
  `skills.entries.coding-agent.enabled: true` を設定し、
  そのうえで `claude`、`codex`、`opencode`、または `pi` のいずれかがインストールされ、
  それ自体の CLI で認証済みであることを確認してください。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する skills のための便利な設定です。平文または SecretRef をサポートします。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  変数がプロセスにまだ設定されていない場合にのみ注入されます。
</ParamField>
<ParamField path="config" type="object">
  skill ごとのカスタムフィールド用の任意の入れ物です。カスタムキーはここに置く必要があります。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **バンドル済み** skills のみを対象とする任意の許可リストです。設定した場合、リスト内のバンドル済み skills だけが対象になります（管理対象/workspace skills には影響しません）。
</ParamField>

skill 名にハイフンが含まれる場合は、キーを引用符で囲みます（JSON5 では引用符付きキーを使用できます）。
設定キーはデフォルトで **skill 名** と一致します。skill が `metadata.openclaw.skillKey`
を定義している場合は、そのキーを `skills.entries` の下で使用します。

<Note>
OpenClaw 内で標準の画像生成/編集を行う場合は、バンドル済み skill ではなく、
`agents.defaults.imageGenerationModel` とともにコアの `image_generate` ツールを使用してください。
ここでの skill の例は、カスタムまたはサードパーティのワークフロー向けです。
ネイティブの画像分析には、`agents.defaults.imageModel` とともに `image` ツールを使用してください。
`openai/*`、`google/*`、`fal/*`、または別のプロバイダー固有の画像モデルを選ぶ場合は、
そのプロバイダーの認証/API キーも追加してください。
</Note>

## 環境注入

エージェント実行が開始されると、OpenClaw は次を行います。

1. skill メタデータを読み取ります。
2. `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` を `process.env` に適用します。
3. **対象** skills を含めてシステムプロンプトを構築します。
4. 実行終了後に元の環境を復元します。

環境注入は **エージェント実行にスコープされる** ものであり、グローバルなシェル環境ではありません。

バンドル済みの `claude-cli` バックエンドでは、OpenClaw は同じ対象スナップショットを一時的な Claude Code Plugin として実体化し、
`--plugin-dir` で渡します。Claude Code はその後、ネイティブの skill リゾルバーを使用できますが、
優先順位、エージェントごとの許可リスト、ゲーティング、および `skills.entries.*` の env/API キー注入は引き続き OpenClaw が所有します。
他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は、セッション開始時に対象 skills のスナップショットを取得し、
同じセッション内の後続ターンでそのリストを再利用します。skills または設定への変更は、次の新しいセッションで有効になります。

Skills は、次の 2 つの場合にセッション途中で更新できます。

- skills watcher が有効である。
- 新しい対象のリモートノードが現れる。

これは **ホットリロード** と考えてください。更新されたリストは、次のエージェントターンで反映されます。
そのセッションで有効なエージェントの skill 許可リストが変わる場合、OpenClaw はスナップショットを更新し、
表示される skills が現在のエージェントと揃うようにします。

### Skills watcher

デフォルトでは、OpenClaw は skill フォルダーを監視し、`SKILL.md` ファイルが変更されると skills スナップショットを更新します。
`skills.load` の下で設定します。

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### リモート macOS ノード（Linux Gateway）

Gateway が Linux で実行されているが、**macOS ノード** が `system.run` を許可して接続されている場合（Exec approvals セキュリティが `deny` に設定されていない場合）、
必要なバイナリがそのノード上に存在すれば、OpenClaw は macOS 専用 skills を対象として扱うことができます。
エージェントは `host=node` を指定した `exec` ツール経由でそれらの skills を実行する必要があります。

これは、ノードがコマンドサポートを報告すること、および `system.which` または `system.run` による bin probe に依存します。
オフラインのノードは、リモート専用 skills を表示させません。接続済みノードが bin probe に応答しなくなった場合、
OpenClaw はキャッシュされた bin マッチをクリアするため、現在その場所で実行できない skills はエージェントに見えなくなります。

## トークンへの影響

skills が対象になると、OpenClaw は利用可能な skills のコンパクトな XML リストをシステムプロンプトに注入します
（`pi-coding-agent` の `formatSkillsForPrompt` 経由）。コストは決定的です。

- **基本オーバーヘッド**（skill が 1 つ以上ある場合のみ）: 195 文字。
- **skill ごと:** 97 文字 + XML エスケープ済みの `<name>`、`<description>`、`<location>` 値の長さ。

式（文字数）:

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML エスケープでは `& < > " '` がエンティティ（`&amp;`、`&lt;` など）に展開され、
長さが増えます。トークン数はモデルのトークナイザーによって変わります。OpenAI 風の概算では約 4 文字/トークンなので、
**97 文字 ≈ 24 トークン** が skill ごとにかかり、さらに実際のフィールド長が加わります。

## 管理対象 skills のライフサイクル

OpenClaw は、インストール（npm パッケージまたは OpenClaw.app）に **バンドル済み skills** として baseline セットの skills を同梱します。
`~/.openclaw/skills` はローカル上書き用です。たとえば、バンドル済みコピーを変更せずに skill を固定またはパッチできます。
Workspace skills はユーザー所有であり、名前の競合時には両方を上書きします。

## さらに skills を探す場合

[https://clawhub.ai](https://clawhub.ai) を参照してください。完全な設定スキーマ:
[Skills config](/ja-JP/tools/skills-config)。

## 関連

- [ClawHub](/ja-JP/tools/clawhub) — 公開 skills レジストリ
- [skills の作成](/ja-JP/tools/creating-skills) — カスタム skills の構築
- [Plugins](/ja-JP/tools/plugin) — plugin システムの概要
- [Skill Workshop plugin](/ja-JP/plugins/skill-workshop) — エージェント作業から skills を生成
- [Skills config](/ja-JP/tools/skills-config) — skill 設定リファレンス
- [スラッシュコマンド](/ja-JP/tools/slash-commands) — 利用可能なすべてのスラッシュコマンド
