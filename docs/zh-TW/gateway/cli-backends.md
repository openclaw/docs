---
read_when:
    - 你希望在 API 提供者失效時有可靠的備援方案
    - 您正在執行 Codex CLI 或其他本機人工智慧 CLI，並想重複使用它們
    - 你想了解用於 CLI 後端工具存取的 MCP 回送橋接器
summary: CLI 後端：本機 AI CLI 備援，搭配選用的 MCP 工具橋接
title: CLI 後端
x-i18n:
    generated_at: "2026-05-06T09:09:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 供應商故障、受到速率限制或暫時異常時，將**本機 AI CLI** 作為**純文字備援**執行。這是刻意採取的保守設計：

- **OpenClaw 工具不會直接注入**，但設定 `bundleMcp: true` 的後端
  可以透過 loopback MCP 橋接器接收 gateway 工具。
- 支援它的 CLI 可使用 **JSONL 串流**。
- **支援工作階段**（因此後續回合能保持連貫）。
- **如果 CLI 接受圖片路徑，可以傳入圖片**。

這是作為**安全網**而非主要路徑所設計。當你想要「一定能用」的文字回應，
且不想依賴外部 API 時，請使用它。

如果你想要具備 ACP 工作階段控制、背景任務、執行緒/對話綁定，以及持久外部程式設計工作階段的完整 harness 執行階段，請改用
[ACP Agents](/zh-TW/tools/acp-agents)。CLI 後端不是 ACP。

## 適合初學者的快速開始

你可以**不做任何設定**就使用 Codex CLI（內建 OpenAI Plugin
會註冊預設後端）：

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

如果你的 gateway 在 launchd/systemd 下執行且 PATH 很精簡，只需加入
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

這樣就完成了。除了 CLI 本身以外，不需要金鑰或額外驗證設定。

如果你在 gateway 主機上將內建 CLI 後端作為**主要訊息供應商**使用，
當你的設定在模型參照或 `agents.defaults.cliBackends` 下明確引用該後端時，
OpenClaw 現在會自動載入擁有該後端的內建 Plugin。

## 作為備援使用

將 CLI 後端加入備援清單，讓它只在主要模型失敗時執行：

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
- 如果主要供應商失敗（驗證、速率限制、逾時），OpenClaw 會
  接著嘗試 CLI 後端。

## 設定總覽

所有 CLI 後端都位於：

```
agents.defaults.cliBackends
```

每個項目都以**供應商 id** 作為鍵（例如 `codex-cli`、`my-cli`）。
供應商 id 會成為你的模型參照左側：

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

1. 根據供應商前綴（`codex-cli/...`）**選擇後端**。
2. 使用相同的 OpenClaw 提示 + 工作區情境**建立系統提示**。
3. 以工作階段 id（如果支援）**執行 CLI**，讓歷史記錄保持一致。
   內建 `claude-cli` 後端會為每個 OpenClaw 工作階段保持 Claude stdio 程序存活，
   並透過 stream-json stdin 傳送後續回合。
4. **剖析輸出**（JSON 或純文字）並回傳最終文字。
5. 依後端**保存工作階段 id**，因此後續回合會重用同一個 CLI 工作階段。

<Note>
內建 Anthropic `claude-cli` 後端已重新支援。Anthropic 人員
告訴我們 OpenClaw 風格的 Claude CLI 使用方式已再次被允許，因此除非 Anthropic 發布
新政策，否則 OpenClaw 會將此整合中的 `claude -p` 使用方式視為已獲准。
</Note>

內建 OpenAI `codex-cli` 後端會透過 Codex 的 `model_instructions_file`
設定覆寫（`-c
model_instructions_file="..."`）傳遞 OpenClaw 的系統提示。Codex 不提供 Claude 風格的
`--append-system-prompt` 旗標，因此 OpenClaw 會為每個新的 Codex CLI 工作階段
將組裝好的提示寫入暫存檔。

內建 Anthropic `claude-cli` 後端會以兩種方式接收 OpenClaw Skills 快照：
附加系統提示中的精簡 OpenClaw Skills 目錄，以及
透過 `--plugin-dir` 傳入的暫時 Claude Code Plugin。該 Plugin 只包含
該 agent/工作階段符合資格的 Skills，因此 Claude Code 的原生 skill
解析器會看到與 OpenClaw 原本會在提示中宣告的相同篩選集合。
Skill 環境/API 金鑰覆寫仍會由 OpenClaw 套用到該次執行的
子程序環境。

Claude CLI 也有自己的非互動式權限模式。OpenClaw 會將它
對應到現有的 exec 原則，而不是加入 Claude 專用設定：當
實際要求的 exec 原則是 YOLO（`tools.exec.security: "full"` 且
`tools.exec.ask: "off"`）時，OpenClaw 會加入 `--permission-mode bypassPermissions`。
每個 agent 的 `agents.list[].tools.exec` 設定會覆寫該 agent 的全域 `tools.exec`。
若要強制使用不同的 Claude 模式，請在
`agents.defaults.cliBackends.claude-cli.args` 與相符的 `resumeArgs` 下
設定明確的原始後端參數，例如 `--permission-mode default` 或 `--permission-mode acceptEdits`。

