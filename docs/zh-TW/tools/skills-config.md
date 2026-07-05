---
read_when:
    - 設定 Skills 載入、安裝或門控行為
    - 設定每個代理的技能可見性
    - 調整 Skill Workshop 限制或核准政策
sidebarTitle: Skills config
summary: skills.* 設定結構描述、代理允許清單、工作坊設定，以及沙箱環境變數處理的完整參考。
title: Skills 設定
x-i18n:
    generated_at: "2026-07-05T11:52:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

大部分技能設定位於
`~/.openclaw/openclaw.json` 的 `skills` 底下。代理專屬的可見性位於
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
  若要使用內建影像生成，請使用 `agents.defaults.imageGenerationModel`
  搭配核心 `image_generate` 工具，而不是 `skills.entries`。技能
  項目僅適用於自訂或第三方技能工作流程。
</Note>

## 載入 (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  要掃描的其他技能目錄，優先順序最低（低於內建和外掛技能）。
  路徑會展開，並支援 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的實際目標目錄，允許符號連結的技能資料夾解析到其中，
  即使該符號連結位於設定的根目錄之外。這適用於有意使用的同層
  儲存庫配置，例如
  `<workspace>/skills/manager -> ~/Projects/manager/skills`。請保持此清單
  精準 — 不要指向像 `~` 或 `~/Projects` 這類寬泛根目錄。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  監看技能資料夾，並在 `SKILL.md` 檔案變更時重新整理技能快照。
  涵蓋分組技能根目錄底下的巢狀檔案。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  技能監看器事件的防抖時間窗，單位為毫秒。
</ParamField>

## 安裝 (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  當 `brew` 可用時，優先使用 Homebrew 安裝器。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  技能安裝的節點套件管理器偏好。這只會影響技能
  安裝 — 閘道執行階段仍應使用節點（WhatsApp/Telegram 不建議使用 Bun）。
  `openclaw setup --node-manager` 和
  `openclaw onboard --node-manager` 接受 `npm`、`pnpm` 或 `bun`；若要使用
  Yarn 支援的技能安裝，請直接在設定中設為 `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允許受信任的 `operator.admin` 閘道用戶端安裝透過
  `skills.upload.*` 暫存的私人 zip 封存。一般 ClawHub 安裝不需要
  此設定。
</ParamField>

## 操作者安裝政策 (`security.installPolicy`)

當操作者需要受信任的本機命令，依主機特定政策核准或封鎖技能與外掛
安裝時，請使用 `security.installPolicy`。此政策會在 OpenClaw 暫存來源
材料之後、安裝或更新繼續之前執行。它適用於 ClawHub 技能、上傳的
技能、Git/本機技能、技能相依安裝器，以及外掛安裝/更新來源。

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
  啟用操作者擁有的安裝政策。啟用但沒有有效的 `exec`
  命令時，安裝會保守失敗。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  選用的目標篩選器。省略時，政策會套用到每個支援的
  目標，讓新的安裝不會意外放行。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任政策可執行檔的絕對路徑。OpenClaw 會在不透過
  shell 的情況下執行它，並在使用前驗證路徑。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 之後傳入的靜態引數。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  單一政策決策的最長實際執行時間。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  在政策保守失敗之前，沒有 stdout 或 stderr 輸出的最長時間。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  政策程序可接受的 stdout 和 stderr 合併位元組數上限。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供給政策程序的字面環境變數。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  從 OpenClaw 程序複製到政策程序的環境變數名稱。
  只會傳遞具名變數。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可包含政策可執行檔的選用目錄允許清單。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  略過命令路徑擁有權和權限檢查。只有在該路徑受到其他機制保護時才使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允許設定的命令路徑是符號連結。解析後的目標仍必須通過其他路徑檢查。
  直譯器指令碼引數必須是直接的一般檔案，而不是符號連結。
</ParamField>

政策會在 stdin 接收一個 JSON 物件，其中包含 `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
選用的結構化 `source`、結構化 `origin`，以及 `request`。它必須
在 stdout 寫出一個 JSON 物件：`{ "protocolVersion": 1, "decision": "allow" }`
或 `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零
退出、逾時、JSON 格式錯誤、欄位缺失，或不支援的協定版本都會保守失敗。

OpenClaw 不會在一般閘道啟動期間執行安裝政策。當政策已啟用但不可用時，
安裝和更新會保守失敗。`openclaw doctor` 會執行靜態驗證；
`openclaw doctor --deep` 會針對設定的命令執行合成安裝探測。

批次更新會逐目標套用政策：遭封鎖的技能或外掛更新會讓該目標失敗，
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

## 內建技能允許清單

<ParamField path="skills.allowBundled" type="string[]">
  僅適用於**內建**技能的選用允許清單。設定後，只有清單中的內建
  技能符合資格。受管理、代理層級和工作區技能不受影響。
</ParamField>

## 個別技能項目 (`skills.entries`)

`entries` 底下的鍵預設會符合技能 `name`。如果技能定義了
`metadata.openclaw.skillKey`，請改用該鍵。請將含連字號的名稱加上引號
（JSON5 允許加引號的鍵）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` 會停用該技能，即使它是內建或已安裝也一樣。
  `coding-agent` 內建技能採用選擇加入 — 將它設為 `true`，並確認
  `claude`、`codex`、`opencode` 或其他支援的命令列介面已安裝且已驗證。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  供宣告 `metadata.openclaw.primaryEnv` 的技能使用的便利欄位。
  支援明文字串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  為代理執行注入的環境變數。只有在該變數尚未於程序中設定時才會注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  用於自訂個別技能設定欄位的選用集合。
