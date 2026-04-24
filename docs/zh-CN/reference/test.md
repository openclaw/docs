---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（Vitest），以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-24T04:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a333c438357bc719cc3cda536c417f044ea5e03a366b76d2c7d1ff434ca1587b
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍占用默认控制端口的残留 gateway 进程，然后使用隔离的 gateway 端口运行完整 Vitest 测试套件，这样服务端测试就不会与正在运行的实例冲突。当先前的 gateway 运行导致端口 18789 被占用时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，而不是整个仓库的全文件覆盖率。阈值为 70% 的行 / 函数 / 语句覆盖率，以及 55% 的分支覆盖率。由于 `coverage.all` 为 false，该门禁只衡量被单元覆盖率套件加载的文件，而不会把每个拆分通道中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来发生变化的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，会将已变更的 Git 路径展开为有范围的 Vitest 通道。配置 / 设置变更仍会回退到原生根项目运行，以便在需要时对接线类修改进行更广泛的重跑。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 触发了哪些架构通道。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更门禁。它会对 core 修改运行 core 测试通道，对 extension 修改运行 extension 测试通道，对仅测试修改仅运行测试类型检查 / 测试，将公共插件 SDK 或 plugin 契约变更扩展为一次 extension 验证，并在仅涉及发布元数据版本号变更时保持有针对性的版本 / 配置 / 根依赖检查。
- `pnpm test`：通过有范围的 Vitest 通道来路由显式文件 / 目录目标。未指定目标的运行会使用固定分片组，并展开到叶子配置，以便在本地并行执行；extension 组始终会展开为按 extension 划分的分片配置，而不是一个巨大的根项目进程。
- 完整测试和 extension 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续运行会使用这些计时信息来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时工件。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会通过专门的轻量通道进行路由，仅保留 `test/setup.ts`，而运行时较重的用例则仍留在现有通道中。
- 部分 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量通道中的显式同级测试，因此小范围辅助修改无需重新运行重量级、依赖运行时的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply harness 不会主导那些更轻量的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有 extension / plugin 分片。重量级渠道 plugin、browser plugin 和 OpenAI 会作为专用分片运行；其他 plugin 组则保持批处理。对单个内置 plugin 通道，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入明细报告，同时仍对显式文件 / 目录目标使用有范围的通道路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来发生变化的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：对同一个已提交 Git diff 下的变更模式路由路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：在不先提交的情况下，对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组时长数据以及每个配置对应的 JSON / 日志工件。Test Performance Agent 会在尝试修复慢测试之前将其用作基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：对以性能为重点的修改前后分组报告进行比较。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 按需启用。
- `pnpm test:e2e`：运行 gateway 端到端冒烟测试（多实例 WS/HTTP/节点配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 及自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建一次共享的实时测试镜像和 Docker E2E 镜像，然后以默认并发度 4 运行 Docker 冒烟通道，同时设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`。可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化通道；每个通道都有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动敏感或提供商敏感的通道会在并行池之后独占运行。每通道日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实的代理聊天。它需要可用的实时模型密钥（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规 unit/e2e 测试套件那样预期具有 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个预置种子的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证通过真实 stdio bridge 进行的路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试能反映 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 落地 / 门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上偶发失败，请先重跑一次，再决定是否将其视为回归，然后使用 `pnpm test <path/to/test>` 进行定位。对于内存受限主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次）：

- minimax 中位数 1279 ms（最小 1114，最大 2431）
- opus 中位数 2454 ms（最小 1224，最大 3170）

## CLI 启动基准

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
- `all`：包含上述两个预设

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、退出码 / 信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获使用的是同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向冒烟工件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件工件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线夹具 `test/fixtures/cli-startup-bench.json`

已提交的夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该夹具进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅在需要容器化新手引导冒烟测试时才需要它。

在干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本通过伪终端驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 gateway 并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保受维护的 QR 运行时辅助程序能够在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
