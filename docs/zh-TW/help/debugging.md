---
read_when:
    - 您需要檢查原始模型輸出是否有推理洩漏
    - 您想在迭代開發時以監看模式執行 Gateway
    - 你需要一套可重複執行的除錯工作流程
summary: 除錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 偵錯
x-i18n:
    generated_at: "2026-04-30T03:10:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

用於串流輸出的偵錯輔助工具，特別適合供應商將推理內容混入一般文字時使用。

## 執行階段偵錯覆寫

在聊天中使用 `/debug` 來設定**僅限執行階段**的設定覆寫（記憶體中，而非磁碟）。
`/debug` 預設為停用；使用 `commands.debug: true` 啟用。
當你需要切換隱晦設定而不想編輯 `openclaw.json` 時，這很方便。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並回到磁碟上的設定。

## 工作階段追蹤輸出

當你想在單一工作階段中查看 Plugin 擁有的追蹤／偵錯行，
且不想開啟完整詳細模式時，使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 查看 Plugin 診斷資訊，例如 Active Memory 偵錯摘要。
一般詳細狀態／工具輸出請繼續使用 `/verbose`，僅限執行階段的設定覆寫則繼續使用
`/debug`。

## Plugin 生命週期追蹤

當 Plugin 生命週期命令感覺很慢，
且你需要 Plugin 中繼資料、探索、登錄、執行階段鏡像、
設定變更與重新整理工作的內建階段拆解時，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。
此追蹤是選擇性啟用，並寫入 stderr，因此 JSON 命令輸出仍可解析。

範例：

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

範例輸出：

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

在使用 CPU 分析器之前，先用這個調查 Plugin 生命週期。
如果命令是從原始碼 checkout 執行，建議在 `pnpm build` 後使用
`node dist/entry.js ...` 測量建置後的執行階段；`pnpm openclaw ...`
也會測量原始碼 runner 的額外負擔。

## 暫時性 CLI 偵錯計時

OpenClaw 保留 `src/cli/debug-timing.ts` 作為本機調查的小型輔助工具。
它刻意預設不接入 CLI 啟動、命令路由或任何命令。只在偵錯慢速命令時使用，
然後在落地行為變更前移除匯入與 span。

當某個命令很慢，而你需要快速階段拆解，
以判斷是要使用 CPU 分析器還是修正特定子系統時，使用這個工具。

### 加入暫時性 span

在你正在調查的程式碼附近加入輔助工具。例如，偵錯
`openclaw models list` 時，
`src/commands/models/list.list-command.ts` 中的暫時性修補可能如下：

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

指引：

- 暫時性階段名稱請加上 `debug:` 前綴。
- 只在疑似慢速區段周圍加入少量 span。
- 優先使用 `registry`、`auth_store` 或 `rows` 等寬泛階段，而不是輔助函式名稱。
- 同步工作使用 `time()`，promise 使用 `timeAsync()`。
- 保持 stdout 乾淨。此輔助工具會寫入 stderr，因此命令 JSON 輸出仍可解析。
- 開啟最終修正 PR 前，移除暫時性匯入與 span。
- 在 issue 或 PR 中附上計時輸出或簡短摘要，以說明最佳化依據。

### 以可讀輸出執行

可讀模式最適合即時偵錯：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

暫時性 `models list` 調查的範例輸出：

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

此輸出的發現：

| 階段                                     |       時間 | 代表意義                                                                                              |
| ---------------------------------------- | ---------: | ----------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile store 載入是最大的成本，應該先調查。                                                    |
| `debug:models:list:ensure_models_json`   |       5.0s | 同步 `models.json` 的成本高到值得檢查快取或跳過條件。                                                 |
| `debug:models:list:load_model_registry`  |       5.9s | 登錄建構與供應商可用性工作也是有意義的成本。                                                         |
| `debug:models:list:read_registry_models` |       2.4s | 讀取所有登錄模型並非免費，對 `--all` 可能很重要。                                                     |
| 資料列附加階段                           | 總計 3.2s | 建立五個顯示資料列仍需數秒，因此篩選路徑值得更深入檢查。                                             |
| `debug:models:list:print_model_table`    |        0ms | 算繪不是瓶頸。                                                                                        |

這些發現足以引導下一個修補，而不需要在生產路徑中保留計時程式碼。

### 以 JSON 輸出執行

當你想儲存或比較計時資料時，使用 JSON 模式：

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

