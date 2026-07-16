---
read_when:
    - 設定 Skills 的載入、安裝或門控行為
    - 設定各代理程式的 Skills 可見性
    - 調整 Skills 工作坊限制或核准政策
sidebarTitle: Skills config
summary: skills.* 設定結構描述、代理程式允許清單、工作坊設定及沙箱環境變數處理的完整參考。
title: Skills 設定
x-i18n:
    generated_at: "2026-07-16T12:04:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

大多數 Skills 設定位於
`~/.openclaw/openclaw.json` 中的 `skills` 之下。各代理程式專屬的可見性設定位於
`agents.defaults.skills` 和 `agents.list[].skills` 之下。

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
  若要使用內建圖片生成，請使用 `agents.defaults.imageGenerationModel`
  搭配核心 `image_generate` 工具，而非 `skills.entries`。Skills
  項目僅供自訂或第三方 Skills 工作流程使用。
</Note>

## 載入（`skills.load`）

<ParamField path="skills.load.extraDirs" type="string[]">
  要掃描的其他 Skills 目錄，優先順序最低（低於
  內建與外掛 Skills）。路徑展開支援 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  符號連結的 Skills 資料夾可解析至的受信任實際目標目錄，
  即使符號連結位於所設定的根目錄之外亦可。這適用於刻意採用的
  同層儲存庫配置，例如
  `<workspace>/skills/manager -> ~/Projects/manager/skills`。此清單應保持
  精簡——請勿指向 `~` 或 `~/Projects` 等廣泛的根目錄。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  監看 Skills 資料夾，並在 `SKILL.md` 檔案
  變更時重新整理 Skills 快照。涵蓋分組 Skills 根目錄下的巢狀檔案。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skills 監看器事件的防彈跳時間範圍，以毫秒為單位。
</ParamField>

## 安裝（`skills.install`）

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` 可用時，優先使用 Homebrew 安裝程式。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  安裝 Skills 時偏好的 Node 套件管理員。這只會影響 Skills
  安裝——OpenClaw 命令列介面與閘道執行階段需要 Node，因為
  標準狀態儲存區使用 `node:sqlite`。`openclaw setup --node-manager` 和
  `openclaw onboard --node-manager` 接受 `npm`、`pnpm` 或 `bun`；若要使用 Yarn 安裝 Skills，請直接在設定中設置
  `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允許受信任的 `operator.admin` 閘道用戶端安裝透過
  `skills.upload.*` 暫存的私人 zip 封存檔。一般的 ClawHub 安裝不需要
  此設定。
</ParamField>

## 操作者安裝政策（`security.installPolicy`）

當操作者需要受信任的本機命令，依據主機特定政策核准或封鎖
Skills 與外掛安裝時，請使用 `security.installPolicy`。
此政策會在 OpenClaw 暫存來源素材之後、安裝或更新繼續之前執行。
它適用於 ClawHub Skills、已上傳的 Skills、Git／本機
Skills、Skills 相依性安裝程式，以及外掛安裝／更新來源。

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
  啟用由操作者擁有的安裝政策。若啟用時沒有有效的 `exec`
  命令，安裝將採取封閉式失敗。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  選用的目標篩選器。若省略，政策會套用至所有支援的
  目標，避免新的安裝意外採取開放式失敗。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任政策可執行檔的絕對路徑。OpenClaw 不透過
  shell 執行，並會在使用前驗證路徑。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  傳遞於 `command` 之後的靜態引數。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  單次政策決策的最長實際執行時間。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  沒有 stdout 或 stderr 輸出時的最長等待時間，超過後政策將採取
  封閉式失敗。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  政策程序可接受的 stdout 與 stderr 位元組總數上限。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供給政策程序的常值環境變數。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  從 OpenClaw 程序複製至
  政策程序的環境變數名稱。只會傳遞具名變數。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可包含政策可執行檔之目錄的選用允許清單。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  略過命令路徑的擁有權與權限檢查。僅當該
  路徑受其他機制保護時使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允許設定的命令路徑為符號連結。解析後的目標
  仍必須符合其他路徑檢查。直譯器指令碼引數必須
  是直接的一般檔案，不得為符號連結。
</ParamField>

此政策會在 stdin 接收一個 JSON 物件，其中包含 `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
選用的結構化 `source`、結構化 `origin`，以及 `request`。它必須
在 stdout 寫入一個 JSON 物件：`{ "protocolVersion": 1, "decision": "allow" }`
或 `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零
結束碼、逾時、格式錯誤的 JSON、缺少欄位或不支援的通訊協定
版本，都會採取封閉式失敗。

OpenClaw 在一般閘道啟動期間不會執行安裝政策。
當政策已啟用但無法使用時，安裝與更新會採取封閉式失敗。
`openclaw doctor` 執行靜態驗證；`openclaw doctor --deep`
會對設定的命令執行模擬安裝探測。

大量更新會逐一對每個目標套用政策：被封鎖的 Skills 或外掛更新會讓
該目標失敗，但不會停用政策或略過批次中的後續目標。

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
        reason: "此主機不核准本機外掛路徑",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## 內建 Skills 允許清單

<ParamField path="skills.allowBundled" type="string[]">
  僅適用於**內建** Skills 的選用允許清單。設定後，只有清單中的內建
  Skills 符合資格。受管理、代理程式層級和工作區
  Skills 不受影響。
</ParamField>

## 各 Skills 項目（`skills.entries`）

