---
read_when:
    - Skills の読み込み、インストール、またはゲート動作を設定する
    - エージェントごとのスキル表示設定
    - Skill Workshop の制限または承認ポリシーを調整する
sidebarTitle: Skills config
summary: skills.* 設定スキーマ、エージェント許可リスト、ワークショップ設定、サンドボックス環境変数の扱いに関する完全なリファレンス。
title: Skills 設定
x-i18n:
    generated_at: "2026-06-27T13:17:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

Skills の設定の大半は `~/.openclaw/openclaw.json` の
`skills` 配下にあります。エージェント固有の可視性は
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
  追加でスキャンするスキルディレクトリです。最も低い優先順位（バンドル済み
  および Plugin スキルの後）になります。パスは `~` サポート付きで展開されます。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  シンボリックリンクされたスキルフォルダーが解決されてもよい、信頼済みの実ターゲットディレクトリです。
  シンボリックリンクが設定済みルートの外にある場合にも適用されます。これは
  `<workspace>/skills/manager -> ~/Projects/manager/skills` のような
  意図的な兄弟リポジトリレイアウトに使用します。このリストは
  狭く保ち、`~` や `~/Projects` のような広いルートを指さないでください。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  スキルフォルダーを監視し、`SKILL.md` ファイルが
  変更されたときに Skills スナップショットを更新します。グループ化されたスキルルート配下のネストしたファイルも対象です。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  スキルウォッチャーイベントのデバウンス時間（ミリ秒）です。
</ParamField>

## インストール (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` が利用可能な場合は Homebrew インストーラーを優先します。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  スキルインストール用の Node パッケージマネージャー設定です。これはスキル
  インストールにのみ影響します。Gateway ランタイムでは引き続き Node を使用するべきです（Bun は
  WhatsApp/Telegram には推奨されません）。npm、pnpm、
  または bun には `openclaw setup --node-manager` を使用し、Yarn ベースのスキルインストールには
  `"yarn"` を手動で設定します。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  信頼済みの `operator.admin` Gateway クライアントが、`skills.upload.*` を通じてステージされたプライベート zip
  アーカイブをインストールできるようにします。通常の ClawHub インストールでは
  この設定は不要です。
</ParamField>

## オペレーターインストールポリシー (`security.installPolicy`)

オペレーターがホスト固有のポリシーでスキルと Plugin のインストールを
承認またはブロックするために信頼済みローカルコマンドを必要とする場合は、`security.installPolicy` を使用します。このポリシーは
OpenClaw がソース素材をステージした後、インストールまたは更新が
続行される前に実行されます。これは ClawHub スキル、アップロード済みスキル、Git/ローカルスキル、
スキル依存関係インストーラー、および Plugin のインストール/更新ソースに適用されます。

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
  コマンドがない場合、インストールは fail closed します。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  任意のターゲットフィルターです。省略した場合、新しいインストールが予期せず fail open
  しないよう、ポリシーはサポートされるすべてのターゲットに適用されます。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  信頼済みポリシー実行ファイルへの絶対パスです。OpenClaw はシェルなしで
  それを実行し、使用前にパスを検証します。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` の後に渡される静的な引数です。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  1 回のポリシー判定に許可される最大の実時間ランタイムです。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  ポリシーが fail closed するまでに stdout または stderr 出力がない状態で許容される最大時間です。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  ポリシープロセスから受け入れる stdout と stderr の合計最大バイト数です。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  ポリシープロセスに提供されるリテラル環境変数です。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw プロセスからポリシー
  プロセスへコピーされる環境変数名です。名前が指定された変数だけが渡されます。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  ポリシー実行ファイルを含んでもよいディレクトリの任意の許可リストです。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  コマンドパスの所有権および権限チェックをバイパスします。パスが
  別の仕組みによって保護されている場合にのみ使用します。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  設定されたコマンドパスがシンボリックリンクであることを許可します。解決後のターゲットは
  それでも他のパスチェックを満たす必要があります。インタープリタースクリプト引数は
  シンボリックリンクではなく、直接の通常ファイルでなければなりません。
</ParamField>

このポリシーは stdin で `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
任意の構造化 `source`、構造化 `origin`、および `request` を含む 1 つの JSON オブジェクトを受け取ります。stdout には
1 つの JSON オブジェクトを書き出す必要があります: `{ "protocolVersion": 1, "decision": "allow" }` または
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。ゼロ以外の
終了、タイムアウト、不正な JSON、欠落フィールド、またはサポートされないプロトコルバージョンは
fail closed します。

OpenClaw は通常の Gateway 起動時にはインストールポリシーを実行しません。ポリシーが有効で利用できない場合、
インストールと更新は fail closed します。`openclaw doctor`
は静的検証を行い、`openclaw doctor --deep` は設定されたコマンドに対して合成
インストールプローブを実行します。

