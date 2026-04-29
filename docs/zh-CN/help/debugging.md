---
read_when:
    - 你需要检查原始模型输出是否存在推理泄露
    - 你想在迭代开发时以监听模式运行 Gateway 网关
    - 你需要一套可重复的调试工作流
summary: 调试工具：监视模式、原始模型流，以及追踪推理泄漏
title: 调试
x-i18n:
    generated_at: "2026-04-29T08:48:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

用于流式输出的调试辅助工具，尤其适用于提供商将推理混入普通文本的情况。

## 运行时调试覆盖项

在聊天中使用 `/debug` 设置**仅运行时**配置覆盖项（内存中，而非磁盘中）。
`/debug` 默认禁用；用 `commands.debug: true` 启用。
当你需要切换晦涩设置而不编辑 `openclaw.json` 时，这很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖项，并恢复为磁盘上的配置。

## 会话跟踪输出

当你想在一个会话中查看插件拥有的跟踪/调试行，而不启用完整详细模式时，使用 `/trace`。

示例：

```text
/trace
/trace on
/trace off
```

将 `/trace` 用于插件诊断，例如 Active Memory 调试摘要。
继续将 `/verbose` 用于常规详细 Status/工具输出，并继续将 `/debug` 用于仅运行时配置覆盖项。

## 插件生命周期跟踪

当插件生命周期命令感觉很慢，并且你需要针对插件元数据、设备发现、注册表、运行时镜像、配置变更和刷新工作的内置阶段拆解时，使用 `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`。该跟踪需要显式启用，并写入 stderr，因此 JSON 命令输出仍可解析。

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

在使用 CPU 分析器之前，用它来调查插件生命周期。
如果命令从源码检出目录运行，优先在 `pnpm build` 后用 `node dist/entry.js ...` 测量构建后的运行时；`pnpm openclaw ...` 也会测到源码运行器开销。

## 临时 CLI 调试计时

OpenClaw 保留 `src/cli/debug-timing.ts` 作为本地调查的小辅助工具。
它有意默认不接入 CLI 启动、命令路由或任何命令。仅在调试慢命令时使用它，然后在落地行为变更前移除导入和计时段。

当某个命令很慢，并且你需要快速的阶段拆解，再决定是使用 CPU 分析器还是修复特定子系统时，使用它。

### 添加临时计时段

在你调查的代码附近添加辅助工具。例如，在调试 `openclaw models list` 时，`src/commands/models/list.list-command.ts` 中的临时补丁可能如下所示：

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
- 只在疑似慢的部分周围添加少量计时段。
- 优先使用 `registry`、`auth_store` 或 `rows` 这类宽泛阶段，而不是辅助函数名称。
- 对同步工作使用 `time()`，对 promise 使用 `timeAsync()`。
- 保持 stdout 干净。辅助工具写入 stderr，因此命令 JSON 输出保持可解析。
- 在打开最终修复 PR 前移除临时导入和计时段。
- 在解释优化的 issue 或 PR 中包含计时输出或简短摘要。

### 使用可读输出运行

可读模式最适合实时调试：

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

一次临时 `models list` 调查的示例输出：

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

此输出中的发现：

| 阶段                                     |       时间 | 含义                                                                                                    |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | 凭证配置存储加载是最大成本，应首先调查。                                                                |
| `debug:models:list:ensure_models_json`   |       5.0s | 同步 `models.json` 的成本足够高，值得检查缓存或跳过条件。                                               |
| `debug:models:list:load_model_registry`  |       5.9s | 注册表构建和提供商可用性工作也是有意义的成本。                                                          |
| `debug:models:list:read_registry_models` |       2.4s | 读取所有注册表模型并非免费，对 `--all` 可能很重要。                                                     |
| 行追加阶段                               | 总计 3.2s | 构建五个显示行仍需数秒，因此过滤路径值得进一步查看。                                                    |
| `debug:models:list:print_model_table`    |        0ms | 渲染不是瓶颈。                                                                                          |

