---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 閘門條件、允許清單或載入規則
    - 了解 Skills 優先順序與快照行為
sidebarTitle: Skills
summary: Skills 會教你的代理如何使用工具。了解它們如何載入、優先順序如何運作，以及如何設定閘控、允許清單與環境注入。
title: Skills
x-i18n:
    generated_at: "2026-07-01T05:29:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指令檔，用來教導代理如何以及何時使用工具。每個技能都位於一個目錄中，目錄內含一個具有 YAML frontmatter 和 Markdown 內文的 `SKILL.md` 檔案。OpenClaw 會載入內建 Skills 加上任何本機覆寫，並在載入時依據環境、設定和二進位檔是否存在進行篩選。

<CardGroup cols={2}>
  <Card title="Creating skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    從零開始建置並測試自訂技能。
  </Card>
  <Card title="Skill Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    審查並核准由代理草擬的技能提案。
  </Card>
  <Card title="Skills config" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理允許清單。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    瀏覽並安裝社群 Skills。
  </Card>
</CardGroup>

## 載入順序

OpenClaw 會從這些來源載入，**優先順序最高者在前**。當相同的技能名稱出現在多個位置時，最高順位的來源會勝出。

| 優先順序 | 來源 | 路徑 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | 工作區 Skills | `<workspace>/skills` |
| 2 | 專案代理 Skills | `<workspace>/.agents/skills` |
| 3 | 個人代理 Skills | `~/.agents/skills` |
| 4 | 受管理／本機 Skills | `~/.openclaw/skills` |
| 5 | 內建 Skills | 隨安裝提供 |
| 6 — 最低 | 額外目錄 | `skills.load.extraDirs` + 外掛 Skills |

技能根目錄支援分組版面配置。只要 `SKILL.md` 出現在已設定根目錄下的任何位置，OpenClaw 就會發現該技能：

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

資料夾路徑僅用於組織。技能的名稱、斜線命令和允許清單鍵都來自 `name` frontmatter 欄位（或在缺少 `name` 時使用目錄名稱）。

<Note>
  Codex 命令列介面的原生 `$CODEX_HOME/skills` 目錄**不是** OpenClaw
  技能根目錄。使用 `openclaw migrate plan codex` 盤點這些 Skills，然後
  使用 `openclaw migrate codex` 將它們複製到你的 OpenClaw 工作區。
</Note>

## 個別代理與共用 Skills

在多代理設定中，每個代理都有自己的工作區。請使用符合你所需可見性的路徑：

| 範圍 | 路徑 | 可見對象 |
| -------------- | ---------------------------- | --------------------------- |
| 個別代理 | `<workspace>/skills` | 僅該代理 |
| 專案代理 | `<workspace>/.agents/skills` | 僅該工作區的代理 |
| 個人代理 | `~/.agents/skills` | 此機器上的所有代理 |
| 共用受管理 | `~/.openclaw/skills` | 此機器上的所有代理 |
| 額外目錄 | `skills.load.extraDirs` | 此機器上的所有代理 |

## 代理允許清單

