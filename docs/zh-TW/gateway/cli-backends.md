---
read_when:
    - 當 API 供應商失敗時，你需要可靠的備援機制
    - 你正在執行本機 AI 命令列介面，並想要重複使用它們
    - 你想了解用於命令列介面後端工具存取的 MCP local loopback 橋接器
summary: 命令列介面後端：具備選用 MCP 工具橋接的本機 AI 命令列介面後援
title: 命令列介面後端
x-i18n:
    generated_at: "2026-07-05T11:16:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3fb55bcb6e6e5aeb1176dea1ce81df394940841f324b5c93ce8a807b134945
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可以在 API 提供者停機、受速率限制或行為異常時，執行本機 AI 命令列介面作為純文字備援。它刻意採取保守設計：

- OpenClaw 工具不會直接注入，但具備 `bundleMcp: true` 的後端可以透過 loopback MCP 橋接接收閘道工具。
- 支援 JSONL 串流，適用於支援該功能的命令列介面。
- 支援工作階段，因此後續回合能保持一致。
- 如果命令列介面接受圖片路徑，圖片會直接傳遞。

請把它當作「永遠可用」文字回應的安全網，而不是主要路徑。若需要具備 ACP 工作階段控制、背景工作、執行緒/對話綁定，以及持久外部編碼工作階段的完整框架執行階段，請改用 [ACP Agents](/zh-TW/tools/acp-agents)；命令列介面後端不是 ACP。

<Tip>
  正在建置新的後端外掛嗎？請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。本頁說明如何設定與操作已註冊的後端。
</Tip>

## 快速開始

內建的 Anthropic 外掛會註冊預設的 `claude-cli` 後端，因此只要已安裝 Claude Code 並登入，無需額外設定即可使用：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未設定明確代理列表時，`main` 是預設代理 ID；否則請換成你自己的代理 ID。

如果閘道在 launchd/systemd 下以最小 `PATH` 執行，請明確指向二進位檔：

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

如果你在閘道主機上使用內建命令列介面後端作為主要訊息提供者，當你的設定在模型參照或 `agents.defaults.cliBackends` 下引用該後端時，OpenClaw 會自動載入擁有該後端的內建外掛。

## 作為備援使用

將命令列介面後端加入備援列表，讓它只在主要模型失敗時執行：

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

如果你將 `agents.defaults.models` 作為允許清單，也請在其中包含你的命令列介面後端模型。當主要提供者失敗（驗證、速率限制、逾時）時，OpenClaw 會接著嘗試命令列介面後端。

## 設定

所有命令列介面後端都位於 `agents.defaults.cliBackends` 下，並以提供者 ID 作為鍵（例如 `claude-cli`、`my-cli`）。提供者 ID 會成為模型參照的左側：`<provider>/<model>`。

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
          // Dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style config-override flag instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed invalidated sessions from
          // bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 運作方式

1. 依提供者前綴選擇後端（`claude-cli/...`）。
2. 使用相同的 OpenClaw 提示詞與工作區內容建立系統提示詞。
3. 使用工作階段 ID（若支援）執行命令列介面，讓歷史保持一致。內建的 `claude-cli` 後端會為每個 OpenClaw 工作階段保持一個 Claude stdio 程序存活，並透過 stream-json stdin 傳送後續回合。
4. 剖析輸出（JSON 或純文字）並回傳最終文字。
5. 依後端持久保存工作階段 ID，讓後續回合重用相同的命令列介面工作階段。

### Claude 命令列介面細節

內建的 `claude-cli` 後端偏好使用 Claude Code 的原生技能解析器。當目前 Skills 快照至少有一個具備實體化路徑的已選 Skills 時，OpenClaw 會透過 `--plugin-dir` 傳入暫存 Claude Code 外掛，並從附加的系統提示詞中省略重複的 OpenClaw Skills 目錄。沒有實體化外掛 Skills 時，OpenClaw 會保留提示詞目錄作為備援。Skills 環境/API 金鑰覆寫仍會套用到該次執行的子程序環境。

