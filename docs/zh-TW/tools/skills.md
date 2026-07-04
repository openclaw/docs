---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 門控、允許清單或載入規則
    - 了解 Skills 優先順序與快照行為
sidebarTitle: Skills
summary: Skills 會教你的 agent 如何使用工具。了解它們如何載入、優先順序如何運作，以及如何設定門控、允許清單與環境注入。
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指令檔，用來教導代理如何以及何時使用工具。每個技能都位於一個包含 `SKILL.md` 檔案的目錄中，該檔案含有 YAML 前置中繼資料與 Markdown 內文。OpenClaw 會載入內建技能以及任何本機覆寫，並在載入時根據環境、設定與二進位檔是否存在進行篩選。

<CardGroup cols={2}>
  <Card title="建立技能" href="/zh-TW/tools/creating-skills" icon="hammer">
    從零開始建立並測試自訂技能。
  </Card>
  <Card title="技能工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    審查並核准由代理草擬的技能提案。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理允許清單。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    瀏覽並安裝社群技能。
  </Card>
</CardGroup>

## 載入順序

OpenClaw 會從以下來源載入，**優先順序由高到低**。當相同技能名稱出現在多個位置時，優先順序最高的來源勝出。

| 優先順序 | 來源 | 路徑 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | 工作區技能 | `<workspace>/skills` |
| 2 | 專案代理技能 | `<workspace>/.agents/skills` |
| 3 | 個人代理技能 | `~/.agents/skills` |
| 4 | 受管理 / 本機技能 | `~/.openclaw/skills` |
| 5 | 內建技能 | 隨安裝項目提供 |
| 6 — 最低 | 額外目錄 | `skills.load.extraDirs` + 外掛技能 |

技能根目錄支援分組版面配置。只要 `SKILL.md` 出現在設定根目錄下的任何位置，OpenClaw 就會發現該技能：

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

資料夾路徑僅用於整理。技能的名稱、斜線命令與允許清單鍵，都來自 `name` 前置中繼資料欄位（或在缺少 `name` 時使用目錄名稱）。

<Note>
  Codex CLI 原生的 `$CODEX_HOME/skills` 目錄**不是** OpenClaw
  技能根目錄。使用 `openclaw migrate plan codex` 盤點這些技能，然後使用
  `openclaw migrate codex` 將它們複製到你的 OpenClaw 工作區。
</Note>

## 個別代理與共享技能

在多代理設定中，每個代理都有自己的工作區。請使用符合所需可見性的路徑：

| 範圍 | 路徑 | 可見對象 |
| -------------- | ---------------------------- | --------------------------- |
| 個別代理 | `<workspace>/skills` | 僅該代理 |
| 專案代理 | `<workspace>/.agents/skills` | 僅該工作區的代理 |
| 個人代理 | `~/.agents/skills` | 此機器上的所有代理 |
| 共享受管理 | `~/.openclaw/skills` | 此機器上的所有代理 |
| 額外目錄 | `skills.load.extraDirs` | 此機器上的所有代理 |

## 代理允許清單

技能**位置**（優先順序）與技能**可見性**（哪個代理可以使用它）是獨立的控制項。使用允許清單限制代理可以看到哪些技能，無論它們是從哪裡載入。

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
    - 省略 `agents.defaults.skills`，即可讓所有技能預設不受限制。
    - 省略 `agents.list[].skills`，即可繼承 `agents.defaults.skills`。
    - 將 `agents.list[].skills: []` 設定為不向該代理公開任何技能。
    - 非空的 `agents.list[].skills` 清單是**最終**集合 — 不會與預設值合併。
    - 有效允許清單會套用於提示建構、斜線命令探索、沙盒同步與技能快照。
    - 這不是主機 shell 授權邊界。如果同一個代理可以使用 `exec`，請另外透過沙盒、作業系統使用者隔離、exec 拒絕/允許清單與個別資源憑證限制該 shell。
  </Accordion>
</AccordionGroup>

## 外掛與技能

外掛可以透過在 `openclaw.plugin.json` 中列出 `skills` 目錄（相對於外掛根目錄的路徑）來附帶自己的技能。外掛啟用時會載入外掛技能，例如瀏覽器外掛會附帶 `browser-automation` 技能，用於多步驟瀏覽器控制。

外掛技能目錄會在與 `skills.load.extraDirs` 相同的低優先順序層級合併，因此同名的內建、受管理、代理或工作區技能會覆寫它們。請透過外掛設定項目上的 `metadata.openclaw.requires.config` 控制它們。

完整外掛系統請參閱[外掛](/zh-TW/tools/plugin)與[工具](/zh-TW/tools)。

## 技能工作坊

