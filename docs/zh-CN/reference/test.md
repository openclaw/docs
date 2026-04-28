---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-28T23:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2159520dd308440fce5d82ba251e1f3a37bd37a152b7c5542e92f5cbf924a34
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（套件、实时、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 套件，避免服务器测试与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 18789 被占用时使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。这是已加载文件的单元覆盖率门禁，不是整个仓库的全文件覆盖率。阈值为 70% 行/函数/语句，以及 55% 分支。由于 `coverage.all` 为 false，该门禁会衡量单元覆盖率套件加载的文件，而不是把每个拆分通道的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本智能变更测试运行。它会根据直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图运行精确目标。宽泛的配置/包变更会被跳过，除非它们映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式宽泛变更测试运行。当测试 harness、配置或包编辑应回退到 Vitest 更宽泛的变更测试行为时使用。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的差异触发的架构通道。
- `pnpm check:changed`：针对相对于 `origin/main` 的差异运行智能变更检查门禁。它会为受影响的架构通道运行类型检查、lint 和防护命令，但不会运行 Vitest 测试。使用 `pnpm test:changed` 或显式 `pnpm test <target>` 获取测试证明。
- `pnpm test`：将显式文件/目录目标路由到作用域内的 Vitest 通道。未指定目标的运行会使用固定分片组，并展开为叶子配置以便本地并行执行；插件组始终展开为按插件划分的分片配置，而不是一个巨大的根项目进程。
- 测试包装器运行结束时会带有简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗时行保留为每个分片的详细信息。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置夹具、工作区、智能体目录或认证配置文件存储时，在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。对于需要运行中 Gateway 网关的进程级 E2E 测试，使用 `test/helpers/openclaw-test-instance.ts`，让状态、配置、CLI 环境、Gateway 网关启动、日志捕获和清理保持在一起。引用 `scripts/lib/docker-e2e-image.sh` 的 Docker/Bash E2E 通道可以把 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并在那里 `eval` 解码后的片段；多 home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。更低层的调用方可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 生成容器内 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 生成可 source 的宿主环境文件。`create` 前面的 `--` 会阻止较新的 Node 运行时把 `--env-file` 当作 Node 标志处理。
- 完整、插件和包含模式分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；之后的整配置运行会使用这些计时来平衡慢分片和快分片。包含模式 CI 分片会把分片名称追加到计时键中，这样过滤后的分片计时可见，同时不会替换整配置计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用轻量通道，这些通道只保留 `test/setup.ts`，运行时较重的用例仍留在现有通道上。
- 带有同级测试的源文件会先映射到该同级测试，然后再回退到更宽泛的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的辅助代码编辑会使用本地导入图来运行导入它们的测试，而不是在依赖路径精确时宽泛运行每个分片。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此回复 harness 不会压过更轻量的顶层 Status、令牌和辅助测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有插件分片。重型渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组保持批处理。使用 `pnpm test extensions/<id>` 运行一个内置插件通道。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时和导入拆解报告，同时仍对显式文件/目录目标使用作用域通道路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一个已提交 git 差异，对路由后的变更模式路径与原生根项目运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作区变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元 runner 写入 CPU 和堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整套件 Vitest 叶子配置，并写入分组耗时数据以及每个配置的 JSON/日志产物。测试性能智能体在尝试修复慢测试之前使用它作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以性能为重点的变更之后比较分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/node 配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 worker；可用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，构建/复用裸 Node/Git runner 镜像以及一个把该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟通道。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器、更新和插件依赖通道；这些通道挂载预构建 tarball，而不是使用复制的仓库源。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于普通已构建应用功能通道。`scripts/package-openclaw-for-docker.mjs` 是单一的本地/CI 包打包器，会在 Docker 使用之前验证 tarball 和 `dist/postinstall-inventory.json`。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划，内容包括选定通道、镜像种类、包/实时镜像需求、状态场景和凭据检查，而不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值为 10。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 设为每个提供商一个重型通道。较大的宿主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某个通道在低并行度宿主机上超过有效权重或资源上限，它仍可从空池启动，并会单独运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认会预检 Docker，清理过期的 OpenClaw E2E 容器，每 30 秒输出活动通道 Status，在兼容通道之间共享提供商 CLI 工具缓存，默认重试一次短暂的实时提供商失败（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将通道计时存储到 `.artifacts/docker-tests/lane-timings.json`，供后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印通道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整 Status 输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用计时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 仅运行确定性/本地通道，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅运行实时提供商通道；包别名是 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅实时模式会把主实时通道和尾部实时通道合并到一个最长优先池中，使提供商桶可以一起打包 Claude、Codex 和 Gemini 工作。除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 在首次失败后会停止调度新的池化通道；每个通道都有一个 120 分钟的回退超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时/尾部通道使用更严格的逐通道上限。CLI 后端 Docker 设置命令有自己的超时，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每通道日志、`summary.json`、`failures.json` 和阶段计时会写入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 检查慢通道，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建基于 Chromium 的源码 E2E 容器，启动原始 CDP 和隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- CLI 后端实时 Docker 探针可以作为聚焦通道运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有匹配的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型密钥（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不预期像普通单元/E2E 套件那样具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个已播种的 Gateway 网关容器和第二个客户端容器，后者会生成 `openclaw mcp serve`，然后验证路由会话发现、transcript 读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio bridge 传输的 Claude 风格渠道和权限通知。Claude 通知断言会直接读取原始 stdio MCP frame，因此该冒烟测试反映 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合入/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上偶发失败，先重跑一次，再将其视为回归，然后用 `pnpm test <path/to/test>` 隔离问题。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“只回复一个单词：ok。不要标点或额外文本。”

上次运行（2025-12-31，20 次运行）：

- minimax 中位数 1279ms（最小值 1114，最大值 2431）
- opus 中位数 2454ms（最小值 1224，最大值 3170）

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
- `all`：两个预设

输出包含每个命令的 `sampleCount`、平均值、p50、p95、最小值/最大值、退出码/信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 配置文件，因此计时和配置文件捕获使用同一个执行框架。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 将目标冒烟测试产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 使用 `runs=5` 和 `warmup=1` 将完整套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 使用 `runs=5` 和 `warmup=1` 刷新已检入的基线夹具 `test/fixtures/cli-startup-bench.json`

已检入夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与夹具比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅容器化新手引导冒烟测试需要它。

在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪 tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护中的 QR 运行时助手能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
