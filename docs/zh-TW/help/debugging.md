---
read_when:
    - 你需要檢查原始模型輸出是否有推理洩漏
    - 您想要在反覆調整時以監看模式執行 Gateway
    - 你需要一套可重複執行的偵錯工作流程
summary: 除錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 除錯
x-i18n:
    generated_at: "2026-05-02T20:49:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

串流輸出的偵錯輔助工具，特別適用於提供者將推理混入一般文字時。

## 執行階段偵錯覆寫

在聊天中使用 `/debug` 來設定**僅限執行階段**的設定覆寫（記憶體中，而非磁碟）。
`/debug` 預設為停用；使用 `commands.debug: true` 啟用。
當你需要切換冷門設定而不編輯 `openclaw.json` 時，這很方便。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並回到磁碟上的設定。

## 工作階段追蹤輸出

當你想在單一工作階段中查看 Plugin 擁有的追蹤/偵錯行，而不開啟完整詳細模式時，請使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 查看 Plugin 診斷資訊，例如 Active Memory 偵錯摘要。
一般的詳細狀態/工具輸出繼續使用 `/verbose`，而僅限執行階段的設定覆寫則繼續使用 `/debug`。

## Plugin 生命週期追蹤

當 Plugin 生命週期命令感覺很慢，而你需要內建的階段分解來檢查 Plugin 中繼資料、探索、登錄、執行階段鏡像、設定變更與重新整理工作時，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。追蹤是選擇性開啟，並寫入 stderr，因此 JSON 命令輸出仍可解析。

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

在使用 CPU profiler 之前，先用這個調查 Plugin 生命週期。
如果命令是從原始碼 checkout 執行，建議在 `pnpm build` 後使用 `node dist/entry.js ...` 測量已建置的執行階段；`pnpm openclaw ...` 也會測到原始碼執行器的額外成本。

## 暫時性 CLI 偵錯計時

OpenClaw 保留 `src/cli/debug-timing.ts` 作為本機調查的小型輔助工具。
它刻意預設不接入 CLI 啟動、命令路由或任何命令。只在偵錯慢速命令時使用，然後在送出行為變更前移除 import 和 span。

當命令很慢，而你需要在決定要使用 CPU profiler 或修正特定子系統之前，快速取得階段分解時，請使用這個工具。

### 新增暫時性 span

在你正在調查的程式碼附近加入輔助工具。例如，在偵錯 `openclaw models list` 時，`src/commands/models/list.list-command.ts` 中的暫時性 patch 可能如下：

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

準則：

- 暫時性階段名稱以 `debug:` 為前綴。
- 只在疑似慢速區段周圍加入少量 span。
- 優先使用像 `registry`、`auth_store` 或 `rows` 這類較寬泛的階段，而不是輔助工具名稱。
- 同步工作使用 `time()`，promise 使用 `timeAsync()`。
- 保持 stdout 乾淨。輔助工具會寫入 stderr，因此命令 JSON 輸出仍可解析。
- 在開啟最終修正 PR 前，移除暫時性 import 和 span。
- 在 issue 或 PR 中包含計時輸出或簡短摘要，用來說明最佳化。

### 以可讀輸出執行

可讀模式最適合即時偵錯：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

來自暫時性 `models list` 調查的範例輸出：

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

| 階段                                     |       時間 | 含意                                                                                                    |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile store 載入是最大的成本，應該優先調查。                                                    |
| `debug:models:list:ensure_models_json`   |       5.0s | 同步 `models.json` 成本足夠高，值得檢查快取或略過條件。                                                |
| `debug:models:list:load_model_registry`  |       5.9s | 登錄建構與提供者可用性工作也是有意義的成本。                                                          |
| `debug:models:list:read_registry_models` |       2.4s | 讀取所有登錄模型並非免費，對 `--all` 可能重要。                                                        |
| 列附加階段                               | 總計 3.2s | 建立五個顯示列仍需數秒，因此篩選路徑值得更仔細檢查。                                                  |
| `debug:models:list:print_model_table`    |        0ms | 轉譯不是瓶頸。                                                                                         |

這些發現已足以引導下一個 patch，而不需要在生產路徑中保留計時程式碼。

### 以 JSON 輸出執行

當你想儲存或比較計時資料時，請使用 JSON 模式：

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

### 送出前清理

開啟最終 PR 前：

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

除非該 PR 明確新增永久診斷介面，否則此命令不應回傳任何暫時性 instrumentation 呼叫位置。對一般效能修正，只保留行為變更、測試，以及附上計時證據的簡短說明。

