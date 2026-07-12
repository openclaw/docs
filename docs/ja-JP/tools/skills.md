---
read_when:
    - Skills の追加または変更
    - スキルのゲーティング、許可リスト、または読み込みルールの変更
    - Skills の優先順位とスナップショットの動作を理解する
sidebarTitle: Skills
summary: Skills は、エージェントにツールの使い方を教えます。Skills の読み込み方法、優先順位の仕組み、ゲーティング、許可リスト、環境変数の注入を設定する方法について説明します。
title: Skills
x-i18n:
    generated_at: "2026-07-11T22:47:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skillsは、エージェントにツールの使い方と使用するタイミングを教えるMarkdown形式の指示ファイルです。各Skillは、YAMLフロントマターとMarkdown本文を含む`SKILL.md`ファイルが置かれたディレクトリに格納されます。OpenClawは、同梱されたSkillsとローカルのオーバーライドを読み込み、環境、設定、バイナリの有無に基づいて読み込み時にフィルタリングします。

<CardGroup cols={2}>
  <Card title="Skillsの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムSkillをゼロから作成してテストします。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが作成したSkillの提案を確認し、承認します。
  </Card>
  <Card title="Skillsの設定" href="/ja-JP/tools/skills-config" icon="gear">
    `skills.*`の完全な設定スキーマとエージェント許可リストです。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    コミュニティのSkillsを閲覧してインストールします。
  </Card>
</CardGroup>

## 読み込み順序

OpenClawは、以下のソースから**優先順位の高い順**に読み込みます。同じSkill名が複数の場所に存在する場合は、最も優先順位の高いソースが使用されます。

| 優先順位 | ソース | パス |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | ワークスペースのSkills | `<workspace>/skills` |
| 2 | プロジェクトエージェントのSkills | `<workspace>/.agents/skills` |
| 3 | 個人エージェントのSkills | `~/.agents/skills` |
| 4 | 管理対象／ローカルのSkills | `~/.openclaw/skills` |
| 5 | 同梱されたSkills | インストールに同梱 |
| 6 — 最低 | 追加ディレクトリ | `skills.load.extraDirs` + PluginのSkills |

Skillルートではグループ化されたレイアウトを使用できます。OpenClawは、設定されたルート以下（最大6階層）に`SKILL.md`があれば、そのSkillを検出します。

```text
<workspace>/skills/research/SKILL.md          ✓ 「research」として検出
<workspace>/skills/personal/research/SKILL.md ✓ これも「research」として検出
```

フォルダパスは整理のためだけに使用されます。Skill名とスラッシュコマンドは、フロントマターの`name`フィールドから取得されます（`name`がない場合はディレクトリ名）。以下のエージェント許可リストも、この`name`に対して照合されます。

<Note>
  Codex CLI固有の`$CODEX_HOME/skills`ディレクトリは、OpenClawのSkillルートでは**ありません**。`openclaw migrate plan codex`を使用してそれらのSkillsを一覧化し、その後`openclaw migrate codex`を使用してOpenClawワークスペースにコピーしてください。
</Note>

## NodeでホストされるSkills

接続中のヘッドレスNodeは、アクティブなOpenClaw Skillsディレクトリ（既定では`~/.openclaw/skills`。プロファイル環境によるオーバーライドが適用されます）にインストールされたSkillsを公開できます。Nodeが接続されている間は通常のエージェントSkill一覧に表示され、切断されると表示されなくなります。名前が衝突した場合、ローカルまたはGatewayのSkillはその名前を維持し、NodeのSkillには決定論的なNodeプレフィックス付きの名前が割り当てられます。Nodeホスト型v1では、ディレクトリ名がSkillのフロントマターにある`name`フィールドと一致している必要があります。

