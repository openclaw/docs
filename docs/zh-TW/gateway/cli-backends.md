---
read_when:
    - 您需要在 API 提供者失敗時有可靠的備援
    - 你正在執行 Codex CLI 或其他本機人工智慧 CLI，並想重複使用它們
    - 你想了解用於 CLI 後端工具存取的 MCP 回送橋接器
summary: CLI 後端：具備選用 MCP 工具橋接的本機 AI CLI 備援
title: CLI 後端
x-i18n:
    generated_at: "2026-05-04T18:23:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 供應商停機、受到速率限制，或暫時行為異常時，將**本機 AI CLI** 作為**純文字備援**執行。這是刻意保守的設計：

- **OpenClaw 工具不會直接注入**，但具備 `bundleMcp: true`
  的後端可以透過 loopback MCP 橋接器接收 gateway 工具。
- 支援它的 CLI 可使用 **JSONL 串流**。
- **支援會話**（因此後續回合可保持一致）。
- 如果 CLI 接受圖片路徑，**可以傳遞圖片**。

這是設計為**安全網**，而不是主要路徑。當你想要「永遠可用」的文字回應，而且不依賴外部 API 時使用它。

如果你想要具備 ACP 會話控制、背景工作、執行緒/對話繫結，以及持久外部編碼會話的完整 harness runtime，請改用
[ACP Agents](/zh-TW/tools/acp-agents)。CLI 後端不是 ACP。

## 適合初學者的快速入門

你可以**不使用任何設定**直接使用 Codex CLI（隨附的 OpenAI plugin
會註冊預設後端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 gateway 在 launchd/systemd 下執行且 PATH 很精簡，只要加入
命令路徑：

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

就這樣。除了 CLI 本身之外，不需要金鑰，也不需要額外的驗證設定。

如果你在 gateway 主機上將隨附的 CLI 後端作為**主要訊息供應商**使用，當你的設定在 model ref 或
`agents.defaults.cliBackends` 下明確引用該後端時，OpenClaw 現在會自動載入擁有該後端的隨附 plugin。

## 作為備援使用

將 CLI 後端加入你的備援清單，使其只在主要模型失敗時執行：

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

- 如果你使用 `agents.defaults.models`（允許清單），也必須把你的 CLI 後端模型包含在其中。
- 如果主要供應商失敗（驗證、速率限制、逾時），OpenClaw 會接著嘗試 CLI 後端。

## 設定概觀

所有 CLI 後端都位於：

```
agents.defaults.cliBackends
```

每個項目都以**供應商 ID** 作為鍵（例如 `codex-cli`、`my-cli`）。
供應商 ID 會成為你的模型參照左側：

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
          serialize: true,
        },
      },
    },
  },
}
```

## 運作方式

1. 根據供應商前綴（`codex-cli/...`）**選取後端**。
2. 使用相同的 OpenClaw prompt + 工作區內容**建立系統提示**。
3. 以會話 ID（若支援）**執行 CLI**，讓歷史保持一致。
   隨附的 `claude-cli` 後端會為每個 OpenClaw 會話保持一個 Claude stdio 程序存活，並透過 stream-json stdin 傳送後續回合。
4. **剖析輸出**（JSON 或純文字）並回傳最終文字。
5. 依後端**持久化會話 ID**，讓後續回合重複使用相同的 CLI 會話。

<Note>
隨附的 Anthropic `claude-cli` 後端已再次受到支援。Anthropic 工作人員
告訴我們，OpenClaw 風格的 Claude CLI 使用方式已再次被允許，因此 OpenClaw 會將
`claude -p` 用法視為此整合的核准用法，除非 Anthropic 發布
新政策。
</Note>

隨附的 OpenAI `codex-cli` 後端會透過 Codex 的 `model_instructions_file` 設定覆寫（`-c
model_instructions_file="..."`）傳遞 OpenClaw 的系統提示。Codex 不提供 Claude 風格的
`--append-system-prompt` 旗標，因此 OpenClaw 會為每個新的 Codex CLI 會話將組裝好的提示寫入
暫存檔。

隨附的 Anthropic `claude-cli` 後端會以兩種方式接收 OpenClaw skills 快照：附加系統提示中的精簡 OpenClaw skills 目錄，以及
透過 `--plugin-dir` 傳入的暫存 Claude Code plugin。該 plugin 僅包含
該 agent/會話符合資格的 skills，因此 Claude Code 的原生 skill
解析器會看到與 OpenClaw 原本會在
提示中公告的相同已篩選集合。Skill env/API key 覆寫仍會由 OpenClaw 套用到該次執行的
子程序環境。

Claude CLI 也有自己的非互動權限模式。OpenClaw 會將該模式對應到
既有的 exec 政策，而不是加入 Claude 專屬設定：當有效請求的 exec 政策為 YOLO（`tools.exec.security: "full"` 且
`tools.exec.ask: "off"`）時，OpenClaw 會加入 `--permission-mode bypassPermissions`。
每個 agent 的 `agents.list[].tools.exec` 設定會覆寫該 agent 的全域 `tools.exec`。
若要強制使用不同的 Claude 模式，請在
`agents.defaults.cliBackends.claude-cli.args` 和相符的 `resumeArgs` 下設定明確的原始後端引數，
例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

隨附的 Anthropic `claude-cli` 後端也會將 OpenClaw `/think` 層級
對應到 Claude Code 原生的 `--effort` 旗標，用於非 off 層級。`minimal` 和
`low` 對應至 `low`，`adaptive` 和 `medium` 對應至 `medium`，而 `high`、
`xhigh` 和 `max` 直接對應。其他 CLI 後端需要其所屬 plugin
宣告等效的 argv mapper，`/think` 才能影響產生的 CLI。

在 OpenClaw 可以使用隨附的 `claude-cli` 後端之前，Claude Code 本身
必須已在同一台主機上登入：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

只有當 `claude` binary 尚未位於 `PATH` 上時，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 會話

- 如果 CLI 支援會話，當 ID 需要插入多個旗標時，請設定 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（預留位置 `{sessionId}`）。
- 如果 CLI 使用具有不同旗標的**resume 子命令**，請設定
  `resumeArgs`（在恢復時取代 `args`），並可選擇設定 `resumeOutput`
  （用於非 JSON resume）。
- `sessionMode`：
  - `always`：永遠傳送會話 ID（若未儲存則使用新的 UUID）。
  - `existing`：只有在先前已儲存時才傳送會話 ID。
  - `none`：永不傳送會話 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"`、
  和 `input: "stdin"`，因此後續回合會在即時 Claude 程序仍作用中時重複使用它。
  Warm stdio 現在是預設值，包括省略 transport 欄位的自訂設定。
  如果 Gateway 重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 會話 ID 恢復。已儲存的會話
  ID 會在 resume 前根據現有可讀取的專案 transcript 進行驗證，
  因此 phantom bindings 會以 `reason=transcript-missing`
  清除，而不是在 `--resume` 下靜默啟動新的 Claude CLI 會話。