對更深層的 CPU 熱點，請使用 Node profiling（`--cpu-prof`）或外部 profiler，而不是加入更多計時包裝器。

## Gateway 監看模式

為了快速迭代，請在檔案監看器下執行 gateway：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為 `openclaw-gateway-watch-main` 的 tmux 工作階段（或像 `openclaw-gateway-watch-dev-19001` 這類與 profile/port 相關的變體），並從互動式終端機自動附加。非互動式 shell、CI 和 agent exec 呼叫會保持分離，並改為列印附加指示。需要時手動附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane 執行原始監看器：

```bash
node scripts/watch-node.mjs gateway --force
```

不想使用 tmux 時，請使用前景模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

停用自動附加，同時保留 tmux 管理：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

偵錯啟動/執行階段熱點時，分析受監看的 Gateway CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

監看包裝器會在呼叫 Gateway 前消耗 `--benchmark`，並在每次 Gateway 子程序結束時，將一個 V8 `.cpuprofile` 寫入 `.artifacts/gateway-watch-profiles/`。停止或重新啟動受監看的 gateway 以 flush 目前的 profile，然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

當你希望 profile 存到其他位置時，使用 `--benchmark-dir <path>`。

tmux 包裝器會將常見的非秘密執行階段選擇器帶入 pane，例如 `OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。將提供者憑證放在你的正常 profile/config 中，或針對一次性的短期秘密使用原始前景模式。
受管理的 tmux pane 也預設使用彩色 Gateway 記錄以提升可讀性；啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

監看器會在 `src/` 下與建置相關的檔案、extension 原始碼檔案、extension `package.json` 與 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、`package.json` 和 `tsdown.config.ts` 變更時重新啟動。Extension 中繼資料變更會在不強制 `tsdown` 重建的情況下重新啟動 gateway；原始碼與設定變更仍會先重建 `dist`。

在 `gateway:watch` 後加入任何 gateway CLI 旗標，它們會在每次重新啟動時傳遞。重新執行相同的 watch 命令會重新產生命名 tmux pane，而原始監看器仍會保有其單一監看器鎖，因此重複的監看器父程序會被取代，而不是堆疊起來。

## 開發 profile + 開發 gateway（--dev）

使用開發 profile 來隔離狀態，並啟動安全、可拋棄的設定以進行偵錯。有**兩個** `--dev` 旗標：

- **全域 `--dev`（profile）：** 將狀態隔離在 `~/.openclaw-dev` 下，並將 gateway port 預設為 `19001`（衍生 port 也會隨之位移）。
- **`gateway --dev`：告訴 Gateway 在缺少時自動建立預設 config + workspace**（並略過 BOOTSTRAP.md）。

建議流程（開發 profile + 開發 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你還沒有全域安裝，請透過 `pnpm openclaw ...` 執行 CLI。

這會執行：

1. **Profile 隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 也會相應位移）

2. **開發 bootstrap**（`gateway --dev`）
   - 若缺少，寫入最小 config（`gateway.mode=local`，bind loopback）。
   - 將 `agent.workspace` 設為開發 workspace。
   - 設定 `agent.skipBootstrap=true`（無 BOOTSTRAP.md）。
   - 若缺少，植入 workspace 檔案：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 預設身分：**C3‑PO**（protocol droid）。
   - 在開發模式中略過 channel providers（`OPENCLAW_SKIP_CHANNELS=1`）。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域**設定檔旗標，會被某些執行器消耗掉。如果需要明確指定，請使用環境變數形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會清除設定、憑證、工作階段和開發工作區（使用
`trash`，而非 `rm`），然後重新建立預設開發設定。

<Tip>
如果非開發用 Gateway 已在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄 (OpenClaw)

OpenClaw 可以在任何篩選/格式化之前記錄**原始助理串流**。
這是查看推理是否以純文字增量送達
（或作為獨立思考區塊送達）的最佳方式。

透過 CLI 啟用：

```bash
pnpm gateway:watch --raw-stream
```

選用路徑覆寫：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效的環境變數：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

預設檔案：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始區塊記錄 (pi-mono)

若要在 **OpenAI 相容區塊**被解析成區塊前擷取它們，
pi-mono 會公開一個獨立的記錄器：

```bash
PI_RAW_STREAM=1
```

選用路徑：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

預設檔案：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：這只會由使用 pi-mono 的
> `openai-completions` 提供者的程序發出。

## 安全注意事項

- 原始串流日誌可能包含完整提示、工具輸出和使用者資料。
- 將日誌保存在本機，並在偵錯後刪除。
- 如果要分享日誌，請先清除祕密和 PII。

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [常見問題](/zh-TW/help/faq)
