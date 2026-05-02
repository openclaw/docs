---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 閘控、允許清單或載入規則
    - 了解 Skills 的優先順序與快照行為
sidebarTitle: Skills
summary: Skills：受管理與工作區、門控規則、代理程式允許清單，以及設定串接
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:06:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw 使用與 **[AgentSkills](https://agentskills.io) 相容**的技能資料夾來教導代理如何使用工具。每個技能都是一個目錄，其中包含帶有 YAML frontmatter 和指令的 `SKILL.md`。OpenClaw 會載入內建技能加上選用的本機覆寫，並在載入時根據環境、設定和二進位檔是否存在來篩選它們。

## 位置與優先順序

OpenClaw 會從下列來源載入技能，**最高優先順序在前**：

| #   | 來源                  | 路徑                             |
| --- | --------------------- | -------------------------------- |
| 1   | 工作區技能            | `<workspace>/skills`             |
| 2   | 專案代理技能          | `<workspace>/.agents/skills`     |
| 3   | 個人代理技能          | `~/.agents/skills`               |
| 4   | 受管理/本機技能       | `~/.openclaw/skills`             |
| 5   | 內建技能              | 隨安裝項目提供                   |
| 6   | 額外技能資料夾        | `skills.load.extraDirs`（設定）  |

如果技能名稱衝突，最高來源會勝出。

Codex CLI 的原生 `$CODEX_HOME/skills` 目錄不是這些 OpenClaw 技能根目錄之一。在 Codex harness 模式中，本機 app-server 啟動會使用每個代理隔離的 Codex home，因此個人 Codex CLI 技能不會隱式載入。使用 `openclaw migrate codex --dry-run` 清點它們，並使用 `openclaw migrate codex` 透過互動式核取方塊提示選擇技能目錄，再將它們複製到目前的 OpenClaw 代理工作區。對於非互動式執行，請針對要複製的確切技能重複使用 `--skill <name>`。

## 每代理技能與共用技能

在**多代理**設定中，每個代理都有自己的工作區：

| 範圍                 | 路徑                                        | 可見對象                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 每代理               | `<workspace>/skills`                        | 僅該代理                    |
| 專案代理             | `<workspace>/.agents/skills`                | 僅該工作區的代理            |
| 個人代理             | `~/.agents/skills`                          | 該機器上的所有代理          |
| 共用受管理/本機      | `~/.openclaw/skills`                        | 該機器上的所有代理          |
| 共用額外目錄         | `skills.load.extraDirs`（最低優先順序）     | 該機器上的所有代理          |

多個位置有相同名稱 → 最高來源會勝出。工作區優先於專案代理，專案代理優先於個人代理，個人代理優先於受管理/本機，受管理/本機優先於內建，內建優先於額外目錄。

## 代理技能允許清單

技能**位置**與技能**可見性**是分開的控制項。位置/優先順序決定同名技能的哪個副本勝出；代理允許清單決定代理實際上可以使用哪些技能。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 繼承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 取代預設值
      { id: "locked-down", skills: [] }, // 沒有技能
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允許清單規則">
    - 省略 `agents.defaults.skills` 時，預設不限制技能。
    - 省略 `agents.list[].skills` 時，會繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []` 表示沒有技能。
    - 非空的 `agents.list[].skills` 清單是該代理的**最終**集合，不會與預設值合併。
    - 有效的允許清單會套用於提示建構、技能斜線命令探索、sandbox 同步，以及技能快照。
  </Accordion>
</AccordionGroup>

## Plugin 與技能

Plugin 可以透過在 `openclaw.plugin.json` 中列出 `skills` 目錄來附帶自己的技能（路徑相對於 Plugin 根目錄）。Plugin 啟用時，Plugin 技能會載入。這適合放置工具專屬的操作指南；這些指南太長，不適合放在工具描述中，但只要安裝了該 Plugin 就應該可用。例如，瀏覽器 Plugin 會附帶一個 `browser-automation` 技能，用於多步驟瀏覽器控制。

Plugin 技能目錄會合併到與 `skills.load.extraDirs` 相同的低優先順序路徑中，因此同名的內建、受管理、代理或工作區技能會覆寫它們。你可以透過 Plugin 設定項目上的 `metadata.openclaw.requires.config` 來對它們進行 gating。

請參閱 [Plugin](/zh-TW/tools/plugin) 了解探索/設定，並參閱[工具](/zh-TW/tools)了解這些技能所教導的工具介面。

## 技能工作坊

選用的實驗性 **技能工作坊** Plugin 可以從代理工作期間觀察到的可重用程序建立或更新工作區技能。它預設停用，必須透過 `plugins.entries.skill-workshop` 明確啟用。

技能工作坊只會寫入 `<workspace>/skills`，會掃描產生的內容，支援待核准或自動安全寫入，隔離不安全的提案，並在成功寫入後重新整理技能快照，讓新技能無需重新啟動 Gateway 即可使用。

可將它用於像是 _「下次，驗證 GIF 署名」_ 這類修正，或像是媒體 QA 檢查清單這類得來不易的工作流程。請先從待核准開始；只有在受信任的工作區中檢閱其提案後，才使用自動寫入。完整指南：[技能工作坊 Plugin](/zh-TW/plugins/skill-workshop)。

## ClawHub（安裝與同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公開技能登錄檔。使用原生 `openclaw skills` 命令進行探索/安裝/更新，或使用獨立的 `clawhub` CLI 進行發布/同步工作流程。完整指南：[ClawHub](/zh-TW/tools/clawhub)。

| 動作                             | 命令                                   |
| -------------------------------- | -------------------------------------- |
| 將技能安裝到工作區               | `openclaw skills install <skill-slug>` |
| 更新所有已安裝技能               | `openclaw skills update --all`         |
| 同步（掃描 + 發布更新）          | `clawhub sync --all`                   |

原生 `openclaw skills install` 會安裝到作用中工作區的 `skills/` 目錄。獨立的 `clawhub` CLI 也會安裝到目前工作目錄下的 `./skills`（或退回到已設定的 OpenClaw 工作區）。OpenClaw 會在下一個工作階段將它識別為 `<workspace>/skills`。已設定的技能根目錄也支援一層分組，例如 `skills/<group>/<skill>/SKILL.md`，因此相關第三方技能可以保存在共用資料夾下，而不需要廣泛遞迴掃描。

ClawHub 技能頁面會在安裝前顯示最新的安全掃描狀態，並提供 VirusTotal、ClawScan 和靜態分析的掃描器詳細頁面。`openclaw skills install <slug>` 仍然只是安裝路徑；發布者可透過 ClawHub dashboard 或 `clawhub skill rescan <slug>` 從誤判中復原。

## 安全性

<Warning>
將第三方技能視為**不受信任的程式碼**。啟用前請先閱讀。對於不受信任的輸入和高風險工具，偏好使用 sandboxed 執行。請參閱 [Sandboxing](/zh-TW/gateway/sandboxing) 了解代理端控制項。
</Warning>

- 工作區與額外目錄技能探索只接受解析後 realpath 仍位於已設定根目錄內的技能根目錄和 `SKILL.md` 檔案。
- Gateway 支援的技能相依項安裝（`skills.install`、onboarding，以及 Skills 設定 UI）會在執行安裝程式 metadata 前執行內建危險程式碼掃描器。除非呼叫端明確設定危險覆寫，否則預設會封鎖 `critical` 發現；可疑發現仍只會警告。
- `openclaw skills install <slug>` 不同，它會將 ClawHub 技能資料夾下載到工作區，並且不使用上述安裝程式 metadata 路徑。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 會將秘密注入該代理回合的**主機**程序（不是 sandbox）。請避免將秘密放入提示和日誌。

如需更廣泛的威脅模型與檢查清單，請參閱[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

`SKILL.md` 至少必須包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills 規格來處理版面配置/意圖。嵌入式代理使用的解析器僅支援**單行** frontmatter 鍵；`metadata` 應為**單行 JSON 物件**。在指令中使用 `{baseDir}` 參照技能資料夾路徑。

### 選用 frontmatter 鍵

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的 URL。也支援透過 `metadata.openclaw.homepage` 設定。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，技能會公開為使用者斜線命令。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，OpenClaw 會將技能指令排除在代理的一般提示之外。技能仍會安裝，而且在 `user-invocable` 也為 `true` 時，仍可明確作為斜線命令執行。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型並直接派送到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要叫用的工具名稱。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具派送，將原始 args 字串轉發給工具（不進行核心解析）。工具會以 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` 叫用。
</ParamField>

## Gating（載入時篩選器）

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
  當為 `true` 時，一律包含該技能（略過其他 gating）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的選用 emoji。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的選用 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  選用平台清單。如果已設定，該技能只有在這些 OS 上才符合資格。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每個都必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少一個必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var 必須存在，或由設定提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必須為 truthy 的 `openclaw.json` 路徑清單。
</ParamField>
<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 關聯的 env var 名稱。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝程式規格（brew/node/go/uv/download）。
</ParamField>

如果沒有 `metadata.openclaw`，該技能一律符合資格（除非在設定中停用，或因內建技能的 `skills.allowBundled` 而被封鎖）。

<Note>
當 `metadata.openclaw` 不存在時，仍會接受舊版 `metadata.clawdbot` 區塊，因此較舊的已安裝技能會保留其相依項 gating 和安裝程式提示。新的和已更新的技能應使用 `metadata.openclaw`。
</Note>

### Sandboxing 注意事項

- `requires.bins` 會在技能載入時於**主機**上檢查。
- 如果代理處於 sandboxed 狀態，二進位檔也必須存在於**容器內**。請透過 `agents.defaults.sandbox.docker.setupCommand`（或自訂映像檔）安裝它。`setupCommand` 會在容器建立後執行一次。套件安裝也需要網路輸出、可寫入的根 FS，以及 sandbox 中的 root 使用者。
- 範例：`summarize` 技能（`skills/summarize/SKILL.md`）需要 sandbox 容器中的 `summarize` CLI 才能在其中執行。

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
    - 如果列出多個安裝程式，gateway 會挑選單一偏好的選項（可用時為 brew，否則為 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你查看可用的成品。
    - 安裝程式規格可以包含 `os: ["darwin"|"linux"|"win32"]`，以依平台篩選選項。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`（預設：npm；選項：npm/pnpm/yarn/bun）。這只會影響 skill 安裝；Gateway runtime 仍應使用 Node——不建議將 Bun 用於 WhatsApp/Telegram。
    - Gateway 支援的安裝程式選擇是偏好導向的：當安裝規格混合多種 kind 時，若已啟用 `skills.install.preferBrew` 且 `brew` 存在，OpenClaw 會優先使用 Homebrew，接著是 `uv`，再來是已設定的 node manager，最後才是其他 fallback，例如 `go` 或 `download`。
    - 如果每個安裝規格都是 `download`，OpenClaw 會顯示所有下載選項，而不是收斂成一個偏好的安裝程式。

  </Accordion>
  <Accordion title="各安裝程式詳細資訊">
    - **Go 安裝：**如果缺少 `go` 且 `brew` 可用，gateway 會先透過 Homebrew 安裝 Go，並在可行時將 `GOBIN` 設為 Homebrew 的 `bin`。
    - **下載安裝：**`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（預設：偵測到封存檔時自動）、`stripComponents`、`targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定覆寫

Bundled 與 managed skills 可以在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切換，並提供 env 值：

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
  `false` 會停用該 skill，即使它是 bundled 或已安裝。
  bundled `coding-agent` skill 採用選擇啟用：在將它暴露給 agent 前，請先設定
  `skills.entries.coding-agent.enabled: true`，
  接著確認已安裝 `claude`、`codex`、`opencode` 或 `pi` 其中之一，
  並已為其自己的 CLI 完成驗證。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 skills 使用的便利設定。支援純文字或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  只有在程序中尚未設定該變數時才會注入。
</ParamField>
<ParamField path="config" type="object">
  自訂每個 skill 欄位的選用容器。自訂鍵必須放在這裡。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  僅適用於 **bundled** skills 的選用允許清單。如果已設定，只有清單中的 bundled skills 符合資格（不影響 managed/workspace skills）。
</ParamField>

如果 skill 名稱包含連字號，請替 key 加上引號（JSON5 允許加引號的
key）。設定 key 預設會符合 **skill name**——如果 skill
定義了 `metadata.openclaw.skillKey`，請在 `skills.entries` 下使用該 key。

<Note>
若要在 OpenClaw 內進行內建影像產生/編輯，請使用核心
`image_generate` 工具搭配 `agents.defaults.imageGenerationModel`，
而不是 bundled skill。這裡的 Skill 範例適用於自訂或第三方
workflow。若要進行原生影像分析，請使用 `image` 工具搭配
`agents.defaults.imageModel`。如果你選擇 `openai/*`、`google/*`、
`fal/*` 或其他供應商專屬的影像模型，也請加入該供應商的
auth/API key。
</Note>

## 環境注入

當 agent 執行開始時，OpenClaw 會：

1. 讀取 skill metadata。
2. 將 `skills.entries.<key>.env` 與 `skills.entries.<key>.apiKey` 套用至 `process.env`。
3. 使用**符合資格**的 skills 建立 system prompt。
4. 在執行結束後還原原始環境。

環境注入**限定於 agent 執行範圍**，不是全域 shell
環境。

對於 bundled `claude-cli` backend，OpenClaw 也會將相同的
eligible snapshot 實體化為臨時 Claude Code plugin，並透過
`--plugin-dir` 傳入。Claude Code 接著可以使用其原生 skill resolver，同時
OpenClaw 仍掌控優先順序、每個 agent 的允許清單、gating，以及
`skills.entries.*` env/API key 注入。其他 CLI backends 只使用
prompt catalog。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**對符合資格的 skills 建立 snapshot，並在同一工作階段的後續回合重用該清單。skills 或 config 的變更會在下一個新工作階段生效。

在兩種情況下，Skills 可以在工作階段中途重新整理：

- 已啟用 skills watcher。
- 出現新的符合資格 remote node。

可將這視為 **hot reload**：重新整理後的清單會在下一個
agent 回合採用。如果該工作階段的有效 agent skill allowlist 發生變更，OpenClaw 會重新整理 snapshot，讓可見的 skills 與目前的 agent 保持一致。

### Skills watcher

預設情況下，OpenClaw 會監看 skill 資料夾，並在 `SKILL.md` 檔案變更時 bump skills snapshot。請在 `skills.load` 下設定：

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

### Remote macOS 節點（Linux gateway）

如果 Gateway 在 Linux 上執行，但有一個 **macOS node** 已連線且允許
`system.run`（Exec approvals security 未設為 `deny`），
OpenClaw 可以在該 node 上存在必要 binary 時，將僅限 macOS 的 skills 視為符合資格。agent 應透過 `exec` 工具並使用 `host=node` 執行這些 skills。

這仰賴 node 回報其 command support，以及透過 `system.which` 或 `system.run` 進行 bin probe。離線 nodes **不會**讓
remote-only skills 可見。如果已連線的 node 停止回應 bin
probes，OpenClaw 會清除其 cached bin matches，讓 agents 不再看到目前無法在該處執行的 skills。

## Token 影響

當 skills 符合資格時，OpenClaw 會將可用 skills 的精簡 XML 清單注入 system prompt（透過 `pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是確定性的：

- **基礎額外負擔**（僅在 ≥1 個 skill 時）：195 個字元。
- **每個 skill：**97 個字元 + XML escaped `<name>`、`<description>` 與 `<location>` 值的長度。

公式（字元）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping 會將 `& < > " '` 展開成 entities（`&amp;`、`&lt;` 等），
使長度增加。Token 數會因模型 tokenizer 而異。粗略的
OpenAI 風格估算約為 ~4 chars/token，因此每個
skill 的 **97 chars ≈ 24 tokens**，再加上你的實際欄位長度。

## Managed skills 生命週期

OpenClaw 會隨安裝（npm package 或 OpenClaw.app）提供一組基準 skills 作為 **bundled skills**。`~/.openclaw/skills` 用於
local overrides——例如，在不變更 bundled copy 的情況下 pin 或 patch skill。Workspace skills 由使用者擁有，且在名稱衝突時會覆寫兩者。

## 想尋找更多 skills？

瀏覽 [https://clawhub.ai](https://clawhub.ai)。完整設定
schema：[Skills config](/zh-TW/tools/skills-config)。

## 相關

- [ClawHub](/zh-TW/tools/clawhub) — public skills registry
- [Creating skills](/zh-TW/tools/creating-skills) — 建立自訂 skills
- [Plugins](/zh-TW/tools/plugin) — plugin system overview
- [Skill Workshop plugin](/zh-TW/plugins/skill-workshop) — 從 agent 工作產生 skills
- [Skills config](/zh-TW/tools/skills-config) — skill configuration reference
- [Slash commands](/zh-TW/tools/slash-commands) — 所有可用的 slash commands