每一行 stderr 都是一個 JSON 物件：

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 落地前清理

開啟最終 PR 前：

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

除非該 PR 明確新增永久診斷介面，否則此命令不應回傳任何暫時性 instrumentation 呼叫位置。
一般效能修正只保留行為變更、測試，以及帶有計時證據的簡短說明。

對於更深層的 CPU 熱點，請使用 Node profiling (`--cpu-prof`) 或外部分析器，
而不是加入更多計時 wrapper。

## Gateway 監看模式

為了快速迭代，請在檔案監看器下執行 gateway：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為
`openclaw-gateway-watch-main` 的 tmux 工作階段
（或 profile／port 專用變體，例如
`openclaw-gateway-watch-dev-19001`），並從互動式終端機自動附加。
非互動式 shell、CI 和 agent exec 呼叫會保持分離，並改為列印附加指示。
需要時手動附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane 會執行原始監看器：

```bash
node scripts/watch-node.mjs gateway --force
```

不想使用 tmux 時，使用前景模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

停用自動附加，同時保留 tmux 管理：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

tmux wrapper 會將常見的非機密執行階段 selector 帶入 pane，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。請將供應商憑證放在一般 profile／config 中，
或對一次性暫時機密使用原始前景模式。

監看器會在 `src/` 下與建置相關的檔案、extension 原始碼檔案、
extension `package.json` 和 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、
`package.json` 以及 `tsdown.config.ts` 變更時重新啟動。Extension 中繼資料變更會重新啟動
gateway，而不強制執行 `tsdown` 重建；原始碼與設定變更仍會先重建 `dist`。

在 `gateway:watch` 後加入任何 gateway CLI 旗標，它們就會在每次重新啟動時傳遞。
重新執行相同的監看命令會重生具名 tmux pane，而原始監看器仍會保留其單一監看器鎖定，
因此重複的監看器父程序會被取代，而不是持續堆積。

## 開發 profile + 開發 gateway (--dev)

使用開發 profile 隔離狀態，並啟動安全、可丟棄的設定用於偵錯。
有**兩個** `--dev` 旗標：

- **全域 `--dev`（profile）：** 將狀態隔離在 `~/.openclaw-dev` 下，並將預設 gateway port 設為 `19001`（衍生 port 會隨之位移）。
- **`gateway --dev`：告訴 Gateway 在缺少時自動建立預設 config + workspace**（並跳過 BOOTSTRAP.md）。

建議流程（開發 profile + 開發 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你還沒有全域安裝，請透過 `pnpm openclaw ...` 執行 CLI。

這會做的事：

1. **Profile 隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser／canvas 會相應位移）

2. **開發 bootstrap**（`gateway --dev`）
   - 缺少時寫入最小 config（`gateway.mode=local`，綁定 loopback）。
   - 將 `agent.workspace` 設為開發 workspace。
   - 設定 `agent.skipBootstrap=true`（沒有 BOOTSTRAP.md）。
   - 缺少時植入 workspace 檔案：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 預設身分：**C3‑PO**（禮儀機器人）。
   - 在開發模式中跳過頻道供應商（`OPENCLAW_SKIP_CHANNELS=1`）。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域** profile 旗標，某些 runner 會吃掉它。如果你需要明確寫出來，請使用 env var 形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會清除 config、憑證、工作階段和開發 workspace（使用
`trash`，不是 `rm`），然後重新建立預設開發設定。

<Tip>
如果非開發 gateway 已在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄（OpenClaw）

OpenClaw 可以在任何篩選／格式化前記錄**原始 assistant stream**。
這是查看推理內容是否以純文字 delta 抵達
（或以獨立 thinking block 抵達）的最佳方式。

透過 CLI 啟用：

```bash
pnpm gateway:watch --raw-stream
```

可選路徑覆寫：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效環境變數：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

預設檔案：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始片段記錄 (pi-mono)

若要在**原始 OpenAI 相容片段**被剖析成區塊之前擷取它們，
pi-mono 提供獨立的記錄器：

```bash
PI_RAW_STREAM=1
```

可選路徑：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

預設檔案：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：這只會由使用 pi-mono 的
> `openai-completions` 提供者的程序發出。

## 安全注意事項

- 原始串流記錄可能包含完整提示、工具輸出和使用者資料。
- 將記錄保留在本機，並在偵錯後刪除。
- 如果你分享記錄，請先清除秘密和 PII。

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [FAQ](/zh-TW/help/faq)
