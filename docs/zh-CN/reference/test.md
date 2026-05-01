---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-05-01T23:38:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2bf9cf1024d78747d97b5f4fb41ae42fe6cba547db023b78f3d0dcd4ba5128d
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（套件、实时测试、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

- `pnpm test:force`：终止任何仍占用默认控制端口的 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整 Vitest 套件，避免服务器测试与正在运行的实例冲突。当先前的 Gateway 网关运行留下端口 18789 被占用时使用此命令。
- `pnpm test:coverage`：使用 V8 coverage 运行单元套件（通过 `vitest.unit.config.ts`）。这是已加载文件的单元覆盖率门禁，不是整个仓库的全文件覆盖率。阈值为行/函数/语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁衡量的是单元覆盖率套件加载的文件，而不是把每个拆分 lane 的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来更改的文件运行单元覆盖率。
- `pnpm test:changed`：低成本的智能变更测试运行。它会从直接测试编辑、相邻 `*.test.ts` 文件、显式源映射以及本地导入图运行精确目标。广泛的配置/包变更会被跳过，除非它们映射到精确测试。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`：显式的广泛变更测试运行。当测试 harness/配置/包编辑应回退到 Vitest 更广泛的变更测试行为时使用。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 触发的架构 lane。
- `pnpm check:changed`：针对相对于 `origin/main` 的 diff 运行智能变更检查门禁。它会为受影响的架构 lane 运行 typecheck、lint 和 guard 命令，但不会运行 Vitest 测试。使用 `pnpm test:changed` 或显式 `pnpm test <target>` 获取测试证明。
- `pnpm test`：将显式文件/目录目标路由到有作用域的 Vitest lane。无目标运行会使用固定分片组，并展开为 leaf config 以便本地并行执行；extension 组始终展开为按扩展分片的配置，而不是一个巨大的根项目进程。
- 测试 wrapper 运行结束时会有简短的 `[test] passed|failed|skipped ... in ...` 摘要。Vitest 自身的耗时行仍然保留为每个分片的细节。
- 共享 OpenClaw 测试状态：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置 fixture、工作区、智能体目录或 auth-profile 存储时，在 Vitest 中使用 `src/test-utils/openclaw-test-state.ts`。
- 进程 E2E helpers：当 Vitest 进程级 E2E 测试需要在一个地方获得正在运行的 Gateway 网关、CLI 环境、日志捕获和清理时，使用 `test/helpers/openclaw-test-instance.ts`。
- Docker/Bash E2E helpers：source `scripts/lib/docker-e2e-image.sh` 的 lane 可以将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；多 home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个 flow 中调用 `openclaw_test_state_create <label> <scenario>`。更底层的调用方可以使用 `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` 获取容器内 shell 片段，或使用 `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 获取可 source 的主机环境文件。`create` 前的 `--` 会避免较新的 Node 运行时把 `--env-file` 当作 Node flag。启动 Gateway 网关的 Docker/Bash lane 可以在容器内 source `scripts/lib/openclaw-e2e-instance.sh`，用于 entrypoint 解析、mock OpenAI 启动、Gateway 网关前台/后台启动、就绪探针、状态环境导出、日志 dump 和进程清理。
- 完整、extension 和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地 timing 数据；后续 whole-config 运行会使用这些 timing 来平衡慢分片和快分片。include-pattern CI 分片会把分片名称追加到 timing key，这会让过滤后的分片 timing 可见，而不替换 whole-config timing 数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地 timing artifact。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用轻量 lane，这些 lane 仅保留 `test/setup.ts`，让运行时较重的用例留在现有 lane 上。
- 带有相邻测试的源文件会先映射到该相邻测试，然后才回退到更宽的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的 helper 编辑会使用本地导入图运行导入它们的测试，而不是在依赖路径精确时广泛运行每个分片。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply harness 不会主导较轻量的顶层 status/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重型渠道插件、浏览器插件和 OpenAI 会作为专用分片运行；其他插件组保持批处理。使用 `pnpm test extensions/<id>` 运行一个内置插件 lane。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入细分报告，同时仍对显式文件/目录目标使用有作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：同样的导入 profiling，但仅针对自 `origin/main` 以来更改的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一个已提交 git diff，对 routed changed-mode 路径与原生 root-project 运行进行基准测试。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前 worktree 变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元 runner 写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个 full-suite Vitest leaf config，并写入分组耗时数据以及每个 config 的 JSON/log artifact。Test Performance Agent 会在尝试修复慢测试前使用它作为 baseline。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在性能相关变更后比较分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/node 配对）。默认使用 `threads` + `isolate: false`，并在 `vitest.e2e.config.ts` 中使用自适应 workers；可用 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行提供商 live tests（minimax/zai）。需要 API keys 和 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：构建共享 live-test image，将 OpenClaw 打包一次为 npm tarball，构建/复用一个裸 Node/Git runner image 以及一个把该 tarball 安装到 `/app` 的功能 image，然后通过加权 scheduler 使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟 lane。裸 image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）用于 installer/update/plugin-dependency lane；这些 lane 挂载预构建 tarball，而不是使用复制的 repo 源。功能 image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）用于常规 built-app 功能 lane。`scripts/package-openclaw-for-docker.mjs` 是唯一的本地/CI package packer，并会在 Docker 使用前验证 tarball 以及 `dist/postinstall-inventory.json`。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定 plan。`node scripts/test-docker-all.mjs --plan-json` 会输出由 scheduler 拥有的 CI plan，其中包含选定 lane、image kinds、package/live-image 需求、状态 scenarios 和凭证检查，且不会构建或运行 Docker。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程 slot，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制 provider-sensitive tail pool，默认值为 10。重型 lane cap 默认值为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商 cap 默认通过 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` 为每个提供商设置一个重型 lane。更大的主机可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。如果在低并行度主机上某个 lane 超过有效 weight 或资源 cap，它仍可从空池启动，并会独占运行直到释放容量。默认情况下 lane 启动会错开 2 秒，以避免本地 Docker daemon create storm；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。runner 默认预检 Docker，清理陈旧 OpenClaw E2E 容器，每 30 秒输出 active-lane status，在兼容 lane 之间共享提供商 CLI 工具缓存，默认对临时 live-provider 失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将 lane timing 存储到 `.artifacts/docker-tests/lane-timings.json`，用于后续运行的 longest-first 排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印 lane manifest 而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整 status 输出，或使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 禁用 timing 复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 仅运行确定性/本地 lane，或使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 仅运行 live-provider lane；package 别名为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。Live-only mode 会把 main 和 tail live lane 合并为一个 longest-first pool，使提供商 bucket 能一起装入 Claude、Codex 和 Gemini 工作。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，runner 会在首次失败后停止调度新的 pooled lane；每个 lane 都有 120 分钟 fallback timeout，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lane 使用更严格的 per-lane cap。CLI backend Docker 设置命令有自己的 timeout，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个 lane 的日志、`summary.json`、`failures.json` 和 phase timing 会写入 `.artifacts/docker-tests/<run-id>/` 下；使用 `pnpm test:docker:timings <summary.json>` 检查慢 lane，并使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本的定向重跑命令。
- `pnpm test:docker:browser-cdp-snapshot`：构建基于 Chromium 的 source E2E 容器，启动 raw CDP 和隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP role snapshot 包含链接 URL、cursor-promoted clickables、iframe refs 和 frame metadata。
- CLI backend live Docker probe 可以作为聚焦 lane 运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 有对应的 `:resume` 与 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Dockerized OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行真实代理 chat。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI image，并且不预期像常规 unit/e2e 套件那样 CI 稳定。
- `pnpm test:docker:mcp-channels`：启动一个已 seeded 的 Gateway 网关容器和第二个 client 容器，后者会 spawn `openclaw mcp serve`，然后验证 routed conversation discovery、transcript reads、attachment metadata、live event queue behavior、outbound send routing，以及通过真实 stdio bridge 发送的 Claude-style channel + permission notifications。Claude notification assertion 会直接读取 raw stdio MCP frames，因此该冒烟测试反映 bridge 实际发出的内容。
- `pnpm test:docker:upgrade-survivor`：在脏的旧用户测试固件上安装打包后的 OpenClaw tar 包，在没有实时提供商或渠道密钥的情况下运行包更新和非交互式 Doctor，然后启动一个回环 Gateway 网关，并检查智能体、渠道配置、插件允许列表、工作区/会话文件、过期的旧版插件依赖状态、启动流程和 RPC Status 是否保留。
- `pnpm test:docker:published-upgrade-survivor`：默认安装 `openclaw@latest`，在没有实时提供商或渠道密钥的情况下填充真实的现有用户文件，使用内置的 `openclaw config set` 命令配方配置该基线，将该已发布安装更新到打包后的 OpenClaw tar 包，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，然后启动一个回环 Gateway 网关，并检查已配置的意图、工作区/会话文件、过期插件配置和旧版依赖状态、启动流程、`/healthz`、`/readyz` 以及 RPC Status 是否保留或干净修复。使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖一个基线，使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展精确矩阵，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景测试固件；包验收将这些公开为 `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines` 和 `published_upgrade_survivor_scenarios`。
- `pnpm test:docker:update-migration`：在清理负载较重的 `plugin-deps-cleanup` 场景中运行已发布升级保留测试框架，默认从 `openclaw@2026.4.23` 开始。单独的“更新迁移”工作流使用 `baselines=all-since-2026.4.23` 扩展此通道，因此从 `.23` 起的每个稳定已发布包都会更新到候选版本，并在完整发布 CI 之外证明已配置插件的依赖清理。

## 本地 PR 门禁

对于本地 PR 落地/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上偶发失败，在将其视为回归之前先重跑一次，然后用 `pnpm test <path/to/test>` 隔离问题。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“只回复一个单词：ok。不要标点或额外文本。”

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

输出包含每条命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出码/信号分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 配置文件，因此计时和配置文件捕获使用同一个 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 将目标冒烟工件写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 使用 `runs=5` 和 `warmup=1` 将完整套件工件写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 使用 `runs=5` 和 `warmup=1` 刷新已签入的基线 fixture，位置为 `test/fixtures/cli-startup-bench.json`

已签入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与 fixture 比较

## 新手引导 E2E（Docker）

Docker 是可选的；仅容器化新手引导冒烟测试需要它。

在干净的 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护中的 QR 运行时助手能在受支持的 Docker Node 运行时下加载（Node 24 默认，Node 22 兼容）：

```bash
pnpm test:docker:qr
```

## 相关

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
