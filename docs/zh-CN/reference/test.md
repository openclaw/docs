---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-05T10:09:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 78390107a9ac2bdc4294d4d0204467c5efdd98faebaf308f3a4597ab966a6d26
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试套件（测试集、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：终止所有仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，避免服务端测试与正在运行的实例冲突。当先前的 Gateway 网关运行导致端口 `18789` 仍被占用时，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试集（通过 `vitest.unit.config.ts`）。全局阈值为 70% 的行数/分支/函数/语句覆盖率。覆盖率会排除集成较重的入口点（CLI 接线、gateway/telegram 桥接、webchat 静态服务器），以便将目标聚焦于适合单元测试的逻辑。
- `pnpm test:coverage:changed`：仅对自 `origin/main` 以来变更的文件运行单元覆盖率。
- `pnpm test:changed`：使用 `--changed origin/main` 运行原生 Vitest projects 配置。基础配置将 projects/config 文件视为 `forceRerunTriggers`，因此当这些接线发生变化时，仍会在需要时更广泛地重新运行测试。
- `pnpm test`：直接运行原生 Vitest 根 projects 配置。文件过滤器可在已配置的 projects 间原生生效。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 运行 `vitest.extensions.config.ts`。
- `pnpm test:extensions`：运行扩展/插件测试集。
- `pnpm test:perf:imports`：为原生根 projects 运行启用 Vitest 导入耗时 + 导入明细报告。
- `pnpm test:perf:imports:changed`：同样的导入性能分析，但仅针对自 `origin/main` 以来变更的文件。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端 smoke 测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行 provider live 测试（minimax/zai）。需要 API 密钥和 `LIVE=1`（或 provider 专用的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要一个可用的 live 模型密钥（例如 `~/.profile` 中的 OpenAI），会拉取外部 Open WebUI 镜像，且不像常规单元/e2e 测试集那样预期具备 CI 稳定性。
- `pnpm test:docker:mcp-channels`：启动一个带种子数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后通过真实的 stdio 桥接验证路由对话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 + 权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该 smoke 测试反映的就是桥接实际发出的内容。

## 本地 PR 门禁

对于本地 PR 落地/门禁检查，请运行：

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上偶发失败，请先重新运行一次，再将其视为回归问题；然后使用 `pnpm test <path/to/test>` 进行定位。对于内存受限的主机，请使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准（本地密钥）

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
- `all`：同时包含这两个预设

输出包括每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出码/信号分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，从而让计时与 profile 采集使用相同的测试框架。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标 smoke 产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试集产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已纳入版本控制的基线夹具 `test/fixtures/cli-startup-bench.json`

已纳入版本控制的夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该夹具进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在进行容器化新手引导 smoke 测试时才需要。

在干净的 Linux 容器中的完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本通过伪 TTY 驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## 二维码导入 smoke 测试（Docker）

确保 `qrcode-terminal` 可在受支持的 Docker Node 运行时中加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
