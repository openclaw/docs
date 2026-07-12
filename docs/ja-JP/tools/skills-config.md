---
read_when:
    - スキルの読み込み、インストール、またはゲーティング動作の設定
    - エージェントごとの Skills の表示設定
    - Skill Workshop の制限または承認ポリシーの調整
sidebarTitle: Skills config
summary: skills.* 設定スキーマ、エージェントの許可リスト、ワークショップ設定、サンドボックスの環境変数処理に関する完全なリファレンス。
title: Skills 設定
x-i18n:
    generated_at: "2026-07-11T22:48:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

Skills の設定の大部分は `~/.openclaw/openclaw.json` の
`skills` 配下にあります。エージェント固有の可視性は
`agents.defaults.skills` と `agents.list[].skills` で設定します。

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
  `agents.defaults.imageGenerationModel` とコアの `image_generate` ツールを使用します。
  Skill エントリは、カスタムまたはサードパーティの Skill ワークフロー専用です。
</Note>

## 読み込み（`skills.load`）

<ParamField path="skills.load.extraDirs" type="string[]">
  スキャン対象に追加する Skill ディレクトリです。優先順位は最も低くなります
  （バンドル Skill および Plugin Skill より下位）。パスでは `~` の展開がサポートされます。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  シンボリックリンクされた Skill フォルダーの解決先として許可する、信頼済みの実体ディレクトリです。
  シンボリックリンクが設定済みルートの外部にある場合でも使用できます。
  `<workspace>/skills/manager -> ~/Projects/manager/skills` のような、意図的に兄弟リポジトリを
  使用するレイアウトで指定します。このリストは必要最小限にしてください。`~` や
  `~/Projects` のような広範なルートを指定しないでください。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill フォルダーを監視し、`SKILL.md` ファイルの変更時に Skills スナップショットを
  更新します。グループ化された Skill ルート配下のネストされたファイルも対象です。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill ウォッチャーイベントのデバウンス時間（ミリ秒）です。
</ParamField>

## インストール（`skills.install`）

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` が利用可能な場合は Homebrew インストーラーを優先します。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill のインストールに使用する Node パッケージマネージャーの設定です。これは Skill の
  インストールにのみ影響します。Gateway ランタイムでは引き続き Node を使用してください
  （WhatsApp/Telegram では Bun は推奨されません）。`openclaw setup --node-manager` と
  `openclaw onboard --node-manager` は `npm`、`pnpm`、`bun` を受け付けます。
  Yarn を使用する Skill インストールでは、設定に `"yarn"` を直接指定してください。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` 経由でステージングされた
  非公開 zip アーカイブをインストールできるようにします。通常の ClawHub インストールでは、
  この設定は不要です。
</ParamField>

## オペレーターのインストールポリシー（`security.installPolicy`）

オペレーターが、ホスト固有のポリシーに基づいて Skill と Plugin のインストールを承認または
ブロックするための信頼済みローカルコマンドを必要とする場合は、`security.installPolicy` を使用します。
このポリシーは、OpenClaw がソース素材をステージングした後、インストールまたは更新を続行する前に
実行されます。ClawHub Skills、アップロードされた Skills、Git/ローカル Skills、
Skill の依存関係インストーラー、および Plugin のインストール/更新元に適用されます。

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
  オペレーターが管理するインストールポリシーを有効にします。有効な `exec` コマンドなしで
  有効化すると、インストールはフェイルクローズします。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  任意の対象フィルターです。省略すると、新しいインストールが予期せずフェイルオープンしないように、
  サポートされるすべての対象にポリシーが適用されます。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  信頼済みポリシー実行ファイルの絶対パスです。OpenClaw はシェルを介さずに実行し、
  使用前にパスを検証します。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` の後に渡す固定引数です。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  1 回のポリシー判定に許可される最大実時間です。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  標準出力または標準エラー出力がない状態で許可される最大時間です。超過するとポリシーは
  フェイルクローズします。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  ポリシープロセスから受け入れる標準出力と標準エラー出力の合計最大バイト数です。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ポリシープロセスに渡すリテラル環境変数です。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw プロセスからポリシープロセスへコピーする環境変数名です。
  名前を指定した変数だけが渡されます。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  ポリシー実行ファイルの配置を許可するディレクトリの任意の許可リストです。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  コマンドパスの所有権および権限チェックを回避します。パスが別の仕組みで保護されている場合にのみ
  使用してください。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  設定されたコマンドパスがシンボリックリンクであることを許可します。解決後の対象は、
  引き続きその他のパスチェックを満たす必要があります。インタープリタースクリプトの引数は、
  シンボリックリンクではなく、直接の通常ファイルでなければなりません。
</ParamField>

ポリシーは標準入力で、`protocolVersion: 1`、`openclawVersion`、`targetType`、
`targetName`、`sourcePath`、`sourcePathKind`、任意の構造化された `source`、
構造化された `origin`、および `request` を含む 1 つの JSON オブジェクトを受け取ります。
標準出力には、`{ "protocolVersion": 1, "decision": "allow" }` または
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }` のいずれかの
JSON オブジェクトを 1 つ書き込む必要があります。終了コードが 0 以外、タイムアウト、
不正な JSON、必須フィールドの欠落、または未対応のプロトコルバージョンの場合は、
フェイルクローズします。

