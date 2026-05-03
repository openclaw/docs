---
read_when:
    - 你需要检查原始模型输出是否存在推理泄露
    - 你想在迭代时以监视模式运行 Gateway 网关
    - 你需要一个可重复的调试工作流
summary: 调试工具：监视模式、原始模型流和追踪推理泄漏
title: 调试
x-i18n:
    generated_at: "2026-05-03T12:07:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05a02f74b2b5d95ba87b0b344dc1bc44131cf9d2d0efaec14aad5d04c596babc
    source_path: help/debugging.md
    workflow: 16
---

调试流式输出的辅助工具，尤其适用于提供商把推理内容混入普通文本时。

## 运行时调试覆盖项

在聊天中使用 `/debug` 设置**仅限运行时**的配置覆盖项（保存在内存中，不写入磁盘）。
`/debug` 默认禁用；使用 `commands.debug: true` 启用。
当你需要切换冷门设置且不想编辑 `openclaw.json` 时，这很有用。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖项，并恢复为磁盘上的配置。

## 会话跟踪输出

当你想在单个会话中查看插件拥有的跟踪/调试行，
但不想开启完整详细模式时，请使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

将 `/trace` 用于插件诊断，例如主动记忆调试摘要。
继续使用 `/verbose` 查看普通的详细状态/工具输出，并继续使用
`/debug` 处理仅限运行时的配置覆盖项。

## 插件生命周期跟踪

当插件生命周期命令感觉很慢，并且你需要内置阶段拆解来查看插件元数据、设备发现、注册表、
运行时镜像、配置变更和刷新工作时，请使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。该跟踪是选择启用的，并写入
stderr，因此 JSON 命令输出仍然可解析。

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

在使用 CPU 性能分析器之前，先用它调查插件生命周期。
如果命令从源码 checkout 运行，建议在 `pnpm build` 后用 `node dist/entry.js ...` 测量构建后的
运行时；`pnpm openclaw ...` 也会把源码运行器开销计入测量。

## CLI 启动和命令性能分析

当某个命令感觉很慢时，使用已纳入仓库的启动基准测试：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

如需通过普通源码运行器进行一次性性能分析，请设置
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

源码运行器会添加 Node CPU profile 标志，并为该命令写入一个 `.cpuprofile`。
在给命令代码添加临时 instrumentation 之前，先使用这种方式。

## Gateway 网关监视模式

为了快速迭代，请在文件监视器下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

默认情况下，这会启动或重启一个名为
`openclaw-gateway-watch-main` 的 tmux 会话（或某个 profile/端口特定变体，例如
`openclaw-gateway-watch-dev-19001`），并从交互式终端自动附加。
非交互式 shell、CI 和智能体 exec 调用会保持分离状态，并改为打印附加说明。
需要时手动附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 窗格运行原始监视器：

```bash
node scripts/watch-node.mjs gateway --force
```

不需要 tmux 时使用前台模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

在保留 tmux 管理的同时禁用自动附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

调试启动/运行时热点时，对被监视的 Gateway 网关 CPU 时间进行性能分析：

```bash
pnpm gateway:watch --benchmark
```

监视包装器会在调用 Gateway 网关前消费 `--benchmark`，并在
`.artifacts/gateway-watch-profiles/` 下为每次 Gateway 网关子进程退出写入一个 V8 `.cpuprofile`。
停止或重启被监视的 Gateway 网关以刷新当前 profile，然后用 Chrome DevTools 或 Speedscope 打开：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

当你想把 profile 放到其他位置时，请使用 `--benchmark-dir <path>`。
当你希望被基准测试的子进程跳过默认的 `--force` 端口清理，并在 Gateway 网关端口已被占用时快速失败，请使用 `--benchmark-no-force`。

tmux 包装器会把常见的非机密运行时选择器带入窗格，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。请把提供商凭证放在你的普通配置档/配置中，或者对一次性临时密钥使用原始前台模式。
托管的 tmux 窗格还默认启用彩色 Gateway 网关日志以提高可读性；
启动 `pnpm gateway:watch` 时设置 `FORCE_COLOR=0` 可禁用 ANSI 输出。

监视器会在 `src/` 下与构建相关的文件、扩展源文件、
扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、
`package.json` 以及 `tsdown.config.ts` 变更时重启。扩展元数据变更会重启
Gateway 网关，但不会强制进行 `tsdown` 重新构建；源码和配置变更仍会先重新构建
`dist`。

在 `gateway:watch` 后添加任何 Gateway 网关 CLI 标志，它们会在每次重启时透传。
重新运行同一个 watch 命令会重新生成命名的 tmux 窗格，而原始监视器仍会保持其单监视器锁，因此重复的监视器父进程会被替换，而不是堆积起来。

## 开发配置档 + 开发 Gateway 网关（--dev）

使用开发配置档来隔离状态，并启动一个安全、可丢弃的设置用于调试。
这里有**两个** `--dev` 标志：

- **全局 `--dev`（配置档）：** 将状态隔离到 `~/.openclaw-dev` 下，并将
  Gateway 网关端口默认设为 `19001`（派生端口会随之偏移）。
- **`gateway --dev`：告诉 Gateway 网关在缺失时自动创建默认配置 +
  工作区**（并跳过 BOOTSTRAP.md）。

推荐流程（开发配置档 + 开发 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

这会执行：

1. **配置档隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/canvas 相应偏移）

2. **开发 bootstrap**（`gateway --dev`）
   - 如果缺失，则写入最小配置（`gateway.mode=local`，绑定 local loopback）。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`（无 BOOTSTRAP.md）。
   - 如果工作区文件缺失，则填充：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（礼仪机器人）。
   - 在开发模式中跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局**配置档标志，会被某些运行器吃掉。如果你需要明确写出它，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭证、会话和开发工作区（使用
`trash`，而不是 `rm`），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 网关已在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始 assistant 流**。
这是查看推理内容是否以普通文本 delta（或单独的 thinking blocks）到达的最佳方式。

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

## 原始 chunk 日志（pi-mono）

要在 **raw OpenAI-compat chunks** 被解析为 blocks 之前捕获它们，
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

- 原始流日志可能包含完整提示、工具输出和用户数据。
- 将日志保留在本地，并在调试后删除。
- 如果你共享日志，请先清理密钥和 PII。

## 相关内容

- [故障排除](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
