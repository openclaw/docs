---
read_when:
    - スキルの読み込み、インストール、またはゲーティング動作の設定
    - エージェントごとのスキル表示設定
    - Skill Workshop の制限または承認ポリシーの調整
sidebarTitle: Skills config
summary: '`skills.*` 設定スキーマ、エージェント許可リスト、ワークショップ設定、サンドボックス環境変数の処理に関する完全なリファレンス。'
title: Skills 設定
x-i18n:
    generated_at: "2026-07-01T05:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

ほとんどのスキル設定は `~/.openclaw/openclaw.json` の
`skills` 配下にあります。エージェント固有の表示設定は
`agents.defaults.skills` と `agents.list[].skills` 配下にあります。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  組み込みの画像生成には、`skills.entries` ではなく
  `agents.defaults.imageGenerationModel` とコアの `image_generate` ツールを使用します。スキル
  エントリは、カスタムまたはサードパーティのスキルワークフロー専用です。
</Note>

## 読み込み (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  追加でスキャンするスキルディレクトリです。優先順位は最も低くなります（バンドル済み
  およびプラグインスキルの後）。パスは `~` 対応で展開されます。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  シンボリックリンクされたスキルフォルダが解決されてもよい、信頼済みの実ターゲットディレクトリです。
  シンボリックリンクが設定済みルートの外にある場合でも適用されます。これは
  `<workspace>/skills/manager -> ~/Projects/manager/skills` のような
  意図的な兄弟リポジトリレイアウトに使用します。このリストは
  狭く保ってください。`~` や `~/Projects` のような広いルートを指定しないでください。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  スキルフォルダを監視し、`SKILL.md` ファイルが変更されたときにスキルスナップショットを
  更新します。グループ化されたスキルルート配下のネストされたファイルも対象です。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  スキルウォッチャーイベントのデバウンス時間（ミリ秒）です。
</ParamField>

## インストール (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` が利用できる場合は Homebrew インストーラーを優先します。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  スキルインストールで優先する Node パッケージマネージャーです。これはスキル
  インストールにのみ影響します。Gateway ランタイムでは引き続き Node を使用してください（Bun は
  WhatsApp/Telegram には推奨されません）。npm、pnpm、
  または bun には `openclaw setup --node-manager` を使用し、Yarn ベースのスキルインストールには
  `"yarn"` を手動で設定します。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` 経由でステージされた非公開 zip
  アーカイブをインストールできるようにします。通常の ClawHub インストールでは
  この設定は不要です。
</ParamField>

## オペレーターインストールポリシー (`security.installPolicy`)

オペレーターが、ホスト固有のポリシーでスキルおよびプラグインのインストールを
承認またはブロックする信頼済みローカルコマンドを必要とする場合は、`security.installPolicy` を使用します。このポリシーは、
OpenClaw がソース素材をステージした後、インストールまたは更新が
続行される前に実行されます。ClawHub スキル、アップロードされたスキル、Git/ローカルスキル、
スキル依存関係インストーラー、プラグインのインストール/更新ソースに適用されます。

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  オペレーター所有のインストールポリシーを有効にします。有効で、有効な `exec`
  コマンドがない場合、インストールはフェイルクローズします。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  任意のターゲットフィルターです。省略すると、ポリシーは対応しているすべてのターゲットに適用されるため、
  新しいインストールが予期せずフェイルオープンすることはありません。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  信頼済みポリシー実行ファイルへの絶対パスです。OpenClaw はシェルなしで実行し、
  使用前にパスを検証します。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` の後に渡される静的引数です。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  1 回のポリシー判定に対する最大実時間です。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  ポリシーがフェイルクローズするまでに stdout または stderr の出力がない最大時間です。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  ポリシープロセスから受け入れる stdout と stderr の合計最大バイト数です。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ポリシープロセスに提供されるリテラル環境変数です。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw プロセスからポリシー
  プロセスにコピーされる環境変数名です。名前が指定された変数のみが渡されます。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  ポリシー実行ファイルを含めてもよいディレクトリの任意の許可リストです。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  コマンドパスの所有権および権限チェックをバイパスします。そのパスが
  別の仕組みで保護されている場合にのみ使用してください。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  設定されたコマンドパスがシンボリックリンクであることを許可します。解決後のターゲットは
  引き続き他のパスチェックを満たす必要があります。インタープリタースクリプト引数は、
  シンボリックリンクではなく、直接の通常ファイルでなければなりません。
</ParamField>

