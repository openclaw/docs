---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest）以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-06-27T03:19:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（套件、live、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

- 常规本地测试顺序：
  1. `pnpm test:changed`，用于变更范围的 Vitest 证明。
  2. `pnpm test <path-or-filter>`，用于单个文件、目录或显式目标。
  3. `pnpm test`，仅在你明确需要完整本地 Vitest 套件时使用。
- `pnpm test:force`：终止任何占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 套件，避免服务器测试与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 18789 被占用时使用。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。这是默认单元通道的覆盖率门禁，不是整个仓库所有文件的覆盖率。阈值为 70% 行/函数/语句和 55% 分支。由于 `coverage.all` 为 false，且默认通道将覆盖率 include 范围限定为带有同级源文件的非 fast 单元测试，因此该门禁衡量的是此通道拥有的源代码，而不是它碰巧加载的每个传递导入。
- `pnpm test:coverage:changed`：仅对相对 `origin/main` 已变更的文件运行单元覆盖率。
- `pnpm test:changed`：低成本智能变更测试运行。它会根据直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图运行精确目标。宽泛的配置/package 变更会被跳过，除非它们能映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式宽泛变更测试运行。当测试 harness/config/package 编辑应回退到 Vitest 更宽泛的变更测试行为时使用。
- `pnpm changed:lanes`：显示相对 `origin/main` 的 diff 触发的架构通道。
- `pnpm check:changed`：在 CI 外默认委托给 Crabbox/Testbox，然后在远程子进程内针对相对 `origin/main` 的 diff 运行智能变更检查门禁。它会为受影响的架构通道运行 typecheck、lint 和 guard 命令，但不会运行 Vitest 测试。使用 `pnpm test:changed` 或显式 `pnpm test <target>` 获取测试证明。
- Codex worktree 和 linked/sparse checkout：避免直接在本地运行 `pnpm test*`、`pnpm check*` 和 `pnpm crabbox:run`，除非你已确认 pnpm 不会调和依赖。对于很小的显式文件证明，使用 `node scripts/run-vitest.mjs <path-or-filter>`；对于变更门禁或宽泛证明，使用 `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，让 pnpm 在 Testbox 内运行。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：对于 `pnpm check:changed` 和定向 `pnpm test ...` 等命令，将 heavy-check 序列化限制在当前 worktree 内，而不是 Git common dir。仅在高容量本地主机上有意跨 linked worktree 运行独立检查时使用。
- `pnpm test`：通过有范围的 Vitest 通道路由显式文件/目录目标。无目标运行是完整套件证明：它们使用固定 shard 组，展开为 leaf config 以便本地并行执行，并在开始前打印预期的本地 shard fanout。extension 组始终展开为每个 extension 的 shard config，而不是一个巨大的根项目进程。
- 测试包装器运行结束时会输出简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗时行保留为每个 shard 的详细信息。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置 fixture、工作区、agent 目录或 auth-profile 存储时，在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- `pnpm test:env-mutations:report`：非阻塞报告，列出直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相关 OpenClaw 环境变量键的测试和 harness。用它查找迁移到共享 test-state helper 的候选项。
- Control UI mock E2E：使用 `pnpm test:ui:e2e` 运行 Vitest + Playwright 通道，该通道会启动 Vite Control UI，并驱动真实 Chromium 页面连接 mock 的 Gateway 网关 WebSocket。测试位于 `ui/src/**/*.e2e.test.ts`；共享 mock 和控件位于 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此通道。在 Codex worktree 中，安装依赖后，针对很小的定向证明优先使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`；更宽泛的 GUI 证明使用 Testbox/Crabbox。
- 进程 E2E helper：当 Vitest 进程级 E2E 测试需要在一个地方处理正在运行的 Gateway 网关、CLI 环境变量、日志捕获和清理时，使用 `test/helpers/openclaw-test-instance.ts`。
- TUI PTY 测试：使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 运行快速 fake-backend PTY 通道。使用 `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local` 运行较慢的 `tui --local` smoke，该模式只 mock 外部模型端点。断言稳定的可见文本或 fixture 调用，而不是原始 ANSI 快照。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的通道可以将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；multi-home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个 flow 中调用 `openclaw_test_state_create <label> <scenario>`。较低层调用方可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 生成容器内 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 生成可 source 的宿主环境变量文件。`create` 前面的 `--` 可防止较新的 Node runtime 将 `--env-file` 当作 Node flag。启动 Gateway 网关的 Docker/Bash 通道可以在容器内 source `scripts/lib/openclaw-e2e-instance.sh`，用于 entrypoint 解析、mock OpenAI 启动、Gateway 网关前台/后台启动、就绪探针、状态环境变量导出、日志 dump 和进程清理。
- 完整、extension 和 include-pattern shard 运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续 whole-config 运行会使用这些计时来平衡慢 shard 和快 shard。include-pattern CI shard 会将 shard 名称追加到计时键，这样可在不替换 whole-config 计时数据的情况下保留 filtered shard 计时可见性。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时 artifact。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在通过专用轻量通道路由，这些通道只保留 `test/setup.ts`，而 runtime-heavy 用例留在其现有通道上。
- 带有同级测试的源文件会先映射到该同级测试，再回退到更宽的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 编辑会使用本地导入图来运行导入它们的测试，而不是在依赖路径精确时宽泛运行每个 shard。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 不会压过较轻的 top-level status/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有 extension/plugin shard。重型渠道插件、浏览器插件和 OpenAI 作为专用 shard 运行；其他插件组保持批处理。使用 `pnpm test extensions/<id>` 运行一个内置插件通道。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入拆解报告，同时仍对显式文件/目录目标使用有范围的通道路由。
- `pnpm test:perf:imports:changed`：相同的导入分析，但仅针对相对 `origin/main` 已变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一个已提交 git diff，对 routed changed-mode 路径和原生 root-project 运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前 worktree 变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元 runner 写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整套件 Vitest leaf config，并写入分组耗时数据以及每个配置的 JSON/log artifact。Test Performance Agent 在尝试修复慢测试之前使用它作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在面向性能的变更后比较分组报告。
- `pnpm test:docker:timings <summary.json>`：在 Docker all 运行后检查慢 Docker 通道；使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 从同一批 artifact 打印低成本定向重跑命令。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行仓库 E2E 聚合：Gateway 网关端到端 smoke 测试，以及 Control UI mock 浏览器 E2E 通道。
- `pnpm test:e2e:gateway`：运行 Gateway 网关端到端 smoke 测试（多实例 WS/HTTP/node 配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 worker；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API keys 和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才会取消跳过。
- `pnpm test:docker:all`：构建共享实时测试镜像，将 OpenClaw 打包一次为 npm tarball，构建或复用一个基础 Node/Git 运行器镜像，以及一个将该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟测试通道。基础镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于安装器、更新和插件依赖测试通道；这些测试通道会挂载预构建 tarball，而不是使用复制的仓库源码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于普通的已构建应用功能测试通道。`scripts/package-openclaw-for-docker.mjs` 是唯一的本地/CI 包打包器，并会在 Docker 使用之前验证 tarball 以及 `dist/postinstall-inventory.json`。Docker 测试通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定的计划。`node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划，涵盖所选测试通道、镜像类型、包/实时镜像需求、状态场景和凭据检查，而不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值为 10。重型测试通道上限默认值为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 为每个提供商设置一个重型测试通道。对更大的主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某个测试通道在低并行度主机上超过有效权重或资源上限，它仍可从空池启动，并会独占运行，直到释放容量。测试通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。运行器默认预检 Docker，清理陈旧的 OpenClaw E2E 容器，每 30 秒输出活动测试通道状态，在兼容测试通道之间共享提供商 CLI 工具缓存，默认重试一次瞬态实时提供商失败（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将测试通道耗时存储在 `.artifacts/docker-tests/lane-timings.json`，供后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印测试通道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调节状态输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用耗时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 仅运行确定性/本地测试通道，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅运行实时提供商测试通道；包别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅实时模式会将主实时测试通道和尾部实时测试通道合并为一个最长优先池，使提供商桶能够一起装入 Claude、Codex 和 Gemini 工作。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化测试通道；每个测试通道都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时/尾部测试通道使用更严格的单测试通道上限。CLI 后端 Docker 设置命令有自己的超时，由 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。单测试通道日志、`summary.json`、`failures.json` 和阶段耗时会写入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 检查慢测试通道，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个由 Chromium 支持的源码 E2E 容器，启动原始 CDP 和一个隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- `pnpm test:docker:skill-install`：在基础 Docker 运行器中安装打包后的 OpenClaw tarball，禁用 `skills.install.allowUploadedArchives`，通过实时 ClawHub 搜索解析当前 skill slug，经由 `openclaw skills install` 安装它，并验证 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。
- CLI 后端实时 Docker 探针可作为聚焦测试通道运行，例如 `pnpm test:docker:live-cli-backend:claude`、`pnpm test:docker:live-cli-backend:claude:resume` 或 `pnpm test:docker:live-cli-backend:claude:mcp`。Gemini 有匹配的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型密钥，会拉取外部 Open WebUI 镜像，并且不预期像普通单元/E2E 套件那样具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个已播种的 Gateway 网关容器，以及第二个会生成 `openclaw mcp serve` 的客户端容器，然后验证已路由的对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio bridge 传递的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映 bridge 实际输出的内容。
- `pnpm test:docker:upgrade-survivor`：在脏的旧用户 fixture 上安装打包后的 OpenClaw tarball，在没有实时提供商或渠道密钥的情况下运行包更新和非交互式 Doctor，然后启动一个 loopback Gateway 网关，并检查智能体、渠道配置、插件允许列表、工作空间/会话文件、陈旧的旧版插件依赖状态、启动和 RPC 状态是否存续。
- `pnpm test:docker:published-upgrade-survivor`：默认安装 `openclaw@latest`，在没有实时提供商或渠道密钥的情况下播种真实的现有用户文件，使用内置的 `openclaw config set` 命令配方配置该基线，将该已发布安装更新到打包后的 OpenClaw tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个 loopback Gateway 网关，并检查已配置意图、工作空间/会话文件、陈旧插件配置和旧版依赖状态、启动、`/healthz`、`/readyz` 以及 RPC 状态是否能够存续或干净修复。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展精确本地矩阵，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景 fixture；reported-issues 集合包含 `configured-plugin-installs`，用于验证已配置的外部 OpenClaw 插件会在升级期间自动安装，还包含 `stale-source-plugin-shadow`，用于防止仅源码插件影子破坏启动。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，并在把精确包规格交给 Docker 测试通道之前解析 `last-stable-4` 或 `all-since-2026.4.23` 等元基线 token。
- `pnpm test:docker:update-migration`：在清理量较大的 `plugin-deps-cleanup` 场景中运行已发布升级存续工具，默认从 `openclaw@2026.4.23` 开始。单独的 `Update Migration` 工作流会用 `baselines=all-since-2026.4.23` 扩展该测试通道，使从 `.23` 开始的每个稳定已发布包都更新到候选版本，并在 Full Release CI 之外证明已配置插件依赖清理。
- `pnpm test:docker:plugins`：对本地路径、`file:`、带提升依赖的 npm registry 包、git 移动引用、ClawHub fixture、marketplace 更新以及 Claude bundle 启用/检查运行安装/更新冒烟测试。

## 本地 PR 门禁

对于本地 PR 合入/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现不稳定失败，先重跑一次，再将其视为回归；然后用 `pnpm test <path/to/test>` 隔离问题。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示：“只回复一个单词：ok。不要使用标点或额外文本。”

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

输出包含每个命令的 `sampleCount`、平均值、p50、p95、最小值/最大值、退出码/信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获会使用同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新检入的基线 fixture：`test/fixtures/cli-startup-bench.json`

检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 用 `pnpm test:startup:bench:update` 刷新
- 用 `pnpm test:startup:bench:check` 将当前结果与 fixture 对比

## Gateway 网关启动基准测试

脚本：[`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