內建 Anthropic `claude-cli` 後端也會將 OpenClaw `/think` 層級
對應到 Claude Code 的原生 `--effort` 旗標（非 off 層級）。`minimal` 和
`low` 會對應到 `low`，`adaptive` 和 `medium` 會對應到 `medium`，而 `high`、
`xhigh` 和 `max` 則會直接對應。其他 CLI 後端需要由擁有它的 Plugin
宣告等效的 argv 對應器，`/think` 才能影響衍生的 CLI。

在 OpenClaw 可以使用內建 `claude-cli` 後端之前，Claude Code 本身
必須已在同一台主機上登入：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

只有在 `claude` 二進位檔尚未位於 `PATH` 上時，才使用 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果 CLI 支援工作階段，請在需要將 ID 插入
  多個旗標時設定 `sessionArg`（例如 `--session-id`）或
  `sessionArgs`（預留位置 `{sessionId}`）。
- 如果 CLI 使用帶有不同旗標的 **resume 子命令**，請設定
  `resumeArgs`（在恢復時取代 `args`），也可視需要設定 `resumeOutput`
  （用於非 JSON 的恢復）。
- `sessionMode`：
  - `always`：一律傳送工作階段 id（若沒有已儲存的 id，則使用新的 UUID）。
  - `existing`：只有在先前已儲存工作階段 id 時才傳送。
  - `none`：永不傳送工作階段 id。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"`、
  和 `input: "stdin"`，因此後續回合會在仍作用中時重用即時 Claude 程序。
  暖 stdio 現在是預設值，包括省略傳輸欄位的自訂設定。
  如果 Gateway 重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 id 恢復。
  已儲存的工作階段 id 會在恢復前，根據現有可讀取的專案 transcript 驗證，
  因此幽靈綁定會以 `reason=transcript-missing` 清除，
  而不是在 `--resume` 下靜默啟動新的 Claude CLI 工作階段。
- Claude 即時工作階段會保留有界 JSONL 輸出防護。預設每回合最多允許
  8 MiB 與 20,000 行原始 JSONL。大量使用工具的 Claude 回合可以
  依後端透過
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  和 `maxTurnLines` 提高限制；OpenClaw 會將這些設定限制在 64 MiB 和 100,000
  行以內。
- 已儲存的 CLI 工作階段是供應商擁有的連續性。隱含的每日工作階段
  重設不會切斷它們；`/reset` 和明確的 `session.reset` 原則仍會
  生效。

序列化注意事項：

- `serialize: true` 會保持同一 lane 的執行有序。
- 大多數 CLI 會在一個供應商 lane 上序列化。
- 當選取的驗證身分變更時，OpenClaw 會捨棄已儲存的 CLI 工作階段重用，
  包括變更的驗證設定檔 id、靜態 API 金鑰、靜態權杖，或 CLI 有揭露時的 OAuth
  帳號身分。OAuth 存取與 refresh token 輪替不會切斷已儲存的 CLI 工作階段。
  如果 CLI 未揭露穩定的 OAuth 帳號 id，OpenClaw 會讓該 CLI 強制執行恢復權限。

## 來自 claude-cli 工作階段的備援前導內容