一括更新ではターゲットごとにポリシーが適用されます。ブロックされたスキルまたは Plugin の更新は、
ポリシーを無効化したりバッチ内の後続ターゲットをスキップしたりせず、そのターゲットを失敗させます。

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

## バンドル済みスキル許可リスト

<ParamField path="skills.allowBundled" type="string[]">
  **バンドル済み**スキル専用の任意の許可リストです。設定すると、リスト内のバンドル済みスキルだけが
  対象になります。管理対象、エージェントレベル、およびワークスペーススキルには
  影響しません。
</ParamField>

## スキルごとのエントリ (`skills.entries`)

`entries` 配下のキーは、デフォルトではスキルの `name` と一致します。スキルが
`metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使用します。ハイフン付きの名前は
引用符で囲みます（JSON5 は引用符付きキーを許可します）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` は、バンドル済みまたはインストール済みであってもスキルを無効化します。`coding-agent`
  バンドル済みスキルはオプトインです。`true` に設定し、`claude`、
  `codex`、`opencode`、または別のサポート対象 CLI のいずれかがインストールされ認証済みであることを確認してください。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` を宣言するスキル向けの便利フィールドです。
  平文文字列または SecretRef をサポートします: `{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  エージェント実行に注入される環境変数です。変数がプロセスで
  まだ設定されていない場合にのみ注入されます。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  スキルごとのカスタム設定フィールド用の任意のバッグです。
</ParamField>

## エージェント許可リスト (`agents`)

同じマシン/ワークスペースのスキルルートを使いつつ、エージェントごとに
異なる可視スキルセットにしたい場合は、エージェント設定を使用します。

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
  デフォルトでスキルを制限しない場合は完全に省略します。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  そのエージェントの明示的な最終スキルセットです。明示的なリストは継承された
  デフォルトを**置き換え**ます。マージはされません。そのエージェントにスキルを公開しない場合は `[]` に設定します。
</ParamField>

## ワークショップ (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  `true` の場合、エージェントは成功したターンの後、永続的な会話
  シグナルから保留中の提案を作成できます。ユーザーが促したスキル作成は、この設定に関係なく常に
  スキルワークショップを通ります。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` は、エージェント主導の適用、拒否、または
  隔離の前にオペレーター承認を要求します。`auto` はそれらのアクションを承認なしで許可します。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  `skills.load.allowSymlinkTargets` によって実ターゲットがすでに信頼済みである
  ワークスペーススキルのシンボリックリンクを通じて、スキルワークショップの適用が書き込めるようにします。生成された提案の適用でその共有スキル
  ルートを変更する必要がある場合を除き、これは無効のままにしてください。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  ワークスペースごとに保持される保留中および隔離済み提案の最大数。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文の最大サイズ（バイト単位）。提案の説明は、検出および一覧出力に表示されるため、
  160 バイトに厳しく制限されます。
</ParamField>

## シンボリックリンクされたスキルルート

デフォルトでは、ワークスペース、プロジェクトエージェント、追加ディレクトリ、バンドル済みスキルのルートは
包含境界です。`<workspace>/skills` の下にある、ルート外へ解決されるシンボリックリンクされたスキルフォルダは、
ログメッセージとともにスキップされます。

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

この設定では、`<workspace>/skills/manager -> ~/Projects/manager/skills` は
realpath 解決後に受け入れられます。`extraDirs` は隣接リポジトリを直接スキャンします。
`allowSymlinkTargets` は既存の構成向けに、シンボリックリンクされたパスを維持します。

Skill Workshop の適用は、デフォルトではこれらのシンボリックリンクを通じて書き込みません。
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
すでにスキルディレクトリのシンボリックリンクを受け入れます（スキルごとの `SKILL.md` の包含は引き続き
適用されます）。

## サンドボックス化されたスキルと環境変数

<Warning>
  `skills.entries.<skill>.env` と `apiKey` は **ホスト** 実行にのみ適用されます。サンドボックス内では
  効果がありません。`GEMINI_API_KEY` に依存するスキルは、サンドボックスにその変数が別途与えられていない限り、
  `apiKey not configured` で失敗します。
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
  Docker デーモンへのアクセス権を持つユーザーは、Docker メタデータを通じて `sandbox.docker.env` の値を
  確認できます。その露出が許容できない場合は、マウントされたシークレットファイル、カスタムイメージ、
  または別の配信経路を使用してください。
</Note>

## 読み込み順のリマインダー

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

スキルと設定への変更は、ウォッチャーが有効な場合は次の新しいセッションで有効になり、
ウォッチャーが変更を検出した場合は次のエージェントターンで有効になります。

## 関連

<CardGroup cols={2}>
  <Card title="Skills リファレンス" href="/ja-JP/tools/skills" icon="puzzle-piece">
    スキルの概要、読み込み順、ゲーティング、`SKILL.md` 形式。
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
