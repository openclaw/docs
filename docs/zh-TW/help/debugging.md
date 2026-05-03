---
read_when:
    - 你需要檢查原始模型輸出是否有推理內容外洩
    - 您想在反覆調整時以監看模式執行 Gateway
    - 你需要一套可重複的除錯工作流程
summary: 偵錯工具：監看模式、原始模型串流，以及追蹤推理洩漏
title: 偵錯
x-i18n:
    generated_at: "2026-05-03T21:35:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

串流輸出偵錯輔助工具，特別適用於提供者將推理內容混入一般文字時。

## 執行階段偵錯覆寫

在聊天中使用 `/debug` 設定**僅限執行階段**的設定覆寫（記憶體，不寫入磁碟）。
`/debug` 預設停用；使用 `commands.debug: true` 啟用。
當你需要切換冷門設定而不編輯 `openclaw.json` 時，這很方便。

範例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 會清除所有覆寫，並回到磁碟上的設定。

## Session 追蹤輸出

當你想在單一 Session 中查看 Plugin 擁有的追蹤／偵錯行，
但不想開啟完整 verbose 模式時，請使用 `/trace`。

範例：

```text
/trace
/trace on
/trace off
```

針對 Active Memory 偵錯摘要等 Plugin 診斷使用 `/trace`。
一般 verbose 狀態／工具輸出請繼續使用 `/verbose`，僅限執行階段的設定覆寫則繼續使用
`/debug`。

## Plugin 生命週期追蹤

當 Plugin 生命週期命令感覺很慢，而你需要內建的階段拆解來檢視 Plugin 中繼資料、探索、登錄、
執行階段鏡像、設定變更與重新整理工作時，請使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。追蹤為選用，並寫入
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

在使用 CPU profiler 之前，先用這個調查 Plugin 生命週期。
如果命令是從原始碼 checkout 執行，建議在 `pnpm build` 後用 `node dist/entry.js ...` 測量建置後的
runtime；`pnpm openclaw ...` 也會測量 source-runner 開銷。

## CLI 啟動與命令剖析

當命令感覺很慢時，使用已簽入的啟動基準測試：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

若要透過一般 source runner 進行一次性剖析，請設定
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

source runner 會加入 Node CPU profile 旗標，並為該命令寫入 `.cpuprofile`。
在向命令程式碼加入暫時 instrumentation 前，先使用這個方法。

## Gateway 監看模式

為了快速迭代，請在檔案 watcher 下執行 gateway：

```bash
pnpm gateway:watch
```

預設情況下，這會啟動或重新啟動名為
`openclaw-gateway-watch-main` 的 tmux Session（或 profile／port 專屬變體，例如
`openclaw-gateway-watch-dev-19001`），並從互動式終端機自動附加。
非互動式 shell、CI 和代理執行呼叫會保持分離，並改為列印附加指示。
需要時可手動附加：

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

保留 tmux 管理但停用自動附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

偵錯啟動／runtime 熱點時，剖析受監看的 Gateway CPU 時間：

```bash
pnpm gateway:watch --benchmark
```

watch wrapper 會在呼叫 Gateway 前消耗 `--benchmark`，並在每個 Gateway child 結束時，於
`.artifacts/gateway-watch-profiles/` 下寫入一個 V8 `.cpuprofile`。
停止或重新啟動受監看的 gateway 以 flush 目前 profile，然後用 Chrome DevTools 或 Speedscope 開啟：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

當你想把 profile 放在其他地方時，使用 `--benchmark-dir <path>`。
當你想讓被基準測試的 child 跳過預設 `--force` port 清理，並在 Gateway port 已在使用中時快速失敗，請使用
`--benchmark-no-force`。

tmux wrapper 會將常見的非秘密 runtime 選擇器帶入 pane，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。請將提供者憑證放在一般 profile／config 中，或針對一次性暫時秘密使用原始前景模式。
如果受監看的 Gateway 在啟動期間結束，watcher 會執行一次
`openclaw doctor --fix --non-interactive`，然後重新啟動 Gateway child。
當你想取得原始啟動失敗，而不要 dev-only 修復流程時，使用 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
受管理的 tmux pane 也預設使用彩色 Gateway 記錄以提高可讀性；
啟動 `pnpm gateway:watch` 時設定 `FORCE_COLOR=0` 可停用 ANSI 輸出。

watcher 會在 `src/` 下與建置相關的檔案、extension 原始碼檔案、
extension `package.json` 與 `openclaw.plugin.json` 中繼資料、`tsconfig.json`、
`package.json` 和 `tsdown.config.ts` 變更時重新啟動。Extension 中繼資料變更會在不強制 `tsdown` 重建的情況下重新啟動
gateway；原始碼與設定變更仍會先重建 `dist`。

在 `gateway:watch` 後加入任何 gateway CLI 旗標，這些旗標都會在每次重新啟動時傳遞。
重新執行相同 watch 命令會重新產生具名 tmux pane，而原始 watcher 仍會維持其單一 watcher 鎖，因此重複的 watcher parent
會被取代而不是堆疊。

## Dev profile + dev gateway (--dev)

使用 dev profile 隔離狀態，並啟動安全、可拋棄的設定以進行偵錯。
有**兩個** `--dev` 旗標：

- **全域 `--dev`（profile）：** 將狀態隔離在 `~/.openclaw-dev` 下，並將
  gateway port 預設為 `19001`（衍生 port 會隨之位移）。
- **`gateway --dev`：告訴 Gateway 在缺少時自動建立預設 config +
  workspace**（並跳過 BOOTSTRAP.md）。

建議流程（dev profile + dev bootstrap）：

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
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 也會相應位移）

2. **Dev bootstrap**（`gateway --dev`）
   - 若缺少，寫入最小設定（`gateway.mode=local`，bind loopback）。
   - 將 `agent.workspace` 設為 dev workspace。
   - 設定 `agent.skipBootstrap=true`（沒有 BOOTSTRAP.md）。
   - 若缺少，植入 workspace 檔案：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 預設身分：**C3‑PO**（禮儀機器人）。
   - 在 dev 模式中跳過 channel provider（`OPENCLAW_SKIP_CHANNELS=1`）。

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

## 原始串流記錄（OpenClaw）

OpenClaw 可以在任何篩選／格式化之前記錄**原始 assistant 串流**。
這是查看推理內容是否以純文字 deltas 到達（或以獨立 thinking blocks 到達）的最佳方式。

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

若要在解析成 blocks 之前擷取**原始 OpenAI 相容 chunks**，
pi-mono 提供獨立 logger：

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
- 如果你分享記錄，請先清除秘密與 PII。

## 相關

- [疑難排解](/zh-TW/help/troubleshooting)
- [FAQ](/zh-TW/help/faq)
