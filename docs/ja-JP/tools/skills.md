---
read_when:
    - Skills の追加または変更
    - スキルのゲーティング、許可リスト、または読み込みルールの変更
    - スキルの優先順位とスナップショット動作を理解する
sidebarTitle: Skills
summary: Skills は、エージェントにツールの使い方を教えます。読み込み方法、優先順位の仕組み、ゲーティング、許可リスト、環境インジェクションの設定方法を学びます。
title: Skills
x-i18n:
    generated_at: "2026-07-01T05:30:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills は、エージェントにツールを使う方法とタイミングを教える markdown 指示ファイルです。各 skill は、YAML frontmatter と markdown 本文を含む `SKILL.md` ファイルがあるディレクトリ内に置かれます。OpenClaw はバンドルされた Skills とローカルのオーバーライドを読み込み、環境、設定、バイナリの有無に基づいて読み込み時にフィルタリングします。

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム skill をゼロから構築してテストします。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きした skill 提案をレビューして承認します。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマとエージェント許可リスト。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    コミュニティ Skills を参照してインストールします。
  </Card>
</CardGroup>

## 読み込み順序

OpenClaw は次のソースから、**優先度の高い順**に読み込みます。同じ skill 名が複数の場所にある場合、最も高いソースが優先されます。

| 優先度      | ソース                 | パス                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高    | ワークスペース Skills  | `<workspace>/skills`                    |
| 2           | プロジェクトエージェント Skills | `<workspace>/.agents/skills`            |
| 3           | 個人エージェント Skills | `~/.agents/skills`                      |
| 4           | 管理 / ローカル Skills | `~/.openclaw/skills`                    |
| 5           | バンドル Skills        | インストールに同梱                      |
| 6 — 最低    | 追加ディレクトリ       | `skills.load.extraDirs` + plugin skills |

Skill ルートはグループ化されたレイアウトをサポートします。OpenClaw は、設定済みルート配下のどこかに `SKILL.md` が現れると skill を検出します。

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

フォルダパスは整理用にすぎません。skill の名前、スラッシュコマンド、許可リストキーはすべて `name` frontmatter フィールドから取得されます（`name` がない場合はディレクトリ名）。

<Note>
  Codex CLI のネイティブな `$CODEX_HOME/skills` ディレクトリは、OpenClaw の
  skill ルートでは**ありません**。`openclaw migrate plan codex` を使ってそれらの Skills を棚卸しし、その後
  `openclaw migrate codex` で OpenClaw ワークスペースにコピーしてください。
</Note>

## エージェントごとの Skills と共有 Skills

マルチエージェント構成では、各エージェントが独自のワークスペースを持ちます。必要な可視性に合うパスを使用してください。

| スコープ       | パス                         | 表示対象                    |
| -------------- | ---------------------------- | --------------------------- |
| エージェントごと | `<workspace>/skills`         | そのエージェントのみ        |
| プロジェクトエージェント | `<workspace>/.agents/skills` | そのワークスペースのエージェントのみ |
| 個人エージェント | `~/.agents/skills`           | このマシン上のすべてのエージェント |
| 共有管理       | `~/.openclaw/skills`         | このマシン上のすべてのエージェント |
| 追加ディレクトリ | `skills.load.extraDirs`      | このマシン上のすべてのエージェント |

## エージェント許可リスト

Skill の**場所**（優先度）と skill の**可視性**（どのエージェントが使えるか）は別々の制御です。どこから読み込まれたかに関係なく、エージェントが参照できる Skills を制限するには許可リストを使用します。

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
  <Accordion title="Allowlist rules">
    - 既定ではすべての Skills を制限しない場合は、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - そのエージェントに Skills を一切公開しない場合は、`agents.list[].skills: []` を設定します。
    - 空でない `agents.list[].skills` リストは**最終的な**集合です。defaults とはマージされません。
    - 有効な許可リストは、プロンプト構築、スラッシュコマンド検出、サンドボックス同期、skill スナップショット全体に適用されます。
    - これはホストシェルの認可境界ではありません。同じエージェントが `exec` を使える場合は、サンドボックス化、OS ユーザー分離、exec 拒否/許可リスト、リソースごとの認証情報で、そのシェルを別途制約してください。

  </Accordion>
