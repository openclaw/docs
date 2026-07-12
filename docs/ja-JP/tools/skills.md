---
read_when:
    - Skills の追加または変更
    - スキルのゲーティング、許可リスト、または読み込みルールの変更
    - スキルの優先順位とスナップショットの動作を理解する
sidebarTitle: Skills
summary: Skills は、エージェントにツールの使い方を教えます。Skills の読み込み方法、優先順位の仕組み、ゲーティング、許可リスト、環境変数の注入を設定する方法について説明します。
title: Skills
x-i18n:
    generated_at: "2026-07-12T14:54:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills は、エージェントにツールを使用する方法とタイミングを教える Markdown 形式の指示ファイルです。各 Skill は、YAML フロントマターと Markdown 本文を含む `SKILL.md` ファイルが置かれたディレクトリに格納されます。OpenClaw は、同梱された Skills とローカルのオーバーライドを読み込み、環境、設定、バイナリの有無に基づいて読み込み時にフィルタリングします。

<CardGroup cols={2}>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム Skill をゼロから構築してテストします。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが作成した Skill の提案をレビューして承認します。
  </Card>
  <Card title="Skills の設定" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマとエージェントの許可リスト。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    コミュニティの Skills を参照してインストールします。
  </Card>
</CardGroup>

## 読み込み順序

OpenClaw は、次のソースから**優先順位の高い順**に読み込みます。同じ Skill 名が複数の場所に存在する場合、最も優先順位の高いソースが使用されます。

| 優先順位 | ソース | パス |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | ワークスペースの Skills | `<workspace>/skills` |
| 2 | プロジェクトエージェントの Skills | `<workspace>/.agents/skills` |
| 3 | 個人エージェントの Skills | `~/.agents/skills` |
| 4 | 管理対象 / ローカルの Skills | `~/.openclaw/skills` |
| 5 | 同梱された Skills | インストールに同梱 |
| 6 — 最低 | 追加ディレクトリ | `skills.load.extraDirs` + Plugin の Skills |

Skill のルートでは、グループ化されたレイアウトを使用できます。OpenClaw は、設定されたルート配下の任意の場所（最大 6 階層）に `SKILL.md` があると、その Skill を検出します。

```text
<workspace>/skills/research/SKILL.md          ✓ 「research」として検出
<workspace>/skills/personal/research/SKILL.md ✓ こちらも「research」として検出
```

フォルダーパスは整理のためだけに使用されます。Skill の名前とスラッシュコマンドは、フロントマターの `name` フィールド（`name` がない場合はディレクトリ名）から取得されます。エージェントの許可リスト（後述）も、この `name` に基づいて照合されます。

<Note>
  Codex CLI ネイティブの `$CODEX_HOME/skills` ディレクトリは、OpenClaw の Skill ルートでは**ありません**。`openclaw migrate plan codex` を使用してそれらの Skills を一覧化してから、`openclaw migrate codex` を使用して OpenClaw ワークスペースにコピーしてください。
</Note>

## Node でホストされる Skills

接続されたヘッドレス Node は、アクティブな OpenClaw の Skills ディレクトリ（デフォルトは `~/.openclaw/skills`。プロファイル環境によるオーバーライドが適用されます）にインストールされた Skills を公開できます。Node が接続されている間は通常のエージェント Skill リストに表示され、切断されると表示されなくなります。名前が競合した場合、ローカルまたは Gateway の Skill はその名前を維持し、Node の Skill には決定的な Node プレフィックス付きの名前が割り当てられます。Node ホスト型 v1 では、ディレクトリ名が Skill のフロントマターにある `name` フィールドと一致する必要があります。

