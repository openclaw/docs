---
read_when:
    - 需要檢查原始模型輸出是否出現推理洩漏
    - 你想在迭代時以監看模式執行 Gateway
    - 你需要一套可重複的除錯工作流程
summary: 偵錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 偵錯
x-i18n:
    generated_at: "2026-05-06T09:11:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

串流輸出的除錯輔助工具，尤其是在提供者將推理混入一般文字時。

## 執行階段除錯覆寫

在聊天中使用 `/debug` 來設定**僅限執行階段**的設定覆寫（記憶體中，而非磁碟上）。
`/debug` 預設為停用；請使用 `commands.debug: true` 啟用。
當你需要切換冷門設定，而不想編輯 `openclaw.json` 時，這很方便。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並回到磁碟上的設定。

## Session 追蹤輸出

當你想在單一 Session 中查看 Plugin 擁有的追蹤/除錯行，
但不想開啟完整詳細模式時，請使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

針對 Plugin 診斷使用 `/trace`，例如 Active Memory 除錯摘要。
針對一般的詳細狀態/工具輸出，繼續使用 `/verbose`；針對僅限執行階段的設定覆寫，
繼續使用 `/debug`。

## Plugin 生命週期追蹤

當 Plugin 生命週期指令感覺緩慢，而你需要針對 Plugin 中繼資料、探索、登錄檔、
執行階段鏡像、設定變更和重新整理作業取得內建的階段細分時，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。追蹤是選擇性啟用，並寫入
stderr，因此 JSON 指令輸出仍可解析。

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
如果指令是從原始碼 checkout 執行，建議在 `pnpm build` 後用
`node dist/entry.js ...` 測量建置後的執行階段；`pnpm openclaw ...`
也會測量原始碼 runner 的額外開銷。

## CLI 啟動與指令分析

當指令感覺緩慢時，使用已提交的啟動基準測試：

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

原始碼 runner 會加入 Node CPU profile 旗標，並為該指令寫入 `.cpuprofile`。
在為指令程式碼新增臨時 instrumentation 之前，請先使用這個方法。

若啟動停滯看起來像同步檔案系統或模組載入器工作，
請透過原始碼 runner 加上 Node 的同步 I/O 追蹤旗標：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 會預設為受監看的 Gateway 子程序啟用此旗標。
在 watch 模式中，設定 `OPENCLAW_TRACE_SYNC_IO=0` 可抑制 Node 同步 I/O 追蹤輸出。

## Gateway watch 模式

為了快速迭代，請在檔案監看器下執行 gateway：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為
`openclaw-gateway-watch-main` 的 tmux Session（或 profile/連接埠特定變體，例如
`openclaw-gateway-watch-dev-19001`），並從互動式終端機自動附加。
非互動式 shell、CI 和 agent exec 呼叫會保持 detached，並改為列印附加說明。
需要時手動附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane 會執行原始 watcher：

```bash
node scripts/watch-node.mjs gateway --force
```

當不需要 tmux 時，請使用前景模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

停用自動附加，同時保留 tmux 管理：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

在除錯啟動/執行階段熱點時，分析受監看的 Gateway CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

watch wrapper 會在叫用 Gateway 前消耗 `--benchmark`，並在
`.artifacts/gateway-watch-profiles/` 下，為每次 Gateway 子程序退出寫入一個
V8 `.cpuprofile`。停止或重新啟動受監看的 gateway 以 flush 目前的 profile，
然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

當你想把 profiles 放在其他位置時，使用 `--benchmark-dir <path>`。
當你想讓基準測試的子程序略過預設的 `--force` 連接埠清理，並在 Gateway 連接埠已被使用時快速失敗，請使用 `--benchmark-no-force`。
基準模式預設會抑制同步 I/O 追蹤雜訊。當你明確需要 CPU
profiles 和 Node 同步 I/O stack traces 兩者時，請搭配 `--benchmark` 設定
`OPENCLAW_TRACE_SYNC_IO=1`。在基準模式中，這些追蹤區塊會寫入基準目錄下的
`gateway-watch-output.log`，並從終端機 pane 中過濾；一般 Gateway logs 仍會顯示。

tmux wrapper 會把常見的非秘密執行階段選擇器帶入 pane，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。請將
provider credentials 放在你的正常 profile/config 中，或使用原始前景模式處理一次性的暫時秘密。
如果受監看的 Gateway 在啟動期間退出，watcher 會執行一次
`openclaw doctor --fix --non-interactive`，並重新啟動 Gateway 子程序。
當你想保留原始啟動失敗，而不執行僅限開發的修復步驟時，請使用
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
受管理的 tmux pane 也預設使用彩色 Gateway logs 以提高可讀性；
啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

watcher 會在 `src/` 下的建置相關檔案、extension 原始碼檔案、
extension `package.json` 和 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、
`package.json` 和 `tsdown.config.ts` 變更時重新啟動。Extension 中繼資料變更會重新啟動
gateway，而不強制進行 `tsdown` 重新建置；原始碼和設定變更仍會先重新建置
`dist`。

