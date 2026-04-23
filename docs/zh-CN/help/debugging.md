---
read_when:
    - 你需要检查原始模型输出，以排查推理泄露。
    - 你想在迭代时以监视模式运行 Gateway 网关。
    - 你需要一个可重复的调试工作流。
summary: 调试工具：监视模式、原始模型流，以及推理泄露追踪
title: 调试
x-i18n:
    generated_at: "2026-04-23T04:19:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# 调试

本页介绍用于调试流式输出的辅助工具，尤其适用于提供商将推理内容混入普通文本的情况。

## 运行时调试覆盖

在聊天中使用 `/debug` 来设置**仅限运行时**的配置覆盖（保存在内存中，而不是磁盘中）。
`/debug` 默认禁用；使用 `commands.debug: true` 启用。
当你需要切换一些不常见的设置，又不想编辑 `openclaw.json` 时，这会很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖项，并恢复为磁盘上的配置。

## 会话追踪输出

当你想在单个会话中查看由 plugin 拥有的 trace/debug 行，而不想开启完整详细模式时，使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

将 `/trace` 用于 plugin 诊断，例如 Active Memory 调试摘要。
常规的详细状态/工具输出继续使用 `/verbose`，而仅限运行时的配置覆盖继续使用 `/debug`。

## 临时 CLI 调试计时

OpenClaw 将 `src/cli/debug-timing.ts` 保留为一个用于本地排查的小型辅助工具。它刻意**默认不接入** CLI 启动流程、命令路由或任何命令。仅在你调试慢命令时使用它，然后在提交行为变更之前移除导入和时间跨度标记。

当某个命令执行缓慢，而你需要先快速拆解各阶段耗时，再决定是使用 CPU 分析器还是修复某个特定子系统时，就使用它。

### 添加临时时间跨度

将辅助工具加在你要排查的代码附近。例如，在调试
`openclaw models list` 时，对
`src/commands/models/list.list-command.ts` 的临时补丁可能如下所示：

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

指南：

- 临时阶段名称统一使用 `debug:` 前缀。
- 只在怀疑较慢的几个部分周围加少量时间跨度。
- 优先使用较宽泛的阶段名称，例如 `registry`、`auth_store` 或 `rows`，而不是辅助函数名称。
- 同步工作使用 `time()`，Promise 使用 `timeAsync()`。
- 保持 stdout 干净。该辅助工具会写入 stderr，因此命令的 JSON 输出仍可被解析。
- 在提交最终修复 PR 之前，移除临时导入和时间跨度标记。
- 在说明优化内容的 issue 或 PR 中附上计时输出或简要总结。

### 以可读输出运行

可读模式最适合实时调试：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

以下是一次临时 `models list` 排查的示例输出：

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

从这段输出中得到的发现：

| 阶段 | 耗时 | 含义 |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store` |      20.3s | 加载 auth-profile store 是最大的开销，应优先排查。 |
| `debug:models:list:ensure_models_json` |       5.0s | 同步 `models.json` 的开销已经大到值得检查缓存或跳过条件。 |
| `debug:models:list:load_model_registry` |       5.9s | 构建 registry 以及提供商可用性处理也是有意义的开销。 |
| `debug:models:list:read_registry_models` |       2.4s | 读取全部 registry 模型并非没有代价，对 `--all` 可能会产生影响。 |
| 行追加阶段 | 3.2s total | 即使只构建五行显示结果也需要数秒，因此值得更仔细地检查过滤路径。 |
| `debug:models:list:print_model_table` |        0ms | 渲染不是瓶颈。 |

这些发现已经足以指导下一次补丁，而无需将计时代码保留在生产路径中。

### 以 JSON 输出运行

当你想保存或比较计时数据时，使用 JSON 模式：

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

stderr 中的每一行都是一个 JSON 对象：

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 提交前清理

在创建最终 PR 之前：

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

除非该 PR 明确是在添加永久性的诊断能力，否则这个命令不应返回任何临时插桩调用位置。对于常规性能修复，只保留行为变更、测试，以及附带计时证据的简短说明即可。

对于更深层的 CPU 热点，请使用 Node 分析（`--cpu-prof`）或外部分析器，而不是继续添加更多计时包装。

## Gateway 网关监视模式

为了更快迭代，请在文件监视器下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

它对应于：

```bash
node scripts/watch-node.mjs gateway --force
```

文件监视器会在以下内容发生变化时重启：`src/` 下与构建相关的文件、扩展源码文件、扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts`。扩展元数据变化会在**不强制执行** `tsdown` 重建的情况下重启 Gateway 网关；源码和配置变化仍会先重建 `dist`。

你可以在 `gateway:watch` 后附加任意 Gateway 网关 CLI 标志，它们会在每次重启时透传。现在，对于同一仓库/同一标志组合，重复运行相同的监视命令会替换旧的监视器，而不会留下重复的监视器父进程。

## 开发配置文件 + 开发 Gateway 网关（`--dev`）

使用开发配置文件可以隔离状态，并为调试快速启动一个安全、可丢弃的环境。这里有**两个** `--dev` 标志：

- **全局 `--dev`（配置文件）**：将状态隔离到 `~/.openclaw-dev` 下，并将 Gateway 网关端口默认设为 `19001`（派生端口也会随之偏移）。
- **`gateway --dev`**：告诉 Gateway 网关在缺失时自动创建默认配置和工作区（并跳过 `BOOTSTRAP.md`）。

推荐流程（开发配置文件 + 开发引导）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

它会执行以下操作：

1. **配置文件隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/canvas 端口也会相应偏移）

2. **开发引导**（`gateway --dev`）
   - 若配置不存在，则写入最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设为开发工作区。
   - 设置 `agent.skipBootstrap=true`（不使用 `BOOTSTRAP.md`）。
   - 若工作区文件不存在，则自动写入：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（协议机器人）。
   - 在开发模式下跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

注意：`--dev` 是一个**全局**配置文件标志，某些运行器会把它吞掉。
如果你需要明确写出它，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 会清除配置、凭证、会话和开发工作区（使用 `trash`，而不是 `rm`），然后重新创建默认的开发环境。

提示：如果非开发 Gateway 网关已经在运行（launchd/systemd），请先停止它：

```bash
openclaw gateway stop
```

## 原始流日志（OpenClaw）

OpenClaw 可以在进行任何过滤/格式化**之前**记录**原始 assistant 流**。
这是查看推理内容是否以普通文本增量形式到达（或作为单独的 thinking 块到达）的最佳方式。

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

## 原始分块日志（pi-mono）

为了在分块被解析为 block 之前捕获**原始 OpenAI-compat chunk**，
pi-mono 提供了单独的日志记录器：

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
> `openai-completions` provider 的进程输出。

## 安全注意事项

- 原始流日志可能包含完整提示词、工具输出和用户数据。
- 请将日志保留在本地，并在调试后删除。
- 如果你需要共享日志，请先清理其中的密钥和个人身份信息。
