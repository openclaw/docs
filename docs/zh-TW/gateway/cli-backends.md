---
read_when:
    - 你想在 API 供應商失敗時有可靠的備援
    - 你正在執行本機 AI 命令列介面，並想要重複使用它們
    - 你想了解用於命令列介面後端工具存取的 MCP 回送橋接器
summary: 命令列介面後端：本機 AI 命令列介面備援，並可選用 MCP 工具橋接
title: 命令列介面後端
x-i18n:
    generated_at: "2026-06-27T19:16:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供者中斷、受到速率限制或暫時異常時，將**本機 AI 命令列介面**作為**純文字備援**來執行。這是刻意保守的設計：

- **OpenClaw 工具不會直接注入**，但設定了 `bundleMcp: true`
  的後端可以透過 loopback MCP 橋接接收閘道工具。
- 支援它的命令列介面可使用 **JSONL 串流**。
- **支援工作階段**（因此後續回合能保持連貫）。
- 如果命令列介面接受圖片路徑，**可以傳遞圖片**。

這是設計為**安全網**，而不是主要路徑。當你想要不依賴外部 API、
「總是可用」的文字回應時使用它。

如果你想要具備 ACP 工作階段控制、背景任務、執行緒/對話繫結，以及持久外部編碼工作階段的完整 harness runtime，請改用
[ACP Agents](/zh-TW/tools/acp-agents)。命令列介面後端不是 ACP。

