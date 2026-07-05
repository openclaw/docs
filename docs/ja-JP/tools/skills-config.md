---
read_when:
    - Skills の読み込み、インストール、またはゲート動作の設定
    - エージェントごとのスキル表示を設定する
    - Skill Workshop の制限または承認ポリシーを調整する
sidebarTitle: Skills config
summary: 'OpenClaw docs i18n input: skills.* 設定スキーマ、エージェント許可リスト、ワークショップ設定、サンドボックス環境変数処理の完全リファレンス。'
title: Skills 設定
x-i18n:
    generated_at: "2026-07-05T11:56:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

ほとんどの Skills 設定は `~/.openclaw/openclaw.json` の
`skills` 配下にあります。エージェント固有の表示可否は
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
  組み込みの画像生成では、`skills.entries` ではなく
  `agents.defaults.imageGenerationModel` とコアの `image_generate` ツールを使用します。Skill
  エントリは、カスタムまたはサードパーティの Skill ワークフロー専用です。
</Note>

## 読み込み (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  追加でスキャンする Skills ディレクトリです。優先順位は最も低くなります（バンドルおよび
  Plugin Skills より下）。パスは `~` サポート付きで展開されます。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  シンボリックリンクされた Skill フォルダの解決先として許可する、信頼済みの実ターゲットディレクトリです。
  シンボリックリンクが設定済みルートの外にある場合でも適用されます。これは
  `<workspace>/skills/manager -> ~/Projects/manager/skills` のような、
  意図的な sibling repo レイアウトに使用します。このリストは狭く保ってください。
  `~` や `~/Projects` のような広いルートを指さないでください。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill フォルダを監視し、`SKILL.md` ファイルが変更されたときに Skills スナップショットを更新します。
  グループ化された Skill ルート配下のネストされたファイルも対象です。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill ウォッチャーイベントのデバウンス時間（ミリ秒）です。
</ParamField>

## インストール (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` が利用可能な場合は Homebrew インストーラーを優先します。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill インストールで使用する Node パッケージマネージャーの優先設定です。これは Skill
  インストールにのみ影響します。Gateway ランタイムでは引き続き Node を使用する必要があります（Bun は
  WhatsApp/Telegram には推奨されません）。`openclaw setup --node-manager` と
  `openclaw onboard --node-manager` は `npm`、`pnpm`、または `bun` を受け付けます。
  Yarn ベースの Skill インストールには、設定で直接 `"yarn"` を指定します。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` 経由でステージされた
  プライベート zip アーカイブをインストールできるようにします。通常の ClawHub インストールでは、この設定は不要です。
</ParamField>

## オペレーターインストールポリシー (`security.installPolicy`)

オペレーターがホスト固有のポリシーで Skill と Plugin のインストールを承認またはブロックするために、
信頼済みのローカルコマンドを必要とする場合は `security.installPolicy` を使用します。
このポリシーは、OpenClaw がソース素材をステージした後、インストールまたは更新が続行される前に実行されます。
ClawHub Skills、アップロードされた Skills、Git/ローカル Skills、Skill 依存関係インストーラー、
および Plugin のインストール/更新ソースに適用されます。

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
  オペレーター所有のインストールポリシーを有効にします。有効化されていて有効な `exec`
  コマンドがない場合、インストールはフェイルクローズします。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  任意のターゲットフィルターです。省略した場合、新しいインストールが予期せずフェイルオープンしないよう、
  サポートされるすべてのターゲットにポリシーが適用されます。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  信頼済みポリシー実行ファイルへの絶対パスです。OpenClaw はシェルを使わずに実行し、
  使用前にパスを検証します。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` の後に渡される静的な引数です。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  1 回のポリシー判定に許可される最大実時間です。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  ポリシーがフェイルクローズするまでに stdout または stderr 出力がない状態で許可される最大時間です。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  ポリシープロセスから受け付ける stdout と stderr の合計最大バイト数です。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ポリシープロセスに提供されるリテラル環境変数です。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw プロセスからポリシープロセスへコピーされる環境変数名です。
  名前が指定された変数のみが渡されます。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  ポリシー実行ファイルを含めることができるディレクトリの任意の許可リスト。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  コマンドパスの所有権と権限チェックをバイパスします。このパスが別の仕組みで
  保護されている場合にのみ使用してください。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  設定されたコマンドパスをシンボリックリンクにすることを許可します。解決されたターゲットも
  他のパスチェックを満たす必要があります。インタープリタースクリプト引数は
  シンボリックリンクではなく、直接の通常ファイルである必要があります。
