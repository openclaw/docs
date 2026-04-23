---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-23T13:33:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2897f6a58720b43c749dc7ea410369a529bb8f72c50f8d9e55f114bf39ccb1a9
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试工具包（测试套件、实时、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，这样服务器测试就不会与正在运行的实例冲突。当先前的 Gateway 网关运行导致端口 `18789` 仍被占用时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。这是一个针对已加载文件的单元覆盖率门禁，而不是整个仓库所有文件的覆盖率。阈值为：行数 / 函数 / 语句 70%，分支 55%。由于 `coverage.all` 为 false，该门禁会统计被单元覆盖率套件加载的文件，而不是将每个拆分测试通道中的源文件都视为未覆盖。
- `pnpm test:coverage:changed`：仅针对自 `origin/main` 以来发生变更的文件运行单元覆盖率。
- `pnpm test:changed`：当差异只涉及可路由的源文件 / 测试文件时，会将变更过的 git 路径展开为有范围限制的 Vitest 通道。配置 / 设置变更仍会回退到原生根项目运行方式，因此在需要时，接线层修改会触发更广泛的重跑。
- `pnpm changed:lanes`：显示相对于 `origin/main` 的差异所触发的架构通道。
- `pnpm check:changed`：针对相对于 `origin/main` 的差异运行智能变更门禁。它会将核心改动与核心测试通道一起运行，将扩展改动与扩展测试通道一起运行，将仅测试改动限制为测试类型检查 / 测试本身，将公开的插件 SDK 或插件契约变更扩展为扩展验证，并将仅发布元数据的版本号变更限制在有针对性的版本 / 配置 / 根依赖检查上。
- `pnpm test`：通过有范围限制的 Vitest 通道来路由显式指定的文件 / 目录目标。未指定目标的运行会使用固定的分片组，并展开到叶子配置，以便在本地并行执行；扩展组始终会展开为按扩展划分的分片配置，而不是单个巨大的根项目进程。
- 完整测试和扩展分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续运行会使用这些计时信息来平衡慢分片和快分片。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会通过专用轻量通道进行路由，这些通道只保留 `test/setup.ts`，而运行时负载较重的用例仍保留在原有通道中。
- 部分 `plugin-sdk` 和 `commands` 辅助源文件也会将 `pnpm test:changed` 映射到这些轻量通道中的显式同级测试，因此对小型辅助文件的修改可以避免重跑依赖重型运行时的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），因此 reply 测试框架不会拖慢较轻量的顶层状态 / token / helper 测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用了共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 和 `pnpm test extensions` 会运行所有扩展 / 插件分片。重量级渠道扩展和 OpenAI 会作为专用分片运行；其他扩展组则保持批量运行。对单个内置插件通道，请使用 `pnpm test extensions/<id>`。
- `pnpm test:perf:imports`：启用 Vitest 的导入耗时 + 导入明细报告，同时仍对显式指定的文件 / 目录目标使用有范围限制的通道路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入分析，但仅针对自 `origin/main` 以来发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：对已路由的 changed 模式路径与原生根项目运行进行基准比较，两者使用相同的已提交 git 差异。
- `pnpm test:perf:changed:bench -- --worktree`：对当前工作区的变更集进行基准比较，无需先提交。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择性启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/node 配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 与自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API key，并且需要设置 `LIVE=1`（或提供商专用的 `*_LIVE_TEST=1`）来取消跳过。
- `pnpm test:docker:all`：先各构建一次共享的实时测试镜像和 Docker E2E 镜像，然后默认以并发数 4 运行 Docker 冒烟测试通道，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`。可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` 调整。对启动流程或提供商更敏感的通道会在并行池之后独占运行。每个通道的日志会写入 `.artifacts/docker-tests/<run-id>/`。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型 key（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，并且不像常规单元 / e2e 测试套件那样预期具有 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个已注入种子数据的 Gateway 网关容器，以及第二个会生成 `openclaw mcp serve` 的客户端容器，然后通过真实的 stdio bridge 验证路由会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试反映的是 bridge 实际发出的内容。

## 本地 PR 门禁

在本地执行 PR 合并 / 门禁检查时，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上偶发失败，请先重跑一次，再将其视为回归；然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地 keys）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示词：“用一个单词回复：ok。不要使用标点或额外文本。”

最近一次运行（2025-12-31，20 次）：

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

输出内容包括每个命令的 `sampleCount`、平均值、p50、p95、最小值 / 最大值、exit-code/signal 分布，以及最大 RSS 汇总。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，因此计时和 profile 采集使用的是同一个测试框架。

保存输出约定：

- `pnpm test:startup:bench:smoke` 会将有针对性的冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线 fixture：`test/fixtures/cli-startup-bench.json`

已检入的 fixture：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该 fixture 进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在需要容器化新手引导冒烟测试时才需要它。

在干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过 pseudo-tty 驱动交互式向导，验证 config/workspace/session 文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