ポリシーは stdin で `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
任意の構造化された `source`、構造化された `origin`、および `request` を含む JSON オブジェクトを 1 つ受け取ります。stdout には
JSON オブジェクトを 1 つ書き出す必要があります: `{ "protocolVersion": 1, "decision": "allow" }` または
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。ゼロ以外の
終了、タイムアウト、不正な JSON、欠落フィールド、または未対応のプロトコルバージョンは
フェイルクローズします。

OpenClaw は通常の Gateway 起動時にインストールポリシーを実行しません。ポリシーが有効だが利用できない場合、
インストールと更新はフェイルクローズします。`openclaw doctor`
は静的検証を行い、`openclaw doctor --deep` は設定されたコマンドに対して合成
インストールプローブを実行します。

一括更新ではターゲットごとにポリシーが適用されます。ブロックされたスキルまたはプラグインの更新は、
ポリシーを無効化したりバッチ内の後続ターゲットをスキップしたりせず、
そのターゲットだけを失敗させます。

stdin の例:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

最小限のポリシーコマンド:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## バンドル済みスキルの許可リスト

<ParamField path="skills.allowBundled" type="string[]">
  **バンドル済み**スキルのみに対する任意の許可リストです。設定すると、リスト内のバンドル済みスキル
  のみが対象になります。管理対象、エージェントレベル、およびワークスペースのスキルには
  影響しません。
</ParamField>

## スキルごとのエントリ (`skills.entries`)

`entries` 配下のキーは、デフォルトではスキルの `name` と一致します。スキルが
`metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使用します。ハイフンを含む名前は
引用符で囲みます（JSON5 では引用符付きキーが許可されています）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` は、バンドル済みまたはインストール済みであってもスキルを無効にします。`coding-agent`
  バンドル済みスキルはオプトインです。`true` に設定し、`claude`、
  `codex`、`opencode`、または別の対応 CLI のいずれかがインストールされ、認証済みであることを確認してください。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言しているスキル向けの便利フィールドです。
  平文文字列または SecretRef をサポートします: `{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  エージェント実行に注入される環境変数です。プロセス内でその変数がまだ設定されていない場合にのみ
  注入されます。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  カスタムのスキルごとの設定フィールド用の任意の入れ物です。
</ParamField>

## エージェント許可リスト (`agents`)

同じマシン/ワークスペースのスキルルートを使いつつ、エージェントごとに
表示されるスキルセットを変えたい場合は、エージェント設定を使用します。

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

<ParamField path="agents.defaults.skills" type="string[]">
  `agents.list[].skills` を省略したエージェントが継承する共有ベースライン許可リストです。
  既定でスキルを制限しない場合は、完全に省略します。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  そのエージェントの明示的な最終スキルセットです。明示的なリストは継承された
  既定値を**置き換え**ます。マージはされません。そのエージェントにスキルを公開しない場合は `[]` に設定します。
</ParamField>

<Warning>
  エージェントのスキル許可リストは、OpenClaw のスキル
  検出、プロンプト、スラッシュコマンド検出、サンドボックス同期、およびスキル
  スナップショットに対する表示および読み込みフィルターです。シェル実行時の認可境界ではありません。エージェントが
  ホストの `exec` を実行できる場合、そのシェルは外部クライアントを実行したり、
  実行ユーザーに表示されるホストファイルを読み取ったりできます。これには
  `~/.openclaw/skills/config/mcporter.json` のような MCP クライアントレジストリも含まれます。エージェントごとの MCP 分離には、
  スキル許可リストとサンドボックス/OS ユーザー分離を組み合わせ、ホスト exec を拒否または厳密に
  許可リスト化し、MCP サーバー側でエージェントごとの認証情報を優先してください。
</Warning>

## ワークショップ (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` の場合、エージェントは成功したターンの後、永続的な会話
  シグナルから保留中の提案を作成できます。ユーザーが促したスキル作成は、
  この設定に関係なく常に Skill Workshop を経由します。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` は、エージェントが開始する適用、拒否、隔離の前にオペレーター承認を要求します。`auto` は、それらのアクションを承認なしで許可します。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop の適用で、実体のターゲットが `skills.load.allowSymlinkTargets` によってすでに信頼されているワークスペースのスキルシンボリックリンクをたどって書き込めるようにします。生成された提案の適用で、その共有スキルルートを変更する必要がある場合を除き、これは無効のままにしてください。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  ワークスペースごとに保持される保留中および隔離済みの提案の最大数。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文の最大サイズ（バイト単位）。提案の説明は、検出と一覧出力に表示されるため、160 バイトに厳しく制限されます。
</ParamField>

## シンボリックリンクされたスキルルート

デフォルトでは、ワークスペース、プロジェクトエージェント、追加ディレクトリ、バンドルされたスキルルートは包含境界です。`<workspace>/skills` 配下のシンボリックリンクされたスキルフォルダーがルート外に解決される場合、ログメッセージとともにスキップされます。

意図的なシンボリックリンク構成を許可するには、信頼するターゲットを宣言します。

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

この設定では、`<workspace>/skills/manager -> ~/Projects/manager/skills` は realpath 解決後に受け入れられます。`extraDirs` は兄弟リポジトリを直接スキャンします。`allowSymlinkTargets` は既存の構成のためにシンボリックリンクされたパスを保持します。

Skill Workshop の適用は、デフォルトではこれらのシンボリックリンクをたどって書き込みません。すでに信頼されているシンボリックリンクターゲット配下のスキルを Workshop の適用で変更できるようにするには、別途オプトインします。

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

管理対象の `~/.openclaw/skills` ディレクトリと個人用の `~/.agents/skills` ディレクトリでは、スキルディレクトリのシンボリックリンクがすでに受け入れられます（スキルごとの `SKILL.md` 包含は引き続き適用されます）。

## サンドボックス化されたスキルと環境変数

<Warning>
  `skills.entries.<skill>.env` と `apiKey` は **ホスト** 実行にのみ適用されます。サンドボックス内では効果がありません。`GEMINI_API_KEY` に依存するスキルは、サンドボックスにその変数を別途与えない限り、`apiKey not configured` で失敗します。
</Warning>

Docker サンドボックスにシークレットを渡すには、次を使用します。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Docker デーモンへのアクセス権を持つユーザーは、Docker メタデータを通じて `sandbox.docker.env` の値を検査できます。その露出が許容できない場合は、マウントされたシークレットファイル、カスタムイメージ、または別の配信経路を使用してください。
</Note>

## 読み込み順序のリマインダー

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

スキルと設定への変更は、ウォッチャーが有効な場合は次の新しいセッションで、またはウォッチャーが変更を検出した場合は次のエージェントターンで有効になります。

## 関連

<CardGroup cols={2}>
  <Card title="Skills リファレンス" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skills とは何か、読み込み順序、ゲート、SKILL.md 形式。
  </Card>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムワークスペーススキルの作成。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きしたスキルの提案キュー。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    ネイティブのスラッシュコマンドカタログとチャットディレクティブ。
  </Card>
</CardGroup>
