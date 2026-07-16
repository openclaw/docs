---
read_when:
    - 你希望在 API 供應商發生故障時有可靠的備援機制
    - 你正在執行本機 AI 命令列介面，並想要重複使用它們
    - 你想瞭解用於命令列介面後端工具存取的 MCP 回送橋接器
summary: 命令列介面後端：本機 AI 命令列介面備援，並提供選用的 MCP 工具橋接器
title: 命令列介面後端
x-i18n:
    generated_at: "2026-07-16T11:38:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可在 API 提供者中斷、受到速率限制或行為異常時，執行本機 AI 命令列介面，作為純文字備援。其設計刻意採取保守策略：

- 不會直接注入 OpenClaw 工具，但具備 `bundleMcp: true` 的後端可透過迴路 MCP 橋接器接收閘道工具。
- 支援該功能之命令列介面的 JSONL 串流。
- 支援工作階段，因此後續輪次能保持連貫。
- 如果命令列介面接受圖片路徑，圖片便會傳遞至該介面。

將其用作確保文字回應「一律可用」的安全網，而非主要路徑。若需要具備 ACP 工作階段控制、背景任務、討論串／對話繫結及持續性外部程式設計工作階段的完整執行框架，請改用 [ACP 代理程式](/zh-TW/tools/acp-agents)；命令列介面後端並非 ACP。

<Tip>
  要建置新的後端外掛嗎？請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。本頁說明如何設定及操作已註冊的後端。
</Tip>

## 快速開始

隨附的 Anthropic 外掛會註冊預設的 `claude-cli` 後端，因此只要已安裝並登入 Claude Code，無須其他設定即可運作：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未設定明確的代理程式清單時，`main` 是預設的代理程式 ID；否則請換成你自己的代理程式 ID。

如果閘道在僅提供最少 `PATH` 的 launchd/systemd 環境下執行，請明確指向二進位檔：

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

如果你在閘道主機上使用隨附的命令列介面後端作為主要訊息提供者，且設定在模型參照或 `agents.defaults.cliBackends` 下參照該後端，OpenClaw 會自動載入擁有該後端的隨附外掛。

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

如果你將 `agents.defaults.models` 用作允許清單，也請將命令列介面後端模型納入其中。主要提供者因驗證、速率限制或逾時而失敗時，OpenClaw 接著會嘗試命令列介面後端。

## 設定

所有命令列介面後端都位於 `agents.defaults.cliBackends` 下，並以提供者 ID 作為索引鍵（例如 `claude-cli`、`my-cli`）。提供者 ID 會成為模型參照的左側部分：`<provider>/<model>`。

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
          // 僅當此後端可在壓縮前從有限的原始 OpenClaw 對話記錄
          // 重新植入已失效的工作階段時，才選擇啟用。
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 運作方式

1. 依提供者前綴選取後端（`claude-cli/...`）。
2. 使用相同的 OpenClaw 提示與工作區內容建立系統提示。
3. 使用工作階段 ID（若支援）執行命令列介面，以保持歷程一致。隨附的 `claude-cli` 後端會為每個 OpenClaw 工作階段維持一個 Claude stdio 程序運作，並透過 stream-json stdin 傳送後續輪次。
4. 剖析輸出（JSON 或純文字）並傳回最終文字。
5. 依後端保存工作階段 ID，讓後續輪次重複使用同一命令列介面工作階段。

### Claude 命令列介面的特定行為

隨附的 `claude-cli` 後端優先使用 Claude Code 的原生 Skill 解析器。當目前的 Skills 快照中至少有一個已選取且具備實體化路徑的 Skill 時，OpenClaw 會透過 `--plugin-dir` 傳遞暫時的 Claude Code 外掛，並從附加的系統提示中省略重複的 OpenClaw Skills 目錄。若沒有實體化的外掛 Skill，OpenClaw 會保留提示目錄作為備援。Skill 環境變數／API 金鑰覆寫仍會套用至該次執行的子程序環境。

