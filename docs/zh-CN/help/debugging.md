---
read_when:
    - 你需要检查原始模型输出是否存在推理泄漏
    - 你想在迭代时以监视模式运行 Gateway 网关
    - 你需要一个可重复的调试工作流
summary: 调试工具：watch 模式、原始模型流和推理泄漏追踪
title: 调试
x-i18n:
    generated_at: "2026-06-27T02:11:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

流式输出的调试辅助工具，尤其适用于提供商将推理内容混入普通文本的情况。

## 运行时调试覆盖

在聊天中使用 `/debug` 设置**仅运行时**配置覆盖（内存中，不写入磁盘）。
`/debug` 默认禁用；通过 `commands.debug: true` 启用。
当你需要在不编辑 `openclaw.json` 的情况下切换隐蔽设置时，这很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖，并恢复到磁盘上的配置。

## 会话追踪输出

当你想在一个会话中查看插件拥有的追踪/调试行，
但不想开启完整详细模式时，使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

使用 `/trace` 查看插件诊断信息，例如主动记忆调试摘要。
普通的详细状态/工具输出继续使用 `/verbose`，仅运行时配置覆盖继续使用
`/debug`。

## 插件生命周期追踪

当插件生命周期命令感觉很慢，并且你需要内置阶段拆分来分析插件元数据、设备发现、注册表、
运行时镜像、配置变更和刷新工作时，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。
该追踪是选择启用的，并写入 stderr，因此 JSON 命令输出仍可解析。

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

在使用 CPU 分析器之前，先用它调查插件生命周期。
如果命令从源码检出运行，建议在 `pnpm build` 后用 `node dist/entry.js ...`
测量构建后的运行时；`pnpm openclaw ...` 也会测量源码运行器开销。

## CLI 启动和命令性能分析

当命令感觉很慢时，使用已提交的启动基准测试：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

要通过普通源码运行器做一次性性能分析，请设置
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

源码运行器会添加 Node CPU profile 标志，并为该命令写入 `.cpuprofile`。
在向命令代码添加临时插桩之前，先使用它。

对于看起来像同步文件系统或模块加载器工作的启动卡顿，
通过源码运行器添加 Node 的同步 I/O 追踪标志：

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` 默认会为被监视的 Gateway 网关子进程禁用此标志。
当你明确希望在 watch 模式中看到 Node 同步 I/O 追踪输出时，设置 `OPENCLAW_TRACE_SYNC_IO=1`。

## Gateway 网关 watch 模式

为了快速迭代，在文件监听器下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

默认情况下，这会启动或重启名为
`openclaw-gateway-watch-main` 的 tmux 会话（或按 profile/端口区分的变体，例如
`openclaw-gateway-watch-dev-19001`），并从交互式终端自动附加。
非交互式 shell、CI 和智能体 exec 调用会保持分离，并改为打印附加说明。
需要时手动附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 窗格会运行原始监听器：

```bash
node scripts/watch-node.mjs gateway --force
```

当不需要 tmux 时，使用前台模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

在保留 tmux 管理的同时禁用自动附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

调试启动/运行时热点时，分析被监视 Gateway 网关的 CPU 时间：

```bash
pnpm gateway:watch --benchmark
```

watch 包装器会在调用 Gateway 网关前消费 `--benchmark`，并在
`.artifacts/gateway-watch-profiles/` 下为每次 Gateway 网关子进程退出写入一个
V8 `.cpuprofile`。停止或重启被监视的 Gateway 网关以刷新当前 profile，然后用 Chrome DevTools 或 Speedscope 打开它：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

当你想把 profiles 放到其他位置时，使用 `--benchmark-dir <path>`。
当你希望被基准测试的子进程跳过默认的 `--force` 端口清理，并在 Gateway 网关端口已被使用时快速失败时，使用 `--benchmark-no-force`。
基准测试模式默认会抑制同步 I/O 追踪噪声。当你明确希望同时获得 CPU
profiles 和 Node 同步 I/O 堆栈追踪时，配合 `--benchmark` 设置
`OPENCLAW_TRACE_SYNC_IO=1`。在基准测试模式中，这些追踪块会写入基准目录下的
`gateway-watch-output.log`，并从终端窗格中过滤掉；普通 Gateway 网关日志仍然可见。

tmux 包装器会把常见的非机密运行时选择器带入窗格，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。将提供商凭证放在你的普通 profile/配置中，或者对一次性临时 secret 使用原始前台模式。
如果被监视的 Gateway 网关在启动期间退出，监听器会运行一次
`openclaw doctor --fix --non-interactive`，然后重启 Gateway 网关子进程。
当你希望在不进行仅开发修复步骤的情况下查看原始启动失败时，使用 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`。
托管的 tmux 窗格还默认启用彩色 Gateway 网关日志以提升可读性；
启动 `pnpm gateway:watch` 时设置 `FORCE_COLOR=0` 可禁用 ANSI 输出。

