---
read_when:
    - 新增或修改 Skills 設定
    - 調整捆綁的允許清單或安裝行為
summary: Skills 設定結構描述與範例
title: Skills 設定
x-i18n:
    generated_at: "2026-05-06T03:00:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1acfd34c7af3b8909187d77ae74c52656b5dcfa1abf42ca6a7fdb391854e5c7c
    source_path: tools/skills-config.md
    workflow: 16
---

大多數 Skills 載入器/安裝設定位於
`~/.openclaw/openclaw.json` 的 `skills` 底下。Agent 專屬的 Skills 可見性位於
`agents.defaults.skills` 和 `agents.list[].skills` 底下。

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

若要使用內建圖片生成/編輯，請優先使用 `agents.defaults.imageGenerationModel`
加上核心 `image_generate` 工具。`skills.entries.*` 僅適用於自訂或第三方
Skills 工作流程。

如果你選擇特定圖片供應商/模型，也要設定該供應商的
驗證/API 金鑰。常見範例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，
`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

範例：

- 原生 Nano Banana Pro 風格設定：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 設定：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Agent Skills 允許清單

當你想在同一台機器/工作區使用相同的 Skills 根目錄，但讓每個 agent
可見的 Skills 集合不同時，請使用 agent 設定。

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

- `agents.defaults.skills`：共用基準允許清單，供省略
  `agents.list[].skills` 的 agent 使用。
- 省略 `agents.defaults.skills`，即可讓 Skills 預設不受限制。
- `agents.list[].skills`：該 agent 的明確最終 Skills 集合；它不會
  與預設值合併。
- `agents.list[].skills: []`：不向該 agent 暴露任何 Skills。

## 欄位

- 內建 Skills 根目錄一律包含 `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：選用的允許清單，僅適用於**隨附** Skills。設定後，只有
  清單中的隨附 Skills 符合資格（受管理、agent 和工作區 Skills 不受影響）。
- `load.extraDirs`：要掃描的其他 Skills 目錄（最低優先順序）。
- `load.watch`：監看 Skills 資料夾並重新整理 Skills 快照（預設：true）。
- `load.watchDebounceMs`：Skills 監看器事件的防抖時間，單位為毫秒（預設：250）。
- `install.preferBrew`：可用時優先使用 brew 安裝器（預設：true）。
- `install.nodeManager`：Node 安裝器偏好設定（`npm` | `pnpm` | `yarn` | `bun`，預設：npm）。
  這只會影響 **Skills 安裝**；Gateway 執行階段仍應使用 Node
  （WhatsApp/Telegram 不建議使用 Bun）。
  - `openclaw setup --node-manager` 範圍較窄，目前接受 `npm`、
    `pnpm` 或 `bun`。如果你想要 Yarn 支援的 Skills 安裝，請手動設定
    `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：個別 Skills 覆寫。
- `agents.defaults.skills`：選用的預設 Skills 允許清單，會由省略
  `agents.list[].skills` 的 agent 繼承。
- `agents.list[].skills`：選用的個別 agent 最終 Skills 允許清單；明確
  清單會取代繼承的預設值，而不是合併。

個別 Skills 欄位：

- `enabled`：設為 `false` 可停用某個 Skills，即使它已隨附/安裝。
- `env`：為 agent 執行注入的環境變數（僅在尚未設定時）。
- `apiKey`：供宣告主要環境變數的 Skills 使用的選用便利設定。
  支援純文字字串或 SecretRef 物件（`{ source, provider, id }`）。

## 注意事項

- `entries` 底下的鍵預設會對應到 Skills 名稱。如果某個 Skills 定義了
  `metadata.openclaw.skillKey`，請改用該鍵。
- 載入優先順序為 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 隨附 Skills →
  `skills.load.extraDirs`。
- 啟用監看器時，Skills 的變更會在下一個 agent 回合被採用。

### 沙箱化 Skills 和環境變數

當工作階段已**沙箱化**時，Skills 程序會在已設定的沙箱後端內執行。沙箱**不會**繼承主機的 `process.env`。

<Warning>
  全域 `env` 和 `skills.entries.<skill>.env`/`apiKey` 只會套用於**主機**執行。在沙箱內它們不會生效，因此依賴 `GEMINI_API_KEY` 的 Skills 會因 `apiKey not configured` 失敗，除非另行將該變數提供給沙箱。
</Warning>

請使用下列其中一種方式：

- Docker 後端使用 `agents.defaults.sandbox.docker.env`（或個別 agent 的 `agents.list[].sandbox.docker.env`）。
- 將 env 烘焙到你的自訂沙箱映像或遠端沙箱環境中。

## 相關內容

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-TW/tools/skills" icon="puzzle-piece">
    Skills 是什麼，以及它們如何載入。
  </Card>
  <Card title="Creating skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    撰寫自訂 Skills 套件。
  </Card>
  <Card title="Slash commands" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生命令目錄和聊天指令。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的 `skills` 和 `agents.skills` 結構描述。
  </Card>
</CardGroup>
