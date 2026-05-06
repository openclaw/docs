---
read_when:
    - 你需要檢查原始模型輸出是否有推理外洩
    - 你想在迭代時以監看模式執行 Gateway
    - 你需要一套可重複的除錯工作流程
summary: 偵錯工具：監看模式、原始模型串流與追蹤推理洩漏
title: 偵錯
x-i18n:
    generated_at: "2026-05-06T02:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 286a2857f94b76501059dcb9b446678c5bcf45586b87c98344a58fdeb5b3cbae
    source_path: help/debugging.md
    workflow: 16
---

串流輸出的偵錯輔助工具，特別適用於供應商將推理內容混入一般文字時。

## 執行階段偵錯覆寫

在聊天中使用 `/debug` 設定**僅限執行階段**的設定覆寫（記憶體中，不寫入磁碟）。
`/debug` 預設停用；使用 `commands.debug: true` 啟用。
當你需要切換冷門設定但不想編輯 `openclaw.json` 時，這很方便。

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
但不想開啟完整詳細模式時，使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

將 `/trace` 用於 Plugin 診斷，例如 Active Memory 偵錯摘要。
一般的詳細狀態/工具輸出請繼續使用 `/verbose`，僅限執行階段的設定覆寫請繼續使用
`/debug`。

## Plugin 生命週期追蹤

當 Plugin 生命週期命令感覺很慢，而你需要內建的階段拆解來檢視 Plugin 中繼資料、探索、登錄、
執行階段鏡像、設定變更和重新整理工作時，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。
追蹤是選擇啟用的，並寫入 stderr，因此 JSON 命令輸出仍可解析。

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

在使用 CPU 分析器之前，先用這個來調查 Plugin 生命週期。
如果命令是從原始碼 checkout 執行，建議在 `pnpm build` 後使用
`node dist/entry.js ...` 測量建置後的執行階段；`pnpm openclaw ...`
也會測量原始碼執行器的額外負擔。

## CLI 啟動與命令分析

當命令感覺很慢時，使用已簽入的啟動基準測試：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

若要透過一般原始碼執行器進行一次性分析，請設定
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

原始碼執行器會加入 Node CPU profile 旗標，並為該命令寫入 `.cpuprofile`。
在為命令程式碼加入臨時檢測之前，先使用這個方式。

對於看起來像同步檔案系統或模組載入器工作的啟動停頓，
可透過原始碼執行器加入 Node 的同步 I/O 追蹤旗標：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 會預設為受監看的 Gateway 子程序啟用此旗標。
設定 `OPENCLAW_TRACE_SYNC_IO=0` 可在 watch 模式中抑制 Node 同步 I/O 追蹤輸出。

## Gateway 監看模式

若要快速迭代，請在檔案監看器下執行 gateway：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為
`openclaw-gateway-watch-main` 的 tmux 工作階段（或特定設定檔/連接埠的變體，例如
`openclaw-gateway-watch-dev-19001`），並從互動式終端自動附加。
非互動式 shell、CI 和代理程式 exec 呼叫會保持分離，並改為列印附加指示。
需要時手動附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 窗格會執行原始監看器：

```bash
node scripts/watch-node.mjs gateway --force
```

不想使用 tmux 時，使用前景模式：

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

watch 包裝器會在呼叫 Gateway 前消耗 `--benchmark`，並在
`.artifacts/gateway-watch-profiles/` 下為每次 Gateway 子程序結束寫入一個 V8 `.cpuprofile`。
停止或重新啟動受監看的 gateway 以 flush 目前的 profile，然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

當你想把 profile 放在其他位置時，使用 `--benchmark-dir <path>`。
當你想讓受基準測試的子程序略過預設的 `--force` 連接埠清理，並在 Gateway 連接埠已被使用時快速失敗，使用 `--benchmark-no-force`。
基準測試模式預設會抑制同步 I/O 追蹤雜訊。當你明確同時需要 CPU
profile 和 Node 同步 I/O 堆疊追蹤時，搭配 `--benchmark` 設定
`OPENCLAW_TRACE_SYNC_IO=1`。在基準測試模式中，這些追蹤區塊會寫入基準測試目錄下的
`gateway-watch-output.log`，並從終端窗格過濾掉；一般 Gateway 記錄仍會顯示。

tmux 包裝器會將常見的非機密執行階段選擇器帶入窗格，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。請將供應商憑證放在你的正常設定檔/設定中，
或使用原始前景模式處理一次性的臨時機密。
如果受監看的 Gateway 在啟動期間結束，監看器會執行一次
`openclaw doctor --fix --non-interactive`，然後重新啟動 Gateway 子程序。
當你想保留原始啟動失敗而不要開發專用修復流程時，使用
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
受管理的 tmux 窗格也預設使用彩色 Gateway 記錄以提升可讀性；
啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

監看器會在 `src/` 下的建置相關檔案、Plugin 原始檔、
Plugin `package.json` 和 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、
`package.json` 與 `tsdown.config.ts` 變更時重新啟動。Plugin 中繼資料變更會重新啟動
gateway，但不會強制執行 `tsdown` 重新建置；原始碼和設定變更仍會先重新建置
`dist`。