[技能工作坊](/zh-TW/tools/skill-workshop)是代理與你的作用中技能檔案之間的提案佇列。當代理發現可重複使用的工作時，它會草擬提案，而不是直接寫入 `SKILL.md`。你會先審查並核准，之後才會有任何變更。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完整生命週期、命令列介面參考與設定請參閱[技能工作坊](/zh-TW/tools/skill-workshop)。

## 從 ClawHub 安裝

[ClawHub](https://clawhub.ai) 是公開技能登錄檔。使用 `openclaw skills` 命令安裝與更新，或使用 `clawhub` 命令列介面發布與同步。

| 動作 | 命令 |
| ---------------------------------- | ------------------------------------------------------ |
| 將技能安裝到工作區 | `openclaw skills install @owner/<slug>` |
| 從 Git 儲存庫安裝 | `openclaw skills install git:owner/repo@ref` |
| 安裝本機技能目錄 | `openclaw skills install ./path/to/skill --as my-tool` |
| 為所有本機代理安裝 | `openclaw skills install @owner/<slug> --global` |
| 更新所有工作區技能 | `openclaw skills update --all` |
| 更新共享受管理技能 | `openclaw skills update @owner/<slug> --global` |
| 更新所有共享受管理技能 | `openclaw skills update --all --global` |
| 驗證技能的信任信封 | `openclaw skills verify @owner/<slug>` |
| 列印產生的 Skill Card | `openclaw skills verify @owner/<slug> --card` |
| 透過 ClawHub 命令列介面發布 / 同步 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="安裝詳細資料">
    `openclaw skills install` 預設會安裝到作用中工作區的 `skills/`
    目錄。加入 `--global` 可安裝到共享的
    `~/.openclaw/skills` 目錄，除非代理允許清單縮小範圍，否則所有本機代理都可看到。

    Git 與本機安裝預期來源根目錄有 `SKILL.md`。有效時，slug 來自
    `SKILL.md` 前置中繼資料的 `name`，接著才會退回使用目錄或儲存庫名稱。使用 `--as <slug>` 覆寫。
    `openclaw skills update` 只追蹤 ClawHub 安裝項目 — 請重新安裝 Git 或本機來源來重新整理它們。

  </Accordion>
  <Accordion title="驗證與安全掃描">
    `openclaw skills verify @owner/<slug>` 會向 ClawHub 要求技能的
    `clawhub.skill.verify.v1` 信任信封。已安裝的 ClawHub 技能會根據 `.clawhub/origin.json` 中記錄的版本與登錄檔進行驗證。
    既有已安裝或明確無歧義的技能仍接受裸 slug，但帶有擁有者限定的參照可避免發布者歧義。

    ClawHub 技能頁面會在安裝前公開最新安全掃描狀態，並提供 VirusTotal、ClawScan 與靜態分析的詳細頁面。當 ClawHub 將驗證標記為失敗時，命令會以非零狀態結束。發布者可透過 ClawHub 儀表板或
    `clawhub skill rescan @owner/<slug>` 從誤判中復原。

  </Accordion>
  <Accordion title="私有封存安裝">
    需要非 ClawHub 傳遞的閘道用戶端可以使用 `skills.upload.begin`、`skills.upload.chunk` 與 `skills.upload.commit` 暫存 zip 技能封存，然後使用 `skills.install({ source: "upload", ... })` 安裝。此路徑預設關閉，且需要在
    `openclaw.json` 中設定 `skills.install.allowUploadedArchives: true`。一般 ClawHub 安裝不需要該設定。
  </Accordion>
</AccordionGroup>

## 安全性

<Warning>
  請將第三方技能視為**不受信任的程式碼**。啟用前請先閱讀。
  對不受信任的輸入與高風險工具，優先使用沙盒執行。代理端控制項請參閱
  [沙盒](/zh-TW/gateway/sandboxing)。
</Warning>

<AccordionGroup>
  <Accordion title="路徑限制">
    工作區、專案代理與額外目錄技能探索只接受解析後 realpath 仍位於設定根目錄內的技能根目錄，除非
    `skills.load.allowSymlinkTargets` 明確信任目標根目錄。
    只有在啟用 `skills.workshop.allowSymlinkTargetWrites` 時，技能工作坊才會透過這些受信任目標寫入。
    受管理的 `~/.openclaw/skills` 與個人的 `~/.agents/skills` 可以包含符號連結的技能資料夾，但每個 `SKILL.md` realpath 仍必須位於其解析後的技能目錄內。
  </Accordion>
  <Accordion title="操作員安裝政策">
    設定 `security.installPolicy`，可在技能安裝繼續之前執行受信任的本機政策命令。
    該政策會收到中繼資料與已暫存的來源路徑，並套用於 ClawHub、上傳、Git、本機、更新與相依項安裝器路徑；當命令無法傳回有效決策時，會失敗關閉。
  </Accordion>
  <Accordion title="秘密注入範圍">
    `skills.entries.*.env` 與 `skills.entries.*.apiKey` 只會在該代理回合中將秘密注入**主機**程序，而不是沙盒。請避免讓秘密出現在提示與記錄中。
  </Accordion>
</AccordionGroup>

更完整的威脅模型與安全檢查清單，請參閱[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

每個技能至少需要在前置中繼資料中有 `name` 與 `description`：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 規格。前置中繼資料剖析器支援**僅單行鍵** — `metadata` 必須是單行 JSON 物件。請在內文中使用 `{baseDir}` 參照技能資料夾路徑。
</Note>

### 選用前置中繼資料鍵

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的 URL。也可透過
  `metadata.openclaw.homepage` 支援。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，該技能會公開為使用者可呼叫的斜線命令。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，OpenClaw 會將該技能的指令排除在代理的一般提示之外。當 `user-invocable` 也為 `true` 時，該技能仍可作為斜線命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  設定為 `tool` 時，斜線命令會略過模型，並直接分派到已註冊的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要呼叫的工具名稱。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，會將原始引數字串轉送給工具，不經過
  核心解析。工具會收到
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 閘控

OpenClaw 會在載入時使用 `metadata.openclaw`（frontmatter 中的單行
JSON）篩選技能。沒有 `metadata.openclaw` 區塊的技能一律
符合資格，除非已明確停用。

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
  當為 `true` 時，一律包含該技能並略過所有其他閘控。
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI 中顯示的選用 emoji。
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI 中顯示為「網站」的選用 URL。
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  平台篩選器。設定後，該技能只會在列出的作業系統上符合資格。
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
  與 `skills.entries.<name>.apiKey` 相關聯的環境變數名稱。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝器規格（brew / node / go / uv / download）。
</ParamField>

<Note>
  當 `metadata.openclaw` 不存在時，仍會接受舊版
  `metadata.clawdbot` 區塊，因此較舊的已安裝技能會保留其
  依賴項閘控和安裝器提示。新技能應使用
  `metadata.openclaw`。
</Note>

### 安裝器規格

安裝器規格會告訴 macOS Skills UI 如何安裝依賴項：

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
  <Accordion title="安裝器選擇規則">
    - 當列出多個安裝器時，閘道會挑選一個偏好的
      選項（可用時使用 brew，否則使用 node）。
    - 如果所有安裝器都是 `download`，OpenClaw 會列出每個項目，讓你可以
      查看所有可用成品。
    - 規格可以包含 `os: ["darwin"|"linux"|"win32"]` 以依平台篩選。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`
      （預設：npm；選項：npm / pnpm / yarn / bun）。這只會影響技能
      安裝；閘道執行階段仍應是 Node。
    - 閘道安裝器偏好順序：Homebrew → uv → 已設定的 node manager →
      go → download。
  </Accordion>
  <Accordion title="各安裝器詳細資訊">
    - **Homebrew：** OpenClaw 不會自動安裝 Homebrew，也不會將 brew
      formula 轉譯成系統套件命令。在沒有
      `brew` 的 Linux 容器中，只支援 brew 的安裝器會被隱藏；請使用自訂映像檔或手動安裝
      依賴項。
    - **Go：** OpenClaw 需要 Go 1.21 或更新版本才能自動安裝技能，並且
      會保留現有的 `GOBIN`、`GOPATH` 和 `GOTOOLCHAIN` 設定。如果
      已設定的工具鏈無法滿足某個模組所需的 Go 版本，
      onboarding 會在安裝嘗試後，將該技能歸入需要手動 Go 前置條件的群組。
      如果缺少 `go` 且 Homebrew 可用，OpenClaw 會先透過 Homebrew 安裝
      Go，並將 `GOBIN` 設為 Homebrew 的 `bin`。在 Linux 上，
      OpenClaw 也可以改用 root 身分的 `apt-get`，或透過免密碼 `sudo`
      使用 `apt-get`，前提是重新整理後的 `golang-go` 候選版本符合最低版本要求。
    - **Download：** `url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（預設：偵測到封存檔時自動）、`stripComponents`、
      `targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="沙盒注意事項">
    `requires.bins` 會在技能載入時於**主機**上檢查。如果代理
    在沙盒中執行，該二進位檔也必須存在於**容器內**。
    請透過 `agents.defaults.sandbox.docker.setupCommand` 或自訂
    映像檔安裝。`setupCommand` 會在容器建立後執行一次，且需要
    網路輸出、可寫入的 root FS，以及沙盒中的 root 使用者。
  </Accordion>
</AccordionGroup>

## 設定覆寫

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 底下切換並設定
內建或受管理的技能：

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
  即使技能是內建或已安裝，`false` 仍會停用該技能。`coding-agent`
  內建技能採用選擇加入制 — 設定 `skills.entries.coding-agent.enabled: true`
  並確保已安裝且驗證 `claude`、`codex`、`opencode` 或另一個支援的命令列介面。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的技能使用的便利欄位。
  支援明文字串或 SecretRef 物件。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  為代理執行注入的環境變數。只有在該變數尚未於
  程序中設定時才會注入。
</ParamField>

<ParamField path="config" type="object">
  用於自訂各技能設定欄位的選用集合。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  僅適用於**內建**技能的選用允許清單。設定後，只有清單中的內建技能
  符合資格。受管理技能和工作區技能不受影響。
</ParamField>

<Note>
  設定鍵預設會符合**技能名稱**。如果技能定義了
  `metadata.openclaw.skillKey`，請在 `skills.entries` 底下使用該鍵。
  請將含連字號的名稱加上引號：JSON5 允許加引號的鍵。
</Note>

## 環境注入

當代理執行開始時，OpenClaw 會：

<Steps>
  <Step title="讀取技能中繼資料">
    OpenClaw 會解析代理的有效技能清單，並套用閘控
    規則、允許清單和設定覆寫。
  </Step>
  <Step title="注入環境和 API 金鑰">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 會套用到
    `process.env`，有效期間為該次執行。
  </Step>
  <Step title="建構系統提示詞">
    符合資格的技能會被編譯成精簡的 XML 區塊，並注入到
    系統提示詞中。
  </Step>
  <Step title="還原環境">
    執行結束後，會還原原始環境。
  </Step>
</Steps>

<Warning>
  環境注入的範圍是**主機**代理執行，而不是沙盒。在
  沙盒內，`env` 和 `apiKey` 不會生效。請參閱
  [Skills 設定](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)，了解如何
  將密鑰傳入沙盒化執行。
</Warning>

對於內建的 `claude-cli` 後端，OpenClaw 也會將同一份
符合資格的技能快照實體化為暫時的 Claude Code 外掛，並透過
`--plugin-dir` 傳入。其他命令列介面後端只使用提示詞目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**建立符合資格技能的快照，並在該工作階段的所有後續回合中重複使用該
清單。對技能或設定的變更會在下一個新工作階段生效。

技能會在兩種情況下於工作階段中重新整理：

- 技能監看器偵測到 `SKILL.md` 變更。
- 新的符合資格遠端節點連線。

重新整理後的清單會在下一個代理回合中使用。如果有效的代理
允許清單變更，OpenClaw 會重新整理快照，讓可見技能保持一致。

<AccordionGroup>
  <Accordion title="技能監看器">
    預設情況下，OpenClaw 會監看技能資料夾，並在
    `SKILL.md` 檔案變更時提升快照版本。在 `skills.load` 底下設定：

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

    對於技能根目錄 symlink 指向設定根目錄外部的刻意 symlink 版面配置，
    請使用 `allowSymlinkTargets`，例如
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    只有在 Skill Workshop 也應該透過這些受信任的 symlink 路徑套用提案時，
    才啟用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="遠端 macOS 節點（Linux 閘道）">
    如果閘道在 Linux 上執行，但有一個允許
    `system.run` 的 **macOS 節點**已連線，且該節點上存在所需的二進位檔，
    OpenClaw 可以將僅限 macOS 的技能視為符合資格。代理應透過
    `exec` 工具並搭配 `host=node` 執行這些技能。

    離線節點**不會**讓僅限遠端的技能可見。如果某個節點停止
    回應 bin probe，OpenClaw 會清除其快取的 bin 符合項。

  </Accordion>
</AccordionGroup>

## Token 影響

當技能符合資格時，OpenClaw 會將精簡的 XML 區塊注入到系統
提示詞中。成本是決定性的：

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **基礎開銷**（僅在 ≥ 1 個技能時）：約 195 個字元
- **每個技能：** 約 97 個字元 + 你的 `name`、`description` 和 `location` 欄位長度
- XML escaping 會將 `& < > " '` 展開為 entities，每次出現都會增加少量字元
- 以約 4 chars/token 計算，97 個字元在加入欄位長度前約為每個技能 24 個 token

請保持描述簡短且具描述性，以盡量降低提示詞開銷。

## 相關

<CardGroup cols={2}>
  <Card title="建立技能" href="/zh-TW/tools/creating-skills" icon="hammer">
    撰寫自訂技能的逐步指南。
  </Card>
  <Card title="Skill Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    代理草擬技能的提案佇列。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定 schema 和代理允許清單。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    技能斜線命令如何註冊和路由。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公開登錄檔上瀏覽和發布技能。
  </Card>
  <Card title="外掛" href="/zh-TW/tools/plugin" icon="plug">
    外掛可以隨它們記錄的工具一起提供技能。
  </Card>
</CardGroup>
