---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-24T23:09:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15e68a95d68dd076862aa168a836c4918876afa1f925ed183f7fde8ec75f24a
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的遗留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例发生冲突。当先前的 Gateway 网关运行使端口 `18789` 仍被占用时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个“已加载文件”的单元覆盖率门禁，而不是针对整个仓库所有文件的覆盖率。阈值为：行数 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁只统计被单元覆盖率套件加载的文件，而不会将拆分车道中的每个源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，会将变更的 Git 路径展开为有范围限制的 Vitest 车道。配置 / setup 变更仍会回退到原生根项目运行，因此在有接线层编辑时，相关测试仍会按需要广泛重跑。
- `pnpm changed:lanes`：显示针对 `origin/main` 的 diff 所触发的架构车道。
- `pnpm check:changed`：针对 `origin/main` 的 diff 运行智能变更门禁。它会将核心改动与核心测试车道一起运行，将扩展改动与扩展测试车道一起运行，仅测试改动则只运行测试类型检查 / 测试；对公开的插件 SDK 或插件契约改动，会额外扩展为一次扩展校验；而仅涉及发布元数据的版本提升，则保持在有针对性的版本 / 配置 / 根依赖检查范围内。
- `pnpm test`：将显式指定的文件 / 目录目标路由到有范围限制的 Vitest 车道。未指定目标的运行会使用固定的分片组，并展开到叶子配置以便在本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是使用一个巨大的根项目进程。
- 完整测试和扩展分片运行会在 `.artifacts/vitest-shard-timings.json` 中更新本地耗时数据；后续运行会使用这些数据来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量车道，这些车道只保留 `test/setup.ts`，而运行时较重的用例仍保留在现有车道中。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量车道中的显式同级测试，因此对小型辅助文件的修改不必重跑较重的运行时支撑测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply harness 不会再主导较轻的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并且整个仓库配置都启用了共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 会运行所有扩展 / 插件分片。较重的渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组仍保持批量运行。对单个内置插件车道，可使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时和导入明细报告，同时仍对显式文件 / 目录目标使用有范围限制的车道路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 Git diff，对比路由后的 changed 模式路径和原生根项目运行的基准表现。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写出分组耗时数据以及按配置划分的 JSON / 日志产物。测试性能智能体会将此作为尝试修复慢测试之前的基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：对比面向性能的改动前后分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 显式启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax / zai）。需要 API key，并设置 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）后才会取消 skip。
- `pnpm test:docker:all`：先构建一次共享的 live-test 镜像和 Docker E2E 镜像，然后通过加权调度器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker smoke 车道。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对 provider 敏感的尾部池，默认值也为 10。重型车道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=5`；在更大的主机上，可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。默认情况下，车道启动会错开 2 秒，以避免本地 Docker daemon 出现集中创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认会预检 Docker、清理陈旧的 OpenClaw E2E 容器、每 30 秒输出一次活动车道状态，并将车道耗时保存在 `.artifacts/docker-tests/lane-timings.json` 中，以便后续运行按“最长优先”排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可只打印车道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出频率，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用耗时复用。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在第一次失败后停止调度新的池化车道；每个车道都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 车道使用更紧的每车道上限。每车道日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实的代理聊天。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规的单元 / e2e 测试套件那样以 CI 稳定性为目标。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器，以及第二个会启动 `openclaw mcp serve` 的客户端容器，然后验证经路由的会话发现、transcript 读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio bridge 传递的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试反映的是 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合入 / 门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，在将其视为回归之前请先重跑一次，然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，可使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次）：

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
- `all`：两个预设都包含

输出内容包括每个命令的 `sampleCount`、平均值、p50、p95、最小值 / 最大值、exit code / signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获使用的是同一个 harness。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将有针对性的 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture：`test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在运行容器化新手引导 smoke 测试时才需要。

在干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke 测试（Docker）

确保受维护的 QR 运行时 helper 能在受支持的 Docker Node 运行时下正确加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [live 测试](/zh-CN/help/testing-live)
