---
read_when:
    - 新增或修改 Skills 設定
    - 調整隨附的允許清單或安裝行為
summary: Skills 設定結構描述與範例
title: Skills 設定
x-i18n:
    generated_at: "2026-04-30T03:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 16
---

大多數 Skills 載入器/安裝設定都位於 `~/.openclaw/openclaw.json` 中的 `skills` 底下。代理程式特定的 Skills 可見性位於 `agents.defaults.skills` 和 `agents.list[].skills` 底下。

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

若要使用內建的影像產生/編輯功能，請優先使用 `agents.defaults.imageGenerationModel` 加上核心 `image_generate` 工具。`skills.entries.*` 僅適用於自訂或第三方 Skills 工作流程。

如果你選擇特定的影像供應商/模型，也請設定該供應商的驗證/API 金鑰。常見範例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

範例：

- 原生 Nano Banana Pro 風格設定：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 設定：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 代理程式 Skills 允許清單

當你希望同一台機器/工作區使用相同的 Skills 根目錄，但每個代理程式有不同的可見 Skills 集合時，請使用代理程式設定。

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

- `agents.defaults.skills`：針對省略 `agents.list[].skills` 的代理程式所使用的共用基準允許清單。
- 省略 `agents.defaults.skills` 可讓 Skills 預設不受限制。
- `agents.list[].skills`：該代理程式的明確最終 Skills 集合；它不會與預設值合併。
- `agents.list[].skills: []`：不向該代理程式公開任何 Skills。

## 欄位

- 內建 Skills 根目錄一律包含 `~/.openclaw/skills`、`~/.agents/skills`、`<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：僅針對**內 bundled** Skills 的選用允許清單。設定後，只有清單中的 bundled Skills 符合資格（managed、agent 和 workspace Skills 不受影響）。
- `load.extraDirs`：要掃描的其他 Skills 目錄（最低優先順序）。
- `load.watch`：監看 Skills 資料夾並重新整理 Skills 快照（預設：true）。
- `load.watchDebounceMs`：Skills 監看器事件的防彈跳時間，以毫秒為單位（預設：250）。
- `install.preferBrew`：可用時優先使用 brew 安裝器（預設：true）。
- `install.nodeManager`：node 安裝器偏好設定（`npm` | `pnpm` | `yarn` | `bun`，預設：npm）。
  這只會影響 **Skills 安裝**；Gateway 執行階段仍應為 Node
  （不建議 WhatsApp/Telegram 使用 Bun）。
  - `openclaw setup --node-manager` 範圍較窄，目前接受 `npm`、`pnpm` 或 `bun`。如果你想要使用 Yarn 支援的 Skills 安裝，請手動設定 `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：個別 Skills 覆寫設定。
- `agents.defaults.skills`：選用的預設 Skills 允許清單，會由省略 `agents.list[].skills` 的代理程式繼承。
- `agents.list[].skills`：選用的個別代理程式最終 Skills 允許清單；明確清單會取代繼承的預設值，而不是合併。

個別 Skills 欄位：

- `enabled`：設定為 `false` 可停用 Skills，即使它是 bundled/installed。
- `env`：為代理程式執行注入的環境變數（僅在尚未設定時）。
- `apiKey`：針對宣告主要環境變數的 Skills 的選用便利設定。
  支援純文字字串或 SecretRef 物件（`{ source, provider, id }`）。

## 注意事項

- `entries` 底下的鍵預設會對應到 Skills 名稱。如果 Skills 定義了 `metadata.openclaw.skillKey`，請改用該鍵。
- 載入優先順序為 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → bundled Skills →
  `skills.load.extraDirs`。
- 啟用監看器時，Skills 的變更會在下一次代理程式回合被套用。

### 沙箱化 Skills + 環境變數

當工作階段為**沙箱化**時，Skills 程序會在已設定的沙箱後端內執行。沙箱**不會**繼承主機的 `process.env`。

請使用下列其中一項：

- Docker 後端使用 `agents.defaults.sandbox.docker.env`（或個別代理程式的 `agents.list[].sandbox.docker.env`）
- 將環境變數內建到你的自訂沙箱映像檔或遠端沙箱環境中

全域 `env` 和 `skills.entries.<skill>.env/apiKey` 僅適用於**主機**執行。

## 相關

- [Skills](/zh-TW/tools/skills)
- [建立 Skills](/zh-TW/tools/creating-skills)
- [斜線命令](/zh-TW/tools/slash-commands)
