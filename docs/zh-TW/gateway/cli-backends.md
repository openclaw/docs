---
read_when:
    - 當 API 提供者失敗時，你需要可靠的備援方案
    - 您正在執行 Codex CLI 或其他本機 AI CLI，並想要重複使用它們
    - 你想了解用於 CLI 後端工具存取的 MCP 回送橋接器
summary: CLI 後端：具備可選 MCP 工具橋接的本機 AI CLI 備援
title: CLI 後端
x-i18n:
    generated_at: "2026-05-07T13:16:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供者中斷、受到速率限制，或暫時異常時，將**本機 AI CLI** 作為**純文字備援**執行。這是刻意保守的設計：

- **OpenClaw 工具不會直接注入**，但具備 `bundleMcp: true`
  的後端可以透過回送 MCP 橋接接收 gateway 工具。
- 支援 CLI 的 **JSONL 串流**。
- **支援工作階段**（因此後續回合能保持連貫）。
- 如果 CLI 接受影像路徑，**可以傳遞影像**。

這項設計是**安全網**，而不是主要路徑。當你想要「永遠可用」的文字回應，
且不想依賴外部 API 時使用它。

如果你想要完整的 harness 執行階段，包含 ACP 工作階段控制、背景任務、
執行緒/對話繫結，以及持久外部編碼工作階段，請改用
[ACP Agents](/zh-TW/tools/acp-agents)。CLI 後端不是 ACP。

<Tip>
  正在建置新的後端 Plugin？請使用
  [CLI 後端 Plugin](/zh-TW/plugins/cli-backend-plugins)。本頁適用於設定與操作已註冊後端的使用者。
</Tip>

## 適合初學者的快速開始

你可以**不使用任何設定**就使用 Codex CLI（隨附的 OpenAI Plugin
會註冊預設後端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 gateway 在 launchd/systemd 下執行，且 PATH 很精簡，只要加入
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

就是這樣。除了 CLI 本身之外，不需要金鑰，也不需要額外的驗證設定。

如果你在 gateway 主機上使用隨附 CLI 後端作為**主要訊息提供者**，
當你的設定在模型參照或 `agents.defaults.cliBackends` 下明確參照該後端時，
OpenClaw 現在會自動載入擁有該後端的隨附 Plugin。

## 將它作為備援使用

將 CLI 後端加入你的備援清單，讓它只在主要模型失敗時執行：

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

每個項目都以**提供者 id** 為鍵（例如 `codex-cli`、`my-cli`）。
提供者 id 會成為模型參照的左側：

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

1. 根據提供者前綴（`codex-cli/...`）**選取後端**。
2. 使用相同的 OpenClaw 提示詞 + 工作區內容**建構系統提示詞**。
3. 使用工作階段 id（如果支援）**執行 CLI**，讓歷史保持一致。
   隨附的 `claude-cli` 後端會針對每個 OpenClaw 工作階段保持 Claude stdio 程序存活，
   並透過 stream-json stdin 傳送後續回合。
4. **剖析輸出**（JSON 或純文字）並傳回最終文字。
5. 按後端**持久保存工作階段 id**，讓後續回合重複使用同一個 CLI 工作階段。

<Note>
隨附的 Anthropic `claude-cli` 後端已再次受到支援。Anthropic 員工告訴我們，
OpenClaw 風格的 Claude CLI 用法已再次允許，因此除非 Anthropic 發布新政策，
OpenClaw 會將 `claude -p` 用法視為此整合中獲准的用法。
</Note>

隨附的 OpenAI `codex-cli` 後端會透過 Codex 的 `model_instructions_file`
設定覆寫（`-c model_instructions_file="..."`）傳遞 OpenClaw 的系統提示詞。
Codex 不公開 Claude 風格的 `--append-system-prompt` 旗標，因此 OpenClaw
會為每個新的 Codex CLI 工作階段將組合後的提示詞寫入暫存檔。

隨附的 Anthropic `claude-cli` 後端會以兩種方式接收 OpenClaw skills 快照：
附加系統提示詞中的精簡 OpenClaw skills 目錄，以及透過 `--plugin-dir`
傳入的暫存 Claude Code Plugin。該 Plugin 只包含該代理程式/工作階段符合資格的 Skills，
因此 Claude Code 的原生 skill 解析器會看見與 OpenClaw 原本在提示詞中公告的相同篩選集合。
Skill env/API 金鑰覆寫仍由 OpenClaw 套用至該次執行的子程序環境。

