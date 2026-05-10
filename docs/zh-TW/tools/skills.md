---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 閘控、允許清單或載入規則
    - 了解 Skills 的優先順序與快照行為
sidebarTitle: Skills
summary: Skills：受管理與工作區、控管規則、代理程式允許清單與設定串接
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:54:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw 使用與 **[AgentSkills](https://agentskills.io) 相容**的 skill
資料夾來教導 agent 如何使用工具。每個 skill 都是一個目錄，
其中包含帶有 YAML frontmatter 和指示的 `SKILL.md`。OpenClaw
會載入內建 skills 加上選用的本機覆寫，並在載入時根據
環境、設定和二進位檔是否存在來篩選它們。

## 位置與優先順序

OpenClaw 會從這些來源載入 skills，**優先順序由高到低**：

| #   | 來源                  | 路徑                             |
| --- | --------------------- | -------------------------------- |
| 1   | Workspace skills      | `<workspace>/skills`             |
| 2   | 專案 agent skills     | `<workspace>/.agents/skills`     |
| 3   | 個人 agent skills     | `~/.agents/skills`               |
| 4   | 受管理/本機 skills    | `~/.openclaw/skills`             |
| 5   | 內建 skills           | 隨安裝提供                       |
| 6   | 額外 skill 資料夾     | `skills.load.extraDirs` (config) |

如果 skill 名稱衝突，最高來源會勝出。

Codex CLI 原生的 `$CODEX_HOME/skills` 目錄不是 OpenClaw 的
skill 根目錄之一。在 Codex harness 模式中，本機 app-server 啟動會使用隔離的
個別 agent Codex homes，因此個人 Codex CLI skills 不會被隱含載入。
使用 `openclaw migrate codex --dry-run` 來清點它們，並使用
`openclaw migrate codex` 透過互動式核取方塊提示選擇 skill 目錄，
再將它們複製到目前的 OpenClaw agent workspace。
對於非互動式執行，請重複 `--skill <name>` 以指定要複製的精確 skills。

## 個別 agent 與共用 skills

在**多 agent** 設定中，每個 agent 都有自己的 workspace：

| 範圍                 | 路徑                                        | 可見對象                    |
| -------------------- | ------------------------------------------- | --------------------------- |
| 個別 agent           | `<workspace>/skills`                        | 僅該 agent                  |
| 專案 agent           | `<workspace>/.agents/skills`                | 僅該 workspace 的 agent     |
| 個人 agent           | `~/.agents/skills`                          | 該機器上的所有 agents       |
| 共用受管理/本機      | `~/.openclaw/skills`                        | 該機器上的所有 agents       |
| 共用額外目錄         | `skills.load.extraDirs` (最低優先順序)      | 該機器上的所有 agents       |

相同名稱出現在多個位置 → 最高來源勝出。Workspace 優先於
專案 agent，優先於個人 agent，優先於受管理/本機，優先於內建，
優先於額外目錄。

## Agent skill allowlists

Skill **位置**和 skill **可見性**是不同的控制。
位置/優先順序決定同名 skill 的哪份副本勝出；agent
allowlists 決定 agent 實際可以使用哪些 skills。

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
  <Accordion title="Allowlist 規則">
    - 省略 `agents.defaults.skills`，預設即可不限制 skills。
    - 省略 `agents.list[].skills` 以繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []` 以停用所有 skills。
    - 非空的 `agents.list[].skills` 清單是該 agent 的**最終**集合 - 它不會與預設值合併。
    - 有效的 allowlist 會套用於 prompt 建構、skill slash-command discovery、sandbox sync，以及 skill snapshots。

  </Accordion>
</AccordionGroup>

## Plugins 與 skills

Plugins 可以在 `openclaw.plugin.json` 中列出 `skills` 目錄來隨附自己的 skills
（路徑相對於 Plugin 根目錄）。Plugin skills 會在 Plugin 啟用時載入。
這是放置工具專用操作指南的正確位置，這些指南對工具描述來說太長，
但應該在安裝 Plugin 時可用 - 例如，browser
Plugin 隨附 `browser-automation` skill，用於多步驟瀏覽器控制。

Plugin skill 目錄會合併到與 `skills.load.extraDirs` 相同的低優先順序路徑，
因此同名的內建、受管理、agent 或 workspace skill 會覆寫它們。
你可以透過 Plugin 設定項目上的 `metadata.openclaw.requires.config`
來設置門檻。

請參閱 [Plugins](/zh-TW/tools/plugin) 了解探索/設定，並參閱 [工具](/zh-TW/tools)
了解這些 skills 教導的工具介面。

## Skill Workshop

選用的實驗性 **Skill Workshop** Plugin 可以根據 agent 工作期間觀察到的可重用程序，
建立或更新 workspace skills。它預設停用，必須透過
`plugins.entries.skill-workshop` 明確啟用。

Skill Workshop 只會寫入 `<workspace>/skills`，掃描產生的內容，
支援待核准或自動安全寫入，隔離不安全的提案，並在成功寫入後
重新整理 skill snapshot，讓新的 skills 無需重新啟動 Gateway 即可使用。

用它來處理像是 _「下次，請驗證 GIF 歸屬」_ 這類更正，
或像媒體 QA 檢查清單這類得來不易的工作流程。先從待核准開始；
只有在受信任的 workspaces 中審查其提案後，才使用自動寫入。
完整指南：[Skill Workshop Plugin](/zh-TW/plugins/skill-workshop)。

## ClawHub（安裝與同步）

[ClawHub](https://clawhub.ai) 是 OpenClaw 的公開 skills registry。
使用原生 `openclaw skills` 命令來探索/安裝/更新，或使用獨立的
`clawhub` CLI 進行發布/同步工作流程。完整指南：
[ClawHub](/zh-TW/clawhub)。

| 動作                               | 命令                                   |
| ---------------------------------- | -------------------------------------- |
| 將 skill 安裝到 workspace          | `openclaw skills install <skill-slug>` |
| 更新所有已安裝的 skills            | `openclaw skills update --all`         |
| 同步（掃描 + 發布更新）            | `clawhub sync --all`                   |

原生 `openclaw skills install` 會安裝到作用中 workspace 的
`skills/` 目錄。獨立的 `clawhub` CLI 也會安裝到目前工作目錄下的
`./skills`（或退回到已設定的 OpenClaw workspace）。OpenClaw 會在下一個 session
將其識別為 `<workspace>/skills`。
已設定的 skill roots 也支援一層分組，例如
`skills/<group>/<skill>/SKILL.md`，因此相關的第三方 skills 可以保留在
共用資料夾下，而不需要廣泛遞迴掃描。

需要私有、非 ClawHub 傳遞的 Gateway clients 可以使用 `skills.upload.begin`、
`skills.upload.chunk` 和 `skills.upload.commit` 暫存 zip skill
封存，然後使用
`skills.install({ source: "upload", uploadId, slug, force?, sha256? })`
安裝已提交的上傳。這是供受信任 clients 使用的明確管理員上傳路徑，
不是一般的 `openclaw skills install <slug>` 或 ClawHub 安裝流程。
它預設關閉，且只有在 `openclaw.json` 中設定
`skills.install.allowUploadedArchives: true` 時才會運作。上傳模式仍會安裝到
預設 agent workspace 的 `skills/<slug>` 目錄；封存內部的資料夾名稱會被忽略，
不會用於最終安裝目標。

ClawHub skill 頁面會在安裝前顯示最新的安全掃描狀態，
並提供 VirusTotal、ClawScan 和靜態分析的 scanner 詳細資料頁。
`openclaw skills install <slug>` 仍然只是安裝路徑；發布者可透過
ClawHub 儀表板或 `clawhub skill rescan <slug>` 處理誤判。

## 安全性

<Warning>
將第三方 skills 視為**不受信任的程式碼**。啟用前請先閱讀。
對不受信任的輸入和高風險工具，優先使用 sandboxed runs。請參閱
[Sandboxing](/zh-TW/gateway/sandboxing) 了解 agent 端控制。
</Warning>

- Workspace 和 extra-dir skill discovery 只接受其解析後 realpath 仍位於已設定根目錄內的 skill roots 和 `SKILL.md` 檔案。
- Gateway private archive installs 預設關閉。明確啟用時，
  它們需要包含 `SKILL.md` 的已提交 zip upload，並重用與
  ClawHub skill installs 相同的封存解壓縮、路徑穿越、符號連結、force 和 rollback 保護。
  它們由 `skills.install.allowUploadedArchives` 控制；一般 ClawHub installs 不需要
  該設定。
- Gateway-backed skill dependency installs（`skills.install`、onboarding，以及 Skills settings UI）會在執行 installer metadata 前先執行內建 dangerous-code scanner。除非呼叫端明確設定 dangerous override，否則 `critical` findings 預設會阻擋；suspicious findings 仍只會警告。
- `openclaw skills install <slug>` 不同 - 它會將 ClawHub skill 資料夾下載到 workspace，且不使用上述 installer-metadata 路徑。
- `skills.entries.*.env` 和 `skills.entries.*.apiKey` 會將 secrets 注入該 agent turn 的 **host** process（不是 sandbox）。請避免將 secrets 放入 prompts 和 logs。

若需更廣泛的 threat model 和 checklists，請參閱 [安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

`SKILL.md` 至少必須包含：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw 遵循 AgentSkills spec 的版面/意圖。嵌入式 agent 使用的 parser
僅支援**單行** frontmatter keys；
`metadata` 應為**單行 JSON 物件**。在指示中使用 `{baseDir}`
來參照 skill 資料夾路徑。

### 選用 frontmatter keys

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的 URL。也支援透過 `metadata.openclaw.homepage` 設定。
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，skill 會公開為使用者 slash command。
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，OpenClaw 會將 skill 的指示排除在 agent 的一般
  prompt 之外。skill 仍會安裝，且當 `user-invocable` 也是 `true` 時，
  仍可作為 slash command 明確執行。
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，slash command 會繞過模型並直接分派到工具。
</ParamField>
<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要叫用的工具名稱。
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，會將原始 args 字串轉交給工具（不進行核心解析）。工具會以 `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` 叫用。
</ParamField>

## Gating（載入時篩選器）

OpenClaw 會在載入時使用 `metadata`（單行 JSON）篩選 skills：

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

`metadata.openclaw` 底下的欄位：

<ParamField path="always" type="boolean">
  當為 `true` 時，一律包含該 skill（略過其他閘門）。
</ParamField>
<ParamField path="emoji" type="string">
  macOS Skills UI 使用的選用 emoji。
</ParamField>
<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的選用 URL。
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  選用平台清單。如果設定，該 skill 只會在這些作業系統上符合資格。
</ParamField>
<ParamField path="requires.bins" type="string[]">
  每一項都必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  至少一項必須存在於 `PATH`。
</ParamField>
<ParamField path="requires.env" type="string[]">
  環境變數必須存在，或在設定中提供。
</ParamField>
<ParamField path="requires.config" type="string[]">
  必須為 truthy 的 `openclaw.json` 路徑清單。
</ParamField>
<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 相關聯的環境變數名稱。
</ParamField>
<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝程式規格（brew/node/go/uv/download）。
</ParamField>

如果沒有 `metadata.openclaw`，該 skill 一律符合資格（除非
在設定中停用，或對 bundled skills 被 `skills.allowBundled` 封鎖）。

<Note>
當 `metadata.openclaw` 不存在時，舊版 `metadata.clawdbot` 區塊仍會被接受，
因此較舊的已安裝 skills 會保留其
相依性閘門和安裝程式提示。新的和更新後的 skills 應使用
`metadata.openclaw`。
</Note>

### 沙箱注意事項

- `requires.bins` 會在 skill 載入時於**主機**上檢查。
- 如果 agent 在沙箱中，該二進位檔也必須存在於**容器內**。請透過 `agents.defaults.sandbox.docker.setupCommand`（或自訂映像檔）安裝它。`setupCommand` 會在容器建立後執行一次。套件安裝也需要網路出口、可寫入的根檔案系統，以及沙箱中的 root 使用者。
- 範例：`summarize` skill（`skills/summarize/SKILL.md`）需要沙箱容器中有 `summarize` CLI，才能在那裡執行。

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
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你可以查看可用的成品。
    - 安裝程式規格可以包含 `os: ["darwin"|"linux"|"win32"]`，以依平台篩選選項。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`（預設：npm；選項：npm/pnpm/yarn/bun）。這只會影響 skill 安裝；Gateway 執行階段仍應是 Node - WhatsApp/Telegram 不建議使用 Bun。
    - Gateway 後援的安裝程式選擇由偏好驅動：當安裝規格混合多種 kind 時，OpenClaw 會在 `skills.install.preferBrew` 啟用且 `brew` 存在時偏好 Homebrew，接著是 `uv`，接著是設定的 node 管理器，接著是其他備援如 `go` 或 `download`。
    - 如果每個安裝規格都是 `download`，OpenClaw 會顯示所有下載選項，而不是摺疊成一個偏好的安裝程式。

  </Accordion>
  <Accordion title="各安裝程式詳細資訊">
    - **Go 安裝：**如果缺少 `go` 且 `brew` 可用，gateway 會先透過 Homebrew 安裝 Go，並在可能時將 `GOBIN` 設為 Homebrew 的 `bin`。
    - **下載安裝：**`url`（必要）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（預設：偵測到封存檔時自動）、`stripComponents`、`targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
</AccordionGroup>

## 設定覆寫

Bundled 和受管理的 skills 可以在 `~/.openclaw/openclaw.json` 的
`skills.entries` 下切換，並提供 env 值：

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
  bundled `coding-agent` skill 需要選擇加入：先設定
  `skills.entries.coding-agent.enabled: true`，再將其公開給 agents，
  然後確認 `claude`、`codex`、`opencode` 或 `pi` 其中之一已安裝且
  已為其自己的 CLI 完成驗證。
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 skills 使用的便利項。支援純文字或 SecretRef。
</ParamField>
<ParamField path="env" type="Record<string, string>">
  只有在變數尚未於程序中設定時才注入。
</ParamField>
<ParamField path="config" type="object">
  自訂每個 skill 欄位的選用容器。自訂鍵必須放在這裡。
</ParamField>
<ParamField path="allowBundled" type="string[]">
  僅供 **bundled** skills 使用的選用允許清單。如果設定，只有清單中的 bundled skills 符合資格（受管理/工作區 skills 不受影響）。
</ParamField>

如果 skill 名稱包含連字號，請引用該鍵（JSON5 允許引用鍵）。
設定鍵預設會符合 **skill 名稱** - 如果某個 skill
定義了 `metadata.openclaw.skillKey`，請在 `skills.entries` 下使用該鍵。

<Note>
若要在 OpenClaw 內進行庫存圖片生成/編輯，請使用核心
`image_generate` tool 搭配 `agents.defaults.imageGenerationModel`，
而不是 bundled skill。這裡的 skill 範例適用於自訂或第三方
工作流程。若要進行原生圖片分析，請使用 `image` tool 搭配
`agents.defaults.imageModel`。如果你選擇 `openai/*`、`google/*`、
`fal/*` 或其他供應商特定的圖片模型，也請加入該供應商的
驗證/API 金鑰。
</Note>

## 環境注入

當 agent 執行開始時，OpenClaw 會：

1. 讀取 skill metadata。
2. 將 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 套用至 `process.env`。
3. 使用**符合資格**的 skills 建構系統提示。
4. 在執行結束後還原原始環境。

環境注入**限定於 agent 執行**，不是全域 shell
環境。

對於 bundled `claude-cli` 後端，OpenClaw 也會將相同的
符合資格快照實體化為暫時的 Claude Code plugin，並透過
`--plugin-dir` 傳遞。Claude Code 接著可以使用其原生 skill resolver，
而 OpenClaw 仍掌握優先順序、每個 agent 的允許清單、gating，以及
`skills.entries.*` env/API key 注入。其他 CLI 後端只使用
提示目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**快照符合資格的 skills，並在同一工作階段的後續回合中
重複使用該清單。skills 或設定的變更會在下一個新工作階段生效。

Skills 可以在兩種情況下於工作階段中途重新整理：

- Skills watcher 已啟用。
- 新的符合資格遠端節點出現。

可將此視為**熱重新載入**：重新整理的清單會在下一個
agent 回合採用。如果該工作階段的有效 agent skill 允許清單變更，
OpenClaw 會重新整理快照，讓可見 skills 與目前的 agent 保持一致。

### Skills watcher

預設情況下，OpenClaw 會監看 skill 資料夾，並在 `SKILL.md` 檔案變更時遞增 skills 快照。
在 `skills.load` 下設定：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

對於內建 skill 根目錄包含符號連結的有意 sibling-repo 版面配置，
請使用 `allowSymlinkTargets`，例如
`~/.agents/skills/manager -> ~/Projects/manager/skills`。目標清單會在 realpath 解析後
進行比對，且應保持狹窄。

### 遠端 macOS 節點（Linux gateway）

如果 Gateway 在 Linux 上執行，但有一個**macOS 節點**已連線且
允許 `system.run`（Exec approvals 安全性未設為 `deny`），
當必要的二進位檔存在於該節點上時，OpenClaw 可以將僅限 macOS 的 skills 視為符合資格。
agent 應透過 `exec` tool 搭配 `host=node` 執行這些 skills。

這仰賴節點回報其命令支援，以及透過 `system.which` 或 `system.run` 進行 bin probe。
離線節點**不會**讓僅限遠端的 skills 可見。如果已連線節點停止回應 bin
probes，OpenClaw 會清除其快取的 bin 符合項，讓 agents 不再看見
目前無法在該處執行的 skills。

## Token 影響

當 skills 符合資格時，OpenClaw 會將可用
skills 的精簡 XML 清單注入系統提示（透過
`pi-coding-agent` 中的 `formatSkillsForPrompt`）。成本是確定性的：

- **基礎開銷**（僅在 ≥1 個 skill 時）：195 個字元。
- **每個 skill：**97 個字元 + XML 逸出後的 `<name>`、`<description>` 和 `<location>` 值長度。

公式（字元）：

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML 逸出會將 `& < > " '` 展開成實體（`&amp;`、`&lt;` 等），
使長度增加。Token 數會依模型 tokenizer 而異。粗略的
OpenAI 風格估算約為 ~4 chars/token，因此每個
skill **97 個字元 ≈ 24 tokens**，外加你的實際欄位長度。

## 受管理 skills 生命週期

OpenClaw 會隨安裝（npm 套件或 OpenClaw.app）提供一組基準 skills 作為 **bundled skills**。
`~/.openclaw/skills` 用於
本機覆寫 - 例如，在不變更 bundled 副本的情況下釘選或修補某個 skill。
Workspace skills 由使用者擁有，且會在名稱衝突時覆寫兩者。

## 想尋找更多 skills？

瀏覽 [https://clawhub.ai](https://clawhub.ai)。完整設定
schema：[Skills 設定](/zh-TW/tools/skills-config)。

## 相關

- [ClawHub](/zh-TW/clawhub) - public skills registry
- [建立 skills](/zh-TW/tools/creating-skills) - 建構自訂 skills
- [Plugins](/zh-TW/tools/plugin) - plugin 系統概覽
- [Skill Workshop plugin](/zh-TW/plugins/skill-workshop) - 從 agent 工作生成 skills
- [Skills 設定](/zh-TW/tools/skills-config) - skill 設定參考
- [Slash commands](/zh-TW/tools/slash-commands) - 所有可用的 slash commands
