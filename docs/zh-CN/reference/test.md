---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-26T09:32:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，以避免服务器测试与正在运行的实例冲突。当之前的 Gateway 网关运行导致端口 `18789` 仍被占用时，使用此命令。
- `pnpm test:coverage`：通过 `vitest.unit.config.ts` 使用 V8 覆盖率运行单元测试套件。这是一个针对已加载文件的单元覆盖率检查，而不是整个仓库的全文件覆盖率。阈值为：行 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，该检查衡量的是被单元覆盖率套件加载到的文件，而不是把每个拆分测试 lane 中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅针对自 `origin/main` 以来发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，会将变更的 Git 路径扩展为带作用域的 Vitest lane。配置 / setup 变更仍会回退到原生根项目运行，因此接线类修改在需要时会触发更广泛的重跑。
- `pnpm test:changed:focused`：用于内部循环的变更测试运行。它只会根据直接修改的测试文件、同级 `*.test.ts` 文件、显式源文件映射以及本地导入图运行精确目标。广泛的 / 配置 / package 变更会被跳过，而不会扩展到完整的 changed-test 回退运行。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lane。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能变更检查。它会为核心代码运行核心测试 lane，为扩展代码运行扩展测试 lane，仅测试改动则只运行测试类型检查 / 测试，并将公开的 Plugin SDK 或插件契约变更扩展为一次扩展验证，同时把仅发布元数据的版本提升限制在定向的版本 / 配置 / 根依赖检查上。
- `pnpm test`：通过带作用域的 Vitest lane 路由显式文件 / 目录目标。未指定目标的运行会使用固定分片组，并扩展到叶子配置以进行本地并行执行；扩展组始终会扩展为每个扩展 / 插件的分片配置，而不是一个庞大的根项目进程。
- 完整、扩展以及 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地耗时数据；后续的整配置运行会利用这些耗时来平衡慢分片和快分片。include-pattern CI 分片会将分片名称附加到耗时键名，这样就能在不覆盖整配置耗时数据的情况下保留过滤后分片的耗时信息。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地耗时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会路由到专用的轻量 lane，只保留 `test/setup.ts`，而运行时较重的用例仍保留在现有 lane 中。
- 具有同级测试的源文件会优先映射到该同级测试，然后才回退到更宽泛的目录 glob。`test/helpers/channels` 和 `test/helpers/plugins` 下的辅助文件编辑会使用本地导入图来运行导入它们的测试，而不是在依赖路径明确时广泛运行每个分片。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻量的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行全部扩展 / 插件分片。较重的渠道插件、browser 插件以及 OpenAI 会作为专用分片运行；其他插件组仍保持批量运行。对单个内置插件 lane，使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入拆解报告，同时仍对显式文件 / 目录目标使用带作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：相同的导入分析，但仅针对自 `origin/main` 以来发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：对同一已提交 Git diff 的 changed-mode 路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，直接对当前工作树的变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest 叶子配置，并写入分组耗时数据以及每个配置对应的 JSON / 日志产物。Test Performance Agent 会将其作为尝试修复慢测试之前的基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在以性能为重点的变更之后比较分组报告。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS / HTTP / 节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 workers；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax / zai）。需要 API keys，并设置 `LIVE=1`（或特定提供商的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：一次性构建共享的 live-test 镜像和 Docker E2E 镜像，然后通过加权调度器在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行 Docker 冒烟测试 lane。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 控制进程槽位，默认值为 10；`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` 控制对提供商敏感的尾部池，默认值也为 10。重型 lane 上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；提供商上限默认是每个提供商一个重型 lane，对应 `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` 和 `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`。对于配置更高的主机，可使用 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。为避免本地 Docker 守护进程在创建容器时出现风暴，lane 启动默认会错开 2 秒；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` 覆盖。该运行器默认会预检 Docker、清理过期的 OpenClaw E2E 容器、每 30 秒输出活动 lane 状态、在兼容 lane 之间共享提供商 CLI 工具缓存、默认对瞬时 live-provider 失败重试一次（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`），并将 lane 耗时存储在 `.artifacts/docker-tests/lane-timings.json` 中，以便后续运行按最长优先排序。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可仅打印 lane 清单而不运行 Docker，使用 `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` 可调整状态输出频率，使用 `OPENCLAW_DOCKER_ALL_TIMINGS=0` 可禁用耗时复用。使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` 可只运行确定性的 / 本地 lane，使用 `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` 可只运行 live-provider lane；package 别名分别为 `pnpm test:docker:local:all` 和 `pnpm test:docker:live:all`。仅 live 模式会将主 live lane 和尾部 live lane 合并为一个按最长优先排序的池，从而让提供商桶可以将 Claude、Codex 和 Gemini 工作打包在一起。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化 lane；每个 lane 都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live / tail lane 使用更严格的单 lane 上限。CLI 后端 Docker 设置命令有独立超时，通过 `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` 控制（默认 180）。每个 lane 的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:browser-cdp-snapshot`：构建一个基于 Chromium 的 source E2E 容器，启动原始 CDP 和一个隔离的 Gateway 网关，运行 `browser doctor --deep`，并验证 CDP 角色快照包含链接 URL、由光标提升的可点击元素、iframe 引用以及 frame 元数据。
- CLI 后端 live Docker 探测可以作为聚焦 lane 运行，例如 `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume` 或 `pnpm test:docker:live-cli-backend:codex:mcp`。Claude 和 Gemini 也有对应的 `:resume` 和 `:mcp` 别名。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不期望像常规单元 / e2e 测试套件那样具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后通过真实的 stdio bridge 验证路由后的会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映的是 bridge 实际发出的内容。

## 本地 PR 检查门

对于本地 PR 合入 / 检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上出现偶发失败，在将其视为回归之前先重跑一次，然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 keys）

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
- `all`：以上两个预设

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小 / 最大值、exit-code / signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 捕获使用的是同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture，路径为 `test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在需要容器化的新手引导冒烟测试时才需要它。

在干净的 Linux 容器中运行完整的冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## 二维码导入冒烟测试（Docker）

确保维护中的二维码运行时辅助程序能够在受支持的 Docker Node 运行时中加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
