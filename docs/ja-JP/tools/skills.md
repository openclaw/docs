---
read_when:
    - Skills の追加または変更
    - Skills のゲーティング、許可リスト、または読み込みルールを変更する
    - スキルの優先順位とスナップショット動作を理解する
sidebarTitle: Skills
summary: Skills は、エージェントにツールの使い方を教えます。読み込まれる仕組み、優先順位の動作、ゲーティング、許可リスト、環境注入の設定方法を学びます。
title: Skills
x-i18n:
    generated_at: "2026-07-05T11:55:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d532282eafcc5ac50a83e66b35100a928d99f536c6743c07cccba2da7721be40
    source_path: tools/skills.md
    workflow: 16
---

Skills は、エージェントにツールの使い方と使うタイミングを教える markdown 指示ファイルです。各 Skill は、YAML frontmatter と markdown 本文を含む `SKILL.md` ファイルが入ったディレクトリに置かれます。OpenClaw はバンドル済み Skills とローカルのオーバーライドを読み込み、環境、設定、バイナリの有無に基づいて読み込み時にフィルタリングします。

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム Skill をゼロから構築してテストします。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きした Skill 提案をレビューして承認します。
  </Card>
  <Card title="Skills config" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマとエージェントの許可リスト。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    コミュニティ Skills を参照してインストールします。
  </Card>
</CardGroup>

## 読み込み順序

OpenClaw は次のソースから、**優先度が高い順**に読み込みます。同じ Skill 名が複数の場所に現れる場合、最も高いソースが優先されます。

| 優先度 | ソース | パス |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | ワークスペース Skills | `<workspace>/skills` |
| 2 | プロジェクトエージェント Skills | `<workspace>/.agents/skills` |
| 3 | 個人エージェント Skills | `~/.agents/skills` |
| 4 | 管理対象 / ローカル Skills | `~/.openclaw/skills` |
| 5 | バンドル済み Skills | インストールに同梱 |
| 6 — 最低 | 追加ディレクトリ | `skills.load.extraDirs` + Plugin Skills |

Skill ルートはグループ化されたレイアウトをサポートします。設定されたルート配下の任意の場所（最大 6 階層）に `SKILL.md` が現れると、OpenClaw は Skill を検出します。

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

フォルダーパスは整理のためだけのものです。Skill の名前とスラッシュコマンドは、`name` frontmatter フィールド（または `name` がない場合はディレクトリ名）から取得されます。エージェント許可リスト（下記）もこの `name` に一致します。

<Note>
  Codex CLI ネイティブの `$CODEX_HOME/skills` ディレクトリは、OpenClaw の Skill ルートでは**ありません**。まず `openclaw migrate plan codex` を使ってそれらの Skills を棚卸しし、その後 `openclaw migrate codex` で OpenClaw ワークスペースへコピーします。
</Note>

## エージェント別 Skills と共有 Skills

マルチエージェント構成では、各エージェントに独自のワークスペースがあります。目的の可視性に一致するパスを使ってください。

| スコープ | パス | 表示対象 |
| -------------- | ---------------------------- | --------------------------- |
| エージェント別 | `<workspace>/skills` | そのエージェントのみ |
| プロジェクトエージェント | `<workspace>/.agents/skills` | そのワークスペースのエージェントのみ |
| 個人エージェント | `~/.agents/skills` | このマシン上のすべてのエージェント |
| 共有管理対象 | `~/.openclaw/skills` | このマシン上のすべてのエージェント |
| 追加ディレクトリ | `skills.load.extraDirs` | このマシン上のすべてのエージェント |

## エージェント許可リスト

Skill の**場所**（優先度）と Skill の**可視性**（どのエージェントが使えるか）は別々の制御です。許可リストを使うと、どこから読み込まれたかに関係なく、エージェントに表示される Skills を制限できます。

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
    - デフォルトですべての Skills を無制限にするには、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - そのエージェントに Skills を一切公開しないには、`agents.list[].skills: []` を設定します。
    - 空でない `agents.list[].skills` リストは**最終的な**セットです。デフォルトとはマージされません。
    - 有効な許可リストは、プロンプト構築、スラッシュコマンド検出、サンドボックス同期、Skill スナップショット全体に適用されます。
    - これはホストシェルの認可境界ではありません。同じエージェントが `exec` を使える場合は、そのシェルをサンドボックス化、OS ユーザー分離、exec 拒否/許可リスト、リソースごとの認証情報で別途制限してください。

  </Accordion>
