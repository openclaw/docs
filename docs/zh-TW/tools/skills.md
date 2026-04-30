---
read_when:
    - 新增或修改 Skills
    - 變更技能門控、允許清單或載入規則
    - 了解技能優先順序與快照行為
sidebarTitle: Skills
summary: Skills：受管理型與工作區、門控規則、代理程式允許清單與設定串接
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:36:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw 使用與 **[AgentSkills](https://agentskills.io) 相容**的 Skills 資料夾，教導代理如何使用工具。每個 Skills 都是一個目錄，其中包含帶有 YAML frontmatter 和指示的 `SKILL.md`。OpenClaw 會載入內建 Skills 加上選用的本機覆寫，並在載入時根據環境、設定和二進位檔是否存在進行篩選。

## 位置與優先順序

OpenClaw 會從下列來源載入 Skills，**優先順序由高到低**：

| #   | 來源                  | 路徑                             |
| --- | --------------------- | -------------------------------- |
| 1   | 工作區 Skills         | `<workspace>/skills`             |
| 2   | 專案代理 Skills       | `<workspace>/.agents/skills`     |
| 3   | 個人代理 Skills       | `~/.agents/skills`               |
| 4   | 受管理/本機 Skills    | `~/.openclaw/skills`             |
| 5   | 內建 Skills           | 隨安裝提供                       |
| 6   | 額外 Skills 資料夾    | `skills.load.extraDirs` (設定)   |

如果 Skills 名稱衝突，優先順序最高的來源勝出。

## 每代理與共用 Skills

在**多代理**設定中，每個代理都有自己的工作區：

| 範圍                 | 路徑                                        | 可見對象                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 每代理               | `<workspace>/skills`                        | 僅該代理                    |
| 專案代理             | `<workspace>/.agents/skills`                | 僅該工作區的代理            |
| 個人代理             | `~/.agents/skills`                          | 該機器上的所有代理          |
| 共用受管理/本機      | `~/.openclaw/skills`                        | 該機器上的所有代理          |
| 共用額外目錄         | `skills.load.extraDirs` (最低優先順序)      | 該機器上的所有代理          |

同名出現在多個位置 → 優先順序最高的來源勝出。工作區優先於
專案代理，專案代理優先於個人代理，個人代理優先於受管理/本機，受管理/本機優先於內建，
內建優先於額外目錄。

## 代理 Skills 允許清單

Skills **位置**和 Skills **可見性**是分開的控制項。
位置/優先順序決定同名 Skills 的哪個副本勝出；代理
允許清單決定代理實際可以使用哪些 Skills。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 繼承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 取代預設值
      { id: "locked-down", skills: [] }, // 沒有 Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允許清單規則">
    - 省略 `agents.defaults.skills` 時，預設不限制 Skills。
    - 省略 `agents.list[].skills` 時，繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []` 表示沒有 Skills。
    - 非空的 `agents.list[].skills` 清單是該代理的**最終**集合，不會與預設值合併。
    - 有效允許清單會套用於提示建構、Skills 斜線命令探索、沙箱同步，以及 Skills 快照。

  </Accordion>
</AccordionGroup>

## Plugin 與 Skills

Plugin 可以在 `openclaw.plugin.json` 中列出 `skills` 目錄來隨附自己的 Skills（路徑相對於 Plugin 根目錄）。Plugin 啟用時會載入 Plugin Skills。這適合放置工具專用的操作指南：內容太長不適合放在工具描述中，但只要 Plugin 已安裝就應該可用。例如，瀏覽器 Plugin 會隨附 `browser-automation` Skills，用於多步驟瀏覽器控制。

Plugin Skills 目錄會合併到與 `skills.load.extraDirs` 相同的低優先順序路徑，因此同名的內建、受管理、代理或工作區 Skills 會覆寫它們。你可以透過 Plugin 設定項目上的 `metadata.openclaw.requires.config` 控制它們的啟用條件。

請參閱 [Plugin](/zh-TW/tools/plugin) 了解探索/設定，並參閱 [工具](/zh-TW/tools) 了解這些 Skills 所教導的工具介面。

## Skill Workshop

選用且實驗性的 **Skill Workshop** Plugin 可以從代理工作期間觀察到的可重用程序，建立或更新工作區 Skills。它預設為停用，必須透過 `plugins.entries.skill-workshop` 明確啟用。

Skill Workshop 只會寫入 `<workspace>/skills`，會掃描產生的內容，支援待核准或自動安全寫入，隔離不安全提案，並在成功寫入後重新整理 Skills 快照，讓新 Skills 無需重新啟動 Gateway 即可使用。

可用於像是 _「下次，驗證 GIF 歸屬」_ 這類修正，或是媒體 QA 檢查清單等得來不易的工作流程。請先從待核准開始；只有在受信任的工作區中檢閱其提案後，才使用自動寫入。完整指南：[Skill Workshop Plugin](/zh-TW/plugins/skill-workshop)。

## ClawHub（安裝與同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公開 Skills 登錄庫。
使用原生 `openclaw skills` 命令進行探索/安裝/更新，或使用獨立的 `clawhub` CLI 進行發布/同步工作流程。完整指南：
[ClawHub](/zh-TW/tools/clawhub)。

| 動作                               | 命令                                   |
| ---------------------------------- | -------------------------------------- |
| 將 Skills 安裝到工作區             | `openclaw skills install <skill-slug>` |
| 更新所有已安裝的 Skills            | `openclaw skills update --all`         |
| 同步（掃描 + 發布更新）            | `clawhub sync --all`                   |

原生 `openclaw skills install` 會安裝到作用中工作區的
`skills/` 目錄。獨立的 `clawhub` CLI 也會安裝到目前工作目錄下的
`./skills`（或退回到已設定的 OpenClaw 工作區）。OpenClaw 會在下一個工作階段將其識別為
`<workspace>/skills`。
已設定的 Skills 根目錄也支援一層分組，例如
`skills/<group>/<skill>/SKILL.md`，因此相關的第三方 Skills 可以放在共用資料夾下，而不需要廣泛遞迴掃描。

ClawHub Skills 頁面會在安裝前顯示最新的安全掃描狀態，並提供 VirusTotal、ClawScan 和靜態分析的掃描器詳細頁面。
`openclaw skills install <slug>` 仍然只是安裝路徑；發布者會透過 ClawHub 儀表板或
`clawhub skill rescan <slug>` 處理誤判。

## 安全性

<Warning>
將第三方 Skills 視為**不受信任的程式碼**。啟用前請先閱讀。
對於不受信任的輸入和有風險的工具，偏好使用沙箱執行。請參閱
[沙箱](/zh-TW/gateway/sandboxing) 了解代理端控制項。
</Warning>

- 工作區和額外目錄的 Skills 探索只接受解析後 realpath 仍位於已設定根目錄內的 Skills 根目錄和 `SKILL.md` 檔案。
- Gateway 支援的 Skills 相依項安裝（`skills.install`、上手流程，以及 Skills 設定 UI）會在執行安裝器中繼資料前執行內建的危險程式碼掃描器。除非呼叫端明確設定危險覆寫，否則預設會封鎖 `critical` 發現；可疑發現仍只會警告。
- `openclaw skills install <slug>` 不同，它會將 ClawHub Skills 資料夾下載到工作區，且不使用上述的安裝器中繼資料路徑。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 會將祕密注入該代理回合的**主機**程序（不是沙箱）。請避免將祕密放入提示和記錄中。

若要了解更完整的威脅模型和檢查清單，請參閱 [安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

`SKILL.md` 至少必須包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills 規格的版面/意圖。嵌入式代理使用的剖析器僅支援**單行** frontmatter 鍵；
`metadata` 應為**單行 JSON 物件**。在指示中使用 `{baseDir}` 來參照 Skills 資料夾路徑。

### 選用 frontmatter 鍵

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中以「網站」顯示的 URL。也支援透過 `metadata.openclaw.homepage` 設定。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，Skills 會公開為使用者斜線命令。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，Skills 會從模型提示中排除（仍可透過使用者呼叫使用）。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型並直接分派到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要呼叫的工具名稱。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，將原始 args 字串轉送到工具（不進行核心剖析）。工具會以 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` 呼叫。
</ParamField>

## 門控（載入時篩選器）

OpenClaw 會在載入時使用 `metadata`（單行 JSON）篩選 Skills：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 下的欄位：

<ParamField path="always" type="boolean">
  當為 `true` 時，一律包含 Skills（略過其他門控）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的選用 emoji。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中以「網站」顯示的選用 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  選用平台清單。如果設定，Skills 只會在那些 OS 上符合資格。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每一項都必須存在於 `PATH` 上。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少一項必須存在於 `PATH` 上。
</ParamField>
<ParamField path="requires.env" type="string[]">
  環境變數必須存在或由設定提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必須為真值的 `openclaw.json` 路徑清單。
</ParamField>
<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 關聯的環境變數名稱。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝器規格（brew/node/go/uv/download）。
</ParamField>

如果不存在 `metadata.openclaw`，Skills 一律符合資格（除非在設定中停用，或對內建 Skills 被 `skills.allowBundled` 封鎖）。

<Note>
舊版 `metadata.clawdbot` 區塊在缺少
`metadata.openclaw` 時仍會被接受，因此較舊的已安裝 Skills 會保留其相依項門控和安裝器提示。新的和更新後的 Skills 應使用
`metadata.openclaw`。
</Note>

### 沙箱注意事項

- `requires.bins` 會在 Skills 載入時於**主機**上檢查。
- 如果代理已沙箱化，二進位檔也必須存在於**容器內**。請透過 `agents.defaults.sandbox.docker.setupCommand`（或自訂映像）安裝它。`setupCommand` 會在容器建立後執行一次。套件安裝也需要網路輸出、可寫入的根 FS，以及沙箱中的 root 使用者。
- 範例：`summarize` Skills（`skills/summarize/SKILL.md`）需要沙箱容器中的 `summarize` CLI 才能在那裡執行。

### 安裝器規格

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="安裝程式選擇規則">
    - 如果列出多個安裝程式，Gateway 會挑選單一偏好的選項（可用時為 brew，否則為 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你可以查看可用的成品。
    - 安裝程式規格可以包含 `os: ["darwin"|"linux"|"win32"]`，以依平台篩選選項。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`（預設：npm；選項：npm/pnpm/yarn/bun）。這只會影響 Skills 安裝；Gateway 執行階段仍應使用 Node — 不建議將 Bun 用於 WhatsApp/Telegram。
    - Gateway 支援的安裝程式選擇由偏好驅動：當安裝規格混合多種類型時，若啟用 `skills.install.preferBrew` 且 `brew` 存在，OpenClaw 會優先使用 Homebrew，接著是 `uv`，再來是設定的 node manager，然後才是其他後備選項，例如 `go` 或 `download`。
    - 如果每個安裝規格都是 `download`，OpenClaw 會顯示所有下載選項，而不是收斂成單一偏好的安裝程式。

  </Accordion>
  <Accordion title="各安裝程式詳細資料">
    - **Go 安裝：**如果缺少 `go` 且 `brew` 可用，Gateway 會先透過 Homebrew 安裝 Go，並在可行時將 `GOBIN` 設為 Homebrew 的 `bin`。
    - **下載安裝：**`url`（必要）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（預設：偵測到封存檔時自動）、`stripComponents`、`targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定覆寫

可以在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切換內建與受管理的 Skills，並提供 env 值：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` 會停用此 Skill，即使它是內建或已安裝的 Skill。
  內建的 `coding-agent` Skill 預設不啟用：先設定
  `skills.entries.coding-agent.enabled: true`，再將其暴露給代理，
  然後確認 `claude`、`codex`、`opencode` 或 `pi` 其中之一已安裝，
  且已通過自身 CLI 的驗證。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 Skills 使用的便利設定。支援純文字或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  只有在程序中尚未設定該變數時才會注入。
</ParamField>
<ParamField path="config" type="object">
  用於自訂各 Skill 欄位的選用容器。自訂鍵必須放在這裡。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  僅適用於**內建** Skills 的選用允許清單。如果設定，只有清單中的內建 Skills 符合資格（不影響受管理/工作區 Skills）。
</ParamField>

如果 Skill 名稱包含連字號，請用引號包住鍵（JSON5 允許帶引號的鍵）。設定鍵預設會比對 **Skill 名稱** — 如果某個 Skill 定義了 `metadata.openclaw.skillKey`，請在 `skills.entries` 下使用該鍵。

<Note>
若要在 OpenClaw 內進行內建圖片生成/編輯，請使用核心
`image_generate` 工具搭配 `agents.defaults.imageGenerationModel`，
而不是內建 Skill。這裡的 Skill 範例適用於自訂或第三方
工作流程。若要使用原生圖片分析，請使用 `image` 工具搭配
`agents.defaults.imageModel`。如果你選擇 `openai/*`、`google/*`、
`fal/*` 或其他供應商特定的圖片模型，也請加入該供應商的
驗證/API 金鑰。
</Note>

## 環境注入

當代理執行開始時，OpenClaw 會：

1. 讀取 Skill 中繼資料。
2. 將 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 套用至 `process.env`。
3. 使用**符合資格**的 Skills 建立系統提示。
4. 在執行結束後還原原始環境。

環境注入的範圍**限於代理執行**，不是全域 shell 環境。

對於內建的 `claude-cli` 後端，OpenClaw 也會將相同的符合資格快照具體化為臨時 Claude Code Plugin，並透過 `--plugin-dir` 傳入。Claude Code 接著可以使用其原生 Skill 解析器，而 OpenClaw 仍掌控優先順序、各代理允許清單、門控，以及 `skills.entries.*` env/API 金鑰注入。其他 CLI 後端只使用提示目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**為符合資格的 Skills 建立快照，並在同一工作階段的後續回合重複使用該清單。Skills 或設定的變更會在下一個新工作階段生效。

Skills 可以在工作階段中途於兩種情況下重新整理：

- Skills 監看器已啟用。
- 出現新的符合資格遠端節點。

可將這視為**熱重新載入**：重新整理後的清單會在下一個代理回合套用。如果該工作階段的有效代理 Skill 允許清單改變，OpenClaw 會重新整理快照，讓可見的 Skills 與目前代理保持一致。

### Skills 監看器

預設情況下，OpenClaw 會監看 Skill 資料夾，並在 `SKILL.md` 檔案變更時遞增 Skills 快照。在 `skills.load` 下設定：

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### 遠端 macOS 節點（Linux Gateway）

如果 Gateway 在 Linux 上執行，但有一個允許
`system.run` 的 **macOS 節點**已連線（Exec 核准安全性未設為 `deny`），
當所需二進位檔存在於該節點上時，OpenClaw 可以將僅限 macOS 的 Skills 視為符合資格。代理應透過 `exec` 工具並搭配 `host=node` 執行這些 Skills。

這仰賴節點回報其指令支援，以及透過 `system.which` 或 `system.run` 進行 bin 探測。離線節點**不會**讓僅限遠端的 Skills 可見。如果已連線節點停止回應 bin 探測，OpenClaw 會清除其快取的 bin 符合項目，讓代理不再看到目前無法在該處執行的 Skills。

## Token 影響

當 Skills 符合資格時，OpenClaw 會將可用 Skills 的精簡 XML 清單注入系統提示（透過 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是確定性的：

- **基礎開銷**（僅在 ≥1 個 Skill 時）：195 個字元。
- **每個 Skill：**97 個字元 + XML 逸出後的 `<name>`、`<description>` 和 `<location>` 值長度。

公式（字元）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 逸出會將 `& < > " '` 展開為實體（`&amp;`、`&lt;` 等），
因此增加長度。Token 數量會因模型 tokenizer 而異。粗略的
OpenAI 風格估算約為 ~4 字元/token，因此每個 Skill 的 **97 個字元 ≈ 24 個 tokens**，再加上你的實際欄位長度。

## 受管理 Skills 生命週期

OpenClaw 會隨安裝（npm 套件或 OpenClaw.app）提供一組基準 Skills 作為**內建 Skills**。`~/.openclaw/skills` 用於本機覆寫 — 例如，在不變更內建副本的情況下釘選或修補某個 Skill。工作區 Skills 由使用者擁有，並會在名稱衝突時覆寫兩者。

## 想找更多 Skills？

瀏覽 [https://clawhub.ai](https://clawhub.ai)。完整設定
結構描述：[Skills 設定](/zh-TW/tools/skills-config)。

## 相關

- [ClawHub](/zh-TW/tools/clawhub) — 公共 Skills 登錄庫
- [建立 Skills](/zh-TW/tools/creating-skills) — 建立自訂 Skills
- [Plugin](/zh-TW/tools/plugin) — Plugin 系統概覽
- [Skill Workshop Plugin](/zh-TW/plugins/skill-workshop) — 從代理工作生成 Skills
- [Skills 設定](/zh-TW/tools/skills-config) — Skill 設定參考
- [斜線指令](/zh-TW/tools/slash-commands) — 所有可用的斜線指令
