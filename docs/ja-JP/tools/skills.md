---
read_when:
    - Skills の追加または変更
    - スキルのゲート制御、許可リスト、読み込みルールを変更する
    - Skills の優先順位とスナップショット動作を理解する
sidebarTitle: Skills
summary: 'Skills: 管理対象とワークスペース、ゲート規則、エージェント許可リスト、設定の結線'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:34:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw は、エージェントにツールの使い方を教えるために **[AgentSkills](https://agentskills.io)互換**のスキルフォルダーを使用します。各スキルは、YAML フロントマターと手順を含む `SKILL.md` を持つディレクトリです。OpenClaw はバンドルされたスキルと任意のローカルオーバーライドを読み込み、環境、設定、バイナリの有無に基づいて読み込み時にフィルタリングします。

## 場所と優先順位

OpenClaw は次のソースからスキルを読み込みます。**優先順位が高い順**です。

| #   | ソース                | パス                             |
| --- | --------------------- | -------------------------------- |
| 1   | ワークスペーススキル      | `<workspace>/skills`             |
| 2   | プロジェクトエージェントスキル  | `<workspace>/.agents/skills`     |
| 3   | 個人エージェントスキル | `~/.agents/skills`               |
| 4   | 管理対象/ローカルスキル  | `~/.openclaw/skills`             |
| 5   | バンドルスキル        | インストールに同梱         |
| 6   | 追加スキルフォルダー   | `skills.load.extraDirs` (設定) |

スキル名が競合する場合、最も高いソースが優先されます。

## エージェント別スキルと共有スキル

**マルチエージェント**構成では、各エージェントが独自のワークスペースを持ちます。

| スコープ                | パス                                        | 表示対象                  |
| -------------------- | ------------------------------------------- | --------------------------- |
| エージェント別            | `<workspace>/skills`                        | そのエージェントのみ             |
| プロジェクトエージェント        | `<workspace>/.agents/skills`                | そのワークスペースのエージェントのみ |
| 個人エージェント       | `~/.agents/skills`                          | そのマシン上のすべてのエージェント  |
| 共有管理対象/ローカル | `~/.openclaw/skills`                        | そのマシン上のすべてのエージェント  |
| 共有追加ディレクトリ    | `skills.load.extraDirs` (最低優先順位) | そのマシン上のすべてのエージェント  |

複数の場所に同じ名前がある場合 → 最も高いソースが優先されます。ワークスペースは、プロジェクトエージェント、個人エージェント、管理対象/ローカル、バンドル、追加ディレクトリより優先されます。

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
  <Accordion title="Allowlist rules">
    - 既定でスキルを制限しない場合は、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - スキルなしにするには、`agents.list[].skills: []` を設定します。
    - 空でない `agents.list[].skills` リストは、そのエージェントの**最終的な**セットです。既定値とはマージされません。
    - 有効な許可リストは、プロンプト構築、スキルのスラッシュコマンド検出、サンドボックス同期、スキルスナップショット全体に適用されます。

  </Accordion>
</AccordionGroup>

## Plugin とスキル

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリを列挙することで、独自のスキルを同梱できます (パスは Plugin ルートからの相対パス)。Plugin のスキルは、その Plugin が有効なときに読み込まれます。これは、ツール説明に収めるには長すぎるが、Plugin がインストールされているときには利用可能にしておくべきツール固有の運用ガイドに適した場所です。たとえば、ブラウザー Plugin は複数ステップのブラウザー制御用に `browser-automation` スキルを同梱しています。

Plugin のスキルディレクトリは `skills.load.extraDirs` と同じ低優先順位のパスにマージされるため、同名のバンドル、管理対象、エージェント、またはワークスペーススキルがそれらを上書きします。Plugin の設定エントリで `metadata.openclaw.requires.config` を使って制御できます。

検出/設定については [Plugins](/ja-JP/tools/plugin) を、それらのスキルが教えるツールサーフェスについては [Tools](/ja-JP/tools) を参照してください。

## スキルワークショップ

任意の実験的な **Skill Workshop** Plugin は、エージェント作業中に観測された再利用可能な手順からワークスペーススキルを作成または更新できます。既定では無効で、`plugins.entries.skill-workshop` で明示的に有効化する必要があります。

Skill Workshop は `<workspace>/skills` にのみ書き込み、生成された内容をスキャンし、承認待ちまたは自動の安全な書き込みをサポートし、安全でない提案を隔離し、書き込み成功後にスキルスナップショットを更新して、Gateway の再起動なしで新しいスキルを利用可能にします。

_"次回は GIF の帰属を検証する"_ のような修正や、メディア QA チェックリストのように苦労して得たワークフローに使用します。承認待ちから始めてください。自動書き込みは、提案をレビューした後、信頼できるワークスペースでのみ使用してください。完全なガイド: [Skill Workshop plugin](/ja-JP/plugins/skill-workshop)。

## ClawHub (インストールと同期)

[ClawHub](https://clawhub.ai) は OpenClaw の公開スキルレジストリです。検出/インストール/更新にはネイティブの `openclaw skills` コマンドを使用するか、公開/同期ワークフローには別の `clawhub` CLI を使用します。完全なガイド: [ClawHub](/ja-JP/tools/clawhub)。

| アクション                             | コマンド                                |
| ---------------------------------- | -------------------------------------- |
| スキルをワークスペースにインストール | `openclaw skills install <skill-slug>` |
| インストール済みスキルをすべて更新        | `openclaw skills update --all`         |
| 同期 (スキャン + 更新の公開)      | `clawhub sync --all`                   |

ネイティブの `openclaw skills install` は、アクティブなワークスペースの `skills/` ディレクトリにインストールします。別の `clawhub` CLI も、現在の作業ディレクトリ配下の `./skills` にインストールします (または設定済みの OpenClaw ワークスペースにフォールバックします)。OpenClaw は次のセッションでそれを `<workspace>/skills` として拾います。
設定済みのスキルルートでは、`skills/<group>/<skill>/SKILL.md` のように 1 階層のグループ化もサポートされるため、広範な再帰スキャンなしで関連するサードパーティスキルを共有フォルダー配下に保持できます。

ClawHub のスキルページは、インストール前に最新のセキュリティスキャン状態を公開し、VirusTotal、ClawScan、静的解析のスキャナー詳細ページを提供します。`openclaw skills install <slug>` は引き続きインストール経路のみです。公開者は ClawHub ダッシュボードまたは `clawhub skill rescan <slug>` を通じて誤検出から復旧します。

## セキュリティ

<Warning>
サードパーティスキルは**信頼できないコード**として扱ってください。有効化する前に読んでください。信頼できない入力や危険なツールには、サンドボックス化された実行を優先してください。エージェント側の制御については [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

- ワークスペースおよび追加ディレクトリのスキル検出は、解決済みの realpath が設定済みルート内に留まるスキルルートと `SKILL.md` ファイルのみを受け入れます。
- Gateway バックのスキル依存関係インストール (`skills.install`、オンボーディング、Skills設定UI) は、インストーラーメタデータを実行する前に組み込みの危険コードスキャナーを実行します。呼び出し元が危険なオーバーライドを明示的に設定しない限り、`critical` の検出結果は既定でブロックされます。疑わしい検出結果は引き続き警告のみです。
- `openclaw skills install <slug>` は別物です。これは ClawHub スキルフォルダーをワークスペースにダウンロードし、上記のインストーラーメタデータ経路は使用しません。
- `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの**ホスト**プロセスにシークレットを注入します (サンドボックスではありません)。シークレットをプロンプトやログに含めないでください。

より広範な脅威モデルとチェックリストについては、[Security](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

`SKILL.md` には少なくとも次を含める必要があります。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw はレイアウト/意図について AgentSkills 仕様に従います。埋め込みエージェントで使用されるパーサーは、**単一行**のフロントマターキーのみをサポートします。`metadata` は**単一行の JSON オブジェクト**にしてください。手順内でスキルフォルダーパスを参照するには `{baseDir}` を使用します。

### 任意のフロントマターキー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される URL。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、スキルはユーザーのスラッシュコマンドとして公開されます。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、スキルはモデルプロンプトから除外されます (ユーザー呼び出しでは引き続き利用可能)。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルをバイパスし、ツールへ直接ディスパッチします。
</ParamField>
<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、生の引数文字列をツールへ転送します (コア側の解析なし)。ツールは `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` で呼び出されます。
</ParamField>

## ゲート制御 (読み込み時フィルター)

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
  `true` の場合、常にスキルを含めます (他のゲートをスキップします)。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI で使用される任意の絵文字。
</ParamField>
<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される任意の URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  任意のプラットフォーム一覧。設定されている場合、スキルはそれらの OS でのみ対象になります。
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

`metadata.openclaw` が存在しない場合、スキルは常に対象になります (設定で無効化されている場合や、バンドルスキルに対して `skills.allowBundled` によってブロックされている場合を除く)。

<Note>
`metadata.openclaw` が存在しない場合は、従来の `metadata.clawdbot` ブロックも引き続き受け入れられるため、古いインストール済みスキルは依存関係ゲートとインストーラーヒントを維持します。新規および更新されたスキルでは `metadata.openclaw` を使用してください。
</Note>

### サンドボックス化の注意事項

- `requires.bins` はスキル読み込み時に**ホスト**上でチェックされます。
- エージェントがサンドボックス化されている場合、バイナリは**コンテナ内**にも存在する必要があります。`agents.defaults.sandbox.docker.setupCommand` (またはカスタムイメージ) でインストールします。`setupCommand` はコンテナ作成後に 1 回実行されます。パッケージのインストールには、ネットワーク送信、書き込み可能なルート FS、サンドボックス内の root ユーザーも必要です。
- 例: `summarize` スキル (`skills/summarize/SKILL.md`) は、そこで実行するためにサンドボックスコンテナ内の `summarize` CLI を必要とします。

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
    - 複数のインストーラーが一覧されている場合、Gateway は単一の優先オプションを選びます（利用可能なら brew、それ以外は node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は利用可能なアーティファクトを確認できるように各エントリを一覧します。
    - インストーラー仕様には `os: ["darwin"|"linux"|"win32"]` を含め、プラットフォーム別にオプションを絞り込めます。
    - Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います（デフォルト: npm、オプション: npm/pnpm/yarn/bun）。これは skill インストールのみに影響します。Gateway ランタイムは引き続き Node であるべきです。Bun は WhatsApp/Telegram には推奨されません。
    - Gateway ベースのインストーラー選択は優先順位に基づきます。インストール仕様に複数の種類が混在する場合、OpenClaw は `skills.install.preferBrew` が有効で `brew` が存在すれば Homebrew を優先し、次に `uv`、設定済みの node マネージャー、さらに `go` や `download` などの他のフォールバックを選びます。
    - すべてのインストール仕様が `download` の場合、OpenClaw は 1 つの優先インストーラーにまとめず、すべてのダウンロードオプションを提示します。

  </Accordion>
  <Accordion title="インストーラーごとの詳細">
    - **Go インストール:** `go` がなく `brew` が利用可能な場合、Gateway はまず Homebrew 経由で Go をインストールし、可能な場合は `GOBIN` を Homebrew の `bin` に設定します。
    - **ダウンロードインストール:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（デフォルト: アーカイブ検出時に自動）、`stripComponents`、`targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定の上書き

バンドルおよび管理対象の Skills は、`~/.openclaw/openclaw.json` の
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
  `false` は、その skill がバンドル済みまたはインストール済みであっても無効化します。
  バンドル済みの `coding-agent` skill はオプトインです。エージェントに公開する前に
  `skills.entries.coding-agent.enabled: true` を設定し、
  そのうえで `claude`、`codex`、`opencode`、または `pi` のいずれかがインストールされ、
  それ自身の CLI で認証済みであることを確認してください。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する Skills 向けの簡易指定です。平文または SecretRef をサポートします。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  変数がプロセス内でまだ設定されていない場合にのみ注入されます。
</ParamField>
<ParamField path="config" type="object">
  skill ごとのカスタムフィールド用の任意の入れ物です。カスタムキーはここに置く必要があります。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  **バンドル済み** Skills のみを対象にする任意の許可リストです。設定した場合、リスト内のバンドル済み Skills だけが対象になります（管理対象/workspace Skills には影響しません）。
</ParamField>

skill 名にハイフンが含まれる場合は、キーを引用符で囲みます（JSON5 では引用符付き
キーが許可されます）。設定キーはデフォルトで **skill 名** と一致します。skill が
`metadata.openclaw.skillKey` を定義している場合は、`skills.entries` 配下でそのキーを使用してください。

<Note>
OpenClaw 内で標準の画像生成/編集を行う場合は、バンドル済み skill ではなく、
`agents.defaults.imageGenerationModel` とともにコアの
`image_generate` ツールを使用してください。ここでの skill 例は、カスタムまたはサードパーティの
ワークフロー向けです。ネイティブ画像分析には
`agents.defaults.imageModel` とともに `image` ツールを使用してください。
`openai/*`、`google/*`、`fal/*`、またはその他のプロバイダー固有の画像モデルを選ぶ場合は、そのプロバイダーの
auth/API キーも追加してください。
</Note>

## 環境の注入

エージェント実行が開始されると、OpenClaw は次を行います。

1. skill メタデータを読み取ります。
2. `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` を `process.env` に適用します。
3. **対象となる** Skills を含めてシステムプロンプトを構築します。
4. 実行終了後に元の環境を復元します。

環境の注入は**エージェント実行にスコープされる**もので、グローバルなシェル
環境ではありません。

バンドル済みの `claude-cli` バックエンドでは、OpenClaw は同じ
対象スナップショットを一時的な Claude Code Plugin として実体化し、
`--plugin-dir` で渡します。これにより Claude Code はネイティブの skill リゾルバーを使用でき、
同時に OpenClaw は優先順位、エージェントごとの許可リスト、ゲート、および
`skills.entries.*` の env/API キー注入を引き続き管理します。他の CLI バックエンドは
プロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は、**セッション開始時**に対象 Skills のスナップショットを作成し、
同じセッション内の後続ターンではその一覧を再利用します。Skills または設定の変更は、
次の新しいセッションで有効になります。

Skills は次の 2 つの場合にセッション途中で更新できます。

- Skills ウォッチャーが有効になっている。
- 新しい対象リモートノードが現れる。

これは**ホットリロード**と考えてください。更新された一覧は次の
エージェントターンで反映されます。そのセッションに対する有効なエージェント skill 許可リストが変わった場合、
OpenClaw はスナップショットを更新し、表示される Skills が現在のエージェントと一致し続けるようにします。

### Skills ウォッチャー

デフォルトでは、OpenClaw は skill フォルダーを監視し、
`SKILL.md` ファイルが変更されると Skills スナップショットを更新します。`skills.load` 配下で設定します。

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

Gateway が Linux 上で実行されているが、**macOS ノード**が
`system.run` 許可付きで接続されている場合（Exec 承認セキュリティが `deny` に設定されていない場合）、
OpenClaw は必要なバイナリがそのノード上に存在するとき、macOS 専用 Skills を対象として扱えます。
エージェントは `host=node` を指定した `exec` ツール経由でそれらの Skills を実行するべきです。

これは、ノードがコマンドサポートを報告すること、および `system.which` または `system.run` による
bin プローブに依存します。オフラインノードは**リモート専用** Skills を表示対象にしません。
接続済みノードが bin プローブに応答しなくなった場合、OpenClaw はキャッシュ済みの bin 一致をクリアし、
現在そこで実行できない Skills がエージェントに表示されないようにします。

## トークンへの影響

Skills が対象になると、OpenClaw は利用可能な Skills のコンパクトな XML 一覧を
システムプロンプトに注入します（`pi-coding-agent` の `formatSkillsForPrompt` 経由）。
コストは決定的です。

- **基本オーバーヘッド**（skill が 1 つ以上ある場合のみ）: 195 文字。
- **skill ごと:** 97 文字 + XML エスケープ済みの `<name>`、`<description>`、`<location>` 値の長さ。

式（文字数）:

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML エスケープでは `& < > " '` がエンティティ（`&amp;`、`&lt;` など）に展開されるため、
長さが増えます。トークン数はモデルのトークナイザーによって異なります。OpenAI 風の概算では
約 4 文字/トークンなので、**97 文字 ≈ 24 トークン**が skill ごとにかかり、さらに実際のフィールド長が加わります。

## 管理対象 Skills のライフサイクル

OpenClaw は、インストール（npm パッケージまたは OpenClaw.app）に
**バンドル済み Skills** として基本セットの Skills を同梱しています。
`~/.openclaw/skills` はローカル上書き用です。たとえば、バンドル済みコピーを変更せずに
skill を固定したりパッチしたりできます。Workspace Skills はユーザー所有であり、
名前の競合時には両方を上書きします。

## さらに Skills を探す場合

[https://clawhub.ai](https://clawhub.ai) を参照してください。完全な設定
スキーマ: [Skills 設定](/ja-JP/tools/skills-config)。

## 関連

- [ClawHub](/ja-JP/tools/clawhub) — 公開 Skills レジストリ
- [Skills の作成](/ja-JP/tools/creating-skills) — カスタム Skills の構築
- [Plugins](/ja-JP/tools/plugin) — Plugin システムの概要
- [Skill Workshop Plugin](/ja-JP/plugins/skill-workshop) — エージェント作業から Skills を生成
- [Skills 設定](/ja-JP/tools/skills-config) — skill 設定リファレンス
- [スラッシュコマンド](/ja-JP/tools/slash-commands) — 利用可能なすべてのスラッシュコマンド
