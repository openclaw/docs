---
read_when:
    - 你希望在 API 供應商發生故障時有可靠的備援機制
    - 你正在執行本機 AI 命令列介面，並想要重複使用它們
    - 你想了解用於命令列介面後端工具存取的 MCP 回送橋接器
summary: 命令列介面後端：本機 AI 命令列介面備援，搭配選用的 MCP 工具橋接器
title: 命令列介面後端
x-i18n:
    generated_at: "2026-07-12T14:28:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可在 API 供應商中斷、受到速率限制或運作異常時，執行本機 AI 命令列介面，作為純文字備援。其設計刻意採取保守策略：

- 不會直接注入 OpenClaw 工具，但設有 `bundleMcp: true` 的後端可透過回送 MCP 橋接接收閘道工具。
- 支援該功能的命令列介面可使用 JSONL 串流。
- 支援工作階段，因此後續輪次能保持連貫。
- 如果命令列介面接受圖片路徑，圖片可直接傳遞。

請將它用作「永遠可用」文字回應的安全網，而不是主要路徑。如需具備 ACP 工作階段控制、背景工作、討論串／對話繫結，以及持續性外部程式設計工作階段的完整執行框架，請改用 [ACP 代理程式](/zh-TW/tools/acp-agents)；命令列介面後端並非 ACP。

<Tip>
  正在建置新的後端外掛嗎？請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。本頁說明如何設定及操作已註冊的後端。
</Tip>

## 快速開始

內建的 Anthropic 外掛會註冊預設的 `claude-cli` 後端，因此只要已安裝並登入 Claude Code，不需額外設定即可使用：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未設定明確的代理程式清單時，`main` 是預設代理程式 ID；否則請換成你自己的代理程式 ID。

如果閘道在只有最小化 `PATH` 的 launchd/systemd 下執行，請明確指定二進位檔：

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

如果你在閘道主機上將內建的命令列介面後端用作主要訊息供應商，且設定在模型參照或 `agents.defaults.cliBackends` 下引用該後端，OpenClaw 會自動載入擁有該後端的內建外掛。

## 作為備援使用

將命令列介面後端加入備援清單，使其僅在主要模型失敗時執行：

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

如果你將 `agents.defaults.models` 用作允許清單，也請將命令列介面後端模型納入其中。主要供應商失敗時（驗證、速率限制、逾時），OpenClaw 接著會嘗試命令列介面後端。

## 設定

所有命令列介面後端都位於 `agents.defaults.cliBackends` 下，並以供應商 ID（例如 `claude-cli`、`my-cli`）作為鍵。供應商 ID 會成為模型參照的左半部：`<provider>/<model>`。

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
          // 專用的提示檔案旗標：
          // systemPromptFileArg: "--system-file",
          // 或改用 Codex 風格的設定覆寫旗標：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // 僅當此後端可在壓縮前，從有界限的原始 OpenClaw
          // 逐字稿歷程重新植入已失效工作階段時，才選擇啟用。
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 運作方式

1. 依供應商前綴（`claude-cli/...`）選取後端。
2. 使用相同的 OpenClaw 提示和工作區內容建立系統提示。
3. 使用工作階段 ID（若支援）執行命令列介面，使歷程保持一致。內建的 `claude-cli` 後端會為每個 OpenClaw 工作階段維持一個 Claude stdio 程序，並透過 stream-json stdin 傳送後續輪次。
4. 剖析輸出（JSON 或純文字）並傳回最終文字。
5. 依後端保存工作階段 ID，讓後續輪次重複使用同一個命令列介面工作階段。

### Claude 命令列介面詳細資訊

內建的 `claude-cli` 後端優先使用 Claude Code 的原生技能解析器。當目前的技能快照至少包含一個具有具體化路徑的已選技能時，OpenClaw 會透過 `--plugin-dir` 傳入暫時的 Claude Code 外掛，並從附加的系統提示中省略重複的 OpenClaw 技能目錄。若沒有具體化的外掛技能，OpenClaw 會保留提示目錄作為備援。技能環境變數／API 金鑰覆寫仍會套用至該次執行的子程序環境。

