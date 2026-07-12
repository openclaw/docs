---
read_when:
    - 新增或修改 Skills
    - 變更 Skills 閘控、允許清單或載入規則
    - 瞭解 Skills 的優先順序與快照行為
sidebarTitle: Skills
summary: Skills 會教導你的代理如何使用工具。瞭解它們的載入方式、優先順序的運作方式，以及如何設定存取限制、允許清單與環境變數注入。
title: Skills
x-i18n:
    generated_at: "2026-07-11T21:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills 是 Markdown 指示檔案，用來教導代理程式如何以及何時使用
工具。每個 Skill 都位於一個目錄中，其中包含具有 YAML
前置資料和 Markdown 本文的 `SKILL.md` 檔案。OpenClaw 會載入隨附的 Skills 以及所有本機
覆寫項目，並在載入時根據環境、設定和
二進位檔是否存在進行篩選。

<CardGroup cols={2}>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    從零開始建立並測試自訂 Skill。
  </Card>
  <Card title="Skill 工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    審查並核准代理程式草擬的 Skill 提案。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述和代理程式允許清單。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    瀏覽並安裝社群 Skills。
  </Card>
</CardGroup>

## 載入順序

OpenClaw 會從下列來源載入，依**優先順序由高至低**排列。當相同的
Skill 名稱出現在多個位置時，以優先順序最高的來源為準。

| 優先順序    | 來源                   | 路徑                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — 最高    | 工作區 Skills          | `<workspace>/skills`                    |
| 2           | 專案代理程式 Skills    | `<workspace>/.agents/skills`            |
| 3           | 個人代理程式 Skills    | `~/.agents/skills`                      |
| 4           | 受管理／本機 Skills    | `~/.openclaw/skills`                    |
| 5           | 隨附 Skills            | 隨安裝項目提供                          |
| 6 — 最低    | 額外目錄               | `skills.load.extraDirs` + 外掛 Skills   |

Skill 根目錄支援分組式配置。只要 `SKILL.md` 出現在已設定根目錄下的任何位置
（最深 6 層），OpenClaw 就會發現該 Skill：

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

資料夾路徑僅供組織使用。Skill 的名稱和斜線命令
來自前置資料中的 `name` 欄位（若缺少 `name`，則使用目錄名稱）。
代理程式允許清單（如下）也會比對此 `name`。

<Note>
  Codex CLI 原生的 `$CODEX_HOME/skills` 目錄**不是** OpenClaw
  Skill 根目錄。請使用 `openclaw migrate plan codex` 清查這些 Skills，然後使用
  `openclaw migrate codex` 將其複製到 OpenClaw 工作區。
</Note>

## 節點託管的 Skills

已連線的無頭節點可以發布安裝於其作用中 OpenClaw
Skills 目錄中的 Skills（預設為 `~/.openclaw/skills`；會套用設定檔環境覆寫）。
節點連線時，這些 Skills 會出現在一般代理程式 Skill 清單中；
節點中斷連線時則會消失。發生名稱衝突時，本機或閘道 Skill 會保留其名稱；
節點 Skill 則會取得確定性的節點前綴名稱。
節點託管 v1 要求目錄名稱必須與 Skill 前置資料中的 `name`
欄位相符。

