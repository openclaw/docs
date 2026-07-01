---
read_when:
    - 設定 Skills 載入、安裝或門控行為
    - 設定每個代理的 Skills 可見性
    - 調整 Skill Workshop 限制或核准政策
sidebarTitle: Skills config
summary: Skills.* 設定結構描述、代理允許清單、工作坊設定，以及沙盒環境變數處理的完整參考。
title: Skills 設定
x-i18n:
    generated_at: "2026-07-01T05:28:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

大多數 Skills 設定位於
`~/.openclaw/openclaw.json` 的 `skills` 底下。代理程式專屬的可見性位於
`agents.defaults.skills` 和 `agents.list[].skills` 底下。

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
  內建圖片生成請使用 `agents.defaults.imageGenerationModel`
  搭配核心 `image_generate` 工具，而不是 `skills.entries`。Skill
  項目僅用於自訂或第三方 Skill 工作流程。
</Note>

## 載入 (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  要掃描的其他 Skill 目錄，具最低優先順序（在內建和外掛
  Skills 之後）。路徑會支援 `~` 展開。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的實際目標目錄；符號連結 Skill 資料夾可以解析到這些目錄，
  即使該符號連結位於設定的根目錄之外也一樣。請將此用於有意設計的
  同層存放庫版面，例如
  `<workspace>/skills/manager -> ~/Projects/manager/skills`。保持此清單
  狹窄 — 不要指向 `~` 或 `~/Projects` 這類廣泛根目錄。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  監看 Skill 資料夾，並在 `SKILL.md` 檔案變更時重新整理 Skills
  快照。涵蓋分組 Skill 根目錄下的巢狀檔案。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 監看器事件的防抖時間窗，以毫秒為單位。
</ParamField>

## 安裝 (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  當 `brew` 可用時，偏好使用 Homebrew 安裝器。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill 安裝的節點套件管理器偏好設定。這只會影響 Skill
  安裝 — 閘道執行階段仍應使用節點（不建議將 Bun 用於
  WhatsApp/Telegram）。針對 npm、pnpm 或 bun，使用
  `openclaw setup --node-manager`；針對由 Yarn 支援的 Skill 安裝，手動設定
  `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允許受信任的 `operator.admin` 閘道用戶端安裝透過 `skills.upload.*`
  暫存的私人 zip 封存檔。一般 ClawHub 安裝不需要此設定。
</ParamField>

## 操作者安裝政策 (`security.installPolicy`)

當操作者需要以受信任的本機命令，根據主機特定政策核准或阻擋 Skill
與外掛安裝時，請使用 `security.installPolicy`。該政策會在 OpenClaw
暫存來源材料之後，以及安裝或更新繼續之前執行。它適用於 ClawHub
Skills、上傳的 Skills、Git/本機 Skills、Skill 相依性安裝器，以及外掛安裝/更新來源。

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
  啟用由操作者擁有的安裝政策。若啟用時沒有有效的 `exec`
  命令，安裝會以關閉狀態失敗。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  選用目標篩選條件。省略時，政策會套用到每個支援的目標，
  因此新的安裝不會意外地失敗開放。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任政策可執行檔的絕對路徑。OpenClaw 會在不使用 shell 的情況下執行它，
  並在使用前驗證路徑。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 之後傳入的靜態引數。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  單一政策決策的最大實際執行時間。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  政策以關閉狀態失敗前，沒有 stdout 或 stderr 輸出的最長時間。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  從政策程序接受的 stdout 和 stderr 合併最大位元組數。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供給政策程序的字面環境變數。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  從 OpenClaw 程序複製到政策程序的環境變數名稱。只會傳遞具名變數。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可包含政策可執行檔的選用目錄允許清單。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  略過命令路徑擁有權與權限檢查。只有當路徑受到其他機制保護時才使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允許設定的命令路徑是符號連結。解析後的目標仍必須滿足其他路徑檢查。
  直譯器指令碼引數必須是直接的一般檔案，而不是符號連結。
</ParamField>

政策會在 stdin 收到一個 JSON 物件，其中包含 `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
選用的結構化 `source`、結構化 `origin` 和 `request`。它必須在 stdout
寫出一個 JSON 物件：`{ "protocolVersion": 1, "decision": "allow" }` 或
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零
結束、逾時、格式錯誤的 JSON、缺少欄位或不支援的協定版本，都會以關閉狀態失敗。

OpenClaw 不會在一般閘道啟動期間執行安裝政策。當政策已啟用但不可用時，
安裝與更新會以關閉狀態失敗。`openclaw doctor` 會執行靜態驗證，而
`openclaw doctor --deep` 會對設定的命令執行合成安裝探測。

大量更新會針對每個目標套用政策：被阻擋的 Skill 或外掛更新會讓該目標失敗，
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
  僅適用於**內建** Skills 的選用允許清單。設定後，只有清單中的內建
  Skills 符合資格。受管理、代理程式層級和工作區 Skills 不受影響。
