---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-05-06T05:09:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（套件、实时、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

- `pnpm test:force`：终止任何占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 套件，避免服务器测试与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 18789 被占用时使用它。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。这是默认单元 lane 的覆盖率门禁，不是整个仓库的全文件覆盖率。阈值为行/函数/语句 70%，分支 55%。由于 `coverage.all` 为 false，并且默认 lane 会将覆盖率 include 范围限定为带有同级源文件的非 fast 单元测试，该门禁衡量的是此 lane 拥有的源代码，而不是它碰巧加载的每个传递导入。
- `pnpm test:coverage:changed`：只对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本的智能变更测试运行。它会从直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图中运行精确目标。宽泛/config/package 变更会被跳过，除非它们映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式宽泛变更测试运行。当测试 harness/config/package 编辑应回退到 Vitest 更宽泛的变更测试行为时使用。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 触发的架构 lane。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更检查门禁。它会为受影响的架构 lane 运行 typecheck、lint 和守卫命令，但不会运行 Vitest 测试。测试证明请使用 `pnpm test:changed` 或显式 `pnpm test <target>`。
- `pnpm test`：将显式文件/目录目标路由到有作用域的 Vitest lane。未指定目标的运行会使用固定分片组，并扩展为 leaf 配置以进行本地并行执行；插件组始终扩展为每个插件的分片配置，而不是一个巨大的根项目进程。
- 测试包装器运行会以简短的 `[test] passed|failed|skipped ... in ...` 摘要结束。Vitest 自身的耗时行保留为每个分片的详细信息。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置 fixture、工作区、智能体目录或 auth-profile 存储时，在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 进程 E2E 辅助工具：当 Vitest 进程级 E2E 测试需要在一个位置获得正在运行的 Gateway 网关、CLI 环境、日志捕获和清理时，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 辅助工具：source `scripts/lib/docker-e2e-image.sh` 的 lane 可以将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；多 home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。更底层的调用方可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 获取容器内 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 生成可 source 的宿主 env 文件。`create` 之前的 `--` 会阻止较新的 Node 运行时将 `--env-file` 当作 Node 标志处理。启动 Gateway 网关的 Docker/Bash lane 可以在容器内 source `scripts/lib/openclaw-e2e-instance.sh`，用于入口点解析、模拟 OpenAI 启动、Gateway 网关前台/后台启动、就绪探测、状态环境导出、日志转储和进程清理。
- 完整、插件和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地时序数据；后续 whole-config 运行会使用这些时序来平衡慢分片和快分片。Include-pattern CI 分片会把分片名追加到时序键中，从而在不替换 whole-config 时序数据的情况下保持筛选后分片时序可见。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地时序产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用轻量 lane，这些 lane 只保留 `test/setup.ts`，而将运行时较重的用例留在其现有 lane 上。
- 带有同级测试的源文件会先映射到该同级测试，然后再回退到更宽的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的辅助工具编辑会使用本地导入图运行导入它们的测试，而不是在依赖路径精确时宽泛运行每个分片。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply harness 不会主导更轻量的顶层状态/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重型渠道插件、浏览器插件和 OpenAI 作为专用分片运行；其他插件组保持批处理。对单个内置插件 lane 使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入拆分报告，同时仍对显式文件/目录目标使用有作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但只针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对同一个已提交 git diff，对比已路由的 changed-mode 路径与原生根项目运行的基准性能。
- `pnpm test:perf:changed:bench -- --worktree` 会在不先提交的情况下，对当前工作区变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元 runner 写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个 full-suite Vitest leaf 配置，并写入分组耗时数据以及每个配置的 JSON/log 产物。Test Performance Agent 会在尝试修复慢测试之前将其用作基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在性能相关变更之后比较分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/node 配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API key 和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享 live-test 镜像，将 OpenClaw 一次打包为 npm tarball，构建/复用裸 Node/Git runner 镜像以及把该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟 lane。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于 installer/update/plugin-dependency lane；这些 lane 会挂载预构建 tarball，而不是使用复制的仓库源代码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于普通 built-app 功能 lane。`scripts/package-openclaw-for-docker.mjs` 是唯一的本地/CI package 打包器，并会在 Docker 使用前验证 tarball 和 `dist/postinstall-inventory.json`。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行所选计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划，包含所选 lane、镜像类型、package/live-image 需求、状态场景和凭证检查，而不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制提供商敏感 tail 池，默认值为 10。重型 lane 上限默认值为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 为每个提供商设置一个重型 lane。较大的主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低并行度主机上某个 lane 超过有效权重或资源上限，它仍可从空池启动，并会独占运行直到释放容量。默认情况下，lane 启动会错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认预检 Docker，清理陈旧的 OpenClaw E2E 容器，每 30 秒发出 active-lane 状态，在兼容 lane 之间共享提供商 CLI 工具缓存，默认对瞬态 live-provider 失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将 lane 时序存储在 `.artifacts/docker-tests/lane-timings.json` 中，以便后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印 lane 清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用时序复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 仅运行确定性/本地 lane，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅运行 live-provider lane；package 别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only 模式会将主 live lane 和 tail live lane 合并为一个 longest-first 池，使提供商 bucket 可以一起打包 Claude、Codex 和 Gemini 工作。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在第一次失败后停止调度新的 pooled lane；每个 lane 都有 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lane 使用更严格的每 lane 上限。CLI 后端 Docker 设置命令有自己的超时，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 设置（默认 180）。每个 lane 的日志、`summary.json`、`failures.json` 和阶段时序会写入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 检查慢 lane，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个由 Chromium 支撑的源 E2E 容器，启动原始 CDP 和隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP role 快照包含链接 URL、提升为光标可点击项的元素、iframe 引用和 frame 元数据。
- CLI 后端 live Docker 探针可以作为聚焦 lane 运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有匹配的 `:resume` 与 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不预期像普通单元/e2e 套件那样具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个已播种的 Gateway 网关容器和第二个客户端容器，后者会生成 `openclaw mcp serve`，然后验证已路由的对话发现、对话记录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio bridge 传输的 Claude 风格渠道和权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试反映 bridge 实际发出的内容。
- `pnpm test:docker:upgrade-survivor`：将打包的 OpenClaw tarball 安装到一个脏的老用户 fixture 上，在没有实时提供商或渠道密钥的情况下运行 package update 和非交互式 Doctor，然后启动 local loopback Gateway 网关，并检查智能体、渠道配置、插件 allowlist、工作区/会话文件、陈旧的旧版插件依赖状态、启动和 RPC Status 是否保留。
- `pnpm test:docker:published-upgrade-survivor`：默认安装 `openclaw@latest`，在没有实时提供商或渠道密钥的情况下播种真实的现有用户文件，用内置的 `openclaw config set` 命令配方配置该基线，将该已发布安装更新为打包的 OpenClaw tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动 local loopback Gateway 网关，并检查已配置的 intent、工作区/会话文件、陈旧插件配置和旧版依赖状态、启动、`/healthz`、`/readyz` 以及 RPC Status 是否保留或干净修复。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展精确本地矩阵，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景 fixture；reported-issues 集合包含 `configured-plugin-installs`，用于验证已配置的外部 OpenClaw 插件会在升级期间自动安装，还包含 `stale-source-plugin-shadow`，用于防止仅源码插件 shadow 破坏启动。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，并在将精确 package spec 交给 Docker lane 前解析 `last-stable-4` 或 `all-since-2026.4.23` 等元基线 token。
- `pnpm test:docker:update-migration`：在 cleanup 较重的 `plugin-deps-cleanup` 场景中运行 published-upgrade survivor harness，默认从 `openclaw@2026.4.23` 开始。单独的 `Update Migration` workflow 会用 `baselines=all-since-2026.4.23` 扩展此 lane，使从 `.23` 开始的每个已发布稳定 package 都更新到候选版本，并在 Full Release CI 之外证明已配置插件的依赖清理。
- `pnpm test:docker:plugins`：运行安装/更新 smoke 测试，覆盖本地路径、`file:`、带提升依赖的 npm registry package、git moving ref、ClawHub fixture、marketplace 更新，以及 Claude bundle 启用/inspect。

## 本地 PR 门禁

对于本地 PR 合入/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现不稳定失败，在将其视为回归之前先重跑一次，然后用 `pnpm test <path/to/test>` 隔离问题。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

上次运行（2025-12-31，20 次运行）：

- minimax 中位数 1279ms（最小 1114，最大 2431）
- opus 中位数 2454ms（最小 1224，最大 3170）

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
- `all`：两个预设

输出包含每个命令的 `sampleCount`、平均值、p50、p95、最小值/最大值、退出码/信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获使用同一套 harness。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向 smoke 构件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整套件构件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture `test/fixtures/cli-startup-bench.json`

已检入 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与 fixture 对比

## 新手引导 E2E（Docker）

Docker 是可选的；仅在需要容器化新手引导 smoke 测试时才需要。

在干净 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本会通过伪 tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke（Docker）

确保维护中的 QR 运行时辅助工具可以在受支持的 Docker Node 运行时（默认 Node 24，兼容 Node 22）下加载：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
