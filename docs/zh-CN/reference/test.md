---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-05-01T22:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3dddc0a772a422264f52096a43c601897fa0109c600f26d45274409fe26c5184
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（套件、实时测试、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

- `pnpm test:force`：终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 套件，避免服务器测试与正在运行的实例冲突。当先前的 Gateway 网关运行让端口 18789 被占用时使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。这是已加载文件的单元覆盖率门禁，不是整个仓库所有文件的覆盖率。阈值为行/函数/语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁衡量单元覆盖率套件加载的文件，而不是把每个拆分车道的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来更改的文件运行单元覆盖率。
- `pnpm test:changed`：低成本的智能变更测试运行。它会从直接测试编辑、同级 `*.test.ts` 文件、显式源码映射以及本地导入图中运行精确目标。宽泛的配置/包更改会被跳过，除非它们映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式宽泛变更测试运行。当测试 harness/配置/包编辑应回退到 Vitest 更宽泛的变更测试行为时使用。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 触发的架构车道。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更检查门禁。它会为受影响的架构车道运行 typecheck、lint 和 guard 命令，但不会运行 Vitest 测试。使用 `pnpm test:changed` 或显式 `pnpm test <target>` 作为测试证明。
- `pnpm test`：将显式文件/目录目标路由到有作用域的 Vitest 车道。无目标运行会使用固定分片组，并展开到叶子配置以便本地并行执行；扩展组始终展开到按扩展划分的分片配置，而不是一个巨大的根项目进程。
- 测试包装器运行结束时会输出简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗时行仍作为每个分片的细节保留。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置 fixture、工作区、智能体目录或 auth-profile 存储时，在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 进程 E2E helper：当 Vitest 进程级 E2E 测试需要运行中的 Gateway 网关、CLI 环境、日志捕获和集中清理时，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的车道可以把 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；多 home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。更底层的调用方可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 获取容器内 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 获取可 source 的主机环境文件。`create` 前的 `--` 可避免较新的 Node 运行时把 `--env-file` 当作 Node 标志处理。启动 Gateway 网关的 Docker/Bash 车道可以在容器内 source `scripts/lib/openclaw-e2e-instance.sh`，用于入口点解析、mock OpenAI 启动、Gateway 网关前台/后台启动、就绪探针、状态环境导出、日志转储和进程清理。
- 完整、扩展和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续 whole-config 运行会使用这些计时来平衡慢分片和快分片。Include-pattern CI 分片会把分片名称追加到计时键中，这让过滤后的分片计时保持可见，同时不会替换 whole-config 计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时 artifact。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用轻量车道，这些车道只保留 `test/setup.ts`，而运行时较重的用例仍留在现有车道上。
- 带有同级测试的源文件会先映射到该同级测试，再回退到更宽的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 编辑会使用本地导入图运行导入它们的测试，而不是在依赖路径精确时宽泛运行每个分片。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻量的顶层 status/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重型渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组保持批处理。对单个内置插件车道使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入分解报告，同时仍对显式文件/目录目标使用有作用域的车道路由。
- `pnpm test:perf:imports:changed`：相同的导入性能分析，但仅针对自 `origin/main` 以来更改的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一个已提交的 git diff，对路由后的 changed-mode 路径和原生根项目运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元 runner 写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个 full-suite Vitest 叶子配置，并写入分组耗时数据以及每配置 JSON/日志 artifact。Test Performance Agent 在尝试修复慢测试前会使用它作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在面向性能的更改之后比较分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS/HTTP/node 配对）。默认使用 `threads` + `isolate: false`，并在 `vitest.e2e.config.ts` 中使用自适应 worker；用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API key 和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，构建/复用一个裸 Node/Git runner 镜像以及一个会把该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker smoke 车道。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器/更新/插件依赖车道；这些车道挂载预构建的 tarball，而不是使用复制的仓库源码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于普通构建后应用功能车道。`scripts/package-openclaw-for-docker.mjs` 是唯一的本地/CI 包打包器，会在 Docker 消费前校验 tarball 和 `dist/postinstall-inventory.json`。Docker 车道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划，其中包含选定车道、镜像类型、包/live-image 需求、状态场景和凭据检查，但不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制提供商敏感的尾部池，默认值为 10。重型车道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 设为每个提供商一个重型车道。更大的主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低并行主机上某个车道超过有效权重或资源上限，它仍可以从空池启动，并会独占运行直到释放容量。车道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认会预检 Docker、清理陈旧的 OpenClaw E2E 容器、每 30 秒输出活动车道状态、在兼容车道之间共享提供商 CLI 工具缓存、默认对瞬时 live-provider 失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将车道计时存储在 `.artifacts/docker-tests/lane-timings.json` 中，用于后续运行的 longest-first 排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印车道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用计时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 仅运行确定性/本地车道，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅运行 live-provider 车道；包别名是 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only 模式会把主 live 车道和尾部 live 车道合并为一个 longest-first 池，使提供商桶可以一起打包 Claude、Codex 和 Gemini 工作。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，runner 会在首次失败后停止调度新的池化车道，并且每个车道都有 120 分钟的回退超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 车道使用更严格的每车道上限。CLI 后端 Docker 设置命令通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 拥有自己的超时（默认 180）。每车道日志、`summary.json`、`failures.json` 和阶段计时会写入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 检查慢车道，并使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个 Chromium 支持的源码 E2E 容器，启动原始 CDP 和隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP role 快照包含链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- CLI 后端 live Docker 探针可以作为聚焦车道运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有匹配的 `:resume` 与 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实的代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不像普通 unit/e2e 套件那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个已种子化的 Gateway 网关容器和第二个客户端容器，后者会生成 `openclaw mcp serve`，然后验证路由会话发现、transcript 读取、附件元数据、live event queue 行为、出站发送路由，以及通过真实 stdio bridge 传递的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP frame，因此 smoke 能反映该 bridge 实际发出的内容。
- `pnpm test:docker:upgrade-survivor`：将打包的 OpenClaw tarball 安装到有脏数据的旧用户 fixture 上，在没有实时提供商或渠道密钥的情况下运行包更新和非交互式 Doctor，然后启动一个环回 Gateway 网关，并检查智能体、渠道配置、插件允许列表、工作区/会话文件、过时的旧版插件依赖状态、启动过程和 RPC 状态是否保留下来。
- `pnpm test:docker:published-upgrade-survivor`：默认安装 `openclaw@latest`，在没有实时提供商或渠道密钥的情况下植入真实的现有用户文件，用内置的 `openclaw config set` 命令配方配置该基线，将该已发布安装更新到打包的 OpenClaw tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个环回 Gateway 网关，并检查已配置的 intent、工作区/会话文件、过时的插件配置和旧版依赖状态、启动过程、`/healthz`、`/readyz` 和 RPC 状态是否保留下来或被干净修复。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖单个基线，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展开精确矩阵，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景 fixture；Package Acceptance 会将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。

## 本地 PR 门禁

对于本地 PR 合并/门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上出现偶发失败，请先重跑一次，再将其视为回归，然后用 `pnpm test <path/to/test>` 隔离问题。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“只用一个单词回复：ok。不要标点或额外文本。”

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

输出会包含每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出码/信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获会使用同一个 harness。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标冒烟构件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将全套构件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新检入的基线 fixture：`test/fixtures/cli-startup-bench.json`

检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与 fixture 比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅容器化新手引导冒烟测试需要它。

在干净 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护中的 QR 运行时辅助程序可在受支持的 Docker Node 运行时下加载（Node 24 默认，Node 22 兼容）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
