---
read_when:
    - Skills の追加または変更
    - Skills のゲーティング、許可リスト、または読み込みルールの変更
    - Skillsの優先順位とスナップショットの動作を理解する
sidebarTitle: Skills
summary: 'Skills: managed と workspace、ゲート規則、エージェント許可リスト、設定の配線'
title: Skills
x-i18n:
    generated_at: "2026-05-06T05:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw は、ツールの使い方をエージェントに教えるために **[AgentSkills](https://agentskills.io)互換** のスキルフォルダーを使用します。各スキルは、YAML フロントマターと手順を含む `SKILL.md` を持つディレクトリです。OpenClaw は、バンドルされたスキルに加えて任意のローカルオーバーライドを読み込み、環境、設定、バイナリの存在に基づいて読み込み時にフィルタリングします。

## 場所と優先順位

OpenClaw は、以下のソースからスキルを読み込みます。**優先順位が高い順** です。

| #   | ソース                | パス                             |
| --- | --------------------- | -------------------------------- |
| 1   | ワークスペーススキル      | `<workspace>/skills`             |
| 2   | プロジェクトエージェントスキル  | `<workspace>/.agents/skills`     |
| 3   | 個人エージェントスキル | `~/.agents/skills`               |
| 4   | 管理対象/ローカルスキル  | `~/.openclaw/skills`             |
| 5   | バンドルスキル        | インストールに同梱         |
| 6   | 追加スキルフォルダー   | `skills.load.extraDirs` (設定) |

スキル名が競合する場合は、最も高いソースが優先されます。

Codex CLI ネイティブの `$CODEX_HOME/skills` ディレクトリは、これらの OpenClaw スキルルートには含まれません。Codex ハーネスモードでは、ローカルのアプリサーバー起動はエージェントごとに分離された Codex ホームを使用するため、個人用 Codex CLI スキルは暗黙的には読み込まれません。これらを棚卸しするには `openclaw migrate codex --dry-run` を使用し、現在の OpenClaw エージェントワークスペースにコピーするスキルディレクトリを対話型チェックボックスプロンプトで選ぶには `openclaw migrate codex` を使用します。非対話型実行では、コピーする正確なスキルごとに `--skill <name>` を繰り返します。

## エージェントごとのスキルと共有スキル

**マルチエージェント** セットアップでは、各エージェントに独自のワークスペースがあります。

| スコープ                | パス                                        | 表示対象                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| エージェントごと            | `<workspace>/skills`                        | そのエージェントのみ             |
| プロジェクトエージェント        | `<workspace>/.agents/skills`                | そのワークスペースのエージェントのみ |
| 個人エージェント       | `~/.agents/skills`                          | そのマシン上のすべてのエージェント  |
| 共有管理対象/ローカル | `~/.openclaw/skills`                        | そのマシン上のすべてのエージェント  |
| 共有追加ディレクトリ    | `skills.load.extraDirs` (最も低い優先順位) | そのマシン上のすべてのエージェント  |

複数の場所に同じ名前がある場合 → 最も高いソースが優先されます。ワークスペースは、プロジェクトエージェント、個人エージェント、管理対象/ローカル、バンドル、追加ディレクトリより優先されます。

## エージェントスキル許可リスト

スキルの**場所**とスキルの**可視性**は別々の制御です。場所/優先順位は、同じ名前のスキルのどのコピーが優先されるかを決めます。エージェント許可リストは、エージェントが実際に使用できるスキルを決めます。

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
  <Accordion title="許可リストルール">
    - デフォルトでスキルを制限しない場合は、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - スキルなしにするには、`agents.list[].skills: []` を設定します。
    - 空ではない `agents.list[].skills` リストは、そのエージェントの**最終的な**セットです。デフォルトとはマージされません。
    - 有効な許可リストは、プロンプト構築、スキルスラッシュコマンドの検出、サンドボックス同期、スキルスナップショット全体に適用されます。
  </Accordion>
</AccordionGroup>

## Plugin とスキル

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリを列挙することで、独自のスキルを同梱できます (パスは Plugin ルートからの相対パス)。Plugin スキルは、Plugin が有効な場合に読み込まれます。これは、ツール説明に入れるには長すぎるものの、Plugin がインストールされているときには利用可能であるべきツール固有の操作ガイドに適した場所です。たとえば、ブラウザー Plugin は、複数ステップのブラウザー制御用に `browser-automation` スキルを同梱しています。

Plugin スキルディレクトリは、`skills.load.extraDirs` と同じ低優先順位のパスにマージされます。そのため、同じ名前のバンドル、管理対象、エージェント、またはワークスペーススキルがそれらを上書きします。Plugin の設定エントリにある `metadata.openclaw.requires.config` によってゲートできます。

