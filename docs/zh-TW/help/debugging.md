---
read_when:
    - 你需要檢查原始模型輸出是否有推理洩漏
    - 你想在反覆調整時以監看模式執行閘道
    - 你需要一個可重複的偵錯工作流程
summary: 偵錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 除錯
x-i18n:
    generated_at: "2026-07-05T11:21:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b3ab71fdd5781b5ad0e5b75aa33bd93fa9cf6c668c7a26bc7217cd6a5f299cd
    source_path: help/debugging.md
    workflow: 16
---

用於串流輸出、閘道反覆運行與啟動效能分析的除錯輔助工具。

## 執行階段除錯覆寫

`/debug` 會設定**僅限執行階段**的設定覆寫（記憶體中，不寫入磁碟）。預設停用；使用 `commands.debug: true` 啟用。

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並回到磁碟上的設定。

## 工作階段追蹤輸出

`/trace` 會顯示單一工作階段中由外掛擁有的追蹤/除錯行，而不啟用完整詳細模式。可用於外掛診斷，例如主動記憶除錯摘要；一般狀態/工具輸出請使用 `/verbose`。

```text
/trace
/trace on
/trace off
```

## 外掛生命週期追蹤

設定 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`，即可逐階段拆解外掛中繼資料、探索、登錄、執行階段鏡像、設定變更與重新整理工作。輸出會寫入 stderr，因此 JSON 命令輸出仍可解析。

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

在使用 CPU 效能分析器前，請先使用這個方法。從原始碼 checkout 測量時，請在 `pnpm build` 後用 `node dist/entry.js ...` 測量已建置的執行階段；`pnpm openclaw ...` 也會測量原始碼執行器的額外開銷。

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

原始碼執行器會加入節點 CPU profile 旗標，並為該命令寫入 `.cpuprofile`。在向命令程式碼加入暫時檢測前，請先使用這個方法。

對於看起來像同步檔案系統或模組載入器工作的啟動停滯，請透過原始碼執行器加入節點的同步 I/O 追蹤旗標：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 會預設對受監看閘道子程序停用此旗標；如果你也想在 watch 模式中取得同步 I/O 追蹤輸出，請設定 `OPENCLAW_TRACE_SYNC_IO=1`。

## 閘道 watch 模式

```bash
pnpm gateway:watch
```

預設會啟動或重新啟動名為 `openclaw-gateway-watch-<profile>` 的 tmux 工作階段（例如 `openclaw-gateway-watch-main`）；只有在 `OPENCLAW_GATEWAY_PORT` 不同於預設連接埠 `18789` 時，才會加入像 `openclaw-gateway-watch-dev-19001` 這樣的連接埠後綴。它會從互動式終端自動附加；非互動式 shell、CI 與 agent exec 呼叫會保持分離，並改為列印附加指示：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 窗格會執行原始 watcher：

```bash
node scripts/watch-node.mjs gateway --force
```

不使用 tmux 的前景模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

保留 tmux 管理，但停用自動附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

在除錯啟動/執行階段熱點時，分析受監看閘道的 CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

watch 包裝器會在呼叫閘道前消耗 `--benchmark`，並在 `.artifacts/gateway-watch-profiles/` 下，於每次閘道子程序結束時寫入一個 V8 `.cpuprofile`。停止或重新啟動受監看的閘道以 flush 目前 profile，然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`：將 profile 寫到其他位置。
- `--benchmark-no-force`：略過預設的 `--force` 連接埠清理；如果閘道連接埠已被使用，則快速失敗。

基準測試模式預設會抑制同步 I/O 追蹤雜訊。將 `OPENCLAW_TRACE_SYNC_IO=1` 搭配 `--benchmark` 設定，即可同時取得 CPU profile 與同步 I/O 堆疊追蹤；在基準測試模式中，這些追蹤區塊會寫入基準測試目錄下的 `gateway-watch-output.log`（從終端窗格過濾掉），而一般閘道記錄仍會可見。

tmux 包裝器會將常見的非機密執行階段選擇器帶入窗格，包括 `OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 與 `OPENCLAW_SKIP_CHANNELS`。請將提供者憑證放在你的正常 profile/設定中，或針對一次性短暫秘密使用原始前景模式。

如果受監看的閘道在啟動期間結束，watcher 會執行一次 `openclaw doctor --fix --non-interactive`，並重新啟動閘道子程序。設定 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`，即可在不經過僅限開發用途修復流程的情況下查看原始啟動失敗。