<Tip>
  正在建置新的後端外掛？請使用
  [命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。本頁面是給正在設定和操作已註冊後端的使用者。
</Tip>

## 適合初學者的快速開始

你可以**不使用任何設定**就使用 Claude Code CLI（內建 Anthropic 外掛會註冊預設後端）：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

當沒有設定明確的代理清單時，`main` 是預設代理 ID。如果你使用多個代理，請將它替換成你想執行的代理 ID。

如果你的閘道在 launchd/systemd 底下執行，且 PATH 很精簡，只要加入命令路徑即可：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

就這樣。不需要金鑰，也不需要命令列介面本身以外的額外驗證設定。

如果你在閘道主機上將內建命令列介面後端作為**主要訊息提供者**使用，當你的設定在模型參照中或 `agents.defaults.cliBackends` 底下明確參照該後端時，OpenClaw 現在會自動載入擁有該後端的內建外掛。

## 作為備援使用

將命令列介面後端加入你的備援清單，讓它只在主要模型失敗時執行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

注意事項：

- 如果你使用 `agents.defaults.models`（允許清單），也必須在其中包含你的命令列介面後端模型。
- 如果主要提供者失敗（驗證、速率限制、逾時），OpenClaw 會接著嘗試命令列介面後端。

## 設定概覽

所有命令列介面後端都位於：

```
agents.defaults.cliBackends
```

每個項目都以**提供者 ID** 作為鍵（例如 `claude-cli`、`my-cli`）。
提供者 ID 會成為模型參照的左側：

```
<provider>/<model>
```

### 設定範例

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 運作方式

1. 根據提供者前綴（`claude-cli/...`）**選取後端**。
2. 使用相同的 OpenClaw 提示 + 工作區內容**建立系統提示**。
3. **執行命令列介面**，並在支援時帶上工作階段 ID，讓歷史保持一致。
   內建 `claude-cli` 後端會為每個 OpenClaw 工作階段保持一個 Claude stdio 行程存活，並透過 stream-json stdin 傳送後續回合。
4. **剖析輸出**（JSON 或純文字）並回傳最終文字。
5. 為每個後端**保存工作階段 ID**，讓後續回合重用相同的命令列介面工作階段。

<Note>
內建 Anthropic `claude-cli` 後端已再次受到支援。Anthropic 人員告訴我們，OpenClaw 風格的 Claude CLI 使用方式再次被允許，因此除非 Anthropic 發布新政策，OpenClaw 會將此整合中的 `claude -p` 使用方式視為已核准。
</Note>

內建 Anthropic `claude-cli` 後端會優先使用 Claude Code 原生 Skills 解析器處理 OpenClaw skills。當目前 skills 快照包含至少一個具有實體化路徑的已選取 skill 時，OpenClaw 會透過 `--plugin-dir` 傳入暫存 Claude Code 外掛，並從附加的系統提示中省略重複的 OpenClaw skills 目錄。如果快照沒有實體化的外掛 skill，OpenClaw 會保留提示目錄作為備援。Skill 環境/API 金鑰覆寫仍會由 OpenClaw 套用到該次執行的子行程環境。

Claude CLI 也有自己的非互動式權限模式。OpenClaw 會將其對應到現有的 exec 政策，而不是新增 Claude 專屬政策設定。對於 OpenClaw 管理的 Claude 即時工作階段，有效的 OpenClaw exec 政策具權威性：YOLO（`tools.exec.security: "full"` 和 `tools.exec.ask: "off"`）會用 `--permission-mode bypassPermissions` 啟動 Claude，而限制性的有效 exec 政策會用 `--permission-mode default` 啟動 Claude。每個代理的 `agents.list[].tools.exec` 設定會覆寫該代理的全域 `tools.exec`。原始 Claude 後端引數仍可包含 `--permission-mode`，但即時 Claude 啟動會正規化該旗標，使其符合有效的 OpenClaw exec 政策。

內建 Anthropic `claude-cli` 後端也會將 OpenClaw `/think` 等級對應到 Claude Code 原生的 `--effort` 旗標，適用於非 off 等級。`minimal` 和 `low` 對應到 `low`，`adaptive` 和 `medium` 對應到 `medium`，而 `high`、`xhigh` 和 `max` 會直接對應。其他命令列介面後端需要由其所屬外掛宣告等效的 argv 對應器，`/think` 才能影響產生的命令列介面。

OpenClaw 使用內建 `claude-cli` 後端之前，Claude Code 本身必須已在同一主機上登入：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安裝需要在持久化的容器 home 內安裝並登入 Claude Code，而不只是主機上。請參閱
[Docker 中的 Claude CLI 後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。

只有在 `claude` 二進位檔尚未位於 `PATH` 上時，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果命令列介面支援工作階段，請在 ID 需要插入單一旗標時設定 `sessionArg`（例如 `--session-id`），或在 ID 需要插入多個旗標時設定 `sessionArgs`（預留位置 `{sessionId}`）。
- 如果命令列介面使用具有不同旗標的**恢復子命令**，請設定 `resumeArgs`（恢復時取代 `args`），並可選擇設定 `resumeOutput`（用於非 JSON 恢復）。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存則使用新的 UUID）。
  - `existing`：只有先前已儲存工作階段 ID 時才傳送。
  - `none`：永不傳送工作階段 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此在即時 Claude 行程仍啟用時，後續回合會重用它。溫熱 stdio 現在是預設值，包括省略 transport 欄位的自訂設定。如果閘道重新啟動或閒置行程結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 恢復。恢復前會針對現有可讀取的專案逐字稿驗證已儲存的工作階段 ID，因此幽靈繫結會以 `reason=transcript-missing` 清除，而不是在 `--resume` 底下默默啟動全新的 Claude CLI 工作階段。
- Claude 即時工作階段保留有界限的 JSONL 輸出防護。預設每回合允許最多 8 MiB 和 20,000 行原始 JSONL。大量使用工具的 Claude 回合可透過每個後端的 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 和 `maxTurnLines` 提高限制；OpenClaw 會將這些設定限制在 64 MiB 和 100,000 行。
- 已儲存的命令列介面工作階段是提供者擁有的連續性。隱含的每日工作階段重設不會切斷它們；`/reset` 和明確的 `session.reset` 政策仍會切斷。
- 新的命令列介面工作階段通常只會從 OpenClaw 的壓縮摘要加上壓縮後尾端重新播種。若要復原在壓縮前被失效的短工作階段，後端可選擇加入 `reseedFromRawTranscriptWhenUncompacted: true`。OpenClaw 仍會保持原始逐字稿重新播種有界，並將其限制於安全的失效情況，例如缺少命令列介面逐字稿、系統提示/MCP 變更，或工作階段過期重試；驗證設定檔或憑證 epoch 變更永遠不會重新播種原始逐字稿歷史。

序列化注意事項：

- `serialize: true` 會保持同一路徑的執行有序。
- 大多數命令列介面會在一個提供者路徑上序列化。
- 當選取的驗證身分變更時，OpenClaw 會停止重用已儲存的命令列介面工作階段，包括變更驗證設定檔 ID、靜態 API 金鑰、靜態權杖，或命令列介面有暴露時的 OAuth 帳號身分。OAuth 存取與重新整理權杖輪替不會切斷已儲存的命令列介面工作階段。如果命令列介面沒有暴露穩定的 OAuth 帳號 ID，OpenClaw 會讓該命令列介面強制執行恢復權限。

## 來自 claude-cli 工作階段的備援前言

當 `claude-cli` 嘗試失敗並轉移到 [`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中的非命令列介面候選項時，OpenClaw 會用從 `~/.claude/projects/` 的 Claude Code 本機 JSONL 逐字稿擷取的內容前言來播種下一次嘗試。若沒有這個播種，備援提供者會冷啟動，因為 OpenClaw 自己的工作階段逐字稿對 `claude-cli` 執行是空的。

- 前言會優先使用最新的 `/compact` 摘要或 `compact_boundary` 標記，然後附加邊界後最近的回合，直到達到字元預算。邊界前的回合會被捨棄，因為摘要已經代表它們。
- 工具區塊會合併為精簡的 `(tool call: name)` 和 `(tool result: …)` 提示，以誠實控管提示預算。若摘要溢出，會標示為 `(truncated)`。
- 同提供者的 `claude-cli` 到 `claude-cli` 備援依賴 Claude 自己的 `--resume`，並跳過前言。
- 播種會重用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片（傳遞）

如果你的命令列介面接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果設定了 `imageArg`，這些路徑會作為命令列介面引數傳遞。如果缺少 `imageArg`，OpenClaw 會將檔案路徑附加到提示中（路徑注入），這對會從純路徑自動載入本機檔案的命令列介面已經足夠。

## 輸入 / 輸出

- `output: "json"`（預設）會嘗試剖析 JSON 並擷取文字 + 工作階段 ID。
- 對於 Gemini CLI JSON 輸出，當 `usage` 缺少或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從 `stats` 讀取使用量。內建 Gemini CLI 預設使用 `stream-json`，但舊的 `--output-format json` 覆寫仍會使用 JSON 剖析器。
- `output: "jsonl"` 會剖析 JSONL 串流，並在存在時擷取最終代理訊息與工作階段識別碼。
- `output: "text"` 會將 stdout 視為最終回應。

輸入模式：

- `input: "arg"`（預設）會將提示作為最後一個命令列介面引數傳入。
- `input: "stdin"` 會透過 stdin 傳送提示。
- 如果提示非常長且已設定 `maxPromptArgChars`，則會使用 stdin。

## 預設值（外掛擁有）

隨附的命令列介面後端預設值與其所屬外掛放在一起。例如，
Anthropic 擁有 `claude-cli`，Google 擁有 `google-gemini-cli`。OpenAI Codex
代理執行會透過 `openai/*` 使用 Codex app-server harness；OpenClaw 不再
註冊隨附的 `codex-cli` 後端。

隨附的 Anthropic 外掛會為 `claude-cli` 註冊預設值：

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

隨附的 Google 外掛也會為 `google-gemini-cli` 註冊預設值：

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

先決條件：本機 Gemini 命令列介面必須已安裝，並且可在 `PATH` 上作為
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini 命令列介面輸出注意事項：

- 預設的 `stream-json` 剖析器會讀取助理 `message` 事件、工具事件、
  最終 `result` 用量，以及致命的 Gemini 錯誤事件。
- 如果你覆寫 Gemini 引數為 `--output-format json`，OpenClaw 會將該
  後端正規化回 `output: "json"`，並從 JSON `response`
  欄位讀取回覆文字。
- 當 `usage` 不存在或為空時，用量會退回使用 `stats`。
- `stats.cached` 會正規化為 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 會從
  `stats.input_tokens - stats.cached` 推導輸入權杖數。

僅在需要時覆寫（常見：絕對 `command` 路徑）。

## 外掛擁有的預設值

命令列介面後端預設值現在是外掛表面的一部分：

- 外掛使用 `api.registerCliBackend(...)` 註冊它們。
- 後端 `id` 會成為模型參照中的提供者前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫外掛預設值。
- 後端專屬設定清理會透過選用的
  `normalizeConfig` hook 保持由外掛擁有。

需要小型提示/訊息相容性 shim 的外掛，可以宣告雙向文字轉換，而不必取代提供者或命令列介面後端：

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` 會重寫傳給命令列介面的系統提示和使用者提示。`output`
會在 OpenClaw 處理自己的控制標記與通道傳送之前，重寫串流的助理增量與剖析出的最終文字。

對於會發出提供者專屬 JSONL 事件的命令列介面，請在該後端的設定上設定 `jsonlDialect`。
支援的方言包括適用於 Claude Code 相容串流的 `claude-stream-json`，
以及適用於 Gemini 命令列介面 `stream-json` 事件的 `gemini-stream-json`。

## 原生壓縮所有權

有些命令列介面後端會執行會壓縮其**自己**轉錄紀錄的代理，因此 OpenClaw 不得
對它們執行防護摘要器 - 這麼做會與後端自己的壓縮相衝突，並可能導致該回合硬性失敗。

`claude-cli` 沒有 harness endpoint - Claude Code 會在內部壓縮 - 因此它會宣告
`ownsNativeCompaction: true`，而 OpenClaw 會從壓縮路徑傳回 no-op。
像 Codex 這樣的原生 harness 工作階段則會繼續路由到它們的 harness 壓縮端點。

因為後端擁有壓縮，以前純粹為了防止 OpenClaw 的防護機制在
claude-cli 工作階段觸發而設定
`contextTokens: 1_000_000` 的臨時做法，**已不再需要** - 這個退出機制取代了它。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

只應為真正擁有自身壓縮的後端宣告 `ownsNativeCompaction`：它必須能在接近其脈絡視窗時可靠限制自己的轉錄紀錄，並持久化可恢復的工作階段（例如 `--resume` / `--session-id`）；否則延後的工作階段可能會持續超出預算。相符的 `agentHarnessId` 工作階段仍會路由到 harness 端點。

## Bundle MCP 覆疊

命令列介面後端**不會**直接接收 OpenClaw 工具呼叫，但後端可以
使用 `bundleMcp: true` 選擇加入產生的 MCP 設定覆疊。

目前隨附行為：

- `claude-cli`：產生的嚴格 MCP 設定檔
- `google-gemini-cli`：產生的 Gemini 系統設定檔

啟用 bundle MCP 時，OpenClaw 會：

- 產生一個 loopback HTTP MCP 伺服器，將閘道工具暴露給命令列介面程序
- 使用每個工作階段專屬權杖（`OPENCLAW_MCP_TOKEN`）驗證橋接器
- 將工具存取範圍限制在目前的工作階段、帳戶與通道脈絡
- 載入目前工作區啟用的 bundle-MCP 伺服器
- 將它們與任何現有的後端 MCP 設定/設定值形狀合併
- 使用所屬 extension 的後端擁有整合模式重寫啟動設定

如果沒有啟用 MCP 伺服器，當後端選擇加入 bundle MCP 時，OpenClaw 仍會注入嚴格設定，
以便背景執行保持隔離。

工作階段範圍的隨附 MCP runtime 會在工作階段內快取以供重複使用，然後在閒置
`mcp.sessionIdleTtlMs` 毫秒後回收（預設 10
分鐘；設定為 `0` 可停用）。一次性的嵌入式執行（例如驗證探測、
slug 產生，以及主動記憶召回請求）會在執行結束時清理，使 stdio
子程序和 Streamable HTTP/SSE 串流不會比該次執行活得更久。

## 重新植入歷史記錄上限

當新的命令列介面工作階段從先前的 OpenClaw 轉錄紀錄植入時（例如在
`session_expired` 重試之後），渲染出的
`<conversation_history>` 區塊會受到上限限制，以避免重新植入提示膨脹。
預設值為 `12288` 個字元（約 3000 個 token）。

Claude 命令列介面後端會自動使用較大的上限，其值衍生自已解析的
Claude 脈絡層級。標準 200K-token Claude 執行會保留較大的轉錄紀錄片段，
而 1M-token Claude 執行會再保留更大的片段；其他命令列介面
後端則維持保守的預設值。

- 此上限只管理重新植入提示中的先前歷史記錄區塊。即時工作階段
  輸出限制會在 `reliability.outputLimits` 下單獨調整
  （請參閱[工作階段](#sessions)）。

## 限制

- **沒有直接的 OpenClaw 工具呼叫。** OpenClaw 不會將工具呼叫注入
  命令列介面後端協定。後端只有在選擇加入
  `bundleMcp: true` 時才會看到閘道工具。
- **串流取決於後端。** 有些後端會串流 JSONL；其他後端會緩衝直到結束。
- **結構化輸出** 取決於命令列介面的 JSON 格式。

## 疑難排解

- **找不到命令列介面**：將 `command` 設為完整路徑。
- **模型名稱錯誤**：使用 `modelAliases` 將 `provider/model` → 命令列介面模型。
- **沒有工作階段連續性**：確保已設定 `sessionArg`，且 `sessionMode` 不是
  `none`。
- **圖片被忽略**：設定 `imageArg`（並確認命令列介面支援檔案路徑）。

## 相關

- [閘道 runbook](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