SkillエントリにはNodeロケーターが含まれます。そのファイル、相対参照、バイナリはNode上に存在するため、`exec host=node node=<node-id>`を使用して読み込み、実行してください。Skillファイルを変更した後は、Nodeホストを再起動してください。ペアリングと無効化スイッチについては、[Nodes](/ja-JP/nodes#node-hosted-skills)を参照してください。

## エージェントごとのSkillsと共有Skills

マルチエージェント構成では、各エージェントにそれぞれ独自のワークスペースがあります。希望する公開範囲に合うパスを使用してください。

| スコープ | パス | 表示対象 |
| -------------- | ---------------------------- | --------------------------- |
| エージェントごと | `<workspace>/skills` | そのエージェントのみ |
| プロジェクトエージェント | `<workspace>/.agents/skills` | そのワークスペースのエージェントのみ |
| 個人エージェント | `~/.agents/skills` | このマシン上のすべてのエージェント |
| 共有管理対象 | `~/.openclaw/skills` | このマシン上のすべてのエージェント |
| 追加ディレクトリ | `skills.load.extraDirs` | このマシン上のすべてのエージェント |

## エージェント許可リスト

Skillの**場所**（優先順位）とSkillの**可視性**（どのエージェントが使用できるか）は、別々に制御されます。Skillsがどこから読み込まれたかに関係なく、エージェントに表示されるSkillsを制限するには許可リストを使用します。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // 共有ベースライン
    },
    list: [
      { id: "writer" }, // github、weatherを継承
      { id: "docs", skills: ["docs-search"] }, // 既定値を完全に置換
      { id: "locked-down", skills: [] }, // Skillsなし
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="許可リストのルール">
    - 既定ですべてのSkillsを無制限にするには、`agents.defaults.skills`を省略します。
    - `agents.defaults.skills`を継承するには、`agents.list[].skills`を省略します。
    - そのエージェントにSkillsを一切公開しない場合は、`agents.list[].skills: []`を設定します。
    - 空でない`agents.list[].skills`リストが**最終的な**セットです。既定値とはマージされません。
    - 有効な許可リストは、プロンプトの構築、スラッシュコマンドの検出、サンドボックスの同期、Skillスナップショットのすべてに適用されます。
    - これはホストシェルの認可境界ではありません。同じエージェントが`exec`を使用できる場合は、サンドボックス化、OSユーザーの分離、execの拒否／許可リスト、リソースごとの認証情報を使用して、そのシェルを別途制限してください。
  </Accordion>
</AccordionGroup>

## PluginとSkills

Pluginは、`openclaw.plugin.json`に`skills`ディレクトリ（Pluginルートからの相対パス）を列挙することで、独自のSkillsを同梱できます。PluginのSkillsは、そのPluginが有効な場合に読み込まれます。たとえば、ブラウザーPluginには、複数ステップのブラウザー操作に使用する`browser-automation` Skillが同梱されています。

PluginのSkillディレクトリは`skills.load.extraDirs`と同じ低い優先順位でマージされるため、同名の同梱、管理対象、エージェント、またはワークスペースのSkillがそれらをオーバーライドします。ほかのSkillと同様に、フロントマターの`metadata.openclaw.requires`を使用してPluginのSkill自体の適格性を制御します。

Pluginシステム全体については、[Plugins](/ja-JP/tools/plugin)と[ツール](/ja-JP/tools)を参照してください。

## Skill Workshop

[Skill Workshop](/ja-JP/tools/skill-workshop)は、エージェントとアクティブなSkillファイルの間に置かれる提案キューです。エージェントが再利用可能な作業を見つけると、`SKILL.md`に直接書き込む代わりに提案の下書きを作成します。何かが変更される前に、その提案を確認して承認します。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

ライフサイクル全体、CLIリファレンス、設定については、[Skill Workshop](/ja-JP/tools/skill-workshop)を参照してください。

## ClawHubからのインストール

[ClawHub](https://clawhub.ai)は公開Skillsレジストリです。インストールと更新には`openclaw skills`コマンドを、公開と同期には`clawhub` CLIを使用します。

| 操作 | コマンド |
| ---------------------------------- | ------------------------------------------------------ |
| Skillをワークスペースにインストール | `openclaw skills install @owner/<slug>` |
| Gitリポジトリからインストール | `openclaw skills install git:owner/repo@ref` |
| ローカルSkillディレクトリをインストール | `openclaw skills install ./path/to/skill --as my-tool` |
| すべてのローカルエージェント用にインストール | `openclaw skills install @owner/<slug> --global` |
| ワークスペースのすべてのSkillsを更新 | `openclaw skills update --all` |
| 共有管理対象Skillを更新 | `openclaw skills update @owner/<slug> --global` |
| 共有管理対象のすべてのSkillsを更新 | `openclaw skills update --all --global` |
| Skillの信頼エンベロープを検証 | `openclaw skills verify @owner/<slug>` |
| 生成されたSkill Cardを出力 | `openclaw skills verify @owner/<slug> --card` |
| ClawHub CLI経由で公開／同期 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="インストールの詳細">
    `openclaw skills install`は、既定でアクティブなワークスペースの`skills/`ディレクトリにインストールします。`--global`を追加すると、共有の`~/.openclaw/skills`ディレクトリにインストールされ、エージェント許可リストで制限されない限り、すべてのローカルエージェントに表示されます。

    Gitおよびローカルからのインストールでは、ソースルートに`SKILL.md`が必要です。有効な場合、スラッグには`SKILL.md`のフロントマターにある`name`が使用され、それ以外の場合はディレクトリ名またはリポジトリ名が使用されます。上書きするには`--as <slug>`を使用します。
    `openclaw skills update`が追跡するのはClawHubからのインストールのみです。Gitまたはローカルソースを更新するには、再インストールしてください。

  </Accordion>
  <Accordion title="検証とセキュリティスキャン">
    `openclaw skills verify @owner/<slug>`は、Skillの`clawhub.skill.verify.v1`信頼エンベロープをClawHubに要求します。インストール済みのClawHub Skillsは、`.clawhub/origin.json`に記録されたバージョンとレジストリに対して検証されます。
    所有者を含まないスラッグも、既存のインストール済みSkillまたは一意に特定できるSkillでは引き続き受け付けられますが、所有者で修飾した参照を使用すると公開者の曖昧さを避けられます。

    ClawHubのSkillページでは、インストール前に最新のセキュリティスキャン状態が表示され、VirusTotal、ClawScan、静的解析の詳細ページも提供されます。ClawHubが検証を失敗と判定した場合、コマンドは0以外の終了コードで終了します。公開者は、ClawHubダッシュボードまたは`clawhub skill rescan @owner/<slug>`を使用して誤検知から復旧できます。

  </Accordion>
  <Accordion title="プライベートアーカイブからのインストール">
    ClawHub以外の配信が必要なGatewayクライアントは、`skills.upload.begin`、`skills.upload.chunk`、`skills.upload.commit`を使用してzip形式のSkillアーカイブをステージングし、その後`skills.install({ source: "upload", ... })`でインストールできます。この経路は既定で無効になっており、`openclaw.json`で`skills.install.allowUploadedArchives: true`を設定する必要があります。通常のClawHubからのインストールでは、この設定は不要です。
  </Accordion>
</AccordionGroup>

## セキュリティ

<Warning>
  サードパーティのSkillsは**信頼されていないコード**として扱ってください。有効化する前に内容を確認してください。信頼されていない入力やリスクの高いツールには、サンドボックス化された実行を推奨します。エージェント側の制御については、[サンドボックス化](/ja-JP/gateway/sandboxing)を参照してください。
</Warning>

<AccordionGroup>
  <Accordion title="パスの封じ込め">
    ワークスペース、プロジェクトエージェント、追加ディレクトリでのSkill検出では、`skills.load.allowSymlinkTargets`によって対象ルートが明示的に信頼されている場合を除き、解決後のrealpathが設定されたルート内に収まるSkillルートのみを受け付けます。
    Skill Workshopは、`skills.workshop.allowSymlinkTargetWrites`が有効な場合に限り、それらの信頼された対象を通じて書き込みます。
    管理対象の`~/.openclaw/skills`と個人用の`~/.agents/skills`にはシンボリックリンクされたSkillフォルダを含められますが、すべての`SKILL.md`のrealpathは、解決後のSkillディレクトリ内に収まる必要があります。
  </Accordion>
  <Accordion title="運用者のインストールポリシー">
    Skillのインストールを続行する前に、信頼されたローカルポリシーコマンドを実行するよう`security.installPolicy`を設定します。ポリシーはメタデータとステージング済みソースパスを受け取り、ClawHub、アップロード、Git、ローカル、更新、依存関係インストーラーの各経路に適用されます。コマンドが有効な判定を返せない場合は、拒否側に倒れます。
  </Accordion>
  <Accordion title="シークレット注入のスコープ">
    `skills.entries.*.env`と`skills.entries.*.apiKey`は、そのエージェントターンの間だけ、シークレットを**ホスト**プロセスに注入します。サンドボックスには注入されません。プロンプトやログにシークレットを含めないでください。
  </Accordion>
</AccordionGroup>

より広範な脅威モデルとセキュリティチェックリストについては、[セキュリティ](/ja-JP/gateway/security)を参照してください。

## SKILL.mdの形式

すべてのSkillには、少なくともフロントマターに`name`と`description`が必要です。

```markdown
---
name: image-lab
description: プロバイダーを使用する画像ワークフローで画像を生成または編集する
---

ユーザーが画像の生成を依頼した場合は、`image_generate`ツールを使用します...
```

<Note>
  OpenClaw は [AgentSkills](https://agentskills.io) 仕様に従います。フロントマターは
  最初に YAML として解析されます。失敗した場合は、単一行専用の
  パーサーにフォールバックします。ネストされた `metadata` ブロック（複数行の YAML マッピングを含む）は
  JSON 文字列にフラット化され、JSON5 として再解析されるため、
  [ゲーティング](#gating) に示すブロック形式が機能します。本文内で
  スキルフォルダーのパスを参照するには `{baseDir}` を使用します。
</Note>

### 省略可能なフロントマターキー

<ParamField path="homepage" type="string">
  macOS の Skills UI で「ウェブサイト」として表示される URL。`metadata.openclaw.homepage`
  でも指定できます。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  `true` の場合、スキルはユーザーが呼び出せるスラッシュコマンドとして公開されます。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  `true` の場合、OpenClaw はスキルの指示をエージェントの通常の
  プロンプトに含めません。`user-invocable` も `true` の場合、
  スキルは引き続きスラッシュコマンドとして使用できます。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` に設定すると、スラッシュコマンドはモデルを経由せず、
  登録済みツールへ直接ディスパッチされます。
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` が設定されている場合に呼び出すツール名。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  ツールへのディスパッチでは、コア側で解析せず、生の引数文字列をツールへ
  転送します。ツールは
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`
  を受け取ります。
</ParamField>

## ゲーティング

OpenClaw は、フロントマターに埋め込まれた JSON5 オブジェクトである
`metadata.openclaw` を使用して、読み込み時にスキルを絞り込みます
（上記の解析に関する注記を参照）。`metadata.openclaw` ブロックがないスキルは、
明示的に無効化されていない限り、常に使用対象になります。

```markdown
---
name: image-lab
description: プロバイダーを利用した画像ワークフローで画像を生成または編集する
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
  `true` の場合、常にスキルを含め、ほかのすべてのゲートをスキップします。
</ParamField>

<ParamField path="emoji" type="string">
  macOS の Skills UI に表示される省略可能な絵文字。
</ParamField>

<ParamField path="homepage" type="string">
  macOS の Skills UI で「ウェブサイト」として表示される省略可能な URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  プラットフォームフィルター。設定すると、一覧に含まれる OS 上でのみスキルが使用対象になります。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  各バイナリが `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  少なくとも 1 つのバイナリが `PATH` 上に存在する必要があります。
</ParamField>

<ParamField path="requires.env" type="string[]">
  各環境変数がプロセス内に存在するか、設定から提供される必要があります。
</ParamField>

<ParamField path="requires.config" type="string[]">
  各 `openclaw.json` パスが真値である必要があります。
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` に関連付けられる環境変数名。
</ParamField>

<ParamField path="install" type="object[]">
  macOS の Skills UI で使用される省略可能なインストーラー仕様（brew / node / go / uv / download）。
</ParamField>

<Note>
  `metadata.openclaw` が存在しない場合は、従来の `metadata.clawdbot`
  ブロックも引き続き受け入れられるため、以前にインストールされたスキルでも
  依存関係ゲートとインストーラーのヒントが維持されます。新しいスキルでは
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
  <Accordion title="インストーラーの選択規則">
    - 複数のインストーラーが指定されている場合、Gateway は優先する
      選択肢を 1 つ選びます（利用可能なら brew、そうでなければ node）。
    - すべてのインストーラーが `download` の場合、OpenClaw は利用可能な
      すべての成果物を確認できるよう、各エントリーを一覧表示します。
    - 仕様に `os: ["darwin"|"linux"|"win32"]` を含めると、プラットフォームで絞り込めます。
    - Node のインストールでは、`openclaw.json` の `skills.install.nodeManager`
      が使用されます（デフォルト: npm、選択肢: npm / pnpm / yarn / bun）。これはスキルの
      インストールにのみ影響します。Gateway ランタイムには引き続き Node を使用してください。
    - Gateway のインストーラー優先順位: Homebrew → uv → 設定済みの node マネージャー →
      go → download。
  </Accordion>
  <Accordion title="インストーラーごとの詳細">
    - **Homebrew:** OpenClaw は Homebrew を自動インストールせず、brew の
      formula をシステムパッケージコマンドに変換することもありません。`brew` のない
      Linux コンテナでは brew 専用インストーラーは非表示になります。カスタムイメージを使用するか、
      依存関係を手動でインストールしてください。
    - **Go:** OpenClaw によるスキルの自動インストールには Go 1.21 以降が必要です。
      `go` がなく Homebrew が利用可能な場合、OpenClaw はまず Homebrew 経由で
      Go をインストールします。Homebrew のない Linux では、更新後の `golang-go`
      候補が最低バージョンを満たしていれば、root として、またはパスワード不要の `sudo`
      経由で `apt-get` を使用できます。依存関係に対する実際の `go install` は、
      設定済みの `GOBIN` ではなく、常に OpenClaw が管理する専用の bin ディレクトリ
      （新規インストール時は Homebrew の `bin`、それ以外は `~/.local/bin`）を対象とします。
      独自の `GOBIN`、`GOPATH`、`GOTOOLCHAIN` 環境変数は読み取られますが、
      上書きされることはありません。
    - **ダウンロード:** `url`（必須）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（デフォルト: アーカイブ検出時に自動）、`stripComponents`、
      `targetDir`（デフォルト: `~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="サンドボックス化に関する注記">
    `requires.bins` はスキルの読み込み時に **ホスト** 上で確認されます。エージェントが
    サンドボックス内で実行される場合、バイナリは **コンテナ内** にも存在する必要があります。
    `agents.defaults.sandbox.docker.setupCommand` またはカスタムイメージを使用して
    インストールしてください。`setupCommand` はコンテナ作成後に一度だけ実行され、
    外部へのネットワーク接続、書き込み可能なルートファイルシステム、サンドボックス内の root ユーザーが必要です。
  </Accordion>
</AccordionGroup>

## 設定による上書き

`~/.openclaw/openclaw.json` の `skills.entries` で、バンドル済みまたは
管理対象のスキルを有効化し、設定します。

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
  `false` にすると、バンドル済みまたはインストール済みであってもスキルが無効になります。
  バンドル済みの `coding-agent` スキルは明示的な有効化が必要です。
  `skills.entries.coding-agent.enabled: true` を設定し、`claude`、`codex`、
  `opencode`、または対応する別の CLI のいずれかがインストール済みかつ
  認証済みであることを確認してください。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言するスキル向けの便利なフィールドです。
  平文文字列または SecretRef オブジェクトを指定できます。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  エージェント実行用に注入される環境変数。変数がプロセス内にまだ設定されていない場合にのみ
  注入されます。
</ParamField>

<ParamField path="config" type="object">
  スキルごとのカスタム設定フィールド用の省略可能なコンテナ。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  **バンドル済み** スキルのみを対象とする省略可能な許可リスト。設定すると、リスト内の
  バンドル済みスキルだけが使用対象になります。管理対象スキルとワークスペーススキルには影響しません。
</ParamField>

<Note>
  デフォルトでは、設定キーは **スキル名** と一致します。スキルで
  `metadata.openclaw.skillKey` が定義されている場合は、代わりにそのキーを
  `skills.entries` 配下で使用してください。ハイフンを含む名前は引用符で囲んでください。
  JSON5 では引用符付きキーを使用できます。
</Note>

## 環境変数の注入

エージェント実行が開始されると、OpenClaw は次の処理を行います。

<Steps>
  <Step title="スキルメタデータを読み取る">
    OpenClaw は、ゲーティング規則、許可リスト、設定による上書きを適用し、
    エージェントに対する有効なスキル一覧を解決します。
  </Step>
  <Step title="環境変数と API キーを注入する">
    `skills.entries.<key>.env` と `skills.entries.<key>.apiKey` が、実行中のみ
    `process.env` に適用されます。
  </Step>
  <Step title="システムプロンプトを構築する">
    使用対象のスキルがコンパクトな XML ブロックにまとめられ、
    システムプロンプトへ注入されます。
  </Step>
  <Step title="環境を復元する">
    実行終了後、元の環境が復元されます。
  </Step>
</Steps>

<Warning>
  環境変数の注入はサンドボックスではなく、**ホスト** 上のエージェント実行に限定されます。
  サンドボックス内では `env` と `apiKey` は効果を持ちません。サンドボックス化された
  実行へシークレットを渡す方法については、
  [Skills の設定](/ja-JP/tools/skills-config#sandboxed-skills-and-env-vars) を参照してください。
</Warning>

バンドル済みの `claude-cli` バックエンドでは、OpenClaw は同じ使用対象スキルの
スナップショットを一時的な Claude Code Plugin として実体化し、`--plugin-dir`
経由で渡します。ほかの CLI バックエンドはプロンプトカタログのみを使用します。

## スナップショットと更新

OpenClaw は **セッション開始時** に使用対象スキルのスナップショットを作成し、
そのセッション内の後続のすべてのターンで同じ一覧を再利用します。スキルまたは設定への変更は、
次に新しいセッションを開始したときに反映されます。

次の 2 つの場合、セッションの途中で Skills が更新されます。

- Skills ウォッチャーが `SKILL.md` の変更を検出した場合。
- 新しい使用対象のリモート node が接続した場合。

更新された一覧は、次のエージェントターンで使用されます。エージェントの有効な
許可リストが変更された場合、OpenClaw は表示されるスキルの整合性を保つために
スナップショットを更新します。

<AccordionGroup>
  <Accordion title="Skills ウォッチャー">
    デフォルトでは、OpenClaw はスキルフォルダーを監視し、`SKILL.md` ファイルが
    変更されるとスナップショットを更新します。`skills.load` 配下で設定します。

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

    スキルルートのシンボリックリンクが設定済みルートの外部を指す、意図的な
    シンボリックリンク構成では `allowSymlinkTargets` を使用してください。例:
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    Skill Workshop からも、信頼されたそれらのシンボリックリンクパスを通じて提案を
    適用する必要がある場合にのみ、`skills.workshop.allowSymlinkTargetWrites` を有効にしてください。

  </Accordion>
  <Accordion title="リモート macOS node（Linux Gateway）">
    Gateway が Linux 上で動作していても、`system.run` が許可された **macOS node**
    が接続されている場合、必要なバイナリがその node に存在すれば、OpenClaw は
    macOS 専用スキルを使用対象として扱えます。エージェントは `host=node` を指定した
    `exec` ツール経由で、それらのスキルを実行する必要があります。

    オフラインの node では、リモート専用スキルは表示されません。node が
    バイナリのプローブに応答しなくなると、OpenClaw はキャッシュされたバイナリ一致情報を消去します。

  </Accordion>
</AccordionGroup>

## トークンへの影響

使用対象のスキルがある場合、OpenClaw はコンパクトな XML ブロックを
システムプロンプトに注入します。コストは決定論的で、スキル数に比例して増加します。

- **基本オーバーヘッド**（1 つ以上のスキルが使用対象の場合のみ）: 導入説明の
  固定ブロックと `<available_skills>` ラッパー。
- **スキルごと:** 約 97 文字 + `name`、`description`、`location`
  フィールドの文字数。
- XML エスケープでは `& < > " '` がエンティティに展開され、出現するたびに
  数文字が追加されます。
- 1 トークンあたり約 4 文字とすると、フィールドの文字数を含める前の時点で、
  97 文字 ≈ スキルごとに 24 トークンです。

レンダリングされたブロックが設定済みのプロンプト予算
（`skills.limits.maxSkillsPromptChars`）を超える場合、OpenClaw はまず、説明を含まない
コンパクト形式に収まる限り多くのスキル識別情報（名前、場所、バージョン）を保持します。
次に、残りの予算を短縮した説明に使用します。説明用の予算が残っていない場合、
説明は省略されます。コンパクト形式またはリストの切り詰めが必要な場合、
プロンプトには `openclaw skills check` を案内する注記が含まれます。

プロンプトのオーバーヘッドを最小限に抑えるため、説明は短く明確にしてください。

## 関連項目

<CardGroup cols={2}>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムスキルを作成するためのステップごとのガイド。
  </Card>
  <Card title="スキルワークショップ" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きしたスキルの提案キュー。
  </Card>
  <Card title="Skills 設定" href="/ja-JP/tools/skills-config" icon="gear">
    完全な `skills.*` 設定スキーマとエージェント許可リスト。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    スキルのスラッシュコマンドが登録され、ルーティングされる仕組み。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    公開レジストリでスキルを閲覧および公開します。
  </Card>
  <Card title="Plugin" href="/ja-JP/tools/plugin" icon="plug">
    Plugin は、説明対象のツールとともにスキルを配布できます。
  </Card>
</CardGroup>
