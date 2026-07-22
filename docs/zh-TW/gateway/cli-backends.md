---
read_when:
    - 你希望在 API 提供者發生故障時，有可靠的備援機制
    - 你正在執行本機 AI 命令列介面，並想要重複使用它們
    - 你想瞭解用於命令列介面後端工具存取的 MCP 迴路橋接器
summary: 命令列介面後端：本機 AI 命令列介面備援，搭配選用的 MCP 工具橋接器
title: 命令列介面後端
x-i18n:
    generated_at: "2026-07-22T10:32:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f4e32b34985aeb1df1adbf6bf638e9300dd672e5de49c45abe82d7bc181d5f5a
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可在 API 提供者停機、受到速率限制或運作異常時，執行本機 AI 命令列介面，作為純文字備援。其設計刻意採取保守方式：

- 不會直接注入 OpenClaw 工具，但具備 `bundleMcp: true` 的後端可透過迴路 MCP 橋接器接收閘道工具。
- 為支援 JSONL 的命令列介面提供 JSONL 串流。
- 支援工作階段，因此後續輪次能保持連貫。
- 如果命令列介面接受圖片路徑，圖片便會直接傳遞。

請將其作為「始終可用」文字回應的安全網，而非主要路徑。如需具備 ACP 工作階段控制、背景工作、討論串／對話繫結，以及持續性外部程式設計工作階段的完整執行框架，請改用 [ACP Agents](/zh-TW/tools/acp-agents)；命令列介面後端並非 ACP。

<Tip>
  正在建構新的後端外掛嗎？請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。本頁說明如何設定及操作已註冊的後端。
</Tip>

## 快速開始

隨附的 Anthropic 外掛會註冊預設的 `claude-cli` 後端，因此只要已安裝並登入 Claude Code，無須其他設定即可運作：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未設定明確的代理程式清單時，`main` 是預設代理程式 ID；否則請換成你自己的代理程式 ID。

閘道服務的 `PATH` 必須包含該命令列介面。如果部署需要
非標準的可執行檔路徑或引數，請改在
[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)中註冊該轉接器，而不要將啟動
機制放入 `openclaw.json`。

當模型選擇或模型範圍的 `agentRuntime.id` 參照某個後端時，OpenClaw
會自動載入擁有該後端的隨附外掛。

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

主要提供者失敗（驗證、速率限制、逾時）時，已設定的備援仍可使用，即使它們不在 `agents.defaults.modelPolicy.allow` 中亦然。只有當使用者也應能透過 `/model`、工作階段覆寫或 `--model` 直接選取命令列介面後端模型時，才將該模型加入此政策。`agents.defaults.models` 僅管理各模型的別名、參數及中繼資料。

## 設定

使用者透過模型與執行階段政策選擇已註冊的後端。請維持
模型參照的標準形式，並為各模型選取命令列介面執行階段：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

認證資訊仍保留在 OpenClaw 驗證設定檔或擁有該後端之外掛的設定中。
命令、argv、環境、剖析、工作階段、圖片及監控機制皆為
透過 `api.registerCliBackend(...)` 註冊的外掛程式碼。

## 運作方式

1. 依提供者前綴（`claude-cli/...`）選取後端。
2. 使用相同的 OpenClaw 提示詞與工作區內容建構系統提示詞。
3. 使用工作階段 ID（若支援）執行命令列介面，使歷程保持一致。隨附的 `claude-cli` 後端會為每個 OpenClaw 工作階段維持一個 Claude stdio 程序，並透過 stream-json stdin 傳送後續輪次。
4. 剖析輸出（JSON 或純文字）並傳回最終文字。
5. 依後端持久保存工作階段 ID，讓後續輪次重複使用相同的命令列介面工作階段。

## 逾時與長時間執行的工作

命令列介面後端有兩項互相獨立的限制：