</ParamField>

ポリシーは stdin で `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
任意の構造化 `source`、構造化 `origin`、`request` を含む1つの JSON オブジェクトを受け取ります。stdout には
1つの JSON オブジェクトを書き込む必要があります: `{ "protocolVersion": 1, "decision": "allow" }`
または `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非ゼロ
終了、タイムアウト、不正な形式の JSON、フィールド不足、または未対応のプロトコル
バージョンはフェイルクローズします。

OpenClaw は通常の Gateway 起動中にインストールポリシーを実行しません。
ポリシーが有効だが利用できない場合、インストールと更新はフェイルクローズします。
`openclaw doctor` は静的検証を実行します。`openclaw doctor --deep` は
設定されたコマンドに対して合成インストールプローブを実行します。

一括更新ではターゲットごとにポリシーを適用します: ブロックされた skill または plugin の更新は、
ポリシーを無効化したりバッチ内の後続ターゲットをスキップしたりすることなく、
そのターゲットだけ失敗します。

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

## バンドル済み skill の許可リスト

<ParamField path="skills.allowBundled" type="string[]">
  **バンドル済み** skills のみを対象にする任意の許可リスト。設定すると、
  リスト内のバンドル済み skills だけが利用対象になります。管理対象、エージェントレベル、ワークスペースの
  skills には影響しません。
</ParamField>

## skill ごとのエントリ (`skills.entries`)

