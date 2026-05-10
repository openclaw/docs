---
read_when:
    - 當 API 提供者發生故障時，你需要可靠的備援方案
    - 您正在執行 Codex CLI 或其他本機人工智慧 CLI，並想重複使用它們
    - 你想了解用於 CLI 後端工具存取的 MCP 迴路橋接器
summary: CLI 後端：本機 AI CLI 備援，搭配可選的 MCP 工具橋接
title: CLI 後端
x-i18n:
    generated_at: "2026-05-10T19:33:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供者故障、受到速率限制或暫時行為異常時，將 **本機 AI CLI** 作為**純文字後備方案**執行。這是刻意保守的設計：

- **OpenClaw 工具不會被直接注入**，但使用 `bundleMcp: true`
  的後端可以透過 loopback MCP 橋接器接收 gateway 工具。
- 支援 CLI 的 **JSONL 串流**。
- **支援工作階段**（因此後續回合能保持連貫）。
- 如果 CLI 接受圖片路徑，**可以傳遞圖片**。

這被設計為**安全網**，而不是主要路徑。當你想要「永遠可用」的文字回覆，且不依賴外部 API 時使用它。

如果你想要具備 ACP 工作階段控制、背景任務、執行緒/對話綁定，以及持久外部編碼工作階段的完整 harness runtime，請改用
[ACP Agents](/zh-TW/tools/acp-agents)。CLI 後端不是 ACP。

<Tip>
  正在建置新的後端 Plugin？請使用
  [CLI 後端 Plugin](/zh-TW/plugins/cli-backend-plugins)。本頁是給正在設定與操作已註冊後端的使用者。
</Tip>

## 適合初學者的快速開始

你可以**不使用任何設定**就使用 Codex CLI（內建的 OpenAI Plugin
會註冊預設後端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 gateway 在 launchd/systemd 下執行且 PATH 很精簡，只需加入命令路徑：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

就是這樣。除了 CLI 本身之外，不需要金鑰或額外的驗證設定。

如果你在 gateway 主機上將內建 CLI 後端作為**主要訊息提供者**使用，當你的設定在模型參照或
`agents.defaults.cliBackends` 下明確參照該後端時，OpenClaw 現在會自動載入擁有該後端的內建 Plugin。

## 作為後備方案使用

將 CLI 後端加入你的後備清單，讓它只在主要模型失敗時執行：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

注意事項：

- 如果你使用 `agents.defaults.models`（允許清單），也必須在其中包含你的 CLI 後端模型。
- 如果主要提供者失敗（驗證、速率限制、逾時），OpenClaw 會接著嘗試 CLI 後端。

## 設定概覽

所有 CLI 後端都位於：

```
agents.defaults.cliBackends
```

每個項目都以**提供者 ID** 作為鍵（例如 `codex-cli`、`my-cli`）。
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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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

1. 根據提供者前綴（`codex-cli/...`）**選取後端**。
2. 使用相同的 OpenClaw 提示 + 工作區內容**建構系統提示**。
3. **使用工作階段 ID 執行 CLI**（如果支援），讓歷史保持一致。
   內建的 `claude-cli` 後端會為每個 OpenClaw 工作階段保持 Claude stdio 程序存活，並透過 stream-json stdin 傳送後續回合。
4. **剖析輸出**（JSON 或純文字）並回傳最終文字。
5. 依後端**持久保存工作階段 ID**，讓後續回合重用相同的 CLI 工作階段。

<Note>
內建的 Anthropic `claude-cli` 後端已重新受到支援。Anthropic 工作人員告訴我們，OpenClaw 風格的 Claude CLI 使用方式已再次被允許，因此除非 Anthropic 發布新政策，OpenClaw 會將此整合中的
`claude -p` 使用方式視為已獲准。
</Note>

內建的 OpenAI `codex-cli` 後端會透過 Codex 的 `model_instructions_file` 設定覆寫（`-c
model_instructions_file="..."`）傳遞 OpenClaw 的系統提示。Codex 未公開 Claude 風格的
`--append-system-prompt` 旗標，因此 OpenClaw 會為每個新的 Codex CLI 工作階段將組裝好的提示寫入暫存檔。

內建的 Anthropic `claude-cli` 後端會以兩種方式接收 OpenClaw Skills 快照：附加系統提示中的精簡 OpenClaw Skills 目錄，以及透過 `--plugin-dir` 傳入的暫存 Claude Code Plugin。該 Plugin 只包含該代理/工作階段符合資格的 Skills，因此 Claude Code 原生 Skills 解析器會看到與 OpenClaw 原本會在提示中宣告的相同篩選集合。Skill 環境/API 金鑰覆寫仍會由 OpenClaw 套用到該次執行的子程序環境。

Claude CLI 也有自己的非互動式權限模式。OpenClaw 會將它對應到現有的執行政策，而不是加入 Claude 專用設定：當有效要求的執行政策為 YOLO（`tools.exec.security: "full"` 且
`tools.exec.ask: "off"`）時，OpenClaw 會加入 `--permission-mode bypassPermissions`。
每個代理的 `agents.list[].tools.exec` 設定會覆寫該代理的全域 `tools.exec`。
若要強制使用不同的 Claude 模式，請在
`agents.defaults.cliBackends.claude-cli.args` 和相符的 `resumeArgs` 下設定明確的原始後端引數，例如
`--permission-mode default` 或 `--permission-mode acceptEdits`。

