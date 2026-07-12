---
read_when:
    - 你希望在 API 提供者發生故障時有可靠的備援機制
    - 你正在執行本機 AI 命令列介面，並希望重複使用它們
    - 你想瞭解用於命令列介面後端工具存取的 MCP 回送橋接器
summary: 命令列介面後端：具備選用 MCP 工具橋接功能的本機 AI 命令列介面備援方案
title: 命令列介面後端
x-i18n:
    generated_at: "2026-07-11T21:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可在 API 供應商中斷服務、受到速率限制或行為異常時，執行本機 AI 命令列介面作為純文字備援。其設計刻意採取保守策略：

- 不會直接注入 OpenClaw 工具，但設定了 `bundleMcp: true` 的後端可透過迴路 MCP 橋接器接收閘道工具。
- 對支援 JSONL 串流的命令列介面使用 JSONL 串流。
- 支援工作階段，因此後續輪次可保持連貫。
- 如果命令列介面接受圖片路徑，圖片可直接傳遞。

請將其用作「始終可用」純文字回應的安全網，而非主要路徑。若需要具備 ACP 工作階段控制、背景工作、討論串／對話繫結，以及持續性外部程式設計工作階段的完整執行框架，請改用 [ACP 代理程式](/zh-TW/tools/acp-agents)；命令列介面後端並非 ACP。

<Tip>
  要建置新的後端外掛嗎？請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。本頁說明如何設定及操作已註冊的後端。
</Tip>

## 快速開始

內建的 Anthropic 外掛會註冊預設的 `claude-cli` 後端，因此只要已安裝 Claude Code 並登入，不需其他設定即可使用：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未設定明確的代理程式清單時，`main` 是預設代理程式 ID；否則請換成您自己的代理程式 ID。

如果閘道在僅有精簡 `PATH` 的 launchd/systemd 下執行，請明確指定二進位檔：

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

如果您在閘道主機上使用內建命令列介面後端作為主要訊息供應商，當設定中的模型參照或 `agents.defaults.cliBackends` 下參照該後端時，OpenClaw 會自動載入擁有該後端的內建外掛。

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

如果您將 `agents.defaults.models` 用作允許清單，也請在其中加入命令列介面後端模型。當主要供應商失敗（驗證、速率限制、逾時）時，OpenClaw 接著會嘗試命令列介面後端。

## 設定

所有命令列介面後端都位於 `agents.defaults.cliBackends` 下，並以供應商 ID（例如 `claude-cli`、`my-cli`）作為鍵。供應商 ID 會成為模型參照的左側：`<provider>/<model>`。

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
          // 專用的提示詞檔案旗標：
          // systemPromptFileArg: "--system-file",
          // 或改用 Codex 風格的設定覆寫旗標：
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // 僅當此後端可在壓縮前，使用有界限的原始 OpenClaw
          // 逐字記錄歷程重新植入已失效的工作階段時才選擇啟用。
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
2. 使用相同的 OpenClaw 提示詞與工作區內容建構系統提示詞。
3. 使用工作階段 ID（若支援）執行命令列介面，使歷程保持一致。內建的 `claude-cli` 後端會為每個 OpenClaw 工作階段維持一個 Claude 標準輸入輸出程序，並透過 stream-json 標準輸入傳送後續輪次。
4. 解析輸出（JSON 或純文字）並傳回最終文字。
5. 依後端保存工作階段 ID，讓後續輪次重複使用相同的命令列介面工作階段。

### Claude 命令列介面細節

內建的 `claude-cli` 後端優先使用 Claude Code 的原生技能解析器。當目前的技能快照中至少有一個具有實體化路徑的已選技能時，OpenClaw 會透過 `--plugin-dir` 傳遞暫時的 Claude Code 外掛，並從附加的系統提示詞中省略重複的 OpenClaw 技能目錄。若沒有實體化的外掛技能，OpenClaw 會保留提示詞目錄作為備援。技能環境變數／API 金鑰覆寫仍會套用至該次執行的子程序環境。

