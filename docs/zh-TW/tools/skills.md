---
read_when:
    - 新增或修改 Skills
    - 變更技能門控、允許清單或載入規則
    - 了解技能優先順序和快照行為
sidebarTitle: Skills
summary: Skills：受管理與工作區、門控規則、代理程式允許清單，以及設定串接
title: Skills
x-i18n:
    generated_at: "2026-04-30T03:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: f744f5e961f872cae02aa0ed77e0bbba35e4715f5762ac45ce190b74b2fd8c5e
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw 使用與 **[AgentSkills](https://agentskills.io) 相容**的技能資料夾，教導代理如何使用工具。每個技能都是一個目錄，其中包含帶有 YAML frontmatter 與指示的 `SKILL.md`。OpenClaw 會載入內建技能與可選的本機覆寫，並在載入時根據環境、設定與二進位檔是否存在來篩選。

## 位置與優先順序

OpenClaw 會從這些來源載入技能，**優先順序由高到低**：

| #   | 來源                  | 路徑                             |
| --- | --------------------- | -------------------------------- |
| 1   | 工作區技能            | `<workspace>/skills`             |
| 2   | 專案代理技能          | `<workspace>/.agents/skills`     |
| 3   | 個人代理技能          | `~/.agents/skills`               |
| 4   | 受管理／本機技能      | `~/.openclaw/skills`             |
| 5   | 內建技能              | 隨安裝提供                       |
| 6   | 額外技能資料夾        | `skills.load.extraDirs`（設定）  |

如果技能名稱衝突，優先順序最高的來源會勝出。

## 每個代理專屬與共享技能

在**多代理**設定中，每個代理都有自己的工作區：

| 範圍                 | 路徑                                        | 可見對象                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 每個代理專屬         | `<workspace>/skills`                        | 只有該代理                  |
| 專案代理             | `<workspace>/.agents/skills`                | 只有該工作區的代理          |
| 個人代理             | `~/.agents/skills`                          | 該機器上的所有代理          |
| 共享受管理／本機     | `~/.openclaw/skills`                        | 該機器上的所有代理          |
| 共享額外目錄         | `skills.load.extraDirs`（最低優先順序）     | 該機器上的所有代理          |

多個位置出現相同名稱 → 優先順序最高的來源會勝出。工作區勝過專案代理，勝過個人代理，勝過受管理／本機，勝過內建，勝過額外目錄。

## 代理技能允許清單

技能**位置**與技能**可見性**是分開的控制項。位置／優先順序決定同名技能的哪個副本會勝出；代理允許清單決定代理實際可以使用哪些技能。

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
    - 省略 `agents.defaults.skills`，預設即不限制技能。
    - 省略 `agents.list[].skills` 以繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []` 表示沒有技能。
    - 非空的 `agents.list[].skills` 清單就是該代理的**最終**集合，不會與預設值合併。
    - 有效允許清單會套用於提示建構、技能斜線命令探索、沙箱同步與技能快照。
  </Accordion>
</AccordionGroup>

## Plugin 與技能

Plugin 可以在 `openclaw.plugin.json` 中列出 `skills` 目錄來隨附自己的技能（路徑相對於 Plugin 根目錄）。Plugin 啟用時會載入 Plugin 技能。這適合放置工具專屬的操作指南，這些指南對工具描述來說太長，但只要安裝該 Plugin 就應該可用。例如，瀏覽器 Plugin 會隨附一個 `browser-automation` 技能，用於多步驟瀏覽器控制。

Plugin 技能目錄會合併到與 `skills.load.extraDirs` 相同的低優先順序路徑，因此同名的內建、受管理、代理或工作區技能會覆寫它們。你可以透過 Plugin 設定項目上的 `metadata.openclaw.requires.config` 對它們設閘。

請參閱 [Plugin](/zh-TW/tools/plugin) 了解探索／設定，以及 [工具](/zh-TW/tools) 了解這些技能所教導的工具介面。

## Skill Workshop

可選且實驗性的 **Skill Workshop** Plugin 可以從代理工作期間觀察到的可重複使用程序，建立或更新工作區技能。它預設停用，必須透過 `plugins.entries.skill-workshop` 明確啟用。

Skill Workshop 只會寫入 `<workspace>/skills`、掃描產生的內容、支援待核准或自動安全寫入、隔離不安全提案，並在成功寫入後重新整理技能快照，讓新技能不需要重新啟動 Gateway 即可使用。

可用於像是 _「下次請驗證 GIF 出處」_ 這類修正，或媒體 QA 檢查清單這類得來不易的工作流程。先從待核准開始；只有在受信任的工作區中審查過提案後，才使用自動寫入。完整指南：[Skill Workshop Plugin](/zh-TW/plugins/skill-workshop)。

## ClawHub（安裝與同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公開技能登錄檔。使用原生 `openclaw skills` 命令進行探索／安裝／更新，或使用獨立的 `clawhub` CLI 進行發布／同步工作流程。完整指南：[ClawHub](/zh-TW/tools/clawhub)。

| 動作                               | 命令                                   |
| ---------------------------------- | -------------------------------------- |
| 將技能安裝到工作區                 | `openclaw skills install <skill-slug>` |
| 更新所有已安裝技能                 | `openclaw skills update --all`         |
| 同步（掃描 + 發布更新）            | `clawhub sync --all`                   |

原生 `openclaw skills install` 會安裝到作用中工作區的 `skills/` 目錄。獨立的 `clawhub` CLI 也會安裝到目前工作目錄下的 `./skills`（或退回到已設定的 OpenClaw 工作區）。OpenClaw 會在下一個工作階段將它作為 `<workspace>/skills` 採用。

ClawHub 技能頁面會在安裝前顯示最新安全掃描狀態，並提供 VirusTotal、ClawScan 與靜態分析的掃描器詳細頁面。`openclaw skills install <slug>` 仍然只是安裝路徑；發布者可透過 ClawHub 儀表板或 `clawhub skill rescan <slug>` 復原誤判。

## 安全性

<Warning>
將第三方技能視為**不受信任的程式碼**。啟用前請先閱讀。對不受信任的輸入與高風險工具，偏好使用沙箱化執行。請參閱[沙箱化](/zh-TW/gateway/sandboxing)了解代理端控制項。
</Warning>

- 工作區與額外目錄技能探索只接受解析後 realpath 仍位於設定根目錄內的技能根目錄與 `SKILL.md` 檔案。
- Gateway 支援的技能依賴安裝（`skills.install`、onboarding 與 Skills 設定 UI）會在執行安裝程式中繼資料前，執行內建危險程式碼掃描器。除非呼叫者明確設定危險覆寫，否則 `critical` 發現項目預設會封鎖；可疑發現項目仍只會警告。
- `openclaw skills install <slug>` 不同，它會將 ClawHub 技能資料夾下載到工作區，且不使用上述安裝程式中繼資料路徑。
- `skills.entries.*.env` 與 `skills.entries.*.apiKey` 會將祕密注入該代理回合的**主機**程序（不是沙箱）。請避免讓祕密出現在提示與記錄中。

若要了解更廣泛的威脅模型與檢查清單，請參閱[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

`SKILL.md` 至少必須包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills 規格的版面配置／意圖。嵌入式代理使用的解析器僅支援**單行** frontmatter 鍵；`metadata` 應為**單行 JSON 物件**。在指示中使用 `{baseDir}` 來參照技能資料夾路徑。

### 可選 frontmatter 鍵

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的 URL。也支援透過 `metadata.openclaw.homepage` 設定。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，技能會公開為使用者斜線命令。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，技能會從模型提示中排除（仍可透過使用者呼叫使用）。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型並直接分派給工具。
</ParamField>
<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要呼叫的工具名稱。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，會將原始 args 字串轉送給工具（無核心解析）。工具會以 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` 呼叫。
</ParamField>

## 設閘（載入時篩選器）

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
  當為 `true` 時，一律包含該技能（略過其他閘門）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的可選 emoji。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的可選 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  可選平台清單。若已設定，該技能只會在這些作業系統上符合資格。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每個項目都必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少一個項目必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.env" type="string[]">
  環境變數必須存在，或在設定中提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必須為 truthy 的 `openclaw.json` 路徑清單。
</ParamField>
<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 關聯的環境變數名稱。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的可選安裝程式規格（brew/node/go/uv/download）。
</ParamField>

如果沒有 `metadata.openclaw`，該技能一律符合資格（除非在設定中停用，或對內建技能被 `skills.allowBundled` 封鎖）。

<Note>
當 `metadata.openclaw` 不存在時，仍接受舊版 `metadata.clawdbot` 區塊，因此較舊的已安裝技能會保留其依賴閘門與安裝程式提示。新的與已更新的技能應使用 `metadata.openclaw`。
</Note>

### 沙箱化注意事項

- `requires.bins` 會在技能載入時於**主機**上檢查。
- 如果代理已沙箱化，二進位檔也必須存在於**容器內**。請透過 `agents.defaults.sandbox.docker.setupCommand`（或自訂映像）安裝它。`setupCommand` 會在容器建立後執行一次。套件安裝也需要網路輸出、可寫入的根檔案系統，以及沙箱中的 root 使用者。
- 範例：`summarize` 技能（`skills/summarize/SKILL.md`）需要沙箱容器中有 `summarize` CLI，才能在那裡執行。

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
    - 如果列出多個安裝程式，gateway 會選取單一偏好的選項（可用時使用 brew，否則使用 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你查看可用的成品。
    - 安裝程式規格可以包含 `os: ["darwin"|"linux"|"win32"]`，以依平台篩選選項。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`（預設：npm；選項：npm/pnpm/yarn/bun）。這只會影響 skill 安裝；Gateway runtime 仍應該是 Node，Bun 不建議用於 WhatsApp/Telegram。
    - Gateway 支援的安裝程式選擇由偏好設定驅動：當安裝規格混用不同種類時，如果已啟用 `skills.install.preferBrew` 且 `brew` 存在，OpenClaw 會優先使用 Homebrew，接著是 `uv`，再來是已設定的 node 管理器，然後才是 `go` 或 `download` 等其他備援選項。
    - 如果每個安裝規格都是 `download`，OpenClaw 會顯示所有下載選項，而不是收斂成單一偏好的安裝程式。

  </Accordion>
  <Accordion title="各安裝程式詳細資訊">
    - **Go 安裝：**如果缺少 `go` 且 `brew` 可用，gateway 會先透過 Homebrew 安裝 Go，並在可能時將 `GOBIN` 設為 Homebrew 的 `bin`。
    - **下載安裝：**`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（預設：偵測到封存檔時自動）、`stripComponents`、`targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定覆寫

可在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切換 bundled 和 managed 技能，並提供 env 值：

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
  即使技能是 bundled 或已安裝，`false` 也會停用該技能。
  bundled 的 `coding-agent` 技能是選擇加入：在將它公開給代理前，請先設定
  `skills.entries.coding-agent.enabled: true`，
  然後確認 `claude`、`codex`、`opencode` 或 `pi` 其中之一已安裝，
  且已為其自身的 CLI 完成驗證。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的技能使用的便利設定。支援純文字或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  只有在程序中尚未設定該變數時才注入。
</ParamField>
<ParamField path="config" type="object">
  自訂各技能欄位的選用容器。自訂鍵必須放在這裡。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  僅適用於 **bundled** 技能的選用 allowlist。如果已設定，只有清單中的 bundled 技能符合資格（managed/workspace 技能不受影響）。
</ParamField>

如果技能名稱包含連字號，請為鍵加上引號（JSON5 允許加引號的鍵）。設定鍵預設會符合**技能名稱**；如果技能定義了 `metadata.openclaw.skillKey`，請在 `skills.entries` 下使用該鍵。

<Note>
若要在 OpenClaw 內進行內建圖片生成/編輯，請使用核心
`image_generate` 工具搭配 `agents.defaults.imageGenerationModel`，
而不是 bundled 技能。這裡的技能範例適用於自訂或第三方工作流程。若要進行原生圖片分析，請使用 `image` 工具搭配
`agents.defaults.imageModel`。如果你選擇 `openai/*`、`google/*`、
`fal/*` 或其他提供者專屬圖片模型，也請加入該提供者的驗證/API key。
</Note>

## 環境注入

當代理執行開始時，OpenClaw 會：

1. 讀取技能 metadata。
2. 將 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 套用至 `process.env`。
3. 使用**符合資格**的技能建構 system prompt。
4. 在執行結束後還原原始環境。

環境注入的範圍**限於代理執行**，而不是全域 shell
環境。

對於 bundled 的 `claude-cli` 後端，OpenClaw 也會將相同的符合資格快照實體化為臨時 Claude Code Plugin，並透過
`--plugin-dir` 傳入。Claude Code 接著可以使用其原生技能解析器，同時
OpenClaw 仍掌握 precedence、每個代理的 allowlist、gating，以及
`skills.entries.*` env/API key 注入。其他 CLI 後端只使用
prompt catalog。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**擷取符合資格技能的快照，並在同一工作階段的後續回合重用該清單。技能或設定變更會在下一個新工作階段生效。

技能可在兩種情況下於工作階段中重新整理：

- 已啟用技能 watcher。
- 出現新的符合資格遠端 node。

可將這視為**熱重新載入**：重新整理後的清單會在下一個代理回合中被採用。如果該工作階段的有效代理技能 allowlist 改變，OpenClaw 會重新整理快照，讓可見技能與目前代理保持一致。

### Skills watcher

預設情況下，OpenClaw 會監看技能資料夾，並在 `SKILL.md` 檔案變更時更新技能快照。請在 `skills.load` 下設定：

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

### 遠端 macOS nodes（Linux gateway）

如果 Gateway 在 Linux 上執行，但有一個允許
`system.run` 的 **macOS node** 已連線（Exec approvals security 未設定為 `deny`），
OpenClaw 就能在該 node 上存在所需 binary 時，將僅限 macOS 的技能視為符合資格。代理應透過 `exec` 工具搭配 `host=node` 執行這些技能。

這仰賴 node 回報其 command support，以及透過 `system.which` 或 `system.run` 進行 bin probe。離線 nodes **不會**讓僅遠端技能可見。如果已連線的 node 停止回應 bin probe，OpenClaw 會清除其快取的 bin matches，讓代理不再看到目前無法在該處執行的技能。

## Token 影響

當技能符合資格時，OpenClaw 會將可用技能的精簡 XML 清單注入 system prompt（透過 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是確定性的：

- **基礎開銷**（僅在 ≥1 個技能時）：195 個字元。
- **每個技能：**97 個字元 + XML escaped 後的 `<name>`、`<description>` 和 `<location>` 值長度。

公式（字元）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping 會將 `& < > " '` 展開成 entities（`&amp;`、`&lt;` 等），
使長度增加。Token 數會因模型 tokenizer 而異。粗略的
OpenAI 風格估算約為 ~4 chars/token，因此每個技能的 **97 chars ≈ 24 tokens**，
再加上實際欄位長度。

## Managed 技能生命週期

OpenClaw 會隨安裝（npm package 或 OpenClaw.app）提供一組基準技能作為 **bundled 技能**。`~/.openclaw/skills` 可用於本機覆寫，例如固定或修補某個技能，而不變更 bundled 副本。Workspace 技能由使用者擁有，且在名稱衝突時會覆寫兩者。

## 想找更多技能？

瀏覽 [https://clawhub.ai](https://clawhub.ai)。完整設定
schema：[Skills 設定](/zh-TW/tools/skills-config)。

## 相關內容

- [ClawHub](/zh-TW/tools/clawhub) — 公開技能 registry
- [建立技能](/zh-TW/tools/creating-skills) — 建置自訂技能
- [Plugins](/zh-TW/tools/plugin) — Plugin 系統總覽
- [Skill Workshop plugin](/zh-TW/plugins/skill-workshop) — 從代理工作生成技能
- [Skills 設定](/zh-TW/tools/skills-config) — 技能設定參考
- [Slash commands](/zh-TW/tools/slash-commands) — 所有可用的 slash commands