當 `claude-cli` 嘗試故障轉移到
[`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中的非 CLI 候選項時，OpenClaw 會用從
`~/.claude/projects/` 的 Claude Code 本機 JSONL transcript 擷取的情境前導內容
為下一次嘗試建立種子。沒有這個種子時，備援供應商會冷啟動，因為 OpenClaw 自己的工作階段 transcript
對 `claude-cli` 執行是空的。

- 前導內容會優先採用最新的 `/compact` 摘要或 `compact_boundary`
  標記，然後在字元預算內附加最近的邊界後回合。
  邊界前回合會被捨棄，因為摘要已經代表它們。
- 工具區塊會合併成精簡的 `(tool call: name)` 與
  `(tool result: …)` 提示，以讓提示預算保持可信。若摘要
  溢出，會標記為 `(truncated)`。
- 同供應商的 `claude-cli` 到 `claude-cli` 備援會依賴 Claude 自己的
  `--resume`，並略過前導內容。
- 種子會重用現有的 Claude 工作階段檔案路徑驗證，因此
  無法讀取任意路徑。

## 圖片（傳遞）

如果你的 CLI 接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果設定了 `imageArg`，
這些路徑會作為 CLI 參數傳入。如果缺少 `imageArg`，OpenClaw 會將
檔案路徑附加到提示中（路徑注入），這對於會從純路徑自動
載入本機檔案的 CLI 已足夠。

## 輸入 / 輸出

- `output: "json"`（預設）會嘗試剖析 JSON 並擷取文字 + 工作階段 id。
- 對於 Gemini CLI JSON 輸出，OpenClaw 會在 `usage` 缺少或為空時，從 `response`
  讀取回覆文字並從 `stats` 讀取使用量。
- `output: "jsonl"` 會剖析 JSONL 串流（例如 Codex CLI `--json`）並擷取最終 agent 訊息與
  存在時的工作階段識別碼。
- `output: "text"` 會將 stdout 視為最終回應。

輸入模式：

- `input: "arg"`（預設）會將提示作為最後一個 CLI 參數傳入。
- `input: "stdin"` 會透過 stdin 傳送提示。
- 如果提示很長且已設定 `maxPromptArgChars`，則會使用 stdin。

## 預設值（Plugin 擁有）

內建 OpenAI Plugin 也會為 `codex-cli` 註冊預設值：

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

內建 Google Plugin 也會為 `google-gemini-cli` 註冊預設值：

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

前置條件：本機 Gemini CLI 必須已安裝，且能在
`PATH` 上以 `gemini` 使用（`brew install gemini-cli` 或
`npm install -g @google/gemini-cli`）。

Gemini CLI JSON 注意事項：

- 回覆文字會從 JSON `response` 欄位讀取。
- 當 `usage` 缺少或為空時，用量會回退使用 `stats`。
- `stats.cached` 會正規化為 OpenClaw `cacheRead`。
- 如果缺少 `stats.input`，OpenClaw 會從
  `stats.input_tokens - stats.cached` 推導輸入 token。

僅在需要時覆寫（常見情況：絕對 `command` 路徑）。

## Plugin 擁有的預設值

CLI 後端預設值現在屬於 Plugin 介面的一部分：

- Plugin 會以 `api.registerCliBackend(...)` 註冊它們。
- 後端 `id` 會成為模型參照中的 provider 前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫 Plugin 預設值。
- 後端專屬設定清理仍透過選用的
  `normalizeConfig` hook 由 Plugin 擁有。

需要小型提示詞/訊息相容性 shim 的 Plugin，可以宣告雙向文字轉換，
而不必替換 provider 或 CLI 後端：

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

`input` 會重寫傳給 CLI 的系統提示詞與使用者提示詞。`output`
會在 OpenClaw 處理自己的控制標記與頻道傳送之前，重寫串流的 assistant delta 與解析後的最終文字。

對於會輸出與 Claude Code stream-json 相容 JSONL 的 CLI，請在該後端的設定上設置
`jsonlDialect: "claude-stream-json"`。

## 綁定 MCP 疊加

CLI 後端**不會**直接接收 OpenClaw 工具呼叫，但後端可以
透過 `bundleMcp: true` 選擇啟用產生的 MCP 設定疊加。

目前的綁定行為：

- `claude-cli`：產生嚴格的 MCP 設定檔
- `codex-cli`：針對 `mcp_servers` 的行內設定覆寫；產生的
  OpenClaw 迴路伺服器會標記 Codex 的個別伺服器工具核准模式，
  讓 MCP 呼叫不會卡在本機核准提示上
- `google-gemini-cli`：產生 Gemini 系統設定檔

啟用綁定 MCP 時，OpenClaw 會：

- 生成一個迴路 HTTP MCP 伺服器，向 CLI 行程公開 gateway 工具
- 使用每個 session 專屬 token（`OPENCLAW_MCP_TOKEN`）驗證橋接
- 將工具存取範圍限制在目前的 session、帳戶與頻道情境
- 載入目前工作區已啟用的綁定 MCP 伺服器
- 將它們與任何既有的後端 MCP 設定/settings 形狀合併
- 使用擁有 extension 的後端擁有整合模式重寫啟動設定

如果未啟用任何 MCP 伺服器，當後端選擇啟用綁定 MCP 時，
OpenClaw 仍會注入嚴格設定，讓背景執行保持隔離。

session 範圍的綁定 MCP runtime 會快取以便在 session 內重複使用，然後
在閒置 `mcp.sessionIdleTtlMs` 毫秒後回收（預設 10
分鐘；設為 `0` 可停用）。一次性嵌入式執行，例如驗證探測、
slug 產生與 active-memory recall，會在執行結束時請求清理，讓 stdio
子行程與 Streamable HTTP/SSE 串流不會在該次執行結束後繼續存活。

## 限制

- **沒有直接的 OpenClaw 工具呼叫。** OpenClaw 不會將工具呼叫注入
  CLI 後端協定。只有在後端選擇啟用 `bundleMcp: true` 時，後端才會看到 gateway 工具。
- **串流是後端專屬的。** 有些後端會串流 JSONL；其他後端會緩衝
  直到結束。
- **結構化輸出**取決於 CLI 的 JSON 格式。
- **Codex CLI sessions** 會透過文字輸出恢復（沒有 JSONL），其結構性低於初始的 `--json` 執行。OpenClaw sessions 仍會
  正常運作。

## 疑難排解

- **找不到 CLI**：將 `command` 設為完整路徑。
- **模型名稱錯誤**：使用 `modelAliases` 將 `provider/model` 對應到 CLI 模型。
- **沒有 session 連續性**：確認已設置 `sessionArg` 且 `sessionMode` 不是
  `none`（Codex CLI 目前無法以 JSON 輸出恢復）。
- **圖片被忽略**：設置 `imageArg`（並確認 CLI 支援檔案路徑）。

## 相關內容

- [Gateway runbook](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
