---
read_when:
    - Skills の追加または変更
    - Skill のゲート制御、許可リスト、読み込みルールの変更
    - スキルの優先順位とスナップショット動作を理解する
sidebarTitle: Skills
summary: Skills は、エージェントにツールの使い方を教えます。Skills がどのように読み込まれるか、優先順位がどのように機能するか、ゲーティング、許可リスト、環境注入をどのように設定するかを学びます。
title: Skills
x-i18n:
    generated_at: "2026-06-27T13:17:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills は、エージェントにツールの使い方と使うタイミングを教える Markdown 指示ファイルです。各 Skills は、YAML フロントマターと Markdown 本文を含む `SKILL.md` ファイルが入ったディレクトリにあります。OpenClaw は同梱 Skills とローカル上書きを読み込み、環境、設定、バイナリの有無に基づいて読み込み時にフィルタリングします。

<CardGroup cols={2}>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム Skills をゼロから構築してテストします。
  </Card>
  <Card title="Skills ワークショップ" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きした Skills 提案をレビューして承認します。
  </Card>
  <Card title="Skills 設定" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマとエージェント許可リスト。
  </Card>
  <Card title="ClawHub" href="/ja-JP/clawhub" icon="cloud">
    コミュニティ Skills を参照してインストールします。
  </Card>
</CardGroup>

## 読み込み順

OpenClaw は次のソースから、**優先度が高い順**に読み込みます。同じ Skills 名が複数の場所にある場合は、最も高いソースが優先されます。

| 優先度      | ソース                 | パス                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高    | ワークスペース Skills  | `<workspace>/skills`                    |
| 2           | プロジェクトエージェント Skills | `<workspace>/.agents/skills`            |
| 3           | 個人エージェント Skills | `~/.agents/skills`                      |
| 4           | 管理対象 / ローカル Skills | `~/.openclaw/skills`                    |
| 5           | 同梱 Skills            | インストールに含まれるもの              |
| 6 — 最低    | 追加ディレクトリ       | `skills.load.extraDirs` + Plugin Skills |

Skills ルートはグループ化されたレイアウトをサポートします。OpenClaw は、設定済みルート配下のどこかに `SKILL.md` が現れるたびに Skills を検出します。

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

フォルダパスは整理のためだけに使われます。Skills の名前、スラッシュコマンド、許可リストキーはすべて、`name` フロントマターフィールドから取得されます（`name` がない場合はディレクトリ名）。

<Note>
  Codex CLI ネイティブの `$CODEX_HOME/skills` ディレクトリは、OpenClaw の Skills ルートでは**ありません**。`openclaw migrate plan codex` を使ってそれらの Skills を棚卸しし、その後 `openclaw migrate codex` で OpenClaw ワークスペースにコピーします。
</Note>

## エージェントごとの Skills と共有 Skills

マルチエージェント構成では、各エージェントに独自のワークスペースがあります。必要な可視性に合うパスを使用してください。

| スコープ       | パス                         | 表示対象                    |
| -------------- | ---------------------------- | --------------------------- |
| エージェントごと | `<workspace>/skills`         | そのエージェントのみ        |
| プロジェクトエージェント | `<workspace>/.agents/skills` | そのワークスペースのエージェントのみ |
| 個人エージェント | `~/.agents/skills`           | このマシン上のすべてのエージェント |
| 共有管理対象   | `~/.openclaw/skills`         | このマシン上のすべてのエージェント |
| 追加ディレクトリ | `skills.load.extraDirs`      | このマシン上のすべてのエージェント |

## エージェント許可リスト

Skills の**場所**（優先度）と Skills の**可視性**（どのエージェントが使用できるか）は別々の制御です。読み込み元に関係なく、エージェントに表示される Skills を制限するには許可リストを使用します。

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
  <Accordion title="許可リストのルール">
    - デフォルトで全 Skills を制限しない場合は、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - そのエージェントに Skills を一切公開しないには、`agents.list[].skills: []` を設定します。
    - 空でない `agents.list[].skills` リストは**最終的な**集合です。デフォルトとはマージされません。
    - 有効な許可リストは、プロンプト構築、スラッシュコマンド検出、サンドボックス同期、Skills スナップショット全体に適用されます。
  </Accordion>
