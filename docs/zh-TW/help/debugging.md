---
read_when:
    - 你需要檢查原始模型輸出是否有推理洩漏
    - 你想要在反覆開發時以監看模式執行 Gateway
    - 你需要一套可重複的偵錯工作流程
summary: 除錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 除錯
x-i18n:
    generated_at: "2026-05-05T01:46:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

偵錯串流輸出的輔助工具，特別適用於 provider 將 reasoning 混入一般文字時。

## 執行階段偵錯覆寫

在聊天中使用 `/debug` 設定**僅限執行階段**的設定覆寫（記憶體中，而非磁碟）。
`/debug` 預設停用；使用 `commands.debug: true` 啟用。
當你需要切換冷僻設定而不編輯 `openclaw.json` 時，這很方便。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫並回到磁碟上的設定。

## 工作階段追蹤輸出

當你想在單一工作階段中查看由 Plugin 擁有的追蹤/偵錯行，
而不啟用完整詳細模式時，請使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 查看 Plugin 診斷，例如 Active Memory 偵錯摘要。
一般詳細狀態/工具輸出請繼續使用 `/verbose`，而僅限執行階段的設定覆寫請繼續使用
`/debug`。

## Plugin 生命週期追蹤

當 Plugin 生命週期命令感覺緩慢，且你需要內建的階段分解來檢查 Plugin 中繼資料、探索、登錄、
執行階段鏡像、設定變更與重新整理工作時，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。此追蹤為選擇啟用，並寫入
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

在使用 CPU profiler 之前，先用它調查 Plugin 生命週期。
如果命令是從原始碼 checkout 執行，請優先在 `pnpm build` 後使用
`node dist/entry.js ...` 測量已建置的執行階段；`pnpm openclaw ...`
也會測量 source-runner 開銷。

## CLI 啟動與命令 profiling

當命令感覺緩慢時，使用已提交的啟動 benchmark：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

若要透過一般 source runner 做一次性 profiling，請設定
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner 會加入 Node CPU profile 旗標，並為該命令寫入 `.cpuprofile`。
在向命令程式碼加入暫時 instrumentation 之前，先使用這個方法。

對於看起來像同步檔案系統或 module-loader 工作造成的啟動停滯，
請透過 source runner 加入 Node 的同步 I/O trace 旗標：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 預設會為受監看的 Gateway 子程序啟用此旗標。
設定 `OPENCLAW_TRACE_SYNC_IO=0` 可在 watch
模式中抑制 Node 同步 I/O trace 輸出。

## Gateway watch 模式

若要快速迭代，請在檔案監看器下執行 gateway：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為
`openclaw-gateway-watch-main` 的 tmux 工作階段（或 profile/port 專屬變體，例如
`openclaw-gateway-watch-dev-19001`），並從互動式終端機自動 attach。
非互動式 shell、CI 和 agent exec 呼叫會保持 detached，並改為列印 attach
指示。需要時可手動 attach：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane 會執行原始 watcher：

```bash
node scripts/watch-node.mjs gateway --force
```

不想使用 tmux 時，請使用前景模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

停用自動 attach，同時保留 tmux 管理：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

偵錯啟動/執行階段熱點時，profile 受監看的 Gateway CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

watch wrapper 會在叫用 Gateway 前消耗 `--benchmark`，並在
`.artifacts/gateway-watch-profiles/` 下為每次 Gateway 子程序結束寫入一個 V8 `.cpuprofile`。
停止或重新啟動受監看的 gateway 以 flush 目前的 profile，然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

當你想將 profiles 放到其他位置時，請使用 `--benchmark-dir <path>`。
當你想讓 benchmarked 子程序略過預設的 `--force` 連接埠清理，並在 Gateway 連接埠已被使用時快速失敗，請使用 `--benchmark-no-force`。
benchmark 模式預設會抑制同步 I/O trace 雜訊。當你明確同時需要 CPU
profiles 和 Node 同步 I/O stack traces 時，請搭配 `--benchmark` 設定
`OPENCLAW_TRACE_SYNC_IO=1`。在 benchmark 模式中，這些 trace block
會寫入 benchmark 目錄下的 `gateway-watch-output.log`，並從終端機 pane 中過濾掉；一般 Gateway logs 仍會顯示。

