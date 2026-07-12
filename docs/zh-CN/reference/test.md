---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用强制/覆盖率模式
title: 测试
x-i18n:
    generated_at: "2026-07-11T20:58:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

## 智能体默认设置

智能体会话通过 Crabbox 远程运行测试和计算密集型验证。可信的维护者代码默认使用 Blacksmith Testbox。配置的 Testbox 工作流会注入凭据，因此不可信的贡献者代码或分支代码必须改用无密钥的分支 CI 或经过净化的直连 AWS Crabbox。

当可信代码任务可能需要测试或大量验证时，请立即在后台命令会话中预热，在注入环境期间继续工作，复用返回的 `tbx_...` ID，每次运行时同步当前检出内容，并在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

首次成功复用后，包装器会在 `.crabbox/testbox-leases/` 下记录租约的基础版本、依赖项和 Testbox 工作流指纹。仅修改源代码时会继续复用已预热的环境。如果合并基线、锁文件、包管理器输入、包装器或 Testbox 工作流发生变化，则会以失败关闭方式终止，并要求使用新租约。每次运行仍会同步当前检出内容。`OPENCLAW_TESTBOX_ALLOW_STALE=1` 仅用于有意进行的诊断，不得用于发布验证。

以下本地测试命令适用于人工工作流，或用户明确要求智能体回退到本地执行的情况。必须报告远程提供商不可用；这并不允许静默运行大范围本地检查关卡。

对于不可信代码，请使用 `--provider aws` 预热。每次运行都必须设置 `CRABBOX_ENV_ALLOW=CI`，传入 `--provider aws --no-hydrate`，并在安装依赖项或运行测试前使用全新的临时远程 `HOME`。使用专用于该不可信来源的新预热租约；绝不能复用可信租约或之前已注入环境的租约。从干净且可信的 `main` 检出中启动已安装的可信 Crabbox 二进制文件，并仅通过 `--fresh-pr` 获取远程 PR；绝不能在本地执行不可信检出中的包装器或配置。取消设置 `CRABBOX_AWS_INSTANCE_PROFILE`，除非解析后的 `aws.instanceProfile` 为空，否则以失败关闭方式终止。在执行任何安装或测试前，使用基于绝对路径的可信工具强制要求 IMDSv2 令牌，证明 IAM 凭据端点返回 404，并验证远程 `git rev-parse HEAD` 等于经过审查的完整 PR 头部 SHA。将租约绑定到该 SHA，并在头部发生变化时停止并重新预热。将干净 `main` 中可信的 `scripts/crabbox-untrusted-bootstrap.sh` 与 `--fresh-pr` 一同上传；该脚本会安装固定版本的 Node/pnpm，验证 SHA 和包管理器版本约束，隔离 `HOME`，安装依赖项，然后执行请求的测试。如果代理服务无法证明不存在角色，或不存在远程 PR，请使用无密钥的分支 CI。不要使用 `hydrate-github`、`--no-sync` 或已注入凭据的 Testbox 工作流。
取消设置所有 `CRABBOX_TAILSCALE*` 覆盖项，强制使用 `--network public --tailscale=false`，清除出口节点/LAN 标志，并要求 `crabbox inspect` 在上传任何脚本前报告公共网络且不存在 Tailscale 状态。

## 常规本地执行顺序

1. 使用 `pnpm test:changed` 执行变更范围内的 Vitest 验证。
2. 使用 `pnpm test <path-or-filter>` 测试单个文件、目录或明确目标。
3. 仅当你明确需要完整的本地 Vitest 测试套件时，才使用 `pnpm test`。

在 Codex 工作树或链接式/稀疏检出中，智能体应避免直接在本地运行 `pnpm test*` / `pnpm check*` / `pnpm crabbox:run`：

