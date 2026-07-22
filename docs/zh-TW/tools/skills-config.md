---
read_when:
    - 設定 Skill 的載入、安裝或閘控行為
    - 設定各代理程式的 Skills 可見性
    - 調整 Skills 工作坊限制或核准政策
sidebarTitle: Skills config
summary: skills.* 設定結構描述、代理程式允許清單、工作坊設定，以及沙箱環境變數處理的完整參考。
title: Skills 設定
x-i18n:
    generated_at: "2026-07-22T10:51:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 448430313badce342756f0b6db4f5825f52f0e7c96d3d870fa778adc3867f2fb
    source_path: tools/skills-config.md
    workflow: 16
---

大多數 Skills 設定位於
`~/.openclaw/openclaw.json` 中的 `skills`。代理程式專屬的可見性設定位於
`agents.defaults.skills` 和 `agents.entries.*.skills`。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  若要使用內建的圖片生成功能，請使用 `agents.defaults.mediaModels.image`
  加上核心 `image_generate` 工具，而非 `skills.entries`。Skill
  項目僅供自訂或第三方 Skill 工作流程使用。
</Note>

## 載入（`skills.load`）

<ParamField path="skills.load.extraDirs" type="string[]">
  要掃描的其他 Skill 目錄，優先順序最低（低於內建和外掛 Skill）。
  路徑展開支援 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的實際目標目錄；符號連結的 Skill 資料夾可以解析至這些目錄，
  即使符號連結位於已設定的根目錄之外。可將此設定用於刻意安排的同層儲存庫配置，例如
  `<workspace>/skills/manager -> ~/Projects/manager/skills`。請嚴格限制此清單，
  不要指向 `~` 或 `~/Projects` 之類的廣泛根目錄。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  監看 Skill 資料夾，並在 `SKILL.md` 檔案變更時重新整理 Skills
  快照。涵蓋分組 Skill 根目錄下的巢狀檔案。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 監看器事件的防彈跳時間範圍，以毫秒為單位。
</ParamField>

## 安裝（`skills.install`）

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` 可用時，優先使用 Homebrew 安裝程式。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  安裝 Skill 時偏好的 Node 套件管理員。這只會影響 Skill
  安裝；OpenClaw 命令列介面和閘道執行階段需要 Node，因為
  正式狀態儲存區使用 `node:sqlite`。`openclaw setup --node-manager` 和
  `openclaw onboard --node-manager` 接受 `npm`、`pnpm` 或 `bun`；
  若要使用 Yarn 安裝 Skill，請直接在設定中設定 `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允許受信任的 `operator.admin` 閘道用戶端安裝透過
  `skills.upload.*` 暫存的私有 zip 封存檔。一般 ClawHub 安裝不需要此設定。
</ParamField>

## 操作員安裝政策（`security.installPolicy`）

當操作員需要受信任的本機命令，以依據主機專屬政策核准或封鎖
Skill 和外掛安裝時，請使用 `security.installPolicy`。
此政策會在 OpenClaw 暫存來源資料之後、安裝或更新繼續之前執行。
它適用於 ClawHub Skills、上傳的 Skills、Git／本機 Skills、
Skill 相依性安裝程式，以及外掛安裝／更新來源。

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // 省略 targets 以涵蓋所有支援的目標。
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  啟用由操作員管理的安裝政策。啟用後若沒有有效的 `exec`
  命令，安裝將採取失敗關閉。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  選用的目標篩選器。省略時，政策會套用至每個支援的目標，
  因此新的安裝不會意外地採取失敗開放。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任政策可執行檔的絕對路徑。OpenClaw 不透過 shell 執行它，
  並會在使用前驗證路徑。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 之後傳入的靜態引數。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  單次政策決策的最長實際執行時間。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  在政策採取失敗關閉前，stdout 或 stderr 沒有輸出的最長時間。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  政策程序可接受的 stdout 和 stderr 合計位元組上限。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供給政策程序的常值環境變數。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  從 OpenClaw 程序複製到政策程序的環境變數名稱。只會傳遞指定名稱的變數。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可包含政策可執行檔之目錄的選用允許清單。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  略過命令路徑的擁有權和權限檢查。只有當其他機制會保護該路徑時才能使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允許已設定的命令路徑是符號連結。解析後的目標仍須符合其他路徑檢查。
  直譯器指令碼引數必須是直接的一般檔案，不得為符號連結。
