---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 閘控、允許清單或載入規則
    - 了解 Skills 優先順序與快照行為
sidebarTitle: Skills
summary: Skills 會教你的代理程式如何使用工具。了解它們如何載入、優先順序如何運作，以及如何設定閘控、允許清單與環境注入。
title: Skills
x-i18n:
    generated_at: "2026-07-05T11:47:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d532282eafcc5ac50a83e66b35100a928d99f536c6743c07cccba2da7721be40
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指示檔，用來教導代理如何以及何時使用工具。每個技能都位於包含 `SKILL.md` 檔案的目錄中，該檔案含有 YAML frontmatter 與 Markdown 內文。OpenClaw 會載入內建 Skills 以及任何本機覆寫，並在載入時依據環境、設定與二進位檔是否存在進行篩選。

<CardGroup cols={2}>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    從零開始建置並測試自訂技能。
  </Card>
  <Card title="技能工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    審閱並核准代理草擬的技能提案。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理允許清單。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    瀏覽並安裝社群 Skills。
  </Card>
</CardGroup>

## 載入順序

OpenClaw 會從下列來源載入，**優先順序最高者在前**。當相同技能名稱出現在多個位置時，最高來源會勝出。

| 優先順序 | 來源 | 路徑 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | 工作區 Skills | `<workspace>/skills` |
| 2 | 專案代理 Skills | `<workspace>/.agents/skills` |
| 3 | 個人代理 Skills | `~/.agents/skills` |
| 4 | 受管理／本機 Skills | `~/.openclaw/skills` |
| 5 | 內建 Skills | 隨安裝提供 |
| 6 — 最低 | 額外目錄 | `skills.load.extraDirs` + 外掛 Skills |

技能根目錄支援分組版面。只要 `SKILL.md` 出現在已設定根目錄下的任何位置（最多 6 層深），OpenClaw 就會探索到技能：

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

資料夾路徑僅用於整理。技能名稱與斜線命令來自 `name` frontmatter 欄位（若缺少 `name`，則使用目錄名稱）。代理允許清單（如下）也會依此 `name` 比對。

<Note>
  Codex 命令列介面的原生 `$CODEX_HOME/skills` 目錄**不是** OpenClaw
  技能根目錄。使用 `openclaw migrate plan codex` 盤點那些 Skills，然後使用
  `openclaw migrate codex` 將它們複製到你的 OpenClaw 工作區。
</Note>

## 每個代理與共享 Skills

在多代理設定中，每個代理都有自己的工作區。請使用符合你想要可見性的路徑：

| 範圍 | 路徑 | 可見對象 |
| -------------- | ---------------------------- | --------------------------- |
| 每個代理 | `<workspace>/skills` | 僅該代理 |
| 專案代理 | `<workspace>/.agents/skills` | 僅該工作區的代理 |
| 個人代理 | `~/.agents/skills` | 此機器上的所有代理 |
| 共享受管理 | `~/.openclaw/skills` | 此機器上的所有代理 |
| 額外目錄 | `skills.load.extraDirs` | 此機器上的所有代理 |

## 代理允許清單