Claude CLI 也有自己的非互動式權限模式。OpenClaw 會將它對應到既有的 exec 政策，
而不是新增 Claude 專屬設定：當有效請求的 exec 政策為 YOLO
（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`）時，
OpenClaw 會加入 `--permission-mode bypassPermissions`。各代理程式的
`agents.list[].tools.exec` 設定會覆寫該代理程式的全域 `tools.exec`。
若要強制使用不同的 Claude 模式，請在
`agents.defaults.cliBackends.claude-cli.args` 和相符的 `resumeArgs`
下設定明確的原始後端引數，例如 `--permission-mode default` 或
`--permission-mode acceptEdits`。

隨附的 Anthropic `claude-cli` 後端也會將 OpenClaw `/think` 等級對應到
Claude Code 的原生 `--effort` 旗標，用於非 off 等級。`minimal` 和
`low` 對應到 `low`，`adaptive` 和 `medium` 對應到 `medium`，而 `high`、
`xhigh` 和 `max` 會直接對應。其他 CLI 後端需要其所屬 Plugin 宣告等效的
argv 對應器，`/think` 才能影響產生的 CLI。

在 OpenClaw 可以使用隨附的 `claude-cli` 後端之前，Claude Code 本身必須已在同一台主機登入：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

只有在 `claude` 執行檔尚未位於 `PATH` 上時，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果 CLI 支援工作階段，請在 ID 需要插入多個旗標時設定 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（預留位置 `{sessionId}`）。
- 如果 CLI 使用**resume 子命令**且有不同旗標，請設定
  `resumeArgs`（繼續時取代 `args`），並可選擇設定 `resumeOutput`
  （用於非 JSON 的繼續）。
- `sessionMode`：
  - `always`：一律傳送工作階段 id（如果沒有儲存的 id，則使用新的 UUID）。
  - `existing`：只有先前已儲存工作階段 id 時才傳送。
  - `none`：永不傳送工作階段 id。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"`、
  和 `input: "stdin"`，因此後續回合會在即時 Claude 程序仍作用中時重複使用它。
  現在預設使用溫熱 stdio，也包含省略傳輸欄位的自訂設定。如果 Gateway 重新啟動或閒置程序結束，
  OpenClaw 會從儲存的 Claude 工作階段 id 繼續。儲存的工作階段 id 會先與既有可讀專案轉錄比對驗證再繼續，
  因此幽靈繫結會以 `reason=transcript-missing` 清除，而不是在 `--resume`
  下默默啟動新的 Claude CLI 工作階段。
- Claude 即時工作階段會保留有界 JSONL 輸出防護。預設每回合最多允許 8 MiB
  和 20,000 行原始 JSONL。大量使用工具的 Claude 回合可以按後端透過
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  和 `maxTurnLines` 提高限制；OpenClaw 會將這些設定上限限制在 64 MiB 和 100,000 行。
- 儲存的 CLI 工作階段是由提供者擁有的連續性。隱含的每日工作階段重設不會中斷它們；
  `/reset` 和明確的 `session.reset` 政策仍會中斷。

序列化注意事項：

- `serialize: true` 會讓同一 lane 的執行保持順序。
- 大多數 CLI 會在單一提供者 lane 上序列化。
- 當選取的驗證身分變更時，OpenClaw 會放棄重複使用儲存的 CLI 工作階段，
  包含變更的驗證設定檔 id、靜態 API 金鑰、靜態權杖，或 CLI 公開的 OAuth
  帳戶身分。OAuth 存取與重新整理權杖輪替不會中斷儲存的 CLI 工作階段。
  如果 CLI 不公開穩定的 OAuth 帳戶 id，OpenClaw 會讓該 CLI 強制執行繼續權限。

## 來自 claude-cli 工作階段的備援前導內容