Claude 命令列介面有自己的非互動式權限模式；OpenClaw 會將其對應至現有的執行政策，而非新增 Claude 專用設定。對於由 OpenClaw 管理的 Claude 即時工作階段，實際生效的執行政策具有最終決定權：YOLO（`tools.exec.security: "full"` 且 `tools.exec.ask: "off"`）會使用 `--permission-mode bypassPermissions` 啟動 Claude，而限制性政策則會使用 `--permission-mode default` 啟動。每個代理程式的 `agents.list[].tools.exec` 設定會覆寫該代理程式的全域 `tools.exec`。原始後端引數仍可包含 `--permission-mode`，但即時 Claude 啟動程序會將該旗標正規化，使其符合實際生效的政策。

此後端也會將 OpenClaw 的 `/think` 等級對應至 Claude Code 原生的 `--effort` 旗標：`minimal`/`low` -> `low`、`medium` -> `medium`，而 `high`/`xhigh`/`max` 則直接傳遞。`adaptive` 會移除已設定的 `--effort` 旗標且不提供替代值，因此 Claude Code 會依自身環境、設定及模型預設值解析實際生效的推理強度。其他命令列介面後端必須由其所屬外掛宣告對等的 argv 對應器，`/think` 才會影響產生的命令列介面程序。

OpenClaw 必須先在同一主機上登入 Claude Code，才能使用 `claude-cli`：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安裝必須在持久化容器的主目錄內安裝並登入 Claude Code，而不能只在主機上操作；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。

僅當 `claude` 二進位檔不在 `PATH` 上時，才設定 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果命令列介面支援工作階段，請設定 `sessionArg`（例如 `--session-id`）；若 ID 需要出現在多個旗標中，則設定 `sessionArgs`（預留位置 `{sessionId}`）。
- 如果命令列介面使用具有不同旗標的繼續子命令，請設定 `resumeArgs`（繼續時取代 `args`），若繼續輸出不是 JSON，則可選擇設定 `resumeOutput`。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存則使用新的 UUID）。
  - `existing`：僅在先前已儲存工作階段 ID 時傳送。
  - `none`：永不傳送工作階段 ID。
- `claude-cli` 預設使用 `liveSession: "claude-stdio"`、`output: "jsonl"` 及 `input: "stdin"`，因此即時 Claude 程序處於活動狀態時，後續輪次會重複使用該程序，包括省略傳輸欄位的自訂設定。如果閘道重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 繼續。繼續之前，系統會以可讀取的專案逐字記錄驗證已儲存的工作階段 ID；如果逐字記錄遺失，則會清除繫結（記錄為 `reason=transcript-missing`），而不是在 `--resume` 下悄悄啟動全新的工作階段。
- Claude 即時工作階段會保留有界限的 JSONL 輸出防護：預設每輪 8 MiB 及 20,000 行原始 JSONL。可透過每個後端的 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 與 `maxTurnLines` 提高限制；OpenClaw 會將這些設定限制在 64 MiB 及 100,000 行以內。
- 已儲存的命令列介面工作階段是由供應商擁有的連續性狀態。隱含的每日工作階段重設不會中斷它們；`/reset` 和明確的 `session.reset` 政策仍會中斷。
- 全新的命令列介面工作階段通常只會從 OpenClaw 的壓縮摘要及壓縮後尾端重新植入內容。若要復原在壓縮前失效的短工作階段，後端可透過 `reseedFromRawTranscriptWhenUncompacted: true` 選擇啟用。原始逐字記錄的重新植入仍有界限，且僅限於安全的失效情況，例如命令列介面逐字記錄遺失、孤立的工具使用尾端、訊息政策／系統提示詞／目前工作目錄／MCP 變更，或工作階段已到期後重試；驗證設定檔或憑證週期變更絕不會重新植入原始逐字記錄歷程。

序列化：`serialize: true` 會讓同一通道中的執行保持順序（大多數命令列介面會在單一供應商通道上依序執行）。當選取的驗證身分發生變更時，OpenClaw 也會停止重複使用已儲存的命令列介面工作階段，包括驗證設定檔 ID、靜態 API 金鑰、靜態權杖或命令列介面可公開的 OAuth 帳號身分發生變更；僅 OAuth 存取／重新整理權杖輪替不會中斷工作階段。如果命令列介面沒有穩定的 OAuth 帳號 ID，OpenClaw 會讓該命令列介面自行強制執行其繼續權限。

## 來自 claude-cli 工作階段的備援前置內容

