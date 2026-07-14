---
read_when:
    - 你需要检查原始模型输出中是否存在推理泄露
    - 你希望在迭代开发时以监视模式运行 Gateway 网关
    - 你需要一个可重复执行的调试工作流
summary: 调试工具：监视模式、原始模型流和推理泄露追踪
title: 调试
x-i18n:
    generated_at: "2026-07-14T13:40:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b34d2a09b6c669e8362dcc346a5f7343e262028907f68b2313ed597d8784534f
    source_path: help/debugging.md
    workflow: 16
---

用于调试流式输出、Gateway 网关迭代和启动性能分析的辅助工具。

## 运行时调试覆盖

`/debug` 设置**仅限运行时**的配置覆盖（存储在内存中，而非磁盘上）。默认禁用；使用 `commands.debug: true` 启用。

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 清除所有覆盖，并恢复使用磁盘上的配置。

## 会话跟踪输出

`/trace` 显示单个会话中由插件管理的跟踪/调试行，无需启用完整详细模式。它适用于主动记忆调试摘要等插件诊断；正常的状态/工具输出请使用 `/verbose`。

```text
/trace
/trace on
/trace off
```

## 插件生命周期跟踪

设置 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`，可按阶段详细查看插件元数据、设备发现、注册表、运行时镜像、配置变更和刷新工作。输出写入 stderr，因此 JSON 命令输出仍可解析。

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

应先使用此功能，再考虑 CPU 分析器。在源码检出目录中，先执行 `pnpm build`，再使用 `node dist/entry.js ...` 测量构建后的运行时；`pnpm openclaw ...` 还会测量源码运行器的开销。

## CLI 启动和命令性能分析

已签入仓库的启动基准测试：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

如需通过常规源码运行器进行一次性性能分析，请设置 `OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

源码运行器会添加 Node CPU 分析标志，并为该命令写入一个 `.cpuprofile`。在命令代码中添加临时插桩前，应先使用此功能。

对于看起来由同步文件系统或模块加载器工作导致的启动停顿，请通过源码运行器添加 Node 的同步 I/O 跟踪标志：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 默认会为受监视的 Gateway 网关子进程禁用此标志；如果还需要在监视模式下输出同步 I/O 跟踪，请设置 `OPENCLAW_TRACE_SYNC_IO=1`。

## Gateway 网关监视模式

```bash
pnpm gateway:watch
```

默认情况下，此命令会启动或重启名为 `openclaw-gateway-watch-<profile>` 的 tmux 会话（例如 `openclaw-gateway-watch-main`）；仅当 `OPENCLAW_GATEWAY_PORT` 与默认端口 `18789` 不同时，才会添加类似 `openclaw-gateway-watch-dev-19001` 的端口后缀。它会从交互式终端自动连接；非交互式 shell、CI 和智能体 Exec 调用会保持分离状态，并改为输出连接说明：

```bash
tmux attach -t openclaw-gateway-watch-main
# 在不连接的情况下读取近期输出
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

该窗格使用 tmux `remain-on-exit`，因此启动失败信息会保留，可供连接或捕获，而不会删除会话。重新运行 `pnpm gateway:watch` 会重新生成该窗格。

tmux 窗格运行原始监视器：

```bash
node scripts/watch-node.mjs gateway --force
```

在监视已配置的端口或默认端口前，tmux 包装器会停止当前配置文件中已安装的 Gateway 网关服务。这样可将端口交给源码监视器，避免 launchd、systemd 或计划任务重新生成服务并将其替换。服务仍保持安装状态；监视会话结束后，使用以下命令恢复服务：

```bash
pnpm openclaw gateway start
```

当显式设置的 `--port` 或 `OPENCLAW_GATEWAY_PORT` 与已安装服务的有效端口不同时，包装器会让该服务继续运行，使两个 Gateway 网关能够并行运行。

不使用 tmux 的前台模式：

```bash
pnpm gateway:watch:raw
# 或
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

原始模式不会管理已安装的服务。当服务使用相同端口时，请先运行 `pnpm openclaw gateway stop`。

保留 tmux 管理但禁用自动连接：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

调试启动/运行时热点时，分析受监视 Gateway 网关的 CPU 时间：

```bash
pnpm gateway:watch --benchmark
```

监视包装器会在调用 Gateway 网关前使用 `--benchmark`，并在 `.artifacts/gateway-watch-profiles/` 下为每次 Gateway 网关子进程退出写入一个 V8 `.cpuprofile`。停止或重启受监视的 Gateway 网关以刷新当前分析文件，然后使用 Chrome DevTools 或 Speedscope 打开：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`：将分析文件写入其他位置。
- `--benchmark-no-force`：跳过默认的 `--force` 端口清理；如果 Gateway 网关端口已被占用，则立即失败。

基准测试模式默认会抑制同步 I/O 跟踪产生的大量输出。将 `OPENCLAW_TRACE_SYNC_IO=1` 与 `--benchmark` 一同设置，即可同时获取 CPU 分析文件和同步 I/O 堆栈跟踪；在基准测试模式下，这些跟踪块会写入基准测试目录下的 `gateway-watch-output.log`（并从终端窗格中过滤掉），而常规 Gateway 网关日志仍保持可见。

tmux 包装器会将常用的非机密运行时选择项传入窗格，包括 `OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。请将提供商凭据放入常规配置文件/配置中；如需使用一次性的临时密钥，请使用原始前台模式。

