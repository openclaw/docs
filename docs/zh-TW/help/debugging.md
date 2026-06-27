---
read_when:
    - 你需要檢查原始模型輸出是否有推理洩漏
    - 你想在反覆調整時以監看模式執行閘道
    - 你需要可重複的偵錯工作流程
summary: 偵錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 除錯
x-i18n:
    generated_at: "2026-06-27T19:23:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

除錯串流輸出的輔助工具，特別適用於供應商把推理混入一般文字時。

## 執行階段除錯覆寫

在聊天中使用 `/debug` 來設定**僅限執行階段**的設定覆寫（在記憶體中，不寫入磁碟）。
`/debug` 預設停用；使用 `commands.debug: true` 啟用。
當你需要切換不常見的設定、但不想編輯 `openclaw.json` 時，這很方便。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並回到磁碟上的設定。

## 工作階段追蹤輸出

當你想在單一工作階段中查看外掛擁有的追蹤/除錯行，
但不想開啟完整詳細模式時，請使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 查看外掛診斷資訊，例如主動記憶除錯摘要。
一般詳細狀態/工具輸出請繼續使用 `/verbose`，僅限執行階段的設定覆寫則繼續使用
`/debug`。

## 外掛生命週期追蹤

當外掛生命週期命令感覺緩慢，且你需要內建的階段拆解來檢視外掛中繼資料、探索、登錄檔、
執行階段鏡像、設定變更和重新整理工作時，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。追蹤是選擇性啟用，並寫入
stderr，因此 JSON 命令輸出仍可解析。

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

在使用 CPU 分析器之前，先用這個調查外掛生命週期。
如果命令是從原始碼 checkout 執行，建議在 `pnpm build` 後用 `node dist/entry.js ...` 測量建置後的
執行階段；`pnpm openclaw ...` 也會測量原始碼 runner 的開銷。

## 命令列介面啟動與命令分析

當命令感覺很慢時，使用已納入版本控制的啟動基準測試：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

若要透過一般原始碼 runner 做一次性分析，請設定
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

原始碼 runner 會加入節點 CPU profile 旗標，並為該命令寫入 `.cpuprofile`。
在向命令程式碼加入暫時 instrumentation 之前，請先使用這個方法。

對於看起來像同步檔案系統或模組載入器工作的啟動停滯，請透過原始碼 runner 加入節點的同步 I/O 追蹤旗標：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 預設會為被監看的閘道子程序停用此旗標。
當你明確想在 watch mode 中取得節點同步 I/O 追蹤輸出時，設定 `OPENCLAW_TRACE_SYNC_IO=1`。

## 閘道 watch mode

為了快速反覆開發，請在檔案 watcher 下執行閘道：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為
`openclaw-gateway-watch-main` 的 tmux 工作階段（或設定檔/連接埠專用變體，例如
`openclaw-gateway-watch-dev-19001`），並從互動式終端自動附加。
非互動式 shell、CI 和 agent exec 呼叫會保持分離，並改為印出附加指示。
需要時手動附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane 會執行原始 watcher：

```bash
node scripts/watch-node.mjs gateway --force
```

不想使用 tmux 時，使用前景模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

停用自動附加，但保留 tmux 管理：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

在除錯啟動/執行階段熱點時，分析被監看的閘道 CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

watch wrapper 會在叫用閘道前消耗 `--benchmark`，並在
`.artifacts/gateway-watch-profiles/` 下，針對每次閘道子程序退出寫入一個 V8 `.cpuprofile`。
停止或重新啟動被監看的閘道以 flush 目前的 profile，然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

如果你想把 profile 放在其他位置，使用 `--benchmark-dir <path>`。
如果你希望被基準測試的子程序跳過預設的 `--force` 連接埠清理，並在閘道連接埠已被使用時快速失敗，使用 `--benchmark-no-force`。
基準模式預設會抑制同步 I/O 追蹤雜訊。當你明確同時需要 CPU profile 和節點同步 I/O 堆疊追蹤時，搭配 `--benchmark` 設定
`OPENCLAW_TRACE_SYNC_IO=1`。在基準模式中，這些追蹤區塊會寫入基準目錄下的 `gateway-watch-output.log`，並從終端 pane 過濾掉；一般閘道日誌仍會顯示。

tmux wrapper 會將常見的非機密執行階段選擇器帶入 pane，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。將供應商認證資料放在你的正常設定檔/設定中，或對一次性短暫秘密使用原始前景模式。
如果被監看的閘道在啟動期間退出，watcher 會執行一次
`openclaw doctor --fix --non-interactive`，然後重新啟動閘道子程序。
當你想看到原始啟動失敗，而不想經過僅限開發使用的修復流程時，使用 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
受管理的 tmux pane 也預設使用彩色閘道日誌以提高可讀性；
啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

watcher 會在 `src/` 下的建置相關檔案、extension 原始碼檔案、
extension `package.json` 和 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、
`package.json` 以及 `tsdown.config.ts` 變更時重新啟動。Extension 中繼資料變更會重新啟動
閘道，但不強制 `tsdown` 重新建置；原始碼與設定變更仍會先重新建置 `dist`。