検出/設定については [Plugin](/ja-JP/tools/plugin) を、これらのスキルが教えるツールサーフェスについては [ツール](/ja-JP/tools) を参照してください。

## Skill Workshop

任意の実験的な **Skill Workshop** Plugin は、エージェント作業中に観察された再利用可能な手順からワークスペーススキルを作成または更新できます。デフォルトでは無効で、`plugins.entries.skill-workshop` によって明示的に有効化する必要があります。

Skill Workshop は `<workspace>/skills` にのみ書き込み、生成されたコンテンツをスキャンし、保留中の承認または自動の安全な書き込みをサポートし、安全でない提案を隔離し、書き込み成功後にスキルスナップショットを更新するため、Gateway を再起動せずに新しいスキルを利用できます。

_"次回は、GIF の帰属を確認する"_ のような修正や、メディア QA チェックリストのように苦労して得たワークフローに使用します。保留中の承認から始めてください。自動書き込みは、提案を確認した後、信頼できるワークスペースでのみ使用します。完全なガイド: [Skill Workshop Plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub (インストールと同期)

[ClawHub](https://clawhub.ai) は OpenClaw の公開スキルレジストリです。検出/インストール/更新にはネイティブの `openclaw skills` コマンドを使用し、公開/同期ワークフローには別の `clawhub` CLI を使用します。完全なガイド: [ClawHub](/ja-JP/tools/clawhub)。

| アクション                             | コマンド                                |
| ---------------------------------- | -------------------------------------- |
| ワークスペースにスキルをインストール | `openclaw skills install <skill-slug>` |
| インストール済みのすべてのスキルを更新        | `openclaw skills update --all`         |
| 同期 (スキャン + 更新の公開)      | `clawhub sync --all`                   |

ネイティブの `openclaw skills install` は、アクティブなワークスペースの `skills/` ディレクトリにインストールします。別の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` にインストールします (または設定済みの OpenClaw ワークスペースにフォールバックします)。OpenClaw は次のセッションでそれを `<workspace>/skills` として取り込みます。設定済みのスキルルートは、`skills/<group>/<skill>/SKILL.md` のような 1 階層のグループ化にも対応しているため、関連するサードパーティスキルを、広範な再帰スキャンなしで共有フォルダーの下に保持できます。

ClawHub のスキルページでは、インストール前に最新のセキュリティスキャン状態が表示され、VirusTotal、ClawScan、静的解析のスキャナー詳細ページも表示されます。`openclaw skills install <slug>` はインストールパスのみにとどまります。公開者は、ClawHub ダッシュボードまたは `clawhub skill rescan <slug>` を通じて誤検知を回復します。

## セキュリティ

<Warning>
サードパーティスキルは**信頼できないコード**として扱ってください。有効化する前に読んでください。信頼できない入力やリスクの高いツールには、サンドボックス化された実行を推奨します。エージェント側の制御については [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

- ワークスペースと追加ディレクトリのスキル検出では、解決済みの realpath が設定済みルート内に留まるスキルルートと `SKILL.md` ファイルのみを受け付けます。
- Gateway によるスキル依存関係のインストール (`skills.install`、オンボーディング、Skills 設定 UI) は、インストーラーメタデータを実行する前に組み込みの危険コードスキャナーを実行します。呼び出し元が危険なオーバーライドを明示的に設定しない限り、`critical` の検出結果はデフォルトでブロックされます。疑わしい検出結果は引き続き警告のみです。
- `openclaw skills install <slug>` は異なります。ClawHub スキルフォルダーをワークスペースにダウンロードし、上記のインストーラーメタデータパスは使用しません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの**ホスト**プロセスにシークレットを注入します (サンドボックスではありません)。プロンプトとログにシークレットを入れないでください。

より広い脅威モデルとチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

`SKILL.md` には少なくとも以下を含める必要があります。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw は、レイアウト/意図について AgentSkills 仕様に従います。組み込みエージェントで使用されるパーサーは、**単一行** のフロントマターキーのみをサポートします。`metadata` は **単一行の JSON オブジェクト** にする必要があります。手順内でスキルフォルダーのパスを参照するには `{baseDir}` を使用します。

### 任意のフロントマターキー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される URL です。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、スキルはユーザーのスラッシュコマンドとして公開されます。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw はそのスキルの手順をエージェントの通常のプロンプトに含めません。スキルは引き続きインストールされ、`user-invocable` も `true` の場合はスラッシュコマンドとして明示的に実行できます。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルをバイパスし、ツールへ直接ディスパッチします。
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名です。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、生の引数文字列をツールに転送します (コア解析なし)。ツールは `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` で呼び出されます。
</ParamField>

## ゲート (読み込み時フィルター)

OpenClaw は、`metadata` (単一行 JSON) を使用して読み込み時にスキルをフィルタリングします。

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
  `true` の場合、常にスキルを含めます (他のゲートをスキップします)。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI で使用される任意の絵文字です。
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される任意の URL です。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  任意のプラットフォームリストです。設定すると、そのスキルはそれらの OS でのみ対象になります。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  各項目が `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つが `PATH` 上に存在する必要があります。
</ParamField>
<ParamField path="requires.env" type="string[]">
  環境変数が存在するか、設定で提供されている必要があります。
</ParamField>
<ParamField path="requires.config" type="string[]">
  truthy である必要がある `openclaw.json` パスのリストです。
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられた環境変数名です。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI で使用される任意のインストーラー仕様です (brew/node/go/uv/download)。
</ParamField>

`metadata.openclaw` が存在しない場合、そのスキルは常に対象になります (設定で無効化されている場合、またはバンドルスキルに対して `skills.allowBundled` によってブロックされている場合を除く)。

<Note>
`metadata.openclaw` が存在しない場合、従来の `metadata.clawdbot` ブロックも引き続き受け付けられるため、古いインストール済みスキルは依存関係ゲートとインストーラーヒントを保持します。新規および更新済みのスキルでは `metadata.openclaw` を使用してください。
</Note>

### サンドボックス化の注意事項

- `requires.bins` はスキル読み込み時に**ホスト**上で確認されます。
- エージェントがサンドボックス化されている場合、バイナリは**コンテナ内**にも存在する必要があります。`agents.defaults.sandbox.docker.setupCommand` (またはカスタムイメージ) 経由でインストールしてください。`setupCommand` はコンテナ作成後に 1 回実行されます。パッケージのインストールには、ネットワーク送信、書き込み可能なルート FS、サンドボックス内の root ユーザーも必要です。
- 例: `summarize` スキル (`skills/summarize/SKILL.md`) は、サンドボックスコンテナ内で実行するには、その中に `summarize` CLI が必要です。

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
    - インストーラー仕様には `os: ["darwin"|"linux"|"win32"]` を含めて、プラットフォーム別にオプションを絞り込めます。
    - Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います（デフォルト: npm、オプション: npm/pnpm/yarn/bun）。これは skill インストールにのみ影響します。Gateway ランタイムは引き続き Node にする必要があります。Bun は WhatsApp/Telegram には推奨されません。
    - Gateway backed のインストーラー選択は設定された優先順位に基づきます。インストール仕様に複数の種類が混在している場合、OpenClaw は `skills.install.preferBrew` が有効で `brew` が存在すれば Homebrew を優先し、次に `uv`、設定済みの node manager、さらに `go` や `download` などのフォールバックを選びます。
    - すべてのインストール仕様が `download` の場合、OpenClaw は 1 つの優先インストーラーにまとめず、すべてのダウンロードオプションを表示します。

  </Accordion>
  <Accordion title="インストーラー別の詳細">
    - **Go インストール:** `go` がなく、`brew` が利用可能な場合、Gateway はまず Homebrew 経由で Go をインストールし、可能なら `GOBIN` を Homebrew の `bin` に設定します。
    - **ダウンロードインストール:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: アーカイブ検出時に自動）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定オーバーライド

同梱および管理対象の skills は、`~/.openclaw/openclaw.json` の
`skills.entries` 配下で切り替えたり env 値を指定したりできます。

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
  `false` は、skill が同梱またはインストール済みでも無効化します。
  同梱の `coding-agent` skill はオプトインです。エージェントに公開する前に
  `skills.entries.coding-agent.enabled: true` を設定し、
  そのうえで `claude`、`codex`、`opencode`、`pi` のいずれかがインストール済みで、
  それぞれの CLI で認証済みであることを確認してください。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する skills 向けの便利設定です。プレーンテキストまたは SecretRef をサポートします。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  変数がプロセス内でまだ設定されていない場合にのみ注入されます。
</ParamField>
<ParamField path="config" type="object">
  skill ごとのカスタムフィールド用の任意の入れ物です。カスタムキーはここに置く必要があります。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **同梱** skills のみを対象にした任意の許可リストです。設定されている場合、リスト内の同梱 skills だけが対象になります（管理対象/workspace skills には影響しません）。
</ParamField>

skill 名にハイフンが含まれる場合は、キーを引用符で囲みます（JSON5 は引用符付き
キーを許可します）。設定キーはデフォルトで **skill 名** と一致します。skill が
`metadata.openclaw.skillKey` を定義している場合は、そのキーを `skills.entries` 配下で使います。

<Note>
OpenClaw 内で標準の画像生成/編集を行う場合は、同梱 skill ではなく、コアの
`image_generate` ツールを `agents.defaults.imageGenerationModel` とともに使用してください。
ここにある skill 例は、カスタムまたはサードパーティのワークフロー向けです。
ネイティブの画像分析には、`agents.defaults.imageModel` とともに `image` ツールを使用します。
`openai/*`、`google/*`、`fal/*`、または別のプロバイダー固有の画像モデルを選ぶ場合は、
そのプロバイダーの認証/API キーも追加してください。
</Note>

## 環境注入

エージェント実行が開始されると、OpenClaw は次を行います。

1. skill メタデータを読み取ります。
2. `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` を `process.env` に適用します。
3. **対象** skills を含めてシステムプロンプトを構築します。
4. 実行終了後、元の環境を復元します。

環境注入は **エージェント実行にスコープされる** ものであり、グローバルなシェル
環境ではありません。

同梱の `claude-cli` バックエンドでは、OpenClaw は同じ対象スナップショットを
一時的な Claude Code plugin として実体化し、`--plugin-dir` で渡します。
Claude Code はそのネイティブな skill resolver を使用でき、その間も OpenClaw が優先順位、
エージェントごとの許可リスト、ゲート、`skills.entries.*` の env/API キー注入を管理します。
他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は **セッション開始時** に対象 skills のスナップショットを作成し、
同じセッション内の後続ターンではそのリストを再利用します。skills や設定の変更は、
次の新しいセッションで有効になります。

skills は次の 2 つの場合にセッション途中で更新できます。

- skills watcher が有効である。
- 新しい対象 remote node が表示される。

これは **hot reload** と考えてください。更新されたリストは、次のエージェントターンで
取り込まれます。そのセッションで有効なエージェント skill 許可リストが変わった場合、
OpenClaw はスナップショットを更新し、表示される skills が現在のエージェントと揃うようにします。

### Skills watcher

デフォルトでは、OpenClaw は skill フォルダーを監視し、`SKILL.md` ファイルが変更されると
skills スナップショットを更新します。`skills.load` 配下で設定します。

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

### Remote macOS nodes（Linux gateway）

Gateway が Linux 上で動作しているが、**macOS node** が `system.run` 許可付きで接続されている場合
（Exec approvals security が `deny` に設定されていない場合）、OpenClaw は必要なバイナリが
その node 上に存在するとき、macOS 専用 skills を対象として扱えます。エージェントはそれらの
skills を `exec` ツールで `host=node` を指定して実行する必要があります。

これは、node が自身のコマンドサポートを報告すること、および `system.which` または
`system.run` による bin probe に依存します。オフラインの nodes は **remote-only** skills を
表示しません。接続済み node が bin probe に応答しなくなった場合、OpenClaw はキャッシュ済みの
bin 一致をクリアし、現在そこで実行できない skills がエージェントに表示されないようにします。

## トークンへの影響

skills が対象になると、OpenClaw は利用可能な skills のコンパクトな XML リストを
システムプロンプトに注入します（`pi-coding-agent` の `formatSkillsForPrompt` 経由）。
コストは決定的です。

- **基本オーバーヘッド**（skill が 1 つ以上ある場合のみ）: 195 文字。
- **skill ごと:** 97 文字 + XML エスケープ済みの `<name>`、`<description>`、`<location>` 値の長さ。

式（文字数）:

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML エスケープでは `& < > " '` がエンティティ（`&amp;`、`&lt;` など）に展開されるため、
長さが増えます。トークン数はモデルの tokenizer によって異なります。OpenAI 風の概算では
約 4 文字/token なので、**97 文字 ≈ 24 tokens**/skill に、実際のフィールド長が加わります。

## 管理対象 skills のライフサイクル

OpenClaw は、インストール（npm package または OpenClaw.app）に **同梱 skills** として
基本セットの skills を同梱します。`~/.openclaw/skills` はローカルオーバーライド用です。
たとえば、同梱コピーを変更せずに skill を pin したりパッチしたりできます。Workspace skills は
ユーザー所有であり、名前の競合時には両方を上書きします。

## さらに skills を探すには？

[https://clawhub.ai](https://clawhub.ai) を参照してください。完全な設定スキーマ:
[Skills 設定](/ja-JP/tools/skills-config)。

## 関連

- [ClawHub](/ja-JP/tools/clawhub) - 公開 skills registry
- [skills の作成](/ja-JP/tools/creating-skills) - カスタム skills の構築
- [Plugins](/ja-JP/tools/plugin) - plugin system の概要
- [Skill Workshop plugin](/ja-JP/plugins/skill-workshop) - エージェント作業から skills を生成
- [Skills 設定](/ja-JP/tools/skills-config) - skill 設定リファレンス
- [スラッシュコマンド](/ja-JP/tools/slash-commands) - 利用可能なすべてのスラッシュコマンド