- `agents.defaults.timeoutSeconds` 限制整個代理程式輪次。一般閘道輪次會沿用預設的 48 小時；`0` 會使輪次預算不受限制。已儲存的覆寫值（例如 `600`）會取代該預設值。
- 命令列介面無輸出監控會停止持續靜默的子程序。每個後端外掛分別管理全新／恢復設定檔，而且即使整體輪次預算不受限制，監控仍會保持啟用。

移除較短的整體逾時覆寫值即可恢復為預設的 48 小時，或設定明確的預算，例如 12 小時：

```bash
# 恢復為預設的 48 小時：
openclaw config unset agents.defaults.timeoutSeconds

# 或選擇明確的 12 小時限制：
openclaw config set agents.defaults.timeoutSeconds 43200
```

在命令列介面內啟動的背景工作仍屬於該命令列介面子程序的一部分。如果父輪次達到整體限制，OpenClaw 會同時停止該子程序及其命令列介面內部的背景工作。若要執行持久的長時間工作，請使用已分離的 OpenClaw [子代理程式](/zh-TW/tools/subagents)或 [ACP 代理程式](/zh-TW/tools/acp-agents)；已分離的子代理程式預設沒有執行逾時。

`openclaw agent` 命令也有自己的要求期限。其 600 秒備援預設值適用於該次命令叫用，而非一般閘道輪次；請參閱 [`openclaw agent`](/zh-TW/cli/agent)。

### Claude 命令列介面特定事項

隨附的 `claude-cli` 後端優先使用 Claude Code 的原生技能解析器。當目前的技能快照至少包含一項具有實體化路徑的已選技能時，OpenClaw 會透過 `--plugin-dir` 傳入暫時的 Claude Code 外掛，並從附加的系統提示詞中省略重複的 OpenClaw 技能目錄。若沒有實體化的外掛技能，OpenClaw 會保留提示詞目錄作為備援。技能環境／API 金鑰覆寫仍會套用至該次執行的子程序環境。

Claude 命令列介面有自己的非互動式權限模式；OpenClaw 會將其對應至現有的執行政策，而不新增 Claude 專用設定。對於由 OpenClaw 管理的 Claude 即時工作階段，有效的執行政策具有最終決定權：YOLO（`tools.exec.mode: "full"`）通常會使用 `--permission-mode bypassPermissions` 啟動 Claude，而限制性政策則會使用 `--permission-mode default`。以 root 執行的閘道也會使用 `default`，因為 Claude Code 不允許 root 使用略過模式；OpenClaw 仍會依設定的執行政策回應 Claude 的 stdio 工具控制要求。各代理程式的 `agents.entries.*.tools.exec` 設定會覆寫該代理程式的全域 `tools.exec`。Anthropic 外掛會正規化 Claude 的權限旗標，使其符合有效政策與主機限制。

該後端也會將 OpenClaw 的 `/think` 層級對應至 Claude Code 原生的 `--effort` 旗標：`minimal`/`low` -> `low`、`medium` -> `medium`，而 `high`/`xhigh`/`max` 則直接傳遞。這能讓訂閱支援的 Claude 命令列介面與 API 金鑰路徑，維持相同的 Fable 5 支援投入程度。`adaptive` 會移除已設定的 `--effort` 旗標且不提供替代值，因此 Claude Code 會依其自身環境、設定及模型預設值解析有效投入程度。其他命令列介面後端必須由其擁有者外掛宣告等效的 argv 對應器，`/think` 才會影響所產生的命令列介面。

OpenClaw 必須先在同一部主機上登入 Claude Code，才能使用 `claude-cli`：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安裝必須在持久保存的容器家目錄內安裝並登入 Claude Code，而不能只在主機上完成；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。

閘道服務必須能在 `PATH` 上解析 `claude`。若使用非標準路徑，
請註冊小型包裝後端外掛。

## 工作階段

