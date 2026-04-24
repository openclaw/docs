---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-24T07:41:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，这样服务端测试就不会与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 18789 仍被占用时，使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，不是针对整个仓库所有文件的覆盖率。阈值为 70% 的行数/函数/语句，以及 55% 的分支。由于 `coverage.all` 为 false，该门禁衡量的是单元覆盖率测试套件加载的文件，而不是把每个分片测试通道中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 仅触及可路由的源文件/测试文件时，会将变更的 git 路径展开为有作用域的 Vitest 测试通道。配置/设置变更仍会回退到原生根项目运行，这样在需要时，连线方式相关的修改仍会更广泛地重新运行测试。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构测试通道。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更门禁。它会将 core 工作与 core 测试通道一起运行，将扩展工作与扩展测试通道一起运行，将仅测试改动限制为仅测试类型检查/测试，并将公开 Plugin SDK 或插件契约变更扩展为一次扩展验证，同时让仅发布元数据的版本提升保持在定向的版本/配置/根依赖检查范围内。
- `pnpm test`：通过有作用域的 Vitest 测试通道路由显式的文件/目录目标。未指定目标的运行会使用固定的分片组，并展开为叶子配置以便在本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是一个巨大的根项目进程。
- 完整测试和扩展分片运行会在 `.artifacts/vitest-shard-timings.json` 中更新本地时间数据；后续运行会使用这些时间数据来平衡慢速和快速分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地时间工件。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量测试通道，这些通道仅保留 `test/setup.ts`，而运行时负载较重的用例仍留在现有测试通道中。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量测试通道中的显式同级测试，因此小型辅助函数改动可以避免重新运行依赖重型运行时的测试套件。
- `auto-reply` 现在也被拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply 测试框架就不会主导较轻量的顶层状态/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重量级渠道插件、浏览器插件以及 OpenAI 会作为专用分片运行；其他插件组则保持批量执行。对某个内置插件测试通道使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入明细报告，同时对显式文件/目录目标仍使用有作用域的测试通道路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一已提交 git diff，将路由后的 changed 模式路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：在无需先提交的情况下，对当前工作区变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组耗时数据以及每个配置对应的 JSON/日志工件。Test Performance Agent 会将其作为尝试修复慢测试之前的基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：比较一次以性能为重点的改动前后的分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API key，并且设置 `LIVE=1`（或特定提供商的 `*_LIVE_TEST=1`）后才会取消跳过。
- `pnpm test:docker:all`：先构建共享的 live-test 镜像和 Docker E2E 镜像一次，然后默认以并发数 8、并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟测试通道。可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整主池，通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 调整对提供商敏感的尾部池；两者默认都为 8。为避免本地 Docker 守护进程在创建阶段出现风暴，测试通道启动默认错开 2 秒；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化测试通道；每个测试通道默认有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。每个测试通道的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型密钥（例如在 `~/.profile` 中配置的 OpenAI），会拉取外部 Open WebUI 镜像，并且不像普通单元/e2e 测试套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个预置数据的 Gateway 网关容器和第二个客户端容器，后者会拉起 `openclaw mcp serve`，然后验证路由对话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio bridge 传递的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映的是 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合并/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，在将其视为回归之前先重跑一次，然后用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

上次运行（2025-12-31，20 次）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

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
- `all`：同时包含两个预设

输出包含每条命令的 `sampleCount`、平均值、p50、p95、最小/最大值、exit-code/signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获使用的是同一个测试框架。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向冒烟工件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件工件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线夹具 `test/fixtures/cli-startup-bench.json`

已检入的夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该夹具进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；这只在容器化新手引导冒烟测试中需要。

在一个干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护中的 QR 运行时 helper 能在受支持的 Docker Node 运行时中正确加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [live 测试](/zh-CN/help/testing-live)