Claude 命令列介面有自己的非互動式權限模式；OpenClaw 會將其對應至現有的執行政策，而不新增 Claude 專用設定。對於由 OpenClaw 管理的 Claude 即時工作階段，有效的執行政策具有最終決定權：YOLO（`tools.exec.security: "full"` 和 `tools.exec.ask: "off"`）通常會以 `--permission-mode bypassPermissions` 啟動 Claude，而限制性政策會以 `--permission-mode default` 啟動。以 root 執行的閘道也會使用 `default`，因為 Claude Code 拒絕 root 使用略過模式；OpenClaw 仍會依設定的執行政策回應 Claude 的 stdio 工具控制要求。每個代理程式的 `agents.list[].tools.exec` 設定會覆寫該代理程式的全域 `tools.exec`。原始後端引數仍可包含 `--permission-mode`，但 Claude 即時啟動程序會將該旗標正規化，使其符合有效政策與主機限制。

此後端也會將 OpenClaw `/think` 等級對應至 Claude Code 原生的 `--effort` 旗標：`minimal`/`low` -> `low`、`medium` -> `medium`，而 `high`/`xhigh`/`max` 則會直接傳遞。這可讓訂閱支援的 Claude 命令列介面和 API 金鑰路由維持相同的 Fable 5 支援力度等級。`adaptive` 會移除已設定的 `--effort` 旗標且不提供替代項目，因此 Claude Code 會從自身的環境、設定與模型預設值解析有效力度。其他命令列介面後端必須由其所屬外掛宣告等效的 argv 對應器，`/think` 才會影響產生的命令列介面程序。

OpenClaw 能使用 `claude-cli` 前，必須先在同一主機登入 Claude Code：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安裝需要在持續保存的容器主目錄內安裝並登入 Claude Code，而非僅在主機上完成；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。

僅當 `claude` 二進位檔不在 `PATH` 上時，才設定 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 如果命令列介面支援工作階段，請設定 `sessionArg`（例如 `--session-id`）；若 ID 需要置入多個旗標，則設定 `sessionArgs`（預留位置 `{sessionId}`）。
- 如果命令列介面使用具有不同旗標的繼續子命令，請設定 `resumeArgs`（繼續時取代 `args`），並可選擇為非 JSON 繼續操作設定 `resumeOutput`。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存則使用新的 UUID）。
  - `existing`：僅在先前已儲存工作階段 ID 時傳送。
  - `none`：絕不傳送工作階段 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此即使自訂設定省略傳輸欄位，後續輪次仍會在 Claude 即時程序運作期間重複使用該程序。如果閘道重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 繼續。繼續前會針對可讀取的專案對話記錄驗證已儲存的工作階段 ID；若找不到對話記錄，則會清除繫結（記錄為 `reason=transcript-missing`），而不會在 `--resume` 下悄悄啟動新的工作階段。
- Claude 即時工作階段會維持有限的 JSONL 輸出防護：每輪預設為 8 MiB 與 20,000 行原始 JSONL。可透過 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 和 `maxTurnLines` 依後端提高限制；OpenClaw 會將這些設定限制在 64 MiB 與 100,000 行以內。
- 已儲存的命令列介面工作階段是由提供者擁有的連續性。隱含的每日工作階段重設不會將其切斷；`/reset` 與明確的 `session.reset` 政策仍會切斷。
- 新的命令列介面工作階段通常只會從 OpenClaw 的壓縮摘要及壓縮後尾端重新植入內容。若要復原在壓縮前失效的短工作階段，後端可透過 `reseedFromRawTranscriptWhenUncompacted: true` 選擇啟用。原始對話記錄的重新植入仍有界限，且僅限於安全的失效情況，例如命令列介面對話記錄遺失、孤立的工具使用尾端、訊息政策／系統提示／目前工作目錄／MCP 變更，或工作階段過期後重試；驗證設定檔或認證資訊時期變更絕不會重新植入原始對話記錄歷程。

序列化：`serialize: true` 會維持同一通道中的執行順序（大多數命令列介面會在單一提供者通道中序列化）。選取的驗證身分變更時，OpenClaw 也會捨棄已儲存的命令列介面工作階段重複使用，包括驗證設定檔 ID、靜態 API 金鑰、靜態權杖或命令列介面可公開之 OAuth 帳戶身分的變更；僅輪替 OAuth 存取／重新整理權杖不會切斷工作階段。如果命令列介面沒有穩定的 OAuth 帳戶 ID，OpenClaw 會讓該命令列介面自行強制執行其繼續權限。

## claude-cli 工作階段的備援前置內容

