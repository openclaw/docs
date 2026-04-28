---
read_when:
    - 你需要检查原始模型输出是否泄露推理内容
    - 你想在迭代过程中以监视模式运行 Gateway 网关
    - 你需要一个可重复的调试工作流
summary: 调试工具：监视模式、原始模型流和推理泄漏追踪
title: 调试
x-i18n:
    generated_at: "2026-04-28T17:10:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13a49773e39041c77d4562aadcf03669bb5e66801be9908954e971a27f924cd4
    source_path: help/debugging.md
    workflow: 16
---

流式输出的调试辅助工具，尤其适用于提供商将推理内容混入普通文本的情况。

## 运行时调试覆盖

在聊天中使用 `/debug` 设置**仅运行时**配置覆盖（保存在内存中，不写入磁盘）。
`/debug` 默认禁用；使用 `commands.debug: true` 启用。
当你需要切换晦涩设置但不想编辑 `openclaw.json` 时，这很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖，并恢复为磁盘上的配置。

## 会话跟踪输出

当你想在一个会话中查看插件拥有的跟踪/调试行，但不想开启完整详细模式时，使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

将 `/trace` 用于插件诊断，例如 Active Memory 调试摘要。
继续使用 `/verbose` 查看常规的详细 Status/工具输出，并继续使用 `/debug` 进行仅运行时配置覆盖。

## 插件生命周期跟踪

当插件生命周期命令感觉很慢，并且你需要内置的阶段拆解来查看插件元数据、设备发现、注册表、运行时镜像、配置变更和刷新工作时，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。该跟踪是选择性启用的，并写入 stderr，因此 JSON 命令输出仍保持可解析。

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
如果命令从源码检出目录运行，建议在 `pnpm build` 后用 `node dist/entry.js ...` 测量构建后的运行时；`pnpm openclaw ...` 也会把源码运行器开销计入测量。

## 临时 CLI 调试计时

OpenClaw 保留 `src/cli/debug-timing.ts` 作为本地调查的小型辅助工具。
它有意默认不接入 CLI 启动、命令路由或任何命令。只在调试慢命令时使用它，然后在落地行为变更前移除 import 和 span。

当某个命令很慢，而你需要快速查看阶段拆解，再决定是使用 CPU 分析器还是修复特定子系统时，使用它。

### 添加临时 span

在你正在调查的代码附近添加该辅助工具。例如，在调试 `openclaw models list` 时，`src/commands/models/list.list-command.ts` 中的临时补丁可能如下所示：

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

准则：

- 用 `debug:` 作为临时阶段名称的前缀。
- 只在疑似慢的区段周围添加少量 span。
- 相比辅助函数名称，优先使用 `registry`、`auth_store` 或 `rows` 这类宽泛阶段。
- 对同步工作使用 `time()`，对 promise 使用 `timeAsync()`。
- 保持 stdout 干净。该辅助工具写入 stderr，因此命令 JSON 输出保持可解析。
- 在打开最终修复 PR 前移除临时 import 和 span。
- 在 issue 或 PR 中包含计时输出或简短摘要，以说明优化依据。

### 使用可读输出运行

可读模式最适合实时调试：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

临时 `models list` 调查的示例输出：

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

从该输出得出的发现：

| 阶段                                     |       时间 | 含义                                                                                                    |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile 存储加载是最大成本，应优先调查。                                                           |
| `debug:models:list:ensure_models_json`   |       5.0s | 同步 `models.json` 的开销已经值得检查是否可缓存或跳过。                                                 |
| `debug:models:list:load_model_registry`  |       5.9s | 注册表构建和提供商可用性工作也是有意义的成本。                                                         |
| `debug:models:list:read_registry_models` |       2.4s | 读取所有注册表模型并非免费，对 `--all` 可能有影响。                                                     |
| 行追加阶段                               | 总计 3.2s | 构建五个显示行仍需数秒，因此过滤路径值得进一步查看。                                                    |
| `debug:models:list:print_model_table`    |        0ms | 渲染不是瓶颈。                                                                                          |

这些发现足以指导下一次补丁，而无需在生产路径中保留计时代码。

### 使用 JSON 输出运行

当你想保存或比较计时数据时，使用 JSON 模式：

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

每一行 stderr 都是一个 JSON 对象：

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

### 落地前清理

打开最终 PR 前：

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

除非该 PR 明确是在添加永久诊断界面，否则该命令不应返回任何临时插桩调用点。对于常规性能修复，只保留行为变更、测试，以及包含计时证据的简短说明。

对于更深层的 CPU 热点，请使用 Node 分析（`--cpu-prof`）或外部分析器，而不是添加更多计时包装器。

## Gateway 网关 watch 模式

为了快速迭代，在文件 watcher 下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

这会映射到：

```bash
node scripts/watch-node.mjs gateway --force
```

该 watcher 会在 `src/` 下与构建相关的文件、插件源文件、插件 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 发生变化时重启。插件元数据变更会重启 Gateway 网关，但不会强制执行 `tsdown` 重新构建；源码和配置变更仍会先重新构建 `dist`。

在 `gateway:watch` 后添加任何 Gateway 网关 CLI 标志，它们都会在每次重启时透传。现在，对同一仓库/标志组合重新运行相同的 watch 命令时，会替换旧 watcher，而不会留下重复的 watcher 父进程。

## 开发配置文件 + 开发 Gateway 网关（--dev）

使用开发配置文件来隔离状态，并启动一个安全、可丢弃的设置用于调试。这里有**两个** `--dev` 标志：

- **全局 `--dev`（profile）：** 将状态隔离到 `~/.openclaw-dev` 下，并将 Gateway 网关端口默认为 `19001`（派生端口随之偏移）。
- **`gateway --dev`：告诉 Gateway 网关在缺失时自动创建默认配置 + 工作区**（并跳过 BOOTSTRAP.md）。

推荐流程（开发配置文件 + 开发引导）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

这会执行以下操作：

1. **配置文件隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 会相应偏移）

2. **开发引导**（`gateway --dev`）
   - 如果缺失，写入最小配置（`gateway.mode=local`，绑定 local loopback）。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`（无 BOOTSTRAP.md）。
   - 如果缺失，则播种工作区文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（礼仪机器人）。
   - 在开发模式中跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

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

`--reset` 会清除配置、凭证、会话和开发工作区（使用 `trash`，而不是 `rm`），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 网关已经在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始 assistant 流**。
这是查看推理是作为纯文本增量到达，还是作为独立 thinking block 到达的最佳方式。

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

为了在原始 OpenAI 兼容 chunk 被解析为 block 之前捕获它们，pi-mono 提供了单独的日志记录器：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：这只由使用 pi-mono 的
> `openai-completions` 提供商的进程发出。

## 安全说明

- 原始流日志可能包含完整提示词、工具输出和用户数据。
- 将日志保留在本地，并在调试后删除它们。
- 如果你共享日志，请先清理密钥和 PII。

## 相关

- [故障排除](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