技能**位置**（優先順序）和技能**可見性**（哪個代理可以使用它）是分開的控制項。使用允許清單限制代理可看到哪些 Skills，不受其載入來源影響。

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
  <Accordion title="Allowlist rules">
    - 省略 `agents.defaults.skills`，預設讓所有 Skills 不受限制。
    - 省略 `agents.list[].skills`，以繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []`，讓該代理不公開任何 Skills。
    - 非空的 `agents.list[].skills` 清單是**最終**集合 — 不會與預設值合併。
    - 有效的允許清單會套用於提示建構、斜線命令探索、沙盒同步和技能快照。
    - 這不是主機 shell 的授權邊界。如果同一個代理可以使用 `exec`，請另外以沙盒、作業系統使用者隔離、exec 拒絕／允許清單，以及每項資源的憑證來限制該 shell。
  </Accordion>
</AccordionGroup>

## 外掛與 Skills

外掛可以在 `openclaw.plugin.json` 中列出 `skills` 目錄（路徑相對於外掛根目錄），以隨附自己的 Skills。外掛啟用時會載入外掛 Skills；例如，瀏覽器外掛會隨附一個 `browser-automation` 技能，用於多步驟瀏覽器控制。

外掛技能目錄會在與 `skills.load.extraDirs` 相同的低優先順序層級合併，因此同名的內建、受管理、代理或工作區技能會覆寫它們。請透過外掛設定項目上的 `metadata.openclaw.requires.config` 對它們設門檻。

請參閱[外掛](/zh-TW/tools/plugin)和[工具](/zh-TW/tools)以了解完整的外掛系統。

## Skill Workshop

[Skill Workshop](/zh-TW/tools/skill-workshop) 是代理與你的作用中技能檔案之間的提案佇列。當代理發現可重複使用的工作時，它會草擬提案，而不是直接寫入 `SKILL.md`。你會在任何內容變更前進行審查與核准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

請參閱 [Skill Workshop](/zh-TW/tools/skill-workshop) 以了解完整生命週期、命令列介面參考和設定。

## 從 ClawHub 安裝

[ClawHub](https://clawhub.ai) 是公開 Skills 登錄檔。使用 `openclaw skills` 命令進行安裝與更新，或使用 `clawhub` 命令列介面進行發布與同步。

| 動作 | 命令 |
| ---------------------------------- | ------------------------------------------------------ |
| 將技能安裝到工作區 | `openclaw skills install @owner/<slug>` |
| 從 Git 存放庫安裝 | `openclaw skills install git:owner/repo@ref` |
| 安裝本機技能目錄 | `openclaw skills install ./path/to/skill --as my-tool` |
| 為所有本機代理安裝 | `openclaw skills install @owner/<slug> --global` |
| 更新所有工作區 Skills | `openclaw skills update --all` |
| 更新共用受管理技能 | `openclaw skills update @owner/<slug> --global` |
| 更新所有共用受管理 Skills | `openclaw skills update --all --global` |
| 驗證技能的信任信封 | `openclaw skills verify @owner/<slug>` |
| 列印產生的 Skill 卡片 | `openclaw skills verify @owner/<slug> --card` |
| 透過 ClawHub 命令列介面發布／同步 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` 預設會安裝到作用中工作區的 `skills/`
    目錄。加入 `--global` 則會安裝到共用的 `~/.openclaw/skills`
    目錄；除非代理允許清單縮小範圍，否則所有本機代理都可看到。

    Git 和本機安裝會預期來源根目錄有 `SKILL.md`。slug 會在有效時來自
    `SKILL.md` frontmatter 的 `name`，然後退回使用目錄或存放庫名稱。使用
    `--as <slug>` 來覆寫。`openclaw skills update` 只追蹤 ClawHub 安裝 —
    若要重新整理 Git 或本機來源，請重新安裝。

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` 會向 ClawHub 要求該技能的
    `clawhub.skill.verify.v1` 信任信封。已安裝的 ClawHub Skills 會依據
    `.clawhub/origin.json` 中記錄的版本和登錄檔進行驗證。裸 slug 仍會被既有已安裝或明確無歧義的 Skills 接受，但包含擁有者的參照可避免發布者歧義。

    ClawHub 技能頁面會在安裝前公開最新安全掃描狀態，並提供 VirusTotal、ClawScan 和靜態分析的詳細頁面。當 ClawHub 將驗證標示為失敗時，命令會以非零狀態結束。發布者可透過 ClawHub 儀表板或
    `clawhub skill rescan @owner/<slug>` 從誤判中復原。

  </Accordion>
  <Accordion title="Private archive installs">
    需要非 ClawHub 傳遞的閘道用戶端，可以透過 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit` 暫存 zip 技能封存，然後以 `skills.install({ source: "upload", ... })` 安裝。此路徑預設關閉，且需要在
    `openclaw.json` 中設定 `skills.install.allowUploadedArchives: true`。一般 ClawHub 安裝永遠不需要該設定。
  </Accordion>
</AccordionGroup>

## 安全性