Claude 命令列介面有自己的非互動權限模式；OpenClaw 會將它對應到現有執行政策，而不是新增 Claude 專用設定。對於由 OpenClaw 管理的 Claude 即時工作階段，有效執行政策具有權威性：YOLO（`tools.exec.security: "full"` 與 `tools.exec.ask: "off"`）會以 `--permission-mode bypassPermissions` 啟動 Claude，而限制性政策會以 `--permission-mode default` 啟動。每個代理的 `agents.list[].tools.exec` 設定會覆寫該代理的全域 `tools.exec`。原始後端引數仍可包含 `--permission-mode`，但即時 Claude 啟動會正規化該旗標，使其符合有效政策。

此後端也會將 OpenClaw `/think` 等級對應到 Claude Code 的原生 `--effort` 旗標：`minimal`/`low` -> `low`、`adaptive`/`medium` -> `medium`，而 `high`/`xhigh`/`max` 會直接傳遞。其他命令列介面後端需要其擁有外掛宣告等效的 argv 對應器，`/think` 才會影響產生的命令列介面。

OpenClaw 能使用 `claude-cli` 之前，Claude Code 本身必須已在同一主機上登入：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安裝需要在持久化容器 home 內安裝並登入 Claude Code，而不只是主機上；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。

只有在 `claude` 二進位檔尚未位於 `PATH` 時，才設定 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果命令列介面支援工作階段，請設定 `sessionArg`（例如 `--session-id`），或在 ID 需要落在多個旗標中時設定 `sessionArgs`（預留位置 `{sessionId}`）。
- 如果命令列介面使用帶有不同旗標的續接子命令，請設定 `resumeArgs`（續接時取代 `args`），並可選擇性為非 JSON 續接設定 `resumeOutput`。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存則使用新的 UUID）。
  - `existing`：只有先前已儲存工作階段 ID 時才傳送。
  - `none`：絕不傳送工作階段 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"` 與 `input: "stdin"`，因此在自訂設定省略傳輸欄位時，後續回合仍會在即時 Claude 程序作用中時重用該程序。如果閘道重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 續接。儲存的工作階段 ID 會先驗證是否對應可讀的專案逐字稿再續接；缺少逐字稿時會清除綁定（記錄為 `reason=transcript-missing`），而不是在 `--resume` 下靜默啟動全新工作階段。
- Claude 即時工作階段會保留有界 JSONL 輸出防護：預設每回合 8 MiB 與 20,000 行原始 JSONL。可透過 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 與 `maxTurnLines` 依後端提高限制；OpenClaw 會將這些設定限制在 64 MiB 與 100,000 行。
- 儲存的命令列介面工作階段是由提供者擁有的連續性。隱含的每日工作階段重設不會切斷它們；`/reset` 與明確的 `session.reset` 政策仍會切斷。
- 新的命令列介面工作階段通常只會從 OpenClaw 的壓縮摘要加上壓縮後尾段重新播種。若要復原壓縮前失效的短工作階段，後端可透過 `reseedFromRawTranscriptWhenUncompacted: true` 選擇加入。原始逐字稿重新播種會維持有界，且限制於安全失效情境，例如缺少命令列介面逐字稿、孤立的工具使用尾段、訊息政策/系統提示詞/cwd/MCP 變更，或工作階段過期重試；驗證設定檔或憑證世代變更絕不會重新播種原始逐字稿歷史。

序列化：`serialize: true` 會讓同通道執行保持排序（大多數命令列介面會在單一提供者通道上序列化）。當選取的驗證身分變更時，OpenClaw 也會放棄儲存的命令列介面工作階段重用，包括驗證設定檔 ID、靜態 API 金鑰、靜態權杖，或命令列介面公開的 OAuth 帳戶身分變更；僅 OAuth 存取/重新整理權杖輪替不會切斷工作階段。如果命令列介面沒有穩定的 OAuth 帳戶 ID，OpenClaw 會讓該命令列介面自行強制執行續接權限。

## 來自 claude-cli 工作階段的備援前導內容

