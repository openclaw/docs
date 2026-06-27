---
read_when:
    - 新增或修改 Skills
    - 變更技能門檻、允許清單或載入規則
    - 了解 Skills 優先順序與快照行為
sidebarTitle: Skills
summary: Skills 會教你的代理如何使用工具。了解它們如何載入、優先順序如何運作，以及如何設定閘控、允許清單和環境注入。
title: Skills
x-i18n:
    generated_at: "2026-06-27T20:09:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指示檔，教導代理程式如何以及何時使用工具。每個技能都位於一個目錄中，該目錄包含一個具有 YAML 前置資料和 Markdown 本文的 `SKILL.md` 檔案。OpenClaw 會載入內建技能以及任何本機覆寫，並在載入時根據環境、設定和二進位檔是否存在來篩選它們。

<CardGroup cols={2}>
  <Card title="Creating skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    從零開始建置並測試自訂技能。
  </Card>
  <Card title="Skill Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    檢閱並核准由代理程式草擬的技能提案。
  </Card>
  <Card title="Skills config" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理程式允許清單。
  </Card>
  <Card title="ClawHub" href="/zh-TW/clawhub" icon="cloud">
    瀏覽並安裝社群技能。
  </Card>
</CardGroup>

## 載入順序

OpenClaw 會從以下來源載入，**優先順序最高者在前**。當相同技能名稱出現在多個位置時，優先順序最高的來源會勝出。

| 優先順序 | 來源 | 路徑 |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高 | 工作區技能 | `<workspace>/skills` |
| 2 | 專案代理程式技能 | `<workspace>/.agents/skills` |
| 3 | 個人代理程式技能 | `~/.agents/skills` |
| 4 | 受管理 / 本機技能 | `~/.openclaw/skills` |
| 5 | 內建技能 | 隨安裝提供 |
| 6 — 最低 | 額外目錄 | `skills.load.extraDirs` + 外掛技能 |

技能根目錄支援分組式版面。只要 `SKILL.md` 出現在已設定根目錄底下的任何位置，OpenClaw 就會探索到該技能：

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

資料夾路徑僅供組織使用。技能名稱、斜線命令和允許清單鍵都來自 `name` 前置資料欄位（或在缺少 `name` 時使用目錄名稱）。

<Note>
  Codex CLI 的原生 `$CODEX_HOME/skills` 目錄**不是** OpenClaw
  技能根目錄。使用 `openclaw migrate plan codex` 盤點這些技能，然後
  使用 `openclaw migrate codex` 將它們複製到你的 OpenClaw 工作區。
</Note>

## 每個代理程式與共用技能

在多代理程式設定中，每個代理程式都有自己的工作區。請使用符合你想要可見範圍的路徑：

| 範圍 | 路徑 | 可見對象 |
| -------------- | ---------------------------- | --------------------------- |
| 每個代理程式 | `<workspace>/skills` | 僅該代理程式 |
| 專案代理程式 | `<workspace>/.agents/skills` | 僅該工作區的代理程式 |
| 個人代理程式 | `~/.agents/skills` | 此機器上的所有代理程式 |
| 共用受管理 | `~/.openclaw/skills` | 此機器上的所有代理程式 |
| 額外目錄 | `skills.load.extraDirs` | 此機器上的所有代理程式 |

## 代理程式允許清單

技能**位置**（優先順序）和技能**可見性**（哪個代理程式可以使用它）是分開的控制項。使用允許清單來限制代理程式可看到哪些技能，無論它們是從哪裡載入。

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
    - 省略 `agents.defaults.skills`，即可讓所有技能預設不受限制。
    - 省略 `agents.list[].skills`，即可繼承 `agents.defaults.skills`。
    - 設定 `agents.list[].skills: []`，即可不向該代理程式公開任何技能。
    - 非空的 `agents.list[].skills` 清單就是**最終**集合 — 它不會
      與預設值合併。
    - 有效允許清單會套用於提示建構、斜線命令探索、
      沙箱同步和技能快照。
  </Accordion>
</AccordionGroup>

## 外掛與技能

外掛可以在 `openclaw.plugin.json` 中列出 `skills` 目錄來隨附自己的技能（路徑相對於外掛根目錄）。外掛啟用時會載入外掛技能 — 例如，瀏覽器外掛會隨附一個用於多步驟瀏覽器控制的 `browser-automation` 技能。

