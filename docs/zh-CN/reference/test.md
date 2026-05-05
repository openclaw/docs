---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-05-05T20:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4a87abe86ab28f14b1ea96846ee221eb504fb1bc9e6c17b4b2f348867cde855d
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（套件、实时、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

- `pnpm test:force`：终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 套件，使服务器测试不会与正在运行的实例冲突。当之前的 Gateway 网关运行遗留占用了端口 18789 时使用它。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元套件（通过 `vitest.unit.config.ts`）。这是默认单元车道的覆盖率门禁，不是整个仓库的全文件覆盖率。阈值为行数/函数/语句 70%，分支 55%。因为 `coverage.all` 为 false，且默认车道将覆盖率 include 范围限定为带有同级源文件的非快速单元测试，所以该门禁衡量此车道拥有的源代码，而不是它恰好加载的每个传递导入。
- `pnpm test:coverage:changed`：只对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：廉价的智能变更测试运行。它会从直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图运行精确目标。宽泛/配置/package 变更会被跳过，除非它们映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式的宽泛变更测试运行。当测试 harness/配置/package 编辑应回退到 Vitest 更宽泛的变更测试行为时使用它。
- `pnpm changed:lanes`：显示与 `origin/main` 的差异触发的架构车道。
- `pnpm check:changed`：针对与 `origin/main` 的差异运行智能变更检查门禁。它会为受影响的架构车道运行 typecheck、lint 和 guard 命令，但不会运行 Vitest 测试。使用 `pnpm test:changed` 或显式 `pnpm test <target>` 作为测试证明。
- `pnpm test`：通过有范围的 Vitest 车道路由显式文件/目录目标。无目标运行会使用固定分片组，并展开为叶子配置以进行本地并行执行；插件组始终展开为按插件划分的分片配置，而不是一个巨大的根项目进程。
- 测试包装器运行结束时会带有简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自己的耗时行仍保留为每个分片的细节。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置 fixture、工作区、智能体目录或 auth-profile 存储时，在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 进程 E2E helper：当 Vitest 进程级 E2E 测试需要在一处管理运行中的 Gateway 网关、CLI env、日志捕获和清理时，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E helper：source `scripts/lib/docker-e2e-image.sh` 的车道可以将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；多 home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。更底层的调用方可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 获取容器内 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 获取可 source 的主机 env 文件。`create` 前的 `--` 会防止较新的 Node 运行时将 `--env-file` 当作 Node 标志处理。启动 Gateway 网关的 Docker/Bash 车道可以在容器内 source `scripts/lib/openclaw-e2e-instance.sh`，用于入口点解析、模拟 OpenAI 启动、Gateway 网关前台/后台启动、就绪探针、状态 env 导出、日志转储和进程清理。
- 完整、插件和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；之后的全配置运行会使用这些计时来平衡慢分片和快分片。Include-pattern CI 分片会将分片名称追加到计时键中，这会让过滤后的分片计时保持可见，同时不替换全配置计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时 artifact。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会通过专用轻量车道路由，这些车道只保留 `test/setup.ts`，并让运行时较重的用例留在它们现有的车道上。
- 带有同级测试的源文件会先映射到该同级测试，然后再回退到更宽的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 编辑会使用本地导入图运行导入它们的测试，而不是在依赖路径精确时宽泛运行每个分片。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），使 reply harness 不会主导较轻的顶层 Status/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有插件分片。重型渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组保持批处理。使用 `pnpm test extensions/<id>` 运行一个内置插件车道。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入拆分报告，同时仍对显式文件/目录目标使用有范围的车道路由。
- `pnpm test:perf:imports:changed`：相同的导入分析，但只针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一已提交 git diff，对路由后的 changed-mode 路径与原生根项目运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree`：在不先提交的情况下，对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元运行器写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个 full-suite Vitest 叶子配置，并写入分组耗时数据以及每个配置的 JSON/log artifact。Test Performance Agent 会在尝试修复慢测试之前将其用作 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在性能相关变更后比较分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS/HTTP/node 配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 worker；用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API key 和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，构建/复用一个裸 Node/Git runner 镜像，以及一个将该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker smoke 车道。裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于 installer/update/plugin-dependency 车道；这些车道会挂载预构建 tarball，而不是使用复制的仓库源代码。功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于正常的已构建应用功能车道。`scripts/package-openclaw-for-docker.mjs` 是唯一的本地/CI package packer，并会在 Docker 使用 tarball 之前验证它以及 `dist/postinstall-inventory.json`。Docker 车道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定计划。`node scripts/test-docker-all.mjs --plan-json` 会为选定车道、镜像类型、package/live-image 需求、状态场景和凭证检查输出由调度器拥有的 CI 计划，而不构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，默认值为 10。重型车道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 为每个提供商设置一个重型车道。更大的主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果某个车道在低并行主机上超过有效权重或资源上限，它仍可从空池启动，并会单独运行直到释放容量。车道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认会预检 Docker、清理过期的 OpenClaw E2E 容器、每 30 秒发出 active-lane Status、在兼容车道间共享提供商 CLI 工具缓存、默认重试一次瞬时 live-provider 失败（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将车道计时存储在 `.artifacts/docker-tests/lane-timings.json` 中，以便后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印车道清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整 Status 输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用计时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 只运行确定性/本地车道，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 只运行 live-provider 车道；package 别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only 模式会将 main 和 tail live 车道合并到一个最长优先池中，使提供商 bucket 可以把 Claude、Codex 和 Gemini 工作打包在一起。除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在第一次失败后停止调度新的池化车道，并且每个车道都有 120 分钟的 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 车道使用更严格的单车道上限。CLI backend Docker 设置命令有自己的超时，由 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每车道日志、`summary.json`、`failures.json` 和阶段计时会写入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 检查慢车道，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印廉价的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个基于 Chromium 的源 E2E 容器，启动原始 CDP 和一个隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、光标提升的可点击项、iframe 引用和 frame 元数据。
- CLI backend live Docker probe 可以作为聚焦车道运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不预期像普通 unit/e2e 套件一样保持 CI 稳定。
- `pnpm test:docker:mcp-channels`：启动一个预置数据的 Gateway 网关容器和第二个客户端容器，后者会生成 `openclaw mcp serve`，然后验证路由后的对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio 桥接发送的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映桥接实际发出的内容。
- `pnpm test:docker:upgrade-survivor`：将打包的 OpenClaw tarball 安装到一个脏的旧用户夹具上，在没有实时提供商或渠道密钥的情况下运行包更新和非交互式 Doctor，然后启动 local loopback Gateway 网关，并检查智能体、渠道配置、插件允许列表、工作区/会话文件、陈旧的旧版插件依赖状态、启动和 RPC Status 是否保留下来。
- `pnpm test:docker:published-upgrade-survivor`：默认安装 `openclaw@latest`，在没有实时提供商或渠道密钥的情况下预置真实的现有用户文件，使用内置的 `openclaw config set` 命令配方配置该基线，将这个已发布安装更新为打包的 OpenClaw tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动 local loopback Gateway 网关，并检查已配置的意图、工作区/会话文件、陈旧的插件配置和旧版依赖状态、启动、`/healthz`、`/readyz` 以及 RPC Status 是否保留下来或被干净修复。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 展开精确的本地矩阵，例如 `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景夹具；reported-issues 集合包含 `configured-plugin-installs`，用于验证已配置的外部 OpenClaw 插件会在升级期间自动安装，还包含 `stale-source-plugin-shadow`，用于防止仅源代码的插件阴影破坏启动。Package Acceptance 将这些暴露为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`，并在将精确包规格交给 Docker 通道之前解析元基线令牌，例如 `last-stable-4` 或 `all-since-2026.4.23`。
- `pnpm test:docker:update-migration`：在清理密集的 `plugin-deps-cleanup` 场景中运行已发布升级存活性测试工具，默认从 `openclaw@2026.4.23` 开始。单独的 `Update Migration` workflow 使用 `baselines=all-since-2026.4.23` 展开此通道，因此从 `.23` 起的每个稳定已发布包都会更新到候选版本，并在 Full Release CI 之外证明已配置插件的依赖清理。
- `pnpm test:docker:plugins`：针对本地路径、`file:`、带提升依赖的 npm registry 包、git 移动引用、ClawHub 夹具、marketplace 更新，以及 Claude bundle 启用/检查运行安装/更新冒烟测试。

## 本地 PR 门禁

对于本地 PR 合并/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，在将其视为回归问题之前先重跑一次，然后用 `pnpm test <path/to/test>` 隔离定位。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示：“用一个单词回复：ok。不要标点或额外文本。”

上次运行（2025-12-31，20 次运行）：

- minimax 中位数 1279ms（最小值 1114，最大值 2431）
- opus 中位数 2454ms（最小值 1224，最大值 3170）

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

输出包含每个命令的 `sampleCount`、avg、p50、p95、min/max、退出码/信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 配置文件，使计时和配置文件捕获使用同一套 harness。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 将目标 smoke 构件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 使用 `runs=5` 和 `warmup=1` 将完整套件构件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture：`test/fixtures/cli-startup-bench.json`

已检入 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与 fixture 比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有容器化新手引导 smoke 测试才需要它。

在干净 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入 smoke（Docker）

确保维护中的 QR 运行时辅助工具可以在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