內建的 Anthropic `claude-cli` 後端也會將 OpenClaw `/think` 等級對應到 Claude Code 原生的 `--effort` 旗標（非 off 等級）。`minimal` 和
`low` 對應到 `low`，`adaptive` 和 `medium` 對應到 `medium`，而 `high`、
`xhigh` 和 `max` 會直接對應。其他 CLI 後端需要由其擁有的 Plugin 宣告等效的 argv mapper，`/think` 才能影響產生的 CLI。

在 OpenClaw 能使用內建的 `claude-cli` 後端之前，Claude Code 本身必須已經在同一台主機登入：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

只有在 `claude` 執行檔尚未位於 `PATH` 上時，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果 CLI 支援工作階段，請設定 `sessionArg`（例如 `--session-id`），或在 ID 需要插入多個旗標時設定
  `sessionArgs`（placeholder `{sessionId}`）。
- 如果 CLI 使用具有不同旗標的**resume 子命令**，請設定
  `resumeArgs`（恢復時取代 `args`），並可選擇設定 `resumeOutput`
  （用於非 JSON resume）。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存則使用新的 UUID）。
  - `existing`：只有在先前已儲存時才傳送工作階段 ID。
  - `none`：永不傳送工作階段 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"`，
  以及 `input: "stdin"`，因此在其作用中時，後續回合會重用即時 Claude 程序。暖 stdio 現在是預設值，也包含省略傳輸欄位的自訂設定。如果 Gateway 重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 恢復。儲存的工作階段 ID 會在 resume 前對照現有可讀的專案 transcript 驗證，因此幽靈綁定會以 `reason=transcript-missing` 清除，而不是在 `--resume` 下悄悄啟動新的 Claude CLI 工作階段。
- Claude 即時工作階段會保留有界的 JSONL 輸出防護。預設每回合最多允許
  8 MiB 和 20,000 行原始 JSONL。大量使用工具的 Claude 回合可以用
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  和 `maxTurnLines` 在每個後端提高上限；OpenClaw 會將這些設定限制在 64 MiB 和 100,000
  行。
- 儲存的 CLI 工作階段是由提供者擁有的連續性。隱含的每日工作階段重設不會切斷它們；`/reset` 和明確的 `session.reset` 政策仍會切斷。
- 新的 CLI 工作階段通常只會從 OpenClaw 的 Compaction 摘要加上 Compaction 後尾端重新植入。若要復原在 Compaction 前失效的短工作階段，後端可以透過
  `reseedFromRawTranscriptWhenUncompacted: true` 選擇加入。OpenClaw 仍會讓原始 transcript 重新植入保持有界，並將其限制於安全的失效情況，例如缺少 CLI transcript、系統提示/MCP 變更，或工作階段過期重試；驗證設定檔或憑證 epoch 變更永遠不會重新植入原始 transcript 歷史。

序列化注意事項：

- `serialize: true` 會讓同一 lane 的執行保持有序。
- 大多數 CLI 會在一個提供者 lane 上序列化。
- 當選取的驗證身分改變時，OpenClaw 會放棄重用儲存的 CLI 工作階段，包含變更的驗證設定檔 ID、靜態 API 金鑰、靜態 token，或 CLI 有公開時的 OAuth 帳號身分。OAuth 存取與重新整理 token 輪替不會切斷儲存的 CLI 工作階段。如果 CLI 未公開穩定的 OAuth 帳號 ID，OpenClaw 會讓該 CLI 強制執行 resume 權限。

## 來自 claude-cli 工作階段的後備前言

