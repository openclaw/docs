---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（`vitest`），以及何时使用 `force`/`coverage` 模式
title: 测试
x-i18n:
    generated_at: "2026-04-23T19:45:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 078ba2d49ffc117b5069304113ab4b08d734ced76f8e0ac491e79375d6f3fde4
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，以避免服务端测试与正在运行的实例发生冲突。当之前的 Gateway 网关运行遗留并占用了端口 `18789` 时，请使用此命令。
- `pnpm test:coverage`：通过 `vitest.unit.config.ts` 运行带 V8 覆盖率的单元测试套件。这是一个基于已加载文件的单元覆盖率门禁，不是整个仓库所有文件的覆盖率。阈值为：行数/函数/语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁只衡量单元覆盖率测试套件中已加载的文件，而不会将拆分测试分组中的所有源码文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对相对于 `origin/main` 有变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源码/测试文件时，将变更的 git 路径展开为有作用域的 Vitest 分组。配置或 setup 变更仍会回退到原生根项目运行，以便在需要时对 wiring 改动进行更广泛的重跑。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构分组。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能变更门禁。它会将 core 变更与 core 测试分组一起运行，将扩展变更与扩展测试分组一起运行，将仅测试变更限制为测试 typecheck/测试，针对公共插件 SDK 或 plugin-contract 的变更扩展到扩展验证，并让仅含发布元数据的版本变更保持在定向的版本/配置/根依赖检查中。
- `pnpm test`：通过有作用域的 Vitest 分组来路由显式的文件/目录目标。未指定目标的运行会使用固定的分片组，并展开为叶子配置以进行本地并行执行；扩展组始终会展开到每个扩展/插件的分片配置，而不是单个巨大的根项目进程。
- 完整测试和扩展分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续运行会使用这些计时数据来平衡较慢和较快的分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量分组进行路由，这些分组仅保留 `test/setup.ts`，而将运行时较重的用例留在它们原有的分组中。
- 部分 `plugin-sdk` 和 `commands` 辅助源码文件也会将 `pnpm test:changed` 映射到这些轻量分组中的显式同级测试，因此小型辅助函数改动无需重跑依赖重型运行时的测试套件。
- `auto-reply` 现在也被拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导更轻量的顶层状态/token/helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离运行器。
- `pnpm test:channels`：运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions`：运行所有扩展/插件分片。较重的渠道扩展和 OpenAI 会作为专用分片运行；其他扩展组保持批量执行。对单个内置插件分组使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入明细报告，同时仍对显式文件/目录目标使用有作用域的分组路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入性能分析，但仅针对相对于 `origin/main` 有变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：对同一份已提交 git diff 的变更模式路由路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，直接对当前工作树的变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + heap profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行完整测试套件中的每个 Vitest 叶子配置，并写入分组时长数据以及每个配置的 JSON/日志产物。测试性能智能体会在尝试修复慢测试之前，将它作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：比较性能优化改动前后的分组报告。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/node 配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 获取详细日志。
- `pnpm test:live`：运行 provider 实时测试（minimax/zai）。需要 API key，并且需要 `LIVE=1`（或 provider 专属的 `*_LIVE_TEST=1`）才能取消 skip。
- `pnpm test:docker:all`：先构建共享的实时测试镜像和 Docker E2E 镜像一次，然后默认以并发数 4 使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟分组。可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整。除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则运行器会在首次失败后停止调度新的池化分组；每个分组默认有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的分组会在并行池之后以独占方式运行。每个分组的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元/e2e 测试套件那样要求具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个预置数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio bridge 传输的 Claude 风格渠道和权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试能反映 bridge 实际发出的内容。

## 本地 PR 门禁

对于本地 PR 合入/门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，在将其视为回归之前先重跑一次，然后使用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，可使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“Reply with a single word: ok. No punctuation or extra text.”

上次运行（2025-12-31，20 次）：

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：同时包含两个预设

输出会包含每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出码/信号分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，这样计时与 profile 捕获会使用同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture：`test/fixtures/cli-startup-bench.json`

已检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在需要容器化新手引导冒烟测试时才需要它。

在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## 二维码导入冒烟测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时中加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