在 `gateway:watch` 後加入任何 gateway CLI 旗標，它們會在每次重新啟動時傳遞下去。
重新執行相同的 watch 指令會重新生成具名 tmux pane，而原始 watcher 仍會保留其單一 watcher 鎖，因此重複的 watcher parent 會被取代，而不是堆疊起來。

## 開發 profile + 開發 gateway (--dev)

使用開發 profile 來隔離狀態，並啟動安全、可拋棄的設定以便除錯。
有**兩個** `--dev` 旗標：

- **全域 `--dev`（profile）：** 在 `~/.openclaw-dev` 下隔離狀態，並將
  gateway 連接埠預設為 `19001`（衍生連接埠會隨之位移）。
- **`gateway --dev`：告訴 Gateway 在缺少時自動建立預設 config +
  workspace**（並略過 BOOTSTRAP.md）。

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
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 也會相應位移）

2. **開發 bootstrap**（`gateway --dev`）
   - 如果缺少，寫入最小 config（`gateway.mode=local`，bind loopback）。
   - 將 `agent.workspace` 設為開發 workspace。
   - 設定 `agent.skipBootstrap=true`（沒有 BOOTSTRAP.md）。
   - 如果缺少，種下 workspace 檔案：
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - 預設身分：**C3-PO**（protocol droid）。
   - 在開發模式中略過 channel providers（`OPENCLAW_SKIP_CHANNELS=1`）。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域** profile 旗標，會被某些 runner 吃掉。如果你需要明確寫出，請使用 env var 形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會清除 config、credentials、sessions 和開發 workspace（使用
`trash`，而不是 `rm`），然後重新建立預設開發設定。

<Tip>
如果非開發 gateway 已在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄（OpenClaw）

OpenClaw 可以在任何過濾/格式化之前記錄**原始 assistant stream**。
這是查看推理是否以純文字 deltas（或以獨立 thinking blocks）抵達的最佳方式。

透過 CLI 啟用：

```bash
pnpm gateway:watch --raw-stream
```

可選的路徑覆寫：

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

若要在 OpenAI 相容 chunks 被解析成 blocks 前擷取**原始 OpenAI 相容 chunks**，
pi-mono 提供獨立 logger：

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
> `openai-completions` provider 的程序發出。

## 安全注意事項

- 原始串流 logs 可能包含完整 prompts、工具輸出和使用者資料。
- 將 logs 保留在本機，並在除錯後刪除。
- 如果你分享 logs，請先清除 secrets 和 PII。

## 在 VSCode 中除錯

需要 source maps 才能在 VSCode-based IDEs 中啟用除錯，因為許多產生的檔案在建置過程中會帶有雜湊名稱。內含的 `launch.json` 設定以 Gateway service 為目標，但可以很快調整用於其他用途：

1. **重新建置並除錯 Gateway** - 建立新建置後除錯 Gateway service
2. **除錯 Gateway** - 除錯既有建置的 Gateway service

### 設定

預設的 **重新建置並除錯 Gateway** 設定已包含必要功能，它會自動刪除 `/dist` 資料夾，並在啟用除錯的情況下重新建置專案：

1. 從 Activity Bar 開啟 **Run and Debug** 面板，或按下 `Ctrl`+`Shift`+`D`
2. 在 IDE 中，確認設定下拉選單已選取 **Rebuild and Debug Gateway**，然後按下 **Start Debugging** 按鈕

或者，如果你偏好手動管理建置和除錯流程：

1. 開啟終端機並啟用 source maps：
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 在同一個終端機中，重新建置專案：`pnpm clean:dist && pnpm build`
3. 在 IDE 中，在 **Run and Debug** 設定下拉選單選取 **Debug Gateway** 選項，然後按下 **Start Debugging** 按鈕

你現在可以在 TypeScript 原始碼檔案（`src/` 目錄）中設定中斷點，debugger 會透過 source maps 正確地將中斷點對應到編譯後的 JavaScript。你將能如預期檢查變數、逐步執行程式碼，並檢視 call stacks。

### 注意事項

- 如果使用 **"Rebuild and Debug Gateway"** 選項，每次啟動 debugger 時，它會完全刪除 `/dist` 資料夾，並在啟動 Gateway 前執行啟用 source maps 的完整 `pnpm build`
- 如果使用 **"Debug Gateway"** 選項，debug sessions 可以隨時開始和停止，不會影響 `/dist` 資料夾，但你必須使用獨立的終端機程序來啟用除錯並管理建置循環
- 修改 `launch.json` 中 `args` 的設定，以除錯專案的其他區段
- 如果你需要使用建置後的 OpenClaw CLI 進行其他任務（例如 debug session 產生新的 auth token 時的 `dashboard --no-open`），你可以在另一個終端機中以 `node ./openclaw.mjs` 執行，或建立 shell alias，例如 `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [FAQ](/zh-TW/help/faq)