</ParamField>

## 代理允許清單 (`agents`)

當你希望同一台機器/工作區使用相同的技能根目錄，但每個代理可見的
技能集不同時，請使用代理設定。

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
  由省略 `agents.list[].skills` 的代理繼承的共享基準允許清單。
  完全省略可讓技能預設不受限制。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  該代理的明確最終技能集。明確清單會**取代**繼承的預設值 —
  不會合併。設為 `[]` 可讓該代理不公開任何技能。
</ParamField>

<Warning>
  代理技能允許清單是 OpenClaw 技能探索、提示、斜線命令探索、
  沙盒同步和技能快照的可見性與載入篩選器。它們不是 shell 執行時的
  授權邊界。如果代理可以執行主機 `exec`，該 shell 仍可執行外部用戶端
  或讀取執行使用者可見的主機檔案，包括 MCP 用戶端登錄檔，例如
  `~/.openclaw/skills/config/mcporter.json`。若要進行個別代理的 MCP 隔離，
  請將技能允許清單與沙盒/作業系統使用者隔離結合，拒絕或嚴格允許清單化
  主機 exec，並優先在 MCP 伺服器使用個別代理憑證。
</Warning>

## 工作坊 (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  當為 `true` 時，代理可以在成功輪次後，從持久的對話訊號建立待處理提案。使用者提示的技能建立一律會
  經由技能工作坊，不受此設定影響。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` 要求操作員核准後，代理發起的套用、拒絕或隔離才可執行。
  `auto` 允許這些動作無須核准。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允許技能工作坊套用作業透過工作區技能符號連結寫入，其實際目標已受
  `skills.load.allowSymlinkTargets` 信任。除非產生的提案套用作業應該變更該共用
  技能根目錄，否則請保持停用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每個工作區保留的待處理與隔離提案上限（允許範圍：1-200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案本文大小上限（以位元組計，允許範圍：1024-200000）。提案
  說明另有 160 位元組的硬性上限，因為它們會出現在探索與列表輸出中。
</ParamField>

請參閱[技能工作坊](/zh-TW/tools/skill-workshop)，了解此設定控制的提案生命週期、命令列介面
命令、代理工具參數與閘道方法。

## 符號連結的技能根目錄

預設情況下，工作區、專案代理、額外目錄與內建技能根目錄都是
包含邊界。位於 `<workspace>/skills` 下且解析到根目錄外部的符號連結技能資料夾
會被略過，並記錄一則日誌訊息。

若要允許刻意設計的符號連結配置，請宣告受信任目標：

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

使用此設定時，`<workspace>/skills/manager -> ~/Projects/manager/skills`
會在 realpath 解析後被接受。`extraDirs` 會直接掃描同層 repo；
`allowSymlinkTargets` 會為現有配置保留符號連結路徑。

技能工作坊套用作業預設不會透過這些符號連結寫入。若要讓
工作坊套用作業變更已受信任符號連結目標下的技能，請另外選擇加入：

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
已無條件接受技能目錄符號連結（每個技能的
`SKILL.md` 包含規則仍然適用）— `allowSymlinkTargets` 只需要用於
工作區、額外目錄與專案代理（`<workspace>/.agents/skills`）
根目錄。

## 沙箱化技能與環境變數

<Warning>
  `skills.entries.<skill>.env` 與 `apiKey` 只適用於**主機**執行。
  在沙箱內它們不會生效 — 依賴
  `GEMINI_API_KEY` 的技能會因 `apiKey not configured` 而失敗，除非沙箱
  另外取得該變數。
</Warning>

使用以下方式將祕密傳入 Docker 沙箱：

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
  `sandbox.docker.env` 值。當這種暴露不可接受時，請使用掛載的祕密檔案、自訂映像檔或
  其他傳遞路徑。
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

當 watcher 啟用時，技能與設定的變更會在下一個新工作階段生效；或在 watcher 偵測到
變更時，於下一個代理輪次生效。

## 相關

<CardGroup cols={2}>
  <Card title="技能參考" href="/zh-TW/tools/skills" icon="puzzle-piece">
    技能是什麼、載入順序、閘控與 SKILL.md 格式。
  </Card>
  <Card title="建立技能" href="/zh-TW/tools/creating-skills" icon="hammer">
    撰寫自訂工作區技能。
  </Card>
  <Card title="技能工作坊" href="/zh-TW/tools/skill-workshop" icon="flask">
    代理草擬技能的提案佇列。
  </Card>
  <Card title="斜線命令" href="/zh-TW/tools/slash-commands" icon="terminal">
    原生斜線命令目錄與聊天指令。
  </Card>
</CardGroup>
