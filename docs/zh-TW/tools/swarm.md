---
read_when:
    - 你想要一個 Code Mode 指令碼，將工作分派給多個代理程式
    - 你需要結構化的子項結果、決策關卡或優先完成流水線
    - 你正在啟用或調整 tools.swarm 限制
    - 你想在工作階段儀表板中觀察收集器子項目
sidebarTitle: Swarm
summary: 透過 Code Mode 指令碼協調並行子代理，提供結構化結果、受限的扇出範圍與即時進度
title: 群集
x-i18n:
    generated_at: "2026-07-22T10:51:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c540f068680772775c3ce83840f878e14883d4d3ee035c231f2f5bced1e9f7b8
    source_path: tools/swarm.md
    workflow: 16
---

Swarm 是一種實驗性、選擇性啟用的方式，可從
[程式碼模式](/zh-TW/tools/code-mode)指令碼協調多個子代理程式。使用一般的 JavaScript 或 TypeScript
控制流程，例如 `Promise.all`、`while` 和 `if`，來分派工作、收集
結果並做出決策。

它沒有圖形 DSL，也沒有獨立的工作流程格式。程式本身就是
協調流程。Swarm 為該程式加入可等待的收集器子項、結構化結果、
有界並行處理和進度回報。

## 啟用 Swarm

建議的方式是在 Control UI 中使用 **Settings → Labs → Swarm**。
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

布林值簡寫可啟用或停用此功能，而所有其他值均採用
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
| `enabled`               | `false` | 公開收集器模式的產生選項、`agents_wait`，以及程式碼模式的 `agents.*` 客體 API。                                   |
| `maxConcurrent`         | `8`     | 單一 Swarm 群組中可同時執行的收集器子項數量上限。其他已接受的子項會依 FIFO 順序排入佇列。          |
| `maxChildrenPerGroup`   | `50`    | 單一群組中的作用中收集器子項數量上限。                                                                                  |
| `maxTotalPerGroup`      | `200`   | 一個群組在其存續期間可產生的收集器子項數量上限。這是防止失控產生的最後防線。                            |
| `waitTimeoutSecondsMax` | `600`   | 單次 `agents_wait` 呼叫接受的逾時上限。呼叫的預設值為 30 秒。                                            |
| `defaultAgentId`        | `""`    | 產生作業省略 `agentId` 時使用的目標代理程式。空值會使用提出要求的代理程式。既有的子代理程式允許清單仍適用。 |

數值必須是正整數。OpenClaw 將
`maxConcurrent` 限制為 `1`–`1000`、將 `maxChildrenPerGroup` 限制為 `1`–`10000`、
將 `maxTotalPerGroup` 限制為 `1`–`100000`，並將 `waitTimeoutSecondsMax` 限制為
`1`–`86400`。

