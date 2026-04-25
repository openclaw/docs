---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 `force` / `coverage` 模式
title: 测试
x-i18n:
    generated_at: "2026-04-25T09:05:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例发生冲突。当先前的 Gateway 网关运行遗留了对端口 `18789` 的占用时，使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，而不是整个仓库的全文件覆盖率。阈值为 70% 的行数/函数/语句覆盖率，以及 55% 的分支覆盖率。由于 `coverage.all` 为 false，该门禁统计的是单元覆盖率套件中已加载的文件，而不是将拆分测试通道中的每个源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对相对于 `origin/main` 发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 仅涉及可路由的源文件/测试文件时，会将变更的 Git 路径展开到有范围限制的 Vitest 通道中。配置/设置变更仍会回退到原生根项目运行，因此在修改连接逻辑时会更广泛地重新运行测试。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构通道。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更门禁。它会让核心改动运行核心测试通道，让扩展改动运行扩展测试通道，让仅测试改动只运行测试类型检查/测试，将公共 Plugin SDK 或插件契约变更扩展为一次扩展验证，并让仅发布元数据的版本变更保持在有针对性的版本/配置/根依赖检查范围内。
- `pnpm test`：通过有范围限制的 Vitest 通道来路由显式文件/目录目标。未指定目标的运行会使用固定的分片组，并展开到叶子配置以便本地并行执行；扩展组始终会展开为每个扩展的分片配置，而不是一个巨大的根项目进程。
- 完整测试和扩展分片运行会在 `.artifacts/vitest-shard-timings.json` 中更新本地耗时数据；后续运行会使用这些耗时来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量通道进行路由，这些通道只保留 `test/setup.ts`，而运行时负担较重的用例仍保留在原有通道中。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量通道中的显式同级测试，因此对小型辅助函数的修改可以避免重新运行依赖重量级运行时的测试套件。
- `auto-reply` 现在也被拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导那些更轻量的顶层 status/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重量级渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组仍保持批量运行。对某个内置插件通道使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 的导入耗时和导入明细报告，同时仍对显式文件/目录目标使用有范围限制的通道路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对相对于 `origin/main` 发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交 Git diff，将路由后的 changed 模式路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，直接对当前工作树的变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组耗时数据以及每个配置对应的 JSON/日志产物。Test Performance Agent 会在尝试修复慢测试之前，将其用作基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在一次面向性能的变更之后，对分组报告进行比较。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false`，并启用自适应 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 调整，设置 `OPENCLAW_E2E_VERBOSE=1` 可输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API 密钥以及 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：先构建一次共享的 live-test 镜像和 Docker E2E 镜像，然后通过加权调度器在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行 Docker 冒烟测试通道。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值为 10。重量级通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 设置为每个提供商一个重量级通道。更大的主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。默认情况下，通道启动会间隔 2 秒，以避免本地 Docker daemon 出现创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认会先对 Docker 做预检，清理陈旧的 OpenClaw E2E 容器，每 30 秒输出一次活动通道状态，在兼容通道之间共享提供商 CLI 工具缓存，默认对瞬时的 live 提供商失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将通道耗时存储到 `.artifacts/docker-tests/lane-timings.json`，供后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印通道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出频率，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用耗时复用。对只需要确定性/本地通道时，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`；对只需要 live 提供商通道时，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only`；对应的包别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。live-only 模式会将主 live 通道和尾部 live 通道合并为一个按最长优先排序的池，以便提供商桶能将 Claude、Codex 和 Gemini 的任务一起打包。除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化通道；每个通道都有默认 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live/tail 通道使用更严格的单通道上限。CLI 后端 Docker 设置命令有单独的超时控制，使用 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（默认 180）。每个通道的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- CLI 后端 live Docker 探测可以作为聚焦通道运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 与 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。它需要可用的 live 模型密钥（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规 unit/e2e 测试套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证经路由的会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio bridge 传输的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映的是 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合并/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上偶发失败，先重跑一次，再决定是否将其视为回归，然后使用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次）：

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

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出码/信号分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，以便耗时统计和 profile 捕获使用同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会以 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会以 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture：`test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化的新手引导冒烟测试时才需要。

在一个干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## 二维码导入冒烟测试（Docker）

确保维护中的二维码运行时辅助模块能够在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [live 测试](/zh-CN/help/testing-live)