OpenClaw は通常の Gateway 起動時にはインストールポリシーを実行しません。
ポリシーが有効でありながら利用できない場合、インストールと更新はフェイルクローズします。
`openclaw doctor` は静的検証を実行し、`openclaw doctor --deep` は設定されたコマンドに対して
合成インストールプローブを実行します。

一括更新では、対象ごとにポリシーが適用されます。ブロックされた Skill または Plugin の更新は、
ポリシーを無効化したり、バッチ内の後続の対象をスキップしたりせず、その対象だけが失敗します。

標準入力の例：

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

最小構成のポリシーコマンド：

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

## バンドル Skill の許可リスト

<ParamField path="skills.allowBundled" type="string[]">
  **バンドル** Skill のみに適用される任意の許可リストです。設定すると、リスト内の
  バンドル Skill だけが利用可能になります。管理対象、エージェントレベル、および
  ワークスペースの Skills には影響しません。
</ParamField>

## Skill ごとのエントリ（`skills.entries`）

`entries` 配下のキーは、デフォルトでは Skill の `name` と一致します。Skill が
`metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使用します。
ハイフンを含む名前は引用符で囲んでください（JSON5 では引用符付きキーを使用できます）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` にすると、バンドル済みまたはインストール済みであっても Skill が無効になります。
  バンドル Skill の `coding-agent` はオプトインです。`true` に設定し、`claude`、`codex`、
  `opencode`、またはその他の対応 CLI のいずれかがインストールされ、認証済みであることを
  確認してください。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言する Skills 向けの簡易フィールドです。
  平文文字列または SecretRef
  `{ source: "env", provider: "default", id: "VAR_NAME" }` をサポートします。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  エージェント実行時に注入する環境変数です。変数がプロセスですでに設定されていない場合にのみ
  注入されます。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Skill ごとのカスタム設定フィールドを格納する任意のオブジェクトです。
</ParamField>

## エージェントの許可リスト（`agents`）

同じマシン/ワークスペースの Skill ルートを使用しながら、エージェントごとに表示する
Skill セットを変更する場合は、エージェント設定を使用します。

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
  `agents.list[].skills` を省略したエージェントが継承する共有の基本許可リストです。
  デフォルトで Skills を制限しない場合は、この設定自体を省略してください。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  そのエージェントに対する明示的な最終 Skill セットです。明示的なリストは継承した
  デフォルトを**置き換えます**。マージは行われません。そのエージェントに Skills を
  何も公開しない場合は `[]` を設定します。
</ParamField>

<Warning>
  エージェントの Skill 許可リストは、OpenClaw の Skill 検出、プロンプト、
  スラッシュコマンド検出、サンドボックス同期、および Skill スナップショットに対する
  可視性と読み込みのフィルターです。シェル実行時の認可境界ではありません。エージェントが
  ホストの `exec` を実行できる場合、そのシェルは外部クライアントを引き続き実行でき、
  実行ユーザーから見えるホストファイルも読み取れます。これには
  `~/.openclaw/skills/config/mcporter.json` のような MCP クライアントレジストリも含まれます。
  エージェントごとに MCP を分離するには、Skill 許可リストとサンドボックス/OS ユーザー分離を
  組み合わせ、ホストの exec を拒否するか厳格な許可リストを設定し、MCP サーバーでは
  エージェントごとの認証情報を優先して使用してください。
