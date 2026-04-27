---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（Vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-27T12:56:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e7fa9987f47d4953a32c3d9e29ca23d90a7ef459e36386a90e0cd0f90c99c96
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、实时、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 测试套件，这样服务端测试就不会与正在运行的实例冲突。当先前的 Gateway 网关运行导致端口 18789 仍被占用时，请使用它。
- `pnpm test:coverage`：通过 V8 覆盖率运行单元测试套件（使用 `vitest.unit.config.ts`）。这是一个基于已加载文件的单元覆盖率门控，而不是覆盖整个仓库所有文件的门控。阈值为 70% 的 lines/functions/statements 和 55% 的 branches。由于 `coverage.all` 为 false，该门控衡量的是被单元覆盖率套件加载的文件，而不是把每个拆分 lane 的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对相对于 `origin/main` 有变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本的智能变更测试运行。它会根据直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图来运行精确目标。广泛的配置/package 变更会被跳过，除非它们能映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式的广义变更测试运行。当测试 harness/配置/package 编辑应回退到 Vitest 更宽泛的变更测试行为时，请使用它。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lanes。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更检查门控。它会为受影响的架构 lanes 运行类型检查、lint 和 guard 命令，但不会运行 Vitest 测试。测试证明请使用 `pnpm test:changed` 或显式 `pnpm test <target>`。
- `pnpm test`：通过带作用域的 Vitest lanes 路由显式文件/目录目标。未指定目标的运行会使用固定分片组，并展开为叶子配置以进行本地并行执行；extensions 组总是展开为各个 extension 的分片配置，而不是一个巨大的根项目进程。
- 测试包装器运行结束时会输出一个简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自身的持续时间行仍保留为每个分片的详细信息。
- 完整、extension 和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续的整配置运行会使用这些计时数据来平衡慢分片和快分片。include-pattern CI 分片会将分片名称附加到计时键中，这样可以让过滤后的分片计时保持可见，而不会覆盖整配置计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量 lanes，仅保留 `test/setup.ts`，而运行时较重的用例仍保留在原有 lanes 中。
- 带有同级测试的源文件会优先映射到该同级测试，然后才回退到更宽泛的目录 glob。`test/helpers/channels` 和 `test/helpers/plugins` 下的辅助工具编辑会使用本地导入图来运行导入它们的测试，而不是在依赖路径明确时宽泛地运行每个分片。
- `auto-reply` 现在也被拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导更轻量的顶层 status/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有 extension/插件分片。重量级渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组保持批处理。对单个内置插件 lane 使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入拆分报告，同时仍对显式文件/目录目标使用带作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入性能分析，但仅针对相对于 `origin/main` 有变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一已提交 git diff，对比基于路由的 changed 模式路径与原生根项目运行的性能基准。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作树变更集进行性能基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元 runner 写入 CPU + heap profiles（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组时长数据以及每配置的 JSON/日志产物。测试性能 Agent 会在尝试修复慢测试前，将其用作基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以性能为重点的变更之后，对比分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS/HTTP/node 配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 workers；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行 provider 实时测试（minimax/zai）。需要 API keys 和 `LIVE=1`（或 provider 专属的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享的实时测试镜像，将 OpenClaw 一次性打包为 npm tarball，构建/复用一个裸 Node/Git runner 镜像以及一个功能镜像，将该 tarball 安装到 `/app` 中，然后通过加权调度器在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行 Docker smoke lanes。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器/更新/插件依赖 lanes；这些 lanes 会挂载预构建 tarball，而不是使用复制的仓库源码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于正常的已构建应用功能 lanes。`scripts/package-openclaw-for-docker.mjs` 是本地/CI 唯一的包打包器，并会在 Docker 使用之前验证 tarball 和 `dist/postinstall-inventory.json`。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行所选计划。`node scripts/test-docker-all.mjs --plan-json` 会输出调度器拥有的 CI 计划，其中包括所选 lanes、镜像种类、package/live-image 需求和凭证检查，而不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider 敏感的尾部池，默认值也为 10。重型 lane 上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；provider 上限默认为每个 provider 一个重型 lane，具体为 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`。对于更大的主机，请使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低并行主机上，某个 lane 超过生效的权重或资源上限，它仍然可以从空池启动，并会独占运行直到释放容量。默认情况下，lane 启动会错开 2 秒，以避免本地 Docker 守护进程创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认会对 Docker 做预检，清理陈旧的 OpenClaw E2E 容器，每 30 秒输出一次活动 lane 状态，在兼容 lanes 之间共享 provider CLI 工具缓存，默认对瞬时 live-provider 失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将 lane 时长保存到 `.artifacts/docker-tests/lane-timings.json`，供后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 输出 lane 清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 调整状态输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用计时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 可仅运行确定性/本地 lanes，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅运行 live-provider lanes；对应的 package 别名是 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅实时模式会将主 live lanes 和尾部 live lanes 合并到一个按最长优先的池中，这样 provider 桶就可以把 Claude、Codex 和 Gemini 工作打包在一起。首次失败后，runner 会停止调度新的池化 lanes，除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，并且每个 lane 都有一个 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；某些选定的 live/tail lanes 使用更严格的单 lane 上限。CLI 后端 Docker 设置命令有其自己的超时，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个 lane 的日志、`summary.json`、`failures.json` 和阶段计时都会写入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 检查慢 lanes，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 输出低成本的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个基于 Chromium 的源 E2E 容器，启动原始 CDP 和隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- CLI 后端实时 Docker 探针可以作为聚焦 lanes 运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实的代理聊天。需要可用的实时模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不期望像常规 unit/e2e 套件那样在 CI 中保持稳定。
- `pnpm test:docker:mcp-channels`：启动一个已预置的 Gateway 网关容器和第二个客户端容器，后者会生成 `openclaw mcp serve`，然后通过真实的 stdio bridge 验证路由对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试反映的是 bridge 实际发出的内容。

## 本地 PR 门控

对于本地 PR 提交/门控检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上偶发失败，请先重跑一次，再将其视为回归；然后用 `pnpm test <path/to/test>` 做隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 keys）

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
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：以上两个预设都包含

输出会包含每个命令的 `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profiles，这样计时和 profile 捕获就会使用同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture，路径为 `test/fixtures/cli-startup-bench.json`

已检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；这仅在容器化新手引导 smoke 测试中才需要。

在一个干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke（Docker）

确保所维护的 QR 运行时辅助工具能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
