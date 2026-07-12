---
read_when:
    - 您需要檢查模型的原始輸出是否洩漏推理內容
    - 你想在反覆開發調整時，以監看模式執行閘道
    - 你需要一套可重複執行的偵錯工作流程
summary: 偵錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 除錯
x-i18n:
    generated_at: "2026-07-11T21:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

串流輸出、閘道反覆開發與啟動效能分析的偵錯輔助工具。

## 執行階段偵錯覆寫

`/debug` 會設定**僅限執行階段**的設定覆寫（儲存於記憶體，而非磁碟）。預設停用；請以 `commands.debug: true` 啟用。

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並還原為磁碟上的設定。

## 工作階段追蹤輸出

`/trace` 可顯示單一工作階段中由外掛管理的追蹤／偵錯行，而不必啟用完整詳細模式。它適用於主動記憶偵錯摘要等外掛診斷；一般狀態／工具輸出請使用 `/verbose`。

```text
/trace
/trace on
/trace off
```

## 外掛生命週期追蹤

設定 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`，即可逐階段分解外掛中繼資料、探索、登錄、執行階段鏡像、設定變更及重新整理作業。輸出會寫入 stderr，因此 JSON 命令輸出仍可解析。

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

請先使用此功能，再考慮 CPU 效能分析器。從原始碼簽出版本測量時，請在 `pnpm build` 後以 `node dist/entry.js ...` 測量已建置的執行階段；`pnpm openclaw ...` 還會計入原始碼執行器的額外負擔。

## 命令列介面啟動與命令效能分析

已納入版本控制的啟動基準測試：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

若要透過一般原始碼執行器進行一次性效能分析，請設定 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

原始碼執行器會加入 Node CPU 效能分析旗標，並為該命令寫入 `.cpuprofile`。請先使用此方法，再考慮在命令程式碼中加入暫時性檢測。

對於看似由同步檔案系統或模組載入器作業造成的啟動停滯，請透過原始碼執行器加入 Node 的同步 I/O 追蹤旗標：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 預設會讓受監看閘道子程序停用此旗標；若也想在監看模式中取得同步 I/O 追蹤輸出，請設定 `OPENCLAW_TRACE_SYNC_IO=1`。

## 閘道監看模式

```bash
pnpm gateway:watch
```

預設會啟動或重新啟動名為 `openclaw-gateway-watch-<profile>` 的 tmux 工作階段（例如 `openclaw-gateway-watch-main`）；只有當 `OPENCLAW_GATEWAY_PORT` 與預設連接埠 `18789` 不同時，才會加上類似 `openclaw-gateway-watch-dev-19001` 的連接埠尾碼。從互動式終端機執行時會自動連接；非互動式 shell、CI 與代理程式執行呼叫則會保持分離，並改為顯示連接指示：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 窗格會執行原始監看器：

```bash
node scripts/watch-node.mjs gateway --force
```

監看相同連接埠前，請先停止已安裝的閘道服務：

```bash
pnpm openclaw gateway stop
```

監看器的 `--force` 會清除目前的監聽程序，但不會停用受監督的服務。否則，launchd、systemd 或排定的工作服務可能會重新產生程序，並取代受監看的閘道。

不使用 tmux 的前景模式：

```bash
pnpm gateway:watch:raw
# 或
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

保留 tmux 管理，但停用自動連接：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

偵錯啟動／執行階段效能熱點時，分析受監看閘道的 CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

監看包裝器會先取用 `--benchmark`，再叫用閘道，並在 `.artifacts/gateway-watch-profiles/` 下為每次閘道子程序結束寫入一個 V8 `.cpuprofile`。停止或重新啟動受監看的閘道以將目前的效能分析檔寫出，然後使用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`：將效能分析檔寫入其他位置。
- `--benchmark-no-force`：略過預設的 `--force` 連接埠清理；若閘道連接埠已在使用中，立即失敗。

基準測試模式預設會抑制同步 I/O 追蹤的大量輸出。搭配 `--benchmark` 設定 `OPENCLAW_TRACE_SYNC_IO=1`，即可同時取得 CPU 效能分析檔與同步 I/O 堆疊追蹤；在基準測試模式中，這些追蹤區塊會寫入基準目錄下的 `gateway-watch-output.log`（從終端機窗格中篩除），而一般閘道日誌仍會顯示。

tmux 包裝器會將常見且不含機密的執行階段選擇器帶入窗格，包括 `OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 與 `OPENCLAW_SKIP_CHANNELS`。請將提供者憑證放在一般設定檔／設定中；若是一次性的短期機密，請使用原始前景模式。

如果受監看的閘道在啟動期間結束，監看器會執行一次 `openclaw doctor --fix --non-interactive`，然後重新啟動閘道子程序。設定 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`，即可在不執行僅供開發使用的修復程序下查看原始啟動失敗。

受管理的 tmux 窗格預設會顯示彩色閘道日誌；啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0`，即可停用 ANSI 輸出。