</AccordionGroup>

## Plugins と Skills

Plugins は `openclaw.plugin.json` に `skills` ディレクトリを列挙することで、独自の Skills を同梱できます（パスは plugin ルートからの相対パス）。Plugin Skills は plugin が有効なときに読み込まれます。たとえば browser plugin は、複数ステップのブラウザ制御用に `browser-automation` skill を同梱しています。

Plugin skill ディレクトリは `skills.load.extraDirs` と同じ低優先度レベルでマージされるため、同名のバンドル、管理、エージェント、またはワークスペースの skill がそれらをオーバーライドします。plugin の設定エントリで `metadata.openclaw.requires.config` によりゲートしてください。

完全な plugin システムについては、[Plugins](/ja-JP/tools/plugin) と [Tools](/ja-JP/tools) を参照してください。

## Skill Workshop

[Skill Workshop](/ja-JP/tools/skill-workshop) は、エージェントとアクティブな skill ファイルの間にある提案キューです。エージェントが再利用可能な作業を見つけると、`SKILL.md` に直接書き込む代わりに提案を下書きします。変更が入る前にレビューして承認します。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完全なライフサイクル、CLI リファレンス、設定については [Skill Workshop](/ja-JP/tools/skill-workshop) を参照してください。

## ClawHub からのインストール

