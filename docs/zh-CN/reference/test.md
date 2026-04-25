---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（Vitest）以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-25T00:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91009b51cee872f542a9aed0f882359c763cfb88722860eb8ef7deae434a89e7
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、实时、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：会终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 测试套件，以避免服务器测试与正在运行的实例发生冲突。当之前某次 Gateway 网关运行让端口 `18789` 仍被占用时，请使用它。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个基于已加载文件的单元覆盖率门禁，不是全仓库全文件覆盖率。阈值为行 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁衡量的是单元覆盖率套件已加载的文件，而不会把每个拆分 lane 中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对相对于 `origin/main` 发生变化的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，会将已变更的 git 路径展开为有作用域的 Vitest lanes。配置 / 设置变更仍会回退到原生根项目运行，以便在需要时对 wiring 变更进行更广泛重跑。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lanes。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能 changed 门禁。它会将核心工作映射到核心测试 lanes，将扩展工作映射到扩展测试 lanes，将仅测试工作限制为测试类型检查 / 测试，并将公共插件 SDK 或插件契约变更扩展为一次扩展验证，同时对仅发布元数据版本提升保持在有针对性的版本 / 配置 / 根依赖检查范围内。
- `pnpm test`：会通过有作用域的 Vitest lanes 路由显式文件 / 目录目标。未指定目标的运行会使用固定分片组，并展开为叶子配置以便本地并行执行；扩展组始终会展开为每个扩展的分片配置，而不是一个巨大的根项目进程。
- 完整测试和扩展分片运行会将本地耗时数据更新到 `.artifacts/vitest-shard-timings.json`；后续运行会使用这些耗时来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时工件。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用轻量 lanes，仅保留 `test/setup.ts`，而运行时较重的用例则保留在原有 lanes 上。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量 lanes 中的显式同级测试，因此小型辅助工具改动不必重新运行重量级、依赖运行时的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply harness 不会主导更轻量的顶层 status / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 会运行所有扩展 / 插件分片。重量级渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组仍保持批处理。对单个内置插件 lane，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入明细报告，同时对显式文件 / 目录目标仍使用有作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：相同的导入分析，但仅针对相对于 `origin/main` 变化的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：对同一已提交 git diff 下的 changed 模式路由路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组耗时数据以及每个配置的 JSON / 日志工件。测试性能智能体会在尝试修复慢测试之前将其作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在面向性能的改动之后比较分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax / zai）。需要 API keys，以及 `LIVE=1`（或提供商专属 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：先构建共享的实时测试镜像和 Docker E2E 镜像一次，然后通过加权调度器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker smoke lanes。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值也为 10。重量级 lane 上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；在更大主机上可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。为避免本地 Docker 守护进程在创建时发生风暴，lane 默认以 2 秒间隔错峰启动；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认会预检 Docker、清理陈旧的 OpenClaw E2E 容器、每 30 秒输出一次活动 lane 状态，并将 lane 耗时存储到 `.artifacts/docker-tests/lane-timings.json`，以便后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印 lane 清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 调整状态输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用耗时复用。除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化 lanes；每个 lane 都有 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时 / 尾部 lanes 使用更严格的每 lane 上限。每个 lane 的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录、检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元 / e2e 测试套件那样要求具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后通过真实 stdio bridge 验证路由后的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试能反映 bridge 实际发出的内容。

## 本地 PR 门禁

用于本地 PR 合并 / 门禁检查时，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上发生偶发失败，在将其视为回归之前请先重跑一次，然后用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

上次运行（2025-12-31，20 次）：

- minimax 中位数 1279 ms（最小 1114，最大 2431）
- opus 中位数 2454 ms（最小 1224，最大 3170）

## CLI 启动基准测试

脚本：[`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

用法：

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：以上两个预设的组合

输出会包含每条命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、exit-code / signal 分布以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，从而让耗时和 profile 捕获使用同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 工件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件工件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture：`test/fixtures/cli-startup-bench.json`

已检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅在容器化新手引导 smoke 测试中需要。

在干净 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke 测试（Docker）

确保维护中的 QR 运行时辅助工具能够在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
