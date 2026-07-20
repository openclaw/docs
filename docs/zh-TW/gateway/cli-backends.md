---
read_when:
    - 你希望在 API 供應商失敗時有可靠的備援機制
    - 你正在執行本機 AI 命令列介面，並想要重複使用它們
    - 你想瞭解用於命令列介面後端工具存取的 MCP 回送橋接器
summary: 命令列介面後端：本機 AI 命令列介面備援，搭配選用的 MCP 工具橋接器
title: 命令列介面後端
x-i18n:
    generated_at: "2026-07-20T00:48:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d71300fa7383b021ee12bdeafedfc48cb9f0d7746a02efff5e609544c7b4b081
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw 可在 API 提供者中斷、受到速率限制或行為異常時，執行本機 AI 命令列介面作為純文字備援。其設計刻意採取保守策略：

- 不會直接注入 OpenClaw 工具，但具有 `bundleMcp: true` 的後端可透過回送 MCP 橋接器接收閘道工具。
- 支援 JSONL 的命令列介面可使用 JSONL 串流。
- 支援工作階段，因此後續輪次能保持連貫。
- 若命令列介面接受圖片路徑，圖片便會直接傳遞。

請將它用作確保文字回應「永遠可用」的安全網，而非主要路徑。若需要具備 ACP 工作階段控制、背景工作、討論串／對話繫結，以及持久外部程式設計工作階段的完整控制框架執行環境，請改用 [ACP 代理程式](/zh-TW/tools/acp-agents)；命令列介面後端並非 ACP。

<Tip>
  正在建置新的後端外掛嗎？請參閱[命令列介面後端外掛](/zh-TW/plugins/cli-backend-plugins)。本頁說明如何設定及操作已註冊的後端。
</Tip>

## 快速開始

隨附的 Anthropic 外掛會註冊預設的 `claude-cli` 後端，因此只要已安裝並登入 Claude Code，無須其他設定即可使用：

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

未設定明確的代理程式清單時，`main` 是預設代理程式 ID；否則請換成你自己的代理程式 ID。

若閘道在 launchd/systemd 下以精簡的 `PATH` 執行，請明確指定二進位檔：

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

若你在閘道主機上使用隨附的命令列介面後端作為主要訊息提供者，當設定中的模型參照或 `agents.defaults.cliBackends` 下參照該後端時，OpenClaw 會自動載入擁有該後端的隨附外掛。

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

主要提供者因驗證、速率限制或逾時而失敗時，已設定的備援仍可使用，即使它們不在 `agents.defaults.modelPolicy.allow` 中亦然。只有當使用者也應能透過 `/model`、工作階段覆寫或 `--model` 直接選取命令列介面後端模型時，才應將該模型加入此原則。`agents.defaults.models` 僅管理各模型的別名、參數與中繼資料。

## 設定

所有命令列介面後端皆位於 `agents.defaults.cliBackends` 下，並以提供者 ID 作為索引鍵（例如 `claude-cli`、`my-cli`）。提供者 ID 會成為模型參照的左側：`<provider>/<model>`。

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
          // 僅當此後端可在壓縮前，從有界限的原始 OpenClaw 逐字稿歷程
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
2. 使用相同的 OpenClaw 提示詞與工作區內容來建立系統提示詞。
3. 使用工作階段 ID（若支援）執行命令列介面，使歷程保持一致。隨附的 `claude-cli` 後端會為每個 OpenClaw 工作階段維持一個 Claude stdio 程序運作，並透過 stream-json stdin 傳送後續輪次。
4. 剖析輸出（JSON 或純文字）並傳回最終文字。
5. 依後端保存工作階段 ID，使後續輪次重複使用同一個命令列介面工作階段。

## 逾時與長時間執行的工作

命令列介面後端有兩項互相獨立的限制：

