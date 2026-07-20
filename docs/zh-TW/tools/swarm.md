---
read_when:
    - 你想要一個 Code Mode 指令碼，將工作分派給多個代理程式
    - 你需要結構化的子項結果、決策閘門或首個完成的流水線
    - 你正在啟用或調整 tools.swarm 限制
    - 你想在工作階段儀表板中觀察收集器子項目
sidebarTitle: Swarm
summary: 透過 Code Mode 指令碼協調並行子代理程式，並提供結構化結果、受限的扇出數量與即時進度
title: 群集
x-i18n:
    generated_at: "2026-07-20T11:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00881c10c314eca667dd826584bfc83a4d848d8995e68905e4e53782d61c59cd
    source_path: tools/swarm.md
    workflow: 16
---

Swarm 是一種實驗性的選用功能，可透過
[程式碼模式](/zh-TW/tools/code-mode)指令碼協調許多子代理程式。使用一般的 JavaScript 或 TypeScript
控制流程，例如 `Promise.all`、`while` 和 `if`，以分派工作、收集
結果並做出決策。

它沒有圖形 DSL，也沒有獨立的工作流程格式。程式本身就是
協調機制。Swarm 為該程式加入可等待的收集器子項、結構化結果、
有界並行處理和進度回報。

## 啟用 Swarm

建議的方式是在控制介面中前往 **Settings → Labs → Swarm**。此
切換開關會立即生效，並將 `tools.swarm.enabled` 寫入你的
設定。

你也可以直接在 `openclaw.json` 中啟用 Swarm：

```json5
{
  tools: {
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
      defaultAgentId: "",
    },
  },
}
```

布林值簡寫可啟用或停用此功能，所有其他值則使用其
預設值：

```json5
{
  tools: {
    swarm: true,
  },
}
```

| 欄位                    | 預設值 | 說明                                                                                                                           |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`               | `false` | 公開收集器模式的產生選項、`agents_wait`，以及程式碼模式的 `agents.*` 客體 API。                                  |
| `maxConcurrent`         | `8`     | 一個 Swarm 群組中同時執行的收集器子項數量上限。其他已接受的子項會依 FIFO 順序排入佇列。                                      |
| `maxChildrenPerGroup`   | `50`    | 一個群組中作用中收集器子項的數量上限。                                                                                         |
| `maxTotalPerGroup`      | `200`   | 一個群組在其存續期間可產生的收集器子項數量上限。這是防止失控產生的最後一道防線。                                               |
| `waitTimeoutSecondsMax` | `600`   | 單次 `agents_wait` 呼叫可接受的逾時上限。此呼叫的預設值為 30 秒。                                                        |
| `defaultAgentId`        | `""`    | 產生時省略 `agentId` 所使用的目標代理程式。空值會使用發出請求的代理程式。現有的子代理程式允許清單仍然適用。          |

數值必須是正整數。OpenClaw 會將
`maxConcurrent` 限制在 `1`–`1000`、將 `maxChildrenPerGroup` 限制在 `1`–`10000`、
將 `maxTotalPerGroup` 限制在 `1`–`100000`，並將 `waitTimeoutSecondsMax` 限制在
`1`–`86400`。

你可以使用 `agents.list[].tools.swarm`，為單一已設定的代理程式覆寫 Swarm。
每個代理程式的物件會合併並覆蓋頂層
`tools.swarm` 物件。

## 需求

`agents.run`、`phase` 和 `log` 客體全域變數同時需要 Swarm 和
OpenClaw 程式碼模式：

```json5
{
  tools: {
    codeMode: true,
    swarm: true,
  },
}
```

程式碼模式也必須具有對 `sessions_spawn` 的有效存取權。工具設定檔、
允許／拒絕原則、供應商規則和沙箱原則都可能移除此工具。
如果指令碼回報 `sessions_spawn` 無法使用，請參閱[程式碼模式啟用方式](/zh-TW/tools/code-mode#activation)和
[子代理程式](/zh-TW/tools/subagents)。

`defaultAgentId` 和每次執行的 `agentId` 值，必須指定一個已設定且
發出請求者的 `subagents.allowAgents` 原則允許使用的目標。OpenClaw 會拒絕
未知或不允許的目標，而不會改用其他代理程式。

## 撰寫 Swarm 指令碼

啟用 Swarm 後，程式碼模式會公開此客體 API：

```typescript
type AgentRunOptions = {
  label?: string;
  model?: string;
  thinking?: string;
  fastMode?: boolean | "auto";
  agentId?: string;
  schema?: Record<string, unknown>;
  phase?: string;
};