如果受监视的 Gateway 网关在启动期间退出，监视器会运行一次 `openclaw doctor --fix --non-interactive`，然后重启 Gateway 网关子进程。设置 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`，可查看未经仅限开发环境的修复步骤处理的原始启动失败信息。

受管理的 tmux 窗格默认显示带颜色的 Gateway 网关日志；启动 `pnpm gateway:watch` 时设置 `FORCE_COLOR=0`，可禁用 ANSI 输出。

当 `src/` 下与构建相关的文件、扩展源码文件、扩展的 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 或 `tsdown.config.ts` 发生变化时，监视器会重启。扩展元数据变更会重启 Gateway 网关，但不会强制重新构建；源码和配置变更仍会先重新构建 `dist`。

在 `gateway:watch` 后添加 Gateway 网关 CLI 标志，它们会在每次重启时透传。重新运行相同的监视命令会重新生成具名 tmux 窗格；原始监视器会保持单监视器锁，因此重复的监视器父进程会被替换，而不会不断堆积。

## 开发配置文件 + 开发 Gateway 网关（--dev）

有两个**相互独立**的 `--dev` 标志：

- **全局 `--dev`（配置文件）：**将状态隔离到 `~/.openclaw-dev` 下，并将 Gateway 网关端口默认设为 `19001`（派生端口会随之偏移）。
- **`gateway --dev`：**指示 Gateway 网关在缺失时自动创建默认配置和工作区（并跳过引导初始化）。

推荐流程（开发配置文件 + 开发引导初始化）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果未全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

具体行为：

1. **配置文件隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/canvas 端口会相应偏移）

2. **开发引导初始化**（`gateway --dev`）
   - 如果缺失，则写入最小配置（`gateway.mode=local`，绑定 local loopback）。
   - 将 `agents.defaults.workspace` 设置为开发工作区，并设置 `agents.defaults.skipBootstrap=true`。
   - 如果缺失，则生成工作区文件：`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`。
   - 默认身份：**C3-PO**（礼仪机器人）。
   - `pnpm gateway:dev` 还会设置 `OPENCLAW_SKIP_CHANNELS=1`，以跳过渠道提供商。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局**配置文件标志，某些运行器会将其截获。如果需要明确指定，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭据、会话和开发工作区（移至废纸篓，而非删除），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 网关已在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志

OpenClaw 可以在任何过滤/格式化之前记录**原始助手流**。这是确认推理是否以纯文本增量（或独立思考块）形式到达的最佳方式。

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

## 安全说明

- 原始流日志可能包含完整提示词、工具输出和用户数据。
- 请将日志保留在本地，并在调试后将其删除。
- 如果要共享日志，请先清除密钥和个人身份信息。

## 在 VSCode 中调试

由于构建过程会对生成的文件名进行哈希处理，因此必须使用源码映射。内置的 `launch.json` 面向 Gateway 网关服务：

1. **Rebuild and Debug Gateway** - 在启动 Gateway 网关前删除 `/dist`，并在启用调试的情况下重新构建。
2. **Debug Gateway** - 调试现有构建，不修改 `/dist`。

### 设置

1. 打开 **Run and Debug**（Activity Bar，或 `Ctrl`+`Shift`+`D`）。
2. 选择 **Rebuild and Debug Gateway**，然后按 **Start Debugging**。

如果要改为手动管理构建/调试周期：

1. 在终端中启用源码映射：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**：`set OUTPUT_SOURCE_MAPS=1`
2. 重新构建：`pnpm clean:dist && pnpm build`
3. 选择 **Debug Gateway**，然后按 **Start Debugging**。

在 `src/` TypeScript 文件中设置断点；调试器会通过源码映射将其映射到编译后的 JavaScript。

### 说明

- **Rebuild and Debug Gateway** 会删除 `/dist`，并在每次启动时运行一次启用源码映射的完整 `pnpm build`。
- **Debug Gateway** 可以在不影响 `/dist` 的情况下启动/停止，但你需要在另一个终端中管理构建周期。
- 编辑 `launch.json` `args`，以调试其他 CLI 子命令。
- 如需将构建后的 CLI 用于其他任务（例如，如果调试会话生成了新的身份验证令牌，则运行 `dashboard --no-open`），请从另一个终端运行：`node ./openclaw.mjs`，或使用类似 `alias openclaw-build="node $(pwd)/openclaw.mjs"` 的别名。

## 相关内容

- [故障排查](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
