---
read_when:
    - 你需要檢查原始模型輸出是否有推理外洩
    - 你想在反覆調整時以監看模式執行 Gateway
    - 您需要一套可重複的除錯工作流程
summary: 偵錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 偵錯
x-i18n:
    generated_at: "2026-05-10T19:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

串流輸出的偵錯輔助工具，特別適用於提供者將推理混入一般文字時。

## 執行階段偵錯覆寫

在聊天中使用 `/debug` 來設定**僅限執行階段**的設定覆寫（記憶體，不寫入磁碟）。
`/debug` 預設為停用；使用 `commands.debug: true` 啟用。
當你需要切換冷門設定而不想編輯 `openclaw.json` 時，這很方便。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並回到磁碟上的設定。

## 工作階段追蹤輸出

當你想在單一工作階段中查看 Plugin 擁有的追蹤/偵錯行，
但不想開啟完整詳細模式時，請使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 進行 Plugin 診斷，例如 Active Memory 偵錯摘要。
一般詳細狀態/工具輸出請繼續使用 `/verbose`，僅限執行階段的設定覆寫則繼續使用
`/debug`。

## Plugin 生命週期追蹤

當 Plugin 生命週期命令感覺緩慢，而你需要內建的階段拆解來檢查 Plugin 中繼資料、探索、登錄、
執行階段鏡像、設定變更與重新整理工作時，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。
追蹤是選擇性啟用，並寫入 stderr，因此 JSON 命令輸出仍可解析。

範例：

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

輸出範例：

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

在使用 CPU 分析器之前，先用這個調查 Plugin 生命週期。
如果命令是從原始碼 checkout 執行，請在 `pnpm build` 後優先用 `node dist/entry.js ...` 測量建置後的
執行階段；`pnpm openclaw ...` 也會測到原始碼 runner 的額外成本。

## CLI 啟動與命令分析

當命令感覺很慢時，使用已提交的啟動基準測試：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

若要透過一般原始碼 runner 進行一次性分析，請設定
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

原始碼 runner 會加入 Node CPU profile 旗標，並為該命令寫入 `.cpuprofile`。
在替命令程式碼加入暫時性 instrumentation 之前，先使用這個方法。

對於看起來像同步檔案系統或模組載入器工作的啟動停滯，請透過原始碼 runner 加入 Node 的同步 I/O 追蹤旗標：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 預設會讓受監看 Gateway 子程序停用此旗標。
當你明確想在監看模式中取得 Node 同步 I/O 追蹤輸出時，請設定 `OPENCLAW_TRACE_SYNC_IO=1`。

## Gateway 監看模式

若要快速迭代，請在檔案監看器下執行 Gateway：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為
`openclaw-gateway-watch-main` 的 tmux 工作階段（或設定檔/連接埠專用的變體，例如
`openclaw-gateway-watch-dev-19001`），並從互動式終端機自動附加。
非互動式 shell、CI 和 agent exec 呼叫會保持分離，改為列印附加指示。
需要時可手動附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane 會執行原始監看器：

```bash
node scripts/watch-node.mjs gateway --force
```

不想使用 tmux 時，請使用前景模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

保留 tmux 管理但停用自動附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

在偵錯啟動/執行階段熱點時，分析受監看 Gateway 的 CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

監看 wrapper 會在叫用 Gateway 前消耗 `--benchmark`，並在
`.artifacts/gateway-watch-profiles/` 下，為每次 Gateway 子程序結束寫入一個 V8 `.cpuprofile`。
停止或重新啟動受監看的 gateway 以 flush 目前 profile，然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

當你想把 profile 放到其他地方時，使用 `--benchmark-dir <path>`。
當你希望被基準測試的子程序略過預設的 `--force` 連接埠清理，並在 Gateway 連接埠已被使用時快速失敗，使用 `--benchmark-no-force`。
基準測試模式預設會抑制同步 I/O 追蹤雜訊。當你明確想同時取得 CPU
profile 和 Node 同步 I/O stack trace 時，搭配 `--benchmark` 設定
`OPENCLAW_TRACE_SYNC_IO=1`。在基準測試模式中，這些追蹤區塊會寫入基準目錄下的
`gateway-watch-output.log`，並從終端機 pane 中過濾；一般 Gateway 記錄仍會可見。

tmux wrapper 會將常見的非祕密執行階段選擇器帶入 pane，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。請把
提供者認證放在一般 profile/config 中，或針對一次性的暫時祕密使用原始前景模式。
如果受監看的 Gateway 在啟動期間結束，監看器會執行一次
`openclaw doctor --fix --non-interactive`，並重新啟動 Gateway 子程序。
當你想保留原始啟動失敗，而不要開發專用修復流程時，使用 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
受管理的 tmux pane 也預設使用彩色 Gateway 記錄以提升可讀性；啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

監看器會在 `src/` 下的建置相關檔案、extension 原始碼檔案、
extension `package.json` 和 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、
`package.json` 與 `tsdown.config.ts` 變更時重新啟動。Extension 中繼資料變更會在不強制
`tsdown` 重建的情況下重新啟動 gateway；原始碼與設定變更仍會先重建 `dist`。