當 `claude-cli` 嘗試切換失敗並落到
[`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中的非 CLI 候選項時，OpenClaw 會使用從 Claude Code 位於 `~/.claude/projects/` 的本機
JSONL transcript 擷取的內容前言來植入下一次嘗試。若沒有這個植入，後備提供者會冷啟動，因為 OpenClaw 自己的工作階段 transcript 對 `claude-cli` 執行而言是空的。

- 前言會優先使用最新的 `/compact` 摘要或 `compact_boundary`
  標記，然後在字元預算內附加最近的邊界後回合。邊界前回合會被丟棄，因為摘要已經代表它們。
- 工具區塊會合併為精簡的 `(tool call: name)` 和
  `(tool result: …)` 提示，以維持誠實的提示預算。若摘要溢出，會標示為
  `(truncated)`。
- 同提供者的 `claude-cli` 到 `claude-cli` 後備會依賴 Claude 自己的
  `--resume` 並跳過前言。
- 植入會重用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片（傳遞）

如果你的 CLI 接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果已設定 `imageArg`，這些路徑會作為 CLI 引數傳遞。如果缺少 `imageArg`，OpenClaw 會將檔案路徑附加到提示中（路徑注入），這對會從純路徑自動載入本機檔案的 CLI 已足夠。

## 輸入 / 輸出

- `output: "json"`（預設）會嘗試剖析 JSON 並擷取文字 + 工作階段 ID。
- 對於 Gemini CLI JSON 輸出，當 `usage` 缺少或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從
  `stats` 讀取用量。
- `output: "jsonl"` 會剖析 JSONL 串流（例如 Codex CLI `--json`），並在存在時擷取最終代理訊息以及工作階段識別碼。
- `output: "text"` 會將 stdout 視為最終回應。

輸入模式：

- `input: "arg"`（預設）會將提示作為最後一個 CLI 引數傳遞。
- `input: "stdin"` 會透過 stdin 傳送提示。
- 如果提示非常長且已設定 `maxPromptArgChars`，則會使用 stdin。

## 預設值（Plugin 擁有）

內建的 OpenAI Plugin 也會為 `codex-cli` 註冊預設值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

隨附的 Google Plugin 也會為 `google-gemini-cli` 註冊預設值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

先決條件：本機 Gemini CLI 必須已安裝，且可在 `PATH` 上以
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 注意事項：

- 回覆文字會從 JSON `response` 欄位讀取。
- 當 `usage` 不存在或為空時，用量會退回使用 `stats`。
- `stats.cached` 會標準化為 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 會從
  `stats.input_tokens - stats.cached` 推導輸入 token。

僅在需要時覆寫（常見情況：絕對 `command` 路徑）。

## Plugin 擁有的預設值

CLI 後端預設值現在是 Plugin 介面的一部分：

- Plugin 會使用 `api.registerCliBackend(...)` 註冊它們。
- 後端 `id` 會成為模型參照中的 provider 前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫 Plugin 預設值。
- 後端特定的設定清理會透過選用的
  `normalizeConfig` hook 維持由 Plugin 擁有。

需要細小提示/訊息相容性 shim 的 Plugin，可以宣告雙向文字轉換，而不必替換 provider 或 CLI 後端：

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

`input` 會重寫傳給 CLI 的系統提示和使用者提示。`output`
會在 OpenClaw 處理自身控制標記和頻道遞送之前，重寫串流助理 delta 和剖析後的最終文字。

對於會發出與 Claude Code stream-json 相容 JSONL 的 CLI，請在該後端設定中設定
`jsonlDialect: "claude-stream-json"`。

## Bundle MCP 覆蓋層

CLI 後端**不會**直接接收 OpenClaw 工具呼叫，但後端可以透過 `bundleMcp: true`
選擇啟用產生的 MCP 設定覆蓋層。

目前的隨附行為：

- `claude-cli`：產生的嚴格 MCP 設定檔
- `codex-cli`：針對 `mcp_servers` 的內嵌設定覆寫；產生的
  OpenClaw loopback 伺服器會標記 Codex 的每伺服器工具核准模式，
  因此 MCP 呼叫不會因本機核准提示而停住
- `google-gemini-cli`：產生的 Gemini 系統設定檔

啟用 bundle MCP 時，OpenClaw 會：

- 啟動 loopback HTTP MCP 伺服器，向 CLI 程序公開 gateway 工具
- 使用每個 session 的 token（`OPENCLAW_MCP_TOKEN`）驗證橋接
- 將工具存取範圍限定在目前的 session、帳戶和頻道情境
- 載入目前 workspace 已啟用的 bundle-MCP 伺服器
- 將它們與任何既有的後端 MCP 設定/設定形狀合併
- 使用擁有該後端的 extension 所擁有的整合模式，重寫啟動設定

如果未啟用任何 MCP 伺服器，當後端選擇啟用 bundle MCP 時，OpenClaw 仍會注入嚴格設定，讓背景執行保持隔離。

session 範圍的隨附 MCP runtime 會快取，以便在 session 內重複使用，接著會在閒置
`mcp.sessionIdleTtlMs` 毫秒後收割（預設 10
分鐘；設為 `0` 可停用）。一次性嵌入執行，例如驗證探測、
slug 產生，以及 active-memory recall，會在執行結束時要求清理，讓 stdio
子程序和 Streamable HTTP/SSE 串流不會比該次執行存活更久。

## 限制

- **沒有直接的 OpenClaw 工具呼叫。** OpenClaw 不會將工具呼叫注入
  CLI 後端協定。後端只有在選擇啟用 `bundleMcp: true` 時，才會看到 gateway 工具。
- **串流是後端特定的。** 有些後端會串流 JSONL；其他則會緩衝直到結束。
- **結構化輸出**取決於 CLI 的 JSON 格式。
- **Codex CLI session**會透過文字輸出續接（沒有 JSONL），其結構性不如初始的 `--json` 執行。OpenClaw session 仍會正常運作。

## 疑難排解

- **找不到 CLI**：將 `command` 設為完整路徑。
- **模型名稱錯誤**：使用 `modelAliases` 將 `provider/model` 對應到 CLI 模型。
- **沒有 session 連續性**：確保已設定 `sessionArg`，且 `sessionMode` 不是
  `none`（Codex CLI 目前無法用 JSON 輸出續接）。
- **圖片被忽略**：設定 `imageArg`（並確認 CLI 支援檔案路徑）。

## 相關

- [Gateway runbook](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