</AccordionGroup>

## Plugin と Skills

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリを列挙することで（パスは Plugin ルートからの相対）、独自の Skills を同梱できます。Plugin Skills は Plugin が有効なときに読み込まれます。たとえば、ブラウザ Plugin は複数ステップのブラウザ制御用に `browser-automation` Skills を同梱しています。

Plugin Skills ディレクトリは、`skills.load.extraDirs` と同じ低優先度レベルでマージされるため、同名の同梱、管理対象、エージェント、またはワークスペース Skills がそれらを上書きします。Plugin の設定エントリで `metadata.openclaw.requires.config` を使ってゲートしてください。

Plugin システム全体については、[Plugin](/ja-JP/tools/plugin) と [ツール](/ja-JP/tools) を参照してください。

## Skills ワークショップ

[Skills ワークショップ](/ja-JP/tools/skill-workshop) は、エージェントとアクティブな Skills ファイルの間にある提案キューです。エージェントが再利用可能な作業を見つけると、`SKILL.md` に直接書き込む代わりに提案を下書きします。変更が行われる前に、レビューして承認します。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ライフサイクル全体、CLI リファレンス、設定については、[Skills ワークショップ](/ja-JP/tools/skill-workshop) を参照してください。

## ClawHub からのインストール

[ClawHub](https://clawhub.ai) は公開 Skills レジストリです。インストールと更新には `openclaw skills` コマンドを使用し、公開と同期には `clawhub` CLI を使用します。

| アクション                         | コマンド                                               |
| ---------------------------------- | ------------------------------------------------------ |
| ワークスペースに Skills をインストールする | `openclaw skills install @owner/<slug>`                |
| Git リポジトリからインストールする | `openclaw skills install git:owner/repo@ref`           |
| ローカル Skills ディレクトリをインストールする | `openclaw skills install ./path/to/skill --as my-tool` |
| すべてのローカルエージェント向けにインストールする | `openclaw skills install @owner/<slug> --global`       |
| すべてのワークスペース Skills を更新する | `openclaw skills update --all`                         |
| 共有管理対象 Skills を更新する     | `openclaw skills update @owner/<slug> --global`        |
| すべての共有管理対象 Skills を更新する | `openclaw skills update --all --global`                |
| Skills の信頼エンベロープを検証する | `openclaw skills verify @owner/<slug>`                 |
| 生成された Skills Card を出力する  | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI 経由で公開 / 同期する  | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="インストールの詳細">
    `openclaw skills install` はデフォルトで、アクティブなワークスペースの `skills/` ディレクトリにインストールします。`--global` を追加すると、共有 `~/.openclaw/skills` ディレクトリにインストールされ、エージェント許可リストで絞り込まれていない限り、すべてのローカルエージェントから見えるようになります。

    Git およびローカルインストールでは、ソースルートに `SKILL.md` があることを想定します。slug は、有効な場合は `SKILL.md` フロントマターの `name` から取得され、その後ディレクトリ名またはリポジトリ名にフォールバックします。上書きするには `--as <slug>` を使用します。`openclaw skills update` は ClawHub インストールのみを追跡します。Git またはローカルソースを更新するには再インストールしてください。

  </Accordion>
  <Accordion title="検証とセキュリティスキャン">
    `openclaw skills verify @owner/<slug>` は、Skills の `clawhub.skill.verify.v1` 信頼エンベロープを ClawHub に要求します。インストール済みの ClawHub Skills は、`.clawhub/origin.json` に記録されたバージョンとレジストリに対して検証されます。既存のインストール済み Skills または曖昧でない Skills では bare slug も引き続き受け入れられますが、owner 付きの参照は公開者の曖昧さを避けられます。

    ClawHub の Skills ページでは、インストール前に最新のセキュリティスキャン状態を表示し、VirusTotal、ClawScan、静的解析の詳細ページも提供します。ClawHub が検証失敗とマークした場合、コマンドは非ゼロで終了します。公開者は ClawHub ダッシュボードまたは `clawhub skill rescan @owner/<slug>` を通じて誤検知を復旧できます。

  </Accordion>
  <Accordion title="プライベートアーカイブのインストール">
    ClawHub 以外の配布が必要な Gateway クライアントは、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` で zip Skills アーカイブをステージングし、その後 `skills.install({ source: "upload", ... })` でインストールできます。このパスはデフォルトで無効で、`openclaw.json` に `skills.install.allowUploadedArchives: true` が必要です。通常の ClawHub インストールでは、この設定は不要です。
  </Accordion>
</AccordionGroup>

## セキュリティ

<Warning>
  サードパーティ Skills は**信頼できないコード**として扱ってください。有効化する前に読んでください。信頼できない入力や危険なツールには、サンドボックス化された実行を推奨します。エージェント側の制御については、[サンドボックス](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

<AccordionGroup>
  <Accordion title="パスの閉じ込め">
    ワークスペース、プロジェクトエージェント、追加ディレクトリの Skills 検出は、解決された realpath が設定済みルートの内側に留まる Skills ルートのみを受け入れます。ただし、`skills.load.allowSymlinkTargets` がターゲットルートを明示的に信頼している場合を除きます。Skills ワークショップは、`skills.workshop.allowSymlinkTargetWrites` が有効な場合にのみ、それらの信頼済みターゲットを通じて書き込みます。管理対象の `~/.openclaw/skills` と個人用の `~/.agents/skills` にはシンボリックリンクされた Skills フォルダを含められますが、各 `SKILL.md` の realpath は引き続き、解決された Skills ディレクトリの内側に留まる必要があります。
  </Accordion>
  <Accordion title="オペレーターのインストールポリシー">
    Skills のインストールを続行する前に信頼済みローカルポリシーコマンドを実行するには、`security.installPolicy` を設定します。このポリシーはメタデータとステージング済みソースパスを受け取り、ClawHub、アップロード、Git、ローカル、更新、依存関係インストーラーの各パスに適用され、コマンドが有効な判断を返せない場合は閉じた状態で失敗します。
  </Accordion>
  <Accordion title="シークレット注入のスコープ">
    `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの間だけ **host** プロセスにシークレットを注入します。サンドボックスには注入しません。シークレットをプロンプトやログに含めないでください。
  </Accordion>
</AccordionGroup>

より広い脅威モデルとセキュリティチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

すべての Skills には、少なくともフロントマター内の `name` と `description` が必要です。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw は [AgentSkills](https://agentskills.io) 仕様に従います。フロントマターパーサーは**単一行キーのみ**をサポートします。`metadata` は単一行の JSON オブジェクトである必要があります。Skills フォルダパスを参照するには、本文内で `{baseDir}` を使用します。
</Note>

### 任意のフロントマターキー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Website」として表示される URL。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、Skills はユーザーが呼び出せるスラッシュコマンドとして公開されます。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw は Skills の指示をエージェントの通常プロンプトから除外します。`user-invocable` も `true` の場合、Skills は引き続きスラッシュコマンドとして利用できます。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルをバイパスし、登録済みツールに直接ディスパッチします。
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、コア解析なしで raw args 文字列をツールに転送します。ツールは `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` を受け取ります。
</ParamField>

## ゲート

OpenClaw はロード時に `metadata.openclaw`（frontmatter 内の単一行
JSON）を使って Skills をフィルタリングします。`metadata.openclaw` ブロックがない skill は、明示的に無効化されていない限り常に
対象になります。

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
  `true` の場合、常に skill を含め、他のすべてのゲートをスキップします。
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI に表示される任意の絵文字。
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される任意の URL。
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  プラットフォームフィルター。設定すると、その skill は列挙された OS でのみ対象になります。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  各バイナリは `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つのバイナリが `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.env" type="string[]">
  各環境変数はプロセス内に存在するか、config 経由で提供される必要があります。
</ParamField>

<ParamField path="requires.config" type="string[]">
  各 `openclaw.json` パスは truthy である必要があります。
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられた環境変数名。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI で使用される任意のインストーラー仕様（brew / node / go / uv / download）。
</ParamField>

<Note>
  `metadata.openclaw` がない場合、レガシーの `metadata.clawdbot` ブロックも引き続き受け入れられるため、古いインストール済み Skills は依存関係ゲートとインストーラーヒントを維持します。新しい Skills では
  `metadata.openclaw` を使用してください。
</Note>

### インストーラー仕様

インストーラー仕様は、依存関係のインストール方法を macOS Skills UI に伝えます。

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
  <Accordion title="Installer selection rules">
    - 複数のインストーラーが列挙されている場合、gateway は優先オプションを 1 つ選択します
      （利用可能な場合は brew、それ以外は node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は各エントリを列挙するため、利用可能なすべてのアーティファクトを確認できます。
    - 仕様には、プラットフォームでフィルタリングするために `os: ["darwin"|"linux"|"win32"]` を含めることができます。
    - Node インストールは `openclaw.json` 内の `skills.install.nodeManager` に従います
      （デフォルト: npm、オプション: npm / pnpm / yarn / bun）。これは skill のインストールにのみ影響します。Gateway ランタイムは引き続き Node である必要があります。
    - Gateway インストーラーの優先順: Homebrew → uv → 設定済みの node manager →
      go → download。
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw は Homebrew を自動インストールしたり、brew
      formula をシステムパッケージコマンドに変換したりしません。`brew` がない Linux コンテナでは、brew 専用インストーラーは非表示になります。カスタムイメージを使用するか、依存関係を手動でインストールしてください。
    - **Go:** `go` がなく `brew` が利用可能な場合、gateway は先に
      Homebrew 経由で Go をインストールし、`GOBIN` を Homebrew の `bin` に設定します。
    - **Download:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（デフォルト: アーカイブ検出時は auto）、`stripComponents`、
      `targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` は skill ロード時に**ホスト**上で確認されます。agent が
    sandbox 内で実行される場合、バイナリは**コンテナ内**にも存在する必要があります。
    `agents.defaults.sandbox.docker.setupCommand` またはカスタムイメージ経由でインストールしてください。`setupCommand` はコンテナ作成後に 1 回実行され、ネットワーク egress、書き込み可能な root FS、sandbox 内の root ユーザーが必要です。
  </Accordion>
</AccordionGroup>

## Config オーバーライド

`~/.openclaw/openclaw.json` の `skills.entries` で、バンドルまたは管理対象の Skills を切り替え、設定します。

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
  `false` は、バンドル済みまたはインストール済みであっても skill を無効化します。`coding-agent`
  バンドル skill はオプトインです。`skills.entries.coding-agent.enabled: true`
  を設定し、`claude`、`codex`、`opencode`、または別の対応 CLI のいずれかがインストールされ認証済みであることを確認してください。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する Skills 向けの便利フィールド。
  平文文字列または SecretRef オブジェクトをサポートします。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  agent run に注入される環境変数。変数がプロセス内でまだ設定されていない場合にのみ注入されます。
</ParamField>

<ParamField path="config" type="object">
  skill ごとのカスタム設定フィールド用の任意の入れ物。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **バンドル済み** Skills のみを対象とする任意の allowlist。設定すると、リスト内のバンドル済み Skills のみが対象になります。管理対象および workspace Skills には影響しません。
</ParamField>

<Note>
  Config キーはデフォルトで **skill name** と一致します。skill が
  `metadata.openclaw.skillKey` を定義している場合は、`skills.entries` の下でそのキーを使用してください。ハイフンを含む名前は引用符で囲んでください。JSON5 では quoted keys が許可されています。
</Note>

## 環境の注入

agent run が開始されると、OpenClaw は次を行います。

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw は agent の有効な skill リストを解決し、ゲート規則、
    allowlist、config オーバーライドを適用します。
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` は、
    run の間 `process.env` に適用されます。
  </Step>
  <Step title="Builds the system prompt">
    対象の Skills はコンパクトな XML ブロックにコンパイルされ、system prompt に注入されます。
  </Step>
  <Step title="Restores the environment">
    run が終了すると、元の環境が復元されます。
  </Step>
</Steps>

<Warning>
  環境の注入は、sandbox ではなく**ホスト**の agent run にスコープされます。
  sandbox 内では、`env` と `apiKey` は効果がありません。sandbox 化された run に secret を渡す方法については、
  [Skills config](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars) を参照してください。
</Warning>

バンドル済みの `claude-cli` backend では、OpenClaw は同じ対象 skill snapshot も一時的な Claude Code Plugin として具体化し、
`--plugin-dir` 経由で渡します。他の CLI backend は prompt catalog のみを使用します。

## Snapshot と更新

OpenClaw は**セッション開始時**に対象 Skills の snapshot を作成し、そのリストをセッション内の以降すべての turn で再利用します。Skills または config への変更は、次の新しいセッションで反映されます。

Skills はセッション中に 2 つの場合で更新されます。

- Skills watcher が `SKILL.md` の変更を検出した場合。
- 新しい対象 remote node が接続した場合。

更新されたリストは、次の agent turn で使用されます。有効な agent allowlist が変わると、OpenClaw は snapshot を更新して、表示される Skills の整合性を保ちます。

<AccordionGroup>
  <Accordion title="Skills watcher">
    デフォルトでは、OpenClaw は skill フォルダーを監視し、
    `SKILL.md` ファイルが変更されると snapshot を進めます。`skills.load` の下で設定します。

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

    skill root の symlink が設定済み root の外を指す意図的な symlink レイアウトでは、
    `allowSymlinkTargets` を使用してください。例:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    Skill Workshop がそれらの信頼済み symlink パスを通じて proposal も適用する必要がある場合にのみ、
    `skills.workshop.allowSymlinkTargetWrites` を有効化してください。

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Gateway が Linux 上で実行されていても、`system.run` が許可された
    **macOS node** が接続されている場合、必要なバイナリがその node 上に存在すれば、OpenClaw は macOS 専用 Skills を対象として扱うことができます。agent はそれらの Skills を `host=node` 付きの `exec` tool 経由で実行する必要があります。

    オフライン node は remote 専用 Skills を表示しません。node が bin probe に応答しなくなると、OpenClaw はキャッシュ済みの bin match をクリアします。

  </Accordion>
</AccordionGroup>

## トークンへの影響

Skills が対象になると、OpenClaw はコンパクトな XML ブロックを system
prompt に注入します。コストは決定的です。

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **基本オーバーヘッド**（skill が 1 つ以上ある場合のみ）: 約 195 文字
- **skill ごと:** 約 97 文字 + `name`、`description`、`location` フィールドの長さ
- XML escaping は `& < > " '` を entity に展開し、出現ごとに数文字を追加します
- 約 4 文字/token とすると、97 文字はフィールド長を含める前で skill あたり約 24 tokens です

prompt オーバーヘッドを最小化するため、description は短く説明的にしてください。

## 関連

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム skill を作成するためのステップバイステップガイド。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    agent が下書きした Skills の proposal queue。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` config schema と agent allowlist。
  </Card>
  <Card title="Slash commands" href="/ja-JP/tools/slash-commands" icon="terminal">
    skill slash command が登録およびルーティングされる方法。
  </Card>
  <Card title="ClawHub" href="/ja-JP/clawhub" icon="cloud">
    public registry で Skills を参照し公開します。
  </Card>
  <Card title="Plugins" href="/ja-JP/tools/plugin" icon="plug">
    Plugins は、ドキュメント化する tools と一緒に Skills を同梱できます。
  </Card>
</CardGroup>