[ClawHub](https://clawhub.ai) は公開 Skills レジストリです。インストールと更新には `openclaw skills` コマンドを、公開と同期には `clawhub` CLI を使用します。

| アクション                         | コマンド                                               |
| ---------------------------------- | ------------------------------------------------------ |
| skill をワークスペースにインストール | `openclaw skills install @owner/<slug>`                |
| Git リポジトリからインストール      | `openclaw skills install git:owner/repo@ref`           |
| ローカル skill ディレクトリをインストール | `openclaw skills install ./path/to/skill --as my-tool` |
| すべてのローカルエージェント向けにインストール | `openclaw skills install @owner/<slug> --global`       |
| すべてのワークスペース Skills を更新 | `openclaw skills update --all`                         |
| 共有管理 skill を更新              | `openclaw skills update @owner/<slug> --global`        |
| すべての共有管理 Skills を更新     | `openclaw skills update --all --global`                |
| skill の信頼エンベロープを検証      | `openclaw skills verify @owner/<slug>`                 |
| 生成された Skill Card を出力        | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI 経由で公開 / 同期       | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` は既定で、アクティブなワークスペースの `skills/`
    ディレクトリにインストールします。共有
    `~/.openclaw/skills` ディレクトリにインストールするには `--global` を追加します。これは、エージェント許可リストで絞り込まれない限り、すべてのローカルエージェントから見えます。

    Git とローカルインストールでは、ソースルートに `SKILL.md` があることを想定します。slug は、有効な場合は `SKILL.md` frontmatter の `name` から取得され、その後ディレクトリ名またはリポジトリ名にフォールバックします。上書きするには `--as <slug>` を使用します。
    `openclaw skills update` は ClawHub インストールのみを追跡します。Git またはローカルソースを更新するには再インストールしてください。

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` は、skill の
    `clawhub.skill.verify.v1` 信頼エンベロープを ClawHub に問い合わせます。インストール済みの ClawHub Skills は、`.clawhub/origin.json` に記録されたバージョンとレジストリに対して検証されます。
    bare slug は既存のインストール済み skill や曖昧でない skill では引き続き受け入れられますが、owner 修飾付き参照は公開者の曖昧さを避けられます。

    ClawHub の skill ページでは、インストール前に最新のセキュリティスキャン状態が公開され、VirusTotal、ClawScan、静的解析の詳細ページも表示されます。
    ClawHub が検証失敗とマークした場合、このコマンドは非ゼロで終了します。公開者は ClawHub ダッシュボードまたは
    `clawhub skill rescan @owner/<slug>` を通じて誤検知から回復できます。

  </Accordion>
  <Accordion title="Private archive installs">
    ClawHub 以外の配信が必要な Gateway クライアントは、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` で zip skill アーカイブをステージし、その後 `skills.install({ source: "upload", ... })` でインストールできます。このパスは既定ではオフで、`openclaw.json` で `skills.install.allowUploadedArchives: true` が必要です。通常の ClawHub インストールでは、この設定は不要です。
  </Accordion>
</AccordionGroup>

## セキュリティ

<Warning>
  サードパーティの Skills は**信頼できないコード**として扱ってください。有効化する前に読んでください。
  信頼できない入力やリスクの高いツールには、サンドボックス化された実行を推奨します。エージェント側の制御については
  [サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    ワークスペース、プロジェクトエージェント、追加ディレクトリの skill 検出では、解決された realpath が設定済みルート内に収まる skill ルートのみを受け入れます。ただし、`skills.load.allowSymlinkTargets` が対象ルートを明示的に信頼している場合を除きます。
    Skill Workshop は、`skills.workshop.allowSymlinkTargetWrites` が有効な場合に限り、それらの信頼済みターゲットへ書き込みます。
    管理対象の `~/.openclaw/skills` と個人用の `~/.agents/skills` にはシンボリックリンクされた skill フォルダを含められますが、すべての `SKILL.md` realpath は引き続き解決済みの skill ディレクトリ内に収まる必要があります。
  </Accordion>
  <Accordion title="Operator install policy">
    skill インストールを続行する前に信頼済みローカルポリシーコマンドを実行するには、`security.installPolicy` を設定します。ポリシーはメタデータとステージ済みソースパスを受け取り、ClawHub、アップロード、Git、ローカル、更新、依存インストーラーパスに適用され、コマンドが有効な判断を返せない場合は fail closed します。
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの間だけ、**ホスト**プロセスにシークレットを注入します。サンドボックスには注入しません。
    シークレットをプロンプトやログに入れないでください。
  </Accordion>
</AccordionGroup>

より広い脅威モデルとセキュリティチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

すべての skill には、frontmatter に少なくとも `name` と `description` が必要です。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw は [AgentSkills](https://agentskills.io) 仕様に従います。
  frontmatter パーサーは**単一行キーのみ**をサポートします。`metadata` は単一行の JSON オブジェクトでなければなりません。skill フォルダパスを参照するには、本文で `{baseDir}` を使用してください。
</Note>

### 任意の frontmatter キー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Website」として表示される URL。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、skill はユーザーが呼び出せるスラッシュコマンドとして公開されます。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw は skill の指示をエージェントの通常プロンプトから除外します。`user-invocable` も `true` の場合、skill は引き続きスラッシュコマンドとして利用できます。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルをバイパスし、登録済みツールへ直接ディスパッチします。
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、コアによる解析なしで raw args 文字列をツールへ転送します。ツールは
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
  を受け取ります。
</ParamField>

## ゲート

OpenClaw は読み込み時に `metadata.openclaw`（frontmatter 内の単一行
JSON）を使用してスキルをフィルタリングします。`metadata.openclaw` ブロックがないスキルは、明示的に無効化されていない限り常に対象になります。

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
  `true` の場合、常にスキルを含め、他のすべてのゲートをスキップします。
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI に表示される任意の絵文字です。
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI で「Web サイト」として表示される任意の URL です。
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  プラットフォームフィルターです。設定すると、そのスキルは列挙された OS でのみ対象になります。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  各バイナリは `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つのバイナリが `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.env" type="string[]">
  各環境変数はプロセス内に存在するか、config 経由で提供されている必要があります。
</ParamField>

<ParamField path="requires.config" type="string[]">
  各 `openclaw.json` パスは truthy である必要があります。
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられた環境変数名です。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI で使用される任意のインストーラー仕様です（brew / node / go / uv / download）。
</ParamField>

<Note>
  `metadata.openclaw` が存在しない場合、レガシーの `metadata.clawdbot` ブロックも引き続き受け付けられるため、古いインストール済みスキルは依存関係ゲートとインストーラーヒントを維持します。新しいスキルでは
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
    - すべてのインストーラーが `download` の場合、OpenClaw は各エントリを列挙し、利用可能なすべての成果物を確認できるようにします。
    - 仕様には、プラットフォームでフィルタリングするために `os: ["darwin"|"linux"|"win32"]` を含められます。
    - Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います
      （デフォルト: npm、オプション: npm / pnpm / yarn / bun）。これはスキルのインストールにのみ影響します。Gateway ランタイムは引き続き Node である必要があります。
    - Gateway のインストーラー優先順位: Homebrew → uv → 設定済み node manager →
      go → download。
  </Accordion>
  <Accordion title="インストーラーごとの詳細">
    - **Homebrew:** OpenClaw は Homebrew を自動インストールせず、brew の formula をシステムパッケージコマンドへ変換しません。`brew` がない Linux コンテナでは、brew のみのインストーラーは非表示になります。カスタムイメージを使うか、依存関係を手動でインストールしてください。
    - **Go:** `go` がなく `brew` が利用可能な場合、Gateway はまず Homebrew 経由で Go をインストールし、`GOBIN` を Homebrew の `bin` に設定します。
    - **Download:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（デフォルト: archive が検出された場合は auto）、`stripComponents`、
      `targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="サンドボックス化の注意">
    `requires.bins` はスキル読み込み時に **ホスト** 上で確認されます。エージェントがサンドボックス内で実行される場合、そのバイナリは **コンテナ内** にも存在する必要があります。
    `agents.defaults.sandbox.docker.setupCommand` またはカスタムイメージ経由でインストールしてください。`setupCommand` はコンテナ作成後に 1 回実行され、ネットワークへの送信、書き込み可能なルート FS、サンドボックス内の root ユーザーを必要とします。
  </Accordion>
</AccordionGroup>

## Config オーバーライド

同梱または管理対象のスキルは、`~/.openclaw/openclaw.json` の `skills.entries` で切り替えおよび設定します。

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
  `false` は、同梱またはインストール済みであってもスキルを無効化します。`coding-agent`
  同梱スキルは opt-in です。`skills.entries.coding-agent.enabled: true` を設定し、
  `claude`、`codex`、`opencode`、または別のサポート対象 CLI のいずれかがインストール済みで認証済みであることを確認してください。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言するスキル向けの便利なフィールドです。
  平文文字列または SecretRef オブジェクトをサポートします。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  エージェント実行に注入される環境変数です。変数がプロセス内でまだ設定されていない場合にのみ注入されます。
</ParamField>

<ParamField path="config" type="object">
  スキルごとのカスタム設定フィールド用の任意のバッグです。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **同梱** スキル専用の任意の許可リストです。設定すると、リスト内の同梱スキルだけが対象になります。管理対象およびワークスペースのスキルには影響しません。
</ParamField>

<Note>
  Config キーはデフォルトで **スキル名** と一致します。スキルが
  `metadata.openclaw.skillKey` を定義している場合は、`skills.entries` 配下でそのキーを使用してください。ハイフンを含む名前は引用符で囲んでください。JSON5 では引用符付きキーが許可されています。
</Note>

## 環境注入

エージェント実行が開始されると、OpenClaw は次を行います。

<Steps>
  <Step title="スキルメタデータを読み取る">
    OpenClaw は、ゲート規則、許可リスト、config オーバーライドを適用して、エージェントに有効なスキル一覧を解決します。
  </Step>
  <Step title="env と API キーを注入する">
    `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` が、実行中の
    `process.env` に適用されます。
  </Step>
  <Step title="システムプロンプトを構築する">
    対象スキルはコンパクトな XML ブロックにコンパイルされ、システムプロンプトに注入されます。
  </Step>
  <Step title="環境を復元する">
    実行終了後、元の環境が復元されます。
  </Step>
</Steps>

<Warning>
  Env 注入のスコープは **ホスト** のエージェント実行であり、サンドボックスではありません。サンドボックス内では、
  `env` と `apiKey` は効果がありません。サンドボックス化された実行へシークレットを渡す方法については
  [Skills config](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars) を参照してください。
</Warning>

同梱の `claude-cli` バックエンドでは、OpenClaw は同じ対象スキルスナップショットを一時的な Claude Code Plugin として具現化し、`--plugin-dir` 経由で渡します。他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は **セッション開始時** に対象スキルのスナップショットを作成し、そのセッション内の後続のすべてのターンでその一覧を再利用します。スキルまたは config の変更は、次の新しいセッションで有効になります。

セッション中にスキルが更新されるのは次の 2 つの場合です。

- Skills watcher が `SKILL.md` の変更を検出した場合。
- 新しい対象リモートノードが接続した場合。

更新された一覧は、次のエージェントターンで取得されます。有効なエージェント許可リストが変更された場合、OpenClaw はスナップショットを更新し、表示されるスキルを揃えます。

<AccordionGroup>
  <Accordion title="Skills watcher">
    デフォルトでは、OpenClaw はスキルフォルダーを監視し、`SKILL.md` ファイルが変更されるとスナップショットを更新します。`skills.load` 配下で設定します。

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

    スキルルートのシンボリックリンクが設定済みルートの外を指す、意図的なシンボリックリンク構成では `allowSymlinkTargets` を使用してください。たとえば
    `<workspace>/skills/manager -> ~/Projects/manager/skills` です。
    Skill Workshop がそれらの信頼済みシンボリックリンクパス経由でも提案を適用すべき場合にのみ、
    `skills.workshop.allowSymlinkTargetWrites` を有効にしてください。

  </Accordion>
  <Accordion title="リモート macOS ノード（Linux Gateway）">
    Gateway が Linux 上で実行されているが、**macOS ノード** が接続されていて
    `system.run` が許可されている場合、OpenClaw は必要なバイナリがそのノード上に存在するとき、macOS 専用スキルを対象として扱えます。エージェントはそれらのスキルを `host=node` 付きの `exec` ツール経由で実行する必要があります。

    オフラインのノードは、リモート専用スキルを表示対象にしません。ノードが bin プローブに応答しなくなった場合、OpenClaw はキャッシュ済みの bin 一致をクリアします。

  </Accordion>
</AccordionGroup>

## トークンへの影響

スキルが対象になると、OpenClaw はコンパクトな XML ブロックをシステムプロンプトに注入します。コストは決定的です。

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **ベースオーバーヘッド**（スキルが 1 つ以上ある場合のみ）: 約 195 文字
- **スキルごと:** 約 97 文字 + `name`、`description`、`location` フィールドの長さ
- XML エスケープにより `& < > " '` はエンティティに展開され、出現ごとに数文字増えます
- 約 4 文字/token とすると、97 文字はフィールド長を除いてスキルあたり約 24 token です

プロンプトのオーバーヘッドを最小化するため、説明は短く具体的にしてください。

## 関連

<CardGroup cols={2}>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムスキルを作成するためのステップバイステップガイドです。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きしたスキルの提案キューです。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` config スキーマとエージェント許可リストです。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    スキルのスラッシュコマンドがどのように登録およびルーティングされるか。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    パブリックレジストリでスキルを閲覧および公開します。
  </Card>
  <Card title="Plugins" href="/ja-JP/tools/plugin" icon="plug">
    Plugins は、ドキュメント化するツールと一緒にスキルを同梱できます。
  </Card>
</CardGroup>