Skill 項目包含節點定位器。其檔案、相對參照和
二進位檔都位於節點上，因此請使用
`exec host=node node=<node-id>` 載入並執行。變更 Skill
檔案後，請重新啟動節點主機。配對與停用開關請參閱[節點](/zh-TW/nodes#node-hosted-skills)。

## 各代理程式專用與共用 Skills

在多代理程式設定中，每個代理程式都有自己的工作區。請使用符合所需
可見範圍的路徑：

| 範圍             | 路徑                         | 可見對象                   |
| ---------------- | ---------------------------- | -------------------------- |
| 各代理程式專用   | `<workspace>/skills`         | 僅該代理程式               |
| 專案代理程式     | `<workspace>/.agents/skills` | 僅該工作區的代理程式       |
| 個人代理程式     | `~/.agents/skills`           | 此機器上的所有代理程式     |
| 共用受管理       | `~/.openclaw/skills`         | 此機器上的所有代理程式     |
| 額外目錄         | `skills.load.extraDirs`      | 此機器上的所有代理程式     |

## 代理程式允許清單

Skill 的**位置**（優先順序）與 Skill 的**可見性**（哪些代理程式可以使用
它）是不同的控制項。使用允許清單限制代理程式可看到哪些 Skills，
無論這些 Skills 從何處載入。

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
    - 省略 `agents.defaults.skills`，即可讓所有 Skills 預設不受限制。
    - 省略 `agents.list[].skills`，即可繼承 `agents.defaults.skills`。
    - 將 `agents.list[].skills` 設為 `[]`，即可不向該代理程式公開任何 Skills。
    - 非空白的 `agents.list[].skills` 清單就是**最終**集合，不會
      與預設值合併。
    - 有效的允許清單會套用於提示詞建構、斜線命令
      探索、沙箱同步和 Skill 快照。
    - 這不是主機殼層的授權邊界。如果同一代理程式可以
      使用 `exec`，請另行透過沙箱、作業系統使用者
      隔離、exec 拒絕／允許清單以及各資源憑證來限制該殼層。
  </Accordion>
</AccordionGroup>

## 外掛與 Skills

外掛可以在 `openclaw.plugin.json` 中列出 `skills` 目錄
（路徑相對於外掛根目錄），藉此隨附自己的 Skills。啟用外掛時會載入
外掛 Skills，例如瀏覽器外掛隨附用於多步驟瀏覽器控制的
`browser-automation` Skill。

外掛 Skill 目錄會在與 `skills.load.extraDirs` 相同的低優先順序層級合併，
因此同名的隨附、受管理、代理程式或工作區
Skill 會覆寫它們。與其他 Skill 相同，可透過其前置資料中的
`metadata.openclaw.requires` 控制外掛 Skill 本身是否符合使用資格。

如需完整的外掛系統，請參閱[外掛](/zh-TW/tools/plugin)和[工具](/zh-TW/tools)。

## Skill 工作坊

[Skill 工作坊](/zh-TW/tools/skill-workshop)是代理程式與作用中 Skill 檔案之間的提案佇列。
當代理程式發現可重複使用的工作時，會草擬一份
提案，而不是直接寫入 `SKILL.md`。在進行任何變更之前，
您需要先審查並核准。

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

如需完整生命週期、命令列介面
參考資料和設定，請參閱[Skill 工作坊](/zh-TW/tools/skill-workshop)。

## 從 ClawHub 安裝

[ClawHub](https://clawhub.ai) 是公開的 Skills 登錄庫。使用
`openclaw skills` 命令進行安裝和更新，或使用 `clawhub` 命令列介面進行
發布和同步。

| 動作                               | 命令                                                   |
| ---------------------------------- | ------------------------------------------------------ |
| 將 Skill 安裝到工作區              | `openclaw skills install @owner/<slug>`                |
| 從 Git 儲存庫安裝                  | `openclaw skills install git:owner/repo@ref`           |
| 安裝本機 Skill 目錄                | `openclaw skills install ./path/to/skill --as my-tool` |
| 為所有本機代理程式安裝             | `openclaw skills install @owner/<slug> --global`       |
| 更新所有工作區 Skills              | `openclaw skills update --all`                         |
| 更新共用的受管理 Skill             | `openclaw skills update @owner/<slug> --global`        |
| 更新所有共用的受管理 Skills        | `openclaw skills update --all --global`                |
| 驗證 Skill 的信任封套              | `openclaw skills verify @owner/<slug>`                 |
| 輸出產生的 Skill 卡片              | `openclaw skills verify @owner/<slug> --card`          |
| 透過 ClawHub 命令列介面發布／同步  | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="安裝詳細資料">
    `openclaw skills install` 預設會安裝到作用中工作區的 `skills/`
    目錄。加入 `--global` 則會安裝到共用的
    `~/.openclaw/skills` 目錄；除非代理程式允許清單縮小可見範圍，否則所有本機代理程式都可看見。

    Git 和本機安裝要求來源根目錄中有 `SKILL.md`。若 `SKILL.md`
    前置資料中的 `name` 有效，短名會取自該欄位，否則會回退到
    目錄或儲存庫名稱。使用 `--as <slug>` 可覆寫。
    `openclaw skills update` 僅追蹤 ClawHub 安裝項目；若要重新整理 Git 或
    本機來源，請重新安裝。

  </Accordion>
  <Accordion title="驗證與安全掃描">
    `openclaw skills verify @owner/<slug>` 會向 ClawHub 查詢該 Skill 的
    `clawhub.skill.verify.v1` 信任封套。已安裝的 ClawHub Skills 會根據
    `.clawhub/origin.json` 中記錄的版本和登錄庫進行驗證。
    對於既有已安裝或沒有歧義的 Skills，仍接受未限定擁有者的短名，但
    具擁有者限定的參照可避免發布者歧義。

    ClawHub Skill 頁面會在安裝前顯示最新的安全掃描狀態，
    並提供 VirusTotal、ClawScan 和靜態分析的詳細資訊頁面。當 ClawHub
    將驗證標記為失敗時，命令會以非零狀態結束。發布者可透過
    ClawHub 儀表板或 `clawhub skill rescan @owner/<slug>`
    處理誤判。

  </Accordion>
  <Accordion title="私有封存安裝">
    需要非 ClawHub 傳遞方式的閘道用戶端，可以使用
    `skills.upload.begin`、`skills.upload.chunk` 和 `skills.upload.commit`
    暫存 zip Skill 封存檔，然後使用 `skills.install({ source: "upload", ... })`
    安裝。此路徑預設為關閉，且必須在 `openclaw.json` 中設定
    `skills.install.allowUploadedArchives: true`。一般 ClawHub 安裝不需要該設定。
  </Accordion>
</AccordionGroup>

## 安全性

<Warning>
  將第三方 Skills 視為**不受信任的程式碼**。啟用前請先閱讀。
  對於不受信任的輸入和高風險工具，請優先使用沙箱執行。代理程式端的控制方式請參閱
  [沙箱](/zh-TW/gateway/sandboxing)。
</Warning>

<AccordionGroup>
  <Accordion title="路徑限制">
    工作區、專案代理程式和額外目錄的 Skill 探索，只接受解析後實際路徑
    保持在已設定根目錄內的 Skill 根目錄，除非
    `skills.load.allowSymlinkTargets` 明確信任目標根目錄。
    僅在啟用 `skills.workshop.allowSymlinkTargetWrites` 時，
    Skill 工作坊才能透過這些受信任的目標寫入。
    受管理的 `~/.openclaw/skills` 和個人的 `~/.agents/skills` 可以包含
    符號連結 Skill 資料夾，但每個 `SKILL.md` 的實際路徑仍必須
    位於其解析後的 Skill 目錄內。
  </Accordion>
  <Accordion title="操作者安裝原則">
    設定 `security.installPolicy`，在繼續安裝 Skill 前執行受信任的本機原則命令。
    該原則會接收中繼資料和暫存來源路徑，並套用於 ClawHub、上傳、Git、本機、更新及
    相依項目安裝程式路徑；若命令無法傳回有效決策，則採取封閉式失敗。
  </Accordion>
  <Accordion title="密鑰注入範圍">
    `skills.entries.*.env` 和 `skills.entries.*.apiKey` 僅會將密鑰注入該次代理程式回合的
    **主機**程序，而不會注入沙箱。請勿在提示詞和日誌中包含密鑰。
  </Accordion>
</AccordionGroup>

如需更廣泛的威脅模型和安全性檢查清單，請參閱
[安全性](/zh-TW/gateway/security)。

## SKILL.md 格式

每個 Skill 的前置資料至少需要包含 `name` 和 `description`：

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw 遵循 [AgentSkills](https://agentskills.io) 規範。Frontmatter
  會先以 YAML 解析；若失敗，則改用僅支援單行的
  解析器。巢狀 `metadata` 區塊（包括多行 YAML 對應）
  會攤平成 JSON 字串，再以 JSON5 重新解析，因此
  [門控](#gating) 下所示的區塊格式可以正常運作。在正文中使用 `{baseDir}` 來參照
  skill 資料夾路徑。
</Note>

### 選用的 frontmatter 鍵

<ParamField path="homepage" type="string">
  在 macOS Skills 使用者介面中顯示為 "Website" 的 URL。也可透過
  `metadata.openclaw.homepage` 設定。
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  設為 `true` 時，skill 會公開為可由使用者呼叫的斜線命令。
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  設為 `true` 時，OpenClaw 不會將此 skill 的指示放入代理程式的一般
  提示中。當 `user-invocable` 也為 `true` 時，此 skill 仍可作為斜線命令使用。
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  設為 `tool` 時，斜線命令會略過模型，直接分派至
  已註冊的工具。
</ParamField>

<ParamField path="command-tool" type="string">
  設定 `command-dispatch: tool` 時要呼叫的工具名稱。
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  對於工具分派，會將原始引數字串轉送給工具，不經
  核心解析。工具會收到
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`。
</ParamField>

## 門控

OpenClaw 在載入時使用 `metadata.openclaw`（嵌入 frontmatter 的 JSON5 物件，
請參閱上方的解析說明）篩選 skills。沒有
`metadata.openclaw` 區塊的 skill 一律符合資格，除非明確停用。

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
  設為 `true` 時，一律包含此 skill 並略過所有其他門控條件。
</ParamField>

<ParamField path="emoji" type="string">
  在 macOS Skills 使用者介面中顯示的選用表情符號。
</ParamField>

<ParamField path="homepage" type="string">
  在 macOS Skills 使用者介面中顯示為 "Website" 的選用 URL。
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  平台篩選器。設定後，此 skill 只在列出的作業系統上符合資格。
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
  每個 `openclaw.json` 路徑的值都必須為真值。
</ParamField>

<ParamField path="primaryEnv" type="string">
  與 `skills.entries.<name>.apiKey` 關聯的環境變數名稱。
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills 使用者介面使用的選用安裝程式規格（brew / node / go / uv / download）。
</ParamField>

<Note>
  當缺少 `metadata.openclaw` 時，仍接受舊版 `metadata.clawdbot`
  區塊，因此較早安裝的 skills 會保留其
  相依性門控與安裝程式提示。新的 skills 應使用
  `metadata.openclaw`。
</Note>

### 安裝程式規格

安裝程式規格會告知 macOS Skills 使用者介面如何安裝相依項目：

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
    - 列出多個安裝程式時，閘道會選擇一個偏好的
      選項（可用時選 brew，否則選 node）。
    - 如果所有安裝程式都是 `download`，OpenClaw 會列出每個項目，讓你可以
      查看所有可用的成品。
    - 規格可以包含 `os: ["darwin"|"linux"|"win32"]`，以依平台篩選。
    - Node 安裝會遵循 `openclaw.json` 中的 `skills.install.nodeManager`
      （預設：npm；選項：npm / pnpm / yarn / bun）。這只會影響 skill
      安裝；閘道執行階段仍應使用 Node。
    - 閘道安裝程式偏好順序：Homebrew → uv → 已設定的 node 管理器 →
      go → download。
  </Accordion>
  <Accordion title="各安裝程式詳細資訊">
    - **Homebrew：** OpenClaw 不會自動安裝 Homebrew，也不會將 brew
      formula 轉換為系統套件命令。在沒有
      `brew` 的 Linux 容器中，只提供 brew 的安裝程式會被隱藏；請使用自訂映像檔或手動安裝
      相依項目。
    - **Go：** OpenClaw 的自動 skill 安裝需要 Go 1.21 或更新版本。
      如果缺少 `go` 且 Homebrew 可用，OpenClaw 會先透過
      Homebrew 安裝 Go；在沒有 Homebrew 的 Linux 上，如果重新整理後的 `golang-go`
      候選版本符合最低版本要求，則可改用 root 權限或免密碼 `sudo`
      執行 `apt-get`。相依項目實際使用的 `go install`
      一律以 OpenClaw 管理的專用二進位檔目錄為目標
      （全新安裝時使用 Homebrew 的 `bin`，否則使用 `~/.local/bin`），而非
      你設定的 `GOBIN`——系統會讀取你自己的 `GOBIN`、`GOPATH` 和 `GOTOOLCHAIN`
      環境變數，但絕不覆寫它們。
    - **下載：** `url`（必要）、`archive`（`tar.gz` | `tar.bz2` | `zip`）、
      `extract`（預設：偵測到封存檔時自動啟用）、`stripComponents`、
      `targetDir`（預設：`~/.openclaw/tools/<skillKey>`）。
  </Accordion>
  <Accordion title="沙箱注意事項">
    `requires.bins` 會在載入 skill 時於**主機**上檢查。如果代理程式
    在沙箱中執行，該二進位檔也必須存在於**容器內部**。
    請透過 `agents.defaults.sandbox.docker.setupCommand` 或自訂
    映像檔安裝。`setupCommand` 會在容器建立後執行一次，且要求
    能夠連出網路、可寫入的根檔案系統，以及沙箱中的 root 使用者。
  </Accordion>
</AccordionGroup>

## 設定覆寫

在 `~/.openclaw/openclaw.json` 的 `skills.entries` 下切換及設定
內建或受管理的 skills：

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
  即使 skill 為內建或已安裝，`false` 仍會將其停用。內建的 `coding-agent`
  skill 採用選擇加入模式——請設定 `skills.entries.coding-agent.enabled: true`
  並確保已安裝且已驗證 `claude`、`codex`、`opencode` 或其他受支援的命令列介面
  之一。
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  適用於宣告 `metadata.openclaw.primaryEnv` 之 skills 的便利欄位。
  支援純文字字串或 SecretRef 物件。
</ParamField>

<ParamField path="env" type="Record<string, string>">
  為代理程式執行注入的環境變數。僅在
  程序中尚未設定該變數時注入。
</ParamField>

<ParamField path="config" type="object">
  用於自訂各 skill 設定欄位的選用容器。
</ParamField>

<ParamField path="allowBundled" type="string[]">
  僅適用於**內建** skills 的選用允許清單。設定後，只有清單中的內建 skills
  符合資格。受管理及工作區 skills 不受影響。
</ParamField>

<Note>
  設定鍵預設與 **skill 名稱**相符。如果 skill 定義了
  `metadata.openclaw.skillKey`，請改用該鍵放在 `skills.entries` 下。
  含連字號的名稱需加引號：JSON5 允許使用帶引號的鍵。
</Note>

## 環境注入

代理程式執行開始時，OpenClaw 會：

<Steps>
  <Step title="讀取 skill 中繼資料">
    OpenClaw 會解析代理程式的有效 skill 清單，並套用門控
    規則、允許清單與設定覆寫。
  </Step>
  <Step title="注入環境變數與 API 金鑰">
    `skills.entries.<key>.env` 和 `skills.entries.<key>.apiKey` 會在
    執行期間套用至 `process.env`。
  </Step>
  <Step title="建立系統提示">
    符合資格的 skills 會編譯成精簡的 XML 區塊，並注入
    系統提示。
  </Step>
  <Step title="還原環境">
    執行結束後，會還原原始環境。
  </Step>
</Steps>

<Warning>
  環境變數注入的範圍是**主機**上的代理程式執行，而非沙箱。在
  沙箱內，`env` 和 `apiKey` 不會生效。請參閱
  [Skills 設定](/zh-TW/tools/skills-config#sandboxed-skills-and-env-vars)，了解如何
  將密鑰傳入沙箱執行環境。
</Warning>

對於內建的 `claude-cli` 後端，OpenClaw 還會將同一份
符合資格的 skill 快照具現化為暫時的 Claude Code 外掛，並透過
`--plugin-dir` 傳入。其他命令列介面後端僅使用提示目錄。

## 快照與重新整理

OpenClaw 會在**工作階段開始時**建立符合資格的 skills 快照，並在該工作階段的
所有後續輪次中重複使用此清單。skills 或設定的變更會在下一個新工作階段
生效。

在下列兩種情況下，skills 會於工作階段中途重新整理：

- skills 監看器偵測到 `SKILL.md` 變更。
- 新的符合資格的遠端節點連線。

重新整理後的清單會在代理程式下一輪使用。如果有效的代理程式
允許清單發生變更，OpenClaw 會重新整理快照，使可見的 skills
保持一致。

<AccordionGroup>
  <Accordion title="Skills 監看器">
    OpenClaw 預設會監看 skill 資料夾，並在
    `SKILL.md` 檔案變更時更新快照。請在 `skills.load` 下設定：

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

    對於刻意使用符號連結的配置，如果 skill
    根目錄符號連結指向已設定根目錄之外，請使用 `allowSymlinkTargets`，例如
    `<workspace>/skills/manager -> ~/Projects/manager/skills`。
    只有當 Skill Workshop 也應透過這些受信任的符號連結路徑
    套用提案時，才啟用 `skills.workshop.allowSymlinkTargetWrites`。

  </Accordion>
  <Accordion title="遠端 macOS 節點（Linux 閘道）">
    如果閘道在 Linux 上執行，但已連線允許
    `system.run` 的 **macOS 節點**，且該節點具備必要的二進位檔，OpenClaw 可將僅限 macOS 的 skills
    視為符合資格。代理程式應透過 `exec` 工具並設定 `host=node`
    來執行這些 skills。

    離線節點**不會**讓僅限遠端的 skills 顯示。如果節點停止
    回應二進位檔探測，OpenClaw 會清除其快取的二進位檔比對結果。

  </Accordion>
</AccordionGroup>

## Token 影響

當有符合資格的 skills 時，OpenClaw 會將精簡的 XML 區塊注入系統
提示。成本是確定的，且會隨每個 skill 線性增加：

- **基本開銷**（僅在有 1 個以上符合資格的 skills 時）：一個固定區塊，包含引介
  文字及 `<available_skills>` 包裝元素。
- **每個 skill：** 約 97 個字元，加上你的 `name`、`description` 和 `location`
  欄位長度。
- XML 跳脫會將 `& < > " '` 展開為實體，每次出現會增加數個字元。
- 以約 4 字元/token 計算，在尚未計入欄位長度前，每個 skill 的 97 個字元約等於 24 個 token。

如果轉譯後的區塊會超過設定的提示詞預算
（`skills.limits.maxSkillsPromptChars`），OpenClaw 會先以不含說明的精簡格式，保留可容納數量上限的 skill
識別資訊（名稱、位置與版本）。接著，它會使用剩餘預算加入縮短後的說明。若已無
說明預算，則會省略說明。每當需要使用精簡格式或截斷清單時，提示詞都會包含一則
指向 `openclaw skills check` 的附註。

請讓說明保持簡短且具描述性，以盡量降低提示詞負擔。

## 相關內容

<CardGroup cols={2}>
  <Card title="建立 skill" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂 skill 的逐步指南。
  </Card>
  <Card title="Skill 工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    由代理程式起草之 skill 的提案佇列。
  </Card>
  <Card title="Skills 設定" href="/zh-TW/tools/skills-config" icon="gear">
    完整的 `skills.*` 設定結構描述與代理程式允許清單。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    skill 斜線命令的註冊與路由方式。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公開登錄庫中瀏覽及發布 skill。
  </Card>
  <Card title="外掛" href="/zh-TW/tools/plugin" icon="plug">
    外掛可以隨其記錄的工具一併提供 skill。
  </Card>
</CardGroup>