Claude 命令列介面有自己的非互動式權限模式；OpenClaw 會將其對應至現有的執行政策，而不新增 Claude 專屬設定。對於由 OpenClaw 管理的 Claude 即時工作階段，有效的執行政策具有最終決定權：YOLO（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`）會以 `--permission-mode bypassPermissions` 啟動 Claude，而限制性政策則會以 `--permission-mode default` 啟動。各代理程式的 `agents.list[].tools.exec` 設定會覆寫該代理程式的全域 `tools.exec`。原始後端引數仍可包含 `--permission-mode`，但 Claude 即時啟動時會將該旗標正規化，使其符合有效政策。

此後端也會將 OpenClaw 的 `/think` 層級對應至 Claude Code 原生的 `--effort` 旗標：`minimal`/`low` -> `low`、`medium` -> `medium`，而 `high`/`xhigh`/`max` 則直接傳遞。`adaptive` 會移除已設定的 `--effort` 旗標且不提供替代值，因此 Claude Code 會從自己的環境、設定和模型預設值解析有效投入程度。其他命令列介面後端必須由所屬外掛宣告對等的 argv 對應器，`/think` 才會影響產生的命令列介面。

OpenClaw 必須先在同一台主機上登入 Claude Code，才能使用 `claude-cli`：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安裝必須在持續保存的容器家目錄內安裝並登入 Claude Code，而不能只在主機上完成；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。

僅在 `claude` 二進位檔尚未位於 `PATH` 時，才設定 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果命令列介面支援工作階段，請設定 `sessionArg`（例如 `--session-id`）；若 ID 需置於多個旗標中，則設定 `sessionArgs`（預留位置 `{sessionId}`）。
- 如果命令列介面使用具有不同旗標的繼續子命令，請設定 `resumeArgs`（繼續時取代 `args`），並可針對非 JSON 的繼續輸出設定 `resumeOutput`。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存則使用新的 UUID）。
  - `existing`：僅在先前已儲存工作階段 ID 時傳送。
  - `none`：永不傳送工作階段 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此即時 Claude 程序仍在運作時，後續輪次會重複使用該程序；省略傳輸欄位的自訂設定也同樣適用。如果閘道重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 繼續。繼續前，系統會依可讀取的專案逐字稿驗證已儲存的工作階段 ID；如果逐字稿遺失，系統會清除繫結（記錄為 `reason=transcript-missing`），而不會在 `--resume` 下無聲地啟動新工作階段。
- Claude 即時工作階段會維持有界限的 JSONL 輸出防護：每輪預設為 8 MiB 和 20,000 行原始 JSONL。可透過各後端的 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 和 `maxTurnLines` 提高限制；OpenClaw 會將這些設定限制在 64 MiB 和 100,000 行。
- 已儲存的命令列介面工作階段是供應商所擁有的連續性。隱含的每日工作階段重設不會中斷它們；`/reset` 和明確的 `session.reset` 政策仍會中斷。
- 新的命令列介面工作階段通常只會從 OpenClaw 的壓縮摘要及壓縮後尾段重新植入內容。若要復原在壓縮前失效的短工作階段，後端可透過 `reseedFromRawTranscriptWhenUncompacted: true` 選擇啟用。原始逐字稿重新植入仍有界限，且僅限安全的失效情況，例如命令列介面逐字稿遺失、孤立的工具使用尾段、訊息政策／系統提示／cwd／MCP 變更，或工作階段過期重試；驗證設定檔或認證資訊版本變更絕不會重新植入原始逐字稿歷程。

序列化：`serialize: true` 會讓同一執行通道的執行保持順序（大多數命令列介面會在單一供應商通道上序列化）。當選取的驗證身分變更時，OpenClaw 也會停止重複使用已儲存的命令列介面工作階段，包括驗證設定檔 ID、靜態 API 金鑰、靜態權杖，或命令列介面有揭露時的 OAuth 帳戶身分變更；僅 OAuth 存取／重新整理權杖輪替不會中斷工作階段。如果命令列介面沒有穩定的 OAuth 帳戶 ID，OpenClaw 會讓該命令列介面自行強制執行繼續權限。

## 來自 claude-cli 工作階段的備援前置內容

當 `claude-cli` 嘗試失敗並切換至 [`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中非命令列介面的候選項目時，OpenClaw 會以從 Claude Code 本機 JSONL 逐字稿（位於 `~/.claude/projects/` 下，依工作區作為鍵）擷取的內容前置段，為下一次嘗試植入內容。若沒有此植入內容，備援供應商會冷啟動，因為 OpenClaw 自己的工作階段逐字稿在 `claude-cli` 執行時是空的。