外掛技能目錄會在與 `skills.load.extraDirs` 相同的低優先順序層級合併，因此同名的內建、受管理、代理程式或工作區技能會覆寫它們。透過外掛設定項目上的 `metadata.openclaw.requires.config` 來控管它們。

請參閱[外掛](/zh-TW/tools/plugin)和[工具](/zh-TW/tools)，了解完整外掛系統。

## 技能工作坊

[技能工作坊](/zh-TW/tools/skill-workshop)是代理程式與你的作用中技能檔案之間的提案佇列。當代理程式發現可重複使用的工作時，它會草擬提案，而不是直接寫入 `SKILL.md`。你會在任何內容變更前檢閱並核准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

請參閱[技能工作坊](/zh-TW/tools/skill-workshop)，了解完整生命週期、命令列介面參考與設定。

## 從 ClawHub 安裝

[ClawHub](https://clawhub.ai) 是公開技能登錄庫。使用
`openclaw skills` 命令進行安裝和更新，或使用 `clawhub` 命令列介面進行發布和同步。

| 動作 | 命令 |
| ---------------------------------- | ------------------------------------------------------ |
| 將技能安裝到工作區 | `openclaw skills install @owner/<slug>` |
| 從 Git 儲存庫安裝 | `openclaw skills install git:owner/repo@ref` |
| 安裝本機技能目錄 | `openclaw skills install ./path/to/skill --as my-tool` |
| 為所有本機代理程式安裝 | `openclaw skills install @owner/<slug> --global` |
| 更新所有工作區技能 | `openclaw skills update --all` |
| 更新共用受管理技能 | `openclaw skills update @owner/<slug> --global` |
| 更新所有共用受管理技能 | `openclaw skills update --all --global` |
| 驗證技能的信任信封 | `openclaw skills verify @owner/<slug>` |
| 列印產生的技能卡 | `openclaw skills verify @owner/<slug> --card` |
| 透過 ClawHub 命令列介面發布 / 同步 | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` 預設會安裝到作用中工作區的 `skills/`
    目錄。加入 `--global` 可安裝到共用的
    `~/.openclaw/skills` 目錄，除非代理程式允許清單縮小範圍，否則所有本機代理程式都可看見。

    Git 和本機安裝預期來源根目錄中有 `SKILL.md`。有效時，slug
    會來自 `SKILL.md` 前置資料的 `name`，接著退回使用目錄或儲存庫名稱。使用 `--as <slug>` 可覆寫。
    `openclaw skills update` 只追蹤 ClawHub 安裝 — 重新安裝 Git 或
    本機來源以重新整理它們。

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` 會向 ClawHub 要求該技能的
    `clawhub.skill.verify.v1` 信任信封。已安裝的 ClawHub 技能會根據 `.clawhub/origin.json` 中記錄的版本與登錄庫進行驗證。
    對於現有已安裝或不含歧義的技能，仍接受裸 slug，但
    帶有擁有者限定的參照可避免發布者歧義。

    ClawHub 技能頁面會在安裝前公開最新安全掃描狀態，
    並提供 VirusTotal、ClawScan 和靜態分析的詳細頁面。當 ClawHub
    將驗證標記為失敗時，命令會以非零狀態結束。發布者
    可透過 ClawHub 儀表板或
    `clawhub skill rescan @owner/<slug>` 處理誤判。

  </Accordion>
  <Accordion title="Private archive installs">
    需要非 ClawHub 交付的閘道用戶端可以使用 `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`
    暫存 zip 技能封存檔，
    然後使用 `skills.install({ source: "upload", ... })` 安裝。此路徑
    預設關閉，且需要在 `openclaw.json` 中設定
    `skills.install.allowUploadedArchives: true`。一般 ClawHub 安裝永遠不需要該設定。
  </Accordion>
</AccordionGroup>

## 安全性

<Warning>
  將第三方技能視為**不受信任的程式碼**。啟用前先閱讀。
  對於不受信任的輸入和高風險工具，偏好使用沙箱執行。請參閱
  [沙箱化](/zh-TW/gateway/sandboxing)了解代理程式端控制項。
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    工作區、專案代理程式和額外目錄技能探索只接受解析後 realpath
    仍位於已設定根目錄內的技能根目錄，除非
    `skills.load.allowSymlinkTargets` 明確信任目標根目錄。
    只有在啟用 `skills.workshop.allowSymlinkTargetWrites` 時，
    技能工作坊才會透過這些受信任目標寫入。
    受管理的 `~/.openclaw/skills` 和個人 `~/.agents/skills` 可以包含
    符號連結的技能資料夾，但每個 `SKILL.md` realpath 仍必須
    位於其解析後的技能目錄內。
  </Accordion>
  <Accordion title="Operator install policy">
    設定 `security.installPolicy`，以在技能安裝繼續前執行受信任的本機政策命令。
    該政策會接收中繼資料和暫存來源路徑，套用於 ClawHub、上傳、Git、本機、更新和
    相依性安裝程式路徑，並在命令無法回傳有效決策時封閉式失敗。
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` 和 `skills.entries.*.apiKey` 只會在該代理程式回合中將祕密注入
    **主機**程序 — 不會注入沙箱。讓
    祕密遠離提示和日誌。
  </Accordion>
</AccordionGroup>

如需更廣泛的威脅模型與安全檢查清單，請參閱
[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

每個技能至少需要在前置資料中有 `name` 和 `description`：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 規格。前置資料剖析器支援**單行鍵** —
  `metadata` 必須是單行 JSON 物件。在本文中使用 `{baseDir}` 來參照技能
  資料夾路徑。
</Note>

### 選用前置資料鍵

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「網站」的 URL。也支援透過
  `metadata.openclaw.homepage` 設定。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  當為 `true` 時，技能會公開為使用者可叫用的斜線命令。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  當為 `true` 時，OpenClaw 會將技能指示排除在代理程式的一般
  提示之外。當 `user-invocable` 也為 `true` 時，該技能仍可作為斜線命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型並
  直接分派到已註冊的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要叫用的工具名稱。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，會將原始 args 字串轉送給工具，不進行
  核心剖析。工具會收到
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 控管

OpenClaw 會在載入時使用 `metadata.openclaw`（frontmatter 中的單行 JSON）篩選技能。沒有 `metadata.openclaw` 區塊的技能一律符合資格，除非已明確停用。

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
  當為 `true` 時，一律包含該技能並略過所有其他門檻。
</ParamField>

<ParamField path="emoji" type="string">
  顯示於 macOS Skills UI 的選用 emoji。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「Website」的選用 URL。
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
  與 `skills.entries.<name>.apiKey` 關聯的環境變數名稱。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝程式規格（brew / node / go / uv / download）。
</ParamField>

<Note>
  當 `metadata.openclaw` 不存在時，仍會接受舊版 `metadata.clawdbot` 區塊，因此較舊的已安裝技能會保留其依賴門檻和安裝程式提示。新技能應使用 `metadata.openclaw`。
</Note>

### 安裝程式規格

安裝程式規格會告訴 macOS Skills UI 如何安裝依賴項：

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
    - 列出多個安裝程式時，閘道會挑選一個偏好的選項（可用時選 brew，否則選 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你可以看到所有可用的成品。
    - 規格可以包含 `os: ["darwin"|"linux"|"win32"]` 以依平台篩選。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`（預設：npm；選項：npm / pnpm / yarn / bun）。這只會影響技能安裝；閘道執行階段仍應是 Node。
    - 閘道安裝程式偏好順序：Homebrew → uv → 已設定的 node 管理器 → go → download。
  </Accordion>
  <Accordion title="各安裝程式詳細資訊">
    - **Homebrew：** OpenClaw 不會自動安裝 Homebrew，也不會將 brew formula 轉換成系統套件命令。在沒有 `brew` 的 Linux 容器中，只支援 brew 的安裝程式會被隱藏；請使用自訂映像檔或手動安裝依賴項。
    - **Go：** 如果缺少 `go` 且 `brew` 可用，閘道會先透過 Homebrew 安裝 Go，並將 `GOBIN` 設為 Homebrew 的 `bin`。
    - **Download：** `url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、`extract`（預設：偵測到封存檔時自動）、`stripComponents`、`targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="沙箱注意事項">
    `requires.bins` 會在技能載入時於**主機**上檢查。如果代理在沙箱中執行，該二進位檔也必須存在於**容器內**。請透過 `agents.defaults.sandbox.docker.setupCommand` 或自訂映像檔安裝。`setupCommand` 會在容器建立後執行一次，且需要網路外連、可寫入的 root FS，以及沙箱中的 root 使用者。
  </Accordion>
</AccordionGroup>

## 設定覆寫

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 底下切換並設定內建或受管理的技能：

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
  即使技能是內建或已安裝，`false` 也會停用該技能。`coding-agent` 內建技能採用選擇加入：設定 `skills.entries.coding-agent.enabled: true`，並確保已安裝且已驗證 `claude`、`codex`、`opencode`，或另一個受支援的命令列介面。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  適用於宣告 `metadata.openclaw.primaryEnv` 的技能的便利欄位。支援純文字字串或 SecretRef 物件。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  注入代理執行的環境變數。只有在該變數尚未於程序中設定時才會注入。
</ParamField>

<ParamField path="config" type="object">
  自訂各技能設定欄位的選用容器。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  僅適用於**內建**技能的選用允許清單。設定後，只有清單中的內建技能符合資格。受管理和工作區技能不受影響。
</ParamField>

<Note>
  設定鍵預設會符合**技能名稱**。如果技能定義了 `metadata.openclaw.skillKey`，請在 `skills.entries` 底下使用該鍵。請為含連字號的名稱加上引號：JSON5 允許加引號的鍵。
</Note>

## 環境注入

代理執行開始時，OpenClaw 會：

<Steps>
  <Step title="讀取技能中繼資料">
    OpenClaw 會解析代理的有效技能清單，並套用門檻規則、允許清單和設定覆寫。
  </Step>
  <Step title="注入環境變數和 API 金鑰">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 會在執行期間套用到 `process.env`。
  </Step>
  <Step title="建置系統提示">
    符合資格的技能會編譯成精簡 XML 區塊，並注入系統提示。
  </Step>
  <Step title="還原環境">
    執行結束後，會還原原始環境。
  </Step>
</Steps>

<Warning>
  環境注入的範圍是**主機**代理執行，而不是沙箱。在沙箱內，`env` 和 `apiKey` 不會生效。請參閱 [Skills 設定](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)，了解如何將秘密傳入沙箱化執行。
</Warning>

對於內建的 `claude-cli` 後端，OpenClaw 也會將相同的符合資格技能快照實體化為暫時的 Claude Code 外掛，並透過 `--plugin-dir` 傳入。其他命令列介面後端只會使用提示目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**快照符合資格的技能，並在該工作階段的所有後續回合中重複使用該清單。技能或設定的變更會在下一個新工作階段生效。

技能會在兩種情況下於工作階段中途重新整理：

- 技能監看器偵測到 `SKILL.md` 變更。
- 新的符合資格遠端節點連線。

重新整理後的清單會在下一個代理回合中採用。如果有效的代理允許清單變更，OpenClaw 會重新整理快照，以保持可見技能一致。

<AccordionGroup>
  <Accordion title="Skills 監看器">
    預設情況下，OpenClaw 會監看技能資料夾，並在 `SKILL.md` 檔案變更時提升快照版本。在 `skills.load` 底下設定：

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

    對於技能根 symlink 指向已設定根目錄之外的刻意 symlink 版面配置，請使用 `allowSymlinkTargets`，例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    只有當 Skill Workshop 也應透過這些受信任的 symlink 路徑套用提案時，才啟用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="遠端 macOS 節點（Linux 閘道）">
    如果閘道在 Linux 上執行，但連線了一個允許 `system.run` 的 **macOS 節點**，當所需二進位檔存在於該節點上時，OpenClaw 可以將僅限 macOS 的技能視為符合資格。代理應透過 `exec` 工具並搭配 `host=node` 執行這些技能。

    離線節點**不會**讓僅遠端技能可見。如果節點停止回應 bin probe，OpenClaw 會清除其快取的 bin 符合項。

  </Accordion>
</AccordionGroup>

## Token 影響

當技能符合資格時，OpenClaw 會將精簡 XML 區塊注入系統提示。成本是決定性的：

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **基礎額外成本**（僅在 ≥ 1 個技能時）：約 195 個字元
- **每個技能：** 約 97 個字元 + 你的 `name`、`description` 和 `location` 欄位長度
- XML escaping 會將 `& < > " '` 展開為 entities，每次出現都會增加數個字元
- 以約 4 chars/token 計算，97 chars 在欄位長度之前約等於每個技能 24 tokens

請讓描述保持簡短且具描述性，以最小化提示額外成本。

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
  <Card title="Slash commands" href="/zh-TW/tools/slash-commands" icon="terminal">
    技能 slash commands 如何註冊與路由。
  </Card>
  <Card title="ClawHub" href="/zh-TW/clawhub" icon="cloud">
    在公開 registry 上瀏覽並發布技能。
  </Card>
  <Card title="外掛" href="/zh-TW/tools/plugin" icon="plug">
    外掛可以隨同其文件說明的工具一起提供技能。
  </Card>
</CardGroup>
