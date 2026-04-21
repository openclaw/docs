---
read_when:
    - Skills設定を追加または変更すること
    - bundled allowlistまたはインストール動作を調整すること
summary: Skills設定schemaと例
title: Skills設定
x-i18n:
    generated_at: "2026-04-21T04:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills設定

Skills loader/install設定のほとんどは、
`~/.openclaw/openclaw.json`の`skills`配下にあります。agent固有のSkill可視性は
`agents.defaults.skills`と`agents.list[].skills`配下にあります。

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
      nodeManager: "npm", // npm | pnpm | yarn | bun（Gateway runtimeは引き続きNode。bunは非推奨）
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
とコアの`image_generate` toolを優先してください。`skills.entries.*`は、
カスタムまたはサードパーティのSkill workflow専用です。

特定のimage provider/modelを選択する場合は、そのproviderの
auth/API keyも設定してください。典型的な例: `google/*`には
`GEMINI_API_KEY`または`GOOGLE_API_KEY`、`openai/*`には`OPENAI_API_KEY`、
`fal/*`には`FAL_KEY`です。

例:

- ネイティブなNano Bananaスタイル設定: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- ネイティブなfal設定: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## agent Skill allowlists

同じマシン/workspaceのSkill rootを使いつつ、
agentごとに見えるSkill集合を変えたい場合はagent configを使ってください。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // defaultsを継承 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // defaultsを置き換える
      { id: "locked-down", skills: [] }, // Skillsなし
    ],
  },
}
```

ルール:

- `agents.defaults.skills`: `agents.list[].skills`を省略したagentに対する
  共有ベースラインallowlist。
- `agents.defaults.skills`を省略すると、デフォルトではSkillsは無制限のままになります。
- `agents.list[].skills`: そのagent用の明示的な最終Skill集合。defaultsとは
  マージされません。
- `agents.list[].skills: []`: そのagentにはSkillsを一切公開しません。

## フィールド

- 組み込みSkill rootsには常に`~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills`、`<workspace>/skills`が含まれます。
- `allowBundled`: **bundled** Skills専用の任意allowlist。設定すると、
  一覧にあるbundled Skillsだけがeligibleになります
  （managed、agent、workspace Skillsは影響を受けません）。
- `load.extraDirs`: 追加でスキャンするSkillディレクトリ（最も低い優先順位）。
- `load.watch`: Skillフォルダを監視し、Skills snapshotを更新する（デフォルト: true）。
- `load.watchDebounceMs`: Skill watcher eventに対するミリ秒単位のdebounce（デフォルト: 250）。
- `install.preferBrew`: 利用可能な場合はbrewインストーラーを優先する（デフォルト: true）。
- `install.nodeManager`: Nodeインストーラーの優先設定（`npm` | `pnpm` | `yarn` | `bun`、デフォルト: npm）。
  これは**Skill installs**にのみ影響します。Gateway runtimeは引き続きNodeであるべきです
  （WhatsApp/TelegramではBunは非推奨）。
  - `openclaw setup --node-manager`はより限定的で、現在は`npm`、
    `pnpm`、`bun`を受け付けます。YarnベースのSkill installsを使いたい場合は
    `skills.install.nodeManager: "yarn"`を手動設定してください。
- `entries.<skillKey>`: Skillごとのoverride。
- `agents.defaults.skills`: `agents.list[].skills`を省略したagentsに継承される
  任意のデフォルトSkill allowlist。
- `agents.list[].skills`: agentごとの任意の最終Skill allowlist。明示的な
  listは継承されたdefaultsをマージではなく置換します。

Skillごとのフィールド:

- `enabled`: bundled/installed済みでもSkillを無効化するには`false`を設定。
- `env`: agent runに注入されるenvironment variables（まだ設定されていない場合のみ）。
- `apiKey`: 主env varを宣言するSkills向けの任意の簡易設定。
  平文文字列またはSecretRef object（`{ source, provider, id }`）をサポートします。

## 注意

- `entries`配下のkeysは、デフォルトではSkill名に対応します。Skillが
  `metadata.openclaw.skillKey`を定義している場合は、代わりにそのkeyを使用してください。
- Load優先順位は`<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → bundled Skills →
  `skills.load.extraDirs`です。
- watcherが有効な場合、Skillsへの変更は次のagent turnで反映されます。

### sandbox化されたSkills + env vars

セッションが**sandboxed**の場合、Skill processは設定された
sandbox backend内で実行されます。sandboxはホストの`process.env`を継承しません。

次のいずれかを使用してください。

- Docker backendでは`agents.defaults.sandbox.docker.env`（またはagentごとの`agents.list[].sandbox.docker.env`）
- envをカスタムsandbox imageまたはremote sandbox environmentに組み込む

グローバル`env`および`skills.entries.<skill>.env/apiKey`は、**host** runにのみ適用されます。
