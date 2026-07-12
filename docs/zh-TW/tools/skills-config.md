---
read_when:
    - 設定 Skills 的載入、安裝或條件限制行為
    - 設定每個代理程式的技能可見性
    - 調整 Skills 工作坊限制或核准政策
sidebarTitle: Skills config
summary: skills.* 設定結構描述、代理程式允許清單、工作坊設定及沙箱環境變數處理方式的完整參考。
title: Skills 設定
x-i18n:
    generated_at: "2026-07-11T21:55:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

大多數 Skills 設定都位於 `~/.openclaw/openclaw.json` 的 `skills` 下。代理程式專屬的可見性設定則位於 `agents.defaults.skills` 和 `agents.list[].skills` 下。

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
      approvalPolicy: "pending",
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
  若要使用內建的圖片生成功能，請使用 `agents.defaults.imageGenerationModel` 搭配核心 `image_generate` 工具，而非 `skills.entries`。Skill 項目僅適用於自訂或第三方 Skill 工作流程。
</Note>

## 載入（`skills.load`）

<ParamField path="skills.load.extraDirs" type="string[]">
  要掃描的其他 Skill 目錄，其優先順序最低（低於內建和外掛 Skills）。路徑支援展開 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的實際目標目錄；符號連結的 Skill 資料夾可以解析至這些目錄，即使符號連結位於設定的根目錄之外。此設定適用於刻意安排的同層儲存庫配置，例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`。請嚴格限制此清單，不要指向 `~` 或 `~/Projects` 等廣泛的根目錄。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  監看 Skill 資料夾，並在 `SKILL.md` 檔案變更時重新整理 Skills 快照。涵蓋分組 Skill 根目錄下的巢狀檔案。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 監看器事件的防彈跳時間範圍，單位為毫秒。
</ParamField>

## 安裝（`skills.install`）

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  當 `brew` 可用時，優先使用 Homebrew 安裝程式。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  安裝 Skill 時偏好的 Node 套件管理器。此設定僅影響 Skill 安裝；閘道執行階段仍應使用 Node（不建議將 Bun 用於 WhatsApp/Telegram）。`openclaw setup --node-manager` 和 `openclaw onboard --node-manager` 接受 `npm`、`pnpm` 或 `bun`；若要使用 Yarn 安裝 Skill，請直接在設定中指定 `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允許受信任的 `operator.admin` 閘道用戶端安裝透過 `skills.upload.*` 暫存的私人 zip 封存檔。一般的 ClawHub 安裝不需要此設定。
</ParamField>

## 操作者安裝政策（`security.installPolicy`）

當操作者需要透過受信任的本機命令，依據主機專屬政策核准或封鎖 Skill 與外掛安裝時，請使用 `security.installPolicy`。此政策會在 OpenClaw 暫存來源資料之後、繼續安裝或更新之前執行。它適用於 ClawHub Skills、上傳的 Skills、Git/本機 Skills、Skill 相依項目安裝程式，以及外掛安裝/更新來源。

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
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
  啟用由操作者擁有的安裝政策。若啟用時未提供有效的 `exec` 命令，安裝將以封閉方式失敗。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  選用的目標篩選器。若省略，政策會套用至所有支援的目標，確保新的安裝類型不會意外以開放方式失敗。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任政策可執行檔的絕對路徑。OpenClaw 不透過殼層執行該檔案，並會在使用前驗證路徑。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 之後傳入的靜態引數。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  單次政策決策允許的最長實際執行時間。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  在政策以封閉方式失敗前，沒有標準輸出或標準錯誤輸出的最長允許時間。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  接受政策程序所產生之標準輸出與標準錯誤輸出的合計位元組上限。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供給政策程序的常值環境變數。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  從 OpenClaw 程序複製到政策程序的環境變數名稱。只會傳遞指定名稱的變數。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可以包含政策可執行檔的選用目錄允許清單。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  略過命令路徑的擁有權與權限檢查。僅在該路徑由其他機制保護時使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允許設定的命令路徑為符號連結。解析後的目標仍必須符合其他路徑檢查。直譯器指令碼引數必須是直接的一般檔案，不得為符號連結。
</ParamField>

政策會透過標準輸入接收一個 JSON 物件，其中包含 `protocolVersion: 1`、`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、選用的結構化 `source`、結構化 `origin`，以及 `request`。它必須將一個 JSON 物件寫入標準輸出：`{ "protocolVersion": 1, "decision": "allow" }` 或 `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零結束狀態、逾時、格式錯誤的 JSON、缺少欄位或不支援的通訊協定版本，都會以封閉方式失敗。

OpenClaw 不會在閘道正常啟動期間執行安裝政策。若政策已啟用但無法使用，安裝與更新會以封閉方式失敗。`openclaw doctor` 會執行靜態驗證；`openclaw doctor --deep` 則會針對設定的命令執行合成的安裝探測。

大量更新會對每個目標分別套用政策：遭封鎖的 Skill 或外掛更新只會使該目標失敗，不會停用政策，也不會跳過批次中後續的目標。

標準輸入範例：

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

最小化政策命令：

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## 內建 Skill 允許清單

<ParamField path="skills.allowBundled" type="string[]">
  僅適用於**內建** Skills 的選用允許清單。設定後，只有清單中的內建 Skills 符合使用資格。受管理、代理程式層級和工作區的 Skills 不受影響。
</ParamField>

## 各 Skill 項目（`skills.entries`）

