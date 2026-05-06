---
read_when:
    - Skills 設定の追加または変更
    - 同梱された許可リストまたはインストール動作の調整
summary: Skills 設定スキーマと例
title: Skills 設定
x-i18n:
    generated_at: "2026-05-06T09:11:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

Skills のローダー/インストール構成の大半は、
`~/.openclaw/openclaw.json` の `skills` 配下にあります。エージェント固有の Skills 表示設定は
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

組み込みの画像生成/編集には、`agents.defaults.imageGenerationModel` とコアの `image_generate` ツールの使用を推奨します。`skills.entries.*` はカスタムまたは
サードパーティの Skills ワークフロー専用です。

特定の画像プロバイダー/モデルを選択する場合は、そのプロバイダーの
認証/API キーも構成してください。典型的な例: `google/*` には `GEMINI_API_KEY` または `GOOGLE_API_KEY`、
`openai/*` には `OPENAI_API_KEY`、`fal/*` には `FAL_KEY`。

例:

- ネイティブの Nano Banana Pro スタイル構成: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- ネイティブの fal 構成: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## エージェントの Skills 許可リスト

同じマシン/ワークスペースの Skills ルートを使いながら、エージェントごとに
表示される Skills セットを変えたい場合は、エージェント構成を使用します。

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

- `agents.defaults.skills`: `agents.list[].skills` を省略したエージェント用の共有ベースライン許可リスト。
- Skills をデフォルトで制限しない場合は、`agents.defaults.skills` を省略します。
- `agents.list[].skills`: そのエージェントの明示的な最終 Skills セット。デフォルトとは
  マージされません。
- `agents.list[].skills: []`: そのエージェントには Skills を公開しません。

## フィールド

- 組み込み Skills ルートには常に `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills`、`<workspace>/skills` が含まれます。
- `allowBundled`: **バンドル済み** Skills のみを対象にした任意の許可リスト。設定すると、リスト内の
  バンドル済み Skills だけが対象になります（管理済み、エージェント、ワークスペースの Skills には影響しません）。
- `load.extraDirs`: スキャンする追加の Skills ディレクトリ（最も低い優先順位）。
- `load.watch`: Skills フォルダーを監視し、Skills スナップショットを更新します（デフォルト: true）。
- `load.watchDebounceMs`: Skills ウォッチャーイベントのデバウンス時間（ミリ秒、デフォルト: 250）。
- `install.preferBrew`: 利用可能な場合は brew インストーラーを優先します（デフォルト: true）。
- `install.nodeManager`: Node インストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`、デフォルト: npm）。
  これは **Skills のインストール**にのみ影響します。Gateway ランタイムは引き続き Node にする必要があります
  （WhatsApp/Telegram には Bun は推奨されません）。
  - `openclaw setup --node-manager` はより狭い範囲の設定で、現在は `npm`、
    `pnpm`、`bun` を受け付けます。Yarn ベースの Skills インストールを使いたい場合は、
    `skills.install.nodeManager: "yarn"` を手動で設定してください。
- `entries.<skillKey>`: Skills ごとの上書き。
- `agents.defaults.skills`: `agents.list[].skills` を省略したエージェントに継承される、
  任意のデフォルト Skills 許可リスト。
- `agents.list[].skills`: エージェントごとの任意の最終 Skills 許可リスト。明示的な
  リストは、継承されたデフォルトとマージされず置き換えます。

Skills ごとのフィールド:

- `enabled`: Skills がバンドル済み/インストール済みでも、無効化するには `false` を設定します。
- `env`: エージェント実行時に注入される環境変数（まだ設定されていない場合のみ）。
- `apiKey`: プライマリ環境変数を宣言する Skills 向けの任意の簡易設定。
  プレーンテキスト文字列または SecretRef オブジェクト（`{ source, provider, id }`）をサポートします。

## 注記

- `entries` 配下のキーは、デフォルトで Skills 名に対応します。Skills が
  `metadata.openclaw.skillKey` を定義している場合は、そのキーを代わりに使用します。
- 読み込みの優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → バンドル済み Skills →
  `skills.load.extraDirs` です。
- ウォッチャーが有効な場合、Skills への変更は次のエージェントターンで取り込まれます。

### サンドボックス化された Skills と環境変数

セッションが**サンドボックス化**されている場合、Skills プロセスは構成済みのサンドボックスバックエンド内で実行されます。サンドボックスはホストの `process.env` を継承**しません**。

<Warning>
  グローバルの `env` と `skills.entries.<skill>.env`/`apiKey` は、**ホスト**実行にのみ適用されます。サンドボックス内では効果がないため、`GEMINI_API_KEY` に依存する Skills は、サンドボックスにその変数を別途渡さない限り、`apiKey not configured` で失敗します。
</Warning>

次のいずれかを使用します。

- Docker バックエンドには `agents.defaults.sandbox.docker.env`（またはエージェントごとの `agents.list[].sandbox.docker.env`）。
- カスタムサンドボックスイメージまたはリモートサンドボックス環境に環境変数を組み込みます。

## 関連

<CardGroup cols={2}>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="puzzle-piece">
    Skills とは何か、どのように読み込まれるか。
  </Card>
  <Card title="Skills の作成" href="/ja-JP/tools/creating-skills" icon="hammer">
    カスタム Skills パックの作成。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="terminal">
    ネイティブコマンドカタログとチャットディレクティブ。
  </Card>
  <Card title="構成リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な `skills` と `agents.skills` スキーマ。
  </Card>
</CardGroup>
