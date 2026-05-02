---
read_when:
    - 你需要检查原始模型输出是否存在推理泄露
    - 你想在迭代时以监视模式运行 Gateway 网关
    - 你需要一个可重复的调试工作流
summary: 调试工具：监视模式、原始模型流，以及跟踪推理泄露
title: 调试
x-i18n:
    generated_at: "2026-05-02T21:41:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

调试流式输出的辅助工具，尤其适用于提供商把推理内容混入普通文本时。

## 运行时调试覆盖

在聊天中使用 `/debug` 设置**仅运行时**配置覆盖（保存在内存中，而不是磁盘上）。
`/debug` 默认禁用；通过 `commands.debug: true` 启用。
当你需要切换隐蔽设置而不编辑 `openclaw.json` 时，这很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖，并恢复为磁盘上的配置。

## 会话跟踪输出

当你想在一个会话中查看插件拥有的跟踪/调试行，而不启用完整详细模式时，使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

将 `/trace` 用于插件诊断，例如主动记忆调试摘要。
继续使用 `/verbose` 查看普通的详细 Status/工具输出，并继续使用
`/debug` 设置仅运行时配置覆盖。

## 插件生命周期跟踪

当插件生命周期命令感觉很慢，并且你需要内置阶段拆分来查看插件元数据、设备发现、注册表、
运行时镜像、配置变更和刷新工作时，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。
该跟踪是选择加入的，并写入 stderr，因此 JSON 命令输出仍可解析。

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
如果命令从源码检出目录运行，建议在 `pnpm build` 之后用
`node dist/entry.js ...` 测量构建后的运行时；`pnpm openclaw ...`
还会测到源码运行器的开销。

## CLI 启动和命令分析

当命令感觉很慢时，使用仓库内置的启动基准测试：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

如果要通过普通源码运行器进行一次性分析，设置
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`：

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

源码运行器会添加 Node CPU profile 标志，并为该命令写入一个 `.cpuprofile`。
在向命令代码添加临时插桩之前先使用它。

## Gateway 网关监视模式

为了快速迭代，在文件监视器下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

默认情况下，这会启动或重启一个名为
`openclaw-gateway-watch-main` 的 tmux 会话（或特定于 profile/端口的变体，例如
`openclaw-gateway-watch-dev-19001`），并从交互式终端自动附加。
非交互式 shell、CI 和智能体 exec 调用会保持分离，并改为打印附加说明。
需要时手动附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 面板会运行原始监视器：

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

调试启动/运行时热点时，分析被监视 Gateway 网关的 CPU 时间：

```bash
pnpm gateway:watch --benchmark
```

监视包装器会在调用 Gateway 网关之前消费 `--benchmark`，并在每个 Gateway 网关子进程退出时，
在 `.artifacts/gateway-watch-profiles/` 下写入一个 V8 `.cpuprofile`。
停止或重启被监视的 Gateway 网关以刷新当前 profile，然后用 Chrome DevTools 或 Speedscope 打开：

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

如果你想把 profile 放在其他位置，使用 `--benchmark-dir <path>`。

tmux 包装器会把常见的非密钥运行时选择器带入面板，例如
`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。把
提供商凭证放在你的普通 profile/配置中，或使用原始前台模式处理一次性临时密钥。
受管理的 tmux 面板还会默认使用彩色 Gateway 网关日志以提升可读性；
启动 `pnpm gateway:watch` 时设置 `FORCE_COLOR=0` 可禁用 ANSI 输出。

监视器会在 `src/` 下与构建相关的文件、插件源码文件、插件 `package.json` 和
`openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 和
`tsdown.config.ts` 发生变化时重启。插件元数据变更会重启 Gateway 网关，而不强制
`tsdown` 重新构建；源码和配置变更仍会先重新构建 `dist`。

在 `gateway:watch` 后添加任何 Gateway 网关 CLI 标志，它们都会在每次重启时传递下去。
重新运行同一条监视命令会重新生成命名 tmux 面板，而原始监视器仍会保留其单监视器锁，
因此重复的监视器父进程会被替换，而不是堆积起来。

## 开发 profile + 开发 Gateway 网关（--dev）

使用开发 profile 隔离状态，并启动一个安全、可丢弃的设置用于调试。
有**两个** `--dev` 标志：

- **全局 `--dev`（profile）：** 在 `~/.openclaw-dev` 下隔离状态，并将
  Gateway 网关端口默认设为 `19001`（派生端口会随之偏移）。
- **`gateway --dev`：告诉 Gateway 网关在缺失时自动创建默认配置 +
  工作区**（并跳过 BOOTSTRAP.md）。

推荐流程（开发 profile + 开发引导）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，通过 `pnpm openclaw ...` 运行 CLI。

它会执行以下操作：

1. **Profile 隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/canvas 相应偏移）

2. **开发引导**（`gateway --dev`）
   - 如果缺失，则写入最小配置（`gateway.mode=local`，绑定到环回地址）。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`（不使用 BOOTSTRAP.md）。
   - 如果缺失，则预置工作区文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（礼仪机器人）。
   - 在开发模式中跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局** profile 标志，会被某些运行器吃掉。如果你需要明确写出它，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭证、会话和开发工作区（使用
`trash`，不是 `rm`），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 网关已经在运行（launchd 或 systemd），先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始助手流**。
这是查看推理内容是以普通文本增量到达，还是以独立 thinking 块到达的最佳方式。

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

## 原始数据块日志（pi-mono）

要在**原始 OpenAI 兼容数据块**被解析成块之前捕获它们，
pi-mono 提供了一个独立日志记录器：

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

## 安全说明

- 原始流日志可能包含完整提示词、工具输出和用户数据。
- 将日志保留在本地，并在调试后删除。
- 如果你共享日志，先清理密钥和 PII。

## 相关

- [故障排除](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