</ParamField>

## 個別 Skill 項目 (`skills.entries`)

`entries` 底下的鍵預設會比對 Skill `name`。如果某個 Skill 定義了
`metadata.openclaw.skillKey`，請改用該鍵。含連字號的名稱請加上引號
（JSON5 允許加引號的鍵）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  即使 Skill 是內建或已安裝，`false` 也會停用該 Skill。`coding-agent`
  內建 Skill 是選擇啟用 — 將其設為 `true`，並確保已安裝且驗證
  `claude`、`codex`、`opencode` 或其他支援的命令列介面之一。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的 Skills 使用的便利欄位。
  支援純文字字串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  為代理程式執行注入的環境變數。只有當程序中尚未設定該變數時才會注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  用於自訂個別 Skill 設定欄位的選用包。
</ParamField>

## 代理程式允許清單 (`agents`)

當你想要相同機器/工作區 Skill 根目錄，但每個代理程式有不同的可見 Skill
集合時，請使用代理程式設定。

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
  由省略 `agents.list[].skills` 的代理程式繼承的共用基準允許清單。
  完全省略可讓 Skills 預設不受限制。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  該代理程式的明確最終 Skill 集合。明確清單會**取代**繼承的預設值 —
  它們不會合併。設為 `[]` 可不向該代理程式公開任何 Skills。
</ParamField>

<Warning>
  代理程式 Skill 允許清單是 OpenClaw Skill 探索、提示、
  斜線命令探索、沙盒同步和 Skill 快照的可見性與載入篩選器。
  它們不是 shell 執行時的授權邊界。如果代理程式可以執行主機 `exec`，
  該 shell 仍可執行外部用戶端，或讀取執行使用者可見的主機檔案，
  包括 MCP 用戶端登錄，例如 `~/.openclaw/skills/config/mcporter.json`。
  若要進行個別代理程式 MCP 隔離，請將 Skill 允許清單與沙盒/作業系統使用者隔離結合，
  拒絕或嚴格允許主機 exec，並偏好在 MCP 伺服器使用個別代理程式憑證。
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  當為 `true` 時，代理程式可以在成功回合後，根據持久的對話訊號建立待處理提案。
  使用者提示的 Skill 建立一律會透過 Skill Workshop，無論此設定為何。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` 需要操作員核准，代理程式才可主動套用、拒絕或隔離。
  `auto` 允許這些動作不經核准即可執行。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允許 Skill Workshop apply 透過工作區技能符號連結寫入，其實際目標已受
  `skills.load.allowSymlinkTargets` 信任。除非產生的提案套用時應變更該共用技能
  根目錄，否則請保持停用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每個工作區保留的待處理與已隔離提案數量上限。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文大小上限，以位元組為單位。提案描述會硬性限制為
  160 位元組，因為它們會出現在探索與列表輸出中。
</ParamField>

## 符號連結技能根目錄

預設情況下，工作區、專案代理、額外目錄與內建技能根目錄都是
包含邊界。位於 `<workspace>/skills` 下、解析到根目錄外部的符號連結技能資料夾
會被略過，並記錄一則日誌訊息。

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

Skill Workshop apply 預設不會透過這些符號連結寫入。若要讓
Workshop apply 變更已受信任符號連結目標下的技能，請另行選擇啟用：

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

受管理的 `~/.openclaw/skills` 與個人 `~/.agents/skills` 目錄
已接受技能目錄符號連結（每個技能的 `SKILL.md` 包含邊界仍然
適用）。

## 沙盒化技能與環境變數

<Warning>
  `skills.entries.<skill>.env` 與 `apiKey` 僅適用於**主機**執行。
  在沙盒內它們沒有任何效果；除非另外將變數提供給沙盒，否則依賴
  `GEMINI_API_KEY` 的技能會因 `apiKey not configured` 而失敗。
</Warning>

使用以下設定將祕密傳入 Docker 沙盒：

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
  具有 Docker daemon 存取權的使用者可以透過 Docker metadata 檢視
  `sandbox.docker.env` 值。當這種暴露不可接受時，請使用掛載的祕密檔案、
  自訂映像，或其他傳遞路徑。
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

啟用監看器時，技能與設定變更會在下一個新工作階段生效；或在監看器偵測到變更時，
於下一次代理程式回合生效。

## 相關內容

<CardGroup cols={2}>
  <Card title="Skills 參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    什麼是 Skills、載入順序、門控，以及 SKILL.md 格式。
  </Card>
  <Card title="建立 Skills" href="/zh-TW/tools/creating-skills" icon="hammer">
    編寫自訂工作區技能。
  </Card>
  <Card title="Skill Workshop" href="/zh-TW/tools/skill-workshop" icon="flask">
    代理程式草擬技能的提案佇列。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生斜線命令目錄與聊天指令。
  </Card>
</CardGroup>
