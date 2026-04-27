---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 `force` / `coverage` 模式
title: 测试
x-i18n:
    generated_at: "2026-04-27T04:20:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4be52b573d7aad2f90d203491e8ccab0eefc507853c75ce14f3b12d52e365e81
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，以避免服务器测试与正在运行的实例发生冲突。当之前的 Gateway 网关运行遗留了对端口 `18789` 的占用时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，而不是整个仓库的全文件覆盖率。阈值为 70% 的行/函数/语句覆盖率，以及 55% 的分支覆盖率。由于 `coverage.all` 为 false，该门禁衡量的是被单元覆盖率测试套件加载的文件，而不是将每个拆分测试 lane 的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本的智能变更测试运行。它会根据直接修改的测试、同级 `*.test.ts` 文件、显式源码映射以及本地导入图运行精确目标。广泛的配置或 package 变更会被跳过，除非它们能够映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式的广泛变更测试运行。当测试 harness、配置或 package 的编辑应当回退到 Vitest 更广泛的变更测试行为时，请使用它。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lane。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能变更检查门禁。它会对受影响的架构 lane 运行类型检查、lint 和 guard 命令，但不会运行 Vitest 测试。如需测试证明，请使用 `pnpm test:changed` 或显式使用 `pnpm test <target>`。
- `pnpm test`：通过有作用域的 Vitest lane 路由显式的文件/目录目标。未指定目标的运行会使用固定的 shard 分组，并展开为叶子配置，以便本地并行执行；扩展组始终会展开为各个扩展/插件的 shard 配置，而不是用一个巨大的根项目进程来运行。
- 测试包装器运行结束时会输出简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自身的耗时行则保留为每个 shard 的详细信息。
- 完整、扩展和 include-pattern shard 运行会将本地耗时数据更新到 `.artifacts/vitest-shard-timings.json`；后续整套配置运行会利用这些耗时信息来平衡慢速和快速 shard。include-pattern CI shard 会将 shard 名称追加到耗时键名中，从而在不覆盖整套配置耗时数据的情况下保留筛选 shard 的耗时可见性。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时产物。
- 部分选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量 lane，只保留 `test/setup.ts`，而运行时较重的用例仍保留在现有 lane 上。
- 带有同级测试的源文件会优先映射到该同级测试，然后才回退到更宽泛的目录 glob。`test/helpers/channels` 和 `test/helpers/plugins` 下的辅助文件编辑会使用本地导入图来运行导入它们的测试，而不是在依赖路径精确时广泛运行所有 shard。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻量的顶层 status/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 会运行所有扩展/插件 shard。重量级渠道插件、浏览器插件和 OpenAI 会作为专用 shard 运行；其他插件组仍保持批量处理。对单个内置插件 lane，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时与导入拆解报告，同时仍对显式文件/目录目标使用有作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对相同的已提交 git diff，对路由后的 changed 模式路径与原生根项目运行进行基准比较。
- `pnpm test:perf:changed:bench -- --worktree`：对当前工作树变更集进行基准测试，无需先提交。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组耗时数据以及每个配置的 JSON/日志产物。Test Performance Agent 会在尝试修复慢测试之前，将其作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以性能为重点的变更之后，对分组报告进行比较。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 显式启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可通过 `OPENCLAW_E2E_WORKERS=<n>` 进行调优，并设置 `OPENCLAW_E2E_VERBOSE=1` 以启用详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API key，并设置 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，构建或复用一个裸 Node/Git 运行器镜像以及一个功能镜像，并将该 tarball 安装到 `/app`，然后通过加权调度器使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker smoke lane。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器、更新和插件依赖 lane；这些 lane 会挂载预构建的 tarball，而不是使用复制的仓库源码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于常规的已构建应用功能 lane。`scripts/package-openclaw-for-docker.mjs` 是本地/CI 共享的唯一 package 打包器，并会在 Docker 使用之前验证 tarball 以及 `dist/postinstall-inventory.json`。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 负责执行选定的计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器持有的 CI 计划，包含所选 lane、镜像类型、package/live 镜像需求和凭证检查，而不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值也为 10。重量级 lane 限制默认值为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商限制默认是每个提供商一个重量级 lane，由 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 控制。对于更大的主机，可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低并行主机上，某个 lane 超过了有效的权重或资源上限，它仍可以从空池启动，并会独占运行直到释放容量。默认情况下，lane 启动会间隔 2 秒，以避免本地 Docker daemon 出现 create 风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认会对 Docker 进行预检，清理陈旧的 OpenClaw E2E 容器，每 30 秒输出一次活动 lane 状态，在兼容 lane 之间共享提供商 CLI 工具缓存，对瞬态 live 提供商失败默认重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将 lane 耗时存储在 `.artifacts/docker-tests/lane-timings.json` 中，以便后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印 lane 清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出频率，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用耗时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 可仅运行确定性/本地 lane，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅运行 live 提供商 lane；对应的 package 别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅 live 模式会将主 live lane 与尾部 live lane 合并为一个按最长优先排序的池，以便提供商桶可以一起打包 Claude、Codex 和 Gemini 工作。发生首次失败后，运行器会停止调度新的池化 lane，除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`；每个 lane 都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；某些选定的 live/tail lane 会使用更紧的逐 lane 上限。CLI 后端 Docker 设置命令有单独的超时，由 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个 lane 的日志、`summary.json`、`failures.json` 和阶段耗时都会写入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 可检查慢速 lane，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 可打印低成本的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个由 Chromium 支持的源码 E2E 容器，启动原始 CDP 和一个隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照是否包含链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- CLI 后端 live Docker 探针可以作为聚焦 lane 运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要一个可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像普通单元/e2e 测试套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个已预置种子的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证通过真实 stdio bridge 进行的路由会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及类 Claude 的渠道和权限通知。Claude 通知断言会直接读取原始 stdio MCP frame，因此该 smoke 测试能够反映 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合并/门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上偶发失败，在将其视为回归之前先重跑一次，然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 key）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

最近一次运行（2025-12-31，20 次运行）：

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

输出内容包括每个命令的 `sampleCount`、平均值、p50、p95、最小值/最大值、exit-code/signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此耗时采集和 profile 捕获会使用同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向的 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已签入的基线 fixture `test/fixtures/cli-startup-bench.json`

已签入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化的新手引导 smoke 测试时才需要它。

在干净的 Linux 容器中运行完整的冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关 并运行 `openclaw health`。

## 二维码导入 smoke（Docker）

确保维护中的二维码运行时辅助程序能够在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [Testing live](/zh-CN/help/testing-live)