- `agents.defaults.timeoutSeconds` 會限制整個代理程式輪次。一般閘道輪次會沿用預設的 48 小時；`0` 會使輪次時限不受限制。已儲存的覆寫值（例如 `600`）會取代該預設值。
- 命令列介面無輸出監控程式會停止持續無輸出的子程序。它在 `agents.defaults.cliBackends.<id>.reliability.watchdog` 下對全新與續接工作階段使用不同的設定檔，而且即使整體輪次時限不受限制，仍會保持啟用。

移除較短的整體逾時覆寫值即可恢復為預設的 48 小時，或設定明確的時限，例如 12 小時：

```bash
# 恢復為預設的 48 小時：
openclaw config unset agents.defaults.timeoutSeconds

# 或選擇明確的 12 小時限制：
openclaw config set agents.defaults.timeoutSeconds 43200
```

在命令列介面內啟動的背景工作仍屬於該命令列介面子程序的一部分。若父輪次達到整體時限，OpenClaw 會同時停止該子程序及其命令列介面內部的背景工作。若要執行持久的長時間工作，請使用已分離的 OpenClaw [子代理程式](/zh-TW/tools/subagents)或 [ACP 代理程式](/zh-TW/tools/acp-agents)；已分離的子代理程式預設沒有執行逾時限制。

`openclaw agent` 命令也有自己的要求期限。其 600 秒的備用預設值僅適用於該次命令叫用，不適用於一般閘道輪次；請參閱 [`openclaw agent`](/zh-TW/cli/agent)。

### Claude 命令列介面細節

隨附的 `claude-cli` 後端優先使用 Claude Code 的原生技能解析器。當目前的技能快照中至少有一個已選取且具有具體化路徑的技能時，OpenClaw 會透過 `--plugin-dir` 傳遞暫時的 Claude Code 外掛，並從附加的系統提示詞中省略重複的 OpenClaw 技能目錄。若沒有具體化的外掛技能，OpenClaw 會保留提示詞目錄作為備援。技能環境變數／API 金鑰覆寫仍會套用至該次執行的子程序環境。

Claude 命令列介面有自己的非互動式權限模式；OpenClaw 會將其對應至現有的執行原則，而非新增 Claude 專用設定。對於由 OpenClaw 管理的 Claude 即時工作階段，有效的執行原則具有最終決定權：YOLO（`tools.exec.security: "full"` 和 `tools.exec.ask: "off"`）通常會使用 `--permission-mode bypassPermissions` 啟動 Claude，而限制性原則則會使用 `--permission-mode default` 啟動。以 root 身分執行的閘道也會使用 `default`，因為 Claude Code 會拒絕 root 使用略過模式；OpenClaw 仍會依據已設定的執行原則，回應 Claude 的 stdio 工具控制要求。各代理程式的 `agents.list[].tools.exec` 設定會覆寫該代理程式的全域 `tools.exec`。原始後端引數仍可包含 `--permission-mode`，但 Claude 即時啟動時會正規化該旗標，使其符合有效原則與主機限制。

此後端也會將 OpenClaw `/think` 等級對應至 Claude Code 原生的 `--effort` 旗標：`minimal`/`low` -> `low`、`medium` -> `medium`，而 `high`/`xhigh`/`max` 則會直接傳遞。這可讓訂閱支援的 Claude 命令列介面與 API 金鑰路由使用相同的 Fable 5 支援投入程度。`adaptive` 會移除已設定的 `--effort` 旗標且不提供替代值，因此 Claude Code 會從其自身的環境、設定與模型預設值解析有效的投入程度。其他命令列介面後端必須由其所屬外掛宣告等效的 argv 對應器，`/think` 才會影響產生的命令列介面。

OpenClaw 必須先在同一主機上登入 Claude Code，才能使用 `claude-cli`：

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 安裝必須在持久化的容器主目錄內安裝並登入 Claude Code，而不能只在主機上進行；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。

只有當 `claude` 二進位檔尚未位於 `PATH` 上時，才設定 `agents.defaults.cliBackends.claude-cli.command`。

## 工作階段