- Claude 即時會話保有有界 JSONL 輸出防護。預設允許每回合最多
  8 MiB 和 20,000 原始 JSONL 行。工具密集的 Claude 回合可以透過每個後端的
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  和 `maxTurnLines` 提高上限；OpenClaw 會將這些設定限制在 64 MiB 和 100,000
  行。
- 已儲存的 CLI 會話是供應商擁有的連續性。隱含的每日會話
  重設不會切斷它們；`/reset` 和明確的 `session.reset` 政策仍然
  會切斷。

序列化注意事項：

- `serialize: true` 會讓相同 lane 的執行保持順序。
- 大多數 CLI 會在一個供應商 lane 上序列化。
- 當選取的驗證身分變更時，OpenClaw 會放棄重複使用已儲存的 CLI 會話，
  包括變更的驗證 profile ID、靜態 API key、靜態 token，或 CLI 暴露的 OAuth
  帳號身分。OAuth access 和 refresh token
  輪替不會切斷已儲存的 CLI 會話。如果 CLI 不暴露
  穩定的 OAuth 帳號 ID，OpenClaw 會讓該 CLI 強制執行 resume 權限。

## 來自 claude-cli 會話的備援前置內容

當 `claude-cli` 嘗試故障轉移到
[`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中的非 CLI 候選項時，OpenClaw 會使用從 `~/.claude/projects/` 的 Claude Code 本機
JSONL transcript 擷取的內容前置內容來播種
下一次嘗試。若沒有這個種子，備援
供應商會冷啟動，因為 OpenClaw 自己的會話 transcript 對 `claude-cli` 執行而言是空的。

- 前置內容會優先使用最新的 `/compact` 摘要或 `compact_boundary`
  標記，接著附加最近的邊界後回合，直到字元
  預算為止。邊界前回合會被丟棄，因為摘要已代表
  它們。
- 工具區塊會合併為精簡的 `(tool call: name)` 和
  `(tool result: …)` 提示，以保持 prompt 預算真實。若摘要
  溢出，會標示為 `(truncated)`。
- 同供應商的 `claude-cli` 到 `claude-cli` 備援會依賴 Claude 自己的
  `--resume`，並略過前置內容。
- 種子會重複使用現有的 Claude 會話檔路徑驗證，因此
  無法讀取任意路徑。

## 圖片（傳遞）

如果你的 CLI 接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果設定了 `imageArg`，這些
路徑會作為 CLI 引數傳遞。如果缺少 `imageArg`，OpenClaw 會將
檔案路徑附加到 prompt（路徑注入），這對於會從純路徑自動
載入本機檔案的 CLI 已足夠。

## 輸入 / 輸出

- `output: "json"`（預設）會嘗試剖析 JSON 並擷取文字 + 會話 ID。
- 對於 Gemini CLI JSON 輸出，當 `usage` 缺少或為空時，OpenClaw 會從 `response` 讀取回覆文字，並
  從 `stats` 讀取 usage。
- `output: "jsonl"` 會剖析 JSONL 串流（例如 Codex CLI `--json`），並擷取最終 agent 訊息與存在的會話
  識別碼。
- `output: "text"` 會將 stdout 視為最終回應。

輸入模式：

- `input: "arg"`（預設）會將 prompt 作為最後一個 CLI 引數傳遞。
- `input: "stdin"` 會透過 stdin 傳送 prompt。
- 如果 prompt 很長且設定了 `maxPromptArgChars`，則會使用 stdin。

## 預設值（plugin 擁有）

隨附的 OpenAI plugin 也會為 `codex-cli` 註冊預設值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

隨附的 Google plugin 也會為 `google-gemini-cli` 註冊預設值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

先決條件：本機 Gemini CLI 必須已安裝，並可在 `PATH` 上以
`gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 注意事項：

- 回覆文字會從 JSON `response` 欄位讀取。
- 當 `usage` 不存在或為空時，使用量會退回使用 `stats`。
- `stats.cached` 會正規化為 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 會從
  `stats.input_tokens - stats.cached` 推導輸入 token。

只有在需要時才覆寫（常見情況：絕對 `command` 路徑）。

## Plugin 擁有的預設值

CLI 後端預設值現在是 Plugin 介面的一部分：

- Plugin 使用 `api.registerCliBackend(...)` 註冊它們。
- 後端 `id` 會成為模型參照中的提供者前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫 Plugin 預設值。
- 後端特定的設定清理仍透過選用的
  `normalizeConfig` hook 由 Plugin 擁有。

需要小型提示/訊息相容性 shim 的 Plugin，可以宣告
雙向文字轉換，而不必替換提供者或 CLI 後端：

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

`input` 會重寫傳遞給 CLI 的系統提示與使用者提示。`output`
會在 OpenClaw 處理自己的控制標記與頻道傳遞之前，重寫串流的助理差異與解析後的最終文字。

對於會輸出 Claude Code stream-json 相容 JSONL 的 CLI，請在該後端的設定上設定
`jsonlDialect: "claude-stream-json"`。

## Bundle MCP 疊加

CLI 後端**不會**直接接收 OpenClaw 工具呼叫，但後端可以
透過 `bundleMcp: true` 選擇加入產生的 MCP 設定疊加。

目前的內建行為：

- `claude-cli`：產生嚴格的 MCP 設定檔
- `codex-cli`：針對 `mcp_servers` 的行內設定覆寫；產生的
  OpenClaw loopback 伺服器會標記 Codex 的逐伺服器工具核准模式，
  因此 MCP 呼叫不會因本機核准提示而停滯
- `google-gemini-cli`：產生 Gemini 系統設定檔

啟用 bundle MCP 時，OpenClaw 會：

- 啟動一個 loopback HTTP MCP 伺服器，向 CLI 程序公開 Gateway 工具
- 使用每個工作階段的 token（`OPENCLAW_MCP_TOKEN`）驗證橋接
- 將工具存取範圍限定在目前的工作階段、帳戶與頻道情境
- 載入目前工作區啟用的 bundle-MCP 伺服器
- 將它們與任何現有的後端 MCP 設定/設定形狀合併
- 使用擁有 extension 的後端擁有整合模式重寫啟動設定

如果沒有啟用任何 MCP 伺服器，當後端選擇加入 bundle MCP 時，
OpenClaw 仍會注入嚴格設定，讓背景執行保持隔離。

工作階段範圍的內建 MCP runtime 會快取以在工作階段內重複使用，然後
在閒置 `mcp.sessionIdleTtlMs` 毫秒後收回（預設 10
分鐘；設定為 `0` 可停用）。一次性嵌入式執行，例如驗證探測、
slug 產生，以及 active-memory recall，會在執行結束時請求清理，讓 stdio
子程序與 Streamable HTTP/SSE 串流不會比該次執行活得更久。

## 限制

- **沒有直接的 OpenClaw 工具呼叫。** OpenClaw 不會將工具呼叫注入
  CLI 後端協定。後端只有在選擇加入
  `bundleMcp: true` 時才會看到 Gateway 工具。
- **串流是後端特定的。** 有些後端會串流 JSONL；其他後端會緩衝
  直到結束。
- **結構化輸出**取決於 CLI 的 JSON 格式。
- **Codex CLI 工作階段**會透過文字輸出續接（沒有 JSONL），這比初始
  `--json` 執行更不具結構。OpenClaw 工作階段仍會正常運作。

## 疑難排解

- **找不到 CLI**：將 `command` 設為完整路徑。
- **模型名稱錯誤**：使用 `modelAliases` 將 `provider/model` → CLI 模型。
- **沒有工作階段連續性**：確保已設定 `sessionArg`，且 `sessionMode` 不是
  `none`（Codex CLI 目前無法使用 JSON 輸出續接）。
- **圖片被忽略**：設定 `imageArg`（並確認 CLI 支援檔案路徑）。

## 相關

- [Gateway runbook](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
