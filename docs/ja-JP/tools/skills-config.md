---
read_when:
    - Skills 設定の追加または変更
    - 同梱の許可リストまたはインストール動作の調整
summary: Skills の設定スキーマと例
title: Skills 設定
x-i18n:
    generated_at: "2026-05-10T19:55:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

ほとんどのスキルのローダー/インストール設定は、`~/.openclaw/openclaw.json` の
`skills` 配下にあります。エージェント固有のスキル表示設定は
`agents.defaults.skills` と `agents.list[].skills` 配下にあります。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

組み込みの画像生成/編集には、`agents.defaults.imageGenerationModel` と
コアの `image_generate` ツールを優先してください。`skills.entries.*` は、カスタムまたは
サードパーティのスキルワークフロー専用です。

特定の画像プロバイダー/モデルを選択する場合は、そのプロバイダーの
認証/API キーも設定してください。典型的な例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、
`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`。

例:

- ネイティブの Nano Banana Pro スタイルのセットアップ: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- ネイティブの fal セットアップ: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## エージェントのスキル許可リスト

同じマシン/ワークスペースのスキルルートを使いながら、エージェントごとに
表示されるスキルセットを変えたい場合は、エージェント設定を使用します。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

ルール:

- `agents.defaults.skills`: `agents.list[].skills` を省略したエージェント向けの共有ベースライン許可リスト。
- 既定でスキルを制限しない場合は、`agents.defaults.skills` を省略します。
- `agents.list[].skills`: そのエージェントの明示的な最終スキルセット。既定値とはマージされません。
- `agents.list[].skills: []`: そのエージェントにはスキルを公開しません。

## フィールド

- 組み込みのスキルルートには、常に `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills`、`<workspace>/skills` が含まれます。
- `allowBundled`: **バンドル済み**スキル専用の任意の許可リスト。設定すると、
  リスト内のバンドル済みスキルのみが対象になります（管理対象、エージェント、ワークスペースのスキルには影響しません）。
- `load.extraDirs`: スキャン対象に追加するスキルディレクトリ（最も低い優先順位）。
- `load.allowSymlinkTargets`: シンボリックリンクされたスキルフォルダーが、そのシンボリックリンクが
  ターゲットルート外にある場合でも解決できる、信頼済みの実ターゲットディレクトリ。
  `~/.agents/skills/manager -> ~/Projects/manager/skills` のような
  意図的な兄弟リポジトリ構成に使用します。
- `load.watch`: スキルフォルダーを監視し、スキルスナップショットを更新します（既定: true）。
- `load.watchDebounceMs`: スキル監視イベントのデバウンス時間（ミリ秒、既定: 250）。
- `install.preferBrew`: 利用可能な場合は brew インストーラーを優先します（既定: true）。
- `install.nodeManager`: node インストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`、既定: npm）。
  これは **スキルのインストール** にのみ影響します。Gateway ランタイムは引き続き Node である必要があります
  （Bun は WhatsApp/Telegram には推奨されません）。
  - `openclaw setup --node-manager` はより狭い範囲で、現時点では `npm`、
    `pnpm`、または `bun` を受け入れます。Yarn ベースのスキルインストールを
    使いたい場合は、`skills.install.nodeManager: "yarn"` を手動で設定してください。
- `install.allowUploadedArchives`: 信頼済みの `operator.admin` Gateway
  クライアントが、`skills.upload.*` を通じてステージングされたプライベート zip アーカイブを
  インストールできるようにします（既定: false）。これはアップロード済みアーカイブ経路のみを有効にします。通常の ClawHub
  インストールでは不要です。
- `entries.<skillKey>`: スキルごとの上書き設定。
- `agents.defaults.skills`: `agents.list[].skills` を省略したエージェントに
  継承される任意の既定スキル許可リスト。
- `agents.list[].skills`: 任意のエージェントごとの最終スキル許可リスト。明示的な
  リストは、継承された既定値とマージされず置き換えます。

## シンボリックリンクされた兄弟リポジトリ

既定では、各スキルルートは包含境界です。`~/.agents/skills` 配下のスキルフォルダーが
シンボリックリンクで、`~/.agents/skills` の外に解決される場合、
OpenClaw はそれをスキップし、`Skipping escaped skill path outside its configured
root` をログに記録します。

シンボリックリンク構成を維持し、信頼済みのターゲットルートのみを許可します。

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

この設定では、
`~/.agents/skills/manager -> ~/Projects/manager/skills` のようなシンボリックリンクは
realpath 解決後に受け入れられます。`extraDirs` は兄弟リポジトリも直接スキャンし、
`allowSymlinkTargets` は既存のエージェントスキル構成向けにシンボリックリンクされたパスを保持します。
ターゲットのエントリは狭く保ってください。そのルート配下のすべてのスキルツリーが信頼済みでない限り、
`~` や `~/Projects` のような広いルートを指さないでください。

スキルごとのフィールド:

- `enabled`: バンドル済み/インストール済みであっても、スキルを無効化するには `false` を設定します。
- `env`: エージェント実行時に注入される環境変数（未設定の場合のみ）。
- `apiKey`: プライマリ環境変数を宣言するスキル向けの任意の便利設定。
  プレーンテキスト文字列または SecretRef オブジェクト（`{ source, provider, id }`）をサポートします。

## 注記

- `entries` 配下のキーは、既定ではスキル名に対応します。スキルが
  `metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使用します。
- 読み込み優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → バンドル済みスキル →
  `skills.load.extraDirs` です。
- ウォッチャーが有効な場合、スキルへの変更は次のエージェントターンで反映されます。

### サンドボックス化されたスキルと環境変数

セッションが **サンドボックス化** されている場合、スキルプロセスは設定済みのサンドボックスバックエンド内で実行されます。サンドボックスはホストの `process.env` を継承しません。

<Warning>
  グローバルの `env` と `skills.entries.<skill>.env`/`apiKey` は **ホスト** 実行にのみ適用されます。サンドボックス内では効果がないため、`GEMINI_API_KEY` に依存するスキルは、サンドボックスにその変数が別途与えられていない限り、`apiKey not configured` で失敗します。
</Warning>

次のいずれかを使用します。

- Docker バックエンドには `agents.defaults.sandbox.docker.env`（またはエージェントごとの `agents.list[].sandbox.docker.env`）。
- カスタムサンドボックスイメージまたはリモートサンドボックス環境に env を組み込みます。

## 関連

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    スキルとは何か、そしてどのように読み込まれるか。
  </Card>
  <Card title="スキルの作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムスキルパックの作成。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    ネイティブコマンドカタログとチャットディレクティブ。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な `skills` と `agents.skills` のスキーマ。
  </Card>
</CardGroup>