<Warning>
  將第三方 Skills 視為**不受信任的程式碼**。啟用前請先閱讀。
  對不受信任的輸入和高風險工具，偏好使用沙盒執行。請參閱
  [沙盒](/zh-TW/gateway/sandboxing)以了解代理端控制。
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    工作區、專案代理和額外目錄技能探索，只接受解析後 realpath 仍留在已設定根目錄內的技能根目錄，除非 `skills.load.allowSymlinkTargets` 明確信任目標根目錄。
    只有在啟用 `skills.workshop.allowSymlinkTargetWrites` 時，Skill Workshop 才會透過這些受信任目標寫入。
    受管理的 `~/.openclaw/skills` 和個人的 `~/.agents/skills` 可以包含符號連結的技能資料夾，但每個 `SKILL.md` realpath 仍必須留在其解析後的技能目錄內。
  </Accordion>
  <Accordion title="Operator install policy">
    設定 `security.installPolicy`，在技能安裝繼續前執行受信任的本機政策命令。該政策會接收中繼資料與已暫存的來源路徑，並套用於 ClawHub、已上傳、Git、本機、更新和相依套件安裝器路徑；當命令無法回傳有效決策時，會以封閉方式失敗。
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` 和 `skills.entries.*.apiKey` 只會在該代理回合期間，將秘密注入該代理的**主機**程序中 — 不會注入沙盒。請避免讓秘密出現在提示和記錄中。
  </Accordion>
</AccordionGroup>

若要了解更廣泛的威脅模型與安全檢查清單，請參閱
[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

每個技能的 frontmatter 至少需要 `name` 和 `description`：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 規格。frontmatter
  剖析器僅支援**單行鍵** — `metadata` 必須是單行 JSON 物件。在內文中使用
  `{baseDir}` 來參照技能資料夾路徑。
</Note>

### 選用 frontmatter 鍵

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的 URL。也支援透過
  `metadata.openclaw.homepage` 設定。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，技能會公開為使用者可叫用的斜線命令。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，OpenClaw 會將技能指令排除在代理的一般提示之外。當
  `user-invocable` 也為 `true` 時，該技能仍可作為斜線命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型並直接分派到已註冊的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要叫用的工具名稱。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，將原始 args 字串轉送給工具，不進行
  核心解析。工具會收到
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 閘控

OpenClaw 會在載入時使用 `metadata.openclaw`（frontmatter 中的單行
JSON）篩選 skills。沒有 `metadata.openclaw` 區塊的 skill 一律符合資格，
除非已明確停用。

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
  為 `true` 時，一律包含此 skill，並略過所有其他閘控。
</ParamField>

<ParamField path="emoji" type="string">
  顯示於 macOS Skills UI 的選用 emoji。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的選用 URL。
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  平台篩選器。設定後，此 skill 只會在列出的作業系統上符合資格。
</ParamField>

<ParamField path="requires.bins" type="string[]">
  每個二進位檔都必須存在於 `PATH`。
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  至少一個二進位檔必須存在於 `PATH`。
</ParamField>

<ParamField path="requires.env" type="string[]">
  每個環境變數都必須存在於程序中，或透過設定提供。
</ParamField>

<ParamField path="requires.config" type="string[]">
  每個 `openclaw.json` 路徑都必須為 truthy。
</ParamField>

<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 關聯的環境變數名稱。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝器規格（brew / node / go / uv / download）。
</ParamField>

<Note>
  當 `metadata.openclaw` 不存在時，仍會接受舊版 `metadata.clawdbot`
  區塊，因此較舊的已安裝 skills 會保留其依賴閘控與安裝器提示。
  新 skills 應使用 `metadata.openclaw`。
</Note>

### 安裝器規格

安裝器規格會告訴 macOS Skills UI 如何安裝依賴：

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
    - 列出多個安裝器時，閘道會選擇一個偏好的
      選項（可用時使用 brew，否則使用 node）。
    - 如果所有安裝器都是 `download`，OpenClaw 會列出每個項目，讓你可以
      查看所有可用的構件。
    - 規格可包含 `os: ["darwin"|"linux"|"win32"]` 以依平台篩選。
    - 節點安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`
      （預設：npm；選項：npm / pnpm / yarn / bun）。這只會影響 skill
      安裝；閘道執行階段仍應是節點。
    - 閘道安裝器偏好順序：Homebrew → uv → 已設定的節點管理器 →
      go → download。
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew：** OpenClaw 不會自動安裝 Homebrew，也不會將 brew
      formula 轉譯成系統套件指令。在沒有 `brew` 的 Linux 容器中，
      只支援 brew 的安裝器會被隱藏；請使用自訂映像，或手動安裝
      該依賴。
    - **Go：** 如果缺少 `go` 且可使用 `brew`，閘道會先透過 Homebrew
      安裝 Go，並將 `GOBIN` 設為 Homebrew 的 `bin`。
    - **Download：** `url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（預設：偵測到封存檔時自動）、`stripComponents`、
      `targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` 會在 skill 載入時於**主機**上檢查。如果 agent
    在 sandbox 中執行，該二進位檔也必須存在於**容器內**。
    請透過 `agents.defaults.sandbox.docker.setupCommand` 或自訂
    映像安裝。`setupCommand` 會在容器建立後執行一次，且需要
    網路輸出、可寫入的根檔案系統，以及 sandbox 中的 root 使用者。
  </Accordion>
</AccordionGroup>

## 設定覆寫

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切換與設定
 bundled 或 managed skills：

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
  `false` 會停用此 skill，即使它是 bundled 或已安裝也一樣。`coding-agent`
  bundled skill 採用選擇啟用方式 — 設定
  `skills.entries.coding-agent.enabled: true`，並確保 `claude`、`codex`、
  `opencode` 或其他受支援的命令列介面之一已安裝並完成驗證。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 skills 使用的便利欄位。
  支援純文字字串或 SecretRef 物件。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  為 agent 執行注入的環境變數。只有在變數尚未於程序中設定時才會注入。
</ParamField>

<ParamField path="config" type="object">
  自訂每個 skill 設定欄位的選用資料袋。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  僅適用於 **bundled** skills 的選用允許清單。設定後，只有清單中的
  bundled skills 符合資格。Managed 與 workspace skills 不受影響。
</ParamField>

<Note>
  設定鍵預設會符合 **skill name**。如果某個 skill 定義了
  `metadata.openclaw.skillKey`，請在 `skills.entries` 下使用該鍵。
  請為含連字號的名稱加上引號：JSON5 允許加引號的鍵。
</Note>

## 環境注入

當 agent 執行開始時，OpenClaw 會：

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw 會解析 agent 的有效 skill 清單，套用閘控
    規則、允許清單與設定覆寫。
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 會在
    執行期間套用到 `process.env`。
  </Step>
  <Step title="Builds the system prompt">
    符合資格的 skills 會被編譯成精簡的 XML 區塊，並注入
    系統提示。
  </Step>
  <Step title="Restores the environment">
    執行結束後，會還原原始環境。
  </Step>
</Steps>

<Warning>
  環境注入的範圍是**主機**上的 agent 執行，而不是 sandbox。在
  sandbox 內，`env` 和 `apiKey` 不會生效。請參閱
  [Skills 設定](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)，了解如何
  將密鑰傳入 sandboxed 執行。
</Warning>

對於 bundled `claude-cli` 後端，OpenClaw 也會將相同的符合資格
skill 快照具現化為暫時的 Claude Code 外掛，並透過
`--plugin-dir` 傳入。其他命令列介面後端只使用提示目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**建立符合資格的 skills 快照，並在該
工作階段的所有後續回合中重複使用該清單。對 skills 或設定的變更會在
下一個新工作階段生效。

Skills 會在兩種情況下於工作階段中重新整理：

- skills watcher 偵測到 `SKILL.md` 變更。
- 新的符合資格遠端節點連線。

重新整理後的清單會在下一個 agent 回合採用。如果有效的 agent
允許清單變更，OpenClaw 會重新整理快照，以保持可見 skills
一致。

<AccordionGroup>
  <Accordion title="Skills watcher">
    預設情況下，OpenClaw 會監看 skill 資料夾，並在
    `SKILL.md` 檔案變更時更新快照。請在 `skills.load` 下設定：

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

    對於刻意使用符號連結的版面配置，請使用 `allowSymlinkTargets`，
    其中 skill 根符號連結會指向已設定根目錄之外的位置，例如
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    只有在 Skill Workshop 也應透過這些受信任的符號連結路徑套用
    提案時，才啟用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    如果閘道在 Linux 上執行，但已有允許 `system.run` 的 **macOS 節點**
    連線，當所需二進位檔存在於該節點上時，OpenClaw 可以將僅限 macOS
    的 skills 視為符合資格。agent 應透過 `exec` 工具並使用
    `host=node` 執行這些 skills。

    離線節點**不會**讓僅限遠端的 skills 顯示出來。如果某個節點停止
    回應 bin probes，OpenClaw 會清除其快取的 bin 相符項目。

  </Accordion>
</AccordionGroup>

## Token 影響

當 skills 符合資格時，OpenClaw 會將精簡 XML 區塊注入系統
提示。成本是確定性的：

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **基本開銷**（只有在 ≥ 1 個 skill 時）：約 195 個字元
- **每個 skill：** 約 97 個字元 + 你的 `name`、`description` 和 `location` 欄位長度
- XML escaping 會將 `& < > " '` 展開成實體，每次出現會增加少量字元
- 以約 4 字元/token 計算，在欄位長度之外，每個 skill 的 97 字元約等於 24 tokens

請讓描述保持簡短且具描述性，以將提示開銷降到最低。

## 相關

<CardGroup cols={2}>
  <Card title="Creating skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    撰寫自訂 skill 的逐步指南。
  </Card>
  <Card title="Skill Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    agent 草擬 skills 的提案佇列。
  </Card>
  <Card title="Skills config" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與 agent 允許清單。
  </Card>
  <Card title="Slash commands" href="/zh-TW/tools/slash-commands" icon="terminal">
    skill slash commands 如何註冊與路由。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公開登錄檔上瀏覽並發布 skills。
  </Card>
  <Card title="Plugins" href="/zh-TW/tools/plugin" icon="plug">
    外掛可以隨其所記錄的工具一起提供 skills。
  </Card>
</CardGroup>
