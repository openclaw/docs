---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-28T01:18:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: df15d8967bd22e46336522aed44a32151f015f481c5aad24b66c7e0f10232e2f
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，以避免服务器测试与正在运行的实例发生冲突。当先前的 Gateway 网关运行导致端口 18789 仍被占用时，请使用此命令。
- `pnpm test:coverage`：通过 `vitest.unit.config.ts` 使用 V8 覆盖率运行单元测试套件。这是一个针对已加载文件的单元覆盖率门禁，不是覆盖整个仓库所有文件的覆盖率。阈值为：行数 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁统计的是被单元覆盖率测试套件加载的文件，而不是将每个拆分测试 lane 的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本的智能变更测试运行。它会根据直接修改的测试文件、同级 `*.test.ts` 文件、显式源文件映射以及本地导入图来运行精确目标。除非能够映射到精确测试，否则广泛的 / 配置 / package 变更会被跳过。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式启用广泛变更测试运行。当测试 harness / 配置 / package 的修改应回退到 Vitest 更广泛的变更测试行为时，请使用它。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的差异所触发的架构 lane。
- `pnpm check:changed`：对相对于 `origin/main` 的差异运行智能变更检查门禁。它会为受影响的架构 lane 运行 typecheck、lint 和 guard 命令，但不会运行 Vitest 测试。测试验证请使用 `pnpm test:changed` 或显式的 `pnpm test <target>`。
- `pnpm test`：通过带作用域的 Vitest lane 路由显式的文件 / 目录目标。未指定目标的运行会使用固定分片组，并展开为叶子配置，以便在本地并行执行；扩展组始终会展开为每个扩展 / 插件的分片配置，而不是使用一个庞大的根项目进程。
- 测试包装器运行结束时会输出简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自身的耗时行仍保留为每个分片的详细信息。
- 完整测试、扩展测试和 include-pattern 分片运行会将本地耗时数据更新到 `.artifacts/vitest-shard-timings.json`；后续整套配置运行会使用这些耗时数据来平衡慢分片和快分片。include-pattern CI 分片会将分片名称附加到耗时键名中，这样可以在不替换整套配置耗时数据的前提下保留过滤后分片的耗时可见性。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时工件。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量 lane，这些 lane 只保留 `test/setup.ts`，而运行时开销较重的用例仍保留在现有 lane 上。
- 带有同级测试的源文件会优先映射到该同级测试，然后才回退到更宽泛的目录 glob。位于 `src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的辅助文件修改，会使用本地导入图来运行导入它们的测试，而不是在依赖路径明确时广泛运行每个分片。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻量的顶层 status / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展 / 插件分片。重量级渠道插件、浏览器插件和 OpenAI 作为专用分片运行；其他插件组保持批处理。对某个内置插件 lane 使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入明细报告，同时仍对显式文件 / 目录目标使用带作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 git diff，对路由后的 changed 模式路径和原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：对当前工作区变更集进行基准测试，无需先提交。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行完整测试套件中的每个 Vitest 叶子配置，并写入分组耗时数据以及每个配置对应的 JSON / 日志工件。Test Performance Agent 会在尝试修复慢测试之前，将此结果作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：对比性能优化变更前后的分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 显式启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 以及自适应 workers；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行 provider 实时测试（minimax / zai）。需要 API key，并设置 `LIVE=1`（或 provider 专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享的实时测试镜像，将 OpenClaw 一次性打包为 npm tarball，构建 / 复用一个裸 Node/Git 运行器镜像以及一个功能镜像，后者会将该 tarball 安装到 `/app` 中，然后通过加权调度器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker smoke lane。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器 / 更新 / 插件依赖 lane；这些 lane 会挂载预构建 tarball，而不是使用复制的仓库源码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于常规的已构建应用功能 lane。`scripts/package-openclaw-for-docker.mjs` 是本地 / CI 唯一的 package 打包器，并会在 Docker 使用 tarball 之前校验该 tarball 以及 `dist/postinstall-inventory.json`。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行选定计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划，其中包含选中的 lane、镜像类型、package / 实时镜像需求以及凭证检查，而不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对 provider 敏感的尾部池，默认值也为 10。重量级 lane 上限默认值分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider 上限默认按每个 provider 一个重量级 lane，通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 控制。对于更大的主机，可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某个 lane 在低并行度主机上超过了有效权重或资源上限，它仍可从空池中启动，并独占运行直到释放容量。默认会将 lane 启动间隔错开 2 秒，以避免本地 Docker daemon 在创建时发生风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认会对 Docker 执行预检查、清理过期的 OpenClaw E2E 容器、每 30 秒输出一次活跃 lane status、在兼容 lane 之间共享 provider CLI 工具缓存、默认对临时实时 provider 失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将 lane 耗时存储到 `.artifacts/docker-tests/lane-timings.json`，供后续运行按“最长优先”排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印 lane 清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整 status 输出频率，使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 可禁用耗时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 可仅运行确定性 / 本地 lane，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 可仅运行实时 provider lane；对应的 package 别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅实时模式会将主实时 lane 和尾部实时 lane 合并到一个按“最长优先”排序的池中，从而让 provider bucket 可以把 Claude、Codex 和 Gemini 的工作混合装箱。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器在首次失败后会停止调度新的池化 lane；每个 lane 都有默认 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的实时 / 尾部 lane 使用更严格的单 lane 限制。CLI 后端 Docker 设置命令也有独立超时，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个 lane 的日志、`summary.json`、`failures.json` 以及阶段耗时会写入 `.artifacts/docker-tests/<run-id>/`；可使用 `pnpm test:docker:timings <summary.json>` 检查慢 lane，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个基于 Chromium 的源码 E2E 容器，启动原始 CDP 和一个隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照中包含链接 URL、由光标提升的可点击元素、iframe 引用以及 frame 元数据。
- CLI 后端实时 Docker 探针可以作为聚焦 lane 运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不像普通的单元 / e2e 测试套件那样被期望具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器和第二个客户端容器，后者会生成 `openclaw mcp serve`，然后验证通过真实 stdio bridge 进行的路由会话发现、transcript 读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP frame，因此该 smoke 测试能够反映 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 提交 / 合并前的门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，请先重跑一次，再将其视为回归；然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 key）

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
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：以上两个预设

输出内容包括每个命令的 `sampleCount`、平均值、p50、p95、最小值 / 最大值、退出码 / signal 分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，这样耗时统计和 profile 采集会使用同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 工件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件工件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture，路径为 `test/fixtures/cli-startup-bench.json`

已检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅在需要容器化的新手引导 smoke 测试时才需要。

在一个干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证 config / workspace / session 文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke 测试（Docker）

确保维护中的 QR 运行时 helper 能在受支持的 Docker Node 运行时下正确加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