- 若命令列介面支援工作階段，請設定 `sessionArg`（例如 `--session-id`）；若 ID 需要放入多個旗標，則設定 `sessionArgs`（預留位置 `{sessionId}`）。
- 若命令列介面使用具有不同旗標的續接子命令，請設定 `resumeArgs`（續接時取代 `args`），並可選擇設定 `resumeOutput` 以處理非 JSON 續接。
- `sessionMode`：
  - `always`：一律傳送工作階段 ID（若未儲存，則使用新的 UUID）。
  - `existing`：只有先前已儲存工作階段 ID 時才傳送。
  - `none`：永不傳送工作階段 ID。
- `claude-cli` 預設為 `liveSession: "claude-stdio"`、`output: "jsonl"` 和 `input: "stdin"`，因此即時 Claude 程序仍在運作時，後續輪次會重複使用該程序，包括省略傳輸欄位的自訂設定。若閘道重新啟動或閒置程序結束，OpenClaw 會從已儲存的 Claude 工作階段 ID 續接。續接前，系統會針對可讀取的專案逐字稿驗證已儲存的工作階段 ID；若逐字稿遺失，便會清除繫結（記錄為 `reason=transcript-missing`），而不會在 `--resume` 下無提示地啟動全新工作階段。
- Claude 即時工作階段會維持有界限的 JSONL 輸出防護：每輪 8 MiB 和 20,000 行原始 JSONL。
- 已儲存的命令列介面工作階段是由提供者擁有的連續性。預設停用自動重設；`/reset` 與明確的每日或閒置 `session.reset` 原則仍會中斷工作階段。
- 全新的命令列介面工作階段通常只會從 OpenClaw 的壓縮摘要及壓縮後尾端重新植入內容。若要復原在壓縮前失效的短期工作階段，後端可透過 `reseedFromRawTranscriptWhenUncompacted: true` 選擇啟用。原始逐字稿重新植入會維持有界限，且僅限於安全的失效情況，例如命令列介面逐字稿遺失、孤立的工具使用尾端、訊息原則／系統提示詞／cwd／MCP 變更，或工作階段已過期後重試；驗證設定檔或認證資訊時期變更絕不會重新植入原始逐字稿歷程。

序列化：`serialize: true` 會讓同一通道的執行保持有序（多數命令列介面會在單一提供者通道上進行序列化）。選定的驗證身分變更時，OpenClaw 也會停止重複使用已儲存的命令列介面工作階段，包括驗證設定檔 ID、靜態 API 金鑰、靜態權杖或 OAuth 帳戶身分變更（若命令列介面有公開該身分）；僅輪替 OAuth 存取／重新整理權杖不會中斷工作階段。若命令列介面沒有穩定的 OAuth 帳戶 ID，OpenClaw 會讓該命令列介面自行強制執行其續接權限。

## claude-cli 工作階段的備援前置內容

當 `claude-cli` 嘗試容錯移轉至 [`agents.defaults.model.fallbacks`](/zh-TW/concepts/model-failover) 中的非命令列介面候選項目時，OpenClaw 會使用從 Claude Code 本機 JSONL 逐字稿擷取的內容前置資料（位於 `~/.claude/projects/` 下，依工作區設置索引鍵）植入下一次嘗試。若沒有此植入內容，備援提供者會冷啟動，因為 OpenClaw 自身的工作階段逐字稿對 `claude-cli` 執行而言是空的。

- 前置內容會優先使用最新的 `/compact` 摘要或 `compact_boundary` 標記，接著附加邊界之後最近的對話輪次，直到達到字元預算為止。邊界之前的對話輪次會被捨棄，因為摘要已經代表這些內容。
- 工具區塊會合併成精簡的 `(tool call: name)` 和 `(tool result: …)` 提示，以確實遵守提示預算；過大的摘要會被截斷並標記為 `(truncated)`。
- 相同提供者從 `claude-cli` 到 `claude-cli` 的後援機制會依賴 Claude 自己的 `--resume`，並略過前置內容。
- 種子會重複使用現有的 Claude 工作階段檔案路徑驗證，因此無法讀取任意路徑。

## 圖片