这些发现足以指导下一个补丁，而无需在生产路径中保留计时代码。

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

除非 PR 明确添加永久诊断表面，否则该命令不应返回任何临时插桩调用点。对于常规性能修复，只保留行为变更、测试和带有计时证据的简短说明。

对于更深层的 CPU 热点，使用 Node 分析（`--cpu-prof`）或外部分析器，而不是添加更多计时包装器。

## Gateway 网关监视模式

为了快速迭代，在文件监视器下运行 Gateway 网关：

```bash
pnpm gateway:watch
```

默认情况下，这会启动或重启名为 `openclaw-gateway-watch-main` 的 tmux 会话（或特定于配置档案/端口的变体，例如 `openclaw-gateway-watch-dev-19001`），并从交互式终端自动附加。非交互式 shell、CI 和智能体 exec 调用会保持分离并改为打印附加说明。需要时手动附加：

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux 窗格运行原始监视器：

```bash
node scripts/watch-node.mjs gateway --force
```

不想使用 tmux 时使用前台模式：

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

在保留 tmux 管理的同时禁用自动附加：

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

tmux 包装器会将常见的非机密运行时选择器带入窗格，例如 `OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_SKIP_CHANNELS`。将提供商凭证放在你的常规配置档案/配置中，或对一次性短暂密钥使用原始前台模式。

监视器会在 `src/` 下与构建相关的文件、插件源文件、插件 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、`package.json` 以及 `tsdown.config.ts` 发生变化时重启。插件元数据变更会重启 Gateway 网关，而不会强制 `tsdown` 重新构建；源码和配置变更仍会先重新构建 `dist`。

在 `gateway:watch` 后添加任何 Gateway 网关 CLI 标志，它们会在每次重启时透传。重新运行相同的监视命令会重新生成命名的 tmux 窗格，原始监视器仍会保留其单监视器锁，因此重复的监视器父进程会被替换，而不是堆积。

## 开发配置档案 + 开发 Gateway 网关（--dev）

使用开发配置档案来隔离状态，并启动一个安全、可丢弃的设置用于调试。有**两个** `--dev` 标志：

- **全局 `--dev`（配置档案）：** 将状态隔离到 `~/.openclaw-dev` 下，并将 Gateway 网关端口默认为 `19001`（派生端口随之偏移）。
- **`gateway --dev`：告知 Gateway 网关在缺失时自动创建默认配置 + 工作区**（并跳过 BOOTSTRAP.md）。

推荐流程（开发配置档案 + 开发引导）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

它会做这些事：

1. **配置档案隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（浏览器/canvas 相应偏移）

2. **开发引导**（`gateway --dev`）
   - 如果缺失，则写入最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设置为开发工作区。
   - 设置 `agent.skipBootstrap=true`（无 BOOTSTRAP.md）。
   - 如果缺失，则填充工作区文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（礼仪机器人）。
   - 在开发模式中跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` 是一个**全局**配置档案标志，会被某些运行器吞掉。如果你需要明确写出它，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` 会清除配置、凭证、会话和开发工作区（使用 `trash`，不是 `rm`），然后重新创建默认开发设置。

<Tip>
如果非开发 Gateway 网关已经在运行（launchd 或 systemd），请先停止它：

```bash
openclaw gateway stop
```

</Tip>

## 原始流日志（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始助手流**。
这是查看推理是否以纯文本 delta（或作为单独的思考块）到达的最佳方式。

通过 CLI 启用它：

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

## 原始分块日志记录（pi-mono）

若要在解析为块之前捕获 **原始 OpenAI 兼容分块**，
pi-mono 提供了一个单独的记录器：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：这仅由使用 pi-mono 的
> `openai-completions` 提供商的进程发出。

## 安全注意事项

- 原始流日志可能包含完整提示、工具输出和用户数据。
- 将日志保留在本地，并在调试后删除。
- 如果你共享日志，请先清理密钥和 PII。

## 相关

- [故障排除](/zh-CN/help/troubleshooting)
- [常见问题](/zh-CN/help/faq)