</AccordionGroup>

## Plugin と Skills

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリ（Plugin ルートからの相対パス）を列挙することで、独自の Skills を同梱できます。Plugin Skills は Plugin が有効なときに読み込まれます。たとえば、ブラウザー Plugin は複数ステップのブラウザー制御向けに `browser-automation` Skill を同梱しています。

Plugin Skill ディレクトリは `skills.load.extraDirs` と同じ低優先度レベルでマージされるため、同名のバンドル済み、管理対象、エージェント、またはワークスペース Skill がそれらを上書きします。Plugin Skill 自体の適格性は、他の Skill と同じように、frontmatter の `metadata.openclaw.requires` で制御します。

Plugin システム全体については、[Plugins](/ja-JP/tools/plugin) と [Tools](/ja-JP/tools) を参照してください。

## Skill Workshop

[Skill Workshop](/ja-JP/tools/skill-workshop) は、エージェントとアクティブな Skill ファイルの間にある提案キューです。エージェントが再利用可能な作業を見つけると、`SKILL.md` に直接書き込む代わりに提案を下書きします。変更が行われる前に、あなたがレビューして承認します。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ライフサイクル全体、CLI リファレンス、設定については、[Skill Workshop](/ja-JP/tools/skill-workshop) を参照してください。

## ClawHub からのインストール

