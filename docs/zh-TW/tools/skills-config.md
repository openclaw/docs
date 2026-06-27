---
read_when:
    - 設定 Skills 載入、安裝或門控行為
    - 設定每個代理程式的技能可見性
    - 調整 Skill Workshop 限制或核准政策
sidebarTitle: Skills config
summary: skills.* 設定結構描述、代理允許清單、工作坊設定，以及沙箱環境變數處理的完整參考。
title: Skills 設定
x-i18n:
    generated_at: "2026-06-27T20:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

多數 Skills 設定都位於
`~/.openclaw/openclaw.json` 的 `skills` 底下。Agent 專屬可見性位於
`agents.defaults.skills` 與 `agents.list[].skills` 底下。

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
  若要使用內建影像生成，請使用 `agents.defaults.imageGenerationModel`
  加上核心 `image_generate` 工具，而不是 `skills.entries`。Skill
  entries 僅用於自訂或第三方技能工作流程。
</Note>

## 載入 (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  要掃描的額外技能目錄，優先順序最低（在 bundled
  與外掛 Skills 之後）。路徑會展開並支援 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的真實目標目錄；符號連結的技能資料夾可以解析到這些目錄，
  即使符號連結位於設定的根目錄之外。請將它用於刻意安排的 sibling-repo 版面，
  例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`。請讓這份清單
  保持精簡，不要指向像 `~` 或 `~/Projects` 這類廣泛根目錄。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  監看技能資料夾，並在 `SKILL.md` 檔案變更時重新整理 Skills 快照。
  涵蓋 grouped skill roots 底下的巢狀檔案。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  技能監看器事件的 debounce 視窗，以毫秒為單位。
</ParamField>

## 安裝 (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  當 `brew` 可用時，偏好使用 Homebrew 安裝程式。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  技能安裝偏好的 Node 套件管理器。這只會影響技能安裝，Gateway runtime
  仍應使用 Node（不建議將 Bun 用於 WhatsApp/Telegram）。npm、pnpm
  或 bun 請使用 `openclaw setup --node-manager`；Yarn-backed 技能安裝請手動設定 `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允許受信任的 `operator.admin` Gateway 用戶端安裝透過 `skills.upload.*`
  預備的私有 zip 封存檔。一般 ClawHub 安裝不需要此設定。
</ParamField>

## 操作者安裝政策 (`security.installPolicy`)

當 operators 需要受信任的本機命令，以主機特定政策核准或封鎖技能與外掛安裝時，
請使用 `security.installPolicy`。此政策會在 OpenClaw 預備來源素材之後，
以及安裝或更新繼續之前執行。它適用於 ClawHub Skills、uploaded skills、Git/local skills、
技能相依套件安裝程式，以及外掛安裝/更新來源。

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
  啟用 operator-owned 安裝政策。啟用後若沒有有效的 `exec`
  命令，安裝會 fail closed。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  選用的目標篩選器。省略時，政策會套用到每個支援的目標，
  因此新安裝不會非預期地 fail open。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  指向受信任政策可執行檔的絕對路徑。OpenClaw 會在不使用 shell
  的情況下執行它，並在使用前驗證路徑。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 後傳遞的靜態引數。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  單一政策決策的最大 wall-clock 執行時間。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  政策因 stdout 或 stderr 沒有輸出而 fail closed 前的最長時間。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  從政策處理程序接受的 stdout 與 stderr 合計位元組數上限。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供給政策處理程序的字面環境變數。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  從 OpenClaw 處理程序複製到政策處理程序的環境變數名稱。
  只會傳遞具名變數。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可包含政策可執行檔的選用目錄允許清單。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  略過命令路徑擁有權與權限檢查。僅在該路徑受其他機制保護時使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允許設定的命令路徑是符號連結。解析後的目標仍必須符合其他路徑檢查。直譯器腳本引數必須是直接的一般檔案，而不是符號連結。
</ParamField>

該政策會在 stdin 上接收一個 JSON 物件，其中包含 `protocolVersion: 1`、`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、選用的結構化 `source`、結構化 `origin`，以及 `request`。它必須在 stdout 上寫出一個 JSON 物件：`{ "protocolVersion": 1, "decision": "allow" }` 或 `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零結束、逾時、格式錯誤的 JSON、缺少欄位，或不支援的協定版本，都會以預設拒絕方式失敗。

OpenClaw 不會在一般閘道啟動期間執行安裝政策。啟用政策但無法使用時，安裝與更新會以預設拒絕方式失敗。`openclaw doctor` 會執行靜態驗證，而 `openclaw doctor --deep` 會對設定的命令執行合成安裝探測。

