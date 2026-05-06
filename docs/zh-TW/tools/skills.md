---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 門控、允許清單或載入規則
    - 了解 Skills 優先順序與快照行為
sidebarTitle: Skills
summary: 'Skills: 受管理與工作區、閘控規則、代理程式允許清單與設定串接'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw 使用與 **[AgentSkills](https://agentskills.io) 相容** 的技能
資料夾來教導代理如何使用工具。每個技能都是一個目錄，
其中包含帶有 YAML 前置資料與指示的 `SKILL.md`。OpenClaw
會載入隨附技能加上選用的本機覆寫，並在載入時根據
環境、設定與二進位檔是否存在來篩選它們。

## 位置與優先順序

OpenClaw 會從下列來源載入技能，**優先順序由高到低**：

| #   | 來源                  | 路徑                             |
| --- | --------------------- | -------------------------------- |
| 1   | 工作區技能            | `<workspace>/skills`             |
| 2   | 專案代理技能          | `<workspace>/.agents/skills`     |
| 3   | 個人代理技能          | `~/.agents/skills`               |
| 4   | 受管理/本機技能       | `~/.openclaw/skills`             |
| 5   | 隨附技能              | 隨安裝項目一併提供               |
| 6   | 額外技能資料夾        | `skills.load.extraDirs`（設定）  |

如果技能名稱衝突，優先順序最高的來源會勝出。

Codex CLI 原生的 `$CODEX_HOME/skills` 目錄不是這些 OpenClaw
技能根目錄之一。在 Codex 執行框架模式中，本機應用程式伺服器啟動會使用
每個代理隔離的 Codex 主目錄，因此個人的 Codex CLI 技能不會隱含載入。
使用 `openclaw migrate codex --dry-run` 盤點它們，並使用
`openclaw migrate codex` 透過互動式核取方塊提示選擇技能目錄，
再將它們複製到目前的 OpenClaw 代理工作區。
若要進行非互動式執行，請針對要複製的確切技能重複使用 `--skill <name>`。

## 每個代理與共用技能

在**多代理**設定中，每個代理都有自己的工作區：

| 範圍                 | 路徑                                        | 可見對象                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 每個代理             | `<workspace>/skills`                        | 僅該代理                    |
| 專案代理             | `<workspace>/.agents/skills`                | 僅該工作區的代理            |
| 個人代理             | `~/.agents/skills`                          | 該機器上的所有代理          |
| 共用受管理/本機      | `~/.openclaw/skills`                        | 該機器上的所有代理          |
| 共用額外目錄         | `skills.load.extraDirs`（最低優先順序）     | 該機器上的所有代理          |

多個位置有相同名稱 → 優先順序最高的來源會勝出。工作區勝過
專案代理，勝過個人代理，勝過受管理/本機，勝過隨附，
勝過額外目錄。

## 代理技能允許清單

技能**位置**與技能**可見性**是分開的控制項。
位置/優先順序決定同名技能的哪個副本勝出；代理
允許清單決定代理實際可使用哪些技能。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允許清單規則">
    - 省略 `agents.defaults.skills`，預設即可不限制技能。
    - 省略 `agents.list[].skills`，即可繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []` 表示沒有技能。
    - 非空的 `agents.list[].skills` 清單就是該代理的**最終**集合 -
      它不會與預設值合併。
    - 有效允許清單會套用於提示建構、技能斜線命令探索、
      沙箱同步與技能快照。
  </Accordion>
</AccordionGroup>

## Plugin 與技能

Plugin 可以在 `openclaw.plugin.json` 中列出 `skills` 目錄，
來隨附自己的技能（路徑相對於 Plugin 根目錄）。啟用 Plugin 時會載入
Plugin 技能。這適合放置工具專用的操作指南：內容對工具描述來說太長，
但只要 Plugin 已安裝就應該可用 - 例如，瀏覽器
Plugin 隨附 `browser-automation` 技能，用於多步驟瀏覽器控制。

Plugin 技能目錄會合併到與 `skills.load.extraDirs` 相同的低優先順序路徑，
因此同名的隨附、受管理、代理或工作區技能會覆寫它們。
你可以透過 Plugin 設定項目上的 `metadata.openclaw.requires.config`
對它們設置閘控。

請參閱 [Plugin](/zh-TW/tools/plugin) 了解探索/設定，並參閱 [工具](/zh-TW/tools) 了解
這些技能所教導的工具介面。

## Skill Workshop

選用的實驗性 **Skill Workshop** Plugin 可以根據代理工作期間觀察到的
可重用程序，建立或更新工作區技能。它預設停用，必須透過
`plugins.entries.skill-workshop` 明確啟用。

Skill Workshop 只會寫入 `<workspace>/skills`、掃描產生的
內容、支援待核准或自動安全寫入、隔離不安全的提案，
並在成功寫入後重新整理技能快照，讓新技能無需重新啟動
Gateway 即可使用。

可將它用於修正，例如 _「下次請驗證 GIF 署名」_，或用於
得來不易的工作流程，例如媒體 QA 檢查清單。請從待核准開始；
只有在受信任的工作區中審查其提案後，才使用自動寫入。
完整指南：[Skill Workshop Plugin](/zh-TW/plugins/skill-workshop)。

## ClawHub（安裝與同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公開技能登錄庫。
使用原生 `openclaw skills` 命令進行探索/安裝/更新，或使用
獨立的 `clawhub` CLI 進行發布/同步工作流程。完整指南：
[ClawHub](/zh-TW/tools/clawhub)。

| 動作                               | 命令                                   |
| ---------------------------------- | -------------------------------------- |
| 將技能安裝到工作區                 | `openclaw skills install <skill-slug>` |
| 更新所有已安裝技能                 | `openclaw skills update --all`         |
| 同步（掃描 + 發布更新）            | `clawhub sync --all`                   |

原生 `openclaw skills install` 會安裝到作用中工作區的
`skills/` 目錄。獨立的 `clawhub` CLI 也會安裝到
目前工作目錄下的 `./skills`（或退回使用已設定的 OpenClaw 工作區）。
OpenClaw 會在下一個工作階段將其視為
`<workspace>/skills`。
已設定的技能根目錄也支援一層分組，例如
`skills/<group>/<skill>/SKILL.md`，因此相關的第三方技能可以
放在共用資料夾下，而不需要大範圍遞迴掃描。

ClawHub 技能頁面會在安裝前公開最新的安全掃描狀態，
並提供 VirusTotal、ClawScan 與靜態分析的掃描器詳細頁面。
`openclaw skills install <slug>` 仍然只是安裝路徑；發布者
可透過 ClawHub 控制台或 `clawhub skill rescan <slug>` 處理誤判。

## 安全性

<Warning>
將第三方技能視為**不受信任的程式碼**。啟用前請先閱讀。
對不受信任的輸入與高風險工具，偏好使用沙箱化執行。請參閱
[沙箱化](/zh-TW/gateway/sandboxing) 了解代理端控制項。
</Warning>

- 工作區與額外目錄的技能探索只接受解析後真實路徑仍位於已設定根目錄內的技能根目錄與 `SKILL.md` 檔案。
- Gateway 支援的技能依賴項安裝（`skills.install`、導入流程與 Skills 設定 UI）會在執行安裝程式中繼資料前，先執行內建的危險程式碼掃描器。除非呼叫端明確設定危險覆寫，否則 `critical` 發現預設會封鎖；可疑發現仍只會警告。
- `openclaw skills install <slug>` 不同 - 它會將 ClawHub 技能資料夾下載到工作區，且不會使用上方的安裝程式中繼資料路徑。
- `skills.entries.*.env` 與 `skills.entries.*.apiKey` 會把機密注入該代理回合的**主機**程序（不是沙箱）。請勿將機密放入提示與記錄。

如需更完整的威脅模型與檢查清單，請參閱 [安全性](/zh-TW/gateway/security)。

## `SKILL.md` 格式

`SKILL.md` 至少必須包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 的版面配置/意圖遵循 AgentSkills 規格。嵌入式代理使用的
剖析器只支援**單行**前置資料鍵；
`metadata` 應該是**單行 JSON 物件**。在
指示中使用 `{baseDir}` 參照技能資料夾路徑。

### 選用前置資料鍵

<ParamField path="homepage" type="string">
  URL 會在 macOS Skills UI 中顯示為「網站」。也可透過 `metadata.openclaw.homepage` 支援。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  為 `true` 時，該技能會公開為使用者斜線命令。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  為 `true` 時，OpenClaw 會讓該技能的指示不進入代理的一般
  提示。該技能仍會安裝，且當 `user-invocable` 也為 `true` 時，
  仍可明確以斜線命令執行。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  設定為 `tool` 時，斜線命令會略過模型並直接分派到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要叫用的工具名稱。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，會將原始引數字串轉送給工具（不由核心剖析）。工具會以 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` 叫用。
</ParamField>

## 閘控（載入時篩選器）

OpenClaw 會在載入時使用 `metadata`（單行 JSON）篩選技能：

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
  為 `true` 時，一律包含該技能（略過其他閘控）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的選用表情符號。
</ParamField>
<ParamField path="homepage" type="string">
  選用 URL，會在 macOS Skills UI 中顯示為「網站」。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  選用的平台清單。如果設定，該技能只會在那些作業系統上符合資格。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每一項都必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少一項必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.env" type="string[]">
  環境變數必須存在，或由設定提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必須為真值的 `openclaw.json` 路徑清單。
</ParamField>
<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 關聯的環境變數名稱。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝程式規格（brew/node/go/uv/download）。
</ParamField>

如果沒有 `metadata.openclaw`，該技能一律符合資格（除非
在設定中停用，或隨附技能被 `skills.allowBundled` 封鎖）。

<Note>
當 `metadata.openclaw` 不存在時，仍會接受舊版
`metadata.clawdbot` 區塊，因此較舊的已安裝技能會保留其
依賴項閘控與安裝程式提示。新的與已更新的技能應使用
`metadata.openclaw`。
</Note>

### 沙箱化注意事項

- `requires.bins` 會在技能載入時於**主機**上檢查。
- 如果代理已沙箱化，該二進位檔也必須存在於**容器內**。請透過 `agents.defaults.sandbox.docker.setupCommand`（或自訂映像）安裝它。`setupCommand` 會在容器建立後執行一次。套件安裝也需要網路出口、可寫入的根檔案系統，以及沙箱中的 root 使用者。
- 範例：`summarize` 技能（`skills/summarize/SKILL.md`）需要沙箱容器內有 `summarize` CLI，才能在那裡執行。

### 安裝程式規格

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
    - 如果列出多個安裝程式，Gateway 會挑選單一偏好選項（可用時為 brew，否則為 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你可以查看可用的成品。
    - 安裝程式規格可以包含 `os: ["darwin"|"linux"|"win32"]`，以依平台篩選選項。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`（預設：npm；選項：npm/pnpm/yarn/bun）。這只會影響 Skills 安裝；Gateway 執行階段仍應使用 Node，Bun 不建議用於 WhatsApp/Telegram。
    - Gateway 支援的安裝程式選擇由偏好設定驅動：當安裝規格混合多種類型時，若 `skills.install.preferBrew` 已啟用且 `brew` 存在，OpenClaw 會優先選擇 Homebrew，接著是 `uv`，然後是已設定的 node 管理器，再來才是其他備援，例如 `go` 或 `download`。
    - 如果每個安裝規格都是 `download`，OpenClaw 會顯示所有下載選項，而不是收斂成單一偏好安裝程式。

  </Accordion>
  <Accordion title="各安裝程式詳細資訊">
    - **Go 安裝：**如果缺少 `go` 且可使用 `brew`，Gateway 會先透過 Homebrew 安裝 Go，並在可能時將 `GOBIN` 設為 Homebrew 的 `bin`。
    - **下載安裝：**`url`（必要）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（預設：偵測到封存檔時自動）、`stripComponents`、`targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定覆寫

隨附與受管理的 Skills 可以在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切換，並提供環境值：

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
  即使 Skills 是隨附或已安裝，`false` 也會停用該 Skills。
  隨附的 `coding-agent` Skills 採用選擇啟用：在將它公開給代理之前，先設定
  `skills.entries.coding-agent.enabled: true`，
  然後確認已安裝 `claude`、`codex`、`opencode` 或 `pi` 其中之一，
  且已為其自身 CLI 完成驗證。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 Skills 使用的便利設定。支援純文字或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  只有當變數尚未在程序中設定時才會注入。
</ParamField>
<ParamField path="config" type="object">
  自訂每個 Skills 欄位的可選容器。自訂鍵必須放在這裡。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  僅適用於**隨附** Skills 的可選允許清單。若已設定，只有清單中的隨附 Skills 符合資格（不影響受管理/工作區 Skills）。
</ParamField>

如果 Skills 名稱包含連字號，請將鍵加上引號（JSON5 允許加引號的鍵）。設定鍵預設會符合 **Skills 名稱**；如果 Skills 定義了 `metadata.openclaw.skillKey`，請在 `skills.entries` 下使用該鍵。

<Note>
若要在 OpenClaw 內進行庫存圖片產生/編輯，請使用核心
`image_generate` 工具搭配 `agents.defaults.imageGenerationModel`，
而不是隨附 Skills。這裡的 Skills 範例適用於自訂或第三方工作流程。若要使用原生圖片分析，請使用 `image` 工具搭配
`agents.defaults.imageModel`。如果你選擇 `openai/*`、`google/*`、
`fal/*` 或其他供應商專屬圖片模型，也請加入該供應商的驗證/API 金鑰。
</Note>

## 環境注入

當代理執行開始時，OpenClaw 會：

1. 讀取 Skills metadata。
2. 將 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 套用到 `process.env`。
3. 使用**符合資格**的 Skills 建立系統提示。
4. 在執行結束後還原原始環境。

環境注入**僅限於代理執行範圍**，不是全域 shell 環境。

對於隨附的 `claude-cli` 後端，OpenClaw 也會將相同的符合資格快照具現化為暫時的 Claude Code Plugin，並透過 `--plugin-dir` 傳入。Claude Code 接著可以使用其原生 Skills resolver，同時 OpenClaw 仍負責優先順序、每個代理的允許清單、閘控，以及 `skills.entries.*` 環境/API 金鑰注入。其他 CLI 後端只使用提示目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**快照符合資格的 Skills，並在同一工作階段的後續回合重複使用該清單。Skills 或設定的變更會在下一個新工作階段生效。

Skills 可以在兩種情況下於工作階段中途重新整理：

- Skills 監看器已啟用。
- 出現新的符合資格遠端 node。

可將它視為**熱重新載入**：重新整理後的清單會在下一個代理回合採用。如果該工作階段的有效代理 Skills 允許清單有所變更，OpenClaw 會重新整理快照，讓可見的 Skills 與目前代理保持一致。

### Skills 監看器

預設情況下，OpenClaw 會監看 Skills 資料夾，並在 `SKILL.md` 檔案變更時推進 Skills 快照。在 `skills.load` 下設定：

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

### 遠端 macOS node（Linux gateway）

如果 Gateway 在 Linux 上執行，但已連線一個允許 `system.run` 的 **macOS node**（Exec 核准安全性未設為 `deny`），OpenClaw 可以在該 node 上存在必要二進位檔時，將僅限 macOS 的 Skills 視為符合資格。代理應透過 `exec` 工具搭配 `host=node` 執行那些 Skills。

這依賴 node 回報其命令支援，以及透過 `system.which` 或 `system.run` 進行 bin 探測。離線 node **不會**讓僅限遠端的 Skills 可見。如果已連線的 node 停止回應 bin 探測，OpenClaw 會清除其快取的 bin 符合項目，使代理不再看到目前無法在該處執行的 Skills。

## Token 影響

當 Skills 符合資格時，OpenClaw 會將可用 Skills 的精簡 XML 清單注入系統提示（透過 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是確定性的：

- **基礎開銷**（僅在 ≥1 個 Skills 時）：195 個字元。
- **每個 Skills：**97 個字元 + XML 跳脫後的 `<name>`、`<description>` 和 `<location>` 值長度。

公式（字元）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 跳脫會將 `& < > " '` 展開為實體（`&amp;`、`&lt;` 等），增加長度。Token 數會依模型 tokenizer 而異。粗略的 OpenAI 風格估算約為 4 字元/token，因此每個 Skills 的 **97 個字元 ≈ 24 個 token**，再加上你的實際欄位長度。

## 受管理 Skills 生命週期

OpenClaw 會隨安裝（npm package 或 OpenClaw.app）提供一組基準 Skills，作為**隨附 Skills**。`~/.openclaw/skills` 用於本機覆寫，例如在不變更隨附副本的情況下釘選或修補 Skills。工作區 Skills 由使用者擁有，並會在名稱衝突時覆寫兩者。

## 正在尋找更多 Skills？

瀏覽 [https://clawhub.ai](https://clawhub.ai)。完整設定結構描述：[Skills 設定](/zh-TW/tools/skills-config)。

## 相關

- [ClawHub](/zh-TW/tools/clawhub) - 公開 Skills 登錄檔
- [建立 Skills](/zh-TW/tools/creating-skills) - 建置自訂 Skills
- [Plugins](/zh-TW/tools/plugin) - Plugin 系統概觀
- [Skills Workshop Plugin](/zh-TW/plugins/skill-workshop) - 從代理工作產生 Skills
- [Skills 設定](/zh-TW/tools/skills-config) - Skills 設定參考
- [斜線命令](/zh-TW/tools/slash-commands) - 所有可用的斜線命令