受管理的 tmux 窗格預設會顯示彩色閘道記錄；啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

watcher 會在 `src/` 下與建置相關的檔案、extension 原始碼檔案、extension `package.json` 與 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 變更時重新啟動。Extension 中繼資料變更會重新啟動閘道而不強制重新建置；原始碼與設定變更仍會先重新建置 `dist`。

在 `gateway:watch` 後加入閘道命令列介面旗標，它們會在每次重新啟動時傳遞下去。重新執行相同的 watch 命令會重生具名 tmux 窗格；原始 watcher 會保留單一 watcher 鎖，因此重複的 watcher 父程序會被取代，而不是不斷累積。

## 開發 profile + 開發閘道（--dev）

有兩個**不同**的 `--dev` 旗標：

- **全域 `--dev`（profile）：** 將狀態隔離到 `~/.openclaw-dev` 下，並將閘道連接埠預設為 `19001`（衍生連接埠也會隨之位移）。
- **`gateway --dev`：** 告訴閘道在缺少設定與工作區時自動建立預設設定 + 工作區（並略過 bootstrap）。

建議流程（開發 profile + 開發 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

沒有全域安裝時，請透過 `pnpm openclaw ...` 執行命令列介面。

這會執行以下操作：

1. **Profile 隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 連接埠會相應位移）

2. **開發 bootstrap**（`gateway --dev`）
   - 如果缺少設定，寫入最小設定（`gateway.mode=local`，綁定 local loopback）。
   - 將 `agents.defaults.workspace` 設為開發工作區，並將 `agents.defaults.skipBootstrap=true`。
   - 如果缺少工作區檔案，會植入：`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`。
   - 預設身分：**C3-PO**（協定機器人）。
   - `pnpm gateway:dev` 也會設定 `OPENCLAW_SKIP_CHANNELS=1` 以略過通道提供者。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域** profile 旗標，且會被某些執行器吃掉。如果你需要明確寫出來，請使用環境變數形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會清除設定、憑證、工作階段與開發工作區（移到垃圾桶，而不是刪除），然後重新建立預設開發設定。

<Tip>
如果已有非開發閘道正在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄

OpenClaw 可以在任何過濾/格式化前記錄**原始助理串流**。這是查看 reasoning 是否以純文字 delta 抵達（或以獨立 thinking 區塊抵達）的最佳方式。

透過命令列介面啟用：

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

預設檔案：`~/.openclaw/logs/raw-stream.jsonl`

## 安全注意事項

- 原始串流記錄可能包含完整提示、工具輸出與使用者資料。
- 將記錄保留在本機，並在除錯後刪除。
- 如果你分享記錄，請先清除秘密與 PII。

## 在 VSCode 中除錯

因為建置會雜湊產生的檔名，所以需要 source maps。隨附的 `launch.json` 會以閘道服務為目標：

1. **重新建置並除錯閘道** - 在啟動閘道前刪除 `/dist`，並以啟用除錯的方式重新建置。
2. **除錯閘道** - 在不碰 `/dist` 的情況下除錯現有建置。

### 設定

1. 開啟 **Run and Debug**（Activity Bar，或 `Ctrl`+`Shift`+`D`）。
2. 選取 **重新建置並除錯閘道**，然後按下 **Start Debugging**。

若要改為手動管理建置/除錯循環：

1. 在終端中啟用 source maps：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows（PowerShell）**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows（CMD）**：`set OUTPUT_SOURCE_MAPS=1`
2. 重新建置：`pnpm clean:dist && pnpm build`
3. 選取 **除錯閘道**，然後按下 **Start Debugging**。

在 `src/` TypeScript 檔案中設定中斷點；除錯器會透過 source maps 將它們對應到已編譯的 JavaScript。

### 注意事項

- **重新建置並除錯閘道** 會刪除 `/dist`，並在每次啟動時以 source maps 執行完整 `pnpm build`。
- **除錯閘道** 可以在不影響 `/dist` 的情況下啟動/停止，但你需要在另一個終端管理建置循環。
- 編輯 `launch.json` 的 `args` 可除錯其他命令列介面子命令。
- 若要將已建置的命令列介面用於其他任務（例如你的除錯工作階段產生新的 auth token 時使用 `dashboard --no-open`），請從另一個終端執行：`node ./openclaw.mjs`，或使用類似 `alias openclaw-build="node $(pwd)/openclaw.mjs"` 的別名。

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [常見問題](/zh-TW/help/faq)