批次更新會逐目標套用政策：被封鎖的技能或外掛更新會讓該目標失敗，但不會停用政策，也不會略過批次中的後續目標。

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## 內建技能允許清單

<ParamField path="skills.allowBundled" type="string[]">
  僅適用於**內建**技能的選用允許清單。設定後，只有清單中的內建技能符合資格。受管理、代理程式層級與工作區技能不受影響。
</ParamField>

## 逐技能項目（`skills.entries`）

`entries` 下的鍵預設會比對技能 `name`。如果技能定義了 `metadata.openclaw.skillKey`，請改用該鍵。請用引號包住含連字號的名稱（JSON5 允許加引號的鍵）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` 會停用該技能，即使它是內建或已安裝。`coding-agent` 內建技能採用選擇加入，請將它設為 `true`，並確保已安裝且驗證 `claude`、`codex`、`opencode` 或其他支援的命令列介面之一。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的技能使用的便利欄位。支援純文字字串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  注入代理程式執行的環境變數。只有在變數尚未於程序中設定時才會注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  自訂逐技能設定欄位的選用容器。
</ParamField>

## 代理程式允許清單（`agents`）

當你希望同一台機器/工作區使用相同技能根目錄，但每個代理程式可見的技能集不同時，請使用代理程式設定。

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
  供省略 `agents.list[].skills` 的代理程式繼承的共用基準允許清單。完全省略時，預設不限制技能。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  該代理程式的明確最終技能集。明確清單會**取代**繼承的預設值，不會合併。設為 `[]` 可讓該代理程式不暴露任何技能。
</ParamField>

## Workshop（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  當為 `true` 時，代理程式可在成功回合後，依據持久對話訊號建立待處理提案。由使用者提示的技能建立，一律會透過 Skill Workshop，無論此設定為何。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` 要求操作員先核准，才能執行代理程式發起的套用、拒絕或隔離。`auto` 允許這些動作不經核准。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允許 Skill Workshop 套用時，透過其真實目標已受 `skills.load.allowSymlinkTargets` 信任的工作區技能符號連結進行寫入。除非產生的提案套用應該變更該共用技能根目錄，否則請保持停用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每個工作區保留的待處理和隔離提案數量上限。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文大小上限，以位元組為單位。提案說明會硬性限制在
  160 位元組，因為它們會出現在探索與清單輸出中。
</ParamField>

## 符號連結的技能根目錄

預設情況下，工作區、專案代理、額外目錄和內建技能根目錄都是
包含邊界。位於 `<workspace>/skills` 下的符號連結技能資料夾，
若解析到根目錄之外，會被略過並記錄一則日誌訊息。

若要允許有意設計的符號連結配置，請宣告受信任的目標：

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

使用此設定時，`<workspace>/skills/manager -> ~/Projects/manager/skills` 會在
realpath 解析後被接受。`extraDirs` 會直接掃描同層 repo；
`allowSymlinkTargets` 會為既有配置保留符號連結路徑。

技能工作坊套用預設不會透過這些符號連結寫入。若要讓
工作坊套用可以變更已受信任符號連結目標下的技能，請另外選擇啟用：

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

受管理的 `~/.openclaw/skills` 和個人 `~/.agents/skills` 目錄
已接受技能目錄符號連結（每個技能的 `SKILL.md` 包含規則仍然適用）。

## 沙盒化技能與環境變數

<Warning>
  `skills.entries.<skill>.env` 和 `apiKey` 只適用於**主機**執行。在
  沙盒內它們沒有作用；依賴 `GEMINI_API_KEY` 的技能會因
  `apiKey not configured` 而失敗，除非沙盒另外取得該變數。
</Warning>

使用以下設定將機密傳入 Docker 沙盒：

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
  擁有 Docker daemon 存取權的使用者可以透過 Docker 中繼資料檢查
  `sandbox.docker.env` 值。若不能接受此暴露風險，請使用掛載的
  機密檔案、自訂映像，或其他傳遞路徑。
</Note>

## 載入順序提醒

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

當 watcher 啟用時，對技能和設定的變更會在下一個新工作階段生效；
或在 watcher 偵測到變更時，於下一個代理回合生效。

## 相關

<CardGroup cols={2}>
  <Card title="Skills 參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    什麼是技能、載入順序、門控，以及 SKILL.md 格式。
  </Card>
  <Card title="建立技能" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂工作區技能。
  </Card>
  <Card title="技能工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    代理草擬技能的提案佇列。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生斜線命令目錄與聊天指令。
  </Card>
</CardGroup>
