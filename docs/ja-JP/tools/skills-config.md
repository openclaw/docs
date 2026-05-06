---
read_when:
    - Skills 設定の追加または変更
    - バンドル済み許可リストまたはインストール動作の調整
summary: Skills の設定スキーマと例
title: Skills 設定
x-i18n:
    generated_at: "2026-05-06T05:22:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1acfd34c7af3b8909187d77ae74c52656b5dcfa1abf42ca6a7fdb391854e5c7c
    source_path: tools/skills-config.md
    workflow: 16
---

ほとんどのスキルローダー/インストール設定は
`~/.openclaw/openclaw.json` の `skills` 配下にあります。エージェント固有のスキル表示設定は
`agents.defaults.skills` と `agents.list[].skills` 配下にあります。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
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
コアの `image_generate` ツールを使うことを推奨します。`skills.entries.*` はカスタムまたは
サードパーティのスキルワークフロー専用です。

特定の画像プロバイダー/モデルを選択する場合は、そのプロバイダーの
認証/API キーも設定してください。典型的な例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、
`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`。

例:

- ネイティブの Nano Banana Pro 風セットアップ: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- ネイティブの fal セットアップ: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## エージェントのスキル許可リスト

同じマシン/ワークスペースのスキルルートを使いながら、エージェントごとに
表示するスキルセットを変えたい場合は、エージェント設定を使います。

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

- `agents.defaults.skills`: `agents.list[].skills` を省略したエージェント向けの
  共有ベースライン許可リスト。
- デフォルトでスキルを制限しない場合は、`agents.defaults.skills` を省略します。
- `agents.list[].skills`: そのエージェントの明示的な最終スキルセット。デフォルトとは
  マージされません。
- `agents.list[].skills: []`: そのエージェントにはスキルを公開しません。

## フィールド

- 組み込みのスキルルートには常に `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills`、`<workspace>/skills` が含まれます。
- `allowBundled`: **バンドル**スキルだけを対象にする任意の許可リスト。設定すると、
  リスト内のバンドルスキルだけが対象になります（管理、エージェント、ワークスペースのスキルには影響しません）。
- `load.extraDirs`: 追加でスキャンするスキルディレクトリ（最も低い優先度）。
- `load.watch`: スキルフォルダーを監視し、スキルスナップショットを更新します（デフォルト: true）。
- `load.watchDebounceMs`: スキルウォッチャーイベントのデバウンス時間（ミリ秒、デフォルト: 250）。
- `install.preferBrew`: 利用可能な場合は brew インストーラーを優先します（デフォルト: true）。
- `install.nodeManager`: node インストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`、デフォルト: npm）。
  これは **スキルのインストール**にのみ影響します。Gateway ランタイムは引き続き Node にする必要があります
  （WhatsApp/Telegram では Bun は推奨されません）。
  - `openclaw setup --node-manager` はより狭い範囲の設定で、現在は `npm`、
    `pnpm`、`bun` を受け付けます。Yarn ベースのスキルインストールを使いたい場合は、
    `skills.install.nodeManager: "yarn"` を手動で設定してください。
- `entries.<skillKey>`: スキルごとの上書き設定。
- `agents.defaults.skills`: `agents.list[].skills` を省略したエージェントが継承する
  任意のデフォルトスキル許可リスト。
- `agents.list[].skills`: エージェントごとの任意の最終スキル許可リスト。明示的な
  リストは継承されたデフォルトをマージせずに置き換えます。

スキルごとのフィールド:

- `enabled`: バンドル済み/インストール済みであっても、スキルを無効化するには `false` を設定します。
- `env`: エージェント実行に注入される環境変数（まだ設定されていない場合のみ）。
- `apiKey`: プライマリ環境変数を宣言するスキル向けの任意の簡易設定。
  プレーンテキスト文字列または SecretRef オブジェクト（`{ source, provider, id }`）をサポートします。

## 注記

- `entries` 配下のキーは、デフォルトではスキル名に対応します。スキルが
  `metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使います。
- 読み込み優先度は `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → バンドルスキル →
  `skills.load.extraDirs` です。
- ウォッチャーが有効な場合、スキルへの変更は次のエージェントターンで反映されます。

### サンドボックス化されたスキルと環境変数

セッションが **サンドボックス化**されている場合、スキルプロセスは設定済みのサンドボックスバックエンド内で実行されます。サンドボックスはホストの `process.env` を継承**しません**。

<Warning>
  グローバルな `env` と `skills.entries.<skill>.env`/`apiKey` は **ホスト**実行にのみ適用されます。サンドボックス内では効果がないため、`GEMINI_API_KEY` に依存するスキルは、サンドボックスにその変数を別途渡さない限り、`apiKey not configured` で失敗します。
</Warning>

次のいずれかを使います:

- Docker バックエンドには `agents.defaults.sandbox.docker.env`（またはエージェントごとの `agents.list[].sandbox.docker.env`）。
- カスタムサンドボックスイメージまたはリモートサンドボックス環境に環境変数を組み込みます。

## 関連

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    スキルとは何か、およびその読み込み方法。
  </Card>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタムスキルパックの作成。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    ネイティブコマンドカタログとチャットディレクティブ。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な `skills` と `agents.skills` のスキーマ。
  </Card>
</CardGroup>
