---
read_when:
    - Skills の追加または変更
    - スキルのゲーティング、許可リスト、または読み込みルールの変更
    - Skills の優先順位とスナップショットの動作を理解する
sidebarTitle: Skills
summary: Skills は、エージェントにツールの使い方を教えます。読み込みの仕組み、優先順位の動作、ゲーティング、許可リスト、環境注入の設定方法を学びます。
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills は、エージェントにツールの使い方と使うタイミングを教える markdown 指示ファイルです。各 skill は、YAML frontmatter と markdown 本文を含む `SKILL.md` ファイルのあるディレクトリに置かれます。OpenClaw は同梱 Skills とローカルの上書きを読み込み、環境、config、バイナリの有無に基づいて読み込み時にフィルタリングします。

<CardGroup cols={2}>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム skill をゼロから作成してテストします。
  </Card>
  <Card title="スキルワークショップ" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きした skill 提案をレビューして承認します。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` config スキーマとエージェント allowlist。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    コミュニティの Skills を参照してインストールします。
  </Card>
</CardGroup>

## 読み込み順

OpenClaw は次のソースから読み込みます。**優先度が高い順**です。同じ skill 名が複数の場所にある場合、最も高いソースが優先されます。

| 優先度       | ソース                 | パス                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高    | ワークスペース Skills  | `<workspace>/skills`                    |
| 2           | プロジェクトエージェント Skills | `<workspace>/.agents/skills`            |
| 3           | 個人エージェント Skills | `~/.agents/skills`                      |
| 4           | 管理対象 / ローカル Skills | `~/.openclaw/skills`                    |
| 5           | 同梱 Skills            | インストールに同梱                      |
| 6 — 最低    | 追加ディレクトリ       | `skills.load.extraDirs` + plugin skills |

Skill ルートはグループ化されたレイアウトをサポートします。OpenClaw は、設定済みルート配下の任意の場所に `SKILL.md` が現れるたびに skill を検出します。

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

フォルダパスは整理のためだけのものです。skill の名前、スラッシュコマンド、allowlist キーはすべて `name` frontmatter フィールド（または `name` がない場合はディレクトリ名）から取得されます。

<Note>
  Codex CLI のネイティブな `$CODEX_HOME/skills` ディレクトリは、OpenClaw の
  skill ルートでは**ありません**。`openclaw migrate plan codex` を使ってそれらの Skills を棚卸しし、その後
  `openclaw migrate codex` で OpenClaw ワークスペースへコピーします。
</Note>

## エージェントごとの Skills と共有 Skills

マルチエージェント構成では、各エージェントが独自のワークスペースを持ちます。目的の可視性に合うパスを使用します。

| スコープ       | パス                         | 表示先                      |
| -------------- | ---------------------------- | --------------------------- |
| エージェントごと | `<workspace>/skills`         | そのエージェントのみ        |
| プロジェクトエージェント | `<workspace>/.agents/skills` | そのワークスペースのエージェントのみ |
| 個人エージェント | `~/.agents/skills`           | このマシン上のすべてのエージェント |
| 共有管理対象   | `~/.openclaw/skills`         | このマシン上のすべてのエージェント |
| 追加ディレクトリ | `skills.load.extraDirs`      | このマシン上のすべてのエージェント |

## エージェント allowlist

Skill の**場所**（優先度）と skill の**可視性**（どのエージェントが使用できるか）は別々の制御です。allowlist を使うと、どこから読み込まれたかに関係なく、エージェントに表示される Skills を制限できます。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist ルール">
    - `agents.defaults.skills` を省略すると、デフォルトではすべての Skills が制限されません。
    - `agents.list[].skills` を省略すると、`agents.defaults.skills` を継承します。
    - `agents.list[].skills: []` を設定すると、そのエージェントには Skills を公開しません。
    - 空でない `agents.list[].skills` リストは**最終的な**セットです。defaults とはマージされません。
    - 有効な allowlist は、プロンプト構築、スラッシュコマンド検出、sandbox 同期、skill スナップショット全体に適用されます。
    - これはホストシェルの認可境界ではありません。同じエージェントが `exec` を使える場合は、sandboxing、OS ユーザー分離、exec deny/allowlist、リソースごとの認証情報でそのシェルを別途制約します。

  </Accordion>
</AccordionGroup>

## Plugins と Skills

Plugins は、`openclaw.plugin.json` に `skills` ディレクトリ（Plugin ルートからの相対パス）を列挙することで、独自の Skills を同梱できます。Plugin Skills は Plugin が有効なときに読み込まれます。たとえば、browser Plugin は複数ステップのブラウザ制御用に `browser-automation` skill を同梱しています。

Plugin skill ディレクトリは `skills.load.extraDirs` と同じ低優先度レベルでマージされるため、同名の同梱、管理対象、エージェント、またはワークスペース skill がそれらを上書きします。Plugin の config エントリ上の `metadata.openclaw.requires.config` でゲートします。

完全な Plugin システムについては、[Plugins](/ja-JP/tools/plugin) と [ツール](/ja-JP/tools) を参照してください。

## スキルワークショップ

[スキルワークショップ](/ja-JP/tools/skill-workshop) は、エージェントとアクティブな skill ファイルの間にある提案キューです。エージェントが再利用可能な作業を見つけると、`SKILL.md` に直接書き込む代わりに提案の下書きを作成します。変更が入る前にレビューして承認します。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完全なライフサイクル、CLI リファレンス、設定については、[スキルワークショップ](/ja-JP/tools/skill-workshop) を参照してください。

## ClawHub からのインストール

[ClawHub](https://clawhub.ai) は公開 Skills レジストリです。インストールと更新には `openclaw skills` コマンドを使い、公開と同期には `clawhub` CLI を使います。

| アクション                         | コマンド                                               |
| ---------------------------------- | ------------------------------------------------------ |
| ワークスペースに skill をインストール | `openclaw skills install @owner/<slug>`                |
| Git リポジトリからインストール      | `openclaw skills install git:owner/repo@ref`           |
| ローカル skill ディレクトリをインストール | `openclaw skills install ./path/to/skill --as my-tool` |
| すべてのローカルエージェント向けにインストール | `openclaw skills install @owner/<slug> --global`       |
| すべてのワークスペース Skills を更新 | `openclaw skills update --all`                         |
| 共有管理対象 skill を更新          | `openclaw skills update @owner/<slug> --global`        |
| すべての共有管理対象 Skills を更新 | `openclaw skills update --all --global`                |
| skill の信頼エンベロープを検証      | `openclaw skills verify @owner/<slug>`                 |
| 生成されたスキルカードを出力        | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI 経由で公開 / 同期       | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="インストールの詳細">
    `openclaw skills install` はデフォルトで、アクティブなワークスペースの `skills/`
    ディレクトリにインストールします。`--global` を追加すると、共有
    `~/.openclaw/skills` ディレクトリにインストールされ、エージェント allowlist で狭められていない限り、すべてのローカルエージェントに表示されます。

    Git とローカルインストールでは、ソースルートに `SKILL.md` があることを期待します。slug は、有効な場合は `SKILL.md` frontmatter の `name` から取得され、その後ディレクトリ名またはリポジトリ名にフォールバックします。上書きするには `--as <slug>` を使います。
    `openclaw skills update` は ClawHub インストールのみを追跡します。Git またはローカルソースを更新するには再インストールします。

  </Accordion>
  <Accordion title="検証とセキュリティスキャン">
    `openclaw skills verify @owner/<slug>` は、skill の
    `clawhub.skill.verify.v1` 信頼エンベロープを ClawHub に問い合わせます。インストール済みの ClawHub Skills は、`.clawhub/origin.json` に記録されたバージョンとレジストリに対して検証されます。
    bare slug は既存のインストール済みまたは曖昧でない Skills では引き続き受け入れられますが、owner 付き refs は公開者の曖昧さを避けられます。

    ClawHub の skill ページでは、インストール前に最新のセキュリティスキャン状態が表示され、VirusTotal、ClawScan、静的解析の詳細ページもあります。
    ClawHub が検証を failed とマークした場合、コマンドは非ゼロで終了します。公開者は ClawHub ダッシュボードまたは
    `clawhub skill rescan @owner/<slug>` を通じて false positive から復旧できます。

  </Accordion>
  <Accordion title="プライベートアーカイブのインストール">
    ClawHub 以外の配布が必要な Gateway クライアントは、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` で zip skill アーカイブをステージし、その後 `skills.install({ source: "upload", ... })` でインストールできます。このパスはデフォルトで無効であり、
    `openclaw.json` で `skills.install.allowUploadedArchives: true` が必要です。通常の ClawHub インストールではその設定は不要です。
  </Accordion>