在 `gateway:watch` 後加入任何 gateway CLI 旗標，它們會在每次重新啟動時傳遞。
重新執行相同的監看命令會重新產生具名 tmux pane，而原始監看器仍會保留其單一監看器鎖，
因此重複的監看器父程序會被取代，而不是累積。

## 開發 profile + 開發 Gateway（--dev）

使用開發 profile 隔離狀態，並啟動安全、可拋棄的設定來進行偵錯。
有**兩個** `--dev` 旗標：

- **全域 `--dev`（profile）：** 會將狀態隔離在 `~/.openclaw-dev` 下，並將
  gateway 連接埠預設為 `19001`（衍生連接埠會隨之位移）。
- **`gateway --dev`：告訴 Gateway 在缺少時自動建立預設 config +
  workspace**（並略過 BOOTSTRAP.md）。

建議流程（開發 profile + 開發 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你尚未全域安裝，請透過 `pnpm openclaw ...` 執行 CLI。

這會做的事：

1. **Profile 隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 會相應位移）

2. **開發 bootstrap**（`gateway --dev`）
   - 若缺少則寫入最小設定（`gateway.mode=local`、bind loopback）。
   - 將 `agent.workspace` 設為開發 workspace。
   - 設定 `agent.skipBootstrap=true`（無 BOOTSTRAP.md）。
   - 若缺少則植入 workspace 檔案：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 預設身分：**C3-PO**（禮儀機器人）。
   - 在開發模式中略過 channel providers（`OPENCLAW_SKIP_CHANNELS=1`）。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域** profile 旗標，會被某些 runner 吃掉。如果你需要明確寫出來，請使用 env var 形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會清除 config、credentials、sessions 和開發 workspace（使用
`trash`，不是 `rm`），然後重新建立預設開發設定。

<Tip>
如果非開發 gateway 已在執行（launchd 或 systemd），請先停止：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄（OpenClaw）

OpenClaw 可以在任何過濾/格式化之前記錄**原始 assistant stream**。
這是查看推理是否以純文字 delta 抵達（或以獨立 thinking block 抵達）的最佳方式。

透過 CLI 啟用：

```bash
pnpm gateway:watch --raw-stream
```

選用路徑覆寫：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效 env vars：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

預設檔案：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始 chunk 記錄（pi-mono）

若要在 **raw OpenAI-compat chunks** 被解析成 blocks 之前擷取它們，
pi-mono 提供一個獨立 logger：

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
> `openai-completions` provider 的程序發出。

## 安全注意事項

- 原始串流記錄可能包含完整 prompts、工具輸出與使用者資料。
- 將記錄保留在本機，並在偵錯後刪除。
- 如果你分享記錄，請先清除 secrets 和 PII。

## 在 VSCode 中偵錯

在 VSCode 系列 IDE 中啟用偵錯需要 source maps，因為許多產生的檔案在建置流程中最終會帶有 hashed names。內含的 `launch.json` 設定以 Gateway 服務為目標，但可以快速調整用於其他目的：

1. **重建並偵錯 Gateway** - 建立新建置後偵錯 Gateway 服務
2. **偵錯 Gateway** - 偵錯既有建置的 Gateway 服務

### 設定

預設的 **重建並偵錯 Gateway** 設定已包含必要項目，會自動刪除 `/dist` 資料夾，並在啟用偵錯的情況下重新建置專案：

1. 從 Activity Bar 開啟 **Run and Debug** 面板，或按 `Ctrl`+`Shift`+`D`
2. 在 IDE 中，確認設定下拉選單已選取 **重建並偵錯 Gateway**，然後按下 **Start Debugging** 按鈕

或者，如果你偏好手動管理建置和偵錯流程：

1. 開啟終端機並啟用 source maps：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows（PowerShell）**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows（CMD）**：`set OUTPUT_SOURCE_MAPS=1`
2. 在同一個終端機中重新建置專案：`pnpm clean:dist && pnpm build`
3. 在 IDE 中，在 **Run and Debug** 設定下拉選單中選取 **偵錯 Gateway** 選項，然後按下 **Start Debugging** 按鈕

你現在可以在 TypeScript 原始碼檔案（`src/` 目錄）中設定中斷點，debugger 會透過 source maps 正確地將中斷點對應到編譯後的 JavaScript。你將能如預期檢查變數、逐步執行程式碼，並檢查呼叫堆疊。

### 注意事項

- 如果使用 **"重建並偵錯 Gateway"** 選項，每次啟動 debugger 時，都會完整刪除 `/dist` 資料夾，並在啟用 source maps 的情況下執行完整 `pnpm build`，然後才啟動 Gateway
- 如果使用 **"偵錯 Gateway"** 選項，偵錯工作階段可以隨時啟動和停止，且不會影響 `/dist` 資料夾，但你必須使用獨立的終端機程序來同時啟用偵錯並管理建置循環
- 修改 `launch.json` 的 `args` 設定，以偵錯專案的其他區段
- 如果你需要使用建置後的 OpenClaw CLI 執行其他任務（例如，如果你的偵錯工作階段產生新的 auth token，則執行 `dashboard --no-open`），你可以在另一個終端機中以 `node ./openclaw.mjs` 執行，或建立 shell alias，例如 `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [常見問題](/zh-TW/help/faq)