當 `claude-cli` 嘗試容錯移轉到 [`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中的非命令列介面候選項時，OpenClaw 會使用從 Claude Code 本機 JSONL 逐字稿（位於 `~/.claude/projects/`，依工作區作為鍵）擷取的內容前導來播種下一次嘗試。若沒有此種子，備援提供者會從冷啟動開始，因為 OpenClaw 自身的工作階段逐字稿對 `claude-cli` 執行而言是空的。

- 前導內容偏好最新的 `/compact` 摘要或 `compact_boundary` 標記，然後在字元預算內附加邊界後最近的回合。邊界前回合會被丟棄，因為摘要已代表它們。
- 工具區塊會合併為精簡的 `(tool call: name)` 與 `(tool result: …)` 提示，以誠實維持提示詞預算；過大的摘要會被截斷並標示為 `(truncated)`。
- 同提供者的 `claude-cli` 到 `claude-cli` 備援會依賴 Claude 自身的 `--resume`，並跳過前導內容。
- 種子會重用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片

如果你的命令列介面接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果已設定 `imageArg`，這些路徑會作為命令列介面引數傳遞；如果未設定，OpenClaw 會將檔案路徑附加到提示詞（路徑注入），這適用於會從純路徑自動載入本機檔案的命令列介面。

## 輸入與輸出

- `output: "text"`（預設）會將 stdout 視為最終回應。
- `output: "json"` 會嘗試剖析 JSON，並擷取文字加上工作階段 ID。
- `output: "jsonl"` 會剖析 JSONL 串流，並在存在時擷取最終代理訊息與工作階段識別碼。
- 對於 Gemini 命令列介面 JSON 輸出，當 `usage` 缺少或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從 `stats` 讀取用量。內建 Gemini 命令列介面預設使用 `stream-json`；舊的 `--output-format json` 覆寫仍使用 JSON 剖析器。

輸入模式：

- `input: "arg"`（預設）會將提示詞作為最後一個命令列介面引數傳遞。
- `input: "stdin"` 會透過 stdin 傳送提示詞。
- 如果提示詞非常長且已設定 `maxPromptArgChars`，則會改用 stdin。

## 外掛擁有的預設值

命令列介面後端預設值是外掛介面的一部分：

- 外掛會透過 `api.registerCliBackend(...)` 註冊它們。
- 後端 `id` 會成為模型參照中的提供者前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫外掛預設值。
- 後端特定的設定清理會透過選用的 `normalizeConfig` hook 保持由外掛擁有。

Anthropic 擁有 `claude-cli`，Google 擁有 `google-gemini-cli`。OpenAI Codex 代理執行會透過 `openai/*` 使用 Codex app-server 框架；OpenClaw 不再註冊內建的 `codex-cli` 後端。

內建的 Anthropic 外掛會為 `claude-cli` 註冊：

| Key                   | Value                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

隨附的 Google 外掛會為 `google-gemini-cli` 註冊：

| Key                       | Value                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 相同，並帶有 `--resume {sessionId}`                                                    |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

先決條件：本機 Gemini 命令列介面必須已安裝，且在 `PATH` 中可作為 `gemini` 使用（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini 命令列介面輸出注意事項：

- 預設的 `stream-json` 剖析器會讀取助理 `message` 事件、工具事件、最終 `result` 用量，以及致命 Gemini 錯誤事件。
- 如果你將 Gemini 參數覆寫為 `--output-format json`，OpenClaw 會將該後端正規化回 `output: "json"`，並從 JSON `response` 欄位讀取回覆文字。
- 當 `usage` 不存在或為空時，用量會退回使用 `stats`；`stats.cached` 會正規化為 OpenClaw `cacheRead`，而如果缺少 `stats.input`，輸入權杖會從 `stats.input_tokens - stats.cached` 推導而來。

只有在需要時才覆寫預設值（最常見的是絕對 `command` 路徑）。

## 文字轉換覆蓋層

需要小型提示/訊息相容性墊片的外掛，可以宣告雙向文字轉換，而不必取代提供者或命令列介面後端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 會重寫傳遞給命令列介面的系統提示和使用者提示。`output` 會在 OpenClaw 處理自己的控制標記和頻道傳遞之前，重寫串流助理文字與剖析後的最終文字；對於由提供者支援的模型呼叫，它也會在串流修復之後、工具執行之前，還原結構化工具呼叫引數內的字串值。原始提供者 JSON 片段會保持不變；消費者應使用結構化的部分、結束或結果承載。

對於發出提供者特定 JSONL 事件的命令列介面，請在該後端的設定上設定 `jsonlDialect`：與 Claude Code 相容的串流使用 `claude-stream-json`，Gemini 命令列介面 `stream-json` 事件使用 `gemini-stream-json`。

## 原生壓縮所有權

有些命令列介面後端會執行自行壓縮轉錄內容的代理，因此 OpenClaw 不得對它們執行防護摘要器，否則會與後端自身的壓縮互相衝突，並可能讓該輪次硬性失敗。

`claude-cli` 沒有 harness 端點（Claude Code 會在內部壓縮），因此它會宣告 `ownsNativeCompaction: true`，而 OpenClaw 的壓縮路徑會原封不動地傳回工作階段項目。像 Codex 這類原生 harness 工作階段，則會繼續路由到它們的 harness 壓縮端點。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

只有在後端真正擁有壓縮時，才宣告 `ownsNativeCompaction`：它必須可靠地將自己的轉錄內容限制在接近脈絡視窗的範圍內，並保存可恢復的工作階段（例如 `--resume` / `--session-id`），否則延後的工作階段可能會持續超出預算。

## Bundle MCP 覆蓋層

命令列介面後端不會直接接收 OpenClaw 工具呼叫，但後端可以透過 `bundleMcp: true` 選擇加入產生的 MCP 設定覆蓋層。目前隨附的行為：

- `claude-cli`：產生嚴格的 MCP 設定檔。
- `google-gemini-cli`：產生 Gemini 系統設定檔。

啟用 bundle MCP 時，OpenClaw 會：

- 生成一個 loopback HTTP MCP 伺服器，將閘道工具公開給命令列介面程序，並使用每個工作階段專屬權杖（`OPENCLAW_MCP_TOKEN`）進行驗證；
- 將工具存取範圍限定於目前工作階段、帳戶和頻道脈絡；
- 載入目前工作區啟用的 bundle-MCP 伺服器，並將它們與任何現有後端 MCP 設定/設定形狀合併；
- 使用擁有外掛的後端所擁有整合模式重寫啟動設定。

如果未啟用任何 MCP 伺服器，當後端選擇加入 bundle MCP 時，OpenClaw 仍會注入嚴格設定，讓背景執行保持隔離。

工作階段範圍的隨附 MCP 執行階段會快取，以便在工作階段內重複使用，然後在閒置 `mcp.sessionIdleTtlMs` 毫秒後收割（預設 10 分鐘；設為 `0` 可停用）。一次性嵌入式執行，例如驗證探測、slug 產生和主動記憶回憶，會在執行結束時要求清理，讓 stdio 子程序和 Streamable HTTP/SSE 串流不會比該次執行活得更久。

## 重新植入歷史上限

當新的命令列介面工作階段從先前的 OpenClaw 轉錄內容植入時（例如在 `session_expired` 重試之後），呈現出的 `<conversation_history>` 區塊會受到上限限制，避免重新植入提示爆量。預設值為 12,288 個字元（約 3,000 個權杖）。

Claude 命令列介面後端會改為依照解析後的 Claude 脈絡視窗調整此上限：較大的脈絡視窗會取得較大的先前歷史片段，最高不超過固定上限；其他命令列介面後端則維持保守預設值。此上限只管控重新植入提示的先前歷史區塊，現場工作階段輸出限制則會在 `reliability.outputLimits` 下另行調校（請參閱[工作階段](#sessions)）。

## 限制

- 無直接 OpenClaw 工具呼叫：OpenClaw 不會將工具呼叫注入命令列介面後端協定。後端只有在選擇加入 `bundleMcp: true` 時，才會看到閘道工具。
- 串流是後端特定的：有些後端會串流 JSONL，其他後端則會緩衝到結束才輸出。
- 結構化輸出取決於命令列介面自身的 JSON 格式。

## 疑難排解

| 症狀                  | 修正                                                              |
| --------------------- | ----------------------------------------------------------------- |
| 找不到命令列介面      | 將 `command` 設為完整路徑。                                       |
| 模型名稱錯誤          | 使用 `modelAliases` 將 `provider/model` 對應到命令列介面的模型 id。 |
| 沒有工作階段連續性    | 確認已設定 `sessionArg`，且 `sessionMode` 不是 `none`。           |
| 圖片被忽略            | 設定 `imageArg`，並確認命令列介面支援檔案路徑。                  |

## 相關

- [閘道 runbook](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