- 前置內容會優先使用最新的 `/compact` 摘要或 `compact_boundary` 標記，再附加邊界後最新的輪次，直到達到字元預算。邊界前的輪次會被捨棄，因為摘要已代表這些內容。
- 工具區塊會合併成精簡的 `(tool call: name)` 和 `(tool result: …)` 提示，以如實控制提示預算；過大的摘要會被截斷並標記為 `(truncated)`。
- 相同供應商從 `claude-cli` 到 `claude-cli` 的備援會依賴 Claude 自己的 `--resume`，並略過前置內容。
- 植入內容會重複使用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片

如果你的命令列介面接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果已設定 `imageArg`，這些路徑會作為命令列介面引數傳入；如果未設定，OpenClaw 會將檔案路徑附加至提示（路徑注入），適用於可從純文字路徑自動載入本機檔案的命令列介面。

## 輸入與輸出

- `output: "text"`（預設）會將 stdout 視為最終回應。
- `output: "json"` 會嘗試剖析 JSON，並擷取文字及工作階段 ID。
- `output: "jsonl"` 會剖析 JSONL 串流，並在存在時擷取最終代理程式訊息及工作階段識別碼。
- 對於 Gemini 命令列介面的 JSON 輸出，當 `usage` 遺失或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從 `stats` 讀取用量。內建的 Gemini 命令列介面預設使用 `stream-json`；舊的 `--output-format json` 覆寫仍會使用 JSON 剖析器。

輸入模式：

- `input: "arg"`（預設）會將提示作為最後一個命令列介面引數傳入。
- `input: "stdin"` 會透過 stdin 傳送提示。
- 如果提示非常長且已設定 `maxPromptArgChars`，則改用 stdin。

## 外掛擁有的預設值

命令列介面後端預設值是外掛介面的一部分：

- 外掛使用 `api.registerCliBackend(...)` 註冊它們。
- 後端 `id` 會成為模型參照中的供應商前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫外掛預設值。
- 後端專屬設定清理仍由外掛透過選用的 `normalizeConfig` 鉤子負責。

Anthropic 擁有 `claude-cli`，Google 擁有 `google-gemini-cli`。OpenAI Codex 代理程式透過 `openai/*` 使用 Codex app-server 執行框架；OpenClaw 不再註冊內建的 `codex-cli` 後端。

內建的 Anthropic 外掛會為 `claude-cli` 註冊：

| 鍵                    | 值                                                                                                                                                                                                            |
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

隨附的 Google 外掛會註冊 `google-gemini-cli`：