當 `claude-cli` 嘗試失敗並轉移至 [`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中的非命令列介面候選項目時，OpenClaw 會使用從 Claude Code 本機 JSONL 逐字記錄（位於 `~/.claude/projects/` 下，依工作區建立索引）擷取的內容前置資訊，為下一次嘗試植入內容。若沒有此植入內容，備援供應商會從空白狀態開始，因為 OpenClaw 自身的工作階段逐字記錄在 `claude-cli` 執行期間是空的。

- 前置內容會優先使用最新的 `/compact` 摘要或 `compact_boundary` 標記，接著附加字元預算範圍內最近的邊界後輪次。邊界前的輪次會被捨棄，因為摘要已涵蓋它們。
- 工具區塊會合併為精簡的 `(tool call: name)` 和 `(tool result: …)` 提示，以如實維持提示詞預算；過大的摘要會被截斷並標示為 `(truncated)`。
- 同一供應商從 `claude-cli` 至 `claude-cli` 的備援會依賴 Claude 自身的 `--resume`，並略過前置內容。
- 植入內容會重複使用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片

如果您的命令列介面接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔案。如果設定了 `imageArg`，這些路徑會作為命令列介面引數傳遞；否則，OpenClaw 會將檔案路徑附加至提示詞（路徑注入），適用於會從純路徑自動載入本機檔案的命令列介面。

## 輸入與輸出

- `output: "text"`（預設）會將標準輸出視為最終回應。
- `output: "json"` 會嘗試解析 JSON，並擷取文字及工作階段 ID。
- `output: "jsonl"` 會解析 JSONL 串流，並擷取最終代理程式訊息及存在時的工作階段識別碼。
- 對於 Gemini 命令列介面的 JSON 輸出，當 `usage` 遺失或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從 `stats` 讀取用量。內建的 Gemini 命令列介面預設使用 `stream-json`；舊有的 `--output-format json` 覆寫仍使用 JSON 解析器。

輸入模式：

- `input: "arg"`（預設）會將提示詞作為最後一個命令列介面引數傳遞。
- `input: "stdin"` 會透過標準輸入傳送提示詞。
- 如果提示詞很長且設定了 `maxPromptArgChars`，則會改用標準輸入。

## 外掛擁有的預設值

命令列介面後端預設值是外掛介面的一部分：

- 外掛使用 `api.registerCliBackend(...)` 註冊預設值。
- 後端 `id` 會成為模型參照中的供應商前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫外掛預設值。
- 後端專用設定的清理作業仍由外掛透過選用的 `normalizeConfig` 鉤子負責。

Anthropic 擁有 `claude-cli`，Google 擁有 `google-gemini-cli`。OpenAI Codex 代理程式執行會透過 `openai/*` 使用 Codex 應用程式伺服器執行框架；OpenClaw 不再註冊內建的 `codex-cli` 後端。

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
| `resumeArgs`              | 相同，但加上 `--resume {sessionId}`                                                    |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

先決條件：本機必須安裝 Gemini 命令列介面，並能在 `PATH` 中以 `gemini` 執行（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini 命令列介面輸出注意事項：

- 預設的 `stream-json` 剖析器會讀取助理 `message` 事件、工具事件、最終 `result` 用量，以及致命的 Gemini 錯誤事件。
- 如果您將 Gemini 引數覆寫為 `--output-format json`，OpenClaw 會將該後端正規化回 `output: "json"`，並從 JSON 的 `response` 欄位讀取回覆文字。
- 當 `usage` 不存在或為空時，用量會改用 `stats`；`stats.cached` 會正規化為 OpenClaw 的 `cacheRead`，而若缺少 `stats.input`，輸入權杖數會由 `stats.input_tokens - stats.cached` 推導。

僅在需要時覆寫預設值（最常見的是使用絕對 `command` 路徑）。

## 文字轉換疊加層

需要小型提示詞／訊息相容性轉接的外掛，可以宣告雙向文字轉換，而不必取代供應商或命令列介面後端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 會改寫傳給命令列介面的系統提示詞與使用者提示詞。`output` 會在 OpenClaw 處理自身控制標記與頻道傳遞之前，改寫串流中的助理文字及剖析後的最終文字；對於由供應商支援的模型呼叫，它也會在串流修復後、工具執行前，還原結構化工具呼叫引數中的字串值。原始供應商 JSON 片段維持不變；取用端應使用結構化的部分、結束或結果承載資料。

對於會發出供應商特定 JSONL 事件的命令列介面，請在該後端的設定中指定 `jsonlDialect`：與 Claude Code 相容的串流使用 `claude-stream-json`，Gemini 命令列介面的 `stream-json` 事件則使用 `gemini-stream-json`。

## 原生壓縮的歸屬

有些命令列介面後端執行的代理程式會自行壓縮其對話記錄，因此 OpenClaw 不得對它們執行防護性摘要器——否則會與後端自身的壓縮互相衝突，並可能導致該輪次直接失敗。

`claude-cli` 沒有協作框架端點（Claude Code 會在內部進行壓縮），因此它會宣告 `ownsNativeCompaction: true`，而 OpenClaw 的壓縮路徑會原封不動地傳回工作階段項目。Codex 等具備原生協作框架的工作階段，則仍會路由至其協作框架的壓縮端點。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

只有真正自行負責壓縮的後端才能宣告 `ownsNativeCompaction`：它必須能在接近上下文視窗上限時可靠地限制自身對話記錄，並保存可續接的工作階段（例如 `--resume`／`--session-id`），否則延後處理的工作階段可能持續超出預算。

## 隨附 MCP 疊加層

命令列介面後端不會直接接收 OpenClaw 工具呼叫，但後端可以透過 `bundleMcp: true` 選擇使用產生的 MCP 設定疊加層。目前的隨附行為：

- `claude-cli`：產生嚴格的 MCP 設定檔。
- `google-gemini-cli`：產生 Gemini 系統設定檔。

啟用隨附 MCP 時，OpenClaw 會：

- 啟動 local loopback HTTP MCP 伺服器，向命令列介面程序公開閘道工具，並使用僅在目前執行嘗試期間有效的每次執行上下文授權（`OPENCLAW_MCP_TOKEN`）進行驗證；
- 將工具存取綁定至閘道所選的工作階段、帳戶及頻道上下文，而不信任子程序標頭；
- 載入目前工作區已啟用的隨附 MCP 伺服器，並將其與任何現有的後端 MCP 設定／設定值結構合併；
- 使用所屬外掛擁有的後端整合模式來改寫啟動設定。

即使沒有啟用任何 MCP 伺服器，只要後端選擇使用隨附 MCP，OpenClaw 仍會注入嚴格設定，讓背景執行保持隔離。

工作階段範圍的隨附 MCP 執行階段會快取以供同一工作階段重複使用，之後在閒置 `mcp.sessionIdleTtlMs` 毫秒後回收（預設 10 分鐘；設為 `0` 可停用）。驗證探測、代稱產生及主動記憶回想等一次性嵌入式執行，會要求在執行結束時清理，確保 stdio 子程序與可串流 HTTP/SSE 串流不會在執行結束後繼續存在。

## 重新植入歷程上限

當新的命令列介面工作階段從先前的 OpenClaw 對話記錄植入內容時（例如在 `session_expired` 重試後），轉譯出的 `<conversation_history>` 區塊會受到上限限制，避免重新植入提示詞失控膨脹。預設上限為 12,288 個字元（約 3,000 個權杖）。

Claude 命令列介面後端會改為依已解析的 Claude 上下文視窗調整此上限：較大的上下文視窗可取得較大的先前歷程片段，但不超過固定上限；其他命令列介面後端則維持保守的預設值。此上限只管控重新植入提示詞中的先前歷程區塊——即時工作階段的輸出限制會在 `reliability.outputLimits` 下另外調整（請參閱[工作階段](#sessions)）。

## 限制

- 無法直接呼叫 OpenClaw 工具：OpenClaw 不會將工具呼叫注入命令列介面後端協定。只有選擇使用 `bundleMcp: true` 的後端才能看到閘道工具。
- 串流因後端而異：部分後端會串流 JSONL，其他後端則會緩衝至程序結束。
- 結構化輸出取決於命令列介面自身的 JSON 格式。

## 疑難排解

| 症狀                   | 修正方式                                                               |
| ---------------------- | ---------------------------------------------------------------------- |
| 找不到命令列介面       | 將 `command` 設為完整路徑。                                            |
| 模型名稱錯誤           | 使用 `modelAliases` 將 `provider/model` 對應至命令列介面的模型識別碼。 |
| 工作階段無法延續       | 確認已設定 `sessionArg`，且 `sessionMode` 不是 `none`。                 |
| 圖片遭到忽略           | 設定 `imageArg`，並確認命令列介面支援檔案路徑。                        |

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