在 `gateway:watch` 後加入任何 gateway CLI 旗標，這些旗標都會在每次重新啟動時傳遞。
重新執行相同的 watch 命令會重新產生命名的 tmux 窗格，而原始監看器仍會維持其單一監看器鎖，
因此重複的監看器父程序會被取代，而不是堆積起來。

## 開發設定檔 + 開發 gateway（--dev）

使用開發設定檔來隔離狀態，並啟動安全、可拋棄的設定以進行偵錯。
有**兩個** `--dev` 旗標：

- **全域 `--dev`（profile）：** 將狀態隔離在 `~/.openclaw-dev` 下，並將 gateway 連接埠預設為 `19001`（衍生連接埠會隨之偏移）。
- **`gateway --dev`：告訴 Gateway 在缺少時自動建立預設設定 + 工作區**（並略過 BOOTSTRAP.md）。

建議流程（開發設定檔 + 開發 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你還沒有全域安裝，請透過 `pnpm openclaw ...` 執行 CLI。

這會做什麼：

1. **設定檔隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 會相應偏移）

2. **開發 bootstrap**（`gateway --dev`）
   - 若缺少則寫入最小設定（`gateway.mode=local`，綁定 local loopback）。
   - 將 `agent.workspace` 設為開發工作區。
   - 設定 `agent.skipBootstrap=true`（沒有 BOOTSTRAP.md）。
   - 若缺少則植入工作區檔案：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 預設身分：**C3‑PO**（協定機器人）。
   - 在開發模式中略過通道供應商（`OPENCLAW_SKIP_CHANNELS=1`）。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域**設定檔旗標，會被某些執行器吃掉。如果你需要明確寫出，請使用環境變數形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會抹除設定、憑證、工作階段和開發工作區（使用
`trash`，不是 `rm`），然後重新建立預設開發設定。

<Tip>
如果非開發 gateway 已在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄（OpenClaw）

OpenClaw 可以在任何過濾/格式化前記錄**原始助理串流**。
這是查看推理是否以純文字 delta 抵達（或以獨立 thinking 區塊抵達）的最佳方式。

透過 CLI 啟用：

```bash
pnpm gateway:watch --raw-stream
```

選用路徑覆寫：

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

## 原始 chunk 記錄（pi-mono）

若要在原始 OpenAI 相容 chunk 被解析成區塊前擷取它們，
pi-mono 會公開獨立的記錄器：

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
> `openai-completions` 供應商的程序發出。

## 安全注意事項

- 原始串流記錄可能包含完整提示、工具輸出和使用者資料。
- 將記錄保留在本機，並在偵錯後刪除。
- 如果你分享記錄，請先清除機密和 PII。

## 在 VSCode 中偵錯

VSCode 系列 IDE 需要 source map 才能啟用偵錯，因為許多產生的檔案在建置過程中會帶有雜湊名稱。隨附的 `launch.json` 設定以 Gateway 服務為目標，但可快速調整供其他用途使用：

1. **重新建置並偵錯 Gateway** - 建立新建置後偵錯 Gateway 服務
2. **偵錯 Gateway** - 偵錯既有建置的 Gateway 服務

### 設定

預設的 **重新建置並偵錯 Gateway** 設定是內建完整流程，會自動刪除 `/dist` 資料夾，並在啟用偵錯的情況下重新建置專案：

1. 從 Activity Bar 開啟 **執行和偵錯** 面板，或按下 `Ctrl`+`Shift`+`D`
2. 在 IDE 中，確認設定下拉選單已選取 **重新建置並偵錯 Gateway**，然後按下 **開始偵錯** 按鈕

或者，如果你偏好手動管理建置與偵錯流程：

1. 開啟終端並啟用 source map：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**：`set OUTPUT_SOURCE_MAPS=1`
2. 在同一個終端中重新建置專案：`pnpm clean:dist && pnpm build`
3. 在 IDE 中，於 **執行和偵錯** 設定下拉選單選取 **偵錯 Gateway** 選項，然後按下 **開始偵錯** 按鈕

你現在可以在 TypeScript 原始檔（`src/` 目錄）中設定中斷點，偵錯器會透過 source map 正確將中斷點對應到編譯後的 JavaScript。你可以如預期檢查變數、逐步執行程式碼，並檢視呼叫堆疊。

### 注意事項

- 如果使用 **「重新建置並偵錯 Gateway」** 選項，每次啟動偵錯器時，它都會完整刪除 `/dist` 資料夾，並在啟動 Gateway 前執行啟用 source map 的完整 `pnpm build`
- 如果使用 **「偵錯 Gateway」** 選項，偵錯工作階段可隨時啟動和停止而不影響 `/dist` 資料夾，但你必須使用獨立的終端程序同時啟用偵錯並管理建置循環
- 修改 `launch.json` 中的 `args` 設定，以偵錯專案的其他部分
- 如果你需要使用建置後的 OpenClaw CLI 執行其他工作（例如如果你的偵錯工作階段產生新的驗證權杖，則執行 `dashboard --no-open`），你可以在另一個終端中以 `node ./openclaw.mjs` 執行，或建立像 `alias openclaw-build="node $(pwd)/openclaw.mjs"` 這樣的 shell alias

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [常見問題](/zh-TW/help/faq)