當 `claude-cli` 嘗試在[`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover)中容錯移轉至非命令列介面候選項目時，OpenClaw 會使用從 Claude Code 本機 JSONL 對話記錄（位於 `~/.claude/projects/` 下，依工作區建立索引鍵）擷取的內容前置段落，為下一次嘗試植入內容。若沒有此植入內容，備援提供者會從無內容狀態開始，因為 `claude-cli` 執行時 OpenClaw 自身的工作階段對話記錄為空。

- 前置內容優先採用最新的 `/compact` 摘要或 `compact_boundary` 標記，再附加邊界後最近的輪次，直到字元預算上限。邊界前的輪次會遭捨棄，因為摘要已代表這些內容。
- 工具區塊會合併成精簡的 `(tool call: name)` 和 `(tool result: …)` 提示，以確實反映提示預算；過大的摘要會遭截斷，並標示為 `(truncated)`。
- 相同提供者內從 `claude-cli` 到 `claude-cli` 的備援會依賴 Claude 自身的 `--resume`，並略過前置內容。
- 植入內容會重複使用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片

如果你的命令列介面接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果設定了 `imageArg`，這些路徑會作為命令列介面引數傳遞；若未設定，OpenClaw 會將檔案路徑附加至提示（路徑注入），這適用於會從純文字路徑自動載入本機檔案的命令列介面。

## 輸入與輸出

- `output: "text"`（預設）會將 stdout 視為最終回應。
- `output: "json"` 會嘗試剖析 JSON，並擷取文字與工作階段 ID。
- `output: "jsonl"` 會剖析 JSONL 串流，並在存在時擷取最終代理程式訊息與工作階段識別碼。
- 對於 Gemini 命令列介面的 JSON 輸出，當 `usage` 不存在或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從 `stats` 讀取用量。隨附的 Gemini 命令列介面預設使用 `stream-json`；舊的 `--output-format json` 覆寫仍會使用 JSON 剖析器。

輸入模式：

- `input: "arg"`（預設）會將提示詞作為最後一個命令列介面引數傳遞。
- `input: "stdin"` 會透過 stdin 傳送提示詞。
- 如果提示詞非常長且已設定 `maxPromptArgChars`，則改用 stdin。

## 外掛擁有的預設值

命令列介面後端的預設值是外掛介面的一部分：

- 外掛會透過 `api.registerCliBackend(...)` 註冊這些預設值。
- 後端的 `id` 會成為模型參照中的提供者前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫外掛預設值。
- 後端專屬的設定清理仍由外掛透過選用的 `normalizeConfig` 掛鉤負責。

Anthropic 擁有 `claude-cli`，Google 擁有 `google-gemini-cli`。OpenAI Codex 代理程式執行會透過 `openai/*` 使用 Codex app-server 測試框架；OpenClaw 不再註冊內建的 `codex-cli` 後端。

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

內建的 Google 外掛會為 `google-gemini-cli` 註冊：

| 鍵                        | 值                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 相同，但包含 `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

先決條件：必須安裝本機 Gemini 命令列介面，並使其以 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）位於 `PATH` 上。

Gemini 命令列介面輸出注意事項：

- 預設的 `stream-json` 剖析器會讀取助理的 `message` 事件、工具事件、最終的 `result` 用量，以及致命的 Gemini 錯誤事件。
- 如果你將 Gemini 引數覆寫為 `--output-format json`，OpenClaw 會將該後端正規化回 `output: "json"`，並從 JSON 的 `response` 欄位讀取回覆文字。
- 當 `usage` 不存在或為空時，用量會退回使用 `stats`；`stats.cached` 會正規化為 OpenClaw 的 `cacheRead`，而如果缺少 `stats.input`，輸入權杖數會由 `stats.input_tokens - stats.cached` 推導。

僅在需要時覆寫預設值（最常見的是使用絕對的 `command` 路徑）。

## 文字轉換覆疊

需要小型提示詞／訊息相容性轉接層的外掛，可以宣告雙向文字轉換，而無須取代提供者或命令列介面後端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 會改寫傳遞給命令列介面的系統提示詞與使用者提示詞。`output` 會在 OpenClaw 處理自身的控制標記與頻道傳遞之前，改寫串流助理文字和剖析後的最終文字；對於由提供者支援的模型呼叫，它也會在串流修復後、工具執行前，還原結構化工具呼叫引數中的字串值。原始提供者 JSON 片段會保持不變；取用端應使用結構化的部分、結束或結果承載資料。

對於會發出提供者專屬 JSONL 事件的命令列介面，請在該後端的設定中設定 `jsonlDialect`：Claude Code 相容串流使用 `claude-stream-json`，Gemini 命令列介面的 `stream-json` 事件使用 `gemini-stream-json`。

## 原生壓縮的所有權

某些命令列介面後端執行的代理程式會自行壓縮其對話記錄，因此 OpenClaw 不得對它們執行安全防護摘要器——這樣做會與後端自身的壓縮機制衝突，並可能導致該回合直接失敗。

`claude-cli` 沒有測試框架端點（Claude Code 會在內部進行壓縮），因此它會宣告 `ownsNativeCompaction: true`，而 OpenClaw 的壓縮路徑會原封不動地傳回工作階段項目。OpenClaw 會透過 Claude Code 文件中記載的 [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) 傳遞該次執行的有效內容預算，使原生自動壓縮與已設定的 Anthropic `contextTokens` 限制保持一致。Codex 等原生測試框架工作階段則會繼續路由至其測試框架壓縮端點。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

僅對真正擁有壓縮機制的後端宣告 `ownsNativeCompaction`：它必須能可靠地將自身對話記錄限制在內容視窗附近，並持久保存可繼續的工作階段（例如 `--resume` / `--session-id`），否則延後的工作階段可能持續超出預算。

## 套件 MCP 覆疊

命令列介面後端不會直接接收 OpenClaw 工具呼叫，但後端可透過 `bundleMcp: true` 選擇加入產生的 MCP 設定覆疊。目前的內建行為：

- `claude-cli`：產生的嚴格 MCP 設定檔。
- `google-gemini-cli`：產生的 Gemini 系統設定檔。

啟用套件 MCP 時，OpenClaw 會：

- 啟動迴路 HTTP MCP 伺服器，向命令列介面處理程序公開閘道工具，並使用僅在目前執行嘗試期間有效的單次執行內容授權（`OPENCLAW_MCP_TOKEN`）進行驗證；
- 將工具存取權繫結至閘道選取的工作階段、帳戶與頻道內容，而非信任子處理程序標頭；
- 載入目前工作區已啟用的套件 MCP 伺服器，並將其與任何現有後端 MCP 設定／設定值結構合併；
- 使用所屬外掛擁有的整合模式改寫啟動設定。

如果未啟用任何 MCP 伺服器，當後端選擇加入套件 MCP 時，OpenClaw 仍會注入嚴格設定，讓背景執行保持隔離。

以工作階段為範圍的內建 MCP 執行階段會快取以供同一工作階段內重複使用，並在閒置 `mcp.sessionIdleTtlMs` 毫秒後回收（預設為 10 分鐘；設定 `0` 可停用）。驗證探測、slug 產生和主動記憶回想等一次性嵌入式執行，會在執行結束時要求清理，避免 stdio 子處理程序和可串流 HTTP/SSE 串流在執行結束後仍繼續存在。

## 重新植入歷程上限

從先前的 OpenClaw 對話記錄植入新的命令列介面工作階段時（例如在 `session_expired` 重試後），會限制所呈現的 `<conversation_history>` 區塊，以防重新植入提示詞急遽膨脹。預設值為 12,288 個字元（約 3,000 個權杖）。

Claude 命令列介面後端會改為根據解析後的 Claude 內容視窗調整此上限：較大的內容視窗會獲得較大的先前歷程片段，最高不超過固定上限；其他命令列介面後端則維持保守的預設值。此上限僅規範重新植入提示詞中的先前歷程區塊——即時工作階段的輸出限制會在 `reliability.outputLimits` 下另行調整（請參閱[工作階段](#sessions)）。

## 限制

- 無法直接呼叫 OpenClaw 工具：OpenClaw 不會將工具呼叫注入命令列介面後端通訊協定。後端只有在選擇加入 `bundleMcp: true` 時，才能看見閘道工具。
- 串流行為依後端而異：某些後端會串流 JSONL，其他後端則會緩衝至結束。
- 結構化輸出取決於命令列介面本身的 JSON 格式。

## 疑難排解

| 症狀                  | 修正方式                                                               |
| --------------------- | ---------------------------------------------------------------------- |
| 找不到命令列介面      | 將 `command` 設為完整路徑。                                   |
| 模型名稱錯誤          | 使用 `modelAliases` 將 `provider/model` 對應至命令列介面的模型 ID。 |
| 工作階段無法延續      | 確認已設定 `sessionArg`，且 `sessionMode` 不是 `none`。 |
| 圖片遭忽略            | 設定 `imageArg`，並確認命令列介面支援檔案路徑。                 |

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