你可以使用 `agents.entries.*.tools.swarm`，為單一已設定的代理程式覆寫 Swarm。
個別代理程式物件會合併並覆寫頂層的
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
允許／拒絕政策、提供者規則和沙箱政策都可能移除該工具。
如果指令碼回報 `sessions_spawn` 無法使用，請參閱[程式碼模式啟用方式](/zh-TW/tools/code-mode#activation)和
[子代理程式](/zh-TW/tools/subagents)。

`defaultAgentId` 和每次執行的 `agentId` 值必須指定一個已設定的目標，
且該目標須獲提出要求者的 `subagents.allowAgents` 政策允許。OpenClaw 會拒絕
未知或不允許的目標，而不會回退至其他代理程式。

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

若沒有 `schema`，`agents.run()` 會解析為子項的最終文字。若提供
JSON Schema，則會解析為子項透過
`structured_output` 工具提交的值。失敗、遭終止、逾時或結構描述無效的子項，
會以 `SwarmAgentError` 拒絕該 Promise。請在程式碼模式中從
`API.read("agents.d.ts")` 讀取確切產生的宣告和簡短的協調慣用模式。

使用 `label` 為儀表板和側邊欄中的子項提供易於辨識的名稱。在選項中使用
`phase`，可在該子項開始前立即發布一個階段；若有多個子項屬於同一階段，
則可呼叫 `phase()`。
`log()` 會發布簡短的進度說明。進度呼叫採發送後不等待的方式；
即使 UI 無法使用，也不會延遲指令碼。

### 以結構化結果平行分派

此範例會為每個主題啟動一名研究代理程式、等待全部完成，然後
要求最後一個子項綜整其結構化報告：

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
    agents.run(`審查 ${topic} 路徑。回傳一項發現及相關證據。`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("綜整");
log(`已收集 ${reports.length} 份獨立報告。`);

return await agents.run(
  `協調這些報告並說明其中的歧異：\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` 是分派與彙整的邊界。OpenClaw 會為群組啟動最多
`maxConcurrent` 個子項，並依提交順序將其餘子項排入
佇列。

### 在決策閘門上循環

當每一輪都要決定是否需要下一輪時，請使用有界的 `while`
迴圈：

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
  throw new Error(`經過 ${pass} 輪後閘門仍未開啟：${decision.nextAction}`);
}

return decision;
```

決策迴圈一律必須設定界限。`maxTotalPerGroup` 是最後的安全防線，
不能取代明確的停止條件。

### 處理第一個完成的子項

`agents.run()` 會回傳一般的 Promise，因此 `Promise.race` 可對第一個完成的
程式碼模式子項做出反應。對於呼叫較低階工具的測試框架，
`agents_wait` 提供相同的首次完成邊界：只要至少一個要求的執行作業完成，
或有界逾時到期，就會立即回傳。
如需完整的清空迴圈，請參閱[從其他測試框架使用 Swarm](#use-swarm-from-other-harnesses)。

## 收集器子項的行為方式

收集器子項是一般的隔離子代理程式工作階段，但具有不同的
完成路徑。它們會寫入持久化的收集器結果供父項
等待，而不是宣告結果或將回覆導回父工作階段。

目標代理程式會依下列順序解析：

1. 產生作業或 `agents.run()` 呼叫中的 `agentId`。
2. `tools.swarm.defaultAgentId`。
3. 提出要求的代理程式。

當 Swarm 子項需要較小的工具介面、成本較低的模型或更嚴格的沙箱政策時，
專用的精簡工作代理程式會很有用。OpenClaw 不會提供
內建的 `worker` 代理程式 ID；請先設定一個，再將其指定為預設值。
在該工作代理程式的個別代理程式設定中使用 `tools.swarm: false` 來強化它，
使其可以被產生，但不能從自身的頂層工作階段啟動 Swarm：

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

收集器的核准會採失敗時關閉原則。子項絕不會開啟操作員核准
提示。需要核准的工具動作會遭拒絕，而子項可以
在結果中回報該拒絕，讓指令碼決定下一步該怎麼做。

對於結構化輸出，OpenClaw 會將合成的 `structured_output` 工具加入
子項，並依照提供的 JSON Schema 驗證其承載資料。
無效或缺少的承載資料會收到一次修正提示。如果重試後仍然
未通過驗證，收集器完成結果會保留子項的原始文字、讓
`structured` 維持未設定，並包含 `schemaError`。低階的 `agents_wait`
結果會公開這些欄位，以供明確的復原邏輯使用。

### 子項是葉節點

Swarm 子項預設為葉節點。通用的
`agents.defaults.subagents.maxSpawnDepth` 防護機制會在預設深度
`1` 下，防止子項產生自己的子項。通常的協調慣用模式是
將工作交回父項，而不是從子項產生更多工作：

```javascript
const plan = await agents.run("將此工作規劃為彼此獨立的任務。", {
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
`agents.defaults.subagents.maxSpawnDepth` 選擇性啟用的功能，不建議用於 Swarm。
群組上限、預算和可觀測性均以扁平的收集器群組為前提。

每個子項都有一個許可擁有者。宣告型和互動式子項使用
`agents.defaults.subagents.maxChildrenPerAgent`（預設為 `5`），且不計入
收集器子項。收集器子項僅使用 `maxChildrenPerGroup` 和
`maxTotalPerGroup`；它們不會耗用個別工作階段的子項預算。產生
深度防護機制仍適用於這兩種模式。

取得許可後，超出 `maxConcurrent` 的子項會在其 Swarm
群組內依 FIFO 排入佇列，並巢狀位於全域子代理程式執行通道內。這些並行層會將
工作排入佇列，而不是拒絕工作。超出任一群組上限的收集器產生作業
會遭拒絕，且錯誤中會包含相關的設定鍵。

## 觀察 Swarm

當 Swarm 處於作用中時，在 Control UI 中開啟父工作階段的儀表板。
Swarm 小工具會將每個作用中的收集器群組呈現為每個子項一個圓點，
並顯示已排入佇列、執行中、已完成或失敗狀態。標籤會顯示在圓點的工具提示中，因此簡短且
穩定的標籤能讓較大型的 Swarm 更容易閱讀。

工作階段側邊欄會保留一般的父項／子項樹狀結構。展開父項列，
即可檢查收集器子項或開啟其文字記錄，而不會失去 Swarm
階層結構。

收集器結果在其群組封存前都可供等待。每個
成員都到達其保留期限後，OpenClaw 會將群組的子項
整批封存，讓已完成的 Swarm 不會繼續留在作用中的工作階段樹狀結構中。

## 從其他測試框架使用 Swarm

你可以在不使用 OpenClaw Code Mode 的情況下使用 Swarm。其核心工具不依賴任何執行框架：使用
`sessions_spawn({ collect: true })` 啟動收集器子代理，並透過有界的 `agents_wait`
呼叫取得其結果。

Codex Code Mode 會自動在 `tools.*` 下公開符合資格的動態 OpenClaw 工具。
它不使用 OpenClaw 的 QuickJS 客體 API，也不要求
`tools.codeMode`，但仍必須啟用 `tools.swarm`。Codex 執行框架的
`agents_wait` 呼叫支援完整的 600 秒逾時。請使用以下模式：

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
    throw new Error(launch.error ?? "收集器產生請求未獲接受。");
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

  // 將這個有界視窗輪替至尚未檢查的 ID 之後。
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // 每項結果一完成便立即處理。
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

每次 `agents_wait` 呼叫接受 1–1000 個執行 ID。它會傳回：

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

當任何要求的子代理已完成、至少一個待處理的子代理完成、不再有有效的待處理 ID，或呼叫逾時時，此呼叫會立即傳回。已完成的記錄具有冪等性，因此傳入已完成的執行 ID 會再次傳回其結果。只有建立該收集器的工作階段或其獲授權的父代鏈可以等待該收集器。

這是有界長輪詢，而不是忙碌的狀態迴圈。持續只傳入剩餘的執行 ID，直到 `pending` 為空。收集器模式支援原生 OpenClaw 子代理；它不支援 ACP 執行階段、執行緒繫結、可見工作階段或持久工作階段模式。

## 限制與發展藍圖

Swarm v1 執行一次性收集器子代理；規劃中的 `agents.session()` API
將加入具狀態的多輪工作代理。目前子代理在本機閘道的子代理通道上執行；雲端配置計畫作為明確的產生選項提供。已儲存的工作流程定義與圖形 DSL 不屬於 Swarm 目前的發展方向。

## 相關內容

- [Code Mode](/zh-TW/tools/code-mode)：了解 QuickJS 客體執行階段與啟用規則
- [子代理](/zh-TW/tools/subagents)：了解子代理原則、隔離與工作階段行為
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)：了解各代理的限制
- [工具概覽](/zh-TW/tools)：了解工具設定檔與原則路由
