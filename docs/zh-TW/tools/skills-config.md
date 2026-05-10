---
read_when:
    - 新增或修改 Skills 設定
    - 調整隨附允許清單或安裝行為
summary: Skills 設定結構描述與範例
title: Skills 設定
x-i18n:
    generated_at: "2026-05-10T19:54:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

大多數 Skills 載入器/安裝設定都位於
`~/.openclaw/openclaw.json` 的 `skills` 之下。代理程式特定的 Skills 可見性位於
`agents.defaults.skills` 和 `agents.list[].skills` 之下。

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

對於內建的圖片生成/編輯，請優先使用 `agents.defaults.imageGenerationModel`
加上核心 `image_generate` 工具。`skills.entries.*` 只用於自訂或
第三方 Skills 工作流程。

如果你選取特定圖片提供者/模型，也要設定該提供者的
驗證/API 金鑰。常見範例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，
`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

範例：

- 原生 Nano Banana Pro 風格設定：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 設定：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 代理程式 Skills 允許清單

當你想在同一台機器/工作區使用相同的 Skills 根目錄，但每個代理程式
顯示不同的 Skills 集合時，請使用代理程式設定。

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

規則：

- `agents.defaults.skills`：供省略
  `agents.list[].skills` 的代理程式使用的共用基準允許清單。
- 省略 `agents.defaults.skills` 會讓 Skills 預設不受限制。
- `agents.list[].skills`：該代理程式的明確最終 Skills 集合；它不會
  與預設值合併。
- `agents.list[].skills: []`：不向該代理程式公開任何 Skills。

## 欄位

- 內建 Skills 根目錄一律包含 `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：僅適用於**隨附** Skills 的選用允許清單。設定後，只有
  清單中的隨附 Skills 符合資格（受管理、代理程式和工作區 Skills 不受影響）。
- `load.extraDirs`：要掃描的其他 Skills 目錄（最低優先順序）。
- `load.allowSymlinkTargets`：受信任的真實目標目錄，符號連結的
  Skills 資料夾即使位於該目標根目錄之外，也可以解析到其中。
  將它用於有意設計的同層 repo 配置，例如
  `~/.agents/skills/manager -> ~/Projects/manager/skills`。
- `load.watch`：監看 Skills 資料夾並重新整理 Skills 快照（預設：true）。
- `load.watchDebounceMs`：Skills 監看器事件的 debounce，單位為毫秒（預設：250）。
- `install.preferBrew`：可用時優先使用 brew 安裝器（預設：true）。
- `install.nodeManager`：Node 安裝器偏好設定（`npm` | `pnpm` | `yarn` | `bun`，預設：npm）。
  這只影響 **Skills 安裝**；Gateway runtime 仍應使用 Node
  （WhatsApp/Telegram 不建議使用 Bun）。
  - `openclaw setup --node-manager` 範圍較窄，目前接受 `npm`、
    `pnpm` 或 `bun`。如果你想要以 Yarn 支援的 Skills 安裝，請手動設定
    `skills.install.nodeManager: "yarn"`。
- `install.allowUploadedArchives`：允許受信任的 `operator.admin` Gateway
  用戶端安裝透過 `skills.upload.*` 暫存的私有 zip 封存
  （預設：false）。這只會啟用上傳封存路徑；一般 ClawHub
  安裝不需要它。
- `entries.<skillKey>`：每個 Skill 的覆寫。
- `agents.defaults.skills`：選用的預設 Skills 允許清單，會由省略
  `agents.list[].skills` 的代理程式繼承。
- `agents.list[].skills`：選用的每代理程式最終 Skills 允許清單；明確
  清單會取代繼承的預設值，而不是合併。

## 符號連結的同層 repo

預設情況下，每個 Skills 根目錄都是一個包含邊界。如果
`~/.agents/skills` 之下的 Skills 資料夾是符號連結，且解析到
`~/.agents/skills` 之外，OpenClaw 會略過它並記錄 `Skipping escaped skill path outside its configured
root`。

保留符號連結配置，並只允許受信任的目標根目錄：

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

使用此設定時，像
`~/.agents/skills/manager -> ~/Projects/manager/skills` 這樣的符號連結會在
realpath 解析後被接受。`extraDirs` 也會直接掃描同層 repo，而
`allowSymlinkTargets` 會為既有代理程式 Skills
配置保留符號連結路徑。請保持目標項目範圍狹窄；不要指向像 `~` 或
`~/Projects` 這類廣泛根目錄，除非該根目錄之下的每個 Skills 樹都受信任。

每個 Skill 的欄位：

- `enabled`：設定為 `false` 可停用某個 Skill，即使它是隨附/已安裝的 Skill。
- `env`：為代理程式執行注入的環境變數（僅在尚未設定時）。
- `apiKey`：供宣告主要環境變數的 Skills 使用的選用便利設定。
  支援純文字字串或 SecretRef 物件（`{ source, provider, id }`）。

## 注意事項

- `entries` 之下的鍵預設會對應到 Skill 名稱。如果某個 Skill 定義了
  `metadata.openclaw.skillKey`，請改用該鍵。
- 載入優先順序為 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 隨附 Skills →
  `skills.load.extraDirs`。
- 啟用監看器時，Skills 的變更會在下一次代理程式回合被接收。

### 沙盒化 Skills 與環境變數

當工作階段被**沙盒化**時，Skills 程序會在設定的沙盒後端內執行。沙盒**不會**繼承主機的 `process.env`。

<Warning>
  全域 `env` 和 `skills.entries.<skill>.env`/`apiKey` 只套用於**主機**執行。在沙盒內它們沒有作用，因此依賴 `GEMINI_API_KEY` 的 Skill 會失敗並顯示 `apiKey not configured`，除非另外將該變數提供給沙盒。
</Warning>

使用以下其中一種方式：

- Docker 後端使用 `agents.defaults.sandbox.docker.env`（或每代理程式的 `agents.list[].sandbox.docker.env`）。
- 將環境變數建入你的自訂沙盒映像檔或遠端沙盒環境。

## 相關

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="puzzle-piece">
    Skills 是什麼以及它們如何載入。
  </Card>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂 Skill 套件。
  </Card>
  <Card title="Slash commands" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生命令目錄與聊天指令。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 `skills` 和 `agents.skills` 結構描述。
  </Card>
</CardGroup>
