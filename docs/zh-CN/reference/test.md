---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（Vitest），以及何时使用 force / coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-04-20T14:13:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03c44e5e4fab11883d9af416141d3e8013360a46b7c201ad9ac7cee5e6b3d24e
    source_path: reference/test.md
    workflow: 15
---

# 测试

- 完整测试套件（测试套件、live、Docker）：[测试](/zh-CN/help/testing)

- `pnpm test:force`：会终止任何仍占用默认控制端口的残留 Gateway 网关进程，然后使用隔离的 Gateway 网关端口运行完整的 Vitest 测试套件，以避免服务端测试与正在运行的实例发生冲突。当先前的 Gateway 网关运行导致端口 18789 仍被占用时，使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行单元测试套件（通过 `vitest.unit.config.ts`）。全局阈值为 70% 的行/分支/函数/语句覆盖率。覆盖率会排除集成较重的入口点（CLI 接线、gateway/telegram 桥接、webchat 静态服务器），以便将目标聚焦在适合单元测试的逻辑上。
- `pnpm test:coverage:changed`：仅对相较于 `origin/main` 已变更的文件运行单元测试覆盖率。
- `pnpm test:changed`：当 diff 只涉及可路由的源码/测试文件时，会将已变更的 git 路径展开为有范围限制的 Vitest 通道。配置/初始化变更仍会回退到原生根项目运行，以便在需要时更广泛地重新运行接线相关测试。
- `pnpm test`：会将显式指定的文件/目录目标路由到有范围限制的 Vitest 通道。未指定目标的运行现在会依次执行 11 个分片配置（`vitest.full-core-unit-src.config.ts`、`vitest.full-core-unit-security.config.ts`、`vitest.full-core-unit-ui.config.ts`、`vitest.full-core-unit-support.config.ts`、`vitest.full-core-support-boundary.config.ts`、`vitest.full-core-contracts.config.ts`、`vitest.full-core-bundled.config.ts`、`vitest.full-core-runtime.config.ts`、`vitest.full-agentic.config.ts`、`vitest.full-auto-reply.config.ts`、`vitest.full-extensions.config.ts`），而不是一个庞大的根项目进程。
- 部分 `plugin-sdk` 和 `commands` 测试文件现在会通过专用的轻量通道路由，这些通道只保留 `test/setup.ts`，而运行时较重的用例仍保留在现有通道中。
- 部分 `plugin-sdk` 和 `commands` 辅助源码文件也会将 `pnpm test:changed` 映射到这些轻量通道中的显式同级测试，因此小范围的辅助函数修改无需重新运行依赖重型运行时支持的测试套件。
- `auto-reply` 现在也拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply 测试框架就不会压过更轻量的顶层状态/token/辅助函数测试。
- 基础 Vitest 配置现在默认使用 `pool: "threads"` 和 `isolate: false`，并在整个仓库配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。
- `pnpm test:extensions` 运行 `vitest.extensions.config.ts`。
- `pnpm test:extensions`：运行扩展/插件测试套件。
- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入明细报告，同时仍对显式文件/目录目标使用有范围限制的通道路由。
- `pnpm test:perf:imports:changed`：与上面相同的导入性能分析，但仅针对相较于 `origin/main` 已变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`：针对同一组已提交 git diff，对路由后的 changed 模式路径与原生根项目运行进行基准对比。
- `pnpm test:perf:changed:bench -- --worktree`：无需先提交，即可对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main`：为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`：为单元测试运行器写入 CPU + 堆 profile（`.artifacts/vitest-runner-profile`）。
- Gateway 网关集成测试：通过 `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway` 选择性启用。
- `pnpm test:e2e`：运行 Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。在 `vitest.e2e.config.ts` 中默认使用 `threads` + `isolate: false` 和自适应 worker；可通过 `OPENCLAW_E2E_WORKERS=<n>` 调整，并设置 `OPENCLAW_E2E_VERBOSE=1` 以输出详细日志。
- `pnpm test:live`：运行提供商 live 测试（minimax/zai）。需要 API 密钥以及 `LIVE=1`（或提供商特定的 `*_LIVE_TEST=1`）才能取消跳过。
- `pnpm test:docker:openwebui`：启动 Docker 化的 OpenClaw + Open WebUI，通过 Open WebUI 登录，检查 `/api/models`，然后通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的 live 模型密钥（例如 `~/.profile` 中的 OpenAI 密钥），会拉取外部 Open WebUI 镜像，也不像常规单元测试 / e2e 测试套件那样以 CI 稳定为目标。
- `pnpm test:docker:mcp-channels`：启动一个已预置数据的 Gateway 网关容器和第二个客户端容器，后者会启动 `openclaw mcp serve`，然后通过真实的 stdio 桥接验证路由后的会话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及 Claude 风格的渠道和权限通知。Claude 通知断言会直接读取原始 stdio MCP 帧，因此该冒烟测试能够反映桥接实际发出的内容。

## 本地 PR gate

对于本地 PR 落地 / gate 检查，请运行：

- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现偶发失败，先重跑一次，再将其视为回归，然后用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机，可使用：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 模型延迟基准测试（本地密钥）

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
- `all`：两个预设都包含

输出会包含每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、exit-code/signal 分布，以及最大 RSS 摘要。可选的 `--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 profile，这样计时和 profile 捕获就使用同一个测试框架。

已保存输出约定：

- `pnpm test:startup:bench:smoke` 会将目标冒烟产物写入 `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` 会使用 `runs=5` 和 `warmup=1` 将完整测试套件产物写入 `.artifacts/cli-startup-bench-all.json`
- `pnpm test:startup:bench:update` 会使用 `runs=5` 和 `warmup=1` 刷新已检入的基线夹具 `test/fixtures/cli-startup-bench.json`

已检入的夹具：

- `test/fixtures/cli-startup-bench.json`
- 使用 `pnpm test:startup:bench:update` 刷新
- 使用 `pnpm test:startup:bench:check` 将当前结果与该夹具进行比较

## 新手引导 E2E（Docker）

Docker 是可选的；只有在需要容器化的新手引导冒烟测试时才需要它。

在全新的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

该脚本会通过伪终端驱动交互式向导，验证配置 / 工作区 / 会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## 二维码导入冒烟测试（Docker）

确保 `qrcode-terminal` 能在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```
