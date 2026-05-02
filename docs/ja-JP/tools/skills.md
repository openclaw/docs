---
read_when:
    - Skills の追加または変更
    - スキルのゲート制御、許可リスト、読み込みルールを変更する
    - スキルの優先順位とスナップショットの動作を理解する
sidebarTitle: Skills
summary: 'Skills: 管理型とワークスペース、ゲート規則、エージェント許可リスト、設定の接続'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:08:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw は、エージェントにツールの使い方を教えるために **[AgentSkills](https://agentskills.io) 互換**のスキル
フォルダーを使用します。各スキルは、YAML フロントマターと手順を含む `SKILL.md` を
格納するディレクトリです。OpenClaw は、同梱スキルに加えて任意のローカル上書きを
読み込み、環境、設定、バイナリの存在に基づいて読み込み時にフィルタリングします。

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

スキル名が競合する場合、最も高いソースが優先されます。

Codex CLI のネイティブな `$CODEX_HOME/skills` ディレクトリは、これらの OpenClaw
スキルルートには含まれません。Codex ハーネスモードでは、ローカル app-server の起動に
エージェントごとに分離された Codex ホームを使用するため、個人用の Codex CLI スキルは
暗黙的には読み込まれません。`openclaw migrate codex --dry-run` で一覧を作成し、
`openclaw migrate codex` で対話型のチェックボックスプロンプトからスキルディレクトリを
選択して、現在の OpenClaw エージェントワークスペースへコピーします。
非対話実行では、コピーする正確なスキルごとに `--skill <name>` を繰り返してください。

## エージェント単位と共有スキル

**マルチエージェント**構成では、各エージェントが独自のワークスペースを持ちます。

| スコープ             | パス                                        | 表示対象                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| エージェント単位     | `<workspace>/skills`                        | そのエージェントのみ        |
| プロジェクトエージェント | `<workspace>/.agents/skills`                | そのワークスペースのエージェントのみ |
| 個人エージェント     | `~/.agents/skills`                          | そのマシン上のすべてのエージェント |
| 共有管理対象/ローカル | `~/.openclaw/skills`                        | そのマシン上のすべてのエージェント |
| 共有追加ディレクトリ | `skills.load.extraDirs` (最も低い優先順位) | そのマシン上のすべてのエージェント |

複数の場所に同じ名前がある場合 → 最も高いソースが優先されます。ワークスペースは
プロジェクトエージェントより優先され、プロジェクトエージェントは個人エージェントより優先され、
個人エージェントは管理対象/ローカルより優先され、管理対象/ローカルは同梱より優先され、
同梱は追加ディレクトリより優先されます。

## エージェントスキルの許可リスト

スキルの**場所**とスキルの**可視性**は別々の制御です。
場所/優先順位は、同じ名前のスキルのどのコピーが優先されるかを決めます。エージェントの
許可リストは、エージェントが実際に使用できるスキルを決めます。

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
    - 有効な許可リストは、プロンプト構築、スキル slash-command 検出、サンドボックス同期、スキルスナップショット全体に適用されます。
  </Accordion>
</AccordionGroup>

## Plugin とスキル

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリを列挙することで
独自のスキルを同梱できます (パスは Plugin ルートからの相対パス)。Plugin スキルは、
Plugin が有効なときに読み込まれます。これは、ツール説明に収めるには長すぎるものの、
Plugin がインストールされているときは常に利用可能にすべきツール固有の運用ガイドに
適した場所です。たとえば、ブラウザー Plugin は、複数ステップのブラウザー制御用に
`browser-automation` スキルを同梱しています。

Plugin スキルディレクトリは `skills.load.extraDirs` と同じ低優先順位のパスへ
マージされるため、同じ名前の同梱、管理対象、エージェント、またはワークスペースの
スキルがそれらを上書きします。Plugin の設定エントリで
`metadata.openclaw.requires.config` を使ってゲートできます。

検出/設定については [Plugin](/ja-JP/tools/plugin) を、これらのスキルが教えるツールサーフェスについては
[ツール](/ja-JP/tools) を参照してください。

## Skill Workshop

任意の実験的な **Skill Workshop** Plugin は、エージェント作業中に観測された再利用可能な手順から
ワークスペーススキルを作成または更新できます。これはデフォルトで無効であり、
`plugins.entries.skill-workshop` を通じて明示的に有効化する必要があります。

Skill Workshop は `<workspace>/skills` にのみ書き込み、生成されたコンテンツをスキャンし、
承認待ちまたは自動の安全な書き込みをサポートし、安全でない提案を隔離し、書き込み成功後に
スキルスナップショットを更新するため、新しいスキルは Gateway の再起動なしで利用可能になります。

これは、_"次回は GIF の帰属表示を確認する"_ のような修正や、メディア QA チェックリストのような
苦労して得たワークフローに使用します。承認待ちから始めてください。自動書き込みは、提案を確認した後、
信頼できるワークスペースでのみ使用してください。完全なガイド: [Skill Workshop Plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub (インストールと同期)

[ClawHub](https://clawhub.ai) は OpenClaw の公開スキルレジストリです。
検出/インストール/更新にはネイティブの `openclaw skills` コマンドを使用し、公開/同期ワークフローには
別個の `clawhub` CLI を使用します。完全なガイド:
[ClawHub](/ja-JP/tools/clawhub)。

| アクション                         | コマンド                               |
| ---------------------------------- | -------------------------------------- |
| ワークスペースにスキルをインストール | `openclaw skills install <skill-slug>` |
| インストール済みの全スキルを更新   | `openclaw skills update --all`         |
| 同期 (スキャン + 更新の公開)       | `clawhub sync --all`                   |

ネイティブの `openclaw skills install` は、アクティブなワークスペースの
`skills/` ディレクトリにインストールします。別個の `clawhub` CLI も、
現在の作業ディレクトリ配下の `./skills` にインストールします (または設定済みの
OpenClaw ワークスペースへフォールバックします)。OpenClaw は次回セッションでそれを
`<workspace>/skills` として取り込みます。
設定済みスキルルートは、`skills/<group>/<skill>/SKILL.md` のような 1 階層のグループ化にも対応しているため、
関連するサードパーティスキルを、広範な再帰スキャンなしで共有フォルダー配下に保持できます。

ClawHub のスキルページでは、インストール前に最新のセキュリティスキャン状態を表示し、
VirusTotal、ClawScan、静的解析のスキャナー詳細ページも提供します。
`openclaw skills install <slug>` はインストール経路のみに留まります。公開者は
ClawHub ダッシュボードまたは `clawhub skill rescan <slug>` を通じて誤検知から回復します。

## セキュリティ

<Warning>
サードパーティスキルは**信頼できないコード**として扱ってください。有効化する前に読んでください。
信頼できない入力やリスクの高いツールにはサンドボックス実行を推奨します。エージェント側の制御については
[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

- ワークスペースおよび追加ディレクトリのスキル検出は、解決された realpath が設定済みルートの内側に留まるスキルルートと `SKILL.md` ファイルのみを受け入れます。
- Gateway が支えるスキル依存関係インストール (`skills.install`、オンボーディング、Skills 設定 UI) は、インストーラーメタデータを実行する前に組み込みの危険コードスキャナーを実行します。`critical` の検出結果は、呼び出し元が危険な上書きを明示的に設定しない限り、デフォルトでブロックされます。不審な検出結果は引き続き警告のみです。
- `openclaw skills install <slug>` は異なります。これは ClawHub スキルフォルダーをワークスペースにダウンロードし、上記のインストーラーメタデータ経路は使用しません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの**ホスト**プロセスにシークレットを注入します (サンドボックスではありません)。シークレットをプロンプトやログに含めないでください。

より広範な脅威モデルとチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

`SKILL.md` には少なくとも次を含める必要があります。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw はレイアウト/意図について AgentSkills 仕様に従います。組み込みエージェントで使用されるパーサーは、
**単一行**のフロントマターキーのみをサポートします。
`metadata` は**単一行の JSON オブジェクト**にしてください。手順内でスキルフォルダーパスを参照するには
`{baseDir}` を使用します。

### 任意のフロントマターキー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Website」として表示される URL。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、スキルはユーザー slash command として公開されます。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw はスキルの手順をエージェントの通常の
  プロンプトに含めません。スキルは引き続きインストールされ、`user-invocable` も `true` の場合は
  slash command として明示的に実行できます。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、slash command はモデルをバイパスし、ツールへ直接ディスパッチします。
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されているときに呼び出すツール名。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、生の args 文字列をツールへ転送します (コアの解析なし)。ツールは `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` で呼び出されます。
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
  `true` の場合、常にスキルを含めます (他のゲートをスキップ)。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI で使用される任意の絵文字。
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI で「Website」として表示される任意の URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  任意のプラットフォーム一覧。設定した場合、スキルはそれらの OS でのみ対象になります。
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
  truthy である必要がある `openclaw.json` パスの一覧。
</ParamField>
<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられる環境変数名。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI で使用される任意のインストーラー仕様 (brew/node/go/uv/download)。
</ParamField>

`metadata.openclaw` が存在しない場合、そのスキルは常に対象になります (設定で無効化されている場合、
または同梱スキルで `skills.allowBundled` によってブロックされている場合を除く)。

<Note>
レガシーの `metadata.clawdbot` ブロックは、`metadata.openclaw` が存在しない場合でも
引き続き受け入れられるため、古いインストール済みスキルは依存関係ゲートとインストーラーヒントを維持します。
新規および更新済みのスキルでは `metadata.openclaw` を使用してください。
</Note>

### サンドボックス化の注意事項

- `requires.bins` は、スキル読み込み時に**ホスト**上で確認されます。
- エージェントがサンドボックス化されている場合、バイナリは**コンテナー内**にも存在する必要があります。`agents.defaults.sandbox.docker.setupCommand` (またはカスタムイメージ) 経由でインストールしてください。`setupCommand` はコンテナー作成後に 1 回実行されます。パッケージインストールには、ネットワーク送信、書き込み可能なルート FS、サンドボックス内の root ユーザーも必要です。
- 例: `summarize` スキル (`skills/summarize/SKILL.md`) は、そこで実行するためにサンドボックスコンテナー内に `summarize` CLI を必要とします。

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
    - 複数のインストーラーが列挙されている場合、Gateway は単一の優先オプションを選びます（利用可能なら brew、そうでなければ node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は各エントリを一覧表示し、利用可能なアーティファクトを確認できるようにします。
    - インストーラー仕様には `os: ["darwin"|"linux"|"win32"]` を含めて、プラットフォームごとにオプションをフィルターできます。
    - Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います（デフォルト: npm、オプション: npm/pnpm/yarn/bun）。これは skill のインストールにのみ影響します。Gateway ランタイムは引き続き Node であるべきです。WhatsApp/Telegram には Bun は推奨されません。
    - Gateway によるインストーラー選択は優先順位で決まります。インストール仕様に複数の種類が混在する場合、`skills.install.preferBrew` が有効で `brew` が存在すれば OpenClaw は Homebrew を優先し、次に `uv`、次に設定済みの node manager、次に `go` や `download` などの他のフォールバックを選びます。
    - すべてのインストール仕様が `download` の場合、OpenClaw は 1 つの優先インストーラーにまとめず、すべてのダウンロードオプションを表示します。

  </Accordion>
  <Accordion title="インストーラー別の詳細">
    - **Go インストール:** `go` がなく `brew` が利用可能な場合、Gateway はまず Homebrew 経由で Go をインストールし、可能であれば `GOBIN` を Homebrew の `bin` に設定します。
    - **Download インストール:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: アーカイブが検出された場合は auto）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定の上書き

同梱および管理対象の skills は、`~/.openclaw/openclaw.json` の
`skills.entries` 配下で切り替えたり、env 値を指定したりできます。

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
  `false` は、その skill が同梱またはインストール済みであっても無効にします。
  同梱の `coding-agent` skill はオプトインです。エージェントに公開する前に
  `skills.entries.coding-agent.enabled: true` を設定し、
  その後 `claude`、`codex`、`opencode`、または `pi` のいずれかがインストール済みで、
  それ自身の CLI で認証済みであることを確認してください。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する skills のための簡便指定です。プレーンテキストまたは SecretRef をサポートします。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  その変数がプロセス内でまだ設定されていない場合にのみ注入されます。
</ParamField>
<ParamField path="config" type="object">
  skill ごとのカスタムフィールド用の任意の入れ物です。カスタムキーはここに置く必要があります。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **同梱** skills のみに対する任意の許可リストです。設定した場合、リスト内の同梱 skills だけが対象になります（管理対象/workspace skills には影響しません）。
</ParamField>

skill 名にハイフンが含まれる場合は、キーを引用符で囲みます（JSON5 では引用符付きキーが許可されます）。設定キーはデフォルトで **skill 名** と一致します。skill が
`metadata.openclaw.skillKey` を定義している場合は、そのキーを `skills.entries` 配下で使用してください。

<Note>
OpenClaw 内で標準的な画像生成/編集を行う場合は、同梱 skill ではなく、
`agents.defaults.imageGenerationModel` とともに core の
`image_generate` ツールを使用してください。
ここにある skill の例は、カスタムまたはサードパーティのワークフロー向けです。
ネイティブな画像分析には、`agents.defaults.imageModel` とともに `image` ツールを使用してください。
`openai/*`、`google/*`、`fal/*`、または別のプロバイダー固有の画像モデルを選ぶ場合は、そのプロバイダーの auth/API キーも追加してください。
</Note>

## 環境の注入

エージェント実行が開始されると、OpenClaw は次を行います。

1. skill メタデータを読み取ります。
2. `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` を `process.env` に適用します。
3. **対象** skills を使ってシステムプロンプトを構築します。
4. 実行終了後、元の環境を復元します。

環境の注入は、グローバルなシェル環境ではなく、**エージェント実行にスコープ**されます。

同梱の `claude-cli` バックエンドでは、OpenClaw は同じ対象スナップショットを一時的な Claude Code Plugin として実体化し、
`--plugin-dir` で渡します。その後 Claude Code はネイティブの skill resolver を使用できますが、
OpenClaw は引き続き優先順位、エージェントごとの許可リスト、ゲート、および
`skills.entries.*` の env/API キー注入を管理します。他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は **セッション開始時** に対象 skills のスナップショットを取得し、
同じセッション内の後続ターンではそのリストを再利用します。
skills または設定への変更は、次の新しいセッションで有効になります。

次の 2 つの場合、Skills はセッション中に更新できます。

- skills watcher が有効になっている。
- 新しい対象リモートノードが現れる。

これは **ホットリロード** と考えてください。更新されたリストは、次のエージェントターンで反映されます。
そのセッションの有効なエージェント skill 許可リストが変わった場合、OpenClaw はスナップショットを更新し、表示される skills が現在のエージェントと一致するようにします。

### Skills watcher

デフォルトでは、OpenClaw は skill フォルダーを監視し、`SKILL.md` ファイルが変更されると skills スナップショットを更新します。`skills.load` 配下で設定します。

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

Gateway が Linux 上で動作していても、**macOS ノード** が `system.run` 許可付きで接続されている場合（Exec approvals security が `deny` に設定されていない場合）、
必要なバイナリがそのノード上に存在すれば、OpenClaw は macOS 専用 skills を対象として扱えます。エージェントは `host=node` を指定した `exec` ツール経由でそれらの skills を実行するべきです。

これは、ノードがコマンドサポートを報告すること、および `system.which` または `system.run` 経由の bin プローブに依存します。オフラインのノードは**リモート専用 skills を表示対象にしません**。接続済みノードが bin プローブに応答しなくなった場合、OpenClaw はキャッシュ済みの bin 一致をクリアし、現在そこで実行できない skills がエージェントに見えないようにします。

## トークンへの影響

skills が対象になると、OpenClaw は利用可能な skills のコンパクトな XML リストをシステムプロンプトに注入します（`pi-coding-agent` の `formatSkillsForPrompt` 経由）。コストは決定的です。

- **基本オーバーヘッド**（skill が 1 つ以上ある場合のみ）: 195 文字。
- **skill ごと:** 97 文字 + XML エスケープ済みの `<name>`、`<description>`、`<location>` 値の長さ。

式（文字数）:

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML エスケープでは `& < > " '` がエンティティ（`&amp;`、`&lt;` など）に展開され、
長さが増えます。トークン数はモデルのトークナイザーによって異なります。OpenAI 風の概算では約 4 文字/トークンなので、**97 文字 ≈ 24 トークン** が skill ごとにかかり、そこに実際のフィールド長が加わります。

## 管理対象 skills のライフサイクル

OpenClaw は、インストール（npm package または OpenClaw.app）に **同梱 skills** としてベースラインの skills セットを同梱します。`~/.openclaw/skills` はローカル上書き用に存在します。たとえば、同梱コピーを変更せずに skill を固定したりパッチしたりできます。Workspace skills はユーザー所有であり、名前の競合時には両方を上書きします。

## さらに skills を探すには

[https://clawhub.ai](https://clawhub.ai) を参照してください。完全な設定スキーマ: [Skills 設定](/ja-JP/tools/skills-config)。

## 関連

- [ClawHub](/ja-JP/tools/clawhub) — 公開 skills レジストリ
- [skills の作成](/ja-JP/tools/creating-skills) — カスタム skills の構築
- [Plugins](/ja-JP/tools/plugin) — Plugin システム概要
- [Skill Workshop Plugin](/ja-JP/plugins/skill-workshop) — エージェント作業から skills を生成
- [Skills 設定](/ja-JP/tools/skills-config) — skill 設定リファレンス
- [スラッシュコマンド](/ja-JP/tools/slash-commands) — 利用可能なすべてのスラッシュコマンド