</AccordionGroup>

## セキュリティ

<Warning>
  サードパーティ Skills は**信頼されていないコード**として扱ってください。有効化する前に内容を読んでください。
  信頼できない入力やリスクの高いツールには、sandbox 化された実行を優先します。エージェント側の制御については
  [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

<AccordionGroup>
  <Accordion title="パスの封じ込め">
    ワークスペース、プロジェクトエージェント、追加ディレクトリの skill 検出は、解決後の realpath が設定済みルート内に留まる skill ルートのみを受け入れます。ただし
    `skills.load.allowSymlinkTargets` がターゲットルートを明示的に信頼している場合を除きます。
    スキルワークショップは、`skills.workshop.allowSymlinkTargetWrites` が有効な場合にのみ、それらの信頼済みターゲットを通じて書き込みます。
    管理対象の `~/.openclaw/skills` と個人用の `~/.agents/skills` には symlink された skill フォルダを含められますが、すべての `SKILL.md` realpath は引き続き解決後の skill ディレクトリ内に留まる必要があります。
  </Accordion>
  <Accordion title="オペレーターのインストールポリシー">
    `security.installPolicy` を設定すると、skill インストールが続行される前に信頼済みのローカルポリシーコマンドを実行できます。このポリシーは metadata とステージ済みソースパスを受け取り、ClawHub、アップロード済み、Git、ローカル、更新、依存関係インストーラの各パスに適用され、コマンドが有効な判定を返せない場合は fail closed します。
  </Accordion>
  <Accordion title="Secret 注入スコープ">
    `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの間だけ secret を**ホスト**プロセスへ注入します。sandbox には注入しません。secret をプロンプトやログに含めないでください。
  </Accordion>
</AccordionGroup>

より広い脅威モデルとセキュリティチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

すべての skill には、frontmatter に最低限 `name` と `description` が必要です。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw は [AgentSkills](https://agentskills.io) 仕様に従います。
  frontmatter パーサーは**単一行キーのみ**をサポートします。`metadata` は単一行の JSON オブジェクトである必要があります。本文内で skill フォルダパスを参照するには `{baseDir}` を使います。
</Note>

### 任意の frontmatter キー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される URL です。
  `metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、skill はユーザーが呼び出せるスラッシュコマンドとして公開されます。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw はその skill の指示をエージェントの通常プロンプトから除外します。`user-invocable` も `true` の場合、skill はスラッシュコマンドとして引き続き利用できます。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルをバイパスし、登録済みツールへ直接 dispatch します。
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名です。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、コアによる解析なしで raw args 文字列をツールへ転送します。ツールは
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` を受け取ります。
</ParamField>

## ゲート

OpenClaw はロード時に `metadata.openclaw`（frontmatter 内の単一行
JSON）を使ってスキルをフィルタリングします。`metadata.openclaw` ブロックのないスキルは、明示的に無効化されていない限り常に対象になります。

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

<ParamField path="always" type="boolean">
  `true` の場合、常にそのスキルを含め、他のすべてのゲートをスキップします。
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI に表示される任意の絵文字。
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される任意の URL。
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  プラットフォームフィルター。設定すると、そのスキルは列挙された OS でのみ対象になります。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  各バイナリは `PATH` 上に存在している必要があります。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つのバイナリが `PATH` 上に存在している必要があります。
</ParamField>

<ParamField path="requires.env" type="string[]">
  各 env var はプロセス内に存在するか、config 経由で提供されている必要があります。
</ParamField>

<ParamField path="requires.config" type="string[]">
  各 `openclaw.json` パスは truthy である必要があります。
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられる env var 名。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI で使用される任意のインストーラー仕様（brew / node / go / uv / download）。
</ParamField>

<Note>
  `metadata.openclaw` が存在しない場合、従来の `metadata.clawdbot` ブロックも引き続き受け付けられるため、古いインストール済みスキルは依存関係ゲートとインストーラーのヒントを維持できます。新しいスキルでは
  `metadata.openclaw` を使用してください。
</Note>

### インストーラー仕様

インストーラー仕様は、依存関係をインストールする方法を macOS Skills UI に伝えます。

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
    - 複数のインストーラーが列挙されている場合、Gateway は優先オプションを 1 つ選びます（利用可能なら brew、それ以外は node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は各エントリを一覧表示するため、利用可能なすべてのアーティファクトを確認できます。
    - 仕様には `os: ["darwin"|"linux"|"win32"]` を含めて、プラットフォームでフィルタリングできます。
    - Node インストールは `openclaw.json` 内の `skills.install.nodeManager` に従います
      （デフォルト: npm、オプション: npm / pnpm / yarn / bun）。これはスキルのインストールにのみ影響します。Gateway ランタイムは引き続き Node である必要があります。
    - Gateway のインストーラー優先順位: Homebrew → uv → 構成済み node manager →
      go → download。
  </Accordion>
  <Accordion title="インストーラーごとの詳細">
    - **Homebrew:** OpenClaw は Homebrew を自動インストールしたり、brew
      formula をシステムパッケージコマンドへ変換したりしません。`brew` のない Linux コンテナでは、brew のみのインストーラーは非表示になります。カスタムイメージを使用するか、依存関係を手動でインストールしてください。
    - **Go:** OpenClaw は自動スキルインストールに Go 1.21 以降を要求し、既存の `GOBIN`、`GOPATH`、`GOTOOLCHAIN` 設定を保持します。構成済みツールチェーンがモジュールの要求する Go バージョンを満たせない場合、オンボーディングはインストール試行後に、そのスキルを手動の Go 前提条件と一緒にグループ化します。`go` がなく Homebrew が利用可能な場合、OpenClaw はまず Homebrew 経由で Go をインストールし、`GOBIN` を Homebrew の `bin` に設定します。Linux では、更新された `golang-go` 候補が最小バージョンを満たす場合、OpenClaw は代わりに root として、またはパスワードなしの `sudo` 経由で `apt-get` を使用できます。
    - **Download:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（デフォルト: アーカイブ検出時に auto）、`stripComponents`、
      `targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="サンドボックス化の注意">
    `requires.bins` はスキルのロード時に **host** 上で確認されます。エージェントがサンドボックス内で実行される場合、そのバイナリは **コンテナ内** にも存在している必要があります。
    `agents.defaults.sandbox.docker.setupCommand` またはカスタムイメージ経由でインストールしてください。`setupCommand` はコンテナ作成後に 1 回実行され、ネットワークの外向き通信、書き込み可能な root FS、サンドボックス内の root ユーザーを必要とします。
  </Accordion>
</AccordionGroup>

## Config オーバーライド

`~/.openclaw/openclaw.json` の `skills.entries` で、バンドル済みまたは管理対象のスキルを切り替え、構成します。

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
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
  `false` は、バンドル済みまたはインストール済みであってもスキルを無効化します。バンドル済みの `coding-agent`
  スキルはオプトインです。`skills.entries.coding-agent.enabled: true`
  を設定し、`claude`、`codex`、`opencode`、または別の対応 CLI のいずれかがインストールされ認証済みであることを確認してください。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言するスキル向けの便利フィールド。
  平文文字列または SecretRef オブジェクトに対応します。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  エージェント実行に注入される環境変数。プロセス内で変数がまだ設定されていない場合にのみ注入されます。
</ParamField>

<ParamField path="config" type="object">
  スキルごとのカスタム構成フィールド用の任意の入れ物。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **バンドル済み** スキル専用の任意の許可リスト。設定すると、リスト内のバンドル済みスキルのみが対象になります。管理対象スキルとワークスペーススキルには影響しません。
</ParamField>

<Note>
  Config キーはデフォルトで **スキル名** と一致します。スキルが
  `metadata.openclaw.skillKey` を定義している場合は、`skills.entries` の下でそのキーを使用します。ハイフンを含む名前は引用符で囲んでください。JSON5 では引用符付きキーが許可されています。
</Note>

## 環境注入

エージェント実行が開始されると、OpenClaw は次を行います。

<Steps>
  <Step title="スキルメタデータを読み取る">
    OpenClaw はエージェントの有効なスキル一覧を解決し、ゲートルール、許可リスト、config オーバーライドを適用します。
  </Step>
  <Step title="env と API keys を注入する">
    `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` は、実行中に
    `process.env` へ適用されます。
  </Step>
  <Step title="システムプロンプトを構築する">
    対象スキルはコンパクトな XML ブロックにコンパイルされ、システムプロンプトへ注入されます。
  </Step>
  <Step title="環境を復元する">
    実行終了後、元の環境が復元されます。
  </Step>
</Steps>

<Warning>
  Env 注入はサンドボックスではなく **host** のエージェント実行にスコープされます。サンドボックス内では、`env` と `apiKey` は効果がありません。サンドボックス化された実行へシークレットを渡す方法については
  [Skills config](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars) を参照してください。
</Warning>

バンドル済みの `claude-cli` バックエンドでは、OpenClaw は同じ対象スキルのスナップショットを一時的な Claude Code plugin として実体化し、`--plugin-dir` 経由で渡します。他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は **セッション開始時** に対象スキルのスナップショットを作成し、そのセッション内の以降すべてのターンでその一覧を再利用します。スキルまたは config の変更は、次の新しいセッションで有効になります。

セッション中のスキル更新は、次の 2 つの場合に発生します。

- スキルウォッチャーが `SKILL.md` の変更を検出した。
- 新しい対象リモートノードが接続した。

更新された一覧は次のエージェントターンで使用されます。有効なエージェント許可リストが変更された場合、OpenClaw は表示されるスキルを揃えるためにスナップショットを更新します。

<AccordionGroup>
  <Accordion title="Skills ウォッチャー">
    デフォルトでは、OpenClaw はスキルフォルダーを監視し、`SKILL.md` ファイルが変更されるとスナップショットを更新します。`skills.load` の下で構成します。

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

    スキルルートのシンボリックリンクが構成済みルートの外を指す意図的なシンボリックリンクレイアウトには、`allowSymlinkTargets` を使用します。例:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    Skill Workshop がそれらの信頼済みシンボリックリンクパス経由で提案も適用すべき場合にのみ、`skills.workshop.allowSymlinkTargetWrites` を有効にしてください。

  </Accordion>
  <Accordion title="リモート macOS ノード（Linux gateway）">
    Gateway が Linux 上で実行されていても、**macOS ノード** が
    `system.run` を許可して接続されている場合、必要なバイナリがそのノード上に存在していれば、OpenClaw は macOS 専用スキルを対象として扱えます。エージェントは `host=node` を指定した `exec` ツール経由で、それらのスキルを実行する必要があります。

    オフラインノードは、リモート専用スキルを表示させません。ノードが bin プローブに応答しなくなった場合、OpenClaw はキャッシュ済みの bin 一致をクリアします。

  </Accordion>
</AccordionGroup>

## トークンへの影響

スキルが対象になると、OpenClaw はコンパクトな XML ブロックをシステムプロンプトへ注入します。コストは決定的です。

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **基本オーバーヘッド**（スキルが 1 つ以上ある場合のみ）: 約 195 文字
- **スキルごと:** 約 97 文字 + `name`、`description`、`location` フィールドの長さ
- XML エスケープは `& < > " '` をエンティティに展開し、出現ごとに数文字を追加します
- 約 4 文字/token とすると、97 文字はフィールド長を除いてスキルごとに約 24 tokens です

プロンプトのオーバーヘッドを最小化するため、description は短く説明的にしてください。

## 関連

<CardGroup cols={2}>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムスキルを作成するためのステップバイステップガイド。
  </Card>
  <Card title="スキルワークショップ" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きしたスキルの提案キュー。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` config スキーマとエージェント許可リスト。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    スキルのスラッシュコマンドが登録されルーティングされる仕組み。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    公開レジストリでスキルを閲覧、公開します。
  </Card>
  <Card title="Plugin" href="/ja-JP/tools/plugin" icon="plug">
    Plugin は、ドキュメント化するツールと一緒にスキルを同梱できます。
  </Card>
</CardGroup>