agents.run(prompt: string, options?: AgentRunOptions & { schema?: undefined }): Promise<string>;
agents.run<T>(prompt: string, options: AgentRunOptions & { schema: Record<string, unknown> }): Promise<T>;
phase(title: string): void;
log(message: string): void;
```

若未使用 `schema`，`agents.run()` 會解析為子項的最終文字。若提供
JSON Schema，則會解析為透過子項的
`structured_output` 工具提交的值。失敗、遭終止、逾時或結構描述無效的子項
會使用 `SwarmAgentError` 拒絕該 Promise。請在程式碼模式內從 `API.read("agents.d.ts")`
讀取確切產生的宣告和簡短的協調慣用法。

使用 `label`，可在儀表板和側邊欄中為子項提供易於辨識的名稱。在選項中使用
`phase`，可在該子項啟動前立即發布階段；若數個子項屬於同一階段，
則可呼叫 `phase()`。
`log()` 會發布簡短的進度附註。進度呼叫是即發即棄；
即使介面無法使用，也不會延遲指令碼。

### 以結構化結果並行分派

此範例會為每個主題啟動一個研究代理程式，等待所有代理程式完成，然後
要求最後一個子項綜合其結構化報告：

```javascript
const reportSchema = {
  type: "object",
  properties: {
    finding: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["finding", "evidence", "confidence"],
  additionalProperties: false,
};

const topics = ["authentication", "storage", "recovery"];
phase("獨立審查");

const reports = await Promise.all(
  topics.map((topic) =>
    agents.run(`審查 ${topic} 路徑。傳回一項發現及其證據。`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("綜合");
log(`已收集 ${reports.length} 份獨立報告。`);

return await agents.run(
  `協調這些報告並說明其中的分歧：\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` 是分派與彙集的邊界。OpenClaw 會為該群組啟動最多
`maxConcurrent` 個子項，其餘子項則依提交
順序排入佇列。

### 在決策關卡中迴圈

當每次處理都會決定是否需要再執行一次時，請使用有界的 `while` 迴圈：

```javascript
const gateSchema = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    reason: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["ready", "reason", "nextAction"],
  additionalProperties: false,
};

let pass = 0;
let decision = { ready: false, reason: "尚未檢查", nextAction: "審查" };

while (!decision.ready && pass < 4) {
  pass += 1;
  phase(`決策輪次 ${pass}`);
  decision = await agents.run(
    `檢查發布證據是否完整。先前的決策：${JSON.stringify(decision)}`,
    {
      label: `release-gate-${pass}`,
      schema: gateSchema,
    },
  );
  log(decision.reason);
}

if (!decision.ready) {
  throw new Error(`經過 ${pass} 輪後關卡仍未開啟：${decision.nextAction}`);
}

return decision;
```

決策迴圈一律必須設定界限。`maxTotalPerGroup` 是最後的安全防線，
不能取代明確的停止條件。

### 處理第一個完成的子項

`agents.run()` 會傳回一般 Promise，因此 `Promise.race` 可對第一個完成的
程式碼模式子項做出反應。對於呼叫較低階工具的測試框架，
`agents_wait` 提供相同的首次完成邊界：只要至少一個要求的執行完成，
或有界逾時到期，就會立即傳回。
完整的排空迴圈請參閱[從其他測試框架使用 Swarm](#use-swarm-from-other-harnesses)。

## 收集器子項的行為方式

收集器子項是一般的隔離子代理程式工作階段，但具有不同的
完成路徑。它們會寫入可供父項等待的持久收集器結果，
而不是宣告回覆或將回覆導回父工作階段。

目標代理程式會依下列順序解析：

1. `agentId`，位於產生或 `agents.run()` 呼叫上。
2. `tools.swarm.defaultAgentId`。
3. 發出請求的代理程式。

當 Swarm 子項需要較精簡的工具介面、較便宜的模型或更嚴格的沙箱原則時，
專用且精簡的工作代理程式會很有用。OpenClaw 不隨附內建的
`worker` 代理程式 ID；將其指定為預設值前，請先設定一個代理程式。
在該工作代理程式的個別設定中使用 `tools.swarm: false` 加以強化，使其
可以被產生，但無法從自己的頂層工作階段啟動 Swarm：

```json5
{
  tools: { swarm: { enabled: true, defaultAgentId: "worker" } },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        subagents: { allowAgents: ["worker"] },
      },
      { id: "worker", tools: { swarm: false } },
    ],
  },
}
```

收集器的核准採取故障關閉。子項絕不會開啟操作員核准
提示。任何需要核准的工具動作都會遭拒絕，而子項可以在其結果中
回報該拒絕，讓指令碼決定下一步。

對於結構化輸出，OpenClaw 會將合成的 `structured_output` 工具加入
子項，並根據提供的 JSON Schema 驗證其承載資料。無效或缺少的承載資料
會獲得一次修正提示。若重試後仍無法通過驗證，收集器完成項會保留子項的
原始文字、讓 `structured` 保持未設定，並包含 `schemaError`。
低階 `agents_wait` 結果會公開這些欄位，以供明確的復原邏輯使用。

### 子項是葉節點

Swarm 子項預設為葉節點。通用的
`agents.defaults.subagents.maxSpawnDepth` 防護機制會在預設深度 `1` 下，防止子項產生
自己的子項。一般的協調慣用法是將工作傳回父項，而不是從子項產生更多工作：

```javascript
const plan = await agents.run("將此工作規劃為多個獨立任務。", {
  schema: {
    type: "object",
    properties: { tasks: { type: "array", items: { type: "string" } } },
    required: ["tasks"],
    additionalProperties: false,
  },
});
return await Promise.all(plan.tasks.map((task) => agents.run(task)));
```

巢狀子代理程式是操作員透過
`agents.defaults.subagents.maxSpawnDepth` 啟用的選用功能，不建議用於 Swarm。
群組上限、預算和可觀測性皆以扁平的收集器群組為前提。

每個子項只有一個准入擁有者。宣告和互動式子項使用
`agents.defaults.subagents.maxChildrenPerAgent`（預設為 `5`），且不會計入
收集器子項。收集器子項僅使用 `maxChildrenPerGroup` 和
`maxTotalPerGroup`；它們不會占用每個工作階段的子項預算。產生
深度防護仍適用於這兩種模式。

准入後，超出 `maxConcurrent` 的子項會在其 Swarm
群組內依 FIFO 順序排入佇列，並巢狀位於全域子代理程式執行通道中。這些並行層會將
工作排入佇列，而不是拒絕工作。超過任一群組上限的收集器產生要求
會遭拒絕，錯誤中會包含相關的設定鍵。

## 觀察 Swarm

當 Swarm 處於作用中時，在控制介面中開啟父工作階段的儀表板。
Swarm 小工具會將每個作用中的收集器群組呈現為每個子項一個圓點，並顯示
已排入佇列、執行中、完成或失敗狀態。標籤會顯示在圓點工具提示中，因此簡短且
穩定的標籤可讓大型 Swarm 更容易閱讀。

工作階段側邊欄會保留一般的父／子樹狀結構。展開父項資料列，
即可檢查收集器子項或開啟其逐字記錄，而不會失去 Swarm
階層結構。

收集器結果在其群組封存前都可繼續等待。當每個
成員都達到其保留期限後，OpenClaw 會將該群組的子項批次封存，
使已完成的 Swarm 不會留在作用中的工作階段樹狀結構中。

## 從其他測試框架使用 Swarm

你可以在不使用 OpenClaw Code Mode 的情況下使用 Swarm。其核心工具不依賴執行框架：使用 `sessions_spawn({ collect: true })` 啟動收集器子代理，並透過有界的 `agents_wait` 呼叫取得其結果。

Codex Code Mode 會自動在 `tools.*` 下公開符合資格的動態 OpenClaw 工具。它不使用 OpenClaw 的 QuickJS 客體 API，也不需要 `tools.codeMode`，但仍必須啟用 `tools.swarm`。Codex 執行框架的 `agents_wait` 呼叫支援完整的 600 秒逾時。請使用以下模式：

```javascript
const tasks = [
  "檢查驗證路徑。",
  "檢查儲存路徑。",
  "檢查復原路徑。",
];

const launches = await Promise.all(
  tasks.map((task, index) =>
    tools.sessions_spawn({
      task,
      collect: true,
      label: `review-${index + 1}`,
    }),
  ),
);

for (const launch of launches) {
  if (launch.status !== "accepted") {
    throw new Error(launch.error ?? "未接受啟動收集器。");
  }
}

const pending = new Set(launches.map((launch) => launch.runId));
const completed = [];

while (pending.size > 0) {
  const ids = [...pending].slice(0, 1000);
  const batch = await tools.agents_wait({
    ids,
    timeoutSeconds: 30,
  });

  // 將這個有界視窗輪替到尚未檢查的識別碼之後。
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // 每個結果一完成就立即處理。
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

每次 `agents_wait` 呼叫可接受 1–1000 個執行識別碼。它會傳回：

```typescript
type AgentsWaitResult = {
  completed: Array<{
    runId: string;
    status: "done" | "failed" | "killed" | "timeout";
    result: string;
    structured?: unknown;
    schemaError?: string;
    sessionKey: string;
    label?: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
  pending: string[];
  errors?: Array<{
    runId: string;
    error: "not_found" | "not_owner";
  }>;
};
```

若任何請求的子代理已完成、至少有一個待處理的子代理完成、不再有有效的待處理識別碼，或呼叫逾時，該呼叫會立即傳回。已完成的記錄具有冪等性，因此傳入已完成的執行識別碼時，會再次傳回其結果。只有啟動它的工作階段或其獲授權的父系鏈可以等待收集器。

這是有界長輪詢，而不是忙碌的狀態迴圈。持續僅傳入剩餘的執行識別碼，直到 `pending` 為空。收集器模式支援原生 OpenClaw 子代理；它不支援 ACP 執行階段、執行緒繫結、可見工作階段或持久工作階段模式。

## 限制與發展藍圖

Swarm v1 執行一次性的收集器子代理；規劃中的 `agents.session()` API 將加入具狀態的多輪工作代理。目前子代理在本機閘道的子代理通道上執行；雲端部署規劃為明確的啟動選項。已儲存的工作流程定義與圖形 DSL 並非 Swarm 目前的發展方向。

## 相關內容

- [Code Mode](/zh-TW/tools/code-mode)：瞭解 QuickJS 客體執行階段與啟用規則
- [子代理](/zh-TW/tools/subagents)：瞭解子代理原則、隔離與工作階段行為
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)：瞭解各代理的限制
- [工具概覽](/zh-TW/tools)：瞭解工具設定檔與原則路由
