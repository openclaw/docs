---
read_when:
    - Skills config を追加または変更する
    - 同梱 allowlist またはインストール動作を調整する
summary: Skills config schema と例
title: Skills Config
x-i18n:
    generated_at: "2026-04-23T14:10:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3b0a5946242bb5c07fd88678c88e3ee62cda514a5afcc9328f67853e05ad3f
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills Config

skills loader/install の設定の大半は
`~/.openclaw/openclaw.json` の `skills` の下にあります。agent 固有の skill 可視性は
`agents.defaults.skills` と `agents.list[].skills` の下にあります。

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway ランタイムは引き続き Node; bun は非推奨)
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

組み込みの画像生成/編集では、`agents.defaults.imageGenerationModel`
と core の `image_generate` tool を優先してください。`skills.entries.*` は
カスタムまたはサードパーティの skill ワークフロー専用です。

特定の画像 provider/model を選ぶ場合は、その provider の
auth/API key も設定してください。一般的な例: `google/*` 用の
`GEMINI_API_KEY` または `GOOGLE_API_KEY`、`openai/*` 用の
`OPENAI_API_KEY`、`fal/*` 用の `FAL_KEY`。

例:

- ネイティブ Nano Banana Pro 風の設定: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- ネイティブ fal 設定: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## agent の skill allowlist

同じマシン/workspace の skill root を使いながら、
agent ごとに見える skill セットを変えたい場合は agent config を使います。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // defaults を継承 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // defaults を置換
      { id: "locked-down", skills: [] }, // skills なし
    ],
  },
}
```

ルール:

- `agents.defaults.skills`: `agents.list[].skills` を省略した
  agent 用の共有ベースライン allowlist。
- デフォルトで skills を無制限にするには `agents.defaults.skills` を省略します。
- `agents.list[].skills`: その agent 用の明示的な最終 skill セットです。defaults とは
  merge されません。
- `agents.list[].skills: []`: その agent には skills を一切公開しません。

## フィールド

- 組み込み skill root には常に `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills`、および `<workspace>/skills` が含まれます。
- `allowBundled`: **同梱** skills のみを対象にした任意の allowlist。設定すると、
  リスト内の同梱 skills だけが対象になります（managed、agent、workspace skills は影響なし）。
- `load.extraDirs`: スキャンする追加の skill directory（最も低い優先順位）。
- `load.watch`: skill folder を監視し、skills snapshot を更新します（デフォルト: true）。
- `load.watchDebounceMs`: skill watcher event 用の debounce ミリ秒（デフォルト: 250）。
- `install.preferBrew`: 利用可能な場合は brew installer を優先します（デフォルト: true）。
- `install.nodeManager`: node installer の優先設定（`npm` | `pnpm` | `yarn` | `bun`、デフォルト: `npm`）。
  これは **skill install** にのみ影響します。Gateway ランタイムは引き続き Node
  にしてください（WhatsApp/Telegram では Bun 非推奨）。
  - `openclaw setup --node-manager` はより限定的で、現在は `npm`、
    `pnpm`、または `bun` を受け付けます。Yarn ベースの skill install を使いたい場合は、
    `skills.install.nodeManager: "yarn"` を手動で設定してください。
- `entries.<skillKey>`: skill ごとの override。
- `agents.defaults.skills`: `agents.list[].skills` を省略した
  agent に継承される任意のデフォルト skill allowlist。
- `agents.list[].skills`: agent ごとの任意の最終 skill allowlist。明示的な
  リストは継承された defaults を merge せずに置き換えます。

skill ごとのフィールド:

- `enabled`: skill が同梱/インストール済みでも無効にするには `false` を設定します。
- `env`: agent 実行に注入する環境変数（まだ設定されていない場合のみ）。
- `apiKey`: 主 env var を宣言する skill 用の任意の簡易設定。
  平文文字列または SecretRef object（`{ source, provider, id }`）をサポートします。

## 注記

- `entries` の下の key は、デフォルトでは skill 名に対応します。skill が
  `metadata.openclaw.skillKey` を定義している場合は、その key を使用してください。
- 読み込み優先順位は `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 同梱 skills →
  `skills.load.extraDirs` です。
- watcher が有効な場合、skills の変更は次の agent turn で反映されます。

### sandbox 化された skills と env vars

session が**sandbox 化**されている場合、skill process は設定された
sandbox backend 内で実行されます。sandbox はホストの `process.env` を
継承しません。

次のいずれかを使用してください:

- Docker backend 用の `agents.defaults.sandbox.docker.env`（または agent ごとの `agents.list[].sandbox.docker.env`）
- カスタム sandbox image または remote sandbox environment に env を組み込む

グローバル `env` と `skills.entries.<skill>.env/apiKey` は **host** 実行にのみ適用されます。