[ClawHub](https://clawhub.ai) は公開 Skills レジストリです。インストールと更新には `openclaw skills` コマンドを使い、公開と同期には `clawhub` CLI を使います。

| 操作 | コマンド |
| ---------------------------------- | ------------------------------------------------------ |
| ワークスペースに Skill をインストール | `openclaw skills install @owner/<slug>` |
| Git リポジトリからインストール | `openclaw skills install git:owner/repo@ref` |
| ローカル Skill ディレクトリをインストール | `openclaw skills install ./path/to/skill --as my-tool` |
| すべてのローカルエージェント向けにインストール | `openclaw skills install @owner/<slug> --global` |
| すべてのワークスペース Skills を更新 | `openclaw skills update --all` |
| 共有管理対象 Skill を更新 | `openclaw skills update @owner/<slug> --global` |
| すべての共有管理対象 Skills を更新 | `openclaw skills update --all --global` |
| Skill の信頼エンベロープを検証 | `openclaw skills verify @owner/<slug>` |
| 生成された Skill Card を出力 | `openclaw skills verify @owner/<slug> --card` |
| ClawHub CLI 経由で公開 / 同期 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` はデフォルトで、アクティブなワークスペースの `skills/` ディレクトリにインストールします。`--global` を追加すると、共有 `~/.openclaw/skills` ディレクトリにインストールされ、エージェント許可リストで狭められない限り、すべてのローカルエージェントに表示されます。

    Git とローカルのインストールでは、ソースルートに `SKILL.md` があることを期待します。スラッグは、有効な場合は `SKILL.md` frontmatter の `name` から取得され、その後ディレクトリ名またはリポジトリ名にフォールバックします。上書きするには `--as <slug>` を使います。`openclaw skills update` は ClawHub インストールのみを追跡します。Git またはローカルソースを更新するには再インストールしてください。

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` は、Skill の `clawhub.skill.verify.v1` 信頼エンベロープを ClawHub に問い合わせます。インストール済みの ClawHub Skills は、`.clawhub/origin.json` に記録されたバージョンとレジストリに対して検証されます。既存のインストール済みまたは曖昧でない Skills では裸のスラッグも引き続き受け入れられますが、所有者付き参照は公開者の曖昧さを避けます。

    ClawHub の Skill ページでは、インストール前に最新のセキュリティスキャン状態が表示され、VirusTotal、ClawScan、静的解析の詳細ページも提供されます。ClawHub が検証を失敗としてマークしている場合、このコマンドは非ゼロで終了します。公開者は ClawHub ダッシュボードまたは `clawhub skill rescan @owner/<slug>` を通じて誤検知を回復できます。

  </Accordion>
  <Accordion title="Private archive installs">
    ClawHub 以外の配信が必要な Gateway クライアントは、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` で zip Skill アーカイブをステージングし、その後 `skills.install({ source: "upload", ... })` でインストールできます。この経路はデフォルトでは無効であり、`openclaw.json` で `skills.install.allowUploadedArchives: true` が必要です。通常の ClawHub インストールでは、その設定は不要です。
  </Accordion>
</AccordionGroup>

## セキュリティ

<Warning>
  サードパーティ Skills は**信頼されていないコード**として扱ってください。有効にする前に読んでください。信頼できない入力や危険なツールには、サンドボックス化された実行を推奨します。エージェント側の制御については、[Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    ワークスペース、プロジェクトエージェント、追加ディレクトリの Skill 検出では、解決済み realpath が設定されたルート内に収まる Skill ルートのみを受け入れます。ただし、`skills.load.allowSymlinkTargets` がターゲットルートを明示的に信頼している場合を除きます。Skill Workshop は、`skills.workshop.allowSymlinkTargetWrites` が有効な場合にのみ、それらの信頼済みターゲットを通じて書き込みます。管理対象の `~/.openclaw/skills` と個人用の `~/.agents/skills` にはシンボリックリンクされた Skill フォルダーを含められますが、すべての `SKILL.md` realpath は、それでも解決済みの Skill ディレクトリ内に収まっている必要があります。
  </Accordion>
  <Accordion title="Operator install policy">
    Skill のインストールを続行する前に、信頼済みローカルポリシーコマンドを実行するには `security.installPolicy` を設定します。このポリシーはメタデータとステージング済みソースパスを受け取り、ClawHub、アップロード済み、Git、ローカル、更新、依存関係インストーラーの各経路に適用され、コマンドが有効な判定を返せない場合は失敗として閉じます。
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターンの間だけ **host** プロセスにシークレットを注入します。サンドボックスには注入しません。シークレットをプロンプトやログに入れないでください。
  </Accordion>
</AccordionGroup>

より広い脅威モデルとセキュリティチェックリストについては、[Security](/ja-JP/gateway/security) を参照してください。

## SKILL.md 形式

すべての Skill には、少なくとも frontmatter に `name` と `description` が必要です。

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw は [AgentSkills](https://agentskills.io) 仕様に従います。Frontmatter はまず YAML として解析されます。それが失敗した場合は、単一行専用パーサーにフォールバックします。ネストされた `metadata` ブロック（複数行 YAML マッピングを含む）は JSON 文字列にフラット化され、JSON5 として再解析されるため、[Gating](#gating) の下に示したブロック形式が機能します。本文内で `{baseDir}` を使うと、Skill フォルダーのパスを参照できます。
</Note>

### 任意の frontmatter キー

<ParamField path="homepage" type="string">
  macOS Skills UI で「Webサイト」として表示される URL。`metadata.openclaw.homepage` 経由でもサポートされます。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、Skill はユーザーが呼び出せるスラッシュコマンドとして公開されます。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw は Skill の指示をエージェントの通常プロンプトに含めません。`user-invocable` も `true` の場合、その Skill はスラッシュコマンドとして引き続き利用できます。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルを迂回し、登録済みのツールへ
  直接ディスパッチされます。
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されているときに呼び出すツール名。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールディスパッチでは、core による解析なしで生の引数文字列をツールへ転送します。
  ツールは
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
  を受け取ります。
</ParamField>

## ゲート制御

OpenClaw は読み込み時に `metadata.openclaw`（frontmatter に埋め込まれた JSON5 オブジェクト。
上記の解析メモを参照）を使ってスキルをフィルタリングします。
`metadata.openclaw` ブロックがないスキルは、明示的に無効化されていない限り常に対象になります。

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
  `true` の場合、スキルを常に含め、他のすべてのゲートをスキップします。
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI に表示される任意の絵文字。
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI で「Web サイト」として表示される任意の URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  プラットフォームフィルター。設定すると、スキルは一覧に含まれる OS でのみ対象になります。
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
  `skills.entries.<name>.apiKey` に関連付けられる環境変数名。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI が使用する任意のインストーラー仕様（brew / node / go / uv / download）。
</ParamField>

<Note>
  `metadata.openclaw` がない場合、レガシーの `metadata.clawdbot` ブロックも引き続き受け付けられるため、
  以前にインストールされたスキルは依存関係ゲートとインストーラーヒントを維持します。
  新しいスキルでは `metadata.openclaw` を使用してください。
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
  <Accordion title="Installer selection rules">
    - 複数のインストーラーが一覧にある場合、Gateway は優先オプションを 1 つ選びます
      （利用可能なら brew、それ以外は node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は利用可能なすべてのアーティファクトを確認できるよう、
      各エントリーを一覧表示します。
    - 仕様には、プラットフォームでフィルタリングするために `os: ["darwin"|"linux"|"win32"]` を含められます。
    - Node インストールは `openclaw.json` の `skills.install.nodeManager` に従います
      （デフォルト: npm、オプション: npm / pnpm / yarn / bun）。これはスキルのインストールにのみ影響します。
      Gateway ランタイムは引き続き Node である必要があります。
    - Gateway のインストーラー優先順位: Homebrew → uv → 設定済みの node manager →
      go → download。
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw は Homebrew を自動インストールせず、brew formula をシステムパッケージコマンドへ変換しません。
      `brew` がない Linux コンテナでは、brew のみのインストーラーは非表示になります。
      カスタムイメージを使うか、依存関係を手動でインストールしてください。
    - **Go:** OpenClaw は自動スキルインストールに Go 1.21 以降を必要とします。
      `go` がなく Homebrew が利用可能な場合、OpenClaw はまず Homebrew 経由で Go をインストールします。
      Homebrew がない Linux では、更新後の `golang-go` 候補が最小バージョンを満たす場合に、
      代わりに root またはパスワードなしの `sudo` 経由で `apt-get` を使用できます。
      依存関係に対する実際の `go install` は、設定済みの `GOBIN` ではなく、
      常に OpenClaw 管理の専用 bin ディレクトリ（新規インストール時は Homebrew の `bin`、それ以外は `~/.local/bin`）
      を対象にします。ユーザー自身の `GOBIN`、`GOPATH`、`GOTOOLCHAIN`
      環境変数は読み取られますが、上書きされることはありません。
    - **Download:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（デフォルト: アーカイブ検出時は auto）、`stripComponents`、
      `targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` はスキル読み込み時に **ホスト** 上でチェックされます。
    エージェントがサンドボックス内で実行される場合、そのバイナリは **コンテナ内** にも存在する必要があります。
    `agents.defaults.sandbox.docker.setupCommand` またはカスタムイメージでインストールしてください。
    `setupCommand` はコンテナ作成後に 1 回実行され、ネットワークの外向き通信、
    書き込み可能な root FS、サンドボックス内の root ユーザーを必要とします。
  </Accordion>
</AccordionGroup>

## config の上書き

バンドルまたは管理対象のスキルは、`~/.openclaw/openclaw.json` の `skills.entries` で切り替え、
設定します。

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
  `false` は、バンドルまたはインストール済みであってもスキルを無効化します。
  `coding-agent` バンドルスキルはオプトインです。`skills.entries.coding-agent.enabled: true`
  を設定し、`claude`、`codex`、`opencode`、または別の対応 CLI のいずれかが
  インストール済みで認証済みであることを確認してください。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言するスキル向けの便利フィールド。
  平文文字列または SecretRef オブジェクトをサポートします。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  エージェント実行に注入される環境変数。変数がプロセス内でまだ設定されていない場合にのみ注入されます。
</ParamField>

<ParamField path="config" type="object">
  スキルごとのカスタム設定フィールド用の任意の入れ物。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **バンドル** スキルのみを対象にする任意の allowlist。設定すると、
  一覧内のバンドルスキルだけが対象になります。管理対象スキルとワークスペーススキルには影響しません。
</ParamField>

<Note>
  config キーはデフォルトで **スキル名** と一致します。スキルが
  `metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを `skills.entries`
  の下で使用してください。ハイフン付きの名前は引用してください。JSON5 は引用符付きキーを許可します。
</Note>

## 環境変数の注入

エージェント実行が開始されると、OpenClaw は次を行います。

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw はエージェントに対する有効なスキル一覧を解決し、ゲート制御ルール、
    allowlist、config の上書きを適用します。
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` が、
    実行中の `process.env` に適用されます。
  </Step>
  <Step title="Builds the system prompt">
    対象スキルはコンパクトな XML ブロックにコンパイルされ、システムプロンプトに注入されます。
  </Step>
  <Step title="Restores the environment">
    実行終了後、元の環境が復元されます。
  </Step>
</Steps>

<Warning>
  環境変数の注入は、サンドボックスではなく **ホスト** のエージェント実行にスコープされます。
  サンドボックス内では、`env` と `apiKey` は効果がありません。
  サンドボックス化された実行へシークレットを渡す方法については、
  [Skills config](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars) を参照してください。
</Warning>

バンドルされた `claude-cli` バックエンドでは、OpenClaw は同じ対象スキルのスナップショットを
一時的な Claude Code Plugin として実体化し、`--plugin-dir` 経由で渡します。
その他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は **セッション開始時** に対象スキルのスナップショットを作成し、
そのセッション内の以後すべてのターンで同じ一覧を再利用します。
スキルまたは config への変更は、次の新しいセッションで有効になります。

次の 2 つの場合、セッション中に Skills が更新されます。

- Skills watcher が `SKILL.md` の変更を検出した場合。
- 新しい対象リモートノードが接続した場合。

更新された一覧は、次のエージェントターンで取り込まれます。
有効なエージェント allowlist が変わった場合、OpenClaw は表示されるスキルを揃えるためにスナップショットを更新します。

<AccordionGroup>
  <Accordion title="Skills watcher">
    デフォルトでは、OpenClaw はスキルフォルダーを監視し、
    `SKILL.md` ファイルが変更されるとスナップショットを更新します。
    `skills.load` の下で設定します。

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    スキルルートのシンボリックリンクが設定済みルートの外側を指すような、
    意図的なシンボリックリンク構成には `allowSymlinkTargets` を使用してください。
    例: `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    Skill Workshop がそれらの信頼済みシンボリックリンク先パスを通じて提案も適用すべき場合にのみ、
    `skills.workshop.allowSymlinkTargetWrites` を有効にしてください。

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Gateway が Linux 上で実行されているが、`system.run` が許可された **macOS ノード** が接続されている場合、
    必要なバイナリがそのノード上に存在すれば、OpenClaw は macOS 専用スキルを対象として扱えます。
    エージェントはそれらのスキルを `host=node` 付きの `exec` ツールで実行する必要があります。

    オフラインのノードは、リモート専用スキルを表示対象にしません。
    ノードが bin プローブに応答しなくなった場合、OpenClaw はキャッシュ済みの bin 一致をクリアします。

  </Accordion>
</AccordionGroup>

## トークンへの影響

スキルが対象になると、OpenClaw はコンパクトな XML ブロックをシステムプロンプトに注入します。
コストは決定的で、スキルごとに線形に増加します。

- **基本オーバーヘッド**（1 つ以上のスキルが対象の場合のみ）: 導入文の固定ブロックと
  `<available_skills>` ラッパー。
- **スキルごと:** 約 97 文字 + `name`、`description`、`location` フィールドの長さ。
- XML エスケープは `& < > " '` をエンティティに展開し、出現ごとに数文字を追加します。
- 約 4 文字/トークンとして、97 文字はフィールド長を除いてスキルごとに約 24 トークンです。

レンダリングされたブロックが設定済みのプロンプト予算
（`skills.limits.maxSkillsPromptChars`）を超える場合、OpenClaw はまず説明を削除し
（コンパクト形式: name + location のみ）、その後スキル一覧を切り詰めて
`openclaw skills check` を指すメモを追加します。

プロンプトオーバーヘッドを最小化するため、説明は短く、内容が分かるものにしてください。

## 関連

<CardGroup cols={2}>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムスキルを作成するためのステップバイステップガイド。
  </Card>
  <Card title="スキルワークショップ" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きしたスキルの提案キュー。
  </Card>
  <Card title="Skills 設定" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマとエージェント許可リスト。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    スキルのスラッシュコマンドが登録およびルーティングされる仕組み。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    公開レジストリでスキルを閲覧および公開する。
  </Card>
  <Card title="Plugin" href="/ja-JP/tools/plugin" icon="plug">
    Plugin は、ドキュメント化するツールとともにスキルを同梱できます。
  </Card>
</CardGroup>