</ParamField>

政策會在 stdin 接收一個 JSON 物件，其中包含 `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
選用的結構化 `source`、結構化 `origin`，以及 `request`。
它必須在 stdout 寫入一個 JSON 物件：`{ "protocolVersion": 1, "decision": "allow" }`
或 `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零結束狀態、逾時、格式錯誤的 JSON、
缺少欄位或不支援的通訊協定版本，都會採取失敗關閉。

OpenClaw 在一般閘道啟動期間不會執行安裝政策。
若政策已啟用但無法使用，安裝和更新會採取失敗關閉。
`openclaw doctor` 會執行靜態驗證；`openclaw doctor --deep`
會針對已設定的命令執行合成安裝探測。

大量更新會逐一對每個目標套用政策：遭封鎖的 Skill 或外掛更新會讓該目標失敗，
但不會停用政策，也不會略過批次中後續的目標。

stdin 範例：

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

最小政策命令：

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "此主機未核准本機外掛路徑",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## 內建 Skill 允許清單

<ParamField path="skills.allowBundled" type="string[]">
  僅適用於**內建** Skills 的選用允許清單。設定後，只有清單中的內建
  Skills 符合使用資格。受管理、代理程式層級和工作區
  Skills 不受影響。
</ParamField>

## 個別 Skill 項目（`skills.entries`）

`entries` 下的鍵預設會與 Skill 的 `name` 相符。若 Skill 定義了
`metadata.openclaw.skillKey`，請改用該鍵。含連字號的名稱需加上引號
（JSON5 允許使用加上引號的鍵）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  即使 Skill 是內建或已安裝，`false` 也會將其停用。
  內建 Skill `coding-agent` 需選擇啟用——請將其設定為 `true`，
  並確認 `claude`、`codex`、`opencode` 或其他支援的命令列介面之一已安裝並完成驗證。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  適用於宣告 `metadata.openclaw.primaryEnv` 之 Skills 的便利欄位。
  支援純文字字串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  為代理程式執行注入的環境變數。只有當程序中尚未設定該變數時才會注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  用於自訂個別 Skill 設定欄位的選用容器。
</ParamField>

## 代理程式允許清單（`agents`）

當你想使用相同的機器／工作區 Skill 根目錄，但讓每個代理程式具有不同的可見 Skill 集合時，
請使用代理程式設定。

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

<ParamField path="agents.defaults.skills" type="string[]">
  省略 `agents.entries.*.skills` 的代理程式會繼承共用基準允許清單。
  完全省略此設定，即可讓 Skills 預設不受限制。
</ParamField>

<ParamField path="agents.entries.*.skills" type="string[]">
  該代理程式明確的最終 Skill 集合。明確清單會**取代**
  繼承的預設值，而非合併。設定為 `[]`，即可不向該代理程式顯示任何 Skill。
</ParamField>

<Warning>
  代理程式 Skill 允許清單是 OpenClaw Skill 探索、提示詞、斜線命令探索、
  沙箱同步和 Skill 快照的可見性與載入篩選器。它們不是 shell 執行階段的授權邊界。
  如果代理程式可以執行主機的 `exec`，該 shell 仍可執行外部用戶端，
  或讀取執行使用者可見的主機檔案，包括 `~/.openclaw/skills/config/mcporter.json` 等 MCP 用戶端登錄檔。
  若要達成個別代理程式的 MCP 隔離，請將 Skill 允許清單與沙箱／作業系統使用者隔離搭配使用，
  拒絕主機 exec 或為其設定嚴格的允許清單，並優先在 MCP 伺服器使用個別代理程式的認證資訊。
</Warning>