如果你的命令列介面接受圖片路徑，請設定 `imageArg`：

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw 會將 base64 圖片寫入暫存檔案。如果已設定 `imageArg`，這些路徑會作為命令列介面引數傳入；否則，OpenClaw 會將檔案路徑附加至提示（路徑注入），這適用於會從純文字路徑自動載入本機檔案的命令列介面。

## 輸入與輸出

- `output: "text"`（預設）會將 stdout 視為最終回應。
- `output: "json"` 會嘗試解析 JSON，並擷取文字與工作階段 ID。
- `output: "jsonl"` 會解析 JSONL 串流，並在存在時擷取最終代理程式訊息與工作階段識別碼。
- 對於 Gemini CLI JSON 輸出，當 `usage` 不存在或為空時，OpenClaw 會從 `response` 讀取回覆文字，並從 `stats` 讀取用量。隨附的 Gemini CLI 預設值使用 `stream-json`；舊的 `--output-format json` 覆寫仍會使用 JSON 解析器。

輸入模式：

- `input: "arg"`（預設）會將提示作為最後一個命令列介面引數傳入。
- `input: "stdin"` 會透過 stdin 傳送提示。
- 如果提示非常長且已設定 `maxPromptArgChars`，則會改用 stdin。

## 外掛擁有的預設值

命令列介面後端預設值是外掛介面的一部分：

- 外掛會使用 `api.registerCliBackend(...)` 註冊這些預設值。
- 後端 `id` 會成為模型參照中的提供者前綴。
- `agents.defaults.cliBackends.<id>` 中的使用者設定仍會覆寫外掛預設值。
- 後端專屬的設定清理仍由外掛透過選用的 `normalizeConfig` 掛鉤負責。

Anthropic 擁有 `claude-cli`，Google 擁有 `google-gemini-cli`。OpenAI Codex 代理程式執行會透過 `openai/*` 使用 Codex 應用程式伺服器控管框架；OpenClaw 不再註冊隨附的 `codex-cli` 後端。

隨附的 Anthropic 外掛會針對 `claude-cli` 註冊：

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

隨附的 Google 外掛會針對 `google-gemini-cli` 註冊：

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

先決條件：本機必須已安裝 Gemini CLI，並在 `PATH` 上以 `gemini` 提供（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）。

Gemini CLI 輸出注意事項：

- 預設的 `stream-json` 解析器會讀取助理 `message` 事件、工具事件、最終 `result` 用量，以及致命的 Gemini 錯誤事件。
- 如果你將 Gemini 引數覆寫為 `--output-format json`，OpenClaw 會將該後端正規化回 `output: "json"`，並從 JSON 的 `response` 欄位讀取回覆文字。
- 當 `usage` 不存在或為空時，用量會回退至 `stats`；`stats.cached` 會正規化為 OpenClaw 的 `cacheRead`，而如果缺少 `stats.input`，輸入權杖數會從 `stats.input_tokens - stats.cached` 推導。

僅在需要時覆寫預設值（最常見的是絕對 `command` 路徑）。

## 文字轉換覆疊