- 如果命令列介面支援工作階段，請使用 `{sessionId}` 預留位置設定 `sessionArgs`（例如 `["--session-id", "{sessionId}"]`）。
- 如果命令列介面使用具有不同旗標的恢復子命令，請設定 `resumeArgs`（恢復時取代 `args`），並可選擇為非 JSON 恢復設定 `resumeOutput`。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存則使用新的 UUID）。
  - `existing`：僅在先前已儲存工作階段 ID 時傳送。
  - `none`：永不傳送工作階段 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"` 及 `input: "stdin"`，因此後續輪次會在即時 Claude 程序仍運作時重複使用該程序，包括省略傳輸欄位的自訂設定。如果閘道重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 恢復。恢復前，系統會根據可讀取的專案逐字稿驗證已儲存的工作階段 ID；若逐字稿遺失，系統會清除繫結（記錄為 `reason=transcript-missing`），而不會在 `--resume` 下悄悄啟動全新工作階段。
- Claude 即時工作階段會維持有界的 JSONL 輸出防護：每輪 8 MiB 及 20,000 行原始 JSONL。
- 已儲存的命令列介面工作階段是由提供者管理的連續性。預設停用自動重設；`/reset` 及明確的每日或閒置 `session.reset` 政策仍會中斷工作階段。
- 全新的命令列介面工作階段通常只會從 OpenClaw 的壓縮摘要及壓縮後尾端重新植入內容。若要復原在壓縮前失效的短工作階段，後端可透過 `reseedFromRawTranscriptWhenUncompacted: true` 選擇啟用此功能。原始逐字稿的重新植入仍有界，且僅限安全的失效情況，例如命令列介面逐字稿遺失、孤立的工具使用尾端、訊息政策／系統提示詞／cwd／MCP 變更，或工作階段過期重試；驗證設定檔或認證資訊週期變更絕不會重新植入原始逐字稿歷程。

序列化：`serialize: true` 會維持同一通道內執行的順序（多數命令列介面會在單一提供者通道上序列化）。當選取的驗證身分變更時，OpenClaw 也會捨棄已儲存命令列介面工作階段的重複使用，包括驗證設定檔 ID、靜態 API 金鑰、靜態權杖或命令列介面所公開的 OAuth 帳戶身分變更；僅輪替 OAuth 存取／重新整理權杖不會中斷工作階段。如果命令列介面沒有穩定的 OAuth 帳戶 ID，OpenClaw 會讓該命令列介面自行強制執行其恢復權限。

## claude-cli 工作階段的備援前置內容