## Workshop（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  當 `true` 時，OpenClaw 可以根據持久保留的修正建立待處理提案，
  並可在系統進入閒置後，審查已成功完成且具實質內容的工作。
  這可能會在符合資格的回合後新增一次背景模型執行。由使用者提示的
  skill 建立和 `/learn` 在此設定為 `false` 時仍可運作。
</ParamField>

請參閱[自我學習](/zh-TW/tools/self-learning)，瞭解資格條件、隱私權、成本、
僅限提案的權限，以及疑難排解。

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` 允許代理程式主動套用、拒絕或隔離，而無須
  額外的核准提示。`pending` 需要操作人員核准。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允許 Skill Workshop 套用時，透過工作區 skill 符號連結寫入其
  已由 `skills.load.allowSymlinkTargets` 信任的實際目標。除非產生的提案在套用時
  應修改該共用 skill 根目錄，否則請保持停用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每個工作區保留的待處理與已隔離提案數量上限（允許範圍：
  1-200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文大小上限（以位元組為單位；允許範圍：1024-200000）。提案
  說明另設 160 位元組的硬性上限，因為它們會出現在探索與清單輸出中。
</ParamField>

請參閱 [Skill Workshop](/zh-TW/tools/skill-workshop)，瞭解此設定控制的提案生命週期、命令列介面
命令、代理程式工具參數及閘道方法。

## 使用符號連結的 skill 根目錄

依預設，工作區、專案代理程式、額外目錄及內建 skill 根目錄皆為
包含範圍邊界。位於 `<workspace>/skills` 下的符號連結 skill 資料夾，
若解析後位於根目錄之外，將被略過並記錄一則日誌訊息。

若要允許刻意設計的符號連結配置，請宣告受信任的目標：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

使用此設定後，`<workspace>/skills/manager -> ~/Projects/manager/skills`
會在 realpath 解析後獲准。`extraDirs` 會直接掃描同層級的儲存庫；
`allowSymlinkTargets` 則會為現有配置保留符號連結路徑。

Skill Workshop 套用預設不會透過這些符號連結寫入。若要讓 Workshop
套用時修改已受信任符號連結目標下的 skill，請另行選擇啟用：

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

受管理的 `~/.openclaw/skills` 與個人的 `~/.agents/skills` 目錄
已無條件接受 skill 目錄的符號連結（每個 skill 的
`SKILL.md` 包含範圍仍適用）— `allowSymlinkTargets` 僅適用於
工作區、額外目錄及專案代理程式（`<workspace>/.agents/skills`）
根目錄。

## 沙箱化 skill 與環境變數

<Warning>
  `skills.entries.<skill>.env` 與 `apiKey` 僅適用於**主機**執行。
  在沙箱內不會生效 — 依賴 `GEMINI_API_KEY` 的 skill 將會因
  `apiKey not configured` 而失敗，除非另外將該變數提供給沙箱。
</Warning>

使用以下設定將密鑰傳入 Docker 沙箱：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  擁有 Docker 常駐程式存取權的使用者，可以透過 Docker 中繼資料
  檢視 `sandbox.docker.env` 的值。若無法接受此類暴露，請使用掛載的密鑰檔案、
  自訂映像檔或其他傳遞途徑。
</Note>

## 載入順序提醒

```text
workspace/skills      （最高）
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
內建 skills
skills.load.extraDirs （最低）
```

啟用監看程式時，skill 與設定的變更會在下一個新工作階段生效；
或在監看程式偵測到變更後的下一個代理程式回合生效。

## 相關內容

<CardGroup cols={2}>
  <Card title="Skills 參考資料" href="/zh-TW/tools/skills" icon="puzzle-piece">
    說明 skill 的定義、載入順序、門控機制及 SKILL.md 格式。
  </Card>
  <Card title="建立 skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂工作區 skills。
  </Card>
  <Card title="Skill Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    用於代理程式草擬 skill 的提案佇列。
  </Card>
  <Card title="自我學習" href="/zh-TW/tools/self-learning" icon="brain">
    根據已完成工作產生保守且須選擇啟用的提案。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生斜線命令目錄與聊天指令。
  </Card>
</CardGroup>
