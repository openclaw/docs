---
read_when:
    - 你需要检查原始模型输出是否存在推理泄漏
    - 你想在迭代时以监视模式运行 Gateway 网关
    - 你需要一套可重复执行的调试工作流
summary: 调试工具：监视模式、原始模型流，以及追踪推理泄漏
title: 调试
x-i18n:
    generated_at: "2026-05-04T22:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

用于调试流式输出的辅助工具，尤其适用于提供商把 reasoning 混入普通文本时。

## 运行时调试覆盖项

在聊天中使用 `/debug` 设置**仅运行时**的配置覆盖项（内存中，不写入磁盘）。
`/debug` 默认禁用；用 `commands.debug: true` 启用。
当你需要切换隐蔽设置而不编辑 `openclaw.json` 时，这很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖项，并恢复为磁盘上的配置。

## 会话 trace 输出

当你想在一个会话中查看插件拥有的 trace/debug 行，而不启用完整 verbose 模式时，使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 查看插件诊断信息，例如主动记忆调试摘要。
继续使用 `/verbose` 查看普通的 verbose Status/工具输出，并继续使用
`/debug` 设置仅运行时配置覆盖项。

## 插件生命周期 trace

当插件生命周期命令感觉很慢，并且你需要内置阶段拆解来分析插件元数据、设备发现、注册表、运行时镜像、配置变更和刷新工作时，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。该 trace 需要显式开启，并写入 stderr，因此 JSON 命令输出仍可解析。

示例：

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

示例输出：

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

在使用 CPU profiler 之前，先用它调查插件生命周期。
如果命令从源码 checkout 运行，建议在 `pnpm build` 之后用 `node dist/entry.js ...` 测量构建后的运行时；`pnpm openclaw ...` 也会把源码运行器开销计入测量。

## CLI 启动和命令性能分析

当某个命令感觉很慢时，使用仓库内置的启动基准测试：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

对于通过普通源码运行器进行的一次性性能分析，设置
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

源码运行器会添加 Node CPU profile 标志，并为该命令写入一个 `.cpuprofile`。
在向命令代码添加临时 instrumentation 之前，先使用这种方式。

对于看起来像同步文件系统或模块加载器工作的启动卡顿，通过源码运行器添加 Node 的同步 I/O trace 标志：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 会默认为被 watch 的 Gateway 网关子进程启用此标志。
设置 `OPENCLAW_TRACE_SYNC_IO=0` 可在 watch 模式下抑制 Node 同步 I/O trace 输出。

## Gateway 网关 watch 模式

为了快速迭代，在文件 watcher 下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

默认情况下，这会启动或重启一个名为
`openclaw-gateway-watch-main` 的 tmux 会话（或 profile/端口专用变体，例如
`openclaw-gateway-watch-dev-19001`），并从交互式终端自动 attach。
非交互式 shell、CI 和 agent exec 调用会保持 detached，并改为打印 attach
说明。需要时手动 attach：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux pane 会运行原始 watcher：

```bash
node scripts/watch-node.mjs gateway --force
```

当不想使用 tmux 时，使用前台模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

在保留 tmux 管理的同时禁用自动 attach：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

调试启动/运行时热点时，对被 watch 的 Gateway 网关 CPU 时间做 profile：

```bash
pnpm gateway:watch --benchmark
```

watch wrapper 会在调用 Gateway 网关之前消费 `--benchmark`，并在
`.artifacts/gateway-watch-profiles/` 下为每次 Gateway 网关子进程退出写入一个 V8 `.cpuprofile`。停止或重启被 watch 的 Gateway 网关以刷新当前 profile，然后用 Chrome DevTools 或 Speedscope 打开它：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

当你希望 profile 写到其他位置时，使用 `--benchmark-dir <path>`。
当你希望被 benchmark 的子进程跳过默认的 `--force` 端口清理，并在 Gateway 网关端口已被占用时快速失败时，使用 `--benchmark-no-force`。
benchmark 模式默认会抑制同步 I/O trace 噪声。当你明确希望同时获得 CPU profile 和 Node 同步 I/O 堆栈 trace 时，配合 `--benchmark` 设置
`OPENCLAW_TRACE_SYNC_IO=1`。在 benchmark 模式下，这些 trace block 会写入 benchmark 目录下的 `gateway-watch-output.log`，并从终端 pane 中过滤掉；普通 Gateway 网关日志仍会可见。

tmux wrapper 会把常见的非秘密运行时选择器带入 pane，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。将提供商凭证放入你的常规 profile/config 中，或对一次性临时秘密使用原始前台模式。
如果被 watch 的 Gateway 网关在启动期间退出，watcher 会运行一次
`openclaw doctor --fix --non-interactive`，然后重启 Gateway 网关子进程。
当你希望看到原始启动失败，而不执行仅开发用的修复步骤时，使用 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
受管理的 tmux pane 还默认使用彩色 Gateway 网关日志以提升可读性；启动 `pnpm gateway:watch` 时设置 `FORCE_COLOR=0` 可禁用 ANSI 输出。

watcher 会在 `src/` 下与构建相关的文件、插件源码文件、插件 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 发生变化时重启。插件元数据变化会在不强制执行 `tsdown` 重建的情况下重启 Gateway 网关；源码和配置变化仍会先重建 `dist`。

在 `gateway:watch` 后添加任何 Gateway 网关 CLI 标志，它们都会在每次重启时传递下去。重新运行同一个 watch 命令会重新生成具名 tmux pane，而原始 watcher 仍会保持它的单 watcher 锁，因此重复的 watcher 父进程会被替换，而不是不断堆积。

## dev profile + dev Gateway 网关（--dev）

使用 dev profile 隔离状态，并启动一个安全、可丢弃的设置用于调试。这里有**两个** `--dev` 标志：

- **全局 `--dev`（profile）：** 在 `~/.openclaw-dev` 下隔离状态，并将 Gateway 网关端口默认设为 `19001`（派生端口也会随之偏移）。
- **`gateway --dev`：告诉 Gateway 网关在缺失时自动创建默认配置 + 工作区**（并跳过 BOOTSTRAP.md）。

推荐流程（dev profile + dev bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

它会执行以下操作：

1. **Profile 隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 相应偏移）

2. **Dev bootstrap**（`gateway --dev`）
   - 如果缺失，则写入最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设置为 dev 工作区。
   - 设置 `agent.skipBootstrap=true`（没有 BOOTSTRAP.md）。
   - 如果缺失，则播种工作区文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（protocol droid）。
   - 在 dev 模式下跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局** profile 标志，并且会被某些 runner 吃掉。如果你需要显式写出来，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会擦除配置、凭证、会话和 dev 工作区（使用
`trash`，而不是 `rm`），然后重新创建默认 dev 设置。

<Tip>
如果已有非 dev Gateway 网关在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志记录（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始 assistant 流**。
这是查看 reasoning 是以纯文本 delta 到达（还是以单独 thinking block 到达）的最佳方式。

通过 CLI 启用：

```bash
pnpm gateway:watch --raw-stream
```

可选路径覆盖：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效环境变量：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始 chunk 日志记录（pi-mono）

要在 raw OpenAI 兼容 chunks 被解析成 block 之前捕获它们，
pi-mono 提供了一个单独的 logger：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：这只会由使用 pi-mono 的
> `openai-completions` 提供商的进程发出。

## 安全注意事项

- 原始流日志可能包含完整 prompt、工具输出和用户数据。
- 将日志保留在本地，并在调试后删除。
- 如果你共享日志，请先清除秘密和 PII。

## 相关内容

- [故障排除](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