该基准测试默认使用 `dist/entry.js` 中已构建的 CLI 入口；在使用 package script 命令前先运行
`pnpm build`。若要改为测量源码
runner，请传入 `--entry scripts/run-node.mjs`，并将这些结果
与已构建入口的基线分开保存。

用法：

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

用例 ID：

- `default`：Gateway 网关正常启动。
- `skipChannels`：跳过 channel 启动的 Gateway 网关启动。
- `oneInternalHook`：一个已配置的内部 hook。
- `allInternalHooks`：所有内部 hook。
- `fiftyPlugins`：50 个 manifest 插件。
- `fiftyStartupLazyPlugins`：50 个 startup-lazy manifest 插件。

输出包含首个进程输出、`/healthz`、`/readyz`、HTTP 监听日志时间、
Gateway 网关 ready 日志时间、CPU 时间、CPU 核心比率、最大 RSS、堆、启动 trace
指标、事件循环延迟，以及插件查找表详细指标。该脚本会在子
Gateway 网关环境中启用 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

将 `/healthz` 理解为存活性：HTTP 服务器可以响应。将 `/readyz` 理解为
可用就绪性：启动插件 sidecar、channel 和 ready-critical
post-attach 工作已经稳定。Gateway 网关启动 hook 会异步派发，
不属于就绪保证的一部分。Ready 日志时间是
Gateway 网关的内部 ready 日志时间戳；它对进程侧归因有用，
但不能替代外部 `/readyz` 探针。