需要小型提示／訊息相容性介接層的外掛，可以宣告雙向文字轉換，而不必取代提供者或命令列介面後端：

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` 會改寫傳給命令列介面的系統提示和使用者提示。`output` 會在 OpenClaw 處理自己的控制標記和頻道傳遞之前，改寫串流助理文字和解析後的最終文字；對於由提供者支援的模型呼叫，它也會在串流修復後、工具執行前，還原結構化工具呼叫引數中的字串值。原始提供者 JSON 片段會維持不變；取用者應使用結構化的部分、結束或結果承載資料。

對於會發出提供者專屬 JSONL 事件的命令列介面，請在該後端的設定中設定 `jsonlDialect`：Claude Code 相容串流使用 `claude-stream-json`，Gemini CLI 的 `stream-json` 事件使用 `gemini-stream-json`。

## 原生壓縮所有權

某些命令列介面後端會執行自行壓縮對話記錄的代理程式，因此 OpenClaw 不得對它們執行保護性摘要器，否則會與後端本身的壓縮互相衝突，並可能導致該輪次直接失敗。

`claude-cli` 沒有控管框架端點（Claude Code 會在內部進行壓縮），因此它會宣告 `ownsNativeCompaction: true`，而 OpenClaw 的壓縮路徑會原封不動地傳回工作階段項目。OpenClaw 會透過 Claude Code 文件所述的 [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) 傳遞該次執行的有效情境預算，使原生自動壓縮與設定的 Anthropic `contextTokens` 限制保持一致。Codex 等原生控管框架工作階段則會繼續路由至其控管框架壓縮端點。

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

僅應為確實擁有壓縮功能的後端宣告 `ownsNativeCompaction`：它必須能可靠地將自己的對話記錄限制在接近情境視窗的範圍內，並保存可恢復的工作階段（例如 `--resume` / `--session-id`），否則延後的工作階段可能持續超出預算。

## 隨附 MCP 覆疊

命令列介面後端不會直接接收 OpenClaw 工具呼叫，但後端可以透過 `bundleMcp: true` 選擇加入產生的 MCP 設定覆疊。目前的隨附行為：

- `claude-cli`：產生嚴格的 MCP 設定檔。
- `google-gemini-cli`：產生 Gemini 系統設定檔。

啟用隨附 MCP 時，OpenClaw 會：

- 啟動一個迴路 HTTP MCP 伺服器，將閘道工具提供給命令列介面程序，並使用僅在目前執行嘗試期間有效的每次執行情境授權（`OPENCLAW_MCP_TOKEN`）進行驗證；
- 將工具存取權繫結至閘道選取的工作階段、帳戶和頻道情境，而不是信任子程序標頭；
- 載入目前工作區已啟用的隨附 MCP 伺服器，並將其與任何現有的後端 MCP 設定／設定值結構合併；
- 使用擁有該後端之外掛所提供的整合模式，改寫啟動設定。

如果未啟用任何 MCP 伺服器，只要後端選擇加入隨附 MCP，OpenClaw 仍會注入嚴格設定，使背景執行維持隔離。

工作階段範圍的隨附 MCP 執行階段會快取並在工作階段內重複使用，接著在閒置 10 分鐘後清除。驗證探測、短代稱產生和主動記憶回想等一次性嵌入式執行，會要求在執行結束時進行清理，使 stdio 子程序和可串流 HTTP/SSE 串流不會在執行結束後繼續存在。

## 重新植入歷程記錄上限

當新的命令列介面工作階段從先前的 OpenClaw 轉錄內容植入資料時（例如在 `session_expired` 重試後），為避免重新植入提示詞急遽膨脹，系統會限制所呈現 `<conversation_history>` 區塊的大小。預設上限為 12,288 個字元（約 3,000 個權杖）。

Claude 命令列介面後端則會依解析出的 Claude 上下文視窗調整此上限：較大的上下文視窗可取得較多先前歷史記錄內容，最高不超過固定上限；其他命令列介面後端仍採用保守的預設值。此上限僅管控重新植入提示詞中的先前歷史記錄區塊。

## 限制

- 無法直接呼叫 OpenClaw 工具：OpenClaw 不會將工具呼叫注入命令列介面後端通訊協定。後端只有在選擇啟用 `bundleMcp: true` 時，才能看到閘道工具。
- 串流處理因後端而異：部分後端會串流 JSONL，其他後端則會緩衝至結束後才輸出。
- 結構化輸出取決於命令列介面本身的 JSON 格式。

## 疑難排解

| 症狀               | 修正方式                                                               |
| --------------------- | ----------------------------------------------------------------- |
| 找不到命令列介面         | 將 `command` 設為完整路徑。                                     |
| 模型名稱錯誤      | 使用 `modelAliases` 將 `provider/model` 對應至命令列介面的模型 ID。 |
| 工作階段無法延續 | 確認已設定 `sessionArg`，且 `sessionMode` 不是 `none`。       |
| 忽略圖片        | 設定 `imageArg`，並確認命令列介面支援檔案路徑。            |

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [本機模型](/zh-TW/gateway/local-models)