| 鍵                        | 值                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 相同，另加 `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

必要條件：本機必須已安裝 Gemini 命令列介面，並能透過 `PATH` 以 `gemini` 執行（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini 命令列介面輸出注意事項：

- 預設的 `stream-json` 剖析器會讀取助理 `message` 事件、工具事件、最終 `result` 用量，以及致命的 Gemini 錯誤事件。
- 如果你將 Gemini 引數覆寫為 `--output-format json`，OpenClaw 會將該後端正規化回 `output: "json"`，並從 JSON 的 `response` 欄位讀取回覆文字。
- 當 `usage` 不存在或為空時，用量會改用 `stats`；`stats.cached` 會正規化為 OpenClaw 的 `cacheRead`，而如果缺少 `stats.input`，輸入權杖數會由 `stats.input_tokens - stats.cached` 推導。

僅在需要時覆寫預設值（最常見的是使用絕對 `command` 路徑）。

## 文字轉換疊加層

需要小型提示詞／訊息相容性調整層的外掛，可以宣告雙向文字轉換，而不必取代供應商或命令列介面後端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 會改寫傳給命令列介面的系統提示詞與使用者提示詞。`output` 會在 OpenClaw 處理自己的控制標記與頻道傳遞之前，改寫串流中的助理文字與剖析後的最終文字；對於由供應商支援的模型呼叫，它也會在串流修復之後、工具執行之前，還原結構化工具呼叫引數中的字串值。原始供應商 JSON 片段會保持不變；使用端應使用結構化的部分、結束或結果承載資料。

對於會發出供應商特定 JSONL 事件的命令列介面，請在該後端的設定中設置 `jsonlDialect`：與 Claude Code 相容的串流使用 `claude-stream-json`，Gemini 命令列介面 `stream-json` 事件則使用 `gemini-stream-json`。

## 原生壓縮所有權

有些命令列介面後端會執行自行壓縮對話記錄的代理程式，因此 OpenClaw 不得對它們執行防護性摘要器——這麼做會與後端本身的壓縮機制衝突，並可能導致該次處理直接失敗。

`claude-cli` 沒有控管端點（Claude Code 會在內部壓縮），因此它會宣告 `ownsNativeCompaction: true`，而 OpenClaw 的壓縮路徑會原封不動地傳回工作階段項目。Codex 等原生控管工作階段則會繼續路由至其控管壓縮端點。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

只有真正擁有壓縮機制的後端才能宣告 `ownsNativeCompaction`：它必須能可靠地將自己的對話記錄限制在內容視窗附近，並保存可繼續執行的工作階段（例如 `--resume` / `--session-id`），否則延後執行的工作階段可能持續超出預算。

## 隨附 MCP 疊加層

命令列介面後端不會直接接收 OpenClaw 工具呼叫，但後端可以透過 `bundleMcp: true` 選擇使用產生的 MCP 設定疊加層。目前的隨附行為：

- `claude-cli`：產生嚴格的 MCP 設定檔。
- `google-gemini-cli`：產生 Gemini 系統設定檔。

啟用隨附 MCP 時，OpenClaw 會：

- 啟動迴環 HTTP MCP 伺服器，將閘道工具提供給命令列介面程序，並使用僅在目前執行嘗試期間有效的每次執行內容授權（`OPENCLAW_MCP_TOKEN`）進行驗證；
- 將工具存取權限綁定至閘道所選的工作階段、帳號與頻道內容，而不是信任子程序標頭；
- 載入目前工作區中已啟用的隨附 MCP 伺服器，並將其與任何現有的後端 MCP 設定／組態結構合併；
- 使用所屬外掛擁有的整合模式改寫啟動設定。

如果未啟用任何 MCP 伺服器，只要後端選擇使用隨附 MCP，OpenClaw 仍會注入嚴格設定，確保背景執行保持隔離。

工作階段範圍的隨附 MCP 執行階段會快取以供同一工作階段內重複使用，之後會在閒置 `mcp.sessionIdleTtlMs` 毫秒後回收（預設為 10 分鐘；設為 `0` 可停用）。驗證探測、slug 產生與主動記憶回想等一次性內嵌執行，會要求在執行結束時清理，避免 stdio 子程序與 Streamable HTTP/SSE 串流在執行結束後仍繼續存活。

## 重新植入歷程上限

當新的命令列介面工作階段從先前的 OpenClaw 對話記錄植入內容時（例如在 `session_expired` 重試之後），轉譯後的 `<conversation_history>` 區塊會受到上限限制，避免重新植入提示詞無限制膨脹。預設值為 12,288 個字元（約 3,000 個權杖）。

Claude 命令列介面後端會改為依已解析的 Claude 內容視窗調整此上限：較大的內容視窗可取得較大的先前歷程片段，但不得超過固定上限；其他命令列介面後端則維持保守的預設值。此上限只管理重新植入提示詞中的先前歷程區塊——即時工作階段的輸出限制會在 `reliability.outputLimits` 下另行調整（請參閱[工作階段](#sessions)）。

## 限制

- 無法直接呼叫 OpenClaw 工具：OpenClaw 不會將工具呼叫注入命令列介面後端協定。後端只有在選擇使用 `bundleMcp: true` 時，才能看到閘道工具。
- 串流行為取決於後端：部分後端會串流 JSONL，其他後端則會緩衝至程序結束。
- 結構化輸出取決於命令列介面本身的 JSON 格式。

## 疑難排解

| 症狀                   | 修正方式                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| 找不到命令列介面       | 將 `command` 設為完整路徑。                                            |
| 模型名稱錯誤           | 使用 `modelAliases` 將 `provider/model` 對應至命令列介面的模型 ID。    |
| 工作階段無法延續       | 確認已設定 `sessionArg`，且 `sessionMode` 不是 `none`。                 |
| 圖片遭到忽略           | 設定 `imageArg`，並確認命令列介面支援檔案路徑。                        |

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