監看器會在 `src/` 下與建置相關的檔案、擴充功能原始碼檔案、擴充功能 `package.json` 與 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、`package.json` 及 `tsdown.config.ts` 變更時重新啟動。擴充功能中繼資料變更會重新啟動閘道，但不會強制重新建置；原始碼與設定變更仍會先重新建置 `dist`。

在 `gateway:watch` 後加入閘道命令列介面旗標，即會在每次重新啟動時傳遞這些旗標。重新執行相同的監看命令會重新產生具名 tmux 窗格；原始監看器會保有單一監看器鎖定，因此重複的監看器父程序會被取代，而不會持續堆積。

## 開發設定檔 + 開發閘道（--dev）

有兩個**不同**的 `--dev` 旗標：

- **全域 `--dev`（設定檔）：**將狀態隔離至 `~/.openclaw-dev`，並將閘道連接埠預設為 `19001`（衍生連接埠會隨之位移）。
- **`gateway --dev`：**指示閘道在缺少設定時自動建立預設設定與工作區（並略過啟動程序）。

建議流程（開發設定檔 + 開發啟動程序）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

若未全域安裝，請透過 `pnpm openclaw ...` 執行命令列介面。

此流程會執行以下作業：

1. **設定檔隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（瀏覽器／畫布連接埠會相應位移）

2. **開發啟動程序**（`gateway --dev`）
   - 若缺少設定，寫入最小設定（`gateway.mode=local`，繫結 local loopback）。
   - 將 `agents.defaults.workspace` 設為開發工作區，並設定 `agents.defaults.skipBootstrap=true`。
   - 若缺少工作區檔案，則建立初始檔案：`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`。
   - 預設身分：**C3-PO**（禮儀機器人）。
   - `pnpm gateway:dev` 也會設定 `OPENCLAW_SKIP_CHANNELS=1`，以略過頻道提供者。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域**設定檔旗標，某些執行器會將其取用。如果需要明確指定，請使用環境變數形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會清除設定、憑證、工作階段與開發工作區（移至垃圾桶，而非刪除），然後重新建立預設開發環境。

<Tip>
如果已有非開發閘道正在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄

OpenClaw 可在任何篩選／格式化前記錄**原始助理串流**。這是確認推理內容是以純文字增量（或獨立思考區塊）抵達的最佳方式。

透過命令列介面啟用：

```bash
pnpm gateway:watch --raw-stream
```

選用的路徑覆寫：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效環境變數：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

預設檔案：`~/.openclaw/logs/raw-stream.jsonl`

## 安全注意事項

- 原始串流日誌可能包含完整提示、工具輸出與使用者資料。
- 請將日誌保留在本機，並在偵錯後刪除。
- 若要分享日誌，請先移除機密與個人識別資訊。

## 在 VSCode 中偵錯

由於建置程序會對產生的檔名加上雜湊，因此必須使用原始碼對應。隨附的 `launch.json` 以閘道服務為目標：

1. **Rebuild and Debug Gateway** - 啟動閘道前刪除 `/dist`，並在啟用偵錯的情況下重新建置。
2. **Debug Gateway** - 在不變更 `/dist` 的情況下，偵錯現有建置。

### 設定

1. 開啟 **Run and Debug**（活動列，或按 `Ctrl`+`Shift`+`D`）。
2. 選取 **Rebuild and Debug Gateway**，然後按 **Start Debugging**。

若要改為手動管理建置／偵錯週期：

1. 在終端機中啟用原始碼對應：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**：`set OUTPUT_SOURCE_MAPS=1`
2. 重新建置：`pnpm clean:dist && pnpm build`
3. 選取 **Debug Gateway**，然後按 **Start Debugging**。

在 `src/` TypeScript 檔案中設定中斷點；偵錯工具會透過原始碼對應，將其對應至已編譯的 JavaScript。

### 注意事項

- **Rebuild and Debug Gateway** 每次啟動時都會刪除 `/dist`，並在啟用原始碼對應的情況下執行完整的 `pnpm build`。
- **Debug Gateway** 可在不影響 `/dist` 的情況下啟動／停止，但建置週期需在另一個終端機中管理。
- 編輯 `launch.json` 的 `args`，即可偵錯其他命令列介面子命令。
- 若要使用已建置的命令列介面執行其他工作（例如當偵錯工作階段產生新的驗證權杖時執行 `dashboard --no-open`），請從另一個終端機執行：`node ./openclaw.mjs`，或使用類似 `alias openclaw-build="node $(pwd)/openclaw.mjs"` 的別名。

## 相關內容

- [疑難排解](/zh-TW/help/troubleshooting)
- [常見問題](/zh-TW/help/faq)
