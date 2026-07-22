---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 閘控、允許清單或載入規則
    - 瞭解 Skills 優先順序與快照行為
sidebarTitle: Skills
summary: Skills 教導你的代理程式如何使用工具。瞭解其載入方式、優先順序的運作方式，以及如何設定門控、允許清單和環境注入。
title: Skills
x-i18n:
    generated_at: "2026-07-22T10:49:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1fe083a21cf801b29872940226b6963b120a051439c4017e23e8dfdec180944
    source_path: tools/skills.md
    workflow: 16
---

Skills 是教導代理程式如何及何時使用工具的 Markdown 指示檔。每個 Skill 都位於一個目錄中，其中包含具有 YAML 前置內容與 Markdown 本文的 `SKILL.md` 檔案。OpenClaw 會載入內建 Skills 及任何本機覆寫，並在載入時根據環境、設定與二進位檔是否存在進行篩選。

<CardGroup cols={2}>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    從零開始建置並測試自訂 Skill。
  </Card>
  <Card title="Skill 工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    審查並核准代理程式草擬的 Skill 提案。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理程式允許清單。
  </Card>
  <Card title="ClawHub" href="/zh-TW/clawhub" icon="cloud">
    瀏覽並安裝社群 Skills。
  </Card>
</CardGroup>

## 載入順序

OpenClaw 會從下列來源載入，**優先順序由高至低**。當相同的 Skill 名稱出現在多個位置時，優先順序最高的來源優先。

| 優先順序    | 來源                   | 路徑                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高    | 工作區 Skills          | `<workspace>/skills`                    |
| 2           | 專案代理程式 Skills    | `<workspace>/.agents/skills`            |
| 3           | 個人代理程式 Skills    | `~/.agents/skills`                      |
| 4           | 受管理／本機 Skills    | `~/.openclaw/skills`                    |
| 5           | 內建 Skills            | 隨安裝項目提供                          |
| 6 — 最低    | 額外目錄               | `skills.load.extraDirs` + 外掛 Skills |

Skill 根目錄支援分組配置。只要 `SKILL.md` 出現在已設定根目錄下的任何位置（最多深入 6 層），OpenClaw 就會探索到該 Skill：

```text
<workspace>/skills/research/SKILL.md          ✓ 找到，名稱為 "research"
<workspace>/skills/personal/research/SKILL.md ✓ 也找到，名稱為 "research"
```

資料夾路徑僅供整理使用。Skill 的名稱與斜線命令來自 `name` 前置內容欄位（若缺少 `name`，則使用目錄名稱）。代理程式允許清單（見下文）也會依此 `name` 進行比對。

<Note>
  Codex 命令列介面的原生 `$CODEX_HOME/skills` 目錄**不是** OpenClaw Skill 根目錄。請使用 `openclaw migrate plan codex` 盤點這些 Skills，再使用 `openclaw migrate codex` 將它們複製到你的 OpenClaw 工作區。
</Note>

## 由節點託管的 Skills

已連線的無頭節點可以發布安裝於其作用中 OpenClaw Skills 目錄的 Skills（預設為 `~/.openclaw/skills`；會套用設定檔環境覆寫）。節點連線時，這些 Skills 會出現在一般代理程式 Skill 清單中；節點中斷連線時則會消失。發生名稱衝突時，本機或閘道 Skill 會保留其名稱；節點 Skill 則會取得具有確定性的節點前綴名稱。節點託管 v1 要求目錄名稱必須符合 Skill 的 `name` 前置內容欄位。