- 用户明确要求针对小型文件回退到本地运行时：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 变更检查关卡或大范围验证：`node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，以便 pnpm 在 Testbox 内运行。
- 包装器最终的 `exitCode` 和计时 JSON 即为命令结果。委托给 Blacksmith 的 GitHub Actions 运行可能会在 SSH 命令成功后显示 `cancelled`，因为 Testbox 是从保活操作外部停止的；将其视为失败前，请先检查包装器摘要和命令输出。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：对于 `pnpm check:changed` 和定向的 `pnpm test ...` 等命令，将重型检查的串行化范围限制在当前工作树内，而不是 Git 公共目录中。仅当你有意在高性能本地主机上跨多个链接工作树运行独立检查时使用。

## 核心命令

测试包装器运行结束时会显示简短的 `[test] passed|failed|skipped ... in ...` 摘要；Vitest 自身的耗时行仍作为各分片的详细信息保留。

| 命令                                              | 作用                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明确指定的文件/目录目标会通过限定范围的 Vitest 通道运行。未指定目标的运行用于完整测试套件验证：固定分片组会展开为叶级配置以便在本地并行执行，并在启动前输出预期的分片扇出。扩展组始终展开为各扩展独立的分片配置，而不是使用一个庞大的根项目进程。 |
| `pnpm test:changed`                               | 低成本的智能变更测试运行：根据直接修改的测试、同级 `*.test.ts` 文件、明确的源代码映射和本地导入图确定精确目标。除非大范围变更、配置变更或包变更能够映射到精确测试，否则会跳过它们。 |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明确执行大范围变更测试；当测试框架、配置或包编辑应回退到 Vitest 范围更广的变更测试行为时使用。 |
| `pnpm test:force`                                 | 释放已配置的 OpenClaw Gateway 网关端口（默认 `18789`），然后使用隔离的 Gateway 网关端口运行完整测试套件，避免服务器测试与正在运行的实例发生冲突。 |
| `pnpm test:coverage`                              | 为默认单元测试通道（`vitest.unit.config.ts`）生成仅供参考的 V8 覆盖率报告；不强制执行覆盖率阈值。 |
| `pnpm test:coverage:changed`                      | 仅统计自 `origin/main` 以来发生变更的文件的单元测试覆盖率。 |
| `pnpm changed:lanes`                              | 显示相对于 `origin/main` 的差异所触发的架构通道。 |
| `pnpm check:changed`                              | 在 CI 之外默认委托给 Crabbox/Testbox，然后在远程子进程中运行智能变更检查关卡：格式化，以及受影响通道的类型检查、代码检查和防护命令。不运行 Vitest；测试验证请使用 `pnpm test:changed` 或 `pnpm test <target>`。 |

## 共享测试状态和进程辅助工具

- `src/test-utils/openclaw-test-state.ts`：当 Vitest 测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置夹具、工作区、Agent 目录或身份验证配置文件存储时使用。
- `pnpm test:env-mutations:report`：生成非阻塞报告，列出直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相关环境变量键的测试/测试框架。使用它来查找适合迁移到共享测试状态辅助工具的候选项。
- `test/helpers/openclaw-test-instance.ts`：为需要运行中 Gateway 网关、CLI 环境、日志捕获和集中清理的进程级端到端测试提供统一入口。
- 引入 `scripts/lib/docker-e2e-image.sh` 的 Docker/Bash 端到端测试通道可将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并使用 `scripts/lib/openclaw-e2e-instance.sh` 对其解码；多主目录脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 会写入可通过 `source` 加载的主机环境文件（`create` 前的 `--` 可防止较新的 Node 运行时将 `--env-file` 视为 Node 标志）。启动 Gateway 网关的通道可以引入 `scripts/lib/openclaw-e2e-instance.sh`，以处理入口点解析、模拟 OpenAI 启动、前台/后台启动、就绪探测、状态环境导出、日志转储和进程清理。

## Control UI、TUI 和扩展通道

- **Control UI 模拟端到端测试：**`pnpm test:ui:e2e` 运行 Vitest + Playwright 测试通道；该通道会启动 Vite Control UI，并通过模拟的 Gateway 网关 WebSocket，使用真实 Chromium 页面执行测试。测试位于 `ui/src/**/*.e2e.test.ts`；共享模拟和控制工具位于 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此通道。智能体运行默认使用 Testbox/Crabbox，包括针对性验证；仅在明确要求本地回退时使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`。
- **TUI PTY 测试：**`node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 运行快速的模拟后端 PTY 测试通道。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local` 运行速度较慢的 `tui --local` 冒烟测试，该测试仅模拟外部模型端点。应断言稳定的可见文本或固件调用，而不是原始 ANSI 快照。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。大型渠道插件、浏览器插件和 OpenAI 作为专用分片运行；其他插件组仍批量运行。`pnpm test extensions/<id>` 运行单个内置插件测试通道。
- 带有同级测试的源文件会先映射到相应的同级测试，然后才回退到范围更广的目录 glob。编辑 `src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的辅助工具时，如果依赖路径明确，则使用本地导入图运行导入这些工具的测试，而不是宽泛运行所有分片。
- 契约目录目标会分发到各自的契约测试通道：`pnpm test src/channels/plugins/contracts` 运行四个渠道契约配置，`pnpm test src/plugins/contracts` 运行插件契约配置，因为通用 `channels`/`plugins` 项目会排除 `contracts/**`。
- `auto-reply` 拆分为三个专用配置（`core`、`top-level`、`reply`），以免回复测试框架拖慢较轻量的顶层状态、令牌和辅助工具测试。
- 部分 `plugin-sdk` 和 `commands` 测试文件通过专用轻量测试通道运行，这些通道仅保留 `test/setup.ts`；运行时负载较高的用例仍使用其现有测试通道。
- Vitest 基础配置默认为 `pool: "threads"` 和 `isolate: false`，并在整个仓库的配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。

## Gateway 网关和端到端测试

- Gateway 网关集成测试需显式启用：`OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway`。
- `pnpm test:e2e`：仓库端到端测试汇总 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`：Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应工作进程；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整工作进程数，使用 `OPENCLAW_E2E_VERBOSE=1` 启用详细日志。
- `pnpm test:live`：提供商实时测试（Claude/Minimax/DeepSeek/z.ai 等，由 `*.live.test.ts` 控制）。需要 API 密钥以及 `LIVE=1`（或 `OPENCLAW_LIVE_TEST=1`）才能取消跳过；使用 `OPENCLAW_LIVE_TEST_QUIET=0` 启用详细输出。

## 完整 Docker 测试套件（`pnpm test:docker:all`）

构建共享实时测试镜像，将 OpenClaw 一次性打包为 npm tarball，构建或复用一个基础 Node/Git 运行器镜像以及一个将该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器运行 Docker 冒烟测试通道。`scripts/package-openclaw-for-docker.mjs` 是本地和 CI 共用的唯一软件包打包器，会在 Docker 使用 tarball 前验证该 tarball 和 `dist/postinstall-inventory.json`。

- 基础镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）：安装器、更新和插件依赖测试通道；挂载预构建的 tarball，而不是复制仓库源代码。
- 功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）：常规已构建应用功能测试通道。
- 测试通道定义：`scripts/lib/docker-e2e-scenarios.mjs`。规划器：`scripts/lib/docker-e2e-plan.mjs`。执行器：`scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` 输出由调度器管理的 CI 计划（测试通道、镜像类型、软件包/实时镜像需求、状态场景、凭据检查），而不构建或运行 Docker。

调度参数（环境变量，括号内为默认值）：

| 环境变量                                                                                                        | 默认值              | 用途                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | 进程槽位数。                                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | 提供商敏感型尾部任务池。                                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 大型实时提供商测试通道上限。                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm 资源测试通道上限。                                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | 服务资源测试通道上限。                                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | 各提供商大型测试通道上限。                                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | 范围更窄的各提供商上限。                                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | 用于较大型主机的覆盖值。                                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | 测试通道启动之间的延迟，用于避免本地 Docker 守护进程集中创建资源。                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000（120 分钟） | 每个测试通道的回退超时时间；部分实时/尾部测试通道使用更严格的上限。                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 实时提供商暂时性故障的重试次数。                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | 关闭                | 输出测试通道清单，但不运行 Docker。                                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | 活跃测试通道状态的输出间隔。                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | 开启                | 复用 `.artifacts/docker-tests/lane-timings.json`，按耗时从长到短排序；设为 `0` 可禁用。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` 表示仅运行确定性/本地测试通道，`only` 表示仅运行实时提供商测试通道。别名：`pnpm test:docker:local:all`、`pnpm test:docker:live:all`。仅实时模式会将主要和尾部实时测试通道合并到一个按耗时从长到短排序的任务池中，使提供商分组能够将 Claude/Codex/Gemini 工作集中调度。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI 后端 Docker 设置超时时间。                                                                                                                                                                                                                                                                                                                         |

资源上限的环境变量模式为 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`（资源名称转换为大写，非字母数字字符折叠为 `_`）。

其他行为：运行器默认会预检 Docker，清理残留的 OpenClaw E2E 容器，在兼容的通道之间共享提供商 CLI 工具缓存，并且在首次失败后停止调度新的池化通道，除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`。如果某个通道在低并行度主机上超出有效权重/资源上限，它仍可从空池启动并独占运行，直到释放容量。每通道日志、`summary.json`、`failures.json` 和阶段耗时会写入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 检查较慢的通道，并使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 输出开销较低的定向重运行命令。

### 值得关注的 Docker 通道

| 命令                                                                        | 验证内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | 基于 Chromium 的源码 E2E 容器，使用原始 CDP 和隔离的 Gateway 网关；`browser doctor --deep` 的 CDP 角色快照包含链接 URL、由光标提升为可点击项的元素、iframe 引用和帧元数据。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:skill-install`                                            | 在纯净的 Docker 运行器中使用 `skills.install.allowUploadedArchives: false` 安装打包后的 tarball，通过实时 ClawHub 搜索解析当前的技能 slug，使用 `openclaw skills install` 安装，并验证 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 针对 CLI 后端的实时探测；Gemini 提供对应的 `:resume` 和 `:mcp` 别名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `pnpm test:docker:openwebui`                                                | Docker 化的 OpenClaw + Open WebUI：登录、检查 `/api/models`，并通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型密钥，并会拉取外部镜像；不应期望其像单元/E2E 测试套件一样在 CI 中保持稳定。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:docker:mcp-channels`                                             | 预置数据的 Gateway 网关容器，加上一个生成 `openclaw mcp serve` 的客户端容器：验证路由后的会话发现、对话记录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio 桥接传输的 Claude 风格渠道和权限通知（断言直接读取原始 stdio MCP 帧）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `pnpm test:docker:upgrade-survivor`                                         | 在包含脏数据的旧用户夹具上安装打包后的 tarball，在没有实时提供商/渠道密钥的情况下运行软件包更新和非交互式 Doctor，启动 local loopback Gateway 网关，并检查智能体、渠道配置、插件允许列表、工作区、会话文件、残留的旧版插件依赖状态、启动和 RPC 状态能否保留。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:published-upgrade-survivor`                               | 默认安装 `openclaw@latest`，预置真实的现有用户文件，通过内置的 `openclaw config set` 配方进行配置，更新至打包后的 tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，并检查 `/healthz`、`/readyz` 和 RPC 状态。可通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖基线，通过 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展矩阵，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景夹具（包括 `configured-plugin-installs` 和 `stale-source-plugin-shadow`）。Package Acceptance 将其公开为 `published_upgrade_survivor_baseline(s)` / `_scenarios`，并解析 `last-stable-4` 或 `all-since-2026.4.23` 等元标记。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` 场景中的已发布版本升级存活验证框架，默认从 `openclaw@2026.4.23` 开始。`Update Migration` 工作流通过 `baselines=all-since-2026.4.23` 扩展此验证，以证明 Full Release CI 之外的已配置插件依赖清理。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:plugins`                                                  | 对本地路径、`file:`、带提升依赖的 npm 注册表软件包、Git 浮动引用、ClawHub 夹具、市场更新以及 Claude 软件包启用/检查执行安装/更新冒烟测试。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## 本地 PR 门禁

对于本地 PR 合入/门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上出现偶发失败，请先重运行一次，再将其视为回归；然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 测试性能工具

- `pnpm test:perf:imports`：启用 Vitest 导入耗时和导入明细报告，同时仍对显式文件/目录目标使用限定范围的测试通道路由。`pnpm test:perf:imports:changed` 将相同的性能分析限定到自 `origin/main` 以来发生变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 针对同一已提交的 git 差异，对比测试经路由的变更模式路径与原生根项目运行的性能；`pnpm test:perf:changed:bench -- --worktree` 无需先提交，即可对当前工作树变更集进行性能测试。
- `pnpm test:perf:profile:main` 为 Vitest 主线程写入 CPU 性能分析文件（`.artifacts/vitest-main-profile`）；`pnpm test:perf:profile:runner` 为单元测试运行器写入 CPU 和堆性能分析文件（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行完整测试套件中的每个 Vitest 叶级配置，并写入分组耗时数据以及每个配置对应的 JSON/日志产物。完整测试套件报告默认隔离文件，因此不会将先前文件保留的模块图和 GC 暂停时间计入后续断言；只有在有意分析共享工作进程的累积情况时，才传入 `-- --no-isolate`。测试性能智能体在尝试修复慢速测试前使用此项作为基线。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` 用于比较性能优化变更后的分组报告。
- 完整、插件和包含模式的分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续完整配置运行会使用这些计时数据来平衡快慢分片。包含模式的 CI 分片会将分片名称追加到计时键中，从而在不替换完整配置计时数据的情况下保留筛选后分片的计时信息。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时产物。

## 基准测试

<Accordion title="模型延迟（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。默认提示词：“仅回复一个单词：ok。不要使用标点或添加额外文本。”

</Accordion>

<Accordion title="CLI 启动（scripts/bench-cli-startup.ts）">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：合并两个预设

输出包括每条命令的 `sampleCount`、平均值、p50、p95、最小值/最大值、退出代码/信号分布以及最大 RSS。`--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 性能分析文件。

保存的输出：`pnpm test:startup:bench:smoke` 写入 `.artifacts/cli-startup-bench-smoke.json`；`pnpm test:startup:bench:save` 写入 `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）。检入仓库的固件：`test/fixtures/cli-startup-bench.json`，由 `pnpm test:startup:bench:update` 刷新，并由 `pnpm test:startup:bench:check` 比较。

</Accordion>

<Accordion title="Gateway 网关启动（scripts/bench-gateway-startup.ts）">

默认使用 `dist/entry.js` 中已构建的 CLI 入口；请先运行 `pnpm build`。传入 `--entry scripts/run-node.mjs` 可改为测量源代码运行器，并应将这些结果与已构建入口的基线分开保存。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

用例 ID：`default`、`skipChannels`（跳过渠道启动）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 个清单插件）、`fiftyStartupLazyPlugins`（50 个启动时延迟加载的清单插件）。

输出包括首次进程输出、`/healthz`、`/readyz`、HTTP 监听日志时间、Gateway 网关就绪日志时间、CPU 时间、CPU 核心占用比、最大 RSS、堆、启动追踪指标、事件循环延迟，以及插件查找表的详细指标。该脚本会在子 Gateway 网关环境中设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

`/healthz` 表示存活状态（HTTP 服务器可以响应）。`/readyz` 表示可用就绪状态（启动插件的 sidecar、渠道以及附加后对就绪至关重要的工作均已稳定）。启动钩子采用异步分派，不属于就绪保证的一部分。就绪日志时间是 Gateway 网关的内部时间戳，可用于进程侧归因，但不能替代外部 `/readyz` 探测。

比较变更时，请使用 JSON 输出或 `--output`。只有当追踪输出指向导入、编译或仅靠阶段计时无法解释的 CPU 密集型工作时，才使用 `--cpu-prof-dir`。

</Accordion>

<Accordion title="Gateway 网关重启（scripts/bench-gateway-restart.ts）">

仅支持 macOS 和 Linux（使用 SIGUSR1 进行进程内重启；在 Windows 上会立即失败）。与上述 Gateway 网关启动相同，默认使用已构建入口，也可通过 `--entry scripts/run-node.mjs` 覆盖。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

用例 ID：`skipChannels`、`skipChannelsAcpxProbe`（启用 ACPX 启动探测）、`skipChannelsNoAcpxProbe`（关闭探测）、`default`、`fiftyPlugins`。

输出包括下一次 `/healthz`、下一次 `/readyz`、停机时间、重启就绪计时、CPU、RSS、替代进程的启动追踪指标，以及信号处理、活动工作排空、关闭阶段、下一次启动、就绪计时和内存快照的重启追踪指标。该脚本会设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 和 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

当变更涉及重启信号、关闭处理程序、重启后启动、sidecar 关闭、服务交接或重启后的就绪状态时，请使用此基准测试。先使用 `skipChannels`，将 Gateway 网关机制与渠道启动隔离；只有在窄范围用例能够解释重启路径后，才使用 `default` 或插件密集型用例。追踪指标仅提供归因线索，并非结论依据——评估重启变更时，应综合多个样本、对应的所有者区段、`/healthz`/`/readyz` 行为以及用户可见的重启契约。

</Accordion>

## 新手引导端到端测试（Docker）

可选；仅容器化新手引导冒烟测试需要。在干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## 二维码导入冒烟测试（Docker）

确保维护的二维码运行时辅助程序可在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)
