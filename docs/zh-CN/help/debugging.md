---
read_when:
    - 你需要检查原始模型输出是否存在推理泄漏
    - 你想在迭代时以监视模式运行 Gateway 网关
    - 你需要一个可重复的调试工作流
summary: 调试工具：监视模式、原始模型流和推理泄漏追踪
title: 调试
x-i18n:
    generated_at: "2026-07-05T11:21:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b3ab71fdd5781b5ad0e5b75aa33bd93fa9cf6c668c7a26bc7217cd6a5f299cd
    source_path: help/debugging.md
    workflow: 16
---

用于流式输出、Gateway 网关迭代和启动性能分析的调试辅助工具。

## 运行时调试覆盖

`/debug` 设置**仅运行时**配置覆盖（内存中，而非磁盘）。默认禁用；使用 `commands.debug: true` 启用。

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖，并恢复为磁盘上的配置。

## 会话追踪输出

`/trace` 会显示一个会话中由插件拥有的追踪/调试行，而不启用完整的详细模式。将它用于插件诊断，例如主动记忆调试摘要；普通状态/工具输出请使用 `/verbose`。

```text
/trace
/trace on
/trace off
```

## 插件生命周期追踪

设置 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`，可以按阶段拆解插件元数据、设备发现、注册表、运行时镜像、配置变更和刷新工作。输出写入 stderr，因此 JSON 命令输出仍可解析。

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

在使用 CPU profiler 之前先使用此方法。从源码检出中，在 `pnpm build` 之后用 `node dist/entry.js ...` 测量构建后的运行时；`pnpm openclaw ...` 也会测量源码运行器开销。

## CLI 启动和命令性能分析

已提交的启动基准：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

如需通过普通源码运行器进行一次性性能分析，请设置 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

源码运行器会添加 Node CPU profile 标志，并为该命令写入一个 `.cpuprofile`。在向命令代码添加临时插桩之前先使用此方法。

对于看起来像同步文件系统或模块加载器工作的启动卡顿，通过源码运行器添加 Node 的同步 I/O 追踪标志：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 默认会为被监视的 Gateway 网关子进程禁用此标志；如果你也希望在 watch 模式中看到同步 I/O 追踪输出，请设置 `OPENCLAW_TRACE_SYNC_IO=1`。

## Gateway 网关 watch 模式

```bash
pnpm gateway:watch
```

默认情况下，这会启动或重启一个名为 `openclaw-gateway-watch-<profile>` 的 tmux 会话（例如 `openclaw-gateway-watch-main`）；只有当 `OPENCLAW_GATEWAY_PORT` 不同于默认端口 `18789` 时，才会添加类似 `openclaw-gateway-watch-dev-19001` 的端口后缀。它会从交互式终端自动附加；非交互式 shell、CI 和 agent exec 调用会保持分离，并改为打印附加说明：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 窗格运行原始 watcher：

```bash
node scripts/watch-node.mjs gateway --force
```

不使用 tmux 的前台模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

保留 tmux 管理但禁用自动附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

调试启动/运行时热点时，对被监视的 Gateway 网关 CPU 时间进行性能分析：

```bash
pnpm gateway:watch --benchmark
```

watch 包装器会在调用 Gateway 网关之前消费 `--benchmark`，并在每个 Gateway 网关子进程退出时，在 `.artifacts/gateway-watch-profiles/` 下写入一个 V8 `.cpuprofile`。停止或重启被监视的 Gateway 网关以刷新当前 profile，然后用 Chrome DevTools 或 Speedscope 打开：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`：将 profiles 写到其他位置。
- `--benchmark-no-force`：跳过默认的 `--force` 端口清理；如果 Gateway 网关端口已被占用，则快速失败。

benchmark 模式默认会抑制同步 I/O 追踪噪声。将 `OPENCLAW_TRACE_SYNC_IO=1` 与 `--benchmark` 一起设置，可以同时获取 CPU profiles 和同步 I/O 堆栈追踪；在 benchmark 模式下，这些追踪块会写入 benchmark 目录下的 `gateway-watch-output.log`（从终端窗格中过滤掉），而普通 Gateway 网关日志仍会保持可见。