Skill 項目包含節點定位資訊。其檔案、相對參照與二進位檔都位於節點上，因此請使用 `exec host=node node=<node-id>` 載入並執行。變更 Skill 檔案後，請重新啟動節點主機。配對與停用開關請參閱[節點](/zh-TW/nodes#node-hosted-skills)。

## 各代理程式專用與共用 Skills

在多代理程式設定中，每個代理程式都有自己的工作區。請使用符合所需可見範圍的路徑：

| 範圍           | 路徑                         | 可見對象                    |
| -------------- | ---------------------------- | --------------------------- |
| 各代理程式專用 | `<workspace>/skills`         | 僅該代理程式                |
| 專案代理程式   | `<workspace>/.agents/skills` | 僅該工作區的代理程式        |
| 個人代理程式   | `~/.agents/skills`           | 此機器上的所有代理程式      |
| 共用受管理     | `~/.openclaw/skills`         | 此機器上的所有代理程式      |
| 額外目錄       | `skills.load.extraDirs`      | 此機器上的所有代理程式      |

## 代理程式允許清單

Skill 的**位置**（優先順序）與 Skill 的**可見性**（哪些代理程式可以使用）是彼此獨立的控制項。無論 Skills 從何處載入，都可使用允許清單限制代理程式可看到哪些 Skills。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // 共用基準
    },
    list: [
      { id: "writer" }, // 繼承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 完全取代預設值
      { id: "locked-down", skills: [] }, // 沒有 Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="允許清單規則">
    - 省略 `agents.defaults.skills`，預設不限制所有 Skills。
    - 省略 `agents.entries.*.skills`，以繼承 `agents.defaults.skills`。
    - 將 `agents.entries.*.skills: []` 設為不向該代理程式公開任何 Skills。
    - 非空的 `agents.entries.*.skills` 清單是**最終**集合，不會與預設值合併。
    - 生效的允許清單會套用於提示建置、斜線命令探索、沙箱同步與 Skill 快照。
    - 這不是主機 Shell 的授權邊界。如果同一代理程式可以使用 `exec`，請另外使用沙箱、作業系統使用者隔離、執行拒絕／允許清單，以及各資源專用的認證資訊限制該 Shell。
  </Accordion>
</AccordionGroup>

## 外掛與 Skills

外掛可以在 `openclaw.plugin.json` 中列出 `skills` 目錄（相對於外掛根目錄的路徑），以提供自己的 Skills。外掛啟用時會載入其 Skills，例如瀏覽器外掛會提供用於多步驟瀏覽器控制的 `browser-automation` Skill。

外掛 Skill 目錄會在與 `skills.load.extraDirs` 相同的低優先順序層級合併，因此名稱相同的內建、受管理、代理程式或工作區 Skill 會覆寫它們。與其他任何 Skill 相同，請透過其前置內容中的 `metadata.openclaw.requires` 控制外掛 Skill 本身的適用資格。

如需完整的外掛系統，請參閱[外掛](/zh-TW/tools/plugin)與[工具](/zh-TW/tools)。

## Skill 工作坊

[Skill 工作坊](/zh-TW/tools/skill-workshop)是代理程式與作用中 Skill 檔案之間的提案佇列。當代理程式發現可重複使用的工作時，會草擬提案，而不是直接寫入 `SKILL.md`。在任何內容變更前，由你進行審查與核准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完整生命週期、命令列介面參考與設定請參閱 [Skill 工作坊](/zh-TW/tools/skill-workshop)。

## 從 ClawHub 安裝

[ClawHub](https://clawhub.ai) 是公開的 Skills 登錄檔。使用 `openclaw skills` 命令進行安裝與更新，或使用 `clawhub` 命令列介面進行發布與同步。

| 動作                             | 命令                                                   |
| -------------------------------- | ------------------------------------------------------ |
| 將 Skill 安裝至工作區            | `openclaw skills install @owner/<slug>`                |
| 從 Git 儲存庫安裝                | `openclaw skills install git:owner/repo@ref`           |
| 安裝本機 Skill 目錄              | `openclaw skills install ./path/to/skill --as my-tool` |
| 為所有本機代理程式安裝           | `openclaw skills install @owner/<slug> --global`       |
| 更新所有工作區 Skills            | `openclaw skills update --all`                         |
| 更新共用的受管理 Skill           | `openclaw skills update @owner/<slug> --global`        |
| 更新所有共用的受管理 Skills      | `openclaw skills update --all --global`                |
| 驗證 Skill 的信任封套            | `openclaw skills verify @owner/<slug>`                 |
| 輸出產生的 Skill 卡片            | `openclaw skills verify @owner/<slug> --card`          |
| 透過 ClawHub 命令列介面發布／同步 | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="安裝詳細資料">
    `openclaw skills install` 預設會安裝至作用中工作區的 `skills/` 目錄。加入 `--global` 可安裝至共用的 `~/.openclaw/skills` 目錄；除非代理程式允許清單縮小範圍，否則所有本機代理程式皆可看到。

    Git 與本機安裝預期來源根目錄含有 `SKILL.md`。若 `SKILL.md` 前置內容的 `name` 有效，則會以此產生代稱；否則回退至目錄或儲存庫名稱。使用 `--as <slug>` 可覆寫。
    `openclaw skills update` 僅追蹤 ClawHub 安裝；若要重新整理 Git 或本機來源，請重新安裝。

  </Accordion>
  <Accordion title="驗證與安全掃描">
    `openclaw skills verify @owner/<slug>` 會向 ClawHub 取得 Skill 的 `clawhub.skill.verify.v1` 信任封套。從 ClawHub 安裝的 Skills 會根據 `.clawhub/origin.json` 中記錄的版本與登錄檔進行驗證。既有已安裝或名稱無歧義的 Skills 仍接受純代稱，但包含擁有者的參照可避免發布者歧義。

    ClawHub Skill 頁面會在安裝前顯示最新的安全掃描狀態，並提供 VirusTotal、ClawScan 與靜態分析的詳細資料頁面。當 ClawHub 將驗證標記為失敗時，命令會以非零狀態結束。發布者可透過 ClawHub 儀表板或 `clawhub skill rescan @owner/<slug>` 處理誤判。

  </Accordion>
  <Accordion title="私有封存檔安裝">
    需要非 ClawHub 傳遞方式的閘道用戶端，可以使用 `skills.upload.begin`、`skills.upload.chunk` 與 `skills.upload.commit` 暫存 ZIP Skill 封存檔，再使用 `skills.install({ source: "upload", ... })` 安裝。此路徑預設為關閉，且需要在 `openclaw.json` 中設定 `skills.install.allowUploadedArchives: true`。一般 ClawHub 安裝不需要此設定。
  </Accordion>
</AccordionGroup>

## 安全性

<Warning>
  將第三方 Skills 視為**不受信任的程式碼**。啟用前請先閱讀。對於不受信任的輸入與高風險工具，建議使用沙箱執行。代理程式端控制方式請參閱[沙箱](/zh-TW/gateway/sandboxing)。
</Warning>

<AccordionGroup>
  <Accordion title="路徑限制">
    工作區、專案代理程式與額外目錄的 Skill 探索，只接受解析後真實路徑仍位於已設定根目錄內的 Skill 根目錄，除非 `skills.load.allowSymlinkTargets` 明確信任目標根目錄。
    僅當啟用 `skills.workshop.allowSymlinkTargetWrites` 時，Skill 工作坊才會透過這些受信任的目標寫入。
    受管理的 `~/.openclaw/skills` 與個人的 `~/.agents/skills` 可以包含以符號連結連接的 Skill 資料夾，但每個 `SKILL.md` 的真實路徑仍必須位於其解析後的 Skill 目錄內。
  </Accordion>
  <Accordion title="操作者安裝政策">
    設定 `security.installPolicy`，以便在繼續安裝 Skill 前執行受信任的本機政策命令。該政策會接收中繼資料與暫存來源路徑，並套用至 ClawHub、上傳、Git、本機、更新及相依性安裝程式路徑；當命令無法傳回有效決策時，則採取封閉式失敗。
  </Accordion>
  <Accordion title="密鑰注入範圍">
    `skills.entries.*.env` 與 `skills.entries.*.apiKey` 僅會在該次代理程式回合中將密鑰注入**主機**程序，不會注入沙箱。請勿在提示與記錄中包含密鑰。
  </Accordion>
</AccordionGroup>

如需更廣泛的威脅模型與安全檢查清單，請參閱[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

每個 Skill 的前置內容至少需要 `name` 與 `description`：

```markdown
---
name: image-lab
description: 透過由供應商支援的影像工作流程產生或編輯影像
---

當使用者要求產生影像時，使用 `image_generate` 工具……
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 規格。前置內容會先以 YAML 解析；若失敗，則回退至僅支援單行的解析器。巢狀 `metadata` 區塊（包括多行 YAML 對應）會攤平成 JSON 字串，再以 JSON5 重新解析，因此[門控](#gating)中所示的區塊形式可以運作。在本文中使用 `{baseDir}` 參照 Skill 資料夾路徑。
</Note>

### 選用的前置內容鍵

<ParamField path="homepage" type="string">
  在 macOS Skills 使用者介面中顯示為 "Website" 的 URL。也可透過 `metadata.openclaw.homepage` 支援。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  當 `true` 時，該 Skill 會公開為使用者可叫用的斜線命令。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  當 `true` 時，OpenClaw 不會將該 Skill 的指示放入代理程式的一般
  提示詞中。當 `user-invocable` 同時為 `true` 時，該 Skill
  仍可作為斜線命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型，並直接分派至
  已註冊的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要叫用的工具名稱。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  針對工具分派，將原始引數字串轉送至工具，不經
  核心剖析。工具會接收
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 閘門條件

OpenClaw 會在載入時使用 `metadata.openclaw`（嵌入 frontmatter 的 JSON5 物件，
請參閱上方的剖析說明）篩選 Skills。沒有
`metadata.openclaw` 區塊的 Skill 一律符合資格，除非明確停用。

```markdown
---
name: image-lab
description: 透過由供應商支援的圖片工作流程產生或編輯圖片
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
  當 `true` 時，一律納入該 Skill，並略過所有其他閘門條件。
</ParamField>

<ParamField path="emoji" type="string">
  顯示於 macOS Skills UI 的選用 emoji。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills UI 中顯示為「Website」的選用 URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  平台篩選器。設定後，該 Skill 僅在列出的作業系統上符合資格。
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
  每個 `openclaw.json` 路徑都必須為真值。
</ParamField>

<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 關聯的環境變數名稱。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI 使用的選用安裝程式規格（brew / node / go / uv / download）。
</ParamField>

<Note>
  當缺少 `metadata.openclaw` 時，仍接受舊版 `metadata.clawdbot` 區塊，
  因此較早安裝的 Skills 會保留其相依性閘門條件與安裝程式提示。新的 Skills 應使用
  `metadata.openclaw`。
</Note>

### 安裝程式規格

安裝程式規格會告知 macOS Skills UI 如何安裝相依項目：

```markdown
---
name: gemini
description: 使用 Gemini CLI 提供程式開發協助與 Google 搜尋查詢。
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
              "label": "安裝 Gemini CLI（brew）",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="安裝程式選擇規則">
    - 列出多個安裝程式時，閘道會選擇一個偏好的
      選項（可用時選擇 brew，否則選擇 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你可以
      查看所有可用成品。
    - 規格可包含 `os: ["darwin"|"linux"|"win32"]`，以依平台篩選。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`
      （預設：npm；選項：npm / pnpm / yarn / bun）。這只會影響 Skill
      安裝；閘道執行階段仍應為 Node。
    - 閘道安裝程式偏好順序：Homebrew → uv → 已設定的 node 管理程式 →
      go → download。
  </Accordion>
  <Accordion title="各安裝程式詳細資料">
    - **Homebrew：**OpenClaw 不會自動安裝 Homebrew，也不會將 brew
      formula 轉換為系統套件命令。在沒有
      `brew` 的 Linux 容器中，僅限 brew 的安裝程式會被隱藏；請使用自訂映像檔或手動安裝
      相依項目。
    - **Go：**OpenClaw 的自動 Skill 安裝需要 Go 1.21 或更新版本。
      如果缺少 `go` 且 Homebrew 可用，OpenClaw 會先透過
      Homebrew 安裝 Go；在沒有 Homebrew 的 Linux 上，若重新整理後的 `golang-go`
      候選版本符合最低版本要求，則可改為以 root 身分或透過免密碼 `sudo`
      使用 `apt-get`。相依項目的實際 `go install` 一律指向
      OpenClaw 管理的專用 bin 目錄（全新安裝時為 Homebrew 的
      `bin`，否則為 `~/.local/bin`），而非你設定的
      `GOBIN`——系統會讀取你自己的 `GOBIN`、`GOPATH` 和 `GOTOOLCHAIN`
      環境變數，但絕不覆寫。
    - **下載：**`url`（必填）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（預設：偵測到封存檔時為 auto）、`stripComponents`、
      `targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="沙箱注意事項">
    載入 Skill 時，會在**主機**上檢查 `requires.bins`。如果代理程式
    在沙箱中執行，該二進位檔也必須存在於**容器內部**。
    請透過 `agents.defaults.sandbox.docker.setupCommand` 或自訂
    映像檔安裝。`setupCommand` 會在容器建立後執行一次，且要求
    沙箱具備對外網路存取、可寫入的根檔案系統，以及 root 使用者。
  </Accordion>
</AccordionGroup>

## 設定覆寫

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切換及設定內建或受管理的 Skills：

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
  `false` 會停用該 Skill，即使它已內建或安裝也一樣。`coding-agent`
  內建 Skill 採選擇啟用——請設定 `skills.entries.coding-agent.enabled: true`，
  並確保已安裝且驗證 `claude`、`codex`、`opencode` 或其他支援的命令列介面
  之一。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  為宣告 `metadata.openclaw.primaryEnv` 的 Skills 提供的便利欄位。
  支援純文字字串或 SecretRef 物件。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  為代理程式執行注入的環境變數。僅在該
  變數尚未於程序中設定時注入。
</ParamField>

<ParamField path="config" type="object">
  用於自訂個別 Skill 設定欄位的選用容器。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  僅適用於**內建** Skills 的選用允許清單。設定後，只有清單中的內建 Skills
  符合資格。受管理和工作區 Skills 不受影響。
</ParamField>

<Note>
  設定鍵預設會比對 **Skill 名稱**。如果某個 Skill 定義了
  `metadata.openclaw.skillKey`，請改用 `skills.entries` 下的該鍵。
  含連字號的名稱須加上引號：JSON5 允許使用加引號的鍵。
</Note>

## 環境注入

代理程式執行開始時，OpenClaw 會：

<Steps>
  <Step title="讀取 Skill 中繼資料">
    OpenClaw 會解析代理程式的有效 Skill 清單，套用閘門
    規則、允許清單及設定覆寫。
  </Step>
  <Step title="注入環境變數與 API 金鑰">
    在執行期間，會將 `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 套用至
    `process.env`。
  </Step>
  <Step title="建置系統提示詞">
    符合資格的 Skills 會編譯為精簡的 XML 區塊，並注入
    系統提示詞。
  </Step>
  <Step title="還原環境">
    執行結束後，會還原原始環境。
  </Step>
</Steps>

<Warning>
  環境變數注入的範圍是**主機**上的代理程式執行，而非沙箱。在
  沙箱內，`env` 和 `apiKey` 不會生效。請參閱
  [Skills 設定](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)，了解如何
  將機密資料傳入沙箱執行。
</Warning>

對於內建的 `claude-cli` 後端，OpenClaw 也會將相同的
合格 Skill 快照具體化為暫存 Claude Code 外掛，並透過
`--plugin-dir` 傳遞。其他命令列介面後端只使用提示詞目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**建立合格 Skills 的快照，並在該工作階段的
所有後續輪次中重複使用該清單。Skills 或設定的變更會在下一個新工作階段
生效。

Skills 會在下列兩種情況下於工作階段中途重新整理：

- Skills 監看器偵測到 `SKILL.md` 變更。
- 新的合格遠端節點連線。

重新整理後的清單會在代理程式的下一輪採用。如果有效代理程式
允許清單變更，OpenClaw 會重新整理快照，使可見的 Skills
維持一致。

<AccordionGroup>
  <Accordion title="Skills 監看器">
    OpenClaw 預設會監看 Skill 資料夾，並在
    `SKILL.md` 檔案變更時更新快照。請在 `skills.load` 下設定：

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // 預設
          watchDebounceMs: 250, // 預設
        },
      },
    }
    ```

    對於 Skill 根目錄符號連結指向設定根目錄以外的刻意符號連結配置，
    請使用 `allowSymlinkTargets`，例如
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    只有在 Skill Workshop 也應透過這些受信任的符號連結路徑
    套用提案時，才啟用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="遠端 macOS 節點（Linux 閘道）">
    如果閘道在 Linux 上執行，但有允許
    `system.run` 的 **macOS 節點**連線，且該節點具備所需的二進位檔，
    OpenClaw 可將僅限 macOS 的 Skills 視為符合資格。代理程式應透過
    `exec` 工具搭配 `host=node` 執行這些
    Skills。

    離線節點**不會**讓僅限遠端的 Skills 顯示。如果節點停止
    回應二進位檔探查，OpenClaw 會清除其快取的二進位檔相符項目。

  </Accordion>
</AccordionGroup>

## 權杖影響

當 Skills 符合資格時，OpenClaw 會將精簡的 XML 區塊注入系統
提示詞。成本是確定的，並且會隨每個 Skill 線性增加：

- **基本額外負擔**（僅在有 1 個以上 Skills 符合資格時）：固定的介紹
  文字區塊，加上 `<available_skills>` 包裝器。
- **每個 Skill：**約 97 個字元，加上你的 `name`、`description` 和 `location`
  欄位長度。
- XML 跳脫會將 `& < > " '` 展開為實體，每次出現會增加數個字元。
- 以約 4 個字元／權杖計算，在計入欄位長度前，每個 Skill 的 97 個字元約等於 24 個權杖。

如果轉譯後的區塊會超出設定的提示預算
(`skills.limits.maxSkillsPromptChars`)，OpenClaw 會先保留無描述的精簡格式
可容納的最多技能識別資訊（名稱、位置和版本）。
接著會將剩餘預算用於縮短後的描述。如果沒有剩餘的
描述預算，則會省略描述。每當需要使用精簡格式或截斷
清單時，提示中都會包含一則指向 `openclaw skills check` 的註記。

請保持描述簡短且明確，以將提示額外負擔降至最低。

## 相關內容

<CardGroup cols={2}>
  <Card title="建立技能" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂技能的逐步指南。
  </Card>
  <Card title="技能工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    由代理程式草擬之技能的提案佇列。
  </Card>
  <Card title="技能設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理程式允許清單。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    技能斜線命令的註冊與路由方式。
  </Card>
  <Card title="ClawHub" href="/zh-TW/clawhub" icon="cloud">
    在公開登錄檔中瀏覽及發布技能。
  </Card>
  <Card title="外掛" href="/zh-TW/tools/plugin" icon="plug">
    外掛可隨其所記錄的工具一併提供技能。
  </Card>
</CardGroup>
