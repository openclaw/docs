---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-05-05T04:26:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

- `pnpm test:force`：终止任何占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 套件，避免服务器测试与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 18789 被占用时使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率（通过 `vitest.unit.config.ts`）运行单元套件。这是已加载文件的单元覆盖率门禁，不是整个仓库的全文件覆盖率。阈值为 70% 行/函数/语句，以及 55% 分支。由于 `coverage.all` 为 false，该门禁衡量由单元覆盖率套件加载的文件，而不是把每个拆分分支源文件都视为未覆盖。
- `pnpm test:coverage:changed`：只对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本的智能变更测试运行。它会从直接测试编辑、同级 `*.test.ts` 文件、显式源码映射和本地导入图中运行精确目标。宽泛的配置/包变更会被跳过，除非它们映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式的宽泛变更测试运行。当测试工具链/配置/包编辑应回退到 Vitest 更宽泛的变更测试行为时使用。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 触发的架构分支。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能变更检查门禁。它会为受影响的架构分支运行类型检查、lint 和保护命令，但不会运行 Vitest 测试。测试证明请使用 `pnpm test:changed` 或显式的 `pnpm test <target>`。
- `pnpm test`：将显式文件/目录目标路由到有作用域的 Vitest 分支。未指定目标的运行会使用固定分片组，并展开到叶子配置以进行本地并行执行；扩展组始终展开为按扩展划分的分片配置，而不是一个巨大的根项目进程。
- 测试包装器运行结束时会显示一条简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自身的耗时行保留为每个分片的详细信息。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置夹具、工作区、智能体目录或认证资料存储时，请在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 进程 E2E 辅助工具：当 Vitest 进程级 E2E 测试需要在一个地方获得正在运行的 Gateway 网关、CLI 环境、日志捕获和清理时，请使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E 辅助工具：引用 `scripts/lib/docker-e2e-image.sh` 的分支可以把 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；多 home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。更底层的调用方可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 生成容器内 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 生成可 source 的宿主环境文件。`create` 前的 `--` 会防止较新的 Node 运行时把 `--env-file` 视为 Node 标志。启动 Gateway 网关的 Docker/Bash 分支可以在容器内 source `scripts/lib/openclaw-e2e-instance.sh`，用于入口点解析、模拟 OpenAI 启动、Gateway 网关前台/后台启动、就绪探针、状态环境导出、日志转储和进程清理。
- 完整、扩展和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续的整配置运行会使用这些计时来平衡慢速和快速分片。include-pattern CI 分片会把分片名称追加到计时键中，这样筛选后的分片计时仍然可见，而不会替换整配置计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时制品。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用轻量分支，这些分支只保留 `test/setup.ts`，让运行时较重的用例继续留在现有分支上。
- 带有同级测试的源文件会先映射到该同级测试，然后再回退到更宽泛的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的辅助工具编辑会使用本地导入图来运行导入它们的测试，而不是在依赖路径精确时宽泛运行每个分片。
- `auto-reply` 现在还会拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply 测试工具链就不会压过更轻量的顶层状态/token/辅助工具测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重型渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组保持批处理。对单个内置插件分支使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入时长和导入分解报告，同时仍然对显式文件/目录目标使用有作用域的分支路由。
- `pnpm test:perf:imports:changed`：相同的导入分析，但只针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一个已提交 git diff，对路由后的变更模式路径与原生根项目运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元运行器写入 CPU 和堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整套件 Vitest 叶子配置，并写入分组耗时数据以及每个配置的 JSON/日志制品。测试性能智能体在尝试修复慢测试之前会用它作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在性能相关变更后比较分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/node 配对）。默认使用 `threads` + `isolate: false`，并在 `vitest.e2e.config.ts` 中使用自适应 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 启用详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API key，并且需要 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，构建/复用一个裸 Node/Git 运行器镜像以及一个把该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟分支。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器/更新/插件依赖分支；这些分支会挂载预构建 tarball，而不是使用复制的仓库源码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于普通的已构建应用功能分支。`scripts/package-openclaw-for-docker.mjs` 是单一本地/CI 包打包器，并会在 Docker 使用前验证 tarball 和 `dist/postinstall-inventory.json`。Docker 分支定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行所选计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划，包含所选分支、镜像类型、包/live 镜像需求、状态场景和凭据检查，而不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部分支池，默认值为 10。重型分支上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 为每个提供商提供一个重型分支。更大的宿主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某个分支在低并行度宿主机上超过有效权重或资源上限，它仍然可以从空池启动，并会单独运行，直到释放容量。默认情况下，分支启动会错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认预检 Docker，清理陈旧的 OpenClaw E2E 容器，每 30 秒输出活动分支状态，在兼容分支之间共享提供商 CLI 工具缓存，默认对瞬时 live 提供商失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并把分支计时存储在 `.artifacts/docker-tests/lane-timings.json`，供后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印分支清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用计时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 可只运行确定性/本地分支，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 可只运行 live 提供商分支；包别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅 live 模式会把主 live 分支和尾部 live 分支合并为一个最长优先池，这样提供商桶可以一起打包 Claude、Codex 和 Gemini 工作。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，运行器会在首次失败后停止调度新的池化分支，并且每个分支都有一个 120 分钟的后备超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/尾部分支使用更严格的每分支上限。CLI 后端 Docker 设置命令有自己的超时，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个分支的日志、`summary.json`、`failures.json` 和阶段计时会写入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 可检查慢分支，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 可打印低成本的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个以 Chromium 为后端的源码 E2E 容器，启动原始 CDP 和一个隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、由光标提升的可点击项、iframe 引用和 frame 元数据。
- CLI 后端 live Docker 探针可以作为聚焦分支运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不预期像普通 unit/e2e 套件那样在 CI 中稳定。
- `pnpm test:docker:mcp-channels`：启动一个已播种的 Gateway 网关容器和第二个客户端容器，后者会生成 `openclaw mcp serve`，然后验证路由后的对话设备发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio bridge 传递的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映 bridge 实际发出的内容。
- `pnpm test:docker:upgrade-survivor`：在脏的旧用户 fixture 上安装打包后的 OpenClaw tarball，运行软件包更新以及不带实时提供商或渠道密钥的非交互式 Doctor，然后启动一个 loopback Gateway 网关，并检查智能体、渠道配置、插件 allowlist、工作区/会话文件、陈旧的旧版插件依赖状态、启动过程以及 RPC 状态是否能保留下来。
- `pnpm test:docker:published-upgrade-survivor`：默认安装 `openclaw@latest`，在没有实时提供商或渠道密钥的情况下植入真实的现有用户文件，用内置的 `openclaw config set` 命令配方配置该基线，将该已发布安装更新到打包后的 OpenClaw tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个 loopback Gateway 网关，并检查已配置的 intent、工作区/会话文件、陈旧的插件配置和旧版依赖状态、启动过程、`/healthz`、`/readyz` 以及 RPC 状态是否能保留或被干净修复。可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展精确的本地矩阵，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景 fixture；reported-issues 集包含 `configured-plugin-installs`，用于验证已配置的外部 OpenClaw 插件会在升级期间自动安装，以及 `stale-source-plugin-shadow`，用于避免仅源码插件 shadow 破坏启动。Package Acceptance 将这些暴露为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，并会先解析 `last-stable-4` 或 `all-since-2026.4.23` 等元基线 token，再把精确的软件包 spec 交给 Docker lane。
- `pnpm test:docker:update-migration`：在清理密集型 `plugin-deps-cleanup` 场景中运行已发布升级 survivor harness，默认从 `openclaw@2026.4.23` 开始。单独的 `Update Migration` workflow 会用 `baselines=all-since-2026.4.23` 扩展这个 lane，使 `.23` 及之后的每个稳定已发布软件包都更新到候选版本，并在 Full Release CI 之外证明已配置插件的依赖清理。
- `pnpm test:docker:plugins`：针对本地路径、`file:`、带提升依赖的 npm registry 软件包、git 移动 ref、ClawHub fixture、marketplace 更新，以及 Claude bundle 的启用/检查，运行安装/更新 smoke。

## 本地 PR 门禁

对于本地 PR 合入/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上出现不稳定失败，先重新运行一次，再将其视为回归，然后用 `pnpm test <path/to/test>` 隔离问题。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“只回复一个单词：好。不要标点或额外文本。”

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

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出代码/信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 配置文件，因此计时和配置文件捕获使用同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标烟雾测试产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新签入的基线 fixture：`test/fixtures/cli-startup-bench.json`

签入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与 fixture 比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅容器化新手引导烟雾测试需要它。

在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪 tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入烟雾测试（Docker）

确保维护的 QR 运行时辅助程序可在受支持的 Docker Node 运行时下加载（Node 24 默认，Node 22 兼容）：

```bash
pnpm test:docker:qr
```

## 相关

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