tmux 包装器会把常见的非秘密运行时选择器带入窗格，包括 `OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。将提供商凭证放在你的普通配置文件/配置中，或对一次性临时秘密使用原始前台模式。

如果被监视的 Gateway 网关在启动期间退出，watcher 会运行一次 `openclaw doctor --fix --non-interactive`，然后重启 Gateway 网关子进程。设置 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 可查看原始启动失败，而不执行仅开发使用的修复流程。

托管的 tmux 窗格默认使用彩色 Gateway 网关日志；启动 `pnpm gateway:watch` 时设置 `FORCE_COLOR=0` 可禁用 ANSI 输出。

watcher 会在 `src/` 下与构建相关的文件、扩展源码文件、扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 发生变化时重启。扩展元数据变化会重启 Gateway 网关，而不会强制重新构建；源码和配置变化仍会先重新构建 `dist`。

在 `gateway:watch` 后添加 Gateway 网关 CLI 标志，它们会在每次重启时传递下去。重新运行相同的 watch 命令会重新生成具名 tmux 窗格；原始 watcher 会保留单一 watcher 锁，因此重复的 watcher 父进程会被替换，而不是不断堆积。

## 开发配置文件 + 开发 Gateway 网关（--dev）

有两个**独立的** `--dev` 标志：

- **全局 `--dev`（配置文件）：** 将状态隔离在 `~/.openclaw-dev` 下，并将 Gateway 网关端口默认设为 `19001`（派生端口会随之偏移）。
- **`gateway --dev`：** 告诉 Gateway 网关在缺失时自动创建默认配置 + 工作区（并跳过 bootstrap）。

推荐流程（开发配置文件 + 开发 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

这会执行以下操作：

1. **配置文件隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/canvas 端口会相应偏移）

2. **开发 bootstrap**（`gateway --dev`）
   - 如果缺失，则写入最小配置（`gateway.mode=local`，绑定回环）。
   - 将 `agents.defaults.workspace` 设置为开发工作区，并设置 `agents.defaults.skipBootstrap=true`。
   - 如果缺失，则播种工作区文件：`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`。
   - 默认身份：**C3-PO**（协议机器人）。
   - `pnpm gateway:dev` 还会设置 `OPENCLAW_SKIP_CHANNELS=1`，以跳过渠道提供商。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局**配置文件标志，会被某些运行器吞掉。如果你需要明确写出它，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭证、会话和开发工作区（移到废纸篓，而不是删除），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 网关已经在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志

OpenClaw 可以在任何过滤/格式化之前记录**原始助手流**。这是查看推理是否以纯文本 delta（或以单独的 thinking block）到达的最佳方式。

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

默认文件：`~/.openclaw/logs/raw-stream.jsonl`

## 安全注意事项

- 原始流日志可能包含完整提示、工具输出和用户数据。
- 将日志保留在本地，并在调试后删除。
- 如果你共享日志，请先清理秘密和 PII。

## 在 VSCode 中调试

需要 source maps，因为构建会对生成的文件名进行哈希处理。随附的 `launch.json` 面向 Gateway 网关服务：

1. **重新构建并调试 Gateway 网关** - 删除 `/dist`，并在启动 Gateway 网关之前启用调试重新构建。
2. **调试 Gateway 网关** - 在不触碰 `/dist` 的情况下调试现有构建。

### 设置

1. 打开 **运行和调试**（活动栏，或 `Ctrl`+`Shift`+`D`）。
2. 选择 **重新构建并调试 Gateway 网关**，然后按 **开始调试**。

如果改为手动管理构建/调试循环：

1. 在终端中启用 source maps：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**：`set OUTPUT_SOURCE_MAPS=1`
2. 重新构建：`pnpm clean:dist && pnpm build`
3. 选择 **调试 Gateway 网关**，然后按 **开始调试**。

在 `src/` TypeScript 文件中设置断点；调试器会通过 source maps 将它们映射到已编译的 JavaScript。

### 说明

- **重新构建并调试 Gateway 网关** 会删除 `/dist`，并在每次启动时使用 source maps 运行完整的 `pnpm build`。
- **调试 Gateway 网关** 可以在不影响 `/dist` 的情况下启动/停止，但你需要在单独的终端中管理构建循环。
- 编辑 `launch.json` `args` 以调试其他 CLI 子命令。
- 如需将构建后的 CLI 用于其他任务（例如，如果你的调试会话生成了新的认证令牌，则运行 `dashboard --no-open`），请从另一个终端运行：`node ./openclaw.mjs`，或使用类似 `alias openclaw-build="node $(pwd)/openclaw.mjs"` 的别名。

## 相关

- [故障排查](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