預設情況下，`entries` 下的鍵會與 Skill 的 `name` 相符。如果 Skill 定義了 `metadata.openclaw.skillKey`，請改用該鍵。含連字號的名稱必須加上引號（JSON5 允許加引號的鍵）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  即使 Skill 是內建或已安裝，`false` 仍會停用它。內建的 `coding-agent` Skill 必須選擇啟用；請將其設為 `true`，並確保已安裝且完成驗證 `claude`、`codex`、`opencode` 或其他受支援的命令列介面之一。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  適用於宣告 `metadata.openclaw.primaryEnv` 之 Skills 的便利欄位。支援純文字字串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  為代理程式執行注入的環境變數。僅在程序中尚未設定該變數時注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  用於自訂各 Skill 設定欄位的選用容器。
</ParamField>

## 代理程式允許清單（`agents`）

如果你希望同一台機器/工作區使用相同的 Skill 根目錄，但每個代理程式可見的 Skill 集合不同，請使用代理程式設定。

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

<ParamField path="agents.defaults.skills" type="string[]">
  未設定 `agents.list[].skills` 的代理程式會繼承的共用基準允許清單。若完全省略，預設不會限制 Skills。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  該代理程式明確的最終 Skill 集合。明確清單會**取代**繼承的預設值，而不會合併。設為 `[]` 可讓該代理程式不顯示任何 Skills。
</ParamField>

<Warning>
  代理程式 Skill 允許清單是 OpenClaw Skill 探索、提示詞、斜線命令探索、沙箱同步及 Skill 快照的可見性與載入篩選器。它並非殼層執行階段的授權界線。如果代理程式可以執行主機上的 `exec`，該殼層仍可執行外部用戶端，或讀取執行使用者可見的主機檔案，包括 `~/.openclaw/skills/config/mcporter.json` 等 MCP 用戶端登錄。若要實現各代理程式的 MCP 隔離，請將 Skill 允許清單與沙箱/作業系統使用者隔離搭配使用，拒絕主機 `exec` 或嚴格限制其允許清單，並優先在 MCP 伺服器上使用各代理程式專屬的憑證。
</Warning>

## 工作坊（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  設為 `true` 時，代理程式可在成功完成回合後，根據持久的對話訊號建立待處理提案。無論此設定為何，由使用者提示觸發的技能建立一律會經由技能工作坊進行。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` 要求代理程式發起套用、拒絕或隔離前，必須取得操作人員核准。`auto` 允許執行這些動作而無須核准。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允許技能工作坊在套用時，透過工作區技能符號連結寫入其實際目標，前提是該目標已受 `skills.load.allowSymlinkTargets` 信任。除非產生的提案在套用時應修改該共用技能根目錄，否則請保持停用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每個工作區保留的待處理與已隔離提案數量上限（允許範圍：1–200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案內文大小上限，以位元組計（允許範圍：1024–200000）。提案說明另有 160 位元組的硬性上限，因為它們會出現在探索與清單輸出中。
</ParamField>

請參閱[技能工作坊](/zh-TW/tools/skill-workshop)，以瞭解此設定所控制的提案生命週期、命令列介面命令、代理程式工具參數與閘道方法。

## 使用符號連結的技能根目錄

預設情況下，工作區、專案代理程式、額外目錄與內建技能根目錄都是包含範圍邊界。若 `<workspace>/skills` 下的技能資料夾是符號連結，且解析後指向根目錄外部，系統會略過該資料夾並記錄一則日誌訊息。

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

使用此設定後，`<workspace>/skills/manager -> ~/Projects/manager/skills` 經實際路徑解析後會被接受。`extraDirs` 會直接掃描同層存放庫；`allowSymlinkTargets` 則會為現有配置保留使用符號連結的路徑。

技能工作坊預設不會在套用時透過這些符號連結寫入。若要允許工作坊在套用時修改已受信任之符號連結目標下的技能，請另行選擇啟用：

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

受管理的 `~/.openclaw/skills` 與個人的 `~/.agents/skills` 目錄已無條件接受技能目錄符號連結（仍會套用各技能的 `SKILL.md` 包含範圍限制）——只有工作區、額外目錄與專案代理程式（`<workspace>/.agents/skills`）根目錄需要 `allowSymlinkTargets`。

## 沙箱化技能與環境變數

<Warning>
  `skills.entries.<skill>.env` 與 `apiKey` 僅套用於**主機**執行。在沙箱內它們不會生效——除非另外將變數提供給沙箱，否則依賴 `GEMINI_API_KEY` 的技能將因 `apiKey not configured` 而失敗。
</Warning>

使用以下設定將機密資訊傳入 Docker 沙箱：

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
  擁有 Docker 常駐程式存取權的使用者，可透過 Docker 中繼資料檢查 `sandbox.docker.env` 的值。若無法接受此類暴露風險，請使用掛載的機密檔案、自訂映像檔或其他傳遞途徑。
</Note>

## 載入順序提醒

```text
workspace/skills      (最高)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
內建技能
skills.load.extraDirs (最低)
```

啟用監看程式時，技能與設定的變更會在下一個新工作階段生效；若監看程式偵測到變更，則會在代理程式的下一個回合生效。

## 相關內容

<CardGroup cols={2}>
  <Card title="技能參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    技能的定義、載入順序、條件限制與 SKILL.md 格式。
  </Card>
  <Card title="建立技能" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂工作區技能。
  </Card>
  <Card title="技能工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    用於代理程式草擬技能的提案佇列。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生斜線命令目錄與聊天指令。
  </Card>
</CardGroup>