在 `gateway:watch` 後加入任何閘道命令列介面旗標，它們會在每次重新啟動時傳遞。
重新執行相同 watch 命令會重新生成具名 tmux pane，而原始 watcher 仍會保留其單一 watcher 鎖，因此重複的 watcher 父程序會被取代，而不是累積起來。

## 開發設定檔 + 開發閘道（--dev）

使用開發設定檔來隔離狀態，並啟動安全、可丟棄的設定以進行除錯。
有**兩個** `--dev` 旗標：

- **全域 `--dev`（設定檔）：** 將狀態隔離在 `~/.openclaw-dev` 下，並將閘道連接埠預設為 `19001`（衍生連接埠會隨之位移）。
- **`gateway --dev`：告訴閘道在缺少時自動建立預設設定 +
  工作區**（並跳過 BOOTSTRAP.md）。

建議流程（開發設定檔 + 開發 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你尚未進行全域安裝，請透過 `pnpm openclaw ...` 執行命令列介面。

這會做什麼：

1. **設定檔隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 會相應位移）

2. **開發 bootstrap**（`gateway --dev`）
   - 如果缺少，寫入最小設定（`gateway.mode=local`，bind loopback）。
   - 將 `agent.workspace` 設為開發工作區。
   - 設定 `agent.skipBootstrap=true`（沒有 BOOTSTRAP.md）。
   - 如果缺少，植入工作區檔案：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 預設身分：**C3-PO**（禮儀機器人）。
   - 在開發模式中跳過頻道供應商（`OPENCLAW_SKIP_CHANNELS=1`）。

重設流程（全新開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是**全域**設定檔旗標，會被某些 runner 消耗。如果你需要明確寫出，請使用環境變數形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 會清除設定、認證資料、工作階段和開發工作區（使用
`trash`，不是 `rm`），然後重新建立預設開發設定。

<Tip>
如果已有非開發閘道正在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始串流記錄（OpenClaw）

OpenClaw 可以在任何篩選/格式化之前記錄**原始 assistant 串流**。
這是查看推理是否以純文字 delta 抵達（或以獨立 thinking blocks 抵達）的最佳方式。

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

預設檔案：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始 OpenAI-compatible chunk 記錄

若要在 raw OpenAI-compat chunks 被解析成 blocks 之前擷取它們，請啟用 transport logger：

```bash
OPENCLAW_RAW_STREAM=1
```

選用路徑：

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

預設檔案：

`~/.openclaw/logs/raw-openai-completions.jsonl`

## 安全注意事項

- 原始串流日誌可能包含完整 prompt、工具輸出和使用者資料。
- 將日誌保留在本機，並在除錯後刪除。
- 如果你分享日誌，請先清除秘密和 PII。

## 在 VSCode 中除錯

需要 source maps 才能在 VSCode 型 IDE 中啟用除錯，因為許多產生的檔案在建置過程中會以雜湊名稱結尾。隨附的 `launch.json` 設定以閘道服務為目標，但可以快速調整為其他用途：

1. **重新建置並除錯閘道** - 在建立新建置後除錯閘道服務
2. **除錯閘道** - 除錯既有建置的閘道服務

### 設定

預設的 **重新建置並除錯閘道** 設定是完整內建的；它會自動刪除 `/dist` 資料夾，並在啟用除錯的情況下重新建置專案：

1. 從 Activity Bar 開啟 **Run and Debug** 面板，或按 `Ctrl`+`Shift`+`D`
2. 在 IDE 中，確認設定下拉選單已選取 **重新建置並除錯閘道**，然後按下 **Start Debugging** 按鈕

或者，如果你偏好手動管理建置和除錯流程：

1. 開啟終端並啟用 source maps：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**：`set OUTPUT_SOURCE_MAPS=1`
2. 在同一個終端中重新建置專案：`pnpm clean:dist && pnpm build`
3. 在 IDE 中，於 **Run and Debug** 設定下拉選單選取 **除錯閘道** 選項，然後按下 **Start Debugging** 按鈕

你現在可以在 TypeScript 原始碼檔案（`src/` 目錄）中設定中斷點，除錯器會透過 source maps 正確將中斷點對應到編譯後的 JavaScript。你將能如預期檢查變數、逐步執行程式碼，並檢視 call stacks。

### 注意事項

- 如果使用 **"重新建置並除錯閘道"** 選項，每次啟動除錯器時，它都會在啟動閘道之前完整刪除 `/dist` 資料夾，並在啟用 source maps 的情況下執行完整 `pnpm build`
- 如果使用 **"除錯閘道"** 選項，debug sessions 可以隨時啟動和停止，不會影響 `/dist` 資料夾，但你必須使用獨立的終端程序來同時啟用除錯並管理建置週期
- 修改 `launch.json` 中 `args` 的設定，以除錯專案的其他區段
- 如果你需要使用建置後的 OpenClaw 命令列介面處理其他工作（例如，如果你的 debug session 生成新的 auth token，使用 `dashboard --no-open`），你可以在另一個終端中以 `node ./openclaw.mjs` 執行它，或建立像 `alias openclaw-build="node $(pwd)/openclaw.mjs"` 這樣的 shell alias

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [常見問題](/zh-TW/help/faq)