监听器会在 `src/` 下与构建相关的文件、插件源码文件、插件 `package.json` 和
`openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及
`tsdown.config.ts` 变化时重启。插件元数据变化会重启 Gateway 网关，但不会强制
`tsdown` 重新构建；源码和配置变化仍会先重新构建 `dist`。

在 `gateway:watch` 后添加任何 Gateway 网关 CLI 标志，它们都会在每次重启时透传。
重新运行同一个 watch 命令会重新生成命名的 tmux 窗格，而原始监听器仍会保持其单监听器锁，
因此重复的监听器父进程会被替换，而不是堆积起来。

## 开发 profile + 开发 Gateway 网关（--dev）

使用开发 profile 来隔离状态，并启动一个安全、可丢弃的调试设置。
这里有**两个** `--dev` 标志：

- **全局 `--dev`（profile）：** 将状态隔离到 `~/.openclaw-dev` 下，并将
  Gateway 网关端口默认设为 `19001`（派生端口会随之偏移）。
- **`gateway --dev`：告诉 Gateway 网关在缺失时自动创建默认配置 +
  工作区**（并跳过 BOOTSTRAP.md）。

推荐流程（开发 profile + 开发 bootstrap）：

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
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 会相应偏移）

2. **开发 bootstrap**（`gateway --dev`）
   - 如果缺失，写入最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`（无 BOOTSTRAP.md）。
   - 如果缺失，初始化工作区文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3-PO**（protocol droid）。
   - 在开发模式中跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局** profile 标志，会被某些运行器吞掉。如果你需要明确写出它，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭证、会话和开发工作区（使用
`trash`，而不是 `rm`），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 网关已经在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始 assistant 流**。
这是查看推理是作为纯文本 delta 到达，
还是作为单独 thinking blocks 到达的最佳方式。

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

## 原始 OpenAI 兼容 chunk 日志

要在 raw OpenAI-compat chunks 被解析为 blocks 之前捕获它们，
启用传输日志器：

```bash
OPENCLAW_RAW_STREAM=1
```

可选路径：

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.openclaw/logs/raw-openai-completions.jsonl`

## 安全说明

- 原始流日志可能包含完整 prompts、工具输出和用户数据。
- 将日志保留在本地，并在调试后删除。
- 如果你分享日志，请先清理 secrets 和 PII。

## 在 VSCode 中调试

要在基于 VSCode 的 IDE 中启用调试，需要 source maps，因为许多生成文件在构建过程中最终会带有哈希名称。随附的 `launch.json` 配置面向 Gateway 网关服务，但可以快速改造用于其他目的：

1. **重新构建并调试 Gateway 网关** - 创建新构建后调试 Gateway 网关服务
2. **调试 Gateway 网关** - 调试已有构建中的 Gateway 网关服务

### 设置

默认的**重新构建并调试 Gateway 网关**配置功能齐全，它会自动删除 `/dist` 文件夹，并在启用调试的情况下重新构建项目：

1. 从 Activity Bar 打开**运行和调试**面板，或按 `Ctrl`+`Shift`+`D`
2. 在 IDE 中，确保配置下拉菜单中已选择**重新构建并调试 Gateway 网关**，然后按下**开始调试**按钮

或者，如果你更喜欢手动管理构建和调试流程：

1. 打开终端并启用 source maps：
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows（PowerShell）**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows（CMD）**：`set OUTPUT_SOURCE_MAPS=1`
2. 在同一终端中重新构建项目：`pnpm clean:dist && pnpm build`
3. 在 IDE 中，在**运行和调试**配置下拉菜单中选择**调试 Gateway 网关**选项，然后按下**开始调试**按钮

现在，你可以在 TypeScript 源文件（`src/` 目录）中设置断点，调试器会通过 source maps 将断点正确映射到编译后的 JavaScript。你将能够按预期检查变量、逐步执行代码并查看调用栈。

### 说明

- 如果使用**“重新构建并调试 Gateway 网关”**选项，每次启动调试器时，它都会完全删除 `/dist` 文件夹，并在启动 Gateway 网关前运行一次启用 source maps 的完整 `pnpm build`
- 如果使用**“调试 Gateway 网关”**选项，调试会话可以随时启动和停止，而不会影响 `/dist` 文件夹，但你必须使用单独的终端进程来启用调试并管理构建周期
- 修改 `launch.json` 中的 `args` 设置以调试项目的其他部分
- 如果你需要使用构建后的 OpenClaw CLI 执行其他任务（例如，如果你的调试会话生成了新的 auth token，则运行 `dashboard --no-open`），可以在另一个终端中以 `node ./openclaw.mjs` 执行它，或创建一个 shell alias，例如 `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## 相关

- [故障排除](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