tmux wrapper 會將常見的非秘密執行階段 selector 帶入 pane，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。請將
provider credentials 放在你的正常 profile/config 中，或使用原始前景模式處理一次性的 ephemeral secrets。
如果受監看的 Gateway 在啟動期間退出，watcher 會執行一次
`openclaw doctor --fix --non-interactive`，然後重新啟動 Gateway 子程序。
當你想取得原始啟動失敗，而不執行僅限開發的修復 pass 時，請使用
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
受管理的 tmux pane 也預設使用彩色 Gateway logs 以提高可讀性；
啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

watcher 會在 `src/` 下與建置相關的檔案、extension 原始檔、
extension `package.json` 與 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、
`package.json` 和 `tsdown.config.ts` 變更時重新啟動。extension 中繼資料變更會重新啟動
gateway，而不強制執行 `tsdown` rebuild；source 和 config 變更仍會先
rebuild `dist`。

在 `gateway:watch` 後加入任何 gateway CLI 旗標，它們都會在每次重新啟動時傳遞。
重新執行相同的 watch 命令會 respawn 具名 tmux pane，而原始 watcher 仍保有其 single-watcher lock，因此重複的 watcher parent
會被替換，而不是不斷堆疊。

## Dev profile + dev gateway (--dev)

使用 dev profile 來隔離狀態，並啟動安全、可拋棄的設定以供
偵錯。這裡有**兩個** `--dev` 旗標：

- **全域 `--dev`（profile）：** 將狀態隔離在 `~/.openclaw-dev` 下，並
  將 gateway 連接埠預設為 `19001`（衍生連接埠會隨之平移）。
- **`gateway --dev`：指示 Gateway 在缺少時自動建立預設 config +
  workspace**（並略過 BOOTSTRAP.md）。

建議流程（dev profile + dev bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你還沒有全域安裝，請透過 `pnpm openclaw ...` 執行 CLI。

這會做什麼：

1. **Profile 隔離**（全域 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 會相應平移）

2. **Dev bootstrap**（`gateway --dev`）
   - 如果缺少，寫入最小 config（`gateway.mode=local`，bind loopback）。
   - 將 `agent.workspace` 設為 dev workspace。
   - 設定 `agent.skipBootstrap=true`（無 BOOTSTRAP.md）。
   - 如果缺少，seed workspace 檔案：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 預設 identity：**C3‑PO**（protocol droid）。
   - 在 dev 模式中略過 channel providers（`OPENCLAW_SKIP_CHANNELS=1`）。

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

`--reset` 會清除 config、credentials、sessions 和 dev workspace（使用
`trash`，不是 `rm`），然後重新建立預設 dev 設定。

<Tip>
如果非 dev gateway 已在執行（launchd 或 systemd），請先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始 stream logging (OpenClaw)

OpenClaw 可以在任何 filtering/formatting 之前記錄**原始 assistant stream**。
這是判斷 reasoning 是否以純文字 deltas 抵達
（或以獨立 thinking blocks 抵達）的最佳方式。

透過 CLI 啟用：

```bash
pnpm gateway:watch --raw-stream
```

可選的 path 覆寫：

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

## 原始 chunk logging (pi-mono)

若要在 **raw OpenAI-compat chunks** 被解析成 blocks 前擷取它們，
pi-mono 提供獨立 logger：

```bash
PI_RAW_STREAM=1
```

可選 path：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

預設檔案：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：這只會由使用 pi-mono 的
> `openai-completions` provider 的程序發出。

## 安全注意事項

- 原始 stream logs 可能包含完整 prompts、tool output 和 user data。
- 將 logs 保持在本機，並在偵錯後刪除。
- 如果你分享 logs，請先清除 secrets 和 PII。

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [常見問題](/zh-TW/help/faq)