當 `claude-cli` 嘗試依照
[`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 容錯移轉到非 CLI 候選項時，
OpenClaw 會使用從 Claude Code 位於 `~/.claude/projects/` 的本機 JSONL
轉錄擷取的內容前導，作為下一次嘗試的種子。沒有這個種子時，備援提供者會從冷啟動開始，
因為 OpenClaw 自己的工作階段轉錄對 `claude-cli` 執行而言是空的。

- 前導內容會優先使用最新的 `/compact` 摘要或 `compact_boundary` 標記，
  然後在字元預算內附加最近的邊界後回合。邊界前回合會被捨棄，因為摘要已代表它們。
- 工具區塊會合併成精簡的 `(tool call: name)` 和 `(tool result: …)` 提示，
  以誠實維持提示詞預算。如果摘要溢出，會標示為 `(truncated)`。
- 同提供者的 `claude-cli` 到 `claude-cli` 備援會依賴 Claude 自己的
  `--resume` 並略過前導內容。
- 種子會重複使用既有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 影像（傳遞）

如果你的 CLI 接受影像路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 影像寫入暫存檔。如果設定了 `imageArg`，
這些路徑會作為 CLI 引數傳遞。如果缺少 `imageArg`，OpenClaw 會將檔案路徑附加到提示詞
（路徑注入），這對於會從純路徑自動載入本機檔案的 CLI 已經足夠。

## 輸入 / 輸出

- `output: "json"`（預設）會嘗試剖析 JSON，並擷取文字 + 工作階段 id。
- 對於 Gemini CLI JSON 輸出，當 `usage` 缺少或為空時，OpenClaw 會從 `response`
  讀取回覆文字，並從 `stats` 讀取用量。
- `output: "jsonl"` 會剖析 JSONL 串流（例如 Codex CLI `--json`），並擷取最終代理程式訊息以及存在時的工作階段識別碼。
- `output: "text"` 會將 stdout 視為最終回應。

輸入模式：

- `input: "arg"`（預設）會將提示詞作為最後一個 CLI 引數傳遞。
- `input: "stdin"` 會透過 stdin 傳送提示詞。
- 如果提示詞非常長且已設定 `maxPromptArgChars`，則會使用 stdin。

## 預設值（Plugin 擁有）

隨附的 OpenAI Plugin 也會為 `codex-cli` 註冊預設值：

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

Prerequisite: the local Gemini CLI must be installed and available as
`gemini` on `PATH` (`brew install gemini-cli` or
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notes:

- Reply text is read from the JSON `response` field.
- Usage falls back to `stats` when `usage` is absent or empty.
- `stats.cached` is normalized into OpenClaw `cacheRead`.
- If `stats.input` is missing, OpenClaw derives input tokens from
  `stats.input_tokens - stats.cached`.

Override only if needed (common: absolute `command` path).

## Plugin-owned defaults

CLI backend defaults are now part of the plugin surface:

- Plugins register them with `api.registerCliBackend(...)`.
- The backend `id` becomes the provider prefix in model refs.
- User config in `agents.defaults.cliBackends.<id>` still overrides the plugin default.
- Backend-specific config cleanup stays plugin-owned through the optional
  `normalizeConfig` hook.

Plugins that need tiny prompt/message compatibility shims can declare
bidirectional text transforms without replacing a provider or CLI backend:

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

`input` rewrites the system prompt and user prompt passed to the CLI. `output`
rewrites streamed assistant deltas and parsed final text before OpenClaw handles
its own control markers and channel delivery.

For CLIs that emit Claude Code stream-json compatible JSONL, set
`jsonlDialect: "claude-stream-json"` on that backend's config.

## Bundle MCP overlays

CLI backends do **not** receive OpenClaw tool calls directly, but a backend can
opt into a generated MCP config overlay with `bundleMcp: true`.

Current bundled behavior:

- `claude-cli`: generated strict MCP config file
- `codex-cli`: inline config overrides for `mcp_servers`; the generated
  OpenClaw loopback server is marked with Codex's per-server tool approval mode
  so MCP calls cannot stall on local approval prompts
- `google-gemini-cli`: generated Gemini system settings file

When bundle MCP is enabled, OpenClaw:

- spawns a loopback HTTP MCP server that exposes gateway tools to the CLI process
- authenticates the bridge with a per-session token (`OPENCLAW_MCP_TOKEN`)
- scopes tool access to the current session, account, and channel context
- loads enabled bundle-MCP servers for the current workspace
- merges them with any existing backend MCP config/settings shape
- rewrites the launch config using the backend-owned integration mode from the owning extension

If no MCP servers are enabled, OpenClaw still injects a strict config when a
backend opts into bundle MCP so background runs stay isolated.

Session-scoped bundled MCP runtimes are cached for reuse within a session, then
reaped after `mcp.sessionIdleTtlMs` milliseconds of idle time (default 10
minutes; set `0` to disable). One-shot embedded runs such as auth probes,
slug generation, and active-memory recall request cleanup at run end so stdio
children and Streamable HTTP/SSE streams do not outlive the run.

## Limitations

- **No direct OpenClaw tool calls.** OpenClaw does not inject tool calls into
  the CLI backend protocol. Backends only see gateway tools when they opt into
  `bundleMcp: true`.
- **Streaming is backend-specific.** Some backends stream JSONL; others buffer
  until exit.
- **Structured outputs** depend on the CLI's JSON format.
- **Codex CLI sessions** resume via text output (no JSONL), which is less
  structured than the initial `--json` run. OpenClaw sessions still work
  normally.

## Troubleshooting

- **CLI not found**: set `command` to a full path.
- **Wrong model name**: use `modelAliases` to map `provider/model` → CLI model.
- **No session continuity**: ensure `sessionArg` is set and `sessionMode` is not
  `none` (Codex CLI currently cannot resume with JSON output).
- **Images ignored**: set `imageArg` (and verify CLI supports file paths).

## Related

- [Gateway runbook](/zh-TW/gateway)
- [Local models](/zh-TW/gateway/local-models)