技能**位置**（優先順序）與技能**可見性**（哪個代理可使用）是分開的控制項。使用允許清單來限制代理可見的 Skills，無論它們從何處載入。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允許清單規則">
    - 省略 `agents.defaults.skills`，預設讓所有 Skills 不受限制。
    - 省略 `agents.list[].skills`，以繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []`，使該代理不公開任何 Skills。
    - 非空的 `agents.list[].skills` 清單就是**最終**集合 — 不會與預設值合併。
    - 有效允許清單會套用於提示建構、斜線命令探索、沙盒同步與技能快照。
    - 這不是主機 Shell 授權邊界。如果同一個代理可以使用 `exec`，請另外透過沙盒、作業系統使用者隔離、exec 拒絕／允許清單，以及各資源的憑證來約束該 Shell。

  </Accordion>
</AccordionGroup>

## 外掛與 Skills

外掛可以透過在 `openclaw.plugin.json` 中列出 `skills` 目錄來附帶自己的 Skills（路徑相對於外掛根目錄）。外掛啟用時會載入外掛 Skills — 例如，瀏覽器外掛附帶了 `browser-automation` 技能，用於多步驟瀏覽器控制。

外掛技能目錄會在與 `skills.load.extraDirs` 相同的低優先層級合併，因此同名的內建、受管理、代理或工作區技能會覆寫它們。請透過其 frontmatter 中的 `metadata.openclaw.requires` 管控外掛技能自身的適用資格，與任何其他技能相同。

完整外掛系統請參閱[外掛](/zh-TW/tools/plugin)與[工具](/zh-TW/tools)。

## 技能工作坊

[技能工作坊](/zh-TW/tools/skill-workshop)是代理與你的作用中技能檔案之間的提案佇列。當代理發現可重複使用的工作時，它會草擬提案，而不是直接寫入 `SKILL.md`。你會在任何變更發生前審閱並核准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完整生命週期、命令列介面參考與設定請參閱[技能工作坊](/zh-TW/tools/skill-workshop)。

## 從 ClawHub 安裝

[ClawHub](https://clawhub.ai) 是公開 Skills 登錄檔。使用 `openclaw skills` 命令進行安裝與更新，或使用 `clawhub` 命令列介面進行發布與同步。

| 動作 | 命令 |
| ---------------------------------- | ------------------------------------------------------ |
| 將技能安裝到工作區 | `openclaw skills install @owner/<slug>` |
| 從 Git 儲存庫安裝 | `openclaw skills install git:owner/repo@ref` |
| 安裝本機技能目錄 | `openclaw skills install ./path/to/skill --as my-tool` |
| 為所有本機代理安裝 | `openclaw skills install @owner/<slug> --global` |
| 更新所有工作區 Skills | `openclaw skills update --all` |
| 更新共享受管理技能 | `openclaw skills update @owner/<slug> --global` |
| 更新所有共享受管理 Skills | `openclaw skills update --all --global` |
| 驗證技能的信任封套 | `openclaw skills verify @owner/<slug>` |
| 列印產生的 Skill Card | `openclaw skills verify @owner/<slug> --card` |
| 透過 ClawHub 命令列介面發布／同步 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="安裝詳細資訊">
    `openclaw skills install` 預設會安裝到作用中工作區的 `skills/`
    目錄。加入 `--global` 可安裝到共享的 `~/.openclaw/skills`
    目錄，除非代理允許清單縮小範圍，否則所有本機代理都可看見。

    Git 與本機安裝預期來源根目錄有 `SKILL.md`。若 `SKILL.md` frontmatter
    的 `name` 有效，slug 會來自該欄位，否則退回使用目錄或儲存庫名稱。使用 `--as <slug>` 可覆寫。
    `openclaw skills update` 只追蹤 ClawHub 安裝 — 重新安裝 Git 或本機來源即可重新整理它們。

  </Accordion>
  <Accordion title="驗證與安全掃描">
    `openclaw skills verify @owner/<slug>` 會向 ClawHub 要求該技能的
    `clawhub.skill.verify.v1` 信任封套。已安裝的 ClawHub Skills 會依據 `.clawhub/origin.json`
    中記錄的版本與登錄檔進行驗證。
    裸 slug 仍會針對既有已安裝或不含糊的 Skills 被接受，但含 owner 的參照可避免發布者混淆。

    ClawHub 技能頁面會在安裝前公開最新安全掃描狀態，並提供 VirusTotal、ClawScan 與靜態分析的詳細頁面。當 ClawHub 將驗證標示為失敗時，命令會以非零狀態碼結束。發布者可透過 ClawHub 儀表板或
    `clawhub skill rescan @owner/<slug>` 處理誤報。

  </Accordion>
  <Accordion title="私有封存安裝">
    需要非 ClawHub 傳遞的閘道用戶端，可以使用 `skills.upload.begin`、`skills.upload.chunk` 與 `skills.upload.commit` 暫存 zip 技能封存，
    然後用 `skills.install({ source: "upload", ... })` 安裝。此路徑預設關閉，並需要在
    `openclaw.json` 中設定 `skills.install.allowUploadedArchives: true`。一般 ClawHub 安裝從不需要該設定。
  </Accordion>
</AccordionGroup>

## 安全性

<Warning>
  將第三方 Skills 視為**不受信任的程式碼**。啟用前請先閱讀。
  對不受信任的輸入與高風險工具，請優先使用沙盒化執行。代理端控制項請參閱
  [沙盒](/zh-TW/gateway/sandboxing)。
</Warning>

<AccordionGroup>
  <Accordion title="路徑限制">
    工作區、專案代理與額外目錄的技能探索，只接受解析後 realpath 仍位於已設定根目錄內的技能根目錄，除非
    `skills.load.allowSymlinkTargets` 明確信任目標根目錄。
    只有在啟用 `skills.workshop.allowSymlinkTargetWrites` 時，技能工作坊才會透過那些受信任目標寫入。
    受管理的 `~/.openclaw/skills` 與個人的 `~/.agents/skills` 可以包含符號連結的技能資料夾，但每個 `SKILL.md` realpath 仍必須位於其解析後的技能目錄內。
  </Accordion>
  <Accordion title="操作員安裝政策">
    設定 `security.installPolicy`，在技能安裝繼續之前執行受信任的本機政策命令。該政策會接收中繼資料與已暫存來源路徑，套用於 ClawHub、上傳、Git、本機、更新與相依項安裝器路徑，且當命令無法回傳有效決策時會關閉失敗。
  </Accordion>
  <Accordion title="祕密注入範圍">
    `skills.entries.*.env` 與 `skills.entries.*.apiKey` 只會在該代理回合中將祕密注入**主機**行程 — 不會注入沙盒。請避免將祕密放入提示與日誌。
  </Accordion>
</AccordionGroup>

更廣泛的威脅模型與安全檢查清單，請參閱[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

每個技能的 frontmatter 至少需要 `name` 與 `description`：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 規格。Frontmatter
  會先以 YAML 剖析；若失敗，則退回僅支援單行的剖析器。
  巢狀 `metadata` 區塊（包括多行 YAML 映射）會被攤平成 JSON 字串並重新以 JSON5 剖析，因此
  [門控](#gating)下方顯示的區塊形式可正常運作。請在內文中使用 `{baseDir}` 參照技能資料夾路徑。
</Note>

### 選用 frontmatter 鍵

<ParamField path="homepage" type="string">
  在 macOS Skills 使用者介面中顯示為「網站」的 URL。也可透過
  `metadata.openclaw.homepage` 支援。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，技能會公開為可由使用者呼叫的斜線命令。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，OpenClaw 會將該技能的指示排除在代理的一般提示之外。當 `user-invocable`
  也為 `true` 時，該技能仍可作為斜線命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型，並直接分派到已註冊的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要叫用的工具名稱。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，會將原始 args 字串轉送給工具，不進行核心解析。工具會收到
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 閘控

OpenClaw 會在載入時使用 `metadata.openclaw` 篩選 Skills（嵌入 frontmatter 的 JSON5 物件，請參閱上方的解析注意事項）。沒有 `metadata.openclaw` 區塊的 Skill 一律符合資格，除非明確停用。

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

<ParamField path="always" type="boolean">
  為 `true` 時，一律包含該 Skill，並略過所有其他閘控。
</ParamField>

<ParamField path="emoji" type="string">
  顯示在 macOS Skills UI 中的選用 emoji。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的選用 URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  平台篩選器。設定後，該 Skill 只會在列出的作業系統上符合資格。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  每個二進位檔都必須存在於 `PATH`。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  至少一個二進位檔必須存在於 `PATH`。
</ParamField>

<ParamField path="requires.env" type="string[]">
  每個環境變數都必須存在於行程中，或透過設定提供。
</ParamField>

<ParamField path="requires.config" type="string[]">
  每個 `openclaw.json` 路徑都必須為 truthy。
</ParamField>

<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 相關聯的環境變數名稱。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝程式規格（brew / node / go / uv / download）。
</ParamField>

<Note>
  當 `metadata.openclaw` 不存在時，仍會接受舊版 `metadata.clawdbot` 區塊，因此較舊的已安裝 Skills 會保留其相依性閘控和安裝程式提示。新的 Skills 應使用 `metadata.openclaw`。
</Note>

### 安裝程式規格

安裝程式規格會告訴 macOS Skills UI 如何安裝相依項：

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
  <Accordion title="Installer selection rules">
    - 列出多個安裝程式時，閘道會挑選一個偏好的選項（可用時使用 brew，否則使用 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你可以查看所有可用成品。
    - 規格可以包含 `os: ["darwin"|"linux"|"win32"]` 以依平台篩選。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`（預設：npm；選項：npm / pnpm / yarn / bun）。這只會影響 Skill 安裝；閘道執行階段仍應為節點。
    - 閘道安裝程式偏好順序：Homebrew → uv → 已設定的 node manager → go → download。

  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew：** OpenClaw 不會自動安裝 Homebrew，也不會將 brew formula 轉譯成系統套件命令。在沒有 `brew` 的 Linux 容器中，只支援 brew 的安裝程式會被隱藏；請使用自訂映像檔或手動安裝相依項。
    - **Go：** OpenClaw 需要 Go 1.21 或更新版本才能自動安裝 Skill。如果缺少 `go` 且 Homebrew 可用，OpenClaw 會先透過 Homebrew 安裝 Go；在沒有 Homebrew 的 Linux 上，當重新整理後的 `golang-go` 候選版本符合最低版本時，也可以改用 root 或透過免密碼 `sudo` 使用 `apt-get`。相依項實際的 `go install` 一律以 OpenClaw 管理的專用 bin 目錄為目標（全新安裝時使用 Homebrew 的 `bin`，否則使用 `~/.local/bin`），而不是你設定的 `GOBIN` — 你自己的 `GOBIN`、`GOPATH` 和 `GOTOOLCHAIN` 環境變數會被讀取，但絕不會被覆寫。
    - **Download：** `url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（預設：偵測到封存檔時自動）、`stripComponents`、`targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。

  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` 會在載入 Skill 時於**主機**上檢查。如果代理在沙箱中執行，二進位檔也必須存在於**容器內**。請透過 `agents.defaults.sandbox.docker.setupCommand` 或自訂映像檔安裝它。`setupCommand` 會在容器建立後執行一次，並需要網路輸出、可寫入的 root FS，以及沙箱中的 root 使用者。
  </Accordion>
</AccordionGroup>

## 設定覆寫

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 底下切換並設定內建或受管理的 Skills：

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
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
  即使 Skill 已內建或已安裝，`false` 也會停用它。`coding-agent` 內建 Skill 採用選擇加入 — 設定 `skills.entries.coding-agent.enabled: true`，並確認已安裝且驗證 `claude`、`codex`、`opencode` 或另一個支援的命令列介面。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 Skills 使用的便利欄位。支援純文字字串或 SecretRef 物件。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  注入代理執行的環境變數。只有在行程中尚未設定該變數時才會注入。
</ParamField>

<ParamField path="config" type="object">
  用於自訂每個 Skill 設定欄位的選用集合。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  僅適用於**內建** Skills 的選用允許清單。設定後，只有清單中的內建 Skills 符合資格。受管理和工作區 Skills 不受影響。
</ParamField>

<Note>
  設定鍵預設會符合 **Skill 名稱**。如果 Skill 定義了 `metadata.openclaw.skillKey`，請改在 `skills.entries` 底下使用該鍵。請為含連字號的名稱加上引號：JSON5 允許加引號的鍵。
</Note>

## 環境注入

當代理執行開始時，OpenClaw 會：

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw 會解析代理的有效 Skill 清單，套用閘控規則、允許清單和設定覆寫。
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 會在執行期間套用到 `process.env`。
  </Step>
  <Step title="Builds the system prompt">
    符合資格的 Skills 會編譯成精簡的 XML 區塊，並注入系統提示。
  </Step>
  <Step title="Restores the environment">
    執行結束後，會還原原始環境。
  </Step>
</Steps>

<Warning>
  環境注入的範圍是**主機**代理執行，而不是沙箱。在沙箱內，`env` 和 `apiKey` 不會生效。請參閱 [Skills 設定](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)，了解如何將密鑰傳入沙箱化執行。
</Warning>

對於內建的 `claude-cli` 後端，OpenClaw 也會將同一份符合資格的 Skill 快照實體化為臨時 Claude Code 外掛，並透過 `--plugin-dir` 傳入。其他命令列介面後端只使用提示目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**快照符合資格的 Skills，並在工作階段後續所有回合重複使用該清單。對 Skills 或設定的變更會在下一個新工作階段生效。

Skills 會在兩種情況下於工作階段中重新整理：

- Skills 監看器偵測到 `SKILL.md` 變更。
- 新的符合資格遠端節點連線。

重新整理後的清單會在下一個代理回合採用。如果有效的代理允許清單變更，OpenClaw 會重新整理快照，讓可見 Skills 保持一致。

<AccordionGroup>
  <Accordion title="Skills watcher">
    預設情況下，OpenClaw 會監看 Skill 資料夾，並在 `SKILL.md` 檔案變更時提升快照版本。在 `skills.load` 底下設定：

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    對於 Skill 根 symlink 指向已設定根目錄之外的刻意 symlink 版面配置，請使用 `allowSymlinkTargets`，例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    只有在 Skill Workshop 也應該透過那些受信任的 symlink 路徑套用提案時，才啟用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    如果閘道在 Linux 上執行，但連線了允許 `system.run` 的 **macOS 節點**，且所需二進位檔存在於該節點上，OpenClaw 可以將僅限 macOS 的 Skills 視為符合資格。代理應透過 `exec` 工具並使用 `host=node` 執行這些 Skills。

    離線節點**不會**讓僅限遠端的 Skills 可見。如果節點停止回應 bin 探測，OpenClaw 會清除其快取的 bin 符合項。

  </Accordion>
</AccordionGroup>

## Token 影響

當 Skills 符合資格時，OpenClaw 會將精簡的 XML 區塊注入系統提示。成本是確定性的，並且會依每個 Skill 線性擴展：

- **基礎額外負擔**（只有在 1 個以上 Skills 符合資格時）：一段固定的介紹文字加上 `<available_skills>` wrapper。
- **每個 Skill：** 約 97 個字元 + 你的 `name`、`description` 和 `location` 欄位長度。
- XML escaping 會將 `& < > " '` 展開為 entities，每次出現會增加幾個字元。
- 以約 4 chars/token 計算，97 chars ≈ 每個 Skill 在欄位長度之前約 24 tokens。

如果算繪後的區塊會超過設定的提示預算（`skills.limits.maxSkillsPromptChars`），OpenClaw 會先移除描述（精簡格式：僅名稱 + 位置），接著截斷 Skill 清單，並加入指向 `openclaw skills check` 的注意事項。

請讓描述簡短且具描述性，以盡量降低提示額外負擔。

## 相關

<CardGroup cols={2}>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    撰寫自訂 Skill 的逐步指南。
  </Card>
  <Card title="Skill 工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    代理程式草擬 Skills 的提案佇列。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理程式允許清單。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    Skill 斜線命令的註冊與路由方式。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公開登錄檔上瀏覽並發布 Skills。
  </Card>
  <Card title="外掛" href="/zh-TW/tools/plugin" icon="plug">
    外掛可以隨附它們所記錄工具的 Skills。
  </Card>
</CardGroup>
