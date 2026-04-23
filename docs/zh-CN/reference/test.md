---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-23T23:21:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1224c2c0fc4b96a6631ba238e4e9b13ed61e918282db393df7a9db93b3fbf8cf
    source_path: reference/test.md
    workflow: 15
---

- 完整测试工具包（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍在占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例发生冲突。当之前的 Gateway 网关运行导致端口 `18789` 仍被占用时，请使用它。
- `pnpm test:coverage`：通过 `vitest.unit.config.ts` 使用 V8 覆盖率运行单元测试套件。这是一个针对已加载文件的单元覆盖率门禁，而不是整个仓库所有文件的覆盖率。阈值为：行数 / 函数 / 语句 `70%`，分支 `55%`。由于 `coverage.all` 为 false，这个门禁会统计被单元覆盖率套件加载的文件，而不是把每个分拆测试 lane 中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源文件 / 测试文件时，会将 git 变更路径展开为有作用域的 Vitest 测试 lane。配置 / setup 变更仍会回退到原生 root projects 运行方式，以便在需要时对 wiring 变更执行更广泛的重跑。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的 diff 所触发的架构 lane。
- `pnpm check:changed`：对相对于 `origin/main` 的 diff 运行智能变更门禁。它会将 core 相关工作与 core 测试 lane 一起运行，将 extension 相关工作与 extension 测试 lane 一起运行，将仅测试相关工作限制为测试类型检查 / 测试本身，对公开 Plugin SDK 或 plugin-contract 的变更扩展为一次 extension 验证，并将仅涉及发布元数据的版本变更限制在定向的版本 / 配置 / 根依赖检查中。
- `pnpm test`：通过有作用域的 Vitest 测试 lane 路由显式的文件 / 目录目标。未指定目标的运行会使用固定分片组，并展开为 leaf config，以便在本地并行执行；extension 组始终会展开为按 extension 划分的分片配置，而不是一个巨大的 root-project 进程。
- 完整测试和 extension 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续运行会使用这些计时来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。
- 选定的 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量 lane 路由，这些 lane 只保留 `test/setup.ts`，而运行时负载较重的用例仍保留在现有 lane 中。
- 选定的 `plugin-sdk` 和 `commands` 辅助源文件也会把 `pnpm test:changed` 映射到这些轻量 lane 中的显式同级测试，因此对小型辅助文件的修改无需重新运行重量级、依赖运行时的测试套件。
- `auto-reply` 现在也被拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 就不会主导较轻量的 top-level 状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 会运行所有 extension / plugin 分片。重量级渠道 plugin、browser plugin 和 OpenAI 会作为专用分片运行；其他 plugin 组则保持批量处理。对单个内置 plugin lane，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 的导入耗时 + 导入明细报告，同时仍会对显式文件 / 目录目标使用有作用域的 lane 路由。
- `pnpm test:perf:imports:changed`：同样进行导入分析，但仅针对自 `origin/main` 以来发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一份已提交的 git diff，对路由后的 changed 模式路径与原生 root-project 运行进行基准比较。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，直接对当前 worktree 的变更集进行基准比较。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写出 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试 runner 写出 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整测试套件的 Vitest leaf config，并写出分组耗时数据以及每个配置对应的 JSON / 日志产物。Test Performance Agent 会在尝试修复慢测试之前，将其作为基线。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`：在面向性能的变更之后，对分组报告进行比较。
- Gateway 集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择性启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS / HTTP / 节点配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行 provider 的 live 测试（minimax / zai）。需要 API key，并设置 `LIVE=1`（或 provider 专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:all`：先构建共享的 live-test 镜像和 Docker E2E 镜像一次，然后以默认并发数 4、并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 Docker 冒烟 lane。可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整。除非设置 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`，否则 runner 会在第一次失败后停止调度新的池化 lane；每个 lane 默认有 120 分钟超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动过程敏感或 provider 敏感的 lane 会在并行池之后独占运行。每个 lane 的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live model key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并不像常规单元 / e2e 测试套件那样被视为 CI 稳定测试。
- `pnpm test:docker:mcp-channels`：启动一个已植入数据的 Gateway 网关容器，以及第二个会启动 `openclaw mcp serve` 的客户端容器，然后验证经路由的会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio bridge 发送的 Claude 风格渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP frame，因此这个冒烟测试反映的是 bridge 实际发出的内容。

## 本地 PR 门禁

在本地执行 PR 合入 / 门禁检查时，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，请先重跑一次，再决定是否将其视为回归；之后可用 `pnpm test <path/to/test>` 进行隔离。在内存受限的主机上，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地 key）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“用一个单词回复：ok。不要标点或额外文本。”

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：同时包含两个预设

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小值 / 最大值、exit-code / signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写出 V8 profile，因此计时和 profile 采集使用的是同一套 harness。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将定向冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已提交的基线 fixture：`test/fixtures/cli-startup-bench.json`

已提交的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在运行容器化新手引导冒烟测试时才需要它。

在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证 config / workspace / session 文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护中的 QR 运行时辅助程序能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
