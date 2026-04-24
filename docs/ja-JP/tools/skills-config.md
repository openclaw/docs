---
read_when:
    - Skills 設定を追加または変更する場合
    - バンドル済み allowlist またはインストール動作を調整する場合
summary: Skills 設定スキーマと例
title: Skills 設定
x-i18n:
    generated_at: "2026-04-24T05:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

Skills ローダー / インストール設定の大半は、`~/.openclaw/openclaw.json` の
`skills` 配下にあります。agent 固有の Skills 可視性は `agents.defaults.skills` と `agents.list[].skills` にあります。

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime は引き続き Node。bun は非推奨)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // または平文文字列
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

組み込みの image generation / editing には、`agents.defaults.imageGenerationModel`
と core の `image_generate` ツールを優先してください。`skills.entries.*` は、custom または
サードパーティ skill workflow 専用です。

特定の image provider / model を選ぶ場合は、その provider の
auth / API キーも設定してください。典型例: `google/*` には
`GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` には
`OPENAI_API_KEY`、`fal/*` には `FAL_KEY` です。

例:

- Native Nano Banana Pro 風セットアップ: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Native fal セットアップ: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## agent Skills allowlist

同じマシン / workspace の skill root を使いつつ、
agent ごとに見える skill 集合を変えたい場合は agent config を使ってください。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // defaults を継承 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // defaults を置き換える
      { id: "locked-down", skills: [] }, // skill なし
    ],
  },
}
```

ルール:

- `agents.defaults.skills`: `agents.list[].skills` を省略した
  agent に対する共有ベースライン allowlist。
- `agents.defaults.skills` を省略すると、デフォルトでは skill は制限されません。
- `agents.list[].skills`: その agent の明示的な最終 skill 集合。defaults とは
  マージされません。
- `agents.list[].skills: []`: その agent には skill を一切公開しません。

## フィールド

- 組み込み skill root には常に `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills`、`<workspace>/skills` が含まれます。
- `allowBundled`: **バンドル済み** Skills のみを対象とする任意の allowlist。これを設定すると、
  リストにあるバンドル済み skill だけが対象になります（managed、agent、workspace skills は影響を受けません）。
- `load.extraDirs`: スキャンする追加 skill ディレクトリ（最も低い優先順位）。
- `load.watch`: skill フォルダを監視し、Skills スナップショットを更新します（デフォルト: true）。
- `load.watchDebounceMs`: skill watcher イベントの debounce（ミリ秒、デフォルト: 250）。
- `install.preferBrew`: 利用可能な場合に brew installer を優先します（デフォルト: true）。
- `install.nodeManager`: node installer の優先設定（`npm` | `pnpm` | `yarn` | `bun`、デフォルト: npm）。
  これは **skill インストール** にのみ影響します。Gateway runtime は引き続き Node を使うべきです
  （WhatsApp / Telegram では Bun 非推奨）。
  - `openclaw setup --node-manager` はより限定的で、現在は `npm`、
    `pnpm`、`bun` を受け付けます。Yarn ベースの skill install を使いたい場合は、
    `skills.install.nodeManager: "yarn"` を手動で設定してください。
- `entries.<skillKey>`: skill ごとの override。
- `agents.defaults.skills`: `agents.list[].skills` を省略した
  agent が継承する任意のデフォルト skill allowlist。
- `agents.list[].skills`: agent ごとの任意の最終 skill allowlist。明示的な
  リストは継承された defaults をマージせずに置き換えます。

skill ごとのフィールド:

- `enabled`: bundled / installed されていても、skill を無効化したい場合は `false` にします。
- `env`: agent 実行に注入される環境変数（まだ設定されていない場合のみ）。
- `apiKey`: 主たる env var を宣言する skill 向けの任意の簡易設定。
  平文文字列または SecretRef object（`{ source, provider, id }`）をサポートします。

## 注記

- `entries` 配下のキーは、デフォルトでは skill 名に対応します。skill が
  `metadata.openclaw.skillKey` を定義している場合は、代わりにそのキーを使います。
- 読み込み優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → bundled skills →
  `skills.load.extraDirs` です。
- watcher が有効なら、skill への変更は次の agent ターンで反映されます。

### sandbox 化された Skills + env var

セッションが **sandbox 化** されている場合、skill process は設定済みの
sandbox backend 内で実行されます。sandbox は host の `process.env` を継承しません。

次のいずれかを使ってください:

- Docker backend では `agents.defaults.sandbox.docker.env`（または agent ごとの `agents.list[].sandbox.docker.env`）
- custom sandbox image または remote sandbox environment に env を焼き込む

グローバル `env` と `skills.entries.<skill>.env/apiKey` は **host** 実行にのみ適用されます。

## 関連

- [Skills](/ja-JP/tools/skills)
- [Creating skills](/ja-JP/tools/creating-skills)
- [Slash commands](/ja-JP/tools/slash-commands)