对比变更时使用 JSON 输出或 `--output`。仅当 trace 输出指向 import、compile 或仅凭阶段计时无法解释的 CPU 密集工作时，
才使用 `--cpu-prof-dir`。不要将源码 runner 结果与已构建的
`dist/entry.js` 结果作为同一基线进行比较。

## Gateway 网关重启基准测试

脚本：[`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

重启基准测试仅支持 macOS 和 Linux。它使用 SIGUSR1 执行
进程内重启，并会在 Windows 上立即失败。

该基准测试默认使用 `dist/entry.js` 中已构建的 CLI 入口；在使用 package script 命令前先运行
`pnpm build`。若要改为测量源码
runner，请传入 `--entry scripts/run-node.mjs`，并将这些结果
与已构建入口的基线分开保存。

用法：

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

用例 ID：

- `skipChannels`：跳过 channel 的重启。
- `skipChannelsAcpxProbe`：跳过 channel 且开启 ACPX 启动探针的重启。
- `skipChannelsNoAcpxProbe`：跳过 channel 且关闭 ACPX 启动探针的重启。
- `default`：正常重启。
- `fiftyPlugins`：带 50 个 manifest 插件的重启。

输出包含下一次 `/healthz`、下一次 `/readyz`、停机时间、重启 ready timing、
CPU、RSS、替换进程的启动 trace 指标，以及 signal 处理、active-work drain、关闭阶段、下一次启动、ready
timing 和内存快照的重启 trace
指标。该脚本会在子
Gateway 网关环境中启用
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` 和 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

当变更触及重启信号、关闭 handler、
重启后的启动、sidecar 关闭、服务交接，或重启后的就绪性时，使用此基准测试。在隔离 Gateway 网关机制与 channel
启动时，从 `skipChannels` 开始。只有在窄用例解释了
重启路径之后，才使用 `default` 或插件较重的用例。

Trace 指标是归因提示，不是结论。重启变更应根据
多个样本、匹配的 owner span、`/healthz` 和 `/readyz`
行为，以及用户可见的重启契约来判断。

## Onboarding E2E（Docker）

Docker 是可选的；只有容器化 onboarding smoke 测试才需要它。

干净 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 gateway 并运行 `openclaw health`。

## QR 导入 smoke（Docker）

确保维护的 QR 运行时 helper 能在受支持的 Docker Node 运行时下加载（Node 24 默认，Node 22 兼容）：

```bash
pnpm test:docker:qr
```

## 相关

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