當 `claude-cli` 嘗試容錯移轉至[`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover)中的非命令列介面候選項目時，OpenClaw 會使用從 Claude Code 本機 JSONL 逐字稿（位於 `~/.claude/projects/` 下，依工作區建立索引鍵）擷取的內容前置段，為下一次嘗試植入內容。若沒有此植入內容，備援提供者會從空白狀態開始，因為 OpenClaw 自身的工作階段逐字稿對 `claude-cli` 執行而言是空的。

- 前置內容會優先採用最新的 `/compact` 摘要或 `compact_boundary` 標記，接著在字元預算內附加界線後最近的輪次。界線前的輪次會被捨棄，因為摘要已代表其內容。
- 工具區塊會合併為精簡的 `(tool call: name)` 及 `(tool result: …)` 提示，以如實反映提示詞預算；過大的摘要會遭截斷並標示為 `(truncated)`。
- 同一提供者的 `claude-cli` 至 `claude-cli` 備援會依賴 Claude 自身的 `--resume`，並略過前置內容。
- 植入內容會重複使用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片

外掛作者使用 `imageArg` 宣告圖片路徑支援：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔。如果已設定 `imageArg`，這些路徑會作為命令列介面引數傳入；否則 OpenClaw 會將檔案路徑附加至提示詞（路徑注入），這適用於會從純文字路徑自動載入本機檔案的命令列介面。

## 輸入與輸出

- `output: "text"`（預設）將 stdout 視為最終回應。
- `output: "json"` 會嘗試剖析 JSON，並擷取文字及工作階段 ID。
- `output: "jsonl"` 會剖析 JSONL 串流，並擷取最終代理程式訊息，以及存在時的工作階段識別碼。
- 對於 Gemini 命令列介面的 JSON 輸出，當 `usage` 缺少或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從 `stats` 讀取用量。隨附的 Gemini 命令列介面轉接器使用 `stream-json`。

輸入模式：

- `input: "arg"`（預設）將提示詞作為最後一個命令列介面引數傳遞。
- `input: "stdin"` 透過 stdin 傳送提示詞。
- 如果提示詞非常長且已設定 `maxPromptArgChars`，則改用 stdin。

## 外掛擁有的預設值

命令列介面後端預設值是外掛介面的一部分：

- 外掛使用 `api.registerCliBackend(...)` 註冊這些預設值。
- 後端 `id` 會成為模型參照中的提供者前綴。
- 命令、argv、環境、剖析器、工作階段及監視程序行為均保留在外掛程式碼中。
- 後端專屬的正規化仍由外掛透過選用的 `normalizeConfig` 掛鉤負責。

Anthropic 擁有 `claude-cli`，Google 擁有 `google-gemini-cli`。OpenAI Codex 代理程式執行會透過 `openai/*` 使用 Codex 應用程式伺服器控管機制；OpenClaw 不再註冊隨附的 `codex-cli` 後端。

隨附的 Anthropic 外掛會為 `claude-cli` 註冊：

| 鍵                    | 值                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArgs`         | `["--session-id", "{sessionId}"]`                                                                                                                                                                             |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

隨附的 Google 外掛會為 `google-gemini-cli` 註冊：

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

先決條件：本機必須已安裝 Gemini 命令列介面，並以 `gemini` 的名稱位於 `PATH` 上（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini 命令列介面輸出注意事項：

- 預設的 `stream-json` 剖析器會讀取助理 `message` 事件、工具事件、最終 `result` 用量，以及致命的 Gemini 錯誤事件。
- 當 `usage` 不存在或為空時，用量會退回使用 `stats`；`stats.cached` 會正規化為 OpenClaw `cacheRead`，而如果缺少 `stats.input`，則輸入權杖會衍生自 `stats.input_tokens - stats.cached`。

## 文字轉換疊加層

需要少量提示詞／訊息相容性介接層的外掛，可以宣告雙向文字轉換，而不必取代提供者或命令列介面後端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 會重寫傳遞給命令列介面的系統提示詞與使用者提示詞。`output` 會在 OpenClaw 處理自己的控制標記及頻道遞送之前，重寫串流助理文字與剖析後的最終文字；對於由提供者支援的模型呼叫，它也會在串流修復後、工具執行前，還原結構化工具呼叫引數中的字串值。原始提供者 JSON 片段會保持不變；使用端應使用結構化的部分、結束或結果承載資料。

對於會發出提供者專屬 JSONL 事件的命令列介面，請在該後端的設定上設定 `jsonlDialect`：Claude Code 相容串流使用 `claude-stream-json`，Gemini 命令列介面 `stream-json` 事件使用 `gemini-stream-json`。

## 原生壓縮的擁有權

某些命令列介面後端會執行自行壓縮對話記錄的代理程式，因此 OpenClaw 不得對它們執行防護摘要器——否則會與後端自身的壓縮機制衝突，並可能使該輪次直接失敗。

`claude-cli` 沒有控管機制端點（Claude Code 會在內部進行壓縮），因此它會宣告 `ownsNativeCompaction: true`，而 OpenClaw 的壓縮路徑會原封不動地傳回工作階段項目。OpenClaw 會透過 Claude Code 文件記載的 [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) 傳遞該次執行的有效情境預算，使原生自動壓縮與設定的 Anthropic `contextTokens` 限制保持一致。Codex 等使用原生控管機制的工作階段則會繼續路由至其控管機制的壓縮端點。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

只有在後端確實擁有壓縮機制時，才宣告 `ownsNativeCompaction`：它必須能可靠地將自身對話記錄限制在接近情境視窗的範圍內，並持久保存可恢復的工作階段（例如 `--resume` / `--session-id`），否則延後處理的工作階段可能持續超出預算。

## 隨附的 MCP 疊加層

命令列介面後端不會直接接收 OpenClaw 工具呼叫，但後端可以透過 `bundleMcp: true` 選擇使用產生的 MCP 設定疊加層。目前隨附的行為：

- `claude-cli`：產生嚴格的 MCP 設定檔。
- `google-gemini-cli`：產生 Gemini 系統設定檔。

啟用隨附的 MCP 時，OpenClaw 會：

- 啟動迴路 HTTP MCP 伺服器，向命令列介面程序公開閘道工具，並使用只在目前執行嘗試期間有效的每次執行情境授權（`OPENCLAW_MCP_TOKEN`）進行驗證；
- 將工具存取權繫結至閘道所選的工作階段、帳號及頻道情境，而不是信任子程序標頭；
- 載入目前工作區已啟用的隨附 MCP 伺服器，並將其與現有後端 MCP 設定／系統設定結構合併；
- 使用擁有此外掛所提供、由後端擁有的整合模式重寫啟動設定。

排程工作等設有 `toolsAllow` 的受限執行，需要精確的
後端擁有轉譯。隨附的 `claude-cli` 後端會停用 Claude 的
原生工具及使用者、專案和本機自訂內容，包括掛鉤、
外掛、代理程式、Skills 及 `CLAUDE.md`。接著，它會透過授權範圍限定的 MCP 伺服器公開每個允許的
OpenClaw 工具。這會讓檔案系統、
程序、exec、核准和沙箱政策保留在 OpenClaw 內部，而不會將
權限擴大至 Claude 的原生工具或自訂程序。同一份 MCP
清單會在 Claude 產生的設定中強制執行，閘道也會在工具
列出及執行時再次強制執行。在產生授權前，核心會拒絕
任何命名原始允許清單以外 MCP 權限的後端
轉譯。沒有精確轉譯的後端仍會以封閉方式失敗。

如果未啟用任何 MCP 伺服器，只要後端選擇使用隨附的 MCP，OpenClaw 仍會注入嚴格設定，讓背景執行保持隔離。

以工作階段為範圍的隨附 MCP 執行環境會快取以供工作階段內重複使用，並在閒置 10 分鐘後清除。驗證探查、slug 產生及主動記憶回想等一次性嵌入式執行，會要求在執行結束時清理，確保 stdio 子程序及可串流 HTTP/SSE 串流不會比該次執行存續更久。

對於 `claude-cli`，相容且已選取或排序的 OpenClaw OAuth／權杖設定檔
會轉送至該 Claude 子程序。這會讓每個代理程式的設定檔成為該輪次的權威來源，
同時在不存在相容設定檔時保留 Claude 的原生主機登入。

## 重新植入歷程記錄上限

從先前的 OpenClaw 對話記錄植入新的命令列介面工作階段時（例如在 `session_expired` 重試後），會限制呈現的 `<conversation_history>` 區塊，以防重新植入提示詞過度膨脹。預設為 12,288 個字元（約 3,000 個權杖）。

Claude 命令列介面後端會改為依解析後的 Claude 情境視窗縮放此上限：較大的情境視窗會取得較大的先前歷程記錄片段，最高不超過固定上限；其他命令列介面後端則維持保守的預設值。此上限僅管控重新植入提示詞中的先前歷程記錄區塊。

## 限制

- OpenClaw 不會將工具呼叫注入命令列介面後端通訊協定。後端只有在選擇加入 `bundleMcp: true` 時，才會看到閘道工具。
- 串流處理依後端而異：部分後端會串流 JSONL，其他後端則會緩衝至結束。
- 結構化輸出取決於命令列介面本身的 JSON 格式。

## 疑難排解

| 症狀                  | 修正方式                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| 找不到命令列介面      | 將命令列介面加入閘道服務的 `PATH`，或更新所屬外掛已註冊的命令。 |
| 模型名稱錯誤          | 更新外掛的 `modelAliases` 對應。                                                    |
| 工作階段無法延續      | 檢查外掛的 `sessionArgs` 和 `sessionMode`。                                            |
| 圖片遭忽略            | 檢查外掛的 `imageArg` 和命令列介面的檔案路徑支援。                                 |

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