`entries` 配下のキーは、デフォルトでは skill の `name` と一致します。skill が
`metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使用します。ハイフンを含む名前は
引用符で囲んでください（JSON5 では引用符付きキーが許可されます）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` は、バンドル済みまたはインストール済みであっても skill を無効にします。
  `coding-agent` バンドル済み skill はオプトインです — `true` に設定し、
  `claude`、`codex`、`opencode`、または別の対応 CLI のいずれかがインストール済みで
  認証済みであることを確認してください。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する skills 用の便利なフィールド。
  平文文字列または SecretRef をサポートします: `{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  エージェント実行に注入される環境変数。変数がプロセス内でまだ設定されていない場合にのみ
  注入されます。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  skill ごとのカスタム設定フィールド用の任意の入れ物。
</ParamField>

## エージェント許可リスト (`agents`)

同じマシン/ワークスペースの skill ルートを使いながら、エージェントごとに
異なる表示 skill セットを使いたい場合は、エージェント設定を使用します。

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
  `agents.list[].skills` を省略したエージェントが継承する共有ベースライン許可リスト。
  デフォルトで skills を制限しない場合は、完全に省略してください。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  そのエージェントに対する明示的な最終 skill セット。明示的なリストは
  継承されたデフォルトを**置き換え**ます — マージしません。そのエージェントに
  skills を公開しない場合は `[]` に設定します。
</ParamField>

<Warning>
  エージェント skill 許可リストは、OpenClaw の skill 検出、プロンプト、
  スラッシュコマンド検出、サンドボックス同期、skill スナップショットに対する
  表示と読み込みのフィルターです。シェル実行時の認可境界ではありません。エージェントが
  ホストの `exec` を実行できる場合、そのシェルは引き続き外部クライアントを実行したり、
  実行ユーザーから見えるホストファイルを読み取ったりできます。これには
  `~/.openclaw/skills/config/mcporter.json` のような MCP クライアント
  レジストリも含まれます。エージェントごとの MCP 分離には、skill 許可リストを
  サンドボックス/OS ユーザー分離と組み合わせ、ホスト exec を拒否するか厳密に許可リスト化し、
  MCP サーバーではエージェントごとの認証情報を優先してください。
</Warning>

## ワークショップ (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` の場合、エージェントは成功したターンの後、永続的な会話の
  シグナルから保留中の提案を作成できます。ユーザーがプロンプトで指示したスキル作成は、
  この設定に関係なく常に Skill Workshop を経由します。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` は、エージェントが開始した適用、拒否、または隔離の前に
  オペレーターの承認を要求します。`auto` は、それらの操作を承認なしで許可します。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop の適用で、実体のターゲットがすでに
  `skills.load.allowSymlinkTargets` によって信頼されているワークスペースのスキルシンボリックリンクを
  経由して書き込めるようにします。生成された提案の適用でその共有スキルルートを変更する必要がない限り、
  これは無効のままにしてください。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  ワークスペースごとに保持される保留中および隔離済みの提案の最大数
  （許可範囲: 1-200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文の最大サイズ（バイト単位、許可範囲: 1024-200000）。提案の説明は
  発見と一覧出力に表示されるため、別途 160 バイトの上限が厳格に適用されます。
</ParamField>

この設定が制御する提案ライフサイクル、CLI コマンド、エージェントツールのパラメーター、
Gateway メソッドについては、[Skill Workshop](/ja-JP/tools/skill-workshop) を参照してください。

## シンボリックリンクされたスキルルート

デフォルトでは、ワークスペース、プロジェクトエージェント、追加ディレクトリ、同梱スキルのルートは
包含境界です。`<workspace>/skills` 配下のシンボリックリンクされたスキルフォルダーが
ルート外に解決される場合、ログメッセージとともにスキップされます。

意図的なシンボリックリンクレイアウトを許可するには、信頼済みターゲットを宣言します。

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

この設定では、`<workspace>/skills/manager -> ~/Projects/manager/skills` は
realpath 解決後に受け入れられます。`extraDirs` は隣接するリポジトリを
直接スキャンします。`allowSymlinkTargets` は既存のレイアウト向けに
シンボリックリンクされたパスを保持します。

Skill Workshop の適用は、デフォルトではこれらのシンボリックリンク経由で書き込みません。
Workshop の適用で、すでに信頼済みのシンボリックリンクターゲット配下のスキルを変更できるようにするには、
別途オプトインします。

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

管理対象の `~/.openclaw/skills` と個人用の `~/.agents/skills` ディレクトリは、
スキルディレクトリのシンボリックリンクをすでに無条件で受け入れます
（スキルごとの `SKILL.md` 包含は引き続き適用されます）。`allowSymlinkTargets` が必要なのは、
ワークスペース、追加ディレクトリ、プロジェクトエージェント
（`<workspace>/.agents/skills`）のルートのみです。

## サンドボックス化されたスキルと環境変数

<Warning>
  `skills.entries.<skill>.env` と `apiKey` は **ホスト** 実行にのみ適用されます。
  サンドボックス内では効果がありません。`GEMINI_API_KEY` に依存するスキルは、
  サンドボックスにその変数が別途渡されていない限り、`apiKey not configured` で失敗します。
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
  Docker デーモンへのアクセス権を持つユーザーは、Docker メタデータを通じて
  `sandbox.docker.env` の値を検査できます。その公開が許容できない場合は、
  マウントされたシークレットファイル、カスタムイメージ、または別の配信経路を使用してください。
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

Skills と設定への変更は、ウォッチャーが有効な場合は次の新しいセッションで、
またはウォッチャーが変更を検出した場合は次のエージェントターンで有効になります。

## 関連

<CardGroup cols={2}>
  <Card title="Skills reference" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skills とは何か、読み込み順序、ゲーティング、SKILL.md 形式。
  </Card>
  <Card title="Creating skills" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムワークスペーススキルの作成。
  </Card>
  <Card title="Skill Workshop" href="/ja-JP/tools/skill-workshop" icon="flask">
    エージェントが下書きしたスキルの提案キュー。
  </Card>
  <Card title="Slash commands" href="/ja-JP/tools/slash-commands" icon="terminal">
    ネイティブのスラッシュコマンドカタログとチャットディレクティブ。
  </Card>
</CardGroup>