`entries` 下的鍵預設會比對 Skills 的 `name`。若 Skills 定義了
`metadata.openclaw.skillKey`，請改用該鍵。名稱包含連字號時請加上引號
（JSON5 允許使用帶引號的鍵）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  即使 Skills 是內建或已安裝，`false` 仍會將其停用。
  `coding-agent` 內建 Skills 必須明確啟用——請將其設為 `true`，並確認
  `claude`、`codex`、`opencode` 或其他受支援的命令列介面之一已安裝並完成
  驗證。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 Skills 使用的便利欄位。
  支援純文字字串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  為代理程式執行注入的環境變數。只有在程序中尚未設定該
  變數時才會注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  自訂各 Skills 設定欄位的選用容器。
</ParamField>

## 代理程式允許清單（`agents`）

若希望同一部機器／工作區使用相同的 Skills 根目錄，但每個代理程式具有
不同的可見 Skills 集合，請使用代理程式設定。

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
  省略 `agents.list[].skills` 的代理程式所繼承的
  共用基準允許清單。若完全省略，預設不限制
  Skills。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  該代理程式明確的最終 Skills 集合。明確清單會**取代**
  繼承的預設值，而不會合併。設為 `[]` 可讓
  該代理程式不顯示任何 Skills。
</ParamField>

<Warning>
  代理程式 Skills 允許清單是 OpenClaw
  Skills 探索、提示詞、斜線命令探索、沙箱同步及 Skills
  快照的可見性與載入篩選器。它不是 shell 執行階段的授權邊界。若代理程式
  能夠執行主機的 `exec`，該 shell 仍可執行外部用戶端或讀取
  執行使用者可見的主機檔案，包括
  `~/.openclaw/skills/config/mcporter.json` 等 MCP 用戶端登錄。若要實現
  各代理程式的 MCP 隔離，請將 Skills 允許清單與沙箱／作業系統使用者
  隔離搭配使用，拒絕主機 exec 或為其設定嚴格的允許清單，並優先在 MCP 伺服器使用各代理程式專屬的
  認證資訊。
</Warning>

## Workshop（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  當 `true` 時，OpenClaw 可根據持久保留的修正建立待處理提案，
  並可在系統進入閒置狀態後，審查已成功完成且具實質內容的工作。
  這可能會在符合資格的回合後新增一次背景模型執行。當此設定為 `false` 時，
  由使用者提示觸發的技能建立和 `/learn` 仍可運作。
</ParamField>

如需了解資格條件、隱私權、成本、僅限提案的權限及疑難排解，請參閱[自我學習](/zh-TW/tools/self-learning)。

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` 允許代理程式主動套用、拒絕或隔離，而不需要
  額外的核准提示。`pending` 則需要操作員核准。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允許技能工作坊在工作區技能符號連結的實際目標已受
  `skills.load.allowSymlinkTargets` 信任時，透過該符號連結進行寫入。除非產生的提案在套用時
  應修改該共用技能根目錄，否則請保持停用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每個工作區保留的待處理及已隔離提案數量上限（允許範圍：
  1-200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文大小上限，以位元組為單位（允許範圍：1024-200000）。提案
  描述另有 160 位元組的硬性上限，因為描述會出現在探索及清單輸出中。
</ParamField>

如需了解此設定控制的提案生命週期、命令列介面命令、代理程式工具參數和閘道方法，
請參閱[技能工作坊](/zh-TW/tools/skill-workshop)。

## 使用符號連結的技能根目錄

依預設，工作區、專案代理程式、額外目錄及內建技能根目錄皆為
包含範圍邊界。位於 `<workspace>/skills` 下、解析後指向根目錄以外位置的
符號連結技能資料夾會被略過，並記錄一則日誌訊息。

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
會在 realpath 解析後被接受。`extraDirs` 會直接掃描同層級的儲存庫；
`allowSymlinkTargets` 則會為現有配置保留符號連結路徑。

技能工作坊套用功能預設不會透過這些符號連結寫入。若要讓工作坊套用功能
修改已受信任符號連結目標下的技能，請另行選擇啟用：

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

受管理的 `~/.openclaw/skills` 和個人的 `~/.agents/skills` 目錄
已無條件接受技能目錄符號連結（每個技能的
`SKILL.md` 包含範圍仍然適用）— 只有工作區、額外目錄及專案代理程式
（`<workspace>/.agents/skills`）根目錄需要 `allowSymlinkTargets`。

## 沙箱化技能與環境變數

<Warning>
  `skills.entries.<skill>.env` 和 `apiKey` 僅適用於**主機**執行。
  在沙箱內不會產生任何作用 — 依賴 `GEMINI_API_KEY` 的技能會因
  `apiKey not configured` 而失敗，除非另行將該變數提供給沙箱。
</Warning>

使用以下設定將祕密傳入 Docker 沙箱：

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
  擁有 Docker 常駐程式存取權的使用者可以透過 Docker 中繼資料檢查
  `sandbox.docker.env` 的值。若無法接受這種暴露風險，請使用掛載的祕密檔案、
  自訂映像檔或其他傳遞方式。
</Note>

## 載入順序提醒

```text
workspace/skills      （最高）
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
內建技能
skills.load.extraDirs （最低）
```

啟用監看程式時，技能與設定的變更會在下一個新工作階段生效；若監看程式
偵測到變更，則會在代理程式的下一個回合生效。

## 相關內容

<CardGroup cols={2}>
  <Card title="技能參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    技能的定義、載入順序、限制條件及 SKILL.md 格式。
  </Card>
  <Card title="建立技能" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂工作區技能。
  </Card>
  <Card title="技能工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    代理程式草擬技能的提案佇列。
  </Card>
  <Card title="自我學習" href="/zh-TW/tools/self-learning" icon="brain">
    根據已完成工作產生的保守、選擇啟用式提案。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生斜線命令目錄和聊天指示詞。
  </Card>
</CardGroup>