</Warning>

## ワークショップ（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` の場合、エージェントはターンが正常に完了した後、永続的な会話シグナルから保留中の提案を作成できます。ユーザーが指示したスキル作成は、この設定に関係なく常に Skill Workshop を経由します。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` では、エージェントが開始した適用、却下、または隔離を行う前にオペレーターの承認が必要です。`auto` では、承認なしでこれらの操作を実行できます。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop の適用時に、実体のターゲットが `skills.load.allowSymlinkTargets` によってすでに信頼されているワークスペースのスキルシンボリックリンクを通じた書き込みを許可します。生成された提案の適用によって、その共有スキルルートを変更する必要がない限り、この設定は無効のままにしてください。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  ワークスペースごとに保持する保留中および隔離済みの提案の最大数です（許容範囲: 1～200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文の最大サイズ（バイト単位）です（許容範囲: 1024～200000）。提案の説明は検出結果と一覧出力に表示されるため、別途160バイトに厳しく制限されます。
</ParamField>

この設定によって制御される提案のライフサイクル、CLI コマンド、エージェントツールのパラメーター、および Gateway メソッドについては、[Skill Workshop](/ja-JP/tools/skill-workshop)を参照してください。

## シンボリックリンクされたスキルルート

デフォルトでは、ワークスペース、プロジェクトエージェント、追加ディレクトリ、および同梱スキルのルートが包含境界になります。`<workspace>/skills` 配下にあり、ルート外を参照するシンボリックリンクされたスキルフォルダーは、ログメッセージを出力してスキップされます。

意図したシンボリックリンク構成を許可するには、信頼するターゲットを宣言します。

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

この設定では、実体パスの解決後に `<workspace>/skills/manager -> ~/Projects/manager/skills` が受け入れられます。`extraDirs` は隣接するリポジトリを直接スキャンし、`allowSymlinkTargets` は既存の構成向けにシンボリックリンクされたパスを維持します。

デフォルトでは、Skill Workshop の適用処理はこれらのシンボリックリンクを通じて書き込みません。Workshop の適用処理が、すでに信頼されているシンボリックリンク先にあるスキルを変更できるようにするには、別途明示的に有効化します。

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

管理対象の `~/.openclaw/skills` および個人用の `~/.agents/skills` ディレクトリでは、スキルディレクトリのシンボリックリンクがすでに無条件で受け入れられます（スキルごとの `SKILL.md` の包含制約は引き続き適用されます）。`allowSymlinkTargets` が必要なのは、ワークスペース、追加ディレクトリ、およびプロジェクトエージェント（`<workspace>/.agents/skills`）のルートのみです。

## サンドボックス化されたスキルと環境変数

<Warning>
  `skills.entries.<skill>.env` と `apiKey` は、**ホスト**での実行にのみ適用されます。サンドボックス内では効果がありません。`GEMINI_API_KEY` に依存するスキルは、サンドボックスに変数を別途渡さない限り、`apiKey not configured` というエラーで失敗します。
</Warning>

Docker サンドボックスにシークレットを渡すには、次のように設定します。

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
  Docker デーモンへのアクセス権を持つユーザーは、Docker のメタデータを通じて `sandbox.docker.env` の値を確認できます。この露出を許容できない場合は、マウントしたシークレットファイル、カスタムイメージ、または別の受け渡し経路を使用してください。
</Note>

## 読み込み順序の確認

```text
workspace/skills      (最優先)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
同梱スキル
skills.load.extraDirs (最低優先)
```

スキルと設定への変更は、ウォッチャーが有効な場合は次の新しいセッションで、ウォッチャーが変更を検出した場合は次のエージェントターンで有効になります。

## 関連項目

<CardGroup cols={2}>
  <Card title="Skills リファレンス" href="/ja-JP/tools/skills" icon="puzzle-piece">
    スキルの概要、読み込み順序、ゲーティング、および SKILL.md の形式。
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