Skill エントリには Node ロケーターが含まれます。そのファイル、相対参照、およびバイナリは Node 上に存在するため、`exec host=node node=<node-id>` を使用して読み込み、実行してください。Skill ファイルを変更した後は、Node ホストを再起動してください。ペアリングと無効化スイッチについては、[Nodes](/ja-JP/nodes#node-hosted-skills) を参照してください。

## エージェントごとの Skills と共有 Skills

マルチエージェント構成では、各エージェントに独自のワークスペースがあります。必要な可視範囲に対応するパスを使用してください。

| スコープ | パス | 表示対象 |
| -------------- | ---------------------------- | --------------------------- |
| エージェントごと | `<workspace>/skills` | そのエージェントのみ |
| プロジェクトエージェント | `<workspace>/.agents/skills` | そのワークスペースのエージェントのみ |
| 個人エージェント | `~/.agents/skills` | このマシン上のすべてのエージェント |
| 共有管理対象 | `~/.openclaw/skills` | このマシン上のすべてのエージェント |
| 追加ディレクトリ | `skills.load.extraDirs` | このマシン上のすべてのエージェント |

## エージェントの許可リスト

Skill の**場所**（優先順位）と Skill の**可視性**（どのエージェントが使用できるか）は、別々に制御されます。許可リストを使用すると、読み込み元に関係なく、エージェントに表示する Skills を制限できます。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // 共有ベースライン
    },
    list: [
      { id: "writer" }, // github、weather を継承
      { id: "docs", skills: ["docs-search"] }, // デフォルトを完全に置き換える
      { id: "locked-down", skills: [] }, // Skills なし
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="許可リストのルール">
    - デフォルトですべての Skills を制限なしにするには、`agents.defaults.skills` を省略します。
    - `agents.defaults.skills` を継承するには、`agents.list[].skills` を省略します。
    - そのエージェントに Skills を一切公開しない場合は、`agents.list[].skills: []` を設定します。
    - 空でない `agents.list[].skills` リストが**最終的な**セットになります。デフォルトとはマージされません。
    - 有効な許可リストは、プロンプトの構築、スラッシュコマンドの検出、サンドボックスの同期、Skill スナップショットのすべてに適用されます。
    - これはホストシェルの認可境界ではありません。同じエージェントが `exec` を使用できる場合は、サンドボックス化、OS ユーザーの分離、exec の拒否 / 許可リスト、リソースごとの認証情報を使用して、そのシェルを個別に制限してください。
  </Accordion>
</AccordionGroup>

## Plugin と Skills

Plugin は、`openclaw.plugin.json` に `skills` ディレクトリ（Plugin ルートからの相対パス）を列挙することで、独自の Skills を同梱できます。Plugin が有効になると Plugin の Skills が読み込まれます。たとえば、ブラウザー Plugin には、複数ステップのブラウザー操作用の `browser-automation` Skill が同梱されています。

Plugin の Skill ディレクトリは、`skills.load.extraDirs` と同じ低優先順位レベルでマージされるため、同じ名前の同梱、管理対象、エージェント、またはワークスペースの Skill がある場合は、そちらが優先されます。他の Skill と同様に、フロントマターの `metadata.openclaw.requires` を使用して、Plugin の Skill 自体の適格性を制御します。

Plugin システム全体については、[Plugins](/ja-JP/tools/plugin) と [ツール](/ja-JP/tools) を参照してください。

## Skill Workshop

[Skill Workshop](/ja-JP/tools/skill-workshop) は、エージェントとアクティブな Skill ファイルの間にある提案キューです。エージェントが再利用可能な作業を見つけると、`SKILL.md` に直接書き込む代わりに提案の下書きを作成します。変更が行われる前に、その提案をレビューして承認します。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完全なライフサイクル、CLI リファレンス、および設定については、[Skill Workshop](/ja-JP/tools/skill-workshop) を参照してください。

## ClawHub からのインストール

[ClawHub](https://clawhub.ai) は公開 Skills レジストリです。インストールと更新には `openclaw skills` コマンドを使用し、公開と同期には `clawhub` CLI を使用します。

| 操作 | コマンド |
| ---------------------------------- | ------------------------------------------------------ |
| ワークスペースに Skill をインストール | `openclaw skills install @owner/<slug>` |
| Git リポジトリからインストール | `openclaw skills install git:owner/repo@ref` |
| ローカルの Skill ディレクトリをインストール | `openclaw skills install ./path/to/skill --as my-tool` |
| すべてのローカルエージェント用にインストール | `openclaw skills install @owner/<slug> --global` |
| ワークスペースのすべての Skills を更新 | `openclaw skills update --all` |
| 共有管理対象の Skill を更新 | `openclaw skills update @owner/<slug> --global` |
| 共有管理対象のすべての Skills を更新 | `openclaw skills update --all --global` |
| Skill の信頼エンベロープを検証 | `openclaw skills verify @owner/<slug>` |
| 生成された Skill Card を出力 | `openclaw skills verify @owner/<slug> --card` |
| ClawHub CLI を介して公開 / 同期 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="インストールの詳細">
    `openclaw skills install` は、デフォルトでアクティブなワークスペースの `skills/` ディレクトリにインストールします。共有の `~/.openclaw/skills` ディレクトリにインストールするには `--global` を追加します。エージェントの許可リストで範囲が狭められていない限り、すべてのローカルエージェントから参照できます。

    Git およびローカルインストールでは、ソースルートに `SKILL.md` が必要です。有効な場合、スラッグは `SKILL.md` のフロントマターにある `name` から取得され、それ以外の場合はディレクトリ名またはリポジトリ名が使用されます。上書きするには `--as <slug>` を使用します。
    `openclaw skills update` が追跡するのは ClawHub からのインストールのみです。Git またはローカルソースを更新するには、再インストールしてください。

  </Accordion>
  <Accordion title="検証とセキュリティスキャン">
    `openclaw skills verify @owner/<slug>` は、Skill の `clawhub.skill.verify.v1` 信頼エンベロープを ClawHub に問い合わせます。インストール済みの ClawHub Skills は、`.clawhub/origin.json` に記録されたバージョンとレジストリに対して検証されます。
    所有者なしのスラッグも、既存のインストール済み Skill または一意に特定できる Skill では引き続き使用できますが、所有者付きの参照を使用すると公開者の曖昧さを回避できます。

    ClawHub の Skill ページには、インストール前に最新のセキュリティスキャン状態が表示され、VirusTotal、ClawScan、および静的解析の詳細ページも提供されます。ClawHub が検証失敗と判定した場合、コマンドはゼロ以外で終了します。公開者は、ClawHub ダッシュボードまたは `clawhub skill rescan @owner/<slug>` を使用して誤検知から復旧できます。

  </Accordion>
  <Accordion title="プライベートアーカイブからのインストール">
    ClawHub 以外の配信が必要な Gateway クライアントは、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit` を使用して ZIP 形式の Skill アーカイブをステージングし、その後 `skills.install({ source: "upload", ... })` でインストールできます。このパスはデフォルトで無効になっており、`openclaw.json` で `skills.install.allowUploadedArchives: true` を設定する必要があります。通常の ClawHub インストールでは、この設定は不要です。
  </Accordion>
</AccordionGroup>

## セキュリティ

<Warning>
  サードパーティ製 Skills は**信頼できないコード**として扱ってください。有効にする前に内容を確認してください。信頼できない入力やリスクの高いツールには、サンドボックス化された実行を推奨します。エージェント側の制御については、[サンドボックス化](/ja-JP/gateway/sandboxing) を参照してください。
</Warning>

<AccordionGroup>
  <Accordion title="パスの包含">
    ワークスペース、プロジェクトエージェント、追加ディレクトリからの Skill 検出では、`skills.load.allowSymlinkTargets` で対象ルートが明示的に信頼されている場合を除き、解決後の realpath が設定されたルート内に収まる Skill ルートのみを受け入れます。
    Skill Workshop は、`skills.workshop.allowSymlinkTargetWrites` が有効な場合にのみ、それらの信頼された対象へ書き込みます。
    管理対象の `~/.openclaw/skills` と個人用の `~/.agents/skills` には、シンボリックリンクされた Skill フォルダーを含めることができますが、各 `SKILL.md` の realpath は、解決後の Skill ディレクトリ内に収まる必要があります。
  </Accordion>
  <Accordion title="運用者のインストールポリシー">
    Skill のインストールを続行する前に信頼されたローカルポリシーコマンドを実行するよう、`security.installPolicy` を設定します。このポリシーはメタデータとステージングされたソースパスを受け取り、ClawHub、アップロード、Git、ローカル、更新、および依存関係インストーラーの各パスに適用されます。コマンドが有効な決定を返せない場合は、フェイルクローズします。
  </Accordion>
  <Accordion title="シークレットの注入範囲">
    `skills.entries.*.env` と `skills.entries.*.apiKey` は、そのエージェントターン中のみ**ホスト**プロセスにシークレットを注入します。サンドボックスには注入されません。シークレットをプロンプトやログに含めないでください。
  </Accordion>
</AccordionGroup>

より広範な脅威モデルとセキュリティチェックリストについては、[セキュリティ](/ja-JP/gateway/security) を参照してください。

## SKILL.md の形式

すべての Skill では、少なくともフロントマターに `name` と `description` が必要です。

```markdown
---
name: image-lab
description: プロバイダーを利用した画像ワークフローで画像を生成または編集する
---

ユーザーから画像の生成を依頼されたら、`image_generate` ツールを使用します...
```

<Note>
  OpenClaw は [AgentSkills](https://agentskills.io) 仕様に準拠しています。フロントマターは
  最初に YAML として解析されます。失敗した場合は、単一行専用の
  パーサーにフォールバックします。ネストされた `metadata` ブロック（複数行の YAML マッピングを含む）は
  JSON 文字列にフラット化され、JSON5 として再解析されるため、
  [ゲーティング](#gating) に示すブロック形式を使用できます。本文内で
  skill フォルダーのパスを参照するには `{baseDir}` を使用してください。
</Note>

### オプションのフロントマターキー

<ParamField path="homepage" type="string">
  macOS の Skills UI で "Website" として表示される URL。
  `metadata.openclaw.homepage` 経由でも指定できます。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、skill はユーザーが呼び出せるスラッシュコマンドとして公開されます。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw は skill の指示をエージェントの通常の
  プロンプトに含めません。`user-invocable` も `true` の場合、
  skill は引き続きスラッシュコマンドとして利用できます。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルを経由せず、
  登録済みのツールへ直接ディスパッチされます。
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールへのディスパッチでは、コアによる解析を行わず、生の引数文字列を
  ツールに渡します。ツールは
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
  を受け取ります。
</ParamField>

## ゲーティング

OpenClaw はロード時に `metadata.openclaw`（フロントマターに埋め込まれた
JSON5 オブジェクト。上記の解析に関する注記を参照）を使用して skill をフィルタリングします。
`metadata.openclaw` ブロックがない skill は、明示的に無効化されていない限り常に対象になります。

```markdown
---
name: image-lab
description: プロバイダー対応の画像ワークフローを介して画像を生成または編集する
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
  `true` の場合、skill を常に含め、他のすべてのゲートをスキップします。
</ParamField>

<ParamField path="emoji" type="string">
  macOS の Skills UI に表示されるオプションの絵文字。
</ParamField>

<ParamField path="homepage" type="string">
  macOS の Skills UI で "Website" として表示されるオプションの URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  プラットフォームフィルター。設定すると、skill は列挙された OS でのみ対象になります。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  各バイナリが `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つのバイナリが `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.env" type="string[]">
  各環境変数がプロセスに存在するか、設定を介して提供される必要があります。
</ParamField>

<ParamField path="requires.config" type="string[]">
  各 `openclaw.json` パスが truthy である必要があります。
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられる環境変数名。
</ParamField>

<ParamField path="install" type="object[]">
  macOS の Skills UI で使用されるオプションのインストーラー仕様（brew / node / go / uv / download）。
</ParamField>

<Note>
  `metadata.openclaw` が存在しない場合、従来の `metadata.clawdbot` ブロックも
  引き続き受け入れられるため、以前にインストールされた skill の
  依存関係ゲートとインストーラーのヒントは維持されます。新しい skill では
  `metadata.openclaw` を使用してください。
</Note>

### インストーラー仕様

インストーラー仕様は、依存関係のインストール方法を macOS の Skills UI に伝えます。

```markdown
---
name: gemini
description: コーディング支援と Google 検索の参照に Gemini CLI を使用する。
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
              "label": "Gemini CLI をインストール（brew）",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="インストーラーの選択ルール">
    - 複数のインストーラーが列挙されている場合、Gateway は優先する
      オプションを 1 つ選択します（利用可能なら brew、それ以外は node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は各エントリを列挙し、
      利用可能なすべてのアーティファクトを確認できるようにします。
    - 仕様には `os: ["darwin"|"linux"|"win32"]` を含め、プラットフォームでフィルタリングできます。
    - Node のインストールでは、`openclaw.json` の `skills.install.nodeManager`
      が使用されます（デフォルト: npm、選択肢: npm / pnpm / yarn / bun）。これは skill の
      インストールにのみ影響します。Gateway ランタイムには引き続き Node を使用してください。
    - Gateway のインストーラー優先順位: Homebrew → uv → 設定済みの node マネージャー →
      go → download。
  </Accordion>
  <Accordion title="インストーラーごとの詳細">
    - **Homebrew:** OpenClaw は Homebrew を自動インストールせず、brew の
      formula をシステムパッケージコマンドに変換しません。`brew` がない Linux コンテナでは、
      brew 専用インストーラーは非表示になります。カスタムイメージを使用するか、
      依存関係を手動でインストールしてください。
    - **Go:** skill の自動インストールには、OpenClaw は Go 1.21 以降を必要とします。
      `go` がなく Homebrew が利用可能な場合、OpenClaw は最初に
      Homebrew 経由で Go をインストールします。Homebrew がない Linux では、更新後の
      `golang-go` 候補が最低バージョンを満たす場合、root またはパスワード不要の
      `sudo` を介して `apt-get` を代わりに使用できます。依存関係に対する実際の
      `go install` は、設定された `GOBIN` ではなく、常に OpenClaw が管理する専用の
      bin ディレクトリ（新規インストールでは Homebrew の `bin`、それ以外では
      `~/.local/bin`）を対象とします。独自の `GOBIN`、`GOPATH`、`GOTOOLCHAIN`
      環境変数は読み取られますが、上書きされることはありません。
    - **Download:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（デフォルト: アーカイブ検出時は auto）、`stripComponents`、
      `targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="サンドボックス化に関する注記">
    `requires.bins` は skill のロード時に **ホスト** 上で確認されます。エージェントが
    サンドボックス内で実行される場合、バイナリは **コンテナ内** にも存在する必要があります。
    `agents.defaults.sandbox.docker.setupCommand` またはカスタム
    イメージを介してインストールしてください。`setupCommand` はコンテナ作成後に一度実行され、
    ネットワークへの外向き通信、書き込み可能なルート FS、サンドボックス内の root ユーザーが必要です。
  </Accordion>
</AccordionGroup>

## 設定の上書き

`~/.openclaw/openclaw.json` の `skills.entries` 配下で、同梱または管理対象の
skill を切り替えて設定します。

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
  `false` にすると、同梱またはインストール済みであっても skill が無効になります。
  同梱の `coding-agent` skill はオプトインです。
  `skills.entries.coding-agent.enabled: true` を設定し、`claude`、`codex`、
  `opencode`、またはサポートされている別の CLI のいずれかが
  インストールおよび認証済みであることを確認してください。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する skill 向けの便利なフィールドです。
  プレーンテキスト文字列または SecretRef オブジェクトをサポートします。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  エージェント実行時に注入される環境変数。変数がプロセスにまだ設定されていない場合にのみ
  注入されます。
</ParamField>

<ParamField path="config" type="object">
  skill ごとのカスタム設定フィールドを格納するオプションの領域。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **同梱** skill のみに適用されるオプションの許可リスト。設定すると、リスト内の同梱 skill
  のみが対象になります。管理対象およびワークスペースの skill には影響しません。
</ParamField>

<Note>
  設定キーはデフォルトで **skill 名** と一致します。skill が
  `metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを
  `skills.entries` 配下で使用してください。ハイフンを含む名前は引用符で囲んでください。
  JSON5 では引用符付きキーを使用できます。
</Note>

## 環境変数の注入

エージェント実行が開始されると、OpenClaw は次を行います。

<Steps>
  <Step title="skill メタデータを読み取る">
    OpenClaw はエージェントに対する有効な skill リストを解決し、ゲーティング
    ルール、許可リスト、設定の上書きを適用します。
  </Step>
  <Step title="環境変数と API キーを注入する">
    `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` が、実行中のみ
    `process.env` に適用されます。
  </Step>
  <Step title="システムプロンプトを構築する">
    対象の skill はコンパクトな XML ブロックにまとめられ、
    システムプロンプトへ注入されます。
  </Step>
  <Step title="環境を復元する">
    実行終了後、元の環境が復元されます。
  </Step>
</Steps>

<Warning>
  環境変数の注入はサンドボックスではなく、**ホスト** 上のエージェント実行に限定されます。
  サンドボックス内では、`env` と `apiKey` は効果がありません。サンドボックス化された実行へ
  シークレットを渡す方法については、
  [Skills の設定](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars) を参照してください。
</Warning>

同梱の `claude-cli` バックエンドでは、OpenClaw は同じ対象 skill のスナップショットを
一時的な Claude Code Plugin としても具現化し、`--plugin-dir` を介して渡します。
その他の CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は **セッション開始時** に対象の skill のスナップショットを作成し、
セッション内の後続のすべてのターンでそのリストを再利用します。skill または設定への変更は、
次の新しいセッションで有効になります。

セッション途中で skill が更新されるのは、次の 2 つの場合です。

- skill ウォッチャーが `SKILL.md` の変更を検出した場合。
- 新しい対象のリモート node が接続した場合。

更新されたリストは、次のエージェントターンで反映されます。有効なエージェントの
許可リストが変更された場合、OpenClaw は表示される skill との整合性を保つために
スナップショットを更新します。

<AccordionGroup>
  <Accordion title="skill ウォッチャー">
    デフォルトでは、OpenClaw は skill フォルダーを監視し、
    `SKILL.md` ファイルが変更されるとスナップショットを更新します。
    `skills.load` 配下で設定します。

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // デフォルト
          watchDebounceMs: 250, // デフォルト
        },
      },
    }
    ```

    skill ルートのシンボリックリンクが設定済みのルート外を指す、意図的な
    シンボリックリンク構成では `allowSymlinkTargets` を使用してください。例:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    Skill Workshop がこれらの信頼済みシンボリックリンクパスを介して提案も適用する必要がある場合にのみ、
    `skills.workshop.allowSymlinkTargetWrites` を有効にしてください。

  </Accordion>
  <Accordion title="リモート macOS node（Linux Gateway）">
    Gateway が Linux 上で実行されていても、`system.run` が許可された
    **macOS node** が接続されている場合、必要なバイナリがその node 上に存在すれば、
    OpenClaw は macOS 専用 skill を対象として扱えます。エージェントは
    `host=node` を指定した `exec` ツールを介してそれらの skill を実行してください。

    オフラインの node によって、リモート専用 skill が表示されることは **ありません**。
    node がバイナリプローブに応答しなくなると、OpenClaw はキャッシュされた
    バイナリ一致情報を消去します。

  </Accordion>
</AccordionGroup>

## トークンへの影響

対象の skill がある場合、OpenClaw はコンパクトな XML ブロックをシステム
プロンプトに注入します。コストは決定論的で、skill ごとに線形に増加します。

- **基本オーバーヘッド**（1 つ以上の skill が対象の場合のみ）: 導入文と
  `<available_skills>` ラッパーから成る固定ブロック。
- **skill ごと:** 約 97 文字 + `name`、`description`、`location`
  フィールドの文字数。
- XML エスケープにより `& < > " '` がエンティティへ展開され、出現ごとに数文字追加されます。
- 約 4 文字/トークンの場合、フィールド長を除いて 97 文字 ≈ skill ごとに 24 トークン。

レンダリングされたブロックが設定済みのプロンプト予算
（`skills.limits.maxSkillsPromptChars`）を超える場合、OpenClaw はまず、説明を含まないコンパクト形式に収まる限り多くの Skills の
識別情報（名前、場所、バージョン）を保持します。その後、残りの予算を短縮した説明に使用します。説明用の
予算が残っていない場合、説明は省略されます。コンパクト形式への変換またはリストの
切り詰めが必要な場合、プロンプトには `openclaw skills check` を案内する注記が含まれます。

プロンプトのオーバーヘッドを最小限に抑えるため、説明は短く具体的にしてください。

## 関連項目

<CardGroup cols={2}>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム Skill を作成するためのステップバイステップガイド。
  </Card>
  <Card title="Skill ワークショップ" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きした Skills の提案キュー。
  </Card>
  <Card title="Skills の設定" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマとエージェントの許可リスト。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    Skill のスラッシュコマンドが登録され、ルーティングされる仕組み。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    公開レジストリで Skills を閲覧、公開します。
  </Card>
  <Card title="プラグイン" href="/ja-JP/tools/plugin" icon="plug">
    プラグインは、ドキュメント化するツールとともに Skills を配布できます。
  </Card>
</CardGroup>
